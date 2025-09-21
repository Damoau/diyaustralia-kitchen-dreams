import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  hero_image_url?: string;
  sort_order: number;
}

export default function RoomCategories() {
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomCategories();
  }, []);

  const loadRoomCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('room_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      setRoomCategories(data || []);
    } catch (error) {
      console.error('Error loading room categories:', error);
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

          {/* All Cabinet Collections in Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Kitchen Cabinets */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src="/src/assets/hero-kitchen.jpg"
                  alt="Kitchen Cabinets"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Kitchen Cabinets
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/shop/kitchen/base">
                    <Button variant="outline" size="sm" className="w-full">
                      Base
                    </Button>
                  </Link>
                  <Link to="/shop/kitchen/wall">
                    <Button variant="outline" size="sm" className="w-full">
                      Wall
                    </Button>
                  </Link>
                  <Link to="/shop/kitchen/tall">
                    <Button variant="outline" size="sm" className="w-full">
                      Pantry
                    </Button>
                  </Link>
                  <Link to="/shop/kitchen/specialty">
                    <Button variant="outline" size="sm" className="w-full">
                      Specialty
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Laundry Cabinets */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src="/src/assets/shadowline-kitchen.jpg"
                  alt="Laundry Cabinets"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Laundry Cabinets
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/shop/laundry/base">
                    <Button variant="outline" size="sm" className="w-full">
                      Base
                    </Button>
                  </Link>
                  <Link to="/shop/laundry/wall">
                    <Button variant="outline" size="sm" className="w-full">
                      Wall
                    </Button>
                  </Link>
                  <Link to="/shop/laundry/broom">
                    <Button variant="outline" size="sm" className="w-full">
                      Broom
                    </Button>
                  </Link>
                  <Link to="/shop/laundry/storage">
                    <Button variant="outline" size="sm" className="w-full">
                      Storage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Vanity Cabinets */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src="/src/assets/cabinets-detail.jpg"
                  alt="Vanity Cabinets"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Vanity Cabinets
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/shop/vanity/base">
                    <Button variant="outline" size="sm" className="w-full">
                      Base
                    </Button>
                  </Link>
                  <Link to="/shop/vanity/wall">
                    <Button variant="outline" size="sm" className="w-full">
                      Wall
                    </Button>
                  </Link>
                  <Link to="/shop/vanity/mirrors">
                    <Button variant="outline" size="sm" className="w-full">
                      Mirrors
                    </Button>
                  </Link>
                  <Link to="/shop/vanity/storage">
                    <Button variant="outline" size="sm" className="w-full">
                      Storage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Wardrobe Cabinets */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src="/src/assets/benchtop-detail.jpg"
                  alt="Wardrobe Cabinets"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Wardrobe Cabinets
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/shop/wardrobe/base">
                    <Button variant="outline" size="sm" className="w-full">
                      Base
                    </Button>
                  </Link>
                  <Link to="/shop/wardrobe/wall">
                    <Button variant="outline" size="sm" className="w-full">
                      Wall
                    </Button>
                  </Link>
                  <Link to="/shop/wardrobe/hanging">
                    <Button variant="outline" size="sm" className="w-full">
                      Hanging
                    </Button>
                  </Link>
                  <Link to="/shop/wardrobe/storage">
                    <Button variant="outline" size="sm" className="w-full">
                      Storage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Outdoor Kitchen Cabinets */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src="/lovable-uploads/8bf7a8e1-3389-40d8-bd11-5ff1d7de50e8.png"
                  alt="Outdoor Kitchen Cabinets"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Outdoor Kitchen
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/shop/outdoor-kitchen/base">
                    <Button variant="outline" size="sm" className="w-full">
                      Base
                    </Button>
                  </Link>
                  <Link to="/shop/outdoor-kitchen/wall">
                    <Button variant="outline" size="sm" className="w-full">
                      Wall
                    </Button>
                  </Link>
                  <Link to="/shop/outdoor-kitchen/specialty">
                    <Button variant="outline" size="sm" className="w-full">
                      Specialty
                    </Button>
                  </Link>
                  <Link to="/shop/outdoor-kitchen/weatherproof">
                    <Button variant="outline" size="sm" className="w-full">
                      Weather Resistant
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}