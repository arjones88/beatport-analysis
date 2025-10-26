from typing import List, Dict, Optional
import csv
import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import date

#!/usr/bin/env python3
"""
beatport.py

Scrape Beatport Top 100 charts for a list of genres and produce a single CSV:
columns: genre_slug, rank, title, artists

Requirements:
  pip install requests beautifulsoup4

Usage:
  python beatport.py
"""


OUT_CSV = f"beatport_top100_{date.today().isoformat()}.csv"

# Genre pages to scrape
GENRE_URLS = [
  "https://www.beatport.com/genre/140-deep-dubstep-grime/95/top-100",
  "https://www.beatport.com/genre/amapiano/98/top-100",
  "https://www.beatport.com/genre/afro-house/89/top-100",
  "https://www.beatport.com/genre/ambient-experimental/100/top-100",
  "https://www.beatport.com/genre/bass-club/85/top-100",
  "https://www.beatport.com/genre/bass-house/91/top-100",
  "https://www.beatport.com/genre/brazilian-funk/101/top-100",
  "https://www.beatport.com/genre/breaks-breakbeat-uk-bass/9/top-100",
  "https://www.beatport.com/genre/dance-pop/39/top-100",
  "https://www.beatport.com/genre/deep-house/12/top-100",
  "https://www.beatport.com/genre/downtempo/63/top-100",
  "https://www.beatport.com/genre/drum-bass/1/top-100",
  "https://www.beatport.com/genre/dubstep/18/top-100",
  "https://www.beatport.com/genre/electro-classic-detroit-modern/94/top-100",
  "https://www.beatport.com/genre/electronica/3/top-100",
  "https://www.beatport.com/genre/funky-house/81/top-100",
  "https://www.beatport.com/genre/hard-dance-hardcore-neo-rave/8/top-100",
  "https://www.beatport.com/genre/hard-techno/2/top-100",
  "https://www.beatport.com/genre/house/5/top-100",
  "https://www.beatport.com/genre/indie-dance/37/top-100",
  "https://www.beatport.com/genre/jackin-house/97/top-100",
  "https://www.beatport.com/genre/mainstage/96/top-100",
  "https://www.beatport.com/genre/melodic-house-techno/90/top-100",
  "https://www.beatport.com/genre/minimal-deep-tech/14/top-100",
  "https://www.beatport.com/genre/nu-disco-disco/50/top-100",
  "https://www.beatport.com/genre/organic-house/93/top-100",
  "https://www.beatport.com/genre/progressive-house/15/top-100",
  "https://www.beatport.com/genre/psy-trance/13/top-100",
  "https://www.beatport.com/genre/tech-house/11/top-100",
  "https://www.beatport.com/genre/techno-peak-time-driving/6/top-100",
  "https://www.beatport.com/genre/techno-raw-deep-hypnotic/92/top-100",
  "https://www.beatport.com/genre/trance-main-floor/7/top-100",
  "https://www.beatport.com/genre/trance-raw-deep-hypnotic/99/top-100",
  "https://www.beatport.com/genre/trap-future-bass/38/top-100",
  "https://www.beatport.com/genre/uk-garage-bassline/86/top-100",
]


HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; +https://github.com/)",
  "Accept-Language": "en-US,en;q=0.9",
}


def fetch_url(session: requests.Session, url: str, max_retries: int = 3, backoff: float = 1.0) -> Optional[str]:
  for attempt in range(1, max_retries + 1):
    try:
      resp = session.get(url, timeout=15)
      if resp.status_code == 200:
        return resp.text
      else:
        print(f"Warning: {url} returned status {resp.status_code} (attempt {attempt})")
    except requests.RequestException as e:
      print(f"Warning: request failed for {url} (attempt {attempt}): {e}")
    time.sleep(backoff * attempt)
  print(f"Error: failed to fetch {url} after {max_retries} attempts")
  return None


