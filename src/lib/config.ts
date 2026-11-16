import type { OpsConfig, Role } from "./types";

export const DEFAULT_CONFIG: OpsConfig = {
  batchSize: 100,
  intervalMin: 10,
  reportLeadMin: 15,
  lateGraceMin: 45,
  maxGroupSize: 6,
  pilotCapPct: 20,
  offlineMaxAgeMin: 30,
  pauseDefaultMin: 30,
  demoAllowToday: true,
};

/**
 * Darshan windows the digital lane offers. ILLUSTRATIVE — must be replaced with the
 * Mandal-approved schedule (BRD 8.2 dependency: "ritual timings").
 */
export const DARSHAN_WINDOWS: { start: string; end: string }[] = [
  { start: "06:00", end: "07:00" },
  { start: "07:00", end: "08:00" },
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "14:30", end: "15:30" },
  { start: "15:30", end: "16:30" },
  { start: "16:30", end: "17:30" },
  { start: "17:30", end: "18:30" },
  { start: "18:30", end: "19:30" },
  { start: "19:30", end: "20:30" },
  { start: "20:30", end: "21:30" },
  { start: "21:30", end: "22:30" },
];

export const AARTI_SCHEDULE = [
  { time: "05:30", hi: "मंगला आरती", gu: "મંગળા આરતી", en: "Mangla Aarti" },
  { time: "07:30", hi: "श्रृंगार दर्शन", gu: "શૃંગાર દર્શન", en: "Shringar Darshan" },
  { time: "12:00", hi: "राजभोग (दर्शन बंद 12:00–14:30)", gu: "રાજભોગ (દર્શન બંધ 12:00–14:30)", en: "Rajbhog (darshan closed 12:00–2:30)" },
  { time: "18:45", hi: "संध्या आरती", gu: "સંધ્યા આરતી", en: "Sandhya Aarti" },
  { time: "23:00", hi: "शयन आरती", gu: "શયન આરતી", en: "Shayan Aarti" },
];

export const ROLE_LABEL: Record<Role, string> = {
  ceo: "CEO, Mandir Mandal",
  manager: "Mandir Manager",
  police: "Police / Security Command",
  gate_lead: "Gate Lead",
  trustee: "Trustee (Atithi portal)",
  operator: "Technology Operator (view only)",
};

export const PERMS = {
  configure: ["ceo"] as Role[],
  pause: ["ceo", "manager"] as Role[],
  openFlow: ["ceo", "police"] as Role[],
  guestPass: ["ceo", "trustee"] as Role[],
};

export const KENDRA_VOLUNTEERS = ["Ramesh ji (Seva Dal)", "Sunita ji (Seva Dal)", "Mahesh ji (Seva Dal)"];

export const SAHAYATA_KENDRA_LOCATION_HI = "मुख्य पार्किंग के पास, सुगम दर्शन सहायता केंद्र";
export const REPORTING_POINT_HI = "सुगम दर्शन लेन — रिपोर्टिंग पॉइंट (गेट नं. 2 के पास)";
export const REPORTING_POINT_EN = "Sugam Darshan lane reporting point (near Gate 2)";
export const REPORTING_POINT_GU = "સુગમ દર્શન લેન — રિપોર્ટિંગ પોઈન્ટ (ગેટ નં. 2 પાસે)";
export const SAHAYATA_KENDRA_LOCATION_GU = "મુખ્ય પાર્કિંગ પાસે, સુગમ દર્શન સહાયતા કેન્દ્ર";

export const MANDAL_NAME_HI = "श्री सांवलिया सेठ मंदिर मंडल";
export const MANDAL_NAME_EN = "Shri Sanwaliya Seth Mandir Mandal";
export const MANDAL_PLACE_HI = "मंडफिया, चित्तौड़गढ़ (राज.)";
export const MANDAL_NAME_GU = "શ્રી સાંવલિયા શેઠ મંદિર મંડળ";
export const MANDAL_PLACE_GU = "મંડફિયા, ચિત્તોડગઢ (રાજ.)";

export const DEMO_WA_PHONE = "9876543210";
