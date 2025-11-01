from typing import List, Dict, Optional
import time
import random
import os
from dotenv import load_dotenv
load_dotenv()
import requests
from bs4 import BeautifulSoup
from datetime import date, datetime
import psycopg2
from psycopg2.extras import execute_batch

#!/usr/bin/env python3
"""
beatport.py

Scrape Beatport Top 100 charts for a list of genres and write results to PostgreSQL.

Requirements:
  pip install requests beautifulsoup4 psycopg2-binary

Environment (defaults provided):
  PGHOST (default 192.168.1.152)
  PGPORT (default 5432)
  PGDATABASE (default beatport)
  PGUSER (default postgres)
  PGPASSWORD (default empty)

Usage:
   python beatport.py
"""

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
  Returns list of dicts with keys: title, artists, rank
  """
  soup = BeautifulSoup(html, "html.parser")

  results = []

  # First: new/current markup observed on Beatport pages
  rows = soup.select('div[data-testid="tracks-table-row"]')
  if rows:
    for idx, row in enumerate(rows, start=1):
      title_elem = row.select_one('a[title][href*="/track"]') or row.select_one('a[title]')
      title = ""
      if title_elem:
        title = title_elem.get("title") or title_elem.get_text(" ", strip=True)

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

      results.append({"rank": idx, "title": title, "artists": artists})
      if len(results) >= 100:
        break

    return results

  candidate_selectors = [
    "li.bucket-item",
    "li.buk-track",
    "li.track",
    "div.bucket-track",
    "div.track",
  ]

  items = []
  for sel in candidate_selectors:
    found = soup.select(sel)
    if found and len(found) >= 1:
      items = found
      break

  if not items:
    items = soup.select("[class*=bucket]")[:200]

  for idx, item in enumerate(items, start=1):
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
      artist_links = artists_elem.select("a")
      if artist_links:
        artists = " & ".join(a.get_text(" ", strip=True) for a in artist_links)
      else:
        artists = artists_elem.get_text(" ", strip=True)

    if not title and not artists:
      continue

    results.append({"rank": idx, "title": title, "artists": artists})

    if len(results) >= 100:
      break

  return results


def genre_slug_from_url(url: str) -> str:
  parts = url.split("/")
  try:
    idx = parts.index("genre")
    return parts[idx + 1]
  except ValueError:
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

    time.sleep(1.0 + random.random() * 1.5)

  return all_rows


def _pg_conn():
  host = os.getenv("PGHOST", "192.168.1.152")
  port = int(os.getenv("PGPORT", "5432"))
  db = os.getenv("PGDATABASE", "beatport")
  user = os.getenv("PGUSER", "postgres")
  pw = os.getenv("PGPASSWORD", "")
  conn = psycopg2.connect(host=host, port=port, dbname=db, user=user, password=pw)
  return conn


def create_table_if_not_exists(conn):
  sql = """
  CREATE TABLE IF NOT EXISTS beatport_top100 (
    artist VARCHAR(255),
    title VARCHAR(255),
    rank INTEGER,
    date DATE,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    genre VARCHAR(255)
  );
  """
  with conn.cursor() as cur:
    cur.execute(sql)
  conn.commit()


def _truncate(val: Optional[str], length: int = 255) -> Optional[str]:
  if val is None:
    return None
  s = val.strip()
  if len(s) <= length:
    return s
  return s[:length]


def write_db(rows: List[Dict[str, str]]) -> None:
  if not rows:
    print("No rows to write to DB.")
    return

  # Prepare tuples for insert
  today = date.today()
  now = datetime.now()
  records = []
  for r in rows:
    artist = _truncate(r.get("artists", ""))  # store artists into artist column per schema
    title = _truncate(r.get("title", ""))
    rank = int(r.get("rank") or 0)
    genre = _truncate(r.get("genre", ""))
    records.append((artist, title, rank, today, now, genre))

  conn = _pg_conn()
  try:
    create_table_if_not_exists(conn)
    with conn.cursor() as cur:
      execute_batch(
        cur,
        "INSERT INTO beatport_top100 (artist, title, rank, date, scraped_at, genre) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (artist, title, date, genre) DO UPDATE SET rank = EXCLUDED.rank, scraped_at = EXCLUDED.scraped_at",
        records,
        page_size=100,
      )
    conn.commit()
    print(f"Wrote {len(records)} rows to beatport_top100 on {os.getenv('PGHOST','192.168.1.152')}")
  except Exception as e:
    conn.rollback()
    print(f"Error writing to DB: {e}")
  finally:
    conn.close()



def main():
  rows = scrape_all(GENRE_URLS)
  # write to PostgreSQL
  write_db(rows)


if __name__ == "__main__":
  main()