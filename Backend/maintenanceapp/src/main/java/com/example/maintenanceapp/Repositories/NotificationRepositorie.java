package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Notification;
import com.example.maintenanceapp.Entity.Enum.TypeNotification;
import com.example.maintenanceapp.Entity.Enum.StatutNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepositorie extends JpaRepository<Notification, Long> {
    
    // Recherches par utilisateur
    List<Notification> findByUtilisateur_IdOrderByDateCreationDesc(Long userId);
    List<Notification> findByUtilisateur_IdAndStatutOrderByDateCreationDesc(Long userId, StatutNotification statut);
    
    // Comptage
    int countByUtilisateur_IdAndStatut(Long userId, StatutNotification statut);
    
    // Vérifications d'existence
    boolean existsByContrat_IdAndUtilisateur_IdAndTypeAndStatut(Long contratId, Long userId, TypeNotification type, StatutNotification statut);
    
    // Recherches par type et statut
    List<Notification> findByTypeAndStatut(TypeNotification type, StatutNotification statut);
    
    // Nettoyage des anciennes notifications
    List<Notification> findByDateCreationBeforeAndStatut(LocalDateTime dateLimit, StatutNotification statut);
    
    // Recherches par contrat
    List<Notification> findByContrat_IdOrderByDateCreationDesc(Long contratId);
}
