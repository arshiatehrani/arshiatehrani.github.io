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

// Cities you've LIVED IN
window.STAYS = `city,latitude,longitude
Tehran,35.6892,51.3890
Kingston,44.2334,-76.4940
Kish Island,26.5570,53.9800
Kuala Lumpur,3.1390,101.6869`;

// Cities you explored well (spent multiple days)
window.WELL_EXPLORED = `city,latitude,longitude`;

// Cities you visited / traveled to
window.TRAVELS = `city,latitude,longitude
Bangkok,13.7563,100.5018
Phuket,7.8804,98.3923
Langkawi,6.3500,99.8000
Bali,-8.3405,115.0920
Singapore,1.3521,103.8198
Shiraz,29.5918,52.5837
Karaj,35.8400,50.9391
Isfahan,32.6546,51.6680
Tabriz,38.0800,46.2919
Mashhad,36.2605,59.6168
Qeshm Island,26.9581,56.2719
Hormuz Island,27.0667,56.4500
Bushehr,28.9684,50.8385
Van,38.4941,43.3800
Erzurum,39.9055,41.2658
Kars,40.6013,43.0975
Rize,41.0201,40.5234
Trabzon,41.0015,39.7178
Ordu,40.9839,37.8764
Samsun,41.2867,36.3300
Sinop,42.0267,35.1551
Istanbul,41.0082,28.9784
Ankara,39.9334,32.8597
Izmir,38.4192,27.1287
Antalya,36.8969,30.7133
Alanya,36.5444,31.9958
Konya,37.8746,32.4932
Adana,37.0000,35.3213
Kusadasi,37.8575,27.2610
Paris,48.8566,2.3522
Amsterdam,52.3676,4.9041
Yerevan,40.1792,44.4991
Batumi,41.6168,41.6367
Tbilisi,41.7151,44.8271
Doha,25.2854,51.5310
Abu Dhabi,24.4539,54.3773
Dubai,25.2048,55.2708
Muscat,23.5880,58.3829
Toronto,43.6532,-79.3832
Ottawa,45.4215,-75.6972
Montreal,45.5019,-73.5674
Calgary,51.0447,-114.0719
Banff,51.1784,-115.5708
Waterloo,43.4643,-80.5204`;
