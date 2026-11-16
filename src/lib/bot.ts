"use client";
/**
 * Hindi-first WhatsApp conversation engine (BRD A-03) with Gujarati as an option (NFR-03).
 * Drives the in-app simulator; the same state machine would sit behind a WhatsApp Business
 * webhook in the pilot. Short numbered prompts + reply buttons, so no English typing needed.
 * Typing in Gujarati script, or choosing option 5, switches the conversation to Gujarati.
 */
import { M, botLang, passReadyText, timingsText, type BotLang } from "./messages";
import { bookableDates, windowsFor, reportTime } from "./slots";
import { useTemple } from "./temple-store";
import { fmtDate, fmtTime, ymd } from "./time";
import type { WaButton, WaSession } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4", "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
};
const normDigits = (s: string) => s.replace(/[०-९૦-૯]/g, (d) => DIGITS[d]);
const hasGujarati = (s: string) => /[઀-૿]/.test(s);

const GREETINGS = ["hi", "hello", "hey", "jai", "jay", "namaste", "menu", "0", "start", "जय", "नमस्ते", "मेनू", "राम राम", "जय श्री कृष्ण", "જય", "નમસ્તે", "જય શ્રી કૃષ્ણ", "મેનુ"];
const isGreeting = (t: string) =>
  GREETINGS.some((g) => t === g || t.startsWith(g + " ")) || t.includes("sanwaliya") || t.includes("सांवलिया") || t.includes("સાંવલિયા");

function say(phone: string, text: string, buttons?: WaButton[], extra?: { passId?: string; kind?: "optional-invite" }) {
  useTemple.getState().pushMessage({ phone, from: "bot", text, buttons, ...extra });
}

const langOf = (phone: string): BotLang => botLang(useTemple.getState().waSessions[phone]?.lang);

function setStep(phone: string, step: WaSession["step"], draft: WaSession["draft"] = {}, lang: BotLang = langOf(phone)) {
  useTemple.getState().setSession(phone, { step, draft, lang });
}

function menu(phone: string, greet = true) {
  const l = langOf(phone);
  const m = M(l);
  setStep(phone, "menu");
  say(phone, `${greet ? m.welcome : ""}${m.menu}`, [
    { id: "book", label: m.bBook },
    { id: "mypass", label: m.bMine },
    { id: "timings", label: m.bTimings },
    { id: "help", label: m.bHelp },
    { id: `lang:${l === "hi" ? "gu" : "hi"}`, label: m.bOtherLang },
  ]);
}

function askDate(phone: string, nextStep: "date" | "reschedule-pick", draft: WaSession["draft"] = {}) {
  const l = langOf(phone);
  const m = M(l);
  const dates = bookableDates(useTemple.getState().config);
  setStep(phone, nextStep, draft);
  const today = ymd();
  say(
    phone,
    `${m.askDate}\n\n${dates.map((d, i) => `${i + 1}. ${d === today ? `${m.today} · ` : ""}${fmtDate(d, l)}`).join("\n")}`,
    dates.map((d, i) => ({ id: `date:${d}`, label: `${i + 1} · ${d === today ? m.today : fmtDate(d, l, { short: true })}` })),
  );
}

function askWindow(phone: string, date: string, nextStep: "window" | "reschedule-window", draft: WaSession["draft"]) {
  const l = langOf(phone);
  const m = M(l);
  const { passes, config } = useTemple.getState();
  const wins = windowsFor(date, passes, config).filter((w) => w.open && w.remaining > 0).slice(0, 10);
  if (!wins.length) {
    say(phone, m.noSpace);
    return askDate(phone, nextStep === "window" ? "date" : "reschedule-pick", draft);
  }
  setStep(phone, nextStep, { ...draft, date });
  say(
    phone,
    `${m.pickWindow(fmtDate(date, l))}\n\n${wins.map((w, i) => `${i + 1}. ${fmtTime(w.start, l)} – ${fmtTime(w.end, l)}  (${w.remaining} ${m.spots})`).join("\n")}`,
    wins.map((w, i) => ({ id: `win:${w.start}`, label: `${i + 1} · ${fmtTime(w.start, l)}` })),
  );
}

