/* ============================================================
   data.js — v2  (Rezervasyonlar modeli)
   ============================================================ */

/* ---- Sabit listeler (admin yönetebilir) ---- */
const DEFAULT_TOUR_OPTIONS = [
  { id: 'to_1', name: 'Kapadokya Turu',   icon: '🏔️', color: '#f97316' },
  { id: 'to_2', name: 'Boğaz Turu',       icon: '⛵',  color: '#3b82f6' },
  { id: 'to_3', name: 'İstanbul Tarihi',  icon: '🕌',  color: '#a855f7' },
  { id: 'to_4', name: 'Pamukkale Turu',   icon: '🌊',  color: '#06b6d4' },
  { id: 'to_5', name: 'Efes Antik Turu',  icon: '🏛️', color: '#eab308' },
  { id: 'to_6', name: 'Antalya Sahil',    icon: '🏖️', color: '#22c55e' },
];

const DEFAULT_TRANSFER_OPTIONS = [
  { id: 'tf_1', name: 'IST Havalimanı → Otel'  },
  { id: 'tf_2', name: 'SAW Havalimanı → Otel'  },
  { id: 'tf_3', name: 'Otel → IST Havalimanı'  },
  { id: 'tf_4', name: 'Otel → SAW Havalimanı'  },
  { id: 'tf_5', name: 'Havalimanı → Tur Bölgesi' },
];

const DEFAULT_HOTEL_OPTIONS = [
  { id: 'h_1', name: 'Çırağan Palace Hotel'       },
  { id: 'h_2', name: 'Four Seasons Bosphorus'      },
  { id: 'h_3', name: 'Pera Palace Hotel'           },
  { id: 'h_4', name: 'Swissôtel The Bosphorus'     },
  { id: 'h_5', name: 'Hilton İstanbul Bosphorus'   },
];

const DEFAULT_FLIGHT_OPTIONS = [
  { id: 'fo_1', flightNo: 'TK1983', fromAirport: 'IST', toAirport: 'LHR', direction: 'çıkış' },
  { id: 'fo_2', flightNo: 'TK1984', fromAirport: 'LHR', toAirport: 'IST', direction: 'giriş' },
  { id: 'fo_3', flightNo: 'PC282',  fromAirport: 'SAW', toAirport: 'FRA', direction: 'çıkış' },
  { id: 'fo_4', flightNo: 'PC281',  fromAirport: 'FRA', toAirport: 'SAW', direction: 'giriş' },
];

/* ---- Demo Kullanıcılar ---- */
const DEFAULT_USERS = [
  { id: 'u_admin', email: 'admin@turizm.com',     password: 'admin123',     name: 'Admin',         role: 'editor' },
  { id: 'u_view',  email: 'goruntule@turizm.com', password: 'goruntule123', name: 'Görüntüleyici', role: 'viewer' },
];

