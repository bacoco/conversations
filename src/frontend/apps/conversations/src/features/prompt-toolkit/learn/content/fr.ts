// French course content.
import type { CourseContent, Flashcard, Lesson, QuizQuestion } from '../types';

// ---------------------------------------------------------------------------
// LESSONS
// ---------------------------------------------------------------------------

const lessons: Lesson[] = [
  // --- Leçon 1 ---
  {
    id: 'lesson-1',
    title: 'Une consigne, pas de la magie',
    icon: '\u2728',
    slides: [
      {
        title: "L'IA n'est pas un collègue qui devine",
        icon: '\uD83E\uDD14',
        content:
          "L'intelligence artificielle ne lit pas dans vos pensées. Elle ne connaît pas votre service, vos dossiers, ni vos habitudes de travail.\n\nElle fait EXACTEMENT ce que vous lui demandez par écrit. Ni plus, ni moins.",
        keyTakeaway:
          "L'IA est un outil puissant mais elle a besoin d'instructions claires pour être utile.",
      },
      {
        title: 'Une consigne = une demande écrite',
        icon: '\uD83D\uDCDD',
        content:
          'Quand vous écrivez à l\'IA, vous rédigez une "consigne" (aussi appelée "prompt" en anglais).\n\nImaginez que vous donnez un brief à un stagiaire très rapide mais qui ne connaît rien de votre service. Plus votre brief est clair, meilleur sera le résultat.',
        keyTakeaway:
          "Une consigne, c'est simplement une demande écrite. Pas besoin d'être expert.",
      },
      {
        title: 'La différence est énorme',
        icon: '\uD83D\uDCA1',
        content:
          'Voyez comment la même tâche donne des résultats complètement différents selon la consigne.',
        example: {
          bad: 'Fais un truc avec ce texte.',
          good: 'Résume ce texte en 5 lignes pour un mail à mon responsable. Garde uniquement les décisions et les délais.',
          note: "La deuxième consigne précise la tâche, le format, le destinataire et ce qu'il faut garder.",
        },
      },
    ],
  },

  // --- Leçon 2 ---
  {
    id: 'lesson-2',
    title: 'Flou dedans = flou dehors',
    icon: '\uD83C\uDF2B\uFE0F',
    slides: [
      {
        title: "La règle d'or",
        icon: '\u2696\uFE0F',
        content:
          'Si vous demandez quelque chose de vague, vous obtenez quelque chose de vague.\n\nL\'IA ne peut pas deviner ce que vous voulez vraiment. Elle va produire une réponse "probable" — c\'est-à-dire générique et souvent inutile.',
        keyTakeaway:
          "Vague en entrée = vague en sortie. C'est la première règle à retenir.",
      },
      {
        title: 'Démonstration',
        icon: '\uD83D\uDD0D',
        content: 'Comparez ces deux approches sur le même document :',
        example: {
          bad: 'Améliore ce texte.',
          good: 'Reformule ce texte juridique en langage simple pour un citoyen sans formation juridique. Utilise des phrases courtes et un ton bienveillant. 3 paragraphes maximum.',
          note: 'La consigne précise transforme un résultat générique en un résultat directement utilisable.',
        },
      },
      {
        title: 'Le test du "nouveau collègue"',
        icon: '\uD83E\uDDD1\u200D\uD83D\uDCBC',
        content:
          "Avant d'envoyer votre consigne, posez-vous cette question :\n\n\"Est-ce qu'un nouveau collègue qui arrive dans mon service comprendrait exactement ce que je veux ?\"\n\nSi la réponse est non, votre consigne n'est pas assez précise.",
        keyTakeaway:
          "Si un humain ne comprendrait pas votre demande, l'IA ne la comprendra pas non plus.",
      },
    ],
  },

  // --- Leçon 3 ---
  {
    id: 'lesson-3',
    title: "Les 5 briques d'une bonne consigne",
    icon: '\uD83E\uDDF1',
    slides: [
      {
        title: "Vue d'ensemble",
        icon: '\uD83D\uDDFA\uFE0F',
        content:
          "Une bonne consigne combine jusqu'à 5 éléments :\n\n1. **La tâche** — que voulez-vous ?\n2. **Le contexte** — pourquoi et dans quel cadre ?\n3. **Le format** — comment présenter le résultat ?\n4. **Le public** — pour qui ?\n5. **Les contraintes** — quelles limites ?\n\nPas besoin d'utiliser les 5 à chaque fois. Mais plus vous en ajoutez, meilleur sera le résultat.",
        keyTakeaway:
          'Tâche + Contexte + Format + Public + Contraintes = consigne efficace.',
      },
      {
        title: 'La tâche : que voulez-vous ?',
        icon: '\uD83C\uDFAF',
        content:
          'Commencez toujours par un verbe d\'action clair :\n\n- **Résume** ce document\n- **Compare** ces trois options\n- **Reformule** ce paragraphe\n- **Extrais** les décisions\n- **Rédige** un mail\n\nÉvitez les verbes vagues : "traite", "gère", "fais quelque chose avec".',
        example: {
          bad: 'Traite ce compte rendu.',
          good: 'Extrais les 5 décisions principales de ce compte rendu.',
        },
      },
      {
        title: 'Le contexte : pourquoi ?',
        icon: '\uD83D\uDCC1',
        content:
          'Expliquez la situation pour que l\'IA adapte sa réponse :\n\n- "Dans le cadre du projet ATLAS..."\n- "Pour la réunion de service de demain..."\n- "Suite à la demande du directeur..."\n\nLe contexte aide l\'IA à choisir le bon niveau de détail, le bon vocabulaire et la bonne structure.',
        keyTakeaway:
          "Le contexte permet à l'IA de produire une réponse adaptée à votre situation réelle.",
      },
      {
        title: 'Le format et le public',
        icon: '\uD83D\uDCCA',
        content:
          '**Le format** indique COMMENT présenter le résultat :\n- "Sous forme de tableau"\n- "En liste à puces"\n- "En mail structuré avec objet"\n- "En 3 paragraphes"\n\n**Le public** indique POUR QUI :\n- "Pour un directeur non-technique"\n- "Pour un citoyen"\n- "Pour l\'équipe projet"',
        example: {
          bad: 'Donne-moi les infos importantes.',
          good: 'Présente les informations clés sous forme de tableau à 3 colonnes : Décision, Responsable, Délai. Pour le directeur.',
        },
      },
      {
        title: 'Les contraintes',
        icon: '\uD83D\uDEE0\uFE0F',
        content:
          'Les contraintes définissent les limites :\n\n- **Longueur** : "en 5 lignes maximum", "200 mots"\n- **Ton** : "professionnel", "bienveillant", "formel"\n- **Interdictions** : "sans jargon technique", "sans citer d\'articles de loi"\n- **Langue** : "en français", "vocabulaire simple"\n\nLes contraintes évitent que l\'IA parte dans une direction non souhaitée.',
        keyTakeaway:
          "Les contraintes cadrent l'IA et évitent les résultats hors sujet.",
      },
    ],
  },

  // --- Leçon 4 ---
  {
    id: 'lesson-4',
    title: "Améliorer, c'est normal",
    icon: '\uD83D\uDD04',
    slides: [
      {
        title: "Le premier essai n'est jamais parfait",
        icon: '\uD83C\uDFAF',
        content:
          "Même les experts réécrivent leurs consignes. Ce n'est pas un échec, c'est le processus normal.\n\nL'objectif n'est pas d'avoir bon du premier coup.\nL'objectif est de savoir **comment améliorer**.",
        keyTakeaway:
          'Itérer est la compétence la plus importante. Ne cherchez pas la perfection du premier coup.',
      },
      {
        title: "La boucle d'amélioration",
        icon: '\uD83D\uDD04',
        content:
          "Le cycle est toujours le même :\n\n1. Écrire une consigne\n2. Lire le résultat\n3. Identifier ce qui ne va pas\n4. Modifier la consigne\n5. Relancer\n\nRépétez jusqu'à satisfaction. En général, 2-3 itérations suffisent.",
        keyTakeaway:
          "Écrire → Lire → Corriger → Relancer. C'est ça, bien utiliser l'IA.",
      },
      {
        title: 'Astuces de correction',
        icon: '\uD83D\uDCA1',
        content:
          'Quelques réflexes simples quand le résultat ne convient pas :\n\n- **Trop long ?** → Ajoutez "en X lignes maximum"\n- **Ton inadéquat ?** → Précisez le public et le registre\n- **Informations manquantes ?** → Ajoutez du contexte\n- **Mauvais format ?** → Demandez explicitement le format\n- **Hors sujet ?** → Réécrivez la tâche plus précisément',
      },
    ],
  },

  // --- Leçon 5 ---
  {
    id: 'lesson-5',
    title: 'Vérifier et adapter',
    icon: '\u2705',
    slides: [
      {
        title: "L'IA peut se tromper",
        icon: '\u26A0\uFE0F',
        content:
          "L'IA peut inventer des informations qui ont l'air vraies (on appelle ça des \"hallucinations\").\n\nElle ne vérifie pas ses sources. Elle ne connaît pas forcément les derniers textes de loi ou les procédures internes.\n\nC'est à VOUS de valider le contenu avant de l'utiliser.",
        keyTakeaway:
          "Ne faites jamais confiance aveuglément. Relisez toujours le résultat avant de l'utiliser.",
      },
      {
        title: 'Adapter selon le besoin',
        icon: '\uD83D\uDD27',
        content:
          'Chaque type de tâche demande des ajustements spécifiques :\n\n- **Résumé** → Précisez la longueur et les points clés à garder\n- **Mail** → Précisez le destinataire, le ton et la structure\n- **Tableau** → Précisez les colonnes et les critères\n- **Reformulation** → Précisez le public cible et le niveau de langue\n- **Analyse** → Précisez les axes et le format de sortie',
      },
      {
        title: 'Les 6 réflexes à retenir',
        icon: '\uD83C\uDFC6',
        content:
          '1. **Soyez précis** dans votre demande\n2. **Donnez du contexte** (pourquoi, pour qui, dans quel cadre)\n3. **Précisez le format** attendu (tableau, mail, liste...)\n4. **Pensez au destinataire** (adaptez le ton et le vocabulaire)\n5. **Relisez et améliorez** (itérez sur votre consigne)\n6. **Vérifiez toujours** le résultat avant utilisation',
        keyTakeaway:
          'Ces 6 réflexes suffisent pour obtenir des résultats utiles dans 90% des cas.',
      },
    ],
  },

  // --- Leçon 6 ---
  {
    id: 'lesson-6',
    title: "Donner des exemples à l'IA",
    icon: '\uD83D\uDCCB',
    slides: [
      {
        title: 'Pourquoi les exemples changent tout',
        icon: '\uD83C\uDFAF',
        content:
          "Montrer un exemple du résultat attendu est l'un des moyens les plus puissants pour guider l'IA.\n\nC'est comme montrer une photo du plat fini à un cuisinier plutôt que de juste dire \"fais quelque chose de bon\".",
        keyTakeaway:
          "Un exemple vaut mille mots. Montrez à l'IA à quoi doit ressembler le résultat.",
      },
      {
        title: 'La technique du "few-shot"',
        icon: '\uD83D\uDCA1',
        content:
          "En donnant 1 à 3 exemples d'entrée/sortie, l'IA comprend le PATRON à suivre.\n\nC'est la technique dite \"few-shot\" (quelques exemples). Vous n'avez pas besoin de connaître le terme — retenez juste : montrez un exemple, et l'IA fera pareil.",
        example: {
          bad: 'Classe ces mails par urgence.',
          good: 'Classe ces mails par urgence. Exemple :\n- "Serveur en panne" → URGENT\n- "Réunion reportée" → NORMAL\n- "Mise à jour logicielle" → FAIBLE\n\nMaintenant classe : "Fuite d\'eau au 3e étage"',
          note: "Avec les exemples, l'IA comprend exactement les catégories et le format attendu.",
        },
      },
      {
        title: "Donner un rôle à l'IA",
        icon: '\uD83C\uDFAD',
        content:
          'Vous pouvez demander à l\'IA d\'adopter un rôle spécifique :\n\n- "En tant qu\'expert juridique..."\n- "Tu es un rédacteur de presse spécialisé..."\n- "Agis comme un formateur bienveillant..."\n\nLe rôle oriente le vocabulaire, le niveau de détail et le style de la réponse.',
        keyTakeaway:
          "Assigner un rôle à l'IA, c'est comme choisir le bon interlocuteur : un médecin ne répond pas comme un comptable.",
      },
    ],
  },

  // --- Leçon 7 ---
  {
    id: 'lesson-7',
    title: 'Techniques avancées',
    icon: '\uD83D\uDE80',
    slides: [
      {
        title: 'Raisonner étape par étape',
        icon: '\uD83E\uDDE0',
        content:
          'Pour les problèmes complexes (calculs, analyses, comparaisons), demandez à l\'IA de **raisonner étape par étape**.\n\nAjoutez simplement : "Raisonne étape par étape avant de conclure" ou "Montre ton raisonnement".\n\nCela s\'appelle le "chain of thought" et aidait beaucoup les anciens modèles. Les modèles récents raisonnent souvent déjà seuls : l\'intérêt principal est désormais de **voir les étapes pour pouvoir les vérifier**.',
        example: {
          bad: 'Le budget est-il respecte ?',
          good: "Analyse ce budget étape par étape :\n1. Calcule le total des dépenses\n2. Compare au budget initial\n3. Identifie l'écart\n4. Propose des solutions",
          note: "En décomposant, l'IA fait moins d'erreurs de raisonnement.",
        },
      },
      {
        title: 'Décomposer un problème',
        icon: '\uD83E\uDDE9',
        content:
          "Si votre demande est trop complexe pour un seul prompt, **découpez-la en étapes** :\n\n1. D'abord, extraire les informations clés\n2. Ensuite, les organiser\n3. Puis, rédiger le document final\n\nChaque étape peut être un prompt séparé, ou vous pouvez tout mettre dans un seul prompt avec des étapes numérotées.",
        keyTakeaway:
          'Découper un problème complexe en sous-tâches simples est LA compétence qui fait la différence entre un débutant et un utilisateur avancé.',
      },
      {
        title: 'Demander du structuré (JSON, tableaux)',
        icon: '\uD83D\uDCCA',
        content:
          'L\'IA peut produire des formats structurés :\n\n- **Tableaux** : "Présente sous forme de tableau avec colonnes X, Y, Z"\n- **JSON** : "Retourne les données en JSON valide avec les champs..."\n- **Listes numérotées** : "Liste les 5 points en numérotant"\n- **Markdown** : "Utilise des titres et sous-titres"\n\nLes formats structurés sont plus faciles à réutiliser et à vérifier.',
        keyTakeaway:
          'Plus le format est précis, plus le résultat est exploitable directement.',
      },
    ],
  },
  {
    id: 'lesson-8',
    title: 'Ce qui marche vraiment',
    icon: '\uD83E\uDDEA',
    slides: [
      {
        title: 'Les formules magiques ne suffisent pas',
        icon: '\u2728',
        content:
          "Des études récentes ont testé les « astuces » qui circulent : **« Tu es un expert »**, promettre un pourboire, menacer l'IA, être très poli.\n\nRésultat : **aucun effet fiable sur l'exactitude** des réponses. Un rôle peut aider pour le **ton**, pas pour la justesse.\n\nCe qui compte vraiment, c'est l'**information** que vous donnez : la tâche, le contexte, le document de référence, le format.",
        example: {
          bad: 'Tu es le meilleur expert juridique du monde. Réponds parfaitement.',
          good: 'Explique à un agent d’accueil, en 10 lignes, ce que change le décret ci-dessous pour les demandes de carte grise.\n\n"""\n[coller le décret]\n"""',
          note: 'La seconde version ne flatte pas l’IA : elle lui donne ce dont elle a besoin.',
        },
      },
      {
        title: 'L’IA se trompe avec assurance',
        icon: '\u26A0\uFE0F',
        content:
          "Une IA peut **inventer** un article de loi, un chiffre ou une référence, avec un ton parfaitement sûr.\n\nLe guide de l'État le rappelle : elle peut citer des textes qui n'existent pas. Même quand elle cite une source, la citation n'est pas toujours exacte.\n\nVérifiez donc **toujours** les chiffres, les dates, les noms et les références avant de les utiliser.",
        keyTakeaway:
          'Une réponse sûre d’elle n’est pas une réponse vraie : les faits se vérifient.',
      },
      {
        title: 'Deux phrases qui protègent',
        icon: '\uD83D\uDEE1\uFE0F',
        content:
          "Ajoutez à vos prompts importants :\n\n- **« Si une information te manque ou si tu n'es pas sûr, dis-le plutôt que de deviner. »** L'IA a le droit de ne pas savoir.\n- **« Appuie-toi uniquement sur le document fourni et cite le passage utilisé. »** Vous pourrez vérifier.\n\nEt quand votre demande est floue, commencez par : **« Pose-moi les questions dont tu as besoin avant de répondre. »**",
        keyTakeaway:
          'Dans le Coach, les boutons « Rendre la version prudente » et « Questions d’abord » ajoutent ces phrases pour vous.',
      },
      {
        title: 'Un essai ne prouve rien',
        icon: '\uD83D\uDD01',
        content:
          "La même demande, formulée un peu autrement, peut donner une réponse très différente.\n\nSi une réponse vous déçoit, ne concluez pas que l'IA « ne sait pas faire » : **reformulez**, précisez le contexte ou donnez un exemple, puis comparez.\n\nC'est en comparant deux formulations qu'on apprend ce qui marche pour ses propres tâches.",
        keyTakeaway:
          'Itérer et comparer vaut mieux que chercher LA formule parfaite.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// QUIZ QUESTIONS
// ---------------------------------------------------------------------------

const quiz: QuizQuestion[] = [
  // --- Leçon 1 ---
  {
    id: 'q1',
    lessonId: 'lesson-1',
    type: 'mcq',
    question: "Qu'est-ce qu'une consigne IA (prompt) ?",
    options: [
      'Un programme informatique complexe à installer',
      "Une demande écrite adressée à l'IA pour obtenir un résultat",
      "Un algorithme d'apprentissage automatique",
    ],
    correctIndex: 1,
    explanation:
      "Une consigne (prompt) est simplement une demande écrite. Pas besoin de compétences techniques, il suffit d'expliquer clairement ce que l'on veut.",
  },
  {
    id: 'q2',
    lessonId: 'lesson-1',
    type: 'true-false',
    question:
      "L'IA comprend automatiquement le contexte de votre travail et de votre service.",
    correctAnswer: false,
    explanation:
      "L'IA ne connait rien de votre environnement de travail. Elle ne sait pas dans quel service vous travaillez, sur quel projet, ni pour qui. Il faut toujours lui fournir le contexte.",
  },
  {
    id: 'q3',
    lessonId: 'lesson-1',
    type: 'true-false',
    question:
      "On peut comparer l'IA a un stagiaire tres rapide qui ne connait rien de votre service.",
    correctAnswer: true,
    explanation:
      "C'est une bonne analogie ! L'IA est rapide et capable, mais elle a besoin d'un brief clair et détaillé pour produire un bon travail.",
  },

  // --- Leçon 2 ---
  {
    id: 'q4',
    lessonId: 'lesson-2',
    type: 'mcq',
    question: 'Quelle consigne donnera le meilleur résultat ?',
    options: [
      'Améliore ce texte.',
      'Fais un truc bien avec ça.',
      'Reformule ce texte en langage simple pour un citoyen, en 3 phrases courtes.',
    ],
    correctIndex: 2,
    explanation:
      'La troisième consigne précise la tâche (reformuler), le public (citoyen), le registre (simple) et le format (3 phrases courtes). Les deux premières sont trop vagues.',
  },
  {
    id: 'q5',
    lessonId: 'lesson-2',
    type: 'true-false',
    question: 'Plus une consigne est courte, meilleure elle est.',
    correctAnswer: false,
    explanation:
      "Une consigne courte n'est pas forcément meilleure. Ce qui compte, c'est la précision. Une consigne de 3 lignes bien structurée vaut mieux qu'une consigne d'un mot.",
  },
  {
    id: 'q6',
    lessonId: 'lesson-2',
    type: 'mcq',
    question:
      'Quel est le meilleur test pour savoir si votre consigne est assez claire ?',
    options: [
      "Vérifier qu'elle fait moins de 20 mots",
      'Se demander si un nouveau collègue comprendrait exactement ce que vous voulez',
      "Vérifier qu'elle contient des termes techniques",
    ],
    correctIndex: 1,
    explanation:
      'Le "test du nouveau collègue" est le meilleur réflexe : si un humain ne comprendrait pas votre demande, l\'IA ne la comprendra pas non plus.',
  },

  // --- Leçon 3 ---
  {
    id: 'q7',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: "Quelles sont les 5 briques d'une bonne consigne ?",
    options: [
      'Sujet, verbe, complement, adjectif, adverbe',
      'Tâche, contexte, format, public, contraintes',
      'Introduction, développement, conclusion, annexe, références',
    ],
    correctIndex: 1,
    explanation:
      'Les 5 briques sont : la Tâche (que faire), le Contexte (pourquoi), le Format (comment présenter), le Public (pour qui) et les Contraintes (quelles limites).',
  },
  {
    id: 'q8',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: '"Résume ce texte" — que manque-t-il à cette consigne ?',
    options: [
      'La tâche',
      'Le contexte, le format et le public',
      "Rien, c'est suffisant",
    ],
    correctIndex: 1,
    explanation:
      'La tâche est présente (résumer), mais il manque le contexte (pourquoi ?), le format (combien de lignes ? liste ou paragraphe ?) et le public (pour qui ?).',
  },
  {
    id: 'q9',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'Quel élément précise le "comment présenter le résultat" ?',
    options: ['La tâche', 'Le contexte', 'Le format'],
    correctIndex: 2,
    explanation:
      'Le format précise la forme du résultat : tableau, liste à puces, mail structuré, nombre de lignes, etc.',
  },
  {
    id: 'q10',
    lessonId: 'lesson-3',
    type: 'true-false',
    question:
      "Mentionner le public cible dans la consigne n'a aucun impact sur la réponse.",
    correctAnswer: false,
    explanation:
      'Le public cible change tout : vocabulaire, niveau de détail, ton. Un résumé pour un directeur et un résumé pour un technicien seront très différents.',
  },

  // --- Leçon 4 ---
  {
    id: 'q11',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: 'Après un premier résultat décevant, que faut-il faire ?',
    options: [
      'Abandonner et écrire soi-même',
      'Relancer exactement la même consigne en espérant mieux',
      'Relire le résultat, identifier ce qui manque, améliorer la consigne',
    ],
    correctIndex: 2,
    explanation:
      "La bonne approche est la boucle d'amélioration : lire le résultat, identifier le problème, corriger la consigne et relancer. C'est le processus normal, même pour les experts.",
  },
  {
    id: 'q12',
    lessonId: 'lesson-4',
    type: 'true-false',
    question:
      'Les experts en IA écrivent toujours la consigne parfaite du premier coup.',
    correctAnswer: false,
    explanation:
      "Même les experts itèrent sur leurs consignes. Le premier essai est rarement parfait. La compétence, c'est de savoir comment améliorer, pas d'avoir bon du premier coup.",
  },
  {
    id: 'q13',
    lessonId: 'lesson-4',
    type: 'mcq',
    question:
      "Le résultat de l'IA est trop long. Que modifiez-vous dans votre consigne ?",
    options: [
      'Le contexte',
      'La contrainte de longueur (ex: "en 5 lignes maximum")',
      'Le public cible',
    ],
    correctIndex: 1,
    explanation:
      'Pour contrôler la longueur, ajoutez une contrainte explicite : "en X lignes", "200 mots maximum", "un paragraphe". C\'est le réflexe le plus direct.',
  },

  // --- Leçon 5 ---
  {
    id: 'q14',
    lessonId: 'lesson-5',
    type: 'true-false',
    question:
      "On peut toujours faire confiance au contenu généré par l'IA sans le vérifier.",
    correctAnswer: false,
    explanation:
      "L'IA peut inventer des informations (hallucinations). Il faut TOUJOURS relire et vérifier le contenu avant de l'utiliser, surtout pour des documents officiels.",
  },
  {
    id: 'q15',
    lessonId: 'lesson-5',
    type: 'mcq',
    question: 'L\'IA "hallucine". Cela signifie qu\'elle...',
    options: [
      'Rêve pendant le traitement',
      'Invente des informations qui semblent vraies mais sont fausses',
      'Refuse de répondre à certaines questions',
    ],
    correctIndex: 1,
    explanation:
      "Les hallucinations sont des informations inventées par l'IA qui ont l'air crédibles. C'est pourquoi la vérification humaine est indispensable.",
  },
  {
    id: 'q16',
    lessonId: 'lesson-5',
    type: 'mcq',
    question: 'Quelle consigne est la mieux structurée ?',
    options: [
      'Fais-moi un tableau.',
      'Mets ça en forme.',
      'Compare ces 3 options en tableau avec les critères coût, délai et conformité. Note chaque critère de 1 à 5.',
    ],
    correctIndex: 2,
    explanation:
      'La troisième consigne précise la tâche (comparer), le format (tableau), les critères (coût, délai, conformité) et la méthode de notation (1 à 5). Les deux premières sont trop vagues.',
  },
  {
    id: 'q17',
    lessonId: 'lesson-5',
    type: 'true-false',
    question:
      "Donner un exemple du résultat attendu dans la consigne peut améliorer la réponse de l'IA.",
    correctAnswer: true,
    explanation:
      "Les exemples sont un excellent moyen de guider l'IA. Montrer à quoi devrait ressembler le résultat (même partiellement) améliore significativement la qualité de la réponse.",
  },

  // --- Leçon 6 ---
  {
    id: 'q18',
    lessonId: 'lesson-6',
    type: 'mcq',
    question: 'Pourquoi donner un exemple dans son prompt est-il efficace ?',
    options: [
      'Cela rend le prompt plus long, donc meilleur',
      "L'IA comprend le patron à suivre et reproduit le format",
      "L'IA n'a pas besoin d'exemples, c'est inutile",
    ],
    correctIndex: 1,
    explanation:
      "Un exemple montre à l'IA exactement ce que vous attendez : le format, le style, le niveau de détail. C'est la technique \"few-shot\", l'une des plus efficaces.",
  },
  {
    id: 'q19',
    lessonId: 'lesson-6',
    type: 'true-false',
    question:
      'Assigner un rôle à l\'IA (ex: "Tu es un expert juridique") change la qualité de la réponse.',
    correctAnswer: true,
    explanation:
      'Le rôle oriente le vocabulaire, le niveau de détail et le style. Un "expert juridique" répondra avec précision et références, un "vulgarisateur" répondra en langage simple.',
  },
  {
    id: 'q20',
    lessonId: 'lesson-6',
    type: 'mcq',
    question:
      "Combien d'exemples faut-il donner pour que l'IA comprenne le patron ?",
    options: [
      'Au moins 10 exemples',
      '1 à 3 exemples suffisent généralement',
      "Aucun, l'IA devine toujours",
    ],
    correctIndex: 1,
    explanation:
      'La technique "few-shot" fonctionne avec 1 à 3 exemples. Au-delà, les gains sont marginaux. Même un seul exemple bien choisi fait une grande différence.',
  },

  // --- Leçon 7 ---
  {
    id: 'q21',
    lessonId: 'lesson-7',
    type: 'mcq',
    question: 'Que signifie "raisonner étape par étape" pour l\'IA ?',
    options: [
      "L'IA travaille plus lentement",
      "L'IA montre son raisonnement intermédiaire avant de conclure, ce qui réduit les erreurs",
      "L'IA divise sa réponse en plusieurs messages",
    ],
    correctIndex: 1,
    explanation:
      'Le "chain of thought" demande à l\'IA d\'expliciter chaque étape de son raisonnement. Cela réduit considérablement les erreurs, surtout pour les calculs et les analyses complexes.',
  },
  {
    id: 'q22',
    lessonId: 'lesson-7',
    type: 'true-false',
    question:
      'Pour un problème complexe, il vaut mieux tout mettre dans un seul prompt vague plutôt que de décomposer en étapes.',
    correctAnswer: false,
    explanation:
      'Décomposer un problème complexe en sous-tâches claires est LA compétence avancée. Chaque étape peut être traitée séparément ou numérotée dans un seul prompt structuré.',
  },
  {
    id: 'q23',
    lessonId: 'lesson-7',
    type: 'mcq',
    question:
      'Quel format demander pour des données réutilisables dans un outil ?',
    options: [
      'Un paragraphe de texte libre',
      'Un format structuré comme JSON, tableau ou liste numérotée',
      'Un poeme',
    ],
    correctIndex: 1,
    explanation:
      'Les formats structurés (JSON, tableaux, listes) sont directement exploitables par des outils, des bases de données ou des tableurs. Le texte libre est plus difficile à réutiliser.',
  },
  {
    id: 'q24',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: "Ajouter « Tu es un expert » au début d'un prompt…",
    options: [
      'Rend toujours les réponses plus exactes',
      "N'a pas d'effet fiable sur l'exactitude ; cela peut seulement changer le ton",
      "Empêche l'IA de se tromper",
    ],
    correctIndex: 1,
    explanation:
      "Les études n'ont pas trouvé d'effet fiable sur l'exactitude. Ce qui améliore les réponses, c'est l'information donnée : tâche, contexte, document, format.",
  },
  {
    id: 'q25',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      "Si l'IA cite un article de loi avec assurance, on peut l'utiliser sans vérifier.",
    correctAnswer: false,
    explanation:
      'Une IA peut inventer des références avec un ton très sûr. Vérifiez toujours les textes, chiffres et dates.',
  },
  {
    id: 'q26',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: "Quelle phrase réduit le risque d'invention ?",
    options: [
      "« Réponds parfaitement, c'est très important »",
      "« Si tu n'es pas sûr, dis-le, et appuie-toi uniquement sur le document fourni »",
      "« Tu auras un pourboire si c'est juste »",
    ],
    correctIndex: 1,
    explanation:
      "Autoriser l'IA à dire qu'elle ne sait pas et la limiter au document fourni rend la réponse vérifiable.",
  },
];

// ---------------------------------------------------------------------------
// FLASHCARDS
// ---------------------------------------------------------------------------

// --- Flashcards ---

const flashcards: Flashcard[] = [
  // Leçon 1
  {
    id: 'fc1',
    lessonId: 'lesson-1',
    front: "Qu'est-ce qu'un prompt (consigne) ?",
    back: "Une demande écrite adressée à l'IA pour obtenir un résultat. Comme un brief donné à un stagiaire rapide.",
  },
  {
    id: 'fc2',
    lessonId: 'lesson-1',
    front: "L'IA comprend-elle votre contexte de travail ?",
    back: "Non. L'IA ne connaît rien de votre service, vos projets ni vos habitudes. Il faut TOUT lui expliquer.",
  },
  {
    id: 'fc3',
    lessonId: 'lesson-1',
    front: 'Pourquoi "Fais un truc avec ce texte" est un mauvais prompt ?',
    back: "Aucun objectif, aucun format, aucune indication. L'IA ne sait pas quoi faire et produit un résultat générique.",
  },
  {
    id: 'fc4',
    lessonId: 'lesson-1',
    front: "À quoi peut-on comparer l'IA ?",
    back: 'À un stagiaire très rapide mais qui ne connaît rien de votre service. Plus le brief est clair, meilleur est le résultat.',
  },
  // Leçon 2
  {
    id: 'fc5',
    lessonId: 'lesson-2',
    front: 'Que se passe-t-il avec un prompt vague ?',
    back: 'On obtient une réponse vague et générique. Flou en entrée = flou en sortie.',
  },
  {
    id: 'fc6',
    lessonId: 'lesson-2',
    front: 'Quel est le "test du nouveau collègue" ?',
    back: 'Avant d\'envoyer votre prompt, demandez-vous : "Un nouveau collègue comprendrait-il exactement ce que je veux ?" Si non, précisez.',
  },
  {
    id: 'fc7',
    lessonId: 'lesson-2',
    front: "Une consigne courte est-elle meilleure qu'une longue ?",
    back: "Pas forcément. Ce qui compte c'est la PRÉCISION, pas la longueur. 3 lignes précises > 1 mot vague.",
  },
  {
    id: 'fc8',
    lessonId: 'lesson-2',
    front: 'Citez un exemple de prompt vague vs précis',
    back: 'Vague : "Améliore ce texte." Précis : "Reformule ce texte en langage simple pour un citoyen, en 3 phrases courtes."',
  },
  // Leçon 3
  {
    id: 'fc9',
    lessonId: 'lesson-3',
    front: "Quelles sont les 5 briques d'une bonne consigne ?",
    back: '1. Tache (que faire)\n2. Contexte (pourquoi)\n3. Format (comment presenter)\n4. Public (pour qui)\n5. Contraintes (quelles limites)',
  },
  {
    id: 'fc10',
    lessonId: 'lesson-3',
    front: "Donnez 5 verbes d'action pour commencer un prompt",
    back: 'Résume, Compare, Reformule, Extrais, Rédige. Évitez les verbes vagues comme "traite" ou "gère".',
  },
  {
    id: 'fc11',
    lessonId: 'lesson-3',
    front: 'À quoi sert le "contexte" dans un prompt ?',
    back: 'Il permet à l\'IA d\'adapter sa réponse à votre situation réelle : "pour une réunion", "dans le cadre du projet X".',
  },
  {
    id: 'fc12',
    lessonId: 'lesson-3',
    front: 'Que sont les "contraintes" dans un prompt ?',
    back: 'Les limites imposées : longueur max, ton, mots interdits, style. Ex: "en 5 lignes max, sans jargon technique".',
  },
  {
    id: 'fc13',
    lessonId: 'lesson-3',
    front: 'Pourquoi préciser le public cible ?',
    back: 'Le public change tout : vocabulaire, niveau de détail, ton. Un résumé pour un directeur ≠ un résumé pour un technicien.',
  },
  // Leçon 4
  {
    id: 'fc14',
    lessonId: 'lesson-4',
    front: 'Le premier prompt est-il toujours le bon ?',
    back: "Non, presque jamais. Même les experts itèrent. L'important n'est pas d'avoir bon du premier coup mais de savoir COMMENT améliorer.",
  },
  {
    id: 'fc15',
    lessonId: 'lesson-4',
    front: "Quelle est la boucle d'amélioration ?",
    back: '1. Écrire une consigne\n2. Lire le résultat\n3. Identifier ce qui ne va pas\n4. Modifier la consigne\n5. Relancer',
  },
  {
    id: 'fc16',
    lessonId: 'lesson-4',
    front: 'Le résultat est trop long. Que faire ?',
    back: 'Ajoutez une contrainte de longueur : "en 5 lignes maximum", "200 mots", "un seul paragraphe".',
  },
  {
    id: 'fc17',
    lessonId: 'lesson-4',
    front: 'Le ton ne convient pas. Que faire ?',
    back: 'Précisez le public et le registre : "pour un directeur, ton formel" ou "pour un citoyen, ton bienveillant et simple".',
  },
  // Leçon 5
  {
    id: 'fc18',
    lessonId: 'lesson-5',
    front: "Qu'est-ce qu'une \"hallucination\" de l'IA ?",
    back: "L'IA invente des informations qui SEMBLENT vraies mais sont fausses. C'est pourquoi il faut toujours vérifier.",
  },
  {
    id: 'fc19',
    lessonId: 'lesson-5',
    front: "Peut-on faire confiance à l'IA sans vérifier ?",
    back: "JAMAIS. Toujours relire et vérifier avant d'utiliser, surtout pour les documents officiels.",
  },
  {
    id: 'fc20',
    lessonId: 'lesson-5',
    front: "Les 6 réflexes d'un bon prompt",
    back: '1. Être précis\n2. Donner du contexte\n3. Préciser le format\n4. Penser au destinataire\n5. Relire et améliorer\n6. Vérifier toujours',
  },
];

export const COURSE_FR: CourseContent = { lessons, quiz, flashcards };
