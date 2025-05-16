import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { SearchComponent } from './search/search.component';
import { HomeComponent } from './home/home.component';
import { CardComponent } from './card/card.component';
import { CreateComponent } from './create/create.component';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'search', component: SearchComponent },
  { path: 'card', component: CardComponent },
  { path: 'create', component: CreateComponent },
  { path: 'admin', component: AdminComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
