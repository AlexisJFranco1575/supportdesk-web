import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';

import { describeError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { PagedResult, USER_ROLES, UserRole, UserSummary } from '../../core/models';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-user-admin-page',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <h1>Users</h1>
    </header>

    <p class="muted">
      Change a user's role here. The new role applies the next time that person signs in.
      You cannot change your own role.
    </p>

    @if (error(); as message) {
      <p class="alert" role="alert">
        {{ message }}
        <button type="button" class="btn btn--ghost" (click)="reload()">Try again</button>
      </p>
    }

    @if (result(); as data) {
      <div class="card table-wrap" [attr.aria-busy]="loading()">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            @for (user of data.items; track user.id) {
              <tr>
                <td>
                  {{ user.fullName }}
                  @if (isSelf(user)) {
                    <small class="muted">(you)</small>
                  }
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <select
                    [attr.aria-label]="'Role for ' + user.email"
                    [disabled]="isSelf(user) || savingId() === user.id"
                    (change)="onRole(user, $event)"
                  >
                    @for (role of roles; track role) {
                      <option [value]="role" [selected]="user.role === role">{{ role }}</option>
                    }
                  </select>
                  @if (savedId() === user.id) {
                    <small class="muted">Saved</small>
                  }
                </td>
                <td>{{ user.createdAt | date: 'mediumDate' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="pager">
        <span class="muted">Page {{ data.page }} of {{ pages(data) }} · {{ data.totalCount }} users</span>
        <span class="actions">
          <button type="button" class="btn" [disabled]="data.page <= 1" (click)="goTo(data.page - 1)">Previous</button>
          <button type="button" class="btn" [disabled]="data.page >= pages(data)" (click)="goTo(data.page + 1)">
            Next
          </button>
        </span>
      </div>
    } @else if (loading()) {
      <p class="muted">Loading users… The first request can take a few seconds while the server wakes up.</p>
    }
  `,
})
export class UserAdminPage {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);

  protected readonly roles = USER_ROLES;
  protected readonly page = signal(1);
  private readonly reloadTick = signal(0);
  private readonly pageSize = 10;

  protected readonly result = signal<PagedResult<UserSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly savingId = signal<string | null>(null);
  protected readonly savedId = signal<string | null>(null);

  private readonly query = computed(() => ({ page: this.page(), tick: this.reloadTick() }));

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((query) =>
          this.users.list(query.page, this.pageSize).pipe(
            catchError((error: unknown) => {
              this.error.set(describeError(error));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.loading.set(false);
        if (data) {
          this.result.set(data);
        }
      });
  }

  protected isSelf(user: UserSummary): boolean {
    return user.id === this.auth.user()?.id;
  }

  protected pages(data: PagedResult<UserSummary>): number {
    return Math.max(data.totalPages, 1);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected reload(): void {
    this.reloadTick.update((tick) => tick + 1);
  }

  protected onRole(user: UserSummary, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const role = select.value as UserRole;

    if (role === user.role || this.savingId() !== null) {
      select.value = user.role;
      return;
    }

    this.savingId.set(user.id);
    this.savedId.set(null);
    this.error.set(null);

    this.users.changeRole(user.id, role).subscribe({
      next: (updated) => {
        this.result.update(
          (current) =>
            current && {
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            },
        );
        this.savingId.set(null);
        this.savedId.set(updated.id);
      },
      error: (error: unknown) => {
        // Put the dropdown back to what the server still has.
        select.value = user.role;
        this.error.set(describeError(error));
        this.savingId.set(null);
      },
    });
  }
}
