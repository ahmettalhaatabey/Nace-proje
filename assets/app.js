/* NACE Kodu & Tehlike Sınıfı arama uygulaması */
(function () {
  "use strict";

  var HAZARD = {
    1: { label: "Az Tehlikeli", cls: "h1", rgb: [22, 163, 74] },
    2: { label: "Tehlikeli", cls: "h2", rgb: [217, 119, 6] },
    3: { label: "Çok Tehlikeli", cls: "h3", rgb: [220, 38, 38] }
  };
  var PAGE = 150;
  var LS = { cart: "nace.cart", client: "nace.client", theme: "nace.theme" };

  // Sık kullanılan halk ağzı ifadeler → listede geçen resmi terimler.
  // Anahtarlar ve değerler normalize edilmiş (küçük harf, Türkçe karaktersiz) yazılır.
  var SYNONYMS = {
    kuafor: ["kuafor", "berber", "guzellik salon", "sac"],
    berber: ["berber", "kuafor"],
    guzellik: ["guzellik", "kuafor", "estetik", "cilt bakim"],
    kafe: ["kafe", "cafe", "kahvehane", "icecek sunum", "kafeterya"],
    cafe: ["cafe", "kafe", "kahvehane", "icecek sunum", "kafeterya"],
    kahveci: ["kahvehane", "kahve", "icecek sunum"],
    restoran: ["restoran", "lokanta", "yemek sunum"],
    restaurant: ["restoran", "lokanta"],
    lokanta: ["lokanta", "restoran"],
    yemek: ["yemek", "lokanta", "restoran", "hazir yemek"],
    emlak: ["emlak", "gayrimenkul"],
    emlakci: ["emlak", "gayrimenkul"],
    yazilim: ["yazilim", "bilgisayar program"],
    programci: ["bilgisayar program", "yazilim"],
    eticaret: ["internet", "e-ticaret", "posta yoluyla", "elektronik ticaret"],
    "e-ticaret": ["internet", "e-ticaret", "posta yoluyla", "elektronik ticaret"],
    internet: ["internet"],
    market: ["market", "bakkal", "gida agirlikli", "gida, icecek"],
    bakkal: ["bakkal", "market", "gida agirlikli"],
    sarkuteri: ["sarkuteri", "gida"],
    manav: ["meyve", "sebze"],
    kasap: ["et ", "et urun", "kasap"],
    oto: ["motorlu kara tasit", "otomobil", "oto"],
    araba: ["otomobil", "motorlu kara tasit"],
    galeri: ["otomobil", "motorlu kara tasit"],
    tamir: ["tamir", "onarim", "bakim"],
    tamirci: ["tamir", "onarim"],
    servis: ["bakim", "onarim", "servis"],
    nakliye: ["nakliye", "yuk tasima", "tasimacilik"],
    lojistik: ["lojistik", "depolama", "tasimacilik", "kargo"],
    kargo: ["kargo", "kurye", "posta"],
    kurye: ["kurye", "kargo"],
    taksi: ["taksi"],
    insaat: ["insaat", "bina", "yapi"],
    muteahhit: ["insaat", "bina", "yapi"],
    muhasebe: ["muhasebe", "defter tutma", "mali musavir"],
    muhasebeci: ["muhasebe", "defter tutma"],
    avukat: ["hukuk", "avukat"],
    doktor: ["hekim", "tip", "muayene"],
    hekim: ["hekim"],
    dis: ["dis hekim", "dis"],
    eczane: ["eczacilik", "eczane", "ecza"],
    spor: ["spor", "fitness", "beden egitim"],
    fitness: ["fitness", "spor"],
    temizlik: ["temizlik"],
    kirtasiye: ["kirtasiye"],
    cicekci: ["cicek"],
    firin: ["firin", "ekmek"],
    pastane: ["pasta", "tatli", "unlu mamul"],
    kres: ["kres", "gunduz bakim", "okul oncesi"],
    kurs: ["kurs", "egitim"],
    dershane: ["kurs", "egitim", "dershane"],
    reklam: ["reklam"],
    reklamci: ["reklam"],
    danismanlik: ["danismanlik"],
    otel: ["otel", "konaklama"],
    pansiyon: ["pansiyon", "konaklama"],
    fenomen: ["icerik", "video", "fenomen", "influencer"],
    influencer: ["icerik", "video", "fenomen", "influencer"],
    youtuber: ["icerik", "video"],
    terzi: ["terzi", "giyim", "elbise"],
    kuyumcu: ["kuyum", "mucevher", "altin"],
    tekstil: ["tekstil", "giyim", "kumas"],
    mobilya: ["mobilya"],
    matbaa: ["matbaa", "basim", "baski"],
    fotograf: ["fotograf"],
    eczaci: ["eczacilik", "eczane"],
    veteriner: ["veteriner"],
    optik: ["optik", "gozluk"],
    turizm: ["turizm", "seyahat", "tur operator"],
    seyahat: ["seyahat", "tur operator"],
    sigorta: ["sigorta"],
    tercume: ["tercume", "ceviri"],
    ceviri: ["ceviri", "tercume"],
    guvenlik: ["guvenlik", "koruma"],
    tasarim: ["tasarim"],
    mimar: ["mimar"],
    muhendis: ["muhendis"],
    elektrikci: ["elektrik tesisat"],
    tesisat: ["tesisat"],
    boya: ["boya"],
    hali: ["hali"],
    oyuncak: ["oyuncak"],
    telefon: ["telefon", "iletisim"],
    bilgisayar: ["bilgisayar"],
    kiralama: ["kiralama"],
    otopark: ["otopark", "park yeri"],
    yikama: ["yikama"],
    camasir: ["camasir", "kuru temizleme"],
    kuru: ["kuru temizleme"],
    ithalat: ["toptan ticaret"],
    ihracat: ["toptan ticaret"],
    toptan: ["toptan"],
    perakende: ["perakende"],
    toptanci: ["toptan"],
    hayvancilik: ["hayvan", "yetistir"],
    tarim: ["tarim", "yetistir"],
    sera: ["sera", "ortu alti"]
  };

  // ---------------------------------------------------------------- yardımcılar
  var TR_MAP = { "ı": "i", "İ": "i", "I": "i", "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
    "ö": "o", "Ö": "o", "ç": "c", "Ç": "c", "â": "a", "Â": "a", "î": "i", "Î": "i", "û": "u", "Û": "u" };

  // Karakter-karakter (uzunluğu koruyan) normalleştirme: vurgulama için indeksler orijinal metne denk gelir.
  function norm(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      var m = TR_MAP[ch];
      if (m === undefined) {
        m = ch.toLowerCase();
        if (m.length !== 1) m = ch;
      }
      out += m;
    }
    return out;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function $(id) { return document.getElementById(id); }

  function lsGet(k, def) {
    try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yoksay */ } }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  }

  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  // ---------------------------------------------------------------- veri
  var DATA = window.NACE_DATA;
  if (!DATA || !DATA.items) {
    $("summary").textContent = "Veri dosyası (data/nace.js) yüklenemedi.";
    return;
  }

  var nodes = DATA.nodes || {};          // "01", "01.1", "01.11" → ad
  var sections = DATA.sections || [];    // [{k:"A", t:"...", from:"01", to:"03"}]
  var divToSection = {};
  sections.forEach(function (s) {
    (s.divisions || []).forEach(function (d) { divToSection[d] = s.k; });
  });

  var ITEMS = DATA.items.map(function (r, i) {
    var code = r[0], text = r[1], hz = r[2];
    var div = code.slice(0, 2), grp = code.slice(0, 4), cls = code.slice(0, 5);
    var parents = [nodes[cls], nodes[grp], nodes[div]].filter(Boolean);
    return {
      i: i,
      code: code,
      digits: code.replace(/\D/g, ""),
      text: text,
      hz: hz,
      div: div,
      sec: r[3] || divToSection[div] || "",
      note: r[4] || "",
      star: !!r[5],
      nText: norm(text),
      nParents: norm(parents.join(" | "))
    };
  });
  var BY_CODE = {};
  ITEMS.forEach(function (it) { BY_CODE[it.code] = it; });

  // ---------------------------------------------------------------- durum
  var state = {
    q: "",
    hazards: {},
    section: "",
    division: "",
    sort: "relevance",
    shown: PAGE,
    results: [],
    terms: []
  };
  var cart = lsGet(LS.cart, []).filter(function (c) { return BY_CODE[c]; });

  // ---------------------------------------------------------------- arama
  function parseQuery(q) {
    var nq = norm(q.trim());
    if (!nq) return { kind: "none" };
    if (/^[\d.\s]+$/.test(nq)) return { kind: "code", digits: nq.replace(/\D/g, "") };
    var tokens = nq.split(/[\s,;/]+/).filter(function (t) { return t.length > 0; });
    var groups = tokens.map(function (t) {
      var alts = [t];
      if (SYNONYMS[t]) alts = alts.concat(SYNONYMS[t]);
      // Basit ek temizleme: "kuaforler", "berberi" vb. için kök denemesi
      var weak = [];
      if (t.length >= 6) weak.push(t.slice(0, t.length - 2));
      if (t.length >= 8) weak.push(t.slice(0, t.length - 3));
      return { raw: t, alts: dedupe(alts), weak: weak };
    });
    return { kind: "text", groups: groups };
  }

  function dedupe(arr) {
    var seen = {}, out = [];
    arr.forEach(function (a) { if (!seen[a]) { seen[a] = 1; out.push(a); } });
    return out;
  }

  var LETTER = /[a-z0-9]/;
  // Kelimenin sonu veya yaygın Türkçe çekim/yapım ekleriyle biten eşleşmeler "tam kelime" sayılır.
  var SUFFIX = /^(?:ler|lar|i|u|in|un|nin|nun|si|su|e|a|de|da|den|dan|ndan|nden|ci|cu|cilik|culuk|lik|luk|li|lu|ni|nu|n|y|yi|yu){1,3}(?![a-z0-9])/;

  function wordStart(hay, idx) {
    return idx === 0 || !LETTER.test(hay[idx - 1]);
  }
  function wholeWord(hay, idx, len) {
    var end = idx + len;
    if (end >= hay.length || !LETTER.test(hay[end])) return true;
    return SUFFIX.test(hay.slice(end, end + 7));
  }

  // Bir terimin metindeki en iyi eşleşme puanı (0 = yok)
  function termScore(hay, term) {
    var best = 0, from = 0, idx;
    var short = term.length < 4;
    while ((idx = hay.indexOf(term, from)) >= 0) {
      var ws = wordStart(hay, idx);
      if (!short || ws) {
        var sc = 1 + (ws ? 3 : 0) + (ws && wholeWord(hay, idx, term.length) ? 5 : 0);
        if (sc > best) best = sc;
        if (best === 9) break;
      }
      from = idx + 1;
    }
    return best;
  }

  function scoreGroup(it, g) {
    var best = 0, hits = 0, k, sc;
    for (k = 0; k < g.alts.length; k++) {
      sc = termScore(it.nText, g.alts[k]);
      if (sc) {
        hits++;
        sc += k === 0 ? 8 : 7;
        if (sc > best) best = sc;
      } else if (termScore(it.nParents, g.alts[k]) >= 4) {
        hits++;
        if (best < 4) best = 4;
      }
    }
    if (best > 4) {
      // Üst sınıf başlığı da aynı kavramı içeriyorsa (ör. "Kuaförlük ve berberlik faaliyetleri") öne çıkar
      for (k = 0; k < g.alts.length; k++) {
        if (termScore(it.nParents, g.alts[k]) >= 4) { best += 2; break; }
      }
    }
    if (!best) {
      for (k = 0; k < g.weak.length; k++) {
        if (termScore(it.nText, g.weak[k]) >= 4) { best = 6; break; }
        if (termScore(it.nParents, g.weak[k]) >= 4) best = Math.max(best, 2);
      }
    }
    return best ? best + Math.min(hits - 1, 3) : 0;
  }

  function run() {
    var pq = parseQuery(state.q);
    var hzOn = Object.keys(state.hazards).filter(function (k) { return state.hazards[k]; });
    var out = [];
    var terms = [];

    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i];
      if (hzOn.length && !state.hazards[it.hz]) continue;
      if (state.section && it.sec !== state.section) continue;
      if (state.division && it.div !== state.division) continue;

      var score = 0;
      if (pq.kind === "code") {
        if (it.digits.indexOf(pq.digits) !== 0) continue;
        score = 100 - (it.digits.length - pq.digits.length);
      } else if (pq.kind === "text") {
        var ok = true;
        for (var g = 0; g < pq.groups.length; g++) {
          var s = scoreGroup(it, pq.groups[g]);
          if (!s) { ok = false; break; }
          score += s;
        }
        if (!ok) continue;
      }
      out.push({ it: it, score: score });
    }

    if (pq.kind === "text") {
      pq.groups.forEach(function (g) { terms = terms.concat(g.alts, g.weak); });
    }
    state.terms = dedupe(terms).filter(function (t) { return t.length >= 2; })
      .sort(function (a, b) { return b.length - a.length; });

    var cmpCode = function (a, b) { return a.it.code < b.it.code ? -1 : a.it.code > b.it.code ? 1 : 0; };
    var sorters = {
      relevance: function (a, b) { return (b.score - a.score) || cmpCode(a, b); },
      code: cmpCode,
      "hazard-desc": function (a, b) { return (b.it.hz - a.it.hz) || cmpCode(a, b); },
      "hazard-asc": function (a, b) { return (a.it.hz - b.it.hz) || cmpCode(a, b); },
      name: function (a, b) { return a.it.text.localeCompare(b.it.text, "tr") || cmpCode(a, b); }
    };
    var sorter = sorters[state.sort] || sorters.relevance;
    if (state.sort === "relevance" && pq.kind !== "text") sorter = cmpCode;
    out.sort(sorter);
    state.results = out.map(function (o) { return o.it; });
    render();
  }

  // ---------------------------------------------------------------- vurgulama
  function highlight(text) {
    if (!state.terms.length) return esc(text);
    var n = norm(text);
    var marks = new Array(text.length);
    state.terms.forEach(function (t) {
      var from = 0, idx;
      while ((idx = n.indexOf(t, from)) >= 0) {
        for (var j = idx; j < idx + t.length; j++) marks[j] = true;
        from = idx + t.length;
      }
    });
    var html = "", open = false;
    for (var i = 0; i < text.length; i++) {
      if (marks[i] && !open) { html += "<mark>"; open = true; }
      if (!marks[i] && open) { html += "</mark>"; open = false; }
      html += esc(text[i]);
    }
    if (open) html += "</mark>";
    return html;
  }

  function hzBadge(hz) {
    var h = HAZARD[hz];
    if (!h) return '<span class="hz">—</span>';
    return '<span class="hz ' + h.cls + '">' + h.label + "</span>";
  }

  function codeHtml(code) {
    if (state.q && /^[\d.\s]+$/.test(state.q.trim())) {
      var digits = state.q.replace(/\D/g, "");
      var html = "", count = 0, open = false;
      for (var i = 0; i < code.length; i++) {
        var isDigit = /\d/.test(code[i]);
        var inside = count < digits.length;
        if (inside && !open) { html += "<mark>"; open = true; }
        if (!inside && open) { html += "</mark>"; open = false; }
        html += code[i];
        if (isDigit) count++;
      }
      if (open) html += "</mark>";
      return html;
    }
    return esc(code);
  }

  // ---------------------------------------------------------------- çizim
  function render() {
    var res = state.results;
    var tb = $("tbody");
    var slice = res.slice(0, state.shown);
    var html = "";
    for (var i = 0; i < slice.length; i++) {
      var it = slice[i];
      var inCart = cart.indexOf(it.code) >= 0;
      html += '<tr data-code="' + it.code + '">' +
        '<td class="col-code"><button type="button" class="code-btn" data-copy="' + it.code + '" title="Kodu kopyala">' + codeHtml(it.code) + "</button></td>" +
        '<td class="desc"><span class="desc-text">' + highlight(it.text) + "</span>" +
        (it.note ? ' <span class="tag" title="' + esc(it.note) + '">' + esc(it.note.split(":")[0]) + "</span>" : "") +
        (nodes[it.code.slice(0, 5)] ? '<span class="parent">' + esc(nodes[it.code.slice(0, 5)]) + "</span>" : "") +
        "</td>" +
        '<td class="col-hz">' + hzBadge(it.hz) + "</td>" +
        '<td class="col-act"><button type="button" class="star' + (inCart ? " on" : "") + '" data-star="' + it.code +
        '" aria-pressed="' + inCart + '" title="' + (inCart ? "Müşteri dosyasından çıkar" : "Müşteri dosyasına ekle") + '">' + (inCart ? "★" : "☆") + "</button></td>" +
        "</tr>";
    }
    tb.innerHTML = html;
    $("empty").hidden = res.length > 0;
    $("btnMore").hidden = res.length <= state.shown;
    $("btnMore").textContent = "Daha fazla göster (" + (res.length - state.shown) + " kayıt daha)";

    // özet ve sınıf sayıları
    var c = { 1: 0, 2: 0, 3: 0 };
    res.forEach(function (it) { c[it.hz] = (c[it.hz] || 0) + 1; });
    var total = ITEMS.length;
    var txt = res.length === total ? total.toLocaleString("tr-TR") + " faaliyet kodunun tamamı listeleniyor"
      : res.length.toLocaleString("tr-TR") + " sonuç (toplam " + total.toLocaleString("tr-TR") + " kod)";
    $("summary").innerHTML = esc(txt) +
      (res.length ? ' <span class="split"><span class="dot h1"></span>' + c[1] + ' <span class="dot h2"></span>' + c[2] + ' <span class="dot h3"></span>' + c[3] + "</span>" : "");

    var exportDisabled = res.length === 0;
    ["btnXlsx", "btnPdf", "btnCsv"].forEach(function (id) { $(id).disabled = exportDisabled; });
  }

  function updateHazardCounts() {
    var c = { 1: 0, 2: 0, 3: 0 };
    ITEMS.forEach(function (it) { c[it.hz] = (c[it.hz] || 0) + 1; });
    $("c1").textContent = c[1]; $("c2").textContent = c[2]; $("c3").textContent = c[3];
  }

  function fillSections() {
    var sel = $("section");
    sections.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.k;
      o.textContent = s.k + " – " + titleCase(s.t);
      sel.appendChild(o);
    });
  }

  function fillDivisions() {
    var sel = $("division");
    var current = state.division;
    sel.innerHTML = '<option value="">Tüm alt gruplar</option>';
    var divs = Object.keys(nodes).filter(function (k) { return /^\d\d$/.test(k); }).sort();
    divs.forEach(function (d) {
      if (state.section && divToSection[d] !== state.section) return;
      var o = document.createElement("option");
      o.value = d;
      o.textContent = d + " – " + nodes[d];
      sel.appendChild(o);
    });
    sel.value = current;
    if (sel.value !== current) state.division = "";
  }

  function titleCase(s) {
    // "TARIM, ORMANCILIK VE BALIKÇILIK" → "Tarım, ormancılık ve balıkçılık"
    if (s !== s.toLocaleUpperCase("tr")) return s;
    var low = s.toLocaleLowerCase("tr");
    return low.charAt(0).toLocaleUpperCase("tr") + low.slice(1);
  }

  // ---------------------------------------------------------------- detay
  function openDetail(code) {
    var it = BY_CODE[code];
    if (!it) return;
    var h = HAZARD[it.hz] || {};
    var chain = [];
    var sec = sections.filter(function (s) { return s.k === it.sec; })[0];
    if (sec) chain.push(["Bölüm " + sec.k, titleCase(sec.t)]);
    [it.code.slice(0, 2), it.code.slice(0, 4), it.code.slice(0, 5)].forEach(function (k) {
      if (nodes[k]) chain.push([k, nodes[k]]);
    });
    var siblings = ITEMS.filter(function (x) { return x.code.slice(0, 5) === it.code.slice(0, 5) && x.code !== it.code; });
    var inCart = cart.indexOf(it.code) >= 0;

    var html = '<div class="detail-head"><span class="detail-code">' + esc(it.code) + "</span>" + hzBadge(it.hz) + "</div>" +
      '<h2 class="detail-title">' + esc(it.text) + "</h2>" +
      '<ol class="chain">' + chain.map(function (c) { return "<li><b>" + esc(c[0]) + "</b> " + esc(c[1]) + "</li>"; }).join("") + "</ol>" +
      (it.note ? '<p class="note-line">Resmî değişiklik notu: <b>' + esc(it.note) + "</b></p>" : "") +
      (it.star && DATA.meta && DATA.meta.footnotes && DATA.meta.footnotes.length
        ? '<p class="note-line warn">* ' + esc(DATA.meta.footnotes[0]) + "</p>" : "") +
      '<div class="detail-actions">' +
      '<button type="button" class="btn" data-copy="' + it.code + '">Kodu kopyala</button>' +
      '<button type="button" class="btn ghost" data-star="' + it.code + '">' + (inCart ? "★ Dosyadan çıkar" : "☆ Müşteri dosyasına ekle") + "</button>" +
      "</div>";
    if (h.label) {
      html += '<div class="obligations ' + h.cls + '"><h3>' + h.label + " işyeri için özet yükümlülükler</h3><ul>" +
        obligations(it.hz).map(function (o) { return "<li>" + o + "</li>"; }).join("") + "</ul></div>";
    }
    if (siblings.length) {
      html += '<h3 class="sib-title">Aynı sınıftaki diğer kodlar (' + esc(it.code.slice(0, 5)) + ")</h3><ul class=\"siblings\">" +
        siblings.map(function (s) {
          return '<li><button type="button" class="link" data-open="' + s.code + '"><b>' + s.code + "</b> " + esc(s.text) + "</button> " + hzBadge(s.hz) + "</li>";
        }).join("") + "</ul>";
    }
    $("detailBody").innerHTML = html;
    var dlg = $("detail");
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  }

  function obligations(hz) {
    var t = {
      1: ["C sınıfı (veya üstü) iş güvenliği uzmanı görevlendirilmeli", "Risk değerlendirmesi ve acil durum planı en geç 6 yılda bir yenilenir",
        "Çalışan İSG eğitimi en az 8 saat, 3 yılda bir tekrarlanır", "Periyodik sağlık muayenesi 5 yılda bir",
        "Her 20 çalışana 1 ilk yardımcı", "10'dan az çalışanı olan az tehlikeli işyerlerinde işveren veya vekili (şartları sağlarsa) İSG hizmetini kendisi yürütebilir"],
      2: ["B sınıfı (veya üstü) iş güvenliği uzmanı görevlendirilmeli", "Risk değerlendirmesi ve acil durum planı en geç 4 yılda bir yenilenir",
        "Çalışan İSG eğitimi en az 12 saat, 2 yılda bir tekrarlanır", "Periyodik sağlık muayenesi 3 yılda bir", "Her 15 çalışana 1 ilk yardımcı"],
      3: ["A sınıfı iş güvenliği uzmanı görevlendirilmeli", "Risk değerlendirmesi ve acil durum planı en geç 2 yılda bir yenilenir",
        "Çalışan İSG eğitimi en az 16 saat, her yıl tekrarlanır", "Periyodik sağlık muayenesi yılda bir", "Her 10 çalışana 1 ilk yardımcı"]
    };
    return t[hz] || [];
  }

  // ---------------------------------------------------------------- müşteri dosyası
  function toggleCart(code) {
    var i = cart.indexOf(code);
    if (i >= 0) { cart.splice(i, 1); toast(code + " dosyadan çıkarıldı"); }
    else { cart.push(code); toast(code + " müşteri dosyasına eklendi"); }
    lsSet(LS.cart, cart);
    renderCart();
    render();
    if ($("detail").open) openDetail(code);
  }

  function renderCart() {
    var ul = $("cart");
    $("cartCount").textContent = cart.length;
    ["cartXlsx", "cartPdf", "cartClear"].forEach(function (id) { $(id).disabled = cart.length === 0; });
    if (!cart.length) { ul.innerHTML = '<li class="muted small empty-cart">Henüz kod eklenmedi.</li>'; return; }
    var maxHz = 0;
    ul.innerHTML = cart.map(function (code) {
      var it = BY_CODE[code];
      if (it.hz > maxHz) maxHz = it.hz;
      return '<li><button type="button" class="link" data-open="' + code + '"><b>' + code + "</b> " + esc(it.text) + "</button>" +
        '<span class="cart-row">' + hzBadge(it.hz) + '<button type="button" class="x" data-star="' + code + '" aria-label="Çıkar">×</button></span></li>';
    }).join("") + (cart.length > 1 && HAZARD[maxHz]
      ? '<li class="cart-note small">Birden fazla faaliyette, tehlike sınıfı en yüksek olan esas alınır: <b>' + HAZARD[maxHz].label + "</b></li>" : "");
  }

  // ---------------------------------------------------------------- dışa aktarma
  function rowsFor(items) {
    return items.map(function (it) {
      var sec = sections.filter(function (s) { return s.k === it.sec; })[0];
      return {
        code: it.code,
        text: it.text,
        hz: it.hz,
        hzLabel: HAZARD[it.hz] ? HAZARD[it.hz].label : "",
        section: sec ? sec.k + " – " + titleCase(sec.t) : "",
        division: nodes[it.div] ? it.div + " – " + nodes[it.div] : it.div
      };
    });
  }

  function filterDescription() {
    var parts = [];
    if (state.q.trim()) parts.push('Arama: "' + state.q.trim() + '"');
    var hz = Object.keys(state.hazards).filter(function (k) { return state.hazards[k]; })
      .map(function (k) { return HAZARD[k].label; });
    if (hz.length) parts.push("Tehlike sınıfı: " + hz.join(", "));
    if (state.section) parts.push("Bölüm: " + state.section);
    if (state.division) parts.push("Alt grup: " + state.division);
    return parts.length ? parts.join(" · ") : "Filtre yok (tüm liste)";
  }

  function sourceLine() {
    var m = DATA.meta || {};
    return "Kaynak: " + (m.source || "ÇSGB İşyeri Tehlike Sınıfları Tebliği Ek-1") +
      (m.lastAmendment ? " (son değişiklik: " + m.lastAmendment + ")" : "") +
      " · Veri tarihi: " + fmtDate(m.updatedAt);
  }

  var xlsxLoading = null;
  function exportXlsx(items, title, fileBase, info) {
    if (!xlsxLoading) xlsxLoading = window.XLSX ? Promise.resolve() : loadScript("vendor/xlsx.full.min.js");
    xlsxLoading.then(function () { writeXlsx(items, title, fileBase, info); })
      .catch(function () { xlsxLoading = null; toast("Excel kütüphanesi yüklenemedi"); });
  }

  function writeXlsx(items, title, fileBase, info) {
    var rows = rowsFor(items);
    var aoa = [["NACE Kodu", "Faaliyet Tanımı", "Tehlike Sınıfı", "Bölüm", "Ana Faaliyet Grubu"]];
    rows.forEach(function (r) { aoa.push([r.code, r.text, r.hzLabel, r.section, r.division]); });
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 11 }, { wch: 90 }, { wch: 14 }, { wch: 40 }, { wch: 50 }];
    ws["!autofilter"] = { ref: "A1:E" + aoa.length };
    var infoAoa = [[title], [], ["Oluşturma tarihi", new Date().toLocaleString("tr-TR")], ["Filtre", info], ["Kayıt sayısı", rows.length],
      ["Kaynak", (DATA.meta && DATA.meta.source) || ""], ["Kaynak adresi", (DATA.meta && DATA.meta.sourceUrl) || ""],
      ["Son değişiklik", (DATA.meta && DATA.meta.lastAmendment) || ""], ["Veri tarihi", fmtDate(DATA.meta && DATA.meta.updatedAt)], [],
      ["Not", "Tehlike sınıfının tespitinde işyerinde yürütülen asıl iş esas alınır; birden fazla asıl iş varsa tehlike sınıfı yüksek olan dikkate alınır."]];
    var wsInfo = XLSX.utils.aoa_to_sheet(infoAoa);
    wsInfo["!cols"] = [{ wch: 18 }, { wch: 100 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NACE Listesi");
    XLSX.utils.book_append_sheet(wb, wsInfo, "Bilgi");
    XLSX.writeFile(wb, fileBase + "_" + stamp() + ".xlsx");
  }

  function exportCsv(items, fileBase) {
    var rows = rowsFor(items);
    var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
    var lines = ["NACE Kodu;Faaliyet Tanımı;Tehlike Sınıfı;Bölüm;Ana Faaliyet Grubu"];
    rows.forEach(function (r) { lines.push([r.code, r.text, r.hzLabel, r.section, r.division].map(q).join(";")); });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    download(blob, fileBase + "_" + stamp() + ".csv");
  }

  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  var libsLoading = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function loadPdfLibs() {
    if (!libsLoading) {
      libsLoading = loadScript("vendor/jspdf.umd.min.js")
        .then(function () { return loadScript("vendor/jspdf.plugin.autotable.min.js"); })
        .then(function () { return loadScript("vendor/fonts/dejavu.js"); });
    }
    return libsLoading;
  }

  function exportPdf(items, title, fileBase, info) {
    toast("PDF hazırlanıyor…");
    loadPdfLibs().then(function () {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      var F = window.NACE_FONTS;
      doc.addFileToVFS("DejaVu.ttf", F.regular);
      doc.addFont("DejaVu.ttf", "DejaVu", "normal");
      doc.addFileToVFS("DejaVu-Bold.ttf", F.bold);
      doc.addFont("DejaVu-Bold.ttf", "DejaVu", "bold");
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(14);
      doc.text(title, 14, 15);
      doc.setFont("DejaVu", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(info + "  ·  " + items.length + " kayıt  ·  " + new Date().toLocaleString("tr-TR"), 14, 21);
      doc.text(sourceLine(), 14, 25.5);
      doc.setTextColor(0);

      var rows = rowsFor(items);
      doc.autoTable({
        startY: 30,
        head: [["NACE Kodu", "Faaliyet Tanımı", "Tehlike Sınıfı"]],
        body: rows.map(function (r) { return [r.code, r.text, r.hzLabel]; }),
        styles: { font: "DejaVu", fontSize: 8.5, cellPadding: 1.6, valign: "middle", overflow: "linebreak" },
        headStyles: { font: "DejaVu", fontStyle: "bold", fillColor: [29, 78, 216], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: { 0: { cellWidth: 22, fontStyle: "bold" }, 2: { cellWidth: 30 } },
        didParseCell: function (d) {
          if (d.section === "body" && d.column.index === 2) {
            var hz = rows[d.row.index].hz;
            if (HAZARD[hz]) { d.cell.styles.textColor = HAZARD[hz].rgb; d.cell.styles.fontStyle = "bold"; }
          }
        },
        didDrawPage: function () {
          var n = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(120);
          doc.text("Sayfa " + n, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });
          doc.setTextColor(0);
        }
      });
      doc.save(fileBase + "_" + stamp() + ".pdf");
      toast("PDF indirildi");
    }).catch(function (e) {
      console.error(e);
      toast("PDF oluşturulamadı: " + e.message);
    });
  }

  function cartTitle() {
    var name = $("clientName").value.trim();
    return name ? name + " – NACE Kodları" : "Müşteri Dosyası – NACE Kodları";
  }
  function cartFileBase() {
    var name = $("clientName").value.trim();
    var slug = norm(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return slug ? "nace_" + slug : "nace_musteri";
  }
  function cartItems() { return cart.map(function (c) { return BY_CODE[c]; }); }

  // ---------------------------------------------------------------- değişiklikler & kaynak
  function renderSource() {
    var m = DATA.meta || {};
    var parts = [];
    parts.push("<p><b>" + esc(m.source || "ÇSGB İşyeri Tehlike Sınıfları Tebliği, Ek-1") + "</b></p>");
    if (m.lastAmendment) parts.push("<p>Son değişiklik: " + esc(m.lastAmendment) + "</p>");
    if (m.revision) parts.push("<p>Sınıflama: " + esc(m.revision) + "</p>");
    parts.push("<p>Veri tarihi: " + esc(fmtDate(m.updatedAt)) + "</p>");
    parts.push("<p>Resmî liste her gün otomatik kontrol edilir; değişiklik olursa bu sayfa kendiliğinden güncellenir.</p>");
    if (m.sourceUrl) parts.push('<p><a href="' + esc(m.sourceUrl) + '" target="_blank" rel="noopener">Tebliği mevzuat.gov.tr\'de aç ↗</a></p>');
    parts.push('<p><a href="data/kaynak/ek1_resmi.xlsx" download>Resmî Ek-1 Excel dosyasını indir</a></p>');
    $("sourceInfo").innerHTML = parts.join("");

    var noted = ITEMS.filter(function (it) { return it.note; }).length + ((m.repealed || []).length);
    if ((DATA.history || []).length || noted) $("btnChanges").hidden = false;
  }

  // Resmî listede "(Ek satır / Değişik satır / Mülga satır: RG-…)" notu taşıyan satırları RG'ye göre gruplar
  function officialChanges() {
    var groups = {};
    function key(note) {
      var m = /RG-?\s*([\d/]+)\s*-\s*(\d+)/.exec(note);
      return m ? m[1] + " tarihli ve " + m[2] + " sayılı RG" : "Diğer";
    }
    function sortKey(k) {
      var m = /^(\d+)\/(\d+)\/(\d+)/.exec(k);
      return m ? Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]) : 0;
    }
    ITEMS.forEach(function (it) {
      if (!it.note) return;
      var k = key(it.note);
      (groups[k] = groups[k] || []).push({ code: it.code, text: it.text, hz: it.hz, type: it.note.split(":")[0] });
    });
    ((DATA.meta && DATA.meta.repealed) || []).forEach(function (r) {
      var k = key(r[1]);
      (groups[k] = groups[k] || []).push({ code: r[0], text: "", hz: 0, type: "Mülga satır" });
    });
    return Object.keys(groups).sort(function (a, b) { return sortKey(b) - sortKey(a); })
      .map(function (k) { return { rg: k, rows: groups[k].sort(function (a, b) { return a.code < b.code ? -1 : 1; }) }; });
  }

  function openChanges() {
    var hist = DATA.history || [];
    var html = "<h2>Listedeki değişiklikler</h2>";
    var oc = officialChanges();
    if (oc.length) {
      html += '<p class="muted small">Resmî Ek-1 listesinde değişiklik notu bulunan satırlar (Resmî Gazete tarihine göre, en yenisi üstte):</p>';
      oc.forEach(function (g) {
        html += '<section class="change"><h3>' + esc(g.rg) + " <span class=\"muted small\">(" + g.rows.length + " satır)</span></h3><ul>" +
          g.rows.map(function (r) {
            return '<li><span class="tag">' + esc(r.type) + "</span> " +
              (r.text ? '<button type="button" class="link" data-open="' + r.code + '"><b>' + r.code + "</b> " + esc(r.text) + "</button> " + hzBadge(r.hz)
                : "<b>" + r.code + "</b> <span class=\"muted\">listeden çıkarıldı</span>") + "</li>";
          }).join("") + "</ul></section>";
      });
    }
    if (hist.length) html += '<h2 class="mt">Otomatik güncellemelerde tespit edilen farklar</h2>';
    hist.forEach(function (h) {
      html += '<section class="change"><h3>' + esc(fmtDate(h.date)) + (h.lastAmendment ? " · " + esc(h.lastAmendment) : "") + "</h3>";
      if (h.note) html += "<p class=\"small muted\">" + esc(h.note) + "</p>";
      var block = function (title, arr, fn) {
        if (!arr || !arr.length) return "";
        return "<h4>" + title + " (" + arr.length + ")</h4><ul>" + arr.slice(0, 300).map(fn).join("") +
          (arr.length > 300 ? "<li>… ve " + (arr.length - 300) + " kayıt daha</li>" : "") + "</ul>";
      };
      html += block("Eklenen kodlar", h.added, function (r) { return "<li><b>" + esc(r[0]) + "</b> " + esc(r[1]) + " " + hzBadge(r[2]) + "</li>"; });
      html += block("Kaldırılan kodlar", h.removed, function (r) { return "<li><b>" + esc(r[0]) + "</b> " + esc(r[1]) + " " + hzBadge(r[2]) + "</li>"; });
      html += block("Tehlike sınıfı değişen kodlar", h.hazardChanged, function (r) {
        return "<li><b>" + esc(r[0]) + "</b> " + esc(r[1]) + " " + hzBadge(r[2]) + " → " + hzBadge(r[3]) + "</li>";
      });
      html += block("Tanımı değişen kodlar", h.textChanged, function (r) {
        return "<li><b>" + esc(r[0]) + "</b> <s>" + esc(r[1]) + "</s><br>" + esc(r[2]) + "</li>";
      });
      html += "</section>";
    });
    $("changesBody").innerHTML = html;
    $("changes").showModal();
  }

  // ---------------------------------------------------------------- olaylar
  var debounceT;
  $("q").addEventListener("input", function (e) {
    clearTimeout(debounceT);
    debounceT = setTimeout(function () {
      state.q = e.target.value;
      state.shown = PAGE;
      syncUrl();
      run();
    }, 120);
  });

  document.querySelectorAll(".chip[data-hazard]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-hazard");
      state.hazards[k] = !state.hazards[k];
      b.setAttribute("aria-pressed", String(!!state.hazards[k]));
      state.shown = PAGE;
      syncUrl();
      run();
    });
  });

  $("section").addEventListener("change", function (e) {
    state.section = e.target.value;
    fillDivisions();
    state.shown = PAGE;
    syncUrl();
    run();
  });
  $("division").addEventListener("change", function (e) {
    state.division = e.target.value;
    state.shown = PAGE;
    syncUrl();
    run();
  });
  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; run(); });

  $("btnReset").addEventListener("click", function () {
    state.q = ""; state.hazards = {}; state.section = ""; state.division = ""; state.sort = "relevance"; state.shown = PAGE;
    $("q").value = ""; $("section").value = ""; $("sort").value = "relevance";
    document.querySelectorAll(".chip[data-hazard]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    fillDivisions();
    syncUrl();
    run();
    $("q").focus();
  });

  $("btnMore").addEventListener("click", function () { state.shown += PAGE * 2; render(); });

  $("btnXlsx").addEventListener("click", function () { exportXlsx(state.results, "NACE Kodları ve Tehlike Sınıfları", "nace_tehlike_siniflari", filterDescription()); });
  $("btnCsv").addEventListener("click", function () { exportCsv(state.results, "nace_tehlike_siniflari"); });
  $("btnPdf").addEventListener("click", function () {
    if (state.results.length > 1500 && !confirm(state.results.length + " kayıtlık büyük bir PDF oluşturulacak. Devam edilsin mi?")) return;
    exportPdf(state.results, "NACE Kodları ve Tehlike Sınıfları", "nace_tehlike_siniflari", filterDescription());
  });

  $("cartXlsx").addEventListener("click", function () { exportXlsx(cartItems(), cartTitle(), cartFileBase(), "Müşteri dosyası"); });
  $("cartPdf").addEventListener("click", function () { exportPdf(cartItems(), cartTitle(), cartFileBase(), "Müşteri dosyası"); });
  $("cartClear").addEventListener("click", function () {
    if (!confirm("Müşteri dosyasındaki tüm kodlar silinsin mi?")) return;
    cart = []; lsSet(LS.cart, cart); renderCart(); render();
  });
  $("clientName").value = lsGet(LS.client, "");
  $("clientName").addEventListener("input", function (e) { lsSet(LS.client, e.target.value); });

  $("btnChanges").addEventListener("click", openChanges);

  // Tablo, detay ve dosya içindeki tıklamalar (olay delegasyonu)
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-copy],[data-star],[data-open],tr[data-code]");
    if (!t) return;
    if (t.hasAttribute("data-copy")) {
      e.stopPropagation();
      var code = t.getAttribute("data-copy");
      copyText(code).then(function () { toast(code + " panoya kopyalandı"); });
      return;
    }
    if (t.hasAttribute("data-star")) { e.stopPropagation(); toggleCart(t.getAttribute("data-star")); return; }
    if (t.hasAttribute("data-open")) {
      if ($("changes").open) $("changes").close();
      openDetail(t.getAttribute("data-open"));
      return;
    }
    if (t.hasAttribute("data-code")) { openDetail(t.getAttribute("data-code")); }
  });

  function copyText(s) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s);
    var ta = document.createElement("textarea");
    ta.value = s; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* yoksay */ }
    ta.remove();
    return Promise.resolve();
  }

  // "/" ile aramaya odaklan
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== $("q") && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      $("q").focus();
      $("q").select();
    }
  });

  // Tema
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme(lsGet(LS.theme, ""));
  $("btnTheme").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var dark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    applyTheme(next);
    lsSet(LS.theme, next);
  });

  // URL ile paylaşılabilir arama (?q=kuafor&t=2,3&b=G)
  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q.trim()) p.set("q", state.q.trim());
    var hz = Object.keys(state.hazards).filter(function (k) { return state.hazards[k]; });
    if (hz.length) p.set("t", hz.join(","));
    if (state.section) p.set("b", state.section);
    if (state.division) p.set("g", state.division);
    var s = p.toString();
    try { history.replaceState(null, "", s ? "?" + s : location.pathname); } catch (e) { /* file:// */ }
  }
  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.q = p.get("q") || "";
    $("q").value = state.q;
    (p.get("t") || "").split(",").forEach(function (k) {
      if (HAZARD[k]) {
        state.hazards[k] = true;
        var b = document.querySelector('.chip[data-hazard="' + k + '"]');
        if (b) b.setAttribute("aria-pressed", "true");
      }
    });
    state.section = p.get("b") || "";
    $("section").value = state.section;
    if ($("section").value !== state.section) state.section = "";
    fillDivisions();
    state.division = p.get("g") || "";
    $("division").value = state.division;
    if ($("division").value !== state.division) state.division = "";
  }

  // ---------------------------------------------------------------- başlat
  fillSections();
  updateHazardCounts();
  readUrl();
  renderSource();
  renderCart();
  run();
})();
