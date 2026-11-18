import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth.service';
import { NotifyService, errorMessage } from '../../core/notify.service';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="auth-page single">
      <form class="auth-card" (ngSubmit)="submit()" aria-labelledby="pw-title">
        <h1 id="pw-title">Changer le mot de passe</h1>
        @if (forced()) {
          <p class="note">Première connexion : choisissez un mot de passe personnel pour continuer.</p>
        }
        <mat-form-field class="w-full">
          <mat-label>Mot de passe actuel</mat-label>
          <input matInput type="password" name="current" [(ngModel)]="current" autocomplete="current-password" required />
        </mat-form-field>
        <mat-form-field class="w-full">
          <mat-label>Nouveau mot de passe</mat-label>
          <input matInput type="password" name="next" [(ngModel)]="next" autocomplete="new-password" required />
          <mat-hint>8 caractères minimum, avec au moins une lettre et un chiffre.</mat-hint>
        </mat-form-field>
        <mat-form-field class="w-full">
          <mat-label>Confirmer le nouveau mot de passe</mat-label>
          <input matInput type="password" name="confirm" [(ngModel)]="confirm" autocomplete="new-password" required />
        </mat-form-field>
        @if (error()) {<p class="form-error" role="alert">{{ error() }}</p>}
        <div class="row-end">
          @if (!forced()) {<button mat-button type="button" (click)="router.navigateByUrl('/')">Annuler</button>}
          @else {<button mat-button type="button" (click)="auth.logout()">Se déconnecter</button>}
          <button mat-flat-button type="submit" [disabled]="busy()">Enregistrer</button>
        </div>
      </form>
    </div>
  `,
})
export class ChangePasswordPage {
  auth = inject(AuthService);
  router = inject(Router);
  private notify = inject(NotifyService);
  forced = computed(() => !!this.auth.user()?.mustChangePassword);
  current = '';
  next = '';
  confirm = '';
  busy = signal(false);
  error = signal('');

  async submit(): Promise<void> {
    if (this.next !== this.confirm) {
      this.error.set('Les deux nouveaux mots de passe ne sont pas identiques.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.changePassword(this.current, this.next);
      this.notify.success('Mot de passe modifié.');
      this.router.navigateByUrl('/');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
