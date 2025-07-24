# Guide du Cycle de Vie Complet des Tickets de Maintenance

Ce document décrit le cycle de vie complet des tickets de maintenance et comment naviguer à travers les différentes étapes dans l'application.

## Étapes du Cycle de Vie

### 1. Création du Ticket
- Par le client via l'interface client
- Par le technicien via l'interface administrateur
- Données requises: titre, description, priorité, type d'intervention, contrat, équipement(s)
- Statut initial: **EN_ATTENTE**

### 2. Assignation
- Assignation automatique au technicien qui crée le ticket
- Assignation manuelle possible par un administrateur
- Planification possible d'une date d'intervention
- Statut possible: **PLANIFIEE**

### 3. Démarrage de l'Intervention
- Le technicien démarre l'intervention
- Les équipements associés passent en statut "EN MAINTENANCE"
- Le statut du ticket passe à: **EN_COURS**

### 4. Diagnostic Technique
- Le technicien enregistre son diagnostic technique
- Documentation des symptômes observés
- Identification des causes probables
- Reste au statut: **EN_COURS**

### 5. Solution et Coûts
- Le technicien enregistre la solution appliquée
- Saisie des coûts d'intervention (pièces, main d'œuvre)
- Commentaires internes optionnels
- Reste au statut: **EN_COURS**

### 6. Clôture de l'Intervention
- Le technicien marque l'intervention comme terminée
- Les équipements associés passent en statut "FONCTIONNEL"
- Le statut du ticket passe à: **TERMINEE**
- Une notification est envoyée au client

### 7. Satisfaction Client
- Le client évalue l'intervention
- Note de satisfaction (1-5 étoiles)
- Commentaires optionnels
- Le ticket reste au statut: **TERMINEE**

## États Possibles d'un Ticket

1. **EN_ATTENTE**: Ticket créé, en attente d'assignation ou de planification
2. **PLANIFIEE**: Ticket assigné avec une date d'intervention planifiée
3. **EN_COURS**: Intervention en cours de réalisation
4. **EN_PAUSE**: Intervention temporairement suspendue (attente de pièces, etc.)
5. **TERMINEE**: Intervention terminée avec succès
6. **ANNULEE**: Intervention annulée
7. **REPORTEE**: Intervention reportée à une date ultérieure
8. **REJETEE**: Intervention rejetée (hors contrat, etc.)
9. **ATTENTE_PIECES**: En attente de pièces de rechange
10. **ATTENTE_CLIENT**: En attente d'une action du client

## Transitions d'État

Le schéma suivant montre les transitions d'état possibles:

```
EN_ATTENTE → PLANIFIEE → EN_COURS → TERMINEE
     ↓            ↓          ↓          ↓
  ANNULEE      ANNULEE    EN_PAUSE   (Satisfaction)
                             ↓
                          EN_COURS
```

## Navigation dans l'Interface

### Pour les Techniciens
- **Détails du ticket**: Vue complète du ticket avec toutes les actions disponibles
- **Bouton Démarrer**: Commence l'intervention (statut EN_COURS)
- **Bouton Diagnostic**: Accès au formulaire de diagnostic technique
- **Bouton Solution**: Accès au formulaire de solution et coûts
- **Bouton Terminer**: Clôture l'intervention (statut TERMINEE)
- **Bouton Pause**: Met l'intervention en pause (statut EN_PAUSE)
- **Bouton Reprendre**: Reprend une intervention en pause (statut EN_COURS)
- **Bouton Annuler**: Annule l'intervention (statut ANNULEE)

### Pour les Clients
- **Liste des demandes**: Vue de toutes les demandes avec leur statut
- **Détails de la demande**: Vue des informations sur l'intervention
- **Bouton Évaluer**: Disponible pour les interventions terminées, permet de donner une note de satisfaction

## Autorisations

- **Techniciens**: Peuvent créer, diagnostiquer, résoudre et clôturer des tickets
- **Administrateurs**: Peuvent assigner, réassigner et gérer tous les tickets
- **Clients**: Peuvent créer des tickets, suivre leur progression et évaluer les interventions terminées

## Bonnes Pratiques

1. **Diagnostic précis**: Documentez clairement les symptômes observés et les causes identifiées
2. **Solution détaillée**: Décrivez précisément les actions réalisées pour résoudre le problème
3. **Coûts transparents**: Saisissez tous les coûts de manière détaillée et justifiée
4. **Communication client**: Informez le client des étapes clés (diagnostic, solution proposée)
5. **Satisfaction client**: Encouragez le client à donner son avis pour améliorer continuellement le service
