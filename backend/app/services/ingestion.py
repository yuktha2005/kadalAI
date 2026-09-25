import pandas as pd
from typing import List, Dict, Any
from app.models.marine_data import OccurrenceRecord, CTDRecord, AWSRecord, ADCPRecord, MarineBaseRecord
from datetime import datetime

class IngestionPipeline:
    def __init__(self):
        self.records_processed = 0
        self.records_rejected = 0
        self.errors = []

    def ingest_occurrence_txt(self, filepath: str) -> List[OccurrenceRecord]:
        try:
            # Read tab-separated txt file
            df = pd.read_csv(filepath, sep='\t', low_memory=False)
            
            valid_records = []
            for index, row in df.head(500).iterrows():
                try:
                    # Safely extract and convert fields
                    lat = float(row.get('decimalLatitude')) if pd.notna(row.get('decimalLatitude')) else None
                    lon = float(row.get('decimalLongitude')) if pd.notna(row.get('decimalLongitude')) else None
                    
                    if lat is None or lon is None:
                        raise ValueError("Missing coordinates")

                    event_date_str = row.get('eventDate')
                    if pd.isna(event_date_str):
                        raise ValueError("Missing eventDate")
                        
                    # Handle basic date parsing
                    try:
                        dt = pd.to_datetime(event_date_str).to_pydatetime()
                    except:
                        dt = datetime.now() # Fallback for now if format is too strange

                    record = OccurrenceRecord(
                        record_id=str(row.get('occurrenceID', f"occ_{index}")),
                        dataset_source=str(row.get('datasetName', 'Unknown')),
                        data_type='OCCURRENCE',
                        timestamp=dt,
                        latitude=lat,
                        longitude=lon,
                        water_body=str(row.get('waterBody', 'Unknown')),
                        scientific_name=str(row.get('scientificName', 'Unknown')),
                        locality=str(row.get('locality')) if pd.notna(row.get('locality')) else None,
                        depth_min=float(row.get('minimumDepthInMeters')) if pd.notna(row.get('minimumDepthInMeters')) else None,
                        depth_max=float(row.get('maximumDepthInMeters')) if pd.notna(row.get('maximumDepthInMeters')) else None,
                        sampling_protocol=str(row.get('samplingProtocol')) if pd.notna(row.get('samplingProtocol')) else None,
                        identified_by=str(row.get('identifiedBy')) if pd.notna(row.get('identifiedBy')) else None,
                    )
                    valid_records.append(record)
                    self.records_processed += 1
                except Exception as e:
                    self.records_rejected += 1
                    self.errors.append(f"Row {index}: {str(e)}")
            
            return valid_records
        except Exception as e:
            print(f"Failed to read file {filepath}: {e}")
            return []

    def ingest_ctd_asc(self, filepath: str) -> List[CTDRecord]:
        import re
        valid_records = []
        try:
            df = pd.read_csv(filepath, sep=r'\s+')
            for index, row in df.iterrows():
                try:
                    # Assigning dummy geo-coordinates for CTD cast since .asc lacks them
                    # Real CTD casts have a .hdr file with coordinates
                    dt = datetime.now()
                    lat = 10.0
                    lon = 75.0
                    
                    record = CTDRecord(
                        record_id=f"ctd_{index}",
                        dataset_source="CTD Sample",
                        data_type='CTD',
                        timestamp=dt,
                        latitude=lat,
                        longitude=lon,
                        water_body="Indian Ocean",
                        temperature_celsius=float(row.get('T090C', 0)),
                        salinity_psu=float(row.get('Sal00', 0)),
                        oxygen_ml_l=float(row.get('Sbeox0ML/L', 0)),
                        depth_meters=float(row.get('DepSM', 0))
                    )
                    valid_records.append(record)
                    self.records_processed += 1
                except Exception as e:
                    self.records_rejected += 1
                    self.errors.append(f"CTD Row {index}: {str(e)}")
        except Exception as e:
            print(f"Failed to read CTD {filepath}: {e}")
        return valid_records

    def ingest_aws_txt(self, filepath: str) -> List[AWSRecord]:
        from datetime import datetime
        valid_records = []
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
            for index, line in enumerate(lines):
                if line.startswith("$GPS") and "Date" not in line:
                    parts = line.strip().split()
                    if len(parts) < 25: continue
                    try:
                        dt = datetime.strptime(f"{parts[1]} {parts[2]}", "%d/%m/%y %H:%M:%S")
                        
                        lat_str = parts[3]
                        lat_deg = float(lat_str[:2])
                        lat_min = float(lat_str[2:])
                        lat = lat_deg + lat_min / 60.0
                        if parts[4] == 'S': lat = -lat
                        
                        lon_str = parts[5]
                        lon_deg = float(lon_str[:3])
                        lon_min = float(lon_str[3:])
                        lon = lon_deg + lon_min / 60.0
                        if parts[6] == 'W': lon = -lon
                        
                        wind_speed = float(parts[14])
                        air_temp = float(parts[16])
                        sst = float(parts[22])
                        
                        record = AWSRecord(
                            record_id=f"aws_{index}", dataset_source="AWS Sample", data_type="AWS",
                            timestamp=dt, latitude=lat, longitude=lon, water_body="Arabian Sea",
                            wind_speed_m_s=wind_speed, air_temperature_celsius=air_temp, sea_surface_temperature_celsius=sst
                        )
                        valid_records.append(record)
                        self.records_processed += 1
                    except Exception as e:
                        self.records_rejected += 1
                        self.errors.append(f"AWS Row {index}: {str(e)}")
        except Exception as e:
            print(f"Failed to read AWS {filepath}: {e}")
        return valid_records

    def ingest_adcp_txt(self, filepath: str) -> List[ADCPRecord]:
        from datetime import datetime
        valid_records = []
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
            for index, line in enumerate(lines):
                parts = line.strip().split()
                if len(parts) > 20 and '.' in parts[-10]:
                    try:
                        # Attempt loose parsing
                        lat = float(parts[-10])
                        lon = float(parts[-9])
                        dt = datetime.now() # Fallback for complex ADCP time formats
                        # We just take a generic velocity metric from one of the columns
                        avg_speed = float(parts[8]) if len(parts) > 8 else 0.0
                        
                        record = ADCPRecord(
                            record_id=f"adcp_{index}", dataset_source="ADCP Sample", data_type="ADCP",
                            timestamp=dt, latitude=lat, longitude=lon, water_body="Arabian Sea",
                            average_current_speed_m_s=avg_speed,
                            eastward_velocity_m_s=None,
                            northward_velocity_m_s=None
                        )
                        valid_records.append(record)
                        self.records_processed += 1
                    except Exception as e:
                        self.records_rejected += 1
                        self.errors.append(f"ADCP Row {index}: {str(e)}")
        except Exception as e:
            print(f"Failed to read ADCP {filepath}: {e}")
        return valid_records

    def get_ingestion_report(self) -> Dict[str, Any]:
        return {
            "records_processed": self.records_processed,
            "records_rejected": self.records_rejected,
            "errors": self.errors[:10]
        }
