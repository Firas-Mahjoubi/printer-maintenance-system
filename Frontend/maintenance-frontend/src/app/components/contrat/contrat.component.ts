import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ContratService, Contrat } from '../../service/contrat.service';
import { NotificationService } from '../../service/notification.service';
import { Router } from '@angular/router';
import { InterventionService } from '../../service/intervention.service';

@Component({
  selector: 'app-contrat',
  templateUrl: './contrat.component.html',
  styleUrls: ['./contrat.component.css']
})
export class ContratComponent implements OnInit {
  // Data properties
  allContrats: Contrat[] = [];
  contrats: Contrat[] = [];
  
  // Filter properties for active contracts
  searchTerm: string = '';
  selectedStatus: string = ''; // Show all statuses by default
  selectedClient: string = '';
  
  // Pagination properties for active contracts
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  
  // UI state properties
  loading: boolean = false;
  error: string | null = null;
  
  // Button loading state
  newContratLoading: boolean = false;

  // Sorting properties
  sortField: string = 'dateDebut';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private contratService: ContratService,
    private notificationService: NotificationService,
    private interventionService: InterventionService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    // Reset loading states on component initialization
    this.newContratLoading = false;
    
    // Load contracts
    this.loadContrats();
  }
  
  // Method to preload active interventions data for better UI experience
  preloadActiveInterventionsData() {
    if (!this.contrats || this.contrats.length === 0) return;
    
    // Instead of checking each contract individually, get all contracts with active interventions at once
    this.interventionService.obtenirContratsAvecInterventionsActives().subscribe({
      next: (contractIds) => {
        console.log('Contracts with active interventions:', contractIds);
        
        // Create a Set for faster lookup
        const contractsWithActiveInterventions = new Set(contractIds);
        
        // Update the cache with this information
        this.contrats.forEach(contrat => {
          if (contrat.id && contractsWithActiveInterventions.has(contrat.id)) {
            this.activeTicketsCache.set(contrat.id, true);
          } else if (contrat.id) {
            this.activeTicketsCache.set(contrat.id, false);
          }
        });
        
        // Force change detection to update UI
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching contracts with active interventions:', error);
      }
    });
  }

  // Method to load the active contracts only
  loadContrats() {
    this.loading = true;
    this.error = null;
    
    // Clear the interventions cache when reloading contracts
    this.activeTicketsCache.clear();
    
    this.contratService.getActiveContracts().subscribe({
      next: (data) => {
        console.log('Active contracts loaded:', data);
        this.contrats = data || [];
        this.allContrats = data || [];
        this.totalItems = this.contrats.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        // Apply any filters
        this.applyFilters();
        this.loading = false;
        
        // Preload active interventions data for better UI experience
        this.preloadActiveInterventionsData();
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.error = 'Erreur lors du chargement des contrats';
        this.loading = false;
        this.notificationService.showError(
          'Impossible de charger la liste des contrats. Veuillez rafraîchir la page.',
          'Erreur de chargement'
        );
      }
    });
  }
  
  // Method to filter active contracts only
  filterActiveContracts() {
    // Filter active contracts for main view
    const activeContracts = this.allContrats.filter(contrat => 
      this.isStatusMatch(contrat.statutContrat, 'actif')
    );
    
    // Update main table data to only show active contracts
    this.contrats = activeContracts;
    this.totalItems = this.contrats.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Filter and pagination methods for active contracts
  applyFilters() {
    let filteredContracts = [...this.allContrats];
    
    // Filter by status
    if (this.selectedStatus && this.selectedStatus !== '') {
      filteredContracts = filteredContracts.filter(contrat => 
        this.isStatusMatch(contrat.statutContrat, this.selectedStatus)
      );
    }
    
    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filteredContracts = filteredContracts.filter(contrat =>
        (contrat.numeroContrat && contrat.numeroContrat.toLowerCase().includes(searchLower)) ||
        (contrat.client && contrat.client.nom && contrat.client.nom.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by client
    if (this.selectedClient && this.selectedClient !== '') {
      filteredContracts = filteredContracts.filter(contrat => 
        contrat.client && contrat.client.id === Number(this.selectedClient)
      );
    }
    
    // Sort contracts
    filteredContracts = this.sortContracts(filteredContracts);
    
    // Update pagination info
    this.totalItems = filteredContracts.length;
    this.ensurePagination(); // Ensure pagination is consistent
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.contrats = filteredContracts.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  // Get the value of the specified field for sorting
  private getSortValue(contrat: Contrat, field: string) {
    switch (field) {
      case 'numeroContrat':
        return contrat.numeroContrat?.toLowerCase() || '';
      case 'dateDebut':
        return new Date(contrat.dateDebut || '').getTime();
      case 'dateFin':
        return new Date(contrat.dateFin || '').getTime();
      case 'client':
        return contrat.client?.nom?.toLowerCase() || '';
      case 'statutContrat':
        return contrat.statutContrat?.toLowerCase() || '';
      default:
        return contrat.id || 0;
    }
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onClientChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  // Pagination methods
  goToPage(page: number) {
    this.currentPage = page;
    this.ensurePagination(); // Ensure pagination is consistent
    this.applyFilters();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  getPageNumbers(): number[] {
    // Always ensure pagination is consistent before returning page numbers
    this.ensurePagination();
    
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
  
  // No history-related methods needed in this component anymore

  // Sort contracts based on current sort field and direction
  sortContracts(contracts: Contrat[]): Contrat[] {
    return [...contracts].sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortField) {
        case 'numeroContrat':
          comparison = this.compareStrings(a.numeroContrat, b.numeroContrat);
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
          comparison = this.compareStrings(
            a.client?.nom || '', 
            b.client?.nom || ''
          );
          break;
        default:
          comparison = 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Helper methods for sorting
  compareStrings(a: string | undefined, b: string | undefined): number {
    if (!a) a = '';
    if (!b) b = '';
    return a.localeCompare(b);
  }
  
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

  // Sort the data by a specific field
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
  
  // Navigation to contract details or edit form
  newContrat() {
    this.newContratLoading = true;
    this.router.navigate(['/contrats/add']).then(() => {
      this.newContratLoading = false;
    }).catch(() => {
      this.newContratLoading = false;
      this.notificationService.showError('Erreur lors de la navigation', 'Erreur');
    });
  }

  editContrat(contrat: Contrat) {
    if (!contrat.id) return;
    // Navigate to the edit form
    this.router.navigate(['/contrats/edit', contrat.id]);
  }

  viewContrat(contrat: Contrat) {
    if (!contrat.id) return;
    // Navigate to contract details
    this.router.navigate(['/contrats/details', contrat.id]);
  }

  exportToPdf(contrat: Contrat) {
    if (!contrat.id) return;
    
    this.loading = true;
    this.contratService.exportContratToPdf(contrat.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat-${contrat.numeroContrat || contrat.id}.pdf`;
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
    // Implement duplicate functionality
    if (confirm(`Voulez-vous dupliquer le contrat ${contrat.numeroContrat} ?`)) {
      // Here you would call the backend to duplicate the contract
      this.loading = true;
      console.log('Duplicating contract:', contrat);
      
      // Since we don't have the actual implementation yet, we'll show a notification
      setTimeout(() => {
        this.loading = false;
        this.notificationService.showInfo(
          `Fonctionnalité de duplication en cours de développement pour le contrat ${contrat.numeroContrat}`, 
          'Fonctionnalité à venir'
        );
      }, 1000);
    }
  }

  archiveContrat(contrat: Contrat) {
    // Implement archive functionality
    if (confirm(`Voulez-vous archiver le contrat ${contrat.numeroContrat} ?`)) {
      // Here you would call the backend to archive the contract
      this.loading = true;
      console.log('Archiving contract:', contrat);
      
      // Since we don't have the actual implementation yet, we'll show a notification
      setTimeout(() => {
        this.loading = false;
        this.notificationService.showInfo(
          `Fonctionnalité d'archivage en cours de développement pour le contrat ${contrat.numeroContrat}`, 
          'Fonctionnalité à venir'
        );
      }, 1000);
    }
  }

  setMaintenanceMode(contrat: Contrat) {
    // Implement maintenance mode functionality
    if (confirm(`Voulez-vous mettre le contrat ${contrat.numeroContrat} en mode maintenance ?`)) {
      this.loading = true;
      console.log('Setting maintenance mode for contract:', contrat);
      
      // Since we don't have the actual implementation yet, we'll show a notification
      setTimeout(() => {
        this.loading = false;
        this.notificationService.showInfo(
          `Fonctionnalité de maintenance en cours de développement pour le contrat ${contrat.numeroContrat}`, 
          'Fonctionnalité à venir'
        );
      }, 1000);
    }
  }

  removeFromMaintenance(contrat: Contrat) {
    // Implement remove from maintenance functionality
    if (confirm(`Voulez-vous sortir le contrat ${contrat.numeroContrat} du mode maintenance ?`)) {
      this.loading = true;
      console.log('Removing from maintenance mode for contract:', contrat);
      
      // Since we don't have the actual implementation yet, we'll show a notification
      setTimeout(() => {
        this.loading = false;
        this.notificationService.showInfo(
          `Fonctionnalité de sortie de maintenance en cours de développement pour le contrat ${contrat.numeroContrat}`, 
          'Fonctionnalité à venir'
        );
      }, 1000);
    }
  }

  renewContrat(contrat: Contrat) {
    // Implement renewal functionality using the existing backend API
    if (!contrat.id) return;
    
    if (confirm(`Voulez-vous renouveler le contrat ${contrat.numeroContrat} ?`)) {
      this.loading = true;
      this.error = null;
      
      this.contratService.renew(contrat.id, contrat).subscribe({
        next: (renewedContract) => {
          console.log('Contract renewed successfully:', renewedContract);
          this.loadContrats(); // Reload contracts to show the updated data
          this.loading = false;
          this.notificationService.showSuccess(
            `Le contrat ${contrat.numeroContrat} a été renouvelé avec succès !`,
            'Renouvellement réussi'
          );
        },
        error: (error) => {
          console.error('Error renewing contract:', error);
          this.error = 'Erreur lors du renouvellement du contrat';
          this.loading = false;
          this.notificationService.showError(
            'Impossible de renouveler ce contrat. Veuillez réessayer.',
            'Erreur de renouvellement'
          );
        }
      });
    }
  }

  isContractExpiringSoon(contrat: Contrat): boolean {
    if (!contrat.dateFin) return false;
    const today = new Date();
    const endDate = new Date(contrat.dateFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays > 0; // Expires within 60 days (2 months)
  }

  getDaysUntilExpiration(contrat: Contrat): number {
    if (!contrat.dateFin) return 0;
    const today = new Date();
    const endDate = new Date(contrat.dateFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); // Return 0 if already expired
  }

  getStatusText(status: string, contrat?: Contrat): string {
    // Debug log to see what status values we're getting
    console.log('Status received:', status, 'Type:', typeof status);
    
    if (!status || status === null || status === undefined) {
      return 'AUCUN STATUT';
    }
    
    // Convert to string and trim whitespace
    const normalizedStatus = String(status).trim();
    
    switch (normalizedStatus.toLowerCase()) {
      case 'actif':
      case 'active':
        // Check if contract is expiring soon (within 2 months)
        if (contrat && this.isContractExpiringSoon(contrat)) {
          return 'EXPIRE BIENTÔT';
        }
        // If not expiring soon, show MAINTENANCE
        return 'ACTIF';
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

  isStatusMatch(status: string, expectedStatus: string): boolean {
    if (!status || status === null || status === undefined) {
      return false;
    }
    
    const normalizedStatus = String(status).trim().toLowerCase();
    
    switch (expectedStatus) {
      case 'actif':
        return normalizedStatus === 'actif' || normalizedStatus === 'active';
      case 'maintenance':
        return normalizedStatus === 'maintenance' || normalizedStatus === 'sous_maintenance' || normalizedStatus === 'sous maintenance';
      case 'attente':
        return normalizedStatus === 'en_attente' || normalizedStatus === 'en attente' || normalizedStatus === 'attente' || normalizedStatus === 'pending';
      case 'expire':
        return normalizedStatus === 'expiré' || normalizedStatus === 'expire' || normalizedStatus === 'expired';
      case 'suspendu':
        return normalizedStatus === 'suspendu' || normalizedStatus === 'suspended';
      case 'brouillon':
        return normalizedStatus === 'brouillon' || normalizedStatus === 'draft';
      case 'renouvele':
        return normalizedStatus === 'renouvele' || normalizedStatus === 'renouvelé' || normalizedStatus === 'renewed';
      default:
        return false;
    }
  }

  // Map to cache intervention checks for contracts
  private activeTicketsCache = new Map<number, boolean>();

  // Map to track which contracts have pending API requests
  private pendingRequests = new Set<number>();

  // Check if a contract has active tickets - optimized version that prioritizes cached results
  hasActiveTickets(contrat: Contrat): boolean {
    // Return false if the contract has no ID
    if (!contrat.id) return false;
    
    const contractId = contrat.id;
    
    // Check if we already have this result cached
    if (this.activeTicketsCache.has(contractId)) {
      return this.activeTicketsCache.get(contractId) || false;
    }
    
    // If we don't have it cached, assume false and trigger an async check
    // But only if there's no pending request for this contract already
    if (!this.pendingRequests.has(contractId)) {
      this.pendingRequests.add(contractId);
      
      // Check if this contract has active tickets
      this.interventionService.verifierInterventionsActivesPourContrat(contractId).subscribe({
        next: (hasActive) => {
          this.activeTicketsCache.set(contractId, hasActive);
          this.pendingRequests.delete(contractId);
          
          // Only trigger UI update if the status is active
          if (hasActive) {
            this.changeDetectorRef.detectChanges();
          }
        },
        error: (error) => {
          console.error(`Error checking active tickets for contract ${contractId}:`, error);
          this.activeTicketsCache.set(contractId, false);
          this.pendingRequests.delete(contractId);
        }
      });
    }
    
    // Return cached value or false if not cached
    return this.activeTicketsCache.get(contractId) || false;
  }

  // Dropdown event handlers for z-index fix fallback
  onDropdownShow(event: Event) {
    const target = event.target as HTMLElement;
    const tableRow = target.closest('tr');
    if (tableRow) {
      tableRow.classList.add('dropdown-open');
    }
  }

  onDropdownHide(event: Event) {
    const target = event.target as HTMLElement;
    const tableRow = target.closest('tr');
    if (tableRow) {
      tableRow.classList.remove('dropdown-open');
    }
  }

  // Helper method to check if any loading state is active
  isAnyLoadingActive(): boolean {
    return this.loading || this.newContratLoading;
  }

  // Helper to check if a row should be highlighted based on sort
  isSortedHighlightRow(contrat: Contrat): boolean {
    // Highlight rows that are at the top of the sorting
    // For example, the lowest or highest values based on sort direction
    if (!this.sortField) return false;
    
    let value = this.getSortValue(contrat, this.sortField);
    
    // Check if this is among the top values based on sort
    // For simplicity, we're just highlighting the top 3 values
    const allContracts = this.contrats;
    const values = allContracts.map(c => this.getSortValue(c, this.sortField));
    
    // Sort values based on current sort direction
    if (this.sortDirection === 'asc') {
      values.sort((a, b) => a < b ? -1 : 1);
    } else {
      values.sort((a, b) => a > b ? -1 : 1);
    }
    
    // Check if current value is in top 3
    return values.indexOf(value) < 3;
  }

  // Reset search for active contracts
  resetSearch() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedClient = '';
  }

  // Helper method to get contracts by status for statistics cards
  getContractsByStatus(status: string): Contrat[] {
    return this.allContrats.filter(contrat => this.isStatusMatch(contrat.statutContrat, status));
  }

  // Delete contract method
  deleteContrat(id: number | undefined) {
    if (!id) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.')) {
      this.loading = true;
      this.contratService.delete(id).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.showSuccess('Le contrat a été supprimé avec succès.', 'Suppression réussie');
          this.loadContrats(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting contract:', error);
          this.loading = false;
          this.notificationService.showError(
            'Impossible de supprimer ce contrat. Veuillez réessayer.',
            'Erreur de suppression'
          );
        }
      });
    }
  }

  // Helper method to get sort icon class
  getSortIconClass(field: string): string {
    if (this.sortField !== field) {
      return 'bi bi-arrow-down-up'; // Default unsorted icon
    }
    return this.sortDirection === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down';
  }

  // Helper methods for pagination display
  getDisplayStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getDisplayEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // Helper method to get unique clients for the filter dropdown
  getUniqueClients() {
    const clients = new Map();
    
    this.allContrats.forEach(contrat => {
      if (contrat.client && contrat.client.id && contrat.client.nom) {
        clients.set(contrat.client.id, {
          id: contrat.client.id,
          name: contrat.client.nom
        });
      }
    });
    
    return Array.from(clients.values());
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
}
