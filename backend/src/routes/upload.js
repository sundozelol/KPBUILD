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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Разрешены только изображения (jpg, png, gif, webp, svg)'));
  }
});

// POST /api/upload/image
router.post('/image', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не передан' });

  const port = process.env.PORT || 3001;
  const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.json({ file_url: fileUrl, filename: req.file.filename });
});

// POST /api/upload/from-url — download and save image from external URL
router.post('/from-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL обязателен' });

  try {
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png'
      : contentType.includes('gif') ? '.gif'
      : contentType.includes('webp') ? '.webp'
      : '.jpg';

    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(response.data));

    const port = process.env.PORT || 3001;
    res.json({ file_url: `http://localhost:${port}/uploads/${filename}`, filename });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось загрузить изображение: ' + err.message });
  }
});

module.exports = router;
