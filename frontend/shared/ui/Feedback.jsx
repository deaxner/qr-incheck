import React from 'react';

export function Feedback({ feedback }) {
  if (!feedback) {
    return null;
  }

  return (
    <div className={`feedback feedback-${feedback.kind}`} role="status" aria-live="polite">
      {feedback.message}
    </div>
  );
}
