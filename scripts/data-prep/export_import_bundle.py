"""Build data/prepared/import_bundle.json, the input of backend/priv/repo/import_distribution_data.exs.

Palier 1 only: taxon categories, taxa, users, planting projects. Distributions
(events/slots/reservations) wait for the client's dates and locations.

Run after prepare_distributions.py and enrich_taxa.py.

The DB has a unique index on taxa.scientific_name, so taxa that share one
(same species under two vernacular names) are merged here: the most used
label wins, the others are kept as aliases in `notes`. `taxon_aliases` maps
every merged temp_id to the surviving one, for the later distributions import.
"""

import csv
import json
from pathlib import Path

PREPARED = Path(__file__).resolve().parents[2] / "data" / "prepared"

# beneficiaire_type_raw -> Project.management_type
MANAGEMENT_TYPES = {
    "Particulier": "individual",
    "Tiers-lieu / Projet collectif": "collective",
    "Agriculteur": "farmer",
    "École": "school",
    "Copro": "condominium",
    "Espace public": "public_space",
}


def read(name):
    with open(PREPARED / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def merge_taxa(rows):
    by_sci = {}
    for r in rows:
        if r["scientific_name"]:
            by_sci.setdefault(r["scientific_name"], []).append(r)

    aliases = {}  # merged temp_id -> surviving temp_id
    extra_notes = {}  # surviving temp_id -> [merged common names]
    for group in by_sci.values():
        if len(group) < 2:
            continue
        group.sort(key=lambda r: -int(r["source_nb_arbre"] or 0))
        keep = group[0]
        for other in group[1:]:
            aliases[other["temp_id"]] = keep["temp_id"]
            extra_notes.setdefault(keep["temp_id"], []).append(other["common_name"])

    taxa = []
    for r in rows:
        if r["temp_id"] in aliases:
            continue
        notes = r["notes"]
        merged = extra_notes.get(r["temp_id"])
        if merged:
            notes = f"{notes} Aussi appelé : {', '.join(merged)}.".strip()
        taxa.append(
            {
                "temp_id": r["temp_id"],
                "common_name": r["common_name"],
                "scientific_name": r["scientific_name"] or None,
                "taxonomic_level": r["taxonomic_level"] or None,
                "is_non_taxonomic": r["is_non_taxonomic"] == "True",
                "parent_temp_id": aliases.get(r["parent_temp_id"], r["parent_temp_id"]) or None,
                "category_slug": r["category_slug"] or None,
                "notes": notes or None,
            }
        )
    return taxa, aliases


def main():
    taxa, aliases = merge_taxa(read("taxa_enriched.csv"))
    users = [
        {
            "temp_id": r["temp_id"],
            "email": r["email"].strip().lower(),
            "first_name": r["first_name"] or None,
            "last_name": r["last_name"] or None,
        }
        for r in read("users.csv")
    ]
    projects = []
    for r in read("planting_projects.csv"):
        address = " ".join(p for p in (r["postal_code"], r["address"]) if p)
        projects.append(
            {
                "temp_id": r["temp_id"],
                "owner_temp_id": r["owner_temp_id"],
                "name": r["name"],
                "management_type": MANAGEMENT_TYPES[r["beneficiaire_type_raw"]],
                "address": address or None,
            }
        )
    bundle = {
        "categories": read("taxon_categories.csv"),
        "taxa": taxa,
        "taxon_aliases": aliases,
        "users": users,
        "projects": projects,
    }
    out = PREPARED / "import_bundle.json"
    out.write_text(json.dumps(bundle, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"{out}: {len(bundle['categories'])} categories, {len(taxa)} taxa "
        f"({len(aliases)} merged), {len(users)} users, {len(projects)} projects"
    )


if __name__ == "__main__":
    main()
