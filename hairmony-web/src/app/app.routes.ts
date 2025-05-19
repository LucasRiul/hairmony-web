import { AuthGuard } from './guards/auth.guard';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'agenda', loadComponent: () => import('./modules/agenda/agenda.component').then(m => m.AgendaComponent), canActivate: [AuthGuard] },
  { path: 'servicos', loadComponent: () => import('./modules/servicos/servicos.component').then(m => m.ServicosComponent), canActivate: [AuthGuard] },
  { path: 'colaboradores', loadComponent: () => import('./modules/colaboradores/colaboradores.component').then(m => m.ColaboradoresComponent), canActivate: [AuthGuard] },
  { path: 'clientes', loadComponent: () => import('./modules/clientes/clientes.component').then(m => m.ClientesComponent), canActivate: [AuthGuard] },
  { path: '', redirectTo: '/agenda', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }