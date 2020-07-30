import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

let map

const fitMapToMarkers = (map, markers) => {
  const boundsMarkers = new mapboxgl.LngLatBounds();
  markers.forEach(marker => boundsMarkers.extend([ marker.lng, marker.lat ]));
  map.fitBounds(boundsMarkers, { padding: 70, maxZoom: 15, duration: 0 });
};

const initMapbox = () => {
  const mapElement = document.getElementById('map');

  if (mapElement) { // only build a map if there's a div#map to inject into
    mapboxgl.accessToken = mapElement.dataset.mapboxApiKey;
     map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v10'
    });
    const markers = JSON.parse(mapElement.dataset.markers);
    markers.forEach((marker) => {

      const popup = new mapboxgl.Popup().setHTML(marker.infoWindow);
      const vendorInfo = document.createElement('div');
      vendorInfo.className = 'marker';
      vendorInfo.innerText = '📍'+marker.name;
      vendorInfo.style.color = "#2c3e75";

      new mapboxgl.Marker(vendorInfo)
        .setLngLat([ marker.lng, marker.lat ])
        .setPopup(popup)
        .addTo(map);

        const canvas = map.getCanvasContainer();

      popup._content.querySelector('.directions-button')
        .addEventListener('click', e => {
          navigator.geolocation.getCurrentPosition(position => {
            const start = [position.coords.longitude, position.coords.latitude];
            const end = [ marker.lng, marker.lat ];
            const boundsDirections = new mapboxgl.LngLatBounds([start,end]);
            map.fitBounds(boundsDirections, { padding: 30, maxZoom: 15, duration: 0 });
            getRoute(end, start)
        });
      });
    });


    fitMapToMarkers(map, markers);
//     search function from mapbox - currently disabled

    // map.addControl(new MapboxGeocoder({ accessToken: mapboxgl.accessToken,
    //                                   mapboxgl: mapboxgl }));
    map.addControl(
          new mapboxgl.GeolocateControl({
          positionOptions: {
          enableHighAccuracy: true
          },
          trackUserLocation: true
          })
        );
  }
};


function getRoute(end, start) {
  const url = 'https://api.mapbox.com/directions/v5/mapbox/walking/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;

  // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.onload = function() {
    var json = JSON.parse(req.response);
    var data = json.routes[0];
    var route = data.geometry.coordinates;
    var geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route
      }
    };
    // if the route already exists on the map, reset it using setData
    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    } else { // otherwise, make a new request
      console.log('add layers')
      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: geojson,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });

      map.addLayer({
        id: 'point',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: start
              }
            }
            ]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be'
        }
      });
    }

    const instructions = document.getElementById('instructions');
    const steps = data.legs[0].steps;
    var tripInstructions = [];
    for (var i = 0; i < steps.length; i++) {
      tripInstructions.push('<br><li>' + steps[i].maneuver.instruction) + '</li>';
      instructions.innerHTML = '<br><span class="duration">🚶🏻‍♂️ ' + Math.floor(data.duration / 60) + ' min </span>' + tripInstructions;
    }
  };
  req.send();
}

// // probably don't need this part?
// map.on('load', function() {
//   // make an initial directions request that
//   // starts and ends at the same location
//   getRoute(start);

//   // Add starting point to the map
  // map.addLayer({
  //   id: 'point',
  //   type: 'circle',
  //   source: {
  //     type: 'geojson',
  //     data: {
  //       type: 'FeatureCollection',
  //       features: [{
  //         type: 'Feature',
  //         properties: {},
  //         geometry: {
  //           type: 'Point',
  //           coordinates: start
  //         }
  //       }
  //       ]
  //     }
  //   },
  //   paint: {
  //     'circle-radius': 10,
  //     'circle-color': '#3887be'
  //   }
  // });
//   // this is where the code from the next step will go

//       map.on('click', function(e) {
//       var coordsObj = e.lngLat;
//       canvas.style.cursor = '';
//       var coords = Object.keys(coordsObj).map(function(key) {
//         return coordsObj[key];
//       });
//       var end = {
//         type: 'FeatureCollection',
//         features: [{
//           type: 'Feature',
//           properties: {},
//           geometry: {
//             type: 'Point',
//             coordinates: coords
//           }
//         }
//         ]
//       };
//       if (map.getLayer('end')) {
//         map.getSource('end').setData(end);
//       } else {
//         map.addLayer({
//           id: 'end',
//           type: 'circle',
//           source: {
//             type: 'geojson',
//             data: {
//               type: 'FeatureCollection',
//               features: [{
//                 type: 'Feature',
//                 properties: {},
//                 geometry: {
//                   type: 'Point',
//                   coordinates: coords
//                 }
//               }]
//             }
//           },
//           paint: {
//             'circle-radius': 10,
//             'circle-color': '#f30'
//           }
//         });
//       }
//       getRoute(coords);
//     });
// });



export { initMapbox };
