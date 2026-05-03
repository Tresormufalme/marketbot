# from backend.app.api import bots
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.models import models  # Importe tes modèles
# from app.database import engine # ← Importe engine depuis database
# from app.api import products, stats, orders

# models.Base.metadata.create_all(bind=engine)
# app = FastAPI(title="MarketBot API")

# # =========================
# # CORS CONFIG
# # =========================
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000",
#         "http://frontend:3000",  # Ajoute le nom du service
#         "http://127.0.0.1:3000"],  # en prod -> remplacer par URL frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # =========================
# # ROUTERS
# # =========================
# app.include_router(products.router)
# app.include_router(orders.router)
# app.include_router(stats.router)
# app.include_router(bots.router)

# # =========================
# # HEALTH CHECK
# # =========================
# @app.get("/")
# def read_root():
#     return {
#         "status": "API is running",
#         "message": "MarketBot backend OK 🚀"
#     }


# @app.get("/health")
# def health_check():
#     return {
#         "status": "ok",
#         "db": "handled via docker"
#     }     from fastapi import FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import models
from app.api import products, stats, orders, bot  # ✅ correct

# Création des tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MarketBot API")

# =========================
# CORS CONFIG
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROUTERS
# =========================
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(stats.router)
app.include_router(bot.router)  # ✅ bot (pas bots)

# =========================
# HEALTH CHECK
# =========================
@app.get("/")
def read_root():
    return {
        "status": "API is running",
        "message": "MarketBot backend OK 🚀"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "db": "connected"
    }