# EP-06 — Tableau de bord & reporting

## Objectif

Offrir à l'équipe de coordination et aux administrateurs une vision consolidée des activités de l'association : indicateurs d'impact environnemental, cartographie des distributions et projets de plantation, calendrier des événements, et exports de données brutes. Compléter par un outil BI (Metabase) pour l'exploration avancée.

## Acteurs concernés

- **Administrateur** — accès complet, invite des utilisateurs, consulte tous les indicateurs
- **Utilisateur invité** — vue restreinte du tableau de bord
- **Coordination / CA** — accès à Metabase (outil séparé, self-hosted)
- **Système** — rafraîchissement quotidien des données

## Règles métier clés

- Tableau de bord unique avec plusieurs thématiques dans cette version
- Structure **fixe** dans cette version (pas de configuration utilisateur des blocs)
- Données rafraîchies **quotidiennement** de manière automatique
- Anonymisation des données bénévoles : **agrégation sans données individuelles**, zones géographiques des projets de plantation uniquement
- Exports disponibles : CSV, Excel (.xlsx), PDF
- Metabase : self-hosted, accès coordination + CA uniquement, outil distinct de la plateforme
- Même règles d'anonymisation dans Metabase
- Calendrier : lecture seule pour les utilisateurs invités, écriture pour les admins et utilisateurs ayant des droits de création sur les événements

## Thématiques du tableau de bord

| Thématique | Contenu principal |
|------------|------------------|
| Distributions & impact | KPIs, graphiques par typologie, indicateurs CO2 |
| Cartographie | Carte distributions par commune/département, carte des projets de plantation |
| Calendrier | Événements de distribution, ateliers, événements partenaires |
| Export | Données brutes filtrées |

## Récits utilisateurs

### Accès & administration

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DB-01 | Accéder au tableau de bord | Must |
| US-DB-02 | Inviter un utilisateur au tableau de bord | Should |

### Distributions & impact environnemental

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DB-03 | Consulter les indicateurs clés de distribution | Must |
| US-DB-04 | Consulter les indicateurs d'impact CO2 | Must |
| US-DB-05 | Consulter les graphiques de distribution par typologie | Must |

### Cartographie

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DB-06 | Consulter la carte de distribution géographique | Must |
| US-DB-07 | Consulter la carte des projets de plantation | Should |

### Calendrier

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DB-08 | Consulter le calendrier des activités | Should |

### Export

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DB-09 | Exporter des données brutes | Must |

### Metabase

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-DB-10 | Accéder à Metabase pour l'exploration avancée | Should |

## Détail des récits

### US-DB-01 — Accéder au tableau de bord
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** accéder au tableau de bord **afin de** consulter les données d'activité et d'impact de l'association.

**Critères d'acceptation :**
- Accessible depuis le menu principal de la plateforme
- Admins : accès à l'ensemble des thématiques et données
- Utilisateurs invités : accès restreint *(périmètre à définir en atelier)*
- Données rafraîchies quotidiennement en automatique
- Date du dernier rafraîchissement affichée

---

### US-DB-02 — Inviter un utilisateur au tableau de bord
**En tant qu'** Administrateur, **je veux** inviter un utilisateur à accéder au tableau de bord **afin de** partager les données de suivi.

**Critères d'acceptation :**
- Invitation par recherche d'utilisateur existant ou par email
- Utilisateur invité accède en vue restreinte
- Révocation possible à tout moment
- Liste des utilisateurs invités consultable depuis les paramètres du tableau de bord

---

### US-DB-03 — Consulter les indicateurs clés de distribution
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** consulter les indicateurs synthétiques **afin d'** avoir une vision immédiate de l'activité de l'association.

**Critères d'acceptation :**
- Indicateurs affichés (filtrables par période et département) :
  - Nombre total de plants distribués
  - Nombre de plants distribués par catégorie de taxon (arbres, arbustes, fruitiers, grimpantes, inconnu)
  - Nombre de communes ayant bénéficié de distributions
  - Nombre de racines nues distribuées
  - Nombre de projets de plantation actifs
  - Nombre de bénévoles actifs *(agrégé, sans données individuelles)*
- Comparaison avec la période précédente *(à confirmer en atelier)*

---

### US-DB-04 — Consulter les indicateurs d'impact environnemental (CO2)
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** visualiser l'impact carbone estimé **afin de** mesurer la contribution environnementale de l'association.

**Critères d'acceptation :**
- Indicateurs par catégorie de taxon et en total :
  - Tonnes de CO2 évitées par an (tCO2eq/unité/an × quantité distribuée)
  - Tonnes de CO2 évitées sur la durée de vie des arbres
