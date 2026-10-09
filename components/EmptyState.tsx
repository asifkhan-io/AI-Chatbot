import { SUGGESTIONS } from "@/lib/personas";

export default function EmptyState({
  onPick,
}: {
  onPick: (t: string) => void;
}) {
  return (
    <div className='empty'>
      <div className='empty-logo'>AI</div>
      <h1>How can I help you today?</h1>
      <p>Ask anything, or start with one of these.</p>
      <div className='suggestions'>
        {SUGGESTIONS.map((s) => (
          <button key={s} className='suggestion' onClick={() => onPick(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
