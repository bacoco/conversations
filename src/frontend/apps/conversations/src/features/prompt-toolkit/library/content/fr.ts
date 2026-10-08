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
  ],
};
