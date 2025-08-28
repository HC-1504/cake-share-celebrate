import express from "express";
import { User } from "./models/index.js";

const router = express.Router();

// ✅ Check-in route
router.post("/checkin", async (req, res) => {
  try {
    const { ethAddress, txHash } = req.body;

    const user = await User.findOne({ where: { ethAddress } });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.checkedIn = true;
    user.txHash = txHash;
    user.checkInAt = new Date(); // store timestamp
    await user.save();

    res.json({ message: "Checked in successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Check-out route
router.post("/checkout", async (req, res) => {
  try {
    const { ethAddress, txHash } = req.body;

    const user = await User.findOne({ where: { ethAddress } });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.checkedIn = false;
    user.txHash = txHash;
    user.checkOutAt = new Date(); // store timestamp
    await user.save();

    res.json({ message: "Checked out successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
