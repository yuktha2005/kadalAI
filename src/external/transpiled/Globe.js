import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Raycaster } from 'three';

// --- Import all 7 of your new GeoJSON files ---
import africaData from './assets/AF.json';
import antarcticaData from './assets/AN.json';
import asiaData from './assets/AS.json';
import europeData from './assets/EU.json';
import northAmericaData from './assets/NA.json';
import oceaniaData from './assets/OC.json';
import southAmericaData from './assets/SA.json';

// --- Helper function to convert Lat/Lon to a 3D vector ---
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// --- Helper function to convert 3D vector to Lat/Lon ---
function vector3ToLatLon(vector, radius) {
  const x = vector.x;
  const y = vector.y;
  const z = vector.z;
  const lat = 90 - (Math.acos(y / radius) * 180 / Math.PI);
  const lon = (Math.atan2(z, -x) * 180 / Math.PI) - 180;
  return { lat, lng: lon };
}

// --- Helper function to robustly extract features from any GeoJSON structure ---
function extractFeatures(geoJson) {
  if (!geoJson) return [];
  if (geoJson.type === 'FeatureCollection') {
    return geoJson.features || [];
  }
  if (geoJson.type === 'Feature') {
    return [geoJson];
  }
  if (geoJson.type === 'Polygon' || geoJson.type === 'MultiPolygon') {
    return [{
      type: 'Feature',
      geometry: geoJson,
      properties: {}
    }];
  }
  return [];
}

// (Removed point-sphere approach)

// --- Component to generate Landmasses and Borders ---
function Landmasses() {
  // Build an alpha map for land and 3D border lines
  const {
    landTexture,
    borderLines
  } = useMemo(() => {
    const width = 4096;
    const height = 2048;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    // start transparent
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    const linePoints = [];
    const allFeatures = [...extractFeatures(africaData), ...extractFeatures(antarcticaData), ...extractFeatures(asiaData), ...extractFeatures(europeData), ...extractFeatures(northAmericaData), ...extractFeatures(oceaniaData), ...extractFeatures(southAmericaData)];
    const lngLatToXY = (lng, lat) => ({
      x: (lng + 180) / 360 * width,
      y: (-lat + 90) / 180 * height
    });
    const drawRing = ring => {
      if (!Array.isArray(ring) || ring.length < 3) return;
      ring.forEach((coord, i) => {
        if (!Array.isArray(coord) || coord.length < 2) return;
        const {
          x,
          y
        } = lngLatToXY(coord[0], coord[1]);
        if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      });
    };
    allFeatures.forEach(feature => {
      const geom = feature && feature.geometry;
      if (!geom || !geom.coordinates) return;
      const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      if (!Array.isArray(polygons)) return;
      polygons.forEach(poly => {
        if (!Array.isArray(poly) || poly.length === 0) return;
        const exterior = poly[0];
        const holes = poly.slice(1) || [];

        // Fill with even-odd to cut out holes
        ctx.beginPath();
        drawRing(exterior);
        holes.forEach(drawRing);
        ctx.closePath();
        ctx.fill('evenodd');

        // Build 3D border lines slightly above the surface
        const border = (exterior || []).filter(c => Array.isArray(c) && c.length >= 2).map(c => latLonToVector3(c[1], c[0], 2.04));
        for (let i = 0; i < border.length - 1; i++) {
          linePoints.push(border[i], border[i + 1]);
        }
        if (border.length > 1) linePoints.push(border[border.length - 1], border[0]);
      });
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    return {
      landTexture: texture,
      borderLines: borderGeometry
    };
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("mesh", {
    renderOrder: 1
  }, /*#__PURE__*/React.createElement("sphereGeometry", {
    args: [2.02, 64, 64]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    color: "#021631",
    toneMapped: false,
    transparent: false,
    opacity: 1,
    depthWrite: false,
    depthTest: false
  })), /*#__PURE__*/React.createElement("mesh", {
    renderOrder: 2
  }, /*#__PURE__*/React.createElement("sphereGeometry", {
    args: [2.03, 64, 64]
  }), /*#__PURE__*/React.createElement("meshStandardMaterial", {
    color: "#000000",
    alphaMap: landTexture,
    transparent: true,
    opacity: 1.5,
    depthWrite: false,
    depthTest: false
  })), /*#__PURE__*/React.createElement("mesh", {
    renderOrder: -1
  }, /*#__PURE__*/React.createElement("sphereGeometry", {
    args: [2.025, 64, 64]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    colorWrite: false,
    depthWrite: true,
    depthTest: true
  })), /*#__PURE__*/React.createElement("lineSegments", {
    geometry: borderLines,
    renderOrder: 3
  }, /*#__PURE__*/React.createElement("lineBasicMaterial", {
    color: "#ffffff",
    depthTest: true,
    depthWrite: false
  })));
}

// --- Arrow component that points in a direction ---
function Arrow({ position, direction, nextPoint }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current && direction && nextPoint) {
      // Use the next point directly for lookAt to ensure arrow follows the path
      meshRef.current.lookAt(nextPoint);
    } else if (meshRef.current && direction) {
      // Fallback: calculate target point along the direction vector
      const target = new THREE.Vector3(
        position.x + direction.x * 0.1,
        position.y + direction.y * 0.1,
        position.z + direction.z * 0.1
      );
      meshRef.current.lookAt(target);
    }
  });
  
  return /*#__PURE__*/React.createElement("mesh", {
    ref: meshRef,
    position: [position.x, position.y, position.z],
    renderOrder: 5
  }, /*#__PURE__*/React.createElement("coneGeometry", {
    args: [0.008, 0.025, 6]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    color: "#22d3ee",
    depthTest: true,
    depthWrite: false
  }));
}

