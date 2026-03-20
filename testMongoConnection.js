const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'FarmFlow';

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Connected! Collections:', collections.map(c => c.name));
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

testConnection();
