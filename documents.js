/* =====================================================
   DORMEDS – Pharmacy Documents (Prescriptions) Page
   ===================================================== */

const PharmacyDocuments = (() => {
  function getPharmId() { return Auth.getUser().pharmacyId || 'p1'; }

  function render() {
    const docs = Store.where('documents', 'pharmacyId', getPharmId());
    const pending = docs.filter(d => d.status === 'pending').length;

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Prescriptions</h1>
            <p>${docs.length} documents · ${pending} pending review</p>
          </div>
          <button class="btn btn-primary" onclick="PharmacyDocuments.openUpload()">
            <i data-lucide="upload"></i> Upload Prescription
          </button>
        </div>

        ${pending > 0 ? `<div class="alert alert-warning"><i data-lucide="clock"></i><div><strong>${pending} prescription(s) awaiting review.</strong> Documents will be verified by our team.</div></div>` : ''}

        <div class="grid-2">
          <!-- Upload Zone -->
          <div class="card">
            <div class="card-title" style="margin-bottom:var(--sp-4)">Quick Upload</div>
            <div class="upload-zone" id="drop-zone" onclick="PharmacyDocuments.openUpload()" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="PharmacyDocuments.handleDrop(event)">
              <i data-lucide="file-up" style="width:48px;height:48px;color:var(--text-muted);display:block;margin:0 auto 12px"></i>
              <p><strong>Click to upload</strong> or drag & drop</p>
              <small>PNG, JPG, PDF up to 10MB</small>
            </div>
            <input type="file" id="file-input" accept="image/*,.pdf" style="display:none" onchange="PharmacyDocuments.handleFile(this)" />
          </div>

          <!-- Preview Panel -->
          <div class="card" id="preview-panel">
            <div class="card-title" style="margin-bottom:var(--sp-4)">Preview</div>
            <div style="text-align:center;color:var(--text-muted);padding:var(--sp-8) 0">
              <i data-lucide="file-search" style="width:40px;height:40px;margin-bottom:var(--sp-3);display:block;margin-left:auto;margin-right:auto"></i>
              <p style="font-size:var(--fs-sm)">Upload a file to preview it here</p>
            </div>
          </div>
        </div>

        <!-- Documents Table -->
        <div class="table-container" style="margin-top:var(--sp-5)">
          <div class="table-toolbar">
            <span class="table-toolbar-title">All Documents</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search…" oninput="Utils.filterTable('docs-table',this.value)" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="docs-table">
            <thead>
              <tr><th>Document</th><th>Type</th><th>Order ID</th><th>Uploaded</th><th>Status</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>${buildRows(docs)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(docs) {
    if (!docs.length) return `<tr><td colspan="7"><div class="table-empty"><p>No documents uploaded yet.</p></div></td></tr>`;
    return docs.map(d => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <i data-lucide="${d.filename.endsWith('.pdf') ? 'file-text' : 'image'}" style="color:var(--color-primary-light)"></i>
            <div>
              <div style="font-weight:600;font-size:var(--fs-sm)">${Utils.esc(d.filename)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-pill badge-info">Prescription</span></td>
        <td><code style="font-size:var(--fs-xs)">${Utils.esc(d.orderId || '—')}</code></td>
        <td style="font-size:var(--fs-xs)">${Utils.date(d.uploadedAt)}</td>
        <td>${Utils.statusBadge(d.status)}</td>
        <td style="font-size:var(--fs-xs);color:var(--text-secondary);max-width:180px">${Utils.esc(d.notes || '—')}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-icon" onclick="PharmacyDocuments.viewDoc('${d.id}')" title="View"><i data-lucide="eye"></i></button>
            <button class="btn btn-ghost btn-icon" style="color:var(--color-danger)" onclick="PharmacyDocuments.remove('${d.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openUpload() {
    const orders = Store.where('orders', 'pharmacyId', getPharmId());
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Upload Prescription</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyDocuments.saveUpload(event)">
          <div class="form-group">
            <label>Select File (PNG/JPG/PDF)*</label>
            <input type="file" id="upload-file" accept="image/*,.pdf" required style="padding:var(--sp-2)" />
          </div>
          <div class="form-group">
            <label>Linked Order (optional)</label>
            <select id="upload-order">
              <option value="">None</option>
              ${orders.map(o => `<option value="${o.id}">#${o.id} — ${Utils.esc(o.patient)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea id="upload-notes" rows="3" placeholder="Optional notes about this document…"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="upload"></i> Upload</button>
          </div>
        </form>
      </div>
    `);
  }

  function saveUpload(e) {
    e.preventDefault();
    const fileInput = document.getElementById('upload-file');
    if (!fileInput.files.length) { Toast.error('Please select a file.'); return; }
    const file = fileInput.files[0];
    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) { Toast.error('File too large', 'Max 10MB allowed.'); return; }
    // Simulate upload
    const doc = {
      id: Utils.uid(),
      pharmacyId: getPharmId(),
      orderId: document.getElementById('upload-order').value,
      type: 'prescription',
      filename: file.name,
      status: 'pending',
      uploadedAt: Utils.today(),
      notes: document.getElementById('upload-notes').value.trim(),
    };
    Store.add('documents', doc);
    Toast.success('Prescription uploaded', 'Pending review by admin.');
    App.closeModal();
    render();
  }

  function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) showPreview(file);
  }

  function handleFile(input) {
    if (input.files[0]) showPreview(input.files[0]);
  }

  function showPreview(file) {
    const panel = document.getElementById('preview-panel');
    if (!panel) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        panel.innerHTML = `
          <div class="card-title" style="margin-bottom:var(--sp-4)">Preview — ${Utils.esc(file.name)}</div>
          <img src="${ev.target.result}" style="width:100%;border-radius:var(--radius);object-fit:contain;max-height:300px" />
          <button class="btn btn-primary btn-full" style="margin-top:var(--sp-4)" onclick="PharmacyDocuments.openUpload()">Upload This File</button>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      panel.innerHTML = `
        <div class="card-title" style="margin-bottom:var(--sp-4)">PDF Selected</div>
        <div style="text-align:center;padding:var(--sp-8);background:var(--bg-elevated);border-radius:var(--radius)">
          <i data-lucide="file-text" style="width:48px;height:48px;color:var(--color-danger);display:block;margin:0 auto var(--sp-3)"></i>
          <div style="font-weight:600">${Utils.esc(file.name)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${(file.size/1024).toFixed(0)} KB</div>
        </div>
        <button class="btn btn-primary btn-full" style="margin-top:var(--sp-4)" onclick="PharmacyDocuments.openUpload()">Upload This File</button>
      `;
      lucide.createIcons();
    }
  }

  function viewDoc(id) {
    const d = Store.find('documents', id);
    if (!d) return;
    App.openModal(`
      <div class="modal-header">
        <div class="modal-title">${Utils.esc(d.filename)}</div>
        <div class="modal-subtitle">Uploaded ${Utils.date(d.uploadedAt)}</div>
      </div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Status</span>${Utils.statusBadge(d.status)}</div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Type</span><span>Prescription</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Linked Order</span><span>${d.orderId || '—'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Notes</span><span>${Utils.esc(d.notes || '—')}</span></div>
        </div>
        <div style="margin-top:var(--sp-5);padding:var(--sp-8);background:var(--bg-elevated);border-radius:var(--radius);text-align:center">
          <i data-lucide="file-text" style="width:48px;height:48px;display:block;margin:0 auto var(--sp-3);color:var(--color-primary)"></i>
          <p style="font-size:var(--fs-sm);color:var(--text-muted)">File preview not available in demo mode</p>
        </div>
      </div>
    `);
  }

  function remove(id) {
    Utils.confirm('Delete this document?', () => {
      Store.remove('documents', id);
      Toast.success('Document deleted');
      render();
    });
  }

  return { render, openUpload, saveUpload, handleDrop, handleFile, viewDoc, remove };
})();
