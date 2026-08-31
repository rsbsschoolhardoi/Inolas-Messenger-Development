const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const sa = {
    username: 'sa_zenoa',
    email: 'security@zenoa.com',
    fullName: 'Zenoa Security Bot',
    password: 'password123', // plain text for testing if hash is not used, wait, App.tsx probably does some hashing or just plain?
    is_service_account: true,
    is_verified: true,
    status: 'online',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    is_truecaller_verified: true,
    mobile_number: '+18005550199',
    bio: 'Official Zenoa Security & Authentication Bot'
  };
  await setDoc(doc(db, 'users', 'sa_zenoa'), sa);
  console.log('sa_zenoa seeded successfully');
  process.exit(0);
}
seed();
