import pg from 'pg';
const { Client } = pg;
const regions = ['eu-central-1', 'eu-west-1', 'us-east-1', 'us-west-1', 'ap-southeast-1'];
const projectRef = 'lydfzgzvxrayytzjgbmz';
const password = '20261974Max12';

async function test() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const user = `postgres.${projectRef}`;
    console.log(`Testing region: ${region} (${host})...`);
    const client = new Client({
      host,
      port: 6543,
      user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`✅ SUCCESS! Found region: ${region}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  process.exit(1);
}
test();
