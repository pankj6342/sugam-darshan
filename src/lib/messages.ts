/**
 * Devotee-facing WhatsApp message texts (BRD A-03, A-05, B-04, NFR-03).
 * Hindi is the default; Gujarati is offered as an option. In production these become
 * Mandal-approved WhatsApp templates.
 */
import { AARTI_SCHEDULE, MANDAL_NAME_GU, MANDAL_NAME_HI, REPORTING_POINT_GU, REPORTING_POINT_HI, SAHAYATA_KENDRA_LOCATION_GU, SAHAYATA_KENDRA_LOCATION_HI } from "./config";
import { effectiveBatch, reportTime } from "./slots";
import { fmtDate, fmtTime } from "./time";
import type { Lang, OpsConfig, Pass, RitualPause } from "./types";

export type BotLang = "hi" | "gu";
export const botLang = (l: Lang | undefined): BotLang => (l === "gu" ? "gu" : "hi");

const T = {
  hi: {
    welcome: `🙏 *जय श्री सांवलिया सेठ!*\n${MANDAL_NAME_HI} की निःशुल्क *सुगम दर्शन* सेवा में आपका स्वागत है।\n\n`,
    menu: "कृपया नीचे से चुनें या नंबर भेजें:\n1️⃣ दर्शन पास बनाएँ (निःशुल्क)\n2️⃣ मेरा पास देखें / समय बदलें\n3️⃣ आरती व दर्शन समय\n4️⃣ सहायता — स्वयंसेवक से बात करें\n5️⃣ ગુજરાતીમાં વાત કરો (Gujarati)",
    bBook: "1 · दर्शन पास बनाएँ",
    bMine: "2 · मेरा पास",
    bTimings: "3 · आरती समय",
    bHelp: "4 · सहायता",
    bOtherLang: "5 · ગુજરાતી",
    bMenu: "मुख्य मेनू",
    bBookShort: "दर्शन पास बनाएँ",
    bResched: "समय बदलें",
    bCancel: "पास रद्द करें",
    bMyPass: "मेरा पास",
    bMyPassView: "मेरा पास देखें",
    bYes: "✅ पुष्टि करें",
    bNo: "❌ रद्द करें",
    bYatraOpen: "देखें (वैकल्पिक)",
    bYatraNo: "नहीं, धन्यवाद",
    today: "आज",
    langSet: "ठीक है, अब हम हिंदी में बात करेंगे 🙏",
    askDate: "📅 किस दिन दर्शन करना चाहेंगे?",
    noSpace: "क्षमा करें 🙏 इस दिन सुगम दर्शन लेन में अब जगह नहीं है। कृपया दूसरा दिन चुनें, या सामान्य कतार से दर्शन करें — वह हमेशा खुली है।",
    pickWindow: (d: string) => `🛕 ${d} — दर्शन का समय चुनें:`,
    spots: "स्थान",
    askPeople: (max: number) => `👨‍👩‍👧 कुल कितने लोग दर्शन करेंगे? (अधिकतम ${max})\nबच्चों सहित संख्या लिखें।`,
    badPeople: (max: number) => `कृपया 1 से ${max} के बीच संख्या भेजें।`,
    askName: "✍️ पास पर छपने के लिए मुख्य श्रद्धालु का नाम लिखें।\n(हिंदी, गुजराती या अंग्रेज़ी, कोई भी चलेगा)",
    badName: "कृपया नाम लिखें 🙏",
    confirm: (name: string, n: number, d: string, t: string) => `कृपया जाँच लें:\n\n👤 ${name} · ${n} व्यक्ति\n📅 ${d}\n🛕 ${t} वाला समय\n💰 शुल्क: *निःशुल्क*`,
    pressConfirm: "पुष्टि के लिए ✅ दबाएँ।",
    pickFromList: "कृपया सूची में से नंबर भेजें 🙏",
    dupDay: "इस दिन के लिए आपके नंबर पर पहले से पास है। *2* भेजकर देखें या समय बदलें।",
    slotGone: "क्षमा करें, यह समय अभी-अभी भर गया। कृपया दूसरा समय चुनें।",
    hasActive: (id: string) => `आपके नंबर पर पहले से एक सक्रिय पास (${id}) है। एक नंबर पर एक दिन में एक ही पास बनता है — आप उसका समय बदल सकते हैं।`,
    noActive: "आपके नंबर पर अभी कोई सक्रिय पास नहीं है।",
    passLine: (id: string, n: number, d: string, r: string) => `🎫 पास *${id}* · ${n} व्यक्ति\n${d} · रिपोर्टिंग ${r}`,
    cancelled: (id: string) => `पास ${id} रद्द कर दिया गया है। आपका स्थान किसी और श्रद्धालु को मिल सकेगा 🙏`,
    reschedFail: "क्षमा करें, समय नहीं बदल सका (स्थान भर गया)। कृपया दोबारा कोशिश करें।",
    reschedOk: (old: string) => `🔄 समय बदल दिया गया। पुराना पास ${old} अब मान्य नहीं है।\n\n`,
    help: `🤝 *सहायता*\nहमारे स्वयंसेवक को आपका संदेश भेज दिया गया है — वे जल्द ही इसी नंबर पर कॉल करेंगे।\n\nमंदिर पहुँचकर आप यहाँ भी मदद ले सकते हैं:\n📍 ${SAHAYATA_KENDRA_LOCATION_HI}\n(बिना फ़ोन के भी काग़ज़ की पर्ची से पास मिलता है)`,
    timingsHead: "🪔 *आरती व दर्शन समय* (सांकेतिक — मंडल सूचना ही अंतिम)",
    timingsFoot: "राजभोग / आरती के समय सुगम दर्शन बैच कुछ देर रुक सकते हैं; नया समय आपको यहीं भेजा जाएगा।",
    voice: "🙏 क्षमा करें, अभी हम वॉइस नोट नहीं समझ पाते।\nकृपया नीचे दिए बटन दबाएँ या नंबर भेजें। सहायता के लिए *4* भेजें — स्वयंसेवक आपको कॉल करेंगे।",
    voiceLabel: "🎤 वॉइस नोट (0:07)",
    yatraNo: "ठीक है 🙏 आपकी यात्रा मंगलमय हो। जय श्री सांवलिया सेठ!",
    invite:
      "ℹ️ *वैकल्पिक जानकारी — यात्रा साथी*\n\nमंडफिया में सत्यापित शुद्ध-शाकाहारी धर्मशाला/होटल और भोजनालय देखना चाहें तो नीचे दबाएँ।\n\nयह एक *अलग सेवा* है। इसका आपके निःशुल्क दर्शन पास, बैच या प्रवेश से *कोई संबंध नहीं* है। आपकी जानकारी आपकी अनुमति के बिना साझा नहीं की जाएगी।",
    passReady: (p: Pass, d: string, r: string, b: string) =>
      `✅ *आपका निःशुल्क सुगम दर्शन पास तैयार है*\n\nपास नं.: *${p.id}*\nनाम: ${p.name} · ${p.groupSize} व्यक्ति\nदिन: ${d}\nरिपोर्टिंग समय: *${r}*\nबैच प्रवेश: ${b}\nस्थान: ${REPORTING_POINT_HI}\n\nगेट पर यह QR दिखाएँ। समय से 30 मिनट पहले हम आपको याद दिलाएँगे।\n— ${MANDAL_NAME_HI}`,
    reminder: (p: Pass, r: string) =>
      `🔔 *दर्शन स्मरण* — जय श्री सांवलिया सेठ!\n\nआपका सुगम दर्शन बैच जल्द आने वाला है।\nपास: ${p.id} · ${p.groupSize} व्यक्ति\nरिपोर्टिंग समय: *${r}*\n\nकृपया अपना QR पास तैयार रखें।`,
    ritualWhat: { bhog: "ठाकुरजी के राजभोग का समय है", aarti: "ठाकुरजी की आरती का समय है", other: "मंदिर व्यवस्था हेतु दर्शन कुछ समय के लिए रुके हैं" },
    ritual: (what: string, id: string, r: string, b: string) =>
      `🙏 ${what}। कृपया शांतिपूर्वक प्रतीक्षा करें।\n\nपास ${id} — आपका नया रिपोर्टिंग समय: *${r}*\n(बैच प्रवेश: ${b})\n\nसमय में फिर बदलाव होने पर हम आपको यहीं सूचित करेंगे।`,
  },
  gu: {
    welcome: `🙏 *જય શ્રી સાંવલિયા શેઠ!*\n${MANDAL_NAME_GU} ની નિઃશુલ્ક *સુગમ દર્શન* સેવામાં આપનું સ્વાગત છે.\n\n`,
    menu: "કૃપા કરીને નીચેથી પસંદ કરો અથવા નંબર મોકલો:\n1️⃣ દર્શન પાસ બનાવો (નિઃશુલ્ક)\n2️⃣ મારો પાસ જુઓ / સમય બદલો\n3️⃣ આરતી અને દર્શન સમય\n4️⃣ સહાયતા — સ્વયંસેવક સાથે વાત કરો\n5️⃣ हिंदी में बात करें (Hindi)",
    bBook: "1 · દર્શન પાસ બનાવો",
    bMine: "2 · મારો પાસ",
    bTimings: "3 · આરતી સમય",
    bHelp: "4 · સહાયતા",
    bOtherLang: "5 · हिंदी",
    bMenu: "મુખ્ય મેનુ",
    bBookShort: "દર્શન પાસ બનાવો",
    bResched: "સમય બદલો",
    bCancel: "પાસ રદ કરો",
    bMyPass: "મારો પાસ",
    bMyPassView: "મારો પાસ જુઓ",
    bYes: "✅ પુષ્ટિ કરો",
    bNo: "❌ રદ કરો",
    bYatraOpen: "જુઓ (વૈકલ્પિક)",
    bYatraNo: "ના, આભાર",
    today: "આજે",
    langSet: "સરસ, હવે અમે ગુજરાતીમાં વાત કરીશું 🙏",
    askDate: "📅 કયા દિવસે દર્શન કરવા માંગો છો?",
    noSpace: "માફ કરશો 🙏 આ દિવસે સુગમ દર્શન લેનમાં હવે જગ્યા નથી. કૃપા કરીને બીજો દિવસ પસંદ કરો, અથવા સામાન્ય કતારથી દર્શન કરો — તે હંમેશાં ખુલ્લી છે.",
    pickWindow: (d: string) => `🛕 ${d} — દર્શનનો સમય પસંદ કરો:`,
    spots: "જગ્યા",
    askPeople: (max: number) => `👨‍👩‍👧 કુલ કેટલા લોકો દર્શન કરશે? (વધુમાં વધુ ${max})\nબાળકો સહિત સંખ્યા લખો.`,
    badPeople: (max: number) => `કૃપા કરીને 1 થી ${max} વચ્ચેની સંખ્યા મોકલો.`,
    askName: "✍️ પાસ પર છાપવા માટે મુખ્ય શ્રદ્ધાળુનું નામ લખો.\n(ગુજરાતી, હિંદી કે અંગ્રેજી — કોઈ પણ ચાલશે)",
    badName: "કૃપા કરીને નામ લખો 🙏",
    confirm: (name: string, n: number, d: string, t: string) => `કૃપા કરીને ચકાસો:\n\n👤 ${name} · ${n} વ્યક્તિ\n📅 ${d}\n🛕 ${t} નો સમય\n💰 શુલ્ક: *નિઃશુલ્ક*`,
    pressConfirm: "પુષ્ટિ માટે ✅ દબાવો.",
    pickFromList: "કૃપા કરીને યાદીમાંથી નંબર મોકલો 🙏",
    dupDay: "આ દિવસ માટે તમારા નંબર પર પહેલેથી પાસ છે. *2* મોકલીને જુઓ અથવા સમય બદલો.",
    slotGone: "માફ કરશો, આ સમય હમણાં જ ભરાઈ ગયો. કૃપા કરીને બીજો સમય પસંદ કરો.",
    hasActive: (id: string) => `તમારા નંબર પર પહેલેથી એક સક્રિય પાસ (${id}) છે. એક નંબર પર એક દિવસમાં એક જ પાસ બને છે — તમે તેનો સમય બદલી શકો છો.`,
    noActive: "તમારા નંબર પર હાલ કોઈ સક્રિય પાસ નથી.",
    passLine: (id: string, n: number, d: string, r: string) => `🎫 પાસ *${id}* · ${n} વ્યક્તિ\n${d} · રિપોર્ટિંગ ${r}`,
    cancelled: (id: string) => `પાસ ${id} રદ કરવામાં આવ્યો છે. તમારી જગ્યા બીજા શ્રદ્ધાળુને મળી શકશે 🙏`,
    reschedFail: "માફ કરશો, સમય બદલી શકાયો નહીં (જગ્યા ભરાઈ ગઈ). કૃપા કરીને ફરી પ્રયાસ કરો.",
    reschedOk: (old: string) => `🔄 સમય બદલાઈ ગયો. જૂનો પાસ ${old} હવે માન્ય નથી.\n\n`,
    help: `🤝 *સહાયતા*\nઅમારા સ્વયંસેવકને તમારો સંદેશ મોકલી દીધો છે — તેઓ ટૂંક સમયમાં આ જ નંબર પર કૉલ કરશે.\n\nમંદિરે પહોંચીને તમે અહીં પણ મદદ લઈ શકો છો:\n📍 ${SAHAYATA_KENDRA_LOCATION_GU}\n(ફોન વિના પણ કાગળની પરચીથી પાસ મળે છે)`,
    timingsHead: "🪔 *આરતી અને દર્શન સમય* (સૂચક — મંડળની સૂચના જ અંતિમ)",
    timingsFoot: "રાજભોગ / આરતીના સમયે સુગમ દર્શન બેચ થોડી વાર રોકાઈ શકે છે; નવો સમય તમને અહીં જ મોકલાશે.",
    voice: "🙏 માફ કરશો, હાલ અમે વૉઇસ નોટ સમજી શકતા નથી.\nકૃપા કરીને નીચેના બટન દબાવો અથવા નંબર મોકલો. સહાયતા માટે *4* મોકલો — સ્વયંસેવક તમને કૉલ કરશે.",
    voiceLabel: "🎤 વૉઇસ નોટ (0:07)",
    yatraNo: "સરસ 🙏 તમારી યાત્રા મંગળમય રહે. જય શ્રી સાંવલિયા શેઠ!",
    invite:
      "ℹ️ *વૈકલ્પિક માહિતી — યાત્રા સાથી*\n\nમંડફિયામાં ચકાસાયેલ શુદ્ધ-શાકાહારી ધર્મશાળા/હોટલ અને ભોજનાલય જોવા માંગતા હો તો નીચે દબાવો.\n\nઆ એક *અલગ સેવા* છે. તેનો તમારા નિઃશુલ્ક દર્શન પાસ, બેચ કે પ્રવેશ સાથે *કોઈ સંબંધ નથી*. તમારી માહિતી તમારી પરવાનગી વિના શેર કરવામાં આવશે નહીં.",
    passReady: (p: Pass, d: string, r: string, b: string) =>
      `✅ *તમારો નિઃશુલ્ક સુગમ દર્શન પાસ તૈયાર છે*\n\nપાસ નં.: *${p.id}*\nનામ: ${p.name} · ${p.groupSize} વ્યક્તિ\nદિવસ: ${d}\nરિપોર્ટિંગ સમય: *${r}*\nબેચ પ્રવેશ: ${b}\nસ્થળ: ${REPORTING_POINT_GU}\n\nગેટ પર આ QR બતાવો. સમયના 30 મિનિટ પહેલાં અમે તમને યાદ અપાવીશું.\n— ${MANDAL_NAME_GU}`,
    reminder: (p: Pass, r: string) =>
      `🔔 *દર્શન સ્મરણ* — જય શ્રી સાંવલિયા શેઠ!\n\nતમારો સુગમ દર્શન બેચ ટૂંક સમયમાં આવી રહ્યો છે.\nપાસ: ${p.id} · ${p.groupSize} વ્યક્તિ\nરિપોર્ટિંગ સમય: *${r}*\n\nકૃપા કરીને તમારો QR પાસ તૈયાર રાખો.`,
    ritualWhat: { bhog: "ઠાકોરજીના રાજભોગનો સમય છે", aarti: "ઠાકોરજીની આરતીનો સમય છે", other: "મંદિર વ્યવસ્થા માટે દર્શન થોડી વાર માટે રોકાયા છે" },
    ritual: (what: string, id: string, r: string, b: string) =>
      `🙏 ${what}. કૃપા કરીને શાંતિથી રાહ જુઓ.\n\nપાસ ${id} — તમારો નવો રિપોર્ટિંગ સમય: *${r}*\n(બેચ પ્રવેશ: ${b})\n\nસમયમાં ફરી ફેરફાર થશે તો અમે તમને અહીં જ જાણ કરીશું.`,
  },
} as const;

export const M = (l: Lang | undefined) => T[botLang(l)];

export function timingsText(l: BotLang) {
  const m = T[l];
  return `${m.timingsHead}\n\n${AARTI_SCHEDULE.map((a) => `• ${fmtTime(a.time, l)} — ${a[l]}`).join("\n")}\n\n${m.timingsFoot}`;
}

export function passReadyText(p: Pass, cfg: OpsConfig) {
  const l = botLang(p.lang);
  return T[l].passReady(p, fmtDate(p.date, l), fmtTime(reportTime(p, cfg), l), fmtTime(effectiveBatch(p), l));
}

export function reminderText(p: Pass, cfg: OpsConfig) {
  const l = botLang(p.lang);
  return T[l].reminder(p, fmtTime(reportTime(p, cfg), l));
}

export function ritualText(p: Pass, cfg: OpsConfig, reason: RitualPause["reason"]) {
  const l = botLang(p.lang);
  return T[l].ritual(T[l].ritualWhat[reason], p.id, fmtTime(reportTime(p, cfg), l), fmtTime(effectiveBatch(p), l));
}
