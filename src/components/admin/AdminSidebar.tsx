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
} from 'lucide-react';

const navigationItems = [
  {
    group: 'Overview',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Sales',
    items: [
      { title: 'Carts', url: '/admin/sales/carts', icon: ShoppingCart },
      { title: 'Quotes', url: '/admin/sales/quotes', icon: FileText },
    ]
  },
  {
    group: 'Operations',
    items: [
      { title: 'Orders', url: '/admin/orders', icon: Package },
      { title: 'Production', url: '/admin/production', icon: Factory },
      { title: 'Shipping', url: '/admin/shipping', icon: Truck },
      { title: 'Assembly', url: '/admin/assembly', icon: Wrench },
    ]
  },
  {
    group: 'Configuration',
    items: [
      { title: 'Pricing', url: '/admin/pricing', icon: DollarSign },
      { title: 'Discounts', url: '/admin/discounts', icon: DollarSign },
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Roles', url: '/admin/roles', icon: Users },
    ]
  },
  {
    group: 'Analytics',
    items: [
      { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
      { title: 'Exports', url: '/admin/exports', icon: BarChart3 },
    ]
  },
  {
    group: 'System',
    items: [
      { title: 'Notifications', url: '/admin/notifications', icon: Bell },
      { title: 'Settings', url: '/admin/settings', icon: Settings },
    ]
  },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
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
                        end={item.url === '/admin'}
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