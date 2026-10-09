// French prompt library, written for public-service work.
import type { PromptLibrary } from '../types';

export const LIBRARY_FR: PromptLibrary = {
  categories: [
    { id: 'mail', icon: 'mail', title: 'Courriels et courriers' },
    { id: 'meetings', icon: 'groups', title: 'Réunions' },
    { id: 'summary', icon: 'summarize', title: 'Synthèse et analyse' },
    { id: 'writing', icon: 'edit_note', title: 'Rédaction administrative' },
    { id: 'hr', icon: 'badge', title: 'RH et management' },
    { id: 'procurement', icon: 'gavel', title: 'Juridique et marchés' },
    { id: 'communication', icon: 'campaign', title: 'Communication' },
    { id: 'data', icon: 'table_chart', title: 'Tableurs et données' },
    { id: 'public', icon: 'support_agent', title: 'Accueil des usagers' },
    { id: 'project', icon: 'account_tree', title: 'Projet et pilotage' },
  ],
  prompts: [
    // Courriels et courriers
    {
      id: 'mail-reply-citizen',
      category: 'mail',
      title: 'Répondre à un usager',
      description: 'Une réponse claire, courtoise et sans jargon.',
      prompt: `Tu es agent d'un service public. Rédige une réponse au courriel d'un usager ci-dessous.

Objectif : répondre à sa question sur [sujet] en lui indiquant [réponse ou démarche].
Ton : courtois, simple, sans jargon administratif.
Format : un courriel de 10 lignes maximum, avec une formule d'appel et une formule de politesse.
Contrainte : ne promets rien qui ne figure pas dans les éléments ci-dessus.

Courriel reçu :
"""
[coller le courriel]
"""`,
      keywords: [
        'usager',
        'répondre',
        'réponse',
        'courriel',
        'mail',
        'citoyen',
      ],
    },
    {
      id: 'mail-follow-up',
      category: 'mail',
      title: 'Relancer poliment',
      description:
        'Une relance ferme mais cordiale sur une demande restée sans réponse.',
      prompt: `Rédige un courriel de relance à [destinataire] au sujet de [demande], envoyée le [date] et restée sans réponse.

Rappelle l'enjeu en une phrase : [pourquoi c'est important].
Demande une réponse avant le [échéance].
Ton : cordial et ferme, sans reproche.
Format : 5 à 8 lignes, objet du courriel inclus.`,
      keywords: ['relance', 'relancer', 'sans réponse', 'rappel'],
    },
    {
      id: 'mail-decline',
      category: 'mail',
      title: 'Refuser avec tact',
      description:
        'Dire non clairement, en expliquant et en proposant une alternative.',
      prompt: `Rédige un courriel pour refuser la demande suivante : [demande].

Motif du refus : [motif].
Propose si possible une alternative : [alternative ou « aucune »].
Ton : respectueux et clair, le refus doit être compris dès la deuxième phrase.
Format : 8 à 10 lignes, objet inclus.`,
      keywords: ['refus', 'refuser', 'décliner', 'pas possible'],
    },
    {
      id: 'mail-official-letter',
      category: 'mail',
      title: 'Courrier officiel',
      description: 'Un courrier administratif structuré, prêt à signer.',
      prompt: `Rédige un courrier officiel de [service émetteur] à [destinataire].

Objet : [objet].
Points à exposer, dans cet ordre : [point 1], [point 2], [point 3].
Références à citer : [textes, dossiers ou « aucune »].
Ton : administratif, précis et courtois.
Format : objet, références, corps en paragraphes courts, formule de politesse adaptée au destinataire.`,
      keywords: ['courrier', 'lettre', 'officiel', 'signature', 'objet'],
    },
    {
      id: 'mail-shorten',
      category: 'mail',
      title: 'Raccourcir un courriel',
      description: 'Le même message, deux fois plus court.',
      prompt: `Raccourcis le courriel ci-dessous de moitié sans perdre d'information utile.

Garde : la demande principale, les dates et les chiffres.
Supprime : les répétitions et les formules inutiles.
Rends-moi le courriel raccourci, puis la liste de ce que tu as retiré.

"""
[coller le courriel]
"""`,
      keywords: ['raccourcir', 'trop long', 'plus court', 'condenser'],
    },

    // Réunions
    {
      id: 'meeting-agenda',
      category: 'meetings',
      title: 'Préparer un ordre du jour',
      description: 'Un ordre du jour minuté, avec un objectif par point.',
      prompt: `Prépare l'ordre du jour d'une réunion de [durée] avec [participants].

Objectif de la réunion : [objectif].
Sujets à traiter : [sujet 1], [sujet 2], [sujet 3].
Format : un tableau avec le point, son objectif (informer, décider ou échanger), la personne qui le porte et le temps alloué.
Termine par les décisions attendues en fin de réunion.`,
      keywords: ['ordre du jour', 'réunion', 'préparer', 'agenda'],
    },
    {
      id: 'meeting-minutes',
      category: 'meetings',
      title: 'Compte rendu de réunion',
      description: 'Des notes brutes transformées en compte rendu clair.',
      prompt: `Transforme mes notes de réunion ci-dessous en compte rendu.

Structure : participants, points abordés, décisions prises, actions (qui, quoi, pour quand), points en suspens.
Style : phrases courtes, neutres, sans interprétation.
Si une information manque (responsable, échéance), écris [à préciser] au lieu de l'inventer.

Notes :
"""
[coller les notes]
"""`,
      keywords: ['compte rendu', 'cr', 'notes', 'réunion', 'procès-verbal'],
    },
    {
      id: 'meeting-actions',
      category: 'meetings',
      title: 'Extraire les actions',
      description: 'Qui fait quoi, et pour quand.',
      prompt: `Extrais du texte ci-dessous toutes les actions à mener.

Format : un tableau avec l'action, le responsable, l'échéance et le statut.
Si le responsable ou l'échéance ne sont pas indiqués, écris [à préciser].
N'ajoute aucune action qui ne figure pas dans le texte.

"""
[coller le texte]
"""`,
      keywords: ['actions', 'qui fait quoi', 'tâches', 'suivi'],
    },
    {
      id: 'meeting-invitation',
      category: 'meetings',
      title: 'Invitation à une réunion',
      description: 'Une invitation qui donne envie de venir préparé.',
      prompt: `Rédige une invitation à une réunion.

Sujet : [sujet]. Date et lieu : [date, heure, lieu ou lien].
Participants : [participants].
Ce qu'il faut préparer avant : [documents ou réflexions].
Ton : professionnel et chaleureux.
Format : un courriel de 8 lignes maximum, avec l'objectif de la réunion en première phrase.`,
      keywords: ['invitation', 'inviter', 'convocation', 'réunion'],
    },
    {
      id: 'meeting-debrief',
      category: 'meetings',
      title: 'Message de synthèse après réunion',
      description: 'Trois lignes pour ceux qui n’étaient pas là.',
      prompt: `À partir du compte rendu ci-dessous, rédige un message court pour les personnes absentes.

Contenu : les 3 décisions principales et ce qui les concerne directement.
Format : 5 lignes maximum, sous forme de puces.

"""
[coller le compte rendu]
"""`,
      keywords: ['absents', 'débrief', 'résumé de réunion', 'synthèse'],
    },

    // Synthèse et analyse
    {
      id: 'summary-note',
      category: 'summary',
      title: 'Note de synthèse',
      description: 'L’essentiel d’un long document, pour un décideur.',
      prompt: `Rédige une note de synthèse du document ci-dessous pour [destinataire, par exemple un directeur].

Structure : contexte en 2 lignes, points clés (5 maximum), enjeux, recommandation.
Longueur : une page maximum.
Cite les chiffres et dates exacts du document ; n'ajoute aucune information extérieure.

"""
[coller le document ou le joindre]
"""`,
      keywords: ['synthèse', 'note', 'résumer', 'résumé', 'essentiel'],
    },
    {
      id: 'summary-compare',
      category: 'summary',
      title: 'Comparer deux documents',
      description: 'Ce qui change d’une version à l’autre.',
      prompt: `Compare les deux versions ci-dessous de [nature du document].

Liste : ce qui a été ajouté, supprimé et modifié.
Pour chaque modification importante, indique son impact possible pour [public concerné].
Format : un tableau à trois colonnes (changement, avant, après), puis 3 lignes de conclusion.

Version 1 :
"""
[coller la version 1]
"""

Version 2 :
"""
[coller la version 2]
"""`,
      keywords: ['comparer', 'différences', 'versions', 'changements'],
    },
    {
      id: 'summary-pros-cons',
      category: 'summary',
      title: 'Avantages et inconvénients',
      description: 'Une analyse équilibrée avant de décider.',
      prompt: `Analyse les avantages et les inconvénients de [option ou projet] pour [service ou public].

Prends en compte : le coût, les délais, les risques, l'impact pour les agents et pour les usagers.
Format : un tableau avantages / inconvénients, puis les 3 questions à trancher avant de décider.
Si une information manque pour juger, dis-le plutôt que de supposer.`,
      keywords: ['avantages', 'inconvénients', 'décider', 'analyse', 'options'],
    },
    {
      id: 'summary-questions',
      category: 'summary',
      title: 'Questions sur un document',
      description: 'Les questions à poser avant de valider.',
      prompt: `Lis le document ci-dessous comme le ferait un relecteur exigeant.

Liste les 10 questions qu'il faudrait poser à l'auteur avant de le valider : imprécisions, contradictions, chiffres non sourcés, points absents.
Classe-les de la plus importante à la moins importante.

"""
[coller le document]
"""`,
      keywords: ['relecture', 'questions', 'valider', 'vérifier', 'critique'],
    },
    {
      id: 'summary-plain',
      category: 'summary',
      title: 'Expliquer simplement',
      description: 'Un texte technique rendu compréhensible par tous.',
      prompt: `Explique le texte ci-dessous à [public, par exemple un usager sans connaissance juridique].

Utilise des phrases courtes et des mots courants ; définis chaque terme technique conservé.
Format : 5 points clés, puis un exemple concret.

"""
[coller le texte]
"""`,
      keywords: [
        'expliquer',
        'simplement',
        'vulgariser',
        'comprendre',
        'technique',
      ],
    },

    // Rédaction administrative
    {
      id: 'writing-plain-language',
      category: 'writing',
      title: 'Passer en langage clair',
      description: 'Le même texte, compréhensible du premier coup.',
      prompt: `Réécris le texte ci-dessous en langage clair.

Règles : phrases de 20 mots maximum, voix active, mots courants, une idée par phrase.
Garde exactement le sens et les obligations du texte d'origine.
Rends-moi le texte réécrit, puis les 3 changements les plus importants.

"""
[coller le texte]
"""`,
      keywords: ['langage clair', 'simplifier', 'reformuler', 'lisible'],
    },
    {
      id: 'writing-proofread',
      category: 'writing',
      title: 'Relire et corriger',
      description:
        'Orthographe, grammaire et clarté, avec les corrections visibles.',
      prompt: `Corrige le texte ci-dessous : orthographe, grammaire, ponctuation et tournures maladroites.

Ne change pas le fond ni le ton.
Rends-moi le texte corrigé, puis la liste des corrections sous la forme « avant → après ».

"""
[coller le texte]
"""`,
      keywords: ['corriger', 'relire', 'orthographe', 'fautes', 'grammaire'],
    },
    {
      id: 'writing-procedure',
      category: 'writing',
      title: 'Rédiger une procédure',
      description: 'Une procédure pas à pas, que n’importe qui peut suivre.',
      prompt: `Rédige une procédure pour [tâche] destinée à [agents concernés].

Structure : objectif, prérequis, étapes numérotées (une action par étape), points de vigilance, contact en cas de problème.
Style : impératif, phrases courtes.
Si une étape dépend d'un outil ou d'un service, écris son nom entre crochets pour que je le complète.`,
      keywords: ['procédure', 'mode opératoire', 'étapes', 'guide', 'tutoriel'],
    },
    {
      id: 'writing-faq',
      category: 'writing',
      title: 'Créer une FAQ',
      description:
        'Les questions que les gens se posent vraiment, avec leurs réponses.',
      prompt: `À partir du texte ci-dessous, rédige une FAQ de 8 questions pour [public].

Formule les questions comme les poserait ce public, avec ses mots.
Réponses : 3 lignes maximum, uniquement à partir du texte.
Si le texte ne permet pas de répondre à une question importante, signale-la à la fin.

"""
[coller le texte]
"""`,
      keywords: ['faq', 'questions fréquentes', 'foire aux questions'],
    },
    {
      id: 'writing-report-plan',
      category: 'writing',
      title: 'Plan de rapport',
      description: 'Une structure solide avant d’écrire.',
      prompt: `Propose le plan détaillé d'un rapport sur [sujet] destiné à [destinataire].

Objectif du rapport : [informer, convaincre, proposer une décision].
Format : parties et sous-parties titrées, avec pour chacune une phrase sur son contenu et les données à rassembler.
Longueur visée : [nombre] pages.`,
      keywords: ['rapport', 'plan', 'structure', 'rédiger'],
    },

    // RH et management
    {
      id: 'hr-job-offer',
      category: 'hr',
      title: 'Fiche de poste',
      description: 'Une fiche de poste précise et attractive.',
      prompt: `Rédige une fiche de poste pour [intitulé du poste] au sein de [service].

Missions principales : [missions].
Compétences attendues : [compétences].
Conditions : [catégorie, lieu, télétravail, date de prise de poste].
Format : présentation du service, missions, profil recherché, conditions, contact.
Ton : clair et engageant, sans jargon interne.`,
      keywords: ['fiche de poste', 'recrutement', 'offre', 'recruter', 'poste'],
    },
    {
      id: 'hr-interview-guide',
      category: 'hr',
      title: 'Grille d’entretien',
      description: 'Des questions pour évaluer les candidats équitablement.',
      prompt: `Prépare une grille d'entretien de recrutement pour [poste].

Compétences à évaluer : [compétences].
Pour chaque compétence : 2 questions ouvertes, ce qu'une bonne réponse contient, une échelle de 1 à 4.
Ajoute 2 questions sur la motivation.
Évite toute question discriminatoire ou sur la vie privée.`,
      keywords: ['entretien', 'candidat', 'recrutement', 'grille', 'questions'],
    },
    {
      id: 'hr-annual-review',
      category: 'hr',
      title: 'Préparer un entretien annuel',
      description: 'Un bilan factuel et des objectifs pour l’année.',
      prompt: `Aide-moi à préparer l'entretien professionnel annuel de [agent] (je suis son encadrant).

Réalisations de l'année : [réalisations].
Points de progrès : [points].
Propose : un bilan factuel et bienveillant, 3 objectifs mesurables pour l'année à venir et 2 pistes de formation.`,
      keywords: [
        'entretien annuel',
        'évaluation',
        'objectifs',
        'bilan',
        'agent',
      ],
    },
    {
      id: 'hr-onboarding',
      category: 'hr',
      title: 'Accueillir un nouvel arrivant',
      description: 'Un parcours d’intégration pour les premières semaines.',
      prompt: `Construis le parcours d'intégration de [nouvel arrivant] sur le poste [poste], pour ses 4 premières semaines.

Pour chaque semaine : objectifs, personnes à rencontrer, outils à prendre en main, premières missions.
Ajoute une liste de ce qu'il faut préparer avant son arrivée (accès, matériel, documents).`,
      keywords: ['intégration', 'nouvel arrivant', 'accueil', 'onboarding'],
    },
    {
      id: 'hr-difficult-message',
      category: 'hr',
      title: 'Annoncer une décision difficile',
      description: 'Un message humain, clair et sans ambiguïté.',
      prompt: `Aide-moi à annoncer à mon équipe la décision suivante : [décision].

Raisons : [raisons].
Conséquences pour l'équipe : [conséquences].
Rédige : le message principal (clair dès la première phrase), puis les 5 questions que l'équipe risque de poser, avec une réponse honnête pour chacune.
Ton : humain, direct, sans langue de bois.`,
      keywords: ['annoncer', 'décision', 'équipe', 'changement', 'difficile'],
    },

    // Juridique et marchés
    {
      id: 'procurement-needs',
      category: 'procurement',
      title: 'Définir un besoin d’achat',
      description: 'Un besoin clair avant de lancer une consultation.',
      prompt: `Aide-moi à formaliser le besoin d'achat suivant : [besoin].

Structure : contexte, objectifs, périmètre (ce qui est inclus et exclu), exigences fonctionnelles, contraintes (délais, budget estimé, sécurité), critères de réussite.
Signale les points à préciser avant de rédiger le cahier des charges.`,
      keywords: ['achat', 'besoin', 'marché', 'consultation', 'acheteur'],
    },
    {
      id: 'procurement-specs',
      category: 'procurement',
      title: 'Plan de cahier des charges',
      description: 'La structure d’un CCTP, à compléter.',
      prompt: `Propose le plan d'un cahier des clauses techniques particulières (CCTP) pour [objet du marché].

Pour chaque partie, indique en une phrase son contenu et les informations à rassembler.
Signale les clauses qui doivent être relues par le service juridique.
Ne rédige pas de clauses définitives : c'est une trame de travail.`,
      keywords: ['cahier des charges', 'cctp', 'marché public', 'clauses'],
    },
    {
      id: 'procurement-criteria',
      category: 'procurement',
      title: 'Critères d’analyse des offres',
      description: 'Des critères pondérés et justifiables.',
      prompt: `Propose des critères d'analyse des offres pour un marché de [objet].

Pour chaque critère : sa définition, sa pondération en pourcentage, et ce qui distingue une note faible d'une note élevée.
Les critères doivent être objectifs, liés à l'objet du marché et vérifiables dans les offres.`,
      keywords: ['critères', 'analyse des offres', 'notation', 'pondération'],
    },
    {
      id: 'legal-explain-text',
      category: 'procurement',
      title: 'Expliquer un texte réglementaire',
      description: 'Ce qu’un texte change concrètement pour le service.',
      prompt: `Explique le texte réglementaire ci-dessous à des agents non juristes.

Indique : ce qu'il prévoit, qui est concerné, ce qui change concrètement, à partir de quand.
Cite les articles concernés ; si un point est ambigu, signale-le au lieu de trancher.
Rappel : cette explication ne remplace pas l'avis du service juridique.

"""
[coller le texte]
"""`,
      keywords: [
        'texte',
        'décret',
        'loi',
        'arrêté',
        'réglementaire',
        'juridique',
      ],
    },
    {
      id: 'legal-checklist',
      category: 'procurement',
      title: 'Liste de vérification d’un dossier',
      description: 'Ne rien oublier avant d’envoyer.',
      prompt: `Établis une liste de vérification pour le dossier suivant : [nature du dossier].

Classe les points par étape (préparation, contenu, signatures, envoi).
Pour chaque point, indique pourquoi il compte et le risque s'il est oublié.`,
      keywords: ['vérification', 'checklist', 'dossier', 'oublier', 'contrôle'],
    },

    // Communication
    {
      id: 'com-news',
      category: 'communication',
      title: 'Article pour l’intranet',
      description: 'Une actualité courte qui donne envie de lire.',
      prompt: `Rédige un article pour l'intranet sur [sujet].

Informations à transmettre : [informations].
Public : [agents concernés].
Format : un titre accrocheur, un chapeau de 2 lignes, 3 paragraphes courts, une phrase d'appel à l'action.
Ton : informatif et vivant, sans superlatifs.`,
      keywords: ['intranet', 'article', 'actualité', 'news', 'publier'],
    },
    {
      id: 'com-social-post',
      category: 'communication',
      title: 'Publication pour les réseaux sociaux',
      description: 'Un message court, adapté au réseau visé.',
      prompt: `Rédige 3 propositions de publication pour [réseau social] sur [sujet].

Message clé : [message].
Public : [public].
Contraintes : [nombre] caractères maximum, un appel à l'action, pas de jargon administratif.
Pour chaque proposition, indique le ton choisi.`,
      keywords: [
        'réseaux sociaux',
        'post',
        'publication',
        'linkedin',
        'twitter',
      ],
    },
    {
      id: 'com-presentation',
      category: 'communication',
      title: 'Trame de présentation',
      description: 'Des diapositives qui racontent une histoire.',
      prompt: `Construis la trame d'une présentation de [durée] sur [sujet] pour [public].

Objectif : [ce que le public doit retenir ou décider].
Format : une liste de diapositives, avec pour chacune un titre qui dit l'idée principale, 3 puces maximum et ce que l'orateur dit à l'oral.
Commence par le message clé, termine par la décision ou l'action attendue.`,
      keywords: [
        'présentation',
        'diapositives',
        'slides',
        'powerpoint',
        'exposé',
      ],
    },
    {
      id: 'com-speech',
      category: 'communication',
      title: 'Discours ou mot d’accueil',
      description: 'Quelques minutes à l’oral, naturelles et justes.',
      prompt: `Rédige un discours de [durée] pour [occasion], prononcé par [orateur].

Messages à faire passer : [messages].
Personnes à remercier : [personnes].
Style : oral, phrases courtes, une anecdote ou un exemple concret, une conclusion qui rassemble.`,
      keywords: ['discours', 'allocution', 'mot', 'accueil', 'cérémonie'],
    },
    {
      id: 'com-newsletter',
      category: 'communication',
      title: 'Lettre d’information',
      description: 'Plusieurs nouvelles réunies en une lettre lisible.',
      prompt: `Rédige une lettre d'information pour [public] à partir des nouvelles suivantes : [nouvelles].

Format : un titre, un édito de 3 lignes, une rubrique par nouvelle (titre + 3 lignes + lien à compléter [lien]), les dates à retenir.
Ton : clair et chaleureux.`,
      keywords: ['lettre', 'newsletter', "lettre d'information", 'bulletin'],
    },

    // Tableurs et données
    {
      id: 'data-formula',
      category: 'data',
      title: 'Formule de tableur',
      description: 'La formule exacte, expliquée pas à pas.',
      prompt: `Je travaille dans [Excel / LibreOffice Calc / Grist].
Mes données : [décrire les colonnes, par exemple A = date, B = montant].
Je veux obtenir : [résultat attendu].

Donne-moi la formule, explique-la pas à pas, puis indique une erreur fréquente à éviter.`,
      keywords: ['formule', 'excel', 'tableur', 'calc', 'cellule', 'colonne'],
    },
    {
      id: 'data-analyse-table',
      category: 'data',
      title: 'Analyser un tableau',
      description:
        'Les tendances et les points d’attention d’un jeu de données.',
      prompt: `Analyse le tableau ci-dessous.

Indique : les tendances principales, les valeurs inhabituelles, les comparaisons utiles.
Format : 5 constats chiffrés, puis 3 questions que ces chiffres soulèvent.
Ne tire aucune conclusion que les données ne permettent pas.

"""
[coller le tableau]
"""`,
      keywords: ['tableau', 'données', 'chiffres', 'statistiques', 'analyser'],
    },
    {
      id: 'data-clean',
      category: 'data',
      title: 'Nettoyer des données',
      description:
        'Repérer les doublons, les formats et les valeurs manquantes.',
      prompt: `Voici un extrait de mes données : [coller un extrait sans données personnelles].

Repère les problèmes : doublons, formats incohérents (dates, nombres), valeurs manquantes, fautes de saisie.
Pour chacun, propose la méthode de correction dans [Excel / LibreOffice Calc / Grist].`,
      keywords: ['nettoyer', 'doublons', 'données', 'format', 'qualité'],
    },
    {
      id: 'data-chart',
      category: 'data',
      title: 'Choisir un graphique',
      description: 'Le bon graphique pour faire passer le bon message.',
      prompt: `Je veux montrer [message] à [public] à partir des données suivantes : [décrire les données].

Propose le type de graphique le plus adapté et explique pourquoi.
Donne : le titre du graphique, les axes, ce qu'il faut mettre en évidence, et une erreur de présentation à éviter.`,
      keywords: ['graphique', 'diagramme', 'courbe', 'visualiser', 'camembert'],
    },
    {
      id: 'data-indicators',
      category: 'data',
      title: 'Définir des indicateurs',
      description: 'Des indicateurs mesurables pour suivre une action.',
      prompt: `Propose 5 indicateurs pour suivre [projet ou politique publique].

Pour chaque indicateur : sa définition, son mode de calcul, sa source de données, sa fréquence de mise à jour et une cible réaliste.
Distingue les indicateurs d'activité et les indicateurs de résultat.`,
      keywords: ['indicateurs', 'kpi', 'suivi', 'tableau de bord', 'mesurer'],
    },

    // Accueil des usagers
    {
      id: 'public-phone-script',
      category: 'public',
      title: 'Script d’accueil téléphonique',
      description: 'Les bonnes réponses aux questions les plus fréquentes.',
      prompt: `Rédige un guide d'accueil téléphonique pour [service].

Inclus : la phrase d'accueil, les 5 questions les plus fréquentes sur [sujet] avec une réponse simple, la façon de réorienter vers le bon interlocuteur, la phrase de conclusion.
Ton : chaleureux et patient.`,
      keywords: ['téléphone', 'accueil', 'script', 'appel', 'standard'],
    },
    {
      id: 'public-complaint',
      category: 'public',
      title: 'Répondre à une réclamation',
      description: 'Reconnaître, expliquer, proposer une solution.',
      prompt: `Rédige une réponse à la réclamation ci-dessous.

Structure : reconnaître la gêne, expliquer la situation sans se justifier à l'excès, indiquer la solution ou la suite donnée [solution], donner un contact.
Ton : empathique et factuel.
Ne reconnais aucune faute qui n'est pas établie.

"""
[coller la réclamation]
"""`,
      keywords: [
        'réclamation',
        'plainte',
        'mécontent',
        'litige',
        'insatisfait',
      ],
    },
    {
      id: 'public-procedure-explain',
      category: 'public',
      title: 'Expliquer une démarche',
      description: 'Une démarche administrative expliquée étape par étape.',
      prompt: `Explique à un usager comment [démarche].

Format : la liste des pièces à fournir, les étapes numérotées, le délai habituel, à qui s'adresser en cas de difficulté.
Style : vouvoiement, phrases courtes, aucun sigle non expliqué.
Si une information dépend de sa situation, écris [à vérifier selon votre situation].`,
      keywords: ['démarche', 'pièces', 'dossier', 'usager', 'formalité'],
    },
    {
      id: 'public-accessible',
      category: 'public',
      title: 'Version facile à lire',
      description: 'Un texte accessible au plus grand nombre (FALC).',
      prompt: `Réécris le texte ci-dessous en version « facile à lire et à comprendre » (FALC).

Règles : une idée par phrase, phrases très courtes, mots simples, pas de chiffres romains ni d'abréviations, les mots difficiles expliqués.
Garde toutes les informations importantes.

"""
[coller le texte]
"""`,
      keywords: [
        'falc',
        'facile à lire',
        'accessible',
        'accessibilité',
        'handicap',
      ],
    },
    {
      id: 'public-translate',
      category: 'public',
      title: 'Traduire pour un usager',
      description: 'Une traduction fidèle et naturelle.',
      prompt: `Traduis le texte ci-dessous en [langue] pour un usager.

Garde le sens exact et le vouvoiement ; adapte les formules de politesse à la langue.
Si un terme administratif français n'a pas d'équivalent, garde-le et ajoute une courte explication entre parenthèses.

"""
[coller le texte]
"""`,
      keywords: ['traduire', 'traduction', 'anglais', 'langue', 'étranger'],
    },
    // Ajouts : courriels, synthèse, rédaction, réunions, RH, juridique,
    // communication, données, usagers, et le thème Projet et pilotage.
    {
      id: 'mail-acknowledge',
      category: 'mail',
      title: 'Accuser réception',
      description: 'Confirmer la réception et annoncer le délai de traitement.',
      prompt: `Rédige un accusé de réception pour la demande ci-dessous, reçue le [date].

Indique : que la demande est bien enregistrée, le délai de traitement prévu ([délai]), et la personne ou le service à contacter ([contact]).
Ton : courtois et rassurant.
Format : un courriel de 6 lignes maximum.
Contrainte : ne prends aucun engagement sur la réponse elle-même.

Demande reçue :
"""
[coller la demande]
"""`,
      keywords: [
        'accusé de réception',
        'réception',
        'délai',
        'demande',
        'confirmer',
      ],
    },
    {
      id: 'mail-missing-document',
      category: 'mail',
      title: 'Demander une pièce manquante',
      description: 'Réclamer un document sans braquer l’usager.',
      prompt: `Rédige un courriel à [destinataire] pour lui demander la pièce manquante suivante : [pièce].

Rappelle pourquoi elle est nécessaire ([raison]) et la date limite pour l'envoyer ([date]).
Indique comment la transmettre : [moyen d'envoi].
Ton : cordial et clair, sans reproche.
Format : 8 lignes maximum, la demande dès la première phrase.`,
      keywords: [
        'pièce manquante',
        'document',
        'dossier incomplet',
        'justificatif',
        'relance',
      ],
    },
    {
      id: 'mail-announce-change',
      category: 'mail',
      title: 'Annoncer un changement',
      description:
        'Informer d’une nouvelle organisation, d’un nouvel outil ou d’une nouvelle règle.',
      prompt: `Rédige un courriel pour annoncer le changement suivant à [destinataires] : [changement].

Explique : ce qui change, à partir de quand ([date]), pourquoi ([raison]), et ce que chacun doit faire ([action attendue]).
Ton : positif et factuel.
Format : un objet clair, puis 4 courts paragraphes ; termine par le contact pour les questions ([contact]).`,
      keywords: [
        'annoncer',
        'changement',
        'nouvelle organisation',
        'information',
        'équipe',
      ],
    },
    {
      id: 'mail-thank',
      category: 'mail',
      title: 'Remercier',
      description: 'Un remerciement sincère et précis.',
      prompt: `Rédige un message de remerciement à [destinataire] pour [ce qui a été fait].

Cite un apport concret ([apport]) et son effet ([effet]).
Ton : chaleureux et sincère, sans emphase.
Format : 5 lignes maximum.`,
      keywords: ['remercier', 'merci', 'remerciement', 'reconnaissance'],
    },
    {
      id: 'mail-meeting-request',
      category: 'mail',
      title: 'Demander un rendez-vous',
      description: 'Proposer un échange avec des créneaux.',
      prompt: `Rédige un courriel à [destinataire] pour lui proposer un rendez-vous au sujet de [sujet].

Indique l'objectif de l'échange ([objectif]), la durée prévue ([durée]) et trois créneaux possibles : [créneaux].
Ton : professionnel et courtois.
Format : 6 lignes maximum.`,
      keywords: ['rendez-vous', 'réunion', 'créneau', 'proposer', 'échange'],
    },
    {
      id: 'mail-apology',
      category: 'mail',
      title: 'Présenter des excuses',
      description: 'Reconnaître une erreur et dire ce qui est fait.',
      prompt: `Rédige un courriel d'excuses à [destinataire] pour [erreur ou retard].

Reconnais le problème sans te justifier longuement, explique ce qui a été fait pour le corriger ([correction]) et ce qui évitera qu'il se reproduise ([mesure]).
Ton : sobre et respectueux.
Format : 8 lignes maximum.
Contrainte : ne promets rien qui ne figure pas ci-dessus.`,
      keywords: ['excuses', 'erreur', 'retard', 'désolé', 'pardon'],
    },
    {
      id: 'mail-forward-context',
      category: 'mail',
      title: 'Transférer avec contexte',
      description:
        'Un message de transfert qui dit pourquoi et ce qui est attendu.',
      prompt: `Rédige un court message pour transférer l'échange ci-dessous à [destinataire].

En 3 phrases : de quoi il s'agit, pourquoi je le lui transfère, et ce que j'attends de lui ([action attendue], avant le [date]).

Échange :

"""
[coller le texte]
"""`,
      keywords: ['transférer', 'transfert', 'faire suivre', 'contexte'],
    },
    {
      id: 'summary-email-thread',
      category: 'summary',
      title: 'Résumer un fil de courriels',
      description: 'Où en est-on, qui attend quoi.',
      prompt: `Résume le fil de courriels ci-dessous.

Donne : le sujet en une phrase, les décisions prises, les questions encore ouvertes, et ce qui est attendu de moi ([mon rôle]).
Format : 4 rubriques à puces, 10 lignes maximum au total.
Contrainte : n'ajoute aucune information absente des courriels.

Fil :

"""
[coller le texte]
"""`,
      keywords: ['fil', 'courriels', 'échanges', 'résumer', 'où en est-on'],
    },
    {
      id: 'summary-report-decider',
      category: 'summary',
      title: 'Synthèse pour un décideur',
      description: 'L’essentiel d’un rapport, avec une recommandation.',
      prompt: `Rédige une synthèse du rapport ci-dessous pour [décideur].

Structure : le contexte en 2 phrases, les 3 constats principaux, les options possibles, puis une recommandation argumentée.
Format : une page maximum, phrases courtes.
Contrainte : chaque chiffre cité doit venir du rapport ; signale ce qui manque pour décider.

Rapport :

"""
[coller le texte]
"""`,
      keywords: [
        'synthèse',
        'décideur',
        'direction',
        'rapport',
        'recommandation',
      ],
    },
    {
      id: 'summary-consultation',
      category: 'summary',
      title: 'Synthétiser une consultation',
      description: 'Classer des avis ou des contributions par thème.',
      prompt: `Analyse les contributions ci-dessous issues de [consultation ou enquête].

Regroupe-les par thème ; pour chaque thème, donne le nombre de contributions, l'idée principale et une citation représentative.
Termine par les 3 attentes les plus fréquentes.
Contrainte : ne déforme pas les avis ; signale les contributions hors sujet.

Contributions :

"""
[coller le texte]
"""`,
      keywords: ['consultation', 'contributions', 'avis', 'enquête', 'thèmes'],
    },
    {
      id: 'summary-key-figures',
      category: 'summary',
      title: 'Extraire les chiffres clés',
      description: 'Les données importantes d’un document, avec leur source.',
      prompt: `Extrais du document ci-dessous les chiffres clés sur [sujet].

Pour chaque chiffre : la valeur, ce qu'elle mesure, la période et l'endroit du document où il figure.
Format : un tableau à 4 colonnes.
Contrainte : ne calcule rien et n'arrondis pas ; si un chiffre est ambigu, signale-le.

Document :

"""
[coller le texte]
"""`,
      keywords: [
        'chiffres',
        'données',
        'statistiques',
        'extraire',
        'indicateurs',
      ],
    },
    {
      id: 'summary-swot',
      category: 'summary',
      title: 'Analyse forces et faiblesses',
      description: 'Une grille forces, faiblesses, opportunités, menaces.',
      prompt: `Fais une analyse forces, faiblesses, opportunités et menaces de [projet ou situation].

Appuie-toi uniquement sur les éléments ci-dessous.
Format : un tableau en 4 cases, 3 points maximum par case, puis 2 recommandations.
Contrainte : distingue les faits des hypothèses.

Éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'swot',
        'forces',
        'faiblesses',
        'opportunités',
        'menaces',
        'analyse',
      ],
    },
    {
      id: 'summary-talking-points',
      category: 'summary',
      title: 'Éléments de langage',
      description: 'Des messages clés prêts à être dits.',
      prompt: `À partir du document ci-dessous, rédige des éléments de langage pour [interlocuteur ou situation].

Donne : 3 messages clés en une phrase chacun, les chiffres à retenir, et les réponses courtes à 3 questions probables.
Ton : clair, factuel, sans polémique.
Contrainte : rien qui ne soit dans le document.

Document :

"""
[coller le texte]
"""`,
      keywords: [
        'éléments de langage',
        'messages clés',
        'argumentaire',
        'questions',
      ],
    },
    {
      id: 'summary-versions',
      category: 'summary',
      title: 'Résumé en trois longueurs',
      description: 'Une version courte, moyenne et longue du même texte.',
      prompt: `Résume le texte ci-dessous en trois versions :
1. une phrase ;
2. 5 lignes ;
3. un paragraphe de 15 lignes.

Public : [public].
Contrainte : les trois versions disent la même chose ; aucune information ajoutée.

Texte :

"""
[coller le texte]
"""`,
      keywords: ['résumé', 'court', 'long', 'versions', 'synthèse'],
    },
    {
      id: 'writing-briefing-note',
      category: 'writing',
      title: 'Note à la hiérarchie',
      description: 'Une note qui expose, analyse et propose.',
      prompt: `Rédige une note à l'attention de [destinataire] sur [sujet].

Structure : objet, contexte, analyse, propositions, décision attendue.
Ton : administratif, précis, neutre.
Format : 1 à 2 pages, titres courts.
Contrainte : appuie-toi uniquement sur les éléments ci-dessous ; écris [à préciser] quand une information manque.

Éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'note',
        'hiérarchie',
        'direction',
        'note administrative',
        'proposition',
      ],
    },
    {
      id: 'writing-parliamentary',
      category: 'writing',
      title: 'Réponse à une question écrite',
      description: 'Un projet de réponse à partir d’éléments validés.',
      prompt: `Rédige un projet de réponse à la question ci-dessous, à partir des éléments validés fournis.

Structure : rappel de la question, état du droit ou de la situation, actions menées, perspectives.
Ton : institutionnel et factuel.
Contrainte : n'ajoute aucun chiffre ni engagement absent des éléments validés.

Question :
"""
[coller la question]
"""

Éléments validés :
"""
[coller les éléments]
"""`,
      keywords: [
        'question écrite',
        'parlementaire',
        'réponse',
        'élu',
        'institutionnel',
      ],
    },
    {
      id: 'writing-plain-letter',
      category: 'writing',
      title: 'Courrier en langage clair',
      description:
        'Réécrire un courrier administratif pour qu’il soit compris.',
      prompt: `Réécris le courrier ci-dessous en langage clair pour [destinataire].

Règles : la décision ou l'information principale dès le début, phrases courtes, un sujet par paragraphe, mots courants, sigles expliqués, ce que la personne doit faire mis en évidence.
Contrainte : garde toutes les informations juridiques et les dates.

Courrier :

"""
[coller le texte]
"""`,
      keywords: [
        'langage clair',
        'courrier',
        'simplifier',
        'compréhensible',
        'réécrire',
      ],
    },
    {
      id: 'writing-glossary',
      category: 'writing',
      title: 'Créer un glossaire',
      description: 'Les termes techniques d’un document, expliqués simplement.',
      prompt: `Crée un glossaire des termes techniques, sigles et acronymes du document ci-dessous.

Pour chaque terme : sa forme développée si c'est un sigle, puis une définition en une phrase simple.
Format : un tableau trié par ordre alphabétique.
Contrainte : si le document ne permet pas de définir un terme, écris « à vérifier ».

Document :

"""
[coller le texte]
"""`,
      keywords: [
        'glossaire',
        'sigles',
        'acronymes',
        'définitions',
        'vocabulaire',
      ],
    },
    {
      id: 'writing-speech',
      category: 'writing',
      title: 'Discours court',
      description: 'Une intervention de quelques minutes, à dire à voix haute.',
      prompt: `Rédige un discours de [durée] minutes pour [occasion], prononcé par [orateur] devant [public].

Structure : une accroche, 3 messages, une conclusion qui remercie ou appelle à agir.
Ton : [ton], phrases faites pour être dites.
Contrainte : environ 130 mots par minute ; aucun fait inventé, écris [à compléter] si besoin.`,
      keywords: [
        'discours',
        'allocution',
        'intervention',
        'prise de parole',
        'cérémonie',
      ],
    },
    {
      id: 'writing-questionnaire',
      category: 'writing',
      title: 'Créer un questionnaire',
      description: 'Recueillir l’avis des agents ou des usagers.',
      prompt: `Rédige un questionnaire pour recueillir l'avis de [public] sur [sujet].

Objectif : [ce qu'on veut savoir].
Format : 10 questions maximum, d'abord fermées puis 2 ouvertes ; pour les questions fermées, propose les réponses possibles.
Contrainte : questions neutres, qui n'orientent pas la réponse ; durée de remplissage sous 5 minutes.`,
      keywords: ['questionnaire', 'enquête', 'sondage', 'avis', 'satisfaction'],
    },
    {
      id: 'writing-tutorial',
      category: 'writing',
      title: 'Tutoriel pas à pas',
      description: 'Expliquer une manipulation à des collègues.',
      prompt: `Rédige un tutoriel pour expliquer à [public] comment [tâche].

Structure : le résultat attendu, les prérequis, puis les étapes numérotées (une action par étape), et les erreurs fréquentes avec leur solution.
Ton : simple et direct, à l'impératif.
Contrainte : appuie-toi sur les notes ci-dessous ; signale les étapes que tu ne peux pas décrire avec certitude.

Notes :

"""
[coller le texte]
"""`,
      keywords: ['tutoriel', 'pas à pas', 'mode opératoire', 'guide', 'étapes'],
    },
    {
      id: 'meetings-minutes-transcript',
      category: 'meetings',
      title: 'Compte rendu depuis une transcription',
      description: 'Transformer la transcription d’une visio en compte rendu.',
      prompt: `Rédige le compte rendu de la réunion à partir de la transcription ci-dessous.

Structure : participants, sujets abordés, décisions, points en suspens, actions (qui, quoi, pour quand).
Ton : neutre et synthétique.
Contrainte : ne prête à personne des propos qu'il n'a pas tenus ; si un passage est confus, signale-le.

Transcription :

"""
[coller le texte]
"""`,
      keywords: [
        'compte rendu',
        'transcription',
        'visio',
        'réunion',
        'procès-verbal',
      ],
    },
    {
      id: 'meetings-questions',
      category: 'meetings',
      title: 'Préparer ses questions',
      description: 'Les bonnes questions à poser en réunion.',
      prompt: `Je participe à une réunion avec [interlocuteur] sur [sujet]. Mon objectif : [objectif].

Prépare 8 questions classées par priorité, avec pour chacune ce qu'elle permet d'obtenir.
Ajoute 2 questions à garder en réserve si la discussion se tend.
Format : liste numérotée.`,
      keywords: [
        'questions',
        'préparer',
        'réunion',
        'entretien',
        'interlocuteur',
      ],
    },
    {
      id: 'meetings-workshop',
      category: 'meetings',
      title: 'Animer un atelier',
      description: 'Le déroulé minuté d’un atelier participatif.',
      prompt: `Propose le déroulé d'un atelier de [durée] avec [nombre] participants sur [sujet].

Objectif : [résultat attendu].
Format : un tableau minuté (séquence, durée, méthode d'animation, matériel), avec un brise-glace et une conclusion qui fixe les suites.
Contrainte : méthodes simples, réalisables sans outil numérique.`,
      keywords: [
        'atelier',
        'animation',
        'participatif',
        'déroulé',
        'séminaire',
      ],
    },
    {
      id: 'meetings-decisions-log',
      category: 'meetings',
      title: 'Relevé de décisions',
      description: 'Seulement ce qui a été décidé et qui s’en charge.',
      prompt: `À partir des notes ci-dessous, rédige un relevé de décisions.

Pour chaque décision : la décision en une phrase, le responsable, l'échéance.
Format : un tableau, sans compte rendu des échanges.
Contrainte : si un responsable ou une échéance manque, écris [à définir].

Notes :

"""
[coller le texte]
"""`,
      keywords: [
        'relevé de décisions',
        'décisions',
        'responsable',
        'échéance',
        'réunion',
      ],
    },
    {
      id: 'hr-feedback',
      category: 'hr',
      title: 'Formuler un retour constructif',
      description: 'Dire ce qui va et ce qui doit progresser, avec tact.',
      prompt: `Aide-moi à formuler un retour à [collaborateur] sur [situation ou travail].

Points forts observés : [points forts].
Point à améliorer : [point à améliorer].
Structure : un fait précis, son effet, une proposition concrète pour la suite.
Ton : bienveillant et direct.
Format : un message de 8 lignes maximum, ou des notes pour un échange oral si je le précise.`,
      keywords: [
        'retour',
        'feedback',
        'manager',
        'collaborateur',
        'amélioration',
      ],
    },
    {
      id: 'hr-smart-objectives',
      category: 'hr',
      title: 'Fixer des objectifs SMART',
      description: 'Des objectifs précis, mesurables et datés.',
      prompt: `Transforme les priorités ci-dessous en 3 à 5 objectifs SMART pour [personne ou équipe] sur [période].

Pour chaque objectif : l'objectif en une phrase, l'indicateur de réussite, l'échéance, les moyens nécessaires.
Format : un tableau.
Contrainte : objectifs atteignables avec les moyens indiqués ; signale ceux qui me semblent trop ambitieux.

Priorités :

"""
[coller le texte]
"""`,
      keywords: [
        'objectifs',
        'smart',
        'entretien annuel',
        'indicateurs',
        'priorités',
      ],
    },
    {
      id: 'hr-handover',
      category: 'hr',
      title: 'Préparer une passation',
      description: 'Tout transmettre avant une absence ou un départ.',
      prompt: `Aide-moi à préparer la passation de mes dossiers à [remplaçant] avant [absence ou départ] le [date].

Pour chaque dossier ci-dessous : où il en est, la prochaine étape, l'échéance, les contacts utiles et les points de vigilance.
Format : un tableau, puis la liste des accès et documents à transmettre.

Mes dossiers :

"""
[coller le texte]
"""`,
      keywords: [
        'passation',
        'absence',
        'départ',
        'dossiers',
        'remplaçant',
        'transmission',
      ],
    },
    {
      id: 'procurement-compare-bids',
      category: 'procurement',
      title: 'Comparer des offres',
      description: 'Un tableau d’analyse selon les critères annoncés.',
      prompt: `Compare les offres ci-dessous selon les critères annoncés : [critères et pondérations].

Pour chaque offre : ce qu'elle propose sur chaque critère, ses points forts et ses points faibles.
Format : un tableau comparatif, puis une synthèse de 5 lignes.
Contrainte : appuie-toi uniquement sur le contenu des offres ; ne donne pas de note finale, la décision revient à l'acheteur.

Offres :

"""
[coller le texte]
"""`,
      keywords: ['offres', 'comparer', 'marché public', 'analyse', 'critères'],
    },
    {
      id: 'procurement-risky-clauses',
      category: 'procurement',
      title: 'Repérer les clauses à risque',
      description: 'Les points d’un contrat qui méritent attention.',
      prompt: `Relis le contrat ou la convention ci-dessous du point de vue de [mon organisation].

Repère les clauses à risque (engagements, pénalités, durée, résiliation, responsabilités, données) et explique pour chacune le risque en une phrase.
Format : un tableau clause, risque, question à poser.
Contrainte : ce n'est pas un avis juridique ; signale ce qui doit être vérifié par un juriste.

Contrat :

"""
[coller le texte]
"""`,
      keywords: ['contrat', 'convention', 'clauses', 'risques', 'juridique'],
    },
    {
      id: 'procurement-decree-explained',
      category: 'procurement',
      title: 'Vulgariser un texte',
      description: 'Ce qui change pour les agents, en langage simple.',
      prompt: `Explique le texte ci-dessous à des agents non juristes de [service].

Structure : ce qui change, ce qui ne change pas, ce qui est attendu d'eux, à partir de quand.
Ton : simple et précis.
Format : une page maximum, avec les références des articles concernés.
Contrainte : ne complète pas le texte ; signale les points d'interprétation.

Texte :

"""
[coller le texte]
"""`,
      keywords: [
        'décret',
        'arrêté',
        'circulaire',
        'vulgariser',
        'réglementation',
        'loi',
      ],
    },
    {
      id: 'communication-press-release',
      category: 'communication',
      title: 'Communiqué de presse',
      description:
        'Un communiqué factuel à partir d’un rapport ou d’un événement.',
      prompt: `Rédige un communiqué de presse sur [sujet], à partir des éléments ci-dessous.

Structure : un titre informatif, un chapeau qui répond à qui, quoi, quand, où, pourquoi, 3 paragraphes, une citation de [porte-parole] à valider, le contact presse.
Ton : institutionnel et factuel.
Format : une page maximum.

Éléments :

"""
[coller le texte]
"""`,
      keywords: ['communiqué', 'presse', 'médias', 'annonce', 'journalistes'],
    },
    {
      id: 'communication-multichannel',
      category: 'communication',
      title: 'Décliner un message',
      description:
        'Un même message pour l’intranet, la messagerie et les réseaux.',
      prompt: `Décline le message ci-dessous en trois versions :
1. un article d'intranet (150 mots) ;
2. un message pour la messagerie instantanée (300 caractères) ;
3. une publication pour les réseaux sociaux (280 caractères, sans jargon).

Public : [public].
Contrainte : mêmes informations dans les trois versions.

Message :

"""
[coller le texte]
"""`,
      keywords: [
        'décliner',
        'intranet',
        'réseaux sociaux',
        'messagerie',
        'tchap',
        'canaux',
      ],
    },
    {
      id: 'data-pivot',
      category: 'data',
      title: 'Construire un tableau croisé',
      description: 'Les étapes pour résumer un tableau par catégorie.',
      prompt: `J'ai un tableau avec les colonnes suivantes : [colonnes]. Je veux obtenir [résultat attendu, ex. le total par service et par mois].

Explique pas à pas comment construire le tableau croisé dynamique dans [tableur], puis comment le présenter clairement.
Ajoute les erreurs fréquentes à éviter.`,
      keywords: [
        'tableau croisé dynamique',
        'tcd',
        'tableur',
        'excel',
        'calc',
        'synthèse',
      ],
    },
    {
      id: 'data-budget-gaps',
      category: 'data',
      title: 'Analyser des écarts budgétaires',
      description: 'Prévu, réalisé et causes probables.',
      prompt: `Analyse le tableau budgétaire ci-dessous (colonnes prévu et réalisé).

Repère les lignes dont l'écart dépasse [seuil] %, calcule l'écart en valeur et en pourcentage, et propose des causes probables à vérifier.
Format : un tableau trié par écart décroissant, puis 3 points d'attention.
Contrainte : présente les causes comme des hypothèses.

Tableau :

"""
[coller le texte]
"""`,
      keywords: [
        'budget',
        'écarts',
        'prévu',
        'réalisé',
        'exécution',
        'finances',
      ],
    },
    {
      id: 'public-documents-list',
      category: 'public',
      title: 'Liste des pièces à fournir',
      description: 'Une liste claire pour constituer un dossier.',
      prompt: `Rédige, pour un usager, la liste des pièces à fournir pour [démarche], à partir des éléments ci-dessous.

Pour chaque pièce : son nom, une précision utile (original, copie, moins de 3 mois…), et qui est concerné.
Format : une liste à cocher, puis l'adresse ou le lien de dépôt : [adresse ou lien].
Contrainte : n'ajoute aucune pièce absente des éléments.

Éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'pièces à fournir',
        'dossier',
        'justificatifs',
        'démarche',
        'usager',
      ],
    },
    {
      id: 'public-refusal',
      category: 'public',
      title: 'Expliquer un refus',
      description: 'Annoncer une décision défavorable avec respect.',
      prompt: `Rédige un courrier à [usager] pour lui annoncer que sa demande de [objet] est refusée.

Motif : [motif].
Indique les voies de recours ([recours et délai]) et, s'il en existe, une solution alternative ([alternative]).
Ton : respectueux, clair, sans jargon.
Contrainte : le motif doit être exact et compréhensible ; aucune formule qui culpabilise.`,
      keywords: [
        'refus',
        'décision défavorable',
        'recours',
        'usager',
        'courrier',
      ],
    },
    {
      id: 'public-faq-users',
      category: 'public',
      title: 'FAQ pour les usagers',
      description: 'Les questions que posent vraiment les usagers.',
      prompt: `À partir des questions d'usagers ci-dessous, rédige une FAQ sur [démarche ou service].

Regroupe les questions semblables, formule-les avec les mots des usagers, et réponds en 3 lignes maximum chacune.
Format : 8 à 10 questions, classées par fréquence.
Contrainte : réponds uniquement à partir des éléments fournis ; signale les questions sans réponse.

Questions et éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'faq',
        'questions fréquentes',
        'usagers',
        'foire aux questions',
      ],
    },
    {
      id: 'project-brief',
      category: 'project',
      title: 'Note de cadrage',
      description: 'Poser les bases d’un projet avant de le lancer.',
      prompt: `Rédige la note de cadrage du projet [nom du projet].

Structure : contexte et enjeux, objectifs mesurables, périmètre (inclus et exclu), parties prenantes, calendrier, budget, risques principaux, gouvernance.
Format : 2 pages maximum.
Contrainte : appuie-toi sur les éléments ci-dessous ; écris [à préciser] pour ce qui manque.

Éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'note de cadrage',
        'projet',
        'cadrage',
        'lancement',
        'périmètre',
      ],
    },
    {
      id: 'project-status',
      category: 'project',
      title: 'Point d’avancement',
      description: 'Où en est le projet, en une page.',
      prompt: `Rédige le point d'avancement du projet [nom] pour [destinataires], à partir des éléments ci-dessous.

Structure : état général (en avance, dans les temps, en retard), réalisations depuis le dernier point, prochaines étapes, risques et besoins d'arbitrage.
Format : une page, avec un indicateur de couleur pour chaque chantier.
Contrainte : factuel ; ne masque pas les retards.

Éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'point d’avancement',
        'avancement',
        'reporting',
        'comité',
        'état du projet',
      ],
    },
    {
      id: 'project-risks',
      category: 'project',
      title: 'Registre des risques',
      description: 'Identifier, évaluer et traiter les risques.',
      prompt: `Établis le registre des risques du projet [nom], à partir de la description ci-dessous.

Pour chaque risque : description, probabilité (faible, moyenne, forte), impact, mesure d'atténuation, responsable.
Format : un tableau trié par criticité.
Contrainte : 8 à 12 risques réalistes, propres à ce projet.

Description :

"""
[coller le texte]
"""`,
      keywords: [
        'risques',
        'registre des risques',
        'criticité',
        'atténuation',
        'projet',
      ],
    },
    {
      id: 'project-raci',
      category: 'project',
      title: 'Qui fait quoi (RACI)',
      description: 'Clarifier les rôles de chacun.',
      prompt: `Établis une matrice RACI pour le projet [nom].

Acteurs : [acteurs].
Activités : [activités principales].
Pour chaque activité : qui réalise, qui décide, qui est consulté, qui est informé.
Format : un tableau, puis les zones de flou à clarifier.`,
      keywords: [
        'raci',
        'rôles',
        'responsabilités',
        'qui fait quoi',
        'gouvernance',
      ],
    },
    {
      id: 'project-schedule',
      category: 'project',
      title: 'Rétroplanning',
      description: 'Partir de l’échéance pour fixer les étapes.',
      prompt: `Construis le rétroplanning de [projet ou livrable] avec une échéance au [date].

Étapes connues : [étapes].
Pour chaque étape : durée estimée, date de début, date de fin, dépendances, responsable.
Format : un tableau du plus proche au plus lointain, puis les étapes critiques.
Contrainte : signale si l'échéance paraît irréaliste.`,
      keywords: [
        'rétroplanning',
        'planning',
        'calendrier',
        'échéance',
        'jalons',
      ],
    },
    {
      id: 'project-lessons',
      category: 'project',
      title: 'Retour d’expérience',
      description: 'Tirer les leçons d’un projet ou d’une crise.',
      prompt: `Rédige le retour d'expérience de [projet ou événement], à partir des éléments ci-dessous.

Structure : rappel des faits, ce qui a bien fonctionné, ce qui a moins bien fonctionné, causes, recommandations concrètes avec un responsable.
Ton : constructif, sans désigner de coupable.
Format : 2 pages maximum.

Éléments :

"""
[coller le texte]
"""`,
      keywords: ['retour d’expérience', 'retex', 'bilan', 'leçons', 'crise'],
    },
    {
      id: 'project-indicators',
      category: 'project',
      title: 'Indicateurs de suivi',
      description: 'Mesurer l’avancement et les résultats.',
      prompt: `Propose des indicateurs pour suivre le projet [nom], dont les objectifs sont : [objectifs].

Pour chaque indicateur : ce qu'il mesure, la formule de calcul, la source des données, la fréquence, la cible.
Format : un tableau de 6 indicateurs maximum, mêlant avancement et résultats.
Contrainte : indicateurs mesurables avec des données réellement disponibles.`,
      keywords: ['indicateurs', 'tableau de bord', 'suivi', 'pilotage', 'kpi'],
    },
    {
      id: 'project-steering',
      category: 'project',
      title: 'Préparer un comité de pilotage',
      description: 'Le support et les décisions à obtenir.',
      prompt: `Prépare le comité de pilotage du projet [nom] du [date].

Propose : l'ordre du jour minuté, le contenu de 6 diapositives (avancement, budget, risques, décisions attendues), et la liste des décisions à faire valider.
Contrainte : appuie-toi sur les éléments ci-dessous ; mets en évidence les arbitrages nécessaires.

Éléments :

"""
[coller le texte]
"""`,
      keywords: [
        'comité de pilotage',
        'copil',
        'gouvernance',
        'arbitrage',
        'présentation',
      ],
    },
  ],
};
