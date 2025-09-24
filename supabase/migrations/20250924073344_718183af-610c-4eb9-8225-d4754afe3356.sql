-- Remove all users except damianorwin@gmail.com
DO $$
DECLARE 
    user_record RECORD;
BEGIN
    -- Get all users except damianorwin@gmail.com
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email != 'damianorwin@gmail.com'
    LOOP
        RAISE NOTICE 'Removing user: % (ID: %)', user_record.email, user_record.id;
        
        -- Remove from user_roles
        DELETE FROM public.user_roles WHERE user_id = user_record.id;
        
        -- Remove from profiles if exists
        DELETE FROM public.profiles WHERE user_id = user_record.id;
        
        -- Remove from contacts
        DELETE FROM public.contacts WHERE user_id = user_record.id;
        
        -- Remove from addresses  
        DELETE FROM public.addresses WHERE user_id = user_record.id;
        
        -- Remove from admin_sessions
        DELETE FROM public.admin_sessions WHERE user_id = user_record.id;
        
        -- Remove from admin_impersonation_sessions
        DELETE FROM public.admin_impersonation_sessions WHERE admin_user_id = user_record.id;
        
        -- Remove from email_verifications
        DELETE FROM public.email_verifications WHERE user_id = user_record.id;
        
        -- Remove from files where they are the owner
        DELETE FROM public.files WHERE owner_user_id = user_record.id;
        
        -- Remove from carts
        DELETE FROM public.carts WHERE user_id = user_record.id;
        
        -- Update orders and quotes to remove user association (preserve business records)
        UPDATE public.orders SET user_id = NULL WHERE user_id = user_record.id;
        UPDATE public.quotes SET user_id = NULL WHERE user_id = user_record.id;
        
        -- Finally remove from auth.users
        DELETE FROM auth.users WHERE id = user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Cleanup complete. Only damianorwin@gmail.com remains.';
END $$;