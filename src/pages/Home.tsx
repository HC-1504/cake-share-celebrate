import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Cake, Users, Trophy, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-cake-picnic.jpg";

const Home = () => {
  const features = [
    {
      icon: <Cake className="h-8 w-8 text-primary" />,
      title: "Bring Your Cake",
      description: "Share your homemade masterpiece with fellow cake lovers"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Community Picnic",
      description: "Join a warm community of baking enthusiasts"
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Voting & Prizes",
      description: "Vote for the most beautiful and delicious cakes"
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Event Check-in",
      description: "Easy check-in system to track your participation"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Sweet Community
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Cake Picnic
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Join our delightful community cake picnic! Bring your homemade cake, 
                taste amazing creations, vote for favorites, and make sweet memories with fellow baking enthusiasts.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button variant="cake" size="lg" asChild>
                  <Link to="/register">Join the Picnic</Link>
                </Button>
                <Button variant="soft" size="lg" asChild>
                  <Link to="/gallery">View Gallery</Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Cake Picnic Scene"
                  className="w-full rounded-2xl shadow-cake object-cover aspect-video"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to join our delightful cake picnic experience
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-soft hover:shadow-cake transition-smooth">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-accent">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
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
            Ready to Share Your Sweet Creation?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join our cake picnic community and be part of something delicious!
          </p>
          <div className="mt-8">
            <Button variant="cake" size="lg" className="text-lg px-8" asChild>
              <Link to="/register">Get Started Today</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;