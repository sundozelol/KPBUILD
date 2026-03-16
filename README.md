# КП Генератор — Standalone

Генератор коммерческих предложений. Полностью автономный, без Base44.

## Стек

- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, SQLite
- **Авторизация**: JWT (мультипользовательский)
- **PDF**: Puppeteer (серверный, pixel-perfect)
- **XML/YML импорт**: fast-xml-parser

---

## Быстрый старт

### 1. Бэкенд

```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env — смените JWT_SECRET!
npm run dev
```

Бэкенд: `http://localhost:3001`

### 2. Фронтенд

```bash
# В корне проекта
npm install
npm run dev
```

Откройте `http://localhost:5173`, зарегистрируйтесь.

---

## Продакшн

```bash
npm run build          # Собрать фронтенд в /dist
cd backend && npm start  # Запустить (раздаёт статику + API)
```

Приложение на `http://localhost:3001`

---

## Структура

```
kp-generator/
├── backend/
│   ├── src/index.js          # Express сервер
│   ├── src/db/database.js    # SQLite схема
│   ├── src/routes/           # API: auth, proposals, products...
│   ├── src/services/         # xmlImport, pdfExport, priceSync
│   ├── uploads/              # Загруженные изображения
│   ├── data/                 # SQLite база (kp-generator.db)
│   └── .env
└── src/
    ├── api/apiClient.js      # HTTP клиент (замена base44)
    ├── lib/AuthContext.jsx   # JWT авторизация
    └── pages/                # Proposals, ProposalEditor, Products, Settings
```

## Бэкап

Скопируйте: `backend/data/kp-generator.db` + `backend/uploads/`
