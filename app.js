import { AUTHORIZED_EMAIL, FIREBASE_CONFIG } from './AdsUpload/auth-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, push, set, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const STORAGE_KEY = 'declanEnergyProducts';
const USER_EMAIL_KEY = 'declanEnergyUserEmail';
const USER_ID_KEY = 'declanEnergyUserId';
const USER_ADMIN_KEY = 'declanEnergyIsAdmin';
const ORDER_STORAGE_PREFIX = 'declanEnergyOrders:';
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx';
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxXX';
const CURRENCY = 'NGN';

const CONTACT_INFO = {
  email: 'declanenergytechnologies@gmailcom',
  whatsapp: '+2348028395501',
  facebook: 'https://facebook.com/declanenergy',
  phone: '+2348028395501'

};

const DEFAULT_PRODUCTS = [
  {
    id: 'panel-001',
    name: 'Solar Panel Kit 450W',
    category: 'Solar Panel',
    price: 145000,
    description: 'High-efficiency solar module with advanced anti-reflective coating and durable frame.',
    image: 'https://via.placeholder.com/700x420/0f4c81/ffffff?text=Solar+Panel+Kit',
  },
  {
    id: 'inverter-001',
    name: 'Hybrid Inverter 5kVA',
    category: 'Inverter',
    price: 210000,
    description: 'Reliable hybrid inverter with battery backup, smart monitoring and seamless power switching.',
    image: 'https://via.placeholder.com/700x420/0fb973/ffffff?text=Hybrid+Inverter',
  },
  {
    id: 'smart-001',
    name: 'Smart Energy Controller',
    category: 'Smart Device',
    price: 72000,
    description: 'Wireless energy monitor for real-time solar performance and appliance management.',
    image: 'https://via.placeholder.com/700x420/2c8cff/ffffff?text=Smart+Energy+Controller',
  },
];

const productGrid = document.getElementById('productGrid');
const productSearchInput = document.getElementById('productSearch');
const productCategoryFilter = document.getElementById('productCategoryFilter');
const searchResultsCount = document.getElementById('searchResultsCount');
const contactEmail = document.getElementById('contactEmail');
const contactWhatsapp = document.getElementById('contactWhatsapp');
const contactFacebook = document.getElementById('contactFacebook');
const contactPhone = document.getElementById('contactPhone');
const accountStatus = document.getElementById('accountStatus');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const dashboardButton = document.getElementById('dashboardButton');
const buyerDashboard = document.getElementById('buyerDashboard');
const buyerOrderList = document.getElementById('buyerOrderList');
const buyerOrderStatus = document.getElementById('buyerOrderStatus');
const closeDashboardButton = document.getElementById('closeDashboardButton');

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);
const provider = new GoogleAuthProvider();

let products = [];

async function loadProducts() {
  try {
    const snapshot = await get(ref(db, 'products'));
    if (snapshot.exists()) {
      const value = snapshot.val();
      if (Array.isArray(value) && value.length > 0) {
        products = value.filter(Boolean);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return;
      }
      if (value && typeof value === 'object') {
        products = Object.values(value).filter(Boolean);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return;
      }
    }
  } catch (error) {
    console.warn('Unable to load product data from Firebase:', error);
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products = parsed;
        return;
      }
    } catch (error) {
      console.warn('Unable to parse stored product data', error);
    }
  }

  products = DEFAULT_PRODUCTS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 240);
  }, 3200);
}

function renderContactInfo() {
  contactEmail.textContent = CONTACT_INFO.email;
  contactEmail.href = `mailto:${CONTACT_INFO.email}`;
  contactWhatsapp.textContent = CONTACT_INFO.whatsapp;
  contactWhatsapp.href = `https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, '')}`;
  contactFacebook.textContent = CONTACT_INFO.facebook.replace(/^https?:\/\//, '');
  contactFacebook.href = CONTACT_INFO.facebook;
  contactPhone.textContent = CONTACT_INFO.phone;
  contactPhone.href = `tel:${CONTACT_INFO.phone.replace(/\D/g, '')}`;
}

function getCurrentUser() {
  return {
    email: localStorage.getItem(USER_EMAIL_KEY) || '',
    uid: localStorage.getItem(USER_ID_KEY) || '',
    isAdmin: localStorage.getItem(USER_ADMIN_KEY) === 'true',
  };
}

function setCurrentUser(email, uid = '') {
  if (!email) return;
  localStorage.setItem(USER_EMAIL_KEY, email);
  if (uid) localStorage.setItem(USER_ID_KEY, uid);
  localStorage.setItem(USER_ADMIN_KEY, String(email === AUTHORIZED_EMAIL));
  updateAuthUI();
}

function clearCurrentUser() {
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_ADMIN_KEY);
  buyerDashboard?.classList.add('hidden');
  updateAuthUI();
}

