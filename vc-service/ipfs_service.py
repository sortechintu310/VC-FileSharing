import requests

IPFS_API = "http://127.0.0.1:5001/api/v0"


def upload_bytes(data: bytes):

    files = {
        "file": ("share.bin", data)
    }

    response = requests.post(
        f"{IPFS_API}/add",
        files=files
    )

    result = response.json()

    return result["Hash"]


def get_bytes(cid: str):

    params = {
        "arg": cid
    }

    response = requests.post(
        f"{IPFS_API}/cat",
        params=params
    )

    return response.content