# Projet d'audit et documentation des modèles sémantiques Power BI
## Consignaction — Documentation assistée par IA agentique

---

## Genèse du projet

Consignaction opère un réseau croissant de dépôts de contenants consignés au Québec. Au fil du temps, l'équipe BI a développé une suite de modèles sémantiques Power BI couvrant des sujets variés liés aux opérations du réseau. Ces modèles, construits de manière incrémentale, manquaient souvent de documentation structurée — rendant difficile l'onboarding de nouveaux analystes et la maintenance à long terme.

Le projet est né d'un constat simple : **documenter manuellement un modèle sémantique est long, répétitif et sujet à erreurs.** Un modèle typique avec des dizaines de mesures DAX, une vingtaine de tables et autant de relations représente plusieurs heures de travail si fait à la main. Et cette documentation devient vite obsolète dès que le modèle évolue.

L'idée : automatiser ce travail en connectant directement Claude à l'instance Power BI Desktop en cours d'exécution, via un protocole de communication standardisé — le **MCP**.

---

## Thèmes abordés

Les modèles sémantiques documentés dans ce projet couvrent plusieurs domaines métier du réseau Consignaction. Chacun est audité séquentiellement, et donne lieu à un fichier de documentation autonome.

Chaque modèle est abordé selon la même grille d'analyse :
- **Structure du modèle** : tables de faits, dimensions, paramètres
- **Logique DAX** : mesures clés, dossiers thématiques, anomalies détectées
- **Relations** : cardinalité, direction de filtrage, relations inactives
- **Patterns d'utilisation** : cas d'usage typiques pour les développeurs rapport

---

## Le rôle du MCP dans ce projet

Le **MCP (Model Context Protocol)** est ce qui rend tout le projet possible. Sans lui, Claude n'aurait aucun moyen d'accéder au contenu réel des modèles Power BI ouverts sur le poste — il devrait se contenter de ce que l'utilisateur lui copie-colle dans la conversation.

Concrètement, le projet repose sur un **serveur MCP dédié à Power BI Modeling** qui tourne en parallèle de Power BI Desktop et expose son contenu à Claude.

### Architecture

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│   Claude (LLM)      │ ◄─────► │   Serveur MCP        │ ◄─────► │  Power BI Desktop   │
│   (claude.ai)       │   MCP   │   PBIModeling        │  API    │  (instance locale)  │
└─────────────────────┘         └──────────────────────┘         └─────────────────────┘
```

Le flux est toujours le même : Claude formule une requête (par exemple "donne-moi la liste des mesures de la table _Measures"), le serveur MCP la traduit en appel sur le moteur Analysis Services embarqué dans Power BI Desktop, et retourne la réponse structurée à Claude.

### Ce que le MCP permet de faire dans ce projet

**Découverte et connexion** — Identifier les instances Power BI actives sur le poste (ports TCP, noms de modèles), construire la chaîne de connexion vers le bon modèle.

**Exploration du modèle** — Inventorier les tables, récupérer le schéma détaillé par table (colonnes, types, dossiers d'affichage), lister les mesures DAX avec leurs définitions complètes, récupérer toutes les relations avec leur cardinalité et direction de filtrage.

**Modification ciblée** — Mettre à jour les descriptions de mesures individuellement ou en lot, utile pour enrichir le modèle après audit avec les observations rédigées dans la documentation.

### Ce que le MCP ne fait pas (par choix de sécurité)

Le serveur MCP supporte techniquement l'exécution de requêtes DAX via la fonction `EVALUATE`, ce qui permettrait de lire les données réelles du modèle. Dans ce projet, **cette capacité est explicitement bloquée**. Seules les métadonnées (structure, code DAX, relations) sont accessibles à Claude — jamais les données opérationnelles elles-mêmes.

### Limitations rencontrées

Quelques particularités apprises au fil des audits :

- Les tables de dates auto-générées par Power BI (`LocalDateTable_*`, `DateTableTemplate_*`) sont des objets système qui ne peuvent pas être supprimés via MCP. Pour les éliminer, il faut désactiver l'option "Renseignement automatique de la date/heure" dans les paramètres Power BI Desktop.
- Les mises à jour en lot de mesures sont plus robustes avec `continueOnError: true` et `useTransaction: false`.
- Certaines opérations exigent une correspondance exacte entre paramètres externes et internes (par exemple, le nom de mesure doit être identique à plusieurs niveaux d'une même requête).

---

## L'agentique dans ce projet

Sans MCP, pas d'accès au modèle. Sans approche agentique, l'accès au modèle ne suffirait pas — il faudrait écrire un script déterministe pour chaque modèle audité. Ce qui rend le projet efficace, c'est que **Claude orchestre lui-même les étapes** en fonction de ce qu'il découvre.

### Le flux d'audit type

```
1. DÉCOUVERTE
   Claude interroge le MCP pour identifier les instances Power BI actives
   et sélectionne le bon modèle

