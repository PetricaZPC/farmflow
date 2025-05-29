import clientPromise from './mongodb'; 

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

        console.log("Received crops data:", JSON.stringify(crops).substring(0, 200) + "...");

        const client = await clientPromise;
        const db = client.db('accounts');
        const users = db.collection('users');

        // First check if user exists
        const user = await users.findOne({ sessionId });
        if (!user) {
            console.error("User not found with sessionId:", sessionId);
            return res.status(401).json({ error: 'Session expired or user not found' });
        }

        // Then update the user document
        const result = await users.updateOne(
            { _id: user._id }, 
            { $set: { crops: crops } }
        );

        console.log("Update result:", result);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (result.modifiedCount === 0 && result.matchedCount === 1) {
            // Document was found but not modified (perhaps identical data)
            console.log("Document found but not modified");
        }

        res.status(200).json({ success: true, message: 'Crops saved successfully' });
    } catch (error) {
        console.error('Error saving crops:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}