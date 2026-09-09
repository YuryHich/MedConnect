// MedConnect - платформа для онлайн-консультаций с врачами (чат, видео, оплата).
// Лабораторная работа №2: данные хранятся в PostgreSQL, доступ через ORM Sequelize.

require('dotenv').config();

const express = require('express');
const { sequelize } = require('./models');
const consultationsRouter = require('./routes/consultations');
const doctorsRouter = require('./routes/doctors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const router = express.Router();

// Служебный маршрут проверки работоспособности сервера и соединения с БД
router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', service: 'MedConnect API', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

router.use('/consultations', consultationsRouter);
router.use('/doctors', doctorsRouter);

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
  // Ошибки валидации и уникальности, приходящие из Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors.map((e) => e.message).join('; ') });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Record with the same unique field already exists' });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  console.error('Unexpected server error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully');
  } catch (err) {
    console.error('Unable to connect to PostgreSQL:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`MedConnect API server is listening on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
