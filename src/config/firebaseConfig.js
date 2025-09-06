// Import needed Firebase modules
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Your Firebase project configuration (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBixuaZjtKkCAdaLsYuQHi5VvAQiOnTxZM",
  authDomain: "nhkproject-ae1f9.firebaseapp.com",
  projectId: "nhkproject-ae1f9",
  storageBucket: "nhkproject-ae1f9.firebasestorage.app",
  messagingSenderId: "95124937212",
  appId: "1:95124937212:web:9711029b8786a63f613a79",
  measurementId: "G-0GQR75R5LL"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
