"""quiz_songs.json에 인기 100곡 pending_entries 추가."""
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('src/data/songs.json', 'r', encoding='utf-8') as f:
    songs = json.load(f)
with open('src/data/quiz_songs.json', 'r', encoding='utf-8') as f:
    quiz = json.load(f)


def short_name(orch):
    if not orch:
        return ''
    o = orch.lower()
    if 'arienzo' in o:
        return "D'Arienzo"
    if 'di sarli' in o:
        return 'Di Sarli'
    if 'pugliese' in o:
        return 'Pugliese'
    if 'troilo' in o:
        return 'Troilo'
    if 'caló' in o or 'calo' in o:
        return 'Caló'
    if 'tanturi' in o:
        return 'Tanturi'
    if 'laurenz' in o:
        return 'Laurenz'
    if "d'agostino" in o:
        return "D'Agostino"
    if 'biagi' in o:
        return 'Biagi'
    if 'fresedo' in o:
        return 'Fresedo'
    if 'demare' in o:
        return 'Demare'
    if 'gobbi' in o:
        return 'Gobbi'
    if 'canaro' in o:
        return 'Canaro'
    if 'angelis' in o:
        return 'De Angelis'
    if 'firpo' in o:
        return 'Firpo'
    return orch.split()[0]


existing_titles = {e['song_title'].lower() for e in quiz['entries']}
top = sorted(
    [s for s in songs if s.get('competition_popularity_score')],
    key=lambda x: -x['competition_popularity_score']
)

new_entries = []
added = set(existing_titles)
for s in top:
    if len(new_entries) >= 100:
        break
    title = s['title']
    if title.lower() in added:
        continue
    if not s.get('orchestra'):
        continue
    orch_short = short_name(s['orchestra'])
    if not orch_short:
        continue

    safe_title = title.replace(' ', '+')
    safe_orch = orch_short.replace("'", '')
    yt_search = (
        f'https://www.youtube.com/results?search_query={safe_title}+{safe_orch}'
    )
    tt_search = (
        f'https://www.todotango.com/musica/tema-buscar/?busqueda={safe_title}'
    )

    year = None
    rd = s.get('recording_date')
    if rd and rd[0].isdigit():
        try:
            year = int(rd.split('-')[0])
        except Exception:
            pass

    entry = {
        'song_title': title,
        'orchestra': s['orchestra'],
        'orchestra_short': orch_short,
        'vocalist': s.get('vocalist') or 'instrumental',
        'year': year,
        'genre': s.get('genre', 'tango'),
        'composer': s.get('composer'),
        'lyricist': s.get('lyricist'),
        'info_ko': s.get('dance_notes', ''),
        'mood_tags': s.get('mood_tags', []),
        'tempo': s.get('tempo'),
        'popularity': s.get('competition_popularity_score'),
        'lyrics_search_url': tt_search,
        'youtube_search_url': yt_search,
        'needs_video': True,
    }
    entry = {k: v for k, v in entry.items() if v not in (None, '', [])}
    new_entries.append(entry)
    added.add(title.lower())

quiz['_pending_entries_note'] = (
    'pending_entries는 YouTube 단곡 영상 ID 미확보 곡. video_id 추가 후 entries로 승격 가능. '
    '곡 메타데이터는 songs.json에서 자동 추출.'
)
quiz['pending_entries'] = new_entries

with open('src/data/quiz_songs.json', 'w', encoding='utf-8') as f:
    json.dump(quiz, f, ensure_ascii=False, indent=2)

print(f'Added {len(new_entries)} pending entries')
print(
    f'Total: {len(quiz["entries"])} verified + '
    f'{len(new_entries)} pending = '
    f'{len(quiz["entries"]) + len(new_entries)} songs'
)
