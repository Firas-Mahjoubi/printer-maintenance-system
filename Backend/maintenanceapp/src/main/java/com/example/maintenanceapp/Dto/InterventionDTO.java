package com.example.maintenanceapp.Dto;

import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class InterventionDTO {
    private Long id;
    private String numero;
    private String titre;
    private String description;
    private TypeIntervention type;
    private PrioriteIntervention priorite;
    private StatutIntervention statut;
    
    private LocalDateTime dateCreation;
    private LocalDateTime datePlanifiee;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime dateModification;
    
    private String diagnostic;
    private String solution;
    private String commentaireInterne;
    private String raisonAnnulation;
    
    private Integer noteSatisfaction;
    private String commentaireSatisfaction;
    
    // Relations simplifiées
    private Long contratId;
    private String contratNumero;
    private Long imprimanteId;
    private String imprimanteModele;
    private Long demandeurId;
    private String demandeurNom;
    private Long technicienId;
    private String technicienNom;
    private Long modificateurId;
    private String modificateurNom;
    
    // Liste des imprimantes associées
    private List<ImprimanteDTO> imprimantesAssociees = new ArrayList<>();

    // Constructeurs
    public InterventionDTO() {}

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

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

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public LocalDateTime getDatePlanifiee() {
        return datePlanifiee;
    }

    public void setDatePlanifiee(LocalDateTime datePlanifiee) {
        this.datePlanifiee = datePlanifiee;
    }

    public LocalDateTime getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDateTime dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDateTime getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDateTime dateFin) {
        this.dateFin = dateFin;
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
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

    public String getRaisonAnnulation() {
        return raisonAnnulation;
    }

    public void setRaisonAnnulation(String raisonAnnulation) {
        this.raisonAnnulation = raisonAnnulation;
    }

    public Integer getNoteSatisfaction() {
        return noteSatisfaction;
    }

    public void setNoteSatisfaction(Integer noteSatisfaction) {
        this.noteSatisfaction = noteSatisfaction;
    }

    public String getCommentaireSatisfaction() {
        return commentaireSatisfaction;
    }

    public void setCommentaireSatisfaction(String commentaireSatisfaction) {
        this.commentaireSatisfaction = commentaireSatisfaction;
    }

    public Long getContratId() {
        return contratId;
    }

    public void setContratId(Long contratId) {
        this.contratId = contratId;
    }

    public String getContratNumero() {
        return contratNumero;
    }

    public void setContratNumero(String contratNumero) {
        this.contratNumero = contratNumero;
    }

    public Long getImprimanteId() {
        return imprimanteId;
    }

    public void setImprimanteId(Long imprimanteId) {
        this.imprimanteId = imprimanteId;
    }

    public String getImprimanteModele() {
        return imprimanteModele;
    }

    public void setImprimanteModele(String imprimanteModele) {
        this.imprimanteModele = imprimanteModele;
    }

    public Long getDemandeurId() {
        return demandeurId;
    }

    public void setDemandeurId(Long demandeurId) {
        this.demandeurId = demandeurId;
    }

    public String getDemandeurNom() {
        return demandeurNom;
    }

    public void setDemandeurNom(String demandeurNom) {
        this.demandeurNom = demandeurNom;
    }

    public Long getTechnicienId() {
        return technicienId;
    }

    public void setTechnicienId(Long technicienId) {
        this.technicienId = technicienId;
    }

    public String getTechnicienNom() {
        return technicienNom;
    }

    public void setTechnicienNom(String technicienNom) {
        this.technicienNom = technicienNom;
    }

    public Long getModificateurId() {
        return modificateurId;
    }

    public void setModificateurId(Long modificateurId) {
        this.modificateurId = modificateurId;
    }

    public String getModificateurNom() {
        return modificateurNom;
    }

    public void setModificateurNom(String modificateurNom) {
        this.modificateurNom = modificateurNom;
    }

    public List<ImprimanteDTO> getImprimantesAssociees() {
        return imprimantesAssociees;
    }

    public void setImprimantesAssociees(List<ImprimanteDTO> imprimantesAssociees) {
        this.imprimantesAssociees = imprimantesAssociees;
    }
}
