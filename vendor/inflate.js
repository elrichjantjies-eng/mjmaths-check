/* Raw DEFLATE decompressor (RFC 1951): stored, fixed and dynamic Huffman
   blocks. Small and dependency-free, so worksheet links open on any phone
   (older iPhones have no DecompressionStream). Written for Maths Check. */
(function (root) {
  "use strict";
  var LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
               163, 195, 227, 258];
  var LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  var DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537,
               2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  var DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  var ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  function huffman(lengths, n) {             // canonical code → counts + symbols (as in zlib's puff)
    var count = new Uint16Array(16), offs = new Uint16Array(16), symbol = new Uint16Array(n), i;
    for (i = 0; i < n; i++) count[lengths[i]]++;
    count[0] = 0;
    for (i = 1; i < 15; i++) offs[i + 1] = offs[i] + count[i];
    for (i = 0; i < n; i++) if (lengths[i]) symbol[offs[lengths[i]]++] = i;
    return { count: count, symbol: symbol };
  }

  var FIXED_L, FIXED_D;
  function fixed() {
    if (!FIXED_L) {
      var l = new Uint8Array(288), i;
      for (i = 0; i < 144; i++) l[i] = 8;
      for (; i < 256; i++) l[i] = 9;
      for (; i < 280; i++) l[i] = 7;
      for (; i < 288; i++) l[i] = 8;
      FIXED_L = huffman(l, 288);
      var d = new Uint8Array(30);
      for (i = 0; i < 30; i++) d[i] = 5;
      FIXED_D = huffman(d, 30);
    }
  }

  function inflateRaw(data) {
    var pos = 0, bitbuf = 0, bitcnt = 0, out = [], i;

    function bits(n) {
      while (bitcnt < n) {
        if (pos >= data.length) throw new Error("inflate: data ends too soon");
        bitbuf |= data[pos++] << bitcnt;
        bitcnt += 8;
      }
      var v = bitbuf & ((1 << n) - 1);
      bitbuf >>>= n;
      bitcnt -= n;
      return v;
    }

    function decode(h) {
      var code = 0, first = 0, index = 0, len, count;
      for (len = 1; len < 16; len++) {
        code |= bits(1);
        count = h.count[len];
        if (code - count < first) return h.symbol[index + (code - first)];
        index += count;
        first += count;
        first <<= 1;
        code <<= 1;
      }
      throw new Error("inflate: bad code");
    }

    function codes(lc, dc) {
      for (;;) {
        var sym = decode(lc);
        if (sym < 256) { out.push(sym); continue; }
        if (sym === 256) return;
        sym -= 257;
        if (sym >= 29) throw new Error("inflate: bad length");
        var len = LBASE[sym] + bits(LEXT[sym]);
        var ds = decode(dc);
        if (ds >= 30) throw new Error("inflate: bad distance");
        var dist = DBASE[ds] + bits(DEXT[ds]);
        if (dist > out.length) throw new Error("inflate: distance too far back");
        var from = out.length - dist;
        for (var k = 0; k < len; k++) out.push(out[from + k]);
      }
    }

    var last;
    do {
      last = bits(1);
      var type = bits(2);
      if (type === 0) {                      // stored
        bitbuf = 0;
        bitcnt = 0;
        if (pos + 4 > data.length) throw new Error("inflate: data ends too soon");
        var len = data[pos] | (data[pos + 1] << 8), nlen = data[pos + 2] | (data[pos + 3] << 8);
        pos += 4;
        if (len !== (~nlen & 0xffff)) throw new Error("inflate: bad stored block");
        if (pos + len > data.length) throw new Error("inflate: data ends too soon");
        for (i = 0; i < len; i++) out.push(data[pos++]);
      } else if (type === 1) {
        fixed();
        codes(FIXED_L, FIXED_D);
      } else if (type === 2) {
        var nlit = bits(5) + 257, ndist = bits(5) + 1, ncode = bits(4) + 4;
        if (nlit > 286 || ndist > 30) throw new Error("inflate: bad counts");
        var lengths = new Uint8Array(320);
        for (i = 0; i < ncode; i++) lengths[ORDER[i]] = bits(3);
        var lencode = huffman(lengths, 19);
        lengths = new Uint8Array(320);
        var idx = 0;
        while (idx < nlit + ndist) {
          var sym = decode(lencode), rep, val = 0;
          if (sym < 16) { lengths[idx++] = sym; continue; }
          if (sym === 16) {
            if (idx === 0) throw new Error("inflate: repeat with no previous length");
            val = lengths[idx - 1];
            rep = 3 + bits(2);
          } else if (sym === 17) rep = 3 + bits(3);
          else rep = 11 + bits(7);
          if (idx + rep > nlit + ndist) throw new Error("inflate: too many lengths");
          while (rep--) lengths[idx++] = val;
        }
        if (!lengths[256]) throw new Error("inflate: no end-of-block code");
        codes(huffman(lengths.subarray(0, nlit), nlit), huffman(lengths.subarray(nlit, nlit + ndist), ndist));
      } else {
        throw new Error("inflate: bad block type");
      }
    } while (!last);
    return new Uint8Array(out);
  }

  root.MCInflate = { inflateRaw: inflateRaw };
})(typeof self !== "undefined" ? self : globalThis);
