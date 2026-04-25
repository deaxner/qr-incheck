import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribeToTopics } from '../../../shared/api/mercure';

class MockEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    MockEventSource.instances.push(this);
  }

  close() {}
}

describe('subscribeToTopics', () => {
  afterEach(() => {
    MockEventSource.instances = [];
    vi.restoreAllMocks();
  });

  it('normalizes topics before opening a Mercure connection', () => {
    vi.stubGlobal('EventSource', MockEventSource);

    subscribeToTopics(['/employees/2', '', ' /admin/activity ', '/employees/2', '/employees/1']);

    expect(MockEventSource.instances).toHaveLength(1);

    const { url } = MockEventSource.instances[0];
    const topicValues = new URL(url).searchParams.getAll('topic');

    expect(topicValues).toEqual(['/admin/activity', '/employees/1', '/employees/2']);
  });

  it('does not open a connection when no valid topics remain', () => {
    vi.stubGlobal('EventSource', MockEventSource);

    subscribeToTopics(['', '   ', null, undefined]);

    expect(MockEventSource.instances).toHaveLength(0);
  });
});
