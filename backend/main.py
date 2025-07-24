from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in .env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://misky-project.onrender.com",
        "https://misky-project-1cj4.vercel.app"],  # update as needed for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_auth_headers(jwt: str):
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

class Item(BaseModel):
    information: str
    price: float
    pickup_time: str
    total_spots: int

class Reservation(BaseModel):
    customer_id: UUID
    item_id: UUID
    timestamp: datetime
    status: Optional[str] = "active"

@app.get("/")
async def root():
    return {"status": "FastAPI backend running!"}

@app.get("/items")
def get_items(
    authorization: str = Header(...),
    restaurant_id: Optional[str] = Query(None),
):
    jwt = authorization.replace("Bearer ", "").strip()
    headers = get_auth_headers(jwt)

    try:
        with httpx.Client() as client:
            params = {"select": "*"}
            if restaurant_id:
                params["restaurant_id"] = f"eq.{restaurant_id}"

            response = client.get(
                f"{SUPABASE_URL}/rest/v1/items",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/items")
def create_item(item: Item, authorization: str = Header(...)):
    jwt = authorization.replace("Bearer ", "").strip()
    headers = get_auth_headers(jwt)

    try:
        with httpx.Client() as client:
            response = client.post(
                f"{SUPABASE_URL}/rest/v1/items",
                headers=headers,
                json=item.dict(),
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reservations")
def get_reservations(authorization: str = Header(...)):
    jwt = authorization.replace("Bearer ", "").strip()
    headers = get_auth_headers(jwt)

    try:
        with httpx.Client() as client:
            params = {"select": "*,item:items(*)"}
            response = client.get(
                f"{SUPABASE_URL}/rest/v1/reservations",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reservations")
def create_reservation(reservation: Reservation, authorization: str = Header(...)):
    jwt = authorization.replace("Bearer ", "").strip()
    headers = get_auth_headers(jwt)

    # Convert UUIDs to strings for JSON serialization
    payload = {
        "customer_id": str(reservation.customer_id),
        "item_id": str(reservation.item_id),
        "timestamp": reservation.timestamp.isoformat(),
        "status": reservation.status or "active",
    }

    try:
        with httpx.Client() as client:
            #Create reservation
            response = client.post(
                f"{SUPABASE_URL}/rest/v1/reservations",
                headers=headers,
                json=payload,
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.text)

            #Call RPC (a supabase function) to increment item reservation count
            rpc_response = client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/increment_num_of_reservations",
                headers=headers,
                json={"item_uuid": str(reservation.item_id)},
            )
            if rpc_response.status_code >= 400:
                raise HTTPException(
                    status_code=rpc_response.status_code,
                    detail="Reservation created but failed to update item count",
                )

            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
