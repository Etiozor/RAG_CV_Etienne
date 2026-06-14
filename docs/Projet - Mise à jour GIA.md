# Extraction des accès Power BI — Mise à jour de la GIAI

**Auteur :** Étienne Le Pironnec  
**Organisation :** Association Québécoise de Récupération des Contenants de Boissons (AQRCB)  
**Finalité :** Mise à jour de la Gestion des Identités et des Accès Informatiques (GIAI) Power BI

---

## Raison d'être

Ce projet répond à un besoin de **gouvernance des accès** sur l'environnement Power BI de l'organisation. La GIAI (Gestion des Identités et des Accès Informatiques) exige une vue régulièrement actualisée de qui peut accéder à quoi dans l'outil de pilotage décisionnel de l'AQRCB.

Sans automatisation, cet inventaire serait réalisé manuellement depuis l'interface d'administration Power BI — une tâche longue, sujette aux erreurs et difficile à reproduire. Ce script automatise entièrement l'extraction et produit un rapport Excel structuré, prêt à être intégré dans le registre GIAI.

---

## Ce que fait le script

Le script `extract_pbi_access.py` interroge l'**API REST Power BI** et génère un fichier `.xlsx` contenant :

| Feuille | Contenu |
|---|---|
| Vue d'ensemble | Tableau de bord récapitulatif (workspaces, groupes, objets) |
| Accès Workspace | Rôles des groupes de sécurité au niveau des espaces de travail |
| Permissions Rapports | Accès utilisateurs/groupes par rapport (mode admin) |
| Permissions Dashboards | Accès utilisateurs/groupes par dashboard (mode admin) |
| Permissions Modèles | Accès utilisateurs/groupes par modèle sémantique (mode admin) |
| Applications | Apps publiées, leurs accès et leur contenu |

Le script s'adapte automatiquement selon que le compte utilisé dispose ou non des droits **Power BI Admin** sur le tenant Microsoft 365 :
- **Mode admin** : extraction complète du tenant (tous les workspaces, permissions objet par objet)
- **Mode utilisateur** : extraction limitée aux workspaces accessibles par le compte

---

## Thèmes et expertises abordés

### Gouvernance des identités et des accès (IAM / GIAI)
- Inventaire des groupes de sécurité Azure AD et de leurs droits dans Power BI
- Cartographie des rôles : Admin, Member, Contributor, Viewer, ReadReshare, Build, Owner
- Traçabilité des accès aux artefacts décisionnels (rapports, dashboards, modèles sémantiques, applications)

### API REST Microsoft Power BI
- Utilisation des endpoints `/v1.0/myorg` (user) et `/v1.0/myorg/admin` (tenant admin)
- Gestion du throttling (code HTTP 429) avec retry automatique via `Retry-After`
- Détection dynamique des droits administrateur et sélection des endpoints appropriés

### Authentification OAuth2 — Microsoft Identity Platform
- Flux **Device Code Flow** (MSAL) : adapté aux environnements sans interface web ou aux comptes avec MFA
- Mise en cache des tokens pour éviter une nouvelle authentification à chaque exécution
- Portées (`scopes`) spécifiques à l'API Power BI : `https://analysis.windows.net/powerbi/api/.default`

### Automatisation Python et traitement de données
- Structuration des données extraites avec `defaultdict` pour une navigation par workspace/objet
- Tri et déduplications des résultats pour la lisibilité du rapport final
- Gestion des cas limites (absence de permissions, réponses vides, droits insuffisants)

### Génération de rapports Excel (openpyxl)
- Mise en forme professionnelle : en-têtes colorées, banding des lignes, couleurs par rôle
- Bloc de métadonnées standardisé en tête de chaque feuille (sujet, date, auteur, finalité)
- Gel des volets et filtres automatiques sur toutes les feuilles de données
- Largeurs de colonnes adaptées au contenu

---

## Prérequis

```bash
pip install requests openpyxl msal
```

Un compte Microsoft 365 avec accès à l'environnement Power BI de l'AQRCB est requis. Les fonctionnalités complètes (permissions objet par objet, liste exhaustive des utilisateurs d'apps) nécessitent le rôle **Power BI Administrator** sur le tenant.

---

## Utilisation

```bash
python extract_pbi_access.py
```

Le script affiche un code d'appareil à valider sur `https://microsoft.com/devicelogin`, puis extrait les données et crée un fichier `PBI_Acces_Groupes_YYYYMMDD_HHMM.xlsx` dans le répertoire courant.
