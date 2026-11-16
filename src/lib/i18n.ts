"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./types";

export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>()(
  persist((set) => ({ lang: "hi", setLang: (lang) => set({ lang }) }), { name: "sd-lang" }),
);

const D = {
  mandal: { hi: "श्री सांवलिया सेठ मंदिर मंडल", en: "Shri Sanwaliya Seth Mandir Mandal" },
  place: { hi: "मंडफिया, चित्तौड़गढ़ (राज.)", en: "Mandaphia, Chittorgarh (Raj.)" },
  sugam: { hi: "सुगम दर्शन", en: "Sugam Darshan" },
  tagline: { hi: "निःशुल्क, व्यवस्थित और शांतिपूर्ण दर्शन", en: "Free, orderly and peaceful darshan" },
  bookCta: { hi: "निःशुल्क दर्शन पास बनाएँ", en: "Get a free darshan pass" },
  myPasses: { hi: "मेरे पास", en: "My passes" },
  crowdNow: { hi: "अभी भीड़", en: "Crowd now" },
  crowd_low: { hi: "कम", en: "Low" },
  crowd_medium: { hi: "सामान्य", en: "Moderate" },
  crowd_high: { hi: "अधिक", en: "High" },
  estimated: { hi: "अनुमानित", en: "estimated" },
  aarti: { hi: "आज के आरती / दर्शन समय", en: "Today's Aarti / darshan timings" },
  aartiNote: { hi: "सांकेतिक समय — मंडल की सूचना ही अंतिम मानी जाएगी", en: "Indicative — Mandal notices are final" },
  howItWorks: { hi: "कैसे काम करता है", en: "How it works" },
  how1: { hi: "दिन और समय चुनें", en: "Choose day and time" },
  how2: { hi: "QR पास पाएँ — पूरी तरह निःशुल्क", en: "Get a QR pass — completely free" },
  how3: { hi: "रिपोर्टिंग समय पर सुगम दर्शन लेन पर पहुँचें", en: "Arrive at the Sugam Darshan lane at your reporting time" },
  noPhone: { hi: "स्मार्टफ़ोन नहीं है? मंदिर के सहायता केंद्र से काग़ज़ की पर्ची पर पास लें।", en: "No smartphone? Get a printed pass at the temple Sahayata Kendra." },
  whatsappAlt: { hi: "WhatsApp पर भी बुक करें: \"जय श्री सांवलिया सेठ\" भेजें", en: "Also on WhatsApp: send \"Jai Shri Sanwaliya Seth\"" },
  generalAlways: { hi: "सामान्य कतार हमेशा की तरह खुली है — डिजिटल पास अनिवार्य नहीं है।", en: "The general queue remains open as always — a digital pass is not mandatory." },
  chooseDay: { hi: "दिन चुनें", en: "Choose a day" },
  chooseTime: { hi: "समय चुनें", en: "Choose a time" },
  people: { hi: "कितने लोग?", en: "How many people?" },
  peopleHint: { hi: "बच्चों सहित कुल संख्या", en: "Total including children" },
  details: { hi: "आपकी जानकारी", en: "Your details" },
  name: { hi: "मुख्य श्रद्धालु का नाम", en: "Lead devotee's name" },
  mobile: { hi: "मोबाइल नंबर", en: "Mobile number" },
  mobileWhy: { hi: "केवल पास और समय की सूचना के लिए। किसी और काम में उपयोग नहीं होगा।", en: "Used only for your pass and timing updates. Never for anything else." },
  sendOtp: { hi: "OTP भेजें", en: "Send OTP" },
  otp: { hi: "OTP दर्ज करें", en: "Enter OTP" },
  demoOtp: { hi: "डेमो OTP", en: "Demo OTP" },
  confirm: { hi: "पास बनाएँ — निःशुल्क", en: "Create pass — free" },
  next: { hi: "आगे", en: "Next" },
  back: { hi: "पीछे", en: "Back" },
  seats: { hi: "स्थान", en: "spots" },
  full: { hi: "भरा", en: "Full" },
  past: { hi: "समय निकल गया", en: "Passed" },
  today: { hi: "आज", en: "Today" },
  passReady: { hi: "आपका निःशुल्क दर्शन पास तैयार है", en: "Your free darshan pass is ready" },
  passNo: { hi: "पास नं.", en: "Pass no." },
  reportAt: { hi: "रिपोर्टिंग समय", en: "Reporting time" },
  batchAt: { hi: "बैच प्रवेश", en: "Batch entry" },
  persons: { hi: "व्यक्ति", en: "persons" },
  where: { hi: "कहाँ पहुँचें", en: "Where to report" },
  free: { hi: "निःशुल्क", en: "Free" },
  showAtGate: { hi: "गेट पर यह QR दिखाएँ। स्क्रीनशॉट भी चलेगा।", en: "Show this QR at the gate. A screenshot works too." },
  reminderNote: { hi: "रिपोर्टिंग समय से लगभग 30 मिनट पहले WhatsApp पर याद दिलाया जाएगा।", en: "We'll remind you on WhatsApp about 30 minutes before reporting time." },
  reschedule: { hi: "समय बदलें", en: "Reschedule" },
  cancel: { hi: "पास रद्द करें", en: "Cancel pass" },
  cancelled: { hi: "यह पास रद्द है", en: "This pass is cancelled" },
  used: { hi: "दर्शन हो चुके — पास उपयोग हो गया", en: "Darshan done — pass used" },
  rescheduled: { hi: "इस पास का समय बदला गया — नया पास देखें", en: "This pass was rescheduled — see the new pass" },
  paused: { hi: "ठाकुरजी के भोग/आरती के कारण बैच कुछ देर रुके हैं। नया समय ऊपर दिखाया गया है।", en: "Batches are briefly paused for Bhog/Aarti. Your updated time is shown above." },
  openFlow: { hi: "आज भीड़ अधिक होने के कारण सुरक्षा दल के निर्देश से सभी कतारें खुली हैं। कृपया गार्ड के निर्देशों का पालन करें।", en: "Due to heavy crowds, security command has opened all lanes. Please follow guards' instructions." },
  dupErr: { hi: "इस नंबर पर इस दिन का पास पहले से है। आप उसका समय बदल सकते हैं।", en: "This number already has a pass for that day. You can reschedule it instead." },
  fullErr: { hi: "यह समय अभी-अभी भर गया। कृपया दूसरा समय चुनें।", en: "That time just filled up. Please choose another." },
  noPasses: { hi: "इस डिवाइस पर कोई पास नहीं है।", en: "No passes on this device." },
  delayed: { hi: "समय बदला गया", en: "Time updated" },
  newTime: { hi: "नया समय चुनें", en: "Pick a new time" },
  print: { hi: "प्रिंट / सेव करें", en: "Print / save" },
  officialOnly: { hi: "यह मंडल की आधिकारिक निःशुल्क सेवा है। किसी को पैसे न दें।", en: "This is the Mandal's official free service. Never pay anyone for a pass." },
} as const;

export type Key = keyof typeof D;
export const tr = (k: Key, lang: Lang) => D[k][lang];

export function useT() {
  const lang = useLang((s) => s.lang);
  return { lang, t: (k: Key) => D[k][lang] };
}
