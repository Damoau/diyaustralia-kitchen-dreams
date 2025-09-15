import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export const PortalBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbMap: Record<string, string> = {
    portal: "Dashboard",
    quotes: "Quotes",
    orders: "Orders", 
    files: "Files",
    messages: "Messages",
    profile: "Profile",
    addresses: "Addresses"
  };

  if (pathSegments.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link 
        to="/portal" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathSegments.slice(1).map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 2).join('/');
        const isLast = index === pathSegments.length - 2;
        const label = breadcrumbMap[segment] || segment;
        
        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link 
                to={path} 
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};