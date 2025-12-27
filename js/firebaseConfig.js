const firebaseConfig = {
  apiKey: "AIzaSyCNV72D3X6ecI3tpqnPt4CUWJzrLo83Bkc",
  authDomain: "try-firebase-bdb77.firebaseapp.com",
  projectId: "try-firebase-bdb77",
  storageBucket: "try-firebase-bdb77.firebasestorage.app",
  messagingSenderId: "327656427702",
  appId: "1:327656427702:web:c2bf0fff68d18460029617"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

