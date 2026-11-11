# Timeline for "Why do the rich keep getting richer...? One chicken explains it."
# Story beats keyed to voice/words.json (256 words, 0.18-75.75 s) and the script's parable structure.
# Music sections follow the story, not a picture cut: hook | loss (God takes wealth) | gift (one chicken each) |
# group 1 (cook it) | group 2 (keep hens/roosters) | group 3 (pool them) | hatch (chicks grow) |
# split (complain vs comfortable) | hire (work paid in eggs) | payoff (poor / middle class / rich).
import json

FPS = 24
DUR = 75.984                       # exact length of voice/voice.wav (3,647,232 samples @ 48 kHz)
N_FRAMES = int(round(DUR * FPS))

# story sections: (name, start_s, end_s)
SECTIONS = [
    ("hook",    0.00,  5.00),     # "Why do the rich keep getting richer...? One chicken explains it."
    ("loss",    5.00, 13.90),     # God takes everyone's wealth. Gone. Everyone is poor. Everyone is hungry.
    ("gift",   13.90, 17.00),     # Three days later, he gives each person one chicken.
    ("group1", 17.00, 23.60),     # First group cooks their chicken that same night. Best dinner. Last dinner, too.
    ("group2", 23.60, 31.80),     # Second group keeps chickens alive: hen -> eggs, rooster -> breeding.
    ("group3", 31.80, 43.40),     # Third group pools hens + roosters for a share of the eggs.
    ("hatch",  43.40, 52.40),     # Three weeks later chicks hatch; months later they lay eggs of their own.
    ("split",  52.40, 61.80),     # Group 1 has nothing left, complains; group 2 has enough eggs, lives comfortably.
    ("hire",   61.80, 69.00),     # Group 3 has so many chickens they hire group 1, work paid in eggs.
    ("payoff", 69.00, 75.984),    # ...split into the poor, the middle class, and the rich.
]


def section_at(t):
    for name, a, b in SECTIONS:
        if a <= t < b:
            return name
    return SECTIONS[-1][0]


def words(path):
    return json.load(open(path, encoding="utf-8"))


def word_time(words, idx, which="s"):
    """start ('s') or end ('e') time of word index idx in words.json"""
    return float(words[idx][which])


def find_word(words, text, after=0):
    """first index >= after whose word matches text (lowercased, punctuation stripped)"""
    import re
    for i in range(after, len(words)):
        if re.sub(r"[^a-z']", "", words[i]["w"].lower()) == text:
            return i
    return None
