// English prompt library, translated from the French version (fr.ts).
import type { PromptLibrary } from '../types';

export const LIBRARY_EN: PromptLibrary = {
  categories: [
    { id: 'mail', icon: 'mail', title: 'Emails and letters' },
    { id: 'meetings', icon: 'groups', title: 'Meetings' },
    { id: 'summary', icon: 'summarize', title: 'Summaries and analysis' },
    { id: 'writing', icon: 'edit_note', title: 'Administrative writing' },
    { id: 'hr', icon: 'badge', title: 'HR and management' },
    { id: 'procurement', icon: 'gavel', title: 'Legal and procurement' },
    { id: 'communication', icon: 'campaign', title: 'Communication' },
    { id: 'data', icon: 'table_chart', title: 'Spreadsheets and data' },
    { id: 'public', icon: 'support_agent', title: 'Serving the public' },
  ],
  prompts: [
    // Emails and letters
    {
      id: 'mail-reply-citizen',
      category: 'mail',
      title: 'Reply to a member of the public',
      description: 'A clear, courteous reply without jargon.',
      prompt: `You work for a public service. Write a reply to the email from a member of the public below.

Goal: answer their question about [topic] by telling them [answer or next step].
Tone: courteous, simple, no administrative jargon.
Format: an email of 10 lines maximum, with a greeting and a closing.
Constraint: do not promise anything that is not in the information above.

Email received:
"""
[paste the email]
"""`,
      keywords: [
        'reply',
        'answer',
        'citizen',
        'email',
        'member of the public',
        'response',
      ],
    },
    {
      id: 'mail-follow-up',
      category: 'mail',
      title: 'Follow up politely',
      description:
        'A firm but friendly follow-up on a request that went unanswered.',
      prompt: `Write a follow-up email to [recipient] about [request], sent on [date] and still unanswered.

Restate what is at stake in one sentence: [why it matters].
Ask for a reply by [deadline].
Tone: friendly and firm, without blame.
Format: 5 to 8 lines, including a subject line.`,
      keywords: ['follow up', 'reminder', 'no reply', 'chase', 'nudge'],
    },
    {
      id: 'mail-decline',
      category: 'mail',
      title: 'Decline tactfully',
      description: 'Say no clearly, explain why and offer an alternative.',
      prompt: `Write an email declining the following request: [request].

Reason for declining: [reason].
If possible, offer an alternative: [alternative or "none"].
Tone: respectful and clear; the refusal must be understood by the second sentence.
Format: 8 to 10 lines, including a subject line.`,
      keywords: ['decline', 'refuse', 'say no', 'turn down', 'not possible'],
    },
    {
      id: 'mail-official-letter',
      category: 'mail',
      title: 'Official letter',
      description: 'A structured administrative letter, ready to sign.',
      prompt: `Write an official letter from [sending department] to [recipient].

Subject: [subject].
Points to cover, in this order: [point 1], [point 2], [point 3].
References to cite: [texts, case files or "none"].
Tone: formal, precise and courteous.
Format: subject, references, body in short paragraphs, a closing suited to the recipient.`,
      keywords: ['letter', 'official', 'formal', 'signature', 'correspondence'],
    },
    {
      id: 'mail-shorten',
      category: 'mail',
      title: 'Shorten an email',
      description: 'The same message, half as long.',
      prompt: `Cut the email below by half without losing any useful information.

Keep: the main request, dates and figures.
Remove: repetition and unnecessary phrases.
Give me the shortened email, then a list of what you removed.

"""
[paste the email]
"""`,
      keywords: ['shorten', 'too long', 'shorter', 'condense', 'concise'],
    },

    // Meetings
    {
      id: 'meeting-agenda',
      category: 'meetings',
      title: 'Prepare an agenda',
      description: 'A timed agenda with a goal for each item.',
      prompt: `Prepare the agenda for a [duration] meeting with [participants].

Meeting goal: [goal].
Topics to cover: [topic 1], [topic 2], [topic 3].
Format: a table with the item, its purpose (inform, decide or discuss), who leads it and the time allotted.
End with the decisions expected by the end of the meeting.`,
      keywords: ['agenda', 'meeting', 'prepare', 'plan', 'schedule'],
    },
    {
      id: 'meeting-minutes',
      category: 'meetings',
      title: 'Meeting minutes',
      description: 'Rough notes turned into clear minutes.',
      prompt: `Turn my meeting notes below into minutes.

Structure: attendees, topics discussed, decisions made, actions (who, what, by when), open issues.
Style: short, neutral sentences, no interpretation.
If information is missing (owner, deadline), write [to be confirmed] instead of making it up.

Notes:
"""
[paste the notes]
"""`,
      keywords: ['minutes', 'meeting notes', 'summary', 'record', 'notes'],
    },
    {
      id: 'meeting-actions',
      category: 'meetings',
      title: 'Extract action items',
      description: 'Who does what, and by when.',
      prompt: `Extract every action item from the text below.

Format: a table with the action, the owner, the deadline and the status.
If the owner or deadline is not given, write [to be confirmed].
Do not add any action that is not in the text.

"""
[paste the text]
"""`,
      keywords: [
        'actions',
        'action items',
        'who does what',
        'tasks',
        'follow-up',
      ],
    },
    {
      id: 'meeting-invitation',
      category: 'meetings',
      title: 'Meeting invitation',
      description: 'An invitation that gets people to come prepared.',
      prompt: `Write a meeting invitation.

Topic: [topic]. Date and place: [date, time, place or link].
Participants: [participants].
What to prepare beforehand: [documents or points to think about].
Tone: professional and warm.
Format: an email of 8 lines maximum, with the meeting goal in the first sentence.`,
      keywords: ['invitation', 'invite', 'meeting', 'calendar', 'notice'],
    },
    {
      id: 'meeting-debrief',
      category: 'meetings',
      title: 'Post-meeting recap',
      description: 'A few lines for those who could not attend.',
      prompt: `Using the minutes below, write a short message for the people who were absent.

Content: the 3 main decisions and what directly concerns them.
Format: 5 lines maximum, as bullet points.

"""
[paste the minutes]
"""`,
      keywords: ['recap', 'debrief', 'absent', 'meeting summary', 'update'],
    },

    // Summaries and analysis
    {
      id: 'summary-note',
      category: 'summary',
      title: 'Briefing note',
      description: 'The key points of a long document, for a decision-maker.',
      prompt: `Write a briefing note on the document below for [recipient, for example a director].

Structure: context in 2 lines, key points (5 maximum), issues at stake, recommendation.
Length: one page maximum.
Quote the exact figures and dates from the document; do not add any outside information.

"""
[paste the document or attach it]
"""`,
      keywords: ['briefing', 'summary', 'summarize', 'key points', 'note'],
    },
    {
      id: 'summary-compare',
      category: 'summary',
      title: 'Compare two documents',
      description: 'What changed from one version to the next.',
      prompt: `Compare the two versions of [type of document] below.

List: what was added, removed and changed.
For each significant change, state its possible impact on [audience concerned].
Format: a three-column table (change, before, after), then a 3-line conclusion.

Version 1:
"""
[paste version 1]
"""

Version 2:
"""
[paste version 2]
"""`,
      keywords: ['compare', 'differences', 'versions', 'changes', 'diff'],
    },
    {
      id: 'summary-pros-cons',
      category: 'summary',
      title: 'Pros and cons',
      description: 'A balanced analysis before deciding.',
      prompt: `Analyze the pros and cons of [option or project] for [department or audience].

Take into account: cost, timeline, risks, and the impact on staff and on the public.
Format: a pros / cons table, then the 3 questions to settle before deciding.
If information is missing to make a judgment, say so rather than assuming.`,
      keywords: ['pros', 'cons', 'decide', 'analysis', 'options'],
    },
    {
      id: 'summary-questions',
      category: 'summary',
      title: 'Questions about a document',
      description: 'The questions to ask before signing off.',
      prompt: `Read the document below as a demanding reviewer would.

List the 10 questions the author should be asked before it is approved: vague points, contradictions, unsourced figures, missing points.
Rank them from most to least important.

"""
[paste the document]
"""`,
      keywords: ['review', 'questions', 'approve', 'check', 'critique'],
    },
    {
      id: 'summary-plain',
      category: 'summary',
      title: 'Explain simply',
      description: 'A technical text made understandable for everyone.',
      prompt: `Explain the text below to [audience, for example a member of the public with no legal background].

Use short sentences and everyday words; define every technical term you keep.
Format: 5 key points, then a concrete example.

"""
[paste the text]
"""`,
      keywords: ['explain', 'simply', 'plain', 'understand', 'technical'],
    },

    // Administrative writing
    {
      id: 'writing-plain-language',
      category: 'writing',
      title: 'Rewrite in plain language',
      description: 'The same text, understood on the first read.',
      prompt: `Rewrite the text below in plain language.

Rules: 20 words maximum per sentence, active voice, everyday words, one idea per sentence.
Keep exactly the meaning and obligations of the original text.
Give me the rewritten text, then the 3 most important changes.

"""
[paste the text]
"""`,
      keywords: ['plain language', 'simplify', 'rephrase', 'readable', 'clear'],
    },
    {
      id: 'writing-proofread',
      category: 'writing',
      title: 'Proofread and correct',
      description: 'Spelling, grammar and clarity, with corrections shown.',
      prompt: `Correct the text below: spelling, grammar, punctuation and awkward phrasing.

Do not change the substance or the tone.
Give me the corrected text, then the list of corrections in the form "before → after".

"""
[paste the text]
"""`,
      keywords: ['proofread', 'correct', 'spelling', 'grammar', 'typos'],
    },
    {
      id: 'writing-procedure',
      category: 'writing',
      title: 'Write a procedure',
      description: 'A step-by-step procedure anyone can follow.',
      prompt: `Write a procedure for [task] intended for [staff concerned].

Structure: purpose, prerequisites, numbered steps (one action per step), points to watch, contact in case of problems.
Style: imperative, short sentences.
If a step depends on a tool or a department, write its name in square brackets so I can fill it in.`,
      keywords: ['procedure', 'instructions', 'steps', 'guide', 'how-to'],
    },
    {
      id: 'writing-faq',
      category: 'writing',
      title: 'Create an FAQ',
      description: 'The questions people actually ask, with their answers.',
      prompt: `Using the text below, write an 8-question FAQ for [audience].

Word the questions the way this audience would ask them, in their own words.
Answers: 3 lines maximum, based only on the text.
If the text does not answer an important question, flag it at the end.

"""
[paste the text]
"""`,
      keywords: ['faq', 'frequently asked questions', 'questions', 'answers'],
    },
    {
      id: 'writing-report-plan',
      category: 'writing',
      title: 'Report outline',
      description: 'A solid structure before you start writing.',
      prompt: `Propose a detailed outline for a report on [topic] intended for [recipient].

Purpose of the report: [inform, persuade, propose a decision].
Format: titled sections and subsections, each with one sentence on its content and the data to gather.
Target length: [number] pages.`,
      keywords: ['report', 'outline', 'structure', 'plan', 'write'],
    },

    // HR and management
    {
      id: 'hr-job-offer',
      category: 'hr',
      title: 'Job description',
      description: 'A precise and appealing job description.',
      prompt: `Write a job description for [job title] in [department].

Main duties: [duties].
Required skills: [skills].
Conditions: [grade, location, remote work, start date].
Format: about the department, duties, profile sought, conditions, contact.
Tone: clear and engaging, no internal jargon.`,
      keywords: [
        'job description',
        'recruitment',
        'vacancy',
        'hiring',
        'job posting',
      ],
    },
    {
      id: 'hr-interview-guide',
      category: 'hr',
      title: 'Interview scorecard',
      description: 'Questions to assess candidates fairly.',
      prompt: `Prepare a recruitment interview scorecard for [position].

Skills to assess: [skills].
For each skill: 2 open questions, what a good answer includes, a scale from 1 to 4.
Add 2 questions about motivation.
Avoid any discriminatory question or question about private life.`,
      keywords: [
        'interview',
        'candidate',
        'recruitment',
        'scorecard',
        'questions',
      ],
    },
    {
      id: 'hr-annual-review',
      category: 'hr',
      title: 'Prepare an annual review',
      description: 'A factual assessment and goals for the year.',
      prompt: `Help me prepare the annual performance review for [employee] (I am their manager).

Achievements this year: [achievements].
Areas for improvement: [areas].
Propose: a factual and supportive assessment, 3 measurable objectives for the coming year and 2 training ideas.`,
      keywords: [
        'annual review',
        'appraisal',
        'objectives',
        'performance',
        'employee',
      ],
    },
    {
      id: 'hr-onboarding',
      category: 'hr',
      title: 'Welcome a new starter',
      description: 'An onboarding plan for the first few weeks.',
      prompt: `Build an onboarding plan for [new starter] in the role of [position], covering their first 4 weeks.

For each week: objectives, people to meet, tools to learn, first assignments.
Add a list of what to prepare before they arrive (access, equipment, documents).`,
      keywords: [
        'onboarding',
        'new starter',
        'new hire',
        'welcome',
        'induction',
      ],
    },
    {
      id: 'hr-difficult-message',
      category: 'hr',
      title: 'Announce a difficult decision',
      description: 'A human, clear and unambiguous message.',
      prompt: `Help me announce the following decision to my team: [decision].

Reasons: [reasons].
Consequences for the team: [consequences].
Write: the main message (clear from the first sentence), then the 5 questions the team is likely to ask, with an honest answer to each.
Tone: human, direct, no corporate doublespeak.`,
      keywords: ['announce', 'decision', 'team', 'change', 'difficult'],
    },

    // Legal and procurement
    {
      id: 'procurement-needs',
      category: 'procurement',
      title: 'Define a purchasing need',
      description: 'A clear need before launching a tender.',
      prompt: `Help me formalize the following purchasing need: [need].

Structure: context, objectives, scope (what is included and excluded), functional requirements, constraints (timeline, estimated budget, security), success criteria.
Flag the points to clarify before drafting the specifications.`,
      keywords: ['purchasing', 'need', 'procurement', 'tender', 'buyer'],
    },
    {
      id: 'procurement-specs',
      category: 'procurement',
      title: 'Specifications outline',
      description:
        'The structure of a technical specifications document, to fill in.',
      prompt: `Propose an outline for the technical specifications of [subject of the contract].

For each section, state in one sentence what it covers and the information to gather.
Flag the clauses that should be reviewed by the legal department.
Do not draft final clauses: this is a working template.`,
      keywords: [
        'specifications',
        'technical specifications',
        'public contract',
        'clauses',
        'tender',
      ],
    },
    {
      id: 'procurement-criteria',
      category: 'procurement',
      title: 'Bid evaluation criteria',
      description: 'Weighted criteria you can justify.',
      prompt: `Propose bid evaluation criteria for a contract for [subject].

For each criterion: its definition, its weighting as a percentage, and what distinguishes a low score from a high one.
The criteria must be objective, linked to the subject of the contract and verifiable in the bids.`,
      keywords: [
        'criteria',
        'bid evaluation',
        'scoring',
        'weighting',
        'tender',
      ],
    },
    {
      id: 'legal-explain-text',
      category: 'procurement',
      title: 'Explain a regulatory text',
      description: 'What a text concretely changes for your department.',
      prompt: `Explain the regulatory text below to staff who are not lawyers.

State: what it provides, who is concerned, what concretely changes, and from when.
Cite the relevant articles; if a point is ambiguous, flag it instead of settling it.
Reminder: this explanation does not replace the opinion of the legal department.

"""
[paste the text]
"""`,
      keywords: [
        'regulation',
        'decree',
        'law',
        'legal',
        'regulatory',
        'legislation',
      ],
    },
    {
      id: 'legal-checklist',
      category: 'procurement',
      title: 'File checklist',
      description: 'Forget nothing before sending.',
      prompt: `Draw up a checklist for the following file: [type of file].

Group the items by stage (preparation, content, signatures, sending).
For each item, explain why it matters and the risk if it is forgotten.`,
      keywords: ['checklist', 'check', 'file', 'forget', 'review'],
    },

    // Communication
    {
      id: 'com-news',
      category: 'communication',
      title: 'Intranet article',
      description: 'A short news item people want to read.',
      prompt: `Write an article for the staff intranet about [topic].

Information to convey: [information].
Audience: [staff concerned].
Format: a catchy headline, a 2-line standfirst, 3 short paragraphs, a call-to-action sentence.
Tone: informative and lively, without superlatives.`,
      keywords: ['intranet', 'article', 'news', 'staff news', 'publish'],
    },
    {
      id: 'com-social-post',
      category: 'communication',
      title: 'Social media post',
      description: 'A short message suited to the target network.',
      prompt: `Write 3 post options for [social network] about [topic].

Key message: [message].
Audience: [audience].
Constraints: [number] characters maximum, a call to action, no administrative jargon.
For each option, state the tone chosen.`,
      keywords: ['social media', 'post', 'linkedin', 'twitter', 'publish'],
    },
    {
      id: 'com-presentation',
      category: 'communication',
      title: 'Presentation outline',
      description: 'Slides that tell a story.',
      prompt: `Build the outline of a [duration] presentation on [topic] for [audience].

Goal: [what the audience should remember or decide].
Format: a list of slides, each with a title that states the main idea, 3 bullet points maximum and what the speaker says aloud.
Start with the key message, end with the expected decision or action.`,
      keywords: ['presentation', 'slides', 'slide deck', 'powerpoint', 'talk'],
    },
    {
      id: 'com-speech',
      category: 'communication',
      title: 'Speech or welcome address',
      description: 'A few minutes of speaking that sound natural and right.',
      prompt: `Write a [duration] speech for [occasion], to be delivered by [speaker].

Messages to get across: [messages].
People to thank: [people].
Style: spoken, short sentences, an anecdote or concrete example, a closing that brings people together.`,
      keywords: ['speech', 'address', 'welcome', 'remarks', 'ceremony'],
    },
    {
      id: 'com-newsletter',
      category: 'communication',
      title: 'Newsletter',
      description: 'Several news items gathered into one readable newsletter.',
      prompt: `Write a newsletter for [audience] based on the following news: [news items].

Format: a title, a 3-line editorial, one section per news item (title + 3 lines + link to fill in [link]), key dates.
Tone: clear and warm.`,
      keywords: ['newsletter', 'bulletin', 'news', 'update', 'mailing'],
    },

    // Spreadsheets and data
    {
      id: 'data-formula',
      category: 'data',
      title: 'Spreadsheet formula',
      description: 'The exact formula, explained step by step.',
      prompt: `I am working in [Excel / LibreOffice Calc / Grist].
My data: [describe the columns, for example A = date, B = amount].
I want to get: [expected result].

Give me the formula, explain it step by step, then point out a common mistake to avoid.`,
      keywords: ['formula', 'excel', 'spreadsheet', 'calc', 'cell', 'column'],
    },
    {
      id: 'data-analyse-table',
      category: 'data',
      title: 'Analyze a table',
      description: 'The trends and points of attention in a dataset.',
      prompt: `Analyze the table below.

State: the main trends, unusual values, useful comparisons.
Format: 5 findings with figures, then 3 questions these figures raise.
Do not draw any conclusion the data does not support.

"""
[paste the table]
"""`,
      keywords: ['table', 'data', 'figures', 'statistics', 'analyze'],
    },
    {
      id: 'data-clean',
      category: 'data',
      title: 'Clean up data',
      description: 'Spot duplicates, format issues and missing values.',
      prompt: `Here is a sample of my data: [paste a sample with no personal data].

Identify the problems: duplicates, inconsistent formats (dates, numbers), missing values, typing errors.
For each one, suggest how to fix it in [Excel / LibreOffice Calc / Grist].`,
      keywords: ['clean', 'duplicates', 'data', 'format', 'data quality'],
    },
    {
      id: 'data-chart',
      category: 'data',
      title: 'Choose a chart',
      description: 'The right chart to get the right message across.',
      prompt: `I want to show [message] to [audience] using the following data: [describe the data].

Suggest the most suitable type of chart and explain why.
Give: the chart title, the axes, what to highlight, and one presentation mistake to avoid.`,
      keywords: ['chart', 'graph', 'diagram', 'visualize', 'pie chart'],
    },
    {
      id: 'data-indicators',
      category: 'data',
      title: 'Define indicators',
      description: 'Measurable indicators to track an initiative.',
      prompt: `Propose 5 indicators to track [project or public policy].

For each indicator: its definition, how it is calculated, its data source, how often it is updated and a realistic target.
Distinguish activity indicators from outcome indicators.`,
      keywords: ['indicators', 'kpi', 'monitoring', 'dashboard', 'measure'],
    },

    // Serving the public
    {
      id: 'public-phone-script',
      category: 'public',
      title: 'Phone reception script',
      description: 'The right answers to the most common questions.',
      prompt: `Write a phone reception guide for [department].

Include: the greeting, the 5 most common questions about [topic] with a simple answer, how to redirect callers to the right contact, and the closing line.
Tone: warm and patient.`,
      keywords: ['phone', 'call', 'script', 'reception', 'switchboard'],
    },
    {
      id: 'public-complaint',
      category: 'public',
      title: 'Respond to a complaint',
      description: 'Acknowledge, explain, offer a solution.',
      prompt: `Write a response to the complaint below.

Structure: acknowledge the inconvenience, explain the situation without over-justifying, state the solution or the action taken [solution], give a contact.
Tone: empathetic and factual.
Do not admit any fault that has not been established.

"""
[paste the complaint]
"""`,
      keywords: [
        'complaint',
        'unhappy',
        'dispute',
        'dissatisfied',
        'grievance',
      ],
    },
    {
      id: 'public-procedure-explain',
      category: 'public',
      title: 'Explain a procedure',
      description: 'An administrative procedure explained step by step.',
      prompt: `Explain to a member of the public how to [procedure].

Format: the list of documents to provide, numbered steps, the usual processing time, who to contact if there is a problem.
Style: polite and formal, short sentences, no unexplained acronyms.
If some information depends on their situation, write [to be checked depending on your situation].`,
      keywords: [
        'procedure',
        'documents',
        'application',
        'paperwork',
        'formalities',
      ],
    },
    {
      id: 'public-accessible',
      category: 'public',
      title: 'Easy-to-read version',
      description: 'A text accessible to as many people as possible.',
      prompt: `Rewrite the text below as an easy-to-read version.

Rules: one idea per sentence, very short sentences, simple words, no Roman numerals or abbreviations, difficult words explained.
Keep all the important information.

"""
[paste the text]
"""`,
      keywords: [
        'easy read',
        'easy to read',
        'accessible',
        'accessibility',
        'disability',
      ],
    },
    {
      id: 'public-translate',
      category: 'public',
      title: 'Translate for a member of the public',
      description: 'A faithful and natural translation.',
      prompt: `Translate the text below into [language] for a member of the public.

Keep the exact meaning and a polite, formal register; adapt greetings and closings to the language.
If an administrative term has no equivalent, keep it and add a short explanation in brackets.

"""
[paste the text]
"""`,
      keywords: [
        'translate',
        'translation',
        'language',
        'foreign',
        'multilingual',
      ],
    },
  ],
};
