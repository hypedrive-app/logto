import { InteractionHookEvent } from '@logto/schemas';
import { vi } from 'vitest';

describe('webhook event visibility', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('always includes the adaptive MFA hook event', async () => {
    const { interactionHookEvents } = await import('./webhooks');

    expect(interactionHookEvents).toContain(InteractionHookEvent.PostSignInAdaptiveMfaTriggered);
  });
});
