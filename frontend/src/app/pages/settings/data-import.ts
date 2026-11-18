import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { ConfigService } from '../../core/config.service';
import { FrDatePipe, MoneyPipe, PAYMENT_METHODS } from '../../core/format';
import { NotifyService, errorMessage } from '../../core/notify.service';
import { openSimpleForm } from '../../shared/simple-form-dialog';

interface Issue { sheet: string | null; row: number | null; message: string; }
interface ImportReport {
  executed: boolean; fileName: string;
  sheets: { name: string; role: string; rows: number }[];
  counts: { functions: number; durations: number; discounts: number; staff: number; sports: number; packs: number; members: number;
    periods: number; historyPeriods: number; payments: number; paidAmount: number; unpaidInvoices: number; outstanding: number };
  sports: { code: string; name: string; coaches: string[]; scheduleRaw: string; schedule: string; capacity: number; monthlyPrice: number }[];
  staff: string[];
  members: { code: string; name: string; phone: string; sports: string[]; pack: string; start: string; end: string; price: number;
    historyPeriods: number; paid: number; balance: number }[];
  warnings: Issue[]; errors: Issue[]; existing: Record<string, number>;
}

const EXISTING_LABELS: Record<string, string> = {
  members: 'adhérent(s)', payments: 'paiement(s)', sports: 'sport(s)', staff: 'membre(s) du personnel', packs: 'pack(s)',
  activities: 'activité(s)', salaryPayments: 'versement(s) de salaire',
};

