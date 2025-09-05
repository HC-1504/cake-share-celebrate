import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate, Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { cakeVotingABI, cakeVotingAddress, checkInOutABI, checkInOutAddress } from '@/config/contracts';
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

  // --- Blockchain checkin/checkout writes ---
  const { writeContract: writeCheckIn, data: checkInTxHash } = useWriteContract();
  const { isSuccess: isCheckInConfirmed } = useWaitForTransactionReceipt({ hash: checkInTxHash, chainId: holesky.id });

  const { writeContract: writeCheckOut, data: checkOutTxHash } = useWriteContract();
  const { isSuccess: isCheckOutConfirmed } = useWaitForTransactionReceipt({ hash: checkOutTxHash, chainId: holesky.id });

  // --- Voting status from blockchain ---
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

  // --- Load status from DB ---
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

  // --- Check-in handler ---
  const handleCheckin = () => {
    setError("");
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }
    writeCheckIn({
      address: checkInOutAddress[holesky.id],
      abi: checkInOutABI,
      functionName: "checkIn",
      args: [],
      chain: holesky,
      account: address,
    });
  };

  // --- Save checkin to DB when blockchain confirms ---
  useEffect(() => {
    if (isCheckInConfirmed && checkInTxHash) {
      const saveToDB = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          const res = await fetch("http://localhost:5001/api/checkin", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) throw new Error("DB update failed");
          setStatus("in");
        } catch (err: any) {
          setError(err.message || "Failed to update DB after check-in");
        }
      };
      saveToDB();
    }
  }, [isCheckInConfirmed, checkInTxHash]);

  // --- Checkout handler ---
  const handleCheckout = () => {
    setError("");
    if (!votingStatus.both) {
      setError("Please complete voting before checking out");
      return;
    }
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }
    writeCheckOut({
      address: checkInOutAddress[holesky.id],
      abi: checkInOutABI,
      functionName: "checkOut",
      args: [],
      chain: holesky,
      account: address,
    });
  };

  // --- Save checkout to DB when blockchain confirms ---
  useEffect(() => {
    if (isCheckOutConfirmed && checkOutTxHash) {
      const saveToDB = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          const res = await fetch("http://localhost:5001/api/checkout", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) throw new Error("DB update failed");
          setStatus("out");
        } catch (err: any) {
          setError(err.message || "Failed to update DB after check-out");
        }
      };
      saveToDB();
    }
  }, [isCheckOutConfirmed, checkOutTxHash]);

  // --- Blockchain loading indicator ---
  useEffect(() => {
    if (address) {
      setBlockchainLoading(isLoadingBeautiful || isLoadingDelicious);
    } else {
      setBlockchainLoading(false);
    }
  }, [address, isLoadingBeautiful, isLoadingDelicious]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <CardTitle className="text-center text-xl">Event Check-in</CardTitle>

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

          {/* Voting Status */}
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
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Button
              variant="cake"
              className="w-full"
              onClick={handleCheckin}
              disabled={loading || status === 'in' || status === 'out'}
            >
              {status === 'in' ? '✅ Already Checked In' : status === 'out' ? '✅ Event Complete' : '🚪 Check In'}
            </Button>

            {status === 'in' && !votingStatus.both && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/voting"> 🗳️ Go Vote Now </Link>
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
                : '🚪 Check Out'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkin;
