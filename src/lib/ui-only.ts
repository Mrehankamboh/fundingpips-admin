/** Local UI preview without Neon / real auth. */
export const UI_ONLY =
  process.env.NEXT_PUBLIC_UI_ONLY === "1" ||
  process.env.UI_ONLY === "1";
