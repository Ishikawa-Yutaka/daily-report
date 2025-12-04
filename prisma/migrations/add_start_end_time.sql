-- Add startTime and endTime columns to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS start_time VARCHAR,
ADD COLUMN IF NOT EXISTS end_time VARCHAR;
