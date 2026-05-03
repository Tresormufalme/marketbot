import qrcode
from io import BytesIO
import base64
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import models

class BotFlow:
    @staticmethod
    def get_categories(db: Session) -> List[str]:
        """Récupère les catégories des produits actifs"""
        categories = db.query(models.Product.category).filter(
            models.Product.is_active == True,
            models.Product.stock > 0
        ).distinct().all()
        return [cat[0] for cat in categories if cat[0]]

    @staticmethod
    def get_products_by_category(db: Session, category: str) -> List[Dict]:
        """Récupère les produits d'une catégorie spécifique"""
        products = db.query(models.Product).filter(
            models.Product.category == category,
            models.Product.is_active == True,
            models.Product.stock > 0
        ).all()
        
        return [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "description": p.description
            }
            for p in products
        ]

    @staticmethod
    def get_all_products(db: Session) -> List[Dict]:
        """Récupère tous les produits actifs"""
        products = db.query(models.Product).filter(
            models.Product.is_active == True,
            models.Product.stock > 0
        ).limit(20).all()
        
        return [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "category": p.category
            }
            for p in products
        ]

    @staticmethod
    def generate_qr_code(order_id: int, customer_name: str, total: float) -> str:
        """Génère un QR code en base64"""
        qr_data = f"ORDER:{order_id}|CUSTOMER:{customer_name}|TOTAL:{total}|DATE:{__import__('datetime').datetime.now()}"
        qr = qrcode.QRCode(box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        
        return base64.b64encode(buffered.getvalue()).decode()

    @staticmethod
    def process_message(message: str, session_data: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Logique principale de conversation"""
        state = session_data.get("state", "main_menu")
        
        # ==================== MENU PRINCIPAL ====================
        if state == "main_menu":
            if (
    message == "1"
    or "catalogue" in message.lower()
    or "voir" in message.lower()
):
                # Vérifier s'il y a des produits
                products_count = db.query(models.Product).filter(
                    models.Product.is_active == True,
                    models.Product.stock > 0
                ).count()
                
                if products_count == 0:
                    return {
                        "message": "❌ Désolé, aucun produit n'est disponible pour le moment. Veuillez revenir plus tard.",
                        "options": ["🏠 Menu principal"]
                    }
                
                categories = BotFlow.get_categories(db)
                if not categories:
                    return {
                        "message": "❌ Aucune catégorie de produits trouvée.",
                        "options": ["🏠 Menu principal"]
                    }
                
                session_data["state"] = "selecting_category"
                session_data["categories"] = categories
                
                category_list = "\n".join([f"{i+1}. {cat}" for i, cat in enumerate(categories)])
                return {
                    "message": f"📚 *Nos catégories disponibles :*\n\n{category_list}\n\n👉 *Entrez le numéro* de la catégorie qui vous intéresse :",
                    "options": ["🏠 Menu principal"]
                }
            
            elif message == "2" or "suivre" in message.lower() or "commande" in message.lower():
                session_data["state"] = "tracking_order"
                return {
                    "message": "🔍 *Suivi de commande*\n\nVeuillez entrer votre *numéro de commande* (ex: 12345) :",
                    "options": ["🏠 Menu principal"]
                }
            
            else:
                return {
                    "message": "👋 *Bienvenue sur MarketBot Store !*\n\nVotre assistant shopping préféré. Que souhaitez-vous faire ?\n\n1️⃣ 🛍️ Voir le catalogue\n2️⃣ 📦 Suivre ma commande",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
        
        # ==================== SÉLECTION CATÉGORIE ====================
        elif state == "selecting_category":
            if "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Retour au menu principal. Que souhaitez-vous faire ?",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            
            try:
                category_index = int(message) - 1
                if 0 <= category_index < len(session_data["categories"]):
                    category = session_data["categories"][category_index]
                    products = BotFlow.get_products_by_category(db, category)
                    
                    if not products:
                        return {
                            "message": f"❌ Désolé, aucun produit n'est disponible dans la catégorie *{category}* pour le moment.",
                            "options": ["🔄 Retour catégories", "🏠 Menu principal"]
                        }
                    
                    session_data["state"] = "selecting_product"
                    session_data["selected_category"] = category
                    session_data["products"] = products
                    
                    product_list = "\n".join([
                        f"{i+1}. *{p['name']}* - {p['price']:,.0f} FCFA (Stock: {p['stock']})"
                        for i, p in enumerate(products)
                    ])
                    
                    return {
                        "message": f"🛍️ *Produits dans '{category}':*\n\n{product_list}\n\n👉 Entrez le *numéro du produit* qui vous intéresse :",
                        "options": ["🔄 Retour catégories", "🏠 Menu principal"]
                    }
                else:
                    return {
                        "message": "❌ Numéro invalide. Veuillez entrer un numéro valide.",
                        "options": ["🔄 Retour catégories"]
                    }
            except ValueError:
                return {
                    "message": "❌ Veuillez entrer un *numéro valide*.",
                    "options": ["🔄 Retour catégories"]
                }
        
        # ==================== SÉLECTION PRODUIT ====================
        elif state == "selecting_product":
            if "retour catégories" in message.lower():
                session_data["state"] = "selecting_category"
                category_list = "\n".join([f"{i+1}. {cat}" for i, cat in enumerate(session_data["categories"])])
                return {
                    "message": f"📚 *Nos catégories disponibles :*\n\n{category_list}\n\n👉 Choisissez une catégorie :",
                    "options": ["🏠 Menu principal"]
                }
            elif "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Menu principal. Que souhaitez-vous faire ?",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            
            try:
                product_index = int(message) - 1
                if 0 <= product_index < len(session_data["products"]):
                    product = session_data["products"][product_index]
                    session_data["selected_product"] = product
                    session_data["state"] = "selecting_quantity"
                    
                    return {
                        "message": f"📦 *{product['name']}*\n\n💰 Prix: *{product['price']:,.0f} FCFA*\n📊 Stock disponible: *{product['stock']}*\n\n👉 Combien d'exemplaires souhaitez-vous commander ?",
                        "options": ["🔄 Retour produits", "🏠 Menu principal"]
                    }
                else:
                    return {
                        "message": "❌ Numéro invalide. Veuillez entrer un numéro valide.",
                        "options": ["🔄 Retour produits"]
                    }
            except ValueError:
                return {
                    "message": "❌ Veuillez entrer un *numéro valide*.",
                    "options": ["🔄 Retour produits"]
                }
        
        # ==================== SÉLECTION QUANTITÉ ====================
        elif state == "selecting_quantity":
            if "retour produits" in message.lower():
                session_data["state"] = "selecting_product"
                product_list = "\n".join([
                    f"{i+1}. *{p['name']}* - {p['price']:,.0f} FCFA"
                    for i, p in enumerate(session_data["products"])
                ])
                return {
                    "message": f"🛍️ *Produits disponibles :*\n\n{product_list}\n\n👉 Entrez le numéro du produit :",
                    "options": ["🏠 Menu principal"]
                }
            elif "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Menu principal. Que souhaitez-vous faire ?",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            
            try:
                quantity = int(message)
                product = session_data["selected_product"]
                
                if quantity <= 0:
                    return {
                        "message": "❌ La quantité doit être *supérieure à 0*. Veuillez entrer une quantité valide :",
                        "options": ["🔄 Retour produits"]
                    }
                
                if quantity > product["stock"]:
                    return {
                        "message": f"❌ *Stock insuffisant !*\n\nStock disponible: *{product['stock']}*\n\n👉 Veuillez entrer une quantité valide :",
                        "options": ["🔄 Retour produits"]
                    }
                
                total = quantity * product["price"]
                session_data["quantity"] = quantity
                session_data["total"] = total
                session_data["state"] = "confirming_order"
                
                return {
                    "message": f"🛒 *Récapitulatif de votre commande :*\n\n📦 *{quantity} x {product['name']}*\n💰 Total: *{total:,.0f} FCFA*\n\n✅ *Confirmez-vous cette commande ?*",
                    "options": ["✅ Oui, confirmer", "❌ Non, modifier", "🏠 Menu principal"]
                }
            except ValueError:
                return {
                    "message": "❌ Veuillez entrer un *nombre valide* pour la quantité.",
                    "options": ["🔄 Retour produits"]
                }
        
        # ==================== CONFIRMATION COMMANDE ====================
        elif state == "confirming_order":
            if "oui" in message.lower() or "confirmer" in message.lower():
                session_data["state"] = "asking_name"
                return {
                    "message": "📝 *Parfait !*\n\nPour finaliser votre commande, veuillez entrer votre *nom complet* :",
                    "options": ["🏠 Menu principal"]
                }
            elif "non" in message.lower() or "modifier" in message.lower():
                session_data["state"] = "selecting_quantity"
                product = session_data["selected_product"]
                return {
                    "message": f"📦 *{product['name']}*\n\n💰 Prix: *{product['price']:,.0f} FCFA*\n📊 Stock: *{product['stock']}*\n\n👉 Combien d'exemplaires souhaitez-vous commander ?",
                    "options": ["🔄 Retour produits", "🏠 Menu principal"]
                }
            elif "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Commande annulée. Retour au menu principal.",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            else:
                return {
                    "message": "❓ Veuillez choisir une option :\n\n✅ Oui, confirmer\n❌ Non, modifier\n🏠 Menu principal",
                    "options": ["✅ Oui", "❌ Non", "🏠 Menu principal"]
                }
        
        # ==================== DEMANDE NOM ====================
        elif state == "asking_name":
            if "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Commande annulée. Retour au menu principal.",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            
            if len(message.strip()) < 2:
                return {
                    "message": "❌ Veuillez entrer un *nom valide* (au moins 2 caractères) :",
                    "options": ["🏠 Menu principal"]
                }
            
            session_data["customer_name"] = message.strip()
            session_data["state"] = "asking_phone"
            return {
                "message": "📱 Veuillez entrer votre *numéro WhatsApp* (ex: +237 6XX XXX XXX) :",
                "options": ["🏠 Menu principal"]
            }
        
        # ==================== DEMANDE TÉLÉPHONE ====================
        elif state == "asking_phone":
            if "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Commande annulée. Retour au menu principal.",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            
            session_data["customer_phone"] = message.strip()
            session_data["state"] = "saving_order"
            
            # Sauvegarde de la commande dans la base de données
            try:
                product = session_data["selected_product"]
                
                # Créer la commande
                new_order = models.Order(
                    customer_name=session_data["customer_name"],
                    customer_phone=session_data["customer_phone"],
                    total_price=session_data["total"],
                    status="en_attente"
                )
                db.add(new_order)
                db.flush()  # Pour obtenir l'ID sans commit
                
                # Ajouter l'article commandé
                order_item = models.OrderItem(
                    order_id=new_order.id,
                    product_id=product["id"],
                    quantity=session_data["quantity"]
                )
                db.add(order_item)
                
                # Mettre à jour le stock du produit
                db_product = db.query(models.Product).filter(models.Product.id == product["id"]).first()
                if db_product:
                    db_product.stock -= session_data["quantity"]
                
                db.commit()
                db.refresh(new_order)
                
                # Générer le QR code
                qr_base64 = BotFlow.generate_qr_code(
                    new_order.id,
                    session_data["customer_name"],
                    session_data["total"]
                )
                
                # Réinitialiser la session
                session_data.clear()
                session_data["state"] = "main_menu"
                
                return {
                    "message": f"✅ *COMMANDE ENREGISTRÉE AVEC SUCCÈS !*\n\n📝 *Récapitulatif :*\n• 🆔 Commande #: {new_order.id}\n• 👤 Client: {new_order.customer_name}\n• 📦 Produit: {product['name']}\n• 🔢 Quantité: {session_data.get('quantity', 0)}\n• 💰 Total: {session_data.get('total', 0):,.0f} FCFA\n\n📱 *Scannez ce QR code à la livraison* pour confirmer la réception.\n\nMerci de votre confiance ! 🎉",
                    "qr_code": qr_base64,
                    "options": ["🏠 Retour menu principal", "📦 Suivre ma commande"]
                }
            except Exception as e:
                db.rollback()
                print(f"Erreur sauvegarde commande: {e}")
                session_data["state"] = "main_menu"
                return {
                    "message": f"❌ Une erreur est survenue: {str(e)}\n\nVeuillez réessayer plus tard.",
                    "options": ["🏠 Menu principal"]
                }
        
        # ==================== SUIVI COMMANDE ====================
        elif state == "tracking_order":
            if "menu principal" in message.lower():
                session_data["state"] = "main_menu"
                return {
                    "message": "🏠 Retour au menu principal. Que souhaitez-vous faire ?",
                    "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
                }
            
            try:
                order_id = int(message)
                order = db.query(models.Order).filter(models.Order.id == order_id).first()
                
                if not order:
                    return {
                        "message": f"❌ Commande #{order_id} non trouvée.\n\nVeuillez vérifier votre numéro de commande :",
                        "options": ["🏠 Menu principal", "🔄 Réessayer"]
                    }
                
                status_text = {
                    "en_attente": "⏳ En attente de confirmation",
                    "confirmée": "✅ Confirmée",
                    "livrée": "🚚 Livrée",
                    "annulée": "❌ Annulée"
                }.get(order.status, order.status)
                
                # Récupérer les articles de la commande
                items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
                items_text = ""
                for item in items:
                    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                    if product:
                        items_text += f"\n• {item.quantity}x {product.name}"
                
                return {
                    "message": f"📦 *Détails de la commande #{order.id}*\n\n👤 *Client:* {order.customer_name}\n📱 *Téléphone:* {order.customer_phone or 'Non renseigné'}\n💰 *Total:* {order.total_price:,.0f} FCFA\n📊 *Statut:* {status_text}\n📅 *Date:* {order.created_at.strftime('%d/%m/%Y %H:%M')}{items_text}\n\nMerci de votre confiance ! 🤝",
                    "options": ["🏠 Menu principal", "🔍 Autre commande"]
                }
            except ValueError:
                return {
                    "message": "❌ Numéro de commande invalide. Veuillez entrer un numéro valide :",
                    "options": ["🏠 Menu principal", "🔄 Réessayer"]
                }
        
        # ==================== DÉFAUT ====================
        else:
            session_data["state"] = "main_menu"
            return {
                "message": "🏠 Menu principal. Que souhaitez-vous faire ?",
                "options": ["1️⃣ Voir catalogue", "2️⃣ Suivre commande"]
            }