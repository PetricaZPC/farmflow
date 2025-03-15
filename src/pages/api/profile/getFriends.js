import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const client = await clientPromise;
        const db = client.db('accounts');
        const users = db.collection('users');
        
        const user = await users.findOne({ sessionId });
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const friends = [];
        if (user.friends && user.friends.length > 0) {
            const friendIds = user.friends.map(id => {
                try {
                    return new ObjectId(id);
                } catch (error) {
                    return null;
                }
            }).filter(id => id !== null);

            const friendDocs = await users
                .find({ _id: { $in: friendIds } })
                .project({ _id: 1, email: 1, username: 1, profileImageUrl: 1 })
                .toArray();
                
            friends.push(...friendDocs);
        }

        res.status(200).json({ friends });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Error fetching friends' });
    }
}