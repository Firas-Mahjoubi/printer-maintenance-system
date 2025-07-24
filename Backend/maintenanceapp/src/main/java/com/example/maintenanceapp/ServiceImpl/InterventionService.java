package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Dto.InterventionCreateDTO;
import com.example.maintenanceapp.Dto.InterventionDTO;
import com.example.maintenanceapp.Dto.InterventionUpdateDTO;
import com.example.maintenanceapp.Dto.InterventionHistoriqueDTO;
import com.example.maintenanceapp.Entity.Intervention;
import com.example.maintenanceapp.Entity.InterventionHistorique;
import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Entity.Enum.ImprimanteStatus;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Mapper.InterventionMapper;
import com.example.maintenanceapp.Repositories.InterventionRepositorie;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.Repositorie.InterventionHistoriqueRepositorie;
import com.example.maintenanceapp.ServiceInterface.IInterventionService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class InterventionService implements IInterventionService {
    
    InterventionRepositorie interventionRepositorie;
    UtilisateurRepositorie utilisateurRepositorie;
    ContratRepositorie contratRepositorie;
    ImprimanteRepositorie imprimanteRepositorie;
    InterventionMapper interventionMapper;
    NotificationService notificationService;
    InterventionHistoriqueRepositorie interventionHistoriqueRepositorie;
    com.example.maintenanceapp.Service.EmailService emailService;

    @Override
    public List<Intervention> findAll() {
        return interventionRepositorie.findAll();
    }

    @Override
    public Intervention findById(Long id) {
        return interventionRepositorie.findById(id).orElse(null);
    }

    @Override
    public Intervention save(Intervention intervention, Long demandeurId) {
        Utilisateur demandeur = utilisateurRepositorie.findById(demandeurId).orElse(null);
        if (demandeur != null) {
            intervention.setDemandeur(demandeur);
        }
        intervention.setDateCreation(LocalDateTime.now());
        intervention.setDerniereModification(LocalDateTime.now());
        
        if (intervention.getNumeroTicket() == null || intervention.getNumeroTicket().isEmpty()) {
            intervention.setNumeroTicket(genererNumeroTicket());
        }
        
        if (intervention.getStatutIntervention() == null) {
            intervention.setStatutIntervention(StatutIntervention.EN_ATTENTE);
        }
        
        Intervention saved = interventionRepositorie.save(intervention);
        envoyerNotificationNouveauTicket(saved);
        
        log.info("Nouveau ticket créé: {} par utilisateur {}", saved.getNumeroTicket(), demandeurId);
        return saved;
    }

    @Override
    public Intervention update(Long id, Intervention intervention, Long modificateurId) {
        Intervention existing = interventionRepositorie.findById(id).orElse(null);
        if (existing == null) return null;
        
        // Mise à jour des champs modifiables
        existing.setTitre(intervention.getTitre());
        existing.setDescription(intervention.getDescription());
        existing.setSymptomes(intervention.getSymptomes());
        existing.setPriorite(intervention.getPriorite());
        existing.setDateDemande(intervention.getDateDemande());
        existing.setCoutEstime(intervention.getCoutEstime());
        existing.setDerniereModification(LocalDateTime.now());
        
        Utilisateur modificateur = utilisateurRepositorie.findById(modificateurId).orElse(null);
        existing.setModifiePar(modificateur);
        
        return interventionRepositorie.save(existing);
    }

    @Override
    public void delete(Long id) {
        interventionRepositorie.deleteById(id);
    }

    @Override
    public Intervention creerTicket(Intervention intervention, Long demandeurId, Long contratId, Long imprimanteId) {
        // Associer le demandeur
        Utilisateur demandeur = utilisateurRepositorie.findById(demandeurId).orElse(null);
        if (demandeur == null) {
            throw new RuntimeException("Demandeur non trouvé");
        }
        intervention.setDemandeur(demandeur);
        
        // Associer le contrat
        if (contratId != null) {
            Contrat contrat = contratRepositorie.findById(contratId).orElse(null);
            intervention.setContrat(contrat);
        }
        
        // Associer l'imprimante
        Imprimante imprimante = null;
        if (imprimanteId != null) {
            imprimante = imprimanteRepositorie.findById(imprimanteId).orElse(null);
            intervention.setImprimante(imprimante);
            
            // Update printer status to EN_MAINTENANCE
            if (imprimante != null) {
                imprimante.setStatus(ImprimanteStatus.EN_MAINTENANCE);
                imprimanteRepositorie.save(imprimante);
                log.info("Printer status updated to EN_MAINTENANCE for printer ID: {}", imprimanteId);
            }
        }
        
        // Initialiser les valeurs par défaut
        intervention.setNumeroTicket(genererNumeroTicket());
        intervention.setStatutIntervention(StatutIntervention.EN_ATTENTE);
        intervention.setDateCreation(LocalDateTime.now());
        intervention.setDerniereModification(LocalDateTime.now());
        
        Intervention saved = interventionRepositorie.save(intervention);
        envoyerNotificationNouveauTicket(saved);
        
        log.info("Ticket créé: {} pour imprimante {} par {}", 
                saved.getNumeroTicket(), imprimanteId, demandeur.getNom());
        return saved;
    }

    @Override
    public Intervention assignerTechnicien(Long interventionId, Long technicienId) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
        if (technicien == null) return null;
        
        intervention.setTechnicien(technicien);
        intervention.setDerniereModification(LocalDateTime.now());
        
        if (intervention.getStatutIntervention() == StatutIntervention.EN_ATTENTE) {
            intervention.setStatutIntervention(StatutIntervention.PLANIFIEE);
        }
        
        Intervention saved = interventionRepositorie.save(intervention);
        envoyerNotificationAssignation(saved);
        
        log.info("Technicien {} assigné au ticket {}", technicien.getNom(), saved.getNumeroTicket());
        return saved;
    }

    @Override
    public Intervention changerStatut(Long interventionId, StatutIntervention nouveauStatut, Long utilisateurId) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        StatutIntervention ancienStatut = intervention.getStatutIntervention();
        intervention.setStatutIntervention(nouveauStatut);
        intervention.setDerniereModification(LocalDateTime.now());
        
        Utilisateur utilisateur = utilisateurRepositorie.findById(utilisateurId).orElse(null);
        intervention.setModifiePar(utilisateur);
        
        // Update printer status based on intervention status
        updatePrinterStatus(intervention, nouveauStatut);
        
        Intervention saved = interventionRepositorie.save(intervention);
        envoyerNotificationChangementStatut(saved);
        
        log.info("Statut du ticket {} changé de {} à {}", 
                saved.getNumeroTicket(), ancienStatut, nouveauStatut);
        return saved;
    }
    
    /**
     * Updates the printer status based on the intervention status
     */
    private void updatePrinterStatus(Intervention intervention, StatutIntervention statutIntervention) {
        log.info("Beginning printer status update for intervention ID: {}, status: {}", intervention.getId(), statutIntervention);
        
        Imprimante imprimante = intervention.getImprimante();
        if (imprimante == null) {
            log.warn("No primary printer associated with intervention ID: {}. Checking for associated printers.", intervention.getId());
            
            // Try to update associated printers even if primary is null
            if (intervention.getImprimantesAssociees() != null && !intervention.getImprimantesAssociees().isEmpty()) {
                log.info("Found {} associated printers for intervention ID: {}", 
                        intervention.getImprimantesAssociees().size(), intervention.getId());
                updateAssociatedPrintersStatus(intervention, statutIntervention);
                return;
            } else {
                log.warn("No printers (primary or associated) found for intervention ID: {}", intervention.getId());
                return;
            }
        }
        
        ImprimanteStatus oldStatus = imprimante.getStatus();
        ImprimanteStatus newStatus;
        
        switch (statutIntervention) {
            case TERMINEE:
            case ANNULEE:
                // Reset printer to active status when intervention is complete or cancelled
                newStatus = ImprimanteStatus.ACTIF;
                log.info("Printer {} status changing from {} to {} due to intervention {} status change to {}", 
                        imprimante.getId(), oldStatus, newStatus, intervention.getId(), statutIntervention);
                break;
                
            case REJETEE:
                // Mark printer as out of service when intervention is rejected
                newStatus = ImprimanteStatus.HORS_SERVICE;
                log.info("Printer {} status changing from {} to {} due to intervention {} status change to REJETEE", 
                        imprimante.getId(), oldStatus, newStatus, intervention.getId());
                break;
                
            case EN_COURS:
                // Mark printer as in maintenance when technician starts working on it
                newStatus = ImprimanteStatus.EN_MAINTENANCE;
                log.info("Printer {} status changing from {} to {} due to intervention {} status change to EN_COURS", 
                        imprimante.getId(), oldStatus, newStatus, intervention.getId());
                break;
                
            case EN_ATTENTE:
            case PLANIFIEE:
                // Mark printer as in trouble but not yet in maintenance
                newStatus = ImprimanteStatus.EN_PANNE;
                log.info("Printer {} status changing from {} to {} due to intervention {} waiting status", 
                        imprimante.getId(), oldStatus, newStatus, intervention.getId());
                break;
                
            case ATTENTE_PIECES:
            case ATTENTE_CLIENT:
            case EN_PAUSE:
                // These statuses mean intervention has started but is paused, keep in maintenance
                newStatus = ImprimanteStatus.EN_MAINTENANCE;
                log.info("Printer {} status changing from {} to {} due to intervention {} paused status", 
                        imprimante.getId(), oldStatus, newStatus, intervention.getId());
                break;
                
            default:
                // No status change for other intervention statuses
                log.info("No status change needed for intervention status: {}", statutIntervention);
                return;
        }
        
        // Save the updated printer status
        imprimante.setStatus(newStatus);
        imprimanteRepositorie.save(imprimante);
        log.info("Primary printer {} status updated from {} to {}", imprimante.getId(), oldStatus, newStatus);
        
        // Also update associated printers if any
        updateAssociatedPrintersStatus(intervention, statutIntervention);
    }
    
    /**
     * Updates the status of all printers associated with an intervention
     */
    private void updateAssociatedPrintersStatus(Intervention intervention, StatutIntervention statutIntervention) {
        if (intervention.getImprimantesAssociees() == null || intervention.getImprimantesAssociees().isEmpty()) {
            log.debug("No associated printers to update for intervention ID: {}", intervention.getId());
            return;
        }
        
        log.info("Updating status for {} associated printers for intervention ID: {}", 
                intervention.getImprimantesAssociees().size(), intervention.getId());
        
        for (Imprimante associatedPrinter : intervention.getImprimantesAssociees()) {
            ImprimanteStatus oldStatus = associatedPrinter.getStatus();
            ImprimanteStatus newStatus;
            
            switch (statutIntervention) {
                case TERMINEE:
                case ANNULEE:
                    newStatus = ImprimanteStatus.ACTIF;
                    break;
                case REJETEE:
                    newStatus = ImprimanteStatus.HORS_SERVICE;
                    break;
                case EN_COURS:
                    newStatus = ImprimanteStatus.EN_MAINTENANCE;
                    break;
                case EN_ATTENTE:
                case PLANIFIEE:
                    newStatus = ImprimanteStatus.EN_PANNE;
                    break;
                case ATTENTE_PIECES:
                case ATTENTE_CLIENT:
                case EN_PAUSE:
                    newStatus = ImprimanteStatus.EN_MAINTENANCE;
                    break;
                default:
                    // Skip update for other statuses
                    log.info("No status change for associated printer {} with intervention status {}", 
                            associatedPrinter.getId(), statutIntervention);
                    continue;
            }
            
            associatedPrinter.setStatus(newStatus);
            imprimanteRepositorie.save(associatedPrinter);
            log.info("Associated printer {} status updated from {} to {}", associatedPrinter.getId(), oldStatus, newStatus);
        }
    }

    @Override
    public Intervention planifierIntervention(Long interventionId, LocalDateTime datePlanifiee, Long technicienId) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        intervention.setDateDemande(datePlanifiee);
        intervention.setStatutIntervention(StatutIntervention.PLANIFIEE);
        intervention.setDerniereModification(LocalDateTime.now());
        
        if (technicienId != null) {
            Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
            intervention.setTechnicien(technicien);
        }
        
        return interventionRepositorie.save(intervention);
    }

    @Override
    public Intervention commencerIntervention(Long interventionId, Long technicienId) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        intervention.setStatutIntervention(StatutIntervention.EN_COURS);
        intervention.setDateDebutIntervention(LocalDateTime.now());
        intervention.setDerniereModification(LocalDateTime.now());
        
        if (technicienId != null) {
            Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
            intervention.setTechnicien(technicien);
        }
        
        // Update printer status to EN_MAINTENANCE
        updatePrinterStatus(intervention, StatutIntervention.EN_COURS);
        
        return interventionRepositorie.save(intervention);
    }

    @Override
    public Intervention terminerIntervention(Long interventionId, String diagnostic, String solution, 
                                           String observations, Double coutReel, Long technicienId) {
        Intervention intervention = interventionRepositorie.findById(interventionId)
            .orElseThrow(() -> new RuntimeException("Intervention non trouvée"));
        
        // Vérification des conditions préalables
        if (intervention.getStatutIntervention() != StatutIntervention.EN_COURS) {
            throw new RuntimeException("L'intervention doit être en cours pour être terminée");
        }
        
        // Récupérer l'utilisateur qui effectue l'action
        Utilisateur utilisateur = utilisateurRepositorie.findById(technicienId)
            .orElse(null);
        
        // Si l'utilisateur n'est pas trouvé, on continue quand même
        // Autoriser si c'est un admin ou le technicien assigné
        boolean isAdmin = utilisateur != null && utilisateur.getRole() == Role.ADMIN;
        boolean isAssignedTechnician = intervention.getTechnicien() != null && 
                                      intervention.getTechnicien().getId() == technicienId;
        
        if (!isAdmin && !isAssignedTechnician && utilisateur != null) {
            throw new RuntimeException("Seul le technicien assigné ou un administrateur peut terminer cette intervention");
        }
        
        // Validation des champs - fournir des valeurs par défaut si nécessaire
        if (diagnostic == null || diagnostic.trim().isEmpty()) {
            diagnostic = "Intervention terminée";
        }
        
        if (solution == null || solution.trim().isEmpty()) {
            solution = "Problème résolu";
        }
        
        // Enregistrer l'ancien état pour l'historique
        StatutIntervention statutPrecedent = intervention.getStatutIntervention();
        
        // Mettre à jour l'intervention
        intervention.setStatutIntervention(StatutIntervention.TERMINEE);
        intervention.setDateFinIntervention(LocalDateTime.now());
        intervention.setDiagnosticTechnique(diagnostic);
        intervention.setSolutionAppliquee(solution);
        intervention.setObservations(observations);
        intervention.setCoutReel(coutReel);
        intervention.setDerniereModification(LocalDateTime.now());
        
        Utilisateur technicien = utilisateurRepositorie.findById(technicienId)
            .orElse(null);
        intervention.setModifiePar(technicien);
        
        // Mettre à jour le statut de l'imprimante
        updatePrinterStatus(intervention, StatutIntervention.TERMINEE);
        
        // Enregistrer l'intervention
        Intervention savedIntervention = interventionRepositorie.save(intervention);
        
        // Créer l'historique
        InterventionHistorique historique = new InterventionHistorique();
        historique.setIntervention(savedIntervention);
        historique.setUtilisateur(technicien); // May be null, but that's okay
        historique.setAncienStatut(statutPrecedent);
        historique.setNouveauStatut(StatutIntervention.TERMINEE);
        historique.setAction("Intervention terminée");
        historique.setCommentaire("Diagnostic: " + diagnostic + "\nSolution: " + solution + 
                                  (observations != null ? "\nObservations: " + observations : "") + 
                                  (coutReel != null ? "\nCoût réel: " + coutReel + " €" : ""));
        
        interventionHistoriqueRepositorie.save(historique);
        
        // Envoyer une notification au client
        notifierInterventionTerminee(savedIntervention);
        
        log.info("Intervention {} terminée par technicien {}", interventionId, technicienId);
        return savedIntervention;
    }
    
    /**
     * Notifier le client que l'intervention est terminée
     */
    private void notifierInterventionTerminee(Intervention intervention) {
        try {
            if (intervention.getDemandeur() != null && intervention.getDemandeur().getEmail() != null) {
                String sujet = "Intervention terminée - " + intervention.getNumeroTicket();
                
                try {
                    // Essayer d'envoyer un email HTML plus détaillé
                    String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                        "<div style='background-color: #4f46e5; color: white; padding: 20px; text-align: center;'>" +
                        "<h2>Intervention terminée</h2>" +
                        "</div>" +
                        "<div style='padding: 20px; border: 1px solid #e0e0e0; background-color: #f9f9f9;'>" +
                        "<p>Bonjour " + intervention.getDemandeur().getPrenom() + ",</p>" +
                        "<p>Nous vous informons que votre intervention <strong>" + intervention.getNumeroTicket() + "</strong> a été terminée avec succès.</p>" +
                        "<div style='background-color: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 15px 0;'>" +
                        "<h3 style='margin-top: 0; color: #333;'>Détails de l'intervention</h3>" +
                        "<p><strong>Titre:</strong> " + intervention.getTitre() + "</p>" +
                        "<p><strong>Diagnostic:</strong> " + intervention.getDiagnosticTechnique() + "</p>" +
                        "<p><strong>Solution appliquée:</strong> " + intervention.getSolutionAppliquee() + "</p>" +
                        (intervention.getObservations() != null ? "<p><strong>Observations:</strong> " + intervention.getObservations() + "</p>" : "") +
                        "</div>" +
                        "<p>Nous vous invitons à évaluer la qualité de cette intervention en vous connectant à votre espace client.</p>" +
                        "<p>Merci de votre confiance,</p>" +
                        "<p>L'équipe de maintenance</p>" +
                        "</div>" +
                        "</div>";
                    
                    emailService.sendHtmlEmail(intervention.getDemandeur().getEmail(), sujet, htmlContent);
                } catch (Exception e) {
                    // En cas d'échec, envoyer un email simple comme fallback
                    String contenu = "Bonjour " + intervention.getDemandeur().getPrenom() + ",\n\n" +
                            "Nous vous informons que votre intervention " + intervention.getNumeroTicket() + 
                            " a été terminée avec succès.\n\n" +
                            "Diagnostic: " + intervention.getDiagnosticTechnique() + "\n" +
                            "Solution appliquée: " + intervention.getSolutionAppliquee() + "\n" +
                            (intervention.getObservations() != null ? "Observations: " + intervention.getObservations() + "\n\n" : "\n") +
                            "Nous vous invitons à évaluer la qualité de cette intervention en vous connectant à votre espace client.\n\n" +
                            "Merci de votre confiance,\n" +
                            "L'équipe de maintenance";
                    
                    emailService.sendEmail(intervention.getDemandeur().getEmail(), sujet, contenu);
                }
                
                log.info("Notification d'intervention terminée envoyée au client {}", intervention.getDemandeur().getEmail());
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification d'intervention terminée: {}", e.getMessage());
        }
    }

    @Override
    public Intervention annulerIntervention(Long interventionId, String raison, Long utilisateurId) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        intervention.setStatutIntervention(StatutIntervention.ANNULEE);
        intervention.setObservations(raison);
        intervention.setDateCloture(LocalDateTime.now());
        intervention.setDerniereModification(LocalDateTime.now());
        
        Utilisateur utilisateur = utilisateurRepositorie.findById(utilisateurId).orElse(null);
        intervention.setModifiePar(utilisateur);
        
        // Update printer status to ACTIF
        updatePrinterStatus(intervention, StatutIntervention.ANNULEE);
        
        return interventionRepositorie.save(intervention);
    }

    @Override
    public List<Intervention> findByStatut(StatutIntervention statut) {
        return interventionRepositorie.findByStatutInterventionOrderByDateCreationDesc(statut);
    }

    @Override
    public List<Intervention> findByType(TypeIntervention type) {
        return interventionRepositorie.findByTypeInterventionOrderByDateCreationDesc(type);
    }

    @Override
    public List<Intervention> findByPriorite(PrioriteIntervention priorite) {
        return interventionRepositorie.findByPrioriteOrderByDateCreationDesc(priorite);
    }

    @Override
    public List<Intervention> findByTechnicien(Long technicienId) {
        return interventionRepositorie.findByTechnicien_IdOrderByDateCreationDesc(technicienId);
    }

    @Override
    public List<Intervention> findByDemandeur(Long demandeurId) {
        return interventionRepositorie.findByDemandeur_IdOrderByDateCreationDesc(demandeurId);
    }

    @Override
    public List<Intervention> findByContrat(Long contratId) {
        return interventionRepositorie.findByContrat_IdOrderByDateCreationDesc(contratId);
    }

    @Override
    public List<Intervention> findByImprimante(Long imprimanteId) {
        return interventionRepositorie.findByImprimante_IdOrderByDateCreationDesc(imprimanteId);
    }

    @Override
    public List<Intervention> rechercherInterventions(String recherche) {
        return interventionRepositorie.rechercherInterventions(recherche);
    }

    @Override
    public List<Intervention> getInterventionsUrgentes() {
        return interventionRepositorie.findInterventionsUrgentes();
    }

    @Override
    public List<Intervention> getInterventionsEnRetard() {
        return interventionRepositorie.findInterventionsEnRetard(LocalDateTime.now());
    }

    @Override
    public List<Intervention> getInterventionsPlanifiees(LocalDateTime dateDebut, LocalDateTime dateFin) {
        return interventionRepositorie.findInterventionsPlanifiees(dateDebut, dateFin);
    }

    @Override
    public List<Intervention> getInterventionsEnCours(Long technicienId) {
        List<StatutIntervention> statutsEnCours = List.of(
            StatutIntervention.EN_COURS, 
            StatutIntervention.PLANIFIEE
        );
        return interventionRepositorie.findByTechnicien_IdAndStatutInterventionInOrderByPrioriteDesc(
            technicienId, statutsEnCours);
    }

    @Override
    public Map<StatutIntervention, Long> getStatistiquesParStatut() {
        List<Object[]> results = interventionRepositorie.getStatistiquesParStatut();
        Map<StatutIntervention, Long> stats = new HashMap<>();
        
        for (Object[] result : results) {
            StatutIntervention statut = (StatutIntervention) result[0];
            Long count = (Long) result[1];
            stats.put(statut, count);
        }
        
        return stats;
    }

    @Override
    public Map<TypeIntervention, Long> getStatistiquesParType() {
        List<Object[]> results = interventionRepositorie.getStatistiquesParType();
        Map<TypeIntervention, Long> stats = new HashMap<>();
        
        for (Object[] result : results) {
            TypeIntervention type = (TypeIntervention) result[0];
            Long count = (Long) result[1];
            stats.put(type, count);
        }
        
        return stats;
    }

    @Override
    public Map<PrioriteIntervention, Long> getStatistiquesParPriorite() {
        List<Intervention> all = interventionRepositorie.findAll();
        return all.stream()
                .collect(Collectors.groupingBy(
                    Intervention::getPriorite,
                    Collectors.counting()
                ));
    }

    @Override
    public String genererNumeroTicket() {
        String prefixe = "TICK";
        String annee = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        
        // Compter les tickets de l'année
        long count = interventionRepositorie.findAll().stream()
                .filter(i -> i.getNumeroTicket() != null && i.getNumeroTicket().contains(annee))
                .count();
        
        return String.format("%s-%s-%03d", prefixe, annee, count + 1);
    }

    @Override
    public Double calculerCoutMoyenParType(TypeIntervention type) {
        List<Intervention> interventions = findByType(type);
        return interventions.stream()
                .filter(i -> i.getCoutReel() != null)
                .mapToDouble(Intervention::getCoutReel)
                .average()
                .orElse(0.0);
    }

    @Override
    public List<Intervention> getHistoriqueIntervention(Long imprimanteId) {
        return interventionRepositorie.findByImprimante_IdOrderByDateCreationDesc(imprimanteId);
    }

    @Override
    public void envoyerNotificationNouveauTicket(Intervention intervention) {
        // À implémenter avec le service de notification
        log.info("Notification nouveau ticket: {}", intervention.getNumeroTicket());
    }

    @Override
    public void envoyerNotificationAssignation(Intervention intervention) {
        // À implémenter avec le service de notification
        log.info("Notification assignation ticket: {} à {}", 
                intervention.getNumeroTicket(), 
                intervention.getTechnicien() != null ? intervention.getTechnicien().getNom() : "N/A");
    }

    @Override
    public void envoyerNotificationChangementStatut(Intervention intervention) {
        // À implémenter avec le service de notification
        log.info("Notification changement statut: {} -> {}", 
                intervention.getNumeroTicket(), 
                intervention.getStatutIntervention());
    }

    @Override
    public Intervention evaluerSatisfaction(Long interventionId, Integer note, String commentaire) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        intervention.setNoteSatisfaction(note);
        intervention.setCommentaireClient(commentaire);
        intervention.setDerniereModification(LocalDateTime.now());
        
        return interventionRepositorie.save(intervention);
    }

    // ====================== IMPLÉMENTATIONS DTO ======================
    
    @Override
    public InterventionDTO creerIntervention(InterventionCreateDTO createDTO) {
        try {
            Intervention intervention = interventionMapper.toEntity(createDTO);
            
            // Récupération des entités liées
            Utilisateur demandeur = utilisateurRepositorie.findById(createDTO.getDemandeurId()).orElse(null);
            Contrat contrat = contratRepositorie.findById(createDTO.getContratId()).orElse(null);
            Imprimante imprimante = createDTO.getImprimanteId() != null ? 
                imprimanteRepositorie.findById(createDTO.getImprimanteId()).orElse(null) : null;
            Utilisateur technicien = createDTO.getTechnicienId() != null ?
                utilisateurRepositorie.findById(createDTO.getTechnicienId()).orElse(null) : null;
            
            if (demandeur == null || contrat == null) {
                throw new RuntimeException("Demandeur ou contrat non trouvé");
            }
            
            // Configuration de l'intervention
            intervention.setDemandeur(demandeur);
            intervention.setContrat(contrat);
            intervention.setImprimante(imprimante);
            intervention.setTechnicien(technicien);
            intervention.setStatutIntervention(StatutIntervention.EN_ATTENTE);
            intervention.setDateCreation(LocalDateTime.now());
            intervention.setNumeroTicket(genererNumeroTicket());
            
            // Update printer status to EN_PANNE
            if (imprimante != null) {
                imprimante.setStatus(ImprimanteStatus.EN_PANNE);
                imprimanteRepositorie.save(imprimante);
                log.info("Printer status updated to EN_PANNE for printer ID: {}", imprimante.getId());
            }
            
            Intervention saved = interventionRepositorie.save(intervention);
            
            // Notification
            envoyerNotificationNouveauTicket(saved);
            
            return interventionMapper.toDTO(saved);
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'intervention: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la création de l'intervention", e);
        }
    }
    
    @Override
    public InterventionDTO obtenirInterventionParId(Long id) {
        Intervention intervention = interventionRepositorie.findById(id).orElse(null);
        return intervention != null ? interventionMapper.toDTO(intervention) : null;
    }
    
    @Override
    public InterventionDTO obtenirInterventionParNumero(String numero) {
        Intervention intervention = interventionRepositorie.findByNumeroTicket(numero).orElse(null);
        return intervention != null ? interventionMapper.toDTO(intervention) : null;
    }
    
    @Override
    public InterventionDTO mettreAJourIntervention(Long id, InterventionUpdateDTO updateDTO) {
        try {
            Intervention intervention = interventionRepositorie.findById(id).orElse(null);
            if (intervention == null) {
                throw new RuntimeException("Intervention non trouvée");
            }
            
            interventionMapper.updateEntityFromDTO(intervention, updateDTO);
            intervention.setDerniereModification(LocalDateTime.now());
            
            // Mise à jour des relations si nécessaire
            if (updateDTO.getContratId() != null) {
                Contrat contrat = contratRepositorie.findById(updateDTO.getContratId()).orElse(null);
                intervention.setContrat(contrat);
            }
            if (updateDTO.getImprimanteId() != null) {
                Imprimante imprimante = imprimanteRepositorie.findById(updateDTO.getImprimanteId()).orElse(null);
                intervention.setImprimante(imprimante);
            }
            if (updateDTO.getTechnicienId() != null) {
                Utilisateur technicien = utilisateurRepositorie.findById(updateDTO.getTechnicienId()).orElse(null);
                intervention.setTechnicien(technicien);
            }
            
            Intervention saved = interventionRepositorie.save(intervention);
            return interventionMapper.toDTO(saved);
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de l'intervention: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la mise à jour de l'intervention", e);
        }
    }
    
    @Override
    public void supprimerIntervention(Long id) {
        try {
            // First, delete any historical records linked to this intervention
            List<InterventionHistorique> historiques = interventionHistoriqueRepositorie.findByInterventionIdOrderByDateActionAsc(id);
            if (historiques != null && !historiques.isEmpty()) {
                interventionHistoriqueRepositorie.deleteAll(historiques);
            }
            
            // Now it's safe to delete the intervention itself
            interventionRepositorie.deleteById(id);
            
            log.info("Intervention avec ID {} et ses historiques supprimés avec succès", id);
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de l'intervention ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Erreur lors de la suppression de l'intervention", e);
        }
    }
    
    @Override
    public Page<InterventionDTO> obtenirInterventionsFiltrees(
            StatutIntervention statut, TypeIntervention type, PrioriteIntervention priorite,
            Long technicienId, Long demandeurId, Long contratId,
            LocalDate dateDebut, LocalDate dateFin, Pageable pageable) {
        
        // Pour l'instant, utilisons une requête simple sans filtres complexes
        // TODO: Implémenter les filtres de manière plus robuste
        Page<Intervention> interventions;
        
        if (type != null && statut != null) {
            // Si nous avons à la fois le type et le statut, utiliser la méthode qui filtre sur les deux
            interventions = interventionRepositorie.findByTypeInterventionAndStatutInterventionOrderByDatePlanifieeDesc(
                type, statut, pageable);
        } else if (statut != null) {
            interventions = interventionRepositorie.findByStatutInterventionOrderByDateCreationDesc(statut, pageable);
        } else if (type != null) {
            interventions = interventionRepositorie.findByTypeInterventionOrderByDateCreationDesc(type, pageable);
        } else if (priorite != null) {
            interventions = interventionRepositorie.findByPrioriteOrderByDateCreationDesc(priorite, pageable);
        } else {
            // Aucun filtre - retourner toutes les interventions
            interventions = interventionRepositorie.findAllByOrderByDateCreationDesc(pageable);
        }
        
        return interventions.map(interventionMapper::toDTO);
    }
    
    @Override
    public List<InterventionDTO> obtenirInterventionsParTechnicien(Long technicienId, StatutIntervention statut) {
        List<Intervention> interventions;
        if (statut != null) {
            interventions = interventionRepositorie.findByTechnicien_IdAndStatutInterventionInOrderByPrioriteDesc(
                technicienId, List.of(statut));
        } else {
            interventions = interventionRepositorie.findByTechnicien_IdOrderByDateCreationDesc(technicienId);
        }
        return interventions.stream()
                .map(interventionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<InterventionDTO> obtenirInterventionsUrgentes() {
        List<Intervention> interventions = getInterventionsUrgentes();
        return interventions.stream()
                .map(interventionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<InterventionDTO> obtenirInterventionsEnRetard() {
        List<Intervention> interventions = getInterventionsEnRetard();
        return interventions.stream()
                .map(interventionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public Map<String, Object> obtenirStatistiques(LocalDate dateDebut, LocalDate dateFin) {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime dateDebutTime = dateDebut != null ? dateDebut.atStartOfDay() : null;
        LocalDateTime dateFinTime = dateFin != null ? dateFin.atTime(23, 59, 59) : null;
        
        // Statistiques par statut
        stats.put("parStatut", getStatistiquesParStatut());
        stats.put("parType", getStatistiquesParType());
        stats.put("parPriorite", getStatistiquesParPriorite());
        
        // Statistiques temporelles si dates spécifiées
        if (dateDebutTime != null && dateFinTime != null) {
            List<Intervention> interventionsPeriode = interventionRepositorie
                .findByDateCreationBetween(dateDebutTime, dateFinTime);
            
            stats.put("totalPeriode", interventionsPeriode.size());
            stats.put("tempsResolutionMoyen", calculerTempsResolutionMoyen(interventionsPeriode));
        }
        
        return stats;
    }
    
    @Override
    public InterventionDTO assignerTechnicien(Long interventionId, Long technicienId, Long assignateurId) {
        try {
            Intervention intervention = assignerTechnicien(interventionId, technicienId);
            if (intervention != null) {
                // Enregistrer qui a fait l'assignation
                Utilisateur assignateur = utilisateurRepositorie.findById(assignateurId).orElse(null);
                intervention.setModifiePar(assignateur);
                intervention.setDerniereModification(LocalDateTime.now());
                intervention = interventionRepositorie.save(intervention);
                
                envoyerNotificationAssignation(intervention);
                return interventionMapper.toDTO(intervention);
            }
            throw new RuntimeException("Erreur lors de l'assignation");
        } catch (Exception e) {
            log.error("Erreur lors de l'assignation: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'assignation", e);
        }
    }
    
    @Override
    public InterventionDTO demarrerIntervention(Long interventionId, Long technicienId) {
        try {
            Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
            if (intervention == null) {
                throw new RuntimeException("Intervention non trouvée");
            }
            
            StatutIntervention ancienStatut = intervention.getStatutIntervention();
            intervention.setStatutIntervention(StatutIntervention.EN_COURS);
            intervention.setDateDebutIntervention(LocalDateTime.now());
            intervention.setDerniereModification(LocalDateTime.now());
            
            if (technicienId != null) {
                Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
                intervention.setTechnicien(technicien);
                intervention.setModifiePar(technicien);
                
                intervention = interventionRepositorie.save(intervention);
                
                // Update printer status to EN_MAINTENANCE when intervention starts
                updatePrinterStatus(intervention, StatutIntervention.EN_COURS);
                
                // Enregistrer l'action dans l'historique
                enregistrerActionHistorique(intervention, ancienStatut, StatutIntervention.EN_COURS, 
                                          "Démarrage de l'intervention", null, technicien);
            } else {
                intervention = interventionRepositorie.save(intervention);
                
                // Update printer status even if no technician is assigned
                updatePrinterStatus(intervention, StatutIntervention.EN_COURS);
            }
            
            return interventionMapper.toDTO(intervention);
        } catch (Exception e) {
            log.error("Erreur lors du démarrage: {}", e.getMessage());
            throw new RuntimeException("Erreur lors du démarrage", e);
        }
    }
    
    @Override
    public InterventionDTO mettreEnPause(Long interventionId, Long technicienId, String raisonPause) {
        try {
            Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
            if (intervention == null) {
                throw new RuntimeException("Intervention non trouvée");
            }
            
            StatutIntervention ancienStatut = intervention.getStatutIntervention();
            intervention.setStatutIntervention(StatutIntervention.EN_PAUSE);
            intervention.setDerniereModification(LocalDateTime.now());
            
            Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
            intervention.setModifiePar(technicien);
            
            // Ajouter la raison de pause dans les observations
            String observation = intervention.getObservations() != null ? intervention.getObservations() : "";
            intervention.setObservations(observation + "\nMise en pause: " + raisonPause);
            
            intervention = interventionRepositorie.save(intervention);
            
            // Enregistrer l'action dans l'historique
            enregistrerActionHistorique(intervention, ancienStatut, StatutIntervention.EN_PAUSE, 
                                      "Mise en pause", raisonPause, technicien);
            
            return interventionMapper.toDTO(intervention);
        } catch (Exception e) {
            log.error("Erreur lors de la mise en pause: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la mise en pause", e);
        }
    }
    
    @Override
    public InterventionDTO reprendreIntervention(Long interventionId, Long technicienId) {
        try {
            Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
            if (intervention == null) {
                throw new RuntimeException("Intervention non trouvée");
            }
            
            StatutIntervention ancienStatut = intervention.getStatutIntervention();
            intervention.setStatutIntervention(StatutIntervention.EN_COURS);
            intervention.setDerniereModification(LocalDateTime.now());
            
            Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
            intervention.setModifiePar(technicien);
            
            // Remove [PAUSED] markers from observations
            String observations = intervention.getObservations();
            if (observations != null) {
                // Remove lines containing [PAUSED] marker
                observations = observations.replaceAll("(?m)^.*\\[PAUSED\\].*$\\n?", "");
                intervention.setObservations(observations);
            }
            
            intervention = interventionRepositorie.save(intervention);
            
            // Enregistrer l'action dans l'historique
            enregistrerActionHistorique(intervention, ancienStatut, StatutIntervention.EN_COURS, 
                                      "Reprise de l'intervention", null, technicien);
            
            return interventionMapper.toDTO(intervention);
        } catch (Exception e) {
            log.error("Erreur lors de la reprise: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la reprise", e);
        }
    }
    
    @Override
    public InterventionDTO cloturerIntervention(Long interventionId, Long technicienId, String solution, String commentaireInterne) {
        try {
            Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
            if (intervention == null) {
                throw new RuntimeException("Intervention non trouvée");
            }
            
            // Récupérer l'utilisateur qui effectue l'action
            Utilisateur utilisateur = utilisateurRepositorie.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Autoriser si c'est un admin ou le technicien assigné
            boolean isAdmin = utilisateur.getRole() == Role.ADMIN;
            boolean isAssignedTechnician = intervention.getTechnicien() != null && 
                                          intervention.getTechnicien().getId() == technicienId;
            
            if (!isAdmin && !isAssignedTechnician) {
                throw new RuntimeException("Seul le technicien assigné ou un administrateur peut clôturer cette intervention");
            }
            
            StatutIntervention ancienStatut = intervention.getStatutIntervention();
            intervention.setStatutIntervention(StatutIntervention.TERMINEE);
            intervention.setDateFinIntervention(LocalDateTime.now());
            intervention.setDateCloture(LocalDateTime.now());
            intervention.setSolutionAppliquee(solution);
            intervention.setObservations(commentaireInterne);
            intervention.setDerniereModification(LocalDateTime.now());
            
            Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
            intervention.setModifiePar(technicien);
            
            intervention = interventionRepositorie.save(intervention);
            
            // Update printer status to ACTIF when intervention is completed
            updatePrinterStatus(intervention, StatutIntervention.TERMINEE);
            
            // Enregistrer l'action dans l'historique
            enregistrerActionHistorique(intervention, ancienStatut, StatutIntervention.TERMINEE, 
                                      "Clôture de l'intervention", solution, technicien);
            
            return interventionMapper.toDTO(intervention);
        } catch (Exception e) {
            log.error("Erreur lors de la clôture: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la clôture", e);
        }
    }
    
    @Override
    public InterventionDTO rouvrirIntervention(Long interventionId, Long utilisateurId, String raison) {
        try {
            Intervention intervention = changerStatut(interventionId, StatutIntervention.EN_ATTENTE, utilisateurId);
            if (intervention != null) {
                // Ajouter la raison de réouverture
                String observation = intervention.getObservations() != null ? intervention.getObservations() : "";
                intervention.setObservations(observation + "\nRéouverture: " + raison);
                intervention.setDateFinIntervention(null); // Remettre à null
                intervention = interventionRepositorie.save(intervention);
                return interventionMapper.toDTO(intervention);
            }
            throw new RuntimeException("Erreur lors de la réouverture");
        } catch (Exception e) {
            log.error("Erreur lors de la réouverture: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la réouverture", e);
        }
    }
    
    @Override
    public InterventionDTO annulerIntervention(Long interventionId, Long utilisateurId, String raisonAnnulation) {
        try {
            Intervention intervention = annulerIntervention(interventionId, raisonAnnulation, utilisateurId);
            return intervention != null ? interventionMapper.toDTO(intervention) : null;
        } catch (Exception e) {
            log.error("Erreur lors de l'annulation: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'annulation", e);
        }
    }
    
    @Override
    public InterventionDTO enregistrerSatisfactionClient(Long interventionId, Integer noteSatisfaction, String commentaireSatisfaction) {
        try {
            Intervention intervention = evaluerSatisfaction(interventionId, noteSatisfaction, commentaireSatisfaction);
            return intervention != null ? interventionMapper.toDTO(intervention) : null;
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement de la satisfaction: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'enregistrement de la satisfaction", e);
        }
    }
    
    // Méthode utilitaire pour calculer le temps de résolution moyen
    private Double calculerTempsResolutionMoyen(List<Intervention> interventions) {
        return interventions.stream()
                .filter(i -> i.getDateCreation() != null && i.getDateFinIntervention() != null)
                .mapToLong(i -> java.time.Duration.between(i.getDateCreation(), i.getDateFinIntervention()).toHours())
                .average()
                .orElse(0.0);
    }
    
    // ====================== MÉTHODES POUR L'HISTORIQUE ======================
    
    /**
     * Enregistre une action dans l'historique de l'intervention
     */
    private void enregistrerActionHistorique(Intervention intervention, StatutIntervention ancienStatut, 
                                           StatutIntervention nouveauStatut, String action, String commentaire, 
                                           Utilisateur utilisateur) {
        InterventionHistorique historique = new InterventionHistorique(
            intervention, ancienStatut, nouveauStatut, action, commentaire, utilisateur);
        interventionHistoriqueRepositorie.save(historique);
        log.info("Action enregistrée dans l'historique: {} - {}", action, intervention.getNumeroTicket());
    }
    
    /**
     * Récupère l'historique complet d'une intervention
     */
    public List<InterventionHistoriqueDTO> obtenirHistoriqueIntervention(Long interventionId) {
        List<InterventionHistorique> historiques = interventionHistoriqueRepositorie
            .findByInterventionIdOrderByDateActionAsc(interventionId);
        
        return historiques.stream()
            .map(this::mapHistoriqueToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Convertit une entité InterventionHistorique en DTO
     */
    private InterventionHistoriqueDTO mapHistoriqueToDTO(InterventionHistorique historique) {
        InterventionHistoriqueDTO dto = new InterventionHistoriqueDTO();
        dto.setId(historique.getId());
        dto.setAncienStatut(historique.getAncienStatut());
        dto.setNouveauStatut(historique.getNouveauStatut());
        dto.setAction(historique.getAction());
        dto.setCommentaire(historique.getCommentaire());
        dto.setDateAction(historique.getDateAction());
        
        if (historique.getUtilisateur() != null) {
            dto.setUtilisateurId(historique.getUtilisateur().getId());
            dto.setUtilisateurNom(historique.getUtilisateur().getNom() + " " + 
                                 historique.getUtilisateur().getPrenom());
        }
        
        return dto;
    }
    
    /**
     * Récupère l'historique complet des interventions pour une imprimante
     */
    @Override
    public List<InterventionDTO> obtenirHistoriqueInterventionsImprimante(Long imprimanteId) {
        List<Intervention> interventions = interventionRepositorie
            .findByImprimante_IdOrderByDateCreationDesc(imprimanteId);
        
        return interventions.stream()
            .map(interventionMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Calcule les statistiques pour une imprimante spécifique
     */
    @Override
    public Map<String, Object> obtenirStatistiquesImprimante(Long imprimanteId) {
        List<Intervention> interventions = interventionRepositorie
            .findByImprimante_IdOrderByDateCreationDesc(imprimanteId);
        
        Map<String, Object> stats = new HashMap<>();
        
        // Nombre total d'interventions
        stats.put("totalInterventions", interventions.size());
        
        // Répartition par statut
        Map<StatutIntervention, Long> statutStats = interventions.stream()
            .collect(Collectors.groupingBy(
                Intervention::getStatutIntervention, 
                Collectors.counting()));
        stats.put("repartitionStatuts", statutStats);
        
        // Répartition par type
        Map<TypeIntervention, Long> typeStats = interventions.stream()
            .collect(Collectors.groupingBy(
                Intervention::getTypeIntervention, 
                Collectors.counting()));
        stats.put("repartitionTypes", typeStats);
        
        // Coût total
        Double coutTotal = interventions.stream()
            .filter(i -> i.getCoutReel() != null)
            .mapToDouble(Intervention::getCoutReel)
            .sum();
        stats.put("coutTotal", coutTotal);
        
        // Coût moyen
        Double coutMoyen = interventions.stream()
            .filter(i -> i.getCoutReel() != null)
            .mapToDouble(Intervention::getCoutReel)
            .average()
            .orElse(0.0);
        stats.put("coutMoyen", coutMoyen);
        
        // Temps de résolution moyen
        Double tempsResolutionMoyen = calculerTempsResolutionMoyen(interventions);
        stats.put("tempsResolutionMoyen", tempsResolutionMoyen);
        
        // Dernière intervention
        if (!interventions.isEmpty()) {
            stats.put("derniereIntervention", interventionMapper.toDTO(interventions.get(0)));
        }
        
        // Nombre d'interventions par mois (12 derniers mois)
        Map<String, Long> interventionsParMois = interventions.stream()
            .filter(i -> i.getDateCreation().isAfter(LocalDateTime.now().minusMonths(12)))
            .collect(Collectors.groupingBy(
                i -> i.getDateCreation().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                Collectors.counting()));
        stats.put("interventionsParMois", interventionsParMois);
        
        return stats;
    }

    @Override
    public List<Long> obtenirContratIdsAvecInterventionsActives() {
        // Liste des statuts considérés comme "actifs"
        List<StatutIntervention> statutsActifs = List.of(
            StatutIntervention.EN_ATTENTE,
            StatutIntervention.PLANIFIEE,
            StatutIntervention.EN_COURS,
            StatutIntervention.EN_PAUSE,
            StatutIntervention.ATTENTE_PIECES,
            StatutIntervention.ATTENTE_CLIENT
        );
        
        // Requête pour obtenir toutes les interventions avec un statut actif
        List<Intervention> interventionsActives = interventionRepositorie.findAll().stream()
            .filter(intervention -> statutsActifs.contains(intervention.getStatutIntervention()))
            .filter(intervention -> intervention.getContrat() != null)
            .collect(Collectors.toList());
        
        // Extraire uniquement les IDs des contrats, en éliminant les doublons
        return interventionsActives.stream()
            .map(intervention -> intervention.getContrat().getId())
            .distinct()
            .collect(Collectors.toList());
    }
    
    @Override
    public boolean hasActiveInterventionsForContract(Long contratId) {
        // Liste des statuts considérés comme "actifs"
        List<StatutIntervention> statutsActifs = List.of(
            StatutIntervention.EN_ATTENTE,
            StatutIntervention.PLANIFIEE,
            StatutIntervention.EN_COURS,
            StatutIntervention.EN_PAUSE,
            StatutIntervention.ATTENTE_PIECES,
            StatutIntervention.ATTENTE_CLIENT
        );
        
        // Requête pour vérifier si le contrat a des interventions avec un statut actif
        List<Intervention> interventions = interventionRepositorie.findByContrat_IdOrderByDateCreationDesc(contratId);
        
        return interventions.stream()
            .anyMatch(intervention -> statutsActifs.contains(intervention.getStatutIntervention()));
    }
    
    @Override
    public List<InterventionDTO> obtenirInterventionsActivesPourContrat(Long contratId) {
        // Liste des statuts considérés comme "actifs"
        List<StatutIntervention> statutsActifs = List.of(
            StatutIntervention.EN_ATTENTE,
            StatutIntervention.PLANIFIEE,
            StatutIntervention.EN_COURS,
            StatutIntervention.EN_PAUSE,
            StatutIntervention.ATTENTE_PIECES,
            StatutIntervention.ATTENTE_CLIENT
        );
        
        // Récupérer toutes les interventions pour ce contrat
        List<Intervention> interventions = interventionRepositorie.findByContrat_IdOrderByDateCreationDesc(contratId);
        
        // Filtrer les interventions actives et les convertir en DTO
        return interventions.stream()
            .filter(intervention -> statutsActifs.contains(intervention.getStatutIntervention()))
            .map(interventionMapper::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    public InterventionDTO creerInterventionMultipleImprimantes(InterventionCreateDTO createDTO) {
        try {
            Intervention intervention = interventionMapper.toEntity(createDTO);
            
            // Récupération des entités liées
            Utilisateur demandeur = utilisateurRepositorie.findById(createDTO.getDemandeurId()).orElse(null);
            Contrat contrat = contratRepositorie.findById(createDTO.getContratId()).orElse(null);
            Utilisateur technicien = createDTO.getTechnicienId() != null ?
                utilisateurRepositorie.findById(createDTO.getTechnicienId()).orElse(null) : null;
            
            if (demandeur == null || contrat == null) {
                throw new RuntimeException("Demandeur ou contrat non trouvé");
            }
            
            // Configuration de l'intervention
            intervention.setDemandeur(demandeur);
            intervention.setContrat(contrat);
            intervention.setTechnicien(technicien);
            
            // Pour les maintenances préventives avec une date planifiée, définir le statut à PLANIFIEE
            if (intervention.getTypeIntervention() == TypeIntervention.PREVENTIVE 
                && createDTO.getDatePlanifiee() != null) {
                intervention.setStatutIntervention(StatutIntervention.PLANIFIEE);
                intervention.setDatePlanifiee(createDTO.getDatePlanifiee());
            } else {
                intervention.setStatutIntervention(StatutIntervention.EN_ATTENTE);
            }
            
            intervention.setDateCreation(LocalDateTime.now());
            intervention.setNumeroTicket(genererNumeroTicket());
            
            // Pour une intervention avec plusieurs imprimantes, nous utilisons maintenant
            // la relation many-to-many pour les associer
            if (createDTO.getImprimanteIds() != null && !createDTO.getImprimanteIds().isEmpty()) {
                List<Imprimante> imprimantes = imprimanteRepositorie.findAllById(createDTO.getImprimanteIds());
                
                // Associer les imprimantes à l'intervention via la nouvelle relation
                intervention.getImprimantesAssociees().addAll(imprimantes);
                
                // On lie la première imprimante à l'intervention pour le référencement legacy
                if (!imprimantes.isEmpty()) {
                    intervention.setImprimante(imprimantes.get(0));
                }
                
                // Update all printers' status to EN_PANNE
                for (Imprimante imp : imprimantes) {
                    imp.setStatus(ImprimanteStatus.EN_PANNE);
                    imprimanteRepositorie.save(imp);
                    log.info("Printer status updated to EN_PANNE for printer ID: {}", imp.getId());
                }
            }
            
            Intervention saved = interventionRepositorie.save(intervention);
            
            // Notification
            envoyerNotificationNouveauTicket(saved);
            
            return interventionMapper.toDTO(saved);
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'intervention multi-imprimantes: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la création de l'intervention", e);
        }
    }
    
    @Override
    public List<InterventionDTO> creerInterventionsParImprimante(InterventionCreateDTO createDTO) {
        try {
            if (createDTO.getImprimanteIds() == null || createDTO.getImprimanteIds().isEmpty()) {
                throw new RuntimeException("Aucune imprimante sélectionnée pour la création multiple de tickets");
            }
            
            // Récupération des entités liées communes
            Utilisateur demandeur = utilisateurRepositorie.findById(createDTO.getDemandeurId()).orElse(null);
            Contrat contrat = contratRepositorie.findById(createDTO.getContratId()).orElse(null);
            Utilisateur technicien = createDTO.getTechnicienId() != null ?
                utilisateurRepositorie.findById(createDTO.getTechnicienId()).orElse(null) : null;
            
            if (demandeur == null || contrat == null) {
                throw new RuntimeException("Demandeur ou contrat non trouvé");
            }
            
            List<Imprimante> imprimantes = imprimanteRepositorie.findAllById(createDTO.getImprimanteIds());
            
            // Créer une intervention pour chaque imprimante
            return imprimantes.stream()
                .map(imprimante -> {
                    // Création de l'intervention pour cette imprimante
                    Intervention intervention = interventionMapper.toEntity(createDTO);
                    
                    // Configuration
                    intervention.setDemandeur(demandeur);
                    intervention.setContrat(contrat);
                    intervention.setTechnicien(technicien);
                    intervention.setImprimante(imprimante);
                    intervention.setStatutIntervention(StatutIntervention.EN_ATTENTE);
                    intervention.setDateCreation(LocalDateTime.now());
                    intervention.setNumeroTicket(genererNumeroTicket());
                    
                    // Personnalisation du titre
                    intervention.setTitre(String.format("%s - %s", intervention.getTitre(), imprimante.getModele()));
                    
                    // Ajouter à la relation many-to-many
                    intervention.getImprimantesAssociees().add(imprimante);
                    
                    // Update printer status to EN_PANNE
                    imprimante.setStatus(ImprimanteStatus.EN_PANNE);
                    imprimanteRepositorie.save(imprimante);
                    log.info("Printer status updated to EN_PANNE for printer ID: {}", imprimante.getId());
                    
                    // Sauvegarde
                    Intervention saved = interventionRepositorie.save(intervention);
                    
                    // Notification
                    envoyerNotificationNouveauTicket(saved);
                    
                    return interventionMapper.toDTO(saved);
                })
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Erreur lors de la création des interventions par imprimante: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la création des interventions", e);
        }
    }

    /**
     * Récupère la date de la dernière maintenance préventive pour un contrat
     * @param contratId ID du contrat
     * @return Date de la dernière maintenance ou null si aucune maintenance trouvée
     */
    public LocalDateTime getLastPreventiveMaintenanceDate(Long contratId) {
        // Rechercher la dernière intervention de type PREVENTIVE pour ce contrat
        Intervention lastMaintenance = interventionRepositorie.findTopByContratIdAndTypeInterventionOrderByDatePlanifieeDesc(
                contratId, TypeIntervention.PREVENTIVE);
        
        if (lastMaintenance != null) {
            return lastMaintenance.getDatePlanifiee() != null ? 
                    lastMaintenance.getDatePlanifiee() : lastMaintenance.getDateCreation();
        }
        
        return null;
    }
    
    /**
     * Trouve les interventions préventives planifiées à une date spécifique
     * @param date Date à laquelle les interventions sont planifiées
     * @return Liste des interventions avec les informations nécessaires pour les notifications
     */
    public List<Object[]> findUpcomingPreventiveMaintenances(LocalDate date) {
        // Cette requête devrait être implémentée dans le repository
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        // Retourne un tableau d'objets contenant:
        // - ID de l'intervention
        // - Numéro de contrat
        // - Date planifiée
        // - Email du client
        // - Nom du client
        return interventionRepositorie.findUpcomingPreventiveMaintenances(startOfDay, endOfDay);
    }
    
    /**
     * Met à jour le statut d'une imprimante en fonction du statut de l'intervention
     */
    /**
     * @deprecated This method is deprecated. Use {@link #updatePrinterStatus(Intervention, StatutIntervention)} instead.
     */
    @Deprecated
    private void updatePrinterStatus(Long imprimanteId, StatutIntervention statutIntervention) {
        if (imprimanteId == null) {
            return;
        }
        
        Imprimante imprimante = imprimanteRepositorie.findById(imprimanteId).orElse(null);
        if (imprimante == null) {
            return;
        }
        
        // Déterminer le nouveau statut en fonction du statut de l'intervention
        ImprimanteStatus newStatus;
        switch (statutIntervention) {
            case EN_ATTENTE:
            case PLANIFIEE:
                newStatus = ImprimanteStatus.EN_PANNE;
                break;
            case EN_COURS:
            case ATTENTE_PIECES:
            case ATTENTE_CLIENT:
                newStatus = ImprimanteStatus.EN_MAINTENANCE;
                break;
            case TERMINEE:
            case ANNULEE:
                newStatus = ImprimanteStatus.ACTIF;
                break;
            case REJETEE:
                newStatus = ImprimanteStatus.HORS_SERVICE;
                break;
            default:
                newStatus = imprimante.getStatus();
                break;
        }
        
        // Mettre à jour le statut seulement s'il a changé
        if (imprimante.getStatus() != newStatus) {
            imprimante.setStatus(newStatus);
            imprimanteRepositorie.save(imprimante);
            log.info("Statut de l'imprimante {} mis à jour: {} -> {}", 
                    imprimanteId, imprimante.getStatus(), newStatus);
        }
    }

    /**
     * Enregistrer le diagnostic technique d'une intervention
     * Cette étape se produit pendant l'intervention, après son démarrage et avant sa finalisation
     */
    @Override
    public InterventionDTO enregistrerDiagnostic(Long interventionId, Long technicienId, String diagnosticTechnique, String symptomesDetailles) {
        try {
            Intervention intervention = interventionRepositorie.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention non trouvée"));
            
            // Vérifier que l'intervention est bien en cours
            if (intervention.getStatutIntervention() != StatutIntervention.EN_COURS) {
                throw new RuntimeException("L'intervention doit être en cours pour enregistrer un diagnostic");
            }
            
            // Vérifier que le technicien est bien assigné à cette intervention
           // if (intervention.getTechnicien() == null || intervention.getTechnicien().getId() != technicienId) {
              //  throw new RuntimeException("Seul le technicien assigné peut enregistrer un diagnostic");
           // }
            
            // Enregistrer l'ancien diagnostic pour l'historique
            String ancienDiagnostic = intervention.getDiagnosticTechnique();
            String anciensSymptomes = intervention.getSymptomes();
            
            // Mettre à jour l'intervention
            intervention.setDiagnosticTechnique(diagnosticTechnique);
            intervention.setSymptomes(symptomesDetailles);
            intervention.setDerniereModification(LocalDateTime.now());
            
            // Get technician if it exists, but don't throw exception if not found
            Utilisateur technicien = utilisateurRepositorie.findById(technicienId).orElse(null);
            intervention.setModifiePar(technicien);
            
            intervention = interventionRepositorie.save(intervention);
            
            // Enregistrer l'action dans l'historique
            String message = "Diagnostic technique enregistré";
            if (ancienDiagnostic == null || ancienDiagnostic.isEmpty()) {
                message = "Diagnostic technique initial enregistré";
            } else {
                message = "Diagnostic technique mis à jour";
            }
            
            InterventionHistorique historique = new InterventionHistorique();
            historique.setIntervention(intervention);
            historique.setUtilisateur(technicien); // This may be null, but that's ok
            historique.setDateAction(LocalDateTime.now());
            historique.setAncienStatut(intervention.getStatutIntervention());
            historique.setNouveauStatut(intervention.getStatutIntervention());
            historique.setAction(message);
            historique.setCommentaire("Ancien diagnostic: " + (ancienDiagnostic != null ? ancienDiagnostic : "Non défini") + 
                    "\nNouveau diagnostic: " + diagnosticTechnique + 
                    "\nAnciens symptômes: " + (anciensSymptomes != null ? anciensSymptomes : "Non définis") + 
                    "\nNouveaux symptômes: " + symptomesDetailles);
            
            interventionHistoriqueRepositorie.save(historique);
            
            // Notifier le client que le diagnostic a été effectué
            notifierDiagnosticEffectue(intervention);
            
            log.info("Diagnostic enregistré pour l'intervention {} par technicien ID {}", 
                    interventionId, technicienId);
            return interventionMapper.toDTO(intervention);
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement du diagnostic: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'enregistrement du diagnostic", e);
        }
    }
    
    /**
     * Notifier le client que le diagnostic a été effectué
     */
    private void notifierDiagnosticEffectue(Intervention intervention) {
        try {
            if (intervention.getDemandeur() != null && intervention.getDemandeur().getEmail() != null) {
                String sujet = "Diagnostic effectué pour votre demande d'intervention " + intervention.getNumeroTicket();
                
                String contenu = "Bonjour " + intervention.getDemandeur().getPrenom() + ",\n\n" +
                        "Le diagnostic technique pour votre demande d'intervention " + intervention.getNumeroTicket() + 
                        " a été effectué.\n\n" +
                        "Diagnostic réalisé: " + intervention.getDiagnosticTechnique() + "\n\n" +
                        "Le technicien travaille actuellement à la résolution du problème.\n\n" +
                        "Cordialement,\n" +
                        "L'équipe de maintenance";
                
                // Utiliser EmailService pour envoyer l'email
                emailService.sendEmail(intervention.getDemandeur().getEmail(), sujet, contenu);
                log.info("Notification de diagnostic envoyée au client {}", intervention.getDemandeur().getEmail());
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification de diagnostic: {}", e.getMessage());
        }
    }
}
