"""Analyze the free-text "Code distribution" campaign labels to figure out
how much of a real distribution_slot date can be recovered automatically,
and where the client needs to confirm.

The source mixes two incompatible date conventions inside the same column
with no marker to tell them apart on their own:
  - "RIBANJOU 24/05" / "PEP APIE ... 21/03"  -> day/month (DD/MM)
  - "PETITE HAIE 02/25" / "LA TOURNEE ... 03/25" -> month/year (MM/YY)
The two can only be told apart here because one of the two numbers is
always > 12 in this dataset (forces which slot is the day). That is a
coincidence of this particular export, not a rule to trust blindly.

`distribution_slots` also requires location_name/start_time/end_time,
none of which exist anywhere in the source for ANY campaign — the per-row
town/postal code is the beneficiary's home town, not the distribution
pickup location (checked: no campaign concentrates in a single town). So
every campaign, including the ones with a confident date, still needs the
client to fill in a location and time before a real Slot can be created.

Usage: python3 scripts/data-prep/analyze_event_dates.py
(run after prepare_distributions.py, which generates the input files)
"""

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RECORDS = ROOT / "data" / "prepared" / "distribution_records.csv"
NO_EMAIL = ROOT / "data" / "prepared" / "no_email_beneficiaries.csv"
OUT = ROOT / "data" / "prepared" / "distribution_events_review.csv"

DATE_RE = re.compile(r"(\d{1,2})/(\d{1,2})")
FRENCH_MONTHS = {
    "janvier": 1, "fevrier": 2, "février": 2, "mars": 3, "avril": 4, "mai": 5,
    "juin": 6, "juillet": 7, "aout": 8, "août": 8, "septembre": 9,
    "octobre": 10, "novembre": 11, "decembre": 12, "décembre": 12,
}
YEAR_RE = re.compile(r"\b(20\d{2})\b")


def detect(code, annee_hint):
    m = DATE_RE.search(code)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        if a > 12 and 1 <= b <= 12:
            year = annee_hint.split("-")[0] if annee_hint else ""
            return "jour/mois (DD/MM)", f"{year}-{b:02d}-{a:02d}" if year else "", "high", ""
        if b > 12 and 1 <= a <= 12:
            year = 2000 + b
            return "mois/annee (MM/YY)", f"{year}-{a:02d}", "medium", "jour exact non recuperable, mois seul"
        return "ambigu", "", "low", f"chiffres {a:02d}/{b:02d} tous les deux <=12, DD/MM ou MM/YY indecidable"

    for name, month in FRENCH_MONTHS.items():
        if re.search(rf"\b{name}\b", code.lower()):
            ym = YEAR_RE.search(code)
            year = ym.group(1) if ym else annee_hint.split("-")[0]
            return "mois nomme", f"{year}-{month:02d}", "medium", "jour exact non recuperable, mois seul"

    ym = YEAR_RE.search(code)
    if ym:
        return "annee seule", ym.group(1), "low", "ni mois ni jour recuperable"

    return "aucune info", "", "none", "code purement descriptif, aucune date exploitable"


def main():
    with open(RECORDS, encoding="utf-8") as f:
        records = list(csv.DictReader(f))
    with open(NO_EMAIL, encoding="utf-8") as f:
        records += list(csv.DictReader(f))

    events = {}
    for r in records:
        code = r["code_distribution"] or "(sans code)"
        e = events.setdefault(code, {"n_records": 0, "annees": set()})
        e["n_records"] += 1
        e["annees"].add(r["annee"])

    out_rows = []
    for code, e in sorted(events.items(), key=lambda kv: -kv[1]["n_records"]):
        annee_hint = sorted(e["annees"])[0]
        convention, guess, confidence, notes = detect(code, annee_hint)
        out_rows.append(
            {
                "code": code,
                "n_records": e["n_records"],
                "annee_source": "|".join(sorted(e["annees"])),
                "convention_detectee": convention,
                "date_devinee": guess,
                "confidence": confidence,
                "notes": notes,
                "date_confirmee_client": "",
                "location_name_client": "",
                "address_client": "",
                "start_time_client": "",
                "end_time_client": "",
            }
        )

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "code", "n_records", "annee_source", "convention_detectee",
                "date_devinee", "confidence", "notes", "date_confirmee_client",
                "location_name_client", "address_client", "start_time_client",
                "end_time_client",
            ],
        )
        writer.writeheader()
        writer.writerows(out_rows)
    print(f"wrote {len(out_rows):5d} rows -> {OUT.relative_to(ROOT)}")

    by_confidence = {}
    for r in out_rows:
        by_confidence.setdefault(r["confidence"], []).append(r["n_records"])
    for level in ("high", "medium", "low", "none"):
        rows = by_confidence.get(level, [])
        print(f"{level:6s}: {len(rows):2d} campagnes / {sum(rows):5d} lignes de distribution")


if __name__ == "__main__":
    main()
