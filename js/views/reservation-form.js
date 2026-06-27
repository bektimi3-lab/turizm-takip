/* views/reservation-form.js — Rezervasyon Ekle / Düzenle */

let _guestCount = 1;
let _trc = 0, _frc = 0, _tfc = 0, _htc = 0;

function initFormCounters(res) {
  _guestCount = res?.guestCount || 1;
  _trc = (res?.tours     || []).length;
  _frc = (res?.flights   || []).length;
  _tfc = (res?.transfers || []).length;
  _htc = (res?.hotels    || []).length;
}

function renderReservationForm(res) {
  const isNew = !res;
  const t = res || {
    personal: {}, guests: [], hotel: {},
    tours: [], flights: [], transfers: [], hotels: [],
    balloon: { active:false, count:0, date:'' },
    payment: { total:0, paid:0, currency: DB.settings.currency||'EUR', method:'nakit', status:'bekliyor' },
    notes: '', days: 1, startDate: todayStr(), guestCount: 1
  };

  const g = (n) => t.personal[n] || '';

  return `
  <div style="max-width:860px;margin:0 auto">
    <div style="margin-bottom:14px">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">← Geri</button>
    </div>

    <form id="resForm" onsubmit="saveReservationForm(event,'${res?.id||''}')">

      <!-- Temel Bilgiler -->
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title">Rezervasyon Bilgileri</div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Grup Adı (Baş Kişi Adı) *</label><input name="firstName" type="text" class="form-control" value="${g('firstName')}" required placeholder="Ad"></div>
          <div class="form-group"><label class="form-label">Grup Soyadı *</label><input name="lastName" type="text" class="form-control" value="${g('lastName')}" required placeholder="Soyad"></div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label">Kişi Sayısı *</label><input id="guestCountInput" name="guestCount" type="number" min="1" class="form-control" value="${t.guestCount}" required onchange="updateGuestRows()"></div>
          <div class="form-group"><label class="form-label">Başlangıç Tarihi *</label><input name="startDate" type="date" class="form-control" value="${t.startDate}" required></div>
          <div class="form-group"><label class="form-label">Gün Sayısı *</label><input name="days" type="number" min="1" class="form-control" value="${t.days}" required></div>
        </div>
      </div>

      <!-- Yolcular -->
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title">👥 Yolcular (İsteğe Bağlı Detaylar)</div>
        <div id="guestsContainer">
          ${renderGuestRows(t)}
        </div>
      </div>

      <!-- Balon -->
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title">🎈 Balon Seçeneği</div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label">Balon Var Mı?</label>
            <select name="balActive" class="form-control">
              <option value="false" ${!t.balloon?.active ? 'selected' : ''}>Hayır</option>
              <option value="true" ${t.balloon?.active ? 'selected' : ''}>Evet</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Kaç Kişi?</label><input name="balCount" type="number" class="form-control" value="${t.balloon?.count||''}"></div>
          <div class="form-group"><label class="form-label">Tarih</label><input name="balDate" type="date" class="form-control" value="${t.balloon?.date||''}"></div>
        </div>
      </div>

      <!-- Oteller -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">🏨 Oteller</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addHotelRow()">＋ Otel Ekle</button>
        </div>
        <div id="hotelRows">${(t.hotels||[]).map((h,i) => _hotelRow(i, h)).join('') || '<div id="noHotels" style="color:var(--text-muted);font-size:13px">Henüz otel eklenmedi.</div>'}</div>
      </div>

      <!-- Turlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">🏷️ Turlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTourRow()">＋ Tur Ekle</button>
        </div>
        <div id="tourRows">${(t.tours||[]).map((tr,i) => _tourRow(i, tr)).join('') || '<div id="noTours" style="color:var(--text-muted);font-size:13px">Henüz tur eklenmedi.</div>'}</div>
      </div>

      <!-- Uçuşlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">✈️ Uçuşlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addFlightRow()">＋ Uçuş Ekle</button>
        </div>
        <div id="flightRows">${(t.flights||[]).map((f,i) => _flightRow(i, f)).join('') || '<div id="noFlights" style="color:var(--text-muted);font-size:13px">Henüz uçuş eklenmedi.</div>'}</div>
      </div>

      <!-- Transferler -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">🚌 Transferler</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTransferRow()">＋ Transfer Ekle</button>
        </div>
        <div id="transferRows">${(t.transfers||[]).map((tf,i) => _transferRow(i, tf)).join('') || '<div id="noTransfers" style="color:var(--text-muted);font-size:13px">Henüz transfer eklenmedi.</div>'}</div>
      </div>

      <!-- Ödeme -->
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title">💳 Ödeme</div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label">Toplam Tutar</label><input name="total" type="number" class="form-control" value="${t.payment?.total||''}" placeholder="0" min="0" step="0.01"></div>
          <div class="form-group"><label class="form-label">Ödenen</label><input name="paid" type="number" class="form-control" value="${t.payment?.paid||''}" placeholder="0" min="0" step="0.01"></div>
          <div class="form-group"><label class="form-label">Para Birimi</label>
            <select name="currency" class="form-control">
              <option value="EUR" ${(t.payment?.currency||'EUR')==='EUR'?'selected':''}>€ EUR</option>
              <option value="USD" ${t.payment?.currency==='USD'?'selected':''}>$ USD</option>
              <option value="TRY" ${t.payment?.currency==='TRY'?'selected':''}>₺ TRY</option>
            </select>
          </div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Yöntem</label>
            <select name="payMethod" class="form-control">
              <option value="nakit"       ${t.payment?.method==='nakit'       ?'selected':''}>💵 Nakit</option>
              <option value="kredi kartı" ${t.payment?.method==='kredi kartı' ?'selected':''}>💳 Kredi Kartı</option>
              <option value="transfer"    ${t.payment?.method==='transfer'    ?'selected':''}>🏦 Banka Transferi</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Durum</label>
            <select name="payStatus" class="form-control">
              <option value="bekliyor" ${t.payment?.status==='bekliyor'?'selected':''}>⏳ Bekliyor</option>
              <option value="kısmi"    ${t.payment?.status==='kısmi'   ?'selected':''}>🔶 Kısmi Ödeme</option>
              <option value="ödendi"   ${t.payment?.status==='ödendi'  ?'selected':''}>✅ Ödendi</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Notlar -->
      <div class="card" style="margin-bottom:20px">
        <div class="sec-title">📝 Notlar</div>
        <div class="form-group" style="margin:0">
          <textarea name="notes" class="form-control" rows="4" placeholder="Özel istekler, dikkat edilecek hususlar...">${t.notes||''}</textarea>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:10px;justify-content:flex-end;padding-bottom:30px">
        <button type="button" class="btn btn-secondary" onclick="history.back()">İptal</button>
        <button type="submit" class="btn btn-primary">${isNew ? '✅ Rezervasyon Ekle' : '💾 Kaydet'}</button>
      </div>
    </form>
  </div>`;
}

