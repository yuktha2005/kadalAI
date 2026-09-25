from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal

class MarineBaseRecord(BaseModel):
    record_id: str
    dataset_source: str
    data_type: Literal['OCCURRENCE', 'CTD', 'AWS', 'ADCP']
    timestamp: datetime
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    water_body: str

class OccurrenceRecord(MarineBaseRecord):
    scientific_name: str
    locality: Optional[str]
    depth_min: Optional[float]
    depth_max: Optional[float]
    sampling_protocol: Optional[str]
    identified_by: Optional[str]

class CTDRecord(MarineBaseRecord):
    temperature_celsius: Optional[float]
    salinity_psu: Optional[float]
    oxygen_ml_l: Optional[float]
    depth_meters: Optional[float]

class AWSRecord(MarineBaseRecord):
    wind_speed_m_s: Optional[float]
    air_temperature_celsius: Optional[float]
    sea_surface_temperature_celsius: Optional[float]

class ADCPRecord(MarineBaseRecord):
    eastward_velocity_m_s: Optional[float]
    northward_velocity_m_s: Optional[float]
    average_current_speed_m_s: Optional[float]
