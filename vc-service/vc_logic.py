import numpy as np
from PIL import Image
import secrets


# ----------------------------
# IMAGE VC
# ----------------------------

def xor_image_split(image_bytes):

    img = Image.open(image_bytes).convert("RGB")
    arr = np.array(img, dtype=np.uint8)

    share1 = np.random.randint(0, 256, arr.shape, dtype=np.uint8)
    share2 = np.bitwise_xor(arr, share1)

    return Image.fromarray(share1), Image.fromarray(share2)


def xor_image_reconstruct(img1_bytes, img2_bytes):

    img1 = Image.open(img1_bytes).convert("RGB")
    img2 = Image.open(img2_bytes).convert("RGB")

    a = np.array(img1, dtype=np.uint8)
    b = np.array(img2, dtype=np.uint8)

    rec = np.bitwise_xor(a, b)

    return Image.fromarray(rec)


# ----------------------------
# FILE VC
# ----------------------------

def xor_file_split(data: bytes, n: int):

    shares = []
    length = len(data)

    for _ in range(n - 1):
        shares.append(secrets.token_bytes(length))

    final = bytearray(length)

    for i in range(length):
        v = data[i]
        for s in shares:
            v ^= s[i]
        final[i] = v

    shares.append(bytes(final))

    return shares


def xor_file_reconstruct(shares):

    length = len(shares[0])
    out = bytearray(length)

    for i in range(length):
        v = 0
        for s in shares:
            v ^= s[i]
        out[i] = v

    return bytes(out)