import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PagedResult, UserRole, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  list(page: number, pageSize: number): Observable<PagedResult<UserSummary>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<PagedResult<UserSummary>>(this.baseUrl, { params });
  }

  changeRole(id: string, role: UserRole): Observable<UserSummary> {
    return this.http.put<UserSummary>(`${this.baseUrl}/${id}/role`, { role });
  }
}
