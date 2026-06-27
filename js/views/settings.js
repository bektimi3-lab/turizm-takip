/* views/settings.js — Ayarlar ve Listelerin Yönetimi */

function renderSettingsView() {
  const s = DB.settings || { currency: 'EUR' };
  const can = Auth.canEdit();

  return `
  <div style="max-width:800px;margin:0 auto;padding-bottom:50px">
    
    <div class="card" style="margin-bottom:20px">
      <div class="sec-title">🌍 Genel Ayarlar</div>
      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label">Sistem Para Birimi</label>
          <select id="sysCurrency" class="form-control" ${!can?'disabled':''} onchange="saveSysSettings()">
            <option value="EUR" ${s.currency==='EUR'?'selected':''}>€ EUR</option>
            <option value="USD" ${s.currency==='USD'?'selected':''}>$ USD</option>
            <option value="TRY" ${s.currency==='TRY'?'selected':''}>₺ TRY</option>
          </select>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">
        <div style="color:var(--text-sec);font-size:13px">Tüm verileri silip sistemi sıfırlayabilirsiniz.</div>
        ${can ? `<button class="btn btn-danger btn-sm" onclick="resetAll()">⚠️ Sistemi Sıfırla</button>` : ''}
      </div>
    </div>

    <!-- Akıllı Listeler -->
    <div class="tabs" id="listTabs">
      <button class="tab-btn active" data-tab="list-turlar" onclick="switchListTab(this,'list-turlar')">🏷️ Turlar</button>
      <button class="tab-btn" data-tab="list-ucuslar" onclick="switchListTab(this,'list-ucuslar')">✈️ Uçuşlar</button>
      <button class="tab-btn" data-tab="list-transferler" onclick="switchListTab(this,'list-transferler')">🚌 Transferler</button>
      <button class="tab-btn" data-tab="list-oteller" onclick="switchListTab(this,'list-oteller')">🏨 Oteller</button>
    </div>

    <!-- Turlar -->
    <div class="tab-content active card" id="tc-list-turlar">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
        <div class="sec-title" style="margin:0;border:none;padding:0">Tur Listesi</div>
        ${can ? `<button class="btn btn-primary btn-sm" onclick="addListRow('tourRows', 'tour')">＋ Ekle</button>` : ''}
      </div>
      <div id="tourRows">${renderTourList()}</div>
      ${can ? `<button class="btn btn-secondary" style="margin-top:15px;width:100%" onclick="saveList('tour')">Turları Kaydet</button>` : ''}
    </div>

    <!-- Uçuşlar -->
    <div class="tab-content card" id="tc-list-ucuslar">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
        <div class="sec-title" style="margin:0;border:none;padding:0">Uçuş Listesi (Şablonlar)</div>
        ${can ? `<button class="btn btn-primary btn-sm" onclick="addListRow('flightRows', 'flight')">＋ Ekle</button>` : ''}
      </div>
      <div id="flightRows">${renderFlightList()}</div>
      ${can ? `<button class="btn btn-secondary" style="margin-top:15px;width:100%" onclick="saveList('flight')">Uçuşları Kaydet</button>` : ''}
    </div>

    <!-- Transferler -->
    <div class="tab-content card" id="tc-list-transferler">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
        <div class="sec-title" style="margin:0;border:none;padding:0">Transfer Listesi</div>
        ${can ? `<button class="btn btn-primary btn-sm" onclick="addListRow('transferRows', 'transfer')">＋ Ekle</button>` : ''}
      </div>
      <div id="transferRows">${renderTransferList()}</div>
      ${can ? `<button class="btn btn-secondary" style="margin-top:15px;width:100%" onclick="saveList('transfer')">Transferleri Kaydet</button>` : ''}
    </div>

    <!-- Oteller -->
    <div class="tab-content card" id="tc-list-oteller">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
        <div class="sec-title" style="margin:0;border:none;padding:0">Otel Listesi</div>
        ${can ? `<button class="btn btn-primary btn-sm" onclick="addListRow('hotelRows', 'hotel')">＋ Ekle</button>` : ''}
      </div>
      <div id="hotelRows">${renderHotelList()}</div>
      ${can ? `<button class="btn btn-secondary" style="margin-top:15px;width:100%" onclick="saveList('hotel')">Otelleri Kaydet</button>` : ''}
    </div>

  </div>`;
}

