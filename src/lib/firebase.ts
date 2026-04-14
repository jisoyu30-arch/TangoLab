import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCBCMxKJ_gK_0YhXu5XKRn2rSyYuiTgsHQ",
  authDomain: "tango-lab-ac184.firebaseapp.com",
  projectId: "tango-lab-ac184",
  storageBucket: "tango-lab-ac184.firebasestorage.app",
  messagingSenderId: "385121852084",
  appId: "1:385121852084:web:e6c46140b5b941f82095e1",
  measurementId: "G-VK2LKWC9GH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
