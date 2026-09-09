// Демонстрация работы bcrypt: соль делает хеши одного пароля разными.
// Запуск: node scripts/bcrypt-demo.js
const bcrypt = require('bcrypt');

async function main() {
  const password = 'Patient123!';

  const first = await bcrypt.hash(password, 10);
  const second = await bcrypt.hash(password, 10);

  console.log('password        :', password);
  console.log('hash #1         :', first);
  console.log('hash #2         :', second);
  console.log('hashes are equal:', first === second);
  console.log('');
  console.log('format: $2b$ - algorithm, $10$ - cost factor, then 22 chars of salt + hash');
  console.log('salt of hash #1 :', first.slice(0, 29));
  console.log('');
  console.log('compare correct password  :', await bcrypt.compare(password, first));
  console.log('compare wrong password    :', await bcrypt.compare('wrong-password', first));
}

main();
