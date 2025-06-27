import React, { useState, useRef, useEffect } from "react";
import "./ChatBox.css";

let googleMapsScriptLoaded = false;

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (googleMapsScriptLoaded || (window.google && window.google.maps)) {
      resolve();
    } else {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
      if (existingScript) {
        existingScript.addEventListener("load", resolve);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleMapsScriptLoaded = true;
        resolve();
      };
      script.onerror = (e) => {
        console.warn("Google Maps script failed to load", e);
        resolve(); // still resolve so app doesn't break
      };
      document.head.appendChild(script);
    }
  });
}

function ChatBox({ intakeData, onLogout }) {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text:
        intakeData.healthType === "mental"
          ? "Hi there. I'm here to listen. How are you feeling today?"
          : "Hello! What kind of physical discomfort are you dealing with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestedSpecialist, setSuggestedSpecialist] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);
  const infoWindowRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
  const stored = localStorage.getItem("darkMode");
  return stored !== null ? stored === "true" : true; // Default to dark mode
});

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadGoogleMapsScript(process.env.REACT_APP_GOOGLE_MAPS_API_KEY).then(() => {
      if (!window.google || !window.google.maps) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          mapInstance.current = new window.google.maps.Map(mapRef.current, {
            center: userLoc,
            zoom: 13,
          });
          new window.google.maps.Marker({
            position: userLoc,
            map: mapInstance.current,
            title: "You are here",
          });
        },
        () => alert("Failed to get location")
      );
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    const updatedMessages = [...messages, userMessage];

    const formattedMessages = updatedMessages.map((msg) => ({
      role: msg.from === "ai" ? "assistant" : "user",
      content: msg.text,
    }));

    setMessages(updatedMessages);
    setInput("");

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: formattedMessages,
        healthType: intakeData.healthType,
      }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { from: "ai", text: data.reply }]);

    const match = data.reply.match(/see(?:ing)? (?:a|an)? ([a-z\s]+?)(?:[.,!]|$)/i);
    if (match && match[1]) {
      const extracted = match[1].trim();
      setSuggestedSpecialist(extracted);
      searchNearby(extracted);
    } else if (
      data.reply.toLowerCase().includes("would you like me to help you find") ||
      data.reply.toLowerCase().includes("providers nearby")
    ) {
      searchNearby(suggestedSpecialist || input);
    }
  };

  const searchNearby = (userInput) => {
    const matchedSpecialist = userInput || (intakeData.healthType === "mental" ? "therapist" : "clinic");
    const service = new window.google.maps.places.PlacesService(mapInstance.current);

    navigator.geolocation.getCurrentPosition((pos) => {
      const location = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

      service.nearbySearch(
        {
          location,
          radius: 10000,
          keyword: `${matchedSpecialist} near me`,
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            markers.current.forEach((marker) => marker.setMap(null));
            markers.current = [];

            if (!infoWindowRef.current) {
              infoWindowRef.current = new window.google.maps.InfoWindow();
            }

            results.forEach((place) => {
              if (place.geometry && place.geometry.location) {
                const marker = new window.google.maps.Marker({
                  position: place.geometry.location,
                  map: mapInstance.current,
                  title: place.name,
                });

                marker.addListener("click", () => {
                  service.getDetails(
                    {
                      placeId: place.place_id,
                      fields: ["name", "vicinity", "rating", "website", "formatted_phone_number"],
                    },
                    (details, status) => {
                      if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
                        const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          details.name + ", " + details.vicinity
                        )}`;

                        const content = `
                          <strong>${details.name}</strong><br>
                          ${details.vicinity || ""}<br>
                          ${details.rating ? `Rating: ${details.rating} ⭐<br>` : ""}
                          ${details.website ? `<a href="${details.website}" target="_blank">Website</a><br>` : ""}
                          ${details.formatted_phone_number ? `Phone: ${details.formatted_phone_number}<br>` : ""}
                          <a href="${directionsLink}" target="_blank">Get Directions</a>
                        `;

                        infoWindowRef.current.setContent(content);
                        infoWindowRef.current.open(mapInstance.current, marker);
                      }
                    }
                  );
                });

                markers.current.push(marker);
              }
            });
          } else {
            console.warn("No providers found or search failed.", status);
          }
        }
      );
    });
  };

  return (
    <div className="chatbox-container">
      <header className="chatbox-header">
        <h3>💬 HealthAI Chat</h3>
        <button onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={onLogout}>Sign Out</button>
      </header>

      <div className="chatbox-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.from}`}> 
            <strong>{msg.from === "ai" ? "HealthAI" : "You"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="chatbox-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>

      <div className="chatbox-map" ref={mapRef}></div>
    </div>
  );
}

export default ChatBox;
