#!/usr/bin/env python3
"""tangoba.org 공식 결과 PDF 범용 파서 (예선/준준결승/준결승/결승 공통).

연도·스테이지마다 PDF 생성기가 달라 텍스트 추출 형태가 제각각이라
(2025는 행 단위, 2026은 값 하나당 한 줄) 줄 단위로 읽으면 깨진다.
대신 PDF의 span(표의 셀 하나 = span 하나)을 쓴다. 셀 경계가 곧 컬럼이라
이름이 길어 컬럼을 넘쳐도 리더/팔로워가 섞이지 않는다.
심사위원 수(5인/6인/7인)는 점수 셀 개수에서 자동 인식.

라이브러리로도 CLI로도 쓴다:
    from parse_tangoba_results import parse_pdf
    table = parse_pdf('data-sources/tangoba/....pdf')

    python3 scripts/parse_tangoba_results.py <pdf> [--json out.json]

검증: python3 scripts/parse_tangoba_results.py --selftest
      (저장소의 2025·2026 PDF를 파싱해 mundial_results.json 과 대조)

알려진 한계 — 심사위원 이름:
    헤더에서 이름이 두 줄로 접히는 PDF가 있는데, 접힌 조각이 자기 컬럼이 아니라
    옆 컬럼 아래에 찍히기도 한다. 2025 예선 A는 읽는 순서가 맞고 2025 8강 A는
    좌표가 맞아서 두 파일이 서로 모순된다 = 자동으로 확정할 수 없다.
    그래서 접힌 헤더를 만나면 judges_uncertain=True 로 표시만 하고
    (점수·순위·커플 이름은 영향 없음) 호출자가 judges= 로 명단을 넘기게 한다.
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
NUM = re.compile(r"^\d+(?:[.,]\d+)?$")
INT = re.compile(r"^\d+$")
RONDA_TOK = re.compile(r"^(\d+)\s*([A-Za-z])?$")  # "14" 또는 "12B"(그룹 접미사)


def _spans(doc):
    """표의 셀 하나 = span 하나. 페이지를 이어붙여 반환."""
    out = []
    for pno, page in enumerate(doc):
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for s in line["spans"]:
                    text = s["text"].replace("\xa0", " ").strip()
                    if not text:
                        continue
                    x0, y0, x1, _ = s["bbox"]
                    out.append({"x0": x0, "x1": x1, "y": y0, "cx": (x0 + x1) / 2,
                                "text": text, "page": pno})
    return out


def _rows(cells, tol=3.0):
    """같은 y끼리 묶어 행 복원 (셀은 x 순으로 정렬)."""
    rows, cur, cur_y, cur_page = [], [], None, None
    for c in sorted(cells, key=lambda c: (c["page"], round(c["y"], 1), c["x0"])):
        if cur and (c["page"] != cur_page or abs(c["y"] - cur_y) > tol):
            rows.append(sorted(cur, key=lambda c: c["x0"]))
            cur = []
        if not cur:
            cur_y, cur_page = c["y"], c["page"]
        cur.append(c)
    if cur:
        rows.append(sorted(cur, key=lambda c: c["x0"]))
    return rows


def _is_data_row(row):
    """[ronda, pareja, 리더, 팔로워, 점수..., promedio] 모양인가."""
    if len(row) < 6:
        return False
    if not RONDA_TOK.match(row[0]["text"]) or not INT.match(row[1]["text"]):
        return False
    return sum(1 for c in row[2:] if NUM.match(c["text"])) >= 4


def _header(cells, first_data_y):
    """헤더에서 PROMEDIO 위치와 심사위원 이름 셀을 찾는다."""
    promedio = next((c for c in cells if c["text"].upper().startswith("PROMEDIO")), None)
    ronda = next((c for c in cells if c["text"].upper() == "RONDA"), None)
    if not promedio or not ronda:
        raise ValueError("헤더(RONDA/PROMEDIO)를 찾지 못했습니다 — 예상과 다른 PDF 형식")
    nombres = sorted((c for c in cells if c["text"].lower().startswith("nombre")
                      and abs(c["y"] - ronda["y"]) < 12), key=lambda c: c["x0"])
    if len(nombres) < 2:
        raise ValueError("이름 컬럼 헤더를 찾지 못했습니다")
    judge_cells = [c for c in cells
                   if c["page"] == 0 and ronda["y"] - 12 <= c["y"] < first_data_y - 1
                   and nombres[1]["x1"] < c["cx"] < promedio["cx"] - 20
                   and c["text"] != "z"]   # 오른쪽 위 장식 글자
    return {"ronda_y": ronda["y"], "promedio_x": promedio["cx"], "judge_cells": judge_cells}


def _judge_names(judge_cells, score_centers):
    """심사위원 이름 셀을 가장 가까운 점수 컬럼에 배정.

    헤더가 한 줄이면 정확하다. 두 줄 이상으로 접히면 PDF가 조각을 엉뚱한
    컬럼 아래 찍는 경우가 있어 확정할 수 없다 → uncertain 플래그로 알린다.
    """
    buckets = {i: [] for i in range(len(score_centers))}
    for c in judge_cells:
        i = min(range(len(score_centers)), key=lambda k: abs(score_centers[k] - c["cx"]))
        buckets[i].append(c)
    names = []
    for i in range(len(score_centers)):
        parts = sorted(buckets[i], key=lambda c: (round(c["y"], 1), c["x0"]))
        names.append(re.sub(r"\s+", " ", " ".join(c["text"] for c in parts)).strip())
    uncertain = len({round(c["y"], 1) for c in judge_cells}) > 1
    return names, uncertain


def parse_pdf(path, expected_judges=None, judges=None):
    """결과 PDF -> {'title','judges','judges_uncertain','couples':[...],'skipped_rows'}"""
    doc = pymupdf.open(path)
    cells = _spans(doc)
    rows = _rows(cells)
    data_rows = [r for r in rows if _is_data_row(r)]
    if not data_rows:
        raise ValueError("데이터 행을 찾지 못했습니다 — 예상과 다른 PDF 형식")

    on_first_page = [r for r in data_rows if r[0]["page"] == 0]
    first_data_y = min(r[0]["y"] for r in on_first_page) if on_first_page else 1e9
    head = _header(cells, first_data_y)

    n_scores = min(sum(1 for c in r[2:] if NUM.match(c["text"])) for r in data_rows)
    n_judges = n_scores - 1
    if expected_judges and n_judges != expected_judges:
        raise ValueError(f"심사위원 {n_judges}인으로 인식 (기대 {expected_judges}인)")

    # 점수 컬럼 중심 = 각 점수 셀 위치의 평균 (promedio 제외)
    centers = []
    for k in range(n_judges):
        xs = [[c for c in r[2:] if NUM.match(c["text"])][k]["cx"] for r in data_rows]
        centers.append(sum(xs) / len(xs))

    parsed_judges, uncertain = _judge_names(head["judge_cells"], centers)
    if judges:
        if len(judges) != n_judges:
            raise ValueError(f"심사위원 {len(judges)}명을 넘겼는데 점수 컬럼은 {n_judges}개")
        parsed_judges, uncertain = list(judges), False

    couples = []
    for row in data_rows:
        m = RONDA_TOK.match(row[0]["text"])
        rest = row[2:]
        numeric = [c for c in rest if NUM.match(c["text"])]
        names = [c for c in rest if not NUM.match(c["text"])]
        if len(numeric) != n_scores or len(names) != 2:
            continue
        vals = [float(c["text"].replace(",", ".")) for c in numeric]
        couples.append({
            "ronda": int(m.group(1)), "pareja": int(row[1]["text"]),
            **({"ronda_group": m.group(2)} if m.group(2) else {}),
            "leader": re.sub(r"\s+", " ", names[0]["text"]).strip(),
            "follower": re.sub(r"\s+", " ", names[1]["text"]).strip(),
            "scores": dict(zip(parsed_judges, vals[:-1])),
            "promedio": vals[-1],
        })

    title_cells = [c for c in cells if c["page"] == 0 and c["y"] < head["ronda_y"] - 5
                   and c["text"] != "z"]
    title = " ".join(c["text"] for c in sorted(title_cells, key=lambda c: c["x0"]))

    return {"title": title.strip(), "judges": parsed_judges,
            "judges_uncertain": uncertain, "couples": couples,
            "skipped_rows": len(data_rows) - len(couples),
            "source_file": os.path.basename(path)}


def trimmed_mean(scores):
    """최고·최저 1개씩 제외한 평균."""
    v = sorted(scores)
    core = v[1:-1] if len(v) > 2 else v
    return sum(core) / len(core)


def check_promedio(table):
    """공식 promedio 가 단순 평균인지 최고·최저 제외 평균인지 판정."""
    plain = trimmed = 0
    for c in table["couples"]:
        v = list(c["scores"].values())
        if abs(sum(v) / len(v) - c["promedio"]) <= 0.0011:
            plain += 1
        if abs(trimmed_mean(v) - c["promedio"]) <= 0.0011:
            trimmed += 1
    n = len(table["couples"])
    if n and trimmed == n and plain < n:
        return "trimmed", f"{n}쌍 전부 최고·최저 제외 평균과 일치"
    if n and plain == n:
        return "mean", f"{n}쌍 전부 단순 평균과 일치"
    return "unknown", f"단순평균 {plain}/{n} · 절사평균 {trimmed}/{n} — 확인 필요"


# ── 자체 검증: 저장소 PDF -> 이미 검증된 mundial_results.json 과 대조 ──────
SELFTEST = [
    ("data-sources/tangoba/Resultados-Pista-Clasificatorias-2025-23_8-A.pdf",
     ("2025", "clasificatoria", "A"), 5),
    ("data-sources/tangoba/Resultados-Pista-Clasificatorias-2025-23_8-B.pdf",
     ("2025", "clasificatoria", "B"), 5),
    ("data-sources/tangoba/Pista-Clasificatorias-2025-24_8-C-resultados.pdf",
     ("2025", "clasificatoria", "C"), 5),
    ("data-sources/tangoba/Pista-Clasificatorias-2025-24_8-D-resultados.pdf",
     ("2025", "clasificatoria", "D"), 5),
    ("data-sources/tangoba/Jurados-_-Pista-Cuartos-2025-27_8-A-resultados.pdf",
     ("2025", "cuartos", "A"), 5),
    # 저장된 2025 8강 B 는 파레하 467·739 두 쌍이 빠져 있다 (PDF 원본에는 있음).
    # 파서 오류가 아니라 기존 데이터의 누락이라 알려진 차이로 기록해 둔다.
    ("data-sources/tangoba/Jurados-_-Pista-Cuartos-2025-27_8-B-resultados.pdf",
     ("2025", "cuartos", "B"), 5, {467, 739}),
    ("data-sources/tangoba/Pista-Semis-2025-29_8-JURADOS-_-RONDAS-TODAS-29_8-1.pdf",
     ("2025", "semifinal", None), 6),
    ("data-sources/tangoba/Pista-Semis-2026-29_8-JURADOS-RONDAS-TODAS.pdf",
     ("2026", "semifinal", None), 6),
]


def selftest():
    results = json.load(open(os.path.join(ROOT, "src/data/mundial_results.json"), encoding="utf-8"))
    ok = True
    for entry in SELFTEST:
        rel, (year, stage, group), n_judges = entry[:3]
        known_extra = entry[3] if len(entry) > 3 else set()
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            print(f"  – {os.path.basename(rel)} 없음, 건너뜀")
            continue
        try:
            table = parse_pdf(path, expected_judges=n_judges)
        except Exception as e:                                  # noqa: BLE001
            print(f"  ✗ {os.path.basename(rel)} 파싱 실패: {e}")
            ok = False
            continue

        node = results[year]["stages"][stage]
        expect = node["groups"][group]["couples"] if group else node["couples"]
        exp_judges = node["groups"][group]["judges"] if group else node["judges"]
        exp_by_pareja = {c["pareja"]: c for c in expect}
        got_by_pareja = {c["pareja"]: c for c in table["couples"]}
        rule, detail = check_promedio(table)
        for pareja in known_extra:                 # 저장 데이터에 없는 걸 알고 있는 행
            got_by_pareja.pop(pareja, None)

        problems = []
        if table["skipped_rows"]:
            problems.append(f"셀 구조가 달라 건너뛴 행 {table['skipped_rows']}개")
        if len(got_by_pareja) != len(exp_by_pareja):
            problems.append(f"커플 수 {len(got_by_pareja)} ≠ 기대 {len(exp_by_pareja)}")
        for pareja, exp in exp_by_pareja.items():
            got = got_by_pareja.get(pareja)
            if not got:
                problems.append(f"파레하 {pareja} 누락")
                continue
            if abs(got["promedio"] - exp["promedio"]) > 0.0011:
                problems.append(f"파레하 {pareja} promedio {got['promedio']} ≠ {exp['promedio']}")
            if got["ronda"] != exp.get("ronda", got["ronda"]):
                problems.append(f"파레하 {pareja} ronda {got['ronda']} ≠ {exp['ronda']}")
            if sorted(got["scores"].values()) != sorted(exp["scores"].values()):
                problems.append(f"파레하 {pareja} 점수 불일치")
            for field in ("leader", "follower"):
                a = re.sub(r"\s+", " ", got[field]).strip().lower()
                b = re.sub(r"\s+", " ", exp.get(field, "")).strip().lower()
                if a != b:
                    problems.append(f"파레하 {pareja} {field}: {got[field]!r} ≠ {exp.get(field)!r}")

        name_note = ""
        if table["judges"] != exp_judges:
            if table["judges_uncertain"]:
                name_note = ("⚠ 심사위원 이름 귀속 불확실 (헤더가 접힌 PDF, 자동 확정 불가) — "
                             f"기대: {', '.join(exp_judges)}")
            else:
                problems.append(f"심사위원 이름 불일치: {table['judges']} ≠ {exp_judges}")

        print(f"  {'✓' if not problems else '✗'} {os.path.basename(rel)}")
        print(f"      심사위원 {len(table['judges'])}인: {', '.join(table['judges'])}")
        print(f"      커플 {len(table['couples'])}쌍 · promedio 규칙: {rule} ({detail})")
        if known_extra:
            print(f"      ⚠ 저장 데이터 누락 {len(known_extra)}쌍 (파레하 {sorted(known_extra)}) — "
                  "PDF에는 있으나 mundial_results.json 에 없음")
        if name_note:
            print(f"      {name_note}")
        for p in problems[:5]:
            print(f"      ! {p}")
        if problems:
            ok = False
    return ok


def main():
    args = sys.argv[1:]
    if not args or args[0] == "--selftest":
        print("자체 검증 — 저장소 PDF를 파싱해 mundial_results.json 과 대조:")
        sys.exit(0 if selftest() else 1)

    table = parse_pdf(args[0])
    rule, detail = check_promedio(table)
    print(f"제목: {table['title']}")
    print(f"심사위원 {len(table['judges'])}인: {', '.join(table['judges'])}"
          + ("  ⚠ 이름 귀속 불확실" if table["judges_uncertain"] else ""))
    print(f"커플 {len(table['couples'])}쌍 · 론다 {sorted({c['ronda'] for c in table['couples']})}")
    print(f"promedio 규칙: {rule} ({detail})")
    if table["skipped_rows"]:
        print(f"⚠ 셀 구조가 달라 건너뛴 행 {table['skipped_rows']}개")
    if "--json" in args:
        out = args[args.index("--json") + 1]
        with open(out, "w", encoding="utf-8") as f:
            json.dump(table, f, ensure_ascii=False, indent=2)
        print(f"→ {out}")


if __name__ == "__main__":
    main()
