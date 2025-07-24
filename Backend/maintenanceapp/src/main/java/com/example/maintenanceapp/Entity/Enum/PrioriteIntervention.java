package com.example.maintenanceapp.Entity.Enum;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PrioriteIntervention {
    BASSE,      // Peut attendre plusieurs jours
    NORMALE,    // Traitement dans les délais standards
    HAUTE,      // Traitement prioritaire sous 24h
    CRITIQUE;   // Intervention immédiate requise
    
    @JsonValue
    public String getValue() {
        return this.name();
    }
    
    @JsonCreator
    public static PrioriteIntervention fromValue(String value) {
        if (value == null) {
            return null;
        }
        
        try {
            return PrioriteIntervention.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Handle case when string doesn't match any enum value
            return null;
        }
    }
}
