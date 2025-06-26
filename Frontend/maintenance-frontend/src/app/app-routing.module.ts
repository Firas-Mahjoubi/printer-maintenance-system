import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ContratComponent } from './components/contrat/contrat.component';
import { ContratFormComponent } from './components/contrat-form/contrat-form.component';
import { ContratDetailsComponent } from './components/contrat-details/contrat-details.component';
import { ClientService } from './service/client.service';
import { ClientsComponent } from './clients/clients/clients.component';
import { AddClientComponent } from './clients/add-client/add-client.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'contrats/add', component: ContratFormComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'contrats/details/:id', component: ContratDetailsComponent, canActivate: [AuthGuard] },
  { path: 'contrats', component: ContratComponent, canActivate: [AuthGuard] },
  {path:  'clients', component: ClientsComponent, canActivate: [AuthGuard]},
    {path:  'clients/add', component: AddClientComponent, canActivate: [AuthGuard]},

  // fallback route
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
