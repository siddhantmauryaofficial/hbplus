import "dotenv/config";
import dns from "node:dns";
import { isIP } from "node:net";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || "hbplus";
const dnsServers = (process.env.DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);
let connectionPromise;

if (dnsServers.some((server) => !isIP(server))) {
  throw new Error("DNS_SERVERS must be a comma-separated list of DNS server IP addresses.");
}
if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
}

function getUsersCollection() {
  if (!mongoUri) {
    const error = new Error("MONGODB_URI is not configured.");
    error.code = "app/mongodb-not-configured";
    throw error;
  }

  if (!connectionPromise) {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    connectionPromise = client.connect()
      .then(async () => {
        const collection = client.db(databaseName).collection("users");
        await collection.createIndex({ firebaseUid: 1 }, { unique: true });
        return collection;
      })
      .catch(async (error) => {
        connectionPromise = undefined;
        await client.close().catch(() => {});
        throw error;
      });
  }

  return connectionPromise;
}

export async function saveUserProfile(profile) {
  const users = await getUsersCollection();
  const now = new Date();
  const user = await users.findOneAndUpdate(
    { firebaseUid: profile.uid },
    {
      $set: {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        emailVerified: profile.emailVerified,
        lastLoginAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        firebaseUid: profile.uid,
        role: "user",
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after", includeResultMetadata: false },
  );

  if (!user) {
    throw new Error("MongoDB did not return the saved user profile.");
  }
  return user;
}
