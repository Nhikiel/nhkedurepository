// Firebase cleanup utility to remove all assignments
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

// Your Firebase config (copy from firebaseConfig.js)
const firebaseConfig = {
  apiKey: "AIzaSyAdKhq1H0JIKAP7qfcqxz6KPPWQwGDFKxU",
  authDomain: "ipt2-capstone.firebaseapp.com",
  projectId: "ipt2-capstone",
  storageBucket: "ipt2-capstone.appspot.com",
  messagingSenderId: "397598456624",
  appId: "1:397598456624:web:d80cddf1f61aa4b93e7e8c"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function cleanupAssignments() {
  try {
    console.log('🧹 Starting Firebase assignments cleanup...')
    
    // Get all assignments
    const assignmentsRef = collection(db, 'assignments')
    const snapshot = await getDocs(assignmentsRef)
    
    console.log(`📊 Found ${snapshot.size} assignments to delete`)
    
    if (snapshot.size === 0) {
      console.log('✅ No assignments found - database is already clean!')
      return
    }
    
    // Delete all assignments
    const deletePromises = []
    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, 'assignments', docSnapshot.id)))
    })
    
    await Promise.all(deletePromises)
    
    console.log('✅ Successfully deleted all assignments from Firebase!')
    console.log('🎉 Your Firebase database is now clean!')
    
  } catch (error) {
    console.error('❌ Error cleaning up assignments:', error)
  }
}

// Run the cleanup
cleanupAssignments()
