# Documentation — Agent Power BI Audit

> Version 1.0 — Juin 2026

---

## Genèse du projet

Ce projet est né d'un constat récurrent dans le travail d'analyste BI : les modèles sémantiques Power BI s'accumulent techniquement des dettes de qualité — relations mal configurées, mesures DAX sous-optimales, colonnes sans nommage métier, absence de sécurité RLS, documentation inexistante. Corriger ces problèmes manuellement est long, répétitif, et souvent incomplet faute de temps.

L'idée centrale est simple : faire en sorte qu'un agent IA puisse se connecter **directement** à une instance Power BI Desktop active, lire la structure du modèle sémantique, identifier les problèmes, appliquer des corrections, et produire un rapport d'audit structuré — le tout de façon autonome et traçable.

Ce n'est pas un outil de génération de rapport sur des fichiers statiques. C'est un agent qui **agit** sur un modèle vivant.

---

## Thèmes couverts

L'audit est organisé en sept sections thématiques, chacune correspondant à une dimension de qualité d'un modèle Power BI :

**Modèle de données (Section 1)**
Vérification de la conformité au schéma en étoile, détection et correction des relations bidirectionnelles et many-to-many, analyse des types de colonnes, présence et cohérence d'une table Calendrier, détection des doublons dans les clés de dimensions.

**Mesures DAX (Section 2)**
Identification des anti-patterns DAX (FILTER imbriqués, absence de VAR, divisions sans DIVIDE), correction des erreurs logiques, renommage métier, organisation en dossiers thématiques dans une table `Mesures` dédiée.

**Filtres et Slicers (Section 3)**
Audit de l'utilisation des slicers (sur dimensions vs tables de faits), analyse des interactions entre visuels, détection des conflits de contexte de filtre.

**UX et Lisibilité (Section 4)**
Analyse de la surcharge visuelle par page, cohérence des titres et couleurs, logique de navigation — en mode recommandation uniquement (pas de modification du rapport).

**Performance globale (Section 5)**
Volumétrie des tables, cardinalité des colonnes, types non optimaux pour la compression, mode de connexion (Import / DirectQuery / Composite).

**Sécurité RLS (Section 6)**
Audit des rôles de sécurité existants, risques de fuite via relations bidirectionnelles, proposition d'une architecture RLS maintenable.

**Documentation des mesures (Section 7)**
Score de documentation (% de mesures commentées), ajout de commentaires standardisés au format `OBJECTIF / LOGIQUE / DÉPENDANCES / CONTEXTE`.

---

## Architecture du projet

### Composants principaux

```
┌─────────────────────────────────────────────┐
│              Agent Claude (LLM)              │
│  Raisonnement, analyse, décisions, DAX       │
└────────────────────┬────────────────────────┘
                     │ appels d'outils
┌────────────────────▼────────────────────────┐
│         powerbi-modeling-mcp (serveur MCP)   │
│  Connecté à Power BI Desktop via localhost   │
│  Expose : tables, colonnes, mesures,         │
│           relations, rôles RLS               │
└────────────────────┬────────────────────────┘
                     │ XMLA / TOM
┌────────────────────▼────────────────────────┐
│         Power BI Desktop (instance locale)   │
│  Modèle sémantique en mémoire               │
└─────────────────────────────────────────────┘
```

### Fichiers de définition TMDL (lecture alternative)

Pour les projets en format `.pbip`, les fichiers de définition TMDL dans `*.SemanticModel/definition/` sont lisibles directement par l'agent (tables, mesures, relations, rôles). C'est la voie de secours quand la connexion MCP n'est pas disponible.

---

## Fonctionnement du MCP dans ce projet

### Qu'est-ce que le MCP ici ?

Le **Model Context Protocol (MCP)** est un standard qui permet à un agent IA d'utiliser des outils externes via une interface normalisée. Dans ce projet, le serveur MCP `powerbi-modeling-mcp` tourne en local sur un port dynamique et expose les métadonnées du modèle Power BI Desktop actif comme des outils appelables par l'agent.

### Initialisation de la session

