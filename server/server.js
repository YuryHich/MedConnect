// MedConnect - платформа для онлайн-консультаций с врачами (чат, видео, оплата).
// Лабораторная работа №3: аутентификация по JWT и ролевая модель доступа (RBAC).

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { sequelize, User } = require('./models');
const { authenticate } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const consultationsRouter = require('./routes/consultations');
const doctorsRouter = require('./routes/doctors');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS нужен клиентскому React-приложению, работающему с другого origin
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
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

// GET /profile - защищённый маршрут с данными текущего пользователя
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ association: 'consultations' }],
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      ...user.toPublicJSON(),
      consultationsCount: user.consultations.length,
      consultations: user.consultations,
    });
  } catch (err) {
    return next(err);
  }
});

router.use('/auth', authRouter);
router.use('/consultations', consultationsRouter);
router.use('/doctors', doctorsRouter);
router.use('/users', usersRouter);

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
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set: authentication will not work. Check the .env file.');
  }

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
