const mongooseFieldEncryption = require('mongoose-field-encryption');
const secret = 'abkharido_default_master_encryption_key_2026_super_secure';
const saltGenerator = function (secret) {
  return "1234567890123456";
};

const encrypt = (value) => {
  return mongooseFieldEncryption.encrypt(value, secret, saltGenerator);
};

console.log('Encrypt "" (empty string):', encrypt(''));
console.log('Encrypt " " (space):', encrypt(' '));
console.log('Encrypt "null":', encrypt('null'));
console.log('Encrypt "undefined":', encrypt('undefined'));
console.log('Encrypt "test@example.com":', encrypt('test@example.com'));
console.log('Encrypt "test":', encrypt('test'));
