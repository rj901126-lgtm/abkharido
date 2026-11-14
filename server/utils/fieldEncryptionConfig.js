import { randomBytes } from 'node:crypto';

const isProduction = process.env.NODE_ENV === 'production';
const configuredKey = process.env.DATABASE_ENCRYPTION_KEY;
const configuredSalt = process.env.DATABASE_ENCRYPTION_SALT;

if (isProduction && (!configuredKey || configuredKey.length < 32)) {
  throw new Error('DATABASE_ENCRYPTION_KEY must be configured with at least 32 characters in production.');
}

if (isProduction && (!configuredSalt || configuredSalt.length < 16)) {
  throw new Error('DATABASE_ENCRYPTION_SALT must be configured with at least 16 characters in production.');
}

// Local development gets an ephemeral key if none is configured. Production never falls back.
export const fieldEncryptionSecret = configuredKey || randomBytes(32).toString('hex');
export const fieldEncryptionSalt = configuredSalt || randomBytes(16).toString('hex');
