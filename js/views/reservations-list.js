/* views/reservations-list.js — Rezervasyon listesi (v3 Premium Kart) */

function renderReservationsList() {
  const rs = DB.reservations || [];
  const prefView = localStorage.getItem('turTakipResView') || 'grid';

  setTimeout(() => {
    const actions = document.getElementById('headerActions');
    if (actions) {
      let html = `<button class="btn btn-ghost btn-sm" onclick="toggleResView()" style="margin-right:8px">${prefView === 'list' ? '∷ Grid' : '☰ Liste'}</button>`;
      if (Auth.canEdit()) {
        html += `<button class="btn btn-primary" onclick="Router.navigate('/reservation/new')">＋ Yeni Ekle</button>`;
      }
      actions.innerHTML = html;
    }
  }, 0);

  if (rs.length === 0) {
    return `
    <div class="empty-state">
      <div class="empty-ico">👥</div>
      <div class="empty-title">Henüz rezervasyon yok</div>
      <div class="empty-desc">Sisteme yeni bir grup ekleyerek başlayabilirsiniz.</div>
      ${Auth.canEdit() ? `<button class="btn btn-primary" style="margin-top:16px" onclick="Router.navigate('/reservation/new')">＋ Yeni Rezervasyon</button>` : ''}
    </div>`;
  }

  const activeRs = rs.filter(r => r.status !== 'kapandi').sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const closedRs = rs.filter(r => r.status === 'kapandi').sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // newest first

  const buildGrid = (list) => {
    if (list.length === 0) return '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center">Kayıt bulunamadı.</div>';
    
    let gHtml = prefView === 'grid' ? `<div class="tourists-grid">` : `<div>`;
    list.forEach((r, i) => {
      const fn  = r.personal.firstName;
      const ln  = r.personal.lastName;
      const nm  = `${fn} ${ln}`;
      const ini = getInitials(fn, ln);
      const col = avatarColor(nm);
      const sd    = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
      const day   = sd ? sd.getDate() : '—';
      const mon   = sd ? MONTHS_TR[sd.getMonth()].substring(0, 3) : '';
      const status = r.payment?.status || 'bekliyor';
      const stripeClass = status === 'odendi' ? 'paid' : status === 'kismi' ? 'partial' : 'pending';
      
      const PAY_LABELS = {
        'odendi':  { text: '✅ Odendi',       cls: 'paid'    },
        'kismi':   { text: '🔶 Kismi',        cls: 'partial' },
        'bekliyor':{ text: '⏳ Bekliyor',     cls: 'pending' },
      };
      const payLabel = PAY_LABELS[status] || { text: status, cls: 'pending' };

      const cur   = r.payment?.currency || DB.settings?.currency || 'EUR';
      const total = formatCurrency(r.payment?.total || 0, cur);
      const paid  = formatCurrency(r.payment?.paid || 0, cur);

      const icons = [];
      if (r.balloon?.active) icons.push(`<span class="res-card-icon-badge badge-red">🎈 Balon</span>`);
      if (r.tours?.length) {
        const t = DB.tourOptions.find(o => o.id === r.tours[0].tourId);
        if (t) icons.push(`<span class="res-card-icon-badge badge-orange">${t.icon} ${t.name}</span>`);
        if (r.tours.length > 1) icons.push(`<span class="res-card-icon-badge badge-orange">+${r.tours.length-1} tur</span>`);
      }
      if (r.flights?.length) icons.push(`<span class="res-card-icon-badge badge-blue">✈️ ${r.flights.length} Ucus</span>`);
      if (r.transfers?.length) icons.push(`<span class="res-card-icon-badge badge-green">🚌 ${r.transfers.length} Transfer</span>`);
      if (r.hotels?.length) {
        const h = DB.hotelOptions.find(o => o.id === r.hotels[0].hotelId);
        if (h) icons.push(`<span class="res-card-icon-badge badge-purple">🏨 ${h.name.split(' ')[0]}</span>`);
      }

      const guestText = `${r.guestCount || 1} Kisi`;
      const dayText   = `${r.days || 1} Gun`;
      const staggerCls = i < 10 ? `stagger-${(i%5)+1}` : '';
      
      const searchData = [
        nm,
        r.personal.phone || '',
        r.personal.email || '',
        ...(r.guests || []).map(g => (g.firstName||'') + ' ' + (g.lastName||'') + ' ' + (g.passport||''))
      ].join(' ').toLowerCase();

      if (prefView === 'grid') {
        gHtml += `
        <div class="res-card ${staggerCls} searchable-item" data-search="${searchData}" onclick="Router.navigate('/reservation/${r.id}')">
          <div class="res-card-stripe ${stripeClass}"></div>
          <div class="res-card-body">
            <div class="res-card-top">
              <div class="res-card-avatar" style="background:${col}">${ini}</div>
              <div style="flex:1;min-width:0">
                <div class="res-card-name">${nm}</div>
                <div class="res-card-meta">👥 ${guestText} &nbsp;·&nbsp; 📅 ${dayText}</div>
              </div>
              <div class="res-card-date">
                <div class="res-card-date-day">${day}</div>
                <div class="res-card-date-mon">${mon}</div>
              </div>
            </div>
            ${icons.length ? `<div class="res-card-icons">${icons.join('')}</div>` : '<div style="margin-bottom:13px"></div>'}
            <div class="res-card-footer" onclick="event.stopPropagation()">
              <div>
                <div class="res-card-amount">${total}</div>
                <div class="res-card-amount-sub">${paid} odendi</div>
              </div>
              ${Auth.canEdit() ? `
              <button class="quick-pay-btn ${stripeClass}" onclick="cyclePayStatus(event,'${r.id}')">
                ${payLabel.text}
              </button>` : `<span class="quick-pay-btn ${stripeClass}">${payLabel.text}</span>`}
            </div>
          </div>
        </div>`;
      } else {
        gHtml += `
        <div class="res-list-row ${staggerCls} searchable-item" data-search="${searchData}" onclick="Router.navigate('/reservation/${r.id}')">
          <div class="rlr-avatar" style="background:${col}">${ini}</div>
          <div class="rlr-name">${nm} <span class="rlr-sub">• ${guestText} • ${dayText}</span></div>
          <div class="rlr-date">${formatDate(r.startDate)}</div>
          <div class="rlr-badges">${icons.join('')}</div>
          <div class="rlr-pay">
            <span class="badge badge-${stripeClass === 'paid' ? 'green' : stripeClass === 'partial' ? 'orange' : 'gray'}" style="margin-right:8px;cursor:pointer" ${Auth.canEdit() ? `onclick="cyclePayStatus(event,'${r.id}')"` : ''}>${payLabel.text}</span>
            <span style="font-weight:600">${total}</span>
          </div>
          <div class="rlr-arrow">›</div>
        </div>`;
      }
    });
    gHtml += `</div>`;
    return gHtml;
  };

  return `
  <div style="max-width:1200px;margin:0 auto">
    <div style="display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap">
      <div class="tabs" id="listTabs" style="margin-bottom:0; flex:1; min-width:300px">
        <button class="tab-btn active" data-tab="list-aktif" onclick="switchListTab(this,'list-aktif')">🟢 Aktif Dosyalar (${activeRs.length})</button>
        <button class="tab-btn" data-tab="list-arsiv" onclick="switchListTab(this,'list-arsiv')">📦 Arsiv / Kapananlar (${closedRs.length})</button>
      </div>
      <div style="flex-shrink:0; position:relative;">
        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px">🔍</span>
        <input type="text" class="form-control" placeholder="İsim, telefon, pasaport ara..." oninput="filterReservations(this.value)" style="padding-left:36px; min-width:280px; height:100%; border-radius:var(--radius-md)">
      </div>
    </div>
    
    <div class="tab-content active" id="tc-list-aktif">
      ${buildGrid(activeRs)}
    </div>
    
    <div class="tab-content" id="tc-list-arsiv">
      ${buildGrid(closedRs)}
    </div>
  </div>`;
}

function filterReservations(q) {
  const query = (q || '').toLowerCase().trim();
  const items = document.querySelectorAll('.searchable-item');
  items.forEach(el => {
    const text = el.getAttribute('data-search') || '';
    if (text.includes(query)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

function toggleResView() {
  const cur = localStorage.getItem('turTakipResView') || 'grid';
  localStorage.setItem('turTakipResView', cur === 'grid' ? 'list' : 'grid');
  document.getElementById('pageContent').innerHTML = renderReservationsList();
}

function switchListTab(btn, tabId) {
  document.querySelectorAll('#listTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('[id^="tc-list-"]').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}

/* Ödeme durumunu listeden tıkla değiştir */
function cyclePayStatus(event, resId) {
  event.stopPropagation();
  const cycle = { 'bekliyor': 'kısmi', 'kısmi': 'ödendi', 'ödendi': 'bekliyor' };
  const res   = DB.getReservation(resId);
  if (!res) return;
  const next  = cycle[res.payment?.status] || 'bekliyor';
  DB.updateReservation(resId, { payment: { ...res.payment, status: next } });
  // Sayfayı yeniden çiz
  document.getElementById('pageContent').innerHTML = renderReservationsList();
  showNotif(`Ödeme durumu: ${next}`, 'success');
}
