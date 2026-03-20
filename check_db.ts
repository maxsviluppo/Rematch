
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lydfzgzvxrayytzjgbmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZGZ6Z3p2eHJheXl0empnYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTM3NjUsImV4cCI6MjA4ODc4OTc2NX0.sxS8sIagiabBjUtViwCY6r1mtCC8Io7MCPaSvIw_ZNc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking Supabase Items...");
  const { data, error } = await supabase.from('items').select('id, title, status, seller_id, created_at').limit(20);
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No items found in the 'items' table.");
  } else {
    console.log(`Found ${data.length} items:`);
    console.table(data);
  }

  const { count, error: countError } = await supabase.from('items').select('*', { count: 'exact', head: true });
  console.log("Total items count:", count);
}

check();
