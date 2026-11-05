import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TiltCard } from '@/components/motion/TiltCard';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('TiltCard preserva a imagem ao detectar o tipo de ponteiro', () => {
  it('não remonta conteúdo ao hidratar em touch nem ao alternar para mouse', () => {
    let change: ((event: { matches: boolean }) => void) | undefined;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(pointer: coarse)', media: query, onchange: null,
      addEventListener: (_type: string, listener: typeof change) => { if (query === '(pointer: coarse)') change = listener; },
      removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    const mounted = vi.fn();
    const unmounted = vi.fn();
    function Content() {
      useEffect(() => { mounted(); return unmounted; }, []);
      // Nó nativo intencional: este teste mede identidade/montagem, não otimização de imagens.
      // eslint-disable-next-line @next/next/no-img-element
      return <img alt="Filhote" src="/fixture.jpg" />;
    }
    render(<TiltCard><Content /></TiltCard>);
    const image = screen.getByAltText('Filhote');
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
    expect(change).toBeTypeOf('function');
    act(() => change?.({ matches: false }));
    expect(screen.getByAltText('Filhote')).toBe(image);
    act(() => change?.({ matches: true }));
    expect(screen.getByAltText('Filhote')).toBe(image);
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
  });
});
