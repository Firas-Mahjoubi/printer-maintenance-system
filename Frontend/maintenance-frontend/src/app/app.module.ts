import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { LoginComponent } from './login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ContratComponent } from './components/contrat/contrat.component';
import { ContratFormComponent } from './components/contrat-form/contrat-form.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { ContratDetailsComponent } from './components/contrat-details/contrat-details.component';
import { ClientsComponent } from './clients/clients/clients.component';
import { AddClientComponent } from './clients/add-client/add-client.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { TicketCreationComponent } from './components/ticket-creation/ticket-creation.component';
import { TicketListComponent } from './components/ticket-list/ticket-list.component';
import { TicketDetailsComponent } from './components/ticket-details/ticket-details.component';
import { PrinterHistoryComponent } from './components/printer-history/printer-history.component';
import { PrinterListComponent } from './components/printer-list/printer-list.component';
import { PrinterHistorySelectorComponent } from './components/printer-history-selector/printer-history-selector.component';
import { ClientLandingComponent } from './components/client-landing/client-landing.component';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { ClientRequestsComponent } from './client-requests/client-requests.component';
import { ClientNewRequestComponent } from './client-new-request/client-new-request.component';
import { ClientEquipmentComponent } from './client-equipment/client-equipment.component';
import { ClientHistoryComponent } from './client-history/client-history.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SidebarComponent,
    NavbarComponent,
    DashboardComponent,
    LandingComponent,
    ContratComponent,
    ContratFormComponent,
    ContratDetailsComponent,
    ClientsComponent,
    AddClientComponent,
    NotificationsComponent,
    TicketCreationComponent,
    TicketListComponent,
    TicketDetailsComponent,
    PrinterHistoryComponent,
    PrinterListComponent,
    PrinterHistorySelectorComponent,
    ClientLandingComponent,
    ClientDashboardComponent,
    ClientRequestsComponent,
    ClientNewRequestComponent,
    ClientEquipmentComponent,
    ClientHistoryComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
        AngularEditorModule,

    
  ],
  providers: [
     {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
