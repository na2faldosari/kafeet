/* ============================================================
   كَفيت — الطبقة الثابتة (القانون يقرّر ويوثّق)
   - DeadlineEngine: يشتق المهلة بأيام العمل السعودية (يستبعد الجمعة/السبت/العطل).
   - Validation: يتحقّق من مخرجات الذكاء قبل قبولها.
   - AuditLog: سجل أحداث بسلسلة تجزئة sha256 قابل لإعادة التشغيل (بزمنٍ محقون).
   - ثابت 100%: نفس المُدخل ⇒ نفس المُخرج دائماً (لا Date.now، لا عشوائية).
   ============================================================ */
(function () {
  "use strict";

  /* ---- sha256 مُدمج (متزامن، يدعم UTF-8) — geraintluff/sha256, مضغوط ---- */
  function sha256(str) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, maxWord = mp(2, 32), result = "", words = [], i, j;
    var ascii = unescape(encodeURIComponent(str)); // UTF-8 → byte-string
    var bitLen = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [];
    var pc = k.length, comp = {};
    for (var cand = 2; pc < 64;) {
      if (!comp[cand]) {
        for (i = 0; i < 313; i += cand) comp[i] = cand;
        hash[pc] = (mp(cand, .5) * maxWord) | 0;
        k[pc++] = (mp(cand, 1 / 3) * maxWord) | 0;
      }
      cand++;
    }
    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
            (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++)
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? "0" : "") + b.toString(16);
      }
    return result;
  }

  /* ---- أدوات التاريخ (ثابتة، آمنة من المنطقة الزمنية) ---- */
  function dateOnly(iso) { return String(iso).slice(0, 10); } // الإزاحة +03:00 مضمّنة ⇒ تاريخ الرياض
  function dow(ds) { return new Date(ds + "T00:00:00Z").getUTCDay(); } // 0=أحد .. 5=جمعة 6=سبت
  function fmt(d) {
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
  }
  function addCalendarDays(ds, n) {
    var d = new Date(ds + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return fmt(d);
  }
  function nextDay(ds) { return addCalendarDays(ds, 1); }
  var DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  function holidayOf(ds, holidays) {
    for (var i = 0; i < holidays.length; i++) if (holidays[i].date === ds) return holidays[i];
    return null;
  }

  /* ---- DeadlineEngine ---- */
  function computeDeadline(opts) {
    // opts: { filedAt, ruleType, samaRules, holidays, assumedNow }
    var rule = opts.samaRules[opts.ruleType];
    if (!rule) throw new Error("نوع قاعدة ساما غير معروف: " + opts.ruleType);
    var n = rule.workingDays;
    var filed = dateOnly(opts.filedAt);
    var cursor = filed, count = 0, excluded = [];
    while (count < n) {
      cursor = nextDay(cursor);
      var wd = dow(cursor);
      if (wd === 5 || wd === 6) { excluded.push({ date: cursor, reasonAr: DOW_AR[wd] }); continue; }
      var h = holidayOf(cursor, opts.holidays);
      if (h) { excluded.push({ date: cursor, reasonAr: h.nameAr }); continue; }
      count++;
    }
    var computedDeadline = cursor;
    var naiveDeadline = addCalendarDays(filed, n); // العدّ التقويمي المباشر — غالباً غير صحيح
    var naiveLandsOn = { date: naiveDeadline, dowAr: DOW_AR[dow(naiveDeadline)], holiday: holidayOf(naiveDeadline, opts.holidays) };

    // عدّ أيام العمل وحده: يستبعد الجمعة/السبت لكن يُغفل العطل الرسمية ⇒ أبكر بيوم عمل = خرق SLA
    var sc = filed, scCount = 0, scGuard = 0;
    while (scCount < n) {
      if (++scGuard > 4000) break;
      sc = nextDay(sc);
      var swd = dow(sc);
      if (swd === 5 || swd === 6) continue;
      scCount++;
    }
    var semiNaiveLandsOn = { date: sc, dowAr: DOW_AR[dow(sc)], holiday: holidayOf(sc, opts.holidays), early: sc < computedDeadline };

    // العدّ التنازلي حسب «اليوم الافتراضي» المحقون
    var today = dateOnly(opts.assumedNow);
    var remaining = workingDaysBetween(today, computedDeadline, opts.holidays);
    var status = remaining < 0 ? "overdue" : (remaining === 0 ? "due-today" : "within");

    return {
      ruleType: opts.ruleType, workingDays: n, citationAr: rule.citationAr,
      filedDate: filed, filedDowAr: DOW_AR[dow(filed)],
      computedDeadline: computedDeadline, computedDowAr: DOW_AR[dow(computedDeadline)],
      naive: naiveLandsOn, semiNaive: semiNaiveLandsOn, excluded: excluded,
      countdown: { assumedDate: today, status: status, remainingWorkingDays: remaining },
    };
  }

  function workingDaysBetween(fromDs, toDs, holidays) {
    // عدد أيام العمل من fromDs (غير محتسب) حتى toDs ضمناً؛ سالب لو toDs مضى
    if (toDs === fromDs) return 0;
    var sign = toDs > fromDs ? 1 : -1, count = 0, cursor = fromDs, guard = 0;
    while (cursor !== toDs) {
      if (++guard > 4000) break; // حارس متانة: لا حلقة لا نهائية مهما كان المدخل
      cursor = addCalendarDays(cursor, sign);
      var wd = dow(cursor);
      if (wd === 5 || wd === 6) continue;
      if (holidayOf(cursor, holidays)) continue;
      count += sign;
    }
    return count;
  }

  /* ---- ValidationLayer: بوابة بين «يقترح» و«يقرّر» ---- */
  function validateIntelligence(raw, statement, allowed, expectedRuleType) {
    var errors = [];
    if (!raw || typeof raw !== "object") return { ok: false, errors: ["ناتج الذكاء ليس كائن JSON صالحاً"], fallbackAr: "السقوط إلى مراجعة بشرية" };
    var codes = allowed.map(function (c) { return c.code; });
    if (codes.indexOf(raw.classification) === -1) errors.push("تصنيف خارج القائمة المسموحة: " + raw.classification);
    if (!Array.isArray(raw.evidenceIds) || !raw.evidenceIds.length) errors.push("لا توجد مُعرّفات أدلة");
    var txnIds = statement.map(function (t) { return t.txnId; });
    if (Array.isArray(raw.evidenceIds)) raw.evidenceIds.forEach(function (id) {
      if (txnIds.indexOf(id) === -1) errors.push("مُعرّف دليل غير موجود في الكشف: " + id);
    });
    if (typeof raw.confidence !== "number" || !isFinite(raw.confidence) || raw.confidence < 0.6 || raw.confidence > 1) errors.push("ثقة غير صالحة (يجب أن تكون بين 0.6 و1) ⇒ مراجعة بشرية");
    if (expectedRuleType && raw.samaRuleType !== expectedRuleType) errors.push("نوع قاعدة ساما لا يطابق السيناريو: " + raw.samaRuleType);
    if (!raw.arabicObjectionDraft) errors.push("لا يوجد نص اعتراض");
    return { ok: errors.length === 0, errors: errors, fallbackAr: errors.length ? "السقوط إلى مراجعة بشرية" : null };
  }

  /* ---- AuditLog: سلسلة تجزئة قابلة لإعادة التشغيل ---- */
  function createAuditLog() {
    var events = [];
    function append(actor, action, payload, ts) {
      var prevHash = events.length ? events[events.length - 1].hash : "0".repeat(64);
      var seq = events.length + 1;
      var core = { seq: seq, ts: ts, actor: actor, action: action, payload: payload, prevHash: prevHash };
      var hash = sha256(JSON.stringify(core));
      events.push(Object.assign({}, core, { hash: hash }));
      return events[events.length - 1];
    }
    // إعادة التشغيل: نعيد بناء السلسلة من الحمولات ونقارنها بايتاً ببايت
    function replay() {
      var rebuilt = [], prevHash = "0".repeat(64), ok = true;
      events.forEach(function (e) {
        var core = { seq: e.seq, ts: e.ts, actor: e.actor, action: e.action, payload: e.payload, prevHash: prevHash };
        var h = sha256(JSON.stringify(core));
        if (h !== e.hash) ok = false;
        rebuilt.push(Object.assign({}, core, { hash: h }));
        prevHash = h;
      });
      return { ok: ok, events: rebuilt };
    }
    return { append: append, replay: replay, get events() { return events; } };
  }

  window.KAFEET_ENGINE = {
    sha256: sha256,
    computeDeadline: computeDeadline,
    workingDaysBetween: workingDaysBetween,
    validateIntelligence: validateIntelligence,
    createAuditLog: createAuditLog,
    util: { dateOnly: dateOnly, dow: dow, DOW_AR: DOW_AR, holidayOf: holidayOf },
  };
})();
