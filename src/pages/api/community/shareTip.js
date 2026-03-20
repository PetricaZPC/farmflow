import clientPromise, { getDatabase } from '../auth/mongodb';

/**
 * POST /api/community/shareTip
 *
 * Creates a new community tip for a given crop submitted by the authenticated user.
 */
export default async function shareCropTipHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { crop, tip } = req.body;
    
    if (!crop || !tip) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const mongoClient = await clientPromise;
    const accountsDb = await getDatabase();
    const tipsCollection = accountsDb.collection('cropTips');
    const usersCollection = accountsDb.collection('users');

    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const authenticatedUser = await usersCollection.findOne({ sessionId });
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const tipDocument = {
      crop: crop.toLowerCase(),
      content: tip,
      author: authenticatedUser.username || authenticatedUser.email.split('@')[0],
      authorId: authenticatedUser._id.toString(),
      createdAt: new Date(),
      rating: 0,
      votes: 0,
    };

    const insertResult = await tipsCollection.insertOne(tipDocument);
    
    return res.status(200).json({
      success: true,
      tip: {
        ...tipDocument,
        _id: insertResult.insertedId,
      },
    });
    
  } catch (error) {
    console.error('Error sharing crop tip:', error);
    return res.status(500).json({ error: 'Failed to share crop tip' });
  }
}