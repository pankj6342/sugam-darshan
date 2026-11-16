"use client";
/**
 * Hindi-first WhatsApp conversation engine (BRD A-03). Drives the in-app simulator; the
 * same state machine would sit behind a WhatsApp Business webhook in the pilot.
 * Messages use short numbered prompts + reply buttons so no English typing is needed.
 */
import { AARTI_SCHEDULE, MANDAL_NAME_HI, REPORTING_POINT_HI, SAHAYATA_KENDRA_LOCATION_HI } from "./config";
import { bookableDates, windowsFor, reportTime, effectiveBatch } from "./slots";
import { useTemple } from "./temple-store";
import { fmtDate, fmtTime, ymd } from "./time";
import type { WaButton, WaSession } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const HI_DIGITS: Record<string, string> = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };
const normDigits = (s: string) => s.replace(/[०-९]/g, (d) => HI_DIGITS[d]);

const GREETINGS = ["hi", "hello", "hey", "jai", "jay", "namaste", "menu", "0", "जय", "नमस्ते", "मेनू", "राम राम", "जय श्री कृष्ण", "start"];

function say(phone: string, text: string, buttons?: WaButton[], extra?: { passId?: string; kind?: "optional-invite" }) {
  useTemple.getState().pushMessage({ phone, from: "bot", text, buttons, ...extra });
}

function setStep(phone: string, step: WaSession["step"], draft: WaSession["draft"] = {}) {
  useTemple.getState().setSession(phone, { step, draft });
}

function menu(phone: string, greet = true) {
  setStep(phone, "menu");
  say(
    phone,
    `${greet ? `🙏 *जय श्री सांवलिया सेठ!*\n${MANDAL_NAME_HI} की निःशुल्क *सुगम दर्शन* सेवा में आपका स्वागत है।\n\n` : ""}कृपया नीचे से चुनें या नंबर भेजें:\n1️⃣ दर्शन पास बनाएँ (निःशुल्क)\n2️⃣ मेरा पास देखें / समय बदलें\n3️⃣ आरती व दर्शन समय\n4️⃣ सहायता — स्वयंसेवक से बात करें`,
    [
      { id: "book", label: "1 · दर्शन पास बनाएँ" },
      { id: "mypass", label: "2 · मेरा पास" },
      { id: "timings", label: "3 · आरती समय" },
      { id: "help", label: "4 · सहायता" },
    ],
  );
}

function askDate(phone: string, nextStep: "date" | "reschedule-pick", draft: WaSession["draft"] = {}) {
  const { config } = useTemple.getState();
  const dates = bookableDates(config);
  setStep(phone, nextStep, draft);
  const today = ymd();
  say(
    phone,
    `📅 किस दिन दर्शन करना चाहेंगे?\n\n${dates.map((d, i) => `${i + 1}. ${d === today ? "आज · " : ""}${fmtDate(d, "hi")}`).join("\n")}`,
    dates.map((d, i) => ({ id: `date:${d}`, label: `${i + 1} · ${d === today ? "आज" : fmtDate(d, "hi", { short: true })}` })),
  );
}

function askWindow(phone: string, date: string, nextStep: "window" | "reschedule-window", draft: WaSession["draft"]) {
  const { passes, config } = useTemple.getState();
  const wins = windowsFor(date, passes, config).filter((w) => w.open && w.remaining > 0).slice(0, 10);
  if (!wins.length) {
    say(phone, "क्षमा करें 🙏 इस दिन सुगम दर्शन लेन में अब जगह नहीं है। कृपया दूसरा दिन चुनें, या सामान्य कतार से दर्शन करें — वह हमेशा खुली है।");
    return askDate(phone, nextStep === "window" ? "date" : "reschedule-pick", draft);
  }
  setStep(phone, nextStep, { ...draft, date });
  say(
    phone,
    `🛕 ${fmtDate(date, "hi")} — दर्शन का समय चुनें:\n\n${wins.map((w, i) => `${i + 1}. ${fmtTime(w.start, "hi")} – ${fmtTime(w.end, "hi")}  (${w.remaining} स्थान)`).join("\n")}`,
    wins.map((w, i) => ({ id: `win:${w.start}`, label: `${i + 1} · ${fmtTime(w.start, "hi")}` })),
  );
}