function updateAuthUI() {
  const { email, isAdmin } = getCurrentUser();
  if (!email) {
    accountStatus.textContent = 'Not signed in';
    googleSignInBtn.classList.remove('hidden');
    signOutBtn.classList.add('hidden');
    dashboardButton?.classList.add('hidden');
    return;
  }

  let statusText = 'Signed in as <strong>' + email + '</strong>';
  if (isAdmin) {
    statusText += ' <span style="color: green;">(admin)</span>';
  }
  accountStatus.innerHTML = statusText;
  googleSignInBtn.classList.add('hidden');
  signOutBtn.classList.remove('hidden');
  dashboardButton?.classList.remove('hidden');
}

async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user && result.user.email;
    if (!email) {
      throw new Error('Unable to read signed-in email.');
    }
    setCurrentUser(email, result.user.uid);
    await openBuyerDashboard();
    showToast(`Signed in as ${email}`, 'success');
  } catch (error) {
    showToast(error.message || 'Google sign-in failed.', 'error');
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Firebase sign-out error', error);
  }
  clearCurrentUser();
  showToast('Signed out successfully.', 'success');
}

onAuthStateChanged(auth, (user) => {
  if (user && user.email) {
    setCurrentUser(user.email, user.uid);
  } else {
    updateAuthUI();
  }
});

googleSignInBtn.addEventListener('click', handleGoogleSignIn);
signOutBtn.addEventListener('click', handleSignOut);

function getLocalOrders(email) {
  if (!email) return [];
  try {
    return JSON.parse(localStorage.getItem(`${ORDER_STORAGE_PREFIX}${email}`) || '[]');
  } catch (error) {
    console.warn('Unable to read saved buyer orders:', error);
    return [];
  }
}

function saveLocalOrder(email, order) {
  const orders = getLocalOrders(email);
  orders.unshift(order);
  localStorage.setItem(`${ORDER_STORAGE_PREFIX}${email}`, JSON.stringify(orders));
}

function getOrderUserKey(email) {
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, '%2E');
}

function renderBuyerOrders(orders) {
  if (!buyerOrderList) return;
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

async function openBuyerDashboard() {
  const { email } = getCurrentUser();
  if (!email) {
    showToast('Please sign in to view your buyer dashboard.', 'warning');
    return;
  }
  window.location.href = 'account.html';
}

async function recordSuccessfulOrder(product, paymentMethod, reference, email) {
  const order = {
    productId: product.id,
    productName: product.name,
    amount: Number(product.price) || 0,
    paymentMethod,
    reference: reference || '',
    status: 'paid',
    customerEmail: email,
    createdAt: Date.now(),
  };

  saveLocalOrder(email, order);
  try {
    const orderRef = push(ref(db, `orders/${getOrderUserKey(email)}`));
    await set(orderRef, order);
  } catch (error) {
    console.warn('Unable to sync order to Firebase; local order copy retained:', error);
  }

  if (getCurrentUser().email) await openBuyerDashboard();
}

function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);

    if (url.hostname.includes('dropbox.com')) {
      url.hostname = 'dl.dropboxusercontent.com';
      url.searchParams.delete('dl');
      url.searchParams.delete('raw');
      url.searchParams.set('raw', '1');
      return url.toString();
    }

    if (url.hostname.includes('dropboxusercontent.com') && !url.searchParams.has('raw')) {
      url.searchParams.set('raw', '1');
      return url.toString();
    }

    return trimmed;
  } catch (error) {
    return trimmed;
  }
}

function setImageWithFallback(imgElement, src, fallbackText) {
  const safeSrc = normalizeImageUrl(src);
  if (!safeSrc) {
    imgElement.src = `https://via.placeholder.com/700x420/0f4c81/ffffff?text=${encodeURIComponent(fallbackText)}`;
    return;
  }

  imgElement.src = safeSrc;
  imgElement.onerror = () => {
    imgElement.src = `https://via.placeholder.com/700x420/0f4c81/ffffff?text=${encodeURIComponent(fallbackText)}`;
  };
}

