const socket = io();
let userMarker;
let routeLine;
let currentPosition = null;
let destination = null;

// Initialize map
const map = L.map("map").setView([0, 0], 10);

// Add tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Handle geolocation
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            currentPosition = [latitude, longitude];

            socket.emit("send-location", { latitude, longitude });

            // If user marker exists, update it, else create a new one
            if (userMarker) {
                userMarker.setLatLng([latitude, longitude]);
            } else {
                userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("You");
            }

            map.setView([latitude, longitude], 15);

            // If destination exists, animate movement
            if (destination) {
                moveToDestination(latitude, longitude);
            }
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
} else {
    alert("Geolocation is not supported by your browser.");
}

// Function to move towards destination
function moveToDestination(lat, lng) {
    if (!destination) return;

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    routeLine = L.polyline([currentPosition, destination], { color: "blue" }).addTo(map);
}

// Listen for location updates
socket.on("receive-location", ({ latitude, longitude }) => {
    if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
    }
});

// Handle route setting
document.getElementById("setRouteBtn").addEventListener("click", () => {
    const source = document.getElementById("source").value;
    const dest = document.getElementById("destination").value;

    if (!source || !dest) {
        alert("Please enter both source and destination.");
        return;
    }

    // Geocode source and destination to get coordinates
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${source}`)
        .then((res) => res.json())
        .then((data) => {
            if (data.length === 0) {
                alert("Invalid source location");
                return;
            }
            const sourceCoords = [data[0].lat, data[0].lon];

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${dest}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.length === 0) {
                        alert("Invalid destination location");
                        return;
                    }
                    destination = [data[0].lat, data[0].lon];

                    socket.emit("set-route", { source: sourceCoords, destination });

                    L.marker(destination).addTo(map).bindPopup("Destination").openPopup();

                    if (routeLine) {
                        map.removeLayer(routeLine);
                    }
                    routeLine = L.polyline([currentPosition, destination], { color: "blue" }).addTo(map);
                });
        });
});
