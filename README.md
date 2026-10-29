<div align="center">

![DocFlow — L’atelier de vos documents](assets/banner.svg)

**Atelier PDF local : correction visuelle, outils PDF et dossiers prêts à partager.**

[Essayer DocFlow](https://docuflow-nazmo.adeptmole259.chatgpt.site/) · [Présentation](docs/PRESENTATION.md) · [Architecture](docs/TECHNIQUE.md)

</div>

> Projet personnel développé avec assistance IA. Prototype fonctionnel : les limites sont décrites ci-dessous.

# DocFlow — Atelier PDF local

DocFlow traite les documents en mémoire dans le navigateur. Les fichiers ne sont pas téléversés et les dépendances sont distribuées avec l’application.

## Modification avec conservation de l’aspect

Le parcours d’import d’un PDF unique ouvre désormais l’éditeur visuel. « Repérer les textes de cette page » expose les passages horizontaux sélectionnables ; choisir un passage, saisir la correction puis appliquer. L’aperçu et l’export utilisent le même moteur.

Les corrections conservent l’aspect de la page, pas sa structure vectorielle : seules les pages corrigées sont rendues en PNG (maximum 2 600 pixels sur le côté long, jusqu’à 2× la taille en points), la zone d’origine est effacée puis le texte corrigé est ajouté à sa position. Le flux de contenu original de ces pages n’est pas copié. Les autres pages sont copiées comme pages PDF. La police embarquée de remplacement peut différer ; la taille est réduite pour tenir dans la zone, avec refus si elle devient inférieure à 5 points. Le fond de la zone est configurable ; les fonds texturés et les textes verticaux ne sont pas reconstruits. Aucun OCR n’est réalisé.

L’onglet « Nouveau document à partir du texte » reste une conversion volontaire avec une nouvelle mise en page. Les annotations simples ajoutent du contenu sans retirer le contenu sous-jacent.

## Outils

- Fusion, organisation, retrait, duplication, rotation et réordonnancement des pages ; annulation des opérations de l’éditeur.
- Extraction par plages, pages impaires/paires, ordre inverse, ou ZIP d’un PDF par page.
- Filigrane textuel, pagination, rognage par marges.
- Signature dessinée (visuelle, sans certificat).
- Remplissage des champs texte, cases et listes des formulaires AcroForm existants, sans aplatissement ; pas de XFA ni de création de champs.
- Comparaison côte à côte avec différences de pixels en orange ; le résultat est sensible aux différences de rendu et n’est pas une comparaison sémantique.
- Compression par rasterisation JPEG, qualité configurable et comparaison du poids ; le résultat peut être plus lourd et perd texte sélectionnable, liens et formulaires.
- Retrait d’une zone noire par rasterisation de la page concernée. Vérifier toutes les occurrences de l’information et les autres pages. Le rognage ne constitue pas une suppression de données.
- Contrôle des métadonnées, dimensions, rotations et champs ; export JSON ; nettoyage des métadonnées documentaires par copie des pages dans un nouveau document.
- PDF → PNG ZIP, PDF → TXT, PDF → DOCX texte ; JPG/PNG → PDF ; DOCX/TXT → PDF texte.

## Parcours DocFlow

- **Dossier candidature** : assembler les pièces dans l’ordre choisi avec un sommaire facultatif indiquant la première page de chaque fichier.
- **Recette de partage** : enchaîner nettoyage des métadonnées, filigrane et pagination. Seuls les réglages génériques sont enregistrés dans localStorage si demandé, jamais les documents.
- **Contrôle avant envoi** : rapport local et aperçu du PDF réellement exporté dans les nouveaux outils.

Ces parcours sont des ajouts adaptés à DocFlow ; aucune exclusivité par rapport à d’autres logiciels n’est revendiquée.

## Limites

Les fonctions d’iLovePDF ont été examinées sur https://www.ilovepdf.com/ et sa documentation. Cette version n’en reproduit pas toute la couverture : OCR, conversions Office fidèles (Word/Excel/PowerPoint), PDF/A, traduction/résumé IA, chiffrement/déchiffrement, réparation des PDF corrompus et signature électronique certifiée ne sont pas implémentés. Pas de boutons factices pour ces fonctions.

50 Mo par fichier, 100 Mo par opération, 30 fichiers, 300 pages PDF ; compression limitée à 80 pages, export PNG à 150 pages ; images de 40 millions de pixels au maximum. Les documents protégés par mot de passe ne sont pas pris en charge. Une modification peut invalider les signatures numériques présentes. La copie de pages pour l’organisation ou l’aplatissement n’est pas destinée à préserver une structure AcroForm complexe : utiliser l’outil dédié pour remplir un formulaire. Les fichiers et les téléchargements de session disparaissent au rechargement.

## Développement et validation

```sh
npm ci
npm run build
npm test
```

Servir `dist/` via HTTP, par exemple `python3 -m http.server 8000 --directory dist`, puis ouvrir http://localhost:8000. Node.js 22 ou supérieur est requis. Le moteur et les workers PDF ainsi que la police sont locaux. Les tests visuels Node utilisent la dépendance optionnelle `@napi-rs/canvas` de PDF.js.

18 tests couvrent notamment : ordre d’extraction, plages invalides, ZIP, fusion, DOCX, Unicode, pagination, filigrane, formulaires interactifs, métadonnées, rognage, corrections de texte, retrait de zone, rotation et compression. Un test de comparaison de pixels vérifie que les différences hors de la zone corrigée restent inférieures à 0,5 % avec un seuil de tolérance de rendu. Il vérifie aussi l’absence du texte remplacé dans le texte extractible de la page.

Les parcours navigateur ont confirmé le repérage, la correction, la production du PDF et la détection des champs dans le bundle minifié. Le téléchargement via l’événement du navigateur distant a expiré ; les tests locaux contrôlent les octets générés, mais ne constituent pas une vérification du dialogue de téléchargement sur chaque navigateur.

## Structure

- `src/app.js` : atelier principal et éditeur visuel.
- `src/toolbox.js` : outils complémentaires et recettes.
- `src/documents.js` : transformations PDF et documents.
- `tests/` : contrôles de contenu et rendu.
- `public/` : interface et assets locaux.
- Les paramètres propres à l’hébergement du site ne sont pas inclus dans cet export.

Licences des bibliothèques conservées : pdf-lib, PDF.js, JSZip, Mammoth, docx, fontkit, Buffer et DejaVu.

## Auteur

Projet de [NAZMO1](https://github.com/NAZMO1). Aucune licence de redistribution n’a encore été choisie pour le code propre au projet. Les dépendances conservent leurs licences ; voir [la documentation technique](docs/TECHNIQUE.md#dépendances-et-licences).
