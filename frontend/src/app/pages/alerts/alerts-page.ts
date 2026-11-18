import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { ConfigService } from '../../core/config.service';
import { exportCsv } from '../../core/csv';
import { FrDatePipe, MoneyPipe, SITUATION_LABELS, formatDate } from '../../core/format';
import { csvNumber } from '../../core/csv';
import { AlertRow, Alerts } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { SituationBadge } from '../../shared/badges';
import { Pager, SortHeader, TableState } from '../../shared/table';

@Component({
  selector: 'app-alerts',
  imports: [RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule, LucideAngularModule,
    SortHeader, Pager, SituationBadge, FrDatePipe, MoneyPipe],
  template: `
    <div class="kpis">
      <div class="kpi-card"><span class="kpi-icon red"><lucide-icon name="triangle-alert" /></span>
        <span><span class="kpi-label">Adhérents en alerte</span><span class="kpi-value red">{{ data()?.alertCount ?? '…' }}</span></span></div>
      <div class="kpi-card"><span class="kpi-icon amber"><lucide-icon name="hourglass" /></span>
        <span><span class="kpi-label">Expirent sous {{ data()?.soonThreshold }} j</span><span class="kpi-value">{{ count('SOON') }}</span></span></div>
      <div class="kpi-card"><span class="kpi-icon blue"><lucide-icon name="calendar-clock" /></span>
        <span><span class="kpi-label">À suivre (≤ {{ data()?.followThreshold }} j)</span><span class="kpi-value">{{ count('FOLLOW') }}</span></span></div>
    </div>
    <div class="toolbar">
      <label class="search grow"><lucide-icon name="search" [size]="18" />
        <input type="search" placeholder="Rechercher un adhérent" [ngModel]="t.search()" (ngModelChange)="t.setSearch($event)" aria-label="Rechercher un adhérent" /></label>
      <mat-form-field subscriptSizing="dynamic" class="w-220"><mat-label>Situation</mat-label>
        <mat-select [ngModel]="fSituation()" (ngModelChange)="fSituation.set($event); t.resetPage()">
          <mat-option [value]="null">Toutes</mat-option>
          @for (s of situations; track s) {<mat-option [value]="s">{{ labels[s] }}</mat-option>}
        </mat-select>
      </mat-form-field>
      <button mat-stroked-button (click)="csv()"><lucide-icon name="download" [size]="16" /> CSV</button>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th [attr.aria-sort]="t.ariaSort('code')"><app-sort [table]="t" key="code">ID</app-sort></th>
          <th [attr.aria-sort]="t.ariaSort('name')"><app-sort [table]="t" key="name">Adhérent</app-sort></th>
          <th>Téléphone</th>
          <th [attr.aria-sort]="t.ariaSort('end')"><app-sort [table]="t" key="end">Fin calculée</app-sort></th>
          <th class="num" [attr.aria-sort]="t.ariaSort('days')"><app-sort [table]="t" key="days">Jours</app-sort></th>
          <th>Situation</th>
          <th class="num" [attr.aria-sort]="t.ariaSort('balance')"><app-sort [table]="t" key="balance">Reste à payer</app-sort></th>
          <th>Message proposé</th><th>Envoyer</th>
        </tr></thead>
        <tbody>
          @for (r of t.page(); track r.id) {
            <tr>
              <td><a class="code-link" [routerLink]="['/fiche', r.code]">{{ r.code }}</a></td>
              <td class="strong">{{ r.firstName }} {{ r.lastName }}</td>
              <td>{{ r.phone }}</td>
              <td>{{ r.endDate | frDate }}</td>
              <td class="num" [class.red]="r.remainingDays < 0">{{ r.remainingDays }}</td>
              <td><app-situation-badge [value]="r.situation" /></td>
              <td class="num" [class.red]="r.balance > 0">{{ r.balance > 0 ? (r.balance | money) : '—' }}</td>
              <td class="msg" [matTooltip]="r.message">{{ r.message || '—' }}</td>
              <td>
                @if (r.whatsappLink) {
                  <a mat-flat-button class="btn-wa sm" [href]="r.whatsappLink" target="_blank" rel="noopener" [attr.aria-label]="'Envoyer un message WhatsApp à ' + r.firstName + ' ' + r.lastName">
                    <lucide-icon name="message-circle" [size]="16" /> WhatsApp
                  </a>
                }
              </td>
            </tr>
          } @empty {<tr><td colspan="9" class="empty">Aucun adhérent.</td></tr>}
        </tbody>
      </table>
    </div>
    <app-pager [table]="t" />
  `,
})
export class AlertsPage {
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private config = inject(ConfigService);
  data = signal<Alerts | null>(null);
  fSituation = signal<string | null>(null);
  situations = ['EXPIRED', 'SOON', 'FOLLOW', 'OK'];
  labels = SITUATION_LABELS;

  t = new TableState<AlertRow>({
    searchText: (r) => `${r.code} ${r.firstName} ${r.lastName} ${r.phone}`,
    sort: { code: (r) => r.code, name: (r) => `${r.firstName} ${r.lastName}`, end: (r) => r.endDate, days: (r) => r.remainingDays, balance: (r) => r.balance },
    defaultSort: { key: 'days', dir: 'asc' },
    filter: () => {
      const s = this.fSituation();
      return (r) => !s || r.situation === s;
    },
    pageSize: computed(() => this.config.pageSize()),
  });

  constructor() {
    this.api.alerts().then((d) => {
      this.data.set(d);
      this.t.rows.set(d.rows);
    }, (e) => this.notify.error(e));
  }

  count(s: string): number {
    return this.data()?.rows.filter((r) => r.situation === s).length ?? 0;
  }

  csv(): void {
    exportCsv('alertes', [
      { header: 'ID', value: (r) => r.code }, { header: 'Adhérent', value: (r) => `${r.firstName} ${r.lastName}` },
      { header: 'Téléphone', value: (r) => r.phone }, { header: 'Fin calculée', value: (r) => formatDate(r.endDate) },
      { header: 'Jours', value: (r) => r.remainingDays }, { header: 'Situation', value: (r) => SITUATION_LABELS[r.situation] },
      { header: 'Reste à payer', value: (r) => csvNumber(r.balance) }, { header: 'Message', value: (r) => r.message },
    ], this.t.filtered());
  }
}
