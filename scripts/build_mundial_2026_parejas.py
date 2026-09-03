#!/usr/bin/env python3
"""Mundial 2026 등번호(파레하) 인덱스 생성.

영상에서 등번호만 보이는 상황을 위한 색인이다. 번호 하나로
  누구인지 → 어느 스테이지·조·론다에서 췄는지 → 그 론다 영상이 뭔지
까지 한 번에 이어진다.

  src/data/mundial_results.json     스테이지별 점수·순위
  src/data/competition_rounds.json  론다별 영상
  src/data/champion_profiles.json   시상 결과
      -> src/data/mundial_2026_parejas.json

이름이 스테이지마다 조금씩 다르게 적힌 커플이 있다(등록명 vs 약칭).
가장 긴 표기를 대표로 쓰고 나머지는 name_variants 에 남긴다.

사용: python3 scripts/build_mundial_2026_parejas.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(ROOT, "src/data/mundial_results.json")
ROUNDS = os.path.join(ROOT, "src/data/competition_rounds.json")
PROFILES = os.path.join(ROOT, "src/data/champion_profiles.json")
OUT = os.path.join(ROOT, "src/data/mundial_2026_parejas.json")

YEAR = "2026"
STAGE_ORDER = ["clasificatoria", "cuartos", "semifinal", "final"]
ROUND_STAGE = {"clasificatoria": "qualifying", "cuartos": "quarterfinal",
               "semifinal": "semifinal", "final": "final"}


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def main():
    stages = load(RESULTS)[YEAR]["stages"]
    rounds = load(ROUNDS)["rounds"]
    champ = load(PROFILES)["profiles"].get("2026-pista", {})
    podium = {p["pareja"]: p["rank"] for p in champ.get("podium", [])}

    # (스테이지, 조, 론다) -> 영상
    videos_by_round = {}
    for r in rounds:
        if r.get("year") != int(YEAR) or r.get("competition") != "Mundial":
            continue
        key = (r["stage"], r.get("group"), r["ronda_number"])
        videos_by_round[key] = [
            {"video_id": v["video_id"], "title": v.get("title"), "channel": v.get("channel")}
            for v in r.get("videos", [])
        ]

    index = {}
    for name in STAGE_ORDER:
        node = stages.get(name)
        if not node:
            continue
        for group, gv in (node.get("groups") or {None: node}).items():
            total = len(gv["couples"])
            for c in gv["couples"]:
                e = index.setdefault(c["pareja"], {
                    "pareja": c["pareja"], "names": set(), "stages": [],
                })
                e["names"].add((c["leader"].strip(), c["follower"].strip()))
                e["stages"].append({
                    "stage": name,
                    "group": group,
                    "ronda": c.get("ronda"),
                    "rank": c["rank"],
                    "of": total,
                    "promedio": c["promedio"],
                    "advanced": c.get("advanced"),
                    "videos": videos_by_round.get(
                        (ROUND_STAGE[name], group, c.get("ronda")), []),
                })

    out = []
    for pareja, e in sorted(index.items()):
        variants = sorted(e["names"], key=lambda n: -len(n[0] + n[1]))
        leader, follower = variants[0]
        e["stages"].sort(key=lambda s: STAGE_ORDER.index(s["stage"]))
        # 결승은 점수표가 없어 stages 에 없다 — 시상 기록이 있으면 결승 도달로 본다
        furthest = "final" if pareja in podium else e["stages"][-1]["stage"]
        entry = {
            "pareja": pareja,
            "leader": leader,
            "follower": follower,
            "furthest_stage": furthest,
            "stages": e["stages"],
            "has_video": any(s["videos"] for s in e["stages"]),
        }
        if len(variants) > 1:
            entry["name_variants"] = [f"{a} & {b}" for a, b in variants[1:]]
        if pareja in podium:
            entry["final_rank"] = podium[pareja]
        out.append(entry)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({
            "generated_by": "scripts/build_mundial_2026_parejas.py",
            "note": "2026 Mundial 피스타 등번호 색인. 예선~준결승은 공식 결과 PDF, "
                    "결승 순위는 보도 기준(점수표 미확보).",
            "year": 2026,
            "category": "pista",
            "total": len(out),
            "parejas": out,
        }, f, ensure_ascii=False, indent=2)

    with_video = sum(1 for e in out if e["has_video"])
    by_stage = {s: sum(1 for e in out if e["furthest_stage"] == s) for s in STAGE_ORDER}
    print(f"  {os.path.relpath(OUT, ROOT)} 생성")
    print(f"  등번호 {len(out)}개 (#{out[0]['pareja']}~#{out[-1]['pareja']}) · "
          f"영상 연결됨 {with_video}개")
    print(f"  최종 도달: " + " · ".join(f"{k} {v}" for k, v in by_stage.items() if v))


if __name__ == "__main__":
    main()
