import { MongoClient } from 'mongodb';

// Use explicit environment variables for cluster and DB isolation
const uri = process.env.MONGODB_URI;
const options = {};

const defaultDbNames = {
  accounts: process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || 'accounts',
};

const dbPrefix = process.env.MONGODB_DB_PREFIX || '';

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

function resolveDbName(dbName = 'accounts') {
  if (process.env.MONGODB_DB) {
    return process.env.MONGODB_DB;
  }
  if (process.env.MONGODB_DB_NAME) {
    return process.env.MONGODB_DB_NAME;
  }
  if (defaultDbNames[dbName]) {
    return `${dbPrefix}${defaultDbNames[dbName]}`;
  }
  return `${dbPrefix}${dbName}`;
}

export async function getDatabase(dbName = 'accounts') {
  const client = await clientPromise;
  return client.db(resolveDbName(dbName));
}

export default clientPromise;