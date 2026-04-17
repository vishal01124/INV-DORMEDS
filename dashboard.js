/* =====================================================
   DORMEDS – Pharmacy Dashboard Page
   ===================================================== */

const PharmacyDashboard = (() => {
  function render() {
    const user = Auth.getUser();
    const pid = user.pharmacyId || 'p1';
    const drugs = Store.where('drugs', 'pharmacyId', pid);
    const orders = Store.where('orders', 'pharmacyId', pid);
    const today = Utils.today();
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const expiringSoon = drugs.filter(d => Utils.daysUntil(d.expiry) <= 30 && Utils.daysUntil(d.expiry) >= 0);
    const expired = drugs.filter(d => Utils.daysUntil(d.expiry) < 0);
    const lowStock = drugs.filter(d => d.qty <= d.lowStockAlert);
    const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);
    const pharm = Store.find('pharmacies', pid);

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Welcome, ${Utils.esc(user.name.split(' ')[0])}!</h1>
            <p>${Utils.esc(pharm ? pharm.name : '')} · ${today}</p>
          </div>
          <span class="badge-pill badge-success">● Open</span>
        </div>

        <!-- Alerts -->
        ${expired.length > 0 ? `<div class="alert alert-danger"><i data-lucide="alert-circle"></i><div><strong>${expired.length} drug(s) expired!</strong> Please remove them from inventory immediately.</div></div>` : ''}
        ${expiringSoon.length > 0 ? `<div class="alert alert-warning"><i data-lucide="clock"></i><div><strong>${expiringSoon.length} drug(s) expiring within 30 days.</strong> Review your expiry alerts.</div></div>` : ''}
        ${lowStock.length > 0 ? `<div class="alert alert-info"><i data-lucide="package"></i><div><strong>${lowStock.length} item(s) running low on stock.</strong> Consider restocking soon.</div></div>` : ''}

        <!-- KPIs -->
        <div class="kpi-grid">
          <div class="kpi-card primary">
            <div class="kpi-icon primary"><i data-lucide="package"></i></div>
            <div class="kpi-body">
              <div class="kpi-value" id="k-drugs">0</div>
              <div class="kpi-label">Total Drugs</div>
              <div class="kpi-change ${lowStock.length>0?'down':'up'}"><i data-lucide="${lowStock.length>0?'alert-triangle':'check'}" style="width:12px;height:12px"></i> ${lowStock.length} low stock</div>
            </div>
          </div>
          <div class="kpi-card warning">
            <div class="kpi-icon warning"><i data-lucide="shopping-cart"></i></div>
            <div class="kpi-body">
              <div class="kpi-value" id="k-orders">0</div>
              <div class="kpi-label">Today's Orders</div>
              <div class="kpi-change warning"><i data-lucide="clock" style="width:12px;height:12px"></i> ${pendingOrders.length} pending</div>
            </div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-icon danger"><i data-lucide="alert-triangle"></i></div>
            <div class="kpi-body">
              <div class="kpi-value" id="k-expiry">0</div>
              <div class="kpi-label">Expiring Soon</div>
              <div class="kpi-change down"><i data-lucide="calendar" style="width:12px;height:12px"></i> Within 30 days</div>
            </div>
          </div>
          <div class="kpi-card success">
            <div class="kpi-icon success"><i data-lucide="indian-rupee"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${Utils.currency(revenue)}</div>
              <div class="kpi-label">Total Revenue</div>
              <div class="kpi-change up"><i data-lucide="trending-up" style="width:12px;height:12px"></i> Completed orders</div>
            </div>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="grid-2">
          <!-- Recent Orders -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Orders</div>
              <button class="btn btn-sm btn-secondary" onclick="App.navigate('pharmacy-orders')">View All</button>
            </div>
            ${orders.length ? `
              <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
                ${orders.slice(0,5).map(o => `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-2) 0;border-bottom:1px solid var(--border)">
                    <div>
                      <div style="font-weight:600;font-size:var(--fs-sm)">${Utils.esc(o.patient)}</div>
                      <div style="font-size:var(--fs-xs);color:var(--text-muted)">${o.items.length} item(s) · ${Utils.timeAgo(o.createdAt)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:var(--sp-2)">
                      <span style="font-weight:700;font-size:var(--fs-sm)">${Utils.currency(o.total)}</span>
                      ${Utils.statusBadge(o.status)}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<div class="table-empty"><p>No orders yet.</p></div>'}
          </div>

          <!-- Quick Actions + Inventory Alerts -->
          <div style="display:flex;flex-direction:column;gap:var(--sp-5)">
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--sp-4)">Quick Actions</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)">
                <button class="btn btn-secondary" onclick="App.navigate('pharmacy-inventory')"><i data-lucide="plus"></i> Add Drug</button>
                <button class="btn btn-secondary" onclick="App.navigate('pharmacy-orders')"><i data-lucide="list"></i> View Orders</button>
                <button class="btn btn-secondary" onclick="App.navigate('pharmacy-billing')"><i data-lucide="receipt"></i> Billing</button>
                <button class="btn btn-secondary" onclick="App.navigate('pharmacy-documents')"><i data-lucide="upload"></i> Upload Rx</button>
              </div>
            </div>
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--sp-4)">Expiry Alerts</div>
              ${expiringSoon.length ? expiringSoon.slice(0,4).map(d => {
                const exp = Utils.expiryStatus(d.expiry);
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-2) 0;border-bottom:1px solid var(--border)">
                    <div style="font-size:var(--fs-sm)">${Utils.esc(d.name)}</div>
                    <span class="badge-pill ${exp.badge}">${exp.label}</span>
                  </div>
                `;
              }).join('') : '<p style="font-size:var(--fs-sm);color:var(--text-muted)">No drugs expiring soon. 🎉</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    setTimeout(() => {
      Utils.animateCount(document.getElementById('k-drugs'), drugs.length);
      Utils.animateCount(document.getElementById('k-orders'), todayOrders.length || orders.length);
      Utils.animateCount(document.getElementById('k-expiry'), expiringSoon.length + expired.length);
    }, 100);
  }

  return { render };
})();
