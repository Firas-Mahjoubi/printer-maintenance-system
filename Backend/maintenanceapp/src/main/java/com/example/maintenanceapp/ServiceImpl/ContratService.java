package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
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
            // You can add email notification here
        }
    }
    @Scheduled(cron = "0 0 9 * * *") // Runs every day at 08:00 AM
    public void mettreAJourContratsExpires() {
        LocalDate aujourdHui = LocalDate.now();

        // Fetch contracts that ended before today and are not already marked as expired
        List<Contrat> contratsAExpirer = contratRepositorie.findByDateFinBeforeAndStatutContratNot(aujourdHui, StatutContrat.EXPIRE);

        for (Contrat contrat : contratsAExpirer) {
            contrat.setStatutContrat(StatutContrat.EXPIRE);
            contratRepositorie.save(contrat);
            System.out.println("Contrat expiré mis à jour : " + contrat.getNumeroContrat());
        }
    }

}
