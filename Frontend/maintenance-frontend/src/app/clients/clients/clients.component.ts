import { Component, OnInit } from '@angular/core';
import { ClientService, Client } from '../../service/client.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';
  filteredClients: Client[] = [];
  
  // Pagination properties
  itemsPerPage = 6;
  currentPage = 1;
  totalPages = 1;
  Math = Math; // To use Math in the template

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;
    
    this.clientService.getAllClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = clients;
        this.calculateTotalPages();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Échec du chargement des clients. Veuillez réessayer.';
        this.loading = false;
        console.error('Error loading clients:', error);
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredClients = this.clients;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        client.nom.toLowerCase().includes(term) ||
        client.prenom.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.telephone.includes(term)
      );
    }
    
    this.calculateTotalPages();
    this.currentPage = 1; // Reset to first page after filtering
  }

  refreshClients(): void {
    this.loadClients();
  }

  trackByClientId(index: number, client: Client): number {
    return client.id || index;
  }

  getInitials(nom: string, prenom: string): string {
    const firstInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
    const lastInitial = nom ? nom.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  }

  // Pagination methods
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than maxPagesToShow
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page, last page, current page, and one page before and after current
      let startPage = Math.max(1, this.currentPage - 1);
      let endPage = Math.min(this.totalPages, this.currentPage + 1);
      
      // Adjust if we're at the start or end
      if (startPage === 1) {
        endPage = Math.min(this.totalPages, startPage + 2);
      }
      if (endPage === this.totalPages) {
        startPage = Math.max(1, endPage - 2);
      }
      
      // Add page numbers
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push(-1); // -1 represents ellipsis
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) {
          pages.push(-1); // -1 represents ellipsis
        }
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // Get clients for current page
  get paginatedClients(): Client[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredClients.length);
    return this.filteredClients.slice(startIndex, endIndex);
  }
}
