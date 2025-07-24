package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Intervention;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterventionRepositorie extends JpaRepository<Intervention, Long> {
    
    // Recherche par numéro de ticket
    Optional<Intervention> findByNumeroTicket(String numeroTicket);
    
    // Recherche par statut
    List<Intervention> findByStatutInterventionOrderByDateCreationDesc(StatutIntervention statut);
    
    // Recherche par type d'intervention
    List<Intervention> findByTypeInterventionOrderByDateCreationDesc(TypeIntervention type);
    
    // Recherche par priorité
    List<Intervention> findByPrioriteOrderByDateCreationDesc(PrioriteIntervention priorite);
    
    // Recherche par type et statut d'intervention
    Page<Intervention> findByTypeInterventionAndStatutInterventionOrderByDatePlanifieeDesc(
        TypeIntervention type, StatutIntervention statut, Pageable pageable);
    
    // Recherche par technicien assigné
    List<Intervention> findByTechnicien_IdOrderByDateCreationDesc(Long technicienId);
    
    // Recherche par demandeur
    List<Intervention> findByDemandeur_IdOrderByDateCreationDesc(Long demandeurId);
    
    // Recherche par contrat
    List<Intervention> findByContrat_IdOrderByDateCreationDesc(Long contratId);
    
    // Recherche par imprimante
    List<Intervention> findByImprimante_IdOrderByDateCreationDesc(Long imprimanteId);
    
    // Interventions en cours pour un technicien
    List<Intervention> findByTechnicien_IdAndStatutInterventionInOrderByPrioriteDesc(
        Long technicienId, List<StatutIntervention> statuts);
    
    // Interventions urgentes
    @Query("SELECT i FROM Intervention i WHERE i.priorite IN ('CRITIQUE', 'HAUTE') " +
           "AND i.statutIntervention IN ('EN_ATTENTE', 'PLANIFIEE', 'EN_COURS') " +
           "ORDER BY i.priorite DESC, i.dateCreation ASC")
    List<Intervention> findInterventionsUrgentes();
    
    // Interventions planifiées pour une période
    @Query("SELECT i FROM Intervention i WHERE i.dateDemande BETWEEN :dateDebut AND :dateFin " +
           "AND i.statutIntervention = 'PLANIFIEE' ORDER BY i.dateDemande ASC")
    List<Intervention> findInterventionsPlanifiees(@Param("dateDebut") LocalDateTime dateDebut, 
                                                   @Param("dateFin") LocalDateTime dateFin);
    
    // Statistiques par statut
    @Query("SELECT i.statutIntervention, COUNT(i) FROM Intervention i GROUP BY i.statutIntervention")
    List<Object[]> getStatistiquesParStatut();
    
    // Statistiques par type
    @Query("SELECT i.typeIntervention, COUNT(i) FROM Intervention i GROUP BY i.typeIntervention")
    List<Object[]> getStatistiquesParType();
    
    // Interventions en retard
    @Query("SELECT i FROM Intervention i WHERE i.dateDemande < :maintenant " +
           "AND i.statutIntervention IN ('EN_ATTENTE', 'PLANIFIEE') " +
           "ORDER BY i.dateDemande ASC")
    List<Intervention> findInterventionsEnRetard(@Param("maintenant") LocalDateTime maintenant);
    
    // Recherche textuelle
    @Query("SELECT i FROM Intervention i WHERE " +
           "LOWER(i.titre) LIKE LOWER(CONCAT('%', :recherche, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :recherche, '%')) OR " +
           "LOWER(i.numeroTicket) LIKE LOWER(CONCAT('%', :recherche, '%')) " +
           "ORDER BY i.dateCreation DESC")
    List<Intervention> rechercherInterventions(@Param("recherche") String recherche);
    
    // Compter les interventions par statut pour un technicien
    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.technicien.id = :technicienId " +
           "AND i.statutIntervention = :statut")
    int countByTechnicienAndStatut(@Param("technicienId") Long technicienId, 
                                   @Param("statut") StatutIntervention statut);
    
    // Méthodes additionnelles pour les DTOs
    List<Intervention> findByDateCreationBetween(LocalDateTime dateDebut, LocalDateTime dateFin);
    
    // Recherche simple - toutes les interventions paginées
    Page<Intervention> findAllByOrderByDateCreationDesc(Pageable pageable);
    
    // Recherche par statut avec pagination
    Page<Intervention> findByStatutInterventionOrderByDateCreationDesc(StatutIntervention statut, Pageable pageable);
    
    // Recherche par type avec pagination  
    Page<Intervention> findByTypeInterventionOrderByDateCreationDesc(TypeIntervention type, Pageable pageable);
    
    // Recherche par priorité avec pagination
    Page<Intervention> findByPrioriteOrderByDateCreationDesc(PrioriteIntervention priorite, Pageable pageable);
    
    // Find interventions where a printer is associated (in imprimantesAssociees collection)
    @Query("SELECT i FROM Intervention i JOIN i.imprimantesAssociees p WHERE p.id = :imprimanteId")
    List<Intervention> findByImprimantesAssociees_Id(@Param("imprimanteId") Long imprimanteId);
    
    // Find interventions where a printer is associated with a specific status
    @Query("SELECT i FROM Intervention i JOIN i.imprimantesAssociees p WHERE p.id = :imprimanteId AND i.statutIntervention = :statut")
    List<Intervention> findByImprimantesAssociees_IdAndStatutIntervention(
            @Param("imprimanteId") Long imprimanteId, 
            @Param("statut") StatutIntervention statut);
    
    // Trouver la dernière intervention de type préventive pour un contrat
    Intervention findTopByContratIdAndTypeInterventionOrderByDatePlanifieeDesc(
        Long contratId, TypeIntervention typeIntervention);
    
    // Trouver les interventions préventives planifiées pour une date donnée
    @Query("SELECT i.id, c.numeroContrat, i.datePlanifiee, u.email, u.nom " +
           "FROM Intervention i " +
           "JOIN i.contrat c " +
           "JOIN c.client u " +
           "WHERE i.typeIntervention = 'PREVENTIVE' " +
           "AND i.statutIntervention = 'PLANIFIEE' " +
           "AND i.datePlanifiee BETWEEN :startDate AND :endDate")
    List<Object[]> findUpcomingPreventiveMaintenances(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
}
