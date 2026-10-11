from fastapi import APIRouter, HTTPException

from app.schemas import ApiKeyBody, LoginCode, LoginStart
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/status")
async def status():
    return await auth_service.get_status()


@router.post("/login")
async def start_login(body: LoginStart):
    flow = await auth_service.start_login(body.method)
    return flow.to_dict()


@router.get("/login/{login_id}")
async def login_progress(login_id: str):
    flow = auth_service.get_login(login_id)
    if not flow:
        raise HTTPException(404, "Login flow not found")
    return flow.to_dict()


@router.post("/login/{login_id}/code")
async def submit_code(login_id: str, body: LoginCode):
    flow = auth_service.get_login(login_id)
    if not flow:
        raise HTTPException(404, "Login flow not found")
    await flow.submit_code(body.code)
    return flow.to_dict()


@router.delete("/login/{login_id}")
async def cancel_login(login_id: str):
    flow = auth_service.get_login(login_id)
    if flow:
        flow.cancel()
    return {"ok": True}


@router.post("/api-key")
async def save_api_key(body: ApiKeyBody):
    if not body.api_key.strip().startswith("sk-ant-"):
        raise HTTPException(400, "That doesn't look like an Anthropic API key (should start with sk-ant-).")
    auth_service.save_api_key(body.api_key)
    return await auth_service.get_status()


@router.delete("/api-key")
async def remove_api_key():
    auth_service.remove_api_key()
    return await auth_service.get_status()


@router.post("/logout")
async def logout():
    await auth_service.logout()
    return await auth_service.get_status()
