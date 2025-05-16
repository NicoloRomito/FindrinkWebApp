import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, AdminService, LeftButtonsComponent, ProfileButtonComponent, SearchService, SearchInput, CocktailCreateFormComponent, StatsService } from 'shared';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { Image } from 'primeng/image';
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { HttpClient } from '@angular/common/http';
import { Card } from 'primeng/card';
import { Paginator } from 'primeng/paginator';
import { forkJoin } from 'rxjs';
import { Toast } from 'primeng/toast';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { MessageModule } from 'primeng/message';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ChartModule } from 'primeng/chart';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

interface Submission {
  id: string;
  name: string;
  instructions: string;
  glass: string;
  category: string;
  image: string;
  status: string;
  createdAt: string;
  isAlcoholic: boolean;
  ingredients: Ingredient[];
}

interface showDialog {
  ingredient: boolean;
  instructions: boolean;
}

interface Cocktail {
  id: string;
  name: string;
  image: string;
  openDialog: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  isAdmin: boolean;
  isBanned: boolean;
  alcoholAllowed: boolean;
  consentGdpr: boolean;
  consentProfiling: boolean;
  createdAt: string;
  lastLogin: string;
  openDialog: boolean;
}

// ?submission section
// ?users section
// ?users stats
// ?cocktail stats
// ?manage cocktails with research
// * reload db

