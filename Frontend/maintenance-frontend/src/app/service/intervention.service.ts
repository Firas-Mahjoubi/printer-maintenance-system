import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImprimanteDTO {
  id: number;
  marque?: string;
  modele: string;
  emplacement?: string;
  numeroSerie?: string;
  contratId?: number;
}

export interface InterventionDTO {
  id?: number;
  numero?: string;
  titre: string;
  description: string;
  type: TypeIntervention;
  priorite: PrioriteIntervention;
  statut?: StatutIntervention;
  dateCreation?: Date;
  datePlanifiee?: Date;
  dateDebut?: Date;
  dateFin?: Date;
  dateModification?: Date;
  diagnostic?: string;
  solution?: string;
  commentaireInterne?: string;
  raisonAnnulation?: string;
  noteSatisfaction?: number;
  commentaireSatisfaction?: string;
  contratId: number;
  contratNumero?: string;
  imprimanteId?: number;
  imprimanteModele?: string;
  demandeurId: number;
  demandeurNom?: string;
  technicienId?: number;
  technicienNom?: string;
  modificateurId?: number;
  modificateurNom?: string;
  imprimantesAssociees?: ImprimanteDTO[];
}

export interface InterventionCreateDTO {
  titre: string;
  description: string;
  type: TypeIntervention;
  priorite: PrioriteIntervention;
  datePlanifiee?: Date;
  contratId: number;
  imprimanteId?: number;
  imprimanteIds?: number[];
  demandeurId: number;
  technicienId?: number;
}

export interface InterventionUpdateDTO {
  titre?: string;
  description?: string;
  type?: TypeIntervention;
  priorite?: PrioriteIntervention;
  statut?: StatutIntervention;
  datePlanifiee?: Date;
  diagnostic?: string;
  solution?: string;
  commentaireInterne?: string;
  contratId?: number;
  imprimanteId?: number;
  technicienId?: number;
}

export interface InterventionHistoriqueDTO {
  id: number;
  ancienStatut: StatutIntervention | null;
  nouveauStatut: StatutIntervention;
  action: string;
  commentaire?: string;
  utilisateurId?: number;
  utilisateurNom?: string;
  dateAction: Date;
}

export enum TypeIntervention {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  URGENTE = 'URGENTE',
  INSTALLATION = 'INSTALLATION',
  MISE_A_JOUR = 'MISE_A_JOUR',
  DIAGNOSTIC = 'DIAGNOSTIC',
  FORMATION = 'FORMATION',
  NETTOYAGE = 'NETTOYAGE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum PrioriteIntervention {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}

export enum StatutIntervention {
  EN_ATTENTE = 'EN_ATTENTE',
  PLANIFIEE = 'PLANIFIEE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
  REPORTEE = 'REPORTEE',
  REJETEE = 'REJETEE',
  ATTENTE_PIECES = 'ATTENTE_PIECES',
  ATTENTE_CLIENT = 'ATTENTE_CLIENT'
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InterventionService {
  private apiUrl = 'http://localhost:8081/api/interventions';

  constructor(private http: HttpClient) { }

  // ====================== GESTION DES TICKETS ======================

  /**
   * Créer un nouveau ticket de maintenance
   */
  creerTicket(intervention: InterventionCreateDTO): Observable<InterventionDTO> {
    return this.http.post<InterventionDTO>(this.apiUrl, intervention);
  }
  
  /**
   * Créer un ticket de maintenance pour plusieurs imprimantes
   */
  creerTicketMultiImprimantes(intervention: InterventionCreateDTO): Observable<InterventionDTO> {
    // Utilise le même endpoint qui détecte automatiquement les imprimanteIds
    return this.http.post<InterventionDTO>(this.apiUrl, intervention);
  }
  
  /**
   * Créer plusieurs tickets de maintenance, un pour chaque imprimante
   */
  creerTicketsParImprimante(intervention: InterventionCreateDTO): Observable<InterventionDTO[]> {
    return this.http.post<InterventionDTO[]>(`${this.apiUrl}/multi-printer`, intervention);
  }

  /**
   * Obtenir tous les tickets avec pagination et filtres
   */
  obtenirTickets(
    statut?: StatutIntervention,
    type?: TypeIntervention,
    priorite?: PrioriteIntervention,
    technicienId?: number,
    demandeurId?: number,
    contratId?: number,
    dateDebut?: string,
    dateFin?: string,
    page = 0,
    size = 20
  ): Observable<PageResponse<InterventionDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (statut) params = params.set('statut', statut);
    if (type) params = params.set('type', type);
    if (priorite) params = params.set('priorite', priorite);
    if (technicienId) params = params.set('technicienId', technicienId.toString());
    if (demandeurId) params = params.set('demandeurId', demandeurId.toString());
    if (contratId) params = params.set('contratId', contratId.toString());
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    return this.http.get<PageResponse<InterventionDTO>>(this.apiUrl, { params });
  }

