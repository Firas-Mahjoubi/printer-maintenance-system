import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, Contrat, Utilisateur } from '../../service/contrat.service';
import { NotificationService } from '../../service/notification.service';
import { ImprimanteService, Imprimante } from '../../service/imprimante.service';
import { 
  InterventionService, 
  InterventionDTO, 
  StatutIntervention,
  PrioriteIntervention,
  TypeIntervention
} from '../../service/intervention.service';

// We'll use a simpler document visualization

@Component({
  selector: 'app-contrat-details',
  templateUrl: './contrat-details.component.html',
  styleUrls: ['./contrat-details.component.css']
})
export class ContratDetailsComponent implements OnInit {
  contratId: number | null = null;
  contrat: Contrat | null = null;
  loading: boolean = true;
  error: string | null = null;
  activeTab: string = 'overview';
  editMode: boolean = false;
  exportingPdf: boolean = false;
  activeInterventions: InterventionDTO[] = []; // Typed as InterventionDTO array
  loadingInterventions: boolean = false;
  
  // Equipment-related properties
  equipments: any[] = [];
  loadingEquipments: boolean = false;
  equipmentStats: any = {
    total: 0,
    active: 0,
    maintenance: 0
  };

  // Additional properties for intervention stats
  interventionStats = {
    total: 0,
    enCours: 0,
    enAttente: 0,
    planifiees: 0
  };

  // Animation controls
  animationComplete: boolean = false;
  
