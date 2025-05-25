import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { SplitButton } from 'primeng/splitbutton';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule, FormBuilder } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-profile-button',
  imports: [ButtonModule, Dialog, InputTextModule, AvatarModule,
            CheckboxModule, ReactiveFormsModule, FormsModule,
            PasswordModule, DividerModule, ToastModule, NgIf, SplitButton,
            DatePickerModule, FloatLabel, NgFor],
  standalone: true,
  templateUrl: './profile-button.component.html',
  styleUrl: './profile-button.component.scss',
  providers: [MessageService]
})
export class ProfileButtonComponent implements OnInit {
    // Button names
  registerButton: string = 'Sign Up';
  loginButton: string = 'Login';
  profileButton: string = 'Profile';

  labels: { [key: string]: string } = {
    username: 'Username',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    surname: 'Surname',
    birthDate: 'Birth Date',
  }

  passwordTips: { [key: string]: string } = {
    minLength: 'At least 8 characters long',
    upperCase: 'At least one uppercase letter',
    lowerCase: 'At least one lowercase letter',
    number: 'At least one number',
  }

    // Messages for login and register
  messages: {[key: string]: string} = {
    login: 'Please login with your credentials',
    register: 'Please insert your informations to register',
    GDPR: `I agree to the Privacy Policy and the processing of my personal data under GDPR.`,
    profiling: `I agree to the use of my data for personalized content.`,
  };

  lastUpdated: string = 'Last updated: April 14, 2025.';
  sections = [
    'We collect your personal data such as name, email, and date of birth during registration. This information is used solely for authentication and profile purposes.',
    'Your data is securely stored and never shared with third parties without consent. Passwords are hashed before being saved.',
    'We use cookies or tokens (e.g. JWT) to maintain your session, but these are stored only in your browser and are not shared externally.',
    'You may request deletion or modification of your data at any time by contacting us.',
    'For more details or to exercise your rights under the GDPR (right to access, modify, erase, etc.), please contact our support team.'
  ];

    // Booleans
  visibles: { [key: string]: boolean } = {
    isLoggedIn: false,
    loginDialogVisible: false,
    registerDialogVisible: false,
    privacyDialogVisible: false,
  };

  items: MenuItem[];

