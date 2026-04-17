/* =====================================================
   DORMEDS – Pharmacy Support Page (Ticket System)
   ===================================================== */

const PharmacySupport = (() => {
  let selectedTicketId = null;

  function getPharmId() { return Auth.getUser().pharmacyId || 'p1'; }

  function render() {
    const pid = getPharmId();
    const tickets = Store.where('tickets', 'pharmacyId', pid);
    selectedTicketId = tickets[0]?.id || null;

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Support</h1>
            <p>Get help from our team. Create a ticket and track progress.</p>
          </div>
          <button class="btn btn-primary" onclick="PharmacySupport.openCreate()">
            <i data-lucide="plus"></i> New Ticket
          </button>
        </div>

        <div class="card" style="padding:0;overflow:hidden">
          <div class="chat-wrap" style="height:560px">
            <!-- Ticket sidebar -->
            <div class="chat-sidebar">
              <div style="padding:var(--sp-3);border-bottom:1px solid var(--border)">
                <strong style="font-size:var(--fs-sm)">My Tickets</strong>
              </div>
              <div id="ps-ticket-list">
                ${tickets.length ? tickets.map(t => buildTicketItem(t)).join('') : '<div style="padding:var(--sp-4);font-size:var(--fs-sm);color:var(--text-muted)">No tickets yet.</div>'}
              </div>
            </div>

            <!-- Chat main -->
            <div class="chat-main" id="ps-chat-main">
              ${selectedTicketId ? buildChatMain(Store.find('tickets', selectedTicketId)) : `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--sp-3);color:var(--text-muted)">
                  <i data-lucide="message-circle" style="width:48px;height:48px;opacity:0.4"></i>
                  <p style="font-size:var(--fs-sm)">Select a ticket or create a new one</p>
                  <button class="btn btn-primary" onclick="PharmacySupport.openCreate()">Create Ticket</button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    // Scroll chat to bottom
    const msgs = document.getElementById('ps-chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function buildTicketItem(t) {
    return `
      <div class="chat-ticket${selectedTicketId===t.id?' active':''}" onclick="PharmacySupport.selectTicket('${t.id}')">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2)">
          <div class="chat-ticket-subject" style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(t.subject)}</div>
          ${Utils.statusBadge(t.status)}
        </div>
        <div class="chat-ticket-meta">${Utils.esc(t.category)} · ${Utils.esc(t.priority)} priority · ${Utils.timeAgo(t.createdAt)}</div>
      </div>
    `;
  }

  function buildChatMain(t) {
    if (!t) return '';
    return `
      <div style="padding:var(--sp-4);border-bottom:1px solid var(--border)">
        <div style="font-weight:700">${Utils.esc(t.subject)}</div>
        <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(t.category)} · ${Utils.esc(t.priority)} priority · ${Utils.statusBadge(t.status)}</div>
      </div>
      <div class="chat-messages" id="ps-chat-messages">
        ${(t.messages || []).map(m => `
          <div>
            <div class="chat-msg ${m.sender === 'pharmacy' ? 'me' : 'them'}">
              ${Utils.esc(m.text)}
            </div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);text-align:${m.sender==='pharmacy'?'right':'left'};margin-top:2px">
              ${m.sender === 'pharmacy' ? 'You' : 'Support Team'} · ${Utils.timeAgo(m.at)}
            </div>
          </div>
        `).join('')}
      </div>
      ${t.status === 'open' ? `
        <div class="chat-input-row">
          <input type="text" id="ps-reply-input" placeholder="Type your message…" onkeydown="if(event.key==='Enter')PharmacySupport.sendMsg('${t.id}')" />
          <button class="btn btn-primary" onclick="PharmacySupport.sendMsg('${t.id}')"><i data-lucide="send"></i></button>
        </div>
      ` : '<div style="padding:var(--sp-4);text-align:center;color:var(--text-muted);font-size:var(--fs-sm)">This ticket is resolved.</div>'}
    `;
  }

  function selectTicket(id) {
    selectedTicketId = id;
    const t = Store.find('tickets', id);
    document.getElementById('ps-chat-main').innerHTML = buildChatMain(t);
    document.querySelectorAll('.chat-ticket').forEach(el => el.classList.remove('active'));
    const ticketEl = document.querySelector(`[onclick="PharmacySupport.selectTicket('${id}')"]`);
    if (ticketEl) ticketEl.classList.add('active');
    lucide.createIcons();
    const msgs = document.getElementById('ps-chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function sendMsg(ticketId) {
    const input = document.getElementById('ps-reply-input');
    const text = input.value.trim();
    if (!text) return;
    const tickets = Store.get('tickets');
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    ticket.messages = ticket.messages || [];
    ticket.messages.push({ sender: 'pharmacy', text, at: new Date().toISOString() });
    Store.update('tickets', ticketId, { messages: ticket.messages });
    selectTicket(ticketId);
  }

  function openCreate() {
    App.openModal(`
      <div class="modal-header"><div class="modal-title">New Support Ticket</div><div class="modal-subtitle">Describe your issue and our team will respond shortly.</div></div>
      <div class="modal-body">
        <form onsubmit="PharmacySupport.saveCreate(event)">
          <div class="form-group"><label>Subject*</label>
            <input id="tkt-subject" required placeholder="Brief description of your issue" />
          </div>
          <div class="form-row">
            <div class="form-group"><label>Category*</label>
              <select id="tkt-cat">
                <option>Technical</option>
                <option>Billing</option>
                <option>Orders</option>
                <option>Subscription</option>
                <option>Inventory</option>
                <option>Other</option>
              </select>
            </div>
            <div class="form-group"><label>Priority*</label>
              <select id="tkt-priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Message*</label>
            <textarea id="tkt-msg" rows="4" required placeholder="Provide full details about your issue, including any error messages or steps to reproduce…"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="send"></i> Submit Ticket</button>
          </div>
        </form>
      </div>
    `);
  }

  function saveCreate(e) {
    e.preventDefault();
    const ticket = {
      id: 't' + Utils.uid(),
      pharmacyId: getPharmId(),
      subject: document.getElementById('tkt-subject').value.trim(),
      category: document.getElementById('tkt-cat').value,
      priority: document.getElementById('tkt-priority').value,
      status: 'open',
      createdAt: Utils.today(),
      messages: [{
        sender: 'pharmacy',
        text: document.getElementById('tkt-msg').value.trim(),
        at: new Date().toISOString(),
      }],
    };
    Store.add('tickets', ticket);
    Toast.success('Ticket created', 'Our team will respond within 24 hours.');
    App.closeModal();
    selectedTicketId = ticket.id;
    render();
  }

  return { render, selectTicket, sendMsg, openCreate, saveCreate };
})();
