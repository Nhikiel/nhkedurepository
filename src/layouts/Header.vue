<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '@/config/firebaseConfig'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const isProfileDropdownToggle = ref(false)
const user = ref(null)
const userProfile = ref(null)
const isLoggingOut = ref(false)

const toggleDropdownMenu = () => {
    isProfileDropdownToggle.value = !isProfileDropdownToggle.value
}

// Check authentication and fetch user profile
onAuthStateChanged(auth, async (currentUser) => {
  if (currentUser) {
    user.value = currentUser
    await fetchUserProfile(currentUser.uid)
  }
})

// Fetch user profile from Firestore
const fetchUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      userProfile.value = userDoc.data()
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

// Get display name
const getDisplayName = () => {
  if (userProfile.value) {
    return `${userProfile.value.firstName} ${userProfile.value.lastName}`
  }
  return user.value?.displayName || user.value?.email || 'User'
}

// Get user avatar
const getUserAvatar = () => {
  return user.value?.photoURL || 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?auto=format&fit=facearea&facepad=3&w=64&h=64&q=80'
}

// Handle logout
const handleLogout = async () => {
  if (isLoggingOut.value) return // Prevent multiple clicks
  
  try {
    isLoggingOut.value = true
    
    // Close the dropdown first
    isProfileDropdownToggle.value = false
    
    // Clear user data
    user.value = null
    userProfile.value = null
    
    // Sign out from Firebase
    await signOut(auth)
    
    // Clear any cached data (optional)
    localStorage.clear()
    sessionStorage.clear()
    
    // Redirect to login
    router.push('/login')
    
    console.log('User successfully signed out')
  } catch (error) {
    console.error('Error signing out:', error)
    // Even if there's an error, try to redirect to login
    router.push('/login')
  } finally {
    isLoggingOut.value = false
  }
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const profileBtn = document.getElementById('profile-button')
    const profileDropdown = document.getElementById('profile-dropdown')
    if (profileBtn && profileDropdown && 
        !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      isProfileDropdownToggle.value = false
    }
  })
})
</script>
<template>
    <header class="bg-white border-b border-gray-50 shadow-sm fixed top-0 inset-x-0 z-50">
        <div class="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center space-x-4">
                <a href="feed.html" class="text-2xl font-bold text-indigo-600">EduConnect</a>
                <div class="hidden md:block">
                    <input
                        type="text"
                        placeholder="Search for courses, people, or communities…"
                        class="w-64 bg-gray-100 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <button class="relative text-gray-600 hover:text-indigo-600 focus:outline-none">
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>
                    <span
                        class="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center"
                        >3</span
                    >
                </button>
                <button
                    class="relative text-gray-600 hover:text-indigo-600 focus:outline-none md:hidden"
                    id="toggle-chat-mobile"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M17 8h2a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 4V10a2 2 0 012-2h2"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 3h2a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 4V5a2 2 0 012-2h2"
                        />
                    </svg>
                    <span
                        class="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center"
                        >2</span
                    >
                </button>
                <div class="relative">
                    <button
                        @click="toggleDropdownMenu"
                        id="profile-button"
                        class="flex items-center space-x-2 focus:outline-none"
                    >
                        <img
                            :src="getUserAvatar()"
                            :alt="getDisplayName()"
                            class="w-8 h-8 rounded-full"
                        />
                        <span class="hidden md:block text-sm font-medium text-gray-700">
                            {{ userProfile?.firstName || 'User' }}
                        </span>
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div
                        id="profile-dropdown"
                        class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-10"
                        :class="{ hidden: !isProfileDropdownToggle }"
                    >
                        <div class="px-4 py-2 border-b border-gray-100">
                            <p class="font-medium text-gray-900">{{ getDisplayName() }}</p>
                            <p class="text-sm text-gray-500">{{ user?.email }}</p>
                        </div>
                        <router-link
                            to="/dashboard/profile"
                            class="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            @click="isProfileDropdownToggle = false"
                        >
                            View Profile
                        </router-link>
                        <a href="#settings" class="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                            Settings
                        </a>
                        <button
                            @click="handleLogout"
                            :disabled="isLoggingOut"
                            class="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span v-if="isLoggingOut" class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging out...
                            </span>
                            <span v-else>Log Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>
