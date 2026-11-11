# Every sound effect + ambience bed of the chicken parable as a cue list timed to voice/words.json
# (timeline.py), rendered into one stereo SFX stem. All chicken/egg sounds are synthesized here in numpy
# (clucks, chick peeps, egg pops/ticks, a formant-voiced rooster crow, cooking sizzle, wing flutter);
# shared helpers (breeze, birds, whoosh, clink) come from sfx_gen.py. Levels follow the user's standard
# mix: each EVENT has a "naive" level (LU relative to the voice stem, as the event's max momentary
# loudness) and is placed SFX_DB = -6 dB under it; ambience BEDS (integrated loudness) are not reduced.
import math
import numpy as np
from dsp import (SR, TAU, ns, tt, rng, dbg, lp, hp, bp, peq, pan, st, place, fades, widen, make_ir, convolve_st,
                 momentary_max, integrated, colored, smooth_noise, modal, phase)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


# ================================================================ chicken / egg synthesis
def cluck(r, f0=430, dur=0.16, drop=0.5, vel=1.0):
    """a hen's 'buh-BUK': two gliding-tone pulses with a beak click"""
    n = ns(dur)
    t = tt(dur)
    y = np.zeros(n)
    for (dt, a, f) in [(0.0, 0.55, f0 * 1.05), (0.075, 1.0, f0)]:
        L = ns(dur - dt)
        tl = np.arange(L) / SR
        ff = f * (1 - drop * tl / max(dur - dt, 1e-6))
        ph = phase(ff)
        env = (1 - np.exp(-tl / 0.006)) * np.exp(-tl / 0.05)
        y[ns(dt): ns(dt) + L] += a * (np.sin(ph) + 0.5 * np.sin(2 * ph + 0.3) + 0.2 * np.sin(3 * ph)) * env
    nz = r.standard_normal(n)
    y += hp(nz, 2500) * np.exp(-t / 0.008) * 0.35
    return fades(y * vel, 0.001, 0.02)


def peep(r, f0=3600, dur=0.10):
    """one chick's high 'peep': a short descending chirp"""
    n = ns(dur)
    t = tt(dur)
    f = f0 * (1 - 0.28 * t / dur)
    ph = phase(f)
    env = np.sin(np.pi * t / dur) ** 2
    return fades((np.sin(ph) + 0.25 * np.sin(2 * ph)) * env, 0.001, 0.01)


def egg_pop(r, f0=520, dur=0.14):
    """an egg laid / dropped: soft low 'plop' with a tiny shell tick"""
    y = modal(dur, [(f0, 1.0, 0.035), (f0 * 2.71, 0.4, 0.015), (f0 * 4.6, 0.2, 0.008)], r, glide=0.12, glide_tau=0.03)
    t = tt(dur)
    y += hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.001) * 0.15
    return fades(y, 0.0005, 0.02)


def egg_tick(r, f0=1900, dur=0.07):
    """an egg (or coin) tapped down: short woody/metallic tick, used for the egg payments"""
    y = modal(dur, [(f0, 1.0, 0.012), (f0 * 2.4, 0.5, 0.007), (f0 * 3.9, 0.25, 0.004)], r)
    t = tt(dur)
    y += hp(r.standard_normal(len(t)), 4000) * np.exp(-t / 0.0008) * 0.3
    return fades(y, 0.0003, 0.01)


def rooster_crow(r, dur=0.95):
    """a rooster's 'cock-a-doodle-doo': formant-voiced (sfx_gen.vox) with a rising, vibratoed
    f0 contour and syllable dips - cartoon-stylized, in keeping with the stickman visuals"""
    n = ns(dur)
    t = np.arange(n) / SR
    f0 = np.interp(t, [0, 0.12, 0.22, 0.30, 0.45, 0.60, 0.75, 0.95],
                   [380, 540, 480, 620, 730, 680, 580, 470])
    vib = 1 + 0.03 * np.sin(TAU * 5.5 * t) * np.clip((t - 0.3) / 0.2, 0, 1)
    f0 = f0 * vib
    forms = G.vowel_track(n, [(0, "o"), (0.15, "a"), (0.35, "a"), (0.55, "u"), (0.95, "u")])
    amp = np.clip(t / 0.04, 0, 1) * np.clip((dur - t) / 0.12, 0, 1)
    for tc, depth in [(0.22, 0.35), (0.50, 0.3), (0.72, 0.25)]:
        amp *= 1 - depth * np.exp(-((t - tc) / 0.03) ** 2)
    y = G.vox(f0, forms, amp, r, 1.0, tilt=1.0, breath=0.25, fmax=4500)
    y += hp(r.standard_normal(n), 3000) * amp * 0.06
    return fades(y, 0.005, 0.05)


