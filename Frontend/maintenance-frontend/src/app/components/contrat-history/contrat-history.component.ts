import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ContratService, Contrat } from '../../service/contrat.service';
import { NotificationService } from '../../service/notification.service';
import { Router } from '@angular/router';
import { InterventionService } from '../../service/intervention.service';

@Component({
  selector: 'app-contrat-history',
  templateUrl: './contrat-history.component.html',
  styleUrls: ['./contrat-history.component.css']
})
export class ContratHistoryComponent implements OnInit {
  // Data properties
  allContrats: Contrat[] = [];
  contratsHistory: Contrat[] = [];
  
  // Filter properties for history contracts
  searchTerm: string = '';
  selectedClient: string = '';
  selectedStatus: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  
  // UI state properties
  loading: boolean = false;
  error: string | null = null;
  
  // Cache for active interventions
  private activeTicketsCache = new Map<number, boolean>();

  // Sorting properties
  sortField: string = 'dateFin';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private contratService: ContratService,
    private notificationService: NotificationService,
    private interventionService: InterventionService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHistoryContracts();
  }
  
  // Method to load history contracts
  loadHistoryContracts() {
    this.loading = true;
    this.error = null;
    
    this.contratService.getHistory().subscribe({
      next: (data) => {
        console.log('All contracts loaded for history:', data);
        this.allContrats = data || [];
        
        // Apply filters and sorting (this will filter to history contracts)
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading history contracts:', error);
        this.error = 'Erreur lors du chargement de l\'historique des contrats';
        this.loading = false;
        this.notificationService.showError(
          'Impossible de charger l\'historique des contrats. Veuillez rafraîchir la page.',
          'Erreur de chargement'
        );
      }
    });
  }
  
  // Apply filters to history contracts
  applyFilters() {
    // Start with all contracts and filter to only include history contracts
    let filteredContracts = [...this.allContrats].filter(contrat => 
      !this.isStatusMatch(contrat.statutContrat, 'actif') && 
      !this.isStatusMatch(contrat.statutContrat, 'maintenance')
    );
    
    // Apply status filter
    if (this.selectedStatus && this.selectedStatus !== '') {
      filteredContracts = filteredContracts.filter(contrat => 
        this.isStatusMatch(contrat.statutContrat, this.selectedStatus)
      );
    }
    
    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filteredContracts = filteredContracts.filter(contrat => 
        (contrat.numeroContrat && contrat.numeroContrat.toLowerCase().includes(search)) ||
        (contrat.client && contrat.client.nom && contrat.client.nom.toLowerCase().includes(search))
      );
    }
    
    // Apply client filter
    if (this.selectedClient) {
      const clientId = Number(this.selectedClient);
      filteredContracts = filteredContracts.filter(contrat => 
        contrat.client && contrat.client.id === clientId
      );
    }
    
    // Apply sorting
    filteredContracts = this.sortContracts(filteredContracts);
    
    // Apply pagination
    this.totalItems = filteredContracts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Adjust current page if it's out of bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    // Slice the array for pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.contratsHistory = filteredContracts.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  // Sort contracts based on current sort field and direction
  sortContracts(contracts: Contrat[]): Contrat[] {
    return [...contracts].sort((a, b) => {
      let comparison = 0;
      
      // Handle different field types
      switch (this.sortField) {
        case 'numeroContrat':
          comparison = this.compareValues(a.numeroContrat, b.numeroContrat);
          break;
        case 'dateDebut':
          comparison = this.compareDates(a.dateDebut, b.dateDebut);
          break;
        case 'dateFin':
          comparison = this.compareDates(a.dateFin, b.dateFin);
          break;
        case 'statutContrat':
          // For status, compare the displayed status text instead of raw database values
          const statusA = this.getStatusText(a.statutContrat || '', a);
          const statusB = this.getStatusText(b.statutContrat || '', b);
          comparison = this.compareStatusesForSorting(statusA, statusB);
          break;
        case 'client':
          comparison = this.compareValues(
            a.client?.nom || '', 
            b.client?.nom || ''
          );
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Helper method to compare string values
  compareValues(a: string | undefined, b: string | undefined): number {
    if (!a) a = '';
    if (!b) b = '';
    return a.localeCompare(b);
  }
  
  // Helper method to compare date values
  compareDates(a: string | undefined, b: string | undefined): number {
    if (!a) return -1;
    if (!b) return 1;
    return new Date(a).getTime() - new Date(b).getTime();
  }

  // Compare status text for sorting with priority order
  compareStatusesForSorting(statusA: string, statusB: string): number {
    // Define priority order: expiring soon should come first, then active, then others
    const statusPriority: { [key: string]: number } = {
      'EXPIRE BIENTÔT': 1,
      'ACTIF': 2,
      'MAINTENANCE': 3,
      'EN ATTENTE': 4,
      'CONTRAT EXPIRÉ': 5,
      'SUSPENDU': 6,
      'BROUILLON': 7,
      'RENOUVELÉ': 8
    };
    
    const priorityA = statusPriority[statusA] || 999;
    const priorityB = statusPriority[statusB] || 999;
    
    // If priorities are different, use priority-based sorting
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If priorities are the same, fall back to alphabetical sorting
    return statusA.localeCompare(statusB);
  }
  
  // Methods to handle sort changes
  sortData(field: string) {
    if (this.sortField === field) {
      // Toggle direction if clicking the same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and default to ascending
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    // Re-apply filters with new sort
    this.applyFilters();
  }
  
  // Get unique clients for filter dropdown
  getUniqueClients() {
    const clients = new Map();
    
    // Add clients from all contracts (filtered for history)
    this.allContrats.forEach(contrat => {
      if (contrat.client && contrat.client.id && contrat.client.nom && 
          !this.isStatusMatch(contrat.statutContrat, 'actif') && 
          !this.isStatusMatch(contrat.statutContrat, 'maintenance')) {
        clients.set(contrat.client.id, {
          id: contrat.client.id,
          name: contrat.client.nom
        });
      }
    });
    
    return Array.from(clients.values());
  }
  
  // Pagination methods
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }
  
  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  goToPage(page: number) {
    this.setPage(page);
  }

  // Helper method for row highlighting (for consistency with main contracts)
  isSortedHighlightRow(contrat: Contrat): boolean {
    // Optional: implement row highlighting logic if needed
    return false;
  }

  // Dropdown event handlers (for consistency with main contracts)
  onDropdownShow(event: any) {
    // Optional: implement dropdown show logic if needed
  }

  onDropdownHide(event: any) {
    // Optional: implement dropdown hide logic if needed
  }
  
  // Generate page numbers for pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  // Helper methods for pagination display
  getDisplayStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getDisplayEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
  
  // Event handlers for filters
  onSearchChange() {
    this.currentPage = 1; // Reset to first page when search changes
    this.applyFilters();
  }
  
  onStatusChange() {
    this.currentPage = 1; // Reset to first page when status filter changes
    this.applyFilters();
  }
  
  onClientChange() {
    this.currentPage = 1; // Reset to first page when client filter changes
    this.applyFilters();
  }
  
  // Helper method to match status values regardless of case
  isStatusMatch(actualStatus: string | undefined, expectedStatus: string): boolean {
    if (!actualStatus) return false;
    return actualStatus.toLowerCase() === expectedStatus.toLowerCase();
  }

  // Check if contract is expiring within 2 months
  getDaysUntilExpiration(contrat: Contrat): number {
    if (!contrat.dateFin) return 0;
    const today = new Date();
    const endDate = new Date(contrat.dateFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); // Return 0 if already expired
  }

  // Get status text for display
  getStatusText(status: string, contrat?: Contrat): string {
    if (!status || status === null || status === undefined) {
      return 'AUCUN STATUT';
    }
    
    const normalizedStatus = String(status).trim();
    
    switch (normalizedStatus.toLowerCase()) {
      case 'actif':
      case 'active':
        // Check if contract is expiring soon (within 2 months)
        if (contrat && this.isContractExpiringSoon(contrat)) {
          return 'EXPIRE BIENTÔT';
        }
        // If not expiring soon, show MAINTENANCE
        return 'MAINTENANCE';
      case 'maintenance':
      case 'sous_maintenance':
      case 'sous maintenance':
        return 'MAINTENANCE';
      case 'en_attente':
      case 'en attente':
      case 'attente':
      case 'pending':
        return 'EN ATTENTE';
      case 'expiré':
      case 'expire':
      case 'expired':
        return 'CONTRAT EXPIRÉ';
      case 'suspendu':
      case 'suspended':
        return 'SUSPENDU';
      case 'brouillon':
      case 'draft':
        return 'BROUILLON';
      case 'renouvele':
      case 'renouvelé':
      case 'renewed':
        return 'RENOUVELÉ';
      default:
        return `STATUT: ${normalizedStatus.toUpperCase()}`;
    }
  }

  // Get status description for display
  getStatusDescription(status: string, contrat?: Contrat): string {
    if (!status || status === null || status === undefined) {
      return 'Aucun statut défini';
    }
    
    const normalizedStatus = String(status).trim();
    
    switch (normalizedStatus.toLowerCase()) {
      case 'actif':
      case 'active':
        // Check if contract is expiring soon and is active
        if (contrat && this.isContractExpiringSoon(contrat)) {
          const daysUntilExpiration = this.getDaysUntilExpiration(contrat);
          return `Expire dans ${daysUntilExpiration} jour(s)`;
        }
        // If not expiring soon, show maintenance description
        if (contrat && contrat.id && this.activeTicketsCache.get(contrat.id) === true) {
          return 'Maintenance en cours';
        } else {
          return 'Contrat actif';
        }
      case 'maintenance':
      case 'sous_maintenance':
      case 'sous maintenance':
        return 'Maintenance en cours';
      case 'en_attente':
      case 'en attente':
      case 'attente':
      case 'pending':
        return 'En cours de validation';
      case 'expiré':
      case 'expire':
      case 'expired':
        return 'Renouvellement requis';
      case 'suspendu':
      case 'suspended':
        return 'Temporairement arrêté';
      case 'brouillon':
      case 'draft':
        return 'En cours de création';
      case 'renouvele':
      case 'renouvelé':
      case 'renewed':
        return 'Contrat renouvelé';
      default:
        return `Statut reçu: "${normalizedStatus}"`;
    }
  }
  
  // Get sort icon class for table headers
  getSortIconClass(field: string): string {
    if (this.sortField !== field) {
      return 'bi bi-arrow-down-up text-muted';
    }
    
    return this.sortDirection === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
  }

  // Check if a contract is expiring soon (within 60 days / 2 months)
  isContractExpiringSoon(contrat: Contrat): boolean {
    if (!contrat.dateFin) return false;
    
    const today = new Date();
    const expiryDate = new Date(contrat.dateFin);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry > 0 && daysUntilExpiry <= 60; // Changed from 30 to 60 days
  }
  
  // Contract action methods
  viewContrat(contrat: Contrat) {
    if (contrat.id) {
      this.router.navigate(['/contrats/details', contrat.id]);
    }
  }
  
  editContrat(contrat: Contrat) {
    if (contrat.id) {
      this.router.navigate(['/contrats/edit', contrat.id]);
    }
  }
  
  hasActiveTickets(contrat: Contrat): boolean {
    if (!contrat.id) return false;
    // Return cached value if available
    if (this.activeTicketsCache.has(contrat.id)) {
      return this.activeTicketsCache.get(contrat.id) as boolean;
    }
    return false;
  }
  
  // Statistics methods
  getContractsByStatus(status: string): Contrat[] {
    return this.allContrats.filter(contrat => 
      this.isStatusMatch(contrat.statutContrat, status) &&
      !this.isStatusMatch(contrat.statutContrat, 'actif') &&
      !this.isStatusMatch(contrat.statutContrat, 'maintenance')
    );
  }

  // Get total history contracts count
  getTotalHistoryContracts(): number {
    return this.allContrats.filter(contrat => 
      !this.isStatusMatch(contrat.statutContrat, 'actif') &&
      !this.isStatusMatch(contrat.statutContrat, 'maintenance')
    ).length;
  }

  // Ensure pagination is consistent
  ensurePagination() {
    if (this.totalItems <= 0) {
      this.totalPages = 1;
      this.currentPage = 1;
      return;
    }
    
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    
    // Make sure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  // Action methods for history contracts
  exportToPdf(contrat: Contrat) {
    if (!contrat.id) return;
    
    this.loading = true;
    this.contratService.exportContratToPdf(contrat.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat-historique-${contrat.numeroContrat || contrat.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
        this.notificationService.showSuccess('Le PDF a été généré avec succès.', 'Export PDF réussi');
      },
      error: (error) => {
        console.error('Erreur lors de l\'export PDF:', error);
        this.loading = false;
        this.notificationService.showError('Impossible de générer le PDF. Veuillez réessayer.', 'Erreur d\'export');
      }
    });
  }

  duplicateContrat(contrat: Contrat) {
    if (confirm(`Voulez-vous dupliquer le contrat ${contrat.numeroContrat} ?`)) {
      this.loading = true;
      console.log('Duplicating historical contract:', contrat);
      
      setTimeout(() => {
        this.loading = false;
        this.notificationService.showInfo(
          `Fonctionnalité de duplication en cours de développement pour le contrat ${contrat.numeroContrat}`, 
          'Fonctionnalité à venir'
        );
      }, 1000);
    }
  }

  restoreContrat(contrat: Contrat) {
    if (confirm(`Voulez-vous restaurer le contrat ${contrat.numeroContrat} ?`)) {
      this.loading = true;
      console.log('Restoring contract:', contrat);
      
      setTimeout(() => {
        this.loading = false;
        this.notificationService.showInfo(
          `Fonctionnalité de restauration en cours de développement pour le contrat ${contrat.numeroContrat}`, 
          'Fonctionnalité à venir'
        );
      }, 1000);
    }
  }

  deleteContrat(id: number | undefined) {
    if (!id) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce contrat ? Cette action est irréversible.')) {
      this.loading = true;
      this.contratService.delete(id).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.showSuccess('Contrat supprimé définitivement avec succès.', 'Suppression réussie');
          this.loadHistoryContracts(); // Reload the list
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression du contrat:', error);
          this.loading = false;
          this.notificationService.showError('Impossible de supprimer le contrat. Veuillez réessayer.', 'Erreur de suppression');
        }
      });
    }
  }
}
