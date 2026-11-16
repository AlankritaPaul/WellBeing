// Reminder and Notification Localization System
// Fully dynamic, multi-language support for all smart reminders, dose alerts, lockscreen actions, and night summaries

export interface ReminderLocalization {
  morningTitle: (name: string) => string;
  morningHeader: string;
  morningFooter: string;
  beforeBreakfast: string;
  afterBreakfast: string;
  beforeLunch: string;
  afterLunch: string;
  beforeDinner: string;
  afterDinner: string;
  beforeFoodGeneral: string;
  afterFoodGeneral: string;
  singleDosePrompt: (name: string, medName: string, dosage: string, timing: string) => string;
  actionTaken: string;
  actionDelay15m: string;
  actionSkip: string;
  courseCompletedTitle: (name: string) => string;
  courseCompletedBody: (name: string, duration: string, medName: string, dosage: string) => string;
  nightSummaryTitle: (name: string) => string;
  nightSummaryBody: (taken: number, total: number, percent: number, delayed: number, skipped: number) => string;

  // In-app alert modal specifics
  advanceNoticeBadge: string;
  takeBeforeFoodBadge: string;
  takeAfterFoodBadge: string;
  currentMedicineLabel: string;
  moreMedsWaiting: (count: number) => string;
  skipPrompt: (medName: string) => string;
  skipBack: string;
  skipReasonFasting: string;
  skipReasonUpset: string;
  skipReasonForgot: string;
  skipReasonDoctorHold: string;
  customReasonPlaceholder: string;
  loggedSuccess: (medName: string) => string;
  delayedSuccess: (medName: string) => string;
}

