#!/usr/bin/env python3
"""2025 Mundial 8강 B조에서 빠져 있던 커플 2쌍을 채운다.

parse_tangoba_results.py 의 자체 검증에서 드러난 구멍이다. 공식 PDF에는
138쌍이 있는데 저장 데이터에는 136쌍뿐이고, 파레하 467·739 가 없다.
빠진 두 쌍의 promedio 는 그룹 중위권이라(39위·51위) 그 아래 순위가
한두 칸씩 밀려 있었다 — 순위도 함께 다시 매긴다.

  src/data/mundial_results.json     8강 B조 커플 목록·순위·total_couples
  src/data/competition_rounds.json  8강 B조 론다(16~30)의 참가자

안전장치: 바꾸기 전에 기존 136쌍의 점수가 PDF와 같은지, 그리고 이 스크립트가
계산한 advancedTo 가 기존 값을 그대로 재현하는지 확인한다. 하나라도 어긋나면
아무것도 쓰지 않고 멈춘다.

사용: python3 scripts/fix_mundial_2025_cuartos_b.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_tangoba_results import parse_pdf  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "data-sources/tangoba/Jurados-_-Pista-Cuartos-2025-27_8-B-resultados.pdf")
RESULTS = os.path.join(ROOT, "src/data/mundial_results.json")
ROUNDS = os.path.join(ROOT, "src/data/competition_rounds.json")

STAGE_ORDER = ["clasificatoria", "cuartos", "semifinal", "final"]
APP_STAGE = {"clasificatoria": "qualifying", "cuartos": "cuartos",
             "semifinal": "semifinal", "final": "final"}
GROUP_B_RONDAS = range(16, 31)        # 8강 B조가 쓰는 론다 번호


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save(p, data):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def furthest_stage_map(stages):
    """2025 각 파레하가 도달한 가장 먼 스테이지."""
    reached = {}
    for i, name in enumerate(STAGE_ORDER):
        node = stages.get(name)
        if not node:
            continue
        buckets = []
        if "couples" in node:
            buckets.append(node["couples"])
        for g, gv in (node.get("groups") or {}).items():
            buckets.append(gv["couples"])
        # 시니어 결승은 별도 트랙이라 일반 부문 진출 체인에 넣지 않는다
        # (기존 데이터의 advancedTo 도 그렇게 돼 있다).
        if isinstance(node.get("general"), dict) and "couples" in node["general"]:
            buckets.append(node["general"]["couples"])
        for couples in buckets:
            for c in couples:
                if reached.get(c["pareja"], (-1,))[0] < i:
                    reached[c["pareja"]] = (i, name)
    return {p: APP_STAGE[n] for p, (_, n) in reached.items()}


def main():
    table = parse_pdf(PDF, expected_judges=5)
    results = load(RESULTS)
    node = results["2025"]["stages"]["cuartos"]["groups"]["B"]
    stored = {c["pareja"]: c for c in node["couples"]}
    parsed = {c["pareja"]: c for c in table["couples"]}

    missing = sorted(set(parsed) - set(stored))
    if not missing:
        print("  빠진 커플이 없습니다 — 이미 반영된 듯합니다.")
        return
    extra = sorted(set(stored) - set(parsed))
    if extra:
        sys.exit(f"저장 데이터에만 있는 파레하 {extra} — PDF와 어긋나므로 중단")
    for p, c in stored.items():
        if sorted(c["scores"].values()) != sorted(parsed[p]["scores"].values()):
            sys.exit(f"파레하 {p} 점수가 PDF와 다릅니다 — 중단")

    # advancedTo 계산이 기존 값을 재현하는지 먼저 확인
    advanced = furthest_stage_map(results["2025"]["stages"])
    rounds_doc = load(ROUNDS)
    b_rounds = [r for r in rounds_doc["rounds"]
                if r.get("year") == 2025 and r.get("competition") == "Mundial"
                and r.get("stage") == "quarterfinal"
                and r.get("ronda_number") in GROUP_B_RONDAS]
    mismatch = [(r["ronda_number"], p["pareja"], p["advancedTo"], advanced.get(p["pareja"]))
                for r in b_rounds for p in r["participants"]
                if advanced.get(p["pareja"]) != p["advancedTo"]]
    if mismatch:
        sys.exit(f"advancedTo 재현 실패 {len(mismatch)}건 (예: {mismatch[:3]}) — 중단")

    # ── 8강 B조 전체를 PDF 기준으로 다시 매긴다 ──────────────────
    couples = sorted(parsed.values(), key=lambda c: -c["promedio"])
    before_rank = {p: c["rank"] for p, c in stored.items()}
    node["couples"] = []
    for rank, c in enumerate(couples, 1):
        c = dict(c)
        c["rank"] = rank
        c.pop("ronda_group", None)
        # 심사위원 이름은 저장본을 유지한다 (헤더가 접힌 PDF라 파서가 확정 못 함)
        c["scores"] = dict(zip(node["judges"], [c["scores"][k] for k in table["judges"]]))
        node["couples"].append({k: c[k] for k in
                                ("pareja", "leader", "follower", "scores", "promedio", "rank", "ronda")
                                if k in c})
    node["total_couples"] = len(couples)
    save(RESULTS, results)

    shifted = sum(1 for c in node["couples"]
                  if c["pareja"] in before_rank and before_rank[c["pareja"]] != c["rank"])
    print(f"  mundial_results.json ← 8강 B조 {len(couples)}쌍 (추가 {missing}) · 순위 변동 {shifted}쌍")

    # ── 해당 론다 참가자 갱신 ───────────────────────────────────
    by_ronda = {}
    for c in node["couples"]:
        by_ronda.setdefault(c["ronda"], []).append(c)
    touched = 0
    for r in b_rounds:
        in_ronda = sorted(by_ronda.get(r["ronda_number"], []), key=lambda c: c["rank"])
        if not in_ronda:
            continue
        r["participants"] = [
            {"pareja": c["pareja"], "leader": c["leader"], "follower": c["follower"],
             "rank": c["rank"], "promedio": c["promedio"],
             "advancedTo": advanced.get(c["pareja"], "cuartos")}
            for c in in_ronda
        ]
        touched += 1
    save(ROUNDS, rounds_doc)
    print(f"  competition_rounds.json ← 8강 B조 론다 {touched}개 참가자 갱신")


if __name__ == "__main__":
    main()
