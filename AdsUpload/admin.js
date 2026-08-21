import { AUTHORIZED_EMAIL, FIREBASE_CONFIG } from './auth-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, push, set, get, remove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import { getValidDropboxToken, initiateOAuthLogin } from './dropbox-oauth-handler.js';
import DROPBOX_CONFIG from './dropbox-config.js';

const STORAGE_KEY = 'declanEnergyProducts';
const USER_EMAIL_KEY = 'declanEnergyUserEmail';
const USER_ADMIN_KEY = 'declanEnergyIsAdmin';

const loginPanel = document.getElementById('loginPanel');
const adminDashboard = document.getElementById('adminDashboard');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const dropboxAuthBtn = document.getElementById('dropboxAuthBtn');
const dropboxStatus = document.getElementById('dropboxStatus');
const adminProductForm = document.getElementById('adminProductForm');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const productCategory = document.getElementById('productCategory');
const newCategoryName = document.getElementById('newCategoryName');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const productDescription = document.getElementById('productDescription');
const productImageUrl = document.getElementById('productImageUrl');
const productImageFile = document.getElementById('productImageFile');
const supportImageUrls = document.getElementById('supportImageUrls');
const supportImageFiles = document.getElementById('supportImageFiles');
const productVideoUrl = document.getElementById('productVideoUrl');
const productVideoFile = document.getElementById('productVideoFile');
const adminProductList = document.getElementById('adminProductList');
const adminProductCount = document.getElementById('adminProductCount');
const adminFormMessage = document.getElementById('adminFormMessage');
const clearAdminForm = document.getElementById('clearAdminForm');
const adminAccessMessage = document.getElementById('adminAccessMessage');
const adminUserLabel = document.getElementById('adminUserLabel');
const adminLoginButton = document.getElementById('adminLoginButton');
const adminSwitchButton = document.getElementById('adminSwitchButton');

let products = [];
let categories = [];
let editProductId = null;

// Initialize Firebase database for storing product metadata
const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(firebaseApp);

async function loadProducts() {
  try {
    const snapshot = await get(ref(db, 'products'));
    if (snapshot.exists()) {
      const value = snapshot.val();
      if (Array.isArray(value)) {
        products = value.filter(Boolean);
        return;
      }
      if (value && typeof value === 'object') {
        products = Object.values(value);
        return;
      }
    }
  } catch (error) {
    console.warn('Unable to load products from Firebase:', error);
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        products = parsed;
        return;
      }
    } catch (error) {
      console.warn('Unable to parse stored products:', error);
    }
  }
  products = [];
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

async function loadCategories() {
  try {
    const snapshot = await get(ref(db, 'categories'));
    if (snapshot.exists()) {
      const value = snapshot.val();
      const list = Array.isArray(value)
        ? value
        : Object.values(value || {}).map((item) => (typeof item === 'string' ? item : item && item.name)).filter(Boolean);
      if (list.length) {
        categories = [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
        localStorage.setItem('declanEnergyCategories', JSON.stringify(categories));
        return;
      }
    }
  } catch (error) {
    console.warn('Unable to load categories from Firebase:', error);
  }

  const stored = localStorage.getItem('declanEnergyCategories');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        categories = [...new Set(parsed.map((item) => String(item).trim()).filter(Boolean))];
        return;
      }
    } catch (error) {
      console.warn('Unable to parse stored categories:', error);
    }
  }

  categories = ['Solar Panel', 'Inverter', 'Smart Device'];
  localStorage.setItem('declanEnergyCategories', JSON.stringify(categories));
}

function saveCategories() {
  localStorage.setItem('declanEnergyCategories', JSON.stringify(categories));
}

function refreshCategoryOptions(selectedValue = '') {
  if (!productCategory) return;
  const currentValue = selectedValue || productCategory.value || '';
  productCategory.innerHTML = '<option value="">Select a category</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    if (category === currentValue) {
      option.selected = true;
    }
    productCategory.appendChild(option);
  });
  if (!currentValue && categories.length) {
    productCategory.value = categories[0];
  }
}

async function addCategoryToFirebase(categoryName) {
  const normalized = String(categoryName || '').trim();
  if (!normalized) return null;

  const cleaned = normalized.replace(/\s+/g, ' ');
  const slug = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';

  if (!categories.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
    categories.push(cleaned);
    categories.sort((a, b) => a.localeCompare(b));
    saveCategories();
  }

  await set(ref(db, `categories/${slug}`), {
    id: slug,
    name: cleaned,
    updatedAt: new Date().toISOString(),
  });

  refreshCategoryOptions(cleaned);
  return cleaned;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getCurrentUser() {
  return {
    email: normalizeEmail(localStorage.getItem(USER_EMAIL_KEY)),
    isAdmin: localStorage.getItem(USER_ADMIN_KEY) === 'true',
  };
}

function clearCurrentUser() {
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ADMIN_KEY);
}

function getDropboxTokenPresent() {
  return Boolean(localStorage.getItem(DROPBOX_CONFIG.storage.accessToken) || localStorage.getItem(DROPBOX_CONFIG.storage.refreshToken));
}

