import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Parse a string into a MongoDB ObjectId.
 * Returns null if parsing fails.
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
 * POST /api/messages/react
 *
 * Adds or removes a reaction (like/unlike) on a message.
 */
export default async function postMessageReaction(req, res) {
  if (req.method === 'POST') {
    const { messageId, reaction, action, userEmail } = req.body;
    
    if (!messageId || !reaction || !action || !userEmail) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log("Received reaction request:", { messageId, reaction, action, userEmail });
    
    try {
      const mongoClient = await clientPromise;
      const accountsDb = mongoClient.db('accounts');
      const messagesCollection = accountsDb.collection('messages');

      const messageObjectId = toObjectId(messageId);
      if (!messageObjectId) {
        return res.status(400).json({ error: `Invalid message ID format: ${messageId}` });
      }

      const message = await messagesCollection.findOne({ _id: messageObjectId });
      if (!message) {
        console.error("Message not found:", messageId);
        return res.status(404).json({ error: `Message with ID ${messageId} not found` });
      }
      
      if (!message.reactedUsers) {
        await messagesCollection.updateOne(
          { _id: messageObjectId },
          { $set: { reactedUsers: {} } }
        );
      }

      if (!message.reactions) {
        await messagesCollection.updateOne(
          { _id: messageObjectId },
          { $set: { reactions: {} } }
        );
      }

      if (action === 'like') {
        const userAlreadyLiked =
          message.reactedUsers?.[reaction]?.includes(userEmail);

        if (!userAlreadyLiked) {
          await messagesCollection.updateOne(
            { _id: messageObjectId },
            {
              $inc: { [`reactions.${reaction}`]: 1 },
              $push: { [`reactedUsers.${reaction}`]: userEmail },
            }
          );
        }
      } else if (action === 'unlike') {
        const userHasLiked = message.reactedUsers?.[reaction]?.includes(userEmail);

        if (userHasLiked) {
          const currentCount = message.reactions?.[reaction] || 0;

          if (currentCount > 0) {
            await messagesCollection.updateOne(
              { _id: messageObjectId },
              {
                $inc: { [`reactions.${reaction}`]: -1 },
                $pull: { [`reactedUsers.${reaction}`]: userEmail },
              }
            );
          } else {
            await messagesCollection.updateOne(
              { _id: messageObjectId },
              {
                $pull: { [`reactedUsers.${reaction}`]: userEmail },
              }
            );
          }
        }
      }
      
      const updatedMessage = await messagesCollection.findOne(
        { _id: messageObjectId },
        { projection: { reactions: 1, reactedUsers: 1 } }
      );
      
      console.log("Updated message:", updatedMessage);
      
      res.status(200).json({ 
        reactions: updatedMessage.reactions || {},
        reactedUsers: updatedMessage.reactedUsers || {}
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
      res.status(500).json({ error: `Failed to update reaction: ${error.message}` });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}