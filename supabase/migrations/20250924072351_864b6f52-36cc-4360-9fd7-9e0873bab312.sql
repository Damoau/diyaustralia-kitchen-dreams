-- Remove user ibilashhalder@gmail.com and all related data
DO $$
DECLARE 
    user_uuid uuid;
BEGIN
    -- Get the user ID for ibilashhalder@gmail.com
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'ibilashhalder@gmail.com';
    
    -- Only proceed if user exists
    IF user_uuid IS NOT NULL THEN
        -- Remove from user_roles
        DELETE FROM public.user_roles WHERE user_id = user_uuid;
        
        -- Remove from profiles if exists
        DELETE FROM public.profiles WHERE user_id = user_uuid;
        
        -- Remove from contacts
        DELETE FROM public.contacts WHERE user_id = user_uuid;
        
        -- Remove from addresses
        DELETE FROM public.addresses WHERE user_id = user_uuid;
        
        -- Remove from admin_sessions
        DELETE FROM public.admin_sessions WHERE user_id = user_uuid;
        
        -- Remove from admin_impersonation_sessions
        DELETE FROM public.admin_impersonation_sessions WHERE admin_user_id = user_uuid;
        
        -- Remove from email_verifications
        DELETE FROM public.email_verifications WHERE user_id = user_uuid;
        
        -- Remove from files where they are the owner
        DELETE FROM public.files WHERE owner_user_id = user_uuid;
        
        -- Remove from carts
        DELETE FROM public.carts WHERE user_id = user_uuid;
        
        -- Note: Orders and quotes should be preserved for business records
        -- but we'll update them to remove the user association
        UPDATE public.orders SET user_id = NULL WHERE user_id = user_uuid;
        UPDATE public.quotes SET user_id = NULL WHERE user_id = user_uuid;
        
        -- Finally remove from auth.users
        DELETE FROM auth.users WHERE id = user_uuid;
        
        RAISE NOTICE 'Successfully removed user ibilashhalder@gmail.com and related data';
    ELSE
        RAISE NOTICE 'User ibilashhalder@gmail.com not found in database';
    END IF;
END $$;