function passText(passId: string) {
  const { passes, config } = useTemple.getState();
  const p = passes.find((x) => x.id === passId)!;
  return `✅ *आपका निःशुल्क सुगम दर्शन पास तैयार है*\n\nपास नं.: *${p.id}*\nनाम: ${p.name} · ${p.groupSize} व्यक्ति\nदिन: ${fmtDate(p.date, "hi")}\nरिपोर्टिंग समय: *${fmtTime(reportTime(p, config), "hi")}*\nबैच प्रवेश: ${fmtTime(effectiveBatch(p), "hi")}\nस्थान: ${REPORTING_POINT_HI}\n\nगेट पर यह QR दिखाएँ। समय से 30 मिनट पहले हम आपको याद दिलाएँगे।\n— ${MANDAL_NAME_HI}`;
}

async function sendOptionalInvite(phone: string) {
  await sleep(1400);
  say(
    phone,
    `ℹ️ *वैकल्पिक जानकारी — यात्रा साथी*\n\nमंडफिया में सत्यापित शुद्ध-शाकाहारी धर्मशाला/होटल और भोजनालय देखना चाहें तो नीचे दबाएँ।\n\nयह एक *अलग सेवा* है। इसका आपके निःशुल्क दर्शन पास, बैच या प्रवेश से *कोई संबंध नहीं* है। आपकी जानकारी आपकी अनुमति के बिना साझा नहीं की जाएगी।`,
    [
      { id: "yatra:open", label: "देखें (वैकल्पिक)" },
      { id: "yatra:no", label: "नहीं, धन्यवाद" },
    ],
    { kind: "optional-invite" },
  );
}

function showMyPasses(phone: string) {
  const { passes, config } = useTemple.getState();
  const mine = passes.filter((p) => p.mobile === phone && p.status === "active" && p.date >= ymd());
  if (!mine.length) {
    setStep(phone, "menu");
    say(phone, "आपके नंबर पर अभी कोई सक्रिय पास नहीं है।", [{ id: "book", label: "दर्शन पास बनाएँ" }, { id: "menu", label: "मुख्य मेनू" }]);
    return;
  }
  for (const p of mine) {
    say(
      phone,
      `🎫 पास *${p.id}* · ${p.groupSize} व्यक्ति\n${fmtDate(p.date, "hi")} · रिपोर्टिंग ${fmtTime(reportTime(p, config), "hi")}`,
      [
        { id: `res:${p.id}`, label: "समय बदलें" },
        { id: `cancel:${p.id}`, label: "पास रद्द करें" },
      ],
      { passId: p.id },
    );
  }
  setStep(phone, "menu");
}

