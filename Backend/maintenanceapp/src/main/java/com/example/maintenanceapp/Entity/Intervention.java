package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
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
public class Intervention {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    
    // Informations du ticket
    String numeroTicket; // Numéro unique du ticket (ex: TICK-2024-001)
    String titre; // Titre court du problème
    
    @Enumerated(EnumType.STRING)
    TypeIntervention typeIntervention; // CORRECTIVE, PREVENTIVE, URGENTE
    
    @Column(length = 1000)
    String description; // Description détaillée du problème
    
    @Column(length = 500)
    String symptomes; // Symptômes observés
    
    @Enumerated(EnumType.STRING)
    PrioriteIntervention priorite; // BASSE, NORMALE, HAUTE, CRITIQUE
    
    // Dates importantes
    LocalDateTime dateCreation; // Date de création du ticket
    LocalDateTime dateDemande; // Date demandée pour l'intervention
    LocalDateTime dateDebutIntervention; // Date de début réelle
    LocalDateTime dateFinIntervention; // Date de fin réelle
    LocalDateTime dateCloture; // Date de clôture du ticket
    
    @Enumerated(EnumType.STRING)
    StatutIntervention statutIntervention; // EN_ATTENTE, PLANIFIEE, EN_COURS, TERMINEE, ANNULEE
    
    // Informations financières
    Double coutEstime; // Coût estimé
    Double coutReel; // Coût réel
    String devisNumero; // Numéro de devis si applicable
    
    // Informations techniques
    @Column(length = 1000)
    String diagnosticTechnique; // Diagnostic du technicien
    
    @Column(length = 1000)
    String solutionAppliquee; // Solution appliquée
    
    @Column(length = 500)
    String piecesUtilisees; // Pièces utilisées
    
    @Column(length = 500)
    String observations; // Observations du technicien
    
    // Satisfaction client
    Integer noteSatisfaction; // Note de 1 à 5
    String commentaireClient; // Commentaire du client
    
    // Relations
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "imprimante_id")
    Imprimante imprimante; // Imprimante concernée
    
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "contrat_id")
    Contrat contrat; // Contrat associé
    
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "demandeur_id")
    Utilisateur demandeur; // Personne qui a créé le ticket
    
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "technicien_id")
    Utilisateur technicien; // Technicien assigné
    
    // Métadonnées
    LocalDateTime derniereModification;
    
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "modifie_par_id")
    Utilisateur modifiePar;
}
