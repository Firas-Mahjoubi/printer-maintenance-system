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
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
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
        if (imprimanteId != null) {
            Imprimante imprimante = imprimanteRepositorie.findById(imprimanteId).orElse(null);
            intervention.setImprimante(imprimante);
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
        
        Intervention saved = interventionRepositorie.save(intervention);
        envoyerNotificationChangementStatut(saved);
        
        log.info("Statut du ticket {} changé de {} à {}", 
                saved.getNumeroTicket(), ancienStatut, nouveauStatut);
        return saved;
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
        
        return interventionRepositorie.save(intervention);
    }

    @Override
    public Intervention terminerIntervention(Long interventionId, String diagnostic, String solution, 
                                           String observations, Double coutReel, Long technicienId) {
        Intervention intervention = interventionRepositorie.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        intervention.setStatutIntervention(StatutIntervention.TERMINEE);
        intervention.setDateFinIntervention(LocalDateTime.now());
        intervention.setDateCloture(LocalDateTime.now());
        intervention.setDiagnosticTechnique(diagnostic);
        intervention.setSolutionAppliquee(solution);
        intervention.setObservations(observations);
        intervention.setCoutReel(coutReel);
        intervention.setDerniereModification(LocalDateTime.now());
        
        return interventionRepositorie.save(intervention);
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
        interventionRepositorie.deleteById(id);
    }
    
    @Override
    public Page<InterventionDTO> obtenirInterventionsFiltrees(
            StatutIntervention statut, TypeIntervention type, PrioriteIntervention priorite,
            Long technicienId, Long demandeurId, Long contratId,
            LocalDate dateDebut, LocalDate dateFin, Pageable pageable) {
        
        // Pour l'instant, utilisons une requête simple sans filtres complexes
        // TODO: Implémenter les filtres de manière plus robuste
        Page<Intervention> interventions;
        
        if (statut != null) {
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
                
                // Enregistrer l'action dans l'historique
                enregistrerActionHistorique(intervention, ancienStatut, StatutIntervention.EN_COURS, 
                                          "Démarrage de l'intervention", null, technicien);
            } else {
                intervention = interventionRepositorie.save(intervention);
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
}
