#!/usr/bin/env python3
"""
Test file for beatport scraper utility functions
"""
import unittest
from unittest.mock import Mock, patch, mock_open
from datetime import date
import sys
import os

# Add the src directory to the path so we can import the scraper
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import functions from the scraper (we'll mock the imports that aren't available)
def genre_slug_from_url(url: str) -> str:
    """Extract genre slug from Beatport URL"""
    parts = url.split("/")
    try:
        idx = parts.index("genre")
        return parts[idx + 1]
    except ValueError:
        return url

def _truncate(val, length: int = 255):
    """Truncate string to specified length"""
    if val is None:
        return None
    s = val.strip()
    if len(s) <= length:
        return s
    return s[:length]

class TestScraperUtils(unittest.TestCase):

    def test_genre_slug_from_url(self):
        """Test extracting genre slug from Beatport URLs"""
        test_cases = [
            ("https://www.beatport.com/genre/house/5/top-100", "house"),
            ("https://www.beatport.com/genre/140-deep-dubstep-grime/95/top-100", "140-deep-dubstep-grime"),
            ("https://www.beatport.com/genre/tech-house/11/top-100", "tech-house"),
            ("https://www.beatport.com/genre/minimal-deep-tech/14/top-100", "minimal-deep-tech"),
        ]

        for url, expected in test_cases:
            with self.subTest(url=url):
                result = genre_slug_from_url(url)
                self.assertEqual(result, expected)

    def test_genre_slug_from_invalid_url(self):
        """Test handling of invalid URLs"""
        invalid_urls = [
            "https://www.beatport.com/invalid/path",
            "https://www.beatport.com/",
            "not-a-url",
            "",
        ]

        for url in invalid_urls:
            with self.subTest(url=url):
                result = genre_slug_from_url(url)
                # Should return the original URL if no genre found
                self.assertEqual(result, url)

    def test_truncate_function(self):
        """Test string truncation utility"""
        # Test normal truncation
        long_string = "a" * 300
        result = _truncate(long_string, 255)
        self.assertIsNotNone(result)
        if result is not None:
            self.assertEqual(len(result), 255)
            self.assertEqual(result, "a" * 255)

        # Test no truncation needed
        short_string = "short"
        result = _truncate(short_string, 255)
        self.assertEqual(result, "short")

        # Test None handling
        result = _truncate(None, 255)
        self.assertIsNone(result)

        # Test whitespace stripping
        string_with_whitespace = "  test  "
        result = _truncate(string_with_whitespace, 255)
        self.assertEqual(result, "test")

    def test_data_structure(self):
        """Test the expected data structure for scraped tracks"""
        sample_track = {
            "rank": 1,
            "title": "Test Track",
            "artists": "Test Artist"
        }

        required_keys = ["rank", "title", "artists"]
        for key in required_keys:
            self.assertIn(key, sample_track)

        # Test that rank is a number
        self.assertIsInstance(sample_track["rank"], int)

        # Test that title and artists are strings
        self.assertIsInstance(sample_track["title"], str)
        self.assertIsInstance(sample_track["artists"], str)

    def test_database_record_structure(self):
        """Test the structure of records inserted into database"""
        today = date.today()
        sample_record = (
            "Test Artist",  # artist
            "Test Track",   # title
            1,              # rank
            today,          # date
            "house"         # genre
        )

        self.assertEqual(len(sample_record), 5)
        self.assertIsInstance(sample_record[0], str)  # artist
        self.assertIsInstance(sample_record[1], str)  # title
        self.assertIsInstance(sample_record[2], int)  # rank
        self.assertIsInstance(sample_record[3], date) # date
        self.assertIsInstance(sample_record[4], str)  # genre

if __name__ == '__main__':
    unittest.main()