const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function create() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'security@zenoa.com', 'zenoa_admin_777');
    const sa = {
      username: 'sa_zenoa',
      email: 'security@zenoa.com',
      fullName: 'Zenoa Security Bot',
      is_service_account: true,
      is_verified: true,
      status: 'online',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      is_truecaller_verified: true,
      mobile_number: '+18005550199',
      bio: 'Official Zenoa Security & Authentication Bot'
    };
    await setDoc(doc(db, 'users', cred.user.uid), sa);
    
    // Also create the doc at 'sa_zenoa' just in case some logic reads from it directly
    await setDoc(doc(db, 'users', 'sa_zenoa'), sa);
    
    console.log('sa_zenoa Auth User created successfully! UID:', cred.user.uid);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('User already exists in Auth. Will just update the sa_zenoa doc to point to whatever it needs to. Not needed right now.');
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}
create();
