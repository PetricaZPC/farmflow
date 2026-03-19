import clientPromise from './mongodb';

/**
 * GET /api/auth/checkAuth
 *
 * Validates user session and returns basic profile data.
 */
export default async function checkAuthHandler(req, res) {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const mongoClient = await clientPromise;
    const accountsDb = mongoClient.db('accounts');
    const usersCollection = accountsDb.collection('users');

    const authenticatedUser = await usersCollection.findOne({ sessionId });
    if (!authenticatedUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({
      message: "Authenticated",
      email: authenticatedUser.email,
      crops: authenticatedUser.crops,
    });
  } catch (error) {
    return res.status(401).json({ message: "Not authenticated" });
  }
}