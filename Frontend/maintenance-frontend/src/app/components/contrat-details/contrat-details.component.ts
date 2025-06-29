import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, Contrat } from '../../service/contrat.service';
import { ImprimanteService, Imprimante } from '../../service/imprimante.service';

@Component({
  selector: 'app-contrat-details',
  templateUrl: './contrat-details.component.html',
  styleUrls: ['./contrat-details.component.css']
})
export class ContratDetailsComponent implements OnInit {
  contrat: Contrat | null = null;
  imprimantes: Imprimante[] = [];
  loading = true;
  loadingImprimantes = false;
  error: string | null = null;
  errorImprimantes: string | null = null;
  contratId: number;

  // Add printer form properties
  showAddPrinterForm = false;
  showExcelImport = false;
  newPrinter: Imprimante = {
    id: 0,
    marque: '',
    modele: '',
    emplacement: '',
    numeroSerie: ''
  };
  
  // Excel import properties
  selectedFile: File | null = null;
  uploadProgress = 0;
  importing = false;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private contratService: ContratService,
    private imprimanteService: ImprimanteService
  ) {
    this.contratId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadContratDetails();
    this.loadImprimantes();
  }

  loadContratDetails(): void {
    this.loading = true;
    this.error = null;

    this.contratService.getById(this.contratId).subscribe({
      next: (contrat) => {
        this.contrat = contrat;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des détails du contrat.';
        this.loading = false;
        console.error('Error loading contract details:', error);
      }
    });
  }

  loadImprimantes(): void {
    this.loadingImprimantes = true;
    this.errorImprimantes = null;

    this.imprimanteService.getAllByContrat(this.contratId).subscribe({
      next: (imprimantes) => {
        this.imprimantes = imprimantes;
        this.loadingImprimantes = false;
      },
      error: (error) => {
        this.errorImprimantes = 'Erreur lors du chargement des imprimantes.';
        this.loadingImprimantes = false;
        console.error('Error loading printers:', error);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  editContrat(): void {
    if (this.contrat?.id) {
      this.router.navigate(['/contrats/edit', this.contrat.id]);
    }
  }

  deleteContrat(): void {
    if (this.contrat?.id && confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      this.contratService.delete(this.contrat.id).subscribe({
        next: () => {
          this.router.navigate(['/contrats']);
        },
        error: (error) => {
          console.error('Error deleting contract:', error);
        }
      });
    }
  }

  renewContrat(): void {
    if (this.contrat?.id) {
      this.router.navigate(['/contrats/renew', this.contrat.id]);
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'actif':
        return 'bg-success';
      case 'expire':
      case 'expiré':
        return 'bg-danger';
      case 'suspendu':
        return 'bg-warning';
      case 'brouillon':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'actif':
        return 'Actif';
      case 'expire':
      case 'expiré':
        return 'Expiré';
      case 'suspendu':
        return 'Suspendu';
      case 'brouillon':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'actif':
        return 'bi-check-circle';
      case 'expire':
      case 'expiré':
        return 'bi-x-circle';
      case 'suspendu':
        return 'bi-pause-circle';
      case 'brouillon':
        return 'bi-pencil';
      default:
        return 'bi-question-circle';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Date non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long'
    });
  }

  calculateDaysRemaining(endDate: string): number {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateContractDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'Durée inconnue';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return `${months} mois (${diffDays} jours)`;
  }

  getProgressPercentage(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    
    if (elapsed < 0) return 0;
    if (elapsed > totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  exportToPdf(): void {
    if (!this.contrat?.id) return;
    
    this.contratService.exportContratToPdf(this.contrat.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat-${this.contrat?.numeroContrat || this.contrat?.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      }
    });
  }

  getClientInitials(): string {
    if (this.contrat?.client?.nom && this.contrat?.client?.prenom) {
      return (this.contrat.client.prenom.charAt(0) + this.contrat.client.nom.charAt(0)).toUpperCase();
    }
    return this.contrat?.client?.nom?.charAt(0)?.toUpperCase() || 'C';
  }

  getClientFullName(): string {
    if (this.contrat?.client?.prenom && this.contrat?.client?.nom) {
      return `${this.contrat.client.prenom} ${this.contrat.client.nom}`;
    }
    return this.contrat?.client?.nom || 'Client Non Défini';
  }

  // Printer management methods
  refreshImprimantes(): void {
    this.loadImprimantes();
  }

  trackByImprimanteId(index: number, imprimante: Imprimante): number {
    return imprimante.id;
  }

  // Show/hide add printer form
  toggleAddPrinterForm(): void {
    this.showAddPrinterForm = !this.showAddPrinterForm;
    if (this.showAddPrinterForm) {
      this.showExcelImport = false; // Close Excel import if open
      this.resetNewPrinter();
    }
  }

  // Show/hide Excel import form
  toggleExcelImport(): void {
    this.showExcelImport = !this.showExcelImport;
    if (this.showExcelImport) {
      this.showAddPrinterForm = false; // Close add form if open
      this.selectedFile = null;
    }
  }

  // Reset new printer form
  resetNewPrinter(): void {
    this.newPrinter = {
      id: 0,
      marque: '',
      modele: '',
      emplacement: '',
      numeroSerie: ''
    };
  }

  // Add single printer
  addPrinter(): void {
    if (!this.newPrinter.marque || !this.newPrinter.modele || !this.newPrinter.numeroSerie) {
      alert('Veuillez remplir tous les champs obligatoires (Marque, Modèle, N° Série)');
      return;
    }

    this.imprimanteService.addToContrat(this.newPrinter, this.contratId).subscribe({
      next: (imprimante) => {
        this.imprimantes.push(imprimante);
        this.resetNewPrinter();
        this.showAddPrinterForm = false;
        alert('Imprimante ajoutée avec succès!');
      },
      error: (error) => {
        console.error('Error adding printer:', error);
        alert('Erreur lors de l\'ajout de l\'imprimante');
      }
    });
  }

  // Cancel add printer
  cancelAddPrinter(): void {
    this.resetNewPrinter();
    this.showAddPrinterForm = false;
  }

  // Handle file selection for Excel import
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
      }
      this.selectedFile = file;
    }
  }

  // Import printers from Excel
  importFromExcel(): void {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner un fichier Excel');
      return;
    }

    this.importing = true;
    this.uploadProgress = 0;

    this.imprimanteService.importFromExcel(this.selectedFile, this.contratId).subscribe({
      next: (response) => {
        console.log('Import successful:', response);
        this.importing = false;
        this.uploadProgress = 100;
        this.selectedFile = null;
        this.showExcelImport = false;
        this.loadImprimantes(); // Refresh the list
        alert('Importation réussie! Les imprimantes ont été ajoutées au contrat.');
      },
      error: (error) => {
        console.error('Error importing printers:', error);
        this.importing = false;
        this.uploadProgress = 0;
        alert('Erreur lors de l\'importation: ' + (error.error || error.message || 'Erreur inconnue'));
      }
    });
  }

  // Cancel Excel import
  cancelExcelImport(): void {
    this.selectedFile = null;
    this.showExcelImport = false;
    this.uploadProgress = 0;
  }

  // Remove printer from contract
  removePrinter(imprimante: Imprimante): void {
    if (confirm(`Êtes-vous sûr de vouloir retirer l'imprimante ${imprimante.marque} ${imprimante.modele} de ce contrat ?`)) {
      this.imprimanteService.delete(imprimante.id).subscribe({
        next: () => {
          this.imprimantes = this.imprimantes.filter(i => i.id !== imprimante.id);
          alert('Imprimante retirée du contrat avec succès');
        },
        error: (error) => {
          console.error('Error removing printer:', error);
          alert('Erreur lors de la suppression de l\'imprimante');
        }
      });
    }
  }

  // Download Excel template
  downloadExcelTemplate(): void {
    // Create a simple Excel template with headers
    const headers = ['Marque', 'Modele', 'NumeroSerie', 'Emplacement'];
    const sampleData = [
      ['HP', 'LaserJet Pro', 'HP123456789', 'Bureau 101'],
      ['Canon', 'PIXMA Pro', 'CN987654321', 'Salle de réunion'],
      ['Epson', 'EcoTank L3250', 'EP456789123', 'Étage 2 - Zone A']
    ];

    // Create CSV content (simple format for demonstration)
    let csvContent = headers.join(';') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(';') + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_imprimantes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
