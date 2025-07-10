// Firebase config and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBgfjHkHWXa-J6DWHQX224XKbw3XGUVUfQ",
  authDomain: "jak-stationary.firebaseapp.com",
  projectId: "jak-stationary",
  storageBucket: "jak-stationary.firebasestorage.app",
  messagingSenderId: "420352393801",
  appId: "1:420352393801:web:82402e02f1ec2a9e26b598",
  measurementId: "G-QX2V6TR6PH"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global state
let currentUser = null;
let currentUserData = null;
let isAdmin = false;

// UI Elements
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const userDisplay = document.getElementById('userDisplay');
const adminLoginForm = document.getElementById('adminLoginForm');
const userLoginForm = document.getElementById('userLoginForm');
const createUserForm = document.getElementById('createUserForm');
const adminUsersNav = document.getElementById('adminUsersNav');
const adminNotificationsNav = document.getElementById('adminNotificationsNav');
const userConfirmationsNav = document.getElementById('userConfirmationsNav');
const userSalesNav = document.getElementById('userSalesNav');

// Helper: Format phone number to E.164 (for Ghana)
function formatPhone(phone) {
  let p = phone.trim();
  if (p.startsWith('0')) p = '+233' + p.slice(1);
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

// Admin Login
adminLoginForm.onsubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  adminLoginForm.querySelector('button[type="submit"]').disabled = true;
  adminLoginForm.querySelector('button[type="submit"]').textContent = 'Signing in...';
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const user = result.user;
    // Get admin info from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') throw new Error('Not an admin account');
    currentUser = { uid: user.uid, ...userDoc.data() };
    currentUserData = userDoc.data();
    isAdmin = true;
    showMainApp();
    showToast('Admin login successful!', 'success');
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
  adminLoginForm.querySelector('button[type="submit"]').disabled = false;
  adminLoginForm.querySelector('button[type="submit"]').textContent = 'Sign In as Admin';
};

// User Login
userLoginForm.onsubmit = async function(e) {
  e.preventDefault();
  const phone = document.getElementById('userPhone').value.trim();
  const password = document.getElementById('userPassword').value;
  userLoginForm.querySelector('button[type="submit"]').disabled = true;
  userLoginForm.querySelector('button[type="submit"]').textContent = 'Signing in...';
  try {
    const formattedPhone = formatPhone(phone);
    const usersSnap = await db.collection('users').where('phone', '==', formattedPhone).where('role', '==', 'user').get();
    if (usersSnap.empty) throw new Error('User not found');
    let userDoc = null;
    usersSnap.forEach(doc => userDoc = doc);
    const userData = userDoc.data();
    if (btoa(password) !== userData.password) throw new Error('Incorrect password');
    currentUser = { uid: userDoc.id, ...userData };
    currentUserData = userData;
    isAdmin = false;
    showMainApp();
    showToast('User login successful!', 'success');
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
  userLoginForm.querySelector('button[type="submit"]').disabled = false;
  userLoginForm.querySelector('button[type="submit"]').textContent = 'Sign In as User';
};

function showMainApp() {
  authScreen.classList.add('d-none');
  mainApp.classList.remove('d-none');
  userDisplay.textContent = currentUserData.name + (isAdmin ? ' (Admin)' : '');
  
  if (isAdmin) {
    adminUsersNav.classList.remove('d-none');
    adminNotificationsNav.classList.remove('d-none');
    userConfirmationsNav.classList.add('d-none');
    userSalesNav.classList.add('d-none');
    document.getElementById('adminUsersCard').style.display = '';
    document.getElementById('addItemBtn').classList.remove('d-none'); // Show Add Item button for admin
  } else {
    adminUsersNav.classList.add('d-none');
    adminNotificationsNav.classList.add('d-none');
    userConfirmationsNav.classList.remove('d-none');
    userSalesNav.classList.remove('d-none');
    document.getElementById('adminUsersCard').style.display = 'none';
    document.getElementById('addItemBtn').classList.add('d-none'); // Hide Add Item button for users
  }
  
  updateDashboard();
  updateNotificationBadges();
  showSection('dashboard');
}

function logout() {
  currentUser = null;
  currentUserData = null;
  isAdmin = false;
  mainApp.classList.add('d-none');
  authScreen.classList.remove('d-none');
  adminLoginForm.reset();
  userLoginForm.reset();
  createUserForm.reset();
}

// Section navigation
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('d-none');
  });
  document.getElementById(sectionName).classList.remove('d-none');
  
  if (sectionName === 'dashboard') updateDashboard();
  if (sectionName === 'items') updateItemsTable();
  if (sectionName === 'users' && isAdmin) updateUsersTable();
  if (sectionName === 'notifications' && isAdmin) updateNotifications();
  if (sectionName === 'confirmations' && !isAdmin) updateConfirmations();
  if (sectionName === 'sales' && !isAdmin) updateSalesTable();
}

