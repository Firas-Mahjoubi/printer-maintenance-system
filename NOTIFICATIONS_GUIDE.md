# 🔔 Guide d'accès au Système de Notifications

## Accès à la page des notifications

### 1. Navigation via la barre latérale
- Dans la barre latérale gauche, cliquez sur **"Notifications"**
- Un badge rouge affiche le nombre de notifications non lues
- URL directe : `/notifications`

### 2. Navigation programmatique
```typescript
// Dans un composant Angular
this.router.navigate(['/notifications']);
```

### 3. Lien direct
```html
<a routerLink="/notifications">Voir les notifications</a>
```

---

## Fonctionnalités disponibles

### 📋 **Liste des notifications**
- Affichage de toutes les notifications ou uniquement des non lues
- Filtrage par statut (lue/non lue)
- Tri par date de création (plus récentes en premier)

### 🎯 **Types de notifications**
- **ALERTE_ECHEANCE** : Contrat proche de l'échéance (30, 15, 7, 3, 1 jours)
- **CONTRAT_EXPIRE** : Contrat arrivé à expiration
- **MAINTENANCE_PREVUE** : Maintenance programmée
- **INTERVENTION_TERMINEE** : Intervention terminée
- **URGENT** : Notifications urgentes
- **INFO_GENERALE** : Informations générales

### ⚡ **Actions disponibles**
- **Marquer comme lue** : Clic sur la notification ou menu contextuel
- **Tout marquer comme lu** : Bouton dans l'en-tête
- **Supprimer** : Menu contextuel > Supprimer
- **Voir le contrat** : Navigation directe vers les détails du contrat

### 📊 **Statistiques**
- **Total** : Nombre total de notifications
- **Non lues** : Notifications en attente de lecture
- **Lues** : Notifications déjà consultées
- **Urgentes** : Notifications critiques (expiration, urgent)

---

## Automatisation

### 🕘 **Vérifications automatiques**
- **9h00 chaque jour** : Vérification des échéances de contrats
- **9h00 chaque jour** : Mise à jour des statuts de contrats expirés
- **2h00 chaque jour** : Nettoyage des notifications anciennes (>30 jours)

### 🔄 **Actualisation temps réel**
- Actualisation automatique toutes les **30 secondes**
- Compteur mis à jour en temps réel dans la sidebar
- Badges de notification synchronisés

---

## API Endpoints (Backend)

### Récupération des notifications
```http
GET /api/notifications/user/{userId}           # Toutes les notifications
GET /api/notifications/user/{userId}/unread    # Notifications non lues
GET /api/notifications/user/{userId}/count-unread  # Compteur non lues
```

### Actions sur les notifications
```http
PUT /api/notifications/mark-read/{id}          # Marquer comme lue
PUT /api/notifications/mark-all-read/{userId}  # Tout marquer comme lu
DELETE /api/notifications/delete/{id}          # Supprimer
```

### Administration
```http
GET /api/notifications/all                     # Toutes (admin)
POST /api/notifications/check-contract-expiry  # Forcer vérification
```

---

## Configuration des alertes

### ⏰ **Seuils d'alerte par défaut**
- **30 jours** avant échéance
- **15 jours** avant échéance
- **7 jours** avant échéance
- **3 jours** avant échéance
- **1 jour** avant échéance

### 👥 **Destinataires**
- Les notifications sont envoyées à tous les utilisateurs avec le rôle **ADMIN**
- Chaque admin reçoit ses propres notifications personnalisées

---

## Codes couleurs et icônes

### 🎨 **Types et couleurs**
- 🟡 **ALERTE_ECHEANCE** : Jaune (warning) - ⏰ `bi-clock-history`
- 🔴 **CONTRAT_EXPIRE** : Rouge (danger) - ⚠️ `bi-exclamation-triangle-fill`
- 🔵 **MAINTENANCE_PREVUE** : Bleu (info) - 📅 `bi-calendar-check`
- 🟢 **INTERVENTION_TERMINEE** : Vert (success) - ✅ `bi-check-circle-fill`
- 🔴 **URGENT** : Rouge (danger) - 🚨 `bi-exclamation-circle-fill`
- ⚫ **INFO_GENERALE** : Gris (secondary) - ℹ️ `bi-info-circle`

---

## Utilisation recommandée

### 📝 **Workflow quotidien**
1. **Matin** : Consulter les nouvelles notifications
2. **Traitement** : Agir sur les alertes d'échéance (renouveler contrats)
3. **Suivi** : Marquer les notifications traitées comme lues
4. **Nettoyage** : Supprimer les notifications obsolètes

### 🚀 **Bonnes pratiques**
- Vérifier les notifications au moins une fois par jour
- Traiter immédiatement les notifications URGENT et CONTRAT_EXPIRE
- Anticiper les renouvellements dès les alertes 30 jours
- Utiliser le filtrage pour se concentrer sur les non lues

---

## Dépannage

### ❌ **Problèmes courants**
- **Badge ne s'affiche pas** : Vérifier la connexion API backend
- **Notifications non mises à jour** : Actualiser la page ou vérifier le service
- **Erreur de chargement** : Vérifier que le backend est démarré sur le port 8081

### 🔧 **Logs et monitoring**
- Consulter la console du navigateur pour les erreurs frontend
- Vérifier les logs backend pour les tâches programmées
- Contrôler la base de données pour l'état des notifications

---

**✅ Le système de notifications est maintenant opérationnel et accessible via `/notifications`**