/* ---- Demo Rezervasyonlar ---- */
function _buildDemoReservations() {
  const now = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const add = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const ts  = () => new Date().toISOString();

  return [
    {
      id: 'res_1',
      personal: { firstName: 'James', lastName: 'Wilson' },
      guestCount: 2,
      guests: [
        { firstName: 'James', lastName: 'Wilson', nationality: 'İngiliz', passport: 'GB123456', dob: '1985-03-15', passportStart: '2020-06-01', passportEnd: '2030-06-01' },
        { firstName: 'Sarah', lastName: 'Wilson', nationality: 'İngiliz', passport: 'GB654321', dob: '1987-09-20', passportStart: '2021-03-01', passportEnd: '2031-03-01' },
      ],
      startDate: fmt(now),
      days: 5,
      tours: [
        { tourId: 'to_1', date: fmt(add(now, 1)) },
        { tourId: 'to_2', date: fmt(add(now, 3)) },
      ],
      balloon: { active: true, count: 2, date: fmt(add(now, 1)) },
      transfers: [
        { transferId: 'tf_1', date: fmt(now),       time: '15:00', note: 'VIP karşılama' },
        { transferId: 'tf_3', date: fmt(add(now,5)), time: '10:00', note: '' },
      ],
      hotels: [{ hotelId: 'h_1', room: '305', checkin: fmt(now), checkout: fmt(add(now,5)) }],
      flights: [
        { id:'f1', flightNo:'TK1234', fromAirport:'LHR', toAirport:'IST', departureTime: fmt(now)+'T08:30', arrivalTime: fmt(now)+'T14:15', direction:'giriş' },
        { id:'f2', flightNo:'TK1235', fromAirport:'IST', toAirport:'LHR', departureTime: fmt(add(now,5))+'T16:00', arrivalTime: fmt(add(now,5))+'T18:30', direction:'çıkış' },
      ],
      payment: { total: 7000, paid: 4000, currency: 'EUR', method: 'kredi kartı', status: 'kısmi' },
      notes: 'Balayı çifti. Özel ilgi gösterilsin.',
      createdAt: ts(), updatedAt: ts(),
    },
    {
      id: 'res_2',
      personal: { firstName: 'Sophie', lastName: 'Müller' },
      guestCount: 1,
      guests: [
        { firstName: 'Sophie', lastName: 'Müller', nationality: 'Alman', passport: 'DE789012', dob: '1990-07-22', passportStart: '2022-01-01', passportEnd: '2032-01-01' },
      ],
      startDate: fmt(add(now,1)),
      days: 3,
      tours: [
        { tourId: 'to_3', date: fmt(add(now,2)) },
        { tourId: 'to_2', date: fmt(add(now,3)) },
      ],
      balloon: { active: false, count: 0, date: '' },
      transfers: [
        { transferId: 'tf_2', date: fmt(add(now,1)), time: '12:00', note: '' },
      ],
      hotels: [{ hotelId: 'h_2', room: '512', checkin: fmt(add(now,1)), checkout: fmt(add(now,4)) }],
      flights: [
        { id:'f3', flightNo:'LH3456', fromAirport:'FRA', toAirport:'SAW', departureTime: fmt(add(now,1))+'T06:45', arrivalTime: fmt(add(now,1))+'T11:00', direction:'giriş' },
      ],
      payment: { total: 1800, paid: 1800, currency: 'EUR', method: 'nakit', status: 'ödendi' },
      notes: '',
      createdAt: ts(), updatedAt: ts(),
    },
    {
      id: 'res_3',
      personal: { firstName: 'Maria', lastName: 'Rodriguez' },
      guestCount: 3,
      guests: [
        { firstName: 'Maria', lastName: 'Rodriguez', nationality: 'İspanyol', passport: 'ES345678', dob: '1978-11-08', passportStart: '2019-05-01', passportEnd: '2029-05-01' },
        { firstName: 'Carlos', lastName: 'Rodriguez', nationality: 'İspanyol', passport: 'ES345679', dob: '1975-02-14', passportStart: '', passportEnd: '' },
        { firstName: 'Ana', lastName: 'Rodriguez', nationality: 'İspanyol', passport: '', dob: '2010-08-30', passportStart: '', passportEnd: '' },
      ],
      startDate: fmt(add(now,-1)),
      days: 4,
      tours: [
        { tourId: 'to_3', date: fmt(now) },
        { tourId: 'to_1', date: fmt(add(now,2)) },
      ],
      balloon: { active: true, count: 2, date: fmt(add(now,2)) },
      transfers: [
        { transferId: 'tf_1', date: fmt(add(now,-1)), time: '17:30', note: '' },
        { transferId: 'tf_3', date: fmt(add(now,3)), time: '09:00', note: 'Çıkış transferi' },
      ],
      hotels: [{ hotelId: 'h_3', room: '201', checkin: fmt(add(now,-1)), checkout: fmt(add(now,3)) }],
      flights: [
        { id:'f4', flightNo:'IB9012', fromAirport:'MAD', toAirport:'IST', departureTime: fmt(add(now,-1))+'T10:20', arrivalTime: fmt(add(now,-1))+'T16:45', direction:'giriş' },
      ],
      payment: { total: 4500, paid: 0, currency: 'EUR', method: 'transfer', status: 'bekliyor' },
      notes: 'Vejetaryen yemek tercihi.',
      createdAt: ts(), updatedAt: ts(),
    },
    {
      id: 'res_4',
      personal: { firstName: 'Kenji', lastName: 'Tanaka' },
      guestCount: 4,
      guests: [
        { firstName: 'Kenji', lastName: 'Tanaka', nationality: 'Japon', passport: 'JP567890', dob: '1985-04-10', passportStart: '2022-03-01', passportEnd: '2032-03-01' },
      ],
      startDate: fmt(add(now,2)),
      days: 5,
      tours: [
        { tourId: 'to_4', date: fmt(add(now,3)) },
        { tourId: 'to_5', date: fmt(add(now,5)) },
      ],
      balloon: { active: false, count: 0, date: '' },
      transfers: [
        { transferId: 'tf_1', date: fmt(add(now,2)), time: '18:30', note: 'Çevirmen eşliğinde' },
      ],
      hotels: [{ hotelId: 'h_4', room: '740', checkin: fmt(add(now,2)), checkout: fmt(add(now,7)) }],
      flights: [
        { id:'f5', flightNo:'TK198', fromAirport:'NRT', toAirport:'IST', departureTime: fmt(add(now,2))+'T10:00', arrivalTime: fmt(add(now,2))+'T17:30', direction:'giriş' },
        { id:'f6', flightNo:'TK197', fromAirport:'IST', toAirport:'NRT', departureTime: fmt(add(now,7))+'T20:00', arrivalTime: fmt(add(now,8))+'T16:00', direction:'çıkış' },
      ],
      payment: { total: 9200, paid: 9200, currency: 'EUR', method: 'transfer', status: 'ödendi' },
      notes: 'Seyahat acentesi grubu.',
      createdAt: ts(), updatedAt: ts(),
    },
  ];
}