function switchListTab(btn, tabId) {
  document.querySelectorAll('#listTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}

function saveSysSettings() {
  const v = document.getElementById('sysCurrency').value;
  DB.settings = { ...DB.settings, currency: v };
  showNotif('Para birimi güncellendi', 'success');
}

function resetAll() {
  if (!confirm('DİKKAT! Sistemdeki tüm veriler silinecektir. Emin misiniz?')) return;
  localStorage.clear();
  location.reload();
}

/* --- Render List Functions --- */
function renderTourList() {
  return DB.tourOptions.map(t => `
    <div class="list-row list-row-tour" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${t.id}">
      <input type="text" class="form-control l-icon" value="${t.icon}" style="width:60px" placeholder="İkon">
      <input type="text" class="form-control l-name" value="${t.name}" style="flex:1" placeholder="Tur Adı">
      <input type="color" class="form-control l-color" value="${t.color}" style="width:60px;padding:2px">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>
  `).join('');
}

function renderFlightList() {
  return DB.flightOptions.map(f => `
    <div class="list-row list-row-flight" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${f.id}">
      <input type="text" class="form-control l-no" value="${f.flightNo}" style="width:100px" placeholder="Uçuş No">
      <select class="form-control l-dir" style="width:100px">
        <option value="giriş" ${f.direction==='giriş'?'selected':''}>Giriş</option>
        <option value="çıkış" ${f.direction==='çıkış'?'selected':''}>Çıkış</option>
      </select>
      <input type="text" class="form-control l-from" value="${f.fromAirport}" style="flex:1" placeholder="Nereden (Örn: LHR)">
      <input type="text" class="form-control l-to" value="${f.toAirport}" style="flex:1" placeholder="Nereye (Örn: IST)">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>
  `).join('');
}

function renderTransferList() {
  return DB.transferOptions.map(tf => `
    <div class="list-row list-row-transfer" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${tf.id}">
      <input type="text" class="form-control l-name" value="${tf.name}" style="flex:1" placeholder="Transfer Adı (Örn: IST Havalimanı → Otel)">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>
  `).join('');
}

function renderHotelList() {
  return DB.hotelOptions.map(h => `
    <div class="list-row list-row-hotel" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${h.id}">
      <input type="text" class="form-control l-name" value="${h.name}" style="flex:1" placeholder="Otel Adı">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>
  `).join('');
}

function addListRow(containerId, type) {
  let html = '';
  if (type === 'tour') {
    html = `<div class="list-row list-row-tour" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${uuid()}">
      <input type="text" class="form-control l-icon" value="🏷️" style="width:60px" placeholder="İkon">
      <input type="text" class="form-control l-name" value="" style="flex:1" placeholder="Tur Adı">
      <input type="color" class="form-control l-color" value="#f97316" style="width:60px;padding:2px">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>`;
  } else if (type === 'flight') {
    html = `<div class="list-row list-row-flight" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${uuid()}">
      <input type="text" class="form-control l-no" value="" style="width:100px" placeholder="Uçuş No">
      <select class="form-control l-dir" style="width:100px"><option value="giriş">Giriş</option><option value="çıkış">Çıkış</option></select>
      <input type="text" class="form-control l-from" value="" style="flex:1" placeholder="Nereden (Örn: LHR)">
      <input type="text" class="form-control l-to" value="" style="flex:1" placeholder="Nereye (Örn: IST)">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>`;
  } else if (type === 'transfer') {
    html = `<div class="list-row list-row-transfer" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${uuid()}">
      <input type="text" class="form-control l-name" value="" style="flex:1" placeholder="Transfer Adı">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>`;
  } else if (type === 'hotel') {
    html = `<div class="list-row list-row-hotel" style="display:flex;gap:10px;margin-bottom:10px">
      <input type="hidden" class="l-id" value="${uuid()}">
      <input type="text" class="form-control l-name" value="" style="flex:1" placeholder="Otel Adı">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
    </div>`;
  }
  document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
}

function saveList(type) {
  if (type === 'tour') {
    const list = Array.from(document.querySelectorAll('.list-row-tour')).map(row => ({
      id: row.querySelector('.l-id').value,
      icon: row.querySelector('.l-icon').value,
      name: row.querySelector('.l-name').value,
      color: row.querySelector('.l-color').value,
    })).filter(x => x.name.trim());
    DB.tourOptions = list;
    showNotif('Turlar kaydedildi', 'success');
  } 
  else if (type === 'flight') {
    const list = Array.from(document.querySelectorAll('.list-row-flight')).map(row => ({
      id: row.querySelector('.l-id').value,
      flightNo: row.querySelector('.l-no').value,
      direction: row.querySelector('.l-dir').value,
      fromAirport: row.querySelector('.l-from').value,
      toAirport: row.querySelector('.l-to').value,
    })).filter(x => x.flightNo.trim());
    DB.flightOptions = list;
    showNotif('Uçuşlar kaydedildi', 'success');
  }
  else if (type === 'transfer') {
    const list = Array.from(document.querySelectorAll('.list-row-transfer')).map(row => ({
      id: row.querySelector('.l-id').value,
      name: row.querySelector('.l-name').value,
    })).filter(x => x.name.trim());
    DB.transferOptions = list;
    showNotif('Transferler kaydedildi', 'success');
  }
  else if (type === 'hotel') {
    const list = Array.from(document.querySelectorAll('.list-row-hotel')).map(row => ({
      id: row.querySelector('.l-id').value,
      name: row.querySelector('.l-name').value,
    })).filter(x => x.name.trim());
    DB.hotelOptions = list;
    showNotif('Oteller kaydedildi', 'success');
  }
}
