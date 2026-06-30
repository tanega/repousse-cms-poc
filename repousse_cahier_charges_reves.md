Contexte

L'association Repousse a 3 ans et 3 buts :

planter gratuitement le plus de jeunes arbres possible grâce à la
mobilisation citoyenne

sensibiliser pour pérenniser les arbres anciens (ciné débat, quizz,
ateliers boutures...)

organiser des plantations participatives

On fonctionne comme une S.P.A des arbres :

on récupère les arbres de moins d'1m20 trop souvent considérés comme des
déchets verts

on les confie à des familles d'accueil

on les distribue gratuitement (10 000 arbres et arbustes déjà
distribués)

L'association a rapidement grossi avec 250 adhérents, dont 150 membres
bénévoles.

L'ensemble des actions de notre association est résumé dans son
[[rapport
d'activités]{.underline}](https://www.repousse.org/_files/ugd/01344d_fb46f3b0592a41a0870dd401bdedb549.pdf).

Périmètre de l[']{dir="rtl"}application

L[']{dir="rtl"}association Repousse souhaite se doter d[']{dir="rtl"}une
plateforme numérique lui permettant d[']{dir="rtl"}améliorer la gestion
de l[']{dir="rtl"}engagement de ses membres actifs bénévoles, de son
équipe salariée et de ses partenaires ainsi que le suivi et le
rapportage de ses activités courantes.

À l[']{dir="rtl"}heure actuelle, l[']{dir="rtl"}association Repousse
propose à ses adhérents la collecte et la distribution de jeunes plants
d[']{dir="rtl"}arbres et d[']{dir="rtl"}arbustes bocagers et/ou
fruitiers, la mise en garde (multiplication et élevage) des jeunes
plants avant leur plantation sous forme de pépinières participative,
l[']{dir="rtl"}accompagnement et le suivi de projet de plantations au
sein de sites partenaires. L[']{dir="rtl"}association met également en
place des ateliers de sensibilisation auprès de publics diversifiés.

Cette nouvelle plateforme numérique accessible par le web et idéalement
en mobilité pour certaines fonctionnalités (gestion des distributions
par exemple) devra permettre de:

Regrouper les bénévoles adhérents et l'équipe salariée au sein
d[']{dir="rtl"}un espace numérique commun,

Faciliter l'embarquement des nouveaux bénévoles en leur permettant de
renseigner des détails sur leurs projets d'élevage ou de plantation

Proposer aux nouveaux bénévoles l[']{dir="rtl"}adhésion aux différentes
chartes d[']{dir="rtl"}engagement de l[']{dir="rtl"}association

Planifier des événements de distribution de plants auprès des adhérents
et de faciliter leur gestion effective desdites distributions sur le
terrain (comptabilisation et affectation des plants distribués,
historique et suivi des projets de plantation)

Créer des projets de plantation et faciliter le suivi de son évolution
(contribution de l[']{dir="rtl"}association Repousse à la régénération
forestières, analyse des données météo historique, connaissance de la
composition des sols et de la ressource en eau, évolution paysagère et
impact sur la biodiversité...)

Accéder à un tableau de bord de l'impact de l'association en intégrant
des indicateurs pouvant contribuer aux bilans d[']{dir="rtl"}activités
annuelles

Offrir des ressources pédagogiques sur les arbres et arbustes
(encyclopédie, guides et tutoriels...) aux adhérents de
l[']{dir="rtl"}association

Identifier les canaux de discussions pour les adhérents (notamment à
travers le choix de parcours bénévoles « adoptants », « familles
d[']{dir="rtl"}accueil ») voire éventuellement internaliser ces canaux
de discussions (chat, liste de diffusion, lettres d[']{dir="rtl"}infos)
au sein de ce nouvel espace numérique commun

Suivre les partenariats pour l'équipe (mini CRM interne)

Enfin cette plateforme numérique pourra servir d[']{dir="rtl"}outil
fondateur pour de futurs projets d'essaimage de
l[']{dir="rtl"}association Repousse. Ainsi elle sera développée en code
ouvert (*open source*) avec une grande exigence de maintenabilité du
code (documentation et couverture de tests exhaustive). Une licence
permettant sa distribution non commerciale sera également associée au
code de ce projet. Afin d[']{dir="rtl"}encourager
l[']{dir="rtl"}adoption de cet outil une attention particulière sera à
la simplicité d[']{dir="rtl"}installation de nouvelles instances de
tests ou de production (conteneurisation, documentation
d[']{dir="rtl"}installation, guides d[']{dir="rtl"}utilisation).

Description de l'état initial

*Ref. Doc + mail de Marion*

*Plus notes sur HelloAsso pour la gestion des campagnes
d[']{dir="rtl"}adhésion (statut adhérents à importer)*

Utilisateurs de la plateforme: authentification et rôles

Description sommaire

La majorité des ressources de la nouvelle plateforme numérique de
l[']{dir="rtl"}association Ressource seront accessibles derrière un
portail d[']{dir="rtl"}authentification.

Suite à leur adhésion sur la campagne HelloAsso de Repousse, les
nouveaux membres de l[']{dir="rtl"}association seront invité-e-s à
activer leur compte sur la nouvelle plateforme. Une synchronisation
entre la campagne d[']{dir="rtl"}adhésion et les systèmes de gestion
d[']{dir="rtl"}identité et d[']{dir="rtl"}authentification de la
plateforme est à prévoir.

En dehors de cette synchronisation (automatisée), seuls les
administrateurs de la plateforme pourront créer de nouveau utilisateur
(soit directement au sein de la plateforme soit directement au sein de
la solution de gestion des identités et des accès (IAM - Identity Access
Management) si une telle solution est retenue.

Il ne sera pas possible pour un visiteur de la plateforme de créer un
compte librement (no signup).

Depuis la plateforme, les visiteurs seront néanmoins guidés pour la
procédure de création (adhésion sur HelloAsso puis activation du
compte).

À l[']{dir="rtl"}instar d[']{dir="rtl"}un système de gestion de contenu
(Content Management System), une gestion des accès basée sur les rôles
sera mise en place pour l[']{dir="rtl"}ensemble des ressources. Nous
préciserons dans ce document le type d[']{dir="rtl"}autorisation en
fonction des profils pour créer, lire, mettre à jour, supprimer chacune
des ressources disponibles dans l[']{dir="rtl"}application. Ces règles
seront précisées dans les *récits utilisateurs* de chaque section du
cahier de spécifications.

Au sein de cette application, nous distinguerons les rôles utilisateur
(superadmin, admin, éditeur, lecteur) des profils utilisateurs
(Administrateur, Adoptant, Famille d[']{dir="rtl"}accueil, Bénévole).
Les rôles utilisateurs sont affectés de manière granulaire aux
différentes ressources de l[']{dir="rtl"}application. Les profils
utilisateurs sont plus génériques et applicables à travers
l[']{dir="rtl"}ensemble de l[']{dir="rtl"}application (voir Profil
Utilisateurs) et pourront conditionner les rôles utilisateurs pour
chaque ressources.

Récits Utilisateurs

Accès public

US-AUTH-01 --- Consulter la page publique

En tant que Visiteur, je veux accéder à une page d\'accueil publique
afin de découvrir l\'association et les prochains événements sans avoir
à m\'authentifier.

Critères d\'acceptation :

\- La page affiche : présentation de la plateforme et liste des
prochains événements de distribution publiés

\- Aucune action (réservation, inscription) n\'est disponible sans
authentification

\- Un appel à l\'action clair oriente vers la procédure d\'adhésion

US-AUTH-02 --- Être guidé vers l\'adhésion

En tant que Visiteur, je veux être guidé vers la procédure de création
de compte afin de comprendre les étapes pour accéder à la plateforme.

Critères d\'acceptation :

\- Une page statique publique explique le processus en deux étapes : (1)
adhérer via HelloAsso, (2) activer son compte via l\'email reçu

\- Le lien vers la campagne HelloAsso est accessible directement depuis
cette page

\- La page précise qu\'aucune inscription directe n\'est possible sur la
plateforme

Synchronisation HelloAsso

US-AUTH-03 --- Synchroniser les nouveaux membres depuis HelloAsso

En tant que Système, je veux importer automatiquement les nouveaux
membres adhérents depuis HelloAsso afin de créer leurs comptes sur la
plateforme sans intervention manuelle.

Critères d\'acceptation :

\- Un batch planifié interroge régulièrement la campagne d\'adhésion
HelloAsso (fréquence à définir : quotidienne recommandée)

\- Pour chaque nouveau membre détecté : un compte est créé avec nom,
email et année d\'adhésion

\- Si un compte avec le même email existe déjà : mise à jour de l\'année
d\'adhésion sans création de doublon

\- Un email d\'activation est automatiquement envoyé au nouveau membre
suite à la création du compte

\- Les imports sont tracés (date, nombre de comptes créés/mis à jour,
erreurs éventuelles)

US-AUTH-04 --- Suspendre les membres dont l\'adhésion a expiré

En tant que Système, je veux détecter les membres dont l\'adhésion
annuelle n\'est plus active afin de suspendre leurs droits d\'édition
sur la plateforme.

Critères d\'acceptation :

\- À chaque batch, les comptes dont l\'année d\'adhésion n\'est pas
l\'année en cours sont marqués Suspendus

\- Un compte suspendu : peut se connecter, peut consulter les ressources
en lecture, ne peut plus créer de projet de plantation ni s\'inscrire à
un événement de distribution

\- Le compte et ses données sont conservés intégralement

\- Si le membre ré-adhère sur HelloAsso, le batch suivant restaure
automatiquement ses droits

\- Le membre suspendu reçoit un email l\'informant de la suspension et
du lien vers HelloAsso pour renouveler son adhésion

Activation de compte

US-AUTH-05 --- Activer son compte (première connexion)

En tant que Nouveau membre, je veux activer mon compte via l\'email reçu
afin d\'accéder à la plateforme sans avoir à créer de mot de passe.

Critères d\'acceptation :

\- L\'email d\'activation contient un lien magique (token à usage
unique, valable 2 minutes)

\- Au clic sur le lien, l\'utilisateur est authentifié et invité à
configurer une méthode d\'authentification forte (passkey ou passcode)

\- Si le lien est expiré, l\'utilisateur peut demander un nouveau lien
depuis la page de connexion

\- À l\'issue de l\'activation, l\'utilisateur est redirigé vers la
sélection de son/ses profil(s)

US-AUTH-06 --- Recevoir des rappels d\'activation

En tant que Nouveau membre n\'ayant pas encore activé son compte, je
veux recevoir des rappels afin de ne pas manquer l\'accès à la
plateforme.

Critères d\'acceptation :

\- Si le compte n\'est pas activé dans les 7 jours suivant la création,
un email de relance est envoyé chaque semaine

\- Les relances s\'arrêtent après 4 semaines ou dès l\'activation du
compte

\- Chaque email de relance contient un nouveau lien d\'activation valide
et un rappel de la procédure

\- Le nombre de relances envoyées est tracé dans le système

Authentification

US-AUTH-07 --- Se connecter à la plateforme (passwordless)

En tant qu\'Utilisateur, je veux me connecter à la plateforme sans mot
de passe afin d\'accéder à mon espace de manière sécurisée.

Critères d\'acceptation :

\- Méthodes disponibles : passkey, passcode, ou lien magique envoyé par
email

\- Le lien magique est valable 2 minutes et à usage unique

\- En cas d\'échec ou d\'expiration, l\'utilisateur peut demander un
nouveau lien depuis la page de connexion

\- La session est maintenue selon une durée définie (à préciser)

US-AUTH-08 --- Activer et utiliser le MFA

En tant qu\'Utilisateur, je veux activer une vérification multi-facteurs
afin de renforcer la sécurité de mon compte.

Critères d\'acceptation :

\- Le MFA est disponible en option pour tous les utilisateurs

\- Le MFA peut être rendu obligatoire par le superadmin pour certains
rôles (admin, superadmin recommandé)

\- Les méthodes MFA supportées dépendent de la solution IAM retenue
(Hanko ou Authentik)

Gestion des profils utilisateur

US-AUTH-09 --- Sélectionner son ou ses profils

En tant qu\'Utilisateur, je veux sélectionner mon ou mes profils lors de
l\'activation de mon compte afin que la plateforme adapte mes accès et
fonctionnalités disponibles.

Critères d\'acceptation :

\- Profils disponibles à la sélection : Adoptant, Famille d\'accueil,
Bénévole

\- Un utilisateur peut cumuler plusieurs profils

\- Le profil Administrateur ne peut pas être auto-sélectionné --- il est
attribué uniquement par un superadmin

\- Les profils peuvent être modifiés ultérieurement depuis les
paramètres du compte

\- Chaque profil est décrit brièvement pour guider le choix de
l\'utilisateur

Administration des comptes

US-AUTH-10 --- Créer manuellement un utilisateur (Admin)

En tant qu\'Administrateur, je veux créer manuellement un compte
utilisateur afin d\'intégrer un membre qui ne passerait pas par le flux
HelloAsso.

Critères d\'acceptation :

\- Je saisis : nom, email, année d\'adhésion, profil(s)

\- Un email d\'activation est envoyé automatiquement à la création

\- La création manuelle est tracée (auteur, date)

\- Je ne peux pas créer un compte superadmin ni admin (réservé au
superadmin)

US-AUTH-11 --- Gérer les rôles superadmin et admin (Superadmin)

En tant que Superadmin, je veux attribuer ou révoquer les rôles Admin et
Superadmin afin de contrôler les accès d\'administration de la
plateforme.

Critères d\'acceptation :

\- Je peux promouvoir un utilisateur existant en Admin ou Superadmin

\- Je peux révoquer ces rôles --- l\'utilisateur retrouve ses droits de
profil standard

\- L\'historique des attributions/révocations de rôles est tracé

\- Un superadmin ne peut pas se révoquer lui-même (au moins un
superadmin actif requis)

Profil Utilisateurs

Questions résiduelles

\- US-AUTH-03 : fréquence du batch à confirmer (quotidien recommandé)

\- US-AUTH-07 : durée de session à définir (et différenciée selon le
contexte mobile/desktop ?)

\- US-AUTH-08 : MFA obligatoire pour admin/superadmin --- décision à
prendre

\- Hanko vs Authentik : le choix conditionne les méthodes MFA
disponibles et l\'interface d\'admin IAM --- à trancher avant la phase
de développement

Description des fonctionnalités

La création d[']{dir="rtl"}un compte utilisateur et son enrichissement
doit être simplifié au maximum. Une attention particulière sera accordée
à l[']{dir="rtl"}ergonomie de l[']{dir="rtl"}expérience ainsi
qu[']{dir="rtl"}aux retours utilisateur.

Suite à l[']{dir="rtl"}activation de son compte, chaque utilisateur
pourra renseigner des détails sur son profil (état civil, contact
adresse, souhait d[']{dir="rtl"}engagement). Le RGPD sera évidemment
appliqué sur l[']{dir="rtl"}ensemble de l[']{dir="rtl"}application et un
contact sera mis à disposition de l[']{dir="rtl"}ensemble de
l[']{dir="rtl"}application afin de pouvoir répondre et gérer les
problématiques liées à la protection des données personnelles des
utilisateurs de la plateforme.

La saisie des informations personnelles sera facultative.
L[']{dir="rtl"}ensemble des champs à renseigner sera défini en atelier
avec le prestataire. Le [[formulaire Google existant pour les
adoptants]{.underline}](https://docs.google.com/forms/d/1lTpkpHK-qIfVl6lPB35nv_CHmvVP7UuWrA3KeV5JBgw/edit?usp=drive_web&ouid=100509129998561309755)
servira de base à la définition de ces champs.

En plus de ses informations personnelles, l[']{dir="rtl"}utilisateur
pourra choisir un ou plusieurs profils (ou parcours utilisateurs). Le
choix de ces profils sera le reflet du souhait d[']{dir="rtl"}engagement
des adhérents bénévoles et des aspirations qu[']{dir="rtl"}iels
souhaitent concrétiser au sein de l[']{dir="rtl"}association.

Dans le cadre de cette première version de l\'application, nous avons
retenu les profils suivants:

Administrateur, profil réservé aux adhérents souhaitant
s[']{dir="rtl"}engager sur la modération et la coordination de
l[']{dir="rtl"}association, les membres du bureau et du conseil
d[']{dir="rtl"}administration ainsi l'équipe salariée de
l[']{dir="rtl"}association

Bénévole est un adhérent de l[']{dir="rtl"}association qui souhaitent
suivre les activités de l[']{dir="rtl"}association, participer à des
ateliers ou des chantiers de plantation dont il ne sera pas à
l[']{dir="rtl"}initiative (profil par défaut)

Adoptant est un adhérent qui souhaitent récupérer des plants et
s[']{dir="rtl"}engage à les planter dans un lieu donné (projet de
plantation)

Famille d'accueil est adhérent qui s[']{dir="rtl"}engage à multiplier et
élever des jeunes en amont des distributions et des chantiers de
plantations.

À titre d\'exemple, voici les actions envisagées pour chaque profil
utilisateurs. La description des fonctionnalités listées ci-après sera
détaillée plus loin dans le document dans des sections dédiées.

Les Administrateur peuvent :

avoir accès aux réponses aux questionnaires

à la mise à jour en direct des chiffres du calcul d[']{dir="rtl"}impact

créer des événements de distributions

accéder à un mini CRM interne (dont on a grand besoin avec tous les
contacts (à moins que ce soit mieux à part ?)

modérer le contenu de l[']{dir="rtl"}application

mettre à jour le fichier sur les haies plantées ?

> [[Repousse - Chantiers de plantations participatives de haies
> bocagères.xlsx]{.underline}](https://docs.google.com/spreadsheets/d/18UXgTNNclNcb4FiXeL_9KAFZA5TglcOR/edit?gid=1918771873%23gid=1918771873)

Les Adoptants (profil prioritaire - à livrer idéalement avant Octobre)
peuvent:

apprendre....

> sur les essences adaptées à leur terrain : lien vers floriscope
>
> comment faire une boulette pour connaître son sol
>
> acceder à des liens vers des contenus vidéos qui peuvent
> l[']{dir="rtl"}aider

créer et décrire son ou ses projets de plantation

déposer sa demande de repousses (ce serait chouette si c'était aussi
simple qu[']{dir="rtl"}un formulaire)

être alerté par email des distributions

donner des nouvelles des arbres plantés (journal de suivi des projets de
plantation)

répondre au questionnaire de calcul d\'impact adoptants

Les Familles d'accueil peuvent:

faire une liste des arbres chouchoutés

accès aux fiches sur les invasives à ne pas récupérer

apprendre à reconnaître les essences

demander des seaux, de la terre

Les Bénévoles peuvent:

dire qui a adopté quoi lors des distributions via une interface simple :

apprendre sur les arbres en général

partager des infos sur les arbres ?

avoir des nouvelles de l[']{dir="rtl"}asso

partager des photos des événements...

a dans l[']{dir="rtl"}idéal un historique de ses participations (pour
calcul automatique des heures de bénévolat)

répondre au questionnaire de calcul d\'impact bénévoles

Dans le cadre du développement, il sera nécessaire de prévoir des outils
de migration de données afin de centraliser les informations existantes
en particulier pour les personnes qui ont déjà rempli l[[e formulaire
Google
adoptant]{.underline}](https://docs.google.com/forms/d/1lTpkpHK-qIfVl6lPB35nv_CHmvVP7UuWrA3KeV5JBgw/edit?usp=drive_web&ouid=100509129998561309755).
La liste de l[']{dir="rtl"}ensemble des adoptants est [[disponible
ici]{.underline}](https://docs.google.com/spreadsheets/d/1bu9_10A9R9uxblLDQXMo_dUAuTGyD103nhuSpn1Fm50/edit?gid=2080669384%23gid=2080669384).

Récits Utilisateurs

Complétion du profil

US-PROFIL-01 --- Renseigner ses informations personnelles

En tant qu\'Utilisateur, je veux compléter mon profil après
l\'activation de mon compte afin de personnaliser mon espace et
faciliter les échanges avec l\'association.

Critères d\'acceptation :

\- Accessible depuis les paramètres du compte après activation

\- Champs disponibles (tous facultatifs) : nom, prénom, adresse postale,
souhait d\'engagement (champ libre), préférences de notifications (liste
complète des champs à définir en atelier avec le prestataire sur base du
formulaire Adoptant existant)

\- Un indicateur de complétion du profil encourage l\'utilisateur sans
bloquer l\'accès aux fonctionnalités

\- Les données sont modifiables à tout moment

\- Une mention RGPD claire est affichée, avec le contact
rgpd@repousse.org

US-PROFIL-02 --- Ajouter une photo de profil

En tant qu\'Utilisateur, je veux télécharger une photo de profil afin de
personnaliser mon compte.

Critères d\'acceptation :

\- Formats acceptés : JPG, PNG (taille max à définir)

\- Un recadrage simple est proposé après l\'upload

\- La photo peut être supprimée et remplacée à tout moment

\- En l\'absence de photo, un avatar généré par défaut est affiché
(initiales ou icône neutre)

US-PROFIL-03 --- Gérer ses préférences de notifications

En tant qu\'Utilisateur, je veux configurer mes préférences de
communication afin de contrôler les emails que je reçois de la
plateforme.

Critères d\'acceptation :

\- Les notifications liées à la sécurité du compte (activation,
connexion) sont obligatoires et non désactivables

\- Les autres catégories de notification sont activables/désactivables
individuellement (catégories à définir en atelier)

\- Les préférences sont modifiables depuis les paramètres du profil

Sélection des profils

US-PROFIL-04 --- Sélectionner son ou ses profils utilisateur

En tant qu\'Utilisateur, je veux choisir un ou plusieurs profils après
l\'activation de mon compte afin que la plateforme adapte mon expérience
à mon engagement au sein de l\'association.

Critères d\'acceptation :

\- Profils disponibles à la sélection : Bénévole (coché par défaut),
Adoptant, Famille d\'accueil

\- Le profil Administrateur n\'est pas proposé à l\'auto-sélection dans
cette version

\- Chaque profil est accompagné d\'une description courte expliquant
l\'engagement associé

\- Au moins un profil doit être sélectionné --- un compte sans profil
n\'est pas possible

\- Les profils peuvent être modifiés ultérieurement depuis les
paramètres du compte

US-PROFIL-05 --- Retirer un profil et transférer ses ressources

En tant qu\'Utilisateur, je veux retirer un profil de mon compte afin de
faire évoluer mon engagement, tout en préservant les ressources que
j\'ai créées.

Critères d\'acceptation :

\- Si des ressources sont liées au profil à retirer (ex: projets de
plantation pour Adoptant), l\'utilisateur est informé avant confirmation

\- L\'utilisateur peut transférer la propriété de chaque ressource à un
autre utilisateur disposant du profil adéquat

\- Les ressources non transférées passent en lecture seule et restent
visibles des administrateurs

\- Le retrait est bloqué si aucun autre profil n\'est actif (au moins un
profil requis)

Profil Famille d\'accueil

US-PROFIL-06 --- Renseigner les informations spécifiques Famille
d\'accueil

En tant qu\'Utilisateur avec le profil Famille d\'accueil, je veux
renseigner des informations sur mes capacités d\'accueil afin que les
coordinateurs puissent organiser la conservation des jeunes plants avant
distribution.

Critères d\'acceptation :

\- Champs spécifiques disponibles (facultatifs) : localisation / adresse
d\'accueil, capacité de stockage (nombre de plants ou surface), espèces
pouvant être accueillies (sélection depuis la liste des espèces
administrable), disponibilités générales (liste à affiner en atelier)

\- Ces champs ne sont visibles et accessibles que si le profil Famille
d\'accueil est actif

\- Les informations sont consultables par les coordinateurs depuis
l\'interface d\'administration

RGPD & suppression de compte

US-PROFIL-07 --- Accéder aux informations RGPD et contacter le référent

En tant qu\'Utilisateur, je veux accéder facilement aux informations sur
la gestion de mes données personnelles afin d\'exercer mes droits.

Critères d\'acceptation :

\- Un lien vers la politique de confidentialité et le contact RGPD
(rgpd@repousse.org) est accessible depuis toutes les pages de la
plateforme (pied de page ou paramètres du compte)

\- La page profil affiche un résumé des données personnelles conservées
sur l\'utilisateur

US-PROFIL-08 --- Supprimer son compte

En tant qu\'Utilisateur, je veux pouvoir supprimer mon compte afin
d\'exercer mon droit à l\'effacement de mes données personnelles.

Critères d\'acceptation :

\- La suppression est accessible depuis les paramètres du compte

\- Une confirmation explicite est demandée avec récapitulatif des
conséquences (données supprimées, ressources archivées)

\- Les données personnelles (nom, prénom, email, adresse) sont effacées

\- Les ressources créées (projets de plantation, réservations, etc.)
sont anonymisées et archivées pour préserver la cohérence historique

\- Un export brut des données personnelles est proposé à l\'utilisateur
avant la suppression définitive

\- Un email de confirmation est envoyé après la suppression

Administration des profils

US-PROFIL-09 --- Consulter le profil d\'un utilisateur (Admin)

En tant qu\'Administrateur, je veux consulter le profil complet d\'un
utilisateur afin d\'assurer la modération de la plateforme.

Critères d\'acceptation :

\- Accès en lecture à l\'ensemble des informations du profil : données
personnelles, profils actifs, préférences, ressources liées, statut du
compte (actif/suspendu)

\- Accès à l\'historique des modifications du profil (champ modifié,
ancienne valeur, date, auteur)

\- L\'accès admin aux données personnelles est tracé (recommandé pour
conformité RGPD)

US-PROFIL-10 --- Modifier le profil d\'un utilisateur pour modération
(Admin)

En tant qu\'Administrateur, je veux modifier le profil d\'un utilisateur
afin d\'intervenir en cas de problème signalé ou de demande de support.

Critères d\'acceptation :

\- Accès en modification à l\'ensemble des champs du profil utilisateur

\- Toute modification effectuée par un admin est tracée (champ modifié,
ancienne valeur, auteur admin, date)

\- L\'utilisateur concerné reçoit une notification email en cas de
modification de ses données par un admin (sauf si la notification
elle-même est désactivée pour raison de modération --- décision à
prendre)

Questions résiduelles

\- US-PROFIL-01 : liste définitive des champs à consolider en atelier
(formulaire Google Adoptant comme base)

\- US-PROFIL-03 : catégories de notifications à définir en atelier

\- US-PROFIL-06 : champs Famille d\'accueil à affiner en atelier

\- US-PROFIL-10 : notification à l\'utilisateur en cas de modification
admin --- décision à prendre l\'interface d\'admin IAM --- à trancher
avant la phase de développement

Gestion des projets de plantation

Description des fonctionnalités

Chaque utilisateur ayant sélectionné le profil ainsi que les
administrateurs de la plateforme peuvent créer des projets de plantation
au sein desquels ils pourront (ou non) implantés des arbres ou arbustes
récupérés lors des distributions organisées par
l[']{dir="rtl"}association.

Certains éléments de description de ces projets de plantation sont
actuellement via l[[e formulaire Google
adoptant]{.underline}](https://docs.google.com/forms/d/1lTpkpHK-qIfVl6lPB35nv_CHmvVP7UuWrA3KeV5JBgw/edit?usp=drive_web&ouid=100509129998561309755).
Dans le fonctionnement actuel, ces informations sont parfois demandées
de manière redondante et il semble parfois difficile de relier
d[']{dir="rtl"}autres données (comme les arbres distribués).
D[']{dir="rtl"}autre part, il semble difficile pour les membres de
conserver un historique clair des actions entreprises sur les projets de
plantation, individuels ou collectifs, dont iels sont à
l[']{dir="rtl"}initiative. De ce fait, celà réduit les possibilités pour
les membres d[']{dir="rtl"}engager une action
d[']{dir="rtl"}amélioration continue et de transmission de ces projets.

Pour pallier ces manques, il sera donc proposé à chaque utilisateur de
créer et d[']{dir="rtl"}administrer un version numérique de leurs
différents projets de plantation. Chaque utilisateur pourra décrire en
détails ces projets en remplissant un formulaire dédié à cette nouvelle
ressource. La liste exhaustive des critères descriptifs des projets de
plantation sera définie en atelier avec le prestataire mais nous pouvons
d[']{dir="rtl"}ores-et-déjà énumérer les critères essentiels:

le nom du projet de plantation

la description générale du projet (champ texte libre)

la nature de sa gestion (individuelle ou collective)

la localisation géographique du projet (adresse, commune *a minima*)

la surface approximative

la nature du sol

une liste préférentiel des espèces et variétés d[']{dir="rtl"}arbres,
arbustes, fruitiers, grimpantes qui sont envisagées pour ce projet de
plantation.

le statut de publication du projet (public ou privé)

date de création du projet

date de publication du projet sur la plateforme

Chaque utilisateur peut créer plusieurs projets de plantation.

Il sera également possible pour les utilisateurs d[']{dir="rtl"}ajouter
des médias associés aux projets de plantation.

L[']{dir="rtl"}utilisateur qui a créé le projet de plantation en devient
l[']{dir="rtl"}administrateur. Il peut ainsi en modifier le contenu
voire le supprimer. Il peut également inviter d[']{dir="rtl"}autres
utilisateurs de la plateforme à rejoindre et suivre ce projet de
plantation soit en tant que lecteur, soit en tant qu'éditeur. Les
utilisateurs ayant accepté l[']{dir="rtl"}invitation à rejoindre ou
suivre le projet pourront retrouver ce projet dans leur profil
utilisateur.

Enfin les utilisateur membres actifs de ce projet de plantation
(administrateur et éditeurs) pourront sélectionner ce projet de
plantation afin de l[']{dir="rtl"}associer à une distribution à laquelle
iels souhaitent se rendre (voir [[Gestion des
Distributions]{.underline}](#wtz3fnceudi63))

L[']{dir="rtl"}interface de la ressource Projet de plantation pourra se
présenter comme un mini tableau de bord, avec un journal
d[']{dir="rtl"}actions (simplement envisagé comme une suite de notes à
la manière d[']{dir="rtl"}un journal de bord dans cette première
version)

Afin d[']{dir="rtl"}assurer la modération, les administrateurs de la
plateforme auront accès à l[']{dir="rtl"}ensemble des projets de
plantations publics comme privés. Ces derniers auront des droits de
dépublication voire suppression sur cette ressource.

Récits Utilisateurs

Création et gestion d\'un projet de plantation

US-PROJET-01 --- Créer un projet de plantation

En tant qu\'Utilisateur avec le profil Adoptant (ou Administrateur), je
veux créer un projet de plantation afin de documenter et suivre mon
initiative de plantation.

Critères d\'acceptation :

\- Champs disponibles (tous facultatifs sauf le nom) :

\- Nom du projet (obligatoire)

\- Description générale (champ texte libre)

\- Nature de la gestion (individuelle / collective) --- sélection
simple, descriptif uniquement

\- Localisation : saisie d\'adresse avec géocodage et affichage sur
carte interactive ; l\'adresse est stockée en base de données

\- Surface approximative (en m²)

\- Nature du sol (champ libre)

\- Liste préférentielle d\'espèces (sélection multiple depuis la liste
administrable des espèces végétales)

\- Statut de publication (privé par défaut / public)

\- Les dates de création et de publication sont générées automatiquement
par le système

\- Le créateur devient automatiquement administrateur du projet

\- La liste complète des champs sera finalisée en atelier avec le
prestataire

US-PROJET-02 --- Modifier un projet de plantation

En tant qu\'Administrateur ou Éditeur d\'un projet, je veux modifier les
informations du projet afin de le maintenir à jour.

Critères d\'acceptation :

\- Tous les champs du formulaire sont modifiables

\- Les modifications sont enregistrées avec horodatage dans
l\'historique du projet

\- Un lecteur ne peut pas modifier le contenu du projet

US-PROJET-03 --- Supprimer un projet de plantation

En tant qu\'Administrateur d\'un projet, je veux supprimer mon projet
afin de retirer une initiative abandonnée ou créée par erreur.

Critères d\'acceptation :

\- Une confirmation explicite est demandée avant suppression, avec liste
des ressources associées (médias, membres, notes du journal)

\- La suppression est définitive pour les données descriptives et les
médias

\- Les données nécessaires au calcul des indicateurs d\'impact (espèces,
quantités distribuées associées) sont anonymisées et conservées

\- L\'action est tracée côté administration plateforme

Médias

US-PROJET-04 --- Ajouter des médias à un projet

En tant qu\'Administrateur ou Éditeur d\'un projet, je veux ajouter des
médias afin d\'illustrer et documenter l\'évolution du projet.

Critères d\'acceptation :

\- Types acceptés : photos (JPG, PNG), vidéos, documents PDF

\- Limite : 10 fichiers par projet, stockage total plateforme limité à 5
Go (gestion du quota à définir : par projet ou global)

\- Un aperçu est affiché après upload

\- Chaque média peut être accompagné d\'un titre ou légende (facultatif)

\- Le dépassement de limite déclenche un message d\'erreur explicite

US-PROJET-05 --- Supprimer un média

En tant qu\'Administrateur ou Éditeur d\'un projet, je veux supprimer un
média afin de maintenir la pertinence de la galerie.

Critères d\'acceptation :

\- Tout média peut être supprimé par un admin ou éditeur du projet

\- La suppression libère le quota de stockage correspondant

\- Une confirmation est demandée avant suppression définitive

Membres & invitations

US-PROJET-06 --- Inviter des membres à rejoindre un projet

En tant qu\'Administrateur d\'un projet, je veux inviter d\'autres
utilisateurs à rejoindre mon projet afin de collaborer ou de leur
permettre de suivre l\'avancement.

Critères d\'acceptation :

\- Deux modalités d\'invitation : par email ou par recherche d\'un
utilisateur existant sur la plateforme

\- Lors de l\'invitation, je choisis le rôle attribué : Lecteur ou
Éditeur

\- L\'invité reçoit une notification (email + in-app) avec un lien
d\'acceptation

\- Tant que l\'invitation n\'est pas acceptée, elle apparaît comme \"en
attente\" dans la liste des membres

\- Après acceptation, le projet apparaît dans le profil de
l\'utilisateur invité

US-PROJET-07 --- Gérer les membres d\'un projet

En tant qu\'Administrateur d\'un projet, je veux gérer les rôles et
l\'appartenance des membres afin de contrôler qui peut contribuer au
projet.

Critères d\'acceptation :

\- Je peux promouvoir un Lecteur en Éditeur, ou rétrograder un Éditeur
en Lecteur

\- Je peux promouvoir un Éditeur ou un Lecteur en Administrateur
(co-admin)

\- Je peux retirer un membre du projet --- ce dernier reçoit une
notification

\- Un projet doit conserver au moins un administrateur à tout moment

\- Je ne peux pas me retirer moi-même si je suis le seul administrateur

US-PROJET-08 --- Transfert automatique de propriété

En tant que Système, je veux transférer automatiquement
l\'administration d\'un projet lors de la suppression du compte du
créateur afin de préserver la continuité du projet.

Critères d\'acceptation :

\- Si le compte d\'un administrateur est supprimé et qu\'il existe
d\'autres administrateurs sur le projet : ses droits sont retirés, les
co-admins conservent la gestion

\- Si le compte supprimé était le seul administrateur du projet : le
projet est archivé (non modifiable, consultable par les admins
plateforme)

\- Les données du projet archivé sont conservées pour le calcul des
indicateurs d\'impact

\- Les membres restants du projet sont notifiés de l\'archivage

Journal d\'actions

US-PROJET-09 --- Publier une note dans le journal du projet

En tant qu\'Administrateur ou Éditeur d\'un projet, je veux ajouter une
note au journal du projet afin de consigner l\'historique des actions
entreprises.

Critères d\'acceptation :

\- Une note comprend : contenu texte libre, date (automatique), auteur
(automatique)

\- Les notes s\'affichent en ordre chronologique inversé (plus récente
en premier)

\- Les Lecteurs peuvent consulter le journal mais ne peuvent pas y
poster de note

US-PROJET-10 --- Modifier ou supprimer une note du journal

En tant qu\'auteur d\'une note, je veux pouvoir la modifier ou la
supprimer afin de corriger ou retirer une entrée erronée.

Critères d\'acceptation :

\- Seul l\'auteur de la note peut la modifier ou la supprimer

\- La modification affiche la date de dernière édition

\- Un administrateur de projet peut supprimer n\'importe quelle note
(modération interne)

Tableau de bord & consultation

US-PROJET-11 --- Consulter le tableau de bord d\'un projet

En tant que Membre d\'un projet (admin, éditeur, lecteur), je veux
accéder à un tableau de bord synthétique du projet afin d\'avoir une vue
d\'ensemble rapide.

Critères d\'acceptation :

\- Le tableau de bord affiche : informations générales, carte de
localisation, liste des espèces préférentielles, galerie médias, liste
des membres, journal d\'actions

\- Les plants associés via des distributions sont visibles (espèces,
quantités, date de distribution)

\- L\'interface est adaptée mobile (PWA)

Découverte & recherche

US-PROJET-12 --- Rechercher et parcourir les projets publics

En tant qu\'Utilisateur connecté, je veux rechercher et parcourir les
projets de plantation publics afin de découvrir les initiatives des
autres membres.

Critères d\'acceptation :

\- Les projets publics sont listés et filtrables (critères de filtrage à
définir en atelier : commune, espèces, nature individuelle/collective,
etc.)

\- Un projet privé n\'apparaît pas dans les résultats de recherche, même
pour un utilisateur connecté (sauf membres du projet et admins
plateforme)

\- Depuis la fiche d\'un projet public, un utilisateur peut demander à
rejoindre le projet (ou seulement via invitation directe --- à préciser)

Modération (Admin plateforme)

US-PROJET-13 --- Accéder à tous les projets (Admin plateforme)

En tant qu\'Administrateur plateforme, je veux accéder à l\'ensemble des
projets (publics et privés) afin d\'assurer la modération du contenu.

Critères d\'acceptation :

\- La liste des projets est consultable avec filtres (statut : public /
privé / dépublié, date de création, auteur)

\- L\'accès admin aux projets privés est tracé

US-PROJET-14 --- Dépublier un projet (Admin plateforme)

En tant qu\'Administrateur plateforme, je veux dépublier un projet afin
de retirer du contenu inapproprié sans supprimer définitivement le
travail de l\'utilisateur.

Critères d\'acceptation :

\- Le projet passe dans le statut Dépublié (distinct de privé)

\- Le propriétaire du projet reçoit une notification email avec motif de
dépublication (champ motif à saisir par l\'admin)

\- Un projet dépublié n\'est plus visible par les autres membres
connectés

\- L\'administrateur du projet peut contacter rgpd@repousse.org ou
l\'admin plateforme pour contester la décision

\- L\'admin plateforme peut republier le projet si la situation est
résolue

US-PROJET-15 --- Supprimer un projet (Admin plateforme)

En tant qu\'Administrateur plateforme, je veux supprimer définitivement
un projet afin de retirer du contenu en violation grave des règles de la
plateforme.

Critères d\'acceptation :

\- La suppression admin est définitive pour le contenu descriptif et les
médias

\- Les données d\'impact (espèces distribuées associées) sont conservées
sous forme anonymisée

\- Le propriétaire est notifié par email avec motif

\- L\'action est tracée dans les logs d\'administration (auteur, date,
motif)

Questions résiduelles

\- US-PROJET-04 : quota de 5 Go global plateforme ou par utilisateur ?
Qui est alerté en cas de dépassement proche ?

\- US-PROJET-12 : demande de rejoindre un projet depuis la fiche
publique --- via invitation directe uniquement ou bouton \"demande
d\'accès\" ?

\- US-PROJET-12 : critères de filtrage de la recherche à définir en
atelier

\- US-PROJET-14 : processus de contestation de dépublication à préciser

Gestion des distributions

Contexte et description des fonctionnalités

L'équipe de Repousse organise régulièrement des distributions de
végétaux, en général de septembre à mars. Les membres adhérents de
l[']{dir="rtl"}association sont invités par voie électronique à
s[']{dir="rtl"}inscrire à une permanence de distribution par le biais
d[']{dir="rtl"}un formulaire (voir example).

L'équipe de coordination de Repousse produit un formulaire pour chaque
événement de distribution. A chaque événement de distribution un stock
de jeunes plants est constitué, comprenant différentes espèces (voir
Gestion des espèces) en quantité variables et parfois en quantité
inconnue.

Partant de ce stock commun, les équipes de coordination peuvent créer
plusieurs permanences de distribution dans des lieux, dates et créneau
horaires variables.

Les membres Adoptant peuvent s[']{dir="rtl"}inscrire à
l[']{dir="rtl"}une de ces permanences de distribution en définissant au
préalable les espèces et quantités souhaitées (dans la limite des stocks
disponibles). Ils peuvent (doivent?) également sélectionné au sein de
leur profil le projet de plantation auquel les plants seront destinés.

Lors du jour J, l'équipe de coordination de la distribution consigne les
quantités réellement distribuées aux Adoptants.

Ainsi la création d[']{dir="rtl"}un événement de distribution sur la
plateforme devra au moins comporter les éléments suivants:

l[']{dir="rtl"}intitulé de la distribution

une description sympa qui pourra être incluses dans le courriel
d[']{dir="rtl"}information (gestion du format pour template de la
campagne email)

contact général pour l\'événement

un ou plusieurs créneaux de distribution avec leur lieu, date et
horaires associées ainsi qu[']{dir="rtl"}un contact

une ou plusieurs espèces végétales (sélectionnable parmi une liste
administrable - voir Gestion des espèces végétales) ainsi leur stock
disponible

le statut de publication de l'événement (brouillon ou publié)

éventuellement une image pour illustrer l'événement

un lien partageable permanent pour s[']{dir="rtl"}inscrire à une
distribution.

La création puis la publication d[']{dir="rtl"}un événement de
distribution permet la création automatique d[']{dir="rtl"}un formulaire
de réservation pour les utilisateurs Adoptant. Ce formulaire accessible
directement depuis la nouvelle plateforme numérique permettra aux
Adoptant-e-s de:

sélectionner un créneau de distribution

réserver une quantité pour les espèces qu[']{dir="rtl"}iels désirent
parmi la liste proposée

associer cette collecte à un projet de plantation

Côté coordination, lors des jours de distribution, les administrateurs
pourront sur le terrain en mobilité:

sélectionner un créneau de distribution

consulter les membres inscrits à cette distribution

valider ou corriger les quantités collectées par les différents
Adoptants lors de la distribution.

Récits Utilisateurs

Gestion d\'un événement de distribution

US-DIS-01 --- Créer un événement de distribution

En tant que Coordinateur, je veux créer un événement de distribution
afin de structurer et publier une campagne de distribution de végétaux.

Critères d\'acceptation :

\- Je peux saisir : intitulé, description (format riche pour template
email), contact général, image facultative

\- L\'événement est créé en statut Brouillon par défaut

\- Un lien permanent partageable est généré automatiquement à la
création

\- Seuls les utilisateurs avec le rôle Coordinateur peuvent créer un
événement

US-DIS-02 --- Gérer les créneaux de distribution

En tant que Coordinateur, je veux ajouter un ou plusieurs créneaux à un
événement afin de proposer aux Adoptants plusieurs options de lieu, date
et horaire.

Critères d\'acceptation :

\- Chaque créneau comporte : lieu, date, heure de début, heure de fin,
contact du créneau

\- Je peux ajouter, modifier ou supprimer un créneau tant que
l\'événement n\'est pas Clôturé

\- La suppression d\'un créneau ayant des réservations actives est
bloquée ou déclenche une alerte explicite

US-DIS-03 --- Gérer le stock d\'espèces végétales d\'un événement

En tant que Coordinateur, je veux associer des espèces végétales et leur
stock disponible à un événement afin que les Adoptants puissent réserver
dans la limite du stock commun.

Critères d\'acceptation :

\- Je sélectionne les espèces parmi la liste administrable (Gestion des
espèces --- feature séparée)

\- Pour chaque espèce, je peux saisir une quantité disponible ou
indiquer \"quantité inconnue\"

\- Le stock est partagé entre tous les créneaux de l\'événement

\- Le stock résiduel est visible en temps réel dans l\'interface de
gestion

US-DIS-04 --- Gérer le statut d\'un événement

En tant que Coordinateur, je veux faire évoluer le statut d\'un
événement afin de contrôler sa visibilité et son cycle de vie.

Critères d\'acceptation :

\- Statuts possibles : Brouillon → Publié → Clôturé

\- En Brouillon : l\'événement n\'est pas visible par les Adoptants

\- En Publié : l\'événement est accessible via le lien permanent et les
réservations sont ouvertes

\- En Clôturé : plus aucune réservation ni annulation n\'est possible ;
l\'événement reste consultable

\- Un coordinateur peut repasser un événement Publié en Brouillon si
aucune réservation n\'existe, ou avec confirmation explicite si des
réservations sont en cours

US-DIS-05 --- Publier un événement et déclencher la campagne email

En tant que Coordinateur, je veux que la publication d\'un événement
déclenche automatiquement l\'envoi d\'un email aux membres adhérents
afin de les informer de l\'ouverture des inscriptions.

Critères d\'acceptation :

\- À la transition Brouillon → Publié, un email est envoyé
automatiquement à tous les membres adhérents

\- L\'email inclut la description de l\'événement (champ description
formaté) et le lien permanent de réservation

\- Un aperçu de l\'email est consultable avant publication

\- L\'envoi est tracé (date, nombre de destinataires)

Réservation (Adoptant)

US-DIS-06 --- Consulter un événement de distribution

En tant qu\'Adoptant, je veux accéder à la page d\'un événement de
distribution via le lien partagé afin de consulter les informations et
les créneaux disponibles.

Critères d\'acceptation :

\- La page affiche : intitulé, description, liste des créneaux (lieu,
date, horaires, contact), espèces disponibles avec stock résiduel

\- Accessible uniquement aux membres adhérents authentifiés

\- Si l\'événement est Clôturé, la page est en lecture seule avec
mention explicite

US-DIS-07 --- S\'inscrire à un créneau de distribution

En tant qu\'Adoptant, je veux réserver des plants sur un créneau de
distribution afin de planifier ma collecte.

Critères d\'acceptation :

\- Je sélectionne un créneau parmi ceux disponibles

\- Pour chaque espèce souhaitée, je saisis une quantité (dans la limite
du stock résiduel)

\- Je sélectionne obligatoirement un projet de plantation parmi ceux
définis dans mon profil

\- La réservation décrémente immédiatement le stock commun

\- Je reçois une confirmation par email avec le récapitulatif de ma
réservation

\- Je ne peux avoir qu\'une seule réservation active par événement

US-DIS-08 --- Rejoindre la liste d\'attente

En tant qu\'Adoptant, je veux m\'inscrire sur liste d\'attente lorsque
le stock d\'une espèce est épuisé afin d\'être averti si des plants se
libèrent.

Critères d\'acceptation :

\- Lorsque le stock d\'une espèce atteint 0, les Adoptants peuvent
rejoindre la liste d\'attente pour cette espèce

\- En cas d\'annulation libérant du stock, les Adoptants en liste
d\'attente sont notifiés par email (ordre d\'inscription)

\- L\'Adoptant notifié dispose d\'un délai défini pour confirmer sa
réservation avant que le stock soit proposé au suivant (délai à
préciser)

US-DIS-09 --- Annuler une réservation

En tant qu\'Adoptant, je veux annuler ma réservation afin de libérer les
plants que je ne pourrai pas collecter.

Critères d\'acceptation :

\- L\'annulation est possible jusqu\'à 48h avant la date du créneau
réservé

\- Au-delà de ce délai, l\'annulation est bloquée

\- L\'annulation restitue le stock au pool commun de l\'événement

\- Les Adoptants en liste d\'attente sont notifiés si du stock est ainsi
libéré

\- Je reçois une confirmation d\'annulation par email

Validation terrain (Coordinateur --- Jour J)

US-DIS-10 --- Consulter les inscrits d\'un créneau

En tant que Coordinateur, je veux consulter la liste des Adoptants
inscrits à un créneau depuis mon mobile afin d\'organiser la
distribution sur le terrain.

Critères d\'acceptation :

\- Interface accessible en PWA sur mobile

\- Je sélectionne un événement puis un créneau

\- La liste affiche pour chaque Adoptant : nom, espèces réservées,
quantités réservées, projet de plantation associé

\- La liste est disponible hors connexion (données mises en cache) (à
confirmer selon contraintes techniques)

US-DIS-11 --- Valider les quantités distribuées

En tant que Coordinateur, je veux saisir les quantités réellement
distribuées à chaque Adoptant afin de conserver un historique fiable des
distributions effectives.

Critères d\'acceptation :

\- Pour chaque Adoptant du créneau, je peux modifier librement les
quantités par espèce (la quantité réservée est pré-remplie)

\- Je peux marquer un Adoptant comme \"non venu\"

\- La validation est enregistrée par Adoptant indépendamment (pas de
validation globale bloquante)

\- Les données saisies sont synchronisées dès que la connexion est
disponible

Questions résiduelles

\- US-DIS-08 : délai de confirmation après notification liste
d\'attente?

\- US-DIS-09 : si annulation \< 48h, prévoir une dérogation
coordinateur?

\- US-DIS-11 : besoin d\'un export (CSV/PDF) de la liste des inscrits
par créneau?

Gestion des espèces végétales et encyclopédie végétale

Description des fonctionnalités

Lors des distributions organisées par Repousse, un stock de jeunes
plants est mis à disposition pour la collecte. Ce stock comprend
plusieurs espèces voire variétés (sous-espèces, variétés cultivées a.k.a
cultivars) végétales. Il est parfois difficile d[']{dir="rtl"}identifier
l[']{dir="rtl"}espèce ou la variété comprise dans un stock. Dans ce cas
le genre botanique ou l[']{dir="rtl"}un de ses noms vernaculaires de
référence est utilisé (ex: Chêne pour le genre botanique *Quercus L.,
1753* pour un ensemble de chênes pédonculés *Quercus robur* L., 1753,
chêne sessile *Quercus petraea* (Matt.) Liebl., 1784)

Afin de configurer les stocks de chaque distribution, les
administrateurs de la plateforme devront pouvoir maintenir une liste
contrôlée des genres, espèces ou variétés (ci-après désignées avec le
terme générique *taxon*) disponible. Un outil d'édition leur sera mis à
disposition pour maintenir cette liste de référence.

Sans ajouter de complexité inutile, cet outil d'édition facilitera au
mieux la gestion des taxons selon les standards
d[']{dir="rtl"}organisation de la classification binomiale du vivant
(noms latins). Ainsi les parentés taxonomiques pourront être renseignées
(Chêne *Quercus* est le parent taxonomique de Chêne pédonculé *Quercus
robur*). Cette fonctionnalité n[']{dir="rtl"}est pas accessoire car elle
permettra d\'agréger des données lors de la génération des indicateurs
d[']{dir="rtl"}impact et de suivi.

Par ailleurs, chaque taxon ajouté dans cette liste devra avoir un nom
commun car c[']{dir="rtl"}est celui qui est le plus connu du plus grand
nombre (le latin est une langue morte finalement).

Il sera également possible pour les administrateurs
d[']{dir="rtl"}ajouter des catégories génériques pour chaque taxon (ex:
arbres, arbustes, fruitiers, plantes grimpantes...). Ces catégories
seront également mobilisées pour les agrégations
d[']{dir="rtl"}indicateurs dans le tableau de bord de suivi.

De plus, afin de rendre plus souple la création des stocks, les
administrateurs pourront ajouter des entrées n[']{dir="rtl"}ayant rien
avoir avec la classification du vivant dans cette liste (ex: Plante
grimpante non identifiée)

Bien qu[']{dir="rtl"}elles soient utiles, il n[']{dir="rtl"}est pas
prévu dans cette version des fonctionnalités de gestion des synonymes ou
de gestion/fusion des doublons.

Idéalement, Repousse souhaiterait que cette liste de référence puisse
également servir à la construction de ressources pédagogiques numériques
pour mieux connaître les végétaux et mettre en place des bonnes
pratiques de multiplication, culture et plantation.

Il est ainsi prévu de relier la fiche de détails d[']{dir="rtl"}une
entrée de la liste avec des bases de connaissance externes telles que
[[Floriscope]{.underline}](https://www.floriscope.io/),
[[Wikipedia]{.underline}](https://fr.wikipedia.org/wiki/Plante)/[[Wikidata]{.underline}](https://www.wikidata.org/wiki/Q756),
[[Encyclopedia of Life]{.underline}](https://eol.org/pages/42430800),
[[DoPI]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9786240/),
[[GloB]{.underline}](https://www.globalbioticinteractions.org/browse/?interactionType=ecologicallyRelatedTo&resultType=json&sourceTaxon=Quercus)I...
Il sera également pour les éditeurs de la plateforme
d[']{dir="rtl"}ajouter de nouvelles ressources associés aux plantes
(photos, articles et guides de la communauté Repousse...)

Récits Utilisateurs

Gestion des catégories

US-TAX-01 --- Administrer les catégories de taxons

En tant qu\'Administrateur, je veux créer et gérer une liste de
catégories afin de classifier les taxons pour la recherche et
l\'agrégation des indicateurs d\'impact.

Critères d\'acceptation :

\- Je peux créer, renommer et supprimer des catégories (ex : arbre,
arbuste, fruitier, plante grimpante)

\- La suppression d\'une catégorie utilisée par des taxons est bloquée
tant que des taxons y sont associés

\- Un taxon appartient à une seule catégorie

Gestion des taxons

US-TAX-02 --- Créer un taxon

En tant qu\'Administrateur, je veux ajouter un taxon à la liste de
référence afin de constituer le référentiel des végétaux disponibles
pour les distributions et projets de plantation.

Critères d\'acceptation :

\- Champs disponibles :

\- Nom scientifique (latin) --- (obligatoire sauf pour entrées
non-taxonomiques)

\- Nom commun de référence --- (obligatoire)

\- Niveau taxonomique : Genre / Espèce / Variété ou Cultivar

\- Taxon parent (sélection dans la liste existante, facultatif --- voir
US-TAX-03)

\- Catégorie (sélection depuis la liste administrable)

\- Indication \"entrée non-taxonomique\" (ex: \"Plante grimpante non
identifiée\") --- dispense du nom latin

\- La création est tracée (auteur, date)

US-TAX-03 --- Gérer la hiérarchie taxonomique

En tant qu\'Administrateur, je veux associer un taxon à son parent
taxonomique afin de structurer les relations de parenté pour
l\'agrégation des indicateurs d\'impact.

Critères d\'acceptation :

\- Un taxon peut avoir un taxon parent (ex : Quercus robur → parent :
Quercus)

\- La hiérarchie est limitée à 3 niveaux : Genre → Espèce →
Variété/Cultivar

\- Les entrées non-taxonomiques peuvent être associées à un parent ou
rester en entrée racine

\- La suppression d\'un taxon parent est bloquée tant qu\'il a des
enfants dans la liste

US-TAX-04 --- Modifier un taxon

En tant qu\'Administrateur, je veux modifier les informations d\'un
taxon afin de corriger ou enrichir les données de référence.

Critères d\'acceptation :

\- Tous les champs sont modifiables

\- Chaque modification génère une nouvelle version dans l\'historique
(champ modifié, ancienne valeur, auteur, date)

US-TAX-05 --- Restaurer une version antérieure d\'un taxon

En tant qu\'Administrateur, je veux restaurer une version précédente
d\'un taxon afin d\'annuler une modification erronée.

Critères d\'acceptation :

\- L\'historique des versions est consultable depuis la fiche du taxon

\- Je peux restaurer n\'importe quelle version antérieure --- la
restauration crée une nouvelle version (pas d\'écrasement silencieux)

\- L\'historique complet est conservé après restauration

US-TAX-06 --- Supprimer un taxon

En tant qu\'Administrateur, je veux supprimer un taxon afin de retirer
une entrée erronée ou obsolète de la liste de référence.

Critères d\'acceptation :

\- La suppression est bloquée si le taxon est référencé dans une
distribution, un stock ou un projet de plantation

\- En cas de blocage, un message liste les ressources qui utilisent le
taxon

\- La suppression d\'un taxon parent est bloquée s\'il possède des
taxons enfants

Import en masse

US-TAX-07 --- Importer des taxons depuis une source externe

En tant qu\'Administrateur, je veux importer une liste de taxons depuis
un fichier structuré afin d\'alimenter rapidement la liste de référence
lors de l\'initialisation de l\'application.

Critères d\'acceptation :

\- Format d\'import supporté : CSV avec schéma documenté (colonnes : nom
scientifique, nom commun, niveau taxonomique, parent, catégorie, entrée
non-taxonomique) (schéma à définir avec le prestataire)

\- Un rapport d\'import est généré : nombre de taxons créés, lignes
ignorées (doublons, erreurs de format) avec détail des erreurs

\- Les doublons (même nom scientifique) sont signalés mais pas fusionnés
automatiquement dans cette version

\- La source de référence importée est conçue pour être réutilisable par
d\'autres instances de l\'application

Ressources pédagogiques

US-TAX-08 --- Ajouter des liens vers des bases de connaissance externes

En tant qu\'Administrateur ou Éditeur, je veux associer des liens vers
des bases de connaissance externes à la fiche d\'un taxon afin
d\'enrichir les ressources pédagogiques disponibles.

Critères d\'acceptation :

\- Je peux ajouter un ou plusieurs liens URL pour chaque base de
connaissance (Floriscope, Wikipedia/Wikidata, Encyclopedia of Life,
DoPI, GloBI, autres)

\- Chaque lien est associé à un libellé de source (sélection depuis une
liste ou saisie libre)

\- Les liens sont affichés sur la fiche détail du taxon

US-TAX-09 --- Ajouter des ressources communautaires à un taxon

En tant qu\'Administrateur ou Éditeur (rôle attribué par un admin sur
cette ressource), je veux ajouter des photos, articles ou guides
communautaires à la fiche d\'un taxon afin de constituer une base de
ressources pédagogiques propre à Repousse.

Critères d\'acceptation :

\- Types acceptés : photos (JPG, PNG), documents PDF, articles (texte
formaté)

\- Les médias utilisent le même système de stockage que les autres
ressources de la plateforme

\- Chaque ressource peut être accompagnée d\'un titre et d\'une
description courte

\- Le rôle Éditeur sur la gestion des taxons est distinct des autres
rôles éditeurs de la plateforme --- il est attribué explicitement par un
Admin

Consultation

US-TAX-10 --- Consulter et rechercher la liste des taxons

En tant qu\'Utilisateur connecté, je veux parcourir et rechercher la
liste des taxons afin de trouver une espèce pour un projet de plantation
ou une réservation de distribution.

Critères d\'acceptation :

\- La liste est filtrables par : catégorie, niveau taxonomique, présence
de ressources pédagogiques

\- La recherche porte sur le nom scientifique et le nom commun

\- Les entrées non-taxonomiques sont clairement identifiées dans la
liste

\- La liste est accessible aux utilisateurs connectés uniquement

US-TAX-11 --- Consulter la fiche détail d\'un taxon

En tant qu\'Utilisateur connecté, je veux consulter la fiche complète
d\'un taxon afin d\'accéder à toutes les informations disponibles sur
cette espèce.

Critères d\'acceptation :

\- La fiche affiche : nom scientifique, nom commun, niveau taxonomique,
taxon parent (avec lien), catégorie, liens vers bases de connaissance
externes, ressources communautaires (photos, articles, guides)

\- La hiérarchie taxonomique est visualisable (chemin : Genre → Espèce →
Variété)

\- Accessible aux utilisateurs connectés uniquement dans cette version

Configuration initiale

US-TAX-12 --- Configurer la liste de référence à l\'installation

En tant qu\'Administrateur technique, je veux sélectionner ou importer
une liste de référence adaptée à la zone biogéographique lors de
l\'installation de l\'application afin que le référentiel soit pertinent
dès le démarrage.

Critères d\'acceptation :

\- Plusieurs listes de référence pré-constituées sont disponibles selon
la zone biogéographique (ex : océanique, continentale, méditerranéenne)

\- La sélection d\'une liste au démarrage alimente automatiquement la
liste des taxons via le mécanisme d\'import (voir US-TAX-07)

\- Une instance peut fonctionner avec une liste personnalisée
indépendante des listes pré-définies

\- La liste de référence utilisée est indiquée dans les paramètres de
l\'application

Questions résiduelles

\- US-TAX-07 : schéma CSV d\'import à définir en atelier avec le
prestataire

\- US-TAX-09 : quota de stockage des médias taxons --- partagé avec le
quota global plateforme ou distinct ?

\- US-TAX-12 : les listes biogéographiques pré-constituées --- qui les
maintient (Repousse, ou mutualisé entre instances) ?

Tableau de bord: indicateur de suivi et mesure de l[']{dir="rtl"}impact

Description des fonctionnalités

Cette nouvelle plateforme doit également permettre à la coordination de
l[']{dir="rtl"}association de construire manuellement des agrégations de
données que ce soit pour les distributions ou pour l[']{dir="rtl"}impact
bénévoles.

Un nouveau tableau de bord sera conçu de manière à:

permettre la consultation et l[']{dir="rtl"}export de données brutes
telles que la liste des plantes distribuées, des sites de plantations,
la liste des bénévoles actifs (données anonymisées)...

visualiser des données agrégées sous formes de graphiques, de cartes ou
d[']{dir="rtl"}indicateurs clés (voir fichier fourni par Citizing comme
source d[']{dir="rtl"}inspiration)

avoir une vision d[']{dir="rtl"}ensemble des activités de
l[']{dir="rtl"}association sous forme de calendrier

Ce(s) tableau(x) de bord seront accessibles par les administrateurs de
la plateforme et par les utilisateurs qui y auront été invités par les
administrateurs

Afin de faciliter l[']{dir="rtl"}exploration des données, un outil BI
open source ([[Metabase]{.underline}](https://www.metabase.com/)) pourra
également être mis en place pour l'équipe de coordination et le conseil
d[']{dir="rtl"}administration de l[']{dir="rtl"}association.

Un atelier avec le prestataire permettra de préciser le périmètre et les
souhaits de l'équipe en ce qui concerne le rapportage et les indicateurs
clés.

Récits Utilisateurs

Accès & administration du tableau de bord

US-DB-01 --- Accéder au tableau de bord

En tant qu\'Administrateur ou Utilisateur invité, je veux accéder au
tableau de bord de suivi afin de consulter les données d\'activité et
d\'impact de l\'association.

Critères d\'acceptation :

\- Le tableau de bord est accessible depuis le menu principal de la
plateforme

\- Les admins accèdent à l\'ensemble des thématiques et données

\- Les utilisateurs invités accèdent à une vue restreinte (périmètre à
définir en atelier)

\- Les données sont rafraîchies quotidiennement de manière automatique

\- La date du dernier rafraîchissement est affichée

US-DB-02 --- Inviter un utilisateur au tableau de bord

En tant qu\'Administrateur, je veux inviter un utilisateur à accéder au
tableau de bord afin de partager les données de suivi avec des membres
de confiance.

Critères d\'acceptation :

\- J\'invite un utilisateur existant de la plateforme par recherche ou
email

\- L\'utilisateur invité reçoit une notification et accède au tableau de
bord en vue restreinte

\- Je peux révoquer l\'accès à tout moment

\- La liste des utilisateurs invités est consultable depuis les
paramètres du tableau de bord

Thématique --- Distributions & impact environnemental

US-DB-03 --- Consulter les indicateurs clés de distribution

En tant qu\'Administrateur ou Utilisateur invité, je veux consulter les
indicateurs synthétiques de distribution afin d\'avoir une vision
immédiate de l\'activité de l\'association.

Critères d\'acceptation :

\- Indicateurs affichés (filtrables par période et département) :

\- Nombre total d\'arbres/plants distribués

\- Nombre d\'arbres distribués par catégorie de taxon (arbres, arbustes,
fruitiers, grimpantes, inconnu)

\- Nombre de communes ayant bénéficié de distributions

\- Nombre de racines nues distribuées

\- Nombre de projets de plantation actifs

\- Nombre de bénévoles actifs (données agrégées, sans identification
individuelle)

\- Les indicateurs sont accompagnés d\'une comparaison avec la période
précédente (à confirmer en atelier)

US-DB-04 --- Consulter les indicateurs d\'impact environnemental (CO2)

En tant qu\'Administrateur ou Utilisateur invité, je veux visualiser
l\'impact carbone estimé des distributions afin de mesurer la
contribution environnementale de l\'association.

Critères d\'acceptation :

\- Indicateurs affichés par catégorie de taxon et en total :

\- Tonnes de CO2 évitées par an (tCO2eq/unité/an × quantité distribuée)

\- Tonnes de CO2 évitées sur la durée de vie des arbres

\- Les calculs reposent sur des coefficients configurables par catégorie
de taxon (coefficients à définir en atelier avec le prestataire, basés
sur le modèle Citizing)

\- Les hypothèses de calcul sont affichées de manière transparente (ex :
\"hypothèse : 100 % des plants surviven\")

\- Les données sont agrégables par année, par distribution, par
département

US-DB-05 --- Consulter les graphiques de distribution par typologie

En tant qu\'Administrateur ou Utilisateur invité, je veux visualiser la
répartition des plants distribués sous forme de graphiques afin
d\'analyser la composition des stocks distribués.

Critères d\'acceptation :

\- Graphiques disponibles :

\- Histogramme : nombre d\'arbres distribués par catégorie de taxon

\- Camembert : répartition en pourcentage par catégorie de taxon

\- Camembert : CO2 évité par an par catégorie

\- Camembert : CO2 évité sur durée de vie par catégorie

\- Filtres disponibles : année, période, département, bénéficiaire (si
applicable)

\- Les graphiques sont interactifs (survol pour valeur détaillée)

Thématique --- Cartographie

US-DB-06 --- Consulter la carte de distribution géographique

En tant qu\'Administrateur ou Utilisateur invité, je veux visualiser sur
une carte la répartition géographique des plants distribués afin
d\'identifier les zones d\'impact de l\'association.

Critères d\'acceptation :

\- Carte choroplèthe par commune et/ou département affichant le nombre
de plants distribués (avec légende par tranche, ex : 0 / \]0--23\] /
\]23--51\] / \]51--137\] / \]137--1243\])

\- Filtre par département sélectionnable

\- Filtre par année ou période

\- Zoom interactif département → commune

\- Les données géographiques reposent sur les adresses des projets de
plantation associés aux distributions

US-DB-07 --- Consulter la carte des projets de plantation

En tant qu\'Administrateur ou Utilisateur invité, je veux visualiser la
localisation des projets de plantation sur une carte afin d\'avoir une
vision géographique de l\'implantation des plants distribués.

Critères d\'acceptation :

\- Les projets de plantation publics et privés sont représentés sur la
carte (les privés visibles aux admins uniquement)

\- Chaque point représente un projet avec : nom, nombre de plants
associés, surface

\- Filtre par statut du projet (actif, archivé), par catégorie de taxon

\- Données géographiques issues des adresses saisies dans les fiches
projet

Thématique --- Calendrier

US-DB-08 --- Consulter le calendrier des activités

En tant qu\'Administrateur ou Utilisateur invité, je veux consulter un
calendrier des événements de l\'association afin d\'avoir une vision
d\'ensemble des activités planifiées.

Critères d\'acceptation :

\- Le calendrier affiche : événements de distribution (publiés),
ateliers et événements organisés par l\'association et ses partenaires

\- Vue disponible : mensuelle, hebdomadaire (journalière optionnelle)

\- Les admins et utilisateurs ayant des droits de création/modification
sur les événements peuvent créer ou modifier un événement depuis le
calendrier

\- Les utilisateurs invités consultent le calendrier en lecture seule

\- Clic sur un événement → fiche détail de l\'événement

Export de données

US-DB-09 --- Exporter des données brutes

En tant qu\'Administrateur ou Utilisateur invité, je veux exporter des
données brutes afin de les analyser dans un outil externe ou de les
partager.

Critères d\'acceptation :

\- Exports disponibles :

\- Liste des plants distribués (taxon, catégorie, quantité, date,
commune)

\- Liste des projets de plantation (nom anonymisé si privé, commune,
surface, taxons associés)

\- Liste des bénévoles actifs --- agrégée, sans données individuelles,
avec zone géographique des projets uniquement

\- Formats : CSV, Excel (.xlsx), PDF

\- Les exports sont filtrables par période, département, catégorie de
taxon avant génération

\- Chaque export mentionne la date de génération et les filtres
appliqués

Metabase (outil séparé)

US-DB-10 --- Accéder à Metabase pour l\'exploration avancée des données

En tant que Membre de l\'équipe de coordination ou du conseil
d\'administration, je veux accéder à Metabase afin d\'explorer librement
les données de l\'association sans passer par le tableau de bord
applicatif.

Critères d\'acceptation :

\- Metabase est hébergé en self-hosted, distinct de l\'application
principale

\- L\'accès est restreint à l\'équipe de coordination et au CA (gestion
des accès dans Metabase)

\- Les mêmes règles d\'anonymisation s\'appliquent : aucune donnée
individuelle identifiable, agrégation sans données individuelles hors
zones géographiques

\- Les données sont synchronisées avec la base applicative selon le même
cycle de rafraîchissement quotidien

Questions résiduelles

\- US-DB-03 : comparaison avec période précédente --- à confirmer en
atelier

\- US-DB-04 : coefficients CO2 par catégorie de taxon à définir (modèle
Citizing comme base)

\- US-DB-01/02 : périmètre exact de la vue restreinte des utilisateurs
invités à préciser en atelier

\- US-DB-08 : types d\'ateliers et événements partenaires --- gérés
depuis la plateforme ou saisie manuelle dans le calendrier ?

\- Calcul CO2 : les coefficients varient-ils par taxon précis ou
uniquement par catégorie ? Impacte la granularité du référentiel taxons

Gestion des partenaires et historique des contacts

Description des fonctionnalités

L'équipe de coordination de Repousse souhaite également utiliser la
nouvelle plateforme numérique pour centraliser les contacts Partenaires.

À l[']{dir="rtl"}instar d[']{dir="rtl"}un mini CRM interne, cette
section de l[']{dir="rtl"}application permettra simplement
d[']{dir="rtl"}ajouter des nouveaux contacts ou d[']{dir="rtl"}importer
une liste de contact depuis un annuaire.

Il sera possible pour les administrateurs de lier à chacune des fiches
contacts un journal d[']{dir="rtl"}activités catégorisés comprenant des
notes de suivi et des actions à planifier

Récits Utilisateurs

Liens avec les canaux de discussions externes

L[']{dir="rtl"}ensemble des utilisateurs de la plateforme pourront
facilement depuis leur profil utilisateur et/ou depuis une section mise
en avant dans l[']{dir="rtl"}application retrouver les liens vers canaux
de discussions de l[']{dir="rtl"}association.

À l[']{dir="rtl"}heure actuelle, ces discussions sont hébergées sur
l[']{dir="rtl"}application WhatsApp de Meta. En concertation avec les
adhérents, et au regard des principes de confidentialité et de
protections des utilisateurs, il pourra être envisagé une solution
alternative open source (ex:
[[Mattermost]{.underline}](https://mattermost.com/),
[[Element]{.underline}](https://element.io/fr) chat)

Charte graphique et Design System

Vous trouverez notre logo ici

[[https://drive.google.com/drive/folders/1V7JYwfhMD_JPhUYyNbB7KggmZ-dZcKIE?usp=share_link]{.underline}](https://drive.google.com/drive/folders/1V7JYwfhMD_JPhUYyNbB7KggmZ-dZcKIE?usp=share_link)

Pour les fonts nous utilisons en print :

titres : Harman Sans et Harman simple

pour le texte : Roboto

Ref du vert #caca40 (non ce n\'est pas une blague)

Pour le site on a un peu dérivé :
[[https://www.repousse.org/]{.underline}](https://www.repousse.org/)

Si besoin marion peut

Prérequis techniques

Cette application et son développement doivent le plus possible
respecter les principes de conception numérique responsable.

Un choix de technologies et un conception d[']{dir="rtl"}infrastructure
efficiente permettant une consommation d'énergie sobre côté serveur sera
privilégiée.

Dans ce cadre et à ce stade, les fonctionnalités IA seront absentes de
la nouvelle plateforme numérique. Lors de son développement, un usage
raisonné de l[']{dir="rtl"}IA dans l[']{dir="rtl"}automatisation de la
génération de code sera respecté. À titre informatif, Un reporting de
l[']{dir="rtl"}usage de tokens pour la conception de cette solution
pourra être demandé par l[']{dir="rtl"}association Repousse.

En ce qui concerne le fonctionnement des applications clientes, un score
de performance élevée est attendu pour les [[Web
Vitals]{.underline}](https://developers.google.com/speed/docs/insights/v5/about?hl=fr).

De manière générale, il est recommandé de suivre les recommandations du
[[Référentiel général d\'écoconception de services numériques
(RGESN)]{.underline}](https://ecoresponsable.numerique.gouv.fr/publications/referentiel-general-ecoconception/).
Un reporting des actions conduites pourra être demandé au prestataire
et/ou au mainteneur de l\'application.

Hébergement et distribution de la solution

L[']{dir="rtl"}application finale pourra être auto-hébergée par
l[']{dir="rtl"}association Repousse et/ou par ses structures partenaires
dans le cadre d[']{dir="rtl"}un essaimage de l[']{dir="rtl"}application.

L[']{dir="rtl"}ensemble de l[']{dir="rtl"}application sera développé
sous une licence ouverte mais limitant les réutilisations commerciales
sans consentement préalable.
