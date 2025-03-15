import clientPromise from './mongodb';
import bcrypt from 'bcryptjs';
import { setCookie } from 'cookies-next';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('accounts');
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = uuidv4();

    await users.updateOne({ email }, { $set: { sessionId } });

    setCookie('sessionId', sessionId, { req, res, httpOnly: true, maxAge: 3600, sameSite: 'Strict' });

    res.status(200).json({
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred while logging in' });
  }
}