def parse_chart(html: str) -> List[Dict[str, str]]:
  """
  Try several heuristics to extract tracks from a Beatport Top 100 page.
  Returns list of dicts with keys: title, artists
  """
  soup = BeautifulSoup(html, "html.parser")

  results = []

  # First: new/current markup observed on Beatport pages
  rows = soup.select('div[data-testid="tracks-table-row"]')
  if rows:
    for idx, row in enumerate(rows, start=1):
      # Title: an <a> with a title attr (and often href containing "/track")
      title_elem = row.select_one('a[title][href*="/track"]') or row.select_one('a[title]')
      title = ""
      if title_elem:
        title = title_elem.get("title") or title_elem.get_text(" ", strip=True)

      # Artists: div whose class contains "ArtistNames" (robust to hashed class names)
      artists_elem = row.select_one('div[class*="ArtistNames"]') or row.select_one('.ArtistNames')
      artists = ""
      if artists_elem:
        links = artists_elem.select("a")
        if links:
          artists = " & ".join(a.get_text(" ", strip=True) for a in links)
        else:
          artists = artists_elem.get_text(" ", strip=True)

      if not title and not artists:
        continue

      results.append({"rank": str(idx), "title": title, "artists": artists})
      if len(results) >= 100:
        break

    return results

  # Fallback: Try a few selectors that commonly match Beatport track entries
  candidate_selectors = [
    "li.bucket-item",           # common container
    "li.buk-track",             # alternative class
    "li.track",                 # generic
    "div.bucket-track",         # alternative markup
    "div.track",                # generic div
  ]

  items = []
  for sel in candidate_selectors:
    found = soup.select(sel)
    if found and len(found) >= 1:
      items = found
      break

  # If nothing found, fallback: try to find chart rows by a known class fragment
  if not items:
    items = soup.select("[class*=bucket]")[:200]  # attempt a broad match

  for idx, item in enumerate(items, start=1):
    # extract title
    title_elem = None
    for tsel in [
      ".buk-track-primary-title",
      ".buk-track-title",
      ".track-title",
      "h3",
      "a.track-title",
      "a.buk-track-title",
      "a.bp-focusable",
    ]:
      title_elem = item.select_one(tsel)
      if title_elem and title_elem.get_text(strip=True):
        break

    # extract artists (may include multiple)
    artists_elem = None
    for asel in [
      ".buk-track-artists",
      ".track-artists",
      "p.buk-track-artists",
      ".artists",
      ".buk-track-artists a",
      "span.track-artists",
    ]:
      artists_elem = item.select_one(asel)
      if artists_elem and artists_elem.get_text(strip=True):
        break

    title = title_elem.get_text(" ", strip=True) if title_elem else ""
    artists = ""
    if artists_elem:
      # get all anchor texts (artist links) if any, otherwise full text
      artist_links = artists_elem.select("a")
      if artist_links:
        artists = " & ".join(a.get_text(" ", strip=True) for a in artist_links)
      else:
        artists = artists_elem.get_text(" ", strip=True)

    # Some pages present data differently; skip empty rows
    if not title and not artists:
      continue

    results.append({"rank": str(idx), "title": title, "artists": artists})

    # stop after 100 entries
    if len(results) >= 100:
      break

  return results


def genre_slug_from_url(url: str) -> str:
  # extract the 'genre/SLUG' part
  parts = url.split("/")
  try:
    idx = parts.index("genre")
    return parts[idx + 1]
  except ValueError:
    # fallback: use entire URL as slug
    return url


def scrape_all(genres: List[str]) -> List[Dict[str, str]]:
  session = requests.Session()
  session.headers.update(HEADERS)
  all_rows = []

  for url in genres:
    slug = genre_slug_from_url(url)
    print(f"Fetching {slug} ...")
    html = fetch_url(session, url)
    if not html:
      print(f"Skipping {slug} due to fetch failure.")
      continue

    tracks = parse_chart(html)
    if not tracks:
      print(f"Warning: no tracks parsed for {slug}. You may need to inspect page markup.")
    for t in tracks:
      row = {"genre": slug, "rank": t["rank"], "title": t["title"], "artists": t["artists"]}
      all_rows.append(row)

    # polite random delay to reduce load
    time.sleep(1.0 + random.random() * 1.5)

  return all_rows


def write_csv(rows: List[Dict[str, str]], out_path: str) -> None:
  fieldnames = ["genre", "title", "artists", "rank"]
  with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
      writer.writerow(r)
  print(f"Wrote {len(rows)} rows to {out_path}")


def main():
  rows = scrape_all(GENRE_URLS)
  write_csv(rows, OUT_CSV)


if __name__ == "__main__":
  main()