// --- Component to draw migration path lines with arrows and animation ---
function MigrationPath({ dataPoints }) {
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const linePoints = useMemo(() => {
    if (!dataPoints || dataPoints.length < 2) return [];
    const points = [];
    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      const v = latLonToVector3(point.decimalLatitude, point.decimalLongitude, 2.06);
      points.push(v);
    }
    return points;
  }, [dataPoints]);
  
  // Animate path drawing continuously
  React.useEffect(() => {
    setAnimationProgress(0);
    const duration = 2000; // 2 seconds
    let animationFrameId;
    const animate = (startTime) => {
      const now = Date.now();
      const elapsed = (now - startTime) % duration;
      const progress = elapsed / duration;
      setAnimationProgress(progress);
      animationFrameId = requestAnimationFrame(() => animate(startTime));
    };
    const startTime = Date.now();
    animationFrameId = requestAnimationFrame(() => animate(startTime));
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dataPoints]);
  
  // Create line segments connecting consecutive points
  const segmentPoints = useMemo(() => {
    if (linePoints.length < 2) return [];
    const segments = [];
    for (let i = 0; i < linePoints.length - 1; i++) {
      segments.push(linePoints[i]);
      segments.push(linePoints[i + 1]);
    }
    return segments;
  }, [linePoints]);
  
  // Calculate total path length and create animated geometry
  const animatedGeometry = useMemo(() => {
    if (segmentPoints.length < 2) return null;
    
    // Calculate cumulative distances
    let totalDistance = 0;
    const distances = [0];
    for (let i = 0; i < segmentPoints.length - 1; i += 2) {
      const dist = segmentPoints[i].distanceTo(segmentPoints[i + 1]);
      totalDistance += dist;
      distances.push(totalDistance);
    }
    
    // Create geometry up to animation progress
    const animatedPoints = [];
    const targetDistance = totalDistance * animationProgress;
    
    for (let i = 0; i < segmentPoints.length - 1; i += 2) {
      const start = segmentPoints[i];
      const end = segmentPoints[i + 1];
      const segmentStartDist = distances[i / 2];
      const segmentEndDist = distances[i / 2 + 1];
      
      if (segmentEndDist <= targetDistance) {
        // Full segment visible
        animatedPoints.push(start);
        animatedPoints.push(end);
      } else if (segmentStartDist < targetDistance) {
        // Partial segment
        const t = (targetDistance - segmentStartDist) / (segmentEndDist - segmentStartDist);
        const partialEnd = start.clone().lerp(end, t);
        animatedPoints.push(start);
        animatedPoints.push(partialEnd);
      }
    }
    
    if (animatedPoints.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(animatedPoints);
  }, [segmentPoints, animationProgress]);
  
  // Create arrow meshes along the path
  const arrows = useMemo(() => {
    if (linePoints.length < 2 || animationProgress < 0.1) return [];
    const arrowMeshes = [];
    
    // Place arrows at midpoints of each segment, ensuring they follow the path direction
    for (let i = 0; i < linePoints.length - 1; i++) {
      const start = linePoints[i];
      const end = linePoints[i + 1];
      
      // Calculate direction vector from start to end (this is the path direction)
      const direction = end.clone().sub(start).normalize();
      
      // Position arrow at midpoint of segment
      const midPoint = start.clone().lerp(end, 0.5);
      
      // Use the end point as the target for lookAt to ensure arrow follows the path
      const nextPoint = end;
      
      // Only show arrow if this segment is animated
      const segmentIndex = i;
      const totalSegments = linePoints.length - 1;
      const segmentProgress = animationProgress * totalSegments;
      
      if (segmentIndex < segmentProgress) {
        arrowMeshes.push({
          position: midPoint,
          direction: direction,
          nextPoint: nextPoint,
          index: i
        });
      }
    }
    
    return arrowMeshes;
  }, [linePoints, animationProgress]);
  
  if (!animatedGeometry || segmentPoints.length < 2) return null;
  
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("lineSegments", {
    geometry: animatedGeometry,
    renderOrder: 4
  }, /*#__PURE__*/React.createElement("lineBasicMaterial", {
    color: "#22d3ee",
    linewidth: 3,
    depthTest: true,
    depthWrite: false
  })), arrows.map((arrow, idx) => {
    return /*#__PURE__*/React.createElement(Arrow, {
      key: idx,
      position: arrow.position,
      direction: arrow.direction,
      nextPoint: arrow.nextPoint
    });
  }));
}

