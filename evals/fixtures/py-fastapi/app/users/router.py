from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class User(BaseModel):
    id: str
    email: str
    name: str


_users: dict[str, User] = {}


@router.get("")
def list_users() -> list[User]:
    return list(_users.values())


@router.post("")
def create_user(user: User) -> User:
    if user.id in _users:
        raise HTTPException(status_code=409, detail="user already exists")
    _users[user.id] = user
    return user


@router.get("/{user_id}")
def get_user(user_id: str) -> User:
    user = _users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    return user
