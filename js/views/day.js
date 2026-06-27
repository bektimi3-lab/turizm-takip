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
  const tourCnt     = evList.filter(e => e.events.some(ev => ev.type === 'tour')).length;
  const flightCnt   = evList.filter(e => e.events.some(ev => ev.type === 'flight')).length;
  const transferCnt = evList.filter(e => e.events.some(ev => ev.type === 'transfer')).length;

  /* stat boxes */
  const stats = `
  <div class="day-stats">
    <div class="day-stat"><span class="stat-ico">👥</span><div><div class="stat-val">${evList.length}</div><div class="stat-lbl">Turist</div></div></div>
    ${tourCnt     ? `<div class="day-stat"><span class="stat-ico">🏷️</span><div><div class="stat-val">${tourCnt}</div><div class="stat-lbl">Tur</div></div></div>` : ''}
    ${flightCnt   ? `<div class="day-stat"><span class="stat-ico">✈️</span><div><div class="stat-val">${flightCnt}</div><div class="stat-lbl">Uçuş</div></div></div>` : ''}
    ${transferCnt ? `<div class="day-stat"><span class="stat-ico">🚌</span><div><div class="stat-val">${transferCnt}</div><div class="stat-lbl">Transfer</div></div></div>` : ''}
  </div>`;

  /* tourist cards */
  let cards = '';
  if (evList.length === 0) {
    cards = `
    <div class="empty-state">
      <div class="empty-ico">📅</div>
      <div class="empty-title">Bu gün etkinlik yok</div>
      <div class="empty-desc">Turist eklemek için "＋ Turist Ekle" butonunu kullanın.</div>
      ${Auth.canEdit() ? `<button class="btn btn-primary" style="margin-top:16px" onclick="Router.navigate('/tourist/new')">＋ Turist Ekle</button>` : ''}
    </div>`;
  } else {
    for (const { tourist, events } of evList) {
      const fn  = tourist.personal.firstName;
      const ln  = tourist.personal.lastName;
      const nm  = `${fn} ${ln}`;
      const col = avatarColor(nm);
      const ini = getInitials(fn, ln);
      const flg = getFlag(tourist.personal.nationality);
      const ps  = payStatusBadge(tourist.payment);
      const cur = tourist.payment?.currency || DB.settings.currency || 'EUR';

      const badgeHtml = events.map(ev => {
        if (ev.type === 'tour') {
          const tour = DB.tours.find(t => t.id === ev.tourId);
          return `<span class="badge badge-orange">${EV_ICON.tour} ${tour?.name || 'Tur'}</span>`;
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

      const paid  = tourist.payment?.paid  || 0;
      const total = tourist.payment?.total || 0;

      cards += `
      <div class="day-tourist-card" onclick="Router.navigate('/tourist/${tourist.id}')">
        <div class="dtc-avatar" style="background:${col}">${ini}</div>
        <div class="dtc-info">
          <div class="dtc-name">${nm}</div>
          <div class="dtc-meta">${flg} ${tourist.personal.nationality||'—'} · 🛂 ${tourist.personal.passport||'—'} · 🏨 ${tourist.hotel?.name||'—'}</div>
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
        <span onclick="Router.navigate('/month/${yr}/${mPad}')">Aya git ↑</span>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      ${Auth.canEdit() ? `<button class="btn btn-primary btn-sm" onclick="Router.navigate('/tourist/new')">＋ Turist Ekle</button>` : ''}
      <button class="day-nav" onclick="Router.navigate('/day/${fmtPath(nextStr)}')">Sonraki →</button>
    </div>
  </div>

  ${stats}
  <div id="dayCards">${cards}</div>`;
}
