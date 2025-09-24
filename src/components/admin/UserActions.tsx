import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserProfile } from '@/hooks/useUsers';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Shield, 
  UserMinus,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserActionsProps {
  user: UserProfile;
  onViewDetails: (user: UserProfile) => void;
  onAssignRole: (userId: string, role: string) => void;
  onRemoveRole: (userId: string, role: string) => void;
  onUpdateStatus: (userId: string, action: 'activate' | 'deactivate') => void;
  isLoading?: boolean;
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'fulfilment', label: 'Fulfilment' },
  { value: 'customer', label: 'Customer' }
];

export const UserActions = ({ 
  user, 
  onViewDetails, 
  onAssignRole, 
  onRemoveRole, 
  onUpdateStatus,
  isLoading = false 
}: UserActionsProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    
    setIsAssigning(true);
    try {
      await onAssignRole(user.id, selectedRole);
      setSelectedRole('');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (role: string) => {
    await onRemoveRole(user.id, role);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'sales_rep':
        return 'secondary';
      case 'fulfilment':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getAvailableRoles = () => {
    const currentRoles = user.roles.map(r => r.role);
    return AVAILABLE_ROLES.filter(role => !currentRoles.includes(role.value as any));
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Roles */}
      <div className="flex flex-wrap gap-1">
        {user.roles.length > 0 ? (
          user.roles.map((roleObj) => (
            <Badge 
              key={roleObj.id} 
              variant={getRoleColor(roleObj.role)}
              className="relative group cursor-pointer"
              onClick={() => handleRemoveRole(roleObj.role)}
            >
              {roleObj.role.replace('_', ' ')}
              <UserMinus className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Badge>
          ))
        ) : (
          <Badge variant="outline">customer</Badge>
        )}
      </div>

      {/* Role Assignment */}
      <div className="flex items-center gap-1">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Add role" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableRoles().map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          size="sm"
          onClick={handleAssignRole}
          disabled={!selectedRole || isAssigning || isLoading}
          className="h-8"
        >
          <Shield className="h-3 w-3" />
        </Button>
      </div>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onViewDetails(user)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {user.email_confirmed_at ? (
            <DropdownMenuItem onClick={() => onUpdateStatus(user.id, 'deactivate')}>
              <UserX className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onUpdateStatus(user.id, 'activate')}>
              <UserCheck className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};