function updateGuestRows() {
  const count = parseInt(document.getElementById('guestCountInput').value) || 1;
  const container = document.getElementById('guestsContainer');
  let currentRows = container.children.length;
  
  if (count > currentRows) {
    for(let i=currentRows; i<count; i++) {
      container.insertAdjacentHTML('beforeend', _guestRow(i, {}));
    }
  } else if (count < currentRows) {
    while(container.children.length > count) {
      container.removeChild(container.lastChild);
    }
  }
}

function renderGuestRows(res) {
  let html = '';
  const count = res.guestCount || 1;
  for(let i=0; i<count; i++) {
    const g = res.guests?.[i] || {};
    html += _guestRow(i, g);
  }
  return html;
}

function _guestRow(i, g) {
  return `
  <div class="guest-row" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="font-size:12px;font-weight:700;color:var(--text-sec);margin-bottom:12px">Yolcu ${i+1}</div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><input type="text" name="g_fn_${i}" class="form-control" value="${g.firstName||''}" placeholder="Ad"></div>
      <div class="form-group" style="margin:0"><input type="text" name="g_ln_${i}" class="form-control" value="${g.lastName||''}" placeholder="Soyad"></div>
    </div>
    <div class="form-row form-row-3" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><input type="text" name="g_nat_${i}" class="form-control" value="${g.nationality||''}" placeholder="Uyruk (örn: İngiliz)"></div>
      <div class="form-group" style="margin:0"><input type="text" name="g_pass_${i}" class="form-control" value="${g.passport||''}" placeholder="Pasaport No"></div>
      <div class="form-group" style="margin:0"><input type="date" name="g_dob_${i}" class="form-control" value="${g.dob||''}" title="Doğum Tarihi"></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Pasaport Başlangıç</label><input type="date" name="g_pstart_${i}" class="form-control" value="${g.passportStart||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Pasaport Bitiş</label><input type="date" name="g_pend_${i}" class="form-control" value="${g.passportEnd||''}"></div>
    </div>
  </div>`;
}

