const fs = require('fs');
const lines = fs.readFileSync('C:/Users/yusuf/.gemini/antigravity/brain/ce10b724-4788-436f-b515-7b67064e6c40/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');
let original = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('js/views/reservations-list.js') && lines[i].includes('File Path:')) {
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.content && obj.content.includes('<div class="res-card')) {
        original += obj.content + '\n---\n';
      }
    } catch(e) {}
  }
}
fs.writeFileSync('res_card_original.txt', original);
console.log('Done');
