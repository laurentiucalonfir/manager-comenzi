const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const target = `   function creeazaCardFurnizorComenzi(date, globalIndex) {`;
const endTarget = `       } else {`;

const startIdx = js.indexOf(target);
const endIdx = js.indexOf(endTarget, startIdx);

if (startIdx =4= -1 || endIdx === -1) {
    console.log('Not found');
    process.exit(1);
}

const newCode = `     window.copiazaMesajSiMarcheaza = function(mesajEnc, furnizorEnc, globalIndex) {
        const mesaj = decodeURIComponent(mesajEnc);
        const furnizor = decodeURIComponent(furnizorEnc);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(mesaj).then(() => {
            arataNotificare("Comanda copiată în memorie!", "success");
          }).catch(err => console.error("Clipboard err", err));
        }
        marcheazaTrimis(furnizor, globalIndex);
      };

      function esteWebsite(tel) {
        if (!tel) return false;
        const t = tel.toLowerCase();
        return t.includes('http') || t.includes('www') || (t.includes('.') && /[a-z]/.test(t));
      }

      function creeazaCardFurnizorComenzi(date, globalIndex) {
        const card = document.createElement("div");
        const textEnc = encodeURIComponent(date.mesaj);
        const furnizorEnc = encodeURIComponent(date.furnizor);
  
        card.setAttribute("data-index", globalIndex);
  
        let headerHTML = "";
        let corpHTML = "";
  
        if (date.areProduse) {
          let esteTrimis = furnizoriTrimisi[date.furnizor] ? true : false;
          card.className = "card" + (esteTrimis ? " trimis" : "");
          card.id = "card-" + globalIndex;
  
          let isWeb = esteWebsite(date.telefon);
          let linkActiune = "";
          let textButon = "";
          let onclickFunc = "";
          
          if (isWeb) {
            let urlDest = date.telefon.trim();
            if (!urlDest.startsWith('http')) urlDest = 'https://' + urlDest;
            linkActiune = urlDest;
            textButon = esteTrimis ? "Trimis ✔" : "🌐 Deschide Website";
            onclickFunc = "copiazaMesajSiMarcheaza('" + textEnc + "', '" + furnizorEnc + "', " + globalIndex + ")";
          } else {
            linkActiune = date.telefon ? ("https://wa.me/" + date.telefon + "?text=" + textEnc) : ("https://wa.me/?text=" + textEnc);
            textButon = esteTrimis ? "Trimis ✔" : "💌 Trimite pe WhatsApp";
            onclickFunc = "marcheazaTrimis('" + escapeHtml(date.furnizor).replace(/'/g, "\\\"'") + "', " + globalIndex + ")";
          }
          
          let infoTel = date.telefon ? " (" + date.telefon + ")" : "";
          let clasaExtraBtn = esteTrimis ? " trimis" : "";
  
          headerHTML = 
            '<div class="card-header" onclick="deschideModalEditareComanda(' + globalIndex + ')">' +
              '<div class="furnizor-name">🎦 ' + escapeHtml(date.furnizor) + ' <small style="font-weight:normal; color:#5F6368;">' + infoTel + '</small></div>' +
              '<div style="font-size: 13px; color: #2563eb; font-weight: bold;">✏️ Adaugă</div>' +
            '</div>';
          
          corpHTML = 
            '<pre>' + escapeHtml(date.mesaj) + '</pre>' +
            '<a class="btn-action btn-whatsapp' + clasaExtraBtn + '" id="btn-wa-' + globalIndex + '" href="' + linkActiune + '" target="_blank" onclick="' + onclickFunc + '">' + textButon + '</a>';
`;
 js = js.substring(0, startIdx) + newCode + js.substring(endIdx);
fs.writeFileSync('app.js', js);
console.log('Success');