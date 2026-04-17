/* =====================================================
   DORMEDS – Admin Subscriptions Page
   ===================================================== */

const AdminSubscriptions = (() => {
  const PLANS = [
    { name: 'Basic', price: 1000, color: 'info', features: ['Up to 500 drugs', '100 orders/month', 'Email support', 'Basic reports'] },
    { name: 'Pro', price: 2500, color: 'primary', features: ['Up to 2000 drugs', 'Unlimited orders', 'Priority support', 'Advanced analytics', 'Barcode scanning'], popular: true },
    { name: 'Premium', price: 5000, color: 'success', features: ['Unlimited drugs', 'Unlimited orders', '24/7 support', 'Full analytics suite', 'Multi-branch support', 'Custom branding'] },
  ];

  function render() {
    const subs = Store.get('subscriptions');
    const pharmacies = Store.get('pharmacies');

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Subscriptions</h1>
            <p>Manage pharmacy subscription plans and payments.</p>
          </div>
        </div>

        <!-- Plan Cards -->
        <div class="plan-grid" style="margin-bottom:var(--sp-8)">
          ${PLANS.map(plan => `
            <div class="plan-card${plan.popular?' popular':''}">
              ${plan.popular ? '<div class="plan-badge">Most Popular</div>' : ''}
              <div class="plan-name">${plan.name}</div>
              <div class="plan-price">₹${plan.price.toLocaleString('en-IN')}<span>/month</span></div>
              <ul class="plan-features">
                ${plan.features.map(f => `<li><i data-lucide="check-circle-2"></i>${f}</li>`).join('')}
              </ul>
              <button class="btn btn-secondary btn-full" style="margin-top:var(--sp-3)" onclick="AdminSubscriptions.assignPlan('${plan.name}')">
                Assign to Pharmacy
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Subscriptions Table -->
        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">All Subscriptions</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search…" oninput="Utils.filterTable('subs-table', this.value)" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="subs-table">
            <thead>
              <tr>
                <th>Pharmacy</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${subs.map(s => {
                const pharm = pharmacies.find(p => p.id === s.pharmacyId);
                return `
                  <tr>
                    <td><strong>${Utils.esc(pharm ? pharm.name : 'Unknown')}</strong></td>
                    <td><span class="badge-pill badge-primary">${Utils.esc(s.plan)}</span></td>
                    <td>${s.waived ? '<span class="badge-pill badge-success">Waived</span>' : Utils.currency(s.amount)}</td>
                    <td style="font-size:var(--fs-xs)">${Utils.date(s.startDate)} → ${Utils.date(s.endDate)}</td>
                    <td>${Utils.statusBadge(s.status)}</td>
                    <td>
                      <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                        ${s.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="AdminSubscriptions.approve('${s.id}')"><i data-lucide="check"></i> Approve</button>` : ''}
                        ${!s.waived ? `<button class="btn btn-sm btn-secondary" onclick="AdminSubscriptions.waive('${s.id}')">Waive Fee</button>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="AdminSubscriptions.openEdit('${s.id}')"><i data-lucide="pencil"></i></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function approve(id) {
    Store.update('subscriptions', id, { status: 'active', paidAt: Utils.today() });
    Toast.success('Subscription approved', 'Payment confirmed and plan activated.');
    render();
  }

  function waive(id) {
    Utils.confirm('Waive the subscription fee for this pharmacy?', () => {
      Store.update('subscriptions', id, { waived: true, status: 'active', paidAt: Utils.today() });
      Toast.success('Fee waived', 'Subscription activated without charge.');
      render();
    });
  }

  function openEdit(id) {
    const s = Store.find('subscriptions', id);
    if (!s) return;
    App.openModal(`
      <div class="modal-header">
        <div class="modal-title">Edit Subscription</div>
      </div>
      <div class="modal-body">
        <form onsubmit="AdminSubscriptions.saveEdit(event,'${id}')">
          <div class="form-group"><label>Plan</label>
            <select id="se-plan">
              ${['Basic','Pro','Premium'].map(pl => `<option value="${pl}"${s.plan===pl?' selected':''}>${pl}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Amount (₹)</label><input id="se-amount" type="number" value="${s.amount}" /></div>
          <div class="form-row">
            <div class="form-group"><label>Start Date</label><input id="se-start" type="date" value="${s.startDate}" /></div>
            <div class="form-group"><label>End Date</label><input id="se-end" type="date" value="${s.endDate}" /></div>
          </div>
          <div class="form-group"><label>Status</label>
            <select id="se-status">
              ${['pending','active','cancelled'].map(st => `<option${s.status===st?' selected':''}>${st}</option>`).join('')}
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Update</button>
          </div>
        </form>
      </div>
    `);
  }

  function saveEdit(e, id) {
    e.preventDefault();
    Store.update('subscriptions', id, {
      plan: document.getElementById('se-plan').value,
      amount: parseInt(document.getElementById('se-amount').value),
      startDate: document.getElementById('se-start').value,
      endDate: document.getElementById('se-end').value,
      status: document.getElementById('se-status').value,
    });
    Toast.success('Subscription updated');
    App.closeModal();
    render();
  }

  function assignPlan(planName) {
    const pharmacies = Store.get('pharmacies');
    const plan = PLANS.find(p => p.name === planName);
    App.openModal(`
      <div class="modal-header">
        <div class="modal-title">Assign ${planName} Plan</div>
        <div class="modal-subtitle">₹${plan.price.toLocaleString('en-IN')}/month</div>
      </div>
      <div class="modal-body">
        <form onsubmit="AdminSubscriptions.saveAssign(event,'${planName}',${plan.price})">
          <div class="form-group"><label>Select Pharmacy*</label>
            <select id="as-pharm" required>
              <option value="">-- Choose pharmacy --</option>
              ${pharmacies.map(p => `<option value="${p.id}">${Utils.esc(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Start Date</label><input id="as-start" type="date" value="${Utils.today()}" /></div>
            <div class="form-group"><label>End Date</label><input id="as-end" type="date" value="${Utils.futureDate(30)}" /></div>
          </div>
          <div class="form-group"><label>Override Amount (₹)</label><input id="as-amount" type="number" value="${plan.price}" /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Assign Plan</button>
          </div>
        </form>
      </div>
    `);
  }

  function saveAssign(e, planName, defaultPrice) {
    e.preventDefault();
    const pharmacyId = document.getElementById('as-pharm').value;
    if (!pharmacyId) { Toast.error('Please select a pharmacy'); return; }
    Store.add('subscriptions', {
      id: Utils.uid(),
      pharmacyId,
      plan: planName,
      amount: parseInt(document.getElementById('as-amount').value) || defaultPrice,
      startDate: document.getElementById('as-start').value,
      endDate: document.getElementById('as-end').value,
      status: 'pending',
      waived: false,
      paidAt: null,
    });
    Toast.success('Plan assigned', `${planName} plan assigned successfully.`);
    App.closeModal();
    render();
  }

  return { render, approve, waive, openEdit, saveEdit, assignPlan, saveAssign };
})();
