import { act, fireEvent, render, screen } from '@testing-library/react';

import { useDemoStore } from '../stores/useDemoStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTour, useTourStore } from '../stores/useTourStore';
import { TourStage, recordedVoiceUrl } from '../tour/TourStage';
import { TOUR_STEPS } from '../tour/tourScript';

const indexOf = (id: string) => TOUR_STEPS.findIndex((step) => step.id === id);

describe('the guided tour: Nestor speaks, the real buttons flash', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useTourStore.getState().stop();
    useDemoStore.getState().stop();
    useProfileStore.setState({
      job: { id: 'rh', label: 'Gestionnaire RH' },
      hasSeenTour: false,
    });
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput: vi.fn(),
      mode: 'learn',
      showHome: false,
      isOpen: false,
    });
  });

  it('starts on the home page of the panel, once seen never by itself again', () => {
    startTour();
    expect(useTourStore.getState()).toMatchObject({
      active: true,
      index: 0,
      onFilm: true,
    });
    expect(usePromptToolkitStore.getState().isOpen).toBe(true);
    // « Faire la visite guidée »: the home page's cards.
    act(() => useTourStore.getState().takeTour());
    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: true,
      hasSeenWelcome: true,
    });
    expect(useProfileStore.getState().hasSeenTour).toBe(true);
  });

  it('opens on the film, still: it plays only when asked', () => {
    startTour();
    render(<TourStage />);
    const film = screen.getByLabelText('Presentation of Nestor');
    expect(film).toHaveAttribute('controls');
    expect(film).not.toHaveAttribute('autoplay');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(useTourStore.getState().active).toBe(false);
  });

  it('a click outside the window closes it; inside, nothing happens', () => {
    startTour();
    render(<TourStage />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(useTourStore.getState().active).toBe(true);
    fireEvent.click(screen.getByTestId('tour-backdrop'));
    expect(useTourStore.getState().active).toBe(false);
  });

  it('Nestor says the step; « Suivant » goes on; « Passer la visite » ends it', () => {
    startTour();
    render(<TourStage />);
    fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }));
    expect(screen.getByText(/I am Nestor, your coach/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(useTourStore.getState().index).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Skip the tour' }));
    expect(useTourStore.getState().active).toBe(false);
  });

  it('the button Nestor speaks of flashes, on the real screen', () => {
    const card = document.createElement('button');
    card.dataset.tour = 'card-coach-manual';
    document.body.appendChild(card);
    startTour();
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('home-coach') }),
    );
    render(<TourStage />);
    expect(card).toHaveClass('nestor-tour-flash');
  });

  it('a card not on screen is passed, after giving the page time to show it', () => {
    vi.useFakeTimers();
    startTour();
    act(() =>
      useTourStore.setState({
        onFilm: false,
        index: indexOf('home-transcribe'),
      }),
    );
    render(<TourStage />);
    // The home page may still be appearing: not passed at once.
    expect(useTourStore.getState().index).toBe(indexOf('home-transcribe'));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(useTourStore.getState().index).toBe(indexOf('home-transcribe') + 1);
    vi.useRealTimers();
  });

  it('a card that shows a moment later flashes, it is not passed', () => {
    vi.useFakeTimers();
    startTour();
    act(() =>
      useTourStore.setState({
        onFilm: false,
        index: indexOf('home-transcribe'),
      }),
    );
    render(<TourStage />);
    const card = document.createElement('button');
    card.dataset.tour = 'card-transcription';
    document.body.appendChild(card);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(useTourStore.getState().index).toBe(indexOf('home-transcribe'));
    expect(card).toHaveClass('nestor-tour-flash');
    vi.useRealTimers();
  });

  it('the coach first: it is the most important', () => {
    const order = TOUR_STEPS.map((step) => step.id);
    expect(order.indexOf('home-coach')).toBe(1);
  });

  it('« Cliquez sur la carte Coach »: it waits for the click, then the try begins', () => {
    const card = document.createElement('button');
    card.dataset.tour = 'card-coach-manual';
    document.body.appendChild(card);
    startTour();
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('open-coach') }),
    );
    render(<TourStage />);
    // « Suivant » stays in its place, greyed: the click is asked for.
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    act(() => usePromptToolkitStore.getState().openSection('coach'));
    expect(useTourStore.getState().index).toBe(indexOf('open-coach') + 1);
    // An example of the job is in the field: the buttons work on it.
    expect(useDemoStore.getState().active).toBe(true);
  });

  it('« Cliquez sur Analyser »: goes on once the analysis is there', () => {
    startTour();
    useDemoStore.getState().start('');
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('try-analyse') }),
    );
    render(<TourStage />);
    act(() => useDemoStore.getState().markDone('analyse'));
    expect(useTourStore.getState().index).toBe(indexOf('try-analyse') + 1);
  });

  it('shows the very picture to click: the card’s own Nestor', () => {
    startTour();
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('home-coach') }),
    );
    render(<TourStage />);
    expect(screen.getByRole('img', { name: 'Coach' })).toHaveAttribute(
      'src',
      '/assets/nestor-analyse.webp',
    );
  });

  it('for a button of the bar: the button itself, round and named', () => {
    startTour();
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('coach-analyse') }),
    );
    render(<TourStage />);
    expect(
      screen.getByRole('img', { name: 'Analyse my text' }),
    ).toBeInTheDocument();
  });

  it('in French, Nestor’s own recorded voice says each step', () => {
    expect(recordedVoiceUrl('hello', 'fr')).toBe(
      `${import.meta.env.BASE_URL}assets/nestor-voice/hello.mp3`,
    );
    // Recorded in French only: other languages keep the browser’s voice.
    expect(recordedVoiceUrl('hello', 'en')).toBeNull();
    // Every step has its recording.
    TOUR_STEPS.forEach((step) =>
      expect(recordedVoiceUrl(step.id, 'fr')).toContain(`/${step.id}.mp3`),
    );
  });

  it('the tour’s window leaves the Assistant’s left menu visible', () => {
    const menu = document.createElement('div');
    menu.dataset.testid = 'left-panel-desktop';
    menu.getBoundingClientRect = () =>
      ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 900,
        height: 900,
      }) as DOMRect;
    document.body.appendChild(menu);
    startTour();
    // The tour itself, beside the menu (the film alone takes the screen).
    act(() => useTourStore.setState({ onFilm: false, index: 0 }));
    render(<TourStage />);
    expect(screen.getByTestId('tour-backdrop')).toHaveStyle({ left: '300px' });
  });

  it('a click elsewhere on the page closes the tour (the panel included)', () => {
    const other = document.createElement('button');
    document.body.appendChild(other);
    startTour();
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('home-course') }),
    );
    render(<TourStage />);
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(useTourStore.getState().active).toBe(true);
    fireEvent.pointerDown(other);
    expect(useTourStore.getState().active).toBe(false);
  });

  it('a click on what is flashing, when Nestor asks for it, goes on', () => {
    const card = document.createElement('button');
    card.dataset.tour = 'card-coach-manual';
    document.body.appendChild(card);
    startTour();
    act(() =>
      useTourStore.setState({ onFilm: false, index: indexOf('open-coach') }),
    );
    render(<TourStage />);
    fireEvent.pointerDown(card);
    expect(useTourStore.getState().active).toBe(true);
  });

  it('the film takes the whole screen, not the strip beside the panel', () => {
    const box = (
      testid: string,
      tour: string | null,
      left: number,
      right: number,
    ) => {
      const el = document.createElement('div');
      if (testid) el.dataset.testid = testid;
      if (tour) el.dataset.tour = tour;
      el.getBoundingClientRect = () =>
        ({
          left,
          right,
          width: right - left,
          top: 0,
          bottom: 900,
          height: 900,
        }) as DOMRect;
      document.body.appendChild(el);
    };
    box('left-panel-desktop', null, 0, 300);
    box('', 'panel', 1000, 1400);
    startTour();
    render(<TourStage />);
    expect(screen.getByTestId('tour-backdrop')).toHaveStyle({
      left: '0px',
      right: '0px',
    });
  });
});
