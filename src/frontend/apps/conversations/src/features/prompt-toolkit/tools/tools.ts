import type { TFunction } from 'i18next';

/**
 * Everyday tools: each one turns a few choices and an optional source text
 * into a well-built prompt, placed in the chat input for the user to send.
 */

export interface ToolChoice {
  id: string;
  label: string;
  /** How the choice is phrased inside the prompt. */
  instruction: string;
}

export interface ToolOptionGroup {
  id: string;
  label: string;
  /** The block of the request it writes; the instruction by default. */
  part?: PromptPartKind;
  choices: ToolChoice[];
}

export interface ToolSource {
  label: string;
  placeholder: string;
  /** Used in the prompt when the user leaves the field empty. */
  fallback: string;
}

/**
 * The four parts of a good request, after the guide on AI for public
 * servants: each part of a prompt is shown in its own colour.
 */
export type PromptPartKind = 'context' | 'instruction' | 'format' | 'document';

export interface PromptPart {
  kind: PromptPartKind;
  text: string;
}

export interface DailyTool {
  id: string;
  icon: string;
  title: string;
  description: string;
  source: ToolSource;
  options: ToolOptionGroup[];
  /** Builds the prompt from the chosen instructions and the source text. */
  build: (choices: Record<string, string>, source: string) => string;
  /** The same prompt, part by part, to explain what each part is for. */
  parts?: (choices: Record<string, string>, source: string) => PromptPart[];
}

const block = (source: string) => `\n\n"""\n${source}\n"""`;

/** "Improve with Nestor": the rework goes through Nestor's questions. */
export const IMPROVE_CHOICE = 'improve';

/** The prompt sent: its parts one after the other, the text quoted last. */
export const joinParts = (parts: PromptPart[]) =>
  parts
    .map((part) =>
      part.kind === 'document' ? `"""\n${part.text}\n"""` : part.text,
    )
    .join('\n\n');

/** A tool written part by part: its prompt is the parts joined. */
const byParts = (
  parts: (choices: Record<string, string>, source: string) => PromptPart[],
) => ({
  parts,
  build: (choices: Record<string, string>, source: string) =>
    joinParts(parts(choices, source)),
});

