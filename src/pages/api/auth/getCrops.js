import clientPromise, { getDatabase } from './mongodb';

/**
 * GET/POST /api/auth/getCrops
 *
 * Retrieves stored crop data for the authenticated user.
 */
export default async function getCropsHandler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies.sessionId;

        if (!sessionId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const mongoClient = await clientPromise;
        const accountsDb = await getDatabase();
        const usersCollection = accountsDb.collection('users');

        const authenticatedUser = await usersCollection.findOne({ sessionId });

        if (!authenticatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            crops: authenticatedUser.crops || {},
            email: authenticatedUser.email,
        });
    } catch (error) {
        console.error('Error fetching crops:', error);
        return res.status(500).json({ error: 'An error occurred while fetching crops' });
    }
}
