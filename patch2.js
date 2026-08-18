const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(/textDoarProduse = textDoarProduse.trim\\(\\);/, 'textDoarProduse = textDoarProduse.replace(/? /g, \\'\\').replace(/\\\\\*/g, \\'\\').replace(/?? /g, \\'\\').trim();');

fs.writeFileSync('app.js', js);
