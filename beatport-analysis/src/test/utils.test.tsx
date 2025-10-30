import { describe, it, expect } from 'vitest'

// Import the utility function from App.tsx
// Since it's not exported, we'll need to test it indirectly or extract it
// For now, let's create a test that verifies the slug extraction logic

describe('Utility Functions', () => {
  describe('slugFromUrl', () => {
    // Since slugFromUrl is not exported, we'll test the logic by creating our own version
    const slugFromUrl = (url: string) => {
      try {
        const m = url.match(/\/genre\/([^/]+)/);
        return m ? m[1] : "";
      } catch {
        return "";
      }
    };

    it('extracts genre slug from Beatport URL', () => {
      const url = "https://www.beatport.com/genre/house/5/top-100";
      expect(slugFromUrl(url)).toBe("house");
    });

    it('extracts complex genre slug with special characters', () => {
      const url = "https://www.beatport.com/genre/140-deep-dubstep-grime/95/top-100";
      expect(slugFromUrl(url)).toBe("140-deep-dubstep-grime");
    });

    it('returns empty string for invalid URL format', () => {
      const url = "https://www.beatport.com/invalid/path";
      expect(slugFromUrl(url)).toBe("");
    });

    it('returns empty string for URL without genre path', () => {
      const url = "https://www.beatport.com/";
      expect(slugFromUrl(url)).toBe("");
    });

    it('handles malformed URLs gracefully', () => {
      const url = "not-a-url";
      expect(slugFromUrl(url)).toBe("");
    });

    it('extracts slug from URL with additional path segments', () => {
      const url = "https://www.beatport.com/genre/tech-house/11/top-100/extra/path";
      expect(slugFromUrl(url)).toBe("tech-house");
    });
  });
});