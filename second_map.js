import * as maplibregl from 'https://unpkg.com/maplibre-gl@^6/dist/maplibre-gl.mjs'

console.log('код рабочий')

// Инициализируем карту
const map = new maplibregl.Map({
  container: 'map',
  style: "https://raw.githubusercontent.com/gtitov/basemaps/refs/heads/master/positron-nolabels.json",
  center: [51, 0],
  zoom: 4,
  hash: true
})

map.on("load", () => {
  fetch("https://docs.google.com/spreadsheets/d/1f0waZduz5CXdNig_WWcJDWWntF-p5gN2-P-CNTLxEa0/export?format=csv")
        .then((response) => response.text())
        .then((csv) => {
            const rows = Papa.parse(csv, { header: true})
            console.log(rows)
            const geojsonFeatures = rows.data.map((row) => {
              return {
                 type: "Feature",
                 properties: row,
                 geometry: {
                  type: "Point",
                  coordinates: [row.lon, row.lat]
                 }
              }
            })


          
            const geojson = {
              type:"FeatureCollection",
              features: geojsonFeatures
            }
            map.addSource("vacancies", {
              type:"geojson",
              data: geojson,
              cluster: true,
              clusterRadius: 10
            })
            map.addLayer({
              id: "clusters",
              source: "vacancies",
              type: "circle",
              paint: {
                "circle-color": "#B57EDC",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#FFFFFF",
                "circle-radius": 
                  ["step", ["get", "point_count"],
                12,
                3,
                20,
                6,
                35
                ]

              }
            })

            map.addLayer({
              id:"claster-labels",
              type: "symbol",
              source: "vacancies",
              layout: {
                "text-field": ["get", "point_count"],
                "text-size": 20
              },

              paint: {
                "text-color": "#016220"
              }

            })

            geojson.features.map((f) => {
              const itemContainer = document.createElement("li");
              itemContainer.className = "list-item";

              const title = document.createElement("h4");
              title.textContent = f.properties["Вакансия"];

              const link = document.createElement("a");
              link.href = "#";
              link.textContent = "Найти на карте";

              link.addEventListener("click", (e) => {
                e.preventDefault();
                map.flyTo({
                  center: f.geometry.coordinates,
                  zoom: 10
                });
              });

              itemContainer.appendChild(title);
              itemContainer.appendChild(link);

              const listAll = document.getElementById("list-all");
              listAll.appendChild(itemContainer);
              listAll.appendChild(document.createElement("hr"));
            });

          map.on("moveend", () => {
            const features = map.queryRenderedFeatures({
              layers: ["clusters"]
            })

            document.getElementById("list-selected").innerHTML = "<h2>Сейчас на карте</h2>"
            features.map(f => {
              if (f.properties.cluster) {
                map.getSource("vacancies").getClusterLeaves(
                  f.properties.cluster_id,
                  f.properties.point_count,
                  0
                ).then((clusterLeaves) => {
                  clusterLeaves.map((leave) => {
                    document.getElementById("list-selected")
                      .innerHTML += `<div class="list-item">
                        <h4>${leave.properties["Вакансия"]}</h4>
                        <a target="blank_" href='${leave.properties["Ссылка на сайте Картетики"]}'>Подробнее</a>
                      </div><hr>` // декларативное создание HTML-элементов  

                  })
                  

                })
              }
                else { 
                  document.getElementById("list-selected")
                    .innerHTML += `<div class="list-item">
                      <h4>${f.properties["Вакансия"]}</h4>
                      <a target="blank_" href='${f.properties["Ссылка на сайте Картетики"]}'>Подробнее</a>
                    </div><hr>` // декларативное создание HTML-элементов

              }
            })
          })

            map.on("click", ['clusters'], (e) => {
              console.log(e.features)
            })


        })

              // Эти события мы назначаем, пока ждём ответа от внешнего ресурса.
  // Не теряем ни секунды.
  map.on("click", "clusters", function (e) {
    map.flyTo({ center: e.lngLat, zoom: 6 });
  })

  map.on("mouseenter", "clusters", function () {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "clusters", function () {
    map.getCanvas().style.cursor = "";
  });

})
