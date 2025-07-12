package com.example.maintenanceapp.Entity.Enum;

public enum ImprimanteStatus {
    ACTIF,           // Printer is active and available
    EN_PANNE,        // Printer has an issue and is waiting for maintenance
    EN_MAINTENANCE,  // Printer is being serviced
    HORS_SERVICE     // Printer is out of service
}
