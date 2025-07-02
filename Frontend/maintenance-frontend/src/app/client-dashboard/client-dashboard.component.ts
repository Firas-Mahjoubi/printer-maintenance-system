import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { InterventionService, InterventionDTO, StatutIntervention, PrioriteIntervention } from '../service/intervention.service';
import { ContratService, Contrat } from '../service/contrat.service';
import { ImprimanteService, Imprimante } from '../service/imprimante.service';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  date: Date;
}

interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  location: string;
  status: string;
  statusLabel: string;
  pageCount: number;
  lastMaintenance: Date;
}

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit {
  currentUser: any;
  equipmentCount = 0;
  activeTickets = 0;
  lastMaintenance = 0;
  loading = true;
  error: string | null = null;

  recentTickets: Ticket[] = [];
  equipmentList: Equipment[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private interventionService: InterventionService,
    private contratService: ContratService,
    private imprimanteService: ImprimanteService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // If not logged in or not a client, redirect
    if (!this.authService.isLoggedIn() || this.authService.getCurrentUserRole() !== 'CLIENT') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboardData();
  }

  public loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Impossible de récupérer les informations utilisateur';
      this.loading = false;
      return;
    }

    // Load recent tickets for the current user
    this.loadRecentTickets(currentUserId);
    
    // Load contracts and equipment for the current user
    this.loadUserContracts();
  }

  private loadRecentTickets(userId: number): void {
    this.interventionService.obtenirTickets(
      undefined, // statut
      undefined, // type
      undefined, // priorite
      undefined, // technicienId
      userId,    // demandeurId - current user
      undefined, // contratId
      undefined, // dateDebut
      undefined, // dateFin
      0,         // page
      5          // size - only get recent 5 tickets
    ).subscribe({
      next: (response) => {
        this.recentTickets = response.content.map(intervention => this.mapInterventionToTicket(intervention));
        this.activeTickets = response.content.filter(i => 
          i.statut !== 'TERMINEE' && i.statut !== 'ANNULEE'
        ).length;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.error = 'Erreur lors du chargement des tickets';
      }
    });
  }

  private loadUserContracts(): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Impossible de récupérer les informations utilisateur';
      this.loading = false;
      return;
    }

    // Get all contracts and filter by current client ID
    this.contratService.getAll().subscribe({
      next: (allContracts) => {
        // Filter contracts that belong to the current client
        const clientContracts = allContracts.filter(contrat => 
          contrat.clientId === currentUserId || 
          contrat.client?.id === currentUserId
        );
        
        if (clientContracts.length === 0) {
          this.loading = false;
          this.error = 'Aucun contrat trouvé pour votre compte.';
          return;
        }

        // Load equipment from all client's contracts
        this.loadEquipmentFromContracts(clientContracts);
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.error = 'Erreur lors du chargement des contrats';
        this.loading = false;
      }
    });
  }

  private loadEquipmentFromContracts(contracts: Contrat[]): void {
    this.equipmentList = [];
    let completedRequests = 0;
    let totalEquipmentCount = 0;

    contracts.forEach(contrat => {
      if (!contrat.id) {
        completedRequests++;
        if (completedRequests === contracts.length) {
          this.equipmentCount = totalEquipmentCount;
          this.calculateLastMaintenanceDays();
          this.loading = false;
        }
        return;
      }

      this.imprimanteService.getAllByContrat(contrat.id).subscribe({
        next: (printers) => {
          const mappedEquipment = printers.map(printer => this.mapPrinterToEquipment(printer));
          this.equipmentList = [...this.equipmentList, ...mappedEquipment];
          totalEquipmentCount += printers.length;
          
          completedRequests++;
          if (completedRequests === contracts.length) {
            this.equipmentCount = totalEquipmentCount;
            this.calculateLastMaintenanceDays();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Error loading equipment for contract ${contrat.id}:`, error);
          completedRequests++;
          if (completedRequests === contracts.length) {
            this.equipmentCount = totalEquipmentCount;
            if (this.equipmentList.length > 0) {
              this.calculateLastMaintenanceDays();
            }
            this.loading = false;
          }
        }
      });
    });
  }

  private mapInterventionToTicket(intervention: InterventionDTO): Ticket {
    return {
      id: intervention.id?.toString() || '',
      title: intervention.titre,
      description: intervention.description,
      status: intervention.statut || 'EN_ATTENTE',
      statusLabel: this.getStatusLabel(intervention.statut || 'EN_ATTENTE'),
      priority: intervention.priorite,
      priorityLabel: this.getPriorityLabel(intervention.priorite),
      date: intervention.dateCreation ? new Date(intervention.dateCreation) : new Date()
    };
  }

  private mapPrinterToEquipment(printer: Imprimante): Equipment {
    return {
      id: printer.id.toString(),
      name: `${printer.marque} ${printer.modele}`,
      model: printer.modele,
      serialNumber: printer.numeroSerie,
      location: printer.emplacement,
      status: 'operational', // Default status, could be enhanced with real status
      statusLabel: 'Opérationnel',
      pageCount: Math.floor(Math.random() * 50000), // Mock page count
      lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
    };
  }

  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'EN_PAUSE': 'En pause',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée',
      'REPORTEE': 'Reportée',
      'REJETEE': 'Rejetée',
      'ATTENTE_PIECES': 'Attente pièces',
      'ATTENTE_CLIENT': 'Attente client'
    };
    return statusLabels[status] || status;
  }

  private getPriorityLabel(priority: string): string {
    const priorityLabels: { [key: string]: string } = {
      'BASSE': 'Basse',
      'NORMALE': 'Normale',
      'HAUTE': 'Haute',
      'CRITIQUE': 'Critique'
    };
    return priorityLabels[priority] || priority;
  }

  private calculateLastMaintenanceDays(): void {
    if (this.equipmentList.length > 0) {
      const dates = this.equipmentList.map(eq => eq.lastMaintenance.getTime());
      const mostRecentMaintenance = new Date(Math.max(...dates));
      const daysDiff = Math.floor((Date.now() - mostRecentMaintenance.getTime()) / (1000 * 60 * 60 * 24));
      this.lastMaintenance = daysDiff;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  createTicket(): void {
    this.router.navigate(['/client-new-request']);
  }

  viewTickets(): void {
    this.router.navigate(['/client-requests']);
  }

  viewEquipment(): void {
    this.router.navigate(['/client-equipment']);
  }

  viewHistory(): void {
    this.router.navigate(['/client-history']);
  }

  viewTicketDetails(ticketId: string): void {
    this.router.navigate(['/tickets', ticketId]);
  }
}
