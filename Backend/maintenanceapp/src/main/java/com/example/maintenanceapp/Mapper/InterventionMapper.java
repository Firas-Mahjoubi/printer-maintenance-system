package com.example.maintenanceapp.Mapper;

import com.example.maintenanceapp.Dto.ImprimanteDTO;
import com.example.maintenanceapp.Dto.InterventionCreateDTO;
import com.example.maintenanceapp.Dto.InterventionDTO;
import com.example.maintenanceapp.Dto.InterventionUpdateDTO;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Entity.Intervention;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class InterventionMapper {

    @Autowired
    private ImprimanteMapper imprimanteMapper;

    public InterventionDTO toDTO(Intervention intervention) {
        if (intervention == null) {
            return null;
        }

        InterventionDTO dto = new InterventionDTO();
        dto.setId(intervention.getId());
        dto.setNumero(intervention.getNumeroTicket());
        dto.setTitre(intervention.getTitre());
        dto.setDescription(intervention.getDescription());
        dto.setType(intervention.getTypeIntervention());
        dto.setPriorite(intervention.getPriorite());
        dto.setStatut(intervention.getStatutIntervention());
        
        dto.setDateCreation(intervention.getDateCreation());
        dto.setDatePlanifiee(intervention.getDateDemande());
        dto.setDateDebut(intervention.getDateDebutIntervention());
        dto.setDateFin(intervention.getDateFinIntervention());
        dto.setDateModification(intervention.getDerniereModification());
        
        dto.setDiagnostic(intervention.getDiagnosticTechnique());
        dto.setSolution(intervention.getSolutionAppliquee());
        dto.setCommentaireInterne(intervention.getObservations());
        dto.setRaisonAnnulation(""); // Pas encore implémenté dans l'entité
        
        dto.setNoteSatisfaction(intervention.getNoteSatisfaction());
        dto.setCommentaireSatisfaction(intervention.getCommentaireClient());
        
        // Relations
        if (intervention.getContrat() != null) {
            dto.setContratId(intervention.getContrat().getId());
            dto.setContratNumero(intervention.getContrat().getNumeroContrat());
        }
        
        if (intervention.getImprimante() != null) {
            dto.setImprimanteId(intervention.getImprimante().getId());
            dto.setImprimanteModele(intervention.getImprimante().getModele());
        }
        
        if (intervention.getDemandeur() != null) {
            dto.setDemandeurId(intervention.getDemandeur().getId());
            dto.setDemandeurNom(intervention.getDemandeur().getNom() + " " + intervention.getDemandeur().getPrenom());
        }
        
        if (intervention.getTechnicien() != null) {
            dto.setTechnicienId(intervention.getTechnicien().getId());
            dto.setTechnicienNom(intervention.getTechnicien().getNom() + " " + intervention.getTechnicien().getPrenom());
        }
        
        if (intervention.getModifiePar() != null) {
            dto.setModificateurId(intervention.getModifiePar().getId());
            dto.setModificateurNom(intervention.getModifiePar().getNom() + " " + intervention.getModifiePar().getPrenom());
        }
        
        // Ajouter les imprimantes associées
        if (intervention.getImprimantesAssociees() != null && !intervention.getImprimantesAssociees().isEmpty()) {
            dto.setImprimantesAssociees(
                intervention.getImprimantesAssociees().stream()
                    .map(imprimanteMapper::toDTO)
                    .collect(Collectors.toList())
            );
        }
        
        return dto;
    }

    public Intervention toEntity(InterventionCreateDTO createDTO) {
        if (createDTO == null) {
            return null;
        }

        Intervention intervention = new Intervention();
        intervention.setTitre(createDTO.getTitre());
        intervention.setDescription(createDTO.getDescription());
        intervention.setTypeIntervention(createDTO.getType());
        intervention.setPriorite(createDTO.getPriorite());
        intervention.setDateDemande(createDTO.getDatePlanifiee());
        
        return intervention;
    }

    public void updateEntityFromDTO(Intervention intervention, InterventionUpdateDTO updateDTO) {
        if (intervention == null || updateDTO == null) {
            return;
        }

        if (updateDTO.getTitre() != null) {
            intervention.setTitre(updateDTO.getTitre());
        }
        if (updateDTO.getDescription() != null) {
            intervention.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getType() != null) {
            intervention.setTypeIntervention(updateDTO.getType());
        }
        if (updateDTO.getPriorite() != null) {
            intervention.setPriorite(updateDTO.getPriorite());
        }
        if (updateDTO.getStatut() != null) {
            intervention.setStatutIntervention(updateDTO.getStatut());
        }
        if (updateDTO.getDatePlanifiee() != null) {
            intervention.setDateDemande(updateDTO.getDatePlanifiee());
        }
        if (updateDTO.getDiagnostic() != null) {
            intervention.setDiagnosticTechnique(updateDTO.getDiagnostic());
        }
        if (updateDTO.getSolution() != null) {
            intervention.setSolutionAppliquee(updateDTO.getSolution());
        }
        if (updateDTO.getCommentaireInterne() != null) {
            intervention.setObservations(updateDTO.getCommentaireInterne());
        }
    }
}
