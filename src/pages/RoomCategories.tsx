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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our comprehensive range of cabinet solutions designed for every space in your home
            </p>
          </div>

          <div className="space-y-8">
            {roomCategories.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Hero Image */}
                  <div className="aspect-video md:aspect-square bg-muted flex items-center justify-center">
                    {room.hero_image_url ? (
                      <img
                        src={room.hero_image_url}
                        alt={room.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                          {room.display_name}
                        </h3>
                        <p className="text-muted-foreground">
                          Premium cabinet solutions
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Content & Navigation */}
                  <CardContent className="p-8 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      {room.display_name}
                    </h2>
                    <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                      {room.description}
                    </p>
                    
                    <div className="space-y-4">
                      <Link to={`/shop/${room.name}`}>
                        <Button size="lg" className="w-full">
                          Browse {room.display_name}
                        </Button>
                      </Link>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Link to={`/shop/${room.name}/base`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Base Cabinets
                          </Button>
                        </Link>
                        <Link to={`/shop/${room.name}/wall`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Wall Cabinets
                          </Button>
                        </Link>
                        {room.name === 'kitchen' && (
                          <>
                            <Link to={`/shop/${room.name}/tall`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Tall Cabinets
                              </Button>
                            </Link>
                            <Link to={`/shop/${room.name}/specialty`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Specialty
                              </Button>
                            </Link>
                          </>
                        )}
                        {room.name === 'laundry' && (
                          <>
                            <Link to={`/shop/${room.name}/broom`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Broom Cabinets
                              </Button>
                            </Link>
                            <Link to={`/shop/${room.name}/storage`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Storage
                              </Button>
                            </Link>
                          </>
                        )}
                        {(room.name === 'vanity' || room.name === 'wardrobe') && (
                          <>
                            <Link to={`/shop/${room.name}/mirrors`}>
                              <Button variant="outline" size="sm" className="w-full">
                                {room.name === 'vanity' ? 'Mirrors' : 'Hanging'}
                              </Button>
                            </Link>
                            <Link to={`/shop/${room.name}/storage`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Storage
                              </Button>
                            </Link>
                          </>
                        )}
                        {room.name === 'outdoor-kitchen' && (
                          <>
                            <Link to={`/shop/${room.name}/specialty`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Specialty
                              </Button>
                            </Link>
                            <Link to={`/shop/${room.name}/weatherproof`}>
                              <Button variant="outline" size="sm" className="w-full">
                                Weather Resistant
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}