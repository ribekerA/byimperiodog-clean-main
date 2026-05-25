import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePuppyForm } from '@/components/puppies/usePuppyForm';

// Mock toast
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ push: vi.fn() }) }));
// Mock adminFetch
vi.mock('@/lib/adminFetch', () => ({ adminFetch: vi.fn(async () => ({ ok: true, json: async () => ({ id: '1'}) })) }));
// Mock price parser (use real if exported, here we trust parseBRLToCents via full pipeline)

describe('usePuppyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa com valores padrão no modo create', () => {
    const { result } = renderHook(() => usePuppyForm({ mode: 'create' }));
    expect(result.current.values.nome).toBe('');
    expect(result.current.isEdit).toBe(false);
    expect(result.current.values.midia).toEqual([]);
  });

  it('valida campos obrigatórios e expõe erros', async () => {
    const { result } = renderHook(() => usePuppyForm({ mode: 'create' }));
    await act(async () => { await result.current.submit(); });
    expect(result.current.errors.nome).toBeDefined();
    expect(result.current.errors.color).toBeDefined();
    expect(result.current.errors.price_display).toBeDefined();
  });

  it('aceita fluxo de sucesso após preencher campos mínimos', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => usePuppyForm({ mode: 'create', onSuccess }));
    act(() => {
      result.current.set('nome','Rex');
      result.current.set('color','Branco');
      result.current.set('price_display','R$ 1.000,00');
    });
    await act(async () => { await result.current.submit(); });
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.values.nome).toBe(''); // reset após sucesso create
  });
});
