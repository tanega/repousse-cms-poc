# EP-01 — Gestion des distributions

## Objectif

Permettre à l'équipe de coordination de Repousse de créer et publier des événements de distribution de végétaux, et aux membres Adoptants de s'y inscrire et gérer leurs réservations.

## Acteurs concernés

- **Coordinateur / Admin** — création, publication, validation terrain
- **Adoptant** — inscription, réservation, annulation
- **Système** — automatisations (stock, emails, liste d'attente)

## Règles métier clés

- Stock commun partagé entre tous les créneaux d'un même événement
- Réservation décrémente immédiatement le stock
- Un Adoptant = une seule réservation active par événement
- Annulation possible jusqu'à 48h avant le créneau réservé
- Projet de plantation **obligatoire** à sélectionner lors de la réservation
- Statuts événement : `Brouillon` → `Publié` → `Clôturé`
- Publication déclenche automatiquement un email aux membres adhérents
- Interface terrain : PWA mobile

## Récits utilisateurs

### Coordinateur — Gestion d'événement

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DIST-01 | Créer un événement de distribution | Must |
| US-DIST-02 | Gérer les créneaux de distribution | Must |
| US-DIST-03 | Gérer le stock d'espèces végétales d'un événement | Must |
| US-DIST-04 | Gérer le statut d'un événement | Must |
| US-DIST-05 | Publier un événement et déclencher la campagne email | Must |

### Adoptant — Réservation

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DIST-06 | Consulter un événement de distribution | Must |
| US-DIST-07 | S'inscrire à un créneau de distribution | Must |
| US-DIST-08 | Rejoindre la liste d'attente | Should |
| US-DIST-09 | Annuler une réservation | Must |

### Coordinateur — Jour J

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DIST-10 | Consulter les inscrits d'un créneau (mobile) | Must |
| US-DIST-11 | Valider les quantités distribuées | Must |

## Détail des récits

### US-DIST-01 — Créer un événement de distribution
**En tant que** Coordinateur, **je veux** créer un événement de distribution **afin de** structurer et publier une campagne de distribution de végétaux.

**Critères d'acceptation :**
- Champs : intitulé *(obligatoire)*, description (format riche pour template email), contact général, image facultative
- Créé en statut **Brouillon** par défaut
- Lien permanent partageable généré automatiquement à la création
- Seuls les Coordinateurs (rôle Admin) peuvent créer un événement

---

### US-DIST-02 — Gérer les créneaux de distribution
**En tant que** Coordinateur, **je veux** ajouter un ou plusieurs créneaux à un événement **afin de** proposer aux Adoptants plusieurs options de lieu, date et horaire.

**Critères d'acceptation :**
- Chaque créneau : lieu, date, heure début, heure fin, contact du créneau
- Ajout, modification, suppression tant que l'événement n'est pas Clôturé
- Suppression d'un créneau avec réservations actives : bloquée ou alerte explicite

---

### US-DIST-03 — Gérer le stock d'espèces végétales d'un événement
**En tant que** Coordinateur, **je veux** associer des espèces et leur stock disponible à un événement **afin que** les Adoptants puissent réserver dans la limite du stock commun.

**Critères d'acceptation :**
- Sélection des espèces depuis la liste administrable des taxons (EP-05)
- Quantité disponible par espèce ou indication "quantité inconnue"
- Stock partagé entre tous les créneaux de l'événement
- Stock résiduel visible en temps réel dans l'interface de gestion

---

### US-DIST-04 — Gérer le statut d'un événement
**En tant que** Coordinateur, **je veux** faire évoluer le statut d'un événement **afin de** contrôler sa visibilité et son cycle de vie.

**Critères d'acceptation :**
- Transitions : `Brouillon` → `Publié` → `Clôturé`
- Brouillon : non visible par les Adoptants
- Publié : accessible via lien permanent, réservations ouvertes
- Clôturé : plus de réservation ni d'annulation possible ; événement consultable en lecture
- Retour Publié → Brouillon : possible si aucune réservation, sinon confirmation explicite requise

---

### US-DIST-05 — Publier un événement et déclencher la campagne email
**En tant que** Coordinateur, **je veux** que la publication déclenche automatiquement un email aux membres adhérents **afin de** les informer de l'ouverture des inscriptions.

**Critères d'acceptation :**
- Email automatique à la transition Brouillon → Publié
- Email inclut la description et le lien permanent de réservation
- Aperçu de l'email consultable avant publication
- Envoi tracé (date, nombre de destinataires)

---

### US-DIST-06 — Consulter un événement de distribution
**En tant qu'** Adoptant, **je veux** accéder à la page d'un événement via le lien partagé **afin de** consulter les créneaux disponibles.

**Critères d'acceptation :**
- Affiche : intitulé, description, créneaux (lieu, date, horaires, contact), espèces disponibles avec stock résiduel
- Accessible aux membres adhérents authentifiés uniquement
- Si Clôturé : lecture seule avec mention explicite

---

### US-DIST-07 — S'inscrire à un créneau de distribution
**En tant qu'** Adoptant, **je veux** réserver des plants sur un créneau **afin de** planifier ma collecte.

**Critères d'acceptation :**
- Sélection d'un créneau parmi ceux disponibles
- Saisie de la quantité souhaitée par espèce (dans la limite du stock résiduel)
- Sélection obligatoire d'un projet de plantation depuis son profil
- Réservation décrémente immédiatement le stock commun
- Confirmation par email avec récapitulatif
- Une seule réservation active par événement et par Adoptant

---

### US-DIST-08 — Rejoindre la liste d'attente
**En tant qu'** Adoptant, **je veux** m'inscrire sur liste d'attente lorsque le stock d'une espèce est épuisé **afin d'** être averti si des plants se libèrent.

**Critères d'acceptation :**
- Disponible quand stock = 0
- En cas d'annulation libérant du stock, les Adoptants en attente sont notifiés par email (ordre d'inscription)
- L'Adoptant notifié dispose d'un délai défini pour confirmer *(délai à préciser)*
- Si délai expiré : stock proposé au suivant dans la liste

