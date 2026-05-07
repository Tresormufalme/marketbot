🛒 MarketBot - Plateforme E-commerce ConversationnelleMarketBot est une solution full-stack permettant aux petits commerçants de gérer leur catalogue via un dashboard moderne et à leurs clients de passer commande à travers une interface simulant un bot WhatsApp.

# 🚀 Lancement Rapide avec Docker

Le projet est entièrement conteneurisé pour garantir un environnement de test identique.

Bash# 

Cloner le projet
git clone [LIEN_DE_TON_REPO]
cd marketbot

# Lancer tous les services (Frontend, Backend, DB, Redis)
docker compose up --build


🔗 URLs d'accèsDashboard 

Admin : http://localhost:3000/admin 
Bot : http://localhost:3000/botDocumentation 
API (Swagger) : http://localhost:8000/docs

🔑 Identifiants de test (Admin)Username : adminPassword : admin123🏗️ Architecture 

Composant,Technologie,Rôle
Frontend,Next.js 14,Dashboard Admin & Simulateur de Chat (Tailwind CSS)
Backend,FastAPI,API REST & Logique du flow conversationnel
Base de données,PostgreSQL,"Stockage persistant (Produits, Commandes)"
Session Bot,Redis,Gestion d'état du flow (State Machine)
Orchestration,Docker Compose,Déploiement multi-services


📁 Structure du RepositoryPlaintextmarketbot/

├── frontend/        # App Next.js (App Router)
├── backend/         # API FastAPI
│   ├── app/
│   │   ├── models/  # Modèles SQLAlchemy
│   │   ├── schemas/ # Schémas Pydantic
│   │   ├── services/# bot_flow.py (Cerveau du bot)
│   │   └── main.py  # Points d'entrée API
├── docker-compose.yml
└── README.md
📋 Evaluation des contraintes[x] Docker Compose : Un seul up lance tout.
[x] Redis : Sessions conversationnelles actives.
[x] QR Code : Inclus dans le tunnel bot et le dashboard.
[x] TypeScript : Utilisé pour la robustesse du frontend.

Développé par Trésor Mufalme -RDC/sud-kivu/bukavu Candidature au poste de Stagiaire Développeur Full Stack - Karaba Africa
