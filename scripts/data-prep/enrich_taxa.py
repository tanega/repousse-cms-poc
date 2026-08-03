"""Enrich data/prepared/taxa.csv with scientific name + taxonomic rank
(genus/species/variety), building a genus->species->variety hierarchy
where the Typologie sheet lists several species of the same genus
(chene, erable, saule, viorne...).

Botanical calls are the author's best-effort horticultural knowledge for
common French hedgerow/orchard names, not a validated flora reference.
Every row has a `confidence` (high/medium/low) and `notes` column —
review anything below `high` before importing into `taxa`.

Usage: python3 scripts/data-prep/enrich_taxa.py
(run after prepare_distributions.py, which generates the input taxa.csv)
"""

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "data" / "prepared" / "taxa.csv"
OUT = ROOT / "data" / "prepared" / "taxa_enriched.csv"

# common_name -> (scientific_name, level, parent_common_name, confidence, notes)
# level is one of: genus, species, variety, None (non-taxonomic placeholder)
ENRICHMENT = {
    "Abricotier": ("Prunus armeniaca", "species", None, "high", ""),
    "Ajonc": ("Ulex europaeus", "species", None, "high", ""),
    "Albisia": ("Albizia julibrissin", "species", None, "high", "orthographe usuelle du nom scientifique Albizia"),
    "Alisier": ("Sorbus torminalis", "species", None, "medium", "alisier torminal le plus courant en haie; peut aussi designer Sorbus aria (alisier blanc)"),
    "Althéa": ("Hibiscus syriacus", "species", None, "high", "vrai doublon (meme rang espece) avec 'Hibiscus' plus bas, pas une distinction genre/espece"),
    "Amandier": ("Prunus dulcis", "species", None, "high", ""),
    "Amelanchier": ("Amelanchier", "genus", None, "low", "espece non precisee (A. ovalis, A. lamarckii, A. alnifolia possibles)"),
    "Arbousier": ("Arbutus unedo", "species", None, "high", ""),
    "Arbre surprise": (None, None, None, "high", "non taxonomique: lot surprise, pas une espece"),
    "Argousier": ("Hippophae rhamnoides", "species", None, "high", ""),
    "Aronia": ("Aronia melanocarpa", "species", None, "high", ""),
    "Aubepine": ("Crataegus monogyna", "species", None, "medium", "espece la plus courante; Crataegus laevigata possible"),
    "Aulne": ("Alnus glutinosa", "species", None, "high", ""),
    "Avocatier": ("Persea americana", "species", None, "high", ""),
    "Berberis": ("Berberis", "genus", None, "low", "espece ornementale non precisee (B. vulgaris, B. thunbergii...)"),
    "Bignone": ("Campsis radicans", "species", None, "medium", ""),
    "Bouleau": ("Betula pendula", "species", None, "high", ""),
    "Brugnon": ("Prunus persica var. nucipersica", "variety", "Pêcher", "medium", "brugnon = variete a chair adherente au noyau, meme groupe que la nectarine"),
    "Buis": ("Buxus sempervirens", "species", None, "high", ""),
    "Cassis": ("Ribes nigrum", "species", None, "high", ""),
    "Cerisier": ("Prunus avium", "species", None, "medium", "formes cultivees du merisier; Prunus cerasus (griottier) possible aussi"),
    "Charme": ("Carpinus", "genus", None, "medium", "genre parent; pas un doublon de 'Charme commun' mais le rang genre (voir aussi Charme-houblon, Ostrya carpinifolia, autre genre parfois confondu)"),
    "Charme commun": ("Carpinus betulus", "species", "Charme", "high", ""),
    "Chataignier": ("Castanea sativa", "species", None, "high", ""),
    "Chêne (non précisé)": ("Quercus", "genus", None, "high", "genre parent des chenes ci-dessous"),
    "Chêne Américain": ("Quercus rubra", "species", "Chêne (non précisé)", "high", ""),
    "Chêne des Marais": ("Quercus palustris", "species", "Chêne (non précisé)", "high", ""),
    "Chêne chevelu": ("Quercus cerris", "species", "Chêne (non précisé)", "high", ""),
    "Chêne liege": ("Quercus suber", "species", "Chêne (non précisé)", "high", ""),
    "Chêne pédonculé": ("Quercus robur", "species", "Chêne (non précisé)", "high", ""),
    "Chêne S/P": ("Quercus", "genus", None, "medium", "sessile ou pedoncule non distingue a la distribution"),
    "Chêne sessile": ("Quercus petraea", "species", "Chêne (non précisé)", "high", ""),
    "Chêne tauzin": ("Quercus pyrenaica", "species", "Chêne (non précisé)", "high", ""),
    "Chêne vert": ("Quercus ilex", "species", "Chêne (non précisé)", "high", ""),
    "Chèvrefeuille": ("Lonicera periclymenum", "species", None, "medium", "chevrefeuille des bois, le plus courant en haie"),
    "Citronnier": ("Citrus limon", "species", None, "high", ""),
    "Cormier": ("Sorbus domestica", "species", None, "high", ""),
    "Cornouiller": ("Cornus", "genus", None, "medium", "genre parent; espece non precisee"),
    "Cornouiller sanguin": ("Cornus sanguinea", "species", "Cornouiller", "high", ""),
    "Cornouiller mâle": ("Cornus mas", "species", "Cornouiller", "high", ""),
    "Costonaer": ("Cotoneaster", "genus", None, "high", "vrai doublon (meme rang genre): coquille orthographique pour 'Cotoneaster' dans le fichier source Typologie, a fusionner"),
    "Cyprès": ("Cupressus", "genus", None, "low", "espece non precisee (C. sempervirens, x Cuprocyparis leylandii en haie...)"),
    "Eglantier": ("Rosa canina", "species", None, "high", ""),
    "Eleagnus": ("Elaeagnus", "genus", None, "medium", "cultivars ornementaux non precises (souvent E. x ebbingei)"),
    "Epinette": ("Picea", "genus", None, "low", "terme peu usite en France metropolitaine (frequent au Quebec pour epicea) - a verifier avec le client"),
    "Erable": ("Acer", "genus", None, "high", "genre parent des erables ci-dessous"),
    "Erable champêtre": ("Acer campestre", "species", "Erable", "high", ""),
    "Erable de montpellier": ("Acer monspessulanum", "species", "Erable", "high", ""),
    "Figuier": ("Ficus carica", "species", None, "high", ""),
    "Fragonette": (None, None, None, "low", "identification incertaine - peut-etre 'fragon' (Ruscus aculeatus) - a verifier avec le client"),
    "Framboisier": ("Rubus idaeus", "species", None, "high", ""),
    "Frêne": ("Fraxinus", "genus", None, "high", "genre parent; pas un doublon de 'Frene commun' mais le rang genre (Fraxinus Tourn. ex L. vs Fraxinus excelsior L., 1753 - cf. GBIF https://www.gbif.org/fr/taxon/8VXQ9)"),
    "Frêne commun": ("Fraxinus excelsior", "species", "Frêne", "high", ""),
    "Frêne à fleur": ("Fraxinus ornus", "species", "Frêne", "high", ""),
    "Fusain": ("Euonymus", "genus", None, "medium", "genre parent; pas un doublon de 'Fusain d'Europe' mais le rang genre (le genre inclut aussi Euonymus japonicus, tres courant en haie ornementale)"),
    "Fusain d'Europe": ("Euonymus europaeus", "species", "Fusain", "high", ""),
    "Genet": ("Cytisus scoparius", "species", None, "medium", "genet a balai, le plus courant"),
    "Genevrier": ("Juniperus communis", "species", None, "high", ""),
    "Gingko": ("Ginkgo biloba", "species", None, "high", ""),
    "Glycine": ("Wisteria sinensis", "species", None, "medium", "Wisteria floribunda possible aussi"),
    "Goji - Lyciet": ("Lycium barbarum", "species", None, "high", ""),
    "Groseiller": ("Ribes rubrum", "species", None, "medium", "groseille rouge/blanche generique"),
    "Groseiller à maquereaux": ("Ribes uva-crispa", "species", None, "high", ""),
    "Hetre": ("Fagus sylvatica", "species", None, "high", ""),
    "Hibiscus": ("Hibiscus syriacus", "species", None, "high", "vrai doublon (meme rang espece): meme espece que 'Althea' sous un autre nom d'usage, pas une distinction genre/espece (genre Hibiscus non exploite ici pour d'autres especes)"),
    "Houx": ("Ilex aquifolium", "species", None, "high", ""),
    "IF": ("Taxus baccata", "species", None, "high", "'if' est le nom francais courant de Taxus baccata"),
    "Inconnu": (None, None, None, "high", "non taxonomique: espece non identifiee a la distribution"),
    "Jasmins": ("Jasminum officinale", "species", None, "medium", "jasmin commun, le plus courant en grimpante"),
    "Kiwi": ("Actinidia deliciosa", "species", None, "high", ""),
    "Laurier": ("Prunus laurocerasus", "species", None, "low", "contexte haie: probablement laurier-cerise plutot que laurier-sauce (Laurus nobilis) - a confirmer avec le client"),
    "Laurier tin": ("Viburnum tinus", "species", None, "high", "vrai doublon (meme rang espece) avec 'Viorne tin', deux traditions de nom vernaculaire pour la meme espece, pas une distinction genre/espece"),
    "Lilas": ("Syringa vulgaris", "species", None, "high", ""),
    "Liquidambar": ("Liquidambar styraciflua", "species", None, "high", ""),
    "Mahonia": ("Mahonia aquifolium", "species", None, "high", ""),
    "Maquis": (None, None, None, "high", "non taxonomique: formation vegetale mediterraneenne, pas une espece"),
    "Maquis du Chili": ("Aristotelia chilensis", "species", None, "low", "peut-etre 'maqui' (mal orthographie/entendu) plutot que 'maquis' - a verifier avec le client"),
    "Marronnier": ("Aesculus hippocastanum", "species", None, "high", ""),
    "Meliosma": ("Meliosma", "genus", None, "low", "espece non precisee, genre ornemental asiatique"),
    "Merisier": ("Prunus avium", "species", None, "high", "forme sauvage du cerisier, meme espece Prunus avium"),
    "Mimosa": ("Acacia dealbata", "species", None, "high", ""),
    "Mirabelles": ("Prunus domestica subsp. syriaca", "variety", "Prunier", "medium", ""),
    "Murier": ("Morus nigra", "species", None, "low", "murier noir suppose (fruitier); Morus alba possible"),
    "Myrtillier": ("Vaccinium corymbosum", "species", None, "medium", "myrtille cultivee supposee; Vaccinium myrtillus (sauvage) possible"),
    "Nashi": ("Pyrus pyrifolia", "species", None, "high", ""),
    "Nectarine": ("Prunus persica var. nucipersica", "variety", "Pêcher", "high", "meme groupe varietal que 'Brugnon'"),
    "Neflier": ("Mespilus germanica", "species", None, "high", ""),
    "Nerprun": ("Rhamnus cathartica", "species", None, "medium", "Frangula alnus (bourdaine) parfois aussi appele nerprun"),
    "Noisetier": ("Corylus avellana", "species", None, "high", ""),
    "Noisetier tortueux": ("Corylus avellana 'Contorta'", "variety", "Noisetier", "high", ""),
    "Noyer": ("Juglans regia", "species", None, "high", ""),
    "Olivier": ("Olea europaea", "species", None, "high", ""),
    "Orme": ("Ulmus", "genus", None, "medium", "genre parent; cultivars resistants a la graphiose souvent utilises aujourd'hui"),
    "Orme champêtre": ("Ulmus minor", "species", "Orme", "high", ""),
    "Pêcher": ("Prunus persica", "species", None, "high", "parent varietal de 'Brugnon', 'Nectarine', 'Pecher de vigne'"),
    "Pêcher de vigne": ("Prunus persica (groupe 'de vigne')", "variety", "Pêcher", "medium", "groupe varietal traditionnel cultive autrefois en bordure de vigne"),
    "Peuplier": ("Populus", "genus", None, "low", "espece/hybride non precise (P. nigra, P. x canadensis...)"),
    "Photinia": ("Photinia x fraseri", "species", None, "high", ""),
    "Pin": ("Pinus", "genus", None, "medium", "genre parent du pin maritime ci-dessous"),
    "Pin maritime": ("Pinus pinaster", "species", "Pin", "high", ""),
    "Piracantha": ("Pyracantha coccinea", "species", None, "high", "vrai doublon (meme rang espece): variante orthographique de 'Pyracantha', pas une distinction genre/espece"),
    "Pittosporum": ("Pittosporum tobira", "species", None, "medium", "espece ornementale la plus courante du genre"),
    "Poirier": ("Pyrus communis", "species", None, "high", ""),
    "Poivrier": ("Zanthoxylum", "genus", None, "medium", "genre parent des poivres sichuan/timut ci-dessous"),
    "Poivrier sichuan": ("Zanthoxylum simulans", "species", "Poivrier", "medium", "Zanthoxylum bungeanum egalement vendu sous ce nom"),
    "Poivrier timut": ("Zanthoxylum armatum", "species", "Poivrier", "medium", ""),
    "Pommier": ("Malus domestica", "species", None, "high", ""),
    "Prunelier": ("Prunus spinosa", "species", None, "high", "vrai doublon exact (meme rang espece) avec 'Prunelier (spinosa)'"),
    "Prunelier (spinosa)": ("Prunus spinosa", "species", None, "high", "vrai doublon exact (meme rang espece) avec 'Prunelier' - l'epithete spinosa est deja precisee dans le nom vernaculaire lui-meme"),
    "Prunier": ("Prunus domestica", "species", None, "high", "parent varietal de 'Mirabelles', 'Quetches'"),
    "Prunus": ("Prunus", "genus", None, "medium", "entree generique deja presente dans le fichier source pour les Prunus non precises (ex. pruniers d'ornement)"),
    "Pyracantha": ("Pyracantha coccinea", "species", None, "high", "vrai doublon (meme rang espece): variante orthographique de 'Piracantha', pas une distinction genre/espece"),
    "Quetches": ("Prunus domestica subsp. domestica", "variety", "Prunier", "medium", "groupe varietal 'quetsche'"),
    "Raisinier": (None, None, None, "low", "identification incertaine - pas de correspondance botanique standard fiable en contexte metropolitain, a verifier avec le client"),
    "Ronce du tibet": ("Rubus tibetanus", "species", None, "high", ""),
    "Saule": ("Salix", "genus", None, "high", "genre parent des saules ci-dessous"),
    "Saule marsault": ("Salix caprea", "species", "Saule", "high", ""),
    "Saule osier": ("Salix viminalis", "species", "Saule", "high", ""),
    "Saule tortueux": ("Salix matsudana 'Tortuosa'", "variety", "Saule", "high", ""),
    "Sorbier": ("Sorbus aucuparia", "species", None, "high", ""),
    "Sureau": ("Sambucus", "genus", None, "medium", "genre parent; pas un doublon de 'Sureau noir' mais le rang genre (le genre inclut aussi Sambucus ebulus, le sureau yeble/hieble, espece differente)"),
    "Sureau noir": ("Sambucus nigra", "species", "Sureau", "high", ""),
    "Thuya": ("Thuja", "genus", None, "medium", "espece non precisee (T. occidentalis, T. plicata en haie)"),
    "Tilleul": ("Tilia", "genus", None, "medium", "espece non precisee (T. cordata, T. platyphyllos, T. x europaea)"),
    "Troene": ("Ligustrum", "genus", None, "medium", "genre parent; pas un doublon de 'Troene commun' mais le rang genre (le genre inclut aussi Ligustrum ovalifolium, tres courant en haie)"),
    "Troene commun": ("Ligustrum vulgare", "species", "Troene", "high", ""),
    "Tulipier de Virginie": ("Liriodendron tulipifera", "species", None, "high", ""),
    "Vigne": ("Vitis vinifera", "species", None, "high", ""),
    "Viorne": ("Viburnum", "genus", None, "high", "genre parent des viornes ci-dessous"),
    "Viorne lantana": ("Viburnum lantana", "species", "Viorne", "high", ""),
    "Viorne obier": ("Viburnum opulus", "species", "Viorne", "high", ""),
    "Viorne tin": ("Viburnum tinus", "species", "Viorne", "high", "vrai doublon (meme rang espece) avec 'Laurier tin', deux traditions de nom vernaculaire pour la meme espece, pas une distinction genre/espece"),
    "Consoude": ("Symphytum officinale", "species", None, "high", "plante herbacee compagne, pas un arbre/arbuste - la categorisation Typologie (arbres/arbustes/...) ne s'applique pas bien ici"),
    "Cotoneaster": ("Cotoneaster", "genus", None, "high", "vrai doublon (meme rang genre) avec 'Costonaer', coquille du fichier source, a fusionner"),
}