// --- Polygon Drawing Component ---
function PolygonDrawing({ isDrawingMode, onVertexAdd, globeRadius = 2.06 }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const globeMeshRef = useRef();
  
  React.useEffect(() => {
    if (!isDrawingMode) return;
    
    const handleClick = (event) => {
      if (!globeMeshRef.current) return;
      
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(globeMeshRef.current);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const normalized = point.normalize();
        const surfacePoint = normalized.multiplyScalar(globeRadius);
        const { lat, lng } = vector3ToLatLon(surfacePoint, globeRadius);
        if (onVertexAdd) {
          onVertexAdd(lat, lng);
        }
      }
    };
    
    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.style.cursor = isDrawingMode ? 'crosshair' : 'auto';
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      gl.domElement.style.cursor = 'auto';
    };
  }, [isDrawingMode, onVertexAdd, camera, gl, raycaster, globeRadius]);
  
  return /*#__PURE__*/React.createElement("mesh", {
    ref: globeMeshRef,
    visible: false,
    renderOrder: 1
  }, /*#__PURE__*/React.createElement("sphereGeometry", {
    args: [globeRadius, 64, 64]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    transparent: true,
    opacity: 0
  }));
}

// --- Polygon Renderer Component ---
function PolygonRenderer({ vertices, globeRadius = 2.06 }) {
  // Hooks must be called unconditionally - move them before any early returns
  // Dynamic offset so outline/fill sit above the globe regardless of radius/size
  const offset = Math.max(globeRadius * 0.08, 0.06); // ~8% of radius, min 0.06

  // Create geodesic-curved edges along the sphere by sampling great-circle points
  const points = useMemo(() => {
    if (!vertices || vertices.length < 2) return [];

    // Helper to get a point along the great circle between two vectors
    const slerpPoint = (va, vb, t) => {
      const angle = Math.acos(THREE.MathUtils.clamp(va.dot(vb), -1, 1));
      if (angle === 0) return va.clone();
      const sinAngle = Math.sin(angle);
      const w1 = Math.sin((1 - t) * angle) / sinAngle;
      const w2 = Math.sin(t * angle) / sinAngle;
      return va.clone().multiplyScalar(w1).add(vb.clone().multiplyScalar(w2));
    };

    const expanded = [];
    const samplesPerEdge = 24; // smoothness of curve

    for (let i = 0; i < vertices.length; i++) {
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length]; // wrap for closure

      const va = latLonToVector3(curr.lat, curr.lng, globeRadius).normalize();
      const vb = latLonToVector3(next.lat, next.lng, globeRadius).normalize();

      for (let s = 0; s <= samplesPerEdge; s++) {
        const t = s / samplesPerEdge;
        // Avoid duplicating the first point of the next edge
        if (s > 0 && i === vertices.length - 1 && s === samplesPerEdge) break;
        const p = slerpPoint(va, vb, t).multiplyScalar(globeRadius + offset);
        expanded.push([p.x, p.y, p.z]);
      }
    }

    return expanded;
  }, [vertices, globeRadius, offset]);
  
  // Close the polygon by adding the first point at the end
  const closedPoints = useMemo(() => {
    if (points.length < 2) return points;
    return [...points, points[0]];
  }, [points]);

  const geometry = useMemo(() => {
    if (closedPoints.length < 2) return null;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(closedPoints.flat());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [closedPoints]);
  
  // Create filled polygon geometry (only for closed polygons with 3+ vertices)
  const fillGeometry = useMemo(() => {
    if (!points || points.length < 3) return null;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.flat());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create indices for triangulation (fan from first vertex)
    const indices = [];
    for (let i = 1; i < points.length - 1; i++) {
      indices.push(0, i, i + 1);
    }
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [points]);
  
  // Early return after hooks
  if (!vertices || vertices.length < 2 || !geometry) return null;
  
  return /*#__PURE__*/React.createElement(React.Fragment, null, 
    // Polygon outline
    /*#__PURE__*/React.createElement("line", {
      geometry: geometry,
      renderOrder: 71
    }, /*#__PURE__*/React.createElement("lineBasicMaterial", {
      color: "#00ff88",
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide
    })),
    vertices.map((v, i) => {
      const vec = latLonToVector3(v.lat, v.lng, globeRadius);
      // Offset above globe surface to keep vertices outside the globe
      const normalized = vec.normalize();
      const offsetVec = normalized.multiplyScalar(globeRadius + offset);
      return /*#__PURE__*/React.createElement("mesh", {
        key: i,
        position: [offsetVec.x, offsetVec.y, offsetVec.z],
        renderOrder: 72
      }, /*#__PURE__*/React.createElement("sphereGeometry", {
        args: [0.02, 8, 8]
      }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
        color: "#00ff88",
        transparent: true,
        opacity: 0.95,
        depthTest: true,
        depthWrite: false,
        side: THREE.FrontSide
      }));
    })
  );
}

