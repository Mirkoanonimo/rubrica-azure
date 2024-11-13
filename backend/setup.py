from setuptools import setup, find_packages

setup(
    name="rubrica-backend",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "python-jose",
        "passlib",
        "python-multipart",
        "pytest",
        "pytest-asyncio",
        "httpx",
    ],
)