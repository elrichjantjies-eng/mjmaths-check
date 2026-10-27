/* Small QR code reader for camera frames (used where the browser has no
   BarcodeDetector, e.g. iPhone). Adaptive threshold → finder patterns →
   alignment pattern → perspective-corrected sampling → format/version →
   Reed–Solomon error correction → numeric / alphanumeric / byte data.
   Written for Maths Check; no third-party code. MCScan.decode(imageData). */
(function (root) {
  "use strict";

  // ── GF(256) and Reed–Solomon (generator 2, polynomial 0x11D, first root α^0) ──
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gmul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function gdiv(a, b) { return a ? EXP[(LOG[a] + 255 - LOG[b]) % 255] : 0; }
  function gpow(e) { e %= 255; return EXP[e < 0 ? e + 255 : e]; }

  function rsCorrect(msg, nsym) {
    /* msg[0] is the highest power. Returns the corrected array, or null. */
    var n = msg.length, S = [], any = false, i, j;
    for (i = 0; i < nsym; i++) {
      var y = 0, x = EXP[i];
      for (j = 0; j < n; j++) y = gmul(y, x) ^ msg[j];
      S.push(y);
      if (y) any = true;
    }
    if (!any) return msg;
    // Berlekamp–Massey: Λ(x) = 1 + Λ1·x + … (increasing powers)
    var Cc = [1], B = [1], L = 0, m = 1, b = 1;
    for (var k = 0; k < nsym; k++) {
      var d = S[k];
      for (i = 1; i <= L; i++) d ^= gmul(Cc[i] || 0, S[k - i]);
      if (d === 0) { m++; continue; }
      var coef = gdiv(d, b), T = Cc.slice();
      for (i = 0; i < B.length; i++) {
        while (Cc.length <= i + m) Cc.push(0);
        Cc[i + m] ^= gmul(coef, B[i]);
      }
      if (2 * L <= k) { L = k + 1 - L; B = T; b = d; m = 1; } else m++;
    }
    if (2 * L > nsym) return null;
    // Chien search: position p ↔ X = α^(n-1-p); error where Λ(X⁻¹) = 0
    var pos = [];
    for (var p = 0; p < n; p++) {
      var xinv = gpow(-(n - 1 - p)), v = 0, xp = 1;
      for (i = 0; i < Cc.length; i++) { v ^= gmul(Cc[i], xp); xp = gmul(xp, xinv); }
      if (v === 0) pos.push(p);
    }
    if (pos.length !== L) return null;
    // Forney: Ω(x) = S(x)·Λ(x) mod x^nsym ; e = X·Ω(X⁻¹) / Λ'(X⁻¹)
    var om = [];
    for (i = 0; i < nsym; i++) {
      var s = 0;
      for (j = 0; j <= i; j++) s ^= gmul(S[j], Cc[i - j] || 0);
      om.push(s);
    }
    var out = msg.slice();
    for (var q = 0; q < pos.length; q++) {
      var X = gpow(n - 1 - pos[q]), Xi = gdiv(1, X), num = 0, den = 0, xx = 1;
      for (i = 0; i < om.length; i++) { num ^= gmul(om[i], xx); xx = gmul(xx, Xi); }
      xx = 1;
      for (i = 1; i < Cc.length; i += 2) {           // formal derivative: odd terms
        den ^= gmul(Cc[i], xx);
        xx = gmul(xx, gmul(Xi, Xi));
      }
      if (!den) return null;
      out[pos[q]] ^= gmul(X, gdiv(num, den));
    }
    for (i = 0; i < nsym; i++) {                     // verify
      var yy = 0, xv = EXP[i];
      for (j = 0; j < n; j++) yy = gmul(yy, xv) ^ out[j];
      if (yy) return null;
    }
    return out;
  }

  // ── QR tables (same as Tutor Studio's encoder) ──
  var ECC = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  };
  var BLOCKS = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  };
  var ECL_BITS = { 1: "L", 0: "M", 3: "Q", 2: "H" };

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) {
      var na = Math.floor(v / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (v >= 7) r -= 36;
    }
    return r;
  }

  function alignPositions(v) {
    if (v === 1) return [];
    var na = Math.floor(v / 7) + 2, size = v * 4 + 17;
    var step = v === 32 ? 26 : Math.floor((v * 4 + na * 2 + 1) / (na * 2 - 2)) * 2;
    var res = [6];
    for (var i = na - 2; i >= 0; i--) res.push(size - 7 - i * step);
    return res;
  }

  var FORMATS = [], VERSIONS = [];
  (function () {
    for (var d = 0; d < 32; d++) {
      var rem = d;
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
      FORMATS.push({ bits: ((d << 10) | rem) ^ 0x5412, ecl: ECL_BITS[d >> 3], mask: d & 7 });
    }
    for (var v = 7; v <= 40; v++) {
      var r = v;
      for (var k = 0; k < 12; k++) r = (r << 1) ^ ((r >> 11) * 0x1F25);
      VERSIONS.push({ bits: (v << 12) | r, v: v });
    }
  })();
  function popcount(x) { var c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }

  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; },
    function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
    function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
    function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
  ];

  function functionMask(v) {
    var n = v * 4 + 17, f = new Uint8Array(n * n), i;
    function set(x, y) { if (x >= 0 && y >= 0 && x < n && y < n) f[y * n + x] = 1; }
    for (i = 0; i < n; i++) { set(6, i); set(i, 6); }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) set(c[0] + dx, c[1] + dy);
    });
    var pos = alignPositions(v), last = pos.length - 1;
    for (var a = 0; a < pos.length; a++) for (var b = 0; b < pos.length; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) set(pos[a] + dx2, pos[b] + dy2);
    }
    for (i = 0; i < 9; i++) { set(8, i); set(i, 8); }
    for (i = 0; i < 8; i++) { set(n - 1 - i, 8); set(8, n - 1 - i); }
    if (v >= 7) for (i = 0; i < 18; i++) { set(n - 11 + i % 3, Math.floor(i / 3)); set(Math.floor(i / 3), n - 11 + i % 3); }
    return f;
  }

  // ── decoding a sampled module grid ──
  function readFormat(get, n) {
    var a = 0, b = 0, i;
    for (i = 0; i < 6; i++) a |= get(8, i) << i;
    a |= get(8, 7) << 6; a |= get(8, 8) << 7; a |= get(7, 8) << 8;
    for (i = 9; i < 15; i++) a |= get(14 - i, 8) << i;
    for (i = 0; i < 8; i++) b |= get(n - 1 - i, 8) << i;
    for (i = 8; i < 15; i++) b |= get(8, n - 15 + i) << i;
    var best = null, bd = 99;
    FORMATS.forEach(function (f) {
      var d = Math.min(popcount(a ^ f.bits), popcount(b ^ f.bits));
      if (d < bd) { bd = d; best = f; }
    });
    return bd <= 3 ? best : null;
  }

  function readVersion(get, n) {
    var a = 0, b = 0;
    for (var i = 0; i < 18; i++) {
      a |= get(n - 11 + i % 3, Math.floor(i / 3)) << i;
      b |= get(Math.floor(i / 3), n - 11 + i % 3) << i;
    }
    var best = null, bd = 99;
    VERSIONS.forEach(function (x) {
      var d = Math.min(popcount(a ^ x.bits), popcount(b ^ x.bits));
      if (d < bd) { bd = d; best = x.v; }
    });
    return bd <= 3 ? best : null;
  }

  function decodeGrid(get, n) {
    /* get(x, y) → 1 dark / 0 light. Returns {text} or {version} (to resample) or null. */
    var v = (n - 17) / 4;
    if (v < 1 || v > 40 || v !== Math.floor(v)) return null;
    if (v >= 7) {
      var vv = readVersion(get, n);
      if (vv && vv !== v) return { version: vv };
    }
    var fmt = readFormat(get, n);
    if (!fmt) return null;
    var fm = functionMask(v), mask = MASKS[fmt.mask], bytes = [], cur = 0, nb = 0;
    var total = rawModules(v) >> 3;
    for (var right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < n; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert;
          if (fm[y * n + x] || bytes.length >= total) continue;
          cur = (cur << 1) | (get(x, y) ^ (mask(x, y) ? 1 : 0));
          if (++nb === 8) { bytes.push(cur); cur = 0; nb = 0; }
        }
      }
    }
    var blocks = BLOCKS[fmt.ecl][v], ecc = ECC[fmt.ecl][v];
    var shortLen = Math.floor(total / blocks), nShort = blocks - total % blocks, L = shortLen + 1;
    var bl = [], k = 0, i, b;
    for (b = 0; b < blocks; b++) bl.push(new Array(L));
    for (i = 0; i < L; i++) for (b = 0; b < blocks; b++) {
      if (i !== shortLen - ecc || b >= nShort) bl[b][i] = bytes[k++];
    }
    var data = [];
    for (b = 0; b < blocks; b++) {
      var dl = shortLen - ecc + (b < nShort ? 0 : 1);
      var cw = bl[b].slice(0, dl).concat(bl[b].slice(L - ecc));
      var fixed = rsCorrect(cw, ecc);
      if (!fixed) return null;
      for (i = 0; i < dl; i++) data.push(fixed[i]);
    }
    var text = parseData(data, v);
    return text === null ? null : { text: text };
  }

  var ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  function parseData(data, v) {
    var pos = 0, len = data.length * 8, out = [], str = "";
    function bits(n) {
      if (pos + n > len) throw new Error("short");
      var r = 0;
      for (var i = 0; i < n; i++, pos++) r = (r << 1) | ((data[pos >> 3] >> (7 - (pos & 7))) & 1);
      return r;
    }
    function flush() {
      if (out.length) {
        try { str += new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(out)); }
        catch (e) { str += String.fromCharCode.apply(null, out); }
        out = [];
      }
    }
    var cls = v < 10 ? 0 : v < 27 ? 1 : 2;
    try {
      while (pos + 4 <= len) {
        var mode = bits(4), count, i;
        if (mode === 0) break;
        if (mode === 4) {
          count = bits([8, 16, 16][cls]);
          for (i = 0; i < count; i++) out.push(bits(8));
        } else if (mode === 1) {
          flush();
          count = bits([10, 12, 14][cls]);
          while (count >= 3) { var t3 = bits(10); str += ("00" + t3).slice(-3); count -= 3; }
          if (count === 2) str += ("0" + bits(7)).slice(-2);
          else if (count === 1) str += bits(4);
        } else if (mode === 2) {
          flush();
          count = bits([9, 11, 13][cls]);
          while (count >= 2) { var t2 = bits(11); str += ALNUM[Math.floor(t2 / 45)] + ALNUM[t2 % 45]; count -= 2; }
          if (count === 1) str += ALNUM[bits(6)];
        } else if (mode === 7) {                      // ECI: skip the designator, assume UTF-8
          var e = bits(8);
          if ((e & 0xC0) === 0x80) bits(8);
          else if ((e & 0xE0) === 0xC0) bits(16);
        } else {
          break;                                       // kanji / structured append: not needed here
        }
      }
    } catch (err) {
      if (!out.length && !str) return null;
    }
    flush();
    return str;
  }

  // ── image processing ──
  function luminance(rgba, w, h) {
    var n = w * h, lum = new Uint8Array(n);
    for (var i = 0, j = 0; i < n; i++, j += 4) lum[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
    return lum;
  }

  function binarize(lum, w, h, R) {
    var n = w * h;
    var rw = Math.ceil(w / R), rh = Math.ceil(h / R), bp = new Float32Array(rw * rh), out = new Uint8Array(n);
    var rx, ry, x, y;
    for (ry = 0; ry < rh; ry++) for (rx = 0; rx < rw; rx++) {
      var mn = 255, mx = 0, sum = 0, cnt = 0, y1 = Math.min(h, ry * R + R), x1 = Math.min(w, rx * R + R);
      for (y = ry * R; y < y1; y++) for (x = rx * R; x < x1; x++) {
        var l = lum[y * w + x];
        sum += l; cnt++;
        if (l < mn) mn = l;
        if (l > mx) mx = l;
      }
      var avg = sum / cnt;
      if (mx - mn <= 24) {                            // flat area: probably background
        avg = mn / 2;
        if (ry > 0 && rx > 0) {
          var nb = (bp[(ry - 1) * rw + rx] + 2 * bp[ry * rw + rx - 1] + bp[(ry - 1) * rw + rx - 1]) / 4;
          if (mn < nb) avg = nb;
        }
      }
      bp[ry * rw + rx] = avg;
    }
    for (ry = 0; ry < rh; ry++) for (rx = 0; rx < rw; rx++) {
      var cx = Math.max(2, Math.min(rw - 3, rx)), cy = Math.max(2, Math.min(rh - 3, ry)), s = 0, c = 0;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
        var xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && yy >= 0 && xx < rw && yy < rh) { s += bp[yy * rw + xx]; c++; }
      }
      var thr = s / c, yE = Math.min(h, ry * R + R), xE = Math.min(w, rx * R + R);
      for (y = ry * R; y < yE; y++) for (x = rx * R; x < xE; x++) out[y * w + x] = lum[y * w + x] <= thr ? 1 : 0;
    }
    return out;
  }

  function Finder(bits, w, h) {
    function B(x, y) { return bits[y * w + x]; }
    function ratio(sc, tol) {
      var total = sc[0] + sc[1] + sc[2] + sc[3] + sc[4];
      if (total < 7) return false;
      var m = total / 7, v = m * (tol || 0.5);
      return Math.abs(m - sc[0]) < v && Math.abs(m - sc[1]) < v && Math.abs(3 * m - sc[2]) < 3 * v &&
             Math.abs(m - sc[3]) < v && Math.abs(m - sc[4]) < v;
    }
    function endCenter(sc, end) { return end - sc[4] - sc[3] - sc[2] / 2; }
    function cross(sx, sy, ddx, ddy, maxCount, origTotal, tol) {
      /* walk along (ddx, ddy) both ways from (sx, sy): B W B | B W B → centre offset, or NaN */
      var sc = [0, 0, 0, 0, 0], x = sx, y = sy;
      function inside() { return x >= 0 && y >= 0 && x < w && y < h; }
      while (inside() && B(x, y)) { sc[2]++; x -= ddx; y -= ddy; }
      if (!inside()) return NaN;
      while (inside() && !B(x, y) && sc[1] <= maxCount) { sc[1]++; x -= ddx; y -= ddy; }
      if (!inside() || sc[1] > maxCount) return NaN;
      while (inside() && B(x, y) && sc[0] <= maxCount) { sc[0]++; x -= ddx; y -= ddy; }
      if (sc[0] > maxCount) return NaN;
      x = sx + ddx; y = sy + ddy;
      while (inside() && B(x, y)) { sc[2]++; x += ddx; y += ddy; }
      if (!inside()) return NaN;
      while (inside() && !B(x, y) && sc[3] < maxCount) { sc[3]++; x += ddx; y += ddy; }
      if (!inside() || sc[3] >= maxCount) return NaN;
      while (inside() && B(x, y) && sc[4] < maxCount) { sc[4]++; x += ddx; y += ddy; }
      if (sc[4] >= maxCount) return NaN;
      var total = sc[0] + sc[1] + sc[2] + sc[3] + sc[4];
      if (origTotal && 5 * Math.abs(total - origTotal) >= 2 * origTotal) return NaN;
      if (!ratio(sc, tol)) return NaN;
      var steps = (ddx ? (x - sx) / ddx : (y - sy) / ddy);
      return { off: endCenter(sc, steps), total: total };
    }
    var centers = [];
    function possible(sc, row, endX) {
      var total = sc[0] + sc[1] + sc[2] + sc[3] + sc[4];
      var cx = Math.floor(endCenter(sc, endX));
      var v = cross(cx, row, 0, 1, sc[2], total);
      if (!v) return false;
      var cy = Math.floor(row + v.off);
      var hz = cross(cx, cy, 1, 0, sc[2], total);
      if (!hz) return false;
      var fx = cx + hz.off, fy = row + v.off;
      var dg = cross(Math.floor(fx), Math.floor(fy), 1, 1, sc[2] * 2, 0, 0.75);   // diagonal: proportions only (length depends on rotation)
      if (!dg) return false;
      var size = (v.total + hz.total) / 14;
      for (var i = 0; i < centers.length; i++) {
        var c = centers[i];
        if (Math.abs(fy - c.y) <= size && Math.abs(fx - c.x) <= size) {
          var diff = Math.abs(size - c.size);
          if (diff <= 1 || diff <= c.size) {
            var n = c.count + 1;
            c.x = (c.x * c.count + fx) / n; c.y = (c.y * c.count + fy) / n; c.size = (c.size * c.count + size) / n; c.count = n;
            return true;
          }
        }
      }
      centers.push({ x: fx, y: fy, size: size, count: 1 });
      return true;
    }
    var step = Math.max(1, Math.floor(h / 400));
    for (var y = 0; y < h; y += step) {
      var sc = [0, 0, 0, 0, 0], st = 0;
      for (var x = 0; x < w; x++) {
        if (B(x, y)) {
          if (st & 1) st++;
          sc[st]++;
        } else if (!(st & 1)) {
          if (st === 4) {
            if (ratio(sc) && possible(sc, y, x)) { sc = [0, 0, 0, 0, 0]; st = 0; }
            else { sc = [sc[2], sc[3], sc[4], 1, 0]; st = 3; }
          } else sc[++st]++;
        } else sc[st]++;
      }
      if (st === 4 && ratio(sc)) possible(sc, y, w);
    }
    return centers;
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function pickThree(cs) {
    cs = cs.filter(function (c) { return c.count >= 2; }).length >= 3 ? cs.filter(function (c) { return c.count >= 2; }) : cs;
    cs = cs.sort(function (a, b) { return b.count - a.count; }).slice(0, 12);
    var best = null, bs = Infinity;
    for (var i = 0; i < cs.length; i++) for (var j = i + 1; j < cs.length; j++) for (var k = j + 1; k < cs.length; k++) {
      var t = [cs[i], cs[j], cs[k]];
      var sz = t.map(function (c) { return c.size; });
      var smax = Math.max.apply(null, sz), smin = Math.min.apply(null, sz);
      if (smax > 1.6 * smin) continue;
      var d = [[dist(t[1], t[2]), 0], [dist(t[0], t[2]), 1], [dist(t[0], t[1]), 2]].sort(function (a, b) { return a[0] - b[0]; });
      var a = d[0][0], b = d[1][0], c = d[2][0];
      if (a < 7 * smin) continue;
      var right = Math.abs(a * a + b * b - c * c) / (c * c), iso = 1 - a / b;
      if (right > 0.35 || iso > 0.45) continue;
      var score = right + iso + (smax - smin) / smax;
      if (score < bs) {
        bs = score;
        var tl = t[d[2][1]], o = t.filter(function (x) { return x !== tl; });
        var cr = (o[0].x - tl.x) * (o[1].y - tl.y) - (o[0].y - tl.y) * (o[1].x - tl.x);
        best = cr > 0 ? { tl: tl, tr: o[0], bl: o[1] } : { tl: tl, tr: o[1], bl: o[0] };
      }
    }
    return best;
  }

  function moduleAlong(bits, w, h, a, b) {
    /* length of the black–white–black run through finder a, measured towards b and away (≈ 7 modules) */
    function run(x0, y0, x1, y1) {
      var dx = x1 - x0, dy = y1 - y0, steps = Math.max(Math.abs(dx), Math.abs(dy));
      if (!steps) return NaN;
      var sx = dx / steps, sy = dy / steps, state = 0;
      for (var i = 0; i <= steps; i++) {
        var x = Math.round(x0 + sx * i), y = Math.round(y0 + sy * i);
        if (x < 0 || y < 0 || x >= w || y >= h) return NaN;
        var dark = bits[y * w + x];
        if (state === 0 && !dark) state = 1;
        else if (state === 1 && dark) state = 2;
        else if (state === 2 && !dark) return i * Math.hypot(sx, sy);
      }
      return NaN;
    }
    var away = { x: 2 * a.x - b.x, y: 2 * a.y - b.y };
    away.x = Math.max(0, Math.min(w - 1, away.x));
    away.y = Math.max(0, Math.min(h - 1, away.y));
    var s = run(a.x, a.y, b.x, b.y) + run(a.x, a.y, away.x, away.y);
    return s / 7;
  }

  function findAlignments(bits, w, h, ex, ey, ux, uy, ms, radius) {
    /* Candidates for the bottom-right alignment pattern near (ex, ey), best first.
       Each dark blob of about one module is scored by sampling the whole 5×5
       pattern along the code's own axes (ux, uy = one module), so rotation and
       look-alikes in the data area don't fool it. */
    function B(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && bits[y * w + x] === 1; }
    function score(cx, cy) {
      var s = 0;
      for (var j = -2; j <= 2; j++) for (var i = -2; i <= 2; i++) {
        var ring = Math.max(Math.abs(i), Math.abs(j)), want = ring !== 1;
        if (B(cx + i * ux.x + j * uy.x, cy + i * ux.y + j * uy.y) === want) s++;
      }
      return s;
    }
    var r = Math.round(radius * ms), x0 = Math.max(0, Math.round(ex - r)), x1 = Math.min(w - 1, Math.round(ex + r));
    var y0 = Math.max(0, Math.round(ey - r)), y1 = Math.min(h - 1, Math.round(ey + r)), seen = {}, out = [];
    for (var y = y0; y <= y1; y++) {
      var start = -1;
      for (var x = x0; x <= x1 + 1; x++) {
        var d = x <= x1 && bits[y * w + x] === 1;
        if (d && start < 0) { start = x; continue; }
        if (d || start < 0) continue;
        var len = x - start, cx = start + len / 2;
        start = -1;
        if (len < ms * 0.4 || len > ms * 1.9) continue;
        var cxi = Math.floor(cx), up = 0, dn = 0, yy;
        for (yy = y; yy >= 0 && bits[yy * w + cxi]; yy--) up++;
        for (yy = y + 1; yy < h && bits[yy * w + cxi]; yy++) dn++;
        if (up + dn < ms * 0.4 || up + dn > ms * 1.9) continue;
        var cy = y - up + 1 + (up + dn) / 2, key = Math.round(cx / 2) + "," + Math.round(cy / 2);
        if (seen[key]) continue;
        seen[key] = 1;
        var sc = score(cx, cy);
        if (sc >= 21) out.push({ x: cx, y: cy, s: sc, d: Math.hypot(cx - ex, cy - ey) });
      }
    }
    out.sort(function (p, q) { return (q.s - p.s) || (p.d - q.d); });
    return out.slice(0, 4);
  }

  function fitHomography(pairs, n, S) {
    /* Least-squares perspective map from module coords to image coords.
       pairs: [[u, v, x, y, weight], …], at least 4. Scaled (u/n, x/S) for stability. */
    var M = [], i, j, k;
    for (i = 0; i < 8; i++) M.push(new Float64Array(9));
    for (var p = 0; p < pairs.length; p++) {
      var u = pairs[p][0] / n, v = pairs[p][1] / n, x = pairs[p][2] / S, y = pairs[p][3] / S, wt = pairs[p][4] || 1;
      var rows = [[u, v, 1, 0, 0, 0, -u * x, -v * x, x], [0, 0, 0, u, v, 1, -u * y, -v * y, y]];
      for (var r = 0; r < 2; r++) {
        var row = rows[r];
        for (i = 0; i < 8; i++) if (row[i]) for (j = 0; j < 9; j++) M[i][j] += wt * row[i] * row[j];
      }
    }
    for (i = 0; i < 8; i++) {
      var piv = i;
      for (j = i + 1; j < 8; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
      var t = M[i]; M[i] = M[piv]; M[piv] = t;
      if (Math.abs(M[i][i]) < 1e-14) return null;
      for (j = i + 1; j < 8; j++) {
        var f = M[j][i] / M[i][i];
        if (f) for (k = i; k < 9; k++) M[j][k] -= f * M[i][k];
      }
    }
    var hh = new Array(8);
    for (i = 7; i >= 0; i--) {
      var s = M[i][8];
      for (j = i + 1; j < 8; j++) s -= M[i][j] * hh[j];
      hh[i] = s / M[i][i];
    }
    return function (uu, vv) {
      var a = uu / n, b = vv / n, d = hh[6] * a + hh[7] * b + 1;
      return [S * (hh[0] * a + hh[1] * b + hh[2]) / d, S * (hh[3] * a + hh[4] * b + hh[5]) / d];
    };
  }

  function homography(src, dst) {
    /* exactly 4 points (u,v) → (x,y) */
    return fitHomography(src.map(function (s, i) { return [s[0], s[1], dst[i][0], dst[i][1], 1]; }), 100, 1000);
  }

  function finderCorners(bits, w, h, c, ex, ey, ms) {
    /* The 4 outer corners of a finder's dark ring, in the order (0,0) (7,0) (7,7) (0,7)
       of its own 7×7 modules, found by flood-filling the ring. ex/ey: unit code axes. */
    var seed = null, state = 0, t;
    for (t = 0; t < 6 * ms; t += 0.5) {
      var sx = Math.floor(c.x - ex.x * t), sy = Math.floor(c.y - ex.y * t);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) return null;
      var dk = bits[sy * w + sx];
      if (state === 0 && !dk) state = 1;
      else if (state === 1 && dk) { seed = [sx, sy]; break; }
    }
    if (!seed) return null;
    var R = Math.ceil(6.5 * ms), bx = Math.floor(c.x) - R, by = Math.floor(c.y) - R, side = 2 * R + 1;
    var seen = new Uint8Array(side * side), stack = [seed[0], seed[1]], count = 0, leak = false;
    var dirs = [[-ex.x - ey.x, -ex.y - ey.y], [ex.x - ey.x, ex.y - ey.y], [ex.x + ey.x, ex.y + ey.y], [-ex.x + ey.x, -ex.y + ey.y]];
    var best = [-1e9, -1e9, -1e9, -1e9], pts = [null, null, null, null];
    while (stack.length) {
      var y = stack.pop(), x = stack.pop(), lx = x - bx, ly = y - by;
      if (x < 0 || y < 0 || x >= w || y >= h || !bits[y * w + x]) continue;
      if (lx < 0 || ly < 0 || lx >= side || ly >= side) { leak = true; continue; }
      if (seen[ly * side + lx]) continue;
      seen[ly * side + lx] = 1;
      count++;
      var px = x + 0.5 - c.x, py = y + 0.5 - c.y;
      for (var k = 0; k < 4; k++) {
        var d = px * dirs[k][0] + py * dirs[k][1];
        if (d > best[k]) { best[k] = d; pts[k] = [x + 0.5, y + 0.5]; }
      }
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    var area = count / (ms * ms);                      // the ring is 24 modules²
    if (leak || area < 12 || area > 40) return null;
    return pts.map(function (p, k) {                   // pixel centre → its outer corner
      var l = Math.hypot(dirs[k][0], dirs[k][1]) || 1;
      return [p[0] + 0.5 * dirs[k][0] / l, p[1] + 0.5 * dirs[k][1] / l];
    });
  }

  function sampleGrid(bits, w, h, H, n) {
    var grid = new Uint8Array(n * n);
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var q = H(x + 0.5, y + 0.5), px = Math.floor(q[0]), py = Math.floor(q[1]);
      if (!(px >= 0 && py >= 0 && px < w && py < h)) return null;
      grid[y * n + x] = bits[py * w + px];
    }
    return grid;
  }

  function readGrid(grid, n, note) {
    if (DBG) DBG.grids.push({ n: n, grid: grid, al: note });
    var r = decodeGrid(function (x, y) { return grid[y * n + x]; }, n) ||
            decodeGrid(function (x, y) { return grid[x * n + y]; }, n);       // mirrored
    if (DBG) DBG.tries.push({ n: n, how: note, ok: r ? (r.text !== undefined ? "text" : "v" + r.version) : false });
    return r;
  }

  function timingScore(bits, w, h, H, n) {
    /* how well the dotted timing lines (row and column 6) line up for this size */
    var ok = 0, tot = 0;
    for (var i = 8; i <= n - 9; i++) {
      var want = i % 2 === 0 ? 1 : 0, a = H(i + 0.5, 6.5), b = H(6.5, i + 0.5);
      for (var s = 0; s < 2; s++) {
        var q = s ? b : a, x = Math.floor(q[0]), y = Math.floor(q[1]);
        if (x >= 0 && y >= 0 && x < w && y < h) { tot++; if (bits[y * w + x] === want) ok++; }
      }
    }
    return tot ? ok / tot : 0;
  }

  function cornerPairs(f, n, corners) {
    var pairs = [[3.5, 3.5, f.tl.x, f.tl.y, 1], [n - 3.5, 3.5, f.tr.x, f.tr.y, 1], [3.5, n - 3.5, f.bl.x, f.bl.y, 1]];
    var org = [[0, 0], [n - 7, 0], [0, n - 7]], box = [[0, 0], [7, 0], [7, 7], [0, 7]];
    for (var i = 0; i < 3; i++) for (var k = 0; k < 4; k++) {
      pairs.push([org[i][0] + box[k][0], org[i][1] + box[k][1], corners[i][k][0], corners[i][k][1], 1]);
    }
    return pairs;
  }

  function tryCorners(bits, w, h, f, n, corners) {
    /* finder centres + their 12 ring corners → perspective; then refine with the alignment pattern */
    var pairs = cornerPairs(f, n, corners), S = Math.max(w, h), H0 = fitHomography(pairs, n, S);
    if (!H0) return null;
    var plans = [];
    if (n > 21) {
      var pr = H0(n - 6.5, n - 6.5), px1 = H0(n - 5.5, n - 6.5), py1 = H0(n - 6.5, n - 5.5);
      var ux = { x: px1[0] - pr[0], y: px1[1] - pr[1] }, uy = { x: py1[0] - pr[0], y: py1[1] - pr[1] };
      var lm = (Math.hypot(ux.x, ux.y) + Math.hypot(uy.x, uy.y)) / 2;
      findAlignments(bits, w, h, pr[0], pr[1], ux, uy, lm, 5).forEach(function (al) {
        plans.push(fitHomography(pairs.concat([[n - 6.5, n - 6.5, al.x, al.y, 8]]), n, S));
      });
    }
    plans.push(H0);
    for (var p = 0; p < plans.length; p++) {
      if (!plans[p]) continue;
      var g = sampleGrid(bits, w, h, plans[p], n);
      if (!g) continue;
      var r = readGrid(g, n, p < plans.length - 1 ? "corners+align" : "corners");
      if (r) return r;
    }
    return null;
  }

  function tryDim(bits, w, h, f, n, ms) {
    /* fallback without ring corners: 3 centres + alignment (or a parallelogram) */
    var tl = f.tl, tr = f.tr, bl = f.bl;
    var base = [[3.5, 3.5], [n - 3.5, 3.5], [3.5, n - 3.5]], dst = [[tl.x, tl.y], [tr.x, tr.y], [bl.x, bl.y]];
    var brx = tr.x - tl.x + bl.x, bry = tr.y - tl.y + bl.y, plans = [];
    if (n > 21) {
      var corr = 1 - 3 / (n - 7), k = 1 / (n - 7);
      var ux = { x: (tr.x - tl.x) * k, y: (tr.y - tl.y) * k }, uy = { x: (bl.x - tl.x) * k, y: (bl.y - tl.y) * k };
      findAlignments(bits, w, h, tl.x + corr * (brx - tl.x), tl.y + corr * (bry - tl.y), ux, uy, ms, 14).forEach(function (al) {
        plans.push({ src: [n - 6.5, n - 6.5], dst: [al.x, al.y], al: al });
      });
    }
    plans.push({ src: [n - 3.5, n - 3.5], dst: [brx, bry], al: null });
    for (var p = 0; p < plans.length; p++) {
      var H = homography(base.concat([plans[p].src]), dst.concat([plans[p].dst]));
      if (!H) continue;
      var g = sampleGrid(bits, w, h, H, n);
      if (!g) continue;
      var r = readGrid(g, n, plans[p].al ? "centres+align" : "parallelogram");
      if (r) return r;
    }
    return null;
  }

  var DBG = null;
  function decode(img, debug) {
    var w = img.width, h = img.height;
    DBG = debug ? { tries: [], grids: [] } : null;
    if (w < 40 || h < 40) return null;
    var lum = luminance(img.data, w, h);
    for (var pass = 0; pass < 2; pass++) {           // fine threshold first, then a coarser one (uneven light)
      var t = decodeBits(binarize(lum, w, h, pass ? 24 : 8), w, h);
      if (t !== null) return t;
    }
    return null;
  }

  function unit(a, b) { var l = dist(a, b) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; }

  function decodeBits(bits, w, h) {
    var cs = Finder(bits, w, h);
    var f = pickThree(cs);
    if (DBG) { DBG.centers = cs.map(function (c) { return [Math.round(c.x), Math.round(c.y), +c.size.toFixed(1), c.count]; }); DBG.picked = f; }
    if (!f) return null;
    var ms = (moduleAlong(bits, w, h, f.tl, f.tr) + moduleAlong(bits, w, h, f.tl, f.bl) +
              moduleAlong(bits, w, h, f.tr, f.tl) + moduleAlong(bits, w, h, f.bl, f.tl)) / 4;
    if (!(ms > 0)) ms = (f.tl.size + f.tr.size + f.bl.size) / 3;
    var ex = unit(f.tl, f.tr), ey = unit(f.tl, f.bl), corners = [];
    [f.tl, f.tr, f.bl].forEach(function (c) { corners.push(finderCorners(bits, w, h, c, ex, ey, ms)); });
    if (corners.some(function (c) { return !c; })) corners = null;
    var mTop = ms, mLeft = ms;
    if (corners) {                                   // module size at each finder, from its ring's sides
      var side = function (q) {
        var s = 0;
        for (var i = 0; i < 4; i++) s += Math.hypot(q[(i + 1) % 4][0] - q[i][0], q[(i + 1) % 4][1] - q[i][1]);
        return s / 28;
      };
      var s0 = side(corners[0]), s1 = side(corners[1]), s2 = side(corners[2]);
      mTop = (s0 + s1) / 2;
      mLeft = (s0 + s2) / 2;
    }
    var est = (dist(f.tl, f.tr) / mTop + dist(f.tl, f.bl) / mLeft) / 2 + 7;
    if (DBG) { DBG.ms = ms; DBG.est = est; DBG.corners = !!corners; }
    var base = Math.round((est - 17) / 4) * 4 + 17, order = [];
    for (var dd = 0; dd <= 12; dd += 4) {
      if (base + dd <= 177) order.push(base + dd);
      if (dd && base - dd >= 21) order.push(base - dd);
    }
    if (corners) {                                   // the timing lines say which size fits
      var S = Math.max(w, h);
      order = order.map(function (n) {
        var H = fitHomography(cornerPairs(f, n, corners), n, S);
        return { n: n, s: H ? timingScore(bits, w, h, H, n) : 0, d: Math.abs(n - est) };
      }).sort(function (a, b) { return (b.s - a.s) || (a.d - b.d); }).map(function (o) { return o.n; });
      if (DBG) DBG.order = order.slice();
    }
    var tried = {};
    for (var i = 0; i < Math.min(order.length, 4); i++) {
      var n = order[i];
      if (tried[n]) continue;
      tried[n] = 1;
      var r = (corners && tryCorners(bits, w, h, f, n, corners)) || tryDim(bits, w, h, f, n, ms);
      if (r && r.version && !tried[r.version * 4 + 17]) {
        n = r.version * 4 + 17;
        tried[n] = 1;
        r = (corners && tryCorners(bits, w, h, f, n, corners)) || tryDim(bits, w, h, f, n, ms);
      }
      if (r && typeof r.text === "string") return r.text;
    }
    return null;
  }

  root.MCScan = { decode: decode, _rs: rsCorrect, _binarize: function (rgba, w, h, R) { return binarize(luminance(rgba, w, h), w, h, R || 8); },
                  debug: function () { return DBG; } };
})(typeof self !== "undefined" ? self : globalThis);
