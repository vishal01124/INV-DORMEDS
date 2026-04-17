/* =====================================================
   DORMEDS – Admin Support Page
   ===================================================== */

const AdminSupport = (() => {
  let selectedTicket = null;

  function render() {
    const tickets = Store.get('tickets');
    const open = tickets.filter(t => t.status === 'open').length;
    selectedTicket = tickets[0] || null;

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Support Tickets</h1>
            <p>${open} open ticket${open !== 1 ? 's' : ''} require${open === 1 ? 's' : ''} attention.</p>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden">
          <div class="chat-wrap" style="height:560px">
            <!-- Ticket List Sidebar -->
            <div class="chat-sidebar">
              <div style="padding:var(--sp-3);border-bottom:1px solid var(--border)">
                <input type="text" placeholder="Search tickets…" oninput="AdminSupport.search(this.value)" style="font-size:var(--fs-xs)" />
              </div>
              <div id="ticket-list">
                ${tickets.map(t => buildTicketItem(t)).join('')}
              </div>
            </div>

            <!-- Chat Main -->
            <div class="chat-main" id="chat-main">
              ${selectedTicket ? buildChatMain(selectedTicket) : '<div class="table-empty" style="margin:auto"><p>Select a ticket</p></div>'}
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  function buildTicketItem(t) {
    const pharmacies = Store.get('pharmacies');
    const pharm = pharmacies.find(p => p.id === t.pharmacyId);
    return `
      <div class="chat-ticket${selectedTicket && selectedTicket.id === t.id ? ' active' : ''}" onclick="AdminSupport.selectTicket('${t.id}')">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2)">
          <div class="chat-ticket-subject" style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(t.subject)}</div>
          ${Utils.statusBadge(t.status)}
        </div>
        <div class="chat-ticket-meta">${Utils.esc(pharm ? pharm.name : 'Unknown')} · ${Utils.timeAgo(t.createdAt)}</div>
      </div>
    `;
  }

  function buildChatMain(t) {
    const pharmacies = Store.get('pharmacies');
    const pharm = pharmacies.find(p => p.id === t.pharmacyId);
    return `
      <div style="padding:var(--sp-4);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3)">
        <div>
          <div style="font-weight:700">${Utils.esc(t.subject)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${Utils.esc(pharm ? pharm.name : '')} · ${Utils.esc(t.category)} · Priority: ${Utils.esc(t.priority)}</div>
        </div>
        <div style="display:flex;gap:var(--sp-2)">
          ${t.status === 'open'
            ? `<button class="btn btn-sm btn-success" onclick="AdminSupport.resolve('${t.id}')"><i data-lucide="check"></i> Resolve</button>`
            : `<span class="badge-pill badge-success">Resolved</span>`}
        </div>
      </div>
      <div class="chat-messages" id="chat-messages">
        ${(t.messages || []).map(m => `
          <div>
            <div class="chat-msg ${m.sender === 'admin' ? 'me' : 'them'}">
              ${Utils.esc(m.text)}
            </div>
            <div class="chat-msg-time" style="text-align:${m.sender === 'admin' ? 'right' : 'left'};color:var(--text-muted);font-size:var(--fs-xs)">
              ${m.sender === 'admin' ? 'You' : Utils.esc(pharm ? pharm.name : 'Pharmacy')} · ${Utils.timeAgo(m.at)}
            </div>
          </div>
        `).join('')}
      </div>
      ${t.status === 'open' ? `
        <div class="chat-input-row">
          <input type="text" id="reply-input" placeholder="Type your reply…" onkeydown="if(event.key==='Enter')AdminSupport.sendReply('${t.id}')" />
          <button class="btn btn-primary" onclick="AdminSupport.sendReply('${t.id}')">
            <i data-lucide="send"></i>
          </button>
        </div>
      ` : ''}
    `;
  }

  function selectTicket(id) {
    const tickets = Store.get('tickets');
    selectedTicket = tickets.find(t => t.id === id);
    document.getElementById('chat-main').innerHTML = selectedTicket ? buildChatMain(selectedTicket) : '';
    // Update active state
    document.querySelectorAll('.chat-ticket').forEach(el => el.classList.remove('active'));
    document.querySelector(`[onclick="AdminSupport.selectTicket('${id}')"]`)?.classList.add('active');
    lucide.createIcons();
    // Scroll to bottom
    const msgs = document.getElementById('chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function sendReply(ticketId) {
    const input = document.getElementById('reply-input');
    const text = input.value.trim();
    if (!text) return;
    const tickets = Store.get('tickets');
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    ticket.messages = ticket.messages || [];
    ticket.messages.push({ sender: 'admin', text, at: new Date().toISOString() });
    Store.update('tickets', ticketId, { messages: ticket.messages });
    Toast.success('Reply sent');
    selectTicket(ticketId);
  }

  function resolve(id) {
    Store.update('tickets', id, { status: 'resolved' });
    Toast.success('Ticket resolved');
    render();
  }

  function search(val) {
    const tickets = Store.get('tickets');
    const filtered = tickets.filter(t => t.subject.toLowerCase().includes(val.toLowerCase()));
    document.getElementById('ticket-list').innerHTML = filtered.map(buildTicketItem).join('');
  }

  return { render, selectTicket, sendReply, resolve, search };
})();
