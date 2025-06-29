import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  InterventionService, 
  InterventionDTO, 
  InterventionHistoriqueDTO,
  StatutIntervention, 
  TypeIntervention, 
  PrioriteIntervention 
} from '../../service/intervention.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-ticket-details',
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.css']
})
export class TicketDetailsComponent implements OnInit {
  ticket: InterventionDTO | null = null;
  ticketHistory: InterventionHistoriqueDTO[] = [];
  loading = false;
  error = '';
  isEditing = false;
  canEdit = false;
  canAssign = false;
  
  // Enums pour le template
  StatutIntervention = StatutIntervention;
  TypeIntervention = TypeIntervention;
  PrioriteIntervention = PrioriteIntervention;
  
  // Options pour les badges de couleur
  statutClasses = {
    [StatutIntervention.EN_ATTENTE]: 'bg-warning',
    [StatutIntervention.PLANIFIEE]: 'bg-info', 
    [StatutIntervention.EN_COURS]: 'bg-primary',
    [StatutIntervention.EN_PAUSE]: 'bg-secondary',
    [StatutIntervention.TERMINEE]: 'bg-success',
    [StatutIntervention.ANNULEE]: 'bg-danger',
    [StatutIntervention.REPORTEE]: 'bg-warning',
    [StatutIntervention.REJETEE]: 'bg-danger',
    [StatutIntervention.ATTENTE_PIECES]: 'bg-secondary', // Temporary pause status
    [StatutIntervention.ATTENTE_CLIENT]: 'bg-info'
  };
  
  prioriteClasses = {
    [PrioriteIntervention.BASSE]: 'bg-success',
    [PrioriteIntervention.NORMALE]: 'bg-info',
    [PrioriteIntervention.HAUTE]: 'bg-warning', 
    [PrioriteIntervention.CRITIQUE]: 'bg-danger'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interventionService: InterventionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicketDetails(+ticketId);
    } else {
      this.error = 'ID du ticket non fourni';
    }
    
