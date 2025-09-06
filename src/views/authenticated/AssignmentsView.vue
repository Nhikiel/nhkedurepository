<script setup>
import { ref, computed, onMounted } from 'vue'
import { auth, db } from '@/config/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'

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

// Modal
const showAddModal = ref(false)
const addingAssignment = ref(false)
const newAssignment = ref({
  title: '',
  course: '',
  instructor: '',
  description: '',
  dueDate: '',
  points: 100
})

// Simple test data
const getTestAssignments = () => [
  {
    id: '1',
    title: 'Math Homework',
    course: 'Math',
    instructor: 'Prof. Smith',
    description: 'Complete exercises 1-10',
    dueDate: new Date('2025-09-15'),
    status: 'not started',
    points: 100
  },
  {
    id: '2', 
    title: 'Science Project',
    course: 'Science',
    instructor: 'Dr. Jones',
    description: 'Build a volcano',
    dueDate: new Date('2025-09-20'),
    status: 'in progress',
    points: 150
  }
]

// Fetch assignments from Firebase
const fetchAssignments = async () => {
  loading.value = true
  try {
    if (!user.value?.uid) {
      loading.value = false
      return
    }

    // Try to fetch from Firebase
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

    // If no assignments found, create some filler assignments
    if (assignments.value.length === 0) {
      await createFillerAssignments()
    }
  } catch (error) {
    console.error('Error fetching assignments:', error)
    // Fallback to test data if Firebase fails
    assignments.value = getTestAssignments()
  } finally {
    loading.value = false
  }
}

// Create initial filler assignments in Firebase
const createFillerAssignments = async () => {
  const fillerData = getTestAssignments()
  const assignmentsRef = collection(db, 'assignments')
  
  try {
    for (const assignment of fillerData) {
      const { id, ...assignmentData } = assignment
      await addDoc(assignmentsRef, {
        ...assignmentData,
        userId: user.value.uid,
        createdAt: serverTimestamp()
      })
    }
    // Refresh to get the created assignments with Firebase IDs
    await fetchAssignments()
  } catch (error) {
    console.error('Error creating filler assignments:', error)
    // Fallback to local data
    assignments.value = getTestAssignments()
  }
}

const formatDate = (date) => {
  if (!date) return 'No due date'
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const getStatusClass = (assignment) => {
  const status = assignment.status?.toLowerCase()
  const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate)
  const now = new Date()
  
  // Check if overdue
  if (status !== 'submitted' && status !== 'graded' && dueDate < now) {
    return 'bg-red-100 text-red-700'
  }
  
  switch (status) {
    case 'not started': return 'bg-gray-100 text-gray-700'
    case 'in progress': return 'bg-yellow-100 text-yellow-700'
    case 'submitted': return 'bg-blue-100 text-blue-700'
    case 'graded': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

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
    case 'not started': return 'Not Started'
    case 'in progress': return 'In Progress' 
    case 'submitted': return 'Submitted'
    case 'graded': return 'Completed'
    default: return 'Not Started'
  }
}

const getButtonConfig = (assignment) => {
  const status = assignment.status?.toLowerCase()
  const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate)
  const now = new Date()
  
  if (status === 'submitted' || status === 'graded') {
    return { 
      text: 'View', 
      action: 'view', 
      class: 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
    }
  }
  
  // Check if overdue
  if (status !== 'submitted' && status !== 'graded' && dueDate < now) {
    return { 
      text: 'Submit Late', 
      action: 'submit', 
      class: 'bg-red-600 text-white hover:bg-red-700' 
    }
  }
  
  switch (status) {
    case 'not started':
      return { text: 'Start', action: 'start', class: 'bg-indigo-600 text-white hover:bg-indigo-700' }
    case 'in progress':
      return { text: 'Submit', action: 'submit', class: 'bg-indigo-600 text-white hover:bg-indigo-700' }
    default:
      return { text: 'Start', action: 'start', class: 'bg-indigo-600 text-white hover:bg-indigo-700' }
  }
}

