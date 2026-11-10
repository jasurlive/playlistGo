# scripts

Small desktop tool for managing the song library.

Everything reads and writes **`public/data/songs.csv`**, which the site fetches at `/data/songs.csv` in production. Commit the CSV after saving to publish your changes.

## Setup

```bash
python -m venv scripts/.venv
source scripts/.venv/bin/activate
pip install -r scripts/requirements.txt
```

Add a YouTube Data API v3 key to the root `.env` (needed for search and Check embeds):

```env
APP_PY_YT_KEY=your_key   # or YOUTUBE_API_KEY
```

## Usage

```bash
python scripts/app.py
```

| Action  | How                                                       |
| ------- | --------------------------------------------------------- |
| Add     | Search → select results → **Add selected to top** (or double-click) |
| Reorder | Drag, or **Top / Up / Down**                              |
| Edit    | Double-click a song, or **Edit**                          |
| Delete  | `Delete` key, or **Delete**                               |
| Check embeds | **Check embeds**: finds deleted, private, age-restricted, and non-embeddable videos, then **Remove all** or keep them marked red to review |
| Save    | `Ctrl+S`, or **Save**, then confirm in the popup           |
| Reload  | **Reload** (discard unsaved changes)                      |

Multi-select works with `Ctrl`/`Shift`-click. Unsaved changes are marked with `*` in the window title.

## Files

| File               | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `app.py`           | Everything: CSV read/write, YouTube search, embed check, GUI (PyQt6) |
| `requirements.txt` | Python dependencies                                |

## CSV format

```csv
title,url
Imagine Dragons - Demons,https://www.youtube.com/watch?v=MA0aCUxItYA
"Hello, World",https://www.youtube.com/watch?v=...
```

- Titles with commas or quotes are quoted automatically. Don't strip commas by hand.
- YouTube's coded characters (`&#39;`, `&amp;`) and extra whitespace are cleaned on save.
- `Artist - Title` is shown on two lines in the app.

After editing the CSV by hand, open the app and save to re-format it.
