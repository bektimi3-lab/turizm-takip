/* views/tourist-form.js — Turist ekle / düzenle formu */

let _trc = 0, _frc = 0, _tfc = 0; /* Row counters */

function initFormCounters(tourist) {
  _trc = (tourist?.tours     || []).length;
  _frc = (tourist?.flights   || []).length;
  _tfc = (tourist?.transfers || []).length;
}

function renderTouristForm(tourist) {
  const isNew = !tourist;
  const t = tourist || {
    personal: {}, hotel: {},
    tours: [], flights: [], transfers: [],
    payment: { total:0, paid:0, currency: DB.settings.currency||'EUR', method:'nakit', status:'bekliyor' },
    notes: '',
  };

  const tourOpts = () => DB.tours.map(x => `<option value="${x.id}">${x.icon} ${x.name}</option>`).join('');

  const tourRows = (t.tours||[]).map((tr,i) => _tourRow(i, tr.tourId, tr.date)).join('');
  const flRows   = (t.flights||[]).map((f,i) => _flightRow(i, f)).join('');
  const tfRows   = (t.transfers||[]).map((tf,i) => _transferRow(i, tf)).join('');

  const g = (n) => t.personal[n] || '';

  return `
  <div style="max-width:820px;margin:0 auto">
    <div style="margin-bottom:14px">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">← Geri</button>
    </div>

    <form id="touristForm" onsubmit="saveTouristForm(event,'${tourist?.id||''}')">

      <!-- Kişisel -->
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title">👤 Kişisel Bilgiler</div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Ad *</label><input name="firstName" type="text" class="form-control" value="${g('firstName')}" required placeholder="Ad"></div>
          <div class="form-group"><label class="form-label">Soyad *</label><input name="lastName" type="text" class="form-control" value="${g('lastName')}" required placeholder="Soyad"></div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label">Doğum Tarihi</label><input name="dob" type="date" class="form-control" value="${g('dob')}"></div>
          <div class="form-group"><label class="form-label">Uyruk</label>
            <input name="nationality" type="text" class="form-control" value="${g('nationality')}" placeholder="Örn: İngiliz" list="natList">
            <datalist id="natList">
              ${['İngiliz','Alman','Fransız','İspanyol','İtalyan','Amerikan','Japon','Çinli','Rus','Hollandalı','Avustralyalı','Kanadalı','Türk','Suudi','Emiratli'].map(n=>`<option>${n}</option>`).join('')}
            </datalist>
          </div>
          <div class="form-group"><label class="form-label">Pasaport No</label><input name="passport" type="text" class="form-control" value="${g('passport')}" placeholder="Pasaport No"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Telefon</label><input name="phone" type="tel" class="form-control" value="${g('phone')}" placeholder="+44 ..."></div>
          <div class="form-group"><label class="form-label">E-posta</label><input name="email" type="email" class="form-control" value="${g('email')}" placeholder="ornek@email.com"></div>
        </div>
      </div>

      <!-- Konaklama -->
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title">🏨 Konaklama</div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Otel Adı</label><input name="hotelName" type="text" class="form-control" value="${t.hotel?.name||''}" placeholder="Otel adı"></div>
          <div class="form-group"><label class="form-label">Oda No</label><input name="hotelRoom" type="text" class="form-control" value="${t.hotel?.room||''}" placeholder="Oda No"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Check-in</label><input name="checkin" type="date" class="form-control" value="${t.hotel?.checkin||''}"></div>
          <div class="form-group"><label class="form-label">Check-out</label><input name="checkout" type="date" class="form-control" value="${t.hotel?.checkout||''}"></div>
        </div>
      </div>

      <!-- Turlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">🏷️ Turlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTourRow()">＋ Tur Ekle</button>
        </div>
        <div id="tourRows">${tourRows || '<div id="noTours" style="color:var(--text-muted);font-size:13px">Henüz tur eklenmedi.</div>'}</div>
      </div>

      <!-- Uçuşlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">✈️ Uçuşlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addFlightRow()">＋ Uçuş Ekle</button>
        </div>
        <div id="flightRows">${flRows || '<div id="noFlights" style="color:var(--text-muted);font-size:13px">Henüz uçuş eklenmedi.</div>'}</div>
      </div>

      <!-- Transferler -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">🚌 Transferler</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTransferRow()">＋ Transfer Ekle</button>
        </div>
        <div id="transferRows">${tfRows || '<div id="noTransfers" style="color:var(--text-muted);font-size:13px">Henüz transfer eklenmedi.</div>'}</div>
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
        <button type="submit" class="btn btn-primary">${isNew ? '✅ Turist Ekle' : '💾 Kaydet'}</button>
      </div>
    </form>
  </div>`;
}

/* ---- Row builders ---- */
function _tourRow(idx, tourId='', date='') {
  const opts = DB.tours.map(t => `<option value="${t.id}" ${t.id===tourId?'selected':''}>${t.icon} ${t.name}</option>`).join('');
  return `<div class="t-row" id="tr-${idx}" style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-bottom:10px">
    <div class="form-group" style="margin:0"><label class="form-label">Tur</label>
      <select name="tourId_${idx}" class="form-control"><option value="">— Seç —</option>${opts}</select>
    </div>
    <div class="form-group" style="margin:0"><label class="form-label">Tarih</label>
      <input type="date" name="tourDate_${idx}" class="form-control" value="${date}">
    </div>
    <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('tr-${idx}').remove()" title="Kaldır" style="margin-bottom:1px">🗑️</button>
  </div>`;
}

