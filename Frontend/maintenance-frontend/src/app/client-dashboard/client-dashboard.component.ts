import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

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
  equipmentCount = 3;
  activeTickets = 2;
  lastMaintenance = 15;

  recentTickets: Ticket[] = [
    {
      id: 'TK001',
      title: 'Problème d\'impression couleur',
      description: 'L\'imprimante ne fonctionne qu\'en noir et blanc',
      status: 'in-progress',
      statusLabel: 'En cours',
      priority: 'high',
      priorityLabel: 'Haute',
      date: new Date('2024-12-20')
    },
    {
      id: 'TK002',
      title: 'Maintenance préventive',
      description: 'Maintenance programmée trimestrielle',
      status: 'scheduled',
      statusLabel: 'Planifiée',
      priority: 'medium',
      priorityLabel: 'Moyenne',
      date: new Date('2024-12-18')
    }
  ];

  equipmentList: Equipment[] = [
    {
      id: 'EQ001',
      name: 'Imprimante Bureau 1',
      model: 'HP LaserJet Pro M404dn',
      serialNumber: 'HPJ2K4567',
      location: 'Bureau Principal',
      status: 'operational',
      statusLabel: 'Opérationnelle',
      pageCount: 15420,
      lastMaintenance: new Date('2024-11-15')
    },
    {
      id: 'EQ002',
      name: 'Imprimante Couleur',
      model: 'Canon ImageCLASS MF644Cdw',
      serialNumber: 'CAN8R9876',
      location: 'Salle de réunion',
      status: 'warning',
      statusLabel: 'Attention',
      pageCount: 8950,
      lastMaintenance: new Date('2024-10-20')
    },
    {
      id: 'EQ003',
      name: 'Imprimante Réseau',
      model: 'Brother HL-L3270CDW',
      serialNumber: 'BRO3M2345',
      location: 'Open Space',
      status: 'maintenance',
      statusLabel: 'Maintenance',
      pageCount: 22100,
      lastMaintenance: new Date('2024-12-01')
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // If not logged in or not a client, redirect
    if (!this.authService.isLoggedIn() || this.authService.getCurrentUserRole() !== 'CLIENT') {
      this.router.navigate(['/login']);
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
