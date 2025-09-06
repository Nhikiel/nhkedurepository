<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '@/config/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const assignments = ref([])
const loading = ref(true)
const submitting = ref({})

// Check authentication state
onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
  if (currentUser) {
    fetchAssignments()
  } else {
    router.push('/login')
  }
})

// Fetch assignments from Firebase, create filler data if none exist
const fetchAssignments = async () => {
  try {
    loading.value = true
    
    if (!user.value) {
      loading.value = false
      return
    }

    // Try to fetch from Firebase first
    try {
      const assignmentsRef = collection(db, 'assignments')
      const q = query(
        assignmentsRef, 
        where('userId', '==', user.value.uid)
      )
      
      const querySnapshot = await getDocs(q)
      assignments.value = []
      
      querySnapshot.forEach((doc) => {
        assignments.value.push({
          id: doc.id,
          ...doc.data()
        })
      })

      // If no assignments found in Firebase, create filler assignments there
      if (assignments.value.length === 0) {
        console.log('No assignments found in Firebase, creating filler assignments...')
        await createFillerAssignmentsInFirebase()
      }
    } catch (firestoreError) {
      console.log('Firestore query failed, using local filler data:', firestoreError)
      // Use local filler data if Firebase fails
      assignments.value = getFillerAssignments()
    }
    
  } catch (error) {
    console.error('Error in fetchAssignments:', error)
    // Use filler data as fallback
    assignments.value = getFillerAssignments()
  } finally {
    loading.value = false
  }
}

