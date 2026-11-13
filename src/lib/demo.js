import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Demo mode helpers.
 *
 * Every visitor who clicks "Try the demo" gets their own temporary guest account
 * (auth keeps a single `sessionId` per user, so one shared account would log
 * visitors out of each other). Guests expire after DEMO_TTL_MS and are removed
 * the next time someone starts a demo.
 */
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_ACTIVE_DEMOS = 150;
export const DEMO_EMAIL_DOMAIN = 'demo.farmflow.local';

// Shared, persistent "neighbour farmers" so the community page and friends list are not empty.
const COMMUNITY_USERS = [
  { email: `ana.popescu@${DEMO_EMAIL_DOMAIN}`, username: 'Ana Popescu' },
  { email: `mihai.ionescu@${DEMO_EMAIL_DOMAIN}`, username: 'Mihai Ionescu' },
  { email: `elena.vasile@${DEMO_EMAIL_DOMAIN}`, username: 'Elena Vasile' },
];

const COMMUNITY_TIPS = [
  { crop: 'wheat', by: 0, content: 'Sow winter wheat in the first half of October. Earlier sowing invites disease, later sowing gives thin stands.' },
  { crop: 'wheat', by: 1, content: 'Split the nitrogen: a third at the start of spring growth, the rest at stem elongation. Less loss, better protein.' },
  { crop: 'corn', by: 2, content: 'Check soil temperature before planting. Corn germinates best above 10 °C at seed depth.' },
  { crop: 'corn', by: 0, content: 'Scout for corn borer in July. Early detection saves most of the yield.' },
  { crop: 'sunflower', by: 1, content: 'Sunflower tolerates drought well, but weed control in the first four weeks decides the harvest.' },
  { crop: 'tomatoes', by: 2, content: 'Water at the base in the morning. Wet leaves in the evening are an open invitation for blight.' },
];

const COMMUNITY_MESSAGES = [
  { by: 0, minutesAgo: 190, content: 'Good morning everyone! First frost is expected this week, are you covering the late tomatoes?' },
  { by: 1, minutesAgo: 150, content: 'I am. Agryl covers are cheap and they gained me two extra weeks last year.' },
  { by: 2, minutesAgo: 95, content: 'Does anyone have experience with sunflower after wheat? Thinking about my rotation for next season.' },
  { by: 0, minutesAgo: 60, content: 'It works well. Just leave at least a year before sunflower returns to the same field.' },
];

/** Polygon (GeoJSON Feature) of roughly `dLon` x `dLat` degrees starting at lon/lat. */
function field(lon, lat, dLon, dLat, id) {
  return {
    type: 'Feature',
    properties: { id },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lon, lat],
        [lon + dLon, lat],
        [lon + dLon, lat + dLat],
        [lon, lat + dLat],
        [lon, lat],
      ]],
    },
  };
}

function sampleCrops() {
  const today = new Date();
  const iso = (daysAgo) => new Date(today.getTime() - daysAgo * 86400000).toISOString().split('T')[0];
  const f1 = `demo-field-${uuidv4().slice(0, 8)}`;
  const f2 = `demo-field-${uuidv4().slice(0, 8)}`;
  const f3 = `demo-field-${uuidv4().slice(0, 8)}`;
  return {
    [f1]: {
      cropName: 'Wheat',
      plantingDate: iso(120),
      area: field(21.205, 45.805, 0.012, 0.006, f1),
      notes: 'North field by the road. Soil test planned for spring.',
      aiRecommendations:
        '<b>Sample recommendations (static, not generated)</b><br/>• Watering: rely on rainfall, irrigate only in a dry spring.<br/>' +
        '• Fertilizing: split nitrogen at the start of spring growth and at stem elongation.<br/>• Pests: scout for aphids in May.<br/>' +
        '• Harvest: when grain moisture drops below 14%.',
    },
    [f2]: {
      cropName: 'Corn',
      plantingDate: iso(60),
      area: field(21.22, 45.795, 0.01, 0.008, f2),
      notes: 'Irrigated plot, drip lines installed.',
      aiRecommendations:
        '<b>Sample recommendations (static, not generated)</b><br/>• Watering: 25–30 mm per week during tasseling.<br/>' +
        '• Fertilizing: side-dress nitrogen at V6.<br/>• Pests: monitor for corn borer in July.',
    },
    [f3]: {
      cropName: 'Sunflower',
      plantingDate: iso(30),
      area: field(21.19, 45.788, 0.008, 0.005, f3),
      notes: '',
      aiRecommendations: '',
    },
  };
}

