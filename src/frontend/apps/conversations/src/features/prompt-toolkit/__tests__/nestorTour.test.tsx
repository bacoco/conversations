import { act, fireEvent, render, screen } from '@testing-library/react';

import { useDemoStore } from '../stores/useDemoStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTour, useTourStore } from '../stores/useTourStore';
import { TourStage } from '../tour/TourStage';
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
    expect(useTourStore.getState()).toMatchObject({ active: true, index: 0 });
    expect(usePromptToolkitStore.getState()).toMatchObject({
      isOpen: true,
      showHome: true,
    });
    expect(useProfileStore.getState().hasSeenTour).toBe(true);
  });

  it('Nestor says the step; « Suivant » goes on; « Passer la visite » ends it', () => {
    startTour();
    render(<TourStage />);
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
    act(() => useTourStore.setState({ index: indexOf('home-coach') }));
    render(<TourStage />);
    expect(card).toHaveClass('nestor-tour-flash');
  });

  it('a step about something not on screen is passed', () => {
    startTour();
    act(() => useTourStore.setState({ index: indexOf('home-transcribe') }));
    render(<TourStage />);
    expect(useTourStore.getState().index).toBe(indexOf('home-transcribe') + 1);
  });

  it('« Cliquez sur la carte Coach »: it waits for the click, then the try begins', () => {
    const card = document.createElement('button');
    card.dataset.tour = 'card-coach-manual';
    document.body.appendChild(card);
    startTour();
    act(() => useTourStore.setState({ index: indexOf('open-coach') }));
    render(<TourStage />);
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    act(() => usePromptToolkitStore.getState().openSection('coach'));
    expect(useTourStore.getState().index).toBe(indexOf('open-coach') + 1);
    // An example of the job is in the field: the buttons work on it.
    expect(useDemoStore.getState().active).toBe(true);
  });

  it('« Cliquez sur Analyser »: goes on once the analysis is there', () => {
    startTour();
    useDemoStore.getState().start('');
    act(() => useTourStore.setState({ index: indexOf('try-analyse') }));
    render(<TourStage />);
    act(() => useDemoStore.getState().markDone('analyse'));
    expect(useTourStore.getState().index).toBe(indexOf('try-analyse') + 1);
  });

  it('shows the very picture to click: the card’s own Nestor', () => {
    startTour();
    act(() => useTourStore.setState({ index: indexOf('home-coach') }));
    render(<TourStage />);
    expect(screen.getByRole('img', { name: 'Coach' })).toHaveAttribute(
      'src',
      '/assets/nestor-analyse.webp',
    );
  });

  it('for a button of the bar: the button itself, round and named', () => {
    startTour();
    act(() => useTourStore.setState({ index: indexOf('coach-analyse') }));
    render(<TourStage />);
    expect(
      screen.getByRole('img', { name: 'Analyse my text' }),
    ).toBeInTheDocument();
  });
});
