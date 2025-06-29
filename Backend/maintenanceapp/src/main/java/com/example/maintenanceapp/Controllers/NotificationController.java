package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Entity.Notification;
import com.example.maintenanceapp.ServiceImpl.NotificationService;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/notifications")
public class NotificationController {
    
    NotificationService notificationService;
    
    @GetMapping("/user/{userId}")
    public List<Notification> getNotificationsByUser(@PathVariable Long userId) {
        return notificationService.getNotificationsByUser(userId);
    }
    
    @GetMapping("/user/{userId}/unread")
    public List<Notification> getUnreadNotificationsByUser(@PathVariable Long userId) {
        return notificationService.getUnreadNotificationsByUser(userId);
    }
    
    @GetMapping("/user/{userId}/count-unread")
    public ResponseEntity<Integer> getUnreadCount(@PathVariable Long userId) {
        int count = notificationService.getNombreNotificationsNonLues(userId);
        return ResponseEntity.ok(count);
    }
    
    @PutMapping("/mark-read/{id}")
    public ResponseEntity<String> markAsRead(@PathVariable Long id) {
        try {
            notificationService.marquerCommeLue(id);
            return ResponseEntity.ok("Notification marquée comme lue");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la mise à jour: " + e.getMessage());
        }
    }
    
    @PutMapping("/mark-all-read/{userId}")
    public ResponseEntity<String> markAllAsRead(@PathVariable Long userId) {
        try {
            notificationService.marquerToutesCommeLues(userId);
            return ResponseEntity.ok("Toutes les notifications marquées comme lues");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la mise à jour: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteNotification(@PathVariable Long id) {
        try {
            notificationService.delete(id);
            return ResponseEntity.ok("Notification supprimée");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la suppression: " + e.getMessage());
        }
    }
    
    @GetMapping("/all")
    public List<Notification> getAllNotifications() {
        return notificationService.getAllNotifications();
    }
    
    // Endpoint pour déclencher manuellement la vérification des échéances (pour les tests)
    @PostMapping("/check-contract-expiry")
    public ResponseEntity<String> checkContractExpiry() {
        try {
            notificationService.envoyerNotificationsEcheance();
            return ResponseEntity.ok("Vérification des échéances déclenchée");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }
    
    // Endpoint de test pour créer des notifications de démonstration
    @PostMapping("/create-test-notifications/{userId}")
    public ResponseEntity<String> createTestNotifications(@PathVariable Long userId) {
        try {
            notificationService.creerNotificationsTest(userId);
            return ResponseEntity.ok("3 notifications de test créées pour l'utilisateur ID: " + userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la création des notifications de test: " + e.getMessage());
        }
    }
}
