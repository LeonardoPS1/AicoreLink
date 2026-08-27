const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const hash = bcrypt.hashSync('dev123456', 12);
  console.log('Hash:', hash);

  const client = new Client({
    connectionString: 'postgresql://aicorelink_app:AicoreLink2024!AppPass@172.18.0.1:5432/aicorelink'
  });
  
  await client.connect();
  const result = await client.query("UPDATE users SET password_hash = $1 WHERE email = 'dev@aicore.com'", [hash]);
  console.log('Updated:', result.rowCount);
  
  const verify = await client.query("SELECT password_hash FROM users WHERE email = 'dev@aicore.com'");
  console.log('Verify:', verify.rows[0].password_hash);
  
  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});