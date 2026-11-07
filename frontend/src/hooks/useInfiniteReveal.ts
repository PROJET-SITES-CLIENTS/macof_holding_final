import { useEffect, useRef, useState } from "react";

/**
 * Reveals a long client-side array progressively as the user scrolls, instead
 * of mounting every row at once. Keeps the existing fetch-everything API
 * calls unchanged — only the rendering is chunked.
 *
 * @param items      Full list already loaded from the API.
 * @param pageSize   Rows revealed per batch.
 * @param rootRef    Ref to the scrollable container to observe within
 *                    (pass the div with `overflow-y-auto`, not the whole page).
 */
export function useInfiniteReveal<T>(
  items: T[],
  pageSize = 20,
  rootRef?: React.RefObject<HTMLElement | null>,
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset the reveal window whenever the underlying dataset is reloaded
  // (e.g. after a create/edit/delete triggers a refetch).
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + pageSize, items.length));
        }
      },
      { root: rootRef?.current ?? null, rootMargin: "160px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, pageSize, rootRef]);

  return {
    visibleItems: items.slice(0, visibleCount),
    visibleCount: Math.min(visibleCount, items.length),
    total: items.length,
    hasMore: visibleCount < items.length,
    sentinelRef,
  };
}
