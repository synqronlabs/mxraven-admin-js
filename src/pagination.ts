/**
 * Cursor pagination for v2 list endpoints.
 *
 * List responses carry their items in the JSON body and the opaque cursors in
 * the `X-Next-Page-Token`, `X-Previous-Page-Token`, and `X-Last-Page-Token`
 * response headers.
 *
 * Two styles are supported:
 *
 * - **Automatic** — {@link Paged} is an async iterable over items, so `for await`
 *   and the collection helpers (`toArray`, `take`, `map`, `filter`, `forEach`)
 *   walk every page for you.
 * - **Manual** — walk pages with {@link Page.nextPage} or
 *   {@link Paged.pages}, or fetch an arbitrary cursor with {@link Paged.page}.
 */

/**
 * One page of a v2 cursor-paginated collection.
 *
 * Pages returned by the SDK can fetch their neighbours, so a manual walk is a
 * one-liner:
 *
 * ```ts
 * let page = paged.firstPage;
 * while (page.nextPageToken !== undefined) {
 *   page = await page.nextPage();
 * }
 * ```
 *
 * Cursors are opaque; never parse, construct, or persist them as a durable
 * resource identifier.
 *
 * @typeParam T - The item type.
 *
 * @public
 */
export class Page<T> {
  /** Items on this page. */
  readonly items: readonly T[];

  /** Opaque token for the next page, when one exists. */
  readonly nextPageToken: string | undefined;

  /** Opaque token for the previous page, when one exists. */
  readonly previousPageToken: string | undefined;

  /** Opaque token for the last page, when known. */
  readonly lastPageToken: string | undefined;

  readonly #fetcher: PageFetcher<T> | undefined;

  /**
   * @param options - The page items, cursors, and optional neighbouring-page fetcher.
   *
   * @public
   */
  constructor(options: PageOptions<T> = {}) {
    this.items = options.items ?? [];
    this.nextPageToken = normalizeToken(options.nextPageToken);
    this.previousPageToken = normalizeToken(options.previousPageToken);
    this.lastPageToken = normalizeToken(options.lastPageToken);
    this.#fetcher = options.fetcher;
  }

  /**
   * Whether a next page is available.
   *
   * @public
   */
  get hasNext(): boolean {
    return this.nextPageToken !== undefined;
  }

  /**
   * Whether a previous page is available.
   *
   * @public
   */
  get hasPrevious(): boolean {
    return this.previousPageToken !== undefined;
  }

  /**
   * Fetches the next page.
   *
   * @returns The next page.
   * @throws `Error` When there is no next page, or this page cannot fetch pages.
   *
   * @public
   */
  nextPage(): Promise<Page<T>> {
    const cursor = this.nextPageToken;
    if (cursor === undefined) {
      return Promise.reject(new Error("admin: no next page"));
    }
    return this.#fetch(cursor);
  }

  /**
   * Fetches the previous page.
   *
   * @returns The previous page.
   * @throws `Error` When there is no previous page, or this page cannot fetch pages.
   *
   * @public
   */
  previousPage(): Promise<Page<T>> {
    const cursor = this.previousPageToken;
    if (cursor === undefined) {
      return Promise.reject(new Error("admin: no previous page"));
    }
    return this.#fetch(cursor);
  }

  /**
   * Transforms every item on this page, preserving its cursors.
   *
   * The returned page has no fetcher, so `nextPage()` and `previousPage()` on it
   * throw. Use {@link Paged.map} to keep paging through a mapped collection.
   *
   * @typeParam R - The mapped item type.
   * @param mapper - The function applied to each item.
   * @returns A new page with mapped items and the same cursors.
   *
   * @public
   */
  map<R>(mapper: (item: T) => R): Page<R> {
    return new Page<R>({
      items: this.items.map((item) => mapper(item)),
      nextPageToken: this.nextPageToken,
      previousPageToken: this.previousPageToken,
      lastPageToken: this.lastPageToken,
    });
  }

