from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
from app.schemas import schemas # Assure-toi d'avoir un schéma Order

router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])

@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    # .all() renvoie une liste, FastAPI s'occupe de la conversion JSON
    return db.query(models.Order).order_by(models.Order.id.desc()).all()

@router.put("/{order_id}/status")
def update_status(order_id: int, data: dict, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    if "status" not in data:
        raise HTTPException(status_code=400, detail="Le champ 'status' est requis")

    try:
        order.status = data["status"]
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))