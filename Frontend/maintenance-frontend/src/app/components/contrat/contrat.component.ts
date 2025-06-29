// contrat.component.ts
import { Component, OnInit } from '@angular/core';
import { ContratService , Contrat } from '../../service/contrat.service';

@Component({
  selector: 'app-contrat',
  templateUrl: './contrat.component.html'
})
export class ContratComponent implements OnInit {
  contrats: Contrat[] = [];

  constructor(private contratService: ContratService) {}

  ngOnInit() {
    this.loadContrats();
  }

  loadContrats() {
    this.contratService.getAll().subscribe(data => {
      console.log('Contracts loaded:', data);
      if (data && data.length > 0) {
        console.log('First contract status:', data[0].statutContrat);
        console.log('All contract statuses:', data.map(c => c.statutContrat));
      }
      this.contrats = data;
    });
  }

  deleteContrat(id: number | undefined) {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      this.contratService.delete(id).subscribe(() => this.loadContrats());
    }
  }

  newContrat() {
    // Implement modal/form or route to create
    alert("Ouvrir formulaire de création");
  }

  editContrat(contrat: Contrat) {
    // Implement modal/form or route to edit
    alert("Ouvrir formulaire d'édition pour: " + contrat.numeroContrat);
  }

  viewContrat(contrat: Contrat) {
    // Implement view details functionality
    alert("Voir les détails du contrat: " + contrat.numeroContrat);
  }

  exportToPdf(contrat: Contrat) {
    if (!contrat.id) return;
    
    this.contratService.exportContratToPdf(contrat.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat-${contrat.numeroContrat || contrat.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      }
    });
  }

  duplicateContrat(contrat: Contrat) {
    // Implement duplicate functionality
    alert("Dupliquer le contrat: " + contrat.numeroContrat);
  }

  isContractExpiringSoon(contrat: Contrat): boolean {
    if (!contrat.dateFin) return false;
    const today = new Date();
    const endDate = new Date(contrat.dateFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0; // Expires within 30 days
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
      default:
        return `STATUT: ${normalizedStatus.toUpperCase()}`;
    }
  }

  getStatusDescription(status: string): string {
    if (!status || status === null || status === undefined) {
      return 'Aucun statut défini';
    }
    
    const normalizedStatus = String(status).trim();
    
    switch (normalizedStatus.toLowerCase()) {
      case 'actif':
      case 'active':
        return 'Maintenance en cours';
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
        return normalizedStatus === 'en attente' || normalizedStatus === 'attente' || normalizedStatus === 'pending';
      case 'expire':
        return normalizedStatus === 'expiré' || normalizedStatus === 'expire' || normalizedStatus === 'expired';
      case 'suspendu':
        return normalizedStatus === 'suspendu' || normalizedStatus === 'suspended';
      case 'brouillon':
        return normalizedStatus === 'brouillon' || normalizedStatus === 'draft';
      default:
        return false;
    }
  }
}
