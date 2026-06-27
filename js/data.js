/* ============================================================
   data.js — Yerel depolama tabanlı veri katmanı
   ============================================================ */

/* ---- Demo Tur Tanımları ---- */
const DEFAULT_TOURS = [
  { id: 'tour_1', name: 'Kapadokya Turu',    color: '#f97316', icon: '🏔️', duration: 2, description: '2 günlük balon ve vadi gezisi' },
  { id: 'tour_2', name: 'Boğaz Turu',        color: '#3b82f6', icon: '⛵', duration: 1, description: 'Boğaz tekne turu' },
  { id: 'tour_3', name: 'İstanbul Tarihi',   color: '#a855f7', icon: '🕌', duration: 1, description: 'Tarihi yarımada & camiler' },
  { id: 'tour_4', name: 'Pamukkale Turu',    color: '#06b6d4', icon: '🌊', duration: 2, description: '2 günlük Pamukkale & Hierapolis' },
  { id: 'tour_5', name: 'Efes Antik Turu',   color: '#eab308', icon: '🏛️', duration: 1, description: 'Efes antik kenti gezisi' },
  { id: 'tour_6', name: 'Antalya Sahil',     color: '#22c55e', icon: '🏖️', duration: 3, description: '3 günlük sahil tatili' },
];

/* ---- Demo Kullanıcılar ---- */
const DEFAULT_USERS = [
  { id: 'u_admin', email: 'admin@turizm.com',      password: 'admin123',      name: 'Admin Kullanıcı',  role: 'editor' },
  { id: 'u_view',  email: 'goruntule@turizm.com',  password: 'goruntule123',  name: 'Görüntüleyici',    role: 'viewer' },
];

