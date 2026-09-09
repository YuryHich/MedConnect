// Маршруты консультаций из лабораторной работы №1. Логика работы с временным
// массивом заменена на вызовы методов Sequelize (ЛР №2), а доступ ограничен
// аутентификацией и ролевой моделью (ЛР №3).
const express = require('express');
const { Consultation, Doctor, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { parseId, badRequest } = require('../utils/http');

const router = express.Router();

// Все операции с консультациями требуют аутентификации: это медицинские данные
router.use(authenticate);

const REQUIRED_FIELDS = ['doctorId', 'patientName', 'date', 'startTime', 'endTime', 'format'];

const INCLUDE_RELATIONS = [
  {
    model: Doctor,
    as: 'doctor',
    attributes: ['id', 'fullName', 'specialty', 'pricePerHour', 'rating'],
  },
  {
    model: User,
    as: 'patient',
    attributes: ['id', 'email', 'fullName', 'role'],
  },
];

function collectPayload(body) {
  return {
    doctorId: Number(body.doctorId),
    patientName: body.patientName,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    format: body.format,
    status: body.status || 'planned',
    price: body.price !== undefined ? Number(body.price) : 0,
  };
}

function missingFields(body) {
  return REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

// Пациент работает только со своими записями, врач и администратор - со всеми
function isOwnerOrStaff(req, consultation) {
  if (req.user.role === 'admin' || req.user.role === 'doctor') return true;
  return consultation.userId === req.user.id;
}

// GET /consultations - список консультаций
router.get('/', async (req, res, next) => {
  try {
    const where = req.user.role === 'patient' ? { userId: req.user.id } : {};
    const consultations = await Consultation.findAll({
      where,
      include: INCLUDE_RELATIONS,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
    res.status(200).json(consultations);
  } catch (err) {
    next(err);
  }
});

// GET /consultations/:id - получение консультации по идентификатору
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'Consultation id must be a positive integer');
    }

    const consultation = await Consultation.findByPk(id, { include: INCLUDE_RELATIONS });
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    if (!isOwnerOrStaff(req, consultation)) {
      return res.status(403).json({ error: 'Access denied: consultation belongs to another user' });
    }
    return res.status(200).json(consultation);
  } catch (err) {
    return next(err);
  }
});

// POST /consultations - создание новой консультации
router.post('/', async (req, res, next) => {
  try {
    const missing = missingFields(req.body || {});
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`);
    }

    const doctor = await Doctor.findByPk(Number(req.body.doctorId));
    if (!doctor) {
      return badRequest(res, `Doctor with id ${req.body.doctorId} does not exist`);
    }

    const created = await Consultation.create({
      ...collectPayload(req.body),
      // владелец записи берётся из токена, а не из тела запроса
      userId: req.user.id,
    });
    const consultation = await Consultation.findByPk(created.id, { include: INCLUDE_RELATIONS });
    return res.status(201).json(consultation);
  } catch (err) {
    return next(err);
  }
});

// PUT /consultations/:id - полное обновление консультации
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'Consultation id must be a positive integer');
    }

    const consultation = await Consultation.findByPk(id);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    if (!isOwnerOrStaff(req, consultation)) {
      return res.status(403).json({ error: 'Access denied: consultation belongs to another user' });
    }

    const missing = missingFields(req.body || {});
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`);
    }

    const doctor = await Doctor.findByPk(Number(req.body.doctorId));
    if (!doctor) {
      return badRequest(res, `Doctor with id ${req.body.doctorId} does not exist`);
    }

    await Consultation.update(collectPayload(req.body), { where: { id } });
    const updated = await Consultation.findByPk(id, { include: INCLUDE_RELATIONS });
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /consultations/:id - удаление консультации
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'Consultation id must be a positive integer');
    }

    const consultation = await Consultation.findByPk(id);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    if (!isOwnerOrStaff(req, consultation)) {
      return res.status(403).json({ error: 'Access denied: consultation belongs to another user' });
    }

    await Consultation.destroy({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
