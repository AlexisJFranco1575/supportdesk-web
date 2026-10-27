import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Tickets',
        loadComponent: () => import('./features/tickets/ticket-list-page').then((m) => m.TicketListPage),
      },
      {
        path: 'new',
        title: 'New ticket',
        loadComponent: () => import('./features/tickets/ticket-create-page').then((m) => m.TicketCreatePage),
      },
      {
        path: ':id',
        title: 'Ticket',
        loadComponent: () => import('./features/tickets/ticket-detail-page').then((m) => m.TicketDetailPage),
      },
    ],
  },
  {
    path: 'admin/users',
    title: 'Users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/user-admin-page').then((m) => m.UserAdminPage),
  },
  { path: '**', redirectTo: 'tickets' },
];