function updateDropboxButton() {
  if (!dropboxAuthBtn) return;
  if (getDropboxTokenPresent()) {
    dropboxAuthBtn.textContent = 'Dropbox connected';
    dropboxAuthBtn.disabled = true;
    if (dropboxStatus) {
      dropboxStatus.textContent = 'Dropbox is connected. You can upload image files now.';
      dropboxStatus.style.color = '#047857';
    }
  } else {
    dropboxAuthBtn.textContent = 'Connect Dropbox';
    dropboxAuthBtn.disabled = false;
    if (dropboxStatus) {
      dropboxStatus.textContent = 'Dropbox auth required before uploading image files.';
      dropboxStatus.style.color = '#6b7280';
    }
  }
}

function updateAuthPanel() {
  const { email, isAdmin } = getCurrentUser();

  if (!email) {
    adminAccessMessage.textContent = 'Please sign in with your email before accessing the admin dashboard.';
    adminUserLabel.textContent = 'Not signed in yet.';
    adminLoginButton.textContent = 'Sign in now';
    adminSwitchButton.classList.add('hidden');
    updateDropboxButton();
    return false;
  }

  adminUserLabel.textContent = `Signed in as: ${email}`;
  adminSwitchButton.classList.remove('hidden');

  if (!isAdmin) {
    adminAccessMessage.textContent = `Signed in as ${email}, but this account is not authorized for admin. Please sign in with the authorized admin email to manage inventory.`;
    adminLoginButton.textContent = 'Switch account';
    adminSwitchButton.classList.remove('hidden');
    updateDropboxButton();
    return false;
  }

  adminAccessMessage.textContent = 'You are authorized. The admin dashboard is available.';
  adminLoginButton.textContent = 'Re-authenticate';
  updateDropboxButton();
  return true;
}

function toggleAdminDashboard() {
  const authorized = updateAuthPanel();
  if (authorized) {
    loginPanel.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    renderAdminProducts();
  } else {
    loginPanel.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
    clearForm();
  }
}


function renderAdminProducts() {
  adminProductList.innerHTML = '';
  adminProductCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'} available`;

  if (products.length === 0) {
    adminProductList.innerHTML = '<p class="empty-state">No products available. Add a product to begin.</p>';
    return;
  }

  products.forEach((product) => {
    const item = document.createElement('div');
    item.className = 'admin-product-item';

    const label = document.createElement('div');
    label.innerHTML = `<strong>${product.name}</strong><span>${product.category} • ₦${product.price.toLocaleString()}</span>`;

    const actions = document.createElement('div');
    actions.className = 'admin-product-actions';

    const editButton = document.createElement('button');
    editButton.className = 'edit-button';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => loadProductForEdit(product.id));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteProduct(product.id));

    actions.append(editButton, deleteButton);
    item.append(label, actions);
    adminProductList.appendChild(item);
  });
}

function loadProductForEdit(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  editProductId = product.id;
  productName.value = product.name;
  productPrice.value = product.price;
  refreshCategoryOptions(product.category || '');
  productDescription.value = product.description;
  productImageUrl.value = product.image && !product.image.startsWith('data:') ? product.image : '';
  supportImageUrls.value = Array.isArray(product.supportImages) ? product.supportImages.join(', ') : '';
  productVideoUrl.value = product.video || '';
  adminFormMessage.textContent = 'Editing existing product. Save to update inventory.';
}

async function deleteProduct(productId) {
  const confirmed = confirm('Delete this product from inventory?');
  if (!confirmed) return;

  try {
    await remove(ref(db, `products/${productId}`));
  } catch (error) {
    console.error('Firebase delete failed', error);
    showMessage('Failed to delete product from Firebase. ' + error.message, 'error');
    return;
  }

  await loadProducts();
  saveProducts();
  renderAdminProducts();
  showMessage('Product removed successfully.', 'success');
}

