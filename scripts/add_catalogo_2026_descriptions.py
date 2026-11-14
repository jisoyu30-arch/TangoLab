#!/usr/bin/env python3
"""공식 카탈로그에서 이벤트 해설을 뽑아 축제 일정 데이터에 붙인다.

원본: data-sources/tangoba/Tango-BA-2026-Catalogo.pdf (94쪽 공식 카탈로그)
대상: src/data/mundial_2026_festival.json (Día x Día 에서 만든 일정)

Día x Día 에는 시간·장소·분류·제목만 있다. 카탈로그에는 같은 이벤트의
해설이 스페인어·영어로 실려 있어, 날짜와 제목으로 이어 붙인다.

카탈로그 한 항목의 생김새
    TEATRO SAN MARTÍN | Sala Martín Coronado      ← 장소 헤더(쪽마다 한 번)
    Orquesta Escuela de Tango Emilio Balcarce     ← 제목
    Jueves 20, 20 h / Thursday 20th, 8 p.m. - ... ← 날짜·시각 줄 (앵커)
    <스페인어 해설>                                  ← 좁은 단 (한 줄 ~40자)
    <영어 해설>                                     ← 전체 폭 (한 줄 ~100자)

스페인어/영어는 조판 폭이 달라서 줄 길이로 가른다. 날짜·시각 줄을 앵커로
삼고 바로 윗줄을 제목으로 본다.

사용: python3 scripts/add_catalogo_2026_descriptions.py
"""
import json
import os
import re
import sys
import unicodedata
from datetime import date, timedelta

try:
    import pymupdf
except ImportError:
    sys.exit("pymupdf가 필요합니다: python3 -m pip install pymupdf")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "data-sources/tangoba/Tango-BA-2026-Catalogo.pdf")
FESTIVAL = os.path.join(ROOT, "src/data/mundial_2026_festival.json")

FESTIVAL_START = date(2026, 8, 19)
WEEKDAYS_ES = {"LUNES": 0, "MARTES": 1, "MIÉRCOLES": 2, "MIERCOLES": 2, "JUEVES": 3,
               "VIERNES": 4, "SÁBADO": 5, "SABADO": 5, "DOMINGO": 6}

# "Jueves 20, 20 h / Thursday 20th, 8 p.m. - Teatro San Martín, Sala Martín Coronado"
DATE_LINE = re.compile(
    r"^(Lunes|Martes|Mi[ée]rcoles|Jueves|Viernes|S[áa]bado|Domingo)\s+(\d{1,2})\s*,\s*"
    r"(?P<time_es>[^/]+?)\s*/\s*(?P<time_en>[^-]+?)\s*[-–]\s*(?P<venue>.+)$",
    re.IGNORECASE)
SKIP = re.compile(r"^(tangoba\.org|\d{1,3})$")
EN_LINE_MIN = 70        # 영어 단은 전체 폭이라 줄이 길다


def norm_time(t):
    """시각 표기를 숫자만 남긴 꼴로 통일.

    두 문서가 구분자와 단위를 다르게 쓴다 — Día x Día 는 "17.30h",
    카탈로그는 "17:30 h". 범위의 "a" 만 살리고 나머지 기호·단위는 버린다.
        "20 h" -> "20" · "17:30 h" -> "1730" · "14 a 15.15 h" -> "14A1515"
    """
    t = re.sub(r"\s+a\s+", "A", t.lower())
    return re.sub(r"[^0-9A]", "", t)


