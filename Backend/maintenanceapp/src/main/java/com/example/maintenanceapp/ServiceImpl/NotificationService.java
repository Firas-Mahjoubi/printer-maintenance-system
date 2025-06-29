package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Notification;
import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Entity.Enum.TypeNotification;
import com.example.maintenanceapp.Entity.Enum.StatutNotification;
import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Repositories.NotificationRepositorie;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceInterface.INotificationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class NotificationService implements INotificationService {
    
    NotificationRepositorie notificationRepositorie;
    UtilisateurRepositorie utilisateurRepositorie;

    @Override
    public List<Notification> getAllNotifications() {
        return notificationRepositorie.findAll();
    }

    @Override
    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepositorie.findByUtilisateur_IdOrderByDateCreationDesc(userId);
    }

    @Override
    public List<Notification> getUnreadNotificationsByUser(Long userId) {
        return notificationRepositorie.findByUtilisateur_IdAndStatutOrderByDateCreationDesc(userId, StatutNotification.NON_LUE);
    }

    @Override
    public Notification findById(Long id) {
        return notificationRepositorie.findById(id).orElse(null);
    }

    @Override
    public Notification save(Notification notification) {
        if (notification.getDateCreation() == null) {
            notification.setDateCreation(LocalDateTime.now());
        }
        if (notification.getStatut() == null) {
            notification.setStatut(StatutNotification.NON_LUE);
        }
        return notificationRepositorie.save(notification);
    }

    @Override
    public void delete(Long id) {
        notificationRepositorie.deleteById(id);
    }

    @Override
    public void creerNotificationEcheanceContrat(Contrat contrat, int joursRestants) {
        // Créer notification pour les administrateurs
        List<Utilisateur> admins = utilisateurRepositorie.findByRole(Role.ADMIN);
        
        for (Utilisateur admin : admins) {
            // Vérifier si une notification similaire n'existe pas déjà
            boolean notificationExiste = notificationRepositorie.existsByContrat_IdAndUtilisateur_IdAndTypeAndStatut(
                contrat.getId(), admin.getId(), TypeNotification.ALERTE_ECHEANCE, StatutNotification.NON_LUE);
            
            if (!notificationExiste) {
                Notification notification = Notification.builder()
                    .titre("⏰ Contrat proche de l'échéance")
                    .message(String.format("Le contrat %s expire dans %d jours (le %s). Action requise pour le renouvellement.", 
                        contrat.getNumeroContrat(), joursRestants, contrat.getDateFin()))
                    .type(TypeNotification.ALERTE_ECHEANCE)
                    .statut(StatutNotification.NON_LUE)
                    .dateCreation(LocalDateTime.now())
                    .utilisateur(admin)
                    .contrat(contrat)
                    .joursRestants(joursRestants)
                    .actionRequise("Renouveler le contrat")
                    .build();
                
                save(notification);
                log.info("Notification d'échéance créée pour le contrat {} - {} jours restants", contrat.getNumeroContrat(), joursRestants);
            }
        }
    }

    @Override
    public void creerNotificationContratExpire(Contrat contrat) {
        List<Utilisateur> admins = utilisateurRepositorie.findByRole(Role.ADMIN);
        
        for (Utilisateur admin : admins) {
            Notification notification = Notification.builder()
                .titre("🚨 Contrat expiré")
                .message(String.format("Le contrat %s a expiré le %s. Veuillez procéder au renouvellement ou à la clôture.", 
                    contrat.getNumeroContrat(), contrat.getDateFin()))
                .type(TypeNotification.CONTRAT_EXPIRE)
                .statut(StatutNotification.NON_LUE)
                .dateCreation(LocalDateTime.now())
                .utilisateur(admin)
                .contrat(contrat)
                .joursRestants(0)
                .actionRequise("Renouveler ou clôturer le contrat")
                .build();
            
            save(notification);
            log.warn("Notification de contrat expiré créée pour le contrat {}", contrat.getNumeroContrat());
        }
    }

    @Override
    public void marquerCommeLue(Long notificationId) {
        Notification notification = findById(notificationId);
        if (notification != null) {
            notification.setStatut(StatutNotification.LUE);
            notification.setDateLecture(LocalDateTime.now());
            save(notification);
        }
    }

    @Override
    public void marquerToutesCommeLues(Long userId) {
        List<Notification> notifications = getUnreadNotificationsByUser(userId);
        for (Notification notification : notifications) {
            notification.setStatut(StatutNotification.LUE);
            notification.setDateLecture(LocalDateTime.now());
        }
        notificationRepositorie.saveAll(notifications);
    }

    @Override
    public int getNombreNotificationsNonLues(Long userId) {
        return notificationRepositorie.countByUtilisateur_IdAndStatut(userId, StatutNotification.NON_LUE);
    }

    @Override
    public void envoyerNotificationsEcheance() {
        // Cette méthode sera appelée par le ContratService
        log.info("Vérification des notifications d'échéance...");
    }

    @Override
    public void supprimerNotificationsAnciennes(int joursAnciennete) {
        LocalDateTime dateLimite = LocalDateTime.now().minus(joursAnciennete, ChronoUnit.DAYS);
        List<Notification> notificationsAnciennes = notificationRepositorie.findByDateCreationBeforeAndStatut(dateLimite, StatutNotification.LUE);
        
        notificationRepositorie.deleteAll(notificationsAnciennes);
        log.info("Suppression de {} notifications anciennes", notificationsAnciennes.size());
    }
    
    // Méthode pour nettoyer automatiquement les notifications de plus de 30 jours
    @Scheduled(cron = "0 0 2 * * *") // Tous les jours à 2h du matin
    public void nettoyageAutomatiqueNotifications() {
        supprimerNotificationsAnciennes(30);
    }
    
    /**
     * Méthode pour créer des notifications de test pour l'utilisateur admin (ID: 5)
     * À utiliser temporairement pour tester le système de notifications
     */
    public void creerNotificationsTest(Long userId) {
        Utilisateur utilisateur = utilisateurRepositorie.findById(userId).orElse(null);
        if (utilisateur == null) {
            log.error("Utilisateur avec ID {} non trouvé", userId);
            return;
        }
        
        // Notification 1: Alerte d'échéance
        Notification notification1 = Notification.builder()
            .titre("⏰ Contrat proche de l'échéance - TEST")
            .message("Le contrat MAINT-2024-001 expire dans 15 jours. Action requise pour le renouvellement.")
            .type(TypeNotification.ALERTE_ECHEANCE)
            .statut(StatutNotification.NON_LUE)
            .dateCreation(LocalDateTime.now())
            .utilisateur(utilisateur)
            .joursRestants(15)
            .actionRequise("Renouveler le contrat")
            .build();
        
        // Notification 2: Contrat expiré
        Notification notification2 = Notification.builder()
            .titre("🚨 Contrat expiré - TEST")
            .message("Le contrat MAINT-2024-002 a expiré. Intervention immédiate requise.")
            .type(TypeNotification.CONTRAT_EXPIRE)
            .statut(StatutNotification.NON_LUE)
            .dateCreation(LocalDateTime.now().minusHours(2))
            .utilisateur(utilisateur)
            .joursRestants(0)
            .actionRequise("Renouveler immédiatement")
            .build();
            
        // Notification 3: Information générale
        Notification notification3 = Notification.builder()
            .titre("ℹ️ Mise à jour système - TEST")
            .message("Le système de maintenance sera mis à jour ce weekend. Aucune action requise.")
            .type(TypeNotification.INFO_GENERALE)
            .statut(StatutNotification.NON_LUE)
            .dateCreation(LocalDateTime.now().minusMinutes(30))
            .utilisateur(utilisateur)
            .actionRequise("Aucune action requise")
            .build();
        
        save(notification1);
        save(notification2);
        save(notification3);
        
        log.info("✅ 3 notifications de test créées pour l'utilisateur ID: {}", userId);
    }
}
