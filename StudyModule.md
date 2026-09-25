## Study Modules (Taxonomy, Otolith, eDNA)

The Study section provides three scientist-oriented modules with a consistent grey glass UI and a stars background. All modules run fully client-side with mock-safe defaults and optional live data.

### 1) Taxonomy 🐠

- Browse a mock marine hierarchy and search by entering scientific names directly
- Enter a scientific name in the search field and press Enter or click Search to load species data
- Select a species to load:
  - Scientific name and authorship
  - Rank and lineage (kingdom → species)
  - Common names (vernaculars)
  - Occurrence distribution by country/region (bar chart)
  - Image thumbnails from taxonomy API
- Clickable lineage breadcrumbs for quick navigation
- Favorites list per session

Data sources used
- Taxonomy API: `https://taxa-2.vercel.app/taxon?scientific_name={scientific_name}`
  - Returns: key, scientificName, authorship, rank, lineage, images, commonNames, distribution

Future backend integration
- Add WoRMS (AphiaID, marine status) and FishBase traits via a server proxy
- Cache responses and store favorites in your DB

### 2) Otolith Morphology 🔬

- Upload multiple otolith images; select thumbnails to view
- Viewer modes: Normal / Edge view (contrast + desaturate) for contours
- Annotation mode: click two points to add a length measurement; supports calibration (px/mm)
- Measurements table with CSV export and global filtering
- Mock “AI Guess” action (pluggable with real inference later)

Future backend integration
- Image storage (Supabase/Cloudinary) and serverless analysis (OpenCV/ML)
- Auto edge tracing, ellipse fit, and species/age estimation

### 3) eDNA Data 🧬

- Paste FASTA or upload `.fa/.fasta/.txt` files
- Enter raw DNA sequences (with or without FASTA headers)
- Match sequences against reference database
- View detailed results with:
  - Marker type detection
  - Sequence length
  - Top match with confidence score
  - All matches with specimen IDs and reference lengths
  - Number of reference sequences compared
- Species distribution pie chart from top matches
- CSV export functionality

Data sources used
- eDNA API: `https://Kadal AI-e-dna-2.vercel.app/edna/match_sequence?raw_sequence={sequence}`
  - Returns: raw_sequence, marker_type, sequence_length, matches array, summary object
- Optional serverless proxy for BLAST-like alignment

### Notes

- All modules handle empty states and fallbacks so the UI always renders
- Live calls are made directly from the browser; move to a backend proxy for rate-limiting, CORS and API keys in production

# CMLRE Marine Explorer

A highly interactive, data-driven web application for marine biodiversity analysis built with React, Three.js, and modern web technologies.

## Features

### Project Dashboard View
- **Modern UI**: Dark, futuristic design with smooth animations
- **Project Management**: Grid of project cards with progress tracking
- **Navigation**: Clean header with logo and navigation links
- **User Interface**: Welcome message and logout functionality

### Interactive Globe View
- **3D Globe**: Interactive 3D globe using React Three Fiber
- **Data Visualization**: Real-time data points plotted on the globe
- **Color Coding**: Different colors for different water bodies
- **Interactive Features**: Hover tooltips and click modals
- **Data Panels**: Left panel for filters, right panel for analysis

### Key Components
- **Project Cards**: Animated cards with progress bars and project details
- **3D Globe**: Rotatable and zoomable globe with data points
- **Data Modal**: Detailed information popup for each data point
- **Analysis Tools**: Real-time analysis input with processing animations
- **Live Feed**: Simulated real-time data updates

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom marine theme
- **3D Graphics**: React Three Fiber + Three.js
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Data**: Tab-separated occurrence data

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd marine-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard view
│   ├── ProjectCard.tsx        # Individual project cards
│   ├── GlobeView.tsx          # 3D globe interface
│   ├── Globe.tsx              # 3D globe component
│   └── DataModal.tsx          # Data point detail modal
├── services/
│   └── dataService.ts         # Data loading and management
├── App.tsx                    # Main application component
└── index.css                  # Global styles with Tailwind

public/
└── data/
    └── occurrence.txt         # Marine biodiversity dataset
```

## Data Format

The application uses a tab-separated values (TSV) format for the occurrence data:

```
scientificName	locality	eventDate	decimalLatitude	decimalLongitude	waterBody	samplingProtocol	minimumDepthInMeters	maximumDepthInMeters	identifiedBy
```

## Features in Detail

### Dashboard
- Responsive grid layout for project cards
- Smooth hover animations and transitions
- Progress tracking with animated progress bars
- Tag-based project categorization

### 3D Globe
- High-fidelity 3D globe with realistic lighting
- Interactive data points with color coding:
  - **Green**: Arabian Sea
  - **Yellow**: Bay of Bengal  
  - **Cyan**: Andaman Sea
  - **Orange**: Other water bodies
- Mouse controls for rotation, zoom, and pan
- Pulsating data points for visual appeal

### Data Interaction
- Hover tooltips showing species and location
- Click modals with detailed sampling information
- Real-time data loading and visualization
- Filtering and analysis capabilities

### UI/UX
- Dark, marine-themed color scheme
- Smooth animations using Framer Motion
- Responsive design for all screen sizes
- Loading states and error handling
- Modern glassmorphism effects

## Customization

### Colors
The application uses a custom marine color palette defined in `tailwind.config.js`:
- `marine-blue`: Primary background
- `marine-cyan`: Accent color
- `marine-green`: Success/positive actions
- `marine-yellow`: Warning/attention
- `marine-orange`: Additional accent

### Data
To add your own data, simply update the `public/data/occurrence.txt` file with your marine biodiversity data following the TSV format.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### WebGL Context Lost Error

If you encounter "THREE.WebGLRenderer: Context Lost" errors:

1. **Refresh the page** - This usually resolves temporary context loss
2. **Check WebGL support** - Visit [webglreport.com](https://webglreport.com) to verify your browser supports WebGL
3. **Update graphics drivers** - Ensure your graphics drivers are up to date
4. **Enable hardware acceleration** - Check browser settings for hardware acceleration
5. **Close other WebGL applications** - Multiple WebGL contexts can cause conflicts

### Performance Issues

- **Reduce data points** - Large datasets may impact performance
- **Close other tabs** - Free up GPU memory
- **Use Chrome/Firefox** - Better WebGL performance than Safari
- **Check GPU memory** - Ensure sufficient graphics memory

### Common Solutions

- **Clear browser cache** - Resolves many rendering issues
- **Disable browser extensions** - Some extensions interfere with WebGL
- **Try incognito mode** - Isolates the application from extensions
- **Check browser console** - Look for specific error messages

## Performance

- Optimized 3D rendering with React Three Fiber
- Efficient data loading and caching
- Smooth 60fps animations
- Responsive design for mobile and desktop

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- CMLRE (Centre for Marine Living Resources and Ecology)
- React Three Fiber community
- Framer Motion for smooth animations
- Tailwind CSS for utility-first styling