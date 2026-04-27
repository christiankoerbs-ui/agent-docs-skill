from fastapi import FastAPI

from app.users.router import router as users_router
from app.orders.router import router as orders_router

app = FastAPI(title="py-fastapi-fixture")

app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
