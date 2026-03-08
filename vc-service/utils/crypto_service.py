import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend


def generate_key():
    return os.urandom(32)  # AES-256


def encrypt(data: bytes, key: bytes):

    iv = os.urandom(16)

    cipher = Cipher(
        algorithms.AES(key),
        modes.CFB(iv),
        backend=default_backend()
    )

    encryptor = cipher.encryptor()

    encrypted = encryptor.update(data) + encryptor.finalize()

    return iv + encrypted


def decrypt(data: bytes, key: bytes):

    iv = data[:16]
    ciphertext = data[16:]

    cipher = Cipher(
        algorithms.AES(key),
        modes.CFB(iv),
        backend=default_backend()
    )

    decryptor = cipher.decryptor()

    decrypted = decryptor.update(ciphertext) + decryptor.finalize()

    return decrypted