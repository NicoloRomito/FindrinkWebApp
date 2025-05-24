import { Component, OnInit } from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { DatePicker } from 'primeng/datepicker';
import { Image } from 'primeng/image';
import { AuthService, HistoryService, LeftButtonsComponent, ProfileButtonComponent, CocktailCreateFormComponent, FavoritesService, SearchService } from 'shared';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Fieldset } from 'primeng/fieldset';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { Tag } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClient } from '@angular/common/http';
import { Password } from 'primeng/password';
import { forkJoin } from 'rxjs';

interface Submission {
  id: string;
  name: string;
  image: string;
  status: string;
}

interface Favorite {
  id: string;
  name: string;
  image: string;
  isFavorite: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [
    LeftButtonsComponent, Button, CommonModule,
    Card, PanelModule, ProfileButtonComponent,
    ReactiveFormsModule, DatePicker, Paginator,
    Image, FloatLabel, InputText, Checkbox, Fieldset,
    Dialog, ConfirmDialogModule, ToastModule, Tag,
    CocktailCreateFormComponent, Password
  ],
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class ProfileComponent implements OnInit {

  private gdpr: boolean = true;

  // * change password
  passwordDialog: boolean = false;
  passwordForm!: FormGroup;

  // * submissions
  private SubmissionAPI: string = 'http://localhost:5000/submission/submissions/';

  submitted: Submission[] = [];
  paginatedSubmissions: Submission[] = [];

  // * dialog Not Logged in
  visible: boolean = true;
  dialogHeader: string = 'Cannot access to this page';

  // * paginator
  // TODO: fix the paginator
  paginatedFavorites: Favorite[] = [];
  rowsPerPageOptions = [6, 12, 18];
  first: number = 0;
  rows: number = 6;

  selectedMenu: string = 'details';

  profileForm!: FormGroup;
  editSelectedForm?: FormGroup;

  user = {
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    username: '',
    alcoholAllowed: false,
    consentProfiling: false,
  }

  // TODO: add the favorites from the API
  favorites: Favorite[] = [];


  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private historyService: HistoryService,
    private favoriteService: FavoritesService,
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private http: HttpClient,
  ) {
    this.profileForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      birthDate: [null],
      email: [{value: '', disabled: true}],
      username: [{value: '', disabled: true}],
      alcoholAllowed: [false],
      consentProfiling: [false],
    });

    this.editSelectedForm = this.formBuilder.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      ingredientsList: this.formBuilder.array([]),
      glass: ['', Validators.required],
      type: ['', Validators.required],
      alcoholic: ['', Validators.required],
      instructions: ['', Validators.required]
    });

    this.passwordForm = this.formBuilder.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }


  ngOnInit(): void {

    // * lead the user to the right menu
    this.route.queryParams.subscribe(params => {
      if (params['section'])
        this.selectedMenu = params['section'];
      else
        this.selectedMenu = 'details';
    });

    // * get favorites from the API
    this.getAllFavorites();

    // * get profile data
    this.authService.getUserProfileData().subscribe({
      next: (response) => {
        this.authService.getUserData().subscribe({
          next: (userData) => {
            this.user.username = userData.username;
            this.user.email = userData.email;
            this.profileForm.patchValue({
              firstName: response.firstName,
              lastName: response.lastName,
              birthDate: new Date(response.birthDate),
              email: userData.email,
              username: userData.username,
              alcoholAllowed: response.alcoholAllowed,
              consentProfiling: response.consentProfiling,
            });
          }
        });

        // * set the user data to save them in case of discard changes
        this.user.firstName = response.firstName;
        this.user.lastName = response.lastName;
        this.user.birthDate = response.birthDate;
        this.user.alcoholAllowed = response.alcoholAllowed;
        this.user.consentProfiling = response.consentProfiling;
      },
      error: (error) => {
        console.error('Error fetching user profile data', error);
      }
    });

    // * get user's submissions
    this.authService.getUserSubmissions().subscribe({
      next: (response) => {
        this.submitted = response.map((submission: any) => ({
          id: submission.submissionId,
          name: submission.name,
          image: submission.imageUrl, // Assuming the API returns an image URL
          status: submission.status
        }));
        this.paginatedSubmissions = this.submitted.slice(this.first, this.first + this.rows);
      },
      error: (error) => {
        console.error('Error fetching user submissions', error);
      }
    });
  }

  // * change password
  changePassword() {
    if (this.passwordForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
        life: 3000
      });
      return;
    } else if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Passwords do not match',
        life: 3000
      });
      return;
    } else if (this.passwordForm.get('newPassword')?.errors?.['minlength']) {
        this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'New password must be at least 8 characters long',
        life: 3000
      });
      return;
    }
    this.authService.changePassword(
      this.passwordForm.value.oldPassword,
      this.passwordForm.value.confirmPassword
    ).subscribe({
      next: (response) => {
        this.passwordDialog = false;
        this.authService.login(this.user.email, this.passwordForm.value.confirmPassword).subscribe({
          next: (response) => {
            this.authService.saveTokens(response.token, response.refreshToken.toString(), response.userId);
            this.authService.refresh(this.authService.getRefreshToken()!);
          },
          error: (error) => {
            console.error('Error fetching user profile data', error);
          }
        });
        this.passwordForm.reset();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password changed successfully',
          life: 3000
        });
      }
    });
  }


  // * confirm dialog
  confirm1(event: Event) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Are you sure that you want to proceed? The action is irreversible.',
        header: 'Confirmation',
        closable: true,
        closeOnEscape: true,
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true,
        },
        acceptButtonProps: {
            label: 'Confirm',
            severity: 'danger',
        },
        accept: () => {
          this.deleteAccount();
          this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Profile deleted' });
        },
    });
}

  selectMenu(menu: string) {
    this.selectedMenu = menu;
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 6;
    if (this.selectedMenu === 'favorites')
      this.paginatedFavorites = this.favorites.slice(this.first, this.first + this.rows);
    else if (this.selectedMenu === 'submitted')
      this.paginatedSubmissions = this.submitted.slice(this.first, this.first + this.rows);
  }

  // * MANAGE SUBMITTED COCKTAILS

  submissionDialog: boolean[] = [];

  handleSubmit(form: FormGroup, id: string): void {
    if (form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
        life: 3000
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

    this.http.put(`${this.SubmissionAPI}${id}`, payload, { observe: 'response' }).subscribe({
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

  editSubmission(id: string, index: number): void {
    this.submissionDialog[index] = true;
    this.http.get(`${this.SubmissionAPI}${id}`).subscribe({
      next: (response: any) => {
        this.editSelectedForm?.patchValue({
          name: response.name,
          image: response.imageUrl,
          ingredientsList: response.ingredients.map((ingredient: any) => ({
            id: ingredient.ingredientId,
            name: ingredient.proposedName,
            quantity: ingredient.quantity,
          })),
          glass: response.glass,
          type: response.category,
          alcoholic: response.isAlcoholic ? 'Alcoholic' : 'Non Alcoholic',
          instructions: response.instructions,
        });
      }
    });

  }

  deleteSubmission(id: string): void {
    this.http.delete(`${this.SubmissionAPI}${id}`).subscribe({
      next: (response) => {
        this.submitted = this.submitted.filter(submission => submission.id !== id);
        this.paginatedSubmissions = this.submitted.slice(this.first, this.first + this.rows);
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Submission deleted' });
      },
      error: (error) => {
        console.error('Error deleting submission', error);
      }
    });
  }

  confirmDelete(event: Event, id: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure that you want to delete this submission? The action is irreversible.',
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Confirm',
        severity: 'danger',
      },
      accept: () => {
        this.deleteSubmission(id);
      },
    });
  }

  displayCardPage(cocktailId?: string, name?: string) {
    if (name && cocktailId === undefined) {
      const userId = this.authService.getUserId();
      this.searchService.getCocktailByCreator(userId!, name)
        .subscribe((response: any) => {
          const cocktailId = response.cocktailId;
          this.authService.getProfiling().subscribe((profiling: boolean) => {
            if (profiling) {
              this.historyService.addToHistory([{ filterType: 'cocktail', filterName: cocktailId }], 'search');
            }
          });
          this.router.navigate(['/card'], { queryParams: { cocktailId: cocktailId } });
        });
    } else if (cocktailId && name === undefined) {
      this.router.navigate(['/card'], { queryParams: { cocktailId: cocktailId } });
    }
  }

  userIsLogged(): boolean {
    return this.authService.isLoggedIn();
  }

  redirectHome() {
    this.router.navigate(['/home']);
  }

  manageFavorite(id: string): void {
    this.favoriteService.manageFavorites(id);

    this.favorites = this.favorites.map(fav =>
      fav.id === id ? { ...fav, isFavorite: !fav.isFavorite } : fav
    );

    this.paginatedFavorites = this.favorites.slice(this.first, this.first + this.rows);
  }


  getAllFavorites(): void {
    this.favoriteService.getUserFavorites().subscribe({
      next: (favoritesResponse: any[]) => {

        const cocktailRequests = favoritesResponse.map(f =>
          this.searchService.getSingleCocktail(f.cocktailId)
        );

        forkJoin(cocktailRequests).subscribe({
          next: (cocktails: any[]) => {
            this.favorites = cocktails.map(cocktail => ({
              id: cocktail.cocktailId,
              name: cocktail.name,
              image: cocktail.imageUrl,
              isFavorite: this.favoriteService.isFavorite(cocktail.cocktailId)
            }));
            // * initialize the favorites in order to see them
            this.paginatedFavorites = this.favorites.slice(this.first, this.first + this.rows);
          },
          error: err => {
            console.error('Error fetching one or more cocktails', err);
          }
        });
      },
      error: err => {
        console.error('Error fetching user favorites', err);
      }
    });
  }

  deleteAccount() {
    this.authService.deleteProfile().subscribe({
      next: (response: any) => {
        this.authService.clearTokens();
        this.router.navigate(['/home']);
      },
      error: (error) => {
        if (error.status === 404)
          console.error('Account not found', error);
        else
          console.error('Error deleting account', error);
      }
    });
  }

  discardChanges() {
    this.profileForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      birthDate: new Date(this.user.birthDate),
      alcoholAllowed: this.user.alcoholAllowed,
      consentProfiling: this.user.consentProfiling
    });
  }

  saveChanges() {
    this.authService.updateProfile(
      this.profileForm.value.firstName,
      this.profileForm.value.lastName,
      this.profileForm.value.birthDate,
      this.profileForm.value.alcoholAllowed,
      this.gdpr,
      this.profileForm.value.consentProfiling

    ).subscribe({
      next: (response) => {
        this.authService.logout(this.authService.getRefreshToken()!)
          .subscribe({
            next: () => {
              this.authService.clearTokens();
              this.authService.setLoggedIn(false);
              this.messageService.add({
                severity: 'success',
                summary: 'Logout successful',
                detail: 'You have been logged out',
                life: 3000,
                closable: true,
              });
              this.authService.clearTokens();
              this.router.navigate(['/home']);
            },
            error: (error: any) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Logout failed',
                detail: error.error.message,
                life: 5000,
                closable: true,
              });
            }
          });
        this.router.navigate(['/home']).then(() => {
          window.location.reload();
        });
      },
      error: (error) => {
        console.error('Error updating profile', error);
      }
    }
    )

  }

}
