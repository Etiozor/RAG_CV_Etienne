# Cartographie des niveaux d'expertise — Etienne Le Pironnec (BI)

> **Légende**
> **N1 — Initié au sujet** : tu comprends les concepts, tu sais lire/modifier l'existant, tu peux exécuter une tâche cadrée avec un peu de recherche. Tu ne fais pas (encore) d'architecture ni d'optimisation fine en autonomie.
> **N2 — Expertise confirmée** : tu conçois en autonomie, tu optimises, tu débugues le non-trivial, tu poses des standards et tu formes les autres.
>
> Ce document interprète ta grille d'évaluation au regard de tes projets réels (Consignaction/AQRCB : médaillon sur ADLS Gen2, ADF CI/CD via Azure DevOps, modèles sémantiques MS05/MS06/MS16, projet BriefBI/Nao, certif DP-700). Pour chaque case notée, je décris l'attendu du niveau **et** je signale, le cas échéant, le « niveau du dessus » à viser.

---

## 1. Modélisation

### Modélisation sémantique — **N2 (Confirmé)**
C'est ton cœur de métier et la note la plus haute de ta grille, cohérent avec MS05/MS06/MS16.

**Attendu N2 :**
- Conception d'un modèle en étoile *orienté usage analytique* : tables de faits vs dimensions, granularité explicite, dimensions conformes partagées entre faits (ex. une Dim Date / Dim Produit communes à MS05 et MS06).
- Maîtrise du moteur **VertiPaq** : compression par colonne, cardinalité, impact des colonnes à forte cardinalité (GUID, timestamps) sur la taille du modèle.
- **Contexte de filtre vs contexte de ligne**, propagation par les relations, `CALCULATE` comme opérateur de transition de contexte. C'est la frontière N1→N2 en DAX.
- Relations actives/inactives, `USERELATIONSHIP`, role-playing dimensions (plusieurs dates : déclaration vs retour).
- Storage mode : Import / DirectQuery / Composite, agrégations.

**Concepts haut niveau à solidifier pour rester N2 :** modélisation tabulaire vs OLAP multidimensionnel classique, calculation groups (pour factoriser MS05/MS06), incremental refresh, et la lecture d'un plan de requête (DAX Studio / server timings).

### Modélisation dimensionnelle — **N1 (Initié)**
Distinction subtile avec la sémantique : la dimensionnelle est la *théorie* (Kimball), la sémantique est son *implémentation dans l'outil*.

**Attendu N1 :** comprendre étoile vs flocon, savoir ce qu'est une table de faits (transactionnel / snapshot périodique / snapshot cumulé) et une dimension.

**Pour viser N2 :** les **Slowly Changing Dimensions** (Type 1 vs 2 vs 3 — pertinent pour suivre l'historique d'un point de dépôt ou d'un comptoir), les *factless fact tables*, les *bridge tables* (relations many-to-many propres), la *conformance* des dimensions à l'échelle d'un entrepôt. Le Kimball *Data Warehouse Toolkit* est la référence canonique.

---

## 2. Power BI

### Power BI — Global — **N2 (Confirmé)**
Vue d'ensemble : tu te repères dans Desktop, Service, Gateway, capacités, licences (Pro / PPU / Fabric F-SKU). À N2 on attend que tu saches *décider* l'architecture de déploiement, pas seulement l'utiliser.

### Power BI — Préparation de données (M / Power Query) — **N1 (Initié)**
**Attendu N1 :** transformations via l'UI, comprendre le M généré, paramètres, fusion/ajout de requêtes.

**Pour viser N2 :** le **query folding** (savoir *quand* il se casse et le vérifier — déterminant sur tes sources SQL volumétriques), les fonctions personnalisées M, le traitement par lot de fichiers (pertinent vu ta landing zone à sentinelles), la gestion des types et des erreurs. Avec ta certif Fabric tu es probablement sous-évalué ici.

### Power BI — Modélisation de datasets (DAX, Modélisation) — **N1 (Initié)**
Ici la grille te met N1 alors que ton vécu (MS05/06/16, mesures de qualité pondérées) pousse vers N2 — la marche à franchir est surtout la *verbalisation* des concepts.

**Frontière N1→N2 :** transition de contexte, `CALCULATE` + modificateurs (`ALL`, `REMOVEFILTERS`, `KEEPFILTERS`), variables (`VAR`/`RETURN`) pour lisibilité et perf, *time intelligence* sans s'appuyer sur les fonctions toutes faites quand la Dim Date est custom, `TREATAS`, et le pattern de scoring pondéré que tu construis déjà.

### Power BI — Visualisation — *(non noté)*
Pas de note. Si tu montes ton centre d'expertise, c'est un axe à formaliser : charte graphique, storytelling, accessibilité, *small multiples*, choix de visuel selon l'intention analytique.

### Power BI — Admin / Gestion (Partage, diffusion Service) — **N1 (Initié)**
**Attendu N1 :** publier, partager une app, gérer des workspaces.

**Pour viser N2 (directement lié à ton hub Teams/SharePoint et ta stratégie de notifications) :** *deployment pipelines* (Dev/Test/Prod), gestion fine des rôles workspace, **RLS/OLS**, endorsement (Promoted/Certified), gouvernance via le tenant admin portal, *usage metrics*, et la stratégie de diffusion (apps vs partage direct vs intégration Teams).

---

## 3. Microsoft Azure

### MS Azure — Global — **N1 (Initié)**
**Attendu N1 :** comprendre les briques principales, naviguer le portail, déployer une ressource cadrée.

**Pour viser N2 :** les notions transverses — resource groups, IAM/RBAC Azure, networking (VNet, private endpoints, firewall — *exactement* ce que tu fais en ce moment avec Thomas sur le VPN/whitelisting IP), Key Vault, et le modèle de coût.

### MS — Azure Data Lake — **N1 (Initié)**
**Attendu N1 :** comprendre ADLS Gen2, conteneurs, namespace hiérarchique.

**Pour viser N2 :** organisation **médaillon** (bronze/silver/gold — que tu as bâtie), formats colonnes (Parquet/Delta), partitionnement, sécurité par ACL POSIX vs RBAC, lifecycle management, et l'orchestration des zones d'atterrissage (tes fichiers sentinelles).

### MS — Azure Data Factory — **N1 (Initié)**
C'est probablement ta case la plus sous-notée : ton vécu (pipelines CI/CD YAML, PowerShell de remplacement d'IR, gestion de triggers, expressions dynamiques pour SQL, ingestion API TOMRA) est du **N2 opérationnel**.

