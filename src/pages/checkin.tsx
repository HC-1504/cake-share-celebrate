import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate, Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { checkInOutABI, checkInOutAddress } from "@/config/contracts";
import { holesky } from "wagmi/chains";

export default function CheckInOut() {
  const { user } = useAuth();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<"in" | "out" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Read status from blockchain
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

  // 🔹 Handle Check-in
  const handleCheckin = async () => {
    setError("");
    if (!address) {
      setError("Please connect MetaMask first");
      return;
    }
    try {
      setLoading(true);

      // 1. Blockchain call
      const tx = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkIn",
        chainId: holesky.id,
      });
      console.log("✅ Check-in tx:", tx);

      // 2. Update backend DB
      const token = localStorage.getItem("auth_token");
      const res = await fetch("http://localhost:5001/api/checkin", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to save check-in to DB");

      setStatus("in");
      await refetch();
    } catch (err: any) {
      setError(err.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Check-out
  const handleCheckout = async () => {
    setError("");
    if (!address) {
      setError("Please connect MetaMask first");
      return;
    }
    try {
      setLoading(true);

      // 1. Blockchain call
      const tx = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkOut",
        chainId: holesky.id,
      });
      console.log("✅ Check-out tx:", tx);

      // 2. Update backend DB
      const token = localStorage.getItem("auth_token");
      const res = await fetch("http://localhost:5001/api/checkout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to save check-out to DB");

      setStatus("out");
      await refetch();
    } catch (err: any) {
      setError(err.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

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

          <div className="flex gap-3">
            <Button
              onClick={handleCheckin}
              disabled={loading || status === "in"}
            >
              {loading && status !== "in" ? "Processing..." : "Check In"}
            </Button>

            <Button
              onClick={handleCheckout}
              disabled={loading || status === "out"}
              variant="secondary"
            >
              {loading && status !== "out" ? "Processing..." : "Check Out"}
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
