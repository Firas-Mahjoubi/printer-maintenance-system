import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InterventionService, InterventionDTO, StatutIntervention, TypeIntervention, PrioriteIntervention, InterventionHistoriqueDTO } from '../../service/intervention.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ImprimanteService, Imprimante } from '../../service/imprimante.service';

@Component({
  selector: 'app-ticket-details',
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.css']
})
export class TicketDetailsComponent implements OnInit, OnDestroy {
  ticketId: number = 0;
  ticket: InterventionDTO | null = null;
  ticketHistory: InterventionHistoriqueDTO[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  imprimantes: Imprimante[] = [];
  loadingImprimantes: boolean = false;
  
  // Forms
  diagnosticForm: FormGroup;
  solutionForm: FormGroup;
  pauseForm: FormGroup;
  cancelForm: FormGroup;
  
  // Action permissions
  canStart: boolean = false;
  canPause: boolean = false;
  canResume: boolean = false;
  canComplete: boolean = false;
  canCancel: boolean = false;
  canDiagnose: boolean = false;
  canAddSolution: boolean = false;
  
  // User info - in a real app, this would come from an auth service
  currentUserId: number = 1; // Mocked user ID
  
  // Status labels for display
  statutLabels = {
    'EN_ATTENTE': 'En attente',
    'PLANIFIEE': 'Planifiée',
    'EN_COURS': 'En cours',
    'EN_PAUSE': 'En pause',
    'TERMINEE': 'Terminée',
    'ANNULEE': 'Annulée',
    'REPORTEE': 'Reportée',
    'REJETEE': 'Rejetée',
    'ATTENTE_PIECES': 'En attente de pièces',
    'ATTENTE_CLIENT': 'En attente du client'
  };
  
  statusColors = {
    'EN_ATTENTE': '#FFC107',
    'PLANIFIEE': '#17A2B8',
    'EN_COURS': '#007BFF',
    'EN_PAUSE': '#FD7E14',
    'TERMINEE': '#28A745',
    'ANNULEE': '#DC3545',
    'REPORTEE': '#6C757D',
    'REJETEE': '#DC3545',
    'ATTENTE_PIECES': '#FD7E14',
    'ATTENTE_CLIENT': '#FD7E14',
    '': '#6C757D' // Default color for empty status
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public interventionService: InterventionService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private imprimanteService: ImprimanteService
  ) {
    // Initialize forms
    this.diagnosticForm = this.fb.group({
      diagnosticTechnique: ['', Validators.required],
      symptomesDetailles: ['', Validators.required]
    });
    
    this.solutionForm = this.fb.group({
      solutionTechnique: ['', Validators.required],
      coutIntervention: [0, [Validators.required, Validators.min(0)]],
      commentaireInterne: ['']
    });
    
    this.pauseForm = this.fb.group({
      raison: ['', Validators.required]
    });
    
    this.cancelForm = this.fb.group({
      raison: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Get ticket ID from route params
    this.route.params.subscribe(params => {
      this.ticketId = +params['id'];
      this.loadTicketDetails();
    });
  }
  
  ngOnDestroy(): void {
    // Cleanup code if needed
  }
  
  loadTicketDetails(): void {
    this.isLoading = true;
    
    // Get ticket details
    this.interventionService.obtenirTicketParId(this.ticketId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.updateActionPermissions();
        
        // Load ticket history
        this.loadTicketHistory();
        
        // Load printers for this contract if available
        if (this.ticket.contratId) {
          this.loadPrinterDetails(this.ticket.contratId);
        }
        
        // Pre-fill forms if applicable
        if (this.ticket.diagnostic) {
          this.diagnosticForm.patchValue({
            diagnosticTechnique: this.ticket.diagnostic,
            symptomesDetailles: this.ticket.commentaireInterne || ''
          });
        }
        
        if (this.ticket.solution) {
          this.solutionForm.patchValue({
            solutionTechnique: this.ticket.solution,
            commentaireInterne: this.ticket.commentaireInterne || ''
          });
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement du ticket: ' + error.message;
        this.isLoading = false;
      }
    });
  }
  
  loadTicketHistory(): void {
    this.interventionService.obtenirHistoriqueTicket(this.ticketId).subscribe({
      next: (data) => {
        this.ticketHistory = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }
    });
  }
  
  loadPrinterDetails(contratId: number): void {
    this.loadingImprimantes = true;
    this.imprimanteService.getAllByContrat(contratId).subscribe({
      next: (data) => {
        this.imprimantes = data;
        this.loadingImprimantes = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des imprimantes:', error);
        this.loadingImprimantes = false;
      }
    });
  }
  
  updateActionPermissions(): void {
    if (!this.ticket) return;
    
    const status = this.ticket.statut!;
    
    // Check permissions based on status
    this.canStart = status === StatutIntervention.PLANIFIEE || status === StatutIntervention.EN_ATTENTE;
    this.canPause = status === StatutIntervention.EN_COURS;
    this.canResume = status === StatutIntervention.EN_PAUSE;
    this.canComplete = status === StatutIntervention.EN_COURS;
    this.canCancel = status !== StatutIntervention.TERMINEE && status !== StatutIntervention.ANNULEE;
    this.canDiagnose = status === StatutIntervention.EN_COURS;
    this.canAddSolution = status === StatutIntervention.EN_COURS;
  }
  
  // ============= Action Methods =============
  
  startTicket(): void {
    if (!this.ticket) return;
    
    this.interventionService.demarrerIntervention(this.ticketId, this.currentUserId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du démarrage du ticket: ' + error.message;
      }
    });
  }
  
