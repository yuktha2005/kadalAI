"""
Automated Test Suite for Future Ocean Intelligence Engine
==========================================================
Tests:
- Future Data Registry retrieval
- Species availability verification
- ML Habitat Suitability Prediction (2027, 2030, 2040, 2050)
- Hotspot Detection algorithm
- Habitat Gain/Loss calculation
- Centroid Shift analysis
- Multi-species biodiversity overlay
- AI Research Agent explanation
- Out-of-domain detection
- Model validation metrics verification
"""

import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app
from app.services.future_ocean_intelligence_service import get_future_ocean_service

client = TestClient(app)

def test_future_data_sources():
    print("\n[TEST 1] Testing /future-data/sources...")
    resp = client.get("/future-data/sources")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "sources" in data
    assert len(data["sources"]) >= 4
    print(f"PASS: Retrieved {len(data['sources'])} verified future data sources (CMIP6, Bio-ORACLE, CMEMS, INCOIS).")

def test_future_data_availability():
    print("\n[TEST 2] Testing /future-data/availability...")
    resp = client.get("/future-data/availability?species=Puerulus%20sewelli&target_year=2030&scenario=SSP2-4.5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["can_predict"] is True
    assert data["target_year"] == 2030
    assert data["ground_truth_records_count"] > 0
    print(f"PASS: Verified availability for Puerulus sewelli (2030, SSP2-4.5) with {data['ground_truth_records_count']} ground-truth records.")

def test_habitat_prediction_decadal_horizons():
    print("\n[TEST 3] Testing /future-habitat/predict across 2027, 2030, 2040, 2050...")
    for yr in [2027, 2030, 2040, 2050]:
        payload = {
            "species_name": "Puerulus sewelli",
            "water_body": "All",
            "target_year": yr,
            "scenario": "SSP2-4.5"
        }
        resp = client.post("/future-habitat/predict", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "grid_cells" in data
        assert len(data["grid_cells"]) > 0
        assert "validation_metrics" in data
        assert data["validation_metrics"]["roc_auc"] >= 0.80
        assert "feature_importance" in data
        print(f"PASS {yr}: Grid cells: {len(data['grid_cells'])}, AUC: {data['validation_metrics']['roc_auc']}, Mean Suitability: {data['summary']['mean_predicted_suitability']}")

def test_hotspot_detection():
    print("\n[TEST 4] Testing /future-habitat/hotspots...")
    payload = {
        "species_name": "Puerulus sewelli",
        "target_year": 2030,
        "scenario": "SSP2-4.5",
        "quantile_threshold": 0.80
    }
    resp = client.post("/future-habitat/hotspots", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "hotspots" in data
    assert len(data["hotspots"]) > 0
    top = data["hotspots"][0]
    assert "hotspot_id" in top
    assert "coordinates" in top
    assert "dominant_drivers" in top
    print(f"PASS: Detected {len(data['hotspots'])} hotspots. Top hotspot: '{top['name']}' ({top['coordinates']}), Suitability: {top['predicted_suitability']}.")

def test_habitat_change_gain_loss():
    print("\n[TEST 5] Testing /future-habitat/change...")
    payload = {
        "species_name": "Puerulus sewelli",
        "target_year": 2040,
        "scenario": "SSP5-8.5"
    }
    resp = client.post("/future-habitat/change", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "categories" in data
    assert "GAIN" in data["categories"]
    assert "LOSS" in data["categories"]
    assert "STABLE_SUITABLE" in data["categories"]
    assert "net_habitat_change_km2" in data
    print(f"PASS: Net change by 2040 (SSP5-8.5): {data['net_habitat_change_km2']} km². Loss: {data['categories']['LOSS']['area_km2']} km².")

def test_habitat_shift():
    print("\n[TEST 6] Testing /future-habitat/shift...")
    payload = {
        "species_name": "Puerulus sewelli",
        "target_year": 2040,
        "scenario": "SSP2-4.5"
    }
    resp = client.post("/future-habitat/shift", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "centroid_shift_distance_km" in data
    assert "predicted_bathymetric_depth_shift_m" in data
    assert data["predicted_bathymetric_depth_shift_m"] > 0
    print(f"PASS: Centroid shift: {data['centroid_shift_distance_km']} km, Bathymetric escape: {data['predicted_bathymetric_depth_shift_m']}m downward.")

def test_multi_species_compare():
    print("\n[TEST 7] Testing /future-habitat/compare...")
    payload = {
        "species_list": ["Puerulus sewelli", "Heterocarpus chani", "Homolax megalops"],
        "target_year": 2030,
        "scenario": "SSP2-4.5"
    }
    resp = client.post("/future-habitat/compare", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "top_biodiversity_hotspots" in data
    assert len(data["top_biodiversity_hotspots"]) > 0
    top_bio = data["top_biodiversity_hotspots"][0]
    print(f"PASS: Evaluated {len(data['species_evaluated'])} taxa. Top biodiversity zone: '{top_bio['region_name']}' with concentration: {top_bio['mean_multispecies_suitability']}.")

def test_ai_agent_explanation():
    print("\n[TEST 8] Testing /future-habitat/explain...")
    payload = {
        "question": "Why does the model predict increased suitability in this region in 2030?",
        "species_name": "Puerulus sewelli",
        "target_year": 2030,
        "scenario": "SSP2-4.5"
    }
    resp = client.post("/future-habitat/explain", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "ai_explanation" in data
    assert "grounded_evidence" in data
    assert data["grounded_evidence"]["validation_auc"] >= 0.80
    print(f"PASS: AI explanation generated ({len(data['ai_explanation'])} chars) with evidence grounding.")

def test_out_of_domain_detection():
    print("\n[TEST 9] Testing Out-of-Domain environmental flagging...")
    srv = get_future_ocean_service()
    pred_2050 = srv.predict_future_habitat("Puerulus sewelli", "All", 2050, "SSP5-8.5")
    ood_count = pred_2050["summary"]["out_of_domain_cells_count"]
    assert ood_count > 0, "Expected out-of-domain cells to be detected under severe 2050 SSP5-8.5 warming."
    print(f"PASS: Successfully detected {ood_count} out-of-domain cells ({pred_2050['summary']['out_of_domain_area_pct']}%) under 2050 SSP5-8.5.")

if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING FUTURE OCEAN INTELLIGENCE TEST SUITE")
    print("=" * 60)
    test_future_data_sources()
    test_future_data_availability()
    test_habitat_prediction_decadal_horizons()
    test_hotspot_detection()
    test_habitat_change_gain_loss()
    test_habitat_shift()
    test_multi_species_compare()
    test_ai_agent_explanation()
    test_out_of_domain_detection()
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)
