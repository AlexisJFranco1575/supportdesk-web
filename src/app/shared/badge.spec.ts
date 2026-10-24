import { TestBed } from '@angular/core/testing';

import { Badge } from './badge';

describe('Badge', () => {
  async function render(value: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Badge);
    fixture.componentRef.setInput('value', value);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  it('writes a camel-case status as readable words', async () => {
    const element = await render('InProgress');

    expect(element.textContent?.trim()).toBe('In progress');
  });

  it('adds a class that matches the value', async () => {
    const element = await render('Critical');

    expect(element.querySelector('.badge--critical')).not.toBeNull();
  });
});