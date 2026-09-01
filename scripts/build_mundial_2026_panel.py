#!/usr/bin/env python3
"""Mundial 2026 준결승 — 심사위원 성향 분석 + 스포트라이트 커플 데이터 생성.

src/data/mundial_results.json 을 읽어 통계를 계산하고,
아래 CURATED 블록(공개 출처 기반 배경/발언)과 합쳐
src/data/mundial_2026_panel.json 을 만든다.

통계는 전부 2026 준결승 원본 점수(159쌍 × 6인)에서 계산 — 손으로 적은 숫자 없음.
사용: python3 scripts/build_mundial_2026_panel.py
"""
import json
import os
import statistics as st

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(ROOT, "src/data/mundial_results.json")
OUT = os.path.join(ROOT, "src/data/mundial_2026_panel.json")

# ── 큐레이션: 공개 출처로 확인된 배경·발언만 기록 ──────────────────────
# verified_by "local" = 이 저장소의 mundial_results/champions 데이터로 교차 확인
CURATED = {
    "Leandro Oliver": {
        "aka": [],
        "country": "Argentina",
        "credentials": [
            "Mundial de Tango 공식 심사위원 · 해외 예선 심사위원 (파트너 Laila Rezk와 함께)",
        ],
        "lineage": "파트너 Laila Rezk. 두 사람 모두 공식 대회 심사위원으로 활동.",
        "local_crosslinks": [
            "Laila Rezk는 2025 Mundial 예선(클라시피카토리아 B·D) 심사위원 — 같은 심사위원 풀",
        ],
        "sources": [
            {"title": "Leandro Oliver & Laila Rezk — Argentine Tango USA Championship",
             "url": "https://tangousachampionship.com/leandro-oliver-laila-rezk/"},
        ],
    },
    "Cynthia Palacios": {
        "aka": [],
        "country": "Argentina",
        "credentials": [
            "2022 Mundial de Tango 피스타 부문 우승 (파트너 Sebastián Bolivar)",
        ],
        "lineage": "Sebastián Bolivar와 2022년 세계챔피언. 현재 국제 페스티벌 티칭·심사.",
        "local_crosslinks": [
            "본인의 우승 기록이 앱의 mundial_champions_history(2022 pista)에 있음",
            "파트너 Sebastián Bolivar는 2025 Mundial 예선(B·D) 심사위원",
        ],
        "sources": [
            {"title": "World tango dance tournament — Wikipedia",
             "url": "https://en.wikipedia.org/wiki/World_tango_dance_tournament"},
        ],
    },
    "Fabián Peralta": {
        "aka": [],
        "country": "Argentina",
        "credentials": [
            "2006 Mundial de Tango 피스타 부문 우승 (파트너 Natacha Poberaj)",
            "홍콩·런던·서울 등 Mundial 해외 예선 심사위원",
        ],
        "lineage": "Natacha Poberaj, Virginia Pandolfi를 거쳐 현재 Josefina Bermúdez Avila와 활동.",
        "local_crosslinks": [
            "본인의 우승 기록이 앱의 mundial_champions_history(2006 pista)에 있음",
        ],
        "documented": [
            {
                "text": "음악이 언제나 가장 중요했다 — 각 악기는 그 자체로 하나의 우주이고, 몸의 서로 다른 부분에 말을 거는 다른 신호를 준다",
                "context": "Fabián Peralta · Virginia Pandolfi 인터뷰 「'Bailar bien', un universo en perfecta armonía」",
                "source": {"title": "Soy Milonguera 인터뷰",
                           "url": "https://soymilonguera.com/bailar-bien-un-universo-en-perfecta-armonia-entrevista-a-fabian-peralta-y-virginia-pandolfi/"},
                "note": "원문 접근이 막혀 검색 색인 요약을 통해 확인한 취지 요약. 정확한 원문 인용이 필요하면 원 기사 확인 권장.",
            },
        ],
        "sources": [
            {"title": "Fabián Peralta y Josefina Bermúdez — Cullera Tango Festival",
             "url": "https://festival.presentango.com/en/fabian-peralta-and-josefina-bermudez"},
        ],
    },
    "Cristina Sosa": {
        "aka": [],
        "country": "Argentina",
        "credentials": [
            "2008 Mundial de Tango 피스타(살롱) 부문 우승 (파트너 Daniel Nacucchio)",
            "2008년 메트로폴리타노 살롱·밀롱가 2개 부문 우승",
            "2025 Mundial 결승 심사위원",
        ],
        "lineage": "Daniel Nacucchio와 2007년 결성. 한 해에 주요 대회 4관왕을 달성한 첫 커플로 알려짐. 현재 Escuela de Tango de Buenos Aires 운영.",
        "local_crosslinks": [
            "2025 Mundial 결승 심사위원단에 포함 — 앱의 Judges 페이지에 결승 채점 통계가 이미 있음",
            "본인의 우승 기록이 앱의 mundial_champions_history(2008 pista)에 있음",
        ],
        "sources": [
            {"title": "About Daniel Nacucchio & Cristina Sosa — Escuela de Tango de Buenos Aires",
             "url": "https://escuelatangoba.com/buenosaires/about-escuela-tango/about-daniel-nacucchio-cristina-sosa/?lang=en"},
        ],
    },
    "Andrés Laza Moreno": {
        "aka": [],
        "country": "Argentina",
        "credentials": [
            "ACETA(Academia de Estilos de Tango Argentino, 「Ballet Escuela」) 출신",
            "2004년 마에스트로 Carlos Gavito의 수업 어시스턴트",
            "2002년 「Hugo del Carril」 갈라 주역",
        ],
        "lineage": "14세에 시작 · Ballet Zaraza Tango → ACETA → Carlos Gavito 어시스턴트. "
                   "Luciana Arregui(2013~), Eladia Córdoba, Samantha Dispari와 활동. "
                   "6인 중 유일하게 Mundial 우승 이력이 아닌 '전통 스타일·계보' 계열 심사위원.",
        "local_crosslinks": [],
        "sources": [
            {"title": "Andres Laza Moreno & Luciana Arregui — Tangueros.eu",
             "url": "https://www.tangueros.eu/andres-laza-moreno--luciana-arregui.html"},
        ],
    },
    "Inés Bogado": {
        "aka": ["María Inés Bogado", "Maria Ines Bogado"],
        "country": "Argentina",
        "credentials": [
            "2010 Mundial de Tango 피스타(살롱) 부문 우승 (파트너 Sebastián Ariel Jiménez)",
            "2025 Mundial 예선(클라시피카토리아 A·C) 심사위원",
        ],
        "lineage": "「마에스트로들의 마에스트로」로 불리는 Carlos Pérez, 그리고 Rosa Forte에게 사사.",
        "local_crosslinks": [
            "2025 Mundial 예선 A·C 심사위원 'Maria Ines Bogado'와 동일 인물 (표기만 다름)",
            "본인의 우승 기록이 앱의 mundial_champions_history(2010 pista)에 있음",
        ],
        "sources": [
            {"title": "World champions of 2010 — Sebastian Jiménez & Maria Ines Bogado (Endre Tango)",
             "url": "https://endretango.com/en/world-champions-of-2010-sebastian-jimenez-maria-ines-bogado/"},
            {"title": "Maria Ines Bogado — Official", "url": "https://mariainesbogado.com/"},
        ],
    },
}

