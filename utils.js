/* =====================================================
   DORMEDS – Utility Functions
   ===================================================== */

const Utils = {
  /* Format currency in INR */
  currency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  },

  /* Format date */
  date(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  /* Format datetime */
  datetime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  /* Time ago */
  timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  },

  /* Generate unique ID */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  /* Days until a date */
  daysUntil(dateStr) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  },

  /* Expiry status */
  expiryStatus(dateStr) {
    const days = Utils.daysUntil(dateStr);
    if (days < 0) return { label: 'Expired', cls: 'expiry-critical', badge: 'badge-danger' };
    if (days <= 30) return { label: `${days}d left`, cls: 'expiry-critical', badge: 'badge-danger' };
    if (days <= 90) return { label: `${days}d left`, cls: 'expiry-warning', badge: 'badge-warning' };
    return { label: Utils.date(dateStr), cls: 'expiry-ok', badge: 'badge-success' };
  },

  /* Escape HTML */
  esc(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  },

  /* Debounce */
  debounce(fn, delay = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },

  /* Filter table rows by search text */
  filterTable(tableId, query) {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    const q = query.toLowerCase();
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  /* Sort table */
  sortArray(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
      let va = a[key], vb = b[key];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  },

  /* Number animation */
  animateCount(el, target, duration = 800) {
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * ease).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /* Random int between min and max */
  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /* Generate barcode string */
  barcode() {
    return Array.from({length: 13}, () => Utils.rand(0,9)).join('');
  },

  /* Status badge HTML */
  statusBadge(status) {
    const map = {
      'active': 'badge-success',
      'inactive': 'badge-muted',
      'pending': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-danger',
      'processing': 'badge-info',
      'completed': 'badge-success',
      'open': 'badge-warning',
      'resolved': 'badge-success',
      'cancelled': 'badge-danger',
      'waived': 'badge-primary',
    };
    const cls = map[String(status).toLowerCase()] || 'badge-muted';
    return `<span class="badge-pill ${cls}">${Utils.esc(status)}</span>`;
  },

  /* Confirm dialog */
  confirm(message, onConfirm) {
    if (window.confirm(message)) onConfirm();
  },

  /* Today ISO */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /* Future date offset */
  futureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  /* Past date offset */
  pastDate(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  },

  /* Download content as file */
  download(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /* CSV from array of objects */
  toCSV(data) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  },

  /* Print element */
  printEl(el) {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>DORMEDS</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>body{font-family:Inter,sans-serif;padding:2rem;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} .badge-pill{padding:2px 8px;border-radius:9999px;font-size:12px;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }
};
