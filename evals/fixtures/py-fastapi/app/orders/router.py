from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class Order(BaseModel):
    id: str
    user_id: str
    amount_cents: int
    status: str = "pending"


_orders: dict[str, Order] = {}


@router.get("")
def list_orders(user_id: str | None = None) -> list[Order]:
    out = list(_orders.values())
    if user_id is not None:
        out = [o for o in out if o.user_id == user_id]
    return out


@router.post("")
def create_order(order: Order) -> Order:
    if order.amount_cents <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")
    _orders[order.id] = order
    return order


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str) -> Order:
    order = _orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="order not found")
    if order.status == "cancelled":
        raise HTTPException(status_code=409, detail="already cancelled")
    order.status = "cancelled"
    return order
