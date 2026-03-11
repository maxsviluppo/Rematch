import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://lydfzgzvxrayytzjgbmz.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_server_error_3@example.com',
    password: 'password123',
    options: {
      data: {
        nome: 'TestUser3'
      }
    }
  });

  if (error) {
    console.error('Signup Error:', error);
  } else {
    console.log('Signup Success!', data);
  }
}

testSignup();
