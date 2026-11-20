import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { norm } from '../core/format';
import { SelectOption } from './multi-select';

/** Single selection with search (e.g. choose a member among hundreds). */
@Component({
  selector: 'app-search-select',
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchSelect), multi: true }],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <input matInput [matAutocomplete]="auto" [value]="text()" (input)="onInput($any($event.target).value)"
             (blur)="onBlur()" [disabled]="disabled()" [placeholder]="placeholder()" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="pick($event)" autoActiveFirstOption>
        @for (o of filtered(); track o.id) {
          <mat-option [value]="o.id">
            @if (o.color) {<i class="dot" [style.background]="o.color"></i>}
            {{ o.label }} @if (o.hint) {<small class="muted"> · {{ o.hint }}</small>}
          </mat-option>
        } @empty {
          <mat-option disabled>Aucun résultat</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
})
export class SearchSelect implements ControlValueAccessor {
  label = input('');
  placeholder = input('Rechercher…');
  options = input<SelectOption[]>([]);

  value = signal<number | null>(null);
  query = signal<string | null>(null);
  disabled = signal(false);

  text = computed(() => this.query() ?? this.options().find((o) => o.id === this.value())?.label ?? '');
  filtered = computed(() => {
    const q = norm(this.query());
    return this.options().filter((o) => !o.disabled && (!q || norm(o.label).includes(q) || norm(o.hint).includes(q))).slice(0, 50);
  });

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  onInput(v: string): void {
    this.query.set(v);
    if (!v) this.setValue(null);
  }

  pick(e: MatAutocompleteSelectedEvent): void {
    this.setValue(e.option.value as number);
    this.query.set(null);
  }

  onBlur(): void {
    setTimeout(() => this.query.set(null), 150);
    this.onTouched();
  }

  private setValue(v: number | null): void {
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: number | null): void {
    this.value.set(v);
    this.query.set(null);
  }
  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }
}
