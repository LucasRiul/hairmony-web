import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'agenda', loadComponent: () => import('./modules/agenda/agenda.component').then(m => m.AgendaComponent) },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'servicos', loadComponent: () => import('./modules/servicos/servicos.component').then(m => m.ServicosComponent) },
  { path: 'colaboradores', loadComponent: () => import('./modules/colaboradores/colaboradores.component').then(m => m.ColaboradoresComponent) },
  { path: 'clientes', loadComponent: () => import('./modules/clientes/clientes.component').then(m => m.ClientesComponent) },
  { path: '', redirectTo: '/agenda', pathMatch: 'full' }
];