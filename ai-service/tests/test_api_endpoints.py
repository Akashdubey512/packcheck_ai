"""
Integration Tests for FastAPI Auditor Server Endpoints
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestAPIEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "HEALTHY")

    def test_readiness_endpoint(self):
        resp = self.client.get("/ready")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "READY")

if __name__ == "__main__":
    unittest.main()
