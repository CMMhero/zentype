-- Add punctuation and numbers columns to test_results
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS punctuation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS numbers BOOLEAN NOT NULL DEFAULT false;
