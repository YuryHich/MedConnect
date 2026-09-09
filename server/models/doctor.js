'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Doctor extends Model {
    static associate(models) {
      // Один врач проводит много консультаций (связь один-ко-многим)
      Doctor.hasMany(models.Consultation, {
        foreignKey: 'doctorId',
        as: 'consultations',
        onDelete: 'CASCADE',
      });
    }

    // Кастомный метод экземпляра: краткое представление врача для списков
    getDisplayName() {
      return `${this.fullName} (${this.specialty})`;
    }

    // Кастомный статический метод: поиск врачей по специализации
    static findBySpecialty(specialty) {
      return this.findAll({ where: { specialty } });
    }
  }

  Doctor.init(
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      specialty: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      pricePerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 5 },
      },
    },
    {
      sequelize,
      modelName: 'Doctor',
    }
  );

  return Doctor;
};
