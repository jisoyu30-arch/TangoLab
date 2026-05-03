"""5개 악단 프로파일 추가 + Tanturi ID 정정 (ORCH-008 -> ORCH-004)."""
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('src/data/orchestra_profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Tanturi 키 수정
if 'ORCH-008' in data['profiles'] and data['profiles']['ORCH-008'].get('short_name') == 'Tanturi':
    tanturi = data['profiles'].pop('ORCH-008')
    tanturi['orchestra_id'] = 'ORCH-004'
    data['profiles']['ORCH-004'] = tanturi
    print('Fixed Tanturi: ORCH-008 -> ORCH-004')

new_profiles = {
    'ORCH-006': {
        'orchestra_id': 'ORCH-006',
        'short_name': 'Laurenz',
        'nickname': None,
        'lifespan': '1902-10-10 ~ 1972-07-07',
        'active_era': '1934-1965',
        'founded': '1934',
        'summary': 'De Caro 학파의 정통 계승자. 반도네온 거장이자 작곡가. 우아하고 서정적이지만 박력 있는 사운드. Mundial 결승에 자주 등장하는 Al Verla Pasar, Abandono 등 대표곡.',
        'history_periods': [
            {'label': 'De Caro 시대 (1925-1934)', 'body': 'Julio De Caro 6중주에 합류. 그의 음악적 정체성의 토대 형성.'},
            {'label': '오케스트라 결성 (1934-1945)', 'body': '자신의 오케스트라 결성. Juan Carlos Casas, Hector Farrel 등의 보컬과 함께 황금기 사운드 구축.'},
            {'label': '후기 (1946-1965)', 'body': 'Alberto Podesta, Carlos Bermudez 등과 활동. 점차 콘서트 사운드로 진화.'},
        ],
        'musical_style': 'De Caro 계열의 정교하고 시적인 사운드. 반도네온 솔로의 표현력 + 우아한 현악기 어레인지. Pugliese에 영향을 미친 후기 De Caro 학파 핵심 인물.',
        'vocalists': [
            {'name': 'Juan Carlos Casas', 'phases': '1934-1937', 'note': '초기 시그니처 보컬.'},
            {'name': 'Hector Farrel', 'phases': '1937-1945', 'note': '낭만적 음색.'},
            {'name': 'Alberto Podesta', 'phases': '1944-1948', 'note': 'Calo에서 옮겨와 Laurenz와도 작업.'},
            {'name': 'Carlos Bermudez', 'phases': '1947-1955'},
        ],
        'episodes': [
            'De Caro 학파의 마지막 거장 중 한 명. Pugliese는 자주 Laurenz를 음악적 스승으로 언급.',
            '오케스트라가 작아도 사운드는 풍부. 적은 인원으로 큰 표현 만들어내는 편곡 거장.',
        ],
        'competition_relevance': 'Mundial 결승에 자주 등장. Al Verla Pasar (1944) 같은 곡은 댄서들의 음악성을 평가하기 좋은 균형 잡힌 사운드.',
        'sources': [
            {'label': 'Wikipedia EN - Pedro Laurenz', 'url': 'https://en.wikipedia.org/wiki/Pedro_Laurenz'},
            {'label': 'Tangology 101 - Pedro Laurenz', 'url': 'https://tangology101.com/main.cfm?id=64'},
            {'label': 'Todotango - Pedro Laurenz biography', 'url': 'https://www.todotango.com/english/artists/biography/166/Pedro-Laurenz/'},
        ],
    },
    'ORCH-008': {
        'orchestra_id': 'ORCH-008',
        'short_name': "D'Agostino",
        'nickname': 'El Mago del Bandoneon (반도네온의 마법사)',
        'lifespan': '1900-05-25 ~ 1991-01-16',
        'active_era': '1933-1980s',
        'founded': '1933 (보컬 Angel Vargas와 본격 활동 시작)',
        'summary': 'Angel Vargas와의 듀오로 두 천사(Los Angeles) 신화를 만든 인물. 단순하지만 깊이 있는 사운드. Tres Esquinas 같은 도시 노스탤지어 곡들로 한 시대를 정의. 댄서들의 favorite — 부드러운 카미나타에 최적.',
        'history_periods': [
            {'label': '초기 (1925-1932)', 'body': '여러 그룹과 활동. 1925년 Augusto Berto와 시작.'},
            {'label': 'Los Angeles 시대 (1933-1946)', 'body': 'Angel Vargas 합류. 두 천사 별명. 1944년 Tres Esquinas 발표 — 부에노스아이레스 도시 노스탤지어의 송가.'},
            {'label': '후기 (1947-1980s)', 'body': 'Vargas 독립 후에도 활동 지속. Tango es Tango 같은 곡 발표.'},
        ],
        'musical_style': '단순하고 분명한 비트 + 매우 댄서블한 카미나타. Vargas의 풍부한 음색과 완벽한 매치. 도시 노스탤지어와 우정의 정서를 음악적으로 형상화.',
        'vocalists': [
            {'name': 'Angel Vargas', 'phases': '1933-1946', 'note': '두 천사 듀오의 한 축. Tres Esquinas, Adios Arrabal 등 시대를 정의.'},
            {'name': 'Tino Garcia', 'phases': '1946-1950'},
            {'name': 'Ricardo Ruiz', 'phases': '1950s'},
        ],
        'key_collaborator': "Angel Vargas — 단순한 보컬리스트가 아닌 D'Agostino 사운드의 절반. 두 사람의 이름 모두 'Angel'(천사)이라 'Los Angeles' 별명.",
        'episodes': [
            '1944년 Tres Esquinas 발표 — 부에노스아이레스의 세 거리 모퉁이를 노래한 곡. 도시 노스탤지어 탱고의 정점.',
            'Vargas와의 콜라보는 황금기 가장 사랑받은 듀오 중 하나. 두 사람의 결별 후에도 댄서들은 Vargas-DAgostino 시기를 계속 사랑.',
        ],
        'competition_relevance': '결승보다 부드러운 살롱 분위기에서 자주 등장. Me Llaman Tango, Tres Esquinas 같은 곡은 따뜻한 카미나타 평가에 적합.',
        'sources': [
            {'label': "Wikipedia EN - Angel D'Agostino", 'url': 'https://en.wikipedia.org/wiki/%C3%81ngel_D%27Agostino'},
            {'label': "Tangology 101 - Angel D'Agostino", 'url': 'https://tangology101.com/main.cfm?id=66'},
            {'label': "Todotango - D'Agostino biography", 'url': 'https://www.todotango.com/english/artists/biography/110/Angel-DAgostino/'},
        ],
    },
    'ORCH-009': {
        'orchestra_id': 'ORCH-009',
        'short_name': 'Biagi',
        'nickname': 'Manos Brujas (마법의 손)',
        'lifespan': '1906-03-14 ~ 1969-09-24',
        'active_era': '1930-1969',
        'founded': "1938 (D'Arienzo 떠난 후 자신의 오케스트라)",
        'summary': "D'Arienzo 사운드의 공동 설계자. 1935-38년 D'Arienzo 오케스트라 피아니스트로 황금기를 열었고, 독립 후엔 자신만의 더 날카로운 신코페이션·당김음 사운드 구축. 마법의 손이라 불릴 만큼 비범한 피아노 테크닉.",
        'history_periods': [
            {'label': "D'Arienzo 시대 (1935-1938)", 'body': "D'Arienzo 오케스트라 피아니스트로 합류. 그와 함께 마르카토 + sub-pulse 사운드를 설계. D'Arienzo Revolution의 공동 주역."},
            {'label': '독립 (1938-1969)', 'body': "자신의 오케스트라 결성. D'Arienzo보다 더 날카로운 신코페이션, 더 많은 당김음. 명확하고 분리된 비트가 시그니처."},
        ],
        'musical_style': '강한 마르카토 + 잦은 신코페이션. 피아노가 리듬의 중심. 짧고 정확한 비트들이 분리되어 댄서가 한 박자도 놓치지 않게 하는 음악. 피아노로 추는 탱고라 불림.',
        'vocalists': [
            {'name': 'Andres Falgas', 'phases': '1938-1944', 'note': 'Pura Clase 같은 시그니처 곡.'},
            {'name': 'Jorge Ortiz', 'phases': '1944-1953'},
            {'name': 'Hugo Duval', 'phases': '1950-1965'},
        ],
        'key_collaborator': "Juan D'Arienzo (1935-1938) — Biagi의 피아노가 D'Arienzo의 결정적 차별점. D'Arienzo는 평생 Biagi 만한 피아니스트는 다시 없었다고 회고.",
        'episodes': [
            '별명 Manos Brujas (마법의 손)는 그의 빠르고 정교한 피아노 테크닉에서 유래.',
            "D'Arienzo와 결별 후에도 두 사운드는 닮음 — 둘 다 마르카토 기반. 그러나 Biagi는 더 날카롭고 더 많은 신코페이션.",
        ],
        'competition_relevance': 'Mundial보다 사회적 밀롱가에서 자주. 그러나 결승에 종종 등장 — Pura Clase, El Yaguaron 같은 곡은 댄서의 비트 정확도를 시험.',
        'sources': [
            {'label': 'Wikipedia EN - Rodolfo Biagi', 'url': 'https://en.wikipedia.org/wiki/Rodolfo_Biagi'},
            {'label': 'Tangology 101 - Rodolfo Biagi', 'url': 'https://tangology101.com/main.cfm?id=67'},
            {'label': 'Todotango - Biagi biography', 'url': 'https://www.todotango.com/english/artists/biography/76/Rodolfo-Biagi/'},
        ],
    },
    'ORCH-010': {
        'orchestra_id': 'ORCH-010',
        'short_name': 'Canaro',
        'nickname': 'Pirincho',
        'lifespan': '1888-11-26 ~ 1964-12-14',
        'active_era': '1906-1962',
        'founded': '1916 (그의 첫 오케스트라)',
        'summary': '60년 가까이 활동한 황금기 이전·이후 모두를 관통한 살아있는 전설. Guardia Vieja부터 황금기 진입까지 사실상 탱고 산업의 토대를 만든 인물. 우루과이 출신. Pirincho 별명. 1924년 카시미로 아인의 바티칸 공연에 사용된 Ave Maria 작곡.',
        'history_periods': [
            {'label': 'Guardia Vieja 후기 (1906-1925)', 'body': '서커스에서 첫 음악 활동. 1916년 자신의 첫 오케스트라. 1920년대 가장 인기 있는 탱고 음악가.'},
            {'label': 'Sexteto + 오케스트라 확장 (1926-1940)', 'body': 'Roberto Maida, Charlo 같은 보컬과 작업. 1928년 Corazon de Oro 발표.'},
            {'label': '황금기 (1940-1955)', 'body': 'Quinteto Pirincho 결성. 가벼운 댄스 사운드. Poema 같은 곡 인기.'},
            {'label': '후기 (1956-1962)', 'body': '활동 지속. 1964년 사망까지 음악계의 최고 권위자.'},
        ],
        'musical_style': 'Easy listening 댄스 음악의 정수. 단순하고 멜로디 중심. 매우 댄서블 — 초보자도 쉽게 박자를 잡을 수 있음. 황금기 댄서들에게는 reliable 하지만 깊이는 다른 빅4 대비 약하다는 평.',
        'vocalists': [
            {'name': 'Roberto Maida', 'phases': '1935-1939', 'note': '시그니처 황금기 보컬.'},
            {'name': 'Charlo', 'phases': '1928-1936'},
            {'name': 'Ernesto Fama', 'phases': '1930-1953'},
            {'name': 'Francisco Amor', 'phases': '1939-1942'},
        ],
        'episodes': [
            '1924년 카시미로 아인이 교황 비오 11세 앞에서 춤춘 Ave Maria가 Canaro 형제 작곡.',
            'SADAIC(아르헨티나 음악 저작권 협회) 창립자 중 한 명. 음악 산업 토대 구축.',
            '60년 가까이 활동 — 황금기 시작 전부터 끝까지 한 시대를 통과한 유일한 오케스트라.',
        ],
        'competition_relevance': 'Mundial 결승에 종종 등장. 발스 Corazon de Oro, Desde el Alma 같은 곡은 댄서의 매끄러운 워킹과 라인을 평가하기 좋음.',
        'sources': [
            {'label': 'Wikipedia EN - Francisco Canaro', 'url': 'https://en.wikipedia.org/wiki/Francisco_Canaro'},
            {'label': 'Tangology 101 - Francisco Canaro', 'url': 'https://tangology101.com/main.cfm?id=68'},
            {'label': 'Todotango - Canaro biography', 'url': 'https://www.todotango.com/english/artists/biography/56/Francisco-Canaro/'},
        ],
    },
    'ORCH-011': {
        'orchestra_id': 'ORCH-011',
        'short_name': 'Fresedo',
        'nickname': 'El Pibe de la Paternal (파테르날 동네 소년)',
        'lifespan': '1897-05-05 ~ 1984-11-18',
        'active_era': '1918-1980',
        'founded': '1918 (자신의 sextet)',
        'summary': '달콤하고 로맨틱한 Pink Champagne 사운드의 창시자. 부에노스아이레스 북부 귀족층에서 열광적 지지. 1927년 동시에 4개 오케스트라 운영할 정도로 인기. 1934년 RCA Victor 시기부터 하프·비브라폰 등 교향악적 악기 도입.',
        'history_periods': [
            {'label': '초기 (1918-1927)', 'body': '자신의 sextet 결성. Carlos Gardel 같은 가수와 작업.'},
            {'label': '4개 오케스트라 운영 (1927)', 'body': '쏟아지는 수요로 4개 그룹 동시 운영. 부에노스아이레스 음악계 권력의 정점.'},
            {'label': 'RCA Victor 황금기 (1934-1939)', 'body': 'A440 조율 통일. 하프·비브라폰 도입. Pink Champagne 사운드 완성.'},
            {'label': '후기 (1940-1980)', 'body': 'Roberto Ray, Ricardo Ruiz 등 보컬과 활동. Carlos di Sarli의 스승 역할.'},
        ],
        'musical_style': "달콤하고 로맨틱 — Pink Champagne(핑크 샴페인) 사운드. 다른 악단과 달리 하프·비브라폰까지 사용해 매우 풍부한 음색. 부에노스아이레스 북부 귀족층 취향.",
        'vocalists': [
            {'name': 'Roberto Ray', 'phases': '1933-1939', 'note': 'Pink Champagne 시기 시그니처 보컬.'},
            {'name': 'Ricardo Ruiz', 'phases': '1939-1944'},
            {'name': 'Oscar Serpa', 'phases': '1947-1953'},
            {'name': 'Hector Pacheco', 'phases': '1954-1980'},
        ],
        'episodes': [
            'Carlos Di Sarli가 1926년 Fresedo 오케스트라에서 피아노를 치며 음악 수학. 후일 Di Sarli는 Milonguero Viejo (1955)를 Fresedo에게 헌정.',
            '1927년 4개 오케스트라 동시 운영 — 부에노스아이레스 모든 큰 무대를 장악한 시기.',
            'A440 조율 통일을 가장 먼저 도입. RCA Victor 시기 녹음의 음질이 동시대 다른 악단보다 한 단계 위.',
        ],
        'competition_relevance': '달콤한 사운드는 Mundial 결승보다 살롱 무도회에서 더 자주. 그러나 Tigre Viejo (1934) 같은 곡은 결승에 등장.',
        'sources': [
            {'label': 'Wikipedia EN - Osvaldo Fresedo', 'url': 'https://en.wikipedia.org/wiki/Osvaldo_Fresedo'},
            {'label': 'Tangology 101 - Osvaldo Fresedo', 'url': 'https://tangology101.com/main.cfm?id=69'},
            {'label': 'El Recodo - Osvaldo Fresedo', 'url': 'https://www.el-recodo.com/osvaldofresedo-en.php'},
            {'label': 'Fresedo.de - All recordings 1933-1939', 'url': 'http://fresedo.de'},
        ],
    },
}

data['profiles'].update(new_profiles)
data['version'] = '2026-05-04-v3'
data['_note'] = "악단 심층 프로파일 — 영문/스페인어권 출처 인용. 11개 악단 (Big4 + Calo + Tanturi + Laurenz + D'Agostino + Biagi + Canaro + Fresedo)."

with open('src/data/orchestra_profiles.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Total profiles: {len(data['profiles'])}")
for k, v in sorted(data['profiles'].items()):
    print(f"  {k}: {v['short_name']}")
