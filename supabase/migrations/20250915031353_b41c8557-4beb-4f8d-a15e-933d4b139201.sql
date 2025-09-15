-- Step 1a: Add new role enum values first
ALTER TYPE public.app_role ADD VALUE 'customer';
ALTER TYPE public.app_role ADD VALUE 'sales_rep';  
ALTER TYPE public.app_role ADD VALUE 'fulfilment';