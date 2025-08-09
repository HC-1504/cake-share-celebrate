import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Users, Trophy, Clock } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Community Love",
      description: "Bringing people together through the joy of homemade cakes and shared experiences."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Inclusive Environment",
      description: "Welcome bakers of all skill levels, from beginners to seasoned professionals."
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Celebrating Creativity",
      description: "Every cake tells a story, and we celebrate the creativity behind each creation."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Sweet Memories",
      description: "Creating lasting memories through shared experiences and delicious moments."
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Registration",
      description: "Sign up for the event and secure your spot with registration."
    },
    {
      step: "2",
      title: "Upload Cake",
      description: "Share photos, ingredients, and the story behind your homemade creation."
    },
    {
      step: "3",
      title: "Check In",
      description: "Check in when you arrive at the event location."
    },
    {
      step: "4",
      title: "Vote",
      description: "Taste test and vote for the most beautiful and delicious cakes."
    },
    {
      step: "5",
      title: "Check Out",
      description: "Check out when you're ready to leave the event."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            About Our
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Cake Picnic
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
            Our cake picnic is more than just an event—it's a celebration of community, 
            creativity, and the simple joy that comes from sharing homemade treats with others. 
            Join us for a sweet adventure that brings people together through the universal language of cake.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              What makes our cake picnic community special
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-0 shadow-soft hover:shadow-cake transition-smooth">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-accent">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four simple steps to join our delightful experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="border-0 shadow-soft hover:shadow-cake transition-smooth h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary text-primary-foreground rounded-full text-xl font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gradient-primary"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Join Our Sweet Community?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Be part of something delicious and make new friends who share your love for baking!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="cake" size="lg" asChild>
              <Link to="/register">Join the Picnic</Link>
            </Button>
            <Button variant="soft" size="lg" asChild>
              <Link to="/gallery">View Gallery</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;