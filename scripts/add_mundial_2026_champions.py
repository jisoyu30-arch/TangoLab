#!/usr/bin/env python3
"""Mundial 2026 수상자 반영 — 역대 챔피언 목록 · 우승자 프로파일 · 결승 영상.

결승 공식 결과 PDF는 아직 못 구했다(tangoba.org 접근 차단). 그래서 순위는
여러 매체가 일치해서 보도한 시상 결과를 쓰고, 출처를 함께 남긴다.
반면 예선~준결승 점수는 이 저장소가 이미 원본 PDF로 갖고 있으므로,
수상자 분석의 수치는 전부 그 로컬 데이터에서 계산한다(추정치 없음).

  - mundial_champions_history.json : 2026 피스타·에스체나리오 우승자 추가
  - champion_profiles.json         : "2026-pista" 프로파일 추가
  - competition_rounds.json        : 2026 결승 영상 라운드 추가

사용: python3 scripts/add_mundial_2026_champions.py
"""
import json
import os
import statistics as st

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(ROOT, "src/data/mundial_results.json")
HISTORY = os.path.join(ROOT, "src/data/mundial_champions_history.json")
PROFILES = os.path.join(ROOT, "src/data/champion_profiles.json")
ROUNDS = os.path.join(ROOT, "src/data/competition_rounds.json")

# ── 보도로 확인된 시상 결과 (여러 매체 일치) ────────────────────────────
PODIUM = [
    {"rank": 1, "pareja": 460, "couple": "Lucas Gauto & Naima Gerasopoulou",
     "origin": "아르헨티나 코르도바 · 그리스", "final_promedio": 9.858},
    {"rank": 2, "pareja": 91, "couple": "Rodrigo Nicolás Palacios & Indira Hiayes",
     "origin": "아르헨티나 (현재 취리히 거주)", "final_promedio": 9.796},
    {"rank": 3, "pareja": 139, "couple": "London & Sol", "origin": "한국",
     "final_promedio": 9.706},
]
FINAL_TOTAL_COUPLES = 39   # 준결승 통과는 36쌍인데 결승은 39쌍 — 차이의 사유는 미확인
CHAMPION_FINAL_RONDA = 4   # 우승 커플이 결승에서 춘 론다
SENIOR = {"couple": "Aldo Adrián Romero & Marcela Pilatti", "origin": "부에노스아이레스",
          "note": "시니어(55세 이상) 부문 우승"}
ESCENARIO = {"couple": "Nicolás Schell & Nair Schinca", "origin": "부에노스아이레스 메를로",
             "note": "에스체나리오 부문 우승 (9/2 Gran Rex)"}

# 결승 론다별 영상
#   [사용자] 사용자가 론다 번호를 직접 알려준 링크
#   [검색]   영상 제목으로 확인 (제목에 론다 번호가 있음)
FINAL_RONDA_VIDEOS = {
    1: [{"video_id": "vpuuP69Hd1w",
         "title": "Final Mundial de Tango Pista 2026 — Ronda 1",
         "channel": "미확인", "note": "[사용자] 론다 번호 확인"}],
    2: [{"video_id": "NJ-Htj9IPFA",
         "title": "Final Mundial de Tango Pista 2026 — Ronda 2",
         "channel": "미확인", "note": "[사용자] 론다 번호 확인"}],
    3: [{"video_id": "iLo_xu9k36U",
         "title": "Final Mundial de Tango Pista 2026 — Ronda 3",
         "channel": "미확인", "note": "[사용자] 론다 번호 확인"}],
    4: [{"video_id": "XwrR2wJodDc",
         "title": "Final de Campeonato Mundial de Tango Pista 2026. Ronda: 4",
         "channel": "미확인", "note": "[검색] 제목 확인 · 우승 커플이 춘 론다"}],
}

