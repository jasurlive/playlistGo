import tkinter as tk

import json
import html
import urllib.request
import urllib.parse

from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("APP_YT_KEY")

# root = tk.Tk()
# root.title("Song Manager")
# root.geometry("800x500")
# root.mainloop()


def search_youtube(query, api_key):
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 15,
        "key": api_key,
    }
    url = "https://www.googleapis.com/youtube/v3/search?" + urllib.parse.urlencode(
        params
    )

    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read())

    results = []
    for item in data.get("items", []):
        title = html.unescape(item["snippet"]["title"])
        video_id = item["id"]["videoId"]
        link = "https://www.youtube.com/watch?v=" + video_id
        results.append((title, link))
    return results


class SongManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Minimal Song Manager")
        self.root.geometry("500x600")
        self.api_key = api_key
        self.build_widgets()

    def build_widgets(self):
        search_frame = tk.Frame(self.root)
        search_frame.pack(fill="x", padx=10, pady=10)

        self.search_entry = tk.Entry(search_frame)
        self.search_entry.pack(side="left", fill="x", expand=True)
        self.search_entry.bind("<Return>", lambda e: self.search())

        tk.Button(search_frame, text="Search", command=self.search).pack(
            side="left", padx=5
        )

        tk.Label(self.root, text="Search results").pack(anchor="w", padx=10)
        self.results_box = tk.Listbox(self.root, height=8, selectmode="extended")
        self.results_box.pack(fill="both", padx=10, pady=5)

    def search(self):
        query = self.search_entry.get().strip()
        if not query:
            return

        self.search_results = search_youtube(query, self.api_key)

        self.results_box.delete(0, tk.END)
        for title, _ in self.search_results:
            self.results_box.insert(tk.END, title)


if __name__ == "__main__":
    root = tk.Tk()
    app = SongManagerApp(root)
    root.mainloop()