function createProductCard(product) {
  const wrapper = document.createElement('article');
  wrapper.className = 'product-card';

  const imageCarousel = document.createElement('div');
  imageCarousel.className = 'product-image-carousel';

  const carouselImage = document.createElement('img');
  carouselImage.alt = product.name;
  carouselImage.className = 'carousel-image';
  imageCarousel.appendChild(carouselImage);

  const images = [product.image, ...(Array.isArray(product.supportImages) ? product.supportImages.filter(Boolean) : [])]
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean);
  let carouselIndex = 0;

  if (images.length === 0) {
    setImageWithFallback(carouselImage, '', product.name || 'Product image');
  } else {
    setImageWithFallback(carouselImage, images[0], product.name || 'Product image');
  }

  const countBadge = document.createElement('span');
  countBadge.className = 'image-count-badge';
  countBadge.textContent = `${carouselIndex + 1}/${images.length}`;
  if (images.length === 1) {
    countBadge.style.display = 'none';
  }
  imageCarousel.appendChild(countBadge);

  const advanceSlide = (direction) => {
    if (images.length === 0) return;
    carouselIndex = (carouselIndex + direction + images.length) % images.length;
    setImageWithFallback(carouselImage, images[carouselIndex], product.name || 'Product image');
    countBadge.textContent = `${carouselIndex + 1}/${images.length}`;
  };

  if (images.length > 1) {
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'carousel-nav carousel-prev';
    prevButton.innerHTML = '&#8249;';
    prevButton.addEventListener('click', () => advanceSlide(-1));

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'carousel-nav carousel-next';
    nextButton.innerHTML = '&#8250;';
    nextButton.addEventListener('click', () => advanceSlide(1));

    imageCarousel.append(prevButton, nextButton);

    let startX = 0;
    let isDragging = false;

    imageCarousel.addEventListener('touchstart', (event) => {
      startX = event.touches[0]?.clientX ?? 0;
      isDragging = true;
    });

    imageCarousel.addEventListener('touchmove', (event) => {
      if (!isDragging) return;
      const currentX = event.touches[0]?.clientX ?? 0;
      if (Math.abs(currentX - startX) > 40) {
        if (currentX > startX) {
          advanceSlide(-1);
        } else {
          advanceSlide(1);
        }
        isDragging = false;
      }
    });

    imageCarousel.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  wrapper.appendChild(imageCarousel);

  const videoAction = document.createElement('div');
  videoAction.className = 'video-action-wrapper';

  if (images.length > 1) {
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'button button-secondary preview-images-button';
    previewButton.textContent = 'Preview images';
    previewButton.addEventListener('click', () => openGalleryModal(product));
    videoAction.appendChild(previewButton);
  }

  if (product.video) {
    const videoButton = document.createElement('button');
    videoButton.type = 'button';
    videoButton.className = 'button button-primary play-video-button';
    videoButton.textContent = 'Play product video';
    videoButton.addEventListener('click', () => openVideoModal(product));
    videoAction.appendChild(videoButton);
  }

  if (videoAction.children.length > 0) {
    wrapper.appendChild(videoAction);
  }

  const content = document.createElement('div');
  content.className = 'product-content';

  const title = document.createElement('h3');
  title.textContent = product.name;
  content.appendChild(title);

  const desc = document.createElement('p');
  desc.textContent = product.description;
  content.appendChild(desc);

  const meta = document.createElement('div');
  meta.className = 'product-meta';
  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = formatCurrency(product.price);
  const category = document.createElement('div');
  category.textContent = product.category;
  category.style.color = 'var(--muted)';
  meta.append(price, category);
  content.appendChild(meta);

  const buttons = document.createElement('div');
  buttons.className = 'button-group';

  const paystackButton = document.createElement('button');
  paystackButton.className = 'button buy-button button-primary';
  paystackButton.textContent = 'Paystack';
  paystackButton.addEventListener('click', () => payWithPaystack(product));

  const flutterwaveButton = document.createElement('button');
  flutterwaveButton.className = 'button buy-button button-secondary';
  flutterwaveButton.textContent = 'Flutterwave';
  flutterwaveButton.addEventListener('click', () => payWithFlutterwave(product));

  buttons.append(paystackButton, flutterwaveButton);
  content.appendChild(buttons);
  wrapper.appendChild(content);

  return wrapper;
}

