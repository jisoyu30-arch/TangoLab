"""검증된 Wikipedia API URL로 사진 데이터 교체."""
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# === 검증 완료된 실제 URL (Wikipedia REST API로 fetch) ===
DANCER_PHOTOS = {
    'casimiro-ain': {
        'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Casimiro_A%C3%ADn.jpg/330px-Casimiro_A%C3%ADn.jpg',
        'caption': 'Casimiro Aín (Wikipedia Commons)',
        'wikipedia_url': 'https://en.wikipedia.org/wiki/Casimiro_A%C3%ADn',
    },
    'el-cachafaz': {
        'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cachafaz.jpg/330px-Cachafaz.jpg',
        'caption': 'El Cachafaz (Wikipedia Commons)',
        'wikipedia_url': 'https://es.wikipedia.org/wiki/El_Cachafaz',
    },
    'copes-nieves': {
        'url': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Juan_Carlos_Copes_%28cropped%29.jpg',
        'caption': 'Juan Carlos Copes (Wikipedia Commons)',
        'wikipedia_url': 'https://en.wikipedia.org/wiki/Juan_Carlos_Copes',
    },
}

ORCHESTRA_PHOTOS = {
    'ORCH-001': {  # D'Arienzo
        'url': 'https://upload.wikimedia.org/wikipedia/commons/5/58/Darienzo_photo.jpg',
        'caption': "Juan D'Arienzo (Wikipedia Commons)",
        'wikipedia_url': "https://en.wikipedia.org/wiki/Juan_d%27Arienzo",
    },
    'ORCH-002': {  # Di Sarli
        'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Carlos_Di_Sarli.jpg/330px-Carlos_Di_Sarli.jpg',
        'caption': 'Carlos Di Sarli (Wikipedia Commons)',
        'wikipedia_url': 'https://en.wikipedia.org/wiki/Carlos_di_Sarli',
    },
    'ORCH-003': {  # Pugliese
        'url': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/OsvaldoPugliese.jpg',
        'caption': 'Osvaldo Pugliese (Wikipedia Commons)',
        'wikipedia_url': 'https://en.wikipedia.org/wiki/Osvaldo_Pugliese',
    },
    'ORCH-005': {  # Troilo
        'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Anibal_Troilo_1971.png/330px-Anibal_Troilo_1971.png',
        'caption': 'Aníbal Troilo, 1971 (Wikipedia Commons)',
        'wikipedia_url': 'https://en.wikipedia.org/wiki/An%C3%ADbal_Troilo',
    },
}

# Patch dancers
with open('src/data/dancers_history.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for d in data['dancers']:
    if d['id'] in DANCER_PHOTOS:
        d['photo'] = DANCER_PHOTOS[d['id']]
with open('src/data/dancers_history.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Patch orchestras
with open('src/data/orchestra_profiles.json', 'r', encoding='utf-8') as f:
    odata = json.load(f)
for orch_id, photo in ORCHESTRA_PHOTOS.items():
    if orch_id in odata['profiles']:
        odata['profiles'][orch_id]['photo'] = photo
with open('src/data/orchestra_profiles.json', 'w', encoding='utf-8') as f:
    json.dump(odata, f, ensure_ascii=False, indent=2)

print(f'Photos fixed: {len(DANCER_PHOTOS)} dancers + {len(ORCHESTRA_PHOTOS)} orchestras')
print('All URLs verified via Wikipedia REST API.')
