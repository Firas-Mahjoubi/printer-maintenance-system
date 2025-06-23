package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.example.maintenanceapp.ServiceInterface.IContratService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class ContratService implements IContratService {
    ContratRepositorie contratRepositorie;
    ImprimanteRepositorie imprimanteRepositorie;
    @Override
    public List<Contrat> findAll() {
        return contratRepositorie.findAll();
    }

    @Override
    public Contrat findById(Long id) {
        return contratRepositorie.findById(id).orElse(null);
    }

    @Override
    public Contrat save(Contrat contrat) {
        return contratRepositorie.save(contrat);
    }

    @Override
    public void delete(Long id) {
        contratRepositorie.deleteById(id);

    }

    @Override
    public Contrat update(long id, Contrat contrat) {
        Contrat existing = contratRepositorie.findById(id).orElse(null);
        existing.setNumeroContrat(contrat.getNumeroContrat());
        existing.setDateDebut(contrat.getDateDebut());
        existing.setDateFin(contrat.getDateFin());
        existing.setConditions_contrat(contrat.getConditions_contrat());
        existing.setStatutContrat(contrat.getStatutContrat());


        return contratRepositorie.save(existing);
    }

    @Override
    public List<Contrat> getContratsProchesDeLEcheance(int joursAvant) {
        LocalDate today = LocalDate.now();
        LocalDate dateSeuil = today.plusDays(joursAvant);

        return contratRepositorie.findByDateFinBetweenAndStatutContratNot(
                today, dateSeuil, StatutContrat.EXPIRE);
    }

    @Scheduled(cron = "0 0 9 * * *") // Every day at 09:00
    public void verifierContratsProchesExpiration() {
        List<Contrat> contrats = getContratsProchesDeLEcheance(30); // 30 days before expiration
        for (Contrat contrat : contrats) {
            System.out.println("🔔 Contrat à renouveler bientôt : " + contrat.getNumeroContrat()
                    + " (Expire le : " + contrat.getDateFin() + ")");
            // add email notification here
        }
    }
    @Scheduled(cron = "0 0 9 * * *") // Runs every day at 09:00 AM
    public void mettreAJourContratsExpires() {
        LocalDate aujourdHui = LocalDate.now();
        List<Contrat> contratsAExpirer = contratRepositorie.findByDateFinBeforeAndStatutContratNot(aujourdHui, StatutContrat.EXPIRE);
        for (Contrat contrat : contratsAExpirer) {
            contrat.setStatutContrat(StatutContrat.EXPIRE);
            contratRepositorie.save(contrat);
            System.out.println("Contrat expiré mis à jour : " + contrat.getNumeroContrat());
        }
    }

    @Override
    public Contrat renouvelerContrat(Long oldContratId, Contrat newContratData) {
        Contrat ancienContrat = contratRepositorie.findById(oldContratId)
                .orElseThrow(() -> new RuntimeException("Ancien contrat non trouvé"));

        // 1. Update old contract
        ancienContrat.setStatutContrat(StatutContrat.RENOUVELE);
        contratRepositorie.save(ancienContrat);

        // 2. Set link and status for the new contract
        newContratData.setContratPrecedent(ancienContrat);
        newContratData.setStatutContrat(StatutContrat.ACTIF);
        contratRepositorie.save(newContratData);

        // 3. Fetch and transfer imprimantes
        List<Imprimante> imprimantes = imprimanteRepositorie.findByContrat_Id(oldContratId);
        for (Imprimante i : imprimantes) {
            i.setContrat(newContratData);
            imprimanteRepositorie.save(i);
        }

        return newContratData;
    }

    @Override
    public List<Contrat> getContratsHistorie() {
        return contratRepositorie.findByStatutContratNot(StatutContrat.ACTIF);
    }


}