export async function handleInput(phone: string, input: { text?: string; buttonId?: string; buttonLabel?: string; voice?: boolean }) {
  const store = useTemple.getState();
  if (input.voice) {
    store.pushMessage({ phone, from: "user", text: "🎤 वॉइस नोट (0:07)", kind: "voice" });
    await sleep(600);
    say(phone, "🙏 क्षमा करें, अभी हम वॉइस नोट नहीं समझ पाते।\nकृपया नीचे दिए बटन दबाएँ या नंबर भेजें। सहायता के लिए *4* भेजें — स्वयंसेवक आपको कॉल करेंगे।", [
      { id: "menu", label: "मुख्य मेनू" },
      { id: "help", label: "4 · सहायता" },
    ]);
    return;
  }

  const shown = input.buttonLabel ?? input.text ?? "";
  if (shown) store.pushMessage({ phone, from: "user", text: shown });
  await sleep(450);

  const session = useTemple.getState().waSessions[phone];
  const raw = (input.text ?? "").trim();
  const t = normDigits(raw.toLowerCase());
  let id = input.buttonId ?? "";

  // Global intents
  if (!id) {
    if (!session || (session.step !== "name" && GREETINGS.some((g) => t === g || t.startsWith(g + " ") || t.includes("sanwaliya") || t.includes("सांवलिया")))) return menu(phone);
    if (/^(pass|पास|my pass)$/.test(t)) id = "mypass";
  }
  if (id === "menu") return menu(phone, false);
  if (id === "yatra:no") return say(phone, "ठीक है 🙏 आपकी यात्रा मंगलमय हो। जय श्री सांवलिया सेठ!");
  if (id === "help" || (session?.step === "menu" && t === "4")) {
    setStep(phone, "menu");
    return say(
      phone,
      `🤝 *सहायता*\nहमारे स्वयंसेवक को आपका संदेश भेज दिया गया है — वे जल्द ही इसी नंबर पर कॉल करेंगे।\n\nमंदिर पहुँचकर आप यहाँ भी मदद ले सकते हैं:\n📍 ${SAHAYATA_KENDRA_LOCATION_HI}\n(बिना फ़ोन के भी काग़ज़ की पर्ची से पास मिलता है)`,
      [{ id: "menu", label: "मुख्य मेनू" }],
    );
  }
  if (id === "timings" || (session?.step === "menu" && t === "3")) {
    setStep(phone, "menu");
    return say(
      phone,
      `🪔 *आरती व दर्शन समय* (सांकेतिक — मंडल सूचना ही अंतिम)\n\n${AARTI_SCHEDULE.map((a) => `• ${fmtTime(a.time, "hi")} — ${a.hi}`).join("\n")}\n\nराजभोग / आरती के समय सुगम दर्शन बैच कुछ देर रुक सकते हैं; नया समय आपको यहीं भेजा जाएगा।`,
      [{ id: "book", label: "दर्शन पास बनाएँ" }, { id: "menu", label: "मुख्य मेनू" }],
    );
  }
  if (id === "mypass" || (session?.step === "menu" && t === "2")) return showMyPasses(phone);
  if (id === "book" || (session?.step === "menu" && t === "1")) {
    const { passes } = useTemple.getState();
    const dup = passes.find((p) => p.mobile === phone && p.status === "active" && p.date >= ymd() && p.channel !== "guest");
    if (dup) {
      say(phone, `आपके नंबर पर पहले से एक सक्रिय पास (${dup.id}) है। एक नंबर पर एक दिन में एक ही पास बनता है — आप उसका समय बदल सकते हैं।`, [
        { id: `res:${dup.id}`, label: "समय बदलें" },
        { id: "mypass", label: "मेरा पास" },
      ]);
    }
    return askDate(phone, "date");
  }
  if (id.startsWith("cancel:")) {
    const pid = id.slice(7);
    store.cancelPass(pid);
    setStep(phone, "menu");
    return say(phone, `पास ${pid} रद्द कर दिया गया है। आपका स्थान किसी और श्रद्धालु को मिल सकेगा 🙏`, [{ id: "menu", label: "मुख्य मेनू" }]);
  }
  if (id.startsWith("res:")) return askDate(phone, "reschedule-pick", { passId: id.slice(4) });

  if (!session) return menu(phone);
  const { step, draft } = session;
  const dates = bookableDates(useTemple.getState().config);

  // numbered replies map onto the previously offered buttons
  const lastBot = [...useTemple.getState().messages].reverse().find((m) => m.phone === phone && m.from === "bot" && m.buttons?.length);
  if (!id && /^\d+$/.test(t) && lastBot?.buttons) id = lastBot.buttons[Number(t) - 1]?.id ?? "";

  switch (step) {
    case "date":
    case "reschedule-pick": {
      const d = id.startsWith("date:") ? id.slice(5) : null;
      if (!d || !dates.includes(d)) return say(phone, "कृपया सूची में से दिन का नंबर भेजें 🙏");
      return askWindow(phone, d, step === "date" ? "window" : "reschedule-window", draft);
    }
    case "window": {
      const w = id.startsWith("win:") ? id.slice(4) : null;
      if (!w) return say(phone, "कृपया सूची में से समय का नंबर भेजें 🙏");
      setStep(phone, "people", { ...draft, windowStart: w });
      const max = useTemple.getState().config.maxGroupSize;
      return say(
        phone,
        `👨‍👩‍👧 कुल कितने लोग दर्शन करेंगे? (अधिकतम ${max})\nबच्चों सहित संख्या लिखें।`,
        Array.from({ length: max }, (_, i) => ({ id: `ppl:${i + 1}`, label: `${i + 1}` })),
      );
    }
    case "people": {
      const n = id.startsWith("ppl:") ? Number(id.slice(4)) : Number(t);
      const max = useTemple.getState().config.maxGroupSize;
      if (!n || n < 1 || n > max) return say(phone, `कृपया 1 से ${max} के बीच संख्या भेजें।`);
      setStep(phone, "name", { ...draft, people: n });
      return say(phone, "✍️ पास पर छपने के लिए मुख्य श्रद्धालु का नाम लिखें।\n(हिंदी या अंग्रेज़ी, कोई भी चलेगा)");
    }
    case "name": {
      if (raw.length < 2) return say(phone, "कृपया नाम लिखें 🙏");
      const nd = { ...draft, name: raw.slice(0, 40) };
      setStep(phone, "confirm", nd);
      return say(
        phone,
        `कृपया जाँच लें:\n\n👤 ${nd.name} · ${nd.people} व्यक्ति\n📅 ${fmtDate(nd.date!, "hi")}\n🛕 ${fmtTime(nd.windowStart!, "hi")} वाला समय\n💰 शुल्क: *निःशुल्क*`,
        [
          { id: "yes", label: "✅ पुष्टि करें" },
          { id: "no", label: "❌ रद्द करें" },
        ],
      );
    }
    case "confirm": {
      if (id === "no" || t === "2" || t === "नहीं") return menu(phone, false);
      if (id !== "yes" && t !== "1" && t !== "हाँ" && t !== "haan") return say(phone, "पुष्टि के लिए ✅ दबाएँ।");
      const r = await useTemple.getState().createPass({
        name: draft.name!,
        mobile: phone,
        groupSize: draft.people!,
        date: draft.date!,
        windowStart: draft.windowStart!,
        channel: "whatsapp",
        lang: "hi",
      });
      if (!r.ok) {
        if (r.error === "duplicate") return say(phone, "इस दिन के लिए आपके नंबर पर पहले से पास है। *2* भेजकर देखें या समय बदलें।");
        say(phone, "क्षमा करें, यह समय अभी-अभी भर गया। कृपया दूसरा समय चुनें।");
        return askWindow(phone, draft.date!, "window", draft);
      }
      setStep(phone, "menu");
      say(phone, passText(r.pass.id), undefined, { passId: r.pass.id });
      return sendOptionalInvite(phone);
    }
    case "reschedule-window": {
      const w = id.startsWith("win:") ? id.slice(4) : null;
      if (!w || !draft.passId || !draft.date) return say(phone, "कृपया सूची में से समय का नंबर भेजें 🙏");
      const r = await useTemple.getState().reschedulePass(draft.passId, draft.date, w);
      setStep(phone, "menu");
      if (!r.ok) return say(phone, "क्षमा करें, समय नहीं बदल सका (स्थान भर गया)। कृपया दोबारा कोशिश करें।", [{ id: "mypass", label: "मेरा पास" }]);
      return say(phone, `🔄 समय बदल दिया गया। पुराना पास ${draft.passId} अब मान्य नहीं है।\n\n${passText(r.pass.id)}`, undefined, { passId: r.pass.id });
    }
    default:
      return menu(phone);
  }
}
