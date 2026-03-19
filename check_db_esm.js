import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lydfzgzvxrayytzjgbmz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZGZ6Z3p2eHJheXl0empnYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTM3NjUsImV4cCI6MjA4ODc4OTc2NX0.sxS8sIagiabBjUtViwCY6r1mtCC8Io7MCPaSvIw_ZNc';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- START ---');
const { data, error, count } = await supabase.from('items').select('*', { count: 'exact' });
if (error) {
  console.log('ERROR:', error.message);
} else {
  console.log('COUNT:', count);
  console.log('DATA SAMPLE:', JSON.stringify(data[0] || {}));
}
console.log('--- END ---');
process.exit(0);