Chaque audit commence par cette séquence :

```
ListLocalInstances  →  Connect(connectionString)
```

Le `connectionString` prend la forme :
```
Data Source=localhost:[port];Application Name=MCP-PBIModeling
```

Le port est découvert dynamiquement via `ListLocalInstances`.

### Opérations disponibles

| Opération MCP | Rôle dans l'audit |
|---|---|
| `batch_column_operations` | Renommage, masquage, changement de type de colonnes |
| `batch_measure_operations` | Création, modification, suppression de mesures DAX |
| `relationship_operations` | Lecture et correction des relations |
| `security_role_operations` | Lecture et création de rôles RLS |
| `table_operations` | Création de tables calculées (ex: table Calendrier) |
| `BatchGet` avec `maxResults: 200+` | Inventaire complet sans troncature |

### Contraintes importantes

**Les fonctions EVALUATE sont interdites.** L'agent ne peut pas interroger les données du modèle — seulement ses métadonnées. Si une analyse de doublons est nécessaire, l'agent génère des scripts DAX à exécuter manuellement dans DAX Studio.

**Les caractères accentués** (ex: `é`, `è`) dans les noms de mesures provoquent des erreurs d'encodage dans les opérations `Update` MCP. Contournement : modification manuelle directement dans Power BI Desktop.

**Les relations circulaires** bloquent les modifications de relations. Cause typique : une colonne calculée utilise `USERELATIONSHIP` sur la relation cible. La colonne doit être supprimée avant de modifier la relation.

---

## Notions d'agentique abordées

Ce projet illustre plusieurs patterns fondamentaux de l'agentique appliquée :

### 1. Agent à boucle de décision structurée

L'agent ne suit pas un script linéaire fixe. Il suit un workflow en phases avec des **points de décision interactifs** : à chaque phase d'audit, il présente un résumé des problèmes classés par gravité et demande à l'utilisateur de choisir un niveau de correction (1 à 4). Ce choix gouverne les actions suivantes. L'agent adapte son comportement en fonction du contexte et des préférences exprimées.

### 2. Triage et économie de tokens

Avant de commencer, l'agent détermine le **périmètre d'audit** (modèle sémantique seul / rapport seul / les deux). Les sections hors périmètre sont intégralement ignorées — non lues, non exécutées. C'est une stratégie de triage explicite pour optimiser la consommation de contexte dans des sessions qui peuvent être longues.

### 3. Utilisation d'outils (Tool Use)

L'agent dispose d'outils MCP comme capacités d'action sur le monde réel. Il décide **quand** et **comment** les appeler selon l'analyse en cours. C'est le pattern classique LLM + Tools : le raisonnement reste dans le modèle, les effets sont délégués aux outils.

### 4. Traçabilité et non-hallucination des actions

Une règle forte du projet : **zéro action fantôme**. L'agent ne documente que ce qu'il a effectivement fait. Chaque modification est tracée avec un état AVANT / APRÈS, le code DAX complet, et la justification. C'est une contrainte d'auditabilité — l'agent doit être accountable de ses actes.

### 5. Gestion des erreurs et dégradation gracieuse

Quand une opération MCP échoue (erreur d'autorisation, encodage, dépendance circulaire), l'agent ne bloque pas. Il documente l'erreur, propose un contournement (script manuel, action dans l'UI), et continue l'audit sur les autres points. C'est le pattern de **dégradation gracieuse** : l'échec d'une action ne compromet pas l'ensemble de la mission.

### 6. Séparation analyse / action

L'agent maintient une distinction stricte entre les phases **d'observation** (audit, lecture des métadonnées) et les phases **d'action** (corrections). Les sections UX (4) et Performance (5) sont en mode lecture seule par design — l'agent produit des recommandations mais ne modifie pas le rapport. Cette séparation limite le risque d'effets de bord non voulus.

### 7. Mémoire de session et continuité de contexte

