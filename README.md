# Explore A City - Street View Route Explorer

A web-based application that generates random routes through any city and displays them as interactive slideshows using street-level imagery from Mapillary. Built with React and TypeScript, this app lets you explore cities through virtual drives with real crowdsourced street view images.

🌐 **Live Demo**: [https://mocialov.github.io/mapillary_street_view_simulator](https://mocialov.github.io/mapillary_street_view_simulator)

## 🌟 Features

- **City-Based Exploration**: Simply enter a city name to explore
- **Multiple Random Routes**: Automatically generates 5 random routes within the city
- **YouTube-Style Layout**: Slideshow on the left, route list on the right
- **Street View Imagery**: Uses Mapillary's crowdsourced street-level photos
- **Interactive Controls**: Play/pause, navigate forward/backward through images
- **Route Switching**: Click any route to instantly switch between different slideshows
- **Mini Map**: Real-time location tracking on an interactive map
- **Keyboard Controls**: Arrow keys for navigation, spacebar to play/pause

## 🛠️ Tech Stack

- **React** with TypeScript
- **Mapillary API** for street-level imagery (free, crowdsourced)
- **OSRM** for routing between locations (free, open-source)
- **Nominatim** for geocoding addresses (free, OpenStreetMap)
- **Leaflet** for interactive maps

## 📦 Setup & Installation

### Prerequisites

- Node.js 16+ and npm
- Mapillary API token ([Get one here](https://www.mapillary.com/dashboard/developers))

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mocialov/mapillary_street_view_simulator.git
   cd mapillary_street_view_simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Add your Mapillary API token to `.env`:**
   ```
   REACT_APP_MAPILLARY_TOKEN=your_token_here
   ```

5. **Start the development server:**
   ```bash
   npm start
   ```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment to GitHub Pages

### Automatic Deployment (Recommended)

This repository includes a GitHub Actions workflow for automatic deployment:

1. **Add your API token as a GitHub Secret:**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `REACT_APP_MAPILLARY_TOKEN`
   - Value: Your Mapillary API token

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: Select "GitHub Actions"

3. **Push to master branch:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin master
   ```

The app will deploy automatically! Access it at: `https://yourusername.github.io/mapillary_street_view_simulator`

### Manual Deployment

```bash
npm run deploy
```

## 📝 How It Works

1. User enters a city name (e.g., "San Francisco", "Paris, France", "Tokyo")
2. App fetches the city's boundaries using OpenStreetMap Nominatim
3. Five random origin/destination pairs are generated within the city bounds (1-2km apart)
4. Routes are calculated using OSRM (Open Source Routing Machine)
5. App fetches Mapillary images along each route
6. Images are displayed in a YouTube-style interface with route selection
7. Click any route to switch between different city explorations

## ⚠️ Important Notes

- **Image Availability**: Mapillary uses crowdsourced imagery, so coverage varies by location. Urban areas and major roads typically have better coverage.
- **Rate Limiting**: The Mapillary API has rate limits. The app fetches multiple routes sequentially to respect these limits.
- **Image Quality**: Mapillary images are from various contributors and may vary in quality and resolution.
- **Random Routes**: Routes are randomly generated within city boundaries (1-2km in length), so results vary each time you explore a city.

## 🎥 Demo Video

Original Python version demo:
[![Google Street View Simulator Video](http://img.youtube.com/vi/77FeNIHuC20/0.jpg)](http://www.youtube.com/watch?v=77FeNIHuC20)

## 📄 Legacy Python Version

The original Python version that generates video timelapses is still available in `StreetViewAPI.py`. See the file for usage instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes!
