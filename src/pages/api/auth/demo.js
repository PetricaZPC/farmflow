import { setCookie } from 'cookies-next';
import clientPromise, { getDatabase } from './mongodb';
import { cleanupExpiredDemos, createDemoUser, MAX_ACTIVE_DEMOS, DEMO_TTL_MS } from '../../../lib/demo';

/**
 * POST /api/auth/demo
 *
 * Starts a temporary demo session: creates a guest user with sample fields and
 * community data, and sets the same session cookie as a normal login.
 */
export default async function demoHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await clientPromise;
    const db = await getDatabase();

    await cleanupExpiredDemos(db);

    const active = await db.collection('users').countDocuments({ isDemo: true });
    if (active >= MAX_ACTIVE_DEMOS) {
      return res.status(429).json({ error: 'The demo is very busy right now. Please try again in a few minutes.' });
    }

    const { sessionId } = await createDemoUser(db);

    setCookie('sessionId', sessionId, {
      req,
      res,
      httpOnly: true,
      maxAge: Math.floor(DEMO_TTL_MS / 1000),
      sameSite: 'Lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({ message: 'Demo session started' });
  } catch (error) {
    console.error('Error starting demo session:', error);
    return res.status(500).json({ error: 'Could not start the demo. The database may be unavailable.' });
  }
}
