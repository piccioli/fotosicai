#!/usr/bin/env python3
"""
Aggiunge sicai_ref alle proprietà del GeoJSON usando il mapping CSV.
Per ogni feature con properties.id, imposta sicai_ref dal campo tappa del CSV.
"""

import csv
import json
import os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(DATA_DIR, "sentiero_italia_tappe_id_name - MAPPING.csv")
GEOJSON_PATH = os.path.join(DATA_DIR, "data.geojson")

# Leggi CSV id -> tappa
id_to_tappa = {}
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        id_val = int(row["id"])
        id_to_tappa[id_val] = row["tappa"].strip()

print(f"Mapping caricato: {len(id_to_tappa)} righe (id -> tappa)")

# Leggi GeoJSON
with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
    geojson = json.load(f)

features = geojson.get("features", [])
print(f"GeoJSON: {len(features)} features")

added = 0
missing = 0
missing_ids = []

for feature in features:
    props = feature.get("properties") or {}
    fid = props.get("id")
    if fid is None:
        continue
    num_id = int(fid) if isinstance(fid, str) else fid
    tappa = id_to_tappa.get(num_id)
    if tappa is not None:
        props["sicai_ref"] = tappa
        added += 1
    else:
        missing += 1
        missing_ids.append(num_id)

print(f"sicai_ref aggiunto: {added}")
if missing:
    print(f"Nessun match nel CSV per {missing} feature (id: {missing_ids[:10]}...)")

# Scrivi GeoJSON
with open(GEOJSON_PATH, "w", encoding="utf-8") as f:
    json.dump(geojson, f, ensure_ascii=False)

print(f"Scritto: {GEOJSON_PATH}")
