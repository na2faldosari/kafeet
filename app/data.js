/* ============================================================
   كَفيت — طبقة البيانات التركيبية + الذكاء المُولّد مسبقاً
   - كل البيانات تركيبية (synthetic) — لا بيانات عملاء حقيقية.
   - مخرجات الذكاء (التصنيف + خطاب الاعتراض) مُولّدة بـ Claude مسبقاً
     ومُضمّنة كـ fixture موسومة (لا نداء وقت تشغيل في نموذج الـ30%).
   - الساعة و«اليوم» محقونان، والمنطقة مثبّتة على Asia/Riyadh.
   ============================================================ */
window.KAFEET_DATA = {
  meta: {
    timezone: "Asia/Riyadh",
    // «اليوم الافتراضي» المحقون — خميس حقيقي قبل عطلة رسمية (اليوم الوطني الثلاثاء 23/09)
    assumedNow: "2025-09-18T12:05:00+03:00",
    currency: "SAR",
    synthetic: true,
  },

  account: {
    holderAr: "سارة (شخصية تمثيلية مبنية على أنماط مراجعات عامة)",
    productAr: "حساب جاري + بطاقة مدى — مصرف الإنماء (محاكاة)",
    accountRef: "SA•• •••• •••• •••• 4417",
  },

  // العطل الرسمية (مصدر: تقويم أم القرى/الإجازات الرسمية) — بيانات قابلة للتمديد
  holidays: [
    { date: "2025-09-23", nameAr: "اليوم الوطني السعودي", nameEn: "Saudi National Day", source: "UmmAlQura" },
  ],

  // كشف حساب تركيبي بصيغ واقعية (تاجر عربي/إنجليزي، مرجع مدى، ريال، طابع زمني)
  transactions: [
    { txnId: "TXN-90412", merchantAr: "نون", merchantEn: "NOON",        madaRef: "MADA-7741-0091", amountSar: 349.00, timestamp: "2025-09-17T14:22:00+03:00", type: "purchase" },
    { txnId: "TXN-90413", merchantAr: "نون", merchantEn: "NOON",        madaRef: "MADA-7741-0092", amountSar: 349.00, timestamp: "2025-09-17T14:23:11+03:00", type: "purchase" }, // ← الخصم المكرر
    { txnId: "TXN-90377", merchantAr: "هنقرستيشن", merchantEn: "HUNGERSTATION", madaRef: "MADA-7741-0088", amountSar: 86.50, timestamp: "2025-09-17T20:05:00+03:00", type: "purchase" },
    { txnId: "TXN-90201", merchantAr: "متجر غير معروف", merchantEn: "GLOBAL-DIGITAL-LTD", madaRef: "MADA-7741-0071", amountSar: 1250.00, timestamp: "2025-09-16T03:41:00+03:00", type: "card_not_present" }, // ← عملية غير مصرّح بها
    { txnId: "TXN-90150", merchantAr: "البنده", merchantEn: "PANDA",     madaRef: "MADA-7741-0066", amountSar: 213.75, timestamp: "2025-09-15T18:30:00+03:00", type: "purchase" },
  ],

  /* ----------------------------------------------------------
     الذكاء المُولّد مسبقاً (FrozenIntelligenceFixture)
     لكل سيناريو: البرومبت الفعلي المُرسَل لـ Claude + ناتج JSON الخام.
     في الواجهة يمرّ هذا عبر ValidationLayer قبل تسليمه للطبقة الثابتة،
     وكل بطاقة ذكاء موسومة «مُولّد بـ Claude — استجابة مُسجّلة».
     ---------------------------------------------------------- */
  scenarios: {
    A_DUPLICATE_CHARGE: {
      labelAr: "خصم مكرر",
      labelEn: "Duplicate charge",
      gistEn: "Dispute of a duplicate 349 SAR charge at NOON; full refund requested within 5 working days.",
      ruleType: "A_5",                 // شكوى عامة — 5 أيام عمل
      filedAt: "2025-09-18T12:05:00+03:00",
      txnIds: ["TXN-90412", "TXN-90413"],
      intelligence: {
        source: "claude-pregenerated",
        prompt:
          "أنت محلّل نزاعات مصرفية. أدخِل كشف الحساب التركيبي ووصف الشكوى، " +
          "وأخرِج JSON صارماً فقط: {classification, evidenceIds[], confidence, samaRuleType, arabicObjectionDraft}. " +
          "صنّف النزاع، واذكر مُعرّفات المعاملات الداعمة من الكشف، واصُغ خطاب اعتراض رسمي بالعربية " +
          "يستشهد بمهلة البنك المركزي المناسبة. لا تخترع المهلة الزمنية — اترك حسابها للمحرّك الثابت.",
        rawJson: {
          classification: "DUPLICATE_CHARGE",
          evidenceIds: ["TXN-90412", "TXN-90413"],
          confidence: 0.97,
          samaRuleType: "A_5",
          arabicObjectionDraft:
            "إلى إدارة العناية بالعملاء في مصرف الإنماء\n" +
            "الموضوع: اعتراض على عملية خصمٍ مكرّرة\n\n" +
            "بالإشارة إلى الحساب رقم SA•• •••• •••• •••• 4417، تبيّن وجود عمليتي خصمٍ متطابقتين " +
            "لدى التاجر «نون» (NOON) بمبلغ 349.00 ريال لكلٍّ منهما، بتاريخ 17/09/2025، " +
            "تحت مرجعي العملية MADA-7741-0091 وMADA-7741-0092، وهما عن عملية شراءٍ واحدة. " +
            "نطلب ردّ المبلغ المكرّر وقدره 349.00 ريال إلى الحساب.\n\n" +
            "ووفقاً للائحة إنشاء إدارة العناية بالعملاء في البنوك الصادرة عن البنك المركزي السعودي (٢٠٢٣)، " +
            "يُعالَج هذا البلاغ خلال مدةٍ لا تتجاوز خمسة أيام عمل من تاريخ استلامه، " +
            "وللعميل بعد انقضاء هذه المهلة حقُّ التصعيد إلى «ساما تهتم». " +
            "نأمل اتخاذ اللازم وتزويدنا برقمٍ مرجعي للمتابعة.\n\n" +
            "وتفضّلوا بقبول التحية،",
        },
      },
      shariahCheckAr:
        "تحقّق شرعي: المبلغ محلّ النزاع مبلغ أصلٌ لعملية شراء، ولا تترتّب عليه فائدة؛ " +
        "وعند الردّ يُعاد المبلغ كاملاً دون اقتطاع رسوم، بما يوافق طبيعة المنتج الإسلامي. (إشارة موثّقة، ولا تُعدّ فتوى.)",
      shariahCheckEn:
        "Sharia check: the disputed amount is principal for a purchase and bears no interest; on reversal it is refunded in full with no fees deducted — consistent with an Islamic product. (Documented flag, not a fatwa.)",
    },

    B_UNAUTHORIZED_CARD: {
      labelAr: "عملية بطاقة غير مصرّح بها",
      labelEn: "Unauthorized card transaction",
      gistEn: "Report of an unauthorized 1,250 SAR card transaction; amount suspended and reversal requested within 7 working days.",
      ruleType: "B_7",                 // عكس خلال 7 أيام عمل + تعليق فوري
      filedAt: "2025-09-18T12:05:00+03:00",
      txnIds: ["TXN-90201"],
      intelligence: {
        source: "claude-pregenerated",
        prompt:
          "أنت محلّل نزاعات مصرفية. صنّف النزاع من الكشف ووصف الشكوى، وأخرِج JSON صارماً " +
          "{classification, evidenceIds[], confidence, samaRuleType, arabicObjectionDraft}. " +
          "اصُغ بلاغاً رسمياً بالعربية لعملية بطاقة غير مصرّح بها يطلب تعليق المبلغ فوراً وعكسه، " +
          "ويستشهد بالمادة النظامية. لا تحسب المهلة — المحرّك الثابت يتولّاها.",
        rawJson: {
          classification: "UNAUTHORIZED_CARD",
          evidenceIds: ["TXN-90201"],
          confidence: 0.93,
          samaRuleType: "B_7",
          arabicObjectionDraft:
            "إلى إدارة العناية بالعملاء في مصرف الإنماء\n" +
            "الموضوع: بلاغٌ عن عملية بطاقةٍ غير مصرّح بها\n\n" +
            "نُفيدكم بوجود عمليةٍ يُنكِرها صاحب الحساب لدى التاجر «GLOBAL-DIGITAL-LTD» " +
            "بمبلغ 1,250.00 ريال بتاريخ 16/09/2025، مرجع العملية MADA-7741-0071، " +
            "ولم تصدر عنه ولا عن أيّ مفوّض. " +
            "نطلب تعليق مبلغ العملية المتنازَع عليها فوراً، ومعالجة البلاغ وعكس المبلغ " +
            "خلال مدةٍ لا تتجاوز سبعة أيام عمل، وفقاً لمبادئ وقواعد حماية عملاء المؤسسات المالية " +
            "الصادرة عن البنك المركزي السعودي بشأن المعاملات غير المصرّح بها، مع اتخاذ التدابير الاحترازية المناسبة بشأن البطاقة.\n\n" +
            "ونأمل تزويدنا برقمٍ مرجعي للمتابعة.\n\n" +
            "وتفضّلوا بقبول التحية،",
        },
      },
      shariahCheckAr:
        "تحقّق شرعي: يُعلَّق المبلغ المتنازَع عليه فور البلاغ، فلا تُحتسب عليه فائدةٌ ولا رسوم تأخير " +
        "طوال فترة المعالجة، بما يحفظ توافق المسار مع أحكام المنتج الإسلامي. (إشارة موثّقة، ولا تُعدّ فتوى.)",
      shariahCheckEn:
        "Sharia check: the disputed amount is suspended on report, so no interest or late fees accrue during processing — keeping the path consistent with Islamic product rules. (Documented flag, not a fatwa.)",
    },
  },

  // قائمة تصنيفات النزاع المسموحة (لطبقة التحقق) — «2 مُثبَتان، N مُهيّأة»
  allowedClassifications: [
    { code: "DUPLICATE_CHARGE",  ar: "خصم مكرر",              en: "Duplicate charge",   ruleType: "A_5", status: "proven" },
    { code: "UNAUTHORIZED_CARD", ar: "بطاقة غير مصرّح بها",   en: "Unauthorized card",  ruleType: "B_7", status: "proven" },
    { code: "FAILED_TRANSFER",   ar: "تحويل عالق",             en: "Stuck transfer",     ruleType: "A_5", status: "configured" },
    { code: "WRONG_AMOUNT",      ar: "مبلغ خاطئ",              en: "Wrong amount",       ruleType: "A_5", status: "configured" },
    { code: "ATM_NO_CASH",       ar: "خصم صراف بلا صرف نقدي",  en: "ATM no-cash debit",  ruleType: "A_5", status: "configured" },
    { code: "SUBSCRIPTION",      ar: "اشتراك بعد الإلغاء",      en: "Post-cancel charge", ruleType: "A_5", status: "configured" },
  ],

  // قواعد ساما (بيانات قابلة للتهيئة بدل أرقام مدفونة في الكود)
  samaRules: {
    A_5: { workingDays: 5, citationAr: "لائحة إنشاء إدارة العناية بالعملاء في البنوك (٢٠٢٣)، البنك المركزي السعودي · وحدة معالجة الشكاوى: ٥ أيام عمل", citationEn: "Regulations for Establishing Customer Care Departments in Banks (2023) — Saudi Central Bank, Complaints Handling Unit: 5 working days" },
    B_7: { workingDays: 7, citationAr: "مبادئ وقواعد حماية عملاء المؤسسات المالية، البنك المركزي السعودي: تُعلَّق المعاملة غير المصرّح بها ويُعالَج البلاغ خلال مدةٍ لا تتجاوز سبعة أيام عمل (مهلة تشغيلية)", citationEn: "Financial Consumer Protection Principles — Saudi Central Bank: the unauthorized transaction is suspended and the report resolved within 7 working days (operational SLA)" },
  },
};
