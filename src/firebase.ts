import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// TODO: Reemplazá con tu configuración de Firebase
// La encontrás en Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDl7j-llK0FuNBj26YFiIq1fWe4TEHWVOU",
  authDomain: "ahorros-app-ac6e7.firebaseapp.com",
  projectId: "ahorros-app-ac6e7",
  storageBucket: "ahorros-app-ac6e7.firebasestorage.app",
  messagingSenderId: "1069236307608",
  appId: "1:1069236307608:web:968897f6a247825b78f2ed"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
