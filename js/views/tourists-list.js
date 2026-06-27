/* views/tourists-list.js — Turist listesi */

function renderTouristsList() {
  const tourists = DB.tourists;
  const canEdit  = Auth.canEdit();

  const toolbar = `
  <div class="list-toolbar">
    <div class="list-filters">
      <div class="search-wrap">
        <span class="search-ico">🔍</span>
        <input type="text" id="tSearch" class="form-control search-input" placeholder="Ad, pasaport, uyruk, otel..." oninput="filterTbl()">
      </div>
      <select id="tPayFilter" class="form-control" style="max-width:160px" onchange="filterTbl()">
        <option value="">Tüm Ödemeler</option>
        <option value="ödendi">✅ Ödendi</option>
        <option value="bekliyor">⏳ Bekliyor</option>
        <option value="kısmi">🔶 Kısmi</option>
      </select>
    </div>
    ${canEdit ? `<button class="btn btn-primary" onclick="Router.navigate('/tourist/new')">＋ Turist Ekle</button>` : ''}
  </div>`;

  if (!tourists.length) return toolbar + `
    <div class="empty-state">
      <div class="empty-ico">👥</div>
      <div class="empty-title">Henüz turist eklenmemiş</div>
      <div class="empty-desc">İlk turisti eklemek için "＋ Turist Ekle" butonuna tıklayın.</div>
    </div>`;

  return toolbar + `
  <div class="tbl-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>Turist</th>
          <th>Uyruk</th>
          <th>Pasaport</th>
          <th>Otel</th>
          <th>Turlar</th>
          <th>Check-in</th>
          <th>Ödeme</th>
          <th>Tutar</th>
        </tr>
      </thead>
      <tbody id="tblBody">${_buildRows(tourists)}</tbody>
    </table>
  </div>
  <div style="margin-top:10px;font-size:12px;color:var(--text-muted)" id="tblCount">${tourists.length} turist</div>`;
}

function _buildRows(list) {
  if (!list.length) return `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Sonuç bulunamadı</td></tr>`;
  return list.map(t => {
    const fn  = t.personal.firstName || '';
    const ln  = t.personal.lastName  || '';
    const nm  = `${fn} ${ln}`;
    const col = avatarColor(nm);
    const ini = getInitials(fn, ln);
    const flg = getFlag(t.personal.nationality);
    const ps  = payStatusBadge(t.payment);
    const cur = t.payment?.currency || DB.settings.currency || 'EUR';
    const tourBadges = (t.tours||[]).slice(0,2).map(tr => {
      const tour = DB.tours.find(x => x.id === tr.tourId);
      return `<span class="badge badge-orange" style="font-size:10px">${tour?.icon||'🏷️'} ${tour?.name||'?'}</span>`;
    }).join('') + ((t.tours||[]).length > 2 ? `<span class="badge" style="font-size:10px;background:var(--border);color:var(--text-muted)">+${(t.tours||[]).length-2}</span>` : '');

    return `<tr onclick="Router.navigate('/tourist/${t.id}')">
      <td><div class="tbl-avatar"><div class="tbl-av-circle" style="background:${col}">${ini}</div><div><div style="font-weight:600">${nm}</div><div style="font-size:11px;color:var(--text-muted)">${t.personal.email||'—'}</div></div></div></td>
      <td>${flg} ${t.personal.nationality||'—'}</td>
      <td><code style="font-size:12px">${t.personal.passport||'—'}</code></td>
      <td>${t.hotel?.name||'—'}</td>
      <td><div style="display:flex;gap:3px;flex-wrap:wrap">${tourBadges||'—'}</div></td>
      <td style="font-size:12px">${t.hotel?.checkin||'—'}</td>
      <td><span class="badge ${ps.cls}">${ps.text}</span></td>
      <td style="font-weight:700">${formatCurrency(t.payment?.total, cur)}</td>
    </tr>`;
  }).join('');
}

function filterTbl() {
  const q   = (document.getElementById('tSearch')?.value||'').toLowerCase();
  const pay = document.getElementById('tPayFilter')?.value||'';
  const filtered = DB.tourists.filter(t => {
    const nm = `${t.personal.firstName} ${t.personal.lastName}`.toLowerCase();
    const ok1 = !q || nm.includes(q)
      || (t.personal.passport||'').toLowerCase().includes(q)
      || (t.personal.nationality||'').toLowerCase().includes(q)
      || (t.personal.email||'').toLowerCase().includes(q)
      || (t.hotel?.name||'').toLowerCase().includes(q);
    const ok2 = !pay || t.payment?.status === pay;
    return ok1 && ok2;
  });
  const body  = document.getElementById('tblBody');
  const count = document.getElementById('tblCount');
  if (body) body.innerHTML = _buildRows(filtered);
  if (count) count.textContent = filtered.length === DB.tourists.length
    ? `${filtered.length} turist`
    : `${filtered.length} / ${DB.tourists.length} turist gösteriliyor`;
}
