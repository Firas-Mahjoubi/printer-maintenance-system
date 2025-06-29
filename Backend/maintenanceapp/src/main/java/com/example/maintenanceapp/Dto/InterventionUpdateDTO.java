package com.example.maintenanceapp.Dto;

import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;

import java.time.LocalDateTime;

public class InterventionUpdateDTO {
    private String titre;
    private String description;
    private TypeIntervention type;
    private PrioriteIntervention priorite;
    private StatutIntervention statut;
    private LocalDateTime datePlanifiee;
    private String diagnostic;
    private String solution;
    private String commentaireInterne;
    private Long contratId;
    private Long imprimanteId;
    private Long technicienId;

    // Constructeurs
    public InterventionUpdateDTO() {}

    // Getters et Setters
    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TypeIntervention getType() {
        return type;
    }

    public void setType(TypeIntervention type) {
        this.type = type;
    }

    public PrioriteIntervention getPriorite() {
        return priorite;
    }

    public void setPriorite(PrioriteIntervention priorite) {
        this.priorite = priorite;
    }

    public StatutIntervention getStatut() {
        return statut;
    }

    public void setStatut(StatutIntervention statut) {
        this.statut = statut;
    }

    public LocalDateTime getDatePlanifiee() {
        return datePlanifiee;
    }

    public void setDatePlanifiee(LocalDateTime datePlanifiee) {
        this.datePlanifiee = datePlanifiee;
    }

    public String getDiagnostic() {
        return diagnostic;
    }

    public void setDiagnostic(String diagnostic) {
        this.diagnostic = diagnostic;
    }

    public String getSolution() {
        return solution;
    }

    public void setSolution(String solution) {
        this.solution = solution;
    }

    public String getCommentaireInterne() {
        return commentaireInterne;
    }

    public void setCommentaireInterne(String commentaireInterne) {
        this.commentaireInterne = commentaireInterne;
    }

    public Long getContratId() {
        return contratId;
    }

    public void setContratId(Long contratId) {
        this.contratId = contratId;
    }

    public Long getImprimanteId() {
        return imprimanteId;
    }

    public void setImprimanteId(Long imprimanteId) {
        this.imprimanteId = imprimanteId;
    }

    public Long getTechnicienId() {
        return technicienId;
    }

    public void setTechnicienId(Long technicienId) {
        this.technicienId = technicienId;
    }
}
