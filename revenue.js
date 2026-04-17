/* =====================================================
   DORMEDS – Admin Revenue Page
   ===================================================== */

const AdminRevenue = (() => {
  function render() {
    const revenue = Store.get('revenue');
    const pharmacies = Store.get('pharmacies');
    const totalRevenue = revenue.reduce((s, r) => s + r.total, 0);
    const avgMonthly = Math.round(totalRevenue / (revenue.length || 1));
    const bestMonth = revenue.reduce((best, r) => r.total > best.total ? r : best, revenue[0] || {});

    document.getElementById('page-content').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div class="page-header-left">
            <h1>Revenue Analytics</h1>
            <p>Track platform-wide revenue performance.</p>
          </div>
          <button class="btn btn-secondary" onclick="AdminRevenue.exportCSV()">
            <i data-lucide="download"></i> Export CSV
          </button>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          <div class="kpi-card primary">
            <div class="kpi-icon primary"><i data-lucide="indian-rupee"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${Utils.currency(totalRevenue)}</div>
              <div class="kpi-label">Total Revenue (YTD)</div>
            </div>
          </div>
          <div class="kpi-card success">
            <div class="kpi-icon success"><i data-lucide="bar-chart-2"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${Utils.currency(avgMonthly)}</div>
              <div class="kpi-label">Avg Monthly</div>
            </div>
          </div>
          <div class="kpi-card warning">
            <div class="kpi-icon warning"><i data-lucide="zap"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${bestMonth.month || '—'}</div>
              <div class="kpi-label">Best Month</div>
            </div>
          </div>
          <div class="kpi-card info">
            <div class="kpi-icon info"><i data-lucide="building-2"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">${pharmacies.length}</div>
              <div class="kpi-label">Active Partners</div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid-2" style="margin-bottom:var(--sp-6)">
          <div class="chart-card" style="grid-column:1/-1">
            <div class="chart-header">
              <div>
                <div class="chart-title">Monthly Revenue Breakdown</div>
                <div class="chart-subtitle">By pharmacy — last 12 months</div>
              </div>
            </div>
            <div class="chart-canvas-wrap" style="height:280px"><canvas id="rev-bar-chart"></canvas></div>
          </div>
        </div>

        <!-- Per-pharmacy table -->
        <div class="table-container">
          <div class="table-toolbar">
            <span class="table-toolbar-title">Revenue by Pharmacy</span>
          </div>
          <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr><th>Pharmacy</th><th>Plan</th><th>Total Revenue</th><th>Share</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${pharmacies.map(p => {
                const share = totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : 0;
                return `
                  <tr>
                    <td><strong>${Utils.esc(p.name)}</strong></td>
                    <td><span class="badge-pill badge-primary">${p.plan}</span></td>
                    <td style="font-weight:700">${Utils.currency(p.revenue || 0)}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--sp-2)">
                        <div style="flex:1;height:6px;background:var(--bg-elevated);border-radius:var(--radius-full);overflow:hidden">
                          <div style="width:${share}%;height:100%;background:var(--color-primary);border-radius:var(--radius-full)"></div>
                        </div>
                        <span style="font-size:var(--fs-xs);color:var(--text-muted)">${share}%</span>
                      </div>
                    </td>
                    <td>${Utils.statusBadge(p.status)}</td>
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
    drawBarChart(revenue);
  }

  function drawBarChart(revenue) {
    const ctx = document.getElementById('rev-bar-chart');
    if (!ctx) return;
    const theme = document.documentElement.getAttribute('data-theme');
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: revenue.map(r => r.month),
        datasets: [
          { label: 'MedPlus', data: revenue.map(r => r.p1), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 4 },
          { label: 'City Medical', data: revenue.map(r => r.p2), backgroundColor: 'rgba(34,211,238,0.7)', borderRadius: 4 },
          { label: 'Apollo', data: revenue.map(r => r.p3), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: textColor, font: { size: 11 } } } },
        scales: {
          x: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: v => '₹' + (v/1000).toFixed(0) + 'k' } },
        }
      }
    });
  }

  function exportCSV() {
    const pharmacies = Store.get('pharmacies');
    const data = pharmacies.map(p => ({ Name: p.name, Plan: p.plan, Revenue: p.revenue, Status: p.status }));
    Utils.download('dormeds_revenue.csv', Utils.toCSV(data), 'text/csv');
    Toast.success('Exported', 'Revenue data downloaded as CSV.');
  }

  return { render, exportCSV };
})();
