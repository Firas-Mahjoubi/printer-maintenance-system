import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { 
  InterventionService, 
  InterventionDTO, 
  StatutIntervention,
  TypeIntervention,
  PrioriteIntervention
} from '../../service/intervention.service';

@Component({
  selector: 'app-printer-history',
  templateUrl: './printer-history.component.html',
  styleUrls: ['./printer-history.component.css']
})
export class PrinterHistoryComponent implements OnInit {
  imprimanteId: number | null = null;
  interventions: InterventionDTO[] = [];
  statistiques: any = {};
  loading = false;
  error = '';

  // Enums pour le template
  StatutIntervention = StatutIntervention;
  TypeIntervention = TypeIntervention;
  PrioriteIntervention = PrioriteIntervention;

  // Options pour les filtres
  selectedStatut: StatutIntervention | null = null;
  selectedType: TypeIntervention | null = null;
  filteredInterventions: InterventionDTO[] = [];

  constructor(
    private route: ActivatedRoute,
    private interventionService: InterventionService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.imprimanteId = +id;
      this.loadHistorique();
      this.loadStatistiques();
    } else {
      this.error = 'ID d\'imprimante non fourni';
    }
  }

  private loadHistorique(): void {
    if (!this.imprimanteId) return;
    
    this.loading = true;
    this.error = '';

    this.interventionService.obtenirHistoriqueImprimante(this.imprimanteId).subscribe({
      next: (interventions: InterventionDTO[]) => {
        this.interventions = interventions;
        this.filteredInterventions = interventions;
        this.loading = false;
        console.log('Historique chargé:', interventions);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.error = 'Impossible de charger l\'historique des interventions';
        this.loading = false;
      }
    });
  }

  private loadStatistiques(): void {
    if (!this.imprimanteId) return;

    this.interventionService.obtenirStatistiquesImprimante(this.imprimanteId).subscribe({
      next: (stats: any) => {
        this.statistiques = stats;
        console.log('Statistiques chargées:', stats);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredInterventions = this.interventions.filter(intervention => {
      let matches = true;
      
      if (this.selectedStatut && intervention.statut !== this.selectedStatut) {
        matches = false;
      }
      
      if (this.selectedType && intervention.type !== this.selectedType) {
        matches = false;
      }
      
      return matches;
    });
  }

  clearFilters(): void {
    this.selectedStatut = null;
    this.selectedType = null;
    this.filteredInterventions = this.interventions;
  }

  getStatutClass(statut: StatutIntervention): string {
    return this.interventionService.getStatutClass(statut);
  }

  getPrioriteClass(priorite: PrioriteIntervention): string {
    return this.interventionService.getPrioriteClass(priorite);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Non définie';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  getTypeIcon(type: TypeIntervention): string {
    const icons: { [key: string]: string } = {
      'PREVENTIVE': 'fas fa-calendar-check',
      'CORRECTIVE': 'fas fa-wrench',
      'URGENTE': 'fas fa-exclamation-triangle',
      'INSTALLATION': 'fas fa-cog',
      'MAINTENANCE': 'fas fa-tools',
      'FORMATION': 'fas fa-graduation-cap'
    };
    return icons[type] || 'fas fa-question';
  }

  exportToCSV(): void {
    if (this.filteredInterventions.length === 0) return;

    const headers = ['Numéro', 'Titre', 'Type', 'Statut', 'Priorité', 'Date création', 'Date fin', 'Technicien', 'Coût', 'Solution'];
    const data = this.filteredInterventions.map(intervention => [
      intervention.numero || intervention.id,
      intervention.titre,
      intervention.type,
      intervention.statut,
      intervention.priorite,
      this.formatDate(intervention.dateCreation),
      this.formatDate(intervention.dateFin),
      intervention.technicienNom || 'Non assigné',
      intervention.solution || '',
      ''
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_imprimante_${this.imprimanteId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  trackByInterventionId(index: number, intervention: InterventionDTO): any {
    return intervention.id;
  }
}
