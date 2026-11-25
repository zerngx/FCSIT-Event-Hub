// Placeholder shapes shown while a page's data streams in, so a click gets an instant visual response.

const block = "animate-pulse rounded-[var(--radius-bento)] bg-ink/[0.07]";
const line = "animate-pulse rounded-full bg-ink/[0.08]";

export function Skeleton({ variant }: { variant: "cards" | "detail" | "list" | "form" }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-5">
      {variant === "cards" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${block} h-60`} />
          ))}
        </div>
      )}
      {variant === "detail" && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className={`${block} space-y-4 p-8`}>
            <div className={`${line} h-5 w-32`} />
            <div className={`${line} h-12 w-4/5`} />
            <div className={`${line} h-4 w-1/2`} />
            <div className="grid grid-cols-3 gap-3 pt-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${line} h-20 rounded-3xl`} />
              ))}
            </div>
          </div>
          <div className={`${block} h-80`} />
        </div>
      )}
      {variant === "list" &&
        [0, 1, 2].map((i) => (
          <div key={i} className={`${block} flex items-center gap-4 p-5`}>
            <div className={`${line} h-12 w-12 shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${line} h-4 w-1/2`} />
              <div className={`${line} h-3 w-1/3`} />
            </div>
          </div>
        ))}
      {variant === "form" && (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className={`${line} h-3 w-24`} />
              <div className={`${line} h-11 w-full rounded-2xl`} />
            </div>
          ))}
        </div>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
