"""Generates the cute music buddies in src/shared/svg/<id>.svg (cat, panda, tiger, polar, bunny, hedgehog, hamster, kitten).

All characters share one face rig + animation so they move the same way:
  - still when paused; animate only inside an `.is-playing` ancestor (Menu.tsx, FullPlayer.tsx, Settings.tsx)
  - gentle side-to-side sway (no up / down bob, no big tilt): 2 slow sways, then a calm pause; notes + hearts float up from the ear cups
  - 28s loop: sings ~3s with happy closed eyes -> rest (blink) -> rest (blink) -> sings ~3s

Run from the repo root after changing anything here:
    python3 scripts/gen_characters.py
"""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "shared" / "svg"

# ---------------------------------------------------------------- timing
LOOP = 28  # seconds; 1% = 0.28s
pct = lambda s: round(s / LOOP * 100, 2)

SINGS = [0.2, 19.2]  # sings 3s, eyes closed happily
BLINKS = [15.0, 25.6]  # quick blinks during the rests
PHRASE = [0.9, 0.3, 1, 0.2, 0.7, 1, 0.4, 0.9, 0.2]  # mouth openness per beat
BEAT = 0.3
SING_LEN = BEAT * len(PHRASE)

mouth = {0: 0, 100: 0}
happy = {0: 0, 100: 0}  # 1 = eyes closed happily (^ ^)
for start in SINGS:
    mouth[pct(start)] = 0
    t = start
    for v in PHRASE:
        mouth[pct(t + BEAT * 0.5)] = v
        t += BEAT
    mouth[pct(t + 0.25)] = 0
    happy.update({pct(start - 0.05) if start > 0.1 else 0.1: 0, pct(start + 0.15): 1,
                  pct(start + SING_LEN + 0.1): 1, pct(start + SING_LEN + 0.35): 0})

blink = {0: 1, 100: 1}
for b in BLINKS:
    blink.update({pct(b): 1, pct(b + 0.08): 0.1, pct(b + 0.2): 1})


def kf(name, d, fmt):
    rows = "\n".join(f"      {k}% {{ {fmt(v)} }}" for k, v in sorted(d.items()))
    return f"    @keyframes {name} {{\n{rows}\n    }}"


CSS = f"""  <style>
    .pg-smile .pg-bob {{ transform-origin: 12px 21px; }}
    .pg-smile .pg-open {{ transform-origin: 12px 16px; transform: scaleY(0); }}
    .pg-smile .pg-eyes {{ transform-origin: 12px 14px; }}
    .pg-smile .pg-happy {{ opacity: 0; }}
    .pg-smile .pg-float {{ opacity: 0; }}
    .is-playing .pg-smile .pg-bob {{ animation: pg-smile-bob 7s ease-in-out infinite; }}
    .is-playing .pg-smile .pg-open {{ animation: pg-smile-sing {LOOP}s linear infinite; }}
    .is-playing .pg-smile .pg-eyes {{ animation: pg-smile-blink {LOOP}s linear infinite, pg-smile-awake {LOOP}s linear infinite; }}
    .is-playing .pg-smile .pg-happy {{ animation: pg-smile-happy {LOOP}s linear infinite; }}
    .is-playing .pg-smile .pg-float-l {{ animation: pg-smile-float-l 7s ease-out infinite; }}
    .is-playing .pg-smile .pg-float-r {{ animation: pg-smile-float-r 7s ease-out infinite; }}
    .is-playing .pg-smile .pg-d1 {{ animation-delay: 1.75s; }}
    .is-playing .pg-smile .pg-d2 {{ animation-delay: 3.5s; }}
    .is-playing .pg-smile .pg-d3 {{ animation-delay: 5.25s; }}
    /* notes + hearts drift up and outward from the ear cups, then fade */
    @keyframes pg-smile-float-l {{
      0% {{ opacity: 0; transform: translate(0, 0) scale(.6); }}
      4% {{ opacity: 1; }}
      24% {{ opacity: .9; }}
      32% {{ opacity: 0; transform: translate(-1.6px, -6.5px) scale(1) rotate(-12deg); }}
      100% {{ opacity: 0; transform: translate(-1.6px, -6.5px) scale(1); }}
    }}
    @keyframes pg-smile-float-r {{
      0% {{ opacity: 0; transform: translate(0, 0) scale(.6); }}
      4% {{ opacity: 1; }}
      24% {{ opacity: .9; }}
      32% {{ opacity: 0; transform: translate(1.6px, -6.5px) scale(1) rotate(12deg); }}
      100% {{ opacity: 0; transform: translate(1.6px, -6.5px) scale(1); }}
    }}
    /* the old slight lean left / right (same 3deg, same pace), no up / down dip:
       sways ~2.8s, then eases back to center and holds still ~4.2s so it never gets busy */
    @keyframes pg-smile-bob {{
      0%, 40%, 100% {{ transform: rotate(0); }}
      5%, 25% {{ transform: rotate(-3deg); }}
      15%, 35% {{ transform: rotate(3deg); }}
    }}
{kf("pg-smile-sing", mouth, lambda v: f"transform: scaleY({v});")}
{kf("pg-smile-blink", blink, lambda v: f"transform: scaleY({v});")}
{kf("pg-smile-happy", happy, lambda v: f"opacity: {v};")}
{kf("pg-smile-awake", happy, lambda v: f"opacity: {1 - v};")}
    @media (prefers-reduced-motion: reduce) {{
      .is-playing .pg-smile * {{ animation: none !important; }}
    }}
  </style>"""

