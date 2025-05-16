import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SearchService } from './../../services/search.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DropdownModule } from 'primeng/dropdown';
import { ImageModule } from 'primeng/image';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { PaginatorModule } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { FluidModule } from 'primeng/fluid';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Filter {
  id?: string;
  name: string;
}

interface ImageAPI {
  url: string;
  source: string;
  photographer: string;
  photographerUrl: string;
  description: string;
}

@Component({
  selector: 'app-cocktail-create-form',
  standalone: true,
  imports: [
    CardModule, ButtonModule, DialogModule, Select,
    InputNumberModule, InputTextModule, FloatLabelModule,
    SelectButtonModule, DropdownModule, ImageModule,
    DividerModule, TextareaModule, PaginatorModule,
    FluidModule, CommonModule, ReactiveFormsModule
  ],
  templateUrl: './cocktail-create-form.component.html',
  styleUrls: ['./cocktail-create-form.component.scss'],
})
export class CocktailCreateFormComponent implements OnInit {
  @Output() submitForm = new EventEmitter<FormGroup>();


  ingredientsNumbers!: FormGroup;

  imageDialog = false;
  ingredientDialog = false;
  selectedIngredientIndex = -1;

  images: ImageAPI[] = [];

  ingredientExists: boolean[] = [];
  showAddedIngredient: boolean[] = [];

  selectedForm!: FormGroup;

  placeholders: { [key: string]: string } = {
    ingredients: 'Select ingredients',
    measure: 'Select measure',
    glass: 'Select glass',
    type: 'Select type',
    alcoholic: 'Select alcoholic'
  };

  filterOptions: { [key: string]: Filter[] } = {
    ingredients: [].map(() => ({ id: '', name: '' })),
    glass: [].map(() => ({ name: '' })),
    type: [].map(() => ({ name: '' })),
    alcoholic: [].map(() => ({ name: '' })),
    measures: [
      { name: 'oz' }, { name: 'cl' }, { name: 'ml' }, { name: 'tbsp' },
      { name: 'tsp' }, { name: 'cup' }, { name: 'dash' }, { name: 'pinch' },
      { name: 'slice' }, { name: 'sprig' }, { name: 'piece' }, { name: 'bottle' },
      { name: 'can' }, { name: 'glass' }
    ]
  };

  private importFilterAPI = 'http://localhost:5000/search/cocktails/filters?filterType=';
  private ingredientAPI = 'http://localhost:5000/cocktail/ingredients';

  constructor(
    private fb: FormBuilder,
    private searchService: SearchService,
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {
    this.selectedForm = this.formBuilder.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      ingredientsList: this.formBuilder.array([]),
      glass: ['', Validators.required],
      type: ['', Validators.required],
      alcoholic: ['', Validators.required],
      instructions: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.ingredientsNumbers = this.fb.group({
      number: [3],
    });

    this.setIngredientsLength(this.ingredientsNumbers.value.number);
    this.ingredientExists = Array.from({ length: this.ingredientsList.length }, () => true);
    this.showAddedIngredient = Array.from({ length: this.ingredientsList.length }, () => false);

    this.ingredientsNumbers.get('number')?.valueChanges.subscribe(value => {
      this.setIngredientsLength(value);
      this.ingredientExists = Array.from({ length: value }, () => true);
      this.showAddedIngredient = Array.from({ length: value }, (_, i) => this.showAddedIngredient[i] || false);
    });

    this.setupImageSearch();

    this.callApiLists();
  }

  callApiLists(): void {
    this.http.get<{ name: string }[]>(`${this.importFilterAPI}category`).subscribe(res => {
      this.filterOptions['type'] = res.map(item => ({ name: item.name }));
    });
    this.http.get<{ name: string }[]>(`${this.importFilterAPI}glass`).subscribe(res => {
      this.filterOptions['glass'] = res.map(item => ({ name: item.name }));
    });
    this.http.get<any>(`${this.ingredientAPI}`).subscribe(res => {
      this.filterOptions['ingredients'] = res.map((item: any) => ({id: item.ingredientId, name: item.name }));
    });
    this.http.get<{ name: string }[]>(`${this.importFilterAPI}alcoholic`).subscribe(res => {
      this.filterOptions['alcoholic'] = res.map(item => ({
        name: item.name === 'true' ? 'Alcoholic' : 'Non Alcoholic'
      }));
    });
  }

  get ingredientsList(): FormArray {
    return this.selectedForm.get('ingredientsList') as FormArray;
  }

  get selectedIngredientGroup(): FormGroup {
    return this.ingredientsList.at(this.selectedIngredientIndex) as FormGroup;
  }

  openIngredientDialog(index: number): void {
    this.selectedIngredientIndex = index;
    this.ingredientDialog = true;
  }

  openImageSearch(): void {
    this.imageDialog = true;
  }

  selectImage(imageUrl: string): void {
    this.selectedForm.get('image')?.setValue(imageUrl, { emitEvent: false });
    this.imageDialog = false;
  }

  setupImageSearch(): void {
    this.selectedForm.get('image')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((query: string) => {
        this.searchService.fetchCocktailImage(query).subscribe((res: any) => {
          this.images = res.map((item: any) => ({
            url: item.url,
            source: item.source,
            photographer: item.photographer,
            photographerUrl: item.photographerUrl,
            description: item.description
          }));
        });
      });
  }

  setIngredientsLength(length: number): void {
    const currentLength = this.ingredientsList.length;
    if (currentLength < length) {
      for (let i = currentLength; i < length; i++) {
        this.ingredientsList.push(this.fb.group({
          id: [''],
          name: [''],
          quantity: ['', Validators.required],
          measure: ['', Validators.required],
        }));
      }
    } else if (currentLength > length) {
      for (let i = currentLength; i > length; i--) {
        this.ingredientsList.removeAt(i - 1);
      }
    }
  }

  addIngredient(): void {
    const group = this.selectedIngredientGroup;
    const quantity = group.get('quantity')?.value;
    const measure = group.get('measure')?.value.name;

    group.get('quantity')?.setValue(`${quantity} ${measure}`);
    this.showAddedIngredient[this.selectedIngredientIndex] = true;
    this.ingredientDialog = false;
  }

  removeIngredient(index: number): void {
    const group = this.ingredientsList.at(index) as FormGroup;
    group.patchValue({ id: '', name: '', quantity: '', measure: '' });
    this.ingredientExists[index] = true;
    this.showAddedIngredient[index] = false;
  }

  createCocktail(): void {
    if (this.selectedForm.invalid) return;
    this.submitForm.emit(this.selectedForm);
  }

  clearAll(): void {
    const number = this.ingredientsNumbers.value.number;
    this.ingredientsList.clear();
    this.setIngredientsLength(number);
    this.selectedForm.reset();
    this.ingredientExists = Array.from({ length: number }, () => true);
    this.showAddedIngredient = Array.from({ length: number }, () => false);
  }
}
