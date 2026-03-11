import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const sql = `
-- Drop existing trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger function providing dummy values to respect NOT NULL constraints on old fields like 'nickname'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_name text;
BEGIN
  -- Extract name from metadata or fallback to email part before @
  base_name := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));

  INSERT INTO public.users (id, email, nome, nickname, username, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    base_name,
    base_name, -- satisfy NOT NULL for nickname
    base_name, -- satisfy username
    NOW() -- satisfy NOT NULL for created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    nickname = EXCLUDED.nickname,
    username = EXCLUDED.username;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sql);
    console.log('✅ Trigger fixed up successfully!');
  } catch (err) {
    console.error('❌ Error executing SQL:', err.message);
  } finally {
    await client.end();
  }
}
run();
