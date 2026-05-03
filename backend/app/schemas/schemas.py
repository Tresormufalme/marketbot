from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# =========================
# PRODUITS
# =========================

class ProductBase(BaseModel):
    name: str
    description: str
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    image_url: Optional[str] = None
    category: str
    is_active: bool = True
    


class ProductCreate(ProductBase):
    pass


# 👉 IMPORTANT pour update partiel (PATCH)
class ProductUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str]
    category: Optional[str]
    is_active: Optional[bool]


class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True


# =========================
# ORDER ITEMS
# =========================

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderItem(OrderItemBase):
    id: int
    product_name: Optional[str]
    price: Optional[float]

    class Config:
        from_attributes = True


# =========================
# COMMANDES
# =========================

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    items: List[OrderItemBase]


class Order(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    total_price: float
    status: str
    qr_code: Optional[str]
    created_at: datetime

    # 👉 IMPORTANT : détails produits
    items: List[OrderItem] = []

    class Config:
        from_attributes = True


# =========================
# UPDATE STATUT COMMANDE
# =========================

class OrderStatusUpdate(BaseModel):
    status: str