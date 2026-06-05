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

];
