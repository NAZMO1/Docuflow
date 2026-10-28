# Docuflow — Présentation du projet

## En une phrase

Docuflow est un atelier de documents en français qui permet de fusionner, convertir, extraire et annoter des fichiers directement dans le navigateur, sans les envoyer à un serveur de conversion.

**Démonstration :** https://docuflow-nazmo.adeptmole259.chatgpt.site/

## Le problème

Les démarches de candidature et les échanges administratifs nécessitent souvent plusieurs opérations simples : réunir des pièces, changer un format, récupérer du texte ou ajouter une précision. L’utilisateur doit parfois jongler entre plusieurs logiciels ou services.

## La solution

Une interface organise le travail autour de quatre actions : **fusionner, convertir, extraire et modifier**. L’utilisateur importe ses fichiers, prépare l’opération et récupère le résultat. Le traitement local limite les transferts de documents et permet de proposer les fonctions actuelles sans service de conversion distant.

## Exemple de démonstration en deux minutes

1. Ouvrir « Fusionner des PDF » et importer deux documents de démonstration.
2. Modifier leur ordre et générer le PDF assemblé.
3. Ouvrir « Extraire le texte » pour récupérer un passage d’un PDF contenant du texte sélectionnable.
4. Choisir « Modifier ce texte », corriger une phrase puis exporter un nouveau document.
5. Montrer l’annotation d’une page et expliquer la différence avec le remplacement du texte d’origine.

Utiliser des fichiers fictifs pour une démonstration publique.

## Compétences mises en pratique

- Conception d’une interface responsive en HTML/CSS et JavaScript natif.
- Manipulation de fichiers, Blob, URLs temporaires et téléchargements côté navigateur.
- Orchestration de traitements asynchrones et verrouillage des actions pendant le travail.
- Intégration de bibliothèques PDF, DOCX et ZIP.
- Validation des formats et gestion d’erreurs.
- Tests des documents produits : contenu, ordre, pagination et rotation.
- Construction et publication d’un site statique.

## État réel du projet

Le prototype est déployé et les fonctions décrites dans le README sont implémentées. Six tests du moteur de documents passent. L’interface a été essayée avec de vrais fichiers de démonstration, sur ordinateur et à une largeur mobile. La récupération du téléchargement via l’outil navigateur distant reste à confirmer.

Le projet a été développé avec assistance IA. Sa valeur technique doit être appréciée sur le fonctionnement du code, les vérifications et la capacité à expliquer les choix réalisés.

## Ce qu’il ne faut pas annoncer

Docuflow ne conserve pas la mise en page de tous les formats, ne réalise pas d’OCR et ne propose pas de signature électronique certifiée. Il n’est pas présenté comme un remplacement complet de Word ou Acrobat, ni comme un produit déjà rentable. Aucun système de paiement ou de publicité n’est actif.

## Évolution possible

Une piste est de spécialiser l’outil dans la préparation de dossiers avec plusieurs pièces. Cette hypothèse doit être confrontée à des utilisateurs avant de développer une offre payante. Les priorités techniques suivantes seraient les tests de téléchargement, la manipulation visuelle des pages et l’OCR.

## Description courte pour le dépôt GitHub

Atelier PDF en français : fusion, conversion, extraction et annotation de documents, avec traitement local dans le navigateur. JavaScript natif, PDF.js, pdf-lib et tests Node.js.

## Topics GitHub suggérés

`pdf` · `javascript` · `document-converter` · `pdf-lib` · `pdfjs` · `docx` · `privacy` · `client-side` · `french` · `portfolio`
