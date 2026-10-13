import { useLibraryStore } from '../library/useLibraryStore';
import { claimNestorData } from '../stores/accountScope';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';

describe('claimNestorData — one account, its own data', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the data of the same account', async () => {
    await claimNestorData('agent-a');
    useLibraryStore.setState({ favorites: ['meeting-agenda'] });
    await claimNestorData('agent-a');
    expect(useLibraryStore.getState().favorites).toEqual(['meeting-agenda']);
  });

  it('another account on this browser starts empty: nothing of the previous one', async () => {
    await claimNestorData('agent-a');
    useLibraryStore.setState({ favorites: ['meeting-agenda'] });
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    useNestorChatStore.getState().post('c1', { kind: 'reply', text: 'avant' });
    await claimNestorData('agent-b');
    expect(useLibraryStore.getState().favorites).toEqual([]);
    expect(useProfileStore.getState().job).toBeNull();
    expect(useNestorChatStore.getState().chats).toEqual({});
    expect(localStorage.getItem('prompt-library')).not.toContain(
      'meeting-agenda',
    );
  });

  it('never stores the account itself, only a fingerprint', async () => {
    await claimNestorData('agent-a');
    expect(JSON.stringify({ ...localStorage })).not.toContain('agent-a');
  });
});
