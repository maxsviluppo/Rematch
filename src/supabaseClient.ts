
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lydfzgzvxrayytzjgbmz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZGZ6Z3p2eHJheXl0empnYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTM3NjUsImV4cCI6MjA4ODc4OTc2NX0.sxS8sIagiabBjUtViwCY6r1mtCC8Io7MCPaSvIw_ZNc';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase keys are missing. Application might not function correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
