/* =====================================================
   DORMEDS – Pharmacy Orders Page
   ===================================================== */

const PharmacyOrders = (() => {
  let activeTab = 'pending';

  function getPharmId() { return Auth.getUser().pharmacyId || 'p1'; }

  function render() {
    const orders = Store.where('orders', 'pharmacyId', getPharmId());
    const counts = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
    };

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Orders</h1>
            <p>Manage and process incoming pharmacy orders.</p>
          </div>
          <button class="btn btn-primary" onclick="PharmacyOrders.openCreate()">
            <i data-lucide="plus"></i> New Order
          </button>
        </div>

        <div class="tabs" id="order-tabs">
          ${Object.entries(counts).map(([tab, cnt]) => `
            <button class="tab-btn${activeTab===tab?' active':''}" onclick="PharmacyOrders.switchTab('${tab}')">
              ${tab.charAt(0).toUpperCase()+tab.slice(1)}
              ${cnt > 0 ? `<span class="badge-pill badge-${tab==='pending'?'warning':tab==='processing'?'info':tab==='completed'?'success':'danger'}" style="margin-left:6px">${cnt}</span>` : ''}
            </button>
          `).join('')}
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">${activeTab.charAt(0).toUpperCase()+activeTab.slice(1)} Orders</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search orders…" oninput="Utils.filterTable('orders-table', this.value)" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="orders-table">
            <thead>
              <tr><th>Order ID</th><th>Patient</th><th>Items</th><th>Total</th><th>Rx</th><th>Time</th><th>Actions</th></tr>
            </thead>
            <tbody>${buildRows(orders.filter(o => o.status === activeTab))}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(orders) {
    if (!orders.length) return `<tr><td colspan="7"><div class="table-empty"><p>No ${activeTab} orders.</p></div></td></tr>`;
    return orders.map(o => `
      <tr>
        <td><code style="font-size:var(--fs-xs);background:var(--bg-elevated);padding:2px 6px;border-radius:4px">${o.id.toUpperCase()}</code></td>
        <td>
          <div style="font-weight:600">${Utils.esc(o.patient)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(o.address || '')}</div>
        </td>
        <td>
          <div style="font-size:var(--fs-xs)">${o.items.map(i => `${Utils.esc(i.name)} ×${i.qty}`).join(', ')}</div>
        </td>
        <td style="font-weight:700">${Utils.currency(o.total)}</td>
        <td>${o.prescription ? '<span class="badge-pill badge-warning">Rx</span>' : '—'}</td>
        <td style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.timeAgo(o.createdAt)}</td>
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-icon" onclick="PharmacyOrders.viewOrder('${o.id}')" title="View"><i data-lucide="eye"></i></button>
            ${o.status === 'pending' ? `
              <button class="btn btn-sm btn-success" onclick="PharmacyOrders.updateStatus('${o.id}','processing')"><i data-lucide="check"></i> Accept</button>
              <button class="btn btn-sm btn-danger" onclick="PharmacyOrders.updateStatus('${o.id}','rejected')"><i data-lucide="x"></i></button>
            ` : ''}
            ${o.status === 'processing' ? `
              <button class="btn btn-sm btn-primary" onclick="PharmacyOrders.updateStatus('${o.id}','completed')"><i data-lucide="package-check"></i> Complete</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function switchTab(tab) {
    activeTab = tab;
    render();
  }

  function updateStatus(id, status) {
    Store.update('orders', id, { status });
    Toast.success('Order updated', `Status changed to ${status}`);
    render();
  }

  function viewOrder(id) {
    const o = Store.find('orders', id);
    if (!o) return;
    App.openModal(`
      <div class="modal-header">
        <div class="modal-title">Order Details</div>
        <div class="modal-subtitle">#${o.id.toUpperCase()} · ${Utils.datetime(o.createdAt)}</div>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:var(--sp-4)">
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--sp-2)">
            <div><strong>Patient:</strong> ${Utils.esc(o.patient)}</div>
            ${Utils.statusBadge(o.status)}
          </div>
          <div><strong>Address:</strong> ${Utils.esc(o.address || '—')}</div>
          ${o.prescription ? '<div class="badge-pill badge-warning" style="margin-top:var(--sp-2)">Prescription Required</div>' : ''}
        </div>
        <div class="table-container" style="margin-bottom:var(--sp-4)">
          <table class="data-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              ${o.items.map(i => `<tr><td>${Utils.esc(i.name)}</td><td>${i.qty}</td><td>${Utils.currency(i.price)}</td><td>${Utils.currency(i.price * i.qty)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="text-align:right;font-size:var(--fs-lg);font-weight:700">Total: ${Utils.currency(o.total)}</div>
        ${o.status === 'pending' ? `
          <div class="form-actions" style="margin-top:var(--sp-4)">
            <button class="btn btn-danger" onclick="PharmacyOrders.updateStatus('${o.id}','rejected');App.closeModal()">Reject</button>
            <button class="btn btn-success" onclick="PharmacyOrders.updateStatus('${o.id}','processing');App.closeModal()">Accept Order</button>
          </div>
        ` : ''}
      </div>
    `);
  }

  function openCreate() {
    const drugs = Store.where('drugs', 'pharmacyId', getPharmId());
    App.openModal(`
      <div class="modal-header"><div class="modal-title">New Order</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyOrders.saveCreate(event)">
          <div class="form-group"><label>Patient Name*</label><input id="or-patient" required placeholder="Full name" /></div>
          <div class="form-group"><label>Delivery Address</label><input id="or-address" placeholder="Address" /></div>
          <div class="form-group"><label>Select Drug*</label>
            <select id="or-drug">
              ${drugs.map(d => `<option value="${d.id}" data-price="${d.mrp}">${Utils.esc(d.name)} (Stock: ${d.qty})</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Quantity*</label><input id="or-qty" type="number" min="1" value="1" required /></div>
            <div class="form-group"><label>Prescription Needed?</label>
              <select id="or-rx"><option value="0">No</option><option value="1">Yes</option></select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Order</button>
          </div>
        </form>
      </div>
    `);
  }

  function saveCreate(e) {
    e.preventDefault();
    const sel = document.getElementById('or-drug');
    const drug = Store.find('drugs', sel.value);
    if (!drug) { Toast.error('Select a drug'); return; }
    const qty = parseInt(document.getElementById('or-qty').value);
    const total = drug.mrp * qty;
    Store.add('orders', {
      id: 'o' + Utils.uid(),
      pharmacyId: getPharmId(),
      patient: document.getElementById('or-patient').value.trim(),
      address: document.getElementById('or-address').value.trim(),
      items: [{ name: drug.name, qty, price: drug.mrp }],
      total,
      status: 'pending',
      prescription: document.getElementById('or-rx').value === '1',
      createdAt: new Date().toISOString(),
    });
    Toast.success('Order created');
    App.closeModal();
    activeTab = 'pending';
    render();
  }

  return { render, switchTab, updateStatus, viewOrder, openCreate, saveCreate };
})();
