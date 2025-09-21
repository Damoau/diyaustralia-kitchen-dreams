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
  TestTube,
  Palette,
  ExternalLink,
  Home,
  Store,
  List,
} from 'lucide-react';

const navigationItems = [
  {
    group: 'Overview',
    items: [
      { title: 'Dashboard', url: 'overview', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Frontend Links',
    items: [
      { title: 'View Website', url: '/', icon: Home, external: true },
      { title: 'Shop', url: '/shop', icon: Store, external: true },
      { title: 'Price List', url: '/price-list', icon: List, external: true },
      { title: 'Products', url: '/products', icon: Package, external: true },
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
      { title: 'Room Categories', url: 'room-categories', icon: Home },
      { title: 'Categories & Subcategories', url: 'categories', icon: Palette },
      { title: 'Cabinet Management', url: 'cabinets', icon: Package },
      { title: 'Cabinet Configurator', url: 'cabinet-configurator', icon: Settings },
      { title: 'Door Styles & Colors', url: 'door-styles', icon: Palette },
      { title: 'Hardware Manager', url: 'hardware-manager', icon: Wrench },
      { title: 'Materials & Pricing', url: 'materials', icon: DollarSign },
      { title: 'Configuration Migration', url: 'configuration-migration', icon: MapPin },
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
      { title: 'Testing', url: 'testing', icon: TestTube },
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
                      {item.external ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:bg-muted/50"
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                          {!isCollapsed && <ExternalLink className="ml-auto h-3 w-3 opacity-60" />}
                        </a>
                      ) : (
                        <NavLink 
                          to={item.url} 
                          className={getNavClass(item.url)}
                          relative="path"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      )}
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