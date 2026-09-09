// История чата консультации (MongoDB). Основной обмен идёт через Socket.IO,
// этот REST-маршрут нужен для проверки истории без подключения сокета.
const express = require('express');
const Message = require('../mongo/models/Message');
const { authenticate } = require('../middleware/auth');
const { badRequest } = require('../utils/http');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const consultationId = req.query.consultationId;
    if (!consultationId) {
      return badRequest(res, 'Query parameter "consultationId" is required');
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const items = await Message.history(String(consultationId), limit);
    return res.status(200).json({ items, total: items.length });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
