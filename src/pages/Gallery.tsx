import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Cake } from "lucide-react";
import ModelViewer from "@/components/ModelViewer";
import SimpleModelViewer from "@/components/SimpleModelViewer";
import ErrorBoundary from "@/components/ErrorBoundary";

interface Cake {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  fileType: string;
  tableNumber: number;
  seatNumber: number;
  story: string;
  UserId: number;
  createdAt: string;
  User?: {
    firstName: string;
    lastName: string;
  };
}

const Gallery = () => {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchCakes();
  }, []);

  const fetchCakes = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/cakes/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCakes(data);
      } else {
        console.error('Failed to fetch cakes');
      }
    } catch (error) {
      console.error('Error fetching cakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", "Most Beautiful", "Most Delicious", "People's Choice", "Traditional", "Seasonal", "Creative"];

  const filteredCakes = selectedCategory === "All" 
    ? cakes 
    : cakes.filter(cake => cake.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading cakes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Cake
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Gallery
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover the amazing cakes created by our talented community members. 
            Get inspired by their creativity and stories behind each delicious masterpiece.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "cake" : "soft"}
                size="sm"
                className="mb-2"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCakes.length === 0 ? (
            <div className="text-center py-20">
              <Cake className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No cakes found</h3>
              <p className="text-muted-foreground">No cakes match the selected category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCakes.map((cake) => (
                <Card key={cake.id} className="overflow-hidden border-0 shadow-soft hover:shadow-cake transition-smooth group">
                  <div className="relative overflow-hidden">
                    <div className="w-full h-64">
                      {cake.fileType === 'image' ? (
                        <img
                          src={`http://localhost:5001${cake.imageUrl}`}
                          alt={cake.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                                             ) : (
                         <div className="w-full h-full">
                           <ErrorBoundary 
                             modelUrl={`http://localhost:5001${cake.imageUrl}`}
                             className="w-full h-full"
                           >
                             <ModelViewer 
                               modelUrl={`http://localhost:5001${cake.imageUrl}`}
                               className="w-full h-full"
                             />
                           </ErrorBoundary>
                         </div>
                       )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        {cake.fileType === 'image' ? 'Photo' : '3D Model'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="outline" className="bg-background/80">
                        Table {cake.tableNumber} - Seat {cake.seatNumber}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {cake.title}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-2">
                      by {cake.User?.firstName} {cake.User?.lastName}
                    </p>
                    <p className="text-muted-foreground text-sm mb-3">
                      {cake.description}
                    </p>
                    {cake.story && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <h4 className="font-semibold text-sm mb-1">Cake Story</h4>
                        <p className="text-xs text-muted-foreground">{cake.story}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Want to Showcase Your Cake?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join our next cake picnic and share your delicious creation with our community!
          </p>
          <div className="mt-8">
            <Button variant="cake" size="lg" asChild>
              <Link to="/register">Join the Next Event</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;