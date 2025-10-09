import os
import time
import jwt
import logging
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel

# --- 환경 변수에서 각 에이전트 admin URL 가져오기 ---
DEVELOPER_AGENT_URL = os.getenv("DEVELOPER_AGENT_URL", "http://developer-agent:8081")
REGULATOR_AGENT_URL = os.getenv("REGULATOR_AGENT_URL", "http://regulator-agent:8081")
SUPERVISOR_AGENT_URL = os.getenv("SUPERVISOR_AGENT_URL", "http://supervisor-agent:8081")

AGENT_URLS = {
    "developer": DEVELOPER_AGENT_URL,
    "regulator": REGULATOR_AGENT_URL,
    "supervisor": SUPERVISOR_AGENT_URL,
}

JWT_SECRET = os.getenv("JWT_SECRET", "demo-secret")
JWT_EXP_SEC = int(os.getenv("JWT_EXP_SEC", "3600"))

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)
client: httpx.AsyncClient | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client
    client = httpx.AsyncClient(timeout=30)
    yield
    await client.aclose()

app = FastAPI(lifespan=lifespan)

# --- CORS 허용 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOGIN_SESSIONS = {}
CONNECTION_ROLE_MAP = {}   # connection_id -> role

def issue_jwt(connection_id: str, role: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": connection_id, "role": role, "iat": now, "exp": now + JWT_EXP_SEC},
        JWT_SECRET,
        algorithm="HS256",
    )

# 1) QR 코드 로그인 (developer 에이전트 기준)
@app.post("/api/login/request/{role}")
async def request_login_invitation(role: str):
    try:
        res = await client.post(
            f"{DEVELOPER_AGENT_URL}/out-of-band/create-invitation",
            json={
                "handshake_protocols": ["https://didcomm.org/didexchange/1.0"],
                "label": role,
            },
        )
        res.raise_for_status()
        data = res.json()
        invi_id = data["invi_msg_id"]
        LOGIN_SESSIONS[invi_id] = {"status": "PENDING", "token": None, "role": role}
        return {"invitation_id": invi_id, "invitation_url": data["invitation_url"]}
    except Exception as e:
        LOGGER.error(f"Failed to create invitation: {e}")
        raise HTTPException(status_code=500, detail="Invitation failed")

# 2) Connection ID 직접 로그인
class ConnectionPayload(BaseModel):
    connection_id: str
    agent: str  # developer / regulator / supervisor

@app.post("/api/login/direct")
async def direct_login(payload: ConnectionPayload):
    conn_id = payload.connection_id
    agent = payload.agent.lower()

    if agent not in AGENT_URLS:
        raise HTTPException(status_code=400, detail="Invalid agent name")

    admin_url = AGENT_URLS[agent]
    try:
        res = await client.get(f"{admin_url}/connections/{conn_id}")
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Connection not found")

        conn = res.json()
        if conn.get("state") != "active":
            raise HTTPException(status_code=400, detail="Connection not active")

        role = CONNECTION_ROLE_MAP.get(conn_id, agent)
        token = issue_jwt(conn_id, role)
        return {"connection_id": conn_id, "token": token, "role": role}

    except Exception as e:
        LOGGER.error(f"Direct login failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# 3) ACA-Py Webhook (공통)
@app.post("/api/webhooks/topic/{topic}")
async def acapy_webhook(topic: str, request: Request):
    body = await request.json()
    LOGGER.info(f"[webhook] topic={topic}, body={body}")

    if topic == "connections" and body.get("state") == "active":
        conn_id = body["connection_id"]
        role = body.get("their_label", "unknown").lower()
        CONNECTION_ROLE_MAP[conn_id] = role

    return {"ok": True}

@app.get("/health")
def health():
    return {"status": "ok"}