---

### US-DIST-09 — Annuler une réservation
**En tant qu'** Adoptant, **je veux** annuler ma réservation **afin de** libérer les plants que je ne pourrai pas collecter.

**Critères d'acceptation :**
- Annulation possible jusqu'à **48h avant** la date du créneau réservé
- Au-delà : annulation bloquée
- Annulation restitue le stock au pool commun de l'événement
- Adoptants en liste d'attente notifiés si stock libéré
- Confirmation d'annulation par email

---

### US-DIST-10 — Consulter les inscrits d'un créneau (mobile)
**En tant que** Coordinateur, **je veux** consulter la liste des Adoptants inscrits à un créneau depuis mon mobile **afin d'** organiser la distribution sur le terrain.

**Critères d'acceptation :**
- Interface PWA mobile
- Sélection d'un événement puis d'un créneau
- Liste affiche par Adoptant : nom, espèces réservées, quantités réservées, projet de plantation associé
- Données mises en cache pour usage hors connexion *(à confirmer selon contraintes techniques)*

---

### US-DIST-11 — Valider les quantités distribuées
**En tant que** Coordinateur, **je veux** saisir les quantités réellement distribuées à chaque Adoptant **afin de** conserver un historique fiable des distributions effectives.

**Critères d'acceptation :**
- Quantité réservée pré-remplie, modifiable librement par le coordinateur
- Possibilité de marquer un Adoptant comme "non venu"
- Validation enregistrée par Adoptant indépendamment
- Données synchronisées dès que la connexion est disponible

---

## Points ouverts

- Délai de confirmation après notification liste d'attente (US-DIST-08)
- Dérogation coordinateur pour annulation < 48h ?
- Export (CSV/PDF) de la liste des inscrits par créneau — prévu ?
- Disponibilité hors connexion (US-DIST-10) — à confirmer selon choix technique

## Dépendances

- **EP-02** (Auth) — authentification requise pour toutes les actions
- **EP-03** (Profils) — profil Adoptant + projet de plantation obligatoire à la réservation
- **EP-05** (Taxons) — sélection des espèces depuis la liste administrable
- **EP-06** (Dashboard) — données de distribution alimentent les indicateurs d'impact
