const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Memory storage — we process before saving
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Разрешены только изображения (jpg, png, gif, webp, svg)'));
  }
});

async function compressAndSave(buffer, mimetype) {
  let sharp;
  try { sharp = require('sharp'); } catch (e) { sharp = null; }

  const filename = `${uuidv4()}.webp`;
  const filepath = path.join(UPLOADS_DIR, filename);

  if (sharp && !mimetype.includes('svg') && !mimetype.includes('gif')) {
    const compressed = await sharp(buffer)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    fs.writeFileSync(filepath, compressed);
  } else {
    const ext = mimetype.includes('svg') ? '.svg' : mimetype.includes('gif') ? '.gif' : '.jpg';
    const fname = `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, fname), buffer);
    return fname;
  }

  return filename;
}

// POST /api/upload/image
router.post('/image', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не передан' });

  try {
    const filename = await compressAndSave(req.file.buffer, req.file.mimetype);
    const host = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    res.json({ file_url: `${host}/uploads/${filename}`, filename });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обработки файла: ' + err.message });
  }
});

// POST /api/upload/from-url — download and save image from external URL
router.post('/from-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL обязателен' });

  try {
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const contentType = response.headers['content-type'] || 'image/jpeg';

    const filename = await compressAndSave(Buffer.from(response.data), contentType);
    const host = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    res.json({ file_url: `${host}/uploads/${filename}`, filename });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось загрузить изображение: ' + err.message });
  }
});

module.exports = router;
