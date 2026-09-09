'use strict';
const { Model } = require('sequelize');

const FORMATS = ['chat', 'video'];
const STATUSES = ['planned', 'completed', 'cancelled'];

module.exports = (sequelize, DataTypes) => {
  class Consultation extends Model {
    static associate(models) {
      // Консультация принадлежит одному врачу (обратная сторона связи hasMany)
      Consultation.belongsTo(models.Doctor, {
        foreignKey: 'doctorId',
        as: 'doctor',
      });
    }

    // Кастомный метод экземпляра: длительность консультации в минутах
    getDurationMinutes() {
      const toMinutes = (time) => {
        const [hours, minutes] = String(time).split(':').map(Number);
        return hours * 60 + minutes;
      };
      return toMinutes(this.endTime) - toMinutes(this.startTime);
    }
  }

  Consultation.init(
    {
      doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Doctors', key: 'id' },
      },
      patientName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: { args: /^\d{2}:\d{2}$/, msg: 'Field "startTime" must use the HH:MM format' },
        },
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: { args: /^\d{2}:\d{2}$/, msg: 'Field "endTime" must use the HH:MM format' },
        },
      },
      format: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'chat',
        validate: {
          isIn: {
            args: [FORMATS],
            msg: `Field "format" must be one of: ${FORMATS.join(', ')}`,
          },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'planned',
        validate: {
          isIn: {
            args: [STATUSES],
            msg: `Field "status" must be one of: ${STATUSES.join(', ')}`,
          },
        },
      },
      // Поле добавлено отдельной миграцией add-price-to-consultations
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      modelName: 'Consultation',
      validate: {
        startBeforeEnd() {
          if (this.startTime >= this.endTime) {
            throw new Error('Field "startTime" must be earlier than "endTime"');
          }
        },
      },
    }
  );

  Consultation.FORMATS = FORMATS;
  Consultation.STATUSES = STATUSES;

  return Consultation;
};
