    const firebaseConfig = {
      apiKey: "AIzaSyB2bQiS9TqSj0n_g7Mlhbb0ZtsjyqEN4y0",
      authDomain: "manager-comenzi-ff85b.firebaseapp.com",
      databaseURL: "https://manager-comenzi-ff85b-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "manager-comenzi-ff85b",
      storageBucket: "manager-comenzi-ff85b.firebasestorage.app",
      messagingSenderId: "138540595383",
      appId: "1:138540595383:web:ec32d82d79139f814d3532",
      measurementId: "G-5ZEE1Q7BGK"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.database();

    let dateGlobal = [];
    let istoricComenzi = JSON.parse(localStorage.getItem("istoricComenzi") || "[]");
    let furnizoriVerificati = JSON.parse(localStorage.getItem("furnizoriVerificati") || "{}");
    let furnizoriTrimisi = JSON.parse(localStorage.getItem("furnizoriTrimisi") || "{}");
    let editareCurentaGlobalIndex = -1;
    let gestiuniSelectate = {};
    let produseSelectate = {};

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }

    function arataNotificare(mesaj, tip = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast ' + tip;
      toast.innerText = mesaj;
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }


    auth.onAuthStateChanged((user) => {
      if (user) {
        document.getElementById('login-screen').style.display = 'none';
        incarcaComenzi();
      } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('titlu-pagina').style.display = 'none';
        document.getElementById('continut').style.display = 'none';
      }
    });

    function efectueazaLogin() {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const errDiv = document.getElementById('login-error');
      
      auth.signInWithEmailAndPassword(email, pass).then(() => {
        errDiv.style.display = 'none';
      }).catch(error => {
        errDiv.innerText = "Eroare: " + error.message;
        errDiv.style.display = 'block';
      });
    }

    function efectueazaLogout() {
      firebase.auth().signOut().then(() => {
        window.location.reload();
      });
    }

    function incarcaComenzi() {
      db.ref('comenzi').on('value', (snapshot) => {
        document.getElementById("titlu-pagina").style.display = "block";
        document.getElementById("continut").style.display = "block";
        document.getElementById("titlu-pagina").innerText = "Manager Comenzi";
        
        let date = snapshot.val();
        if (date && Array.isArray(date)) {
          dateGlobal = date;
        } else {
          dateGlobal = [];
        }
        
        afiseazaToateCardurile(dateGlobal);
      }, (error) => {
        // Ignoram eroarea (se deconecteaza)
      });

      db.ref('istoric_comenzi').on('value', (snapshot) => {
        let ist = snapshot.val();
        if (ist && Array.isArray(ist)) {
          istoricComenzi = ist;
          localStorage.setItem("istoricComenzi", JSON.stringify(istoricComenzi));
        }
        afiseazaIstoric();
      });
    }

    function comutaTab(tabNume) {
      document.querySelectorAll('.tab-continut').forEach(el => el.classList.remove('activ'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('activ'));
      
      document.getElementById('tab-' + tabNume).classList.add('activ');
      document.getElementById('tab-btn-' + tabNume).classList.add('activ');
      
      if (tabNume === 'istoric') {
        afiseazaIstoric();
      }
    }

    function afiseazaIstoric() {
        const zona = document.getElementById('zona-carduri-istoric');
        if (!zona) return;
        
        if (istoricComenzi.length === 0) {
            zona.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">Nu există comenzi în istoric.</div>';
            return;
        }

        zona.innerHTML = istoricComenzi.map((c, idx) => {
            let encodedMessage = encodeURIComponent(c.mesaj);
            let numarTelefon = c.telefon ? c.telefon.replace(/[^0-9]/g, '') : "";
            if (numarTelefon && !numarTelefon.startsWith("40") && numarTelefon.length === 10) {
              numarTelefon = "40" + numarTelefon;
            }
            let linkWa = numarTelefon ? "https://wa.me/" + numarTelefon + "?text=" + encodedMessage : "https://wa.me/?text=" + encodedMessage;
            return `
            <div class="card-istoric">
                <div class="card-istoric-header">
                  <span class="istoric-furnizor">👤 ${escapeHtml(c.furnizor)}</span>
                  <span class="istoric-data">${new Date(c.data).toLocaleString('ro-RO')}</span>
                </div>
                <pre class="istoric-mesaj">${escapeHtml(c.mesaj)}</pre>
                <a href="${linkWa}" target="_blank" class="btn-retrimite" onclick="retrimiteComandaDinIstoric(${idx})">🔁 Retrimite</a>
            </div>
            `;
        }).join('');
    }

    function retrimiteComandaDinIstoric(idx) {
        const c = istoricComenzi[idx];
        if (!c) return;
        // La retrimiteri, doar il mutam inapoi sus in istoric cu data noua
        const intrareNoua = {
            data: new Date().toISOString(),
            furnizor: c.furnizor,
            telefon: c.telefon || "",
            mesaj: c.mesaj
        };
        istoricComenzi.unshift(intrareNoua);
        if (istoricComenzi.length > 100) istoricComenzi = istoricComenzi.slice(0, 100);
        localStorage.setItem("istoricComenzi", JSON.stringify(istoricComenzi));
        firebase.database().ref('istoric_comenzi').set(istoricComenzi);
        afiseazaIstoric();
    }

    function stergeTotIstoricul() {
        istoricComenzi = [];
        localStorage.removeItem("istoricComenzi");
        firebase.database().ref('istoric_comenzi').set(istoricComenzi);
        afiseazaIstoric();
    }

    function afiseazaToateCardurile(listeComenzi) {
      const zonaComenzi = document.getElementById("zona-carduri-comenzi");
      const zonaConfig = document.getElementById("zona-carduri-config");
      
      if (zonaComenzi) zonaComenzi.innerHTML = "";
      if (zonaConfig) zonaConfig.innerHTML = "";

      const cuProduse = [];
      const faraProduse = [];

      listeComenzi.forEach((item, originalIndex) => {
        const elementObj = { data: item, globalIndex: originalIndex };
        if (item.areProduse) {
          cuProduse.push(elementObj);
        } else {
          faraProduse.push(elementObj);
        }
      });

      // TAB 1: COMENZI
      if (zonaComenzi) {
        if (cuProduse.length > 0) {
          const titluComenzi = document.createElement("div");
          titluComenzi.className = "sectiune-titlu";
          titluComenzi.innerText = "📦 De Comandat (" + cuProduse.length + ")";
          zonaComenzi.appendChild(titluComenzi);
          cuProduse.forEach(itemObj => zonaComenzi.appendChild(creeazaCardFurnizorComenzi(itemObj.data, itemObj.globalIndex)));
        }

        if (faraProduse.length > 0) {
          const titluFara = document.createElement("div");
          titluFara.className = "sectiune-titlu";
          titluFara.innerText = "✅ Stoc pe zero (" + faraProduse.length + ")";
          zonaComenzi.appendChild(titluFara);
          faraProduse.forEach(itemObj => zonaComenzi.appendChild(creeazaCardFurnizorComenzi(itemObj.data, itemObj.globalIndex)));
        }
      }

      // TAB 2: CONFIGURARE
      if (zonaConfig) {
        listeComenzi.forEach((item, idx) => {
          zonaConfig.appendChild(creeazaCardConfigurare(item, idx));
        });
      }

      // Populează dropdown-urile pentru tab-ul de configurare
      listeComenzi.forEach((item, idx) => {
        populeazaDropdownuriConfig(idx);
      });
    }

    let deschisePanouriConfig = {};

    function comutaPanouConfig(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      if (!dateFurnizor) return;
      
      const esteDeschis = deschisePanouriConfig[dateFurnizor.furnizor] ? true : false;
      deschisePanouriConfig[dateFurnizor.furnizor] = !esteDeschis;
      
      const p = document.getElementById("panel-cfg-" + globalIndex);
      const ch = document.getElementById("chevron-cfg-" + globalIndex);
      
      if (p) {
        if (!esteDeschis) {
          p.classList.add("deschis");
          if (ch) ch.innerText = "▲";
        } else {
          p.classList.remove("deschis");
          if (ch) ch.innerText = "▼";
        }
      }
    }

    function creeazaCardFurnizorComenzi(date, globalIndex) {
      const card = document.createElement("div");
      const textEnc = encodeURIComponent(date.mesaj);

      card.setAttribute("data-index", globalIndex);

      let headerHTML = "";
      let corpHTML = "";

      if (date.areProduse) {
        let esteTrimis = furnizoriTrimisi[date.furnizor] ? true : false;
        card.className = "card" + (esteTrimis ? " trimis" : "");
        card.id = "card-" + globalIndex;

        let linkWhatsapp = date.telefon ? ("https://wa.me/" + date.telefon + "?text=" + textEnc) : ("https://wa.me/?text=" + textEnc);
        let infoTel = date.telefon ? " (" + date.telefon + ")" : "";
        let textButon = esteTrimis ? "Trimis ✅" : "💬 Trimite pe WhatsApp";
        let clasaExtraBtn = esteTrimis ? " trimis" : "";

        headerHTML = 
          '<div class="card-header" onclick="deschideModalEditareComanda(' + globalIndex + ')">' +
            '<div class="furnizor-name">👤 ' + escapeHtml(date.furnizor) + '<small style="font-weight:normal; color:#64748b;">' + infoTel + '</small></div>' +
            '<div style="font-size: 13px; color: #2563eb; font-weight: bold;">✏️ Adaugă</div>' +
          '</div>';
        
        corpHTML = 
          '<pre>' + escapeHtml(date.mesaj) + '</pre>' +
          '<a class="btn-action btn-whatsapp' + clasaExtraBtn + '" id="btn-wa-' + globalIndex + '" href="' + linkWhatsapp + '" target="_blank" onclick="marcheazaTrimis(\'' + escapeHtml(date.furnizor) + '\', ' + globalIndex + ')">' + textButon + '</a>';
      } else {
        let esteBifat = furnizoriVerificati[date.furnizor] ? true : false;
        card.className = "card fara-produse" + (esteBifat ? " verificat" : "");
        card.id = "card-" + globalIndex;

        headerHTML = 
          '<div class="card-header" onclick="deschideModalEditareComanda(' + globalIndex + ')">' +
            '<div class="furnizor-name" style="color: #64748b;">👤 ' + escapeHtml(date.furnizor) + ' <small>(0 produse)</small></div>' +
            '<label class="checkbox-verificare" onclick="event.stopPropagation()">' +
              '<input type="checkbox" ' + (esteBifat ? 'checked' : '') + ' onchange="bifeazaVerificare(this, \'' + escapeHtml(date.furnizor) + '\', ' + globalIndex + ')">' +
              'Verificat' +
            '</label>' +
          '</div>';
      }

      card.innerHTML = headerHTML + corpHTML;
      return card;
    }

    function creeazaCardConfigurare(date, globalIndex) {
      const card = document.createElement("div");
      const esteDeschis = deschisePanouriConfig[date.furnizor] ? true : false;
      const chevronIcon = esteDeschis ? "▲" : "▼";
      card.className = "card";
      card.style.borderLeftColor = "#3b82f6";
      card.setAttribute("data-index", globalIndex);

      let infoTel = date.telefon ? (" (" + escapeHtml(date.telefon) + ")") : "";

      let headerHTML = 
        '<div class="card-header" onclick="comutaPanouConfig(' + globalIndex + ')">' +
          '<div class="furnizor-name">👤 ' + escapeHtml(date.furnizor) + '<small style="font-weight:normal; color:#64748b;">' + infoTel + '</small> <span class="chevron-indicator" id="chevron-cfg-' + globalIndex + '">' + chevronIcon + '</span></div>' +
        '</div>';

      let bodyHTML = 
        '<div id="panel-cfg-' + globalIndex + '" class="panel-editare' + (esteDeschis ? ' deschis' : '') + '">' +
          '<div class="form-group">' +
            '<label>⚙️ Gestiuni / Locații</label>' +
            '<select id="cfg-gestiune-' + globalIndex + '" class="form-control"></select>' +
            '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">' +
              '<button type="button" class="btn-cfg btn-cfg-add" onclick="deschideModalGestiune(' + globalIndex + ', false)">➕ Adaugă</button>' +
              '<button type="button" class="btn-cfg btn-cfg-edit" onclick="deschideModalGestiune(' + globalIndex + ', true)">✏️ Modifică</button>' +
              '<button type="button" class="btn-cfg btn-cfg-danger" onclick="stergeGestiuneConfig(' + globalIndex + ')">🗑️ Șterge</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group" style="margin-top:14px;">' +
            '<label>📦 Produse Formular</label>' +
            '<select id="cfg-produs-' + globalIndex + '" class="form-control"></select>' +
            '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">' +
              '<button type="button" class="btn-cfg btn-cfg-add" onclick="deschideModalProdus(' + globalIndex + ', false)">➕ Adaugă</button>' +
              '<button type="button" class="btn-cfg btn-cfg-edit" onclick="deschideModalProdus(' + globalIndex + ', true)">✏️ Modifică</button>' +
              '<button type="button" class="btn-cfg btn-cfg-danger" onclick="stergeProdusConfig(' + globalIndex + ')">🗑️ Șterge</button>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; gap:8px; margin-top:16px; border-top:1px dashed #cbd5e1; padding-top:12px;">' +
            '<button type="button" class="btn-cfg btn-cfg-edit" style="flex:1;" onclick="deschideModalFurnizor(' + globalIndex + ')">✏️ Editează Furnizor</button>' +
            '<button type="button" class="btn-cfg btn-cfg-danger" style="flex:1;" onclick="stergeFurnizorComplet(' + globalIndex + ')">🗑️ Șterge Furnizor</button>' +
          '</div>' +
        '</div>';

      card.innerHTML = headerHTML + bodyHTML;
      return card;
    }

    function generareOptiuniCantitateHTML() {
      return '<option value="0">0 (🗑️ Șterge / Anulează)</option>' +
        '<option value="1" selected>1</option>' +
        '<option value="2">2</option>' +
        '<option value="3">3</option>' +
        '<option value="4">4</option>' +
        '<option value="5">5</option>' +
        '<option value="6">6</option>' +
        '<option value="7">7</option>' +
        '<option value="8">8</option>' +
        '<option value="9">9</option>' +
        '<option value="10">10</option>' +
        '<option value="11">11</option>' +
        '<option value="12">12</option>' +
        '<option value="13">13</option>' +
        '<option value="14">14</option>' +
        '<option value="15">15</option>' +
        '<option value="20">20</option>' +
        '<option value="25">25</option>' +
        '<option value="30">30</option>' +
        '<option value="35">35</option>' +
        '<option value="40">40</option>';
    }

    function deschideModalEditareComanda(globalIndex, preselectRandIndex = null) {
      const date = dateGlobal[globalIndex];
      if (!date) return;
      editareCurentaGlobalIndex = globalIndex;
      
      document.getElementById('modal-editare-titlu').innerText = "📦 " + date.furnizor;
      document.getElementById('modal-inp-cantitate').innerHTML = generareOptiuniCantitateHTML();
      
      const overlay = document.getElementById("modal-editare-comanda");
      overlay.style.display = "flex";
      
      populeazaDropdownuriModal();
      
      if (preselectRandIndex !== null && preselectRandIndex !== undefined) {
        const selProdus = document.getElementById('modal-sel-produs');
        let gasit = false;
        for (let i = 0; i < selProdus.options.length; i++) {
          if (selProdus.options[i].value == preselectRandIndex) {
            gasit = true;
            break;
          }
        }
        if (gasit) {
          selProdus.value = preselectRandIndex;
          schimbaProdusModal();
        }
      }
    }

    function inchideModalEditare() {
      document.getElementById("modal-editare-comanda").style.display = "none";
      editareCurentaGlobalIndex = -1;
    }

    function schimbaGestiuneModal() {
      const globalIndex = editareCurentaGlobalIndex;
      if (globalIndex === -1) return;
      const dateFurnizor = dateGlobal[globalIndex];
      const selGestiune = document.getElementById("modal-sel-gestiune");
      if (dateFurnizor && selGestiune) {
        gestiuniSelectate[dateFurnizor.furnizor] = Number(selGestiune.value);
      }
      actualizeazaProduseModal();
    }

    function schimbaProdusModal() {
      const globalIndex = editareCurentaGlobalIndex;
      if (globalIndex === -1) return;
      const dateFurnizor = dateGlobal[globalIndex];
      const selProdus = document.getElementById("modal-sel-produs");
      if (dateFurnizor && selProdus) {
        produseSelectate[dateFurnizor.furnizor] = Number(selProdus.value);
      }
      schimbaOptiuneCantitateModal();
    }

    function populeazaDropdownuriModal() {
      const globalIndex = editareCurentaGlobalIndex;
      if (globalIndex === -1) return;
      const dateFurnizor = dateGlobal[globalIndex];
      const selGestiune = document.getElementById("modal-sel-gestiune");
      if (!selGestiune || !dateFurnizor) return;

      selGestiune.innerHTML = "";
      dateFurnizor.gestiuni.forEach(g => {
        let opt = document.createElement("option");
        opt.value = Number(g.colIndex);
        opt.innerText = g.nume;
        selGestiune.appendChild(opt);
      });

      if (gestiuniSelectate[dateFurnizor.furnizor]) {
        selGestiune.value = String(gestiuniSelectate[dateFurnizor.furnizor]);
      }

      actualizeazaProduseModal();
    }

    function obtineCantitateGestiune(pObj, colIndex) {
      if (!pObj || !pObj.valoriGestiuni) return 0;
      let colNum = Number(colIndex);
      if (colNum === 0) colNum = 5;
      return Number(pObj.valoriGestiuni[colNum]) || 0;
    }

    function seteazaCantitateGestiune(pObj, colIndex, cantitate) {
      if (!pObj) return;
      if (!pObj.valoriGestiuni) pObj.valoriGestiuni = {};
      let colNum = Number(colIndex);
      if (colNum === 0) colNum = 5;
      let val = Number(cantitate);

      if (val > 0) {
        pObj.valoriGestiuni[colNum] = val;
      } else {
        delete pObj.valoriGestiuni[colNum];
      }
    }

    function actualizeazaProduseModal() {
      const globalIndex = editareCurentaGlobalIndex;
      if (globalIndex === -1) return;
      const dateFurnizor = dateGlobal[globalIndex];
      const selGestiune = document.getElementById("modal-sel-gestiune");
      const selProdus = document.getElementById("modal-sel-produs");
      if (!selGestiune || !selProdus || !dateFurnizor) return;

      const colGestiuneSelectata = Number(selGestiune.value);
      gestiuniSelectate[dateFurnizor.furnizor] = colGestiuneSelectata;

      let salvareValoare = produseSelectate[dateFurnizor.furnizor] || selProdus.value;
      selProdus.innerHTML = "";

      dateFurnizor.produseFormular.forEach(p => {
        let cantitateExistenta = obtineCantitateGestiune(p, colGestiuneSelectata);
        let opt = document.createElement("option");
        opt.value = Number(p.randIndex);
        
        if (cantitateExistenta > 0) {
          opt.innerText = "✅ " + p.produs + " (" + cantitateExistenta + " " + p.tipAmbalaj + ")";
        } else {
          opt.innerText = p.produs + " (" + p.tipAmbalaj + ")";
        }
        
        selProdus.appendChild(opt);
      });

      if (salvareValoare) {
        selProdus.value = String(salvareValoare);
      }
      schimbaOptiuneCantitateModal();
    }

    function schimbaOptiuneCantitateModal() {
      const globalIndex = editareCurentaGlobalIndex;
      if (globalIndex === -1) return;
      const dateFurnizor = dateGlobal[globalIndex];
      const selGestiune = document.getElementById("modal-sel-gestiune");
      const selProdus = document.getElementById("modal-sel-produs");
      const selCantitate = document.getElementById("modal-inp-cantitate");
      if (!selGestiune || !selProdus || !selCantitate || !dateFurnizor) return;

      const colGestiuneSelectata = Number(selGestiune.value);
      const randProdus = Number(selProdus.value);

      let pObj = dateFurnizor.produseFormular.find(p => Number(p.randIndex) === Number(randProdus));
      if (pObj) {
        let cantitateExistenta = obtineCantitateGestiune(pObj, colGestiuneSelectata);
        if (cantitateExistenta > 0) {
          selCantitate.value = String(cantitateExistenta);
        } else {
          selCantitate.value = "1";
        }
      }

      actualizeazaStilButonModal();
    }

    function actualizeazaStilButonModal() {
      const selCantitate = document.getElementById("modal-inp-cantitate");
      const btnMain = document.getElementById("modal-btn-salveaza");
      if (!selCantitate || !btnMain) return;

      const cantVal = Number(selCantitate.value);
      if (cantVal === 0) {
        btnMain.innerText = "🗑️ Șterge";
        btnMain.classList.add("btn-sterge");
      } else {
        btnMain.innerText = "💾 Salvează";
        btnMain.classList.remove("btn-sterge");
      }
    }

    function marcheazaTrimis(furnizorNume, globalIndex) {
      furnizoriTrimisi[furnizorNume] = true;
      localStorage.setItem("furnizoriTrimisi", JSON.stringify(furnizoriTrimisi));
      
      const date = dateGlobal[globalIndex];
      const btn = document.getElementById("btn-wa-" + globalIndex);
      if (btn) {
        btn.innerText = "Trimis";
        btn.style.backgroundColor = "#94a3b8";
        btn.style.pointerEvents = "none";
      }

      // Adaugare la istoric
      if (date && date.mesaj && date.mesaj.trim() !== "") {
        const intrareIstoric = {
          data: new Date().toISOString(),
          furnizor: furnizorNume,
          telefon: date.telefon || "",
          mesaj: date.mesaj
        };
        istoricComenzi.unshift(intrareIstoric);
        if (istoricComenzi.length > 100) {
          istoricComenzi = istoricComenzi.slice(0, 100);
        }
        localStorage.setItem("istoricComenzi", JSON.stringify(istoricComenzi));
        firebase.database().ref('istoric_comenzi').set(istoricComenzi);
        afiseazaIstoric();
      }
      
      const card = document.getElementById("card-" + globalIndex);
      if (card) card.classList.add("trimis");
    }

    function bifeazaVerificare(checkbox, numeFurnizor, index) {
      furnizoriVerificati[numeFurnizor] = checkbox.checked;
      try { localStorage.setItem("furnizoriVerificati", JSON.stringify(furnizoriVerificati)); } catch(e) {}
      const card = document.getElementById("card-" + index);
      if (checkbox.checked) {
        card.classList.add("verificat");
      } else {
        card.classList.remove("verificat");
      }
    }

    function recalculeazaMesajFurnizor(dateFurnizor) {
      let structura = {};
      let areProduse = false;

      dateFurnizor.produseFormular.forEach(p => {
        for (let colKey in p.valoriGestiuni) {
          let colIndexNum = Number(colKey);
          let val = Number(p.valoriGestiuni[colKey]) || 0;
          
          if (val > 0) {
            let cantitateFinala = val;
            if (cantitateFinala > 0) {
              let linieProdus = `✅ *${p.produs}* -> ${cantitateFinala} ${p.tipAmbalaj}`;
              
              let gObj = dateFurnizor.gestiuni.find(g => Number(g.colIndex) === colIndexNum);
              
              let numeGestiune = "SIMPLU";
              if (gObj && gObj.nume) {
                let textNume = String(gObj.nume).trim();
                if (textNume !== "" && textNume !== "-- Fără Gestiune --") {
                  numeGestiune = textNume;
                }
              }
              
              if (!structura[numeGestiune]) structura[numeGestiune] = [];
              
              if (!structura[numeGestiune].includes(linieProdus)) {
                structura[numeGestiune].push(linieProdus);
                areProduse = true;
              }
            }
          }
        }
      });

      let textMesaj = "";
      if (areProduse) {
        textMesaj = `Bună ziua! Doresc să plasez o comandă pentru următoarele produse:\n`;
        for (let grup in structura) {
          if (structura[grup].length > 0) {
            if (grup === "SIMPLU") {
              textMesaj += `\n` + structura[grup].join("\n") + `\n`;
            } else {
              textMesaj += `\n📍 *PENTRU ${grup.toUpperCase()}:*\n`;
              textMesaj += structura[grup].join("\n") + `\n`;
            }
          }
        }
        textMesaj = textMesaj.replace(/\n\n+/g, '\n\n').trim() + `\n\nMulțumesc!`;
      }

      dateFurnizor.areProduse = areProduse;
      dateFurnizor.mesaj = textMesaj;
      
      afiseazaToateCardurile(dateGlobal);
    }

    function trimiteCantitateModal() {
      const globalIndex = editareCurentaGlobalIndex;
      if (globalIndex === -1) return;
      const dateFurnizor = dateGlobal[globalIndex];
      if (!dateFurnizor) return;

      const selGestiune = document.getElementById("modal-sel-gestiune");
      const selProdus = document.getElementById("modal-sel-produs");
      const selCantitate = document.getElementById("modal-inp-cantitate");

      const numeFurnizor = dateFurnizor.furnizor;
      const randIndex = Number(selProdus ? selProdus.value : 0);
      const coloanaIndex = Number(selGestiune ? selGestiune.value : 0);
      const cantitate = Number(selCantitate ? selCantitate.value : 0);

      if(!randIndex) {
        arataNotificare("Alegeți un produs valid!", "error");
        return;
      }

      let pObj = dateFurnizor.produseFormular.find(p => Number(p.randIndex) === randIndex);
      if (pObj) {
        seteazaCantitateGestiune(pObj, coloanaIndex, cantitate);
      }

      // Menținem locația/produsul selectat pe acest furnizor după salvare
      gestiuniSelectate[numeFurnizor] = coloanaIndex;
      produseSelectate[numeFurnizor] = randIndex;

      recalculeazaMesajFurnizor(dateFurnizor);
      
      // Update the modal UI immediately to reflect the change visually
      populeazaDropdownuriModal();

      // arataNotificare("⚡ Salvat în Firebase!", "success"); // Oprit la cerere

      firebase.database().ref('comenzi/' + globalIndex).set(dateFurnizor).catch(err => {
        arataNotificare("❌ Eroare la sincronizare cu Firebase!", "error");
      });
    }

    function adaugaGestiuneNoua(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      if (!dateFurnizor) return;
      const numeGestiune = prompt("Introduceți numele noii gestiuni / locații pentru " + dateFurnizor.furnizor + ":");
      if (!numeGestiune || !numeGestiune.trim()) return;

      if (!dateFurnizor.gestiuni) dateFurnizor.gestiuni = [];
      const maxCol = dateFurnizor.gestiuni.reduce((max, g) => Math.max(max, Number(g.colIndex) || 0), 4);
      const colIndexNou = maxCol + 1;

      const gNoua = { nume: numeGestiune.trim(), colIndex: colIndexNou };
      dateFurnizor.gestiuni.push(gNoua);
      gestiuniSelectate[dateFurnizor.furnizor] = colIndexNou;

      recalculeazaMesajFurnizor(dateFurnizor);
      salveazaFurnizorInFirebase(globalIndex);
      afiseazaToateCardurile(dateGlobal);
    }

    function populeazaDropdownuriConfig(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      const selG = document.getElementById("cfg-gestiune-" + globalIndex);
      const selP = document.getElementById("cfg-produs-" + globalIndex);
      if (!dateFurnizor) return;

      if (selG) {
        selG.innerHTML = "";
        if (dateFurnizor.gestiuni && dateFurnizor.gestiuni.length > 0) {
          dateFurnizor.gestiuni.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g.colIndex;
            opt.textContent = g.nume;
            selG.appendChild(opt);
          });
        } else {
          selG.innerHTML = '<option value="0">-- Fără Gestiuni --</option>';
        }
      }

      if (selP) {
        selP.innerHTML = "";
        if (dateFurnizor.produseFormular && dateFurnizor.produseFormular.length > 0) {
          dateFurnizor.produseFormular.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.randIndex;
            opt.textContent = p.produs + " (" + p.tipAmbalaj + ")";
            selP.appendChild(opt);
          });
        } else {
          selP.innerHTML = '<option value="0">-- Fără Produse --</option>';
        }
      }
    }

    let currentEditIndex = -1;
    let currentSubIndex = -1;
    let currentModalMode = "adaugare";
    let callbackStergere = null;

    function inchideModal(id) {
      const m = document.getElementById(id);
      if (m) m.style.display = "none";
    }

    function deschideModalFurnizor(globalIndex = -1) {
      currentEditIndex = globalIndex;
      currentModalMode = (globalIndex >= 0) ? "editare" : "adaugare";
      
      document.getElementById("modal-furnizor-titlu").innerText = (currentModalMode === "editare") ? "✏️ Editează Furnizor" : "➕ Adaugă Furnizor Nou";
      
      if (currentModalMode === "editare" && dateGlobal[globalIndex]) {
        document.getElementById("m-furnizor-nume").value = dateGlobal[globalIndex].furnizor || "";
        document.getElementById("m-furnizor-telefon").value = dateGlobal[globalIndex].telefon || "";
      } else {
        document.getElementById("m-furnizor-nume").value = "";
        document.getElementById("m-furnizor-telefon").value = "";
      }
      
      document.getElementById("modal-furnizor").style.display = "flex";
    }

    function salveazaModalFurnizor() {
      const nume = document.getElementById("m-furnizor-nume").value.trim();
      const tel = document.getElementById("m-furnizor-telefon").value.trim();
      if (!nume) { return; }

      if (currentModalMode === "adaugare") {
        const fNou = {
          furnizor: nume,
          telefon: tel,
          areProduse: false,
          mesaj: "",
          gestiuni: [{ nume: "-- Fără Gestiune --", colIndex: 5 }],
          produseFormular: []
        };
        dateGlobal.push(fNou);
        salveazaFurnizorInFirebase(dateGlobal.length - 1);
      } else if (currentModalMode === "editare" && dateGlobal[currentEditIndex]) {
        dateGlobal[currentEditIndex].furnizor = nume;
        dateGlobal[currentEditIndex].telefon = tel;
        salveazaFurnizorInFirebase(currentEditIndex);
      }

      inchideModal("modal-furnizor");
      afiseazaToateCardurile(dateGlobal);
    }

    function deschideModalGestiune(globalIndex, isEdit = false) {
      currentEditIndex = globalIndex;
      currentModalMode = isEdit ? "editare" : "adaugare";
      const dateFurnizor = dateGlobal[globalIndex];
      if (!dateFurnizor) return;

      document.getElementById("modal-gestiune-titlu").innerText = isEdit ? ("✏️ Editează Gestiune (" + dateFurnizor.furnizor + ")") : ("➕ Adaugă Gestiune (" + dateFurnizor.furnizor + ")");

      if (isEdit) {
        const selG = document.getElementById("cfg-gestiune-" + globalIndex) || document.getElementById("sel-gestiune-" + globalIndex);
        const colIndex = Number(selG ? selG.value : 0);
        let gObj = dateFurnizor.gestiuni ? dateFurnizor.gestiuni.find(g => Number(g.colIndex) === colIndex) : null;
        if (!gObj) { return; }
        currentSubIndex = colIndex;
        document.getElementById("m-gestiune-nume").value = gObj.nume || "";
      } else {
        document.getElementById("m-gestiune-nume").value = "";
      }

      document.getElementById("modal-gestiune").style.display = "flex";
    }

    function salveazaModalGestiune() {
      const dateFurnizor = dateGlobal[currentEditIndex];
      if (!dateFurnizor) return;
      const nume = document.getElementById("m-gestiune-nume").value.trim();
      if (!nume) { return; }

      if (!dateFurnizor.gestiuni) dateFurnizor.gestiuni = [];

      if (currentModalMode === "adaugare") {
        const maxCol = dateFurnizor.gestiuni.reduce((max, g) => Math.max(max, Number(g.colIndex) || 0), 4);
        const colIndexNou = maxCol + 1;
        dateFurnizor.gestiuni.push({ nume: nume, colIndex: colIndexNou });
        gestiuniSelectate[dateFurnizor.furnizor] = colIndexNou;
      } else if (currentModalMode === "editare") {
        let gObj = dateFurnizor.gestiuni.find(g => Number(g.colIndex) === currentSubIndex);
        if (gObj) gObj.nume = nume;
      }

      recalculeazaMesajFurnizor(dateFurnizor);
      salveazaFurnizorInFirebase(currentEditIndex);
      inchideModal("modal-gestiune");
      afiseazaToateCardurile(dateGlobal);
    }

    function deschideModalProdus(globalIndex, isEdit = false) {
      currentEditIndex = globalIndex;
      currentModalMode = isEdit ? "editare" : "adaugare";
      const dateFurnizor = dateGlobal[globalIndex];
      if (!dateFurnizor) return;

      document.getElementById("modal-produs-titlu").innerText = isEdit ? ("✏️ Editează Produs (" + dateFurnizor.furnizor + ")") : ("➕ Adaugă Produs (" + dateFurnizor.furnizor + ")");

      if (isEdit) {
        const selP = document.getElementById("cfg-produs-" + globalIndex) || document.getElementById("sel-produs-" + globalIndex);
        const randIndex = Number(selP ? selP.value : 0);
        let pObj = dateFurnizor.produseFormular ? dateFurnizor.produseFormular.find(p => Number(p.randIndex) === randIndex) : null;
        if (!pObj) { return; }
        currentSubIndex = randIndex;
        document.getElementById("m-produs-nume").value = pObj.produs || "";
        document.getElementById("m-produs-tip").value = pObj.tipAmbalaj || "buc.";
      } else {
        document.getElementById("m-produs-nume").value = "";
        document.getElementById("m-produs-tip").value = "buc.";
      }

      document.getElementById("modal-produs").style.display = "flex";
    }

    function salveazaModalProdus() {
      const dateFurnizor = dateGlobal[currentEditIndex];
      if (!dateFurnizor) return;
      const nume = document.getElementById("m-produs-nume").value.trim();
      const tip = document.getElementById("m-produs-tip").value.trim() || "buc.";
      if (!nume) { return; }

      if (!dateFurnizor.produseFormular) dateFurnizor.produseFormular = [];

      if (currentModalMode === "adaugare") {
        const maxRand = dateFurnizor.produseFormular.reduce((max, p) => Math.max(max, Number(p.randIndex) || 0), 1);
        const randIndexNou = maxRand + 1;
        const pNou = {
          randIndex: randIndexNou,
          produs: nume,
          ambalaj: 1,
          tipAmbalaj: tip,
          valoriGestiuni: {}
        };
        dateFurnizor.produseFormular.push(pNou);
        produseSelectate[dateFurnizor.furnizor] = randIndexNou;
      } else if (currentModalMode === "editare") {
        let pObj = dateFurnizor.produseFormular.find(p => Number(p.randIndex) === currentSubIndex);
        if (pObj) {
          pObj.produs = nume;
          pObj.tipAmbalaj = tip;
          pObj.ambalaj = 1;
        }
      }

      recalculeazaMesajFurnizor(dateFurnizor);
      salveazaFurnizorInFirebase(currentEditIndex);
      inchideModal("modal-produs");
      afiseazaToateCardurile(dateGlobal);
    }

    function deschideModalStergere(mesajText, callbackAction) {
      document.getElementById("modal-stergere-mesaj").innerText = mesajText;
      callbackStergere = callbackAction;
      document.getElementById("btn-confirm-stergere").onclick = function() {
        if (callbackStergere) callbackStergere();
        inchideModal("modal-stergere");
      };
      document.getElementById("modal-stergere").style.display = "flex";
    }

    function stergeGestiuneConfig(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      const selG = document.getElementById("cfg-gestiune-" + globalIndex);
      if (!dateFurnizor || !selG) return;
      const colIndex = Number(selG.value);
      let gObj = dateFurnizor.gestiuni ? dateFurnizor.gestiuni.find(g => Number(g.colIndex) === colIndex) : null;
      if (!gObj) return;

      deschideModalStergere('Sigur doriți să ștergeți gestiunea "' + gObj.nume + '"?', function() {
        dateFurnizor.gestiuni = dateFurnizor.gestiuni.filter(g => Number(g.colIndex) !== colIndex);
        if (dateFurnizor.produseFormular) {
          dateFurnizor.produseFormular.forEach(p => {
            if (p.valoriGestiuni && p.valoriGestiuni[colIndex] !== undefined) delete p.valoriGestiuni[colIndex];
          });
        }
        recalculeazaMesajFurnizor(dateFurnizor);
        salveazaFurnizorInFirebase(globalIndex);
        afiseazaToateCardurile(dateGlobal);
      });
    }

    function stergeProdusConfig(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      const selP = document.getElementById("cfg-produs-" + globalIndex);
      if (!dateFurnizor || !selP) return;
      const randIndex = Number(selP.value);
      let pObj = dateFurnizor.produseFormular ? dateFurnizor.produseFormular.find(p => Number(p.randIndex) === randIndex) : null;
      if (!pObj) return;

      deschideModalStergere('Sigur doriți să ștergeți produsul "' + pObj.produs + '"?', function() {
        dateFurnizor.produseFormular = dateFurnizor.produseFormular.filter(p => Number(p.randIndex) !== randIndex);
        recalculeazaMesajFurnizor(dateFurnizor);
        salveazaFurnizorInFirebase(globalIndex);
        afiseazaToateCardurile(dateGlobal);
      });
    }

    function stergeGestiuneCard(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      const selG = document.getElementById("sel-gestiune-" + globalIndex);
      if (!dateFurnizor || !selG) return;
      const colIndex = Number(selG.value);
      let gObj = dateFurnizor.gestiuni ? dateFurnizor.gestiuni.find(g => Number(g.colIndex) === colIndex) : null;
      if (!gObj) return;

      deschideModalStergere('Sigur doriți să ștergeți gestiunea "' + gObj.nume + '"?', function() {
        dateFurnizor.gestiuni = dateFurnizor.gestiuni.filter(g => Number(g.colIndex) !== colIndex);
        if (dateFurnizor.produseFormular) {
          dateFurnizor.produseFormular.forEach(p => {
            if (p.valoriGestiuni && p.valoriGestiuni[colIndex] !== undefined) delete p.valoriGestiuni[colIndex];
          });
        }
        delete gestiuniSelectate[dateFurnizor.furnizor];
        recalculeazaMesajFurnizor(dateFurnizor);
        salveazaFurnizorInFirebase(globalIndex);
        afiseazaToateCardurile(dateGlobal);
      });
    }

    function stergeProdusCard(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      const selP = document.getElementById("sel-produs-" + globalIndex);
      if (!dateFurnizor || !selP) return;
      const randIndex = Number(selP.value);
      let pObj = dateFurnizor.produseFormular ? dateFurnizor.produseFormular.find(p => Number(p.randIndex) === randIndex) : null;
      if (!pObj) return;

      deschideModalStergere('Sigur doriți să ștergeți produsul "' + pObj.produs + '"?', function() {
        dateFurnizor.produseFormular = dateFurnizor.produseFormular.filter(p => Number(p.randIndex) !== randIndex);
        delete produseSelectate[dateFurnizor.furnizor];
        recalculeazaMesajFurnizor(dateFurnizor);
        salveazaFurnizorInFirebase(globalIndex);
        afiseazaToateCardurile(dateGlobal);
      });
    }

    function stergeFurnizorComplet(globalIndex) {
      const dateFurnizor = dateGlobal[globalIndex];
      if (!dateFurnizor) return;

      deschideModalStergere('⚠️ ATENȚIE: Sigur doriți să ștergeți complet furnizorul "' + dateFurnizor.furnizor + '" și toate produsele lui?', function() {
        dateGlobal.splice(globalIndex, 1);
        afiseazaToateCardurile(dateGlobal);
        arataNotificare("⚡ Furnizor șters!", "success");

        firebase.database().ref('comenzi').set(dateGlobal);
      });
    }

    function salveazaFurnizorInFirebase(globalIndex) {
      // arataNotificare("⚡ Salvat în Firebase!", "success"); // Oprit la cerere

      firebase.database().ref('comenzi/' + globalIndex).set(dateGlobal[globalIndex]);
    }

    function escapeHtml(text) {
      return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function deschideModalConfirmare() { document.getElementById("modal-confirmare").style.display = "flex"; }
    function inchideModalConfirmare() { document.getElementById("modal-confirmare").style.display = "none"; }

    function reseteazaMecanic() {
      inchideModalConfirmare();
      // arataNotificare("⚡ Toate cantitățile au fost resetate în Firebase!", "success"); // Oprit la cerere

      furnizoriVerificati = {};
      furnizoriTrimisi = {};
      deschisePanouriEditare = {};
      gestiuniSelectate = {};
      produseSelectate = {};
      try {
        localStorage.removeItem("furnizoriVerificati");
        localStorage.removeItem("furnizoriTrimisi");
      } catch(e) {}

      dateGlobal.forEach(furnizor => {
        furnizor.areProduse = false;
        furnizor.mesaj = "";
        furnizor.produseFormular.forEach(p => {
          p.valoriGestiuni = {};
        });
      });

      afiseazaToateCardurile(dateGlobal);

      setTimeout(() => { arataNotificare("Finalizat", "success"); }, 1500);

      firebase.database().ref('comenzi').set(dateGlobal).catch(err => {
        arataNotificare("❌ Eroare la resetare în Firebase!", "error");
      });
    }



