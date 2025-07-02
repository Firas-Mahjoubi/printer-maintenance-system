// contrat.component.ts
import { Component, OnInit } from '@angular/core';
import { ContratService, Contrat } from '../../service/contrat.service';
import { NotificationService } from '../../service/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contrat',
  templateUrl: './contrat.component.html',
  styleUrls: ['./contrat.component.css']
})
export class ContratComponent implements OnInit {
  // Data properties
  allContrats: Contrat[] = [];
  contrats: Contrat[] = [];
  contratsHistory: Contrat[] = [];
  
  // Filter properties
  searchTerm: string = '';
  selectedStatus: string = ''; // Show all statuses by default
  selectedClient: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  
  // UI state properties
  loading: boolean = false;
  showHistory: boolean = false;
  error: string | null = null;
  
  // Button loading states
  toggleHistoryLoading: boolean = false;
  newContratLoading: boolean = false;

  constructor(
    private contratService: ContratService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Reset loading states on component initialization
    this.toggleHistoryLoading = false;
    this.newContratLoading = false;
    
    this.loadContrats();
  }

  loadContrats() {
    this.loading = true;
    this.error = null;
    
    this.contratService.getAll().subscribe({
      next: (data) => {
        console.log('Contracts loaded:', data);
        this.allContrats = data || [];
        
        // Separate active and non-active contracts
        this.filterActiveAndHistoryContracts();
        
        this.applyFilters();
        this.loading = false;
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
  
  // New method to filter active contracts and history contracts
  filterActiveAndHistoryContracts() {
    // Reset history contracts when loading new data
    this.contratsHistory = [];
    
    // Filter active contracts for main view
    const activeContracts = this.allContrats.filter(contrat => 
      this.isStatusMatch(contrat.statutContrat, 'actif')
    );
    
    // All non-active contracts go to history
    const historyContracts = this.allContrats.filter(contrat => 
      !this.isStatusMatch(contrat.statutContrat, 'actif')
    );
    
    // Update main table data to only show active contracts
    this.allContrats = activeContracts;
    
    // Store history contracts for history view
    this.contratsHistory = historyContracts;
  }

  loadContractHistory() {
    this.loading = true;
    this.error = null;
    
    this.contratService.getHistory().subscribe({
      next: (data) => {
        console.log('Contract history loaded:', data);
        this.contratsHistory = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contract history:', error);
        this.error = 'Erreur lors du chargement de l\'historique des contrats';
        this.loading = false;
      }
    });
  }

  // Filter and pagination methods
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
        contrat.numeroContrat?.toLowerCase().includes(searchLower) ||
        contrat.client?.nom?.toLowerCase().includes(searchLower) ||
        contrat.client?.email?.toLowerCase().includes(searchLower) ||
        contrat.id?.toString().includes(searchLower)
      );
    }
    
    // Filter by client
    if (this.selectedClient && this.selectedClient !== '') {
      filteredContracts = filteredContracts.filter(contrat =>
        contrat.client?.id?.toString() === this.selectedClient
      );
    }
    
    this.totalItems = filteredContracts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.contrats = filteredContracts.slice(startIndex, endIndex);
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
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

  // Toggle between current contracts and history
  toggleHistoryView() {
    // Set loading state to true to prevent multiple clicks
    this.toggleHistoryLoading = true;
    
    // Simulate a short delay for a better user experience
    setTimeout(() => {
      this.showHistory = !this.showHistory;
      
      // Reset pagination when switching views
      this.currentPage = 1;
      
      if (this.showHistory) {
        // We're now showing history, apply filters to history contracts
        this.applyHistoryFilters();
      } else {
        // We're showing active contracts, apply regular filters
        this.applyFilters();
      }
      
      // Reset loading state
      this.toggleHistoryLoading = false;
    }, 500); // Short delay for visual feedback
  }
  
  // Apply filters to history contracts
  applyHistoryFilters() {
    let filteredContracts = [...this.contratsHistory];
    
    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filteredContracts = filteredContracts.filter(contrat =>
        contrat.numeroContrat?.toLowerCase().includes(searchLower) ||
        contrat.client?.nom?.toLowerCase().includes(searchLower) ||
        contrat.client?.email?.toLowerCase().includes(searchLower) ||
        contrat.id?.toString().includes(searchLower)
      );
    }
    
    // Filter by client
    if (this.selectedClient && this.selectedClient !== '') {
      filteredContracts = filteredContracts.filter(contrat =>
        contrat.client?.id?.toString() === this.selectedClient
      );
    }
    
    this.totalItems = filteredContracts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Get unique clients for filter dropdown
  getUniqueClients(): { id: number, name: string }[] {
    const clientMap = new Map();
    this.allContrats.forEach(contrat => {
      if (contrat.client && contrat.client.id) {
        clientMap.set(contrat.client.id, {
          id: contrat.client.id,
          name: contrat.client.nom || `Client #${contrat.client.id}`
        });
      }
    });
    return Array.from(clientMap.values());
  }

  // Helper method for pagination display
  getDisplayEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getDisplayStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  // Get contracts by status for statistics - checking both active and history lists
  getContractsByStatus(status: string): Contrat[] {
    // Combine active and history contracts for accurate counts
    const combinedContracts = [...this.allContrats, ...this.contratsHistory];
    return combinedContracts.filter(contrat => this.isStatusMatch(contrat.statutContrat, status));
  }

  deleteContrat(id: number | undefined) {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      this.loading = true;
      this.contratService.delete(id).subscribe({
        next: () => {
          this.loadContrats();
          this.notificationService.showSuccess('Le contrat a été supprimé avec succès.', 'Suppression réussie');
        },
        error: (error) => {
          console.error('Error deleting contract:', error);
          this.loading = false;
          this.notificationService.showError('Impossible de supprimer ce contrat. Veuillez réessayer.', 'Erreur de suppression');
        }
      });
    }
  }

  newContrat() {
    // Set loading state to true to prevent multiple clicks
    this.newContratLoading = true;
    
    // Simulate a short delay for a better user experience
    setTimeout(() => {
      // Navigate to the contract form
      this.router.navigate(['/contrats/add']).then(() => {
        // Reset loading state if navigation fails
        this.newContratLoading = false;
      });
    }, 500); // Short delay for visual feedback
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

  getStatusText(status: string): string {
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
        return 'CONTRAT ACTIF';
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
        // Check if the contract has active tickets
        if (contrat && this.hasActiveTickets(contrat)) {
          return 'Maintenance en cours';
        } else {
          return 'Contrat actif';
        }
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

  // Check if a contract has active tickets
  hasActiveTickets(contrat: Contrat): boolean {
    // For now, we'll use a placeholder. In a real implementation, this would 
    // check the tickets associated with this contract
    
    // Placeholder logic: use contract ID to simulate some contracts having active tickets
    if (!contrat.id) return false;
    
    // Every contract with an even ID has an active ticket (for demonstration purposes)
    return contrat.id % 2 === 0;
    
    // In a real implementation, you would check from a ticketService or the contract object
    // if there are any tickets with status 'actif' or 'en_cours'
    // return contrat.tickets?.some(ticket => ticket.status === 'actif') || false;
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
    return this.loading || this.toggleHistoryLoading || this.newContratLoading;
  }
}