Les apprentissages des audits précédents (patterns récurrents, workarounds découverts, conventions de nommage de l'environnement) sont capitalisés dans la mémoire persistante de l'agent. Chaque nouvelle session démarre avec ce contexte accumulé, ce qui évite de redécouvrir les mêmes contraintes d'un modèle à l'autre.

---

## Sécurité et périmètre d'accès

L'agent opère sous des contraintes d'accès strictes :

- **Interdit** : fichiers de cache (`.pbi/`, `cache.abf`, `localSettings.json`), fichiers de configuration sensibles (`.env`, `secrets/`)
- **Autorisé** : définitions TMDL (`*.SemanticModel/definition/**`), fichiers rapport (`*.Report/**`), documentation Markdown
- **Jamais** : commandes `EVALUATE` (accès aux données), `rm -rf`, `curl`, `wget`

L'objectif est de rester dans le périmètre des **métadonnées** du modèle — jamais les données elles-mêmes.

---

## Note — Sécurité des données dans le modèle

> ⚠️ Cette section concerne les pratiques de sécurité à appliquer **dans le modèle Power BI lui-même**, indépendamment du fonctionnement de l'agent.

La sécurisation des données est traitée comme une priorité non négociable dans chaque audit, quel que soit le niveau de correction choisi par l'utilisateur. Deux axes sont systématiquement vérifiés et appliqués.

### Masquage des colonnes sensibles

Toute colonne contenant des informations sensibles doit être masquée pour les utilisateurs finaux du rapport. Sont concernées notamment : les colonnes de credentials ou tokens techniques, les clés de coffre-fort (vault keys), les identifiants internes ETL/pipeline, et plus généralement toute colonne qui n'a pas de valeur métier directe pour l'utilisateur final mais qui expose de l'information sur l'infrastructure ou les systèmes sources.

Le masquage se fait via la propriété `IsHidden = true` sur la colonne, ce qui la rend invisible dans les visuels et les slicers sans la supprimer du modèle (les mesures DAX peuvent toujours l'utiliser si nécessaire).

### Row Level Security (RLS)

Le RLS est la mécanique native de Power BI pour restreindre l'accès aux données **au niveau des lignes** selon l'identité de l'utilisateur connecté. L'agent audite systématiquement la configuration RLS existante et, si absente, évalue si elle devrait l'être.

Quelques règles de conception à retenir :

**Filtrer sur les dimensions, pas sur les faits.** Un filtre RLS posé sur une table de dimension se propage automatiquement aux tables de faits via les relations (filtrage unidirectionnel). Filtrer directement une table de faits est fragile et souvent insuffisant.

**Les relations bidirectionnelles et le RLS ne font pas bon ménage.** Une relation bidirectionnelle peut permettre à un filtre RLS de se propager dans la mauvaise direction, créant des fuites de données. C'est une des raisons supplémentaires pour lesquelles les relations bidirectionnelles sont classées CRITIQUE dans cet audit.

**Tester chaque rôle avec "Afficher en tant que".** Power BI Desktop permet de simuler la vue d'un rôle RLS via *Modélisation → Afficher en tant que rôles*. Chaque rôle créé ou modifié doit être testé manuellement pour valider que les données visibles correspondent exactement au périmètre attendu.

**Utiliser une table de sécurité dédiée** quand les règles d'accès sont complexes (ex: un utilisateur peut voir plusieurs régions, ou les règles changent fréquemment). Plutôt que d'encoder la logique en dur dans le DAX du rôle, on maintient une table `Securite_Utilisateurs` (email / entité autorisée) qui est jointurée dynamiquement via `USERPRINCIPALNAME()`. Cela rend les règles maintenables sans modifier le modèle à chaque changement d'équipe.

---

## Livrable final

Chaque audit se conclut par un rapport Markdown généré automatiquement :

```
[NomDuProjet]_audit_[AAAAMMJJ]_v1.md
```

Ce rapport contient : le résumé exécutif avec scores par axe, le détail de chaque section auditée, toutes les modifications effectuées avec code DAX complet, les scripts EVALUATE générés si applicable, et les prochaines étapes recommandées. Encodage UTF-8 garanti.

---

*Ce projet est en évolution active. La version courante du guide d'audit est la v3.*
