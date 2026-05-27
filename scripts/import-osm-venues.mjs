#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const region = getArg("--region") ?? "Auckland";
const city = getArg("--city") ?? region;
const outputFile = getArg("--output") ?? path.join(process.cwd(), ".data", "venues.json");
const limit = Number(getArg("--limit") ?? 0);

const today = new Date().toISOString().slice(0, 10);

const overpassQuery = `
[out:json][timeout:90];
area["name"="${escapeOverpass(region)}"]["boundary"="administrative"]["admin_level"~"^(4|6)$"]->.searchArea;
(
  nwr(area.searchArea)["shop"~"^(alcohol|wine)$"];
  nwr(area.searchArea)["amenity"~"^(bar|pub|biergarten)$"];
  nwr(area.searchArea)["craft"="brewery"];
  nwr(area.searchArea)["microbrewery"="yes"];
);
out center tags;
`;

const response = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "user-agent": "yourbeer-local-osm-import/0.1",
  },
  body: new URLSearchParams({ data: overpassQuery }),
});

if (!response.ok) {
  throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const imported = payload.elements
  .map((element) => toVenue(element))
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

const nextImported = limit > 0 ? imported.slice(0, limit) : imported;
const existing = await readJson(outputFile, []);
const importedIds = new Set(nextImported.map((venue) => venue.id));
const merged = [
  ...nextImported,
  ...existing.filter(
    (venue) =>
      !importedIds.has(venue.id) &&
      !(venue.region === region && venue.source?.startsWith("OpenStreetMap ")),
  ),
];

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(merged, null, 2)}\n`);

console.log(`Imported ${nextImported.length} OSM venues for ${region}.`);
console.log(`Wrote ${merged.length} total local venues to ${outputFile}.`);

function toVenue(element) {
  const tags = element.tags ?? {};
  const name = clean(tags.name);
  const lat = Number(element.lat ?? element.center?.lat);
  const lng = Number(element.lon ?? element.center?.lon);

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const type = venueType(tags);
  const suburb = clean(
    tags["addr:suburb"] ??
      tags["addr:city"] ??
      tags["addr:town"] ??
      tags["addr:village"] ??
      tags.suburb ??
      tags.neighbourhood,
  );

  return {
    id: `osm_${element.type}_${element.id}`,
    type,
    name,
    chain: clean(tags.brand ?? tags.operator) ?? null,
    address: address(tags) ?? suburb ?? city,
    suburb: suburb ?? city,
    city,
    region,
    lat,
    lng,
    phone: clean(tags["contact:phone"] ?? tags.phone) ?? null,
    website: clean(tags["contact:website"] ?? tags.website) ?? null,
    source: `OpenStreetMap ${element.type}/${element.id}`,
    checkedAt: today,
    verified: true,
  };
}

function venueType(tags) {
  if (tags.shop === "alcohol" || tags.shop === "wine") {
    return "store";
  }

  if (tags.craft === "brewery" || tags.microbrewery === "yes") {
    return "maker";
  }

  return "bar";
}

function address(tags) {
  const unit = clean(tags["addr:unit"]);
  const number = clean(tags["addr:housenumber"]);
  const street = clean(tags["addr:street"]);
  const full = clean(tags["addr:full"]);

  if (full) return full;
  if (number && street) return [unit, `${number} ${street}`].filter(Boolean).join(", ");
  if (street) return [unit, street].filter(Boolean).join(", ");
  return null;
}

function clean(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function getArg(name) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index !== -1) return process.argv[index + 1];
  return null;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function escapeOverpass(input) {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