function loadTemplateData(select, type, idx) {
  const val = select.value;
  if (!val) return;
  const row = select.closest('[id$="-'+idx+'"]');
  if (!row) return;

  if (type === 'hotel') {
    const opt = DB.hotelOptions.find(o => o.id === val);
  } else if (type === 'flight') {
    const opt = DB.flightOptions.find(o => o.id === val);
    if(opt) {
      row.querySelector(`[name="flNo_${idx}"]`).value = opt.flightNo;
      row.querySelector(`[name="flDir_${idx}"]`).value = opt.direction;
      row.querySelector(`[name="flFrom_${idx}"]`).value = opt.fromAirport;
      row.querySelector(`[name="flTo_${idx}"]`).value = opt.toAirport;
    }
  } else if (type === 'transfer') {
    const opt = DB.transferOptions.find(o => o.id === val);
    if (opt) {
      const parts = opt.name.split('→');
      if (parts.length === 2) {
        row.querySelector(`[name="tfFrom_${idx}"]`).value = parts[0].trim();
        row.querySelector(`[name="tfTo_${idx}"]`).value = parts[1].trim();
      }
    }
  }
}

function _hotelRow(idx, h={}) {
  const opts = DB.hotelOptions.map(o => `<option value="${o.id}" ${o.id===h.hotelId?'selected':''}>🏨 ${o.name}</option>`).join('');
  return `<div class="h-row" id="hr-${idx}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <select name="hotelId_${idx}" class="form-control" style="max-width:300px" onchange="loadTemplateData(this,'hotel','${idx}')"><option value="">— Otel Seç / Şablon —</option>${opts}</select>
      <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('hr-${idx}').remove()">Kaldır</button>
    </div>
    <div class="form-row form-row-3">
      <div class="form-group" style="margin:0"><label class="form-label">Oda No</label><input type="text" name="hRoom_${idx}" class="form-control" value="${h.room||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Check-in</label><input type="date" name="hIn_${idx}" class="form-control" value="${h.checkin||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Check-out</label><input type="date" name="hOut_${idx}" class="form-control" value="${h.checkout||''}"></div>
    </div>
  </div>`;
}

function _tourRow(idx, tr={}) {
  const opts = DB.tourOptions.map(t => `<option value="${t.id}" ${t.id===tr.tourId?'selected':''}>${t.icon} ${t.name}</option>`).join('');
  return `<div class="t-row" id="tr-${idx}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px;display:flex;gap:10px;align-items:end">
    <div class="form-group" style="margin:0;flex:1"><label class="form-label">Tur</label>
      <select name="tourId_${idx}" class="form-control"><option value="">— Seç —</option>${opts}</select>
    </div>
    <div class="form-group" style="margin:0;flex:1"><label class="form-label">Tarih</label>
      <input type="date" name="tourDate_${idx}" class="form-control" value="${tr.date||''}">
    </div>
    <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('tr-${idx}').remove()" style="margin-bottom:1px">🗑️</button>
  </div>`;
}

function _flightRow(idx, f={}) {
  const opts = DB.flightOptions.map(o => `<option value="${o.id}">✈️ ${o.flightNo} (${o.fromAirport}→${o.toAirport})</option>`).join('');
  return `<div class="f-row" id="fr-${idx}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <select class="form-control" style="max-width:300px" onchange="loadTemplateData(this,'flight','${idx}')"><option value="">— Şablondan Doldur —</option>${opts}</select>
      <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('fr-${idx}').remove()">Kaldır</button>
    </div>
    <div class="form-row form-row-3" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Uçuş No</label><input type="text" name="flNo_${idx}" class="form-control" value="${f.flightNo||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Yön</label>
        <select name="flDir_${idx}" class="form-control">
          <option value="giriş"  ${f.direction==='giriş' ?'selected':''}>🛬 Giriş (Varış)</option>
          <option value="çıkış"  ${f.direction==='çıkış' ?'selected':''}>🛫 Çıkış (Kalkış)</option>
        </select>
      </div>
      <div></div>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Kalkış Havalimanı</label><input type="text" name="flFrom_${idx}" class="form-control" value="${f.fromAirport||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Varış Havalimanı</label><input type="text" name="flTo_${idx}" class="form-control" value="${f.toAirport||''}"></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group" style="margin:0"><label class="form-label">Kalkış Zamanı</label><input type="datetime-local" name="flDep_${idx}" class="form-control" value="${f.departureTime||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Varış Zamanı</label><input type="datetime-local" name="flArr_${idx}" class="form-control" value="${f.arrivalTime||''}"></div>
    </div>
  </div>`;
}

