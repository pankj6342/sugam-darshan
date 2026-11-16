"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./types";

export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>()(
  persist((set) => ({ lang: "hi", setLang: (lang) => set({ lang }) }), { name: "sd-lang" }),
);

/** Devotee-facing languages (BRD NFR-03): Hindi default; Gujarati and English optional. */
export const LANGS: { code: Lang; short: string; label: string }[] = [
  { code: "hi", short: "हिं", label: "हिंदी" },
  { code: "gu", short: "ગુ", label: "ગુજરાતી" },
  { code: "en", short: "EN", label: "English" },
];

type Entry = Record<Lang, string>;

const D = {
  mandal: { hi: "श्री सांवलिया सेठ मंदिर मंडल", gu: "શ્રી સાંવલિયા શેઠ મંદિર મંડળ", en: "Shri Sanwaliya Seth Mandir Mandal" },
  place: { hi: "मंडफिया, चित्तौड़गढ़ (राज.)", gu: "મંડફિયા, ચિત્તોડગઢ (રાજ.)", en: "Mandaphia, Chittorgarh (Raj.)" },
  jai: { hi: "🙏 जय श्री सांवलिया सेठ", gu: "🙏 જય શ્રી સાંવલિયા શેઠ", en: "🙏 Jai Shri Sanwaliya Seth" },
  sugam: { hi: "सुगम दर्शन", gu: "સુગમ દર્શન", en: "Sugam Darshan" },
  tagline: { hi: "निःशुल्क, व्यवस्थित और शांतिपूर्ण दर्शन", gu: "નિઃશુલ્ક, વ્યવસ્થિત અને શાંતિપૂર્ણ દર્શન", en: "Free, orderly and peaceful darshan" },
  bookCta: { hi: "निःशुल्क दर्शन पास बनाएँ", gu: "નિઃશુલ્ક દર્શન પાસ બનાવો", en: "Get a free darshan pass" },
  myPasses: { hi: "मेरे पास", gu: "મારા પાસ", en: "My passes" },
  crowdNow: { hi: "अभी भीड़", gu: "હાલ ભીડ", en: "Crowd now" },
  crowd_low: { hi: "कम", gu: "ઓછી", en: "Low" },
  crowd_medium: { hi: "सामान्य", gu: "સામાન્ય", en: "Moderate" },
  crowd_high: { hi: "अधिक", gu: "વધુ", en: "High" },
  unavailable: { hi: "जानकारी उपलब्ध नहीं", gu: "માહિતી ઉપલબ્ધ નથી", en: "Unavailable" },
  estimated: { hi: "अनुमानित", gu: "અંદાજિત", en: "estimated" },
  aarti: { hi: "आज के आरती / दर्शन समय", gu: "આજના આરતી / દર્શન સમય", en: "Today's Aarti / darshan timings" },
  aartiNote: { hi: "सांकेतिक समय — मंडल की सूचना ही अंतिम मानी जाएगी", gu: "સૂચક સમય — મંડળની સૂચના જ અંતિમ ગણાશે", en: "Indicative — Mandal notices are final" },
  howItWorks: { hi: "कैसे काम करता है", gu: "કેવી રીતે કામ કરે છે", en: "How it works" },
  how1: { hi: "दिन और समय चुनें", gu: "દિવસ અને સમય પસંદ કરો", en: "Choose day and time" },
  how2: { hi: "QR पास पाएँ — पूरी तरह निःशुल्क", gu: "QR પાસ મેળવો — સંપૂર્ણ નિઃશુલ્ક", en: "Get a QR pass — completely free" },
  how3: { hi: "रिपोर्टिंग समय पर सुगम दर्शन लेन पर पहुँचें", gu: "રિપોર્ટિંગ સમયે સુગમ દર્શન લેન પર પહોંચો", en: "Arrive at the Sugam Darshan lane at your reporting time" },
  noPhone: {
    hi: "स्मार्टफ़ोन नहीं है? मंदिर के सहायता केंद्र से काग़ज़ की पर्ची पर पास लें।",
    gu: "સ્માર્ટફોન નથી? મંદિરના સહાયતા કેન્દ્ર પરથી કાગળની પરચી પર પાસ મેળવો.",
    en: "No smartphone? Get a printed pass at the temple Sahayata Kendra.",
  },
  whatsappAlt: {
    hi: "WhatsApp पर भी बुक करें: \"जय श्री सांवलिया सेठ\" भेजें",
    gu: "WhatsApp પર પણ બુક કરો: \"જય શ્રી સાંવલિયા શેઠ\" મોકલો",
    en: "Also on WhatsApp: send \"Jai Shri Sanwaliya Seth\"",
  },
  generalAlways: {
    hi: "सामान्य कतार हमेशा की तरह खुली है — डिजिटल पास अनिवार्य नहीं है।",
    gu: "સામાન્ય કતાર હંમેશની જેમ ખુલ્લી છે — ડિજિટલ પાસ ફરજિયાત નથી.",
    en: "The general queue remains open as always — a digital pass is not mandatory.",
  },
  chooseDay: { hi: "दिन चुनें", gu: "દિવસ પસંદ કરો", en: "Choose a day" },
  chooseTime: { hi: "समय चुनें", gu: "સમય પસંદ કરો", en: "Choose a time" },
  people: { hi: "कितने लोग?", gu: "કેટલા લોકો?", en: "How many people?" },
  peopleHint: { hi: "बच्चों सहित कुल संख्या", gu: "બાળકો સહિત કુલ સંખ્યા", en: "Total including children" },
  details: { hi: "आपकी जानकारी", gu: "તમારી માહિતી", en: "Your details" },
  name: { hi: "मुख्य श्रद्धालु का नाम", gu: "મુખ્ય શ્રદ્ધાળુનું નામ", en: "Lead devotee's name" },
  mobile: { hi: "मोबाइल नंबर", gu: "મોબાઇલ નંબર", en: "Mobile number" },
  mobileWhy: {
    hi: "केवल पास और समय की सूचना के लिए। किसी और काम में उपयोग नहीं होगा।",
    gu: "ફક્ત પાસ અને સમયની સૂચના માટે. બીજા કોઈ કામમાં ઉપયોગ નહીં થાય.",
    en: "Used only for your pass and timing updates. Never for anything else.",
  },
  sendOtp: { hi: "OTP भेजें", gu: "OTP મોકલો", en: "Send OTP" },
  otp: { hi: "OTP दर्ज करें", gu: "OTP દાખલ કરો", en: "Enter OTP" },
  demoOtp: { hi: "डेमो OTP", gu: "ડેમો OTP", en: "Demo OTP" },
  confirm: { hi: "पास बनाएँ — निःशुल्क", gu: "પાસ બનાવો — નિઃશુલ્ક", en: "Create pass — free" },
  next: { hi: "आगे", gu: "આગળ", en: "Next" },
  back: { hi: "पीछे", gu: "પાછળ", en: "Back" },
  seats: { hi: "स्थान", gu: "જગ્યા", en: "spots" },
  full: { hi: "भरा", gu: "ભરાઈ ગયું", en: "Full" },
  past: { hi: "समय निकल गया", gu: "સમય વીતી ગયો", en: "Passed" },
  today: { hi: "आज", gu: "આજે", en: "Today" },
  passReady: { hi: "आपका निःशुल्क दर्शन पास तैयार है", gu: "તમારો નિઃશુલ્ક દર્શન પાસ તૈયાર છે", en: "Your free darshan pass is ready" },
  passNo: { hi: "पास नं.", gu: "પાસ નં.", en: "Pass no." },
  lblName: { hi: "नाम", gu: "નામ", en: "Name" },
  lblGroup: { hi: "संख्या", gu: "સંખ્યા", en: "Group" },
  lblDate: { hi: "दिन", gu: "દિવસ", en: "Date" },
  reportAt: { hi: "रिपोर्टिंग समय", gu: "રિપોર્ટિંગ સમય", en: "Reporting time" },
  batchAt: { hi: "बैच प्रवेश", gu: "બેચ પ્રવેશ", en: "Batch entry" },
  persons: { hi: "व्यक्ति", gu: "વ્યક્તિ", en: "persons" },
  where: { hi: "कहाँ पहुँचें", gu: "ક્યાં પહોંચવું", en: "Where to report" },
  reportingPoint: {
    hi: "सुगम दर्शन लेन — रिपोर्टिंग पॉइंट (गेट नं. 2 के पास)",
    gu: "સુગમ દર્શન લેન — રિપોર્ટિંગ પોઈન્ટ (ગેટ નં. 2 પાસે)",
    en: "Sugam Darshan lane reporting point (near Gate 2)",
  },
  free: { hi: "निःशुल्क", gu: "નિઃશુલ્ક", en: "Free" },
  guestPass: { hi: "मंडल अतिथि पास", gu: "મંડળ અતિથિ પાસ", en: "Mandal Atithi guest pass" },
  devotee: { hi: "श्रद्धालु", gu: "શ્રદ્ધાળુ", en: "Devotee" },
  showAtGate: { hi: "गेट पर यह QR दिखाएँ। स्क्रीनशॉट भी चलेगा।", gu: "ગેટ પર આ QR બતાવો. સ્ક્રીનશૉટ પણ ચાલશે.", en: "Show this QR at the gate. A screenshot works too." },
  reminderNote: {
    hi: "रिपोर्टिंग समय से लगभग 30 मिनट पहले WhatsApp पर याद दिलाया जाएगा।",
    gu: "રિપોર્ટિંગ સમયના લગભગ 30 મિનિટ પહેલાં WhatsApp પર યાદ અપાવીશું.",
    en: "We'll remind you on WhatsApp about 30 minutes before reporting time.",
  },
  reschedule: { hi: "समय बदलें", gu: "સમય બદલો", en: "Reschedule" },
  cancel: { hi: "पास रद्द करें", gu: "પાસ રદ કરો", en: "Cancel pass" },
  cancelConfirm: { hi: "क्या आप यह पास रद्द करना चाहते हैं?", gu: "શું તમે આ પાસ રદ કરવા માંગો છો?", en: "Cancel this pass?" },
  cancelled: { hi: "यह पास रद्द है", gu: "આ પાસ રદ છે", en: "This pass is cancelled" },
  used: { hi: "दर्शन हो चुके — पास उपयोग हो गया", gu: "દર્શન થઈ ગયા — પાસ વપરાઈ ગયો", en: "Darshan done — pass used" },
  rescheduled: { hi: "इस पास का समय बदला गया — नया पास देखें", gu: "આ પાસનો સમય બદલાયો છે — નવો પાસ જુઓ", en: "This pass was rescheduled — see the new pass" },
  paused: {
    hi: "ठाकुरजी के भोग/आरती के कारण बैच कुछ देर रुके हैं। नया समय ऊपर दिखाया गया है।",
    gu: "ઠાકોરજીના ભોગ/આરતીને કારણે બેચ થોડી વાર માટે રોકાયા છે. નવો સમય ઉપર બતાવ્યો છે.",
    en: "Batches are briefly paused for Bhog/Aarti. Your updated time is shown above.",
  },
  openFlow: {
    hi: "आज भीड़ अधिक होने के कारण सुरक्षा दल के निर्देश से सभी कतारें खुली हैं। कृपया गार्ड के निर्देशों का पालन करें।",
    gu: "આજે ભીડ વધુ હોવાથી સુરક્ષા દળના નિર્દેશથી બધી કતારો ખુલ્લી છે. કૃપા કરીને ગાર્ડની સૂચનાઓનું પાલન કરો.",
    en: "Due to heavy crowds, security command has opened all lanes. Please follow guards' instructions.",
  },
  dupErr: {
    hi: "इस नंबर पर इस दिन का पास पहले से है। आप उसका समय बदल सकते हैं।",
    gu: "આ નંબર પર આ દિવસનો પાસ પહેલેથી છે. તમે તેનો સમય બદલી શકો છો.",
    en: "This number already has a pass for that day. You can reschedule it instead.",
  },
  fullErr: { hi: "यह समय अभी-अभी भर गया। कृपया दूसरा समय चुनें।", gu: "આ સમય હમણાં જ ભરાઈ ગયો. કૃપા કરીને બીજો સમય પસંદ કરો.", en: "That time just filled up. Please choose another." },
  noPasses: { hi: "इस डिवाइस पर कोई पास नहीं है।", gu: "આ ઉપકરણ પર કોઈ પાસ નથી.", en: "No passes on this device." },
  delayed: { hi: "समय बदला गया", gu: "સમય બદલાયો", en: "Time updated" },
  newTime: { hi: "नया समय चुनें", gu: "નવો સમય પસંદ કરો", en: "Pick a new time" },
  print: { hi: "प्रिंट / सेव करें", gu: "પ્રિન્ટ / સેવ કરો", en: "Print / save" },
  officialOnly: { hi: "यह मंडल की आधिकारिक निःशुल्क सेवा है। किसी को पैसे न दें।", gu: "આ મંડળની સત્તાવાર નિઃશુલ્ક સેવા છે. કોઈને પૈસા ન આપો.", en: "This is the Mandal's official free service. Never pay anyone for a pass." },
  officialFree: { hi: "आधिकारिक निःशुल्क सेवा", gu: "સત્તાવાર નિઃશુલ્ક સેવા", en: "Official free service" },
  optDivider: { hi: "वैकल्पिक · दर्शन से असंबंधित", gu: "વૈકલ્પિક · દર્શન સાથે અસંબંધિત", en: "Optional · unrelated to darshan" },
  yatraTitle: { hi: "यात्रा साथी — ठहरने व भोजन की जानकारी", gu: "યાત્રા સાથી — રહેવા અને ભોજનની માહિતી", en: "Yatra Companion — stays & meals nearby" },
  yatraBody: {
    hi: "सत्यापित शुद्ध-शाकाहारी धर्मशाला/होटल और भोजनालय। यह एक अलग सेवा है — इसका आपके निःशुल्क पास, बैच या प्रवेश पर कोई असर नहीं है।",
    gu: "ચકાસાયેલ શુદ્ધ-શાકાહારી ધર્મશાળા/હોટલ અને ભોજનાલય. આ એક અલગ સેવા છે — તેની તમારા નિઃશુલ્ક પાસ, બેચ કે પ્રવેશ પર કોઈ અસર નથી.",
    en: "Verified pure-veg stays and eateries. This is a separate service — it has no effect on your free pass, batch or entry.",
  },
  yatraCta: { hi: "देखें (वैकल्पिक) ↗", gu: "જુઓ (વૈકલ્પિક) ↗", en: "Have a look (optional) ↗" },
  install: { hi: "ऐप इंस्टॉल करें", gu: "એપ ઇન્સ્ટોલ કરો", en: "Install app" },
  installIos: {
    hi: "iPhone पर: Safari में नीचे शेयर बटन ⬆️ दबाएँ, फिर “होम स्क्रीन पर जोड़ें” चुनें।",
    gu: "iPhone પર: Safari માં નીચે શેર બટન ⬆️ દબાવો, પછી “હોમ સ્ક્રીન પર ઉમેરો” પસંદ કરો.",
    en: "On iPhone: tap the Share button ⬆️ in Safari, then choose “Add to Home Screen”.",
  },
} satisfies Record<string, Entry>;

export type Key = keyof typeof D;
export const tr = (k: Key, lang: Lang) => D[k][lang];

export function useT() {
  const lang = useLang((s) => s.lang);
  return { lang, t: (k: Key) => D[k][lang] };
}
