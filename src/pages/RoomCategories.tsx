import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  hero_image_url?: string;
  sort_order: number;
}

interface CategoryType {
  id: string;
  name: string;
  display_name: string;
  parent_id: string;
  sort_order: number;
}

interface RoomWithTypes {
  room: RoomCategory;
  types: CategoryType[];
}

export default function RoomCategories() {
  const [roomsWithTypes, setRoomsWithTypes] = useState<RoomWithTypes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomsAndTypes();
  }, []);

  const loadRoomsAndTypes = async () => {
    try {
      // Load Level 1 (rooms) and Level 2 (types) categories
      const { data: allCategories, error } = await supabase
        .from('unified_categories')
        .select('*')
        .in('level', [1, 2])
        .eq('active', true)
        .order('level')
        .order('sort_order');

      if (error) throw error;

      // Separate rooms and types
      const rooms = allCategories?.filter(cat => cat.level === 1) || [];
      const types = allCategories?.filter(cat => cat.level === 2) || [];

      // Build the structure
      const roomsWithTypesData = rooms.map(room => ({
        room: room as RoomCategory,
        types: types.filter(type => type.parent_id === room.id) as CategoryType[]
      }));

      setRoomsWithTypes(roomsWithTypesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Shop Cabinet Collections | Kitchen, Laundry, Vanity & More</title>
        <meta name="description" content="Browse our complete range of cabinet collections for kitchen, laundry, vanity, wardrobe and outdoor kitchen spaces. Premium quality cabinets for every room." />
        <meta name="keywords" content="kitchen cabinets, laundry cabinets, vanity cabinets, wardrobe systems, outdoor kitchen, cabinet collections" />
      </Helmet>

      <DynamicHeader />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Cabinet Collections
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover our comprehensive range of cabinet solutions designed for every space in your home
            </p>
          </div>

          {/* Dynamic Cabinet Collections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {roomsWithTypes.map(({ room, types }) => (
              <Card key={room.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={room.hero_image_url || "/src/assets/hero-kitchen.jpg"}
                    alt={room.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                    {room.display_name}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {types.map(type => (
                      <Link key={type.id} to={`/shop/${room.name}/${type.name}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          {type.display_name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}