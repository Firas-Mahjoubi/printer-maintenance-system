package com.example.maintenanceapp.Repositorie;

import com.example.maintenanceapp.Entity.InterventionHistorique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionHistoriqueRepositorie extends JpaRepository<InterventionHistorique, Long> {
    
    /**
     * Récupère l'historique d'une intervention triée par date
     */
    @Query("SELECT h FROM InterventionHistorique h WHERE h.intervention.id = :interventionId ORDER BY h.dateAction ASC")
    List<InterventionHistorique> findByInterventionIdOrderByDateActionAsc(@Param("interventionId") Long interventionId);
    
    /**
     * Récupère la dernière action d'une intervention
     */
    @Query("SELECT h FROM InterventionHistorique h WHERE h.intervention.id = :interventionId ORDER BY h.dateAction DESC LIMIT 1")
    InterventionHistorique findLatestByInterventionId(@Param("interventionId") Long interventionId);
}