  // Document visualization alternative (enhanced)
  documentIcon: string = 'bi-file-earmark-text';
  documentColor: string = '#0075F2'; // Blue color to match the navbar/sidebar theme
  documentAnimated: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contratService: ContratService,
    private notificationService: NotificationService,
    private imprimanteService: ImprimanteService,
    public interventionService: InterventionService
  ) { }

  ngOnInit(): void {
    console.log('ContratDetailsComponent initialized');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.contratId = +id;
        this.loadContratDetails();
        this.loadActiveInterventions();
        this.loadEquipments(); // Load equipments on init
      } else {
        this.error = 'ID de contrat manquant';
        this.loading = false;
      }
    });

    // Trigger animation after a delay
    setTimeout(() => {
      this.animationComplete = true;
    }, 800);

    // Use a fixed document icon with a subtle animation instead of changing icons
    this.documentIcon = 'bi-file-earmark-text';
    this.documentColor = '#0075F2'; // Blue color to match the navbar/sidebar theme
  }

  ngAfterViewInit(): void {
    // This method has been removed as we no longer use the 3D canvas
  }

  // Document visualization is now handled with simple icons and CSS animations
  
  ngOnDestroy(): void {
    // No resources to clean up
  }

  loadContratDetails(): void {
    if (!this.contratId) {
      return;
    }
    
    this.loading = true;
    this.contratService.getById(this.contratId).subscribe({
      next: (data) => {
        this.contrat = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des détails du contrat. Veuillez réessayer.';
        this.loading = false;
        console.error('Error loading contract details:', err);
      }
    });
  }

  loadActiveInterventions(): void {
    if (!this.contratId) {
      return;
    }
    
    this.loadingInterventions = true;
    this.interventionService.obtenirInterventionsActivesPourContrat(this.contratId).subscribe({
      next: (data: InterventionDTO[]) => {
        // Ensure data is always treated as an array
        this.activeInterventions = Array.isArray(data) ? data : [];
        this.calculateInterventionStats();
        this.loadingInterventions = false;
      },
      error: (err) => {
        this.activeInterventions = []; // Initialize as empty array on error
        this.loadingInterventions = false;
        console.error('Error loading active interventions:', err);
      }
    });
  }

  calculateInterventionStats(): void {
    // The array is now properly typed so we don't need to check if it's an array
    this.interventionStats.total = this.activeInterventions.length;
    this.interventionStats.enCours = this.activeInterventions.filter(i => 
      i && i.statut === StatutIntervention.EN_COURS
    ).length;
    this.interventionStats.enAttente = this.activeInterventions.filter(i => 
      i && (
        i.statut === StatutIntervention.EN_ATTENTE || 
        i.statut === StatutIntervention.ATTENTE_PIECES || 
        i.statut === StatutIntervention.ATTENTE_CLIENT
      )
    ).length;
    this.interventionStats.planifiees = this.activeInterventions.filter(i => 
      i && i.statut === StatutIntervention.PLANIFIEE
    ).length;
  }

  loadEquipments(): void {
    if (!this.contratId) {
      return;
    }
    
    this.loadingEquipments = true;
    this.imprimanteService.getAllByContrat(this.contratId).subscribe({
      next: (data: Imprimante[]) => {
        this.equipments = data;
        this.calculateEquipmentStats();
        this.loadingEquipments = false;
      },
      error: (err: any) => {
        this.loadingEquipments = false;
        console.error('Error loading equipments:', err);
      }
    });
  }

  calculateEquipmentStats(): void {
    this.equipmentStats.total = this.equipments.length;
    this.equipmentStats.active = this.equipments.filter(eq => eq.etat === 'actif').length;
    this.equipmentStats.maintenance = this.equipments.filter(eq => eq.etat === 'maintenance').length;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  isStatusMatch(status: string, match: string): boolean {
    if (!status) return false;
    return status.toLowerCase() === match.toLowerCase();
  }

  getStatusClass(): string {
    if (!this.contrat || !this.contrat.statutContrat) {
      return 'bg-secondary';
    }
    
    const status = this.contrat.statutContrat.toLowerCase();
    
    if (status === 'actif') return 'bg-success';
    if (status === 'maintenance') return 'bg-warning';
    if (status === 'suspendu') return 'bg-secondary';
    if (status === 'brouillon') return 'bg-info';
    
    return 'bg-secondary';
  }

  getStatusIcon(): string {
    if (!this.contrat || !this.contrat.statutContrat) {
      return 'bi-question-circle-fill';
    }
    
    const status = this.contrat.statutContrat.toLowerCase();
    
    if (status === 'actif') return 'bi-check-circle-fill';
    if (status === 'maintenance') return 'bi-tools';
    if (status === 'suspendu') return 'bi-pause-circle-fill';
    if (status === 'brouillon') return 'bi-pencil-fill';
    
    return 'bi-question-circle-fill';
  }

  isContractExpiringSoon(): boolean {
    if (!this.contrat || !this.contrat.dateFin) {
      return false;
    }
    
    const expirationDate = new Date(this.contrat.dateFin);
    const today = new Date();
    const differenceInDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    return differenceInDays <= 30 && differenceInDays > 0;
  }

  isContractExpired(): boolean {
    if (!this.contrat || !this.contrat.dateFin) {
      return false;
    }
    
    const expirationDate = new Date(this.contrat.dateFin);
    const today = new Date();
    
    return expirationDate < today;
  }

  getDaysUntilExpiration(): number {
    if (!this.contrat || !this.contrat.dateFin) {
      return 0;
    }
    
    const expirationDate = new Date(this.contrat.dateFin);
    const today = new Date();
    return Math.max(0, Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
  }

  renewContract(): void {
    if (!this.contrat || !this.contratId) {
      this.notificationService.showError('Impossible de renouveler ce contrat');
      return;
    }
    
    // Clone the current contract
    const renewedContract: Contrat = {
      ...this.contrat,
      dateDebut: new Date().toISOString().split('T')[0], // Today
      dateFin: this.calculateNewEndDate(), // 1 year from today
      statutContrat: 'actif'
    };
    
    // Call the renew API
    this.contratService.renew(this.contratId, renewedContract).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Contrat renouvelé avec succès');
        this.contrat = response;
      },
      error: (err) => {
        this.notificationService.showError('Erreur lors du renouvellement du contrat');
        console.error('Error renewing contract:', err);
      }
    });
  }

  calculateNewEndDate(): string {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return oneYearFromNow.toISOString().split('T')[0];
  }

  editContract(): void {
    if (this.contratId) {
      this.router.navigate(['/contrats/edit', this.contratId]);
    }
  }

  exportToPdf(): void {
    if (!this.contratId) {
      return;
    }
    
    this.exportingPdf = true;
    this.contratService.exportContratToPdf(this.contratId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrat_${this.contrat?.numeroContrat || this.contratId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.exportingPdf = false;
        this.notificationService.showSuccess('Contrat exporté en PDF');
      },
      error: (err) => {
        this.exportingPdf = false;
        this.notificationService.showError('Erreur lors de l\'export du contrat en PDF');
        console.error('Error exporting contract to PDF:', err);
      }
    });
  }

  /**
   * Delete the current contract after confirmation
   */
  deleteContract(): void {
    if (!this.contrat || !this.contratId) {
      this.notificationService.showError('Impossible de supprimer ce contrat');
      return;
    }

    // Ask for confirmation before deleting
    const confirmation = window.confirm(`Êtes-vous sûr de vouloir supprimer le contrat ${this.contrat.numeroContrat || this.contratId} ? Cette action est irréversible.`);
    
    if (!confirmation) {
      return; // User cancelled the operation
    }
    
    // Proceed with deletion
    this.contratService.delete(this.contratId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Contrat supprimé avec succès');
        // Navigate back to contracts list
        this.router.navigate(['/contrats']);
      },
      error: (err) => {
        this.notificationService.showError('Erreur lors de la suppression du contrat');
        console.error('Error deleting contract:', err);
      }
    });
  }

  // Helper functions for intervention display - using InterventionService utilities
  getInterventionStatusClass(status: string | StatutIntervention | undefined | null): string {
    if (!status) return 'bg-secondary';
    return `bg-${this.interventionService.getStatutClass(status as StatutIntervention)}`;
  }
  
  formatInterventionStatus(status: string | StatutIntervention | undefined | null): string {
    if (!status) return 'Non défini';
    return this.interventionService.getStatutLabel(status as StatutIntervention);
  }
  
  // Additional helper methods for intervention priority
  getInterventionPriorityClass(priority: string | PrioriteIntervention | undefined | null): string {
    if (!priority) return 'bg-secondary';
    return `bg-${this.interventionService.getPrioriteClass(priority as PrioriteIntervention)}`;
  }
  
  formatInterventionPriority(priority: string | PrioriteIntervention | undefined | null): string {
    if (!priority) return 'Non défini';
    return this.interventionService.getPrioriteLabel(priority as PrioriteIntervention);
  }
  
  // Helper methods for intervention type
  formatInterventionType(type: string | TypeIntervention | undefined | null): string {
    if (!type) return 'Non défini';
    return this.interventionService.getTypeLabel(type as TypeIntervention);
  }
  
  viewInterventionDetails(interventionId: number | undefined | null): void {
    if (interventionId) {
      this.router.navigate(['/tickets/details', interventionId]);
    }
  }

  navigateToEquipment(): void {
    if (this.contratId) {
      this.router.navigate(['/contrats', this.contratId, 'printers']);
    }
  }

  goBack(): void {
    this.router.navigate(['/contrats']);
  }
}