  pauseTicket(): void {
    if (!this.ticket) return;
    
    // Get reason from form
    const reason = this.pauseForm.get('raison')?.value;
    
    this.interventionService.mettreEnPauseIntervention(this.ticketId, this.currentUserId, reason).subscribe({
      next: (data) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
        this.modalService.dismissAll(); // Close modal
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la mise en pause du ticket: ' + error.message;
      }
    });
  }
  
  resumeTicket(): void {
    if (!this.ticket) return;
    
    this.interventionService.reprendreIntervention(this.ticketId, this.currentUserId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la reprise du ticket: ' + error.message;
      }
    });
  }
  
  completeTicket(): void {
    if (!this.ticket) return;
    
    this.interventionService.terminerIntervention(this.ticketId, this.currentUserId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la finalisation du ticket: ' + error.message;
      }
    });
  }
  
  cancelTicket(): void {
    if (!this.ticket) return;
    
    // Get reason from form
    const reason = this.cancelForm.get('raison')?.value;
    
    this.interventionService.annulerIntervention(this.ticketId, this.currentUserId, reason).subscribe({
      next: (data) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
        this.modalService.dismissAll(); // Close modal
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de l\'annulation du ticket: ' + error.message;
      }
    });
  }
  
  submitDiagnostic(): void {
    if (!this.ticket || this.diagnosticForm.invalid) return;
    
    const { diagnosticTechnique, symptomesDetailles } = this.diagnosticForm.value;
    
    this.interventionService.enregistrerDiagnostic(
      this.ticketId, 
      this.currentUserId, 
      diagnosticTechnique, 
      symptomesDetailles
    ).subscribe({
      next: (data: any) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
        this.modalService.dismissAll(); // Close modal
      },
      error: (error: any) => {
        this.errorMessage = 'Erreur lors de l\'ajout du diagnostic: ' + error.message;
      }
    });
  }
  
  submitSolution(): void {
    if (!this.ticket || this.solutionForm.invalid) return;
    
    const { solutionTechnique, coutIntervention, commentaireInterne } = this.solutionForm.value;
    
    this.interventionService.enregistrerSolution(
      this.ticketId, 
      this.currentUserId, 
      solutionTechnique, 
      coutIntervention,
      commentaireInterne
    ).subscribe({
      next: (data: any) => {
        this.ticket = data;
        this.updateActionPermissions();
        this.loadTicketHistory();
        this.modalService.dismissAll(); // Close modal
      },
      error: (error: any) => {
        this.errorMessage = 'Erreur lors de l\'ajout de la solution: ' + error.message;
      }
    });
  }
  
  // ============= Helper Methods =============
  
  /**
   * Get the appropriate icon class for a ticket status
   */
  getStatusIcon(status: string | undefined): string {
    if (!status) return 'bi bi-question-circle-fill';
    
    const iconMap: {[key: string]: string} = {
      'EN_ATTENTE': 'bi bi-clock-fill',
      'PLANIFIEE': 'bi bi-calendar-check-fill',
      'EN_COURS': 'bi bi-play-circle-fill',
      'EN_PAUSE': 'bi bi-pause-circle-fill',
      'TERMINEE': 'bi bi-check-circle-fill',
      'ANNULEE': 'bi bi-x-circle-fill',
      'REPORTEE': 'bi bi-arrow-clockwise',
      'REJETEE': 'bi bi-x-octagon-fill',
      'ATTENTE_PIECES': 'bi bi-box-fill',
      'ATTENTE_CLIENT': 'bi bi-person-fill-exclamation'
    };
    
    return iconMap[status] || 'bi bi-question-circle-fill';
  }
  
  openModal(content: any): void {
    this.modalService.open(content, { centered: true });
  }
  
  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
    return this.statutLabels[status as keyof typeof this.statutLabels] || status;
  }
  
  // Printer status helpers
  getPrinterStatusBadgeClass(printer: Imprimante): string {
    if (!printer) return 'bg-secondary';
    
    // We don't have the status directly in the Imprimante interface,
    // but we can determine it based on the current ticket
    if (this.ticket && this.ticket.imprimanteId === printer.id) {
      // If this is the printer in the current ticket, it's being serviced
      return 'bg-warning';
    }
    
    // Default for other printers (assuming they're active)
    return 'bg-success';
  }

  getPrinterStatusIcon(printer: Imprimante): string {
    if (!printer) return 'bi-question-circle';
    
    if (this.ticket && this.ticket.imprimanteId === printer.id) {
      // If this is the printer in the current ticket
      return 'bi-tools';
    }
    
    // Default for other printers
    return 'bi-check-circle';
  }

  getPrinterStatusLabel(printer: Imprimante): string {
    if (!printer) return 'Inconnu';
    
    if (this.ticket && this.ticket.imprimanteId === printer.id) {
      // If this is the printer in the current ticket
      return 'En maintenance';
    }
    
    // Default for other printers
    return 'Actif';
  }

  getCurrentPrinterInfo(): string {
    if (!this.ticket || !this.ticket.imprimanteId) {
      return 'Aucune imprimante associée';
    }
    
    const printer = this.imprimantes.find(p => p.id === this.ticket!.imprimanteId);
    if (!printer) {
      return `Imprimante ID: ${this.ticket.imprimanteId} (détails non disponibles)`;
    }
    
    return `${printer.marque} ${printer.modele} (${printer.numeroSerie})`;
  }
  
  getStatusClass(status: string | undefined): string {
    if (!status) return 'secondary';
    
    const classMap: {[key: string]: string} = {
      'EN_ATTENTE': 'warning',
      'PLANIFIEE': 'info',
      'EN_COURS': 'primary',
      'EN_PAUSE': 'warning',
      'TERMINEE': 'success',
      'ANNULEE': 'danger',
      'REPORTEE': 'secondary',
      'REJETEE': 'danger',
      'ATTENTE_PIECES': 'warning',
      'ATTENTE_CLIENT': 'warning'
    };
    
    return classMap[status] || 'secondary';
  }
  
  goBack(): void {
    window.history.back();
  }
}