const handleAssignmentAction = async (assignment, action) => {
  const assignmentId = assignment.id
  
  if (submitting.value[assignmentId]) return
  
  submitting.value[assignmentId] = true
  
  try {
    // Update in Firebase
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
        toast.info('Assignment details opened')
        break
    }
    
    // Refresh assignments after update
    await fetchAssignments()
    
  } catch (error) {
    console.error('Error updating assignment:', error)
    toast.error('Failed to update assignment')
  } finally {
    submitting.value[assignmentId] = false
  }
}

const handleAddAssignment = async () => {
  if (!user.value) {
    toast.error('Please log in to add assignments')
    return
  }

  addingAssignment.value = true
  
  try {
    const assignmentsRef = collection(db, 'assignments')
    const assignmentData = {
      userId: user.value.uid,
      title: newAssignment.value.title,
      course: newAssignment.value.course,
      instructor: newAssignment.value.instructor,
      description: newAssignment.value.description,
      dueDate: new Date(newAssignment.value.dueDate),
      points: newAssignment.value.points,
      status: 'not started',
      createdAt: serverTimestamp()
    }
    
    await addDoc(assignmentsRef, assignmentData)
    
    // Reset form and close modal
    closeAddModal()
    
    // Refresh assignments
    await fetchAssignments()
    
    toast.success('Assignment added successfully!')
    
  } catch (error) {
    console.error('Error adding assignment:', error)
    toast.error('Failed to add assignment')
  } finally {
    addingAssignment.value = false
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  newAssignment.value = {
    title: '',
    course: '',
    instructor: '',
    description: '',
    dueDate: '',
    points: 100
  }
}

const upcomingAssignments = computed(() => {
  return assignments.value.filter(a => a.status !== 'submitted' && a.status !== 'graded')
})

const completedAssignments = computed(() => {
  return assignments.value.filter(a => a.status === 'submitted' || a.status === 'graded')
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Your Assignments</h1>
      <button
        @click="showAddModal = true"
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
      >
        <span>+ Add Assignment</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      <span class="mt-2 text-gray-600">Loading...</span>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Upcoming Assignments -->
      <section class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Upcoming Assignments</h2>
        <div class="space-y-4">
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
              <button
                @click="handleAssignmentAction(assignment, getButtonConfig(assignment).action)"
                :disabled="submitting[assignment.id]"
                :class="['text-sm px-3 py-1 rounded-md transition-colors disabled:opacity-50', getButtonConfig(assignment).class]"
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

      <!-- Completed Assignments -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Completed Assignments</h2>
        <div v-if="completedAssignments.length === 0" class="text-center py-8 text-gray-500">
          <p>No completed assignments yet.</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="assignment in completedAssignments"
            :key="assignment.id"
            class="flex items-start justify-between bg-gray-50 p-4 rounded-md"
          >
            <div>
              <h3 class="font-medium text-gray-800">{{ assignment.title }}</h3>
              <p class="text-sm text-gray-500">{{ assignment.course }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ assignment.description }}</p>
            </div>
            <div class="flex flex-col items-end space-y-2">
              <span :class="['text-xs px-2 py-1 rounded-full', getStatusClass(assignment)]">
                {{ getStatusText(assignment) }}
              </span>
              <button class="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-md">
                View
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Add Assignment Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Assignment</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              v-model="newAssignment.title"
              type="text"
              required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Assignment title"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <input
              v-model="newAssignment.course"
              type="text"
              required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Course name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <input
              v-model="newAssignment.instructor"
              type="text"
              required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Instructor name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="newAssignment.description"
              required
              rows="3"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Assignment description"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              v-model="newAssignment.dueDate"
              type="date"
              required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
            <input
              v-model.number="newAssignment.points"
              type="number"
              required
              min="1"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Points"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="closeAddModal"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="handleAddAssignment"
            :disabled="addingAssignment"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="addingAssignment" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
            <span v-else>Add Assignment</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
