import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDADx1kIbWXrMFGsSIqcMnZ-CyhH6kh7ak",
  authDomain: "exam-wise-1c66a.firebaseapp.com",
  projectId: "exam-wise-1c66a",
  storageBucket: "exam-wise-1c66a.firebasestorage.app",
  messagingSenderId: "400655762440",
  appId: "1:400655762440:web:890eedc323af79e7643dbd",
  measurementId: "G-BNFYL9NBJ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics };
