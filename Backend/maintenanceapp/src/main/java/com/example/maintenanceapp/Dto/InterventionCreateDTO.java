package com.example.maintenanceapp.Dto;

import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;


import java.time.LocalDateTime;
import java.util.List;

public class InterventionCreateDTO {
    
    private String titre;
    
    private String description;
    
    private TypeIntervention type;
    
    private PrioriteIntervention priorite;
    
    private LocalDateTime datePlanifiee;
    
    private Long contratId;
    
    private Long imprimanteId;
    
    private List<Long> imprimanteIds;
    
    private Long demandeurId;
    
    private Long technicienId;

    // Constructeurs
    public InterventionCreateDTO() {}

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

    public LocalDateTime getDatePlanifiee() {
        return datePlanifiee;
    }

    public void setDatePlanifiee(LocalDateTime datePlanifiee) {
        this.datePlanifiee = datePlanifiee;
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
    
    public List<Long> getImprimanteIds() {
        return imprimanteIds;
    }

    public void setImprimanteIds(List<Long> imprimanteIds) {
        this.imprimanteIds = imprimanteIds;
    }

    public Long getDemandeurId() {
        return demandeurId;
    }

    public void setDemandeurId(Long demandeurId) {
        this.demandeurId = demandeurId;
    }

    public Long getTechnicienId() {
        return technicienId;
    }

    public void setTechnicienId(Long technicienId) {
        this.technicienId = technicienId;
    }
}
