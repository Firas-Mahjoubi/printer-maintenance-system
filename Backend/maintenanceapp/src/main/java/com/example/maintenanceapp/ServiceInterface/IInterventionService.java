package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Dto.InterventionCreateDTO;
import com.example.maintenanceapp.Dto.InterventionDTO;
import com.example.maintenanceapp.Dto.InterventionUpdateDTO;
import com.example.maintenanceapp.Dto.InterventionHistoriqueDTO;
import com.example.maintenanceapp.Entity.Intervention;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface IInterventionService {
    
    // ====================== MÉTHODES DTO ======================
    // Nouvelles méthodes qui retournent des DTOs pour l'API REST
    InterventionDTO creerIntervention(InterventionCreateDTO createDTO);
    InterventionDTO creerInterventionMultipleImprimantes(InterventionCreateDTO createDTO);
    List<InterventionDTO> creerInterventionsParImprimante(InterventionCreateDTO createDTO);
    InterventionDTO obtenirInterventionParId(Long id);
    InterventionDTO obtenirInterventionParNumero(String numero);
    InterventionDTO mettreAJourIntervention(Long id, InterventionUpdateDTO updateDTO);
    void supprimerIntervention(Long id);
    
    Page<InterventionDTO> obtenirInterventionsFiltrees(
        StatutIntervention statut, TypeIntervention type, PrioriteIntervention priorite,
        Long technicienId, Long demandeurId, Long contratId,
        LocalDate dateDebut, LocalDate dateFin, Pageable pageable);
    
    List<InterventionDTO> obtenirInterventionsParTechnicien(Long technicienId, StatutIntervention statut);
    List<InterventionDTO> obtenirInterventionsUrgentes();
    List<InterventionDTO> obtenirInterventionsEnRetard();
    Map<String, Object> obtenirStatistiques(LocalDate dateDebut, LocalDate dateFin);
    
    // Gestion du cycle de vie avec DTOs
    InterventionDTO assignerTechnicien(Long interventionId, Long technicienId, Long assignateurId);
    InterventionDTO demarrerIntervention(Long interventionId, Long technicienId);
    InterventionDTO mettreEnPause(Long interventionId, Long technicienId, String raisonPause);
    InterventionDTO reprendreIntervention(Long interventionId, Long technicienId);
    InterventionDTO cloturerIntervention(Long interventionId, Long technicienId, String solution, String commentaireInterne);
    InterventionDTO rouvrirIntervention(Long interventionId, Long utilisateurId, String raison);
    InterventionDTO annulerIntervention(Long interventionId, Long utilisateurId, String raisonAnnulation);
    InterventionDTO enregistrerSatisfactionClient(Long interventionId, Integer noteSatisfaction, String commentaireSatisfaction);
    
    // Historique des actions
    List<InterventionHistoriqueDTO> obtenirHistoriqueIntervention(Long interventionId);
    List<InterventionDTO> obtenirHistoriqueInterventionsImprimante(Long imprimanteId);
    Map<String, Object> obtenirStatistiquesImprimante(Long imprimanteId);
    
    // ====================== MÉTHODES ENTITÉ (existantes) ======================
    // CRUD Operations
    List<Intervention> findAll();
    Intervention findById(Long id);
    Intervention save(Intervention intervention, Long demandeurId);
    Intervention update(Long id, Intervention intervention, Long modificateurId);
    void delete(Long id);
    
    // Ticket Management
    Intervention creerTicket(Intervention intervention, Long demandeurId, Long contratId, Long imprimanteId);
    Intervention assignerTechnicien(Long interventionId, Long technicienId);
    Intervention changerStatut(Long interventionId, StatutIntervention nouveauStatut, Long utilisateurId);
    Intervention planifierIntervention(Long interventionId, LocalDateTime datePlanifiee, Long technicienId);
    Intervention commencerIntervention(Long interventionId, Long technicienId);
    Intervention terminerIntervention(Long interventionId, String diagnostic, String solution, 
                                     String observations, Double coutReel, Long technicienId);
    Intervention annulerIntervention(Long interventionId, String raison, Long utilisateurId);
    
    // Search and Filter
    List<Intervention> findByStatut(StatutIntervention statut);
    List<Intervention> findByType(TypeIntervention type);
    List<Intervention> findByPriorite(PrioriteIntervention priorite);
    List<Intervention> findByTechnicien(Long technicienId);
    List<Intervention> findByDemandeur(Long demandeurId);
    List<Intervention> findByContrat(Long contratId);
    List<Intervention> findByImprimante(Long imprimanteId);
    List<Intervention> rechercherInterventions(String recherche);
    
    // Dashboard and Statistics
    List<Intervention> getInterventionsUrgentes();
    List<Intervention> getInterventionsEnRetard();
    List<Intervention> getInterventionsPlanifiees(LocalDateTime dateDebut, LocalDateTime dateFin);
    List<Intervention> getInterventionsEnCours(Long technicienId);
    Map<StatutIntervention, Long> getStatistiquesParStatut();
    Map<TypeIntervention, Long> getStatistiquesParType();
    Map<PrioriteIntervention, Long> getStatistiquesParPriorite();
    
    // Utility
    String genererNumeroTicket();
    Double calculerCoutMoyenParType(TypeIntervention type);
    List<Intervention> getHistoriqueIntervention(Long imprimanteId);
    
    // Notifications
    void envoyerNotificationNouveauTicket(Intervention intervention);
    void envoyerNotificationAssignation(Intervention intervention);
    void envoyerNotificationChangementStatut(Intervention intervention);
    
    // Satisfaction Client
    Intervention evaluerSatisfaction(Long interventionId, Integer note, String commentaire);
    
    /**
     * Obtenir tous les IDs de contrats qui ont des interventions actives
     * @return Liste des IDs des contrats avec des interventions actives
     */
    List<Long> obtenirContratIdsAvecInterventionsActives();
    
    /**
     * Vérifier si un contrat a des interventions actives
     * @param contratId ID du contrat à vérifier
     * @return true si le contrat a au moins une intervention active, false sinon
     */
    boolean hasActiveInterventionsForContract(Long contratId);
    
    /**
     * Obtenir les interventions actives pour un contrat
     * @param contratId ID du contrat
     * @return Liste des interventions actives
     */
    List<InterventionDTO> obtenirInterventionsActivesPourContrat(Long contratId);
}
