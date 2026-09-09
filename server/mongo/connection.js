// Подключение к MongoDB через ODM Mongoose. Строка подключения берётся из
// переменной окружения MONGO_URI, поэтому одинаково работает и с локальной
// установкой, и с бесплатным кластером MongoDB Atlas.
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medconnect';

let isConnected = false;

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log('MongoDB connected:', mongoose.connection.name);
  } catch (err) {
    isConnected = false;
    console.error('MongoDB connection error:', err.message);
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}

const isMongoConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = { connectMongo, isMongoConnected, mongoose, MONGO_URI };
