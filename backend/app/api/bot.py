from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.bot_flow import BotFlow
from app.services import redis_client  # Import du module redis
import uuid

router = APIRouter(prefix="/bot", tags=["Bot"])

# @router.post("/session")
# def start_session(db: Session = Depends(get_db)):
#     session_id = str(uuid.uuid4())
    
#     # Initialiser la session dans Redis
#     session_data = {"state": "main_menu"}
#     redis_client.save_session(session_id, session_data)
    
#     # Traiter le message initial
#     response = BotFlow.process_message("", session_data, db)
    
#     # Sauvegarder la session mise à jour
#     redis_client.save_session(session_id, session_data)
    
#     return {
#         "session_id": session_id, 
#         "bot_response": response
#     }
@router.post("/session")
def start_session(db: Session = Depends(get_db)):
    try:
        session_id = str(uuid.uuid4())

        session_data = {"state": "main_menu"}
        redis_client.save_session(session_id, session_data)

        response = BotFlow.process_message("", session_data, db)

        redis_client.save_session(session_id, session_data)

        return {
            "session_id": session_id,
            "bot_response": response
        }

    except Exception as e:
        print("ERROR START SESSION:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/session/{session_id}/reply")
def reply_to_bot(
    session_id: str, 
    user_reply: dict, 
    db: Session = Depends(get_db)
):
    message = user_reply.get("message", "")
    
    # Récupérer la session depuis Redis
    session_data = redis_client.get_session(session_id)
    if not session_data:
        raise HTTPException(
            status_code=404, 
            detail="Session non trouvée ou expirée. Veuillez démarrer une nouvelle session."
        )
    
    # Traiter le message
    response = BotFlow.process_message(message, session_data, db)
    
    # Sauvegarder la session mise à jour
    redis_client.save_session(session_id, session_data)
    
    return {"bot_response": response}