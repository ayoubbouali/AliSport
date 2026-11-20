import { Component, ElementRef, computed, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LucideAngularModule } from 'lucide-angular';
import { norm } from '../core/format';

export interface SelectOption {
  id: number;
  label: string;
  color?: string;
  /** Inactive items are not proposed, but stay displayed when already selected. */
  disabled?: boolean;
  hint?: string;
}

/** Multiple selection with search (chips + autocomplete), usable with reactive forms. */
@Component({
  selector: 'app-multi-select',
  imports: [MatFormFieldModule, MatChipsModule, MatAutocompleteModule, LucideAngularModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiSelect), multi: true }],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <mat-chip-grid #grid [attr.aria-label]="label()" [disabled]="disabled()">
        @for (o of selectedOptions(); track o.id) {
          <mat-chip-row (removed)="remove(o.id)" [class.chip-inactive]="o.disabled">
            @if (o.color) {<i class="dot" [style.background]="o.color"></i>}
            {{ o.label }}
            <button matChipRemove [attr.aria-label]="'Retirer ' + o.label"><lucide-icon name="x" [size]="14" /></button>
          </mat-chip-row>
        }
        <input #search [placeholder]="selectedOptions().length ? '' : placeholder()" [matChipInputFor]="grid" [matAutocomplete]="auto"
               (input)="query.set(search.value)" (blur)="touched()" />
      </mat-chip-grid>
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="pick($event)" autoActiveFirstOption>
        @for (o of available(); track o.id) {
          <mat-option [value]="o.id">
            @if (o.color) {<i class="dot" [style.background]="o.color"></i>}
            {{ o.label }} @if (o.hint) {<small class="muted"> · {{ o.hint }}</small>}
          </mat-option>
        } @empty {
          <mat-option disabled>Aucun résultat</mat-option>
        }
      </mat-autocomplete>
      @if (hint()) {<mat-hint>{{ hint() }}</mat-hint>}
    </mat-form-field>
  `,
})
export class MultiSelect implements ControlValueAccessor {
  label = input('');
  placeholder = input('Rechercher…');
  hint = input('');
  options = input<SelectOption[]>([]);

  value = signal<number[]>([]);
  query = signal('');
  disabled = signal(false);
  private searchEl = viewChild<ElementRef<HTMLInputElement>>('search');

  selectedOptions = computed(() =>
    this.value().map((id) => this.options().find((o) => o.id === id)).filter((o): o is SelectOption => !!o));
  available = computed(() => {
    const q = norm(this.query());
    return this.options().filter((o) => !o.disabled && !this.value().includes(o.id) && (!q || norm(o.label).includes(q)));
  });

  private onChange: (v: number[]) => void = () => {};
  touched: () => void = () => {};

  pick(e: MatAutocompleteSelectedEvent): void {
    this.set([...this.value(), e.option.value as number]);
    const el = this.searchEl()?.nativeElement;
    if (el) el.value = '';
    this.query.set('');
  }

  remove(id: number): void {
    this.set(this.value().filter((v) => v !== id));
  }

  private set(v: number[]): void {
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: number[] | null): void {
    this.value.set(v ?? []);
  }
  registerOnChange(fn: (v: number[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }
}
