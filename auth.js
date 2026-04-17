/* =====================================================
   DORMEDS – Auth Module
   ===================================================== */

const Auth = (() => {
  const SESSION_KEY = 'dormeds_session';

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return {
    login(username, password) {
      const users = Store.get('users');
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) return null;
      const session = { id: user.id, name: user.name, role: user.role, username: user.username, email: user.email, pharmacyId: user.pharmacyId || null };
      setSession(session);
      return session;
    },

    logout() {
      clearSession();
    },

    getUser() {
      return getSession();
    },

    isLoggedIn() {
      return !!getSession();
    },

    hasRole(role) {
      const s = getSession();
      return s && s.role === role;
    },
  };
})();

/* --- Fill demo credentials from login page --- */
function fillDemo(role) {
  if (role === 'admin') {
    document.getElementById('login-email').value = 'admin';
    document.getElementById('login-password').value = 'admin123';
  } else {
    document.getElementById('login-email').value = 'pharmacy';
    document.getElementById('login-password').value = 'pharm123';
  }
  Toast.info('Demo credentials filled', 'Click Sign In to continue');
}
