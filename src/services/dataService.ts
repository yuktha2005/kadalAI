import { DataPoint } from '../App';

export class DataService {
  private static instance: DataService;
  private dataPoints: DataPoint[] = [];

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async loadOccurrenceData(): Promise<DataPoint[]> {
    try {
      const response = await fetch('/data/occurrence.txt');
      const text = await response.text();
      
      const lines = text.split('\n').filter(line => line.trim());

      
      this.dataPoints = lines.slice(1).map(line => {
        const values = line.split('\t');
        const dataPoint: DataPoint = {
          scientificName: values[29] || '', // scientificName is at index 29
          locality: values[18] || '', // locality is at index 18
          eventDate: values[12] || '', // eventDate is at index 12
          decimalLatitude: parseFloat(values[21]) || 0, // decimalLatitude is at index 21
          decimalLongitude: parseFloat(values[22]) || 0, // decimalLongitude is at index 22
          waterBody: values[16] || '', // waterBody is at index 16
          samplingProtocol: values[15] || '', // samplingProtocol is at index 15
          minimumDepthInMeters: parseFloat(values[19]) || 0, // minimumDepthInMeters is at index 19
          maximumDepthInMeters: parseFloat(values[20]) || 0, // maximumDepthInMeters is at index 20
          identifiedBy: values[25] || '' // identifiedBy is at index 25
        };
        return dataPoint;
      });

      return this.dataPoints;
    } catch (error) {
      console.error('Error loading occurrence data:', error);
      return this.getMockData();
    }
  }

  public getDataPoints(): DataPoint[] {
    return this.dataPoints;
  }

  public getDataPointsByWaterBody(waterBody: string): DataPoint[] {
    return this.dataPoints.filter(point => point.waterBody === waterBody);
  }

  public getDataPointsBySpecies(species: string): DataPoint[] {
    return this.dataPoints.filter(point => 
      point.scientificName.toLowerCase().includes(species.toLowerCase())
    );
  }

  private getMockData(): DataPoint[] {
    return [
      {
        scientificName: 'Harpiliopsis depressa',
        locality: 'Andaman Sea, India',
        eventDate: '2024-01-15',
        decimalLatitude: 12.5,
        decimalLongitude: 92.7,
        waterBody: 'Andaman Sea',
        samplingProtocol: 'SCUBA diving',
        minimumDepthInMeters: 5,
        maximumDepthInMeters: 15,
        identifiedBy: 'Dr. Marine Biologist'
      },
      {
        scientificName: 'Planktonic Algae',
        locality: 'Arabian Sea, India',
        eventDate: '2024-02-03',
        decimalLatitude: 20.0,
        decimalLongitude: 70.0,
        waterBody: 'Arabian Sea',
        samplingProtocol: 'Water sampling',
        minimumDepthInMeters: 0,
        maximumDepthInMeters: 10,
        identifiedBy: 'Dr. Oceanographer'
      },
      {
        scientificName: 'Coral Reef Fish',
        locality: 'Bay of Bengal, India',
        eventDate: '2024-01-28',
        decimalLatitude: 15.0,
        decimalLongitude: 80.0,
        waterBody: 'Bay of Bengal',
        samplingProtocol: 'Underwater photography',
        minimumDepthInMeters: 2,
        maximumDepthInMeters: 8,
        identifiedBy: 'Dr. Marine Ecologist'
      }
    ];
  }
}
