import 'dotenv/config';

function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Throw (et non process.exit) : en serverless, process.exit tue la
    // fonction sans laisser de trace dans les logs. Un throw est tracé.
    throw new Error(
      `[config] JWT_SECRET manquant ou trop court (min 32 caracteres) — ` +
      `valeur détectée : ${secret ? `${secret.length} caractères` : 'absente'}`
    );
  }
  return secret;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: validateJwtSecret(),
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};
