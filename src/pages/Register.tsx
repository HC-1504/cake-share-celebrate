import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { Cake, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/App";
import { useAccount, useConnect, useWriteContract, useBalance, useDisconnect } from 'wagmi';
import { parseEther, formatEther, BaseError } from 'viem';
import { eventRegistrationABI, eventRegistrationAddress } from '@/config/contracts';
import { holesky } from 'wagmi/chains';
import { publicClient } from '../config/web3';

// Holds the presentational data for each tier. This separates UI concerns from on-chain data.
const TIER_VISUALS: { [key: string]: { emoji: string; description: string; duration: string } } = {
  "Normal": { emoji: '🍰', description: 'Basic entry access', duration: '2 hours' },
  "Premium": { emoji: '🎂', description: 'Extended entry duration', duration: '3 hours' },
  "Family": { emoji: '👨‍👩‍👧‍👦', description: 'Family entry access (up to 5 people)', duration: '2.5 hours' },
  "Premium Family": { emoji: '👑', description: 'Extended family entry duration (up to 7 people)', duration: '4 hours' }
};

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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);
  // The state now holds the merged on-chain and visual data
  const [categories, setCategories] = useState<(typeof TIER_VISUALS[string] & { name: string; fee: string })[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("eth");
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({ eth: 1 });

  const SUPPORTED_CURRENCIES = [
    { value: "eth", label: "ETH" },
    { value: "usd", label: "USD" },
    { value: "eur", label: "EUR" },
    { value: "myr", label: "MYR" },
  ];

  const { login } = useAuth();
  const navigate = useNavigate();
  const { address, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
  });

  const {
    writeContractAsync: register,
    isPending: isSubmittingToWallet,
  } = useWriteContract();

  // Fetch and merge category data
  useEffect(() => {
    const fetchCategoriesAndRates = async () => {
      const activeChainId = chain?.id || holesky.id;
      if (!eventRegistrationAddress[activeChainId]) {
        setError("Contract not deployed on this network. Please switch to Holesky.");
        setCategories([]);
        return;
      }

      try {
        setError("");
        const contract = { address: eventRegistrationAddress[activeChainId], abi: eventRegistrationABI };
        const categoryNames = await publicClient.readContract({ ...contract, functionName: 'getCategoryNames' }) as string[];

        const categoryData = await Promise.all(
          categoryNames.map(async (name: string) => {
            const fee = await publicClient.readContract({ ...contract, functionName: 'getCategoryFee', args: [name] }) as bigint;
            return { name, fee: formatEther(fee) };
          })
        );

        // Merge the on-chain data (name, fee) with the local visual data (emoji, etc.)
        const enrichedCategories = categoryData.map(cat => ({
          ...cat,
          ...(TIER_VISUALS[cat.name] || { emoji: '🎟️', description: 'Standard Tier', duration: 'N/A' }) // Default visuals
        }));

        setCategories(enrichedCategories);
        if (enrichedCategories.length > 0) {
          setSelectedCategory(enrichedCategories[0].name);
        }

        // Fetch exchange rates
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,eur,myr');
        const rates = await res.json();
        setExchangeRates({
          eth: 1,
          usd: rates.ethereum.usd,
          eur: rates.ethereum.eur,
          myr: rates.ethereum.myr,
        });

      } catch (err) {
        console.error("Failed to fetch categories or rates:", err);
        setError("Could not load registration categories or exchange rates.");
      }
    };

    fetchCategoriesAndRates();
  }, [chain?.id]);

  const connectWallet = () => {
    try {
      if (!connectors.length) {
        setError("No wallet connector found. Please install a wallet like MetaMask.");
        return;
      }
      connect({ connector: connectors[0] });
    } catch (err) {
      setError('Failed to connect wallet.');
    }
  };

  // Replace your entire handlePayment function with this corrected version

  const handlePayment = async () => {
    // Guard clauses at the top are still good
    if (!balance || Number(balance.formatted) < Number(categories.find(c => c.name === selectedCategory)?.fee || "0")) {
      return alert('Insufficient ETH balance');
    }
    if (!chain || !eventRegistrationAddress[chain.id] || !categories.find(c => c.name === selectedCategory)) {
      setError("Please select a category and connect to a supported network (Holesky).");
      return;
    }

    // Prevent double-submission if already processing
    if (isSubmittingToServer) return;

    // --- Start of the corrected logic ---
    try {
      // 1. LOCK THE PROCESS IMMEDIATELY
      setIsSubmittingToServer(true);
      setError("");
      setPaymentStatus('idle');

      // Call the register function on the contract
      const hash = await register({
        address: eventRegistrationAddress[chain.id],
        abi: eventRegistrationABI,
        functionName: 'register',
        args: [selectedCategory],
        value: parseEther(categories.find(c => c.name === selectedCategory)!.fee), // Using ! since we checked above
        chain,
        account: address
      });

      // Wait for the transaction to be confirmed
      setPaymentStatus('pending');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'reverted') {
        throw new Error("Transaction was reverted. Please check your balance and try again.");
      }

      // Call the backend API
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ethAddress: address,
          category: selectedCategory,
          txHash: hash,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Using a more specific error message from the backend if available
        throw new Error(errorData.error || `Payment successful, but account creation failed.`);
      }

      const data = await res.json();
      setPaymentStatus('success');
      setError('');
      setStep('done');
      login(data.token);
      navigate('/dashboard');

    } catch (err) {
      console.error('Full registration flow error:', err);
      setPaymentStatus('failed');
      // Ensure err.message is a string
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Registration failed: ${errorMessage}`);
    } finally {
      // 2. ALWAYS UNLOCK THE PROCESS, no matter what happens
      setIsSubmittingToServer(false);
      setPaymentStatus('idle'); // Also reset payment status
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setStep('payment');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const isLoading = isSubmittingToWallet || paymentStatus === 'pending';
  const selectedFee = categories.find(c => c.name === selectedCategory)?.fee || "0";
  const convertedFee = (parseFloat(selectedFee) * exchangeRates[currency]).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-accent mb-4">
              <Cake className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground">Join the Picnic</h2>
          <p className="mt-2 text-muted-foreground">
            {step === 'form' && 'Create your account to participate'}
            {step === 'payment' && 'One final step to join the fun!'}
            {step === 'done' && 'Welcome to the party!'}
          </p>
        </div>

        <Card className="border-0 shadow-cake">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {step === 'form' && 'Create Account'}
              {step === 'payment' && 'Pay Entrance Fee'}
              {step === 'done' && 'Registration Complete!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-600 text-center mb-4 p-2 bg-red-100 rounded">{error}</div>}

            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form fields are unchanged and correct */}
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" type="text" autoComplete="given-name" required value={formData.firstName} onChange={handleChange} className="mt-1" placeholder="First name" /></div>
                  <div><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" type="text" autoComplete="family-name" required value={formData.lastName} onChange={handleChange} className="mt-1" placeholder="Last name" /></div>
                </div>
                <div><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="mt-1" placeholder="Enter your email" /></div>
                <div><Label htmlFor="password">Password</Label><div className="relative mt-1"><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={formData.password} onChange={handleChange} placeholder="Create a password" /><button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}</button></div></div>
                <div><Label htmlFor="confirmPassword">Confirm password</Label><div className="relative mt-1"><Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" /><button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}</button></div></div>
                <div className="flex items-center space-x-2"><Checkbox id="agreeTerms" name="agreeTerms" checked={formData.agreeTerms} onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })} /><Label htmlFor="agreeTerms" className="text-sm">I agree to the <Link to="/terms" className="text-primary hover:text-primary/80">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link></Label></div>
                <Button type="submit" variant="cake" className="w-full" disabled={!formData.agreeTerms || (formData.password && formData.password !== formData.confirmPassword)}>Continue to Payment</Button>
              </form>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground">Please select a tier and pay the entrance fee.</p>
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="p-2 border rounded-md"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.name}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedCategory === cat.name ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
                        onClick={() => setSelectedCategory(cat.name)}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl mt-1">{cat.emoji}</span>
                          <div>
                            <div className="font-medium text-lg">{cat.name}</div>
                            <div className="text-sm text-muted-foreground">{cat.description}</div>
                            <div className="mt-2 text-base">
                              <span className="font-semibold">
                                {currency === 'eth' ? `${cat.fee} ETH` : `${(parseFloat(cat.fee) * exchangeRates[currency]).toFixed(2)} ${currency.toUpperCase()}`}
                              </span> · {cat.duration}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* MARKER: - Connect Wallet */}
                  <Button variant="outline" className="w-full" onClick={connectWallet} disabled={!!address}>
                    {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => disconnect()} disabled={!address}>
                    Disconnect Wallet
                  </Button>
                  {/* MARKER: - Pay */}
                  <Button
                    variant="cake"
                    className="w-full"
                    onClick={handlePayment}
                    // Use the new state for a more reliable disabled check
                    disabled={!address || isLoading || isSubmittingToServer || categories.length === 0}
                  >
                    {/* Check BOTH states for the loading spinner */}
                    {isLoading || isSubmittingToServer ? (
                      <Loader2 className="animate-spin h-4 w-4 text-white" />
                    ) : (
                      `Pay ${currency === 'eth' ? `${selectedFee} ETH` : `~${convertedFee} ${currency.toUpperCase()}`} and Register`
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">Registration Complete!</div>
                <p className="text-muted-foreground">You have been logged in. Welcome to the event!</p>
                <Button variant="cake" className="w-full" asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
              </div>
            )}

            {/* [MARKER]: Login */}
            <div className="mt-6">
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted-foreground">Already have an account?</span></div></div>
              <div className="mt-6"><Button variant="soft" className="w-full" asChild><Link to="/login">Sign in instead</Link></Button></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;