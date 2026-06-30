# EP-02 — Authentification & gestion des accès

## Objectif

Mettre en place un portail d'authentification sécurisé, sans mot de passe, synchronisé avec la campagne d'adhésion HelloAsso, avec une gestion des accès basée sur des rôles et des profils.

## Acteurs concernés

- **Visiteur** — accès page publique, guidage vers HelloAsso
- **Nouveau membre** — activation de compte post-adhésion HelloAsso
- **Utilisateur** — authentification, gestion de session, MFA
- **Admin / Superadmin** — création manuelle, gestion des rôles

## Règles métier clés

- Pas d'inscription libre (no signup) — accès uniquement via HelloAsso ou création manuelle admin
- Authentification **passwordless** : passkey, passcode, ou lien magique (token valable 2 min)
- Adhésion annuelle — compte suspendu si adhésion expirée (lecture seule)
- Rôles utilisateur : `superadmin`, `admin`, `éditeur`, `lecteur` — granulaires par ressource
- Profils utilisateur : `Administrateur`, `Adoptant`, `Famille d'accueil`, `Bénévole` (défaut proposé)
- Le profil Administrateur n'est pas auto-sélectionnable
- Solution IAM envisagée : **Hanko** (alternatif : Authentik)

## Récits utilisateurs

### Accès public

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-AUTH-01 | Consulter la page publique | Must |
| US-AUTH-02 | Être guidé vers la procédure d'adhésion | Must |

### Synchronisation HelloAsso

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-AUTH-03 | Synchroniser les nouveaux membres depuis HelloAsso | Must |
| US-AUTH-04 | Suspendre les membres dont l'adhésion a expiré | Must |

### Activation & authentification

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-AUTH-05 | Activer son compte (première connexion) | Must |
| US-AUTH-06 | Recevoir des rappels d'activation | Should |
| US-AUTH-07 | Se connecter à la plateforme (passwordless) | Must |
| US-AUTH-08 | Activer et utiliser le MFA | Should |

### Profils & administration

| Réf | Titre | Priorité |
|-----|-------|----------|
| US-AUTH-09 | Sélectionner son ou ses profils | Must |
| US-AUTH-10 | Créer manuellement un utilisateur (Admin) | Must |
| US-AUTH-11 | Gérer les rôles superadmin et admin (Superadmin) | Must |

## Détail des récits

### US-AUTH-01 — Consulter la page publique
**En tant que** Visiteur, **je veux** accéder à une page publique **afin de** découvrir l'association sans m'authentifier.

**Critères d'acceptation :**
- Affiche : présentation de la plateforme, prochains événements de distribution publiés
- Aucune action (réservation, inscription) sans authentification
- Appel à l'action vers la procédure d'adhésion

---

### US-AUTH-02 — Être guidé vers la procédure d'adhésion
**En tant que** Visiteur, **je veux** être guidé vers la procédure de création de compte **afin de** comprendre les étapes d'accès à la plateforme.

**Critères d'acceptation :**
- Page statique publique expliquant les deux étapes : (1) adhérer via HelloAsso, (2) activer son compte
- Lien vers la campagne HelloAsso accessible directement
- Mention explicite : aucune inscription directe sur la plateforme

---

### US-AUTH-03 — Synchroniser les nouveaux membres depuis HelloAsso
**En tant que** Système, **je veux** importer automatiquement les nouveaux membres depuis HelloAsso **afin de** créer leurs comptes sans intervention manuelle.

**Critères d'acceptation :**
- Batch planifié *(fréquence recommandée : quotidienne)*
- Données synchronisées : nom, email (identifiant), année d'adhésion
- Si compte existant avec même email : mise à jour de l'année d'adhésion, pas de doublon
- Email d'activation envoyé automatiquement après création
- Import tracé (date, comptes créés/mis à jour, erreurs)

---

### US-AUTH-04 — Suspendre les membres dont l'adhésion a expiré
**En tant que** Système, **je veux** détecter les membres sans adhésion active **afin de** suspendre leurs droits d'édition.

**Critères d'acceptation :**
- À chaque batch : comptes dont l'année d'adhésion ≠ année en cours → statut **Suspendu**
- Compte suspendu : connexion possible, lecture seule, création de projet et inscription aux distributions bloquées
- Compte et données conservés intégralement
- Ré-adhésion HelloAsso → droits restaurés au batch suivant
- Email de notification envoyé au membre suspendu avec lien HelloAsso

---

### US-AUTH-05 — Activer son compte (première connexion)
**En tant que** Nouveau membre, **je veux** activer mon compte via l'email reçu **afin d'** accéder à la plateforme sans mot de passe.

**Critères d'acceptation :**
- Email d'activation contient un lien magique (token usage unique, valable **2 minutes**)
- Au clic : authentifié et invité à configurer une méthode forte (passkey ou passcode)
- Si lien expiré : demande d'un nouveau lien depuis la page de connexion
- Après activation : redirection vers sélection du/des profil(s)

---

### US-AUTH-06 — Recevoir des rappels d'activation
**En tant que** Nouveau membre non encore activé, **je veux** recevoir des rappels **afin de** ne pas manquer l'accès à la plateforme.

**Critères d'acceptation :**
- Relance hebdomadaire si compte non activé dans les 7 jours
- Arrêt des relances après **4 semaines** ou dès activation
- Chaque email contient un nouveau lien d'activation valide
- Nombre de relances envoyées tracé dans le système

---

### US-AUTH-07 — Se connecter à la plateforme (passwordless)
**En tant qu'** Utilisateur, **je veux** me connecter sans mot de passe **afin d'** accéder à mon espace de manière sécurisée.

**Critères d'acceptation :**
- Méthodes disponibles : passkey, passcode, lien magique par email (valable 2 min, usage unique)
- En cas d'échec ou d'expiration : nouveau lien demandable depuis la page de connexion
- Durée de session *(à définir)*

---

### US-AUTH-08 — Activer et utiliser le MFA
**En tant qu'** Utilisateur, **je veux** activer une vérification multi-facteurs **afin de** renforcer la sécurité de mon compte.

**Critères d'acceptation :**
- MFA disponible en option pour tous les utilisateurs
- MFA rendu obligatoire par le superadmin pour les rôles admin/superadmin *(décision à prendre)*
- Méthodes MFA disponibles selon la solution IAM retenue (Hanko ou Authentik)

---

### US-AUTH-09 — Sélectionner son ou ses profils
**En tant qu'** Utilisateur, **je veux** sélectionner mon ou mes profils lors de l'activation **afin que** la plateforme adapte mes accès.

**Critères d'acceptation :**
- Profils disponibles à l'auto-sélection : Bénévole (proposé par défaut), Adoptant, Famille d'accueil
- Le profil Administrateur n'est pas proposé à l'auto-sélection dans cette version
- Au moins un profil requis — compte sans profil impossible
- Chaque profil accompagné d'une description courte
- Profils modifiables ultérieurement depuis les paramètres du compte

---

### US-AUTH-10 — Créer manuellement un utilisateur (Admin)
**En tant qu'** Administrateur, **je veux** créer manuellement un compte utilisateur **afin d'** intégrer un membre hors flux HelloAsso.

**Critères d'acceptation :**
- Champs : nom, email, année d'adhésion, profil(s)
- Email d'activation envoyé automatiquement
- Création tracée (auteur, date)
- Un Admin ne peut pas créer un compte superadmin ni admin

---

### US-AUTH-11 — Gérer les rôles superadmin et admin (Superadmin)
**En tant que** Superadmin, **je veux** attribuer ou révoquer les rôles Admin et Superadmin **afin de** contrôler les accès d'administration.

**Critères d'acceptation :**
- Promotion d'un utilisateur existant en Admin ou Superadmin
- Révocation possible — l'utilisateur retrouve ses droits de profil standard
- Historique des attributions/révocations tracé
- Un superadmin ne peut pas se révoquer lui-même (au moins un superadmin actif requis)

---

## Points ouverts

- **IAM** : Hanko vs Authentik — décision à prendre avant développement
- **MFA obligatoire** pour admin/superadmin — décision à prendre
- **Durée de session** — à définir (différenciée mobile/desktop ?)
- **Fréquence du batch** HelloAsso — quotidien recommandé, à confirmer

## Dépendances

- **HelloAsso** — API ou webhook de la campagne d'adhésion
- **EP-03** (Profils) — sélection des profils post-activation
- Tous les autres épics — authentification prérequis transversal
