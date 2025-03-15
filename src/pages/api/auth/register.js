import clientPromise from './mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password, username } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let finalUsername = username;
    if (username) {
        if (typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({ error: 'Username cannot be empty' });
        }
        
        if (username.trim().length > 30) {
            return res.status(400).json({ error: 'Username must be 30 characters or less' });
        }
        finalUsername = username.trim();
    } else {
        finalUsername = email.split('@')[0];
        if (finalUsername.length > 30) {
            finalUsername = finalUsername.substring(0, 30);
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const client = await clientPromise;
        const db = client.db('accounts');
        const users = db.collection('users');

        const existingUser = await users.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        if (finalUsername) {
            const existingUsername = await users.findOne({ 
                username: new RegExp(`^${finalUsername}$`, 'i')
            });
            
            if (existingUsername) {
                return res.status(400).json({ error: 'Username is already taken' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        const now = new Date();
        const sessionId = uuidv4();
        
        await users.insertOne({ 
            email: email.toLowerCase(), 
            password: hashedPassword,
            username: finalUsername,
            sessionId,
            createdAt: now,
            updatedAt: now,
            crops: {},
            profileImageUrl: null,
            friends: [],
            friendRequests: []
        });

        res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=86400`);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'An error occurred while registering' });
    }
}