OFFICIAL_CRITERIA = {
    "summary": "규정상 심사는 음악성(musicalidad), 커플의 연결(conexión), 걸음의 우아함(elegancia en el andar)을 "
               "주로 보고, 여기에 플로어 순환(circulación)과 이동, 그리고 아브라소를 함께 본다. "
               "아브라소는 곡이 흐르는 동안 끊어질 수 없고, 한 사람이 상대의 품에 '담겨' 있어야 한다(탄력적 의미).",
    "source": {"title": "Campeonato Mundial de Baile de Tango — Wikipedia (es)",
               "url": "https://es.wikipedia.org/wiki/Campeonato_Mundial_de_Baile_de_Tango"},
}

COUPLE_SOURCES = [
    {"title": "Naima Gerasopoulou and Lucas Gauto — 030tango",
     "url": "https://030tango.com/couple/naima-gerasopoulou-and-lucas-gauto/"},
    {"title": "Mundial de Tango 2025 폐막 기사 — La Nación",
     "url": "https://www.lanacion.com.ar/espectaculos/musica/bailarines-encapuchados-erratas-de-ganadores-y-una-noche-de-fiesta-en-el-cierre-de-mundial-de-tango-nid03092025/"},
    {"title": "Tango de Pista 2019 결승 결과 — Buenos Aires Ciudad",
     "url": "https://buenosaires.gob.ar/noticias/tango-ba-2019-el-titulo-mundial-en-tango-de-pista-fue-para-una-pareja-de"},
]