# small shapes drawn around (0,0)
NOTE = "M-.2 .6a.95.7-20 1 1 1.1-.4V-3.2q1.3.4 1.4 1.7-.6-.7-1.4-.8"  # eighth note
HEART = "M0 1.3C-1.7 0-1.7-1.5-.85-1.5-.35-1.5 0-1.1 0-.75 0-1.1.35-1.5.85-1.5 1.7-1.5 1.7 0 0 1.3z"

HEAD = '<ellipse cx="12" cy="14.2" rx="8.9" ry="7.1" fill="url(#{fur})" stroke="{line}" stroke-width=".7" />'
PINK_NOSE = '<path d="M11.45 15h1.1l-.55.6z" fill="#ff86a6" stroke="#ff86a6" stroke-width=".35" />'
DARK_NOSE = '<ellipse cx="12" cy="15.2" rx=".75" ry=".5" fill="#2e2a33" />'
CAT_MOUTH = '<path d="M11 15.9q.5.55 1 0 .5.55 1 0" stroke="{line}" stroke-width=".55" />'
ROUND_EARS = ('<circle cx="5.7" cy="7.4" r="2.5" fill="{ear}" stroke="{line}" stroke-width=".7" />'
              '<circle cx="18.3" cy="7.4" r="2.5" fill="{ear}" stroke="{line}" stroke-width=".7" />'
              '<circle cx="5.9" cy="7.6" r="1.25" fill="{inner}" /><circle cx="18.1" cy="7.6" r="1.25" fill="{inner}" />')

