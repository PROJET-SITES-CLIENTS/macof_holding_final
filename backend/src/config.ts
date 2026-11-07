import 'dotenv/config';

function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error("JWT_SECRET manquant ou trop court (min 32 caracteres)");
    process.exit(1);
  }
  return secret;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: validateJwtSecret(),
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};