/** Paramètres › Données: Excel import (analyse, then creation) and full reset. */
@Component({
  selector: 'app-data-import',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, LucideAngularModule, MoneyPipe, FrDatePipe],
  template: `
    <section class="data-section">
      <h3><lucide-icon name="file-spreadsheet" [size]="18" /> Importer un fichier Excel</h3>
      <p class="muted">Initialise toutes les données du club à partir d'un classeur au format de l'ancien fichier <b>Gym_Manager.xlsx</b> :
        feuilles <b>Sports</b> (sports, coachs, horaires, capacité, prix), <b>Adhérents</b> (identité, sport(s), dates d'inscription et de fin, prix mensuel)
        et, si présentes, <b>Factures</b> (deviennent des paiements avec reçus) et <b>Personnel</b>. Les colonnes sont reconnues par leur titre.
        L'analyse ne modifie rien : elle montre ce qui sera créé avant de confirmer.</p>

      <div class="import-form">
        <label class="photo-btn file-pick">
          <lucide-icon name="upload" [size]="16" /> {{ file() ? file()!.name : 'Choisir un fichier .xlsx…' }}
          <input type="file" accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr-only" (change)="pick($event)" />
        </label>
        <div class="field-block">
          <span class="field-label">Mode des factures payées</span>
          <mat-button-toggle-group [(ngModel)]="method" aria-label="Mode de paiement par défaut">
            @for (m of methods; track m.value) {<mat-button-toggle [value]="m.value">{{ m.label }}</mat-button-toggle>}
          </mat-button-toggle-group>
        </div>
        <div class="field-block">
          <span class="field-label">Assurance (absente du fichier)</span>
          <mat-button-toggle-group [(ngModel)]="insurance" aria-label="Assurance par défaut">
            <mat-button-toggle value="IMPAYE">Impayé</mat-button-toggle><mat-button-toggle value="PAYE">Payé</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
        <button mat-flat-button (click)="analyze()" [disabled]="!file() || busy()"><lucide-icon name="search" [size]="16" /> Analyser le fichier</button>
      </div>
      @if (error()) {<p class="form-error" role="alert">{{ error() }}</p>}

      @if (report(); as r) {
        @if (r.executed) {
          <div class="note ok-note"><lucide-icon name="circle-check" [size]="18" /> Import terminé : {{ r.counts.members }} adhérents, {{ r.counts.sports }} sports,
            {{ r.counts.payments }} paiements ({{ r.counts.paidAmount | money }}) créés à partir de « {{ r.fileName }} ».</div>
        }
        <div class="import-kpis">
          <div><b>{{ r.counts.sports }}</b><span>sports</span></div>
          <div><b>{{ r.counts.staff }}</b><span>coachs / personnel</span></div>
          <div><b>{{ r.counts.packs }}</b><span>packs</span></div>
          <div><b>{{ r.counts.members }}</b><span>adhérents</span></div>
          <div><b>{{ r.counts.periods }}</b><span>périodes d'abonnement</span></div>
          <div><b>{{ r.counts.payments }}</b><span>paiements · {{ r.counts.paidAmount | money: 0 }}</span></div>
          <div><b>{{ r.counts.outstanding | money: 0 }}</b><span>reste à encaisser</span></div>
        </div>
        <p class="muted small">Créés aussi : fonctions (Coach, Accueil, Entretien), {{ r.counts.durations }} durées, {{ r.counts.discounts }} remises (« Aucune » par défaut).
          Comptes utilisateurs, paramètres et logo sont conservés.</p>

        <details open>
          <summary>Feuilles du classeur</summary>
          <table class="table compact"><thead><tr><th>Feuille</th><th>Utilisation</th><th class="num">Lignes reprises</th></tr></thead>
            <tbody>@for (s of r.sheets; track s.name) {<tr [class.inactive]="s.role.startsWith('Ignorée')"><td class="strong">{{ s.name }}</td><td>{{ s.role }}</td><td class="num">{{ s.rows || '—' }}</td></tr>}</tbody></table>
        </details>
        <details>
          <summary>Sports ({{ r.sports.length }}) et coachs ({{ r.staff.length }})</summary>
          <table class="table compact"><thead><tr><th>ID</th><th>Sport</th><th>Coach(s)</th><th>Horaires du fichier</th><th>Créneaux créés</th><th class="num">Capacité</th><th class="num">Prix / mois</th></tr></thead>
            <tbody>@for (s of r.sports; track s.name) {<tr><td class="code">{{ s.code }}</td><td class="strong">{{ s.name }}</td><td>{{ s.coaches.join(', ') || '—' }}</td>
              <td class="muted">{{ s.scheduleRaw || '—' }}</td><td>{{ s.schedule || '—' }}</td><td class="num">{{ s.capacity }}</td><td class="num">{{ s.monthlyPrice | money }}</td></tr>}</tbody></table>
          <p class="muted small">Personnel : {{ r.staff.join(' · ') || 'aucun' }}</p>
        </details>
        <details>
          <summary>Adhérents ({{ r.members.length }})</summary>
          <div class="scroll-x"><table class="table compact"><thead><tr><th>ID</th><th>Adhérent</th><th>Sport(s)</th><th>Abonnement</th><th>Période</th><th class="num">Périodes ajoutées</th><th class="num">Payé</th><th class="num">Reste</th></tr></thead>
            <tbody>@for (m of r.members; track $index) {<tr><td class="code">{{ m.code }}</td><td class="strong">{{ m.name }}</td><td>{{ m.sports.join(', ') }}</td>
              <td>{{ m.pack }}</td><td>{{ m.start | frDate }} → {{ m.end | frDate }}</td><td class="num">{{ m.historyPeriods }}</td>
              <td class="num">{{ m.paid | money }}</td><td class="num" [class.red]="m.balance > 0">{{ m.balance | money }}</td></tr>}</tbody></table></div>
        </details>
        @if (r.errors.length) {
          <details open class="issues errors">
            <summary><lucide-icon name="circle-alert" [size]="16" /> {{ r.errors.length }} ligne(s) ignorée(s)</summary>
            <ul>@for (e of r.errors; track $index) {<li>@if (e.sheet) {<b>{{ e.sheet }}{{ e.row ? ', ligne ' + e.row : '' }} :</b> }{{ e.message }}</li>}</ul>
          </details>
        }
        @if (r.warnings.length) {
          <details class="issues">
            <summary><lucide-icon name="triangle-alert" [size]="16" /> {{ r.warnings.length }} avertissement(s) — données ajustées</summary>
            <ul>@for (w of r.warnings; track $index) {<li>@if (w.sheet) {<b>{{ w.sheet }}{{ w.row ? ', ligne ' + w.row : '' }} :</b> }{{ w.message }}</li>}</ul>
          </details>
        }

        @if (!r.executed) {
          <div class="danger-box">
            <p><b>Toutes les données actuelles seront supprimées</b> puis remplacées par celles du fichier{{ existingText() ? ' : ' + existingText() : '' }}.
              Cette action est irréversible.</p>
            <div class="row-start">
              <mat-form-field subscriptSizing="dynamic" class="w-320"><mat-label>Tapez SUPPRIMER pour confirmer</mat-label>
                <input matInput [(ngModel)]="confirmText" autocomplete="off" /></mat-form-field>
              <button mat-flat-button class="btn-danger" (click)="execute()" [disabled]="busy() || confirmText.trim().toUpperCase() !== 'SUPPRIMER' || !r.counts.members && !r.counts.sports">
                <lucide-icon name="database" [size]="16" /> Importer et remplacer les données
              </button>
            </div>
          </div>
        }
      }
    </section>

    <section class="data-section">
      <h3><lucide-icon name="trash-2" [size]="18" /> Réinitialiser les données</h3>
      <p class="muted">Supprime adhérents, paiements, sports, personnel, packs, remises, durées, activités et paie, et remet les numéros à zéro.
        Les données de base (fonctions, durées, remises) sont recréées ; les comptes utilisateurs, les paramètres et le logo sont conservés.</p>
      <button mat-stroked-button class="btn-outline-danger" (click)="wipe()"><lucide-icon name="trash-2" [size]="16" /> Effacer toutes les données…</button>
    </section>
  `,
})
export class DataImport {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private config = inject(ConfigService);
  methods = PAYMENT_METHODS;
  file = signal<File | null>(null);
  report = signal<ImportReport | null>(null);
  busy = signal(false);
  error = signal('');
  method = 'ESPECES';
  insurance = 'IMPAYE';
  confirmText = '';

