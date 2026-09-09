// MedConnect - платформа для онлайн-консультаций с врачами (чат, видео, оплата).
// Лабораторная работа №1: REST API на Node.js + Express.
// Данные хранятся во временном массиве в памяти приложения (без базы данных).

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Временное хранилище консультаций (заменяется базой данных в лабораторной работе №2)
let consultations = [
  {
    id: 1,
    doctorName: 'Анна Ковалевская',
    specialty: 'Кардиолог',
    patientName: 'Иван Петров',
    date: '2026-09-10',
    startTime: '09:00',
    endTime: '09:30',
    format: 'video',
    price: 45,
    status: 'planned',
  },
  {
    id: 2,
    doctorName: 'Сергей Дубовик',
    specialty: 'Терапевт',
    patientName: 'Мария Сидорова',
    date: '2026-09-10',
    startTime: '11:00',
    endTime: '11:20',
    format: 'chat',
    price: 25,
    status: 'planned',
  },
  {
    id: 3,
    doctorName: 'Ольга Радевич',
    specialty: 'Дерматолог',
    patientName: 'Алексей Морозов',
    date: '2026-09-11',
    startTime: '14:00',
    endTime: '14:45',
    format: 'video',
    price: 60,
    status: 'completed',
  },
];

let nextId = 4;

const REQUIRED_FIELDS = [
  'doctorName',
  'specialty',
  'patientName',
  'date',
  'startTime',
  'endTime',
  'format',
];
const FORMATS = ['chat', 'video'];
const STATUSES = ['planned', 'completed', 'cancelled'];

// Разбор и проверка идентификатора из параметров маршрута
function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

// Проверка тела запроса на наличие и корректность обязательных полей
function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }

  if (!FORMATS.includes(body.format)) {
    return `Field "format" must be one of: ${FORMATS.join(', ')}`;
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return `Field "status" must be one of: ${STATUSES.join(', ')}`;
  }
  if (body.price !== undefined && (Number.isNaN(Number(body.price)) || Number(body.price) < 0)) {
    return 'Field "price" must be a non-negative number';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return 'Field "date" must use the YYYY-MM-DD format';
  }
  if (!/^\d{2}:\d{2}$/.test(body.startTime) || !/^\d{2}:\d{2}$/.test(body.endTime)) {
    return 'Fields "startTime" and "endTime" must use the HH:MM format';
  }
  if (body.startTime >= body.endTime) {
    return 'Field "startTime" must be earlier than "endTime"';
  }

  return null;
}

const router = express.Router();

// Служебный маршрут проверки работоспособности сервера
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MedConnect API', consultations: consultations.length });
});

// GET /consultations - получение списка всех консультаций
router.get('/consultations', (req, res) => {
  res.status(200).json(consultations);
});

// GET /consultations/:id - получение одной консультации по идентификатору
router.get('/consultations/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Consultation id must be a positive integer' });
  }

  const consultation = consultations.find((item) => item.id === id);
  if (!consultation) {
    return res.status(404).json({ error: 'Consultation not found' });
  }

  return res.status(200).json(consultation);
});

// POST /consultations - создание новой консультации
router.post('/consultations', (req, res) => {
  const error = validateBody(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const consultation = {
    id: nextId++,
    doctorName: req.body.doctorName,
    specialty: req.body.specialty,
    patientName: req.body.patientName,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    format: req.body.format,
    price: req.body.price !== undefined ? Number(req.body.price) : 0,
    status: req.body.status || 'planned',
  };

  consultations.push(consultation);
  return res.status(201).json(consultation);
});

// PUT /consultations/:id - полное обновление консультации
router.put('/consultations/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Consultation id must be a positive integer' });
  }

  const index = consultations.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Consultation not found' });
  }

  const error = validateBody(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  consultations[index] = {
    id,
    doctorName: req.body.doctorName,
    specialty: req.body.specialty,
    patientName: req.body.patientName,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    format: req.body.format,
    price: req.body.price !== undefined ? Number(req.body.price) : 0,
    status: req.body.status || 'planned',
  };

  return res.status(200).json(consultations[index]);
});

// DELETE /consultations/:id - удаление консультации
router.delete('/consultations/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Consultation id must be a positive integer' });
  }

  const index = consultations.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Consultation not found' });
  }

  consultations.splice(index, 1);
  return res.status(204).send();
});

// Маршруты доступны и напрямую, и с префиксом /api (используется клиентом в ЛР №5)
app.use('/', router);
app.use('/api', router);

// Обращение к неизвестному маршруту
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Request body contains invalid JSON' });
  }
  console.error('Unexpected server error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`MedConnect API server is listening on http://localhost:${PORT}`);
});

module.exports = app;
