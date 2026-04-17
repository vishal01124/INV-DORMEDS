/* =====================================================
   DORMEDS – Admin Pharmacies Page
   ===================================================== */

const AdminPharmacies = (() => {
  function render() {
    const pharmacies = Store.get('pharmacies');
    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Pharmacies</h1>
            <p>Manage all registered pharmacies on the platform.</p>
          </div>
          <button class="btn btn-primary" onclick="AdminPharmacies.openAdd()">
            <i data-lucide="plus"></i> Add Pharmacy
          </button>
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">All Pharmacies (${pharmacies.length})</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search pharmacies…" oninput="Utils.filterTable('pharma-table', this.value)" />
              </div>
              <select onchange="AdminPharmacies.filterStatus(this.value)" style="width:auto">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="pharma-table">
            <thead>
              <tr>
                <th>Pharmacy</th>
                <th>Owner</th>
                <th>Contact</th>
                <th>Plan</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="pharma-tbody">${buildRows(pharmacies)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(pharmacies) {
    if (!pharmacies.length) return `<tr><td colspan="7"><div class="table-empty"><p>No pharmacies found.</p></div></td></tr>`;
    return pharmacies.map(p => `
      <tr>
        <td>
          <div style="font-weight:600">${Utils.esc(p.name)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(p.address)}</div>
        </td>
        <td>${Utils.esc(p.owner)}</td>
        <td>
          <div>${Utils.esc(p.email)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(p.phone)}</div>
        </td>
        <td><span class="badge-pill badge-primary">${Utils.esc(p.plan)}</span></td>
        <td>${Utils.currency(p.revenue || 0)}</td>
        <td>${Utils.statusBadge(p.status)}</td>
        <td>
          <div style="display:flex;gap:var(--sp-1)">
            <button class="btn btn-ghost btn-icon" onclick="AdminPharmacies.openEdit('${p.id}')" title="Edit"><i data-lucide="pencil"></i></button>
            <button class="btn btn-ghost btn-icon" onclick="AdminPharmacies.toggleStatus('${p.id}')" title="Toggle Status">
              <i data-lucide="${p.status === 'active' ? 'toggle-right' : 'toggle-left'}"></i>
            </button>
            <button class="btn btn-ghost btn-icon" style="color:var(--color-danger)" onclick="AdminPharmacies.remove('${p.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openAdd() {
    App.openModal(`
      <div class="modal-header">
        <div class="modal-title">Add New Pharmacy</div>
        <div class="modal-subtitle">Fill in the details to register a new pharmacy.</div>
      </div>
      <div class="modal-body">
        <form id="pharma-form" onsubmit="AdminPharmacies.save(event)">
          <div class="form-row">
            <div class="form-group"><label>Pharmacy Name*</label><input id="pf-name" required placeholder="e.g. MedPlus Pharmacy" /></div>
            <div class="form-group"><label>Owner Name*</label><input id="pf-owner" required placeholder="Full name" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email*</label><input id="pf-email" type="email" required placeholder="pharmacy@example.com" /></div>
            <div class="form-group"><label>Phone*</label><input id="pf-phone" required placeholder="10-digit mobile" /></div>
          </div>
          <div class="form-group"><label>Address*</label><input id="pf-address" required placeholder="Full address with city and pincode" /></div>
          <div class="form-row">
            <div class="form-group"><label>GST Number</label><input id="pf-gst" placeholder="GST registration" /></div>
            <div class="form-group"><label>License No.</label><input id="pf-license" placeholder="Drug license number" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Plan</label>
              <select id="pf-plan">
                <option>Basic</option><option>Pro</option><option>Premium</option>
              </select>
            </div>
            <div class="form-group"><label>Status</label>
              <select id="pf-status"><option value="active">Active</option><option value="inactive">Inactive</option></select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Save Pharmacy</button>
          </div>
        </form>
      </div>
    `);
  }

  function openEdit(id) {
    const p = Store.find('pharmacies', id);
    if (!p) return;
    App.openModal(`
      <div class="modal-header">
        <div class="modal-title">Edit Pharmacy</div>
        <div class="modal-subtitle">${Utils.esc(p.name)}</div>
      </div>
      <div class="modal-body">
        <form id="pharma-form" onsubmit="AdminPharmacies.save(event,'${id}')">
          <div class="form-row">
            <div class="form-group"><label>Pharmacy Name*</label><input id="pf-name" required value="${Utils.esc(p.name)}" /></div>
            <div class="form-group"><label>Owner Name*</label><input id="pf-owner" required value="${Utils.esc(p.owner)}" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email*</label><input id="pf-email" type="email" required value="${Utils.esc(p.email)}" /></div>
            <div class="form-group"><label>Phone*</label><input id="pf-phone" required value="${Utils.esc(p.phone)}" /></div>
          </div>
          <div class="form-group"><label>Address*</label><input id="pf-address" required value="${Utils.esc(p.address)}" /></div>
          <div class="form-row">
            <div class="form-group"><label>GST Number</label><input id="pf-gst" value="${Utils.esc(p.gst||'')}" /></div>
            <div class="form-group"><label>License No.</label><input id="pf-license" value="${Utils.esc(p.license||'')}" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Plan</label>
              <select id="pf-plan">
                ${['Basic','Pro','Premium'].map(pl => `<option${p.plan===pl?' selected':''}>${pl}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Status</label>
              <select id="pf-status">
                <option value="active"${p.status==='active'?' selected':''}>Active</option>
                <option value="inactive"${p.status==='inactive'?' selected':''}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Update Pharmacy</button>
          </div>
        </form>
      </div>
    `);
  }

  function save(e, editId) {
    e.preventDefault();
    const data = {
      name: document.getElementById('pf-name').value.trim(),
      owner: document.getElementById('pf-owner').value.trim(),
      email: document.getElementById('pf-email').value.trim(),
      phone: document.getElementById('pf-phone').value.trim(),
      address: document.getElementById('pf-address').value.trim(),
      gst: document.getElementById('pf-gst').value.trim(),
      license: document.getElementById('pf-license').value.trim(),
      plan: document.getElementById('pf-plan').value,
      status: document.getElementById('pf-status').value,
    };
    if (editId) {
      Store.update('pharmacies', editId, data);
      Toast.success('Pharmacy updated', data.name);
    } else {
      Store.add('pharmacies', { id: Utils.uid(), ...data, revenue: 0, joinedAt: Utils.today() });
      Toast.success('Pharmacy added', data.name);
    }
    App.closeModal();
    render();
  }

  function toggleStatus(id) {
    const p = Store.find('pharmacies', id);
    if (!p) return;
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    Store.update('pharmacies', id, { status: newStatus });
    Toast.success('Status updated', `${p.name} is now ${newStatus}`);
    render();
  }

  function remove(id) {
    const p = Store.find('pharmacies', id);
    Utils.confirm(`Delete "${p.name}"? This cannot be undone.`, () => {
      Store.remove('pharmacies', id);
      Toast.success('Pharmacy removed', p.name);
      render();
    });
  }

  function filterStatus(val) {
    const rows = document.querySelectorAll('#pharma-table tbody tr');
    rows.forEach(row => {
      if (!val) { row.style.display = ''; return; }
      row.style.display = row.textContent.toLowerCase().includes(val) ? '' : 'none';
    });
  }

  return { render, openAdd, openEdit, save, toggleStatus, remove, filterStatus };
})();
