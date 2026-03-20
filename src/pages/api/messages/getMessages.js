import clientPromise, { getDatabase } from '../auth/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Normalize an identifier string into a MongoDB ObjectId.
 * Returns null for invalid values.
 */
function toObjectId(value) {
    if (!value || typeof value !== 'string') return null;

    try {
        return new ObjectId(value);
    } catch (error) {
        console.error('Invalid ObjectId:', value, error);
        return null;
    }
}

/**
 * GET /api/messages/getMessages
 *
 * Returns messages for the authenticated user and their friends.
 */
export default async function getMessagesHandler(req, res) {
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

        const friendUserIds = (Array.isArray(authenticatedUser.friends)
            ? authenticatedUser.friends
            : []
        ).map((friend) =>
            typeof friend === 'object' && friend?._id ? String(friend._id) : String(friend)
        );

        const authenticatedUserId = String(authenticatedUser._id);
        if (authenticatedUserId) friendUserIds.push(authenticatedUserId);

        const messagesCollection = accountsDb.collection('messages');
        const rawMessages = await messagesCollection
            .find({
                $or: [
                    { authorId: { $in: friendUserIds } },
                    { authorId: authenticatedUserId },
                ],
            })
            .sort({ timestamp: 1 })
            .toArray();

        const uniqueAuthorIds = [...new Set(rawMessages.map((message) => message.authorId))];
        const authorObjectIds = uniqueAuthorIds
            .map(toObjectId)
            .filter((id) => id !== null);

        const authorProfiles = await usersCollection
            .find({ _id: { $in: authorObjectIds } })
            .project({ _id: 1, username: 1, email: 1, profileImageUrl: 1 })
            .toArray();

        const profileById = authorProfiles.reduce((acc, profile) => {
            acc[profile._id.toString()] = {
                username: profile.username || profile.email,
                email: profile.email,
                profileImageUrl: profile.profileImageUrl,
            };
            return acc;
        }, {});

        const messagesWithAuthorProfiles = rawMessages.map((message) => ({
            ...message,
            authorDetails:
                profileById[message.authorId] || {
                    username: message.authorEmail,
                    email: message.authorEmail,
                },
        }));

        res.status(200).json({ messages: messagesWithAuthorProfiles });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
}