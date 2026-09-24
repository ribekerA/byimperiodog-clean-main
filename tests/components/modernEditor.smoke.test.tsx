import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ModernEditor } from '@/components/blog/ModernEditor';

(globalThis as unknown as { React: typeof React }).React = React;
afterEach(cleanup);
it('renderiza conteúdo e links e aceita atualização externa após atualizar Tiptap', async () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<ModernEditor content='<p>Texto <a href="https://example.com">referência</a></p>' onChange={onChange} />);
  await waitFor(() => expect(container.querySelector('.tiptap')).not.toBeNull());
  expect(container.querySelector('.tiptap a')?.getAttribute('href')).toBe('https://example.com');
  rerender(<ModernEditor content="<h2>Revisão</h2><p>Conteúdo atualizado</p>" onChange={onChange} />);
  await waitFor(() => expect(container.querySelector('.tiptap h2')?.textContent).toBe('Revisão'));
});
