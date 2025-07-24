package com.example.maintenanceapp.Service;

import com.example.maintenanceapp.Dto.InterventionCreateDTO;
import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceImpl.InterventionService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class MaintenanceSchedulerService {

    private final ContratRepositorie contratRepository;
    private final ImprimanteRepositorie imprimanteRepository;
    private final InterventionService interventionService;
    private final UtilisateurRepositorie utilisateurRepository;
    private final EmailService emailService;

    /**
     * Planifie des interventions de maintenance préventive tous les 6 mois pour tous les contrats actifs
     * Exécuté une fois par jour à 1h00 du matin
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void schedulePreventiveMaintenance() {
        log.info("Démarrage de la planification des maintenances préventives...");
        
        // Récupérer tous les contrats actifs
        List<Contrat> contratsActifs = contratRepository.findByStatutContrat(StatutContrat.ACTIF);
        
        for (Contrat contrat : contratsActifs) {
            // Récupérer toutes les imprimantes du contrat
            List<Imprimante> imprimantes = imprimanteRepository.findByContratId(contrat.getId());
            
            if (imprimantes.isEmpty()) {
                log.info("Aucune imprimante trouvée pour le contrat {}", contrat.getNumeroContrat());
                continue;
            }
            
            // Vérifier si une maintenance préventive est nécessaire pour ce contrat
            if (shouldCreatePreventiveMaintenance(contrat)) {
                // Créer la maintenance préventive
                createPreventiveMaintenance(contrat, imprimantes);
            }
        }
        
        log.info("Planification des maintenances préventives terminée");
    }
    
    /**
     * Vérifie si un contrat a besoin d'une maintenance préventive
     * Une maintenance est planifiée tous les 6 mois à partir de la date de début du contrat
     */
    private boolean shouldCreatePreventiveMaintenance(Contrat contrat) {
        LocalDateTime now = LocalDateTime.now();
        
        // Calculer la date théorique de la prochaine maintenance
        LocalDateTime nextScheduledDate = calculateNextMaintenanceDate(contrat);
        
        // Obtenir la dernière maintenance préventive planifiée pour ce contrat
        LocalDateTime lastPreventiveMaintenance = interventionService.getLastPreventiveMaintenanceDate(contrat.getId());
        
        // Si aucune maintenance n'a été trouvée, planifier la première
        if (lastPreventiveMaintenance == null) {
            log.info("Aucune maintenance préventive précédente pour le contrat {}. Planification d'une nouvelle pour {}", 
                    contrat.getNumeroContrat(), nextScheduledDate);
            return true;
        }
        
        // Si la dernière maintenance est dans le futur (déjà planifiée)
        if (lastPreventiveMaintenance.isAfter(now)) {
            // Vérifier si elle correspond à la période actuelle
            long daysDifference = ChronoUnit.DAYS.between(lastPreventiveMaintenance, nextScheduledDate);
            if (Math.abs(daysDifference) <= 14) { // Tolérance de 14 jours
                log.info("Maintenance préventive pour le contrat {} déjà planifiée pour cette période ({}).", 
                        contrat.getNumeroContrat(), lastPreventiveMaintenance);
                return false;
            } else {
                log.info("La maintenance déjà planifiée ({}) pour le contrat {} ne correspond pas à la période attendue ({}). Une nouvelle sera planifiée.", 
                        lastPreventiveMaintenance, contrat.getNumeroContrat(), nextScheduledDate);
                return true;
            }
        }
        
        // Si la dernière maintenance est passée, vérifier si elle correspond à la période actuelle ou précédente
        long monthsDifference = ChronoUnit.MONTHS.between(lastPreventiveMaintenance, nextScheduledDate);
        if (monthsDifference <= 6) { // Si la dernière maintenance est dans la période actuelle ou juste avant
            log.info("La dernière maintenance pour le contrat {} a eu lieu il y a {} mois. La prochaine est prévue pour {}.", 
                    contrat.getNumeroContrat(), ChronoUnit.MONTHS.between(lastPreventiveMaintenance, now), nextScheduledDate);
            return false;
        }
        
        // Il faut planifier une nouvelle maintenance
        log.info("Planification d'une nouvelle maintenance préventive pour le contrat {} à la date {}", 
                contrat.getNumeroContrat(), nextScheduledDate);
        return true;
    }
    
    /**
     * Crée une intervention de maintenance préventive pour un contrat
     */
    private void createPreventiveMaintenance(Contrat contrat, List<Imprimante> imprimantes) {
        try {
            // Déterminer la date planifiée basée sur la date de début du contrat
            LocalDateTime datePlanifiee = calculateNextMaintenanceDate(contrat);
            
            // Vérifier que le contrat a un client associé
            if (contrat.getClient() == null) {
                log.error("Impossible de créer une maintenance préventive pour le contrat {} car aucun client n'est associé", 
                        contrat.getNumeroContrat());
                return;
            }
            
            // Récupérer un technicien disponible (à implémenter selon votre logique d'assignation)
            Optional<Utilisateur> technicienOpt = findAvailableTechnician();
            
            if (technicienOpt.isEmpty()) {
                log.error("Aucun technicien disponible pour créer la maintenance préventive du contrat {}", contrat.getNumeroContrat());
                return;
            }
            
            Utilisateur technicien = technicienOpt.get();
            
            // Créer le DTO pour l'intervention
            InterventionCreateDTO createDTO = new InterventionCreateDTO();
            createDTO.setTitre("Maintenance préventive - " + contrat.getNumeroContrat());
            createDTO.setDescription("Maintenance préventive semestrielle programmée automatiquement.");
            createDTO.setType(TypeIntervention.PREVENTIVE);
            createDTO.setPriorite(PrioriteIntervention.NORMALE);
            createDTO.setContratId(contrat.getId());
            createDTO.setTechnicienId(technicien.getId());
            createDTO.setDemandeurId(contrat.getClient().getId());
            createDTO.setDatePlanifiee(datePlanifiee);
            
            // Ajouter toutes les imprimantes du contrat
            List<Long> imprimanteIds = imprimantes.stream()
                    .map(Imprimante::getId)
                    .collect(Collectors.toList());
            createDTO.setImprimanteIds(imprimanteIds);
            
            // Créer l'intervention
            interventionService.creerInterventionMultipleImprimantes(createDTO);
            
            log.info("Maintenance préventive programmée avec succès pour le contrat {} à la date {}", 
                    contrat.getNumeroContrat(), datePlanifiee);
            
            // Programmer une notification pour 1 mois avant la date planifiée
            scheduleNotification(contrat, imprimantes, datePlanifiee);
            
        } catch (Exception e) {
            log.error("Erreur lors de la création de la maintenance préventive pour le contrat {}: {}", 
                    contrat.getNumeroContrat(), e.getMessage());
        }
    }
    
    /**
     * Trouve un technicien disponible pour l'intervention
     * À adapter selon votre logique d'assignation des techniciens
     */
    private Optional<Utilisateur> findAvailableTechnician() {
        // Récupérer tous les techniciens
        List<Utilisateur> techniciens = utilisateurRepository.findByRole(Role.TECHNICIAN);
        
        // Vérifier si des techniciens ont été trouvés
        if (techniciens.isEmpty()) {
            log.warn("Aucun technicien trouvé dans la base de données. Vérifiez que des utilisateurs avec le rôle TECHNICIAN existent.");
            return Optional.empty();
        }
        
        log.info("Nombre de techniciens disponibles: {}", techniciens.size());
        
        // Simple implémentation - récupérer le premier technicien trouvé
        // À améliorer avec une logique de charge de travail, disponibilité, etc.
        return techniciens.stream().findFirst();
    }
    
    /**
     * Programme une notification pour 1 mois avant la date planifiée
     */
    private void scheduleNotification(Contrat contrat, List<Imprimante> imprimantes, LocalDateTime datePlanifiee) {
        // Calculer la date de notification (1 mois avant la date planifiée)
        LocalDateTime notificationDate = datePlanifiee.minusMonths(1);
        
        log.info("Notification programmée pour le contrat {} à la date {}", 
                contrat.getNumeroContrat(), notificationDate);
        
        // Stocker la notification dans une table de notifications programmées
        // ou utiliser un autre mécanisme pour déclencher la notification à la date voulue
    }
    
    /**
     * Calcule la date de la prochaine maintenance préventive basée sur la date de début du contrat
     * La maintenance est planifiée tous les 6 mois à partir de cette date
     * 
     * @param contrat Le contrat pour lequel calculer la prochaine date de maintenance
     * @return La date de la prochaine maintenance préventive
     */
    private LocalDateTime calculateNextMaintenanceDate(Contrat contrat) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate dateDebut = contrat.getDateDebut();
        
        if (dateDebut == null) {
            log.warn("Le contrat {} n'a pas de date de début. Utilisation de la date actuelle + 6 mois.", 
                    contrat.getNumeroContrat());
            return now.plusMonths(6);
        }
        
        // Convertir la date de début en LocalDateTime (début de la journée)
        LocalDateTime contractStartDate = dateDebut.atStartOfDay();
        
        // Si la date de début est dans le futur, programmer la première maintenance 6 mois après
        if (contractStartDate.isAfter(now)) {
            return contractStartDate.plusMonths(6);
        }
        
        // Calculer combien de périodes de 6 mois se sont écoulées depuis le début du contrat
        long monthsSinceStart = ChronoUnit.MONTHS.between(contractStartDate, now);
        long sixMonthPeriods = monthsSinceStart / 6;
        
        // Calculer la date théorique de la prochaine maintenance (N+1 périodes de 6 mois après le début)
        return contractStartDate.plusMonths(6 * (sixMonthPeriods + 1));
    }
    
    /**
     * Vérifie chaque jour s'il y a des notifications à envoyer pour les maintenances planifiées
     * Exécuté une fois par jour à 9h00 du matin
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void sendMaintenanceNotifications() {
        log.info("Vérification des notifications de maintenance à envoyer...");
        
        // Vérifier que la configuration email est valide
        if (!emailService.isEmailConfigurationValid()) {
            log.error("La configuration email n'est pas valide. Les notifications ne seront pas envoyées.");
            return;
        }
        
        LocalDate today = LocalDate.now();
        LocalDate inOneMonth = today.plusMonths(1);
        
        // Récupérer toutes les interventions préventives planifiées dans un mois
        List<Object[]> upcomingMaintenances = interventionService.findUpcomingPreventiveMaintenances(inOneMonth);
        
        log.info("Trouvé {} maintenances préventives planifiées pour la période du {} au {}", 
                upcomingMaintenances.size(), inOneMonth.atStartOfDay(), inOneMonth.atTime(23, 59, 59));
        
        if (upcomingMaintenances.isEmpty()) {
            log.info("Aucune maintenance préventive à notifier pour le moment");
        } else {
            int emailsEnvoyes = 0;
            
            for (Object[] maintenance : upcomingMaintenances) {
                try {
                    Long interventionId = (Long) maintenance[0];
                    String numeroContrat = (String) maintenance[1];
                    LocalDateTime datePlanifiee = (LocalDateTime) maintenance[2];
                    String clientEmail = (String) maintenance[3];
                    String clientNom = (String) maintenance[4];
                    
                    log.info("Préparation de la notification pour l'intervention {} du contrat {}, planifiée le {}", 
                            interventionId, numeroContrat, datePlanifiee);
                    
                    // Envoyer une notification par email
                    sendMaintenanceNotificationEmail(interventionId, numeroContrat, datePlanifiee, clientEmail, clientNom);
                    emailsEnvoyes++;
                } catch (Exception e) {
                    log.error("Erreur lors du traitement d'une notification de maintenance: {}", e.getMessage(), e);
                }
            }
            
            log.info("{} emails de notification envoyés avec succès sur {} maintenances planifiées", 
                    emailsEnvoyes, upcomingMaintenances.size());
        }
        
        log.info("Envoi des notifications de maintenance terminé");
    }
    
    /**
     * Envoie un email de notification pour une maintenance planifiée
     */
    private void sendMaintenanceNotificationEmail(Long interventionId, String numeroContrat, 
                                                 LocalDateTime datePlanifiee, String clientEmail, String clientNom) {
        try {
            if (clientEmail == null || clientEmail.isEmpty()) {
                log.warn("Impossible d'envoyer l'email de notification car l'adresse email du client est vide - Contrat: {}, Client: {}", 
                        numeroContrat, clientNom);
                return;
            }
            
            log.info("Envoi d'une notification de maintenance à {} pour le contrat {}", clientEmail, numeroContrat);
            
            // Utiliser le nouvel email HTML pour un rendu plus professionnel
            emailService.sendMaintenanceNotificationHtml(clientEmail, clientNom, numeroContrat, datePlanifiee, interventionId);
            
            log.info("Email de notification envoyé avec succès à {} pour la maintenance du contrat {}", 
                    clientEmail, numeroContrat);
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de notification pour la maintenance du contrat {}: {}", 
                    numeroContrat, e.getMessage(), e);
        }
    }
}
