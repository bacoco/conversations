// English course content, translated from the French version (fr.ts).
import type { CourseContent, Flashcard, Lesson, QuizQuestion } from '../types';

// ---------------------------------------------------------------------------
// LESSONS
// ---------------------------------------------------------------------------

const lessons: Lesson[] = [
  // --- Lesson 1 ---
  {
    id: 'lesson-1',
    title: 'A prompt, not magic',
    icon: '✨',
    slides: [
      {
        title: 'AI is not a colleague who can guess',
        icon: '🤔',
        content:
          'Artificial intelligence cannot read your mind. It does not know your department, your files or the way you work.\n\nIt does EXACTLY what you ask it to do in writing. No more, no less.',
        keyTakeaway:
          'AI is a powerful tool, but it needs clear instructions to be useful.',
      },
      {
        title: 'A prompt = a written request',
        icon: '📝',
        content:
          'When you write to the AI, you are writing a "prompt".\n\nImagine you are briefing a very fast intern who knows nothing about your department. The clearer your brief, the better the result.',
        keyTakeaway:
          'A prompt is simply a written request. You do not need to be an expert.',
      },
      {
        title: 'The difference is huge',
        icon: '💡',
        content:
          'See how the same task gives completely different results depending on the prompt.',
        example: {
          bad: 'Do something with this text.',
          good: 'Summarise this text in 5 lines for an email to my manager. Keep only the decisions and the deadlines.',
          note: 'The second prompt specifies the task, the format, the recipient and what to keep.',
        },
      },
    ],
  },

  // --- Lesson 2 ---
  {
    id: 'lesson-2',
    title: 'Vague in = vague out',
    icon: '🌫️',
    slides: [
      {
        title: 'The golden rule',
        icon: '⚖️',
        content:
          'If you ask for something vague, you get something vague.\n\nThe AI cannot guess what you really want. It will produce a "likely" answer — in other words, generic and often useless.',
        keyTakeaway:
          'Vague input = vague output. This is the first rule to remember.',
      },
      {
        title: 'Demonstration',
        icon: '🔍',
        content: 'Compare these two approaches on the same document:',
        example: {
          bad: 'Improve this text.',
          good: 'Rewrite this legal text in plain language for a member of the public with no legal training. Use short sentences and a friendly tone. 3 paragraphs maximum.',
          note: 'A precise prompt turns a generic result into one you can use straight away.',
        },
      },
      {
        title: 'The "new colleague" test',
        icon: '🧑‍💼',
        content:
          'Before sending your prompt, ask yourself:\n\n"Would a new colleague joining my department understand exactly what I want?"\n\nIf the answer is no, your prompt is not precise enough.',
        keyTakeaway:
          'If a person would not understand your request, the AI will not understand it either.',
      },
    ],
  },

  // --- Lesson 3 ---
  {
    id: 'lesson-3',
    title: 'The 5 building blocks of a good prompt',
    icon: '🧱',
    slides: [
      {
        title: 'Overview',
        icon: '🗺️',
        content:
          'A good prompt combines up to 5 elements:\n\n1. **The task** — what do you want?\n2. **The context** — why, and in what setting?\n3. **The format** — how should the result be presented?\n4. **The audience** — who is it for?\n5. **The constraints** — what limits apply?\n\nYou do not need all 5 every time. But the more you add, the better the result.',
        keyTakeaway:
          'Task + Context + Format + Audience + Constraints = an effective prompt.',
      },
      {
        title: 'The task: what do you want?',
        icon: '🎯',
        content:
          'Always start with a clear action verb:\n\n- **Summarise** this document\n- **Compare** these three options\n- **Rewrite** this paragraph\n- **Extract** the decisions\n- **Draft** an email\n\nAvoid vague verbs: "process", "handle", "do something with".',
        example: {
          bad: 'Process these meeting minutes.',
          good: 'Extract the 5 main decisions from these meeting minutes.',
        },
      },
      {
        title: 'The context: why?',
        icon: '📁',
        content:
          'Explain the situation so the AI can tailor its answer:\n\n- "As part of the ATLAS project..."\n- "For tomorrow\'s team meeting..."\n- "Following the director\'s request..."\n\nContext helps the AI choose the right level of detail, the right vocabulary and the right structure.',
        keyTakeaway:
          'Context lets the AI produce an answer suited to your actual situation.',
      },
      {
        title: 'The format and the audience',
        icon: '📊',
        content:
          '**The format** says HOW to present the result:\n- "As a table"\n- "As a bulleted list"\n- "As a structured email with a subject line"\n- "In 3 paragraphs"\n\n**The audience** says WHO it is for:\n- "For a non-technical director"\n- "For a member of the public"\n- "For the project team"',
        example: {
          bad: 'Give me the important info.',
          good: 'Present the key information as a table with 3 columns: Decision, Owner, Deadline. For the director.',
        },
      },
      {
        title: 'The constraints',
        icon: '🛠️',
        content:
          'Constraints set the limits:\n\n- **Length**: "5 lines maximum", "200 words"\n- **Tone**: "professional", "friendly", "formal"\n- **Exclusions**: "no technical jargon", "do not cite articles of law"\n- **Language**: "in English", "simple vocabulary"\n\nConstraints stop the AI from heading in a direction you do not want.',
        keyTakeaway:
          'Constraints keep the AI on track and prevent off-topic results.',
      },
    ],
  },

  // --- Lesson 4 ---
  {
    id: 'lesson-4',
    title: 'Improving is normal',
    icon: '🔄',
    slides: [
      {
        title: 'The first attempt is never perfect',
        icon: '🎯',
        content:
          'Even experts rewrite their prompts. It is not a failure, it is the normal process.\n\nThe goal is not to get it right first time.\nThe goal is to know **how to improve**.',
        keyTakeaway:
          'Iterating is the most important skill. Do not aim for perfection on the first try.',
      },
      {
        title: 'The improvement loop',
        icon: '🔄',
        content:
          'The cycle is always the same:\n\n1. Write a prompt\n2. Read the result\n3. Identify what is wrong\n4. Change the prompt\n5. Run it again\n\nRepeat until you are satisfied. Usually, 2-3 iterations are enough.',
        keyTakeaway:
          'Write → Read → Fix → Run again. That is how to use AI well.',
      },
      {
        title: 'Tips for fixing a prompt',
        icon: '💡',
        content:
          'A few simple reflexes when the result is not right:\n\n- **Too long?** → Add "in X lines maximum"\n- **Wrong tone?** → Specify the audience and the register\n- **Missing information?** → Add context\n- **Wrong format?** → Ask for the format explicitly\n- **Off topic?** → Rewrite the task more precisely',
      },
    ],
  },

  // --- Lesson 5 ---
  {
    id: 'lesson-5',
    title: 'Check and adapt',
    icon: '✅',
    slides: [
      {
        title: 'AI can make mistakes',
        icon: '⚠️',
        content:
          'AI can make up information that looks true (these are called "hallucinations").\n\nIt does not check its sources. It may not know the latest legislation or internal procedures.\n\nIt is up to YOU to check the content before using it.',
        keyTakeaway:
          'Never trust it blindly. Always reread the result before using it.',
      },
      {
        title: 'Adapt to the need',
        icon: '🔧',
        content:
          'Each type of task calls for specific adjustments:\n\n- **Summary** → Specify the length and the key points to keep\n- **Email** → Specify the recipient, the tone and the structure\n- **Table** → Specify the columns and the criteria\n- **Rewriting** → Specify the target audience and the level of language\n- **Analysis** → Specify the angles and the output format',
      },
      {
        title: 'The 6 reflexes to remember',
        icon: '🏆',
        content:
          '1. **Be precise** in your request\n2. **Give context** (why, for whom, in what setting)\n3. **Specify the format** you expect (table, email, list...)\n4. **Think about the recipient** (adapt the tone and vocabulary)\n5. **Reread and improve** (iterate on your prompt)\n6. **Always check** the result before using it',
        keyTakeaway:
          'These 6 reflexes are enough to get useful results in 90% of cases.',
      },
    ],
  },

  // --- Lesson 6 ---
  {
    id: 'lesson-6',
    title: 'Giving the AI examples',
    icon: '📋',
    slides: [
      {
        title: 'Why examples change everything',
        icon: '🎯',
        content:
          'Showing an example of the result you expect is one of the most powerful ways to guide the AI.\n\nIt is like showing a cook a photo of the finished dish rather than just saying "make something nice".',
        keyTakeaway:
          'An example is worth a thousand words. Show the AI what the result should look like.',
      },
      {
        title: 'The "few-shot" technique',
        icon: '💡',
        content:
          'By giving 1 to 3 input/output examples, the AI understands the PATTERN to follow.\n\nThis is known as the "few-shot" technique (a few examples). You do not need to know the term — just remember: show an example, and the AI will do the same.',
        example: {
          bad: 'Sort these emails by urgency.',
          good: 'Sort these emails by urgency. Example:\n- "Server down" → URGENT\n- "Meeting postponed" → NORMAL\n- "Software update" → LOW\n\nNow sort: "Water leak on the 3rd floor"',
          note: 'With the examples, the AI understands exactly the categories and the format expected.',
        },
      },
      {
        title: 'Giving the AI a role',
        icon: '🎭',
        content:
          'You can ask the AI to take on a specific role:\n\n- "As a legal expert..."\n- "You are a specialist press writer..."\n- "Act as a supportive trainer..."\n\nThe role shapes the vocabulary, the level of detail and the style of the answer.',
        keyTakeaway:
          'Giving the AI a role is like choosing the right person to talk to: a doctor does not answer like an accountant.',
      },
    ],
  },

  // --- Lesson 7 ---
  {
    id: 'lesson-7',
    title: 'Advanced techniques',
    icon: '🚀',
    slides: [
      {
        title: 'Reasoning step by step',
        icon: '🧠',
        content:
          'For complex problems (calculations, analyses, comparisons), ask the AI to **reason step by step**.\n\nSimply add: "Reason step by step before concluding" or "Show your reasoning".\n\nThis is called "chain of thought" and it helped older models a lot. Recent models often reason on their own already: the main benefit now is to **see the steps so you can check them**.',
        example: {
          bad: 'Is the budget on track?',
          good: 'Analyse this budget step by step:\n1. Calculate total spending\n2. Compare it with the initial budget\n3. Identify the gap\n4. Suggest solutions',
          note: 'By breaking it down, the AI makes fewer reasoning errors.',
        },
      },
      {
        title: 'Breaking a problem down',
        icon: '🧩',
        content:
          'If your request is too complex for a single prompt, **split it into steps**:\n\n1. First, extract the key information\n2. Next, organise it\n3. Then, draft the final document\n\nEach step can be a separate prompt, or you can put everything in a single prompt with numbered steps.',
        keyTakeaway:
          'Breaking a complex problem into simple sub-tasks is THE skill that separates a beginner from an advanced user.',
      },
      {
        title: 'Asking for structured output (JSON, tables)',
        icon: '📊',
        content:
          'AI can produce structured formats:\n\n- **Tables**: "Present this as a table with columns X, Y, Z"\n- **JSON**: "Return the data as valid JSON with the fields..."\n- **Numbered lists**: "List the 5 points, numbered"\n- **Markdown**: "Use headings and subheadings"\n\nStructured formats are easier to reuse and to check.',
        keyTakeaway:
          'The more precise the format, the more directly usable the result.',
      },
    ],
  },
  {
    id: 'lesson-8',
    title: 'What really works',
    icon: '\uD83E\uDDEA',
    slides: [
      {
        title: 'Magic formulas are not enough',
        icon: '\u2728',
        content:
          'Recent studies tested the popular "tricks": **"You are an expert"**, promising a tip, threatening the AI, being very polite.\n\nResult: **no reliable effect on the accuracy** of answers. A role can help with **tone**, not with correctness.\n\nWhat really counts is the **information** you give: the task, the context, the reference document, the format.',
        example: {
          bad: 'You are the best legal expert in the world. Answer perfectly.',
          good: 'Explain to a front-desk agent, in 10 lines, what the decree below changes for vehicle registration requests.\n\n"""\n[paste the decree]\n"""',
          note: 'The second version does not flatter the AI: it gives it what it needs.',
        },
      },
      {
        title: 'AI is wrong with confidence',
        icon: '\u26A0\uFE0F',
        content:
          "An AI can **invent** a law article, a figure or a reference, in a perfectly confident tone.\n\nThe State's guide says so: it can quote texts that do not exist. Even when it quotes a source, the quote is not always accurate.\n\nSo **always** check figures, dates, names and references before using them.",
        keyTakeaway:
          'A confident answer is not a true answer: facts must be checked.',
      },
      {
        title: 'Two sentences that protect you',
        icon: '\uD83D\uDEE1\uFE0F',
        content:
          'Add to your important prompts:\n\n- **"If information is missing or you are not sure, say so instead of guessing."** The AI is allowed not to know.\n- **"Rely only on the document provided and quote the passage you use."** You will be able to check.\n\nAnd when your request is vague, start with: **"Ask me the questions you need before answering."**',
        keyTakeaway:
          'In the Coach, the "Make it cautious" and "Questions first" buttons add these sentences for you.',
      },
      {
        title: 'One try proves nothing',
        icon: '\uD83D\uDD01',
        content:
          'The same request, worded a little differently, can give a very different answer.\n\nIf an answer disappoints you, do not conclude the AI "cannot do it": **rephrase**, add context or give an example, then compare.\n\nComparing two wordings is how you learn what works for your own tasks.',
        keyTakeaway:
          'Iterating and comparing beats looking for THE perfect formula.',
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
    question: 'What is an AI prompt?',
    options: [
      'A complex computer program you have to install',
      'A written request addressed to the AI to get a result',
      'A machine learning algorithm',
    ],
    correctIndex: 1,
    explanation:
      'A prompt is simply a written request. You do not need technical skills — you just need to explain clearly what you want.',
  },
  {
    id: 'q2',
    lessonId: 'lesson-1',
    type: 'true-false',
    question:
      'The AI automatically understands the context of your work and your department.',
    correctAnswer: false,
    explanation:
      'The AI knows nothing about your working environment. It does not know which department you work in, which project, or who the work is for. You always need to give it the context.',
  },
  {
    id: 'q3',
    lessonId: 'lesson-1',
    type: 'true-false',
    question:
      'The AI can be compared to a very fast intern who knows nothing about your department.',
    correctAnswer: true,
    explanation:
      'That is a good analogy! The AI is fast and capable, but it needs a clear, detailed brief to do good work.',
  },

  // --- Lesson 2 ---
  {
    id: 'q4',
    lessonId: 'lesson-2',
    type: 'mcq',
    question: 'Which prompt will give the best result?',
    options: [
      'Improve this text.',
      'Do something good with this.',
      'Rewrite this text in plain language for a member of the public, in 3 short sentences.',
    ],
    correctIndex: 2,
    explanation:
      'The third prompt specifies the task (rewrite), the audience (a member of the public), the register (plain) and the format (3 short sentences). The first two are too vague.',
  },
  {
    id: 'q5',
    lessonId: 'lesson-2',
    type: 'true-false',
    question: 'The shorter a prompt, the better it is.',
    correctAnswer: false,
    explanation:
      'A short prompt is not necessarily better. What matters is precision. A well-structured 3-line prompt is better than a one-word prompt.',
  },
  {
    id: 'q6',
    lessonId: 'lesson-2',
    type: 'mcq',
    question:
      'What is the best test to know whether your prompt is clear enough?',
    options: [
      'Check that it is under 20 words',
      'Ask yourself whether a new colleague would understand exactly what you want',
      'Check that it contains technical terms',
    ],
    correctIndex: 1,
    explanation:
      'The "new colleague test" is the best reflex: if a person would not understand your request, the AI will not understand it either.',
  },

  // --- Lesson 3 ---
  {
    id: 'q7',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'What are the 5 building blocks of a good prompt?',
    options: [
      'Subject, verb, object, adjective, adverb',
      'Task, context, format, audience, constraints',
      'Introduction, body, conclusion, appendix, references',
    ],
    correctIndex: 1,
    explanation:
      'The 5 building blocks are: the Task (what to do), the Context (why), the Format (how to present it), the Audience (who it is for) and the Constraints (what limits apply).',
  },
  {
    id: 'q8',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: '"Summarise this text" — what is missing from this prompt?',
    options: [
      'The task',
      'The context, the format and the audience',
      'Nothing, it is enough',
    ],
    correctIndex: 1,
    explanation:
      'The task is there (summarise), but the context (why?), the format (how many lines? list or paragraph?) and the audience (who for?) are missing.',
  },
  {
    id: 'q9',
    lessonId: 'lesson-3',
    type: 'mcq',
    question: 'Which element specifies "how to present the result"?',
    options: ['The task', 'The context', 'The format'],
    correctIndex: 2,
    explanation:
      'The format specifies the shape of the result: table, bulleted list, structured email, number of lines, etc.',
  },
  {
    id: 'q10',
    lessonId: 'lesson-3',
    type: 'true-false',
    question:
      'Mentioning the target audience in the prompt has no effect on the answer.',
    correctAnswer: false,
    explanation:
      'The target audience changes everything: vocabulary, level of detail, tone. A summary for a director and a summary for a technician will be very different.',
  },

  // --- Lesson 4 ---
  {
    id: 'q11',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: 'After a disappointing first result, what should you do?',
    options: [
      'Give up and write it yourself',
      'Run exactly the same prompt again and hope for better',
      'Reread the result, identify what is missing, improve the prompt',
    ],
    correctIndex: 2,
    explanation:
      'The right approach is the improvement loop: read the result, identify the problem, fix the prompt and run it again. This is the normal process, even for experts.',
  },
  {
    id: 'q12',
    lessonId: 'lesson-4',
    type: 'true-false',
    question: 'AI experts always write the perfect prompt on the first try.',
    correctAnswer: false,
    explanation:
      'Even experts iterate on their prompts. The first attempt is rarely perfect. The skill lies in knowing how to improve, not in getting it right first time.',
  },
  {
    id: 'q13',
    lessonId: 'lesson-4',
    type: 'mcq',
    question: "The AI's result is too long. What do you change in your prompt?",
    options: [
      'The context',
      'The length constraint (e.g. "5 lines maximum")',
      'The target audience',
    ],
    correctIndex: 1,
    explanation:
      'To control length, add an explicit constraint: "in X lines", "200 words maximum", "one paragraph". It is the most direct reflex.',
  },

  // --- Lesson 5 ---
  {
    id: 'q14',
    lessonId: 'lesson-5',
    type: 'true-false',
    question: 'You can always trust AI-generated content without checking it.',
    correctAnswer: false,
    explanation:
      'AI can make up information (hallucinations). You must ALWAYS reread and check the content before using it, especially for official documents.',
  },
  {
    id: 'q15',
    lessonId: 'lesson-5',
    type: 'mcq',
    question: 'The AI "hallucinates". This means that it...',
    options: [
      'Dreams while processing',
      'Makes up information that seems true but is false',
      'Refuses to answer certain questions',
    ],
    correctIndex: 1,
    explanation:
      'Hallucinations are pieces of information made up by the AI that look credible. That is why human checking is essential.',
  },
  {
    id: 'q16',
    lessonId: 'lesson-5',
    type: 'mcq',
    question: 'Which prompt is the best structured?',
    options: [
      'Make me a table.',
      'Format this.',
      'Compare these 3 options in a table using the criteria cost, timeline and compliance. Score each criterion from 1 to 5.',
    ],
    correctIndex: 2,
    explanation:
      'The third prompt specifies the task (compare), the format (table), the criteria (cost, timeline, compliance) and the scoring method (1 to 5). The first two are too vague.',
  },
  {
    id: 'q17',
    lessonId: 'lesson-5',
    type: 'true-false',
    question:
      "Including an example of the expected result in the prompt can improve the AI's answer.",
    correctAnswer: true,
    explanation:
      'Examples are an excellent way to guide the AI. Showing what the result should look like (even partially) significantly improves the quality of the answer.',
  },

  // --- Lesson 6 ---
  {
    id: 'q18',
    lessonId: 'lesson-6',
    type: 'mcq',
    question: 'Why is giving an example in your prompt effective?',
    options: [
      'It makes the prompt longer, and therefore better',
      'The AI understands the pattern to follow and reproduces the format',
      'The AI does not need examples, it is pointless',
    ],
    correctIndex: 1,
    explanation:
      'An example shows the AI exactly what you expect: the format, the style, the level of detail. This is the "few-shot" technique, one of the most effective.',
  },
  {
    id: 'q19',
    lessonId: 'lesson-6',
    type: 'true-false',
    question:
      'Giving the AI a role (e.g. "You are a legal expert") changes the quality of the answer.',
    correctAnswer: true,
    explanation:
      'The role shapes the vocabulary, the level of detail and the style. A "legal expert" will answer with precision and references; a "science communicator" will answer in plain language.',
  },
  {
    id: 'q20',
    lessonId: 'lesson-6',
    type: 'mcq',
    question:
      'How many examples do you need to give for the AI to understand the pattern?',
    options: [
      'At least 10 examples',
      '1 to 3 examples are usually enough',
      'None, the AI always guesses',
    ],
    correctIndex: 1,
    explanation:
      'The "few-shot" technique works with 1 to 3 examples. Beyond that, the gains are marginal. Even a single well-chosen example makes a big difference.',
  },

  // --- Lesson 7 ---
  {
    id: 'q21',
    lessonId: 'lesson-7',
    type: 'mcq',
    question: 'What does "reasoning step by step" mean for the AI?',
    options: [
      'The AI works more slowly',
      'The AI shows its intermediate reasoning before concluding, which reduces errors',
      'The AI splits its answer into several messages',
    ],
    correctIndex: 1,
    explanation:
      '"Chain of thought" asks the AI to spell out each step of its reasoning. This greatly reduces errors, especially for calculations and complex analyses.',
  },
  {
    id: 'q22',
    lessonId: 'lesson-7',
    type: 'true-false',
    question:
      'For a complex problem, it is better to put everything in a single vague prompt than to break it down into steps.',
    correctAnswer: false,
    explanation:
      'Breaking a complex problem into clear sub-tasks is THE advanced skill. Each step can be handled separately or numbered within a single structured prompt.',
  },
  {
    id: 'q23',
    lessonId: 'lesson-7',
    type: 'mcq',
    question:
      'Which format should you ask for to get data you can reuse in a tool?',
    options: [
      'A paragraph of free text',
      'A structured format such as JSON, a table or a numbered list',
      'A poem',
    ],
    correctIndex: 1,
    explanation:
      'Structured formats (JSON, tables, lists) can be used directly by tools, databases or spreadsheets. Free text is harder to reuse.',
  },
  {
    id: 'q24',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: 'Adding "You are an expert" at the start of a prompt…',
    options: [
      'Always makes answers more accurate',
      'Has no reliable effect on accuracy; it can only change the tone',
      'Stops the AI from making mistakes',
    ],
    correctIndex: 1,
    explanation:
      'Studies found no reliable effect on accuracy. What improves answers is the information given: task, context, document, format.',
  },
  {
    id: 'q25',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'If the AI quotes a law article confidently, you can use it without checking.',
    correctAnswer: false,
    explanation:
      'An AI can invent references in a very confident tone. Always check texts, figures and dates.',
  },
  {
    id: 'q26',
    lessonId: 'lesson-8',
    type: 'mcq',
    question: 'Which sentence reduces the risk of invention?',
    options: [
      '"Answer perfectly, it is very important"',
      '"If you are not sure, say so, and rely only on the document provided"',
      '"You will get a tip if it is right"',
    ],
    correctIndex: 1,
    explanation:
      'Allowing the AI to say it does not know and limiting it to the document provided makes the answer checkable.',
  },
  {
    id: 'q27',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'True or invented? The AI answers: "According to article L. 4127-12 of the code governing relations between the public and the administration, the deadline is 15 days." What do you do?',
    options: [
      'I copy the reference, it is very precise',
      'I check the article on the official legal database before using it',
      'I ask the AI if it is sure and trust it',
    ],
    correctIndex: 1,
    explanation:
      'A precise reference can be invented. Only the official source counts; asking the AI to confirm proves nothing.',
  },
  {
    id: 'q28',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'True or invented? The AI quotes: "As the minister stated on 3 March 2024: …". This quote is…',
    options: [
      'Reliable, since it is dated',
      'To be checked: quotes and dates are among what AI invents most',
      'Reliable if the text is in quotation marks',
    ],
    correctIndex: 1,
    explanation:
      'Quotes, dates and proper names are frequent inventions. Find the source before quoting.',
  },
  {
    id: 'q29',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'True or invented? When the AI rephrases the text you gave it, adding nothing, the risk of invention is lower than when it answers from memory.',
    correctAnswer: true,
    explanation:
      'Relying on a provided document reduces the risk of invention. Still reread it: a rephrasing can change the meaning.',
  },
  {
    id: 'q30',
    lessonId: 'lesson-8',
    type: 'true-false',
    question:
      'True or invented? If the AI gives a figure with a decimal ("37.4%"), it is a sign that it is accurate.',
    correctAnswer: false,
    explanation:
      'Apparent precision proves nothing: an invented figure can be very precise. Check where the figure comes from.',
  },
  {
    id: 'q31',
    lessonId: 'lesson-8',
    type: 'mcq',
    question:
      'True or invented? The AI summarises a report you did not give it, quoting its conclusions. What do you do?',
    options: [
      'I use it: it probably knows the report',
      'I give it the report and ask it to rely only on it',
      'I ask it for a shorter summary',
    ],
    correctIndex: 1,
    explanation:
      'Without the document, the AI reconstructs from memory and can invent. Give it the text and ask it to quote the passages used.',
  },
];

// ---------------------------------------------------------------------------
// FLASHCARDS
// ---------------------------------------------------------------------------

// --- Flashcards ---

const flashcards: Flashcard[] = [
  // Lesson 1
  {
    id: 'fc1',
    lessonId: 'lesson-1',
    front: 'What is a prompt?',
    back: 'A written request addressed to the AI to get a result. Like a brief given to a fast intern.',
  },
  {
    id: 'fc2',
    lessonId: 'lesson-1',
    front: 'Does the AI understand your work context?',
    back: 'No. The AI knows nothing about your department, your projects or the way you work. You have to explain EVERYTHING.',
  },
  {
    id: 'fc3',
    lessonId: 'lesson-1',
    front: 'Why is "Do something with this text" a bad prompt?',
    back: 'No goal, no format, no guidance. The AI does not know what to do and produces a generic result.',
  },
  {
    id: 'fc4',
    lessonId: 'lesson-1',
    front: 'What can the AI be compared to?',
    back: 'A very fast intern who knows nothing about your department. The clearer the brief, the better the result.',
  },
  // Lesson 2
  {
    id: 'fc5',
    lessonId: 'lesson-2',
    front: 'What happens with a vague prompt?',
    back: 'You get a vague, generic answer. Vague in = vague out.',
  },
  {
    id: 'fc6',
    lessonId: 'lesson-2',
    front: 'What is the "new colleague test"?',
    back: 'Before sending your prompt, ask yourself: "Would a new colleague understand exactly what I want?" If not, be more precise.',
  },
  {
    id: 'fc7',
    lessonId: 'lesson-2',
    front: 'Is a short prompt better than a long one?',
    back: 'Not necessarily. What matters is PRECISION, not length. 3 precise lines > 1 vague word.',
  },
  {
    id: 'fc8',
    lessonId: 'lesson-2',
    front: 'Give an example of a vague vs a precise prompt',
    back: 'Vague: "Improve this text." Precise: "Rewrite this text in plain language for a member of the public, in 3 short sentences."',
  },
  // Lesson 3
  {
    id: 'fc9',
    lessonId: 'lesson-3',
    front: 'What are the 5 building blocks of a good prompt?',
    back: '1. Task (what to do)\n2. Context (why)\n3. Format (how to present it)\n4. Audience (who it is for)\n5. Constraints (what limits apply)',
  },
  {
    id: 'fc10',
    lessonId: 'lesson-3',
    front: 'Give 5 action verbs to start a prompt',
    back: 'Summarise, Compare, Rewrite, Extract, Draft. Avoid vague verbs such as "process" or "handle".',
  },
  {
    id: 'fc11',
    lessonId: 'lesson-3',
    front: 'What is the "context" in a prompt for?',
    back: 'It lets the AI tailor its answer to your actual situation: "for a meeting", "as part of project X".',
  },
  {
    id: 'fc12',
    lessonId: 'lesson-3',
    front: 'What are the "constraints" in a prompt?',
    back: 'The limits you set: maximum length, tone, banned words, style. E.g. "5 lines max, no technical jargon".',
  },
  {
    id: 'fc13',
    lessonId: 'lesson-3',
    front: 'Why specify the target audience?',
    back: 'The audience changes everything: vocabulary, level of detail, tone. A summary for a director ≠ a summary for a technician.',
  },
  // Lesson 4
  {
    id: 'fc14',
    lessonId: 'lesson-4',
    front: 'Is the first prompt always the right one?',
    back: 'No, almost never. Even experts iterate. What matters is not getting it right first time but knowing HOW to improve.',
  },
  {
    id: 'fc15',
    lessonId: 'lesson-4',
    front: 'What is the improvement loop?',
    back: '1. Write a prompt\n2. Read the result\n3. Identify what is wrong\n4. Change the prompt\n5. Run it again',
  },
  {
    id: 'fc16',
    lessonId: 'lesson-4',
    front: 'The result is too long. What should you do?',
    back: 'Add a length constraint: "5 lines maximum", "200 words", "a single paragraph".',
  },
  {
    id: 'fc17',
    lessonId: 'lesson-4',
    front: 'The tone is not right. What should you do?',
    back: 'Specify the audience and the register: "for a director, formal tone" or "for a member of the public, friendly and simple tone".',
  },
  // Lesson 5
  {
    id: 'fc18',
    lessonId: 'lesson-5',
    front: 'What is an AI "hallucination"?',
    back: 'The AI makes up information that SEEMS true but is false. That is why you must always check.',
  },
  {
    id: 'fc19',
    lessonId: 'lesson-5',
    front: 'Can you trust the AI without checking?',
    back: 'NEVER. Always reread and check before using it, especially for official documents.',
  },
  {
    id: 'fc20',
    lessonId: 'lesson-5',
    front: 'The 6 reflexes of a good prompt',
    back: '1. Be precise\n2. Give context\n3. Specify the format\n4. Think about the recipient\n5. Reread and improve\n6. Always check',
  },
];

export const COURSE_EN: CourseContent = { lessons, quiz, flashcards };