def main():
    with open(SOURCE, encoding="utf-8") as f:
        taxa = list(csv.DictReader(f))

    temp_ids = {row["common_name"]: f"T{i + 1:04d}" for i, row in enumerate(taxa)}

    out_rows = []
    for row in taxa:
        name = row["common_name"]
        entry = ENRICHMENT.get(name)
        if entry is None:
            raise SystemExit(f"no enrichment defined for {name!r}")
        scientific_name, level, parent_name, confidence, notes = entry
        out_rows.append(
            {
                "temp_id": temp_ids[name],
                "common_name": name,
                "scientific_name": scientific_name or "",
                "taxonomic_level": level or "",
                "is_non_taxonomic": scientific_name is None,
                "parent_temp_id": temp_ids.get(parent_name, ""),
                "category_slug": row["category_slug"],
                "confidence": confidence,
                "notes": notes,
                "source_nb_arbre": row["source_nb_arbre"],
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "temp_id", "common_name", "scientific_name", "taxonomic_level",
                "is_non_taxonomic", "parent_temp_id", "category_slug",
                "confidence", "notes", "source_nb_arbre",
            ],
        )
        writer.writeheader()
        writer.writerows(out_rows)
    print(f"wrote {len(out_rows):5d} rows -> {OUT.relative_to(ROOT)}")

    low = [r for r in out_rows if r["confidence"] == "low"]
    dup_notes = [r for r in out_rows if "vrai doublon" in r["notes"]]
    genus_species_notes = [r for r in out_rows if "pas un doublon" in r["notes"]]
    print(f"confidence low        : {len(low)} ({', '.join(r['common_name'] for r in low)})")
    print(f"vrais doublons        : {len(dup_notes)} ({len(dup_notes)//2} paires)")
    print(f"paires genre/espece   : {len(genus_species_notes)} (pas des doublons, ex. Frene/Frene commun)")


if __name__ == "__main__":
    main()
