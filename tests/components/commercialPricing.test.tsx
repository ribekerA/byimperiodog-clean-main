import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PrecoFilhote, TabelaPrecos } from '@/components/blog/CommercialPricing';

describe('Preços comerciais nos artigos', () => {
  afterEach(cleanup);
  it('substitui a tabela editorial pela consulta dos filhotes atuais', () => {
    render(<TabelaPrecos />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver fotos e vídeos na vitrine' })).toHaveAttribute('href', '/filhotes');
  });
  it('usa o valor atual da laranja fêmea no FAQ', () => {
    render(<PrecoFilhote cor="laranja" sexo="femea" />);
    expect(screen.getByText('R$ 7.500')).toBeInTheDocument();
  });
});
