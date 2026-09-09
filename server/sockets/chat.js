// Real-time чат консультации на Socket.IO.
// Комната consultation:<id> объединяет пациента и врача одной записи.
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const Message = require('../mongo/models/Message');

const ROOM = (id) => `consultation:${id}`;
const MAX_TEXT = 1000;
const RATE_WINDOW_MS = 10000;
const RATE_MAX = 8;
const HISTORY_LIMIT = 50;

function extractHandshakeToken(socket) {
  const fromAuth = socket.handshake.auth?.token;
  if (fromAuth) return fromAuth;
  const header = socket.handshake.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (token && scheme.toLowerCase() === 'bearer') return token;
  return socket.handshake.query?.token || null;
}

function publicUser(user) {
  return {
    id: String(user.id),
    email: user.email,
    fullName: user.fullName || user.email,
    role: user.role,
  };
}

function allowMessage(buckets, socketId) {
  const now = Date.now();
  const recent = (buckets.get(socketId) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    buckets.set(socketId, recent);
    return false;
  }
  recent.push(now);
  buckets.set(socketId, recent);
  return true;
}

function attachChat(io) {
  const rateBuckets = new Map();

  // JWT проверяется на handshake: без валидного токена сокет не подключается
  io.use(async (socket, next) => {
    try {
      const token = extractHandshakeToken(socket);
      if (!token) {
        return next(new Error('AUTH_REQUIRED'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return next(new Error('USER_NOT_FOUND'));
      }
      socket.user = publicUser(user);
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('TOKEN_EXPIRED'));
      }
      return next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`socket connected ${socket.id} user=${socket.user.email}`);

    socket.on('join', async (payload, ack) => {
      const consultationId = String(payload?.consultationId || '');
      if (!consultationId) {
        if (typeof ack === 'function') ack({ ok: false, error: 'consultationId is required' });
        return;
      }

      const room = ROOM(consultationId);
      await socket.join(room);
      socket.data.consultationId = consultationId;

      const history = await Message.history(consultationId, HISTORY_LIMIT);
      const members = [...(io.sockets.adapter.rooms.get(room) || [])]
        .map((id) => io.sockets.sockets.get(id)?.user)
        .filter(Boolean);

      socket.to(room).emit('chat:system', {
        kind: 'system',
        text: `${socket.user.fullName} подключился к консультации`,
        createdAt: new Date().toISOString(),
      });
      io.to(room).emit('chat:members', members);

      if (typeof ack === 'function') {
        ack({ ok: true, history, members });
      }
    });

    socket.on('leave', async (payload) => {
      const consultationId = String(payload?.consultationId || socket.data.consultationId || '');
      if (!consultationId) return;
      const room = ROOM(consultationId);
      socket.to(room).emit('chat:system', {
        kind: 'system',
        text: `${socket.user.fullName} покинул консультацию`,
        createdAt: new Date().toISOString(),
      });
      await socket.leave(room);
      socket.data.consultationId = null;
    });

    socket.on('chat:typing', (payload) => {
      const consultationId = String(payload?.consultationId || socket.data.consultationId || '');
      if (!consultationId) return;
      socket.to(ROOM(consultationId)).emit('chat:typing', {
        userId: socket.user.id,
        fullName: socket.user.fullName,
        isTyping: Boolean(payload?.isTyping),
      });
    });

    socket.on('chat:message', async (payload, ack) => {
      const consultationId = String(payload?.consultationId || socket.data.consultationId || '');
      const text = String(payload?.text || '').trim();

      const fail = (error) => {
        if (typeof ack === 'function') ack({ ok: false, error });
      };

      if (!consultationId) return fail('consultationId is required');
      if (!text) return fail('Message text is required');
      if (text.length > MAX_TEXT) return fail(`Message is longer than ${MAX_TEXT} characters`);
      if (!allowMessage(rateBuckets, socket.id)) {
        return fail('Too many messages, please slow down');
      }

      try {
        const saved = await Message.create({
          consultationId,
          senderId: socket.user.id,
          senderName: socket.user.fullName,
          senderRole: socket.user.role,
          text,
          kind: 'user',
        });

        const message = {
          _id: saved._id,
          consultationId: saved.consultationId,
          senderId: saved.senderId,
          senderName: saved.senderName,
          senderRole: saved.senderRole,
          text: saved.text,
          kind: saved.kind,
          createdAt: saved.createdAt,
        };

        io.to(ROOM(consultationId)).emit('chat:message', message);
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        fail(err.message);
      }
    });

    socket.on('disconnect', () => {
      const consultationId = socket.data.consultationId;
      rateBuckets.delete(socket.id);
      console.log(`socket disconnected ${socket.id} user=${socket.user.email}`);
      if (!consultationId) return;
      socket.to(ROOM(consultationId)).emit('chat:system', {
        kind: 'system',
        text: `${socket.user.fullName} отключился`,
        createdAt: new Date().toISOString(),
      });
    });
  });
}

module.exports = { attachChat, ROOM };
