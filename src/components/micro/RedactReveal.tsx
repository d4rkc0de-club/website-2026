const LINE_SEGMENTS = [
  { text: "Next CTF meeting is on ", isRedacted: false },
  { text: "Friday at 6 PM", isRedacted: true },
  { text: " in room ", isRedacted: false },
  { text: "404", isRedacted: true },
  { text: ". The password is ", isRedacted: false },
  { text: "c0ffee", isRedacted: true },
  { text: ".", isRedacted: false },
] as const;

export function RedactReveal() {
  return (
    <p className="max-w-md font-mono text-sm leading-8">
      {LINE_SEGMENTS.map(({ text, isRedacted }, segmentIndex) =>
        isRedacted ? (
          <span key={segmentIndex} tabIndex={0} className="micro-redact">
            {text}
          </span>
        ) : (
          <span key={segmentIndex}>{text}</span>
        ),
      )}
    </p>
  );
}
