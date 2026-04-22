const MERCURE_PUBLIC_URL = import.meta.env.VITE_MERCURE_PUBLIC_URL ?? '/.well-known/mercure';

function buildMercureUrl(topics) {
  const url = new URL(MERCURE_PUBLIC_URL, window.location.origin);

  topics.forEach((topic) => {
    url.searchParams.append('topic', topic);
  });

  return url.toString();
}

export function subscribeToTopics(topics, { onMessage, onError } = {}) {
  const normalizedTopics = topics.filter(Boolean);

  if (0 === normalizedTopics.length || 'undefined' === typeof window.EventSource) {
    return () => {};
  }

  const eventSource = new window.EventSource(buildMercureUrl(normalizedTopics));

  eventSource.onmessage = (event) => {
    if (!event?.data) {
      return;
    }

    try {
      onMessage?.(JSON.parse(event.data));
    } catch {
      // Ignore malformed realtime payloads instead of breaking the page.
    }
  };

  eventSource.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    eventSource.close();
  };
}
