from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_director
from app.models.blog import BlogPost
from app.schemas.blog import BlogPostCreate, BlogPostRead, BlogPostUpdate

router = APIRouter()


@router.get("", response_model=List[BlogPostRead])
async def get_all_blogs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    hot: bool = None,
    db: Session = Depends(get_db),
):
    """
    Get all blog posts.
    Matches frontend: blogService.getAll()
    """
    query = db.query(BlogPost)
    if hot is not None:
        query = query.filter(BlogPost.hot == hot)
    blogs = query.order_by(BlogPost.date.desc()).offset(skip).limit(limit).all()
    return blogs


@router.get("/{blog_id}", response_model=BlogPostRead)
async def get_blog(blog_id: int, db: Session = Depends(get_db)):
    """
    Get blog post by ID.
    Matches frontend: blogService.getById(id)
    """
    blog = db.query(BlogPost).filter(BlogPost.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    return blog


@router.post("", response_model=BlogPostRead, status_code=status.HTTP_201_CREATED)
async def create_blog(
    blog_in: BlogPostCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_director),
):
    """
    Create a new blog post (Director only).
    Matches frontend: blogService.create(data)
    """
    blog = BlogPost(
        title=blog_in.title,
        image=blog_in.image,
        letter=blog_in.letter,
        date=blog_in.date,
        hot=blog_in.hot,
    )
    db.add(blog)
    db.commit()
    db.refresh(blog)
    return blog


@router.put("/{blog_id}", response_model=BlogPostRead)
async def update_blog(
    blog_id: int,
    blog_in: BlogPostUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_director),
):
    """
    Update a blog post (Director only).
    Matches frontend: blogService.update(id, data)
    """
    blog = db.query(BlogPost).filter(BlogPost.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    update_data = blog_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(blog, field, value)

    db.commit()
    db.refresh(blog)
    return blog


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_director),
):
    """
    Delete a blog post (Director only).
    Matches frontend: blogService.delete(id)
    """
    blog = db.query(BlogPost).filter(BlogPost.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    db.delete(blog)
    db.commit()
    return None
