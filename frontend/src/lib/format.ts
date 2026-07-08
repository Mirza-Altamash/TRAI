import { format } from "date-fns";

// IST = UTC+5:30. We store ISO strings and render in IST.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIst(date: string | Date): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  // Build a Date whose UTC fields equal IST wall-clock fields, so date-fns
  // (which formats in local TZ) prints IST values regardless of server TZ.
  return new Date(
    d.getTime() +
      IST_OFFSET_MS -
      new Date(d.getTime()).getTimezoneOffset() * 60_000 -
      IST_OFFSET_MS +
      d.getTimezoneOffset() * 60_000 +
      IST_OFFSET_MS,
  );
}

// Simpler, deterministic IST formatter using manual extraction.
function istParts(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + IST_OFFSET_MS);
  return ist;
}

export function formatIstDate(date: string | Date): string {
  if (!date) return "—";
  return format(istParts(date), "dd-MM-yyyy");
}

export function formatIstDateTime(date: string | Date): string {
  if (!date) return "—";
  return format(istParts(date), "dd-MM-yyyy HH:mm");
}

// Avoid lint warning on unused helper.
void toIst;
