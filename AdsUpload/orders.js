import { FIREBASE_CONFIG } from './auth-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const USER_EMAIL_KEY = 'declanEnergyUserEmail';
const USER_ADMIN_KEY = 'declanEnergyIsAdmin';
const orderList = document.getElementById('orderList');
const orderCount = document.getElementById('orderCount');
const refreshOrdersButton = document.getElementById('refreshOrdersButton');
const signOutButton = document.getElementById('signOutButton');

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function renderOrders(orders) {
  orderList.innerHTML = '';
  orderCount.textContent = `${orders.length} completed order${orders.length === 1 ? '' : 's'}`;

  if (!orders.length) {
    orderList.innerHTML = '<p class="empty-state">No completed orders yet.</p>';
    return;
  }

  orders.forEach((order) => {
    const item = document.createElement('article');
    item.className = 'order-item';
    const date = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable';
    item.innerHTML = `
      <div class="order-item-info">
        <strong>${escapeHtml(order.productName)}</strong>
        <span>${escapeHtml(order.customerEmail)} · ${escapeHtml(order.paymentMethod)} · ${escapeHtml(date)}</span>
      </div>
      <div class="order-item-meta">
        <strong>₦${Number(order.amount || 0).toLocaleString()}</strong>
        <span class="order-paid">Paid</span>
      </div>
    `;
    orderList.appendChild(item);
  });
}

async function loadOrders() {
  orderList.innerHTML = '<p class="empty-state">Loading orders...</p>';
  try {
    const snapshot = await get(ref(db, 'orders'));
    const orders = [];
    if (snapshot.exists()) {
      Object.values(snapshot.val()).forEach((customerOrders) => {
        if (customerOrders && typeof customerOrders === 'object') {
          Object.values(customerOrders).forEach((order) => orders.push(order));
        }
      });
    }
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderOrders(orders);
  } catch (error) {
    console.error('Unable to load orders:', error);
    orderCount.textContent = 'Orders unavailable';
    orderList.innerHTML = '<p class="empty-state">Unable to load orders. Check Firebase database permissions.</p>';
  }
}

function requireAdmin() {
  const email = localStorage.getItem(USER_EMAIL_KEY);
  const isAdmin = localStorage.getItem(USER_ADMIN_KEY) === 'true';
  if (!email || !isAdmin) {
    window.location.href = 'auth.html?returnTo=orders.html';
    return false;
  }
  return true;
}

refreshOrdersButton.addEventListener('click', loadOrders);
signOutButton.addEventListener('click', async () => {
  await signOut(auth).catch((error) => console.warn('Sign-out failed:', error));
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ADMIN_KEY);
  window.location.href = 'auth.html?returnTo=orders.html';
});

if (requireAdmin()) loadOrders();
