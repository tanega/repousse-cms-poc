---
title: "Vue d'ensemble"
---

# Repousse — Roadmap & Épics

Cahier de spécifications fonctionnelles de la nouvelle plateforme numérique de l'association Repousse.

## Contexte

Repousse organise des distributions de végétaux (septembre–mars) auprès de membres adhérents. La plateforme vise à remplacer les outils fragmentés actuels (formulaires Google, emails, tableurs) par un système intégré de gestion des distributions, des projets de plantation et du suivi d'impact.

## Acteurs

| Acteur | Description |
|--------|-------------|
| **Visiteur** | Non authentifié — accès page publique uniquement |
| **Bénévole** | Profil par défaut. Suit les activités, participe aux ateliers |
| **Adoptant** | Réserve des plants, gère des projets de plantation |
| **Famille d'accueil** | Conserve et multiplie des jeunes plants avant distribution |
| **Administrateur** | Coordination, bureau, CA, équipe salariée — accès admin plateforme |
| **Superadmin** | Gestion des rôles admin et de la configuration plateforme |

## Épics

| Réf | Épic | Fichier |
|-----|------|---------|
| EP-01 | Gestion des distributions | [epic-01-distributions.md](epic-01-distributions.md) |
| EP-02 | Authentification & gestion des accès | [epic-02-authentification.md](epic-02-authentification.md) |
| EP-03 | Profils utilisateurs | [epic-03-profils-utilisateurs.md](epic-03-profils-utilisateurs.md) |
| EP-04 | Projets de plantation | [epic-04-projets-plantation.md](epic-04-projets-plantation.md) |
| EP-05 | Gestion des taxons végétaux | [epic-05-gestion-taxons.md](epic-05-gestion-taxons.md) |
| EP-06 | Tableau de bord & reporting | [epic-06-tableau-de-bord.md](epic-06-tableau-de-bord.md) |

## Périmètre hors-scope (v1)

- Gestion des synonymes taxonomiques et fusion de doublons
- Portabilité des données (export personnel RGPD)
- Authentification sociale (OAuth Google, etc.)
- Application mobile native (PWA uniquement)
- Profil Administrateur auto-sélectionnable par l'utilisateur
- Intégration API structurée avec bases de connaissance externes (liens simples uniquement)

## Dépendances inter-épics

```
EP-02 (Auth) ──────────────────────────────► EP-03 (Profils)
                                                    │
                              ┌─────────────────────┤
                              ▼                     ▼
                        EP-04 (Projets)       EP-01 (Distributions)
                              │                     │
                              └──────────┬──────────┘
                                         ▼
                                   EP-05 (Taxons)
                                         │
                                         ▼
                                   EP-06 (Dashboard)
```

## Points ouverts transversaux

- Choix solution IAM : **Hanko** (passwordless natif) vs **Authentik** (si mot de passe souhaité)
- Quota de stockage médias : global plateforme ou par utilisateur ?
- Fréquence du batch de synchronisation HelloAsso (quotidien recommandé)
- Coefficients CO2 par catégorie de taxon (modèle Citizing comme base)
- Liste complète des champs profil à finaliser en atelier (base : formulaire Google Adoptant)
- MFA obligatoire pour rôles admin/superadmin — décision à prendre
