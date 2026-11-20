import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, MatButtonModule, LucideAngularModule],
  template: `
    <div class="card empty-state">
      <lucide-icon name="lock" [size]="40" />
      <h2>Accès refusé</h2>
      <p class="muted">Cette page est réservée à l'administrateur du club.</p>
      <a mat-flat-button routerLink="/">Retour à l'accueil</a>
    </div>
  `,
})
export class ForbiddenPage {}
