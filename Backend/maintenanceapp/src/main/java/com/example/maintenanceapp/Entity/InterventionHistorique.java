package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "intervention_historique")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterventionHistorique {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
        @JsonIgnore
    @JoinColumn(name = "intervention_id", nullable = false)
    private Intervention intervention;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "ancien_statut")
    private StatutIntervention ancienStatut;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "nouveau_statut", nullable = false)
    private StatutIntervention nouveauStatut;
    
    @Column(name = "action", nullable = false)
    private String action;
    
    @Column(name = "commentaire", columnDefinition = "TEXT")
    private String commentaire;
    
    @ManyToOne(fetch = FetchType.LAZY)
        @JsonIgnore
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    
    @CreationTimestamp
    @Column(name = "date_action", nullable = false)
    private LocalDateTime dateAction;
    
    // Constructeur utilitaire
    public InterventionHistorique(Intervention intervention, StatutIntervention ancienStatut, 
                                StatutIntervention nouveauStatut, String action, String commentaire, 
                                Utilisateur utilisateur) {
        this.intervention = intervention;
        this.ancienStatut = ancienStatut;
        this.nouveauStatut = nouveauStatut;
        this.action = action;
        this.commentaire = commentaire;
        this.utilisateur = utilisateur;
        this.dateAction = LocalDateTime.now();
    }
}
