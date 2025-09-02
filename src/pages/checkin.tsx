import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate, Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { checkInOutABI, checkInOutAddress } from "@/config/contracts";
import { holesky } from "wagmi/chains";

export default function CheckInOut() {
  const { user } = useAuth();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<"in" | "out" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  // 🔹 Watch transaction receipt
  const { data: receipt, isLoading: txPending, isSuccess, isError } =
    useWaitForTransactionReceipt({
      hash: txHash,
      chainId: holesky.id,
    });

  // 🔹 Read current blockchain status
  const { data: blockchainStatus, refetch } = useReadContract({
    address: checkInOutAddress[holesky.id],
    abi: checkInOutABI,
    functionName: "getStatus",
    args: address ? [address] : undefined,
    chainId: holesky.id,
  });

  useEffect(() => {
    if (blockchainStatus) {
      const [inStatus, outStatus] = blockchainStatus as [boolean, boolean];
      if (inStatus) setStatus("in");
      else if (outStatus) setStatus("out");
      else setStatus(null);
    }
  }, [blockchainStatus]);

  // 🔹 Shared helper for backend calls
  const updateBackend = async (endpoint: string) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`http://localhost:5001/api/${endpoint}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`Failed to save ${endpoint} to DB`);
  };

  // 🔹 Handle Check-in
  const handleCheckin = async () => {
    setError("");
    if (!address) return setError("Please connect MetaMask first");

    try {
      setLoading(true);
      const tx = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkIn",
        chainId: holesky.id,
      });

      setTxHash(tx); // save tx hash
      await updateBackend("checkin");
    } catch (err: any) {
      setError(err.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Check-out
  const handleCheckout = async () => {
    setError("");
    if (!address) return setError("Please connect MetaMask first");

    try {
      setLoading(true);
      const tx = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkOut",
        chainId: holesky.id,
      });

      setTxHash(tx); // save tx hash
      await updateBackend("checkout");
    } catch (err: any) {
      setError(err.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update UI once tx is confirmed
  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess]);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cake Picnic Check-In / Check-Out</CardTitle>
        </CardHeader>
       <CardContent>
  {error && <p className="text-red-500 mb-2">{error}</p>}

  <p className="mb-4">
    Current Status:{" "}
    <span className="font-bold">
      {status === "in"
        ? "✅ Checked In"
        : status === "out"
        ? "👋 Checked Out"
        : "Not Checked In"}
    </span>
  </p>

  {txHash && (
    <p className="mb-4 text-sm">
      ⛓️ Tx:{" "}
      <a
        href={`https://holesky.etherscan.io/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline"
      >
        {txHash.slice(0, 10)}...{txHash.slice(-6)}
      </a>
      <br />
      {txPending && <span className="text-yellow-500">⏳ Pending...</span>}
      {isSuccess && (
        <span className="text-green-500">
          ✅ Confirmed in block {receipt?.blockNumber?.toString()}
        </span>
      )}
      {isError && <span className="text-red-500">❌ Failed</span>}
    </p>
  )}

  {/* 🔹 Connect MetaMask button shows only if not connected */}
  {!address && (
    <Button
      onClick={() =>
        window.ethereum.request({ method: "eth_requestAccounts" })
      }
      className="mb-4 w-full"
    >
      🦊 Connect MetaMask
    </Button>
  )}

  {/* 🔹 Check In / Check Out buttons */}
  <div className="flex gap-3">
    <Button onClick={handleCheckin} disabled={loading || status === "in"}>
      {loading ? "Processing..." : "Check In"}
    </Button>

    <Button
      onClick={handleCheckout}
      disabled={loading || status === "out"}
      variant="secondary"
    >
      {loading ? "Processing..." : "Check Out"}
    </Button>
  </div>

  {status === "in" && (
    <div className="mt-6">
      <Link to="/vote">
        <Button className="w-full">Go Vote 🍰</Button>
      </Link>
    </div>
  )}
</CardContent>

      </Card>
    </div>
  );
}
