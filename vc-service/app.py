from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from utils.crypto_service import generate_key, encrypt, decrypt
from ipfs_service import upload_bytes, get_bytes
import zipfile
import io

from vc_logic import (
    xor_image_split,
    xor_image_reconstruct,
    xor_file_split,
    xor_file_reconstruct
)

app = FastAPI(title="VC Microservice")


@app.get("/")
async def home():
    return{
        "VC Api is running..."
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "vc-microservice"
    }

# ------------------------------------
# IMAGE SPLIT
# ------------------------------------

@app.post("/split/image")
async def split_image(file: UploadFile = File(...)):

    image_bytes = io.BytesIO(await file.read())

    sh1, sh2 = xor_image_split(image_bytes)

    # Serialize shares to PNG bytes
    buffers = []
    for share in (sh1, sh2):
        buf = io.BytesIO()
        share.save(buf, format="PNG")
        buf.seek(0)
        buffers.append(buf.getvalue())

    key = generate_key()

    cids = []

    for data in buffers:
        encrypted = encrypt(data, key)
        cid = upload_bytes(encrypted)
        cids.append(cid)

    return {
        "share_cids": cids,
        "aes_key": key.hex()
    }

# ------------------------------------
# IMAGE RECONSTRUCT
# ------------------------------------

@app.post("/reconstruct/image")
async def reconstruct_image(
    aes_key: str = Form(...),
    cids: str = Form(...)
):

    key = bytes.fromhex(aes_key)

    cid_list = [cid.strip() for cid in cids.split(",") if cid.strip()]

    shares = []

    for cid in cid_list:
        encrypted = get_bytes(cid)
        decrypted = decrypt(encrypted, key)
        shares.append(io.BytesIO(decrypted))

    rec = xor_image_reconstruct(shares[0], shares[1])

    buf = io.BytesIO()
    rec.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")

# ------------------------------------
# FILE SPLIT
# ------------------------------------

@app.post("/split/file")
async def split_file(
    file: UploadFile = File(...),
    n: int = Form(...)
):

    data = await file.read()

    shares = xor_file_split(data, n)

    key = generate_key()

    cids = []

    for share in shares:

        encrypted = encrypt(share, key)

        cid = upload_bytes(encrypted)

        cids.append(cid)

    return {
        "share_cids": cids,
        "aes_key": key.hex()
    }


# ------------------------------------
# FILE RECONSTRUCT
# ------------------------------------

@app.post("/reconstruct/file")
async def reconstruct_file(
    aes_key: str = Form(...),
    cids: str = Form(...)
):

    key = bytes.fromhex(aes_key)

    cid_list = cids.split(",")

    shares = []

    for cid in cid_list:

        encrypted = get_bytes(cid)

        decrypted = decrypt(encrypted, key)

        shares.append(decrypted)

    reconstructed = xor_file_reconstruct(shares)

    return StreamingResponse(
        io.BytesIO(reconstructed),
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=reconstructed_file"}
    )
