/* =====================================================
   DORMEDS – Pharmacy Billing Page
   ===================================================== */

const PharmacyBilling = (() => {
  function getPharmId() { return Auth.getUser().pharmacyId || 'p1'; }

  function render() {
    const invoices = Store.where('invoices', 'pharmacyId', getPharmId());
    const orders = Store.where('orders', 'pharmacyId', getPharmId());
    const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter(i => i.status === 'paid').length;

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Billing</h1>
            <p>${invoices.length} invoices · ${paid} paid · Total billed ${Utils.currency(totalBilled)}</p>
          </div>
          <button class="btn btn-primary" onclick="PharmacyBilling.openCreate()">
            <i data-lucide="plus"></i> Generate Invoice
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--sp-6)">
          <div class="kpi-card success">
            <div class="kpi-icon success"><i data-lucide="indian-rupee"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${Utils.currency(invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0))}</div>
              <div class="kpi-label">Collected</div>
            </div>
          </div>
          <div class="kpi-card warning">
            <div class="kpi-icon warning"><i data-lucide="clock"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${Utils.currency(invoices.filter(i=>i.status==='pending').reduce((s,i)=>s+i.total,0))}</div>
              <div class="kpi-label">Outstanding</div>
            </div>
          </div>
          <div class="kpi-card primary">
            <div class="kpi-icon primary"><i data-lucide="receipt"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${invoices.length}</div>
              <div class="kpi-label">Total Invoices</div>
            </div>
          </div>
        </div>

        <!-- Invoices Table -->
        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">Invoice History</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search invoices…" oninput="Utils.filterTable('inv-bill-table',this.value)" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="inv-bill-table">
            <thead>
              <tr><th>Invoice No.</th><th>Patient</th><th>Items</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>${buildRows(invoices)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(invoices) {
    if (!invoices.length) return `<tr><td colspan="8"><div class="table-empty"><p>No invoices yet.</p></div></td></tr>`;
    return invoices.map(inv => `
      <tr>
        <td><code style="font-size:var(--fs-xs);background:var(--bg-elevated);padding:2px 6px;border-radius:4px">${Utils.esc(inv.invoiceNo)}</code></td>
        <td style="font-weight:600">${Utils.esc(inv.patient)}</td>
        <td style="font-size:var(--fs-xs)">${inv.items.map(i=>Utils.esc(i.name)).join(', ')}</td>
        <td>${Utils.currency(inv.subtotal)}</td>
        <td>${Utils.currency(inv.tax)}</td>
        <td style="font-weight:700">${Utils.currency(inv.total)}</td>
        <td>${Utils.statusBadge(inv.status)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-icon" onclick="PharmacyBilling.viewInvoice('${inv.id}')" title="View"><i data-lucide="eye"></i></button>
            <button class="btn btn-ghost btn-icon" onclick="PharmacyBilling.printInvoice('${inv.id}')" title="Print"><i data-lucide="printer"></i></button>
            ${inv.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="PharmacyBilling.markPaid('${inv.id}')">Mark Paid</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openCreate() {
    const orders = Store.where('orders', 'pharmacyId', getPharmId()).filter(o => o.status === 'completed');
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Generate Invoice</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyBilling.saveCreate(event)">
          <div class="form-group"><label>Completed Order*</label>
            <select id="bi-order" required onchange="PharmacyBilling.previewOrder(this.value)">
              <option value="">-- Select order --</option>
              ${orders.map(o => `<option value="${o.id}">#${o.id} — ${Utils.esc(o.patient)} (${Utils.currency(o.total)})</option>`).join('')}
            </select>
          </div>
          <div id="bi-preview"></div>
          <div class="form-row">
            <div class="form-group"><label>Discount (₹)</label><input id="bi-discount" type="number" min="0" value="0" /></div>
            <div class="form-group"><label>Tax Rate (%)</label><input id="bi-tax" type="number" min="0" value="5" /></div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="receipt"></i> Generate</button>
          </div>
        </form>
      </div>
    `);
  }

  function previewOrder(orderId) {
    const o = Store.find('orders', orderId);
    const preview = document.getElementById('bi-preview');
    if (!o || !preview) return;
    preview.innerHTML = `
      <div style="background:var(--bg-elevated);border-radius:var(--radius);padding:var(--sp-3);margin:var(--sp-3) 0">
        <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--sp-2)">Order Items</div>
        ${o.items.map(i => `<div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)">${Utils.esc(i.name)} ×${i.qty} <strong>${Utils.currency(i.price*i.qty)}</strong></div>`).join('')}
        <div style="border-top:1px solid var(--border);margin-top:var(--sp-2);padding-top:var(--sp-2);display:flex;justify-content:space-between;font-weight:700">Subtotal <span>${Utils.currency(o.total)}</span></div>
      </div>
    `;
  }

  function saveCreate(e) {
    e.preventDefault();
    const orderId = document.getElementById('bi-order').value;
    if (!orderId) { Toast.error('Select an order'); return; }
    const o = Store.find('orders', orderId);
    const discount = parseFloat(document.getElementById('bi-discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('bi-tax').value) || 5;
    const subtotal = o.total - discount;
    const tax = parseFloat((subtotal * taxRate / 100).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    const existing = Store.get('invoices');
    const invoiceNo = `INV-2024-${String(existing.length + 1).padStart(3,'0')}`;
    Store.add('invoices', {
      id: Utils.uid(),
      pharmacyId: getPharmId(),
      orderId,
      patient: o.patient,
      items: o.items.map(i => ({ ...i, total: i.price * i.qty })),
      subtotal: o.total,
      discount,
      tax,
      total,
      status: 'pending',
      createdAt: Utils.today(),
      invoiceNo,
    });
    Toast.success('Invoice generated', invoiceNo);
    App.closeModal();
    render();
  }

  function viewInvoice(id) {
    const inv = Store.find('invoices', id);
    const pharm = Store.find('pharmacies', getPharmId());
    if (!inv) return;
    App.openModal(`
      <div class="modal-body" style="padding:0">
        <div class="invoice-box" id="inv-print-${id}" style="border:none;border-radius:0">
          <div class="invoice-header">
            <div>
              <div class="invoice-title">INVOICE</div>
              <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:4px">${inv.invoiceNo}</div>
            </div>
            <div class="invoice-meta">
              <div style="font-size:var(--fs-xl);font-weight:800;background:linear-gradient(135deg,#6366f1,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">DORMEDS</div>
              <div>Date: ${Utils.date(inv.createdAt)}</div>
              <div>${Utils.statusBadge(inv.status)}</div>
            </div>
          </div>
          <div class="invoice-parties">
            <div>
              <div class="invoice-party-label">Billed From</div>
              <div class="invoice-party-name">${Utils.esc(pharm ? pharm.name : 'Pharmacy')}</div>
              <div style="font-size:var(--fs-sm);color:var(--text-secondary)">${Utils.esc(pharm ? pharm.address : '')}</div>
              <div style="font-size:var(--fs-sm);color:var(--text-secondary)">GST: ${Utils.esc(pharm ? pharm.gst : '')}</div>
            </div>
            <div>
              <div class="invoice-party-label">Billed To</div>
              <div class="invoice-party-name">${Utils.esc(inv.patient)}</div>
            </div>
          </div>
          <div class="invoice-items">
            <table class="data-table">
              <thead><tr><th>#</th><th>Drug Name</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>
                ${inv.items.map((item, idx) => `<tr><td>${idx+1}</td><td>${Utils.esc(item.name)}</td><td>${item.qty}</td><td>${Utils.currency(item.price)}</td><td>${Utils.currency(item.total)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="invoice-totals">
            <div class="row"><span>Subtotal</span><span>${Utils.currency(inv.subtotal)}</span></div>
            ${inv.discount ? `<div class="row"><span>Discount</span><span>-${Utils.currency(inv.discount)}</span></div>` : ''}
            <div class="row"><span>Tax (GST 5%)</span><span>${Utils.currency(inv.tax)}</span></div>
            <div class="row grand"><span>Total Payable</span><span>${Utils.currency(inv.total)}</span></div>
          </div>
          <div style="margin-top:var(--sp-6);font-size:var(--fs-xs);color:var(--text-muted);text-align:center">Thank you for choosing DORMEDS · This is a computer-generated invoice</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="PharmacyBilling.printInvoice('${id}')"><i data-lucide="printer"></i> Print / Download</button>
      </div>
    `, '720px');
  }

  function printInvoice(id) {
    const el = document.getElementById(`inv-print-${id}`);
    if (el) { Utils.printEl(el); return; }
    // If not in modal, open first then print
    viewInvoice(id);
    setTimeout(() => {
      const el2 = document.getElementById(`inv-print-${id}`);
      if (el2) Utils.printEl(el2);
    }, 400);
  }

  function markPaid(id) {
    Store.update('invoices', id, { status: 'paid' });
    Toast.success('Invoice marked as paid');
    render();
  }

  return { render, openCreate, previewOrder, saveCreate, viewInvoice, printInvoice, markPaid };
})();
