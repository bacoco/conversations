# Backlog — panneau d'aide au prompt (Assistant IA, fork bacoco/conversations)

Mis à jour le 2026-10-09. Dernier commit poussé : 358f895 (branche feat/prompt-toolkit-panel).

## Fait
Panneau complet (Coach 4 modes, Nestor, Cours, Outils en familles, bibliothèque, Mes prompts
avec renommer/exporter/importer), illustrations, mode sombre et téléphone vérifiés, relais Albert
livré dans le nginx de l'interface (avec limite d'appels), mode sans Albert, documentation
docs/prompt-toolkit.md, bibliothèque des Outils à 91 prompts, « À la volée » relié aux modèles
complets (version améliorée, remplie par Nestor).

## Pistes issues de la recherche (2026-10-09) — dans le cadre « apprendre à écrire des prompts, panneau de droite »
Rappel du cadre (Loic) : Nestor aide à apprendre et à générer des prompts ; il ne modifie pas le chatbot officiel.
Livrables détaillés avec sources : scratchpad de la session, nestor-ideas/ (1-produits, 3-guides-recherche,
4-secteur-public, 5-ux-audace ; 2-communautés à venir).
Prioritaires (FAITES et poussées le 2026-10-09, commit a737a4b) :
1. Grille du Coach alignée sur le guide DINUM : critères « Sources » et « Exemples », pas de points pour les
   formules magiques (« tu es un expert », « étape par étape »), niveaux en mots au lieu d'une note sur 100.
2. Voyants instantanés dans le panneau (Contexte, Source, Consigne, Format) et mots flous, sans appel au modèle.
3. Mode tuteur : Nestor guide par indices au lieu de réécrire.
4. Prompts à trous {{date}} dans « Mes prompts » et partage par lien sans serveur (fragment d'URL).
5. Comparaison expliquée de deux prompts, sans les exécuter.
6. Option « Réponse prudente » (autoriser « je ne sais pas », citer les sources) et leçon sur les erreurs dites
   avec assurance.
Fait aussi : bouton « Questions d’abord », leçon 8 « Ce qui marche vraiment », leçon 7 nuancée sur « étape par étape ».
Fait ensuite (2026-10-09, commit 36074ab) : quiz « Vrai ou inventé ? » (5 questions, leçon 8), « avant / après » dans les défis (vraies réponses aux deux prompts), niveau de langue (Expert / Grand public / Très simple) dans les ajouts du Coach, « Mon style rédactionnel » (outil + ajout), profil métier (accueil ; consignes de Nestor + bibliothèque), mode « je débute » (moins de détails, mots simples).
Ancienne liste : Ensuite : quiz « Vrai ou inventé ? », exercice « avant / après », curseur de langage clair (jusqu'au français simplifié), profil métier, « Mon style rédactionnel »,
nouvelles leçons (formules magiques, longs documents, mention de l'usage de l'IA), défis, mode « je débute »,
pseudonymiser en un clic dans le Coach.
Principe : budget d'interruption (au plus une intervention spontanée par séance, jamais pendant la frappe).
Hors cadre (touchent le chatbot officiel ou demandent un serveur) : voyant sur la zone de message, boutons sous
les réponses, vérification des réponses, mode atelier multi-postes, tableau de bord d'équipe.

## En attente d'une décision de Loic
- Livraison à La Suite : pas de PR tant que Loic ne le demande pas.

## Limites connues
- Traductions françaises saisies à la main dans translations.json : à verser dans Crowdin
  avant tout `yarn i18n:deploy`.
- Le relais du fork a été testé sur l'étage final de l'image, pas sur une construction complète.