// Create filler assignments in Firebase
const createFillerAssignmentsInFirebase = async () => {
  const fillerAssignments = getFillerAssignments()
  const assignmentsRef = collection(db, 'assignments')
  
  try {
    for (const assignment of fillerAssignments) {
      // Remove the local ID and let Firebase generate one
      const { id, ...assignmentData } = assignment
      await addDoc(assignmentsRef, {
        ...assignmentData,
        createdAt: serverTimestamp()
      })
    }
    
    // Fetch the newly created assignments
    const q = query(assignmentsRef, where('userId', '==', user.value.uid))
    const querySnapshot = await getDocs(q)
    assignments.value = []
    
    querySnapshot.forEach((doc) => {
      assignments.value.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    console.log('✅ Created filler assignments in Firebase')
  } catch (error) {
    console.error('Error creating filler assignments in Firebase:', error)
    // Fallback to local data
    assignments.value = getFillerAssignments()
  }
}

// Get filler assignments (no Firebase operations)
const getFillerAssignments = () => {
  const userId = user.value?.uid || 'demo-user'
  
  return [
    {
      id: 'assign-1',
      userId: userId,
      title: "Data Structures Project",
      course: "Computer Science",
      instructor: "Prof. Smith",
      description: "Implement a balanced binary search tree with insertion, deletion, and search operations.",
      dueDate: new Date('2025-09-15'),
      status: "in progress",
      points: 100
    },
    {
      id: 'assign-2',
      userId: userId,
      title: "Calculus Homework #5",
      course: "Mathematics",
      instructor: "Dr. Johnson",
      description: "Complete integration problems from chapter 8, exercises 1-25.",
      dueDate: new Date('2025-09-12'),
      status: "not started",
      points: 75
    },
    {
      id: 'assign-3',
      userId: userId,
      title: "Research Paper Draft",
      course: "English Literature",
      instructor: "Prof. Williams",
      description: "Submit first draft of research paper on Shakespeare's influence on modern literature.",
      dueDate: new Date('2025-09-08'),
      status: "overdue",
      points: 150
    },
    {
      id: 'assign-4',
      userId: userId,
      title: "Physics Problem Set",
      course: "Physics",
      instructor: "Prof. Davis",
      description: "Solve thermodynamics problems from textbook pages 245-267.",
      dueDate: new Date('2025-08-25'),
      status: "submitted",
      submittedDate: new Date('2025-08-24'),
      points: 90
    },
    {
      id: 'assign-5',
      userId: userId,
      title: "Database Design Project",
      course: "Computer Science",
      instructor: "Dr. Martinez",
      description: "Design and implement a normalized database for an e-commerce application.",
      dueDate: new Date('2025-08-15'),
      status: "graded",
      submittedDate: new Date('2025-08-14'),
      points: 120,
      grade: "92%"
    },
    {
      id: 'assign-6',
      userId: userId,
      title: "Chemistry Lab Report",
      course: "Organic Chemistry",
      instructor: "Dr. Brown",
      description: "Analyze the synthesis and purification of aspirin through acetylation reaction.",
      dueDate: new Date('2025-09-18'),
      status: "not started",
      points: 85
    },
    {
      id: 'assign-7',
      userId: userId,
      title: "Web Development Portfolio",
      course: "Web Development",
      instructor: "Prof. Chen",
      description: "Create a responsive portfolio website showcasing your projects using HTML, CSS, and JavaScript.",
      dueDate: new Date('2025-09-22'),
      status: "in progress",
      points: 200
    },
    {
      id: 'assign-8',
      userId: userId,
      title: "Statistics Quiz #3",
      course: "Statistics",
      instructor: "Dr. Wilson",
      description: "Quiz covering probability distributions, hypothesis testing, and confidence intervals.",
      dueDate: new Date('2025-09-10'),
      status: "not started",
      points: 50
    },
    {
      id: 'assign-9',
      userId: userId,
      title: "Art History Essay",
      course: "Art History",
      instructor: "Prof. Anderson",
      description: "Write a 2000-word analysis of Renaissance art and its impact on modern artistic movements.",
      dueDate: new Date('2025-09-20'),
      status: "not started",
      points: 120
    },
    {
      id: 'assign-10',
      userId: userId,
      title: "Machine Learning Project",
      course: "Computer Science",
      instructor: "Dr. Lee",
      description: "Build a classification model using scikit-learn to predict customer behavior.",
      dueDate: new Date('2025-09-25'),
      status: "not started",
      points: 180
    },
    {
      id: 'assign-11',
      userId: userId,
      title: "Economics Case Study",
      course: "Microeconomics",
      instructor: "Prof. Garcia",
      description: "Analyze market structures and consumer behavior in the tech industry.",
      dueDate: new Date('2025-08-20'),
      status: "graded",
      submittedDate: new Date('2025-08-19'),
      points: 100,
      grade: "88%"
    },
    {
      id: 'assign-12',
      userId: userId,
      title: "Biology Lab Practical",
      course: "Cell Biology",
      instructor: "Dr. Thompson",
      description: "Demonstrate understanding of cell division processes through microscopic observation.",
      dueDate: new Date('2025-09-16'),
      status: "in progress",
      points: 95
    }
  ]
}

// Format date
const formatDate = (date) => {
  if (!date) return 'No due date'
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Get status badge class
const getStatusClass = (assignment) => {
  const status = assignment.status?.toLowerCase()
  const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate)
  const now = new Date()
  
  // Check if overdue
  if (status !== 'submitted' && status !== 'graded' && dueDate < now) {
    return 'bg-red-100 text-red-700'
  }
  
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-700'
    case 'graded':
      return 'bg-green-100 text-green-700'
    case 'in progress':
      return 'bg-yellow-100 text-yellow-700'
    case 'not started':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// Get status text
const getStatusText = (assignment) => {
  const status = assignment.status?.toLowerCase()
  const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate)
  const now = new Date()
  
  // Check if overdue
  if (status !== 'submitted' && status !== 'graded' && dueDate < now) {
    return 'Overdue'
  }
  
  if (assignment.grade && status === 'graded') {
    return `Graded: ${assignment.grade}`
  }
  
  switch (status) {
    case 'submitted':
      return 'Submitted'
    case 'graded':
      return 'Completed'
    case 'in progress':
      return 'In Progress'
    case 'not started':
      return 'Not Started'
    default:
      return 'Not Started'
  }
}

// Get button text and action
const getButtonConfig = (assignment) => {
  const status = assignment.status?.toLowerCase()
  const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate)
  const now = new Date()
  
  if (status === 'submitted' || status === 'graded') {
    return {
      text: assignment.grade ? 'View Feedback' : 'View Submission',
      action: 'view',
      class: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }
  }
  
  if (status !== 'submitted' && status !== 'graded' && dueDate < now) {
    return {
      text: 'Submit Late',
      action: 'submit',
      class: 'bg-red-600 text-white hover:bg-red-700'
    }
  }
  
  switch (status) {
    case 'in progress':
      return {
        text: 'Submit',
        action: 'submit',
        class: 'bg-indigo-600 text-white hover:bg-indigo-700'
      }
    case 'not started':
    default:
      return {
        text: 'Start',
        action: 'start',
        class: 'bg-indigo-600 text-white hover:bg-indigo-700'
      }
  }
}

// Handle assignment actions
const handleAssignmentAction = async (assignment, action) => {
  const assignmentId = assignment.id
  
  if (submitting.value[assignmentId]) return
  
  submitting.value[assignmentId] = true
  
  try {
    // Always try to update in Firebase first
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId)
      
      switch (action) {
        case 'start':
          await updateDoc(assignmentRef, {
            status: 'in progress',
            startedDate: serverTimestamp()
          })
          toast.success('Assignment started!')
          break
        case 'submit':
          await updateDoc(assignmentRef, {
            status: 'submitted',
            submittedDate: serverTimestamp()
          })
          toast.success('Assignment submitted!')
          break
        case 'view':
          console.log('Opening assignment details for:', assignment.title)
          break
      }
      
      // Refresh assignments from Firebase after update
      await fetchAssignments()
      
    } catch (firestoreError) {
      console.log('Firestore update failed, updating locally:', firestoreError)
      updateAssignmentLocally(assignmentId, action)
      toast.error('Update saved locally only (offline mode)')
    }
  } catch (error) {
    console.error('Error updating assignment:', error)
    toast.error('Failed to update assignment')
  } finally {
    submitting.value[assignmentId] = false
  }
}

