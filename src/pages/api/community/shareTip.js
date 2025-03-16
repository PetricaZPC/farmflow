import clientPromise from '../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { crop, tip } = req.body;
    
    if (!crop || !tip) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const client = await clientPromise;
    const db = client.db('accounts');
    const tipsCollection = db.collection('cropTips');
    const usersCollection = db.collection('users');
    
    // Get the current user from session
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Create the tip document
    const tipDoc = {
      crop: crop.toLowerCase(),
      content: tip,
      author: user.username || user.email.split('@')[0],
      authorId: user._id.toString(),
      createdAt: new Date(),
      rating: 0,
      votes: 0
    };
    
    // Insert the tip
    const result = await tipsCollection.insertOne(tipDoc);
    
    return res.status(200).json({
      success: true,
      tip: {
        ...tipDoc,
        _id: result.insertedId
      }
    });
    
  } catch (error) {
    console.error('Error sharing crop tip:', error);
    return res.status(500).json({ error: 'Failed to share crop tip' });
  }
}