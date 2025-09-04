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

  // blockchain write hooks
  const { writeContract: writeCheckIn, data: checkInTxHash } = useWriteContract();
  const { isSuccess: isCheckInConfirmed } = useWaitForTransactionReceipt({ hash: checkInTxHash, chainId: holesky.id });

  const { writeContract: writeCheckOut, data: checkOutTxHash } = useWriteContract();
  const { isSuccess: isCheckOutConfirmed } = useWaitForTransactionReceipt({ hash: checkOutTxHash, chainId: holesky.id });

  // blockchain voting status
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

  // load status from DB
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

  // checkin handler
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

  // when blockchain confirms checkin → save to DB
  useEffect(() => {
    if (isCheckInConfirmed && checkInTxHash) {
      const saveToDatabase = async () => {
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

  // checkout handler
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

  // when blockchain confirms checkout → save to DB
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <CardTitle className="text-center text-xl">Event Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            {status === "none" && <div className="text-muted-foreground">You have not checked in yet.</div>}
            {status === "in" && <div className="text-green-600 font-semibold">✅ You are checked in!</div>}
            {status === "out" && <div className="text-blue-600 font-semibold">👋 You have checked out.</div>}
            {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="cake"
              className="w-full"
              onClick={handleCheckin}
              disabled={loading || status === 'in' || status === 'out'}
            >
              🚪 Check In
            </Button>
            <Button
              variant="soft"
              className="w-full"
              onClick={handleCheckout}
              disabled={loading || status !== 'in' || !votingStatus.both}
            >
              🚪 Check Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkin;
