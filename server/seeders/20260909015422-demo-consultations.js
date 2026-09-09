'use strict';

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Идентификаторы врачей читаются из базы, чтобы сид не зависел от порядка вставки
    const [doctors] = await queryInterface.sequelize.query(
      'SELECT id, "specialty" FROM "Doctors" ORDER BY id'
    );
    const bySpecialty = Object.fromEntries(doctors.map((d) => [d.specialty, d.id]));

    await queryInterface.bulkInsert('Consultations', [
      {
        doctorId: bySpecialty['Кардиолог'],
        patientName: 'Иван Петров',
        date: '2026-09-10',
        startTime: '09:00',
        endTime: '09:30',
        format: 'video',
        status: 'planned',
        price: 45.0,
        createdAt: now,
        updatedAt: now,
      },
      {
        doctorId: bySpecialty['Терапевт'],
        patientName: 'Мария Сидорова',
        date: '2026-09-10',
        startTime: '11:00',
        endTime: '11:20',
        format: 'chat',
        status: 'planned',
        price: 25.0,
        createdAt: now,
        updatedAt: now,
      },
      {
        doctorId: bySpecialty['Дерматолог'],
        patientName: 'Алексей Морозов',
        date: '2026-09-11',
        startTime: '14:00',
        endTime: '14:45',
        format: 'video',
        status: 'completed',
        price: 60.0,
        createdAt: now,
        updatedAt: now,
      },
      {
        doctorId: bySpecialty['Кардиолог'],
        patientName: 'Елена Гурская',
        date: '2026-09-12',
        startTime: '16:00',
        endTime: '16:30',
        format: 'chat',
        status: 'cancelled',
        price: 45.0,
        createdAt: now,
        updatedAt: now,
      },
      {
        doctorId: bySpecialty['Невролог'],
        patientName: 'Ольга Климова',
        date: '2026-09-13',
        startTime: '10:00',
        endTime: '11:00',
        format: 'video',
        status: 'planned',
        price: 110.0,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Consultations', null, {});
  },
};
