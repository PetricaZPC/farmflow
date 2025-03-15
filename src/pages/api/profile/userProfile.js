import clientPromise from '../auth/mongodb';

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
        
        console.log('Friend requests data structure:', JSON.stringify(user.friendRequests || []));
        
        res.status(200).json({
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            profileImageUrl: user.profileImageUrl,
            crops: user.crops || {},
            friends: user.friends || [],
            friendRequests: user.friendRequests || []
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
}