import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  CreditCard, 
  Upload, 
  Vote, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertCircle 
} from "lucide-react";

const Dashboard = () => {
  // Mock user progress - in real app this would come from backend
  const userProgress = {
    registration: { completed: false, status: "pending" },
    cakeUpload: { completed: false, status: "locked" },
    voting: { completed: false, status: "locked" },
    checkin: { completed: false, status: "locked" }
  };

  const steps = [
    {
      id: "registration",
      title: "Registration & Payment",
      description: "Complete your registration and pay the entry fee to secure your spot",
      icon: <CreditCard className="h-6 w-6" />,
      link: "/register",
      status: userProgress.registration.status
    },
    {
      id: "cakeUpload",
      title: "Upload Cake Details",
      description: "Share photos, ingredients, and the story behind your cake creation",
      icon: <Upload className="h-6 w-6" />,
      link: "/upload-cake",
      status: userProgress.cakeUpload.status
    },
    {
      id: "voting",
      title: "Vote for Favorites",
      description: "Taste and vote for the most beautiful and delicious cakes",
      icon: <Vote className="h-6 w-6" />,
      link: "/voting",
      status: userProgress.voting.status
    },
    {
      id: "checkin",
      title: "Event Check-in",
      description: "Check in when you arrive and confirm your presence at the event",
      icon: <MapPin className="h-6 w-6" />,
      link: "/checkin",
      status: userProgress.checkin.status
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "locked":
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "locked":
        return <Badge variant="secondary">Locked</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your Cake Picnic
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete these four steps to participate in our delightful cake picnic experience
          </p>
        </div>

        {/* Progress Overview */}
        <div className="mb-12">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="w-full max-w-md bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-primary h-3 rounded-full transition-smooth" 
                    style={{ width: "25%" }} // This would be dynamic based on completed steps
                  ></div>
                </div>
              </div>
              <p className="text-center text-muted-foreground mt-2">
                1 of 4 steps completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={step.id} 
              className={`border-0 shadow-soft hover:shadow-cake transition-smooth ${
                step.status === "locked" ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${
                      step.status === "completed" ? "bg-green-100" :
                      step.status === "pending" ? "bg-yellow-100" :
                      "bg-muted"
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(step.status)}
                        {getStatusBadge(step.status)}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  {step.description}
                </p>

                <Button 
                  variant={step.status === "pending" ? "cake" : "soft"}
                  className="w-full" 
                  disabled={step.status === "locked"}
                  asChild={step.status !== "locked"}
                >
                  {step.status !== "locked" ? (
                    <Link to={step.link}>
                      {step.status === "completed" ? "View Details" : "Start Now"}
                    </Link>
                  ) : (
                    <span>Complete Previous Step</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <Card className="border-0 shadow-soft bg-gradient-secondary">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Need Help?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                If you have any questions about the process or need assistance, 
                feel free to reach out to our support team.
              </p>
              <Button variant="soft" size="lg">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;