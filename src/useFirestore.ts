import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './AuthContext'

export type Share = {
  email: string
  canEdit: boolean
}

export type Goal = {
  id: string
  name: string
  target: number
  ownerId: string
  ownerEmail: string
  sharedWithEmails: string[]
  shares: Share[]
  createdAt: Timestamp
  isSharedWithMe?: boolean
  canEdit?: boolean
}

export type Contribution = {
  id: string
  date: string
  amount: number
  note: string
  ownerId: string
  createdAt: Timestamp
}

export function useGoals() {
  const { user } = useAuth()
  const [ownedGoals, setOwnedGoals] = useState<Goal[]>([])
  const [sharedGoals, setSharedGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  // Query goals owned by user
  useEffect(() => {
    if (!user) {
      setOwnedGoals([])
      return
    }

    const goalsRef = collection(db, 'goals')
    const q = query(goalsRef, where('ownerId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isSharedWithMe: false,
        canEdit: true,
      })) as Goal[]
      goalsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
      setOwnedGoals(goalsData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  // Query goals shared with user
  useEffect(() => {
    if (!user?.email) {
      setSharedGoals([])
      return
    }

    const goalsRef = collection(db, 'goals')
    const q = query(
      goalsRef,
      where('sharedWithEmails', 'array-contains', user.email.toLowerCase())
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => {
        const data = doc.data()
        const shares = (data.shares || []) as Share[]
        const userShare = shares.find(
          (s) => s.email.toLowerCase() === user.email?.toLowerCase()
        )
        return {
          id: doc.id,
          ...data,
          isSharedWithMe: true,
          canEdit: userShare?.canEdit || false,
        }
      }) as Goal[]
      goalsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
      setSharedGoals(goalsData)
    })

    return unsubscribe
  }, [user])

  const goals = [...ownedGoals, ...sharedGoals]

  const addGoal = async (name: string, target: number) => {
    if (!user) return
    await addDoc(collection(db, 'goals'), {
      name,
      target,
      ownerId: user.uid,
      ownerEmail: user.email || '',
      sharedWithEmails: [],
      shares: [],
      createdAt: serverTimestamp(),
    })
  }

  const updateGoal = async (id: string, data: { name?: string; target?: number }) => {
    await updateDoc(doc(db, 'goals', id), data)
  }

  const deleteGoal = async (id: string) => {
    await deleteDoc(doc(db, 'goals', id))
  }

  const shareGoal = async (goalId: string, email: string, canEdit: boolean) => {
    const normalizedEmail = email.toLowerCase().trim()
    const goalRef = doc(db, 'goals', goalId)
    
    // Add email to sharedWithEmails array and shares array
    await updateDoc(goalRef, {
      sharedWithEmails: arrayUnion(normalizedEmail),
      shares: arrayUnion({ email: normalizedEmail, canEdit }),
    })
  }

  const removeShare = async (goalId: string, email: string) => {
    const normalizedEmail = email.toLowerCase().trim()
    const goalRef = doc(db, 'goals', goalId)
    
    // First get the current shares to find the exact object to remove
    const goal = ownedGoals.find((g) => g.id === goalId)
    const shareToRemove = goal?.shares?.find(
      (s) => s.email.toLowerCase() === normalizedEmail
    )
    
    if (shareToRemove) {
      await updateDoc(goalRef, {
        sharedWithEmails: arrayRemove(normalizedEmail),
        shares: arrayRemove(shareToRemove),
      })
    }
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, shareGoal, removeShare }
}

export function useContributions() {
  const { user } = useAuth()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setContributions([])
      setLoading(false)
      return
    }

    const contributionsRef = collection(db, 'contributions')
    const q = query(contributionsRef, where('ownerId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contributionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contribution[]
      contributionsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
      setContributions(contributionsData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addContribution = async (date: string, amount: number, note: string) => {
    if (!user) return
    await addDoc(collection(db, 'contributions'), {
      date,
      amount,
      note,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    })
  }

  const updateContribution = async (
    id: string,
    data: { date?: string; amount?: number; note?: string }
  ) => {
    await updateDoc(doc(db, 'contributions', id), data)
  }

  const deleteContribution = async (id: string) => {
    await deleteDoc(doc(db, 'contributions', id))
  }

  return { contributions, loading, addContribution, updateContribution, deleteContribution }
}

export type UserSettings = {
  conservativeMonthly: number
  ambitiousMonthly: number
}

const DEFAULT_SETTINGS: UserSettings = {
  conservativeMonthly: 200,
  ambitiousMonthly: 500,
}

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS)
      setLoading(false)
      return
    }

    const settingsRef = doc(db, 'userSettings', user.uid)

    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserSettings
        setSettings({
          conservativeMonthly: data.conservativeMonthly || DEFAULT_SETTINGS.conservativeMonthly,
          ambitiousMonthly: data.ambitiousMonthly || DEFAULT_SETTINGS.ambitiousMonthly,
        })
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return
    const settingsRef = doc(db, 'userSettings', user.uid)
    await updateDoc(settingsRef, newSettings).catch(async () => {
      // Document doesn't exist, create it
      const { setDoc } = await import('firebase/firestore')
      await setDoc(settingsRef, { ...DEFAULT_SETTINGS, ...newSettings })
    })
  }

  return { settings, loading, updateSettings }
}
