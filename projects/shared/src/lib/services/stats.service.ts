import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  // * API FOR HISTORY STATS
  private popularFiltersAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory/popular-filters';
  private recentFiltersAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory/recent-filters';
  private filterSummaryAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory/filter-summary';

  // * COCKTAIL STATS API
  private popularCocktailsAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory/popular-cocktails';
  private popularGlassesAPI: string = 'http://localhost:5000/searchhistory/api/searchhistory/popular-glasses';

  // * API FOR USER STATS
  private allUsersAPI: string = 'http://localhost:5000/auth/api/admin/users';
  private userStatsAPI: string = 'http://localhost:5000/auth/api/admin/stats';

  constructor(
    private http: HttpClient
  ) { }

  // * HISTORY STATS
  getPopularFilters(): Observable<any> {
    return this.http.get(`${this.popularFiltersAPI}`);
  }

  getRecentFilters(): Observable<any> {
    return this.http.get(`${this.recentFiltersAPI}`);
  }

  getFilterSummary(): Observable<any> {
    return this.http.get(`${this.filterSummaryAPI}`);
  }

  // * COCKTAIL STATS

  getPopularCocktails(): Observable<any> {
    return this.http.get(`${this.popularCocktailsAPI}`);
  }

  getPopularGlasses(): Observable<any> {
    return this.http.get(`${this.popularGlassesAPI}`);
  }

  // * USER STATS

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.allUsersAPI}`);
  }

  getUserStats(): Observable<any> {
    return this.http.get(`${this.userStatsAPI}`);
  }

}
