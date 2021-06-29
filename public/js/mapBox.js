// Disable ESLINT
/* eslint-disable */

// Our Script is integrated at the beginning of the file, hence the DOM is not completely loaded. Onw way to fix this is to move it to the bottom of the file, beu we could also use the following code, i.e a handy event listener.

// window.addEventListener("DOMContentLoaded", (event) => {
//   const locations = JSON.parse(
//     document.querySelector("#map").getAttribute("data-locations")
//   );
//   console.log(locations);
// });

export const displayMap = (locations) => {
  // Container is set to map, hence the container puts the map on an element with the id of map.
  mapboxgl.accessToken =
    "pk.eyJ1Ijoic3BhY2VmYWNlMDIiLCJhIjoiY2txYWlxdHNqMG1qMDJ2bGJhamNqZzVueSJ9.zVp21_X6866ls7XQZRb6WA";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/spaceface02/ckqaj9t69139s17pixgitvhy0",
    scrollZoom: false,
    // Long first, then lat
    // center: [-118.1134, 34.111745],
    // zoom: 5,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Add a marker for each location
    const markerEl = document.createElement("div");
    markerEl.className = "marker";

    // anchor means that the bottom of the pin will be depicting the location.
    new mapboxgl.Marker({
      element: markerEl,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Extends the map bounds to include the current location
    bounds.extend(loc.coordinates);

    new mapboxgl.Popup({
      offset: 30,
      closeOnClick: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
  });

  // Executes the moving and zooming
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 80,
      right: 80,
    },
  });
};
