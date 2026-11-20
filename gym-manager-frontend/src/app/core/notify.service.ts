import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from './models';

/** Toast notifications (announced to screen readers by MatSnackBar). */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  private snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, 'OK', { duration: 3000, panelClass: 'toast-success' });
  }

  /** Success toast with an action button (e.g. "Voir le reçu"). */
  successWithAction(message: string, action: string, run: () => void): void {
    this.snack.open(message, action, { duration: 8000, panelClass: 'toast-success' }).onAction().subscribe(run);
  }

  error(err: unknown): void {
    this.snack.open(errorMessage(err), 'Fermer', { duration: 6000, panelClass: 'toast-error' });
  }
}

export function apiError(err: unknown): ApiError | null {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object' && 'message' in err.error) {
    return err.error as ApiError;
  }
  return null;
}

export function errorMessage(err: unknown): string {
  const e = apiError(err);
  if (e) return e.message;
  if (err instanceof HttpErrorResponse && err.status === 0) return 'Serveur injoignable. Vérifiez votre connexion.';
  return 'Une erreur est survenue.';
}
