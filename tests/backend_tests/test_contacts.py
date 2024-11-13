import pytest
import logging
from fastapi.testclient import TestClient
from pathlib import Path

# Configurazione logger specifica per i test dei contatti
logger = logging.getLogger("api_tests.contacts")

def test_create_contact(client, test_user):
    """Test creazione contatto"""
    logger.info("Testing contact creation")
    response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890"
        }
    )
    
    assert response.status_code == 201, f"Contact creation failed: {response.json()}"
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["email"] == "john.doe@example.com"
    assert "id" in data
    assert "created_at" in data
    logger.info(f"Contact creation test passed - Created contact with ID: {data['id']}")

def test_get_contacts(client, test_user):
    """Test lista contatti"""
    logger.info("Testing contacts list retrieval")
    # Prima creiamo alcuni contatti per il test
    contacts_to_create = [
        {"first_name": "Test1", "last_name": "User1", "email": "test1@example.com"},
        {"first_name": "Test2", "last_name": "User2", "email": "test2@example.com"}
    ]
    
    for contact in contacts_to_create:
        client.post(
            "/api/v1/contacts",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json=contact
        )
    
    response = client.get(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200, f"Get contacts failed: {response.json()}"
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2
    logger.info(f"Contacts list retrieval test passed - Found {data['total']} contacts")

def test_search_contacts(client, test_user):
    """Test ricerca contatti"""
    logger.info("Testing contact search")
    # Prima creiamo un contatto
    create_response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com"
        }
    )
    assert create_response.status_code == 201, "Failed to create test contact"
    created_contact = create_response.json()
    
    # Poi testiamo la ricerca
    response = client.post(
        "/api/v1/contacts/search",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "query": "Jane",
            "favorite_only": False
        }
    )
    
    assert response.status_code == 200, f"Contact search failed: {response.json()}"
    data = response.json()
    assert len(data) > 0
    assert data[0]["first_name"] == "Jane"
    assert data[0]["email"] == "jane.smith@example.com"
    logger.info(f"Contact search test passed - Found {len(data)} matching contacts")

def test_update_contact(client, test_user):
    """Test aggiornamento contatto"""
    logger.info("Testing contact update")
    # Prima creiamo un contatto
    create_response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "Update",
            "last_name": "Test",
            "email": "update.test@example.com"
        }
    )
    assert create_response.status_code == 201, "Failed to create test contact"
    contact_id = create_response.json()["id"]
    
    # Poi lo aggiorniamo
    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "email": "updated.test@example.com"
    }
    
    response = client.put(
        f"/api/v1/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json=update_data
    )
    
    assert response.status_code == 200, f"Contact update failed: {response.json()}"
    data = response.json()
    assert data["first_name"] == update_data["first_name"]
    assert data["last_name"] == update_data["last_name"]
    assert data["email"] == update_data["email"]
    logger.info(f"Contact update test passed - Updated contact ID: {contact_id}")

def test_delete_contact(client, test_user):
    """Test eliminazione contatto"""
    logger.info("Testing contact deletion")
    # Prima creiamo un contatto
    create_response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "Delete",
            "last_name": "Test",
            "email": "delete.test@example.com"
        }
    )
    assert create_response.status_code == 201, "Failed to create test contact"
    contact_id = create_response.json()["id"]
    
    # Poi lo eliminiamo
    response = client.delete(
        f"/api/v1/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 204, f"Contact deletion failed: {response.status_code}"
    
    # Verifichiamo che il contatto sia stato effettivamente eliminato
    get_response = client.get(
        f"/api/v1/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    assert get_response.status_code == 404, "Contact should not exist after deletion"
    logger.info(f"Contact deletion test passed - Deleted contact ID: {contact_id}")

def test_get_single_contact(client, test_user):
    """Test recupero singolo contatto"""
    logger.info("Testing single contact retrieval")
    # Prima creiamo un contatto
    create_response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "Single",
            "last_name": "Test",
            "email": "single.test@example.com"
        }
    )
    assert create_response.status_code == 201, "Failed to create test contact"
    contact_id = create_response.json()["id"]
    
    # Poi lo recuperiamo
    response = client.get(
        f"/api/v1/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200, f"Get single contact failed: {response.json()}"
    data = response.json()
    assert data["first_name"] == "Single"
    assert data["last_name"] == "Test"
    assert data["email"] == "single.test@example.com"
    assert data["id"] == contact_id
    logger.info(f"Single contact retrieval test passed - Retrieved contact ID: {contact_id}")

def test_error_cases(client, test_user):
    """Test casi di errore"""
    logger.info("Testing error cases")
    
    # Test creazione contatto con dati invalidi
    response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "",  # Nome vuoto non permesso
            "last_name": "Test",
            "email": "invalid.test@example.com"
        }
    )
    assert response.status_code == 422, "Validation error test failed"
    logger.info("Validation error test passed")
    
    # Test accesso a contatto inesistente
    response = client.get(
        "/api/v1/contacts/99999",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    assert response.status_code == 404, "Not found error test failed"
    logger.info("Not found error test passed")
    
    # Test accesso non autorizzato
    response = client.get("/api/v1/contacts")
    assert response.status_code == 401, "Unauthorized error test failed"
    logger.info("Unauthorized error test passed")
    
    # Test creazione contatto con email invalida
    response = client.post(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {test_user['token']}"},
        json={
            "first_name": "Test",
            "last_name": "Invalid",
            "email": "not-an-email"  # Email invalida
        }
    )
    assert response.status_code == 422, "Invalid email validation test failed"
    logger.info("All error cases tests passed")