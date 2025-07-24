package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Dto.InterventionCreateDTO;
import com.example.maintenanceapp.Dto.InterventionDTO;
import com.example.maintenanceapp.Dto.InterventionUpdateDTO;
import com.example.maintenanceapp.Dto.InterventionHistoriqueDTO;
import com.example.maintenanceapp.Entity.Intervention;
import com.example.maintenanceapp.Entity.Enum.PrioriteIntervention;
import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import com.example.maintenanceapp.Entity.Enum.TypeIntervention;
import com.example.maintenanceapp.Mapper.InterventionMapper;
import com.example.maintenanceapp.Service.MaintenanceSchedulerService;
import com.example.maintenanceapp.ServiceInterface.IInterventionService;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("/api/interventions")
public class InterventionController {


     IInterventionService interventionService;

     InterventionMapper interventionMapper;
     
     MaintenanceSchedulerService maintenanceSchedulerService;

    // ====================== GESTION DES TICKETS ======================

    /**
     * Créer un nouveau ticket de maintenance
     */
    @PostMapping
    public ResponseEntity<InterventionDTO> creerTicket(@RequestBody InterventionCreateDTO createDTO) {
        try {
            // If we have multiple printer IDs, create interventions for each one
            if (createDTO.getImprimanteIds() != null && !createDTO.getImprimanteIds().isEmpty()) {
                InterventionDTO intervention = interventionService.creerInterventionMultipleImprimantes(createDTO);
                return ResponseEntity.status(HttpStatus.CREATED).body(intervention);
            } else {
                // Traditional single-printer ticket creation
                InterventionDTO intervention = interventionService.creerIntervention(createDTO);
                return ResponseEntity.status(HttpStatus.CREATED).body(intervention);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la création du ticket: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Créer plusieurs tickets de maintenance, un pour chaque imprimante
     */
    @PostMapping("/multi-printer")
    public ResponseEntity<List<InterventionDTO>> creerTicketsMultiImprimantes(@RequestBody InterventionCreateDTO createDTO) {
        try {
            if (createDTO.getImprimanteIds() == null || createDTO.getImprimanteIds().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            List<InterventionDTO> interventions = interventionService.creerInterventionsParImprimante(createDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(interventions);
        } catch (Exception e) {
            log.error("Erreur lors de la création des tickets multi-imprimantes: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Obtenir tous les tickets avec pagination et filtres
     */
    @GetMapping
    public ResponseEntity<Page<InterventionDTO>> obtenirTickets(
            @RequestParam(required = false) StatutIntervention statut,
            @RequestParam(required = false) TypeIntervention type,
            @RequestParam(required = false) PrioriteIntervention priorite,
            @RequestParam(required = false) Long technicienId,
            @RequestParam(required = false) Long demandeurId,
            @RequestParam(required = false) Long contratId,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin,
            Pageable pageable) {

        LocalDate debut = dateDebut != null ? LocalDate.parse(dateDebut) : null;
        LocalDate fin = dateFin != null ? LocalDate.parse(dateFin) : null;

        Page<InterventionDTO> interventions = interventionService.obtenirInterventionsFiltrees(
                statut, type, priorite, technicienId, demandeurId, contratId, debut, fin, pageable);

        return ResponseEntity.ok(interventions);
    }

    /**
     * Obtenir un ticket par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<InterventionDTO> obtenirTicketParId(@PathVariable Long id) {
        try {
            InterventionDTO intervention = interventionService.obtenirInterventionParId(id);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Obtenir un ticket par son numéro
     */
    @GetMapping("/numero/{numero}")
    public ResponseEntity<InterventionDTO> obtenirTicketParNumero(@PathVariable String numero) {
        try {
            InterventionDTO intervention = interventionService.obtenirInterventionParNumero(numero);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Obtenir l'historique des actions d'un ticket
     */
    @GetMapping("/{id}/historique")
    public ResponseEntity<List<InterventionHistoriqueDTO>> obtenirHistoriqueTicket(@PathVariable Long id) {
        try {
            List<InterventionHistoriqueDTO> historique = interventionService.obtenirHistoriqueIntervention(id);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Mettre à jour un ticket
     */
    @PutMapping("/{id}")
    public ResponseEntity<InterventionDTO> mettreAJourTicket(
            @PathVariable Long id,
            @RequestBody InterventionUpdateDTO updateDTO) {
        try {
            InterventionDTO intervention = interventionService.mettreAJourIntervention(id, updateDTO);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Supprimer un ticket
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerTicket(@PathVariable Long id) {
        try {
            interventionService.supprimerIntervention(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ====================== GESTION DU CYCLE DE VIE ======================

    /**
     * Assigner un technicien à un ticket
     */
    @PutMapping("/{id}/assigner")
    public ResponseEntity<InterventionDTO> assignerTechnicien(
            @PathVariable Long id,
            @RequestParam Long technicienId,
            @RequestParam Long assignateurId) {
        try {
            InterventionDTO intervention = interventionService.assignerTechnicien(id, technicienId, assignateurId);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Planifier un ticket
     */
    @PutMapping("/{id}/planifier")
    public ResponseEntity<InterventionDTO> planifierTicket(
            @PathVariable Long id,
            @RequestParam String datePlanifiee,
            @RequestParam Long planificateurId) {
        try {
            LocalDateTime dateTime = LocalDateTime.parse(datePlanifiee);
            Intervention intervention = interventionService.planifierIntervention(id, dateTime, planificateurId);
            InterventionDTO interventionDTO = interventionMapper.toDTO(intervention);
            return ResponseEntity.ok(interventionDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Démarrer un ticket
     */
    @PutMapping("/{id}/demarrer")
    public ResponseEntity<InterventionDTO> demarrerTicket(
            @PathVariable Long id,
            @RequestParam Long technicienId) {
        try {
            InterventionDTO intervention = interventionService.demarrerIntervention(id, technicienId);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Mettre en pause un ticket
     */
    @PutMapping("/{id}/pause")
    public ResponseEntity<InterventionDTO> mettreEnPauseTicket(
            @PathVariable Long id,
            @RequestParam Long technicienId,
            @RequestParam String raisonPause) {
        try {
            InterventionDTO intervention = interventionService.mettreEnPause(id, technicienId, raisonPause);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Reprendre un ticket en pause
     */
    @PutMapping("/{id}/reprendre")
    public ResponseEntity<InterventionDTO> reprendreTicket(
            @PathVariable Long id,
            @RequestParam Long technicienId) {
        try {
            InterventionDTO intervention = interventionService.reprendreIntervention(id, technicienId);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Clôturer un ticket
     */
    @PutMapping("/{id}/cloturer")
    public ResponseEntity<InterventionDTO> cloturerTicket(
            @PathVariable Long id,
            @RequestParam Long technicienId,
            @RequestParam String solution,
            @RequestParam(required = false) String commentaireInterne) {
        try {
            InterventionDTO intervention = interventionService.cloturerIntervention(id, technicienId, solution, commentaireInterne);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Terminer un ticket (marquer comme terminé avec diagnostic et solution)
     */
    @PutMapping("/{id}/terminer")
    public ResponseEntity<InterventionDTO> terminerTicket(
            @PathVariable Long id,
            @RequestParam(required = false) String diagnostic,
            @RequestParam(required = false) String solution,
            @RequestParam(required = false) String observations,
            @RequestParam(required = false) Double coutReel,
            @RequestParam Long technicienId) {
        try {
            // Use empty strings if parameters are null
            String diagText = diagnostic != null ? diagnostic : "";
            String solText = solution != null ? solution : "";
            Intervention intervention = interventionService.terminerIntervention(id, diagText, solText, observations, coutReel, technicienId);
            InterventionDTO interventionDTO = interventionMapper.toDTO(intervention);
            return ResponseEntity.ok(interventionDTO);
        } catch (Exception e) {
            log.error("Erreur lors de la finalisation du ticket: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * Terminer un ticket simplement (marquer comme terminé sans détails supplémentaires)
     */
    @PutMapping("/{id}/terminer-simple")
    public ResponseEntity<InterventionDTO> terminerTicketSimple(
            @PathVariable Long id,
            @RequestParam Long technicienId) {
        try {
            // Call the same method but with empty/default values
            Intervention intervention = interventionService.terminerIntervention(
                id, 
                "Intervention terminée", // Default diagnostic
                "Problème résolu", // Default solution
                null, // No observations
                null, // No cost
                technicienId
            );
            InterventionDTO interventionDTO = interventionMapper.toDTO(intervention);
            return ResponseEntity.ok(interventionDTO);
        } catch (Exception e) {
            log.error("Erreur lors de la finalisation simplifiée du ticket: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Rouvrir un ticket clôturé
     */
    @PutMapping("/{id}/rouvrir")
    public ResponseEntity<InterventionDTO> rouvrirTicket(
            @PathVariable Long id,
            @RequestParam Long utilisateurId,
            @RequestParam String raison) {
        try {
            InterventionDTO intervention = interventionService.rouvrirIntervention(id, utilisateurId, raison);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Annuler un ticket
     */
    @PutMapping("/{id}/annuler")
    public ResponseEntity<InterventionDTO> annulerTicket(
            @PathVariable Long id,
            @RequestParam Long utilisateurId,
            @RequestParam String raisonAnnulation) {
        try {
            InterventionDTO intervention = interventionService.annulerIntervention(id, utilisateurId, raisonAnnulation);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // ====================== STATISTIQUES ET RAPPORTS ======================

    /**
     * Obtenir les statistiques des tickets
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> obtenirStatistiques(
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {

        LocalDate debut = dateDebut != null ? LocalDate.parse(dateDebut) : null;
        LocalDate fin = dateFin != null ? LocalDate.parse(dateFin) : null;

        Map<String, Object> statistiques = interventionService.obtenirStatistiques(debut, fin);
        return ResponseEntity.ok(statistiques);
    }

    /**
     * Obtenir les tickets par technicien
     */
    @GetMapping("/technicien/{technicienId}")
    public ResponseEntity<List<InterventionDTO>> obtenirTicketsParTechnicien(
            @PathVariable Long technicienId,
            @RequestParam(required = false) StatutIntervention statut) {

        List<InterventionDTO> interventions = interventionService.obtenirInterventionsParTechnicien(technicienId, statut);
        return ResponseEntity.ok(interventions);
    }

    /**
     * Obtenir les tickets urgents
     */
    @GetMapping("/urgents")
    public ResponseEntity<List<InterventionDTO>> obtenirTicketsUrgents() {
        List<InterventionDTO> interventions = interventionService.obtenirInterventionsUrgentes();
        return ResponseEntity.ok(interventions);
    }

    /**
     * Obtenir les tickets en retard
     */
    @GetMapping("/retard")
    public ResponseEntity<List<InterventionDTO>> obtenirTicketsEnRetard() {
        List<InterventionDTO> interventions = interventionService.obtenirInterventionsEnRetard();
        return ResponseEntity.ok(interventions);
    }

    // ====================== SATISFACTION CLIENT ======================

    /**
     * Enregistrer la satisfaction client
     */
    @PutMapping("/{id}/satisfaction")
    public ResponseEntity<InterventionDTO> enregistrerSatisfaction(
            @PathVariable Long id,
            @RequestParam Integer noteSatisfaction,
            @RequestParam(required = false) String commentaireSatisfaction) {
        try {
            InterventionDTO intervention = interventionService.enregistrerSatisfactionClient(id, noteSatisfaction, commentaireSatisfaction);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // ====================== HISTORIQUE DES IMPRIMANTES ======================

    /**
     * Obtenir l'historique complet des interventions pour une imprimante
     */
    @GetMapping("/imprimante/{imprimanteId}/historique")
    public ResponseEntity<List<InterventionDTO>> obtenirHistoriqueImprimante(@PathVariable Long imprimanteId) {
        try {
            List<InterventionDTO> historique = interventionService.obtenirHistoriqueInterventionsImprimante(imprimanteId);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Obtenir les statistiques pour une imprimante
     */
    @GetMapping("/imprimante/{imprimanteId}/statistiques")
    public ResponseEntity<Map<String, Object>> obtenirStatistiquesImprimante(@PathVariable Long imprimanteId) {
        try {
            Map<String, Object> statistiques = interventionService.obtenirStatistiquesImprimante(imprimanteId);
            return ResponseEntity.ok(statistiques);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ====================== TEST DE CONNECTIVITÉ ======================

    /**
     * Endpoint simple pour tester la connectivité
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("API Interventions fonctionne !");
    }

    /**
     * Endpoint simple pour lister toutes les interventions
     */

    /**
     * Obtenir tous les IDs de contrats qui ont des interventions actives
     * Méthode optimisée pour éviter de vérifier chaque contrat individuellement
     */
    @GetMapping("/contrats-avec-interventions-actives")
    public ResponseEntity<List<Long>> obtenirContratsAvecInterventionsActives() {
        try {
            List<Long> contractIds = interventionService.obtenirContratIdsAvecInterventionsActives();
            return ResponseEntity.ok(contractIds);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des contrats avec interventions actives", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Vérifier si un contrat a des interventions actives
     */
    @GetMapping("/contrat/{contratId}/hasActiveInterventions")
    public ResponseEntity<Boolean> verifierInterventionsActivesPourContrat(@PathVariable Long contratId) {
        try {
            boolean hasActive = interventionService.hasActiveInterventionsForContract(contratId);
            return ResponseEntity.ok(hasActive);
        } catch (Exception e) {
            log.error("Erreur lors de la vérification des interventions actives pour le contrat " + contratId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtenir les interventions actives pour un contrat
     */
    @GetMapping("/contrat/{contratId}/active")
    public ResponseEntity<List<InterventionDTO>> obtenirInterventionsActivesPourContrat(@PathVariable Long contratId) {
        try {
            List<InterventionDTO> interventions = interventionService.obtenirInterventionsActivesPourContrat(contratId);
            return ResponseEntity.ok(interventions);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des interventions actives pour le contrat " + contratId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint pour planifier manuellement des maintenances préventives
     * Cet endpoint est réservé aux administrateurs et permet de déclencher
     * manuellement la planification des maintenances préventives
     */
    @PostMapping("/planifier-maintenances-preventives")
    public ResponseEntity<Map<String, String>> planifierMaintenancesPreventives() {
        try {
            // Appeler le service de planification
            maintenanceSchedulerService.schedulePreventiveMaintenance();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Planification des maintenances préventives déclenchée avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur lors de la planification des maintenances préventives: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Endpoint pour envoyer manuellement les notifications de maintenance préventive
     * Cet endpoint est réservé aux administrateurs et permet de déclencher
     * manuellement l'envoi des notifications pour les maintenances à venir
     */
    @PostMapping("/envoyer-notifications-maintenance")
    public ResponseEntity<Map<String, String>> envoyerNotificationsMaintenance() {
        try {
            // Appeler le service d'envoi de notifications
            maintenanceSchedulerService.sendMaintenanceNotifications();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Envoi des notifications de maintenance déclenché avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi des notifications de maintenance: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Enregistrer le diagnostic technique d'une intervention
     */
    @PutMapping("/{id}/diagnostic")
    public ResponseEntity<InterventionDTO> enregistrerDiagnostic(
            @PathVariable Long id,
            @RequestParam Long technicienId,
            @RequestParam String diagnosticTechnique,
            @RequestParam String symptomesDetailles) {
        try {
            InterventionDTO intervention = interventionService.enregistrerDiagnostic(id, technicienId, diagnosticTechnique, symptomesDetailles);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement du diagnostic: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}