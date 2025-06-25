package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContratRepositorie extends JpaRepository<Contrat, Long> {
    List<Contrat> findByDateFinBeforeAndStatutContratNot(LocalDate date, StatutContrat statutContrat);
    List<Contrat> findByDateFinBetweenAndStatutContratNot(LocalDate start, LocalDate end, StatutContrat statut);
    List<Contrat> findByStatutContratNot(StatutContrat statut);
    List<Contrat> findByStatutContrat(StatutContrat statut);


}
