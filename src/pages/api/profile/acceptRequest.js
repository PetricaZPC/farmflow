import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { fromEmail, accepted } = req.body;
    
    if (!fromEmail) {
        return res.status(400).json({ error: 'Friend email is required' });
    }

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const client = await clientPromise;
        const db = client.db('test');
        const users = db.collection('users');

        const currentUser = await users.findOne({ sessionId });
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const sender = await users.findOne({ email: fromEmail.toLowerCase() });
        if (!sender) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        await users.updateOne(
            { _id: currentUser._id },
            { $pull: { friendRequests: { fromEmail: fromEmail.toLowerCase() } } }
        );

        if (accepted) {
            const friendData = {
                _id: sender._id.toString(),
                email: sender.email,
                username: sender.username || sender.email.split('@')[0],
                profileImageUrl: sender.profileImageUrl || null
            };
            
            const currentUserData = {
                _id: currentUser._id.toString(),
                email: currentUser.email,
                username: currentUser.username || currentUser.email.split('@')[0],
                profileImageUrl: currentUser.profileImageUrl || null
            };

            await users.updateOne(
                { _id: currentUser._id },
                { $addToSet: { friends: friendData } }
            );
            
            await users.updateOne(
                { _id: sender._id },
                { $addToSet: { friends: currentUserData } }
            );

            return res.status(200).json({
                message: 'Friend request accepted',
                friend: friendData
            });
        } else {
            return res.status(200).json({ message: 'Friend request declined' });
        }

    } catch (error) {
        console.error('Error handling friend request:', error);
        return res.status(500).json({ error: 'An error occurred while processing the friend request' });
    }
}
