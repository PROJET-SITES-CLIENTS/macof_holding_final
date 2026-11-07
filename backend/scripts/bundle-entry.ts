// Entrée du bundle serverless Vercel.
// esbuild assemble ici TOUTE l'application (src + node_modules) dans un
// fichier unique api/index.mjs — aucun problème de résolution de modules ESM.
import app from '../src/index';

export default app;