// --- Screenshot Handler (captures globe or polygon region) ---
function ScreenshotHandler({ polygonVertices, globeRadius = 2.06 }) {
  const { gl, camera, scene } = useThree();
  const offset = Math.max(globeRadius * 0.08, 0.06);

  useEffect(() => {
    if (!gl || !camera || !scene) return;

    const saveBlob = async (blob, name) => {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to download if File System Access API not available
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      }
    };

    const canvasToBlob = (canvas, cropRect) => {
      return new Promise((resolve) => {
        const targetCanvas = cropRect ? (() => {
          const tmp = document.createElement('canvas');
          tmp.width = cropRect.width;
          tmp.height = cropRect.height;
          const ctx = tmp.getContext('2d');
          ctx.drawImage(
            canvas,
            cropRect.x,
            cropRect.y,
            cropRect.width,
            cropRect.height,
            0,
            0,
            cropRect.width,
            cropRect.height
          );
          return tmp;
        })() : canvas;
        targetCanvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    };

    const saveCanvas = async (canvas, name, cropRect) => {
      // Ensure latest frame rendered before capture
      gl.setRenderTarget(null);
      gl.render(scene, camera);

      const blob = await canvasToBlob(canvas, cropRect);
      if (blob) {
        await saveBlob(blob, name);
      }
    };

    const projectPoint = (lat, lng) => {
      const vec = latLonToVector3(lat, lng, globeRadius);
      const offsetVec = vec.normalize().multiplyScalar(globeRadius + offset);
      const projected = offsetVec.project(camera);
      const canvas = gl.domElement;
      return {
        x: (projected.x * 0.5 + 0.5) * canvas.width,
        y: (-projected.y * 0.5 + 0.5) * canvas.height
      };
    };

    const handleGlobe = () => {
      saveCanvas(gl.domElement, 'globe-region.png');
    };

    const handleRegion = () => {
      if (!polygonVertices || polygonVertices.length < 2) return;
      const pts = polygonVertices.map(p => projectPoint(p.lat, p.lng));
      const xs = pts.map(p => p.x);
      const ys = pts.map(p => p.y);
      const minX = Math.max(Math.min(...xs) - 20, 0);
      const maxX = Math.min(Math.max(...xs) + 20, gl.domElement.width);
      const minY = Math.max(Math.min(...ys) - 20, 0);
      const maxY = Math.min(Math.max(...ys) + 20, gl.domElement.height);
      const crop = {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY)
      };
      saveCanvas(gl.domElement, 'region-only.png', crop);
    };

    window.addEventListener('globe-download', handleGlobe);
    window.addEventListener('region-download', handleRegion);
    return () => {
      window.removeEventListener('globe-download', handleGlobe);
      window.removeEventListener('region-download', handleRegion);
    };
  }, [gl, camera, polygonVertices, globeRadius, offset]);

  return null;
}

