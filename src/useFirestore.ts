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
  orderBy,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './AuthContext'

export type Goal = {
  id: string
  name: string
  target: number
  ownerId: string
  sharedWith: { userId: string; canEdit: boolean }[]
  createdAt: Timestamp
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
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    // Query goals where user is owner OR shared with user
    const goalsRef = collection(db, 'goals')
    const q = query(
      goalsRef,
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Goal[]
      setGoals(goalsData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addGoal = async (name: string, target: number) => {
    if (!user) return
    await addDoc(collection(db, 'goals'), {
      name,
      target,
      ownerId: user.uid,
      sharedWith: [],
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
    // TODO: Implement sharing with Cloud Functions to lookup user by email
    console.log('Share goal', goalId, 'with', email, 'canEdit:', canEdit)
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, shareGoal }
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
    const q = query(
      contributionsRef,
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contributionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contribution[]
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
