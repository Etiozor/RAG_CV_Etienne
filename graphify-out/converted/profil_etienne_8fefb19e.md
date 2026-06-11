<!-- converted from profil_etienne.docx -->

Étienne
Analyste BI & Ingénieur de données
Conseiller en Intelligence et Ingénierie de données  |  Montréal, Québec


# Situation actuelle
Étienne est placé par AgileDSS à titre de Conseiller en Intelligence et Ingénierie de données au sein de Consignaction (AQRCB — Association québécoise de récupération des contenants de boissons), un organisme sans but lucratif qui gère le système de consigne des contenants de boissons au Québec.

Son rôle couvre deux axes complémentaires :
- Ingénierie de données : conception et développement de pipelines Azure Data Factory (ADF), architecture médaillon sur ADLS Gen2, déploiement CI/CD via Azure DevOps, modélisation de bases de données Azure SQL.
- Analytique & BI : développement de modèles sémantiques Power BI, mesures DAX avancées, Power Query M, gouvernance et centre d'expertise Power BI interne.

# Compétences techniques
## Plateforme Azure & ingénierie de données

## Power BI & analytique

## SQL Server & base de données

## Certification

# Réalisations et projets techniques notables
## Infrastructure de données Consignaction
Construction from scratch de la plateforme de données sur Azure : architecture médaillon complète (Bronze/Silver/Gold) sur ADLS Gen2, pipelines ADF multi-sources (TOMRA, MACHINEX, SESAMI, LT3, PORTAIL, LOGISTIQUE), déploiement automatisé via Azure DevOps CI/CD avec remplacement dynamique des Integration Runtimes par PowerShell.

## Modèles sémantiques Power BI
- MS05 — Volume des retours : matrice de distances DAX, moyennes mobiles, documentation exhaustive.
- MS06 — Déclaration / qualité des données : système de scoring avec mesures FLAG pondérées, score de non-qualité composite.
- MS16 — Monitoring des pipelines : surveillance des logs ADF sur les couches LANDINGZONE et ANALYTIQUE.

## Orchestration par fichier sentinelle
Conception d'un pattern d'orchestration ADF déclenché par fichiers sentinelles dans ADLS Gen2 (couche Bronze), avec conventions de nommage précises et procédures de redémarrage manuel.

## Projet BriefBI / Nao
Développement d'une interface BI conversationnelle exposant la logique des modèles sémantiques Power BI en langage naturel, via Power BI REST API, serveurs MCP, Azure App Registration (service principal) et connectivité XMLA.

## Infrastructure media self-hosted
Stack Docker personnel : Jellyfin, Sonarr, Radarr, qBittorrent, tunnelisation VPN via Gluetun/NordVPN, déployé sur WSL2 sur machine ARM64.

# Passions et projets personnels
## Échecs compétitifs
Joueur enregistré à la FQE (Fédération québécoise des échecs), Elo actuel autour de 1175. Il participe régulièrement à des tournois (Championnat Ouvert de la Mauricie, Tournoi de Grambly) et suit activement sa progression de cote. L'objectif à moyen terme est d'obtenir une cote FIDE officielle.

## Plein air & aventure
Passionné d'activités de plein air, notamment la pêche, le kayak et le camping. Il fréquente régulièrement le Parc régional Kiamika avec son groupe d'amis pour des weekends en nature. Ces sorties sont souvent organisées collectivement et représentent un temps fort de son année.

## Jeux de société & jeux vidéo
Amateur de jeux de stratégie et de réflexion. Côté jeux vidéo : Baldur's Gate 3, Slay the Spire. Côté jeux de société : Cat in the Box, Risk: Le Seigneur des Anneaux. Il organise régulièrement des soirées jeux avec des amis.

## Cuisine & gastronomie
Intérêt marqué pour la cuisine, qu'il pratique comme loisir créatif et convivial.

## Club So — Organisation d'événements
Étienne anime le « Club So », un groupe social rattaché à son milieu de travail pour lequel il organise et coordonne des activités collectives.

## Apprentissage de l'anglais
Il pratique activement l'amélioration de son anglais écrit, notamment via des exercices de rédaction sur des sujets d'actualité (séparatisme albertain, accessibilité à la Coupe du monde, etc.) suivis d'une correction pédagogique ciblée sur les calques du français vers l'anglais.

## Cyclisme
Le vélo fait partie de ses activités régulières, tant pour le loisir que les déplacements urbains à Montréal.

# Ancrage géographique
Étienne est basé à Montréal, Québec, et est francophone de souche. Il entretient des liens forts avec la France (carte Crédit Mutuel Arkéa, attaches personnelles) et a envisagé un retour en France à certaines étapes de sa vie. Son environnement professionnel est entièrement québécois, avec une clientèle et des collègues majoritairement francophones.

Document généré automatiquement par Claude (Anthropic) à partir de l'historique de conversations. Montréal, juin 2026.
| Azure Data Factory |  | ADLS Gen2 |  | Azure SQL |  | Azure DevOps |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
| DACPAC / sqlpackage |  | CI/CD YAML |  | PowerShell |  | ARM / Bicep |
| DAX |  | Power Query M |  | Modèles sémantiques |  | DirectQuery |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
| Mesures FLAG |  | Scores non-qualité |  | Row-Level Security |  | REST API PBI |
| T-SQL avancé |  | Procédures stockées |  | MERGE / ROW_NUMBER |  | SSMS |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
| Déduplication |  | Architecture LOGS |  | Schémas multi-couches |  | Anonymisation |
| Microsoft DP-700
Fabric Analytics Engineer Associate | Microsoft Azure / Fabric |
| --- | --- |