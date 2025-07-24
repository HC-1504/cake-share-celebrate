import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";

const mockCakes = [
  { id: 1, title: "Elegant Floral Layer Cake", baker: "Sarah M." },
  { id: 2, title: "Rustic Chocolate Berry Cake", baker: "Mike R." },
  { id: 3, title: "Rainbow Celebration Cake", baker: "Emma L." }
];

const Voting = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const [votedId, setVotedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVote = async (id: number) => {
    setError("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cakeId: id }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      setVotedId(id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to vote");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <div className="max-w-lg w-full space-y-8">
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">Vote for Your Favorite Cake</h2>
        <div className="grid gap-6">
          {mockCakes.map((cake) => (
            <Card key={cake.id} className="border-0 shadow-cake">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xl font-semibold text-foreground">{cake.title}</div>
                  <div className="text-muted-foreground text-sm">by {cake.baker}</div>
                </div>
                <Button
                  variant={votedId === cake.id ? "cake" : "soft"}
                  className="mt-4 md:mt-0"
                  disabled={!!votedId}
                  onClick={() => handleVote(cake.id)}
                >
                  {votedId === cake.id ? "Voted" : "Vote"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {error && <div className="text-center text-red-600 font-semibold mt-4">{error}</div>}
        {success && votedId && (
          <div className="text-center text-green-600 font-semibold mt-4">Thank you for voting!</div>
        )}
      </div>
    </div>
  );
};

export default Voting; 