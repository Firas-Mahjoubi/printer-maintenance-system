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

  // PDF export properties
  exportingPdf = false;
  pdfPreviewUrl: string | null = null;

  // Contract renewal properties
  showRenewalForm = false;
  renewalContrat: Contrat = {
    id: 0,
    numeroContrat: '',
    dateDebut: '',
    dateFin: '',
    conditions_contrat: '',
    statutContrat: 'ACTIF',
    clientId: 0
  };
  renewalLoading = false;

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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long'
      });
    } catch (error) {
      console.error('Error formatting short date:', error);
      return 'N/A';
    }
  }

  calculateDaysRemaining(endDate: string): number {
    if (!endDate) return 0;
    try {
      const today = new Date();
      const end = new Date(endDate);
      if (isNaN(end.getTime())) return 0;
      const diffTime = end.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  }

  calculateContractDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'N/A';
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) return 'Durée invalide';
      
      if (diffDays < 30) {
        return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        return `${months} mois`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.round((diffDays % 365) / 30);
        if (remainingMonths > 0) {
          return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
        }
        return `${years} an${years > 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Error calculating contract duration:', error);
      return 'N/A';
    }
  }

  getProgressPercentage(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      
      const totalDuration = end.getTime() - start.getTime();
      const elapsed = today.getTime() - start.getTime();
      
      if (totalDuration <= 0) return 0;
      if (elapsed < 0) return 0;
      if (elapsed > totalDuration) return 100;
      
      return Math.round((elapsed / totalDuration) * 100);
    } catch (error) {
      console.error('Error calculating progress percentage:', error);
      return 0;
    }
  }

  // Contract renewal methods
  toggleRenewalForm(): void {
    this.showRenewalForm = !this.showRenewalForm;
    if (this.showRenewalForm && this.contrat) {
      // Pre-fill renewal form with current contract data
      this.renewalContrat = {
        id: 0,
        numeroContrat: this.generateNewContractNumber(),
        dateDebut: this.formatDateForInput(new Date()),
        dateFin: this.calculateNewEndDate(),
        conditions_contrat: this.contrat.conditions_contrat || '',
        statutContrat: 'ACTIF',
        clientId: this.contrat.clientId || this.contrat.client?.id || 0
      };
    }
  }

  cancelRenewal(): void {
    this.showRenewalForm = false;
    this.renewalContrat = {
      id: 0,
      numeroContrat: '',
      dateDebut: '',
      dateFin: '',
      conditions_contrat: '',
      statutContrat: 'ACTIF',
      clientId: 0
    };
  }

  generateNewContractNumber(): string {
    if (!this.contrat?.numeroContrat) return '';
    const currentNumber = this.contrat.numeroContrat;
    const year = new Date().getFullYear();
    
    // Try to extract existing pattern and increment
    const match = currentNumber.match(/(\D*)(\d+)(\D*)/);
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2]) + 1;
      const suffix = match[3];
      return `${prefix}${number.toString().padStart(match[2].length, '0')}${suffix}`;
    }
    
    // Fallback: append year and sequence
    return `${currentNumber}-R${year}`;
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  calculateNewEndDate(): string {
    if (!this.contrat?.dateDebut || !this.contrat?.dateFin) {
      // Default to 1 year from today
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return this.formatDateForInput(oneYearFromNow);
    }

    // Calculate the duration of the current contract
    const startDate = new Date(this.contrat.dateDebut);
    const endDate = new Date(this.contrat.dateFin);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    // Apply same duration from today
    const newEndDate = new Date();
    newEndDate.setTime(newEndDate.getTime() + durationMs);
    
    return this.formatDateForInput(newEndDate);
  }

  renewContract(): void {
    if (!this.contrat?.id) {
      alert('Contrat non trouvé.');
      return;
    }

    // Validate form data
    const validation = this.validateRenewalForm();
    if (!validation.isValid) {
      alert('Erreurs de validation:\n' + validation.errors.join('\n'));
      return;
    }

    this.renewalLoading = true;

    this.contratService.renew(this.contrat.id, this.renewalContrat).subscribe({
      next: (newContrat: Contrat) => {
        this.renewalLoading = false;
        this.showRenewalForm = false;
        
        // Show success message
        alert('Contrat renouvelé avec succès! Redirection vers le nouveau contrat...');
        
        // Redirect to the new contract details page
        this.router.navigate(['/contrat-details', newContrat.id]);
      },
      error: (error: any) => {
        this.renewalLoading = false;
        console.error('Error renewing contract:', error);
        
        // More detailed error handling
        let errorMessage = 'Erreur lors du renouvellement du contrat.';
        if (error.error?.message) {
          errorMessage += '\n' + error.error.message;
        } else if (error.message) {
          errorMessage += '\n' + error.message;
        }
        
        alert(errorMessage + '\nVeuillez réessayer.');
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

  // Helper method to validate renewal form data
  validateRenewalForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.renewalContrat.numeroContrat?.trim()) {
      errors.push('Le numéro de contrat est requis');
    }
    
    if (!this.renewalContrat.dateDebut) {
      errors.push('La date de début est requise');
    }
    
    if (!this.renewalContrat.dateFin) {
      errors.push('La date de fin est requise');
    }
    
    if (this.renewalContrat.dateDebut && this.renewalContrat.dateFin) {
      const startDate = new Date(this.renewalContrat.dateDebut);
      const endDate = new Date(this.renewalContrat.dateFin);
      
      if (startDate >= endDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
      
      if (startDate < new Date()) {
        errors.push('La date de début ne peut pas être dans le passé');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Improved method to display client information safely
  getClientDisplayInfo(): { name: string; email: string; phone: string; id: string } {
    const client = this.contrat?.client;
    return {
      name: client ? `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Nom non défini' : 'Client non défini',
      email: client?.email || 'Email non défini',
      phone: client?.telephone || 'Téléphone non défini',
      id: client?.id?.toString() || this.contrat?.clientId?.toString() || 'N/A'
    };
  }

  // Get contract creation year
  getContractYear(): string {
    if (!this.contrat?.dateDebut) return new Date().getFullYear().toString();
    try {
      return new Date(this.contrat.dateDebut).getFullYear().toString();
    } catch {
      return new Date().getFullYear().toString();
    }
  }

  // Method to check if contract is renewable
  isContractRenewable(): boolean {
    return this.contrat?.statutContrat === 'ACTIF' && !this.showRenewalForm;
  }

  // Method to get contract status display information
  getContractStatusInfo(): { class: string; icon: string; text: string; color: string } {
    const status = this.contrat?.statutContrat?.toLowerCase() || '';
    
    switch (status) {
      case 'actif':
        return { class: 'bg-success', icon: 'bi-check-circle', text: 'Actif', color: 'success' };
      case 'expire':
        return { class: 'bg-danger', icon: 'bi-x-circle', text: 'Expiré', color: 'danger' };
      case 'renouvele':
        return { class: 'bg-info', icon: 'bi-arrow-clockwise', text: 'Renouvelé', color: 'info' };
      case 'en_attente':
        return { class: 'bg-warning', icon: 'bi-clock', text: 'En Attente', color: 'warning' };
      case 'suspendu':
        return { class: 'bg-secondary', icon: 'bi-pause-circle', text: 'Suspendu', color: 'secondary' };
      case 'brouillon':
        return { class: 'bg-light text-dark', icon: 'bi-pencil', text: 'Brouillon', color: 'light' };
      default:
        return { class: 'bg-secondary', icon: 'bi-question-circle', text: 'Inconnu', color: 'secondary' };
    }
  }

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

  exportToPdf(): void {
    if (!this.contrat?.id) {
      alert('Contrat non trouvé');
      return;
    }
    
    this.exportingPdf = true;
    
    this.contratService.exportContratToPdf(this.contrat.id).subscribe({
      next: (blob: Blob) => {
        this.exportingPdf = false;
        
        // Create download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrat-${this.contrat?.numeroContrat}-${this.formatDateForFilename(new Date())}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success notification
        this.showExportSuccessNotification();
      },
      error: (error: any) => {
        this.exportingPdf = false;
        console.error('Error exporting PDF:', error);
        alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      }
    });
  }

  exportContractSummary(): void {
    if (!this.contrat?.id) {
      alert('Contrat non trouvé');
      return;
    }
    
    this.exportingPdf = true;
    
    // For now, use the same endpoint but we could create a separate one for summary
    this.contratService.exportContratToPdf(this.contrat.id).subscribe({
      next: (blob: Blob) => {
        this.exportingPdf = false;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrat-resume-${this.contrat?.numeroContrat}-${this.formatDateForFilename(new Date())}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showExportSuccessNotification('Résumé du contrat exporté avec succès!');
      },
      error: (error: any) => {
        this.exportingPdf = false;
        console.error('Error exporting contract summary:', error);
        alert('Erreur lors de l\'export du résumé. Veuillez réessayer.');
      }
    });
  }

  exportEquipmentList(): void {
    if (!this.contrat?.id) {
      alert('Contrat non trouvé');
      return;
    }
    
    if (this.imprimantes.length === 0) {
      alert('Aucun équipement à exporter');
      return;
    }
    
    this.exportingPdf = true;
    
    // Create a simple CSV export for equipment list
    this.generateEquipmentPdf();
  }

  previewPdf(): void {
    if (!this.contrat?.id) {
      alert('Contrat non trouvé');
      return;
    }
    
    this.exportingPdf = true;
    
    this.contratService.exportContratToPdf(this.contrat.id).subscribe({
      next: (blob: Blob) => {
        this.exportingPdf = false;
        
        // Create object URL for preview
        const url = window.URL.createObjectURL(blob);
        this.pdfPreviewUrl = url;
        
        // Open in new window for preview
        const previewWindow = window.open(url, '_blank');
        if (!previewWindow) {
          alert('Veuillez autoriser les pop-ups pour prévisualiser le PDF');
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error: any) => {
        this.exportingPdf = false;
        console.error('Error previewing PDF:', error);
        alert('Erreur lors de l\'aperçu PDF. Veuillez réessayer.');
      }
    });
  }

  private generateEquipmentPdf(): void {
    // Generate HTML content for equipment list
    const equipmentHtml = this.generateEquipmentHtml();
    
    // For now, create a simple text file - in a real implementation, 
    // you would send this to a backend service to generate PDF
    const blob = new Blob([equipmentHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipements-${this.contrat?.numeroContrat}-${this.formatDateForFilename(new Date())}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    this.exportingPdf = false;
    this.showExportSuccessNotification('Liste des équipements exportée avec succès!');
  }

  private generateEquipmentHtml(): string {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Liste des Équipements - Contrat ${this.contrat?.numeroContrat}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .equipment-table { width: 100%; border-collapse: collapse; }
            .equipment-table th, .equipment-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .equipment-table th { background-color: #f2f2f2; font-weight: bold; }
            .equipment-table tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Liste des Équipements</h1>
            <h2>Contrat N° ${this.contrat?.numeroContrat}</h2>
            <p>Client: ${this.getClientDisplayInfo().name}</p>
            <p>Date d'export: ${this.formatDate(new Date().toISOString())}</p>
        </div>
        
        <table class="equipment-table">
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Marque</th>
                    <th>Modèle</th>
                    <th>Numéro de Série</th>
                    <th>Emplacement</th>
                </tr>
            </thead>
            <tbody>
                ${this.imprimantes.map((imprimante, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${imprimante.marque || 'Non spécifié'}</td>
                    <td>${imprimante.modele || 'Non spécifié'}</td>
                    <td>${imprimante.numeroSerie || 'Non spécifié'}</td>
                    <td>${imprimante.emplacement || 'Non spécifié'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>Document généré automatiquement - Système de Gestion de Maintenance</p>
        </div>
    </body>
    </html>
    `;
    return html;
  }

  private showExportSuccessNotification(message: string = 'Contrat exporté avec succès!'): void {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>${message}</span>
        <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get current date formatted for display
  getCurrentDate(): string {
    return new Date().toLocaleDateString('fr-FR');
  }

  // Helper methods for printer statistics
  getOperationalCount(): number {
    // Assuming all printers are operational for now
    return this.imprimantes.length;
  }

  getBrandsCount(): number {
    const brands = new Set(this.imprimantes.map(imp => imp.marque).filter(Boolean));
    return brands.size;
  }

  getLocationsCount(): number {
    const locations = new Set(this.imprimantes.map(imp => imp.emplacement).filter(Boolean));
    return locations.size;
  }

  // Navigation to printer management page
  goToPrintersManagement(): void {
    this.router.navigate(['/contrats', this.contratId, 'printers']);
  }

  // Math object for template use
  Math = Math;
}
