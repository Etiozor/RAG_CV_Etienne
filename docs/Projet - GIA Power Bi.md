# Linéage de données — Power BI × SQL Server
*Note technique de projet — Juin 2026*

---

## 1. Raison d'être

Dans un environnement BI mature, l'absence de linéage explicite est le risque silencieux le plus sous-estimé. On sait que les rapports Power BI s'alimentent de l'entrepôt SQL Server, mais la chaîne précise — quelle colonne de quel modèle sémantique pointe vers quelle table, quel schéma, quel champ — reste tacite, enfouie dans les fichiers .pbix et dans la mémoire des développeurs.

Ce projet automatise la réponse à deux questions fondamentales :

- Quels modèles sémantiques existent dans les workspaces Power BI, et quelles sont leurs sources de données ?
- Quelles tables, vues et colonnes sont exposées par l'entrepôt SQL Server, avec leur typage complet et leurs contraintes relationnelles (PK/FK) ?

Le croisement de ces deux inventaires produit un graphe de linéage de bout en bout : du champ métier visible dans un rapport jusqu'à la colonne physique en base. C'est le socle technique de toute démarche de gouvernance des données, d'analyse d'impact lors de modifications structurelles, et de documentation vivante de l'architecture décisionnelle.

---

## 2. Stack technique

Le projet repose sur quatre concepts techniques fondamentaux, implémentés en Python :

- **Authentification déléguée sans secret.** L'accès aux deux systèmes (Power BI et SQL Server) s'appuie exclusivement sur l'identité Azure AD de l'utilisateur, via les mécanismes MFA standard de l'organisation. Aucune App Registration, aucun secret applicatif.

- **Introspection de métadonnées via API REST.** Power BI expose ses workspaces, modèles sémantiques et datasources à travers son API REST. Le projet exploite ces endpoints pour construire l'inventaire côté rapport, avec support du mode administrateur pour une visibilité complète sur le tenant.

- **Inventaire structurel via catalogue système SQL.** Le schéma de l'entrepôt — tables, vues, colonnes, types, clés primaires et étrangères — est extrait directement depuis les vues système de SQL Server. C'est la source de vérité la plus fiable pour décrire la structure physique des données.

- **Croisement et export multi-format.** Les deux inventaires sont croisés pour produire le graphe de linéage, puis exportés en JSON, CSV et HTML selon les besoins de consommation (programmatique, tableur, navigation).

---

## 3. Résultats produits

Une exécution complète génère un instantané cohérent de l'état de l'architecture décisionnelle à un instant T. Les artefacts produits dans `./output/` sont :

- **`pbi_semantic_models_<timestamp>.{json,csv}`** : inventaire de tous les modèles sémantiques par workspace, avec propriétaire, URL, nombre de datasources, et détails de connexion (serveur, base).
- **`sql_columns_<timestamp>.{json,csv}`** : catalogue complet des colonnes de l'entrepôt — schéma, table, type, précision, nullabilité, position ordinale.
- **`sql_foreign_keys_<timestamp>.{json,csv}`** : graphe relationnel complet entre tables (`from_table.from_column → to_table.to_column`).
- **`lineage_pbi_sql_<timestamp>.{json,csv}`** : table de linéage croisée reliant chaque modèle sémantique à chaque colonne SQL de ses sources.
- **`lineage_rapport_<timestamp>.html`** : vue de navigation synthétique, directement exploitable sans outil tiers.

Ces fichiers sont conçus pour être re-consommés par d'autres outils : import direct dans un modèle Power BI de gouvernance, alimentation d'un catalogue de données, ou intégration dans un pipeline d'audit automatisé.

---

## 4. Implications dans les activités quotidiennes

**Analyse d'impact avant modification**
Avant de renommer une colonne, modifier un type ou supprimer une table dans l'entrepôt, une requête sur le CSV de linéage suffit à identifier tous les modèles sémantiques affectés. Ce qui était une recherche manuelle dans chaque .pbix devient une opération de quelques secondes.

**Documentation systématiquement à jour**
Le rapport HTML produit à chaque exécution remplace une documentation statique qui, par nature, devient obsolète dès la prochaine release. L'inventaire est daté, versationnable dans Git, et peut être comparé entre deux snapshots pour détecter des dérives structurelles.

**Gouvernance et audit**
L'inventaire des modèles sémantiques expose qui possède chaque dataset, quels modèles sont rafraîchissables, et quelles bases de données ils requêtent. Ces informations alimentent directement les revues de gouvernance et la gestion des accès.

**Onboarding et transfert de connaissances**
Le rapport HTML sert de carte de l'architecture décisionnelle pour tout nouveau membre de l'équipe ou pour un audit externe. Il rend l'architecture autodocumentée sans effort de maintenance.

---

## 5. Pertinence au sein des responsabilités

En tant qu'analyste BI au sein de l'AQRCE, les responsabilités couvrent simultanément la modélisation de l'entrepôt SQL Server, le développement des modèles sémantiques Power BI, et les pipelines d'intégration Azure Data Factory. Cette position transversale rend la visibilité du linéage particulièrement critique : chaque décision à l'une des couches a des répercussions mesurables aux autres.

Ce projet répond directement à ce besoin en outillant la gouvernance de l'architecture avec un niveau d'automatisation adapté à un environnement sans équipe dédiée au catalogue de données. Il ne requiert ni infrastructure supplémentaire, ni licence tierce — uniquement l'identité Azure AD existante et un accès en lecture aux APIs Power BI et SQL Server.

L'architecture modulaire du code (`collect_powerbi_lineage()` et `collect_sql_inventory()` sont des fonctions indépendantes et réutilisables) le positionne également comme brique d'intégration pour un projet de linéage plus large couvrant l'entrepôt complet — ADF inclus — que le script mentionne explicitement comme point d'extension futur.

*En résumé : ce projet transforme une connaissance tacite de l'architecture décisionnelle en un artefact exploitable, reproductible et intégrable — ce qui est précisément la valeur attendue d'un analyste BI opérant à l'intersection des données, des outils et des équipes.*

---

*Étienne Le Pironnec — AQRCE — Juin 2026*
