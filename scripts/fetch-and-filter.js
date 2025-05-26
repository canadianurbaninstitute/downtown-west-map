#!/usr/bin/env node
// Fetch Toronto’s Version 3 JSON feed, filter by your polygon and times,
// drop records without lat/long, emit a GeoJSON for MapLibre.

import fs from 'fs';
import path from 'path';
import turf from '@turf/turf';

// 1. Replace with your actual RESTful JSON URL (Version 3 feed)
const FEED_URL = 'https://ckan0.cf.opendata-inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=2265bfca-e845-4613-b341-70ee2ac73fbe&limit=30000';

const POLY = JSON.parse(fs.readFileSync(path.join('data','downtown-west.geojson')));
const OUT_PATH = path.join('data','road-restrictions.geojson');

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
          Contractor:     r.contractor,
          PermitType:     r.permitType,
          Description:    r.description,
          Type:           r.type,
          MaxImpact:      +r.maxImpact
        }
      );
      return turf.booleanPointInPolygon(pt, POLY) ? pt : null;
    })
    .filter(Boolean);

  fs.writeFileSync(OUT_PATH, JSON.stringify(turf.featureCollection(pts), null, 2));
}

main().catch(err => { console.error(err); process.exit(1) });
