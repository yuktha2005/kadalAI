import React from 'react';
import { Text } from '@react-three/drei';
import { DataPoint } from '../App';

interface GlobeWithFallbackProps {
  dataPoints: DataPoint[];
  onDataPointClick: (dataPoint: DataPoint) => void;
}

const GlobeWithFallback: React.FC<GlobeWithFallbackProps> = ({ dataPoints: _dataPoints, onDataPointClick: _onDataPointClick }) => {
  return (
    <group>
      <Text
        position={[0, 0, 0]}
        fontSize={0.5}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        Globe placeholder
      </Text>
    </group>
  );
};

export default GlobeWithFallback;
