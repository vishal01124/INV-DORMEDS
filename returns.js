/* =====================================================
   DORMEDS – Pharmacy Returns Page
   ===================================================== */

const PharmacyReturns = (() => {
  function getPharmId() { return Auth.getUser().pharmacyId || 'p1'; }

  const REASONS = ['Wrong medication','Damaged product','Expired product','Quantity mismatch','Allergic reaction','Doctor changed prescription','Other'];

  function render() {
    const returns = Store.where('returns', 'pharmacyId', getPharmId());
    const pending = returns.filter(r => r.status === 'pending').length;
    const approved = returns.filter(r => r.status === 'approved').length;

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Returns</h1>
            <p>${returns.length} returns · ${pending} pending · ${approved} approved</p>
          </div>
          <button class="btn btn-primary" onclick="PharmacyReturns.openCreate()">
            <i data-lucide="plus"></i> New Return Request
          </button>
        </div>

        <!-- Summary KPIs -->
        <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--sp-6)">
          <div class="kpi-card warning">
            <div class="kpi-icon warning"><i data-lucide="clock"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${pending}</div>
              <div class="kpi-label">Pending Review</div>
            </div>
          </div>
          <div class="kpi-card success">
            <div class="kpi-icon success"><i data-lucide="check-circle-2"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${approved}</div>
              <div class="kpi-label">Approved</div>
            </div>
          </div>
          <div class="kpi-card primary">
            <div class="kpi-icon primary"><i data-lucide="indian-rupee"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${Utils.currency(returns.filter(r=>r.status==='approved').reduce((s,r)=>s+r.amount,0))}</div>
              <div class="kpi-label">Refunded</div>
            </div>
          </div>
        </div>

        <!-- Returns Table -->
        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">Return Requests</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search returns…" oninput="Utils.filterTable('ret-table',this.value)" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="ret-table">
            <thead>
              <tr><th>Return ID</th><th>Patient</th><th>Order</th><th>Items</th><th>Reason</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>${buildRows(returns)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(returns) {
    if (!returns.length) return `<tr><td colspan="8"><div class="table-empty"><p>No return requests.</p></div></td></tr>`;
    return returns.map(r => `
      <tr>
        <td><code style="font-size:var(--fs-xs);background:var(--bg-elevated);padding:2px 6px;border-radius:4px">${r.id.toUpperCase()}</code></td>
        <td style="font-weight:600">${Utils.esc(r.patient)}</td>
        <td><code style="font-size:var(--fs-xs)">${Utils.esc(r.orderId)}</code></td>
        <td style="font-size:var(--fs-xs)">${Utils.esc(r.items)}</td>
        <td style="font-size:var(--fs-xs)">${Utils.esc(r.reason)}</td>
        <td style="font-weight:700">${Utils.currency(r.amount)}</td>
        <td>${Utils.statusBadge(r.status)}</td>
        <td>
          <div style="display:flex;gap:4px">
            ${r.status === 'pending' ? `
              <button class="btn btn-sm btn-success" onclick="PharmacyReturns.updateStatus('${r.id}','approved')"><i data-lucide="check"></i></button>
              <button class="btn btn-sm btn-danger" onclick="PharmacyReturns.updateStatus('${r.id}','rejected')"><i data-lucide="x"></i></button>
            ` : ''}
            <button class="btn btn-ghost btn-icon" onclick="PharmacyReturns.viewReturn('${r.id}')"><i data-lucide="eye"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openCreate() {
    const orders = Store.where('orders', 'pharmacyId', getPharmId()).filter(o => ['completed','processing'].includes(o.status));
    App.openModal(`
      <div class="modal-header"><div class="modal-title">New Return Request</div><div class="modal-subtitle">Initiate a return for a completed order.</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyReturns.saveCreate(event)">
          <div class="form-group"><label>Select Order*</label>
            <select id="ret-order" required onchange="PharmacyReturns.previewRetOrder(this.value)">
              <option value="">-- Select order --</option>
              ${orders.map(o => `<option value="${o.id}">#${o.id} — ${Utils.esc(o.patient)}</option>`).join('')}
            </select>
          </div>
          <div id="ret-order-preview"></div>
          <div class="form-group"><label>Items Being Returned*</label>
            <input id="ret-items" required placeholder="e.g. Paracetamol 500mg ×2" />
          </div>
          <div class="form-row">
            <div class="form-group"><label>Reason*</label>
              <select id="ret-reason" required>
                ${REASONS.map(r => `<option>${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Refund Amount (₹)*</label>
              <input id="ret-amount" type="number" min="0" step="0.01" required placeholder="0.00" />
            </div>
          </div>
          <div class="form-group"><label>Additional Notes</label>
            <textarea id="ret-notes" rows="2" placeholder="Describe the return reason in detail…"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="refresh-ccw"></i> Submit Return</button>
          </div>
        </form>
      </div>
    `);
  }

  function previewRetOrder(orderId) {
    const o = Store.find('orders', orderId);
    const preview = document.getElementById('ret-order-preview');
    if (!o || !preview) return;
    preview.innerHTML = `
      <div style="background:var(--bg-elevated);border-radius:var(--radius);padding:var(--sp-3);margin:var(--sp-2) 0;font-size:var(--fs-sm)">
        <strong>${Utils.esc(o.patient)}</strong> · ${o.items.map(i=>Utils.esc(i.name)).join(', ')} · Total: ${Utils.currency(o.total)}
      </div>
    `;
    // Pre-fill amount
    document.getElementById('ret-amount').value = o.total;
    document.getElementById('ret-items').value = o.items.map(i => `${i.name} ×${i.qty}`).join(', ');
  }

  function saveCreate(e) {
    e.preventDefault();
    const orderId = document.getElementById('ret-order').value;
    const o = Store.find('orders', orderId);
    if (!o) { Toast.error('Please select an order'); return; }
    Store.add('returns', {
      id: 'r' + Utils.uid(),
      pharmacyId: getPharmId(),
      orderId,
      patient: o.patient,
      items: document.getElementById('ret-items').value.trim(),
      reason: document.getElementById('ret-reason').value,
      amount: parseFloat(document.getElementById('ret-amount').value),
      status: 'pending',
      notes: document.getElementById('ret-notes').value.trim(),
      createdAt: Utils.today(),
    });
    Toast.success('Return request submitted', 'Pending admin approval.');
    App.closeModal();
    render();
  }

  function updateStatus(id, status) {
    Store.update('returns', id, { status });
    Toast.success('Return updated', `Status: ${status}`);
    render();
  }

  function viewReturn(id) {
    const r = Store.find('returns', id);
    if (!r) return;
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Return Details</div><div class="modal-subtitle">#${r.id.toUpperCase()}</div></div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Patient</span><strong>${Utils.esc(r.patient)}</strong></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Order ID</span><code>${Utils.esc(r.orderId)}</code></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Items</span><span>${Utils.esc(r.items)}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Reason</span><span>${Utils.esc(r.reason)}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Amount</span><strong>${Utils.currency(r.amount)}</strong></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Status</span>${Utils.statusBadge(r.status)}</div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Date</span><span>${Utils.date(r.createdAt)}</span></div>
          ${r.notes ? `<div style="background:var(--bg-elevated);padding:var(--sp-3);border-radius:var(--radius);font-size:var(--fs-sm)">${Utils.esc(r.notes)}</div>` : ''}
        </div>
        ${r.status === 'pending' ? `
          <div class="form-actions" style="margin-top:var(--sp-5)">
            <button class="btn btn-danger" onclick="PharmacyReturns.updateStatus('${r.id}','rejected');App.closeModal()">Reject</button>
            <button class="btn btn-success" onclick="PharmacyReturns.updateStatus('${r.id}','approved');App.closeModal()">Approve Refund</button>
          </div>
        ` : ''}
      </div>
    `);
  }

  return { render, openCreate, previewRetOrder, saveCreate, updateStatus, viewReturn };
})();