def norm(s):
    """악센트·구두점·공백을 지운 비교용 키."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def join(lines):
    """하이픈으로 끊긴 줄바꿈을 복원하며 문단으로 합친다."""
    out = ""
    for ln in lines:
        ln = ln.rstrip()
        if out.endswith("-") and not out.endswith("--"):
            out = out[:-1] + ln.lstrip()
        else:
            out = (out + " " + ln).strip() if out else ln
    return re.sub(r"\s+", " ", out).strip()


def parse_catalog():
    doc = pymupdf.open(PDF)
    lines = []
    for page in doc:
        for raw in page.get_text().split("\n"):
            s = raw.strip()
            if s and not SKIP.match(s):
                lines.append(s)

    entries, i = [], 0
    while i < len(lines):
        m = DATE_LINE.match(lines[i])
        if not m or i == 0:
            i += 1
            continue
        title = lines[i - 1].strip()
        # 장소 헤더("TEATRO X | Sala Y")가 바로 위면 제목이 아니다
        if "|" in title and title == title.upper():
            i += 1
            continue

        body, j = [], i + 1
        while j < len(lines) and not DATE_LINE.match(lines[j]):
            # 다음 항목의 제목에 닿으면 멈춘다 (그 다음 줄이 날짜 줄)
            if j + 1 < len(lines) and DATE_LINE.match(lines[j + 1]):
                break
            body.append(lines[j])
            j += 1

        es = [ln for ln in body if len(ln) < EN_LINE_MIN]
        en = [ln for ln in body if len(ln) >= EN_LINE_MIN]
        entries.append({
            "title": title,
            "time_key": norm_time(m.group("time_es")),
            "weekday_es": m.group(1),
            "day": int(m.group(2)),
            "time_es": m.group("time_es").strip(),
            "venue": m.group("venue").strip(),
            "description_es": join(es),
            "description_en": join(en),
        })
        i = j
    return entries


def assign_dates(entries):
    """일 번호 -> 날짜. 요일 이름으로 검산한다."""
    for e in entries:
        d = FESTIVAL_START
        while d.day != e["day"] and (d - FESTIVAL_START).days <= 40:
            d += timedelta(days=1)
        if d.day != e["day"]:
            e["date"] = None
            continue
        e["date"] = d.isoformat()
        key = unicodedata.normalize("NFD", e["weekday_es"].upper())
        key = "".join(c for c in key if unicodedata.category(c) != "Mn")
        if WEEKDAYS_ES.get(key) != d.weekday():
            e["date"] = None          # 요일이 안 맞으면 버린다
    return [e for e in entries if e["date"]]


def main():
    entries = assign_dates(parse_catalog())
    data = json.load(open(FESTIVAL, encoding="utf-8"))

    # 카탈로그 제목은 여러 줄로 접혀 조각만 잡히는 경우가 있어 제목으로 잇지 않는다.
    # 날짜 + 시각 + 장소는 양쪽 문서가 같은 값을 쓰므로 이걸 열쇠로 쓴다.
    def place_key(venue):
        return norm(venue)

    by_slot, by_title = {}, {}
    for e in entries:
        if not (e["description_es"] or e["description_en"]):
            continue
        by_slot.setdefault((e["date"], e["time_key"], place_key(e["venue"])), e)
        by_title.setdefault((e["date"], norm(e["title"])), e)

    matched = unmatched = 0
    for day in data["days"]:
        for ev in day["events"]:
            hit = by_slot.get((day["date"], norm_time(ev["time"]), place_key(ev["venue"])))
            if hit is None:
                # 장소 표기가 미묘하게 다를 때 (홀 이름이 한쪽에만 있는 등):
                # 날짜·시각이 같은 것들 중 장소 이름이 서로의 접두인 경우만 받아들인다.
                # 날짜와 시각이 이미 고정이라 후보가 하나면 같은 이벤트로 본다.
                pv = place_key(ev["venue"])
                cands = [v for (d2, t2, p2), v in by_slot.items()
                         if d2 == day["date"] and t2 == norm_time(ev["time"])
                         and (p2.startswith(pv[:14]) or pv.startswith(p2[:14]))]
                hit = cands[0] if len(cands) == 1 else None
            if hit is None:
                hit = by_title.get((day["date"], norm(ev["title"])))
            if hit:
                ev["description_es"] = hit["description_es"]
                if hit["description_en"]:
                    ev["description_en"] = hit["description_en"]
                matched += 1
            else:
                unmatched += 1

    data["catalog_source"] = ("Tango BA Festival y Mundial 2026 공식 카탈로그 "
                              "(data-sources/tangoba/Tango-BA-2026-Catalogo.pdf)")
    with open(FESTIVAL, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    total = matched + unmatched
    print(f"  카탈로그 항목 {len(entries)}건 파싱 · 해설 있는 항목 {len(by_slot)}건")
    print(f"  일정 이벤트 {total}건 중 {matched}건에 해설 연결 ({matched / total:.0%})")
    print(f"  {os.path.relpath(FESTIVAL, ROOT)} 갱신")


if __name__ == "__main__":
    main()
