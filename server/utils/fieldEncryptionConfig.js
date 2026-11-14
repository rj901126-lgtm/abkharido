import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';

const isProduction = process.env.NODE_ENV === 'production';
const configuredKey = process.env.DATABASE_ENCRYPTION_KEY;
const configuredSalt = process.env.DATABASE_ENCRYPTION_SALT;
const configuredSaltBytes = configuredSalt ? Buffer.byteLength(configuredSalt, 'utf8') : 0;
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Next.js imports API route modules while collecting build metadata. Keep the
// production guard active at runtime, but allow that build-only evaluation to
// use an ephemeral value when production secrets are not available to CI.
if (isProduction && !isProductionBuild && (!configuredKey || configuredKey.length < 32)) {
  throw new Error('DATABASE_ENCRYPTION_KEY must be configured with at least 32 characters in production.');
}

if (isProduction && !isProductionBuild && configuredSaltBytes !== 16) {
  throw new Error('DATABASE_ENCRYPTION_SALT must be configured as exactly 16 UTF-8 bytes in production (use 16 ASCII characters).');
}

// Local development and build-time evaluation get ephemeral values when unset.
// Production runtime never falls back.
export const fieldEncryptionSecret = configuredKey || randomBytes(32).toString('hex');
export const fieldEncryptionSalt = configuredSalt || randomBytes(8).toString('hex');