  /**
   * Attaches a neighbouring-page fetcher, enabling `nextPage()` and
   * `previousPage()`.
   *
   * @param fetcher - The fetcher to attach.
   * @returns A new page with the same items and cursors and the fetcher.
   *
   * @internal
   */
  withFetcher(fetcher: PageFetcher<T>): Page<T> {
    return new Page<T>({
      items: this.items,
      nextPageToken: this.nextPageToken,
      previousPageToken: this.previousPageToken,
      lastPageToken: this.lastPageToken,
      fetcher,
    });
  }

  async #fetch(cursor: string): Promise<Page<T>> {
    if (this.#fetcher === undefined) {
      throw new Error("admin: this page cannot fetch other pages");
    }
    return this.#fetcher(cursor);
  }
}

/** Fetches the page identified by an opaque cursor. @public */
export type PageFetcher<T> = (cursor: string) => Promise<Page<T>>;

/** Construction options for a {@link Page}. @public */
export interface PageOptions<T> {
  /** Items on this page. */
  readonly items?: readonly T[];
  /** Opaque token for the next page, when one exists. */
  readonly nextPageToken?: string;
  /** Opaque token for the previous page, when one exists. */
  readonly previousPageToken?: string;
  /** Opaque token for the last page, when known. */
  readonly lastPageToken?: string;
  /** Fetches a neighbouring page by cursor. */
  readonly fetcher?: PageFetcher<T>;
}

/** Normalizes an empty cursor to `undefined`. @internal */
function normalizeToken(token: string | undefined): string | undefined {
  if (token === undefined || token.trim() === "") {
    return undefined;
  }
  return token;
}

/** Construction options for a {@link Paged}. @public */
export interface PagedOptions<T> {
  /** The eagerly fetched first page. */
  readonly firstPage: Page<T>;
  /** Fetches a page by opaque cursor. */
  readonly fetchPage: PageFetcher<T>;
}

/**
 * A cursor-paginated collection.
 *
 * The first page is fetched eagerly when the owning `list()` call is made.
 * Remaining pages are fetched lazily, either automatically as the collection is
 * consumed or manually through {@link Page.nextPage} and {@link Paged.pages}.
 *
 * @typeParam T - The item type.
 *
 * @example Automatic iteration
 * ```ts
 * const paged = await ws.domains().list();
 * for await (const domain of paged) {
 *   console.log(domain.domainName);
 * }
 * const firstTen = await paged.take(10);
 * ```
 *
 * @example Manual page control
 * ```ts
 * const paged = await ws.domains().list();
 * let page = paged.firstPage;
 * while (page.nextPageToken !== undefined) {
 *   page = await page.nextPage();
 * }
 * ```
 *
 * @public
 */
export class Paged<T> implements AsyncIterable<T> {
  /** The eagerly fetched first page, including its items and cursors. */
  readonly firstPage: Page<T>;

  readonly #fetchPage: PageFetcher<T>;

  /**
   * @param options - The first page and the cursor-based page fetcher.
   *
   * @public
   */
  constructor(options: PagedOptions<T>) {
    this.firstPage = options.firstPage;
    this.#fetchPage = options.fetchPage;
  }

  /**
   * Whether the collection is empty, without fetching further pages.
   *
   * @public
   */
  get isEmpty(): boolean {
    return this.firstPage.items.length === 0 && this.firstPage.nextPageToken === undefined;
  }

  /**
   * Fetches the page identified by an opaque cursor.
   *
   * This is the lowest-level navigation primitive; prefer `page.nextPage()` or
   * `page.previousPage()` unless you are persisting or restoring a cursor.
   *
   * @param cursor - The opaque cursor from a page's `nextPageToken`,
   * `previousPageToken`, or `lastPageToken`.
   * @returns The page the cursor points at.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  page(cursor: string): Promise<Page<T>> {
    return this.#fetchPage(cursor);
  }

  /**
   * Fetches the page after `page`, or the page after the first page when `page`
   * is omitted.
   *
   * @param page - The page whose next page to fetch. Defaults to `firstPage`.
   * @returns The next page.
   * @throws `Error` When `page` has no next page.
   *
   * @public
   */
  nextPage(page: Page<T> = this.firstPage): Promise<Page<T>> {
    const cursor = page.nextPageToken;
    if (cursor === undefined) {
      return Promise.reject(new Error("admin: no next page"));
    }
    return this.#fetchPage(cursor);
  }

