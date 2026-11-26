import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let cachedClient = null;
let cachedDb = null;
let connecting = null;

// In-memory cache for secrets (5 minutes TTL)
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

  // Share one connection attempt between concurrent callers
  if (!connecting) {
    connecting = (async () => {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000
      });
      try {
        await client.connect();
        cachedClient = client;
        cachedDb = client.db(dbName);
        return cachedDb;
      } catch (err) {
        // Clear the cache so the next call retries a fresh connection
        try { await client.close(); } catch (closeErr) {}
        cachedClient = null;
        cachedDb = null;
        throw err;
      } finally {
        connecting = null;
      }
    })();
  }

  return connecting;
}

export async function getMetaCredentials() {
  const now = Date.now();
  if (cachedSecrets && now < secretsExpiry) {
    return cachedSecrets;
  }

  // Primary: Environment variables (no database call)
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

  // Fallback: secrets collection in MongoDB (only when env var is not set)
  try {
    const db = await getDb();
    const secretDoc = await db.collection('secrets').findOne({ _id: 'meta' });
    const capiToken = secretDoc?.capiAccessToken || '';
    const testEventCode = envTestCode || secretDoc?.testEventCode || '';

    // Only cache a usable token, so a failed read is retried on the next event
    if (capiToken) {
      cachedSecrets = { capiToken, testEventCode };
      secretsExpiry = now + (5 * 60 * 1000);
    }
    return { capiToken, testEventCode };
  } catch (err) {
    console.warn('[Mongo Utils] Could not retrieve secrets from MongoDB:', err.message);
    return { capiToken: '', testEventCode: '' };
  }
}