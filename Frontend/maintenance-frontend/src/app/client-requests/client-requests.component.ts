import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-requests',
  templateUrl: './client-requests.component.html',
  styleUrls: ['./client-requests.component.css']
})
export class ClientRequestsComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  selectedStatus: string = '';
  selectedPriority: string = '';
  selectedPeriod: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    // Mock data - replace with actual service call
    this.requests = [
      {
        id: '001',
        title: 'Problème d\'impression couleur',
        description: 'L\'imprimante ne fonctionne plus en mode couleur, seul le noir et blanc fonctionne.',
        equipment: 'HP LaserJet Pro M404n - Bureau 201',
        status: 'in-progress',
        statusLabel: 'En cours',
        priority: 'high',
        priorityLabel: 'Élevée',
        createdDate: new Date('2024-01-15T09:30:00'),
        assignedTechnician: 'Jean Dupont'
      },
      {
        id: '002',
        title: 'Bourrage papier récurrent',
        description: 'Bourrage papier qui se produit à chaque impression, même avec du papier neuf.',
        equipment: 'Canon Pixma TS3350 - Bureau 105',
        status: 'pending',
        statusLabel: 'En attente',
        priority: 'medium',
        priorityLabel: 'Moyenne',
        createdDate: new Date('2024-01-14T14:15:00'),
        assignedTechnician: null
      },
      {
        id: '003',
        title: 'Maintenance préventive programmée',
        description: 'Maintenance préventive trimestrielle pour vérification générale.',
        equipment: 'Epson EcoTank L3150 - Salle de réunion',
        status: 'completed',
        statusLabel: 'Terminé',
        priority: 'low',
        priorityLabel: 'Faible',
        createdDate: new Date('2024-01-10T11:00:00'),
        assignedTechnician: 'Marie Martin'
      },
      {
        id: '004',
        title: 'Cartouche vide',
        description: 'Remplacement nécessaire de la cartouche d\'encre noire.',
        equipment: 'Brother DCP-L2530DW - Comptabilité',
        status: 'completed',
        statusLabel: 'Terminé',
        priority: 'low',
        priorityLabel: 'Faible',
        createdDate: new Date('2024-01-08T16:45:00'),
        assignedTechnician: 'Pierre Leroy'
      }
    ];
    
    this.filteredRequests = [...this.requests];
  }

  filterRequests(): void {
    this.filteredRequests = this.requests.filter(request => {
      const statusMatch = !this.selectedStatus || request.status === this.selectedStatus;
      const priorityMatch = !this.selectedPriority || request.priority === this.selectedPriority;
      
      let periodMatch = true;
      if (this.selectedPeriod) {
        const now = new Date();
        const requestDate = new Date(request.createdDate);
        
        switch (this.selectedPeriod) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            periodMatch = requestDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            periodMatch = requestDate >= monthAgo;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            periodMatch = requestDate >= quarterAgo;
            break;
        }
      }
      
      return statusMatch && priorityMatch && periodMatch;
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'in-progress': return 'fa-cog fa-spin';
      case 'completed': return 'fa-check-circle';
      case 'cancelled': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  goBack(): void {
    this.router.navigate(['/client-dashboard']);
  }

  createNewRequest(): void {
    this.router.navigate(['/client-new-request']);
  }

  viewDetails(requestId: string): void {
    console.log('Viewing details for request:', requestId);
    // Navigate to request details page
  }

  openChat(requestId: string): void {
    console.log('Opening chat for request:', requestId);
    // Open chat interface
  }

  cancelRequest(requestId: string): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      console.log('Cancelling request:', requestId);
      // Cancel request logic
    }
  }

  giveFeedback(requestId: string): void {
    console.log('Giving feedback for request:', requestId);
    // Navigate to the satisfaction form
    this.router.navigate(['/tickets', requestId, 'satisfaction']);
  }
}