// Update assignment locally (for filler data or when Firestore fails)
const updateAssignmentLocally = (assignmentId, action) => {
  const assignmentIndex = assignments.value.findIndex(a => a.id === assignmentId)
  if (assignmentIndex === -1) return
  
  const assignment = { ...assignments.value[assignmentIndex] }
  
  switch (action) {
    case 'start':
      assignment.status = 'in progress'
      assignment.startedDate = new Date()
      break
    case 'submit':
      assignment.status = 'submitted'
      assignment.submittedDate = new Date()
      break
    case 'view':
      console.log('Opening assignment details for:', assignment.title)
      break
  }
  
  // Update the assignment in the array
  assignments.value[assignmentIndex] = assignment
}

// Computed properties for filtering assignments
const upcomingAssignments = computed(() => {
  return assignments.value.filter(assignment => {
    const status = assignment.status?.toLowerCase()
    return status !== 'submitted' && status !== 'graded'
  })
})

const completedAssignments = computed(() => {
  return assignments.value.filter(assignment => {
    const status = assignment.status?.toLowerCase()
    return status === 'submitted' || status === 'graded'
  })
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Your Assignments</h1>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-2 text-gray-600">Loading assignments...</span>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Upcoming assignments -->
      <section class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-lg font-semibold mb-4">Upcoming Assignments</h2>
        
        <div v-if="upcomingAssignments.length === 0" class="text-center py-8 text-gray-500">
          <p>No upcoming assignments found.</p>
          <p class="text-sm mt-2">All caught up! 🎉</p>
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="assignment in upcomingAssignments" 
            :key="assignment.id" 
            class="flex items-start justify-between bg-gray-50 p-4 rounded-md"
          >
            <div>
              <h3 class="font-medium text-gray-800">{{ assignment.title }}</h3>
              <p class="text-sm text-gray-500">{{ assignment.course }} – Due {{ formatDate(assignment.dueDate) }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ assignment.description }}</p>
            </div>
            <div class="flex flex-col items-end space-y-2">
              <span :class="['text-xs px-2 py-1 rounded-full', getStatusClass(assignment)]">
                {{ getStatusText(assignment) }}
              </span>
              <div class="text-xs text-gray-500 text-right">
                <p>Points: {{ assignment.points || 'N/A' }}</p>
                <p v-if="assignment.instructor">{{ assignment.instructor }}</p>
              </div>
              <button 
                @click="handleAssignmentAction(assignment, getButtonConfig(assignment).action)"
                :disabled="submitting[assignment.id]"
                :class="[
                  'text-sm px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  getButtonConfig(assignment).class
                ]"
              >
                <span v-if="submitting[assignment.id]" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ...
                </span>
                <span v-else>{{ getButtonConfig(assignment).text }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Completed assignments -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Completed Assignments</h2>
        
        <div v-if="completedAssignments.length === 0" class="text-center py-8 text-gray-500">
          <p>No completed assignments yet.</p>
          <p class="text-sm mt-2">Keep working on your assignments! 💪</p>
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="assignment in completedAssignments" 
            :key="assignment.id" 
            class="flex items-start justify-between bg-gray-50 p-4 rounded-md"
          >
            <div>
              <h3 class="font-medium text-gray-800">{{ assignment.title }}</h3>
              <p class="text-sm text-gray-500">
                {{ assignment.course }} – 
                Submitted {{ formatDate(assignment.submittedDate) }}
              </p>
              <p class="text-sm text-gray-600 mt-1">{{ assignment.description }}</p>
            </div>
            <div class="flex flex-col items-end space-y-2">
              <span :class="['text-xs px-2 py-1 rounded-full', getStatusClass(assignment)]">
                {{ getStatusText(assignment) }}
              </span>
              <div class="text-xs text-gray-500 text-right">
                <p>Points: {{ assignment.points || 'N/A' }}</p>
                <p v-if="assignment.instructor">{{ assignment.instructor }}</p>
              </div>
              <button 
                @click="handleAssignmentAction(assignment, getButtonConfig(assignment).action)"
                :disabled="submitting[assignment.id]"
                :class="[
                  'text-sm px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  getButtonConfig(assignment).class
                ]"
              >
                <span v-if="submitting[assignment.id]" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ...
                </span>
                <span v-else>{{ getButtonConfig(assignment).text }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
</style>