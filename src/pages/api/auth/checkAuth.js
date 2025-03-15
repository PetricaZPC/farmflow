import clientPromise from './mongodb';

export default async function handler(req, res) {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const users = db.collection('users');

    const user = await users.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.status(200).json({ message: "Authenticated", email: user.email, crops: user.crops });
  } catch (error) {
    res.status(401).json({ message: "Not authenticated" });
  }
}