export const REMINDER_LOCALIZATIONS: Record<string, ReminderLocalization> = {
  // 1. Bengali (বাংলা)
  bn: {
    morningTitle: (name: string) => `☀️ শুভ সকাল, ${name}!`,
    morningHeader: "আজকের ওষুধের তালিকা:",
    morningFooter: "অনুগ্রহ করে আপনার ওষুধ সাথে রাখুন।",
    beforeBreakfast: "প্রাতঃরাশের আগে",
    afterBreakfast: "প্রাতঃরাশের পরে",
    beforeLunch: "দুপুরের খাবারের আগে",
    afterLunch: "দুপুরের খাবারের পরে",
    beforeDinner: "রাতের খাবারের আগে",
    afterDinner: "রাতের খাবারের পরে",
    beforeFoodGeneral: "খাওয়ার আগে",
    afterFoodGeneral: "খাওয়ার পরে",
    singleDosePrompt: (name: string, med: string, dose: string, timing: string) =>
      `${name}, অনুগ্রহ করে ${med} (${dose}) ${timing} খান।`,
    actionTaken: "✓ নেওয়া হয়েছে",
    actionDelay15m: "⏱ ১৫ মিনিট পরে",
    actionSkip: "✕ বাদ দিন",
    courseCompletedTitle: (name: string) => `🎉 ওষুধ কোর্স সম্পন্ন - ${name}!`,
    courseCompletedBody: (name: string, duration: string, med: string, dose: string) =>
      `${name}, আপনার ${duration} মেয়াদের ${med} (${dose}) ওষুধ কোর্স সফলভাবে সম্পন্ন হয়েছে! শুভকামনা।`,
    nightSummaryTitle: (name: string) => `🌙 ${name}-এর দৈনিক ওষুধের সারাংশ`,
    nightSummaryBody: (taken: number, total: number, percent: number, delayed: number, skipped: number) => {
      let detail = `${total}-এর মধ্যে ${taken} ওষুধ সময়মতো নেওয়া হয়েছে (${percent}%)`;
      if (delayed > 0) detail += `, ${delayed}টি দেরিতে নেওয়া হয়েছে`;
      if (skipped > 0) detail += `, ${skipped}টি বাদ দেওয়া হয়েছে`;
      return `${detail}।\nপরবর্তী ডাক্তার দেখানোর জন্য সমস্ত তথ্য সুরক্ষিতভাবে রিপোর্টে সংরক্ষিত রয়েছে!`;
    },
    advanceNoticeBadge: "⏰ ৫-১০ মিনিট আগের রিমাইন্ডার",
    takeBeforeFoodBadge: "খাওয়ার আগে খান",
    takeAfterFoodBadge: "খাওয়ার পরে খান",
    currentMedicineLabel: "বর্তমান ওষুধ:",
    moreMedsWaiting: (count: number) => `+ আরও ${count}টি ওষুধ অপেক্ষমান`,
    skipPrompt: (med: string) => `কেন আপনি ${med} বাদ দিচ্ছেন? (ডাক্তারের জন্য সংরক্ষিত):`,
    skipBack: "ফিরে যান",
    skipReasonFasting: "মেডিকেল উপবাস / টেস্টের প্রস্তুতি",
    skipReasonUpset: "পেট খারাপ / পার্শ্বপ্রতিক্রিয়া",
    skipReasonForgot: "ওষুধের পাতা সাথে নেই",
    skipReasonDoctorHold: "ডাক্তার বন্ধ রাখতে বলেছেন",
    customReasonPlaceholder: "অন্যান্য কারণ লিখুন...",
    loggedSuccess: (med: string) => `✓ ${med} নেওয়া হয়েছে হিসেবে সংরক্ষিত! স্কোর আপডেট হয়েছে।`,
    delayedSuccess: (med: string) => `⏱ ${med} ১৫ মিনিটের জন্য পেছানো হয়েছে।`,
  },

  // 2. Hindi (हिन्दी)
  hi: {
    morningTitle: (name: string) => `☀️ शुभ प्रभात, ${name}!`,
    morningHeader: "आज की दवाओं की सूची:",
    morningFooter: "कृपया अपनी दवाइयाँ अपने साथ रखें।",
    beforeBreakfast: "नाश्ते से पहले",
    afterBreakfast: "नाश्ते के बाद",
    beforeLunch: "दोपहर के खाने से पहले",
    afterLunch: "दोपहर के खाने के बाद",
    beforeDinner: "रात के खाने से पहले",
    afterDinner: "रात के खाने के बाद",
    beforeFoodGeneral: "खाने से पहले",
    afterFoodGeneral: "खाने के बाद",
    singleDosePrompt: (name: string, med: string, dose: string, timing: string) =>
      `${name}, कृपया ${med} (${dose}) ${timing} लें।`,
    actionTaken: "✓ ले ली",
    actionDelay15m: "⏱ 15 मिनट बाद",
    actionSkip: "✕ छोड़ें",
    courseCompletedTitle: (name: string) => `🎉 दवा का कोर्स पूरा - ${name}!`,
    courseCompletedBody: (name: string, duration: string, med: string, dose: string) =>
      `${name}, आपकी ${duration} की ${med} (${dose}) दवा का कोर्स सफलतापूर्वक पूरा हो गया! बहुत अच्छे।`,
    nightSummaryTitle: (name: string) => `🌙 ${name} का दैनिक दवा सारांश`,
    nightSummaryBody: (taken: number, total: number, percent: number, delayed: number, skipped: number) => {
      let detail = `${total} में से ${taken} दवाएं समय पर ली गईं (${percent}%)`;
      if (delayed > 0) detail += `, ${delayed} विलंबित`;
      if (skipped > 0) detail += `, ${skipped} छूटीं`;
      return `${detail}।\nअगली डॉक्टर विजिट के लिए सभी विवरण सुरक्षित रूप से रिपोर्ट में दर्ज हैं!`;
    },
    advanceNoticeBadge: "⏰ 5-10 मिनट पहले सूचना",
    takeBeforeFoodBadge: "खाने से पहले लें",
    takeAfterFoodBadge: "खाने के बाद लें",
    currentMedicineLabel: "वर्तमान दवा:",
    moreMedsWaiting: (count: number) => `+ ${count} और दवाएं प्रतीक्षा में हैं`,
    skipPrompt: (med: string) => `आप ${med} क्यों छोड़ रहे हैं? (डॉक्टर के लिए रिकॉर्ड):`,
    skipBack: "वापस",
    skipReasonFasting: "चिकित्सीय उपवास / टेस्ट की तैयारी",
    skipReasonUpset: "पेट खराब / उल्टी / गैस",
    skipReasonForgot: "दवा की स्ट्रिप घर पर छूट गई",
    skipReasonDoctorHold: "डॉक्टर ने रोकने की सलाह दी",
    customReasonPlaceholder: "या कोई अन्य कारण लिखें...",
    loggedSuccess: (med: string) => `✓ ${med} ले ली गई दर्ज की गई! स्कोर अपडेट हुआ।`,
    delayedSuccess: (med: string) => `⏱ ${med} को 15 मिनट के लिए स्थगित किया गया।`,
  },

  // 3. Assamese (অসমীয়া)
  as: {
    morningTitle: (name: string) => `☀️ সুপ্ৰভাত, ${name}!`,
    morningHeader: "আজিৰ ঔষধৰ তালিকা:",
    morningFooter: "অনুগ্ৰহ কৰি আপোনাৰ ঔষধবোৰ লগত ৰাখক।",
    beforeBreakfast: "পুৱাৰ জলপানৰ আগত",
    afterBreakfast: "পুৱাৰ জলপানৰ পিছত",
    beforeLunch: "দুপৰীয়াৰ সাজৰ আগত",
    afterLunch: "দুপৰীয়াৰ সাজৰ পিছত",
    beforeDinner: "নিশাৰ আহাৰৰ আগত",
    afterDinner: "নিশাৰ আহাৰৰ পিছত",
    beforeFoodGeneral: "খোৱাৰ আগত",
    afterFoodGeneral: "খোৱাৰ পিছত",
    singleDosePrompt: (name: string, med: string, dose: string, timing: string) =>
      `${name}, অনুগ্ৰহ কৰি ${med} (${dose}) ${timing} খাওক।`,
    actionTaken: "✓ খোৱা হ'ল",
    actionDelay15m: "⏱ ১৫ মিনিট পিছত",
    actionSkip: "✕ বাদ দিয়ক",
    courseCompletedTitle: (name: string) => `🎉 ঔষধৰ কোৰ্ছ সম্পূৰ্ণ - ${name}!`,
    courseCompletedBody: (name: string, duration: string, med: string, dose: string) =>
      `${name}, আপোনাৰ ${duration} দিনৰ ${med} (${dose}) ঔষধৰ কোৰ্ছ সফলভাৱে সম্পূৰ্ণ হ'ল!`,
    nightSummaryTitle: (name: string) => `🌙 ${name}-ৰ দৈনিক ঔষধৰ সাৰাংশ`,
    nightSummaryBody: (taken: number, total: number, percent: number) =>
      `${total}-ৰ ভিতৰত ${taken} ঔষধ সময়মতে লোৱা হ'ল (${percent}%)। তথ্য সংৰক্ষিত কৰা হৈছে!`,
    advanceNoticeBadge: "⏰ ৫-১০ মিনিট আগৰ সতৰ্কবাৰ্তা",
    takeBeforeFoodBadge: "খোৱাৰ আগত খাওক",
    takeAfterFoodBadge: "খোৱাৰ পিছত খাওক",
    currentMedicineLabel: "বৰ্তমান ঔষধ:",
    moreMedsWaiting: (count: number) => `+ আৰু ${count}টা ঔষধ বাকী আছে`,
    skipPrompt: (med: string) => `আপুনি কিয় ${med} বাদ দিছে?`,
    skipBack: "উভতি যাওক",
    skipReasonFasting: "উপবাস / পৰীক্ষাৰ প্ৰস্তুতি",
    skipReasonUpset: "পেটৰ সমস্যা",
    skipReasonForgot: "ঔষধ ঘৰত এৰি আহিছো",
    skipReasonDoctorHold: "চিকিৎসকে বন্ধ ৰাখিবলৈ কৈছে",
    customReasonPlaceholder: "কাৰণ লিখক...",
    loggedSuccess: (med: string) => `✓ ${med} খোৱা হ'ল বুলি সংৰক্ষণ কৰা হ'ল!`,
    delayedSuccess: (med: string) => `⏱ ${med} ১৫ মিনিট পিছুৱাই দিয়া হ'ল।`,
  },

  // 4. Default / English (English)
  en: {
    morningTitle: (name: string) => `☀️ Good morning, ${name}!`,
    morningHeader: "Today's medicine list:",
    morningFooter: "Please keep your medicines with you.",
    beforeBreakfast: "before breakfast",
    afterBreakfast: "after breakfast",
    beforeLunch: "before lunch",
    afterLunch: "after lunch",
    beforeDinner: "before dinner",
    afterDinner: "after dinner",
    beforeFoodGeneral: "before food",
    afterFoodGeneral: "after food",
    singleDosePrompt: (name: string, med: string, dose: string, timing: string) =>
      `${name}, please take ${med} (${dose}) ${timing}.`,
    actionTaken: "✓ Taken",
    actionDelay15m: "⏱ Delay (15m)",
    actionSkip: "✕ Skip",
    courseCompletedTitle: (name: string) => `🎉 Course Completed for ${name}!`,
    courseCompletedBody: (name: string, duration: string, med: string, dose: string) =>
      `${name}, your ${duration} course of ${med} (${dose}) is now successfully completed! Well done.`,
    nightSummaryTitle: (name: string) => `🌙 Daily Medicine Summary for ${name}`,
    nightSummaryBody: (taken: number, total: number, percent: number, delayed: number, skipped: number) => {
      let detail = `${taken} of ${total} taken on time (${percent}%)`;
      if (delayed > 0) detail += `, ${delayed} delayed`;
      if (skipped > 0) detail += `, ${skipped} skipped`;
      return `${detail}.\nAll details are safely saved in your report to show your doctor on your next checkup!`;
    },
    advanceNoticeBadge: "⏰ 5-10 Min Advance Reminder",
    takeBeforeFoodBadge: "Take Before Food",
    takeAfterFoodBadge: "Take After Food",
    currentMedicineLabel: "Current Medicine:",
    moreMedsWaiting: (count: number) => `+ ${count} more medicine waiting after this`,
    skipPrompt: (med: string) => `Why are you skipping ${med}? (Recorded for Doctor):`,
    skipBack: "Back",
    skipReasonFasting: "Medical Fasting / Test Prep",
    skipReasonUpset: "Stomach Upset / Side Effect",
    skipReasonForgot: "Forgot Medicine Strip at Home",
    skipReasonDoctorHold: "Doctor Advised to Hold",
    customReasonPlaceholder: "Or type custom reason...",
    loggedSuccess: (med: string) => `✓ ${med} logged as TAKEN! Adherence score updated.`,
    delayedSuccess: (med: string) => `⏱ ${med} delayed by 15 minutes.`,
  },
};

export function getReminderLocalization(langCode?: string): ReminderLocalization {
  const code = (langCode || "en").toLowerCase().trim();
  if (code in REMINDER_LOCALIZATIONS) {
    return REMINDER_LOCALIZATIONS[code];
  }
  // Try 2-letter prefix match (e.g. bn-IN -> bn)
  const shortCode = code.split("-")[0];
  if (shortCode in REMINDER_LOCALIZATIONS) {
    return REMINDER_LOCALIZATIONS[shortCode];
  }
  return REMINDER_LOCALIZATIONS.en;
}
