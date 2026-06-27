/* views/year.js — Yıllık takvim görünümü */

function renderYearView(year) {
  const today = todayStr();
  let months  = '';
  for (let m = 0; m < 12; m++) months += _miniCal(year, m, today);

  return `
  <div class="year-header">
    <div>
      <div class="year-title">${year}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:2px">Yıllık Turist Takvimi</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/year/${year-1}')">← ${year-1}</button>
      <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/year/${year+1}')">${year+1} →</button>
      ${Auth.canEdit() ? `<button class="btn btn-primary btn-sm" onclick="Router.navigate('/tourist/new')">＋ Turist Ekle</button>` : ''}
    </div>
  </div>

  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:rgba(249,115,22,.4)"></div><span>Etkinlik olan gün (turuncu)</span></div>
    <div class="legend-item"><span>✈️ Uçuş</span></div>
    <div class="legend-item"><span>🏷️ Tur</span></div>
    <div class="legend-item"><span>🚌 Transfer</span></div>
    <div class="legend-item"><span>🏨 Otel</span></div>
  </div>

  <div class="year-grid">${months}</div>`;
}

function _miniCal(year, month, today) {
  const first   = new Date(year, month, 1);
  const days    = new Date(year, month + 1, 0).getDate();
  let startDow  = first.getDay(); // 0=Sun
  startDow      = startDow === 0 ? 6 : startDow - 1; // Mon-first

  const mPad = String(month + 1).padStart(2, '0');

  let cells = '';
  for (let i = 0; i < startDow; i++) cells += `<div class="mcd empty"></div>`;

  for (let d = 1; d <= days; d++) {
    const dPad = String(d).padStart(2, '0');
    const ds   = `${year}-${mPad}-${dPad}`;
    const isToday   = ds === today;
    const hasEvents = DB.hasEventsOnDate(ds);
    const dow       = (startDow + d - 1) % 7; // 0=Mon
    const isWeekend = dow === 5 || dow === 6;

    let cls = 'mcd';
    if (isToday)   cls += ' today';
    if (hasEvents) cls += ' has-events';
    else if (isWeekend) cls += ' weekend';

    cells += `<div class="${cls}" onclick="Router.navigate('/day/${year}/${mPad}/${dPad}')" title="${ds}">${d}</div>`;
  }

  return `
  <div class="mini-cal">
    <div class="mini-cal-head" onclick="Router.navigate('/month/${year}/${mPad}')" title="${MONTHS_TR[month]} ${year}">${MONTHS_TR[month]}</div>
    <div class="mini-cal-wdays">${WDAYS_SHORT.map(w => `<div class="mini-cal-wday">${w}</div>`).join('')}</div>
    <div class="mini-cal-days">${cells}</div>
  </div>`;
}
