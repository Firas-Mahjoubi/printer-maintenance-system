package com.example.maintenanceapp.Entity.Enum;

public enum StatutIntervention {
    EN_ATTENTE,     // Ticket créé, en attente d'assignation
    PLANIFIEE,      // Intervention planifiée avec date
    EN_COURS,       // Intervention en cours d'exécution
    TERMINEE,       // Intervention terminée avec succès
    ANNULEE,        // Intervention annulée
    REJETEE,        // Demande rejetée
    EN_PAUSE,       // Intervention suspendue temporairement
    ATTENTE_PIECES, // En attente de pièces de rechange
    ATTENTE_CLIENT  // En attente de retour/validation client
}
