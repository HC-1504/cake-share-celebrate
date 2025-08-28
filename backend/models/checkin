import express from "express";
import { User } from "../models/index.js";

const router = express.Router();

// ✅ Check-in
router.post("/checkin", async (req, res) => {
  try {
    const { userId, txHash } = req.body;

    const updated = await User.update(
      { checkedIn: true, checkInTime: new Date(), txHash },
      { where: { id: userId } }
    );

    res.json({ success: true, message: "Checked in", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Check-out
router.post("/checkout", async (req, res) => {
  try {
    const { userId, txHash } = req.body;

    const updated = await User.update(
      { checkedIn: false, checkInTime: new Date(), txHash },
      { where: { id: userId } }
    );

    res.json({ success: true, message: "Checked out", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
