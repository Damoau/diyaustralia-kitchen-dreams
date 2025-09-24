import React, { createContext, useContext, ReactNode } from 'react';
import { useUsers, UserProfile, UserStats } from '@/hooks/useUsers';

interface UserRoleContextType {
  users: UserProfile[];
  stats: UserStats;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => void;
  assignRole: (userId: string, role: string) => Promise<void>;
  removeRole: (userId: string, role: string) => Promise<void>;
  updateUserStatus: (userId: string, action: 'activate' | 'deactivate') => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const userRoleData = useUsers();

  return (
    <UserRoleContext.Provider value={userRoleData}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRoleContext = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRoleContext must be used within a UserRoleProvider');
  }
  return context;
};