// --- Main Scene Content ---
function GlobeContent(props) {
  const groupRef = useRef();
  const dataPoints = (props && props.dataPoints) || [];
  const showPath = !!(props && props.showPath);
  const disableAutoRotate = !!(props && props.disableAutoRotate);
  const isPolygonDrawingMode = !!(props && props.isPolygonDrawingMode);
  const onPolygonVertexAdd = props && props.onPolygonVertexAdd;
  const polygonVertices = (props && props.polygonVertices) || [];
  const [isHovered, setIsHovered] = React.useState(false);
  
  useFrame((_, delta) => {
    if (groupRef.current && !isHovered && !disableAutoRotate) {
      groupRef.current.rotation.y += delta * 0.02; // Slower, smoother rotation
    }
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("ambientLight", {
    intensity: 0.5
  }), /*#__PURE__*/React.createElement("directionalLight", {
    position: [5, 10, 5],
    intensity: 0.8
  }), isPolygonDrawingMode && /*#__PURE__*/React.createElement(PolygonDrawing, {
    isDrawingMode: isPolygonDrawingMode,
    onVertexAdd: onPolygonVertexAdd
  }), polygonVertices.length > 0 && /*#__PURE__*/React.createElement(PolygonRenderer, {
    vertices: polygonVertices
  }), /*#__PURE__*/React.createElement("group", {
    ref: groupRef
  }, /*#__PURE__*/React.createElement("mesh", {
    renderOrder: 2.2
  }, /*#__PURE__*/React.createElement("sphereGeometry", {
    args: [2.031, 64, 64]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    wireframe: true,
    color: "rgb(17, 50, 90)",
    depthTest: true,
    depthWrite: false
  })), /*#__PURE__*/React.createElement(Suspense, {
    fallback: null
  }, /*#__PURE__*/React.createElement(Landmasses, null)), showPath && dataPoints && dataPoints.length > 1 && /*#__PURE__*/React.createElement(MigrationPath, {
    dataPoints: dataPoints
  }), dataPoints && dataPoints.length > 0 && /*#__PURE__*/React.createElement("group", null, dataPoints.map((p, i) => {
    const v = latLonToVector3(p.decimalLatitude, p.decimalLongitude, 2.06);
    return /*#__PURE__*/React.createElement("mesh", {
      key: i,
      position: [v.x, v.y, v.z],
      renderOrder: 5,
      onPointerOver: (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        setIsHovered(true); // Pause globe rotation
        // Dispatch custom event with data point info
        window.dispatchEvent(new CustomEvent('globe-point-hover', { 
          detail: { 
            dataPoint: p, 
            position: { x: e.clientX, y: e.clientY }
          } 
        }));
      },
      onPointerOut: (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
        setIsHovered(false); // Resume globe rotation
        window.dispatchEvent(new CustomEvent('globe-point-leave'));
      }
    }, /*#__PURE__*/React.createElement("sphereGeometry", {
      args: [0.01, 8, 8]
    }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
      color: "#22d3ee",
      depthTest: true,
      depthWrite: false
    }));
  }))));
}