SPOTLIGHT_KEYS = ("gauto", "gerasopoulou")


# ── 통계 ────────────────────────────────────────────────────────────
def spearman(a, b):
    def rank(xs):
        order = sorted(range(len(xs)), key=lambda i: -xs[i])
        r = [0] * len(xs)
        for pos, i in enumerate(order):
            r[i] = pos + 1
        return r
    ra, rb = rank(a), rank(b)
    ma, mb = st.mean(ra), st.mean(rb)
    num = sum((ra[i] - ma) * (rb[i] - mb) for i in range(len(a)))
    den = (sum((x - ma) ** 2 for x in ra) * sum((x - mb) ** 2 for x in rb)) ** 0.5
    return num / den if den else 0.0


def couples_of(year, stage, data):
    s = data[year]["stages"][stage]
    if "couples" in s:
        return s["couples"]
    return s.get("general", {}).get("couples", [])


def all_stage_panels(stages):
    """(스테이지라벨, 심사위원, 커플목록) — 예선 그룹까지 전부 펼친다."""
    out = []
    for name in ("clasificatoria", "cuartos", "semifinal", "final"):
        node = stages.get(name)
        if not node:
            continue
        if "couples" in node:
            out.append((name, None, node["judges"], node["couples"]))
        for g, gv in (node.get("groups") or {}).items():
            out.append((name, g, gv["judges"], gv["couples"]))
    return out


def judge_stage_stats(judges, couples):
    """한 패널의 심사위원별 성향 지표."""
    n = len(couples)
    promedio = [c["promedio"] for c in couples]
    panel = [st.mean(c["scores"].values()) for c in couples]
    stats = {}
    for j in judges:
        v = [c["scores"][j] for c in couples]
        dev = [v[i] - panel[i] for i in range(n)]
        stats[j] = {
            "n": n,
            "mean": round(st.mean(v), 3),
            "sd": round(st.pstdev(v), 3),
            "min": min(v), "max": max(v),
            "bias_vs_panel": round(st.mean(dev), 3),
            "mean_abs_dev": round(st.mean(abs(d) for d in dev), 3),
            "dropped_as_high_rate": round(
                sum(1 for c in couples if c["scores"][j] == max(c["scores"].values())) / n, 3),
            "dropped_as_low_rate": round(
                sum(1 for c in couples if c["scores"][j] == min(c["scores"].values())) / n, 3),
            "spearman_vs_result": round(spearman(v, promedio), 3),
        }
    return stats


def cross_stage_consistency(stages):
    """같은 심사위원이 두 스테이지에서 같은 커플을 본 경우의 일관성.

    스테이지가 바뀌면 커플의 춤 자체가 달라지므로 상관이 낮다고 곧바로
    '일관성 없음'은 아니다. 그래서 같은 커플 집합에서 '패널 결과(promedio)'가
    두 스테이지 사이에 얼마나 움직였는지를 기준선으로 함께 낸다.
    기준선보다 높으면 판정이 대회 흐름보다 안정적이었다는 뜻.
    """
    panels = all_stage_panels(stages)
    by_judge = {}
    for stage, group, judges, couples in panels:
        for j in judges:
            by_judge.setdefault(j, []).append((stage, group, couples))

    order = {"clasificatoria": 0, "cuartos": 1, "semifinal": 2, "final": 3}
    out = []
    for j, entries in by_judge.items():
        entries.sort(key=lambda e: order[e[0]])
        for a in range(len(entries)):
            for b in range(a + 1, len(entries)):
                sa, ga, ca = entries[a]
                sb, gb, cb = entries[b]
                if order[sa] == order[sb]:
                    continue                      # 같은 단계의 다른 조는 커플이 겹치지 않는다
                ma = {c["pareja"]: c for c in ca}
                mb = {c["pareja"]: c for c in cb}
                shared = sorted(set(ma) & set(mb))
                if len(shared) < 15:
                    continue
                ja = [ma[p]["scores"][j] for p in shared]
                jb = [mb[p]["scores"][j] for p in shared]
                pa = [ma[p]["promedio"] for p in shared]
                pb = [mb[p]["promedio"] for p in shared]
                own = spearman(ja, jb)
                base = spearman(pa, pb)
                out.append({
                    "judge": j,
                    "from": sa + (f"/{ga}" if ga else ""),
                    "to": sb + (f"/{gb}" if gb else ""),
                    "shared_couples": len(shared),
                    "own_consistency": round(own, 3),
                    "panel_baseline": round(base, 3),
                    "vs_baseline": round(own - base, 3),
                    "mean_from": round(st.mean(ja), 3),
                    "mean_to": round(st.mean(jb), 3),
                })
    out.sort(key=lambda r: -r["vs_baseline"])
    return out


