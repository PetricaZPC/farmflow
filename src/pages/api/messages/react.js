import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { messageId, reaction, action, userEmail } = req.body;
    
    if (!messageId || !reaction || !action || !userEmail) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log("Received reaction request:", { messageId, reaction, action, userEmail });
    
    try {
      const client = await clientPromise;
      const db = client.db('accounts');
      const messages = db.collection('messages');
      
      let msgObjectId;
      try {
        msgObjectId = new ObjectId(messageId);
        console.log("Converted to ObjectId:", msgObjectId);
      } catch (err) {
        console.error("Invalid ObjectId format:", messageId, err);
        return res.status(400).json({ error: `Invalid message ID format: ${messageId}` });
      }
      
      const message = await messages.findOne({ _id: msgObjectId });
      if (!message) {
        console.error("Message not found:", messageId);
        return res.status(404).json({ error: `Message with ID ${messageId} not found` });
      }
      
      if (!message.reactedUsers) {
        await messages.updateOne(
          { _id: msgObjectId },
          { $set: { reactedUsers: {} } }
        );
      }
      
      if (!message.reactions) {
        await messages.updateOne(
          { _id: msgObjectId },
          { $set: { reactions: {} } }
        );
      }

      if (action === 'like') {
        const userAlreadyLiked = message.reactedUsers && 
            message.reactedUsers[reaction] && 
            message.reactedUsers[reaction].includes(userEmail);
            
        if (!userAlreadyLiked) {
          await messages.updateOne(
            { _id: msgObjectId },
            { 
              $inc: { [`reactions.${reaction}`]: 1 },
              $push: { [`reactedUsers.${reaction}`]: userEmail } 
            }
          );
        }
      } 
      else if (action === 'unlike') {
        const userHasLiked = message.reactedUsers && 
            message.reactedUsers[reaction] && 
            message.reactedUsers[reaction].includes(userEmail);
            
        if (userHasLiked) {
          const currentCount = message.reactions && message.reactions[reaction] || 0;
          
          if (currentCount > 0) {
            await messages.updateOne(
              { _id: msgObjectId },
              { 
                $inc: { [`reactions.${reaction}`]: -1 },
                $pull: { [`reactedUsers.${reaction}`]: userEmail } 
              }
            );
          } else {
            await messages.updateOne(
              { _id: msgObjectId },
              { 
                $pull: { [`reactedUsers.${reaction}`]: userEmail } 
              }
            );
          }
        }
      }
      
      const updatedMessage = await messages.findOne(
        { _id: msgObjectId },
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