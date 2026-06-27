/* views/stats.js — İstatistikler ve Denetim Kayıtları (Sadece Patron) */

function renderStatsView() {
  if (!Auth.isOwner()) {
    return `<div class="empty-state">
      <div class="empty-ico">🔒</div>
      <div class="empty-title">Erişim Engellendi</div>
      <div class="empty-desc">Bu sayfayı yalnızca Patron rolündeki kullanıcılar görüntüleyebilir.</div>
    </div>`;
  }

  const rs = DB.reservations;
  const cur = DB.settings.currency || 'EUR';

  // Finans
  let total = 0, paid = 0;
  rs.forEach(r => { total += (r.payment?.total||0); paid += (r.payment?.paid||0); });
  const remain = total - paid;
  
  // Basit SVG Donut
  const pct = total > 0 ? (paid / total) * 100 : 0;
  const strokeDash = `${pct} 100`;

  const donutSVG = `
    <svg viewBox="0 0 36 36" style="width:140px;height:140px">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" stroke-width="3" />
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--green)" stroke-width="3" stroke-dasharray="${strokeDash}" />
      <text x="18" y="20.5" text-anchor="middle" fill="var(--text)" font-size="7" font-weight="800">%${pct.toFixed(0)}</text>
    </svg>
  `;

  // Tur popülerliği
  const tourCounts = {};
  rs.forEach(r => {
    (r.tours||[]).forEach(t => {
      const opt = DB.tourOptions.find(o => o.id === t.tourId);
      const name = opt ? opt.name : 'Diğer';
      tourCounts[name] = (tourCounts[name] || 0) + 1;
    });
  });
  const tArr = Object.entries(tourCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxTour = tArr.length ? tArr[0][1] : 1;
  const toursHTML = tArr.map(([name, count]) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${name}</span> <span style="color:var(--text-muted)">${count} Rez.</span>
      </div>
      <div style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden">
        <div style="height:100%;background:var(--orange);width:${(count/maxTour)*100}%;border-radius:3px"></div>
      </div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Henüz veri yok.</div>';

  // Audit Logs
  const logs = DB.auditLogs;
  const logsEditHTML = logs.filter(l => l.action !== 'görüntüledi').map(l => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:13px">
      <div style="color:var(--text-muted);min-width:110px">${formatDateTime(l.time)}</div>
      <div><strong>${l.userName}</strong> (${l.userRole}) <span style="color:var(--text-sec)">${l.details}</span> kaydını <strong>${l.action}</strong>.</div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Kayıt yok.</div>';

  const logsViewHTML = logs.filter(l => l.action === 'görüntüledi').slice(0,100).map(l => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:13px">
      <div style="color:var(--text-muted);min-width:110px">${formatDateTime(l.time)}</div>
      <div><strong>${l.userName}</strong> (${l.userRole}) <span style="color:var(--text-sec)">${l.details}</span> profiline baktı.</div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Kayıt yok.</div>';

  return `
  <div style="max-width:960px;margin:0 auto;padding-bottom:50px">

    <div class="tabs" id="statsTabs">
      <button class="tab-btn active" data-tab="st-genel" onclick="switchStatsTab(this,'st-genel')">📊 Genel İstatistikler</button>
      <button class="tab-btn" data-tab="st-denetim" onclick="switchStatsTab(this,'st-denetim')">🔍 Denetim (Audit Log)</button>
    </div>

    <!-- Sekme: Genel -->
    <div class="tab-content active" id="tc-st-genel">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px,1fr));gap:20px">
        
        <div class="card" style="display:flex;align-items:center;gap:30px">
          <div>${donutSVG}</div>
          <div style="flex:1">
            <div class="sec-title">Finansal Özet (Tüm Zamanlar)</div>
            <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-muted)">Toplam Ciro</div><div style="font-size:18px;font-weight:700">${formatCurrency(total, cur)}</div></div>
            <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-muted)">Tahsil Edilen</div><div style="font-size:18px;font-weight:700;color:var(--green)">${formatCurrency(paid, cur)}</div></div>
            <div><div style="font-size:11px;color:var(--text-muted)">Kalan Alacak</div><div style="font-size:18px;font-weight:700;color:var(--red)">${formatCurrency(remain, cur)}</div></div>
          </div>
        </div>

        <div class="card">
          <div class="sec-title">En Popüler Turlar</div>
          ${toursHTML}
        </div>

      </div>
    </div>

    <!-- Sekme: Denetim Kayıtları -->
    <div class="tab-content" id="tc-st-denetim">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <div class="sec-title">✏️ Düzenleme Geçmişi</div>
          <div style="max-height:500px;overflow-y:auto;padding-right:10px">${logsEditHTML}</div>
        </div>
        <div class="card">
          <div class="sec-title">👁️ Görüntüleme Geçmişi (Son 100)</div>
          <div style="max-height:500px;overflow-y:auto;padding-right:10px">${logsViewHTML}</div>
        </div>
      </div>
    </div>

  </div>`;
}

function switchStatsTab(btn, tabId) {
  document.querySelectorAll('#statsTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('#tc-st-genel, #tc-st-denetim').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}
