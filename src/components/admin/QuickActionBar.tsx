import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  UserPlus, 
  Download, 
  Search,
  Filter,
  ArrowRight,
  Eye,
  Settings
} from 'lucide-react';
import { useUserRoleContext } from './UserRoleContext';

export const QuickActionBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, users, isLoading } = useUserRoleContext();

  const isUsersPage = location.pathname.includes('/admin/users');
  const isRolesPage = location.pathname.includes('/admin/roles');

  const recentlyCreatedUsers = users
    .filter(user => {
      const createdAt = new Date(user.created_at || '');
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > dayAgo;
    }).length;

  const unverifiedUsers = users.filter(user => !user.email_confirmed_at).length;
  const usersWithoutRoles = users.filter(user => user.roles.length === 0).length;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Quick Stats:</span>
              {!isLoading && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {stats.totalUsers} Total
                  </Badge>
                  {unverifiedUsers > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      {unverifiedUsers} Unverified
                    </Badge>
                  )}
                  {usersWithoutRoles > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {usersWithoutRoles} No Roles
                    </Badge>
                  )}
                  {recentlyCreatedUsers > 0 && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      {recentlyCreatedUsers} New Today
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cross-navigation buttons */}
            {isUsersPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/roles')}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Manage Roles & Permissions
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}

            {isRolesPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                View User Analytics
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}

            {/* Common actions */}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};