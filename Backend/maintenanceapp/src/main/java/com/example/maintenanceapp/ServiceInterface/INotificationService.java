package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Notification;
import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Entity.Enum.TypeNotification;

import java.util.List;
import java.util.Optional;

public interface INotificationService {
    
    // CRUD operations
    List<Notification> getAllNotifications();
    List<Notification> getNotificationsByUser(Long userId);
    List<Notification> getUnreadNotificationsByUser(Long userId);
    Notification findById(Long id);
    Notification save(Notification notification);
    void delete(Long id);
    
    // Notification specific methods
    void creerNotificationEcheanceContrat(Contrat contrat, int joursRestants);
    void creerNotificationContratExpire(Contrat contrat);
    void marquerCommeLue(Long notificationId);
    void marquerToutesCommeLues(Long userId);
    int getNombreNotificationsNonLues(Long userId);
    
    // Batch operations
    void envoyerNotificationsEcheance();
    void supprimerNotificationsAnciennes(int joursAnciennete);
}