// --- Main Exported Globe Component ---
function CameraMonitor({ onChange }) {
  const { camera } = useThree();
  useFrame(() => {
    if (typeof onChange === 'function') {
      const distance = Math.sqrt(camera.position.x * camera.position.x + camera.position.y * camera.position.y + camera.position.z * camera.position.z);
      onChange(distance);
    }
  });
  return null;
}

// Camera Reset Component
function CameraReset({ onReset, focusOnData, dataPoints, enableRotate = true, enableZoom = true, minDistance, maxDistance }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  
  // Store initial camera position and target
  const initialPosition = useRef([0, 0, 7.5]);
  const initialTarget = useRef([0, 0, 0]);
  
  // Calculate zoom limits based on data points if provided
  const calculatedLimits = React.useMemo(() => {
    if (focusOnData && dataPoints && dataPoints.length > 0) {
      // Calculate center of all points
      const center = new THREE.Vector3();
      dataPoints.forEach(point => {
        const v = latLonToVector3(point.decimalLatitude, point.decimalLongitude, 2.06);
        center.add(v);
      });
      center.divideScalar(dataPoints.length);
      
      // Calculate bounding sphere
      let maxDist = 0;
      dataPoints.forEach(point => {
        const v = latLonToVector3(point.decimalLatitude, point.decimalLongitude, 2.06);
        const distance = center.distanceTo(v);
        if (distance > maxDist) maxDist = distance;
      });
      
      // Globe radius is 2.06, ensure we don't go inside
      // minDistance: allow close zoom but stay outside globe (2.06 + buffer)
      const calculatedMin = Math.max(3.2, 2.06 + 1.0);
      // maxDistance: ensure pattern stays visible (pattern size * 4, but not too far)
      const calculatedMax = Math.max(maxDist * 4, 8);
      
      return { min: calculatedMin, max: Math.min(calculatedMax, 15) };
    }
    return null;
  }, [focusOnData, dataPoints]);
  
  // Focus camera on data points if requested
  React.useEffect(() => {
    if (focusOnData && dataPoints && dataPoints.length > 0 && controlsRef.current) {
      // Calculate center of all points
      const center = new THREE.Vector3();
      dataPoints.forEach(point => {
        const v = latLonToVector3(point.decimalLatitude, point.decimalLongitude, 2.06);
        center.add(v);
      });
      center.divideScalar(dataPoints.length);
      
      // Calculate bounding sphere
      let maxDist = 0;
      dataPoints.forEach(point => {
        const v = latLonToVector3(point.decimalLatitude, point.decimalLongitude, 2.06);
        const distance = center.distanceTo(v);
        if (distance > maxDist) maxDist = distance;
      });
      
      // Position camera to view the area - start at a good viewing distance
      const distance = Math.max(maxDist * 3, 5);
      const direction = center.clone().normalize();
      const cameraPos = direction.multiplyScalar(distance);
      
      camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [focusOnData, dataPoints, camera]);
  
  // Expose reset function to parent
  React.useEffect(() => {
    if (onReset) {
      onReset(() => {
        if (controlsRef.current) {
          // Reset camera position
          camera.position.set(...initialPosition.current);
          camera.lookAt(...initialTarget.current);
          // Reset controls
          controlsRef.current.target.set(...initialTarget.current);
          controlsRef.current.update();
        }
      });
    }
  }, [camera, onReset]);
  
  // Use calculated limits if available, otherwise use provided or defaults
  const finalMinDistance = minDistance !== undefined ? minDistance : (calculatedLimits ? calculatedLimits.min : 4.5);
  const finalMaxDistance = maxDistance !== undefined ? maxDistance : (calculatedLimits ? calculatedLimits.max : 10);
  
  return /*#__PURE__*/React.createElement(OrbitControls, {
    ref: controlsRef,
    enablePan: false,
    enableZoom: enableZoom,
    enableRotate: enableRotate,
    minDistance: finalMinDistance,
    maxDistance: finalMaxDistance,
    autoRotate: false
  });
}

export function Globe(props) {
  const onCameraDistanceChange = props && props.onCameraDistanceChange;
  const onResetCamera = props && props.onResetCamera;
  const showStarsOnly = !!(props && props.showStarsOnly);
  const dataPoints = (props && props.dataPoints) || [];
  const showPath = !!(props && props.showPath);
  const focusOnData = !!(props && props.focusOnData);
  const enableRotate = props && props.enableRotate !== undefined ? props.enableRotate : true;
  const enableZoom = props && props.enableZoom !== undefined ? props.enableZoom : true;
  const minDistance = props && props.minDistance;
  const maxDistance = props && props.maxDistance;
  const disableAutoRotate = !!(props && props.disableAutoRotate);
  const isPolygonDrawingMode = !!(props && props.isPolygonDrawingMode);
  const onPolygonVertexAdd = props && props.onPolygonVertexAdd;
  const polygonVertices = (props && props.polygonVertices) || [];
  return /*#__PURE__*/React.createElement(Canvas, {
    camera: {
      position: [0, 0, 7.5],
      fov: 45
    },
    gl: { preserveDrawingBuffer: true }
  }, /*#__PURE__*/React.createElement(Stars, {
    radius: 100,
    depth: 50,
    count: 4000,
    factor: 4,
    saturation: 0,
    fade: true,
    speed: 1
  }), /*#__PURE__*/React.createElement(Sparkles, {
    count: 250,
    size: 2.5,
    speed: 0.4,
    opacity: 0.5,
    color: "white",
    scale: [200, 200, 200]
  }), /*#__PURE__*/React.createElement(Suspense, {
    fallback: null
  }, showStarsOnly ? null : /*#__PURE__*/React.createElement(GlobeContent, { dataPoints: dataPoints, showPath: showPath, disableAutoRotate: disableAutoRotate, isPolygonDrawingMode: isPolygonDrawingMode, onPolygonVertexAdd: onPolygonVertexAdd, polygonVertices: polygonVertices })), /*#__PURE__*/React.createElement(CameraReset, { onReset: onResetCamera, focusOnData: focusOnData, dataPoints: dataPoints, enableRotate: enableRotate, enableZoom: enableZoom, minDistance: minDistance, maxDistance: maxDistance }), /*#__PURE__*/React.createElement(CameraMonitor, { onChange: onCameraDistanceChange }), /*#__PURE__*/React.createElement(ScreenshotHandler, { polygonVertices: polygonVertices, globeRadius: 2.06 }));
}
