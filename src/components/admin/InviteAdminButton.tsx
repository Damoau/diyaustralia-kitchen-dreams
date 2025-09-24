import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, UserPlus } from 'lucide-react';

export const InviteAdminButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const inviteAdmin = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-invite-user', {
        body: { 
          email: 'ibilashhalder@gmail.com',
          role: 'admin' 
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success!',
        description: 'Admin invitation sent to ibilashhalder@gmail.com. They will receive an email with a password setup link.',
      });

      console.log('Admin invitation result:', data);
      
    } catch (error: any) {
      console.error('Error inviting admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send admin invitation',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={inviteAdmin} 
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="h-4 w-4" />
          Invite ibilashhalder@gmail.com as Admin
        </>
      )}
    </Button>
  );
};