/* views/tours.js — Tur tanımları yönetimi */

const TOUR_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#06b6d4','#f59e0b','#ef4444','#ec4899','#84cc16','#14b8a6'];
const TOUR_ICONS  = ['🏔️','⛵','🕌','🌊','🏛️','🏖️','🗺️','🎭','🦅','🌄','🏰','🎪','🚢','🎡','🌺'];

function renderToursView() {
  const tours  = DB.tours;
  const canEdit = Auth.canEdit();

  const cards = tours.map(tour => `
  <div class="tour-card">
    <div class="tc-bar" style="background:${tour.color}"></div>
    <div class="tc-icon">${tour.icon||'🗺️'}</div>
    <div class="tc-name">${tour.name}</div>
    <div class="tc-desc">${tour.description||'—'}</div>
    <div class="tc-meta">
      <span style="color:${tour.color};font-size:16px">●</span>
      <span>Süre: ${tour.duration||1} gün</span>
    </div>
    ${canEdit ? `<div class="tc-acts">
      <button class="btn btn-secondary btn-sm" onclick="openTourModal('${tour.id}')">✏️ Düzenle</button>
      <button class="btn btn-danger btn-sm" onclick="delTour('${tour.id}')">🗑️</button>
    </div>` : ''}
  </div>`).join('');

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
    <div style="font-size:13px;color:var(--text-muted)">${tours.length} tur tanımlı</div>
    ${canEdit ? `<button class="btn btn-primary" onclick="openTourModal(null)">＋ Yeni Tur</button>` : ''}
  </div>

  <div class="tours-grid">
    ${cards || `<div class="empty-state"><div class="empty-ico">🗺️</div><div class="empty-title">Tur tanımlanmamış</div></div>`}
  </div>

  <!-- Modal -->
  <div class="modal-overlay" id="tourModalOv" onclick="closeTourModal(event)">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="tourModalTitle">Yeni Tur</div>
        <button class="modal-close" onclick="closeTourModal()">✕</button>
      </div>
      <form id="tourModalForm" onsubmit="saveTour(event)">
        <input type="hidden" id="tmId">
        <div class="form-group">
          <label class="form-label">Tur Adı *</label>
          <input type="text" id="tmName" class="form-control" required placeholder="Örn: Kapadokya Turu">
        </div>
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">İkon</label>
            <div class="icon-grid" id="iconGrid">
              ${TOUR_ICONS.map(ic => `<span class="icon-opt" data-ico="${ic}" onclick="pickIcon('${ic}')">${ic}</span>`).join('')}
            </div>
            <input type="hidden" id="tmIcon" value="${TOUR_ICONS[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Renk</label>
            <div class="color-row" id="colorRow">
              ${TOUR_COLORS.map(c => `<div class="color-dot" data-c="${c}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('')}
            </div>
            <input type="hidden" id="tmColor" value="${TOUR_COLORS[0]}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Süre (Gün)</label>
          <input type="number" id="tmDur" class="form-control" value="1" min="1" max="30" style="max-width:120px">
        </div>
        <div class="form-group">
          <label class="form-label">Açıklama</label>
          <textarea id="tmDesc" class="form-control" rows="3" placeholder="Tur hakkında kısa bilgi..."></textarea>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
          <button type="button" class="btn btn-secondary" onclick="closeTourModal()">İptal</button>
          <button type="submit" class="btn btn-primary">💾 Kaydet</button>
        </div>
      </form>
    </div>
  </div>`;
}

function openTourModal(id) {
  const ov   = document.getElementById('tourModalOv');
  const tour = id ? DB.tours.find(t => t.id === id) : null;
  document.getElementById('tmId').value    = id || '';
  document.getElementById('tourModalTitle').textContent = id ? 'Turu Düzenle' : 'Yeni Tur';
  document.getElementById('tmName').value  = tour?.name || '';
  document.getElementById('tmDur').value   = tour?.duration || 1;
  document.getElementById('tmDesc').value  = tour?.description || '';
  pickIcon(tour?.icon  || TOUR_ICONS[0]);
  pickColor(tour?.color || TOUR_COLORS[0]);
  ov.classList.add('open');
}
function closeTourModal(e) {
  if (e && e.target !== document.getElementById('tourModalOv')) return;
  document.getElementById('tourModalOv').classList.remove('open');
}

function pickIcon(ico) {
  document.getElementById('tmIcon').value = ico;
  document.querySelectorAll('.icon-opt').forEach(el => el.classList.toggle('sel', el.dataset.ico === ico));
}
function pickColor(col) {
  document.getElementById('tmColor').value = col;
  document.querySelectorAll('.color-dot').forEach(el => el.classList.toggle('sel', el.dataset.c === col));
}

function saveTour(e) {
  e.preventDefault();
  const id   = document.getElementById('tmId').value;
  const data = {
    name:        document.getElementById('tmName').value,
    icon:        document.getElementById('tmIcon').value || TOUR_ICONS[0],
    color:       document.getElementById('tmColor').value || TOUR_COLORS[0],
    duration:    parseInt(document.getElementById('tmDur').value) || 1,
    description: document.getElementById('tmDesc').value,
  };
  if (id) { DB.updateTour(id, data); showNotif('Tur güncellendi!','success'); }
  else    { DB.addTour(data);        showNotif('Tur eklendi!','success'); }
  document.getElementById('tourModalOv').classList.remove('open');
  Router.navigate('/tours');
}

function delTour(id) {
  if (!confirm('Bu tur tanımını silmek istediğinizden emin misiniz?')) return;
  DB.deleteTour(id);
  showNotif('Tur silindi.','success');
  Router.navigate('/tours');
}