  /**
   * Obtenir un ticket par son ID
   */
  obtenirTicketParId(id: number): Observable<InterventionDTO> {
    return this.http.get<InterventionDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtenir un ticket par son numéro
   */
  obtenirTicketParNumero(numero: string): Observable<InterventionDTO> {
    return this.http.get<InterventionDTO>(`${this.apiUrl}/numero/${numero}`);
  }

  /**
   * Obtenir l'historique des actions d'un ticket
   */
  obtenirHistoriqueTicket(id: number): Observable<InterventionHistoriqueDTO[]> {
    return this.http.get<InterventionHistoriqueDTO[]>(`${this.apiUrl}/${id}/historique`);
  }

  /**
   * Mettre à jour un ticket
   */
  mettreAJourTicket(id: number, intervention: InterventionUpdateDTO): Observable<InterventionDTO> {
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}`, intervention);
  }

  /**
   * Supprimer un ticket
   */
  supprimerTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ====================== GESTION DU CYCLE DE VIE ======================

  /**
   * Assigner un technicien à un ticket
   */
  assignerTechnicien(id: number, technicienId: number, assignateurId: number): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('technicienId', technicienId.toString())
      .set('assignateurId', assignateurId.toString());
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/assigner`, null, { params });
  }

  /**
   * Planifier un ticket
   */
  planifierTicket(id: number, datePlanifiee: string, planificateurId: number): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('datePlanifiee', datePlanifiee)
      .set('planificateurId', planificateurId.toString());
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/planifier`, null, { params });
  }

  /**
   * Démarrer un ticket
   */
  demarrerTicket(id: number, technicienId: number): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('technicienId', technicienId.toString());
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/demarrer`, null, { params });
  }

  /**
   * Mettre en pause un ticket
   */
  mettreEnPauseTicket(id: number, technicienId: number, raisonPause: string): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('technicienId', technicienId.toString())
      .set('raisonPause', raisonPause);
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/pause`, null, { params });
  }

  /**
   * Reprendre un ticket en pause
   */
  reprendreTicket(id: number, technicienId: number): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('technicienId', technicienId.toString());
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/reprendre`, null, { params });
  }

  /**
   * Clôturer un ticket
   */
  cloturerTicket(id: number, technicienId: number, solution: string, commentaireInterne?: string): Observable<InterventionDTO> {
    let params = new HttpParams()
      .set('technicienId', technicienId.toString())
      .set('solution', solution);
    
    if (commentaireInterne) {
      params = params.set('commentaireInterne', commentaireInterne);
    }
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/cloturer`, null, { params });
  }

  /**
   * Terminer un ticket (marquer comme terminé avec diagnostic et solution)
   */
  terminerTicket(
    id: number, 
    diagnostic: string, 
    solution: string, 
    observations?: string, 
    coutReel?: number, 
    technicienId?: number
  ): Observable<InterventionDTO> {
    let params = new HttpParams()
      .set('diagnostic', diagnostic)
      .set('solution', solution);
    
    if (observations) {
      params = params.set('observations', observations);
    }
    if (coutReel) {
      params = params.set('coutReel', coutReel.toString());
    }
    if (technicienId) {
      params = params.set('technicienId', technicienId.toString());
    }
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/terminer`, null, { params });
  }

  /**
   * Rouvrir un ticket clôturé
   */
  rouvrirTicket(id: number, utilisateurId: number, raison: string): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('utilisateurId', utilisateurId.toString())
      .set('raison', raison);
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/rouvrir`, null, { params });
  }

  /**
   * Annuler un ticket
   */
  annulerTicket(id: number, utilisateurId: number, raisonAnnulation: string): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('utilisateurId', utilisateurId.toString())
      .set('raisonAnnulation', raisonAnnulation);
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${id}/annuler`, null, { params });
  }

  // ====================== STATISTIQUES ET RAPPORTS ======================

  /**
   * Obtenir les statistiques des tickets
   */
  obtenirStatistiques(dateDebut?: string, dateFin?: string): Observable<any> {
    let params = new HttpParams();
    
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);
    
    return this.http.get<any>(`${this.apiUrl}/statistiques`, { params });
  }

  /**
   * Obtenir les tickets par technicien
   */
  obtenirTicketsParTechnicien(technicienId: number, statut?: StatutIntervention): Observable<InterventionDTO[]> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    
    return this.http.get<InterventionDTO[]>(`${this.apiUrl}/technicien/${technicienId}`, { params });
  }

  /**
   * Obtenir les tickets urgents
   */
  obtenirTicketsUrgents(): Observable<InterventionDTO[]> {
    return this.http.get<InterventionDTO[]>(`${this.apiUrl}/urgents`);
  }

  /**
   * Obtenir les tickets en retard
   */
  obtenirTicketsEnRetard(): Observable<InterventionDTO[]> {
    return this.http.get<InterventionDTO[]>(`${this.apiUrl}/retard`);
  }

  // ====================== UTILITAIRES ======================

  /**
   * Obtenir le libellé d'un statut
   */
  getStatutLabel(statut: StatutIntervention): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'EN_PAUSE': 'En pause',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée',
      'REPORTEE': 'Reportée'
    };
    return labels[statut] || statut;
  }

  /**
   * Obtenir le libellé d'une priorité
   */
  getPrioriteLabel(priorite: PrioriteIntervention): string {
    const labels: { [key: string]: string } = {
      'BASSE': 'Basse',
      'NORMALE': 'Normale',
      'HAUTE': 'Haute',
      'CRITIQUE': 'Critique'
    };
    return labels[priorite] || priorite;
  }

  /**
   * Obtenir le libellé d'un type
   */
  getTypeLabel(type: TypeIntervention): string {
    const labels: { [key: string]: string } = {
      'PREVENTIVE': 'Préventive',
      'CORRECTIVE': 'Corrective',
      'URGENTE': 'Urgente',
      'INSTALLATION': 'Installation',
      'MAINTENANCE': 'Maintenance',
      'FORMATION': 'Formation'
    };
    return labels[type] || type;
  }

  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatutClass(statut: StatutIntervention): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'warning',
      'PLANIFIEE': 'info',
      'EN_COURS': 'primary',
      'EN_PAUSE': 'warning',
      'TERMINEE': 'success',
      'ANNULEE': 'danger',
      'REPORTEE': 'secondary'
    };
    return classes[statut] || 'secondary';
  }

  /**
   * Obtenir la classe CSS pour la priorité
   */
  getPrioriteClass(priorite: PrioriteIntervention): string {
    const classes: { [key: string]: string } = {
      'BASSE': 'success',
      'NORMALE': 'info',
      'HAUTE': 'warning',
      'CRITIQUE': 'danger'
    };
    return classes[priorite] || 'secondary';
  }

  // ====================== HISTORIQUE DES IMPRIMANTES ======================

  /**
   * Obtenir l'historique des interventions pour une imprimante
   */
  obtenirHistoriqueImprimante(imprimanteId: number): Observable<InterventionDTO[]> {
    return this.http.get<InterventionDTO[]>(`${this.apiUrl}/imprimante/${imprimanteId}/historique`);
  }

  /**
   * Obtenir les statistiques pour une imprimante
   */
  obtenirStatistiquesImprimante(imprimanteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/imprimante/${imprimanteId}/statistiques`);
  }

  /**
   * Vérifier si un contrat a des interventions actives
   * Cette méthode est utilisée pour déterminer si un contrat a des tickets de maintenance en cours
   */
  verifierInterventionsActivesPourContrat(contratId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/contrat/${contratId}/hasActiveInterventions`);
  }
  
  /**
   * Obtenir les interventions actives pour un contrat
   */
  obtenirInterventionsActivesPourContrat(contratId: number): Observable<InterventionDTO[]> {
    const params = new HttpParams()
      .set('contratId', contratId.toString())
      .set('statut', [
        StatutIntervention.EN_ATTENTE, 
        StatutIntervention.PLANIFIEE, 
        StatutIntervention.EN_COURS,
        StatutIntervention.EN_PAUSE,
        StatutIntervention.ATTENTE_PIECES,
        StatutIntervention.ATTENTE_CLIENT
      ].join(','));
    
    return this.http.get<InterventionDTO[]>(`${this.apiUrl}/contrat/${contratId}/active`);
  }

  /**
   * Obtenir tous les IDs de contrats qui ont des interventions actives
   * Cette méthode est beaucoup plus efficace que de vérifier chaque contrat individuellement
   */
  obtenirContratsAvecInterventionsActives(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/contrats-avec-interventions-actives`);
  }

  /**
   * Récupérer un ticket par son ID
   */
  getInterventionById(id: number): Observable<InterventionDTO> {
    return this.http.get<InterventionDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Enregistrer le diagnostic technique d'une intervention
   */
  enregistrerDiagnostic(
    interventionId: number, 
    technicienId: number, 
    diagnosticTechnique: string, 
    symptomesDetailles: string
  ): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('technicienId', technicienId.toString())
      .set('diagnosticTechnique', diagnosticTechnique)
      .set('symptomesDetailles', symptomesDetailles);
      
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/diagnostic`, null, { params });
  }

  /**
   * Enregistrer la solution technique et le coût d'une intervention
   * Note: This is a workaround using the update endpoint until the backend implements /solution endpoint
   */
  enregistrerSolution(
    interventionId: number, 
    technicienId: number, 
    solutionTechnique: string, 
    coutIntervention: number,
    commentaireInterne?: string
  ): Observable<InterventionDTO> {
    // Use the general update endpoint as a workaround
    const updateData = {
      solution: solutionTechnique,
      coutIntervention: coutIntervention,
      commentaireInterne: commentaireInterne
    };
    
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}`, updateData);
  }
  
  /**
   * Démarrer une intervention (change le statut à EN_COURS)
   */
  demarrerIntervention(interventionId: number, technicienId: number): Observable<InterventionDTO> {
    const params = new HttpParams().set('technicienId', technicienId.toString());
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/demarrer`, null, { params });
  }
  
  /**
   * Mettre en pause une intervention (change le statut à EN_PAUSE)
   */
  mettreEnPauseIntervention(interventionId: number, technicienId: number, raison: string): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('technicienId', technicienId.toString())
      .set('raisonPause', raison);
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/pause`, null, { params });
  }
  
  /**
   * Reprendre une intervention (change le statut à EN_COURS)
   */
  reprendreIntervention(interventionId: number, technicienId: number): Observable<InterventionDTO> {
    const params = new HttpParams().set('technicienId', technicienId.toString());
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/reprendre`, null, { params });
  }
  
  /**
   * Terminer une intervention (change le statut à TERMINEE)
   */
  terminerIntervention(interventionId: number, technicienId: number): Observable<InterventionDTO> {
    const params = new HttpParams().set('technicienId', technicienId.toString());
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/terminer`, null, { params });
  }
  
  /**
   * Annuler une intervention (change le statut à ANNULEE)
   */
  annulerIntervention(interventionId: number, technicienId: number, raison: string): Observable<InterventionDTO> {
    const params = new HttpParams()
      .set('utilisateurId', technicienId.toString())
      .set('raisonAnnulation', raison);
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/annuler`, null, { params });
  }
  
  /**
   * Enregistrer la satisfaction client
   */
  enregistrerSatisfaction(
    interventionId: number, 
    clientId: number, 
    noteSatisfaction: number, 
    commentaireSatisfaction?: string
  ): Observable<InterventionDTO> {
    let params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('noteSatisfaction', noteSatisfaction.toString());
      
    if (commentaireSatisfaction) {
      params = params.set('commentaireSatisfaction', commentaireSatisfaction);
    }
      
    return this.http.put<InterventionDTO>(`${this.apiUrl}/${interventionId}/satisfaction`, null, { params });
  }
}
