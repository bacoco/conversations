// French course content.
import type { CourseContent, Flashcard, Lesson, QuizQuestion } from '../types';

// ---------------------------------------------------------------------------
// LESSONS
// ---------------------------------------------------------------------------
// Each lesson opens on a problem (which request gets the better answer?),
// then teaches in short screens (50 words at most), with a worked example.

const lessons: Lesson[] = [
  // --- Leçon 1 ---
  {
    id: 'lesson-1',
    title: "Comprendre ce que l'IA attend de vous",
    icon: '✨',
    skills: ['task'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          "Votre responsable veut un point sur la réunion d'hier. Vous avez le compte rendu. Laquelle de ces deux demandes donnera la réponse la plus utile ?",
        choices: [
          {
            prompt: 'Fais un truc avec ce compte rendu.',
            answer:
              'Je peux résumer ce texte, le traduire, le reformuler ou en extraire des mots-clés. Que souhaitez-vous ?',
          },
          {
            prompt:
              'Résume ce compte rendu en 5 lignes pour un mail à mon responsable. Garde seulement les décisions et les délais.',
            answer:
              'Décisions de la réunion :\n- Projet validé, démarrage le [date]\n- Budget : arbitrage d’ici vendredi\n- Point d’étape le [date]',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle dit quoi faire', isRight: true },
          { label: 'Elle dit pour qui', isRight: true },
          { label: 'Elle fixe la longueur', isRight: true },
          { label: 'Elle est plus polie', isRight: false },
        ],
        keyTakeaway: "L'IA fait ce que vous écrivez. Ni plus, ni moins.",
      },
      {
        title: "L'IA n'est pas un collègue qui devine",
        icon: '🧑‍💼',
        content:
          "L'IA ne connaît ni votre service, ni vos dossiers, ni vos habitudes. Elle répond à ce qui est écrit, rien d'autre.\n\nImaginez un stagiaire très rapide, arrivé ce matin : plus votre demande est claire, meilleur est son travail.",
        keyTakeaway:
          "Écrivez comme pour quelqu'un qui ne sait rien de votre travail.",
      },
      {
        title: 'Commencer par un verbe d’action',
        icon: '🎯',
        skill: 'task',
        content:
          'Une demande à l’IA (on dit aussi « prompt ») est un simple texte, en phrases normales. Commencez par ce que vous voulez :\n\n**Résume**, **rédige**, **compare**, **reformule**, **extrais**.\n\nÉvitez « traite », « gère », « fais quelque chose ».',
        example: {
          bad: 'Traite ce compte rendu.',
          good: 'Extrais les 5 décisions de ce compte rendu.',
        },
        keyTakeaway: 'Un verbe d’action clair dit à l’IA quoi faire.',
      },
    ],
  },

  // --- Leçon 2 ---
  {
    id: 'lesson-2',
    title: 'Éviter les réponses vagues',
    icon: '🌫️',
    skills: ['task'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'Vous devez rendre un texte juridique compréhensible par un usager. Laquelle de ces deux demandes donnera le meilleur résultat ?',
        choices: [
          {
            prompt: 'Améliore ce texte.',
            answer:
              'Voici une version améliorée : [le même texte, quelques mots changés, un ton plus soutenu encore].',
          },
          {
            prompt:
              'Reformule ce texte en langage simple pour un usager sans formation juridique. Phrases courtes, 3 paragraphes maximum.',
            answer:
              'Ce qui change pour vous : à partir du [date], vous pouvez faire votre demande en ligne. Vous recevrez une réponse sous [délai]…',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle dit pour qui', isRight: true },
          { label: 'Elle précise le style', isRight: true },
          { label: 'Elle fixe une longueur', isRight: true },
          { label: 'Elle est plus longue', isRight: false },
        ],
        keyTakeaway: 'Vague en entrée, vague en sortie.',
      },
      {
        title: 'Flou dedans, flou dehors',
        icon: '⚖️',
        content:
          "Une demande vague donne une réponse « probable » : générique, passe-partout, souvent inutile.\n\nL'IA ne demande pas de précisions d'elle-même : elle comble les trous au hasard.",
        keyTakeaway: 'Ce que vous ne dites pas, l’IA l’invente.',
      },
      {
        title: 'Le test du nouveau collègue',
        icon: '🔍',
        skill: 'task',
        content:
          'Avant d’envoyer, relisez votre demande et demandez-vous :\n\n« Un collègue arrivé ce matin comprendrait-il exactement ce que je veux ? »\n\nSi non, ajoutez ce qui lui manquerait.',
        keyTakeaway: 'Si un humain ne comprend pas, l’IA non plus.',
      },
      {
        title: 'Courte ou longue ?',
        icon: '📏',
        content:
          'Une demande courte n’est pas meilleure en soi. Ce qui compte, c’est qu’elle soit **précise**.\n\nTrois lignes claires valent mieux qu’un mot vague.',
        example: {
          bad: 'Fais un tableau.',
          good: 'Compare ces 3 offres dans un tableau : prix, délai, garantie.',
        },
      },
    ],
  },

  // --- Leçon 3 ---
  {
    id: 'lesson-3',
    title: 'Écrire une demande complète',
    icon: '🧱',
    skills: ['task', 'context', 'audience', 'format', 'constraints'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'Votre directrice veut connaître un rapport de 20 pages avant la réunion de lundi. Laquelle de ces deux demandes donnera la réponse la plus utile ?',
        choices: [
          {
            prompt: 'Résume ce rapport.',
            answer:
              'Ce rapport traite de plusieurs sujets. Il présente d’abord le contexte, puis des constats, et enfin des recommandations…',
          },
          {
            prompt:
              'Pour la réunion de direction de lundi, résume le rapport ci-dessous pour ma directrice, qui a deux minutes : 5 puces, les décisions à prendre d’abord, sans jargon.',
            answer:
              'À décider lundi :\n• Valider le calendrier (fin mars)\n• Choisir entre les options A et B\n• …',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle donne le contexte', isRight: true },
          { label: 'Elle dit pour qui', isRight: true },
          { label: 'Elle dit la forme', isRight: true },
          { label: 'Elle pose des limites', isRight: true },
          { label: 'Elle dit « s’il te plaît »', isRight: false },
        ],
        keyTakeaway: 'Chaque précision enlève une devinette à l’IA.',
      },
      {
        kind: 'bricks',
        title: 'Les 5 briques',
        icon: '🗺️',
        content:
          'Une demande complète combine jusqu’à cinq briques. Pas besoin des cinq à chaque fois : commencez par la tâche, ajoutez ce qui manque.',
        parts: [
          { label: 'Tâche', text: 'Que faut-il faire ? Un verbe d’action.' },
          { label: 'Contexte', text: 'Pourquoi, dans quel cadre ?' },
          { label: 'Public', text: 'Pour qui est le résultat ?' },
          { label: 'Format', text: 'Sous quelle forme ?' },
          { label: 'Contraintes', text: 'Quelles limites : longueur, ton ?' },
        ],
        keyTakeaway: 'Tâche, contexte, public, format, contraintes.',
      },
      {
        kind: 'annotated',
        title: 'La tâche et les autres briques, en couleur',
        icon: '🎨',
        skill: 'task',
        content:
          'Voici la bonne demande de tout à l’heure. Chaque couleur est une brique.',
        parts: [
          { text: 'Pour la réunion de direction de lundi', label: 'Contexte' },
          { text: ', ' },
          { text: 'résume le rapport ci-dessous', label: 'Tâche' },
          { text: ' ' },
          { text: 'pour ma directrice, qui a deux minutes', label: 'Public' },
          { text: ' : ' },
          { text: '5 puces, les décisions d’abord', label: 'Format' },
          { text: ', ' },
          { text: 'sans jargon', label: 'Contraintes' },
          { text: '.' },
        ],
        keyTakeaway:
          'Chaque brique répond à une question que l’IA ne peut pas deviner.',
      },
      {
        title: 'Le contexte : pourquoi, dans quel cadre ?',
        icon: '📁',
        skill: 'context',
        content:
          'Dites dans quel cadre vous travaillez : « pour la réunion de service de demain », « suite à la plainte d’un usager ».\n\nLe contexte aide l’IA à choisir le bon niveau de détail. S’il y a un document, collez-le.',
        keyTakeaway: 'Le contexte adapte la réponse à votre situation réelle.',
      },
      {
        title: 'Le public et le format : pour qui, sous quelle forme ?',
        icon: '📊',
        skill: 'format',
        content:
          '**Le public** : « pour un usager », « pour ma directrice, qui a deux minutes ».\n\n**Le format** : « en tableau à 3 colonnes », « en 5 puces », « en mail avec objet ».',
        example: {
          bad: 'Donne-moi les infos importantes.',
          good: 'Présente les informations clés en tableau : décision, responsable, délai. Pour le directeur.',
        },
      },
      {
        kind: 'fill',
        title: 'Les contraintes : à vous de compléter',
        icon: '🛠️',
        skill: 'constraints',
        content:
          'Il manque une brique à cette demande. Quel morceau la complète le mieux ?',
        parts: [
          {
            text: 'Rédige une réponse à cet usager qui demande où en est son dossier',
            label: 'Tâche',
          },
          { text: ', ' },
          {
            text: 'en 6 lignes maximum, ton bienveillant, sans jargon',
            label: 'Contraintes',
          },
          { text: '.' },
        ],
        blank: 2,
        options: [
          'le plus vite possible',
          'en 6 lignes maximum, ton bienveillant, sans jargon',
          'de façon parfaite',
        ],
        keyTakeaway:
          'Une bonne contrainte se vérifie : une longueur, un ton, un interdit.',
      },
    ],
  },

  // --- Leçon 4 ---
  {
    id: 'lesson-4',
    title: 'Corriger une réponse sans tout recommencer',
    icon: '🔄',
    skills: ['constraints'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'L’IA vous a rendu un mail bien trop long, au ton trop familier. Que lui écrivez-vous ensuite ?',
        choices: [
          {
            prompt: 'Non, ce n’est pas ça. Recommence.',
            answer:
              'Voici une nouvelle version : [un autre mail, toujours long, avec un ton choisi au hasard].',
          },
          {
            prompt:
              'Raccourcis ce mail à 6 lignes et passe au vouvoiement, ton professionnel. Garde la date et le lieu.',
            answer:
              'Madame, Monsieur,\nJe vous confirme notre rendez-vous du [date] à [lieu]. …',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle dit ce qui ne va pas', isRight: true },
          { label: 'Elle dit ce qu’il faut garder', isRight: true },
          { label: 'Elle repart de zéro', isRight: false },
        ],
        keyTakeaway: 'Nommez le défaut, la correction, et ce qui doit rester.',
      },
      {
        title: 'Le premier essai est rarement le bon',
        icon: '🎯',
        content:
          'Même les habitués corrigent leurs demandes. Ce n’est pas un échec : c’est la façon normale de travailler avec l’IA.\n\nLe but n’est pas d’avoir bon du premier coup, mais de savoir **corriger**.',
        keyTakeaway: 'Deux ou trois allers-retours, c’est normal.',
      },
      {
        title: 'Dire ce qui ne va pas',
        icon: '💡',
        skill: 'constraints',
        content:
          'Dans la même conversation, dites précisément ce qui ne va pas :\n\n- **Trop long** → « en 6 lignes maximum »\n- **Mauvais ton** → « ton professionnel, vouvoiement »\n- **Il manque une info** → donnez-la\n- **Mauvaise forme** → « en tableau »',
        keyTakeaway: 'Une correction précise garde ce qui était bon.',
      },
      {
        title: 'Corriger ou recommencer ?',
        icon: '🔀',
        content:
          'Si la réponse est **presque bonne**, corrigez par petites touches dans la conversation.\n\nSi elle est **à côté**, réécrivez votre demande de départ avec ce qui manquait, puis relancez.',
        keyTakeaway: 'Presque bon : corriger. À côté : réécrire la demande.',
      },
    ],
  },

  // --- Leçon 5 ---
  {
    id: 'lesson-5',
    title: 'Vérifier et adapter la réponse',
    icon: '✅',
    skills: ['verification', 'format'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'Un usager vous demande le délai pour contester une décision. Vous avez la décision sous les yeux. Laquelle de ces deux demandes vous permettra de répondre sans risque ?',
        choices: [
          {
            prompt: 'Quel est le délai pour contester une décision ?',
            answer:
              'Le délai est de 2 mois, selon l’article [référence] du code [nom].',
          },
          {
            prompt:
              'Quel est le délai pour contester la décision ci-dessous ? Appuie-toi uniquement sur ce texte, cite le passage, et dis-le si l’information n’y est pas.',
            answer:
              'Le texte indique : « Vous disposez d’un délai de deux mois… » (dernier paragraphe).',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle donne la source', isRight: true },
          { label: 'Elle demande de citer le passage', isRight: true },
          { label: 'Elle permet de vérifier', isRight: true },
          { label: 'Elle est plus courte', isRight: false },
        ],
        keyTakeaway:
          'Une réponse qu’on peut vérifier vaut mieux qu’une réponse sûre d’elle.',
      },
      {
        title: 'L’IA peut se tromper avec assurance',
        icon: '⚠️',
        skill: 'verification',
        content:
          'L’IA peut inventer un chiffre, une date ou un article de loi, sur un ton très sûr. On parle d’« hallucination ».\n\nElle ne connaît pas forcément les derniers textes ni vos procédures. **Relisez toujours** avant d’utiliser.',
        keyTakeaway: 'Les faits se vérifient, toujours.',
      },
      {
        title: 'Adapter la forme à la tâche',
        icon: '🔧',
        skill: 'format',
        content:
          '- **Résumé** → la longueur et les points à garder\n- **Mail** → le destinataire, le ton, l’objet\n- **Tableau** → les colonnes et les critères\n- **Reformulation** → le public et le niveau de langue',
        keyTakeaway: 'Chaque tâche a sa forme : dites-la.',
      },
      {
        title: 'Les 6 réflexes',
        icon: '🏆',
        content:
          '1. Être **précis**\n2. Donner le **contexte**\n3. Dire la **forme** attendue\n4. Penser au **destinataire**\n5. **Corriger** par allers-retours\n6. **Vérifier** avant d’utiliser',
        keyTakeaway: 'Ces six réflexes suffisent dans la plupart des cas.',
      },
    ],
  },

  // --- Leçon 6 ---
  {
    id: 'lesson-6',
    title: 'Montrer un exemple du résultat voulu',
    icon: '📋',
    skills: ['examples'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'Vous voulez classer 40 messages d’usagers par urgence, toujours de la même façon. Laquelle de ces deux demandes ?',
        choices: [
          {
            prompt: 'Classe ces messages par urgence.',
            answer:
              'Très urgent : … / Assez urgent : … / Moyennement urgent : … / À voir : …',
          },
          {
            prompt:
              'Classe ces messages par urgence, comme dans ces exemples :\n« Panne de chauffage » → URGENT\n« Demande d’attestation » → NORMAL\nUn message par ligne.',
            answer:
              '« Fuite d’eau au 3e étage » → URGENT\n« Changement d’adresse » → NORMAL\n…',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle montre les catégories voulues', isRight: true },
          { label: 'Elle montre la forme de la réponse', isRight: true },
          { label: 'Elle donne plus de travail à l’IA', isRight: false },
        ],
        keyTakeaway: 'Un exemple vaut mieux qu’une longue explication.',
      },
      {
        kind: 'annotated',
        title: 'Une demande avec exemple',
        icon: '💡',
        skill: 'examples',
        content:
          'Un ou deux exemples suffisent : l’IA reproduit le modèle, les catégories et la forme.',
        parts: [
          { text: 'Classe ces messages par urgence', label: 'Tâche' },
          { text: ', comme dans ces exemples : ' },
          {
            text: '« Panne de chauffage » → URGENT ; « Demande d’attestation » → NORMAL',
            label: 'Exemple',
          },
          { text: '. ' },
          { text: 'Un message par ligne.', label: 'Format' },
        ],
        keyTakeaway: 'Montrez ce que vous voulez : l’IA fera pareil.',
      },
      {
        title: 'Un rôle change le ton, pas la justesse',
        icon: '🎭',
        content:
          'Vous pouvez demander : « réponds comme un agent d’accueil bienveillant ».\n\nLe rôle oriente le **ton** et le **vocabulaire**. Il ne rend pas la réponse plus exacte : pour cela, donnez des informations et des exemples.',
        keyTakeaway: 'Le rôle règle le ton ; les exemples règlent le résultat.',
      },
    ],
  },

  // --- Leçon 7 ---
  {
    id: 'lesson-7',
    title: 'Faire faire un travail en plusieurs étapes',
    icon: '🚀',
    skills: ['task', 'format'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'Vous devez comparer 3 devis, puis rédiger une note pour choisir. Laquelle de ces deux demandes ?',
        choices: [
          {
            prompt: 'Analyse ces devis et fais-moi une note.',
            answer:
              'Les trois devis présentent des avantages et des inconvénients. Le devis B semble intéressant…',
          },
          {
            prompt:
              'Étape 1 : mets les 3 devis dans un tableau (prix, délai, garantie). Étape 2 : signale les écarts importants. Étape 3 : rédige une note de 10 lignes qui recommande un devis et dit pourquoi.',
            answer:
              'Tableau : …\nÉcarts : le devis C coûte 30 % de plus…\nNote : je recommande le devis A, car…',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Le travail est découpé', isRight: true },
          { label: 'Chaque étape se vérifie', isRight: true },
          { label: 'Chaque étape a sa forme', isRight: true },
          { label: 'Elle est plus courte', isRight: false },
        ],
        keyTakeaway: 'Un gros travail se découpe en étapes simples.',
      },
      {
        title: 'Découper un gros travail',
        icon: '🧩',
        skill: 'task',
        content:
          'Un travail complexe se découpe : **extraire**, puis **organiser**, puis **rédiger**.\n\nNumérotez les étapes dans une même demande, ou faites une demande par étape en vérifiant chaque résultat.',
        keyTakeaway: 'Découper, c’est ce qui fait la différence.',
      },
      {
        title: 'Voir le raisonnement',
        icon: '🧠',
        content:
          'Pour un calcul ou une comparaison, demandez : « montre les étapes avant de conclure ».\n\nLes IA récentes raisonnent souvent seules : l’intérêt est surtout de **voir les étapes pour les vérifier**.',
        example: {
          bad: 'Le budget est-il respecté ?',
          good: 'Compare dépenses et budget étape par étape : total, écart, causes, puis propositions.',
        },
      },
      {
        title: 'Demander une forme réutilisable',
        icon: '📊',
        skill: 'format',
        content:
          'Pour réutiliser le résultat, demandez une forme précise : un **tableau** aux colonnes nommées, une **liste numérotée**, des **titres et sous-titres**.\n\nUne forme précise se vérifie et se copie plus facilement.',
        keyTakeaway:
          'Plus la forme est précise, plus le résultat sert tel quel.',
      },
    ],
  },

  // --- Leçon 8 ---
  {
    id: 'lesson-8',
    title: 'Obtenir une réponse sans invention',
    icon: '🧪',
    skills: ['sources', 'verification'],
    slides: [
      {
        kind: 'choose',
        title: 'Laquelle marchera le mieux ?',
        icon: '🤔',
        content:
          'Vous voulez expliquer à l’accueil ce que change un nouveau décret. Laquelle de ces deux demandes ?',
        choices: [
          {
            prompt:
              'Tu es le meilleur expert juridique du monde. Explique le nouveau décret.',
            answer:
              'Le décret n° [numéro] du [date] modifie l’article 12 du code [nom]… (des références que rien ne garantit)',
          },
          {
            prompt:
              'Explique à un agent d’accueil, en 10 lignes, ce que change le décret ci-dessous pour les demandes de carte grise. Appuie-toi uniquement sur ce texte.\n"""\n[coller le décret]\n"""',
            answer:
              'Ce qui change pour l’accueil : … (d’après l’article 2 du texte fourni)',
          },
        ],
        better: 1,
        reasons: [
          { label: 'Elle fournit le texte', isRight: true },
          { label: 'Elle limite l’IA à ce texte', isRight: true },
          { label: 'Elle dit pour qui', isRight: true },
          { label: 'Elle flatte l’IA', isRight: false },
        ],
        keyTakeaway: 'Informez l’IA plutôt que de la flatter.',
      },
      {
        title: 'Les formules magiques ne marchent pas',
        icon: '✨',
        content:
          '« Tu es un expert », promettre un pourboire, être très poli : les études ne montrent **aucun effet fiable sur l’exactitude**.\n\nCe qui compte, c’est l’**information** donnée : la tâche, le contexte, le document de référence.',
        keyTakeaway: 'Un rôle peut changer le ton, pas la justesse.',
      },
      {
        kind: 'annotated',
        title: 'Deux phrases qui protègent',
        icon: '🛡️',
        skill: 'sources',
        content:
          'Pour une réponse importante, ajoutez ces deux phrases à votre demande.',
        parts: [
          {
            text: 'Explique ce que change le décret ci-dessous pour l’accueil',
            label: 'Tâche',
          },
          { text: '. ' },
          {
            text: 'Appuie-toi uniquement sur ce texte et cite le passage utilisé',
            label: 'Source',
          },
          { text: '. ' },
          {
            text: 'Si l’information n’y est pas, dis-le plutôt que de deviner.',
            label: 'Vérification',
          },
        ],
        keyTakeaway:
          'Dans le Coach, « Rendre la version prudente » ajoute ces phrases pour vous.',
      },
      {
        title: 'Un essai ne prouve rien',
        icon: '🔁',
        skill: 'verification',
        content:
          'La même demande, formulée autrement, peut donner une réponse très différente.\n\nSi une réponse déçoit, ne concluez pas que l’IA « ne sait pas » : reformulez, précisez, donnez un exemple, puis comparez.',
        keyTakeaway:
          'Comparer deux formulations vaut mieux que chercher LA formule.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// QUIZ QUESTIONS
// ---------------------------------------------------------------------------
// One question per lesson is flagged for the level test. Hints put the
// learner on the way without giving the answer.

const quiz: QuizQuestion[] = [
  // --- Leçon 1 ---
  {
    id: 'q1',
    lessonId: 'lesson-1',
    type: 'mcq',
    question: 'Qu’est-ce qu’une demande à l’IA (un « prompt ») ?',
    options: [
      'Un programme informatique à installer',
      'Un texte écrit à l’IA pour obtenir un résultat',
      'Un algorithme d’apprentissage automatique',
    ],
    correctIndex: 1,
    hint: 'Pensez à ce que vous tapez dans le champ de message.',
    explanation:
      'Une demande est simplement un texte. Pas besoin de compétences techniques : il suffit d’expliquer clairement ce que vous voulez.',
  },
  {
    id: 'q2',
    lessonId: 'lesson-1',
    type: 'true-false',
    question: 'L’IA connaît le contexte de votre travail et de votre service.',
    correctAnswer: false,
    hint: 'L’IA a-t-elle accès à vos dossiers ?',
    explanation:
      'L’IA ne sait ni dans quel service vous travaillez, ni sur quel dossier, ni pour qui. Il faut le lui dire.',
  },
  {
    id: 'q3',
    lessonId: 'lesson-1',
    type: 'best',
    question: 'Laquelle de ces demandes donnera la réponse la plus utile ?',
    options: [
      'Fais un truc avec ce compte rendu.',
      'Résume ce compte rendu en 5 lignes pour mon responsable : seulement les décisions et les délais.',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Laquelle dit à l’IA quoi faire, et pour qui ?',
    explanation:
      'La seconde dit la tâche (résumer), la longueur (5 lignes), le destinataire et ce qu’il faut garder.',
  },

  // --- Leçon 2 ---
  {
    id: 'q4',
    lessonId: 'lesson-2',
    type: 'best',
    question: 'Laquelle donnera le meilleur résultat ?',
    options: [
      'Améliore ce texte.',
      'Fais un truc bien avec ça.',
      'Reformule ce texte en langage simple pour un usager, en 3 phrases courtes.',
    ],
    correctIndex: 2,
    placement: true,
    hint: 'Laquelle dit pour qui, et sous quelle forme ?',
    explanation:
      'La troisième précise la tâche (reformuler), le public (un usager), le style (simple) et la forme (3 phrases courtes).',
  },
  {
    id: 'q5',
    lessonId: 'lesson-2',
    type: 'true-false',
    question: 'Plus une demande est courte, meilleure elle est.',
    correctAnswer: false,
    hint: 'Est-ce la longueur ou la précision qui compte ?',
    explanation:
      'Ce qui compte, c’est la précision. Trois lignes claires valent mieux qu’un mot vague.',
  },
  {
    id: 'q6',
    lessonId: 'lesson-2',
    type: 'mcq',
    question:
      'Quel est le meilleur test pour savoir si votre demande est claire ?',
    options: [
      'Vérifier qu’elle fait moins de 20 mots',
      'Se demander si un collègue arrivé ce matin comprendrait exactement',
      'Vérifier qu’elle contient des mots techniques',
    ],
    correctIndex: 1,
    hint: 'Pensez à quelqu’un qui arrive dans votre service.',
    explanation:
      'Le test du nouveau collègue : si un humain ne comprend pas votre demande, l’IA non plus.',
  },
  {
    id: 'q32',
    lessonId: 'lesson-2',
    type: 'sort',
    question: 'Qu’est-ce qui aide l’IA à éviter une réponse vague ?',
    items: [
      { text: 'Dire pour qui est la réponse', helps: true },
      { text: 'Écrire « s’il te plaît »', helps: false },
      { text: 'Fixer une longueur', helps: true },
      { text: 'Écrire en majuscules', helps: false },
      { text: 'Dire la forme attendue', helps: true },
    ],
    hint: 'Qu’est-ce qui donne une information à l’IA ?',
    explanation:
      'Ce qui aide, c’est l’information : le destinataire, la longueur, la forme. La politesse et les majuscules ne rendent pas la demande plus précise.',
  },

  // --- Leçon 3 ---
  {
    id: 'q7',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'Quelles sont les 5 briques d’une demande complète ?',
    options: [
      'Sujet, verbe, complément, adjectif, adverbe',
      'Tâche, contexte, public, format, contraintes',
      'Introduction, développement, conclusion, annexe, références',
    ],
    correctIndex: 1,
    hint: 'Quoi, pourquoi, pour qui, sous quelle forme, avec quelles limites ?',
    explanation:
      'La tâche (quoi faire), le contexte (pourquoi), le public (pour qui), le format (sous quelle forme) et les contraintes (quelles limites).',
  },
  {
    id: 'q8',
    lessonId: 'lesson-3',
    type: 'missing',
    question: 'Que manque-t-il surtout à cette demande ?',
    prompt: 'Résume ce texte.',
    options: [
      'La tâche',
      'Le contexte, le public et le format',
      'Rien, c’est suffisant',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'La tâche est là : « résume ». Que sait l’IA du reste ?',
    explanation:
      'La tâche est présente, mais l’IA ne sait ni pourquoi, ni pour qui, ni sous quelle forme : elle produira un résumé passe-partout.',
  },
  {
    id: 'q9',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'Quelle brique dit « sous quelle forme » présenter le résultat ?',
    options: ['La tâche', 'Le contexte', 'Le format'],
    correctIndex: 2,
    hint: 'Tableau, liste, mail…',
    explanation:
      'Le format dit la forme du résultat : tableau, liste à puces, mail avec objet, nombre de lignes…',
  },
  {
    id: 'q10',
    lessonId: 'lesson-3',
    type: 'true-false',
    question: 'Dire pour qui est la réponse ne change rien au résultat.',
    correctAnswer: false,
    hint: 'Expliqueriez-vous la même chose de la même façon à un expert et à un usager ?',
    explanation:
      'Le public change tout : vocabulaire, niveau de détail, ton. Un résumé pour un directeur et un résumé pour un usager sont très différents.',
  },
  {
    id: 'q33',
    lessonId: 'lesson-3',
    type: 'cloze',
    question: 'Quel morceau complète le mieux la demande ?',
    prompt:
      'Rédige une réponse à cet usager qui demande où en est son dossier, ___.',
    options: [
      'de façon parfaite',
      'en 6 lignes, ton bienveillant, sans jargon',
      'vite',
    ],
    correctIndex: 1,
    hint: 'Lequel l’IA peut-elle vraiment appliquer ?',
    explanation:
      'Une contrainte utile se vérifie : une longueur, un ton, un interdit. « Parfait » ou « vite » ne disent rien à l’IA.',
  },

  // --- Leçon 4 ---
  {
    id: 'q11',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: 'Après une première réponse décevante, que faire ?',
    options: [
      'Abandonner et écrire soi-même',
      'Relancer la même demande en espérant mieux',
      'Dire ce qui ne va pas et ce qu’il faut corriger',
    ],
    correctIndex: 2,
    hint: 'L’IA sait-elle ce qui vous a déçu ?',
    explanation:
      'Lire la réponse, nommer ce qui ne va pas, demander la correction : c’est la façon normale de travailler, même pour les habitués.',
  },
  {
    id: 'q12',
    lessonId: 'lesson-4',
    type: 'true-false',
    question:
      'Les habitués de l’IA écrivent la demande parfaite du premier coup.',
    correctAnswer: false,
    hint: 'Pensez aux allers-retours.',
    explanation:
      'Même les habitués corrigent leurs demandes. Le savoir-faire, c’est de savoir corriger, pas d’avoir bon du premier coup.',
  },
  {
    id: 'q13',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: 'La réponse est trop longue. Qu’ajoutez-vous à votre demande ?',
    options: [
      'Du contexte',
      'Une longueur : « en 5 lignes maximum »',
      'Le public',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Quelle brique règle la longueur ?',
    explanation:
      'Pour la longueur, une contrainte explicite : « en 5 lignes », « 200 mots maximum », « un paragraphe ».',
  },
  {
    id: 'q34',
    lessonId: 'lesson-4',
    type: 'best',
    question:
      'L’IA a rendu un mail trop familier. Quelle relance est la meilleure ?',
    options: [
      'Non, recommence.',
      'Passe au vouvoiement, ton professionnel, et garde la date et le lieu.',
    ],
    correctIndex: 1,
    hint: 'Laquelle dit ce qui ne va pas ?',
    explanation:
      'Elle nomme le défaut, la correction et ce qu’il faut garder : l’IA corrige sans tout changer.',
  },

  // --- Leçon 5 ---
  {
    id: 'q14',
    lessonId: 'lesson-5',
    type: 'true-false',
    question: 'On peut utiliser une réponse de l’IA sans la relire.',
    correctAnswer: false,
    hint: 'L’IA vérifie-t-elle ce qu’elle écrit ?',
    explanation:
      'L’IA peut inventer des informations. Relisez et vérifiez toujours, surtout pour un document officiel.',
  },
  {
    id: 'q15',
    lessonId: 'lesson-5',
    type: 'mcq',
    question: 'On dit que l’IA « hallucine ». Cela signifie qu’elle…',
    options: [
      'Rêve pendant le traitement',
      'Invente des informations qui semblent vraies',
      'Refuse de répondre à certaines questions',
    ],
    correctIndex: 1,
    hint: 'Pensez à une information crédible… mais fausse.',
    explanation:
      'Une hallucination est une information inventée qui a l’air crédible. D’où la vérification humaine.',
  },
  {
    id: 'q16',
    lessonId: 'lesson-5',
    type: 'best',
    question: 'Laquelle donnera le résultat le plus utile ?',
    options: [
      'Fais-moi un tableau.',
      'Mets ça en forme.',
      'Compare ces 3 options dans un tableau : coût, délai, conformité, notés de 1 à 5.',
    ],
    correctIndex: 2,
    placement: true,
    hint: 'Laquelle dit les colonnes du tableau ?',
    explanation:
      'Elle dit la tâche (comparer), la forme (tableau), les critères et la façon de noter.',
  },
  {
    id: 'q17',
    lessonId: 'lesson-5',
    type: 'spot',
    question:
      'Dans cette réponse de l’IA, quelle phrase faut-il vérifier en priorité ?',
    prompt:
      'Vous avez demandé : « Quelles sont les règles du télétravail dans mon administration ? »',
    options: [
      'Le télétravail aide à concilier vie professionnelle et vie personnelle.',
      'Selon le décret du 11 février 2016, vous avez droit à 3 jours par semaine.',
      'Il est conseillé d’en parler avec votre responsable.',
    ],
    correctIndex: 1,
    hint: 'Laquelle contient une date, un chiffre ou une référence ?',
    explanation:
      'Une référence et un chiffre précis se vérifient à la source (Légifrance, votre service RH). L’IA invente souvent ce genre de détail, ou le déforme.',
  },

  // --- Leçon 6 ---
  {
    id: 'q18',
    lessonId: 'lesson-6',
    type: 'mcq',
    question: 'Pourquoi un exemple dans la demande est-il efficace ?',
    options: [
      'Il rend la demande plus longue, donc meilleure',
      'L’IA comprend le modèle et reproduit la forme',
      'Il ne sert à rien',
    ],
    correctIndex: 1,
    hint: 'Que fait l’IA quand elle voit un modèle ?',
    explanation:
      'Un exemple montre exactement ce que vous attendez : la forme, le style, le niveau de détail. L’IA le reproduit.',
  },
  {
    id: 'q19',
    lessonId: 'lesson-6',
    type: 'true-false',
    question:
      'Donner un rôle à l’IA (« réponds comme un agent d’accueil ») change surtout le ton, pas l’exactitude.',
    correctAnswer: true,
    hint: 'Un rôle apporte-t-il des informations nouvelles ?',
    explanation:
      'Le rôle oriente le ton et le vocabulaire. Pour une réponse juste, il faut des informations et des exemples.',
  },
  {
    id: 'q20',
    lessonId: 'lesson-6',
    type: 'mcq',
    question: 'Combien d’exemples faut-il en général ?',
    options: ['Au moins 10', '1 à 3 suffisent', 'Aucun, l’IA devine toujours'],
    correctIndex: 1,
    hint: 'Un modèle se comprend vite.',
    explanation:
      'Un à trois exemples bien choisis suffisent. Même un seul fait souvent une grande différence.',
  },
  {
    id: 'q35',
    lessonId: 'lesson-6',
    type: 'best',
    question:
      'Vous voulez que l’IA classe des messages toujours de la même façon. Quelle demande ?',
    options: [
      'Classe ces messages par urgence.',
      'Classe ces messages par urgence, comme ces exemples : « Panne de chauffage » → URGENT ; « Attestation » → NORMAL.',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Laquelle montre les catégories voulues ?',
    explanation:
      'Les exemples fixent les catégories et la forme : l’IA classe pareil à chaque fois.',
  },

  // --- Leçon 7 ---
  {
    id: 'q21',
    lessonId: 'lesson-7',
    type: 'mcq',
    question:
      'Pourquoi demander à l’IA de « montrer les étapes » avant de conclure ?',
    options: [
      'Pour qu’elle travaille plus lentement',
      'Pour voir son raisonnement et pouvoir le vérifier',
      'Pour qu’elle réponde en plusieurs messages',
    ],
    correctIndex: 1,
    hint: 'Qu’est-ce que vous gagnez, vous ?',
    explanation:
      'Les IA récentes raisonnent souvent seules ; voir les étapes vous permet surtout de repérer une erreur.',
  },
  {
    id: 'q22',
    lessonId: 'lesson-7',
    type: 'true-false',
    question:
      'Pour un travail complexe, mieux vaut une seule demande vague que des étapes.',
    correctAnswer: false,
    hint: 'Comment vérifie-t-on un gros travail ?',
    explanation:
      'Découper en étapes claires permet de guider l’IA et de vérifier chaque résultat.',
  },
  {
    id: 'q23',
    lessonId: 'lesson-7',
    type: 'mcq',
    question:
      'Quelle forme demander pour réutiliser des données dans un tableur ?',
    options: [
      'Un paragraphe de texte libre',
      'Un tableau aux colonnes nommées',
      'Un poème',
    ],
    correctIndex: 1,
    hint: 'Laquelle se copie dans des cases ?',
    explanation:
      'Un tableau aux colonnes nommées se copie et se vérifie directement. Le texte libre est plus difficile à réutiliser.',
  },
  {
    id: 'q36',
    lessonId: 'lesson-7',
    type: 'order',
    question: 'Remettez les étapes de ce travail dans l’ordre.',
    pieces: [
      'Mettre les 3 devis dans un tableau',
      'Signaler les écarts importants',
      'Rédiger la note de recommandation',
    ],
    placement: true,
    hint: 'Que faut-il avoir avant de pouvoir rédiger ?',
    explanation:
      'On organise d’abord, on analyse ensuite, on rédige enfin : chaque étape s’appuie sur la précédente et se vérifie.',
  },

  // --- Leçon 8 ---
  {
    id: 'q24',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: 'Ajouter « Tu es un expert » au début d’une demande…',
    options: [
      'Rend toujours les réponses plus exactes',
      'N’a pas d’effet fiable sur l’exactitude ; cela peut changer le ton',
      'Empêche l’IA de se tromper',
    ],
    correctIndex: 1,
    hint: 'Cette phrase donne-t-elle une information à l’IA ?',
    explanation:
      'Les études n’ont pas trouvé d’effet fiable sur l’exactitude. Ce qui améliore la réponse, c’est l’information : tâche, contexte, document, forme.',
  },
  {
    id: 'q25',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'Si l’IA cite un article de loi avec assurance, on peut l’utiliser sans vérifier.',
    correctAnswer: false,
    hint: 'L’assurance prouve-t-elle quelque chose ?',
    explanation:
      'Une IA peut inventer des références sur un ton très sûr. Vérifiez toujours les textes, chiffres et dates.',
  },
  {
    id: 'q26',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: 'Quelle phrase réduit le risque d’invention ?',
    options: [
      '« Réponds parfaitement, c’est très important »',
      '« Si tu n’es pas sûr, dis-le, et appuie-toi uniquement sur le document fourni »',
      '« Tu auras un pourboire si c’est juste »',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Laquelle donne une règle que l’on peut vérifier ?',
    explanation:
      'Autoriser l’IA à dire qu’elle ne sait pas, et la limiter au document fourni, rend la réponse vérifiable.',
  },
  {
    id: 'q27',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'L’IA répond : « Selon l’article L. 4127-12 du code des relations entre le public et l’administration, le délai est de 15 jours. » Que faites-vous ?',
    options: [
      'Je recopie la référence, elle est très précise',
      'Je vérifie l’article sur Légifrance avant de l’utiliser',
      'Je demande à l’IA si elle est sûre, et je la crois',
    ],
    correctIndex: 1,
    hint: 'Qui fait foi : l’IA, ou le texte officiel ?',
    explanation:
      'Une référence précise peut être inventée. Seule la source officielle fait foi ; demander à l’IA de confirmer ne prouve rien.',
  },
  {
    id: 'q28',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'L’IA cite : « Comme l’a déclaré le ministre le 3 mars 2024 : … ». Cette citation est…',
    options: [
      'Fiable, puisqu’elle est datée',
      'À vérifier : citations et dates font partie de ce que l’IA invente le plus',
      'Fiable si elle est entre guillemets',
    ],
    correctIndex: 1,
    hint: 'Une date rend-elle une citation vraie ?',
    explanation:
      'Citations, dates et noms propres sont des inventions fréquentes. Retrouvez la source avant de citer.',
  },
  {
    id: 'q29',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'Quand l’IA reformule un texte que vous lui avez donné, le risque d’invention est plus faible que quand elle répond de mémoire.',
    correctAnswer: true,
    hint: 'D’où vient l’information dans chaque cas ?',
    explanation:
      'S’appuyer sur un document fourni réduit le risque. Relisez quand même : une reformulation peut changer le sens.',
  },
  {
    id: 'q30',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'Si l’IA donne un chiffre avec une décimale (« 37,4 % »), c’est le signe qu’il est exact.',
    correctAnswer: false,
    hint: 'Un chiffre inventé peut-il être précis ?',
    explanation:
      'La précision apparente ne prouve rien : un chiffre inventé peut être très précis. Vérifiez sa source.',
  },
  {
    id: 'q31',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'L’IA résume un rapport que vous ne lui avez pas donné, en citant ses conclusions. Que faites-vous ?',
    options: [
      'Je l’utilise : elle connaît sans doute ce rapport',
      'Je lui donne le rapport et lui demande de s’appuyer uniquement dessus',
      'Je lui demande de résumer plus court',
    ],
    correctIndex: 1,
    hint: 'D’où l’IA tire-t-elle ce résumé ?',
    explanation:
      'Sans le document, l’IA reconstitue de mémoire et peut inventer. Donnez-lui le texte et demandez-lui de citer les passages utilisés.',
  },
];

// ---------------------------------------------------------------------------
// FLASHCARDS
// ---------------------------------------------------------------------------

const flashcards: Flashcard[] = [
  // Leçon 1
  {
    id: 'fc1',
    lessonId: 'lesson-1',
    front: 'Qu’est-ce qu’une demande à l’IA (un « prompt ») ?',
    back: 'Un texte écrit à l’IA pour obtenir un résultat. Comme un brief donné à un stagiaire très rapide.',
  },
  {
    id: 'fc2',
    lessonId: 'lesson-1',
    front: 'L’IA connaît-elle votre contexte de travail ?',
    back: 'Non. Elle ne connaît ni votre service, ni vos dossiers, ni vos habitudes. Il faut le lui dire.',
  },
  {
    id: 'fc3',
    lessonId: 'lesson-1',
    front: 'Pourquoi « Fais un truc avec ce texte » ne marche pas ?',
    back: 'Pas de tâche, pas de forme, pas de destinataire : l’IA ne sait pas quoi faire et répond au hasard.',
  },
  {
    id: 'fc4',
    lessonId: 'lesson-1',
    front: 'Par quoi commencer une demande ?',
    back: 'Par un verbe d’action : résume, rédige, compare, reformule, extrais.',
  },
  // Leçon 2
  {
    id: 'fc5',
    lessonId: 'lesson-2',
    front: 'Que donne une demande vague ?',
    back: 'Une réponse vague et passe-partout. Flou dedans, flou dehors.',
  },
  {
    id: 'fc6',
    lessonId: 'lesson-2',
    front: 'Quel est le « test du nouveau collègue » ?',
    back: 'Avant d’envoyer : « Un collègue arrivé ce matin comprendrait-il exactement ce que je veux ? » Si non, précisez.',
  },
  {
    id: 'fc7',
    lessonId: 'lesson-2',
    front: 'Une demande courte est-elle meilleure ?',
    back: 'Pas forcément. Ce qui compte, c’est la précision : trois lignes claires valent mieux qu’un mot vague.',
  },
  {
    id: 'fc8',
    lessonId: 'lesson-2',
    front: 'Un exemple de demande vague, puis précise ?',
    back: 'Vague : « Améliore ce texte. » Précise : « Reformule ce texte en langage simple pour un usager, en 3 phrases courtes. »',
  },
  // Leçon 3
  {
    id: 'fc9',
    lessonId: 'lesson-3',
    front: 'Les 5 briques d’une demande complète ?',
    back: '1. Tâche (quoi faire)\n2. Contexte (pourquoi)\n3. Public (pour qui)\n4. Format (sous quelle forme)\n5. Contraintes (quelles limites)',
  },
  {
    id: 'fc10',
    lessonId: 'lesson-3',
    front: 'Cinq verbes d’action pour commencer ?',
    back: 'Résume, compare, reformule, extrais, rédige. Évitez « traite » ou « gère ».',
  },
  {
    id: 'fc11',
    lessonId: 'lesson-3',
    front: 'À quoi sert le contexte ?',
    back: 'À adapter la réponse à votre situation : « pour la réunion de demain », « suite à la plainte d’un usager ».',
  },
  {
    id: 'fc12',
    lessonId: 'lesson-3',
    front: 'Que sont les contraintes ?',
    back: 'Les limites : longueur, ton, interdits. Ex. : « en 5 lignes maximum, sans jargon ».',
  },
  {
    id: 'fc13',
    lessonId: 'lesson-3',
    front: 'Pourquoi dire pour qui est la réponse ?',
    back: 'Le public change le vocabulaire, le détail et le ton. Un résumé pour un directeur n’est pas un résumé pour un usager.',
  },
  // Leçon 4
  {
    id: 'fc14',
    lessonId: 'lesson-4',
    front: 'La première demande est-elle la bonne ?',
    back: 'Rarement. Même les habitués corrigent. Le savoir-faire, c’est de savoir corriger.',
  },
  {
    id: 'fc15',
    lessonId: 'lesson-4',
    front: 'Comment corriger une réponse ?',
    back: 'Dans la même conversation : dire ce qui ne va pas, la correction voulue, et ce qu’il faut garder.',
  },
  {
    id: 'fc16',
    lessonId: 'lesson-4',
    front: 'La réponse est trop longue. Que faire ?',
    back: 'Ajouter une longueur : « en 5 lignes maximum », « 200 mots », « un paragraphe ».',
  },
  {
    id: 'fc17',
    lessonId: 'lesson-4',
    front: 'Le ton ne convient pas. Que faire ?',
    back: 'Préciser le public et le ton : « pour un directeur, ton formel », « pour un usager, ton bienveillant ».',
  },
  // Leçon 5
  {
    id: 'fc18',
    lessonId: 'lesson-5',
    front: 'Qu’est-ce qu’une « hallucination » ?',
    back: 'Une information inventée par l’IA, qui semble vraie. D’où la vérification.',
  },
  {
    id: 'fc19',
    lessonId: 'lesson-5',
    front: 'Peut-on utiliser une réponse sans la relire ?',
    back: 'Non. Relisez et vérifiez toujours, surtout pour un document officiel.',
  },
  {
    id: 'fc20',
    lessonId: 'lesson-5',
    front: 'Les 6 réflexes ?',
    back: '1. Être précis\n2. Donner le contexte\n3. Dire la forme\n4. Penser au destinataire\n5. Corriger\n6. Vérifier',
  },
  // Leçon 6
  {
    id: 'fc21',
    lessonId: 'lesson-6',
    front: 'Comment obtenir toujours la même forme de réponse ?',
    back: 'Montrer un ou deux exemples du résultat voulu : l’IA reproduit le modèle.',
  },
  {
    id: 'fc22',
    lessonId: 'lesson-6',
    front: 'Que change un rôle (« réponds comme un agent d’accueil ») ?',
    back: 'Le ton et le vocabulaire. Pas l’exactitude : pour cela, donnez des informations.',
  },
  // Leçon 7
  {
    id: 'fc23',
    lessonId: 'lesson-7',
    front: 'Comment faire faire un gros travail ?',
    back: 'Le découper en étapes numérotées (extraire, organiser, rédiger) et vérifier chaque résultat.',
  },
  {
    id: 'fc24',
    lessonId: 'lesson-7',
    front: 'Pourquoi demander de « montrer les étapes » ?',
    back: 'Pour voir le raisonnement et repérer une erreur.',
  },
  // Leçon 8
  {
    id: 'fc25',
    lessonId: 'lesson-8',
    front: 'Les deux phrases qui protègent des inventions ?',
    back: '« Appuie-toi uniquement sur ce texte et cite le passage. » « Si l’information n’y est pas, dis-le plutôt que de deviner. »',
  },
  {
    id: 'fc26',
    lessonId: 'lesson-8',
    front: '« Tu es un expert » rend-il la réponse plus exacte ?',
    back: 'Non, aucun effet fiable sur l’exactitude. Ce qui compte : la tâche, le contexte, le document.',
  },
];

export const COURSE_FR: CourseContent = { lessons, quiz, flashcards };
