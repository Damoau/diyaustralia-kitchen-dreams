import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";

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
        .from('unified_categories')
        .select('*')
        .eq('name', room)
        .eq('level', 1)
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
      // Get room category ID first
      const { data: roomData, error: roomError } = await supabase
        .from('unified_categories')
        .select('id')
        .eq('name', room)
        .eq('level', 1)
        .single();

      if (roomError) throw roomError;

      // Get cabinet types for this room
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('category, room_category_id')
        .eq('active', true)
        .eq('room_category_id', roomData.id);

      if (error) throw error;

      // Count categories
      const counts = data?.reduce((acc, cabinet) => {
        acc[cabinet.category] = (acc[cabinet.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const stats = Object.entries(counts).map(([category, count]) => ({
        category,
        count
      }));

      setCategoryStats(stats);
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
    <ImpersonationLayout>
      <Helmet>
        <title>{roomCategory?.display_name} | Premium Cabinet Solutions</title>
        <meta name="description" content="Browse our premium cabinet collection by category. Each cabinet is crafted with precision and designed for lasting quality." />
        <meta name="keywords" content="cabinets, kitchen cabinets, base cabinets, top cabinets, pantry cabinets, premium storage" />
      </Helmet>

      <DynamicHeader />

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
                {roomCategory?.display_name}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Cabinet Shop
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Browse our premium cabinet collection by category. Each cabinet is crafted with precision and designed for lasting quality.
            </p>
          </div>

          {/* Category Options */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-4">
              {categoryStats.map((stat) => (
                <Link key={stat.category} to={`/shop/${room}/${stat.category}`}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full h-16 text-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {getCategoryDisplayName(stat.category)}
                  </Button>
                </Link>
              ))}
            </div>
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

      <Footer />
    </ImpersonationLayout>
  );
}