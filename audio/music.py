# Original gentle pastoral score for the chicken parable, composed and synthesized here
# (C major, 100 bpm: quarter note = 0.6 s). A simple folk theme in plucked strings, warm pads,
# vibraphone, glockenspiel, music box and a soft fife; sections follow the story (timeline.py),
# not a picture cut. The "loss" section turns sparse and minor (Am/Em); the "hatch" section
# brightens into music box; the payoff brings the full theme back for the poor / middle class / rich split.
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, dbg, make_ir, convolve_st, integrated, lp, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.6  # quarter note (s) at 100 bpm

# theme: (bar, beat, length in quarters, midi) - C major folk tune
THEME = [
    (1, 0, 1, 72), (1, 1, 1, 76), (1, 2, 1, 79), (1, 3, 1, 76),
    (2, 0, 1, 81), (2, 1, 1, 79), (2, 2, 1, 76), (2, 3, 1, 74),
    (3, 0, 1, 72), (3, 1, 1, 76), (3, 2, 1, 79), (3, 3, 1, 81),
    (4, 0, 2, 79), (4, 2, 1, 76), (4, 3, 1, 74),
    (5, 0, 1, 76), (5, 1, 1, 79), (5, 2, 1, 81), (5, 3, 1, 79),
    (6, 0, 1, 76), (6, 1, 1, 74), (6, 2, 1, 72), (6, 3, 1, 74),
    (7, 0, 1, 76), (7, 1, 1, 79), (7, 2, 1, 84), (7, 3, 1, 83),
    (8, 0, 2, 84), (8, 2, 1, 79), (8, 3, 1, 76),
]
CHB = {1: "C", 2: "F", 3: "C", 4: "G", 5: "C", 6: "F", 7: "C", 8: "C"}
CH = {
    "C":  dict(oom=(36, 43), pah=[55, 60, 64], hi=[60, 64, 67]),
    "F":  dict(oom=(41, 36), pah=[53, 57, 60], hi=[57, 60, 65]),
    "G":  dict(oom=(43, 38), pah=[55, 59, 62], hi=[59, 62, 67]),
    "Am": dict(oom=(33, 40), pah=[52, 57, 60], hi=[57, 60, 64]),
    "Em": dict(oom=(40, 35), pah=[52, 55, 59], hi=[55, 59, 64]),
    "Dm": dict(oom=(38, 45), pah=[53, 57, 62], hi=[57, 62, 65]),
}
F = I.m2f

# where each section of the music sits (used for the cue sheet and the level automation)
SECTIONS = [(name, a, b) for name, a, b in T.SECTIONS]


def theme(t_bar1, bars=range(1, 9), transpose=0):
    ev = []
    for (b, beat, d, m) in THEME:
        if b not in bars:
            continue
        ev.append((t_bar1 + (b - 1) * 4 * Q + beat * Q, d * Q, m + transpose))
    return sorted(ev)


class Band:
    def __init__(self):
        self.tr = {}
        self.send = {}
        self.cues = []

    def track(self, name, send):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
            self.send[name] = send
        return self.tr[name]

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        buf = self.track(name, send)
        place(buf, pan(x, p) if np.ndim(x) == 1 else x, t, g)


R = rng(20261110)


def _r():
    return rng(int(R.integers(1 << 30)))


def accomp(b, t_bar, chords, bass_vel=0.55, pad_vel=0.4, pah_vel=0.28, pad=True, pah=True):
    """gentle accompaniment: plucked bass on beats 1 and 3 (root/fifth) + soft off-beat chord plucks
    + one warm pad per bar"""
    for beat in range(4):
        c = CH[chords[beat]]
        t = t_bar + beat * Q
        if beat in (0, 2):
            m = c["oom"][beat % 2]
            b.add("pluck", I.pluck(F(m), bass_vel, _r(), dur=0.9), t, -0.15)
        if pah and beat in (1, 3):
            for k, m in enumerate(c["pah"]):
                b.add("pluck", I.pluck(F(m), pah_vel, _r(), dur=0.5, bright=0.4), t + 0.004 * k, 0.25 - 0.1 * k)
    if pad:
        ms = CH[chords[0]]["hi"]
        b.add("pad", I.pad([F(m) for m in ms], 4 * Q, pad_vel, _r(), att=0.5, rel=0.5), t_bar, 0.0)


def melody(b, name, notes, vel, transpose=0, fn="glock", p=0.0, gate=0.9):
    for (t, d, m) in notes:
        m = m + transpose
        if fn == "glock":
            x = I.glock(F(m), vel * R.uniform(0.92, 1.05), _r())
        elif fn == "fife":
            x = I.fife(F(m), d * gate, vel * R.uniform(0.94, 1.04), _r())
        elif fn == "vibes":
            x = I.vibes(F(m), vel * R.uniform(0.92, 1.05), _r(), dur=max(1.2, d + 0.8), damp=d + 0.35)
        elif fn == "musicbox":
            x = I.musicbox(F(m), vel * R.uniform(0.92, 1.05), _r())
        b.add(name, x, t, p)


