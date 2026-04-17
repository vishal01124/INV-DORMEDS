/* =====================================================
   DORMEDS – LocalStorage State Store with Seed Data
   ===================================================== */

const Store = (() => {
  const KEY = 'dormeds_v1';

  /* ---------- Default seed data ---------- */
  const SEED = {
    users: [
      { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', name: 'Dr. Ananya Sharma', email: 'admin@dormeds.in', createdAt: Utils.pastDate(120) },
      { id: 'u2', username: 'pharmacy', password: 'pharm123', role: 'pharmacy', name: 'MedPlus Pharmacy', email: 'pharmacy@dormeds.in', pharmacyId: 'p1', createdAt: Utils.pastDate(90) },
      { id: 'u3', username: 'citymed', password: 'city123', role: 'pharmacy', name: 'City Medical Store', email: 'city@dormeds.in', pharmacyId: 'p2', createdAt: Utils.pastDate(60) },
    ],
    pharmacies: [
      { id: 'p1', name: 'MedPlus Pharmacy', owner: 'Rajesh Kumar', email: 'pharmacy@dormeds.in', phone: '9876543210', address: '12 MG Road, Bangalore 560001', plan: 'Pro', status: 'active', gst: '29ABCDE1234F1Z5', license: 'KA-BLR-2024-001', joinedAt: Utils.pastDate(90), revenue: 184000 },
      { id: 'p2', name: 'City Medical Store', owner: 'Priya Nair', email: 'city@dormeds.in', phone: '9876501234', address: '45 Park Street, Chennai 600002', plan: 'Basic', status: 'active', gst: '33FGHIJ5678K2L6', license: 'TN-CHN-2024-002', joinedAt: Utils.pastDate(60), revenue: 97000 },
      { id: 'p3', name: 'Apollo Dispensary', owner: 'Suresh Patel', email: 'apollo@dormeds.in', phone: '9800012345', address: '88 Ring Road, Ahmedabad 380001', plan: 'Premium', status: 'active', gst: '24KLMNO9012P3Q7', license: 'GJ-AMD-2024-003', joinedAt: Utils.pastDate(30), revenue: 312000 },
      { id: 'p4', name: 'Green Leaf Medical', owner: 'Meena Joshi', email: 'greenleaf@dormeds.in', phone: '9700056789', address: '22 Nehru Place, Delhi 110019', plan: 'Basic', status: 'inactive', gst: '07RSTUV3456W4X8', license: 'DL-DEL-2024-004', joinedAt: Utils.pastDate(15), revenue: 12000 },
    ],
    subscriptions: [
      { id: 's1', pharmacyId: 'p1', plan: 'Pro', amount: 2500, status: 'active', startDate: Utils.pastDate(30), endDate: Utils.futureDate(60), waived: false, paidAt: Utils.pastDate(30) },
      { id: 's2', pharmacyId: 'p2', plan: 'Basic', amount: 1000, status: 'active', startDate: Utils.pastDate(20), endDate: Utils.futureDate(10), waived: false, paidAt: Utils.pastDate(20) },
      { id: 's3', pharmacyId: 'p3', plan: 'Premium', amount: 5000, status: 'active', startDate: Utils.pastDate(10), endDate: Utils.futureDate(80), waived: false, paidAt: Utils.pastDate(10) },
      { id: 's4', pharmacyId: 'p4', plan: 'Basic', amount: 1000, status: 'pending', startDate: Utils.today(), endDate: Utils.futureDate(30), waived: false, paidAt: null },
    ],
    drugs: [
      { id: 'd1', pharmacyId: 'p1', name: 'Paracetamol 500mg', category: 'Analgesic', qty: 250, price: 12, mrp: 15, expiry: Utils.futureDate(180), barcode: '8901234567890', manufacturer: 'Cipla', batch: 'B2024-01', hsn: '30049099', lowStockAlert: 50 },
      { id: 'd2', pharmacyId: 'p1', name: 'Amoxicillin 250mg', category: 'Antibiotic', qty: 80, price: 45, mrp: 60, expiry: Utils.futureDate(20), barcode: '8901234567891', manufacturer: 'Sun Pharma', batch: 'B2024-02', hsn: '30041011', lowStockAlert: 30 },
      { id: 'd3', pharmacyId: 'p1', name: 'Metformin 500mg', category: 'Antidiabetic', qty: 120, price: 8, mrp: 10, expiry: Utils.futureDate(365), barcode: '8901234567892', manufacturer: 'Dr. Reddys', batch: 'B2024-03', hsn: '30049099', lowStockAlert: 40 },
      { id: 'd4', pharmacyId: 'p1', name: 'Omeprazole 20mg', category: 'Antacid', qty: 15, price: 22, mrp: 28, expiry: Utils.futureDate(10), barcode: '8901234567893', manufacturer: 'Mankind', batch: 'B2024-04', hsn: '30049099', lowStockAlert: 30 },
      { id: 'd5', pharmacyId: 'p1', name: 'Amlodipine 5mg', category: 'Antihypertensive', qty: 200, price: 18, mrp: 22, expiry: Utils.futureDate(240), barcode: '8901234567894', manufacturer: 'Lupin', batch: 'B2024-05', hsn: '30049099', lowStockAlert: 50 },
      { id: 'd6', pharmacyId: 'p1', name: 'Vitamin D3 60K', category: 'Supplement', qty: 60, price: 35, mrp: 45, expiry: Utils.pastDate(5), barcode: '8901234567895', manufacturer: 'Abbott', batch: 'B2024-06', hsn: '30049099', lowStockAlert: 20 },
      { id: 'd7', pharmacyId: 'p1', name: 'Azithromycin 500mg', category: 'Antibiotic', qty: 45, price: 55, mrp: 70, expiry: Utils.futureDate(75), barcode: '8901234567896', manufacturer: 'Cipla', batch: 'B2024-07', hsn: '30041011', lowStockAlert: 20 },
      { id: 'd8', pharmacyId: 'p2', name: 'Cetirizine 10mg', category: 'Antihistamine', qty: 300, price: 5, mrp: 8, expiry: Utils.futureDate(300), barcode: '8901234567897', manufacturer: 'Hexagon', batch: 'B2024-08', hsn: '30049099', lowStockAlert: 60 },
    ],
    orders: [
      { id: 'o1', pharmacyId: 'p1', patient: 'Rahul Mehta', items: [{name:'Paracetamol 500mg',qty:2,price:12},{name:'Amoxicillin 250mg',qty:1,price:45}], total: 69, status: 'pending', createdAt: Utils.pastDate(0)+'T10:30:00', prescription: true, address: '14 Lotus Nagar, Bangalore' },
      { id: 'o2', pharmacyId: 'p1', patient: 'Sita Devi', items: [{name:'Metformin 500mg',qty:3,price:8},{name:'Amlodipine 5mg',qty:1,price:18}], total: 42, status: 'processing', createdAt: Utils.pastDate(1)+'T14:00:00', prescription: false, address: '7 Gandhi Road, Bangalore' },
      { id: 'o3', pharmacyId: 'p1', patient: 'Arjun Singh', items: [{name:'Omeprazole 20mg',qty:2,price:22}], total: 44, status: 'completed', createdAt: Utils.pastDate(2)+'T09:15:00', prescription: false, address: '33 MG Road, Bangalore' },
      { id: 'o4', pharmacyId: 'p1', patient: 'Kavya Nair', items: [{name:'Azithromycin 500mg',qty:1,price:55},{name:'Vitamin D3 60K',qty:2,price:35}], total: 125, status: 'rejected', createdAt: Utils.pastDate(3)+'T11:45:00', prescription: true, address: '9 Koramangala, Bangalore' },
      { id: 'o5', pharmacyId: 'p1', patient: 'Mohammed Ali', items: [{name:'Cetirizine 10mg',qty:4,price:5}], total: 20, status: 'pending', createdAt: Utils.pastDate(0)+'T16:20:00', prescription: false, address: '55 Infantry Road, Bangalore' },
      { id: 'o6', pharmacyId: 'p1', patient: 'Lakshmi Patel', items: [{name:'Paracetamol 500mg',qty:5,price:12},{name:'Metformin 500mg',qty:2,price:8}], total: 76, status: 'completed', createdAt: Utils.pastDate(4)+'T08:00:00', prescription: true, address: '22 Brigade Road, Bangalore' },
    ],
    documents: [
      { id: 'doc1', pharmacyId: 'p1', orderId: 'o1', type: 'prescription', filename: 'rx_rahul_2024.jpg', status: 'pending', uploadedAt: Utils.pastDate(0), notes: '' },
      { id: 'doc2', pharmacyId: 'p1', orderId: 'o6', type: 'prescription', filename: 'rx_lakshmi_2024.jpg', status: 'approved', uploadedAt: Utils.pastDate(4), notes: 'Verified by Dr. Sharma' },
      { id: 'doc3', pharmacyId: 'p1', orderId: 'o4', type: 'prescription', filename: 'rx_kavya_2024.pdf', status: 'rejected', uploadedAt: Utils.pastDate(3), notes: 'Illegible, please resubmit' },
    ],
    returns: [
      { id: 'r1', pharmacyId: 'p1', orderId: 'o3', patient: 'Arjun Singh', items: 'Omeprazole 20mg x2', reason: 'Wrong medication', status: 'pending', amount: 44, createdAt: Utils.pastDate(1) },
      { id: 'r2', pharmacyId: 'p1', orderId: 'o6', patient: 'Lakshmi Patel', items: 'Paracetamol 500mg x2', reason: 'Product damaged', status: 'approved', amount: 24, createdAt: Utils.pastDate(3) },
    ],
    invoices: [
      { id: 'inv1', pharmacyId: 'p1', orderId: 'o3', patient: 'Arjun Singh', items: [{name:'Omeprazole 20mg',qty:2,price:22,total:44}], subtotal: 44, tax: 2.2, discount: 0, total: 46.2, status: 'paid', createdAt: Utils.pastDate(2), invoiceNo: 'INV-2024-001' },
      { id: 'inv2', pharmacyId: 'p1', orderId: 'o6', patient: 'Lakshmi Patel', items: [{name:'Paracetamol 500mg',qty:5,price:12,total:60},{name:'Metformin 500mg',qty:2,price:8,total:16}], subtotal: 76, tax: 3.8, discount: 5, total: 74.8, status: 'paid', createdAt: Utils.pastDate(4), invoiceNo: 'INV-2024-002' },
      { id: 'inv3', pharmacyId: 'p1', orderId: 'o2', patient: 'Sita Devi', items: [{name:'Metformin 500mg',qty:3,price:8,total:24},{name:'Amlodipine 5mg',qty:1,price:18,total:18}], subtotal: 42, tax: 2.1, discount: 0, total: 44.1, status: 'pending', createdAt: Utils.pastDate(1), invoiceNo: 'INV-2024-003' },
    ],
    tickets: [
      { id: 't1', pharmacyId: 'p1', subject: 'Unable to print invoices', category: 'Technical', status: 'open', priority: 'high', createdAt: Utils.pastDate(2), messages: [
        { sender: 'pharmacy', text: 'I am unable to print invoices from the billing section. The print button does not respond.', at: Utils.pastDate(2)+'T10:00:00' },
        { sender: 'admin', text: 'We are looking into this issue. Could you please share your browser version?', at: Utils.pastDate(1)+'T09:00:00' },
      ]},
      { id: 't2', pharmacyId: 'p1', subject: 'Subscription renewal query', category: 'Billing', status: 'resolved', priority: 'medium', createdAt: Utils.pastDate(7), messages: [
        { sender: 'pharmacy', text: 'My Pro plan is expiring in 5 days. How do I renew?', at: Utils.pastDate(7)+'T14:00:00' },
        { sender: 'admin', text: 'Go to Subscriptions → Renew Plan. Your next cycle will start automatically.', at: Utils.pastDate(6)+'T10:00:00' },
      ]},
      { id: 't3', pharmacyId: 'p2', subject: 'Barcode scanner not working', category: 'Technical', status: 'open', priority: 'low', createdAt: Utils.pastDate(1), messages: [
        { sender: 'pharmacy', text: 'The manual barcode entry field is not accepting 13-digit codes.', at: Utils.pastDate(1)+'T16:00:00' },
      ]},
    ],
    revenue: (() => {
      // Generate last 12 months of revenue data
      const data = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        data.push({
          month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          total: Utils.rand(50000, 200000),
          p1: Utils.rand(20000, 80000),
          p2: Utils.rand(10000, 40000),
          p3: Utils.rand(15000, 70000),
        });
      }
      return data;
    })(),
    settings: { theme: 'dark' },
  };

  /* ---------- Helpers ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn('Storage error:', e); }
  }

  /* ---------- Initialise ---------- */
  let _data = load() || JSON.parse(JSON.stringify(SEED));
  // Always save fresh if nothing stored
  if (!load()) save(_data);

  /* ---------- Public API ---------- */
  return {
    /* Get entire store */
    all() { return _data; },

    /* Get collection */
    get(col) { return _data[col] || []; },

    /* Find one */
    find(col, id) { return (this.get(col)).find(x => x.id === id) || null; },

    /* Find by field */
    where(col, field, val) { return (this.get(col)).filter(x => x[field] === val); },

    /* Add item */
    add(col, item) {
      if (!_data[col]) _data[col] = [];
      _data[col].push(item);
      save(_data);
      return item;
    },

    /* Update item */
    update(col, id, updates) {
      const idx = (_data[col] || []).findIndex(x => x.id === id);
      if (idx === -1) return null;
      _data[col][idx] = { ..._data[col][idx], ...updates };
      save(_data);
      return _data[col][idx];
    },

    /* Remove item */
    remove(col, id) {
      if (!_data[col]) return;
      _data[col] = _data[col].filter(x => x.id !== id);
      save(_data);
    },

    /* Get/set settings */
    setting(key, val) {
      if (val !== undefined) { _data.settings[key] = val; save(_data); }
      return _data.settings[key];
    },

    /* Reset to seed data */
    reset() { _data = JSON.parse(JSON.stringify(SEED)); save(_data); },

    /* Save explicit state */
    flush() { save(_data); },
  };
})();
