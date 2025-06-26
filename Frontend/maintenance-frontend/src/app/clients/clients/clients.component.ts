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
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.nom.toLowerCase().includes(term) ||
      client.prenom.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.telephone.includes(term)
    );
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
}
