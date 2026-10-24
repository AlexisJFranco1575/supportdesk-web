import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';

import { describeError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { TICKET_PRIORITIES, Ticket, TicketPriority } from '../../core/models';
import { TicketService } from '../../core/ticket.service';
import { Badge } from '../../shared/badge';

@Component({
  selector: 'app-ticket-detail-page',
  imports: [RouterLink, DatePipe, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/tickets" class="back">← Back to tickets</a>

    @if (loadError(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    } @else if (ticket(); as t) {
      <div class="stack">
        <section class="card">
          <h1>{{ t.title }}</h1>
          <p class="actions">
            <app-badge [value]="t.status" />
            <app-badge [value]="t.priority" />
          </p>

          <p class="description">{{ t.description }}</p>

          <dl class="detail-grid">
            <div>
              <dt>Requested by</dt>
              <dd>{{ person(t.requesterId) }}</dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{{ t.assigneeId ? person(t.assigneeId) : 'Nobody yet' }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ t.createdAt | date: 'medium' }}</dd>
            </div>
            <div>
              <dt>Last update</dt>
              <dd>{{ t.updatedAt | date: 'medium' }}</dd>
            </div>
            @if (t.resolvedAt) {
              <div>
                <dt>Resolved</dt>
                <dd>{{ t.resolvedAt | date: 'medium' }}</dd>
              </div>
            }
          </dl>
        </section>

        @if (auth.isStaff()) {
          <section class="card">
            <h2>Actions</h2>

            @if (actionError(); as message) {
              <p class="alert" role="alert">{{ message }}</p>
            }

            <div class="actions">
              @if (t.status === 'Open') {
                <button type="button" class="btn btn--primary" [disabled]="busy()" (click)="start()">
                  Assign to me and start
                </button>
              }
              @if (t.status === 'InProgress') {
                <button type="button" class="btn btn--primary" [disabled]="busy()" (click)="resolve()">
                  Mark as resolved
                </button>
              }
              @if (t.status === 'Resolved') {
                <button type="button" class="btn btn--primary" [disabled]="busy()" (click)="close()">Close ticket</button>
              }
              @if (t.status === 'Resolved' || t.status === 'Closed') {
                <button type="button" class="btn" [disabled]="busy()" (click)="reopen()">Reopen</button>
              }
            </div>

            @if (t.status !== 'Closed') {
              <div class="field" style="margin-top: 1rem; max-width: 220px">
                <label for="priority">Priority</label>
                <select id="priority" [disabled]="busy()" (change)="onPriority($event)">
                  @for (item of priorities; track item) {
                    <option [value]="item" [selected]="t.priority === item">{{ item }}</option>
                  }
                </select>
              </div>
            }
          </section>
        } @else {
          <p class="muted">Only agents and administrators can change the status of a ticket.</p>
        }
      </div>
    } @else {
      <p class="muted">Loading ticket…</p>
    }
  `,
})
export class TicketDetailPage {
  protected readonly auth = inject(AuthService);
  private readonly tickets = inject(TicketService);

  /** Bound from the :id route parameter (see withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);

  constructor() {
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.ticket.set(null);
          this.loadError.set(null);
          this.actionError.set(null);
        }),
        switchMap((id) =>
          this.tickets.get(id).pipe(
            catchError((error: unknown) => {
              this.loadError.set(
                error instanceof HttpErrorResponse && error.status === 404
                  ? 'Ticket not found.'
                  : describeError(error),
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((ticket) => this.ticket.set(ticket));
  }

  protected person(userId: string): string {
    return userId === this.auth.user()?.id ? 'You' : `User ${userId.slice(0, 8)}`;
  }

  protected start(): void {
    const ticket = this.ticket();
    const user = this.auth.user();
    if (ticket && user) {
      this.run(this.tickets.start(ticket.id, user.id));
    }
  }

  protected resolve(): void {
    const ticket = this.ticket();
    if (ticket) {
      this.run(this.tickets.resolve(ticket.id));
    }
  }

  protected close(): void {
    const ticket = this.ticket();
    if (ticket) {
      this.run(this.tickets.close(ticket.id));
    }
  }

  protected reopen(): void {
    const ticket = this.ticket();
    if (ticket) {
      this.run(this.tickets.reopen(ticket.id));
    }
  }

  protected onPriority(event: Event): void {
    const ticket = this.ticket();
    const priority = (event.target as HTMLSelectElement).value as TicketPriority;

    if (ticket && priority !== ticket.priority) {
      this.run(this.tickets.changePriority(ticket.id, priority));
    }
  }

  /** Runs a ticket action and then reloads the ticket, so the screen always shows what the server holds. */
  private run(action: Observable<unknown>): void {
    const current = this.ticket();
    if (!current || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.actionError.set(null);

    action.pipe(switchMap(() => this.tickets.get(current.id))).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.busy.set(false);
      },
      error: (error: unknown) => {
        this.actionError.set(describeError(error));
        this.busy.set(false);
      },
    });
  }
}