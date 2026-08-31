const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function create() {
  try {
    let email = 'azad_admin@zenoa.com';
    const password = 'Azad@8081';
    let uid;
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        email = 'azad_core_admin@zenoa.com';
        const cred2 = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred2.user.uid;
      } else {
        throw e;
      }
    }

    const adminUser = {
      username: 'admin',
      email: email,
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
    
    await setDoc(doc(db, 'users', uid), adminUser);
    await setDoc(doc(db, 'users', 'admin'), adminUser);
    
    console.log('Account @admin created successfully with your password!');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
create();
