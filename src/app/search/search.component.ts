import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Button } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { Dialog } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { CardModule } from 'primeng/card';
import { InputGroupModule } from 'primeng/inputgroup';
import { FormsModule, FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ProfileButtonComponent, LeftButtonsComponent, HistoryService, SearchService, SearchInput, FavoritesService } from 'shared';
import { NgFor, NgIf } from '@angular/common';
import { debounceTime, distinctUntilChanged, filter, forkJoin, map, Observable, switchMap } from 'rxjs';

interface SearchResult {
  id: string;
  title: string;
  image: string;
  isFavorite: boolean;
}

interface Filter {
  name: string;
}

@Component({
  selector: 'app-search',
  imports: [
    ProfileButtonComponent, FloatLabel, InputText, NgIf,
    IconField, InputIcon, FormsModule, ReactiveFormsModule,
    MultiSelectModule, NgFor, Button, InputGroupModule,
    ChipModule, Dialog, CardModule, PaginatorModule, LeftButtonsComponent,
    ImageModule
  ],
  standalone: true,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {


  imageCardText: string = 'Open';

  // * paginator code
  first: number = 0;
  rows: number = 10;

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.displayResults();
  }

  SearchInput: { filters: SearchInput[]; } = { filters: [] };
  searchResults: SearchResult[] = [];
  paginatedResults: SearchResult[] = [];

  // * dialog not logged in
  visible: boolean = true;
  dialogHeader: string = 'Cannot access to this page';

  // * filters placeholders
  placeholders: { [key: string]: string } = {
    ingredients: 'Filter by ingredients',
    glass: 'Filter by glass',
    type: 'Filter by type of cocktail',
    alcoholic: 'Filter by alcoholic content'
  }

  searchForm!: FormGroup;

  filterOptions: { [key: string]: Filter[] } = {
    ingredients: [].map(item => ({ id: item, name: item })),
    glass: [].map(item => ({ name: item })),
    type: [].map(item => ({ name: item })),
    alcoholic: [].map(item => ({ name: item }))
  };

  query: string = '';
  noResultsFound: boolean = false;
  alcoholAllowed: boolean = true;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private historyService: HistoryService,
    private searchService: SearchService,
    private favoriteService: FavoritesService
  ) {
    this.searchForm = this.formBuilder.group({
      query: [''],
      ingredients: [[]],
      glass: [[]],
      type: [[]],
      alcoholic: [[]]
    });

  }

  ngOnInit(): void {

    this.alchoholicAllowed();

    this.route.queryParams.subscribe(params => {
      if (params['first'] === 'true') {
        this.displayRandomCocktails();
      }
    })

    // * check for value changes in the searchForm
    this.lookForFilterChanges();

    // * API calls to get the filter options
    this.callApiLists();
  }

  callApiLists(): void {
    this.searchService.getCocktailIngredients().subscribe(res => {
      this.filterOptions['ingredients'] = res.map((item: any) => ({id: item.ingredientId, name: item.name }));
    });
    this.searchService.getCocktailFilters('category').subscribe(res => {
      this.filterOptions['type'] = res.map((item: any) => ({ name: item.name }));
    });
    this.searchService.getCocktailFilters('glass').subscribe(res => {
      this.filterOptions['glass'] = res.map((item: any) => ({ name: item.name }));
    });
    this.searchService.getCocktailFilters('alcoholic').subscribe(res => {
      this.filterOptions['alcoholic'] = res.map((item: any) => ({
        name: item.name === 'true' ? 'Alcoholic' : 'Non Alcoholic'
      }));
    });
  }

  getAllSelectedFilters(): string[] {
    const returnString: string[] = this.SearchInput.filters
      .map((filter: SearchInput) => {
        const filters: string[] = [];
        if (filter.filterType !== 'cocktail')
          filters.push(filter.filterName);
        return filters;
      })
      .flat();
    return returnString;
  }

  removeFilter(filter: string) {
    const formValues = this.searchForm.value;

    for (const key of Object.keys(formValues)) {
      const list = formValues[key];
      if (Array.isArray(list)) {
        const updatedList = list.filter((item: any) => item.name !== filter);
        this.searchForm.get(key)?.setValue(updatedList);
      }
    }
  }

  alchoholicAllowed(): void {
    this.authService.getAlcoholAllowed().subscribe((allowed: boolean) => {
      this.alcoholAllowed = allowed;
    });
  }

  userIsLogged(): boolean {
    return this.authService.isLoggedIn();
  }

  redirectHome() {
    this.router.navigate(['/home']);
  }

  displayRandomCocktails() {
    this.searchService.getRandomCocktails(20).subscribe((response: any) => {
      this.searchResults = response.map((item: any) => ({
        id: item.cocktailId,
        title: item.name,
        image: item.imageUrl,
        isFavorite: this.isFavorite(item.cocktailId)
      }));

      this.displayResults();
    });
  }

  displayResults() {
    if (this.searchResults.length === 0) {
      // TODO: add a message if no results found
      this.noResultsFound = true;
      this.paginatedResults = [];
    } else {
      this.paginatedResults = this.searchResults.slice(this.first, this.first + this.rows);
    }
  }

  lookForFilterChanges(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        map(formValues => {
          const filters = [
            ...formValues.ingredients.map((item: any) => ({
              filterType: 'ingredients',
              filterName: item.name
            })),
            ...formValues.glass.map((item: any) => ({
              filterType: 'glass',
              filterName: item.name
            })),
            ...formValues.type.map((item: any) => ({
              filterType: 'category',
              filterName: item.name
            })),
            ...formValues.alcoholic.map((item: any) => ({
              filterType: 'alcoholic',
              filterName: item.name
            })),
            ...(formValues.query ? [{ filterType: 'cocktail', filterName: formValues.query }] : [])
          ];

          // Save to the class-level state
          this.SearchInput.filters = filters;

          return filters;
        }),
        filter(filters => filters.length > 0), // Skip empty searches
        switchMap(filters => this.searchService.searchCocktails(filters))
      )
      .subscribe((response: any) => {
        this.searchResults = response.map((item: any) => ({
          id: item.cocktailId,
          title: item.name,
          image: item.imageUrl,
          isFavorite: this.isFavorite(item.cocktailId)
        }));

        this.authService.getProfiling().subscribe((response: boolean) => {
          if (response) {
            this.historyService.addToHistory(this.SearchInput.filters, 'search');
          }
        });
        this.displayResults();
      });
  }

  isFavorite(cocktailId: string): boolean {
    return this.favoriteService.isFavorite(cocktailId);
  }

  manageFavorite(card: SearchResult): void {
    this.favoriteService.manageFavorites(card.id);

    const newFavoriteStatus = !card.isFavorite;

    this.searchResults = this.searchResults.map(item =>
      item.id === card.id ? { ...item, isFavorite: newFavoriteStatus } : item
    );

    this.paginatedResults = this.paginatedResults.map(item =>
      item.id === card.id ? { ...item, isFavorite: newFavoriteStatus } : item
    );
  }

  displayCardPage(id: string) {
    this.authService.getProfiling().subscribe((response: boolean) => {
      if (response) {
        this.historyService.addToHistory(this.SearchInput.filters, 'select');
      }
    });
    this.router.navigate(['/card'], { queryParams: { cocktailId: id} });
  }
}
