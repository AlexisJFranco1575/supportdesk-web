import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { TOKEN_STORAGE_KEY } from '../../core/auth.service';
import { makeToken, validClaims } from '../../testing/make-token';
import { UserAdminPage } from './user-admin-page';

const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';

const listResponse = {
  items: [
    {
      id: OTHER_USER_ID,
      email: 'bob@example.com',
      fullName: 'Bob',
      role: 'Customer',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};

describe('UserAdminPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, makeToken(validClaims({ role: 'Admin' })));

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lists the users and saves a role change', async () => {
    const fixture = TestBed.createComponent(UserAdminPage);
    const http = TestBed.inject(HttpTestingController);
    const element = fixture.nativeElement as HTMLElement;

    await fixture.whenStable();
    http.expectOne((request) => request.url === `${environment.apiUrl}/api/users`).flush(listResponse);
    await fixture.whenStable();

    expect(element.textContent).toContain('bob@example.com');

    const select = element.querySelector('select') as HTMLSelectElement;
    select.value = 'Agent';
    select.dispatchEvent(new Event('change'));

    const put = http.expectOne(`${environment.apiUrl}/api/users/${OTHER_USER_ID}/role`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ role: 'Agent' });
    put.flush({ ...listResponse.items[0], role: 'Agent' });
    await fixture.whenStable();

    expect(element.textContent).toContain('Saved');
  });

  it('does not let an administrator edit their own row', async () => {
    const fixture = TestBed.createComponent(UserAdminPage);
    const http = TestBed.inject(HttpTestingController);
    const element = fixture.nativeElement as HTMLElement;
    const selfId = validClaims()['sub'] as string;

    await fixture.whenStable();
    http
      .expectOne((request) => request.url === `${environment.apiUrl}/api/users`)
      .flush({ ...listResponse, items: [{ ...listResponse.items[0], id: selfId, role: 'Admin' }] });
    await fixture.whenStable();

    const select = element.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(element.textContent).toContain('(you)');
  });
});
