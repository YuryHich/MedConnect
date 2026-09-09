// Параллельная реализация того же раздела API на MongoDB и Mongoose.
// Реляционная версия (PostgreSQL + Sequelize) остаётся доступной по /doctors,
// документная - по /mongo/doctors, что позволяет сравнить оба подхода.
const express = require('express');
const mongoose = require('mongoose');
const DoctorProfile = require('../mongo/models/DoctorProfile');
const { badRequest } = require('../utils/http');

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /mongo/doctors - список профилей с фильтрами и пагинацией
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const filter = {};
    if (req.query.specialty) filter.specialty = req.query.specialty;
    // поиск по элементу массива: "теги содержат значение"
    if (req.query.tag) filter.tags = req.query.tag.toLowerCase();
    if (req.query.format) filter.formats = req.query.format;
    // поиск по вложенному полю через точечную нотацию
    if (req.query.city) filter['contacts.city'] = req.query.city;
    if (req.query.minRating) {
      filter['reviews.rating'] = { $gte: Number(req.query.minRating) };
    }

    // цепочка методов Query: where -> sort -> skip -> limit
    const items = await DoctorProfile.find(filter)
      .sort({ pricePerHour: 1 })
      .skip(skip)
      .limit(limit);
    const total = await DoctorProfile.countDocuments(filter);

    res.status(200).json({
      items: items.map((doctor) => ({
        ...doctor.toJSON(),
        averageRating: doctor.averageRating(),
      })),
      total,
      limit,
      skip,
    });
  } catch (err) {
    next(err);
  }
});

// GET /mongo/doctors/stats - агрегация: средний рейтинг по специализациям
router.get('/stats', async (req, res, next) => {
  try {
    res.status(200).json(await DoctorProfile.ratingBySpecialty());
  } catch (err) {
    next(err);
  }
});

// GET /mongo/doctors/specialty/:specialty - статический метод модели
router.get('/specialty/:specialty', async (req, res, next) => {
  try {
    const items = await DoctorProfile.findBySpecialty(req.params.specialty);
    res.status(200).json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

// GET /mongo/doctors/:id - документ целиком, вместе со вложенными структурами
router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return badRequest(res, 'Doctor profile id must be a valid ObjectId');
    }

    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    return res.status(200).json({
      ...doctor.toJSON(),
      averageRating: doctor.averageRating(),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /mongo/doctors - создание документа
router.post('/', async (req, res, next) => {
  try {
    const created = await DoctorProfile.create(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return next(err);
  }
});

// PUT /mongo/doctors/:id - обновление документа
router.put('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return badRequest(res, 'Doctor profile id must be a valid ObjectId');
    }

    const updated = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /mongo/doctors/:id - удаление документа с возвратом удалённого
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return badRequest(res, 'Doctor profile id must be a valid ObjectId');
    }

    const removed = await DoctorProfile.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    return res.status(200).json({ deleted: removed });
  } catch (err) {
    return next(err);
  }
});

// --- работа с вложенными массивами ----------------------------------------

// POST /mongo/doctors/:id/reviews - добавление отзыва оператором $push
router.post('/:id/reviews', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return badRequest(res, 'Doctor profile id must be a valid ObjectId');
    }
    const { author, rating, comment } = req.body || {};
    if (!author || rating === undefined) {
      return badRequest(res, 'Fields "author" and "rating" are required');
    }

    const doctor = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      { $push: { reviews: { author, rating: Number(rating), comment } } },
      { returnDocument: 'after', runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    return res.status(201).json({
      ...doctor.toJSON(),
      averageRating: doctor.averageRating(),
    });
  } catch (err) {
    return next(err);
  }
});

// PATCH /mongo/doctors/:id/reviews/:reviewId - изменение элемента внутри
// массива с помощью позиционного оператора $
router.patch('/:id/reviews/:reviewId', async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(reviewId)) {
      return badRequest(res, 'Both ids must be valid ObjectId values');
    }

    const update = {};
    if (req.body?.rating !== undefined) {
      update['reviews.$.rating'] = Number(req.body.rating);
    }
    if (req.body?.comment !== undefined) {
      update['reviews.$.comment'] = req.body.comment;
    }
    if (Object.keys(update).length === 0) {
      return badRequest(res, 'Provide "rating" and/or "comment" to update');
    }

    const doctor = await DoctorProfile.findOneAndUpdate(
      { _id: id, 'reviews._id': reviewId },
      { $set: update },
      { returnDocument: 'after', runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile or review not found' });
    }

    return res.status(200).json({
      ...doctor.toJSON(),
      averageRating: doctor.averageRating(),
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /mongo/doctors/:id/reviews/:reviewId - удаление элемента массива ($pull)
router.delete('/:id/reviews/:reviewId', async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(reviewId)) {
      return badRequest(res, 'Both ids must be valid ObjectId values');
    }

    const doctor = await DoctorProfile.findByIdAndUpdate(
      id,
      { $pull: { reviews: { _id: reviewId } } },
      { returnDocument: 'after' }
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    return res.status(200).json({
      ...doctor.toJSON(),
      averageRating: doctor.averageRating(),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /mongo/doctors/:id/schedule - добавление слота в расписание.
// $addToSet не добавляет дубликаты, в отличие от $push.
router.post('/:id/schedule', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return badRequest(res, 'Doctor profile id must be a valid ObjectId');
    }
    const { day, slot } = req.body || {};
    if (!day || !slot) {
      return badRequest(res, 'Fields "day" and "slot" are required');
    }

    // Если день уже есть в расписании - слот добавляется в его массив,
    // иначе создаётся новый элемент расписания.
    let doctor = await DoctorProfile.findOneAndUpdate(
      { _id: req.params.id, 'schedule.day': day },
      { $addToSet: { 'schedule.$.slots': slot } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!doctor) {
      doctor = await DoctorProfile.findByIdAndUpdate(
        req.params.id,
        { $push: { schedule: { day, slots: [slot] } } },
        { returnDocument: 'after', runValidators: true }
      );
    }
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    return res.status(200).json(doctor);
  } catch (err) {
    return next(err);
  }
});

// POST /mongo/doctors/:id/tags - добавление тега без дубликатов
router.post('/:id/tags', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return badRequest(res, 'Doctor profile id must be a valid ObjectId');
    }
    if (!req.body?.tag) {
      return badRequest(res, 'Field "tag" is required');
    }

    const doctor = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: String(req.body.tag).toLowerCase() } },
      { returnDocument: 'after' }
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    return res.status(200).json(doctor);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
