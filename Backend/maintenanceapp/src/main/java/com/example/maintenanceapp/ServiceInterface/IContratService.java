package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Contrat;

import java.util.List;
import java.util.Optional;

public interface IContratService {
    List<Contrat> findAll();
    Contrat findById(Long id);
    Contrat save(Contrat contrat);
    void delete(Long id);
    Contrat update(long id,Contrat contrat);
    List<Contrat> getContratsProchesDeLEcheance(int joursAvant) ;
    void verifierContratsProchesExpiration() ;
    Contrat renouvelerContrat(Long oldContratId, Contrat newContratData) ;
    List<Contrat> getContratsHistorie();
    }
