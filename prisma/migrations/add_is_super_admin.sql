-- Add isSuperAdmin column to users table for super admin functionality
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;