# ---------------------------------------------------------------- characters
# fur: gradient stops (center -> edge); everything else is svg snippets ({line}/{fur}/... get filled in)
CHARACTERS = {
    "cat": dict(
        fur=("#fffaf2", "#ffe6c8", "#f7c99c"), line="#a8673f", eye="#3b2418", happy="#3b2418",
        band="#7d6b91", cup="#ff93b5", cushion="#ffd0df",
        ears='<path d="M4.3 11.2C3.6 7.6 4.1 4.6 5.3 4.1c1-.4 3 1.2 4.7 3.1M19.7 11.2c.7-3.6.2-6.6-1-7.1-1-.4-3 1.2-4.7 3.1" fill="url(#{fur})" stroke="{line}" stroke-width=".7" />'
             '<path d="M5.4 9.2c-.2-1.6 0-3 .5-3.3.5-.2 1.5.6 2.4 1.6zM18.6 9.2c.2-1.6 0-3-.5-3.3-.5-.2-1.5.6-2.4 1.6z" fill="#ffb3c8" />',
        marks='<path d="M11 8v1.1M12 7.7v1.4M13 8v1.1" stroke="#eab38a" stroke-width=".7" />',
        nose=PINK_NOSE, mouth=CAT_MOUTH,
    ),
    "panda": dict(
        fur=("#ffffff", "#f4f5f7", "#dcdfe5"), line="#7d828c", eye="#141418", happy="#ffffff",
        band="#4f8f7a", cup="#8fe3c6", cushion="#d6f7ea", ear="#2e2e35", inner="#55555f",
        ears=ROUND_EARS,
        # black eye patches, slanting outward
        marks='<ellipse cx="8.3" cy="14.3" rx="2.2" ry="2.7" transform="rotate(28 8.3 14.3)" fill="#2e2e35" />'
              '<ellipse cx="15.7" cy="14.3" rx="2.2" ry="2.7" transform="rotate(-28 15.7 14.3)" fill="#2e2e35" />',
        nose=DARK_NOSE, mouth='<path d="M11 16.1q.5.55 1 0 .5.55 1 0" stroke="#2e2e35" stroke-width=".55" />',
    ),
    "tiger": dict(
        fur=("#fff1d6", "#ffbe6b", "#f39a35"), line="#9a5420", eye="#2e1a0e", happy="#2e1a0e",
        band="#6b5fa8", cup="#b9a8ff", cushion="#e4ddff", ear="url(#{fur})", inner="#fff3df",
        ears=ROUND_EARS,
        marks='<path d="M10.7 7.6l.4 1.5M12 7.3v1.9M13.3 7.6l-.4 1.5M6.2 9.7l1.5.8M17.8 9.7l-1.5.8" stroke="#6b3412" stroke-width=".75" />'
              '<ellipse cx="12" cy="16.3" rx="3.2" ry="2.1" fill="#fff6ea" />',
        nose=PINK_NOSE, mouth=CAT_MOUTH,
    ),
    "polar": dict(
        fur=("#ffffff", "#f2f7fc", "#d9e5f1"), line="#8ea3b8", eye="#22303d", happy="#22303d",
        band="#4a7fb5", cup="#9fd3ff", cushion="#dff1ff", ear="url(#{fur})", inner="#ffd3df",
        ears=ROUND_EARS,
        marks='<ellipse cx="12" cy="16.2" rx="3.1" ry="2.1" fill="#ffffff" stroke="#d3dfeb" stroke-width=".5" />',
        nose=DARK_NOSE, mouth='<path d="M11 16.1q.5.55 1 0 .5.55 1 0" stroke="#4a5866" stroke-width=".55" />',
    ),
    "bunny": dict(
        fur=("#ffffff", "#fff1f3", "#f6d6dd"), line="#c08a96", eye="#3a2228", happy="#3a2228",
        band="#9a6fb0", cup="#e6b8ff", cushion="#f5e3ff",
        # long upright ears (slightly apart), pink insides
        ears='<ellipse cx="8.4" cy="5.9" rx="2" ry="3.9" transform="rotate(-10 8.4 5.9)" fill="url(#{fur})" stroke="{line}" stroke-width=".7" />'
             '<ellipse cx="15.6" cy="5.9" rx="2" ry="3.9" transform="rotate(10 15.6 5.9)" fill="url(#{fur})" stroke="{line}" stroke-width=".7" />'
             '<ellipse cx="8.4" cy="6.2" rx=".9" ry="2.7" transform="rotate(-10 8.4 6.2)" fill="#ffb3c8" />'
             '<ellipse cx="15.6" cy="6.2" rx=".9" ry="2.7" transform="rotate(10 15.6 6.2)" fill="#ffb3c8" />',
        marks="",
        nose=PINK_NOSE,
        # :3 mouth + two tiny bunny teeth
        mouth='<path d="M11 15.9q.5.55 1 0 .5.55 1 0" stroke="{line}" stroke-width=".55" />'
              '<path d="M11.45 16.3h1.1v.75h-1.1z" fill="#fff" stroke="{line}" stroke-width=".35" /><path d="M12 16.3v.75" stroke="{line}" stroke-width=".3" />',
    ),
    "hedgehog": dict(
        fur=("#fff3e2", "#f6d9b8", "#e2b48a"), line="#9a6a46", eye="#2e1a0e", happy="#2e1a0e",
        band="#4f9a5e", cup="#a8e6a1", cushion="#e0f7d9",
        # crown of brown spikes behind the head
        ears='<path d="M3 14 2.2 10.6l2.4-.2-.6-3.6 3 .8.6-3.4 2.6 2L12 3.4l1.8 2.8 2.6-2 .6 3.4 3-.8-.6 3.6 2.4.2L21 14z" fill="#8a5a3c" stroke="#5e3a24" stroke-width=".6" />',
        # spiky brown cap over the forehead
        marks='<path d="M4.2 11.2C5 8.4 8.2 7 12 7s7 1.4 7.8 4.2c-1.2-.4-2-.2-2.8.4-.4-.9-1.2-1.4-2.2-1.4-.6.6-1.6.9-2.8.9s-2.2-.3-2.8-.9c-1 0-1.8.5-2.2 1.4-.8-.6-1.6-.8-2.8-.4z" fill="#8a5a3c" stroke="#5e3a24" stroke-width=".5" />',
        nose=DARK_NOSE, mouth=CAT_MOUTH,
    ),
    "hamster": dict(
        fur=("#fff6e6", "#ffd59a", "#f0ad5a"), line="#a8682e", eye="#2e1a0e", happy="#2e1a0e",
        band="#e0644f", cup="#ffb199", cushion="#ffe0d6", ear="url(#{fur})", inner="#ffc2cf",
        ears=ROUND_EARS,
        # puffy cream cheek pouches + a cream stripe down the forehead
        marks='<ellipse cx="7" cy="16.9" rx="2.7" ry="2.1" fill="#fff4e2" /><ellipse cx="17" cy="16.9" rx="2.7" ry="2.1" fill="#fff4e2" />'
              '<path d="M12 7.3c-.9 1.4-1.2 3-1 4.6h2c.2-1.6-.1-3.2-1-4.6z" fill="#fff4e2" />',
        nose=PINK_NOSE,
        mouth='<path d="M11 15.9q.5.55 1 0 .5.55 1 0" stroke="{line}" stroke-width=".55" />'
              '<path d="M11.45 16.3h1.1v.75h-1.1z" fill="#fff" stroke="{line}" stroke-width=".35" /><path d="M12 16.3v.75" stroke="{line}" stroke-width=".3" />',
    ),
    "kitten": dict(
        fur=("#ffffff", "#f7f7fa", "#e3e4ec"), line="#9a9cab", eye="#2b3550", happy="#2b3550",
        band="#6fa8dc", cup="#b8dcff", cushion="#e3f1ff",
        ears='<path d="M4.3 11.2C3.6 7.6 4.1 4.6 5.3 4.1c1-.4 3 1.2 4.7 3.1M19.7 11.2c.7-3.6.2-6.6-1-7.1-1-.4-3 1.2-4.7 3.1" fill="url(#{fur})" stroke="{line}" stroke-width=".7" />'
             '<path d="M5.4 9.2c-.2-1.6 0-3 .5-3.3.5-.2 1.5.6 2.4 1.6zM18.6 9.2c.2-1.6 0-3-.5-3.3-.5-.2-1.5.6-2.4 1.6z" fill="#ffc2d4" />',
        # little flower clip by the right ear
        marks='<g fill="#ffc9dc" stroke="#f59ab9" stroke-width=".25"><circle cx="17.3" cy="8" r=".75" /><circle cx="18.2" cy="8.7" r=".75" /><circle cx="17.85" cy="9.75" r=".75" /><circle cx="16.75" cy="9.75" r=".75" /><circle cx="16.4" cy="8.7" r=".75" /></g>'
              '<circle cx="17.3" cy="9" r=".5" fill="#ffcf4d" />',
        nose=PINK_NOSE, mouth=CAT_MOUTH,
    ),
}