/* ---- Demo Turistler (bugün + yakın günler) ---- */
function _buildDemoTourists() {
  const now   = new Date();
  const fmt   = d => d.toISOString().split('T')[0];
  const add   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const ts    = () => new Date().toISOString();

  return [
    {
      id: 'demo_1',
      personal: { firstName: 'James', lastName: 'Wilson', dob: '1985-03-15', nationality: 'İngiliz', passport: 'GB123456', phone: '+44 7700 900123', email: 'james.wilson@email.com' },
      hotel:    { name: 'Çırağan Palace Hotel', room: '305', checkin: fmt(now), checkout: fmt(add(now, 5)) },
      tours:    [{ tourId: 'tour_1', date: fmt(add(now, 1)) }, { tourId: 'tour_2', date: fmt(add(now, 3)) }],
      flights:  [
        { id: 'f1', flightNo: 'TK1234', fromAirport: 'London Heathrow (LHR)', toAirport: 'İstanbul (IST)', departureTime: fmt(now) + 'T08:30', arrivalTime: fmt(now) + 'T14:15', direction: 'giriş'  },
        { id: 'f2', flightNo: 'TK1235', fromAirport: 'İstanbul (IST)',         toAirport: 'London Heathrow (LHR)', departureTime: fmt(add(now,5)) + 'T16:00', arrivalTime: fmt(add(now,5)) + 'T18:30', direction: 'çıkış' },
      ],
      transfers: [{ id: 'tr1', date: fmt(now), time: '15:00', from: 'IST Havalimanı', to: 'Çırağan Palace Hotel', note: 'VIP karşılama' }],
      payment:  { total: 3500, paid: 2000, currency: 'EUR', method: 'kredi kartı', status: 'kısmi' },
      notes:    'Balayı çifti. Özel ilgi gösterilsin.',
      createdAt: ts(), updatedAt: ts(),
    },
    {
      id: 'demo_2',
      personal: { firstName: 'Sophie', lastName: 'Müller', dob: '1990-07-22', nationality: 'Alman', passport: 'DE789012', phone: '+49 151 23456789', email: 'sophie.mueller@gmail.de' },
      hotel:    { name: 'Four Seasons Bosphorus', room: '512', checkin: fmt(add(now,1)), checkout: fmt(add(now,4)) },
      tours:    [{ tourId: 'tour_3', date: fmt(add(now,2)) }, { tourId: 'tour_2', date: fmt(add(now,3)) }],
      flights:  [{ id: 'f3', flightNo: 'LH3456', fromAirport: 'Frankfurt (FRA)', toAirport: 'İstanbul (SAW)', departureTime: fmt(add(now,1)) + 'T06:45', arrivalTime: fmt(add(now,1)) + 'T11:00', direction: 'giriş' }],
      transfers: [{ id: 'tr2', date: fmt(add(now,1)), time: '12:00', from: 'SAW Havalimanı', to: 'Four Seasons Bosphorus', note: '' }],
      payment:  { total: 1800, paid: 1800, currency: 'EUR', method: 'nakit', status: 'ödendi' },
      notes:    '',
      createdAt: ts(), updatedAt: ts(),
    },
    {
      id: 'demo_3',
      personal: { firstName: 'Maria', lastName: 'Rodriguez', dob: '1978-11-08', nationality: 'İspanyol', passport: 'ES345678', phone: '+34 612 345 678', email: 'maria.rodriguez@correo.es' },
      hotel:    { name: 'Pera Palace Hotel', room: '201', checkin: fmt(add(now,-1)), checkout: fmt(add(now,3)) },
      tours:    [{ tourId: 'tour_3', date: fmt(now) }, { tourId: 'tour_1', date: fmt(add(now,2)) }],
      flights:  [{ id: 'f4', flightNo: 'IB9012', fromAirport: 'Madrid (MAD)', toAirport: 'İstanbul (IST)', departureTime: fmt(add(now,-1)) + 'T10:20', arrivalTime: fmt(add(now,-1)) + 'T16:45', direction: 'giriş' }],
      transfers: [
        { id: 'tr3', date: fmt(add(now,-1)), time: '17:30', from: 'IST Havalimanı',     to: 'Pera Palace Hotel',   note: '' },
        { id: 'tr4', date: fmt(add(now,3)),  time: '09:00', from: 'Pera Palace Hotel',  to: 'IST Havalimanı',      note: 'Çıkış transferi' },
      ],
      payment:  { total: 2200, paid: 0, currency: 'EUR', method: 'transfer', status: 'bekliyor' },
      notes:    'Tek seyahat. Vejetaryen yemek tercihi.',
      createdAt: ts(), updatedAt: ts(),
    },
    {
      id: 'demo_4',
      personal: { firstName: 'Kenji', lastName: 'Tanaka', dob: '1995-04-10', nationality: 'Japon', passport: 'JP567890', phone: '+81 90 1234 5678', email: 'kenji.tanaka@mail.jp' },
      hotel:    { name: 'Swissôtel The Bosphorus', room: '740', checkin: fmt(add(now,2)), checkout: fmt(add(now,7)) },
      tours:    [{ tourId: 'tour_4', date: fmt(add(now,3)) }, { tourId: 'tour_5', date: fmt(add(now,5)) }],
      flights:  [
        { id: 'f5', flightNo: 'TK198', fromAirport: 'Tokyo Narita (NRT)', toAirport: 'İstanbul (IST)', departureTime: fmt(add(now,2)) + 'T10:00', arrivalTime: fmt(add(now,2)) + 'T17:30', direction: 'giriş' },
        { id: 'f6', flightNo: 'TK197', fromAirport: 'İstanbul (IST)', toAirport: 'Tokyo Narita (NRT)', departureTime: fmt(add(now,7)) + 'T20:00', arrivalTime: fmt(add(now,8)) + 'T16:00', direction: 'çıkış' },
      ],
      transfers: [{ id: 'tr5', date: fmt(add(now,2)), time: '18:30', from: 'IST Havalimanı', to: 'Swissôtel The Bosphorus', note: 'Çevirmen eşliğinde' }],
      payment:  { total: 4200, paid: 4200, currency: 'EUR', method: 'transfer', status: 'ödendi' },
      notes:    'Japonya seyahat acentesi grubu koordinatörü.',
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

/* ---- DB Nesnesi ---- */
const DB = {
  _r(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  _w(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  get tourists()  { return this._r('tts_tourists',  _buildDemoTourists()); },
  set tourists(v) { this._w('tts_tourists', v); },

  get tours()     { return this._r('tts_tours',     DEFAULT_TOURS); },
  set tours(v)    { this._w('tts_tours', v); },

  get settings()  { return this._r('tts_settings',  { currency: 'EUR' }); },
  set settings(v) { this._w('tts_settings', v); },

  get users()     { return this._r('tts_users',     DEFAULT_USERS); },
  set users(v)    { this._w('tts_users', v); },

  /* ---- Tourist CRUD ---- */
  addTourist(data) {
    const list = this.tourists;
    const t = { ...data, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.push(t);
    this.tourists = list;
    return t;
  },
  updateTourist(id, data) {
    const list = this.tourists;
    const i = list.findIndex(t => t.id === id);
    if (i !== -1) { list[i] = { ...list[i], ...data, updatedAt: new Date().toISOString() }; this.tourists = list; return list[i]; }
    return null;
  },
  deleteTourist(id) { this.tourists = this.tourists.filter(t => t.id !== id); },
  getTourist(id)    { return this.tourists.find(t => t.id === id) || null; },

  /* ---- Tour CRUD ---- */
  addTour(data)   { const l = this.tours; const t = { ...data, id: uuid() }; l.push(t); this.tours = l; return t; },
  updateTour(id, data) {
    const l = this.tours; const i = l.findIndex(t => t.id === id);
    if (i !== -1) { l[i] = { ...l[i], ...data }; this.tours = l; return l[i]; }
  },
  deleteTour(id)  { this.tours = this.tours.filter(t => t.id !== id); },

  /* ---- Takvim yardımcıları ---- */
  _touristEventDates(tourist) {
    const dates = {};
    const push = (ds, type) => { if (!ds) return; (dates[ds] = dates[ds] || new Set()).add(type); };
    for (const tr of (tourist.tours     || [])) push(tr.date, 'tour');
    for (const fl of (tourist.flights   || [])) {
      push((fl.departureTime || '').split('T')[0], 'flight');
      push((fl.arrivalTime   || '').split('T')[0], 'flight');
    }
    for (const tf of (tourist.transfers || [])) push(tf.date, 'transfer');
    if (tourist.hotel) { push(tourist.hotel.checkin, 'checkin'); push(tourist.hotel.checkout, 'checkout'); }
    return dates;
  },

  getEventsForDate(dateStr) {
    const result = [];
    for (const tourist of this.tourists) {
      const evs = [];
      for (const tr of (tourist.tours     || [])) if (tr.date === dateStr) evs.push({ type: 'tour',     tourId: tr.tourId });
      for (const fl of (tourist.flights   || [])) {
        const dep = (fl.departureTime || '').split('T')[0];
        const arr = (fl.arrivalTime   || '').split('T')[0];
        if (dep === dateStr || arr === dateStr) evs.push({ type: 'flight', flight: fl, direction: fl.direction });
      }
      for (const tf of (tourist.transfers || [])) if (tf.date === dateStr) evs.push({ type: 'transfer', transfer: tf });
      if (tourist.hotel) {
        if (tourist.hotel.checkin  === dateStr) evs.push({ type: 'checkin'  });
        if (tourist.hotel.checkout === dateStr) evs.push({ type: 'checkout' });
      }
      if (evs.length) result.push({ tourist, events: evs });
    }
    return result;
  },

  getEventTypesForDate(dateStr) {
    const types = new Set();
    for (const tourist of this.tourists) {
      const d = this._touristEventDates(tourist);
      if (d[dateStr]) d[dateStr].forEach(t => types.add(t));
    }
    return Array.from(types);
  },

  hasEventsOnDate(dateStr) {
    for (const tourist of this.tourists) {
      const d = this._touristEventDates(tourist);
      if (d[dateStr] && d[dateStr].size > 0) return true;
    }
    return false;
  },
};
