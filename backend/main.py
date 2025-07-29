from fastapi import FastAPI, HTTPException, Header, Query  # FastAPI core and request handling
from fastapi.middleware.cors import CORSMiddleware # Allows cross-origin access from frontend (Vercel)
from pydantic import BaseModel # For validating request bodies
from uuid import UUID
from typing import Optional
from datetime import datetime
import os
import httpx # (SUPABASE) HTTP client to send requests to Supabase REST API
from dotenv import load_dotenv # To load Supabase keys from .env file
import jwt  # pyjwt to decode JWTs


load_dotenv() # Load environment variables from the .env locally or from Render's env vars

SUPABASE_URL = os.getenv("SUPABASE_URL") # Supabase url
SUPABASE_KEY = os.getenv("SUPABASE_KEY") # Supabase service key

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in .env")



app = FastAPI() #Initalize FastAPI app


#CORS (Cross-Origin Resource Sharing) is a security feature enforced by web browsers. It restricts web pages (frontend code) from making requests to a different domain (backend server) unless the backend explicitly allows it
#CORSMiddleware adds specific HTTP headers that allows for frontend to talk to backend
#TLDR: Lets frontend make requests to a backend hosted at a different origin
app.add_middleware(
    CORSMiddleware, # Allow cross-origin requests from frontend (Vercel or local dev)
    allow_origins=[
        "http://localhost:3000", # local dev
        "https://misky-project.onrender.com", # deployed backend (optional)
        "https://misky-project-1cj4.vercel.app"],  # deployed React frontend on Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_user_id_from_jwt(jwt_token: str) -> str:
    try:
        payload = jwt.decode(jwt_token, options={"verify_signature": False})  # decode w/o validation
        return payload.get("sub")  # user ID is in 'sub' claim
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token format")

#Authorization Headers for Supabase
def get_auth_headers(jwt: str):
    return {
        "apikey": SUPABASE_KEY, # Required for Supabase REST access
        "Authorization": f"Bearer {jwt}", # User JWT (JSON Web Token) passed from frontend. JWT represents user identity and permissions (acts as ID card)
        "Content-Type": "application/json",
        "Prefer": "return=representation", # Ask Supabase to return inserted row
    }


#Pydantic Models for Requests (FastAPI)
#Define data schemas + validate input
class Item(BaseModel):
    information: str
    price: float
    pickup_time: str
    total_spots: int  # Number of reservation spots for item
    image_url: Optional[str] = None 
    status: Optional[str] = "active" #valid statuses: "active", "cancelled", "completed"

class Reservation(BaseModel):
    customer_id: UUID # Supabase customer ID
    item_id: UUID     # Item being reserved
    timestamp: datetime
    status: Optional[str] = "active"  #valid statuses: "active", "cancelled", "completed"

class Notification(BaseModel):
    id: Optional[UUID] = None
    restaurant_id: str
    reservation_id: Optional[str] = None
    type: Optional[str] = None
    message: str
    created_at: Optional[datetime] = None


#Root Health Check Endpoint
@app.get("/")
async def root():
    return {"status": "FastAPI backend running!"} # You can ping this to check if Render is working; going to https://misky-project.onrender.com/ should return this message


#Fetch items from Supabase
@app.get("/items")
def get_items(
    authorization: str = Header(...), # JWT from frontend request
    restaurant_id: Optional[str] = Query(None), # Optional filter
):
    
    jwt = authorization.replace("Bearer ", "").strip() #Formats JWT for use
    headers = get_auth_headers(jwt)

    try:
        with httpx.Client() as client: #request from Supabase
            params = {"select": "*"} # Supabase PostgREST query param (Select all)
            if restaurant_id:
                params["restaurant_id"] = f"eq.{restaurant_id}" # PostgREST-style filtering

            response = client.get( #get request to Supabase REST endpoint
                f"{SUPABASE_URL}/rest/v1/items", # Supabase table: items
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            return response.json() # Send list of items to frontend
    #Handle errors
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Create new item in Supabase
@app.post("/items")
def create_item(
    item: Item, 
    authorization: str = Header(...)
):
    jwt = authorization.replace("Bearer ", "").strip()
    headers = get_auth_headers(jwt)

    try:
        with httpx.Client() as client:
            response = client.post(
                f"{SUPABASE_URL}/rest/v1/items?return=representation",
                headers=headers,
                json=item.dict(exclude_none=True),  # exclude None values
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.patch("/restaurant/items/{item_id}")
def update_restaurant_item(
    item_id: UUID,
    update_data: dict,  # expects fields to update, e.g. {"image_url": "..."}
    authorization: str = Header(...)
):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            # 1. Verify ownership: Get item restaurant_id
            res = client.get(
                f"{SUPABASE_URL}/rest/v1/items",
                headers=headers,
                params={"id": f"eq.{item_id}", "select": "restaurant_id"},
            )
            res.raise_for_status()
            items = res.json()
            if not items:
                raise HTTPException(status_code=404, detail="Item not found")
            if items[0]["restaurant_id"] != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to update this item")

            # 2. PATCH the item with update_data
            patch_res = client.patch(
                f"{SUPABASE_URL}/rest/v1/items?id=eq.{item_id}",
                headers=headers,
                json=update_data,
            )
            patch_res.raise_for_status()
            # Supabase returns a list of updated rows (usually one element)
            updated_items = patch_res.json()
            if not updated_items:
                raise HTTPException(status_code=500, detail="Failed to update item")
            return updated_items[0]  # Return updated item object

    except httpx.HTTPStatusError as e:
        # e.response.text is a JSON string with error details; try to parse for better detail
        try:
            detail = e.response.json()
        except Exception:
            detail = e.response.text
        raise HTTPException(status_code=e.response.status_code, detail=detail)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Get all reservations
@app.get("/reservations")
def get_reservations(
    authorization: str = Header(...) # JWT from frontend request
):
    
    jwt = authorization.replace("Bearer ", "").strip() #Formats JWT for use
    headers = get_auth_headers(jwt)

    try:
        with httpx.Client() as client: #Supabase Request
            params = {"select": "*,item:items(*)"} # Join item details for each reservation
            response = client.get(
                f"{SUPABASE_URL}/rest/v1/reservations", # Supabase reservations table
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            return response.json() # Return enriched reservations
    #Handle Errors
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Create Reservation + Increment Counter for item
@app.post("/reservations")
def create_reservation(
    reservation: Reservation,
    authorization: str = Header(...) # JWT from frontend request
):
    
    jwt = authorization.replace("Bearer ", "").strip() #Formats JWT for use
    headers = get_auth_headers(jwt)

    # Convert UUIDs to strings for JSON serialization
    payload = {
        "customer_id": str(reservation.customer_id), # UUIDs must be stringified
        "item_id": str(reservation.item_id),         # UUIDs must be stringified
        "timestamp": reservation.timestamp.isoformat(),
        "status": reservation.status or "active",
    }

    try:
        with httpx.Client() as client: #Supabase Request
            # Create reservation row
            response = client.post(
                f"{SUPABASE_URL}/rest/v1/reservations", # Supabase reservations table
                headers=headers,
                json=payload,
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.text)

            # Call RPC (a supabase function) to increment item reservation count
            # this RPC increments `num_of_reservations` in the items table
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

            return response.json()# Return reservation data to frontend
    #Handle Errors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Fetch items created by current restaurant
@app.get("/restaurant/items")
def get_restaurant_items(
    authorization: str = Header(...)
):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            params = {
                "restaurant_id": f"eq.{user_id}"  # Filter by current user's restaurant_id
            }

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



# Create item with restaurant_id linked to current user
@app.post("/restaurant/items")
def create_restaurant_item(
    item: Item,
    authorization: str = Header(...)
):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    payload = item.dict()
    payload["restaurant_id"] = user_id  # Enforce restaurant ownership from JWT

    try:
        with httpx.Client() as client:
            response = client.post(
                f"{SUPABASE_URL}/rest/v1/items",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# cancel customer item reservation   
@app.patch("/reservations/{reservation_id}/cancel")
def cancel_reservation(
    reservation_id: UUID,
    authorization: str = Header(...)
):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            # 1. Get reservation details
            res = client.get(
                f"{SUPABASE_URL}/rest/v1/reservations",
                headers=headers,
                params={
                    "id": f"eq.{reservation_id}",
                    "select": "customer_id,item_id,status"
                },
            )
            res.raise_for_status()
            data = res.json()

            if not data:
                raise HTTPException(status_code=404, detail="Reservation not found.")

            reservation = data[0]

            if reservation["customer_id"] != user_id:
                raise HTTPException(status_code=403, detail="You do not own this reservation.")

            if reservation["status"] == "cancelled":
                raise HTTPException(status_code=400, detail="Reservation already cancelled.")

            item_id = reservation["item_id"]

            # 2. Cancel the reservation
            patch_response = client.patch(
                f"{SUPABASE_URL}/rest/v1/reservations?id=eq.{reservation_id}",
                headers=headers,
                json={"status": "cancelled"},
            )
            patch_response.raise_for_status()

            # 3. Decrement reservation count
            rpc_response = client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/decrement_num_of_reservations",
                headers=headers,
                json={"item_uuid": str(item_id)},
            )
            rpc_response.raise_for_status()

            # 4. Get item info to find restaurant_id
            item_res = client.get(
                f"{SUPABASE_URL}/rest/v1/items",
                headers=headers,
                params={"id": f"eq.{item_id}", "select": "information,restaurant_id"},
            )
            item_res.raise_for_status()
            item_data = item_res.json()

            if not item_data:
                raise HTTPException(status_code=404, detail="Associated item not found.")

            item = item_data[0]
            restaurant_id = item["restaurant_id"]
            item_info = item["information"]

            # 5. Send notification to restaurant
            notification_payload = {
                "restaurant_id": restaurant_id,
                "reservation_id": str(reservation_id),
                "type": "cancel",
                "message": f"Reservation for '{item_info}' was cancelled by a customer.",
                "customer_id": user_id
            }
            notif_response = client.post(
                f"{SUPABASE_URL}/rest/v1/notifications",
                headers=headers,
                json=notification_payload,
            )
            notif_response.raise_for_status()

            return {"success": True, "message": "Reservation cancelled, count updated, and restaurant notified."}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# confirm customer item reservation
@app.patch("/reservations/{reservation_id}/complete")
def confirm_reservation(
    reservation_id: UUID,
    authorization: str = Header(...)
):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            # Step 1: Get reservation details
            params = {
                "id": f"eq.{reservation_id}",
                "select": "customer_id,item_id,status"
            }
            res = client.get(
                f"{SUPABASE_URL}/rest/v1/reservations",
                headers=headers,
                params=params,
            )
            res.raise_for_status()
            data = res.json()

            if not data:
                raise HTTPException(status_code=404, detail="Reservation not found.")
            reservation = data[0]

            if reservation["customer_id"] != user_id:
                raise HTTPException(status_code=403, detail="You do not own this reservation.")

            if reservation["status"] == "completed":
                raise HTTPException(status_code=400, detail="Reservation already completed.")

            # Step 2: Confirm the reservation
            patch_response = client.patch(
                f"{SUPABASE_URL}/rest/v1/reservations?id=eq.{reservation_id}",
                headers=headers,
                json={"status": "completed"},
            )
            patch_response.raise_for_status()

            return {"success": True, "message": "Reservation completed."}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#get notifications for both restaurants and customers
@app.get("/notifications", response_model=list[Notification])
def get_notifications(authorization: str = Header(...)):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            # Get the role from the profiles table
            profile_res = client.get(
                f"{SUPABASE_URL}/rest/v1/profiles",
                headers=headers,
                params={"user_id": f"eq.{user_id}"},
            )
            profile_res.raise_for_status()
            profile_data = profile_res.json()

            if not profile_data:
                raise HTTPException(status_code=404, detail="Profile not found")

            role = profile_data[0].get("role")
            if role not in ("restaurant", "customer"):
                raise HTTPException(status_code=400, detail="Invalid role in profile")

            # Role-specific filters
            filter_key = "restaurant_id" if role == "restaurant" else "customer_id"
            params = {filter_key: f"eq.{user_id}"}

            notifs_res = client.get(
                f"{SUPABASE_URL}/rest/v1/notifications?order=created_at.desc",
                headers=headers,
                params=params,
            )
            notifs_res.raise_for_status()

            return notifs_res.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# restaurant can cancel their own items
@app.patch("/restaurant/items/{item_id}/cancel")
def cancel_item(
    item_id: UUID,
    authorization: str = Header(...)
):
    jwt_token = authorization.replace("Bearer ", "").strip()
    restaurant_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            # 1. Verify restaurant owns the item
            item_res = client.get(
                f"{SUPABASE_URL}/rest/v1/items",
                headers=headers,
                params={"id": f"eq.{item_id}", "select": "restaurant_id,information"},
            )
            item_res.raise_for_status()
            item_data = item_res.json()
            if not item_data:
                raise HTTPException(status_code=404, detail="Item not found.")
            if item_data[0]["restaurant_id"] != restaurant_id:
                raise HTTPException(status_code=403, detail="Not authorized to cancel this item.")

            item_info = item_data[0]["information"]

            # 2. Cancel the item
            cancel_item_res = client.patch(
                f"{SUPABASE_URL}/rest/v1/items?id=eq.{item_id}",
                headers=headers,
                json={"status": "cancelled"},
            )
            cancel_item_res.raise_for_status()

            # 3. Get all active reservations for that item
            reservation_res = client.get(
                    f"{SUPABASE_URL}/rest/v1/reservations",
                    headers=headers,
                    params={"item_id": f"eq.{item_id}", "status": "eq.active"},
                )
            reservation_res.raise_for_status()
            reservations = reservation_res.json()

            print("Found reservations:", reservations)  # ADD THIS

                # 4. Cancel each reservation + notify customer
            for resv in reservations:
                resv_id = resv["id"]
                customer_id = resv["customer_id"]

                # Cancel reservation and check success
                cancel_resv_res = client.patch(
                    f"{SUPABASE_URL}/rest/v1/reservations?id=eq.{resv_id}",
                    headers=headers,
                    json={"status": "cancelled"},
                )
                print(cancel_resv_res.status_code, cancel_resv_res.text)
                cancel_resv_res.raise_for_status()

                # Create notification for customer and check success
                notif_res = client.post(
                    f"{SUPABASE_URL}/rest/v1/notifications",
                    headers=headers,
                    json={
                        "restaurant_id": restaurant_id,
                        "reservation_id": str(resv_id),
                        "type": "cancel",
                        "message": f"Item '{item_info}' was cancelled by the restaurant.",
                        "customer_id": customer_id
                    },
                )
                notif_res.raise_for_status()

            return {"success": True, "message": f"Item '{item_info}' cancelled and customers notified."}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# user gets their profile
@app.get("/profile")
def get_profile(authorization: str = Header(...)):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)

    headers = get_auth_headers(jwt_token)
    try:
        with httpx.Client() as client:
            res = client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_id}&select=*",
                headers=headers,
            )
            res.raise_for_status()
            data = res.json()
            if not data:
                raise HTTPException(status_code=404, detail="Profile not found.")
            return data[0]
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


#user updates their profile
@app.patch("/profile")
def update_profile(payload: dict, authorization: str = Header(...)):
    jwt_token = authorization.replace("Bearer ", "").strip()
    user_id = get_user_id_from_jwt(jwt_token)
    headers = get_auth_headers(jwt_token)

    try:
        with httpx.Client() as client:
            res = client.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_id}",
                headers=headers,
                json=payload,
            )
            res.raise_for_status()
            return {"success": True, "message": "Profile updated successfully."}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