async function sendOptionalInvite(phone: string) {
  await sleep(1400);
  const m = M(langOf(phone));
  say(
    phone,
    m.invite,
    [
      { id: "yatra:open", label: m.bYatraOpen },
      { id: "yatra:no", label: m.bYatraNo },
    ],
    { kind: "optional-invite" },
  );
}

function showMyPasses(phone: string) {
  const l = langOf(phone);
  const m = M(l);
  const { passes, config } = useTemple.getState();
  const mine = passes.filter((p) => p.mobile === phone && p.status === "active" && p.date >= ymd());
  setStep(phone, "menu");
  if (!mine.length) return say(phone, m.noActive, [{ id: "book", label: m.bBookShort }, { id: "menu", label: m.bMenu }]);
  for (const p of mine) {
    say(phone, m.passLine(p.id, p.groupSize, fmtDate(p.date, l), fmtTime(reportTime(p, config), l)), [
      { id: `res:${p.id}`, label: m.bResched },
      { id: `cancel:${p.id}`, label: m.bCancel },
    ], { passId: p.id });
  }
}

export async function handleInput(phone: string, input: { text?: string; buttonId?: string; buttonLabel?: string; voice?: boolean }) {
  const store = useTemple.getState();
  if (input.voice) {
    const m = M(langOf(phone));
    store.pushMessage({ phone, from: "user", text: m.voiceLabel, kind: "voice" });
    await sleep(600);
    return say(phone, m.voice, [
      { id: "menu", label: m.bMenu },
      { id: "help", label: m.bHelp },
    ]);
  }

  const shown = input.buttonLabel ?? input.text ?? "";
  if (shown) store.pushMessage({ phone, from: "user", text: shown });
  await sleep(450);

  const raw = (input.text ?? "").trim();
  let session = useTemple.getState().waSessions[phone];
  // Writing in Gujarati script switches the conversation to Gujarati (except free-text names).
  if (raw && hasGujarati(raw) && session?.step !== "name" && langOf(phone) !== "gu") {
    setStep(phone, session?.step ?? "menu", session?.draft ?? {}, "gu");
    session = useTemple.getState().waSessions[phone];
  }
  const t = normDigits(raw.toLowerCase());
  let id = input.buttonId ?? "";
  const step = session?.step;

  if (!id) {
    if (!session || (step !== "name" && isGreeting(t))) return menu(phone);
    if (/^(pass|पास|પાસ|my pass)$/.test(t)) id = "mypass";
    if (step === "menu" && /^[1-5]$/.test(t)) id = ["book", "mypass", "timings", "help", `lang:${langOf(phone) === "hi" ? "gu" : "hi"}`][Number(t) - 1];
  }

  const l = langOf(phone);
  const m = M(l);

  if (id.startsWith("lang:")) {
    const nl = id.slice(5) === "gu" ? "gu" : "hi";
    setStep(phone, "menu", {}, nl);
    say(phone, M(nl).langSet);
    return menu(phone, false);
  }
  if (id === "menu") return menu(phone, false);
  if (id === "yatra:no") return say(phone, m.yatraNo);
  if (id === "help") {
    setStep(phone, "menu");
    return say(phone, m.help, [{ id: "menu", label: m.bMenu }]);
  }
  if (id === "timings") {
    setStep(phone, "menu");
    return say(phone, timingsText(l), [{ id: "book", label: m.bBookShort }, { id: "menu", label: m.bMenu }]);
  }
  if (id === "mypass") return showMyPasses(phone);
  if (id === "book") {
    const dup = useTemple.getState().passes.find((p) => p.mobile === phone && p.status === "active" && p.date >= ymd() && p.channel !== "guest");
    if (dup) say(phone, m.hasActive(dup.id), [{ id: `res:${dup.id}`, label: m.bResched }, { id: "mypass", label: m.bMyPass }]);
    return askDate(phone, "date");
  }
  if (id.startsWith("cancel:")) {
    const pid = id.slice(7);
    store.cancelPass(pid);
    setStep(phone, "menu");
    return say(phone, m.cancelled(pid), [{ id: "menu", label: m.bMenu }]);
  }
  if (id.startsWith("res:")) return askDate(phone, "reschedule-pick", { passId: id.slice(4) });

  if (!session) return menu(phone);
  const { draft } = session;
  const dates = bookableDates(useTemple.getState().config);

  // Numbered replies map onto the previously offered buttons.
  const lastBot = [...useTemple.getState().messages].reverse().find((x) => x.phone === phone && x.from === "bot" && x.buttons?.length);
  if (!id && /^\d+$/.test(t) && lastBot?.buttons) id = lastBot.buttons[Number(t) - 1]?.id ?? "";

  switch (step) {
    case "date":
    case "reschedule-pick": {
      const d = id.startsWith("date:") ? id.slice(5) : null;
      if (!d || !dates.includes(d)) return say(phone, m.pickFromList);
      return askWindow(phone, d, step === "date" ? "window" : "reschedule-window", draft);
    }
    case "window": {
      const w = id.startsWith("win:") ? id.slice(4) : null;
      if (!w) return say(phone, m.pickFromList);
      setStep(phone, "people", { ...draft, windowStart: w });
      const max = useTemple.getState().config.maxGroupSize;
      return say(phone, m.askPeople(max), Array.from({ length: max }, (_, i) => ({ id: `ppl:${i + 1}`, label: `${i + 1}` })));
    }
    case "people": {
      const n = id.startsWith("ppl:") ? Number(id.slice(4)) : Number(t);
      const max = useTemple.getState().config.maxGroupSize;
      if (!n || n < 1 || n > max) return say(phone, m.badPeople(max));
      setStep(phone, "name", { ...draft, people: n });
      return say(phone, m.askName);
    }
    case "name": {
      if (raw.length < 2) return say(phone, m.badName);
      const nd = { ...draft, name: raw.slice(0, 40) };
      setStep(phone, "confirm", nd);
      return say(phone, m.confirm(nd.name, nd.people!, fmtDate(nd.date!, l), fmtTime(nd.windowStart!, l)), [
        { id: "yes", label: m.bYes },
        { id: "no", label: m.bNo },
      ]);
    }
    case "confirm": {
      if (id === "no" || t === "2") return menu(phone, false);
      if (id !== "yes" && t !== "1" && !["हाँ", "haan", "હા", "yes"].includes(t)) return say(phone, m.pressConfirm);
      const r = await useTemple.getState().createPass({
        name: draft.name!,
        mobile: phone,
        groupSize: draft.people!,
        date: draft.date!,
        windowStart: draft.windowStart!,
        channel: "whatsapp",
        lang: l,
      });
      if (!r.ok) {
        if (r.error === "duplicate") return say(phone, m.dupDay);
        say(phone, m.slotGone);
        return askWindow(phone, draft.date!, "window", draft);
      }
      setStep(phone, "menu");
      say(phone, passReadyText(r.pass, useTemple.getState().config), undefined, { passId: r.pass.id });
      return sendOptionalInvite(phone);
    }
    case "reschedule-window": {
      const w = id.startsWith("win:") ? id.slice(4) : null;
      if (!w || !draft.passId || !draft.date) return say(phone, m.pickFromList);
      const r = await useTemple.getState().reschedulePass(draft.passId, draft.date, w);
      setStep(phone, "menu");
      if (!r.ok) return say(phone, m.reschedFail, [{ id: "mypass", label: m.bMyPass }]);
      return say(phone, m.reschedOk(draft.passId) + passReadyText(r.pass, useTemple.getState().config), undefined, { passId: r.pass.id });
    }
    default:
      return menu(phone);
  }
}
