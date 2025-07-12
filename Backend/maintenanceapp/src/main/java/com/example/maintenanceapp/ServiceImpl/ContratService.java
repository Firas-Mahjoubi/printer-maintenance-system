package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Entity.Intervention;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.example.maintenanceapp.Repositories.InterventionRepositorie;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceInterface.IContratService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class ContratService implements IContratService {
    ContratRepositorie contratRepositorie;
    ImprimanteRepositorie imprimanteRepositorie;
    UtilisateurRepositorie utilisateurRepositorie;
    InterventionRepositorie interventionRepositorie;
    PdfGenerationService pdfGenerationService;
    NotificationService notificationService;
    @Override
    public List<Contrat> findAll() {
        return contratRepositorie.findAll();
    }

    @Override
    public Contrat findById(Long id) {
        return contratRepositorie.findById(id).orElse(null);
    }

    @Override
    public Contrat save(Contrat contrat, long clientId) {
        Utilisateur utilisateur = utilisateurRepositorie.getReferenceById(clientId);
        contrat.setClient(utilisateur);
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

    @Scheduled(cron = "0 57 13 * * *") // Every day at 09:00
    public void verifierContratsProchesExpiration() {
        log.info("🔍 Début de la vérification des contrats proches de l'expiration...");
        
        // Vérifier les contrats à 30, 15, 7 et 3 jours de l'échéance
        int[] seuilsAlerte = {30, 15, 7, 3, 1};
        
        for (int seuil : seuilsAlerte) {
            List<Contrat> contrats = getContratsProchesDeLEcheance(seuil);
            
            for (Contrat contrat : contrats) {
                // Calculer les jours restants précisément
                long joursRestants = java.time.temporal.ChronoUnit.DAYS.between(
                    LocalDate.now(), contrat.getDateFin());
                
                if (joursRestants == seuil) {
                    log.warn("⚠️ Contrat à renouveler dans {} jours : {} (Expire le : {})", 
                        joursRestants, contrat.getNumeroContrat(), contrat.getDateFin());
                    
                    // Créer une notification
                    notificationService.creerNotificationEcheanceContrat(contrat, (int)joursRestants);
                }
            }
        }
        
        log.info("✅ Vérification terminée");
    }
    @Scheduled(cron = "0 0 9 * * *") // Runs every day at 09:00 AM
    public void mettreAJourContratsExpires() {
        log.info("🔍 Début de la mise à jour des contrats expirés...");
        
        LocalDate aujourdHui = LocalDate.now();
        List<Contrat> contratsAExpirer = contratRepositorie.findByDateFinBeforeAndStatutContratNot(aujourdHui, StatutContrat.EXPIRE);
        
        for (Contrat contrat : contratsAExpirer) {
            contrat.setStatutContrat(StatutContrat.EXPIRE);
            contratRepositorie.save(contrat);
            
            log.warn("🚨 Contrat expiré mis à jour : {}", contrat.getNumeroContrat());
            
            // Créer une notification de contrat expiré
            notificationService.creerNotificationContratExpire(contrat);
        }
        
        if (contratsAExpirer.size() > 0) {
            log.info("✅ {} contrats mis à jour comme expirés", contratsAExpirer.size());
        } else {
            log.info("✅ Aucun contrat expiré trouvé");
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

    @Override
    public List<Contrat> getContratsActifs() {
        return contratRepositorie.findByStatutContrat(StatutContrat.ACTIF);
    }

    @Override
    public byte[] exportContratToPdf(Long contratId) throws IOException {
        Contrat contrat = contratRepositorie.findById(contratId)
                .orElseThrow(() -> new RuntimeException("Contrat non trouvé avec l'ID: " + contratId));
        
        return pdfGenerationService.generateContractPdf(contrat);
    }

    @Override
    public boolean checkNumeroContratExists(String numeroContrat) {
        return contratRepositorie.existsByNumeroContrat(numeroContrat);
    }

    /**
     * Vérifie si un contrat a des interventions actives
     * @param contratId ID du contrat à vérifier
     * @return true si le contrat a au moins une intervention active, false sinon
     */
    @Override
    public boolean hasActiveInterventions(Long contratId) {
        // Vérifier que le contrat existe
        contratRepositorie.findById(contratId)
                .orElseThrow(() -> new RuntimeException("Contrat non trouvé avec l'ID: " + contratId));

        // Liste des statuts considérés comme "actifs"
        List<StatutIntervention> statutsActifs = Arrays.asList(
                StatutIntervention.EN_ATTENTE,
                StatutIntervention.PLANIFIEE,
                StatutIntervention.EN_COURS,
                StatutIntervention.EN_PAUSE,
                StatutIntervention.ATTENTE_PIECES,
                StatutIntervention.ATTENTE_CLIENT
        );

        // Utiliser le repository des interventions pour chercher celles liées au contrat
        List<Intervention> interventions = interventionRepositorie.findByContrat_IdOrderByDateCreationDesc(contratId);
        
        // Vérifier si au moins une intervention a un statut actif
        return interventions.stream()
                .anyMatch(intervention -> statutsActifs.contains(intervention.getStatutIntervention()));
    }
    
    /**
     * Récupère la liste des interventions actives pour un contrat
     * @param contratId ID du contrat
     * @return Liste des interventions actives
     */
    @Override
    public List<?> getActiveInterventions(Long contratId) {
        // Vérifier que le contrat existe
        contratRepositorie.findById(contratId)
                .orElseThrow(() -> new RuntimeException("Contrat non trouvé avec l'ID: " + contratId));
                
        // Liste des statuts considérés comme "actifs"
        List<StatutIntervention> statutsActifs = Arrays.asList(
                StatutIntervention.EN_ATTENTE,
                StatutIntervention.PLANIFIEE,
                StatutIntervention.EN_COURS,
                StatutIntervention.EN_PAUSE,
                StatutIntervention.ATTENTE_PIECES,
                StatutIntervention.ATTENTE_CLIENT
        );
        
        // Récupérer toutes les interventions liées au contrat
        List<Intervention> interventions = interventionRepositorie.findByContrat_IdOrderByDateCreationDesc(contratId);
        
        // Filtrer les interventions actives et les convertir en DTO
        return interventions.stream()
                .filter(intervention -> statutsActifs.contains(intervention.getStatutIntervention()))
                .map(intervention -> {
                    // Conversion en DTO pour éviter les références circulaires
                    return new HashMap<String, Object>() {{
                        put("id", intervention.getId());
                        put("numeroTicket", intervention.getNumeroTicket());
                        put("titre", intervention.getTitre());
                        put("statutIntervention", intervention.getStatutIntervention());
                        put("priorite", intervention.getPriorite());
                        put("typeIntervention", intervention.getTypeIntervention());
                        put("dateCreation", intervention.getDateCreation());
                        put("dateDemande", intervention.getDateDemande());
                    }};
                })
                .collect(Collectors.toList());
    }
}
