import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { describeError } from '../../core/api-error';
import { TICKET_PRIORITIES, TicketPriority } from '../../core/models';
import { TicketService } from '../../core/ticket.service';

@Component({
  selector: 'app-ticket-create-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/tickets" class="back">← Back to tickets</a>

    <section class="card">
      <h1>New ticket</h1>
      <p class="muted">Describe the problem. An agent will pick it up.</p>

      @if (error(); as message) {
        <p class="alert" role="alert">{{ message }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="title">Title</label>
          <input id="title" type="text" formControlName="title" maxlength="120" />
          @if (form.controls.title.touched && form.controls.title.invalid) {
            <small class="field-error">A title is required (up to 120 characters).</small>
          }
        </div>

        <div class="field">
          <label for="description">Description</label>
          <textarea id="description" formControlName="description" maxlength="4000"></textarea>
          @if (form.controls.description.touched && form.controls.description.invalid) {
            <small class="field-error">A description is required (up to 4000 characters).</small>
          }
        </div>

        <div class="field">
          <label for="priority">Priority</label>
          <select id="priority" formControlName="priority">
            @for (item of priorities; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </div>

        <div class="actions">
          <button type="submit" class="btn btn--primary" [disabled]="busy()">
            {{ busy() ? 'Creating…' : 'Create ticket' }}
          </button>
          <a routerLink="/tickets" class="btn btn--ghost">Cancel</a>
        </div>
      </form>
    </section>
  `,
})
export class TicketCreatePage {
  private readonly tickets = inject(TicketService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    priority: this.fb.control<TicketPriority>('Medium'),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    this.error.set(null);

    this.tickets.create(this.form.getRawValue()).subscribe({
      next: (ticket) => void this.router.navigate(['/tickets', ticket.id]),
      error: (error: unknown) => {
        this.error.set(describeError(error));
        this.busy.set(false);
      },
    });
  }
}