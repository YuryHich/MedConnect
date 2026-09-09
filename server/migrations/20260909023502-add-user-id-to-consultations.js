'use strict';

/**
 * Связь консультации с пользователем, оформившим запись. Нужна для
 * разграничения доступа: пациент видит и изменяет только свои консультации,
 * врач и администратор - все.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Consultations', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('Consultations', ['userId']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Consultations', 'userId');
  },
};
