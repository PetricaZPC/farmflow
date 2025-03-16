import clientPromise from "../auth/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { targetEmail } = req.body;

    if (!targetEmail) {
      return res.status(400).json({ error: "Target email is required" });
    }

    const client = await clientPromise;
    const db = client.db("accounts");
    const users = db.collection("users");

    const currentUser = await users.findOne({ sessionId });
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const targetUser = await users.findOne({ email: targetEmail });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser._id.equals(targetUser._id)) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    const alreadyFriends =
      targetUser.friends &&
      targetUser.friends.some(
        (id) => id.toString() === currentUser._id.toString()
      );
    if (alreadyFriends) {
      return res.status(400).json({ error: "Already friends with this user" });
    }

    const pendingRequest =
      targetUser.friendRequests &&
      targetUser.friendRequests.some(
        (req) =>
          req.fromUserId &&
          req.fromUserId.toString() === currentUser._id.toString()
      );
    if (pendingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    const friendRequest = {
      _id: new ObjectId(),
      fromUserId: currentUser._id,
      fromEmail: currentUser.email,
      fromUsername: currentUser.username || currentUser.email,
      fromProfileImageUrl: currentUser.profileImageUrl,
      sentAt: new Date(),
    };

    await users.updateOne(
      { _id: targetUser._id },
      { $push: { friendRequests: friendRequest } }
    );

    res.status(200).json({ success: true, message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Error sending friend request" });
  }
}