function clearForm() {
  editProductId = null;
  adminFormMessage.textContent = '';
  adminProductForm.reset();
  if (productCategory) {
    refreshCategoryOptions(categories[0] || '');
  }
  if (newCategoryName) {
    newCategoryName.value = '';
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

function showMessage(message, type = 'success') {
  adminFormMessage.textContent = message;
  adminFormMessage.style.color = type === 'success' ? '#047857' : '#dc2626';
}

// Upload a file to Dropbox into a product-specific folder if productId provided
async function uploadFileToDropbox(file, productId) {
  if (!file) return null;
  const token = await getValidDropboxToken();
  const fileType = productId ? `products/${productId}` : 'products';
  const dropboxPath = DROPBOX_CONFIG.getUploadPath(fileType, file.name);

  const uploadResponse = await fetch(DROPBOX_CONFIG.api.fileUpload, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({
        path: dropboxPath,
        mode: DROPBOX_CONFIG.upload.mode || 'add',
        autorename: DROPBOX_CONFIG.upload.autorename !== false,
        mute: DROPBOX_CONFIG.upload.mute || false,
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Dropbox upload failed: ${uploadResponse.status} ${uploadResponse.statusText} ${errorText}`);
  }

  const tempLinkResponse = await fetch(DROPBOX_CONFIG.api.getTemporaryLink, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: dropboxPath }),
  });

  if (!tempLinkResponse.ok) {
    const errorText = await tempLinkResponse.text();
    throw new Error(`Dropbox temporary link failed: ${tempLinkResponse.status} ${tempLinkResponse.statusText} ${errorText}`);
  }

  const tempLinkData = await tempLinkResponse.json();
  return tempLinkData.link;
}

async function saveProductToFirebase(product) {
  const productRef = ref(db, `products/${product.id}`);
  await set(productRef, product);
}

function updateLocalProductState(productData) {
  if (editProductId) {
    products = products.map((item) => (item.id === editProductId ? productData : item));
  } else {
    products.unshift(productData);
  }
  saveProducts();
  renderAdminProducts();
}

async function handleProductForm(event) {
  event.preventDefault();
  adminFormMessage.textContent = '';

  const name = productName.value.trim();
  const category = productCategory && productCategory.value ? productCategory.value.trim() : '';
  const description = productDescription.value.trim();
  const price = Number(productPrice.value);
  let image = productImageUrl.value.trim();
  const imageFile = productImageFile.files[0];
  const supportImageUrlText = supportImageUrls.value.trim();
  const supportImageFileList = Array.from(supportImageFiles.files);
  let supportImages = supportImageUrlText ? supportImageUrlText.split(',').map((url) => url.trim()).filter(Boolean) : [];
  let video = productVideoUrl.value.trim();
  const videoFile = productVideoFile.files[0];

  if (!name || !category || !description || !price) {
    showMessage('Please complete all required fields.', 'error');
    return;
  }

  try {
    await addCategoryToFirebase(category);
  } catch (error) {
    console.error('Category save failed', error);
    showMessage('Failed to save category metadata. ' + error.message, 'error');
    return;
  }

  // Ensure we have a stable product id to create a dedicated Dropbox folder
  const productId = editProductId || `product-${Date.now()}`;

  if (imageFile) {
    try {
      showMessage('Uploading image to Dropbox...', 'success');
      image = await uploadFileToDropbox(imageFile, productId);
    } catch (error) {
      console.error(error);
      showMessage('Unable to upload image to Dropbox. ' + error.message, 'error');
      return;
    }
  }

  if (supportImageFileList.length) {
    try {
      showMessage('Uploading support images to Dropbox...', 'success');
      for (const file of supportImageFileList) {
        const uploaded = await uploadFileToDropbox(file, productId);
        if (uploaded) supportImages.push(uploaded);
      }
    } catch (error) {
      console.error(error);
      showMessage('Unable to upload support images to Dropbox. ' + error.message, 'error');
      return;
    }
  }

  if (videoFile && !video) {
    try {
      showMessage('Uploading video to Dropbox...', 'success');
      video = await uploadFileToDropbox(videoFile, productId);
    } catch (error) {
      console.error(error);
      showMessage('Unable to upload video to Dropbox. ' + error.message, 'error');
      return;
    }
  }

  if (!image) {
    showMessage('Provide an image URL or choose a file.', 'error');
    return;
  }

  const productData = {
    id: productId,
    name,
    category,
    description,
    price,
    image,
    supportImages,
    video: video || '',
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveProductToFirebase(productData);
  } catch (error) {
    console.error('Firebase save failed', error);
    showMessage('Failed to save product metadata to Firebase. ' + error.message, 'error');
    return;
  }

  await loadProducts();
  saveProducts();
  renderAdminProducts();
  showMessage(editProductId ? 'Product updated successfully.' : 'New product added to inventory.', 'success');
  clearForm();
}

function openAuthPage() {
  window.location.href = 'auth.html?returnTo=admin.html';
}

adminLoginButton.addEventListener('click', openAuthPage);
adminSwitchButton.addEventListener('click', () => {
  clearCurrentUser();
  openAuthPage();
});
if (dropboxAuthBtn) {
  dropboxAuthBtn.addEventListener('click', () => {
    initiateOAuthLogin(window.location.href);
  });
}
adminLogoutBtn.addEventListener('click', () => {
  clearCurrentUser();
  toggleAdminDashboard();
  showMessage('Signed out of admin dashboard.', 'success');
});

adminProductForm.addEventListener('submit', handleProductForm);
clearAdminForm.addEventListener('click', clearForm);
if (addCategoryBtn) {
  addCategoryBtn.addEventListener('click', async () => {
    const categoryName = newCategoryName ? newCategoryName.value.trim() : '';
    if (!categoryName) {
      showMessage('Enter a category name before adding it.', 'error');
      return;
    }

    try {
      const saved = await addCategoryToFirebase(categoryName);
      if (saved) {
        newCategoryName.value = '';
        showMessage(`Category added: ${saved}`, 'success');
      }
    } catch (error) {
      console.error('Failed to add category', error);
      showMessage('Failed to add category. ' + error.message, 'error');
    }
  });
}

async function initializeAdmin() {
  await loadCategories();
  refreshCategoryOptions();
  await loadProducts();
  toggleAdminDashboard();
}

initializeAdmin();
