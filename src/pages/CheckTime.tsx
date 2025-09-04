import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { checkInABI, checkInAddress } from "@/config/contracts";
import { holesky } from "wagmi/chains";
import { toast } from "sonner";

const CheckTime = () => {
  const { address } = useAccount();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Function to save check-in to DB
  const saveToDB = async () => {
    if (!address || !date || !time || !hash) return;

    setSaving(true);
    try {
      const response = await fetch("/api/checkin.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          date,
          time,
          txHash: hash,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("✅ Check-in saved to database!");
      } else {
        toast.error("❌ Failed to save check-in to DB.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Error connecting to server.");
    } finally {
      setSaving(false);
    }
  };

  // Trigger DB save when blockchain tx is confirmed
  useEffect(() => {
    if (isSuccess) {
      saveToDB();
    }
  }, [isSuccess]);

  const handleCheckIn = () => {
    if (!date || !time) {
      toast.error("⚠️ Please select both date and time before checking in.");
      return;
    }

    if (!address) {
      toast.error("⚠️ Connect your wallet first.");
      return;
    }

    // Blockchain check-in
    writeContract({
      address: checkInAddress[holesky.id],
      abi: checkInABI,
      functionName: "checkIn",
      args: [],
      chain: holesky,
      account: address,
    });

    toast.info("⏳ Transaction sent, waiting for confirmation...");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6 text-center">Check-In</h1>

      <div className="space-y-4">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Time</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={isLoading || !address || saving}
        >
          {isLoading
            ? "⏳ Confirming..."
            : saving
            ? "💾 Saving..."
            : "✅ Confirm Check-In"}
        </Button>

        {isSuccess && (
          <p className="text-green-600 mt-2 text-center">
            ✅ Checked in successfully at {date} {time}
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckTime;
