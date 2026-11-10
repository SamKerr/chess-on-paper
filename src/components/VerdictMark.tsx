import { VERDICT_WORDS, type Verdict } from "../lib/evaluation";

/**
 * Evaluation symbols drawn from strokes rather than font glyphs: in many fonts ⩲ looks
 * exactly like ±, and ⩱ like ∓, which makes a printed scale ambiguous.
 */
const W = 1.6; // stroke width, in a 12 x 12 box

function Plus({ x, y, s = 4 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`} />;
}

function Bar({ x, y, s = 4 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x - s} ${y}H${x + s}`} />;
}

const SHAPES: Record<Verdict, { width: number; body: React.ReactNode }> = {
  "+-": { width: 23, body: <><Plus x={5} y={6} /><Bar x={18} y={6} /></> },
  "+/-": { width: 12, body: <><Plus x={6} y={4.5} s={3.5} /><Bar x={6} y={10.5} /></> },
  "+=": { width: 12, body: <><Plus x={6} y={3.8} s={3} /><Bar x={6} y={8.6} /><Bar x={6} y={11.4} /></> },
  "=": { width: 12, body: <><Bar x={6} y={4.6} /><Bar x={6} y={7.4} /></> },
  "=+": { width: 12, body: <><Bar x={6} y={0.6} /><Bar x={6} y={3.4} /><Plus x={6} y={8.2} s={3} /></> },
  "-/+": { width: 12, body: <><Bar x={6} y={1.5} /><Plus x={6} y={7.5} s={3.5} /></> },
  "-+": { width: 23, body: <><Bar x={5} y={6} /><Plus x={18} y={6} /></> },
  unclear: {
    width: 16,
    body: <path d="M8 6C6 3.2 1.6 3.2 1.6 6S6 8.8 8 6S14.4 3.2 14.4 6S10 8.8 8 6Z" />,
  },
};

export function VerdictMark({ verdict, className = "" }: { verdict: Verdict; className?: string }) {
  const { width, body } = SHAPES[verdict];
  return (
    <svg
      className={`verdict-mark ${className}`}
      viewBox={`0 -0.5 ${width} 13`}
      width={`${width / 12}em`}
      height="1.08em"
      role="img"
      aria-label={VERDICT_WORDS[verdict]}
      fill="none"
      stroke="currentColor"
      strokeWidth={W}
      strokeLinecap="round"
    >
      {body}
    </svg>
  );
}
