import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ImprimanteService, Imprimante } from '../../service/imprimante.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-printer-list',
  templateUrl: './printer-list.component.html',
  styleUrls: ['./printer-list.component.css']
})
export class PrinterListComponent implements OnInit {
  // Real printer data array
  printers: any[] = [];
  
  // Current contract ID - would normally come from a route param or state service
  currentContratId = 1; // Default for demo purposes
  
  // Loading states
  loading = true;
  error = false;
  errorMessage = '';

  // Filtered printers array for display
  filteredPrinters: any[] = [];
  
  // Search & filter state
  searchTerm: string = '';
  statusFilter: string = 'all';
  sortField: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination properties
  pageSize = 10; // Number of printers per page
  currentPage = 1; // Current active page
  totalPages = 1; // Total number of pages
  startPage = 1; // First page to show in pagination
  endPage = 1; // Last page to show in pagination
  pageNumbers: number[] = []; // Array of page numbers to display
  paginatedPrinters: any[] = []; // Current page of printers
  
  // Make Math available to the template
  Math = Math;

  constructor(
    private router: Router,
    private imprimanteService: ImprimanteService
  ) { }

  ngOnInit(): void {
    // Initialize 3D effect on cards
    this.initAnimation();
    
    // Load printer data with real statuses
    this.loadPrinterData();
  }
  
  // Load real printer data from the backend
  loadPrinterData(): void {
    this.loading = true;
    this.error = false;
    
    console.log('Loading all printers for technician view');
    
    // Get all printers regardless of contract (technician view)
    this.imprimanteService.getAllPrinters().subscribe({
      next: (printers) => {
        console.log('Retrieved printers:', printers);
        
        if (!printers || printers.length === 0) {
          console.warn('No printers found in the system');
          this.handleError('Aucune imprimante trouvée dans le système');
          return;
        }
        
        // Get the status for each printer
        this.imprimanteService.getAllPrinterStatuses().subscribe({
          next: (statuses) => {
            console.log('Retrieved printer statuses:', statuses);
            
            // Combine printer data with statuses
            this.printers = printers.map(printer => {
              const status = statuses[printer.id] || 'Actif'; // Default to 'Actif' if no status found
              console.log(`Printer ${printer.id} (${printer.modele}) status: ${status}`);
              
              return {
                ...printer,
                statut: status,
                client: 'Entreprise ' + printer.id, // Demo data, would come from real API
                interventions: Math.floor(Math.random() * 10) + 1 // Demo data, would come from real API
              };
            });
            
            // Initialize filtered list
            this.filteredPrinters = [...this.printers];
            this.loading = false;
            
            console.log('Processed printers:', this.printers);
            console.log('Filtered printers:', this.filteredPrinters);
            
            // Initialize pagination
            this.updatePagination();
          },
          error: (err) => {
            console.error('Error fetching printer statuses:', err);
            // Even if statuses fail, we can still show printers with default status
            this.printers = printers.map(printer => ({
              ...printer,
              statut: 'Actif', // Default to 'Actif' if statuses API fails
              client: 'Entreprise ' + printer.id,
              interventions: Math.floor(Math.random() * 10) + 1
            }));
            this.filteredPrinters = [...this.printers];
            this.loading = false;
            
            // Show warning but don't prevent display
            this.error = true;
            this.errorMessage = 'Impossible de récupérer les statuts des imprimantes. Statuts par défaut affichés.';
            
            // Initialize pagination
            this.updatePagination();
          }
        });
      },
      error: (err) => {
        console.error('Error fetching printers:', err);
        this.handleError('Impossible de charger les imprimantes. Veuillez vérifier la connexion au serveur.');
      }
    });
  }
  
  // Handle API errors
  handleError(message: string): void {
    this.error = true;
    this.errorMessage = message;
    this.loading = false;
    
    // Initialize with empty data
    this.printers = [];
    this.filteredPrinters = [];
  }
  
  // Refresh printer data
  refreshData(): void {
    this.loadPrinterData();
  }

