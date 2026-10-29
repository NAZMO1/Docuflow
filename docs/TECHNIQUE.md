# Architecture et exploitation

## Répartition du code

- `src/app.js` : navigation, import local, édition sur page, annotations et aperçu.
- `src/toolbox.js` : outils complémentaires, contrôles de paramètres et recettes.
- `src/documents.js` : lecture, rendu, transformation et export des documents.
- `tests/documents.test.mjs` : transformations, structure et contenu.
- `tests/visual.test.mjs` : rendu, corrections, retrait de zones, compression et signature.
- `build.mjs` : copie des assets locaux et bundle navigateur avec esbuild.

Le worker PDF.js, les bibliothèques et la police sont servis avec l’application. Aucun CDN ni service de conversion distant n’est requis à l’exécution.

## Correction sans conversion en texte

L’import d’un PDF unique ouvre l’éditeur visuel. PDF.js fournit les fragments de texte horizontaux et leurs coordonnées. La correction mémorise le rectangle, la position de ligne de base, la nouvelle chaîne et les couleurs.

À l’export, pdf-lib crée un nouveau document. Une page corrigée est rendue en PNG (jusqu’à 2×, maximum 2 600 pixels sur le côté long), placée dans une nouvelle page de mêmes dimensions et de même crop box ; la zone est effacée puis le nouveau texte est ajouté. La rotation est conservée. Les autres pages sont copiées. Le flux textuel original de la page corrigée n’est pas incorporé dans cette page de sortie.

La taille du remplacement est réduite si nécessaire pour tenir dans le rectangle ; un texte qui nécessiterait une taille inférieure à 5 points est refusé. Les textes verticaux, les scans, les fonds texturés et les polices spécifiques ne sont pas reconstruits à l’identique. Les annotations simples ajoutent du contenu sans effacer le contenu sous-jacent. L’onglet de texte extrait produit volontairement un nouveau document avec une nouvelle mise en page.

## Outils et compromis

- Extraction : plages validées, dédoublonnées, ordre demandé ; ZIP d’un PDF par page.
- Formulaires : champs AcroForm existants, texte/cases/listes, apparences actualisées ; pas de XFA ni de création de champs. Utiliser l’outil dédié pour conserver les formulaires interactifs.
- Compression : rendu JPEG, perte du texte sélectionnable, des liens et des champs ; comparaison des poids et avertissement si le résultat est plus lourd.
- Retrait de zone : page aplatie avec rectangle noir. Vérifier les autres occurrences et les autres pages. Les pièces jointes du PDF ne sont pas reprises.
- Rognage : modification de la crop box ; le contenu extérieur reste récupérable et n’est pas censuré.
- Métadonnées : inspection des informations documentaires et copie des pages dans un nouveau document pour retirer les anciennes informations de document. Ce n’est pas un anonymiseur du contenu visible.
- Comparaison : même page dans deux fichiers, rendus côte à côte et pixels différents en orange si les dimensions correspondent. Aucun jugement sémantique.
- Signature : dessin PNG ; aucune certification ni validation cryptographique.
- Recettes : réglages génériques dans localStorage sur demande ; documents en mémoire seulement.

## Import et mémoire

Validation des formats, tailles et nombre de pages. Pour DOCX, vérification de la structure ZIP et de la taille décompressée déclarée. Ces garde-fous ne garantissent pas la prise en charge de tout document complexe ou malformé.

Limites : 50 Mo par fichier, 100 Mo par opération, 30 fichiers, 300 pages PDF ; 80 pages pour la compression, 150 pour l’export PNG. PDF protégés par mot de passe refusés. Une modification peut invalider une signature numérique existante.

## Développer et déployer

Node.js 22 ou supérieur avec les dépendances optionnelles activées pour les tests de rendu :

```bash
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory dist
```

Les tests visuels utilisent `@napi-rs/canvas`, dépendance optionnelle de PDF.js. Ils ne génèrent pas de fichiers dans un répertoire propre à la machine de développement.

Publier `dist/` sur un hébergement statique HTTPS avec les types MIME appropriés pour `.js` et `.mjs`. Le worker doit rester accessible depuis la même origine. Les chemins relatifs autorisent un sous-dossier. Ne pas versionner `dist/`, `node_modules/`, les secrets ou les informations de session. Les paramètres Sites du site déjà publié ne sont pas inclus dans cet export GitHub.

## Validation

18 tests : fusion, Unicode, DOCX, rejet des formats incorrects, sélection et duplication des pages, coordonnées avec crop/rotation, plages invalides, ZIP, filigrane/pagination, formulaires, métadonnées, corrections et rasterisation. Le contrôle visuel tolère moins de 0,5 % de pixels différents hors du rectangle corrigé, avec un seuil de différence de rendu. L’absence de l’ancien passage et la présence de la correction dans le texte extractible sont vérifiées.

L’interface minifiée a été essayée pour le repérage et la correction, les formulaires et la comparaison. Le téléchargement par l’événement du navigateur distant a expiré : les tests des octets générés ne valident pas tous les comportements de téléchargement des navigateurs.

## Dépendances et licences

Les versions sont verrouillées dans `package-lock.json` : pdf-lib, PDF.js, fontkit, JSZip, Mammoth, docx, Buffer et esbuild. DejaVu Sans est distribuée avec [sa licence](../public/assets/FONT-LICENSE.txt). Les tests visuels utilisent également les composants natifs optionnels de PDF.js. Le build conserve les notices de licence liées d’esbuild : ne pas les retirer lors du déploiement.

Aucune licence de redistribution n’a été choisie pour le code propre au projet.

## Évolutions nécessitant un moteur supplémentaire

OCR, conversion Office fidèle, PDF/A, IA et chiffrement ne sont pas implémentés. Les paiements et droits premium demanderaient des contrôles côté serveur. Les propositions de compression à poids cible et de détection automatique des défauts restent des pistes, pas des fonctions actives.
