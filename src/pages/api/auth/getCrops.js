import clientPromise from './mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

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
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ crops: user.crops || {}, email: user.email });
    } catch (error) {
        console.error('Error fetching crops:', error);
        res.status(500).json({ error: 'An error occurred while fetching crops' });
    }
}
