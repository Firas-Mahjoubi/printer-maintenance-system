package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.TypeNotification;
import com.example.maintenanceapp.Entity.Enum.StatutNotification;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    
    String titre;
    String message;
    
    @Enumerated(EnumType.STRING)
    TypeNotification type;
    
    @Enumerated(EnumType.STRING)
    StatutNotification statut;
    
    LocalDateTime dateCreation;
    LocalDateTime dateLecture;
    
    // Relations
    @ManyToOne
            @JsonIgnore
    Utilisateur utilisateur;
    
    @ManyToOne
            @JsonIgnore
    Contrat contrat; // Référence au contrat concerné
    
    // Champs supplémentaires pour les alertes d'échéance
    Integer joursRestants;
    String actionRequise;
}
