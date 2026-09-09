'use strict';

/**
 * Изменение схемы: в таблицу Consultations добавляется поле price - стоимость
 * консультации. Поле требуется для механизма оплаты, предусмотренного темой
 * курсового проекта.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Consultations', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Consultations', 'price');
  },
};
