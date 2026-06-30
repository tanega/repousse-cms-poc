# EP-05 — Gestion des taxons végétaux

## Objectif

Maintenir une liste de référence contrôlée des genres, espèces et variétés végétaux disponibles pour la configuration des stocks de distribution, la sélection dans les projets de plantation, et le calcul des indicateurs d'impact environnemental. Enrichir cette liste de ressources pédagogiques pour la communauté Repousse.

## Acteurs concernés

- **Administrateur** — CRUD des taxons, catégories, import, liens externes
- **Éditeur taxons** — rôle spécifique attribué par un Admin pour les ressources pédagogiques communautaires
- **Utilisateur connecté** — consultation et recherche
- **Système** — import en masse, versionning, protection des taxons utilisés

## Règles métier clés

- Hiérarchie taxonomique sur **3 niveaux** : Genre → Espèce → Variété/Cultivar
- Chaque taxon possède un **nom commun de référence unique** (un seul par taxon dans cette version)
- Un taxon appartient à **une seule catégorie**
- Les catégories sont **administrables** (liste non figée dans le code)
- La suppression d'un taxon utilisé dans une distribution ou un projet est **bloquée**
- Les entrées **non-taxonomiques** sont autorisées (ex: "Plante grimpante non identifiée") — sans nom latin obligatoire
- Gestion des synonymes et fusion de doublons **hors-scope v1**
- L'historique des modifications est versionné avec possibilité de **restauration**
- La liste de référence est conçue pour être **réutilisable par d'autres instances** de l'application (configuration par zone biogéographique à l'installation)

## Récits utilisateurs

### Gestion des catégories

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-TAX-01 | Administrer les catégories de taxons | Must |

### Gestion des taxons

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-TAX-02 | Créer un taxon | Must |
| US-TAX-03 | Gérer la hiérarchie taxonomique | Must |
| US-TAX-04 | Modifier un taxon | Must |
| US-TAX-05 | Restaurer une version antérieure d'un taxon | Should |
| US-TAX-06 | Supprimer un taxon | Should |

### Import en masse

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-TAX-07 | Importer des taxons depuis une source externe | Must |

### Ressources pédagogiques

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-TAX-08 | Ajouter des liens vers des bases de connaissance externes | Should |
| US-TAX-09 | Ajouter des ressources communautaires à un taxon | Could |

### Consultation

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-TAX-10 | Consulter et rechercher la liste des taxons | Must |
| US-TAX-11 | Consulter la fiche détail d'un taxon | Should |

### Configuration initiale

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-TAX-12 | Configurer la liste de référence à l'installation | Must |

## Détail des récits

### US-TAX-01 — Administrer les catégories de taxons
**En tant qu'** Administrateur, **je veux** créer et gérer une liste de catégories **afin de** classifier les taxons pour la recherche et les agrégations d'indicateurs.

**Critères d'acceptation :**
- Création, renommage et suppression de catégories (ex : arbre, arbuste, fruitier, plante grimpante)
- Suppression bloquée si des taxons utilisent encore la catégorie
- Un taxon appartient à une seule catégorie

---

### US-TAX-02 — Créer un taxon
**En tant qu'** Administrateur, **je veux** ajouter un taxon à la liste de référence **afin de** constituer le référentiel des végétaux disponibles.

**Critères d'acceptation :**
- Champs disponibles :
  - Nom scientifique (latin) *(obligatoire sauf entrée non-taxonomique)*
  - Nom commun de référence *(obligatoire)*
  - Niveau taxonomique : Genre / Espèce / Variété ou Cultivar
  - Taxon parent (sélection dans la liste existante, facultatif)
  - Catégorie (sélection depuis la liste administrable)
  - Indicateur "entrée non-taxonomique" — dispense du nom latin
- Création tracée (auteur, date)

---

### US-TAX-03 — Gérer la hiérarchie taxonomique
**En tant qu'** Administrateur, **je veux** associer un taxon à son parent taxonomique **afin de** structurer les parentés pour l'agrégation des indicateurs.

**Critères d'acceptation :**
- Un taxon peut avoir un taxon parent
- Hiérarchie limitée à **3 niveaux** : Genre → Espèce → Variété/Cultivar
- Entrées non-taxonomiques : peuvent avoir un parent ou rester en racine
- Suppression d'un taxon parent bloquée s'il possède des enfants

---

### US-TAX-04 — Modifier un taxon
**En tant qu'** Administrateur, **je veux** modifier les informations d'un taxon **afin de** corriger ou enrichir les données de référence.

**Critères d'acceptation :**
- Tous les champs modifiables
- Chaque modification génère une nouvelle version dans l'historique (champ modifié, ancienne valeur, auteur, date)

---

### US-TAX-05 — Restaurer une version antérieure d'un taxon
**En tant qu'** Administrateur, **je veux** restaurer une version précédente d'un taxon **afin d'** annuler une modification erronée.

**Critères d'acceptation :**
- Historique des versions consultable depuis la fiche du taxon
- Restauration possible de n'importe quelle version antérieure
- La restauration crée une **nouvelle version** (pas d'écrasement silencieux)
- Historique complet conservé après restauration

---

### US-TAX-06 — Supprimer un taxon
**En tant qu'** Administrateur, **je veux** supprimer un taxon **afin de** retirer une entrée erronée ou obsolète.

**Critères d'acceptation :**
- Suppression **bloquée** si taxon référencé dans une distribution, un stock ou un projet de plantation
- Message d'erreur listant les ressources qui utilisent le taxon
- Suppression bloquée si le taxon possède des taxons enfants

---

### US-TAX-07 — Importer des taxons depuis une source externe
**En tant qu'** Administrateur, **je veux** importer une liste de taxons depuis un fichier structuré **afin d'** alimenter rapidement la liste de référence lors de l'initialisation.

**Critères d'acceptation :**
- Format : CSV avec schéma documenté *(colonnes : nom scientifique, nom commun, niveau taxonomique, parent, catégorie, entrée non-taxonomique — schéma à définir avec le prestataire)*
- Rapport d'import généré : comptes créés, lignes ignorées (doublons, erreurs de format), détail des erreurs
- Doublons (même nom scientifique) : signalés, non fusionnés automatiquement dans cette version
- Source conçue pour être réutilisable par d'autres instances de l'application

---

### US-TAX-08 — Ajouter des liens vers des bases de connaissance externes
**En tant qu'** Administrateur ou Éditeur taxons, **je veux** associer des liens vers des bases de connaissance externes à la fiche d'un taxon **afin d'** enrichir les ressources pédagogiques.

**Critères d'acceptation :**
- Un ou plusieurs liens URL par taxon, par base de connaissance (Floriscope, Wikipedia/Wikidata, Encyclopedia of Life, DoPI, GloBI, autres)
- Libellé de source associé à chaque lien (liste de sources ou saisie libre)
- Liens affichés sur la fiche détail du taxon
- Intégration : simples URLs stockées en base dans cette version (pas d'API structurée)

---

### US-TAX-09 — Ajouter des ressources communautaires à un taxon
**En tant qu'** Administrateur ou Éditeur taxons, **je veux** ajouter des photos, articles ou guides communautaires **afin de** constituer une base de ressources pédagogiques propres à Repousse.

**Critères d'acceptation :**
- Types acceptés : photos (JPG, PNG), documents PDF, articles (texte formaté)
- Médias stockés dans le même système que les autres ressources de la plateforme *(quota à définir)*
- Titre et description courte facultatifs par ressource
- Rôle Éditeur taxons distinct des autres rôles éditeurs — attribué explicitement par un Admin

---

### US-TAX-10 — Consulter et rechercher la liste des taxons
**En tant qu'** Utilisateur connecté, **je veux** parcourir et rechercher la liste des taxons **afin de** trouver une espèce pour un projet ou une réservation.

**Critères d'acceptation :**
- Filtres disponibles : catégorie, niveau taxonomique, présence de ressources pédagogiques
- Recherche sur le nom scientifique et le nom commun
- Entrées non-taxonomiques clairement identifiées dans la liste
- Accessible aux utilisateurs connectés uniquement

---

### US-TAX-11 — Consulter la fiche détail d'un taxon
**En tant qu'** Utilisateur connecté, **je veux** consulter la fiche complète d'un taxon **afin d'** accéder à toutes les informations disponibles.

**Critères d'acceptation :**
- Affiche : nom scientifique, nom commun, niveau taxonomique, taxon parent (avec lien), catégorie, liens vers bases de connaissance, ressources communautaires
- Hiérarchie taxonomique visualisable (chemin : Genre → Espèce → Variété)
- Accessible aux utilisateurs connectés uniquement dans cette version

---

### US-TAX-12 — Configurer la liste de référence à l'installation
**En tant qu'** Administrateur technique, **je veux** sélectionner ou importer une liste de référence adaptée à la zone biogéographique lors de l'installation **afin que** le référentiel soit pertinent dès le démarrage.

**Critères d'acceptation :**
- Plusieurs listes pré-constituées disponibles selon la zone biogéographique (ex : océanique, continentale, méditerranéenne)
- Sélection d'une liste au démarrage → alimentation automatique via le mécanisme d'import (US-TAX-07)
- Instance peut fonctionner avec une liste personnalisée indépendante
- Liste de référence utilisée indiquée dans les paramètres de l'application

---

## Points ouverts

- Schéma CSV d'import — à définir en atelier avec le prestataire
- Quota de stockage médias taxons — partagé avec quota global ou distinct ?
- Listes biogéographiques pré-constituées — maintenance par Repousse ou mutualisée entre instances ?
- Coefficients CO2 par catégorie de taxon — à définir (base : modèle Citizing)

## Dépendances

- **EP-01** (Distributions) — sélection des espèces pour les stocks
- **EP-03** (Profils) — sélection d'espèces dans le profil Famille d'accueil
- **EP-04** (Projets) — liste préférentielle d'espèces dans les projets de plantation
- **EP-06** (Dashboard) — agrégation par catégorie et hiérarchie taxonomique pour les indicateurs CO2