  existingText = computed(() => {
    const e = this.report()?.existing ?? {};
    return Object.entries(e).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${EXISTING_LABELS[k] ?? k}`).join(', ');
  });

  pick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
    input.value = '';
    this.report.set(null);
    this.error.set('');
  }

  private form(): FormData {
    const fd = new FormData();
    fd.append('file', this.file()!);
    fd.append('paymentMethod', this.method);
    fd.append('insurance', this.insurance);
    return fd;
  }

  async analyze(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.confirmText = '';
    try {
      this.report.set(await this.api.postForm<ImportReport>('/data/import/analyze', this.form()));
    } catch (e) {
      this.report.set(null);
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  async execute(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const fd = this.form();
      fd.append('confirm', this.confirmText.trim());
      this.report.set(await this.api.postForm<ImportReport>('/data/import/execute', fd));
      await this.config.load();
      this.notify.success('Import terminé : les données du fichier ont été créées.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  async wipe(): Promise<void> {
    const summary = await this.api.get<Record<string, number>>('/data/summary');
    const text = Object.entries(summary).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${EXISTING_LABELS[k] ?? k}`).join(', ') || 'aucune donnée';
    const ok = await openSimpleForm(this.dialog, {
      title: 'Effacer toutes les données du club ?',
      fields: [{ key: 'confirm', label: 'Tapez SUPPRIMER pour confirmer', required: true, hint: `Sera supprimé : ${text}. Irréversible.` }],
      value: { confirm: '' },
      submit: (v) => this.api.post('/data/wipe', { confirm: v['confirm'] }),
    });
    if (ok) {
      this.report.set(null);
      this.notify.success('Toutes les données du club ont été effacées.');
    }
  }
}
