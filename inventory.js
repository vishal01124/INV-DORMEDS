/* =====================================================
   DORMEDS – Pharmacy Inventory Page
   ===================================================== */

const PharmacyInventory = (() => {
  const CATEGORIES = ['Analgesic','Antibiotic','Antidiabetic','Antacid','Antihypertensive','Antihistamine','Supplement','Antiviral','Cardiovascular','Other'];

  function getPharmId() {
    return Auth.getUser().pharmacyId || 'p1';
  }

  function render() {
    const pid = getPharmId();
    const drugs = Store.where('drugs', 'pharmacyId', pid);
    const lowStock = drugs.filter(d => d.qty <= d.lowStockAlert).length;
    const expiring = drugs.filter(d => Utils.daysUntil(d.expiry) <= 30).length;

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Inventory</h1>
            <p>${drugs.length} drugs · ${lowStock} low stock · ${expiring} expiring soon</p>
          </div>
          <button class="btn btn-primary" onclick="PharmacyInventory.openAdd()">
            <i data-lucide="plus"></i> Add Drug
          </button>
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">Drug Inventory</span>
            <div class="table-actions">
              <div class="search-input-wrap">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search drugs, barcode…" oninput="Utils.filterTable('inv-table', this.value)" />
              </div>
              <select onchange="PharmacyInventory.filterCat(this.value)" style="width:auto">
                <option value="">All Categories</option>
                ${CATEGORIES.map(c => `<option>${c}</option>`).join('')}
              </select>
              <div class="search-input-wrap">
                <i data-lucide="barcode"></i>
                <input type="text" id="barcode-input" placeholder="Scan barcode…" oninput="PharmacyInventory.searchBarcode(this.value)" style="width:160px" />
              </div>
            </div>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table" id="inv-table">
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Price / MRP</th>
                <th>Expiry</th>
                <th>Barcode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${buildRows(drugs)}</tbody>
          </table>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildRows(drugs) {
    if (!drugs.length) return `<tr><td colspan="7"><div class="table-empty"><i data-lucide="package" style="width:48px;height:48px;display:block;margin:0 auto 12px;opacity:0.3"></i><p>No drugs in inventory.</p></div></td></tr>`;
    return drugs.map(d => {
      const exp = Utils.expiryStatus(d.expiry);
      const isLow = d.qty <= d.lowStockAlert;
      return `
        <tr>
          <td>
            <div style="font-weight:600">${Utils.esc(d.name)}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(d.manufacturer)} · ${Utils.esc(d.batch)}</div>
          </td>
          <td><span class="badge-pill badge-info">${Utils.esc(d.category)}</span></td>
          <td>
            <span style="font-weight:700${isLow?';color:var(--color-danger)':''}">${d.qty}</span>
            ${isLow ? '<span class="badge-pill badge-danger" style="margin-left:4px;font-size:10px">Low</span>' : ''}
          </td>
          <td>₹${d.price} <span style="color:var(--text-muted);font-size:var(--fs-xs)">/ ₹${d.mrp}</span></td>
          <td><span class="${exp.cls}">${exp.label}</span></td>
          <td><code style="font-size:10px;background:var(--bg-elevated);padding:2px 5px;border-radius:4px">${Utils.esc(d.barcode)}</code></td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-icon" onclick="PharmacyInventory.openEdit('${d.id}')" title="Edit"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-icon" onclick="PharmacyInventory.adjustQty('${d.id}')" title="Adjust Stock"><i data-lucide="plus-minus"></i></button>
              <button class="btn btn-ghost btn-icon" style="color:var(--color-danger)" onclick="PharmacyInventory.remove('${d.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openAdd() {
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Add Drug</div><div class="modal-subtitle">Add a new drug to your inventory</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyInventory.save(event)">
          <div class="form-row">
            <div class="form-group"><label>Drug Name*</label><input id="df-name" required placeholder="e.g. Paracetamol 500mg" /></div>
            <div class="form-group"><label>Category*</label>
              <select id="df-cat">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Manufacturer</label><input id="df-mfr" placeholder="Company name" /></div>
            <div class="form-group"><label>Batch No.</label><input id="df-batch" placeholder="e.g. B2024-01" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Quantity*</label><input id="df-qty" type="number" min="0" required placeholder="Units" /></div>
            <div class="form-group"><label>Low Stock Alert</label><input id="df-alert" type="number" min="0" placeholder="Min qty threshold" value="30" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Purchase Price (₹)*</label><input id="df-price" type="number" min="0" step="0.01" required /></div>
            <div class="form-group"><label>MRP (₹)*</label><input id="df-mrp" type="number" min="0" step="0.01" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Expiry Date*</label><input id="df-expiry" type="date" required /></div>
            <div class="form-group"><label>HSN Code</label><input id="df-hsn" placeholder="e.g. 30049099" /></div>
          </div>
          <div class="form-group">
            <label>Barcode</label>
            <div style="display:flex;gap:var(--sp-2)">
              <input id="df-barcode" placeholder="13-digit barcode" style="flex:1" />
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('df-barcode').value=Utils.barcode()">Generate</button>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Add Drug</button>
          </div>
        </form>
      </div>
    `, '640px');
  }

  function openEdit(id) {
    const d = Store.find('drugs', id);
    if (!d) return;
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Edit Drug</div><div class="modal-subtitle">${Utils.esc(d.name)}</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyInventory.save(event,'${id}')">
          <div class="form-row">
            <div class="form-group"><label>Drug Name*</label><input id="df-name" required value="${Utils.esc(d.name)}" /></div>
            <div class="form-group"><label>Category*</label>
              <select id="df-cat">${CATEGORIES.map(c => `<option${d.category===c?' selected':''}>${c}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Manufacturer</label><input id="df-mfr" value="${Utils.esc(d.manufacturer||'')}" /></div>
            <div class="form-group"><label>Batch No.</label><input id="df-batch" value="${Utils.esc(d.batch||'')}" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Quantity*</label><input id="df-qty" type="number" min="0" required value="${d.qty}" /></div>
            <div class="form-group"><label>Low Stock Alert</label><input id="df-alert" type="number" value="${d.lowStockAlert||30}" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Purchase Price (₹)*</label><input id="df-price" type="number" step="0.01" required value="${d.price}" /></div>
            <div class="form-group"><label>MRP (₹)*</label><input id="df-mrp" type="number" step="0.01" required value="${d.mrp}" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Expiry Date*</label><input id="df-expiry" type="date" required value="${d.expiry}" /></div>
            <div class="form-group"><label>HSN Code</label><input id="df-hsn" value="${Utils.esc(d.hsn||'')}" /></div>
          </div>
          <div class="form-group"><label>Barcode</label><input id="df-barcode" value="${Utils.esc(d.barcode||'')}" /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Update Drug</button>
          </div>
        </form>
      </div>
    `, '640px');
  }

  function save(e, editId) {
    e.preventDefault();
    const data = {
      name: document.getElementById('df-name').value.trim(),
      category: document.getElementById('df-cat').value,
      manufacturer: document.getElementById('df-mfr').value.trim(),
      batch: document.getElementById('df-batch').value.trim(),
      qty: parseInt(document.getElementById('df-qty').value),
      lowStockAlert: parseInt(document.getElementById('df-alert').value) || 30,
      price: parseFloat(document.getElementById('df-price').value),
      mrp: parseFloat(document.getElementById('df-mrp').value),
      expiry: document.getElementById('df-expiry').value,
      hsn: document.getElementById('df-hsn').value.trim(),
      barcode: document.getElementById('df-barcode').value.trim(),
    };
    if (editId) {
      Store.update('drugs', editId, data);
      Toast.success('Drug updated', data.name);
    } else {
      Store.add('drugs', { id: Utils.uid(), pharmacyId: getPharmId(), ...data });
      Toast.success('Drug added', data.name);
    }
    App.closeModal();
    render();
  }

  function adjustQty(id) {
    const d = Store.find('drugs', id);
    if (!d) return;
    App.openModal(`
      <div class="modal-header"><div class="modal-title">Adjust Stock</div><div class="modal-subtitle">${Utils.esc(d.name)} — Current: ${d.qty}</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacyInventory.saveAdj(event,'${id}')">
          <div class="form-group"><label>Adjustment Type</label>
            <select id="adj-type">
              <option value="add">Add Stock (Purchase)</option>
              <option value="sub">Remove Stock (Damage/Disposal)</option>
              <option value="set">Set Exact Quantity</option>
            </select>
          </div>
          <div class="form-group"><label>Quantity*</label><input id="adj-qty" type="number" min="1" required placeholder="Enter quantity" /></div>
          <div class="form-group"><label>Reason</label><input id="adj-reason" placeholder="Optional note" /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Adjust</button>
          </div>
        </form>
      </div>
    `);
  }

  function saveAdj(e, id) {
    e.preventDefault();
    const d = Store.find('drugs', id);
    const type = document.getElementById('adj-type').value;
    const qty = parseInt(document.getElementById('adj-qty').value);
    let newQty = d.qty;
    if (type === 'add') newQty += qty;
    else if (type === 'sub') newQty = Math.max(0, newQty - qty);
    else newQty = qty;
    Store.update('drugs', id, { qty: newQty });
    Toast.success('Stock adjusted', `${d.name}: ${d.qty} → ${newQty}`);
    App.closeModal();
    render();
  }

  function remove(id) {
    const d = Store.find('drugs', id);
    Utils.confirm(`Delete "${d.name}" from inventory?`, () => {
      Store.remove('drugs', id);
      Toast.success('Drug removed', d.name);
      render();
    });
  }

  function filterCat(val) {
    const rows = document.querySelectorAll('#inv-table tbody tr');
    rows.forEach(r => { r.style.display = !val || r.textContent.includes(val) ? '' : 'none'; });
  }

  function searchBarcode(val) {
    if (val.length >= 8) {
      Utils.filterTable('inv-table', val);
      Toast.info('Barcode scanned', `Searching for: ${val}`);
    }
  }

  return { render, openAdd, openEdit, save, adjustQty, saveAdj, remove, filterCat, searchBarcode };
})();
