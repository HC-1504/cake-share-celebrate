import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import sampleCake1 from "@/assets/sample-cake-1.jpg";
import sampleCake2 from "@/assets/sample-cake-2.jpg";
import sampleCake3 from "@/assets/sample-cake-3.jpg";

const Gallery = () => {
  const cakes = [
    {
      id: 1,
      image: sampleCake1,
      title: "Elegant Floral Layer Cake",
      baker: "Sarah M.",
      description: "A beautiful three-layer vanilla cake with buttercream roses and delicate sugar flowers.",
      category: "Most Beautiful"
    },
    {
      id: 2,
      image: sampleCake2,
      title: "Rustic Chocolate Berry Cake",
      baker: "Mike R.",
      description: "Rich chocolate cake with fresh berries and whipped cream, decorated with a rustic charm.",
      category: "Most Delicious"
    },
    {
      id: 3,
      image: sampleCake3,
      title: "Rainbow Celebration Cake",
      baker: "Emma L.",
      description: "A colorful rainbow layer cake that brings joy and celebration to any gathering.",
      category: "People's Choice"
    },
    {
      id: 4,
      image: sampleCake1,
      title: "Classic Red Velvet",
      baker: "David K.",
      description: "Traditional red velvet with cream cheese frosting and elegant piping details.",
      category: "Traditional"
    },
    {
      id: 5,
      image: sampleCake2,
      title: "Seasonal Fruit Tart",
      baker: "Lisa P.",
      description: "Fresh seasonal fruits arranged beautifully on a vanilla custard base.",
      category: "Seasonal"
    },
    {
      id: 6,
      image: sampleCake3,
      title: "Whimsical Unicorn Cake",
      baker: "Alex J.",
      description: "A magical unicorn-themed cake that brings out the child in everyone.",
      category: "Creative"
    }
  ];

  const categories = ["All", "Most Beautiful", "Most Delicious", "People's Choice", "Traditional", "Seasonal", "Creative"];

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
                variant={category === "All" ? "cake" : "soft"}
                size="sm"
                className="mb-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cakes.map((cake) => (
              <Card key={cake.id} className="overflow-hidden border-0 shadow-soft hover:shadow-cake transition-smooth group">
                <div className="relative overflow-hidden">
                  <img
                    src={cake.image}
                    alt={cake.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-smooth"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      {cake.category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {cake.title}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-2">
                    by {cake.baker}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {cake.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
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