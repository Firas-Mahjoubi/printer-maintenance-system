import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { MaintenanceSchedulerService } from '../../service/maintenance-scheduler.service';
import { InterventionDTO, TypeIntervention, StatutIntervention } from '../../service/intervention.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-maintenance-scheduler',
  templateUrl: './maintenance-scheduler.component.html',
  styleUrls: ['./maintenance-scheduler.component.css']
})
export class MaintenanceSchedulerComponent implements OnInit {
  maintenancesPreventives: InterventionDTO[] = [];
  loading = false;
  schedulingInProgress = false;
  notificationsInProgress = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  alert = { show: false, message: '', type: '' };

  constructor(
    private maintenanceSchedulerService: MaintenanceSchedulerService,
    @Inject(LOCALE_ID) private locale: string
  ) { }

  ngOnInit(): void {
    this.loadMaintenancesPreventives();
  }

  loadMaintenancesPreventives(): void {
    this.loading = true;
    this.maintenanceSchedulerService.obtenirMaintenancesPreventives(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          console.log('Response from API:', response);
          
          // Ensure each maintenance has valid values
          if (response && response.content) {
            this.maintenancesPreventives = response.content.map((maintenance: InterventionDTO) => {
              // Make sure all required fields have at least default values
              return {
                ...maintenance,
                numero: maintenance.numero || 'TICK-' + Math.floor(Math.random() * 10000),
                titre: maintenance.titre || 'Maintenance préventive',
                contratNumero: maintenance.contratNumero || `CONT-${maintenance.contratId || 'N/A'}`,
                statut: maintenance.statut || 'PLANIFIÉE'
              };
            });
          } else {
            this.maintenancesPreventives = [];
          }
          
          console.log('Maintenances préventives processed:', this.maintenancesPreventives);
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des maintenances préventives', error);
          this.showAlert('danger', 'Erreur lors du chargement des maintenances préventives');
          this.loading = false;
        }
      });
  }

  planifierMaintenancesPreventives(): void {
    this.schedulingInProgress = true;
    this.maintenanceSchedulerService.planifierMaintenancesPreventives()
      .subscribe({
        next: (response) => {
          this.showAlert('success', 'Planification des maintenances préventives déclenchée avec succès');
          this.schedulingInProgress = false;
          // Reload the list after a short delay to allow backend processing
          setTimeout(() => this.loadMaintenancesPreventives(), 1000);
        },
        error: (error) => {
          console.error('Erreur lors de la planification des maintenances préventives', error);
          this.showAlert('danger', 'Erreur lors de la planification des maintenances préventives');
          this.schedulingInProgress = false;
        }
      });
  }

  envoyerNotificationsMaintenance(): void {
    this.notificationsInProgress = true;
    this.maintenanceSchedulerService.envoyerNotificationsMaintenance()
      .subscribe({
        next: (response) => {
          this.showAlert('success', 'Envoi des notifications de maintenance déclenché avec succès');
          this.notificationsInProgress = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi des notifications de maintenance', error);
          this.showAlert('danger', 'Erreur lors de l\'envoi des notifications de maintenance');
          this.notificationsInProgress = false;
        }
      });
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadMaintenancesPreventives();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    try {
      return formatDate(date, 'dd/MM/yyyy HH:mm', this.locale);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  }

  showAlert(type: string, message: string): void {
    this.alert = { show: true, message, type };
    // Hide alert after 5 seconds
    setTimeout(() => {
      this.alert.show = false;
    }, 5000);
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i);
  }
}
