# downtown-west-map

This repository contains code for the Downtown West Road Restrictions Map. The map is hosted at https://canadianurbaninstitute.github.io/downtown-west-map/ via github pages and embedded on the [Downtown West BIA website](https://yourexperienceawaits.ca/bia-resources/).

## Project Overview

This project fetches real-time data from Toronto's Open Data feed about road restrictions, filters it to the Downtown West polygon, and displays the information interactively on a map using [MapLibre GL](https://maplibre.org/).

**Features:**
- Interactive map of Downtown West Toronto
- Visualization of live and upcoming road restrictions, construction, and transit events
- Impact and type of work clearly represented by color and size
- Clickable markers with detailed popups

## How It Works

1. **Data Fetch and Filter:**  
   The script (`scripts/fetch-and-filter.js`) downloads the latest road restriction events from Toronto’s open data API, filters them by the Downtown West polygon (`data/downtown-west.geojson`), and creates a GeoJSON file (`data/road-restrictions.geojson`) for the map.

2. **Map Display:**  
   `index.html` loads the Downtown West area and overlays filtered road restriction events. Events are colored and sized by type and impact. Users can click markers for more information.
   
3. **Road Restrictions GitHub Action**

To ensure the map always displays the most recent road restrictions, this project uses a GitHub Actions workflow to update its data automatically:

- **Workflow File:** `.github/workflows/update-road-restrictions.yml`
- **Schedule:** Runs every 12 hours (at 00:00 and 12:00 UTC) and can also be triggered manually.
- **Process:**
  - Checks out the repo and sets up Node.js.
  - Installs dependencies.
  - Runs the fetch and filter script to pull and process the latest road restriction data.
  - Commits any changes to the `data/road-restrictions.geojson` file back to the repository.

This keeps the map up-to-date for users without manual intervention.

## Getting Started

### Prerequisites

- Node.js (for running data fetch scripts)
- [MapLibre GL JS](https://maplibre.org/) (loaded via CDN in HTML)

### Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/canadianurbaninstitute/downtown-west-map.git
   cd downtown-west-map
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Fetch and process data:**
   ```sh
   node scripts/fetch-and-filter.js
   ```
   This will output the filtered `road-restrictions.geojson` file in the `data/` directory.

4. **Run the web app locally:**
   - Quick preview: open `index.html` directly in your browser.

## Usage

- **Legend:** See the color legend in the bottom left for event types.
- **Interactivity:** Click any event marker for more details (type, impact, contractor, dates).
- **Current Data:** Events shown are current or upcoming, filtered to the mapped area.

## Data Sources

- [Toronto Open Data Road Restrictions Feed v3](https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=json)
- Downtown West polygon: see `data/downtown-west.geojson`

## Acknowledgments

- [City of Toronto Open Data](https://open.toronto.ca/)
- [MapLibre GL JS](https://maplibre.org/)
