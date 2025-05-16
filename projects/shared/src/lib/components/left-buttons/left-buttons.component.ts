import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-left-buttons',
  imports: [ButtonModule, CommonModule, InputTextModule,
            FormsModule, ReactiveFormsModule
            ],
  standalone: true,
  templateUrl: './left-buttons.component.html',
  styleUrl: './left-buttons.component.scss'
})
export class LeftButtonsComponent {

  constructor(
    private router: Router,
    private authService: AuthService) {
    }

  userIsLogged(): boolean {
    return this.authService.isLoggedIn();
  }

  redirectToSearchPage(): void {
    this.router.navigate(['/search'],  { queryParams: { first: 'true'} });
  }

  redirectToHomePage(): void {
    this.router.navigate(['/home']);
  }

  redirectToCreatePage(): void {
    this.router.navigate(['/create']);
  }

  isHomePage(): boolean {
    return this.router.url === '/home';
  }

  isSearchPage(): boolean {
    return this.router.url.includes('/search');
  }

  isCreatePage(): boolean {
    return this.router.url === '/create';
  }

  displayInfoLogin(): void {

  }

}
