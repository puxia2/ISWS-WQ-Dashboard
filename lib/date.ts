export function toMDY(dateTime: string): string | null {
  if (!dateTime) return null;
  const first = String(dateTime).trim().split(/\s+/)[0] || ""; // "10/1/2020"
  const [mRaw, dRaw, yRaw] = first.split("/");
  if (!mRaw || !dRaw || !yRaw) return null;
  const mm = mRaw.padStart(2, "0");
  const dd = dRaw.padStart(2, "0");
  const yyyy = yRaw; // year is always 4 digits
  return `${mm}/${dd}/${yyyy}`;
}

export function mdySortKey(mdy: string): number | null {
  // mdy: mm/dd/yyyy
  const [mm, dd, yyyy] = mdy.split("/");
  if (!mm || !dd || !yyyy) return null;
  const key = Number(`${yyyy}${mm}${dd}`);
  return Number.isFinite(key) ? key : null;
}

export function coerceNumber(x: unknown): number | null {
  if (x === null || x === undefined || x === "") return null;
  const n = typeof x === "number" ? x : Number(String(x).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
