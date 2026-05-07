```


```markdown
# 🛒 MarketBot - Plateforme E-commerce Conversationnelle

**MarketBot** est une solution full-stack permettant aux petits commerçants de gérer leur catalogue via un dashboard moderne et à leurs clients de passer commande à travers une interface simulant un bot WhatsApp.

---

## 🚀 Lancement Rapide avec Docker

Le projet est entièrement conteneurisé pour garantir un environnement de test identique.

```bash
# Cloner le projet
git clone https://github.com/Tresormufalme/marketbot
cd marketbot

# Lancer tous les services (Frontend, Backend, DB, Redis)
docker compose up --build
```

---

## 🔗 URLs d'accès

| Service | URL |
| :--- | :--- |
| **Dashboard Admin** | [http://localhost:3000/admin](http://localhost:3000/admin) |
| **Interface Bot** | [http://localhost:3000/bot](http://localhost:3000/bot) |
| **Documentation API (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 🏗️ Architecture

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 | Dashboard Admin & Simulateur de Chat (Tailwind CSS) |
| **Backend** | FastAPI | API REST & Logique du flow conversationnel |
| **Base de données** | PostgreSQL | Stockage persistant (Produits, Commandes) |
| **Session Bot** | Redis | Gestion d'état du flow (State Machine) |
| **Orchestration** | Docker Compose | Déploiement multi-services |

---

## 📁 Structure du Repository

```plaintext
marketbot/
├── frontend/         # App Next.js (App Router)
├── backend/          # API FastAPI
│   ├── app/
│   │   ├── models/   # Modèles SQLAlchemy
│   │   ├── schemas/  # Schémas Pydantic
│   │   ├── services/ # bot_flow.py (Cerveau du bot)
│   │   └── main.py   # Point d'entrée API
├── docker-compose.yml
└── README.md
```

---

## 📋 Évaluation des contraintes

- [x] **Docker Compose** : Un seul `up` lance tout l'écosystème.
- [x] **Redis** : Sessions conversationnelles actives pour le suivi d'état.
- [x] **QR Code** : Intégration prévue dans le tunnel bot et le dashboard.
- [x] **TypeScript** : Utilisé pour la robustesse du frontend.

---

> **Développé par Trésor Mufalme**  
> *Bukavu, Sud-Kivu, RDC*  
> *Candidature au poste de Stagiaire Développeur Full Stack - Karaba Africa*
```

```
