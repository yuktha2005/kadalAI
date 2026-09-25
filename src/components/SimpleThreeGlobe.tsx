import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import Globe from 'three-globe';
import { DataPoint } from '../App';

interface SimpleThreeGlobeProps {
  dataPoints: DataPoint[];
  onDataPointClick: (dataPoint: DataPoint) => void;
}

const SimpleThreeGlobe: React.FC<SimpleThreeGlobeProps> = ({ dataPoints, onDataPointClick }) => {
  const globeRef = useRef<Globe | null>(null);
  const [globeCreated, setGlobeCreated] = useState(false);
  const { scene } = useThree();

  // Get color based on water body
  const getWaterBodyColor = (waterBody: string) => {
    switch (waterBody) {
      case 'Arabian Sea':
        return '#0F766E';
      case 'Bay of Bengal':
        return '#0369A1';
      case 'Andaman Sea':
        return '#D97706';
      default:
        return '#E4572E';
    }
  };

  // Prepare data for three-globe
  const globeData = useMemo(() => {
    return dataPoints.map((point) => ({
      lat: point.decimalLatitude,
      lng: point.decimalLongitude,
      size: 0.5,
      color: getWaterBodyColor(point.waterBody),
      data: point
    }));
  }, [dataPoints]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // Start with 1 second

    const createGlobe = async () => {
      if (!globeRef.current && retryCount < maxRetries) {
        try {
          // Check if WebGL context is available
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) {
            throw new Error('WebGL not available');
          }

          // Create a minimal globe configuration
          const globe = new Globe()
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .showAtmosphere(true)
            .atmosphereColor('#0F766E')
            .atmosphereAltitude(0.1);

          // Add points data
          globe.pointsData(globeData);

          // Configure points with minimal settings
          globe
            .pointColor('color')
            .pointAltitude(0.01)
            .pointRadius(0.5);

          globeRef.current = globe;
          scene.add(globe);
          setGlobeCreated(true);
          
          console.log('Simple three-globe created successfully');
        } catch (error) {
          console.error(`Error creating simple three-globe (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`Retrying globe creation in ${retryDelay * retryCount}ms...`);
            setTimeout(createGlobe, retryDelay * retryCount);
          } else {
            console.error('Max retries reached, giving up on globe creation');
            setGlobeCreated(false);
          }
        }
      }
    };

    createGlobe();

    return () => {
      if (globeRef.current) {
        try {
          scene.remove(globeRef.current);
          globeRef.current = null;
          setGlobeCreated(false);
        } catch (error) {
          console.error('Error removing simple three-globe:', error);
        }
      }
    };
  }, [scene, globeData]);

  // Update data when it changes
  useEffect(() => {
    if (globeRef.current && globeCreated) {
      try {
        globeRef.current.pointsData(globeData);
      } catch (error) {
        console.error('Error updating globe data:', error);
        // If data update fails, try to recreate the globe
        setGlobeCreated(false);
      }
    }
  }, [globeData, globeCreated]);

  // Rotate the globe
  useFrame(() => {
    if (globeRef.current && globeCreated) {
      try {
        globeRef.current.rotation.y += 0.005;
      } catch (error) {
        console.error('Error rotating globe:', error);
        // If rotation fails, the context might be lost
        setGlobeCreated(false);
      }
    }
  });

  // If globe creation failed, return null to trigger fallback
  if (!globeCreated) {
    console.log('SimpleThreeGlobe: Globe creation failed, returning null to trigger fallback');
    return null;
  }

  console.log('SimpleThreeGlobe: Rendering globe successfully');

  return (
    <group>
      <Text
        position={[0, 3, 0]}
        fontSize={0.3}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        Marine Biodiversity Explorer
      </Text>
    </group>
  );
};

export default SimpleThreeGlobe;
