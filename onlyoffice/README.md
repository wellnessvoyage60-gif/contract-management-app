# OnlyOffice Document Server — Setup Notes

## Quick Start
```bash
cd /opt/contractpro/onlyoffice
docker compose up -d

# Monitor startup (takes ~2-3 min first run)
docker compose logs -f onlyoffice

# Verify it's ready
curl http://localhost:8080/healthcheck
# Expected response: true
```

## ⚙️ Configuration Required in Backend .env
Add these to `/opt/contractpro/backend/.env`:
```
ONLYOFFICE_URL=http://localhost:8080
ONLYOFFICE_JWT_SECRET=contractpro-oo-jwt-secret-change-this-2024
# IMPORTANT: Use your VM's actual IP (not localhost) so the browser can reach it
ONLYOFFICE_PUBLIC_URL=http://YOUR_VM_IP:8080
```

## How It Integrates with ContractPro

### Flow when user clicks "Edit Document":
1. Frontend calls `GET /api/editor/{contract_id}` 
2. FastAPI generates a signed JWT token with document URL + callback URL
3. Frontend loads the OnlyOffice editor JS from `ONLYOFFICE_PUBLIC_URL`
4. OnlyOffice fetches the document file from FastAPI's `/api/editor/{id}/file`
5. User edits with track changes
6. On save/close, OnlyOffice POSTs the updated file to `/api/editor/{id}/callback`
7. FastAPI saves the new version, increments version counter, logs activity

### Required FastAPI EditorPage endpoint (in editor.py):
```python
@router.get("/{contract_id}/config")
def get_editor_config(contract_id: int, current_user=Depends(get_current_user)):
    # Returns the OnlyOffice initialization config object
    ...
```
See backend/app/api/routes/editor.py for full implementation.

## Firewall Notes
- Port 8080 must be accessible from users' browsers (or proxied via Nginx)
- The OnlyOffice container must be able to reach the FastAPI server
- Both communicate via the shared Docker network `contractpro_net`

## JWT Token
The JWT secret in `docker-compose.yml` must **exactly match** `ONLYOFFICE_JWT_SECRET` in your backend `.env`.

## Updating OnlyOffice
```bash
docker compose pull onlyoffice
docker compose up -d --no-deps onlyoffice
```