function populateCategoryFilter() {
  if (!productCategoryFilter) return;

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const currentlySelected = productCategoryFilter.value || 'all';
  productCategoryFilter.innerHTML = '<option value="all">All categories</option>';

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    productCategoryFilter.appendChild(option);
  });

  if (categories.includes(currentlySelected)) {
    productCategoryFilter.value = currentlySelected;
  } else {
    productCategoryFilter.value = 'all';
  }
}

function getFilteredProducts() {
  const query = (productSearchInput ? productSearchInput.value : '').trim().toLowerCase();
  const selectedCategory = productCategoryFilter ? productCategoryFilter.value : 'all';

  return products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const haystack = [product.name, product.category, product.description].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  productGrid.innerHTML = '';
  const filteredProducts = getFilteredProducts();

  if (searchResultsCount) {
    if (!filteredProducts.length) {
      searchResultsCount.textContent = 'No products match your search';
    } else if (filteredProducts.length === products.length) {
      searchResultsCount.textContent = 'Showing all products';
    } else {
      searchResultsCount.textContent = `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`;
    }
  }

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = '<p class="empty-state">No products match your search. Try another keyword.</p>';
    return;
  }

  filteredProducts.forEach((product) => productGrid.appendChild(createProductCard(product)));
}

const photoModal = createPhotoModal();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (photoModal && !photoModal.classList.contains('hidden')) {
      closePhotoModal();
    }
    const videoModal = document.getElementById('videoModal');
    if (videoModal && !videoModal.classList.contains('hidden')) {
      closeVideoModal();
    }
  }
});

