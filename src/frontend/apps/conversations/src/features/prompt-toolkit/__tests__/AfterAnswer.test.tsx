import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useCoachThreadStore } from '../stores/useCoachThreadStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'conversation-1',
}));

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

describe('the coach after an answer', () => {
  const setChatInput = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useProfileStore.setState({ isBeginner: false });
    useCoachThreadStore.setState({ threads: {} });
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput,
      coachMode: 'instant',
    });
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Rédige un courriel pour la réunion.' },
        { role: 'assistant', text: 'Voici le courriel.' },
      ],
      latestCompletedAssistantMessageId: 'answer-1',
      isAssistantResponding: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const nextGroups = {
    deepen: ['Ajoute l’ordre du jour.', 'Détaille le point 2.'],
    reshape: ['Fais plus court.', 'Mets-le en tableau.'],
    step_back: ['Qu’est-ce qui manque ?', 'Quels risques ?'],
    extra: [
      {
        label: 'Logistique',
        questions: ['Propose une salle.', 'Prévois la visio.'],
      },
    ],
  };
  const adviceAndNext = (init?: RequestInit) => {
    const text = (init?.body as string) ?? '';
    return Promise.resolve(
      text.includes('next questions')
        ? completion(nextGroups)
        : text.includes('Give your coaching advice')
          ? completion({ worked: 'Bien.', try: 'Donnez la salle.' })
          : completion({}),
    );
  };

  it('prepares the next questions by itself and shows them under the advice, folded', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      adviceAndNext(init),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);

    // Prepared without a click, while "as you type" stays shown.
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(
      screen.getByRole('button', { name: 'Nestor’s view on this exchange' }),
    );
    expect(await screen.findByText('Donnez la salle.')).toBeInTheDocument();
    expect(screen.getByText('Other ways to go on')).toBeInTheDocument();
    for (const axis of ['Go deeper', 'Reshape', 'Step back']) {
      expect(screen.getByRole('region', { name: axis })).toBeInTheDocument();
    }
    // Folded: the main question of each standard axis.
    expect(
      screen.queryByRole('button', { name: /Détaille le point 2/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Logistique')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'See more ways' }));
    expect(
      screen.getByRole('button', { name: /Détaille le point 2/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Logistique' }),
    ).toBeInTheDocument();
    expect(screen.getByText('For this answer')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Ajoute l’ordre du jour/ }),
    );
    expect(setChatInput).toHaveBeenCalledWith('Ajoute l’ordre du jour.');
  });

  it('shows beginners the main questions only', async () => {
    useProfileStore.setState({ isBeginner: true });
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => adviceAndNext(init)),
    );
    usePromptToolkitStore.setState({ coachMode: 'advice' });
    render(<CoachPanel />);
    expect(
      await screen.findByRole('button', { name: /Ajoute l’ordre du jour/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Détaille le point 2.')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'See more ways' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Logistique')).not.toBeInTheDocument();
  });

  const body = (init?: RequestInit) => (init?.body as string) ?? '';
  const firstNote = {
    worked: 'Vous avez donné le jour de la réunion.',
    issue: 'Le courriel ne dit pas où elle a lieu.',
    try: 'Donnez la salle à l’Assistant.',
    prompt: 'Ajoute que la réunion a lieu en salle 204.',
    habit: 'Donnez toujours le lieu et l’heure.',
    competency: 'context',
  };

  it('gives Nestor’s view as a thread, and goes on with a click', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        body(init).includes('Why does your advice')
          ? completion({ message: 'Sans le lieu, personne ne vient.' })
          : body(init).includes('Give your coaching advice')
            ? completion(firstNote)
            : completion({}),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Nestor’s view on this exchange' }),
    );

    expect(
      await screen.findByText('Donnez la salle à l’Assistant.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Since the start/)).toBeInTheDocument();
    expect(
      screen.getByText('Le courriel ne dit pas où elle a lieu.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Donnez toujours le lieu et l’heure.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    // The proposed request is one click away, its text folded.
    expect(
      screen.queryByText('Ajoute que la réunion a lieu en salle 204.'),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'See the proposed request' }),
    );
    expect(
      screen.getByText('Ajoute que la réunion a lieu en salle 204.'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Put it in the message field' }),
    );
    expect(setChatInput).toHaveBeenCalledWith(
      'Ajoute que la réunion a lieu en salle 204.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(
      await screen.findByText('Sans le lieu, personne ne vient.'),
    ).toBeInTheDocument();
    // Asked once: the button is gone, the two others stay.
    expect(
      screen.queryByRole('button', { name: 'Why?' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show me an example' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Another way' }),
    ).not.toBeInTheDocument();
  });

  it('reads only the exchanges since its last advice, and checks it', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        !body(init).includes('Give your coaching advice')
          ? completion({})
          : body(init).includes('salle 204')
            ? completion({
                follow_up: 'Vous avez ajouté la salle : bravo.',
                applied: true,
                worked: 'La salle est là.',
                issue: 'Il reste la date.',
                try: 'Donnez la date.',
                habit: 'Relisez avant d’envoyer.',
                competency: 'verification',
              })
            : completion(firstNote),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ coachMode: 'advice' });
    render(<CoachPanel />);
    expect(
      await screen.findByText('Donnez la salle à l’Assistant.'),
    ).toBeInTheDocument();

    // A new answer, with gaps, while "Advice" is shown: read at once.
    await act(async () => {
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: 'Rédige un courriel pour la réunion.' },
          { role: 'assistant', text: 'Voici le courriel.' },
          { role: 'user', text: 'Ajoute que la réunion a lieu en salle 204.' },
          { role: 'assistant', text: 'Réunion le [date] en salle [salle].' },
        ],
        latestCompletedAssistantMessageId: 'answer-2',
      });
      await Promise.resolve();
    });
    expect(await screen.findByText('[date] · [salle]')).toBeInTheDocument();
    expect(
      await screen.findByText('Vous avez ajouté la salle : bravo.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Since my last advice/)).toBeInTheDocument();
    // The first note stays above the new one.
    expect(
      screen.getByText('Vous avez donné le jour de la réunion.'),
    ).toBeInTheDocument();

    const notes = fetchMock.mock.calls
      .map(([, init]) => body(init))
      .filter((text) => text.includes('Give your coaching advice'));
    expect(notes).toHaveLength(2);
    const second = JSON.parse(notes[1]) as {
      messages: { content: string }[];
    };
    const asked = second.messages[1].content;
    expect(asked).toContain('[date], [salle]');
    expect(asked).toMatch(/<previous>\nDonnez la salle à l’Assistant\./);
    expect(asked.split('<since>')[1]).not.toContain('Voici le courriel.');
    expect(asked.split('<since>')[0]).toContain('Voici le courriel.');
  });
});
