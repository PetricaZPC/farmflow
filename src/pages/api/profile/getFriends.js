import clientPromise, { getDatabase } from '../auth/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Convert a string value to MongoDB ObjectId, or return null.
 */
function toObjectId(value) {
    if (!value || typeof value !== 'string') return null;

    try {
        return new ObjectId(value);
    } catch (error) {
        console.error('Invalid ObjectId value:', value, error);
        return null;
    }
}

/**
 * GET /api/profile/getFriends
 *
 * Returns a list of friend profiles for the authenticated user.
 */
export default async function getFriendsHandler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const mongoClient = await clientPromise;
        const accountsDb = await getDatabase();
        const usersCollection = accountsDb.collection('users');

        const authenticatedUser = await usersCollection.findOne({ sessionId });
        if (!authenticatedUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const friendsFromDb = authenticatedUser.friends || [];

        // If the friends list already contains full user objects, return it.
        if (friendsFromDb.length > 0 && typeof friendsFromDb[0] === 'object') {
            return res.status(200).json({ friends: friendsFromDb });
        }

        // Otherwise, resolve stored IDs to user profiles.
        const friendObjectIds = friendsFromDb
            .map((friendId) => toObjectId(String(friendId)))
            .filter((id) => id !== null);

        const friendProfiles =
            friendObjectIds.length > 0
                ? await usersCollection
                      .find({ _id: { $in: friendObjectIds } })
                      .project({ _id: 1, email: 1, username: 1, profileImageUrl: 1 })
                      .toArray()
                : [];

        return res.status(200).json({ friends: friendProfiles });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Error fetching friends' });
    }
}