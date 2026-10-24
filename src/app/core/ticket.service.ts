import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CreateTicketRequest, PagedResult, Ticket, TicketPriority, TicketQuery } from './models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/tickets`;

  list(query: TicketQuery): Observable<PagedResult<Ticket>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.priority) {
      params = params.set('priority', query.priority);
    }

    return this.http.get<PagedResult<Ticket>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(this.baseUrl, request);
  }

  start(id: string, assigneeId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/start`, { assigneeId });
  }

  resolve(id: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/resolve`, null);
  }

  close(id: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/close`, null);
  }

  reopen(id: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/reopen`, null);
  }

  changePriority(id: string, priority: TicketPriority): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${id}/priority`, { priority });
  }
}