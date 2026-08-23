import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { usePuppyForm } from '@/components/puppies/usePuppyForm';

vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/adminFetch', () => ({ adminFetch: vi.fn(async () => ({ ok: true, json: async () => ({ id: '1'}) })) }));

describe('usePuppyForm', () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
    expect(result.current.values.nome).toBe('');
  });

  it('modo edit não reseta valores após submit e chama PUT', async () => {
    const onSuccess = vi.fn();
  const record = { id:'abc', nome:'Bolt', gender:'male' as const, status:'disponivel' as const, color:'Preto', price_cents: 250000, midia:[] as string[], nascimento:'2024-01-01' };
    const { result } = renderHook(() => usePuppyForm({ mode:'edit', record, onSuccess }));
    expect(result.current.isEdit).toBe(true);
    expect(result.current.values.nome).toBe('Bolt');
    act(()=> { result.current.set('color','Preto'); });
    await act(async ()=> { await result.current.submit(); });
    expect(onSuccess).toHaveBeenCalled();
    // Não reseta nome em modo edit
    expect(result.current.values.nome).toBe('Bolt');
  });

  it('valida URLs inválidas para imagem e vídeo', async () => {
    const { result } = renderHook(() => usePuppyForm({ mode:'create' }));
    act(()=> {
      result.current.set('nome','Rex');
      result.current.set('color','Branco');
      result.current.set('price_display','R$ 100,00');
      result.current.set('image_url','ftp://invalido');
      result.current.set('video_url','notaurl');
    });
    await act(async ()=> { await result.current.submit(); });
    expect(result.current.errors.image_url).toBe('URL inválida');
    expect(result.current.errors.video_url).toBe('URL inválida');
  });

  it('reordena mídia mantendo capa em primeiro', () => {
    const { result } = renderHook(() => usePuppyForm({ mode:'create' }));
    act(()=> {
      result.current.setMedia(['b.jpg','c.jpg','a.jpg']); // sem cover definido ainda -> primeira vira cover implícita
    });
    expect(result.current.values.midia[0]).toBe('b.jpg');
    act(()=> { result.current.setCover('c.jpg'); });
    expect(result.current.values.image_url).toBe('c.jpg');
    expect(result.current.values.midia[0]).toBe('c.jpg');
    // Agora reorganizar lista (simular drag) mantendo capa
    act(()=> { result.current.setMedia(['a.jpg','b.jpg','c.jpg']); });
    // setMedia deve recolocar cover no índice 0
    expect(result.current.values.midia[0]).toBe('c.jpg');
  });
});
