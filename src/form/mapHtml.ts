// The map page shown inside the WebView. Leaflet draws it, OpenStreetMap supplies the images.
// When the pin moves, the page sends its position back to the app.
export function mapHtml(lat: number, lng: number, zoom: number) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], ${zoom});
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    var pin = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

    function sendPin() {
      var position = pin.getLatLng();
      var message = JSON.stringify({ lat: position.lat, lng: position.lng });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
      else window.parent.postMessage(message, '*');
    }

    pin.on('dragend', sendPin);
    map.on('click', function (e) {
      pin.setLatLng(e.latlng);
      sendPin();
    });
  </script>
</body>
</html>`;
}
