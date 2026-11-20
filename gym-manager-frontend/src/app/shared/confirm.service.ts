import { Component, Injectable, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';

export interface ConfirmData {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    @if (data.message) {
      <mat-dialog-content><p class="muted">{{ data.message }}</p></mat-dialog-content>
    }
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" cdkFocusInitial>Annuler</button>
      <button mat-flat-button [class.btn-danger]="data.danger" [mat-dialog-close]="true">{{ data.confirmLabel || 'Confirmer' }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

/** Every deletion / deactivation goes through this modal. Cancel changes nothing. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);

  async confirm(data: ConfirmData): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialog, { data, width: '480px', autoFocus: 'dialog', role: 'alertdialog' });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
