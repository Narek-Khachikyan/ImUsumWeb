from fastapi.testclient import TestClient

from app.models.user import User


def test_register(client: TestClient):
    """Test user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "newuser@example.com"
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email(client: TestClient, test_user: User):
    """Test registration with existing email."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "password123",
            "first_name": "Duplicate",
            "last_name": "User",
        },
    )
    assert response.status_code == 409


def test_login(client: TestClient, test_user: User):
    """Test user login."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == test_user.email
    assert "access_token" in data


def test_login_wrong_password(client: TestClient, test_user: User):
    """Test login with wrong password."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


def test_get_me(client: TestClient, test_user: User):
    """Test get current user."""
    # First login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword",
        },
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == test_user.email


def test_get_me_no_token(client: TestClient):
    """Test get current user without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403  # FastAPI returns 403 for missing auth header
