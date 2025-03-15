import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { recipientEmail } = req.body;
        
        if (!recipientEmail) {
            return res.status(400).json({ error: 'Recipient email is required' });
        }

        const client = await clientPromise;
        const db = client.db('test');
        const users = db.collection('users');
        
        const currentUser = await users.findOne({ sessionId });
        if (!currentUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const recipient = await users.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (currentUser._id.toString() === recipient._id.toString()) {
            return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
        }

        if (recipient.friendRequests && recipient.friendRequests.some(
            req => req.from.toString() === currentUser._id.toString() && req.status === 'pending'
        )) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        if (recipient.friends && recipient.friends.includes(currentUser._id.toString())) {
            return res.status(400).json({ error: 'You are already friends with this user' });
        }

        await users.updateOne(
            { email: recipientEmail.toLowerCase() },
            { 
                $push: { 
                    friendRequests: {
                        _id: new ObjectId(),
                        fromUserId: currentUser._id.toString(),
                        fromEmail: currentUser.email,
                        fromUsername: currentUser.username || currentUser.email.split('@')[0],
                        fromProfileImageUrl: currentUser.profileImageUrl || null,
                        createdAt: new Date()
                    } 
                } 
            }
        );

        return res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        return res.status(500).json({ error: 'Error sending friend request' });
    }
}
