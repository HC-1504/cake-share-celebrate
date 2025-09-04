import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { checkInABI, checkInAddress } from "@/config/contracts"; 
import { holesky } from "wagmi/chains";
import { toast } from "sonner";

const CheckIn = () => {
  const { address } = useAccount();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleCheckIn = () => {
    if (!date || !time) {
      toast.error("Please select both date and time before checking in.");
      return;
    }

    // Blockchain call
    writeContract({
      address: checkInAddress[holesky.id],
      abi: checkInABI,
      functionName: "checkIn",
      args: [],
      chain: holesky,
      account: address,
    });

    toast.info("Transaction sent, waiting for confirmation...");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Check-In</h1>

      <div className="space-y-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <Label>Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <Button onClick={handleCheckIn} disabled={isLoading || !address}>
          {isLoading ? "Confirming..." : "Confirm Check-In"}
        </Button>

        {isSuccess && (
          <p className="text-green-600 mt-2">
            ✅ Checked in successfully at {date} {time}
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
