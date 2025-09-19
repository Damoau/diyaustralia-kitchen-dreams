-- Remove the problematic policy that tries to access auth.users table
DROP POLICY IF EXISTS "Authenticated users can view quotes by matching email" ON quotes;

-- The admin and sales rep policies are sufficient for the admin interface
-- We don't need the email matching policy for admin functionality