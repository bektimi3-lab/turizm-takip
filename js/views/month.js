/* views/month.js — Aylık takvim görünümü */

function renderMonthView(year, month) {
  const today   = todayStr();
  const mPad    = String(month + 1).padStart(2, '0');
  const days    = new Date(year, month + 1, 0).getDate();
  const first   = new Date(year, month, 1);
  let startDow  = first.getDay();
  startDow      = startDow === 0 ? 6 : startDow - 1;

  /* Prev / next */
  let pY = year, pM = month - 1; if (pM < 0)  { pM = 11; pY--; }
  let nY = year, nM = month + 1; if (nM > 11) { nM = 0;  nY++; }

  /* Build grid */
  let cells = '';
  for (let i = 0; i < startDow; i++) cells += `<div class="month-day empty"></div>`;

  for (let d = 1; d <= days; d++) {
    const dPad  = String(d).padStart(2, '0');
    const ds    = `${year}-${mPad}-${dPad}`;
    const isToday = ds === today;
    const evList  = DB.getEventsForDate(ds);
    const hasEv   = evList.length > 0;

    /* collect types & reservation names */
    const types   = new Set();
    const names   = [];
    for (const { reservation, events } of evList) {
      names.push(`${r.personal?.firstName} ${r.personal?.lastName}`);
      events.forEach(e => types.add(e.type));
    }

    /* symbols row */
    const syms = Array.from(types).map(t => `<span class="ev-sym" title="${EV_LABEL[t]||t}">${EV_ICON[t]||'•'}</span>`).join('');

    /* name chips (max 3) */
    const shown = names.slice(0, 3);
    const rest  = names.length - 3;
    const firstType = (evList[0]?.events[0]?.type) || 'tour';
    const chips = shown.map((nm, i) => {
      const tp = evList[i]?.events[0]?.type || 'tour';
      return `<div class="ev-chip ${tp}">${EV_ICON[tp]||''} ${nm.split(' ').pop()}</div>`;
    }).join('');
    const moreChip = rest > 0 ? `<div class="ev-chip more">+${rest}</div>` : '';

    const numEl = isToday
      ? `<div class="mday-num"><span class="today-num">${d}</span></div>`
      : `<div class="mday-num">${d}</div>`;

    let cls = 'month-day';
    if (isToday) cls += ' today';
    if (hasEv)   cls += ' has-ev';

    cells += `
    <div class="${cls}" onclick="Router.navigate('/day/${year}/${mPad}/${dPad}')">
      ${numEl}
      ${hasEv ? `<div class="mday-syms">${syms}</div><div class="mday-chips">${chips}${moreChip}</div>` : ''}
    </div>`;
  }

  let html = `
  <div class="month-header">
    <button class="month-nav" onclick="Router.navigate('/month/${pY}/${String(pM+1).padStart(2,'0')}')">‹</button>
    <div class="month-title-wrap">
      <div class="month-title">${MONTHS_TR[month]} ${year}</div>
      <div class="month-back" onclick="Router.navigate('/year/${year}')">← ${year} yılına dön</div>
    </div>
    <button class="month-nav" onclick="Router.navigate('/month/${nY}/${String(nM+1).padStart(2,'0')}')">›</button>
  </div>

  <div class="month-grid">
    ${WDAYS_SHORT.map(w => `<div class="month-wday">${w}</div>`).join('')}
    ${cells}
  </div>`;

  if (Auth.canEdit()) {
    // Calculate monthly financials
    let mTotal = 0, mPaid = 0;
    const rs = DB.reservations.filter(r => r.status !== 'kapandi');
    rs.forEach(r => {
      if (!r.startDate) return;
      const sd = new Date(r.startDate + 'T00:00:00');
      if (sd.getFullYear() === year && sd.getMonth() === month) {
        mTotal += (r.payment?.total || 0);
        mPaid += (r.payment?.paid || 0);
      }
    });
    const mRemain = mTotal - mPaid;
    const cur = DB.settings.currency || 'EUR';

    html += `
    <div class="card" style="margin-top:20px;display:flex;align-items:center;gap:30px">
      <div style="flex:1">
        <div class="sec-title">💰 Bu Ayki Finansal Özet (${MONTHS_TR[month]} ${year})</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:10px">
          <div><div style="font-size:11px;color:var(--text-muted)">Toplam Beklenen Ciro</div><div style="font-size:18px;font-weight:700">${formatCurrency(mTotal, cur)}</div></div>
          <div><div style="font-size:11px;color:var(--text-muted)">Tahsil Edilen</div><div style="font-size:18px;font-weight:700;color:var(--green)">${formatCurrency(mPaid, cur)}</div></div>
          <div><div style="font-size:11px;color:var(--text-muted)">Kalan Bakiye (Alacak)</div><div style="font-size:18px;font-weight:700;color:${mRemain>0?'var(--red)':'var(--green)'}">${formatCurrency(mRemain, cur)}</div></div>
        </div>
      </div>
    </div>`;
  }

  return html;
}
