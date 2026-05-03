from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/admin/products", tags=["Admin Products"])


# =========================
# GET PRODUCTS (avec filtres + tri)
# =========================
@router.get("/", response_model=List[schemas.Product])
def get_products(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    in_stock: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)

    if category:
        query = query.filter(models.Product.category == category)

    if is_active is not None:
        query = query.filter(models.Product.is_active == is_active)

    if in_stock is not None:
        if in_stock:
            query = query.filter(models.Product.stock > 0)
        else:
            query = query.filter(models.Product.stock <= 0)

    return query.order_by(models.Product.id.desc()).all()


# =========================
# GET SINGLE PRODUCT (important pour edit)
# =========================
@router.get("/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    return product


# =========================
# CREATE PRODUCT
# =========================
@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    try:
        db_product = models.Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur création produit: {str(e)}")


# =========================
# UPDATE PRODUCT (partiel)
# =========================
@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    update_data = product.dict(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")

    try:
        for key, value in update_data.items():
            setattr(db_product, key, value)

        db.commit()
        db.refresh(db_product)
        return db_product

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur mise à jour: {str(e)}")


# =========================
# TOGGLE ACTIVE
# =========================
@router.put("/{product_id}/toggle", response_model=schemas.Product)
def toggle_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    try:
        db_product.is_active = not db_product.is_active
        db.commit()
        db.refresh(db_product)
        return db_product

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur toggle: {str(e)}")


# =========================
# DELETE PRODUCT
# =========================
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    try:
        db.delete(db_product)
        db.commit()
        return

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur suppression: {str(e)}")