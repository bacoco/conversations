import { coachChat, suggestPistes } from '../chat/nestorChatApi';
import {
  coachThreadNote,
  reviewSession,
  suggestNextQuestions,
} from '../coach/coachApi';
import { useProfileStore } from '../stores/useProfileStore';

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

const systemOf = (fetchMock: ReturnType<typeof vi.spyOn>) =>
  (
    JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as {
      messages: { role: string; content: string }[];
    }
  ).messages[0].content;

const CONVERSATION = [
  { role: 'user' as const, text: 'Réponds à l’agent sur ses RTT.' },
  { role: 'assistant' as const, text: 'Bonjour, …' },
];

describe('every call of Nestor knows the user’s job', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useProfileStore.setState({
      job: { id: 'rh', label: 'Gestionnaire RH' },
      isBeginner: false,
    });
  });
  afterAll(() => useProfileStore.setState({ job: null }));

  it('« Demander à Nestor »', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ message: 'Oui.' }));
    await coachChat(
      {
        history: [{ role: 'user', text: 'Comment je fais ?' }],
        draft: '',
        done: [],
      },
      'French',
    );
    // Told once, never twice.
    expect(systemOf(fetchMock).split('Gestionnaire RH')).toHaveLength(2);
  });

  it('the advice after an answer', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ try: 'Dites le ton.' }));
    await coachThreadNote(CONVERSATION, null, 'French');
    // Told once, never twice.
    expect(systemOf(fetchMock).split('Gestionnaire RH')).toHaveLength(2);
  });

  it('« Pour continuer »', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ groups: [] }));
    await suggestNextQuestions(CONVERSATION, 'French');
    // Told once, never twice.
    expect(systemOf(fetchMock).split('Gestionnaire RH')).toHaveLength(2);
  });

  it('the review', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ summary: 'Bien.', strengths: [], tips: [] }),
      );
    await reviewSession(['Réponds à l’agent.'], 'French');
    // Told once, never twice.
    expect(systemOf(fetchMock).split('Gestionnaire RH')).toHaveLength(2);
  });

  it('the ideas while typing, already told: still once', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ phrases: ['Réponds à l’agent.'] }));
    await suggestPistes('réponds à l’agent', 'French');
    // Told once, never twice.
    expect(systemOf(fetchMock).split('Gestionnaire RH')).toHaveLength(2);
  });
});
