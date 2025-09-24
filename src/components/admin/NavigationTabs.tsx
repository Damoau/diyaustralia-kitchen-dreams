import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Shield, UserCheck, Settings, BarChart3, ArrowRight } from 'lucide-react';
import { useUserRoleContext } from './UserRoleContext';

export const NavigationTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, isLoading } = useUserRoleContext();

  const currentTab = location.pathname.includes('/admin/users') ? 'users' : 'roles';

  const handleTabChange = (value: string) => {
    if (value === 'users') {
      navigate('/admin/users');
    } else if (value === 'roles') {
      navigate('/admin/roles');
    }
  };

  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
              {!isLoading && (
                <Badge variant="secondary" className="ml-1">
                  {stats.totalUsers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Management
              {!isLoading && (
                <Badge variant="secondary" className="ml-1">
                  {stats.adminUsers + stats.salesReps}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className={currentTab === 'users' ? 'bg-primary/10' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/roles')}
            className={currentTab === 'roles' ? 'bg-primary/10' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            Permissions View
          </Button>
        </div>
      </div>
    </div>
  );
};