import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { Cake, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/App";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Move to payment step instead of registering immediately
    setStep('payment');
  };

  const handlePayment = async () => {
    setPaymentSuccess(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Registration failed");
      const data = await res.json();
      login(data.token);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setPaymentSuccess(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-accent mb-4">
              <Cake className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Join the Picnic
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create your account to participate in our sweet community
          </p>
        </div>

        {/* Registration Flow */}
        <Card className="border-0 shadow-cake">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {step === 'form' && 'Create Account'}
              {step === 'payment' && 'Pay Entrance Fee'}
              {step === 'done' && 'Registration Complete!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, agreeTerms: checked as boolean })
                    }
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:text-primary/80">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:text-primary/80">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  variant="cake" 
                  className="w-full"
                  disabled={!formData.agreeTerms}
                >
                  Create Account
                </Button>
              </form>
            )}
            {step === 'payment' && (
              <div className="space-y-6">
                {error && <div className="text-red-600 text-center mb-2">{error}</div>}
                <p className="text-center text-muted-foreground mb-4">
                  Please pay the entrance fee to complete your registration.
                </p>
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-2xl font-bold">$10.00</div>
                  <Button
                    variant="cake"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={paymentSuccess}
                  >
                    {paymentSuccess ? 'Processing...' : 'Pay Now'}
                  </Button>
                  {paymentSuccess && (
                    <div className="text-green-600 font-semibold mt-2">Payment Successful!</div>
                  )}
                </div>
              </div>
            )}
            {step === 'done' && (
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">Registration Complete!</div>
                <p className="text-muted-foreground">You can now log in to your account and join the event.</p>
                <Button variant="cake" className="w-full" asChild>
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button variant="soft" className="w-full" asChild>
                  <Link to="/login">Sign in instead</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;