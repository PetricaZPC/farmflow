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

    const { requestId, accepted } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    const client = await clientPromise;
    const db = client.db("accounts");
    const users = db.collection("users");

    const currentUser = await users.findOne({ sessionId });
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const requestIndex = currentUser.friendRequests.findIndex(
      (req) => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const request = currentUser.friendRequests[requestIndex];

    const updatedRequests = [...currentUser.friendRequests];
    updatedRequests.splice(requestIndex, 1);

    await users.updateOne(
      { _id: currentUser._id },
      { $set: { friendRequests: updatedRequests } }
    );

    if (accepted) {
      const requesterObjectId = new ObjectId(request.fromUserId);
      const requester = await users.findOne({ _id: requesterObjectId });

      if (!requester) {
        return res.status(404).json({ error: "Requesting user not found" });
      }

      await users.updateOne(
        { _id: currentUser._id },
        {
          $push: {
            friends: {
              _id: requester._id.toString(),
              username: requester.username,
              email: requester.email,
              profileImageUrl: requester.profileImageUrl,
            },
          },
        }
      );

      await users.updateOne(
        { _id: requester._id },
        {
          $push: {
            friends: {
              _id: currentUser._id.toString(),
              username: currentUser.username,
              email: currentUser.email,
              profileImageUrl: currentUser.profileImageUrl,
            },
          },
        }
      );
    }

    res.status(200).json({
      message: accepted ? "Friend request accepted" : "Friend request declined",
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    res.status(500).json({ error: "Error responding to friend request" });
  }
}
