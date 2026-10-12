import {
  NEW_CHAT_KEY,
  messagesOf,
  pendingRounds,
  useNestorChatStore,
} from '../stores/useNestorChatStore';

const store = () => useNestorChatStore.getState();

describe('useNestorChatStore', () => {
  beforeEach(() => useNestorChatStore.setState({ chats: {} }));

  it('posts messages in the current action, a new action after beginAction', () => {
    store().post('c1', { kind: 'hint', hint: 'write-first' });
    store().beginAction('c1');
    store().post('c1', { kind: 'reply', text: 'Bonjour' });
    const [first, second] = messagesOf(store().chats, 'c1');
    expect(first.action).toBe(0);
    expect(second.action).toBe(1);
  });

  it('keeps the rounds of the latest message only', () => {
    store().post('c1', {
      kind: 'hint',
      hint: 'write-first',
      rounds: [{ id: 'examples' }],
    });
    store().post('c1', {
      kind: 'reply',
      text: 'Oui',
      rounds: [{ id: 'shorter' }],
    });
    const messages = messagesOf(store().chats, 'c1');
    expect(messages[0].rounds).toBeUndefined();
    expect(pendingRounds(messages)).toEqual([{ id: 'shorter' }]);
  });

  it('removes the rounds of a message once one is clicked', () => {
    const id = store().post('c1', {
      kind: 'reply',
      text: 'Oui',
      rounds: [{ id: 'shorter' }],
    });
    store().consumeRounds('c1', id);
    expect(pendingRounds(messagesOf(store().chats, 'c1'))).toEqual([]);
  });

  it('moves the thread written before the conversation existed', () => {
    store().post(NEW_CHAT_KEY, { kind: 'reply', text: 'Avant' });
    store().adopt(NEW_CHAT_KEY, 'c2');
    expect(messagesOf(store().chats, NEW_CHAT_KEY)).toEqual([]);
    expect(messagesOf(store().chats, 'c2')).toHaveLength(1);
  });

  it('never adopts over an existing thread', () => {
    store().post(NEW_CHAT_KEY, { kind: 'reply', text: 'Avant' });
    store().post('c2', { kind: 'reply', text: 'Déjà là' });
    store().adopt(NEW_CHAT_KEY, 'c2');
    expect(messagesOf(store().chats, 'c2')).toHaveLength(1);
    expect(messagesOf(store().chats, NEW_CHAT_KEY)).toHaveLength(1);
  });

  it('marks an event undone without removing it', () => {
    const id = store().post('c1', { kind: 'placed', previous: 'brouillon' });
    store().markUndone('c1', id);
    expect(messagesOf(store().chats, 'c1')[0]).toMatchObject({ undone: true });
  });
});
