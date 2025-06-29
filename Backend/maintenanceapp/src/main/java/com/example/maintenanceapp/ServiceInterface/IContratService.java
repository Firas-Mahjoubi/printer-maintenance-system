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
    byte[] exportContratToPdf(Long contratId) throws IOException;
    }
