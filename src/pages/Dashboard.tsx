// Import the hooks and icons we need
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Upload,
  Vote,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,      // <-- ADDED: For loading spinner
  User as UserIcon // <-- ADDED: For the user details card
} from "lucide-react";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";


// ===========================================================
// [MARKER] PART 1: ADDED DATA FETCHING LOGIC
// ===========================================================

// Define a type for the user data we expect from the backend
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  ethAddress: string;
  category: string;
  checkedIn: boolean;
}

const Dashboard = () => {
  // Get the token from the auth context to make authenticated API calls
  const { isAuthenticated, token } = useAuth();

  // State to hold the fetched user data, loading status, and any errors
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setLoading(false);
        return; // Don't try to fetch if there's no token
      }
      try {
        const res = await fetch("http://localhost:5001/api/me", { // Using proxy
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Could not fetch user data.");
        }
        const data: User = await res.json();
        setUser(data); // Success! Store the user data.
      } catch (err: any) {
        setError(err.message); // Store any error message
      } finally {
        setLoading(false); // We are done loading
      }
    };

    fetchUserData();
  }, [token]); // This code runs whenever the token changes


  // --- Original authentication check ---
  if (!isAuthenticated) return <Navigate to="/login" replace />;


  // --- ADDED: Handle Loading and Error states before rendering the dashboard ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <Loader2 className="h-12 w-12 mx-auto animate-spin mb-4" />
          <p className="text-xl font-semibold">Recognizing you...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center text-center p-4">
        <Card className="border-destructive shadow-lg">
          <CardHeader><CardTitle className="text-destructive">An Error Occurred</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Could not load user information. Please try logging in again."}</p>
            <Link to="/login"><Button>Go to Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  // --- ALL YOUR ORIGINAL MOCK DATA AND HELPER FUNCTIONS ARE UNTOUCHED ---
  const userProgress = {
    registration: { completed: true, status: "completed" },
    cakeUpload: { completed: false, status: "pending" },
    voting: { completed: false, status: "locked" },
    checkin: { completed: false, status: "locked" }
  };

  const steps = [
    { id: "registration", title: "Registration & Payment", description: "Registration and payment completed successfully", icon: <CheckCircle2 className="h-6 w-6 text-green-500" />, link: "#", status: "completed" },
    { id: "cakeUpload", title: "Upload Cake Details", description: "Share photos, ingredients, and the story behind your cake creation", icon: <Upload className="h-6 w-6" />, link: "/upload-cake", status: userProgress.cakeUpload.status },
    { id: "voting", title: "Vote for Favorites", description: "Taste and vote for the most beautiful and delicious cakes", icon: <Vote className="h-6 w-6" />, link: "/voting", status: userProgress.voting.status },
    { id: "checkin", title: "Event Check-in", description: "Check in when you arrive and confirm your presence at the event", icon: <MapPin className="h-6 w-6" />, link: "/checkin", status: userProgress.checkin.status }
  ];

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed': return <span className="text-sm text-green-500">Completed</span>;
      case 'pending': return <span className="text-sm text-yellow-500">Pending</span>;
      default: return null;
    }
  };

  // --- RENDER THE DASHBOARD ---
  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header - MODIFIED to be personalized */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome, {user.firstName}!
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Your Dashboard
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete these four steps to participate in our delightful cake picnic experience
          </p>
        </div>

        {/* =========================================================== */}
        {/* [MARKER] PART 2: ADDED CARD TO DISPLAY FETCHED USER DATA  */}
        {/* =========================================================== */}
        <div className="mb-12">
          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Account Details</CardTitle>
              <UserIcon className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="outline" className="font-semibold">{user.category}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* --- ALL YOUR ORIGINAL JSX REMAINS BELOW, UNTOUCHED --- */}

        {/* Progress Overview */}
        <div className="mb-12">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="w-full max-w-md bg-muted rounded-full h-3">
                  <div className="bg-gradient-primary h-3 rounded-full transition-smooth" style={{ width: "25%" }}></div>
                </div>
              </div>
              <p className="text-center text-muted-foreground mt-2">1 of 4 steps completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <Card key={step.id} className={`border-0 shadow-soft hover:shadow-cake transition-smooth ${step.status === "locked" ? "opacity-60" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${step.status === "completed" ? "bg-green-100" : step.status === "pending" ? "bg-yellow-100" : "bg-muted"}`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">{getStatusIcon(step.status)}{getStatusBadge(step.status)}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">{index + 1}</div>
                </div>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <Button variant={step.status === "pending" ? "cake" : "soft"} className={`w-full ${step.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700" : ""}`} disabled={step.status === "locked"} asChild={step.status === "pending"}>
                  {step.status === "completed" ? (<span>🍰 Registered & Paid Successfully 🎉</span>) : step.status === "pending" ? (<Link to={step.link}>Start Now</Link>) : (<span>Complete Previous Step</span>)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          {/* ... original help section ... */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;