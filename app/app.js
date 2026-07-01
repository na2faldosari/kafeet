/* ============================================================
   كَفيت — منطق الواجهة + طبقة ترجمة (عربي/إنجليزي)
   المحرّك يبقى محايد اللغة؛ الترجمة في طبقة العرض فقط.
   الخطاب الرسمي يبقى عربياً دائماً (عربي أولاً) مع ملخّص إنجليزي.
   ============================================================ */
(function () {
  "use strict";
  var D = window.KAFEET_DATA, E = window.KAFEET_ENGINE;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var state = { key: "A_DUPLICATE_CHARGE", filedAt: null, audit: null, computed: null, authorized: false, lang: "ar" };

  /* ---------- قاموس الترجمة ---------- */
  var T = {
    ar: {
      dir: "rtl", langBtn: "EN", sep: "، ", andWord: " و",
      tagline: "يتولّى شكوى العميل على مصرفه حتى إغلاقها ضمن المهلة النظامية، وفق أنظمة البنك المركزي السعودي (ساما)",
      pillSim: "داخل تطبيق مصرف الإنماء · محاكاة", assumedToday: "اليوم الافتراضي:",
      runAgent: "بدء المعالجة", regulatorView: "وضع الرقيب",
      filedLabel: "تاريخ تقديم الشكوى", filedHint: "بتغيير التاريخ يُعيد المحرّك حساب المهلة لحظياً",
      bank: "مصرف الإنماء", segDays: function (n) { return " · " + n + " أيام"; },
      statementMeta: "كشف الحساب · بيانات تركيبية", disputed: "محل النزاع", sar: "ريال",
      hint: 'اضغط <b>بدء المعالجة</b> ليتولّى كَفيت شكواك نيابةً عنك', handlingNow: "«كَفيت» قيد المعالجة الآن:",
      dlTitle: "حساب المهلة النظامية (ساما)", dlSub: "· نتيجة ثابتة",
      within: function (n) { return "ضمن المهلة · باقٍ " + n + " أيام عمل"; },
      overdue: "تجاوزت المهلة → تصعيد", dueToday: "تستحق اليوم",
      correctLbl: "المهلة النظامية · أيام العمل", naiveLbl: "العدّ التقويمي المباشر (خطأ)", semiLbl: "عدّ أيام العمل وحده (خطأ)", semiNote: " · يُغفل العطلة الرسمية", wd: "أيام عمل",
      meetsHol: function (nm) { return "، يصادف " + nm; }, meetsWeekend: "، يصادف نهاية الأسبوع",
      citeNote: "المُهَل قابلة للضبط والمراجعة، وليست أرقاماً ثابتة في الكود.",
      calFiling: "تقديم", calWork: function (n) { return "يوم عمل " + n; }, markDeadline: "✓ المهلة", markErr: "✕ خطأ",
      aCustomer: "العميل", aAI: "تحليل · بالذكاء الاصطناعي (Claude)", aLaw: "المحرّك الثابت", aGate: "تفويض العميل",
      actReceived: "استلام الشكوى", actClassify: "تحديد نوع الشكوى", actVerify: "التحقّق", actEvidence: "جمع الأدلة",
      actDraft: "صياغة الاعتراض", actGate: "خطوة حسّاسة", actFile: "تقديم الاعتراض", actDeadline: "حساب المهلة النظامية",
      actEscalate: "تصعيد مُهيّأ بانتظار التفويض", actTrack: "متابعة المهلة",
      bReceived: function (s) { return "استُلمت شكواك المقدَّمة عبر مصرف الإنماء بشأن: " + s; },
      bClassify: function (c, p) { return "صُنِّفت الشكوى: <b>" + c + "</b> · بثقة " + p + "٪"; },
      tagPrompt: "نص التوجيه ومُخرَج JSON الخام مرفقان",
      bVerifyOk: "اكتمل التحقّق: البيانات سليمة، والأدلة مثبتة في كشف الحساب ✓",
      bVerifyFail: function (f) { return "تعذّر التحقّق → " + f; },
      bEvidence: function (ids) { return "رُبطت الأدلة من كشف الحساب: " + ids; },
      bDraft: "صِيغ خطاب الاعتراض الرسمي، ويظهر في اللوحة.",
      bGate: "تقديم الاعتراض إجراء حسّاس، لن يُنفَّذ إلا بتفويضك.",
      authorizeBtn: "تفويض الإجراء", stopBtn: "إيقاف", gateDone: "✓ فُوِّض الإجراء", gateStopped: "✓ أُوقِف الإجراء",
      actStopped: "إيقاف الإجراء", bStopped: "أُوقِف الإجراء قبل التقديم، فلم يُرفَع أي إجراء إلى المصرف، وأُثبتت لحظة الإيقاف في السجل.",
      bFiled: function (ref) { return "قُدِّم الاعتراض، الرقم المرجعي: <b>" + ref + "</b>"; },
      bDeadline: function (d, n, ex) { return "حُدِّدت المهلة النظامية: <b>" + d + "</b> (" + n + " أيام عمل، بعد استبعاد " + ex + ")"; },
      excWeekends: "نهايات الأسبوع",
      bEscalate: "انقضت المهلة → أُعِدّ طلب «ساما تهتم» مرفقاً بالسجل، بانتظار تفويضك.",
      bTrack: function (n) { return "متابعة المهلة جارية، ويُهيَّأ التصعيد إلى «ساما تهتم» بعد انقضائها. المتبقّي: " + n + " أيام عمل."; },
      letterTitle: "خطاب الاعتراض الرسمي", letterBadge: "مُولّد بـ Claude · استجابة مُسجّلة", shariahLabel: "✓ تحقّق شرعي",
      gistPrefix: "",
      regEmpty: "ابدأ المعالجة أولاً ليتكوّن سجلّ التدقيق.",
      rhSeq: "#", rhActor: "الفاعل", rhAction: "الإجراء",
      regNote: "كل حدث مختوم بـ sha256 مرتبطاً بالسابق، فلا يمكن العبث به دون كشفه.",
      liveAudit: "السجل الرقابي الحيّ · تحقّق بنفسك",
      regWhy: "<b>ما هذا السجل؟</b> سجل يوثّق كل خطوة ينفّذها «كَفيت»، وكل بيان فيه مختوم ببصمة مرتبطة بما قبلها. أي تعديل، ولو من المصرف نفسه، يكسر السلسلة فيظهر فوراً. اضغط الزر الأحمر وعدّل أي بيان ليظهر الكشف.",
      btnVerify: "تحقّق من السجل", btnTamper: "تعديل بيانٍ في السجل", btnReset: "استعادة السجل ↻",
      verdictOk: "<b>✓ السجل سليم.</b> بصمة كل خطوة تطابق المحفوظة، فالسجل موثوق.",
      verdictBad: function (s, a) { return "<b>✗ كُشف التغيير فوراً.</b> غُيِّر بيان الحدث #" + s + " («" + a + "»). لاحظ عمودَي «البيان» و«الحالة» يحمرّان من هنا. بصمته لم تعد تطابق المحفوظة فانكسرت السلسلة، ولا يمكن إخفاء هذا التغيير عن الجهة الرقابية."; },
      rhData: "البيان", rhSeal: "البصمة", rhStatus: "الحالة", stMatch: "✓ مطابق", stChanged: "✗ تغيّر",
      intactBadge: "السلسلة سليمة ومتطابقة بايتاً ببايت ✓",
      brokenBadge: function (s) { return "انكسرت السلسلة عند الحدث #" + s + " ✗"; },
      honestyHtml: 'إفصاحٌ كامل: <span class="g">قيد التنفيذ الآن</span> = حساب المهلة والسجل والتوثيق · <span class="a">مُولّد مسبقاً بالذكاء الاصطناعي (Claude)</span> = تصنيف الشكوى ونصّ الاعتراض · <span class="r">محاكاة</span> = الربط مع أنظمة مصرف الإنماء ونفاذ وساما تهتم.',
      hookHtml: '<b class="num">84.3%</b> من شكاوى عملاء البنوك سببها زمن المعالجة (PwC×DataEQ، المؤشر المصرفي السعودي 2024)',
      probHtml: '<div class="prob"><div class="p-row"><b>اليوم:</b> قدّم الشكوى، وانتظر، واتصل، وتابع بنفسك.</div><div class="p-row with"><b>مع كَفيت:</b> وكيلٌ يتولّى شكواك حتى الإغلاق، ويصعّد نيابةً عنك.</div></div>',
      scopeHtml: '<div class="scope-title">حدود صلاحيات الوكيل</div><div class="scope-grid"><div class="sc ok"><div class="sc-h">دون إذن</div>يقرأ الكشف، ويصنّف الشكوى، ويصوغ الاعتراض، ويحسب المهلة.</div><div class="sc gate"><div class="sc-h">بإذنك فقط</div>يقدّم الاعتراض للمصرف، ويرفع التصعيد إلى «ساما تهتم».</div><div class="sc never"><div class="sc-h">أبداً</div>لا يحوّل مالاً، ولا يعدّل بياناتك، ولا يغلق حساباً.</div></div>',
      dow: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      dowShort: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    },
    en: {
      dir: "ltr", langBtn: "ع", sep: ", ", andWord: " and ",
      tagline: "An agent that carries a customer's complaint to closure — per Saudi Central Bank rules",
      pillSim: "Inside Alinma app · simulation", assumedToday: "Assumed today:",
      runAgent: "Start processing", regulatorView: "Regulator view",
      filedLabel: "Complaint filing date", filedHint: "Change it — the engine recomputes instantly",
      bank: "Alinma Bank", segDays: function (n) { return " · " + n + " days"; },
      statementMeta: "Statement — synthetic data", disputed: "Disputed", sar: "SAR",
      hint: 'Tap <b>Start processing</b> and let Kafeet handle your dispute on your behalf', handlingNow: "«Kafeet» is now handling:",
      dlTitle: "SAMA deadline engine", dlSub: "— deterministic",
      within: function (n) { return "Within deadline · " + n + " working days left"; },
      overdue: "Deadline passed → escalation", dueToday: "Due today",
      correctLbl: "Regulatory deadline · working days", naiveLbl: "Naive calendar count", semiLbl: "Working-days only (wrong)", semiNote: " · ignores the official holiday", wd: "working days",
      meetsHol: function (nm) { return " — falls on " + nm; }, meetsWeekend: " — falls on the weekend",
      citeNote: "Deadlines are configurable and auditable, not constants hard-coded.",
      calFiling: "Filed", calWork: function (n) { return "Work day " + n; }, markDeadline: "✓ Deadline", markErr: "✕ Wrong",
      aCustomer: "Customer", aAI: "Reasoning · Claude-generated", aLaw: "Deterministic law", aGate: "Customer authorization",
      actReceived: "Receive complaint", actClassify: "Classify dispute", actVerify: "Verify", actEvidence: "Collect evidence",
      actDraft: "Draft objection", actGate: "Sensitive step", actFile: "File objection", actDeadline: "Set deadline",
      actEscalate: "Escalation prepared", actTrack: "Track deadline",
      bReceived: function (s) { return "Received your complaint on: " + s; },
      bClassify: function (c, p) { return "Classified the dispute: <b>" + c + "</b> · at " + p + "% confidence"; },
      tagPrompt: "Prompt and raw JSON output attached",
      bVerifyOk: "Verified: data valid and evidence present in the statement ✓",
      bVerifyFail: function (f) { return "Verification failed → " + f; },
      bEvidence: function (ids) { return "Linked evidence from the statement: " + ids; },
      bDraft: "Drafted the official objection letter — see the panel.",
      bGate: "Filing the objection is a sensitive step — it won't proceed without your approval.",
      authorizeBtn: "Authorize", stopBtn: "Stop", gateDone: "✓ You authorized it", gateStopped: "✓ You stopped it",
      actStopped: "Customer stopped", bStopped: "You stopped the action before filing — nothing was sent to the bank, and the stop is recorded in the log.",
      bFiled: function (ref) { return "Filed the objection — reference: <b>" + ref + "</b>"; },
      bDeadline: function (d, n, ex) { return "Set the deadline: <b>" + d + "</b> (" + n + " working days, after excluding " + ex + ")"; },
      excWeekends: "weekends",
      bEscalate: "Deadline passed → prepared a «Sama Cares» request with the log, awaiting one tap from you.",
      bTrack: function (n) { return "Tracking the deadline; if it lapses, a «Sama Cares» escalation is prepared for your approval. " + n + " working days left."; },
      letterTitle: "Official objection letter", letterBadge: "Claude-generated — recorded response", shariahLabel: "✓ Sharia check",
      gistPrefix: "Drafted in formal Arabic (the official language for SAMA correspondence). Summary: ",
      regEmpty: "Run the agent first to build the audit log.",
      rhSeq: "#", rhActor: "Actor", rhAction: "Action",
      regNote: "Each event is sealed with sha256(event + previous hash) — a tamper-evident chain.",
      liveAudit: "Live regulator log — verify it yourself",
      regWhy: "<b>Why:</b> a record of everything the agent did — each entry sealed to the one before it. Any change — even by the bank — breaks the chain and is caught instantly. Press the red button, alter any value, and watch it get caught.",
      btnVerify: "Verify ✓", btnTamper: "Try changing a value", btnReset: "Restore the log ↻",
      verdictOk: "<b>✓ Log intact — untouched.</b> Every step's seal matches the stored one exactly.",
      verdictBad: function (s, a) { return "<b>✗ Change caught instantly.</b> Event #" + s + "'s data («" + a + "») was altered — notice the «Data» and «Status» columns turn red from here. Its seal no longer matches the stored one, so the chain breaks; no change can be hidden from the regulator."; },
      rhData: "Data", rhSeal: "Seal", rhStatus: "Status", stMatch: "✓ match", stChanged: "✗ changed",
      intactBadge: "Chain intact — byte-for-byte identical ✓",
      brokenBadge: function (s) { return "Chain breaks at event #" + s + " ✗"; },
      honestyHtml: 'Full disclosure: <span class="g">Live now</span> = deterministic engine, log and deadline · <span class="a">Claude-pregenerated</span> = classification and objection text · <span class="r">Simulated</span> = integration with Alinma systems, Nafath and Sama Cares.',
      hookHtml: '<b class="num">84.3%</b> of Saudi bank-customer complaints stem from resolution time (PwC×DataEQ, KSA Banking Sentiment Index 2024)',
      probHtml: '<div class="prob"><div class="p-row"><b>Today:</b> file the complaint, wait, call, and chase it yourself.</div><div class="p-row with"><b>With Kafeet:</b> an agent handles it to closure and escalates on your behalf.</div></div>',
      scopeHtml: '<div class="scope-title">Agent authority boundaries</div><div class="scope-grid"><div class="sc ok"><div class="sc-h">Without permission</div>Reads the statement, classifies the complaint, drafts the objection, computes the deadline.</div><div class="sc gate"><div class="sc-h">Only with your consent</div>Files the objection and raises the SAMA Cares escalation.</div><div class="sc never"><div class="sc-h">Never</div>No money transfers, no edits to your data, no account closure.</div></div>',
      dow: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      dowShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
  };
  function L() { return T[state.lang]; }
  function en() { return state.lang === "en"; }

  /* ---------- أدوات ---------- */
  function scn() { return D.scenarios[state.key]; }
  function txnById(id) { return D.transactions.filter(function (t) { return t.txnId === id; })[0]; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function num(s) { return '<span class="num">' + s + "</span>"; }
  function holName(h) { return en() ? (h.nameEn || h.nameAr) : h.nameAr; }
  function clsName(code) { var c = D.allowedClassifications.filter(function (x) { return x.code === code; })[0] || {}; return en() ? (c.en || code) : (c.ar || code); }
  function scnLabel() { var s = scn(); return en() ? (s.labelEn || s.labelAr) : s.labelAr; }
  function clockAt(i) { var ms = Date.parse(state.filedAt) + i * 37000, d = new Date(ms); return pad((d.getUTCHours() + 3) % 24) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()); }
  function isoAt(i) { return new Date(Date.parse(state.filedAt) + i * 37000).toISOString(); }
  function genRef() { var h = E.sha256(scn().txnIds.join("|")); return "INM-2025-" + (parseInt(h.slice(0, 6), 16) % 900000 + 100000); }
  function compute() { state.computed = E.computeDeadline({ filedAt: state.filedAt, ruleType: scn().ruleType, samaRules: D.samaRules, holidays: D.holidays, assumedNow: D.meta.assumedNow }); return state.computed; }
  var CLS = { CUSTOMER: "customer", AI: "ai", DETERMINISTIC: "law", HUMAN_GATE: "gate" };
  function actorLabel(a) { return { CUSTOMER: L().aCustomer, AI: L().aAI, DETERMINISTIC: L().aLaw, HUMAN_GATE: L().aGate }[a]; }

  /* ---------- الكشف ---------- */
  function renderStatement() {
    var l = L(), disputed = scn().txnIds;
    var rows = D.transactions.map(function (t) {
      var hot = disputed.indexOf(t.txnId) !== -1;
      var main = en() ? t.merchantEn : t.merchantAr, sub = en() ? t.merchantAr : t.merchantEn;
      return '<div class="txn' + (hot ? " hot" : "") + '">' +
        '<div><div class="m">' + main + ' <small>' + sub + '</small></div>' +
        '<div class="ref">' + num(t.madaRef) + ' · ' + num(t.timestamp.slice(0, 10)) + '</div></div>' +
        '<div style="text-align:start"><div class="amt">' + num(t.amountSar.toFixed(2)) + ' ' + l.sar + '</div>' +
        (hot ? '<div class="hotlbl">' + l.disputed + '</div>' : "") + '</div></div>';
    }).join("");
    $("#phoneBody").innerHTML = '<div class="meta" style="margin-block-end:.5rem">' + l.statementMeta + '</div>' + l.probHtml + rows + '<div class="hint">' + l.hint + '</div>';
  }

  /* ---------- المهلة + التقويم ---------- */
  function renderDeadline() {
    var l = L(), r = compute(), st = r.countdown.status;
    var dn = function (ds) { return l.dow[E.util.dow(ds)]; };
    var badge = st === "overdue" ? '<span class="badge warn">' + l.overdue + "</span>"
      : st === "due-today" ? '<span class="badge warn">' + l.dueToday + "</span>"
      : '<span class="badge good">' + l.within(r.countdown.remainingWorkingDays) + "</span>";
    var nwd = E.util.dow(r.naive.date);
    var naiveHol = r.naive.holiday ? l.meetsHol(holName(r.naive.holiday)) : ((nwd === 5 || nwd === 6) ? l.meetsWeekend : "");
    var cite = en() ? D.samaRules[scn().ruleType].citationEn : D.samaRules[scn().ruleType].citationAr;
    $("#deadlineCard").innerHTML =
      '<div class="card-head"><h2 class="h2">' + l.dlTitle + ' <span class="sub">' + l.dlSub + '</span></h2>' + badge + "</div>" +
      '<div class="dl-grid">' +
        '<div class="dl-box dl-correct"><div class="lbl">' + l.correctLbl + '</div><div class="date">' + num(r.computedDeadline) + '</div><div class="note">' + dn(r.computedDeadline) + " · " + r.workingDays + " " + l.wd + '</div></div>' +
        '<div class="dl-box dl-semi"><div class="lbl">' + l.semiLbl + '</div><div class="date">' + num(r.semiNaive.date) + '</div><div class="note">' + dn(r.semiNaive.date) + l.semiNote + '</div></div>' +
        '<div class="dl-box dl-naive"><div class="lbl">' + l.naiveLbl + '</div><div class="date">' + num(r.naive.date) + '</div><div class="note">' + dn(r.naive.date) + naiveHol + '</div></div>' +
      "</div>" + renderCalendar(r) +
      '<div class="cite">' + cite + '</div><div class="cite">' + l.citeNote + '</div>';
  }

  function renderCalendar(r) {
    var l = L(), start = r.filedDate, end = r.computedDeadline > r.naive.date ? r.computedDeadline : r.naive.date;
    var days = [], cursor = start, guard = 0;
    while (guard++ < 40) { days.push(cursor); if (cursor === end) { days.push(addDays(cursor, 1)); break; } cursor = addDays(cursor, 1); }
    var counted = 0;
    var cells = days.map(function (ds) {
      var wd = E.util.dow(ds), weekend = (wd === 5 || wd === 6), hol = E.util.holidayOf(ds, D.holidays);
      var filed = ds === r.filedDate, dl = ds === r.computedDeadline, naive = ds === r.naive.date;
      var label = "", cls = "cal-cell";
      if (!filed && !weekend && !hol) { counted++; label = l.calWork(counted); }
      if (filed) { cls += " filed"; label = l.calFiling; }
      else if (weekend) { cls += " weekend"; label = l.dowShort[wd]; }
      else if (hol) { cls += " holiday"; label = holName(hol); }
      if (dl) cls += " deadline"; if (naive) cls += " naive";
      var dd = new Date(ds + "T00:00:00Z");
      var mk = dl ? '<div class="mk">' + l.markDeadline + "</div>" : naive ? '<div class="mk">' + l.markErr + "</div>" : "";
      return '<div class="' + cls + '"><div class="dw">' + l.dowShort[wd] + '</div><div class="dn num">' + pad(dd.getUTCDate()) + "/" + pad(dd.getUTCMonth() + 1) + '</div><div class="cl">' + label + "</div>" + mk + "</div>";
    }).join("");
    return '<div class="cal scrollthin"><div class="cal-row">' + cells + "</div></div>";
  }
  function addDays(ds, n) { var d = new Date(ds + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

  /* ---------- تشغيل الوكيل ---------- */
  function play(instant) {
    var l = L(); state.authorized = false; state._stopped = false; state.audit = E.createAuditLog(); compute();
    var s = scn(), raw = s.intelligence.rawJson;
    var sumAr = s.txnIds.map(txnById).map(function (t) { return (en() ? t.merchantEn : t.merchantAr) + " · " + t.amountSar.toFixed(2) + " " + l.sar; }).join(l.sep);
    var val = E.validateIntelligence(raw, D.transactions, D.allowedClassifications, scn().ruleType);
    $("#phoneBody").innerHTML = '<div class="meta" style="margin-block-end:.5rem">' + l.handlingNow + ' <b style="color:var(--ink)">' + scnLabel() + '</b></div><div id="stream" class="stream"></div>';
    $("#letterCard").hidden = true;

    var queue = [
      { actor: "CUSTOMER", action: l.actReceived, body: l.bReceived(sumAr) },
      { actor: "AI", action: l.actClassify, body: l.bClassify(clsName(raw.classification), Math.round(raw.confidence * 100)), tag: l.tagPrompt },
      { actor: "DETERMINISTIC", action: l.actVerify, body: val.ok ? l.bVerifyOk : l.bVerifyFail(val.fallbackAr) },
      { actor: "DETERMINISTIC", action: l.actEvidence, body: l.bEvidence(num(raw.evidenceIds.join(l.sep))) },
      { actor: "AI", action: l.actDraft, body: l.bDraft, onShow: showLetter },
      { actor: "HUMAN_GATE", action: l.actGate, body: l.bGate, gate: true },
    ];

    window.__kafeetAuthorize = function (inst) {
      if (state.authorized || state._stopped) return; state.authorized = true;
      var l2 = L(), g = $("#gateBtnWrap"); if (g) g.innerHTML = '<span class="gate-done">' + l2.gateDone + "</span>";
      var ref = genRef(), r = state.computed, base = queue.length;
      var hols = [];
      for (var z = 0; z < r.excluded.length; z++) { var ex = r.excluded[z], wd = E.util.dow(ex.date); if (wd !== 5 && wd !== 6) { var h = E.util.holidayOf(ex.date, D.holidays); var nm = h ? holName(h) : ex.reasonAr; if (hols.indexOf(nm) === -1) hols.push(nm); } }
      var exclText = l2.excWeekends + (hols.length ? l2.andWord + hols.join(l2.andWord) : "");
      var post = [
        { actor: "DETERMINISTIC", action: l2.actFile, body: l2.bFiled(num(ref)) },
        { actor: "DETERMINISTIC", action: l2.actDeadline, body: l2.bDeadline(num(r.computedDeadline), r.workingDays, exclText) },
        { actor: "DETERMINISTIC", action: r.countdown.status === "overdue" ? l2.actEscalate : l2.actTrack,
          body: r.countdown.status === "overdue" ? l2.bEscalate : l2.bTrack(r.countdown.remainingWorkingDays) },
      ];
      if (inst) { post.forEach(function (ev, k) { addAudit(ev, base + k); appendStep(ev, base + k); }); return; }
      var j = 0;
      (function run() { if (j >= post.length) return; addAudit(post[j], base + j); appendStep(post[j], base + j); j++; setTimeout(run, 640); })();
    };

    window.__kafeetStop = function () {
      if (state.authorized || state._stopped) return; state._stopped = true;
      var l2 = L(), g = $("#gateBtnWrap"); if (g) g.innerHTML = '<span class="gate-done">' + l2.gateStopped + "</span>";
      var ev = { actor: "CUSTOMER", action: l2.actStopped, body: l2.bStopped };
      addAudit(ev, queue.length); appendStep(ev, queue.length);
    };

    if (instant) { queue.forEach(function (ev, i) { addAudit(ev, i); appendStep(ev, i); if (ev.onShow) ev.onShow(); }); window.__kafeetAuthorize(true); return; }
    var i = 0;
    (function runStep() { if (i >= queue.length) return; var ev = queue[i]; addAudit(ev, i); appendStep(ev, i); if (ev.onShow) ev.onShow(); if (ev.gate) return; i++; setTimeout(runStep, 640); })();
  }

  function addAudit(ev, i) { if (state.audit) state.audit.append(ev.actor, ev.action, { body: stripTags(ev.body) }, isoAt(i + 1)); }
  function stripTags(s) { return String(s).replace(/<[^>]+>/g, ""); }

  function appendStep(ev, i) {
    var l = L(), el = document.createElement("div");
    el.className = "step " + CLS[ev.actor];
    var gate = ev.gate ? '<div class="gate-actions" id="gateBtnWrap"><button class="ok" onclick="window.__kafeetAuthorize()">' + l.authorizeBtn + '</button><button class="stop" onclick="window.__kafeetStop()">' + l.stopBtn + "</button></div>" : "";
    el.innerHTML = '<div class="top"><span class="actor">' + actorLabel(ev.actor) + '</span><span class="ts num">' + clockAt(i + 1) + "</span></div>" +
      '<div class="body">' + ev.body + "</div>" + (ev.tag ? '<div class="tagline2">↳ ' + ev.tag + "</div>" : "") + gate;
    $("#stream").appendChild(el);
    var pb = $("#phoneBody"); if (pb) pb.scrollTo({ top: pb.scrollHeight, behavior: "smooth" });
  }

  /* ---------- الخطاب (يبقى عربياً) + ملخّص إنجليزي ---------- */
  function showLetter() {
    var l = L(), s = scn(), raw = s.intelligence.rawJson, c = $("#letterCard"); c.hidden = false;
    var gist = en() ? '<div style="font-family:var(--font-ui);font-size:.84rem;color:var(--muted);margin-block-end:.7rem;line-height:1.6">' + l.gistPrefix + s.gistEn + "</div>" : "";
    var shariah = en() ? s.shariahCheckEn : s.shariahCheckAr;
    c.innerHTML = '<div class="card-head"><h2 class="h2">' + l.letterTitle + '</h2><span class="badge ai">' + l.letterBadge + "</span></div>" +
      gist + '<div class="letter" dir="rtl">' + escapeHtml(raw.arabicObjectionDraft) + "</div>" +
      '<div class="shariah"><b>' + l.shariahLabel + "</b> — " + shariah + "</div>";
  }
  function escapeHtml(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* ---------- وضع الرقيب ---------- */
  var REG_CSS = '<style>.reg-ctrls{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}.reg-btn{font:inherit;font-size:13px;font-weight:600;padding:7px 14px;border-radius:10px;border:1px solid var(--line,#E7E1D6);background:#fff;color:var(--ink,#1E2A47);cursor:pointer}.reg-btn.ok{background:#E9F6EF;border-color:#BFE3CF;color:#01BA6C}.reg-btn.warn{background:#FBEEEA;border-color:#E6C9BF;color:#E23B33}.reg-table td.mh{font-weight:700}.reg-broken td{background:#FBEAE7;color:#C0392B}.reg-broken td.mh{text-decoration:line-through}.reg-why{font-size:14px;line-height:1.75;color:#5A5560;background:#F0ECE3;padding:13px 16px;border-radius:13px;margin:10px 0}.reg-why b{color:#1E2A47}.reg-verdict{font-size:14.5px;line-height:1.8;padding:14px 16px;border-radius:13px;margin:10px 0}.reg-verdict.ok{background:#E9F6EF;border:1px solid #BFE3CF;color:#1d6b45}.reg-verdict.bad{background:#FBE7E3;border:1px solid #E6B0A5;color:#B0291B}.reg-verdict b{font-size:15.5px}.reg-table td.bayan{font-size:12px;color:#5A5560}</style>';

  function toggleRegulator() {
    var card = $("#regulatorCard");
    if (!state.audit || !state.audit.events.length) { card.hidden = false; card.innerHTML = '<div class="meta">' + L().regEmpty + "</div>"; return; }
    if (!card.hidden && !state._regForce) { card.hidden = true; return; }
    state._regForce = false; card.hidden = false; renderRegulator();
  }

  function renderRegulator() {
    var l = L(), card = $("#regulatorCard"), stored = state.audit.events, rep = state.audit.replay();
    var firstBroken = -1;
    for (var i = 0; i < stored.length; i++) { if (rep.events[i].hash !== stored[i].hash) { firstBroken = i; break; } }
    var ok = firstBroken === -1;
    var rows = stored.map(function (e, i) {
      var broke = !ok && i >= firstBroken, rh = rep.events[i].hash, match = rh === e.hash;
      var bod = (e.payload && e.payload.body) ? String(e.payload.body) : "";
      if (bod.length > 44) bod = bod.slice(0, 44) + "…";
      return '<tr class="' + (broke ? "reg-broken" : "") + '"><td class="seq num">' + pad(e.seq) +
        '</td><td>' + e.action +
        '</td><td class="bayan">' + bod +
        '</td><td class="h num">' + e.hash.slice(0, 8) + '…' +
        '</td><td class="num" style="font-weight:700;color:' + (match ? "#01BA6C" : "#E23B33") + '">' + (match ? l.stMatch : l.stChanged) + "</td></tr>";
    }).join("");
    var badge = ok ? '<span class="badge good">' + l.intactBadge + "</span>" : '<span class="badge warn">' + l.brokenBadge(stored[firstBroken].seq) + "</span>";
    card.innerHTML = REG_CSS +
      '<div class="card-head"><h2 class="h2">' + l.liveAudit + "</h2>" + badge + "</div>" +
      '<div class="reg-why">' + l.regWhy + "</div>" +
      '<div class="reg-ctrls"><button class="reg-btn ok" onclick="window.__kafeetVerify()">' + l.btnVerify +
      '</button><button class="reg-btn warn" onclick="window.__kafeetTamper()">' + l.btnTamper +
      '</button><button class="reg-btn" onclick="window.__kafeetResetLog()">' + l.btnReset + "</button></div>" +
      '<div class="reg-verdict ' + (ok ? "ok" : "bad") + '">' + (ok ? l.verdictOk : l.verdictBad(stored[firstBroken].seq, stored[firstBroken].action)) + "</div>" +
      '<div class="cal scrollthin"><table class="reg-table"><thead><tr><th>' + l.rhSeq + "</th><th>" + l.rhAction + "</th><th>" + l.rhData + "</th><th>" + l.rhSeal + "</th><th>" + l.rhStatus + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<div class="cite">' + l.regNote + "</div>";
  }

  window.__kafeetVerify = function () { renderRegulator(); };
  window.__kafeetTamper = function () {
    var ev = state.audit && state.audit.events; if (!ev || !ev.length) return;
    var idx = -1; for (var i = 0; i < ev.length; i++) { if (ev[i].action === L().actFile) { idx = i; break; } }
    if (idx < 0) idx = Math.min(2, ev.length - 1);
    if (!ev[idx]._orig) ev[idx]._orig = ev[idx].payload;
    ev[idx].payload = Object.assign({}, ev[idx]._orig, { body: "⟪مبلغٌ مُعدَّل⟫ " + String((ev[idx]._orig || {}).body || "") });
    state._tamperedSeq = ev[idx].seq; renderRegulator();
  };
  window.__kafeetResetLog = function () {
    var ev = state.audit && state.audit.events; if (ev) ev.forEach(function (e) { if (e._orig) { e.payload = e._orig; delete e._orig; } });
    state._tamperedSeq = null; renderRegulator();
  };

  /* ---------- الترويسة ثنائية اللغة ---------- */
  function applyChrome() {
    var l = L();
    document.documentElement.lang = state.lang;
    document.documentElement.dir = l.dir;
    $("#langBtn").textContent = l.langBtn;
    $("#tagEl").textContent = l.tagline;
    $("#pillSim").textContent = l.pillSim;
    $("#assumedTodayLbl").textContent = l.assumedToday;
    $("#bankEl").textContent = l.bank;
    $("#playBtn").textContent = l.runAgent;
    $("#regBtn").textContent = l.regulatorView;
    $("#filedLbl").textContent = l.filedLabel;
    $("#filedHint").textContent = l.filedHint;
    $("#honesty").innerHTML = l.honestyHtml;
    $("#hookEl").innerHTML = l.hookHtml;
    $("#scopeCard").innerHTML = l.scopeHtml;
    var segs = $("#scenarioSeg").querySelectorAll("button");
    segs[0].textContent = (en() ? D.scenarios.A_DUPLICATE_CHARGE.labelEn : D.scenarios.A_DUPLICATE_CHARGE.labelAr) + l.segDays(5);
    segs[1].textContent = (en() ? D.scenarios.B_UNAUTHORIZED_CARD.labelEn : D.scenarios.B_UNAUTHORIZED_CARD.labelAr) + l.segDays(7);
  }

  /* ---------- التهيئة ---------- */
  function init() {
    state.filedAt = scn().filedAt;
    $("#todayPill").textContent = D.meta.assumedNow.slice(0, 10);
    $("#acctRef").textContent = D.account.accountRef;
    $("#filedInput").value = state.filedAt.slice(0, 10);

    $("#scenarioSeg").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-key]"); if (!b) return;
      [].forEach.call(this.querySelectorAll("button"), function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      state.key = b.getAttribute("data-key"); state.filedAt = scn().filedAt;
      $("#filedInput").value = state.filedAt.slice(0, 10);
      $("#letterCard").hidden = true; $("#regulatorCard").hidden = true; $("#regBtn").classList.remove("lit");
      renderStatement(); renderDeadline();
    });
    $("#playBtn").addEventListener("click", function () { play(); $("#regBtn").classList.add("lit"); });
    $("#regBtn").addEventListener("click", toggleRegulator);
    $("#filedInput").addEventListener("change", function () {
      var v = this.value, y = parseInt((v || "").slice(0, 4), 10);
      if (!v || isNaN(y) || y < 2020 || y > 2030) { this.value = state.filedAt.slice(0, 10); return; } // حارس: تاريخٌ فارغ/خارج النطاق لا يحطّم النموذج
      state.filedAt = v + "T11:30:00+03:00"; renderDeadline();
    });
    $("#langBtn").addEventListener("click", function () {
      state.lang = en() ? "ar" : "en";
      applyChrome();
      $("#letterCard").hidden = true; $("#regulatorCard").hidden = true; $("#regBtn").classList.remove("lit");
      renderStatement(); renderDeadline();
    });

    applyChrome();
    renderStatement(); renderDeadline();

    var sp = new URLSearchParams(location.search), shot = sp.get("shot");
    if (sp.get("lang") === "en") { state.lang = "en"; applyChrome(); renderStatement(); renderDeadline(); }
    if (sp.get("bare") === "1") { var c = document.querySelector(".controls"); if (c) c.style.display = "none"; }
    if (shot === "run" || shot === "replay") { play(true); if (shot === "replay") toggleRegulator(); }
    if (shot === "gate") { play(false); }
    if (shot === "regulator" || shot === "tamper") {
      play(true); state._regForce = true; toggleRegulator(); if (shot === "tamper") window.__kafeetTamper();
      if (sp.get("only") === "reg") {
        var ph = document.querySelector(".phone"); if (ph) ph.style.display = "none";
        var dc = $("#deadlineCard"); if (dc) dc.style.display = "none";
        var lc = $("#letterCard"); if (lc) lc.style.display = "none";
        var g = document.querySelector("main.grid"); if (g) g.style.gridTemplateColumns = "1fr";
      }
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
