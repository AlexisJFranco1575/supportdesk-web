import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="container topbar__inner">
        <a routerLink="/" class="brand">SupportDesk</a>

        @if (auth.user(); as user) {
          <nav aria-label="Main">
            <a routerLink="/tickets" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tickets</a>
            <a routerLink="/tickets/new" routerLinkActive="active">New ticket</a>
          </nav>

          <div class="topbar__user">
            <span class="user-chip">
              {{ user.name || user.email }}
              <small>{{ user.role }}</small>
            </span>
            <button type="button" class="btn btn--ghost" (click)="auth.logout()">Sign out</button>
          </div>
        } @else {
          <nav aria-label="Main">
            <a routerLink="/login" routerLinkActive="active">Sign in</a>
            <a routerLink="/register" routerLinkActive="active">Create account</a>
          </nav>
        }
      </div>
    </header>

    <main class="container">
      <router-outlet />
    </main>

    <footer class="footer">
      Angular frontend for the SupportDesk API (.NET 10 on Azure).
    </footer>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
}