function _transferRow(idx, tf={}) {
  const opts = DB.transferOptions.map(o => `<option value="${o.id}">🚌 ${o.name}</option>`).join('');
  return `<div class="tf-row" id="tfr-${idx}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <select name="transferId_${idx}" class="form-control" style="max-width:300px" onchange="loadTemplateData(this,'transfer','${idx}')"><option value="">— Şablondan Doldur / Seç —</option>${opts}</select>
      <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('tfr-${idx}').remove()">Kaldır</button>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Nereden</label><input type="text" name="tfFrom_${idx}" class="form-control" value="${tf.from||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Nereye</label><input type="text" name="tfTo_${idx}" class="form-control" value="${tf.to||''}"></div>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Tarih</label><input type="date" name="tfDate_${idx}" class="form-control" value="${tf.date||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Saat</label><input type="time" name="tfTime_${idx}" class="form-control" value="${tf.time||''}"></div>
    </div>
    <div class="form-group" style="margin:0"><label class="form-label">Not</label><input type="text" name="tfNote_${idx}" class="form-control" value="${tf.note||''}"></div>
  </div>`;
}

function addHotelRow()    { document.getElementById('noHotels')?.remove();    document.getElementById('hotelRows').insertAdjacentHTML('beforeend',_hotelRow(_htc++)); }
function addTourRow()     { document.getElementById('noTours')?.remove();     document.getElementById('tourRows').insertAdjacentHTML('beforeend',_tourRow(_trc++)); }
function addFlightRow()   { document.getElementById('noFlights')?.remove();   document.getElementById('flightRows').insertAdjacentHTML('beforeend',_flightRow(_frc++)); }
function addTransferRow() { document.getElementById('noTransfers')?.remove(); document.getElementById('transferRows').insertAdjacentHTML('beforeend',_transferRow(_tfc++)); }

function saveReservationForm(e, existingId) {
  e.preventDefault();
  const form = document.getElementById('resForm');
  const fd   = new FormData(form);
  const g    = n => fd.get(n) || '';

  const guestCount = parseInt(g('guestCount')) || 1;
  const guests = [];
  for(let i=0; i<guestCount; i++) {
    guests.push({
      firstName: g(`g_fn_${i}`), lastName: g(`g_ln_${i}`),
      nationality: g(`g_nat_${i}`), passport: g(`g_pass_${i}`), dob: g(`g_dob_${i}`),
      passportStart: g(`g_pstart_${i}`), passportEnd: g(`g_pend_${i}`)
    });
  }

  const hotels = Array.from(form.querySelectorAll('.h-row')).map(row => {
    const i = row.id.split('-')[1];
    return { hotelId: g('hotelId_'+i), room: g('hRoom_'+i), checkin: g('hIn_'+i), checkout: g('hOut_'+i) };
  }).filter(x => x.hotelId);

  const tours = Array.from(form.querySelectorAll('.t-row')).map(row => {
    const i = row.id.split('-')[1];
    return { tourId: g('tourId_'+i), date: g('tourDate_'+i) };
  }).filter(x => x.tourId);

  const flights = Array.from(form.querySelectorAll('.f-row')).map(row => {
    const i = row.id.split('-')[1];
    return { id: uuid(), flightNo: g('flNo_'+i), direction: g('flDir_'+i), fromAirport: g('flFrom_'+i), toAirport: g('flTo_'+i), departureTime: g('flDep_'+i), arrivalTime: g('flArr_'+i) };
  }).filter(x => x.flightNo);

  const transfers = Array.from(form.querySelectorAll('.tf-row')).map(row => {
    const i = row.id.split('-')[1];
    return { transferId: g('transferId_'+i), from: g('tfFrom_'+i), to: g('tfTo_'+i), date: g('tfDate_'+i), time: g('tfTime_'+i), note: g('tfNote_'+i) };
  }).filter(x => x.from || x.to || x.transferId);

  const data = {
    personal: { firstName: g('firstName'), lastName: g('lastName') },
    guestCount, guests,
    startDate: g('startDate'), days: parseInt(g('days'))||1,
    balloon: { active: g('balActive')==='true', count: parseInt(g('balCount'))||0, date: g('balDate') },
    hotels, tours, flights, transfers,
    payment: { total: parseFloat(g('total'))||0, paid: parseFloat(g('paid'))||0, currency: g('currency')||'EUR', method: g('payMethod'), status: g('payStatus') },
    notes: g('notes')
  };

  if (existingId) {
    DB.updateReservation(existingId, data);
    showNotif('Rezervasyon güncellendi!', 'success');
    Router.navigate('/reservation/' + existingId);
  } else {
    const nr = DB.addReservation(data);
    showNotif('Rezervasyon eklendi!', 'success');
    Router.navigate('/reservation/' + nr.id);
  }
}
