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
import {
  checkInOutABI,
  checkInOutAddress,
} from "@/config/contracts";
import { holesky } from "wagmi/chains";
import { useToast } from "@/hooks/use-toast";

const CheckIn = () => {
  const { isAuthenticated, token } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const { address } = useAccount();
  const { toast } = useToast();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Contract write hook
  const { writeContractAsync, isPending } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  // Wait for blockchain confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: pendingTxHash as `0x${string}`,
    });

  // Call backend after blockchain confirms
  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      const saveToDb = async () => {
        try {
          const res = await fetch("/api/checkin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              txHash: pendingTxHash,
              wallet: address,
            }),
          });

          if (!res.ok) throw new Error("Failed to save check-in");

          toast({
            title: "✅ Success!",
            description:
              "You are checked in. Blockchain + database updated.",
          });
        } catch (err: any) {
          toast({
            title: "⚠️ Blockchain success, DB failed",
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setPendingTxHash(null);
        }
      };

      saveToDb();
    }
  }, [isConfirmed, pendingTxHash, address, token, toast]);

  // Check In handler
  const handleCheckIn = async () => {
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

    try {
      toast({ title: "MetaMask", description: "Please confirm Check In..." });
      const hash = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkIn",
        args: [],
        account: address,
        chain: holesky,
      });

      setPendingTxHash(hash);
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

  // Check Out handler
  const handleCheckOut = async () => {
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

    try {
      toast({ title: "MetaMask", description: "Please confirm Check Out..." });
      const hash = await writeContractAsync({
        address: checkInOutAddress[holesky.id],
        abi: checkInOutABI,
        functionName: "checkOut",
        args: [],
        account: address,
        chain: holesky,
      });

      setPendingTxHash(hash);
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
          <Button
            variant="cake"
            disabled={isPending || isConfirming}
            onClick={handleCheckIn}
          >
            {isPending || isConfirming ? "⏳ Processing..." : "🟢 Check In"}
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || isConfirming}
            onClick={handleCheckOut}
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