/* ---- UUID ---- */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* ---- DB ---- */
const DB = {
  _r(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } },
  _w(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  /* Rezervasyonlar */
  get reservations()   { return this._r('tts_reservations', _buildDemoReservations()); },
  set reservations(v)  { this._w('tts_reservations', v); },

  /* Listeler */
  get tourOptions()    { return this._r('tts_tour_options',     DEFAULT_TOUR_OPTIONS);     },
  set tourOptions(v)   { this._w('tts_tour_options', v);     },
  get transferOptions(){ return this._r('tts_transfer_options', DEFAULT_TRANSFER_OPTIONS); },
  set transferOptions(v){ this._w('tts_transfer_options', v); },
  get hotelOptions()   { return this._r('tts_hotel_options',    DEFAULT_HOTEL_OPTIONS);    },
  set hotelOptions(v)  { this._w('tts_hotel_options', v);    },
  get flightOptions()  { return this._r('tts_flight_options',   DEFAULT_FLIGHT_OPTIONS);   },
  set flightOptions(v) { this._w('tts_flight_options', v);   },

  /* Ayarlar & Kullanıcılar */
  get settings()   { return this._r('tts_settings', { currency: 'EUR' }); },
  set settings(v)  { this._w('tts_settings', v); },
  get users()      { return this._r('tts_users', DEFAULT_USERS); },
  set users(v)     { this._w('tts_users', v); },

  /* ---- Rezervasyon CRUD ---- */
  addReservation(data) {
    const list = this.reservations;
    const r = { ...data, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.push(r); this.reservations = list; return r;
  },
  updateReservation(id, data) {
    const list = this.reservations;
    const i = list.findIndex(r => r.id === id);
    if (i !== -1) { list[i] = { ...list[i], ...data, updatedAt: new Date().toISOString() }; this.reservations = list; return list[i]; }
    return null;
  },
  deleteReservation(id) { this.reservations = this.reservations.filter(r => r.id !== id); },
  getReservation(id)    { return this.reservations.find(r => r.id === id) || null; },

  /* ---- Liste yönetimi (turlar/transferler/oteller) ---- */
  addToList(listKey, item) {
    const l = this[listKey]; l.push({ ...item, id: uuid() }); this[listKey] = l; return l[l.length-1];
  },
  removeFromList(listKey, id) { this[listKey] = this[listKey].filter(x => x.id !== id); },
  updateInList(listKey, id, data) {
    const l = this[listKey]; const i = l.findIndex(x => x.id === id);
    if (i !== -1) { l[i] = { ...l[i], ...data }; this[listKey] = l; }
  },

  /* ---- Takvim: o günkü etkinlikler ---- */
  getEventsForDate(dateStr) {
    const result = [];
    for (const res of this.reservations) {
      const evs = [];
      for (const t of (res.tours||[]))
        if (t.date === dateStr) evs.push({ type:'tour', tourId: t.tourId });
      if (res.balloon?.active && res.balloon?.date === dateStr)
        evs.push({ type:'balloon' });
      for (const tf of (res.transfers||[]))
        if (tf.date === dateStr) evs.push({ type:'transfer', transfer: tf });
      for (const h of (res.hotels||[])) {
        if (h.checkin  === dateStr) evs.push({ type:'checkin',  hotel: h });
        if (h.checkout === dateStr) evs.push({ type:'checkout', hotel: h });
      }
      for (const fl of (res.flights||[])) {
        const dep = (fl.departureTime||'').split('T')[0];
        const arr = (fl.arrivalTime  ||'').split('T')[0];
        if (dep === dateStr || arr === dateStr)
          evs.push({ type:'flight', flight: fl, direction: fl.direction });
      }
      if (evs.length) result.push({ reservation: res, events: evs });
    }
    return result;
  },

  getEventTypesForDate(dateStr) {
    const types = new Set();
    for (const res of this.reservations) {
      for (const t  of (res.tours||[]))     if (t.date === dateStr) types.add('tour');
      if (res.balloon?.active && res.balloon?.date === dateStr) types.add('balloon');
      for (const tf of (res.transfers||[])) if (tf.date === dateStr) types.add('transfer');
      for (const h  of (res.hotels||[]))   { if (h.checkin===dateStr) types.add('checkin'); if (h.checkout===dateStr) types.add('checkout'); }
      for (const fl of (res.flights||[]))  { const dep=(fl.departureTime||'').split('T')[0]; const arr=(fl.arrivalTime||'').split('T')[0]; if (dep===dateStr||arr===dateStr) types.add('flight'); }
    }
    return Array.from(types);
  },

  hasEventsOnDate(dateStr) {
    for (const res of this.reservations) {
      if ((res.tours||[]).some(t=>t.date===dateStr)) return true;
      if (res.balloon?.active && res.balloon?.date===dateStr) return true;
      if ((res.transfers||[]).some(tf=>tf.date===dateStr)) return true;
      if ((res.hotels||[]).some(h=>h.checkin===dateStr||h.checkout===dateStr)) return true;
      if ((res.flights||[]).some(fl=>(fl.departureTime||'').split('T')[0]===dateStr||(fl.arrivalTime||'').split('T')[0]===dateStr)) return true;
    }
    return false;
  },

  /* Kaç rezervasyon bu günde etkinlik var? (Yoğunluk için) */
  getEventCountForDate(dateStr) {
    let count = 0;
    for (const res of this.reservations) {
      const hasTour     = (res.tours||[]).some(t=>t.date===dateStr);
      const hasBalloon  = res.balloon?.active && res.balloon?.date===dateStr;
      const hasTransfer = (res.transfers||[]).some(tf=>tf.date===dateStr);
      const hasHotel    = (res.hotels||[]).some(h=>h.checkin===dateStr||h.checkout===dateStr);
      const hasFlight   = (res.flights||[]).some(fl=>(fl.departureTime||'').split('T')[0]===dateStr||(fl.arrivalTime||'').split('T')[0]===dateStr);
      if (hasTour||hasBalloon||hasTransfer||hasHotel||hasFlight) count++;
    }
    return count;
  },
};
