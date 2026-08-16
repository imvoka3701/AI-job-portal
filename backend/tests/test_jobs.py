"""Tests for jobs endpoints."""

from fastapi.testclient import TestClient


class TestJobsList:
    def test_list_jobs_empty(self, client: TestClient):
        """Test listing jobs when none exist."""
        response = client.get("/jobs")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_get_job_not_found(self, client: TestClient):
        """Test getting a non-existent job returns 404."""
        response = client.get("/jobs/999")
        assert response.status_code == 404
