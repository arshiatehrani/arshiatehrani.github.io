/* ============================================================
   WORLD MAP DATA — single source of truth for both pages
   ----------------------------------------------------------
   Edit the three CSV strings below to add / remove places.
   The same data is used by:
     - the embedded map on the main page (index.html)
     - the full-screen map page (world.html)

   Format per line:   CityName,latitude,longitude
   Get coordinates by right-clicking any place in Google Maps.

   Three categories:
     - stays         (cities you've LIVED in)        → bright square
     - well_explored (cities you spent days in)       → lavender square
     - travels       (cities you visited / passed)    → small circle
   ============================================================ */

// EDIT: cities you LIVED IN
window.STAYS = `city,latitude,longitude
Kingston,44.2334,-76.4940
Tehran,35.6892,51.3890`;

// EDIT: cities you EXPLORED WELL (spent days, not just passed through)
window.WELL_EXPLORED = `city,latitude,longitude
Toronto,43.6532,-79.3832
Istanbul,41.0082,28.9784`;

// EDIT: cities you VISITED / TRAVELED TO
window.TRAVELS = `city,latitude,longitude
Dubai,25.2048,55.2708
Paris,48.8566,2.3522
Rome,41.9028,12.4964
London,51.5074,-0.1278
New York,40.7128,-74.0060
Vancouver,49.2827,-123.1207
Montreal,45.5019,-73.5674
Berlin,52.5200,13.4050
Amsterdam,52.3676,4.9041
Tokyo,35.6762,139.6503`;
