import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { checkInOutABI, checkInOutAddress } from "@/config/contracts";
import { holesky } from "wagmi/chains";
import { useToast } from "@/hooks/use-toast";

// ⏰ New: date & time inputs
import { Input } from "@/components/ui/input";

const CheckIn = () => {
  const { isAuthenticated, token } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const { address } = useAccount();
  const { toast } = useToast();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { writeContractAsync, isPending } = useWriteContract();
  const [pendingTx, setPendingTx] = useState<{
    hash: `0x${string}`;
    type: "checkin" | "checkout";
  } | null>(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: pendingTx?.hash,
    });

  // 🆕 Date + time states
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Trigger DB save after blockchain confirms
  useEffect(() => {
    if (isConfirmed && pendingTx) {
      const saveToDb = async () => {
        try {
          const endpoint =
            pendingTx.type === "checkin" ? "/api/checkin" : "/api/checkout";

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              txHash: pendingTx.hash,
              wallet: address,
              date,
              time, // ⏰ send date + time to backend
            }),
          });

          if (!res.ok) throw new Error("Failed to save");

          toast({
            title: "✅ Success!",
            description: `You are ${
              pendingTx.type === "checkin" ? "checked in" : "checked out"
            }. Blockchain + database updated.`,
          });
        } catch (err: any) {
          toast({
            title: "⚠️ Blockchain success, DB failed",
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setPendingTx(null);
        }
      };

      saveToDb();
    }
  }, [isConfirmed, pendingTx, address, token, toast, date, time]);

  // Shared helper
  const executeTx = async (
    fn: "checkIn" | "checkOut",
    type: "checkin" | "checkout"
  ) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect MetaMask.",
        variant: "destructive",
      });
      return;
    }

    if (chainId !== holesky.id) {
      try {
        await switchChain({ chainId: holesky.id });
      } catch {
        toast({
          title: "Wrong Network",
          description: "Switch to Holesky Testnet.",
          variant: "destructive",
        });
        return;
      }
    }

    // 🚨 Make sure user picked date & time
    if (type === "checkin" && (!date || !time)) {
      toast({
        title: "Missing Info",
        description: "Please select date and time before check-in.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({ title: "MetaMask", description: `Please confirm ${type}...` });
      const hash = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: fn,
        args: [], // if your contract needs date/time, we can pass [date, time] here
        account: address,
        chain: holesky,
      });

      setPendingTx({ hash, type });
      toast({
        title: "Transaction Sent",
        description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      });
    } catch (err: any) {
      toast({
        title: "Transaction Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle>Event Check-In / Check-Out</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* 🆕 Date + time inputs */}
          <div className="flex flex-col gap-2">
            <label className="text-sm">Select Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Select Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <Button
            variant="cake"
            disabled={isPending || isConfirming}
            onClick={() => executeTx("checkIn", "checkin")}
          >
            {isPending || isConfirming ? "⏳ Processing..." : "🟢 Check In"}
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || isConfirming}
            onClick={() => executeTx("checkOut", "checkout")}
          >
            {isPending || isConfirming ? "⏳ Processing..." : "🔴 Check Out"}
          </Button>
          {address && (
            <p className="text-xs text-muted-foreground break-all text-center mt-2">
              Your Wallet: {address}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIn;
