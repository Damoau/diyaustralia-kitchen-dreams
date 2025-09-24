import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUserRoleContext } from './UserRoleContext';
import { Trash2 } from 'lucide-react';

export const BulkUserActions = () => {
  const { users, deleteUser } = useUserRoleContext();

  const handleClearAllExceptDamian = async () => {
    const usersToDelete = users.filter(user => user.email !== 'damianorwin@gmail.com');
    
    for (const user of usersToDelete) {
      await deleteUser(user.email);
    }
  };

  const usersToDelete = users.filter(user => user.email !== 'damianorwin@gmail.com');

  if (usersToDelete.length === 0) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Users ({usersToDelete.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Multiple Users</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {usersToDelete.length} users, keeping only damianorwin@gmail.com. 
            This action cannot be undone.
            <br /><br />
            Users to be deleted:
            <ul className="list-disc list-inside mt-2">
              {usersToDelete.map(user => (
                <li key={user.id} className="text-sm">{user.email}</li>
              ))}
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearAllExceptDamian}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete {usersToDelete.length} Users
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};