**Frontière N1→N2 :** Integration Runtimes (Auto-resolve / Self-hosted / SSIS), *linked services* paramétrés, *dataset/pipeline parameters* et variables, langage d'expression ADF, déploiement par templates ARM vs approche Git, et les patterns d'orchestration (metadata-driven pipelines, ForEach + Lookup, gestion d'erreurs/retry).

---

## 4. Données transverses (Fabric, Gouvernance, Libre-service)

### Fabric Data Engineer Persona — **N1 (Initié)**
Ta certif **DP-700** valide pourtant une compétence d'**Analytics Engineer Associate** : il y a un décalage à corriger dans la grille.

**Concepts haut niveau :** OneLake (le « OneDrive de la data »), Lakehouse vs Warehouse Fabric, notebooks Spark, Data pipelines (ADF dans Fabric), Dataflows Gen2, le *direct lake* mode (le pont entre lac et modèle sémantique — concept clé qui réconcilie tes deux axes data engineering / BI).

### Libre-service — **N2 (Confirmé)**
**Attendu N2 :** tu structures la capacité des utilisateurs à s'auto-servir — modèles sémantiques certifiés réutilisables, *thin reports* sur dataset partagé, gabarits, formation. C'est précisément l'objet de ton centre d'expertise Power BI. À N2 on attend que tu poses le cadre de gouvernance qui rend le libre-service *sûr* (pas un far-west de PBIX dupliqués).

### Gouvernance de données — **N1 (Initié)**
**Attendu N1 :** comprendre catalogage, lignage, propriété des données, certification de contenu.

**Pour viser N2 :** Purview (catalogue/lignage), politiques de sensibilité, MDM, *data contracts*, qualité de données outillée (ton système de scoring pondéré en est une brique concrète), endorsement et cycle de vie.

---

## 5. Développement & ingénierie logicielle

### SQL — **N1 (Initié)**
Là encore sous-noté vu ton vécu (procédures stockées d'ingestion, dédoublonnage, requêtes dynamiques, modélisation Azure SQL).

**Frontière N1→N2 :** window functions (`ROW_NUMBER`/`RANK`/`LAG` — base du dédoublonnage propre), CTE récursives, plans d'exécution et index, transactions/isolation, procédures stockées paramétrées robustes, MERGE pour les upserts.

### Python — *(non noté)*
Tu apprends en projet guidé. Pas dans la grille, mais pertinent pour Fabric/Databricks si tu vises l'axe data engineering avancé.

---

## Synthèse — où la grille te sous-estime

Au regard de tes projets, plusieurs cases mériteraient une révision à la hausse :

| Catégorie | Grille | Réalité projet probable |
|---|---|---|
| Azure Data Factory | N1 | **N2** (CI/CD, IR, expressions dynamiques) |
| Power BI – Modélisation DAX | N1 | **N2** (MS05/06/16, scoring pondéré) |
| SQL | N1 | **N2** (procédures, dédoublonnage, dynamique) |
| Fabric Data Engineer | N1 | **N1→N2** (certif DP-700 obtenue) |
| Azure Data Lake | N1 | **N1→N2** (médaillon bâti de zéro) |

La marche commune à franchir n'est pas technique mais **discursive** : savoir *nommer et expliquer* les concepts (transition de contexte, query folding, IR, SCD) que tu manipules déjà en pratique. C'est exactement ce qu'un évaluateur technique cherche pour faire passer un N1 en N2.
