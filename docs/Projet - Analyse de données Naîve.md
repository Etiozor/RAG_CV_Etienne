# Projet — Analyse de données naïve

**Contexte :** AQRCB · Parc Tomra (RVM)  
**Date :** Juin 2026

---

## Raison d'être

L'AQRCB reçoit périodiquement des extractions brutes de la table `StagingTomra_StatutEquipement`, qui agrège les événements télémétrie émis par les machines de récupération de contenants (RVM Tomra) déployées dans les points de vente partenaires au Québec.

Avant d'embarquer cette donnée dans un modèle Power BI ou dans un pipeline ADF structuré, deux questions se posent systématiquement : *qu'est-ce que cette table contient exactement ?* et *quel est l'état de santé du parc à cet instant ?* Répondre manuellement à ces deux questions en SQL coûte du temps répétitif, et ne produit rien de partageable.

Ce projet outille ces deux activités de façon reproductible et autonome, sans passer par l'infrastructure BI — c'est délibérément du Python "naïf" : rapide à lancer, sans dépendance à un environnement Power BI ou à un pipeline ADF.

---

## Stack

| Couche | Choix |
|---|---|
| Extraction | `pyodbc` + Azure AD Interactive → Parquet Snappy (`pyarrow`) |
| Traitement | `pandas` 2.x |
| Visualisation | `matplotlib` (PNG encodé en base64, embarqué inline dans le HTML) |
| Format de sortie | HTML autonome (zéro dépendance externe, ouvre dans n'importe quel navigateur) |
| Auth | Azure AD Interactive (MFA AQRCB, cache du token entre les sessions) |

Le format Parquet est le pivot central : l'extraction produit un `.parquet`, et les deux scripts d'analyse le consomment. Ce choix permet de ne faire l'extraction SQL qu'une seule fois et de rejouer les analyses localement sans retoucher la base.

---

## Ce que le projet produit

### 1. `extract_table.py` — Extraction SQL → Parquet

Connecte à Azure SQL Server via `pyodbc` (auth Azure AD Interactive), exécute un `SELECT` configurable (table complète, `TOP N`, ou requête personnalisée avec `TABLESAMPLE` pour les très grosses tables), et sérialise le résultat en Parquet Snappy compressé. Supporte le streaming par chunks pour les tables volumétriques.

### 2. `profile_data.py` — Rapport de profilage générique

Prend n'importe quel Parquet en entrée et génère un rapport HTML autonome contenant :

- **Vue d'ensemble** : shape, empreinte mémoire, taille fichier, répartition des types sémantiques inférés
- **Qualité** : matrice de complétude par colonne (nulls %), colonnes constantes, colonnes vides
- **Redondances** : détection par paires de colonnes avec taux d'égalité ≥ 95% sur un échantillon de 10k lignes
- **Par colonne** : type sémantique inféré (`numeric`, `datetime`, `categorical`, `text`, `id`, `boolean`, `json`, `constant`), cardinalité, top valeurs, stats descriptives, histogrammes
- **Analyse temporelle** : distribution par jour, heure, jour de semaine et mois pour chaque colonne datetime détectée

### 3. `analyze_fleet.py` — Rapport d'analyse du parc Tomra

Analyse métier centrée sur `StagingTomra_StatutEquipement`. Produit un rapport HTML avec :

- KPIs globaux (volume d'événements, machines actives, magasins, taux d'erreur)
- Répartition des sévérités (`INFO / WARNING / ERROR / DEBUG`)
- Top 15 événements et top 15 erreurs par fréquence
- Classement des machines par tier de santé (`Critique ≥ 30%` / `Élevé 10–30%` / `Attention 5–10%` / `Sain < 5%`) basé sur le taux d'erreur
- Top machines par volume, par erreurs absolues, par taux d'erreur
- Top magasins par volume, erreurs et taux
- Profil par famille de modèle (volume empilé et % de sévérité)
- Composants les plus problématiques
- Évolution temporelle (volume total + erreurs/warnings par jour)
- Machines silencieuses (aucun événement depuis N jours — potentiellement hors tension ou déconnectées)

---

## Implication dans les activités quotidiennes

En pratique, l'usage est ponctuel : dès qu'une nouvelle extraction de `StagingTomra_StatutEquipement` arrive (ou qu'un incident sur le parc est signalé), deux commandes suffisent :

```bash
python extract_table.py --table staging.StagingTomra_StatutEquipement --chunksize 100000
python analyze_fleet.py data/StagingTomra_StatutEquipement.parquet
```

Le rapport HTML s'ouvre directement dans un navigateur et est partageable par simple copie de fichier — pas de Power BI Desktop requis côté destinataire.

Pour une nouvelle table inconnue, `profile_data.py` remplace l'exploration ad hoc en SQL : plutôt que d'enchaîner des `SELECT TOP`, `COUNT(DISTINCT)`, `GROUP BY` manuels dans SSMS, le rapport automatise cette reconnaissance initiale et met en évidence les signaux d'alerte (nulls massifs, colonnes constantes, colonnes potentiellement redondantes).

---

## Pertinence au sein des responsabilités

En tant qu'analyste BI dans un réseau de consigne, les deux cas d'usage qui reviennent le plus souvent sont :

**Onboarding d'une nouvelle source de données.** Avant de modéliser dans Power BI ou d'écrire un pipeline ADF, il faut comprendre la structure, la qualité et les limites d'une table. `profile_data.py` compresse cette phase d'exploration de plusieurs heures à quelques minutes, et produit un livrable qui peut être partagé avec les équipes métier ou les fournisseurs de données pour validation.

**Surveillance opérationnelle du parc Tomra.** La santé des RVM est directement liée aux volumes de contenants récupérés. Une machine en erreur répétée ou silencieuse représente un manque à gagner mesurable. `analyze_fleet.py` fournit un diagnostic ponctuel sans passer par un rapport Power BI publié — utile pour une réunion rapide, une escalade vers Tomra, ou un audit interne avant un déploiement terrain.

Les deux scripts sont indépendants, sans infrastructure requise au-delà de Python et d'un accès réseau à Azure SQL, ce qui les rend utilisables en dehors du contexte Power BI standard — notamment en dehors du Service.
