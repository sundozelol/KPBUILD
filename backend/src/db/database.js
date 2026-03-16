const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  charset: 'utf8mb4',
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

async function execute(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return { changes: result.affectedRows };
}

async function transaction(fn) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const connHelper = {
      query: (sql, params = []) => conn.query(sql, params),
    };
    const result = await fn(connHelper);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Parse JSON fields in a row object */
function parseRow(row, jsonFields = []) {
  if (!row) return null;
  const result = { ...row };
  for (const field of jsonFields) {
    if (result[field] && typeof result[field] === 'string') {
      try { result[field] = JSON.parse(result[field]); }
      catch { result[field] = field.endsWith('s') ? [] : {}; }
    }
  }
  // Convert MySQL integers to booleans where needed
  if ('is_active' in result) result.is_active = Boolean(result.is_active);
  if ('sync_price_from_feed' in result) result.sync_price_from_feed = Boolean(result.sync_price_from_feed);
  if ('public_enabled' in result) result.public_enabled = Boolean(result.public_enabled);
  return result;
}

function parseRows(rows, jsonFields = []) {
  return rows.map(r => parseRow(r, jsonFields));
}

// ─── Schema ────────────────────────────────────────────────────────────────────

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) DEFAULT '',
      role VARCHAR(50) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS proposals (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(500) DEFAULT 'Новое КП',
      status VARCHAR(50) DEFAULT 'draft',
      blocks LONGTEXT,
      theme TEXT,
      total_amount DOUBLE DEFAULT 0,
      client_name VARCHAR(500) DEFAULT '',
      client_company VARCHAR(500) DEFAULT '',
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      public_token VARCHAR(36),
      public_enabled TINYINT(1) DEFAULT 0,
      download_count INT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(500) NOT NULL,
      sku VARCHAR(255),
      price DOUBLE DEFAULT 0,
      price2 DOUBLE,
      price3 DOUBLE,
      image_url VARCHAR(1000),
      category VARCHAR(255) DEFAULT '',
      description TEXT,
      unit VARCHAR(50) DEFAULT 'шт',
      sync_price_from_feed TINYINT(1) DEFAULT 0,
      feed_id VARCHAR(36),
      external_id VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_profiles (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) UNIQUE NOT NULL,
      company_name VARCHAR(500) DEFAULT '',
      logo_url VARCHAR(1000) DEFAULT '',
      address TEXT,
      phone VARCHAR(100) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      website VARCHAR(500) DEFAULT '',
      inn VARCHAR(50) DEFAULT '',
      kpp VARCHAR(50) DEFAULT '',
      bank_details TEXT,
      auto_sync_enabled TINYINT(1) DEFAULT 0,
      auto_sync_interval INT DEFAULT 120,
      last_auto_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS xml_feeds (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(1000) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      default_category VARCHAR(255) DEFAULT '',
      last_synced DATETIME,
      last_result VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      note VARCHAR(500) DEFAULT '',
      role VARCHAR(50) DEFAULT 'manager',
      used_by_email VARCHAR(255),
      used_at DATETIME,
      created_by VARCHAR(36) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS proposal_templates (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(500) NOT NULL,
      description TEXT,
      category VARCHAR(100) DEFAULT 'custom',
      blocks LONGTEXT,
      theme TEXT,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type VARCHAR(20) DEFAULT 'manual',
      status VARCHAR(20) DEFAULT 'ok',
      updated INT DEFAULT 0,
      feeds_count INT DEFAULT 0,
      detail LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS proposal_views (
      id VARCHAR(36) PRIMARY KEY,
      proposal_id VARCHAR(36) NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip VARCHAR(100) DEFAULT '',
      user_agent VARCHAR(1000) DEFAULT '',
      duration_seconds INT DEFAULT 0,
      page_stats TEXT,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
    )
  `);

  // Startup migrations
  try {
    await pool.query("UPDATE users SET role = 'manager' WHERE role = 'user'");
  } catch (e) { console.error('[DB] Migration error (role update):', e.message); }

  try {
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'sundoze87@gmail.com'");
  } catch (e) { console.error('[DB] Migration error (admin update):', e.message); }

  try {
    const [rows] = await pool.query("SELECT email, role FROM users WHERE email = 'sundoze87@gmail.com'");
    if (rows[0]) console.log(`[DB] ${rows[0].email} → role: ${rows[0].role}`);
  } catch (e) { console.error('[DB] Admin check error:', e.message); }

  console.log('[DB] Schema initialized');
}

const ready = initSchema().catch(err => {
  console.error('[DB] Schema init failed:', err);
  throw err;
});

module.exports = { query, queryOne, execute, transaction, parseRow, parseRows, ready };
