const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function update() {
  let uid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'azadtechnologies19@gmail.com', 'Azad@8081');
    uid = cred.user.uid;
    console.log('Created new auth user for admin');
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('Auth user exists. Attempting sign-in to get UID...');
      try {
        const cred2 = await signInWithEmailAndPassword(auth, 'azadtechnologies19@gmail.com', 'Azad@8081');
        uid = cred2.user.uid;
      } catch (err) {
        console.log('Sign-in failed (maybe different password?), but will proceed to seed Firestore doc anyway.');
      }
    } else {
      console.error(e);
    }
  }

  const adminUser = {
    username: 'admin',
    email: 'azadtechnologies19@gmail.com',
    fullName: 'Azad (Admin)',
    is_service_account: false,
    is_verified: true,
    status: 'online',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    is_truecaller_verified: true,
    mobile_number: '+910000000000',
    bio: 'Platform Administrator & Developer'
  };
  
  if (uid) {
    await setDoc(doc(db, 'users', uid), adminUser);
  }
  await setDoc(doc(db, 'users', 'admin'), adminUser);

  const saUser = {
    username: 'zenoa_verify',
    email: 'verify@zenoa.com',
    fullName: 'Zenoa Verify',
    is_service_account: true,
    is_verified: true,
    status: 'online',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    bio: 'Official Zenoa Security & Authentication Bot'
  };
  await setDoc(doc(db, 'users', 'zenoa_verify'), saUser);

  console.log('Firestore seed complete!');
  process.exit(0);
}
update();
