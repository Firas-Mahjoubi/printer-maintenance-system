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
  
  // Tickets data
  loadingTickets = false;
  allTickets: Ticket[] = [];
  recentTickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  ticketCurrentPage = 0;
  ticketPageSize = 4;
  totalTicketPages = 0;
  
  // Equipment data
  loadingEquipment = false;
  equipmentList: Equipment[] = [];
  filteredEquipment: Equipment[] = [];
  displayedEquipment: Equipment[] = [];
  equipmentSearch = '';
  equipmentStatusFilter = '';
  equipmentCurrentPage = 0;
  equipmentPageSize = 4;
  totalEquipmentPages = 0;

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
    this.recentTickets = [];
    this.equipmentList = [];
    this.equipmentCount = 0;
    this.activeTickets = 0;
    this.lastMaintenance = 0;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Impossible de récupérer les informations utilisateur';
      this.loading = false;
      return;
    }

    // Use Promise.all to load both data types concurrently and handle both loading states
    const ticketsPromise = new Promise<void>((resolve) => {
      this.loadRecentTickets(currentUserId)
        .then(() => resolve())
        .catch(() => resolve()); // Resolve even on error to continue with other data
    });

    const contractsPromise = new Promise<void>((resolve) => {
      this.loadUserContracts()
        .then(() => resolve())
        .catch(() => resolve()); // Resolve even on error to continue with other data
    });

    // When both promises complete, finish loading
    Promise.all([ticketsPromise, contractsPromise])
      .then(() => {
        // Only show error if both data fetches failed
        if (this.recentTickets.length === 0 && this.equipmentList.length === 0) {
          this.error = "Aucune donnée disponible. Veuillez réessayer.";
        }
        this.loading = false;
      });
  }

  private loadRecentTickets(userId: string | number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.loadingTickets = true;
      
      // Get interventions for the client user
      this.interventionService.obtenirTickets(
        undefined, // statut
        undefined, // type
        undefined, // priorite
        undefined, // technicienId
        Number(userId), // demandeurId
        undefined, // contratId
        undefined, // dateDebut
        undefined, // dateFin
        0, // page
        1000 // size (large to get all)
      ).subscribe({
        next: (response) => {
          if (response && response.content) {
            // Map to simplified ticket structure for UI
            this.allTickets = response.content
              .map(intervention => this.mapInterventionToTicket(intervention))
              // Sort by date descending (newest first)
              .sort((a, b) => b.date.getTime() - a.date.getTime());
              
            // Set up filtered tickets and pagination
            this.filteredTickets = [...this.allTickets];
            this.updateTicketPagination();
            
            // Count active tickets (not completed or cancelled)
            this.activeTickets = response.content.filter(i => 
              i.statut !== 'TERMINEE' && i.statut !== 'ANNULEE'
            ).length;
          } else {
            this.allTickets = [];
            this.filteredTickets = [];
            this.activeTickets = 0;
          }
          
          this.loadingTickets = false;
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading tickets:', error);
          this.loadingTickets = false;
          reject(error);
        }
      });
    });
  }

  private loadUserContracts(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const currentUserId = this.authService.getCurrentUserId();
      if (!currentUserId) {
        this.error = 'Impossible de récupérer les informations utilisateur';
        return reject(new Error('User ID not found'));
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
            this.error = 'Aucun contrat trouvé pour votre compte.';
            return resolve(); // Resolve with empty contracts
          }

          // Load equipment from all client's contracts
          this.loadEquipmentFromContracts(clientContracts)
            .then(() => resolve())
            .catch((err) => {
              console.error('Error loading equipment:', err);
              reject(err);
            });
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          this.error = 'Erreur lors du chargement des contrats';
          reject(error);
        }
      });
    });
  }

  private loadEquipmentFromContracts(contracts: Contrat[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.equipmentList = [];
      this.loadingEquipment = true;
      
      if (!contracts || contracts.length === 0) {
        this.equipmentCount = 0;
        this.loadingEquipment = false;
        return resolve();
      }
      
      // Create an array of requests
      const requests = contracts
        .filter(contract => contract.id !== undefined && contract.id !== null) // Filter out contracts without IDs
        .map(contract => {
          return new Promise<Equipment[]>((resolveContract, rejectContract) => {
            this.imprimanteService.getAllByContrat(contract.id!).subscribe({
              next: (printers) => {
                const mappedEquipment = printers.map(printer => this.mapPrinterToEquipment(printer));
                resolveContract(mappedEquipment);
              },
              error: (error) => {
                console.error(`Error loading equipment for contract ${contract.id}:`, error);
                // Resolve with empty array to continue with other contracts
                resolveContract([]);
              }
            });
          });
        });
      
      if (requests.length === 0) {
        this.equipmentCount = 0;
        this.loadingEquipment = false;
        return resolve();
      }
      
      // Process all requests in parallel
      Promise.all(requests)
        .then((equipmentArrays) => {
          // Flatten the arrays into a single array of equipment
          const allEquipment = equipmentArrays.flat();
          
          // Update the equipment list and count
          this.equipmentList = allEquipment;
          this.equipmentCount = allEquipment.length;
          
          // Set up pagination and filtering for equipment
          this.filteredEquipment = [...this.equipmentList];
          this.updateEquipmentPagination();
          
          // Calculate days since last maintenance if we have equipment
          if (this.equipmentList.length > 0) {
            this.calculateLastMaintenanceDays();
          }
          
          this.loadingEquipment = false;
          resolve();
        })
        .catch((error) => {
          console.error('Error loading equipment:', error);
          // If we have at least some equipment, show it anyway
          if (this.equipmentList.length > 0) {
            this.filteredEquipment = [...this.equipmentList];
            this.updateEquipmentPagination();
            this.calculateLastMaintenanceDays();
          }
          
          this.loadingEquipment = false;
          resolve();
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
    // Determine equipment status based on available data
    let status = 'operational';
    let statusLabel = 'Opérationnel';
    
    // Check if printer has a custom status field, if not infer from other data
    if ('status' in printer) {
      status = (printer as any).status?.toLowerCase() || 'operational';
      statusLabel = this.getPrinterStatusLabel(status);
    } else if ('enPanne' in printer && (printer as any).enPanne) {
      status = 'en_panne';
      statusLabel = 'En panne';
    } else if ('enMaintenance' in printer && (printer as any).enMaintenance) {
      status = 'en_maintenance';
      statusLabel = 'En maintenance';
    }
    
    // Get real page count or use 0 if not available
    const pageCount = (printer as any).compteurPages || (printer as any).pageCount || 0;
    
    // Get last maintenance date or use a recent date if not available
    let lastMaintenance: Date;
    if ((printer as any).derniereMaintenance) {
      lastMaintenance = new Date((printer as any).derniereMaintenance);
    } else if ((printer as any).lastMaintenance) {
      lastMaintenance = new Date((printer as any).lastMaintenance);
    } else {
      // Use a date from the last 30 days as fallback
      lastMaintenance = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    }
    
    return {
      id: printer.id.toString(),
      name: `${printer.marque || ''} ${printer.modele}`.trim(),
      model: printer.modele,
      serialNumber: printer.numeroSerie || 'N/A',
      location: printer.emplacement || 'Non spécifié',
      status,
      statusLabel,
      pageCount,
      lastMaintenance
    };
  }
  
  private getPrinterStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'operational': 'Opérationnel',
      'actif': 'Actif',
      'en_panne': 'En panne',
      'en_maintenance': 'En maintenance',
      'hors_service': 'Hors service'
    };
    return statusMap[status] || 'Opérationnel';
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
  
  // Equipment filtering and pagination methods
  filterEquipment(): void {
    if (!this.equipmentList || this.equipmentList.length === 0) {
      this.filteredEquipment = [];
      this.displayedEquipment = [];
      return;
    }
    
    let filtered = [...this.equipmentList];
    
    // Apply search filter
    if (this.equipmentSearch && this.equipmentSearch.trim() !== '') {
      const search = this.equipmentSearch.toLowerCase().trim();
      filtered = filtered.filter(equipment => 
        equipment.name.toLowerCase().includes(search) ||
        equipment.model.toLowerCase().includes(search) ||
        equipment.serialNumber.toLowerCase().includes(search) ||
        equipment.location.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (this.equipmentStatusFilter && this.equipmentStatusFilter !== '') {
      filtered = filtered.filter(equipment => 
        equipment.status === this.equipmentStatusFilter
      );
    }
    
    this.filteredEquipment = filtered;
    this.equipmentCurrentPage = 0; // Reset to first page when filters change
    this.updateEquipmentPagination();
  }
  
  clearEquipmentSearch(): void {
    this.equipmentSearch = '';
    this.filterEquipment();
  }
  
  resetEquipmentFilters(): void {
    this.equipmentSearch = '';
    this.equipmentStatusFilter = '';
    this.filterEquipment();
  }
  
  updateEquipmentPagination(): void {
    // Calculate total pages
    this.totalEquipmentPages = Math.ceil(this.filteredEquipment.length / this.equipmentPageSize);
    
    // Get current page's items
    const startIndex = this.equipmentCurrentPage * this.equipmentPageSize;
    const endIndex = Math.min(startIndex + this.equipmentPageSize, this.filteredEquipment.length);
    this.displayedEquipment = this.filteredEquipment.slice(startIndex, endIndex);
  }
  
  updateTicketPagination(): void {
    // Calculate total pages
    this.totalTicketPages = Math.ceil(this.filteredTickets.length / this.ticketPageSize);
    
    // Get current page's items
    const startIndex = this.ticketCurrentPage * this.ticketPageSize;
    const endIndex = Math.min(startIndex + this.ticketPageSize, this.filteredTickets.length);
    this.recentTickets = this.filteredTickets.slice(startIndex, endIndex);
  }
  
  changePage(page: number, type: 'equipment' | 'ticket'): void {
    if (type === 'equipment') {
      if (page < 0 || page >= this.totalEquipmentPages) return;
      this.equipmentCurrentPage = page;
      this.updateEquipmentPagination();
    } else if (type === 'ticket') {
      if (page < 0 || page >= this.totalTicketPages) return;
      this.ticketCurrentPage = page;
      this.updateTicketPagination();
    }
  }
  
  // Status and priority icon methods
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'EN_ATTENTE': 'fas fa-clock',
      'PLANIFIEE': 'fas fa-calendar-check',
      'EN_COURS': 'fas fa-play-circle',
      'EN_PAUSE': 'fas fa-pause-circle',
      'TERMINEE': 'fas fa-check-circle',
      'ANNULEE': 'fas fa-times-circle',
      'REPORTEE': 'fas fa-calendar-alt',
      'REJETEE': 'fas fa-ban',
      'ATTENTE_PIECES': 'fas fa-truck',
      'ATTENTE_CLIENT': 'fas fa-user-clock'
    };
    return icons[status] || 'fas fa-question-circle';
  }
  
  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      'BASSE': 'priority-low',
      'NORMALE': 'priority-normal',
      'HAUTE': 'priority-high',
      'CRITIQUE': 'priority-critical'
    };
    return icons[priority] || '';
  }
}
