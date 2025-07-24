import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";

const Checkin = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const [status, setStatus] = useState<'none' | 'in' | 'out'>('none');
  const [error, setError] = useState("");

  const handleCheckin = async () => {
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to check in");
      setStatus('in');
    } catch (err: any) {
      setError(err.message || "Failed to check in");
    }
  };
  const handleCheckout = async () => {
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to check out");
      setStatus('out');
    } catch (err: any) {
      setError(err.message || "Failed to check out");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <CardTitle className="text-center text-xl">Event Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            {status === 'none' && <div className="text-muted-foreground">You have not checked in yet.</div>}
            {status === 'in' && <div className="text-green-600 font-semibold">You are checked in!</div>}
            {status === 'out' && <div className="text-blue-600 font-semibold">You have checked out.</div>}
            {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
          </div>
          <div className="flex flex-col gap-4">
            <Button variant="cake" className="w-full" onClick={handleCheckin} disabled={status === 'in' || status === 'out'}>
              Check In
            </Button>
            <Button variant="soft" className="w-full" onClick={handleCheckout} disabled={status !== 'in'}>
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkin; 