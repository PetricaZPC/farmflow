import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messageId, content, userEmail } = req.body;

        const client = await clientPromise;
        const db = client.db('accounts');
        const messages = db.collection('messages');

        const reply = {
            messageId: new ObjectId(messageId),
            content,
            authorEmail: userEmail,
            timestamp: new Date(),
        };

        const result = await messages.updateOne(
            { _id: new ObjectId(messageId) },
            { $push: { replies: reply } }
        );

        if (!result.modifiedCount) {
            return res.status(500).json({ error: 'Failed to post reply' });
        }

        res.status(201).json({ reply });
    } catch (error) {
        console.error('Error posting reply:', error);
        res.status(500).json({ error: 'Failed to post reply' });
    }
}