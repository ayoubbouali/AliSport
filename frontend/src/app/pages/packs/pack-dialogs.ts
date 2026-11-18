import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { MoneyPipe } from '../../core/format';
import { DiscountView, DurationView, PackView, SportView } from '../../core/models';
import { NotifyService, errorMessage } from '../../core/notify.service';

export interface PackDialogData {
  pack?: PackView;
  sports: SportView[];
  durations: DurationView[];
  discounts: DiscountView[];
}

@Component({
  selector: 'app-pack-form',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MoneyPipe],
  template: `
    <h2 mat-dialog-title>{{ d.pack ? 'Modifier le pack ' + d.pack.code : 'Nouveau pack' }}</h2>
    <mat-dialog-content>
      <form id="pack-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field class="span-2"><mat-label>Nom du pack</mat-label><input matInput name="name" [(ngModel)]="v.name" required /></mat-form-field>
        <mat-form-field><mat-label>Sport</mat-label>
          <mat-select name="sport" [(ngModel)]="v.sportId" (ngModelChange)="onSport()" required>
            @for (s of sports; track s.id) {<mat-option [value]="s.id">{{ s.name }}</mat-option>}
          </mat-select>
        </mat-form-field>
        <mat-form-field><mat-label>Durée</mat-label>
          <mat-select name="duration" [(ngModel)]="v.durationId" (ngModelChange)="onDuration()" required>
            @for (x of durations; track x.id) {<mat-option [value]="x.id">{{ x.label }} ({{ x.months }} mois)</mat-option>}
          </mat-select>
        </mat-form-field>
        <mat-form-field><mat-label>Prix / mois</mat-label>
          <input matInput type="number" min="0" step="0.01" name="price" [(ngModel)]="v.monthlyPrice" (ngModelChange)="refresh()" required />
        </mat-form-field>
        <mat-form-field><mat-label>Remise vs mensuel</mat-label>
          <mat-select name="discount" [(ngModel)]="v.discountId" (ngModelChange)="refresh()">
            @for (x of discounts; track x.id) {<mat-option [value]="x.id">{{ x.name }}</mat-option>}
          </mat-select>
        </mat-form-field>
      </form>
      <div class="computed-box" aria-live="polite"><span class="muted">Prix total</span><b>{{ total() | money }}</b></div>
      @if (error()) {<p class="form-error" role="alert">{{ error() }}</p>}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button mat-flat-button type="submit" form="pack-form" [disabled]="busy()">Enregistrer</button>
    </mat-dialog-actions>
  `,
})
export class PackFormDialog {
  d = inject<PackDialogData>(MAT_DIALOG_DATA);
  private api = inject(ApiService);
  private ref = inject(MatDialogRef<PackFormDialog>);
  private notify = inject(NotifyService);
  sports = this.d.sports.filter((s) => s.active || s.id === this.d.pack?.sportId);
  durations = this.d.durations.filter((x) => x.active || x.id === this.d.pack?.durationId);
  discounts = this.d.discounts.filter((x) => x.active || x.id === this.d.pack?.discountId);
  v = {
    name: this.d.pack?.name ?? '',
    sportId: this.d.pack?.sportId ?? null as number | null,
    durationId: this.d.pack?.durationId ?? null as number | null,
    monthlyPrice: this.d.pack?.monthlyPrice ?? null as number | null,
    discountId: this.d.pack?.discountId ?? this.d.discounts.find((x) => x.system)?.id ?? null,
  };
  total = signal<number | null>(this.d.pack?.total ?? null);
  busy = signal(false);
  error = signal('');

  onSport(): void {
    const s = this.d.sports.find((x) => x.id === this.v.sportId);
    if (s && (this.v.monthlyPrice === null || !this.d.pack)) this.v.monthlyPrice = s.monthlyPrice;
    this.suggestName();
    this.refresh();
  }

  onDuration(): void {
    this.suggestName();
    this.refresh();
  }

