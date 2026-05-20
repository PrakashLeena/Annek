import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC0D0OGEPkiqUyEDHqy1qgmem7E1CHaVyc",
  authDomain: "annek-81e16.firebaseapp.com",
  projectId: "annek-81e16",
  storageBucket: "annek-81e16.firebasestorage.app",
  messagingSenderId: "223846726913",
  appId: "1:223846726913:web:eceb36072b93c04944af00",
  measurementId: "G-C0JJ6KJPS4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);
export { onAuthStateChanged };
