const fs = require('fs');
const files = [
  'js/utils.js',
  'js/auth.js',
  'js/data.js',
  'js/router.js',
  'js/views/reservation.js',
  'js/views/reservation-form.js',
  'js/views/reservations-list.js',
  'js/views/dashboard.js',
  'js/views/stats.js',
  'js/app.js'
];
let hasError = false;
files.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    // Using Function to parse the code for SyntaxErrors
    new Function(code);
    console.log(f + ': Syntax OK');
  } catch(e) {
    console.error('SYNTAX ERROR in ' + f + ': ' + e.message);
    hasError = true;
  }
});
if (hasError) process.exit(1);
