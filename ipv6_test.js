import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres:20261974Max12@[2a05:d018:135e:16c6:a7dd:487d:777b:aac1]:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => {
    console.log('SUCCESS: Connected via IPv6 address!');
    process.exit(0);
  })
  .catch(err => {
    console.error('IPv6 Connection Error:', err.message);
    process.exit(1);
  });