@Component({
  selector: 'app-admin',
  imports: [
    Dialog, CommonModule, Button, TableModule, ChartModule,
    LeftButtonsComponent, ProfileButtonComponent,
    TagModule, Image, FloatLabel, ReactiveFormsModule,
    InputText, Card, Paginator, Toast, ConfirmDialog,
    MessageModule, Divider, Panel, CocktailCreateFormComponent
   ],
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class AdminComponent implements OnInit {

  // * cocktail paginator
  paginatedResults: Cocktail[] = [];
  rowsPerPageOptions = [12, 18, 24];
  first: number = 0;
  rows: number = 12;

  // TODO: RELOAD DA FARE IMPORTANTE !!!!!!!

  // * db management
  private taskDatabaseId: string = '';
  statusDialog: boolean = false;
  statusResponse = {
    status: '',
    startedAt: '',
    completedAt: '',
    insertedCount: 0,
  }

  // ? cocktail import buttons
  // ! import db e status task -> quando importDb e' completato chiamare import ingredient da submission service
  // ! tutta la cartella data import da cocktail service
  // ! ultimo ma piu' importante reload da search service/admin

  // * not admin dialog
  visible: boolean = true;
  dialogHeader: string = 'Cannot access to this page';

  // * tab buttons menu
  selectedMenu: string = 'pendingSubmissions';

  // * pending submissions
  cocktailSubmissions: Submission[] = [];

  // * boolean array for buttons
  showDialogs: showDialog[] = [];

  // * search form
  searchForm!: FormGroup;
  filters: SearchInput[] = [];

  // * cocktails
  cocktailResults: Cocktail[] = [];

  // * users
  userProfiles: UserProfile[] = [];

  // * edit cocktail
  editSelectedForm!: FormGroup;
  private editCocktailAPI: string = 'http://localhost:5000/cocktail/single/';

  // * CHARTS
  cocktailChartData: any;
  glassChartData: any;
  userChartData: any;
  historyChartData: any;

  chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };



  // * SUBMISSION API
  private approveSubmissionAPI: string = 'http://localhost:5000/submission/admin/approve/';
  private rejectSubmissionAPI: string = 'http://localhost:5000/submission/admin/reject/';

  // * USER PROFILE API
  private userProfilesAPI: string = 'http://localhost:5000/userprofile/api/admin/profiles';

  private userAPI: string = 'http://localhost:5000/auth/api/admin/users';

  private forceLogoutAPI: string = 'http://localhost:5000/auth/api/admin/force-logout/';

  // * COCKTAIL API JUST FOR ADMIN
  private cocktailAPI: string = 'http://localhost:5000/cocktail/single/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private searchService: SearchService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private adminService: AdminService,
    private statService: StatsService
  ) {
    this.searchForm = this.formBuilder.group({
      filterName: '',
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
  }

  // * INIT
  ngOnInit(): void {
    this.getPendingSubmissions();

    this.searchBarChanges();

    this.getUserProfiles();

    this.loadCocktailStats();
    this.loadUserStats();
    this.loadHistoryStats();
  }

  // * SUBMISSION FUNCTIONS ----------------

  getPendingSubmissions(): void {
    this.authService.getPendingSubmissions().subscribe({
      next: (res: any) => {
        this.cocktailSubmissions = res.map((submission: any) => ({
          id: submission.submissionId,
          name: submission.name,
          instructions: submission.instructions,
          glass: submission.glass,
          category: submission.category,
          image: submission.imageUrl,
          status: submission.status,
          createdAt: submission.createdAt,
          isAlcoholic: submission.isAlcoholic,
          instructionsVisible: false,
          ingredients: submission.ingredients.map((ingredient: any) => ({
            id: ingredient.ingredientId,
            name: ingredient.proposedName,
            quantity: ingredient.quantity
          }))
        }));

        this.showDialogs = res.map(() => ({
          ingredient: false,
          instructions: false
        }));
      }
    });
  }

  getStatusSeverity(status: string): "warn" | "success" | "danger" {
    if (status === 'Approved') {
      return "success";
    } else if (status === 'Rejected') {
      return "danger";
    }
    return "warn";
  }


  approveSubmission(submissionId: string): void {
    this.http.patch(`${this.approveSubmissionAPI}${submissionId}`, {})
    .subscribe({
        next: () => {
          this.refreshList();
        },
        error: (err) => {
          console.error('Error approving submission', err);
        }
      });
    }

    rejectSubmission(submissionId: string): void {
    this.http.patch(`${this.rejectSubmissionAPI}${submissionId}`, {})
    .subscribe({
        next: () => {
          this.refreshList();
        },
        error: (err) => {
          console.error('Error rejecting submission', err);
        }
      });
    }

    setVisible(section: string, index: number): void {
    if (section === 'ingredient') {
      this.showDialogs[index].ingredient = !this.showDialogs[index].ingredient;
    } else if (section === 'instructions') {
      this.showDialogs[index].instructions = !this.showDialogs[index].instructions;
    }
  }

  // * ----------------------------------

  // * REGULAR FUNCTIONS (COMMON USED)---

  refreshList(): void {
    if (this.selectedMenu === 'pendingSubmissions')
      this.getPendingSubmissions();
    else if (this.selectedMenu === 'userManagement')
      this.getUserProfiles();
  }

  selectMenu(menu: string): void {
    this.selectedMenu = menu;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  redirectHome(): void {
    this.router.navigate(['/home']);
  }

  // * ----------------------------------

  // * COCKTAIL MANAGEMENT FUNCTIONS ----

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
        proposedName: ing.id.name || ing.name,
        quantity: ing.quantity.includes(ing.measure.name) ? ing.quantity : `${ing.quantity} ${ing.measure.name}`
      }))
    };

    this.http.put(`${this.editCocktailAPI}${id}`, payload, { observe: 'response' }).subscribe({
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

  searchBarChanges(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe((searchTerm: any) => {
        this.searchService.searchCocktailsForAdmin({
          filterType: 'cocktail',
          filterName: searchTerm.filterName
        }).subscribe((res: any) => {
          this.cocktailResults = res.map((cocktail: any) => ({
            id: cocktail.cocktailId,
            name: cocktail.name,
            image: cocktail.imageUrl,
            openDialog: false
          }));
          this.paginatedResults = this.cocktailResults.slice(this.first, this.first + this.rows);
        });
      });
  }


  onPageChange(event: any): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    if (this.selectedMenu === 'cocktailManagement')
      this.paginatedResults = this.cocktailResults.slice(this.first, this.first + this.rows);
  }

  confirmDelete(cocktailId: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this cocktail?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.deleteCocktail(cocktailId);
      }
    });
  }

  deleteCocktail(id: string): void {
    this.http.delete(`${this.cocktailAPI}${id}`)
      .subscribe({
        next: () => {
          this.searchBarChanges();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Cocktail deleted successfully!',
            life: 3000
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Cocktail already deleted or not found',
            life: 3000
          });
        }
      });
  }

  // * ----------------------------------

  // * USER MANAGEMENT FUNCTIONS --------

  getUserProfiles(): void {
    forkJoin({
      profiles: this.http.get(this.userProfilesAPI),
      users: this.http.get(this.userAPI)
    }).subscribe({
      next: ({ profiles, users }: any) => {
        this.userProfiles = users.map((user: any) => {
          const profile = profiles.find((p: any) => p.userId === user.id);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            isBanned: user.isDeleted,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            // Merge from profile if found
            firstName: profile?.firstName,
            lastName: profile?.lastName,
            birthDate: profile?.birthDate,
            alcoholAllowed: profile?.alcoholAllowed,
            consentGdpr: profile?.consentGdpr,
            consentProfiling: profile?.consentProfiling,
            openDialog: false
          };
        });
      },
      error: (err) => {
        console.error('Error fetching user data', err);
      }
    });
  }

  confirmBan(userId: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to ban this user?',
      header: 'Confirm Ban',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ban',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.deleteUser(userId);
      }
    });
  }

  confirmChangeRole(userId: string, isAdmin: boolean): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to ${isAdmin ? 'revoke admin rights from' : 'grant admin rights to'} this user?`,
      header: 'Confirm Role Change',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isAdmin ? 'Revoke' : 'Grant',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: isAdmin ? 'p-button-danger' : 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
      this.changeRole(userId, !isAdmin);
      }
    });
  }

  changeRole(userId: string, makeAdmin: boolean): void {
    this.adminService.changeRole(userId, makeAdmin).subscribe({
      next: (res: any) => {
        this.refreshList();
      },
      error: (err) => {
        console.error('Error changing user role', err);
      }
    });
  }


  deleteUser(userId: string): void {
    // * ORDER MATTERS
    // * 1. Delete user profile
    // * 2. Delete user
    // * 3. Force logout user if logged in
    this.http.delete(`${this.userProfilesAPI}/${userId}`)
      .subscribe({
        next: () => {
          this.http.delete(`${this.userAPI}/${userId}`)
            .subscribe({
              next: () => {
                this.http.post(`${this.forceLogoutAPI}${userId}`, {})
                  .subscribe({
                    next: () => {
                      this.refreshList();
                    },
                    error: (err) => {
                      if (err.status === 404) {
                        this.refreshList();
                      } else
                        console.error('Error logging out user', err);
                    }
                  });
              },
              error: (err) => {
                console.error('Error deleting user', err);
              }
            });
        },
        error: (err) => {
          console.error('Error deleting user profile', err);
        }
      });
  }

  // * ----------------------------------

  // * COCKTAIL STATS FUNCTIONS ---------

  loadCocktailStats(): void {
    this.statService.getPopularCocktails().subscribe((data: any) => {
      this.cocktailChartData = {
        labels: data.map((item: any) => item.cocktail), // ✅ fixed here
        datasets: [
          {
            label: 'Popular Cocktails',
            backgroundColor: '#42A5F5',
            data: data.map((item: any) => item.count)
          }
        ]
      };
    });

    this.statService.getPopularGlasses().subscribe((data: any) => {
      this.glassChartData = {
        labels: data.map((item: any) => item.glass),
        datasets: [
          {
            label: 'Popular Glasses',
            backgroundColor: ['#66BB6A', '#FFA726', '#26C6DA', '#FF6384'],
            data: data.map((item: any) => item.count)
          }
        ]
      };
    });
  }

  // * TEST EXAMPLE DATA
  // loadCocktailStats(): void {
  //   const popularCocktails = [
  //     { cocktail: 'Negroni', count: 5 },
  //     { cocktail: 'Margarita', count: 3 },
  //     { cocktail: 'Old Fashioned', count: 2 },
  //     { cocktail: 'Spritz', count: 1 }
  //   ];

  //   const popularGlasses = [
  //     { glass: 'Highball Glass', count: 6 },
  //     { glass: 'Martini Glass', count: 4 },
  //     { glass: 'Coupe Glass', count: 2 },
  //     { glass: 'Old-Fashioned Glass', count: 1 }
  //   ];

  //   this.cocktailChartData = {
  //     labels: popularCocktails.map(item => item.cocktail),
  //     datasets: [
  //       {
  //         label: 'Popular Cocktails',
  //         backgroundColor: '#42A5F5',
  //         data: popularCocktails.map(item => item.count)
  //       }
  //     ]
  //   };

  //   this.glassChartData = {
  //     labels: popularGlasses.map(item => item.glass),
  //     datasets: [
  //       {
  //         label: 'Popular Glasses',
  //         backgroundColor: ['#66BB6A', '#FFA726', '#26C6DA', '#FF6384'],
  //         data: popularGlasses.map(item => item.count)
  //       }
  //     ]
  //   };
  // }



  // * USER STATS FUNCTIONS -------------

  loadUserStats(): void {
    this.statService.getUserStats().subscribe((data: any) => {
      this.userChartData = {
        labels: ['Active', 'Inactive'],
        datasets: [
          {
            label: 'Users',
            backgroundColor: ['#42A5F5', '#FF6384'],
            data: [data.activeUsers, data.inactiveUsers]
          }
        ]
      };
    });
  }

  // * ----------------------------------

  // * HISTORY STATS FUNCTIONS -----------

  loadHistoryStats(): void {
    this.statService.getPopularFilters().subscribe((data: any) => {
      this.historyChartData = {
        labels: data.map((item: any) => item.filterName),
        datasets: [
          {
            label: 'Popular Search Filters',
            borderColor: '#42A5F5',
            fill: false,
            data: data.map((item: any) => item.count)
          }
        ]
      };
    });
  }

  // * ----------------------------------

  // * DB MANAGEMENT FUNCTIONS ---------

  importDB(): void {
    this.adminService.importDb().subscribe({
      next: (res: any) => {
        this.taskDatabaseId = res.taskId;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Database import started successfully! Check the status.',
          life: 5000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error importing database',
          life: 3000
        });
      }
    });
  }

  getStatusTask(): void {
    this.adminService.getImportDbStatus(this.taskDatabaseId)
      .subscribe({
        next: (res: any) => {
          this.statusResponse.startedAt = res.startedAt;
          this.statusResponse.status = res.status;
          this.statusResponse.completedAt = res.completedAt;
          this.statusResponse.insertedCount = res.insertedCount;
        },
        error: (err) => {
          console.error('Error getting status task', err);
        }
      });
  }

  importSubmissionIngredients(): void {
    const bodyArray: { ingredientId: string; name: string; normalizedName: string }[] = [];

    this.adminService.getIngredientImport().subscribe({
      next: (res: any) => {
        res.forEach((ingredient: any) => {
          bodyArray.push({
            ingredientId: ingredient.ingredientId,
            name: ingredient.name,
            normalizedName: ingredient.proposedName // ✅ use the right property
          });
        });
        this.adminService.importNewIngredients(bodyArray).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Ingredients imported successfully!',
              life: 3000
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error importing ingredients',
              life: 3000
            });
          }
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error fetching ingredients for import',
          life: 3000
        });
      }
    });
  }



  importIngredients(): void {
    this.adminService.importIngredients().subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Ingredients imported successfully!',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error importing ingredients',
          life: 3000
        });
      }
    });
  }

  importCocktails(): void {
    this.adminService.importCocktails().subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Cocktails imported successfully!',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error importing cocktails',
          life: 3000
        });
      }
    });
  }

  importCocktailsWithIngredients(): void {
    this.adminService.importIngredientsMap().subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Cocktails with ingredients imported successfully!',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error importing cocktails with ingredients',
          life: 3000
        });
      }
    });
  }

  importAll(): void {
    this.adminService.importAll().subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'All data imported successfully!',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error importing all data',
          life: 3000
        });
      }
    });
  }

  reloadSearchDatabase(): void {
    this.adminService.reloadSearchDb().subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Search database reloaded successfully!',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error reloading search database',
          life: 3000
        });
      }
    });
  }

  // * ----------------------------------

}
