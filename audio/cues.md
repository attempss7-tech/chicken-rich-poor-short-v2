# One Chicken Explains It - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav`, gain only (no EQ, no compression, no pitch).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 3,647,232 samples = 75.984 s |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain with the master limiter applied (they sum to the final mix) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-14.5 LUFS**, true peak **-1.2 dBTP**, LRA 2.5 LU, max momentary -9.8 LUFS, max short-term -12.8 LUFS
- Stems: voice -14.6 LUFS, music -24.9 LUFS, sfx -37.0 LUFS (voice gain +6.64 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -1.2 dBTP): max gain reduction 4.61 dB, active (>0.1 dB) on 5.90 % of samples, >0.5 dB on 1.96 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -14.5 LUFS
    Threshold: -24.8 LUFS
  Loudness range:
    LRA:         2.5 LU
    Threshold: -34.8 LUFS
    LRA low:   -16.0 LUFS
    LRA high:  -13.5 LUFS
  True peak:
    Peak:       -1.2 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| hook | 0.00-5.00 | -14.7 | -24.7 | -39.4 | -24.6 | 9.8 | 9.6 | 6.8 |
| loss | 5.00-13.90 | -15.0 | -28.1 | -39.6 | -27.8 | 12.7 | 12.5 | 7.9 |
| gift | 13.90-17.00 | -15.1 | -25.6 | -35.5 | -25.2 | 10.1 | 10.0 | 5.1 |
| group1 | 17.00-23.60 | -14.9 | -25.1 | -31.5 | -24.6 | 9.6 | 9.1 | 6.1 |
| group2 | 23.60-31.80 | -14.9 | -25.3 | -38.6 | -25.1 | 10.2 | 9.9 | 5.4 |
| group3 | 31.80-43.40 | -14.5 | -24.4 | -38.3 | -24.2 | 9.7 | 9.7 | 5.4 |
| hatch | 43.40-52.40 | -14.4 | -24.4 | -30.9 | -23.9 | 9.5 | 9.8 | 4.3 |
| split | 52.40-61.80 | -14.4 | -25.5 | -38.3 | -25.3 | 10.9 | 11.5 | 5.3 |
| hire | 61.80-69.00 | -13.8 | -23.8 | -39.4 | -23.7 | 9.9 | 9.9 | 5.9 |
| payoff | 69.00-75.98 | -14.5 | -23.9 | -36.3 | -23.7 | 9.2 | 9.7 | 6.6 |

## Music map (original gentle pastoral score, C major, 100 bpm: quarter note = 0.6 s)
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): hook -10.0, loss -13.0, gift -10.5, group1 -10.0, group2 -10.5, group3 -10.0, hatch -10.0, split -11.0, hire -10.0, payoff -9.5. Applied section gains (dB): hook -10.3, loss -9.2, gift -10.9, group1 -9.3, group2 -8.2, group3 -10.5, hatch -7.4, split -11.2, hire -9.6, payoff -11.7.

Rides (music only, dB): 10.32-10.90 s -3.0, 22.20-23.20 s -3.0, 57.00-57.70 s -2.0, 75.20-75.80 s -2.0 - so quiet sentence-final words ('Gone.', 'Last dinner, too.', 'they complain', 'rich') stay on top and the bed blooms again in the gaps after them.

