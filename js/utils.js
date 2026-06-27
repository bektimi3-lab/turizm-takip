/* utils.js — Yardımcı fonksiyonlar */

const MONTHS_TR   = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const WDAYS_SHORT = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

const EV_ICON  = { tour:'🏷️', flight:'✈️', transfer:'🚌', checkin:'🏨', checkout:'🏨', balloon:'🎈' };
const EV_LABEL = { tour:'Tur', flight:'Uçuş', transfer:'Transfer', checkin:'Check-in', checkout:'Check-out', balloon:'Balon' };

const NAT_FLAG = {
  'İngiliz':'🇬🇧','Alman':'🇩🇪','Fransız':'🇫🇷','İspanyol':'🇪🇸','İtalyan':'🇮🇹',
  'Amerikan':'🇺🇸','Japon':'🇯🇵','Çinli':'🇨🇳','Rus':'🇷🇺','Hollandalı':'🇳🇱',
  'Belçikalı':'🇧🇪','Türk':'🇹🇷','Avustralyalı':'🇦🇺','Kanadalı':'🇨🇦',
  'İsveçli':'🇸🇪','Norveçli':'🇳🇴','Danimarkalı':'🇩🇰','Finlandiyalı':'🇫🇮',
  'Polonyalı':'🇵🇱','Portekizli':'🇵🇹','Suudi':'🇸🇦','Emiratli':'🇦🇪',
  'Körfez':'🇶🇦','Brezilya':'🇧🇷','Arjantinli':'🇦🇷','Meksikalı':'🇲🇽',
};

const AVATAR_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#06b6d4','#f59e0b','#ef4444','#ec4899','#84cc16','#14b8a6'];

function getFlag(nat)     { return NAT_FLAG[nat] || '🌍'; }
function getInitials(fn, ln) { return ((fn||'')[0]||'').toUpperCase() + ((ln||'')[0]||'').toUpperCase(); }
function avatarColor(name) {
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

function formatDate(ds) {
  if (!ds) return '—';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' });
}
function formatDateTime(dts) {
  if (!dts) return '—';
  try {
    const d = new Date(dts);
    return d.toLocaleString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  } catch { return dts; }
}
function formatCurrency(amount, currency) {
  const sym = { EUR:'€', USD:'$', TRY:'₺' }[currency] || currency || '';
  return `${sym}${Number(amount||0).toLocaleString('tr-TR', { minimumFractionDigits:0, maximumFractionDigits:2 })}`;
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

function payStatusBadge(payment) {
  if (!payment) return { text:'Bilinmiyor', cls:'badge-yellow' };
  return {
    'ödendi':  { text:'✅ Ödendi',        cls:'badge-green'  },
    'bekliyor':{ text:'⏳ Bekliyor',      cls:'badge-yellow' },
    'kısmi':   { text:'🔶 Kısmi Ödeme',  cls:'badge-orange' },
  }[payment.status] || { text: payment.status, cls:'badge-yellow' };
}

function showNotif(msg, type='success') {
  document.querySelectorAll('.notif').forEach(n => n.remove());
  const el = document.createElement('div');
  el.className = `notif ${type}`;
  el.innerHTML = `<span>${type==='success'?'✅':'❌'}</span><span>${msg}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
}

/* Türkçe gün adı */
function trDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { weekday:'long' });
}