function randomGuestName() {
  return `Demo-${Math.random().toString(36).slice(2, 6)}`;
}

/** Creates (once) the shared community users, tips and messages. Returns the community user documents. */
export async function ensureDemoCommunity(db) {
  const users = db.collection('users');
  const hash = await bcrypt.hash(uuidv4(), 10); // nobody can log in as these users
  const docs = [];

  for (const u of COMMUNITY_USERS) {
    await users.updateOne(
      { email: u.email },
      {
        $setOnInsert: {
          email: u.email,
          username: u.username,
          password: hash,
          sessionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          crops: {},
          profileImageUrl: null,
          friends: [],
          friendRequests: [],
          isDemoCommunity: true,
        },
      },
      { upsert: true }
    );
    docs.push(await users.findOne({ email: u.email }));
  }

  const tips = db.collection('cropTips');
  if ((await tips.countDocuments({ demoSeed: true })) === 0) {
    await tips.insertMany(
      COMMUNITY_TIPS.map((t, i) => ({
        crop: t.crop,
        content: t.content,
        author: docs[t.by].username,
        authorId: docs[t.by]._id.toString(),
        createdAt: new Date(Date.now() - (i + 1) * 3600000),
        rating: 0,
        votes: 0,
        demoSeed: true,
      }))
    );
  }

  const messages = db.collection('messages');
  if ((await messages.countDocuments({ demoSeed: true })) === 0) {
    await messages.insertMany(
      COMMUNITY_MESSAGES.map((m) => ({
        content: m.content,
        authorId: docs[m.by]._id.toString(),
        authorEmail: docs[m.by].email,
        timestamp: new Date(Date.now() - m.minutesAgo * 60000),
        imageUrl: null,
        reactions: {},
        reactedUsers: {},
        replies: [],
        demoSeed: true,
      }))
    );
  }

  return docs;
}

/** Removes expired guest accounts and the content they created. */
export async function cleanupExpiredDemos(db) {
  const users = db.collection('users');
  const expired = await users
    .find({ isDemo: true, demoExpiresAt: { $lt: new Date() } })
    .project({ _id: 1 })
    .toArray();
  if (expired.length === 0) return 0;

  const ids = expired.map((u) => u._id.toString());
  await db.collection('messages').deleteMany({ authorId: { $in: ids }, demoSeed: { $ne: true } });
  await db.collection('cropTips').deleteMany({ authorId: { $in: ids }, demoSeed: { $ne: true } });
  await users.deleteMany({ _id: { $in: expired.map((u) => u._id) } });
  return expired.length;
}

/** Creates a fresh guest user with sample fields and the community users as friends. */
export async function createDemoUser(db) {
  const community = await ensureDemoCommunity(db);
  const now = new Date();
  const sessionId = uuidv4();
  const id = uuidv4().slice(0, 8);

  const doc = {
    email: `demo-${id}@${DEMO_EMAIL_DOMAIN}`,
    username: randomGuestName(),
    password: await bcrypt.hash(uuidv4(), 10),
    sessionId,
    createdAt: now,
    updatedAt: now,
    crops: sampleCrops(),
    profileImageUrl: null,
    friends: community.map((c) => ({
      _id: c._id.toString(),
      email: c.email,
      username: c.username,
      profileImageUrl: null,
    })),
    friendRequests: [],
    isDemo: true,
    demoExpiresAt: new Date(now.getTime() + DEMO_TTL_MS),
  };

  await db.collection('users').insertOne(doc);
  return { sessionId };
}

/** True when the given user document belongs to a temporary guest. */
export function isDemoUser(user) {
  return Boolean(user && user.isDemo);
}