| time s | frame | music |
|---|---|---|
| 0.00 | 0 | hook: theme bars 1-2, plucked melody + warm pad (C - F) |
| 5.00 | 120 | loss: sparse Am/Em pads, low plucked notes (wealth taken away, 'Gone' on 10.45) |
| 13.80 | 331 | gift: theme bars 1-2 return soft on vibes (each person gets one chicken) |
| 17.00 | 408 | group 1: playful plucked bars 3-4 (cooking the chicken), rueful low tail on 'Last dinner, too' |
| 23.60 | 566 | group 2: calm - theme bars 5-8 on soft fife (hens kept for eggs, roosters for breeding) |
| 31.80 | 763 | group 3: glock lead, theme bars 1-4 (pooling hens and roosters) |
| 41.00 | 984 | call-and-response plucks: 'wanted eggs' (E-G) vs 'wanted chickens' (C-E-G) |
| 43.40 | 1042 | hatch: music-box theme bars 5-8, glock sparkles (chicks hatch, flock grows) |
| 52.40 | 1258 | split (complaint): low Am/Em pads, sparse plucks (group 1 has nothing left) |
| 58.20 | 1397 | split (comfortable): warm vibes bars 1-2 (group 2 has enough eggs) |
| 61.80 | 1483 | hire: busy warm bars 3-5, pluck + fife (work paid in eggs) |
| 69.00 | 1656 | payoff: full theme bars 1-2 (pluck + fife + glock) |
| 73.80 | 1771 | final C chord + music-box arpeggio C-E-G-C on 'poor / middle class / rich' |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -14.5 LUFS integrated). Farmyard sounds get a light yard reverb send.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.000 | 0.0 | amb_farm (bed, integrated) | farmyard air for the whole parable: breeze, distant sparrows, faint far-off clucks | -30 | -30.0 | -44.5 | +0.00 |
| 2 | 0.000 | 0.0 | wind_open | opening wind gust under the hook question (0.0-2.0 s): cold open air before the first word | -18 | -24.0 | -38.5 | +0.00 |
| 3 | 4.150 | 99.6 | cluck_hook | one cluck on 'One chicken explains it' (4.08-4.38) | -10 | -16.0 | -30.5 | +0.15 |
| 4 | 8.300 | 199.2 | coin_tick | coin clink 1/3 on 'every coin' (8.28-8.67) | -14 | -20.0 | -34.5 | -0.20 |
| 5 | 8.450 | 202.8 | coin_tick | coin clink 2/3 on 'every coin' (8.28-8.67) | -14 | -20.0 | -34.5 | +0.00 |
| 6 | 8.600 | 206.4 | coin_tick | coin clink 3/3 on 'every coin' (8.28-8.67) | -14 | -20.0 | -34.5 | +0.20 |
| 7 | 10.320 | 247.7 | vanish | wealth vanishes on 'Gone' (10.32-10.80): soft rising shimmer whoosh | -12 | -18.0 | -32.5 | +0.00 |
| 8 | 16.100 | 386.4 | flutter | wing flutter as each person is handed their chicken (16.11) | -12 | -18.0 | -32.5 | -0.10 |
| 9 | 16.150 | 387.6 | cluck_gift | cluck as the chicken arrives (16.11-16.53) | -9 | -15.0 | -29.5 | +0.10 |
| 10 | 18.630 | 447.1 | sizzle (bed, integrated) | group 1 cooks their chicken: frying sizzle with crackle pops, 'cook' (18.63) to 'Last dinner' (22.2) | -17 | -17.0 | -31.5 | +0.00 |
| 11 | 20.500 | 492.0 | plate_clink | plate clink on 'Best dinner in three days' (20.46-21.33) | -16 | -22.0 | -36.5 | +0.25 |
| 12 | 26.000 | 624.0 | cluck_g2 | contented cluck on 'they keep their chickens alive' (25.83-26.67) | -11 | -17.0 | -31.5 | -0.20 |
| 13 | 28.500 | 684.0 | egg_pop | egg laid on 'they eat her eggs' (28.44-28.83) | -11 | -17.0 | -31.5 | +0.20 |
| 14 | 29.650 | 711.6 | rooster | rooster crows on 'If it's a rooster' (29.61-30.06) | -13 | -19.0 | -33.5 | +0.30 |
| 15 | 37.700 | 904.8 | egg_tick | egg tapped down 1/3 on 'we'll give you some of the eggs' (37.65-38.61) | -14 | -20.0 | -34.5 | -0.25 |
| 16 | 37.900 | 909.6 | egg_tick | egg tapped down 2/3 on 'we'll give you some of the eggs' (37.65-38.61) | -14 | -20.0 | -34.5 | +0.00 |
| 17 | 38.100 | 914.4 | egg_tick | egg tapped down 3/3 on 'we'll give you some of the eggs' (37.65-38.61) | -14 | -20.0 | -34.5 | +0.25 |
| 18 | 38.300 | 919.2 | egg_pop | egg pop on 'some of the eggs' (38.22-38.61) | -11 | -17.0 | -31.5 | +0.00 |
| 19 | 40.900 | 981.6 | egg_pop | egg pop on 'The second group wanted eggs' (40.86-41.25) | -12 | -18.0 | -32.5 | -0.20 |
| 20 | 42.500 | 1020.0 | cluck_g3 | cluck on 'The third group wanted chickens' (42.45-42.96) | -11 | -17.0 | -31.5 | +0.20 |
| 21 | 44.400 | 1065.6 | eggshell | eggshell crack as 'the first chicks hatch' (44.40-45.39) | -14 | -20.0 | -34.5 | +0.00 |
| 22 | 44.450 | 1066.8 | chick_peep | chick peep 1/6 as the chicks hatch (44.40-45.39) | -13 | -19.0 | -33.5 | -0.60 |
| 23 | 44.700 | 1072.8 | chick_peep | chick peep 2/6 as the chicks hatch (44.40-45.39) | -13 | -19.0 | -33.5 | -0.36 |
| 24 | 44.950 | 1078.8 | chick_peep | chick peep 3/6 as the chicks hatch (44.40-45.39) | -13 | -19.0 | -33.5 | -0.12 |
| 25 | 45.200 | 1084.8 | chick_peep | chick peep 4/6 as the chicks hatch (44.40-45.39) | -13 | -19.0 | -33.5 | +0.12 |
| 26 | 45.500 | 1092.0 | chick_peep | chick peep 5/6 as the chicks hatch (44.40-45.39) | -13 | -19.0 | -33.5 | +0.36 |
| 27 | 45.800 | 1099.2 | chick_peep | chick peep 6/6 as the chicks hatch (44.40-45.39) | -13 | -19.0 | -33.5 | +0.60 |
| 28 | 47.700 | 1144.8 | egg_pop | egg pop on 'those chicks are laying eggs' (47.58-48.21) | -12 | -18.0 | -32.5 | +0.15 |
| 29 | 47.950 | 1150.8 | cluck_lay | soft cluck as the young hens lay (47.91-48.75) | -12 | -18.0 | -32.5 | -0.15 |
| 30 | 50.400 | 1209.6 | grain_fall | grain pattering down as 'the third group raises more and more chickens' (50.40-51.84) | -16 | -22.0 | -36.5 | +0.10 |
| 31 | 50.800 | 1219.2 | flock_cluck | flock cluck 1/5 on 'raises more and more chickens' (50.76-51.84) | -11 | -17.0 | -31.5 | -0.70 |
| 32 | 51.000 | 1224.0 | flock_cluck | flock cluck 2/5 on 'raises more and more chickens' (50.76-51.84) | -11 | -17.0 | -31.5 | -0.35 |
| 33 | 51.200 | 1228.8 | flock_cluck | flock cluck 3/5 on 'raises more and more chickens' (50.76-51.84) | -11 | -17.0 | -31.5 | +0.00 |
| 34 | 51.400 | 1233.6 | flock_cluck | flock cluck 4/5 on 'raises more and more chickens' (50.76-51.84) | -11 | -17.0 | -31.5 | +0.35 |
| 35 | 51.600 | 1238.4 | flock_cluck | flock cluck 5/5 on 'raises more and more chickens' (50.76-51.84) | -11 | -17.0 | -31.5 | +0.70 |
| 36 | 57.100 | 1370.4 | grumpy_cluck | grumpy low cluck 1/2 on 'they complain' (57.06-57.63) | -10 | -16.0 | -30.5 | -0.30 |
| 37 | 57.400 | 1377.6 | grumpy_cluck | grumpy low cluck 2/2 on 'they complain' (57.06-57.63) | -10 | -16.0 | -30.5 | +0.30 |
| 38 | 59.400 | 1425.6 | cluck_comfy | contented cluck on 'has enough eggs' (59.31-59.58) | -14 | -20.0 | -34.5 | +0.20 |
| 39 | 60.600 | 1454.4 | cluck_comfy | soft cluck on 'lives comfortably' (60.39-61.20) | -14 | -20.0 | -34.5 | -0.20 |
| 40 | 67.900 | 1629.6 | pay_tick | egg-payment tick 1/3 on 'work paid in eggs' (67.32-68.49) | -13 | -19.0 | -33.5 | -0.25 |
| 41 | 68.100 | 1634.4 | pay_tick | egg-payment tick 2/3 on 'work paid in eggs' (67.32-68.49) | -13 | -19.0 | -33.5 | +0.00 |
| 42 | 68.300 | 1639.2 | pay_tick | egg-payment tick 3/3 on 'work paid in eggs' (67.32-68.49) | -13 | -19.0 | -33.5 | +0.25 |
| 43 | 73.560 | 1765.4 | bass_drop | DEEP BASS IMPACT on the final contrast: 'has split into the poor, the middle class, and the rich' (73.56-74.96) | -8 | -14.0 | -28.5 | +0.00 |
| 44 | 73.600 | 1766.4 | pop_poor | low egg pop on 'the poor' (73.56-74.07) | -12 | -18.0 | -32.5 | -0.30 |
| 45 | 74.300 | 1783.2 | pop_middle | mid egg pop on 'the middle class' (74.28-74.97) | -12 | -18.0 | -32.5 | +0.00 |
| 46 | 75.350 | 1808.4 | pop_rich | high egg pop on 'the rich' (75.33-75.75) | -12 | -18.0 | -32.5 | +0.30 |
