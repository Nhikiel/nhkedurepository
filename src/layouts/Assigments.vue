<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '@/config/firebaseConfig'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const assignments = ref([])
const loading = ref(true)
const showProfileDropdown = ref(false)

// Check authentication state
onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
  if (currentUser) {
    fetchAssignments()
  } else {
    router.push('/login')
  }
})

// Fetch assignments from Firestore
const fetchAssignments = async () => {
  try {
    loading.value = true
    const assignmentsRef = collection(db, 'assignments')
    const q = query(
      assignmentsRef, 
      where('userId', '==', user.value.uid),
      orderBy('dueDate', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    assignments.value = []
    
    querySnapshot.forEach((doc) => {
      assignments.value.push({
        id: doc.id,
        ...doc.data()
      })
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
  } finally {
    loading.value = false
  }
}

// Toggle profile dropdown
const toggleProfileDropdown = () => {
  showProfileDropdown.value = !showProfileDropdown.value
}

// Handle logout
const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Format date
const formatDate = (timestamp) => {
  if (!timestamp) return 'No due date'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

// Get status badge class
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'submitted':
      return 'bg-green-100 text-green-800'
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

// Computed properties for filtering assignments
const upcomingAssignments = computed(() => {
  return assignments.value.filter(assignment => 
    assignment.status !== 'completed' && assignment.status !== 'submitted'
  )
})

const completedAssignments = computed(() => {
  return assignments.value.filter(assignment => 
    assignment.status === 'completed' || assignment.status === 'submitted'
  )
})

onMounted(() => {
  // Handle clicks outside dropdown
  document.addEventListener('click', (e) => {
    const profileBtn = document.getElementById('profile-button')
    const profileDropdown = document.getElementById('profile-dropdown')
    if (profileBtn && profileDropdown && 
        !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      showProfileDropdown.value = false
    }
  })
})
</script>

<template>
  <div class="bg-gray-100 text-gray-800 antialiased">
    <!-- Top Navigation -->
    <header class="bg-white border-b shadow-sm fixed top-0 inset-x-0 z-50">
      <div class="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div class="flex items-center space-x-4">
          <router-link to="/" class="text-2xl font-bold text-indigo-600">EduConnect</router-link>
          <div class="hidden md:block">
            <input
              type="text"
              placeholder="Search assignments…"
              class="w-64 bg-gray-100 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <div class="relative">
            <button id="profile-button" class="flex items-center focus:outline-none" @click="toggleProfileDropdown">
              <img
                :src="user?.photoURL || 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?auto=format&fit=facearea&facepad=3&w=64&h=64&q=80'"
                :alt="user?.displayName || 'Avatar'"
                class="w-8 h-8 rounded-full"
              />
              <span class="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                {{ user?.displayName || user?.email || 'User' }}
              </span>
            </button>
            <div 
              id="profile-dropdown" 
              :class="{ hidden: !showProfileDropdown }" 
              class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-10"
            >
              <router-link to="/dashboard/profile" class="block px-4 py-2 text-gray-600 hover:bg-gray-100">View Profile</router-link>
              <a href="#settings" class="block px-4 py-2 text-gray-600 hover:bg-gray-100">Settings</a>
              <button @click="handleLogout" class="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100">Log Out</button>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="pt-16 max-w-7xl mx-auto flex flex-col lg:flex-row">
      <!-- Left Sidebar -->
      <aside class="hidden lg:block lg:w-64 bg-white border-r px-4 py-6 space-y-8">
        <div>
          <h3 class="text-lg font-semibold mb-4">Navigation</h3>
          <nav class="space-y-2">
            <router-link to="/" class="flex items-center text-gray-600 hover:text-indigo-600">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 17l4-4-4-4m8 8l-4-4 4-4" />
              </svg>
              Feed
            </router-link>
            <router-link to="/communities" class="flex items-center text-gray-600 hover:text-indigo-600">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1M3 8a4 4 0 014-4 4 4 0 014 4v4a4 4 0 01-4 4 4 4 0 01-4-4V8zM17 8a4 4 0 00-4-4 4 4 0 00-4 4v4a4 4 0 004 4 4 4 0 004-4V8z" />
              </svg>
              Communities
            </router-link>
            <router-link to="/assignments" class="flex items-center text-indigo-600 font-medium">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m2 4H7m4 4h2M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              Assignments
            </router-link>
            <a href="#" class="flex items-center text-gray-600 hover:text-indigo-600">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7H3v10a2 2 0 002 2z" />
              </svg>
              Events
            </a>
            <router-link to="/chat" class="flex items-center text-gray-600 hover:text-indigo-600">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Chat
            </router-link>
            <router-link to="/profile" class="flex items-center text-gray-600 hover:text-indigo-600">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A9 9 0 1118.878 6.196a9 9 0 01-13.757 11.608z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Profile
            </router-link>
            <router-link to="/students" class="flex items-center text-gray-600 hover:text-indigo-600">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1M20 9a4 4 0 00-4-4 4 4 0 00-4 4v5a4 4 0 004 4 4 4 0 004-4V9zM4 9a4 4 0 014-4 4 4 0 714 4v5a4 4 0 01-4 4 4 4 0 01-4-4V9z" />
              </svg>
              Students
            </router-link>
          </nav>
        </div>
      </aside>
      <!-- Main Content -->
      <main class="flex-1 p-6">
        <h1 class="text-2xl font-bold mb-6">Assignments</h1>
        
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span class="ml-2 text-gray-600">Loading assignments...</span>
        </div>

        <!-- No User State -->
        <div v-else-if="!user" class="text-center py-12">
          <p class="text-gray-600">Please log in to view your assignments.</p>
        </div>

        <!-- Content -->
        <div v-else class="space-y-8">
          <!-- Upcoming Assignments -->
          <section class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Upcoming Assignments</h2>
            <div v-if="upcomingAssignments.length === 0" class="text-center py-8 text-gray-500">
              <p>No upcoming assignments found.</p>
              <p class="text-sm mt-2">All caught up! 🎉</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="assignment in upcomingAssignments" :key="assignment.id" class="flex items-start justify-between bg-gray-50 p-4 rounded-md">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-800">{{ assignment.title }}</h3>
                  <p class="text-sm text-gray-500">{{ assignment.course }} • {{ assignment.instructor }}</p>
                  <p class="text-sm text-gray-600 mt-1">{{ assignment.description }}</p>
                </div>
                <div class="flex flex-col items-end space-y-2">
                  <span :class="['text-xs px-2 py-1 rounded-full', getStatusClass(assignment.status)]">
                    {{ assignment.status || 'Not Started' }}
                  </span>
                  <div class="text-xs text-gray-500 text-right">
                    <p>Due: {{ formatDate(assignment.dueDate) }}</p>
                    <p>Points: {{ assignment.points || 'N/A' }}</p>
                  </div>
                  <button class="bg-indigo-600 text-white text-sm px-3 py-1 rounded-md hover:bg-indigo-700">
                    {{ assignment.status === 'in progress' ? 'Continue' : 'Start' }}
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
              <p class="text-sm mt-2">Keep working on your assignments! 💪</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="assignment in completedAssignments" :key="assignment.id" class="flex items-start justify-between bg-gray-50 p-4 rounded-md">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-800">{{ assignment.title }}</h3>
                  <p class="text-sm text-gray-500">{{ assignment.course }} • {{ assignment.instructor }}</p>
                  <p class="text-sm text-gray-600 mt-1">{{ assignment.description }}</p>
                </div>
                <div class="flex flex-col items-end space-y-2">
                  <span :class="['text-xs px-2 py-1 rounded-full', getStatusClass(assignment.status)]">
                    {{ assignment.grade ? `Graded: ${assignment.grade}` : 'Submitted' }}
                  </span>
                  <div class="text-xs text-gray-500 text-right">
                    <p>Submitted: {{ formatDate(assignment.submittedDate) }}</p>
                    <p>Points: {{ assignment.points || 'N/A' }}</p>
                  </div>
                  <button class="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-md hover:bg-gray-300">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>
