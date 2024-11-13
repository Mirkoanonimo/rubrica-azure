import pytest
import logging
from fastapi.testclient import TestClient

logger = logging.getLogger("api_tests")

def test_register(client):
    """Test registrazione nuovo utente"""
    logger.info("Testing user registration")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "Test123!",
            "tenant_name": "newtenant"
        }
    )
    
    assert response.status_code == 201, f"Registration failed: {response.json()}"
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    logger.info("User registration test passed")

def test_login(client, test_user):
    """Test login utente"""
    logger.info("Testing user login")
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": test_user["password"]
        }
    )
    
    assert response.status_code == 200, f"Login failed: {response.json()}"
    data = response.json()
    assert "access_token" in data
    logger.info("User login test passed")

def test_me(client, test_user):
    """Test endpoint /me"""
    logger.info("Testing /me endpoint")
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200, f"Me endpoint failed: {response.json()}"
    data = response.json()
    assert data["user"]["email"] == test_user["user"].email
    logger.info("Me endpoint test passed")

def test_password_reset_request(client, test_user):
    """Test richiesta reset password"""
    logger.info("Testing password reset request")
    response = client.post(
        "/api/v1/auth/password-reset",
        json={
            "email": test_user["user"].email
        }
    )
    
    assert response.status_code == 202, f"Password reset request failed: {response.json()}"
    logger.info("Password reset request test passed")

def test_invalid_login(client):
    """Test login con credenziali invalide"""
    logger.info("Testing invalid login")
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": "wronguser",
            "password": "wrongpass"
        }
    )
    
    assert response.status_code == 401, "Invalid login should fail"
    logger.info("Invalid login test passed")