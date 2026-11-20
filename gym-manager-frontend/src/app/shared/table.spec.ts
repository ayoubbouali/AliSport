import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { TableState } from './table';

interface Row { code: string; name: string; price: number; active: boolean; }

const rows: Row[] = [
  { code: 'A001', name: 'Alaoui', price: 450, active: true },
  { code: 'A002', name: 'Élodie', price: 675, active: false },
  { code: 'A003', name: 'Idrissi', price: 3213, active: true },
];

function table(pageSize = 20) {
  const t = new TableState<Row>({
    searchText: (r) => `${r.code} ${r.name}`,
    sort: { code: (r) => r.code, price: (r) => r.price },
    defaultSort: { key: 'code', dir: 'asc' },
    isActive: (r) => r.active,
    pageSize: signal(pageSize),
  });
  t.rows.set(rows);
  return t;
}

describe('TableState', () => {
  it('masque les inactifs par défaut', () => {
    const t = table();
    expect(t.filtered().map((r) => r.code)).toEqual(['A001', 'A003']);
    t.showInactive.set(true);
    expect(t.filtered()).toHaveLength(3);
  });

  it('recherche sans accents', () => {
    const t = table();
    t.showInactive.set(true);
    t.setSearch('elodie');
    expect(t.filtered().map((r) => r.code)).toEqual(['A002']);
  });

  it('tri par colonne, ascendant puis descendant', () => {
    const t = table();
    t.toggleSort('price');
    expect(t.filtered().map((r) => r.price)).toEqual([450, 3213]);
    t.toggleSort('price');
    expect(t.filtered().map((r) => r.price)).toEqual([3213, 450]);
    expect(t.ariaSort('price')).toBe('descending');
  });

  it('pagination', () => {
    const t = table(1);
    expect(t.pageCount()).toBe(2);
    expect(t.page().map((r) => r.code)).toEqual(['A001']);
    t.pageIndex.set(1);
    expect(t.page().map((r) => r.code)).toEqual(['A003']);
  });
});
