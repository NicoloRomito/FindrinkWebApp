import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favorites: Set<string> = new Set();

  private FavoritesAPI: string = 'http://localhost:5000/favoritecocktails/api/favorites/mine';
  private favoritesAPI: string = 'http://localhost:5000/favoritecocktails/api/favorites';
  private recommendedAPI: string = 'http://localhost:5000/favoritecocktails/api/favorites/recommended';
  private mostLikedAPI: string = 'http://localhost:5000/favoritecocktails/api/favorites/global/popular?top=10';

  constructor(
    private http: HttpClient
  ) {
    this.loadUserFavorites();
   }

   loadUserFavorites(): void {
    this.http.get<any[]>(`${this.FavoritesAPI}`).subscribe((res) => {
      this.favorites = new Set(res.map(fav => fav.cocktailId));
    });
  }

  getRecommendedCocktails(): Observable<any> {
    return this.http.get(`${this.recommendedAPI}`).pipe(
      map((response: any) => response.map((item: any) => ({
        id: item.cocktailId,
        name: item.name,
        image: item.imageUrl
      })))
    );
  }

  getMostLikedCocktails(): Observable<any> {
    return this.http.get(`${this.mostLikedAPI}`).pipe(
      map((response: any) => response.map((item: any) => ({
        id: item.cocktailId,
        name: item.name,
        image: item.imageUrl
      })))
    );
  }

  getUserFavorites(): Observable<any> {
    return this.http.get(`${this.FavoritesAPI}`);
  }

  addToFavorites(cocktailId: string): Observable<any> {
    return this.http.post(`${this.favoritesAPI}`, { cocktailId: cocktailId }).pipe(
      tap(() => this.favorites.add(cocktailId)),
    );
  }

  removeFromFavorites(cocktailId: string): Observable<any> {
    return this.http.delete(`${this.favoritesAPI}/${cocktailId}`).pipe(
      tap(() => this.favorites.delete(cocktailId)),
    );
  }

  isFavorite(cocktailId: string): boolean {
    return this.favorites.has(cocktailId);
  }


  manageFavorites(cocktailId: string): void {
    if (this.isFavorite(cocktailId)) {
      this.removeFromFavorites(cocktailId).subscribe(() => {
        this.favorites.delete(cocktailId);
      });
    } else {
      this.addToFavorites(cocktailId).subscribe(() => {
        this.favorites.add(cocktailId);
      });
    }
  }



}
