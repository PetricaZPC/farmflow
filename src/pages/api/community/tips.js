import clientPromise from '../auth/mongodb';

/**
 * GET /api/community/tips
 *
 * Returns up to 20 latest community tips for the requested crop.
 */
export default async function getCropTipsHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { crop } = req.query;
    
    if (!crop) {
      return res.status(400).json({ error: 'Missing crop parameter' });
    }
    
    const client = await clientPromise;
    const db = client.db('accounts');
    const tipsCollection = db.collection('cropTips');
    
    
    const tips = await tipsCollection
      .find({ crop: crop.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    return res.status(200).json({ tips });
    
  } catch (error) {
    console.error('Error fetching crop tips:', error);
    return res.status(500).json({ error: 'Failed to fetch crop tips' });
  }
}