def pluck_melody(b, notes, vel, p=0.0, transpose=0):
    for (t, d, m) in notes:
        b.add("pluck", I.pluck(F(m + transpose), vel * R.uniform(0.92, 1.05), _r(), dur=d + 0.35, bright=0.6), t, p)


def pad_chord(b, t, dur, chord, vel=0.4):
    b.add("pad", I.pad([F(m) for m in CH[chord]["hi"]], dur, vel, _r(), att=0.5, rel=0.6), t, 0.0)


def build():
    b = Band()
    for name, send in [("pluck", 0.18), ("pad", 0.28), ("vibes", 0.26), ("glock", 0.22),
                       ("musicbox", 0.26), ("fife", 0.16)]:
        b.track(name, send)

    # ============ HOOK 0 - 5.0: theme bars 1-2, plucked melody over a warm C/F pad
    h = theme(0.0, bars=[1, 2])
    pluck_melody(b, h, 0.6, -0.1)
    for bar in (1, 2):
        accomp(b, (bar - 1) * 2.4, [CHB[bar]] * 4, 0.5, 0.38, 0.24)
    b.cues.append((0.0, "hook: theme bars 1-2, plucked melody + warm pad (C - F)"))

    # ============ LOSS 5.0 - 13.9: sparse and minor - Am / Em pads, a few low plucked notes
    pad_chord(b, 5.0, 3.9, "Am", 0.34)
    pad_chord(b, 8.9, 2.5, "Em", 0.32)
    pad_chord(b, 11.4, 2.5, "Am", 0.34)
    for (t, m, v) in [(5.4, 57, 0.5), (8.1, 64, 0.42), (10.45, 60, 0.5), (12.1, 57, 0.45)]:
        b.add("pluck", I.pluck(F(m), v, _r(), dur=1.4), t, -0.1)
    b.cues.append((5.0, "loss: sparse Am/Em pads, low plucked notes (wealth taken away, 'Gone' on 10.45)"))

    # ============ GIFT 13.9 - 17.0: theme bars 1-2 return soft, vibes lead (one chicken each)
    g = theme(13.8, bars=[1, 2])
    melody(b, "vibes", g, 0.55, 0, "vibes", -0.2)
    pluck_melody(b, g, 0.3, 0.15)
    for bar in (1, 2):
        accomp(b, 13.8 + (bar - 1) * 2.4, [CHB[bar]] * 4, 0.42, 0.34, 0.0, pad=True, pah=False)
    b.cues.append((13.8, "gift: theme bars 1-2 return soft on vibes (each person gets one chicken)"))

    # ============ GROUP 1 17.0 - 23.6: playful plucked bars 3-4, then a rueful low tail on "Last dinner, too"
    g1 = theme(17.0, bars=[3, 4])
    pluck_melody(b, g1, 0.62, -0.1)
    for bar in (3, 4):
        accomp(b, 17.0 + (bar - 3) * 2.4, [CHB[bar]] * 4, 0.5, 0.3, 0.22)
    b.add("pluck", I.pluck(F(52), 0.5, _r(), dur=1.2), 22.3, -0.1)
    b.add("pluck", I.pluck(F(48), 0.45, _r(), dur=1.6), 23.0, -0.1)
    pad_chord(b, 22.2, 1.4, "Am", 0.25)
    b.cues.append((17.0, "group 1: playful plucked bars 3-4 (cooking the chicken), rueful low tail on 'Last dinner, too'"))

    # ============ GROUP 2 23.6 - 31.8: calm - theme bars 5-8 on soft fife, steady pad
    g2 = theme(23.6, bars=[5, 6, 7, 8])
    melody(b, "fife", g2, 0.5, 0, "fife", 0.2)
    pluck_melody(b, g2, 0.28, -0.15)
    for bar in (5, 6, 7, 8):
        accomp(b, 23.6 + (bar - 5) * 2.4, [CHB[bar]] * 4, 0.45, 0.34, 0.0, pad=True, pah=False)
    b.cues.append((23.6, "group 2: calm - theme bars 5-8 on soft fife (hens kept for eggs, roosters for breeding)"))

    # ============ GROUP 3 31.8 - 43.4: the idea - glock lead, brighter; call-and-response on "wanted eggs / chickens"
    g3 = theme(31.8, bars=[1, 2, 3, 4])
    melody(b, "glock", g3, 0.5, 0, "glock", -0.25)
    pluck_melody(b, g3, 0.3, 0.15)
    for bar in (1, 2, 3, 4):
        accomp(b, 31.8 + (bar - 1) * 2.4, [CHB[bar]] * 4, 0.5, 0.36, 0.22)
    for (t, m) in [(41.0, 76), (41.3, 79), (42.5, 72), (42.8, 76), (43.1, 79)]:   # "wanted eggs" / "wanted chickens"
        b.add("pluck", I.pluck(F(m), 0.55, _r(), dur=0.5, bright=0.7), t, 0.1)
    b.cues.append((31.8, "group 3: glock lead, theme bars 1-4 (pooling hens and roosters)"))
    b.cues.append((41.0, "call-and-response plucks: 'wanted eggs' (E-G) vs 'wanted chickens' (C-E-G)"))

    # ============ HATCH 43.4 - 52.4: music-box sparkle, theme bars 5-8, walking bass climbs
    gh = theme(43.4, bars=[5, 6, 7, 8])
    melody(b, "musicbox", gh, 0.62, 0, "musicbox", 0.15)
    pluck_melody(b, gh, 0.28, -0.15)
    for bar in (5, 6, 7, 8):
        accomp(b, 43.4 + (bar - 5) * 2.4, [CHB[bar]] * 4, 0.5, 0.34, 0.22)
    for (t, m) in [(44.5, 96), (47.7, 98), (50.9, 96)]:
        b.add("glock", I.glock(F(m), 0.3, _r(), dur=0.6), t, -0.3)
    b.cues.append((43.4, "hatch: music-box theme bars 5-8, glock sparkles (chicks hatch, flock grows)"))

    # ============ SPLIT 52.4 - 61.8: complaint (low Am, sparse) then comfortable (warm vibes bars 1-2)
    pad_chord(b, 52.4, 2.8, "Am", 0.3)
    pad_chord(b, 55.2, 3.0, "Em", 0.28)
    for (t, m, v) in [(53.0, 57, 0.45), (55.2, 52, 0.42), (57.2, 57, 0.45)]:
        b.add("pluck", I.pluck(F(m), v, _r(), dur=1.2), t, -0.1)
    b.cues.append((52.4, "split (complaint): low Am/Em pads, sparse plucks (group 1 has nothing left)"))
    gc = theme(58.2, bars=[1, 2])
    melody(b, "vibes", gc, 0.55, 0, "vibes", -0.2)
    for bar in (1, 2):
        accomp(b, 58.2 + (bar - 1) * 2.4, [CHB[bar]] * 4, 0.42, 0.34, 0.0, pad=True, pah=False)
    b.cues.append((58.2, "split (comfortable): warm vibes bars 1-2 (group 2 has enough eggs)"))

    # ============ HIRE 61.8 - 69.0: busy and warm - theme bars 3-5, plucked, more movement
    gh2 = theme(61.8, bars=[3, 4, 5])
    pluck_melody(b, gh2, 0.62, -0.1)
    melody(b, "fife", gh2, 0.38, 0, "fife", 0.25)
    for bar in (3, 4, 5):
        accomp(b, 61.8 + (bar - 3) * 2.4, [CHB[bar]] * 4, 0.55, 0.36, 0.26)
    b.cues.append((61.8, "hire: busy warm bars 3-5, pluck + fife (work paid in eggs)"))

    # ============ PAYOFF 69.0 - 75.984: full theme bars 1-2, then a final C chord that rings out
    gp = theme(69.0, bars=[1, 2])
    pluck_melody(b, gp, 0.62, -0.1)
    melody(b, "fife", gp, 0.5, 0, "fife", 0.2)
    melody(b, "glock", gp, 0.35, 12, "glock", -0.3)
    for bar in (1, 2):
        accomp(b, 69.0 + (bar - 1) * 2.4, [CHB[bar]] * 4, 0.55, 0.4, 0.26)
    pad_chord(b, 73.8, 2.18, "C", 0.42)
    b.add("pluck", I.pluck(F(84), 0.6, _r(), dur=1.8, bright=0.7), 73.8, 0.0)
    for (t, m) in [(74.0, 72), (74.3, 76), (74.6, 79), (74.9, 84)]:
        b.add("musicbox", I.musicbox(F(m), 0.4, _r()), t, 0.15)
    b.cues.append((69.0, "payoff: full theme bars 1-2 (pluck + fife + glock)"))
    b.cues.append((73.8, "final C chord + music-box arpeggio C-E-G-C on 'poor / middle class / rich'"))

    end = np.ones(N)
    a = ns(T.DUR - 0.6)
    end[a:] = np.linspace(1, 0, N - a) ** 1.5
    for k in b.tr:
        b.tr[k] *= end[None, :]
    return b


TARGET = {  # relative balance inside the band (LU, measured on each track's own active span)
    "pluck": -2.0, "pad": -4.5, "vibes": -2.5, "glock": -6.0, "musicbox": -2.0, "fife": -3.0,
}


def render(b, ref=-20.0):
    hall = make_ir(1.4, 7, pre=0.018, hf=1.4)
    dry = np.zeros((2, N))
    wet_hall = np.zeros((2, N))
    levels = {}
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        L = integrated(x)
        g = dbg(ref + TARGET.get(k, -6) - L)
        levels[k] = (round(L, 1), round(ref + TARGET.get(k, -6), 1))
        x = x * g
        b.tr[k] = x
        dry += x
        wet_hall += b.send[k] * x
    out = dry + 0.7 * convolve_st(wet_hall.mean(0), hall)
    out = hp(out, 30, 2)
    return out, levels
