import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import Globe from 'three-globe';
import { DataPoint } from '../App';

interface ThreeGlobeProps {
  dataPoints: DataPoint[];
  onDataPointClick: (dataPoint: DataPoint) => void;
}

const ThreeGlobeComponent: React.FC<ThreeGlobeProps> = ({ dataPoints, onDataPointClick }) => {
  const globeRef = useRef<Globe | null>(null);
  const { scene } = useThree();

  // Get color based on water body
  const getWaterBodyColor = (waterBody: string) => {
    switch (waterBody) {
      case 'Arabian Sea':
        return '#0F766E'; // primary teal
      case 'Bay of Bengal':
        return '#0369A1'; // ocean blue
      case 'Andaman Sea':
        return '#D97706'; // amber
      default:
        return '#E4572E'; // coral
    }
  };

  // Prepare data for three-globe
  const globeData = useMemo(() => {
    return dataPoints.map((point, index) => ({
      lat: point.decimalLatitude,
      lng: point.decimalLongitude,
      size: 0.5,
      color: getWaterBodyColor(point.waterBody),
      data: point,
      index
    }));
  }, [dataPoints]);

  useEffect(() => {
    if (!globeRef.current) {
      try {
        // Create the globe with basic configuration
        const globe = new Globe()
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
          .showAtmosphere(true)
          .atmosphereColor('#0F766E')
          .atmosphereAltitude(0.1);

        // Add points data
        globe.pointsData(globeData);

        // Configure points
        globe
          .pointColor('color')
          .pointAltitude(0.01)
          .pointRadius(0.5)
          .pointResolution(8)
          .pointsMerge(false);

        // Store reference
        globeRef.current = globe;

        // Add to scene
        scene.add(globe);
        
        console.log('Three-globe created successfully');
      } catch (error) {
        console.error('Error creating three-globe:', error);
      }
    }

    return () => {
      if (globeRef.current) {
        try {
          scene.remove(globeRef.current);
          globeRef.current = null;
          console.log('Three-globe removed from scene');
        } catch (error) {
          console.error('Error removing three-globe:', error);
        }
      }
    };
  }, [scene, globeData]);

  // Update data when it changes
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointsData(globeData);
    }
  }, [globeData]);

  // Rotate the globe
  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group>
      {/* Globe Title */}
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

export default ThreeGlobeComponent;
