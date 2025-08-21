// lib/firebase-updates.ts
import { initializeApp } from 'firebase/app'
import { 
  getDatabase, 
  ref, 
  onChildAdded, 
  off,
  query,
  orderByChild,
  limitToLast,
  remove,
  DataSnapshot
} from 'firebase/database'

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

export interface FirebaseUpdate {
  id: string
  type: 'progress' | 'complete' | 'error'
  message: string
  data?: {
    content?: string
    visual?: string
    percentage?: number
    service_type?: string
  }
  timestamp: number
}

export class FirebaseUpdatesService {
  private userId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private userRef: any
  private listeners: Map<string, (update: FirebaseUpdate) => void> = new Map()
  private processedUpdates: Set<string> = new Set()
  
  constructor(userId: string) {
    this.userId = userId
    this.userRef = ref(database, `updates/${userId}`)
  }
  
  connect() {
    console.log(`🔥 Connecting to Firebase for user: ${this.userId}`)
    
    const recentQuery = query(
      this.userRef,
      orderByChild('timestamp'),
      limitToLast(20) // نزود شوية عشان نتأكد
    )
    
    onChildAdded(recentQuery, (snapshot: DataSnapshot) => {
      console.log("📡 Raw snapshot:", snapshot.key, snapshot.val())

      const update = snapshot.val() as FirebaseUpdate
      const updateId = snapshot.key
      
      if (!updateId || !update) {
        console.warn("⚠️ Snapshot without data:", snapshot)
        return
      }
      
      if (this.processedUpdates.has(updateId)) {
        console.log(`⏭️ Skipping already processed update: ${updateId}`)
        return
      }
      
      this.processedUpdates.add(updateId)
      
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      if (update.timestamp < fiveMinutesAgo) {
        console.log(`⏳ Skipping old update: ${updateId}`)
        return
      }
      
      console.log(`📨 New update received:`, update)
      this.handleUpdate(update)
      this.scheduleCleanup(updateId, 60000)
    }, (error) => {
      console.error("❌ Firebase listener error:", error)
    })
  }
  
  private handleUpdate(update: FirebaseUpdate) {
    const callback = this.listeners.get(update.type)
    if (callback) {
      callback(update)
    } else {
      console.warn(`⚠️ No listener registered for type: ${update.type}`)
    }
  }
  
  onProgress(callback: (update: FirebaseUpdate) => void) {
    this.listeners.set('progress', callback)
  }
  
  onComplete(callback: (update: FirebaseUpdate) => void) {
    this.listeners.set('complete', callback)
  }
  
  onError(callback: (update: FirebaseUpdate) => void) {
    this.listeners.set('error', callback)
  }
  
  private scheduleCleanup(updateId: string, delay: number) {
    setTimeout(async () => {
      try {
        const updateRef = ref(database, `updates/${this.userId}/${updateId}`)
        await remove(updateRef)
        console.log(`🗑️ Cleaned up update: ${updateId}`)
      } catch (error) {
        console.error('Failed to cleanup update:', error)
      }
    }, delay)
  }
  
  disconnect() {
    console.log(`🔌 Disconnecting Firebase for user: ${this.userId}`)
    off(this.userRef)
    this.listeners.clear()
    this.processedUpdates.clear()
  }
  
  async clearAll() {
    try {
      await remove(this.userRef)
      console.log('✨ Cleared all updates')
    } catch (error) {
      console.error('Failed to clear updates:', error)
    }
  }
}
