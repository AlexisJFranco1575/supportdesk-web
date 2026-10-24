import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';

import { describeError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import {
  PagedResult,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../../core/models';
import { TicketService } from '../../core/ticket.service';
import { Badge } from '../../shared/badge';

@Component({
  selector: 'app-ticket-list-page',
  imports: [RouterLink, DatePipe, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <h1>{{ auth.isStaff() ? 'All tickets' : 'My tickets' }}</h1>
      <a routerLink="/tickets/new" class="btn btn--primary">New ticket</a>
    </header>

    <div class="filters card">
      <div>
        <label for="status">Status</label><br />
        <select id="status" (change)="onStatus($event)">
          <option value="" [selected]="status() === ''">All</option>
          @for (item of statuses; track item) {
            <option [value]="item" [selected]="status() === item">{{ item }}</option>
          }
        </select>
      </div>

      <div>
        <label for="priority">Priority</label><br />
        <select id="priority" (change)="onPriority($event)">
          <option value="" [selected]="priority() === ''">All</option>
          @for (item of priorities; track item) {
            <option [value]="item" [selected]="priority() === item">{{ item }}</option>
          }
        </select>
      </div>
    </div>

    @if (error(); as message) {
      <p class="alert" role="alert">
        {{ message }}
        <button type="button" class="btn btn--ghost" (click)="reload()">Try again</button>
      </p>
    }

    @if (result(); as data) {
      @if (data.items.length === 0) {
        <div class="card">
          <p class="muted">There are no tickets here yet.</p>
        </div>
      } @else {
        <div class="card table-wrap" [attr.aria-busy]="loading()">
          <table class="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              @for (ticket of data.items; track ticket.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/tickets', ticket.id]">{{ ticket.title }}</a>
                  </td>
                  <td><app-badge [value]="ticket.status" /></td>
                  <td><app-badge [value]="ticket.priority" /></td>
                  <td>{{ ticket.createdAt | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pager">
          <span class="muted">
            Page {{ data.page }} of {{ pages(data) }} · {{ data.totalCount }} tickets
          </span>
          <span class="actions">
            <button type="button" class="btn" [disabled]="data.page <= 1" (click)="goTo(data.page - 1)">Previous</button>
            <button type="button" class="btn" [disabled]="data.page >= pages(data)" (click)="goTo(data.page + 1)">
              Next
            </button>
          </span>
        </div>
      }
    } @else if (loading()) {
      <p class="muted">Loading tickets… The first request can take a few seconds while the server wakes up.</p>
    }
  `,
})
export class TicketListPage {
  protected readonly auth = inject(AuthService);
  private readonly tickets = inject(TicketService);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;

  protected readonly status = signal<TicketStatus | ''>('');
  protected readonly priority = signal<TicketPriority | ''>('');
  protected readonly page = signal(1);
  private readonly reloadTick = signal(0);

  protected readonly result = signal<PagedResult<Ticket> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly pageSize = 10;

  private readonly query = computed(() => ({
    status: this.status() || undefined,
    priority: this.priority() || undefined,
    page: this.page(),
    pageSize: this.pageSize,
    tick: this.reloadTick(),
  }));

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        // switchMap drops the previous request when a filter changes before it finishes.
        switchMap((query) =>
          this.tickets.list(query).pipe(
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

  protected pages(data: PagedResult<Ticket>): number {
    return Math.max(data.totalPages, 1);
  }

  protected onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as TicketStatus | '');
    this.page.set(1);
  }

  protected onPriority(event: Event): void {
    this.priority.set((event.target as HTMLSelectElement).value as TicketPriority | '');
    this.page.set(1);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected reload(): void {
    this.reloadTick.update((tick) => tick + 1);
  }
}