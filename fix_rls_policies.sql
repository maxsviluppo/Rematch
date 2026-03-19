-- =====================================================
-- REMATCH - DISABILITA RLS (Fix rapido per app demo)
-- Copia e incolla nel Supabase SQL Editor
-- Progetto: lydfzgzvxrayytzjgbmz
-- =====================================================

-- Disabilita RLS su tutte le tabelle
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Rimuove tutte le policy esistenti che potrebbero causare conflitti
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

-- Verifica che RLS sia disabilitato
SELECT 
  relname AS table_name, 
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('items', 'transactions', 'proposals', 'requests', 'favorites', 'users')
  AND relkind = 'r';
