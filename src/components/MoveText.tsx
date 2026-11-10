import { PIECE_SVG } from "../lib/pieces";

/**
 * Chess text with piece letters drawn as figurines when asked. The figurines use the
 * board's own piece artwork, so they look the same in every font and on paper.
 * Only K, Q, R, B and N are pieces in SAN; files are lowercase and castling uses O.
 */
export function MoveText({ text, figurines }: { text: string; figurines: boolean }) {
  if (!figurines) return <>{text}</>;
  return (
    <>
      {text.split(/([KQRBN])/).map((part, i) =>
        i % 2 === 1 ? (
          <svg key={i} className="figurine" viewBox="2 2 41 41" role="img" aria-label={part}>
            <g dangerouslySetInnerHTML={{ __html: PIECE_SVG[part] }} />
          </svg>
        ) : (
          part
        ),
      )}
    </>
  );
}
