import clientPromise from './mongodb'; 
import { getCookie } from 'cookies-next';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { crops } = req.body;
        if (!crops) {
            return res.status(400).json({ error: 'No crops data provided' });
        }

        const client = await clientPromise;
        const db = client.db('accounts');
        const users = db.collection('users');

        const user = await users.findOne({ sessionId });
        if (!user) {
            return res.status(401).json({ error: 'Session expired' });
        }

        await users.updateOne(
            { sessionId }, 
            { $set: { crops } }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving crops:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}