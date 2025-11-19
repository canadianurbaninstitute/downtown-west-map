#!/usr/bin/env node
// Fetch Toronto's Version 3 JSON feed, filter by your polygon and times,
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
    : {                 // assume it's a bare geometry
      type: 'Feature',
      geometry: raw
    };

const OUT_PATH = path.join('data', 'road-restrictions.geojson');

async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching data (attempt ${attempt}/${maxRetries})...`);
      const resp = await fetch(url);
      
      // Log response details
      console.log(`Response status: ${resp.status} ${resp.statusText}`);
      console.log(`Content-Type: ${resp.headers.get('content-type')}`);
      
      // Check if response is OK
      if (!resp.ok) {
        const text = await resp.text();
        console.error(`HTTP Error ${resp.status}:`, text.substring(0, 500));
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      // Check content type
      const contentType = resp.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await resp.text();
        console.error('Non-JSON response received:', text.substring(0, 500));
        throw new Error(`Expected JSON, got ${contentType}`);
      }
      
      return resp;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait 2s, 4s, 6s
      const waitTime = 2000 * attempt;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

async function main() {
  const resp = await fetchWithRetry(FEED_URL);
  const json = await resp.json();
  
  // Adjust this if the feed nests elsewhere:
  const records = json.Closure || json.result?.records || [];
  console.log(`Found ${records.length} total records`);
  
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

  console.log(`Filtered to ${pts.length} points in polygon`);
  
  // Don't write empty results
  if (pts.length === 0) {
    console.warn('WARNING: No points found after filtering. Not updating file.');
    process.exit(1);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(turf.featureCollection(pts), null, 2));
  console.log(`Successfully wrote ${pts.length} features to ${OUT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1) });