def main():
    data = json.load(open(RESULTS, encoding="utf-8"))
    semi = data["2026"]["stages"]["semifinal"]
    judges = semi["judges"]
    couples = semi["couples"]
    n = len(couples)

    cols = {j: [c["scores"][j] for c in couples] for j in judges}
    panel = [st.mean(c["scores"].values()) for c in couples]
    promedio = [c["promedio"] for c in couples]
    advancing = {c["pareja"] for c in couples if c["advanced"]}

    judge_out = []
    for j in judges:
        v = cols[j]
        dev = [v[i] - panel[i] for i in range(n)]
        drop_hi = sum(1 for c in couples if c["scores"][j] == max(c["scores"].values()))
        drop_lo = sum(1 for c in couples if c["scores"][j] == min(c["scores"].values()))
        own_top = {couples[i]["pareja"]
                   for i in sorted(range(n), key=lambda i: -v[i])[:len(advancing)]}
        judge_out.append({
            "name": j,
            **CURATED[j],
            "stats": {
                "mean": round(st.mean(v), 3),
                "median": round(st.median(v), 3),
                "sd": round(st.pstdev(v), 3),
                "min": min(v),
                "max": max(v),
                "span": round(max(v) - min(v), 2),
                "bias_vs_panel": round(st.mean(dev), 3),
                "mean_abs_dev": round(st.mean(abs(d) for d in dev), 3),
                "dropped_as_high_rate": round(drop_hi / n, 3),
                "dropped_as_low_rate": round(drop_lo / n, 3),
                "spearman_vs_result": round(spearman(v, promedio), 3),
                "top36_overlap": len(own_top & advancing),
                "distinct_values": len(set(v)),
            },
        })

    matrix = [[1.0 if a == b else round(spearman(cols[a], cols[b]), 2) for b in judges]
              for a in judges]

    # 2026 전 스테이지 패널 구성과 심사위원별 지표
    stages = data["2026"]["stages"]
    panels = []
    judge_index = {}
    for stage, group, js, couples in all_stage_panels(stages):
        label = stage + (f"/{group}" if group else "")
        stats = judge_stage_stats(js, couples)
        panels.append({
            "stage": stage, "group": group, "label": label,
            "date": (stages[stage].get("groups", {}).get(group) or stages[stage]).get("date"),
            "judges": js, "total_couples": len(couples),
            "judge_stats": stats,
        })
        for j in js:
            judge_index.setdefault(j, []).append({"panel": label, **stats[j]})
    consistency = cross_stage_consistency(stages)

    # 2025 결승 진출자 중 2026 준결승 재출전 커플
    def key(c):
        return (c["leader"].split()[-1].lower() if c["leader"] else "",
                c["follower"].split()[-1].lower() if c["follower"] else "")

    f2025 = {key(c): c for c in couples_of("2025", "final", data)}
    returning = []
    for c in couples:
        k = key(c)
        if k in f2025:
            returning.append({
                "pareja_2026": c["pareja"],
                "couple": f"{c['leader']} & {c['follower']}",
                "final_2025_rank": f2025[k]["rank"],
                "final_2025_promedio": f2025[k]["promedio"],
                "semifinal_2026_rank": c["rank"],
                "semifinal_2026_promedio": c["promedio"],
                "advanced": c["advanced"],
            })
    returning.sort(key=lambda r: r["semifinal_2026_rank"])

    # 스포트라이트 커플 — 연도별 궤적을 로컬 데이터에서 자동 수집
    trajectory = []
    for year in sorted(data.keys()):
        for stage, node in data[year]["stages"].items():
            buckets = []
            if "couples" in node:
                buckets.append((stage, node["couples"], node.get("total_couples")))
            for b in ("general", "senior"):
                if isinstance(node.get(b), dict) and "couples" in node[b]:
                    buckets.append((f"{stage}/{b}", node[b]["couples"], node[b].get("total_couples")))
            for g, gv in (node.get("groups") or {}).items():
                buckets.append((f"{stage}/{g}", gv["couples"], gv.get("total_couples")))
            for label, cs, total in buckets:
                for c in cs:
                    name = f"{c.get('leader', '')} {c.get('follower', '')}".lower()
                    if all(k in name for k in SPOTLIGHT_KEYS):
                        trajectory.append({
                            "year": int(year), "stage": label, "pareja": c.get("pareja"),
                            "rank": c.get("rank"), "promedio": c.get("promedio"),
                            "total_couples": total,
                            "listed_as": f"{c.get('leader')} & {c.get('follower')}",
                        })
    stage_order = {"clasificatoria": 0, "cuartos": 1, "semifinal": 2, "final": 3}
    trajectory.sort(key=lambda t: (t["year"], stage_order.get(t["stage"].split("/")[0], 9)))

    top = couples[0]
    out = {
        "generated_by": "scripts/build_mundial_2026_panel.py",
        "note": "통계는 2026 준결승 원본 점수(159쌍 × 심사위원 6인)에서 계산. "
                "배경·발언은 공개 출처 확인분만 기록했고, 각 항목에 출처 링크를 붙였다.",
        "competition": {
            "name": "Mundial de Tango Buenos Aires 2026",
            "category": "Tango Pista",
            "semifinal": {"date": semi["date"], "venue": semi["venue"],
                          "total_couples": semi["total_couples"],
                          "advancing": semi["advancing"],
                          "cutoff_promedio": semi["cutoff_promedio"]},
            "final": {"status": "pending", "date": "2026-09-01",
                      "venue": "Teatro Gran Rex", "time": "19:00",
                      "note": "준결승 통과 36쌍이 겨루는 결승. 아직 치러지지 않음."},
        },
        "scoring_rule": {
            "judges": len(judges),
            "rule": "6인 점수 중 최고·최저 1개씩 제외한 4개의 평균",
            "verified": f"{n}쌍 전부에서 공식 promedio와 일치 확인",
            "implication": "심사위원 1인의 극단적 점수는 자동으로 잘려나간다. "
                           "누가 얼마나 자주 잘리는지가 곧 그 심사위원의 영향력 지표.",
        },
        "official_criteria": OFFICIAL_CRITERIA,
        "judges": judge_out,
        "agreement_matrix": {"judges": judges, "spearman": matrix},
        "stage_panels": panels,
        "judge_index": [
            {"name": j, "panels": [e["panel"] for e in entries], "by_panel": entries}
            for j, entries in sorted(judge_index.items(),
                                     key=lambda kv: (-len(kv[1]), kv[0]))
        ],
        "cross_stage_consistency": consistency,
        "returning_2025_finalists": returning,
        "spotlight": {
            "couple": f"{top['leader']} & {top['follower']}",
            "leader": top["leader"],
            "follower": top["follower"],
            "pareja_2026": top["pareja"],
            "origin": "Lucas Gauto — 아르헨티나 · Naima Gerasopoulou — 그리스",
            "full_names_seen": "Lucas Daniel Gauto · Dimitra Naima Gerasopoulou (2025 예선 등록명)",
            "semifinal_2026": {"rank": top["rank"], "promedio": top["promedio"],
                               "ronda": top["ronda"], "scores": top["scores"]},
            "trajectory": trajectory,
            "festival_activity": [
                "Sunny Tango Festival 2018 (크레타, 그리스)",
                "Cretango Festival 2019 (이라클리오, 그리스)",
                "Tango Pampero 2022 (카를스루에, 독일)",
                "Sultans of Istanbul Tango Marathon 2025 (이스탄불)",
            ],
            "repertoire_seen": ["Pugliese — Recuerdo", "D'Arienzo — Nueve de Julio",
                                "Canaro en París", "Violetas"],
            "sources": COUPLE_SOURCES,
        },
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"  {os.path.relpath(OUT, ROOT)} 생성")
    print(f"  준결승 심사위원 {len(judge_out)}명 · 2025 결승 진출자 재출전 {len(returning)}쌍 "
          f"· 스포트라이트 궤적 {len(trajectory)}건")
    print(f"  전 스테이지 패널 {len(panels)}개 · 심사위원 {len(judge_index)}명 "
          f"· 스테이지 간 일관성 {len(consistency)}건")


if __name__ == "__main__":
    main()
