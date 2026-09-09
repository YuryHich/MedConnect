'use strict';

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Doctors', [
      {
        fullName: 'Анна Ковалевская',
        specialty: 'Кардиолог',
        experienceYears: 12,
        pricePerHour: 90.0,
        rating: 4.9,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Сергей Дубовик',
        specialty: 'Терапевт',
        experienceYears: 7,
        pricePerHour: 50.0,
        rating: 4.6,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Ольга Радевич',
        specialty: 'Дерматолог',
        experienceYears: 15,
        pricePerHour: 80.0,
        rating: 4.8,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Павел Гриневич',
        specialty: 'Невролог',
        experienceYears: 9,
        pricePerHour: 110.0,
        rating: 4.7,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Doctors', null, {});
  },
};