def sizzle(dur, r, rate=42):
    """frying pan: bandpassed hiss + random crackle pops, stereo"""
    n = ns(dur)
    t = np.arange(n) / SR
    nz = r.standard_normal(n)
    base = bp(nz, 2600, 9000, 1) * (0.75 + 0.25 * smooth_noise(n, r, 0.4))
    pops = np.zeros(n)
    tm = r.uniform(0, 0.05)
    while tm < dur:
        L = ns(0.012)
        k = ns(tm)
        if k + L < n:
            tl = np.arange(L) / SR
            pops[k:k + L] += bp(r.standard_normal(L), 3000, 8000, 1) * np.exp(-tl / 0.003) * r.uniform(0.3, 1.0)
        tm += r.exponential(1.0 / rate)
    y = base * 0.5 + pops
    y *= np.clip(t / 0.15, 0, 1) * np.clip((dur - t) / 0.3, 0, 1)
    return fades(widen(y, r, 8, 0.7), 0.0, 0.05)


def flutter(r, dur=0.45):
    """wing flutter as a chicken is handed over: ~22 Hz wingbeats in bandpassed noise"""
    n = ns(dur)
    t = np.arange(n) / SR
    nz = r.standard_normal(n)
    y = bp(nz, 500, 2400, 1) * (0.55 + 0.45 * np.sin(TAU * 22 * t)) ** 2
    y *= np.clip(t / 0.05, 0, 1) * np.exp(-t / 0.35)
    return widen(y, r, 8, 0.8)


def eggshell_crack(r, dur=0.25):
    """a chick breaking out: tiny shell crackle"""
    n = ns(dur)
    y = np.zeros(n)
    tm = 0.0
    while tm < dur:
        k = ns(tm)
        L = ns(0.02)
        if k + L >= n:
            break
        tl = np.arange(L) / SR
        y[k:k + L] += (modal(0.02, [(r.uniform(1800, 3200), 1.0, 0.004), (r.uniform(3500, 6000), 0.5, 0.002)], r)
                       + hp(r.standard_normal(L), 2500) * np.exp(-tl / 0.002)) * r.uniform(0.3, 1.0)
        tm += r.exponential(0.05)
    return fades(y, 0.001, 0.03)


def bass_drop(r, dur=1.4, f0=95.0, f1=36.0):
    """deep bass impact for the final contrast ('split into the poor...'): sine sweep down
    with an exponential decay tail. Cinematic, sits under the narration."""
    n = ns(dur)
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = phase(f)
    env = np.exp(-t / 0.35) * (1 - np.exp(-t / 0.008))
    y = np.sin(ph) * env
    y += 0.3 * np.sin(2 * ph) * env * np.exp(-t / 0.2)
    return fades(y, 0.002, 0.15)


def grain_fall(r, dur=1.6):
    """dry grain pattering down during the flock-growth beat (shot 9)."""
    y = G.rattle(dur, r, density=42.0)
    return fades(y, 0.05, 0.25)


def farm_bed(dur, r):
    """farmyard air for the whole parable: breeze, distant sparrows, faint far-off clucks"""
    x = G.breeze(dur, r, 0.7, 0.18, 850)
    x += pan(G.bird_chirps(dur, r, 0.4, "sparrow") * 0.07, 0.5)
    x += pan(G.bird_chirps(dur, r, 0.3, "sparrow") * 0.05, -0.6)
    tm = r.uniform(2, 6)
    while tm < dur - 1:
        c = cluck(rng(int(r.integers(1 << 30))), r.uniform(380, 460), 0.16) * 0.12
        place(x, pan(c, r.uniform(-0.8, 0.8)), tm)
        tm += r.exponential(9.0) + 3
    return fades(x, 0.5, 0.6)


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.12, group=None, cut=None):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.lpf, self.send, self.cut = kind, p, extra, lpf, send, cut
        self.group = group or name
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None


