export function listMissingPrivate(vars: string[]): string[] {
  return vars.filter(v => !process.env[v]);
}

export function assertEnvPresent(vars: string[]) {
  const missing = listMissingPrivate(vars);
  if (missing.length) {

    console.warn('[env] Variáveis ausentes:', missing.join(', '));
  }
  return missing;
}
