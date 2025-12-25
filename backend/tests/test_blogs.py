from datetime import date
from fastapi.testclient import TestClient

from app.models.user import User
from app.models.blog import BlogPost


def test_get_blogs_empty(client: TestClient):
    """Test getting blogs when none exist."""
    response = client.get("/api/v1/blogs")
    assert response.status_code == 200
    assert response.json() == []


def test_create_blog(client: TestClient, test_director: User):
    """Test creating a blog post."""
    # Login as director
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_director.email,
            "password": "testpassword",
        },
    )
    token = login_response.json()["access_token"]

    # Create blog
    response = client.post(
        "/api/v1/blogs",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Test Blog",
            "letter": "This is a test blog post content.",
            "date": str(date.today()),
            "hot": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Blog"
    assert data["letter"] == "This is a test blog post content."
    assert data["hot"] == True


def test_create_blog_unauthorized(client: TestClient, test_user: User):
    """Test creating a blog post as student (should fail)."""
    # Login as student
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword",
        },
    )
    token = login_response.json()["access_token"]

    # Try to create blog
    response = client.post(
        "/api/v1/blogs",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Test Blog",
            "letter": "Content",
            "date": str(date.today()),
        },
    )
    assert response.status_code == 403


def test_get_blog_not_found(client: TestClient):
    """Test getting a non-existent blog."""
    response = client.get("/api/v1/blogs/999")
    assert response.status_code == 404