def svg_for(cid, c):
    fur = f"pg-fur-{cid}"
    fill = lambda s: s.format(fur=fur, line=c["line"], ear=c.get("ear", "").format(fur=fur), inner=c.get("inner", ""))
    a, b, z = c["fur"]
    eye = c["eye"]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" class="pg-smile" viewBox="1 1.7 22 22" width="1em" height="1em" overflow="visible" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- playlistGo music buddy: {cid}. GENERATED by scripts/gen_characters.py, edit that instead.
       Still when paused; animates only inside .is-playing. viewBox is cropped tight so it fills 1em like a react-icon -->
{CSS}
  <defs>
    <radialGradient id="{fur}" cx=".42" cy=".3" r=".85">
      <stop offset="0" stop-color="{a}" />
      <stop offset=".55" stop-color="{b}" />
      <stop offset="1" stop-color="{z}" />
    </radialGradient>
  </defs>
  <g class="pg-bob">
    {fill(c["ears"])}
    {fill(HEAD)}
    {fill(c["marks"])}
    <ellipse cx="6.5" cy="16.3" rx="1.5" ry=".85" fill="#ff8fab" opacity=".5" />
    <ellipse cx="17.5" cy="16.3" rx="1.5" ry=".85" fill="#ff8fab" opacity=".5" />
    <g class="pg-eyes">
      <ellipse cx="8.5" cy="14" rx="1.3" ry="1.5" fill="{eye}" />
      <ellipse cx="15.5" cy="14" rx="1.3" ry="1.5" fill="{eye}" />
      <circle cx="9" cy="13.4" r=".5" fill="#fff" />
      <circle cx="16" cy="13.4" r=".5" fill="#fff" />
      <circle cx="8.1" cy="14.6" r=".22" fill="#fff" />
      <circle cx="15.1" cy="14.6" r=".22" fill="#fff" />
    </g>
    <path class="pg-happy" d="M7.3 14.4q1.2-1.3 2.4 0M14.3 14.4q1.2-1.3 2.4 0" stroke="{c["happy"]}" stroke-width=".85" />
    <ellipse class="pg-open" cx="12" cy="16.9" rx=".8" ry=".95" fill="#d9536f" />
    {fill(c["nose"])}
    {fill(c["mouth"])}
    <path d="M3.3 13C3.3 3 20.7 3 20.7 13" stroke="{c["band"]}" stroke-width="1.4" />
    <rect x="1.4" y="11.6" width="3.6" height="5.8" rx="1.8" fill="{c["cup"]}" stroke="{c["band"]}" stroke-width=".7" />
    <rect x="19" y="11.6" width="3.6" height="5.8" rx="1.8" fill="{c["cup"]}" stroke="{c["band"]}" stroke-width=".7" />
    <path d="M4.4 12.6v3.8M19.6 12.6v3.8" stroke="{c["cushion"]}" stroke-width=".7" />
  </g>
  <g transform="translate(2.4 9.6)"><path class="pg-float pg-float-l" d="{NOTE}" fill="{c["band"]}" stroke="{c["band"]}" stroke-width=".5" /></g>
  <g transform="translate(21.6 9.6)"><path class="pg-float pg-float-r pg-d1" d="{HEART}" fill="#ff6f9c" /></g>
  <g transform="translate(21.4 9.6)"><path class="pg-float pg-float-r pg-d2" d="{NOTE}" fill="{c["band"]}" stroke="{c["band"]}" stroke-width=".5" /></g>
  <g transform="translate(2.6 9.6)"><path class="pg-float pg-float-l pg-d3" d="{HEART}" fill="#ff6f9c" /></g>
</svg>
'''


if __name__ == "__main__":
    for cid, c in CHARACTERS.items():
        (OUT / f"{cid}.svg").write_text(svg_for(cid, c))
        print("wrote", OUT / f"{cid}.svg")
