import { checkInOutABI, checkInOutAddress, cakeVotingABI, cakeVotingAddress } from "@/config/contracts";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate, Link } from "react-router-dom";
import { holesky } from "wagmi/chains";

const Checkin = () => {
  const { isAuthenticated } = useAuth();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const [status, setStatus] = useState<"none" | "in" | "out">("none");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  const [votingStatus, setVotingStatus] = useState({
    beautiful: false,
    delicious: false,
    both: false,
  });

  // --- Blockchain Checkin/Checkout Status ---
  const { data: chainStatus, isLoading: isLoadingChain } = useReadContract({
    address: checkInOutAddress[holesky.id],
    abi: checkInOutABI,
    functionName: "getStatus",
    args: address ? [address] : undefined,
    chainId: holesky.id,
    query: { enabled: !!address },
  });

  // --- Blockchain Voting Checks ---
  const { data: hasVotedBeautifulBlockchain, isLoading: isLoadingBeautiful } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: "hasVotedInCategory",
    args: address ? [address, "beautiful"] : undefined,
    chainId: holesky.id,
    query: { enabled: !!address },
  });

  const { data: hasVotedDeliciousBlockchain, isLoading: isLoadingDelicious } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: "hasVotedInCategory",
    args: address ? [address, "delicious"] : undefined,
    chainId: holesky.id,
    query: { enabled: !!address },
  });

  // --- Sync blockchain status ---
  useEffect(() => {
    if (chainStatus) {
      const [inStatus, outStatus] = chainStatus as [boolean, boolean];
      if (outStatus) setStatus("out");
      else if (inStatus) setStatus("in");
      else setStatus("none");
    }
    setBlockchainLoading(isLoadingChain || isLoadingBeautiful || isLoadingDelicious);
    setLoading(false);
  }, [chainStatus, isLoadingChain, isLoadingBeautiful, isLoadingDelicious]);

  // --- Sync voting status ---
  useEffect(() => {
    const beautifulVoted = !!hasVotedBeautifulBlockchain;
    const deliciousVoted = !!hasVotedDeliciousBlockchain;

    setVotingStatus({
      beautiful: beautifulVoted,
      delicious: deliciousVoted,
      both: beautifulVoted && deliciousVoted,
    });
  }, [hasVotedBeautifulBlockchain, hasVotedDeliciousBlockchain]);

  // --- Checkin ---
  const handleCheckin = async () => {
    setError("");
    try {
      const tx = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkIn",
        account: address,
      });
      console.log("✅ Check-in TX:", tx);

      const token = localStorage.getItem("auth_token");
      await fetch("http://localhost:5001/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ wallet: address, txHash: tx.hash }),
      });

      setStatus("in");
    } catch (err: any) {
      setError(err.message || "Failed to check in");
    }
  };

  // --- Checkout ---
  const handleCheckout = async () => {
    setError("");

    if (!votingStatus.both) {
      setError("Please complete voting for both categories before checking out");
      return;
    }

    try {
      const tx = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkOut",
        account: address,
      });
      console.log("✅ Check-out TX:", tx);

      const token = localStorage.getItem("auth_token");
      await fetch("http://localhost:5001/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ wallet: address, txHash: tx.hash }),
      });

      setStatus("out");
    } catch (err: any) {
      setError(err.message || "Failed to check out");
    }
  };

  // --- Refresh ---
  const handleRefreshStatus = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <CardTitle className="text-center text-xl">Event Check-in</CardTitle>

          {blockchainLoading && address && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span className="text-sm">🦊 Loading blockchain data...</span>
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
                {status === "none" && <div className="text-muted-foreground">You have not checked in yet.</div>}
                {status === "in" && <div className="text-green-600 font-semibold">✅ You are checked in!</div>}
                {status === "out" && <div className="text-blue-600 font-semibold">👋 You have checked out.</div>}
              </>
            )}
            {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
          </div>

          {/* Voting requirements */}
          {!loading && status === "in" && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🗳️ Voting Requirements for Check-out</h3>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${votingStatus.beautiful ? "text-green-600" : "text-orange-600"}`}>
                  {votingStatus.beautiful ? "✅" : "⏳"} Most Beautiful Cake
                </div>
                <div className={`flex items-center gap-2 ${votingStatus.delicious ? "text-green-600" : "text-orange-600"}`}>
                  {votingStatus.delicious ? "✅" : "⏳"} Most Delicious Cake
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

                <div className="mt-3 text-center">
                  <Button variant="outline" size="sm" onClick={handleRefreshStatus} className="text-xs">
                    🔄 Refresh Status
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-4">
            <Button
              variant="cake"
              className="w-full"
              onClick={handleCheckin}
              disabled={loading || status === "in" || status === "out"}
            >
              {status === "in" ? "✅ Already Checked In" : status === "out" ? "✅ Event Complete" : "🚪 Check In"}
            </Button>

            {status === "in" && votingStatus.both && (
              <Button variant="soft" className="w-full" onClick={handleCheckout}>
                🚪 Check Out
              </Button>
            )}

            {status === "in" && !votingStatus.both && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/voting">🗳️ Go Vote Now</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkin;
