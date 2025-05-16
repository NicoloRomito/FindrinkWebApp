import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { SearchInput } from './../services/search.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  // * API
  private cocktailAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory';
  private getUserHistoryAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory/mine';

  constructor(private http: HttpClient) { }

  getHistory(): Observable<any> {
    return this.http.get<any>(this.getUserHistoryAPI);
  }

  addToHistory(filters: SearchInput[], action: string): Observable<any> {
    return this.http.post(this.cocktailAPI, {
      action,
      filters
    });
  }



}
