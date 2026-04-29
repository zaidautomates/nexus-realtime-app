const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || 'nexus_comm_encryption_key_2026',
  'salt_nexus_2026',
  32
);

function encrypt(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted;
  if (Buffer.isBuffer(data)) {
    encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  } else {
    const buf = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
  }

  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

function decrypt(encryptedObj) {
  const { iv, authTag, data } = encryptedObj;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]);
  return decrypted;
}

function encryptMessage(message) {
  const result = encrypt(message);
  return `${result.iv}:${result.authTag}:${result.data}`;
}

function decryptMessage(encrypted) {
  const [iv, authTag, data] = encrypted.split(':');
  return decrypt({ iv, authTag, data }).toString('utf8');
}

module.exports = { encrypt, decrypt, encryptMessage, decryptMessage };
