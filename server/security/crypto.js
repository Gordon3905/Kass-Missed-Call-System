import crypto from 'node:crypto';

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

export function createCrypto(secret) {
  const key = deriveKey(secret);

  return {
    encrypt(value) {
      if (!value) return '';
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
    },

    decrypt(value) {
      if (!value) return '';
      const [ivText, tagText, encryptedText] = String(value).split('.');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64'));
      decipher.setAuthTag(Buffer.from(tagText, 'base64'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedText, 'base64')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    },

    maskPhone(phone) {
      const digits = String(phone).replace(/\D/g, '');
      const lastFour = digits.slice(-4);
      const country = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : '+1';
      return `${country} *** *** ${lastFour}`;
    },
  };
}
