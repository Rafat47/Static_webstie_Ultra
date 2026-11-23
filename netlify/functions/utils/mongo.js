import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let cachedClient = null;
let cachedDb = null;

// In-memory cache for settings & secrets (5 minutes TTL)
let cachedSecrets = null;
let secretsExpiry = 0;

export async function getDb() {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI_FN || process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'hair_shurokkha';

  if (!uri) {
    throw new Error('Neither MONGODB_URI_FN nor MONGODB_URI environment variable is configured in function environment');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

export async function getMetaCredentials() {
  const now = Date.now();
  if (cachedSecrets && now < secretsExpiry) {
    return cachedSecrets;
  }

  // Primary: Environment variables
  const envToken = process.env.META_CAPI_TOKEN;
  const envTestCode = process.env.META_TEST_EVENT_CODE;

  if (envToken) {
    cachedSecrets = {
      capiToken: envToken,
      testEventCode: envTestCode || ''
    };
    secretsExpiry = now + (5 * 60 * 1000);
    return cachedSecrets;
  }

  // Fallback: secrets collection in MongoDB
  try {
    const db = await getDb();
    const secretDoc = await db.collection('secrets').findOne({ _id: 'meta' });
    const capiToken = secretDoc?.capiAccessToken || '';
    const testEventCode = envTestCode || secretDoc?.testEventCode || '';

    cachedSecrets = {
      capiToken,
      testEventCode
    };
    secretsExpiry = now + (5 * 60 * 1000);
    return cachedSecrets;
  } catch (err) {
    console.warn('[Mongo Utils] Could not retrieve secrets from MongoDB:', err.message);
    return {
      capiToken: '',
      testEventCode: ''
    };
  }
}