def cues():
    C = []
    R = rng(20261110)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append

    # ------------------------------------------------ ambience beds (not reduced by the -6 dB event rule)
    add(Cue(0.0, "amb_farm", "farmyard air for the whole parable: breeze, distant sparrows, faint far-off clucks",
            _cut(lambda: (farm_bed(T.DUR, rng(101)), 0.0), T.DUR, 0.5, 0.6), -30, "bed", send=0.0))
    add(Cue(0.0, "wind_open", "opening wind gust under the hook question (0.0-2.0 s): cold open air before the first word",
            lambda: (G.whoosh(2.0, rr(), 0.12, 180, 1100, 0.8, 0.4, 0.2), 0.0), -18, "event", send=0.1))
    add(Cue(18.63, "sizzle", "group 1 cooks their chicken: frying sizzle with crackle pops, 'cook' (18.63) to 'Last dinner' (22.2)",
            _cut(lambda: (sizzle(3.62, rng(186)), 0.0), 3.62, 0.15, 0.25), -17, "bed", send=0.08))

    # ------------------------------------------------ hook + loss
    add(Cue(4.15, "cluck_hook", "one cluck on 'One chicken explains it' (4.08-4.38)",
            lambda: (cluck(rr(), 440), 0.0), -10, p=0.15, send=0.15))
    for k, tm in enumerate([8.30, 8.45, 8.60]):
        add(Cue(tm, "coin_tick", f"coin clink {k + 1}/3 on 'every coin' (8.28-8.67)",
                (lambda r=rr(): (G.clink(r, r.uniform(4800, 5600), 0.08), 0.0)), -14, p=-0.2 + 0.2 * k, send=0.1, group="coins"))
    add(Cue(10.32, "vanish", "wealth vanishes on 'Gone' (10.32-10.80): soft rising shimmer whoosh",
            lambda: (G.whoosh(0.8, rr(), 0.15, 400, 2800, 0.9, 0.3, 0.3), 0.0), -12, send=0.15))

    # ------------------------------------------------ the gift
    add(Cue(16.10, "flutter", "wing flutter as each person is handed their chicken (16.11)",
            lambda: (flutter(rr(), 0.45), 0.0), -12, p=-0.1, send=0.12))
    add(Cue(16.15, "cluck_gift", "cluck as the chicken arrives (16.11-16.53)",
            lambda: (cluck(rr(), 450), 0.0), -9, p=0.1, send=0.15))

    # ------------------------------------------------ group 1 cooks
    add(Cue(20.50, "plate_clink", "plate clink on 'Best dinner in three days' (20.46-21.33)",
            lambda: (G.clink(rr(), 3200, 0.1), 0.0), -16, p=0.25, send=0.1))

    # ------------------------------------------------ group 2 keeps theirs
    add(Cue(26.00, "cluck_g2", "contented cluck on 'they keep their chickens alive' (25.83-26.67)",
            lambda: (cluck(rr(), 420), 0.0), -11, p=-0.2, send=0.15))
    add(Cue(28.50, "egg_pop", "egg laid on 'they eat her eggs' (28.44-28.83)",
            lambda: (egg_pop(rr(), 520), 0.0), -11, p=0.2, send=0.12))
    add(Cue(29.65, "rooster", "rooster crows on 'If it's a rooster' (29.61-30.06)",
            lambda: (rooster_crow(rr(), 0.95), 0.0), -13, p=0.3, send=0.2))

    # ------------------------------------------------ group 3 pools them
    for k, tm in enumerate([37.70, 37.90, 38.10]):
        add(Cue(tm, "egg_tick", f"egg tapped down {k + 1}/3 on 'we'll give you some of the eggs' (37.65-38.61)",
                (lambda r=rr(): (egg_tick(r, r.uniform(1800, 2100)), 0.0)), -14, p=-0.25 + 0.25 * k, send=0.1, group="egg_ticks"))
    add(Cue(38.30, "egg_pop", "egg pop on 'some of the eggs' (38.22-38.61)",
            lambda: (egg_pop(rr(), 560), 0.0), -11, p=0.0, send=0.12))
    add(Cue(40.90, "egg_pop", "egg pop on 'The second group wanted eggs' (40.86-41.25)",
            lambda: (egg_pop(rr(), 540), 0.0), -12, p=-0.2, send=0.12))
    add(Cue(42.50, "cluck_g3", "cluck on 'The third group wanted chickens' (42.45-42.96)",
            lambda: (cluck(rr(), 460), 0.0), -11, p=0.2, send=0.15))

    # ------------------------------------------------ chicks hatch
    add(Cue(44.40, "eggshell", "eggshell crack as 'the first chicks hatch' (44.40-45.39)",
            lambda: (eggshell_crack(rr(), 0.25), 0.0), -14, p=0.0, send=0.1))
    for k, tm in enumerate([44.45, 44.70, 44.95, 45.20, 45.50, 45.80]):
        add(Cue(tm, "chick_peep", f"chick peep {k + 1}/6 as the chicks hatch (44.40-45.39)",
                (lambda r=rr(): (peep(r, r.uniform(3300, 3900)), 0.0)), -13, p=-0.6 + 0.24 * k, send=0.12, group="peeps"))
    add(Cue(47.70, "egg_pop", "egg pop on 'those chicks are laying eggs' (47.58-48.21)",
            lambda: (egg_pop(rr(), 580), 0.0), -12, p=0.15, send=0.12))
    add(Cue(47.95, "cluck_lay", "soft cluck as the young hens lay (47.91-48.75)",
            lambda: (cluck(rr(), 440), 0.0), -12, p=-0.15, send=0.15))

    # ------------------------------------------------ flock grows
    for k, tm in enumerate([50.80, 51.00, 51.20, 51.40, 51.60]):
        add(Cue(tm, "flock_cluck", f"flock cluck {k + 1}/5 on 'raises more and more chickens' (50.76-51.84)",
                (lambda r=rr(): (cluck(r, r.uniform(400, 480)), 0.0)), -11, p=-0.7 + 0.35 * k, send=0.15, group="flock"))

    # ------------------------------------------------ the split
    for k, (tm, f0) in enumerate([(57.10, 300), (57.40, 280)]):
        add(Cue(tm, "grumpy_cluck", f"grumpy low cluck {k + 1}/2 on 'they complain' (57.06-57.63)",
                (lambda r=rr(), f0=f0: (cluck(r, f0, drop=0.6), 0.0)), -10, p=-0.3 + 0.6 * k, send=0.12, group="grumpy"))
    add(Cue(59.40, "cluck_comfy", "contented cluck on 'has enough eggs' (59.31-59.58)",
            lambda: (cluck(rr(), 430), 0.0), -14, p=0.2, send=0.15))
    add(Cue(60.60, "cluck_comfy", "soft cluck on 'lives comfortably' (60.39-61.20)",
            lambda: (cluck(rr(), 410), 0.0), -14, p=-0.2, send=0.15))

    # ------------------------------------------------ work paid in eggs
    for k, tm in enumerate([67.90, 68.10, 68.30]):
        add(Cue(tm, "pay_tick", f"egg-payment tick {k + 1}/3 on 'work paid in eggs' (67.32-68.49)",
                (lambda r=rr(): (egg_tick(r, r.uniform(1700, 2000)), 0.0)), -13, p=-0.25 + 0.25 * k, send=0.1, group="pay_ticks"))

    # ------------------------------------------------ flock grows (cinematic v2 addition)
    add(Cue(50.40, "grain_fall", "grain pattering down as 'the third group raises more and more chickens' (50.40-51.84)",
            lambda: (grain_fall(rr(), 1.6), 0.0), -16, p=0.1, send=0.12))

    # ------------------------------------------------ the final split
    add(Cue(73.56, "bass_drop", "DEEP BASS IMPACT on the final contrast: 'has split into the poor, the middle class, and the rich' (73.56-74.96)",
            lambda: (bass_drop(rr(), 1.4), 0.0), -8, p=0.0, send=0.05))
    add(Cue(73.60, "pop_poor", "low egg pop on 'the poor' (73.56-74.07)",
            lambda: (egg_pop(rr(), 520), 0.0), -12, p=-0.3, send=0.12))
    add(Cue(74.30, "pop_middle", "mid egg pop on 'the middle class' (74.28-74.97)",
            lambda: (egg_pop(rr(), 640), 0.0), -12, p=0.0, send=0.12))
    add(Cue(75.35, "pop_rich", "high egg pop on 'the rich' (75.33-75.75)",
            lambda: (egg_pop(rr(), 780), 0.0), -12, p=0.3, send=0.12))
    return C


# ================================================================ helpers for composite cues
def _cut(gen, dur, fin, fout):
    def g():
        x, a = gen()
        return fades(x, fin, fout), a
    return g


# ================================================================ render
def render(v_ref, on_event=None):
    """v_ref = integrated loudness of the voice stem (stereo). Returns (stereo stem, cue list with measured levels).
    on_event(cue, x, t0) is called with every placed (dry) event, for analysis."""
    C = cues()
    out = np.zeros((2, N))
    send = np.zeros(N)
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        if c.cut is not None:
            k = ns(c.cut - (c.t - anchor))
            if 0 < k < x.shape[1]:
                x = fades(x[:, :k], 0.0, 0.02)
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if on_event:
            on_event(c, x, t0)
        if c.send > 0:
            G._place_mono(send, c.send * x.mean(0), t0)
    yard = make_ir(1.1, 77, pre=0.01, hf=1.6, early=[(0.09, 0.45, -0.5), (0.14, 0.3, 0.6), (0.23, 0.2, -0.2)])
    out += 0.55 * convolve_st(send, yard)
    out = hp(out, 25, 2)
    end = ns(T.DUR - 0.12)
    out[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return out, C
