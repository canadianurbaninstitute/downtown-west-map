#!/usr/bin/env node
// Fetch Toronto’s Version 3 JSON feed, filter by your polygon and times,
// drop records without lat/long, emit a GeoJSON for MapLibre.

import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf'

// 1. Replace with your actual RESTful JSON URL (Version 3 feed)
const FEED_URL = 'https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=json';

const raw = JSON.parse(
  fs.readFileSync(path.join('data', 'downtown-west.geojson')));
const POLY = raw.type === 'FeatureCollection'
  ? raw.features[0]     // first feature in the collection
  : raw.type === 'Feature'
    ? raw               // already a Feature
    : {                 // assume it’s a bare geometry
      type: 'Feature',
      geometry: raw
    };

const OUT_PATH = path.join('data', 'road-restrictions.geojson');

async function main() {
  const resp = await fetch(FEED_URL);
  const json = await resp.json();
  // Adjust this if the feed nests elsewhere:
  const records = json.Closure || json.result?.records || [];
  const now = Date.now();

  const pts = records
    .filter(r => r.latitude && r.longitude)            // must have coords
    .filter(r => +r.endTime >= now)                    // current or upcoming
    .map(r => {
      const pt = turf.point(
        [parseFloat(r.longitude), parseFloat(r.latitude)],
        {
          WorkEventType: r.workEventType,
          Contractor: r.contractor,
          PermitType: r.permitType,
          Description: r.description,
          Type: r.type,
          maxImpact: r.maxImpact,
          StartTime: new Date(Number(r.startTime)).toLocaleString(),
          EndTime: new Date(Number(r.endTime)).toLocaleString()
        }
      );
      return turf.booleanPointInPolygon(pt, POLY) ? pt : null;
    })
    .filter(Boolean);

  fs.writeFileSync(OUT_PATH, JSON.stringify(turf.featureCollection(pts), null, 2));
}

main().catch(err => { console.error(err); process.exit(1) });
