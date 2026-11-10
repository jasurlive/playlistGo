"""Minimal song manager for public/data/songs.csv (served at /data/songs.csv).

Search youtube + add, drag to reorder, double-click to edit, Delete to remove,
Check embeds to find dead/unembeddable videos, Ctrl+S to save.

    python scripts/app.py
"""

import csv
import html
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PyQt6.QtCore import Qt
from PyQt6.QtGui import QBrush, QColor, QKeySequence, QShortcut
from PyQt6.QtWidgets import (
    QAbstractItemView,
    QApplication,
    QHBoxLayout,
    QInputDialog,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMessageBox,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

# ---------- data: csv + youtube ----------

ROOT = Path(__file__).resolve().parent.parent
CSV_FILE = ROOT / "public" / "data" / "songs.csv"
HEADER = ["title", "url"]


def clean(text):
    """youtube titles come html-escaped (&#39; &amp;) and may hold newlines"""
    return " ".join(html.unescape(str(text or "")).split())


def read_songs():
    if not CSV_FILE.exists():
        return []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        return [
            (clean(row.get("title")), clean(row.get("url")))
            for row in csv.DictReader(f)
            if row.get("url")
        ]


def write_songs(songs):
    """csv module quotes titles that contain commas or quotes: "Hello, World",url"""
    CSV_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(HEADER)
        writer.writerows((clean(t) or "Untitled", clean(u)) for t, u in songs)


def api_key():
    env = ROOT / ".env"
    values = {}
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            key, sep, value = line.partition("=")
            if sep:
                values[key.strip()] = value.strip().strip("\"'")
    for name in ("APP_PY_YT_KEY", "YOUTUBE_API_KEY"):
        key = os.getenv(name) or values.get(name)
        if key:
            return key
    raise RuntimeError("set APP_PY_YT_KEY or YOUTUBE_API_KEY in .env")


def search_youtube(query, limit=15):
    params = {"part": "snippet", "q": query, "type": "video", "maxResults": limit, "key": api_key()}
    url = "https://www.googleapis.com/youtube/v3/search?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=10) as res:
        data = json.loads(res.read())
    return [
        (clean(item["snippet"]["title"]), "https://www.youtube.com/watch?v=" + item["id"]["videoId"])
        for item in data.get("items", [])
        if item.get("id", {}).get("videoId")
    ]


def video_id(url):
    """same rules as getVideoId in src/tools/lib/youtube.ts"""
    u = urllib.parse.urlparse(url.strip())
    if "youtu.be" in u.netloc:
        return u.path.lstrip("/").split("/")[0] or None
    parts = u.path.strip("/").split("/")
    if len(parts) >= 2 and parts[0] in ("embed", "shorts", "live"):
        return parts[1]
    return urllib.parse.parse_qs(u.query).get("v", [None])[0]


def unplayable(urls):
    """{url: reason} for videos that can't play in the site's iframe player.
    1 quota unit per 50 videos."""
    ids = {}
    bad = {}
    for url in urls:
        vid = video_id(url)
        if vid:
            ids.setdefault(vid, []).append(url)
        else:
            bad[url] = "bad link"

    vids = list(ids)
    for i in range(0, len(vids), 50):
        chunk = vids[i : i + 50]
        params = {"part": "status,contentDetails", "id": ",".join(chunk), "key": api_key()}
        url = "https://www.googleapis.com/youtube/v3/videos?" + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url, timeout=15) as res:
            found = {item["id"]: item for item in json.loads(res.read()).get("items", [])}

        for vid in chunk:
            item = found.get(vid)
            status = item and item.get("status", {})
            rating = item and item.get("contentDetails", {}).get("contentRating", {})
            if item is None:
                reason = "deleted or private"
            elif status.get("privacyStatus") == "private":
                reason = "private"
            elif not status.get("embeddable", True):
                reason = "embedding disabled"
            elif rating.get("ytRating") == "ytAgeRestricted":
                reason = "age restricted"  # won't play in an iframe either
            elif status.get("uploadStatus") not in (None, "processed"):
                reason = status["uploadStatus"]  # rejected / failed / deleted
            else:
                continue
            for u in ids[vid]:
                bad[u] = reason
    return bad

# ---------- gui ----------

URL = Qt.ItemDataRole.UserRole


def make_item(title, url):
    item = QListWidgetItem(title)
    item.setData(URL, url)
    item.setToolTip(url)
    return item


