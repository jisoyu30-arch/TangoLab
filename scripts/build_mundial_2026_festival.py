#!/usr/bin/env python3
"""Tango BA 2026 축제 프로그램 PDF -> src/data/mundial_2026_festival.json

원본: data-sources/tangoba/Tango-BA-2026-Dia-x-Dia.pdf (공식 「Día x Día」 프로그램)

뽑는 것
  - 공연장 목록 (이름·주소·동네·꼬무나)
  - 입장 정책 (공연장 그룹별)
  - 날짜별 프로그램 (시간·장소·분류·제목)
  - 그중 대회(MUNDIAL DE BAILE) 일정만 따로

PDF가 3단 조판이라 읽는 순서 그대로 뽑으면 날짜가 뒤섞인다(6쪽 아래에 '수요일 19'가
찍혀 있는 식). 그래서 블록 좌표로 단을 복원해 단→위→아래 순으로 읽는다.
글꼴·크기가 역할과 1:1로 대응해서 그걸로 시간/장소/분류/제목을 가른다.
  시간 8.0 볼드(BdCn) · 장소와 분류 7.0 · 제목 7.8 · 날짜 헤더 9.0
  공연장 페이지: 이름 FiraSans-SemiBold 8.0 · 주소 6.5

사용: python3 scripts/build_mundial_2026_festival.py
"""
import json
import os
import re
import sys
from datetime import date, timedelta

try:
    import pymupdf
except ImportError:
    sys.exit("pymupdf가 필요합니다: pip install pymupdf")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "data-sources/tangoba/Tango-BA-2026-Dia-x-Dia.pdf")
OUT = os.path.join(ROOT, "src/data/mundial_2026_festival.json")

FESTIVAL_START = date(2026, 8, 19)          # 축제 첫날 (수요일 19일)
WEEKDAYS_ES = {"LUNES": 0, "MARTES": 1, "MIÉRCOLES": 2, "MIERCOLES": 2, "JUEVES": 3,
               "VIERNES": 4, "SÁBADO": 5, "SABADO": 5, "DOMINGO": 6}
WEEKDAY_KO = ["월", "화", "수", "목", "금", "토", "일"]
DAY_RE = re.compile(r"^(LUNES|MARTES|MI[ÉE]RCOLES|JUEVES|VIERNES|S[ÁA]BADO|DOMINGO)\s+(\d{1,2})")
TIME_RE = re.compile(r"^\d{1,2}(?:\.\d{2})?\s*(?:a\s*\d{1,2}(?:\.\d{2})?\s*)?h\b")

CATEGORY_KO = {
    "MUNDIAL DE BAILE": "세계선수권 대회",
    "CONCIERTOS": "공연",
    "MILONGA": "밀롱가",
    "CLASES DE BAILE": "댄스 클래스",
    "LA USINA MILONGUERA": "우시나 밀롱게라 (클래스+밀롱가)",
    "DANZA": "무용",
    "MUESTRAS": "전시",
    "CINE": "영화",
    "TALLER": "워크숍",
    "PRESENTACIÓN DE LIBRO": "책 발표",
    "ACTIVIDADES ESPECIALES": "특별 행사",
    "PREMIOS TANGO SIGLO XXI": "탱고 21세기상",
    "PRODUCCIÓN ESPECIAL": "특별 프로덕션",
    "PRODUCCIÓN ESPECIAL. GRAN APERTURA": "특별 프로덕션 · 개막 공연",
    "PRODUCCIÓN ESPECIAL. GRAN CIERRE": "특별 프로덕션 · 폐막 공연",
    "ACTIVIDAD ESPECIAL": "특별 행사",
    "CONCIERTO": "공연",
    "CHARLA": "강연",
    "VISITAS GUIADAS": "가이드 투어",
    "PREMIOS TANGO SIGLO XXI": "탱고 21세기상",
    "CLASE MAGISTRAL": "마스터클래스",
    "CHARLAS": "강연",
    "HOMENAJE": "헌정",
}


def blocks(page):
    out = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        lines = []
        for line in b["lines"]:
            spans = [{"text": s["text"], "size": round(s["size"], 1), "font": s["font"]}
                     for s in line["spans"] if s["text"].strip()]
            if spans:
                lines.append(spans)
        if lines:
            out.append({"bbox": b["bbox"], "lines": lines})
    return out


