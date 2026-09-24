/** HTTP 200 alone is not evidence of a saved contact. Never infer a conversion. */
export async function confirmedLeadId(response: Response): Promise<string> {
  if (!response.ok) throw new Error('Não foi possível confirmar o cadastro. Tente novamente.');
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('ok' in body) || body.ok !== true ||
      !('id' in body) || typeof body.id !== 'string' || !body.id.trim()) {
    throw new Error('Não foi possível confirmar o cadastro. Tente novamente.');
  }
  return body.id;
}
