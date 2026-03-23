import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressImage } from "./imageCompressor";

// Mock URL APIs (not available in jsdom)
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLImageElement to trigger onload immediately
class MockImage {
  onload: (() => void) | null = null;
  onerror: ((e: Error) => void) | null = null;
  width = 800;
  height = 600;
  private _src = "";

  set src(_value: string) {
    this._src = _value;
    setTimeout(() => this.onload?.(), 0);
  }
  get src() {
    return this._src;
  }
}
vi.stubGlobal("Image", MockImage);

// Mock canvas with toBlob that calls back with a Blob
const mockDrawImage = vi.fn();
const mockToBlob = vi.fn((callback: BlobCallback) => {
  callback(new Blob(["mock-image-data"], { type: "image/jpeg" }));
});

beforeEach(() => {
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: mockDrawImage }),
        toBlob: mockToBlob,
      };
      return canvas as unknown as HTMLElement;
    }
    return document.createElement(tag);
  });
});

describe("compressImage", () => {
  it("returns a File when given a File", async () => {
    const input = new File(["fake-image"], "photo.png", { type: "image/png" });

    const result = await compressImage(input);

    expect(result).toBeInstanceOf(File);
  });

  it("outputs a jpeg file regardless of input format", async () => {
    const input = new File(["fake-image"], "photo.png", { type: "image/png" });

    const result = await compressImage(input);

    expect(result.type).toBe("image/jpeg");
  });
});
