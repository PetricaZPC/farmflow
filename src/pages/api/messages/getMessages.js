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
        const currentUser = await users.findOne({ sessionId });
        
        if (!currentUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const friendIds = [...(currentUser.friends || [])].map(id => 
            typeof id === 'object' && id._id ? id._id.toString() : String(id)
        );
        
        friendIds.push(currentUser._id.toString());

        const messagesCollection = db.collection('messages');
        const messages = await messagesCollection
            .find({
                $or: [
                    { authorId: { $in: friendIds } },
                    { authorId: currentUser._id.toString() }
                ]
            })
            .sort({ timestamp: 1 })
            .toArray();

        const authorIds = [...new Set(messages.map(msg => msg.authorId))];
        const authorObjectIds = authorIds
            .filter(id => id && typeof id === 'string')
            .map(id => {
                try {
                    return new ObjectId(id);
                } catch (error) {
                    console.error(`Invalid author ObjectId: ${id}`, error);
                    return null;
                }
            })
            .filter(id => id !== null);

        const authorDetails = await users
            .find({ _id: { $in: authorObjectIds } })
            .project({ _id: 1, username: 1, email: 1, profileImageUrl: 1 })
            .toArray();

        const userMap = {};
        authorDetails.forEach(user => {
            userMap[user._id.toString()] = {
                username: user.username || user.email,
                email: user.email,
                profileImageUrl: user.profileImageUrl
            };
        });

        const enrichedMessages = messages.map(msg => ({
            ...msg,
            authorDetails: userMap[msg.authorId] || {
                username: msg.authorEmail,
                email: msg.authorEmail
            }
        }));

        res.status(200).json({ messages: enrichedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
}