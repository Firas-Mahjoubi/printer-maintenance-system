import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InterventionService, InterventionDTO, StatutIntervention, TypeIntervention, PrioriteIntervention, PageResponse } from '../../service/intervention.service';

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.css']
})
export class TicketListComponent implements OnInit {
  tickets: InterventionDTO[] = [];
  filteredTickets: InterventionDTO[] = [];
  isLoading = true;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  // Filtres
  filters = {
    statut: '',
    type: '',
    priorite: '',
    recherche: ''
  };
  
  // Options pour les filtres
  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: StatutIntervention.EN_ATTENTE, label: 'En attente' },
    { value: StatutIntervention.PLANIFIEE, label: 'Planifiée' },
    { value: StatutIntervention.EN_COURS, label: 'En cours' },
    { value: StatutIntervention.EN_PAUSE, label: 'En pause' },
    { value: StatutIntervention.TERMINEE, label: 'Terminée' },
    { value: StatutIntervention.ANNULEE, label: 'Annulée' }
  ];
  
  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: TypeIntervention.CORRECTIVE, label: 'Corrective' },
    { value: TypeIntervention.PREVENTIVE, label: 'Préventive' },
    { value: TypeIntervention.URGENTE, label: 'Urgente' },
    { value: TypeIntervention.INSTALLATION, label: 'Installation' },
    { value: TypeIntervention.MAINTENANCE, label: 'Maintenance' },
    { value: TypeIntervention.FORMATION, label: 'Formation' }
  ];
  
  prioriteOptions = [
    { value: '', label: 'Toutes les priorités' },
    { value: PrioriteIntervention.BASSE, label: 'Basse' },
    { value: PrioriteIntervention.NORMALE, label: 'Normale' },
    { value: PrioriteIntervention.HAUTE, label: 'Haute' },
    { value: PrioriteIntervention.CRITIQUE, label: 'Critique' }
  ];

  constructor(
    private interventionService: InterventionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    
    const statut = this.filters.statut ? this.filters.statut as StatutIntervention : undefined;
    const type = this.filters.type ? this.filters.type as TypeIntervention : undefined;
    const priorite = this.filters.priorite ? this.filters.priorite as PrioriteIntervention : undefined;
    
    this.interventionService.obtenirTickets(
      statut, type, priorite, undefined, undefined, undefined, 
      undefined, undefined, this.currentPage, this.pageSize
    ).subscribe({
      next: (response: PageResponse<InterventionDTO>) => {
        this.tickets = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.applySearchFilter();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des tickets:', error);
        this.isLoading = false;
      }
    });
  }

  applySearchFilter(): void {
    if (!this.filters.recherche) {
      this.filteredTickets = this.tickets;
    } else {
      const searchTerm = this.filters.recherche.toLowerCase();
      this.filteredTickets = this.tickets.filter(ticket =>
        ticket.numero?.toLowerCase().includes(searchTerm) ||
        ticket.titre.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm) ||
        ticket.demandeurNom?.toLowerCase().includes(searchTerm)
      );
    }
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onSearchChange(): void {
    this.applySearchFilter();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTickets();
  }

  createNewTicket(): void {
    this.router.navigate(['/tickets/create']);
  }

  viewTicket(ticket: InterventionDTO): void {
    this.router.navigate(['/tickets', ticket.id]);
  }

  editTicket(ticket: InterventionDTO): void {
    this.router.navigate(['/tickets', ticket.id, 'edit']);
  }

  deleteTicket(ticket: InterventionDTO): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le ticket ${ticket.numero} ?`)) {
      this.interventionService.supprimerTicket(ticket.id!).subscribe({
        next: () => {
          this.loadTickets();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du ticket');
        }
      });
    }
  }

  getStatutClass(statut: StatutIntervention): string {
    return this.interventionService.getStatutClass(statut);
  }

  getPrioriteClass(priorite: PrioriteIntervention): string {
    return this.interventionService.getPrioriteClass(priorite);
  }

  getStatutLabel(statut: StatutIntervention): string {
    return this.interventionService.getStatutLabel(statut);
  }

  getPrioriteLabel(priorite: PrioriteIntervention): string {
    return this.interventionService.getPrioriteLabel(priorite);
  }

  getTypeLabel(type: TypeIntervention): string {
    return this.interventionService.getTypeLabel(type);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  resetFilters(): void {
    this.filters = {
      statut: '',
      type: '',
      priorite: '',
      recherche: ''
    };
    this.currentPage = 0;
    this.loadTickets();
  }
}