  private suggestName(): void {
    const s = this.d.sports.find((x) => x.id === this.v.sportId);
    const du = this.d.durations.find((x) => x.id === this.v.durationId);
    if (!this.d.pack && s && du) this.v.name = `${s.name} - ${du.label}`;
  }

  async refresh(): Promise<void> {
    if (!this.v.durationId || this.v.monthlyPrice === null) return this.total.set(null);
    try {
      const r = await this.api.post<{ total: number }>('/packs/preview', { monthlyPrice: this.v.monthlyPrice, durationId: this.v.durationId, discountId: this.v.discountId });
      this.total.set(r.total);
    } catch {
      this.total.set(null);
    }
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.save('packs', this.d.pack?.id, this.v);
      this.notify.success(this.d.pack ? 'Pack modifié.' : 'Pack créé.');
      this.ref.close(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}

interface GenRow { include: boolean; durationId: number; label: string; months: number; name: string; discountId: number | null; monthlyPrice: number; }

/** "Générer les packs d'un sport": one pack per active duration, names editable. */
@Component({
  selector: 'app-generate-packs',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Générer les packs d'un sport</h2>
    <mat-dialog-content>
      <mat-form-field class="w-full"><mat-label>Sport</mat-label>
        <mat-select [(ngModel)]="sportId" (ngModelChange)="build()">
          @for (s of sports; track s.id) {<mat-option [value]="s.id">{{ s.name }} · {{ s.monthlyPrice }} / mois</mat-option>}
        </mat-select>
      </mat-form-field>
      @if (rows().length) {
        <table class="table compact">
          <thead><tr><th></th><th>Nom proposé</th><th>Durée</th><th>Prix / mois</th><th>Remise</th></tr></thead>
          <tbody>
            @for (r of rows(); track r.durationId) {
              <tr>
                <td><mat-checkbox [(ngModel)]="r.include" [aria-label]="'Inclure ' + r.label" /></td>
                <td><input class="cell-input" [(ngModel)]="r.name" [attr.aria-label]="'Nom du pack ' + r.label" /></td>
                <td>{{ r.label }}</td>
                <td><input class="cell-input num" type="number" min="0" step="0.01" [(ngModel)]="r.monthlyPrice" aria-label="Prix par mois" /></td>
                <td>
                  <select class="cell-input" [(ngModel)]="r.discountId" aria-label="Remise">
                    @for (x of discounts; track x.id) {<option [ngValue]="x.id">{{ x.name }}</option>}
                  </select>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="muted">Choisissez un sport : un pack sera proposé pour chaque durée active.</p>
      }
      @if (error()) {<p class="form-error" role="alert">{{ error() }}</p>}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button (click)="save()" [disabled]="busy() || !count()">Créer {{ count() }} pack(s)</button>
    </mat-dialog-actions>
  `,
})
export class GeneratePacksDialog {
  d = inject<PackDialogData>(MAT_DIALOG_DATA);
  private api = inject(ApiService);
  private ref = inject(MatDialogRef<GeneratePacksDialog>);
  private notify = inject(NotifyService);
  sports = this.d.sports.filter((s) => s.active);
  discounts = this.d.discounts.filter((x) => x.active);
  sportId: number | null = null;
  rows = signal<GenRow[]>([]);
  count = computed(() => this.rows().filter((r) => r.include).length);
  busy = signal(false);
  error = signal('');

  build(): void {
    const s = this.d.sports.find((x) => x.id === this.sportId);
    const none = this.d.discounts.find((x) => x.system)?.id ?? null;
    this.rows.set(s ? this.d.durations.filter((x) => x.active).map((du) => ({
      include: true, durationId: du.id, label: du.label, months: du.months, name: `${s.name} - ${du.label}`,
      discountId: none, monthlyPrice: s.monthlyPrice,
    })) : []);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const items = this.rows().filter((r) => r.include).map((r) => ({ durationId: r.durationId, name: r.name, discountId: r.discountId, monthlyPrice: r.monthlyPrice }));
      const r = await this.api.post<{ created: number }>('/packs/generate', { sportId: this.sportId, items });
      this.notify.success(`${r.created} pack(s) créé(s).`);
      this.ref.close(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
