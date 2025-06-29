import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-printer-list',
  templateUrl: './printer-list.component.html',
  styleUrls: ['./printer-list.component.css']
})
export class PrinterListComponent implements OnInit {
  printers: any[] = [
    { id: 1, modele: 'HP LaserJet Pro M404dn', client: 'Entreprise A', statut: 'Actif', interventions: 5 },
    { id: 2, modele: 'Canon imageRUNNER ADVANCE C5535i', client: 'Entreprise B', statut: 'Actif', interventions: 3 },
    { id: 3, modele: 'Epson EcoTank ET-4760', client: 'Entreprise C', statut: 'En maintenance', interventions: 8 },
    { id: 4, modele: 'Brother HL-L8360CDW', client: 'Entreprise D', statut: 'Actif', interventions: 2 },
    { id: 5, modele: 'Xerox VersaLink C405', client: 'Entreprise E', statut: 'Actif', interventions: 6 }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  viewHistory(printerId: number): void {
    this.router.navigate(['/printers', printerId, 'history']);
  }

  getStatusBadgeClass(statut: string): string {
    switch (statut) {
      case 'Actif':
        return 'badge bg-success';
      case 'En maintenance':
        return 'badge bg-warning';
      case 'Hors service':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
