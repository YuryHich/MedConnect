// Документная модель профиля врача. Демонстрирует главное отличие MongoDB от
// реляционной модели: отзывы, теги и расписание хранятся внутри одного
// документа, а не в отдельных таблицах, связанных внешними ключами.
const mongoose = require('mongoose');

// Вложенный документ (subdocument) отзыва - отдельная коллекция не создаётся
const reviewSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Вложенный документ рабочего дня: массив внутри массива
const scheduleDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    },
    slots: [{ type: String, match: /^\d{2}:\d{2}$/ }],
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true, index: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    pricePerHour: { type: Number, default: 0, min: 0 },
    formats: [{ type: String, enum: ['chat', 'video'] }],
    // массив простых значений
    tags: [{ type: String, trim: true, lowercase: true }],
    // массив вложенных документов
    reviews: [reviewSchema],
    // массив вложенных документов, каждый из которых содержит свой массив
    schedule: [scheduleDaySchema],
    contacts: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      city: { type: String, trim: true },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'doctorProfiles',
    // виртуальные поля включаются в JSON-ответ сервера
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Составной индекс для типового запроса каталога: активные врачи по специализации
doctorProfileSchema.index({ specialty: 1, isActive: 1 });
// Текстовый индекс для поиска по имени и тегам
doctorProfileSchema.index({ fullName: 'text', tags: 'text' });

// Виртуальное поле: количество отзывов
doctorProfileSchema.virtual('reviewsCount').get(function reviewsCount() {
  return this.reviews.length;
});

// Метод экземпляра: средняя оценка по вложенным отзывам
doctorProfileSchema.methods.averageRating = function averageRating() {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return Number((sum / this.reviews.length).toFixed(2));
};

// Метод экземпляра: свободные слоты на указанный день недели
doctorProfileSchema.methods.slotsForDay = function slotsForDay(day) {
  return this.schedule.find((entry) => entry.day === day)?.slots ?? [];
};

// Статический метод модели: поиск по специализации
doctorProfileSchema.statics.findBySpecialty = function findBySpecialty(specialty) {
  return this.find({ specialty, isActive: true }).sort({ pricePerHour: 1 });
};

// Статический метод модели: агрегация - средний рейтинг по специализациям
doctorProfileSchema.statics.ratingBySpecialty = function ratingBySpecialty() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$reviews' },
    {
      $group: {
        _id: '$specialty',
        averageRating: { $avg: '$reviews.rating' },
        reviewsCount: { $sum: 1 },
        doctors: { $addToSet: '$fullName' },
      },
    },
    { $sort: { averageRating: -1 } },
  ]);
};

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
