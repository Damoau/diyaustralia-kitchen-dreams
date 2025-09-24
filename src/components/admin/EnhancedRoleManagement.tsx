import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUserRoleContext } from './UserRoleContext';
import { NavigationTabs } from './NavigationTabs';
import { QuickActionBar } from './QuickActionBar';
import { UserDetailModal } from './UserDetailModal';
import { UserInviteDialog } from './UserInviteDialog';
import { InviteAdminButton } from './InviteAdminButton';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  Search,
  UserCheck,
  UserX,
  Eye,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const ROLE_PERMISSIONS = {
  admin: {
    label: 'Administrator',
    description: 'Full system access',
    color: 'destructive',
    permissions: [
      'Manage all users and roles',
      'Access all admin functions',
      'View all data and reports',
      'Modify system settings',
      'Access security dashboard'
    ]
  },
  sales_rep: {
    label: 'Sales Representative',
    description: 'Sales and customer management',
    color: 'secondary',
    permissions: [
      'Manage customer quotes',
      'Process orders',
      'View customer data',
      'Generate reports',
      'Manage pricing'
    ]
  },
  fulfilment: {
    label: 'Fulfilment Team',
    description: 'Order processing and shipping',
    color: 'default',
    permissions: [
      'Manage production queue',
      'Process shipments',
      'Update order status',
      'Handle exceptions',
      'Manage assembly jobs'
    ]
  },
  customer: {
    label: 'Customer',
    description: 'Standard customer access',
    color: 'outline',
    permissions: [
      'View own orders',
      'Manage own profile',
      'Submit quotes',
      'Upload files',
      'Track shipments'
    ]
  }
};

const EnhancedRoleManagement = () => {
  const { users, stats, isLoading, assignRole, removeRole } = useUserRoleContext();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [assigningRoles, setAssigningRoles] = useState({});
  const navigate = useNavigate();

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || 
        (selectedRole === 'no_roles' && user.roles.length === 0) ||
        user.roles.some(r => r.role === selectedRole);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // Role statistics
  const roleStats = useMemo(() => {
    return Object.keys(ROLE_PERMISSIONS).reduce((acc, role) => {
      acc[role] = users.filter(u => u.roles.some(r => r.role === role)).length;
      return acc;
    }, {} as Record<string, number>);
  }, [users]);

  const handleAssignRole = async (userId: string, role: string) => {
    setAssigningRoles(prev => ({ ...prev, [userId]: true }));
    try {
      await assignRole(userId, role);
    } finally {
      setAssigningRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    await removeRole(userId, role);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <NavigationTabs />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <NavigationTabs />
      
      <div className="p-6 space-y-6">
        <QuickActionBar />

        {/* Role Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
            const count = roleStats[role] || 0;
            const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(1) : 0;
            
            return (
              <Card key={role} className="relative hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedRole(role)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">{count}</p>
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  {selectedRole === role && (
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role Management Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List with Role Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Role Assignments
                    </CardTitle>
                    <CardDescription>
                      Assign and manage user roles with real-time updates
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/users')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <InviteAdminButton />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search users by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users ({users.length})</SelectItem>
                      <SelectItem value="no_roles">
                        No Roles ({users.filter(u => u.roles.length === 0).length})
                      </SelectItem>
                      <Separator className="my-1" />
                      {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
                        <SelectItem key={role} value={role}>
                          {config.label} ({roleStats[role] || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{user.email}</p>
                              {user.email_confirmed_at ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {user.roles.length > 0 ? (
                              user.roles.map((userRole) => {
                                const roleConfig = ROLE_PERMISSIONS[userRole.role];
                                return (
                      <Badge 
                        key={userRole.id}
                        variant={roleConfig.color as "destructive" | "secondary" | "default" | "outline"}
                        className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                        onClick={() => handleRemoveRole(user.id, userRole.role)}
                      >
                                    <span>{roleConfig.label}</span>
                                    <UserX className="h-3 w-3" />
                                  </Badge>
                                );
                              })
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                No roles assigned
                              </Badge>
                            )}
                          </div>
                          
                          {user.last_sign_in_at && (
                            <p className="text-xs text-muted-foreground">
                              Last sign in: {format(new Date(user.last_sign_in_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Role Assignment */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Select 
                          key={`${user.id}-${user.roles.length}`}
                          onValueChange={(role) => handleAssignRole(user.id, role)}
                          disabled={assigningRoles[user.id]}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder={
                              assigningRoles[user.id] ? "Assigning..." : "Add role"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
                              const isDisabled = user.roles.some(r => r.role === role);
                              return (
                                <SelectItem 
                                  key={role} 
                                  value={role}
                                  disabled={isDisabled}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{config.label}</span>
                                    {isDisabled && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        Assigned
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No users found matching your criteria</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedRole('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role Permissions Reference */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Permissions
                </CardTitle>
                <CardDescription>
                  Detailed permissions for each role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
                  <div 
                    key={role} 
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedRole === role ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={config.color as "destructive" | "secondary" | "default" | "outline"} className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-sm font-medium">{roleStats[role] || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
                    <ul className="text-xs space-y-1">
                      {config.permissions.slice(0, 3).map((permission, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <UserCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span className="truncate">{permission}</span>
                        </li>
                      ))}
                      {config.permissions.length > 3 && (
                        <li className="text-muted-foreground">
                          +{config.permissions.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <UserDetailModal
          user={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
        
        <UserInviteDialog
          open={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
        />
      </div>
    </div>
  );
};

export default EnhancedRoleManagement;