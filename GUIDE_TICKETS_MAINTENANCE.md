# Guide d'utilisation - Système de Tickets de Maintenance

## 🎯 Vue d'ensemble

Le système de tickets de maintenance permet d'enregistrer, suivre et gérer toutes les demandes d'intervention de maintenance, qu'il s'agisse de pannes ou d'interventions planifiées.

## 🚀 Fonctionnalités principales

### ✅ Création de tickets
- **Titre et description** détaillée du problème
- **Type d'intervention** : Corrective, Préventive, Urgente, Installation, Maintenance, Formation
- **Priorité** : Basse, Normale, Haute, Critique
- **Association** à un contrat et optionnellement à une imprimante
- **Planification** avec date souhaitée d'intervention
- **Génération automatique** d'un numéro de ticket unique

### 📊 Gestion du cycle de vie
- **Statuts disponibles** : En attente, Planifiée, En cours, En pause, Terminée, Annulée, Reportée
- **Assignation** de techniciens
- **Suivi** des dates de début et fin d'intervention
- **Clôture** avec solution et commentaires
- **Réouverture** si nécessaire

### 🔍 Recherche et filtrage
- **Filtres multiples** : statut, type, priorité, technicien, demandeur, contrat
- **Recherche textuelle** dans les tickets
- **Pagination** des résultats
- **Tri** par différents critères

### 📈 Statistiques et rapports
- **Indicateurs** par statut, type et priorité
- **Temps de résolution** moyen
- **Tickets urgents** et en retard
- **Performance** par technicien

## 🎮 Comment utiliser

### 1. Créer un nouveau ticket

1. **Accéder** à la section "Tickets de Maintenance" dans le menu
2. **Cliquer** sur "Créer un ticket"
3. **Remplir** les informations obligatoires :
   - Titre du ticket
   - Description détaillée
   - Type d'intervention
   - Priorité
   - Contrat associé
4. **Ajouter** optionnellement :
   - Imprimante concernée
   - Date souhaitée d'intervention
5. **Valider** la création

### 2. Consulter la liste des tickets

1. **Accéder** à "Liste des Tickets"
2. **Utiliser** les filtres pour affiner la recherche :
   - Par statut (En attente, En cours, etc.)
   - Par type d'intervention
   - Par priorité
   - Par recherche textuelle
3. **Cliquer** sur un ticket pour voir les détails

### 3. Gérer un ticket (technicien/responsable)

1. **Ouvrir** le ticket depuis la liste
2. **Actions disponibles** selon le statut :
   - **Assigner** un technicien
   - **Planifier** une intervention
   - **Démarrer** l'intervention
   - **Mettre en pause** avec raison
   - **Reprendre** l'intervention
   - **Clôturer** avec solution
   - **Annuler** si nécessaire

### 4. Suivi et reporting

1. **Consulter** les statistiques dans le tableau de bord
2. **Identifier** les tickets urgents ou en retard
3. **Analyser** les performances par technicien
4. **Exporter** les données si nécessaire

## 🔧 API Backend

### Endpoints principaux

```
POST   /api/interventions              - Créer un ticket
GET    /api/interventions              - Liste avec filtres et pagination
GET    /api/interventions/{id}         - Détails d'un ticket
PUT    /api/interventions/{id}         - Modifier un ticket
DELETE /api/interventions/{id}         - Supprimer un ticket

PUT    /api/interventions/{id}/assigner    - Assigner un technicien
PUT    /api/interventions/{id}/planifier   - Planifier l'intervention
PUT    /api/interventions/{id}/demarrer    - Démarrer l'intervention
PUT    /api/interventions/{id}/cloturer    - Clôturer l'intervention

GET    /api/interventions/urgents          - Tickets urgents
GET    /api/interventions/retard           - Tickets en retard
GET    /api/interventions/statistiques     - Statistiques globales
```

### Structure des données

#### InterventionCreateDTO
```json
{
  "titre": "Panne imprimante bureau 201",
  "description": "L'imprimante ne répond plus...",
  "type": "CORRECTIVE",
  "priorite": "HAUTE",
  "contratId": 1,
  "imprimanteId": 2,
  "demandeurId": 1,
  "datePlanifiee": "2024-01-15T10:00:00"
}
```

#### InterventionDTO (réponse)
```json
{
  "id": 1,
  "numero": "TICK-2024-001",
  "titre": "Panne imprimante bureau 201",
  "description": "L'imprimante ne répond plus...",
  "type": "CORRECTIVE",
  "priorite": "HAUTE",
  "statut": "EN_ATTENTE",
  "dateCreation": "2024-01-10T09:00:00",
  "datePlanifiee": "2024-01-15T10:00:00",
  "contratId": 1,
  "contratNumero": "CNT-2024-001",
  "demandeurId": 1,
  "demandeurNom": "Martin Dupont",
  "technicienId": 2,
  "technicienNom": "Pierre Technicien"
}
```

## 💡 Bonnes pratiques

### Pour les demandeurs
- **Titre clair** et descriptif
- **Description détaillée** du problème
- **Priorité appropriée** (ne pas tout mettre en critique)
- **Contrat correct** pour facturation

### Pour les techniciens
- **Mise à jour régulière** du statut
- **Documentation** des actions effectuées
- **Solution claire** lors de la clôture
- **Commentaires** pour les pauses/reports

### Pour les responsables
- **Assignation rapide** des tickets urgents
- **Suivi** des délais d'intervention
- **Analyse** des statistiques pour optimisation
- **Formation** des utilisateurs sur l'outil

## 🛠️ Structure technique

### Backend (Spring Boot)
- **Entité** : `Intervention` avec tous les champs nécessaires
- **Enums** : `TypeIntervention`, `PrioriteIntervention`, `StatutIntervention`
- **Repository** : Requêtes optimisées avec filtres
- **Service** : Logique métier complète
- **Controller** : API REST avec DTOs
- **Mapper** : Conversion Entité ↔ DTO

### Frontend (Angular)
- **Service** : `InterventionService` pour les appels API
- **Composants** : 
  - `TicketCreationComponent` - Création
  - `TicketListComponent` - Liste et filtres
- **Interfaces** : DTOs TypeScript
- **Routing** : Navigation entre les vues

## 🔜 Évolutions possibles

- **Notifications** en temps réel (WebSocket)
- **Upload** de fichiers/photos
- **Historique** détaillé des modifications
- **Templates** de tickets récurrents
- **Intégration** avec système de facturation
- **Application mobile** pour techniciens
- **Planification automatique** basée sur disponibilités

## 📞 Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs d'erreur
3. Contacter l'équipe de développement

---

*Système de tickets de maintenance - Version 1.0*  
*Développé avec Spring Boot + Angular*
