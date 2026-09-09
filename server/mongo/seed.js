// Наполнение MongoDB демонстрационными профилями врачей.
// Запуск: node mongo/seed.js
require('dotenv').config();

const { connectMongo, mongoose } = require('./connection');
const DoctorProfile = require('./models/DoctorProfile');

const PROFILES = [
  {
    fullName: 'Анна Ковалевская',
    specialty: 'Кардиолог',
    experienceYears: 12,
    pricePerHour: 90,
    formats: ['chat', 'video'],
    tags: ['экг', 'гипертония', 'взрослые'],
    contacts: { email: 'kovalevskaya@medconnect.by', phone: '+375 29 111-11-11', city: 'Минск' },
    reviews: [
      { author: 'Иван Петров', rating: 5, comment: 'Подробно разобрала результаты ЭКГ' },
      { author: 'Елена Гурская', rating: 4, comment: 'Внимательный врач, но приём начался позже' },
    ],
    schedule: [
      { day: 'mon', slots: ['09:00', '09:30', '10:00'] },
      { day: 'wed', slots: ['14:00', '14:30'] },
    ],
  },
  {
    fullName: 'Сергей Дубовик',
    specialty: 'Терапевт',
    experienceYears: 7,
    pricePerHour: 50,
    formats: ['chat'],
    tags: ['орви', 'справки', 'первичный приём'],
    contacts: { email: 'dubovik@medconnect.by', phone: '+375 29 222-22-22', city: 'Минск' },
    reviews: [
      { author: 'Мария Сидорова', rating: 5, comment: 'Быстро ответил в чате' },
    ],
    schedule: [
      { day: 'tue', slots: ['11:00', '11:20', '11:40'] },
    ],
  },
  {
    fullName: 'Ольга Радевич',
    specialty: 'Дерматолог',
    experienceYears: 15,
    pricePerHour: 80,
    formats: ['video'],
    tags: ['акне', 'дети', 'фотодиагностика'],
    contacts: { email: 'radevich@medconnect.by', phone: '+375 29 333-33-33', city: 'Гродно' },
    reviews: [
      { author: 'Алексей Морозов', rating: 5, comment: 'Помогла по фотографиям, без визита' },
      { author: 'Ольга Климова', rating: 5, comment: 'Очень довольна консультацией' },
      { author: 'Иван Петров', rating: 3, comment: 'Пришлось долго ждать ответа' },
    ],
    schedule: [
      { day: 'thu', slots: ['14:00', '15:00'] },
      { day: 'fri', slots: ['10:00'] },
    ],
  },
  {
    fullName: 'Павел Гриневич',
    specialty: 'Невролог',
    experienceYears: 9,
    pricePerHour: 110,
    formats: ['chat', 'video'],
    tags: ['мигрень', 'бессонница', 'взрослые'],
    contacts: { email: 'grinevich@medconnect.by', phone: '+375 29 444-44-44', city: 'Брест' },
    reviews: [
      { author: 'Ольга Климова', rating: 4, comment: 'Назначил понятную схему лечения' },
    ],
    schedule: [
      { day: 'mon', slots: ['16:00', '16:30'] },
      { day: 'sat', slots: ['10:00', '10:30', '11:00'] },
    ],
  },
];

async function main() {
  await connectMongo();

  const removed = await DoctorProfile.deleteMany({});
  console.log(`removed documents: ${removed.deletedCount}`);

  const created = await DoctorProfile.insertMany(PROFILES);
  console.log(`inserted documents: ${created.length}`);

  for (const doctor of created) {
    console.log(
      `  ${doctor.fullName.padEnd(20)} | ${doctor.specialty.padEnd(12)}`
      + ` | отзывов: ${doctor.reviewsCount} | средняя оценка: ${doctor.averageRating()}`
      + ` | дней в расписании: ${doctor.schedule.length}`
    );
  }

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('seed failed:', err.message);
  process.exit(1);
});
