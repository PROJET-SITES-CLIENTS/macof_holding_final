require('dotenv').config();
const { Client } = require('pg');
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquant dans les variables d\'environnement (.env)');
  process.exit(1);
}
const client = new Client(process.env.DATABASE_URL);
client.connect().then(() => {
  return client.query("SELECT section_key, content_value FROM page_contents WHERE page_slug = 'home' AND section_key IN ('temoignages', 'realisations')");
}).then(res => {
  console.log(JSON.stringify(res.rows, null, 2));
  return client.query("SELECT * FROM galerie");
}).then(res => {
  console.log('--- GALERIE ---');
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}).catch(console.error);
