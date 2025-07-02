package com.example.maintenanceapp.Dto;

import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratDTO {
    private Long id;
    private String numeroContrat;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private StatutContrat statutContrat;
    private String conditions_contrat;
    private ClientDTO client;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClientDTO {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
        private String telephone;
    }
}
