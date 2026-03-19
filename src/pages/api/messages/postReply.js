import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Convert a value into a MongoDB ObjectId instance.
 * Returns null for invalid values.
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
 * POST /api/messages/postReply
 *
 * Adds a reply under a message thread, attaching the object ID and author info.
 */
export default async function postReplyHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messageId, content, userEmail } = req.body;

        const parentMessageId = toObjectId(messageId);
        if (!parentMessageId) {
            return res.status(400).json({ error: 'Invalid messageId' });
        }

        const mongoClient = await clientPromise;
        const accountsDb = mongoClient.db('accounts');
        const messagesCollection = accountsDb.collection('messages');

        const replyDocument = {
            messageId: parentMessageId,
            content,
            authorEmail: userEmail,
            timestamp: new Date(),
        };

        const updateResult = await messagesCollection.updateOne(
            { _id: parentMessageId },
            { $push: { replies: replyDocument } }
        );

        if (!updateResult.modifiedCount) {
            return res.status(500).json({ error: 'Failed to post reply' });
        }

        return res.status(201).json({ reply: replyDocument });
    } catch (error) {
        console.error('Error posting reply:', error);
        return res.status(500).json({ error: 'Failed to post reply' });
    }
}