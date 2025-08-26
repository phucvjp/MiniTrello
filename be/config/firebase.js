const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
let db;

try {
  // Initialize Firebase Admin with service account key
  var serviceAccount = require("../minitrello-7fda4-firebase-adminsdk-fbsvc-699237d7bf.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  db = admin.firestore();
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  // In development, create a mock database
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Using mock database for development");
    db = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => ({}) }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        }),
        add: () => Promise.resolve({ id: "mock-id" }),
        where: () => ({
          get: () => Promise.resolve({ docs: [] }),
        }),
        get: () => Promise.resolve({ docs: [] }),
      }),
    };
  }
}

module.exports = {
  admin,
  db,
};
