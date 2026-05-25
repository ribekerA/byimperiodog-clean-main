export function adminFocusRing(extra?: string) {
  return [
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
