import { FIREBASE_CONFIG } from './AdsUpload/auth-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const USER_EMAIL_KEY = 'declanEnergyUserEmail';
const USER_ID_KEY = 'declanEnergyUserId';
const ORDER_STORAGE_PREFIX = 'declanEnergyOrders:';
const CURRENCY = 'NGN';

const accountStatus = document.getElementById('accountStatus');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const buyerOrderList = document.getElementById('buyerOrderList');
const buyerOrderStatus = document.getElementById('buyerOrderStatus');

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);
const provider = new GoogleAuthProvider();

function getOrderUserKey(email) {
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, '%2E');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function getLocalOrders(email) {
  try {
    return JSON.parse(localStorage.getItem(`${ORDER_STORAGE_PREFIX}${email}`) || '[]');
  } catch (error) {
    console.warn('Unable to read local buyer orders:', error);
    return [];
  }
}

function renderOrders(orders) {
  buyerOrderList.innerHTML = '';
  if (!orders.length) {
    buyerOrderList.innerHTML = '<p class="empty-orders">No completed orders yet. Your paid products will appear here.</p>';
    return;
  }

  orders.forEach((order) => {
    const item = document.createElement('article');
    item.className = 'buyer-order-card';
    const date = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable';
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(order.productName)}</h3>
        <p>${escapeHtml(order.paymentMethod)} · ${escapeHtml(date)}</p>
      </div>
      <div class="buyer-order-details">
        <strong>${formatCurrency(order.amount)}</strong>
        <span class="order-paid">Paid</span>
      </div>
    `;
    buyerOrderList.appendChild(item);
  });
}

async function loadOrders(email) {
  buyerOrderStatus.textContent = 'Loading your orders...';
  let orders = getLocalOrders(email);

  try {
    const snapshot = await get(ref(db, `orders/${getOrderUserKey(email)}`));
    if (snapshot.exists()) {
      orders = Object.values(snapshot.val()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  } catch (error) {
    console.warn('Unable to load buyer orders from Firebase:', error);
  }

  renderOrders(orders);
  buyerOrderStatus.textContent = `${orders.length} completed order${orders.length === 1 ? '' : 's'}`;
}

function updateAccountUI(user) {
  if (!user || !user.email) {
    accountStatus.textContent = 'Not signed in';
    googleSignInBtn.classList.remove('hidden');
    signOutBtn.classList.add('hidden');
    buyerOrderStatus.textContent = 'Sign in to view your orders.';
    renderOrders([]);
    return;
  }

  localStorage.setItem(USER_EMAIL_KEY, user.email);
  localStorage.setItem(USER_ID_KEY, user.uid || '');
  accountStatus.textContent = user.email;
  googleSignInBtn.classList.add('hidden');
  signOutBtn.classList.remove('hidden');
  loadOrders(user.email);
}

async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    updateAccountUI(result.user);
  } catch (error) {
    accountStatus.textContent = error.message || 'Google sign-in failed.';
  }
}

async function handleSignOut() {
  await signOut(auth);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ID_KEY);
  updateAccountUI(null);
}

googleSignInBtn.addEventListener('click', handleGoogleSignIn);
signOutBtn.addEventListener('click', handleSignOut);
onAuthStateChanged(auth, updateAccountUI);