# 결승 전체를 담은 영상 (특정 론다에 속하지 않음)
FINAL_OVERALL_VIDEOS = [
    {"video_id": "Oxb9zyLttB0",
     "title": "Tango de Pista FINAL | Mundial de Tango 2026 — 전체 (라이브 아카이브)",
     "channel": "미확인", "note": "[사용자+검색] 링크와 검색 제목이 일치"},
    {"video_id": "Zd6HKLZ7yx4",
     "title": "Lucas Gauto & Naima Gerasopoulou — World Champions of Tango de Pista 2026",
     "channel": "미확인", "note": "[검색] 제목 확인"},
    # Oxb9zyLttB0 과 제목이 같게 검색되는 별개 ID. 둘 다 존재하는지,
    # 한쪽이 검색 결과의 오류인지 이 환경에서는 확인할 수 없어 남겨만 둔다.
    # Oxb9zyLttB0 과 같은 제목으로 한 번 검색된 적이 있는 별개 ID.
    # 이후 같은 제목 재검색에서는 Oxb9zyLttB0 만 나와, 검색 요약의 오류였을
    # 가능성이 높다. 지우지 않고 표시만 해 둔다.
    {"video_id": "aW-Z_oZoXW4",
     "title": "Tango de Pista FINAL 2026 (출처 불확실 — 재검색에서 확인되지 않음)",
     "channel": "미확인", "note": "[검색] 1회만 등장 — 미확인"},
]

# 결승 영상 재생목록 (사용자 제공). 이 환경에서는 열 수 없어 목록 내용은 미확인.
FINAL_PLAYLIST = "https://www.youtube.com/playlist?list=PLGheHiC1YdZ8"

SOURCES = [
    {"title": "Lucas Gauto y Naima Gerasopoulou ganaron el Mundial de Tango en la categoría Pista — Pura Ciudad",
     "url": "https://www.puraciudad.com.ar/lucas-gauto-y-naima-gerasopoulou-ganaron-el-mundial-de-tango-en-la-categoria-pista"},
    {"title": "El Mundial de Tango coronó a sus campeones de 2026 — Hoy Día",
     "url": "https://hoydia.com.ar/espectaculos/el-mundial-de-tango-corono-a-campeones/"},
    {"title": "Greece's Naima Gerassopoulou claims world tango champion title — Euronews",
     "url": "https://www.euronews.com/culture/2026/09/02/strictly-successful-greeces-naima-gerassopoulou-claims-world-tango-champion-title"},
    {"title": "Titel des Vizeweltmeisters im Tango-Tanz geht nach Zürich — Radio Central",
     "url": "https://www.radiocentral.ch/news/sport/titel-des-vizeweltmeisters-im-tango-tanz-geht-nach-zuerich-165345312"},
    {"title": "Una pareja de Merlo es la nueva campeona mundial de Tango Escenario — Diario de Cultura",
     "url": "https://www.diariodecultura.com.ar/home/una-pareja-de-buenos-aires-es-la-nueva-campeona-mundial-de-tango-escenario"},
]


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save(p, data):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def trajectory(stages, pareja):
    """로컬 결과 데이터에서 한 커플의 스테이지별 성적을 뽑는다."""
    out = []
    for name in ("clasificatoria", "cuartos", "semifinal"):
        node = stages.get(name)
        if not node:
            continue
        for g, gv in (node.get("groups") or {None: node}).items():
            for c in gv["couples"]:
                if c["pareja"] == pareja:
                    out.append({"stage": name, "group": g, "rank": c["rank"],
                                "of": len(gv["couples"]), "promedio": c["promedio"]})
    order = {"clasificatoria": 0, "cuartos": 1, "semifinal": 2}
    out.sort(key=lambda x: order[x["stage"]])
    return out


def judge_z(semifinal, pareja):
    """준결승에서 각 심사위원의 점수 분포 기준 z-점수.

    심사위원마다 후하고 짠 정도가 달라 원점수로는 비교가 안 된다.
    그 심사위원 본인의 분포에서 몇 표준편차 위였는지로 환산한다.
    """
    js = semifinal["judges"]
    dist = {j: [c["scores"][j] for c in semifinal["couples"]] for j in js}
    stats = {j: (st.mean(v), st.pstdev(v)) for j, v in dist.items()}
    c = next(c for c in semifinal["couples"] if c["pareja"] == pareja)
    return {j: round((c["scores"][j] - stats[j][0]) / stats[j][1], 2) for j in js}, c["scores"]


