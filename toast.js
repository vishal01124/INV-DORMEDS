/* =====================================================
   DORMEDS – Toast Notification System
   ===================================================== */

const Toast = (() => {
  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  };

  function show(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = Utils.uid();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = `toast-${id}`;
    toast.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <div class="toast-body">
        <div class="toast-title">${Utils.esc(title)}</div>
        ${message ? `<div class="toast-message">${Utils.esc(message)}</div>` : ''}
      </div>
      <button class="toast-close" onclick="Toast.dismiss('${id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;
    container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => Toast.dismiss(id), duration);
    }
    return id;
  }

  function dismiss(id) {
    const toast = document.getElementById(`toast-${id}`);
    if (!toast) return;
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 300);
  }

  return {
    success: (title, message, duration) => show('success', title, message, duration),
    error:   (title, message, duration) => show('error', title, message, duration),
    warning: (title, message, duration) => show('warning', title, message, duration),
    info:    (title, message, duration) => show('info', title, message, duration),
    dismiss,
  };
})();