def columns(bs, gap=40.0):
    """블록 x0 를 단으로 묶어 (단번호, y) 순 정렬 = 사람이 읽는 순서."""
    if not bs:
        return []
    xs = sorted({round(b["bbox"][0], 1) for b in bs})
    edges, cur = [], [xs[0]]
    for x in xs[1:]:
        if x - cur[-1] > gap:
            edges.append(cur)
            cur = []
        cur.append(x)
    edges.append(cur)
    starts = [min(g) for g in edges]

    def col_of(b):
        x0 = b["bbox"][0]
        return min(range(len(starts)), key=lambda i: abs(starts[i] - x0))

    return sorted(bs, key=lambda b: (col_of(b), b["bbox"][1]))


def parse_venues(page):
    venues = []
    for b in columns(blocks(page)):
        first = b["lines"][0]
        if not any("SemiBold" in s["font"] for s in first):
            continue
        name = "".join(s["text"] for s in first).strip()
        rest = " ".join("".join(s["text"] for s in ln) for ln in b["lines"][1:])
        rest = re.sub(r"\s+", " ", rest).strip()
        if not rest:
            continue
        note = None
        if "|" in rest:
            rest, note = [p.strip() for p in rest.split("|", 1)]
        parts = [p.strip() for p in rest.split(" - ")]
        comuna = next((p for p in parts if p.lower().startswith("comuna")), None)
        parts = [p for p in parts if p != comuna]
        venues.append({
            "name": name,
            "address": parts[0] if parts else rest,
            "neighborhood": parts[1] if len(parts) > 1 else None,
            "comuna": comuna,
            **({"note": note} if note else {}),
        })
    return venues


def parse_ticket_policy(page):
    """공연장 그룹 -> 정책. 굵은 글씨가 그룹 이름, 이어지는 본문이 정책."""
    groups, cur = [], None
    for b in columns(blocks(page)):
        for line in b["lines"]:
            text = re.sub(r"\s+", " ", "".join(s["text"] for s in line)).strip()
            if not text or text == "POLÍTICA DE ENTRADAS":
                continue
            bold = any("Bold" in s["font"] or "SemiBold" in s["font"] for s in line)
            if bold:
                if cur is None or cur["policy_es"]:
                    cur = {"venues_raw": text, "policy_es": "", "policy_en": ""}
                    groups.append(cur)
                else:
                    cur["venues_raw"] += " " + text
            elif cur is not None:
                # 스페인어 문단이 먼저, 그 다음이 영어 번역
                target = "policy_en" if _looks_english(text) else "policy_es"
                cur[target] = (cur[target] + " " + text).strip()
    for g in groups:
        g["venues_raw"] = re.sub(r"\s+", " ", g["venues_raw"]).strip()
    return [g for g in groups if g["policy_es"] or g["policy_en"]]


def _looks_english(text):
    low = text.lower()
    if low.startswith(("free admission", "tickets are", "workshops requiring",
                       "classes and seminars")):
        return True
    hits = sum(low.count(w) for w in
               (" the ", "free admission", "reservation", "tickets", "registration",
                " with ", " at ", "prior", "capacity"))
    return hits >= 2


def parse_schedule(doc):
    days, current = [], None
    for page in doc:
        for b in columns(blocks(page)):
            first_text = re.sub(r"\s+", " ", "".join(s["text"] for s in b["lines"][0])).strip()
            sizes = {s["size"] for ln in b["lines"] for s in ln}

            m = DAY_RE.match(first_text.upper())
            if m and 9.0 in sizes:
                if "CONT" in first_text.upper():
                    continue                     # 이어짐 표시 — 날짜가 바뀌는 게 아니다
                current = {"weekday_es": m.group(1), "day": int(m.group(2)), "events": []}
                days.append(current)
                continue
            if current is None:
                continue

            event = _parse_event(b)
            if event:
                current["events"].append(event)
    return days


