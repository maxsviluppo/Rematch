-- Run this in the Supabase SQL Editor for project lydfzgzvxrayytzjgbmz
-- Adds review columns to the transactions table if they don't already exist

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_rating INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_comment TEXT;

-- Verify the result
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
