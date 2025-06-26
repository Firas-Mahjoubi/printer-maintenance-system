import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, Contrat } from '../../service/contrat.service';

@Component({
  selector: 'app-contrat-details',
  templateUrl: './contrat-details.component.html',
  styleUrls: ['./contrat-details.component.css']
})
export class ContratDetailsComponent implements OnInit {
  contrat: Contrat | null = null;
  loading = true;
  error: string | null = null;
  contratId: number;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private contratService: ContratService
  ) {
    this.contratId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadContratDetails();
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
}