// Dashboard
async function updateDashboard() {
  // Total items
  const itemsSnap = await db.collection('items').get();
  document.getElementById('totalItems').textContent = itemsSnap.size;
  
  // My items
  let myItemsCount = 0;
  itemsSnap.forEach(doc => {
    if (doc.data().userId === currentUser.uid) myItemsCount++;
  });
  document.getElementById('myItems').textContent = myItemsCount;
  
  // Total users (admin only)
  if (isAdmin) {
    const usersSnap = await db.collection('users').where('role', '==', 'user').get();
    document.getElementById('totalUsers').textContent = usersSnap.size;
  }
  
  // Recent items
  const recentItemsList = document.getElementById('recentItemsList');
  let items = [];
  itemsSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  
  if (items.length === 0) {
    recentItemsList.innerHTML = '<p class="text-muted">No items yet</p>';
  } else {
    recentItemsList.innerHTML = items.slice(0, 5).map(item => `
      <div class="mb-2">
        <strong>${item.name}</strong> (${item.quantity}) - GH₵${item.price.toFixed(2)}<br>
        <small>By: ${item.userName} | ${new Date(item.createdAt?.seconds*1000).toLocaleString()}</small>
      </div>
    `).join('');
  }
}

// Update notification badges
async function updateNotificationBadges() {
  if (isAdmin) {
    // Count declined items for admin
    const declinedSnap = await db.collection('itemConfirmations').where('status', '==', 'declined').get();
    const badge = document.getElementById('adminNotificationBadge');
    if (declinedSnap.size > 0) {
      badge.textContent = declinedSnap.size;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  } else {
    // Count unconfirmed admin items for users
    const itemsSnap = await db.collection('items').get();
    let unconfirmedCount = 0;
    
    for (const doc of itemsSnap.docs) {
      const item = doc.data();
      
      // Only count admin items
      const userDoc = await db.collection('users').doc(item.userId).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        continue; // Skip non-admin items
      }
      
      // Skip items posted by current user
      if (item.userId === currentUser.uid) {
        continue;
      }
      
      const confirmationSnap = await db.collection('itemConfirmations')
        .where('itemId', '==', doc.id)
        .where('userId', '==', currentUser.uid)
        .get();
      
      if (confirmationSnap.empty) {
        unconfirmedCount++;
      }
    }
    
    const badge = document.getElementById('userConfirmationBadge');
    if (unconfirmedCount > 0) {
      badge.textContent = unconfirmedCount;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Add item modal
function showAddItemModal() {
  // Only admin can add items
  if (!isAdmin) {
    showToast('Only admin can add items', 'error');
    return;
  }
  
  const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
  document.getElementById('addItemForm').reset();
  modal.show();
}

// Add item
async function addItem() {
  // Only admin can add items
  if (!isAdmin) {
    showToast('Only admin can add items', 'error');
    return;
  }
  
  const name = document.getElementById('itemName').value.trim();
  const quantity = parseInt(document.getElementById('itemQuantity').value);
  const price = parseFloat(document.getElementById('itemPrice').value);
  
  if (!name || isNaN(quantity) || isNaN(price)) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  try {
    await db.collection('items').add({
      name,
      quantity,
      price,
      userId: currentUser.uid,
      userName: currentUserData.name,
      userPhone: currentUserData.phone || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('Item added!', 'success');
    updateItemsTable();
    updateDashboard();
    updateNotificationBadges();
    bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
  } catch (err) {
    showToast('Failed to add item: ' + err.message, 'error');
  }
}

// Items table
async function updateItemsTable() {
  const tbody = document.getElementById('itemsTable');
  let itemsSnap;
  
  try {
    if (isAdmin) {
      // Admin sees all items
      itemsSnap = await db.collection('items').get();
    } else {
      // Users only see items posted by admin (not by other users)
      // Get all items and filter out those posted by users
      const allItemsSnap = await db.collection('items').get();
      let adminItems = [];
      
      for (const doc of allItemsSnap.docs) {
        const item = doc.data();
        // Check if the item was posted by an admin user
        const userDoc = await db.collection('users').doc(item.userId).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
          adminItems.push({ id: doc.id, ...item });
        }
      }
      
      // Create a mock snapshot for admin items
      itemsSnap = {
        size: adminItems.length,
        forEach: (callback) => adminItems.forEach(callback)
      };
    }
    
    let rows = '';
    let items = [];
    
    itemsSnap.forEach(doc => {
      const item = doc.data ? doc.data() : doc; // Handle both real docs and our mock items
      items.push({ id: doc.id, ...item });
    });
    
    // Sort items by createdAt if available
    items.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    // For each item, calculate sales
    for (let item of items) {
      const salesSnap = await db.collection('sales')
        .where('itemId', '==', item.id)
        .get();
      
      let totalSold = 0;
      salesSnap.forEach(doc => {
        totalSold += doc.data().quantity;
      });
      
      const itemsLeft = item.quantity - totalSold;
      
      rows += `<tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>GH₵${item.price.toFixed(2)}</td>
        <td>${item.userName}</td>
        <td>${item.createdAt ? new Date(item.createdAt.seconds*1000).toLocaleString() : ''}</td>
        <td>
          <span class="badge bg-success">${totalSold} sold</span>
          <span class="badge bg-info">${itemsLeft} left</span>
          ${isAdmin ? `<button class="btn btn-sm btn-danger ms-2" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>` : ''}
        </td>
      </tr>`;
    }
    
    tbody.innerHTML = rows || '<tr><td colspan="6" class="text-center text-muted">No items found</td></tr>';
  } catch (error) {
    console.error('Error loading items:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading items</td></tr>';
  }
}

// Delete item
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  try {
    await db.collection('items').doc(id).delete();
    showToast('Item deleted!', 'success');
    updateItemsTable();
    updateDashboard();
  } catch (err) {
    showToast('Failed to delete item: ' + err.message, 'error');
  }
}

// Admin: Show create user modal
function showCreateUserModal() {
  const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
  createUserForm.reset();
  modal.show();
}

// Admin: Create user
async function createUser() {
  const name = document.getElementById('newUserName').value.trim();
  const phone = document.getElementById('newUserPhone').value.trim();
  const password = document.getElementById('newUserPassword').value;
  
  if (!name || !phone || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  try {
    // Check if user already exists
    const formattedPhone = formatPhone(phone);
    const usersSnap = await db.collection('users').where('phone', '==', formattedPhone).get();
    if (!usersSnap.empty) {
      showToast('A user with this phone already exists.', 'error');
      return;
    }
    
    await db.collection('users').add({
      name,
      phone: formattedPhone,
      password: btoa(password),
      role: 'user',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('User created!', 'success');
    updateUsersTable();
    bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
  } catch (err) {
    showToast('Failed to create user: ' + err.message, 'error');
  }
}

// Admin: List users
async function updateUsersTable() {
  const tbody = document.getElementById('usersTable');
  
  try {
    const usersSnap = await db.collection('users').where('role', '==', 'user').get();
    
    let rows = '';
    usersSnap.forEach(doc => {
      const user = doc.data();
      rows += `<tr>
        <td>${user.name}</td>
        <td>${user.phone}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="showResetPasswordModal('${doc.id}', '${user.name}')"><i class="fas fa-key"></i> Reset Password</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${doc.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    });
    
    tbody.innerHTML = rows || '<tr><td colspan="3" class="text-center text-muted">No users found</td></tr>';
  } catch (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error loading users</td></tr>';
  }
}

// Admin: Delete user
async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    await db.collection('users').doc(id).delete();
    showToast('User deleted!', 'success');
    updateUsersTable();
  } catch (err) {
    showToast('Failed to delete user: ' + err.message, 'error');
  }
}

// Admin: Reset user password
function showResetPasswordModal(userId, userName) {
  const newPassword = prompt(`Enter new password for ${userName}:`);
  if (!newPassword) return;
  resetUserPassword(userId, newPassword);
}

async function resetUserPassword(userId, newPassword) {
  try {
    await db.collection('users').doc(userId).update({ password: btoa(newPassword) });
    showToast('Password reset!', 'success');
  } catch (err) {
    showToast('Failed to reset password: ' + err.message, 'error');
  }
}

// Admin: Notifications
async function updateNotifications() {
  const declinedItemsList = document.getElementById('declinedItemsList');
  const declinedSnap = await db.collection('itemConfirmations')
    .where('status', '==', 'declined')
    .orderBy('createdAt', 'desc')
    .get();
  
  if (declinedSnap.empty) {
    declinedItemsList.innerHTML = '<p class="text-muted">No declined items</p>';
  } else {
    let html = '';
    for (const doc of declinedSnap.docs) {
      const confirmation = doc.data();
      const itemSnap = await db.collection('items').doc(confirmation.itemId).get();
      const userSnap = await db.collection('users').doc(confirmation.userId).get();
      
      if (itemSnap.exists && userSnap.exists) {
        const item = itemSnap.data();
        const user = userSnap.data();
        html += `
          <div class="card mb-3">
            <div class="card-body">
              <h6 class="card-title">${item.name}</h6>
              <p class="card-text">
                <strong>Original:</strong> ${item.quantity} units at GH₵${item.price.toFixed(2)}<br>
                <strong>Declined by:</strong> ${user.name} (${user.phone})<br>
                <strong>Comment:</strong> ${confirmation.comment}<br>
                <strong>Date:</strong> ${new Date(confirmation.createdAt.seconds*1000).toLocaleString()}
              </p>
            </div>
          </div>
        `;
      }
    }
    declinedItemsList.innerHTML = html;
  }
}

// User: Confirmations
async function updateConfirmations() {
  const itemsToConfirmList = document.getElementById('itemsToConfirmList');
  const itemsSnap = await db.collection('items').get();
  
  let unconfirmedItems = [];
  
  for (const doc of itemsSnap.docs) {
    const item = doc.data();
    
    // Only show admin items for confirmation
    const userDoc = await db.collection('users').doc(item.userId).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      continue; // Skip non-admin items
    }
    
    // Skip items posted by current user
    if (item.userId === currentUser.uid) {
      continue;
    }
    
    const confirmationSnap = await db.collection('itemConfirmations')
      .where('itemId', '==', doc.id)
      .where('userId', '==', currentUser.uid)
      .get();
    
    if (confirmationSnap.empty) {
      unconfirmedItems.push({ id: doc.id, ...item });
    }
  }
  
  if (unconfirmedItems.length === 0) {
    itemsToConfirmList.innerHTML = '<p class="text-muted">No items to confirm</p>';
  } else {
    itemsToConfirmList.innerHTML = unconfirmedItems.map(item => `
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-title">${item.name}</h6>
          <p class="card-text">
            <strong>Quantity:</strong> ${item.quantity}<br>
            <strong>Price:</strong> GH₵${item.price.toFixed(2)}<br>
            <strong>Posted by:</strong> ${item.userName}<br>
            <strong>Date:</strong> ${new Date(item.createdAt.seconds*1000).toLocaleString()}
          </p>
          <button class="btn btn-primary btn-sm" onclick="showConfirmItemModal('${item.id}')">
            <i class="fas fa-check me-1"></i>Confirm/Decline
          </button>
        </div>
      </div>
    `).join('');
  }
}

// Show confirm item modal
function showConfirmItemModal(itemId) {
  db.collection('items').doc(itemId).get().then(doc => {
    if (doc.exists) {
      const item = doc.data();
      document.getElementById('confirmItemName').value = item.name;
      document.getElementById('confirmItemQuantity').value = item.quantity;
      document.getElementById('confirmItemPrice').value = item.price;
      document.getElementById('confirmItemForm').setAttribute('data-item-id', itemId);
      
      const modal = new bootstrap.Modal(document.getElementById('confirmItemModal'));
      modal.show();
    }
  });
}

// Handle confirm action change
document.getElementById('confirmAction').addEventListener('change', function() {
  const commentSection = document.getElementById('commentSection');
  if (this.value === 'decline') {
    commentSection.style.display = 'block';
    document.getElementById('confirmComment').required = true;
  } else {
    commentSection.style.display = 'none';
    document.getElementById('confirmComment').required = false;
  }
});

// Confirm/decline item
async function confirmItem() {
  const itemId = document.getElementById('confirmItemForm').getAttribute('data-item-id');
  const action = document.getElementById('confirmAction').value;
  const comment = document.getElementById('confirmComment').value;
  
  if (!action) {
    showToast('Please select an action', 'error');
    return;
  }
  
  if (action === 'decline' && !comment.trim()) {
    showToast('Please provide a comment when declining', 'error');
    return;
  }
  
  try {
    await db.collection('itemConfirmations').add({
      itemId,
      userId: currentUser.uid,
      userName: currentUserData.name,
      status: action,
      comment: comment.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast(`Item ${action}ed successfully!`, 'success');
    updateConfirmations();
    updateNotificationBadges();
    bootstrap.Modal.getInstance(document.getElementById('confirmItemModal')).hide();
  } catch (err) {
    showToast('Failed to confirm item: ' + err.message, 'error');
  }
}

// User: Sales
async function updateSalesTable() {
  const tbody = document.getElementById('salesTable');
  
  try {
    const salesSnap = await db.collection('sales')
      .where('userId', '==', currentUser.uid)
      .get();
    
    let rows = '';
    let sales = [];
    
    salesSnap.forEach(doc => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date
    sales.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    sales.forEach(sale => {
      rows += `<tr>
        <td>${sale.itemName}</td>
        <td>${sale.quantity}</td>
        <td>GH₵${sale.price.toFixed(2)}</td>
        <td>GH₵${(sale.quantity * sale.price).toFixed(2)}</td>
        <td>${sale.createdAt ? new Date(sale.createdAt.seconds*1000).toLocaleString() : ''}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteSale('${sale.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    });
    
    tbody.innerHTML = rows || '<tr><td colspan="6" class="text-center text-muted">No sales found</td></tr>';
  } catch (error) {
    console.error('Error loading sales:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading sales</td></tr>';
  }
}

// Show add sale modal
function showAddSaleModal() {
  // Get items based on user type
  if (isAdmin) {
    // Admin can sell any items
    db.collection('items')
      .get()
      .then(itemsSnap => {
        if (itemsSnap.empty) {
          showToast('No items available for sale', 'error');
          return;
        }
        
        const select = document.getElementById('saleItemSelect');
        select.innerHTML = '<option value="">Choose an item...</option>';
        
        itemsSnap.forEach(doc => {
          const item = doc.data();
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = `${item.name} (${item.quantity} units, GH₵${item.price.toFixed(2)}) - Posted by ${item.userName}`;
          select.appendChild(option);
        });
        
        const modal = new bootstrap.Modal(document.getElementById('addSaleModal'));
        modal.show();
      })
      .catch(err => {
        showToast('Failed to load items: ' + err.message, 'error');
      });
  } else {
    // Users can only sell admin items
    db.collection('items')
      .get()
      .then(async (itemsSnap) => {
        if (itemsSnap.empty) {
          showToast('No items available for sale', 'error');
          return;
        }
        
        const select = document.getElementById('saleItemSelect');
        select.innerHTML = '<option value="">Choose an item...</option>';
        
        // Filter for admin items only
        for (const doc of itemsSnap.docs) {
          const item = doc.data();
          const userDoc = await db.collection('users').doc(item.userId).get();
          if (userDoc.exists && userDoc.data().role === 'admin') {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${item.name} (${item.quantity} units, GH₵${item.price.toFixed(2)}) - Posted by ${item.userName}`;
            select.appendChild(option);
          }
        }
        
        if (select.children.length <= 1) {
          showToast('No admin items available for sale', 'error');
          return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('addSaleModal'));
        modal.show();
      })
      .catch(err => {
        showToast('Failed to load items: ' + err.message, 'error');
      });
  }
}

// Add sale
async function addSale() {
  const itemId = document.getElementById('saleItemSelect').value;
  const quantity = parseInt(document.getElementById('saleQuantity').value);
  const price = parseFloat(document.getElementById('salePrice').value);
  
  if (!itemId || isNaN(quantity) || isNaN(price)) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  try {
    // Get item details
    const itemDoc = await db.collection('items').doc(itemId).get();
    if (!itemDoc.exists) {
      showToast('Item not found', 'error');
      return;
    }
    
    const item = itemDoc.data();
    
    // Check if quantity is available
    if (quantity > item.quantity) {
      showToast(`Only ${item.quantity} units available`, 'error');
      return;
    }
    
    await db.collection('sales').add({
      itemId,
      itemName: item.name,
      quantity,
      price,
      userId: currentUser.uid,
      userName: currentUserData.name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('Sale recorded!', 'success');
    updateSalesTable();
    updateItemsTable(); // Update items table to show new sold quantities
    bootstrap.Modal.getInstance(document.getElementById('addSaleModal')).hide();
  } catch (err) {
    showToast('Failed to record sale: ' + err.message, 'error');
  }
}

// Delete sale
async function deleteSale(id) {
  if (!confirm('Are you sure you want to delete this sale?')) return;
  
  try {
    await db.collection('sales').doc(id).delete();
    showToast('Sale deleted!', 'success');
    updateSalesTable();
  } catch (err) {
    showToast('Failed to delete sale: ' + err.message, 'error');
  }
}

// Toast notification system
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '1055';
  document.body.appendChild(container);
  return container;
} 