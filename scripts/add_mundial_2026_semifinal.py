#!/usr/bin/env python3
"""Mundial de Tango 2026 · Tango Pista 준결승(8/29) 결과 인제스트.

원본: data-sources/tangoba/Pista-Semis-2026-29_8-JURADOS-RONDAS-TODAS.pdf (tangoba.org 공식 PDF)

하는 일
  1) PDF -> 커플 159쌍 (론다/파레하/이름/심사위원 6인 점수/promedio) 파싱
  2) src/data/mundial_results.json 에 "2026" 스테이지 추가
  3) src/data/competition_rounds.json 에 R-MUNDIAL2026-PISTA-SF1..SF17 라운드 추가
     (론다별 참가자 = 결과표에서 해당 ronda 커플, 진출 여부까지 매칭)

점수 규칙: 심사위원 6인 중 최고·최저 1개씩 제외한 4개 평균 (159쌍 전부 검증됨)

의존: pip install pymupdf
사용: python3 scripts/add_mundial_2026_semifinal.py
"""
import json
import os
import re
import sys

try:
    import pymupdf
except ImportError:
    sys.exit("pymupdf가 필요합니다: pip install pymupdf")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "data-sources/tangoba/Pista-Semis-2026-29_8-JURADOS-RONDAS-TODAS.pdf")
RESULTS = os.path.join(ROOT, "src/data/mundial_results.json")
ROUNDS = os.path.join(ROOT, "src/data/competition_rounds.json")

# PDF 헤더의 심사위원 컬럼 순서 (x좌표로 확인 — 좌→우)
JUDGES = [
    "Leandro Oliver",
    "Cynthia Palacios",
    "Fabián Peralta",
    "Cristina Sosa",
    "Andrés Laza Moreno",
    "Inés Bogado",
]
DATE = "2026-08-29"
ADVANCING = 36  # 결승 진출 커플 수 (tangoba.org 공식 발표)

HEADER_TOKENS = {"z", "RONDA", "PAREJA", "Nombre y Apellido", "PROMEDIO"}
JUDGE_HEADER_LINES = {
    "Leandro Oliver Cynthia Palacios",
    "Fabián Peralta Cristina Sosa",
    "Andrés Laza Moreno",
    "Inés Bogado",
}
NUM = re.compile(r"^\d+(?:\.\d+)?$")


def parse_pdf():
    """PDF 텍스트를 커플 레코드로 변환. 레코드 1건 = 11줄."""
    doc = pymupdf.open(PDF)
    lines = [s.strip() for page in doc for s in page.get_text().split("\n") if s.strip()]

    start = next(i for i, l in enumerate(lines) if l == "PROMEDIO") + 1
    rows, i = [], start
    while i + 10 < len(lines):
        line = lines[i]
        if line in HEADER_TOKENS or line in JUDGE_HEADER_LINES or "JURADO" in line:
            i += 1
            continue
        if not (re.match(r"^\d+$", line) and re.match(r"^\d+$", lines[i + 1])):
            i += 1
            continue
        scores, promedio = lines[i + 4:i + 10], lines[i + 10]
        if not (all(NUM.match(s) for s in scores) and NUM.match(promedio)):
            i += 1
            continue
        rows.append({
            "ronda": int(lines[i]),
            "pareja": int(lines[i + 1]),
            "leader": re.sub(r"\s+", " ", lines[i + 2]).strip(),
            "follower": re.sub(r"\s+", " ", lines[i + 3]).strip(),
            "scores": [float(s) for s in scores],
            "promedio": float(promedio),
        })
        i += 11
    return rows


def verify(rows):
    """promedio = 최고·최저 제외 4개 평균인지 확인."""
    bad = []
    for r in rows:
        trimmed = sorted(r["scores"])[1:-1]
        if abs(round(sum(trimmed) / len(trimmed), 3) - r["promedio"]) > 0.0011:
            bad.append(r["pareja"])
    if bad:
        sys.exit(f"promedio 계산 불일치 (파레하 {bad[:5]}...) — 파싱 오류 가능성")
    if len({r["pareja"] for r in rows}) != len(rows):
        sys.exit("파레하 번호 중복 — 파싱 오류")
    print(f"  검증 통과: {len(rows)}쌍, promedio = 6인 중 최고·최저 제외 평균")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    rows = parse_pdf()
    verify(rows)

    # promedio 내림차순 = 순위. 상위 36쌍이 결승 진출.
    rows.sort(key=lambda r: -r["promedio"])
    for rank, r in enumerate(rows, 1):
        r["rank"] = rank
        r["advanced"] = rank <= ADVANCING
    cutoff = rows[ADVANCING - 1]["promedio"]

    # ── 1) mundial_results.json ──────────────────────────────────
    results = load(RESULTS)
    results["2026"] = {
        "competition": "Mundial de Tango Buenos Aires 2026",
        "category": "Tango Pista",
        "stages": {
            "semifinal": {
                "date": DATE,
                "venue": "Usina del Arte",
                "judges": JUDGES,
                "total_couples": len(rows),
                "advancing": ADVANCING,
                "cutoff_promedio": cutoff,
                "scoring": "심사위원 6인 중 최고·최저 1개씩 제외한 4개 평균",
                "source": "tangoba.org 공식 결과 PDF (Pista Semis 2026-08-29)",
                "couples": [
                    {
                        "pareja": r["pareja"],
                        "leader": r["leader"],
                        "follower": r["follower"],
                        "scores": dict(zip(JUDGES, r["scores"])),
                        "promedio": r["promedio"],
                        "rank": r["rank"],
                        "ronda": r["ronda"],
                        "advanced": r["advanced"],
                    }
                    for r in rows
                ],
            }
        },
    }
    save(RESULTS, results)
    print(f"  mundial_results.json ← 2026 준결승 {len(rows)}쌍 (컷오프 {cutoff})")

    # ── 2) competition_rounds.json ───────────────────────────────
    rounds_doc = load(ROUNDS)
    rounds = rounds_doc["rounds"]
    # 재실행 대비: 기존 2026 Mundial 준결승 라운드는 영상만 보존하고 교체
    keep_videos = {
        r["round_id"]: r.get("videos", [])
        for r in rounds
        if r.get("round_id", "").startswith("R-MUNDIAL2026-PISTA-SF")
    }
    rounds = [r for r in rounds if not r.get("round_id", "").startswith("R-MUNDIAL2026-PISTA-SF")]

    for ronda in sorted({r["ronda"] for r in rows}):
        in_ronda = sorted(
            (r for r in rows if r["ronda"] == ronda), key=lambda r: r["rank"]
        )
        round_id = f"R-MUNDIAL2026-PISTA-SF{ronda}"
        rounds.append({
            "round_id": round_id,
            "competition": "Mundial",
            "competition_id": "COMP-001",
            "year": 2026,
            "category": "pista",
            "stage": "semifinal",
            "ronda_number": ronda,
            "songs": [],
            "videos": keep_videos.get(round_id, []),
            "judges": JUDGES,
            "total_couples": len(in_ronda),
            "participants": [
                {
                    "pareja": r["pareja"],
                    "leader": r["leader"],
                    "follower": r["follower"],
                    "rank": r["rank"],
                    "promedio": r["promedio"],
                    "advancedTo": "final" if r["advanced"] else "semifinal",
                }
                for r in in_ronda
            ],
        })

    rounds_doc["rounds"] = rounds
    save(ROUNDS, rounds_doc)
    n_rondas = len({r["ronda"] for r in rows})
    print(f"  competition_rounds.json ← 준결승 {n_rondas}개 론다 (영상 슬롯 유지)")


if __name__ == "__main__":
    main()
