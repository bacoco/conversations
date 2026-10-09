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
    { id: 'project', icon: 'account_tree', title: 'Projects and steering' },
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
    // Additions: emails, summaries, writing, meetings, HR, legal,
    // communication, data, public, and the Projects and steering theme.
    {
      id: 'mail-acknowledge',
      category: 'mail',
      title: 'Acknowledge receipt',
      description: 'Confirm receipt and give the processing time.',
      prompt: `Write an acknowledgement of receipt for the request below, received on [date].

State: that the request is registered, the expected processing time ([time]), and who to contact ([contact]).
Tone: courteous and reassuring.
Format: an email of 6 lines at most.
Constraint: make no commitment on the answer itself.

Request received:
"""
[paste the request]
"""`,
      keywords: [
        'acknowledge',
        'receipt',
        'processing time',
        'request',
        'confirm',
      ],
    },
    {
      id: 'mail-missing-document',
      category: 'mail',
      title: 'Ask for a missing document',
      description: 'Request a document without putting people off.',
      prompt: `Write an email to [recipient] asking for the following missing document: [document].

Recall why it is needed ([reason]) and the deadline to send it ([date]).
Say how to send it: [how to send].
Tone: friendly and clear, no reproach.
Format: 8 lines at most, the request in the first sentence.`,
      keywords: [
        'missing document',
        'incomplete file',
        'supporting document',
        'reminder',
      ],
    },
    {
      id: 'mail-announce-change',
      category: 'mail',
      title: 'Announce a change',
      description: 'Tell people about a new organisation, tool or rule.',
      prompt: `Write an email announcing the following change to [recipients]: [change].

Explain: what changes, from when ([date]), why ([reason]), and what everyone must do ([expected action]).
Tone: positive and factual.
Format: a clear subject line, then 4 short paragraphs; end with the contact for questions ([contact]).`,
      keywords: ['announce', 'change', 'reorganisation', 'information', 'team'],
    },
    {
      id: 'mail-thank',
      category: 'mail',
      title: 'Say thank you',
      description: 'A sincere and specific thank-you.',
      prompt: `Write a thank-you message to [recipient] for [what was done].

Mention one concrete contribution ([contribution]) and its effect ([effect]).
Tone: warm and sincere, without overstatement.
Format: 5 lines at most.`,
      keywords: ['thank', 'thanks', 'gratitude', 'recognition'],
    },
    {
      id: 'mail-meeting-request',
      category: 'mail',
      title: 'Request a meeting',
      description: 'Suggest a meeting with time slots.',
      prompt: `Write an email to [recipient] suggesting a meeting about [subject].

State the purpose ([purpose]), the expected length ([length]) and three possible slots: [slots].
Tone: professional and courteous.
Format: 6 lines at most.`,
      keywords: ['meeting', 'appointment', 'slot', 'propose', 'call'],
    },
    {
      id: 'mail-apology',
      category: 'mail',
      title: 'Apologise',
      description: 'Acknowledge a mistake and say what is being done.',
      prompt: `Write an apology email to [recipient] for [mistake or delay].

Acknowledge the problem without long justifications, explain what was done to fix it ([fix]) and what will prevent it from happening again ([measure]).
Tone: sober and respectful.
Format: 8 lines at most.
Constraint: promise nothing that is not stated above.`,
      keywords: ['apology', 'sorry', 'mistake', 'delay'],
    },
    {
      id: 'mail-forward-context',
      category: 'mail',
      title: 'Forward with context',
      description: 'A forwarding note that says why and what is expected.',
      prompt: `Write a short note to forward the exchange below to [recipient].

In 3 sentences: what it is about, why I am forwarding it, and what I expect ([expected action], by [date]).

Exchange:

"""
[paste the text]
"""`,
      keywords: ['forward', 'forwarding', 'pass on', 'context'],
    },
    {
      id: 'summary-email-thread',
      category: 'summary',
      title: 'Summarise an email thread',
      description: 'Where things stand, who expects what.',
      prompt: `Summarise the email thread below.

Give: the subject in one sentence, the decisions taken, the open questions, and what is expected from me ([my role]).
Format: 4 bulleted sections, 10 lines at most in total.
Constraint: add no information that is not in the emails.

Thread:

"""
[paste the text]
"""`,
      keywords: ['thread', 'emails', 'exchange', 'summarise', 'status'],
    },
    {
      id: 'summary-report-decider',
      category: 'summary',
      title: 'Summary for a decision maker',
      description: 'The essence of a report, with a recommendation.',
      prompt: `Write a summary of the report below for [decision maker].

Structure: the context in 2 sentences, the 3 main findings, the possible options, then a reasoned recommendation.
Format: one page at most, short sentences.
Constraint: every figure must come from the report; point out what is missing to decide.

Report:

"""
[paste the text]
"""`,
      keywords: [
        'summary',
        'decision maker',
        'management',
        'report',
        'recommendation',
      ],
    },
    {
      id: 'summary-consultation',
      category: 'summary',
      title: 'Summarise a consultation',
      description: 'Sort opinions or contributions by theme.',
      prompt: `Analyse the contributions below from [consultation or survey].

Group them by theme; for each theme, give the number of contributions, the main idea and a representative quote.
End with the 3 most frequent expectations.
Constraint: do not distort opinions; flag off-topic contributions.

Contributions:

"""
[paste the text]
"""`,
      keywords: [
        'consultation',
        'contributions',
        'opinions',
        'survey',
        'themes',
      ],
    },
    {
      id: 'summary-key-figures',
      category: 'summary',
      title: 'Extract the key figures',
      description:
        'The important data of a document, with where it comes from.',
      prompt: `Extract from the document below the key figures about [subject].

For each figure: the value, what it measures, the period and where it appears in the document.
Format: a 4-column table.
Constraint: do not calculate or round anything; flag any ambiguous figure.

Document:

"""
[paste the text]
"""`,
      keywords: ['figures', 'data', 'statistics', 'extract', 'indicators'],
    },
    {
      id: 'summary-swot',
      category: 'summary',
      title: 'Strengths and weaknesses',
      description: 'A strengths, weaknesses, opportunities, threats grid.',
      prompt: `Do a strengths, weaknesses, opportunities and threats analysis of [project or situation].

Use only the elements below.
Format: a 4-box table, 3 points at most per box, then 2 recommendations.
Constraint: separate facts from assumptions.

Elements:

"""
[paste the text]
"""`,
      keywords: [
        'swot',
        'strengths',
        'weaknesses',
        'opportunities',
        'threats',
        'analysis',
      ],
    },
    {
      id: 'summary-talking-points',
      category: 'summary',
      title: 'Talking points',
      description: 'Key messages ready to be said.',
      prompt: `From the document below, write talking points for [audience or situation].

Give: 3 key messages of one sentence each, the figures to remember, and short answers to 3 likely questions.
Tone: clear, factual, not polemical.
Constraint: nothing that is not in the document.

Document:

"""
[paste the text]
"""`,
      keywords: ['talking points', 'key messages', 'arguments', 'questions'],
    },
    {
      id: 'summary-versions',
      category: 'summary',
      title: 'Summary in three lengths',
      description: 'A short, medium and long version of the same text.',
      prompt: `Summarise the text below in three versions:
1. one sentence;
2. 5 lines;
3. a 15-line paragraph.

Audience: [audience].
Constraint: the three versions say the same thing; no information added.

Text:

"""
[paste the text]
"""`,
      keywords: ['summary', 'short', 'long', 'versions'],
    },
    {
      id: 'writing-briefing-note',
      category: 'writing',
      title: 'Note to management',
      description: 'A note that sets out, analyses and proposes.',
      prompt: `Write a note to [recipient] about [subject].

Structure: subject, context, analysis, proposals, decision expected.
Tone: formal, precise, neutral.
Format: 1 to 2 pages, short headings.
Constraint: use only the elements below; write [to be specified] when information is missing.

Elements:

"""
[paste the text]
"""`,
      keywords: ['note', 'management', 'briefing', 'proposal'],
    },
    {
      id: 'writing-parliamentary',
      category: 'writing',
      title: 'Answer to a written question',
      description: 'A draft answer from approved material.',
      prompt: `Draft an answer to the question below, using the approved material provided.

Structure: recall of the question, current law or situation, actions taken, outlook.
Tone: institutional and factual.
Constraint: add no figure or commitment that is not in the approved material.

Question:
"""
[paste the question]
"""

Approved material:
"""
[paste the material]
"""`,
      keywords: [
        'written question',
        'parliamentary',
        'answer',
        'elected official',
      ],
    },
    {
      id: 'writing-plain-letter',
      category: 'writing',
      title: 'Letter in plain language',
      description: 'Rewrite an administrative letter so it is understood.',
      prompt: `Rewrite the letter below in plain language for [recipient].

Rules: the decision or main information first, short sentences, one subject per paragraph, everyday words, acronyms explained, what the person must do highlighted.
Constraint: keep all legal information and dates.

Letter:

"""
[paste the text]
"""`,
      keywords: [
        'plain language',
        'letter',
        'simplify',
        'understandable',
        'rewrite',
      ],
    },
    {
      id: 'writing-glossary',
      category: 'writing',
      title: 'Create a glossary',
      description: 'The technical terms of a document, explained simply.',
      prompt: `Create a glossary of the technical terms, acronyms and abbreviations in the document below.

For each term: its full form if it is an acronym, then a one-sentence plain definition.
Format: a table sorted alphabetically.
Constraint: if the document does not allow defining a term, write "to be checked".

Document:

"""
[paste the text]
"""`,
      keywords: ['glossary', 'acronyms', 'definitions', 'vocabulary'],
    },
    {
      id: 'writing-speech',
      category: 'writing',
      title: 'Short speech',
      description: 'A few minutes of speech, to be said out loud.',
      prompt: `Write a [length]-minute speech for [occasion], given by [speaker] to [audience].

Structure: an opening hook, 3 messages, a conclusion that thanks or calls to action.
Tone: [tone], sentences made to be spoken.
Constraint: about 130 words per minute; no invented facts, write [to be completed] if needed.`,
      keywords: ['speech', 'address', 'talk', 'ceremony'],
    },
    {
      id: 'writing-questionnaire',
      category: 'writing',
      title: 'Create a questionnaire',
      description: 'Gather the opinion of staff or citizens.',
      prompt: `Write a questionnaire to gather the opinion of [audience] about [subject].

Goal: [what we want to know].
Format: 10 questions at most, closed ones first then 2 open ones; give the possible answers for closed questions.
Constraint: neutral questions that do not steer the answer; under 5 minutes to fill in.`,
      keywords: ['questionnaire', 'survey', 'poll', 'opinion', 'satisfaction'],
    },
    {
      id: 'writing-tutorial',
      category: 'writing',
      title: 'Step-by-step tutorial',
      description: 'Explain a task to colleagues.',
      prompt: `Write a tutorial explaining to [audience] how to [task].

Structure: the expected result, the prerequisites, then numbered steps (one action per step), and frequent mistakes with their fix.
Tone: simple and direct, imperative.
Constraint: use the notes below; flag the steps you cannot describe with certainty.

Notes:

"""
[paste the text]
"""`,
      keywords: ['tutorial', 'step by step', 'how-to', 'guide', 'steps'],
    },
    {
      id: 'meetings-minutes-transcript',
      category: 'meetings',
      title: 'Minutes from a transcript',
      description: 'Turn a video-call transcript into minutes.',
      prompt: `Write the minutes of the meeting from the transcript below.

Structure: participants, topics discussed, decisions, open points, actions (who, what, by when).
Tone: neutral and concise.
Constraint: attribute to no one words they did not say; flag any unclear passage.

Transcript:

"""
[paste the text]
"""`,
      keywords: ['minutes', 'transcript', 'video call', 'meeting'],
    },
    {
      id: 'meetings-questions',
      category: 'meetings',
      title: 'Prepare your questions',
      description: 'The right questions to ask in a meeting.',
      prompt: `I am attending a meeting with [person] about [subject]. My goal: [goal].

Prepare 8 questions ranked by priority, each with what it helps obtain.
Add 2 questions to keep in reserve if the discussion gets tense.
Format: numbered list.`,
      keywords: ['questions', 'prepare', 'meeting', 'interview'],
    },
    {
      id: 'meetings-workshop',
      category: 'meetings',
      title: 'Run a workshop',
      description: 'The timed plan of a participatory workshop.',
      prompt: `Suggest the plan of a [length] workshop with [number] participants about [subject].

Goal: [expected result].
Format: a timed table (sequence, length, facilitation method, materials), with an icebreaker and a conclusion that sets next steps.
Constraint: simple methods that work without digital tools.`,
      keywords: [
        'workshop',
        'facilitation',
        'participatory',
        'agenda',
        'seminar',
      ],
    },
    {
      id: 'meetings-decisions-log',
      category: 'meetings',
      title: 'Decision log',
      description: 'Only what was decided and who is in charge.',
      prompt: `From the notes below, write a decision log.

For each decision: the decision in one sentence, the owner, the deadline.
Format: a table, with no account of the discussion.
Constraint: if an owner or deadline is missing, write [to be defined].

Notes:

"""
[paste the text]
"""`,
      keywords: ['decision log', 'decisions', 'owner', 'deadline', 'meeting'],
    },
    {
      id: 'hr-feedback',
      category: 'hr',
      title: 'Give constructive feedback',
      description: 'Say what works and what must improve, tactfully.',
      prompt: `Help me phrase feedback for [team member] about [situation or work].

Strengths observed: [strengths].
Point to improve: [point to improve].
Structure: a specific fact, its effect, a concrete proposal for what comes next.
Tone: kind and direct.
Format: a message of 8 lines at most, or notes for a conversation if I say so.`,
      keywords: ['feedback', 'manager', 'team member', 'improvement'],
    },
    {
      id: 'hr-smart-objectives',
      category: 'hr',
      title: 'Set SMART objectives',
      description: 'Precise, measurable, dated objectives.',
      prompt: `Turn the priorities below into 3 to 5 SMART objectives for [person or team] over [period].

For each objective: the objective in one sentence, the success indicator, the deadline, the resources needed.
Format: a table.
Constraint: objectives reachable with the stated resources; flag those that seem too ambitious.

Priorities:

"""
[paste the text]
"""`,
      keywords: [
        'objectives',
        'smart',
        'annual review',
        'indicators',
        'priorities',
      ],
    },
    {
      id: 'hr-handover',
      category: 'hr',
      title: 'Prepare a handover',
      description: 'Pass everything on before an absence or departure.',
      prompt: `Help me prepare the handover of my files to [replacement] before [absence or departure] on [date].

For each file below: where it stands, the next step, the deadline, useful contacts and points to watch.
Format: a table, then the list of accesses and documents to pass on.

My files:

"""
[paste the text]
"""`,
      keywords: ['handover', 'absence', 'departure', 'files', 'replacement'],
    },
    {
      id: 'procurement-compare-bids',
      category: 'procurement',
      title: 'Compare bids',
      description: 'An analysis table against the announced criteria.',
      prompt: `Compare the bids below against the announced criteria: [criteria and weightings].

For each bid: what it offers on each criterion, its strengths and weaknesses.
Format: a comparison table, then a 5-line summary.
Constraint: use only the content of the bids; give no final score, the decision belongs to the buyer.

Bids:

"""
[paste the text]
"""`,
      keywords: [
        'bids',
        'compare',
        'public procurement',
        'analysis',
        'criteria',
      ],
    },
    {
      id: 'procurement-risky-clauses',
      category: 'procurement',
      title: 'Spot risky clauses',
      description: 'The points of a contract that need attention.',
      prompt: `Review the contract or agreement below from the point of view of [my organisation].

Find the risky clauses (commitments, penalties, duration, termination, liabilities, data) and explain each risk in one sentence.
Format: a clause, risk, question-to-ask table.
Constraint: this is not legal advice; flag what a lawyer must check.

Contract:

"""
[paste the text]
"""`,
      keywords: ['contract', 'agreement', 'clauses', 'risks', 'legal'],
    },
    {
      id: 'procurement-decree-explained',
      category: 'procurement',
      title: 'Explain a legal text',
      description: 'What changes for staff, in plain words.',
      prompt: `Explain the text below to non-lawyer staff of [department].

Structure: what changes, what does not, what is expected of them, from when.
Tone: simple and precise.
Format: one page at most, with the references of the articles concerned.
Constraint: do not add to the text; flag points open to interpretation.

Text:

"""
[paste the text]
"""`,
      keywords: ['decree', 'order', 'circular', 'explain', 'regulation', 'law'],
    },
    {
      id: 'communication-press-release',
      category: 'communication',
      title: 'Press release',
      description: 'A factual release from a report or an event.',
      prompt: `Write a press release about [subject], from the elements below.

Structure: an informative headline, a lead answering who, what, when, where, why, 3 paragraphs, a quote from [spokesperson] to be approved, the press contact.
Tone: institutional and factual.
Format: one page at most.

Elements:

"""
[paste the text]
"""`,
      keywords: [
        'press release',
        'press',
        'media',
        'announcement',
        'journalists',
      ],
    },
    {
      id: 'communication-multichannel',
      category: 'communication',
      title: 'Adapt a message',
      description: 'The same message for the intranet, chat and social media.',
      prompt: `Adapt the message below into three versions:
1. an intranet article (150 words);
2. a chat message (300 characters);
3. a social media post (280 characters, no jargon).

Audience: [audience].
Constraint: the same information in all three versions.

Message:

"""
[paste the text]
"""`,
      keywords: ['adapt', 'intranet', 'social media', 'chat', 'channels'],
    },
    {
      id: 'data-pivot',
      category: 'data',
      title: 'Build a pivot table',
      description: 'The steps to summarise a table by category.',
      prompt: `I have a table with the following columns: [columns]. I want to get [expected result, e.g. the total per department and per month].

Explain step by step how to build the pivot table in [spreadsheet], then how to present it clearly.
Add the frequent mistakes to avoid.`,
      keywords: ['pivot table', 'spreadsheet', 'excel', 'summary'],
    },
    {
      id: 'data-budget-gaps',
      category: 'data',
      title: 'Analyse budget gaps',
      description: 'Planned, actual and likely causes.',
      prompt: `Analyse the budget table below (planned and actual columns).

Find the lines where the gap exceeds [threshold]%, calculate the gap in value and percentage, and suggest likely causes to check.
Format: a table sorted by decreasing gap, then 3 points of attention.
Constraint: present causes as assumptions.

Table:

"""
[paste the text]
"""`,
      keywords: ['budget', 'gaps', 'planned', 'actual', 'spending', 'finance'],
    },
    {
      id: 'public-documents-list',
      category: 'public',
      title: 'List of documents to provide',
      description: 'A clear list to put a file together.',
      prompt: `Write, for a citizen, the list of documents to provide for [procedure], from the elements below.

For each document: its name, a useful detail (original, copy, under 3 months…), and who it applies to.
Format: a checklist, then the address or link to submit: [address or link].
Constraint: add no document that is not in the elements.

Elements:

"""
[paste the text]
"""`,
      keywords: [
        'documents to provide',
        'file',
        'supporting documents',
        'procedure',
        'citizen',
      ],
    },
    {
      id: 'public-refusal',
      category: 'public',
      title: 'Explain a refusal',
      description: 'Announce an unfavourable decision respectfully.',
      prompt: `Write a letter to [citizen] announcing that their request for [object] is refused.

Reason: [reason].
State the means of appeal ([appeal and deadline]) and, if any, an alternative ([alternative]).
Tone: respectful, clear, no jargon.
Constraint: the reason must be accurate and understandable; no blaming wording.`,
      keywords: [
        'refusal',
        'unfavourable decision',
        'appeal',
        'citizen',
        'letter',
      ],
    },
    {
      id: 'public-faq-users',
      category: 'public',
      title: 'FAQ for citizens',
      description: 'The questions citizens really ask.',
      prompt: `From the citizens' questions below, write an FAQ about [procedure or service].

Group similar questions, phrase them in the citizens' words, and answer each in 3 lines at most.
Format: 8 to 10 questions, ordered by frequency.
Constraint: answer only from the elements provided; flag questions without an answer.

Questions and elements:

"""
[paste the text]
"""`,
      keywords: ['faq', 'frequently asked questions', 'citizens'],
    },
    {
      id: 'project-brief',
      category: 'project',
      title: 'Project brief',
      description: 'Lay the foundations of a project before launching it.',
      prompt: `Write the brief of the project [project name].

Structure: context and stakes, measurable objectives, scope (in and out), stakeholders, timeline, budget, main risks, governance.
Format: 2 pages at most.
Constraint: use the elements below; write [to be specified] for what is missing.

Elements:

"""
[paste the text]
"""`,
      keywords: ['project brief', 'project', 'scoping', 'launch', 'scope'],
    },
    {
      id: 'project-status',
      category: 'project',
      title: 'Progress update',
      description: 'Where the project stands, in one page.',
      prompt: `Write the progress update of the project [name] for [recipients], from the elements below.

Structure: overall status (ahead, on time, late), achievements since the last update, next steps, risks and decisions needed.
Format: one page, with a colour status for each workstream.
Constraint: factual; do not hide delays.

Elements:

"""
[paste the text]
"""`,
      keywords: [
        'progress update',
        'status',
        'reporting',
        'steering',
        'project status',
      ],
    },
    {
      id: 'project-risks',
      category: 'project',
      title: 'Risk register',
      description: 'Identify, assess and handle risks.',
      prompt: `Draw up the risk register of the project [name], from the description below.

For each risk: description, likelihood (low, medium, high), impact, mitigation, owner.
Format: a table sorted by criticality.
Constraint: 8 to 12 realistic risks specific to this project.

Description:

"""
[paste the text]
"""`,
      keywords: [
        'risks',
        'risk register',
        'criticality',
        'mitigation',
        'project',
      ],
    },
    {
      id: 'project-raci',
      category: 'project',
      title: 'Who does what (RACI)',
      description: 'Clarify everyone’s role.',
      prompt: `Draw up a RACI matrix for the project [name].

Actors: [actors].
Activities: [main activities].
For each activity: who does it, who decides, who is consulted, who is informed.
Format: a table, then the grey areas to clarify.`,
      keywords: [
        'raci',
        'roles',
        'responsibilities',
        'who does what',
        'governance',
      ],
    },
    {
      id: 'project-schedule',
      category: 'project',
      title: 'Backward schedule',
      description: 'Start from the deadline to set the steps.',
      prompt: `Build the backward schedule of [project or deliverable] with a deadline on [date].

Known steps: [steps].
For each step: estimated length, start date, end date, dependencies, owner.
Format: a table from nearest to furthest, then the critical steps.
Constraint: flag if the deadline looks unrealistic.`,
      keywords: ['schedule', 'planning', 'timeline', 'deadline', 'milestones'],
    },
    {
      id: 'project-lessons',
      category: 'project',
      title: 'Lessons learned',
      description: 'Draw lessons from a project or a crisis.',
      prompt: `Write the lessons learned from [project or event], from the elements below.

Structure: recap of facts, what worked well, what worked less well, causes, concrete recommendations with an owner.
Tone: constructive, blaming no one.
Format: 2 pages at most.

Elements:

"""
[paste the text]
"""`,
      keywords: ['lessons learned', 'review', 'retrospective', 'crisis'],
    },
    {
      id: 'project-indicators',
      category: 'project',
      title: 'Monitoring indicators',
      description: 'Measure progress and results.',
      prompt: `Suggest indicators to monitor the project [name], whose objectives are: [objectives].

For each indicator: what it measures, the formula, the data source, the frequency, the target.
Format: a table of 6 indicators at most, mixing progress and results.
Constraint: indicators measurable with data that is really available.`,
      keywords: ['indicators', 'dashboard', 'monitoring', 'steering', 'kpi'],
    },
    {
      id: 'project-steering',
      category: 'project',
      title: 'Prepare a steering committee',
      description: 'The deck and the decisions to obtain.',
      prompt: `Prepare the steering committee of the project [name] on [date].

Suggest: the timed agenda, the content of 6 slides (progress, budget, risks, decisions expected), and the list of decisions to be approved.
Constraint: use the elements below; highlight the trade-offs needed.

Elements:

"""
[paste the text]
"""`,
      keywords: [
        'steering committee',
        'governance',
        'decision',
        'presentation',
      ],
    },
  ],
};
