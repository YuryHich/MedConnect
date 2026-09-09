'use strict';

const bcrypt = require('bcrypt');

const now = new Date();

// Демонстрационные учётные записи для всех трёх ролей MedConnect.
const USERS = [
  { email: 'admin@medconnect.by', fullName: 'Юрий Гич', role: 'admin', password: 'Admin123!' },
  { email: 'doctor@medconnect.by', fullName: 'Анна Ковалевская', role: 'doctor', password: 'Doctor123!' },
  { email: 'patient@medconnect.by', fullName: 'Иван Петров', role: 'patient', password: 'Patient123!' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rows = await Promise.all(
      USERS.map(async (user) => ({
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        fullName: user.fullName,
        role: user.role,
        createdAt: now,
        updatedAt: now,
      }))
    );
    await queryInterface.bulkInsert('Users', rows);

    // Существующие консультации закрепляются за демонстрационным пациентом
    const [patients] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = 'patient@medconnect.by'`
    );
    if (patients.length > 0) {
      await queryInterface.sequelize.query(
        'UPDATE "Consultations" SET "userId" = :userId WHERE "userId" IS NULL',
        { replacements: { userId: patients[0].id } }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {
      email: USERS.map((user) => user.email),
    });
  },
};
