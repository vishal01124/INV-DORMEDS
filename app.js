/* =====================================================
   DORMEDS – App Router & Shell
   ===================================================== */

const App = (() => {
  /* ---- Navigation config ---- */
  const NAV = {
    admin: [
      { label: 'Main', type: 'section' },
      { route: 'admin-dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { route: 'admin-pharmacies', label: 'Pharmacies', icon: 'building-2' },
      { route: 'admin-users', label: 'Users', icon: 'users' },
      { label: 'Finance', type: 'section' },
      { route: 'admin-subscriptions', label: 'Subscriptions', icon: 'credit-card' },
      { route: 'admin-revenue', label: 'Revenue', icon: 'trending-up' },
      { label: 'Help', type: 'section' },
      { route: 'admin-support', label: 'Support Tickets', icon: 'headphones' },
    ],
    pharmacy: [
      { label: 'Main', type: 'section' },
      { route: 'pharmacy-dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { route: 'pharmacy-inventory', label: 'Inventory', icon: 'package' },
      { route: 'pharmacy-orders', label: 'Orders', icon: 'shopping-cart' },
      { label: 'Documents', type: 'section' },
      { route: 'pharmacy-documents', label: 'Prescriptions', icon: 'file-text' },
      { route: 'pharmacy-billing', label: 'Billing', icon: 'receipt' },
      { route: 'pharmacy-returns', label: 'Returns', icon: 'refresh-ccw' },
      { label: 'Alerts', type: 'section' },
      { route: 'pharmacy-expiry', label: 'Expiry Alerts', icon: 'alert-triangle' },
      { route: 'pharmacy-support', label: 'Support', icon: 'headphones' },
    ],
  };

  /* ---- Page registry ---- */
  const PAGES = {
    'admin-dashboard':     () => AdminDashboard.render(),
    'admin-pharmacies':    () => AdminPharmacies.render(),
    'admin-users':         () => AdminUsers.render(),
    'admin-subscriptions': () => AdminSubscriptions.render(),
    'admin-revenue':       () => AdminRevenue.render(),
    'admin-support':       () => AdminSupport.render(),
    'pharmacy-dashboard':  () => PharmacyDashboard.render(),
    'pharmacy-inventory':  () => PharmacyInventory.render(),
    'pharmacy-orders':     () => PharmacyOrders.render(),
    'pharmacy-documents':  () => PharmacyDocuments.render(),
    'pharmacy-billing':    () => PharmacyBilling.render(),
    'pharmacy-returns':    () => PharmacyReturns.render(),
    'pharmacy-expiry':     () => PharmacyExpiry.render(),
    'pharmacy-support':    () => PharmacySupport.render(),
  };

  const PAGE_TITLES = {
    'admin-dashboard': 'Dashboard',
    'admin-pharmacies': 'Pharmacies',
    'admin-users': 'Users',
    'admin-subscriptions': 'Subscriptions',
    'admin-revenue': 'Revenue',
    'admin-support': 'Support Tickets',
    'pharmacy-dashboard': 'Dashboard',
    'pharmacy-inventory': 'Inventory',
    'pharmacy-orders': 'Orders',
    'pharmacy-documents': 'Prescriptions',
    'pharmacy-billing': 'Billing',
    'pharmacy-returns': 'Returns',
    'pharmacy-expiry': 'Expiry Alerts',
    'pharmacy-support': 'Support',
  };

  let currentRoute = null;
  let currentUser = null;

  /* ---- Theme ---- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Store.setting('theme', theme);
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    const loginIcon = document.getElementById('theme-icon-login');
    if (icon) { icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon'); lucide.createIcons(); }
    if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    if (loginIcon) { loginIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon'); lucide.createIcons(); }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ---- Sidebar ---- */
  function buildSidebar(user) {
    const nav = document.getElementById('sidebar-nav');
    const items = NAV[user.role] || [];
    nav.innerHTML = items.map(item => {
      if (item.type === 'section') return `<p class="nav-section-label">${item.label}</p>`;
      return `<button class="nav-item" data-route="${item.route}" onclick="App.navigate('${item.route}')">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
      </button>`;
    }).join('');
    lucide.createIcons();
  }

  function setActiveNav(route) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  /* ---- Modal ---- */
  function openModal(content, size = '') {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    const contentEl = document.getElementById('modal-content');
    overlay.classList.remove('hidden');
    contentEl.innerHTML = content;
    if (size) box.style.maxWidth = size;
    else box.style.maxWidth = '';
    lucide.createIcons();
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
  }

  /* ---- Navigate ---- */
  function navigate(route) {
    // Auth guard
    if (!Auth.isLoggedIn()) { showLogin(); return; }

    // Role guard
    const user = Auth.getUser();
    if (route.startsWith('admin-') && user.role !== 'admin') {
      Toast.error('Access Denied', 'You do not have permission to view this page.');
      return;
    }
    if (route.startsWith('pharmacy-') && user.role !== 'pharmacy') {
      Toast.error('Access Denied', 'You do not have permission to view this page.');
      return;
    }

    currentRoute = route;
    window.location.hash = route;

    // Update title
    const title = PAGE_TITLES[route] || 'Page';
    document.getElementById('page-title').textContent = title;
    document.getElementById('breadcrumb').textContent = `Home / ${title}`;

    // Active nav
    setActiveNav(route);

    // Render page
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    closeSidebar();

    // Small delay for visual feedback
    setTimeout(() => {
      content.innerHTML = '';
      const renderer = PAGES[route];
      if (renderer) {
        renderer();
        content.firstElementChild && content.firstElementChild.classList.add('page-enter');
      } else {
        content.innerHTML = `<div class="table-empty"><p>Page not found.</p></div>`;
      }
      lucide.createIcons();
    }, 150);
  }

  /* ---- Sidebar toggle ---- */
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  }

  /* ---- Show Login ---- */
  function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-layout').classList.add('hidden');
  }

  /* ---- Show App ---- */
  function showApp(user) {
    currentUser = user;
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-layout').classList.remove('hidden');

    // Set user info in sidebar
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    document.getElementById('sidebar-avatar').textContent = initial;
    document.getElementById('sidebar-username').textContent = user.name;
    document.getElementById('sidebar-role').textContent = user.role === 'admin' ? 'Administrator' : 'Pharmacy Manager';
    document.getElementById('top-avatar').textContent = initial;
    document.getElementById('top-username').textContent = user.name.split(' ')[0];

    buildSidebar(user);

    // Navigate to default page
    const hash = window.location.hash.replace('#', '');
    const defaultRoute = user.role === 'admin' ? 'admin-dashboard' : 'pharmacy-dashboard';
    navigate(hash && PAGES[hash] ? hash : defaultRoute);
  }

  /* ---- Init ---- */
  function init() {
    // Apply saved theme
    const savedTheme = Store.setting('theme') || 'dark';
    applyTheme(savedTheme);

    // Check auth
    if (Auth.isLoggedIn()) {
      showApp(Auth.getUser());
    } else {
      showLogin();
    }

    /* --- Event Listeners --- */
    // Login form
    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      let valid = true;

      document.getElementById('email-error').textContent = '';
      document.getElementById('password-error').textContent = '';

      if (!username) { document.getElementById('email-error').textContent = 'Please enter your username.'; valid = false; }
      if (!password) { document.getElementById('password-error').textContent = 'Please enter your password.'; valid = false; }
      if (!valid) return;

      const btn = document.getElementById('login-btn');
      btn.querySelector('.btn-text').classList.add('hidden');
      btn.querySelector('.btn-loader').classList.remove('hidden');
      btn.disabled = true;

      setTimeout(() => {
        const user = Auth.login(username, password);
        btn.querySelector('.btn-text').classList.remove('hidden');
        btn.querySelector('.btn-loader').classList.add('hidden');
        btn.disabled = false;

        if (user) {
          Toast.success('Welcome back!', `Signed in as ${user.name}`);
          showApp(user);
        } else {
          document.getElementById('email-error').textContent = 'Invalid credentials. Please try again.';
          Toast.error('Login failed', 'Invalid username or password.');
        }
      }, 800);
    });

    // Password toggle
    document.getElementById('toggle-password').addEventListener('click', () => {
      const input = document.getElementById('login-password');
      const icon = document.getElementById('eye-icon');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });

    // Theme toggles
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-login').addEventListener('click', toggleTheme);

    // Sidebar
    document.getElementById('menu-toggle').addEventListener('click', openSidebar);
    document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.logout();
      Toast.info('Signed out', 'You have been logged out successfully.');
      setTimeout(showLogin, 500);
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    // Hash navigation
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && PAGES[hash] && Auth.isLoggedIn()) navigate(hash);
    });

    // Escape closes modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  return { init, navigate, openModal, closeModal, toggleTheme, getCurrentUser: () => currentUser };
})();

/* Bootstrap */
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  App.init();
});
