import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  hero_image_url?: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

export default function RoomCategory() {
  const { room } = useParams<{ room: string }>();
  const [roomCategory, setRoomCategory] = useState<RoomCategory | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (room) {
      loadRoomCategory();
      loadCategoryStats();
    }
  }, [room]);

  const loadRoomCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('room_categories')
        .select('*')
        .eq('name', room)
        .eq('active', true)
        .single();

      if (error) throw error;
      setRoomCategory(data);
    } catch (error) {
      console.error('Error loading room category:', error);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('category, room_category_id')
        .eq('active', true);

      if (error) throw error;

      // Get room category ID first
      const { data: roomData } = await supabase
        .from('room_categories')
        .select('id')
        .eq('name', room)
        .single();

      if (roomData) {
        // Filter by room and count categories
        const roomCabinets = data?.filter(cabinet => cabinet.room_category_id === roomData.id) || [];
        const counts = roomCabinets.reduce((acc, cabinet) => {
          acc[cabinet.category] = (acc[cabinet.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const stats = Object.entries(counts).map(([category, count]) => ({
          category,
          count
        }));

        setCategoryStats(stats);
      }
    } catch (error) {
      console.error('Error loading category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!roomCategory) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Room category not found</h1>
        <Link to="/shop">
          <Button className="mt-4">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{roomCategory.display_name} | Premium Cabinet Solutions</title>
        <meta name="description" content={`Browse our ${roomCategory.display_name.toLowerCase()} collection. ${roomCategory.description}`} />
        <meta name="keywords" content={`${roomCategory.name} cabinets, ${roomCategory.name} storage, ${roomCategory.name} organization`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/shop">Shop</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-foreground font-medium">
                {roomCategory.display_name}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Hero Section */}
          <div className="mb-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  {roomCategory.display_name}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {roomCategory.description}
                </p>
              </div>
              {roomCategory.hero_image_url && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={roomCategory.hero_image_url}
                    alt={roomCategory.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStats.map((stat) => (
              <Card key={stat.category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{getCategoryDisplayName(stat.category)}</span>
                    <Badge variant="secondary">{stat.count} products</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Explore our {getCategoryDisplayName(stat.category).toLowerCase()} collection
                  </p>
                  <Link to={`/shop/${room}/${stat.category}`}>
                    <Button className="w-full">
                      View {getCategoryDisplayName(stat.category)}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {categoryStats.length === 0 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                No products available yet
              </h2>
              <p className="text-muted-foreground mb-6">
                We're working on adding products to this category.
              </p>
              <Link to="/shop">
                <Button>Browse Other Categories</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}