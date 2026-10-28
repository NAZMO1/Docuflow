# Architecture et exploitation

## Répartition du code

`src/app.js` gère la navigation entre outils, les fichiers importés, les actions disponibles, les messages, l’historique des résultats et les URLs temporaires. L’interface désactive les contrôles pendant les traitements principaux.

`src/documents.js` réalise les opérations sur les formats. Le worker PDF.js est copié dans les assets et référencé relativement au bundle. Une police locale est incorporée aux PDF créés pour prendre en charge notamment les accents français.

`build.mjs` recrée `dist/`, copie les assets de `public/`, ajoute le worker et génère le bundle JavaScript navigateur. `dist/` et `node_modules/` ne doivent pas être versionnés.

## Import et mémoire

Les fichiers sont chargés en mémoire. Le type est d’abord déterminé par l’extension, puis validé par le parseur adapté ; les images sont décodées. L’import d’un DOCX vérifie sa structure ZIP et limite sa taille décompressée déclarée. Ces contrôles ne constituent pas une garantie de sécurité exhaustive pour tout fichier malformé.

Les seuils de taille et de pages sont des garde-fous. Des PDF complexes peuvent consommer davantage de mémoire que ne le suggère leur taille sur disque. Pour une exploitation à grande échelle, compléter les essais avec de nombreux cas réels et auditer les dépendances.

## Export et durée de vie

Les résultats deviennent des Blob avec une URL temporaire. Les douze derniers résultats restent accessibles dans la session. Les URLs les plus anciennes sont révoquées ; les fichiers ne sont pas sauvegardés côté serveur. Le navigateur reste responsable du téléchargement sur disque.

## Déployer ailleurs

```bash
npm ci
npm test
npm run build
```

Publier le contenu de `dist/` sur un hébergement statique avec HTTPS et les types MIME appropriés, notamment JavaScript pour `.js` et `.mjs`. Le worker PDF.js doit être servi depuis la même origine. Les chemins relatifs permettent un déploiement dans un sous-dossier.

La configuration spécifique du site déjà publié, les identifiants d’hébergement et les informations de session ne sont pas inclus dans cet export GitHub. Copier ce code n’altère pas le site actuellement en ligne.

## Dépendances et licences

Consulter les fichiers de licence distribués avec les versions verrouillées dans `package-lock.json` :

| Dépendance | Usage |
| --- | --- |
| pdf-lib | Création et copie de pages, annotations et rotation. |
| PDF.js (`pdfjs-dist`) | Lecture, extraction et rendu des PDF. |
| fontkit (`@pdf-lib/fontkit`) | Incorporation de police dans les PDF. |
| JSZip | Lecture des structures DOCX et création du ZIP d’images. |
| Mammoth | Extraction du texte des DOCX. |
| docx | Création de documents Word éditables. |
| Buffer | Compatibilité de dépendances dans le bundle navigateur. |
| esbuild | Construction du bundle. |
| DejaVu Sans | Police locale ; licence dans `public/assets/FONT-LICENSE.txt`. |

Le bundle conserve les commentaires légaux via le mécanisme `legalComments: linked` d’esbuild. Ne pas supprimer les fichiers de notices générés lors du déploiement.

## Fonctions nécessitant une autre architecture

La monétisation avec droits premium demanderait une vérification des paiements et des autorisations côté serveur. Une signature répondant aux exigences d’une plateforme officielle demanderait une intégration avec un prestataire adapté. Ces fonctions ne font pas partie de cette version.