2. INVENTAIRE DES TABLES
   Claude liste toutes les tables, distingue les tables métier
   des tables système à ignorer dans la documentation

3. EXPLORATION DÉTAILLÉE
   Pour chaque table métier, Claude récupère le schéma complet
   (colonnes, types, dossiers d'affichage)

4. MESURES DAX
   Claude récupère toutes les mesures avec leur code DAX,
   analyse les définitions, identifie les catégories, détecte les anomalies

5. RELATIONS
   Claude récupère la liste complète des relations,
   construit le diagramme et identifie les cas particuliers

6. RÉDACTION
   Claude synthétise l'ensemble et rédige la documentation
   selon le template standardisé
```

### Ce qui rend l'approche agentique (et pas juste scriptée)

**Prise de décision adaptative** — Si une requête sur les mesures ne ramène que 50 résultats alors qu'il y en a manifestement plus, Claude ajuste le paramètre `maxResults` et relance. Si la table de mesures s'appelle `_Mesures` dans un modèle et `_Measures` dans un autre, Claude explore les variantes plutôt que de planter.

**Détection proactive d'anomalies** — Claude ne se contente pas de transcrire le code DAX. Il analyse les définitions pour repérer les patterns à risque : `VALUES()` sans protection, `MAX()` sur une dimension qui suppose un contexte de filtre unique, doublons de noms quasi identiques, mesures qui dépendent implicitement de relations inactives.

**Respect des règles de sécurité du projet** — Les fichiers interdits, commandes interdites, et le blocage des fonctions EVALUATE sont appliqués automatiquement à chaque étape, sans avoir à les rappeler à chaque audit.

**Aucune hypothèse de continuité entre sessions** — Chaque audit repart de zéro. Claude ne suppose jamais que le modèle ouvert aujourd'hui est le même que celui de la session précédente. Il redécouvre systématiquement l'état courant via le MCP.

---

## Structure du projet

```
projet/
├── README_Projet_Audit_Semantique.md       ← Ce fichier
└── [CodeModèle]_Documentation_Modele_Semantique.md  ← Un fichier par modèle audité
```

---

## Template de documentation

Chaque modèle est documenté selon un template structuré couvrant 8 sections :

| # | Section | Contenu |
|---|---------|---------|
| 1 | Vue d'ensemble | Objectif métier, architecture, granularité |
| 2 | Tables du modèle | Faits, dimensions, paramètres (colonnes clés uniquement) |
| 3 | Mesures DAX essentielles | Top 20-30% des mesures, classées par thème |
| 4 | Relations | Diagramme unique + tableau + points d'attention |
| 5 | Guide d'utilisation rapide | 3-5 patterns de rapports réutilisables |
| 6 | Référence rapide | Glossaire, pièges, notes techniques |
| 7 | Annexes | Historique des versions |
| 8 | Checklist | Validation avant publication d'un rapport |

**Longueur cible** : 270-350 lignes. La documentation doit permettre à un développeur de comprendre le modèle en moins de 5 minutes et de créer un premier rapport en moins de 10 minutes.

---

## Règles de sécurité

Ce projet manipule des métadonnées de modèles Power BI connectés à des systèmes de production. Les règles suivantes s'appliquent strictement :

**Fichiers interdits** — Aucun accès aux caches Power BI (`.pbi/`, `cache.abf`, `localSettings.json`), aux fichiers `.pbix`, ni aux fichiers de configuration sensibles (`.env`, `secrets/`).

**Commandes interdites** — `rm -rf`, `curl`, `wget`.

**Données vs métadonnées** — Les outils MCP sont utilisés uniquement pour lire les métadonnées du modèle (structure, mesures, relations). Les fonctions EVALUATE permettant d'exécuter des requêtes DAX sur les données réelles sont explicitement interdites.

**En cas de doute** — Toujours demander confirmation avant d'accéder à un fichier potentiellement sensible.

---

*Projet initié en 2026 — Consignaction / Équipe BI*
