import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { makeToken, validClaims } from '../testing/make-token';
import { adminGuard, authGuard, guestGuard } from './auth.guard';
import { TOKEN_STORAGE_KEY } from './auth.service';

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  function runAuthGuard(url: string): unknown {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  function runGuestGuard(): unknown {
    return TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }

  function runAdminGuard(): unknown {
    return TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }

  function signInAs(role: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, makeToken(validClaims({ role })));
  }

  it('sends anonymous visitors to the login page and remembers where they were going', () => {
    const result = runAuthGuard('/tickets/42');

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Ftickets%2F42');
  });

  it('lets signed-in users reach protected pages', () => {
    signInAs('Customer');

    expect(runAuthGuard('/tickets')).toBe(true);
  });

  it('lets anonymous visitors see the login page', () => {
    expect(runGuestGuard()).toBe(true);
  });

  it('sends signed-in users away from the login page', () => {
    signInAs('Customer');

    const result = runGuestGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/tickets');
  });

  it('lets administrators reach the admin pages', () => {
    signInAs('Admin');

    expect(runAdminGuard()).toBe(true);
  });

  it('keeps agents and customers out of the admin pages', () => {
    signInAs('Agent');

    const result = runAdminGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/tickets');
  });

  it('keeps anonymous visitors out of the admin pages', () => {
    expect(runAdminGuard()).toBeInstanceOf(UrlTree);
  });
});