def _parse_event(b):
    """블록 -> {시간, 장소, 분류, 제목}.

    보통 항목과 강조 항목(개막·결승 등)이 서로 다른 글꼴·크기를 쓰기 때문에
    글꼴에 기대지 않고 줄 구조로만 가른다:
        [시간 + 장소] / [분류(전부 대문자)] / [제목...]
    """
    lines = [re.sub(r"\s+", " ", "".join(s["text"] for s in ln)).strip() for ln in b["lines"]]
    lines = [ln for ln in lines if ln]
    if not lines:
        return None

    m = TIME_RE.match(lines[0])
    if not m:
        return None
    time_txt = m.group(0).strip()
    head = lines[0][m.end():].strip()

    cat_idx = next((i for i, ln in enumerate(lines)
                    if i > 0 and _is_category(ln)), None)
    if cat_idx is None:
        return None
    category = lines[cat_idx]

    venue = " ".join([head] + lines[1:cat_idx]).strip()
    title = " ".join(lines[cat_idx + 1:]).strip()
    return {
        "time": time_txt.replace(" h", "h"),
        "venue": re.sub(r"\s+", " ", venue).strip(" ,."),
        "category": category,
        "category_ko": CATEGORY_KO.get(category),
        "title": re.sub(r"\s+", " ", title).strip(),
    }


def _is_category(text):
    """분류 줄인가 — 아는 분류이거나, 전부 대문자인 줄.

    장소 이름 끝에 붙는 '(CETBA)' 같은 대문자 조각을 분류로 오인하지 않도록
    괄호로 시작하거나 너무 짧은 줄은 제외한다.
    """
    if text in CATEGORY_KO:
        return True
    if len(text) < 5 or text.startswith("(") or TIME_RE.match(text):
        return False
    letters = [c for c in text if c.isalpha()]
    return bool(letters) and all(c.isupper() for c in letters)


def main():
    doc = pymupdf.open(PDF)
    venues = parse_venues(doc[3])
    policy = parse_ticket_policy(doc[2])

    # 정책 그룹의 공연장 나열은 줄바꿈으로 끊겨 있어 그대로 쪼갤 수 없다.
    # 앞서 뽑은 공연장 이름과 대조해 실제로 등장하는 곳만 골라낸다.
    names = sorted((v["name"] for v in venues), key=len, reverse=True)
    for g in policy:
        raw = g["venues_raw"]
        g["venues"] = [n for n in names if n.lower() in raw.lower()]
        g["venues"].sort(key=lambda n: raw.lower().index(n.lower()))
    days = parse_schedule(doc)

    # 일 번호 -> 실제 날짜 (8/19 시작, 31 다음은 9월). 요일 이름으로 검산한다.
    cur = FESTIVAL_START
    mismatches = []
    for d in days:
        while cur.day != d["day"]:
            cur += timedelta(days=1)
            if (cur - FESTIVAL_START).days > 40:
                sys.exit(f"날짜를 맞추지 못했습니다: {d['weekday_es']} {d['day']}")
        d["date"] = cur.isoformat()
        d["weekday_ko"] = WEEKDAY_KO[cur.weekday()]
        if WEEKDAYS_ES.get(d["weekday_es"]) != cur.weekday():
            mismatches.append(f"{d['weekday_es']} {d['day']} -> {cur.isoformat()}")

    if mismatches:
        sys.exit("요일이 맞지 않습니다 (날짜 매핑 오류): " + ", ".join(mismatches))

    days.sort(key=lambda d: d["date"])
    competition = [
        {"date": d["date"], "weekday_ko": d["weekday_ko"], **e}
        for d in days for e in d["events"] if e["category"] == "MUNDIAL DE BAILE"
    ]

    out = {
        "generated_by": "scripts/build_mundial_2026_festival.py",
        "source": "Tango BA Festival y Mundial 2026 공식 「Día x Día」 프로그램 (tangoba.org)",
        "festival": {
            "name": "Tango BA Festival y Mundial 2026",
            "start": days[0]["date"], "end": days[-1]["date"],
            "city": "Buenos Aires",
        },
        "venues": venues,
        "ticket_policy": policy,
        "competition_schedule": competition,
        "days": days,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    total = sum(len(d["events"]) for d in days)
    print(f"  {os.path.relpath(OUT, ROOT)} 생성")
    print(f"  기간 {out['festival']['start']} ~ {out['festival']['end']} · "
          f"{len(days)}일 · 이벤트 {total}건")
    print(f"  공연장 {len(venues)}곳 · 입장정책 {len(policy)}그룹 · 대회 일정 {len(competition)}건")


if __name__ == "__main__":
    main()
