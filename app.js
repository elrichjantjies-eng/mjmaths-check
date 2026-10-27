/* Maths Check — the learner app. Learners record, per question, the mark they
   gave themselves, a level 1–3 and an optional note, then send the result to
   their tutor on WhatsApp. Everything stays on this phone until it is sent.
   Formats: CONTRACTS.md (core.js). No server, no accounts, no tracking. */
(function () {
  "use strict";
  var C = window.MCCore;
  var app = document.getElementById("app");

  // ── words ──────────────────────────────────────────────────────
  var WORDS = {
    en: {
      tutorDefault: "your tutor", scan: "Scan worksheet QR", paste: "Paste a link", my: "My worksheets",
      none: "No worksheets yet. Scan the QR code on {tutor}'s screen to start.",
      inprog: "In progress", sent: "Sent {when}", edited: "Changed since sent", ofq: "{done} of {count} questions",
      sofar: "{marks} / {max} marks so far", qsmarks: "{n} questions · {tot} marks",
      who: "Who are you?", name: "Your name and surname", code: "Learner code (optional)",
      codeHint: "If {tutor} gave you a code, type it here. It makes sure your results reach the right name.",
      privacy: "Only your name, marks, levels and notes are kept on this phone until you send them to {tutor}.",
      cont: "Continue", nameNeeded: "Type your name first.", changeLearner: "Change learner", someoneNew: "Someone new",
      onPhone: "Learners on this phone", remove: "Remove from this phone",
      removeQ: "Remove {name} and all their worksheets from this phone?",
      mark: "Your mark", outOf: "out of {max}", skip: "Didn't attempt", how: "How did it go?",
      markFirst: "First your mark, then how it went.", addNote: "+ Add a note", note: "Note (optional)",
      notAttempted: "Not attempted", level: "Level {n}", half: "+ ½ mark", reviewSend: "Review & send",
      allDone: "All done! Review and send when you're ready.", back: "Back",
      review: "Review", selfMarked: "self-marked", sections: "Sections", todo: "Still to do ({n})",
      allMarked: "Every question has a mark and a level.", todoHint: "Tap a question to finish it — or send as it is.",
      comment: "What should we go over next lesson? (optional)", send: "Send to {tutor} on WhatsApp",
      sendAgain: "Send the new version to {tutor}", sentAt: "Sent {when}",
      changedAfter: "You changed something after sending. Send again so {tutor} gets the new version.",
      onlyThis: "Only your name, marks, levels, notes and comment are sent.",
      sentOk: "Sent — thank you!", cancelled: "Not sent.",
      fbTitle: "Send your result", fbIntro: "This phone can't attach the file from here. Choose one of these:",
      fbMsg: "Send as a WhatsApp message", fbPart: "Send part {i} of {n}", fbFile: "Download the file",
      fbFileHow: "Then open WhatsApp, choose {tutor}'s chat, tap 📎 → Document and pick the MathsCheck file.",
      fbCopy: "Copy the result", copied: "Copied — paste it into a WhatsApp chat.", fbDone: "I've sent it",
      scanMsg: "Point the camera at the QR code on {tutor}'s screen.", noCam: "The camera isn't available. Allow camera access in your settings, or paste the link instead.",
      notWs: "That isn't a Maths Check worksheet.", newer: "This worksheet needs a newer Maths Check. Close the app completely and open it again.",
      pasteTitle: "Paste the worksheet link", pasteHint: "Long-press in the box and choose Paste.", open: "Open", cancel: "Cancel",
      installT: "Add Maths Check to your home screen", installB: "Then it opens like an app — even without internet.",
      install: "Install", notNow: "Not now", ok: "OK",
      iosHow: "Tap Share (the square with an arrow) and then “Add to Home Screen”.",
      andHow: "In the browser menu (⋮) tap “Add to Home screen” or “Install app”.",
      iosTip: "On iPhone, scan new worksheets with the Scan button here, not with the camera app.",
      update: "New version available — tap to update", noStore: "This browser can't save your work. Don't close this page until you've sent it.",
      privacyT: "Privacy", help: "Help", privacy1: "Maths Check keeps your name, learner code, marks, levels, notes and comment on this phone only.",
      privacy2: "Nothing is sent anywhere until you tap Send. Then the result goes to {tutor} through WhatsApp, which you choose.",
      privacy3: "There are no accounts, no adverts and no tracking. The app only loads from its own web address.",
      privacy4: "To delete everything, use “Change learner → Remove from this phone”, or clear this site's data in your browser.",
      helpT: "How it works", help1: "Do the worksheet on paper and mark it with the memo.",
      help2: "Scan the QR code on {tutor}'s screen.", help3: "For every question tap your mark, then how it went (level 1, 2 or 3).",
      help4: "Tap Review & send, then choose {tutor} in WhatsApp.", levelsT: "The levels",
      share: "{name} — {title} — {total}/{max}", version: "Version {v}"
    },
    af: {
      tutorDefault: "jou onderwyser", scan: "Skandeer werkblad-QR", paste: "Plak 'n skakel", my: "My werkblaaie",
      none: "Nog geen werkblaaie nie. Skandeer die QR-kode op {tutor} se skerm om te begin.",
      inprog: "Besig", sent: "Gestuur {when}", edited: "Verander sedert gestuur", ofq: "{done} van {count} vrae",
      sofar: "{marks} / {max} punte tot dusver", qsmarks: "{n} vrae · {tot} punte",
      who: "Wie is jy?", name: "Jou naam en van", code: "Leerderkode (opsioneel)",
      codeHint: "As {tutor} vir jou 'n kode gegee het, tik dit hier. Dan kom jou uitslae by die regte naam uit.",
      privacy: "Net jou naam, punte, vlakke en notas word op hierdie foon gehou totdat jy dit vir {tutor} stuur.",
      cont: "Gaan voort", nameNeeded: "Tik eers jou naam.", changeLearner: "Ander leerder", someoneNew: "Iemand nuut",
      onPhone: "Leerders op hierdie foon", remove: "Verwyder van hierdie foon",
      removeQ: "Verwyder {name} en al hul werkblaaie van hierdie foon?",
      mark: "Jou punt", outOf: "uit {max}", skip: "Nie probeer nie", how: "Hoe het dit gegaan?",
      markFirst: "Eers jou punt, dan hoe dit gegaan het.", addNote: "+ Voeg 'n nota by", note: "Nota (opsioneel)",
      notAttempted: "Nie probeer nie", level: "Vlak {n}", half: "+ ½ punt", reviewSend: "Hersien en stuur",
      allDone: "Alles klaar! Hersien en stuur wanneer jy gereed is.", back: "Terug",
      review: "Hersien", selfMarked: "self nagesien", sections: "Afdelings", todo: "Nog oor ({n})",
      allMarked: "Elke vraag het 'n punt en 'n vlak.", todoHint: "Tik op 'n vraag om dit klaar te maak — of stuur soos dit is.",
      comment: "Wat moet ons volgende les weer behandel? (opsioneel)", send: "Stuur vir {tutor} op WhatsApp",
      sendAgain: "Stuur die nuwe weergawe vir {tutor}", sentAt: "Gestuur {when}",
      changedAfter: "Jy het iets verander nadat jy gestuur het. Stuur weer sodat {tutor} die nuwe weergawe kry.",
      onlyThis: "Net jou naam, punte, vlakke, notas en kommentaar word gestuur.",
      sentOk: "Gestuur — dankie!", cancelled: "Nie gestuur nie.",
      fbTitle: "Stuur jou uitslag", fbIntro: "Hierdie foon kan nie die lêer van hier af aanheg nie. Kies een hiervan:",
      fbMsg: "Stuur as 'n WhatsApp-boodskap", fbPart: "Stuur deel {i} van {n}", fbFile: "Laai die lêer af",
      fbFileHow: "Maak dan WhatsApp oop, kies {tutor} se klets, tik 📎 → Dokument en kies die MathsCheck-lêer.",
      fbCopy: "Kopieer die uitslag", copied: "Gekopieer — plak dit in 'n WhatsApp-klets.", fbDone: "Ek het dit gestuur",
      scanMsg: "Rig die kamera op die QR-kode op {tutor} se skerm.", noCam: "Die kamera is nie beskikbaar nie. Gee die kamera toegang in jou instellings, of plak eerder die skakel.",
      notWs: "Dit is nie 'n Maths Check-werkblad nie.", newer: "Hierdie werkblad het 'n nuwer Maths Check nodig. Maak die toep heeltemal toe en weer oop.",
      pasteTitle: "Plak die werkbladskakel", pasteHint: "Druk lank in die blokkie en kies Plak.", open: "Maak oop", cancel: "Kanselleer",
      installT: "Voeg Maths Check by jou tuisskerm", installB: "Dan maak dit soos 'n toep oop — selfs sonder internet.",
      install: "Installeer", notNow: "Nie nou nie", ok: "Reg so",
      iosHow: "Tik Deel (die vierkant met 'n pyltjie) en dan “Voeg by tuisskerm”.",
      andHow: "Tik in die blaaier se kieslys (⋮) op “Voeg by tuisskerm” of “Installeer toep”.",
      iosTip: "Op 'n iPhone: skandeer nuwe werkblaaie met die Skandeer-knoppie hier, nie met die kamera-toep nie.",
      update: "Nuwe weergawe beskikbaar — tik om op te dateer", noStore: "Hierdie blaaier kan nie jou werk stoor nie. Moenie die bladsy toemaak voordat jy dit gestuur het nie.",
      privacyT: "Privaatheid", help: "Hulp", privacy1: "Maths Check hou jou naam, leerderkode, punte, vlakke, notas en kommentaar net op hierdie foon.",
      privacy2: "Niks word gestuur voordat jy op Stuur tik nie. Dan gaan die uitslag deur WhatsApp, wat jy kies, na {tutor}.",
      privacy3: "Daar is geen rekeninge, advertensies of opsporing nie. Die toep laai net van sy eie webadres af.",
      privacy4: "Om alles uit te vee: gebruik “Ander leerder → Verwyder van hierdie foon”, of vee hierdie webwerf se data in jou blaaier uit.",
      helpT: "Hoe dit werk", help1: "Doen die werkblad op papier en merk dit met die memorandum.",
      help2: "Skandeer die QR-kode op {tutor} se skerm.", help3: "Tik by elke vraag jou punt, en dan hoe dit gegaan het (vlak 1, 2 of 3).",
      help4: "Tik Hersien en stuur, en kies dan {tutor} in WhatsApp.", levelsT: "Die vlakke",
      share: "{name} — {title} — {total}/{max}", version: "Weergawe {v}"
    }
  };
  var DEFAULT_LV = {
    en: ["I could do it on my own", "I needed help", "I couldn't do it"],
    af: ["Ek kon dit self doen", "Ek het hulp nodig gehad", "Ek kon dit nie doen nie"]
  };

  // ── storage (everything stays on this phone) ──────────────────
  var P = "mc1:";
  var store = {
    ok: true,
    get: function (k, d) {
      try { var v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { store.ok = false; return false; }
    },
    del: function (k) { try { localStorage.removeItem(P + k); } catch (e) { /* ignore */ } },
    keys: function (prefix) {
      var out = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(P + prefix) === 0) out.push(k.slice(P.length)); } }
      catch (e) { /* ignore */ }
      return out;
    }
  };
  try { localStorage.setItem(P + "probe", "1"); localStorage.removeItem(P + "probe"); } catch (e) { store.ok = false; }

  var ui = store.get("ui", {}) || {};
  var learners = store.get("learners", []) || [];
  var me = null;
  var state = { screen: "home", params: {}, depth: 0 };
  var installEvt = null;

  function lang() { return ui.lang === "af" ? "af" : "en"; }
  function t(k, v) {
    var s = (WORDS[lang()] || WORDS.en)[k] || WORDS.en[k] || k;
    return s.replace(/\{(\w+)\}/g, function (m, x) { return v && v[x] !== undefined ? v[x] : (x === "tutor" ? tutor() : m); });
  }
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tutor(ws) { var n = ((ws || {}).to || {}).n || ui.tutor || ""; return n || t("tutorDefault"); }
  function saveUi() { store.set("ui", ui); }
  function fmt(v) { return v === null || v === undefined ? "—" : String(v).replace(".5", "½").replace(/^0½$/, "½"); }
  function niceWhen(iso) { return C.niceTime(iso, lang()); }
  function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }

  function toast(msg, ms) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.tm);
    toast.tm = setTimeout(function () { el.classList.remove("show"); }, ms || 2600);
  }

  // ── model ──────────────────────────────────────────────────────
  function learnerById(id) { return learners.filter(function (l) { return l.id === id; })[0] || null; }
  function setMe(l) { me = l; ui.me = l ? l.id : null; saveUi(); }
  function wsGet(id) { return store.get("ws:" + id, null); }
  function wsPut(ws) { store.set("ws:" + ws.id, ws); }
  function workKey(wsId) { return "work:" + me.id + ":" + wsId; }
  function workGet(ws) {
    var w = store.get(workKey(ws.id), null);
    if (!w) {
      w = { sub: C.uuid(), started: C.localIso(), finished: "", answers: {}, comment: "", sentRev: 0, sentAt: "", dirty: false };
      store.set(workKey(ws.id), w);
    }
    w.answers = w.answers || {};
    return w;
  }
  function workPut(ws, w, edited) {
    if (edited) {
      w.finished = C.localIso();
      if (w.sentRev) w.dirty = true;
    }
    if (!store.set(workKey(ws.id), w)) toast(t("noStore"), 5000);
  }
  function myWorksheets() {
    if (!me) return [];
    return store.keys("work:" + me.id + ":").map(function (k) {
      var id = k.split(":").slice(2).join(":"), ws = wsGet(id), w = store.get(k, null);
      return ws && w ? { ws: ws, work: w } : null;
    }).filter(Boolean).sort(function (a, b) {
      return String(b.work.finished || b.work.started).localeCompare(String(a.work.finished || a.work.started));
    });
  }
  function levels(ws) {
    /* the tutor's labels from the link; the standard ones follow the learner's language */
    var lv = ws.lv || DEFAULT_LV[ws.lang] || DEFAULT_LV.en;
    var std = ["en", "af"].some(function (l) { return lv.join("|") === DEFAULT_LV[l].join("|"); });
    return std ? DEFAULT_LV[lang()] : lv;
  }

  // ── navigation (the phone's back button works inside the app) ──
  function go(screen, params, replace) {
    state = { screen: screen, params: params || {}, depth: replace ? (state.depth || 0) : (state.depth || 0) + 1 };
    try { history[replace ? "replaceState" : "pushState"]({ mc: state }, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
    render();                                          // may scroll to the open question
  }
  window.addEventListener("popstate", function (e) {
    stopCamera();
    state = (e.state && e.state.mc) || { screen: "home", params: {}, depth: 0 };
    render();
  });

  // ── screens ────────────────────────────────────────────────────
  function topBar(title, backTo, extra) {
    return '<header class="top">' +
      (backTo ? '<button class="iconbtn" data-a="back" aria-label="' + esc(t("back")) + '">←</button>' : '<div class="logo" aria-hidden="true">M✓</div>') +
      '<h1>' + esc(title) + '</h1>' + (extra || "") + langSwitch() + '</header>';
  }
  function langSwitch() {
    return '<div class="lang" role="group" aria-label="Language / Taal">' +
      ['en', 'af'].map(function (l) {
        return '<button data-a="lang" data-v="' + l + '" aria-pressed="' + (lang() === l) + '">' + l.toUpperCase() + '</button>';
      }).join("") + '</div>';
  }

  function screenHome() {
    var items = myWorksheets(), h = topBar("Maths Check", false);
    h += '<div class="wrap">';
    if (!store.ok) h += '<div class="card warn">' + esc(t("noStore")) + '</div>';
    h += '<div class="card who"><div class="avatar" aria-hidden="true">' + esc(initials(me.name)) + '</div><div class="grow"><b>' +
      esc(me.name) + '</b>' + (me.code ? ' <span class="muted small">· ' + esc(me.code) + '</span>' : '') +
      '</div><button class="chip" data-a="learners">' + esc(t("changeLearner")) + '</button></div>';
    h += installCard();
    h += '<button class="btn primary" data-a="scan">📷 ' + esc(t("scan")) + '</button>';
    h += '<button class="btn link" data-a="paste">' + esc(t("paste")) + '</button>';
    h += '<h2 class="sec">' + esc(t("my")) + '</h2>';
    if (!items.length) h += '<p class="muted">' + esc(t("none")) + '</p>';
    items.forEach(function (it) {
      var pr = C.progress(it.ws, it.work), w = it.work;
      var badge = w.sentRev ? (w.dirty ? '<span class="badge warn">' + esc(t("edited")) + '</span>' :
        '<span class="badge ok">' + esc(t("sent", { when: niceWhen(w.sentAt).slice(0, 6) })) + '</span>') :
        '<span class="badge">' + esc(t("inprog")) + '</span>';
      h += '<button class="sheet-item" data-a="open" data-v="' + esc(it.ws.id) + '"><div class="t1">' + esc(it.ws.t) + '</div>' +
        '<div class="row small muted"><span class="grow">' + esc(t("ofq", pr)) + ' · ' + fmt(pr.marks) + '/' + fmt(pr.max) + '</span>' + badge + '</div>' +
        '<progress max="' + pr.count + '" value="' + pr.done + '"></progress></button>';
    });
    h += '</div>' + footer();
    return h;
  }

  function installCard() {
    if (standalone() || ui.hintDone) return isIOS() && standalone() && !ui.iosTipDone ?
      '<div class="card small">' + esc(t("iosTip")) + ' <button class="btn link" data-a="iosTipDone">' + esc(t("ok")) + '</button></div>' : "";
    var how = installEvt ? "" : '<p class="small">' + esc(isIOS() ? t("iosHow") : t("andHow")) + '</p>';
    return '<div class="card"><b>' + esc(t("installT")) + '</b><p class="small muted">' + esc(t("installB")) + '</p>' + how +
      '<div class="row">' + (installEvt ? '<button class="btn dark" data-a="install">' + esc(t("install")) + '</button>' : "") +
      '<button class="btn" data-a="hintDone">' + esc(installEvt ? t("notNow") : t("ok")) + '</button></div></div>';
  }

  function footer() {
    return '<div class="foot"><button data-a="help">' + esc(t("help")) + '</button>·<button data-a="privacy">' + esc(t("privacyT")) +
      '</button><div>' + esc(t("version", { v: C.APP_VERSION })) + '</div></div>';
  }
  function initials(n) {
    var p = String(n || "?").trim().split(/\s+/);
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }

  function screenWho() {
    var h = topBar(t("who"), learners.length > 0 && me) + '<div class="wrap">';
    if (learners.length) {
      h += '<h2 class="sec">' + esc(t("onPhone")) + '</h2>';
      learners.forEach(function (l) {
        h += '<div class="card who"><div class="avatar">' + esc(initials(l.name)) + '</div><button class="grow btn" data-a="pick" data-v="' + esc(l.id) + '">' +
          esc(l.name) + '</button><button class="iconbtn" data-a="forget" data-v="' + esc(l.id) + '" aria-label="' + esc(t("remove")) + '">🗑</button></div>';
      });
      h += '<h2 class="sec">' + esc(t("someoneNew")) + '</h2>';
    }
    h += '<div class="card"><label class="f" for="nm">' + esc(t("name")) + '</label>' +
      '<input class="t" id="nm" autocomplete="name" autocapitalize="words" enterkeyhint="next" maxlength="80">' +
      '<label class="f" for="cd">' + esc(t("code")) + '</label>' +
      '<input class="t code" id="cd" autocomplete="off" autocapitalize="characters" maxlength="12" enterkeyhint="done">' +
      '<p class="small muted">' + esc(t("codeHint")) + '</p></div>' +
      '<p class="small muted">🔒 ' + esc(t("privacy")) + '</p>' +
      '<button class="btn primary" data-a="saveWho">' + esc(t("cont")) + '</button></div>';
    return h;
  }

  function qStatus(ws, a, max) {
    var st = C.state(a);
    if (a && a.skip) return '<span class="dot skip"></span><span class="qstat muted">' + esc(t("notAttempted")) + '</span>';
    var m = a && a.m !== null && a.m !== undefined ? fmt(a.m) + "/" + fmt(max) : "";
    var l = a && a.lv ? ' · L' + a.lv : "";
    return '<span class="dot ' + (a && a.lv ? "l" + a.lv : "") + '"></span><span class="qstat' + (st === "done" ? "" : " muted") + '">' + (m || l ? esc(m + l) : "—") + '</span>';
  }

  function qCard(ws, w, i, open) {
    var q = ws.q[i], label = q[0], max = q[1], a = w.answers[label] || {}, st = C.state(a);
    var h = '<div class="q ' + (st === "done" ? "done " : "") + (open ? "open" : "") + '" id="q' + i + '">' +
      '<button class="qrow" data-a="q" data-v="' + i + '" aria-expanded="' + !!open + '"><span class="qlab">' + esc(label) + '</span>' +
      '<span class="qmax">(' + fmt(max) + ')</span>' + qStatus(ws, a, max) + '</button>';
    if (!open) return h + '</div>';
    h += '<div class="qbody"><div class="lbl">' + esc(t("mark")) + ' <span class="muted small">' + esc(t("outOf", { max: fmt(max) })) + '</span></div>';
    var whole = a.m === null || a.m === undefined ? null : Math.floor(a.m), half = a.m !== null && a.m !== undefined && a.m % 1 !== 0;
    if (max <= 10) {
      h += '<div class="marks" role="group" aria-label="' + esc(t("mark")) + '">';
      for (var m = 0; m <= Math.floor(max); m++) {
        h += '<button class="mk" data-a="m" data-i="' + i + '" data-v="' + m + '" aria-pressed="' + (!a.skip && whole === m) + '">' + m + '</button>';
      }
      h += '</div>';
    } else {
      h += '<div class="stepper"><button class="mk" data-a="step" data-i="' + i + '" data-v="-1" aria-label="−1">−</button>' +
        '<div class="val" aria-live="polite">' + (a.skip || a.m === null || a.m === undefined ? "—" : fmt(a.m)) + '<span class="muted small">&nbsp;/ ' + fmt(max) + '</span></div>' +
        '<button class="mk" data-a="step" data-i="' + i + '" data-v="1" aria-label="+1">+</button></div>' +
        '<div class="quick"><button class="mk" data-a="m" data-i="' + i + '" data-v="0">0</button>' +
        '<button class="mk" data-a="m" data-i="' + i + '" data-v="' + Math.round(max / 2) + '">' + Math.round(max / 2) + '</button>' +
        '<button class="mk" data-a="m" data-i="' + i + '" data-v="' + max + '">' + fmt(max) + '</button></div>';
    }
    if (ws.half) {
      h += '<button class="chip half" data-a="half" data-i="' + i + '" aria-pressed="' + half + '">' + esc(t("half")) + '</button>';
    }
    h += '<button class="skipbtn" data-a="skip" data-i="' + i + '" aria-pressed="' + !!a.skip + '">' + esc(t("skip")) + '</button>';
    if (!a.skip) {
      var lv = levels(ws);
      h += '<div class="lbl">' + esc(t("how")) + '</div>';
      if (a.m === null || a.m === undefined) h += '<div class="hint">' + esc(t("markFirst")) + '</div>';
      h += '<div class="levels">' + [1, 2, 3].map(function (n) {
        return '<button class="lv l' + n + '" data-a="lv" data-i="' + i + '" data-v="' + n + '" aria-pressed="' + (a.lv === n) + '"><span class="n">' + n + '</span><span>' + esc(lv[n - 1]) + '</span></button>';
      }).join("") + '</div>';
    }
    if (a.note || state.params.note === i) {
      h += '<label class="f" for="n' + i + '">' + esc(t("note")) + '</label><textarea class="t" id="n' + i + '" data-in="note" data-i="' + i + '" maxlength="500">' + esc(a.note || "") + '</textarea>';
    } else {
      h += '<button class="notebtn" data-a="note" data-i="' + i + '">' + esc(t("addNote")) + '</button>';
    }
    return h + '</div></div>';
  }

  function sheetHead(ws, w) {
    var pr = C.progress(ws, w);
    return '<header class="sheet-head" id="head"><div class="row"><button class="iconbtn" data-a="home" aria-label="' + esc(t("back")) + '">←</button>' +
      '<h1 class="grow">' + esc(ws.t) + '</h1>' + langSwitch() + '</div>' +
      '<progress max="' + pr.count + '" value="' + pr.done + '" aria-label="' + esc(t("ofq", pr)) + '"></progress>' +
      '<div class="sum">' + esc(t("ofq", pr)) + ' · ' + esc(t("sofar", { marks: fmt(pr.marks), max: fmt(pr.max) })) + '</div></header>';
  }

  function screenSheet() {
    var ws = wsGet(state.params.id);
    if (!ws) { go("home", {}, true); return null; }
    var w = workGet(ws), open = state.params.open, pr = C.progress(ws, w);
    if (open === undefined) {                         // first unfinished question
      open = ws.q.findIndex(function (q) { return C.state(w.answers[q[0]]) !== "done"; });
      state.params.open = open;
    }
    var h = sheetHead(ws, w) + '<div class="wrap">';
    ws.sec.forEach(function (name, si) {
      var idx = [];
      ws.q.forEach(function (q, i) { if (Math.min(q[2] || 0, ws.sec.length - 1) === si) idx.push(i); });
      if (!idx.length) return;
      var s = pr.sections[si];
      h += '<div class="sec"><h2>' + (ws.sec.length > 1 || name ? esc((si + 1) + " · " + name) : "") + '</h2><span class="small muted" id="s' + si + '">' +
        s.done + '/' + s.n + '</span></div>';
      idx.forEach(function (i) { h += qCard(ws, w, i, i === open); });
    });
    h += '</div><div class="bar"><button class="btn primary" data-a="review">' + esc(t("reviewSend")) + ' →</button></div>';
    return h;
  }

  function refreshSheet(ws, w, idxs) {
    /* update just the cards that changed (keeps scroll position and the keyboard) */
    idxs.forEach(function (i) {
      var el = document.getElementById("q" + i);
      if (el && i >= 0) el.outerHTML = qCard(ws, w, i, i === state.params.open);
    });
    var head = document.getElementById("head");
    if (head) head.outerHTML = sheetHead(ws, w);
    var pr = C.progress(ws, w);
    pr.sections.forEach(function (s, si) { var e = document.getElementById("s" + si); if (e) e.textContent = s.done + "/" + s.n; });
  }

  function openQuestion(ws, w, i, scroll) {
    var prev = state.params.open;
    state.params.open = i;
    state.params.note = null;
    refreshSheet(ws, w, [prev, i].filter(function (x) { return x !== undefined && x !== null && x >= 0; }));
    var el = document.getElementById("q" + i);
    if (el && scroll !== false) {
      el.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  function advance(ws, w, from) {
    var n = ws.q.length;
    for (var k = 1; k <= n; k++) {
      var i = (from + k) % n;
      if (C.state(w.answers[ws.q[i][0]]) !== "done") { setTimeout(function () { openQuestion(ws, w, i); }, 220); return; }
    }
    state.params.open = -1;
    refreshSheet(ws, w, [from]);
    toast(t("allDone"));
  }

  function screenReview() {
    var ws = wsGet(state.params.id);
    if (!ws) { go("home", {}, true); return null; }
    var w = workGet(ws), pr = C.progress(ws, w), pct = pr.max ? Math.floor(pr.marks / pr.max * 100 + 0.5) : 0;
    var h = topBar(t("review"), true) + '<div class="wrap">';
    h += '<div class="card"><div class="muted small">' + esc(ws.t) + '</div><div class="big">' + fmt(pr.marks) + ' / ' + fmt(pr.max) +
      '</div><div class="muted">' + pct + '% · ' + esc(t("selfMarked")) + '</div></div>';
    h += '<div class="card"><h2>' + esc(t("sections")) + '</h2>';
    pr.sections.forEach(function (s) {
      if (!s.n) return;
      h += '<div class="secline"><span>' + esc(s.name) + '</span><b>' + fmt(s.got) + '/' + fmt(s.max) + '</b><progress max="' + (s.max || 1) + '" value="' + s.got + '"></progress></div>';
    });
    h += '</div><div class="card">';
    if (pr.missing.length) {
      h += '<h2>' + esc(t("todo", { n: pr.missing.length })) + '</h2><p class="small muted">' + esc(t("todoHint")) + '</p><div class="todo">' +
        pr.missing.map(function (lab) {
          var i = ws.q.findIndex(function (q) { return q[0] === lab; });
          return '<button class="chip" data-a="fix" data-v="' + i + '">' + esc(lab) + '</button>';
        }).join("") + '</div>';
    } else {
      h += '<p class="ok-line">✓ ' + esc(t("allMarked")) + '</p>';
    }
    h += '</div><label class="f" for="cm">' + esc(t("comment")) + '</label><textarea class="t" id="cm" data-in="comment" maxlength="1000">' + esc(w.comment || "") + '</textarea>';
    if (w.sentRev) {
      h += '<p class="small ' + (w.dirty ? "warn" : "ok-line") + '">' + esc(w.dirty ? t("changedAfter", { tutor: tutor(ws) }) : "✓ " + t("sentAt", { when: niceWhen(w.sentAt) })) + '</p>';
    }
    h += '<p class="small muted">' + esc(t("onlyThis")) + '</p></div>';
    h += '<div class="bar"><button class="btn primary" data-a="send">' + esc(w.sentRev && w.dirty ? t("sendAgain", { tutor: tutor(ws) }) : t("send", { tutor: tutor(ws) })) + '</button></div>';
    return h;
  }

  function screenFallback() {
    var ws = wsGet(state.params.id), res = state.params.res;
    if (!ws || !res) { go("home", {}, true); return null; }
    var parts = C.textMessages(res), wa = (ws.to || {}).wa || "";
    var h = topBar(t("fbTitle"), true) + '<div class="wrap"><p>' + esc(t("fbIntro")) + '</p><div class="card"><b>1.</b> ';
    parts.forEach(function (p, i) {
      h += '<a class="btn primary" data-a="wa" data-v="' + i + '" target="_blank" rel="noopener" href="https://wa.me/' + encodeURIComponent(wa) + '?text=' +
        encodeURIComponent((i === 0 ? waHead(res) + "\n" : "") + p) + '">' + esc(parts.length > 1 ? t("fbPart", { i: i + 1, n: parts.length }) : t("fbMsg")) + '</a>';
    });
    h += '</div><div class="card"><b>2.</b> <button class="btn" data-a="download">⤓ ' + esc(t("fbFile")) + '</button><p class="small muted">' + esc(t("fbFileHow", { tutor: tutor(ws) })) + '</p></div>' +
      '<div class="card"><b>3.</b> <button class="btn" data-a="copy">' + esc(t("fbCopy")) + '</button></div>' +
      '<button class="btn dark" data-a="fbDone">✓ ' + esc(t("fbDone")) + '</button></div>';
    return h;
  }
  function waHead(r) { return "Maths Check · " + r.learner.name + " · " + r.ws + " · " + C.fmtMark(r.total) + "/" + C.fmtMark(r.max); }

  function screenPaste() {
    return topBar(t("pasteTitle"), true) + '<div class="wrap"><div class="card"><label class="f" for="lk">' + esc(t("pasteTitle")) + '</label>' +
      '<textarea class="t" id="lk" autocomplete="off" spellcheck="false" placeholder="https://…#w=…"></textarea><p class="small muted">' +
      esc(t("pasteHint")) + '</p></div><button class="btn primary" data-a="openLink">' + esc(t("open")) + '</button></div>';
  }

  function screenInfo(which) {
    var h = topBar(which === "privacy" ? t("privacyT") : t("helpT"), true) + '<div class="wrap"><div class="card">';
    if (which === "privacy") {
      ["privacy1", "privacy2", "privacy3", "privacy4"].forEach(function (k) { h += '<p>' + esc(t(k)) + '</p>'; });
    } else {
      h += '<ol class="steps">' + ["help1", "help2", "help3", "help4"].map(function (k) { return '<li>' + esc(t(k)) + '</li>'; }).join("") + '</ol>';
      h += '</div><div class="card"><h2>' + esc(t("levelsT")) + '</h2><div class="levels">' + DEFAULT_LV[lang()].map(function (l, i) {
        return '<div class="lv l' + (i + 1) + '"><span class="n">' + (i + 1) + '</span><span>' + esc(l) + '</span></div>';
      }).join("") + '</div>';
      if (!standalone()) h += '</div><div class="card"><b>' + esc(t("installT")) + '</b><p class="small">' + esc(isIOS() ? t("iosHow") : t("andHow")) + '</p>';
    }
    return h + '</div></div>';
  }

  // ── scanner ────────────────────────────────────────────────────
  var cam = { stream: null, timer: null, detector: null, canvas: null };
  function screenScan() {
    return '<div class="scan"><video id="vid" playsinline muted autoplay></video><div class="frame" aria-hidden="true"></div>' +
      '<div class="msg" id="smsg">' + esc(t("scanMsg")) + '</div><div class="actions">' +
      '<button class="btn" data-a="paste">' + esc(t("paste")) + '</button><button class="btn" data-a="back">' + esc(t("cancel")) + '</button></div></div>';
  }
  function startCamera() {
    var vid = document.getElementById("vid"), msg = document.getElementById("smsg");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = t("noCam"); return; }
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(function (stream) {
        if (state.screen !== "scan") { stream.getTracks().forEach(function (tr) { tr.stop(); }); return; }
        cam.stream = stream;
        vid.srcObject = stream;
        var p = vid.play();
        if (p && p.catch) p.catch(function () { /* autoplay is muted; ignore */ });
        if ("BarcodeDetector" in window) {
          try { cam.detector = new window.BarcodeDetector({ formats: ["qr_code"] }); } catch (e) { cam.detector = null; }
        }
        scanLoop();
      })
      .catch(function () { msg.textContent = t("noCam"); });
  }
  function scanLoop() {
    cam.timer = setTimeout(function () {
      var vid = document.getElementById("vid");
      if (!vid || state.screen !== "scan" || !cam.stream) return;
      if (vid.readyState < 2 || !vid.videoWidth) { scanLoop(); return; }
      var done = function (text) {
        if (text && foundText(text)) return;
        scanLoop();
      };
      if (cam.detector) {
        cam.detector.detect(vid).then(function (codes) { done(codes && codes[0] && codes[0].rawValue); })
          .catch(function () { cam.detector = null; done(null); });
      } else {
        done(decodeFrame(vid));
      }
    }, cam.detector ? 150 : 90);
  }
  function decodeFrame(vid) {
    /* centre square of the frame at full resolution (max 960 px) → MCScan */
    var vw = vid.videoWidth, vh = vid.videoHeight, side = Math.min(vw, vh), out = Math.min(side, 960);
    var c = cam.canvas || (cam.canvas = document.createElement("canvas"));
    c.width = out; c.height = out;
    var g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(vid, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, out, out);
    try { return window.MCScan.decode(g.getImageData(0, 0, out, out)); } catch (e) { return null; }
  }
  var lastBad = 0;
  function foundText(text) {
    var r = loadLink(text, true);
    if (r === "ok") { stopCamera(); if (navigator.vibrate) navigator.vibrate(60); return true; }
    if (Date.now() - lastBad > 2500) { lastBad = Date.now(); toast(r === "newer" ? t("newer") : t("notWs")); }
    return false;
  }
  function stopCamera() {
    clearTimeout(cam.timer);
    if (cam.stream) cam.stream.getTracks().forEach(function (tr) { tr.stop(); });
    cam.stream = null;
  }

  // ── opening a worksheet link ───────────────────────────────────
  function loadLink(text, fromScan) {
    var got;
    try { got = C.parseLink(text); } catch (e) { return e.message === "newer-version" ? "newer" : "bad"; }
    var ws = got.ws, old = wsGet(ws.id);
    wsPut(ws);
    if (ws.to && ws.to.n) ui.tutor = ws.to.n;
    if (!old || ui.wsLang !== ws.id) { ui.lang = ws.lang === "af" ? "af" : "en"; ui.wsLang = ws.id; }   // follow the sheet's language
    saveUi();
    if (!me) go("who", { next: ws.id }, !fromScan);
    else go("sheet", { id: ws.id }, !fromScan);
    return "ok";
  }
  function checkHash() {
    if (!/[#&]w=/.test(location.hash)) return false;
    var href = location.href;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    var r = loadLink(href, false);
    if (r !== "ok") { toast(r === "newer" ? t("newer") : t("notWs"), 5000); return false; }
    return true;
  }
  window.addEventListener("hashchange", checkHash);

  // ── sending ────────────────────────────────────────────────────
  function buildFor(ws, w) {
    var rev = !w.sentRev ? 1 : (w.dirty ? w.sentRev + 1 : w.sentRev);
    if (!w.finished) w.finished = C.localIso();
    return C.buildResult(ws, me, w, rev, C.localIso());
  }
  function markSent(ws, w, res, via) {
    w.sentRev = res.rev;
    w.sentAt = res.sent;
    w.dirty = false;
    w.via = via;
    workPut(ws, w, false);
  }
  function send() {
    var ws = wsGet(state.params.id), w = workGet(ws), res = buildFor(ws, w);
    var text = C.resultText(res, ws.t, ws.lang === "af" ? "af" : "en"), file = null;
    try { file = new File([text], C.fileName(res), { type: "text/plain" }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.share) {
      var data = { files: [file], title: "Maths Check" };
      if (!isIOS()) data.text = t("share", { name: me.name, title: ws.t, total: C.fmtMark(res.total), max: C.fmtMark(res.max) });
      var can = false;
      try { can = navigator.canShare(data); } catch (e) { can = false; }
      if (can) {
        navigator.share(data).then(function () {
          markSent(ws, w, res, "file");
          toast(t("sentOk"));
          render();
        }).catch(function (e) {
          if (e && e.name === "AbortError") toast(t("cancelled"));
          else go("fallback", { id: ws.id, res: res });
        });
        return;
      }
    }
    go("fallback", { id: ws.id, res: res });
  }
  function download(res, ws) {
    var text = C.resultText(res, ws.t, ws.lang === "af" ? "af" : "en");
    var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = C.fileName(res);
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  // ── events ─────────────────────────────────────────────────────
  var actions = {
    back: function () { stopCamera(); if (state.depth > 0) history.back(); else go("home", {}, true); },   // never back out of the app
    home: function () { go("home"); },
    lang: function (b) {
      ui.lang = b.dataset.v;
      saveUi();
      document.documentElement.lang = lang();
      render();
    },
    scan: function () { go("scan"); },
    paste: function () { stopCamera(); go("paste", {}, state.screen === "scan"); },
    open: function (b) { go("sheet", { id: b.dataset.v }); },
    learners: function () { go("who"); },
    help: function () { go("help"); },
    privacy: function () { go("privacy"); },
    hintDone: function () { ui.hintDone = true; saveUi(); render(); },
    iosTipDone: function () { ui.iosTipDone = true; saveUi(); render(); },
    install: function () {
      if (!installEvt) return;
      installEvt.prompt();
      installEvt.userChoice.then(function () { installEvt = null; ui.hintDone = true; saveUi(); render(); });
    },
    pick: function (b) { setMe(learnerById(b.dataset.v)); goNext(); },
    forget: function (b) {
      var l = learnerById(b.dataset.v);
      if (!l || !window.confirm(t("removeQ", { name: l.name }))) return;
      store.keys("work:" + l.id + ":").forEach(function (k) { store.del(k); });
      learners = learners.filter(function (x) { return x.id !== l.id; });
      store.set("learners", learners);
      if (me && me.id === l.id) setMe(learners[0] || null);
      render();
    },
    saveWho: function () {
      var nm = document.getElementById("nm"), cd = document.getElementById("cd");
      var name = nm.value.replace(/\s+/g, " ").trim(), code = cd.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (name.length < 2) { toast(t("nameNeeded")); nm.focus(); return; }
      var same = learners.filter(function (l) { return l.name.toLowerCase() === name.toLowerCase(); })[0];
      if (same) { same.code = code || same.code; setMe(same); }
      else { var l = { id: C.uuid().slice(0, 8), name: name, code: code }; learners.push(l); setMe(l); }
      store.set("learners", learners);
      goNext();
    },
    q: function (b) {
      var ws = wsGet(state.params.id), w = workGet(ws), i = +b.dataset.v;
      if (state.params.open === i) { state.params.open = -1; refreshSheet(ws, w, [i]); return; }
      openQuestion(ws, w, i, false);
    },
    m: function (b) {
      setAnswer(+b.dataset.i, function (a, max) {
        var v = +b.dataset.v, half = a.m !== null && a.m !== undefined && a.m % 1 !== 0;   // keep a ½ that was chosen
        a.skip = false;
        a.m = half && v + 0.5 <= max ? v + 0.5 : Math.min(v, max);
      });
    },
    step: function (b) {
      setAnswer(+b.dataset.i, function (a, max, ws) {
        var st = ws.half ? 0.5 : 1, cur = a.m === null || a.m === undefined ? (+b.dataset.v > 0 ? -st : 0) : a.m;
        a.skip = false;
        a.m = Math.max(0, Math.min(max, cur + st * (+b.dataset.v)));
      }, true);
    },
    half: function (b) {
      setAnswer(+b.dataset.i, function (a, max) {
        var base = a.m === null || a.m === undefined ? 0 : Math.floor(a.m);
        a.skip = false;
        a.m = a.m % 1 ? base : Math.min(max, base + 0.5);
      }, true);
    },
    skip: function (b) { setAnswer(+b.dataset.i, function (a) { a.skip = !a.skip; if (a.skip) { a.m = null; a.lv = null; } }); },
    lv: function (b) { setAnswer(+b.dataset.i, function (a) { a.lv = +b.dataset.v; a.skip = false; }); },
    note: function (b) {
      var ws = wsGet(state.params.id), w = workGet(ws), i = +b.dataset.i;
      state.params.note = i;
      refreshSheet(ws, w, [i]);
      var ta = document.getElementById("n" + i);
      if (ta) ta.focus();
    },
    review: function () { go("review", { id: state.params.id }); },
    fix: function (b) { go("sheet", { id: state.params.id, open: +b.dataset.v }); },
    send: function () { send(); },
    wa: function (b) {
      state.params.opened = (state.params.opened || 0) | (1 << +b.dataset.v);
      var n = C.textMessages(state.params.res).length;
      if (state.params.opened === (1 << n) - 1) {
        var ws = wsGet(state.params.id);
        markSent(ws, workGet(ws), state.params.res, "text");
      }
      return true;                                    // let the link open WhatsApp
    },
    download: function () { download(state.params.res, wsGet(state.params.id)); },
    copy: function () {
      var txt = C.textMessages(state.params.res).join("\n\n");
      var ok = function () { toast(t("copied")); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(waHead(state.params.res) + "\n" + txt).then(ok, ok);
      else ok();
    },
    fbDone: function () {
      var ws = wsGet(state.params.id);
      markSent(ws, workGet(ws), state.params.res, "manual");
      toast(t("sentOk"));
      go("home");
    },
    openLink: function () {
      var r = loadLink(document.getElementById("lk").value, false);
      if (r !== "ok") toast(r === "newer" ? t("newer") : t("notWs"), 4000);
    }
  };

  function setAnswer(i, fn, keepOpen) {
    var ws = wsGet(state.params.id), w = workGet(ws), q = ws.q[i], label = q[0];
    var a = w.answers[label] || {}, before = C.state(a);
    fn(a, q[1], ws);
    w.answers[label] = a;
    workPut(ws, w, true);
    var after = C.state(a);
    if (before !== "done" && after === "done" && !keepOpen) { refreshSheet(ws, w, [i]); advance(ws, w, i); return; }
    refreshSheet(ws, w, [i]);
    if (after === "partial" && a.m !== null && a.m !== undefined && !a.lv) {   // mark given: show the levels
      var lvEl = document.querySelector("#q" + i + " .levels");
      if (lvEl && lvEl.getBoundingClientRect().bottom > window.innerHeight - 90) {
        lvEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }

  function goNext() {
    var next = state.params.next;
    if (next && wsGet(next)) go("sheet", { id: next }, true);
    else go("home", {}, true);
  }

  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]");
    if (!b || !actions[b.dataset.a]) return;
    var keep = actions[b.dataset.a](b, e);
    if (keep !== true && b.tagName === "A") e.preventDefault();
  });
  app.addEventListener("input", function (e) {
    var el = e.target;
    if (!el.dataset || !el.dataset.in) return;
    var ws = wsGet(state.params.id);
    if (!ws) return;
    var w = workGet(ws);
    if (el.dataset.in === "comment") w.comment = el.value;
    if (el.dataset.in === "note") {
      var label = ws.q[+el.dataset.i][0], a = w.answers[label] || {};
      a.note = el.value;
      w.answers[label] = a;
    }
    workPut(ws, w, true);
  });

  // ── render ─────────────────────────────────────────────────────
  function render() {
    document.documentElement.lang = lang();
    if (state.screen !== "scan") stopCamera();
    if (!me && state.screen !== "who" && ["help", "privacy", "paste", "scan"].indexOf(state.screen) < 0) state = { screen: "who", params: state.params };
    var html = ({
      home: screenHome, who: screenWho, sheet: screenSheet, review: screenReview, fallback: screenFallback,
      paste: screenPaste, scan: screenScan, help: function () { return screenInfo("help"); }, privacy: function () { return screenInfo("privacy"); }
    }[state.screen] || screenHome)();
    if (html === null) return;
    app.innerHTML = html;
    if (state.screen === "scan") startCamera();
    if (state.screen === "who") { var nm = document.getElementById("nm"); if (nm && !learners.length) nm.focus(); }
    if (state.screen === "sheet" && state.params.open >= 0 && state.params.open !== undefined) {
      var el = document.getElementById("q" + state.params.open);
      if (el && state.params.open > 0) el.scrollIntoView({ block: "start" });
    }
  }

  // ── install prompt, updates, start ─────────────────────────────
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    installEvt = e;
    if (state.screen === "home") render();
  });
  window.addEventListener("appinstalled", function () { ui.hintDone = true; saveUi(); });

  function serviceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    var hadController = !!navigator.serviceWorker.controller, reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController) { hadController = true; return; }  // the very first install: nothing to reload
      if (reloading) return;
      reloading = true;
      location.reload();
    });
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      var offer = function (wk) {
        var bar = document.getElementById("update");
        bar.innerHTML = '<button>' + esc(t("update")) + '</button>';
        bar.hidden = false;
        bar.firstChild.onclick = function () { wk.postMessage({ type: "skip-waiting" }); bar.hidden = true; };
      };
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener("updatefound", function () {
        var nw = reg.installing;
        if (nw) nw.addEventListener("statechange", function () {
          if (nw.state === "installed" && navigator.serviceWorker.controller) offer(nw);
        });
      });
      document.addEventListener("visibilitychange", function () { if (!document.hidden) reg.update().catch(function () { /* offline */ }); });
    }).catch(function () { /* not available here */ });
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () { /* ignore */ });
  }

  me = learnerById(ui.me) || null;
  if (!me && learners.length === 1) setMe(learners[0]);
  try { history.replaceState({ mc: state }, "", location.pathname + location.search + location.hash); } catch (e) { /* ignore */ }
  if (!checkHash()) go(me ? "home" : "who", {}, true);
  serviceWorker();

  window.MCApp = {                                     // for tests
    state: function () { return state; }, store: store, go: go, loadLink: loadLink,
    reset: function () { ui = store.get("ui", {}) || {}; learners = store.get("learners", []) || []; me = learnerById(ui.me); }
  };
})();
