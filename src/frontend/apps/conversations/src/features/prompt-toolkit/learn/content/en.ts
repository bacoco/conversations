// English course content (same structure as the French one).
import type { CourseContent, Flashcard, Lesson, QuizQuestion } from '../types';

// ---------------------------------------------------------------------------
// LESSONS
// ---------------------------------------------------------------------------

const lessons: Lesson[] = [
  // --- Lesson 1 ---
  {
    id: 'lesson-1',
    title: 'Understand what the AI needs from you',
    icon: '✨',
    skills: ['task'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'Your manager wants an update on yesterday’s meeting. You have the minutes. Which of these two requests will get the more useful answer?',
        choices: [
          {
            prompt: 'Do something with these minutes.',
            answer:
              'I can summarise this text, translate it, rephrase it or extract keywords. What would you like?',
          },
          {
            prompt:
              'Summarise these minutes in 5 lines for an email to my manager. Keep only the decisions and deadlines.',
            answer:
              'Meeting decisions:\n- Project approved, starts on [date]\n- Budget: decision by Friday\n- Review on [date]',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It says what to do', isRight: true },
          { label: 'It says who it is for', isRight: true },
          { label: 'It sets the length', isRight: true },
          { label: 'It is more polite', isRight: false },
        ],
        keyTakeaway: 'The AI does what you write. No more, no less.',
      },
      {
        title: 'The AI is not a colleague who guesses',
        icon: '🧑‍💼',
        content:
          'The AI knows neither your department, nor your files, nor your habits. It answers what is written, nothing else.\n\nPicture a very fast intern who arrived this morning: the clearer your request, the better the work.',
        keyTakeaway: 'Write as if for someone who knows nothing of your work.',
      },
      {
        title: 'Start with an action verb',
        icon: '🎯',
        skill: 'task',
        content:
          'A request to the AI (also called a “prompt”) is plain text, in normal sentences. Start with what you want:\n\n**Summarise**, **write**, **compare**, **rephrase**, **extract**.\n\nAvoid “handle”, “deal with”, “do something”.',
        example: {
          bad: 'Handle these minutes.',
          good: 'Extract the 5 decisions from these minutes.',
        },
        keyTakeaway: 'A clear action verb tells the AI what to do.',
      },
    ],
  },

  // --- Lesson 2 ---
  {
    id: 'lesson-2',
    title: 'Avoid vague answers',
    icon: '🌫️',
    skills: ['task'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'You must make a legal text understandable for a member of the public. Which of these two requests will give the better result?',
        choices: [
          {
            prompt: 'Improve this text.',
            answer:
              'Here is an improved version: [the same text, a few words changed, an even more formal tone].',
          },
          {
            prompt:
              'Rephrase this text in plain language for someone with no legal training. Short sentences, 3 paragraphs at most.',
            answer:
              'What changes for you: from [date], you can apply online. You will get an answer within [time]…',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It says who it is for', isRight: true },
          { label: 'It sets the style', isRight: true },
          { label: 'It sets a length', isRight: true },
          { label: 'It is longer', isRight: false },
        ],
        keyTakeaway: 'Vague in, vague out.',
      },
      {
        title: 'Vague in, vague out',
        icon: '⚖️',
        content:
          'A vague request gets a “likely” answer: generic, all-purpose, often useless.\n\nThe AI does not ask for details on its own: it fills the gaps at random.',
        keyTakeaway: 'What you do not say, the AI makes up.',
      },
      {
        title: 'The new colleague test',
        icon: '🔍',
        skill: 'task',
        content:
          'Before sending, read your request again and ask yourself:\n\n“Would a colleague who arrived this morning understand exactly what I want?”\n\nIf not, add what they would be missing.',
        keyTakeaway: 'If a person would not understand, neither will the AI.',
      },
      {
        title: 'Short or long?',
        icon: '📏',
        content:
          'A short request is not better in itself. What counts is that it is **precise**.\n\nThree clear lines beat one vague word.',
        example: {
          bad: 'Make a table.',
          good: 'Compare these 3 offers in a table: price, lead time, warranty.',
        },
      },
    ],
  },

  // --- Lesson 3 ---
  {
    id: 'lesson-3',
    title: 'Write a complete request',
    icon: '🧱',
    skills: ['task', 'context', 'audience', 'format', 'constraints'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'Your director wants to know a 20-page report before Monday’s meeting. Which of these two requests will get the more useful answer?',
        choices: [
          {
            prompt: 'Summarise this report.',
            answer:
              'This report covers several topics. It first sets out the context, then findings, and finally recommendations…',
          },
          {
            prompt:
              'For Monday’s management meeting, summarise the report below for my director, who has two minutes: 5 bullet points, decisions to make first, no jargon.',
            answer:
              'To decide on Monday:\n• Approve the schedule (end of March)\n• Choose between options A and B\n• …',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It gives the context', isRight: true },
          { label: 'It says who it is for', isRight: true },
          { label: 'It sets the form', isRight: true },
          { label: 'It sets limits', isRight: true },
          { label: 'It says “please”', isRight: false },
        ],
        keyTakeaway: 'Each detail takes a guess away from the AI.',
      },
      {
        kind: 'bricks',
        title: 'The 5 bricks',
        icon: '🗺️',
        content:
          'A complete request combines up to five bricks. You do not need all five every time: start with the task, add what is missing.',
        parts: [
          { label: 'Task', text: 'What should be done? An action verb.' },
          { label: 'Context', text: 'Why, in what setting?' },
          { label: 'Audience', text: 'Who is the result for?' },
          { label: 'Format', text: 'In what form?' },
          { label: 'Constraints', text: 'What limits: length, tone?' },
        ],
        keyTakeaway: 'Task, context, audience, format, constraints.',
      },
      {
        kind: 'annotated',
        title: 'The task and the other bricks, in colour',
        icon: '🎨',
        skill: 'task',
        content:
          'Here is the good request from before. Each colour is a brick.',
        parts: [
          { text: 'For Monday’s management meeting', label: 'Context' },
          { text: ', ' },
          { text: 'summarise the report below', label: 'Task' },
          { text: ' ' },
          { text: 'for my director, who has two minutes', label: 'Audience' },
          { text: ': ' },
          { text: '5 bullet points, decisions first', label: 'Format' },
          { text: ', ' },
          { text: 'no jargon', label: 'Constraints' },
          { text: '.' },
        ],
        keyTakeaway: 'Each brick answers a question the AI cannot guess.',
      },
      {
        title: 'The context: why, in what setting?',
        icon: '📁',
        skill: 'context',
        content:
          'Say what setting you work in: “for tomorrow’s team meeting”, “following a complaint from a member of the public”.\n\nThe context helps the AI pick the right level of detail. If there is a document, paste it.',
        keyTakeaway: 'Context fits the answer to your real situation.',
      },
      {
        title: 'Audience and format: for whom, in what form?',
        icon: '📊',
        skill: 'format',
        content:
          '**The audience**: “for a member of the public”, “for my director, who has two minutes”.\n\n**The format**: “as a 3-column table”, “in 5 bullet points”, “as an email with a subject line”.',
        example: {
          bad: 'Give me the important info.',
          good: 'Present the key information as a table: decision, owner, deadline. For the director.',
        },
      },
      {
        kind: 'fill',
        title: 'Constraints: your turn to complete',
        icon: '🛠️',
        skill: 'constraints',
        content:
          'This request is missing a brick. Which piece completes it best?',
        parts: [
          {
            text: 'Write a reply to this person asking where their file stands',
            label: 'Task',
          },
          { text: ', ' },
          {
            text: 'in 6 lines at most, kind tone, no jargon',
            label: 'Constraints',
          },
          { text: '.' },
        ],
        blank: 2,
        options: [
          'as fast as possible',
          'in 6 lines at most, kind tone, no jargon',
          'perfectly',
        ],
        keyTakeaway:
          'A good constraint can be checked: a length, a tone, a ban.',
      },
    ],
  },

  // --- Lesson 4 ---
  {
    id: 'lesson-4',
    title: 'Fix an answer without starting over',
    icon: '🔄',
    skills: ['constraints'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'The AI gave you an email far too long, in too casual a tone. What do you write next?',
        choices: [
          {
            prompt: 'No, that is not it. Start again.',
            answer:
              'Here is a new version: [another email, still long, with a tone picked at random].',
          },
          {
            prompt:
              'Shorten this email to 6 lines and use a formal, professional tone. Keep the date and the place.',
            answer:
              'Dear Sir or Madam,\nI confirm our appointment on [date] at [place]. …',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It says what is wrong', isRight: true },
          { label: 'It says what to keep', isRight: true },
          { label: 'It starts from scratch', isRight: false },
        ],
        keyTakeaway: 'Name the flaw, the fix, and what must stay.',
      },
      {
        title: 'The first try is rarely the right one',
        icon: '🎯',
        content:
          'Even regular users fix their requests. It is not a failure: it is the normal way to work with the AI.\n\nThe goal is not to get it right first time, but to know how to **fix** it.',
        keyTakeaway: 'Two or three rounds are normal.',
      },
      {
        title: 'Say what is wrong',
        icon: '💡',
        skill: 'constraints',
        content:
          'In the same conversation, say exactly what is wrong:\n\n- **Too long** → “in 6 lines at most”\n- **Wrong tone** → “professional, formal tone”\n- **Missing info** → give it\n- **Wrong form** → “as a table”',
        keyTakeaway: 'A precise fix keeps what was good.',
      },
      {
        title: 'Fix or start again?',
        icon: '🔀',
        content:
          'If the answer is **nearly right**, fix it bit by bit in the conversation.\n\nIf it is **off the mark**, rewrite your first request with what was missing, then send it again.',
        keyTakeaway: 'Nearly right: fix. Off the mark: rewrite the request.',
      },
    ],
  },

  // --- Lesson 5 ---
  {
    id: 'lesson-5',
    title: 'Check and adapt the answer',
    icon: '✅',
    skills: ['verification', 'format'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'Someone asks you the deadline to challenge a decision. You have the decision in front of you. Which request lets you answer safely?',
        choices: [
          {
            prompt: 'What is the deadline to challenge a decision?',
            answer:
              'The deadline is 2 months, under article [reference] of the [name] code.',
          },
          {
            prompt:
              'What is the deadline to challenge the decision below? Rely only on this text, quote the passage, and say so if the information is not there.',
            answer:
              'The text says: “You have two months to…” (last paragraph).',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It gives the source', isRight: true },
          { label: 'It asks to quote the passage', isRight: true },
          { label: 'It can be checked', isRight: true },
          { label: 'It is shorter', isRight: false },
        ],
        keyTakeaway:
          'An answer you can check beats an answer that sounds sure.',
      },
      {
        title: 'The AI can be wrong with confidence',
        icon: '⚠️',
        skill: 'verification',
        content:
          'The AI can make up a figure, a date or a law, in a very sure tone. This is called a “hallucination”.\n\nIt may not know the latest texts or your procedures. **Always read again** before using.',
        keyTakeaway: 'Facts are checked, always.',
      },
      {
        title: 'Fit the form to the task',
        icon: '🔧',
        skill: 'format',
        content:
          '- **Summary** → the length and the points to keep\n- **Email** → the recipient, the tone, the subject\n- **Table** → the columns and criteria\n- **Rephrasing** → the audience and the level of language',
        keyTakeaway: 'Each task has its form: say it.',
      },
      {
        title: 'The 6 reflexes',
        icon: '🏆',
        content:
          '1. Be **precise**\n2. Give the **context**\n3. Say the expected **form**\n4. Think of the **reader**\n5. **Fix** in a few rounds\n6. **Check** before using',
        keyTakeaway: 'These six reflexes are enough in most cases.',
      },
    ],
  },

  // --- Lesson 6 ---
  {
    id: 'lesson-6',
    title: 'Show an example of the result you want',
    icon: '📋',
    skills: ['examples'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'You want to sort 40 messages from the public by urgency, always the same way. Which of these two requests?',
        choices: [
          {
            prompt: 'Sort these messages by urgency.',
            answer:
              'Very urgent: … / Fairly urgent: … / Somewhat urgent: … / To see: …',
          },
          {
            prompt:
              'Sort these messages by urgency, as in these examples:\n“Heating breakdown” → URGENT\n“Certificate request” → NORMAL\nOne message per line.',
            answer:
              '“Water leak on 3rd floor” → URGENT\n“Change of address” → NORMAL\n…',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It shows the categories wanted', isRight: true },
          { label: 'It shows the form of the answer', isRight: true },
          { label: 'It gives the AI more work', isRight: false },
        ],
        keyTakeaway: 'One example beats a long explanation.',
      },
      {
        kind: 'annotated',
        title: 'A request with an example',
        icon: '💡',
        skill: 'examples',
        content:
          'One or two examples are enough: the AI copies the model, the categories and the form.',
        parts: [
          { text: 'Sort these messages by urgency', label: 'Task' },
          { text: ', as in these examples: ' },
          {
            text: '“Heating breakdown” → URGENT; “Certificate request” → NORMAL',
            label: 'Example',
          },
          { text: '. ' },
          { text: 'One message per line.', label: 'Format' },
        ],
        keyTakeaway: 'Show what you want: the AI will do the same.',
      },
      {
        title: 'A role changes the tone, not the accuracy',
        icon: '🎭',
        content:
          'You can ask: “answer like a kind front-desk officer”.\n\nThe role steers the **tone** and the **vocabulary**. It does not make the answer more accurate: for that, give information and examples.',
        keyTakeaway: 'The role sets the tone; examples set the result.',
      },
    ],
  },

  // --- Lesson 7 ---
  {
    id: 'lesson-7',
    title: 'Get work done in several steps',
    icon: '🚀',
    skills: ['task', 'format'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'You must compare 3 quotes, then write a note to choose one. Which of these two requests?',
        choices: [
          {
            prompt: 'Analyse these quotes and write me a note.',
            answer:
              'The three quotes have pros and cons. Quote B seems interesting…',
          },
          {
            prompt:
              'Step 1: put the 3 quotes in a table (price, lead time, warranty). Step 2: point out the big gaps. Step 3: write a 10-line note that recommends a quote and says why.',
            answer:
              'Table: …\nGaps: quote C costs 30% more…\nNote: I recommend quote A, because…',
          },
        ],
        better: 1,
        reasons: [
          { label: 'The work is split up', isRight: true },
          { label: 'Each step can be checked', isRight: true },
          { label: 'Each step has its form', isRight: true },
          { label: 'It is shorter', isRight: false },
        ],
        keyTakeaway: 'A big job is split into simple steps.',
      },
      {
        title: 'Split a big job',
        icon: '🧩',
        skill: 'task',
        content:
          'A complex job splits up: **extract**, then **organise**, then **write**.\n\nNumber the steps in one request, or make one request per step and check each result.',
        keyTakeaway: 'Splitting up is what makes the difference.',
      },
      {
        title: 'See the reasoning',
        icon: '🧠',
        content:
          'For a calculation or a comparison, ask: “show the steps before concluding”.\n\nRecent AIs often reason on their own: the point is mostly to **see the steps to check them**.',
        example: {
          bad: 'Is the budget on track?',
          good: 'Compare spending and budget step by step: total, gap, causes, then proposals.',
        },
      },
      {
        title: 'Ask for a reusable form',
        icon: '📊',
        skill: 'format',
        content:
          'To reuse the result, ask for a precise form: a **table** with named columns, a **numbered list**, **headings and subheadings**.\n\nA precise form is easier to check and to copy.',
        keyTakeaway:
          'The more precise the form, the more the result works as is.',
      },
    ],
  },

  // --- Lesson 8 ---
  {
    id: 'lesson-8',
    title: 'Get an answer without made-up facts',
    icon: '🧪',
    skills: ['sources', 'verification'],
    slides: [
      {
        kind: 'choose',
        title: 'Which one will work better?',
        icon: '🤔',
        content:
          'You want to explain to the front desk what a new decree changes. Which of these two requests?',
        choices: [
          {
            prompt:
              'You are the best legal expert in the world. Explain the new decree.',
            answer:
              'Decree no. [number] of [date] amends article 12 of the [name] code… (references nothing guarantees)',
          },
          {
            prompt:
              'Explain to a front-desk officer, in 10 lines, what the decree below changes for vehicle registration requests. Rely only on this text.\n"""\n[paste the decree]\n"""',
            answer:
              'What changes for the front desk: … (from article 2 of the text provided)',
          },
        ],
        better: 1,
        reasons: [
          { label: 'It provides the text', isRight: true },
          { label: 'It limits the AI to this text', isRight: true },
          { label: 'It says who it is for', isRight: true },
          { label: 'It flatters the AI', isRight: false },
        ],
        keyTakeaway: 'Inform the AI rather than flatter it.',
      },
      {
        title: 'Magic phrases do not work',
        icon: '✨',
        content:
          '“You are an expert”, promising a tip, being very polite: studies show **no reliable effect on accuracy**.\n\nWhat counts is the **information** given: the task, the context, the reference document.',
        keyTakeaway: 'A role can change the tone, not the accuracy.',
      },
      {
        kind: 'annotated',
        title: 'Two sentences that protect you',
        icon: '🛡️',
        skill: 'sources',
        content:
          'For an important answer, add these two sentences to your request.',
        parts: [
          {
            text: 'Explain what the decree below changes for the front desk',
            label: 'Task',
          },
          { text: '. ' },
          {
            text: 'Rely only on this text and quote the passage used',
            label: 'Source',
          },
          { text: '. ' },
          {
            text: 'If the information is not there, say so rather than guess.',
            label: 'Verification',
          },
        ],
        keyTakeaway:
          'In the Coach, “Make it cautious” adds these sentences for you.',
      },
      {
        title: 'One try proves nothing',
        icon: '🔁',
        skill: 'verification',
        content:
          'The same request, worded differently, can get a very different answer.\n\nIf an answer disappoints, do not conclude the AI “cannot do it”: rephrase, add detail, give an example, then compare.',
        keyTakeaway: 'Comparing two wordings beats looking for THE formula.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// QUIZ QUESTIONS
// ---------------------------------------------------------------------------

const quiz: QuizQuestion[] = [
  // --- Lesson 1 ---
  {
    id: 'q1',
    lessonId: 'lesson-1',
    type: 'mcq',
    question: 'What is a request to the AI (a “prompt”)?',
    options: [
      'A computer program to install',
      'A text written to the AI to get a result',
      'A machine-learning algorithm',
    ],
    correctIndex: 1,
    hint: 'Think of what you type in the message field.',
    explanation:
      'A request is simply a text. No technical skills needed: just explain clearly what you want.',
  },
  {
    id: 'q2',
    lessonId: 'lesson-1',
    type: 'true-false',
    question: 'The AI knows the context of your work and your department.',
    correctAnswer: false,
    hint: 'Does the AI have access to your files?',
    explanation:
      'The AI does not know which department you work in, on which file, or for whom. You have to tell it.',
  },
  {
    id: 'q3',
    lessonId: 'lesson-1',
    type: 'best',
    question: 'Which of these requests will get the more useful answer?',
    options: [
      'Do something with these minutes.',
      'Summarise these minutes in 5 lines for my manager: only the decisions and deadlines.',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Which one tells the AI what to do, and for whom?',
    explanation:
      'The second one gives the task (summarise), the length (5 lines), the recipient and what to keep.',
  },

  // --- Lesson 2 ---
  {
    id: 'q4',
    lessonId: 'lesson-2',
    type: 'best',
    question: 'Which one will give the best result?',
    options: [
      'Improve this text.',
      'Do something nice with this.',
      'Rephrase this text in plain language for a member of the public, in 3 short sentences.',
    ],
    correctIndex: 2,
    placement: true,
    hint: 'Which one says for whom, and in what form?',
    explanation:
      'The third one gives the task (rephrase), the audience (the public), the style (plain) and the form (3 short sentences).',
  },
  {
    id: 'q5',
    lessonId: 'lesson-2',
    type: 'true-false',
    question: 'The shorter a request, the better.',
    correctAnswer: false,
    hint: 'Is it the length or the precision that counts?',
    explanation:
      'What counts is precision. Three clear lines beat one vague word.',
  },
  {
    id: 'q6',
    lessonId: 'lesson-2',
    type: 'mcq',
    question: 'What is the best test to know if your request is clear?',
    options: [
      'Check it is under 20 words',
      'Ask yourself if a colleague who arrived this morning would understand exactly',
      'Check it contains technical words',
    ],
    correctIndex: 1,
    hint: 'Think of someone new in your department.',
    explanation:
      'The new colleague test: if a person would not understand your request, neither will the AI.',
  },
  {
    id: 'q32',
    lessonId: 'lesson-2',
    type: 'sort',
    question: 'What helps the AI avoid a vague answer?',
    items: [
      { text: 'Saying who the answer is for', helps: true },
      { text: 'Writing “please”', helps: false },
      { text: 'Setting a length', helps: true },
      { text: 'Writing in capitals', helps: false },
      { text: 'Saying the expected form', helps: true },
    ],
    hint: 'What gives the AI a piece of information?',
    explanation:
      'What helps is information: the recipient, the length, the form. Politeness and capitals do not make a request more precise.',
  },

  // --- Lesson 3 ---
  {
    id: 'q7',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'What are the 5 bricks of a complete request?',
    options: [
      'Subject, verb, object, adjective, adverb',
      'Task, context, audience, format, constraints',
      'Introduction, body, conclusion, appendix, references',
    ],
    correctIndex: 1,
    hint: 'What, why, for whom, in what form, with what limits?',
    explanation:
      'The task (what to do), the context (why), the audience (for whom), the format (in what form) and the constraints (what limits).',
  },
  {
    id: 'q8',
    lessonId: 'lesson-3',
    type: 'missing',
    question: 'What is this request mainly missing?',
    prompt: 'Summarise this text.',
    options: [
      'The task',
      'The context, the audience and the format',
      'Nothing, it is enough',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'The task is there: “summarise”. What does the AI know of the rest?',
    explanation:
      'The task is there, but the AI knows neither why, nor for whom, nor in what form: it will write an all-purpose summary.',
  },
  {
    id: 'q9',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'Which brick says “in what form” to present the result?',
    options: ['The task', 'The context', 'The format'],
    correctIndex: 2,
    hint: 'Table, list, email…',
    explanation:
      'The format gives the form of the result: table, bullet list, email with a subject line, number of lines…',
  },
  {
    id: 'q10',
    lessonId: 'lesson-3',
    type: 'true-false',
    question: 'Saying who the answer is for changes nothing in the result.',
    correctAnswer: false,
    hint: 'Would you explain the same thing the same way to an expert and to the public?',
    explanation:
      'The audience changes everything: vocabulary, level of detail, tone. A summary for a director and one for the public are very different.',
  },
  {
    id: 'q33',
    lessonId: 'lesson-3',
    type: 'cloze',
    question: 'Which piece completes the request best?',
    prompt: 'Write a reply to this person asking where their file stands, ___.',
    options: ['perfectly', 'in 6 lines, kind tone, no jargon', 'fast'],
    correctIndex: 1,
    hint: 'Which one can the AI actually apply?',
    explanation:
      'A useful constraint can be checked: a length, a tone, a ban. “Perfectly” or “fast” tell the AI nothing.',
  },

  // --- Lesson 4 ---
  {
    id: 'q11',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: 'After a disappointing first answer, what should you do?',
    options: [
      'Give up and write it yourself',
      'Send the same request again and hope for better',
      'Say what is wrong and what to fix',
    ],
    correctIndex: 2,
    hint: 'Does the AI know what disappointed you?',
    explanation:
      'Read the answer, name what is wrong, ask for the fix: it is the normal way to work, even for regular users.',
  },
  {
    id: 'q12',
    lessonId: 'lesson-4',
    type: 'true-false',
    question: 'Regular AI users write the perfect request first time.',
    correctAnswer: false,
    hint: 'Think of the rounds.',
    explanation:
      'Even regular users fix their requests. The skill is knowing how to fix, not getting it right first time.',
  },
  {
    id: 'q13',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: 'The answer is too long. What do you add to your request?',
    options: ['Context', 'A length: “in 5 lines at most”', 'The audience'],
    correctIndex: 1,
    placement: true,
    hint: 'Which brick sets the length?',
    explanation:
      'For length, an explicit constraint: “in 5 lines”, “200 words at most”, “one paragraph”.',
  },
  {
    id: 'q34',
    lessonId: 'lesson-4',
    type: 'best',
    question: 'The AI wrote too casual an email. Which follow-up is best?',
    options: [
      'No, start again.',
      'Use a formal, professional tone, and keep the date and the place.',
    ],
    correctIndex: 1,
    hint: 'Which one says what is wrong?',
    explanation:
      'It names the flaw, the fix and what to keep: the AI fixes it without changing everything.',
  },

  // --- Lesson 5 ---
  {
    id: 'q14',
    lessonId: 'lesson-5',
    type: 'true-false',
    question: 'You can use an answer from the AI without reading it again.',
    correctAnswer: false,
    hint: 'Does the AI check what it writes?',
    explanation:
      'The AI can make up information. Always read and check, especially for an official document.',
  },
  {
    id: 'q15',
    lessonId: 'lesson-5',
    type: 'mcq',
    question: 'People say the AI “hallucinates”. It means it…',
    options: [
      'Dreams while processing',
      'Makes up information that looks true',
      'Refuses to answer some questions',
    ],
    correctIndex: 1,
    hint: 'Think of a believable… but false piece of information.',
    explanation:
      'A hallucination is made-up information that looks believable. Hence the human check.',
  },
  {
    id: 'q16',
    lessonId: 'lesson-5',
    type: 'best',
    question: 'Which one will give the most useful result?',
    options: [
      'Make me a table.',
      'Format this.',
      'Compare these 3 options in a table: cost, lead time, compliance, scored from 1 to 5.',
    ],
    correctIndex: 2,
    placement: true,
    hint: 'Which one gives the columns of the table?',
    explanation:
      'It gives the task (compare), the form (table), the criteria and the way to score.',
  },
  {
    id: 'q17',
    lessonId: 'lesson-5',
    type: 'spot',
    question:
      'In this answer from the AI, which sentence should you check first?',
    prompt: 'You asked: “What are the remote-work rules in my administration?”',
    options: [
      'Remote work helps balance work and personal life.',
      'Under the decree of 11 February 2016, you are entitled to 3 days a week.',
      'It is advisable to talk about it with your manager.',
    ],
    correctIndex: 1,
    hint: 'Which one contains a date, a figure or a reference?',
    explanation:
      'A reference and a precise figure are checked at the source (the official journal, your HR department). The AI often makes up such details, or distorts them.',
  },

  // --- Lesson 6 ---
  {
    id: 'q18',
    lessonId: 'lesson-6',
    type: 'mcq',
    question: 'Why is an example in the request effective?',
    options: [
      'It makes the request longer, so better',
      'The AI understands the model and copies the form',
      'It is useless',
    ],
    correctIndex: 1,
    hint: 'What does the AI do when it sees a model?',
    explanation:
      'An example shows exactly what you expect: the form, the style, the level of detail. The AI copies it.',
  },
  {
    id: 'q19',
    lessonId: 'lesson-6',
    type: 'true-false',
    question:
      'Giving the AI a role (“answer like a front-desk officer”) mostly changes the tone, not the accuracy.',
    correctAnswer: true,
    hint: 'Does a role bring new information?',
    explanation:
      'The role steers the tone and the vocabulary. For an accurate answer, you need information and examples.',
  },
  {
    id: 'q20',
    lessonId: 'lesson-6',
    type: 'mcq',
    question: 'How many examples are usually needed?',
    options: [
      'At least 10',
      '1 to 3 are enough',
      'None, the AI always guesses',
    ],
    correctIndex: 1,
    hint: 'A model is quickly understood.',
    explanation:
      'One to three well-chosen examples are enough. Even one often makes a big difference.',
  },
  {
    id: 'q35',
    lessonId: 'lesson-6',
    type: 'best',
    question:
      'You want the AI to sort messages always the same way. Which request?',
    options: [
      'Sort these messages by urgency.',
      'Sort these messages by urgency, like these examples: “Heating breakdown” → URGENT; “Certificate” → NORMAL.',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Which one shows the categories wanted?',
    explanation:
      'The examples set the categories and the form: the AI sorts the same way every time.',
  },

  // --- Lesson 7 ---
  {
    id: 'q21',
    lessonId: 'lesson-7',
    type: 'mcq',
    question: 'Why ask the AI to “show the steps” before concluding?',
    options: [
      'So it works more slowly',
      'To see its reasoning and be able to check it',
      'So it answers in several messages',
    ],
    correctIndex: 1,
    hint: 'What do you gain?',
    explanation:
      'Recent AIs often reason on their own; seeing the steps mostly lets you spot an error.',
  },
  {
    id: 'q22',
    lessonId: 'lesson-7',
    type: 'true-false',
    question: 'For a complex job, one vague request is better than steps.',
    correctAnswer: false,
    hint: 'How do you check a big job?',
    explanation:
      'Splitting into clear steps lets you guide the AI and check each result.',
  },
  {
    id: 'q23',
    lessonId: 'lesson-7',
    type: 'mcq',
    question: 'What form should you ask for to reuse data in a spreadsheet?',
    options: [
      'A paragraph of free text',
      'A table with named columns',
      'A poem',
    ],
    correctIndex: 1,
    hint: 'Which one copies into cells?',
    explanation:
      'A table with named columns copies and checks directly. Free text is harder to reuse.',
  },
  {
    id: 'q36',
    lessonId: 'lesson-7',
    type: 'order',
    question: 'Put the steps of this job back in order.',
    pieces: [
      'Put the 3 quotes in a table',
      'Point out the big gaps',
      'Write the recommendation note',
    ],
    placement: true,
    hint: 'What do you need before you can write?',
    explanation:
      'First organise, then analyse, then write: each step builds on the previous one and can be checked.',
  },

  // --- Lesson 8 ---
  {
    id: 'q24',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: 'Adding “You are an expert” at the start of a request…',
    options: [
      'Always makes answers more accurate',
      'Has no reliable effect on accuracy; it may change the tone',
      'Stops the AI from making mistakes',
    ],
    correctIndex: 1,
    hint: 'Does this sentence give the AI any information?',
    explanation:
      'Studies found no reliable effect on accuracy. What improves the answer is information: task, context, document, form.',
  },
  {
    id: 'q25',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'If the AI quotes a law with confidence, you can use it without checking.',
    correctAnswer: false,
    hint: 'Does confidence prove anything?',
    explanation:
      'An AI can make up references in a very sure tone. Always check texts, figures and dates.',
  },
  {
    id: 'q26',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: 'Which sentence lowers the risk of made-up facts?',
    options: [
      '“Answer perfectly, it is very important”',
      '“If you are not sure, say so, and rely only on the document provided”',
      '“You will get a tip if it is right”',
    ],
    correctIndex: 1,
    placement: true,
    hint: 'Which one gives a rule you can check?',
    explanation:
      'Letting the AI say it does not know, and limiting it to the document provided, makes the answer checkable.',
  },
  {
    id: 'q27',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'The AI answers: “Under article L. 4127-12 of the code of relations between the public and the administration, the deadline is 15 days.” What do you do?',
    options: [
      'I copy the reference, it is very precise',
      'I check the article in the official source before using it',
      'I ask the AI if it is sure, and believe it',
    ],
    correctIndex: 1,
    hint: 'What is authoritative: the AI, or the official text?',
    explanation:
      'A precise reference can be made up. Only the official source is authoritative; asking the AI to confirm proves nothing.',
  },
  {
    id: 'q28',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'The AI quotes: “As the minister said on 3 March 2024: …”. This quote is…',
    options: [
      'Reliable, since it is dated',
      'To check: quotes and dates are among what the AI makes up most',
      'Reliable if it is in quotation marks',
    ],
    correctIndex: 1,
    hint: 'Does a date make a quote true?',
    explanation:
      'Quotes, dates and names are frequent inventions. Find the source before quoting.',
  },
  {
    id: 'q29',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'When the AI rephrases a text you gave it, the risk of made-up facts is lower than when it answers from memory.',
    correctAnswer: true,
    hint: 'Where does the information come from in each case?',
    explanation:
      'Relying on a document provided lowers the risk. Read it again anyway: a rephrasing can change the meaning.',
  },
  {
    id: 'q30',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'If the AI gives a figure with a decimal (“37.4%”), it is a sign it is accurate.',
    correctAnswer: false,
    hint: 'Can a made-up figure be precise?',
    explanation:
      'Apparent precision proves nothing: a made-up figure can be very precise. Check its source.',
  },
  {
    id: 'q31',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'The AI summarises a report you did not give it, quoting its conclusions. What do you do?',
    options: [
      'I use it: it probably knows the report',
      'I give it the report and ask it to rely only on it',
      'I ask it to summarise more briefly',
    ],
    correctIndex: 1,
    hint: 'Where does the AI get this summary from?',
    explanation:
      'Without the document, the AI rebuilds it from memory and may make things up. Give it the text and ask it to quote the passages used.',
  },
];

// ---------------------------------------------------------------------------
// FLASHCARDS
// ---------------------------------------------------------------------------

const flashcards: Flashcard[] = [
  // Lesson 1
  {
    id: 'fc1',
    lessonId: 'lesson-1',
    front: 'What is a request to the AI (a “prompt”)?',
    back: 'A text written to the AI to get a result. Like a brief given to a very fast intern.',
  },
  {
    id: 'fc2',
    lessonId: 'lesson-1',
    front: 'Does the AI know your work context?',
    back: 'No. It knows neither your department, nor your files, nor your habits. You have to tell it.',
  },
  {
    id: 'fc3',
    lessonId: 'lesson-1',
    front: 'Why does “Do something with this text” not work?',
    back: 'No task, no form, no recipient: the AI does not know what to do and answers at random.',
  },
  {
    id: 'fc4',
    lessonId: 'lesson-1',
    front: 'How should a request start?',
    back: 'With an action verb: summarise, write, compare, rephrase, extract.',
  },
  // Lesson 2
  {
    id: 'fc5',
    lessonId: 'lesson-2',
    front: 'What does a vague request get?',
    back: 'A vague, all-purpose answer. Vague in, vague out.',
  },
  {
    id: 'fc6',
    lessonId: 'lesson-2',
    front: 'What is the “new colleague test”?',
    back: 'Before sending: “Would a colleague who arrived this morning understand exactly what I want?” If not, add detail.',
  },
  {
    id: 'fc7',
    lessonId: 'lesson-2',
    front: 'Is a short request better?',
    back: 'Not necessarily. What counts is precision: three clear lines beat one vague word.',
  },
  {
    id: 'fc8',
    lessonId: 'lesson-2',
    front: 'An example of a vague request, then a precise one?',
    back: 'Vague: “Improve this text.” Precise: “Rephrase this text in plain language for a member of the public, in 3 short sentences.”',
  },
  // Lesson 3
  {
    id: 'fc9',
    lessonId: 'lesson-3',
    front: 'The 5 bricks of a complete request?',
    back: '1. Task (what to do)\n2. Context (why)\n3. Audience (for whom)\n4. Format (in what form)\n5. Constraints (what limits)',
  },
  {
    id: 'fc10',
    lessonId: 'lesson-3',
    front: 'Five action verbs to start with?',
    back: 'Summarise, compare, rephrase, extract, write. Avoid “handle” or “deal with”.',
  },
  {
    id: 'fc11',
    lessonId: 'lesson-3',
    front: 'What is the context for?',
    back: 'To fit the answer to your situation: “for tomorrow’s meeting”, “following a complaint”.',
  },
  {
    id: 'fc12',
    lessonId: 'lesson-3',
    front: 'What are constraints?',
    back: 'The limits: length, tone, bans. E.g. “in 5 lines at most, no jargon”.',
  },
  {
    id: 'fc13',
    lessonId: 'lesson-3',
    front: 'Why say who the answer is for?',
    back: 'The audience changes the vocabulary, the detail and the tone. A summary for a director is not one for the public.',
  },
  // Lesson 4
  {
    id: 'fc14',
    lessonId: 'lesson-4',
    front: 'Is the first request the right one?',
    back: 'Rarely. Even regular users fix it. The skill is knowing how to fix.',
  },
  {
    id: 'fc15',
    lessonId: 'lesson-4',
    front: 'How do you fix an answer?',
    back: 'In the same conversation: say what is wrong, the fix wanted, and what to keep.',
  },
  {
    id: 'fc16',
    lessonId: 'lesson-4',
    front: 'The answer is too long. What do you do?',
    back: 'Add a length: “in 5 lines at most”, “200 words”, “one paragraph”.',
  },
  {
    id: 'fc17',
    lessonId: 'lesson-4',
    front: 'The tone is wrong. What do you do?',
    back: 'Give the audience and the tone: “for a director, formal tone”, “for the public, kind tone”.',
  },
  // Lesson 5
  {
    id: 'fc18',
    lessonId: 'lesson-5',
    front: 'What is a “hallucination”?',
    back: 'Information made up by the AI that looks true. Hence the check.',
  },
  {
    id: 'fc19',
    lessonId: 'lesson-5',
    front: 'Can you use an answer without reading it again?',
    back: 'No. Always read and check, especially for an official document.',
  },
  {
    id: 'fc20',
    lessonId: 'lesson-5',
    front: 'The 6 reflexes?',
    back: '1. Be precise\n2. Give the context\n3. Say the form\n4. Think of the reader\n5. Fix\n6. Check',
  },
  // Lesson 6
  {
    id: 'fc21',
    lessonId: 'lesson-6',
    front: 'How do you always get the same form of answer?',
    back: 'Show one or two examples of the result wanted: the AI copies the model.',
  },
  {
    id: 'fc22',
    lessonId: 'lesson-6',
    front: 'What does a role (“answer like a front-desk officer”) change?',
    back: 'The tone and the vocabulary. Not the accuracy: for that, give information.',
  },
  // Lesson 7
  {
    id: 'fc23',
    lessonId: 'lesson-7',
    front: 'How do you get a big job done?',
    back: 'Split it into numbered steps (extract, organise, write) and check each result.',
  },
  {
    id: 'fc24',
    lessonId: 'lesson-7',
    front: 'Why ask to “show the steps”?',
    back: 'To see the reasoning and spot an error.',
  },
  // Lesson 8
  {
    id: 'fc25',
    lessonId: 'lesson-8',
    front: 'The two sentences that protect against made-up facts?',
    back: '“Rely only on this text and quote the passage.” “If the information is not there, say so rather than guess.”',
  },
  {
    id: 'fc26',
    lessonId: 'lesson-8',
    front: 'Does “You are an expert” make the answer more accurate?',
    back: 'No reliable effect on accuracy. What counts: the task, the context, the document.',
  },
];

export const COURSE_EN: CourseContent = { lessons, quiz, flashcards };
