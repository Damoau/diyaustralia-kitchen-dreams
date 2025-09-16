import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Settings,
  Users,
  BarChart3,
  Bell,
  DollarSign,
  Wrench,
  MapPin,
  Factory,
  Shield,
} from 'lucide-react';

const navigationItems = [
  {
    group: 'Overview',
    items: [
      { title: 'Dashboard', url: 'overview', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Sales',
    items: [
      { title: 'Carts', url: 'sales/carts', icon: ShoppingCart },
      { title: 'Quotes', url: 'sales/quotes', icon: FileText },
    ]
  },
  {
    group: 'Operations',
    items: [
      { title: 'Orders', url: 'orders', icon: Package },
      { title: 'Production', url: 'production', icon: Factory },
      { title: 'Shipping', url: 'shipping', icon: Truck },
      { title: 'Assembly', url: 'assembly', icon: Wrench },
    ]
  },
  {
    group: 'Configuration',
    items: [
      { title: 'Pricing', url: 'pricing', icon: DollarSign },
      { title: 'Discounts', url: 'discounts', icon: DollarSign },
      { title: 'Users', url: 'users', icon: Users },
      { title: 'Roles', url: 'roles', icon: Users },
    ]
  },
  {
    group: 'Analytics',
    items: [
      { title: 'Reports', url: 'reports', icon: BarChart3 },
      { title: 'Exports', url: 'exports', icon: BarChart3 },
    ]
  },
  {
    group: 'System',
    items: [
      { title: 'Security', url: 'security', icon: Shield },
      { title: 'Roles', url: 'roles', icon: Users },
      { title: 'Notifications', url: 'notifications', icon: Bell },
      { title: 'Settings', url: 'settings', icon: Settings },
    ]
  },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === 'overview') {
      return currentPath === '/admin' || currentPath === '/admin/overview';
    }
    return currentPath.includes(path);
  };

  const getNavClass = (path: string) => 
    isActive(path) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        {navigationItems.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         className={getNavClass(item.url)}
                         relative="path"
                       >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};