- Coefficients configurables par catégorie de taxon *(à définir en atelier — base : modèle Citizing)*
- Hypothèses de calcul affichées de manière transparente (ex: "100% des plants survivent")
- Données agrégables par année, par distribution, par département

---

### US-DB-05 — Consulter les graphiques de distribution par typologie
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** visualiser la répartition des plants sous forme de graphiques **afin d'** analyser la composition des stocks distribués.

**Critères d'acceptation :**
- Graphiques disponibles :
  - Histogramme : nombre de plants distribués par catégorie de taxon
  - Camembert : répartition en % par catégorie de taxon
  - Camembert : CO2 évité par an par catégorie
  - Camembert : CO2 évité sur durée de vie par catégorie
- Filtres : année, période, département
- Graphiques interactifs (survol → valeur détaillée)

---

### US-DB-06 — Consulter la carte de distribution géographique
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** visualiser la répartition géographique des plants distribués sur une carte **afin d'** identifier les zones d'impact.

**Critères d'acceptation :**
- Carte choroplèthe par commune et/ou département (nombre de plants distribués par zone)
- Légende par tranche (ex : 0 / ]0–23] / ]23–51] / ]51–137] / ]137–1243])
- Filtres : département, année ou période
- Zoom interactif département → commune
- Données géographiques issues des adresses des projets de plantation associés aux distributions

---

### US-DB-07 — Consulter la carte des projets de plantation
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** visualiser la localisation des projets de plantation sur une carte **afin d'** avoir une vision géographique de l'implantation des plants.

**Critères d'acceptation :**
- Projets publics et privés représentés (privés visibles aux admins uniquement)
- Chaque point affiche : nom du projet, nombre de plants associés, surface
- Filtres : statut du projet (actif, archivé), catégorie de taxon
- Données issues des adresses saisies dans les fiches projet

---

### US-DB-08 — Consulter le calendrier des activités
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** consulter un calendrier des événements **afin d'** avoir une vision d'ensemble des activités planifiées.

**Critères d'acceptation :**
- Affiche : événements de distribution (publiés), ateliers et événements organisés par l'association et ses partenaires
- Vues disponibles : mensuelle, hebdomadaire
- Admins et utilisateurs avec droits de création : peuvent créer/modifier un événement depuis le calendrier
- Utilisateurs invités : lecture seule
- Clic sur un événement → fiche détail de l'événement

---

### US-DB-09 — Exporter des données brutes
**En tant qu'** Administrateur ou Utilisateur invité, **je veux** exporter des données brutes **afin de** les analyser dans un outil externe ou les partager.

**Critères d'acceptation :**
- Exports disponibles :
  - Liste des plants distribués (taxon, catégorie, quantité, date, commune)
  - Liste des projets de plantation (nom anonymisé si privé, commune, surface, taxons associés)
  - Liste des bénévoles actifs — **agrégée sans données individuelles**, zones géographiques uniquement
- Formats : CSV, Excel (.xlsx), PDF
- Exports filtrables avant génération (période, département, catégorie de taxon)
- Export mentionne la date de génération et les filtres appliqués

---

### US-DB-10 — Accéder à Metabase pour l'exploration avancée
**En tant que** Membre de la coordination ou du CA, **je veux** accéder à Metabase **afin d'** explorer librement les données de l'association sans passer par le tableau de bord applicatif.

**Critères d'acceptation :**
- Metabase : self-hosted, outil distinct de la plateforme principale
- Accès restreint à l'équipe de coordination et au CA (gestion des accès dans Metabase)
- Mêmes règles d'anonymisation que le tableau de bord : aucune donnée individuelle identifiable
- Données synchronisées avec la base applicative selon le cycle de rafraîchissement quotidien

---

## Points ouverts

- Périmètre exact de la vue restreinte des utilisateurs invités — atelier prestataire
- Comparaison avec période précédente (US-DB-03) — à confirmer
- Coefficients CO2 par catégorie de taxon — base : modèle Citizing, à définir
- Types d'ateliers et événements partenaires dans le calendrier — gérés depuis la plateforme ou saisie manuelle ?
- Coefficients CO2 : par catégorie uniquement ou par taxon précis ?

## Dépendances

- **EP-01** (Distributions) — données de distribution et de validation terrain
- **EP-04** (Projets) — localisation et données des projets de plantation
- **EP-05** (Taxons) — hiérarchie et catégories pour l'agrégation des indicateurs
- **EP-02** (Auth) — contrôle d'accès au tableau de bord