class App(QWidget):
    def __init__(self):
        super().__init__()
        self.resize(720, 760)
        self.dirty = False

        # search
        self.query = QLineEdit(placeholderText="search youtube…")
        self.query.returnPressed.connect(self.search)
        search_btn = QPushButton("Search", clicked=self.search)
        self.results = QListWidget()
        self.results.setSelectionMode(QAbstractItemView.SelectionMode.ExtendedSelection)
        self.results.setMaximumHeight(200)
        self.results.itemDoubleClicked.connect(lambda _: self.add())
        add_btn = QPushButton("Add selected to top", clicked=self.add)

        # library
        self.songs = QListWidget()
        self.songs.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        self.songs.setSelectionMode(QAbstractItemView.SelectionMode.ExtendedSelection)
        self.songs.itemDoubleClicked.connect(self.edit)
        self.songs.model().rowsMoved.connect(lambda *_: self.touch())
        self.status = QLabel()

        row = QHBoxLayout()
        row.addWidget(self.query)
        row.addWidget(search_btn)

        buttons = QHBoxLayout()
        for text, fn in [
            ("Top", self.to_top),
            ("Up", lambda: self.shift(-1)),
            ("Down", lambda: self.shift(1)),
            ("Edit", lambda: self.edit(self.songs.currentItem())),
            ("Delete", self.delete),
            ("Check embeds", self.check_embeds),
            ("Reload", self.load),
            ("Save", self.save),
        ]:
            buttons.addWidget(QPushButton(text, clicked=fn))

        layout = QVBoxLayout(self)
        layout.addLayout(row)
        layout.addWidget(self.results)
        layout.addWidget(add_btn)
        layout.addWidget(self.songs, 1)
        layout.addLayout(buttons)
        layout.addWidget(self.status)

        QShortcut(QKeySequence.StandardKey.Save, self, self.save)
        QShortcut(QKeySequence.StandardKey.Delete, self.songs, self.delete)

        self.load()

    # state
    def touch(self, msg="unsaved changes"):
        self.dirty = True
        self.refresh(msg)

    def refresh(self, msg=""):
        mark = "* " if self.dirty else ""
        self.setWindowTitle(f"{mark}Songs ({self.songs.count()}) — {CSV_FILE.name}")
        self.status.setText(msg)

    def load(self):
        if self.dirty and not self.confirm("Discard unsaved changes?"):
            return
        self.songs.clear()
        for title, url in read_songs():
            self.songs.addItem(make_item(title, url))
        self.dirty = False
        self.refresh(f"loaded {CSV_FILE}")

    def save(self):
        items = [self.songs.item(i) for i in range(self.songs.count())]
        note = "" if self.dirty else "\n(no changes)"
        if not self.confirm(f"Update {CSV_FILE.name} with {len(items)} songs?{note}", "Save"):
            return
        write_songs((i.text(), i.data(URL)) for i in items)
        self.dirty = False
        self.refresh(f"saved {len(items)} songs")

    # actions
    def search(self):
        query = self.query.text().strip()
        if not query:
            return
        self.status.setText("searching…")
        QApplication.processEvents()
        try:
            found = search_youtube(query)
        except Exception as err:
            self.status.setText(f"search failed: {err}")
            return
        self.results.clear()
        for title, url in found:
            self.results.addItem(make_item(title, url))
        self.status.setText(f"{len(found)} results")

    def add(self):
        have = {self.songs.item(i).data(URL) for i in range(self.songs.count())}
        picked = [i for i in self.results.selectedItems() if i.data(URL) not in have]
        for item in reversed(picked):
            self.songs.insertItem(0, make_item(item.text(), item.data(URL)))
        if picked:
            self.touch(f"added {len(picked)}")
        else:
            self.status.setText("nothing new to add")

    def edit(self, item):
        if not item:
            return
        title, ok = QInputDialog.getText(self, "Edit title", "Title:", text=item.text())
        if not ok:
            return
        url, ok = QInputDialog.getText(self, "Edit link", "YouTube link:", text=item.data(URL))
        if ok and clean(title) and clean(url):
            item.setText(clean(title))
            item.setData(URL, clean(url))
            item.setToolTip(clean(url))
            self.touch("edited")

    def delete(self):
        picked = self.songs.selectedItems()
        if picked and self.confirm(f"Delete {len(picked)} song(s)?"):
            for item in picked:
                self.songs.takeItem(self.songs.row(item))
            self.touch(f"deleted {len(picked)}")

    def check_embeds(self):
        items = [self.songs.item(i) for i in range(self.songs.count())]
        for item in items:  # clear marks from a previous check
            item.setBackground(QBrush())
            item.setToolTip(item.data(URL))
        self.status.setText(f"checking {len(items)} songs…")
        QApplication.processEvents()
        try:
            bad = unplayable(i.data(URL) for i in items)
        except Exception as err:
            self.status.setText(f"check failed: {err}")
            return

        broken = [i for i in items if i.data(URL) in bad]
        self.songs.clearSelection()
        for item in broken:
            reason = bad[item.data(URL)]
            item.setBackground(QColor(220, 60, 60, 90))
            item.setToolTip(f"{reason} — {item.data(URL)}")
            item.setSelected(True)
        if not broken:
            self.status.setText("all songs can be embedded ✓")
            return
        self.songs.scrollToItem(broken[0])

        box = QMessageBox(self)
        box.setWindowTitle("Check embeds")
        box.setText(f"{len(broken)} song(s) can't play on the site.")
        box.setDetailedText("\n".join(f"[{bad[i.data(URL)]}] {i.text()}" for i in broken))
        remove = box.addButton("Remove all", QMessageBox.ButtonRole.DestructiveRole)
        box.addButton("Keep (review)", QMessageBox.ButtonRole.RejectRole)
        box.exec()

        if box.clickedButton() is remove:
            for item in broken:
                self.songs.takeItem(self.songs.row(item))
            self.touch(f"removed {len(broken)} unplayable songs — Ctrl+S to save")
        else:
            self.status.setText(f"{len(broken)} marked red and selected — Delete removes them")

    def selected_rows(self):
        return sorted(self.songs.row(i) for i in self.songs.selectedItems())

    def to_top(self):
        rows = self.selected_rows()
        items = [self.songs.takeItem(r) for r in reversed(rows)][::-1]
        for n, item in enumerate(items):
            self.songs.insertItem(n, item)
            item.setSelected(True)
        if items:
            self.songs.scrollToTop()
            self.touch()

    def shift(self, step):
        rows = self.selected_rows()
        if not rows or rows[0] + step < 0 or rows[-1] + step >= self.songs.count():
            return
        for r in rows if step < 0 else reversed(rows):
            item = self.songs.takeItem(r)
            self.songs.insertItem(r + step, item)
            item.setSelected(True)
        self.touch()

    def confirm(self, text, title="Songs"):
        yes = QMessageBox.StandardButton.Yes
        return QMessageBox.question(self, title, text) == yes

    def closeEvent(self, event):
        if self.dirty and not self.confirm("Quit without saving?"):
            event.ignore()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = App()
    window.show()
    sys.exit(app.exec())
