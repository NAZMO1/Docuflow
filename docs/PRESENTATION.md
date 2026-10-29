# DocFlow — Présentation du projet

**Démonstration :** https://docuflow-nazmo.adeptmole259.chatgpt.site/

DocFlow est un atelier PDF en français qui traite les fichiers localement dans le navigateur : correction visuelle, organisation des pages, conversions simples, formulaires et préparation de dossiers.

## Le besoin

Une candidature ou une démarche administrative impose souvent de réunir des pièces, corriger une information, ajouter des numéros et vérifier le document final. DocFlow rassemble ces étapes et permet de conserver les documents sur l’appareil.

## Nouveautés

- Corriger un passage directement sur une page PDF, sans recréer tout le document à partir du texte extrait.
- Découper et extraire des pages, inverser leur ordre, sélectionner les pages paires ou impaires.
- Ajouter filigranes et numéros, rogner, dessiner une signature.
- Remplir des formulaires existants ; comparer deux PDF par leur rendu visuel.
- Compresser par conversion en images, avec indication du poids obtenu et de la perte de texte sélectionnable.
- Retirer une zone d’une page aplatie, inspecter et nettoyer les métadonnées documentaires.

## Parcours propres à l’atelier

**Dossier candidature** assemble les pièces avec un sommaire facultatif qui indique la première page de chaque fichier. **Recette de partage** enchaîne nettoyage des métadonnées, filigrane et pagination ; les réglages génériques peuvent être mémorisés sur l’appareil. **Contrôle avant envoi** fournit un rapport sur les pages, leurs dimensions et les champs présents.

Ces parcours sont adaptés au positionnement de DocFlow. Leur exclusivité face aux autres logiciels n’est pas revendiquée.

## Démonstration suggérée

1. Importer un PDF fictif dans « Modifier un document ».
2. Repérer ses textes, choisir une adresse et appliquer une correction.
3. Utiliser « Comparer à l’original » et « Voir le PDF final ».
4. Préparer un dossier de candidature à partir de plusieurs PDF, avec sommaire.
5. Ajouter une pagination ou un filigrane avec une recette de partage.

Les corrections de texte aplatissent uniquement les pages concernées en images haute résolution. Leur aspect est conservé au mieux, mais la police de remplacement peut différer et le texte original de ces pages n’est plus sélectionnable. Le nouveau texte est ajouté à la position du passage corrigé. Cette limite doit être expliquée lors des démonstrations.

## Compétences illustrées

Interface responsive en HTML/CSS et JavaScript natif ; manipulation de fichiers et Blob ; traitements asynchrones ; intégration de moteurs PDF, DOCX et ZIP ; rendu avec PDF.js ; contrôles de formulaire ; tests de contenu et comparaison de pixels ; construction et publication statique.

## État et limites

18 tests automatisés couvrent les exports et plusieurs cas limites. Les parcours de correction, remplissage et comparaison ont été essayés dans le navigateur. La récupération du fichier par l’événement de téléchargement du navigateur distant a expiré ; ce mécanisme distant reste non validé de bout en bout. Les octets des exports sont contrôlés par les tests locaux.

Pas d’OCR, de conversions Office fidèles, de traduction/résumé IA, de chiffrement/déchiffrement, de réparation générale des PDF ou de signature certifiée. La compression actuelle rasterise les pages ; une compression qui préserve les liens et le texte sélectionnable reste une évolution future. Le ciblage d’un poids maximal n’est pas implémenté. Aucun paiement ni revenu récurrent n’est intégré.

Projet personnel développé avec assistance IA. Son fonctionnement et ses limites sont documentés pour permettre une évaluation concrète.
