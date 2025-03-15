import clientPromise from "../auth/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username } = req.body;

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length === 0
    ) {
      return res.status(400).json({ error: "Username is required" });
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length > 30) {
      return res
        .status(400)
        .json({ error: "Username must be 30 characters or less" });
    }

    const client = await clientPromise;
    const db = client.db("accounts");
    const users = db.collection("users");

    const user = await users.findOne({ sessionId });

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const existingUser = await users.findOne({
      username: trimmedUsername,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          username: trimmedUsername,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      username: trimmedUsername,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Error updating profile" });
  }
}
