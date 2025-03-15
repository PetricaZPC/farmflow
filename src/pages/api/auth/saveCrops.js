import clientPromise from '../auth/mongodb';
import { getCookie } from 'cookies-next';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { crops } = req.body;

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const client = await clientPromise;
        const db = client.db('accounts');
        const users = db.collection('users');

        const user = await users.findOne({ sessionId: sessionId });
        if (!user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        await users.updateOne({ sessionId: sessionId }, { $set: { crops: crops } });

        console.log('Crops saved successfully');
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving crops:', error);
        res.status(500).json({ error: 'An error occurred while saving crops' });
    }
}
