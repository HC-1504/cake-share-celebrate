import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5001/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Password reset link has been sent to your email. Please check your inbox.");
      } else {
        setMessage(data.error || "Failed to send. Please try again later.");
      }
    } catch (error) {
      setMessage("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-4">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle className="text-center text-xl">Forgot Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {message && (
                <div className={`text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                variant="cake"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

                             <div className="text-center text-sm text-muted-foreground">
                 Remember your password?{" "}
                 <Link to="/login" className="text-primary hover:underline">
                   Back to Login
                 </Link>
               </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-sm">{message}</div>
                             <Button variant="cake" className="w-full" asChild>
                 <Link to="/login">Back to Login</Link>
               </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword; 