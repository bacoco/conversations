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
  choices: ToolChoice[];
}

export interface ToolSource {
  label: string;
  placeholder: string;
  /** Used in the prompt when the user leaves the field empty. */
  fallback: string;
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
}

const block = (source: string) => `\n\n"""\n${source}\n"""`;

export const getDailyTools = (t: TFunction): DailyTool[] => {
  const pastedText: ToolSource = {
    label: t('Text to work on'),
    placeholder: t('Paste the text here (optional)'),
    fallback: t('[paste the text here]'),
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
        {
          id: 'tone',
          label: t('Tone'),
          choices: [
            { id: 'cordial', label: t('Cordial'), instruction: t('cordial') },
            { id: 'formal', label: t('Formal'), instruction: t('formal') },
          ],
        },
      ],
      build: (c, source) =>
        t(
          'Write a reply to the email below. Goal: {{intent}}. Tone: {{tone}}, in plain language. Structure: greeting, answer in short paragraphs, closing. Do not promise anything that is not in the email; put [to complete] where information is missing.',
          { intent: c.intent, tone: c.tone },
        ) + block(source),
    },
    {
      id: 'rewrite',
      icon: 'edit_note',
      title: t('Rewrite a text'),
      description: t('Plain language, shorter, corrected or more formal.'),
      source: pastedText,
      options: [
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
          ],
        },
      ],
      build: (c, source) =>
        t(
          'Rewrite the text below: {{action}}. Keep every fact, date and amount unchanged. Give only the rewritten text.',
          { action: c.action },
        ) + block(source),
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
          id: 'length',
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
        {
          id: 'audience',
          label: t('For'),
          choices: [
            {
              id: 'management',
              label: t('Management'),
              instruction: t(
                'senior management, who need the decisions to take',
              ),
            },
            {
              id: 'team',
              label: t('My team'),
              instruction: t('my team, who need the practical consequences'),
            },
            {
              id: 'public',
              label: t('General public'),
              instruction: t('the general public, in plain language'),
            },
          ],
        },
      ],
      build: (c, source) =>
        t(
          'Summarise the content below in {{length}}, for {{audience}}. Only use the content provided and quote the key figures.',
          { length: c.length, audience: c.audience },
        ) + block(source),
    },
    {
      id: 'actions',
      icon: 'checklist',
      title: t('Extract the actions'),
      description: t('Who does what, by when: from any text.'),
      source: pastedText,
      options: [],
      build: (_, source) =>
        t(
          'List every action to take in the text below, as a table: action, person in charge, deadline, status. Write [not specified] when the text does not say. Do not invent anything.',
        ) + block(source),
    },
    {
      id: 'translate',
      icon: 'translate',
      title: t('Translate'),
      description: t('A faithful translation that keeps the tone.'),
      source: pastedText,
      options: [
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
      ],
      build: (c, source) =>
        t(
          'Translate the text below into {{language}}. Keep the tone, the formatting and the proper nouns. Give only the translation, then list any term you were unsure about.',
          { language: c.language },
        ) + block(source),
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
      ],
      build: (c, source) =>
        t(
          'Write {{kind}} from the points below. Use the usual structure (subject, introduction, body, closing formula), plain and courteous language, and put [to complete] where information is missing.',
          { kind: c.kind },
        ) + block(source),
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
          id: 'shape',
          label: t('Format'),
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
      ],
      build: (c, source) =>
        t(
          'Build {{shape}} for the project below. Present it as a table, flag the risks and the points to decide first.',
          { shape: c.shape },
        ) + block(source),
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
      ],
      build: (c, source) =>
        t(
          'On the topic below, give {{method}}. End with the two ideas you would explore first, and why.',
          {
            method: c.method,
          },
        ) + block(source),
    },
  ];
};

/** Prompt of a tool for the selected choices (first choice by default). */
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
