import { NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Image } from 'primeng/image';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { CarouselModule } from 'primeng/carousel';
import { AuthService, LeftButtonsComponent, ProfileButtonComponent, HistoryService, SearchService, CocktailCardComponent, Cocktail, Ingredient, FavoritesService } from 'shared';

interface Recommended {
  id: string;
  likes: number;
};

@Component({
  selector: 'app-card',
  imports: [
    LeftButtonsComponent, ProfileButtonComponent, Button,
    Dialog, NgIf, TabsModule, CarouselModule, CocktailCardComponent
  ],
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent implements OnInit {

  randomCocktails: { id: string, name: string, image: string}[] = [];
  recommendedCocktails: Recommended[] = [];
  recommended: { id: string, name: string, image: string, likes: number}[] = [];

  responsiveOptions: any[] | undefined;

  // * dialog Not Logged in
  visible: boolean = true;
  dialogHeader: string = 'Cannot access to this page';

  // * favorites
  isFavoriteCocktail: boolean = false;

  // * cocktail variables
  cocktailInfo: Cocktail = {
    id: '',
    name: '',
    image: '',
    instructions: '',
    ingredientsAndMeasures: [],
    category: '',
    glass: '',
    alcoholic: false,
  };

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private historyService: HistoryService,
    private searchService: SearchService,
    private favoriteService: FavoritesService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.cocktailInfo.id = params['cocktailId'];
    });

    this.searchService.getRandomCocktails(15)
      .subscribe((response: any) => {
        this.randomCocktails = response.map((item: any) => ({
          id: item.cocktailId,
          name: item.name,
          image: item.imageUrl
        }));
      });

    this.authService.getProfiling().subscribe((response: boolean) => {
      if (response) {
        this.favoriteService.getRecommendedCocktails()
          .subscribe((response: Recommended[]) => {
          this.recommendedCocktails = response;
          this.recommendedCocktails.forEach((item: Recommended) => {
            this.searchService.getSingleCocktail(item.id)
            .subscribe((cocktail: any) => {
              this.recommended.push({
              id: cocktail.cocktailId,
              name: cocktail.name,
              image: cocktail.imageUrl,
              likes: item.likes
              });
            });
          });
        });
      }
    });

    // * call the cocktail API
    this.getCocktail(this.cocktailInfo.id);

    // * responsive options for the carousel
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 3,
        numScroll: 2
      },
      {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 2
      },
      {
        breakpoint: '700px',
        numVisible: 1,
        numScroll: 1
      },
    ];

  }

  redirectHome() {
    this.router.navigate(['/home']);
  }

  userIsLogged(): boolean {
    return this.authService.isLoggedIn();
  }

  private getCocktail(cocktailId: string) {
    this.searchService.getSingleCocktail(cocktailId)
      .subscribe((response: any) => {
        this.cocktailInfo = {
          id: response.cocktailId,
          name: response.name,
          image: response.imageUrl,
          instructions: response.instructions,
          ingredientsAndMeasures: response.ingredients
            .map((item: any) => ({
              id: item.ingredientId,
              name: item.ingredientName,
              originalQuantity: item.originalMeasure,
              quantityValue: item.quantityValue,
              measure: item.quantityUnit
            })),
          category: response.category,
          glass: response.glass,
          alcoholic: response.isAlcoholic
        }
        this.isFavoriteCocktail = this.favoriteService.isFavorite(this.cocktailInfo.id);
      });
  }

  displayIngredient(ingredient: Ingredient, index: number): string {
    const measure = ingredient.originalQuantity;
    if (!measure) {
      return `${ingredient.name}  →  No measure`;
    }
    return `${ingredient}  →  ${measure}`;
  }

  isFavorite(id: string): boolean {
    return this.favoriteService.isFavorite(id);
  }

  goToCocktail(cocktailId: string) {
    this.router.navigate([], {
      queryParams: { cocktailId: cocktailId },
      queryParamsHandling: 'merge'
    }).then(() => {
      window.location.reload();
    });
  }

  manageFavorites() {
    this.favoriteService.manageFavorites(this.cocktailInfo.id);
    this.isFavoriteCocktail = !this.isFavoriteCocktail;
  }


}
