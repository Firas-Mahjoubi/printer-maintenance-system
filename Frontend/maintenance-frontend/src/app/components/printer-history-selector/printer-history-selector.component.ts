import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-printer-history-selector',
  templateUrl: './printer-history-selector.component.html',
  styleUrls: ['./printer-history-selector.component.css']
})
export class PrinterHistorySelectorComponent implements OnInit {
  printers: any[] = [
    { id: 1, modele: 'HP LaserJet Pro M404dn', client: 'Entreprise A', interventions: 5 },
    { id: 2, modele: 'Canon imageRUNNER ADVANCE C5535i', client: 'Entreprise B', interventions: 3 },
    { id: 3, modele: 'Epson EcoTank ET-4760', client: 'Entreprise C', interventions: 8 },
    { id: 4, modele: 'Brother HL-L8360CDW', client: 'Entreprise D', interventions: 2 },
    { id: 5, modele: 'Xerox VersaLink C405', client: 'Entreprise E', interventions: 6 }
  ];

  searchTerm: string = '';
  filteredPrinters: any[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.filteredPrinters = [...this.printers];
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPrinters = [...this.printers];
    } else {
      this.filteredPrinters = this.printers.filter(printer =>
        printer.modele.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        printer.client.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  viewHistory(printerId: number): void {
    this.router.navigate(['/printers', printerId, 'history']);
  }
}