  /**
   * Fetches the page before `page`.
   *
   * @param page - The page whose previous page to fetch.
   * @returns The previous page.
   * @throws `Error` When `page` has no previous page.
   *
   * @public
   */
  previousPage(page: Page<T>): Promise<Page<T>> {
    const cursor = page.previousPageToken;
    if (cursor === undefined) {
      return Promise.reject(new Error("admin: no previous page"));
    }
    return this.#fetchPage(cursor);
  }

  /**
   * Lazily yields every page in order, starting with {@link Paged.firstPage}.
   *
   * A page token repeated by the control plane is treated as a protocol error
   * and raises an `Error` rather than looping forever.
   *
   * @public
   */
  async *pages(): AsyncGenerator<Page<T>, void, void> {
    const seenTokens = new Set<string>();
    let current = this.firstPage;
    yield current;
    for (;;) {
      const cursor = current.nextPageToken;
      if (cursor === undefined) {
        return;
      }
      if (seenTokens.has(cursor)) {
        throw new Error("admin: control plane returned a repeated page token");
      }
      seenTokens.add(cursor);
      current = await this.#fetchPage(cursor);
      yield current;
    }
  }

  /**
   * Walks every item across all pages.
   *
   * Prefer `take` or manual page navigation when the collection may be large.
   *
   * @public
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, void> {
    for await (const page of this.pages()) {
      for (const item of page.items) {
        yield item;
      }
    }
  }

  /**
   * Eagerly fetches every page and returns all items.
   *
   * @returns Every item across all pages.
   *
   * @public
   */
  async toArray(): Promise<T[]> {
    const items: T[] = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  }

  /**
   * Reads at most `limit` items, fetching only the pages needed to satisfy it.
   *
   * @param limit - The maximum number of items to read.
   * @returns The first `limit` items.
   *
   * @public
   */
  async take(limit: number): Promise<T[]> {
    const items: T[] = [];
    if (limit <= 0) {
      return items;
    }
    for await (const item of this) {
      items.push(item);
      if (items.length >= limit) {
        break;
      }
    }
    return items;
  }

  /**
   * Runs `visitor` for every item across all pages, in order.
   *
   * The visitor may be async; each item is awaited before the next is visited.
   *
   * @param visitor - The function invoked for each item.
   *
   * @public
   */
  async forEach(visitor: (item: T) => void | Promise<void>): Promise<void> {
    for await (const item of this) {
      await visitor(item);
    }
  }

  /**
   * Lazily transforms every item across all pages.
   *
   * Page navigation on the result also works: the mapper is applied to every
   * page it fetches.
   *
   * @typeParam R - The mapped item type.
   * @param mapper - The function applied to each item.
   * @returns A lazily mapped collection.
   *
   * @public
   */
  map<R>(mapper: (item: T) => R): Paged<R> {
    const fetchPage: PageFetcher<R> = async (cursor) => {
      const page = await this.#fetchPage(cursor);
      return page.map((item) => mapper(item)).withFetcher(fetchPage);
    };
    const firstPage = this.firstPage.map((item) => mapper(item)).withFetcher(fetchPage);
    return new Paged<R>({ firstPage, fetchPage });
  }

  /**
   * Lazily filters every item across all pages.
   *
   * @param predicate - The predicate used to keep items.
   * @returns A lazily filtered collection.
   *
   * @public
   */
  filter(predicate: (item: T) => boolean): Paged<T> {
    const fetchPage: PageFetcher<T> = async (cursor) => {
      const page = await this.#fetchPage(cursor);
      return new Page<T>({
        items: page.items.filter((item) => predicate(item)),
        nextPageToken: page.nextPageToken,
        previousPageToken: page.previousPageToken,
        lastPageToken: page.lastPageToken,
        fetcher: fetchPage,
      });
    };
    const firstPage = new Page<T>({
      items: this.firstPage.items.filter((item) => predicate(item)),
      nextPageToken: this.firstPage.nextPageToken,
      previousPageToken: this.firstPage.previousPageToken,
      lastPageToken: this.firstPage.lastPageToken,
      fetcher: fetchPage,
    });
    return new Paged<T>({ firstPage, fetchPage });
  }
}
