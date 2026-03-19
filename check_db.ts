
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lydfzgzvxrayytzjgbmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZGZ6Z3p2eHJheXl0empnYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTM3NjUsImV4cCI6MjA4ODc4OTc2NX0.sxS8sIagiabBjUtViwCY6r1mtCC8Io7MCPaSvIw_ZNc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking items table...');
  const { data, error, count } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('Items fetch error:', error);
  } else {
    console.log('Items found (count):', count);
  }

  console.log('\nChecking active user...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user (should be null in scratch session):', user?.id || 'null');

  console.log('\nChecking first 5 items (raw):');
  const { data: items, error: iErr } = await supabase.from('items').select('*').limit(5);
  if (iErr) console.error('Raw items error:', iErr);
  else console.log('Raw items (first 5):', JSON.stringify(items, null, 2));
}

check();
