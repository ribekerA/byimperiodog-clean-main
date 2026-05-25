declare module "canvas-confetti" {
  // Minimal type to satisfy TS without strict defs
  type ConfettiFn = (options?: Record<string, unknown>) => void;
  const confetti: ConfettiFn;
  export default confetti;
}
