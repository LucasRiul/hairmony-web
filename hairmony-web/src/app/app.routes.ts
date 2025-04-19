import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'agenda', loadComponent: () => import('./agenda/agenda.component').then(m => m.AgendaComponent) },
  { path: 'servicos', loadComponent: () => import('./servicos/servicos.component').then(m => m.ServicosComponent) },
  { path: 'colaboradores', loadComponent: () => import('./colaboradores/colaboradores.component').then(m => m.ColaboradoresComponent) },
  { path: 'clientes', loadComponent: () => import('./clientes/clientes.component').then(m => m.ClientesComponent) },
  { path: '', redirectTo: '/agenda', pathMatch: 'full' }
];