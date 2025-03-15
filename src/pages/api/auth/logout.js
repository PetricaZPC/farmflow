import { deleteCookie } from 'cookies-next';
import clientPromise from './mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
      try {
        const client = await clientPromise;
        const db = client.db('accounts');
        const users = db.collection('users');
        
        await users.updateOne(
          { sessionId },
          { $unset: { sessionId: "" } }
        );
      } catch (dbError) {
        console.error('Database error during logout:', dbError);
      }
    }

    deleteCookie('sessionId', { 
      req, 
      res, 
      path: '/' 
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'An error occurred while logging out' });
  }
}
