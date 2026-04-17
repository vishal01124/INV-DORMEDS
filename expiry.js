/* =====================================================
   DORMEDS – Pharmacy Expiry Alerts Page
   ===================================================== */

const PharmacyExpiry = (() => {
  function getPharmId() { return Auth.getUser().pharmacyId || 'p1'; }

  function render() {
    const drugs = Store.where('drugs', 'pharmacyId', getPharmId());
    const expired = drugs.filter(d => Utils.daysUntil(d.expiry) < 0);
    const critical = drugs.filter(d => { const d2 = Utils.daysUntil(d.expiry); return d2 >= 0 && d2 <= 30; });
    const warning = drugs.filter(d => { const d2 = Utils.daysUntil(d.expiry); return d2 > 30 && d2 <= 90; });
    const safe = drugs.filter(d => Utils.daysUntil(d.expiry) > 90);

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Expiry Alerts</h1>
            <p>Monitor drug expiry dates and take timely action.</p>
          </div>
          <button class="btn btn-danger" onclick="PharmacyExpiry.markDisposal()" ${expired.length===0?'disabled':''}>
            <i data-lucide="trash-2"></i> Dispose Expired (${expired.length})
          </button>
        </div>

        <!-- Alert Summary -->
        ${expired.length > 0 ? `<div class="alert alert-danger"><i data-lucide="skull"></i><div><strong>${expired.length} drug(s) are past their expiry date!</strong> These must be removed immediately to comply with drug regulations.</div></div>` : ''}

        <!-- KPIs -->
        <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:var(--sp-6)">
          <div class="kpi-card danger"><div class="kpi-icon danger"><i data-lucide="x-circle"></i></div><div class="kpi-body"><div class="kpi-value">${expired.length}</div><div class="kpi-label">Expired</div></div></div>
          <div class="kpi-card warning"><div class="kpi-icon warning"><i data-lucide="alert-triangle"></i></div><div class="kpi-body"><div class="kpi-value">${critical.length}</div><div class="kpi-label">≤30 Days</div></div></div>
          <div class="kpi-card info"><div class="kpi-icon info"><i data-lucide="clock"></i></div><div class="kpi-body"><div class="kpi-value">${warning.length}</div><div class="kpi-label">31–90 Days</div></div></div>
          <div class="kpi-card success"><div class="kpi-icon success"><i data-lucide="check-circle-2"></i></div><div class="kpi-body"><div class="kpi-value">${safe.length}</div><div class="kpi-label">Safe</div></div></div>
        </div>

        <!-- Chart -->
        <div class="chart-card" style="margin-bottom:var(--sp-5)">
          <div class="chart-header"><div class="chart-title">Expiry Distribution</div></div>
          <div class="chart-canvas-wrap" style="height:200px"><canvas id="expiry-chart"></canvas></div>
        </div>

        <!-- Table -->
        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">Expiry Status — All Drugs</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search…" oninput="Utils.filterTable('expiry-table',this.value)" />
              </div>
              <select onchange="PharmacyExpiry.filterLevel(this.value)" style="width:auto">
                <option value="">All</option>
                <option value="expired">Expired</option>
                <option value="critical">≤30 days</option>
                <option value="warning">31–90 days</option>
                <option value="safe">Safe</option>
              </select>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="expiry-table">
            <thead>
              <tr><th>Drug Name</th><th>Category</th><th>Stock</th><th>Expiry Date</th><th>Days Left</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>${buildRows(drugs)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    drawChart(expired.length, critical.length, warning.length, safe.length);
  }

  function buildRows(drugs) {
    if (!drugs.length) return `<tr><td colspan="7"><div class="table-empty"><p>No drugs found.</p></div></td></tr>`;
    // Sort: expired first, then by days remaining ascending
    const sorted = [...drugs].sort((a,b) => Utils.daysUntil(a.expiry) - Utils.daysUntil(b.expiry));
    return sorted.map(d => {
      const days = Utils.daysUntil(d.expiry);
      const exp = Utils.expiryStatus(d.expiry);
      return `
        <tr data-level="${days<0?'expired':days<=30?'critical':days<=90?'warning':'safe'}">
          <td style="font-weight:600">${Utils.esc(d.name)}</td>
          <td><span class="badge-pill badge-info">${Utils.esc(d.category)}</span></td>
          <td>${d.qty}</td>
          <td>${Utils.date(d.expiry)}</td>
          <td><span class="${exp.cls}">${days < 0 ? 'Expired' : days + ' days'}</span></td>
          <td><span class="badge-pill ${exp.badge}">${days < 0 ? 'Expired' : days <= 30 ? 'Critical' : days <= 90 ? 'Warning' : 'Safe'}</span></td>
          <td>
            ${days <= 0 ? `<button class="btn btn-sm btn-danger" onclick="PharmacyExpiry.dispose('${d.id}')"><i data-lucide="trash-2"></i> Dispose</button>` : 
              days <= 30 ? `<button class="btn btn-sm btn-warning" onclick="PharmacyExpiry.markSale('${d.id}')"><i data-lucide="tag"></i> Flag for Sale</button>` : '—'}
          </td>
        </tr>
      `;
    }).join('');
  }

  function drawChart(exp, crit, warn, safe) {
    const ctx = document.getElementById('expiry-chart');
    if (!ctx) return;
    const theme = document.documentElement.getAttribute('data-theme');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Expired', '≤30 Days', '31–90 Days', 'Safe (>90 Days)'],
        datasets: [{
          data: [exp, crit, warn, safe],
          backgroundColor: ['#ef4444','#f59e0b','#3b82f6','#10b981'],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: theme==='dark'?'#94a3b8':'#64748b', font: { size: 11 } } },
          y: { grid: { color: theme==='dark'?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)' }, ticks: { color: theme==='dark'?'#94a3b8':'#64748b', stepSize: 1 } }
        }
      }
    });
  }

  function filterLevel(val) {
    const rows = document.querySelectorAll('#expiry-table tbody tr');
    rows.forEach(r => { r.style.display = !val || r.dataset.level === val ? '' : 'none'; });
  }

  function dispose(id) {
    const d = Store.find('drugs', id);
    Utils.confirm(`Remove "${d.name}" from inventory (expired)? This action cannot be undone.`, () => {
      Store.remove('drugs', id);
      Toast.success('Drug disposed', d.name + ' removed from inventory.');
      render();
    });
  }

  function markDisposal() {
    const drugs = Store.where('drugs', 'pharmacyId', getPharmId());
    const expired = drugs.filter(d => Utils.daysUntil(d.expiry) < 0);
    Utils.confirm(`Dispose all ${expired.length} expired drug(s)? This cannot be undone.`, () => {
      expired.forEach(d => Store.remove('drugs', d.id));
      Toast.success('All expired drugs disposed', `${expired.length} item(s) removed.`);
      render();
    });
  }

  function markSale(id) {
    Toast.info('Flagged for sale', 'Drug has been flagged for discounted sale due to near expiry.');
  }

  return { render, filterLevel, dispose, markDisposal, markSale };
})();
