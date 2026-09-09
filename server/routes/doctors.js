// CRUD-маршруты врачей: вторая сущность модели данных, связанная с
// консультациями отношением один-ко-многим.
const express = require('express');
const { Doctor, Consultation } = require('../models');
const { parseId, badRequest } = require('../utils/http');

const router = express.Router();

const REQUIRED_FIELDS = ['fullName', 'specialty'];

function collectPayload(body) {
  return {
    fullName: body.fullName,
    specialty: body.specialty,
    experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : 0,
    pricePerHour: body.pricePerHour !== undefined ? Number(body.pricePerHour) : 0,
    rating: body.rating !== undefined ? Number(body.rating) : 0,
  };
}

function missingFields(body) {
  return REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

// GET /doctors - список врачей с пагинацией (limit / offset)
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const where = req.query.specialty ? { specialty: req.query.specialty } : {};

    const { rows, count } = await Doctor.findAndCountAll({
      where,
      limit,
      offset,
      order: [['rating', 'DESC']],
    });
    res.status(200).json({ items: rows, total: count, limit, offset });
  } catch (err) {
    next(err);
  }
});

// GET /doctors/:id - врач вместе со списком его консультаций
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'Doctor id must be a positive integer');
    }

    const doctor = await Doctor.findByPk(id, {
      include: [{ model: Consultation, as: 'consultations' }],
    });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    return res.status(200).json(doctor);
  } catch (err) {
    return next(err);
  }
});

// POST /doctors - создание врача
router.post('/', async (req, res, next) => {
  try {
    const missing = missingFields(req.body || {});
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`);
    }
    const doctor = await Doctor.create(collectPayload(req.body));
    return res.status(201).json(doctor);
  } catch (err) {
    return next(err);
  }
});

// PUT /doctors/:id - полное обновление врача
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'Doctor id must be a positive integer');
    }

    const doctor = await Doctor.findByPk(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const missing = missingFields(req.body || {});
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`);
    }

    await Doctor.update(collectPayload(req.body), { where: { id } });
    return res.status(200).json(await Doctor.findByPk(id));
  } catch (err) {
    return next(err);
  }
});

// DELETE /doctors/:id - удаление врача вместе с его консультациями (CASCADE)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'Doctor id must be a positive integer');
    }

    const removed = await Doctor.destroy({ where: { id } });
    if (removed === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
