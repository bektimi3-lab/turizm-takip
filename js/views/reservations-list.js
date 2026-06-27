/* views/reservations-list.js — Rezervasyon listesi */

function renderReservationsList() {
  const rs = DB.reservations || [];
  
  if (rs.length === 0) {
    return `
    <div class="empty-state">
      <div class="empty-ico">👥</div>
      <div class="empty-title">Henüz rezervasyon yok</div>
      <div class="empty-desc">Sisteme yeni bir grup ekleyerek başlayabilirsiniz.</div>
      ${Auth.canEdit() ? `<button class="btn btn-primary" style="margin-top:16px" onclick="Router.navigate('/reservation/new')">＋ Yeni Rezervasyon</button>` : ''}
    </div>`;
  }

  let html = `<div class="tourists-grid">`;
  
  rs.sort((a,b) => new Date(a.startDate) - new Date(b.startDate)).forEach(r => {
    const fn  = r.personal.firstName;
    const ln  = r.personal.lastName;
    const nm  = `${fn} ${ln}`;
    const ini = getInitials(fn, ln);
    const col = avatarColor(nm);

    // Etiketler: Sadece ilk tur veya öne çıkan bir özellik eklenebilir.
    let tags = [];
    if (r.balloon?.active) {
      tags.push(`<span class="badge badge-red">🎈 Balon</span>`);
    }
    if (r.tours?.length) {
      const tOption = DB.tourOptions.find(opt => opt.id === r.tours[0].tourId);
      if (tOption) tags.push(`<span class="badge badge-orange">${tOption.icon} ${tOption.name}</span>`);
    }

    const ps  = payStatusBadge(r.payment);
    const cur = r.payment?.currency || DB.settings.currency || 'EUR';
    const total = formatCurrency(r.payment?.total || 0, cur);

    html += `
    <div class="tourist-card" onclick="Router.navigate('/reservation/${r.id}')">
      <div class="tc-header">
        <div class="tc-avatar" style="background:${col}">${ini}</div>
        <div class="tc-info">
          <div class="tc-name">${nm}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">
            ${r.guestCount} Kişi · ${r.days} Gün · ${formatDate(r.startDate)}
          </div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:4px;flex-wrap:wrap">
        ${tags.join('')}
      </div>
      <div class="tc-footer" style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;">
        <span class="badge ${ps.cls}">${ps.text}</span>
        <span style="font-weight:600;font-size:15px;color:var(--text-main)">${total}</span>
      </div>
    </div>`;
  });

  html += `</div>`;
  
  // Header Actions
  setTimeout(() => {
    const actions = document.getElementById('headerActions');
    if (actions) {
      actions.innerHTML = Auth.canEdit() 
        ? `<button class="btn btn-primary" onclick="Router.navigate('/reservation/new')">＋ Yeni Ekle</button>`
        : '';
    }
  }, 0);

  return html;
}