function _flightRow(idx, f={}) {
  return `<div class="f-row" id="fr-${idx}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--text-sec)">✈️ Uçuş ${idx+1}</div>
      <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('fr-${idx}').remove()">Kaldır</button>
    </div>
    <div class="form-row form-row-3" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Uçuş No</label><input type="text" name="flNo_${idx}" class="form-control" value="${f.flightNo||''}" placeholder="TK1234"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Yön</label>
        <select name="flDir_${idx}" class="form-control">
          <option value="giriş"  ${f.direction==='giriş' ?'selected':''}>🛬 Giriş (Varış)</option>
          <option value="çıkış"  ${f.direction==='çıkış' ?'selected':''}>🛫 Çıkış (Kalkış)</option>
        </select>
      </div>
      <div></div>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Kalkış Havalimanı</label><input type="text" name="flFrom_${idx}" class="form-control" value="${f.fromAirport||''}" placeholder="Örn: London Heathrow (LHR)"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Varış Havalimanı</label><input type="text" name="flTo_${idx}" class="form-control" value="${f.toAirport||''}" placeholder="Örn: İstanbul (IST)"></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group" style="margin:0"><label class="form-label">Kalkış Zamanı</label><input type="datetime-local" name="flDep_${idx}" class="form-control" value="${f.departureTime||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Varış Zamanı</label><input type="datetime-local" name="flArr_${idx}" class="form-control" value="${f.arrivalTime||''}"></div>
    </div>
  </div>`;
}

function _transferRow(idx, tf={}) {
  return `<div class="tf-row" id="tfr-${idx}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--text-sec)">🚌 Transfer ${idx+1}</div>
      <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('tfr-${idx}').remove()">Kaldır</button>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Nereden</label><input type="text" name="tfFrom_${idx}" class="form-control" value="${tf.from||''}" placeholder="Havalimanı / Otel adı"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Nereye</label><input type="text" name="tfTo_${idx}" class="form-control" value="${tf.to||''}" placeholder="Havalimanı / Otel adı"></div>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><label class="form-label">Tarih</label><input type="date" name="tfDate_${idx}" class="form-control" value="${tf.date||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Saat</label><input type="time" name="tfTime_${idx}" class="form-control" value="${tf.time||''}"></div>
    </div>
    <div class="form-group" style="margin:0"><label class="form-label">Not</label><input type="text" name="tfNote_${idx}" class="form-control" value="${tf.note||''}" placeholder="Araç, sürücü notu..."></div>
  </div>`;
}

/* ---- Add row handlers ---- */
function addTourRow()     { document.getElementById('noTours')?.remove();     document.getElementById('tourRows').insertAdjacentHTML('beforeend',_tourRow(_trc++)); }
function addFlightRow()   { document.getElementById('noFlights')?.remove();   document.getElementById('flightRows').insertAdjacentHTML('beforeend',_flightRow(_frc++)); }
function addTransferRow() { document.getElementById('noTransfers')?.remove(); document.getElementById('transferRows').insertAdjacentHTML('beforeend',_transferRow(_tfc++)); }

/* ---- Save ---- */
function saveTouristForm(e, existingId) {
  e.preventDefault();
  const form = document.getElementById('touristForm');
  const fd   = new FormData(form);
  const g    = n => fd.get(n) || '';

  /* Tours */
  const tours = Array.from(form.querySelectorAll('.t-row')).map(row => {
    const i = row.id.split('-')[1];
    return { tourId: g('tourId_'+i), date: g('tourDate_'+i) };
  }).filter(x => x.tourId);

  /* Flights */
  const flights = Array.from(form.querySelectorAll('.f-row')).map(row => {
    const i = row.id.split('-')[1];
    return { id: uuid(), flightNo: g('flNo_'+i), direction: g('flDir_'+i), fromAirport: g('flFrom_'+i), toAirport: g('flTo_'+i), departureTime: g('flDep_'+i), arrivalTime: g('flArr_'+i) };
  }).filter(x => x.flightNo);

  /* Transfers */
  const transfers = Array.from(form.querySelectorAll('.tf-row')).map(row => {
    const i = row.id.split('-')[1];
    return { id: uuid(), from: g('tfFrom_'+i), to: g('tfTo_'+i), date: g('tfDate_'+i), time: g('tfTime_'+i), note: g('tfNote_'+i) };
  }).filter(x => x.from || x.to);

  const data = {
    personal: { firstName: g('firstName'), lastName: g('lastName'), dob: g('dob'), nationality: g('nationality'), passport: g('passport'), phone: g('phone'), email: g('email') },
    hotel:    { name: g('hotelName'), room: g('hotelRoom'), checkin: g('checkin'), checkout: g('checkout') },
    tours, flights, transfers,
    payment:  { total: parseFloat(g('total'))||0, paid: parseFloat(g('paid'))||0, currency: g('currency')||'EUR', method: g('payMethod'), status: g('payStatus') },
    notes:    g('notes'),
  };

  if (existingId) {
    DB.updateTourist(existingId, data);
    showNotif('Turist güncellendi!', 'success');
    Router.navigate('/tourist/' + existingId);
  } else {
    const nt = DB.addTourist(data);
    showNotif('Turist eklendi!', 'success');
    Router.navigate('/tourist/' + nt.id);
  }
}
