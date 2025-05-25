import { Component, OnInit } from '@angular/core';
import { AuthService, LeftButtonsComponent, ProfileButtonComponent, CocktailCreateFormComponent } from 'shared';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Button } from 'primeng/button';


interface Filter {
  id?: string;
  name: string;
}

@Component({
  selector: 'app-create',
  standalone: true,
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  providers: [MessageService],
  imports: [
    CommonModule, LeftButtonsComponent, ProfileButtonComponent,
    ReactiveFormsModule, Toast, CocktailCreateFormComponent,
    Dialog, Button
  ]
})
export class CreateComponent implements OnInit {
  dialogHeaderLogIn: string = 'Cannot access this page';
  loginVisible: boolean = true;

  private submissionAPI = 'http://localhost:5000/submission/submissions';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private messageService: MessageService
  ) {

  }

  ngOnInit(): void {

  }

  userIsLogged(): boolean {
    return this.authService.isLoggedIn();
  }

  redirectHome(): void {
    this.router.navigate(['/home']);
  }

  handleSubmit(form: FormGroup): void {
    if (form.invalid) {
      const invalidFields = Object.keys(form.controls)
      .filter(key => form.get(key)?.invalid)
      .map(key => key.charAt(0).toUpperCase() + key.slice(1))
      .join(', ');

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: invalidFields
          ? `Please fill in all the required fields:\n${invalidFields}.`
          : 'Please fill in all the required fields.',
        life: 5000
      });
      return;
    }


    const payload = {
      name: form.value.name,
      instructions: form.value.instructions,
      glass: form.value.glass.name,
      category: form.value.type.name,
      isAlcoholic: form.value.alcoholic.name === 'Alcoholic',
      imageUrl: form.value.image,
      ingredients: form.value.ingredientsList.map((ing: any) => ({
        ingredientId: ing.id.id || ing.id || null,
        proposedName: ing.id.name || ing.name,
        quantity: ing.quantity.includes(ing.measure.name) ? ing.quantity : `${ing.quantity} ${ing.measure.name}`
      }))
    };

    this.http.post(this.submissionAPI, payload, { observe: 'response' }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Cocktail submitted successfully! Redirecting to home...',
          life: 3000
        });
        setTimeout(() => {
          this.redirectHome();
        }, 3000);
      },
      error: (err) => {
        const messages: { [code: number]: string } = {
          401: 'Unauthorized access',
          400: 'Bad request - check your input'
        };

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: messages[err.status] || 'Something went wrong',
          life: 3000
        });
      }
    });
  }
}
