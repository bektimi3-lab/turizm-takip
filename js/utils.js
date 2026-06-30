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

  // Log history
  let logs = JSON.parse(localStorage.getItem('turTakipLogs') || '[]');
  logs.unshift({ msg, type, time: new Date().toISOString() });
  if (logs.length > 20) logs = logs.slice(0, 20); // Keep last 20
  localStorage.setItem('turTakipLogs', JSON.stringify(logs));
  
  // Update badge if panel is closed
  const panel = document.getElementById('notifPanel');
  const badge = document.getElementById('notifBadge');
  if (panel && panel.style.display === 'none' && badge) {
    badge.textContent = parseInt(badge.textContent || 0) + 1;
    badge.style.display = 'inline-block';
  } else if (panel && panel.style.display !== 'none') {
    renderNotifList();
  }
}

function toggleNotifPanel() {
  const p = document.getElementById('notifPanel');
  if (!p) return;
  if (p.style.display === 'none') {
    p.style.display = 'flex';
    document.getElementById('notifBadge').style.display = 'none';
    document.getElementById('notifBadge').textContent = '0';
    renderNotifList();
  } else {
    p.style.display = 'none';
  }
}

function clearNotifs() {
  localStorage.removeItem('turTakipLogs');
  renderNotifList();
}

function renderNotifList() {
  const list = JSON.parse(localStorage.getItem('turTakipLogs') || '[]');
  const container = document.getElementById('notifList');
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px">Henüz işlem yok.</div>';
    return;
  }
  container.innerHTML = list.map(l => `
    <div style="padding:10px;border-bottom:1px solid var(--border);font-size:12px;display:flex;align-items:flex-start;gap:8px;transition:background var(--ease)">
      <span style="font-size:14px;margin-top:1px">${l.type==='success'?'✅':(l.type==='error'?'❌':'ℹ️')}</span>
      <div>
        <div style="font-weight:500;margin-bottom:2px;color:var(--text)">${l.msg}</div>
        <div style="font-size:10.5px;color:var(--text-muted)">${formatDateTime(l.time)}</div>
      </div>
    </div>
  `).join('');
}

/* Türkçe gün adı */
function trDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { weekday:'long' });
}