function createPhotoModal() {
  const modal = document.createElement('div');
  modal.id = 'photoModal';
  modal.className = 'photo-modal hidden';
  modal.innerHTML = `
    <div class="photo-modal-backdrop"></div>
    <div class="photo-modal-card">
      <button type="button" class="modal-close" aria-label="Close gallery">×</button>
      <div class="photo-modal-header">
        <h3 class="modal-title"></h3>
      </div>
      <div class="modal-main-photo"><img alt=""></div>
      <div class="modal-thumbnails"></div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.photo-modal-backdrop').addEventListener('click', closePhotoModal);
  modal.querySelector('.modal-close').addEventListener('click', closePhotoModal);
  return modal;
}

function openGalleryModal(product) {
  const title = photoModal.querySelector('.modal-title');
  const mainImage = photoModal.querySelector('.modal-main-photo img');
  const thumbnails = photoModal.querySelector('.modal-thumbnails');

  const photoSources = [product.image, ...(Array.isArray(product.supportImages) ? product.supportImages : [])]
    .map((src) => normalizeImageUrl(src))
    .filter(Boolean);
  if (photoSources.length === 0) {
    showToast('No photos available for this product.', 'warning');
    return;
  }

  title.textContent = product.name;
  thumbnails.innerHTML = '';
  setImageWithFallback(mainImage, photoSources[0], product.name || 'Product image');
  mainImage.alt = `${product.name} preview`;

  photoSources.forEach((src, index) => {
    const thumbButton = document.createElement('button');
    thumbButton.type = 'button';
    thumbButton.className = 'modal-thumb' + (index === 0 ? ' active' : '');
    const thumbImg = document.createElement('img');
    setImageWithFallback(thumbImg, src, `${product.name} photo ${index + 1}`);
    thumbImg.alt = `${product.name} photo ${index + 1}`;
    thumbButton.appendChild(thumbImg);

    thumbButton.addEventListener('click', () => {
      setImageWithFallback(mainImage, src, product.name || 'Product image');
      thumbnails.querySelectorAll('.modal-thumb').forEach((btn) => btn.classList.remove('active'));
      thumbButton.classList.add('active');
    });

    thumbnails.appendChild(thumbButton);
  });

  photoModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePhotoModal() {
  photoModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function openVideoModal(product) {
  const videoModal = getVideoModal();
  const title = videoModal.querySelector('.video-modal-title');
  const videoElement = videoModal.querySelector('video');

  title.textContent = product.name;
  videoElement.src = product.video;
  videoElement.load();
  videoModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function getVideoModal() {
  let videoModal = document.getElementById('videoModal');
  if (videoModal) return videoModal;

  videoModal = document.createElement('div');
  videoModal.id = 'videoModal';
  videoModal.className = 'photo-modal hidden';
  videoModal.innerHTML = `
    <div class="photo-modal-backdrop"></div>
    <div class="photo-modal-card video-modal-card">
      <button type="button" class="modal-close" aria-label="Close video">×</button>
      <div class="photo-modal-header">
        <h3 class="video-modal-title"></h3>
      </div>
      <div class="modal-main-photo video-player-wrapper">
        <video controls class="video-player"></video>
      </div>
    </div>
  `;

  document.body.appendChild(videoModal);
  videoModal.querySelector('.photo-modal-backdrop').addEventListener('click', closeVideoModal);
  videoModal.querySelector('.modal-close').addEventListener('click', closeVideoModal);
  return videoModal;
}

function closeVideoModal() {
  const videoModal = document.getElementById('videoModal');
  if (!videoModal) return;
  const videoElement = videoModal.querySelector('video');
  if (videoElement) {
    videoElement.pause();
    videoElement.src = '';
  }
  videoModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function payWithPaystack(product) {
  const currentUser = getCurrentUser();
  const email = currentUser.email || prompt('Enter your email for payment:')?.trim();
  if (!email) {
    showToast('Payment cancelled: email is required.', 'error');
    return;
  }
  if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.includes('pk_test_xxxxxxxxx')) {
    showToast('Please set PAYSTACK_PUBLIC_KEY in app.js to enable Paystack.', 'error');
    return;
  }
  if (!window.PaystackPop) {
    showToast('Paystack checkout did not load. Refresh the page.', 'error');
    return;
  }

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: product.price * 100,
    currency: CURRENCY,
    ref: `DECLAN-${product.id}-${Date.now()}`,
    metadata: {
      custom_fields: [
        {
          display_name: 'Product',
          variable_name: 'product_name',
          value: product.name,
        },
      ],
    },
    callback(response) {
      recordSuccessfulOrder(product, 'Paystack', response.reference, email);
      showToast(`Paystack payment complete. Ref: ${response.reference}`);
    },
    onClose() {
      showToast('Paystack payment window was closed.', 'warning');
    },
  });
  handler.openIframe();
}

function payWithFlutterwave(product) {
  const currentUser = getCurrentUser();
  const email = currentUser.email || prompt('Enter your email for payment:')?.trim();
  if (!email) {
    showToast('Payment cancelled: email is required.', 'error');
    return;
  }
  if (!FLUTTERWAVE_PUBLIC_KEY || FLUTTERWAVE_PUBLIC_KEY.includes('FLWPUBK_TEST-xxxxxxxx')) {
    showToast('Please set FLUTTERWAVE_PUBLIC_KEY in app.js to enable Flutterwave.', 'error');
    return;
  }
  if (!window.FlutterwaveCheckout) {
    showToast('Flutterwave checkout did not load. Refresh the page.', 'error');
    return;
  }

  window.FlutterwaveCheckout({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `DECLAN-${product.id}-${Date.now()}`,
    amount: product.price,
    currency: CURRENCY,
    payment_options: 'card, ussd, mobilemoney, banktransfer',
    customer: {
      email,
      phonenumber: CONTACT_INFO.phone.replace(/\D/g, ''),
      name: 'Declan Energy Customer',
    },
    customizations: {
      title: 'Declan Energy Store',
      description: product.name,
      logo: 'https://via.placeholder.com/120x120/0f4c81/ffffff?text=DE',
    },
    callback(data) {
      if (data.status === 'successful' || data.status === 'completed') {
        recordSuccessfulOrder(product, 'Flutterwave', data.transaction_id || data.tx_ref, email);
        showToast(`Flutterwave payment complete. Ref: ${data.transaction_id || data.tx_ref}`);
      } else {
        showToast(`Flutterwave payment status: ${data.status}`, 'warning');
      }
    },
    onclose() {
      showToast('Flutterwave payment was closed.', 'warning');
    },
    redirect_url: window.location.href,
  });
}

async function initHeroSlider() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));

  if (!slides.length) return;

  let currentIndex = 0;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === currentIndex);
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showSlide(index));
  });

  setInterval(() => showSlide(currentIndex + 1), 5000);
}

async function initSite() {
  await loadProducts();
  populateCategoryFilter();
  renderContactInfo();
  renderProducts();
  updateAuthUI();
  initHeroSlider();

  if (productSearchInput) {
    productSearchInput.addEventListener('input', renderProducts);
  }

  if (productCategoryFilter) {
    productCategoryFilter.addEventListener('change', renderProducts);
  }
}

initSite();
