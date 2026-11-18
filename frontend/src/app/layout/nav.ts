export interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

/** Menu groups (also used by the dashboard shortcuts). */
export const NAV: NavGroup[] = [
  { label: null, items: [{ path: '/', label: 'Accueil', icon: 'house' }] },
  {
    label: 'Adhérents',
    items: [
      { path: '/adherents', label: 'Adhérents', icon: 'users' },
      { path: '/fiche', label: 'Fiche adhérent', icon: 'id-card' },
      { path: '/packs', label: 'Packs', icon: 'ticket' },
      { path: '/remises', label: 'Remises & durées', icon: 'badge-percent' },
    ],
  },
  {
    label: 'Club',
    items: [
      { path: '/sports', label: 'Sports', icon: 'dumbbell' },
      { path: '/activites', label: 'Activités', icon: 'calendar-days' },
      { path: '/personnel', label: 'Personnel', icon: 'briefcase', adminOnly: true },
      { path: '/paie', label: 'Paie du personnel', icon: 'hand-coins', adminOnly: true },
    ],
  },
  {
    label: 'Suivi',
    items: [
      { path: '/paiements', label: 'Paiements', icon: 'wallet' },
      { path: '/alertes', label: 'Alertes', icon: 'triangle-alert' },
      { path: '/statistiques', label: 'Statistiques', icon: 'chart-column', adminOnly: true },
    ],
  },
  { label: null, items: [{ path: '/parametres', label: 'Paramètres', icon: 'settings', adminOnly: true }] },
];
