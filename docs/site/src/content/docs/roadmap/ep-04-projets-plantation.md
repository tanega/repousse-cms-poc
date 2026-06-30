---
title: "EP-04 — Projets de plantation"
---

# EP-04 — Projets de plantation

## Objectif

Permettre aux Adoptants et Administrateurs de créer, documenter et partager des projets de plantation numériques, afin de remplacer les formulaires Google fragmentés et offrir un historique structuré des actions de plantation.

## Acteurs concernés

- **Adoptant / Admin** (créateur) — création, gestion, administration du projet
- **Éditeur de projet** — contribution au contenu et au journal
- **Lecteur de projet** — consultation uniquement
- **Admin plateforme** — modération, accès à tous les projets
- **Système** — transfert automatique de propriété, archivage

## Règles métier clés

- Seuls les utilisateurs avec le profil **Adoptant** ou les **Administrateurs** peuvent créer un projet
- Le créateur devient automatiquement **administrateur du projet**
- Un projet peut avoir **plusieurs administrateurs**
- Statuts de publication : `Privé` (défaut) / `Public` / `Dépublié` (modération)
- Projets publics : visibles par les utilisateurs connectés uniquement (pas les visiteurs)
- Stock médias : **10 fichiers max** par projet — types : photos (JPG/PNG), vidéos, PDF
- Quota de stockage global plateforme : **5 Go** *(par projet ou global — à définir)*
- Journal d'actions : notes texte libres, postées par admin + éditeurs du projet, modifiables par leur auteur
- Suppression de compte du dernier admin : archivage automatique du projet
- Les membres actifs (admin + éditeurs) peuvent associer le projet à une réservation de distribution

## Récits utilisateurs

### Création & gestion

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROJET-01 | Créer un projet de plantation | Must |
| US-PROJET-02 | Modifier un projet de plantation | Must |
| US-PROJET-03 | Supprimer un projet de plantation | Should |

### Médias

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROJET-04 | Ajouter des médias à un projet | Should |
| US-PROJET-05 | Supprimer un média | Should |

### Membres & invitations

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROJET-06 | Inviter des membres à rejoindre un projet | Must |
| US-PROJET-07 | Gérer les membres d'un projet | Must |
| US-PROJET-08 | Transfert automatique de propriété | Must |

### Journal d'actions

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROJET-09 | Publier une note dans le journal | Should |
| US-PROJET-10 | Modifier ou supprimer une note du journal | Should |

### Tableau de bord & consultation

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROJET-11 | Consulter le tableau de bord d'un projet | Must |
| US-PROJET-12 | Rechercher et parcourir les projets publics | Should |

### Modération

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-PROJET-13 | Accéder à tous les projets (Admin plateforme) | Must |
| US-PROJET-14 | Dépublier un projet (Admin plateforme) | Should |
| US-PROJET-15 | Supprimer un projet (Admin plateforme) | Should |

## Détail des récits

### US-PROJET-01 — Créer un projet de plantation
**En tant qu'** Adoptant ou Administrateur, **je veux** créer un projet de plantation **afin de** documenter et suivre mon initiative.

**Critères d'acceptation :**
- Champs disponibles :
  - Nom du projet *(obligatoire)*
  - Description générale (texte libre)
  - Nature de la gestion : individuelle / collective (descriptif uniquement)
  - Localisation : saisie d'adresse avec géocodage, affichage carte interactive, adresse stockée en base
  - Surface approximative (m²)
  - Nature du sol (champ libre)
  - Liste préférentielle d'espèces (sélection multiple depuis la liste des taxons — EP-05)
  - Statut de publication : Privé (défaut) / Public
- Dates de création et de publication générées automatiquement
- Le créateur devient automatiquement administrateur du projet
- *(Liste complète des champs à finaliser en atelier)*

---

### US-PROJET-02 — Modifier un projet de plantation
**En tant qu'** Administrateur ou Éditeur d'un projet, **je veux** modifier les informations du projet **afin de** le maintenir à jour.

**Critères d'acceptation :**
- Tous les champs du formulaire modifiables
- Modifications horodatées dans l'historique du projet
- Un Lecteur ne peut pas modifier le contenu

---

### US-PROJET-03 — Supprimer un projet de plantation
**En tant qu'** Administrateur d'un projet, **je veux** supprimer mon projet **afin de** retirer une initiative abandonnée.

**Critères d'acceptation :**
- Confirmation explicite demandée avec liste des ressources associées
- Suppression définitive des données descriptives et médias
- Données d'impact (espèces/quantités distribuées associées) : anonymisées et conservées
- Action tracée côté administration plateforme

---

### US-PROJET-04 — Ajouter des médias à un projet
**En tant qu'** Administrateur ou Éditeur, **je veux** ajouter des médias **afin d'** illustrer et documenter l'évolution du projet.

**Critères d'acceptation :**
- Types acceptés : photos (JPG, PNG), vidéos, documents PDF
- Limite : **10 fichiers par projet**
- Quota de stockage global plateforme : **5 Go**
- Aperçu affiché après upload
- Titre/légende facultatifs par média
- Message d'erreur explicite en cas de dépassement de limite

---

### US-PROJET-05 — Supprimer un média
**En tant qu'** Administrateur ou Éditeur, **je veux** supprimer un média **afin de** maintenir la pertinence de la galerie.

**Critères d'acceptation :**
- Suppression possible par admin ou éditeur du projet
- Suppression libère le quota de stockage
- Confirmation avant suppression définitive

---

