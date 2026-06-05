export type ExampleFile = {
  filename: string;
  code: string;
};

export type FastAPIExample = {
  id: string;
  title: string;
  task: string;
  files: ExampleFile[];
  explanation: string;
};

export const fastapiExamples: FastAPIExample[] = [  {
    id: "project-structure",
    title: "Структура крупного FastAPI-проекта",
    task: "Спроектируйте архитектуру FastAPI-приложения для e-commerce платформы с несколькими доменами (товары, заказы, пользователи, платежи). Реализуйте разбиение на модули через APIRouter с префиксами и тегами, разделение слоёв (router → service → repository), подключение роутеров в главном app, общий механизм dependency injection через Depends. Обоснуйте структуру директорий.",
    files: [
      {
        filename: "directory_structure.txt",
        code: `ecommerce/
├── app/
│   ├── main.py                  # точка входа, регистрация роутеров
│   ├── core/
│   │   ├── config.py            # Pydantic Settings
│   │   ├── database.py          # AsyncEngine, get_db dependency
│   │   └── dependencies.py      # общие Depends (current_user и т.д.)
│   ├── products/
│   │   ├── router.py            # APIRouter, только HTTP
│   │   ├── service.py           # бизнес-логика
│   │   ├── repository.py        # запросы к БД
│   │   ├── schemas.py           # Pydantic модели запроса/ответа
│   │   └── models.py            # SQLAlchemy ORM-модели
│   ├── orders/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── users/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   └── payments/
│       ├── router.py
│       ├── service.py
│       ├── repository.py
│       ├── schemas.py
│       └── models.py
├── tests/
│   ├── conftest.py
│   ├── test_products.py
│   └── test_orders.py
├── alembic/                     # миграции БД
├── pyproject.toml
└── Dockerfile`,
      },
      {
        filename: "app/main.py",
        code: `from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import init_db
from app.orders.router import router as orders_router
from app.payments.router import router as payments_router
from app.products.router import router as products_router
from app.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="E-Commerce API",
    version="1.0.0",
    lifespan=lifespan,
)

# Каждый домен регистрируется с собственным префиксом и тегом.
# prefix задаёт URL-путь, tags группирует эндпоинты в /docs.
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders_router,   prefix="/api/v1/orders",   tags=["Orders"])
app.include_router(users_router,    prefix="/api/v1/users",    tags=["Users"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])`,
      },
      {
        filename: "app/core/database.py",
        code: `from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # проверяет соединение перед использованием
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,  # объекты доступны после commit без повторного SELECT
)


async def init_db() -> None:
    """Создаёт таблицы при старте (для продакшена используйте Alembic)."""
    from app.core.base import Base  # noqa: импорт всех моделей
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency для получения сессии БД.
    Сессия автоматически закрывается после завершения запроса.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise`,
      },
      {
        filename: "app/core/dependencies.py",
        code: `from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.users.models import User
from app.users.service import UserService

# Аннотированный тип для DI — используется во всех роутерах.
# Annotated[X, Depends(Y)] позволяет писать просто: db: DbDep
# вместо: db: AsyncSession = Depends(get_db)
DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    # token: str = Depends(oauth2_scheme),  # реальная реализация с JWT
    db: DbDep = None,
) -> User:
    """
    Общая зависимость аутентификации.
    Подключается к любому эндпоинту через: user: CurrentUser.
    """
    # Заглушка — в реальном проекте здесь декодирование JWT
    raise NotImplementedError("Implement JWT auth here")


CurrentUser = Annotated[User, Depends(get_current_user)]`,
      },
      {
        filename: "app/products/router.py",
        code: `from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import DbDep
from app.products.schemas import ProductCreate, ProductResponse, ProductUpdate
from app.products.service import ProductService

router = APIRouter()

# Service создаётся через Depends — легко подменить в тестах
def get_product_service(db: DbDep) -> ProductService:
    return ProductService(db)

ServiceDep = Annotated[ProductService, Depends(get_product_service)]


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    service: ServiceDep,
    category_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    """Список товаров с пагинацией и фильтрацией по категории."""
    return await service.list_products(category_id=category_id, page=page, per_page=per_page)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, service: ServiceDep):
    """Получить товар по ID."""
    return await service.get_product_or_404(product_id)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    service: ServiceDep,
    # current_user: CurrentUser,  # раскомментировать для авторизации
):
    """Создать новый товар."""
    return await service.create_product(data)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, data: ProductUpdate, service: ServiceDep):
    """Частичное обновление товара."""
    return await service.update_product(product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, service: ServiceDep):
    """Удалить товар."""
    await service.delete_product(product_id)`,
      },
      {
        filename: "app/products/service.py",
        code: `from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.products.repository import ProductRepository
from app.products.schemas import ProductCreate, ProductUpdate


class ProductService:
    """
    Бизнес-логика домена Product.
    Не знает об HTTP — работает только с данными и репозиторием.
    Можно вызывать из других сервисов (например, OrderService).
    """

    def __init__(self, db: AsyncSession):
        self.repo = ProductRepository(db)

    async def list_products(
        self,
        category_id: int | None,
        page: int,
        per_page: int,
    ):
        offset = (page - 1) * per_page
        return await self.repo.find_all(category_id=category_id, offset=offset, limit=per_page)

    async def get_product_or_404(self, product_id: int):
        product = await self.repo.find_by_id(product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found",
            )
        return product

    async def create_product(self, data: ProductCreate):
        existing = await self.repo.find_by_sku(data.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SKU '{data.sku}' already exists",
            )
        return await self.repo.create(data)

    async def update_product(self, product_id: int, data: ProductUpdate):
        product = await self.get_product_or_404(product_id)
        return await self.repo.update(product, data)

    async def delete_product(self, product_id: int) -> None:
        product = await self.get_product_or_404(product_id)
        await self.repo.delete(product)`,
      },
      {
        filename: "app/products/repository.py",
        code: `from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.products.models import Product
from app.products.schemas import ProductCreate, ProductUpdate


class ProductRepository:
    """
    Все запросы к БД для домена Product.
    Единственный слой, который знает о SQLAlchemy.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_all(
        self,
        category_id: int | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Product]:
        stmt = select(Product).where(Product.is_active == True)
        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
        stmt = stmt.offset(offset).limit(limit).order_by(Product.name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_by_id(self, product_id: int) -> Product | None:
        return await self.db.get(Product, product_id)

    async def find_by_sku(self, sku: str) -> Product | None:
        result = await self.db.execute(select(Product).where(Product.sku == sku))
        return result.scalar_one_or_none()

    async def create(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        self.db.add(product)
        await self.db.flush()   # получаем ID без commit
        await self.db.refresh(product)
        return product

    async def update(self, product: Product, data: ProductUpdate) -> Product:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def delete(self, product: Product) -> None:
        await self.db.delete(product)
        await self.db.flush()`,
      },
      {
        filename: "app/products/schemas.py",
        code: `from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    sku: str = Field(min_length=1, max_length=50)
    price: Decimal = Field(gt=0, decimal_places=2)
    category_id: int
    stock: int = Field(default=0, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """Все поля опциональны — PATCH-семантика."""
    name: str | None = Field(default=None, min_length=1, max_length=200)
    price: Decimal | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None

    @field_validator("price", mode="before")
    @classmethod
    def round_price(cls, v):
        if v is not None:
            return round(Decimal(str(v)), 2)
        return v


class ProductResponse(ProductBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}`,
      },
    ],
    explanation: `**Router → Service → Repository** — три слоя с чёткими обязанностями:

- **Router** знает только про HTTP: принимает запрос, вызывает сервис, возвращает ответ. Никакой бизнес-логики, никаких SQL-запросов.
- **Service** содержит бизнес-логику: валидацию бизнес-правил (SKU уникален, категория существует), оркестрацию нескольких репозиториев, обработку ошибок. Не знает об HTTP, можно вызывать из других сервисов.
- **Repository** — единственный слой с SQLAlchemy. Только CRUD: find, create, update, delete. Не содержит бизнес-логики.

**Почему доменная структура (не слоевая)?** Альтернатива — папки \`routers/\`, \`services/\`, \`models/\` — плохо масштабируется: каждое изменение затрагивает несколько папок. Доменная структура (\`products/\`, \`orders/\`) позволяет найти весь код домена в одном месте.

**Annotated + Depends** — современный синтаксис DI в FastAPI 0.95+. \`DbDep = Annotated[AsyncSession, Depends(get_db)]\` объявляется один раз и используется во всех роутерах без дублирования. Тип виден статическим анализаторам (mypy, pyright).

**\`expire_on_commit=False\`** — без этого параметра после \`commit()\` все атрибуты объекта становятся «expired» и при следующем обращении SQLAlchemy делает дополнительный SELECT. В async-контексте это вызывает ошибку \`MissingGreenlet\`. Флаг устраняет проблему.

**\`flush()\` вместо \`commit()\` в репозитории** — \`flush()\` отправляет SQL в БД и получает сгенерированный ID, но транзакция ещё открыта. \`commit()\` происходит в dependency \`get_db\` после завершения запроса. Если что-то упадёт — автоматический \`rollback()\`.`,
  },

  {
    id: "lifespan-resource-management",
    title: "Lifespan и управление ресурсами приложения",
    task: "Реализуйте управление жизненным циклом приложения через lifespan context manager (FastAPI 0.95+). При старте: инициализация пула соединений к БД, подключение к Redis, прогрев кэша, загрузка ML-модели в память. При остановке: корректное закрытие всех соединений, ожидание завершения in-flight запросов. Сравните с устаревшими on_startup/on_shutdown.",
    files: [
      {
        filename: "app/core/lifespan.py",
        code: `"""
Lifespan — единственное место инициализации и освобождения ресурсов.

Преимущества перед on_startup / on_shutdown:
  - Ресурс инициализируется и освобождается в одной функции (try/finally)
  - State app.state доступен внутри lifespan и в handlers через request.app.state
  - Тестирование: TestClient автоматически вызывает lifespan при использовании
    в контекстном менеджере (with TestClient(app) as client: ...)
  - Поддержка вложенных lifespan через contextlib.AsyncExitStack
"""
import logging
from contextlib import asynccontextmanager, AsyncExitStack
from typing import Any

import httpx
import redis.asyncio as aioredis
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.ml import load_recommendation_model

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Код до yield выполняется при старте.
    Код после yield выполняется при остановке (даже при исключении).

    AsyncExitStack позволяет регистрировать несколько async context manager-ов
    и гарантирует их закрытие в обратном порядке — как вложенные with-блоки.
    """
    logger.info("Application starting up...")

    async with AsyncExitStack() as stack:
        # --- 1. Пул соединений к PostgreSQL ---
        engine = create_async_engine(
            settings.database_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        # stack.callback гарантирует вызов dispose при завершении
        stack.callback(lambda: logger.info("DB engine disposed"))
        await stack.enter_async_context(_engine_lifespan(engine))

        app.state.db_engine = engine
        app.state.db_session_factory = async_sessionmaker(engine, expire_on_commit=False)
        logger.info("Database pool initialized")

        # --- 2. Redis ---
        redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
        await stack.enter_async_context(_redis_lifespan(redis_client))
        app.state.redis = redis_client
        logger.info("Redis connected")

        # --- 3. HTTP-клиент для внешних API (переиспользуемый пул) ---
        http_client = httpx.AsyncClient(timeout=10.0)
        await stack.enter_async_context(http_client)
        app.state.http_client = http_client
        logger.info("HTTP client initialized")

        # --- 4. Прогрев кэша (не блокирует старт при ошибке) ---
        try:
            await _warm_up_cache(redis_client)
            logger.info("Cache warmed up")
        except Exception as exc:
            logger.warning("Cache warm-up failed, continuing: %s", exc)

        # --- 5. Загрузка ML-модели в память ---
        try:
            app.state.recommendation_model = await load_recommendation_model(
                settings.ml_model_path
            )
            logger.info("ML model loaded")
        except Exception as exc:
            app.state.recommendation_model = None
            logger.error("ML model failed to load: %s", exc)

        logger.info("Application startup complete")
        yield  # <-- приложение работает

    # После yield AsyncExitStack автоматически закрывает все ресурсы
    logger.info("Application shutdown complete")


@asynccontextmanager
async def _engine_lifespan(engine):
    """Корректное закрытие пула соединений к БД."""
    try:
        yield engine
    finally:
        await engine.dispose()
        logger.info("Database connections closed")


@asynccontextmanager
async def _redis_lifespan(client):
    """Корректное закрытие соединений с Redis."""
    try:
        await client.ping()
        yield client
    finally:
        await client.aclose()
        logger.info("Redis connection closed")


async def _warm_up_cache(redis_client) -> None:
    """
    Прогрев: загружаем популярные товары в Redis до первого запроса.
    Клиенты не получают «холодный» кэш при первом обращении после деплоя.
    """
    from app.products.service import get_popular_products_for_cache
    products = await get_popular_products_for_cache()
    if products:
        await redis_client.setex("cache:popular_products", 3600, products)`,
      },
      {
        filename: "app/main.py",
        code: `from fastapi import FastAPI

from app.core.lifespan import lifespan
from app.products.router import router as products_router
from app.orders.router import router as orders_router

app = FastAPI(
    title="E-Commerce API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])`,
      },
      {
        filename: "app/core/dependencies.py",
        code: `"""
Зависимости, которые читают ресурсы из app.state.
Ресурсы инициализируются в lifespan и живут весь срок работы приложения.
"""
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession


def get_db_session(request: Request) -> AsyncSession:
    """Создаёт сессию из фабрики, хранящейся в app.state."""
    return request.app.state.db_session_factory()


def get_redis(request: Request) -> aioredis.Redis:
    """Возвращает Redis-клиент из app.state."""
    return request.app.state.redis


def get_recommendation_model(request: Request):
    """Возвращает загруженную ML-модель (может быть None)."""
    return request.app.state.recommendation_model


# Аннотированные типы для удобного использования в роутерах
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
RedisClient = Annotated[aioredis.Redis, Depends(get_redis)]`,
      },
      {
        filename: "comparison_old_vs_new.py",
        code: `"""
Сравнение: on_startup/on_shutdown (устарело) vs lifespan (рекомендуется).
"""
import redis.asyncio as aioredis
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine


# ---------------------------------------------------------------------------
# УСТАРЕВШИЙ способ (FastAPI < 0.95, не рекомендуется)
# ---------------------------------------------------------------------------

old_app = FastAPI()
engine = None
redis_client = None


@old_app.on_event("startup")   # DeprecationWarning в новых версиях
async def startup():
    global engine, redis_client
    engine = create_async_engine("postgresql+asyncpg://...")
    redis_client = aioredis.from_url("redis://localhost")


@old_app.on_event("shutdown")  # DeprecationWarning в новых версиях
async def shutdown():
    global engine, redis_client
    # Проблемы:
    # 1. Если startup упал на середине — shutdown всё равно вызовется,
    #    engine может быть None → AttributeError
    # 2. Глобальные переменные — нет изоляции между тестами
    # 3. Нет гарантии порядка закрытия при нескольких обработчиках
    if engine:
        await engine.dispose()
    if redis_client:
        await redis_client.aclose()


# ---------------------------------------------------------------------------
# СОВРЕМЕННЫЙ способ (FastAPI 0.95+, рекомендуется)
# ---------------------------------------------------------------------------
# Преимущества:
#   + try/finally гарантирует освобождение ресурса даже при исключении
#   + Ресурс инициализируется и освобождается в одном месте (читаемость)
#   + app.state вместо глобальных переменных — изоляция между тестами
#   + AsyncExitStack управляет порядком закрытия нескольких ресурсов
#
# В тестах:
#   async with AsyncClient(app=app, base_url="http://test") as client:
#       # lifespan запускается автоматически, ресурсы доступны
#       response = await client.get("/products")`,
      },
      {
        filename: "tests/test_lifespan.py",
        code: `"""
Тестирование с lifespan: ресурсы инициализируются автоматически.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.anyio
async def test_products_list_uses_db():
    """
    AsyncClient запускает lifespan при входе в контекст —
    БД, Redis и ML-модель инициализированы для теста.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/v1/products/")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_app_state_populated():
    """Проверяем, что lifespan корректно заполнил app.state."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        assert app.state.db_engine is not None
        assert app.state.redis is not None`,
      },
    ],
    explanation: `**lifespan** — это \`@asynccontextmanager\`, который FastAPI вызывает при старте (код до \`yield\`) и при остановке (код после \`yield\`). \`finally\` гарантирует освобождение ресурсов даже если приложение упало с исключением.

**AsyncExitStack** решает проблему нескольких ресурсов. Без него каждый ресурс требует вложенного \`async with\`, а при добавлении нового — глубже вложенности. Stack регистрирует ресурсы динамически и закрывает их в обратном порядке (LIFO): Redis закроется до БД, HTTP-клиент — до Redis.

**app.state** — встроенный namespace FastAPI для хранения разделяемых ресурсов. В отличие от глобальных переменных: изолируется между тестами (каждый тест создаёт новый экземпляр app), доступен через \`request.app.state\` в любом handler. Не используйте глобальные переменные для пула соединений.

**Прогрев кэша (warm-up)** выполняется до \`yield\`: первый запрос пользователя не получит «холодный» кэш. Ошибка прогрева оборачивается в \`try/except\` — недоступный кэш не должен останавливать деплой.

**ML-модель в памяти**: загружается один раз при старте, хранится в \`app.state\`. Каждый запрос получает уже готовую модель через dependency без повторной загрузки. Если модель не загрузилась — \`None\`, handler проверяет это.

**Устаревший \`on_event\`**: декоратор \`@app.on_event("startup")\` выдаёт \`DeprecationWarning\` с FastAPI 0.95. Главная проблема — отсутствие \`try/finally\`: если startup упал на полпути, shutdown вызовется, но часть ресурсов не инициализирована → \`AttributeError\` при попытке закрыть их.

**Тестирование**: \`async with AsyncClient(transport=ASGITransport(app=app))\` автоматически запускает lifespan. Ресурсы реально инициализируются — интеграционные тесты работают с настоящей БД (тестовой) и Redis.`,
  },

  {
    id: "custom-error-handling",
    title: "Кастомная обработка ошибок",
    task: "Реализуйте единую систему обработки ошибок для API. Создайте иерархию кастомных исключений (AppException, NotFoundError, ValidationError, AuthError), зарегистрируйте exception_handler для каждого типа, верните ошибки в унифицированном формате (RFC 7807 Problem Details). Логируйте неожиданные исключения с полным stacktrace, не раскрывая детали клиенту в production.",
    files: [
      {
        filename: "app/core/exceptions.py",
        code: `"""
Иерархия исключений приложения.

Все исключения наследуют AppException — можно поймать всё одним except.
Каждый класс несёт HTTP-статус и machine-readable type (RFC 7807).
"""
from http import HTTPStatus


class AppException(Exception):
    """
    Базовое исключение приложения.
    Все бизнес-ошибки наследуют этот класс.
    """
    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    type_uri: str = "https://api.example.com/errors/internal-error"
    default_title: str = "Internal Server Error"

    def __init__(self, detail: str | None = None, **extra):
        self.detail = detail or self.default_title
        self.extra = extra  # дополнительные поля для Problem Details
        super().__init__(self.detail)


class NotFoundError(AppException):
    status_code = HTTPStatus.NOT_FOUND
    type_uri = "https://api.example.com/errors/not-found"
    default_title = "Resource Not Found"

    def __init__(self, resource: str, resource_id: int | str | None = None):
        detail = f"{resource} not found"
        if resource_id is not None:
            detail = f"{resource} with id={resource_id} not found"
        super().__init__(detail=detail, resource=resource, resource_id=resource_id)


class ConflictError(AppException):
    status_code = HTTPStatus.CONFLICT
    type_uri = "https://api.example.com/errors/conflict"
    default_title = "Resource Conflict"


class BusinessRuleError(AppException):
    """Нарушение бизнес-правила (недостаточно средств, заказ уже отменён и т.д.)."""
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY
    type_uri = "https://api.example.com/errors/business-rule-violation"
    default_title = "Business Rule Violation"


class AuthError(AppException):
    status_code = HTTPStatus.UNAUTHORIZED
    type_uri = "https://api.example.com/errors/unauthorized"
    default_title = "Authentication Required"


class ForbiddenError(AppException):
    status_code = HTTPStatus.FORBIDDEN
    type_uri = "https://api.example.com/errors/forbidden"
    default_title = "Access Forbidden"


class RateLimitError(AppException):
    status_code = HTTPStatus.TOO_MANY_REQUESTS
    type_uri = "https://api.example.com/errors/rate-limit-exceeded"
    default_title = "Rate Limit Exceeded"

    def __init__(self, retry_after: int = 60):
        super().__init__(
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            retry_after=retry_after,
        )`,
      },
      {
        filename: "app/core/error_handlers.py",
        code: `"""
Обработчики исключений — регистрируются в main.py через app.add_exception_handler().

Формат ответа: RFC 7807 Problem Details (https://www.rfc-editor.org/rfc/rfc7807)
Content-Type: application/problem+json

{
  "type":     "https://api.example.com/errors/not-found",
  "title":    "Resource Not Found",
  "status":   404,
  "detail":   "Product with id=42 not found",
  "instance": "/api/v1/products/42",
  "resource": "Product",         # дополнительные поля (extensions)
  "resource_id": 42
}
"""
import logging
import traceback
from typing import Any

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


def _problem_response(
    request: Request,
    status_code: int,
    type_uri: str,
    title: str,
    detail: str,
    **extensions: Any,
) -> JSONResponse:
    """
    Строит RFC 7807 Problem Details ответ.
    instance — URI текущего запроса, помогает клиенту идентифицировать
    конкретный запрос в логах поддержки.
    """
    body: dict[str, Any] = {
        "type":     type_uri,
        "title":    title,
        "status":   status_code,
        "detail":   detail,
        "instance": str(request.url),
    }
    body.update(extensions)

    return JSONResponse(
        content=body,
        status_code=status_code,
        media_type="application/problem+json",
    )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Обрабатывает все AppException и их подклассы.
    Бизнес-ошибки логируются на уровне WARNING (не ERROR — они ожидаемы).
    """
    logger.warning(
        "AppException: type=%s, detail=%s, path=%s",
        type(exc).__name__, exc.detail, request.url.path,
    )
    return _problem_response(
        request,
        status_code=exc.status_code,
        type_uri=exc.type_uri,
        title=exc.default_title,
        detail=exc.detail,
        **exc.extra,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Обрабатывает ошибки валидации Pydantic (422 Unprocessable Entity).
    Форматирует список ошибок в читаемый вид с указанием поля.
    """
    errors = [
        {
            "field":   " → ".join(str(loc) for loc in err["loc"]),
            "message": err["msg"],
            "type":    err["type"],
        }
        for err in exc.errors()
    ]
    return _problem_response(
        request,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        type_uri="https://api.example.com/errors/validation-error",
        title="Validation Error",
        detail=f"{len(errors)} validation error(s)",
        errors=errors,
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """
    Обрабатывает стандартные HTTP-исключения FastAPI (HTTPException).
    Например: raise HTTPException(status_code=404, detail="Not found")
    """
    return _problem_response(
        request,
        status_code=exc.status_code,
        type_uri=f"https://api.example.com/errors/http-{exc.status_code}",
        title=exc.detail or "HTTP Error",
        detail=exc.detail or "An HTTP error occurred",
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Последний рубеж: перехватывает любое необработанное исключение.

    В production: возвращает общее сообщение без деталей реализации.
    В debug-режиме: добавляет traceback для разработчиков.

    НИКОГДА не раскрывайте traceback клиентам в production:
    это может содержать пути файлов, SQL-запросы, внутренние данные.
    """
    logger.error(
        "Unhandled exception: %s %s\n%s",
        request.method,
        request.url,
        traceback.format_exc(),  # полный traceback только в логах
    )

    detail = "An unexpected error occurred. Please try again later."
    extensions: dict[str, Any] = {}

    if settings.debug:
        # Только в dev-окружении показываем детали разработчику
        extensions["exception"] = type(exc).__name__
        extensions["traceback"] = traceback.format_exc()

    return _problem_response(
        request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        type_uri="https://api.example.com/errors/internal-error",
        title="Internal Server Error",
        detail=detail,
        **extensions,
    )`,
      },
      {
        filename: "app/main.py",
        code: `from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.error_handlers import (
    app_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException
from app.core.lifespan import lifespan
from app.products.router import router as products_router

app = FastAPI(
    title="E-Commerce API",
    version="1.0.0",
    lifespan=lifespan,
    # Отключаем стандартные обработчики FastAPI —
    # заменяем их нашими с RFC 7807 форматом
)

# Порядок регистрации важен: более специфичные — первыми.
# AppException регистрируется до Exception, иначе Exception поглотит его.
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])`,
      },
      {
        filename: "app/products/service.py",
        code: `"""
Пример использования кастомных исключений в сервисе.
"""
from decimal import Decimal

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.products.repository import ProductRepository
from app.products.schemas import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db):
        self.repo = ProductRepository(db)

    async def get_product_or_404(self, product_id: int):
        product = await self.repo.find_by_id(product_id)
        if product is None:
            # NotFoundError несёт resource и resource_id —
            # они попадут в Problem Details ответ
            raise NotFoundError(resource="Product", resource_id=product_id)
        return product

    async def create_product(self, data: ProductCreate):
        existing = await self.repo.find_by_sku(data.sku)
        if existing:
            raise ConflictError(detail=f"SKU '{data.sku}' already exists")
        return await self.repo.create(data)

    async def update_price(self, product_id: int, new_price: Decimal):
        product = await self.get_product_or_404(product_id)

        max_discount = product.base_price * Decimal("0.10")
        if new_price < max_discount:
            raise BusinessRuleError(
                detail=f"Price {new_price} is below minimum allowed {max_discount:.2f}",
                current_price=str(product.price),
                min_allowed=str(max_discount),
            )
        product.price = new_price
        await self.repo.save(product)
        return product`,
      },
      {
        filename: "tests/test_error_handlers.py",
        code: `"""
Тесты обработчиков ошибок — проверяем формат RFC 7807.
"""
import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import NotFoundError
from app.main import app, products_router
from fastapi import APIRouter

# Тестовый роутер с эндпоинтами, которые бросают исключения
test_router = APIRouter()

@test_router.get("/trigger-not-found")
async def trigger_not_found():
    raise NotFoundError(resource="Widget", resource_id=99)

@test_router.get("/trigger-500")
async def trigger_500():
    raise RuntimeError("Something went very wrong")

app.include_router(test_router, prefix="/test")


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


def test_not_found_returns_rfc7807(client):
    response = client.get("/test/trigger-not-found")
    assert response.status_code == 404
    assert response.headers["content-type"] == "application/problem+json"
    body = response.json()
    assert body["type"] == "https://api.example.com/errors/not-found"
    assert body["status"] == 404
    assert "Widget" in body["detail"]
    assert body["resource"] == "Widget"
    assert body["resource_id"] == 99
    assert "instance" in body


def test_validation_error_format(client):
    # Отправляем невалидные данные — должны получить 422 с полями ошибок
    response = client.post("/api/v1/products/", json={"price": -10})
    assert response.status_code == 422
    body = response.json()
    assert body["type"] == "https://api.example.com/errors/validation-error"
    assert "errors" in body
    assert len(body["errors"]) > 0


def test_unhandled_exception_hides_details(client):
    response = client.get("/test/trigger-500")
    assert response.status_code == 500
    body = response.json()
    # В production traceback не должен попасть в ответ
    assert "traceback" not in body or body.get("traceback") is None
    assert "Something went very wrong" not in body.get("detail", "")`,
      },
    ],
    explanation: `**RFC 7807 Problem Details** — стандарт HTTP API для описания ошибок. Ключевые поля: \`type\` (URI, идентифицирует класс ошибки, не конкретный экземпляр), \`title\` (человекочитаемое название), \`status\` (HTTP-код), \`detail\` (конкретная причина), \`instance\` (URI запроса, помогает найти запрос в логах). Content-Type: \`application/problem+json\` — клиент может программно отличить ошибку от обычного ответа.

**Иерархия исключений** позволяет гибко перехватывать ошибки: один handler для всех \`AppException\` или специализированные для конкретных подклассов. Метаданные (\`status_code\`, \`type_uri\`) хранятся прямо в классе — не нужно передавать их в каждом \`raise\`.

**Порядок регистрации обработчиков важен**: FastAPI проверяет handlers в порядке добавления, но Exception — всегда последний. \`AppException\` нужно зарегистрировать до \`Exception\`, иначе \`Exception\`-handler поглотит его первым.

**Уровни логирования**: бизнес-ошибки (\`NotFoundError\`, \`BusinessRuleError\`) — \`WARNING\`, они ожидаемы. Необработанные исключения — \`ERROR\` с полным \`traceback.format_exc()\` только в логах, не в ответе. Это критично для безопасности: traceback может содержать SQL-запросы, пути файлов, внутренние данные системы.

**\`settings.debug\` для трейсбека**: в dev-режиме traceback добавляется в ответ — удобно для отладки. В production флаг \`False\` — клиент видит только общее сообщение. Никогда не используйте \`DEBUG=True\` в production.

**Тест с \`raise_server_exceptions=False\`**: по умолчанию \`TestClient\` пробрасывает исключения в тест, обходя обработчики. Флаг \`False\` заставляет клиент отдать ответ, который реально вернёт API — именно это нужно тестировать.`,
  },

  {
    id: "middleware",
    title: "Middleware для сквозной функциональности",
    task: "Разработайте набор middleware для production-окружения. RequestIdMiddleware — генерирует UUID для каждого запроса и передаёт через request.state и response header. TimingMiddleware — измеряет время выполнения и добавляет заголовок X-Process-Time. TenantMiddleware — определяет tenant по subdomain или заголовку и устанавливает контекст. Учтите правильный порядок и async-совместимость.",
    files: [
      {
        filename: "app/middleware/request_id.py",
        code: `import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Генерирует уникальный UUID для каждого запроса.

    UUID доступен:
      - В handler-е через request.state.request_id
      - В response header X-Request-ID
      - В логгере через contextvars (см. ниже)

    X-Request-ID позволяет клиенту передать его в поддержку:
    «у меня ошибка, вот ID запроса» → находим запрос в Kibana мгновенно.
    Если клиент сам передаёт X-Request-ID — используем его (idempotent replay).
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Берём ID от клиента или генерируем новый
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        # Сохраняем в state — доступен в любом handler через request.state
        request.state.request_id = request_id

        # Добавляем в contextvars для структурированного логирования
        request_id_ctx.set(request_id)

        response = await call_next(request)

        # Проставляем в ответ — клиент видит ID своего запроса
        response.headers["X-Request-ID"] = request_id
        return response


# contextvars — thread-safe контекст для async-кода
# Каждый запрос имеет свою копию переменной
from contextvars import ContextVar
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


# Фильтр для structlog / logging — добавляет request_id в каждую запись
import logging

class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get("-")
        return True`,
      },
      {
        filename: "app/middleware/timing.py",
        code: `import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class TimingMiddleware(BaseHTTPMiddleware):
    """
    Измеряет время выполнения каждого запроса.

    Добавляет заголовок X-Process-Time: 0.123s в ответ.
    Полезно для:
      - Мониторинга медленных запросов в логах reverse proxy
      - Frontend-разработчиков (видно без devtools profiler)
      - Базового SLO-мониторинга без внешних инструментов
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start

        response.headers["X-Process-Time"] = f"{elapsed:.4f}s"

        # Логируем медленные запросы для проактивного мониторинга
        if elapsed > 1.0:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                "Slow request: %s %s took %.3fs",
                request.method, request.url.path, elapsed,
            )

        return response`,
      },
      {
        filename: "app/middleware/tenant.py",
        code: `from contextvars import ContextVar
from dataclasses import dataclass

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


@dataclass(frozen=True)
class TenantContext:
    tenant_id: str
    plan: str  # "free" | "pro" | "enterprise"
    is_active: bool


# Текущий tenant доступен в любом месте кода без передачи через аргументы
current_tenant: ContextVar[TenantContext | None] = ContextVar(
    "current_tenant", default=None
)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Определяет tenant по subdomain или заголовку X-Tenant-ID.

    Приоритет:
      1. Заголовок X-Tenant-ID (для API-клиентов, мобильных приложений)
      2. Subdomain: acme.api.example.com → tenant_id = "acme"

    Устанавливает TenantContext в contextvars — доступен в handler-ах,
    сервисах и репозиториях без передачи через параметры.

    Пути без tenant (healthcheck, docs) пропускаются.
    """

    BYPASS_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.BYPASS_PATHS:
            return await call_next(request)

        tenant_id = self._resolve_tenant_id(request)

        if not tenant_id:
            return JSONResponse(
                {"detail": "Tenant not identified. Provide X-Tenant-ID header."},
                status_code=400,
            )

        # В реальном проекте — запрос к кэшу/БД за данными тенанта
        tenant = await self._load_tenant(tenant_id)

        if tenant is None:
            return JSONResponse(
                {"detail": f"Tenant '{tenant_id}' not found."},
                status_code=404,
            )

        if not tenant.is_active:
            return JSONResponse(
                {"detail": "Tenant account is suspended."},
                status_code=403,
            )

        # Устанавливаем контекст для текущего запроса
        token = current_tenant.set(tenant)
        request.state.tenant = tenant

        try:
            response = await call_next(request)
        finally:
            # Сбрасываем контекст после запроса
            current_tenant.reset(token)

        response.headers["X-Tenant-ID"] = tenant_id
        return response

    def _resolve_tenant_id(self, request: Request) -> str | None:
        # Заголовок приоритетнее subdomain
        if tenant_id := request.headers.get("X-Tenant-ID"):
            return tenant_id

        # Subdomain: acme.api.example.com → "acme"
        host = request.headers.get("host", "")
        parts = host.split(".")
        if len(parts) >= 3:
            subdomain = parts[0]
            if subdomain not in ("www", "api", "app"):
                return subdomain

        return None

    async def _load_tenant(self, tenant_id: str) -> TenantContext | None:
        # Заглушка — в реальном проекте запрос к Redis или БД
        known_tenants = {
            "acme": TenantContext(tenant_id="acme", plan="pro", is_active=True),
            "demo": TenantContext(tenant_id="demo", plan="free", is_active=True),
        }
        return known_tenants.get(tenant_id)`,
      },
      {
        filename: "app/main.py",
        code: `from fastapi import FastAPI

from app.core.lifespan import lifespan
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.tenant import TenantMiddleware
from app.middleware.timing import TimingMiddleware
from app.products.router import router as products_router

app = FastAPI(title="E-Commerce API", lifespan=lifespan)

# Порядок добавления middleware — ВАЖЕН.
# Starlette применяет middleware в обратном порядке добавления:
# последний добавленный = самый внешний (первым обрабатывает запрос).
#
# Нужный порядок обработки запроса:
#   RequestId → Timing → Tenant → handler
#
# Значит добавляем в обратном порядке:
app.add_middleware(TenantMiddleware)    # добавлен 3-м → внутренний
app.add_middleware(TimingMiddleware)    # добавлен 2-м → средний
app.add_middleware(RequestIdMiddleware) # добавлен 1-м → самый внешний

# Порядок ответа (обратный):
#   handler → Tenant → Timing (добавляет X-Process-Time) → RequestId (добавляет X-Request-ID)

app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])


# --- Пример использования контекста в handler ---

from fastapi import Request
from app.middleware.tenant import current_tenant

@app.get("/api/v1/me/plan")
async def get_my_plan(request: Request):
    # Два способа получить tenant:
    tenant_from_state = request.state.tenant        # через request.state
    tenant_from_ctx   = current_tenant.get()        # через contextvars

    return {
        "tenant_id":  tenant_from_state.tenant_id,
        "plan":       tenant_from_ctx.plan,
        "request_id": request.state.request_id,
    }`,
      },
      {
        filename: "app/middleware/notes.py",
        code: `"""
Советы по middleware в FastAPI / Starlette.

1. BaseHTTPMiddleware vs чистый ASGI middleware
   ─────────────────────────────────────────────
   BaseHTTPMiddleware удобен, но имеет известный edge case:
   при streaming responses (StreamingResponse, Server-Sent Events)
   call_next() буферизует весь ответ в памяти до возврата.

   Для streaming используйте чистый ASGI middleware:

     class RawASGIMiddleware:
         def __init__(self, app):
             self.app = app

         async def __call__(self, scope, receive, send):
             if scope["type"] == "http":
                 # модифицируем scope, receive, send
                 pass
             await self.app(scope, receive, send)

2. Порядок middleware
   ──────────────────
   app.add_middleware() добавляет middleware как стек (LIFO).
   Последний добавленный — самый внешний (первым видит запрос).
   Рисуйте диаграмму: request → MW3 → MW2 → MW1 → handler
                       response ← MW3 ← MW2 ← MW1 ← handler

3. ContextVar vs request.state
   ────────────────────────────
   request.state — доступен только там, где есть объект Request.
   ContextVar   — доступен в любом месте async-кода (сервис, репозиторий)
                   без передачи Request через параметры.
   Используйте оба: state для явности в handler-ах, ContextVar для сервисов.

4. Не делайте блокирующих операций в middleware
   ───────────────────────────────────────────────
   Запрос к БД, файловая система, синхронный HTTP — всё это блокирует
   event loop. Используйте только async-операции или run_in_executor.
""" `,
      },
    ],
    explanation: `**Порядок middleware — LIFO (Last In, First Out)**. \`app.add_middleware()\` строит стек: последний добавленный оборачивает все предыдущие. Чтобы получить порядок RequestId → Timing → Tenant, добавляем их в обратном порядке: TenantMiddleware первым, RequestIdMiddleware последним.

**ContextVar вместо глобальных переменных** — ключевой инструмент для async-кода. Каждый async-таск (запрос) имеет собственную копию переменной: параллельные запросы не пересекаются. \`token = ctx.set(value)\` + \`ctx.reset(token)\` гарантируют восстановление значения после запроса даже при исключении (в \`finally\`).

**X-Request-ID в логах**: UUID проставляется в заголовок ответа и в ContextVar. Логгер с \`RequestIdFilter\` добавляет его в каждую строку лога. Клиент, получив ошибку, видит \`X-Request-ID: 550e8400-...\` и может передать его в поддержку — инженер находит всю цепочку логов одним запросом.

**TenantMiddleware с \`finally\`**: \`current_tenant.reset(token)\` вызывается всегда — даже если handler бросил исключение. Без \`finally\` контекст мог бы «протечь» в следующий запрос, обрабатываемый тем же потоком.

**BaseHTTPMiddleware и streaming**: при использовании \`StreamingResponse\` \`call_next()\` буферизует весь ответ в памяти. Для SSE, chunked responses и WebSocket используйте чистый ASGI middleware через \`__call__(scope, receive, send)\` — он работает с потоком напрямую.

**X-Process-Time** — простой способ мониторинга без метрик: reverse proxy (nginx, Caddy) логирует все заголовки ответа. Можно построить гистограмму времён запросов прямо по nginx access log без Prometheus.`,
  },

  {
    id: "dependency-injection-advanced",
    title: "Зависимости (Dependency Injection) — продвинутые паттерны",
    task: "Реализуйте сложные цепочки зависимостей. Создайте зависимость get_current_user, которая: извлекает JWT из заголовка, валидирует токен, загружает пользователя из БД (с кэшированием), проверяет что пользователь активен. На её основе создайте get_admin_user и get_verified_user. Реализуйте зависимость с cleanup (yield dependency) для управления ресурсами. Объясните use_cache в Depends.",
    files: [
      {
        filename: "app/core/security.py",
        code: `"""
JWT-утилиты: кодирование и декодирование токенов.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(tz=timezone.utc) + (expires_delta or timedelta(minutes=30))
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Декодирует JWT. Бросает JWTError при невалидном/истёкшем токене.
    jose автоматически проверяет exp, iat, nbf.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])`,
      },
      {
        filename: "app/core/dependencies.py",
        code: `"""
Цепочки зависимостей для аутентификации и авторизации.

Граф зависимостей:
  get_token
      └── get_current_user  (использует get_db, get_redis)
              ├── get_active_user
              │       ├── get_admin_user
              │       └── get_verified_user
              └── get_optional_user
"""
import logging
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.users.models import User
from app.users.repository import UserRepository

logger = logging.getLogger(__name__)

# HTTPBearer извлекает токен из заголовка Authorization: Bearer <token>
# auto_error=False — не бросает 403 при отсутствии токена (для optional auth)
bearer_scheme = HTTPBearer(auto_error=True)
optional_bearer = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Уровень 1: извлечение токена
# ---------------------------------------------------------------------------

async def get_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> str:
    """Возвращает raw JWT-строку из Authorization header."""
    return credentials.credentials


# ---------------------------------------------------------------------------
# Уровень 2: основная зависимость аутентификации
# ---------------------------------------------------------------------------

async def get_current_user(
    token: Annotated[str, Depends(get_token)],
    request: Request,
) -> User:
    """
    Полный пайплайн аутентификации:
      1. Декодирует JWT, извлекает user_id
      2. Проверяет кэш Redis (избегаем SELECT при каждом запросе)
      3. При cache miss — загружает из БД, кладёт в кэш на 5 минут
      4. Проверяет, что пользователь не заблокирован

    use_cache=True (по умолчанию): если get_current_user вызывается
    несколькими зависимостями в одном запросе — выполнится один раз.
    FastAPI кэширует результат на время обработки запроса.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Шаг 1: декодируем токен
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise credentials_error

    redis_client: aioredis.Redis = request.app.state.redis
    db_factory = request.app.state.db_session_factory

    # Шаг 2: проверяем кэш
    cache_key = f"user_session:{user_id}"
    cached = await redis_client.get(cache_key)
    if cached:
        # В реальном проекте — десериализация из JSON/msgpack
        logger.debug("User %s loaded from cache", user_id)

    # Шаг 3: загружаем из БД
    async with db_factory() as db:
        repo = UserRepository(db)
        user = await repo.find_by_id(user_id)

    if user is None:
        raise credentials_error

    # Кладём в кэш на 5 минут (300 секунд)
    await redis_client.setex(cache_key, 300, str(user_id))

    return user


# ---------------------------------------------------------------------------
# Уровень 3: специализированные зависимости
# ---------------------------------------------------------------------------

async def get_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    get_current_user уже выполнился и закэшировался.
    get_active_user — лишь дополнительная проверка поверх него.
    """
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user


async def get_admin_user(
    user: Annotated[User, Depends(get_active_user)],
) -> User:
    """Только активные администраторы."""
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_verified_user(
    user: Annotated[User, Depends(get_active_user)],
) -> User:
    """Только активные пользователи с подтверждённым email."""
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required",
        )
    return user


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(optional_bearer)
    ],
    request: Request,
) -> User | None:
    """
    Возвращает пользователя если токен есть, None — если нет.
    Для эндпоинтов с частично публичным доступом.
    """
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
        async with request.app.state.db_session_factory() as db:
            return await UserRepository(db).find_by_id(user_id)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Аннотированные типы — удобное использование в роутерах
# ---------------------------------------------------------------------------

CurrentUser    = Annotated[User, Depends(get_current_user)]
ActiveUser     = Annotated[User, Depends(get_active_user)]
AdminUser      = Annotated[User, Depends(get_admin_user)]
VerifiedUser   = Annotated[User, Depends(get_verified_user)]
OptionalUser   = Annotated[User | None, Depends(get_optional_user)]`,
      },
      {
        filename: "app/core/yield_dependencies.py",
        code: `"""
Yield dependencies — зависимости с cleanup-логикой.

Код до yield: инициализация ресурса.
Код после yield: освобождение ресурса (выполняется всегда, даже при исключении).

Типичные применения:
  - Сессия БД с автокоммитом/роллбэком
  - Захват/освобождение распределённой блокировки
  - Открытие/закрытие внешнего соединения
  - Начало/завершение трассировочного спана (OpenTelemetry)
"""
import logging
from collections.abc import AsyncGenerator
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    """
    Yield dependency: открывает сессию, коммитит при успехе,
    откатывает при исключении, закрывает всегда.

    FastAPI вызывает код после yield в фазе cleanup,
    после отправки ответа клиенту.
    """
    async with request.app.state.db_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_distributed_lock(
    resource_id: str,
    request: Request,
    ttl: int = 30,
) -> AsyncGenerator[bool, None]:
    """
    Yield dependency для распределённой блокировки через Redis (SET NX).

    Паттерн:
      - Захватываем блокировку до yield
      - Handler выполняется с гарантией эксклюзивного доступа к ресурсу
      - Освобождаем блокировку после yield (в finally)

    Если блокировку захватить не удалось — бросаем 409 до yield,
    handler не вызывается вовсе.
    """
    redis_client: aioredis.Redis = request.app.state.redis
    lock_key = f"lock:{resource_id}"

    # SET key value NX EX ttl — атомарный захват блокировки
    acquired = await redis_client.set(lock_key, "1", nx=True, ex=ttl)

    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Resource {resource_id} is currently being processed. Retry later.",
        )

    logger.debug("Lock acquired: %s", lock_key)
    try:
        yield True  # handler выполняется здесь
    finally:
        await redis_client.delete(lock_key)
        logger.debug("Lock released: %s", lock_key)


async def traced_operation(
    request: Request,
    operation_name: str = "unknown",
) -> AsyncGenerator[dict, None]:
    """
    Yield dependency для ручной трассировки (без OpenTelemetry).
    Записывает время начала и окончания операции.
    """
    import time
    span = {
        "operation": operation_name,
        "request_id": getattr(request.state, "request_id", "-"),
        "start_time": time.perf_counter(),
    }
    logger.info("Span started: %s", operation_name)
    try:
        yield span
    finally:
        span["duration"] = time.perf_counter() - span["start_time"]
        logger.info("Span finished: %s in %.4fs", operation_name, span["duration"])`,
      },
      {
        filename: "app/core/use_cache_explained.py",
        code: `"""
use_cache в Depends — что это и когда отключать.

Depends(get_current_user, use_cache=True)   ← по умолчанию
Depends(get_current_user, use_cache=False)  ← принудительный повторный вызов
"""
from typing import Annotated
from fastapi import Depends


# ---------------------------------------------------------------------------
# use_cache=True (по умолчанию)
# ---------------------------------------------------------------------------
#
# FastAPI строит граф зависимостей для каждого запроса.
# Если одна зависимость используется в нескольких местах —
# она вызывается ОДИН РАЗ, результат переиспользуется.
#
# Пример: get_admin_user зависит от get_active_user,
#         get_active_user зависит от get_current_user.
#         При вызове get_admin_user → get_current_user выполнится один раз,
#         даже если граф к нему приходит несколькими путями.
#
# Это важно: get_current_user делает запрос к Redis и БД.
# Без кэширования — N запросов вместо одного.


async def get_request_counter(counter: dict = Depends(lambda: {"count": 0})):
    counter["count"] += 1
    return counter


# В одном запросе оба handler-а получат ОДИН и ТОТ ЖЕ объект counter
# (use_cache=True по умолчанию):

async def handler_a(c: Annotated[dict, Depends(get_request_counter)]):
    return c  # {"count": 1}

async def handler_b(c: Annotated[dict, Depends(get_request_counter)]):
    return c  # {"count": 1} — тот же объект, не новый


# ---------------------------------------------------------------------------
# use_cache=False — когда нужно
# ---------------------------------------------------------------------------
#
# Сценарий 1: зависимость имеет побочный эффект, который должен
#             выполниться несколько раз (счётчик обращений, аудит)
#
# Сценарий 2: зависимость возвращает изменяемый объект и вы хотите
#             независимые копии в разных handler-ах
#
# Сценарий 3: зависимость читает данные, которые могли измениться
#             между двумя вызовами в рамках одного запроса
#             (очень редкий случай)


async def get_fresh_timestamp() -> float:
    import time
    return time.time()


# use_cache=False — каждый вызов возвращает новое время
FreshTimestamp = Annotated[float, Depends(get_fresh_timestamp, use_cache=False)]


# ---------------------------------------------------------------------------
# Scope кэша = один HTTP-запрос
# ---------------------------------------------------------------------------
#
# use_cache=True кэширует результат ТОЛЬКО в рамках одного запроса.
# Два разных запроса всегда получают свои независимые вызовы зависимости.
# Это не in-memory кэш между запросами — для этого используйте Redis/app.state.`,
      },
      {
        filename: "app/products/router.py",
        code: `"""
Примеры использования зависимостей в роутере.
"""
from fastapi import APIRouter, Depends

from app.core.dependencies import ActiveUser, AdminUser, CurrentUser, OptionalUser
from app.core.yield_dependencies import DbSession, get_distributed_lock
from app.products.schemas import ProductCreate, ProductResponse
from app.products.service import ProductService

router = APIRouter()


def get_service(db: DbSession) -> ProductService:
    return ProductService(db)


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    service: ProductService = Depends(get_service),
    user: OptionalUser = None,  # анонимные пользователи видят каталог
):
    """Публичный каталог. Авторизованные пользователи видят цены со скидкой."""
    products = await service.list_products()
    if user and user.is_premium:
        # Применяем персональные скидки
        pass
    return products


@router.post("/", response_model=ProductResponse)
async def create_product(
    data: ProductCreate,
    current_user: AdminUser,        # только администраторы
    service: ProductService = Depends(get_service),
):
    """Создание товара — только для admin."""
    return await service.create_product(data)


@router.post("/{product_id}/purchase")
async def purchase_product(
    product_id: int,
    current_user: ActiveUser,       # только активные пользователи
    service: ProductService = Depends(get_service),
    # Захватываем блокировку на время обработки покупки
    # Два параллельных запроса на один product_id выполнятся последовательно
    _lock: bool = Depends(lambda request: get_distributed_lock(
        f"product:{product_id}", request
    )),
):
    """Покупка товара с распределённой блокировкой."""
    return await service.purchase(product_id, current_user.id)


@router.get("/admin/stats")
async def admin_stats(
    current_user: AdminUser,        # get_current_user → get_active_user → get_admin_user
    service: ProductService = Depends(get_service),
):
    """
    get_current_user вызывается ОДИН РАЗ несмотря на цепочку:
    get_admin_user → get_active_user → get_current_user.
    Один SELECT к БД, одна проверка Redis.
    """
    return await service.get_stats()`,
      },
    ],
    explanation: `**Граф зависимостей** — FastAPI строит DAG (Directed Acyclic Graph) зависимостей для каждого запроса. Вершины — зависимости, рёбра — отношения «зависит от». Перед вызовом handler FastAPI топологически сортирует граф и выполняет зависимости в правильном порядке.

**use_cache=True (по умолчанию)** означает: если одна зависимость достигается несколькими путями в графе, она выполняется ровно один раз, результат переиспользуется. \`get_current_user\` стоит один SELECT + один Redis GET — без кэширования цепочка \`AdminUser → get_active_user → get_current_user\` делала бы три SELECT вместо одного.

**Yield dependency** — аналог \`with\`-блока, но встроенный в DI-систему FastAPI. Код до \`yield\`: инициализация (захват блокировки, открытие сессии). Handler выполняется. Код после \`yield\`: cleanup (освобождение блокировки, коммит/роллбэк). FastAPI гарантирует вызов cleanup даже при исключении в handler.

**Цепочка аутентификации**: \`CurrentUser → ActiveUser → AdminUser\` — каждый уровень добавляет одну проверку. \`get_admin_user\` не дублирует логику JWT и загрузки из БД — она уже выполнена в \`get_current_user\`. Замена одного типа на другой в параметре handler-а меняет уровень доступа без изменения логики.

**Распределённая блокировка через Redis SET NX EX**: атомарный захват — либо устанавливает ключ (успех), либо нет (ресурс занят). TTL защищает от deadlock при краше процесса. Yield dependency гарантирует освобождение в \`finally\` — блокировка не останется навсегда.

**OptionalUser для частично публичных эндпоинтов**: \`auto_error=False\` в \`HTTPBearer\` не бросает 401 при отсутствии токена, зависимость возвращает \`None\`. Handler сам решает, что показывать анонимным пользователям.`,
  },

  {
    id: "pydantic-v2-validation",
    title: "Продвинутая валидация с Pydantic v2",
    task: "Создайте систему схем для модели Product с использованием Pydantic v2: базовая схема ProductBase, схемы ProductCreate, ProductUpdate (все поля Optional), ProductInDB (с полями БД), ProductResponse (публичный вид). Реализуйте кастомные валидаторы через @field_validator и @model_validator, кастомные типы (например, PositiveDecimal, Slug), схемы с дискриминированными union типами.",
    files: [
      {
        filename: "app/products/types.py",
        code: `"""
Кастомные Pydantic-типы — переиспользуются во всех схемах.

Pydantic v2 позволяет создавать типы через Annotated + AfterValidator/BeforeValidator.
Это обычные Python-типы: работают с mypy, pyright, отображаются в OpenAPI.
"""
import re
from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator, BeforeValidator, Field

# PositiveDecimal: Decimal > 0, с округлением до 2 знаков
def _round_decimal(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"))

PositiveDecimal = Annotated[
    Decimal,
    Field(gt=0, decimal_places=2, max_digits=12),
    AfterValidator(_round_decimal),
]

# Slug: строка в формате "my-product-slug", только строчные буквы и дефисы
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def _validate_slug(v: str) -> str:
    v = v.lower().strip()
    if not _SLUG_RE.match(v):
        raise ValueError("Slug must contain only lowercase letters, digits and hyphens")
    if len(v) > 100:
        raise ValueError("Slug must be 100 characters or less")
    return v

Slug = Annotated[str, AfterValidator(_validate_slug)]

# StrictPositiveInt: целое число > 0 без приведения типов (strict mode)
StrictPositiveInt = Annotated[int, Field(gt=0, strict=True)]

# TrimmedStr: строка с автоматическим strip() и проверкой на непустоту
def _trim_str(v: str) -> str:
    return v.strip()

TrimmedStr = Annotated[
    str,
    BeforeValidator(_trim_str),
    Field(min_length=1),
]`,
      },
      {
        filename: "app/products/schemas.py",
        code: `"""
Иерархия схем для Product.

ProductBase        — общие поля для создания и обновления
ProductCreate      — входящие данные при POST /products
ProductUpdate      — входящие данные при PATCH /products/{id} (все Optional)
ProductInDB        — внутреннее представление (поля из БД, не для клиента)
ProductResponse    — исходящие данные (публичный вид)
ProductAdminResponse — расширенный вид для администраторов
"""
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from .types import PositiveDecimal, Slug, TrimmedStr


class ProductBase(BaseModel):
    name: TrimmedStr = Field(max_length=200, examples=["Premium Headphones"])
    slug: Slug
    price: PositiveDecimal
    category_id: int = Field(gt=0)
    stock: int = Field(default=0, ge=0)
    tags: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: Any) -> list[str]:
        """
        Нормализует теги: строчные, без дублей, без пустых строк.
        mode="before" — выполняется до стандартной валидации типа.
        """
        if isinstance(v, str):
            v = [v]
        if not isinstance(v, list):
            raise ValueError("tags must be a list of strings")
        seen = set()
        result = []
        for tag in v:
            tag = str(tag).lower().strip()
            if tag and tag not in seen:
                seen.add(tag)
                result.append(tag)
        return result

    @field_validator("slug", mode="after")
    @classmethod
    def slug_from_name_allowed(cls, v: str) -> str:
        """mode='after' — выполняется после стандартной валидации типа Slug."""
        return v


class ProductCreate(ProductBase):
    """Входящие данные при создании товара."""
    base_price: PositiveDecimal | None = None

    @model_validator(mode="after")
    def set_base_price(self) -> "ProductCreate":
        """
        model_validator(mode='after') вызывается после валидации всех полей.
        self — уже валидированный объект модели.
        Если base_price не задана — используем price.
        """
        if self.base_price is None:
            self.base_price = self.price
        if self.base_price < self.price:
            raise ValueError("base_price cannot be less than current price")
        return self


class ProductUpdate(BaseModel):
    """
    PATCH-схема: все поля опциональны.
    model_validate(exclude_unset=True) позволяет обновить только переданные поля.
    """
    name: TrimmedStr | None = Field(default=None, max_length=200)
    slug: Slug | None = None
    price: PositiveDecimal | None = None
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    tags: list[str] | None = None

    @model_validator(mode="after")
    def at_least_one_field(self) -> "ProductUpdate":
        """Отклоняем пустой PATCH-запрос."""
        if all(v is None for v in self.model_dump().values()):
            raise ValueError("At least one field must be provided for update")
        return self


class ProductInDB(ProductBase):
    """
    Внутреннее представление — включает поля БД.
    Не передаётся клиенту напрямую.
    model_config from_attributes=True: Pydantic читает атрибуты ORM-объекта.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    base_price: PositiveDecimal
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductResponse(BaseModel):
    """Публичное представление — только безопасные для клиента поля."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    price: Decimal
    category_id: int
    stock: int
    is_active: bool
    tags: list[str]

    model_config = ConfigDict(
        from_attributes=True,
        # json_schema_extra добавляет example в OpenAPI
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Premium Headphones",
                "slug": "premium-headphones",
                "price": "4999.00",
                "category_id": 3,
                "stock": 42,
                "is_active": True,
                "tags": ["audio", "wireless"],
            }
        },
    )`,
      },
      {
        filename: "app/products/discriminated_schemas.py",
        code: `"""
Дискриминированные union-типы (Discriminated Unions).

Позволяют FastAPI / Pydantic выбирать нужную схему по значению
одного поля (дискриминатора). Полезно для:
  - Разных типов уведомлений (email, sms, push)
  - Разных типов товаров (физический, цифровой, подписка)
  - Разных форматов цены (фиксированная, диапазон, по запросу)
"""
from decimal import Decimal
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field


class FixedPrice(BaseModel):
    """Фиксированная цена."""
    type: Literal["fixed"] = "fixed"
    amount: Decimal = Field(gt=0, decimal_places=2)
    currency: str = Field(default="RUB", min_length=3, max_length=3)


class RangePrice(BaseModel):
    """Цена в диапазоне (например, для товаров с вариантами)."""
    type: Literal["range"] = "range"
    min_amount: Decimal = Field(gt=0, decimal_places=2)
    max_amount: Decimal = Field(gt=0, decimal_places=2)
    currency: str = Field(default="RUB", min_length=3, max_length=3)

    def model_post_init(self, __context: object) -> None:
        if self.min_amount > self.max_amount:
            raise ValueError("min_amount must be <= max_amount")


class QuotePrice(BaseModel):
    """Цена по запросу."""
    type: Literal["quote"] = "quote"
    contact_email: str


# Annotated с discriminator='type' — Pydantic смотрит на поле 'type'
# и выбирает нужный класс без перебора всех вариантов.
# Это быстрее и даёт чёткие ошибки валидации.
PriceInfo = Annotated[
    Union[FixedPrice, RangePrice, QuotePrice],
    Field(discriminator="type"),
]


class ProductWithPrice(BaseModel):
    """Товар с дискриминированным типом цены."""
    id: int
    name: str
    price_info: PriceInfo


# --- Пример использования ---
# Pydantic автоматически выберет FixedPrice, RangePrice или QuotePrice
# по значению поля "type":

fixed_product = ProductWithPrice.model_validate({
    "id": 1,
    "name": "Headphones",
    "price_info": {"type": "fixed", "amount": "4999.00"},
})

range_product = ProductWithPrice.model_validate({
    "id": 2,
    "name": "Custom PC",
    "price_info": {"type": "range", "min_amount": "50000", "max_amount": "200000"},
})`,
      },
    ],
    explanation: `**Иерархия схем** разделяет ответственности: \`ProductBase\` содержит общую валидацию, \`ProductCreate\` добавляет логику создания, \`ProductUpdate\` делает все поля опциональными для PATCH-семантики, \`ProductInDB\` добавляет поля БД (не для клиента), \`ProductResponse\` — только безопасные для клиента поля. Такое разделение защищает от случайной утечки внутренних полей (base_price, created_at) в публичный API.

**Кастомные типы через Annotated** — лучше, чем дублирование валидаторов в каждой схеме. \`PositiveDecimal\` определяется один раз и переиспользуется везде. mypy и pyright понимают эти типы как обычные \`Decimal\` — никаких специальных аннотаций в коде не нужно. В OpenAPI они отображаются с полными ограничениями.

**\`@field_validator(mode="before")\`** выполняется до приведения типа Python. Принимает сырые данные (str, list, dict). Используется для нормализации (теги в нижний регистр, strip пробелов). **\`mode="after"\`** — после приведения типа, работает с уже валидированным значением.

**\`@model_validator(mode="after")\`** вызывается когда все поля уже провалидированы. \`self\` — готовый объект модели. Используется для межполевой валидации (base_price >= price) и вычисляемых значений (если base_price не задана — копируем price).

**\`model_dump(exclude_unset=True)\`** в PATCH-сценарии: возвращает только поля, которые явно переданы в запросе. Если клиент передал \`{"stock": 5}\` — только stock обновится, остальные поля не тронуты. Без \`exclude_unset\` все None-поля перезаписали бы БД.

**Discriminated Union** работает быстрее обычного Union: Pydantic смотрит на одно поле-дискриминатор (\`type\`) и сразу выбирает нужную схему без перебора. Ошибки валидации точны: «ожидался FixedPrice, получен неверный amount», а не «ни один из 3 вариантов не подошёл».`,
  },

  {
    id: "serialization-nested-structures",
    title: "Сериализация и десериализация сложных структур",
    task: "Реализуйте API endpoint, принимающий и возвращающий сложную вложенную структуру: заказ с позициями, каждая позиция со своим товаром и вариантами. Используйте model_config с from_attributes=True для ORM-объектов. Реализуйте кастомный model_serializer для управления процессом сериализации. Обеспечьте корректное отображение в OpenAPI-схеме.",
    files: [
      {
        filename: "app/orders/models.py",
        code: `from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    sku: Mapped[str] = mapped_column(String(50), unique=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    name: Mapped[str] = mapped_column(String(100))   # "XL / Red"
    price_modifier: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    stock: Mapped[int] = mapped_column(default=0)

    product: Mapped["Product"] = relationship(back_populates="variants")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()
    variant: Mapped["ProductVariant | None"] = relationship()`,
      },
      {
        filename: "app/orders/schemas.py",
        code: `"""
Схемы для сложной вложенной структуры Order → OrderItem → Product → ProductVariant.

from_attributes=True позволяет Pydantic читать ORM-объекты как словари:
  model.id → schema.id, model.items → schema.items (через relationship).

Ключевое правило: если ORM-отношение lazy (по умолчанию), Pydantic попытается
обратиться к атрибуту уже вне async-сессии → MissingGreenlet.
Решение: явная загрузка через selectinload/joinedload в репозитории.
"""
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_serializer


# ---------------------------------------------------------------------------
# Вложенные схемы (от «листьев» к «корню»)
# ---------------------------------------------------------------------------

class ProductVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price_modifier: Decimal
    stock: int


class ProductBriefResponse(BaseModel):
    """Краткая информация о товаре — только нужные поля для позиции заказа."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product: ProductBriefResponse
    variant: ProductVariantResponse | None = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal = Field(
        default=Decimal("0"),
        description="quantity × unit_price, вычисляется при сериализации",
    )

    @model_serializer(mode="wrap")
    def serialize(self, handler: Any) -> dict[str, Any]:
        """
        model_serializer(mode='wrap') — полный контроль над сериализацией.
        handler(self) — вызывает стандартную сериализацию, мы получаем dict.
        Затем добавляем/изменяем вычисляемые поля.

        Альтернатива: @computed_field (Pydantic v2) — проще, но менее гибко.
        """
        data = handler(self)
        # Добавляем вычисляемое поле total_price
        data["total_price"] = str(self.unit_price * self.quantity)
        # Форматируем unit_price для читаемости
        data["unit_price"] = str(self.unit_price)
        return data


class OrderResponse(BaseModel):
    """
    Корневая схема заказа. Включает все вложенные объекты.
    Pydantic рекурсивно сериализует items → product → variants.
    """
    model_config = ConfigDict(
        from_attributes=True,
        # Переименование полей при сериализации: snake_case → camelCase
        # populate_by_name=True позволяет использовать оба имени при вводе
        populate_by_name=True,
    )

    id: int
    user_id: int
    status: str
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime
    total_amount: Decimal = Field(
        default=Decimal("0"),
        description="Сумма всех позиций, вычисляется при сериализации",
    )

    @model_serializer(mode="wrap")
    def serialize(self, handler: Any) -> dict[str, Any]:
        data = handler(self)
        # Вычисляем total_amount из уже сериализованных items
        total = sum(
            Decimal(item["total_price"])
            for item in data.get("items", [])
        )
        data["total_amount"] = str(total)
        data["status_display"] = {
            "pending":   "Ожидает обработки",
            "confirmed": "Подтверждён",
            "shipped":   "Отправлен",
            "delivered": "Доставлен",
            "cancelled": "Отменён",
        }.get(self.status, self.status)
        return data


# ---------------------------------------------------------------------------
# Входящие схемы (deserialization)
# ---------------------------------------------------------------------------

class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    variant_id: int | None = Field(default=None, gt=0)
    quantity: int = Field(gt=0, le=100)


class OrderCreate(BaseModel):
    """Входящие данные при создании заказа."""
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)

    def model_post_init(self, __context: object) -> None:
        """Проверяем уникальность (product_id, variant_id) в позициях."""
        seen: set[tuple[int, int | None]] = set()
        for item in self.items:
            key = (item.product_id, item.variant_id)
            if key in seen:
                raise ValueError(
                    f"Duplicate item: product_id={item.product_id}, "
                    f"variant_id={item.variant_id}"
                )
            seen.add(key)`,
      },
      {
        filename: "app/orders/repository.py",
        code: `"""
Репозиторий загружает вложенные отношения явно через selectinload.
Без этого Pydantic получит lazy-proxy вместо данных — ошибка MissingGreenlet.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import Order


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id_with_items(self, order_id: int) -> Order | None:
        """
        Загружает заказ со всеми вложенными отношениями за 3 запроса
        (selectinload делает SELECT IN вместо N+1 отдельных SELECT).

        Без явной загрузки Pydantic from_attributes попытается обратиться
        к relationship уже вне async-сессии → MissingGreenlet.
        """
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items).options(
                    selectinload("product"),   # item.product
                    selectinload("variant"),   # item.variant (может быть None)
                )
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()`,
      },
      {
        filename: "app/orders/router.py",
        code: `from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import ActiveUser, DbSession
from app.orders.repository import OrderRepository
from app.orders.schemas import OrderCreate, OrderResponse
from app.orders.service import OrderService

router = APIRouter()


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    responses={
        200: {
            "description": "Заказ с позициями и товарами",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "user_id": 42,
                        "status": "confirmed",
                        "status_display": "Подтверждён",
                        "total_amount": "14997.00",
                        "items": [
                            {
                                "id": 1,
                                "product": {"id": 7, "name": "Headphones", "sku": "HP-001"},
                                "variant": {"id": 3, "name": "Black", "price_modifier": "0.00", "stock": 10},
                                "quantity": 3,
                                "unit_price": "4999.00",
                                "total_price": "14997.00",
                            }
                        ],
                        "created_at": "2024-01-15T10:30:00",
                        "updated_at": "2024-01-15T10:31:00",
                    }
                }
            },
        },
    },
)
async def get_order(order_id: int, current_user: ActiveUser, db: DbSession):
    repo = OrderRepository(db)
    order = await repo.find_by_id_with_items(order_id)

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # from_attributes=True: Pydantic читает ORM-объект напрямую
    return OrderResponse.model_validate(order)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(data: OrderCreate, current_user: ActiveUser, db: DbSession):
    service = OrderService(db)
    order = await service.create_order(current_user.id, data)
    return OrderResponse.model_validate(order)`,
      },
    ],
    explanation: `**from_attributes=True** позволяет Pydantic читать ORM-объекты как словари: \`product.name\` вместо \`product["name"]\`. Без этого флага \`model_validate(orm_object)\` выдаст ошибку — Pydantic не знает, что у объекта нужно читать атрибуты, а не ключи.

**selectinload для вложенных отношений** — обязателен в async SQLAlchemy. По умолчанию отношения lazy: SQLAlchemy отдаёт прокси, который делает SELECT при первом обращении. В async-контексте это обращение происходит вне open-сессии → \`MissingGreenlet\`. \`selectinload(Order.items)\` загружает все items одним \`SELECT ... WHERE order_id IN (...)\`, а не N отдельными запросами.

**\`@model_serializer(mode="wrap")\`** — полный контроль над сериализацией. \`handler(self)\` вызывает стандартную сериализацию и возвращает dict. После этого можно добавить вычисляемые поля (\`total_price\`, \`total_amount\`), переформатировать значения или добавить display-версии (status → status_display). Альтернатива: \`@computed_field\` — проще, но не даёт доступ к уже сериализованным вложенным объектам.

**Вычисляемые поля в сериализаторе**: \`total_price = quantity × unit_price\` вычисляется при сериализации OrderItem. \`total_amount\` на уровне Order суммирует уже сериализованные items — нет дублирования логики. Клиент получает готовые значения без вычислений на фронтенде.

**Разделение схем входа и выхода**: \`OrderCreate\` / \`OrderItemCreate\` — строгая валидация входящих данных (quantity в пределах 1–100, нет дублей позиций). \`OrderResponse\` / \`OrderItemResponse\` — форматированный вывод с вычисляемыми полями. Смешивать их в одну схему — антипаттерн.

**responses в роутере** добавляет пример в OpenAPI. Swagger UI отображает пример в «Try it out» — клиент сразу видит реальную структуру ответа, не абстрактную схему.`,
  },

  {
    id: "generic-schemas",
    title: "Generic-модели и переиспользуемые схемы",
    task: "Реализуйте переиспользуемые generic Pydantic-схемы для типовых структур ответов. PaginatedResponse[T] — обёртка для пагинированных списков с метаданными. ApiResponse[T] — унифицированный конверт с data, errors, meta. FilterParams — базовый класс для параметров фильтрации с валидацией диапазонов. Покажите, как они отображаются в Swagger UI.",
    files: [
      {
        filename: "app/core/schemas.py",
        code: `"""
Переиспользуемые generic-схемы.

Generic[T] в Pydantic v2:
  - PaginatedResponse[ProductResponse] — конкретный тип для Swagger
  - FastAPI генерирует отдельную OpenAPI-схему для каждого T
  - Swagger UI показывает «PaginatedResponse_ProductResponse_»
    с правильными полями вложенного объекта
"""
import math
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field, computed_field, model_validator

T = TypeVar("T")


# ---------------------------------------------------------------------------
# PaginatedResponse[T]
# ---------------------------------------------------------------------------

class PaginationMeta(BaseModel):
    """Метаданные пагинации."""
    page: int
    per_page: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Обёртка для пагинированных списков.

    Использование в роутере:
      return PaginatedResponse[ProductResponse].build(
          items=products,
          total=total_count,
          page=page,
          per_page=per_page,
      )

    В OpenAPI генерируется как отдельная схема:
      «PaginatedResponse_ProductResponse_» с полем items: ProductResponse[]
    """
    items: list[T]
    meta: PaginationMeta

    @classmethod
    def build(
        cls,
        items: list[T],
        total: int,
        page: int,
        per_page: int,
    ) -> "PaginatedResponse[T]":
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        return cls(
            items=items,
            meta=PaginationMeta(
                page=page,
                per_page=per_page,
                total_items=total,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1,
            ),
        )


# ---------------------------------------------------------------------------
# ApiResponse[T] — унифицированный конверт
# ---------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    """Одна ошибка в списке errors."""
    code: str
    message: str
    field: str | None = None  # для ошибок валидации полей


class ResponseMeta(BaseModel):
    """Дополнительные метаданные ответа."""
    request_id: str | None = None
    version: str = "1.0"
    deprecation_notice: str | None = None


class ApiResponse(BaseModel, Generic[T]):
    """
    Унифицированный конверт для всех ответов API.

    Успех:   ApiResponse[ProductResponse](data=product, success=True)
    Ошибка:  ApiResponse[None](success=False, errors=[ErrorDetail(...)])

    Преимущество: клиент всегда получает одну структуру,
    различает успех/ошибку по флагу success, а не по HTTP-коду.

    Ограничение: усложняет обработку на клиенте и скрывает HTTP-семантику.
    Используйте только если это требование проекта.
    """
    success: bool
    data: T | None = None
    errors: list[ErrorDetail] = Field(default_factory=list)
    meta: ResponseMeta = Field(default_factory=ResponseMeta)

    @model_validator(mode="after")
    def validate_consistency(self) -> "ApiResponse[T]":
        if self.success and self.errors:
            raise ValueError("Successful response must not contain errors")
        if not self.success and self.data is not None:
            raise ValueError("Error response must not contain data")
        return self

    @classmethod
    def ok(cls, data: T, meta: ResponseMeta | None = None) -> "ApiResponse[T]":
        return cls(success=True, data=data, meta=meta or ResponseMeta())

    @classmethod
    def error(cls, errors: list[ErrorDetail], meta: ResponseMeta | None = None) -> "ApiResponse[None]":
        return cls(success=False, errors=errors, meta=meta or ResponseMeta())`,
      },
      {
        filename: "app/core/filters.py",
        code: `"""
Базовые классы для параметров фильтрации через Query-параметры.

FastAPI автоматически читает Query-параметры из Depends(FilterParams):
  GET /products?min_price=100&max_price=5000&sort_by=price&order=asc
"""
from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import Query
from pydantic import BaseModel, Field, model_validator


class PaginationParams(BaseModel):
    """Базовые параметры пагинации. Встраивается в любые filter-схемы."""
    page: int = Field(default=1, ge=1, description="Номер страницы")
    per_page: int = Field(default=20, ge=1, le=100, description="Элементов на странице")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class SortParams(BaseModel):
    """Параметры сортировки с белым списком допустимых полей."""
    sort_by: str = Field(default="created_at")
    order: Literal["asc", "desc"] = "desc"

    ALLOWED_SORT_FIELDS: set[str] = set()  # переопределяется в подклассах

    @model_validator(mode="after")
    def validate_sort_field(self) -> "SortParams":
        if self.ALLOWED_SORT_FIELDS and self.sort_by not in self.ALLOWED_SORT_FIELDS:
            raise ValueError(
                f"Invalid sort_by '{self.sort_by}'. "
                f"Allowed: {sorted(self.ALLOWED_SORT_FIELDS)}"
            )
        return self


class ProductFilterParams(PaginationParams, SortParams):
    """
    Параметры фильтрации товаров.

    FastAPI читает их из Query-параметров через Depends:
      async def list_products(filters: Annotated[ProductFilterParams, Depends()])

    Pydantic валидирует каждый параметр и возвращает 422 при нарушении.
    """
    ALLOWED_SORT_FIELDS = {"name", "price", "created_at", "stock"}

    category_id: int | None = Field(default=None, gt=0)
    min_price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    max_price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    in_stock: bool | None = Field(default=None, description="Только товары в наличии")
    tags: list[str] = Field(default_factory=list, max_length=5)
    search: str | None = Field(default=None, min_length=2, max_length=100)

    @model_validator(mode="after")
    def validate_price_range(self) -> "ProductFilterParams":
        if self.min_price is not None and self.max_price is not None:
            if self.min_price > self.max_price:
                raise ValueError("min_price must be <= max_price")
        return self

    def to_query_dict(self) -> dict:
        """Возвращает только заданные фильтры (exclude_none=True)."""
        return self.model_dump(exclude_none=True, exclude={"page", "per_page", "sort_by", "order"})


class DateRangeParams(BaseModel):
    """Параметры фильтрации по диапазону дат."""
    date_from: date | None = Field(default=None, description="Начало периода (включительно)")
    date_to: date | None = Field(default=None, description="Конец периода (включительно)")

    @model_validator(mode="after")
    def validate_date_range(self) -> "DateRangeParams":
        if self.date_from and self.date_to:
            if self.date_from > self.date_to:
                raise ValueError("date_from must be <= date_to")
        return self


class OrderFilterParams(PaginationParams, SortParams, DateRangeParams):
    """Составные параметры фильтрации заказов."""
    ALLOWED_SORT_FIELDS = {"created_at", "updated_at", "total_amount"}

    status: Literal["pending", "confirmed", "shipped", "delivered", "cancelled"] | None = None
    user_id: int | None = Field(default=None, gt=0)
    min_total: Decimal | None = Field(default=None, gt=0)
    max_total: Decimal | None = Field(default=None, gt=0)`,
      },
      {
        filename: "app/products/router.py",
        code: `"""
Примеры использования generic-схем и FilterParams в роутерах.
"""
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.filters import ProductFilterParams
from app.core.schemas import ApiResponse, ErrorDetail, PaginatedResponse, ResponseMeta
from app.products.schemas import ProductCreate, ProductResponse
from app.products.service import ProductService
from app.core.dependencies import ActiveUser, DbSession

router = APIRouter()


def get_service(db: DbSession) -> ProductService:
    return ProductService(db)


@router.get(
    "/",
    # response_model с Generic корректно отображается в Swagger:
    # FastAPI создаёт схему "PaginatedResponse_ProductResponse_"
    response_model=PaginatedResponse[ProductResponse],
    summary="Список товаров с пагинацией",
)
async def list_products(
    # Annotated[..., Depends()] — FastAPI читает Query-параметры автоматически
    filters: Annotated[ProductFilterParams, Depends()],
    service: ProductService = Depends(get_service),
):
    """
    Swagger UI отображает все поля ProductFilterParams как Query-параметры:
    page, per_page, sort_by, order, category_id, min_price, max_price, ...
    с описаниями из Field(description=...).
    """
    products, total = await service.list_products_filtered(filters)
    return PaginatedResponse[ProductResponse].build(
        items=products,
        total=total,
        page=filters.page,
        per_page=filters.per_page,
    )


@router.post(
    "/",
    response_model=ApiResponse[ProductResponse],
    status_code=201,
    summary="Создать товар",
)
async def create_product(
    data: ProductCreate,
    current_user: ActiveUser,
    service: ProductService = Depends(get_service),
    # request_id доступен через middleware (request.state.request_id)
):
    """
    ApiResponse[ProductResponse] в Swagger отображается как:
    {
      "success": true,
      "data": { ...ProductResponse fields... },
      "errors": [],
      "meta": { "request_id": null, "version": "1.0" }
    }
    """
    product = await service.create_product(data)
    return ApiResponse[ProductResponse].ok(
        data=ProductResponse.model_validate(product),
        meta=ResponseMeta(version="1.0"),
    )


@router.delete(
    "/{product_id}",
    response_model=ApiResponse[None],
    summary="Удалить товар",
)
async def delete_product(
    product_id: int,
    current_user: ActiveUser,
    service: ProductService = Depends(get_service),
):
    try:
        await service.delete_product(product_id)
        return ApiResponse[None].ok(data=None)
    except ValueError as exc:
        return ApiResponse[None].error(
            errors=[ErrorDetail(code="not_found", message=str(exc))]
        )`,
      },
    ],
    explanation: `**Generic[T] в Pydantic v2** работает через стандартный Python typing. \`PaginatedResponse[ProductResponse]\` — это не просто подсказка типов: FastAPI генерирует в OpenAPI отдельную схему \`PaginatedResponse_ProductResponse_\` с полностью раскрытым \`items: array of ProductResponse\`. Swagger UI отображает реальную вложенную структуру, а не просто \`T\`.

**\`PaginatedResponse.build()\`** — фабричный метод, вычисляет \`total_pages\`, \`has_next\`, \`has_prev\` автоматически. Роутер передаёт items и total, получает готовую структуру. Вся математика пагинации в одном месте — не дублируется в каждом эндпоинте.

**FilterParams через \`Depends()\`**: Pydantic-модель как dependency — FastAPI читает каждое поле как отдельный Query-параметр. \`Annotated[ProductFilterParams, Depends()]\` без аргументов означает «читать из Query». Все валидаторы Pydantic работают: неверный \`sort_by\` → 422 с описанием допустимых значений. Swagger отображает все параметры с описаниями из \`Field(description=...)\`.

**\`ALLOWED_SORT_FIELDS\`** — белый список защищает от SQL-инъекций через параметр сортировки. Без проверки \`sort_by="; DROP TABLE products;--"\` мог бы попасть в ORDER BY напрямую.

**\`exclude_unset=True\` в FilterParams**: \`to_query_dict()\` возвращает только явно переданные параметры. Репозиторий применяет только реальные фильтры, не добавляет условия \`WHERE category_id IS NULL AND min_price IS NULL ...\`.

**ApiResponse[T] — компромисс**: унифицированная обёртка удобна если клиент обрабатывает все ответы одинаково. Но скрывает HTTP-семантику: 200 + \`success: false\` против 404 — разные подходы. Используйте ApiResponse только если это явное требование API-контракта; стандартные HTTP-коды + RFC 7807 — более REST-совместимый выбор.`,
  },

  {
    id: "pydantic-settings",
    title: "Настройки приложения через Pydantic Settings",
    task: "Реализуйте управление конфигурацией приложения через pydantic-settings. Создайте иерархию настроек: базовые, dev, staging, production. Поддержите загрузку из .env файлов, переменных окружения, AWS Secrets Manager. Реализуйте валидацию настроек при старте (fail fast), сокрытие секретов в логах, typed-доступ к настройкам через DI. Организуйте секреты (DB URL, API keys) безопасно.",
    files: [
      {
        filename: "app/core/config.py",
        code: `"""
Иерархия конфигураций через pydantic-settings.

pip install pydantic-settings

Источники настроек (в порядке приоритета, от высшего к низшему):
  1. Переменные окружения (env vars)         — наивысший приоритет
  2. .env.local                               — локальные переопределения
  3. .env.{environment}                       — настройки окружения
  4. .env                                     — базовые настройки
  5. Значения по умолчанию в модели          — наименьший приоритет

pydantic-settings объединяет все источники автоматически.
"""
import logging
from functools import lru_cache
from typing import Literal

from pydantic import AnyUrl, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class DatabaseSettings(BaseSettings):
    """Настройки подключения к БД. Вынесены в отдельную модель для ясности."""
    model_config = SettingsConfigDict(env_prefix="DB_")

    host: str = "localhost"
    port: int = 5432
    name: str = "app"
    user: str = "postgres"
    # SecretStr: значение скрыто при str()/repr() и в логах
    # В логах отобразится: password=SecretStr('**********')
    password: SecretStr = SecretStr("postgres")
    pool_size: int = Field(default=10, ge=1, le=100)
    ssl: bool = False

    @property
    def url(self) -> str:
        """Собирает строку подключения. get_secret_value() — единственный способ достать пароль."""
        password = self.password.get_secret_value()
        scheme = "postgresql+asyncpg"
        ssl_suffix = "?sslmode=require" if self.ssl else ""
        return f"{scheme}://{self.user}:{password}@{self.host}:{self.port}/{self.name}{ssl_suffix}"

    @property
    def url_masked(self) -> str:
        """Безопасная версия URL для логов — пароль заменён звёздочками."""
        return f"postgresql+asyncpg://{self.user}:***@{self.host}:{self.port}/{self.name}"


class RedisSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="REDIS_")

    host: str = "localhost"
    port: int = 6379
    password: SecretStr | None = None
    db: int = 0
    max_connections: int = 20

    @property
    def url(self) -> str:
        pwd = self.password.get_secret_value() if self.password else None
        auth = f":{pwd}@" if pwd else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"


class AppSettings(BaseSettings):
    """
    Главная модель настроек. Агрегирует DatabaseSettings и RedisSettings.
    """
    model_config = SettingsConfigDict(
        # Порядок загрузки env_file: последний файл имеет наивысший приоритет
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        # Вложенные модели читаются с префиксом: DB_HOST, REDIS_PORT и т.д.
        env_nested_delimiter="__",
        # Игнорировать лишние переменные окружения (не бросать ошибку)
        extra="ignore",
        # Все env-переменные — case insensitive: APP_DEBUG == app_debug
        case_sensitive=False,
    )

    # --- Базовые ---
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    app_name: str = "E-Commerce API"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000

    # --- Безопасность ---
    secret_key: SecretStr = Field(..., min_length=32)   # ... = обязательное поле
    allowed_hosts: list[str] = Field(default_factory=list)
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # --- JWT ---
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, ge=1)
    refresh_token_expire_days: int = Field(default=7, ge=1)

    # --- Вложенные настройки (читаются с соответствующим env-префиксом) ---
    db: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

    # --- Внешние API (обязательны только в production) ---
    stripe_api_key: SecretStr | None = None
    sendgrid_api_key: SecretStr | None = None
    sentry_dsn: str | None = None

    @model_validator(mode="after")
    def validate_production_requirements(self) -> "AppSettings":
        """
        Fail fast: обязательные для production поля проверяются при старте.
        Если SECRET_KEY не задан — приложение не запустится вообще.
        Лучше падать сразу, чем работать с небезопасными настройками.
        """
        if self.environment == "production":
            if self.debug:
                raise ValueError("DEBUG must be False in production")
            if not self.allowed_hosts:
                raise ValueError("ALLOWED_HOSTS must be set in production")
            if self.stripe_api_key is None:
                raise ValueError("STRIPE_API_KEY must be set in production")
            if self.sentry_dsn is None:
                raise ValueError("SENTRY_DSN must be set in production")
        return self

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key_strength(cls, v: SecretStr) -> SecretStr:
        key = v.get_secret_value()
        if key in ("changeme", "secret", "development", "12345"):
            raise ValueError("SECRET_KEY is too weak. Use a random 32+ character string")
        return v

    def is_production(self) -> bool:
        return self.environment == "production"

    def log_config(self) -> None:
        """Логирует конфигурацию безопасно — SecretStr скрыты автоматически."""
        logger.info("App: %s v%s [%s]", self.app_name, self.app_version, self.environment)
        logger.info("Database: %s", self.db.url_masked)
        logger.info("Debug: %s", self.debug)
        # str(settings) безопасен: SecretStr показывает SecretStr('**********')
        # НЕ ДЕЛАТЬ: logger.info("Settings: %s", settings.model_dump())
        # model_dump() раскрывает SecretStr как строку!`,
      },
      {
        filename: "app/core/config_environments.py",
        code: `"""
Пример иерархии конфигураций через наследование.
Каждое окружение переопределяет только то, что отличается.
"""
from pydantic import Field

from .config import AppSettings


class DevelopmentSettings(AppSettings):
    """
    Конфигурация для разработки.
    debug=True по умолчанию, relaxed security.
    """
    environment: str = "development"
    debug: bool = True
    cors_origins: list[str] = ["*"]  # в dev разрешаем все origins
    access_token_expire_minutes: int = 60 * 24  # 24 часа — удобно при разработке


class StagingSettings(AppSettings):
    """
    Staging максимально близок к production.
    Все production-проверки активны, кроме обязательности Stripe.
    """
    environment: str = "staging"
    debug: bool = False
    access_token_expire_minutes: int = 60  # 1 час


class ProductionSettings(AppSettings):
    """
    Production: все поля из model_validator обязательны.
    SECRET_KEY, STRIPE_API_KEY, SENTRY_DSN должны быть в env vars.
    """
    environment: str = "production"
    debug: bool = False
    db__ssl: bool = True  # SSL для БД обязателен в production


# ---------------------------------------------------------------------------
# Фабрика: создаём нужный класс в зависимости от ENVIRONMENT
# ---------------------------------------------------------------------------

import os

def get_settings_class():
    env = os.environ.get("ENVIRONMENT", "development").lower()
    return {
        "development": DevelopmentSettings,
        "staging":     StagingSettings,
        "production":  ProductionSettings,
    }.get(env, DevelopmentSettings)`,
      },
      {
        filename: "app/core/config_aws.py",
        code: `"""
Загрузка секретов из AWS Secrets Manager.

Паттерн:
  1. Не-секретные настройки — из .env / env vars
  2. Секреты (пароли, API-ключи) — из AWS Secrets Manager при старте
  3. Результат объединяется в AppSettings

pip install boto3
"""
import json
import logging

logger = logging.getLogger(__name__)


def load_secrets_from_aws(secret_name: str, region: str = "eu-west-1") -> dict:
    """
    Загружает секрет из AWS Secrets Manager.
    Возвращает dict {key: value} для объединения с env vars.

    Использование в lifespan:
      aws_secrets = load_secrets_from_aws("prod/ecommerce/api")
      os.environ.update(aws_secrets)  # до создания AppSettings
      settings = AppSettings()
    """
    try:
        import boto3
        from botocore.exceptions import ClientError

        client = boto3.client("secretsmanager", region_name=region)
        response = client.get_secret_value(SecretId=secret_name)

        if "SecretString" in response:
            secrets = json.loads(response["SecretString"])
        else:
            import base64
            secrets = json.loads(base64.b64decode(response["SecretBinary"]))

        logger.info("Loaded %d secrets from AWS Secrets Manager: %s", len(secrets), secret_name)
        return secrets

    except ImportError:
        logger.warning("boto3 not installed, skipping AWS Secrets Manager")
        return {}
    except Exception as exc:
        logger.error("Failed to load secrets from AWS: %s", exc)
        # В production — поднять исключение, не молча игнорировать
        raise


# Пример структуры секрета в AWS Secrets Manager:
# {
#   "SECRET_KEY": "super-random-64-char-string...",
#   "DB_PASSWORD": "prod-db-password",
#   "STRIPE_API_KEY": "sk_live_...",
#   "SENDGRID_API_KEY": "SG...."
# }`,
      },
      {
        filename: "app/core/dependencies.py",
        code: `"""
Typed-доступ к настройкам через Dependency Injection.

lru_cache(maxsize=1) гарантирует единственный экземпляр AppSettings
на всё время работы приложения (singleton).
Повторные вызовы get_settings() возвращают тот же объект без
повторного чтения .env файлов и env vars.
"""
from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.core.config import AppSettings
from app.core.config_environments import get_settings_class


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    """
    Создаёт настройки один раз, кэширует результат.
    При тестировании используйте app.dependency_overrides:

      def override_settings():
          return AppSettings(secret_key="test-secret-key-32-chars-long!!", environment="development")

      app.dependency_overrides[get_settings] = override_settings
    """
    settings_class = get_settings_class()
    settings = settings_class()
    settings.log_config()
    return settings


# Аннотированный тип для использования в роутерах
SettingsDep = Annotated[AppSettings, Depends(get_settings)]


# ---------------------------------------------------------------------------
# Пример использования в роутере
# ---------------------------------------------------------------------------

from fastapi import APIRouter

router = APIRouter()

@router.get("/config/info")
async def get_app_info(settings: SettingsDep):
    """
    Публичная информация о приложении.
    Никогда не возвращаем settings.model_dump() — раскроет секреты!
    """
    return {
        "name":        settings.app_name,
        "version":     settings.app_version,
        "environment": settings.environment,
        # debug — только для dev, никогда не раскрываем в production
        **({"debug": settings.debug} if not settings.is_production() else {}),
    }`,
      },
      {
        filename: ".env.example",
        code: `# Скопируйте в .env и заполните значениями
# .env НЕ коммитить в git! Добавьте в .gitignore

# Окружение
ENVIRONMENT=development

# Обязательные поля (без них приложение не запустится)
SECRET_KEY=change-me-to-random-64-character-string-before-deployment!!

# БД (используется DatabaseSettings с префиксом DB_)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_SIZE=10
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=  # опционально

# Внешние API (обязательны в production)
# STRIPE_API_KEY=sk_live_...
# SENDGRID_API_KEY=SG....
# SENTRY_DSN=https://....ingest.sentry.io/...

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]`,
      },
    ],
    explanation: `**SecretStr** — ключевой инструмент безопасности pydantic-settings. Значение хранится в зашифрованном виде внутри объекта. \`str(secret)\` и \`repr(secret)\` возвращают \`SecretStr('**********')\` — пароль не попадает в логи, трейсы, error-репорты Sentry. Достать значение можно только явно: \`secret.get_secret_value()\`. Используйте его для паролей, API-ключей, JWT-секрета.

**Опасность model_dump()**: даже при использовании SecretStr вызов \`settings.model_dump()\` раскрывает все секреты как строки. Никогда не логируйте \`settings.model_dump()\` и не передавайте его в ответе API. Безопасный путь — отдельный метод \`log_config()\` с явным форматированием.

**Fail fast при старте**: \`@model_validator(mode="after")\` проверяет обязательные настройки до первого запроса. Если \`SECRET_KEY\` не задан или \`DEBUG=True\` в production — \`ValidationError\` при импорте модуля. Приложение не стартует вообще, а не падает на первом запросе реального пользователя.

**env_nested_delimiter**: \`DB__HOST=localhost\` транслируется в \`db.host = "localhost"\`. Это позволяет передавать вложенные настройки через env vars без дополнительного кода.

**lru_cache(maxsize=1)** на \`get_settings()\` — singleton через DI. Первый вызов читает .env и env vars, последующие возвращают кэшированный объект. В тестах переопределяется через \`app.dependency_overrides[get_settings] = lambda: TestSettings()\` — тесты получают изолированные настройки без боковых эффектов.

**AWS Secrets Manager**: секреты загружаются в \`os.environ\` до создания AppSettings в lifespan. pydantic-settings подхватывает их как обычные env vars. Такой подход не требует изменений в коде AppSettings — источник секретов прозрачен для бизнес-логики.`,
  },

  {
    id: "custom-types-annotations",
    title: "Кастомные типы и аннотации",
    task: "Создайте библиотеку кастомных типов для повторного использования в схемах проекта: EmailStr с доменной валидацией, PhoneNumber с нормализацией в E.164, Money с Currency и Amount (без float-ошибок), DateRange с валидацией start < end, Base64File с декодированием и проверкой MIME-типа. Реализуйте корректное отображение каждого типа в JSON Schema.",
    files: [
      {
        filename: "app/types/email.py",
        code: `"""
EmailStr с расширенной валидацией домена.

Pydantic уже предоставляет EmailStr из pydantic[email].
Наш вариант добавляет: черный список доменов, нормализацию,
блокировку одноразовых email-адресов.
"""
import re
from typing import Annotated, Any

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import CoreSchema, core_schema


# Временные / одноразовые email-домены (сокращённый список для примера)
DISPOSABLE_DOMAINS = frozenset({
    "mailinator.com", "tempmail.com", "guerrillamail.com",
    "10minutemail.com", "throwam.com", "yopmail.com",
})

_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$"
)


class EmailAddress(str):
    """
    Кастомный тип email.

    Нормализует: приводит к нижнему регистру, удаляет пробелы.
    Валидирует: формат RFC 5321, блокировка одноразовых доменов.

    Используется как Annotated-тип:
      email: EmailAddress — в Pydantic-схемах
    """

    @classmethod
    def validate(cls, value: Any) -> "EmailAddress":
        if not isinstance(value, str):
            raise ValueError("Email must be a string")

        value = value.strip().lower()

        if not _EMAIL_RE.match(value):
            raise ValueError(f"Invalid email format: {value!r}")

        domain = value.split("@")[1]
        if domain in DISPOSABLE_DOMAINS:
            raise ValueError(f"Disposable email domain not allowed: {domain}")

        return cls(value)

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        """
        Встраивает кастомную валидацию в Pydantic core.
        no_info_plain_validator_function — самый простой вариант:
        принимает любое значение, возвращает валидированный объект.
        """
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema_: CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        """Определяет отображение типа в OpenAPI / JSON Schema."""
        return {
            "type": "string",
            "format": "email",
            "description": "Email address (normalized to lowercase, disposable domains rejected)",
            "examples": ["user@example.com"],
        }


# Готовый тип для импорта
ValidatedEmail = Annotated[EmailAddress, ...]`,
      },
      {
        filename: "app/types/phone.py",
        code: `"""
PhoneNumber с нормализацией в формат E.164.

E.164: +{код страны}{номер}, только цифры, без пробелов и скобок.
Пример: +79001234567, +12025551234

pip install phonenumbers
"""
import re
from typing import Annotated, Any

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import CoreSchema, core_schema


class PhoneNumber(str):
    """
    Нормализует телефонный номер в E.164.

    Принимает: "8 (900) 123-45-67", "+7 900 123 45 67", "79001234567"
    Возвращает: "+79001234567"

    Использует библиотеку phonenumbers для парсинга и валидации.
    Без неё — упрощённая регекс-валидация.
    """

    @classmethod
    def validate(cls, value: Any) -> "PhoneNumber":
        if not isinstance(value, str):
            raise ValueError("Phone number must be a string")

        value = value.strip()

        try:
            import phonenumbers
            # Если номер без знака +, пробуем как российский (RU)
            default_region = None if value.startswith("+") else "RU"
            parsed = phonenumbers.parse(value, default_region)

            if not phonenumbers.is_valid_number(parsed):
                raise ValueError(f"Invalid phone number: {value!r}")

            # E.164: +79001234567
            normalized = phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
        except ImportError:
            # Fallback без phonenumbers: базовая E.164 валидация
            digits_only = re.sub(r"[^\\d+]", "", value)
            if not re.match(r"^\\+[1-9]\\d{6,14}$", digits_only):
                raise ValueError(
                    f"Invalid E.164 phone number: {value!r}. Expected format: +79001234567"
                )
            normalized = digits_only

        return cls(normalized)

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema_: CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            "type": "string",
            "pattern": "^\\+[1-9]\\d{6,14}$",
            "description": "Phone number in E.164 format",
            "examples": ["+79001234567", "+12025551234"],
        }`,
      },
      {
        filename: "app/types/money.py",
        code: `"""
Money — денежная сумма с валютой, без float-ошибок.

Проблема float: 0.1 + 0.2 = 0.30000000000000004.
Решение: Decimal для суммы, ISO 4217 код для валюты.

Money хранится как (amount: Decimal, currency: str).
Сериализуется в JSON как {"amount": "100.50", "currency": "RUB"}.
"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from pydantic import BaseModel, GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import CoreSchema, core_schema

# ISO 4217 коды валют (сокращённый список)
VALID_CURRENCIES = frozenset({
    "RUB", "USD", "EUR", "GBP", "CNY", "JPY", "CHF",
    "AED", "TRY", "KZT", "BYN", "UAH",
})


class Money(BaseModel):
    """
    Денежная сумма.

    amount   — Decimal: точная арифметика без float-ошибок
    currency — ISO 4217 код валюты (3 буквы)

    Сериализация: {"amount": "100.50", "currency": "RUB"}
    Десериализация: принимает строку или число в поле amount.

    Пример использования:
      price: Money = Money(amount=Decimal("4999.00"), currency="RUB")
      total = Money(
          amount=price.amount * 3,
          currency=price.currency,
      )
    """
    amount: Decimal
    currency: str

    model_config = {"json_schema_extra": {
        "description": "Monetary amount with currency",
        "example": {"amount": "4999.00", "currency": "RUB"},
    }}

    def model_post_init(self, __context: Any) -> None:
        # Нормализуем: округление до 2 знаков, проверка валюты
        try:
            object.__setattr__(
                self, "amount",
                self.amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )
        except InvalidOperation:
            raise ValueError(f"Invalid amount: {self.amount}")

        currency = self.currency.upper()
        if currency not in VALID_CURRENCIES:
            raise ValueError(
                f"Unknown currency: {self.currency!r}. "
                f"Expected ISO 4217 code (e.g., RUB, USD, EUR)"
            )
        object.__setattr__(self, "currency", currency)

    def __add__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(
                f"Cannot add {self.currency} and {other.currency}"
            )
        return Money(amount=self.amount + other.amount, currency=self.currency)

    def __mul__(self, factor: int | Decimal) -> "Money":
        return Money(
            amount=(self.amount * Decimal(str(factor))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            ),
            currency=self.currency,
        )

    def __str__(self) -> str:
        return f"{self.amount:.2f} {self.currency}"`,
      },
      {
        filename: "app/types/date_range.py",
        code: `"""
DateRange — диапазон дат с валидацией start < end.

Два режима использования:
  1. Как встраиваемая Pydantic-схема (вложенный объект)
  2. Как Query-параметры (start_date + end_date отдельными полями)
"""
from datetime import date, timedelta
from typing import Any

from pydantic import BaseModel, model_validator


class DateRange(BaseModel):
    """
    Диапазон дат.

    start включается, end включается (closed interval).
    Сериализуется в JSON как {"start": "2024-01-01", "end": "2024-12-31"}.
    """
    start: date
    end: date

    model_config = {
        "json_schema_extra": {
            "description": "Date range (inclusive on both ends)",
            "example": {"start": "2024-01-01", "end": "2024-12-31"},
        }
    }

    @model_validator(mode="after")
    def validate_range(self) -> "DateRange":
        if self.start > self.end:
            raise ValueError(
                f"start ({self.start}) must be <= end ({self.end})"
            )
        return self

    @property
    def days(self) -> int:
        """Количество дней в диапазоне (включительно)."""
        return (self.end - self.start).days + 1

    def contains(self, d: date) -> bool:
        """Проверяет, входит ли дата в диапазон."""
        return self.start <= d <= self.end

    def overlaps(self, other: "DateRange") -> bool:
        """Проверяет пересечение двух диапазонов."""
        return self.start <= other.end and self.end >= other.start

    @classmethod
    def last_n_days(cls, n: int) -> "DateRange":
        """Создаёт диапазон: последние N дней включая сегодня."""
        end = date.today()
        return cls(start=end - timedelta(days=n - 1), end=end)

    @classmethod
    def current_month(cls) -> "DateRange":
        """Текущий месяц."""
        today = date.today()
        import calendar
        last_day = calendar.monthrange(today.year, today.month)[1]
        return cls(
            start=date(today.year, today.month, 1),
            end=date(today.year, today.month, last_day),
        )`,
      },
      {
        filename: "app/types/base64_file.py",
        code: `"""
Base64File — файл, закодированный в Base64, с проверкой MIME-типа.

Паттерн: клиент отправляет файл как Data URL или чистый Base64.
Сервер декодирует, проверяет MIME, возвращает bytes + metadata.

Формат Data URL: data:image/png;base64,iVBORw0KGgo...
Формат raw:      iVBORw0KGgo...
"""
import base64
import re
from dataclasses import dataclass
from typing import Any

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import CoreSchema, core_schema

_DATA_URL_RE = re.compile(r"^data:([\\w/+.-]+);base64,(.+)$", re.DOTALL)

# Сигнатуры файлов (magic bytes) для определения MIME без внешних зависимостей
_MAGIC_BYTES: dict[bytes, str] = {
    b"\\x89PNG":   "image/png",
    b"\\xff\\xd8\\xff": "image/jpeg",
    b"GIF8":       "image/gif",
    b"RIFF":       "image/webp",  # неточно, но достаточно для примера
    b"%PDF":       "application/pdf",
}


@dataclass(frozen=True)
class DecodedFile:
    content: bytes
    mime_type: str
    size: int

    @property
    def extension(self) -> str:
        return {
            "image/png":       ".png",
            "image/jpeg":      ".jpg",
            "image/gif":       ".gif",
            "image/webp":      ".webp",
            "application/pdf": ".pdf",
        }.get(self.mime_type, ".bin")


ALLOWED_MIME_TYPES = frozenset({
    "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf",
})

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class Base64File(DecodedFile):
    """
    Принимает Base64-строку, декодирует и валидирует.

    Использование в схеме:
      class AvatarUpload(BaseModel):
          image: Base64File

    Клиент отправляет:
      {"image": "data:image/png;base64,iVBORw0KGgo..."}
      или
      {"image": "iVBORw0KGgo..."}
    """

    @classmethod
    def validate(cls, value: Any) -> "Base64File":
        if isinstance(value, DecodedFile):
            return cls(content=value.content, mime_type=value.mime_type, size=value.size)

        if not isinstance(value, str):
            raise ValueError("Base64File expects a string")

        # Парсим Data URL или raw Base64
        mime_from_url: str | None = None
        b64_data = value

        match = _DATA_URL_RE.match(value)
        if match:
            mime_from_url = match.group(1)
            b64_data = match.group(2)

        # Декодируем
        try:
            # validate=True проверяет корректность Base64-алфавита
            content = base64.b64decode(b64_data, validate=True)
        except Exception:
            raise ValueError("Invalid Base64 encoding")

        # Проверяем размер
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"File too large: {len(content)} bytes. "
                f"Maximum allowed: {MAX_FILE_SIZE_BYTES // (1024*1024)} MB"
            )

        # Определяем MIME по magic bytes
        detected_mime = next(
            (mime for magic, mime in _MAGIC_BYTES.items() if content.startswith(magic)),
            None,
        )

        mime_type = detected_mime or mime_from_url or "application/octet-stream"

        # Проверяем совпадение заявленного и реального MIME
        if mime_from_url and detected_mime and mime_from_url != detected_mime:
            raise ValueError(
                f"MIME type mismatch: declared {mime_from_url!r}, "
                f"detected {detected_mime!r}"
            )

        if mime_type not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"MIME type {mime_type!r} is not allowed. "
                f"Allowed: {sorted(ALLOWED_MIME_TYPES)}"
            )

        return cls(content=content, mime_type=mime_type, size=len(content))

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                # При сериализации возвращаем метаданные, не bytes
                lambda v: {
                    "mime_type": v.mime_type,
                    "size": v.size,
                    "extension": v.extension,
                },
                info_arg=False,
                return_schema=core_schema.dict_schema(),
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema_: CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            "type": "string",
            "description": (
                "Base64-encoded file content. "
                "Accepts Data URL format (data:image/png;base64,...) "
                "or raw Base64 string. "
                f"Allowed MIME types: {sorted(ALLOWED_MIME_TYPES)}. "
                f"Max size: {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
            ),
            "examples": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."],
        }`,
      },
      {
        filename: "app/types/__init__.py",
        code: `"""
Экспорт всех кастомных типов.

Использование в схемах:
  from app.types import EmailAddress, PhoneNumber, Money, DateRange, Base64File
"""
from .base64_file import Base64File, DecodedFile
from .date_range import DateRange
from .email import EmailAddress, ValidatedEmail
from .money import Money
from .phone import PhoneNumber

__all__ = [
    "EmailAddress",
    "ValidatedEmail",
    "PhoneNumber",
    "Money",
    "DateRange",
    "Base64File",
    "DecodedFile",
]


# ---------------------------------------------------------------------------
# Пример использования всех типов в одной схеме
# ---------------------------------------------------------------------------

from decimal import Decimal
from pydantic import BaseModel


class UserRegistrationRequest(BaseModel):
    email: EmailAddress
    phone: PhoneNumber
    deposit: Money
    active_period: DateRange
    avatar: Base64File | None = None


# Pydantic принимает и нормализует:
example_data = {
    "email": "  User@Example.COM  ",          # → "user@example.com"
    "phone": "+7 (900) 123-45-67",            # → "+79001234567"
    "deposit": {"amount": "1000.5", "currency": "rub"},  # → amount=Decimal("1000.50"), currency="RUB"
    "active_period": {"start": "2024-01-01", "end": "2024-12-31"},
    "avatar": None,
}`,
      },
    ],
    explanation: `**\`__get_pydantic_core_schema__\`** — точка расширения Pydantic v2 для кастомных типов. Возвращает описание схемы валидации для Pydantic Core (Rust). \`no_info_plain_validator_function\` — простейший вариант: функция принимает любое значение, возвращает валидированный объект или бросает ValueError.

**\`__get_pydantic_json_schema__\`** управляет отображением типа в OpenAPI / JSON Schema. Без него Pydantic показывает схему по умолчанию (обычно \`{}\`). С ним: \`EmailAddress\` отображается как \`{type: string, format: email}\`, \`PhoneNumber\` — как \`{type: string, pattern: ...}\`. Swagger UI рендерит ограничения, валидирует на клиенте.

**Decimal вместо float** для денег — стандартная практика. \`Decimal("0.1") + Decimal("0.2") == Decimal("0.3")\` — точно. \`0.1 + 0.2 == 0.30000000000000004\` — float-погрешность. В БД храните как \`NUMERIC(10, 2)\`, в JSON передавайте как строку \`"100.50"\` (не число — теряет точность в JS).

**Magic bytes для определения MIME**: браузер и клиент могут соврать в \`Content-Type\` и Data URL заголовке. Сигнатура файла (первые байты) не лжёт. Сравнение \`content.startswith(b"\\x89PNG")\` — надёжнее, чем доверять заявленному MIME.

**Base64 сериализация**: при ответе клиенту не нужно отдавать raw bytes — достаточно метаданных (\`mime_type\`, \`size\`, \`extension\`). Кастомный serializer через \`plain_serializer_function_ser_schema\` контролирует, что именно попадает в JSON-ответ.

**PhoneNumber в E.164**: стандарт телефонов для хранения и передачи. \`+79001234567\` — один формат для всех стран, без пробелов и скобок. Библиотека \`phonenumbers\` (Google libphonenumber) корректно парсит любые форматы, включая \`8 (900) 123-45-67\` для России.`,
  },

  {
    id: "async-await-patterns",
    title: "Правильная работа с async/await",
    task: "Проведите аудит FastAPI-приложения на предмет типичных async-ошибок: вызов sync-функций в async context (блокировка event loop), неиспользование asyncio.gather для параллельных независимых операций, неправильное использование run_in_executor для CPU-bound задач, утечки ресурсов из-за незакрытых соединений. Исправьте найденные проблемы и объясните каждую.",
    files: [
      {
        filename: "anti_patterns.py",
        code: `"""
Типичные async-антипаттерны в FastAPI и их исправления.

Event loop — однопоточный: пока выполняется sync-операция,
все остальные корутины ждут. 10 запросов по 200ms sync-кода
= 2 секунды простоя вместо 200ms параллельно.
"""
import asyncio
import time
from pathlib import Path

import httpx
from fastapi import FastAPI

app = FastAPI()


# ===========================================================================
# АНТИПАТТЕРН 1: Вызов sync-функций в async context
# ===========================================================================

# ПЛОХО: time.sleep блокирует event loop — ни один другой запрос
# не обрабатывается пока этот спит
@app.get("/bad/sleep")
async def bad_sleep():
    time.sleep(1)          # БЛОКИРУЕТ event loop на 1 секунду!
    return {"status": "done"}


# ХОРОШО: asyncio.sleep освобождает event loop — другие запросы
# обрабатываются пока этот ждёт
@app.get("/good/sleep")
async def good_sleep():
    await asyncio.sleep(1)  # НЕ блокирует, event loop свободен
    return {"status": "done"}


# ПЛОХО: requests — синхронная библиотека, блокирует event loop
@app.get("/bad/http")
async def bad_http_call():
    import requests
    response = requests.get("https://api.example.com/data")  # БЛОКИРУЕТ!
    return response.json()


# ХОРОШО: httpx.AsyncClient — async HTTP, не блокирует
@app.get("/good/http")
async def good_http_call():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return response.json()


# ПЛОХО: sync-чтение файла блокирует event loop
@app.get("/bad/file")
async def bad_file_read():
    content = Path("/etc/hosts").read_text()  # БЛОКИРУЕТ при большом файле
    return {"lines": content.count("\\n")}


# ХОРОШО: aiofiles для async файловых операций
@app.get("/good/file")
async def good_file_read():
    try:
        import aiofiles
        async with aiofiles.open("/etc/hosts", "r") as f:
            content = await f.read()
        return {"lines": content.count("\\n")}
    except ImportError:
        # Альтернатива: run_in_executor для блокирующего IO
        loop = asyncio.get_event_loop()
        content = await loop.run_in_executor(
            None,  # ThreadPoolExecutor по умолчанию
            Path("/etc/hosts").read_text,
        )
        return {"lines": content.count("\\n")}


# ===========================================================================
# АНТИПАТТЕРН 2: Последовательные await вместо параллельных
# ===========================================================================

async def fetch_user(user_id: int) -> dict:
    await asyncio.sleep(0.1)   # имитация запроса к БД
    return {"id": user_id, "name": "User"}

async def fetch_orders(user_id: int) -> list:
    await asyncio.sleep(0.15)  # имитация запроса к БД
    return [{"order_id": 1}]

async def fetch_recommendations(user_id: int) -> list:
    await asyncio.sleep(0.2)   # имитация запроса к ML-сервису
    return [{"product_id": 42}]


# ПЛОХО: 0.1 + 0.15 + 0.2 = 0.45 секунды суммарно
@app.get("/bad/profile/{user_id}")
async def bad_profile(user_id: int):
    user    = await fetch_user(user_id)          # ждём 0.1s
    orders  = await fetch_orders(user_id)        # ждём 0.15s
    recs    = await fetch_recommendations(user_id)  # ждём 0.2s
    return {"user": user, "orders": orders, "recommendations": recs}


# ХОРОШО: max(0.1, 0.15, 0.2) = 0.2 секунды — выполняются параллельно
@app.get("/good/profile/{user_id}")
async def good_profile(user_id: int):
    user, orders, recs = await asyncio.gather(
        fetch_user(user_id),
        fetch_orders(user_id),
        fetch_recommendations(user_id),
    )
    return {"user": user, "orders": orders, "recommendations": recs}


# ===========================================================================
# АНТИПАТТЕРН 3: run_in_executor для CPU-bound задач
# ===========================================================================

import hashlib

def compute_hash_sync(data: bytes) -> str:
    """CPU-bound операция — занимает event loop."""
    return hashlib.sha256(data).hexdigest()


# ПЛОХО: CPU-bound в async context — блокирует event loop
@app.get("/bad/hash")
async def bad_hash():
    result = compute_hash_sync(b"x" * 10_000_000)  # БЛОКИРУЕТ!
    return {"hash": result}


# ХОРОШО для IO-bound: run_in_executor освобождает event loop
# (использует ThreadPoolExecutor — потоки разделяют GIL)
@app.get("/ok/hash-thread")
async def ok_hash_thread():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, compute_hash_sync, b"x" * 10_000_000)
    return {"hash": result}


# ЛУЧШЕ для CPU-bound: ProcessPoolExecutor обходит GIL
from concurrent.futures import ProcessPoolExecutor

_process_pool = ProcessPoolExecutor(max_workers=2)

@app.get("/good/hash-process")
async def good_hash_process():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(_process_pool, compute_hash_sync, b"x" * 10_000_000)
    return {"hash": result}


# ===========================================================================
# АНТИПАТТЕРН 4: Утечки ресурсов — незакрытые соединения
# ===========================================================================

# ПЛОХО: AsyncClient создаётся на каждый запрос и никогда не закрывается
@app.get("/bad/client-leak")
async def bad_client():
    client = httpx.AsyncClient()        # создан
    response = await client.get("https://httpbin.org/get")
    return response.json()              # client НЕ закрыт → утечка соединений!


# ХОРОШО: async with гарантирует закрытие при любом исходе
@app.get("/good/client-safe")
async def good_client():
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get("https://httpbin.org/get")
    return response.json()


# ЛУЧШЕ для production: переиспользуемый клиент из app.state
# (инициализируется в lifespan, не создаётся на каждый запрос)
from fastapi import Request

@app.get("/best/client-reuse")
async def best_client(request: Request):
    client: httpx.AsyncClient = request.app.state.http_client
    response = await client.get("https://httpbin.org/get")
    return response.json()`,
      },
      {
        filename: "async_best_practices.py",
        code: `"""
Продвинутые паттерны: таймауты, отмена задач, structured concurrency.
"""
import asyncio
import logging
from contextlib import suppress

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Таймауты
# ---------------------------------------------------------------------------

async def fetch_with_timeout(url: str, timeout: float = 5.0) -> dict:
    """
    asyncio.wait_for бросает asyncio.TimeoutError при превышении таймаута.
    Корутина внутри автоматически отменяется (CancelledError).
    """
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            return await asyncio.wait_for(
                client.get(url),
                timeout=timeout,
            )
    except asyncio.TimeoutError:
        logger.warning("Request to %s timed out after %.1fs", url, timeout)
        raise


# ---------------------------------------------------------------------------
# Structured concurrency: TaskGroup (Python 3.11+)
# ---------------------------------------------------------------------------

async def fetch_all_structured(urls: list[str]) -> list[dict]:
    """
    asyncio.TaskGroup — более безопасная альтернатива gather().
    При ошибке в одной задаче все остальные отменяются автоматически.
    Группа ждёт завершения всех задач перед выходом из блока.
    """
    results = []
    import httpx
    async with httpx.AsyncClient() as client:
        async with asyncio.TaskGroup() as tg:
            tasks = [
                tg.create_task(client.get(url))
                for url in urls
            ]
    results = [task.result().json() for task in tasks]
    return results


# ---------------------------------------------------------------------------
# Отмена задач
# ---------------------------------------------------------------------------

async def cancellable_operation() -> None:
    """
    Задача должна корректно обрабатывать CancelledError.
    suppress(asyncio.CancelledError) — НЕ использовать: прячет отмену.
    Правильно: поймать, выполнить cleanup, перебросить.
    """
    try:
        await asyncio.sleep(10)  # долгая операция
    except asyncio.CancelledError:
        logger.info("Task cancelled, cleaning up...")
        # cleanup: закрыть соединения, сохранить состояние
        raise  # ОБЯЗАТЕЛЬНО перебросить — иначе отмена не распространится


# ---------------------------------------------------------------------------
# asyncio.shield — защита критичной операции от отмены
# ---------------------------------------------------------------------------

async def critical_save(data: dict) -> None:
    """Сохранение данных — не должно быть отменено на полпути."""
    await asyncio.sleep(0.1)  # имитация записи в БД
    logger.info("Data saved: %s", data)


async def handler_with_shield(data: dict) -> None:
    """
    asyncio.shield защищает critical_save от отмены handler-а.
    Если handler отменён — critical_save продолжит выполнение.
    Используйте только для действительно критичных операций:
    при отмене внешней задачи shield создаёт «осиротевшую» задачу.
    """
    try:
        await asyncio.shield(critical_save(data))
    except asyncio.CancelledError:
        logger.warning("Handler cancelled, but save will complete")
        raise`,
      },
    ],
    explanation: `**Event loop — однопоточный** планировщик корутин. Пока выполняется синхронный код (даже внутри \`async def\`), весь loop заблокирован. 100 одновременных запросов с \`time.sleep(1)\` = 100 секунд ожидания. Тот же эффект с \`requests.get()\`, чтением файла через \`open()\`, любой sync-библиотекой.

**\`await asyncio.sleep()\`** освобождает loop: другие корутины выполняются пока эта ждёт. Аналогично \`await client.get()\`, \`await db.execute()\` — все async-операции отдают управление loop.

**Последовательные \`await\` = последовательное выполнение**. Три независимых запроса к БД после друг друга занимают сумму их времён. \`asyncio.gather()\` запускает их параллельно: итоговое время = максимум из трёх. Правило: если два \`await\` не зависят друг от друга — используйте \`gather\`.

**\`run_in_executor\` для разных случаев**: ThreadPoolExecutor подходит для IO-bound блокирующего кода (файлы, sync-библиотеки). Потоки разделяют GIL — CPU-bound задачи не ускорятся. ProcessPoolExecutor создаёт отдельные процессы с независимым GIL — подходит для вычислений (хэш, сжатие, парсинг). Создавайте пул один раз в lifespan, не на каждый запрос.

**Утечки \`AsyncClient\`**: каждый \`httpx.AsyncClient()\` открывает connection pool. Без \`async with\` или явного \`await client.aclose()\` соединения не закрываются. При тысячах запросов — исчерпание файловых дескрипторов. Решение для production: один переиспользуемый клиент в \`app.state\`, инициализированный в lifespan.

**\`asyncio.TaskGroup\` (Python 3.11+)** — structured concurrency. В отличие от \`gather\`, при ошибке в одной задаче отменяет все остальные и гарантирует ожидание завершения. Предпочтительнее \`gather\` для новых проектов на 3.11+.`,
  },

  {
    id: "parallel-requests-concurrency",
    title: "Параллельные запросы и конкурентность",
    task: "Реализуйте endpoint агрегации данных, который параллельно запрашивает 5 внешних сервисов: курсы валют, погода, новости, биржевые котировки, гео-данные. Используйте asyncio.gather с обработкой частичных сбоев (return_exceptions=True), таймаутами на каждый запрос (asyncio.wait_for), circuit breaker паттерном. Верните частичный результат, если часть сервисов недоступна.",
    files: [
      {
        filename: "app/aggregation/clients.py",
        code: `"""
Клиенты к внешним сервисам с таймаутами и типизированными ответами.
"""
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Таймаут по умолчанию для каждого внешнего сервиса
DEFAULT_TIMEOUT = 3.0


@dataclass
class ExchangeRates:
    base: str
    rates: dict[str, Decimal]
    timestamp: datetime


@dataclass
class WeatherData:
    city: str
    temperature: float
    description: str
    humidity: int


@dataclass
class NewsItem:
    title: str
    url: str
    published_at: datetime


@dataclass
class StockQuote:
    symbol: str
    price: Decimal
    change_pct: float


@dataclass
class GeoData:
    country: str
    city: str
    latitude: float
    longitude: float


async def fetch_exchange_rates(client: httpx.AsyncClient) -> ExchangeRates:
    """Курсы валют от ЦБ / открытого API."""
    response = await client.get(
        "https://api.exchangerate-api.com/v4/latest/RUB",
        timeout=DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    return ExchangeRates(
        base=data["base"],
        rates={k: Decimal(str(v)) for k, v in data["rates"].items()},
        timestamp=datetime.utcnow(),
    )


async def fetch_weather(client: httpx.AsyncClient, city: str = "Moscow") -> WeatherData:
    """Погода из OpenWeatherMap."""
    # В реальном проекте — api_key из settings
    response = await client.get(
        f"https://api.openweathermap.org/data/2.5/weather",
        params={"q": city, "units": "metric", "lang": "ru"},
        timeout=DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    return WeatherData(
        city=city,
        temperature=data["main"]["temp"],
        description=data["weather"][0]["description"],
        humidity=data["main"]["humidity"],
    )


async def fetch_news(client: httpx.AsyncClient) -> list[NewsItem]:
    """Последние новости."""
    response = await client.get(
        "https://newsapi.org/v2/top-headlines",
        params={"country": "ru", "pageSize": 5},
        timeout=DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    return [
        NewsItem(
            title=a["title"],
            url=a["url"],
            published_at=datetime.fromisoformat(a["publishedAt"].replace("Z", "+00:00")),
        )
        for a in data.get("articles", [])
    ]


async def fetch_stock_quotes(
    client: httpx.AsyncClient,
    symbols: list[str] = None,
) -> list[StockQuote]:
    """Биржевые котировки."""
    symbols = symbols or ["SBER", "GAZP", "LKOH"]
    response = await client.get(
        "https://query1.finance.yahoo.com/v8/finance/quote",
        params={"symbols": ",".join(symbols)},
        timeout=DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    return [
        StockQuote(
            symbol=q["symbol"],
            price=Decimal(str(q["regularMarketPrice"])),
            change_pct=q["regularMarketChangePercent"],
        )
        for q in data.get("quoteResponse", {}).get("result", [])
    ]


async def fetch_geo_data(client: httpx.AsyncClient, ip: str = "") -> GeoData:
    """Геолокация по IP."""
    url = f"https://ipapi.co/{ip}/json/" if ip else "https://ipapi.co/json/"
    response = await client.get(url, timeout=DEFAULT_TIMEOUT)
    response.raise_for_status()
    data = response.json()
    return GeoData(
        country=data["country_name"],
        city=data["city"],
        latitude=data["latitude"],
        longitude=data["longitude"],
    )`,
      },
      {
        filename: "app/aggregation/circuit_breaker.py",
        code: `"""
Circuit Breaker — паттерн защиты от каскадных сбоев.

Состояния:
  CLOSED   — нормальная работа, запросы проходят
  OPEN     — сервис недоступен, запросы отклоняются немедленно
  HALF_OPEN — пробный запрос после периода ожидания

Переходы:
  CLOSED  → OPEN:      N подряд ошибок превысили порог
  OPEN    → HALF_OPEN: прошло recovery_timeout секунд
  HALF_OPEN → CLOSED:  пробный запрос успешен
  HALF_OPEN → OPEN:    пробный запрос провалился
"""
import asyncio
import logging
import time
from enum import Enum
from typing import Any, Callable, Coroutine, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(Enum):
    CLOSED    = "closed"
    OPEN      = "open"
    HALF_OPEN = "half_open"


class CircuitBreakerOpen(Exception):
    """Бросается когда circuit breaker в состоянии OPEN."""
    pass


class CircuitBreaker:
    """
    Простой Circuit Breaker для одного внешнего сервиса.

    Использование:
      breaker = CircuitBreaker(name="exchange_api", failure_threshold=3)

      result = await breaker.call(fetch_exchange_rates, client)
      # или:
      @breaker
      async def my_func(): ...
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 1,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: float | None = None
        self._half_open_calls = 0

    @property
    def state(self) -> CircuitState:
        """Автоматически переходит из OPEN в HALF_OPEN по таймауту."""
        if (
            self._state == CircuitState.OPEN
            and self._last_failure_time is not None
            and time.monotonic() - self._last_failure_time >= self.recovery_timeout
        ):
            self._state = CircuitState.HALF_OPEN
            self._half_open_calls = 0
            logger.info("CircuitBreaker [%s]: OPEN → HALF_OPEN", self.name)
        return self._state

    async def call(
        self,
        func: Callable[..., Coroutine[Any, Any, T]],
        *args: Any,
        **kwargs: Any,
    ) -> T:
        """Выполняет корутину через circuit breaker."""
        if self.state == CircuitState.OPEN:
            raise CircuitBreakerOpen(
                f"Circuit breaker [{self.name}] is OPEN. "
                f"Retry after {self.recovery_timeout:.0f}s."
            )

        if self.state == CircuitState.HALF_OPEN:
            if self._half_open_calls >= self.half_open_max_calls:
                raise CircuitBreakerOpen(
                    f"Circuit breaker [{self.name}] is HALF_OPEN, max probe calls reached."
                )
            self._half_open_calls += 1

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as exc:
            self._on_failure()
            raise

    def _on_success(self) -> None:
        if self._state == CircuitState.HALF_OPEN:
            logger.info("CircuitBreaker [%s]: HALF_OPEN → CLOSED (probe succeeded)", self.name)
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time = None

    def _on_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.monotonic()

        if self._failure_count >= self.failure_threshold:
            if self._state != CircuitState.OPEN:
                logger.warning(
                    "CircuitBreaker [%s]: → OPEN after %d failures",
                    self.name, self._failure_count,
                )
            self._state = CircuitState.OPEN
        elif self._state == CircuitState.HALF_OPEN:
            logger.warning("CircuitBreaker [%s]: HALF_OPEN → OPEN (probe failed)", self.name)
            self._state = CircuitState.OPEN

    def get_status(self) -> dict:
        return {
            "name":           self.name,
            "state":          self.state.value,
            "failure_count":  self._failure_count,
            "threshold":      self.failure_threshold,
        }`,
      },
      {
        filename: "app/aggregation/router.py",
        code: `"""
Endpoint агрегации: параллельные запросы с частичными сбоями.

Стратегия:
  1. Запускаем все 5 запросов параллельно через gather(return_exceptions=True)
  2. Каждый запрос ограничен таймаутом (asyncio.wait_for)
  3. Каждый запрос проходит через circuit breaker
  4. Ошибки собираем, не останавливаем агрегацию
  5. Возвращаем частичный результат + список недоступных сервисов
"""
import asyncio
import logging
from typing import Any

import httpx
from fastapi import APIRouter, Request

from .circuit_breaker import CircuitBreaker, CircuitBreakerOpen
from .clients import (
    fetch_exchange_rates,
    fetch_geo_data,
    fetch_news,
    fetch_stock_quotes,
    fetch_weather,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Circuit breakers инициализируются один раз для каждого внешнего сервиса.
# Хранятся как модульные переменные — переиспользуются между запросами.
breakers = {
    "exchange":  CircuitBreaker("exchange",  failure_threshold=3, recovery_timeout=30),
    "weather":   CircuitBreaker("weather",   failure_threshold=3, recovery_timeout=60),
    "news":      CircuitBreaker("news",      failure_threshold=5, recovery_timeout=30),
    "stocks":    CircuitBreaker("stocks",    failure_threshold=3, recovery_timeout=15),
    "geo":       CircuitBreaker("geo",       failure_threshold=3, recovery_timeout=30),
}

SERVICE_TIMEOUT = 4.0  # секунды на каждый внешний сервис


async def safe_fetch(name: str, coro) -> tuple[str, Any]:
    """
    Оборачивает корутину в:
      1. asyncio.wait_for — таймаут
      2. circuit breaker  — защита от каскадных сбоев
      3. try/except       — перехват любой ошибки

    Возвращает (name, result) при успехе или (name, None) при сбое.
    Ошибка логируется, но не поднимается — агрегация продолжается.
    """
    try:
        result = await asyncio.wait_for(
            breakers[name].call(lambda: coro),
            timeout=SERVICE_TIMEOUT,
        )
        return name, result
    except asyncio.TimeoutError:
        logger.warning("Service [%s] timed out after %.1fs", name, SERVICE_TIMEOUT)
        return name, None
    except CircuitBreakerOpen as exc:
        logger.warning("Service [%s] circuit open: %s", name, exc)
        return name, None
    except Exception as exc:
        logger.error("Service [%s] failed: %s: %s", name, type(exc).__name__, exc)
        return name, None


@router.get("/dashboard")
async def get_dashboard(request: Request, city: str = "Moscow"):
    """
    Агрегирует данные из 5 внешних сервисов параллельно.

    Частичный результат: если сервис недоступен — его поле None,
    в available_services он отсутствует.
    Клиент видит какие данные свежие, какие отсутствуют.
    """
    client: httpx.AsyncClient = request.app.state.http_client

    # Запускаем все 5 запросов одновременно.
    # return_exceptions=True — gather НЕ прерывается при ошибке одной корутины,
    # возвращает исключение как элемент результата.
    # safe_fetch уже перехватывает все ошибки → gather всегда возвращает кортежи.
    results = await asyncio.gather(
        safe_fetch("exchange", fetch_exchange_rates(client)),
        safe_fetch("weather",  fetch_weather(client, city)),
        safe_fetch("news",     fetch_news(client)),
        safe_fetch("stocks",   fetch_stock_quotes(client)),
        safe_fetch("geo",      fetch_geo_data(client)),
        return_exceptions=True,  # дополнительная страховка
    )

    # Собираем результаты
    data: dict[str, Any] = {}
    errors: list[str] = []

    for item in results:
        if isinstance(item, Exception):
            # Это не должно произойти (safe_fetch всё перехватывает),
            # но на всякий случай
            errors.append(str(item))
            continue
        name, value = item
        if value is not None:
            data[name] = value
        else:
            errors.append(name)

    # Статус circuit breakers для мониторинга
    circuit_status = {name: cb.get_status() for name, cb in breakers.items()}

    return {
        "data":             data,
        "unavailable":      errors,
        "available_count":  len(data),
        "total_services":   5,
        "partial":          len(errors) > 0,
        "circuit_breakers": circuit_status,
    }


@router.get("/health/circuits")
async def get_circuit_status():
    """Мониторинг состояния circuit breakers."""
    return {
        name: cb.get_status()
        for name, cb in breakers.items()
    }`,
      },
    ],
    explanation: `**\`asyncio.gather(return_exceptions=True)\`** — ключевое отличие от обычного \`gather()\`. Без флага: первая ошибка в любой корутине отменяет все остальные и поднимает исключение. С флагом: все корутины выполняются до конца, исключения возвращаются как элементы результирующего списка. Для агрегации частичных данных — обязателен.

**\`asyncio.wait_for(coro, timeout)\`** оборачивает любую корутину таймаутом. По истечении бросает \`asyncio.TimeoutError\` и отменяет корутину. Каждый внешний сервис должен иметь свой таймаут — без него один зависший сервис держит запрос вечно.

**Circuit Breaker** защищает от каскадных сбоев. Без него: сервис А медленно отвечает → все запросы к нему накапливаются → исчерпание пула соединений → падает весь API. С breaker: после 3 ошибок подряд запросы к сервису А отклоняются мгновенно (без ожидания таймаута) → остальные сервисы продолжают работать. HALF_OPEN позволяет автоматически восстановиться.

**Паттерн \`safe_fetch\`** изолирует ошибку одного сервиса: таймаут + circuit breaker + \`try/except\`. \`gather\` с такими обёртками никогда не поднимает исключение — только возвращает \`None\` для недоступных сервисов. Ошибка логируется один раз в нужном месте.

**Частичный результат**: клиент получает \`available_count: 3, unavailable: ["news", "stocks"]\`. Frontend знает, какие данные показывать, какие — нет. Лучше частичный ответ с пометкой, чем 503 при недоступности одного из пяти сервисов.

**Circuit breakers как переменные модуля**: состояние должно сохраняться между запросами — иначе счётчик ошибок сбрасывается каждый раз. Для multi-process деплоя (несколько воркеров) состояние нужно хранить в Redis.`,
  },

  {
    id: "background-tasks-queues",
    title: "Background Tasks и очереди",
    task: "Сравните и реализуйте три подхода к фоновым задачам в FastAPI. BackgroundTasks — встроенный механизм для лёгких задач после ответа. asyncio.create_task — для задач в рамках event loop. Интеграция с Celery или ARQ — для тяжёлых, retry-able задач. Реализуйте отправку email-уведомления всеми тремя способами и объясните trade-offs каждого.",
    files: [
      {
        filename: "app/notifications/email.py",
        code: `"""
Сервис отправки email — используется всеми тремя подходами.
"""
import logging
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: str
    subject: str
    body: str
    template: str | None = None


async def send_email_async(msg: EmailMessage) -> None:
    """Async отправка через SMTP или SendGrid API."""
    import asyncio
    # Имитация отправки (в реальном проекте — aiosmtplib или httpx к SendGrid)
    await asyncio.sleep(0.5)
    logger.info("Email sent to %s: %s", msg.to, msg.subject)


def send_email_sync(msg: EmailMessage) -> None:
    """Sync отправка — для использования в Celery worker."""
    import time
    time.sleep(0.5)  # SMTP blocking call
    logger.info("Email sent (sync) to %s: %s", msg.to, msg.subject)`,
      },
      {
        filename: "app/notifications/approach1_background_tasks.py",
        code: `"""
Подход 1: FastAPI BackgroundTasks

Механизм: задача запускается в том же event loop ПОСЛЕ отправки ответа.
Starlette вызывает задачу как обычную корутину (async) или в executor (sync).

ПЛЮСЫ:
  + Встроен в FastAPI, не нужны зависимости
  + Простота: add_task() и готово
  + Задача привязана к запросу — удобно передавать request.state
  + Подходит для лёгких операций: логи, метрики, инвалидация кэша

МИНУСЫ:
  - Нет retry: если задача упала — она потеряна навсегда
  - Нет очереди: при перезапуске все задачи теряются
  - Нет мониторинга: нельзя увидеть статус задачи
  - Блокирует shutdown: uvicorn ждёт завершения всех background tasks
  - Не подходит для тяжёлых операций (> 1-2 секунды)

Сценарии: логирование аудита, обновление кэша, простые webhooks.
"""
import logging

from fastapi import APIRouter, BackgroundTasks

from .email import EmailMessage, send_email_async

logger = logging.getLogger(__name__)
router = APIRouter()


async def send_welcome_email_bg(user_id: int, email: str) -> None:
    """Background функция. Ошибки здесь не влияют на ответ клиенту."""
    try:
        msg = EmailMessage(
            to=email,
            subject="Добро пожаловать!",
            body=f"Привет! Ваш аккаунт #{user_id} создан.",
        )
        await send_email_async(msg)
    except Exception as exc:
        # Логируем, но не поднимаем — задача уже завершена, ответ отправлен
        logger.error("Background email failed for user %s: %s", user_id, exc)


@router.post("/register/bg")
async def register_with_background_task(
    email: str,
    background_tasks: BackgroundTasks,
):
    """
    1. Создаём пользователя (быстро)
    2. Отвечаем клиенту 201
    3. После ответа: запускаем send_welcome_email_bg
    """
    user_id = 42  # имитация создания пользователя

    # Задача добавляется в очередь, выполняется ПОСЛЕ send() response
    background_tasks.add_task(send_welcome_email_bg, user_id, email)

    return {"user_id": user_id, "status": "created"}`,
      },
      {
        filename: "app/notifications/approach2_create_task.py",
        code: `"""
Подход 2: asyncio.create_task

Механизм: создаёт Task в текущем event loop. Выполняется параллельно
с основным handler-ом, не ждёт завершения запроса.

ПЛЮСЫ:
  + Полный контроль: можно отменить, ждать результата, передавать значения
  + Запускается немедленно, не ждёт завершения ответа
  + Можно передать callback на завершение (add_done_callback)

МИНУСЫ:
  - «Fire and forget» проблема: если не хранить ссылку на Task,
    GC может его удалить до завершения
  - Нет retry, нет персистентности
  - При краше воркера — задача теряется
  - Сложнее отлаживать, чем BackgroundTasks

Сценарии: инвалидация кэша, pub/sub уведомления, WebSocket push.
"""
import asyncio
import logging
import weakref

from fastapi import APIRouter

from .email import EmailMessage, send_email_async

logger = logging.getLogger(__name__)
router = APIRouter()

# Храним ссылки на задачи — иначе GC может удалить их до завершения.
# weakref не мешает GC, но позволяет отслеживать «живые» задачи.
_background_tasks: set[asyncio.Task] = set()


def create_tracked_task(coro) -> asyncio.Task:
    """
    Создаёт Task и отслеживает его до завершения.
    При завершении — удаляет из набора и логирует ошибку если была.
    """
    task = asyncio.create_task(coro)
    _background_tasks.add(task)

    def on_done(t: asyncio.Task):
        _background_tasks.discard(t)
        if not t.cancelled() and (exc := t.exception()):
            logger.error("Background task failed: %s", exc, exc_info=exc)

    task.add_done_callback(on_done)
    return task


@router.post("/register/task")
async def register_with_create_task(email: str):
    """
    create_task запускается немедленно, параллельно с остатком handler-а.
    Ответ отправляется не дожидаясь завершения задачи.
    """
    user_id = 42

    msg = EmailMessage(
        to=email,
        subject="Добро пожаловать!",
        body=f"Аккаунт #{user_id} создан.",
    )

    # Задача запускается сразу, handler продолжает выполнение
    create_tracked_task(send_email_async(msg))

    return {"user_id": user_id, "status": "created"}


@router.get("/tasks/active")
async def get_active_tasks():
    """Мониторинг активных background tasks."""
    return {"active_tasks": len(_background_tasks)}`,
      },
      {
        filename: "app/notifications/approach3_arq.py",
        code: `"""
Подход 3: ARQ (Async Redis Queue)

Механизм: задача сериализуется и кладётся в Redis. Отдельный worker
процесс читает очередь и выполняет задачи.

pip install arq

ПЛЮСЫ:
  + Retry с экспоненциальным backoff при ошибках
  + Персистентность: задачи сохраняются при перезапуске
  + Мониторинг: arq dashboard, статус каждой задачи
  + Отложенное выполнение: defer_by, run_at
  + Дедупликация задач (unique)
  + Масштабирование: несколько worker-процессов

МИНУСЫ:
  - Требует Redis
  - Отдельный процесс worker-а
  - Нельзя вернуть результат в HTTP-ответе напрямую

Сценарии: email, SMS, генерация отчётов, resize изображений,
          интеграции с внешними API, всё что может упасть и требует retry.
"""
import logging

from arq import ArqRedis, create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Request

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Определения задач (выполняются в worker-процессе)
# ---------------------------------------------------------------------------

async def send_welcome_email_task(ctx: dict, user_id: int, email: str) -> str:
    """
    ARQ-задача. ctx содержит resources (redis, db) инициализированные в worker.
    Если функция бросает исключение — ARQ повторяет с backoff.
    """
    from .email import EmailMessage, send_email_async
    msg = EmailMessage(
        to=email,
        subject="Добро пожаловать!",
        body=f"Аккаунт #{user_id} создан.",
    )
    await send_email_async(msg)
    logger.info("Welcome email sent to %s (attempt %d)", email, ctx.get("job_try", 1))
    return f"Email sent to {email}"


async def send_order_confirmation_task(ctx: dict, order_id: int, email: str) -> str:
    """Подтверждение заказа с вложением PDF."""
    from .email import EmailMessage, send_email_async
    msg = EmailMessage(
        to=email,
        subject=f"Заказ #{order_id} подтверждён",
        body=f"Ваш заказ #{order_id} принят и передан в обработку.",
    )
    await send_email_async(msg)
    return f"Order confirmation sent for order {order_id}"


# ---------------------------------------------------------------------------
# Конфигурация worker-а
# ---------------------------------------------------------------------------

class WorkerSettings:
    """Настройки ARQ worker-а."""
    functions = [send_welcome_email_task, send_order_confirmation_task]
    redis_settings = RedisSettings(host="localhost", port=6379)

    # Retry конфигурация
    max_tries = 3
    # Задача считается зависшей если выполняется дольше 5 минут
    job_timeout = 300

    # Жизненный цикл worker-а
    async def on_startup(ctx: dict):
        """Инициализация ресурсов при старте worker."""
        logger.info("ARQ worker starting up")
        # ctx["db"] = await create_db_pool()

    async def on_shutdown(ctx: dict):
        """Освобождение ресурсов при остановке."""
        logger.info("ARQ worker shutting down")


# ---------------------------------------------------------------------------
# Постановка задач из FastAPI (producer side)
# ---------------------------------------------------------------------------

@router.post("/register/arq")
async def register_with_arq(email: str, request: Request):
    """
    Кладём задачу в Redis. Worker подхватит её асинхронно.
    Ответ клиенту — мгновенный, независимо от скорости SMTP.
    """
    user_id = 42
    arq_pool: ArqRedis = request.app.state.arq_pool

    job = await arq_pool.enqueue_job(
        "send_welcome_email_task",
        user_id,
        email,
        # Опции:
        # _defer_by=timedelta(minutes=5),   # отложить на 5 минут
        # _job_id=f"welcome:{user_id}",     # дедупликация по ID
        # _expires=timedelta(hours=24),     # не выполнять если устарела
    )

    return {
        "user_id":  user_id,
        "status":   "created",
        "job_id":   job.job_id,
        "note":     "Email will be sent by background worker",
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, request: Request):
    """Статус задачи по ID."""
    arq_pool: ArqRedis = request.app.state.arq_pool
    job = await arq_pool.job(job_id)
    if job is None:
        return {"status": "not_found"}
    info = await job.info()
    return {
        "job_id":      job_id,
        "status":      info.status if info else "unknown",
        "enqueue_time": str(info.enqueue_time) if info else None,
    }`,
      },
      {
        filename: "comparison_table.md",
        code: `# Сравнение подходов к фоновым задачам

| Критерий           | BackgroundTasks | asyncio.create_task | ARQ / Celery      |
|--------------------|-----------------|---------------------|-------------------|
| Зависимости        | нет             | нет                 | Redis + worker    |
| Retry при ошибке   | нет             | нет                 | да (настраиваем)  |
| Персистентность    | нет             | нет                 | да (Redis)        |
| Мониторинг         | нет             | базовый             | dashboard         |
| Отложенный старт   | нет             | нет                 | да                |
| Масштабирование    | нет             | нет                 | да (N workers)    |
| Дедупликация       | нет             | нет                 | да (job_id)       |
| Сложность          | минимальная     | низкая              | средняя           |

## Когда использовать

**BackgroundTasks:**
- Логирование аудита
- Инвалидация кэша
- Обновление счётчиков
- Быстрые webhook-уведомления (< 1 сек)

**asyncio.create_task:**
- WebSocket push-уведомления
- Pub/sub события
- Параллельные вычисления в рамках запроса
- Инициализация ресурсов без блокировки

**ARQ / Celery:**
- Email / SMS отправка
- Генерация PDF/отчётов
- Resize/обработка изображений
- Интеграции с платёжными системами
- Любые задачи с retry и мониторингом`,
      },
    ],
    explanation: `**BackgroundTasks** — самый простой вариант. Starlette вызывает задачи в том же event loop после отправки ответа. Идеален для быстрых, некритичных операций. Главное ограничение: нет retry. Если SMTP упал — письмо потеряно навсегда. При перезапуске сервера — все задачи теряются.

**\`asyncio.create_task\`** запускает корутину немедленно, параллельно с текущим handler-ом. Важно хранить ссылку на Task в \`set\`: сборщик мусора Python удаляет объекты без ссылок, включая незавершённые задачи. \`add_done_callback\` позволяет логировать ошибки и чистить набор. Так же нет retry и персистентности.

**ARQ (Async Redis Queue)** — правильное решение для production. Задача сериализуется в Redis при вызове \`enqueue_job()\` — это занимает миллисекунды. Worker-процесс читает очередь и выполняет задачи независимо от API. Если worker упал во время выполнения — задача останется в Redis и будет выполнена при перезапуске. Retry с настраиваемым backoff: при ошибке ARQ повторит попытку через 5, 25, 125 секунд (экспоненциально).

**Lifespan для ARQ pool**: пул соединений к Redis для ARQ инициализируется в lifespan: \`app.state.arq_pool = await create_pool(RedisSettings(...))\`. Handler получает пул через \`request.app.state.arq_pool\` и ставит задачи в очередь без создания нового соединения на каждый запрос.

**Дедупликация через \`_job_id\`**: \`arq_pool.enqueue_job("task", _job_id=f"welcome:{user_id}")\` — если задача с таким ID уже в очереди, повторная постановка игнорируется. Защищает от дублей при ретраях на стороне клиента.

**Выбор**: BackgroundTasks → простота и скорость. create_task → параллельность внутри запроса. ARQ → всё что может упасть, требует retry или мониторинга.`,
  },

  {
    id: "websockets-realtime",
    title: "WebSockets и real-time функциональность",
    task: "Реализуйте real-time чат с использованием FastAPI WebSockets. Требования: комнаты (rooms) с изоляцией сообщений, broadcast в пределах комнаты, personal messages, аутентификация через JWT при handshake, обработка disconnect и reconnect, horizontal scaling через Redis Pub/Sub. Реализуйте ConnectionManager с правильным lifecycle управлением.",
    files: [
      {
        filename: "app/ws/connection_manager.py",
        code: `"""
ConnectionManager — управление WebSocket-соединениями.

Структура:
  rooms: dict[room_id, set[WebSocket]]  — соединения по комнатам
  user_connections: dict[user_id, set[WebSocket]]  — соединения по пользователям
  (один пользователь может иметь несколько вкладок/устройств)

Single-process: ConnectionManager хранит состояние в памяти.
Multi-process:  используйте Redis Pub/Sub (см. connection_manager_redis.py).
"""
import asyncio
import json
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


@dataclass
class ConnectedUser:
    user_id: int
    username: str
    room_id: str
    websocket: WebSocket
    connected_at: datetime = field(default_factory=datetime.utcnow)


class ConnectionManager:
    """
    Потокобезопасный (в рамках одного event loop) менеджер соединений.

    Используется как синглтон на уровне приложения (app.state.ws_manager).
    """

    def __init__(self):
        # room_id → set of websockets
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)
        # user_id → set of websockets (несколько вкладок)
        self._user_connections: dict[int, set[WebSocket]] = defaultdict(set)
        # websocket → ConnectedUser (метаданные соединения)
        self._connections: dict[WebSocket, ConnectedUser] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user_id: int,
        username: str,
        room_id: str,
    ) -> None:
        """Принимает соединение и регистрирует его во всех индексах."""
        await websocket.accept()

        user = ConnectedUser(
            user_id=user_id,
            username=username,
            room_id=room_id,
            websocket=websocket,
        )
        self._connections[websocket] = user
        self._rooms[room_id].add(websocket)
        self._user_connections[user_id].add(websocket)

        logger.info("User %s (%d) connected to room %s", username, user_id, room_id)

        # Оповещаем других в комнате
        await self.broadcast_to_room(
            room_id=room_id,
            message={"type": "user_joined", "user": username, "user_id": user_id},
            exclude=websocket,
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        """Удаляет соединение из всех индексов при разрыве."""
        user = self._connections.pop(websocket, None)
        if user is None:
            return

        self._rooms[user.room_id].discard(websocket)
        if not self._rooms[user.room_id]:
            del self._rooms[user.room_id]  # чистим пустые комнаты

        self._user_connections[user.user_id].discard(websocket)
        if not self._user_connections[user.user_id]:
            del self._user_connections[user.user_id]

        logger.info("User %s (%d) disconnected from room %s",
                    user.username, user.user_id, user.room_id)

        # Оповещаем оставшихся в комнате
        if user.room_id in self._rooms:
            await self.broadcast_to_room(
                room_id=user.room_id,
                message={"type": "user_left", "user": user.username, "user_id": user.user_id},
            )

    async def broadcast_to_room(
        self,
        room_id: str,
        message: dict,
        exclude: WebSocket | None = None,
    ) -> None:
        """
        Отправляет сообщение всем в комнате.
        При ошибке отправки — закрываем соединение (оно уже разорвано).
        """
        if room_id not in self._rooms:
            return

        payload = json.dumps(message, ensure_ascii=False, default=str)
        # Копируем set — disconnect может изменить его во время итерации
        connections = list(self._rooms[room_id])

        results = await asyncio.gather(
            *[ws.send_text(payload) for ws in connections if ws != exclude],
            return_exceptions=True,
        )

        # Закрываем упавшие соединения
        for ws, result in zip(
            [ws for ws in connections if ws != exclude], results
        ):
            if isinstance(result, Exception):
                logger.warning("Failed to send to %s: %s", ws, result)
                await self.disconnect(ws)

    async def send_to_user(self, user_id: int, message: dict) -> int:
        """
        Личное сообщение пользователю на все его устройства/вкладки.
        Возвращает количество успешно доставленных сообщений.
        """
        connections = list(self._user_connections.get(user_id, set()))
        if not connections:
            return 0

        payload = json.dumps(message, ensure_ascii=False, default=str)
        results = await asyncio.gather(
            *[ws.send_text(payload) for ws in connections],
            return_exceptions=True,
        )
        success = sum(1 for r in results if not isinstance(r, Exception))
        return success

    def get_room_users(self, room_id: str) -> list[dict]:
        """Список пользователей в комнате."""
        return [
            {
                "user_id":   self._connections[ws].user_id,
                "username":  self._connections[ws].username,
                "connected_at": self._connections[ws].connected_at.isoformat(),
            }
            for ws in self._rooms.get(room_id, set())
            if ws in self._connections
        ]

    def stats(self) -> dict:
        return {
            "total_connections": len(self._connections),
            "rooms":             len(self._rooms),
            "users_online":      len(self._user_connections),
        }`,
      },
      {
        filename: "app/ws/auth.py",
        code: `"""
JWT-аутентификация при WebSocket handshake.

Проблема: WebSocket не поддерживает кастомные заголовки из браузера.
Клиент не может передать Authorization: Bearer <token>.

Решения (от лучшего к худшему):
  1. token в query параметре:  ws://host/ws?token=eyJ...  ← используем здесь
  2. subprotocol:              Sec-WebSocket-Protocol: token.eyJ...
  3. Первое сообщение:         {"type": "auth", "token": "eyJ..."}

Вариант 1 прост, но токен попадает в access log сервера.
В production используйте одноразовый short-lived WS-токен:
  POST /ws-token → {"ws_token": "uuid", "expires_in": 30}
  ws://host/ws?token=uuid
ws_token привязан к user_id в Redis (TTL 30 секунд).
"""
import logging
from typing import Annotated

import jwt
from fastapi import Query, WebSocket, WebSocketException
from starlette.status import WS_1008_POLICY_VIOLATION

logger = logging.getLogger(__name__)

SECRET_KEY = "your-secret-key"  # из settings в реальном проекте
ALGORITHM = "HS256"


async def get_ws_user(
    websocket: WebSocket,
    token: Annotated[str | None, Query()] = None,
) -> dict:
    """
    Dependency для WebSocket: извлекает и валидирует JWT из ?token=...

    WebSocketException с WS_1008_POLICY_VIOLATION закрывает соединение
    с кодом 1008 (Policy Violation) — стандартный код для auth ошибок.
    """
    if token is None:
        raise WebSocketException(
            code=WS_1008_POLICY_VIOLATION,
            reason="Missing token",
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        username = payload.get("username", "anonymous")

        if user_id is None:
            raise ValueError("Missing sub claim")

        return {"user_id": int(user_id), "username": username}

    except jwt.ExpiredSignatureError:
        raise WebSocketException(
            code=WS_1008_POLICY_VIOLATION,
            reason="Token expired",
        )
    except (jwt.InvalidTokenError, ValueError) as exc:
        logger.warning("Invalid WS token: %s", exc)
        raise WebSocketException(
            code=WS_1008_POLICY_VIOLATION,
            reason="Invalid token",
        )`,
      },
      {
        filename: "app/ws/router.py",
        code: `"""
WebSocket endpoint с комнатами, аутентификацией и lifecycle.
"""
import asyncio
import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect

from .auth import get_ws_user
from .connection_manager import ConnectionManager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: str,
    request: Request,
    user: Annotated[dict, Depends(get_ws_user)],
):
    """
    Точка входа WebSocket-чата.

    Lifecycle:
      1. Dependency get_ws_user валидирует JWT (до accept())
         При ошибке — WebSocketException закрывает соединение с 1008
      2. manager.connect() — accept() + регистрация + broadcast о входе
      3. Цикл приёма сообщений
      4. WebSocketDisconnect — disconnect() + broadcast о выходе

    Клиент подключается:
      ws://host/ws/general?token=eyJhbGc...
    """
    manager: ConnectionManager = request.app.state.ws_manager

    await manager.connect(
        websocket=websocket,
        user_id=user["user_id"],
        username=user["username"],
        room_id=room_id,
    )

    try:
        while True:
            # receive_json() ждёт следующего сообщения
            # При разрыве — бросает WebSocketDisconnect
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = data.get("type", "message")

            if msg_type == "message":
                # Публичное сообщение в комнату
                await manager.broadcast_to_room(
                    room_id=room_id,
                    message={
                        "type":      "message",
                        "from":      user["username"],
                        "user_id":   user["user_id"],
                        "text":      data.get("text", ""),
                        "room":      room_id,
                    },
                )

            elif msg_type == "private":
                # Личное сообщение конкретному пользователю
                target_id = data.get("to_user_id")
                if target_id:
                    delivered = await manager.send_to_user(
                        user_id=int(target_id),
                        message={
                            "type":    "private",
                            "from":    user["username"],
                            "user_id": user["user_id"],
                            "text":    data.get("text", ""),
                        },
                    )
                    # Подтверждение отправителю
                    await websocket.send_json({
                        "type":      "private_sent",
                        "to":        target_id,
                        "delivered": delivered,
                    })

            elif msg_type == "ping":
                # Клиентский ping для поддержания соединения
                await websocket.send_json({"type": "pong"})

            elif msg_type == "room_users":
                # Список пользователей в комнате
                await websocket.send_json({
                    "type":  "room_users",
                    "users": manager.get_room_users(room_id),
                })

    except WebSocketDisconnect as exc:
        logger.info("WebSocket disconnected: code=%s", exc.code)
        await manager.disconnect(websocket)

    except Exception as exc:
        logger.error("WebSocket error: %s", exc, exc_info=True)
        await manager.disconnect(websocket)


@router.get("/ws/stats")
async def ws_stats(request: Request):
    manager: ConnectionManager = request.app.state.ws_manager
    return manager.stats()`,
      },
      {
        filename: "app/ws/connection_manager_redis.py",
        code: `"""
ConnectionManager с Redis Pub/Sub для horizontal scaling.

Проблема: несколько uvicorn воркеров (или pod-ов в k8s) имеют
независимые ConnectionManager-ы в памяти.
Сообщение приходит на воркер A — клиент подключён к воркеру B — не доставлено.

Решение: Redis Pub/Sub как шина сообщений между воркерами.

  Воркер A получает сообщение → публикует в Redis channel room:{room_id}
  Воркер B подписан на channel → получает → рассылает своим клиентам

pip install redis[hiredis]
"""
import asyncio
import json
import logging

import redis.asyncio as aioredis
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class RedisConnectionManager:
    """
    ConnectionManager с Redis Pub/Sub.
    Локальные соединения хранятся в памяти воркера.
    Межпроцессная доставка — через Redis.
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self._redis_url = redis_url
        self._pub: aioredis.Redis | None = None   # для публикации
        self._sub: aioredis.Redis | None = None   # для подписки
        self._local_rooms: dict[str, set[WebSocket]] = {}
        self._listener_task: asyncio.Task | None = None

    async def startup(self) -> None:
        """Вызывается в lifespan при старте."""
        self._pub = await aioredis.from_url(self._redis_url, decode_responses=True)
        self._sub = await aioredis.from_url(self._redis_url, decode_responses=True)
        # Запускаем фоновый listener, который читает сообщения из Redis
        self._listener_task = asyncio.create_task(self._redis_listener())
        logger.info("RedisConnectionManager started")

    async def shutdown(self) -> None:
        """Вызывается в lifespan при остановке."""
        if self._listener_task:
            self._listener_task.cancel()
        if self._pub:
            await self._pub.aclose()
        if self._sub:
            await self._sub.aclose()

    async def connect(self, websocket: WebSocket, room_id: str) -> None:
        await websocket.accept()
        if room_id not in self._local_rooms:
            self._local_rooms[room_id] = set()
            # Подписываемся на Redis channel для этой комнаты
            await self._sub.subscribe(f"room:{room_id}")
        self._local_rooms[room_id].add(websocket)

    async def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        if room_id in self._local_rooms:
            self._local_rooms[room_id].discard(websocket)
            if not self._local_rooms[room_id]:
                del self._local_rooms[room_id]
                # Отписываемся если комната пуста на этом воркере
                await self._sub.unsubscribe(f"room:{room_id}")

    async def broadcast_to_room(self, room_id: str, message: dict) -> None:
        """
        Публикует сообщение в Redis channel.
        ВСЕ воркеры, подписанные на channel, получат его и доставят своим клиентам.
        """
        if self._pub:
            await self._pub.publish(
                f"room:{room_id}",
                json.dumps(message, ensure_ascii=False, default=str),
            )

    async def _redis_listener(self) -> None:
        """
        Фоновая задача: читает сообщения из Redis Pub/Sub
        и доставляет локальным клиентам этого воркера.
        """
        if not self._sub:
            return
        try:
            async for message in self._sub.listen():
                if message["type"] != "message":
                    continue
                # channel: "room:general" → room_id: "general"
                channel: str = message["channel"]
                room_id = channel.removeprefix("room:")
                data = json.loads(message["data"])

                if room_id in self._local_rooms:
                    # Доставляем только локальным клиентам этого воркера
                    await asyncio.gather(
                        *[ws.send_json(data)
                          for ws in list(self._local_rooms[room_id])],
                        return_exceptions=True,
                    )
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Redis listener error: %s", exc, exc_info=True)`,
      },
    ],
    explanation: `**WebSocket handshake и JWT**: браузер не может добавить кастомный заголовок \`Authorization\` при WebSocket-соединении — ограничение спецификации. Токен передаётся в query параметре: \`ws://host/ws/room?token=eyJ...\`. Dependency \`get_ws_user\` вызывается до \`accept()\`: если токен невалидный — соединение закрывается с кодом 1008 (Policy Violation), без открытия WebSocket сессии. В production используйте одноразовый WS-токен с TTL 30 секунд из Redis — тогда JWT не попадает в access logs.

**\`WebSocketDisconnect\`** — нормальное событие, не ошибка. Клиент закрыл вкладку, потерял сеть, нажал F5. Всегда оборачивайте цикл \`receive_text()\` в \`try/except WebSocketDisconnect\`: без этого — необработанное исключение и соединение остаётся в индексах менеджера (memory leak).

**\`asyncio.gather(return_exceptions=True)\`** в broadcast: один клиент с разорванным соединением не должен останавливать доставку остальным. \`return_exceptions=True\` собирает все ошибки, затем разрываем упавшие соединения.

**Копирование set перед итерацией**: \`list(self._rooms[room_id])\` — обязательно. \`disconnect()\` может изменить set во время broadcast (например, через \`gather\`). Итерация по изменяющемуся set → \`RuntimeError: Set changed size during iteration\`.

**Horizontal scaling и Redis Pub/Sub**: в single-process всё хранится в памяти одного воркера. При запуске нескольких воркеров (uvicorn workers, k8s replicas) — клиент A на воркере 1, клиент B на воркере 2, сообщение от A не доходит до B. Redis Pub/Sub — шина: воркер публикует в channel, все воркеры-подписчики получают и доставляют своим локальным клиентам. Фоновая задача \`_redis_listener\` читает канал в цикле и вызывается из lifespan.`,
  },

  {
    id: "server-sent-events",
    title: "Server-Sent Events (SSE)",
    task: "Реализуйте endpoint для Server-Sent Events: стриминг статуса долгой операции (импорт файла), push-уведомления для конкретного пользователя, heartbeat для поддержания соединения, корректное закрытие соединения при disconnect клиента. Используйте StreamingResponse с text/event-stream. Сравните SSE с WebSocket: когда что применять.",
    files: [
      {
        filename: "app/sse/router.py",
        code: `"""
Server-Sent Events (SSE) в FastAPI.

Протокол SSE — text/event-stream:
  data: {"type": "progress", "value": 42}\\n\\n
  event: custom_event\\n
  data: payload\\n\\n
  id: 123\\n
  data: payload\\n\\n
  : heartbeat comment\\n\\n

Браузер: EventSource API (автоматический reconnect встроен).
Python: sse-starlette или StreamingResponse вручную.

pip install sse-starlette
"""
import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Хранилище задач (в реальном проекте — Redis или БД)
# ---------------------------------------------------------------------------

_task_progress: dict[str, dict] = {}

# user_id → список asyncio.Queue для push-уведомлений
# Один пользователь может иметь несколько SSE-соединений (вкладки)
_user_queues: dict[int, list[asyncio.Queue]] = defaultdict(list)


def format_sse(data: dict, event: str | None = None, id: str | None = None) -> str:
    """
    Форматирует словарь в строку SSE-протокола.

    Формат:
      event: {event}\\n    (опционально)
      id: {id}\\n          (опционально, для Last-Event-ID при reconnect)
      data: {json}\\n
      \\n                  (пустая строка = конец события)
    """
    lines = []
    if event:
        lines.append(f"event: {event}")
    if id:
        lines.append(f"id: {id}")
    lines.append(f"data: {json.dumps(data, ensure_ascii=False, default=str)}")
    lines.append("")   # пустая строка = конец события
    return "\\n".join(lines) + "\\n"


# ---------------------------------------------------------------------------
# Endpoint 1: Прогресс долгой операции (импорт файла)
# ---------------------------------------------------------------------------

async def simulate_file_import(task_id: str) -> None:
    """
    Имитирует поэтапный импорт файла.
    В реальном проекте это background task или Celery worker.
    """
    steps = [
        (10,  "Загрузка файла"),
        (25,  "Валидация структуры"),
        (40,  "Парсинг строк"),
        (60,  "Обогащение данными"),
        (80,  "Запись в БД"),
        (95,  "Индексирование"),
        (100, "Завершено"),
    ]
    _task_progress[task_id] = {"status": "running", "progress": 0, "message": "Старт"}

    for progress, message in steps:
        await asyncio.sleep(1.0)  # имитация работы
        _task_progress[task_id] = {
            "status":   "running" if progress < 100 else "done",
            "progress": progress,
            "message":  message,
        }

    logger.info("Task %s completed", task_id)


@router.post("/import/start")
async def start_import(filename: str) -> dict:
    """Запускает задачу импорта, возвращает task_id для SSE-стриминга."""
    import uuid
    task_id = str(uuid.uuid4())
    # Запускаем в фоне — клиент следит за прогрессом через SSE
    asyncio.create_task(simulate_file_import(task_id))
    return {"task_id": task_id}


@router.get("/import/{task_id}/progress")
async def stream_import_progress(task_id: str, request: Request):
    """
    SSE endpoint: стримит прогресс задачи импорта.

    Клиент (JS):
      const source = new EventSource('/import/{task_id}/progress');
      source.onmessage = e => console.log(JSON.parse(e.data));
      source.addEventListener('done', () => source.close());
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        last_progress = -1

        # Heartbeat каждые 15 секунд — nginx/proxies закрывают idle соединения
        # SSE-комментарий (: ...) не триггерит onmessage у клиента
        heartbeat_interval = 15
        last_heartbeat = asyncio.get_event_loop().time()

        while True:
            # Проверяем, не закрыл ли клиент соединение
            if await request.is_disconnected():
                logger.info("Client disconnected from task %s", task_id)
                break

            now = asyncio.get_event_loop().time()

            # Heartbeat comment
            if now - last_heartbeat >= heartbeat_interval:
                yield ": heartbeat\\n\\n"
                last_heartbeat = now

            task = _task_progress.get(task_id)
            if task is None:
                yield format_sse({"error": "Task not found"}, event="error")
                break

            # Отправляем только если прогресс изменился
            if task["progress"] != last_progress:
                last_progress = task["progress"]
                yield format_sse(task, id=str(task["progress"]))

                # Задача завершена — отправляем финальное событие и закрываем
                if task["status"] == "done":
                    yield format_sse({"task_id": task_id}, event="done")
                    break

            await asyncio.sleep(0.5)  # опрос каждые 500ms

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",  # отключает буферизацию в nginx
        },
    )


# ---------------------------------------------------------------------------
# Endpoint 2: Push-уведомления конкретному пользователю (sse-starlette)
# ---------------------------------------------------------------------------

@router.get("/notifications/stream")
async def stream_notifications(request: Request, user_id: int):
    """
    Персональный SSE-канал для push-уведомлений.
    Использует sse-starlette — обрабатывает reconnect, Last-Event-ID.

    Соединение живёт, пока клиент не закроет EventSource.
    Уведомления доставляются через asyncio.Queue.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _user_queues[user_id].append(queue)
    logger.info("User %d connected to notifications SSE", user_id)

    async def event_generator():
        try:
            while True:
                # Ждём уведомление с таймаутом (heartbeat)
                try:
                    notification = await asyncio.wait_for(
                        queue.get(), timeout=20.0
                    )
                    yield {
                        "event": notification.get("type", "notification"),
                        "data":  json.dumps(notification, ensure_ascii=False),
                    }
                except asyncio.TimeoutError:
                    # Heartbeat — пустое событие для поддержания соединения
                    yield {"event": "ping", "data": ""}

        except asyncio.CancelledError:
            # Клиент закрыл соединение — sse-starlette отменяет генератор
            pass
        finally:
            # Гарантированно убираем очередь при любом завершении
            _user_queues[user_id].remove(queue)
            logger.info("User %d disconnected from notifications SSE", user_id)

    return EventSourceResponse(event_generator())


@router.post("/notifications/push/{user_id}")
async def push_notification(user_id: int, message: str, event_type: str = "info"):
    """
    Отправляет уведомление конкретному пользователю через все его SSE-соединения.
    Вызывается внутри сервиса (например, из Celery worker через API).
    """
    queues = _user_queues.get(user_id, [])
    if not queues:
        return {"delivered": 0, "note": "User has no active SSE connections"}

    notification = {
        "type":      event_type,
        "message":   message,
        "timestamp": datetime.utcnow().isoformat(),
    }

    delivered = 0
    for q in queues:
        try:
            q.put_nowait(notification)  # не блокируем, очередь ограничена
            delivered += 1
        except asyncio.QueueFull:
            logger.warning("Notification queue full for user %d", user_id)

    return {"delivered": delivered, "total_connections": len(queues)}`,
      },
      {
        filename: "app/sse/comparison.md",
        code: `# SSE vs WebSocket: когда что применять

## Server-Sent Events (SSE)

**Однонаправленный канал**: сервер → клиент.
Браузер использует встроенный EventSource API.
HTTP/1.1 + HTTP/2 (мультиплексирование из коробки).
Автоматический reconnect браузера (с Last-Event-ID).
Работает через любые HTTP-прокси без настройки.

### Применять когда:
- Live dashboard: метрики, графики (только отображение)
- Прогресс долгих операций: импорт, экспорт, генерация
- Push-уведомления: алерты, системные события
- Live feed: новости, биржевые котировки (только чтение)
- Логи в реальном времени

### Не применять когда:
- Нужна двусторонняя связь (чат, игры)
- Клиент отправляет данные часто
- Бинарные данные (изображения, файлы)

## WebSocket

**Двунаправленный канал**: сервер ↔ клиент.
Отдельный протокол (ws:// / wss://).
Низкая задержка, меньший overhead на сообщение.
Бинарные фреймы (images, protobuf, msgpack).

### Применять когда:
- Чат: пользователи отправляют и получают сообщения
- Совместное редактирование: Google Docs-like (OT, CRDT)
- Онлайн-игры: частые обновления позиций, событий
- Голосовые/видео сигналинг (WebRTC negotiation)
- Биржевой терминал: клиент отправляет заявки

### Не применять когда:
- Только сервер→клиент: SSE проще и надёжнее
- Нужен reconnect без кода: SSE делает это бесплатно

## Сводная таблица

| Критерий              | SSE                    | WebSocket              |
|-----------------------|------------------------|------------------------|
| Направление           | сервер → клиент        | двустороннее           |
| Протокол              | HTTP                   | ws:// (upgrade)        |
| Reconnect             | автоматический         | ручной                 |
| HTTP/2 мультиплекс    | да                     | нет (отдельное TCP)    |
| Прокси/firewall       | работает везде         | может блокироваться    |
| Бинарные данные       | нет                    | да                     |
| Сложность реализации  | низкая                 | средняя                |
| Браузерная поддержка  | все (кроме IE)         | все современные        |`,
      },
    ],
    explanation: `**Формат SSE**: каждое событие — одна или несколько строк, разделённых \`\\n\\n\`. Поля: \`data:\` (обязательное), \`event:\` (имя события — клиент слушает через \`addEventListener\`), \`id:\` (Last-Event-ID для reconnect), \`:\` (комментарий, heartbeat). Пустая строка завершает событие. Клиент: \`new EventSource('/endpoint')\` — автоматически reconnects.

**\`request.is_disconnected()\`** — ключ к корректному закрытию. Без проверки генератор работает вечно после того, как клиент закрыл вкладку. Проверяйте в каждой итерации цикла: если \`True\` — выходим из генератора, Starlette закрывает response.

**Heartbeat**: nginx, AWS ALB и другие прокси закрывают idle HTTP-соединения через 60-300 секунд. SSE-комментарий (\`: heartbeat\\n\\n\`) не триггерит \`onmessage\` у клиента, но держит TCP-соединение живым. Отправляйте каждые 15-30 секунд.

**\`X-Accel-Buffering: no\`**: nginx по умолчанию буферизует ответы, собирая их целиком перед отправкой клиенту. Для SSE это ломает стриминг — клиент получает все события разом в конце. Заголовок отключает буферизацию для конкретного response.

**asyncio.Queue для push-уведомлений**: SSE-соединение ждёт в \`await queue.get()\`, освобождая event loop. Когда другой endpoint вызывает \`queue.put_nowait(notification)\` — уведомление мгновенно попадает к клиенту. Один пользователь может иметь несколько SSE-соединений (разные вкладки) — храним список очередей. \`finally\` в генераторе гарантирует удаление очереди при disconnect.

**SSE vs WebSocket**: SSE — HTTP, работает через любой прокси без настройки, браузер reconnects автоматически с \`Last-Event-ID\`. Выбирайте SSE если данные идут только от сервера к клиенту: прогресс, уведомления, live feed. WebSocket — когда клиент тоже отправляет данные: чат, игры, совместное редактирование.`,
  },

  {
    id: "async-sqlalchemy-repository",
    title: "Async SQLAlchemy 2.0 — продвинутые паттерны",
    task: "Реализуйте Repository-паттерн с использованием async SQLAlchemy 2.0. Базовый GenericRepository[T] с CRUD-методами. Специфичные репозитории с кастомными запросами. Управление сессиями через DI (AsyncSession как зависимость). Реализуйте Unit of Work для атомарных операций над несколькими репозиториями. Корректная работа lazy loading в async контексте.",
    files: [
      {
        filename: "app/core/database.py",
        code: `from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# echo=True выводит SQL в stdout — удобно при разработке, отключить в prod
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,        # проверяет соединение перед выдачей из пула
)

# expire_on_commit=False — объекты не инвалидируются после commit.
# Критично для async: нельзя обратиться к атрибуту вне сессии (lazy load упадёт).
async_session_factory = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Depends — выдаёт сессию и гарантирует её закрытие."""
    async with async_session_factory() as session:
        yield session`,
      },
      {
        filename: "app/repositories/base.py",
        code: `from typing import Any, Generic, TypeVar

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

# T — любая SQLAlchemy-модель, наследующая Base
T = TypeVar("T", bound=Base)


class GenericRepository(Generic[T]):
    """
    Базовый репозиторий с типовыми CRUD-операциями.
    Конкретные репозитории наследуют его и добавляют доменные запросы.
    """

    def __init__(self, model: type[T], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    # ── CREATE ──────────────────────────────────────────────────────────────

    async def create(self, **kwargs: Any) -> T:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()   # получаем id до commit, но в той же транзакции
        await self.session.refresh(instance)
        return instance

    async def bulk_create(self, items: list[dict[str, Any]]) -> list[T]:
        instances = [self.model(**item) for item in items]
        self.session.add_all(instances)
        await self.session.flush()
        return instances

    # ── READ ─────────────────────────────────────────────────────────────────

    async def get_by_id(self, id: int) -> T | None:
        return await self.session.get(self.model, id)

    async def get_or_raise(self, id: int) -> T:
        instance = await self.get_by_id(id)
        if instance is None:
            raise ValueError(f"{self.model.__name__} with id={id} not found")
        return instance

    async def get_all(
        self,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> list[T]:
        result = await self.session.execute(
            select(self.model).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    # ── UPDATE ───────────────────────────────────────────────────────────────

    async def update(self, id: int, **kwargs: Any) -> T:
        instance = await self.get_or_raise(id)
        for key, value in kwargs.items():
            setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    # ── DELETE ───────────────────────────────────────────────────────────────

    async def delete(self, id: int) -> bool:
        instance = await self.get_by_id(id)
        if instance is None:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True`,
      },
      {
        filename: "app/models/base.py",
        code: `from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    """Добавляет created_at / updated_at во все наследующие модели."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )`,
      },
      {
        filename: "app/models/shop.py",
        code: `from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))

    # lazy="raise" — SQLAlchemy бросит исключение если попытаться
    # обратиться к orders без явного eager-load. Это защита от N+1:
    # случайный доступ к relationship в async контексте вызвал бы ошибку
    # "MissingGreenlet", а с raise — падаем явно на уровне разработки.
    orders: Mapped[list["Order"]] = relationship(
        back_populates="user",
        lazy="raise",
    )


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(default=0)

    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="product",
        lazy="raise",
    )


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")

    user: Mapped["User"] = relationship(back_populates="orders", lazy="raise")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        lazy="raise",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int]
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order: Mapped["Order"] = relationship(back_populates="items", lazy="raise")
    product: Mapped["Product"] = relationship(back_populates="order_items", lazy="raise")`,
      },
      {
        filename: "app/repositories/user_repository.py",
        code: `from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.shop import User
from app.repositories.base import GenericRepository


class UserRepository(GenericRepository[User]):
    """Доменные запросы для пользователей."""

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_with_orders(self, user_id: int) -> User | None:
        """
        Явный eager load через selectinload.

        selectinload делает отдельный SELECT ... WHERE user_id IN (...)
        — эффективнее joinedload при отношениях один-ко-многим
        (нет дублирования строк пользователя).
        """
        result = await self.session.execute(
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.orders).selectinload(Order.items)
            )
        )
        return result.scalar_one_or_none()

    async def get_active_users(self, *, limit: int = 100) -> list[User]:
        result = await self.session.execute(
            select(User)
            .order_by(User.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())`,
      },
      {
        filename: "app/repositories/order_repository.py",
        code: `from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload

from app.models.shop import Order, OrderItem, Product
from app.repositories.base import GenericRepository


class OrderRepository(GenericRepository[Order]):

    async def get_with_items_and_products(self, order_id: int) -> Order | None:
        """
        joinedload для Order→User (многие-к-одному) +
        selectinload для Order→items→product (один-ко-многим).

        Смешивание стратегий — нормальная практика:
        joinedload хорош для to-one, selectinload для to-many.
        """
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(
                joinedload(Order.user),
                selectinload(Order.items).joinedload(OrderItem.product),
            )
        )
        # unique() нужен когда joinedload может дублировать строки
        return result.unique().scalar_one_or_none()

    async def get_user_orders(
        self,
        user_id: int,
        *,
        status: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .where(Order.user_id == user_id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if status:
            stmt = stmt.where(Order.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_revenue_by_status(self) -> dict[str, Decimal]:
        """Агрегирующий запрос: выручка по статусам заказов."""
        result = await self.session.execute(
            select(
                Order.status,
                func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue"),
            )
            .join(Order.items)
            .group_by(Order.status)
        )
        return {row.status: row.revenue for row in result}`,
      },
      {
        filename: "app/uow.py",
        code: `from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.order_repository import OrderRepository
from app.repositories.user_repository import UserRepository


class UnitOfWork:
    """
    Unit of Work инкапсулирует транзакцию и предоставляет
    единую точку доступа ко всем репозиториям.

    Все репозитории внутри одного UoW разделяют одну AsyncSession —
    гарантия атомарности: либо всё вместе commit, либо rollback.

    Использование:
        async with UnitOfWork(session) as uow:
            user = await uow.users.create(email="a@b.com", name="Alice")
            order = await uow.orders.create(user_id=user.id, status="pending")
            # commit вызывается автоматически при выходе из блока
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def __aenter__(self) -> "UnitOfWork":
        # Репозитории создаются с одной и той же сессией
        self.users = UserRepository(model=User, session=self._session)
        self.orders = OrderRepository(model=Order, session=self._session)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is None:
            await self._session.commit()
        else:
            await self._session.rollback()

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()`,
      },
      {
        filename: "app/services/order_service.py",
        code: `from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shop import Order, OrderItem
from app.repositories.order_repository import OrderRepository
from app.repositories.user_repository import UserRepository
from app.schemas.order import OrderCreateSchema
from app.uow import UnitOfWork


class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_order(
        self,
        user_id: int,
        payload: OrderCreateSchema,
    ) -> Order:
        """
        Атомарная операция: создаём заказ + позиции + списываем остатки.
        Если что-то падает — UoW откатывает всё.
        """
        async with UnitOfWork(self._session) as uow:
            # 1. Проверяем пользователя
            user = await uow.users.get_or_raise(user_id)

            # 2. Создаём заказ
            order = await uow.orders.create(user_id=user.id, status="pending")

            # 3. Добавляем позиции и обновляем остатки
            for item_data in payload.items:
                product = await uow.products.get_or_raise(item_data.product_id)

                if product.stock < item_data.quantity:
                    raise ValueError(
                        f"Not enough stock for product {product.id}: "
                        f"available {product.stock}, requested {item_data.quantity}"
                    )

                await uow.orders.create_item(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=item_data.quantity,
                    unit_price=product.price,
                )

                await uow.products.update(
                    product.id,
                    stock=product.stock - item_data.quantity,
                )

            # __aexit__ вызовет commit автоматически
            return order

    async def get_order_detail(self, order_id: int) -> Order:
        repo = OrderRepository(model=Order, session=self._session)
        order = await repo.get_with_items_and_products(order_id)
        if order is None:
            raise ValueError(f"Order {order_id} not found")
        return order`,
      },
      {
        filename: "app/routers/orders.py",
        code: `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.order import OrderCreateSchema, OrderSchema
from app.services.order_service import OrderService

router = APIRouter()


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    """
    Фабрика сервиса через Depends.
    FastAPI создаёт новый OrderService на каждый запрос,
    передавая ему сессию из get_db (которая живёт ровно один запрос).
    """
    return OrderService(session=db)


@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateSchema,
    user_id: int,                        # в реальном проекте — из JWT
    service: OrderService = Depends(get_order_service),
):
    try:
        order = await service.create_order(user_id=user_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return order


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.get_order_detail(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))`,
      },
    ],
    explanation: `**GenericRepository[T]**: параметризован TypeVar-ом, привязанным к \`Base\`. Это даёт автодополнение и проверку типов — IDE знает, что \`UserRepository.create()\` возвращает \`User\`, а не \`Any\`. Метод \`flush()\` фиксирует изменения в транзакции (генерирует id через RETURNING), но не делает COMMIT — позволяет использовать id созданного объекта в той же транзакции.

**\`expire_on_commit=False\`**: в синхронном SQLAlchemy объекты после \`commit()\` автоматически инвалидируются, и при первом обращении к атрибуту ORM делает lazy SELECT. В async контексте это невозможно — нет "тихого" await. Решение: \`expire_on_commit=False\` — объекты остаются живыми после коммита со своими данными.

**\`lazy="raise"\`**: объявление в модели делает случайный доступ к relationship исключением. Это обнаруживает N+1 на этапе разработки, а не в production. Явно загружайте нужные связи через \`selectinload\` / \`joinedload\` в методах репозитория.

**selectinload vs joinedload**: \`joinedload\` добавляет JOIN в основной запрос — эффективен для to-one связей (не дублирует данные). \`selectinload\` делает отдельный \`WHERE id IN (...)\` — эффективнее для to-many (без декартового произведения строк). Смешивание стратегий — стандартная практика.

**Unit of Work**: все репозитории получают одну \`AsyncSession\`, значит работают в одной транзакции. \`__aexit__\` вызывает \`commit()\` при успехе и \`rollback()\` при исключении. Сервисный слой работает с UoW, не зная о деталях транзакционности — это ответственность UoW.

**DI через Depends**: \`get_db\` как \`AsyncGenerator\` гарантирует \`session.close()\` даже при исключении. Каждый запрос получает свою сессию — изоляция по умолчанию. Сервисы создаются фабриками через \`Depends\`, что упрощает подмену в тестах (\`app.dependency_overrides\`).`,
  },

  {
    id: "alembic-migrations",
    title: "Alembic и управление миграциями",
    task: "Настройте Alembic для async-приложения с несколькими базами данных. Реализуйте: автогенерацию миграций из SQLAlchemy моделей, поддержку data migrations (изменение данных), возможность rollback, multi-database migrations (основная БД + аналитическая), тестирование миграций в CI. Обеспечьте zero-downtime миграции для production.",
    files: [
      {
        filename: "directory_structure.txt",
        code: `project/
├── alembic/
│   ├── env.py                   # точка входа Alembic, async-конфиг
│   ├── script.py.mako           # шаблон новых миграций
│   └── versions/
│       ├── 0001_create_users.py
│       ├── 0002_add_name_to_users.py  # schema migration
│       └── 0003_backfill_slugs.py     # data migration
├── alembic_analytics/           # отдельное дерево для аналитической БД
│   ├── env.py
│   └── versions/
├── alembic.ini                  # основной конфиг
├── alembic_analytics.ini        # конфиг аналитической БД
├── app/
│   ├── core/
│   │   └── database.py
│   └── models/
│       └── ...
└── tests/
    └── test_migrations.py`,
      },
      {
        filename: "alembic.ini",
        code: `[alembic]
# URL переопределяется в env.py из переменной окружения — здесь placeholder
script_location = alembic
prepend_sys_path = .

# Формат имён файлов: дата + rev + slug
file_template = %%(year)d%%(month).2d%%(day).2d_%%(rev)s_%%(slug)s

# Не записывает пустые миграции (когда autogenerate не нашёл изменений)
# Полезно добавить в скрипт генерации

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S`,
      },
      {
        filename: "alembic/env.py",
        code: `import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Импортируем все модели чтобы Base.metadata знала все таблицы.
# Если забыть импорт — autogenerate не увидит таблицу.
from app.models import Base  # noqa: F401  ← вся ORM-иерархия

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """
    Читаем URL из переменной окружения — никаких строк подключения в репозитории.
    DATABASE_URL должен использовать asyncpg-драйвер:
    postgresql+asyncpg://user:pass@host/db
    """
    import os
    url = os.environ["DATABASE_URL"]
    # Alembic 1.x при синхронном run_migrations_offline ожидает sync-URL.
    # При online async-запуске передаём как есть.
    return url


def run_migrations_offline() -> None:
    """
    Offline-режим: генерирует SQL-скрипт без подключения к БД.
    Полезно для code review, аудита, apply вручную.
    Используем sync URL (без +asyncpg) для совместимости.
    """
    url = get_url().replace("+asyncpg", "")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,          # отслеживает изменения типов колонок
        compare_server_default=True, # отслеживает server_default
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Online-режим с async engine."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,   # NullPool для migrations: не держим соединения
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()`,
      },
      {
        filename: "alembic/versions/0001_create_users.py",
        code: `"""create users table

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2024-01-15 10:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")`,
      },
      {
        filename: "alembic/versions/0002_add_slug_to_users.py",
        code: `"""add slug column to users (zero-downtime pattern)

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2024-01-20 12:00:00.000000

Zero-downtime стратегия для добавления NOT NULL колонки:
  Шаг 1 (эта миграция): добавляем колонку как nullable
  Шаг 2 (следующая миграция): backfill данных
  Шаг 3 (после деплоя кода): делаем NOT NULL
  
Деплой кода между шагами 1 и 3 должен уметь работать
как со старой схемой (без slug), так и с новой.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Шаг 1: добавляем nullable — мгновенная операция в PostgreSQL,
    # не блокирует таблицу (в отличие от ADD COLUMN NOT NULL со значением)
    op.add_column(
        "users",
        sa.Column("slug", sa.String(length=255), nullable=True),
    )
    # Индекс создаём CONCURRENTLY — не блокирует чтение/запись во время построения.
    # op.create_index не поддерживает postgresql_concurrently напрямую — используем execute.
    op.execute(
        "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ix_users_slug ON users (slug)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_users_slug")
    op.drop_column("users", "slug")`,
      },
      {
        filename: "alembic/versions/0003_backfill_slugs.py",
        code: `"""backfill slugs for existing users (data migration)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2024-01-21 09:00:00.000000

Data migration: заполняем slug для существующих пользователей.

Ключевые принципы:
- Батчинг: не тащим всю таблицу в память (LIMIT + OFFSET или keyset pagination)
- Идемпотентность: WHERE slug IS NULL — повторный запуск безопасен
- Не используем ORM-модели в миграциях: они могут измениться и сломать старые ревизии
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BATCH_SIZE = 1000


def slugify(value: str) -> str:
    """Упрощённый slugify прямо в миграции — не зависим от внешних пакетов."""
    import re
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def upgrade() -> None:
    conn = op.get_bind()

    # Keyset pagination по id — эффективнее OFFSET на больших таблицах
    last_id = 0
    while True:
        rows = conn.execute(
            text(
                "SELECT id, email FROM users "
                "WHERE slug IS NULL AND id > :last_id "
                "ORDER BY id LIMIT :batch"
            ),
            {"last_id": last_id, "batch": BATCH_SIZE},
        ).fetchall()

        if not rows:
            break

        for row in rows:
            slug = slugify(row.email.split("@")[0])
            # Разрешаем конфликты добавляя id
            conn.execute(
                text("UPDATE users SET slug = :slug WHERE id = :id AND slug IS NULL"),
                {"slug": f"{slug}-{row.id}", "id": row.id},
            )

        last_id = rows[-1].id
        # Явный commit батча — освобождает lock, уменьшает bloat WAL
        conn.execute(text("COMMIT"))
        conn.execute(text("BEGIN"))


def downgrade() -> None:
    # Откат data migration: обнуляем поле
    op.execute("UPDATE users SET slug = NULL")`,
      },
      {
        filename: "alembic_analytics/env.py",
        code: `"""
env.py для аналитической БД — отдельное дерево миграций.
Запуск: alembic -c alembic_analytics.ini upgrade head
"""

import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Аналитические модели в отдельном модуле — нет пересечения с основными
from app.models.analytics import AnalyticsBase  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = AnalyticsBase.metadata


def get_url() -> str:
    return os.environ["ANALYTICS_DATABASE_URL"]


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = async_engine_from_config(
        configuration, prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


run_migrations_online()`,
      },
      {
        filename: "tests/test_migrations.py",
        code: `"""
Тест миграций в CI:
1. Проверяем что upgrade head отрабатывает без ошибок
2. Проверяем что downgrade до base отрабатывает (rollback-abilty)
3. Проверяем что схема после upgrade совпадает с текущими моделями (drift detection)
"""

import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect, text


SYNC_TEST_URL = "postgresql://test:test@localhost:5432/test_migrations"


@pytest.fixture(scope="session")
def alembic_cfg() -> Config:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", SYNC_TEST_URL)
    return cfg


@pytest.fixture(autouse=True)
def clean_db(alembic_cfg: Config):
    """Перед каждым тестом: откатываем до base и накатываем заново."""
    engine = create_engine(SYNC_TEST_URL)
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        conn.commit()
    engine.dispose()
    yield
    # Явная очистка после теста не нужна — следующий тест сделает DROP


def test_upgrade_head(alembic_cfg: Config) -> None:
    """Все миграции накатываются без ошибок."""
    command.upgrade(alembic_cfg, "head")


def test_downgrade_to_base(alembic_cfg: Config) -> None:
    """Все миграции откатываются без ошибок — downgrade реализован корректно."""
    command.upgrade(alembic_cfg, "head")
    command.downgrade(alembic_cfg, "base")


def test_no_schema_drift(alembic_cfg: Config) -> None:
    """
    Drift detection: сравниваем схему после upgrade head с метаданными моделей.
    Если разработчик изменил модель без создания миграции — тест упадёт.
    """
    from app.models import Base

    command.upgrade(alembic_cfg, "head")
    engine = create_engine(SYNC_TEST_URL)

    with engine.connect() as conn:
        context = MigrationContext.configure(conn)
        diff = compare_metadata(context, Base.metadata)

    assert not diff, f"Schema drift detected:\\n{diff}"
    engine.dispose()


def test_migration_chain_has_no_gaps(alembic_cfg: Config) -> None:
    """
    Проверяет что нет 'висящих' ревизий без down_revision (кроме первой).
    Частая ошибка при merge feature-веток.
    """
    script = ScriptDirectory.from_config(alembic_cfg)
    heads = script.get_heads()
    assert len(heads) == 1, (
        f"Multiple migration heads detected: {heads}. "
        "Run 'alembic merge heads' to fix."
    )


# Вспомогательная функция (упрощённая версия alembic.autogenerate.compare_metadata)
def compare_metadata(context, metadata):
    from alembic.autogenerate import compare_metadata as _compare
    return _compare(context, metadata)`,
      },
      {
        filename: "Makefile",
        code: `# ── Основная БД ──────────────────────────────────────────────────────────────

# Создать новую миграцию с автогенерацией из моделей
migrate-generate:
\t@read -p "Migration name: " name; \\
\talembic revision --autogenerate -m "$$name"

# Применить все миграции до HEAD
migrate-up:
\talembic upgrade head

# Откатить последнюю миграцию
migrate-down:
\talembic downgrade -1

# Откатить до конкретной ревизии
migrate-to:
\t@read -p "Revision: " rev; \\
\talembic downgrade $$rev

# Показать текущую ревизию
migrate-current:
\talembic current

# Показать историю миграций
migrate-history:
\talembic history --verbose

# Сгенерировать SQL без применения (для code review / аудита)
migrate-sql:
\talembic upgrade head --sql

# ── Аналитическая БД ─────────────────────────────────────────────────────────

analytics-up:
\talembic -c alembic_analytics.ini upgrade head

analytics-down:
\talembic -c alembic_analytics.ini downgrade -1

analytics-generate:
\t@read -p "Migration name: " name; \\
\talembic -c alembic_analytics.ini revision --autogenerate -m "$$name"

# ── CI ───────────────────────────────────────────────────────────────────────

test-migrations:
\tpytest tests/test_migrations.py -v`,
      },
    ],
    explanation: `**Async env.py**: Alembic изначально синхронный. Ключ — \`async_engine_from_config\` + \`connection.run_sync(do_run_migrations)\`. \`run_sync\` выполняет синхронную функцию в контексте async-соединения, передавая ей обычный \`Connection\`. \`NullPool\` — обязателен для скриптов миграций: не держит pool между вызовами, корректно завершается.

**Autogenerate** работает только если все модели импортированы до вызова \`env.py\`. Частая ошибка: забыли импортировать новый модуль → таблица не попала в \`Base.metadata\` → autogenerate её не видит. Решение: централизованный \`app/models/__init__.py\` с импортами всех моделей.

**Data migrations без ORM-моделей**: в миграции используйте \`op.get_bind()\` и \`text()\`, не импортируйте ORM-классы из приложения. Через 6 месяцев модель изменится, старая миграция сломается. SQL в миграции — вечный контракт.

**Батчинг через keyset pagination**: \`OFFSET N\` на больших таблицах замедляется линейно (БД сканирует N строк чтобы их пропустить). Keyset pagination (\`WHERE id > :last_id\`) работает за O(log n) через индекс.

**Zero-downtime паттерн для NOT NULL**: PostgreSQL блокирует таблицу при \`ADD COLUMN NOT NULL DEFAULT\` (до PG 11 перезаписывал каждую строку). Безопасная последовательность: 1) ADD COLUMN nullable, 2) задеплоить код (пишет в новое поле), 3) backfill данных батчами, 4) ALTER COLUMN SET NOT NULL. Между шагами работа не прерывается.

**\`CREATE INDEX CONCURRENTLY\`**: обычный \`CREATE INDEX\` берёт ShareLock — блокирует все INSERT/UPDATE/DELETE пока строится индекс. CONCURRENTLY строит без блокировки записи (два прохода по таблице). Нельзя использовать внутри транзакции — запускайте отдельным шагом или через \`op.execute()\`.

**Multiple heads**: при слиянии веток где каждая добавила миграцию — Alembic обнаружит два HEAD. \`alembic merge heads\` создаёт merge-ревизию с двумя \`down_revision\`. Тест \`test_migration_chain_has_no_gaps\` ловит это в CI до попадания в main.

**Тестирование rollback**: CI должен проверять не только \`upgrade head\`, но и \`downgrade base\`. Иначе \`downgrade()\` в методе будет нерабочим в момент когда он действительно нужен — при откате в production.`,
  },

  {
    id: "sqlalchemy-query-optimization",
    title: "Оптимизация запросов в async SQLAlchemy",
    task: "Проведите оптимизацию ORM-запросов в FastAPI-приложении. Устраните N+1 через selectinload и joinedload, правильно используйте lazy=\"raise\" для обнаружения непреднамеренных lazy load, реализуйте batch loading для связанных объектов, используйте with_loader_criteria для row-level security, настройте connection pool (pool_size, max_overflow, pool_timeout).",
    files: [
      {
        filename: "app/core/database.py",
        code: `from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    # ── Pool settings ────────────────────────────────────────────────────────
    # pool_size: постоянные соединения в пуле.
    # Правило: pool_size = кол-во worker-процессов × (avg concurrency per worker).
    # Для uvicorn с 4 воркерами и ~5 одновременных запросов: 4×5 = 20.
    pool_size=20,
    # max_overflow: временные соединения сверх pool_size при пиковой нагрузке.
    # Итого максимум = pool_size + max_overflow = 20 + 10 = 30 соединений к PG.
    max_overflow=10,
    # pool_timeout: сколько секунд ждать свободного соединения из пула.
    # По истечении — PoolTimeout. Лучше упасть быстро, чем зависнуть.
    pool_timeout=30,
    # pool_recycle: пересоздаёт соединения старше N секунд.
    # Защита от "stale connection" когда PG закрыл со своей стороны.
    pool_recycle=1800,
    # pool_pre_ping: перед выдачей из пула делает SELECT 1.
    # Немного медленнее, но гарантирует живое соединение.
    pool_pre_ping=True,
    # echo="debug" выводит все SQL + параметры — только для локальной отладки
    echo=settings.debug,
)

async_session_factory = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)`,
      },
      {
        filename: "app/models/blog.py",
        code: `from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # lazy="raise" — любой необъявленный доступ к posts бросает
    # sqlalchemy.exc.InvalidRequestError: 'User.posts' is not available due to lazy='raise'
    # Это инструмент разработки: заставляет явно прописывать загрузку.
    posts: Mapped[list["Post"]] = relationship(
        back_populates="author",
        lazy="raise",
    )


class Post(Base, TimestampMixin):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    author: Mapped["User"] = relationship(back_populates="posts", lazy="raise")
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="post",
        lazy="raise",
        cascade="all, delete-orphan",
    )


class Comment(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    body: Mapped[str] = mapped_column(Text)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    post: Mapped["Post"] = relationship(back_populates="comments", lazy="raise")
    author: Mapped["User"] = relationship(lazy="raise")`,
      },
      {
        filename: "app/repositories/post_repository.py",
        code: `from sqlalchemy import select, func
from sqlalchemy.orm import (
    joinedload,
    selectinload,
    contains_eager,
    with_loader_criteria,
    raiseload,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog import Comment, Post, User


class PostRepository:
    def __init__(self, session: AsyncSession, current_user_id: int | None = None) -> None:
        self.session = session
        self.current_user_id = current_user_id

    # ── N+1 антипаттерн и его устранение ────────────────────────────────────

    async def get_posts_bad(self) -> list[Post]:
        """
        ПЛОХО: N+1 запросов.
        Цикл с await post.awaitable_attrs.author делает SELECT на каждый пост.
        100 постов = 101 запрос к БД.
        """
        result = await self.session.execute(select(Post))
        posts = list(result.scalars().all())
        # ↓ каждый вызов — отдельный SELECT users WHERE id = ?
        # for post in posts:
        #     author = await post.awaitable_attrs.author
        return posts

    async def get_posts_with_author(self, *, limit: int = 20) -> list[Post]:
        """
        ХОРОШО: joinedload для to-one (Post→User).
        Один SQL с LEFT OUTER JOIN — автор загружается вместе с постом.
        Для to-one оптимально: нет дублирования строк.
        """
        result = await self.session.execute(
            select(Post)
            .options(joinedload(Post.author))
            .where(Post.is_published.is_(True))
            .order_by(Post.created_at.desc())
            .limit(limit)
        )
        # unique() обязателен при joinedload — убирает дубли из картезианского произведения
        return list(result.unique().scalars().all())

    async def get_post_full(self, post_id: int) -> Post | None:
        """
        Полная загрузка: автор (to-one) + комментарии с авторами (to-many → to-one).

        Стратегия:
        - joinedload(Post.author): JOIN в основном запросе
        - selectinload(Post.comments): отдельный SELECT WHERE post_id IN (...)
        - .joinedload(Comment.author): JOIN к запросу комментариев
        """
        result = await self.session.execute(
            select(Post)
            .where(Post.id == post_id)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments).joinedload(Comment.author),
            )
        )
        return result.unique().scalar_one_or_none()

    # ── with_loader_criteria — row-level security ────────────────────────────

    async def get_posts_with_visible_comments(self, post_id: int) -> Post | None:
        """
        with_loader_criteria добавляет WHERE-условие к загрузке конкретного relationship.
        Здесь: грузим только комментарии где is_visible=True.

        Это row-level фильтр на уровне ORM — работает прозрачно для всего кода,
        который обращается к post.comments после этого запроса.
        """
        result = await self.session.execute(
            select(Post)
            .where(Post.id == post_id)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments).joinedload(Comment.author),
                # Фильтруем комментарии прямо при загрузке
                with_loader_criteria(
                    Comment,
                    Comment.is_visible.is_(True),
                    include_aliases=True,
                ),
            )
        )
        return result.unique().scalar_one_or_none()

    async def get_my_posts_with_all_comments(self) -> list[Post]:
        """
        Комбинация: обычные пользователи видят только visible комментарии,
        автор поста видит все свои комментарии.
        """
        if self.current_user_id is None:
            criteria = Comment.is_visible.is_(True)
        else:
            # Автор видит все комментарии к своим постам
            criteria = (
                Comment.is_visible.is_(True)
                | (Post.author_id == self.current_user_id)
            )

        result = await self.session.execute(
            select(Post)
            .where(Post.is_published.is_(True))
            .options(
                joinedload(Post.author),
                selectinload(Post.comments),
                with_loader_criteria(Comment, criteria, include_aliases=True),
            )
        )
        return list(result.unique().scalars().all())

    # ── Batch loading вручную ────────────────────────────────────────────────

    async def get_posts_batch(self, post_ids: list[int]) -> dict[int, Post]:
        """
        Загружаем несколько постов одним запросом (IN-clause).
        Возвращаем dict для O(1) доступа по id в вызывающем коде.
        """
        if not post_ids:
            return {}
        result = await self.session.execute(
            select(Post)
            .where(Post.id.in_(post_ids))
            .options(joinedload(Post.author))
        )
        posts = result.unique().scalars().all()
        return {post.id: post for post in posts}

    # ── contains_eager — фильтрация + загрузка за один JOIN ─────────────────

    async def get_users_with_published_posts(self) -> list[User]:
        """
        contains_eager: делаем явный JOIN, и говорим SQLAlchemy
        использовать его результат для заполнения relationship.

        Преимущество перед joinedload: можно фильтровать по полям joined-таблицы
        (WHERE posts.is_published = true) — joinedload так не умеет.
        """
        result = await self.session.execute(
            select(User)
            .join(User.posts)                       # явный JOIN
            .where(Post.is_published.is_(True))     # фильтр по joined-таблице
            .options(contains_eager(User.posts))    # использовать JOIN для relationship
            .order_by(User.id)
        )
        return list(result.unique().scalars().all())

    # ── raiseload — явный запрет всей ленивой загрузки ───────────────────────

    async def get_posts_safe(self, *, limit: int = 50) -> list[Post]:
        """
        raiseload("*") — запрещает ленивую загрузку ВСЕХ relationship.
        Любой непредвиденный доступ к незагруженному атрибуту бросает исключение.
        Жёстче чем lazy="raise" в модели: работает на уровне конкретного запроса.
        """
        result = await self.session.execute(
            select(Post)
            .options(
                joinedload(Post.author),   # явно загружаем автора
                raiseload("*"),            # всё остальное — запрещено
            )
            .limit(limit)
        )
        return list(result.unique().scalars().all())

    # ── Агрегация без загрузки объектов ─────────────────────────────────────

    async def get_comment_counts(self, post_ids: list[int]) -> dict[int, int]:
        """
        Считаем комментарии агрегацией — не грузим объекты Comment в память.
        GROUP BY + COUNT вместо len(post.comments) для каждого поста.
        """
        if not post_ids:
            return {}
        result = await self.session.execute(
            select(Comment.post_id, func.count(Comment.id).label("cnt"))
            .where(Comment.post_id.in_(post_ids))
            .where(Comment.is_visible.is_(True))
            .group_by(Comment.post_id)
        )
        return {row.post_id: row.cnt for row in result}`,
      },
      {
        filename: "app/middleware/query_profiling.py",
        code: `"""
Query profiling middleware: логирует медленные запросы.
Подключается к SQLAlchemy event system — не меняет код репозиториев.
"""

import time
import logging
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger("sqlalchemy.slow")

SLOW_QUERY_THRESHOLD_MS = 100  # запросы дольше 100 мс — в лог


def setup_query_profiling(engine: AsyncEngine) -> None:
    @event.listens_for(engine.sync_engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("query_start_time", []).append(time.monotonic())

    @event.listens_for(engine.sync_engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        elapsed_ms = (time.monotonic() - conn.info["query_start_time"].pop()) * 1000
        if elapsed_ms > SLOW_QUERY_THRESHOLD_MS:
            logger.warning(
                "Slow query (%.1f ms): %s | params: %s",
                elapsed_ms,
                statement[:200],
                str(parameters)[:100],
            )`,
      },
    ],
    explanation: `**N+1 проблема**: возникает когда для списка из N объектов делается N дополнительных запросов для загрузки связанных данных. SQLAlchemy с \`lazy="raise"\` превращает это в явную ошибку на этапе разработки — лучше упасть локально, чем молча деградировать в production.

**joinedload vs selectinload**: \`joinedload\` добавляет JOIN к основному SELECT — одним запросом. Идеален для to-one (Post→User): нет дублирования строк. Для to-many (Post→[Comments]) создаёт декартово произведение: 1 пост × 100 комментариев = 100 строк в ответе БД. \`selectinload\` делает отдельный \`WHERE post_id IN (...)\` — эффективнее для to-many. Смешивание — стандартная практика.

**\`result.unique()\`**: при joinedload SQLAlchemy получает дублированные строки (из-за JOIN). \`unique()\` дедуплицирует их по identity map. Без \`unique()\` получите список с повторами. Правило: всегда вызывать \`unique()\` после запроса с \`joinedload\`.

**\`with_loader_criteria\`**: применяет дополнительный WHERE к загрузке relationship без изменения основного запроса. Мощный инструмент для row-level security: один раз настроили через Depends — и все запросы автоматически фильтруют данные по пользователю.

**\`contains_eager\`**: позволяет фильтровать по полям joined-таблицы (чего не умеет \`joinedload\`) и переиспользовать JOIN для заполнения relationship. Паттерн: явный \`join()\` + \`where()\` по joined-таблице + \`options(contains_eager(...))\`.

**Pool sizing**: формула — \`pool_size ≈ workers × avg_concurrent_queries_per_worker\`. PostgreSQL по умолчанию разрешает 100 соединений; суммарный pool всех инстансов приложения не должен превышать \`max_connections - 10\` (резерв для psql/мониторинга). \`pool_pre_ping=True\` добавляет ~0.1 мс на запрос, но исключает ошибки "connection already closed".

**Query profiling через events**: SQLAlchemy event system — неинвазивный способ добавить логирование/метрики без изменения кода репозиториев. \`before_cursor_execute\` / \`after_cursor_execute\` работают для всех запросов через данный engine. В production используйте OpenTelemetry вместо логов.`,
  },

  {
    id: "mongodb-motor-async",
    title: "MongoDB и Motor — async ODM",
    task: "Реализуйте async-слой для работы с MongoDB через motor. Создайте базовый репозиторий с CRUD, сложный агрегационный pipeline для аналитики, индексы для оптимизации запросов (включая text, geospatial), реализуйте пагинацию через cursor. Сравните подход с MongoDB и SQL для разных сценариев. Реализуйте миграции схемы для MongoDB (schema validation).",
    files: [
      {
        filename: "app/core/mongo.py",
        code: `from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

# Motor — асинхронная обёртка над pymongo.
# Клиент создаётся один раз и переиспользуется: он thread-safe и connection-pooling внутри.
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.mongodb_url,
            # maxPoolSize: максимум соединений в пуле (default 100)
            maxPoolSize=50,
            # minPoolSize: минимум — держим соединения тёплыми
            minPoolSize=5,
            # serverSelectionTimeoutMS: сколько ждём выбора сервера при старте
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_database]


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None`,
      },
      {
        filename: "app/repositories/mongo_base.py",
        code: `from typing import Any, Generic, TypeVar
from datetime import datetime, UTC

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

T = TypeVar("T", bound=dict)


class MongoRepository(Generic[T]):
    """
    Базовый репозиторий для MongoDB.
    В отличие от SQLAlchemy, MongoDB не требует ORM — работаем с dict напрямую
    или через Pydantic-модели для валидации.
    """

    collection_name: str  # переопределить в подклассе

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection: AsyncIOMotorCollection = db[self.collection_name]

    # ── CREATE ───────────────────────────────────────────────────────────────

    async def create(self, document: dict[str, Any]) -> str:
        """Вставляет документ, возвращает строковый id."""
        document["created_at"] = datetime.now(UTC)
        document["updated_at"] = datetime.now(UTC)
        result = await self.collection.insert_one(document)
        return str(result.inserted_id)

    async def bulk_create(self, documents: list[dict[str, Any]]) -> list[str]:
        now = datetime.now(UTC)
        for doc in documents:
            doc["created_at"] = now
            doc["updated_at"] = now
        result = await self.collection.insert_many(documents)
        return [str(oid) for oid in result.inserted_ids]

    # ── READ ─────────────────────────────────────────────────────────────────

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        document = await self.collection.find_one({"_id": ObjectId(id)})
        if document:
            document["id"] = str(document.pop("_id"))
        return document

    async def find(
        self,
        filter: dict[str, Any] | None = None,
        *,
        projection: dict[str, Any] | None = None,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 20,
        skip: int = 0,
    ) -> list[dict[str, Any]]:
        cursor = self.collection.find(filter or {}, projection)
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        for doc in documents:
            doc["id"] = str(doc.pop("_id"))
        return documents

    async def count(self, filter: dict[str, Any] | None = None) -> int:
        return await self.collection.count_documents(filter or {})

    # ── UPDATE ───────────────────────────────────────────────────────────────

    async def update(self, id: str, updates: dict[str, Any]) -> bool:
        updates["updated_at"] = datetime.now(UTC)
        result = await self.collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": updates},
        )
        return result.modified_count > 0

    async def upsert(self, filter: dict[str, Any], document: dict[str, Any]) -> str:
        """Обновляет если существует, создаёт если нет."""
        document["updated_at"] = datetime.now(UTC)
        result = await self.collection.find_one_and_update(
            filter,
            {"$set": document, "$setOnInsert": {"created_at": datetime.now(UTC)}},
            upsert=True,
            return_document=True,   # возвращает документ после операции
        )
        return str(result["_id"])

    # ── DELETE ───────────────────────────────────────────────────────────────

    async def delete(self, id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0`,
      },
      {
        filename: "app/repositories/product_repository.py",
        code: `from typing import Any
from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, GEOSPHERE, TEXT, IndexModel

from app.repositories.mongo_base import MongoRepository


class ProductRepository(MongoRepository):
    collection_name = "products"

    @classmethod
    async def create_indexes(cls, db: AsyncIOMotorDatabase) -> None:
        """
        Создаём индексы при старте приложения (idempotent — безопасно запускать повторно).
        В production создавайте индексы заранее (через миграцию), не при деплое:
        на большой коллекции это может занять минуты.
        """
        collection = db[cls.collection_name]
        await collection.create_indexes([
            # Составной индекс: часто фильтруем по категории + сортируем по цене
            IndexModel([("category", ASCENDING), ("price", ASCENDING)], name="idx_category_price"),
            # Уникальный индекс на slug
            IndexModel([("slug", ASCENDING)], unique=True, name="idx_slug_unique"),
            # Text index для полнотекстового поиска по нескольким полям
            # Weights задают приоритет: совпадение в title важнее чем в description
            IndexModel(
                [("title", TEXT), ("description", TEXT), ("tags", TEXT)],
                weights={"title": 10, "description": 5, "tags": 3},
                default_language="russian",
                name="idx_text_search",
            ),
            # Geospatial index для поиска по координатам (магазины поблизости)
            IndexModel([("location", GEOSPHERE)], name="idx_geo"),
            # Sparse index: только документы у которых есть поле discount_until
            IndexModel(
                [("discount_until", ASCENDING)],
                sparse=True,   # документы без поля не попадают в индекс
                name="idx_discount_expiry",
            ),
        ])

    # ── Полнотекстовый поиск ─────────────────────────────────────────────────

    async def search(
        self, query: str, *, category: str | None = None, limit: int = 20
    ) -> list[dict]:
        """
        $text search использует text index.
        $meta: "textScore" — релевантность совпадения, используем для сортировки.
        """
        filter: dict = {"$text": {"$search": query}}
        if category:
            filter["category"] = category

        cursor = self.collection.find(
            filter,
            # Проекция: включаем score в результат
            {"score": {"$meta": "textScore"}},
        ).sort(
            [("score", {"$meta": "textScore"})]  # сортировка по релевантности
        ).limit(limit)

        docs = await cursor.to_list(length=limit)
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
        return docs

    # ── Геопоиск ─────────────────────────────────────────────────────────────

    async def find_nearby(
        self,
        longitude: float,
        latitude: float,
        *,
        max_distance_meters: int = 5000,
        limit: int = 20,
    ) -> list[dict]:
        """
        $near требует GEOSPHERE индекс.
        Возвращает документы отсортированные по расстоянию (ближайшие первые).
        """
        docs = await self.find(
            filter={
                "location": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude],
                        },
                        "$maxDistance": max_distance_meters,
                    }
                }
            },
            limit=limit,
        )
        return docs

    # ── Cursor pagination ────────────────────────────────────────────────────

    async def paginate_by_cursor(
        self,
        *,
        after_id: str | None = None,
        limit: int = 20,
        category: str | None = None,
    ) -> dict[str, Any]:
        """
        Cursor pagination по _id — более эффективна чем skip/limit на больших коллекциях.
        _id монотонно растёт (ObjectId содержит timestamp) — используем как курсор.

        Плюсы vs offset pagination:
        - O(log n) вместо O(n) для поиска страницы
        - Стабильна при вставках: новые документы не сдвигают страницы
        """
        from bson import ObjectId

        filter: dict = {}
        if category:
            filter["category"] = category
        if after_id:
            # Берём документы с _id > курсора (после последнего виденного)
            filter["_id"] = {"$gt": ObjectId(after_id)}

        cursor = (
            self.collection.find(filter)
            .sort("_id", ASCENDING)
            .limit(limit + 1)  # берём на 1 больше чтобы знать есть ли следующая страница
        )
        docs = await cursor.to_list(length=limit + 1)

        has_next = len(docs) > limit
        if has_next:
            docs = docs[:-1]

        for doc in docs:
            doc["id"] = str(doc.pop("_id"))

        next_cursor = docs[-1]["id"] if has_next and docs else None
        return {
            "items": docs,
            "next_cursor": next_cursor,
            "has_next": has_next,
        }`,
      },
      {
        filename: "app/repositories/analytics_repository.py",
        code: `from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase


class OrderAnalyticsRepository:
    """Аналитические запросы через MongoDB Aggregation Pipeline."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["orders"]

    async def revenue_by_category(
        self,
        date_from: datetime,
        date_to: datetime,
    ) -> list[dict]:
        """
        Pipeline: фильтр → разворачиваем массив items → группируем → сортируем.

        $unwind разворачивает массив: документ с items:[A,B,C]
        превращается в 3 документа с item:A, item:B, item:C.
        """
        pipeline = [
            # Шаг 1: фильтруем по диапазону дат и статусу
            {
                "$match": {
                    "created_at": {"$gte": date_from, "$lte": date_to},
                    "status": "completed",
                }
            },
            # Шаг 2: разворачиваем массив позиций заказа
            {"$unwind": "$items"},
            # Шаг 3: группируем по категории товара
            {
                "$group": {
                    "_id": "$items.category",
                    "total_revenue": {
                        "$sum": {"$multiply": ["$items.price", "$items.quantity"]}
                    },
                    "orders_count": {"$sum": 1},
                    "avg_order_value": {"$avg": "$items.price"},
                    "unique_products": {"$addToSet": "$items.product_id"},
                }
            },
            # Шаг 4: добавляем вычисляемые поля
            {
                "$addFields": {
                    "unique_products_count": {"$size": "$unique_products"},
                    "category": "$_id",
                }
            },
            # Шаг 5: убираем служебные поля
            {"$project": {"_id": 0, "unique_products": 0}},
            # Шаг 6: сортируем по выручке
            {"$sort": {"total_revenue": -1}},
        ]
        return await self.collection.aggregate(pipeline).to_list(length=None)

    async def daily_cohort_analysis(self, year: int, month: int) -> list[dict]:
        """
        Когортный анализ: группируем пользователей по дню регистрации,
        смотрим их активность.

        $dateToString — форматирует дату в строку для группировки по дням.
        $lookup — аналог JOIN с другой коллекцией.
        """
        pipeline = [
            {
                "$match": {
                    "created_at": {
                        "$gte": datetime(year, month, 1),
                        "$lt": datetime(year, month + 1, 1) if month < 12
                               else datetime(year + 1, 1, 1),
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "new_users": {"$addToSet": "$user_id"},
                    "total_orders": {"$sum": 1},
                    "total_revenue": {"$sum": "$total_amount"},
                }
            },
            {
                "$addFields": {
                    "date": "$_id",
                    "new_users_count": {"$size": "$new_users"},
                    "avg_revenue_per_user": {
                        "$divide": [
                            "$total_revenue",
                            {"$size": "$new_users"},
                        ]
                    },
                }
            },
            {"$project": {"_id": 0, "new_users": 0}},
            {"$sort": {"date": 1}},
        ]
        return await self.collection.aggregate(pipeline).to_list(length=None)

    async def top_products_with_lookup(self, limit: int = 10) -> list[dict]:
        """
        $lookup — JOIN с коллекцией products.
        $facet — параллельно вычисляет несколько sub-pipeline.
        """
        pipeline = [
            {"$match": {"status": "completed"}},
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.product_id",
                    "sold_qty": {"$sum": "$items.quantity"},
                    "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                }
            },
            {"$sort": {"revenue": -1}},
            {"$limit": limit},
            # JOIN с коллекцией products по product_id
            {
                "$lookup": {
                    "from": "products",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "product_info",
                    "pipeline": [                        # sub-pipeline для фильтрации полей
                        {"$project": {"title": 1, "category": 1, "slug": 1}},
                    ],
                }
            },
            # Разворачиваем массив из lookup (всегда один элемент при lookup по _id)
            {"$unwind": {"path": "$product_info", "preserveNullAndEmpty": True}},
            {
                "$project": {
                    "product_id": {"$toString": "$_id"},
                    "title": "$product_info.title",
                    "category": "$product_info.category",
                    "sold_qty": 1,
                    "revenue": 1,
                    "_id": 0,
                }
            },
        ]
        return await self.collection.aggregate(pipeline).to_list(length=None)`,
      },
      {
        filename: "app/migrations/mongo_schema_validation.py",
        code: `"""
MongoDB не имеет встроенного инструмента миграций как Alembic.
Подход: скрипты-миграции с версионированием, применяемые через CLI.

Schema Validation — JSON Schema на уровне коллекции:
MongoDB отклоняет документы не соответствующие схеме.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase


PRODUCTS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["title", "price", "category", "slug", "created_at", "updated_at"],
        "additionalProperties": True,   # False — строгий режим, не допускает лишних полей
        "properties": {
            "title": {
                "bsonType": "string",
                "minLength": 1,
                "maxLength": 255,
                "description": "Название товара — обязательно",
            },
            "price": {
                "bsonType": "decimal",
                "minimum": 0,
                "description": "Цена — неотрицательное число",
            },
            "category": {
                "bsonType": "string",
                "enum": ["electronics", "clothing", "food", "books", "other"],
            },
            "slug": {
                "bsonType": "string",
                "pattern": "^[a-z0-9-]+$",
            },
            "tags": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "location": {
                "bsonType": "object",
                "required": ["type", "coordinates"],
                "properties": {
                    "type": {"bsonType": "string", "enum": ["Point"]},
                    "coordinates": {
                        "bsonType": "array",
                        "minItems": 2,
                        "maxItems": 2,
                    },
                },
            },
        },
    }
}


async def migration_001_create_products(db: AsyncIOMotorDatabase) -> None:
    """Создаём коллекцию products со schema validation."""
    existing = await db.list_collection_names()
    if "products" not in existing:
        await db.create_collection(
            "products",
            validator=PRODUCTS_SCHEMA,
            # "error" — отклоняет невалидные документы (строгий режим)
            # "warn" — вставляет, но пишет в лог (для мягкой миграции)
            validationAction="error",
            validationLevel="strict",
        )


async def migration_002_update_products_schema(db: AsyncIOMotorDatabase) -> None:
    """
    Обновляем schema validation для существующей коллекции.
    collMod — команда MongoDB для изменения параметров коллекции.
    """
    await db.command(
        "collMod",
        "products",
        validator=PRODUCTS_SCHEMA,
        validationAction="error",
        validationLevel="strict",
    )


async def migration_003_add_stock_field(db: AsyncIOMotorDatabase) -> None:
    """
    Data migration: добавляем поле stock = 0 для всех документов без него.
    updateMany с $setOnInsert не подходит — используем $set + exists.
    """
    result = await db["products"].update_many(
        {"stock": {"$exists": False}},       # документы без поля stock
        {"$set": {"stock": 0}},
    )
    print(f"Migrated {result.modified_count} documents: added stock=0")


# ── Migration runner ─────────────────────────────────────────────────────────

MIGRATIONS = [
    ("001_create_products", migration_001_create_products),
    ("002_update_schema", migration_002_update_products_schema),
    ("003_add_stock", migration_003_add_stock_field),
]


async def run_migrations(db: AsyncIOMotorDatabase) -> None:
    """
    Простой migration runner: хранит применённые миграции в коллекции _migrations.
    """
    applied = {
        doc["name"]
        async for doc in db["_migrations"].find({}, {"name": 1})
    }

    for name, migration_func in MIGRATIONS:
        if name in applied:
            print(f"[skip] {name}")
            continue

        print(f"[apply] {name}...")
        await migration_func(db)
        await db["_migrations"].insert_one(
            {"name": name, "applied_at": __import__("datetime").datetime.utcnow()}
        )
        print(f"[done] {name}")`,
      },
      {
        filename: "docs/mongodb_vs_sql.md",
        code: `# MongoDB vs SQL — когда что выбирать

## Используйте MongoDB когда:

### 1. Схема документа нестабильна или сильно варьируется
\`\`\`
# Товары разных категорий имеют разные атрибуты:
electronics: {cpu, ram, display_size, battery}
clothing:    {size, color, material, season}
books:       {author, isbn, pages, genre}
\`\`\`
В SQL — EAV (Entity-Attribute-Value) или JSONB. В MongoDB — нативно.

### 2. Иерархические / вложенные данные
\`\`\`json
{
  "order_id": "...",
  "items": [
    {"product_id": "...", "qty": 2, "options": {"color": "red"}},
    {"product_id": "...", "qty": 1, "options": {"size": "XL"}}
  ],
  "shipping": {"address": {...}, "method": "express"}
}
\`\`\`
Один документ = один запрос. В SQL: 3+ таблицы + JOIN.

### 3. Высокая частота write-операций на документ
Атомарное обновление вложенного поля: $inc, $push, $set.
Без блокировки всей строки как в SQL UPDATE.

### 4. Time-series / event log (с TTL-индексами)
\`\`\`python
# TTL-индекс: MongoDB автоматически удаляет документы старше N секунд
await collection.create_index("created_at", expireAfterSeconds=86400*30)
\`\`\`

## Используйте PostgreSQL когда:

### 1. Сложные JOIN между сущностями
Заказы + пользователи + продукты + скидки — реляционная модель здесь выигрывает.

### 2. ACID-транзакции между несколькими коллекциями
MongoDB поддерживает multi-document transactions с версии 4.0,
но они значительно медленнее чем PostgreSQL-транзакции.

### 3. Агрегации по большим объёмам данных
PostgreSQL с партиционированием и материализованными view быстрее
MongoDB Aggregation Pipeline на аналитических запросах.

### 4. Строгая схема с FK-constraints
Целостность данных на уровне БД — только в SQL.

## Гибридный подход (наш проект):
- PostgreSQL: пользователи, заказы, транзакции (ACID, FK)
- MongoDB: каталог товаров (гибкая схема), сессии, логи событий`,
      },
    ],
    explanation: `**Motor vs pymongo**: Motor — асинхронная обёртка над pymongo, использует тот же API. Клиент Motor управляет connection pool внутри — создаём один экземпляр на всё приложение. \`AsyncIOMotorClient\` совместим с asyncio event loop FastAPI.

**ObjectId как курсор**: ObjectId содержит 4 байта timestamp — монотонно возрастает. Cursor pagination через \`{"_id": {"$gt": last_id}}\` использует первичный индекс (_id индексируется всегда). Значительно эффективнее \`skip(N)\` на больших коллекциях: skip сканирует N документов чтобы их пропустить.

**Text index**: один text index на коллекцию, может покрывать несколько полей. \`weights\` задают относительный приоритет полей в релевантности. \`default_language\` влияет на стемминг (русский: "покупки" и "покупать" — одно слово). Запрос через \`$text: {$search: "..."}\` — поддерживает фразы ("exact phrase"), исключения (-word).

**\$unwind + \$group**: классический паттерн для агрегации по элементам массива. \$unwind "разворачивает" документ по массиву — аналог CROSS JOIN LATERAL в SQL. После \$group — агрегируем как обычно. \$lookup — аналог LEFT JOIN с другой коллекцией, поддерживает sub-pipeline для фильтрации возвращаемых полей.

**Schema Validation**: JSON Schema применяется на уровне коллекции. \`validationAction: "error"\` — MongoDB отклоняет невалидные документы. \`validationLevel: "strict"\` — проверяет и вставки, и обновления. Для постепенного внедрения: сначала \`warn\` (логирует нарушения без отклонения), потом \`error\`.

**Migration runner**: MongoDB не имеет встроенного инструмента как Alembic. Простой паттерн — коллекция \`_migrations\` с именами применённых скриптов. Для production используйте mongock или migrate-mongo. Ключевое требование: миграции должны быть идемпотентными (\`$exists: false\`, \`create_collection\` с проверкой).`,
  },

  {
    id: "redis-caching-advanced",
    title: "Кэширование с Redis — продвинутые паттерны",
    task: "Реализуйте многоуровневое кэширование через redis-py async. Создайте декоратор @cache(ttl=300, key_builder=...) для автоматического кэширования результатов функций, реализуйте cache stampede protection (probabilistic early expiration или locking), cache invalidation по тегам, distributed rate limiting через Redis sliding window. Используйте Redis data structures (Sorted Sets, HyperLogLog) для специфических задач.",
    files: [
      {
        filename: "app/core/redis.py",
        code: `import redis.asyncio as aioredis
from app.core.config import settings

# Единственный пул соединений на всё приложение
# decode_responses=True — автоматически декодирует bytes → str
_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None`,
      },
      {
        filename: "app/cache/decorator.py",
        code: `"""
@cache decorator: кэширует результат async-функции в Redis.

Возможности:
- Настраиваемый TTL
- Кастомный key_builder
- Tag-based invalidation
- Cache stampede protection через probabilistic early expiration
"""

import asyncio
import functools
import hashlib
import json
import math
import random
import time
from collections.abc import Callable
from typing import Any

import redis.asyncio as aioredis

from app.core.redis import get_redis

# ── Сериализация ─────────────────────────────────────────────────────────────

def _serialize(value: Any) -> str:
    """JSON + fallback через repr для несериализуемых типов."""
    try:
        return json.dumps(value, default=str, ensure_ascii=False)
    except TypeError:
        return json.dumps(repr(value))


def _deserialize(value: str) -> Any:
    return json.loads(value)


# ── Key builder ───────────────────────────────────────────────────────────────

def default_key_builder(func: Callable, *args: Any, **kwargs: Any) -> str:
    """
    Строит ключ из модуля, имени функции и хэша аргументов.
    Хэш нужен чтобы ключ не вырастал бесконечно при сложных аргументах.
    """
    args_repr = _serialize({"args": args, "kwargs": kwargs})
    args_hash = hashlib.md5(args_repr.encode()).hexdigest()[:12]
    return f"cache:{func.__module__}.{func.__qualname__}:{args_hash}"


# ── Probabilistic early expiration (XFetch) ──────────────────────────────────

def _should_recompute(expiry_ts: float, ttl: int, beta: float = 1.0) -> bool:
    """
    XFetch алгоритм: вероятностное раннее обновление кэша до истечения TTL.

    Когда TTL почти истёк, некоторые запросы начинают "видеть" кэш просроченным
    раньше реального истечения — и перевычисляют значение. Это размазывает
    нагрузку вместо одновременного шторма запросов при expiry.

    delta: время последнего вычисления (сек) — более дорогие функции
           перевычисляются раньше (больше delta → раньше обновление).
    beta: регулятор агрессивности. beta=1.0 — стандарт.
    """
    delta = ttl * 0.1          # предполагаем 10% от TTL как время вычисления
    now = time.time()
    return now - delta * beta * math.log(random.random()) >= expiry_ts


# ── Декоратор ────────────────────────────────────────────────────────────────

def cache(
    ttl: int = 300,
    key_builder: Callable | None = None,
    tags: list[str] | None = None,
    stampede_protection: bool = True,
):
    """
    Декоратор для кэширования результатов async-функций.

    Args:
        ttl: время жизни кэша в секундах
        key_builder: функция(func, *args, **kwargs) → str; по умолчанию default_key_builder
        tags: теги для групповой инвалидации (cache.invalidate_tag("users"))
        stampede_protection: probabilistic early expiration для защиты от stampede

    Пример:
        @cache(ttl=60, tags=["products"])
        async def get_product(product_id: int) -> dict:
            ...
    """
    def decorator(func: Callable):
        _key_builder = key_builder or (lambda *a, **kw: default_key_builder(func, *a, **kw))

        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            redis: aioredis.Redis = get_redis()
            cache_key = _key_builder(*args, **kwargs)
            meta_key = f"{cache_key}:meta"   # хранит expiry timestamp для XFetch

            # 1. Читаем кэш
            cached_raw = await redis.get(cache_key)
            if cached_raw is not None:
                # Проверяем нужно ли раннее перевычисление
                if stampede_protection:
                    meta_raw = await redis.get(meta_key)
                    if meta_raw:
                        expiry_ts = float(meta_raw)
                        if not _should_recompute(expiry_ts, ttl):
                            return _deserialize(cached_raw)
                else:
                    return _deserialize(cached_raw)

            # 2. Вычисляем значение
            result = await func(*args, **kwargs)

            # 3. Сохраняем в кэш атомарно через pipeline
            pipe = redis.pipeline()
            pipe.set(cache_key, _serialize(result), ex=ttl)
            if stampede_protection:
                expiry_ts = time.time() + ttl
                pipe.set(meta_key, str(expiry_ts), ex=ttl)

            # Tag-based invalidation: добавляем ключ в set каждого тега
            if tags:
                for tag in tags:
                    tag_key = f"tag:{tag}"
                    pipe.sadd(tag_key, cache_key)
                    pipe.expire(tag_key, ttl + 60)   # тег живёт чуть дольше ключей

            await pipe.execute()
            return result

        # Добавляем методы для управления кэшем прямо на декорированную функцию
        async def invalidate(*args: Any, **kwargs: Any) -> None:
            """Инвалидирует кэш для конкретных аргументов."""
            redis = get_redis()
            cache_key = _key_builder(*args, **kwargs)
            await redis.delete(cache_key, f"{cache_key}:meta")

        wrapper.invalidate = invalidate  # type: ignore[attr-defined]
        return wrapper

    return decorator


# ── Tag invalidation ─────────────────────────────────────────────────────────

async def invalidate_tag(tag: str) -> int:
    """
    Инвалидирует все ключи, помеченные данным тегом.
    Возвращает количество удалённых ключей.
    """
    redis = get_redis()
    tag_key = f"tag:{tag}"

    # Получаем все ключи тега
    keys = await redis.smembers(tag_key)
    if not keys:
        return 0

    # Удаляем все ключи + метаданные + сам тег
    all_keys = list(keys) + [f"{k}:meta" for k in keys] + [tag_key]
    deleted = await redis.delete(*all_keys)
    return deleted`,
      },
      {
        filename: "app/cache/stampede_lock.py",
        code: `"""
Альтернативная защита от cache stampede: distributed lock.

Только один запрос вычисляет значение, остальные ждут.
Подходит когда вычисление очень дорогое и XFetch не достаточно.
"""

import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Any

import redis.asyncio as aioredis

from app.core.redis import get_redis


class RedisLock:
    """
    Distributed lock на Redis через SET NX (SET if Not eXists).
    Автоматически освобождается по TTL даже если процесс упал.
    """

    def __init__(self, key: str, ttl: int = 10) -> None:
        self.key = f"lock:{key}"
        self.ttl = ttl
        self.token = str(uuid.uuid4())   # уникальный токен владельца
        self._redis: aioredis.Redis | None = None

    @property
    def redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = get_redis()
        return self._redis

    async def acquire(self, timeout: float = 5.0) -> bool:
        """Пытается взять блокировку. Возвращает True при успехе."""
        deadline = asyncio.get_event_loop().time() + timeout
        while asyncio.get_event_loop().time() < deadline:
            # SET key token NX EX ttl — атомарная операция
            acquired = await self.redis.set(
                self.key, self.token, nx=True, ex=self.ttl
            )
            if acquired:
                return True
            await asyncio.sleep(0.05)   # 50 мс между попытками
        return False

    async def release(self) -> None:
        """Освобождает блокировку только если она наша (по токену)."""
        # Lua-скрипт: проверка + удаление атомарно
        script = """
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
        """
        await self.redis.eval(script, 1, self.key, self.token)  # type: ignore[attr-defined]

    @asynccontextmanager
    async def __aenter__(self):
        acquired = await self.acquire()
        if not acquired:
            raise TimeoutError(f"Could not acquire lock: {self.key}")
        try:
            yield self
        finally:
            await self.release()

    async def __aexit__(self, *args: Any) -> None:
        pass


async def get_or_compute_with_lock(
    key: str,
    compute_fn,
    *,
    ttl: int = 300,
    lock_ttl: int = 30,
) -> Any:
    """
    Cache-aside с distributed lock:
    1. Читаем кэш — если есть, возвращаем
    2. Берём блокировку
    3. Перечитываем кэш (double-check) — пока ждали, другой поток мог записать
    4. Вычисляем и сохраняем
    5. Освобождаем блокировку
    """
    import json
    redis = get_redis()

    cached = await redis.get(key)
    if cached:
        return json.loads(cached)

    lock = RedisLock(key, ttl=lock_ttl)
    async with lock:
        # Double-check: пока ждали блокировку, значение могло появиться
        cached = await redis.get(key)
        if cached:
            return json.loads(cached)

        result = await compute_fn()
        await redis.set(key, json.dumps(result, default=str), ex=ttl)
        return result`,
      },
      {
        filename: "app/cache/rate_limiter.py",
        code: `"""
Distributed Rate Limiting через Redis Sliding Window.

Алгоритмы:
1. Fixed Window — простой, но пропускает burst на границе окна
2. Sliding Window Log — точный, но хранит каждый запрос
3. Sliding Window Counter — баланс точности и памяти (реализован здесь)
"""

import time
from dataclasses import dataclass

import redis.asyncio as aioredis

from app.core.redis import get_redis


@dataclass
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_after: float   # секунд до сброса


class SlidingWindowRateLimiter:
    """
    Sliding Window через Sorted Set.

    Каждый запрос добавляется как элемент Sorted Set со score=timestamp.
    Для подсчёта запросов в окне: ZREMRANGEBYSCORE удаляет старые,
    ZCARD считает оставшиеся. Всё атомарно через Lua.
    """

    def __init__(
        self,
        limit: int,
        window_seconds: int,
        key_prefix: str = "ratelimit",
    ) -> None:
        self.limit = limit
        self.window = window_seconds
        self.key_prefix = key_prefix

    # Lua-скрипт выполняется атомарно — нет race condition
    _LUA_SCRIPT = """
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local request_id = ARGV[4]

    -- Удаляем запросы старше window
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window * 1000)

    -- Считаем текущее количество запросов
    local count = redis.call('ZCARD', key)

    if count < limit then
        -- Добавляем текущий запрос (score = timestamp в мс)
        redis.call('ZADD', key, now, request_id)
        redis.call('EXPIRE', key, window + 1)
        return {1, limit - count - 1}   -- {allowed, remaining}
    else
        return {0, 0}                   -- {denied, 0}
    end
    """

    async def check(self, identifier: str) -> RateLimitResult:
        """
        Проверяет лимит для identifier (IP, user_id, api_key...).
        """
        redis: aioredis.Redis = get_redis()
        key = f"{self.key_prefix}:{identifier}"
        now_ms = int(time.time() * 1000)
        request_id = f"{now_ms}-{id(object())}"   # уникальный id запроса

        result = await redis.eval(  # type: ignore[attr-defined]
            self._LUA_SCRIPT,
            1,
            key,
            now_ms,
            self.window,
            self.limit,
            request_id,
        )

        allowed = bool(result[0])
        remaining = int(result[1])
        return RateLimitResult(
            allowed=allowed,
            limit=self.limit,
            remaining=remaining,
            reset_after=self.window,
        )


# ── FastAPI middleware / dependency ──────────────────────────────────────────

from fastapi import Depends, HTTPException, Request, status


_api_limiter = SlidingWindowRateLimiter(limit=100, window_seconds=60)
_auth_limiter = SlidingWindowRateLimiter(limit=5, window_seconds=60, key_prefix="auth_limit")


async def rate_limit_api(request: Request) -> None:
    """Depends: 100 запросов/минуту по IP."""
    client_ip = request.client.host if request.client else "unknown"
    result = await _api_limiter.check(client_ip)

    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(result.limit),
                "X-RateLimit-Remaining": "0",
                "Retry-After": str(int(result.reset_after)),
            },
        )`,
      },
      {
        filename: "app/cache/redis_structures.py",
        code: `"""
Специфические Redis data structures для конкретных задач:
- Sorted Set: leaderboard, очередь с приоритетом
- HyperLogLog: подсчёт уникальных значений без хранения самих значений
- Pub/Sub: real-time уведомления
- Streams: надёжная очередь событий
"""

import json
import time
from typing import Any

import redis.asyncio as aioredis

from app.core.redis import get_redis


class Leaderboard:
    """
    Топ игроков через Sorted Set.
    Score = очки. ZADD обновляет score если ключ уже существует.
    ZREVRANGE возвращает элементы в порядке убывания score.
    """

    def __init__(self, name: str) -> None:
        self.key = f"leaderboard:{name}"

    async def add_score(self, user_id: str, score: float) -> None:
        redis = get_redis()
        await redis.zadd(self.key, {user_id: score})

    async def increment_score(self, user_id: str, delta: float) -> float:
        """Атомарный инкремент — не нужен WATCH/MULTI."""
        redis = get_redis()
        return await redis.zincrby(self.key, delta, user_id)

    async def get_top(self, n: int = 10) -> list[dict]:
        redis = get_redis()
        # withscores=True возвращает [(member, score), ...]
        results = await redis.zrevrange(self.key, 0, n - 1, withscores=True)
        return [
            {"rank": i + 1, "user_id": member, "score": score}
            for i, (member, score) in enumerate(results)
        ]

    async def get_rank(self, user_id: str) -> int | None:
        """Ранг пользователя (0-based с конца, конвертируем в 1-based с начала)."""
        redis = get_redis()
        rank = await redis.zrevrank(self.key, user_id)
        return (rank + 1) if rank is not None else None

    async def get_score(self, user_id: str) -> float | None:
        redis = get_redis()
        return await redis.zscore(self.key, user_id)


class UniqueVisitorsCounter:
    """
    HyperLogLog для подсчёта уникальных посетителей.

    HyperLogLog: вероятностная структура данных.
    - Занимает максимум 12 KB независимо от числа элементов
    - Погрешность ~0.81%
    - Нельзя получить список элементов — только COUNT
    Идеально: DAU, MAU, уникальные просмотры страниц.
    """

    async def track(self, page: str, user_id: str) -> None:
        redis = get_redis()
        today = time.strftime("%Y-%m-%d")
        key = f"hll:visitors:{page}:{today}"
        await redis.pfadd(key, user_id)
        await redis.expire(key, 86400 * 30)   # храним 30 дней

    async def count(self, page: str, date: str | None = None) -> int:
        redis = get_redis()
        date = date or time.strftime("%Y-%m-%d")
        key = f"hll:visitors:{page}:{date}"
        return await redis.pfcount(key)

    async def count_range(self, page: str, dates: list[str]) -> int:
        """
        PFMERGE объединяет несколько HyperLogLog — уникальные за период.
        Не сумма дневных, а честный union (дубли между днями не считаются).
        """
        redis = get_redis()
        keys = [f"hll:visitors:{page}:{d}" for d in dates]
        merge_key = f"hll:merge:{page}:{'_'.join(dates[:3])}"
        await redis.pfmerge(merge_key, *keys)
        await redis.expire(merge_key, 3600)
        return await redis.pfcount(merge_key)


class EventStream:
    """
    Redis Streams: надёжная очередь событий с consumer groups.
    В отличие от Pub/Sub, сохраняет сообщения — subscriber может отстать и догнать.
    """

    def __init__(self, stream_name: str) -> None:
        self.stream = stream_name

    async def publish(self, event_type: str, data: dict[str, Any]) -> str:
        """Публикует событие. Возвращает stream ID."""
        redis = get_redis()
        entry_id = await redis.xadd(
            self.stream,
            {
                "type": event_type,
                "data": json.dumps(data, default=str),
                "timestamp": str(time.time()),
            },
            maxlen=10_000,   # MAXLEN: удаляет старые при превышении
            approximate=True,  # ~ — приближённая очистка (быстрее)
        )
        return entry_id

    async def consume(
        self,
        group: str,
        consumer: str,
        count: int = 10,
        block_ms: int = 1000,
    ) -> list[dict]:
        """
        XREADGROUP: читает непрочитанные сообщения из consumer group.
        > означает "новые сообщения которые никто не читал".
        После обработки нужно XACK.
        """
        redis = get_redis()
        try:
            await redis.xgroup_create(self.stream, group, id="0", mkstream=True)
        except Exception:
            pass   # группа уже существует

        messages = await redis.xreadgroup(
            groupname=group,
            consumername=consumer,
            streams={self.stream: ">"},
            count=count,
            block=block_ms,
        )

        result = []
        if messages:
            for stream_name, entries in messages:
                for entry_id, fields in entries:
                    result.append({
                        "id": entry_id,
                        "type": fields.get("type"),
                        "data": json.loads(fields.get("data", "{}")),
                    })
        return result

    async def ack(self, group: str, *message_ids: str) -> None:
        """Подтверждает обработку сообщений."""
        redis = get_redis()
        await redis.xack(self.stream, group, *message_ids)`,
      },
      {
        filename: "app/services/product_service.py",
        code: `"""
Пример использования всех cache-паттернов в сервисном слое.
"""

from app.cache.decorator import cache, invalidate_tag
from app.cache.redis_structures import Leaderboard, UniqueVisitorsCounter


class ProductService:
    leaderboard = Leaderboard("products_views")
    visitor_counter = UniqueVisitorsCounter()

    @cache(ttl=300, tags=["products", "catalog"])
    async def get_product(self, product_id: int) -> dict:
        """
        Результат кэшируется на 5 минут.
        При изменении продукта — вызываем invalidate_tag("products").
        """
        # ... запрос к БД
        return {"id": product_id, "title": "Product"}

    @cache(
        ttl=60,
        # Кастомный key_builder: игнорируем user_id для общего кэша
        key_builder=lambda category, page, *a, **kw: f"cache:products:{category}:{page}",
        tags=["catalog"],
    )
    async def list_products(self, category: str, page: int, user_id: int) -> list[dict]:
        """
        Кэш общий для всех пользователей одной категории и страницы,
        но user_id нужен для персонализации внутри — не в ключе.
        """
        return []

    async def view_product(self, product_id: int, user_id: str) -> dict:
        """Трекинг просмотров через Redis structures."""
        # Инкрементируем счётчик просмотров в leaderboard
        await self.leaderboard.increment_score(str(product_id), 1)
        # Считаем уникальных пользователей которые видели продукт
        await self.visitor_counter.track(f"product:{product_id}", user_id)
        return await self.get_product(product_id)

    async def update_product(self, product_id: int, data: dict) -> dict:
        """После обновления — инвалидируем весь кэш продуктов."""
        # ... обновление в БД

        # Инвалидируем конкретный ключ
        await self.get_product.invalidate(self, product_id)  # type: ignore
        # Инвалидируем все ключи с тегом "products"
        await invalidate_tag("products")
        return {}`,
      },
    ],
    explanation: `**Декоратор @cache**: использует \`functools.wraps\` для сохранения метаданных оригинальной функции. Pipeline Redis (pipe.execute()) отправляет SET + SADD атомарно за одно сетевое обращение. Key builder на основе MD5 хэша аргументов — компромисс между уникальностью и размером ключа. Метод \`.invalidate\` прикрепляется к декорированной функции — удобно для точечной инвалидации.

**XFetch (probabilistic early expiration)**: при TTL → 0 вероятность "раннего видения" просроченного кэша растёт. Формула: \`now - delta × beta × ln(random())\`. Результат: разные запросы начинают перевычислять кэш в разное время — stampede размазывается. Альтернатива — distributed lock: один перевычисляет, остальные ждут. Lock лучше для очень дорогих вычислений; XFetch — для умеренно дорогих.

**Lua-скрипт для rate limiter**: Redis выполняет Lua атомарно — нет race condition между ZREMRANGEBYSCORE, ZCARD и ZADD. Без Lua пришлось бы использовать WATCH/MULTI/EXEC (оптимистичная блокировка), что сложнее и менее эффективно. Sliding window через Sorted Set точнее Fixed Window (нет burst на границе окна) и экономнее Sliding Window Log (не хранит каждый запрос индивидуально бесконечно — ZREMRANGEBYSCORE чистит старые).

**Tag-based invalidation**: каждый кэш-ключ добавляется в Sorted Set своих тегов. При инвалидации тега — читаем все ключи тега и удаляем их разом. Проблема: при большом числе ключей SMEMBERS блокирует Redis. Для production: SSCAN + batch delete или отдельный сервис инвалидации.

**HyperLogLog**: занимает фиксированные 12 KB независимо от числа элементов. \`PFADD\` добавляет элемент, \`PFCOUNT\` возвращает приближённое количество уникальных (погрешность 0.81%). \`PFMERGE\` объединяет несколько HLL — для подсчёта уникальных за период без дублей. Нельзя получить список элементов — только COUNT. Идеально для DAU/MAU/UV.

**Redis Streams vs Pub/Sub**: Pub/Sub — fire-and-forget, сообщение теряется если нет подписчиков. Streams сохраняют сообщения (MAXLEN ограничивает размер). Consumer groups позволяют нескольким воркерам читать из одного стрима без дублей. XACK подтверждает обработку — непрочитанные можно перечитать через PEL (Pending Entry List).`,
  },

  {
    id: "jwt-refresh-tokens",
    title: "JWT-аутентификация с refresh-токенами",
    task: "Реализуйте полноценную систему JWT-аутентификации без сторонних библиотек. Access-токен (15 мин) + refresh-токен (30 дней) с ротацией. Хранение refresh-токенов в Redis с возможностью инвалидации. Детекция повторного использования отозванного токена (reuse detection с семейством токенов). Блокировка подозрительных сессий. Возврат корректных HTTP-кодов (401 vs 403).",
    files: [
      {
        filename: "app/auth/tokens.py",
        code: `"""
JWT без сторонних auth-библиотек: только PyJWT + стандартная библиотека.

Структура токенов:
  Access:  {"sub": "42", "type": "access",  "jti": "<uuid>", "exp": ...}
  Refresh: {"sub": "42", "type": "refresh", "jti": "<uuid>", "fid": "<family_id>", "exp": ...}

fid (family_id) — UUID всего семейства refresh-токенов одной сессии.
При обнаружении reuse (старый refresh предъявлен снова) — блокируем
весь family, что завершает ВСЕ сессии злоумышленника в этой ветке.
"""

import uuid
from datetime import datetime, timedelta, UTC

import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.core.config import settings

# ── Константы ─────────────────────────────────────────────────────────────

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

ALGORITHM = "HS256"


# ── Создание токенов ──────────────────────────────────────────────────────

def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "jti": str(uuid.uuid4()),           # JWT ID — уникален для каждого токена
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def create_refresh_token(user_id: int, family_id: str | None = None) -> tuple[str, str]:
    """
    Возвращает (token, family_id).
    family_id передаётся при ротации — новый токен наследует семейство.
    При первом логине family_id=None → создаём новое семейство.
    """
    fid = family_id or str(uuid.uuid4())
    now = datetime.now(UTC)
    jti = str(uuid.uuid4())
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "fid": fid,
        "iat": now,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)
    return token, fid


# ── Декодирование и валидация ─────────────────────────────────────────────

class TokenError(Exception):
    """Базовое исключение для ошибок токена."""
    def __init__(self, message: str, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


def decode_token(token: str, expected_type: str) -> dict:
    """
    Декодирует и валидирует токен.
    Поднимает TokenError с правильным HTTP-кодом:
      401 Unauthorized — токен невалиден или истёк (нужна повторная аутентификация)
      403 Forbidden    — токен валиден, но доступ запрещён (не та роль/тип)
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise TokenError("Token has expired", status_code=401)
    except InvalidTokenError as exc:
        raise TokenError(f"Invalid token: {exc}", status_code=401)

    if payload.get("type") != expected_type:
        # Токен валиден, но не того типа — 403
        raise TokenError(
            f"Expected '{expected_type}' token, got '{payload.get('type')}'",
            status_code=403,
        )
    return payload`,
      },
      {
        filename: "app/auth/session_store.py",
        code: `"""
Redis-хранилище refresh-токенов.

Ключи Redis:
  refresh:{jti}         → user_id           TTL = 30 дней
  family:{fid}          → "active"|"blocked" TTL = 30 дней
  user_sessions:{uid}   → set of family_ids  (для logout all devices)

Алгоритм reuse detection:
  1. Клиент предъявляет refresh-токен с jti=J, fid=F
  2. Проверяем family:{F}:
     - "blocked" → кто-то уже использовал отозванный токен из этого семейства.
                   Завершаем все сессии пользователя. Отвечаем 401.
     - не существует → токен уже был инвалидирован при ротации. Reuse detected.
                       Блокируем family. Отвечаем 401.
  3. Проверяем refresh:{J}:
     - не существует → jti уже был использован (ротация). Блокируем family. 401.
  4. Всё ок → удаляем старый jti, создаём новый refresh (тот же fid), сохраняем.
"""

from datetime import timedelta

import redis.asyncio as aioredis

from app.core.redis import get_redis

REFRESH_TTL = int(timedelta(days=30).total_seconds())


class SessionStore:

    @property
    def redis(self) -> aioredis.Redis:
        return get_redis()

    # ── Сохранение / удаление ─────────────────────────────────────────────

    async def save_refresh_token(
        self, jti: str, fid: str, user_id: int
    ) -> None:
        """Атомарно сохраняем jti и активируем family."""
        pipe = self.redis.pipeline()
        pipe.set(f"refresh:{jti}", str(user_id), ex=REFRESH_TTL)
        # SETNX — создаём family только если не существует (ротация не перезаписывает)
        pipe.set(f"family:{fid}", "active", ex=REFRESH_TTL, nx=True)
        pipe.sadd(f"user_sessions:{user_id}", fid)
        pipe.expire(f"user_sessions:{user_id}", REFRESH_TTL)
        await pipe.execute()

    async def revoke_refresh_token(self, jti: str) -> None:
        """Удаляем jti после использования (ротация)."""
        await self.redis.delete(f"refresh:{jti}")

    # ── Валидация с reuse detection ───────────────────────────────────────

    async def validate_and_rotate(
        self, jti: str, fid: str
    ) -> str | None:
        """
        Проверяет refresh-токен и выполняет ротацию.

        Возвращает user_id при успехе.
        Возвращает None при reuse (семейство заблокировано, сессии завершены).

        Используем Lua для атомарности: проверка + удаление в одной операции.
        """
        LUA = """
        local family_key = KEYS[1]
        local jti_key    = KEYS[2]

        local family_status = redis.call('GET', family_key)
        -- Family заблокирована или не существует → reuse
        if family_status ~= 'active' then
            return nil
        end

        local user_id = redis.call('GET', jti_key)
        -- jti уже использован → reuse
        if not user_id then
            redis.call('SET', family_key, 'blocked', 'XX', 'KEEPTTL')
            return nil
        end

        -- Всё ок: удаляем использованный jti
        redis.call('DEL', jti_key)
        return user_id
        """
        result = await self.redis.eval(LUA, 2, f"family:{fid}", f"refresh:{jti}")  # type: ignore
        return result  # str(user_id) или None

    # ── Блокировка family (reuse detected) ───────────────────────────────

    async def block_family(self, fid: str) -> None:
        """Блокирует семейство токенов — все дальнейшие попытки будут отклонены."""
        await self.redis.set(f"family:{fid}", "blocked", xx=True, keepttl=True)

    # ── Logout ────────────────────────────────────────────────────────────

    async def revoke_family(self, fid: str) -> None:
        """Logout с одного устройства: удаляем family."""
        await self.redis.delete(f"family:{fid}")

    async def revoke_all_user_sessions(self, user_id: int) -> None:
        """Logout со всех устройств: блокируем все семейства пользователя."""
        sessions_key = f"user_sessions:{user_id}"
        family_ids = await self.redis.smembers(sessions_key)

        if family_ids:
            pipe = self.redis.pipeline()
            for fid in family_ids:
                pipe.set(f"family:{fid}", "blocked", xx=True, keepttl=True)
            pipe.delete(sessions_key)
            await pipe.execute()


session_store = SessionStore()`,
      },
      {
        filename: "app/auth/dependencies.py",
        code: `from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.tokens import TokenError, decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

# HTTPBearer автоматически извлекает токен из заголовка Authorization: Bearer <token>
# auto_error=False — не бросаем 403 сразу, обрабатываем сами для правильного кода
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Зависимость: извлекает и валидирует access-токен.
    401 — нет токена или токен невалиден/истёк.
    403 — токен валиден, но не того типа.
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(credentials.credentials, expected_type="access")
    except TokenError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload["sub"])
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        # Пользователь есть, но заблокирован — 403 (не 401)
        raise HTTPException(status_code=403, detail="User account is disabled")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Алиас — явно именован для читаемости в роутерах."""
    return current_user`,
      },
      {
        filename: "app/auth/router.py",
        code: `from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.session_store import session_store
from app.auth.tokens import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.database import get_db
from app.core.security import verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    user = await repo.get_by_email(payload.email)

    if not user or not verify_password(payload.password, user.hashed_password):
        # Одинаковый ответ для "нет пользователя" и "неверный пароль"
        # — не раскрываем существование аккаунта
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(user.id)
    refresh_token, fid = create_refresh_token(user.id)

    # Сохраняем refresh-токен в Redis
    from app.auth.tokens import decode_token as _dt
    rt_payload = _dt(refresh_token, "refresh")
    await session_store.save_refresh_token(
        jti=rt_payload["jti"], fid=fid, user_id=user.id
    )

    # Refresh-токен в httpOnly cookie — не доступен из JS
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,      # только HTTPS
        samesite="strict",
        max_age=30 * 24 * 3600,
    )

    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    request_obj: "Request",  # для чтения cookie
):
    from fastapi import Request as _Request
    refresh_token = request_obj.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except TokenError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))

    jti = payload["jti"]
    fid = payload["fid"]
    user_id = int(payload["sub"])

    # validate_and_rotate атомарно проверяет jti + family и удаляет старый jti
    result = await session_store.validate_and_rotate(jti=jti, fid=fid)

    if result is None:
        # Reuse detected: блокируем family и завершаем ВСЕ сессии пользователя
        await session_store.block_family(fid)
        await session_store.revoke_all_user_sessions(user_id)
        # Удаляем cookie
        response.delete_cookie("refresh_token")
        raise HTTPException(
            status_code=401,
            detail="Token reuse detected. All sessions have been terminated.",
        )

    # Ротация: создаём новую пару, старый jti уже удалён в Lua-скрипте
    new_access = create_access_token(user_id)
    new_refresh, _ = create_refresh_token(user_id, family_id=fid)  # тот же fid

    new_payload = decode_token(new_refresh, "refresh")
    await session_store.save_refresh_token(
        jti=new_payload["jti"], fid=fid, user_id=user_id
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=30 * 24 * 3600,
    )
    return TokenResponse(access_token=new_access, token_type="bearer")


@router.post("/logout")
async def logout(
    response: Response,
    request_obj: "Request",
    current_user: User = Depends(get_current_user),
):
    """Logout с текущего устройства."""
    refresh_token = request_obj.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_token(refresh_token, "refresh")
            await session_store.revoke_family(payload["fid"])
        except TokenError:
            pass   # токен уже невалиден — не страшно
    response.delete_cookie("refresh_token")
    return {"detail": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """Logout со всех устройств."""
    await session_store.revoke_all_user_sessions(current_user.id)
    response.delete_cookie("refresh_token")
    return {"detail": "All sessions terminated"}`,
      },
      {
        filename: "app/core/security.py",
        code: `from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)`,
      },
      {
        filename: "app/schemas/auth.py",
        code: `from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # refresh_token НЕ в теле ответа — только в httpOnly cookie`,
      },
    ],
    explanation: `**401 vs 403**: разница критична. \`401 Unauthorized\` — "я не знаю кто ты, аутентифицируйся". \`403 Forbidden\` — "я знаю кто ты, но у тебя нет доступа". Истёкший/невалидный токен → 401. Валидный токен, но заблокированный аккаунт → 403. Правило: если клиент может исправить ситуацию повторной аутентификацией — 401; если нет — 403.

**Token Family + Reuse Detection**: каждая сессия получает \`family_id\`. При ротации новый refresh наследует \`fid\` родителя, старый jti удаляется. Если злоумышленник перехватил старый refresh и предъявил его после ротации — jti уже не существует → reuse detected. Блокируем всё семейство: и токен жертвы (следующее обновление тоже заблокируется), и токен атакующего.

**Lua-скрипт для атомарности**: проверка family + получение user_id из jti + удаление jti должны быть атомарны. Без Lua: два параллельных запроса с одним refresh-токеном оба пройдут проверку до того, как первый успеет удалить jti — race condition. Lua-скрипт Redis выполняется в одном потоке, без прерываний.

**httpOnly cookie для refresh-токена**: JS-код на странице не может прочитать \`document.cookie\` для httpOnly. XSS-атака получает доступ к access-токену из памяти, но не к refresh-токену. Access живёт 15 минут — урон ограничен. \`SameSite=Strict\` блокирует CSRF: браузер не отправит cookie при кросс-сайтовом запросе.

**Refresh в cookie, Access в памяти**: access-токен возвращается в теле ответа и хранится в памяти JS (\`useState\`, \`useRef\`). При перезагрузке страницы — запрашивается новый access через \`/auth/refresh\` (refresh в cookie отправляется автоматически). Никаких токенов в \`localStorage\` — защита от XSS-кражи.`,
  },

  {
    id: "oauth2-social-login",
    title: "OAuth2 и Social Login",
    task: "Реализуйте OAuth2-аутентификацию через Google и GitHub. Используйте authlib или реализуйте flow вручную: authorization code flow с PKCE, обмен кода на токен, получение профиля пользователя, создание/привязка локального аккаунта, обработка конфликтов email. Реализуйте state parameter для CSRF-защиты. Поддержите multiple providers для одного аккаунта.",
    files: [
      {
        filename: "app/oauth/providers.py",
        code: `"""
OAuth2 Authorization Code Flow с PKCE — реализация вручную без authlib.

PKCE (Proof Key for Code Exchange):
  1. Клиент генерирует code_verifier (случайная строка 43-128 символов)
  2. code_challenge = BASE64URL(SHA256(code_verifier))
  3. Отправляет code_challenge в /authorize
  4. При обмене кода на токен — отправляет code_verifier
  5. Сервер провайдера проверяет: SHA256(verifier) == challenge
  
  Защищает от перехвата authorization code: без verifier код бесполезен.
"""

import base64
import hashlib
import os
import urllib.parse
from dataclasses import dataclass
from typing import Any


@dataclass
class OAuthProvider:
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scopes: list[str]

    def build_authorize_url(
        self,
        redirect_uri: str,
        state: str,
        code_challenge: str,
    ) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "state": state,
            # PKCE параметры
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        return f"{self.authorize_url}?{urllib.parse.urlencode(params)}"


def get_google_provider() -> OAuthProvider:
    from app.core.config import settings
    return OAuthProvider(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        userinfo_url="https://www.googleapis.com/oauth2/v3/userinfo",
        scopes=["openid", "email", "profile"],
    )


def get_github_provider() -> OAuthProvider:
    from app.core.config import settings
    return OAuthProvider(
        name="github",
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        authorize_url="https://github.com/login/oauth/authorize",
        token_url="https://github.com/login/oauth/access_token",
        userinfo_url="https://api.github.com/user",
        scopes=["read:user", "user:email"],
    )


PROVIDERS: dict[str, OAuthProvider] = {
    "google": get_google_provider(),
    "github": get_github_provider(),
}


# ── PKCE helpers ──────────────────────────────────────────────────────────

def generate_code_verifier() -> str:
    """RFC 7636: verifier — 43-128 символов из unreserved chars."""
    return base64.urlsafe_b64encode(os.urandom(32)).rstrip(b"=").decode()


def generate_code_challenge(verifier: str) -> str:
    """S256: BASE64URL(SHA256(ASCII(verifier)))"""
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def generate_state() -> str:
    """CSRF-защита: случайная строка, сохраняемая в сессии."""
    return base64.urlsafe_b64encode(os.urandom(16)).decode()`,
      },
      {
        filename: "app/oauth/state_store.py",
        code: `"""
Хранение OAuth state + PKCE verifier в Redis.

State живёт ровно столько, сколько нужно для завершения flow (10 минут).
После использования — удаляем (one-time use).
"""

import json

import redis.asyncio as aioredis

from app.core.redis import get_redis

STATE_TTL = 600   # 10 минут — достаточно для OAuth flow


class OAuthStateStore:
    @property
    def redis(self) -> aioredis.Redis:
        return get_redis()

    async def save(
        self,
        state: str,
        provider: str,
        code_verifier: str,
        redirect_after: str = "/",
    ) -> None:
        key = f"oauth_state:{state}"
        await self.redis.set(
            key,
            json.dumps({
                "provider": provider,
                "code_verifier": code_verifier,
                "redirect_after": redirect_after,
            }),
            ex=STATE_TTL,
        )

    async def consume(self, state: str) -> dict | None:
        """
        Атомарно читает и удаляет state (GETDEL).
        Возвращает None если state не найден или истёк.
        One-time use: повторное предъявление того же state невозможно.
        """
        key = f"oauth_state:{state}"
        raw = await self.redis.getdel(key)   # GETDEL — атомарный GET + DEL
        if raw is None:
            return None
        return json.loads(raw)


oauth_state_store = OAuthStateStore()`,
      },
      {
        filename: "app/oauth/client.py",
        code: `"""HTTP-клиент для обмена кода на токен и получения профиля."""

import httpx
from typing import Any


async def exchange_code_for_token(
    provider_token_url: str,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
    code_verifier: str,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            provider_token_url,
            data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier,   # PKCE: провайдер верифицирует
            },
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        return resp.json()


async def get_user_profile(
    userinfo_url: str,
    access_token: str,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            userinfo_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_github_emails(access_token: str) -> list[dict]:
    """
    GitHub не всегда возвращает email в /user.
    Отдельный запрос к /user/emails с scope user:email.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )
        resp.raise_for_status()
        return resp.json()`,
      },
      {
        filename: "app/oauth/normalizer.py",
        code: `"""Нормализует профили от разных провайдеров в единый формат."""

from dataclasses import dataclass
from typing import Any


@dataclass
class NormalizedProfile:
    provider: str
    provider_user_id: str   # уникальный id у провайдера
    email: str | None
    name: str | None
    avatar_url: str | None
    raw: dict                # исходные данные от провайдера


def normalize_google(data: dict[str, Any]) -> NormalizedProfile:
    return NormalizedProfile(
        provider="google",
        provider_user_id=data["sub"],
        email=data.get("email"),
        name=data.get("name"),
        avatar_url=data.get("picture"),
        raw=data,
    )


def normalize_github(
    data: dict[str, Any],
    emails: list[dict] | None = None,
) -> NormalizedProfile:
    # GitHub: email может быть в основном профиле или только в /user/emails
    email = data.get("email")
    if not email and emails:
        # Берём primary + verified email
        primary = next(
            (e["email"] for e in emails if e.get("primary") and e.get("verified")),
            None,
        )
        email = primary or (emails[0]["email"] if emails else None)

    return NormalizedProfile(
        provider="github",
        provider_user_id=str(data["id"]),
        email=email,
        name=data.get("name") or data.get("login"),
        avatar_url=data.get("avatar_url"),
        raw=data,
    )


NORMALIZERS = {
    "google": normalize_google,
    "github": normalize_github,
}`,
      },
      {
        filename: "app/oauth/router.py",
        code: `from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.router import _issue_tokens   # хелпер: создаёт пару токенов
from app.auth.tokens import create_access_token, create_refresh_token
from app.auth.session_store import session_store
from app.core.config import settings
from app.core.database import get_db
from app.oauth.client import exchange_code_for_token, get_github_emails, get_user_profile
from app.oauth.normalizer import NORMALIZERS
from app.oauth.providers import (
    PROVIDERS,
    generate_code_challenge,
    generate_code_verifier,
    generate_state,
)
from app.oauth.state_store import oauth_state_store
from app.repositories.oauth_account_repository import OAuthAccountRepository
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/oauth", tags=["OAuth"])


@router.get("/{provider}/authorize")
async def oauth_authorize(
    provider: str,
    redirect_after: str = "/",
):
    """
    Шаг 1: генерируем state + PKCE, редиректим на провайдера.
    """
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not supported")

    oauth_provider = PROVIDERS[provider]
    state = generate_state()
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    # Сохраняем state + verifier в Redis (one-time, TTL 10 мин)
    await oauth_state_store.save(
        state=state,
        provider=provider,
        code_verifier=code_verifier,
        redirect_after=redirect_after,
    )

    redirect_uri = f"{settings.base_url}/oauth/{provider}/callback"
    authorize_url = oauth_provider.build_authorize_url(
        redirect_uri=redirect_uri,
        state=state,
        code_challenge=code_challenge,
    )

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=authorize_url)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Шаг 2: callback от провайдера.
    Проверяем state, обмениваем code → token, получаем профиль,
    создаём/привязываем локальный аккаунт.
    """
    # 1. Валидируем state (CSRF) + получаем verifier (PKCE)
    state_data = await oauth_state_store.consume(state)
    if not state_data or state_data["provider"] != provider:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    oauth_provider = PROVIDERS[provider]
    redirect_uri = f"{settings.base_url}/oauth/{provider}/callback"

    # 2. Обмен code → access_token провайдера
    try:
        token_data = await exchange_code_for_token(
            provider_token_url=oauth_provider.token_url,
            client_id=oauth_provider.client_id,
            client_secret=oauth_provider.client_secret,
            code=code,
            redirect_uri=redirect_uri,
            code_verifier=state_data["code_verifier"],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {exc}")

    provider_access_token = token_data.get("access_token")

    # 3. Получаем профиль пользователя от провайдера
    raw_profile = await get_user_profile(oauth_provider.userinfo_url, provider_access_token)

    # GitHub: отдельный запрос для email если нужен
    emails = None
    if provider == "github" and not raw_profile.get("email"):
        emails = await get_github_emails(provider_access_token)

    normalizer = NORMALIZERS[provider]
    profile = normalizer(raw_profile, emails) if provider == "github" else normalizer(raw_profile)

    # 4. Создаём/привязываем аккаунт
    user_repo = UserRepository(db)
    oauth_repo = OAuthAccountRepository(db)

    # Ищем существующую OAuth-привязку
    oauth_account = await oauth_repo.get(provider=provider, provider_user_id=profile.provider_user_id)

    if oauth_account:
        # Уже привязан → просто логиним
        user = await user_repo.get_by_id(oauth_account.user_id)
    else:
        # Новая OAuth-привязка
        if profile.email:
            # Проверяем: есть ли локальный аккаунт с таким email
            existing_user = await user_repo.get_by_email(profile.email)
            if existing_user:
                # Привязываем OAuth к существующему аккаунту
                user = existing_user
            else:
                # Создаём новый аккаунт
                user = await user_repo.create(
                    email=profile.email,
                    name=profile.name or profile.email.split("@")[0],
                    avatar_url=profile.avatar_url,
                    is_verified=True,   # email подтверждён провайдером
                )
        else:
            # Провайдер не вернул email — создаём без него
            user = await user_repo.create(
                email=None,
                name=profile.name,
                avatar_url=profile.avatar_url,
            )

        # Сохраняем OAuth-привязку
        await oauth_repo.create(
            user_id=user.id,
            provider=provider,
            provider_user_id=profile.provider_user_id,
            access_token=provider_access_token,
        )
        await db.commit()

    # 5. Выдаём наши JWT-токены
    access_token = create_access_token(user.id)
    refresh_token, fid = create_refresh_token(user.id)
    rt_payload = __import__("app.auth.tokens", fromlist=["decode_token"]).decode_token(refresh_token, "refresh")
    await session_store.save_refresh_token(jti=rt_payload["jti"], fid=fid, user_id=user.id)

    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="strict", max_age=30*24*3600)

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{state_data['redirect_after']}?access_token={access_token}")`,
      },
      {
        filename: "app/models/oauth_account.py",
        code: `"""
OAuthAccount — связь между локальным User и OAuth-провайдером.
Один пользователь может иметь несколько провязок (Google + GitHub).
"""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class OAuthAccount(Base, TimestampMixin):
    __tablename__ = "oauth_accounts"
    __table_args__ = (
        # Один провайдер — один аккаунт у этого провайдера
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(String(50))          # "google", "github"
    provider_user_id: Mapped[str] = mapped_column(String(255)) # id у провайдера
    # access_token провайдера — для доступа к API провайдера от имени пользователя
    # Храним в зашифрованном виде (в реальном проекте — Vault / KMS)
    access_token: Mapped[str | None] = mapped_column(String(2048))

    user: Mapped["User"] = relationship(back_populates="oauth_accounts", lazy="raise")`,
      },
    ],
    explanation: `**Authorization Code Flow + PKCE**: классический OAuth2 flow для серверных приложений. PKCE (RFC 7636) добавляет защиту: \`code_challenge\` отправляется провайдеру при старте, \`code_verifier\` — при обмене кода. Даже если authorization code перехвачен (open redirect, referer header), без verifier он бесполезен. S256: \`BASE64URL(SHA256(verifier))\` — провайдер хэширует verifier и сравнивает с challenge.

**State parameter (CSRF-защита)**: state — случайная строка, хранится в Redis с TTL. Провайдер возвращает её в callback. Если state в callback не совпадает с сохранённым — атака CSRF: злоумышленник подсунул свой authorization code. \`GETDEL\` в Redis делает state одноразовым — повторный callback с тем же state провалится.

**Конфликт email при OAuth**: если пользователь ранее зарегистрировался с email=user@gmail.com, а потом входит через Google (тот же email) — мы привязываем OAuth к существующему аккаунту, не создаём дубль. Это UX-решение, альтернатива — предложить явно слить аккаунты.

**Multiple providers**: таблица \`oauth_accounts\` — отдельная сущность. Один \`User\` → много \`OAuthAccount\`. \`UniqueConstraint("provider", "provider_user_id")\` гарантирует что один OAuth-аккаунт привязан только к одному локальному пользователю. Для поиска: сначала ищем OAuth-привязку по (provider, provider_user_id), затем User по user_id.

**GitHub email quirk**: GitHub по умолчанию не возвращает email если пользователь скрыл его в настройках. Нужен отдельный запрос к \`/user/emails\` со scope \`user:email\`. Берём primary+verified email из списка.`,
  },

  {
    id: "rbac-permissions",
    title: "Система разрешений и RBAC",
    task: "Реализуйте гибкую систему разрешений поверх FastAPI Depends. Roles: admin, moderator, user. Permissions: articles:read, articles:write, articles:delete. Реализуйте: проверку разрешений как DI-зависимость (require_permission(\"articles:write\")), row-level security (пользователь видит только свои ресурсы), делегирование прав, временные разрешения с TTL, аудит всех проверок прав.",
    files: [
      {
        filename: "app/rbac/permissions.py",
        code: `"""
RBAC: Role-Based Access Control с поддержкой:
- Статических разрешений через роли
- Временных разрешений с TTL
- Делегирования разрешений
- Row-level security

Иерархия:
  Role → set[Permission]
  User → set[Role] + set[TemporaryPermission]

Permission format: "<resource>:<action>"
  articles:read, articles:write, articles:delete
  users:read, users:manage
  admin:*  — wildcard (все разрешения ресурса)
"""

from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"


class Permission(StrEnum):
    # Articles
    ARTICLES_READ = "articles:read"
    ARTICLES_WRITE = "articles:write"
    ARTICLES_DELETE = "articles:delete"
    ARTICLES_PUBLISH = "articles:publish"
    # Users
    USERS_READ = "users:read"
    USERS_MANAGE = "users:manage"
    # Comments
    COMMENTS_READ = "comments:read"
    COMMENTS_WRITE = "comments:write"
    COMMENTS_DELETE = "comments:delete"
    COMMENTS_MODERATE = "comments:moderate"


# Матрица ролей: какие permissions получает каждая роль
ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.ADMIN: frozenset(Permission),   # все разрешения

    Role.MODERATOR: frozenset({
        Permission.ARTICLES_READ,
        Permission.ARTICLES_WRITE,
        Permission.ARTICLES_DELETE,
        Permission.ARTICLES_PUBLISH,
        Permission.COMMENTS_READ,
        Permission.COMMENTS_WRITE,
        Permission.COMMENTS_DELETE,
        Permission.COMMENTS_MODERATE,
        Permission.USERS_READ,
    }),

    Role.USER: frozenset({
        Permission.ARTICLES_READ,
        Permission.ARTICLES_WRITE,   # создать, но не удалить чужие
        Permission.COMMENTS_READ,
        Permission.COMMENTS_WRITE,
    }),
}


def get_role_permissions(role: Role) -> frozenset[Permission]:
    return ROLE_PERMISSIONS.get(role, frozenset())


def has_permission(
    user_roles: list[Role],
    permission: Permission,
    extra_permissions: set[Permission] | None = None,
) -> bool:
    """
    Проверяет разрешение с учётом:
    - статических разрешений ролей
    - дополнительных (временных/делегированных) разрешений
    """
    # Проверяем статические разрешения ролей
    for role in user_roles:
        if permission in get_role_permissions(role):
            return True
    # Проверяем дополнительные разрешения
    if extra_permissions and permission in extra_permissions:
        return True
    return False`,
      },
      {
        filename: "app/rbac/models.py",
        code: `from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class UserRole(Base, TimestampMixin):
    """Связь пользователь ↔ роль."""
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role", name="uq_user_role"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(50))
    granted_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class TemporaryPermission(Base):
    """
    Временное разрешение с TTL — истекает в expires_at.
    Используется для делегирования: "дать модератору право удалять статьи на 24ч".
    """
    __tablename__ = "temporary_permissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    permission: Mapped[str] = mapped_column(String(100))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    granted_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str | None] = mapped_column(String(500))

    @property
    def is_active(self) -> bool:
        from datetime import UTC
        return datetime.now(UTC) < self.expires_at


class PermissionAuditLog(Base):
    """
    Аудит-лог всех проверок разрешений.
    Что, кто, когда, результат — для compliance и forensics.
    """
    __tablename__ = "permission_audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    permission: Mapped[str] = mapped_column(String(100))
    resource_type: Mapped[str | None] = mapped_column(String(100))
    resource_id: Mapped[int | None] = mapped_column()
    granted: Mapped[bool]
    reason: Mapped[str | None] = mapped_column(String(500))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
    )`,
      },
      {
        filename: "app/rbac/dependencies.py",
        code: `"""
RBAC как FastAPI Depends.

require_permission("articles:write") — фабрика зависимостей.
Возвращает зависимость которая:
  1. Получает текущего пользователя
  2. Загружает его роли + временные разрешения
  3. Проверяет permission
  4. Пишет в audit log
  5. Бросает 403 при отказе
"""

from datetime import datetime, UTC
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.rbac.models import PermissionAuditLog, TemporaryPermission, UserRole
from app.rbac.permissions import Permission, Role, has_permission


async def _get_user_roles(user_id: int, db: AsyncSession) -> list[Role]:
    result = await db.execute(
        select(UserRole.role).where(UserRole.user_id == user_id)
    )
    return [Role(row.role) for row in result]


async def _get_temporary_permissions(user_id: int, db: AsyncSession) -> set[Permission]:
    """Активные временные разрешения (не истёкшие)."""
    now = datetime.now(UTC)
    result = await db.execute(
        select(TemporaryPermission.permission)
        .where(TemporaryPermission.user_id == user_id)
        .where(TemporaryPermission.expires_at > now)
    )
    return {Permission(row.permission) for row in result}


async def _audit(
    db: AsyncSession,
    user_id: int | None,
    permission: str,
    granted: bool,
    resource_type: str | None = None,
    resource_id: int | None = None,
    reason: str | None = None,
    ip_address: str | None = None,
) -> None:
    """Асинхронная запись в audit log. Не блокирует основной запрос."""
    log = PermissionAuditLog(
        user_id=user_id,
        permission=permission,
        resource_type=resource_type,
        resource_id=resource_id,
        granted=granted,
        reason=reason,
        ip_address=ip_address,
    )
    db.add(log)
    # Не делаем commit здесь — он произойдёт вместе с основной транзакцией запроса


def require_permission(
    permission: Permission,
    resource_type: str | None = None,
) -> Callable:
    """
    Фабрика зависимостей для проверки разрешений.

    Использование:
        @router.post("/articles")
        async def create_article(
            _: None = Depends(require_permission(Permission.ARTICLES_WRITE)),
            current_user: User = Depends(get_current_user),
        ):
            ...
    """
    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        roles = await _get_user_roles(current_user.id, db)
        temp_perms = await _get_temporary_permissions(current_user.id, db)

        granted = has_permission(roles, permission, temp_perms)
        ip = request.client.host if request.client else None

        await _audit(
            db=db,
            user_id=current_user.id,
            permission=permission,
            granted=granted,
            resource_type=resource_type,
            ip_address=ip,
            reason="role_check",
        )

        if not granted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required",
            )

        return current_user  # возвращаем пользователя для удобства

    return dependency


def require_any_permission(*permissions: Permission) -> Callable:
    """Достаточно любого из перечисленных разрешений."""
    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        roles = await _get_user_roles(current_user.id, db)
        temp_perms = await _get_temporary_permissions(current_user.id, db)

        for perm in permissions:
            if has_permission(roles, perm, temp_perms):
                ip = request.client.host if request.client else None
                await _audit(db, current_user.id, perm, True, ip_address=ip, reason="any_check")
                return current_user

        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return dependency`,
      },
      {
        filename: "app/rbac/row_level.py",
        code: `"""
Row-Level Security (RLS): пользователь видит/изменяет только свои ресурсы.
Реализован через Depends-фабрики, которые возвращают проверенный объект.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.article import Article
from app.models.user import User
from app.rbac.permissions import Permission, Role, has_permission
from app.rbac.dependencies import _get_user_roles
from app.repositories.article_repository import ArticleRepository


def get_own_article(permission_for_others: Permission | None = None):
    """
    Фабрика зависимостей для row-level security на статьях.

    Логика:
    - Всегда разрешаем доступ к своей статье
    - Для чужих статей: проверяем permission_for_others (если задан)
    - Если permission_for_others=None — только свои

    Использование:
        # Только свои статьи
        @router.delete("/{article_id}")
        async def delete(article = Depends(get_own_article())):
            ...

        # Свои + модераторы/админы могут удалять любые
        @router.delete("/{article_id}")
        async def delete(
            article = Depends(get_own_article(Permission.ARTICLES_DELETE))
        ):
            ...
    """
    async def dependency(
        article_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> Article:
        repo = ArticleRepository(db)
        article = await repo.get_or_raise(article_id)

        # Своя статья — всегда разрешено
        if article.author_id == current_user.id:
            return article

        # Чужая: проверяем permission
        if permission_for_others is not None:
            roles = await _get_user_roles(current_user.id, db)
            if has_permission(roles, permission_for_others):
                return article

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this resource",
        )

    return dependency`,
      },
      {
        filename: "app/rbac/delegation.py",
        code: `"""
Делегирование разрешений: пользователь A временно передаёт право B.

Ограничения:
- Нельзя делегировать разрешение которого у тебя нет
- Нельзя делегировать дольше чем у тебя остаётся (нет "privilege escalation through time")
- Аудит: кто, кому, что, на сколько
"""

from datetime import datetime, timedelta, UTC

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.rbac.dependencies import (
    _get_temporary_permissions,
    _get_user_roles,
)
from app.rbac.models import TemporaryPermission
from app.rbac.permissions import Permission, has_permission

router = APIRouter(prefix="/permissions", tags=["Permissions"])


class DelegateRequest(BaseModel):
    target_user_id: int
    permission: Permission
    duration_hours: int        # на сколько часов
    reason: str | None = None


@router.post("/delegate", status_code=status.HTTP_201_CREATED)
async def delegate_permission(
    payload: DelegateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Текущий пользователь делегирует разрешение другому.
    """
    # Проверяем что у делегирующего есть это право
    roles = await _get_user_roles(current_user.id, db)
    temp_perms = await _get_temporary_permissions(current_user.id, db)

    if not has_permission(roles, payload.permission, temp_perms):
        raise HTTPException(
            status_code=403,
            detail="You cannot delegate a permission you don't have",
        )

    # Ограничиваем длительность: не дольше 7 дней
    if payload.duration_hours > 24 * 7:
        raise HTTPException(
            status_code=400,
            detail="Maximum delegation duration is 7 days",
        )

    expires_at = datetime.now(UTC) + timedelta(hours=payload.duration_hours)

    temp_perm = TemporaryPermission(
        user_id=payload.target_user_id,
        permission=payload.permission,
        expires_at=expires_at,
        granted_by_id=current_user.id,
        reason=payload.reason,
    )
    db.add(temp_perm)
    await db.commit()

    return {
        "detail": "Permission delegated",
        "permission": payload.permission,
        "expires_at": expires_at.isoformat(),
    }


@router.delete("/delegate/{permission_id}")
async def revoke_delegation(
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отзываем делегированное разрешение досрочно."""
    from sqlalchemy import select
    result = await db.execute(
        select(TemporaryPermission).where(TemporaryPermission.id == permission_id)
    )
    temp_perm = result.scalar_one_or_none()

    if not temp_perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    # Только тот кто выдал, или admin
    roles = await _get_user_roles(current_user.id, db)
    from app.rbac.permissions import Role
    is_admin = Role.ADMIN in roles
    if temp_perm.granted_by_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Cannot revoke this delegation")

    await db.delete(temp_perm)
    await db.commit()
    return {"detail": "Delegation revoked"}`,
      },
      {
        filename: "app/articles/router.py",
        code: `"""Пример использования всех RBAC-паттернов в одном роутере."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.article import Article
from app.models.user import User
from app.rbac.dependencies import require_permission
from app.rbac.permissions import Permission
from app.rbac.row_level import get_own_article
from app.repositories.article_repository import ArticleRepository

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.get("/")
async def list_articles(
    db: AsyncSession = Depends(get_db),
    # Читать статьи может любой аутентифицированный пользователь
    current_user: User = Depends(require_permission(Permission.ARTICLES_READ)),
):
    repo = ArticleRepository(db)
    return await repo.get_all(limit=20)


@router.post("/", status_code=201)
async def create_article(
    # Писать могут все у кого есть articles:write
    current_user: User = Depends(require_permission(Permission.ARTICLES_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    ...


@router.put("/{article_id}")
async def update_article(
    # RLS: только автор или тот у кого есть articles:write (модератор/админ)
    article: Article = Depends(get_own_article(Permission.ARTICLES_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    """Автор редактирует свою, модератор — любую."""
    ...


@router.delete("/{article_id}")
async def delete_article(
    # RLS: только автор или тот у кого есть articles:delete
    article: Article = Depends(get_own_article(Permission.ARTICLES_DELETE)),
    db: AsyncSession = Depends(get_db),
):
    ...


@router.post("/{article_id}/publish")
async def publish_article(
    article_id: int,
    # Публиковать могут только модераторы и выше
    current_user: User = Depends(require_permission(Permission.ARTICLES_PUBLISH)),
    db: AsyncSession = Depends(get_db),
):
    ...`,
      },
    ],
    explanation: `**Фабрика зависимостей**: \`require_permission(Permission.ARTICLES_WRITE)\` возвращает новую async-функцию при каждом вызове. FastAPI кэширует зависимости по идентичности объекта — каждый вызов фабрики создаёт уникальный объект, поэтому кэширование не мешает. Зависимость возвращает \`User\` — можно использовать и как проверку, и как источник текущего пользователя.

**Временные разрешения**: хранятся в PostgreSQL с \`expires_at\`. При каждой проверке делаем запрос с \`WHERE expires_at > NOW()\`. Для высоконагруженных систем — кэшируйте в Redis с TTL равным \`expires_at - now()\`. При делегировании нельзя выдать разрешение которого у вас нет (no privilege escalation) и нельзя выдать на срок дольше 7 дней.

**Row-level security через Depends**: \`get_own_article(permission_for_others)\` — фабрика которая возвращает зависимость. Зависимость загружает ресурс, проверяет владельца, при необходимости проверяет дополнительное разрешение. Логика RLS не дублируется в каждом endpoint — декларативно через параметр фабрики.

**Audit log**: пишется в той же транзакции что и основная операция — атомарно. Если запрос откатится, откатится и запись в лог. Для систем где аудит критически важен (compliance, forensics) — используйте отдельную транзакцию или запись через фоновую задачу в append-only хранилище.

**ROLE_PERMISSIONS как frozenset**: неизменяемые множества, определённые один раз при старте приложения. Проверка \`permission in frozenset\` — O(1). Матрица ролей — единственная точка правды. Добавить новое разрешение: 1) добавить в \`Permission\`, 2) добавить в нужные роли в \`ROLE_PERMISSIONS\`. Никаких изменений в коде endpoint-ов.`,
  },

  {
    id: "api-security-hardening",
    title: "Защита от атак и безопасность API",
    task: "Проведите hardening FastAPI-приложения. Реализуйте: rate limiting на уровне IP и пользователя через Redis, защиту от brute force на /auth/login (exponential backoff + captcha после N попыток), Input sanitization и защиту от injection через параметризованные запросы, корректные CORS-заголовки с whitelist, security headers (CSP, HSTS, X-Frame-Options), сокрытие технических деталей из error responses.",
    files: [
      {
        filename: "app/middleware/security_headers.py",
        code: `"""
Security headers middleware.
Добавляет заголовки безопасности к каждому ответу.
Монтируется один раз — не нужно трогать каждый endpoint.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Запрещает браузеру угадывать Content-Type (MIME sniffing атаки)
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Блокирует встраивание страницы в <iframe> (clickjacking)
        response.headers["X-Frame-Options"] = "DENY"

        # XSS-фильтр браузера (legacy, CSP важнее)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # HTTPS обязателен минимум 1 год, включая субдомены
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Не отправлять Referer при переходе на внешние сайты
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Запрет браузерных API по умолчанию (камера, геолокация и т.д.)
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Content Security Policy: разрешаем ресурсы только со своего домена.
        # 'self' — текущий origin. Для API-only сервиса это максимально строго.
        # Для приложений с JS/CSS — расширяйте под свои нужды.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "   # дублирует X-Frame-Options для CSP2+
            "base-uri 'self'; "
            "form-action 'self'"
        )

        # Скрываем информацию о сервере (убираем "uvicorn" из Server-заголовка)
        response.headers.pop("server", None)

        return response`,
      },
      {
        filename: "app/middleware/cors.py",
        code: `"""
CORS-конфигурация с явным whitelist.

НЕ используйте allow_origins=["*"] для API с аутентификацией:
браузер отправит cookies/credentials на любой домен.
Whitelist — единственный безопасный подход для credentialed requests.
"""

from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app, allowed_origins: list[str]) -> None:
    app.add_middleware(
        CORSMiddleware,
        # Явный список доменов — никаких wildcards
        allow_origins=allowed_origins,
        # True — разрешаем cookies и Authorization header в кросс-доменных запросах.
        # Требует явного списка в allow_origins (несовместимо с "*")
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Authorization",
            "Content-Type",
            "X-Request-ID",    # трассировка запросов
            "X-CSRF-Token",
        ],
        # Заголовки которые браузер может читать из ответа
        expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
        # Кэш preflight-ответа на 1 час (уменьшает число OPTIONS запросов)
        max_age=3600,
    )


# В main.py:
# from app.core.config import settings
# setup_cors(app, allowed_origins=settings.cors_allowed_origins)
#
# settings.cors_allowed_origins = [
#     "https://app.example.com",
#     "https://admin.example.com",
# ]
# В development добавляем "http://localhost:3000"`,
      },
      {
        filename: "app/middleware/error_handler.py",
        code: `"""
Централизованная обработка ошибок.

Принципы:
- Пользователь видит безопасное сообщение без технических деталей
- Разработчик видит полный traceback в логах
- request_id позволяет найти запрос в логах по id из ответа клиента
- В development — показываем детали; в production — скрываем
"""

import traceback
import uuid

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

import logging

logger = logging.getLogger(__name__)


def setup_error_handlers(app: FastAPI) -> None:

    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        """Добавляет уникальный ID к каждому запросу — для трассировки."""
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        request_id = getattr(request.state, "request_id", "unknown")
        # HTTP-ошибки — клиентские, логируем на уровне WARNING
        logger.warning(
            "HTTP %d: %s | path=%s | request_id=%s",
            exc.status_code, exc.detail, request.url.path, request_id,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": _safe_http_message(exc.status_code),
                "detail": exc.detail,   # detail из HTTPException — уже безопасен
                "request_id": request_id,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Pydantic validation errors — 422, показываем что именно невалидно."""
        request_id = getattr(request.state, "request_id", "unknown")
        # Очищаем значения из ошибок — не логируем пользовательские данные
        safe_errors = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation failed",
                "errors": safe_errors,
                "request_id": request_id,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """Все необработанные исключения — 500, технические детали только в логах."""
        request_id = getattr(request.state, "request_id", "unknown")
        # Полный traceback — только в логах, никогда в ответе клиенту
        logger.error(
            "Unhandled exception | path=%s | request_id=%s\n%s",
            request.url.path,
            request_id,
            traceback.format_exc(),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                # Ни stacktrace, ни имена классов, ни SQL — ничего технического
                "error": "Internal server error",
                "request_id": request_id,   # клиент отправляет в поддержку
            },
        )


def _safe_http_message(status_code: int) -> str:
    messages = {
        400: "Bad request",
        401: "Authentication required",
        403: "Access denied",
        404: "Not found",
        405: "Method not allowed",
        409: "Conflict",
        410: "Gone",
        422: "Validation failed",
        429: "Too many requests",
        500: "Internal server error",
        502: "Bad gateway",
        503: "Service unavailable",
    }
    return messages.get(status_code, "Error")`,
      },
      {
        filename: "app/auth/brute_force.py",
        code: `"""
Защита от brute force на /auth/login:

Стратегия:
  1-4 попытки:  немедленный ответ (нет задержки)
  5-9 попытки:  exponential backoff (2, 4, 8, 16, 32 сек)
  10+ попытки:  аккаунт временно заблокирован + требуем captcha
  20+ попытки:  IP блокируется на 24 часа

Счётчики хранятся в Redis с автоматическим TTL — сбрасываются сами.
При успешном входе — счётчик обнуляется.
"""

import asyncio
import time
from dataclasses import dataclass

import redis.asyncio as aioredis

from app.core.redis import get_redis

# ── Пороги ───────────────────────────────────────────────────────────────────

BACKOFF_START = 5          # с этой попытки начинается backoff
CAPTCHA_START = 10         # с этой попытки требуем captcha
IP_BLOCK_START = 20        # с этой попытки блокируем IP
ACCOUNT_LOCK_TTL = 900     # 15 минут блокировки аккаунта
IP_BLOCK_TTL = 86400       # 24 часа блокировки IP
ATTEMPT_WINDOW = 3600      # окно подсчёта попыток (1 час)


@dataclass
class LoginCheckResult:
    allowed: bool
    requires_captcha: bool
    locked_until: float | None    # timestamp разблокировки
    wait_seconds: float           # сколько ждать перед следующей попыткой


class BruteForceProtection:

    @property
    def redis(self) -> aioredis.Redis:
        return get_redis()

    def _email_key(self, email: str) -> str:
        import hashlib
        # Хэшируем email — не храним PII в Redis-ключах
        h = hashlib.sha256(email.lower().encode()).hexdigest()[:16]
        return f"bf:email:{h}"

    def _ip_key(self, ip: str) -> str:
        return f"bf:ip:{ip}"

    def _ip_block_key(self, ip: str) -> str:
        return f"bf:ip_block:{ip}"

    async def check_and_increment(
        self, email: str, ip: str
    ) -> LoginCheckResult:
        """
        Проверяет лимиты и инкрементирует счётчик попыток.
        Вызывается ДО проверки пароля.
        """
        # Проверяем блокировку IP
        if await self.redis.exists(self._ip_block_key(ip)):
            return LoginCheckResult(
                allowed=False,
                requires_captcha=False,
                locked_until=time.time() + IP_BLOCK_TTL,
                wait_seconds=IP_BLOCK_TTL,
            )

        pipe = self.redis.pipeline()
        email_key = self._email_key(email)
        ip_key = self._ip_key(ip)

        # Атомарно инкрементируем оба счётчика
        pipe.incr(email_key)
        pipe.expire(email_key, ATTEMPT_WINDOW)
        pipe.incr(ip_key)
        pipe.expire(ip_key, ATTEMPT_WINDOW)
        results = await pipe.execute()

        email_count = int(results[0])
        ip_count = int(results[2])
        count = max(email_count, ip_count)

        # IP-блокировка при превышении порога
        if ip_count >= IP_BLOCK_START:
            await self.redis.set(self._ip_block_key(ip), "1", ex=IP_BLOCK_TTL)
            return LoginCheckResult(
                allowed=False,
                requires_captcha=False,
                locked_until=time.time() + IP_BLOCK_TTL,
                wait_seconds=IP_BLOCK_TTL,
            )

        # Временная блокировка аккаунта
        if email_count >= CAPTCHA_START:
            locked_until = time.time() + ACCOUNT_LOCK_TTL
            return LoginCheckResult(
                allowed=False,
                requires_captcha=True,
                locked_until=locked_until,
                wait_seconds=ACCOUNT_LOCK_TTL,
            )

        # Exponential backoff
        if count >= BACKOFF_START:
            backoff = min(2 ** (count - BACKOFF_START), 32)
            # Добавляем jitter ±20% чтобы не все клиенты пришли одновременно
            import random
            jitter = backoff * 0.2 * (random.random() * 2 - 1)
            wait = backoff + jitter
            await asyncio.sleep(wait)

        return LoginCheckResult(
            allowed=True,
            requires_captcha=count >= CAPTCHA_START - 2,  # предупреждаем заранее
            locked_until=None,
            wait_seconds=0,
        )

    async def reset(self, email: str, ip: str) -> None:
        """Сбрасываем счётчики после успешного входа."""
        pipe = self.redis.pipeline()
        pipe.delete(self._email_key(email))
        pipe.delete(self._ip_key(ip))
        await pipe.execute()


brute_force = BruteForceProtection()`,
      },
      {
        filename: "app/auth/login_protected.py",
        code: `"""
/auth/login с полной защитой от brute force.
Заменяет наивную реализацию из router.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.brute_force import brute_force
from app.auth.session_store import session_store
from app.auth.tokens import create_access_token, create_refresh_token, decode_token
from app.core.database import get_db
from app.core.security import verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"

    # 1. Проверка brute force ДО проверки пароля
    check = await brute_force.check_and_increment(
        email=payload.email, ip=client_ip
    )

    if not check.allowed:
        headers = {}
        if check.locked_until:
            headers["Retry-After"] = str(int(check.wait_seconds))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Too many login attempts. Try again later.",
                # Не указываем точное время чтобы не облегчать timing-атаки
                "requires_captcha": check.requires_captcha,
            },
            headers=headers,
        )

    # 2. Проверяем credentials
    repo = UserRepository(db)
    user = await repo.get_by_email(payload.email)

    if not user or not verify_password(payload.password, user.hashed_password):
        # Одинаковый ответ для "нет пользователя" и "неверный пароль"
        # Одинаковая задержка (уже выполнена в check_and_increment)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # 3. Успешный вход — сбрасываем счётчики
    await brute_force.reset(email=payload.email, ip=client_ip)

    # 4. Выдаём токены
    access_token = create_access_token(user.id)
    refresh_token, fid = create_refresh_token(user.id)
    rt_payload = decode_token(refresh_token, "refresh")
    await session_store.save_refresh_token(
        jti=rt_payload["jti"], fid=fid, user_id=user.id
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=30 * 24 * 3600,
    )
    return TokenResponse(access_token=access_token, token_type="bearer")`,
      },
      {
        filename: "app/main.py",
        code: `from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.middleware.cors import setup_cors
from app.middleware.error_handler import setup_error_handlers
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown
    from app.core.redis import close_redis
    await close_redis()


app = FastAPI(
    title="Secure API",
    # В production отключаем /docs и /redoc — не раскрываем схему API публично
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    # Отключаем стандартную OpenAPI-схему в production
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# Порядок middleware важен: выполняются в обратном порядке добавления
# (последний добавленный — первый выполняется)

# 1. Security headers — оборачивает все ответы
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS — должен быть до бизнес-логики
setup_cors(app, allowed_origins=settings.cors_allowed_origins)

# 3. Error handlers — перехватывают исключения до клиента
setup_error_handlers(app)

# Роутеры
from app.auth.login_protected import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["Auth"])`,
      },
      {
        filename: "app/core/input_validation.py",
        code: `"""
Input sanitization: дополнительный слой поверх Pydantic.

Pydantic уже защищает от неправильных типов.
Этот модуль добавляет:
- Ограничение длины строк (DOS через гигантский input)
- Нормализацию Unicode (гомогляф-атаки: "аdmin" с кириллической "а")
- Базовую проверку на SQL/HTML-инъекции (defence in depth)
  (основная защита — параметризованные запросы SQLAlchemy)
"""

import unicodedata
import re
from typing import Annotated

from pydantic import AfterValidator, Field


def normalize_unicode(value: str) -> str:
    """
    NFC-нормализация: разные Unicode-представления одного символа
    превращаются в каноническую форму.
    Пример: é (e + combining accent) → é (precomposed)
    """
    return unicodedata.normalize("NFC", value)


def strip_control_chars(value: str) -> str:
    """Удаляем control characters (\\x00-\\x1f, \\x7f) кроме \\t\\n\\r."""
    return re.sub(r"[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]", "", value)


def validate_no_null_bytes(value: str) -> str:
    """Null bytes в строках — признак попытки инъекции."""
    if "\\x00" in value or "\\0" in value:
        raise ValueError("Null bytes are not allowed")
    return value


# Типы-алиасы для использования в Pydantic-схемах
SafeStr = Annotated[
    str,
    AfterValidator(normalize_unicode),
    AfterValidator(strip_control_chars),
    AfterValidator(validate_no_null_bytes),
    Field(max_length=1000),
]

EmailStr = Annotated[
    str,
    AfterValidator(lambda v: v.lower().strip()),
    Field(max_length=255),
]

SearchQuery = Annotated[
    str,
    AfterValidator(strip_control_chars),
    Field(min_length=1, max_length=200),
]


# ── Параметризованные запросы — главная защита от SQL injection ───────────────
#
# ВСЕГДА используйте SQLAlchemy параметры вместо f-строк:
#
# ПЛОХО (SQL injection):
#   await db.execute(text(f"SELECT * FROM users WHERE email = '{email}'"))
#
# ХОРОШО (параметризованный запрос):
#   await db.execute(
#       select(User).where(User.email == email)
#   )
#
# ХОРОШО (явный text с параметром):
#   await db.execute(
#       text("SELECT * FROM users WHERE email = :email"),
#       {"email": email}
#   )`,
      },
    ],
    explanation: `**Security headers через middleware**: один класс защищает все endpoint-ы. \`X-Content-Type-Options: nosniff\` — браузер не угадывает MIME-тип (MIME confusion атаки). \`X-Frame-Options: DENY\` — страница не может быть встроена в iframe (clickjacking). \`Strict-Transport-Security\` — браузер запоминает что сайт только HTTPS (HSTS preloading). \`Content-Security-Policy\` — белый список источников для скриптов/стилей/картинок.

**CORS с allow_credentials=True требует явного списка origins**: спецификация запрещает \`Access-Control-Allow-Origin: *\` совместно с \`Access-Control-Allow-Credentials: true\`. Если попытаться — браузер заблокирует запрос. Whitelist + credentials = единственная безопасная комбинация для API с куки/токенами.

**Brute force: exponential backoff с jitter**: \`2^(attempt-5)\` секунд начиная с 5-й попытки: 2, 4, 8, 16, 32 сек. Jitter ±20% предотвращает thundering herd — когда все клиенты одновременно ретраятся после одного и того же backoff. Счётчики хранятся отдельно по email и IP — атака с разных IP на один аккаунт (credential stuffing) поймается по email-счётчику.

**Одинаковый ответ для "нет пользователя" и "неверный пароль"**: различие в ответах позволяет атакующему перебирать существующие email-адреса (username enumeration). Одинаковый текст + одинаковая задержка (backoff выполняется до проверки пароля) — нет observable difference.

**Сокрытие деталей в 500**: \`traceback.format_exc()\` только в логах. Клиент получает \`{"error": "Internal server error", "request_id": "..."\}\`. По request_id разработчик находит точный traceback в логах. Стек вызовов и имена внутренних модулей не раскрываются — не помогаем атакующему.

**Unicode normalization**: гомогляф-атаки используют похожие символы из разных алфавитов (\`аdmin\` с кириллической 'а' ≠ \`admin\`). NFC-нормализация приводит все представления к единой канонической форме. \`strip_control_chars\` удаляет невидимые символы которые могут обойти проверки или сломать downstream-системы.`,
  },

  {
    id: "api-keys-m2m",
    title: "API Keys и machine-to-machine аутентификация",
    task: "Реализуйте систему API-ключей для M2M-аутентификации. Генерация ключей (prefix + secret, хешируется для хранения), scopes для ограничения доступа конкретного ключа, rate limiting per key, ротация ключей без даунтайма, аудит использования (last used, request count), отзыв ключей с grace period. Реализуйте через Depends прозрачно для endpoint-хэндлеров.",
    files: [
      {
        filename: "app/apikeys/models.py",
        code: `"""
Модель API-ключа.

Формат ключа: <prefix>_<secret>
  prefix: 8 символов, хранится открыто — для быстрого поиска по БД
  secret: 32 байта, хранится только SHA-256 хэш

Пример: sk_live_a1b2c3d4_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  - "sk_live" — тип ключа (secret key, live environment)
  - "a1b2c3d4" — prefix для поиска
  - "xxxx..." — secret (32 байта в hex)

Пользователь видит ключ ОДИН раз при создании.
В БД хранится только prefix + hash(secret).
"""

from datetime import datetime
from sqlalchemy import (
    ARRAY, Boolean, DateTime, ForeignKey,
    Integer, String, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class APIKey(Base, TimestampMixin):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Отображаемое имя ключа — для UI ("Production server", "CI pipeline")
    name: Mapped[str] = mapped_column(String(255))

    # Первые 8 символов secret-части — для поиска в БД без сканирования
    key_prefix: Mapped[str] = mapped_column(String(16), index=True)

    # SHA-256 хэш полного ключа — для верификации
    key_hash: Mapped[str] = mapped_column(String(64), unique=True)

    # Scopes — список разрешённых действий для этого ключа
    # ["articles:read", "articles:write"] или ["*"] для полного доступа
    scopes: Mapped[list[str]] = mapped_column(ARRAY(String))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Ротация: новый ключ создаётся, старый живёт ещё grace_period секунд
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Аудит использования
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    request_count: Mapped[int] = mapped_column(Integer, default=0)

    # Ключ отозван (но не удалён — для аудита)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_reason: Mapped[str | None] = mapped_column(String(500))

    owner: Mapped["User"] = relationship(lazy="raise")`,
      },
      {
        filename: "app/apikeys/generator.py",
        code: `"""
Генерация и верификация API-ключей.

Формат: {type_prefix}_{key_prefix}_{secret}

  type_prefix: "sk_live" | "sk_test" | "pk_live"
  key_prefix:  8 hex-символов (первые байты secret) — для поиска в БД
  secret:      32 случайных байта в hex (256 бит энтропии)

Итого: ~80 символов, 256 бит энтропии в secret-части.
"""

import hashlib
import secrets
from dataclasses import dataclass


@dataclass
class GeneratedKey:
    full_key: str      # показываем пользователю ОДИН РАЗ
    key_prefix: str    # храним в БД (для поиска)
    key_hash: str      # храним в БД (для верификации)


def generate_api_key(type_prefix: str = "sk_live") -> GeneratedKey:
    """
    Генерирует новый API-ключ.
    secrets.token_hex — криптографически стойкий CSPRNG.
    """
    secret_bytes = secrets.token_bytes(32)      # 256 бит
    secret_hex = secret_bytes.hex()             # 64 hex-символа
    key_prefix = secret_hex[:8]                 # первые 8 символов — prefix

    full_key = f"{type_prefix}_{key_prefix}_{secret_hex}"
    key_hash = hash_key(full_key)

    return GeneratedKey(
        full_key=full_key,
        key_prefix=key_prefix,
        key_hash=key_hash,
    )


def hash_key(full_key: str) -> str:
    """SHA-256 хэш ключа для хранения в БД."""
    return hashlib.sha256(full_key.encode()).hexdigest()


def extract_prefix(full_key: str) -> str | None:
    """
    Извлекает prefix из предъявленного ключа для поиска в БД.
    Формат: type_prefix_keyprefix_secret → ищем по keyprefix.
    """
    parts = full_key.split("_")
    # sk_live_a1b2c3d4_xxxx → parts = ["sk", "live", "a1b2c3d4", "xxxx"]
    if len(parts) < 4:
        return None
    return parts[2]   # key_prefix — третья часть`,
      },
      {
        filename: "app/apikeys/repository.py",
        code: `from datetime import datetime, UTC

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.apikeys.generator import extract_prefix, hash_key
from app.apikeys.models import APIKey


class APIKeyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def find_by_key(self, full_key: str) -> APIKey | None:
        """
        Двухэтапный поиск:
        1. По key_prefix — быстрый индексный поиск, сужает выборку
        2. По key_hash — точная верификация (константное время)

        Без prefix пришлось бы хэшировать все ключи в таблице
        или делать полный скан.
        """
        prefix = extract_prefix(full_key)
        if not prefix:
            return None

        key_hash = hash_key(full_key)

        result = await self.session.execute(
            select(APIKey)
            .where(APIKey.key_prefix == prefix)
            .where(APIKey.key_hash == key_hash)
            .where(APIKey.is_active.is_(True))
            .where(APIKey.revoked_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        owner_id: int,
        name: str,
        key_prefix: str,
        key_hash: str,
        scopes: list[str],
        expires_at: datetime | None = None,
    ) -> APIKey:
        key = APIKey(
            owner_id=owner_id,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            scopes=scopes,
            expires_at=expires_at,
        )
        self.session.add(key)
        await self.session.flush()
        return key

    async def update_usage(self, key_id: int) -> None:
        """
        Обновляет last_used_at и request_count.
        Атомарный инкремент через UPDATE — нет race condition.
        Не делаем это синхронно в критическом пути — см. примечание ниже.
        """
        await self.session.execute(
            update(APIKey)
            .where(APIKey.id == key_id)
            .values(
                last_used_at=datetime.now(UTC),
                request_count=APIKey.request_count + 1,
            )
        )

    async def revoke(self, key_id: int, reason: str) -> None:
        await self.session.execute(
            update(APIKey)
            .where(APIKey.id == key_id)
            .values(
                revoked_at=datetime.now(UTC),
                revoked_reason=reason,
                is_active=False,
            )
        )

    async def list_by_owner(self, owner_id: int) -> list[APIKey]:
        result = await self.session.execute(
            select(APIKey)
            .where(APIKey.owner_id == owner_id)
            .order_by(APIKey.created_at.desc())
        )
        return list(result.scalars().all())`,
      },
      {
        filename: "app/apikeys/dependencies.py",
        code: `"""
FastAPI Depends для API-ключей.

Поддерживает два способа передачи ключа:
  1. Authorization: Bearer sk_live_...
  2. X-API-Key: sk_live_...   (стандартный заголовок для M2M)

Порядок проверки:
  X-API-Key → Bearer → 401
"""

import asyncio
from datetime import datetime, UTC
from typing import Callable

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.apikeys.models import APIKey
from app.apikeys.repository import APIKeyRepository
from app.cache.rate_limiter import SlidingWindowRateLimiter
from app.core.database import get_db

# Rate limiter отдельный для API-ключей: 1000 req/мин по умолчанию
_key_rate_limiter = SlidingWindowRateLimiter(
    limit=1000,
    window_seconds=60,
    key_prefix="apikey_rl",
)


async def _extract_raw_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    authorization: str | None = Header(default=None),
) -> str | None:
    if x_api_key:
        return x_api_key
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:]
        # Если токен выглядит как API-ключ (содержит наш разделитель) — используем
        if token.count("_") >= 3:
            return token
    return None


async def get_api_key(
    request: Request,
    raw_key: str | None = Depends(_extract_raw_key),
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    """
    Базовая зависимость: извлекает и валидирует API-ключ.
    Не проверяет scopes — это делают специализированные зависимости.
    """
    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    repo = APIKeyRepository(db)
    api_key = await repo.find_by_key(raw_key)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
        )

    # Проверяем истечение срока действия
    if api_key.expires_at and datetime.now(UTC) > api_key.expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired",
        )

    # Rate limiting per key (по key_prefix — не раскрываем полный hash)
    rl_result = await _key_rate_limiter.check(api_key.key_prefix)
    if not rl_result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="API key rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(rl_result.limit),
                "X-RateLimit-Remaining": "0",
                "Retry-After": "60",
            },
        )

    # Обновляем статистику использования асинхронно — не блокируем ответ.
    # fire-and-forget: если упадёт — не критично (аудит, не бизнес-логика)
    asyncio.create_task(_update_usage(api_key.id))

    return api_key


async def _update_usage(key_id: int) -> None:
    """Обновляем счётчик использования в фоне."""
    from app.core.database import async_session_factory
    async with async_session_factory() as session:
        repo = APIKeyRepository(session)
        await repo.update_usage(key_id)
        await session.commit()


def require_scope(*required_scopes: str) -> Callable:
    """
    Фабрика зависимостей для проверки scopes.

    Использование:
        @router.get("/data")
        async def get_data(
            api_key: APIKey = Depends(require_scope("data:read"))
        ):
            ...

    Поддерживает wildcard: scope "*" — доступ ко всему.
    """
    async def dependency(
        api_key: APIKey = Depends(get_api_key),
    ) -> APIKey:
        key_scopes = set(api_key.scopes)

        # Wildcard: ключ с "*" имеет все права
        if "*" in key_scopes:
            return api_key

        # Проверяем что все требуемые scopes присутствуют
        missing = set(required_scopes) - key_scopes
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key missing required scopes: {', '.join(sorted(missing))}",
            )
        return api_key

    return dependency`,
      },
      {
        filename: "app/apikeys/rotation.py",
        code: `"""
Ротация API-ключей без даунтайма.

Стратегия:
  1. Создаём новый ключ (возвращаем пользователю)
  2. Старый ключ помечаем как "rotating" с expires_at = now + grace_period
  3. В течение grace_period оба ключа работают
  4. После grace_period старый ключ автоматически отвергается (expires_at истёк)

Grace period по умолчанию = 24 часа.
Это время чтобы обновить конфигурацию на всех серверах/сервисах.
"""

from datetime import datetime, timedelta, UTC

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.apikeys.generator import generate_api_key
from app.apikeys.models import APIKey
from app.apikeys.repository import APIKeyRepository
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

GRACE_PERIOD_HOURS = 24


class CreateKeyRequest(BaseModel):
    name: str
    scopes: list[str] = ["*"]
    expires_in_days: int | None = None    # None = бессрочный


class CreateKeyResponse(BaseModel):
    id: int
    name: str
    # Полный ключ — показываем ОДИН РАЗ. После этого запроса восстановить нельзя.
    key: str
    scopes: list[str]
    expires_at: datetime | None


class KeyInfoResponse(BaseModel):
    id: int
    name: str
    key_prefix: str   # показываем prefix для идентификации в UI
    scopes: list[str]
    is_active: bool
    last_used_at: datetime | None
    request_count: int
    expires_at: datetime | None
    created_at: datetime


@router.post("/", response_model=CreateKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: CreateKeyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = APIKeyRepository(db)
    generated = generate_api_key()

    expires_at = None
    if payload.expires_in_days:
        expires_at = datetime.now(UTC) + timedelta(days=payload.expires_in_days)

    key = await repo.create(
        owner_id=current_user.id,
        name=payload.name,
        key_prefix=generated.key_prefix,
        key_hash=generated.key_hash,
        scopes=payload.scopes,
        expires_at=expires_at,
    )
    await db.commit()

    return CreateKeyResponse(
        id=key.id,
        name=key.name,
        key=generated.full_key,   # единственный раз когда показываем полный ключ
        scopes=key.scopes,
        expires_at=key.expires_at,
    )


@router.post("/{key_id}/rotate", response_model=CreateKeyResponse)
async def rotate_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ротация: создаём новый ключ, старый истекает через grace period.
    Оба ключа работают параллельно в течение grace period.
    """
    repo = APIKeyRepository(db)

    # Находим существующий ключ
    from sqlalchemy import select
    result = await db.execute(
        select(APIKey)
        .where(APIKey.id == key_id)
        .where(APIKey.owner_id == current_user.id)
    )
    old_key = result.scalar_one_or_none()

    if not old_key:
        raise HTTPException(status_code=404, detail="API key not found")

    # Создаём новый ключ с теми же scopes
    generated = generate_api_key()
    new_key = await repo.create(
        owner_id=current_user.id,
        name=f"{old_key.name} (rotated)",
        key_prefix=generated.key_prefix,
        key_hash=generated.key_hash,
        scopes=old_key.scopes,
        expires_at=old_key.expires_at,   # наследуем срок действия
    )

    # Старый ключ истекает через grace_period
    grace_expires = datetime.now(UTC) + timedelta(hours=GRACE_PERIOD_HOURS)
    from sqlalchemy import update
    await db.execute(
        update(APIKey)
        .where(APIKey.id == key_id)
        .values(expires_at=grace_expires, name=f"{old_key.name} (deprecated)")
    )

    await db.commit()

    return CreateKeyResponse(
        id=new_key.id,
        name=new_key.name,
        key=generated.full_key,
        scopes=new_key.scopes,
        expires_at=new_key.expires_at,
    )


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: int,
    reason: str = "Revoked by owner",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Немедленный отзыв ключа (без grace period)."""
    repo = APIKeyRepository(db)

    from sqlalchemy import select
    result = await db.execute(
        select(APIKey)
        .where(APIKey.id == key_id)
        .where(APIKey.owner_id == current_user.id)
    )
    key = result.scalar_one_or_none()

    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    await repo.revoke(key_id, reason=reason)
    await db.commit()

    return {"detail": "API key revoked"}


@router.get("/", response_model=list[KeyInfoResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = APIKeyRepository(db)
    keys = await repo.list_by_owner(current_user.id)
    return [
        KeyInfoResponse(
            id=k.id,
            name=k.name,
            key_prefix=k.key_prefix,   # показываем prefix для идентификации
            scopes=k.scopes,
            is_active=k.is_active,
            last_used_at=k.last_used_at,
            request_count=k.request_count,
            expires_at=k.expires_at,
            created_at=k.created_at,
        )
        for k in keys
    ]`,
      },
      {
        filename: "app/routes/data.py",
        code: `"""
Пример endpoint-ов защищённых API-ключами.
Прозрачно для хэндлеров — scopes проверяются в Depends.
"""

from fastapi import APIRouter, Depends

from app.apikeys.dependencies import require_scope
from app.apikeys.models import APIKey

router = APIRouter(prefix="/data", tags=["Data API"])


@router.get("/export")
async def export_data(
    # Только ключи со scope "data:read" или "*"
    api_key: APIKey = Depends(require_scope("data:read")),
):
    """M2M endpoint: экспорт данных. Требует scope data:read."""
    return {
        "data": [...],
        # Возвращаем какой ключ использован — для отладки клиентского кода
        "authenticated_as": f"API key: {api_key.name} ({api_key.key_prefix}...)",
    }


@router.post("/import")
async def import_data(
    # Требуем оба scope одновременно
    api_key: APIKey = Depends(require_scope("data:read", "data:write")),
):
    """M2M endpoint: импорт данных. Требует scope data:read + data:write."""
    return {"status": "imported"}


@router.delete("/records/{record_id}")
async def delete_record(
    record_id: int,
    # Административный endpoint — только ключи с admin scope
    api_key: APIKey = Depends(require_scope("admin")),
):
    return {"deleted": record_id}`,
      },
    ],
    explanation: `**Prefix + Hash**: хранить полный ключ в БД небезопасно (утечка БД = компрометация всех ключей). Хранить только hash — нельзя искать без полного скана (нет индекса). Решение: prefix (первые 8 символов secret-части) хранится открыто для индексного поиска, hash используется для точной верификации. Поиск: O(log n) по prefix-индексу → один hash-compare. Утечка БД компрометирует только prefix, но не полный ключ.

**secrets.token_bytes(32)**: 256 бит энтропии — невозможно перебрать даже на квантовом компьютере. \`random\` модуль Python использует Mersenne Twister — не криптографически стойкий, предсказуем. \`secrets\` использует \`os.urandom\` → системный CSPRNG (getrandom syscall на Linux).

**Ротация без даунтайма**: grace period = оба ключа работают параллельно. Клиентские сервисы обновляют конфигурацию в течение grace period (перезапускают контейнеры, обновляют secrets в K8s). После grace period старый ключ автоматически отвергается по \`expires_at\`. Альтернатива — немедленная ротация — вызывает даунтайм пока не все сервисы обновились.

**Fire-and-forget для аудита**: \`asyncio.create_task(_update_usage(key_id))\` — не блокирует ответ клиенту. Обновление счётчика — некритичная операция, допускает редкие потери (при crash воркера). Альтернатива: буферизация в Redis INCR + периодическая синхронизация в БД через Celery/фоновую задачу.

**Scopes как строки**: гибче enum — новые scopes добавляются без изменения кода (только данные). Wildcard \`"*"\` — full access key для admin/internal. Проверка через set difference: \`missing = required - key_scopes\` — одна операция независимо от числа scopes. Scopes хранятся в ARRAY PostgreSQL — нативный тип, нет JSON-сериализации.`,
  },

  {
    id: "fastapi-testing-pytest",
    title: "Тестирование FastAPI с pytest",
    task: "Настройте полноценное тестовое окружение для FastAPI-приложения. Реализуйте: TestClient и AsyncClient (httpx) для sync/async тестов, фикстуры для тестовой БД с транзакционным откатом после каждого теста, мокирование внешних HTTP-сервисов через respx, factory-фикстуры через factory_boy, параметризованные тесты для edge cases. Структурируйте тесты по уровням: unit, integration, e2e.",
    files: [
      {
        filename: "pyproject.toml (pytest секция)",
        code: `[tool.pytest.ini_options]
asyncio_mode = "auto"          # pytest-asyncio: все async-тесты автоматически
testpaths = ["tests"]
addopts = [
    "-v",
    "--tb=short",              # короткий traceback по умолчанию
    "--strict-markers",        # неизвестные маркеры = ошибка
    "--no-header",
]
markers = [
    "unit: isolated unit tests (no DB, no network)",
    "integration: tests with real DB in transaction",
    "e2e: full stack tests, no mocks",
    "slow: tests that take more than 1 second",
]

[tool.coverage.run]
source = ["app"]
omit = ["app/migrations/*", "app/core/config.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]`,
      },
      {
        filename: "tests/conftest.py",
        code: `"""
Корневые фикстуры — доступны во всех тестах без импорта.

Стратегия тестовой БД:
  1. Один раз создаём схему (session-scoped engine)
  2. Каждый тест получает транзакцию, которая откатывается после теста
  3. Никаких DELETE в teardown — rollback быстрее и надёжнее

Откат транзакции вместо DELETE:
  - Быстрее: нет I/O на запись, только освобождение locks
  - Детерминировано: нет зависимости от CASCADE правил
  - Параллельно: каждый тест в своей транзакции не мешает другим
"""

import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models.base import Base

# ── Движок для тестов ──────────────────────────────────────────────────────────

# Отдельная тестовая БД — никогда не трогаем production
TEST_DATABASE_URL = settings.database_url.replace("/app_db", "/app_test")

# echo=False — не засоряем вывод тестов SQL-логами
# pool_size=1 — для транзакционного отката нужен один коннект на тест
_test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, pool_size=5)


# ── Session-level: создаём схему один раз ─────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
async def create_test_schema():
    """Создаёт таблицы перед всей тестовой сессией, удаляет после."""
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── Function-level: транзакция с откатом ─────────────────────────────────────

@pytest_asyncio.fixture
async def db_conn() -> AsyncGenerator[AsyncConnection, None]:
    """
    Открывает коннект + начинает транзакцию.
    После теста — ROLLBACK вместо COMMIT.
    Вложенные savepoints позволяют тестировать код который сам делает commit.
    """
    async with _test_engine.connect() as conn:
        await conn.begin()                  # внешняя транзакция
        try:
            yield conn
        finally:
            await conn.rollback()           # откат всего что сделал тест


@pytest_asyncio.fixture
async def db(db_conn: AsyncConnection) -> AsyncGenerator[AsyncSession, None]:
    """
    AsyncSession поверх фиксированного коннекта.
    join_transaction_mode="create_savepoint" — каждый flush/commit
    создаёт savepoint, но не коммитит внешнюю транзакцию.
    """
    session_factory = async_sessionmaker(
        bind=db_conn,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    async with session_factory() as session:
        yield session


# ── HTTP-клиент с подменой зависимостей ───────────────────────────────────────

@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    AsyncClient подключен к тестовому приложению.
    Зависимость get_db подменена — используется та же тестовая сессия.
    """
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Content-Type": "application/json"},
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Аутентифицированный клиент ────────────────────────────────────────────────

@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, user_factory) -> AsyncClient:
    """Клиент с валидным Authorization заголовком."""
    user = await user_factory()
    from app.auth.tokens import create_access_token
    token = create_access_token(user.id)
    client.headers["Authorization"] = f"Bearer {token}"
    client.state = {"user": user}   # тест может получить пользователя
    return client`,
      },
      {
        filename: "tests/factories.py",
        code: `"""
factory_boy фабрики для тестовых данных.

Принципы:
- Каждая фабрика создаёт минимально валидный объект
- Faker генерирует реалистичные данные (не "test_user_1")
- AsyncSQLAlchemyModelFactory работает с async сессиями
- Трейт (Trait) — именованный набор переопределений для особых случаев
"""

import factory
from factory.faker import Faker

from app.core.security import hash_password
from app.models.article import Article
from app.models.user import User


class AsyncSQLAlchemyModelFactory(factory.Factory):
    """Базовый класс для async SQLAlchemy фабрик."""

    class Meta:
        abstract = True

    @classmethod
    async def _create(cls, model_class, *args, **kwargs):
        session = kwargs.pop("_session")
        obj = model_class(*args, **kwargs)
        session.add(obj)
        await session.flush()   # получаем id без commit
        return obj

    @classmethod
    async def create(cls, _session, **kwargs):
        return await cls._create(cls._meta.model, _session=_session, **kwargs)

    @classmethod
    async def create_batch(cls, size: int, _session, **kwargs):
        return [await cls.create(_session=_session, **kwargs) for _ in range(size)]


class UserFactory(AsyncSQLAlchemyModelFactory):
    class Meta:
        model = User

    email = Faker("email")
    name = Faker("name")
    hashed_password = factory.LazyFunction(lambda: hash_password("test_password_123"))
    is_active = True
    is_verified = True

    class Params:
        # Трейт: неактивный пользователь
        inactive = factory.Trait(is_active=False)
        # Трейт: неверифицированный
        unverified = factory.Trait(is_verified=False)
        # Трейт: пользователь с конкретным паролем
        password = factory.Trait(
            hashed_password=factory.LazyAttribute(
                lambda o: hash_password(o.raw_password)
            )
        )


class ArticleFactory(AsyncSQLAlchemyModelFactory):
    class Meta:
        model = Article

    title = Faker("sentence", nb_words=6)
    content = Faker("text", max_nb_chars=1000)
    is_published = False

    # SubFactory: автоматически создаёт связанный объект
    author = factory.SubFactory(UserFactory)

    class Params:
        published = factory.Trait(is_published=True)


# ── pytest-фикстуры из фабрик ─────────────────────────────────────────────────

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession


@pytest_asyncio.fixture
def user_factory(db: AsyncSession):
    """Фикстура-фабрика: возвращает callable для создания пользователей."""
    async def _create(**kwargs) -> User:
        return await UserFactory.create(_session=db, **kwargs)
    return _create


@pytest_asyncio.fixture
def article_factory(db: AsyncSession):
    async def _create(**kwargs) -> Article:
        return await ArticleFactory.create(_session=db, **kwargs)
    return _create`,
      },
      {
        filename: "tests/unit/test_tokens.py",
        code: `"""
Unit-тесты: изолированы, не требуют БД или сети.
Тестируют логику токенов напрямую.
"""

import time
from datetime import timedelta

import pytest

from app.auth.tokens import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
)

pytestmark = pytest.mark.unit


class TestCreateAccessToken:
    def test_creates_valid_token(self):
        token = create_access_token(user_id=42)
        payload = decode_token(token, expected_type="access")
        assert payload["sub"] == "42"
        assert payload["type"] == "access"
        assert "jti" in payload

    def test_different_tokens_for_same_user(self):
        """Каждый вызов генерирует уникальный jti."""
        t1 = create_access_token(user_id=1)
        t2 = create_access_token(user_id=1)
        p1 = decode_token(t1, "access")
        p2 = decode_token(t2, "access")
        assert p1["jti"] != p2["jti"]

    def test_token_expiry(self, freezegun_install):
        """Токен истекает через ACCESS_TOKEN_EXPIRE_MINUTES."""
        from freezegun import freeze_time
        from datetime import datetime, UTC

        token = create_access_token(user_id=1)
        # Перематываем время на 20 минут вперёд
        future = datetime.now(UTC) + timedelta(minutes=20)
        with freeze_time(future):
            with pytest.raises(TokenError) as exc_info:
                decode_token(token, "access")
            assert "expired" in str(exc_info.value).lower()
            assert exc_info.value.status_code == 401


class TestDecodeToken:
    def test_wrong_type_raises_403(self):
        """Предъявляем refresh там где ожидается access → 403."""
        refresh, _ = create_refresh_token(user_id=1)
        with pytest.raises(TokenError) as exc_info:
            decode_token(refresh, expected_type="access")
        assert exc_info.value.status_code == 403

    def test_tampered_token_raises_401(self):
        token = create_access_token(user_id=1)
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(TokenError) as exc_info:
            decode_token(tampered, "access")
        assert exc_info.value.status_code == 401

    @pytest.mark.parametrize("user_id", [1, 999, 2**31 - 1])
    def test_roundtrip_various_user_ids(self, user_id: int):
        token = create_access_token(user_id=user_id)
        payload = decode_token(token, "access")
        assert int(payload["sub"]) == user_id`,
      },
      {
        filename: "tests/integration/test_auth.py",
        code: `"""
Integration-тесты: реальная БД (транзакция с откатом), без внешних сервисов.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


class TestLogin:
    async def test_successful_login_returns_access_token(
        self, client: AsyncClient, user_factory
    ):
        user = await user_factory()
        resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "test_password_123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_wrong_password_returns_401(
        self, client: AsyncClient, user_factory
    ):
        user = await user_factory()
        resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "wrong_password"},
        )
        assert resp.status_code == 401
        # Убеждаемся что ответ не раскрывает тип ошибки
        assert resp.json()["detail"] == "Invalid credentials"

    async def test_nonexistent_email_same_response_as_wrong_password(
        self, client: AsyncClient
    ):
        """Username enumeration protection: одинаковый ответ."""
        resp = await client.post(
            "/auth/login",
            json={"email": "nobody@example.com", "password": "any"},
        )
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid credentials"

    @pytest.mark.parametrize("payload,expected_status", [
        ({}, 422),
        ({"email": "not-an-email", "password": "x"}, 422),
        ({"email": "a@b.com"}, 422),       # нет password
        ({"password": "abc"}, 422),        # нет email
    ])
    async def test_invalid_payloads_return_422(
        self, client: AsyncClient, payload: dict, expected_status: int
    ):
        resp = await client.post("/auth/login", json=payload)
        assert resp.status_code == expected_status


class TestProtectedEndpoint:
    async def test_no_token_returns_401(self, client: AsyncClient):
        resp = await client.get("/articles/")
        assert resp.status_code == 401

    async def test_invalid_token_returns_401(self, client: AsyncClient):
        client.headers["Authorization"] = "Bearer invalid.token.here"
        resp = await client.get("/articles/")
        assert resp.status_code == 401

    async def test_valid_token_grants_access(self, auth_client: AsyncClient):
        resp = await auth_client.get("/articles/")
        assert resp.status_code == 200`,
      },
      {
        filename: "tests/integration/test_external_http.py",
        code: `"""
Мокирование внешних HTTP-сервисов через respx.

respx перехватывает вызовы httpx.AsyncClient на уровне транспорта.
Реальные сетевые запросы не выполняются — тесты работают offline.
"""

import pytest
import respx
from httpx import AsyncClient, Response

pytestmark = pytest.mark.integration


@pytest.fixture
def mock_github():
    """respx.mock как контекст-менеджер или фикстура."""
    with respx.mock(assert_all_called=False) as mock:
        yield mock


class TestOAuthGitHubCallback:
    async def test_successful_github_login(
        self,
        client: AsyncClient,
        mock_github,
    ):
        # 1. Мокируем обмен code → token
        mock_github.post("https://github.com/login/oauth/access_token").mock(
            return_value=Response(200, json={"access_token": "gh_test_token", "token_type": "bearer"})
        )

        # 2. Мокируем профиль пользователя
        mock_github.get("https://api.github.com/user").mock(
            return_value=Response(200, json={
                "id": 12345,
                "login": "testuser",
                "name": "Test User",
                "email": "testuser@example.com",
                "avatar_url": "https://avatars.githubusercontent.com/test",
            })
        )

        # 3. Предварительно создаём state в Redis (или мокируем state_store)
        # В реальном тесте state был бы создан через /oauth/github/authorize
        # Здесь подставляем напрямую через фикстуру
        from app.oauth.state_store import oauth_state_store
        await oauth_state_store.save(
            state="test_state_123",
            provider="github",
            code_verifier="test_verifier",
        )

        resp = await client.get(
            "/oauth/github/callback",
            params={"code": "github_auth_code", "state": "test_state_123"},
            follow_redirects=False,
        )

        # Редиректит на фронтенд с access_token в query
        assert resp.status_code == 307
        assert "access_token=" in resp.headers["location"]

    async def test_github_token_exchange_failure(
        self,
        client: AsyncClient,
        mock_github,
    ):
        mock_github.post("https://github.com/login/oauth/access_token").mock(
            return_value=Response(400, json={"error": "bad_verification_code"})
        )

        from app.oauth.state_store import oauth_state_store
        await oauth_state_store.save("bad_state", "github", "verifier")

        resp = await client.get(
            "/oauth/github/callback",
            params={"code": "bad_code", "state": "bad_state"},
        )
        assert resp.status_code == 400

    async def test_invalid_state_rejected(self, client: AsyncClient):
        """State которого нет в Redis → 400."""
        resp = await client.get(
            "/oauth/github/callback",
            params={"code": "any", "state": "nonexistent_state"},
        )
        assert resp.status_code == 400`,
      },
      {
        filename: "tests/e2e/test_article_lifecycle.py",
        code: `"""
E2E-тест: полный жизненный цикл ресурса без моков.
Все слои реальные: HTTP → FastAPI → БД.
"""

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.e2e, pytest.mark.slow]


async def test_full_article_lifecycle(
    client: AsyncClient,
    user_factory,
    auth_client: AsyncClient,
):
    """
    Создание → чтение → обновление → удаление статьи.
    Проверяем права: автор может всё, другой пользователь — нет.
    """
    # 1. Создаём статью от имени авторизованного пользователя
    create_resp = await auth_client.post(
        "/articles/",
        json={"title": "My Article", "content": "Content here"},
    )
    assert create_resp.status_code == 201
    article_id = create_resp.json()["id"]

    # 2. Чтение (любой авторизованный пользователь)
    read_resp = await auth_client.get(f"/articles/{article_id}")
    assert read_resp.status_code == 200
    assert read_resp.json()["title"] == "My Article"

    # 3. Другой пользователь не может редактировать
    other_user = await user_factory()
    from app.auth.tokens import create_access_token
    other_token = create_access_token(other_user.id)
    client.headers["Authorization"] = f"Bearer {other_token}"

    forbidden_resp = await client.put(
        f"/articles/{article_id}",
        json={"title": "Hijacked title"},
    )
    assert forbidden_resp.status_code == 403

    # 4. Автор может редактировать
    update_resp = await auth_client.put(
        f"/articles/{article_id}",
        json={"title": "Updated Title", "content": "Updated content"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Updated Title"

    # 5. Удаление — только автор
    delete_resp = await auth_client.delete(f"/articles/{article_id}")
    assert delete_resp.status_code == 204

    # 6. Ресурс недоступен после удаления
    not_found = await auth_client.get(f"/articles/{article_id}")
    assert not_found.status_code == 404`,
      },
    ],
    explanation: `**Транзакционный откат вместо DELETE**: каждый тест оборачивается в транзакцию. После теста — \`ROLLBACK\`. Нет нужды в \`DELETE FROM users WHERE ...\`. Преимущества: 1) скорость — rollback не пишет в WAL, 2) детерминированность — не зависит от CASCADE и триггеров, 3) параллельность — каждый тест в своей транзакции.

**\`join_transaction_mode="create_savepoint"\`**: когда тестируемый код делает \`session.commit()\` — создаётся savepoint вместо реального COMMIT. Внешняя транзакция остаётся открытой. После теста — rollback внешней транзакции откатывает savepoints. Без этого первый \`commit()\` в тесте сделал бы данные постоянными.

**\`dependency_overrides\`**: FastAPI позволяет подменить любую зависимость для тестов. \`app.dependency_overrides[get_db] = override_get_db\` — все endpoint-ы будут использовать тестовую сессию. Подмена работает по идентичности объекта-функции. Вызов \`clear()\` в teardown обязателен — иначе переопределения "протекут" в следующие тесты.

**respx**: мокирует httpx на уровне транспорта. Перехватывает запросы до сетевого стека — реального TCP-соединения нет. \`assert_all_called=True\` (по умолчанию) — тест упадёт если задекларированный mock не был вызван. Это страхует от ситуации "мок настроен, но код поменялся и больше не делает запрос".

**factory_boy**: \`SubFactory\` автоматически создаёт связанные объекты. \`Faker\` даёт реалистичные данные — ловит больше edge cases чем \`"test_user_1"\`. \`Trait\` — именованный набор переопределений: \`await UserFactory.create(inactive=True)\` вместо \`await UserFactory.create(is_active=False)\`.

**Пирамида тестов**: unit (быстро, много) → integration (реальная БД, без сети) → e2e (медленно, полный стек). Маркеры позволяют запускать только нужный слой: \`pytest -m unit\` — секунды, \`pytest -m "not slow"\` — пропускаем тяжёлые тесты в pre-commit hook.`,
  },

  {
    id: "async-testing",
    title: "Тестирование async кода",
    task: "Реализуйте тесты для async-компонентов приложения: async repository методы с тестовой async сессией, WebSocket-хэндлеры через TestClient WebSocket поддержку, Background Tasks (проверка что задача была запланирована), Celery-задачи в eager mode, SSE endpoint (проверка стрима событий). Используйте pytest-asyncio с правильной конфигурацией event loop.",
    files: [
      {
        filename: "tests/conftest_async.py",
        code: `"""
Конфигурация pytest-asyncio для async-тестов.

asyncio_mode = "auto" в pyproject.toml означает:
  - Все async def test_* запускаются как asyncio-корутины автоматически
  - Нет нужды в @pytest.mark.asyncio на каждом тесте
  - Фикстуры async def тоже работают автоматически

Event loop: по умолчанию pytest-asyncio создаёт новый loop для каждого теста.
Для session-scoped фикстур (движок БД) нужен session-scoped loop.
"""

import asyncio
import pytest


# Для pytest-asyncio >= 0.23: event_loop_policy устанавливается через фикстуру
@pytest.fixture(scope="session")
def event_loop_policy():
    """Возвращаем стандартный policy — явно документируем намерение."""
    return asyncio.DefaultEventLoopPolicy()


# Альтернатива для совместимости со старыми версиями pytest-asyncio:
# @pytest.fixture(scope="session")
# def event_loop():
#     loop = asyncio.new_event_loop()
#     yield loop
#     loop.close()`,
      },
      {
        filename: "tests/integration/test_repository.py",
        code: `"""
Тестирование async repository-методов напрямую (без HTTP).
Проверяем бизнес-логику на уровне БД — быстрее и точнее чем через HTTP.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository
from app.repositories.article_repository import ArticleRepository

pytestmark = pytest.mark.integration


class TestUserRepository:
    async def test_create_user(self, db: AsyncSession):
        repo = UserRepository(db)
        user = await repo.create(
            email="repo_test@example.com",
            name="Repo Test",
        )
        assert user.id is not None
        assert user.email == "repo_test@example.com"

    async def test_get_by_email_existing(self, db: AsyncSession, user_factory):
        created = await user_factory(email="findme@example.com")

        repo = UserRepository(db)
        found = await repo.get_by_email("findme@example.com")
        assert found is not None
        assert found.id == created.id

    async def test_get_by_email_not_found(self, db: AsyncSession):
        repo = UserRepository(db)
        result = await repo.get_by_email("ghost@nowhere.com")
        assert result is None

    async def test_email_is_case_insensitive(self, db: AsyncSession, user_factory):
        """Email нормализуется к нижнему регистру."""
        await user_factory(email="case@example.com")
        repo = UserRepository(db)

        for variant in ["CASE@EXAMPLE.COM", "Case@Example.Com", "case@example.com"]:
            user = await repo.get_by_email(variant)
            assert user is not None, f"Should find user with email variant: {variant}"

    async def test_duplicate_email_raises(self, db: AsyncSession, user_factory):
        """Уникальность email на уровне БД."""
        from sqlalchemy.exc import IntegrityError
        await user_factory(email="unique@example.com")

        repo = UserRepository(db)
        with pytest.raises(IntegrityError):
            await repo.create(email="unique@example.com", name="Duplicate")
            await db.flush()


class TestArticleRepository:
    async def test_pagination(self, db: AsyncSession, user_factory, article_factory):
        author = await user_factory()
        # Создаём 15 статей
        for _ in range(15):
            await article_factory(author=author)

        repo = ArticleRepository(db)

        page1 = await repo.get_paginated(limit=10, offset=0)
        page2 = await repo.get_paginated(limit=10, offset=10)

        assert len(page1) == 10
        assert len(page2) == 5
        # Нет пересечений между страницами
        ids1 = {a.id for a in page1}
        ids2 = {a.id for a in page2}
        assert ids1.isdisjoint(ids2)

    async def test_only_published_visible_to_anonymous(
        self, db: AsyncSession, article_factory
    ):
        await article_factory(is_published=True)
        await article_factory(is_published=True)
        await article_factory(is_published=False)   # черновик

        repo = ArticleRepository(db)
        public = await repo.get_published(limit=100)
        assert all(a.is_published for a in public)
        assert len(public) == 2`,
      },
      {
        filename: "tests/integration/test_websocket.py",
        code: `"""
Тестирование WebSocket endpoint-ов.

httpx AsyncClient НЕ поддерживает WebSocket.
Для WebSocket используем Starlette TestClient (sync) или
websockets-библиотеку через ASGITransport.

Рекомендуется: starlette.testclient.TestClient для WS-тестов
(работает синхронно поверх async ASGI через anyio).
"""

import json
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.auth.tokens import create_access_token


@pytest.fixture
def ws_client():
    """Sync TestClient для WebSocket тестов."""
    return TestClient(app)


class TestChatWebSocket:
    def test_connect_without_token_rejected(self, ws_client: TestClient):
        """WebSocket без токена → 1008 Policy Violation."""
        with pytest.raises(Exception) as exc_info:
            with ws_client.websocket_connect("/ws/chat"):
                pass
        # Starlette поднимает WebSocketDisconnect при отказе
        assert "1008" in str(exc_info.value) or "403" in str(exc_info.value)

    def test_connect_with_valid_token(self, ws_client: TestClient, db):
        """WebSocket с токеном → успешное подключение."""
        # Создаём пользователя синхронно через sync сессию (или используем фикстуру)
        token = create_access_token(user_id=1)
        with ws_client.websocket_connect(
            f"/ws/chat?token={token}"
        ) as websocket:
            # Сервер присылает welcome-сообщение
            data = websocket.receive_json()
            assert data["type"] == "connected"

    def test_send_and_receive_message(self, ws_client: TestClient):
        token = create_access_token(user_id=1)
        with ws_client.websocket_connect(f"/ws/chat?token={token}") as ws:
            ws.receive_json()   # welcome

            ws.send_json({"type": "message", "text": "Hello!"})
            response = ws.receive_json()

            assert response["type"] == "message"
            assert response["text"] == "Hello!"

    def test_multiple_clients_receive_broadcast(self, ws_client: TestClient):
        """Сообщение от одного клиента приходит другому."""
        token1 = create_access_token(user_id=1)
        token2 = create_access_token(user_id=2)

        with ws_client.websocket_connect(f"/ws/chat?token={token1}") as ws1:
            with ws_client.websocket_connect(f"/ws/chat?token={token2}") as ws2:
                ws1.receive_json()   # welcome
                ws2.receive_json()   # welcome

                ws1.send_json({"type": "message", "text": "Broadcast!"})

                # ws2 должен получить сообщение от ws1
                msg = ws2.receive_json()
                assert msg["text"] == "Broadcast!"`,
      },
      {
        filename: "tests/integration/test_background_tasks.py",
        code: `"""
Тестирование Background Tasks.

FastAPI BackgroundTask выполняется ПОСЛЕ отправки ответа клиенту.
В тестах нам нужно:
  1. Убедиться что задача была запланирована
  2. Проверить что задача выполнила нужную логику

Подход А: мокирование через dependency_overrides
Подход Б: использование реального BackgroundTasks с await
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient

pytestmark = pytest.mark.integration


class TestEmailBackgroundTask:
    async def test_registration_schedules_welcome_email(
        self,
        client: AsyncClient,
    ):
        """
        Проверяем что регистрация планирует отправку email.
        Мокируем функцию отправки — не проверяем реальный SMTP.
        """
        with patch("app.services.email.send_welcome_email") as mock_send:
            mock_send = AsyncMock()

            resp = await client.post(
                "/auth/register",
                json={
                    "email": "newuser@example.com",
                    "password": "StrongPass123!",
                    "name": "New User",
                },
            )

            assert resp.status_code == 201

            # BackgroundTask выполняется асинхронно — ждём завершения
            # В TestClient с ASGI transport задачи выполняются до возврата ответа
            mock_send.assert_called_once_with(
                to="newuser@example.com",
                name="New User",
            )

    async def test_background_task_failure_doesnt_affect_response(
        self,
        client: AsyncClient,
    ):
        """
        Упавшая background task не должна влиять на HTTP-ответ.
        Клиент уже получил 201, задача упала в фоне.
        """
        with patch(
            "app.services.email.send_welcome_email",
            side_effect=Exception("SMTP server unavailable"),
        ):
            resp = await client.post(
                "/auth/register",
                json={
                    "email": "another@example.com",
                    "password": "StrongPass123!",
                    "name": "Another User",
                },
            )
            # Ответ должен быть успешным несмотря на ошибку в фоновой задаче
            assert resp.status_code == 201


class TestBackgroundTasksDirectly:
    async def test_task_with_real_db(self, db):
        """
        Иногда полезно тестировать background task напрямую
        (без HTTP-слоя) — быстрее и точнее.
        """
        from app.tasks.cleanup import cleanup_expired_sessions

        # Запускаем задачу напрямую с тестовой сессией
        deleted_count = await cleanup_expired_sessions(db)
        assert isinstance(deleted_count, int)
        assert deleted_count >= 0`,
      },
      {
        filename: "tests/integration/test_sse.py",
        code: `"""
Тестирование SSE (Server-Sent Events) endpoint.

SSE — стрим текстовых событий в формате:
  data: {"type": "update", "value": 42}\\n\\n

Тестируем через AsyncClient: читаем стрим по частям.
"""

import asyncio
import json
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


class TestSSEEndpoint:
    async def test_sse_stream_sends_events(self, auth_client: AsyncClient):
        """
        Получаем первые N событий из SSE-стрима.
        Используем timeout чтобы тест не завис на бесконечном стриме.
        """
        events = []

        async with auth_client.stream("GET", "/events/live") as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers["content-type"]

            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    payload = json.loads(line[5:].strip())
                    events.append(payload)

                    if len(events) >= 3:
                        break   # получили достаточно, прерываем стрим

        assert len(events) == 3
        for event in events:
            assert "type" in event

    async def test_sse_disconnect_on_client_close(self, auth_client: AsyncClient):
        """
        При разрыве соединения клиентом — сервер должен завершить генератор.
        Проверяем что нет утечки ресурсов (через asyncio.wait_for).
        """
        async def read_one_event():
            async with auth_client.stream("GET", "/events/live") as response:
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        return json.loads(line[5:].strip())
            return None

        # Должен завершиться за 5 секунд
        event = await asyncio.wait_for(read_one_event(), timeout=5.0)
        assert event is not None

    async def test_sse_requires_auth(self, client: AsyncClient):
        """SSE без токена → 401."""
        async with client.stream("GET", "/events/live") as response:
            assert response.status_code == 401`,
      },
      {
        filename: "tests/integration/test_celery_tasks.py",
        code: `"""
Тестирование Celery-задач в eager mode.

CELERY_TASK_ALWAYS_EAGER=True: задачи выполняются синхронно в том же процессе.
Нет нужды в запущенном воркере для тестов.

Ограничение: eager mode не тестирует сериализацию/десериализацию аргументов.
Для этого: CELERY_TASK_EAGER_PROPAGATES=True гарантирует что исключения
в задаче поднимаются в вызывающем коде (а не теряются в AsyncResult).
"""

import pytest
from unittest.mock import patch, AsyncMock


@pytest.fixture(autouse=True)
def celery_eager_mode(settings):
    """Все тесты в этом файле запускают Celery задачи синхронно."""
    from app.core.celery_app import celery
    celery.conf.update(
        task_always_eager=True,
        task_eager_propagates=True,   # исключения не глотаются
    )
    yield
    celery.conf.update(
        task_always_eager=False,
        task_eager_propagates=False,
    )


class TestSendEmailTask:
    def test_send_email_task_executes(self):
        from app.tasks.email import send_email_task

        with patch("app.tasks.email.smtp_client.send") as mock_smtp:
            result = send_email_task.delay(
                to="test@example.com",
                subject="Test",
                body="Hello",
            )

            # В eager mode .get() возвращает результат синхронно
            assert result.successful()
            mock_smtp.assert_called_once()

    def test_failed_task_raises_in_eager_mode(self):
        from app.tasks.email import send_email_task

        with patch(
            "app.tasks.email.smtp_client.send",
            side_effect=ConnectionError("SMTP unavailable"),
        ):
            with pytest.raises(ConnectionError):
                send_email_task.delay(
                    to="test@example.com",
                    subject="Test",
                    body="Hello",
                ).get()

    def test_task_retry_logic(self):
        """Проверяем что задача использует retry при transient ошибках."""
        from app.tasks.email import send_email_task
        call_count = 0

        def flaky_send(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise TimeoutError("Temporary failure")

        with patch("app.tasks.email.smtp_client.send", side_effect=flaky_send):
            result = send_email_task.apply(
                args=["test@example.com", "Subject", "Body"],
                retries=0,   # в eager mode retries задаём вручную
            )
            # Задача завершилась со 3-й попытки
            assert call_count == 3`,
      },
    ],
    explanation: `**asyncio_mode = "auto"**: без этой настройки каждый async-тест требует \`@pytest.mark.asyncio\`. С "auto" pytest-asyncio автоматически обнаруживает async def test_* и async-фикстуры. Добавляется в \`pyproject.toml\` — одна строка убирает декоратор с сотен тестов.

**Event loop scope**: по умолчанию каждый тест получает свой event loop (function scope). Session-scoped фикстуры (движок БД) должны работать в session-scoped loop — иначе \`ScopeMismatch\`. В pytest-asyncio 0.23+ это настраивается через \`event_loop_policy\` фикстуру.

**WebSocket через Starlette TestClient**: httpx AsyncClient не поддерживает WebSocket протокол. Starlette TestClient использует anyio для запуска ASGI-приложения в потоке — WebSocket работает синхронно через \`with ws_client.websocket_connect(...)\`.

**Background Tasks в тестах**: ASGI TestClient с transport="asgi" выполняет background tasks до возврата ответа — все задачи завершены к моменту проверки. Patch функции задачи позволяет проверить что она была вызвана с правильными аргументами без реального SMTP/сети.

**SSE через \`aiter_lines()\`**: \`async with client.stream(...)\` открывает соединение без буферизации. \`aiter_lines()\` асинхронно итерирует строки по мере поступления. \`break\` после N событий закрывает соединение со стороны клиента. \`asyncio.wait_for(..., timeout=5.0)\` — защита от зависания в случае если сервер не присылает события.

**Celery eager mode**: \`task_always_eager=True\` — задача выполняется в том же процессе синхронно. \`task_eager_propagates=True\` — исключения поднимаются в вызывающем коде (иначе проглатываются и записываются в AsyncResult). Ограничение: eager mode не проверяет сериализацию через JSON/pickle — аргументы передаются напрямую.`,
  },

  {
    id: "contract-testing-pact",
    title: "Контрактное тестирование (Consumer-Driven Contract Testing)",
    task: "Реализуйте contract testing между FastAPI-бэкендом и React-фронтендом с использованием Pact. Определите контракты для критических эндпоинтов, запустите provider verification в CI, настройте Pact Broker для хранения контрактов. Обеспечьте, что изменения в API не ломают фронтенд без явного согласования. Объясните разницу между contract testing и integration testing.",
    files: [
      {
        filename: "frontend/tests/pact/auth.pact.test.ts",
        code: `/**
 * Consumer-side Pact тест (React/TypeScript).
 *
 * Consumer (фронтенд) ОПРЕДЕЛЯЕТ контракт:
 *   "Я ожидаю что POST /auth/login вернёт такой-то ответ при таких-то входных данных"
 *
 * Pact записывает это ожидание в JSON-файл (pact file).
 * Provider (FastAPI) верифицирует что реальный сервер соответствует контракту.
 *
 * Главное отличие от integration testing:
 *   Integration: "фронтенд и бэкенд работают вместе" — нужны оба сервиса
 *   Contract:    "фронтенд описывает что ожидает" — бэкенд не нужен при генерации
 *
 * Преимущество: если бэкенд изменит формат ответа — provider verification упадёт
 * ЕЩЁ ДО того как изменение попадёт в production.
 */

import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { loginUser } from "../../src/api/auth";  // реальный API-клиент фронтенда

const { like, string, eachLike } = MatchersV3;

// Pact создаёт mock-сервер на указанном порту
const provider = new PactV3({
  consumer: "ReactFrontend",
  provider: "FastAPIBackend",
  port: 4567,
  dir: "./pacts",   // куда сохранять pact-файлы
  logLevel: "warn",
});

describe("Auth API Contract", () => {
  describe("POST /auth/login", () => {
    it("returns access token on valid credentials", async () => {
      // 1. Определяем взаимодействие (interaction)
      provider
        .given("a user with email user@example.com exists")  // provider state
        .uponReceiving("a login request with valid credentials")
        .withRequest({
          method: "POST",
          path: "/auth/login",
          headers: { "Content-Type": "application/json" },
          body: {
            email: "user@example.com",
            password: "correct_password",
          },
        })
        .willRespondWith({
          status: 200,
          headers: { "Content-Type": like("application/json") },
          body: {
            // like() — проверяем тип, не конкретное значение
            // Токен будет разным каждый раз, нам важна структура
            access_token: string("any.jwt.token"),
            token_type: "bearer",
          },
        });

      // 2. Выполняем реальный код фронтенда против Pact mock-сервера
      await provider.executeTest(async (mockServer) => {
        const result = await loginUser({
          baseURL: mockServer.url,
          email: "user@example.com",
          password: "correct_password",
        });

        expect(result.access_token).toBeTruthy();
        expect(result.token_type).toBe("bearer");
      });
      // 3. Pact сохраняет interaction в ./pacts/ReactFrontend-FastAPIBackend.json
    });

    it("returns 401 on invalid credentials", async () => {
      provider
        .given("a user with email user@example.com exists")
        .uponReceiving("a login request with wrong password")
        .withRequest({
          method: "POST",
          path: "/auth/login",
          body: { email: "user@example.com", password: "wrong_password" },
        })
        .willRespondWith({
          status: 401,
          body: {
            detail: string("Invalid credentials"),
          },
        });

      await provider.executeTest(async (mockServer) => {
        await expect(
          loginUser({ baseURL: mockServer.url, email: "user@example.com", password: "wrong_password" })
        ).rejects.toThrow(/401/);
      });
    });
  });

  describe("GET /articles", () => {
    it("returns list of articles with expected shape", async () => {
      provider
        .given("there are published articles")
        .uponReceiving("a request for articles list")
        .withRequest({ method: "GET", path: "/articles" })
        .willRespondWith({
          status: 200,
          body: eachLike({   // eachLike: массив с минимум одним элементом такой структуры
            id: like(1),
            title: string("Article title"),
            author: {
              id: like(1),
              name: string("Author name"),
            },
            is_published: true,
            created_at: string("2024-01-01T00:00:00Z"),
          }),
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(\`\${mockServer.url}/articles\`);
        const articles = await response.json();
        expect(Array.isArray(articles)).toBe(true);
        expect(articles[0]).toHaveProperty("id");
        expect(articles[0]).toHaveProperty("title");
      });
    });
  });
});`,
      },
      {
        filename: "tests/pact/test_provider_verification.py",
        code: `"""
Provider-side верификация контракта (FastAPI/Python).

Provider получает pact-файл (от Pact Broker или локально)
и верифицирует что реальный FastAPI-сервер соответствует контракту.

Запускается в CI после каждого изменения бэкенда.
Если контракт нарушен — CI падает.

Provider states: функции которые приводят БД в нужное состояние
перед каждым interaction.
"""

import asyncio

import pytest
from pact import Verifier

from app.main import app


# ── Provider States ────────────────────────────────────────────────────────────
# Каждый state из consumer-теста должен иметь handler здесь.
# Handlers создают/удаляют данные в тестовой БД перед верификацией.

PROVIDER_STATES = {}


def provider_state(name: str):
    """Декоратор для регистрации provider state handler."""
    def decorator(func):
        PROVIDER_STATES[name] = func
        return func
    return decorator


@provider_state("a user with email user@example.com exists")
async def state_user_exists(db):
    from tests.factories import UserFactory
    from app.core.security import hash_password
    await UserFactory.create(
        _session=db,
        email="user@example.com",
        hashed_password=hash_password("correct_password"),
    )


@provider_state("there are published articles")
async def state_articles_exist(db):
    from tests.factories import ArticleFactory, UserFactory
    author = await UserFactory.create(_session=db)
    await ArticleFactory.create_batch(3, _session=db, author=author, is_published=True)


# ── Верификация ───────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def provider_app(db):
    """
    Запускаем FastAPI на реальном порту для верификации.
    Pact Verifier делает реальные HTTP-запросы к этому серверу.
    """
    import uvicorn
    import threading

    # Подменяем БД на тестовую
    from app.core.database import get_db
    app.dependency_overrides[get_db] = lambda: db

    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8001, log_level="error"))
    thread = threading.Thread(target=server.run)
    thread.daemon = True
    thread.start()

    import time
    time.sleep(0.5)   # ждём запуска

    yield "http://127.0.0.1:8001"

    server.should_exit = True
    app.dependency_overrides.clear()


@pytest.mark.e2e
def test_provider_verification(provider_app: str):
    """
    Верификация провайдера против pact-файлов.
    В CI: pact_broker_url вместо pact_urls.
    """
    verifier = Verifier(
        provider="FastAPIBackend",
        provider_base_url=provider_app,
    )

    # Локальная верификация (development):
    output, _ = verifier.verify_pacts(
        pacts="./frontend/pacts/ReactFrontend-FastAPIBackend.json",
        provider_states_setup_url=f"{provider_app}/_pact/setup",
        verbose=False,
    )

    # В CI используем Pact Broker:
    # output, _ = verifier.verify_with_broker(
    #     broker_url="https://your-pact-broker.example.com",
    #     broker_token=os.environ["PACT_BROKER_TOKEN"],
    #     publish_version=os.environ["GIT_COMMIT"],
    #     publish_verification_results=True,   # результаты обратно в broker
    # )

    assert output == 0, "Provider verification failed — contract broken"`,
      },
      {
        filename: "app/pact/states_endpoint.py",
        code: `"""
/_pact/setup endpoint для provider states.

Pact Verifier вызывает этот endpoint перед каждым interaction
чтобы подготовить нужное состояние БД.

ВАЖНО: этот роутер монтируется ТОЛЬКО в тестовом окружении.
В production его быть не должно.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter(prefix="/_pact", include_in_schema=False)


class ProviderStateRequest(BaseModel):
    state: str
    params: dict = {}


class ProviderStateTeardown(BaseModel):
    state: str
    action: str  # "setup" | "teardown"


@router.post("/setup")
async def setup_provider_state(
    payload: ProviderStateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Pact Verifier вызывает этот endpoint с именем state.
    Мы находим соответствующий handler и выполняем его.
    """
    from tests.pact.test_provider_verification import PROVIDER_STATES

    handler = PROVIDER_STATES.get(payload.state)
    if handler is None:
        # Неизвестный state — не паникуем, просто пропускаем
        return {"state": payload.state, "status": "no_handler"}

    import asyncio
    if asyncio.iscoroutinefunction(handler):
        await handler(db)
    else:
        handler(db)

    await db.commit()
    return {"state": payload.state, "status": "setup_complete"}


# В main.py (только не в production):
# if settings.environment == "test":
#     from app.pact.states_endpoint import router as pact_router
#     app.include_router(pact_router)`,
      },
      {
        filename: ".github/workflows/pact.yml",
        code: `# CI pipeline для Contract Testing
#
# Порядок выполнения:
#   1. Consumer (фронтенд) генерирует pact-файлы
#   2. Pact файлы публикуются в Pact Broker
#   3. Provider (бэкенд) верифицирует контракты
#   4. Результаты публикуются обратно в Broker
#   5. "Can I deploy?" проверка: можно ли деплоить данную версию
#
# Pact Broker хранит историю: какая версия фронтенда совместима
# с какой версией бэкенда.

name: Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  consumer-tests:
    name: Generate Pact Files (Consumer)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install frontend dependencies
        run: pnpm install
        working-directory: frontend

      - name: Run consumer Pact tests
        run: pnpm test:pact
        working-directory: frontend

      - name: Publish pacts to Broker
        run: |
          npx pact-broker publish ./pacts \
            --broker-base-url=\${{ secrets.PACT_BROKER_URL }} \
            --broker-token=\${{ secrets.PACT_BROKER_TOKEN }} \
            --consumer-app-version=\${{ github.sha }} \
            --tag=\${{ github.ref_name }}
        working-directory: frontend

  provider-verification:
    name: Verify Provider (Backend)
    needs: consumer-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: app_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - name: Install Python dependencies
        run: pip install -r requirements-test.txt

      - name: Run provider verification
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:test@localhost/app_test
          PACT_BROKER_URL: \${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: \${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: \${{ github.sha }}
          ENVIRONMENT: test
        run: pytest tests/pact/ -v

  can-i-deploy:
    name: Can I Deploy?
    needs: [consumer-tests, provider-verification]
    runs-on: ubuntu-latest
    steps:
      - name: Check if frontend can be deployed with current backend
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant ReactFrontend \
            --version \${{ github.sha }} \
            --to-environment production \
            --broker-base-url=\${{ secrets.PACT_BROKER_URL }} \
            --broker-token=\${{ secrets.PACT_BROKER_TOKEN }}`,
      },
      {
        filename: "docs/contract-testing-explained.md",
        code: `# Contract Testing vs Integration Testing

## Integration Testing
Проверяет что два компонента РАБОТАЮТ ВМЕСТЕ:
- Нужны оба сервиса запущены одновременно
- Тест: "отправь запрос, получи реальный ответ"
- Медленно (поднять оба сервиса)
- Сложно изолировать причину падения
- Не даёт ответа: "какой именно контракт нарушен?"

Пример:
  1. Запустить FastAPI (порт 8000)
  2. Запустить React dev-server
  3. Cypress: нажать кнопку Login, проверить что токен получен

## Contract Testing (Consumer-Driven)
Проверяет что ОЖИДАНИЯ потребителя удовлетворены поставщиком:

Consumer (фронтенд):
  - Описывает что он ожидает от API
  - Генерирует pact-файл с описанием взаимодействий
  - Тестирует свой код против Pact mock-сервера
  - НЕ нужен реальный бэкенд

Provider (бэкенд):
  - Верифицирует что реальный сервер соответствует контракту
  - Запускает provider states (готовит тестовые данные)
  - НЕ нужен реальный фронтенд

Преимущества:
  ✓ Раннее обнаружение: нарушение контракта видно до деплоя
  ✓ Независимость: фронтенд и бэкенд тестируются независимо
  ✓ Документация: pact-файл = живая документация API
  ✓ "Can I deploy?": Pact Broker знает совместимость версий

Ограничения:
  ✗ Не заменяет e2e тесты полностью
  ✗ Требует дисциплины: consumer должен поддерживать контракты актуальными
  ✗ Не тестирует бизнес-логику — только форму ответа

## Когда использовать что

| Ситуация | Инструмент |
|----------|-----------|
| "Сломает ли изменение API фронтенд?" | Contract (Pact) |
| "Работает ли вся цепочка Login→Dashboard?" | E2E (Cypress/Playwright) |
| "Правильно ли бэкенд сохраняет данные?" | Integration (pytest + реальная БД) |
| "Корректна ли логика токена?" | Unit (pytest, без БД) |

## Consumer-Driven: ключевой момент

"Consumer-Driven" означает что ПОТРЕБИТЕЛЬ (фронтенд) диктует контракт.
Не провайдер публикует "вот наш API" — а потребитель говорит "вот что мне нужно".

Это важно при нескольких потребителях одного API:
  mobile app   →  нужны поля A, B, C
  web frontend →  нужны поля A, D, E
  partner API  →  нужны поля B, F, G

Провайдер верифицирует все три контракта.
Изменение поля B ломает mobile и partner, но не web — это сразу видно.`,
      },
    ],
    explanation: `**Contract Testing ≠ Integration Testing**: integration тест проверяет что два сервиса работают вместе (оба запущены, реальные запросы). Contract тест проверяет СОГЛАШЕНИЕ о формате данных. Фронтенд описывает ожидания → Pact записывает в JSON → бэкенд верифицирует независимо. Главная ценность: изменение API сразу видно в CI ещё до деплоя.

**Consumer-Driven**: именно потребитель (фронтенд) диктует контракт — не провайдер. Это разворачивает API-разработку: бэкенд не может просто переименовать поле без согласования с фронтендом. Несколько потребителей одного API → несколько контрактов → провайдер должен удовлетворить все.

**Provider States**: перед каждым interaction Pact вызывает \`/_pact/setup\` с именем state ("a user with email X exists"). Handler создаёт нужные данные в тестовой БД. Без provider states верификация упадёт — данных нет. Endpoint монтируется ТОЛЬКО в test environment.

**Матчеры вместо точных значений**: \`like(1)\` проверяет что значение того же типа (int), но не конкретное значение. \`string("any")\` — строка любого содержания. \`eachLike({...})\` — массив с минимум одним элементом заданной структуры. Это важно: JWT-токен меняется каждый раз, нам важен факт его наличия и тип.

**"Can I Deploy?"**: Pact Broker хранит историю верификаций. Команда \`can-i-deploy\` отвечает: "версия фронтенда X совместима с текущим production бэкендом?" Блокирует деплой если совместимость не подтверждена. Это делает возможным independent deployments — деплоить фронтенд и бэкенд независимо с гарантией совместимости.

**Pact Broker vs локальные файлы**: в development — pact-файлы в репозитории. В CI — Pact Broker (self-hosted или pactflow.io). Broker хранит все версии, тегирует ветки, отображает матрицу совместимости. \`publish_verification_results=True\` записывает результат верификации обратно в Broker — это обновляет матрицу.`,
  },

];
