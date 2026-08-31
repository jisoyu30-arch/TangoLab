#!/usr/bin/env python3
"""Mundial 2026 결과 PDF 한 개를 스테이지 단위로 인제스트 (예선/8강/준결승/결승 공통).

tangoba.org 공식 PDF -> mundial_results.json + competition_rounds.json.
파싱은 parse_tangoba_results.py 가 담당(좌표 기반, 심사위원 수 자동 인식).

    python3 scripts/add_mundial_2026_stage.py --pdf <경로> --stage semifinal \\
        --date 2026-08-29 [--group A] [--advancing 36] [--venue "Usina del Arte"] \\
        [--judges "이름1,이름2,..."] [--dry-run]

스테이지를 새로 넣을 때마다 2026 전체 라운드의 advancedTo(진출 추적)를 다시 계산한다.
예선 -> 8강 -> 준결승 -> 결승 체인은 파레하 번호로 잇는다 (같은 해 안에서는 고유).

주의: 헤더가 두 줄로 접힌 PDF는 심사위원 이름이 컬럼과 어긋나게 찍히는 경우가 있다.
      그럴 땐 경고가 뜨니 --judges 로 명단을 직접 넘길 것.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_tangoba_results import parse_pdf, check_promedio  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(ROOT, "src/data/mundial_results.json")
ROUNDS = os.path.join(ROOT, "src/data/competition_rounds.json")
YEAR = "2026"

# 스테이지 진행 순서 + 라운드 ID 접두사 + rounds.stage 값
STAGES = {
    "clasificatoria": {"order": 0, "prefix": "Q", "round_stage": "qualifying", "next": "cuartos"},
    "cuartos": {"order": 1, "prefix": "QF", "round_stage": "quarterfinal", "next": "semifinal"},
    "semifinal": {"order": 2, "prefix": "SF", "round_stage": "semifinal", "next": "final"},
    "final": {"order": 3, "prefix": "F", "round_stage": "final", "next": None},
}
# advancedTo 에 쓰는 앱 쪽 이름
APP_STAGE = {"clasificatoria": "qualifying", "cuartos": "cuartos",
             "semifinal": "semifinal", "final": "final"}


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def stage_couples(node):
    """스테이지 노드에서 (그룹라벨, 커플목록) 목록을 뽑는다."""
    out = []
    if "couples" in node:
        out.append((None, node["couples"]))
    for g, gv in (node.get("groups") or {}).items():
        out.append((g, gv["couples"]))
    for b in ("general", "senior"):
        if isinstance(node.get(b), dict) and "couples" in node[b]:
            out.append((b, node[b]["couples"]))
    return out


def rebuild_advancement(results, rounds):
    """2026 전 스테이지를 파레하로 이어 advancedTo 를 다시 계산.

    가장 멀리 간 스테이지가 기준이고, 그 스테이지에서 컷을 통과했으면
    (아직 치러지지 않았더라도) 다음 스테이지로 '진출'로 본다.
    """
    stages = results[YEAR]["stages"]
    reached = {}   # pareja -> (order, stage_name, made_cut)
    for name, node in stages.items():
        meta = STAGES.get(name)
        if not meta:
            continue
        for _, couples in stage_couples(node):
            for c in couples:
                made = bool(c.get("advanced"))
                prev = reached.get(c["pareja"])
                if prev is None or meta["order"] > prev[0]:
                    reached[c["pareja"]] = (meta["order"], name, made)

    label = {}
    for pareja, (_, name, made) in reached.items():
        nxt = STAGES[name]["next"]
        label[pareja] = APP_STAGE[nxt] if (made and nxt) else APP_STAGE[name]

    touched = 0
    for r in rounds:
        if r.get("year") != int(YEAR) or r.get("competition") != "Mundial":
            continue
        for p in r.get("participants", []):
            new = label.get(p["pareja"])
            if new and p.get("advancedTo") != new:
                p["advancedTo"] = new
                touched += 1
    return touched, label


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--stage", required=True, choices=sorted(STAGES))
    ap.add_argument("--date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--group", default=None, help="예선 A/B/C/D, 8강 A/B 처럼 그룹이 나뉜 경우")
    ap.add_argument("--advancing", type=int, default=None, help="다음 라운드 진출 커플 수")
    ap.add_argument("--venue", default=None)
    ap.add_argument("--judges", default=None, help="쉼표로 구분한 심사위원 명단 (헤더 인식이 애매할 때)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    judges_override = [j.strip() for j in args.judges.split(",")] if args.judges else None
    table = parse_pdf(args.pdf, judges=judges_override)
    rule, detail = check_promedio(table)

    print(f"  {os.path.basename(args.pdf)}")
    print(f"  심사위원 {len(table['judges'])}인: {', '.join(table['judges'])}")
    if table["judges_uncertain"] and not judges_override:
        print("  ⚠ 헤더가 접힌 PDF라 심사위원 이름 귀속이 확실하지 않습니다. "
              "명단을 알면 --judges 로 넘겨 주세요. (점수·순위는 영향 없음)")
    print(f"  커플 {len(table['couples'])}쌍 · promedio 규칙: {rule} ({detail})")
    if rule == "unknown":
        print("  ⚠ promedio 계산식을 확정하지 못했습니다 — 파싱 오류일 수 있으니 확인 필요")

    couples = sorted(table["couples"], key=lambda c: -c["promedio"])
    for rank, c in enumerate(couples, 1):
        c["rank"] = rank
        if args.advancing:
            c["advanced"] = rank <= args.advancing

    payload = {
        "date": args.date,
        **({"venue": args.venue} if args.venue else {}),
        "judges": table["judges"],
        "total_couples": len(couples),
        **({"advancing": args.advancing,
            "cutoff_promedio": couples[args.advancing - 1]["promedio"]}
           if args.advancing and len(couples) >= args.advancing else {}),
        "scoring": ("심사위원 중 최고·최저 1개씩 제외한 평균" if rule == "trimmed"
                    else "심사위원 점수의 단순 평균"),
        "source": f"tangoba.org 공식 결과 PDF ({table['source_file']})",
        "couples": [
            {k: v for k, v in {
                "pareja": c["pareja"], "leader": c["leader"], "follower": c["follower"],
                "scores": c["scores"], "promedio": c["promedio"], "rank": c["rank"],
                "ronda": c["ronda"], "advanced": c.get("advanced"),
            }.items() if v is not None}
            for c in couples
        ],
    }

    if args.dry_run:
        print("  (dry-run) 상위 3쌍:",
              [(c["rank"], c["pareja"], c["leader"], c["promedio"]) for c in couples[:3]])
        return

    # ── mundial_results.json ────────────────────────────────────
    results = load(RESULTS)
    year = results.setdefault(YEAR, {
        "competition": "Mundial de Tango Buenos Aires 2026",
        "category": "Tango Pista", "stages": {},
    })
    if args.group:
        node = year["stages"].setdefault(args.stage, {"groups": {}})
        node.setdefault("groups", {})[args.group] = payload
    else:
        year["stages"][args.stage] = payload

    # ── competition_rounds.json ─────────────────────────────────
    rounds_doc = load(ROUNDS)
    rounds = rounds_doc["rounds"]
    meta = STAGES[args.stage]
    suffix = args.group or ""
    prefix = f"R-MUNDIAL{YEAR}-PISTA-{meta['prefix']}"
    mine = {r["round_id"] for r in rounds
            if r.get("round_id", "").startswith(prefix)
            and r.get("round_id", "").endswith(suffix)
            and r.get("stage") == meta["round_stage"]}
    keep_videos = {r["round_id"]: r.get("videos", []) for r in rounds if r["round_id"] in mine}
    keep_songs = {r["round_id"]: r.get("songs", []) for r in rounds if r["round_id"] in mine}
    rounds = [r for r in rounds if r["round_id"] not in mine]

    for ronda in sorted({c["ronda"] for c in couples}):
        in_ronda = sorted((c for c in couples if c["ronda"] == ronda), key=lambda c: c["rank"])
        round_id = f"{prefix}{ronda}{suffix}"
        rounds.append({
            "round_id": round_id,
            "competition": "Mundial",
            "competition_id": "COMP-001",
            "year": int(YEAR),
            "category": "pista",
            "stage": meta["round_stage"],
            "ronda_number": ronda,
            **({"group": args.group} if args.group else {}),
            "songs": keep_songs.get(round_id, []),
            "videos": keep_videos.get(round_id, []),
            "judges": table["judges"],
            "total_couples": len(in_ronda),
            "participants": [
                {"pareja": c["pareja"], "leader": c["leader"], "follower": c["follower"],
                 "rank": c["rank"], "promedio": c["promedio"],
                 "advancedTo": APP_STAGE[args.stage]}
                for c in in_ronda
            ],
        })

    touched, label = rebuild_advancement(results, rounds)
    rounds_doc["rounds"] = rounds
    save(RESULTS, results)
    save(ROUNDS, rounds_doc)

    where = f"{args.stage}" + (f"/{args.group}" if args.group else "")
    n_rondas = len({c["ronda"] for c in couples})
    print(f"  → mundial_results.json[{YEAR}].stages.{where} · {len(couples)}쌍")
    print(f"  → competition_rounds.json · {where} 론다 {n_rondas}개 (영상·곡 슬롯 유지)")
    print(f"  → 진출 추적 갱신: 파레하 {len(label)}명 기준, 참가자 {touched}건 반영")


if __name__ == "__main__":
    main()
