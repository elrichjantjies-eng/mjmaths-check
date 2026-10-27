/* Maths Check — core logic shared by the app and its tests.
   Worksheet links, result files and WhatsApp text follow CONTRACTS.md and
   must match Tutor Studio (MrJantjiesMaths.py, section 23) byte for byte. */
(function (root) {
  "use strict";
  var APP_VERSION = "1.0.0";
  var BEGIN = "-----BEGIN MATHS-CHECK-DATA-----", END = "-----END MATHS-CHECK-DATA-----";
  var TEXT_LIMIT = 1800;
  var MONTHS = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    af: ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"]
  };
  var WORDS = {
    en: { head: "MATHS CHECK RESULT", learner: "Learner", ws: "Worksheet", done: "Finished", total: "Total",
          level: "Level", skip: "not attempted", blank: "no mark yet", comment: "Comment", code: "code" },
    af: { head: "MATHS CHECK UITSLAG", learner: "Leerder", ws: "Werkblad", done: "Klaar", total: "Totaal",
          level: "Vlak", skip: "nie probeer nie", blank: "nog geen punt nie", comment: "Kommentaar", code: "kode" }
  };

  // ── text helpers ──────────────────────────────────────────────
  function utf8(s) { return new TextEncoder().encode(s); }
  function cpLen(s) { return Array.from(s).length; }            // code points, as Python's len()
  function pad(s, n) { s = String(s); var k = cpLen(s); return k >= n ? s : s + " ".repeat(n - k); }
  function fmtMark(v) {
    if (v === null || v === undefined) return "—";
    return String(Number(v));
  }

  // ── worksheet link ────────────────────────────────────────────
  function b64uDecode(s) {
    s = String(s || "").replace(/[^A-Za-z0-9_-]/g, "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function parseLink(text) {
    /* "https://…/#w=<payload>[&live=<code>]" (or just the payload) → {ws, live} */
    text = String(text || "").trim();
    var m = /[#&?]w=([A-Za-z0-9_-]+)/.exec(text) || /^([A-Za-z0-9_-]{40,})$/.exec(text);
    if (!m) throw new Error("not-a-link");
    var raw = root.MCInflate.inflateRaw(b64uDecode(m[1]));
    var ws = JSON.parse(new TextDecoder("utf-8").decode(raw));
    checkWorksheet(ws);
    var lv = /[#&?]live=([A-Za-z0-9_-]+)/.exec(text);
    return { ws: ws, live: lv ? lv[1] : "" };
  }

  function checkWorksheet(ws) {
    if (!ws || typeof ws !== "object" || !Array.isArray(ws.q) || !ws.id) throw new Error("not-a-worksheet");
    if ((ws.v || 1) > 1) throw new Error("newer-version");
    ws.q.forEach(function (q) {
      if (!Array.isArray(q) || typeof q[0] !== "string" || typeof q[1] !== "number") throw new Error("not-a-worksheet");
    });
    if (!Array.isArray(ws.sec) || !ws.sec.length) ws.sec = [""];
    if (!Array.isArray(ws.lv) || ws.lv.length !== 3) ws.lv = null;
    ws.to = ws.to || { n: "", wa: "" };
    return ws;
  }

  // ── check-sum (CONTRACTS §4) ──────────────────────────────────
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function canon(answers) {
    return JSON.stringify(answers.map(function (a) {
      var o = {};
      Object.keys(a).sort().forEach(function (k) { o[k] = a[k]; });
      return o;
    }));
  }

  function crcHex(answers) { return ("00000000" + crc32(utf8(canon(answers))).toString(16)).slice(-8); }

  // ── time ──────────────────────────────────────────────────────
  function localIso(d) {
    d = d || new Date();
    var z = function (n) { return (n < 10 ? "0" : "") + n; };
    var off = -d.getTimezoneOffset(), sign = off >= 0 ? "+" : "-";
    off = Math.abs(off);
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + "T" + z(d.getHours()) + ":" +
      z(d.getMinutes()) + ":" + z(d.getSeconds()) + sign + z(Math.floor(off / 60)) + ":" + z(off % 60);
  }

  function niceTime(iso, lang) {
    /* "2026-10-27T15:42:03+02:00" → "27 Oct 2026 15:42" (the time as written, not converted) */
    var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso || "");
    if (!m) return iso || "";
    return m[3] + " " + (MONTHS[lang] || MONTHS.en)[+m[2] - 1] + " " + m[1] + " " + m[4] + ":" + m[5];
  }

  function uuid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    var b = new Uint8Array(16);
    root.crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.from(b, function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }

  // ── progress ──────────────────────────────────────────────────
  function state(a) {
    /* "done" (mark + level, or not attempted), "partial", or "empty" */
    if (!a) return "empty";
    if (a.skip) return "done";
    var hasM = a.m !== null && a.m !== undefined;
    if (hasM && a.lv) return "done";
    return hasM || a.lv ? "partial" : "empty";
  }

  function progress(ws, work) {
    var done = 0, marks = 0, secs = ws.sec.map(function (name) { return { name: name, got: 0, max: 0, done: 0, n: 0 }; });
    var missing = [];
    ws.q.forEach(function (q) {
      var a = (work.answers || {})[q[0]], s = secs[Math.min(q[2] || 0, secs.length - 1)];
      var st = state(a);
      s.n++;
      s.max += q[1];
      if (st === "done") { done++; s.done++; }
      else missing.push(q[0]);
      if (a && !a.skip && a.m !== null && a.m !== undefined) { marks += a.m; s.got += a.m; }
    });
    return { done: done, count: ws.q.length, marks: marks, max: ws.tot || ws.q.reduce(function (t, q) { return t + q[1]; }, 0),
             sections: secs, missing: missing };
  }

  // ── result (CONTRACTS §2) ─────────────────────────────────────
  function buildResult(ws, learner, work, rev, sentIso) {
    var answers = ws.q.map(function (q) {
      var a = (work.answers || {})[q[0]] || {};
      var o = { q: q[0], m: null, max: q[1], lv: null };
      if (!a.skip) {
        if (a.m !== null && a.m !== undefined) o.m = Math.min(a.m, q[1]);
        if (a.lv) o.lv = a.lv;
      }
      var note = String(a.note || "").trim().slice(0, 500);
      if (note) o.note = note;
      if (a.skip) o.skip = true;
      return o;
    });
    var total = answers.reduce(function (t, a) { return t + (a.skip || a.m === null ? 0 : a.m); }, 0);
    var r = { type: "maths-check-result", v: 1, sub: work.sub, rev: rev, ws: ws.id, fam: ws.fam || "",
              learner: { name: String(learner.name || "").trim().slice(0, 80), code: String(learner.code || "").trim().toUpperCase().slice(0, 12) },
              started: work.started || "", finished: work.finished || work.started || "", sent: sentIso || "",
              answers: answers, comment: String(work.comment || "").trim().slice(0, 1000), total: total,
              max: ws.tot, app: "maths-check " + APP_VERSION };
    r.crc = crcHex(answers);
    return r;
  }

  function resultText(r, title, lang) {
    /* The .txt the learner sends: readable on the phone, data block for Tutor Studio. */
    var w = WORDS[lang] || WORDS.en, ln = r.learner || {};
    var who = ln.name || "";
    if (ln.code) who += " (" + w.code + " " + ln.code + ")";
    var pct = r.max ? " (" + Math.floor(r.total / r.max * 100 + 0.5) + "%)" : "";
    var lines = [w.head, pad(w.learner + ":", 11) + who,
                 pad(w.ws + ":", 11) + (title || r.ws) + " (" + r.ws + ")",
                 pad(w.done + ":", 11) + niceTime(r.finished || r.sent, lang) + " · " + w.total + " " +
                 fmtMark(r.total) + " / " + fmtMark(r.max) + pct, ""];
    r.answers.forEach(function (a) {
      var row;
      if (a.skip) row = pad(a.q, 8) + pad("—", 6) + w.skip;
      else if (a.m === null && !a.lv) row = pad(a.q, 8) + pad("—", 6) + w.blank;
      else {
        row = pad(a.q, 8) + pad(fmtMark(a.m) + "/" + fmtMark(a.max), 6);
        if (a.lv) row += w.level + " " + a.lv;
      }
      if (a.note) row += '   "' + a.note + '"';
      lines.push(row.replace(/\s+$/, ""));
    });
    if (r.comment) lines.push("", w.comment + ": " + r.comment);
    var data = {};
    ["type", "v", "sub", "rev", "ws", "fam", "learner", "started", "finished", "sent", "answers", "comment",
     "total", "max", "app", "crc"].forEach(function (k) { if (k in r) data[k] = r[k]; });
    lines.push("", BEGIN, JSON.stringify(data), END, "");
    return lines.join("\n");
  }

  function fileName(r) {
    var name = String((r.learner || {}).name || "Learner").replace(/[^\p{L}\p{N}_\-]+/gu, "-").replace(/^-+|-+$/g, "");
    var day = (r.finished || r.sent || localIso()).slice(0, 10);
    return "MathsCheck_" + (name || "Learner") + "_" + r.ws + "_" + day + ".txt";
  }

  function textMessages(r, limit) {
    /* Compact text for a wa.me link when a file can't be shared (CONTRACTS §3). */
    limit = limit || TEXT_LIMIT;
    var ln = r.learner || {};
    var clean = function (s) { return String(s || "").replace(/[|\r\n]+/g, " ").trim(); };
    var head = "MC1|" + r.ws + "|" + clean(ln.name) + "|" + clean(ln.code) + "|" + r.sub + "|r" + (r.rev || 1) +
      (r.finished ? "|d" + r.finished : "");
    var cells = [];
    r.answers.forEach(function (a) {
      if (a.skip) cells.push(a.q + "=-");
      else if (a.m !== null || a.lv) cells.push(a.q + "=" + (a.m !== null ? fmtMark(a.m) : "") + (a.lv ? "," + a.lv : ""));
    });
    var lines = [];
    while (cells.length) {
      var row = cells.shift();
      while (cells.length && cpLen(row) + 1 + cpLen(cells[0]) < limit - cpLen(head) - 20) row += ";" + cells.shift();
      lines.push(row);
    }
    r.answers.forEach(function (a) { if (a.note) lines.push("N" + a.q + "=" + clean(a.note)); });
    if (r.comment) lines.push("C=" + clean(r.comment));
    var parts = [], cur = [];
    lines.forEach(function (l) {
      var used = cur.reduce(function (t, x) { return t + cpLen(x) + 1; }, 0);
      if (cur.length && cpLen(head) + 8 + used + cpLen(l) > limit) { parts.push(cur); cur = []; }
      cur.push(l);
    });
    parts.push(cur);
    if (parts.length === 1) return [[head].concat(parts[0]).join("\n")];
    return parts.map(function (p, i) { return [head + "|p" + (i + 1) + "/" + parts.length].concat(p).join("\n"); });
  }

  root.MCCore = {
    APP_VERSION: APP_VERSION, BEGIN: BEGIN, END: END, WORDS: WORDS,
    parseLink: parseLink, checkWorksheet: checkWorksheet, b64uDecode: b64uDecode,
    canon: canon, crc32: crc32, crcHex: crcHex, localIso: localIso, niceTime: niceTime, uuid: uuid,
    fmtMark: fmtMark, state: state, progress: progress,
    buildResult: buildResult, resultText: resultText, fileName: fileName, textMessages: textMessages
  };
})(typeof self !== "undefined" ? self : globalThis);
