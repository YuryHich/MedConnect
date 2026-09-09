'use strict';
const bcrypt = require('bcrypt');
const { Model } = require('sequelize');

// Ролевая модель MedConnect: пациент записывается на консультации,
// врач их проводит, администратор управляет каталогом врачей и пользователями.
const ROLES = ['patient', 'doctor', 'admin'];
const SALT_ROUNDS = 10;

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Пациент может иметь много записей на консультации
      User.hasMany(models.Consultation, {
        foreignKey: 'userId',
        as: 'consultations',
      });
    }

    // Сравнение введённого пароля с сохранённым хешем
    comparePassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    }

    hasRole(...roles) {
      return roles.includes(this.role);
    }

    // Представление пользователя для ответа клиенту: без хеша пароля
    toPublicJSON() {
      return {
        id: this.id,
        email: this.email,
        fullName: this.fullName,
        role: this.role,
        createdAt: this.createdAt,
      };
    }

    // Хеширование пароля выполняется в модели, чтобы хеш нельзя было обойти
    static hashPassword(password) {
      return bcrypt.hash(password, SALT_ROUNDS);
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Field "email" must be a valid email address' },
          notEmpty: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'patient',
        validate: {
          isIn: {
            args: [ROLES],
            msg: `Field "role" must be one of: ${ROLES.join(', ')}`,
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      defaultScope: {
        // хеш пароля не попадает в выборки по умолчанию
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  User.ROLES = ROLES;

  return User;
};
