package com.example.maintenanceapp.Dto;

import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterventionHistoriqueDTO {
    
    private Long id;
    private StatutIntervention ancienStatut;
    private StatutIntervention nouveauStatut;
    private String action;
    private String commentaire;
    private Long utilisateurId;
    private String utilisateurNom;
    private LocalDateTime dateAction;
}