    // Form groups
  privacyForm!: FormGroup;
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router
  )
  {
    this.registerForm = this.formBuilder.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      birthDate: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    // * PROFILE BUTTON LIST
    this.items = [
      {
        label: 'Privacy and data',
        icon: 'pi pi-fw pi-cog',
        command: () => {
          this.router.navigate(['/profile'], { queryParams: { section: 'privacy' } });
        }
      },
      {
        label: 'Favorites',
        icon: 'pi pi-fw pi-star',
        command: () => {
          this.router.navigate(['/profile'], { queryParams: { section: 'favorites' } });
        }
      },
      {
        label: 'Cocktails submitted',
        icon: 'pi pi-fw pi-check',
        command: () => {
          this.router.navigate(['/profile'], { queryParams: { section: 'submitted' } });
        }
      },
      {
        label: 'Privacy',
        icon: 'pi pi-fw pi-shield',
        command: () => {
          this.showPolicy();
        }
      },
      {
        label: 'About',
        icon: 'pi pi-fw pi-question',
        command: () => {
          this.router.navigate(['/about']);
        }
      },
      {
        label: 'Logout',
        icon: 'pi pi-fw pi-sign-out',
        command: () => {
          this.authService.logout(this.authService.getRefreshToken()!)
            .subscribe({
              next: () => {
                this.authService.clearTokens();
                this.visibles['isLoggedIn'] = false;
                this.messageService.add({
                  severity: 'success',
                  summary: 'Logout successful',
                  detail: 'You have been logged out',
                  life: 3000,
                  closable: true,
                });
                this.authService.clearTokens();
                this.visibles['isLoggedIn'] = false;
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
        }
      }
    ];

  }


  // * INIT FUNCTION
  ngOnInit(): void {
    this.authService.getIsLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.visibles['isLoggedIn'] = isLoggedIn;
    });

    if (this.authService.isLoggedIn()) {
      if (this.authService.isTokenExpired(this.authService.getJwtToken()!)) {
        if (this.authService.getRefreshToken()) {
          this.authService.refresh(this.authService.getRefreshToken()!)
          .subscribe({
              next: (response: any) => {
                this.authService.saveTokens(response.token, response.refreshToken.toString());
                this.visibles['isLoggedIn'] = true;
                if (this.authService.isAdmin()) {
                  this.items.unshift({
                    label: 'Admin',
                    icon: 'pi pi-fw pi-user',
                    command: () => {
                      this.router.navigate(['/admin']);
                    }
                  });
                }
              },
              error: (error: any) => {
                this.authService.clearTokens();
                this.visibles['isLoggedIn'] = false;
                console.error('Session refresh failed', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Session refresh failed',
                  detail: error.error.message,
                  life: 5000,
                  closable: true,
                });
              }
          });
        } else {
          this.authService.clearTokens();
          this.visibles['isLoggedIn'] = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Session expired',
            detail: 'Please login again',
            life: 3000,
            closable: true,
          });
        }
      } else {
        this.visibles['isLoggedIn'] = true;
      }

      if (this.authService.isAdmin()) {
        this.items.unshift({
          label: 'Admin',
          icon: 'pi pi-fw pi-user',
          command: () => {
            this.router.navigate(['/admin']);
          }
        });
      }
    }
    this.privacyForm = new FormGroup({
      privacyCheck: new FormControl<boolean>(false, Validators.requiredTrue),
      profilingCheck: new FormControl<boolean>(false)
    });
  }

  toProfile() {
    this.router.navigate(['/profile']);
  }

  showPolicy() {
    this.visibles['privacyDialogVisible'] = !this.visibles['privacyDialogVisible'];
    if (this.visibles['privacyDialogVisible']) {
      this.privacyForm.reset({ privacyCheck: false });
    }
  }

  resetForm() {
    this.registerForm.reset();
    this.loginForm.reset();
  }

  setLoginVisible() {
    this.visibles['loginDialogVisible'] = !this.visibles['loginDialogVisible'];
    if (this.visibles['loginDialogVisible']) {
      this.loginForm.reset();
      this.privacyForm.reset({ privacyCheck: false });
    }
  }

  // * This function is used to show the register form
  setRegisterVisible() {
    this.visibles['registerDialogVisible'] = !this.visibles['registerDialogVisible'];
    if (this.visibles['registerDialogVisible']) {
      this.registerForm.reset();
      this.privacyForm.reset({ privacyCheck: false });
    }
  }

  showError() {
    console.error('Please fill in all the fields');
    this.messageService.add({
      severity: 'warn',
      summary: 'Missing fields',
      detail: 'Please fill in all the fields',
      life: 3000,
      closable: true,
    });
  }

  // * LOGIN
  sendLoginData() {
    if (this.loginForm.invalid)
      return this.showError();
    this.authService.login(
      this.loginForm.controls['email'].value,
      this.loginForm.controls['password'].value)
      .subscribe({
        next: (response: any) => {
            this.router.navigate(['/home']);
            this.authService.saveTokens(response.token, response.refreshToken.toString(), response.userId);
            this.messageService.add({
              severity: 'success',
              summary: 'Login successful',
              detail: 'You can now access your profile',
              life: 3000,
              closable: true,
            });
            this.visibles['isLoggedIn'] = true;
            this.setLoginVisible();
        },
        error: (error: any) => {
          console.error('Login failed', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Login failed',
            detail: 'Invalid credentials',
            life: 5000,
            closable: true,
          });
        }
      });
  }


  // * REGISTRATION
  sendRegisterData() {
    if (this.registerForm.invalid)
      return this.showError();
    const birthDate = new Date(this.registerForm.controls['birthDate'].value);
    // ! to comment for profile button check
    this.authService.register(
      this.registerForm.controls['username'].value,
      this.registerForm.controls['email'].value,
      this.registerForm.controls['password'].value)
      .subscribe({
        next: (response: any) => {
            this.authService.saveTokens(undefined, undefined, response.userId);
            // * Updating profile data when registering to fill the fields
            this.authService.updateProfile(
              this.registerForm.controls['name'].value,
              this.registerForm.controls['surname'].value,
              this.registerForm.controls['birthDate'].value,
              this.isOver18(birthDate),
              this.privacyForm.controls['privacyCheck'].value,
              this.privacyForm.controls['profilingCheck'].value || false)
              .subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Profile registered',
                    detail: 'Your profile has been created, now you can log in',
                    life: 3000,
                    closable: true,
                  });
                  this.setRegisterVisible();
                },
                error: (error: any) => {
                  console.error('Profile update failed', error);
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Profile update failed',
                    detail: error.error.message,
                    life: 5000,
                    closable: true,
                  });
                }
              });
        },
        error: (error: any) => {
          console.error('Registration failed', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Registration failed',
            detail: error.error.message,
            life: 5000,
            closable: true,
          });
        }
      });
  }

  isOver18(birthDate: Date): boolean {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 18;
  }


}