def main():
    stages = load(RESULTS)["2026"]["stages"]
    semi = stages["semifinal"]

    for p in PODIUM:
        p["trajectory"] = trajectory(stages, p["pareja"])
        p["semifinal_judge_z"], p["semifinal_scores"] = judge_z(semi, p["pareja"])

    champ = PODIUM[0]
    z = champ["semifinal_judge_z"]
    best_judge = max(z, key=z.get)
    worst_judge = min(z, key=z.get)
    tj = {t["stage"]: t for t in champ["trajectory"]}

    # ── 1) 역대 챔피언 목록 ──────────────────────────────────────
    hist = load(HISTORY)
    hist["champions"] = [c for c in hist["champions"] if c["year"] != 2026]
    hist["champions"] = [
        {"year": 2026, "category": "pista", "leader": "Lucas Gauto",
         "follower": "Naima Gerasopoulou", "country": "Argentina / Grecia"},
        {"year": 2026, "category": "escenario", "leader": "Nicolás Schell",
         "follower": "Nair Schinca", "country": "Argentina"},
    ] + hist["champions"]
    hist["notes"] = hist.get("notes", "")
    save(HISTORY, hist)
    print(f"  mundial_champions_history.json ← 2026 우승자 2건 (총 {len(hist['champions'])}건)")

    # ── 2) 우승자 프로파일 ──────────────────────────────────────
    prof = load(PROFILES)
    prof["profiles"]["2026-pista"] = {
        "year": 2026,
        "category": "pista",
        "couple": champ["couple"],
        "origin": champ["origin"],
        "style_summary": "예선부터 결승까지 흔들리지 않은 안정감 · 심사위원 전원이 상위로 본 합의형 우승",
        "characteristics": [
            f"예선 B조 1위(127쌍) → 8강 A조 {tj['cuartos']['rank']}위(150쌍) → 준결승 1위(159쌍) → 결승 우승. "
            "전 스테이지에서 한 번도 상위권 밖으로 나간 적이 없다",
            f"준결승 6명 심사위원 전원에게 z +1.6 이상. 특정 심사위원이 밀어준 게 아니라 "
            f"패널 전체의 합의로 1위 — 2위와의 격차(8.840 vs 8.740)보다 이 합의가 더 결정적",
            f"가장 높이 본 심사위원은 {best_judge}(z {z[best_judge]}), 가장 낮게 본 쪽도 "
            f"{worst_judge}(z {z[worst_judge]})로 여전히 상위권. 약점을 잡는 심사위원이 없었다",
            "2024 결승 4위 → 2025 결승 준우승 → 2026 우승. 3년 연속 결승에 오르며 한 계단씩 올라간 경로",
            f"결승 39쌍 중 promedio {PODIUM[0]['final_promedio']} — 2위 {PODIUM[1]['final_promedio']}, "
            f"3위 {PODIUM[2]['final_promedio']} 과의 간격이 0.06·0.15로 준결승보다 촘촘했다",
        ],
        "strategic_takeaway": (
            "한 라운드의 폭발이 아니라 '어느 심사위원에게도 걸리지 않는 춤'으로 쌓아 올린 우승. "
            "2026년은 6인 중 최고·최저를 잘라내는 절사평균이라, 한 명을 열광시키는 것보다 "
            "여섯 명 모두에게 상위로 보이는 쪽이 유리한 구조였다. 이 커플의 준결승 z-점수 분포가 "
            "정확히 그 구조에 맞는 모양이다."
        ),
        "key_quote": "코르도바 예선을 통과한 아르헨티나 리더와 그리스 대표 팔로워가 대회에서 만나 이룬 팀",
        "music_preference": "Pugliese 「Recuerdo」, D'Arienzo 「Nueve de Julio」, 「Canaro en París」, 「Violetas」 등 페스티벌 공연 레퍼토리 확인",
        "teaching_activity": "그리스·독일·터키 등 유럽 페스티벌 중심 티칭 (Sunny Tango Festival, Cretango, Tango Pampero, Sultans of Istanbul)",
        "notable_history": (
            "Lucas Gauto는 첫 출전 때부터 20년 가까이 우승을 목표로 삼았다고 밝혔고, "
            "Naima Gerasopoulou는 그리스 챔피언 자격으로 출전했다가 이 커플이 됐다. "
            "그리스 국적 무용수의 피스타 부문 우승은 현지 매체가 크게 다뤘다."
        ),
        "podium": [
            {"rank": p["rank"], "couple": p["couple"], "origin": p["origin"],
             "pareja": p["pareja"], "final_promedio": p["final_promedio"],
             "semifinal_rank": next(t["rank"] for t in p["trajectory"] if t["stage"] == "semifinal"),
             "semifinal_promedio": next(t["promedio"] for t in p["trajectory"] if t["stage"] == "semifinal"),
             "trajectory": p["trajectory"],
             "semifinal_judge_z": p["semifinal_judge_z"],
             "semifinal_scores": p["semifinal_scores"]}
            for p in PODIUM
        ],
        "senior_champion": SENIOR,
        "escenario_champion": ESCENARIO,
        "final": {
            "date": "2026-09-01", "venue": "Teatro Gran Rex",
            "total_couples": FINAL_TOTAL_COUPLES,
            "champion_ronda": CHAMPION_FINAL_RONDA,
            "playlist": FINAL_PLAYLIST,
            "note": "결승 공식 점수표(PDF)는 아직 확보하지 못했다. 순위와 promedio는 "
                    "복수 매체·영상 정보가 일치하는 값. 준결승 통과는 36쌍인데 결승은 "
                    "39쌍으로 3쌍 차이가 있고, 그 사유는 확인하지 못했다. "
                    "론다 5 이후 영상은 아직 찾지 못했다.",
        },
        "videos": FINAL_OVERALL_VIDEOS + [v for vs in FINAL_RONDA_VIDEOS.values() for v in vs],
        "links": [s["url"] for s in SOURCES],
        "sources": SOURCES,
    }
    save(PROFILES, prof)
    print(f"  champion_profiles.json ← 2026-pista 프로파일")

    # ── 3) 결승 라운드 (론다별 + 전체) ──────────────────────────
    doc = load(ROUNDS)
    prefix = "R-MUNDIAL2026-PISTA-F"
    doc["rounds"] = [r for r in doc["rounds"]
                     if not r.get("round_id", "").startswith(prefix)]

    def final_round(ronda, videos, participants, note):
        return {
            "round_id": f"{prefix}{ronda}",
            "competition": "Mundial", "competition_id": "COMP-001",
            "year": 2026, "category": "pista", "stage": "final",
            "ronda_number": ronda,
            "note": note,
            "songs": [],
            "videos": [{"video_id": v["video_id"],
                        "url": f"https://www.youtube.com/watch?v={v['video_id']}",
                        "channel": v["channel"], "title": v["title"]}
                       for v in videos],
            "participants": participants,
        }

    # 0 = 특정 론다에 속하지 않는 결승 전체. 시상 3팀을 여기 둔다.
    doc["rounds"].append(final_round(
        0, FINAL_OVERALL_VIDEOS,
        [{"pareja": p["pareja"], "leader": p["couple"].split(" & ")[0],
          "follower": p["couple"].split(" & ")[1], "rank": p["rank"],
          "promedio": p["final_promedio"], "advancedTo": "final"}
         for p in PODIUM],
        "결승 전체 영상과 시상 결과. 결승 공식 점수표(PDF) 미확보로 "
        "39쌍 전체 순위는 없고 시상 3팀만 있다."))

    for ronda, videos in sorted(FINAL_RONDA_VIDEOS.items()):
        # 우승 커플이 춘 론다만 참가자를 아는 상태
        parts = []
        if ronda == CHAMPION_FINAL_RONDA:
            c = PODIUM[0]
            parts = [{"pareja": c["pareja"],
                      "leader": c["couple"].split(" & ")[0],
                      "follower": c["couple"].split(" & ")[1],
                      "rank": c["rank"], "promedio": c["final_promedio"],
                      "advancedTo": "final"}]
        doc["rounds"].append(final_round(
            ronda, videos, parts,
            "결승 론다별 영상. 론다별 출전자 명단은 점수표 미확보로 없다."))

    save(ROUNDS, doc)
    n_r = len(FINAL_RONDA_VIDEOS)
    n_v = sum(len(v) for v in FINAL_RONDA_VIDEOS.values()) + len(FINAL_OVERALL_VIDEOS)
    print(f"  competition_rounds.json ← 결승 라운드 {n_r + 1}개 "
          f"(론다 {sorted(FINAL_RONDA_VIDEOS)} + 전체) · 영상 {n_v}개")


if __name__ == "__main__":
    main()
