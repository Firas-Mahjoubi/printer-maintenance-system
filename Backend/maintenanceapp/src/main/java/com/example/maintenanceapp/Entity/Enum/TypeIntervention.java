package com.example.maintenanceapp.Entity.Enum;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TypeIntervention {
    PREVENTIVE("Maintenance préventive planifiée"),      
    CORRECTIVE("Réparation suite à panne"),      
    URGENTE("Intervention d'urgence"),         
    INSTALLATION("Installation de nouveau matériel"),    
    MISE_A_JOUR("Mise à jour logicielle/firmware"),     
    DIAGNOSTIC("Diagnostic technique"),      
    FORMATION("Formation utilisateur"),       
    NETTOYAGE("Nettoyage et entretien"),       
    MAINTENANCE("Maintenance régulière");
    
    private final String displayName;
    
    TypeIntervention(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
    
    @JsonValue
    public String getValue() {
        return this.name();
    }
    
    @JsonCreator
    public static TypeIntervention fromValue(String value) {
        if (value == null) {
            return null;
        }
        
        try {
            return TypeIntervention.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Handle case when string doesn't match any enum value
            return null;
        }
    }
}
