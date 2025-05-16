import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { PrimeNG } from 'primeng/config';
import { NgFor } from '@angular/common';
import { delay, firstValueFrom, Observable } from 'rxjs';
import { CardModule } from 'primeng/card';
import { Toast } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { AuthService, LeftButtonsComponent, ProfileButtonComponent, SearchService } from 'shared';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-home',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }))
      ]),
    ])
  ],
  imports: [
    NgFor, CommonModule, CardModule,
    LeftButtonsComponent, ProfileButtonComponent,
    Toast, SkeletonModule,
  ],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [MessageService]
})
export class HomeComponent implements OnInit {
  firstTitle: string = 'Find the perfect cocktail for';

  titles: string[] = [
    'your birthday party',
    'your happy hour',
    'your dinner with friends',
    'your romantic dinner',
  ];

  glassTypes: string[] = [
    'Highball glass',
    'Cocktail glass',
    'Old-fashioned glass',
    'Champagne flute'
  ];


  currentTitle: string = this.titles[0];
  titleIndex: number = 0;

  allImages: string[][] = [];
  currentImages: { src: string; loaded: boolean }[] = [];
  showImages: boolean[] = [];

  public images: Set<string> = new Set();
  imgSize: string[] = ['/small', '/medium', '/large'];
  accessButton = 'Accedi';
  profileButtonTag = 'Profilo';
  cocktailImgs: Set<string> = new Set();

  constructor(
    private http: HttpClient,
    private primeng: PrimeNG,
    private searchService: SearchService,
  ) { }

  ngOnInit(): void {

    this.primeng.ripple.set(true); // to initialize primeng

    this.pickAllDrinks().then((groupedImages) => {
      this.allImages = groupedImages;

      this.showImages = Array(this.currentImages.length).fill(false);
      setTimeout(() => {
        this.showImages = this.showImages.map(() => true);
      }, 50);


      // Start rotation
      setInterval(() => {
        this.rotateContent();
      }, 5000);
    });
  }

  async pickAllDrinks(): Promise<string[][]> {
    const grouped: string[][] = [];

    for (let glass of this.glassTypes) {
      const response = await firstValueFrom(
        this.searchService.getHomeCocktails(glass)
        .pipe(
          delay(1000) // Simulate network delay
        )
      ).catch((error) => {
        console.error('Error fetching drinks:', error);
        return [];
      }
      );

      const images = response.map((drink: any) => drink.imageUrl).slice(0, 10);

      grouped.push(images);
    }

    return grouped;
  }


  rotateContent(): void {
    this.titleIndex = (this.titleIndex + 1) % this.titles.length;
    this.currentTitle = this.titles[this.titleIndex];

    const imgIndex = this.titleIndex % this.allImages.length;
    const selectedImages = this.allImages[imgIndex] || [];

    this.currentImages = selectedImages.map((img: string) => ({
      src: img,
      loaded: false
    }));

    this.showImages = Array(this.currentImages.length).fill(false);

    setTimeout(() => {
      this.showImages = this.showImages.map(() => true);
    }, 300);
  }


}