  // Initialize 3D parallax effect
  initAnimation(): void {
    // Only run the effect on desktops to prevent performance issues on mobile
    if (window.innerWidth > 992) {
      document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.printer-card');
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;
        
        cards.forEach((cardElement) => {
          const card = cardElement as HTMLElement;
          const rect = card.getBoundingClientRect();
          const cardCenterX = rect.left + rect.width / 2;
          const cardCenterY = rect.top + rect.height / 2;
          
          // Calculate distance from mouse to card center (normalized)
          const distX = (e.clientX - cardCenterX) / (window.innerWidth / 2) * 0.5;
          const distY = (e.clientY - cardCenterY) / (window.innerHeight / 2) * 0.5;
          
          // Apply subtle rotation - more pronounced for closer cards
          const rotateY = distX * 2; // degrees
          const rotateX = -distY * 2; // degrees
          
          // Apply transform with perspective for 3D effect
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1.02)`;
        });
      });
      
      // Reset transforms when mouse leaves the window
      document.addEventListener('mouseleave', () => {
        const cards = document.querySelectorAll('.printer-card');
        cards.forEach((cardElement) => {
          const card = cardElement as HTMLElement;
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
      });
    }
  }

  // Navigation
  viewHistory(printerId: number): void {
    this.router.navigate(['/printers', printerId, 'history']);
  }
  
  viewDetails(printerId: number): void {
    this.router.navigate(['/printers', printerId]);
  }

  // Status badge classes
  getStatusBadgeClass(statut: string): string {
    switch (statut) {
      case 'Actif':
        return 'badge bg-success';
      case 'En maintenance':
        return 'badge bg-warning';
      case 'En panne':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
  
  // Printer status classes for new UI
  getPrinterStatusClass(statut: string): string {
    switch (statut) {
      case 'Actif':
        return 'active';
      case 'En maintenance':
        return 'maintenance';
      case 'En panne':
        return 'offline';
      default:
        return 'active'; // Default to active if unknown status
    }
  }
  
  // Printer avatar classes
  getPrinterAvatarClass(statut: string): string {
    return this.getPrinterStatusClass(statut);
  }
  
  // Extract brand from model
  getPrinterBrand(model: string): string {
    const brandMatch = model.match(/^(HP|Canon|Epson|Brother|Xerox|Lexmark|Ricoh|Samsung)/);
    return brandMatch ? brandMatch[0] : 'Unknown Brand';
  }
  
  // Statistics methods
  getTotalPrinters(): number {
    return this.printers.length;
  }
  
  getActivePrinters(): number {
    return this.printers.filter(p => p.statut === 'Actif').length;
  }
  
  getMaintenancePrinters(): number {
    return this.printers.filter(p => p.statut === 'En maintenance').length;
  }
  
  getOfflinePrinters(): number {
    return this.printers.filter(p => p.statut === 'En panne').length;
  }
  
  // Get status for individual printer (useful for refreshing a single item)
  refreshPrinterStatus(printer: any): void {
    this.imprimanteService.getPrinterStatus(printer.id).subscribe({
      next: (status) => {
        printer.statut = status;
      },
      error: (err) => {
        console.error(`Error fetching status for printer ${printer.id}:`, err);
      }
    });
  }
  
  // Filtering and sorting
  filterPrinters(event: any): void {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;
    this.applyFilters();
  }
  
  filterByStatus(event: any): void {
    this.statusFilter = event.target.value;
    this.applyFilters();
  }
  
  sortPrinters(event: any): void {
    this.sortField = event.target.value;
    this.applyFilters();
  }
  
  applyFilters(): void {
    // First filter by search term
    let result = this.printers.filter(printer => {
      const matchesSearch = !this.searchTerm || 
        printer.modele.toLowerCase().includes(this.searchTerm) ||
        printer.client.toLowerCase().includes(this.searchTerm) ||
        printer.id.toString().includes(this.searchTerm);
        
      // Then filter by status
      const matchesStatus = this.statusFilter === 'all' || printer.statut === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    // Then sort
    result.sort((a, b) => {
      let valueA = a[this.sortField];
      let valueB = b[this.sortField];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    this.filteredPrinters = result;
    this.updatePagination();
  }
  
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }
  
  // Pagination methods
  updatePagination(): void {
    // Calculate total pages
    this.totalPages = Math.ceil(this.filteredPrinters.length / this.pageSize);
    
    // Ensure current page is within bounds
    if (this.currentPage < 1) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1; // If totalPages is 0, set to 1
    }
    
    // Calculate which page numbers to show
    // Always show first and last page, plus up to 3 pages around current page
    const visiblePageCount = 3; // Number of pages visible around current page (excluding first/last)
    
    if (this.totalPages <= visiblePageCount + 2) {
      // If we have few pages, just show all of them
      this.pageNumbers = [];
      for (let i = 2; i < this.totalPages; i++) {
        this.pageNumbers.push(i);
      }
      this.startPage = 2;
      this.endPage = this.totalPages - 1;
    } else {
      // We need to show a subset of pages with ellipsis
      const halfVisible = Math.floor(visiblePageCount / 2);
      
      if (this.currentPage <= halfVisible + 2) {
        // Near the start - show first pages
        this.startPage = 2;
        this.endPage = visiblePageCount + 1;
      } else if (this.currentPage >= this.totalPages - halfVisible - 1) {
        // Near the end - show last pages
        this.startPage = this.totalPages - visiblePageCount;
        this.endPage = this.totalPages - 1;
      } else {
        // In the middle - show pages around current
        this.startPage = this.currentPage - halfVisible;
        this.endPage = this.currentPage + halfVisible;
      }
      
      // Generate page numbers array (excluding first and last which are always shown)
      this.pageNumbers = [];
      for (let i = this.startPage; i <= this.endPage; i++) {
        if (i > 1 && i < this.totalPages) {
          this.pageNumbers.push(i);
        }
      }
    }
    
    // Update paginated printers
    this.updatePaginatedPrinters();
    
    console.log('Pagination updated:', {
      totalPages: this.totalPages,
      currentPage: this.currentPage,
      pageNumbers: this.pageNumbers,
      paginatedCount: this.paginatedPrinters.length
    });
  }
  
  updatePaginatedPrinters(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedPrinters = this.filteredPrinters.slice(startIndex, startIndex + this.pageSize);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination(); // Call updatePagination which will also update paginatedPrinters
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination(); // Call updatePagination which will also update paginatedPrinters
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination(); // Call updatePagination which will also update paginatedPrinters
    }
  }
}