    this.checkPermissions();
  }

  private loadTicketDetails(id: number): void {
    this.loading = true;
    this.error = '';
    
    // Charger les détails du ticket et l'historique en parallèle
    Promise.all([
      this.interventionService.obtenirTicketParId(id).toPromise(),
      this.interventionService.obtenirHistoriqueTicket(id).toPromise()
    ]).then(([ticket, history]) => {
      this.ticket = ticket || null;
      this.ticketHistory = history || [];
      this.loading = false;
      console.log('Détails du ticket chargés:', ticket);
      console.log('Historique du ticket chargé:', history);
    }).catch((error) => {
      console.error('Erreur lors du chargement du ticket:', error);
      this.error = 'Impossible de charger les détails du ticket';
      this.loading = false;
    });
  }

  private checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Un utilisateur peut éditer ses propres tickets ou si c'est un admin
      this.canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'TECHNICIEN';
      this.canAssign = currentUser.role === 'ADMIN';
    }
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  editTicket(): void {
    if (this.ticket) {
      this.router.navigate(['/tickets/edit', this.ticket.id]);
    }
  }

  startTicket(): void {
    if (this.ticket && this.ticket.id) {
      const currentUserId = this.authService.getCurrentUserId();
      if (currentUserId) {
        this.loading = true;
        this.interventionService.demarrerTicket(this.ticket.id, currentUserId).subscribe({
          next: (updatedTicket: InterventionDTO) => {
            this.ticket = updatedTicket;
            // Recharger les détails complets après un petit délai pour avoir la chronologie mise à jour
            setTimeout(() => {
              this.loadTicketDetails(this.ticket!.id!);
            }, 500);
            console.log('Ticket démarré avec succès');
          },
          error: (error: any) => {
            console.error('Erreur lors du démarrage du ticket:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  pauseTicket(): void {
    if (this.ticket && this.ticket.id) {
      const currentUserId = this.authService.getCurrentUserId();
      const raisonPause = 'Pause demandée par le technicien';
      if (currentUserId) {
        this.loading = true;
        this.interventionService.mettreEnPauseTicket(this.ticket.id, currentUserId, raisonPause).subscribe({
          next: (updatedTicket: InterventionDTO) => {
            this.ticket = updatedTicket;
            // Recharger les détails complets après un petit délai pour avoir la chronologie mise à jour
            setTimeout(() => {
              this.loadTicketDetails(this.ticket!.id!);
            }, 500);
            console.log('Ticket mis en pause avec succès');
          },
          error: (error: any) => {
            console.error('Erreur lors de la pause du ticket:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  resumeTicket(): void {
    if (this.ticket && this.ticket.id) {
      const currentUserId = this.authService.getCurrentUserId();
      if (currentUserId) {
        this.loading = true;
        this.interventionService.reprendreTicket(this.ticket.id, currentUserId).subscribe({
          next: (updatedTicket: InterventionDTO) => {
            this.ticket = updatedTicket;
            // Recharger les détails complets après un petit délai pour avoir la chronologie mise à jour
            setTimeout(() => {
              this.loadTicketDetails(this.ticket!.id!);
            }, 500);
            console.log('Ticket repris avec succès');
          },
          error: (error: any) => {
            console.error('Erreur lors de la reprise du ticket:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  completeTicket(): void {
    if (this.ticket && this.ticket.id) {
      const currentUserId = this.authService.getCurrentUserId();
      const solution = 'Intervention terminée';
      if (currentUserId) {
        this.loading = true;
        this.interventionService.cloturerTicket(this.ticket.id, currentUserId, solution).subscribe({
          next: (updatedTicket: InterventionDTO) => {
            this.ticket = updatedTicket;
            // Recharger les détails complets après un petit délai pour avoir la chronologie mise à jour
            setTimeout(() => {
              this.loadTicketDetails(this.ticket!.id!);
            }, 500);
            console.log('Ticket clôturé avec succès');
          },
          error: (error: any) => {
            console.error('Erreur lors de la clôture du ticket:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  getStatutClass(statut: StatutIntervention): string {
    return this.statutClasses[statut] || 'bg-secondary';
  }

  getPrioriteClass(priorite: PrioriteIntervention): string {
    return this.prioriteClasses[priorite] || 'bg-info';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Non définie';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canStartTicket(): boolean {
    return this.ticket?.statut === StatutIntervention.PLANIFIEE || 
           this.ticket?.statut === StatutIntervention.EN_ATTENTE;
  }

  canPauseTicket(): boolean {
    return this.ticket?.statut === StatutIntervention.EN_COURS;
  }

  canResumeTicket(): boolean {
    return this.ticket?.statut === StatutIntervention.EN_PAUSE;
  }

  /**
   * Checks if a ticket is actually paused by looking for [PAUSED] marker in observations
   */
  isTicketPaused(): boolean {
    return this.ticket?.statut === StatutIntervention.EN_PAUSE;
  }

  canCompleteTicket(): boolean {
    return this.ticket?.statut === StatutIntervention.EN_COURS ||
           this.ticket?.statut === StatutIntervention.EN_PAUSE;
  }

  /**
   * Obtient l'historique des actions du ticket formaté pour l'affichage
   */
  getTicketHistory(): any[] {
    if (!this.ticketHistory) {
      return [];
    }

    return this.ticketHistory.map(historyItem => {
      let icon = 'fas fa-info-circle';
      let color = 'secondary';

      // Détermine l'icône et la couleur selon l'action
      switch (historyItem.action.toLowerCase()) {
        case 'création du ticket':
        case 'création':
          icon = 'fas fa-plus';
          color = 'primary';
          break;
        case 'assignation':
        case 'assignation technicien':
          icon = 'fas fa-user';
          color = 'info';
          break;
        case 'planification':
        case 'intervention planifiée':
          icon = 'fas fa-calendar';
          color = 'info';
          break;
        case 'démarrage de l\'intervention':
        case 'intervention démarrée':
          icon = 'fas fa-play';
          color = 'success';
          break;
        case 'mise en pause':
        case 'intervention mise en pause':
          icon = 'fas fa-pause';
          color = 'warning';
          break;
        case 'reprise de l\'intervention':
        case 'intervention reprise':
          icon = 'fas fa-play';
          color = 'success';
          break;
        case 'clôture de l\'intervention':
        case 'intervention terminée':
          icon = 'fas fa-check';
          color = 'success';
          break;
        case 'annulation':
          icon = 'fas fa-times';
          color = 'danger';
          break;
        default:
          icon = 'fas fa-edit';
          color = 'secondary';
      }

      return {
        action: historyItem.action,
        date: historyItem.dateAction,
        icon: icon,
        color: color,
        user: historyItem.utilisateurNom || 'Système',
        comment: historyItem.commentaire
      };
    });
  }
}
