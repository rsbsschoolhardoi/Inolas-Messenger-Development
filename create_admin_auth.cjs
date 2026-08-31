const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function create() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'admin@zenoa.com', 'zenoa_admin_777');
    const adminUser = {
      username: 'zenoa_admin',
      email: 'admin@zenoa.com',
      fullName: 'Zenoa Platform Admin',
      is_service_account: false, // Normal user!
      is_verified: true,
      status: 'online',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      is_truecaller_verified: true,
      mobile_number: '+18005550200',
      bio: 'Platform Administrator & Developer'
    };
    await setDoc(doc(db, 'users', cred.user.uid), adminUser);
    await setDoc(doc(db, 'users', 'zenoa_admin'), adminUser);
    
    console.log('zenoa_admin Auth User created successfully! UID:', cred.user.uid);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('zenoa_admin already exists in Auth.');
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}
create();
