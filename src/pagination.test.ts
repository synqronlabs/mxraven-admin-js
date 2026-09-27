import { describe, expect, it } from "vitest";

import { Page, Paged, type PageFetcher } from "./pagination.js";

function page<T>(
  items: T[],
  cursors: { next?: string; previous?: string; last?: string } = {},
): Page<T> {
  return new Page<T>({
    items,
    nextPageToken: cursors.next,
    previousPageToken: cursors.previous,
    lastPageToken: cursors.last,
  });
}

const repeated: PageFetcher<number> = async () => page([2], { next: "n1" });
const noMore: PageFetcher<number> = async () => page<number>([]);
const single: PageFetcher<number> = async () => page([2]);

describe("Paged", () => {
  it("iterates across pages lazily", async () => {
    const calls: string[] = [];
    const fetchPage: PageFetcher<number> = async (cursor) => {
      calls.push(cursor);
      if (cursor === "n1") {
        return page([2], { next: "n2" });
      }
      return page([3]);
    };
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage });

    expect(calls).toEqual([]);
    await expect(paged.toArray()).resolves.toEqual([1, 2, 3]);
    expect(calls).toEqual(["n1", "n2"]);
  });

  it("walks pages manually through firstPage/nextPage", async () => {
    const calls: string[] = [];
    const fetchPage: PageFetcher<number> = async (cursor) => {
      calls.push(cursor);
      if (cursor === "n1") {
        return page([2], { next: "n2", previous: undefined });
      }
      return page([3], { previous: "n1" });
    };
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage });

    const first = paged.firstPage;
    const second = await paged.nextPage(first);
    const third = await paged.nextPage(second);
    expect(first.items).toEqual([1]);
    expect(second.items).toEqual([2]);
    expect(third.items).toEqual([3]);
    await expect(paged.nextPage(third)).rejects.toThrow("no next page");

    const back = await paged.previousPage(third);
    expect(back.items).toEqual([2]);
    expect(calls).toEqual(["n1", "n2", "n1"]);
  });

  it("fetches a page by cursor", async () => {
    const fetchPage: PageFetcher<number> = async (cursor) => page([cursor.length]);
    const paged = new Paged<number>({ firstPage: page([1]), fetchPage });
    expect((await paged.page("abcdef")).items).toEqual([6]);
  });

  it("navigates directly from a page", async () => {
    const fetchPage: PageFetcher<number> = async (cursor) =>
      page([cursor.length]).withFetcher(fetchPage);
    const first = page<number>([], { next: "ab" }).withFetcher(fetchPage);
    const second = await first.nextPage();
    expect(second.items).toEqual([2]);
  });

  it("yields every page with pages()", async () => {
    const fetchPage: PageFetcher<number> = async (cursor) =>
      cursor === "n1" ? page([2], { next: "n2" }) : page([3]);
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage });

    const collected: number[][] = [];
    for await (const current of paged.pages()) {
      collected.push([...current.items]);
    }
    expect(collected).toEqual([[1], [2], [3]]);
  });

  it("throws on a repeated page token", async () => {
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage: repeated });
    await expect(paged.toArray()).rejects.toThrow("repeated page token");
  });

  it("is empty only when the first page is empty with no next page", () => {
    expect(new Paged<number>({ firstPage: page<number>([]), fetchPage: noMore }).isEmpty).toBe(
      true,
    );
    expect(new Paged<number>({ firstPage: page([1]), fetchPage: noMore }).isEmpty).toBe(false);
    expect(
      new Paged<number>({ firstPage: page<number>([], { next: "x" }), fetchPage: noMore }).isEmpty,
    ).toBe(false);
  });

  it("maps across pages and keeps page navigation", async () => {
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage: single });
    const mapped = paged.map((value) => value * 10);
    await expect(mapped.toArray()).resolves.toEqual([10, 20]);
    expect((await mapped.nextPage(mapped.firstPage)).items).toEqual([20]);
  });

  it("filters across pages", async () => {
    const fetchPage: PageFetcher<number> = async () => page([4, 5]);
    const paged = new Paged<number>({ firstPage: page([1, 2, 3], { next: "n1" }), fetchPage });
    await expect(paged.filter((value) => value % 2 === 0).toArray()).resolves.toEqual([2, 4]);
  });

  it("takes without fetching more pages than needed", async () => {
    const calls: string[] = [];
    const fetchPage: PageFetcher<number> = async (cursor) => {
      calls.push(cursor);
      if (cursor === "n1") {
        return page([2], { next: "n2" });
      }
      return page([3]);
    };
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage });

    await expect(paged.take(2)).resolves.toEqual([1, 2]);
    expect(calls).toEqual(["n1"]);
    await expect(paged.take(0)).resolves.toEqual([]);
  });

  it("visits every item with forEach", async () => {
    const seen: number[] = [];
    const paged = new Paged<number>({ firstPage: page([1], { next: "n1" }), fetchPage: single });
    await paged.forEach((value) => {
      seen.push(value);
    });
    expect(seen).toEqual([1, 2]);
  });
});
