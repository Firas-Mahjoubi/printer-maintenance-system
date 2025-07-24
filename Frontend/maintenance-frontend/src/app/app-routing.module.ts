import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ContratComponent } from './components/contrat/contrat.component';
import { ContratHistoryComponent } from './components/contrat-history/contrat-history.component';
import { ContratFormComponent } from './components/contrat-form/contrat-form.component';
import { ContratDetailsComponent } from './components/contrat-details/contrat-details.component';
import { ContratPrintersComponent } from './components/contrat-printers/contrat-printers.component';
import { ClientsComponent } from './clients/clients/clients.component';
import { AddClientComponent } from './clients/add-client/add-client.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { TicketCreationComponent } from './components/ticket-creation/ticket-creation.component';
import { TicketListComponent } from './components/ticket-list/ticket-list.component';
import { TicketDetailsComponent } from './components/ticket_details/ticket-details.component';
import { PrinterHistoryComponent } from './components/printer-history/printer-history.component';
import { PrinterListComponent } from './components/printer-list/printer-list.component';
import { PrinterHistorySelectorComponent } from './components/printer-history-selector/printer-history-selector.component';
import { ClientLandingComponent } from './components/client-landing/client-landing.component';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { ClientRequestsComponent } from './client-requests/client-requests.component';
import { ClientNewRequestComponent } from './client-new-request/client-new-request.component';
import { ClientEquipmentComponent } from './client-equipment/client-equipment.component';
import { ClientHistoryComponent } from './client-history/client-history.component';
import { TechnicianCalendarComponent } from './components/technician-calendar/technician-calendar.component';
import { MaintenanceSchedulerComponent } from './components/maintenance-scheduler/maintenance-scheduler.component';
import { DiagnosticTechniqueComponent } from './components/diagnostic-technique/diagnostic-technique.component';
import { SolutionTechniqueComponent } from './components/solution-technique/solution-technique.component';
import { SatisfactionClientComponent } from './components/satisfaction-client/satisfaction-client.component';

const routes: Routes = [
  { path: '', component: ClientLandingComponent },
  { path: 'home', component: ClientLandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', redirectTo: '/login', pathMatch: 'full' },
  
  // Admin routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  
  // Client routes
  { path: 'client-dashboard', component: ClientDashboardComponent, canActivate: [AuthGuard] },
  { path: 'client-requests', component: ClientRequestsComponent, canActivate: [AuthGuard] },
  { path: 'client-new-request', component: ClientNewRequestComponent, canActivate: [AuthGuard] },
  { path: 'client-equipment', component: ClientEquipmentComponent, canActivate: [AuthGuard] },
  { path: 'client-history', component: ClientHistoryComponent, canActivate: [AuthGuard] },
  
  // Shared routes (both admin and client can access)
  { path: 'contrats', component: ContratComponent, canActivate: [AuthGuard] },
  { path: 'contrats/historique', component: ContratHistoryComponent, canActivate: [AuthGuard] },
  { path: 'contrats/add', component: ContratFormComponent, canActivate: [AuthGuard] },
  { path: 'contrats/edit/:id', component: ContratFormComponent, canActivate: [AuthGuard] },
  { path: 'contrats/details/:id', component: ContratDetailsComponent, canActivate: [AuthGuard] },
  { path: 'contrats/:id/printers', component: ContratPrintersComponent, canActivate: [AuthGuard] },
  { path: 'clients', component: ClientsComponent, canActivate: [AuthGuard] },
  { path: 'clients/add', component: AddClientComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: 'tickets', component: TicketListComponent, canActivate: [AuthGuard] },
  { path: 'tickets/create', component: TicketCreationComponent, canActivate: [AuthGuard] },
  { path: 'tickets/:id', component: TicketDetailsComponent, canActivate: [AuthGuard] },
  { path: 'tickets/:id/diagnostic', component: DiagnosticTechniqueComponent, canActivate: [AuthGuard] },
  { path: 'tickets/:id/solution', component: SolutionTechniqueComponent, canActivate: [AuthGuard] },
  { path: 'tickets/:id/satisfaction', component: SatisfactionClientComponent, canActivate: [AuthGuard] },
  { path: 'technician-calendar', component: TechnicianCalendarComponent, canActivate: [AuthGuard] },
  { path: 'maintenance-scheduler', component: MaintenanceSchedulerComponent, canActivate: [AuthGuard] },
  { path: 'printers', component: PrinterListComponent, canActivate: [AuthGuard] },
  { path: 'printers/history', component: PrinterHistorySelectorComponent, canActivate: [AuthGuard] },
  { path: 'printers/:id/history', component: PrinterHistoryComponent, canActivate: [AuthGuard] },
  { path: 'printer-history-selector', component: PrinterHistorySelectorComponent, canActivate: [AuthGuard] },
  { path: 'client-landing', component: ClientLandingComponent, canActivate: [AuthGuard] },

  // fallback route
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
