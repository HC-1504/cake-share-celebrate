import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate, Link } from "react-router-dom";
import { useAccount, useReadContract } from 'wagmi';
import { cakeVotingABI, cakeVotingAddress } from '@/config/contracts';
import { holesky } from 'wagmi/chains';

const Checkin = () => {
  const { isAuthenticated } = useAuth();
  const { address } = useAccount();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const [status, setStatus] = useState<'none' | 'in' | 'out'>('none');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  const [votingStatus, setVotingStatus] = useState({
    beautiful: false,
    delicious: false,
    both: false
  });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update current date/time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Blockchain vote checks (same as before)
  const { data: hasVotedBeautifulBlockchain, isLoading: isLoadingBeautiful } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'beautiful'] : undefined,
    chainId: holesky.id,
    query: { enabled: !!address },
  });
  const { data: hasVotedDeliciousBlockchain, isLoading: isLoadingDelicious } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'delicious'] : undefined,
    chainId: holesky.id,
    query: { enabled: !!address },
  });

  // Fetch current check-in status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("http://localhost:5001/api/checkin/status", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);

          const beautifulVoted = data.voting?.beautiful || hasVotedBeautifulBlockchain || false;
          const deliciousVoted = data.voting?.delicious || hasVotedDeliciousBlockchain || false;

          setVotingStatus({
            beautiful: beautifulVoted,
            delicious: deliciousVoted,
            both: beautifulVoted && deliciousVoted
          });
        }
      } catch (err) {
        console.error("Failed to fetch check-in status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [hasVotedBeautifulBlockchain, hasVotedDeliciousBlockchain]);

  const handleRefreshStatus = () => {
    setLoading(true);
    window.location.reload();
  };

  useEffect(() => {
    if (address) {
      setBlockchainLoading(isLoadingBeautiful || isLoadingDelicious);
    } else {
      setBlockchainLoading(false);
    }
  }, [address, isLoadingBeautiful, isLoadingDelicious]);

  useEffect(() => {
    if (hasVotedBeautifulBlockchain !== undefined || hasVotedDeliciousBlockchain !== undefined) {
      setVotingStatus(prev => {
        const beautifulVoted = prev.beautiful || hasVotedBeautifulBlockchain || false;
        const deliciousVoted = prev.delicious || hasVotedDeliciousBlockchain || false;

        return {
          beautiful: beautifulVoted,
          delicious: deliciousVoted,
          both: beautifulVoted && deliciousVoted
        };
      });
    }
  }, [hasVotedBeautifulBlockchain, hasVotedDeliciousBlockchain]);

  // Add check-in with date/time
  const handleCheckin = async () => {
    setError("");

    // Optional: restrict check-in to certain hours (example: 9am to 5pm)
    const hours = currentDateTime.getHours();
    if (hours < 9 || hours > 17) {
      setError("Check-in is only allowed between 09:00 and 17:00");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("http://localhost:5001/api/checkin", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to check in");
      }
      setStatus('in');
    } catch (err: any) {
      setError(err.message || "Failed to check in");
    }
  };

  const handleCheckout = async () => {
    setError("");

    if (!votingStatus.both) {
      setError("Please complete voting for both categories before checking out");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("http://localhost:5001/api/checkout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to check out");
      }
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

          {/* Show current date/time */}
          <div className="text-center text-sm text-gray-600 mt-2">
            📅 {currentDateTime.toLocaleDateString()} ⏰ {currentDateTime.toLocaleTimeString()}
          </div>

          {blockchainLoading && address && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span className="text-sm">🦊 Loading MetaMask data...</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* ...rest of the UI remains unchanged... */}
          <div className="flex flex-col gap-4">
            <Button
              variant="cake"
              className="w-full"
              onClick={handleCheckin}
              disabled={loading || status === 'in' || status === 'out'}
            >
              {status === 'in' ? '✅ Already Checked In' : status === 'out' ? '✅ Event Complete' : '🚪 Check In'}
            </Button>

            <Button
              variant="soft"
              className="w-full"
              onClick={handleCheckout}
              disabled={loading || status !== 'in' || !votingStatus.both}
            >
              {status === 'out'
                ? '👋 Already Checked Out'
                : !votingStatus.both && status === 'in'
                ? '🗳️ Complete Voting First'
                : '🚪 Check Out'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkin;