### US-PROJET-06 — Inviter des membres à rejoindre un projet
**En tant qu'** Administrateur d'un projet, **je veux** inviter d'autres utilisateurs **afin de** collaborer ou partager le suivi.

**Critères d'acceptation :**
- Deux modalités : par email ou par recherche d'utilisateur existant sur la plateforme
- Rôle attribué à l'invitation : **Lecteur** ou **Éditeur**
- Invité notifié (email + in-app) avec lien d'acceptation
- Invitation en attente visible dans la liste des membres
- Après acceptation : projet visible dans le profil de l'utilisateur invité

---

### US-PROJET-07 — Gérer les membres d'un projet
**En tant qu'** Administrateur d'un projet, **je veux** gérer les rôles et l'appartenance des membres **afin de** contrôler les contributions.

**Critères d'acceptation :**
- Promotion Lecteur → Éditeur, rétrogradation Éditeur → Lecteur
- Promotion Éditeur/Lecteur → Administrateur (co-admin)
- Retrait d'un membre — notification envoyée au membre retiré
- Au moins un administrateur requis à tout moment
- Un admin ne peut pas se retirer s'il est le seul admin du projet

---

### US-PROJET-08 — Transfert automatique de propriété
**En tant que** Système, **je veux** transférer l'administration d'un projet lors de la suppression du compte créateur **afin de** préserver la continuité.

**Critères d'acceptation :**
- Si d'autres admins existent : droits du compte supprimé retirés, co-admins conservent la gestion
- Si compte supprimé = seul admin : projet **archivé** (non modifiable, consultable par admins plateforme)
- Données du projet archivé conservées pour les indicateurs d'impact
- Membres restants notifiés de l'archivage

---

### US-PROJET-09 — Publier une note dans le journal du projet
**En tant qu'** Administrateur ou Éditeur d'un projet, **je veux** ajouter une note au journal **afin de** consigner l'historique des actions.

**Critères d'acceptation :**
- Note : contenu texte libre, date automatique, auteur automatique
- Notes affichées en ordre chronologique inversé
- Lecteurs : consultent le journal, ne peuvent pas poster de note

---

### US-PROJET-10 — Modifier ou supprimer une note du journal
**En tant qu'** auteur d'une note, **je veux** la modifier ou la supprimer **afin de** corriger une entrée erronée.

**Critères d'acceptation :**
- Seul l'auteur peut modifier ou supprimer sa note
- Modification affiche la date de dernière édition
- Un administrateur de projet peut supprimer n'importe quelle note (modération interne)

---

### US-PROJET-11 — Consulter le tableau de bord d'un projet
**En tant que** Membre d'un projet, **je veux** accéder à un tableau de bord synthétique **afin d'** avoir une vue d'ensemble rapide.

**Critères d'acceptation :**
- Affiche : informations générales, carte de localisation, liste des espèces préférentielles, galerie médias, liste des membres, journal d'actions
- Plants associés via distributions visibles (espèces, quantités, date)
- Interface adaptée mobile (PWA)

---

### US-PROJET-12 — Rechercher et parcourir les projets publics
**En tant qu'** Utilisateur connecté, **je veux** rechercher les projets de plantation publics **afin de** découvrir les initiatives des autres membres.

**Critères d'acceptation :**
- Projets publics listés et filtrables *(critères à définir en atelier : commune, espèces, nature individuelle/collective)*
- Projets privés non visibles dans les résultats (sauf membres du projet et admins plateforme)
- Depuis une fiche publique : possibilité de demander à rejoindre le projet *(ou invitation directe uniquement — à préciser)*

---

### US-PROJET-13 — Accéder à tous les projets (Admin plateforme)
**En tant qu'** Administrateur plateforme, **je veux** accéder à l'ensemble des projets **afin d'** assurer la modération.

**Critères d'acceptation :**
- Liste consultable avec filtres (statut : public/privé/dépublié, date de création, auteur)
- Accès admin aux projets privés tracé

---

### US-PROJET-14 — Dépublier un projet (Admin plateforme)
**En tant qu'** Administrateur plateforme, **je veux** dépublier un projet **afin de** retirer du contenu inapproprié sans suppression définitive.

**Critères d'acceptation :**
- Projet passe au statut **Dépublié** (distinct de Privé)
- Propriétaire notifié par email avec motif *(champ motif saisi par l'admin)*
- Projet dépublié non visible par les autres membres connectés
- L'admin du projet peut contacter `rgpd@repousse.org` pour contester
- Admin plateforme peut republier si situation résolue

---

### US-PROJET-15 — Supprimer un projet (Admin plateforme)
**En tant qu'** Administrateur plateforme, **je veux** supprimer définitivement un projet **afin de** retirer du contenu en violation grave.

**Critères d'acceptation :**
- Suppression définitive du contenu descriptif et des médias
- Données d'impact conservées sous forme anonymisée
- Propriétaire notifié par email avec motif
- Action tracée (auteur, date, motif)

---

## Points ouverts

- Quota 5 Go : global plateforme ou par utilisateur ? Qui est alerté en cas de dépassement proche ?
- Demande de rejoindre depuis fiche publique vs invitation directe uniquement — à préciser
- Critères de filtrage de la recherche — atelier prestataire
- Processus de contestation de dépublication — à préciser

## Dépendances

- **EP-02** (Auth) — authentification requise
- **EP-03** (Profils) — profil Adoptant requis pour créer un projet
- **EP-05** (Taxons) — liste des espèces préférentielles
- **EP-01** (Distributions) — association projet ↔ réservation de distribution
- **EP-06** (Dashboard) — données des projets alimentent la cartographie et les indicateurs
