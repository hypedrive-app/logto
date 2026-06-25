/**
 * A self-contained, pure-ESM page-range calculator that replaces the page-sequence logic
 * we previously borrowed from `react-paginate` (a CommonJS package that breaks under Vite 8's
 * default-import interop and crashes with React "Element type is invalid" / #130).
 *
 * It mirrors `react-paginate`'s `pageRangeDisplayed` / `marginPagesDisplayed` semantics so the
 * rendered sequence is unchanged: a window of pages around the active page, the first/last few
 * pages always visible, and `'ellipsis'` markers where pages are skipped.
 */

/** A single item in the rendered pagination sequence: a 1-based page number or an ellipsis gap. */
export type PaginationItem = number | 'ellipsis';

type Options = {
  /** Total number of pages (>= 1). */
  readonly pageCount: number;
  /** The active page, 1-based. */
  readonly page: number;
  /**
   * How many pages to show around the active page (matches `react-paginate`'s `pageRangeDisplayed`).
   * Defaults to 2. Use `0` to render no numbered pages (prev/next only).
   */
  readonly pageRangeDisplayed?: number;
  /**
   * How many pages to always show at each edge (matches `react-paginate`'s `marginPagesDisplayed`).
   * Defaults to 3.
   */
  readonly marginPagesDisplayed?: number;
};

/**
 * Builds the ordered list of page numbers and ellipsis gaps to render.
 *
 * When every page fits without gaps, returns the full `[1..pageCount]` sequence. Otherwise it
 * keeps the margin pages at both ends and a window around the active page, inserting a single
 * `'ellipsis'` for each skipped span.
 */
export const getPaginationRange = ({
  pageCount,
  page,
  pageRangeDisplayed = 2,
  marginPagesDisplayed = 3,
}: Options): PaginationItem[] => {
  if (pageCount <= 0) {
    return [];
  }

  const allPages = Array.from({ length: pageCount }, (_, index) => index + 1);

  // `pageRangeDisplayed <= 0` means "no numbered pages" (pico mode renders only prev/next).
  if (pageRangeDisplayed <= 0 && marginPagesDisplayed <= 0) {
    return [];
  }

  // The set of pages to keep: both margins + a window centered on the active page.
  const visible = new Set<number>();

  for (let index = 1; index <= Math.min(marginPagesDisplayed, pageCount); index += 1) {
    visible.add(index);
    visible.add(pageCount - index + 1);
  }

  // Center a window of `pageRangeDisplayed` pages on the active page (extra page goes after the
  // active one for even ranges, matching react-paginate's bias toward later pages).
  const before = Math.floor((pageRangeDisplayed - 1) / 2);
  const after = Math.ceil((pageRangeDisplayed - 1) / 2);
  for (let index = page - before; index <= page + after; index += 1) {
    if (index >= 1 && index <= pageCount) {
      visible.add(index);
    }
  }
  // Ensure the active page itself is always present even when `pageRangeDisplayed` is 0.
  visible.add(page);

  const result: PaginationItem[] = [];
  let previous = 0;
  for (const pageNumber of allPages) {
    if (!visible.has(pageNumber)) {
      continue;
    }
    if (previous && pageNumber - previous > 1) {
      result.push('ellipsis');
    }
    result.push(pageNumber);
    previous = pageNumber;
  }

  return result;
};
