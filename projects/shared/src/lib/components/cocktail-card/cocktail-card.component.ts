import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Button } from 'primeng/button';
import { Image } from 'primeng/image';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';

/** Put this interface in a shared `models.ts` if you use it elsewhere */
export interface Cocktail {
  id: string;
  name: string;
  image: string;
  instructions: string;
  ingredientsAndMeasures: Ingredient[];
  category: string;
  glass: string;
  alcoholic: boolean;      // true → alcoholic, false → non-alcoholic
}

export interface Ingredient {
  id: string;
  name: string;
  originalQuantity: string;  // “1½ oz”, “dash”, …
  quantityValue: string;
  measure: string;
}

@Component({
  selector: 'shared-cocktail-card',
  standalone: true,
  templateUrl: './cocktail-card.component.html',
  styleUrl: './cocktail-card.component.scss',
  imports: [
    NgFor, Button, Image, Card, Divider, TabsModule
  ]
})
export class CocktailCardComponent {

  /** Cocktail data to render */
  @Input() cocktail!: Cocktail;

  @Input() isFavorite = false;

  @Output() favoriteToggled = new EventEmitter<string>();

  toggleFavorite(): void {
    this.favoriteToggled.emit(this.cocktail.id);
  }

  ingredientLabel(ing: Ingredient): string {
    const qty = ing.originalQuantity?.trim();
    return qty ? `${ing.name}  →  ${qty}` : `${ing.name}  →  no measure`;
  }
}
