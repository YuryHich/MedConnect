// MedConnect - платформа для онлайн-консультаций с врачами (чат, видео, оплата).
// Лабораторная работа №7: поверх REST API поднимается Socket.IO для чата
// консультации в реальном времени. История сообщений хранится в MongoDB.

require('dotenv').config();

const http = require('http');
const cors = require('cors');
const express = require('express');
const { Server } = require('socket.io');
const { sequelize, User } = require('./models');
const { authenticate } = require('./middleware/auth');
const { connectMongo, isMongoConnected, MONGO_URI } = require('./mongo/connection');
const { attachChat } = require('./sockets/chat');
const authRouter = require('./routes/auth');
const consultationsRouter = require('./routes/consultations');
const doctorsRouter = require('./routes/doctors');
const messagesRouter = require('./routes/messages');
const mongoDoctorsRouter = require('./routes/mongoDoctors');
const usersRouter = require('./routes/users');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
});
attachChat(io);

// CORS нужен клиентскому React-приложению, работающему с другого origin
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const router = express.Router();

// Служебный маршрут проверки работоспособности сервера и соединения с БД
router.get('/health', async (req, res) => {
  const mongo = isMongoConnected() ? 'connected' : 'disconnected';
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      service: 'MedConnect API',
      database: 'connected',
      mongo,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error', database: 'disconnected', mongo, error: err.message,
    });
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
router.use('/messages', messagesRouter);
// документная реализация того же раздела каталога врачей
router.use('/mongo/doctors', mongoDoctorsRouter);

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
  // Ошибки Mongoose: нарушение схемы и некорректное приведение типа
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: Object.values(err.errors).map((e) => e.message).join('; '),
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for field "${err.path}"` });
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

  console.log('Connecting to MongoDB:', MONGO_URI);
  await connectMongo();

  httpServer.listen(PORT, () => {
    console.log(`MedConnect API server is listening on http://localhost:${PORT}`);
    console.log('Socket.IO chat is attached (rooms consultation:<id>)');
  });
}

start();

module.exports = { app, httpServer, io };
