// Демонстрация структуры JWT: три части, разделённые точками.
// Запуск: node scripts/jwt-demo.js
require('dotenv').config();

const jwt = require('jsonwebtoken');

const payload = { id: 3, email: 'patient@medconnect.by', role: 'patient' };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
const [header, body, signature] = token.split('.');

const decode = (part) => Buffer.from(part, 'base64url').toString('utf8');

console.log('TOKEN:');
console.log(token);
console.log('');
console.log('1) HEADER   :', decode(header));
console.log('2) PAYLOAD  :', decode(body));
console.log('3) SIGNATURE:', signature);
console.log('');
console.log('verify with the correct secret:', JSON.stringify(jwt.verify(token, process.env.JWT_SECRET)));

try {
  jwt.verify(token, 'wrong-secret');
} catch (err) {
  console.log('verify with a wrong secret:', err.name, '-', err.message);
}

const expired = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1s' });
try {
  jwt.verify(expired, process.env.JWT_SECRET);
} catch (err) {
  console.log('verify an expired token:', err.name, '-', err.message);
}
