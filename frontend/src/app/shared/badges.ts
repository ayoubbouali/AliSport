import { Component, computed, input } from '@angular/core';
import { SITUATION_LABELS } from '../core/format';

@Component({
  selector: 'app-sport-chip',
  template: `<span class="chip" [class.chip-inactive]="inactive()"><i class="dot" [style.background]="color()"></i>{{ name() }}</span>`,
})
export class SportChip {
  name = input.required<string>();
  color = input<string>('#999');
  inactive = input(false);
}

/** Payé (green) / Partiel (orange) / Impayé (red). Also used for the insurance (Payé / Impayé). */
@Component({
  selector: 'app-paid-badge',
  template: `<span class="badge" [class.ok]="value() === 'PAYE'" [class.warn]="value() === 'PARTIEL'" [class.ko]="value() === 'IMPAYE'">{{ label() }}</span>`,
})
export class PaidBadge {
  value = input.required<string>();
  label = computed(() => ({ PAYE: 'Payé', PARTIEL: 'Partiel', IMPAYE: 'Impayé' } as Record<string, string>)[this.value()] ?? this.value());
}

@Component({
  selector: 'app-situation-badge',
  template: `<span class="badge" [class]="cls()">{{ label() }}</span>`,
})
export class SituationBadge {
  value = input.required<string>();
  label = computed(() => SITUATION_LABELS[this.value()] ?? this.value());
  cls = computed(() => 'badge ' + ({ EXPIRED: 'ko', SOON: 'warn', FOLLOW: 'info', OK: 'ok' } as Record<string, string>)[this.value()]);
}

@Component({
  selector: 'app-active-badge',
  template: `<span class="badge" [class.ok]="active()" [class.neutral]="!active()">{{ active() ? 'Oui' : 'Non' }}</span>`,
})
export class ActiveBadge {
  active = input.required<boolean>();
}

/** Remaining days: "Expiré depuis N j" in red when negative. */
@Component({
  selector: 'app-days',
  template: `@if (days() < 0) {<span class="red">Expiré depuis {{ -days() }} j</span>} @else {<span>{{ days() }} j</span>}`,
})
export class DaysLeft {
  days = input.required<number>();
}
