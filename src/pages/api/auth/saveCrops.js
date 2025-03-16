import clientPromise from './mongodb'; 
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
            console.error('User not found with sessionId:', sessionId);
            return res.status(404).json({ message: "User not found" });
        }

        console.log('User found:', user.email);
        console.log('Saving crops:', Object.keys(crops).length);

        await users.updateOne({ sessionId: sessionId }, { $set: { crops: crops } });

        // Verify the update worked
        const updatedUser = await users.findOne({ sessionId: sessionId });
        console.log('After update, crops:', Object.keys(updatedUser.crops).length);
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving crops:', error);
        res.status(500).json({ error: 'An error occurred while saving crops' });
    }
}