# EP-03 — Profils utilisateurs

## Objectif

Permettre à chaque membre de renseigner et gérer son profil personnel, de choisir son ou ses profils d'engagement, et garantir la conformité RGPD sur l'ensemble de la plateforme.

## Acteurs concernés

- **Utilisateur** (tout profil) — gestion de son propre profil
- **Utilisateur / Famille d'accueil** — champs spécifiques d'accueil
- **Administrateur** — consultation et modération des profils
- **Système** — gestion du cycle de vie (suppression, archivage)

## Règles métier clés

- Tous les champs personnels sont **facultatifs** (sauf email, géré par l'IAM)
- Champs à finaliser en atelier (base : formulaire Google Adoptant existant)
- Profils disponibles : `Bénévole` (défaut proposé), `Adoptant`, `Famille d'accueil`, `Administrateur` (non auto-sélectionnable)
- Un utilisateur peut cumuler plusieurs profils
- Au moins un profil requis à tout moment
- Retrait d'un profil : données conservées en lecture, transfert de propriété des ressources possible
- Contact RGPD : `rgpd@repousse.org`
- Suppression de compte : données personnelles effacées, ressources anonymisées et archivées

## Profils utilisateur

| Profil | Description | Attribution |
|--------|-------------|-------------|
| **Bénévole** | Suit les activités, participe aux ateliers | Auto (proposé par défaut) |
| **Adoptant** | Réserve des plants, gère des projets de plantation | Auto-sélection |
| **Famille d'accueil** | Conserve et multiplie de jeunes plants avant distribution | Auto-sélection |
| **Administrateur** | Coordination, bureau, CA, équipe salariée | Attribution par superadmin uniquement |

## Parcours utilisateurs

### Bénévole

> Profil par défaut — attribué automatiquement à tout nouveau compte.

```
Inscription (HelloAsso / formulaire)
  ↓
Activation du compte (email — EP-02)
  ↓
1ère connexion → onboarding guidé
  · Profil "Bénévole" pré-coché
  · Invitation à compléter le profil (non bloquante)
  · Indication des autres profils disponibles
  ↓
Accès à l'espace membre
  · Calendrier des ateliers & événements
  · Actualités de l'association
  · Tableau de bord personnel (projets suivis, connexions)
  ↓
Évolution possible → sélection d'un profil supplémentaire
  (Adoptant ou Famille d'accueil depuis les paramètres)
```

**Déclencheurs de montée en profil :**
- Envie de réserver des plants → ajouter Adoptant
- Souhait d'héberger des jeunes plants → ajouter Famille d'accueil
- Recrutement par l'association → attribution Administrateur

---

### Adoptant

> Profil auto-sélectionnable — débloque la réservation de plants et la création de projets.

```
Compte existant (Bénévole) OU nouveau compte
  ↓
Sélection du profil "Adoptant" dans Paramètres → Profil
  · Description du profil affichée (engagement, responsabilités)
  · Confirmation explicite
  ↓
Complétion des champs profil Adoptant (facultatifs)
  · Localisation de plantation souhaitée
  · Type d'espace disponible (jardin privé, espace public, entreprise…)
  · Souhait d'engagement (champ libre)
  · Préférences d'espèces (à relier EP-05)
  ↓
Accès débloqué
  · Réservation de plants lors des distributions (EP-01)
  · Création et suivi de projets de plantation (EP-04)
  · Page profil publique (si activée)
  ↓
Cycle de plantation
  · Réservation → Retrait lors d'un atelier → Plantation → Suivi → Rapport
```

**Points de friction identifiés :**
- L'Adoptant doit savoir qu'il peut avoir plusieurs profils simultanément
- La distinction Adoptant / Famille d'accueil n'est pas intuitive — décrire clairement à l'onboarding

---

### Famille d'accueil

> Profil auto-sélectionnable — rôle logistique clé pour la conservation des jeunes plants avant distribution.

```
Compte existant (généralement aussi Bénévole)
  ↓
Sélection du profil "Famille d'accueil" dans Paramètres → Profil
  · Présentation du rôle et des responsabilités
  · Engagement de disponibilité demandé (non contractuel)
  ↓
Complétion des champs spécifiques (facultatifs mais utiles)
  · Adresse d'accueil (ou zone géographique)
  · Capacité de stockage (nombre de plants / surface)
  · Espèces pouvant être accueillies (sélection multi — EP-05)
  · Disponibilités générales (saisonnières, ponctuelles)
  · Équipements disponibles (serre, bâche, arrosage automatique…)
  ↓
Visibilité coordinateurs
  · Profil apparaît dans l'interface admin (EP-03, US-PROFIL-09)
  · Coordinateurs peuvent assigner un lot de plants à la famille
  ↓
Cycle d'hébergement
  · Assignation d'un lot → Accueil des plants → Suivi de croissance
  → Notification de distribution → Remise aux adoptants lors d'un atelier
```

**Contraintes métier spécifiques :**
- Une famille d'accueil peut héberger des plants pour plusieurs espèces simultanément
- La capacité renseignée est indicative — le coordinateur valide la disponibilité avant assignation
- En cas d'indisponibilité soudaine, le coordinateur doit pouvoir réassigner rapidement → notification urgente à prévoir

---

## Matrice d'accès par profil

| Fonctionnalité | Bénévole | Adoptant | Famille d'accueil | Administrateur |
|----------------|:--------:|:--------:|:-----------------:|:--------------:|
| Voir son profil & le modifier | ✓ | ✓ | ✓ | ✓ |
| Voir les profils publics des autres membres | ✓ | ✓ | ✓ | ✓ |
| Consulter le calendrier / ateliers | ✓ | ✓ | ✓ | ✓ |
| Réserver des plants (distributions) | — | ✓ | — | ✓ |
| Créer un projet de plantation | — | ✓ | — | ✓ |
| Être assigné·e comme famille d'accueil | — | — | ✓ | — |
| Renseigner capacités d'hébergement | — | — | ✓ | — |
| Consulter tous les profils (admin) | — | — | — | ✓ |
| Modifier un profil en modération | — | — | — | ✓ |
| Gérer les espèces végétales | — | — | — | ✓ |
| Gérer les distributions | — | — | — | ✓ |
| Accéder aux automatisations (imports) | — | — | — | ✓ |

---

## Données collectées par profil

### Champs communs (tous profils)

| Champ | Type | Obligatoire | Source |
|-------|------|:-----------:|--------|
| Email | string | ✓ (IAM) | HelloAsso / Hanko |
| Prénom | string | — | Profil utilisateur |
| Nom | string | — | Profil utilisateur |
| Photo de profil | image | — | Upload |
| Profil(s) actif(s) | enum[] | ✓ | Sélection utilisateur |
| Préférences de notifications | json | — | Paramètres |
| Statut du compte | enum | ✓ (système) | Calculé |
| Date d'inscription | datetime | ✓ (système) | Généré |
| Dernière connexion | datetime | ✓ (système) | Généré |

### Champs spécifiques — Adoptant

| Champ | Type | Remarque |
|-------|------|----------|
| Localisation de plantation | string / coordonnées | Zone ou adresse indicative |
| Type d'espace disponible | enum | Jardin privé, espace public, entreprise, balcon… |
| Souhait d'engagement | text | Champ libre |
| Espèces souhaitées | taxon[] | Lié EP-05 |

### Champs spécifiques — Famille d'accueil

| Champ | Type | Remarque |
|-------|------|----------|
| Adresse d'accueil | string / coordonnées | Peut différer de l'adresse personnelle |
| Capacité (nombre de plants) | integer | Indicatif |
| Surface disponible (m²) | float | Facultatif |
| Espèces pouvant être accueillies | taxon[] | Lié EP-05 |
| Disponibilités | text / enum | Saisonnière, ponctuelle, permanente |
| Équipements | enum[] | Serre, bâche, arrosage auto, lumière artificielle… |

---

## Récits utilisateurs

### Complétion du profil

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROFIL-01 | Renseigner ses informations personnelles | Should |
| US-PROFIL-02 | Ajouter une photo de profil | Could |
| US-PROFIL-03 | Gérer ses préférences de notifications | Should |

### Sélection des profils

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROFIL-04 | Sélectionner son ou ses profils utilisateur | Must |
| US-PROFIL-05 | Retirer un profil et transférer ses ressources | Should |

### Profil Famille d'accueil

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROFIL-06 | Renseigner les informations spécifiques Famille d'accueil | Should |

### RGPD & suppression

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROFIL-07 | Accéder aux informations RGPD | Must |
| US-PROFIL-08 | Supprimer son compte | Must |

### Administration

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROFIL-09 | Consulter le profil d'un utilisateur (Admin) | Must |
| US-PROFIL-10 | Modifier le profil d'un utilisateur pour modération (Admin) | Should |

## Détail des récits

### US-PROFIL-01 — Renseigner ses informations personnelles
**En tant qu'** Utilisateur, **je veux** compléter mon profil **afin de** personnaliser mon espace et faciliter les échanges avec l'association.

**Critères d'acceptation :**
- Accessible depuis les paramètres du compte après activation
- Champs disponibles (tous facultatifs) : nom, prénom, adresse postale, souhait d'engagement (champ libre), préférences de notifications
- *(Liste complète à définir en atelier — base : formulaire Google Adoptant)*
- Indicateur de complétion du profil (non bloquant)
- Données modifiables à tout moment
- Mention RGPD avec contact `rgpd@repousse.org` affichée sur le formulaire

---

### US-PROFIL-02 — Ajouter une photo de profil
**En tant qu'** Utilisateur, **je veux** télécharger une photo de profil **afin de** personnaliser mon compte.

**Critères d'acceptation :**
- Formats acceptés : JPG, PNG *(taille max à définir)*
- Recadrage simple proposé après upload
- Photo supprimable et remplaçable à tout moment
- Avatar par défaut (initiales ou icône neutre) si aucune photo

---

### US-PROFIL-03 — Gérer ses préférences de notifications
**En tant qu'** Utilisateur, **je veux** configurer mes préférences de communication **afin de** contrôler les emails reçus.

**Critères d'acceptation :**
- Notifications de sécurité (activation, connexion) : obligatoires, non désactivables
- Autres catégories activables/désactivables individuellement *(catégories à définir en atelier)*
- Préférences modifiables depuis les paramètres du profil

---

### US-PROFIL-04 — Sélectionner son ou ses profils utilisateur
**En tant qu'** Utilisateur, **je veux** choisir un ou plusieurs profils **afin que** la plateforme adapte mon expérience à mon engagement.

**Critères d'acceptation :**
- Profils disponibles : Bénévole (coché par défaut), Adoptant, Famille d'accueil
- Profil Administrateur non proposé à l'auto-sélection dans cette version
- Chaque profil accompagné d'une description courte
- Au moins un profil requis
- Profils modifiables depuis les paramètres du compte

---

### US-PROFIL-05 — Retirer un profil et transférer ses ressources
**En tant qu'** Utilisateur, **je veux** retirer un profil de mon compte **afin de** faire évoluer mon engagement, sans perdre les ressources créées.

**Critères d'acceptation :**
- Si des ressources sont liées au profil à retirer : avertissement avant confirmation
- Possibilité de transférer la propriété de chaque ressource à un utilisateur avec le profil adéquat
- Ressources non transférées : passage en lecture seule, visibles des admins
- Retrait bloqué si aucun autre profil actif (au moins un requis)

---

### US-PROFIL-06 — Renseigner les informations spécifiques Famille d'accueil
**En tant qu'** Utilisateur avec le profil Famille d'accueil, **je veux** renseigner mes capacités d'accueil **afin que** les coordinateurs puissent organiser la conservation des jeunes plants.

**Critères d'acceptation :**
- Champs spécifiques (facultatifs) : localisation/adresse d'accueil, capacité de stockage (nombre de plants ou surface), espèces pouvant être accueillies (sélection depuis la liste des taxons), disponibilités générales *(à affiner en atelier)*
- Champs visibles et accessibles uniquement si profil Famille d'accueil actif
- Informations consultables par les coordinateurs depuis l'interface d'administration

---

### US-PROFIL-07 — Accéder aux informations RGPD
**En tant qu'** Utilisateur, **je veux** accéder facilement aux informations sur la gestion de mes données **afin d'** exercer mes droits.

**Critères d'acceptation :**
- Lien vers la politique de confidentialité et le contact RGPD (`rgpd@repousse.org`) accessible depuis toutes les pages (pied de page)
- Page profil affiche un résumé des données personnelles conservées

---

### US-PROFIL-08 — Supprimer son compte
**En tant qu'** Utilisateur, **je veux** pouvoir supprimer mon compte **afin d'** exercer mon droit à l'effacement.

**Critères d'acceptation :**
- Accessible depuis les paramètres du compte
- Confirmation explicite avec récapitulatif des conséquences (données supprimées, ressources archivées)
- Données personnelles (nom, prénom, email, adresse) **effacées**
- Ressources créées : anonymisées et archivées (cohérence historique préservée)
- Export brut des données personnelles proposé avant suppression définitive
- Email de confirmation envoyé après suppression

---

### US-PROFIL-09 — Consulter le profil d'un utilisateur (Admin)
**En tant qu'** Administrateur, **je veux** consulter le profil complet d'un utilisateur **afin d'** assurer la modération.

**Critères d'acceptation :**
- Accès en lecture : données personnelles, profils actifs, préférences, ressources liées, statut du compte
- Historique des modifications du profil consultable (champ modifié, ancienne valeur, date, auteur)
- Accès admin tracé *(recommandé pour conformité RGPD)*

---

### US-PROFIL-10 — Modifier le profil d'un utilisateur pour modération (Admin)
**En tant qu'** Administrateur, **je veux** modifier le profil d'un utilisateur **afin d'** intervenir en cas de problème signalé.

**Critères d'acceptation :**
- Accès en modification à l'ensemble des champs
- Toute modification tracée (champ, ancienne valeur, auteur admin, date)
- Notification email à l'utilisateur concerné *(sauf si désactivée pour raison de modération — décision à prendre)*

---

## Points ouverts

- Liste définitive des champs profil — atelier prestataire (base : formulaire Google Adoptant)
- Catégories de notifications — atelier prestataire
- Champs spécifiques Famille d'accueil — atelier prestataire
- Notification à l'utilisateur lors d'une modification admin — décision à prendre

## Dépendances

- **EP-02** (Auth) — activation de compte prérequis
- **EP-04** (Projets) — profil Adoptant requis pour créer un projet de plantation
- **EP-01** (Distributions) — profil Adoptant requis pour réserver
- **EP-05** (Taxons) — sélection d'espèces dans le profil Famille d'accueil
