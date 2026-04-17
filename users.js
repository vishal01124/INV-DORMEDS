/* =====================================================
   DORMEDS – Admin Users Page
   ===================================================== */

const AdminUsers = (() => {
  function render() {
    const users = Store.get('users');
    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Users</h1>
            <p>Manage all user accounts on the platform.</p>
          </div>
          <button class="btn btn-primary" onclick="AdminUsers.openAdd()">
            <i data-lucide="user-plus"></i> Add User
          </button>
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">All Users (${users.length})</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search users…" oninput="Utils.filterTable('users-table', this.value)" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="users-table">
            <thead>
              <tr><th>User</th><th>Username</th><th>Role</th><th>Linked Pharmacy</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>${buildRows(users)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(users) {
    const pharmacies = Store.get('pharmacies');
    return users.map(u => {
      const pharm = pharmacies.find(p => p.id === u.pharmacyId);
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:var(--sp-3)">
              <div class="user-avatar" style="width:32px;height:32px;font-size:var(--fs-sm)">${(u.name||'U').charAt(0)}</div>
              <div>
                <div style="font-weight:600">${Utils.esc(u.name)}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(u.email)}</div>
              </div>
            </div>
          </td>
          <td><code style="background:var(--bg-elevated);padding:2px 6px;border-radius:4px;font-size:var(--fs-xs)">${Utils.esc(u.username)}</code></td>
          <td><span class="badge-pill ${u.role==='admin'?'badge-danger':'badge-primary'}">${Utils.esc(u.role)}</span></td>
          <td>${pharm ? Utils.esc(pharm.name) : '—'}</td>
          <td style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.date(u.createdAt)}</td>
          <td>
            <div style="display:flex;gap:var(--sp-1)">
              <button class="btn btn-ghost btn-icon" onclick="AdminUsers.openEdit('${u.id}')"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-icon" style="color:var(--color-danger)" onclick="AdminUsers.remove('${u.id}')"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openAdd() {
    const pharmacies = Store.get('pharmacies');
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Add User</div></div>
      <div class="modal-body">
        <form onsubmit="AdminUsers.save(event)">
          <div class="form-row">
            <div class="form-group"><label>Full Name*</label><input id="uf-name" required /></div>
            <div class="form-group"><label>Email*</label><input id="uf-email" type="email" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Username*</label><input id="uf-username" required /></div>
            <div class="form-group"><label>Password*</label><input id="uf-password" type="password" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Role</label>
              <select id="uf-role" onchange="AdminUsers.togglePharmField(this.value)">
                <option value="pharmacy">Pharmacy</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group" id="pharm-field"><label>Pharmacy</label>
              <select id="uf-pharm">
                <option value="">None</option>
                ${pharmacies.map(p => `<option value="${p.id}">${Utils.esc(p.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add User</button>
          </div>
        </form>
      </div>
    `);
  }

  function togglePharmField(role) {
    const field = document.getElementById('pharm-field');
    if (field) field.style.display = role === 'pharmacy' ? '' : 'none';
  }

  function save(e, editId) {
    e.preventDefault();
    const data = {
      name: document.getElementById('uf-name').value.trim(),
      email: document.getElementById('uf-email').value.trim(),
      username: document.getElementById('uf-username').value.trim(),
      role: document.getElementById('uf-role').value,
      pharmacyId: document.getElementById('uf-pharm')?.value || null,
    };
    const pw = document.getElementById('uf-password')?.value;
    if (!editId) {
      if (!pw) { Toast.error('Password required'); return; }
      Store.add('users', { id: Utils.uid(), ...data, password: pw, createdAt: Utils.today() });
      Toast.success('User created', data.name);
    } else {
      if (pw) data.password = pw;
      Store.update('users', editId, data);
      Toast.success('User updated', data.name);
    }
    App.closeModal();
    render();
  }

  function openEdit(id) {
    const u = Store.find('users', id);
    const pharmacies = Store.get('pharmacies');
    if (!u) return;
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Edit User</div></div>
      <div class="modal-body">
        <form onsubmit="AdminUsers.save(event,'${id}')">
          <div class="form-row">
            <div class="form-group"><label>Full Name*</label><input id="uf-name" required value="${Utils.esc(u.name)}" /></div>
            <div class="form-group"><label>Email*</label><input id="uf-email" type="email" required value="${Utils.esc(u.email)}" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Username*</label><input id="uf-username" required value="${Utils.esc(u.username)}" /></div>
            <div class="form-group"><label>New Password</label><input id="uf-password" type="password" placeholder="Leave blank to keep" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Role</label>
              <select id="uf-role">
                <option value="pharmacy"${u.role==='pharmacy'?' selected':''}>Pharmacy</option>
                <option value="admin"${u.role==='admin'?' selected':''}>Admin</option>
              </select>
            </div>
            <div class="form-group"><label>Pharmacy</label>
              <select id="uf-pharm">
                <option value="">None</option>
                ${pharmacies.map(p => `<option value="${p.id}"${p.id===u.pharmacyId?' selected':''}>${Utils.esc(p.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Update User</button>
          </div>
        </form>
      </div>
    `);
  }

  function remove(id) {
    const u = Store.find('users', id);
    if (u && u.username === 'admin') { Toast.error('Cannot delete the primary admin account.'); return; }
    Utils.confirm(`Delete user "${u?.name}"?`, () => {
      Store.remove('users', id);
      Toast.success('User deleted');
      render();
    });
  }

  return { render, openAdd, openEdit, save, remove, togglePharmField };
})();