export const getDailyTools = (t: TFunction): DailyTool[] => {
  const pastedText: ToolSource = {
    label: t('Text to work on'),
    placeholder: t('Paste the text here (optional)'),
    fallback: t('[paste the text here]'),
  };

  // A short instruction first: the detailed one is for later, when
  // the user is ready for it.
  const level: ToolOptionGroup = {
    id: 'level',
    part: 'instruction',
    label: t('Level of detail'),
    choices: [
      { id: 'simple', label: t('Simple'), instruction: 'simple' },
      { id: 'complete', label: t('Complete'), instruction: 'complete' },
    ],
  };

  return [
    {
      id: 'email-reply',
      icon: 'mail',
      title: t('Reply to an email'),
      description: t('A clear and courteous answer to a message you received.'),
      source: {
        label: t('Email received'),
        placeholder: t('Paste the email you received (optional)'),
        fallback: t('[paste the email received here]'),
      },
      options: [
        {
          id: 'sender',
          part: 'context',
          label: t('Who wrote to you'),
          choices: [
            {
              id: 'citizen',
              label: t('A member of the public'),
              instruction: t(
                'I work in an administration and I must reply to an email from a member of the public.',
              ),
            },
            {
              id: 'colleague',
              label: t('A colleague'),
              instruction: t(
                'I work in an administration and I must reply to an email from a colleague.',
              ),
            },
            {
              id: 'management',
              label: t('My management'),
              instruction: t(
                'I work in an administration and I must reply to an email from my management.',
              ),
            },
            {
              id: 'partner',
              label: t('A partner'),
              instruction: t(
                'I work in an administration and I must reply to an email from an outside partner (a company, an association, another administration).',
              ),
            },
          ],
        },
        {
          id: 'intent',
          label: t('Goal'),
          choices: [
            {
              id: 'answer',
              label: t('Reply to it'),
              instruction: t('answer the request'),
            },
            {
              id: 'confirm',
              label: t('Confirm'),
              instruction: t('confirm what is asked'),
            },
            {
              id: 'remind',
              label: t('Follow up'),
              instruction: t('politely follow up on a pending request'),
            },
            {
              id: 'decline',
              label: t('Decline politely'),
              instruction: t('decline politely and explain why'),
            },
            {
              id: 'clarify',
              label: t('Ask for details'),
              instruction: t('ask for the missing details'),
            },
          ],
        },
        level,
        {
          id: 'tone',
          part: 'format',
          label: t('Tone'),
          choices: [
            { id: 'cordial', label: t('Cordial'), instruction: t('cordial') },
            { id: 'formal', label: t('Formal'), instruction: t('formal') },
          ],
        },
        {
          id: 'length',
          part: 'format',
          label: t('Length'),
          choices: [
            {
              id: 'short',
              label: t('Short'),
              instruction: t('short: five lines at most'),
            },
            {
              id: 'standard',
              label: t('Standard'),
              instruction: t('about ten lines'),
            },
            {
              id: 'detailed',
              label: t('Detailed'),
              instruction: t('detailed, one paragraph per point'),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.sender },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t(
                  'Write a reply to this email to {{intent}}. Invent nothing: write TO COMPLETE where information is missing.',
                  { intent: c.intent },
                )
              : t(
                  'Write a reply to the email below. Goal: {{intent}}. Begin by apologising for the trouble, without judging the sender\'s tone. Present what the sender says as what they say ("You tell us that…"), never as a fact checked by the administration. Use only the facts given here: no cause of a delay, state of the file, procedure, website, date, figure or contact that is not in the email, and no conclusion about the file; where the reply needs one, write TO COMPLETE followed by what to check. Promise nothing, not even what will be done next; if useful, end by asking them to reply with their file number, if they have one.',
                  { intent: c.intent },
                ),
        },
        {
          kind: 'format',
          text: t('Tone: {{tone}}. Length: {{length}}.', {
            tone: c.tone,
            length: c.length,
          }),
        },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'rewrite',
      icon: 'edit_note',
      title: t('Rework a text'),
      description: t(
        'Plain language, shorter, corrected, more formal, or improved with Nestor.',
      ),
      source: pastedText,
      options: [
        {
          id: 'readers',
          part: 'context',
          label: t('For'),
          choices: [
            {
              id: 'public',
              label: t('General public'),
              instruction: t(
                'Here is a text I wrote for my work. It is for the general public.',
              ),
            },
            {
              id: 'colleagues',
              label: t('My colleagues'),
              instruction: t(
                'Here is a text I wrote for my work. It is for my colleagues.',
              ),
            },
            {
              id: 'management',
              label: t('My management'),
              instruction: t(
                'Here is a text I wrote for my work. It is for my management.',
              ),
            },
            {
              id: 'partner',
              label: t('A partner'),
              instruction: t(
                'Here is a text I wrote for my work. It is for an outside partner.',
              ),
            },
          ],
        },
        {
          id: 'action',
          label: t('Action'),
          choices: [
            {
              id: 'plain',
              label: t('Plain language'),
              instruction: t(
                'rewrite it in plain language for the general public: short sentences, no jargon',
              ),
            },
            {
              id: 'shorten',
              label: t('Shorten'),
              instruction: t(
                'make it about half as long without losing any key information',
              ),
            },
            {
              id: 'correct',
              label: t('Correct'),
              instruction: t(
                'correct spelling, grammar and punctuation only, without changing the style',
              ),
            },
            {
              id: 'formal',
              label: t('More formal'),
              instruction: t('make the tone more formal and professional'),
            },
            {
              id: 'bullets',
              label: t('Bullet points'),
              instruction: t('turn it into a clear bullet-point list'),
            },
            {
              id: IMPROVE_CHOICE,
              label: t('Improve with Nestor'),
              instruction: t(
                'make it clearer and more convincing, keeping its meaning',
              ),
            },
          ],
        },
        level,
        {
          id: 'output',
          part: 'format',
          label: t('Expected result'),
          choices: [
            {
              id: 'only',
              label: t('The text only'),
              instruction: t('Give only the reworked text, ready to use.'),
            },
            {
              id: 'changes',
              label: t('The text and the changes'),
              instruction: t(
                'Give the reworked text, then the list of the changes made.',
              ),
            },
            {
              id: 'two',
              label: t('Two versions'),
              instruction: t(
                'Give two versions to choose from, each ready to use.',
              ),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.readers },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('Rework this text: {{action}}.', { action: c.action })
              : t(
                  'Rework the text below: {{action}}. Keep every fact, date and amount unchanged.',
                  { action: c.action },
                ),
        },
        { kind: 'format', text: c.output },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'minutes',
      icon: 'groups',
      title: t('Meeting minutes'),
      description: t(
        'Turn your notes into minutes with decisions and actions.',
      ),
      source: {
        label: t('Meeting notes'),
        placeholder: t('Paste your raw notes (optional)'),
        fallback: t('[paste the meeting notes here]'),
      },
      options: [
        {
          id: 'format',
          label: t('Format'),
          choices: [
            {
              id: 'formal',
              label: t('Formal'),
              instruction: t(
                'formal minutes with context, discussion points and conclusions',
              ),
            },
            {
              id: 'summary',
              label: t('Summary'),
              instruction: t('a one-page summary'),
            },
            {
              id: 'flash',
              label: t('Flash'),
              instruction: t('a five-line flash report'),
            },
          ],
        },
      ],
      build: (c, source) =>
        t(
          'From the meeting notes below, write {{format}}. End with a table of decisions and a table of actions (who, what, by when). Only use the notes; write [to confirm] when something is unclear.',
          { format: c.format },
        ) + block(source),
    },
    {
      id: 'summary',
      icon: 'summarize',
      title: t('Summary note'),
      description: t('The key points of a text or an attached document.'),
      source: {
        label: t('Text to summarise'),
        placeholder: t('Paste the text, or attach the document to the message'),
        fallback: t('[the attached document]'),
      },
      options: [
        {
          id: 'audience',
          part: 'context',
          label: t('For'),
          choices: [
            {
              id: 'management',
              label: t('Management'),
              instruction: t(
                'I work in an administration. This summary is for my management, who must take decisions.',
              ),
            },
            {
              id: 'team',
              label: t('My team'),
              instruction: t(
                'I work in an administration. This summary is for my team, who need to know what changes in practice.',
              ),
            },
            {
              id: 'public',
              label: t('General public'),
              instruction: t(
                'I work in an administration. This summary is for the general public.',
              ),
            },
          ],
        },
        {
          id: 'focus',
          label: t('What to keep'),
          choices: [
            {
              id: 'essentials',
              label: t('The essentials'),
              instruction: t('the essentials'),
            },
            {
              id: 'decisions',
              label: t('The decisions to take'),
              instruction: t('the decisions to take and what is at stake'),
            },
            {
              id: 'figures',
              label: t('The key figures'),
              instruction: t('the key figures and what they mean'),
            },
          ],
        },
        level,
        {
          id: 'length',
          part: 'format',
          label: t('Length'),
          choices: [
            {
              id: 'points',
              label: t('5 key points'),
              instruction: t('five key points'),
            },
            {
              id: 'paragraph',
              label: t('1 paragraph'),
              instruction: t('one paragraph'),
            },
            {
              id: 'page',
              label: t('1 page'),
              instruction: t('one page with headings'),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.audience },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('Summarise this document: {{focus}}. Invent nothing.', {
                  focus: c.focus,
                })
              : t(
                  'Summarise the content below: {{focus}}. Only use the content provided and quote the key figures.',
                  { focus: c.focus },
                ),
        },
        {
          kind: 'format',
          text: t('Length: {{length}}.', { length: c.length }),
        },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'actions',
      icon: 'checklist',
      title: t('Extract the actions'),
      description: t('Who does what, by when: from any text.'),
      source: pastedText,
      options: [
        {
          id: 'origin',
          part: 'context',
          label: t('From'),
          choices: [
            {
              id: 'meeting',
              label: t('A meeting'),
              instruction: t(
                'Here are the minutes or the notes of a meeting of my department.',
              ),
            },
            {
              id: 'email',
              label: t('An email'),
              instruction: t('Here is an email I received.'),
            },
            {
              id: 'document',
              label: t('A document'),
              instruction: t('Here is a working document.'),
            },
          ],
        },
        {
          id: 'scope',
          label: t('Which actions'),
          choices: [
            {
              id: 'all',
              label: t('All'),
              instruction: t('every action to take'),
            },
            {
              id: 'mine',
              label: t('Mine'),
              instruction: t('the actions that concern me'),
            },
            {
              id: 'late',
              label: t('Late ones'),
              instruction: t('the actions whose deadline is near or past'),
            },
          ],
        },
        level,
        {
          id: 'shape',
          part: 'format',
          label: t('Format'),
          choices: [
            {
              id: 'table',
              label: t('A table'),
              instruction: t('A table: action, person in charge, deadline.'),
            },
            {
              id: 'list',
              label: t('A list'),
              instruction: t(
                'A bulleted list, one action per line, with the person in charge and the deadline.',
              ),
            },
            {
              id: 'person',
              label: t('By person'),
              instruction: t(
                'A list per person, with their actions and deadlines.',
              ),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.origin },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('List {{scope}} in this text. Invent nothing.', {
                  scope: c.scope,
                })
              : t(
                  'List {{scope}} in the text below. Write [not specified] when the text does not say who or when. Do not invent anything.',
                  { scope: c.scope },
                ),
        },
        { kind: 'format', text: c.shape },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'translate',
      icon: 'translate',
      title: t('Translate'),
      description: t('A faithful translation that keeps the tone.'),
      source: pastedText,
      options: [
        {
          id: 'purpose',
          part: 'context',
          label: t('What for'),
          choices: [
            {
              id: 'send',
              label: t('To send it'),
              instruction: t(
                'Here is a text to translate, to send to someone who reads this language.',
              ),
            },
            {
              id: 'understand',
              label: t('To understand it'),
              instruction: t(
                'Here is a text I received and must understand for my work.',
              ),
            },
            {
              id: 'publish',
              label: t('To publish it'),
              instruction: t(
                'Here is a text to translate, to be published (a web page, a leaflet, a sign).',
              ),
            },
          ],
        },
        {
          id: 'language',
          label: t('Into'),
          choices: [
            { id: 'en', label: t('English'), instruction: t('English') },
            { id: 'fr', label: t('French'), instruction: t('French') },
            { id: 'de', label: t('German'), instruction: t('German') },
            { id: 'es', label: t('Spanish'), instruction: t('Spanish') },
            { id: 'it', label: t('Italian'), instruction: t('Italian') },
          ],
        },
        level,
        {
          id: 'output',
          part: 'format',
          label: t('Expected result'),
          choices: [
            {
              id: 'only',
              label: t('The translation only'),
              instruction: t(
                'Give only the translation, then list any term you were unsure about.',
              ),
            },
            {
              id: 'side',
              label: t('Side by side'),
              instruction: t(
                'Give a table: each original sentence on the left, its translation on the right.',
              ),
            },
            {
              id: 'plain',
              label: t('In plain language'),
              instruction: t(
                'Give the translation in plain, simple language, then list any term you were unsure about.',
              ),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.purpose },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('Translate this text into {{language}}.', {
                  language: c.language,
                })
              : t(
                  'Translate the text below into {{language}}. Keep the tone, the formatting and the proper nouns.',
                  { language: c.language },
                ),
        },
        { kind: 'format', text: c.output },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'letter',
      icon: 'description',
      title: t('Official letter'),
      description: t('A letter or an internal note, properly structured.'),
      source: {
        label: t('Key points to include'),
        placeholder: t('Recipient, subject, what you want to say (optional)'),
        fallback: t('[recipient, subject and key points]'),
      },
      options: [
        {
          id: 'situation',
          part: 'context',
          label: t('Situation'),
          choices: [
            {
              id: 'answer',
              label: t('Answering a request'),
              instruction: t(
                'I work in an administration and I am answering a request I received.',
              ),
            },
            {
              id: 'inform',
              label: t('Informing'),
              instruction: t(
                'I work in an administration and I must inform people of a change or a piece of news.',
              ),
            },
            {
              id: 'decision',
              label: t('Announcing a decision'),
              instruction: t(
                'I work in an administration and I must announce a decision.',
              ),
            },
            {
              id: 'ask',
              label: t('Asking for something'),
              instruction: t(
                'I work in an administration and I must ask for something (a document, an answer, a meeting).',
              ),
            },
          ],
        },
        {
          id: 'kind',
          label: t('Type'),
          choices: [
            {
              id: 'citizen',
              label: t('To a citizen'),
              instruction: t('a letter replying to a citizen'),
            },
            {
              id: 'internal',
              label: t('Internal note'),
              instruction: t('an internal note'),
            },
            {
              id: 'administration',
              label: t('To an administration'),
              instruction: t('a letter to another administration'),
            },
          ],
        },
        level,
        {
          id: 'length',
          part: 'format',
          label: t('Length'),
          choices: [
            {
              id: 'page',
              label: t('One page at most'),
              instruction: t('one page at most'),
            },
            {
              id: 'short',
              label: t('A few lines'),
              instruction: t('a few lines'),
            },
            {
              id: 'detailed',
              label: t('Detailed'),
              instruction: t('detailed, one paragraph per point'),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.situation },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('Write {{kind}} from these points. Invent nothing.', {
                  kind: c.kind,
                })
              : t(
                  'Write {{kind}} from the points below. Use only these points, and write TO COMPLETE where information is missing.',
                  { kind: c.kind },
                ),
        },
        {
          kind: 'format',
          text: t('Length: {{length}}. Plain and courteous language.', {
            length: c.length,
          }),
        },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'plan',
      icon: 'event_note',
      title: t('Action plan'),
      description: t('Structure a project into steps, dates and checks.'),
      source: {
        label: t('Goal and context'),
        placeholder: t(
          'What you want to achieve, by when, with whom (optional)',
        ),
        fallback: t('[goal, deadline and people involved]'),
      },
      options: [
        {
          id: 'situation',
          part: 'context',
          label: t('Situation'),
          choices: [
            {
              id: 'project',
              label: t('A project'),
              instruction: t(
                'I work in an administration and I must carry out a project.',
              ),
            },
            {
              id: 'event',
              label: t('An event'),
              instruction: t(
                'I work in an administration and I must organise an event (a meeting, a seminar, a training).',
              ),
            },
            {
              id: 'change',
              label: t('A change'),
              instruction: t(
                'I work in an administration and I must lead a change in my department.',
              ),
            },
          ],
        },
        {
          id: 'shape',
          label: t('Type'),
          choices: [
            {
              id: 'plan',
              label: t('Action plan'),
              instruction: t(
                'an action plan with steps, owners and deliverables',
              ),
            },
            {
              id: 'backward',
              label: t('Backward planning'),
              instruction: t(
                'a backward planning from the deadline, with milestones',
              ),
            },
            {
              id: 'checklist',
              label: t('Checklist'),
              instruction: t('a checklist of everything to do and check'),
            },
          ],
        },
        level,
        {
          id: 'presentation',
          part: 'format',
          label: t('Format'),
          choices: [
            {
              id: 'table',
              label: t('A table'),
              instruction: t('Present it as a table.'),
            },
            {
              id: 'steps',
              label: t('Numbered steps'),
              instruction: t('Present it as numbered steps.'),
            },
            {
              id: 'timeline',
              label: t('Week by week'),
              instruction: t('Present it week by week.'),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.situation },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('Build {{shape}} for this project.', { shape: c.shape })
              : t(
                  'Build {{shape}} for the project below. Flag the risks and the points to decide first.',
                  { shape: c.shape },
                ),
        },
        { kind: 'format', text: c.presentation },
        { kind: 'document', text: source },
      ]),
    },
    {
      id: 'brainstorm',
      icon: 'lightbulb',
      title: t('Brainstorm'),
      description: t('Ideas and angles on a topic, with a method.'),
      source: {
        label: t('Topic'),
        placeholder: t('The question or topic to think about (optional)'),
        fallback: t('[the topic]'),
      },
      options: [
        {
          id: 'for',
          part: 'context',
          label: t('For'),
          choices: [
            {
              id: 'team',
              label: t('My team'),
              instruction: t('I am preparing a reflection with my team.'),
            },
            {
              id: 'management',
              label: t('My management'),
              instruction: t('I am preparing proposals for my management.'),
            },
            {
              id: 'myself',
              label: t('Myself'),
              instruction: t('I am thinking on my own about a work topic.'),
            },
          ],
        },
        {
          id: 'method',
          label: t('Method'),
          choices: [
            {
              id: 'free',
              label: t('Free ideas'),
              instruction: t(
                'ten varied ideas, from the most practical to the boldest',
              ),
            },
            {
              id: 'swot',
              label: t('SWOT'),
              instruction: t(
                'a SWOT analysis (strengths, weaknesses, opportunities, threats)',
              ),
            },
            {
              id: 'hats',
              label: t('Six hats'),
              instruction: t(
                'the six thinking hats method, one short paragraph per hat',
              ),
            },
          ],
        },
        level,
        {
          id: 'shape',
          part: 'format',
          label: t('Format'),
          choices: [
            {
              id: 'list',
              label: t('A list'),
              instruction: t('A short list, one idea per line.'),
            },
            {
              id: 'table',
              label: t('A table'),
              instruction: t('A table: idea, benefit, difficulty.'),
            },
            {
              id: 'prose',
              label: t('Short paragraphs'),
              instruction: t('Short paragraphs.'),
            },
          ],
        },
      ],
      ...byParts((c, source) => [
        { kind: 'context', text: c.for },
        {
          kind: 'instruction',
          text:
            c.level === 'simple'
              ? t('On this topic, give {{method}}.', { method: c.method })
              : t(
                  'On the topic below, give {{method}}. End with the two ideas you would explore first, and why.',
                  { method: c.method },
                ),
        },
        { kind: 'format', text: c.shape },
        { kind: 'document', text: source },
      ]),
    },
  ];
};

/** Prompt of a tool for the selected choices (first choice by default). */
const chosenInstructions = (
  tool: DailyTool,
  selected: Record<string, string>,
) =>
  Object.fromEntries(
    tool.options.map((group) => {
      const choice =
        group.choices.find((c) => c.id === selected[group.id]) ??
        group.choices[0];
      return [group.id, choice.instruction];
    }),
  );

/**
 * The prompt of a tool, part by part; a single part when not split. A part
 * the user rewrote in its block replaces the one proposed.
 */
export const buildToolParts = (
  tool: DailyTool,
  selected: Record<string, string>,
  source: string,
  edits: Partial<Record<PromptPartKind, string>> = {},
): PromptPart[] => {
  const text = source.trim() || tool.source.fallback;
  const choices = chosenInstructions(tool, selected);
  return tool.parts
    ? tool
        .parts(choices, text)
        .map((part) =>
          part.kind !== 'document' && edits[part.kind] !== undefined
            ? { ...part, text: edits[part.kind] as string }
            : part,
        )
    : [{ kind: 'instruction', text: tool.build(choices, text) }];
};

export const buildToolPrompt = (
  tool: DailyTool,
  selected: Record<string, string>,
  source: string,
) => {
  const instructions = Object.fromEntries(
    tool.options.map((group) => {
      const choice =
        group.choices.find((c) => c.id === selected[group.id]) ??
        group.choices[0];
      return [group.id, choice.instruction];
    }),
  );
  return tool.build(instructions, source.trim() || tool.source.fallback);
};
