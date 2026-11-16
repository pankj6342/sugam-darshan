"use client";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Emblem } from "@/components/Emblem";
import { PassCard } from "@/components/PassCard";
import { Button, Card, Note } from "@/components/ui";
import { handleInput } from "@/lib/bot";
import { DEMO_WA_PHONE, MANDAL_NAME_HI } from "@/lib/config";
import { reportTime } from "@/lib/slots";
import { useTemple } from "@/lib/temple-store";
import { fmtTime, ymd } from "@/lib/time";
import type { WaButton, WaMessage } from "@/lib/types";

/** Render WhatsApp-style *bold* and line breaks. */
function waText(s: string): ReactNode {
  return s.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, j) => (part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <b key={j}>{part.slice(1, -1)}</b> : part))}
    </Fragment>
  ));
}

const time = (ts: number) => new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export function WhatsAppSim() {
  const [phone, setPhone] = useState(DEMO_WA_PHONE);
  const [phoneDraft, setPhoneDraft] = useState(DEMO_WA_PHONE);
  const messages = useTemple((s) => s.messages);
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const clearChat = useTemple((s) => s.clearChat);
  const sendDueReminders = useTemple((s) => s.sendDueReminders);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const thread = messages.filter((m) => m.phone === phone);
  // Buttons stay tappable on every bot message after the user's last reply.
  const lastUserIdx = thread.map((m) => m.from).lastIndexOf("user");

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [thread.length, busy]);

  // Reminder scheduler (BRD A-05): checks for passes ~30 min before reporting.
  useEffect(() => {
    sendDueReminders();
    const id = setInterval(() => sendDueReminders(), 15000);
    return () => clearInterval(id);
  }, [sendDueReminders]);

  async function send(input: Parameters<typeof handleInput>[1]) {
    if (busy) return;
    setBusy(true);
    try {
      await handleInput(phone, input);
    } finally {
      setBusy(false);
    }
  }

  function tapButton(b: WaButton) {
    if (b.id === "yatra:open") {
      useTemple.getState().pushMessage({ phone, from: "user", text: b.label });
      window.open(`/yatra?src=wa&d=${ymd()}`, "_blank");
      return;
    }
    send({ buttonId: b.id, buttonLabel: b.label });
  }

  function demoReminderNow() {
    const p = [...passes].reverse().find((x) => x.mobile === phone && x.status === "active" && x.date === ymd());
    if (!p) return alert("No active pass for today on this number. Book one first.");
    useTemple.getState().pushMessage({
      phone,
      from: "bot",
      kind: "reminder",
      text: `🔔 *दर्शन स्मरण* — जय श्री सांवलिया सेठ!\n\nआपका सुगम दर्शन बैच जल्द आने वाला है।\nपास: ${p.id} · ${p.groupSize} व्यक्ति\nरिपोर्टिंग समय: *${fmtTime(reportTime(p, cfg), "hi")}*\n\nकृपया अपना QR पास तैयार रखें।`,
      buttons: [{ id: "mypass", label: "मेरा पास देखें" }],
    });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[420px_1fr]">
      {/* Phone */}
      <div className="mx-auto w-full max-w-[420px]">
        <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
          <div className="flex items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
            <Emblem size={36} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1 truncate text-[15px] font-semibold">
                {MANDAL_NAME_HI}
                <span title="Verified business" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] text-[#075e54]">
                  ✓
                </span>
              </div>
              <div className="text-xs text-emerald-100">{busy ? "typing…" : "Official business account"}</div>
            </div>
          </div>
          <div ref={scroller} className="wa-wall h-[600px] space-y-2 overflow-y-auto px-3 py-3">
            <div className="mx-auto w-fit rounded-lg bg-[#fff3c4] px-3 py-1.5 text-center text-[11px] text-stone-700 shadow-sm">
              🔒 संदेश केवल मंदिर मंडल की सुगम दर्शन सेवा के लिए उपयोग होते हैं
            </div>
            {thread.length === 0 && (
              <div className="mx-auto mt-10 max-w-[260px] rounded-lg bg-white/90 p-3 text-center text-sm text-stone-600 shadow-sm">
                Type <b>Hi</b> or <b>जय श्री सांवलिया सेठ</b> to start
              </div>
            )}
            {thread.map((m, i) => (
              <Bubble key={m.id} m={m} live={i > lastUserIdx} onTap={tapButton} disabled={busy} cfg={cfg} />
            ))}
            {busy && (
              <div className="w-fit rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-stone-400 shadow-sm">
                <span className="animate-pulse">● ● ●</span>
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 bg-[#f0f0f0] px-2 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              send({ text });
              setText("");
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="संदेश लिखें"
              className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-[15px] outline-none"
              aria-label="Message"
            />
            {text.trim() ? (
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-white" aria-label="Send">
                ➤
              </button>
            ) : (
              <button type="button" onClick={() => send({ voice: true })} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-white" aria-label="Voice note" title="Send a voice note">
                🎤
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Presenter panel */}
      <div className="space-y-4">
        <Card className="p-5">
          <h1 className="text-xl font-bold">Hindi WhatsApp booking assistant</h1>
          <p className="mt-1 text-sm text-stone-600">
            Simulates the verified Mandal WhatsApp number (BRD A-03). Devotees tap reply buttons or send numbers — no English typing. The same conversation engine would sit behind a WhatsApp Business API webhook in the pilot.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Send <b>Hi</b> → book a free pass in ~6 taps</li>
            <li>Tap 🎤 to see the scoped voice-note fallback (human-assisted help)</li>
            <li>After the pass, one separate, optional Yatra message appears — never before</li>
            <li>Open the <a className="font-semibold text-saffron-700 underline" href="/control" target="_blank">Control room</a> in another tab and start a Bhog pause → a Hindi delay message arrives here</li>
          </ul>
        </Card>
        <Card className="space-y-3 p-5">
          <div className="text-sm font-semibold">Simulated devotee number</div>
          <div className="flex gap-2">
            <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono" />
            <Button tone="secondary" onClick={() => setPhone(phoneDraft)} disabled={phoneDraft.length !== 10}>
              Switch
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button tone="secondary" size="sm" onClick={demoReminderNow}>
              🔔 Send 30-min reminder now
            </Button>
            <Button tone="secondary" size="sm" onClick={() => clearChat(phone)}>
              Clear this chat
            </Button>
          </div>
          <Note tone="stone">Reminders also fire automatically ~30 minutes before the reporting time (checked every 15s while this tab is open), subject to WhatsApp template approval in production.</Note>
        </Card>
      </div>
    </div>
  );
}

function Bubble({ m, live, onTap, disabled, cfg }: { m: WaMessage; live: boolean; onTap: (b: WaButton) => void; disabled: boolean; cfg: ReturnType<typeof useTemple.getState>["config"] }) {
  const pass = useTemple((s) => (m.passId ? s.passes.find((p) => p.id === m.passId) : undefined));
  const mine = m.from === "user";
  const accent = m.kind === "ritual" ? "border-l-4 border-amber-500" : m.kind === "reminder" ? "border-l-4 border-sky-500" : m.kind === "optional-invite" ? "border-l-4 border-teal-500" : "";
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`max-w-[88%] rounded-lg px-2.5 pb-1 pt-1.5 text-[14.5px] leading-snug shadow-sm ${mine ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white"} ${accent}`}>
        {pass && (
          <div className="mb-2 w-[300px] max-w-full">
            <PassCard pass={pass} cfg={cfg} lang="hi" compact />
          </div>
        )}
        <div>{waText(m.text)}</div>
        <div className="mt-0.5 text-right text-[10px] text-stone-500">
          {time(m.at)} {mine && <span className="text-sky-500">✓✓</span>}
        </div>
      </div>
      {m.buttons && (
        <div className="mt-1 grid w-[88%] max-w-[320px] gap-1" style={{ gridTemplateColumns: m.buttons.length > 3 ? "1fr 1fr" : "1fr" }}>
          {m.buttons.map((b) => (
            <button
              key={b.id}
              disabled={!live || disabled}
              onClick={() => onTap(b)}
              className="rounded-lg bg-white px-2 py-2 text-center text-[13.5px] font-medium text-[#027eb5] shadow-sm disabled:text-stone-400"
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
