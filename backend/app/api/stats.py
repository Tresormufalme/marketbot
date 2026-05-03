from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models import models

router = APIRouter(prefix="/admin/stats", tags=["Admin Stats"])

@router.get("/")
def get_stats(db: Session = Depends(get_db)):
    # Date d'aujourd'hui
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)
    
    # Commandes aujourd'hui
    today_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) == today
    ).count()
    
    # Commandes hier
    yesterday_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) == yesterday
    ).count()
    
    # Calcul variation aujourd'hui vs hier
    today_vs_yesterday = 0
    if yesterday_orders > 0:
        today_vs_yesterday = int(((today_orders - yesterday_orders) / yesterday_orders) * 100)
    elif today_orders > 0:
        today_vs_yesterday = 100
    
    # Commandes cette semaine
    week_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) >= week_ago
    ).count()
    
    # Commandes semaine dernière
    last_week_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) >= two_weeks_ago,
        func.date(models.Order.created_at) < week_ago
    ).count()
    
    # Calcul variation semaine vs semaine dernière
    week_vs_last = 0
    if last_week_orders > 0:
        week_vs_last = int(((week_orders - last_week_orders) / last_week_orders) * 100)
    elif week_orders > 0:
        week_vs_last = 100
    
    # Chiffre d'affaires total
    total_revenue = db.query(func.sum(models.Order.total_price)).scalar() or 0
    
    # Top produits (via OrderItem)
    top_products_data = (
        db.query(
            models.Product.name,
            models.Product.category,
            func.sum(models.OrderItem.quantity).label("total_quantity")
        )
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)
        .group_by(models.Product.id, models.Product.name, models.Product.category)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(3)
        .all()
    )
    
    top_products = [
        {
            "name": p.name,
            "category": p.category,
            "total_quantity": int(p.total_quantity)
        }
        for p in top_products_data
    ]
    
    # Statistiques par statut
    pending_orders = db.query(models.Order).filter(models.Order.status == "en_attente").count()
    confirmed_orders = db.query(models.Order).filter(models.Order.status == "confirmée").count()
    delivered_orders = db.query(models.Order).filter(models.Order.status == "livrée").count()
    cancelled_orders = db.query(models.Order).filter(models.Order.status == "annulée").count()
    
    return {
        "today_orders": today_orders,
        "today_vs_yesterday": today_vs_yesterday,
        "week_orders": week_orders,
        "week_vs_last": week_vs_last,
        "total_revenue": total_revenue,
        "top_products": top_products,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders
    }