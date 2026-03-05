import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Home } from './home/home';
import { Ticket } from './ticket/ticket';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'register',  loadComponent: () => import('./register/register').then(m => m.Register) },
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  { path: 'home', component: Home },
  { path: 'seat-allocation', loadComponent: () => import('./seat-allocation/seat-allocation').then(m => m.SeatAllocation) },
  { path: 'train-status', loadComponent: () => import('./train-status/train-status').then(m => m.TrainStatus) },
  { path: 'dashboard', component: Dashboard },
  { path:  'history', loadComponent: () => import('./history/history').then(m => m.History) },
  { path: 'ticket/:pnr', component: Ticket }
];

