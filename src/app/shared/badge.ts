import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A small coloured pill used for ticket statuses and priorities ("InProgress" shows as "In progress"). */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="cssClass()">{{ label() }}</span>`,
})
export class Badge {
  readonly value = input.required<string>();

  protected readonly label = computed(() =>
    this.value().replace(/([a-z])([A-Z])/g, (_match, first: string, second: string) => `${first} ${second.toLowerCase()}`),
  );

  protected readonly cssClass = computed(() => `badge--${this.value().toLowerCase()}`);
}