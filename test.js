const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

const html = '<div id=\"app\"></div>';
const dom = new JSDOM(html, { runScripts: 'dangerously' });
const window = dom.window;

window.localStorage = { getItem: () => null, setItem: () => {} };
window.Math = Math; window.Date = Date;
window.parseInt = parseInt; window.parseFloat = parseFloat;
window.console = console;

const files = [
  'js/data.js', 'js/auth.js', 'js/utils.js', 'js/views/reservation-form.js'
];
files.forEach(f => {
  const script = window.document.createElement('script');
  script.textContent = fs.readFileSync(f, 'utf8');
  window.document.head.appendChild(script);
});

setTimeout(() => {
  window.document.getElementById('app').innerHTML = window.renderReservationForm();
  
  const balInput = window.document.querySelector('input[name=\"balTotalPrice\"]');
  balInput.value = 150;
  
  window.updatePerPerson(balInput, 'pp-price-bal');
  
  const totalInp = window.document.querySelector('input[name=\"total\"]');
  console.log('Total input value is:', totalInp.value);
}, 100);
