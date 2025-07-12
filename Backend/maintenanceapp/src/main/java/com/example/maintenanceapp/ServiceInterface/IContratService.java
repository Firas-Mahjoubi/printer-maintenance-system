package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Contrat;

import java.io.IOException;
import java.util.List;

public interface IContratService {
    List<Contrat> findAll();
    Contrat findById(Long id);
    Contrat save(Contrat contrat, long clientId);
    void delete(Long id);
    Contrat update(long id,Contrat contrat);
    List<Contrat> getContratsProchesDeLEcheance(int joursAvant) ;
    void verifierContratsProchesExpiration() ;
    Contrat renouvelerContrat(Long oldContratId, Contrat newContratData) ;
    List<Contrat> getContratsHistorie();
    /**
     * Récupère tous les contrats actifs (non historiques)
     * @return Liste des contrats actifs
     */
    List<Contrat> getContratsActifs();
    byte[] exportContratToPdf(Long contratId) throws IOException;
    boolean checkNumeroContratExists(String numeroContrat);
    
    /**
     * Vérifie si un contrat a des interventions actives
     * @param contratId ID du contrat à vérifier
     * @return true si le contrat a au moins une intervention active, false sinon
     */
    boolean hasActiveInterventions(Long contratId);
    
    /**
     * Récupère la liste des interventions actives pour un contrat
     * @param contratId ID du contrat
     * @return Liste des interventions actives
     */
    List<?> getActiveInterventions(Long contratId);
}
