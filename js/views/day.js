/* views/day.js — Günlük etkinlik görünümü */

function renderDayView(dateStr) {
  const [yr, mo, dy] = dateStr.split('-');
  const moInt  = parseInt(mo);
  const mPad   = mo.padStart(2, '0');
  const dPad   = dy.padStart(2, '0');
  const month  = moInt - 1;

  const evList = DB.getEventsForDate(dateStr);

  /* prev / next */
  const d    = new Date(dateStr + 'T00:00:00');
  const prev = new Date(d); prev.setDate(prev.getDate() - 1);
  const next = new Date(d); next.setDate(next.getDate() + 1);
  const prevStr = prev.toISOString().split('T')[0];
  const nextStr = next.toISOString().split('T')[0];
  const fmtPath = s => s.replace(/-/g, '/');

  /* stats */
  let activeFilter = null;
  const tourCnt     = evList.filter(e => e.events.some(ev => ev.type === 'tour')).length;
  const flightCnt   = evList.filter(e => e.events.some(ev => ev.type === 'flight')).length;
  const transferCnt = evList.filter(e => e.events.some(ev => ev.type === 'transfer')).length;
  const balloonCnt  = evList.filter(e => e.events.some(ev => ev.type === 'balloon')).length;
  const checkinCnt  = evList.filter(e => e.events.some(ev => ev.type === 'checkin')).length;
  const totalGuests = evList.reduce((sum, e) => sum + (e.reservation.guestCount || 1), 0);

  /* stat boxes — clickable to filter */
  const stats = `
  <div class="day-stats" id="dayStats">
    <div class="day-stat" style="cursor:pointer" onclick="filterDayCards(null)" title="Tumunu goster">
      <span class="stat-ico">&#x1F465;</span>
      <div><div class="stat-val">${evList.length} Grup</div><div class="stat-lbl">${totalGuests} Kisi</div></div>
    </div>
    ${tourCnt     ? `<div class="day-stat" style="cursor:pointer" onclick="filterDayCards('tour')"     title="Sadece turlar"><span class="stat-ico">&#x1F3F7;&#xFE0F;</span><div><div class="stat-val">${tourCnt}</div><div class="stat-lbl">Tur</div></div></div>` : ''}
    ${balloonCnt  ? `<div class="day-stat" style="cursor:pointer" onclick="filterDayCards('balloon')"  title="Sadece balon"><span class="stat-ico">&#x1F388;</span><div><div class="stat-val">${balloonCnt}</div><div class="stat-lbl">Balon</div></div></div>` : ''}
    ${flightCnt   ? `<div class="day-stat" style="cursor:pointer" onclick="filterDayCards('flight')"   title="Sadece ucuslar"><span class="stat-ico">&#x2708;&#xFE0F;</span><div><div class="stat-val">${flightCnt}</div><div class="stat-lbl">Ucus</div></div></div>` : ''}
    ${transferCnt ? `<div class="day-stat" style="cursor:pointer" onclick="filterDayCards('transfer')" title="Sadece transferler"><span class="stat-ico">&#x1F68C;</span><div><div class="stat-val">${transferCnt}</div><div class="stat-lbl">Transfer</div></div></div>` : ''}
    ${checkinCnt  ? `<div class="day-stat" style="cursor:pointer" onclick="filterDayCards('checkin')"  title="Sadece otel girisleri"><span class="stat-ico">&#x1F3E8;</span><div><div class="stat-val">${checkinCnt}</div><div class="stat-lbl">Otel Giris</div></div></div>` : ''}
  </div>`;


  /* reservation cards */
  let cards = '';
  if (evList.length === 0) {
    cards = `
    <div class="empty-state">
      <div class="empty-ico">📅</div>
      <div class="empty-title">Bu gün etkinlik yok</div>
      <div class="empty-desc">Rezervasyon eklemek için "＋ Rezervasyon Ekle" butonunu kullanın.</div>
      ${Auth.canEdit() ? `<button class="btn btn-primary" style="margin-top:16px" onclick="Router.navigate('/reservation/new')">＋ Rezervasyon Ekle</button>` : ''}
    </div>`;
  } else {
    for (const { reservation, events } of evList) {
      const fn  = reservation.personal?.firstName;
      const ln  = reservation.personal?.lastName;
      const nm  = `${fn} ${ln}`;
      const col = avatarColor(nm);
      const ini = getInitials(fn, ln);
      const guestText = `${reservation.guestCount || 1} Kişi`;
      
      const ps  = payStatusBadge(reservation.payment);
      const cur = reservation.payment?.currency || DB.settings.currency || 'EUR';

      const badgeHtml = events.map(ev => {
        if (ev.type === 'tour') {
          const tour = DB.tourOptions.find(t => t.id === ev.tourId);
          return `<span class="badge badge-orange">${EV_ICON.tour} ${tour?.name || 'Tur'}</span>`;
        }
        if (ev.type === 'balloon') {
          return `<span class="badge badge-red">${EV_ICON.balloon} Balon</span>`;
        }
        if (ev.type === 'flight') {
          const ico = ev.direction === 'giriş' ? '🛬' : '🛫';
          return `<span class="badge badge-blue">${ico} ${ev.flight.flightNo || 'Uçuş'} ${ev.direction}</span>`;
        }
        if (ev.type === 'transfer') return `<span class="badge badge-green">🚌 Transfer ${ev.transfer.time||''}</span>`;
        if (ev.type === 'checkin')  return `<span class="badge badge-purple">🏨 Check-in</span>`;
        if (ev.type === 'checkout') return `<span class="badge badge-yellow">🏨 Check-out</span>`;
        return '';
      }).join('');

      const paid  = reservation.payment?.paid  || 0;
      const total = reservation.payment?.total || 0;

      const cardTypes = events.map(ev => ev.type).join(',');

      cards += `
      <div class="day-tourist-card" data-types="${cardTypes}" onclick="Router.navigate('/reservation/${reservation.id}')">
        <div class="dtc-avatar" style="background:${col}">${ini}</div>
        <div class="dtc-info">
          <div class="dtc-name">${nm} <span style="font-size:13px;font-weight:normal;color:var(--text-muted);margin-left:8px">• ${guestText}</span></div>
          <div class="dtc-meta">${reservation.days} gün · Başlangıç: ${formatDate(reservation.startDate)}</div>
          <div class="dtc-evs">${badgeHtml}</div>
        </div>
        <div class="dtc-right">
          <span class="badge ${ps.cls}" style="display:block;margin-bottom:5px">${ps.text}</span>
          <div style="font-size:12px;color:var(--text-muted)">${formatCurrency(paid,cur)} / ${formatCurrency(total,cur)}</div>
        </div>
        <div class="dtc-arrow">›</div>
      </div>`;
    }
  }

  return `
  <div class="day-header">
    <button class="day-nav" onclick="Router.navigate('/day/${fmtPath(prevStr)}')">← Önceki</button>
    <div class="day-title-wrap">
      <div class="day-title">${parseInt(dy)} ${MONTHS_TR[month]} ${yr}</div>
      <div class="day-sub">${trDayName(dateStr)} &nbsp;·&nbsp;
        <span onclick="Router.navigate('/month/${yr}/${mPad}')" style="cursor:pointer;color:var(--primary);text-decoration:underline">Aya git ↑</span>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      ${Auth.canEdit() ? `<button class="btn btn-primary btn-sm" onclick="Router.navigate('/reservation/new')">＋ Rezervasyon Ekle</button>` : ''}
      <button class="day-nav" onclick="Router.navigate('/day/${fmtPath(nextStr)}')">Sonraki →</button>
    </div>
  </div>

  ${stats}
  <div id="dayCards">${cards}</div>
  <div id="filterLabel" style="font-size:12px;color:var(--text-muted);margin-top:8px;text-align:center;display:none">
    Filtre aktif - <a href="#" style="color:var(--orange)" onclick="filterDayCards(null);return false;">Temizle (tumunu goster)</a>
  </div>`;
}

function filterDayCards(type) {
  const allCards = document.querySelectorAll('.day-tourist-card[data-types]');
  const label = document.getElementById('filterLabel');
  
  // Reset stat box highlights
  document.querySelectorAll('#dayStats .day-stat').forEach((s,i) => {
    s.style.opacity = '1';
    s.style.outline = 'none';
  });

  if (!type) {
    allCards.forEach(c => c.style.display = '');
    if (label) label.style.display = 'none';
    return;
  }

  allCards.forEach(c => {
    const types = (c.dataset.types || '').split(',');
    c.style.display = types.includes(type) ? '' : 'none';
  });

  if (label) {
    const labelMap = { tour:'Tur', balloon:'Balon', flight:'Ucus', transfer:'Transfer', checkin:'Otel Giris', checkout:'Otel Cikis' };
    label.style.display = 'block';
    label.innerHTML = `<strong>${labelMap[type] || type}</strong> filtresi aktif. <a href="#" style="color:var(--orange)" onclick="filterDayCards(null);return false;">Temizle (tumunu goster)</a>`;
  }
}
