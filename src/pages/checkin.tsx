import { checkInOutABI, checkInOutAddress } from "@/config/contracts";
import { useWriteContract } from "wagmi";
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


  // Check blockchain voting status for beautiful category
  const { data: hasVotedBeautifulBlockchain, isLoading: isLoadingBeautiful } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'beautiful'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  // Check blockchain voting status for delicious category
  const { data: hasVotedDeliciousBlockchain, isLoading: isLoadingDelicious } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'delicious'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  // Fetch current check-in status when component loads
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

          // Combine database voting status with blockchain status
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

  // Add refresh button for users to manually update status
  const handleRefreshStatus = () => {
    setLoading(true);
    window.location.reload();
  };

  // Update blockchain loading state
  useEffect(() => {
    if (address) {
      setBlockchainLoading(isLoadingBeautiful || isLoadingDelicious);
    } else {
      setBlockchainLoading(false);
    }
  }, [address, isLoadingBeautiful, isLoadingDelicious]);

  // Update voting status when blockchain data changes
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

  const handleCheckin = async () => {
    setError("");
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
const { writeContractAsync } = useWriteContract();
const { address } = useAccount();

const handleCheckin = async () => {
  setError("");
  try {
    // Step 1: Trigger MetaMask
    const tx = await writeContractAsync({
      address: cakeCheckInAddress[holesky.id],
      abi: cakeCheckInABI,
      functionName: "checkIn",
    });

    const txHash = tx; // in wagmi v1 this is already the hash

    // Step 2: Save in backend
    const token = localStorage.getItem("auth_token");
    const res = await fetch("http://localhost:5001/api/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ wallet: address, txHash }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to check in");
    }

    setStatus("in");
  } catch (err: any) {
    setError(err.message || "Failed to check in");
  }
};

const handleCheckout = async () => {
  setError("");

  if (!votingStatus?.both) {
    setError("Please complete voting for both categories before checking out");
    return;
  }

  try {
    // Step 1: Trigger MetaMask
    const tx = await writeContractAsync({
      address: cakeCheckInAddress[holesky.id],
      abi: cakeCheckInABI,
      functionName: "checkOut",
    });

    const txHash = tx;

    // Step 2: Save in backend
    const token = localStorage.getItem("auth_token");
    const res = await fetch("http://localhost:5001/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ wallet: address, txHash }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to check out");
    }

    setStatus("out");
  } catch (err: any) {
    setError(err.message || "Failed to check out");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <CardTitle className="text-center text-xl">Event Check-in</CardTitle>

          {/* MetaMask Loading Indicator */}
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
          <div className="text-center mb-6">
            {loading ? (
              <div className="text-muted-foreground">Loading status...</div>
            ) : (
              <>
                {status === 'none' && <div className="text-muted-foreground">You have not checked in yet.</div>}
                {status === 'in' && <div className="text-green-600 font-semibold">✅ You are checked in!</div>}
                {status === 'out' && <div className="text-blue-600 font-semibold">👋 You have checked out.</div>}
              </>
            )}
            {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
          </div>

          {/* Voting Status Display */}
          {!loading && status === 'in' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🗳️ Voting Requirements for Check-out</h3>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${votingStatus.beautiful ? 'text-green-600' : 'text-orange-600'}`}>
                  {votingStatus.beautiful ? '✅' : '⏳'} Most Beautiful Cake
                  {votingStatus.beautiful ? ' - Voted ✓' : ' - Not voted yet'}
                  {hasVotedBeautifulBlockchain && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Blockchain ✓</span>
                  )}
                </div>
                <div className={`flex items-center gap-2 ${votingStatus.delicious ? 'text-green-600' : 'text-orange-600'}`}>
                  {votingStatus.delicious ? '✅' : '⏳'} Most Delicious Cake
                  {votingStatus.delicious ? ' - Voted ✓' : ' - Not voted yet'}
                  {hasVotedDeliciousBlockchain && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Blockchain ✓</span>
                  )}
                </div>
                {!votingStatus.both && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    <p className="text-xs">
                      💡 You must vote for both categories before you can check out.
                      <Link to="/voting" className="underline ml-1 hover:text-yellow-900">Go to voting page</Link>
                    </p>
                  </div>
                )}
                {votingStatus.both && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                    <p className="text-xs">🎉 All voting complete! You can now check out.</p>
                  </div>
                )}

                {/* Refresh Status Button */}
                <div className="mt-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshStatus}
                    className="text-xs"
                  >
                    🔄 Refresh Status
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <Button
              variant="cake"
              className="w-full"
              onClick={handleCheckin}
              disabled={loading || status === 'in' || status === 'out'}
            >
              {status === 'in' ? '✅ Already Checked In' : status === 'out' ? '✅ Event Complete' : '🚪 Check In'}
            </Button>

            {/* Show voting button if checked in but haven't voted for both */}
            {status === 'in' && !votingStatus.both && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/voting">
                  🗳️ Go Vote Now
                </Link>
              </Button>
            )}

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
