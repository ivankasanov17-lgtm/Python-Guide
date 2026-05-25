export interface FastAPITerm {
    name: string;
    description: string;
    syntax: string;
    arguments: { name: string; description: string }[];
    example: string;
    category: string;
}

export const fastapiTerms: FastAPITerm[] = [

    // ─── FastAPI (приложение) ─────────────────────────────────────────────────
    {
        category: 'FastAPI (приложение)',
        name: 'FastAPI()',
        description: 'Главный класс фреймворка — создаёт экземпляр ASGI-приложения. Наследует от Starlette и является точкой входа для всех маршрутов, middleware, обработчиков ошибок и документации. Передаётся в ASGI-сервер (uvicorn, gunicorn) для запуска.',
        syntax: `FastAPI(
    *,
    debug=False,
    routes=None,
    title="FastAPI",
    summary=None,
    description="",
    version="0.1.0",
    openapi_url="/openapi.json",
    openapi_tags=None,
    servers=None,
    dependencies=None,
    default_response_class=Default(JSONResponse),
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect",
    swagger_ui_init_oauth=None,
    middleware=None,
    exception_handlers=None,
    on_startup=None,
    on_shutdown=None,
    lifespan=None,
    terms_of_service=None,
    contact=None,
    license_info=None,
    openapi_prefix="",
    root_path="",
    root_path_in_servers=True,
    responses=None,
    callbacks=None,
    webhooks=None,
    generate_unique_id_function=Default(generate_unique_id),
    separate_input_output_schemas=True,
)`,
        arguments: [
            { name: 'debug', description: 'Включает режим отладки: подробные сообщения об ошибках. По умолчанию False.' },
            { name: 'routes', description: 'Список маршрутов для инициализации приложения. Обычно не используется напрямую — маршруты добавляются через декораторы.' },
            { name: 'title', description: 'Название API, отображаемое в документации Swagger UI и ReDoc. По умолчанию "FastAPI".' },
            { name: 'summary', description: 'Краткое одностроковое описание API в документации. Поддерживает Markdown.' },
            { name: 'description', description: 'Полное описание API в документации. Поддерживает Markdown, включая заголовки и примеры кода.' },
            { name: 'version', description: 'Версия API в формате semver, отображаемая в документации. По умолчанию "0.1.0".' },
            { name: 'openapi_url', description: 'URL, по которому доступна схема OpenAPI в формате JSON. По умолчанию "/openapi.json". Установите None, чтобы отключить.' },
            { name: 'openapi_tags', description: 'Список словарей с метаданными тегов: name, description, externalDocs. Задаёт порядок и описание групп в документации.' },
            { name: 'servers', description: 'Список серверов OpenAPI (URL и описание). Используется для указания нескольких окружений (dev, staging, prod).' },
            { name: 'dependencies', description: 'Глобальные зависимости, применяемые ко всем маршрутам приложения. Список объектов Depends.' },
            { name: 'default_response_class', description: 'Класс ответа по умолчанию для всех маршрутов. По умолчанию JSONResponse.' },
            { name: 'docs_url', description: 'URL Swagger UI. По умолчанию "/docs". Установите None, чтобы отключить.' },
            { name: 'redoc_url', description: 'URL ReDoc-документации. По умолчанию "/redoc". Установите None, чтобы отключить.' },
            { name: 'swagger_ui_oauth2_redirect_url', description: 'URL перенаправления OAuth2 для Swagger UI. По умолчанию "/docs/oauth2-redirect".' },
            { name: 'swagger_ui_init_oauth', description: 'Словарь с параметрами инициализации OAuth2 для Swagger UI (clientId, appName и др.).' },
            { name: 'middleware', description: 'Список middleware для приложения. Обычно добавляются через app.add_middleware().' },
            { name: 'exception_handlers', description: 'Словарь {тип_исключения: обработчик}. Обычно добавляются через app.add_exception_handler().' },
            { name: 'on_startup', description: 'Список функций, вызываемых при запуске приложения. Устарел — используйте lifespan.' },
            { name: 'on_shutdown', description: 'Список функций, вызываемых при остановке приложения. Устарел — используйте lifespan.' },
            { name: 'lifespan', description: 'Async context manager для управления жизненным циклом приложения (startup/shutdown). Заменяет on_startup / on_shutdown.' },
            { name: 'terms_of_service', description: 'URL условий использования API. Отображается в документации.' },
            { name: 'contact', description: 'Словарь с контактной информацией: name, url, email. Отображается в документации.' },
            { name: 'license_info', description: 'Словарь с информацией о лицензии: name, identifier, url. Отображается в документации.' },
            { name: 'openapi_prefix', description: 'Префикс для URL в схеме OpenAPI. Используется при развёртывании за прокси.' },
            { name: 'root_path', description: 'ASGI root_path — задаёт базовый путь приложения за reverse proxy.' },
            { name: 'root_path_in_servers', description: 'Включать ли root_path в список серверов OpenAPI. По умолчанию True.' },
            { name: 'responses', description: 'Глобальные дополнительные ответы для всех маршрутов. Словарь {status_code: {"model": ...}}.' },
            { name: 'callbacks', description: 'Глобальные колбэки OpenAPI для всех маршрутов.' },
            { name: 'webhooks', description: 'Вебхуки OpenAPI — описывают исходящие запросы, отправляемые приложением.' },
            { name: 'generate_unique_id_function', description: 'Функция для генерации уникальных operationId маршрутов. По умолчанию — из имени функции и метода.' },
            { name: 'separate_input_output_schemas', description: 'Генерировать отдельные схемы для входных и выходных данных (с учётом default-значений). По умолчанию True.' },
        ],
        example: `from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: подключение к БД, кэш и т.д.
    print("Запуск приложения")
    yield
    # Shutdown: освобождение ресурсов
    print("Остановка приложения")

app = FastAPI(
    title="My API",
    description="## Описание API\\n\\nПоддерживает **Markdown**.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={"name": "Команда поддержки", "email": "support@example.com"},
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    openapi_tags=[
        {"name": "users",   "description": "Операции с пользователями"},
        {"name": "items",   "description": "Операции с товарами"},
    ],
)

@app.get("/", tags=["users"])
def root():
    return {"message": "Hello, World!"}

# Запуск: uvicorn main:app --reload`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.get()',
        description: 'Декоратор для регистрации обработчика HTTP GET-запроса по указанному пути. GET используется для чтения данных — без изменения состояния сервера. FastAPI автоматически генерирует документацию, валидирует входные параметры и сериализует ответ согласно response_model.',
        syntax: `app.get(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Может содержать path-параметры в фигурных скобках: "/items/{item_id}".' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации и валидации ответа. Определяет схему в документации. Если None — тип выводится из аннотации возврата функции.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200. Отображается в документации как основной код ответа.' },
            { name: 'tags', description: 'Список строк-тегов для группировки маршрута в документации Swagger UI.' },
            { name: 'dependencies', description: 'Список зависимостей Depends(), применяемых к маршруту без привязки к параметрам функции.' },
            { name: 'summary', description: 'Краткое описание маршрута в документации. По умолчанию генерируется из имени функции.' },
            { name: 'description', description: 'Подробное описание маршрута. Поддерживает Markdown. Если не указано — берётся из docstring функции.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации. По умолчанию "Successful Response".' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации: {404: {"model": ErrorModel, "description": "Не найдено"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут как устаревший в документации. По умолчанию None (не устарел).' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в схеме OpenAPI. По умолчанию генерируется автоматически.' },
            { name: 'response_model_include', description: 'Множество или словарь полей response_model, которые нужно включить в ответ.' },
            { name: 'response_model_exclude', description: 'Множество или словарь полей response_model, которые нужно исключить из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать ли псевдонимы полей (alias) при сериализации ответа. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить поля, явно не установленные в объекте ответа. По умолчанию False.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию из ответа. По умолчанию False.' },
            { name: 'response_model_exclude_none', description: 'Исключить поля со значением None из ответа. По умолчанию False.' },
            { name: 'include_in_schema', description: 'Включать ли маршрут в схему OpenAPI и документацию. По умолчанию True.' },
            { name: 'response_class', description: 'Класс ответа для маршрута. Переопределяет default_response_class приложения.' },
            { name: 'name', description: 'Имя маршрута для url_path_for(). По умолчанию — имя функции-обработчика.' },
            { name: 'callbacks', description: 'Список маршрутов-колбэков OpenAPI, описывающих исходящие вызовы от этого маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для объекта Operation в схеме OpenAPI. Словарь, сливается с генерируемой схемой.' },
            { name: 'generate_unique_id_function', description: 'Функция для генерации operation_id этого конкретного маршрута.' },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import Annotated

app = FastAPI()

class Item(BaseModel):
    id: int
    name: str
    price: float
    in_stock: bool = True

class ErrorResponse(BaseModel):
    detail: str

# База данных-заглушка
db: dict[int, Item] = {
    1: Item(id=1, name="Ноутбук", price=89999.0),
    2: Item(id=2, name="Мышь",    price=1499.0),
}

@app.get(
    "/items/{item_id}",
    response_model=Item,
    status_code=200,
    tags=["items"],
    summary="Получить товар по ID",
    description="Возвращает полную информацию о товаре.\\n\\nЕсли товар не найден — возвращает **404**.",
    responses={404: {"model": ErrorResponse, "description": "Товар не найден"}},
    response_model_exclude_none=True,
)
def get_item(item_id: int):
    if item_id not in db:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return db[item_id]

# Маршрут без вхождения в схему (внутренний health-check):
@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.post()',
        description: 'Декоратор для регистрации обработчика HTTP POST-запроса. POST используется для создания новых ресурсов — тело запроса передаёт данные на сервер. По умолчанию возвращает статус 201 Created. FastAPI автоматически разбирает тело запроса по Pydantic-модели, валидирует и сериализует ответ.',
        syntax: `app.post(
    path,
    *,
    response_model=Default(None),
    status_code=201,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Может содержать path-параметры: "/users/{user_id}/items".' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации ответа. Поля, не входящие в модель, будут отфильтрованы — полезно для скрытия внутренних полей (пароль, хэш).' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 201 (Created) — стандарт REST для создания ресурса.' },
            { name: 'tags', description: 'Список строк-тегов для группировки маршрута в Swagger UI.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту (аутентификация, проверка прав) без добавления в параметры функции.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание операции. Поддерживает Markdown. Берётся из docstring функции если не задано явно.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации. По умолчанию "Successful Response".' },
            { name: 'responses', description: 'Дополнительные коды ответов: {422: {"model": ValidationError}, 409: {"description": "Уже существует"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим в документации.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI. По умолчанию генерируется из имени функции.' },
            { name: 'response_model_include', description: 'Множество полей response_model для включения в ответ (белый список).' },
            { name: 'response_model_exclude', description: 'Множество полей response_model для исключения из ответа (чёрный список).' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации ответа. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить поля, не установленные явно в объекте ответа.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию из ответа.' },
            { name: 'response_model_exclude_none', description: 'Исключить поля со значением None из ответа.' },
            { name: 'include_in_schema', description: 'Включать ли маршрут в документацию OpenAPI. По умолчанию True.' },
            { name: 'response_class', description: 'Класс HTTP-ответа. Переопределяет глобальный default_response_class.' },
            { name: 'name', description: 'Имя маршрута для url_path_for(). По умолчанию — имя функции.' },
            { name: 'callbacks', description: 'Колбэки OpenAPI — описывают исходящие запросы, инициированные этим маршрутом.' },
            { name: 'openapi_extra', description: 'Произвольные дополнительные данные для объекта Operation в схеме OpenAPI.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id для этого маршрута.' },
        ],
        example: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: str
    password: str              # принимаем при создании

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime       # пароль НЕ входит в ответ

users_db: dict[int, dict] = {}
counter = 0

@app.post(
    "/users",
    response_model=UserResponse,    # пароль отфильтруется
    status_code=201,
    tags=["users"],
    summary="Создать пользователя",
    responses={
        409: {"description": "Email уже зарегистрирован"},
    },
)
def create_user(user: UserCreate):
    global counter
    if any(u["email"] == user.email for u in users_db.values()):
        raise HTTPException(status_code=409, detail="Email уже зарегистрирован")
    counter += 1
    users_db[counter] = {
        "id": counter,
        "name": user.name,
        "email": user.email,
        "password": user.password,   # сохраняем, но не возвращаем
        "created_at": datetime.utcnow(),
    }
    return users_db[counter]`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.put()',
        description: 'Декоратор для регистрации обработчика HTTP PUT-запроса. PUT используется для полной замены ресурса — клиент передаёт все поля объекта целиком. Идемпотентен: повторный вызов с теми же данными даёт тот же результат. Возвращает 200 по умолчанию. Для частичного обновления используйте PATCH.',
        syntax: `app.put(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь с идентификатором ресурса: "/items/{item_id}". PUT всегда адресует конкретный ресурс.' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации обновлённого объекта в ответе.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK. Иногда используют 204 No Content если тело ответа не нужно.' },
            { name: 'tags', description: 'Теги для группировки в документации.' },
            { name: 'dependencies', description: 'Зависимости Depends() — например, проверка аутентификации и права на изменение ресурса.' },
            { name: 'summary', description: 'Краткое описание операции в Swagger UI.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации.' },
            { name: 'responses', description: 'Дополнительные коды ответов: {404: {"model": ErrorModel}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля из ответа.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    in_stock: bool = True

db: dict[int, Item] = {
    1: Item(name="Ноутбук", price=89999.0),
    2: Item(name="Мышь",    price=1499.0),
}

@app.put(
    "/items/{item_id}",
    response_model=Item,
    status_code=200,
    tags=["items"],
    summary="Полностью заменить товар",
    description=(
        "Заменяет все поля товара переданными данными.\\n\\n"
        "**Важно**: все поля обязательны — незаполненные будут сброшены к значениям по умолчанию.\\n\\n"
        "Для частичного обновления используйте **PATCH**."
    ),
    responses={404: {"description": "Товар не найден"}},
)
def replace_item(item_id: int, item: Item):
    if item_id not in db:
        raise HTTPException(status_code=404, detail="Товар не найден")
    db[item_id] = item          # полная замена
    return item

# PUT vs PATCH:
# PUT  /items/1 {"name":"X","price":1.0,"in_stock":false} → полная замена
# PATCH /items/1 {"price":2.0}                            → только price`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.delete()',
        description: 'Декоратор для регистрации обработчика HTTP DELETE-запроса. Используется для удаления ресурса по идентификатору. Идемпотентен: повторное удаление уже несуществующего ресурса не должно вызывать ошибку (или возвращает 404 — оба варианта допустимы в REST). Чаще всего возвращает 204 No Content или 200 с телом ответа.',
        syntax: `app.delete(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь с идентификатором удаляемого ресурса: "/items/{item_id}".' },
            { name: 'response_model', description: 'Модель ответа. Для DELETE часто None — при status_code=204 тело ответа отсутствует.' },
            { name: 'status_code', description: 'HTTP-код ответа. Используйте 204 (No Content) для удаления без тела или 200 для ответа с подтверждением.' },
            { name: 'tags', description: 'Теги для группировки в документации.' },
            { name: 'dependencies', description: 'Зависимости Depends() — например, проверка прав на удаление.' },
            { name: 'summary', description: 'Краткое описание операции в Swagger UI.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации.' },
            { name: 'responses', description: 'Дополнительные коды ответов: {404: {"description": "Не найдено"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в схеме OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля из ответа.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

class DeletedResponse(BaseModel):
    message: str
    deleted_id: int

db: dict[int, Item] = {
    1: Item(name="Ноутбук", price=89999.0),
    2: Item(name="Мышь",    price=1499.0),
}

# Вариант 1: 204 No Content — без тела ответа
@app.delete("/items/{item_id}", status_code=204, tags=["items"])
def delete_item_no_content(item_id: int):
    if item_id not in db:
        raise HTTPException(status_code=404, detail="Товар не найден")
    del db[item_id]
    return Response(status_code=204)

# Вариант 2: 200 с подтверждением удаления
@app.delete(
    "/items/{item_id}/confirm",
    response_model=DeletedResponse,
    status_code=200,
    tags=["items"],
    summary="Удалить товар с подтверждением",
    responses={404: {"description": "Товар не найден"}},
)
def delete_item(item_id: int):
    if item_id not in db:
        raise HTTPException(status_code=404, detail="Товар не найден")
    del db[item_id]
    return DeletedResponse(message="Товар удалён", deleted_id=item_id)`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.patch()',
        description: 'Декоратор для регистрации обработчика HTTP PATCH-запроса. PATCH используется для частичного обновления ресурса — клиент передаёт только изменяемые поля, остальные остаются прежними. В отличие от PUT не требует передачи полного объекта. Реализуется через Pydantic-модель с Optional-полями и exclude_unset=True.',
        syntax: `app.patch(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь с идентификатором ресурса: "/items/{item_id}".' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации обновлённого ресурса в ответе.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK.' },
            { name: 'tags', description: 'Теги для группировки в документации.' },
            { name: 'dependencies', description: 'Зависимости Depends() для маршрута.' },
            { name: 'summary', description: 'Краткое описание операции в Swagger UI.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля из ответа. Полезно для PATCH — возвращать только изменённые поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    in_stock: bool = True

class ItemUpdate(BaseModel):
    """Все поля Optional — клиент передаёт только то, что хочет изменить."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    in_stock: Optional[bool] = None

db: dict[int, Item] = {
    1: Item(name="Ноутбук", price=89999.0),
    2: Item(name="Мышь",    price=1499.0),
}

@app.patch(
    "/items/{item_id}",
    response_model=Item,
    tags=["items"],
    summary="Частично обновить товар",
    description=(
        "Обновляет только переданные поля товара.\\n\\n"
        "Непереданные поля остаются без изменений."
    ),
)
def update_item(item_id: int, update: ItemUpdate):
    if item_id not in db:
        raise HTTPException(status_code=404, detail="Товар не найден")

    stored = db[item_id]
    # model_dump(exclude_unset=True) — только явно переданные поля
    patch_data = update.model_dump(exclude_unset=True)
    updated = stored.model_copy(update=patch_data)
    db[item_id] = updated
    return updated

# PATCH /items/1 {"price": 79999.0}
# → только price изменится, name/description/in_stock — прежние`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.options()',
        description: 'Декоратор для регистрации обработчика HTTP OPTIONS-запроса. OPTIONS используется для определения допустимых методов и опций для указанного ресурса — браузеры автоматически отправляют preflight OPTIONS-запросы при CORS. FastAPI регистрирует обработчик так же, как и для других методов, и включает его в документацию OpenAPI.',
        syntax: `app.options(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Может содержать path-параметры: "/items/{item_id}".' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации ответа. Для OPTIONS чаще всего не используется — ответ пустой или содержит список разрешённых методов.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK. Для OPTIONS иногда используют 204 No Content.' },
            { name: 'tags', description: 'Теги для группировки маршрута в документации Swagger UI.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации. По умолчанию "Successful Response".' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим в документации.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в схеме OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля из ответа.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить поля со значением None из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему и документацию. По умолчанию True.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для объекта Operation в схеме OpenAPI.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id для маршрута.' },
        ],
        example: `from fastapi import FastAPI, Response

app = FastAPI()

ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS"

@app.options(
    "/items",
    status_code=204,
    tags=["items"],
    summary="Получить допустимые методы для /items",
    include_in_schema=True,
)
def options_items(response: Response):
    response.headers["Allow"] = ALLOWED_METHODS
    response.headers["Access-Control-Allow-Methods"] = ALLOWED_METHODS
    return Response(status_code=204)

# OPTIONS /items
# < HTTP/1.1 204 No Content
# < Allow: GET, POST, PUT, DELETE, OPTIONS
# < Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.head()',
        description: 'Декоратор для регистрации обработчика HTTP HEAD-запроса. HEAD идентичен GET, но сервер возвращает только заголовки — без тела ответа. Используется для проверки существования ресурса, получения метаданных (Content-Length, Last-Modified, ETag) и валидации кэша без передачи данных. FastAPI автоматически отбрасывает тело при отправке ответа.',
        syntax: `app.head(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Должен совпадать с путём соответствующего GET-маршрута.' },
            { name: 'response_model', description: 'Pydantic-модель. Тело ответа не отправляется, но модель используется для генерации заголовков Content-Length и схемы OpenAPI.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK. Те же коды, что и у GET-маршрута.' },
            { name: 'tags', description: 'Теги для группировки маршрута в документации.' },
            { name: 'dependencies', description: 'Зависимости Depends(), например, аутентификация.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import FastAPI, Response
from datetime import datetime, timezone

app = FastAPI()

# Имитация хранилища файлов
files_db: dict[str, dict] = {
    "report.pdf": {
        "size": 204800,
        "etag": "abc123",
        "last_modified": datetime(2024, 6, 1, tzinfo=timezone.utc),
    }
}

@app.head(
    "/files/{filename}",
    status_code=200,
    tags=["files"],
    summary="Получить метаданные файла без загрузки",
)
def head_file(filename: str, response: Response):
    if filename not in files_db:
        response.status_code = 404
        return
    meta = files_db[filename]
    response.headers["Content-Length"] = str(meta["size"])
    response.headers["ETag"] = meta["etag"]
    response.headers["Last-Modified"] = meta["last_modified"].strftime(
        "%a, %d %b %Y %H:%M:%S GMT"
    )

# HEAD /files/report.pdf
# < HTTP/1.1 200 OK
# < Content-Length: 204800
# < ETag: abc123
# < Last-Modified: Sat, 01 Jun 2024 00:00:00 GMT
# (тело отсутствует)`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.trace()',
        description: 'Декоратор для регистрации обработчика HTTP TRACE-запроса. TRACE используется для диагностики: сервер возвращает полученный запрос обратно клиенту (loop-back), позволяя выявить изменения, внесённые промежуточными прокси. В большинстве production-приложений TRACE отключён по соображениям безопасности (XST-атаки). FastAPI позволяет зарегистрировать обработчик TRACE так же, как и любой другой метод.',
        syntax: `app.trace(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута, для которого включается TRACE. Обычно "/" или конкретный диагностический путь.' },
            { name: 'response_model', description: 'Pydantic-модель для ответа. Для TRACE стандартный ответ — зеркало входящего запроса с Content-Type: message/http.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK.' },
            { name: 'tags', description: 'Теги для группировки в документации.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse

app = FastAPI()

@app.trace(
    "/debug",
    status_code=200,
    tags=["debug"],
    summary="Диагностический TRACE-эхо",
    description=(
        "Возвращает полученный запрос клиенту в виде текста.\\n\\n"
        "**Внимание:** отключите в production — уязвимость XST."
    ),
    response_class=PlainTextResponse,
)
async def trace_debug(request: Request):
    # Собираем стартовую строку и заголовки запроса
    headers = "\\n".join(
        f"{name}: {value}" for name, value in request.headers.items()
    )
    body = await request.body()
    echo = (
        f"TRACE {request.url.path} HTTP/1.1\\n"
        f"{headers}\\n\\n"
        f"{body.decode() if body else ''}"
    )
    return PlainTextResponse(content=echo, media_type="message/http")

# TRACE /debug HTTP/1.1
# < HTTP/1.1 200 OK
# < Content-Type: message/http
# <
# TRACE /debug HTTP/1.1
# host: localhost:8000
# user-agent: curl/8.4.0`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.websocket()',
        description: 'Декоратор для регистрации обработчика WebSocket-соединения. WebSocket — двунаправленный постоянный канал связи между клиентом и сервером. В отличие от HTTP-маршрутов, WebSocket-обработчик принимает объект WebSocket и управляет соединением вручную: принимает, читает, отправляет данные и закрывает соединение.',
        syntax: `app.websocket(path, name=None)`,
        arguments: [
            { name: 'path', description: 'URL-путь WebSocket-маршрута. Может содержать path-параметры: "/ws/{client_id}". Клиент подключается через ws:// или wss://.' },
            { name: 'name', description: 'Имя маршрута для url_path_for(). По умолчанию — имя функции-обработчика.' },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# Менеджер активных подключений
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: str):
        for connection in self.active:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(ws: WebSocket, client_id: int):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(f"Клиент {client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(ws)
        await manager.broadcast(f"Клиент {client_id} отключился")

# Подключение: ws://localhost:8000/ws/42`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.include_router()',
        description: 'Подключает APIRouter к приложению, объединяя все маршруты роутера с маршрутами приложения. Позволяет разбить большое приложение на модули: каждый модуль определяет свой роутер, а главный файл собирает их вместе. Можно задать общий prefix, теги, зависимости и класс ответа для всех маршрутов роутера.',
        syntax: `app.include_router(
    router,
    *,
    prefix="",
    tags=None,
    dependencies=None,
    default_response_class=Default(JSONResponse),
    responses=None,
    callbacks=None,
    deprecated=None,
    include_in_schema=True,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'router', description: 'Экземпляр APIRouter, содержащий маршруты для подключения.' },
            { name: 'prefix', description: 'Префикс URL, добавляемый перед всеми маршрутами роутера. Например, prefix="/api/v1" превратит "/items" в "/api/v1/items".' },
            { name: 'tags', description: 'Список тегов, добавляемых ко всем маршрутам роутера в документации. Объединяются с тегами самих маршрутов.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые ко всем маршрутам роутера (аутентификация, проверка прав).' },
            { name: 'default_response_class', description: 'Класс ответа по умолчанию для всех маршрутов роутера.' },
            { name: 'responses', description: 'Дополнительные коды ответов, общие для всех маршрутов роутера: {401: {"description": "Не авторизован"}}.' },
            { name: 'callbacks', description: 'Колбэки OpenAPI, применяемые ко всем маршрутам роутера.' },
            { name: 'deprecated', description: 'Помечает все маршруты роутера устаревшими в документации.' },
            { name: 'include_in_schema', description: 'Включать ли маршруты роутера в схему OpenAPI. По умолчанию True.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id для маршрутов роутера.' },
        ],
        example: `# routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()

class User(BaseModel):
    id: int
    name: str

fake_users = {1: User(id=1, name="Алиса"), 2: User(id=2, name="Боб")}

@router.get("/{user_id}", response_model=User)
def get_user(user_id: int):
    if user_id not in fake_users:
        raise HTTPException(404, "Пользователь не найден")
    return fake_users[user_id]

@router.get("/", response_model=list[User])
def list_users():
    return list(fake_users.values())

# main.py
from fastapi import FastAPI
from routers import users

app = FastAPI()

app.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Не найдено"}},
)

# GET /users/       → список пользователей
# GET /users/1      → пользователь с id=1`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.mount()',
        description: 'Монтирует отдельное ASGI-приложение (или статические файлы) по заданному пути. Все запросы, начинающиеся с указанного пути, передаются смонтированному приложению. Используется для подключения StaticFiles, других FastAPI/Starlette приложений или любых ASGI-совместимых сервисов.',
        syntax: `app.mount(path, app=None, name=None)`,
        arguments: [
            { name: 'path', description: 'URL-префикс, по которому монтируется приложение. Все запросы с этим префиксом направляются в смонтированное приложение. Например, "/static".' },
            { name: 'app', description: 'ASGI-приложение для монтирования. Чаще всего — StaticFiles(directory="...") для раздачи файлов, или другой экземпляр FastAPI/Starlette.' },
            { name: 'name', description: 'Имя смонтированного приложения для url_path_for(). По умолчанию None.' },
        ],
        example: `from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse
from starlette.routing import Route

app = FastAPI()

# 1. Раздача статических файлов из папки "static"
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. Монтирование вложенного ASGI-приложения
def legacy_homepage(request):
    return PlainTextResponse("Старый сайт")

legacy_app = Starlette(routes=[Route("/", legacy_homepage)])
app.mount("/legacy", legacy_app)

@app.get("/")
def root():
    return {"message": "Главное FastAPI-приложение"}

# GET /           → {"message": "Главное FastAPI-приложение"}
# GET /static/logo.png  → файл из папки static/
# GET /legacy/    → "Старый сайт" (legacy ASGI-приложение)`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.add_middleware()',
        description: 'Добавляет middleware (промежуточный обработчик) к приложению. Middleware перехватывает каждый запрос до передачи обработчику маршрута и каждый ответ до отправки клиенту — удобно для логирования, аутентификации, CORS, сжатия, трассировки и других сквозных задач. Middleware добавляются в стек: последнее добавленное выполняется первым.',
        syntax: `app.add_middleware(middleware_class, **options)`,
        arguments: [
            { name: 'middleware_class', description: 'Класс middleware. Должен быть совместим со Starlette: принимать app в __init__ и реализовывать async def __call__(scope, receive, send). Встроенные: CORSMiddleware, GZipMiddleware, HTTPSRedirectMiddleware, TrustedHostMiddleware.' },
            { name: '**options', description: 'Именованные аргументы, передаваемые в конструктор middleware_class. Например, для CORSMiddleware: allow_origins=["*"], allow_methods=["*"].' },
        ],
        example: `from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time

app = FastAPI()

# 1. CORS — разрешить запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Сжатие ответов GZip
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Собственный middleware для измерения времени запроса
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        response.headers["X-Process-Time"] = f"{duration:.4f}s"
        return response

app.add_middleware(TimingMiddleware)

@app.get("/items")
def get_items():
    return [{"id": 1, "name": "Ноутбук"}]`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.add_exception_handler()',
        description: 'Регистрирует обработчик исключений для конкретного класса исключения или HTTP-статус-кода. Когда в любом маршруте возникает указанное исключение или возвращается указанный статус, FastAPI вызывает зарегистрированный обработчик вместо стандартного. Позволяет возвращать пользовательские форматы ошибок (например, JSON вместо HTML).',
        syntax: `app.add_exception_handler(exc_class_or_status_code, handler)`,
        arguments: [
            { name: 'exc_class_or_status_code', description: 'Класс исключения (например, ValueError, HTTPException) или целочисленный HTTP-статус-код (например, 404, 500). При возникновении этого исключения или статуса вызывается handler.' },
            { name: 'handler', description: 'Async или sync функция с сигнатурой handler(request: Request, exc: Exception) -> Response. Должна возвращать объект Response.' },
        ],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

# 1. Обработчик по классу исключения
class ItemNotFoundError(Exception):
    def __init__(self, item_id: int):
        self.item_id = item_id

async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"error": "not_found", "item_id": exc.item_id},
    )

app.add_exception_handler(ItemNotFoundError, item_not_found_handler)

# 2. Обработчик по HTTP-статус-коду
async def custom_404_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"error": "Страница не найдена", "path": str(request.url)},
    )

app.add_exception_handler(404, custom_404_handler)

# 3. Глобальный обработчик непредвиденных ошибок
async def global_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Внутренняя ошибка сервера"},
    )

app.add_exception_handler(Exception, global_error_handler)

db = {1: "Ноутбук", 2: "Мышь"}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in db:
        raise ItemNotFoundError(item_id)
    return {"name": db[item_id]}`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.add_event_handler()',
        description: 'Регистрирует обработчик события жизненного цикла приложения: "startup" (запуск) или "shutdown" (остановка). Позволяет выполнять инициализацию (подключение к БД, загрузка моделей ML, прогрев кэша) при старте и освобождение ресурсов при остановке. Устарел — рекомендуется использовать параметр lifespan в FastAPI().',
        syntax: `app.add_event_handler(event_type, func)`,
        arguments: [
            { name: 'event_type', description: 'Строка "startup" или "shutdown". "startup" — вызывается после запуска сервера, до принятия запросов. "shutdown" — вызывается при остановке, после обработки последнего запроса.' },
            { name: 'func', description: 'Async или sync функция без аргументов, вызываемая при наступлении события.' },
        ],
        example: `from fastapi import FastAPI

app = FastAPI()

# Имитация пула соединений с БД
class FakeDB:
    connected = False

    async def connect(self):
        self.connected = True
        print("БД подключена")

    async def disconnect(self):
        self.connected = False
        print("БД отключена")

db = FakeDB()

async def startup_handler():
    await db.connect()
    print("Приложение запущено, ресурсы инициализированы")

async def shutdown_handler():
    await db.disconnect()
    print("Приложение остановлено, ресурсы освобождены")

app.add_event_handler("startup", startup_handler)
app.add_event_handler("shutdown", shutdown_handler)

@app.get("/status")
def status():
    return {"db_connected": db.connected}

# Предпочтительная альтернатива через lifespan:
# from contextlib import asynccontextmanager
# @asynccontextmanager
# async def lifespan(app):
#     await db.connect()
#     yield
#     await db.disconnect()
# app = FastAPI(lifespan=lifespan)`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.middleware()',
        description: 'Декоратор для регистрации middleware через функцию. Альтернатива app.add_middleware() — позволяет определить middleware прямо в виде декорированной async-функции. В настоящее время поддерживается только тип "http". Внутри функции нужно вызвать await call_next(request) для передачи запроса дальше по цепочке.',
        syntax: `app.middleware(middleware_type)`,
        arguments: [
            { name: 'middleware_type', description: 'Строка, определяющая тип middleware. На данный момент поддерживается только "http".' },
        ],
        example: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import time
import uuid

app = FastAPI()

# Middleware для добавления Request-ID и замера времени
@app.middleware("http")
async def request_id_and_timing(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.perf_counter()

    response = await call_next(request)

    duration = time.perf_counter() - start
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    return response

# Middleware для блокировки запрещённых IP
BLOCKED_IPS = {"10.0.0.1", "192.168.1.100"}

@app.middleware("http")
async def block_ips(request: Request, call_next):
    client_ip = request.client.host if request.client else ""
    if client_ip in BLOCKED_IPS:
        return JSONResponse(status_code=403, content={"error": "Доступ запрещён"})
    return await call_next(request)

@app.get("/")
def root():
    return {"message": "Hello"}`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.exception_handler()',
        description: 'Декоратор для регистрации обработчика исключений. Альтернатива app.add_exception_handler() в виде декоратора — позволяет определить обработчик прямо над функцией. Принимает класс исключения или HTTP-статус-код. Декорированная функция должна принимать request и exc, и возвращать Response.',
        syntax: `app.exception_handler(exc_class_or_status_code)`,
        arguments: [
            { name: 'exc_class_or_status_code', description: 'Класс исключения (например, ValueError, HTTPException) или целочисленный HTTP-статус-код (например, 404, 422). При возникновении этого исключения вызывается декорированная функция.' },
        ],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler

app = FastAPI()

# Обработчик пользовательского исключения
class UnicornException(Exception):
    def __init__(self, name: str):
        self.name = name

@app.exception_handler(UnicornException)
async def unicorn_exception_handler(request: Request, exc: UnicornException):
    return JSONResponse(
        status_code=418,
        content={"message": f"Ошибка единорога: {exc.name}"},
    )

# Переопределение стандартного обработчика 404
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "path": str(request.url.path),
            "hint": "Проверьте правильность URL",
        },
    )

# Переопределение обработчика ошибок валидации (422)
@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "detail": exc.errors()},
    )

@app.get("/unicorns/{name}")
def get_unicorn(name: str):
    if name == "yolo":
        raise UnicornException(name=name)
    return {"unicorn_name": name}`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.on_event()',
        description: 'Декоратор для регистрации обработчика события жизненного цикла приложения. Альтернатива app.add_event_handler() в виде декоратора. Поддерживает события "startup" и "shutdown". Устарел начиная с FastAPI 0.93 — рекомендуется использовать параметр lifespan в FastAPI() с asynccontextmanager.',
        syntax: `app.on_event(event_type)`,
        arguments: [
            { name: 'event_type', description: 'Строка "startup" или "shutdown". "startup" — выполняется перед началом приёма запросов. "shutdown" — выполняется после завершения обработки последнего запроса.' },
        ],
        example: `from fastapi import FastAPI

app = FastAPI()

# Кэш, который инициализируется при старте
cache: dict = {}

@app.on_event("startup")
async def load_cache():
    """Загружает начальные данные в кэш при запуске."""
    cache["config"] = {"max_items": 100, "debug": False}
    cache["items"] = {1: "Ноутбук", 2: "Мышь", 3: "Клавиатура"}
    print(f"Кэш загружен: {len(cache['items'])} товаров")

@app.on_event("startup")
async def connect_services():
    """Можно зарегистрировать несколько startup-обработчиков."""
    print("Подключение к внешним сервисам...")

@app.on_event("shutdown")
async def flush_cache():
    """Сохраняет кэш при остановке."""
    cache.clear()
    print("Кэш очищен, ресурсы освобождены")

@app.get("/items")
def list_items():
    return cache.get("items", {})

# Современная альтернатива (рекомендуется):
# from contextlib import asynccontextmanager
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     cache["items"] = {1: "Ноутбук"}   # startup
#     yield
#     cache.clear()                       # shutdown
# app = FastAPI(lifespan=lifespan)`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.openapi()',
        description: 'Возвращает схему OpenAPI приложения в виде словаря Python. При первом вызове генерирует схему и кэширует её в app.openapi_schema — последующие вызовы возвращают кэшированный результат. Можно переопределить метод для кастомизации схемы: добавления нестандартных расширений, изменения структуры или подмены отдельных компонентов.',
        syntax: `app.openapi()`,
        arguments: [],
        example: `from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI()

@app.get("/items/{item_id}")
def get_item(item_id: int):
    return {"item_id": item_id}

# Переопределение схемы OpenAPI для кастомизации
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title="Мой кастомный API",
        version="3.0.0",
        description="Расширенное описание с кастомными полями",
        routes=app.routes,
    )

    # Добавляем нестандартное расширение
    schema["info"]["x-logo"] = {"url": "https://example.com/logo.png"}

    # Принудительно задаём Bearer-аутентификацию для всех операций
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {"type": "http", "scheme": "bearer"}
    }
    for path in schema.get("paths", {}).values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi

# GET /openapi.json → кастомная схема с x-logo и security`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.url_path_for()',
        description: 'Возвращает URL-путь маршрута по его имени и path-параметрам. Позволяет формировать URL программно, не hardcode-я строки — при переименовании маршрута достаточно обновить только его имя. Возвращает объект URL, который автоматически приводится к строке. Полезно в middleware, обработчиках ошибок, при генерации ссылок в ответах.',
        syntax: `app.url_path_for(name, **path_params)`,
        arguments: [
            { name: 'name', description: 'Имя маршрута — по умолчанию совпадает с именем функции-обработчика. Можно задать явно через параметр name в декораторе маршрута.' },
            { name: '**path_params', description: 'Именованные аргументы для подстановки в path-параметры маршрута. Например, для пути "/items/{item_id}" нужно передать item_id=42.' },
        ],
        example: `from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse

app = FastAPI()

@app.get("/items/{item_id}", name="get_item")
def get_item(item_id: int):
    return {"item_id": item_id}

@app.get("/users/{user_id}/items/{item_id}", name="get_user_item")
def get_user_item(user_id: int, item_id: int):
    return {"user_id": user_id, "item_id": item_id}

@app.get("/redirect-to-item")
def redirect_to_item():
    # Формируем URL по имени маршрута — без хардкода пути
    url = app.url_path_for("get_item", item_id=42)
    return RedirectResponse(url=url)

@app.get("/links")
def get_links(request: Request):
    # url_path_for возвращает относительный путь
    item_url = request.url_for("get_item", item_id=1)      # абсолютный URL
    path_only = app.url_path_for("get_item", item_id=1)    # только путь

    return {
        "absolute": str(item_url),   # http://localhost:8000/items/1
        "path": str(path_only),      # /items/1
    }`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.state',
        description: 'Объект-хранилище для произвольных данных уровня приложения. Позволяет прикреплять к приложению любые атрибуты — соединение с БД, HTTP-клиент, конфигурацию, ML-модель — и получать к ним доступ из любого маршрута через request.app.state. Данные живут всё время жизни процесса. Инициализация обычно происходит в lifespan или startup-обработчике.',
        syntax: `app.state`,
        arguments: [
            { name: 'app.state.<attr>', description: 'Произвольный атрибут, установленный на объект state. Читается из маршрутов через request.app.state.<attr>.' },
        ],
        example: `from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: создаём общий HTTP-клиент и кэш
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    app.state.cache = {}
    app.state.config = {"max_retries": 3, "debug": False}
    print("Ресурсы инициализированы")
    yield
    # Shutdown: освобождаем ресурсы
    await app.state.http_client.aclose()
    app.state.cache.clear()
    print("Ресурсы освобождены")

app = FastAPI(lifespan=lifespan)

@app.get("/external-data")
async def get_external_data(request: Request):
    client = request.app.state.http_client
    cache = request.app.state.cache

    if "data" not in cache:
        response = await client.get("https://httpbin.org/json")
        cache["data"] = response.json()

    return cache["data"]

@app.get("/config")
def get_config(request: Request):
    return request.app.state.config`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.dependency_overrides',
        description: 'Словарь для подмены зависимостей (Depends) во время выполнения. Ключ — оригинальная функция-зависимость, значение — функция-заменитель. Используется в первую очередь в тестах для подмены реальных зависимостей (БД, аутентификация, внешние сервисы) на тестовые заглушки без изменения кода приложения.',
        syntax: `app.dependency_overrides`,
        arguments: [
            { name: 'app.dependency_overrides[original_dep]', description: 'Подмена зависимости: ключ — оригинальная функция Depends(), значение — функция-заменитель с совместимой сигнатурой.' },
        ],
        example: `from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

app = FastAPI()

# Реальная зависимость — подключение к БД
def get_db():
    db = {"connected": True, "items": {1: "Ноутбук", 2: "Мышь"}}
    try:
        yield db
    finally:
        pass  # закрытие соединения

# Реальная зависимость — текущий пользователь
def get_current_user():
    return {"id": 1, "name": "Алиса", "role": "admin"}

@app.get("/items")
def list_items(db=Depends(get_db), user=Depends(get_current_user)):
    return {"user": user["name"], "items": list(db["items"].values())}

# --- Тесты ---
def override_get_db():
    """Тестовая БД — изолированная, без реального соединения."""
    yield {"connected": False, "items": {99: "Тестовый товар"}}

def override_get_current_user():
    """Тестовый пользователь с минимальными правами."""
    return {"id": 99, "name": "Тест", "role": "user"}

# Подменяем зависимости только для тестов
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)
response = client.get("/items")
# {"user": "Тест", "items": ["Тестовый товар"]}

# Сбрасываем подмены после тестов
app.dependency_overrides = {}`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.router',
        description: 'Внутренний экземпляр APIRouter, который хранит все маршруты приложения. FastAPI является обёрткой вокруг Starlette — все маршруты, добавленные через декораторы (@app.get и т.д.), фактически регистрируются в app.router. Прямой доступ к router нужен редко — обычно для динамического добавления маршрутов или интроспекции.',
        syntax: `app.router`,
        arguments: [
            { name: 'app.router.routes', description: 'Список всех зарегистрированных маршрутов (Route, WebSocketRoute и др.).' },
            { name: 'app.router.on_startup', description: 'Список startup-обработчиков, зарегистрированных через on_event("startup") или add_event_handler.' },
            { name: 'app.router.on_shutdown', description: 'Список shutdown-обработчиков.' },
        ],
        example: `from fastapi import FastAPI, APIRouter
from fastapi.routing import APIRoute

app = FastAPI()

@app.get("/items", name="list_items", tags=["items"])
def list_items():
    return [{"id": 1}]

@app.get("/users", name="list_users", tags=["users"])
def list_users():
    return [{"id": 1}]

# Интроспекция маршрутов через app.router
print(type(app.router))  # <class 'fastapi.routing.APIRouter'>

for route in app.router.routes:
    if isinstance(route, APIRoute):
        print(f"{route.methods} {route.path!r} → {route.name}")
# {'GET'} '/items' → list_items
# {'GET'} '/users' → list_users

# Динамическое добавление маршрута через router
def dynamic_handler():
    return {"source": "dynamic"}

app.router.add_api_route(
    "/dynamic",
    dynamic_handler,
    methods=["GET"],
    name="dynamic_route",
)`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.routes',
        description: 'Список всех маршрутов приложения — сокращение для app.router.routes. Содержит объекты Route, APIRoute, WebSocketRoute и Mount. Полезен для интроспекции: получения всех зарегистрированных путей, методов, имён обработчиков. Также включает служебные маршруты FastAPI (документация, схема OpenAPI).',
        syntax: `app.routes`,
        arguments: [
            { name: 'route.path', description: 'URL-путь маршрута, например "/items/{item_id}".' },
            { name: 'route.methods', description: 'Множество HTTP-методов маршрута: {"GET"}, {"POST", "PUT"} и т.д.' },
            { name: 'route.name', description: 'Имя маршрута — по умолчанию имя функции-обработчика.' },
            { name: 'route.endpoint', description: 'Функция-обработчик маршрута.' },
        ],
        example: `from fastapi import FastAPI
from fastapi.routing import APIRoute

app = FastAPI()

@app.get("/items")
def list_items():
    return []

@app.post("/items")
def create_item():
    return {}

@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}

# Выводим все маршруты приложения
print("Все маршруты:")
for route in app.routes:
    if isinstance(route, APIRoute):
        print(f"  {sorted(route.methods)} {route.path}")
# ['GET'] /openapi.json   (служебный)
# ['GET'] /docs           (служебный)
# ['GET'] /redoc          (служебный)
# ['GET'] /items
# ['POST'] /items
# ['GET'] /users/{user_id}

# Поиск маршрута по имени
def find_route(name: str):
    return next(
        (r for r in app.routes if isinstance(r, APIRoute) and r.name == name),
        None,
    )

route = find_route("get_user")
if route:
    print(f"Найден: {route.path}, обработчик: {route.endpoint.__name__}")`,
    },

    {
        category: 'FastAPI (приложение)',
        name: 'app.debug',
        description: 'Булев атрибут, включающий режим отладки приложения. В режиме debug=True Starlette возвращает подробные трассировки ошибок в теле HTTP-ответа вместо стандартного "Internal Server Error". Устанавливается через параметр debug в конструкторе FastAPI() или напрямую. Никогда не включайте в production — трассировки могут раскрыть структуру кода и чувствительные данные.',
        syntax: `app.debug`,
        arguments: [
            { name: 'app.debug', description: 'bool. True — подробные трассировки ошибок в ответе. False — стандартное "Internal Server Error". По умолчанию False.' },
        ],
        example: `import os
from fastapi import FastAPI

# Задаём debug через переменную окружения — безопасный подход
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

app = FastAPI(debug=DEBUG)

# Или динамически после создания:
# app.debug = True

@app.get("/crash")
def crash():
    # В debug-режиме клиент увидит полный traceback
    # В production — только {"detail": "Internal Server Error"}
    raise RuntimeError("Тестовая ошибка")

@app.get("/debug-status")
def debug_status():
    return {"debug": app.debug}

# Запуск в dev-режиме:
# DEBUG=true uvicorn main:app --reload
#
# Запуск в production (debug ВЫКЛЮЧЕН):
# uvicorn main:app --host 0.0.0.0 --port 8000`,
    },

    // ─── APIRouter ────────────────────────────────────────────────────────────
    {
        category: 'APIRouter',
        name: 'APIRouter()',
        description: 'Класс для создания модульного роутера — изолированного набора маршрутов, который затем подключается к приложению через app.include_router(). Позволяет разбить большое приложение на независимые модули (users, items, auth), каждый в своём файле. Поддерживает все те же параметры, что и FastAPI(), применяя их ко всем маршрутам роутера.',
        syntax: `APIRouter(
    *,
    prefix="",
    tags=None,
    dependencies=None,
    default_response_class=Default(JSONResponse),
    responses=None,
    callbacks=None,
    routes=None,
    redirect_slashes=True,
    default=None,
    dependency_overrides_provider=None,
    route_class=APIRoute,
    on_startup=None,
    on_shutdown=None,
    lifespan=None,
    deprecated=None,
    include_in_schema=True,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'prefix', description: 'URL-префикс для всех маршрутов роутера. Например, prefix="/users" сделает "/me" доступным как "/users/me". Складывается с prefix из app.include_router().' },
            { name: 'tags', description: 'Список тегов по умолчанию для всех маршрутов роутера в документации. Объединяется с тегами отдельных маршрутов и тегами из include_router().' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые ко всем маршрутам роутера — аутентификация, проверка прав, rate limiting.' },
            { name: 'default_response_class', description: 'Класс ответа по умолчанию для всех маршрутов роутера. Переопределяет глобальный default_response_class приложения.' },
            { name: 'responses', description: 'Дополнительные коды ответов, общие для всех маршрутов роутера: {401: {"description": "Не авторизован"}, 403: {"description": "Нет прав"}}.' },
            { name: 'callbacks', description: 'Колбэки OpenAPI, применяемые ко всем маршрутам роутера.' },
            { name: 'routes', description: 'Список маршрутов для инициализации роутера. Обычно не используется — маршруты добавляются через декораторы.' },
            { name: 'redirect_slashes', description: 'Автоматически перенаправлять запросы с/без завершающего слеша. По умолчанию True.' },
            { name: 'default', description: 'ASGI-приложение для обработки запросов, не совпавших ни с одним маршрутом роутера.' },
            { name: 'dependency_overrides_provider', description: 'Объект, предоставляющий словарь dependency_overrides. Обычно устанавливается автоматически при include_router().' },
            { name: 'route_class', description: 'Класс маршрута для всех маршрутов роутера. По умолчанию APIRoute. Можно заменить кастомным классом для изменения поведения (логирование, трансформация запросов).' },
            { name: 'on_startup', description: 'Список startup-обработчиков. Устарел — используйте lifespan.' },
            { name: 'on_shutdown', description: 'Список shutdown-обработчиков. Устарел — используйте lifespan.' },
            { name: 'lifespan', description: 'Async context manager жизненного цикла роутера — аналог lifespan в FastAPI().' },
            { name: 'deprecated', description: 'Помечает все маршруты роутера устаревшими в документации.' },
            { name: 'include_in_schema', description: 'Включать ли все маршруты роутера в схему OpenAPI. По умолчанию True.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id для маршрутов роутера.' },
        ],
        example: `# routers/items.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

class Item(BaseModel):
    id: int
    name: str
    price: float

class ErrorResponse(BaseModel):
    detail: str

# Зависимость-заглушка для аутентификации
def require_auth(token: str = ""):
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    return token

router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(require_auth)],      # применяется ко всем маршрутам
    responses={
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        404: {"model": ErrorResponse, "description": "Не найдено"},
    },
)

db: dict[int, Item] = {
    1: Item(id=1, name="Ноутбук", price=89999.0),
    2: Item(id=2, name="Мышь",    price=1499.0),
}

@router.get("/", response_model=list[Item])
def list_items():
    return list(db.values())

@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    if item_id not in db:
        raise HTTPException(404, "Товар не найден")
    return db[item_id]

@router.post("/", response_model=Item, status_code=201)
def create_item(item: Item):
    db[item.id] = item
    return item

# main.py
from fastapi import FastAPI
from routers import items

app = FastAPI()
app.include_router(items.router)

# GET /items/        → список товаров (требует token)
# GET /items/1       → товар #1
# POST /items/       → создать товар`,
    },

    {
        category: 'APIRouter',
        name: 'router.get()',
        description: 'Декоратор для регистрации обработчика HTTP GET-запроса на роутере. Полностью идентичен app.get() по набору параметров и поведению, но регистрирует маршрут на APIRouter, а не напрямую на приложении. Маршруты роутера становятся частью приложения после app.include_router(router). Prefix роутера и prefix из include_router() складываются с path маршрута.',
        syntax: `router.get(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута относительно prefix роутера. Если router имеет prefix="/users", то path="/{user_id}" даёт итоговый путь "/users/{user_id}".' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации и валидации ответа. Определяет схему в документации.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200.' },
            { name: 'tags', description: 'Теги маршрута. Объединяются с тегами роутера и тегами из include_router().' },
            { name: 'dependencies', description: 'Зависимости Depends() для маршрута. Добавляются к зависимостям роутера и приложения.' },
            { name: 'summary', description: 'Краткое описание маршрута в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown. Берётся из docstring, если не задано явно.' },
            { name: 'response_description', description: 'Описание успешного ответа в документации. По умолчанию "Successful Response".' },
            { name: 'responses', description: 'Дополнительные коды ответов. Объединяются с responses роутера и приложения.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим в документации.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля из ответа.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить поля со значением None.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему. По умолчанию True.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для объекта Operation в схеме OpenAPI.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `# routers/products.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

class Product(BaseModel):
    id: int
    name: str
    price: float
    category: str
    in_stock: bool = True

class ProductPublic(BaseModel):
    """Публичная схема — без служебных полей."""
    id: int
    name: str
    price: float

router = APIRouter(prefix="/products", tags=["products"])

db: dict[int, Product] = {
    1: Product(id=1, name="Ноутбук",   price=89999.0, category="tech"),
    2: Product(id=2, name="Мышь",      price=1499.0,  category="tech"),
    3: Product(id=3, name="Блокнот",   price=199.0,   category="office"),
}

@router.get(
    "/",
    response_model=list[ProductPublic],
    summary="Список товаров",
    description="Возвращает список товаров.\\n\\nМожно фильтровать по категории.",
    response_model_exclude_none=True,
)
def list_products(
    category: str | None = Query(None, description="Фильтр по категории"),
    in_stock: bool = Query(True, description="Только товары в наличии"),
):
    items = db.values()
    if category:
        items = [i for i in items if i.category == category]
    if in_stock:
        items = [i for i in items if i.in_stock]
    return list(items)

@router.get(
    "/{product_id}",
    response_model=ProductPublic,
    responses={404: {"description": "Товар не найден"}},
)
def get_product(product_id: int):
    if product_id not in db:
        raise HTTPException(404, "Товар не найден")
    return db[product_id]

# main.py
from fastapi import FastAPI
from routers.products import router

app = FastAPI()
app.include_router(router)

# GET /products/?category=tech&in_stock=true
# GET /products/1`,
    },

    {
        category: 'APIRouter',
        name: 'router.post()',
        description: 'Декоратор для регистрации обработчика HTTP POST-запроса на роутере. Используется для создания новых ресурсов — тело запроса передаёт данные на сервер. По умолчанию возвращает статус 201 Created. Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.post(
    path,
    *,
    response_model=Default(None),
    status_code=201,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь относительно prefix роутера. Для POST обычно это корень коллекции: "/" (при prefix="/items" итог — "/items/").' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации созданного объекта в ответе. Поля, не входящие в модель, будут отфильтрованы.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 201 Created — стандарт REST для создания ресурса.' },
            { name: 'tags', description: 'Теги маршрута для документации. Объединяются с тегами роутера.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту. Добавляются к зависимостям роутера.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown. Берётся из docstring, если не задано явно.' },
            { name: 'response_description', description: 'Описание успешного ответа. По умолчанию "Successful Response".' },
            { name: 'responses', description: 'Дополнительные коды ответов: {409: {"description": "Уже существует"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля из ответа.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить поля со значением None.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему. По умолчанию True.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для объекта Operation в схеме OpenAPI.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

router = APIRouter(prefix="/users", tags=["users"])

users_db: dict[int, dict] = {}
counter = 0

@router.post(
    "/",
    response_model=UserResponse,   # password не войдёт в ответ
    status_code=201,
    summary="Создать пользователя",
    responses={409: {"description": "Email уже зарегистрирован"}},
)
def create_user(user: UserCreate):
    global counter
    if any(u["email"] == user.email for u in users_db.values()):
        raise HTTPException(409, "Email уже зарегистрирован")
    counter += 1
    users_db[counter] = {
        "id": counter, "name": user.name,
        "email": user.email, "created_at": datetime.utcnow(),
    }
    return users_db[counter]

# POST /users/  {"name": "Алиса", "email": "a@example.com", "password": "..."}
# → 201 {"id": 1, "name": "Алиса", "email": "a@example.com", "created_at": "..."}`,
    },

    {
        category: 'APIRouter',
        name: 'router.put()',
        description: 'Декоратор для регистрации обработчика HTTP PUT-запроса на роутере. Используется для полной замены ресурса — клиент передаёт все поля объекта. Идемпотентен: повторный запрос с теми же данными даёт тот же результат. Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.put(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь с идентификатором ресурса: "/{item_id}". PUT всегда адресует конкретный ресурс.' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации обновлённого объекта в ответе.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK.' },
            { name: 'tags', description: 'Теги маршрута для документации. Объединяются с тегами роутера.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов: {404: {"description": "Не найдено"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model для включения в ответ.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей для исключения из ответа.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации. По умолчанию True.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    in_stock: bool = True

router = APIRouter(prefix="/items", tags=["items"])

db: dict[int, Item] = {
    1: Item(name="Ноутбук", price=89999.0),
    2: Item(name="Мышь",    price=1499.0),
}

@router.put(
    "/{item_id}",
    response_model=Item,
    summary="Полностью заменить товар",
    description=(
        "Заменяет все поля товара переданными значениями.\\n\\n"
        "Для частичного обновления используйте **PATCH**."
    ),
    responses={404: {"description": "Товар не найден"}},
)
def replace_item(item_id: int, item: Item):
    if item_id not in db:
        raise HTTPException(404, "Товар не найден")
    db[item_id] = item
    return item

# PUT /items/1  {"name": "Ноутбук Pro", "price": 129999.0, "in_stock": true}
# → 200  — все поля заменены целиком`,
    },

    {
        category: 'APIRouter',
        name: 'router.delete()',
        description: 'Декоратор для регистрации обработчика HTTP DELETE-запроса на роутере. Используется для удаления ресурса. Обычно возвращает 204 No Content (без тела) или 200 с подтверждением. Идемпотентен: повторный DELETE уже удалённого ресурса должен возвращать 404. Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.delete(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь с идентификатором удаляемого ресурса: "/{item_id}".' },
            { name: 'response_model', description: 'Pydantic-модель для тела ответа. Для 204 No Content — не нужна, установите status_code=204 и верните Response().' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. Обычно 204 No Content (без тела) или 200 OK с подтверждением удаления.' },
            { name: 'tags', description: 'Теги маршрута для документации. Объединяются с тегами роутера.' },
            { name: 'dependencies', description: 'Зависимости Depends() — например, проверка прав на удаление.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов: {404: {"description": "Не найдено"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, HTTPException, Response

router = APIRouter(prefix="/items", tags=["items"])

db: dict[int, dict] = {
    1: {"name": "Ноутбук", "price": 89999.0},
    2: {"name": "Мышь",    "price": 1499.0},
}

# Вариант 1: 204 No Content — без тела ответа
@router.delete(
    "/{item_id}",
    status_code=204,
    summary="Удалить товар",
    responses={404: {"description": "Товар не найден"}},
)
def delete_item(item_id: int):
    if item_id not in db:
        raise HTTPException(404, "Товар не найден")
    del db[item_id]
    return Response(status_code=204)

# Вариант 2: 200 с подтверждением
@router.delete(
    "/soft/{item_id}",
    status_code=200,
    summary="Мягкое удаление товара",
)
def soft_delete_item(item_id: int):
    if item_id not in db:
        raise HTTPException(404, "Товар не найден")
    del db[item_id]
    return {"deleted": item_id, "message": "Товар удалён"}

# DELETE /items/1  → 204 No Content
# DELETE /items/soft/2  → 200 {"deleted": 2, "message": "Товар удалён"}`,
    },

    {
        category: 'APIRouter',
        name: 'router.patch()',
        description: 'Декоратор для регистрации обработчика HTTP PATCH-запроса на роутере. Используется для частичного обновления ресурса — клиент передаёт только изменяемые поля. В отличие от PUT не требует всех полей объекта. Применяется совместно с model_dump(exclude_unset=True) для обновления только переданных полей. Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.patch(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь с идентификатором ресурса: "/{item_id}".' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации обновлённого объекта в ответе.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK.' },
            { name: 'tags', description: 'Теги маршрута для документации. Объединяются с тегами роутера.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов: {404: {"description": "Не найдено"}}.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    in_stock: bool = True

class ItemPatch(BaseModel):
    """Все поля Optional — клиент передаёт только то, что хочет изменить."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    in_stock: Optional[bool] = None

router = APIRouter(prefix="/items", tags=["items"])

db: dict[int, Item] = {
    1: Item(name="Ноутбук", price=89999.0),
    2: Item(name="Мышь",    price=1499.0),
}

@router.patch(
    "/{item_id}",
    response_model=Item,
    summary="Частично обновить товар",
    description=(
        "Обновляет только переданные поля.\\n\\n"
        "Непереданные поля остаются без изменений."
    ),
    responses={404: {"description": "Товар не найден"}},
)
def patch_item(item_id: int, patch: ItemPatch):
    if item_id not in db:
        raise HTTPException(404, "Товар не найден")
    patch_data = patch.model_dump(exclude_unset=True)  # только явно переданные
    db[item_id] = db[item_id].model_copy(update=patch_data)
    return db[item_id]

# PATCH /items/1  {"price": 79999.0}
# → только price изменится, остальные поля прежние`,
    },

    {
        category: 'APIRouter',
        name: 'router.options()',
        description: 'Декоратор для регистрации обработчика HTTP OPTIONS-запроса на роутере. Используется для информирования клиента о допустимых методах и параметрах для указанного ресурса. Браузеры автоматически отправляют preflight OPTIONS-запросы при CORS. Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.options(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Может содержать path-параметры.' },
            { name: 'response_model', description: 'Pydantic-модель для ответа. Для OPTIONS обычно не используется — ответ пустой или содержит список методов.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200. Для OPTIONS часто используют 204 No Content.' },
            { name: 'tags', description: 'Теги маршрута для документации.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, Response

router = APIRouter(prefix="/items", tags=["items"])

ALLOWED = "GET, POST, PUT, DELETE, PATCH, OPTIONS"

@router.options(
    "/",
    status_code=204,
    summary="Допустимые методы для /items",
)
def options_items(response: Response):
    response.headers["Allow"] = ALLOWED
    response.headers["Access-Control-Allow-Methods"] = ALLOWED
    return Response(status_code=204)

@router.options(
    "/{item_id}",
    status_code=204,
    summary="Допустимые методы для /items/{item_id}",
)
def options_item(item_id: int, response: Response):
    response.headers["Allow"] = "GET, PUT, DELETE, PATCH, OPTIONS"
    return Response(status_code=204)

# OPTIONS /items/     → 204, Allow: GET, POST, PUT, DELETE, PATCH, OPTIONS
# OPTIONS /items/1    → 204, Allow: GET, PUT, DELETE, PATCH, OPTIONS`,
    },

    {
        category: 'APIRouter',
        name: 'router.head()',
        description: 'Декоратор для регистрации обработчика HTTP HEAD-запроса на роутере. HEAD идентичен GET, но сервер не отправляет тело ответа — только заголовки. Используется для проверки существования ресурса, получения метаданных (Content-Length, ETag, Last-Modified) без передачи данных. Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.head(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Должен совпадать с путём соответствующего GET-маршрута роутера.' },
            { name: 'response_model', description: 'Pydantic-модель. Тело ответа не отправляется, но модель используется для генерации заголовков и схемы OpenAPI.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK — те же коды, что у GET-маршрута.' },
            { name: 'tags', description: 'Теги маршрута для документации.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, Response, HTTPException
import hashlib, json

router = APIRouter(prefix="/items", tags=["items"])

db: dict[int, dict] = {
    1: {"name": "Ноутбук", "price": 89999.0},
    2: {"name": "Мышь",    "price": 1499.0},
}

def make_etag(data: dict) -> str:
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

@router.head(
    "/{item_id}",
    status_code=200,
    summary="Метаданные товара без тела ответа",
)
def head_item(item_id: int, response: Response):
    if item_id not in db:
        raise HTTPException(404, "Товар не найден")
    item = db[item_id]
    body = json.dumps(item).encode()
    response.headers["Content-Length"] = str(len(body))
    response.headers["ETag"] = make_etag(item)
    response.headers["Content-Type"] = "application/json"
    # тело FastAPI не отправит — только заголовки

# HEAD /items/1
# < HTTP/1.1 200 OK
# < Content-Length: 38
# < ETag: "a1b2c3d4..."
# < Content-Type: application/json
# (тело отсутствует)`,
    },

    {
        category: 'APIRouter',
        name: 'router.trace()',
        description: 'Декоратор для регистрации обработчика HTTP TRACE-запроса на роутере. TRACE — диагностический метод: сервер возвращает полученный запрос обратно клиенту, позволяя выявить изменения, внесённые промежуточными прокси. В production отключайте TRACE по соображениям безопасности (XST-атаки). Итоговый путь складывается из prefix роутера и path маршрута.',
        syntax: `router.trace(
    path,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Обычно диагностический путь типа "/trace" или "/".' },
            { name: 'response_model', description: 'Pydantic-модель для ответа. Для TRACE стандартный ответ — зеркало запроса с Content-Type: message/http.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200 OK.' },
            { name: 'tags', description: 'Теги маршрута для документации.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для схемы OpenAPI операции.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `import os
from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

# Включаем TRACE только в dev-режиме
router = APIRouter(
    prefix="/debug",
    tags=["debug"],
    include_in_schema=os.getenv("ENV", "production") != "production",
)

@router.trace(
    "/echo",
    status_code=200,
    response_class=PlainTextResponse,
    summary="TRACE-эхо запроса",
    description=(
        "Возвращает полученный запрос клиенту.\\n\\n"
        "**Внимание:** доступен только в development-окружении.\\n\\n"
        "Отключайте в production — уязвимость XST."
    ),
)
async def trace_echo(request: Request):
    headers = "\\n".join(f"{k}: {v}" for k, v in request.headers.items())
    body = await request.body()
    echo = (
        f"TRACE {request.url.path} HTTP/1.1\\n"
        f"{headers}\\n\\n"
        f"{body.decode() if body else ''}"
    )
    return PlainTextResponse(content=echo, media_type="message/http")

# TRACE /debug/echo
# < HTTP/1.1 200 OK
# < Content-Type: message/http
# TRACE /debug/echo HTTP/1.1
# host: localhost:8000
# ...`,
    },

    {
        category: 'APIRouter',
        name: 'router.websocket()',
        description: 'Декоратор для регистрации обработчика WebSocket-соединения на роутере. Полностью идентичен app.websocket() по поведению, но регистрирует маршрут на APIRouter. Итоговый путь складывается из prefix роутера и path маршрута. Позволяет организовать WebSocket-маршруты в отдельных модулях так же, как HTTP-маршруты.',
        syntax: `router.websocket(path, name=None)`,
        arguments: [
            { name: 'path', description: 'URL-путь WebSocket-маршрута относительно prefix роутера. Может содержать path-параметры: "/{room_id}". При prefix="/ws" итоговый путь — "/ws/{room_id}".' },
            { name: 'name', description: 'Имя маршрута для url_path_for(). По умолчанию — имя функции-обработчика.' },
        ],
        example: `# routers/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException

router = APIRouter(prefix="/ws", tags=["websocket"])

# Комнаты: room_id → список подключений
rooms: dict[str, list[WebSocket]] = {}

async def broadcast(room_id: str, message: str, sender: WebSocket):
    for ws in rooms.get(room_id, []):
        if ws is not sender:
            await ws.send_text(message)

@router.websocket("/chat/{room_id}")
async def chat_room(
    ws: WebSocket,
    room_id: str,
    username: str = Query(..., description="Имя пользователя"),
):
    await ws.accept()
    rooms.setdefault(room_id, []).append(ws)
    await broadcast(room_id, f"{username} вошёл в комнату", ws)
    try:
        while True:
            text = await ws.receive_text()
            await broadcast(room_id, f"{username}: {text}", ws)
    except WebSocketDisconnect:
        rooms[room_id].remove(ws)
        await broadcast(room_id, f"{username} покинул комнату", ws)

# main.py
from fastapi import FastAPI
from routers.chat import router

app = FastAPI()
app.include_router(router)

# ws://localhost:8000/ws/chat/general?username=Алиса`,
    },

    {
        category: 'APIRouter',
        name: 'router.include_router()',
        description: 'Подключает один APIRouter к другому, позволяя выстраивать иерархию роутеров. Используется для создания вложенных модулей: например, роутер /api/v1 включает роутеры /users и /items, каждый из которых может включать свои подроутеры. Prefix, теги и зависимости складываются по всей цепочке вложенности.',
        syntax: `router.include_router(
    router,
    *,
    prefix="",
    tags=None,
    dependencies=None,
    default_response_class=Default(JSONResponse),
    responses=None,
    callbacks=None,
    deprecated=None,
    include_in_schema=True,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'router', description: 'Экземпляр APIRouter, который нужно подключить.' },
            { name: 'prefix', description: 'URL-префикс, добавляемый к маршрутам подключаемого роутера. Складывается с prefix самого роутера: prefix="/api/v1" + router.prefix="/users" → "/api/v1/users".' },
            { name: 'tags', description: 'Теги, добавляемые ко всем маршрутам подключаемого роутера. Объединяются с его собственными тегами.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые ко всем маршрутам подключаемого роутера.' },
            { name: 'default_response_class', description: 'Класс ответа по умолчанию для всех маршрутов подключаемого роутера.' },
            { name: 'responses', description: 'Дополнительные коды ответов, общие для всех маршрутов подключаемого роутера.' },
            { name: 'callbacks', description: 'Колбэки OpenAPI, применяемые ко всем маршрутам подключаемого роутера.' },
            { name: 'deprecated', description: 'Помечает все маршруты подключаемого роутера устаревшими.' },
            { name: 'include_in_schema', description: 'Включать ли маршруты подключаемого роутера в OpenAPI-схему.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id для маршрутов подключаемого роутера.' },
        ],
        example: `from fastapi import APIRouter, FastAPI, Depends, HTTPException

# --- Листовые роутеры ---
users_router = APIRouter(prefix="/users", tags=["users"])

@users_router.get("/")
def list_users():
    return [{"id": 1, "name": "Алиса"}]

@users_router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": "Алиса"}

items_router = APIRouter(prefix="/items", tags=["items"])

@items_router.get("/")
def list_items():
    return [{"id": 1, "name": "Ноутбук"}]

# --- Промежуточный роутер v1 ---
def verify_api_key(x_api_key: str = ""):
    if x_api_key != "secret":
        raise HTTPException(403, "Неверный API-ключ")

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(users_router, dependencies=[Depends(verify_api_key)])
v1_router.include_router(items_router, dependencies=[Depends(verify_api_key)])

# --- Корневой роутер API ---
api_router = APIRouter(prefix="/api")
api_router.include_router(v1_router)

# --- Приложение ---
app = FastAPI()
app.include_router(api_router)

# GET /api/v1/users/      → список пользователей (требует x_api_key)
# GET /api/v1/users/1     → пользователь #1
# GET /api/v1/items/      → список товаров`,
    },

    {
        category: 'APIRouter',
        name: 'router.add_api_route()',
        description: 'Программно добавляет HTTP-маршрут к роутеру без использования декоратора. Позволяет динамически регистрировать маршруты — например, генерировать CRUD-эндпоинты в цикле, подключать обработчики из конфига или создавать универсальные фабрики роутеров. Принимает те же параметры, что и декораторы router.get(), router.post() и т.д., плюс явно указываемые methods.',
        syntax: `router.add_api_route(
    path,
    endpoint,
    *,
    response_model=Default(None),
    status_code=200,
    tags=None,
    dependencies=None,
    summary=None,
    description=None,
    response_description="Successful Response",
    responses=None,
    deprecated=None,
    methods=None,
    operation_id=None,
    response_model_include=None,
    response_model_exclude=None,
    response_model_by_alias=True,
    response_model_exclude_unset=False,
    response_model_exclude_defaults=False,
    response_model_exclude_none=False,
    include_in_schema=True,
    response_class=Default(JSONResponse),
    name=None,
    route_class_override=None,
    callbacks=None,
    openapi_extra=None,
    generate_unique_id_function=Default(generate_unique_id),
)`,
        arguments: [
            { name: 'path', description: 'URL-путь маршрута. Может содержать path-параметры: "/{resource_id}".' },
            { name: 'endpoint', description: 'Функция-обработчик маршрута. Принимает те же параметры, что и при использовании декораторов.' },
            { name: 'response_model', description: 'Pydantic-модель для сериализации ответа.' },
            { name: 'status_code', description: 'HTTP-код успешного ответа. По умолчанию 200.' },
            { name: 'tags', description: 'Теги маршрута для документации.' },
            { name: 'dependencies', description: 'Зависимости Depends(), применяемые к маршруту.' },
            { name: 'summary', description: 'Краткое описание операции в документации.' },
            { name: 'description', description: 'Подробное описание. Поддерживает Markdown.' },
            { name: 'response_description', description: 'Описание успешного ответа.' },
            { name: 'responses', description: 'Дополнительные коды ответов для документации.' },
            { name: 'deprecated', description: 'Помечает маршрут устаревшим.' },
            { name: 'methods', description: 'Список или множество HTTP-методов: ["GET", "POST"]. В отличие от декораторов, один маршрут может обрабатывать несколько методов одновременно.' },
            { name: 'operation_id', description: 'Уникальный идентификатор операции в OpenAPI.' },
            { name: 'response_model_include', description: 'Белый список полей response_model.' },
            { name: 'response_model_exclude', description: 'Чёрный список полей response_model.' },
            { name: 'response_model_by_alias', description: 'Использовать alias полей при сериализации.' },
            { name: 'response_model_exclude_unset', description: 'Исключить явно не установленные поля.' },
            { name: 'response_model_exclude_defaults', description: 'Исключить поля со значениями по умолчанию.' },
            { name: 'response_model_exclude_none', description: 'Исключить None-поля из ответа.' },
            { name: 'include_in_schema', description: 'Включать маршрут в OpenAPI-схему.' },
            { name: 'response_class', description: 'Класс HTTP-ответа для маршрута.' },
            { name: 'name', description: 'Имя маршрута для url_path_for().' },
            { name: 'route_class_override', description: 'Переопределяет route_class роутера только для этого маршрута. Позволяет применить кастомный класс маршрута точечно.' },
            { name: 'callbacks', description: 'Колбэки OpenAPI для маршрута.' },
            { name: 'openapi_extra', description: 'Дополнительные данные для объекта Operation в схеме OpenAPI.' },
            { name: 'generate_unique_id_function', description: 'Функция генерации operation_id.' },
        ],
        example: `from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any

# --- Фабрика CRUD-роутера ---
def make_crud_router(
    prefix: str,
    tag: str,
    storage: dict[int, Any],
    model: type[BaseModel],
) -> APIRouter:
    """Генерирует полный CRUD-роутер для любой модели."""
    router = APIRouter(prefix=prefix, tags=[tag])

    def list_all():
        return list(storage.values())

    def get_one(item_id: int):
        if item_id not in storage:
            raise HTTPException(404, "Не найдено")
        return storage[item_id]

    def create(item: model):          # type: ignore[valid-type]
        item_id = max(storage, default=0) + 1
        storage[item_id] = item
        return item

    def delete(item_id: int):
        if item_id not in storage:
            raise HTTPException(404, "Не найдено")
        del storage[item_id]
        return {"deleted": item_id}

    router.add_api_route("/",            list_all, methods=["GET"],    summary=f"Список {tag}")
    router.add_api_route("/{item_id}",   get_one,  methods=["GET"],    summary=f"Получить {tag}")
    router.add_api_route("/",            create,   methods=["POST"],   status_code=201, summary=f"Создать {tag}")
    router.add_api_route("/{item_id}",   delete,   methods=["DELETE"], status_code=200, summary=f"Удалить {tag}")

    return router

# --- Модели и хранилища ---
class Product(BaseModel):
    name: str
    price: float

class Category(BaseModel):
    title: str

products_db: dict[int, Product] = {}
categories_db: dict[int, Category] = {}

# --- Сборка приложения ---
app = FastAPI()
app.include_router(make_crud_router("/products",   "products",   products_db,   Product))
app.include_router(make_crud_router("/categories", "categories", categories_db, Category))

# GET  /products/       → список товаров
# POST /products/       → создать товар
# GET  /categories/     → список категорий
# DELETE /categories/1  → удалить категорию`,
    },

    {
        category: 'APIRouter',
        name: 'router.add_api_websocket_route()',
        description: 'Программно добавляет WebSocket-маршрут к роутеру без использования декоратора @router.websocket(). Аналог router.add_api_route() для WebSocket-соединений. Используется для динамической регистрации WebSocket-обработчиков — например, при генерации маршрутов в цикле или загрузке конфигурации из внешнего источника.',
        syntax: `router.add_api_websocket_route(path, endpoint, name=None)`,
        arguments: [
            { name: 'path', description: 'URL-путь WebSocket-маршрута относительно prefix роутера. Может содержать path-параметры: "/{room_id}".' },
            { name: 'endpoint', description: 'Async функция-обработчик WebSocket-соединения. Принимает WebSocket как первый параметр и любые path/query-параметры далее.' },
            { name: 'name', description: 'Имя маршрута для url_path_for(). По умолчанию — имя функции endpoint.' },
        ],
        example: `from fastapi import APIRouter, FastAPI, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws")

# Фабрика WebSocket-обработчиков для разных типов потоков
def make_stream_handler(stream_name: str):
    """Возвращает обработчик, отправляющий сообщения конкретного потока."""
    async def handler(ws: WebSocket):
        await ws.accept()
        try:
            while True:
                data = await ws.receive_text()
                await ws.send_text(f"[{stream_name}] эхо: {data}")
        except WebSocketDisconnect:
            pass
    handler.__name__ = f"ws_{stream_name}"
    return handler

# Динамически регистрируем WebSocket-маршруты для нескольких потоков
STREAMS = ["logs", "metrics", "events"]

for stream in STREAMS:
    router.add_api_websocket_route(
        path=f"/{stream}",
        endpoint=make_stream_handler(stream),
        name=f"ws_{stream}",
    )

app = FastAPI()
app.include_router(router)

# ws://localhost:8000/ws/logs    → поток логов
# ws://localhost:8000/ws/metrics → поток метрик
# ws://localhost:8000/ws/events  → поток событий`,
    },

    {
        category: 'APIRouter',
        name: 'router.on_startup',
        description: 'Список async или sync функций, вызываемых при запуске приложения. Аналог app.on_startup, но принадлежащий конкретному роутеру. Функции выполняются в порядке добавления после startup-обработчиков приложения. Устарел — рекомендуется использовать параметр lifespan в APIRouter() или FastAPI().',
        syntax: `router.on_startup`,
        arguments: [
            { name: 'router.on_startup', description: 'list[Callable]. Список функций без аргументов, вызываемых при старте. Добавляются через router.add_event_handler("startup", func) или напрямую: router.on_startup.append(func).' },
        ],
        example: `from fastapi import APIRouter, FastAPI

router = APIRouter(prefix="/shop", tags=["shop"])

# Кэш товаров, наполняемый при старте
product_cache: dict[int, str] = {}

async def load_products():
    """Загружает товары в кэш при запуске."""
    product_cache.update({1: "Ноутбук", 2: "Мышь", 3: "Клавиатура"})
    print(f"Кэш товаров загружен: {len(product_cache)} позиций")

# Способ 1: добавление через add_event_handler
router.add_event_handler("startup", load_products)

# Способ 2: прямое добавление в список
async def warm_up():
    print("Прогрев соединений пула...")

router.on_startup.append(warm_up)

@router.get("/products")
def list_products():
    return product_cache

app = FastAPI()
app.include_router(router)

# При запуске uvicorn:
# "Кэш товаров загружен: 3 позиций"
# "Прогрев соединений пула..."`,
    },

    {
        category: 'APIRouter',
        name: 'router.on_shutdown',
        description: 'Список async или sync функций, вызываемых при остановке приложения. Аналог app.on_shutdown, но принадлежащий конкретному роутеру. Используется для освобождения ресурсов, принадлежащих модулю роутера — закрытия соединений, сброса кэша, финализации транзакций. Устарел — рекомендуется использовать lifespan.',
        syntax: `router.on_shutdown`,
        arguments: [
            { name: 'router.on_shutdown', description: 'list[Callable]. Список функций без аргументов, вызываемых при остановке. Добавляются через router.add_event_handler("shutdown", func) или напрямую: router.on_shutdown.append(func).' },
        ],
        example: `from fastapi import APIRouter, FastAPI
import httpx

router = APIRouter(prefix="/proxy", tags=["proxy"])

# HTTP-клиент уровня модуля
http_client: httpx.AsyncClient | None = None

async def init_client():
    global http_client
    http_client = httpx.AsyncClient(timeout=10.0)
    print("HTTP-клиент создан")

async def close_client():
    global http_client
    if http_client:
        await http_client.aclose()
        http_client = None
        print("HTTP-клиент закрыт")

router.add_event_handler("startup",  init_client)
router.add_event_handler("shutdown", close_client)

# Прямое добавление в список
async def flush_buffers():
    print("Буферы сброшены")

router.on_shutdown.append(flush_buffers)

@router.get("/fetch")
async def fetch_data(url: str):
    response = await http_client.get(url)
    return response.json()

app = FastAPI()
app.include_router(router)`,
    },

    {
        category: 'APIRouter',
        name: 'router.routes',
        description: 'Список всех маршрутов, зарегистрированных непосредственно на роутере. Содержит объекты APIRoute и WebSocketRoute. Не включает маршруты вложенных роутеров, подключённых через include_router() — они становятся частью списка только после разрешения. Полезен для интроспекции, логирования и динамической модификации маршрутов.',
        syntax: `router.routes`,
        arguments: [
            { name: 'route.path', description: 'URL-путь маршрута: "/items/{item_id}".' },
            { name: 'route.methods', description: 'Множество HTTP-методов маршрута: {"GET"}, {"POST"}.' },
            { name: 'route.name', description: 'Имя маршрута — по умолчанию имя функции-обработчика.' },
            { name: 'route.endpoint', description: 'Функция-обработчик маршрута.' },
            { name: 'route.tags', description: 'Список тегов маршрута.' },
        ],
        example: `from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/",           name="list_items")
def list_items(): return []

@router.post("/",          name="create_item")
def create_item(): return {}

@router.get("/{item_id}", name="get_item")
def get_item(item_id: int): return {"id": item_id}

@router.delete("/{item_id}", name="delete_item")
def delete_item(item_id: int): return {"deleted": item_id}

# Интроспекция маршрутов роутера
print(f"Маршрутов в роутере: {len(router.routes)}")
for route in router.routes:
    if isinstance(route, APIRoute):
        print(f"  {sorted(route.methods)} {route.path!r} → {route.name}")
# ['GET']    '/items/'          → list_items
# ['POST']   '/items/'          → create_item
# ['GET']    '/items/{item_id}' → get_item
# ['DELETE'] '/items/{item_id}' → delete_item

# Поиск маршрута по имени
def find_route(r: APIRouter, name: str):
    return next((rt for rt in r.routes if isinstance(rt, APIRoute) and rt.name == name), None)

route = find_route(router, "get_item")
print(route.path, route.endpoint.__name__)  # /items/{item_id}  get_item

app = FastAPI()
app.include_router(router)`,
    },

    {
        category: 'APIRouter',
        name: 'router.prefix',
        description: 'Строка URL-префикса, задаваемая при создании роутера и добавляемая перед путём каждого его маршрута. Складывается с prefix из include_router(), образуя итоговый путь: router.prefix + include_router prefix + route path. Читается и изменяется напрямую — полезно при динамическом формировании роутеров или версионировании API.',
        syntax: `router.prefix`,
        arguments: [
            { name: 'router.prefix', description: 'str. URL-префикс роутера. По умолчанию пустая строка "". Должен начинаться с "/" если не пустой: "/users", "/api/v1/items".' },
        ],
        example: `from fastapi import APIRouter, FastAPI

# Версионирование API через prefix
def make_versioned_router(version: int) -> APIRouter:
    router = APIRouter(prefix=f"/v{version}")

    @router.get("/status")
    def status():
        return {"version": version, "status": "ok"}

    @router.get("/items")
    def items():
        return [{"id": 1, "v": version}]

    return router

v1 = make_versioned_router(1)
v2 = make_versioned_router(2)

print(v1.prefix)  # /v1
print(v2.prefix)  # /v2

# Динамическое изменение prefix до подключения
v2.prefix = "/v2-beta"
print(v2.prefix)  # /v2-beta

app = FastAPI()
app.include_router(v1)   # GET /v1/status, GET /v1/items
app.include_router(v2)   # GET /v2-beta/status, GET /v2-beta/items

# Вложение: prefix складывается
api_router = APIRouter(prefix="/api")
api_router.include_router(v1)  # итог: /api/v1/status`,
    },

    {
        category: 'APIRouter',
        name: 'router.tags',
        description: 'Список тегов по умолчанию для всех маршрутов роутера. Теги группируют маршруты в документации Swagger UI. При подключении роутера через include_router() теги объединяются: router.tags + include_router tags + теги отдельного маршрута. Читается и изменяется напрямую до подключения роутера к приложению.',
        syntax: `router.tags`,
        arguments: [
            { name: 'router.tags', description: 'list[str | Enum]. Список тегов роутера. По умолчанию пустой список []. Теги из router.tags добавляются ко всем маршрутам роутера и отображаются в документации.' },
        ],
        example: `from fastapi import APIRouter, FastAPI
from enum import Enum

class Tags(str, Enum):
    users  = "users"
    admin  = "admin"
    public = "public"

# Роутер с тегами через Enum — типобезопасно
users_router = APIRouter(prefix="/users", tags=[Tags.users])

@users_router.get("/me")
def get_me():
    return {"user": "me"}

# Теги объединяются при include_router
admin_router = APIRouter(prefix="/admin", tags=[Tags.admin])

@admin_router.get("/stats")
def get_stats():
    return {"total": 42}

# Изменение тегов до подключения
print(users_router.tags)   # ['users']
users_router.tags.append(Tags.public)
print(users_router.tags)   # ['users', 'public']

app = FastAPI()

# include_router добавляет ещё один тег поверх router.tags
app.include_router(users_router)
app.include_router(admin_router, tags=["internal"])
# admin.get_stats получит теги: ["admin", "internal"]`,
    },

    {
        category: 'APIRouter',
        name: 'router.dependencies',
        description: 'Список зависимостей Depends(), применяемых ко всем маршрутам роутера. Зависимости выполняются перед вызовом каждого обработчика и не добавляются в параметры функции. Удобны для сквозной логики: аутентификации, проверки прав, rate limiting. При вложении роутеров зависимости накапливаются по всей цепочке.',
        syntax: `router.dependencies`,
        arguments: [
            { name: 'router.dependencies', description: 'list[Depends]. Список зависимостей, применяемых ко всем маршрутам роутера. По умолчанию пустой список []. Модифицируется напрямую или задаётся при создании APIRouter(dependencies=[...]).' },
        ],
        example: `from fastapi import APIRouter, FastAPI, Depends, HTTPException, Header
from typing import Annotated

# --- Зависимости ---
async def verify_token(x_token: Annotated[str, Header()]):
    if x_token != "secret-token":
        raise HTTPException(401, "Неверный токен")

async def verify_admin(x_admin: Annotated[str, Header()] = ""):
    if x_admin != "admin-key":
        raise HTTPException(403, "Нет прав администратора")

async def log_request():
    print("Запрос к защищённому маршруту")

# Роутер с зависимостью аутентификации
protected_router = APIRouter(
    prefix="/protected",
    tags=["protected"],
    dependencies=[Depends(verify_token)],
)

@protected_router.get("/data")
def get_data():
    return {"secret": "данные"}

# Динамическое добавление зависимости до подключения
protected_router.dependencies.append(Depends(log_request))

print(len(protected_router.dependencies))  # 2

# Роутер с несколькими зависимостями
admin_router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(verify_token), Depends(verify_admin)],
)

@admin_router.delete("/users/{user_id}")
def delete_user(user_id: int):
    return {"deleted": user_id}

app = FastAPI()
app.include_router(protected_router)
app.include_router(admin_router)

# GET /protected/data   — требует X-Token: secret-token
# DELETE /admin/users/1 — требует X-Token + X-Admin`,
    },

    {
        category: 'Depends / Security',
        name: 'Depends()',
        description: 'Основной механизм внедрения зависимостей в FastAPI. Оборачивает функцию-зависимость и передаётся как значение по умолчанию параметра обработчика. FastAPI вычисляет зависимость перед вызовом обработчика, кэширует результат в рамках запроса (use_cache=True) и автоматически обрабатывает вложенные зависимости любой глубины. Поддерживает функции, async-функции, классы и генераторы (для управления контекстом).',
        syntax: `Depends(dependency=None, *, use_cache=True)`,
        arguments: [
            { name: 'dependency', description: 'Callable: функция, async-функция, класс или генератор. Принимает те же источники параметров, что и обработчик маршрута (Path, Query, Header, Body, другие Depends). Если None — используется тип аннотации параметра.' },
            { name: 'use_cache', description: 'bool, по умолчанию True. Если True — результат зависимости кэшируется в рамках одного запроса: при повторном использовании той же зависимости она вычисляется один раз. Если False — вычисляется каждый раз заново.' },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException, Query
from typing import Annotated
from collections.abc import Generator

app = FastAPI()

# --- 1. Простая зависимость-функция ---
def get_db() -> Generator:
    """Генератор: открывает соединение, закрывает после запроса."""
    db = {"connected": True}   # вместо реального соединения
    try:
        yield db
    finally:
        db["connected"] = False  # закрытие соединения

DB = Annotated[dict, Depends(get_db)]

# --- 2. Зависимость с параметрами ---
def common_params(
    skip:  int = Query(0,   ge=0),
    limit: int = Query(10,  le=100),
    q:     str = Query("", max_length=50),
):
    return {"skip": skip, "limit": limit, "q": q}

Pagination = Annotated[dict, Depends(common_params)]

# --- 3. Классовая зависимость ---
class PermissionChecker:
    def __init__(self, required: str):
        self.required = required

    def __call__(self, token: str = Query(...)):
        if token != f"token-{self.required}":
            raise HTTPException(403, f"Нет права: {self.required}")

# --- 4. Вложенные зависимости ---
def get_current_user(db: DB):
    return {"user": "Алиса", "db_ok": db["connected"]}

CurrentUser = Annotated[dict, Depends(get_current_user)]

# --- 5. Маршруты ---
@app.get("/items")
def list_items(pagination: Pagination, user: CurrentUser):
    return {"pagination": pagination, "user": user}

@app.delete("/admin")
def admin_action(
    _: Annotated[None, Depends(PermissionChecker("admin"))],
):
    return {"action": "выполнено"}

# --- 6. use_cache=False: зависимость без кэша ---
import time

def get_timestamp():
    return time.time()

@app.get("/timestamps")
def two_timestamps(
    t1: Annotated[float, Depends(get_timestamp)],
    t2: Annotated[float, Depends(get_timestamp, use_cache=False)],
):
    # t1 == t2 при use_cache=True (по умолчанию)
    # t1 != t2 при use_cache=False для t2
    return {"t1": t1, "t2": t2}`,
    },

    {
        category: 'Depends / Security',
        name: 'Security()',
        description: 'Расширение Depends() для зависимостей, связанных с безопасностью. Принимает дополнительный параметр scopes — список OAuth2-областей доступа, необходимых для данного маршрута. Scopes автоматически добавляются в OpenAPI-схему (securityRequirements) и отображаются в документации. Используется с классами SecurityBase: OAuth2PasswordBearer, HTTPBearer, APIKeyHeader и другими.',
        syntax: `Security(dependency=None, *, scopes=None, use_cache=True)`,
        arguments: [
            { name: 'dependency', description: 'Callable: функция-зависимость безопасности. Обычно экземпляр схемы безопасности (OAuth2PasswordBearer и т.д.) или функция, принимающая SecurityScopes.' },
            { name: 'scopes', description: 'list[str] | None. Список OAuth2-областей доступа, требуемых для маршрута: ["items:read", "items:write"]. Доступны внутри зависимости через параметр типа SecurityScopes.' },
            { name: 'use_cache', description: 'bool, по умолчанию True. Аналогично Depends(): кэширует результат зависимости в рамках запроса.' },
        ],
        example: `from fastapi import FastAPI, Security, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from typing import Annotated
from pydantic import BaseModel

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/token",
    scopes={
        "items:read":  "Чтение товаров",
        "items:write": "Изменение товаров",
        "users:read":  "Чтение пользователей",
        "admin":       "Полный доступ",
    },
)

class User(BaseModel):
    username: str
    scopes:   list[str] = []

# Фейковая БД токенов
TOKENS = {
    "reader-token": User(username="Читатель", scopes=["items:read"]),
    "writer-token": User(username="Редактор", scopes=["items:read", "items:write"]),
    "admin-token":  User(username="Админ",    scopes=["items:read", "items:write", "users:read", "admin"]),
}

async def get_current_user(
    security_scopes: SecurityScopes,           # ← FastAPI инжектирует требуемые scopes
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    user = TOKENS.get(token)
    if not user:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен",
            headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'},
        )
    for scope in security_scopes.scopes:
        if scope not in user.scopes:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется: {scope}",
            )
    return user

CurrentUser = Annotated[User, Security(get_current_user)]

# --- Маршруты с разными наборами scopes ---
@app.get("/items")
def list_items(
    user: Annotated[User, Security(get_current_user, scopes=["items:read"])],
):
    return {"items": ["Ноутбук", "Мышь"], "user": user.username}

@app.post("/items")
def create_item(
    user: Annotated[User, Security(get_current_user, scopes=["items:write"])],
):
    return {"created": True, "user": user.username}

@app.get("/users")
def list_users(
    user: Annotated[User, Security(get_current_user, scopes=["users:read", "admin"])],
):
    return {"users": ["Алиса", "Боб"], "user": user.username}

# reader-token  → GET /items ✓  POST /items ✗  GET /users ✗
# writer-token  → GET /items ✓  POST /items ✓  GET /users ✗
# admin-token   → GET /items ✓  POST /items ✓  GET /users ✓`,
    },

    {
        category: 'Параметры запроса',
        name: 'Query()',
        description: 'Объявляет параметр строки запроса (query string) с расширенной валидацией, метаданными и настройками OpenAPI. Используется как значение по умолчанию параметра функции-обработчика. Без Query() FastAPI также распознаёт query-параметры по простым значениям по умолчанию, но Query() даёт полный контроль: ограничения на длину, диапазон, регулярное выражение, псевдонимы, примеры для документации.',
        syntax: `Query(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: 'Значение по умолчанию. PydanticUndefined (или ...) — обязательный параметр. Иначе необязательный с указанным значением.' },
            { name: 'default_factory', description: 'Callable без аргументов, возвращающий значение по умолчанию. Используется вместо default для изменяемых объектов (список, словарь).' },
            { name: 'alias', description: 'Альтернативное имя параметра в URL. Если alias="sort-by", клиент передаёт ?sort-by=name, а Python-переменная называется иначе.' },
            { name: 'alias_priority', description: 'Приоритет псевдонима: 1 — низкий (может быть перекрыт), 2 — высокий (не перекрывается).' },
            { name: 'validation_alias', description: 'Псевдоним только для валидации/парсинга входных данных.' },
            { name: 'serialization_alias', description: 'Псевдоним только для сериализации исходящих данных.' },
            { name: 'title', description: 'Заголовок поля в OpenAPI-схеме.' },
            { name: 'description', description: 'Описание параметра, отображается в документации.' },
            { name: 'gt', description: 'Greater than. Число должно быть строго больше указанного.' },
            { name: 'ge', description: 'Greater or equal. Число должно быть ≥ указанного.' },
            { name: 'lt', description: 'Less than. Число должно быть строго меньше указанного.' },
            { name: 'le', description: 'Less or equal. Число должно быть ≤ указанного.' },
            { name: 'multiple_of', description: 'Число должно быть кратно указанному.' },
            { name: 'strict', description: 'Строгий режим Pydantic: запрещает автоматическое приведение типов.' },
            { name: 'max_digits', description: 'Максимальное количество цифр для Decimal.' },
            { name: 'decimal_places', description: 'Максимальное количество знаков после запятой для Decimal.' },
            { name: 'min_length', description: 'Минимальная длина строки.' },
            { name: 'max_length', description: 'Максимальная длина строки.' },
            { name: 'pattern', description: 'Регулярное выражение, которому должна соответствовать строка.' },
            { name: 'discriminator', description: 'Поле-дискриминатор для Union-типов.' },
            { name: 'json_schema_extra', description: 'Дополнительные поля для JSON-схемы: dict или callable.' },
            { name: 'validate_default', description: 'Применять ли валидацию к значению по умолчанию.' },
            { name: 'include_in_schema', description: 'Включать параметр в OpenAPI-схему. False — параметр скрыт из документации.' },
            { name: 'examples', description: 'list примеров значений для OpenAPI.' },
            { name: 'example', description: 'Одиночный пример значения (устарело в пользу examples).' },
            { name: 'openapi_examples', description: 'dict с именованными примерами для OpenAPI: {"пример": {"value": ...}}.' },
            { name: 'deprecated', description: 'Помечает параметр устаревшим в документации.' },
        ],
        example: `from fastapi import FastAPI, Query
from typing import Annotated
from enum import Enum

app = FastAPI()

class SortOrder(str, Enum):
    asc  = "asc"
    desc = "desc"

@app.get("/items")
def search_items(
    # Обязательный параметр с ограничением длины
    q: Annotated[str, Query(
        min_length=2,
        max_length=100,
        description="Поисковый запрос (минимум 2 символа)",
        examples=["ноутбук", "мышь беспроводная"],
    )],

    # Числовые ограничения
    skip:  Annotated[int, Query(ge=0,   description="Пропустить N записей")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Максимум записей")] = 10,
    price_min: Annotated[float | None, Query(ge=0, lt=1_000_000)] = None,
    price_max: Annotated[float | None, Query(ge=0, lt=1_000_000)] = None,

    # Enum-параметр
    order: Annotated[SortOrder, Query(description="Порядок сортировки")] = SortOrder.asc,

    # Псевдоним: клиент передаёт ?sort-by=price, Python видит sort_by
    sort_by: Annotated[str, Query(alias="sort-by", pattern=r"^(name|price|rating)$")] = "name",

    # Скрытый параметр — есть в коде, нет в Swagger
    internal_flag: Annotated[bool, Query(include_in_schema=False)] = False,

    # Устаревший параметр
    old_q: Annotated[str | None, Query(deprecated=True)] = None,
):
    return {
        "q": q,
        "skip": skip,
        "limit": limit,
        "price_range": [price_min, price_max],
        "order": order,
        "sort_by": sort_by,
    }

# GET /items?q=ноутбук&skip=0&limit=20&sort-by=price&order=desc`,
    },

    {
        category: 'Параметры запроса',
        name: 'Path()',
        description: 'Объявляет параметр пути (path parameter) с расширенной валидацией и метаданными. Параметры пути всегда обязательны — они являются частью URL-шаблона. Path() позволяет добавить валидацию (числовые диапазоны, длина строки, регулярное выражение) и метаданные OpenAPI к параметрам, уже объявленным в шаблоне маршрута. Поддерживает те же поля валидации, что и Query().',
        syntax: `Path(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: 'Для Path() всегда передаётся ... (PydanticUndefined) — параметры пути обязательны по определению. Значение по умолчанию не имеет смысла, так как параметр всегда присутствует в URL.' },
            { name: 'gt / ge / lt / le', description: 'Числовые ограничения: gt — строго больше, ge — больше или равно, lt — строго меньше, le — меньше или равно. Типичное применение: item_id: int = Path(..., ge=1).' },
            { name: 'min_length / max_length', description: 'Ограничения длины строкового параметра пути.' },
            { name: 'pattern', description: 'Регулярное выражение для строкового параметра. Позволяет ограничить формат: UUID, slug, дата и т.д.' },
            { name: 'title', description: 'Заголовок параметра в OpenAPI-схеме.' },
            { name: 'description', description: 'Описание параметра для документации.' },
            { name: 'examples / openapi_examples', description: 'Примеры значений для Swagger UI.' },
            { name: 'deprecated', description: 'Помечает параметр пути устаревшим в документации.' },
            { name: 'include_in_schema', description: 'Включать параметр в OpenAPI-схему.' },
        ],
        example: `from fastapi import FastAPI, Path, Query, HTTPException
from typing import Annotated
import re

app = FastAPI()

# Фейковая БД
ITEMS   = {i: {"id": i, "name": f"Товар {i}", "price": i * 10.0} for i in range(1, 101)}
USERS   = {i: {"id": i, "username": f"user_{i}"} for i in range(1, 11)}
REPORTS = {"2024-01": "янв", "2024-12": "дек"}

# --- 1. Числовой ID с ограничениями ---
@app.get("/items/{item_id}")
def get_item(
    item_id: Annotated[int, Path(
        ge=1, le=1000,
        title="ID товара",
        description="Целое число от 1 до 1000",
        examples=[1, 42, 100],
    )],
):
    if item_id not in ITEMS:
        raise HTTPException(404, "Товар не найден")
    return ITEMS[item_id]

# --- 2. Строка с pattern (slug) ---
@app.get("/categories/{slug}")
def get_category(
    slug: Annotated[str, Path(
        min_length=2,
        max_length=50,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="URL-slug категории: только строчные буквы, цифры и дефисы",
        examples=["electronics", "home-appliances"],
    )],
):
    return {"slug": slug, "name": slug.replace("-", " ").title()}

# --- 3. Несколько path-параметров ---
@app.get("/users/{user_id}/items/{item_id}")
def get_user_item(
    user_id: Annotated[int, Path(ge=1, le=10,   description="ID пользователя")],
    item_id: Annotated[int, Path(ge=1, le=1000, description="ID товара")],
):
    if user_id not in USERS:
        raise HTTPException(404, "Пользователь не найден")
    if item_id not in ITEMS:
        raise HTTPException(404, "Товар не найден")
    return {"user": USERS[user_id], "item": ITEMS[item_id]}

# --- 4. Pattern для формата даты ---
@app.get("/reports/{period}")
def get_report(
    period: Annotated[str, Path(
        pattern=r"^\\d{4}-(0[1-9]|1[0-2])$",
        description="Период в формате YYYY-MM: '2024-01'",
        examples=["2024-01", "2024-12"],
    )],
):
    if period not in REPORTS:
        raise HTTPException(404, f"Отчёт за {period} не найден")
    return {"period": period, "data": REPORTS[period]}

# GET /items/42           → {"id": 42, "name": "Товар 42", "price": 420.0}
# GET /items/0            → 422 Unprocessable Entity (ge=1)
# GET /categories/home-appliances → {"slug": "home-appliances", ...}
# GET /categories/HOME    → 422 (pattern: только строчные буквы)
# GET /reports/2024-01    → {"period": "2024-01", "data": "янв"}
# GET /reports/2024-13    → 422 (pattern: месяц 01-12)`,
    },

    {
        category: 'Параметры запроса',
        name: 'Header()',
        description: 'Объявляет параметр HTTP-заголовка запроса. FastAPI автоматически преобразует имя Python-переменной (snake_case) в имя заголовка (kebab-case): user_agent → User-Agent, x_api_key → X-Api-Key. Это поведение управляется параметром convert_underscores. Поддерживает те же поля валидации, что и Query() и Path(). Список значений (list[str]) позволяет принять заголовок, переданный несколько раз.',
        syntax: `Header(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    convert_underscores=True,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: 'Значение по умолчанию. ... (PydanticUndefined) — обязательный заголовок. None или строка — необязательный.' },
            { name: 'default_factory', description: 'Callable без аргументов для динамического значения по умолчанию.' },
            { name: 'alias', description: 'Точное имя заголовка, если автоматическое преобразование не подходит. Например, alias="X-Request-ID" при переменной request_id.' },
            { name: 'convert_underscores', description: 'bool, по умолчанию True. Автоматически заменяет подчёркивания на дефисы: user_agent → User-Agent. Установите False, если заголовок содержит подчёркивания (нестандартная ситуация).' },
            { name: 'min_length / max_length', description: 'Ограничения длины строкового заголовка.' },
            { name: 'pattern', description: 'Регулярное выражение для проверки формата заголовка.' },
            { name: 'include_in_schema', description: 'Включать заголовок в OpenAPI-схему. False — заголовок не показывается в документации.' },
            { name: 'deprecated', description: 'Помечает заголовок устаревшим в документации.' },
            { name: 'description', description: 'Описание заголовка для Swagger UI.' },
            { name: 'examples / openapi_examples', description: 'Примеры значений для документации.' },
        ],
        example: `from fastapi import FastAPI, Header, HTTPException
from typing import Annotated

app = FastAPI()

# --- 1. Стандартный заголовок (snake_case → kebab-case автоматически) ---
@app.get("/agent")
def get_agent(
    user_agent: Annotated[str | None, Header(
        description="Браузер или клиент, отправивший запрос",
    )] = None,
):
    # FastAPI читает заголовок "User-Agent"
    return {"user_agent": user_agent}

# --- 2. Кастомный API-ключ (обязательный) ---
@app.get("/secure")
def secure_endpoint(
    x_api_key: Annotated[str, Header(
        min_length=32,
        description="API-ключ длиной минимум 32 символа",
        examples=["abcdef1234567890abcdef1234567890"],
    )],
):
    # Читает заголовок "X-Api-Key"
    if x_api_key != "a" * 32:
        raise HTTPException(403, "Неверный API-ключ")
    return {"access": "granted"}

# --- 3. convert_underscores=False: заголовок с подчёркиванием ---
@app.get("/legacy")
def legacy_endpoint(
    x_custom_header: Annotated[str | None, Header(
        convert_underscores=False,
        alias="X_Custom_Header",
        description="Устаревший заголовок с подчёркиваниями",
    )] = None,
):
    return {"header": x_custom_header}

# --- 4. Список значений: заголовок передан несколько раз ---
@app.get("/multi")
def multi_header(
    x_token: Annotated[list[str], Header(
        description="Несколько токенов в одном запросе",
    )],
):
    # X-Token: tok1
    # X-Token: tok2
    # → x_token = ["tok1", "tok2"]
    return {"tokens": x_token, "count": len(x_token)}

# --- 5. Версионирование через заголовок ---
@app.get("/data")
def versioned_data(
    accept_version: Annotated[str, Header(
        alias="Accept-Version",
        pattern=r"^v[1-9]\\d*$",
        description="Версия API: 'v1', 'v2', ...",
        examples=["v1", "v2"],
    )] = "v1",
):
    return {"version": accept_version, "data": f"данные для {accept_version}"}

# curl -H "X-Api-Key: $(python -c 'print(\"a\"*32)')" http://localhost:8000/secure
# curl -H "X-Token: tok1" -H "X-Token: tok2" http://localhost:8000/multi`,
    },

    {
        category: 'Параметры запроса',
        name: 'Cookie()',
        description: 'Объявляет параметр HTTP-cookie запроса. FastAPI извлекает значение из заголовка Cookie по имени Python-переменной (без преобразования регистра, в отличие от Header). Поддерживает те же поля валидации, что и Query(). Используется для чтения сессионных токенов, пользовательских предпочтений и других данных, хранящихся в cookie браузера.',
        syntax: `Cookie(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: 'Значение по умолчанию. ... — обязательный cookie. None — необязательный (cookie может отсутствовать).' },
            { name: 'default_factory', description: 'Callable без аргументов для динамического значения по умолчанию.' },
            { name: 'alias', description: 'Имя cookie в запросе, если оно отличается от имени Python-переменной. Например, alias="session_id" при переменной session.' },
            { name: 'min_length / max_length', description: 'Ограничения длины строкового значения cookie.' },
            { name: 'pattern', description: 'Регулярное выражение для проверки формата значения cookie.' },
            { name: 'include_in_schema', description: 'Включать параметр cookie в OpenAPI-схему.' },
            { name: 'deprecated', description: 'Помечает cookie устаревшим в документации.' },
            { name: 'description', description: 'Описание cookie для Swagger UI.' },
        ],
        example: `from fastapi import FastAPI, Cookie, HTTPException, Response
from typing import Annotated
import secrets

app = FastAPI()

# Простое хранилище сессий
SESSIONS: dict[str, dict] = {}

# --- 1. Чтение необязательного cookie ---
@app.get("/me")
def get_current_user(
    session_id: Annotated[str | None, Cookie(
        description="Идентификатор сессии",
        min_length=32,
        max_length=64,
    )] = None,
):
    if session_id is None:
        return {"user": None, "message": "Не авторизован"}
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(401, "Сессия не найдена или истекла")
    return {"user": session["username"]}

# --- 2. Создание сессии — установка cookie в ответе ---
@app.post("/login")
def login(response: Response, username: str, password: str):
    if not (username == "admin" and password == "secret"):
        raise HTTPException(401, "Неверные данные")
    session_id = secrets.token_hex(32)
    SESSIONS[session_id] = {"username": username}
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,   # недоступен из JavaScript
        secure=True,     # только HTTPS
        samesite="lax",
        max_age=3600,    # 1 час
    )
    return {"message": "Вход выполнен"}

# --- 3. Удаление сессии --- выход ---
@app.post("/logout")
def logout(
    response: Response,
    session_id: Annotated[str | None, Cookie()] = None,
):
    if session_id and session_id in SESSIONS:
        del SESSIONS[session_id]
    response.delete_cookie("session_id")
    return {"message": "Выход выполнен"}

# --- 4. Пользовательские предпочтения ---
@app.get("/theme")
def get_theme(
    theme: Annotated[str, Cookie(
        pattern=r"^(light|dark|system)$",
        description="Тема интерфейса: light, dark или system",
    )] = "system",
):
    return {"theme": theme}

# --- 5. Несколько cookie ---
@app.get("/prefs")
def get_preferences(
    locale:   Annotated[str, Cookie(pattern=r"^[a-z]{2}(-[A-Z]{2})?$")] = "ru",
    timezone: Annotated[str | None, Cookie(alias="tz")] = None,
):
    return {"locale": locale, "timezone": timezone or "UTC"}

# curl -c cookies.txt -b cookies.txt -X POST
#      "http://localhost:8000/login?username=admin&password=secret"
# curl -b cookies.txt http://localhost:8000/me
# → {"user": "admin"}`,
    },

    {
        category: 'Параметры запроса',
        name: 'Body()',
        description: 'Объявляет параметр тела HTTP-запроса с расширенными настройками. Обычно FastAPI автоматически распознаёт тело запроса по Pydantic-модели, но Body() нужен в нескольких случаях: принять примитивный тип (int, str) из тела; вложить одиночную модель в именованный ключ (embed=True); явно задать media_type; добавить метаданные или примеры для OpenAPI; или принять несколько тел одновременно, каждое под своим ключом.',
        syntax: `Body(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    embed=False,
    media_type="application/json",
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: 'Значение по умолчанию. ... — обязательное тело. None или другое значение — необязательное.' },
            { name: 'default_factory', description: 'Callable без аргументов для динамического значения по умолчанию.' },
            { name: 'embed', description: 'bool, по умолчанию False. Если True — тело должно быть обёрнуто в JSON-объект с именем параметра как ключом. {"item": {...}} вместо {...}. Автоматически включается при нескольких body-параметрах.' },
            { name: 'media_type', description: 'MIME-тип тела запроса. По умолчанию "application/json". Используется в OpenAPI-схеме.' },
            { name: 'alias', description: 'Альтернативное имя ключа в JSON-теле. Если alias="itemData", клиент передаёт {"itemData": {...}}.' },
            { name: 'gt / ge / lt / le', description: 'Числовые ограничения для примитивных числовых тел (int, float).' },
            { name: 'min_length / max_length', description: 'Ограничения длины для строкового тела.' },
            { name: 'description', description: 'Описание параметра для OpenAPI.' },
            { name: 'examples / openapi_examples', description: 'Примеры значений для Swagger UI.' },
            { name: 'include_in_schema', description: 'Включать параметр в OpenAPI-схему.' },
            { name: 'deprecated', description: 'Помечает параметр устаревшим в документации.' },
        ],
        example: `from fastapi import FastAPI, Body
from typing import Annotated
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name:  str
    price: float

class Supplier(BaseModel):
    company: str
    country: str

# --- 1. Примитив из тела (без Body() FastAPI ищет его в query) ---
@app.put("/items/{item_id}/price")
def update_price(
    item_id: int,
    price: Annotated[float, Body(
        gt=0,
        description="Новая цена товара, строго больше нуля",
        examples=[99.99, 149.0],
    )],
):
    # Тело: 99.99
    return {"item_id": item_id, "new_price": price}

# --- 2. embed=True: одиночная модель вложена в ключ ---
@app.post("/items/wrapped")
def create_wrapped(
    item: Annotated[Item, Body(
        embed=True,
        description="Данные товара",
    )],
):
    # Тело: {"item": {"name": "Ноутбук", "price": 999.0}}
    # Без embed тело было бы: {"name": "Ноутбук", "price": 999.0}
    return item

# --- 3. Несколько тел: каждое под своим ключом ---
@app.post("/items/with-supplier")
def create_with_supplier(
    item:     Annotated[Item,     Body(description="Данные товара")],
    supplier: Annotated[Supplier, Body(description="Данные поставщика")],
    discount: Annotated[float,    Body(ge=0, le=1, description="Скидка 0–1")] = 0.0,
):
    # Тело:
    # {
    #   "item":     {"name": "Ноутбук", "price": 999.0},
    #   "supplier": {"company": "TechCo", "country": "RU"},
    #   "discount": 0.1
    # }
    final_price = item.price * (1 - discount)
    return {"item": item, "supplier": supplier, "final_price": final_price}

# --- 4. openapi_examples: именованные примеры в Swagger ---
@app.post("/orders")
def create_order(
    item: Annotated[Item, Body(
        openapi_examples={
            "laptop": {
                "summary": "Ноутбук",
                "value": {"name": "Ноутбук Pro", "price": 1299.99},
            },
            "mouse": {
                "summary": "Мышь",
                "value": {"name": "Мышь Wireless", "price": 29.99},
            },
        },
    )],
):
    return {"order": item}`,
    },

    {
        category: 'Параметры запроса',
        name: 'Form()',
        description: 'Объявляет параметр HTML-формы (application/x-www-form-urlencoded или multipart/form-data). Используется для приёма данных из HTML-форм и совместим с традиционными веб-интерфейсами. Нельзя смешивать Form() и Body() в одном маршруте — они используют разные Content-Type. Для загрузки файлов вместе с данными используется Form() совместно с File(). Требует установки python-multipart.',
        syntax: `Form(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    media_type="application/x-www-form-urlencoded",
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: 'Значение по умолчанию. ... — обязательное поле формы. None или строка — необязательное.' },
            { name: 'default_factory', description: 'Callable без аргументов для динамического значения по умолчанию.' },
            { name: 'media_type', description: 'MIME-тип тела. По умолчанию "application/x-www-form-urlencoded". При использовании File() автоматически переключается на "multipart/form-data".' },
            { name: 'alias', description: 'Имя поля формы, если оно отличается от имени Python-переменной.' },
            { name: 'min_length / max_length', description: 'Ограничения длины строкового поля формы.' },
            { name: 'pattern', description: 'Регулярное выражение для проверки значения поля.' },
            { name: 'gt / ge / lt / le', description: 'Числовые ограничения для числовых полей формы.' },
            { name: 'description', description: 'Описание поля для OpenAPI.' },
            { name: 'include_in_schema', description: 'Включать поле в OpenAPI-схему.' },
        ],
        example: `# pip install python-multipart  (обязательно для Form и File)

from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from typing import Annotated

app = FastAPI()

# --- 1. Простая форма входа ---
@app.post("/login")
def login(
    username: Annotated[str, Form(
        min_length=3,
        max_length=50,
        description="Имя пользователя",
    )],
    password: Annotated[str, Form(
        min_length=8,
        description="Пароль (минимум 8 символов)",
    )],
):
    # Content-Type: application/x-www-form-urlencoded
    # Тело: username=admin&password=supersecret
    if not (username == "admin" and password == "supersecret"):
        raise HTTPException(401, "Неверные данные")
    return {"message": f"Добро пожаловать, {username}"}

# --- 2. Форма регистрации с валидацией ---
@app.post("/register")
def register(
    username:  Annotated[str,      Form(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")],
    email:     Annotated[str,      Form(pattern=r"^[^@]+@[^@]+\\.[^@]+$")],
    age:       Annotated[int,      Form(ge=18, le=120)],
    agree_tos: Annotated[bool,     Form(description="Согласие с условиями")],
    referral:  Annotated[str | None, Form(max_length=20)] = None,
):
    return {
        "username": username,
        "email": email,
        "age": age,
        "agree_tos": agree_tos,
        "referral": referral,
    }

# --- 3. Форма + файл (multipart/form-data) ---
@app.post("/profile/upload")
async def upload_profile(
    username: Annotated[str,        Form(min_length=3)],
    bio:      Annotated[str | None, Form(max_length=500)] = None,
    avatar:   UploadFile = File(None),
):
    # Content-Type: multipart/form-data
    result = {"username": username, "bio": bio, "avatar": None}
    if avatar:
        contents = await avatar.read()
        if len(contents) > 2 * 1024 * 1024:  # 2 МБ
            raise HTTPException(413, "Файл слишком большой (макс. 2 МБ)")
        result["avatar"] = {
            "filename": avatar.filename,
            "size":     len(contents),
            "type":     avatar.content_type,
        }
    return result

# curl -X POST http://localhost:8000/login \\
#      -d "username=admin&password=supersecret"

# curl -X POST http://localhost:8000/profile/upload \\
#      -F "username=Алиса" \\
#      -F "bio=Разработчик" \\
#      -F "avatar=@photo.jpg"`,
    },

    {
        category: 'Параметры запроса',
        name: 'File()',
        description: 'Объявляет параметр загружаемого файла в multipart/form-data запросе. Используется двумя способами: как bytes — всё содержимое файла загружается в память сразу; как UploadFile — файл открывается как объект с метаданными (filename, content_type) и async-методами чтения, что эффективнее для больших файлов. Нельзя смешивать с Body(). Требует python-multipart.',
        syntax: `File(
    default=PydanticUndefined,
    *,
    default_factory=_Unset,
    media_type="multipart/form-data",
    alias=None,
    alias_priority=_Unset,
    validation_alias=None,
    serialization_alias=None,
    title=None,
    description=None,
    gt=None,
    ge=None,
    lt=None,
    le=None,
    multiple_of=None,
    strict=_Unset,
    max_digits=_Unset,
    decimal_places=_Unset,
    min_length=None,
    max_length=None,
    pattern=None,
    discriminator=None,
    json_schema_extra=_Unset,
    frozen=None,
    validate_default=False,
    repr=True,
    include_in_schema=True,
    examples=None,
    example=_Unset,
    openapi_examples=None,
    deprecated=None,
)`,
        arguments: [
            { name: 'default', description: '... — файл обязателен. None — файл необязателен (UploadFile | None = File(None)).' },
            { name: 'default_factory', description: 'Callable без аргументов для динамического значения по умолчанию.' },
            { name: 'media_type', description: 'MIME-тип. По умолчанию "multipart/form-data". Используется в OpenAPI-схеме.' },
            { name: 'alias', description: 'Имя поля формы, если оно отличается от имени Python-переменной.' },
            { name: 'description', description: 'Описание параметра для OpenAPI-документации.' },
            { name: 'include_in_schema', description: 'Включать параметр в OpenAPI-схему.' },
            { name: 'deprecated', description: 'Помечает параметр устаревшим в документации.' },
        ],
        example: `# pip install python-multipart

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Annotated
import io

app = FastAPI()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES   = {"application/pdf", "text/plain", "text/csv"}
MAX_IMAGE_SIZE      = 5  * 1024 * 1024   # 5 МБ
MAX_DOC_SIZE        = 10 * 1024 * 1024   # 10 МБ

# --- 1. bytes: маленький файл целиком в памяти ---
@app.post("/files/raw")
def upload_raw(
    data: Annotated[bytes, File(description="Файл в виде байтов (макс. 1 МБ)")],
):
    if len(data) > 1024 * 1024:
        raise HTTPException(413, "Файл слишком большой")
    return {"size_bytes": len(data), "preview": data[:50].hex()}

# --- 2. UploadFile: эффективная загрузка с метаданными ---
@app.post("/images/upload")
async def upload_image(
    file: Annotated[UploadFile, File(description="Изображение: JPEG, PNG, WebP или GIF")],
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, f"Неподдерживаемый тип: {file.content_type}")

    # Читаем чанками — не загружаем всё в память сразу
    contents = b""
    while chunk := await file.read(65536):   # 64 КБ за раз
        contents += chunk
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(413, "Изображение больше 5 МБ")

    return {
        "filename":     file.filename,
        "content_type": file.content_type,
        "size_kb":      round(len(contents) / 1024, 2),
    }

# --- 3. Необязательный файл ---
@app.post("/products")
async def create_product(
    name:  Annotated[str,                  Form()],
    price: Annotated[float,                Form(gt=0)],
    image: Annotated[UploadFile | None,    File(description="Фото товара (необязательно)")] = None,
):
    result: dict = {"name": name, "price": price}
    if image:
        img_bytes = await image.read()
        result["image"] = {"filename": image.filename, "size": len(img_bytes)}
    return result

# --- 4. Несколько файлов ---
@app.post("/documents/batch")
async def upload_batch(
    files: Annotated[list[UploadFile], File(description="Список документов (PDF, TXT, CSV)")],
):
    results = []
    for f in files:
        if f.content_type not in ALLOWED_DOC_TYPES:
            raise HTTPException(415, f"{f.filename}: неподдерживаемый тип {f.content_type}")
        content = await f.read()
        if len(content) > MAX_DOC_SIZE:
            raise HTTPException(413, f"{f.filename}: файл больше 10 МБ")
        results.append({"filename": f.filename, "size_kb": round(len(content) / 1024, 2)})
    return {"uploaded": len(results), "files": results}

# --- 5. Стриминг содержимого файла обратно клиенту ---
@app.post("/files/echo")
async def echo_file(file: UploadFile = File(...)):
    """Принимает файл и отдаёт его обратно с теми же заголовками."""
    return StreamingResponse(
        content=file.file,          # file.file — SpooledTemporaryFile
        media_type=file.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{file.filename}"'},
    )

# curl -X POST http://localhost:8000/images/upload \\
#      -F "file=@photo.jpg"

# curl -X POST http://localhost:8000/documents/batch \\
#      -F "files=@report.pdf" \\
#      -F "files=@data.csv"`,
    },

    {
        category: 'Request',
        name: 'Request()',
        description: 'Объект HTTP-запроса Starlette, доступный в обработчиках FastAPI. Содержит полную информацию о входящем запросе: URL, метод, заголовки, параметры, cookies, тело, состояние соединения. Внедряется автоматически при указании параметра типа Request в функции-обработчике. Используется когда стандартных параметров (Query, Header, Body и т.д.) недостаточно — например, для доступа к сырому телу, стримингу или метаданным ASGI-области.',
        syntax: `Request(scope, receive=empty_receive, send=empty_send)`,
        arguments: [
            { name: 'scope', description: 'dict. ASGI-область запроса: тип соединения, путь, заголовки, параметры маршрута и т.д. Передаётся ASGI-сервером автоматически.' },
            { name: 'receive', description: 'Async callable. ASGI-канал получения данных от клиента. Используется для чтения тела запроса.' },
            { name: 'send', description: 'Async callable. ASGI-канал отправки данных клиенту. Обычно не используется напрямую в обработчиках.' },
        ],
        example: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/info")
async def request_info(request: Request):
    """Демонстрация основных атрибутов объекта Request."""
    return {
        "method":      request.method,
        "url":         str(request.url),
        "path":        request.url.path,
        "query":       request.url.query,
        "scheme":      request.url.scheme,
        "hostname":    request.url.hostname,
        "port":        request.url.port,
        "base_url":    str(request.base_url),
        "client_host": request.client.host if request.client else None,
        "client_port": request.client.port if request.client else None,
        "headers":     dict(request.headers),
        "query_params": dict(request.query_params),
        "path_params":  dict(request.path_params),
        "cookies":      dict(request.cookies),
    }

# GET /info?search=fastapi&page=2
# → method: "GET", path: "/info", query: "search=fastapi&page=2", ...`,
    },

    {
        category: 'Request',
        name: 'request.method',
        description: 'HTTP-метод входящего запроса в верхнем регистре. Всегда строка: "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE". Используется для логирования, условной обработки или реализации маршрута, принимающего несколько методов.',
        syntax: `request.method`,
        arguments: [],
        example: `from fastapi import FastAPI, Request

app = FastAPI()

@app.api_route("/resource", methods=["GET", "POST", "DELETE"])
async def multi_method(request: Request):
    if request.method == "GET":
        return {"action": "чтение", "data": [1, 2, 3]}
    elif request.method == "POST":
        body = await request.json()
        return {"action": "создание", "received": body}
    elif request.method == "DELETE":
        return {"action": "удаление"}

# Логирование метода в middleware
@app.middleware("http")
async def log_method(request: Request, call_next):
    print(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"← {response.status_code}")
    return response`,
    },

    {
        category: 'Request',
        name: 'request.url',
        description: 'Объект URL запроса с разбором на компоненты. Даёт доступ к полному URL и его частям: scheme, netloc, path, query, fragment, hostname, port. Приводится к строке через str(request.url). Все компоненты доступны как атрибуты.',
        syntax: `request.url
request.url.path
request.url.query
request.url.scheme
request.url.hostname
request.url.port
request.url.netloc`,
        arguments: [
            { name: 'request.url.path', description: 'Путь без query-строки: "/api/v1/items/42".' },
            { name: 'request.url.query', description: 'Query-строка без знака ?: "search=ноутбук&page=2".' },
            { name: 'request.url.scheme', description: 'Протокол: "http" или "https".' },
            { name: 'request.url.hostname', description: 'Доменное имя или IP без порта: "api.example.com".' },
            { name: 'request.url.port', description: 'Порт как int или None если стандартный (80/443).' },
            { name: 'request.url.netloc', description: 'host:port или просто host если стандартный порт: "api.example.com:8080".' },
        ],
        example: `from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/debug/url")
def inspect_url(request: Request):
    url = request.url
    return {
        "full":     str(url),
        "path":     url.path,
        "query":    url.query,
        "scheme":   url.scheme,
        "hostname": url.hostname,
        "port":     url.port,
        "netloc":   url.netloc,
    }

# GET http://localhost:8000/debug/url?q=test&page=1
# {
#   "full":     "http://localhost:8000/debug/url?q=test&page=1",
#   "path":     "/debug/url",
#   "query":    "q=test&page=1",
#   "scheme":   "http",
#   "hostname": "localhost",
#   "port":     8000,
#   "netloc":   "localhost:8000"
# }`,
    },

    {
        category: 'Request',
        name: 'request.base_url',
        description: 'Базовый URL приложения без пути и query-строки: только scheme + netloc + корневой путь. Полезен для построения абсолютных ссылок в ответах, email-уведомлениях и пагинации. Возвращает объект URL, приводимый к строке.',
        syntax: `request.base_url`,
        arguments: [],
        example: `from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/items")
def list_items(request: Request, page: int = 1, limit: int = 10):
    base = str(request.base_url).rstrip("/")
    items = [{"id": i} for i in range((page - 1) * limit + 1, page * limit + 1)]
    return {
        "items": items,
        "links": {
            "self":  f"{base}/items?page={page}&limit={limit}",
            "next":  f"{base}/items?page={page + 1}&limit={limit}",
            "prev":  f"{base}/items?page={max(1, page - 1)}&limit={limit}",
        },
    }

@app.post("/users")
def create_user(request: Request):
    user_id = 42
    location = f"{request.base_url}users/{user_id}"
    # → "http://localhost:8000/users/42"
    return {"id": user_id, "location": location}

# str(request.base_url) → "http://localhost:8000/"`,
    },

    {
        category: 'Request',
        name: 'request.headers',
        description: 'Заголовки входящего запроса в виде объекта Headers — неизменяемого словаря с поиском без учёта регистра. Ключи хранятся в нижнем регистре. Поддерживает getlist() для заголовков с несколькими значениями и итерацию по всем парам.',
        syntax: `request.headers`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.get("/headers/inspect")
def inspect_headers(request: Request):
    return {
        "content_type":  request.headers.get("content-type"),
        "authorization": request.headers.get("authorization"),
        "user_agent":    request.headers.get("user-agent"),
        "accept":        request.headers.get("accept", "*/*"),
        "all_headers":   dict(request.headers),
    }

@app.post("/headers/auth")
async def auth_endpoint(request: Request):
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Требуется Bearer-токен")
    token = auth.removeprefix("Bearer ")
    return {"token_preview": token[:8] + "..."}

@app.get("/headers/multi")
def multi_value_headers(request: Request):
    # Заголовок Accept может содержать несколько значений через ","
    accept = request.headers.getlist("accept")
    return {"accept_values": accept}

# Поиск без учёта регистра:
# request.headers["Content-Type"] == request.headers["content-type"]`,
    },

    {
        category: 'Request',
        name: 'request.query_params',
        description: 'Query-параметры запроса в виде объекта QueryParams. Поддерживает доступ по ключу, метод getlist() для параметров с несколькими значениями (/?tag=a&tag=b) и итерацию. Содержит ту же информацию, что и параметры Query() в обработчике, но без валидации.',
        syntax: `request.query_params`,
        arguments: [],
        example: `from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/search")
def search(request: Request):
    params = request.query_params

    q       = params.get("q", "")
    page    = int(params.get("page", "1"))
    limit   = int(params.get("limit", "10"))
    tags    = params.getlist("tag")     # ?tag=python&tag=fastapi → ["python", "fastapi"]
    sort    = params.get("sort", "id")

    return {
        "query":  q,
        "page":   page,
        "limit":  limit,
        "tags":   tags,
        "sort":   sort,
        "all":    dict(params),
    }

# GET /search?q=fastapi&page=2&tag=python&tag=api&sort=name
# → {"query": "fastapi", "page": 2, "tags": ["python", "api"], ...}`,
    },

    {
        category: 'Request',
        name: 'request.path_params',
        description: 'Path-параметры запроса в виде словаря {str: Any}. Содержит значения, извлечённые из URL-шаблона маршрута. Все значения уже приведены к нужным типам FastAPI. Используется для доступа к path-параметрам через объект Request вместо явного объявления в сигнатуре функции.',
        syntax: `request.path_params`,
        arguments: [],
        example: `from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/orgs/{org}/repos/{repo}/commits/{sha}")
async def get_commit(request: Request):
    params = request.path_params
    return {
        "org":    params["org"],
        "repo":   params["repo"],
        "sha":    params["sha"],
        "all":    params,
    }

# Полезно в middleware: доступ к path_params без знания маршрута
@app.middleware("http")
async def log_path_params(request: Request, call_next):
    if request.path_params:
        print(f"Path params: {dict(request.path_params)}")
    return await call_next(request)

# GET /orgs/python/repos/cpython/commits/abc123
# → {"org": "python", "repo": "cpython", "sha": "abc123"}`,
    },

    {
        category: 'Request',
        name: 'request.cookies',
        description: 'Cookie запроса в виде словаря {str: str}. Содержит все cookie, переданные браузером в заголовке Cookie. Для чтения конкретного cookie с валидацией рекомендуется использовать параметр Cookie() в обработчике, но request.cookies удобен когда нужно обработать несколько cookie или неизвестный набор.',
        syntax: `request.cookies`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

SESSIONS: dict[str, str] = {"tok-abc123": "Алиса", "tok-xyz789": "Боб"}

@app.get("/me")
def get_me(request: Request):
    cookies = request.cookies
    session_id = cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, "Cookie session_id отсутствует")
    username = SESSIONS.get(session_id)
    if not username:
        raise HTTPException(401, "Сессия не найдена")
    return {
        "username": username,
        "all_cookies": cookies,
        "cookie_count": len(cookies),
    }

@app.post("/login")
def login(request: Request):
    response = JSONResponse({"status": "ok"})
    response.set_cookie("session_id", "tok-abc123", httponly=True)
    response.set_cookie("theme", "dark")
    return response

# Cookie: session_id=tok-abc123; theme=dark
# request.cookies → {"session_id": "tok-abc123", "theme": "dark"}`,
    },

    {
        category: 'Request',
        name: 'request.client',
        description: 'Информация о клиенте соединения: IP-адрес и порт. Возвращает объект Address(host, port) или None если клиент неизвестен (например, при unix-сокете). При работе за прокси (nginx, Cloudflare) содержит адрес прокси, а не реального пользователя — для реального IP нужен заголовок X-Forwarded-For или X-Real-IP.',
        syntax: `request.client
request.client.host
request.client.port`,
        arguments: [
            { name: 'request.client.host', description: 'str. IP-адрес клиента или прокси: "192.168.1.10", "127.0.0.1".' },
            { name: 'request.client.port', description: 'int. Порт клиента на его стороне.' },
        ],
        example: `from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

# Список заблокированных IP
BLOCKED_IPS = {"10.0.0.1", "10.0.0.2"}

def get_real_ip(request: Request) -> str:
    """Извлекает реальный IP с учётом прокси."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For: client, proxy1, proxy2
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"

@app.get("/ip")
def get_ip(request: Request):
    direct_host = request.client.host if request.client else None
    direct_port = request.client.port if request.client else None
    real_ip     = get_real_ip(request)
    return {
        "direct_host": direct_host,
        "direct_port": direct_port,
        "real_ip":     real_ip,
    }

@app.middleware("http")
async def block_ips(request: Request, call_next):
    ip = get_real_ip(request)
    if ip in BLOCKED_IPS:
        raise HTTPException(403, f"Доступ запрещён для {ip}")
    return await call_next(request)`,
    },

    {
        category: 'Request',
        name: 'request.state',
        description: 'Объект произвольного состояния запроса. Позволяет прикреплять данные к запросу в middleware и читать их в обработчиках. Каждый запрос получает собственный пустой State-объект. Данные записываются как атрибуты: request.state.user = ..., и доступны во всей цепочке обработки.',
        syntax: `request.state`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException, Depends
from typing import Annotated
import time

app = FastAPI()

# --- Middleware: записывает данные в state ---
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    request.state.start_time = time.perf_counter()
    token = request.headers.get("authorization", "")
    if token.startswith("Bearer "):
        # Имитация проверки токена
        request.state.user = {"username": "Алиса", "role": "admin"}
    else:
        request.state.user = None
    response = await call_next(request)
    elapsed = time.perf_counter() - request.state.start_time
    response.headers["X-Process-Time"] = f"{elapsed:.4f}s"
    return response

# --- Зависимость: читает state.user ---
def get_current_user(request: Request) -> dict:
    user = request.state.user
    if not user:
        raise HTTPException(401, "Не авторизован")
    return user

AuthUser = Annotated[dict, Depends(get_current_user)]

# --- Обработчики ---
@app.get("/profile")
def get_profile(user: AuthUser):
    return {"username": user["username"], "role": user["role"]}

@app.get("/admin")
def admin_panel(user: AuthUser):
    if user["role"] != "admin":
        raise HTTPException(403, "Только для администраторов")
    return {"panel": "данные администратора"}`,
    },

    {
        category: 'Request',
        name: 'request.scope',
        description: 'Сырой ASGI-словарь области запроса. Содержит всю низкоуровневую информацию о соединении: тип ("http"/"websocket"), метод, путь, заголовки в виде байт, параметры маршрута, app-объект и т.д. Используется для интеграции с ASGI-middleware, тестирования и доступа к данным, недоступным через высокоуровневые атрибуты.',
        syntax: `request.scope`,
        arguments: [],
        example: `from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/scope/inspect")
def inspect_scope(request: Request):
    scope = request.scope
    return {
        "type":          scope.get("type"),
        "http_version":  scope.get("http_version"),
        "method":        scope.get("method"),
        "path":          scope.get("path"),
        "root_path":     scope.get("root_path", ""),
        "query_string":  scope.get("query_string", b"").decode(),
        # Заголовки хранятся как список байт-пар
        "raw_headers_count": len(scope.get("headers", [])),
        # app — экземпляр FastAPI/Starlette
        "app_type":      type(scope.get("app")).__name__,
    }

# Тип запроса: "http" для HTTP, "websocket" для WebSocket
# Полезно в универсальном middleware:
@app.middleware("http")
async def scope_logger(request: Request, call_next):
    scope = request.scope
    print(f"[scope] type={scope['type']} path={scope['path']}")
    return await call_next(request)`,
    },

    {
        category: 'Request',
        name: 'request.app',
        description: 'Экземпляр приложения FastAPI/Starlette, обрабатывающего запрос. Позволяет получить доступ к конфигурации приложения, маршрутам, state и dependency_overrides изнутри обработчика или middleware. Эквивалентен request.scope["app"].',
        syntax: `request.app`,
        arguments: [],
        example: `from fastapi import FastAPI, Request

app = FastAPI(title="Мой API", version="2.0.0")
app.state.db_pool = None  # будет заполнено при старте
app.state.config = {"max_items": 100, "feature_x": True}

@app.get("/app/info")
def app_info(request: Request):
    application = request.app
    return {
        "title":        application.title,
        "version":      application.version,
        "routes_count": len(application.routes),
        "debug":        application.debug,
        "config":       application.state.config,
    }

@app.get("/app/routes")
def list_routes(request: Request):
    from fastapi.routing import APIRoute
    routes = [
        {"path": r.path, "methods": list(r.methods), "name": r.name}
        for r in request.app.routes
        if isinstance(r, APIRoute)
    ]
    return {"routes": routes}

# Зависимость, получающая конфиг из app.state
def get_config(request: Request) -> dict:
    return request.app.state.config`,
    },

    {
        category: 'Request',
        name: 'request.session',
        description: 'Словарь сессии запроса. Доступен только при подключённом SessionMiddleware (из starlette.middleware.sessions). Данные хранятся в подписанном cookie на стороне клиента. Поддерживает чтение, запись и удаление ключей как обычный dict. При изменении сессии middleware автоматически обновляет cookie в ответе.',
        syntax: `request.session`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()

# Обязательно: добавить middleware перед использованием request.session
app.add_middleware(
    SessionMiddleware,
    secret_key="замените-на-безопасный-ключ-32-символа",
    max_age=3600,        # TTL сессии в секундах
    https_only=False,    # True в продакшне
    same_site="lax",
)

@app.post("/session/login")
def session_login(request: Request, username: str, password: str):
    if not (username == "admin" and password == "secret"):
        raise HTTPException(401, "Неверные данные")
    request.session["username"] = username
    request.session["role"]     = "admin"
    request.session["visits"]   = 0
    return {"message": "Сессия создана"}

@app.get("/session/me")
def session_me(request: Request):
    username = request.session.get("username")
    if not username:
        raise HTTPException(401, "Не авторизован")
    request.session["visits"] = request.session.get("visits", 0) + 1
    return {
        "username": username,
        "role":     request.session.get("role"),
        "visits":   request.session["visits"],
    }

@app.post("/session/logout")
def session_logout(request: Request):
    request.session.clear()
    return {"message": "Сессия очищена"}

# Данные сессии хранятся в подписанном cookie "session"
# и не видны другим пользователям, но доступны клиенту (не шифруются)`,
    },

    {
        category: 'Request',
        name: 'await request.body()',
        description: 'Возвращает тело запроса целиком как bytes. Читает все данные в память. После первого вызова тело кэшируется — повторный вызов возвращает тот же объект bytes без повторного чтения из сети. Используется когда нужно сырое тело: для вычисления подписи HMAC, логирования, обработки нестандартных форматов.',
        syntax: `await request.body()`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import hmac, hashlib, json

app = FastAPI()

WEBHOOK_SECRET = b"мой-секретный-ключ"

@app.post("/webhook/github")
async def github_webhook(request: Request):
    """Верификация GitHub-вебхука через HMAC-SHA256."""
    body = await request.body()

    # Проверяем подпись
    signature_header = request.headers.get("x-hub-signature-256", "")
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET, body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature_header, expected):
        raise HTTPException(403, "Неверная подпись вебхука")

    # Парсим JSON вручную (body уже прочитан и закэширован)
    payload = json.loads(body)
    event   = request.headers.get("x-github-event", "unknown")
    return {"event": event, "repo": payload.get("repository", {}).get("name")}

@app.post("/debug/raw")
async def raw_body(request: Request):
    body = await request.body()
    return {
        "size":    len(body),
        "hex":     body[:32].hex(),
        "text":    body[:200].decode("utf-8", errors="replace"),
    }`,
    },

    {
        category: 'Request',
        name: 'await request.json()',
        description: 'Читает тело запроса и десериализует его как JSON. Возвращает Python-объект (dict, list, str, int и т.д.). Автоматически декодирует bytes в строку. После вызова тело кэшируется. Если Content-Type не application/json или тело не является валидным JSON — выбрасывает исключение. Обычно FastAPI сам обрабатывает JSON через Pydantic-модели, но request.json() нужен для гибкой обработки произвольных структур.',
        syntax: `await request.json()`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.post("/dynamic")
async def dynamic_handler(request: Request):
    """Принимает произвольный JSON и обрабатывает по типу корневого элемента."""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(400, "Невалидный JSON")

    if isinstance(data, list):
        return {"type": "array", "count": len(data), "items": data[:3]}
    elif isinstance(data, dict):
        return {"type": "object", "keys": list(data.keys()), "data": data}
    else:
        return {"type": type(data).__name__, "value": data}

@app.post("/merge")
async def merge_objects(request: Request):
    """Принимает список JSON-объектов и объединяет их."""
    try:
        items = await request.json()
    except Exception:
        raise HTTPException(400, "Ожидается JSON-массив объектов")
    if not isinstance(items, list):
        raise HTTPException(422, "Корневой элемент должен быть массивом")
    merged = {}
    for item in items:
        if isinstance(item, dict):
            merged.update(item)
    return {"merged": merged, "source_count": len(items)}

# POST /dynamic   {"name": "Алиса", "age": 30}
# → {"type": "object", "keys": ["name", "age"], ...}`,
    },

    {
        category: 'Request',
        name: 'await request.form()',
        description: 'Читает тело запроса как данные формы (application/x-www-form-urlencoded или multipart/form-data). Возвращает объект FormData — словарь, где значения могут быть строками или объектами UploadFile. Принимает параметры max_fields и max_files для защиты от DoS. Необходимо закрывать форму после использования: async with request.form() as form.',
        syntax: `await request.form(max_fields=1000, max_files=1000)`,
        arguments: [
            { name: 'max_fields', description: 'int, по умолчанию 1000. Максимальное количество полей формы. При превышении выбрасывает исключение.' },
            { name: 'max_files', description: 'int, по умолчанию 1000. Максимальное количество файлов в multipart-форме.' },
        ],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi import UploadFile

app = FastAPI()

@app.post("/form/inspect")
async def inspect_form(request: Request):
    """Читает произвольную форму и возвращает все поля."""
    async with request.form(max_fields=50, max_files=10) as form:
        result = {}
        files  = {}
        for key, value in form.multi_items():
            if isinstance(value, UploadFile):
                content = await value.read()
                files[key] = {
                    "filename":     value.filename,
                    "content_type": value.content_type,
                    "size":         len(content),
                }
            else:
                # Несколько значений одного поля
                if key in result:
                    existing = result[key]
                    result[key] = existing if isinstance(existing, list) else [existing]
                    result[key].append(value)
                else:
                    result[key] = value
    return {"fields": result, "files": files}

@app.post("/form/dynamic")
async def dynamic_form(request: Request):
    """Обрабатывает форму с неизвестным набором полей."""
    content_type = request.headers.get("content-type", "")
    if "form" not in content_type:
        raise HTTPException(415, "Ожидается форма (form-data или urlencoded)")
    async with request.form() as form:
        data = {k: v for k, v in form.items() if not isinstance(v, UploadFile)}
    return {"received_fields": len(data), "data": data}`,
    },

    {
        category: 'Request',
        name: 'async for chunk in request.stream()',
        description: 'Асинхронный итератор для чтения тела запроса чанками (частями). Не загружает всё тело в память сразу — каждый чанк читается по мере поступления данных от клиента. Используется для обработки больших файлов, потоковой передачи данных или ситуаций где нужно обработать тело до полной загрузки. После начала стриминга вызов request.body() или request.json() невозможен.',
        syntax: `async for chunk in request.stream(): ...`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
import hashlib

app = FastAPI()

MAX_SIZE = 100 * 1024 * 1024  # 100 МБ

@app.post("/upload/stream")
async def stream_upload(request: Request):
    """Принимает большой файл потоком, вычисляет хэш без загрузки в память."""
    content_length = int(request.headers.get("content-length", 0))
    if content_length > MAX_SIZE:
        raise HTTPException(413, f"Файл больше {MAX_SIZE // 1024 // 1024} МБ")

    hasher     = hashlib.sha256()
    total_size = 0

    async for chunk in request.stream():
        hasher.update(chunk)
        total_size += len(chunk)
        if total_size > MAX_SIZE:
            raise HTTPException(413, "Превышен лимит размера")

    return {
        "sha256":   hasher.hexdigest(),
        "size_mb":  round(total_size / 1024 / 1024, 3),
    }

@app.post("/proxy/stream")
async def proxy_stream(request: Request):
    """Проксирует тело запроса обратно клиенту как поток."""
    async def generate():
        async for chunk in request.stream():
            yield chunk

    return StreamingResponse(
        generate(),
        media_type=request.headers.get("content-type", "application/octet-stream"),
    )

# curl -X POST http://localhost:8000/upload/stream \\
#      --data-binary @large_file.bin \\
#      -H "Content-Length: $(wc -c < large_file.bin)"`,
    },

    {
        category: 'Request',
        name: 'await request.close()',
        description: 'Закрывает соединение с клиентом. Обычно вызывается автоматически по завершении обработки запроса. Явный вызов нужен в редких случаях: при досрочном завершении потоковой передачи, в исключительных ситуациях или при низкоуровневой работе с ASGI. После вызова дальнейшее чтение из request.stream() невозможно.',
        syntax: `await request.close()`,
        arguments: [],
        example: `from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.post("/upload/guarded")
async def guarded_upload(request: Request):
    """Читает поток с ранней остановкой при ошибке."""
    MAX = 10 * 1024 * 1024  # 10 МБ
    chunks = []
    total  = 0
    try:
        async for chunk in request.stream():
            total += len(chunk)
            if total > MAX:
                # Досрочно закрываем соединение
                await request.close()
                raise HTTPException(413, "Файл превышает 10 МБ")
            chunks.append(chunk)
    except Exception as exc:
        await request.close()
        raise exc
    data = b"".join(chunks)
    return {"size": len(data)}

# В middleware: явное закрытие при блокировке запроса
@app.middleware("http")
async def block_large(request: Request, call_next):
    cl = int(request.headers.get("content-length", 0))
    if cl > 50 * 1024 * 1024:
        await request.close()
        raise HTTPException(413, "Тело запроса слишком большое")
    return await call_next(request)`,
    },

    {
        category: 'Request',
        name: 'request.url_for()',
        description: 'Строит абсолютный URL для именованного маршрута приложения. Аналог app.url_path_for(), но возвращает полный URL с scheme и host из текущего запроса (а не только путь). Полезен для построения ссылок в ответах API, заголовков Location при редиректах и email-уведомлениях.',
        syntax: `request.url_for(name, **path_params)`,
        arguments: [
            { name: 'name', description: 'str. Имя маршрута — по умолчанию совпадает с именем функции-обработчика. Задаётся явно через name= в декораторе.' },
            { name: '**path_params', description: 'Значения path-параметров маршрута. Например, для маршрута "/items/{item_id}" нужно передать item_id=42.' },
        ],
        example: `from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse

app = FastAPI()

# --- Маршруты с именами ---
@app.get("/items/", name="list_items")
def list_items(request: Request):
    return {
        "items": [1, 2, 3],
        "self":   str(request.url_for("list_items")),
        "create": str(request.url_for("create_item")),
    }

@app.post("/items/", name="create_item")
def create_item(request: Request):
    item_id = 42
    item_url = request.url_for("get_item", item_id=item_id)
    return {"id": item_id, "url": str(item_url)}

@app.get("/items/{item_id}", name="get_item")
def get_item(request: Request, item_id: int):
    return {
        "id":   item_id,
        "self": str(request.url_for("get_item", item_id=item_id)),
        "list": str(request.url_for("list_items")),
    }

# Редирект с использованием url_for
@app.get("/old-items/{item_id}")
def old_items_redirect(request: Request, item_id: int):
    url = request.url_for("get_item", item_id=item_id)
    return RedirectResponse(url=str(url), status_code=301)

# request.url_for("get_item", item_id=42)
# → URL("http://localhost:8000/items/42")`,
    },

    {
        category: 'Response',
        name: 'Response()',
        description: 'Базовый класс HTTP-ответа Starlette. Используется напрямую когда нужен полный контроль над ответом: произвольный Content-Type, сырое тело, кастомные заголовки. Также внедряется как параметр обработчика (типа Response) — тогда FastAPI позволяет модифицировать заголовки и cookies, не меняя тело ответа (тело по-прежнему формирует FastAPI из return). Является базой для JSONResponse, HTMLResponse, StreamingResponse и других.',
        syntax: `Response(
    content=None,
    status_code=200,
    headers=None,
    media_type=None,
    background=None,
)`,
        arguments: [
            { name: 'content', description: 'Тело ответа. str — кодируется в bytes по media_type. bytes — передаётся как есть. None — пустое тело (для 204 No Content).' },
            { name: 'status_code', description: 'int. HTTP-код статуса. По умолчанию 200 OK.' },
            { name: 'headers', description: 'dict[str, str] | None. Дополнительные заголовки ответа. Объединяются с автоматически установленными (Content-Type, Content-Length).' },
            { name: 'media_type', description: 'str | None. MIME-тип содержимого. Устанавливает заголовок Content-Type. Для str-контента определяет кодировку.' },
            { name: 'background', description: 'BackgroundTask | None. Фоновая задача, выполняемая после отправки ответа клиенту.' },
        ],
        example: `from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
from starlette.background import BackgroundTask
import csv, io, time

app = FastAPI()

# --- 1. Прямой возврат Response с произвольным телом ---
@app.get("/export/csv")
def export_csv():
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "name", "price"])
    writer.writerows([[1, "Ноутбук", 999], [2, "Мышь", 29], [3, "Клавиатура", 79]])
    return Response(
        content=buf.getvalue(),
        status_code=200,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )

# --- 2. Пустой ответ 204 No Content ---
@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    return Response(status_code=204)  # тело отсутствует

# --- 3. Response как параметр: модифицируем заголовки, тело задаёт FastAPI ---
@app.get("/items/{item_id}")
def get_item(item_id: int, response: Response):
    data = {"id": item_id, "name": f"Товар {item_id}"}
    response.headers["X-Item-Id"]    = str(item_id)
    response.headers["Cache-Control"] = "public, max-age=300"
    response.headers["ETag"]          = f'"{hash(item_id)}"'
    response.set_cookie("last_viewed", str(item_id), max_age=3600)
    return data  # FastAPI сериализует как JSON, добавив наши заголовки

# --- 4. BackgroundTask: действие после отправки ответа ---
def send_audit_log(user_id: int, action: str):
    time.sleep(0.1)  # имитация записи в БД
    print(f"[audit] user={user_id} action={action}")

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    task = BackgroundTask(send_audit_log, user_id=user_id, action="delete")
    return Response(
        content=None,
        status_code=204,
        background=task,
    )

# --- 5. Кастомный XML-ответ ---
@app.get("/data/xml")
def xml_response():
    xml = '<?xml version="1.0"?><root><item id="1">Ноутбук</item></root>'
    return Response(content=xml, media_type="application/xml")`,
    },

    {
        category: 'Response',
        name: 'response.status_code',
        description: 'HTTP-код статуса ответа. При использовании Response как параметра обработчика установка response.status_code изменяет код статуса итогового ответа. При прямом создании Response — задаётся через конструктор. Читается как атрибут объекта ответа.',
        syntax: `response.status_code`,
        arguments: [],
        example: `from fastapi import FastAPI, Response, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

# --- 1. Чтение status_code у объекта ответа ---
@app.get("/status/demo")
def status_demo():
    r = Response(content="ok", status_code=201)
    print(r.status_code)   # 201
    return r

# --- 2. Установка status_code через параметр Response ---
@app.post("/items")
def create_item(name: str, response: Response):
    item_id = 42
    if name == "duplicate":
        response.status_code = 200   # уже существует — 200 вместо 201
        return {"id": item_id, "created": False}
    response.status_code = 201       # создан — 201
    return {"id": item_id, "created": True}

# --- 3. Условный статус по результату операции ---
@app.put("/items/{item_id}")
def upsert_item(item_id: int, name: str, response: Response):
    db: dict[int, str] = {1: "Ноутбук"}
    if item_id in db:
        db[item_id] = name
        response.status_code = 200   # обновлено
    else:
        db[item_id] = name
        response.status_code = 201   # создано

    return {"id": item_id, "name": name}

# Стандартные коды:
# 200 OK, 201 Created, 204 No Content
# 301/302 Redirect, 400 Bad Request
# 401 Unauthorized, 403 Forbidden, 404 Not Found
# 409 Conflict, 422 Unprocessable Entity, 500 Internal Server Error`,
    },

    {
        category: 'Response',
        name: 'response.headers',
        description: 'Заголовки HTTP-ответа в виде изменяемого объекта MutableHeaders. Позволяет добавлять, изменять и удалять заголовки до отправки ответа. При использовании Response как параметра — модификации применяются к итоговому ответу FastAPI. Ключи не чувствительны к регистру.',
        syntax: `response.headers`,
        arguments: [],
        example: `from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
import time, hashlib

app = FastAPI()

# --- 1. Кэширование через Cache-Control и ETag ---
@app.get("/products/{product_id}")
def get_product(product_id: int, response: Response):
    data = {"id": product_id, "name": f"Товар {product_id}"}
    etag = hashlib.md5(str(data).encode()).hexdigest()[:16]

    response.headers["Cache-Control"] = "public, max-age=3600"
    response.headers["ETag"]           = f'"{etag}"'
    response.headers["Last-Modified"]  = "Mon, 25 May 2026 12:00:00 GMT"
    return data

# --- 2. Заголовки безопасности через middleware ---
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"]  = "nosniff"
    response.headers["X-Frame-Options"]         = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Request-Id"]            = str(time.time_ns())
    return response

# --- 3. Метрики производительности ---
@app.middleware("http")
async def timing_header(request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    response.headers["X-Process-Time"] = f"{elapsed * 1000:.2f}ms"
    return response

# --- 4. CORS-заголовки вручную (обычно через CORSMiddleware) ---
@app.get("/api/data")
def get_data(response: Response):
    response.headers["Access-Control-Allow-Origin"]  = "https://myfrontend.com"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST"
    return {"data": [1, 2, 3]}`,
    },

    {
        category: 'Response',
        name: 'response.media_type',
        description: 'MIME-тип содержимого ответа. Устанавливается через конструктор Response(media_type=...) и попадает в заголовок Content-Type. Если media_type содержит "text/", FastAPI автоматически добавляет кодировку: "text/html; charset=utf-8". При использовании Response как параметра — media_type недоступен для изменения, Content-Type устанавливается FastAPI по типу ответа.',
        syntax: `response.media_type`,
        arguments: [],
        example: `from fastapi import FastAPI, Response

app = FastAPI()

# --- Различные media_type ---
@app.get("/data/json-raw")
def raw_json():
    # Явный JSON без использования JSONResponse
    return Response(
        content='{"id": 1, "name": "Ноутбук"}',
        media_type="application/json",
    )

@app.get("/data/xml")
def xml_data():
    xml = """<?xml version="1.0" encoding="utf-8"?>
<product>
  <id>1</id>
  <name>Ноутбук</name>
  <price currency="RUB">99900</price>
</product>"""
    return Response(content=xml, media_type="application/xml")

@app.get("/data/text")
def plain_text():
    # Кодировка добавляется автоматически: text/plain; charset=utf-8
    return Response(content="Привет, мир!", media_type="text/plain")

@app.get("/data/yaml")
def yaml_data():
    yaml = "id: 1\\nname: Ноутбук\\nprice: 99900\\n"
    return Response(content=yaml, media_type="application/x-yaml")

@app.get("/image/svg")
def svg_image():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>'
    return Response(content=svg, media_type="image/svg+xml")

@app.get("/data/binary")
def binary_data():
    # Произвольные бинарные данные
    data = bytes(range(256))
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=data.bin"},
    )

# Чтение атрибута:
r = Response(content="test", media_type="text/plain")
print(r.media_type)   # "text/plain"`,
    },

    {
        category: 'Response',
        name: 'response.body',
        description: 'Тело HTTP-ответа в виде bytes. Вычисляется при обращении: вызывает метод render() объекта Response. Для базового Response — возвращает content, закодированный в bytes. Обычно не используется напрямую в обработчиках, но полезен для тестирования, логирования и middleware, которым нужно прочитать тело ответа.',
        syntax: `response.body`,
        arguments: [],
        example: `from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
import json

app = FastAPI()

@app.get("/items")
def list_items():
    return [{"id": 1, "name": "Ноутбук"}, {"id": 2, "name": "Мышь"}]

# --- 1. Чтение body у объекта Response ---
r = Response(content="Hello, мир!", media_type="text/plain")
print(r.body)                      # b'Hello, \xd0\xbc\xd0\xb8\xd1\x80!'
print(len(r.body))                 # размер в байтах
print(r.body.decode("utf-8"))      # Hello, мир!

# --- 2. JSONResponse.body ---
jr = JSONResponse(content={"ok": True, "value": 42})
print(jr.body)                     # b'{"ok":true,"value":42}'
data = json.loads(jr.body)        # {"ok": True, "value": 42}

# --- 3. Использование в тестах ---
client = TestClient(app)

def test_list_items():
    resp = client.get("/items")
    # TestClient возвращает httpx.Response, body доступен через .content
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2

# --- 4. Middleware, логирующий тело ответа (только для малых ответов) ---
@app.middleware("http")
async def log_response_body(request, call_next):
    response = await call_next(request)
    # Внимание: для StreamingResponse .body недоступен
    if hasattr(response, "body"):
        body = response.body
        if len(body) < 1024:
            print(f"Response body ({len(body)} bytes): {body[:200]}")
    return response`,
    },

    {
        category: 'Response',
        name: 'response.background',
        description: 'Фоновая задача BackgroundTask, выполняемая после отправки ответа клиенту. Клиент получает ответ немедленно, не ожидая завершения задачи. Используется для действий, не влияющих на ответ: отправка email, запись в БД, обновление кэша, отправка метрик. Задача выполняется в том же event loop, что и основное приложение — не в отдельном потоке (если не обёрнута в run_in_executor).',
        syntax: `response.background`,
        arguments: [],
        example: `from fastapi import FastAPI, Response, BackgroundTasks
from fastapi.responses import JSONResponse
from starlette.background import BackgroundTask, BackgroundTasks as StarletteBackgroundTasks
import time, smtplib

app = FastAPI()

# --- 1. BackgroundTask в конструкторе Response ---
def send_welcome_email(email: str, username: str):
    """Отправляется после того, как клиент получил ответ."""
    time.sleep(0.5)  # имитация SMTP
    print(f"Email отправлен на {email}: Добро пожаловать, {username}!")

@app.post("/users/register")
def register(username: str, email: str):
    task = BackgroundTask(send_welcome_email, email=email, username=username)
    return JSONResponse(
        content={"id": 1, "username": username, "status": "created"},
        status_code=201,
        background=task,
    )

# --- 2. BackgroundTasks через параметр обработчика (несколько задач) ---
def log_action(user_id: int, action: str):
    print(f"[log] user={user_id} action={action} time={time.time()}")

def invalidate_cache(key: str):
    print(f"[cache] invalidated: {key}")

def notify_admins(event: str):
    print(f"[notify] admins: {event}")

@app.delete("/items/{item_id}")
def delete_item(item_id: int, user_id: int, tasks: BackgroundTasks):
    tasks.add_task(log_action,      user_id, f"delete_item:{item_id}")
    tasks.add_task(invalidate_cache, f"items:{item_id}")
    tasks.add_task(notify_admins,    f"item {item_id} deleted by user {user_id}")
    return Response(status_code=204, background=tasks)  # type: ignore

# --- 3. Установка через атрибут ---
@app.post("/orders")
def create_order(product_id: int, response: Response):
    order_id = 99
    response.background = BackgroundTask(
        log_action, user_id=0, action=f"order:{order_id}"
    )
    return {"order_id": order_id, "product_id": product_id}

# Важно: задача выполняется в том же event loop
# Для тяжёлых синхронных операций используйте asyncio.get_event_loop().run_in_executor()`,
    },

    // ─── WebSocket ────────────────────────────────────────────────────────────
    {
        category: "WebSocket",
        name: "WebSocket()",
        description:
            "Класс для работы с WebSocket-соединениями в FastAPI. Представляет двустороннее постоянное соединение между клиентом и сервером. Маршрут объявляется декоратором @app.websocket(), а объект WebSocket передаётся в функцию как параметр. Соединение необходимо принять через accept() перед обменом данными и закрыть через close() по завершении.",
        syntax: `WebSocket(scope, receive, send)`,
        arguments: [
            {
                name: "scope",
                description:
                    "ASGI scope — словарь с метаданными соединения (тип, заголовки, путь и др.). Заполняется ASGI-сервером автоматически.",
            },
            {
                name: "receive",
                description:
                    "ASGI callable для получения входящих сообщений от клиента. Управляется сервером.",
            },
            {
                name: "send",
                description:
                    "ASGI callable для отправки сообщений клиенту. Управляется сервером.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"[{client_id}] получено: {data}")
    except WebSocketDisconnect:
        print(f"Клиент {client_id} отключился")`,
    },
    {
        category: "WebSocket",
        name: "websocket.url",
        description:
            "Полный URL WebSocket-соединения в виде объекта URL (из Starlette). Содержит все составляющие адреса: схему, хост, путь, строку запроса. Для доступа к отдельным частям используйте дочерние атрибуты: url.path, url.query, url.scheme и др.",
        syntax: `websocket.url`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    print(str(websocket.url))          # ws://localhost:8000/ws?token=abc
    print(websocket.url.path)          # /ws
    print(websocket.url.query)         # token=abc
    print(websocket.url.scheme)        # ws или wss
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.url.path",
        description:
            "Путь URL без хоста и строки запроса. Аналогичен request.url.path в обычных HTTP-запросах. Тип str.",
        syntax: `websocket.url.path`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/chat/{room}")
async def chat(websocket: WebSocket, room: str):
    await websocket.accept()
    # websocket.url.path → "/chat/general"
    await websocket.send_text(f"Подключились к комнате по пути: {websocket.url.path}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.url.query",
        description:
            "Строка запроса URL без знака «?». Тип str. Для удобного доступа к отдельным параметрам используйте websocket.query_params.",
        syntax: `websocket.url.query`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    # URL: ws://localhost/ws?token=abc&room=42
    print(websocket.url.query)         # token=abc&room=42
    print(websocket.query_params["token"])  # abc
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.url.scheme",
        description:
            "Схема протокола WebSocket-соединения. Возвращает \"ws\" для незащищённых соединений и \"wss\" для защищённых (TLS). Тип str.",
        syntax: `websocket.url.scheme`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    if websocket.url.scheme != "wss":
        await websocket.close(code=1008, reason="Требуется защищённое соединение (wss)")
        return
    await websocket.send_text("Соединение защищено")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.headers",
        description:
            "HTTP-заголовки рукопожатия (handshake) WebSocket-соединения. Объект типа Headers (из Starlette) — регистронезависимый, доступ по имени заголовка. Содержит стандартные заголовки: Host, Upgrade, Connection, Sec-WebSocket-Key и пользовательские заголовки клиента.",
        syntax: `websocket.headers`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    token = websocket.headers.get("authorization", "")
    user_agent = websocket.headers.get("user-agent", "unknown")
    print(f"User-Agent: {user_agent}")
    if not token.startswith("Bearer "):
        await websocket.close(code=1008, reason="Не авторизован")
        return
    await websocket.send_text("Добро пожаловать!")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.query_params",
        description:
            "Параметры строки запроса URL в виде объекта QueryParams (из Starlette). Поддерживает доступ по ключу, метод get() со значением по умолчанию и итерацию. Удобен для передачи токенов аутентификации и других параметров при установке соединения.",
        syntax: `websocket.query_params`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    # URL: ws://localhost/ws?token=secret&room=42
    token = websocket.query_params.get("token")
    room = websocket.query_params.get("room", "general")

    if token != "secret":
        await websocket.close(code=1008, reason="Неверный токен")
        return

    await websocket.accept()
    await websocket.send_text(f"Вы в комнате: {room}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.path_params",
        description:
            "Параметры пути URL, извлечённые из шаблона маршрута. Словарь {имя_параметра: значение}. Дублирует параметры, которые FastAPI также передаёт как аргументы функции маршрута.",
        syntax: `websocket.path_params`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/{room_id}/{user_id}")
async def ws(websocket: WebSocket, room_id: str, user_id: int):
    await websocket.accept()
    # Доступ через аргументы функции (рекомендуется):
    print(room_id, user_id)
    # Доступ через атрибут (альтернативно):
    print(websocket.path_params)  # {"room_id": "general", "user_id": "42"}
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.cookies",
        description:
            "Cookies, переданные клиентом при установке WebSocket-соединения. Словарь {имя: значение}. Могут использоваться для сессионной аутентификации, если cookie выставлен ранее HTTP-ответом.",
        syntax: `websocket.cookies`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    session_id = websocket.cookies.get("session_id")
    if not session_id:
        await websocket.close(code=1008, reason="Сессия не найдена")
        return
    await websocket.accept()
    await websocket.send_text(f"Сессия: {session_id}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.client",
        description:
            "Адрес клиента WebSocket-соединения. Объект типа Address с двумя атрибутами: host (IP-адрес клиента, str) и port (порт клиента, int). Может быть None, если сервер не предоставляет эту информацию.",
        syntax: `websocket.client`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

BANNED_IPS = {"192.168.1.100"}

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    if websocket.client and websocket.client.host in BANNED_IPS:
        await websocket.close(code=1008, reason="Доступ запрещён")
        return
    await websocket.accept()
    client_info = f"{websocket.client.host}:{websocket.client.port}" if websocket.client else "unknown"
    await websocket.send_text(f"Ваш адрес: {client_info}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.client.host",
        description:
            "IP-адрес клиента WebSocket-соединения в виде строки (например, \"127.0.0.1\" или \"::1\" для IPv6). Доступен через атрибут client объекта WebSocket. Тип str или None.",
        syntax: `websocket.client.host`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    ip = websocket.client.host if websocket.client else "unknown"
    logger.info(f"Новое WS-соединение от {ip}")
    await websocket.send_text(f"Ваш IP: {ip}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.client.port",
        description:
            "Порт клиента WebSocket-соединения. Тип int или None. Эфемерный порт, выделённый операционной системой клиента для данного TCP-соединения. Используется редко — в основном для диагностики и логирования.",
        syntax: `websocket.client.port`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    if websocket.client:
        info = f"{websocket.client.host}:{websocket.client.port}"
    else:
        info = "адрес неизвестен"
    await websocket.send_text(f"Подключено с: {info}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.state",
        description:
            "Объект для хранения произвольных данных, привязанных к конкретному WebSocket-соединению. Аналог request.state в HTTP-запросах. Атрибуты устанавливаются динамически и доступны на протяжении всей жизни соединения. Удобен для передачи данных между middleware и обработчиком.",
        syntax: `websocket.state`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# Установка данных в middleware (через ASGI напрямую):
@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    # Сохраняем данные пользователя в state
    websocket.state.user_id = 42
    websocket.state.role = "admin"

    print(websocket.state.user_id)  # 42
    print(websocket.state.role)     # admin

    await websocket.send_text(f"Роль: {websocket.state.role}")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "websocket.app",
        description:
            "Ссылка на ASGI-приложение FastAPI, обрабатывающее данное соединение. Тип Any. Даёт доступ к глобальному состоянию приложения (app.state), маршрутизатору и другим компонентам из контекста WebSocket-соединения.",
        syntax: `websocket.app`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()
app.state.connected_users: set[int] = set()

@app.websocket("/ws/{user_id}")
async def ws(websocket: WebSocket, user_id: int):
    await websocket.accept()
    # Доступ к глобальному состоянию приложения через websocket.app
    websocket.app.state.connected_users.add(user_id)
    try:
        while True:
            data = await websocket.receive_text()
            count = len(websocket.app.state.connected_users)
            await websocket.send_text(f"Онлайн: {count} | Сообщение: {data}")
    except Exception:
        websocket.app.state.connected_users.discard(user_id)`,
    },

    // ─── Безопасность ─────────────────────────────────────────────────────────
    {
        category: "Безопасность",
        name: "OAuth2()",
        description:
            "Базовый класс схемы безопасности OAuth2 для FastAPI. Используется как зависимость (Depends) и извлекает токен из заголовка Authorization. Служит основой для более специализированных классов OAuth2PasswordBearer и OAuth2AuthorizationCodeBearer. Описывает доступные OAuth2-потоки (flows) в схеме OpenAPI, что позволяет Swagger UI отображать кнопку авторизации.",
        syntax: `OAuth2(
    *,
    flows=OAuthFlows(),
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "flows",
                description:
                    "Объект OAuthFlows, описывающий один или несколько OAuth2-потоков (password, authorizationCode, clientCredentials, implicit). Определяет, как именно получается токен.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в схеме OpenAPI. По умолчанию — имя класса.",
            },
            {
                name: "description",
                description:
                    "Описание схемы безопасности, отображаемое в документации Swagger UI и ReDoc.",
            },
            {
                name: "auto_error",
                description:
                    "Если True (по умолчанию), автоматически возвращает 403, когда токен не найден. Если False — возвращает None, позволяя обработать отсутствие токена вручную.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, Security
from fastapi.security import OAuth2
from fastapi.security.oauth2 import OAuthFlows, OAuthFlowPassword

app = FastAPI()

# Кастомная OAuth2-схема с явным описанием потока
oauth2_scheme = OAuth2(
    flows=OAuthFlows(
        password=OAuthFlowPassword(tokenUrl="/auth/token")
    ),
    description="Bearer-токен, полученный через /auth/token",
)

@app.get("/me")
def get_me(token: str = Depends(oauth2_scheme)):
    # token содержит значение из заголовка Authorization: Bearer <token>
    return {"token": token}`,
    },
    {
        category: "Безопасность",
        name: "OAuth2PasswordBearer()",
        description:
            "Наиболее распространённая схема OAuth2 для FastAPI — реализует поток «Resource Owner Password». Используется как зависимость: извлекает Bearer-токен из заголовка Authorization и возвращает его строкой. Регистрирует URL получения токена в схеме OpenAPI, что позволяет Swagger UI выполнять авторизацию прямо из документации.",
        syntax: `OAuth2PasswordBearer(
    tokenUrl,
    *,
    scheme_name=None,
    scopes=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "tokenUrl",
                description:
                    "URL эндпоинта для получения токена (относительный или абсолютный). Например, \"/auth/token\". Отображается в Swagger UI для авторизации.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы в OpenAPI. По умолчанию — имя класса или переменной.",
            },
            {
                name: "scopes",
                description:
                    "Словарь {scope: описание} — области доступа OAuth2, доступные в этой схеме. Например, {\"read\": \"Чтение данных\", \"write\": \"Запись данных\"}.",
            },
            {
                name: "description",
                description:
                    "Описание схемы безопасности для документации.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 401, когда токен отсутствует. Если False — возвращает None (позволяет поддерживать необязательную аутентификацию).",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    scopes={"read": "Чтение данных", "write": "Запись данных"},
)

FAKE_USERS = {"alice": {"password": "secret", "name": "Alice"}}

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/auth/token", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = FAKE_USERS.get(form.username)
    if not user or user["password"] != form.password:
        raise HTTPException(status_code=401, detail="Неверные учётные данные")
    # В реальном приложении — генерируйте JWT
    return {"access_token": f"token-for-{form.username}", "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    # Здесь должна быть проверка и декодирование JWT
    if not token.startswith("token-for-"):
        raise HTTPException(status_code=401, detail="Недействительный токен")
    return {"username": token.replace("token-for-", "")}

@app.get("/users/me")
def read_me(user: dict = Depends(get_current_user)):
    return user`,
    },
    {
        category: "Безопасность",
        name: "OAuth2AuthorizationCodeBearer()",
        description:
            "Схема OAuth2 для потока Authorization Code — стандартного трёхстороннего OAuth2, используемого при интеграции со сторонними провайдерами (Google, GitHub, Microsoft и др.). Клиент перенаправляется на authorizationUrl для входа, получает code, обменивает его на токен через tokenUrl. FastAPI извлекает Bearer-токен из заголовка Authorization.",
        syntax: `OAuth2AuthorizationCodeBearer(
    authorizationUrl,
    tokenUrl,
    refreshUrl=None,
    scheme_name=None,
    scopes=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "authorizationUrl",
                description:
                    "URL страницы авторизации провайдера, на которую перенаправляется пользователь для входа. Например, \"https://accounts.google.com/o/oauth2/auth\".",
            },
            {
                name: "tokenUrl",
                description:
                    "URL для обмена кода авторизации на access-токен. Например, \"https://oauth2.googleapis.com/token\".",
            },
            {
                name: "refreshUrl",
                description:
                    "URL для обновления истёкшего access-токена с помощью refresh-токена. Тип str или None.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы в OpenAPI. По умолчанию — имя переменной или класса.",
            },
            {
                name: "scopes",
                description:
                    "Словарь {scope: описание} — области доступа OAuth2. Например, {\"openid\": \"OpenID Connect\", \"email\": \"Доступ к email\"}.",
            },
            {
                name: "description",
                description:
                    "Описание схемы безопасности для документации.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 401 при отсутствии токена. Если False — возвращает None.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2AuthorizationCodeBearer

app = FastAPI()

# Интеграция с GitHub OAuth2
github_oauth2 = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://github.com/login/oauth/authorize",
    tokenUrl="https://github.com/login/oauth/access_token",
    scopes={
        "read:user": "Чтение профиля пользователя",
        "user:email": "Доступ к email пользователя",
    },
    description="GitHub OAuth2 Authorization Code Flow",
)

async def get_github_user(token: str = Depends(github_oauth2)):
    # Используем токен для запроса к GitHub API
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Недействительный GitHub-токен")
    return resp.json()

@app.get("/github/me")
async def github_profile(user: dict = Depends(get_github_user)):
    return {"login": user["login"], "name": user.get("name"), "email": user.get("email")}`,
    },

    {
        category: "Безопасность",
        name: "OAuth2PasswordRequestForm()",
        description:
            "Зависимость для разбора тела запроса на получение токена в формате application/x-www-form-urlencoded (стандарт OAuth2). Используется как параметр эндпоинта /token — FastAPI автоматически извлекает и валидирует поля формы. grant_type необязателен и принимает любое значение (в отличие от строгой версии).",
        syntax: `OAuth2PasswordRequestForm(
    *,
    grant_type=None,
    username,
    password,
    scope="",
    client_id=None,
    client_secret=None,
)`,
        arguments: [
            {
                name: "grant_type",
                description:
                    "Тип предоставления OAuth2. Необязателен — принимает любое строковое значение или None. Для строгой проверки (только \"password\") используйте OAuth2PasswordRequestFormStrict.",
            },
            {
                name: "username",
                description:
                    "Имя пользователя из тела формы. Обязательное поле.",
            },
            {
                name: "password",
                description:
                    "Пароль пользователя из тела формы. Обязательное поле.",
            },
            {
                name: "scope",
                description:
                    "Строка запрашиваемых областей доступа, разделённых пробелом (например, \"read write\"). Доступна как список через атрибут form.scopes. По умолчанию пустая строка.",
            },
            {
                name: "client_id",
                description:
                    "Идентификатор клиента OAuth2 (опционально). Передаётся, если авторизация выполняется от имени OAuth2-клиента, а не напрямую пользователем.",
            },
            {
                name: "client_secret",
                description:
                    "Секрет клиента OAuth2 (опционально). Используется совместно с client_id для аутентификации OAuth2-клиента.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

FAKE_USERS = {
    "alice": {"password": "wonderland", "scopes": ["read", "write"]},
    "bob":   {"password": "builder",    "scopes": ["read"]},
}

@app.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = FAKE_USERS.get(form.username)
    if not user or user["password"] != form.password:
        raise HTTPException(status_code=400, detail="Неверные учётные данные")

    # form.scopes — список запрошенных областей доступа
    granted = [s for s in form.scopes if s in user["scopes"]]
    return {
        "access_token": f"token-{form.username}",
        "token_type": "bearer",
        "scope": " ".join(granted),
    }

@app.get("/me")
def read_me(token: str = Depends(oauth2_scheme)):
    return {"token": token}`,
    },
    {
        category: "Безопасность",
        name: "OAuth2PasswordRequestFormStrict()",
        description:
            "Строгая версия OAuth2PasswordRequestForm. Отличается тем, что поле grant_type обязательно и должно иметь точное значение \"password\" (валидируется через Pydantic). Соответствует спецификации OAuth2 RFC 6749 — используется, когда важна строгая совместимость со стандартом.",
        syntax: `OAuth2PasswordRequestFormStrict(
    *,
    grant_type,
    username,
    password,
    scope="",
    client_id=None,
    client_secret=None,
)`,
        arguments: [
            {
                name: "grant_type",
                description:
                    "Тип предоставления OAuth2. Обязательное поле. Должно быть строго равно \"password\" — любое другое значение вызовет ошибку валидации 422.",
            },
            {
                name: "username",
                description:
                    "Имя пользователя из тела формы. Обязательное поле.",
            },
            {
                name: "password",
                description:
                    "Пароль пользователя из тела формы. Обязательное поле.",
            },
            {
                name: "scope",
                description:
                    "Строка запрашиваемых областей доступа, разделённых пробелом. Доступна как список через form.scopes. По умолчанию пустая строка.",
            },
            {
                name: "client_id",
                description:
                    "Идентификатор OAuth2-клиента. Опциональный параметр.",
            },
            {
                name: "client_secret",
                description:
                    "Секрет OAuth2-клиента. Опциональный параметр.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.oauth2 import OAuth2PasswordRequestFormStrict

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

@app.post("/token")
def strict_login(form: OAuth2PasswordRequestFormStrict = Depends()):
    # grant_type гарантированно равен "password"
    # Запрос без grant_type="password" вернёт 422 автоматически
    if form.username != "admin" or form.password != "secret":
        raise HTTPException(status_code=400, detail="Неверные учётные данные")
    return {
        "access_token": "admin-token",
        "token_type": "bearer",
        "grant_type_received": form.grant_type,  # всегда "password"
    }

# Запрос с grant_type="client_credentials" → 422 Unprocessable Entity
# Запрос с grant_type="password" и верными данными → токен`,
    },
    {
        category: "Безопасность",
        name: "HTTPBasic()",
        description:
            "Схема HTTP Basic Authentication. Извлекает имя пользователя и пароль из заголовка Authorization: Basic <base64(username:password)> и возвращает объект HTTPBasicCredentials с полями username и password. При отсутствии заголовка браузер показывает встроенный диалог входа. Подходит для простой защиты внутренних инструментов и admin-панелей.",
        syntax: `HTTPBasic(
    *,
    scheme_name=None,
    realm=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя класса.",
            },
            {
                name: "realm",
                description:
                    "Область защиты (realm) для заголовка WWW-Authenticate. Отображается браузером в диалоге входа. Тип str или None.",
            },
            {
                name: "description",
                description:
                    "Описание схемы безопасности для документации Swagger UI и ReDoc.",
            },
            {
                name: "auto_error",
                description:
                    "Если True (по умолчанию) — возвращает 401 с заголовком WWW-Authenticate при отсутствии учётных данных. Если False — возвращает None.",
            },
        ],
        example: `import secrets
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

app = FastAPI()
security = HTTPBasic(realm="Панель администратора")

VALID_USERS = {
    "admin": "supersecret",
    "viewer": "readonly123",
}

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    stored_password = VALID_USERS.get(credentials.username)
    # secrets.compare_digest защищает от timing attacks
    password_ok = stored_password is not None and secrets.compare_digest(
        credentials.password.encode(), stored_password.encode()
    )
    if not password_ok:
        raise HTTPException(
            status_code=401,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Basic realm=\"Панель администратора\""},
        )
    return credentials.username

@app.get("/admin/stats")
def admin_stats(user: str = Depends(get_current_user)):
    return {"user": user, "stats": {"requests": 1024, "errors": 3}}`,
    },

    {
        category: "Безопасность",
        name: "HTTPBearer()",
        description:
            "Схема HTTP Bearer Authentication. Извлекает Bearer-токен из заголовка Authorization: Bearer <token> и возвращает объект HTTPAuthorizationCredentials с полями scheme и credentials. Наиболее распространённый способ передачи JWT-токенов в REST API. При отсутствии или некорректном формате заголовка — возвращает 403 (auto_error=True).",
        syntax: `HTTPBearer(
    *,
    bearerFormat=None,
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "bearerFormat",
                description:
                    "Hint для клиентов о формате Bearer-токена, например \"JWT\". Используется только в документации OpenAPI, не влияет на логику валидации.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя класса.",
            },
            {
                name: "description",
                description:
                    "Описание схемы для документации Swagger UI и ReDoc.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 403 при отсутствии или неверном формате заголовка Authorization. Если False — возвращает None (необязательная аутентификация).",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  # pip install pyjwt

app = FastAPI()
bearer = HTTPBearer(bearerFormat="JWT", description="JWT access token")

SECRET = "super-secret"

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(creds.credentials, SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен истёк")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Недействительный токен")

@app.get("/profile")
def profile(user: dict = Depends(get_current_user)):
    return {"user_id": user.get("sub"), "email": user.get("email")}`,
    },
    {
        category: "Безопасность",
        name: "HTTPDigest()",
        description:
            "Схема HTTP Digest Authentication. Указывает, что API использует Digest-аутентификацию (RFC 7616) — более безопасный вариант Basic Auth с хешированием пароля. FastAPI регистрирует схему в OpenAPI, но сам не реализует challenge-response — это обычно выполняется на уровне сервера или middleware. Используется редко.",
        syntax: `HTTPDigest(
    *,
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя класса.",
            },
            {
                name: "description",
                description:
                    "Описание схемы для документации.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 403 при отсутствии заголовка Authorization. Если False — возвращает None.",
            },
        ],
        example: `from fastapi import FastAPI, Depends
from fastapi.security import HTTPDigest, HTTPAuthorizationCredentials

app = FastAPI()
digest = HTTPDigest(description="HTTP Digest Authentication (RFC 7616)")

@app.get("/secure")
def secure_resource(creds: HTTPAuthorizationCredentials = Depends(digest)):
    # creds.scheme == "digest"
    # creds.credentials содержит raw значение заголовка Authorization
    # Реальная проверка Digest выполняется на уровне сервера/прокси
    return {"scheme": creds.scheme}`,
    },
    {
        category: "Безопасность",
        name: "HTTPAuthorizationCredentials()",
        description:
            "Модель данных, возвращаемая схемами HTTPBearer, HTTPBasic и HTTPDigest при успешном извлечении учётных данных из заголовка Authorization. Содержит два поля: scheme (название схемы, например \"bearer\" или \"basic\") и credentials (значение после схемы — сам токен или base64-строка).",
        syntax: `HTTPAuthorizationCredentials(scheme, credentials)`,
        arguments: [
            {
                name: "scheme",
                description:
                    "Название схемы аутентификации из заголовка Authorization. Например: \"bearer\", \"basic\", \"digest\". Тип str.",
            },
            {
                name: "credentials",
                description:
                    "Значение учётных данных — всё, что следует после названия схемы в заголовке. Для Bearer — сам токен, для Basic — base64-строка \"username:password\". Тип str.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64

app = FastAPI()
bearer = HTTPBearer()

@app.get("/token-info")
def token_info(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    # creds.scheme    → "bearer"
    # creds.credentials → "<raw_token_string>"
    return {
        "scheme": creds.scheme,
        "token_preview": creds.credentials[:10] + "...",
    }

# Пример с Basic для декодирования вручную
from fastapi.security import HTTPBasic
basic = HTTPBasic()

@app.get("/basic-info")
def basic_info(creds: HTTPAuthorizationCredentials = Depends(basic)):
    # creds.scheme      → "basic"
    # creds.credentials → "YWxpY2U6c2VjcmV0"  (base64)
    decoded = base64.b64decode(creds.credentials).decode()
    username, _, password = decoded.partition(":")
    return {"username": username}`,
    },
    {
        category: "Безопасность",
        name: "APIKeyQuery()",
        description:
            "Схема аутентификации по API-ключу, передаваемому в параметре строки запроса URL. Используется как зависимость: извлекает значение параметра с заданным именем и возвращает его строкой. Если ключ отсутствует — возвращает 403 (auto_error=True). Менее безопасен, чем APIKeyHeader, так как ключ может попасть в логи сервера и историю браузера.",
        syntax: `APIKeyQuery(
    *,
    name,
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "name",
                description:
                    "Имя параметра строки запроса, содержащего API-ключ. Например, \"api_key\" или \"token\". Обязательный параметр.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя переменной.",
            },
            {
                name: "description",
                description:
                    "Описание схемы для документации.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 403 при отсутствии ключа. Если False — возвращает None.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyQuery

app = FastAPI()

API_KEYS = {"key-abc-123", "key-xyz-789"}

api_key_query = APIKeyQuery(name="api_key", description="API-ключ в строке запроса")

def verify_key(key: str = Security(api_key_query)):
    if key not in API_KEYS:
        raise HTTPException(status_code=403, detail="Недействительный API-ключ")
    return key

@app.get("/data")
def get_data(key: str = Depends(verify_key)):
    return {"data": "секретные данные", "key_used": key[:4] + "..."}

# GET /data?api_key=key-abc-123  →  200
# GET /data                      →  403`,
    },
    {
        category: "Безопасность",
        name: "APIKeyHeader()",
        description:
            "Схема аутентификации по API-ключу, передаваемому в HTTP-заголовке. Предпочтительнее APIKeyQuery — ключ не попадает в URL, логи и историю браузера. Используется как зависимость: извлекает значение заголовка с заданным именем. Типичные имена заголовков: X-API-Key, Authorization, X-Token.",
        syntax: `APIKeyHeader(
    *,
    name,
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "name",
                description:
                    "Имя HTTP-заголовка, содержащего API-ключ. Например, \"X-API-Key\" или \"X-Token\". Обязательный параметр.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя переменной.",
            },
            {
                name: "description",
                description:
                    "Описание схемы для документации Swagger UI и ReDoc.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 403 при отсутствии заголовка. Если False — возвращает None.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

app = FastAPI()

API_KEYS = {"prod-key-abc": "service-a", "prod-key-xyz": "service-b"}

api_key_header = APIKeyHeader(
    name="X-API-Key",
    description="API-ключ в заголовке X-API-Key",
)

def get_service(key: str = Security(api_key_header)):
    service = API_KEYS.get(key)
    if not service:
        raise HTTPException(status_code=403, detail="Недействительный API-ключ")
    return service

@app.get("/api/resource")
def get_resource(service: str = Depends(get_service)):
    return {"resource": "данные", "accessed_by": service}

# curl -H "X-API-Key: prod-key-abc" http://localhost:8000/api/resource`,
    },
    {
        category: "Безопасность",
        name: "APIKeyCookie()",
        description:
            "Схема аутентификации по API-ключу, хранящемуся в cookie. Используется как зависимость: извлекает значение cookie с заданным именем. Удобна для веб-приложений, где ключ выставляется сервером при входе и автоматически передаётся браузером при каждом запросе. Для защиты от CSRF следует комбинировать с SameSite и CSRF-токеном.",
        syntax: `APIKeyCookie(
    *,
    name,
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "name",
                description:
                    "Имя cookie, содержащего API-ключ или токен сессии. Например, \"access_token\" или \"session\". Обязательный параметр.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя переменной.",
            },
            {
                name: "description",
                description:
                    "Описание схемы для документации.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 403 при отсутствии cookie. Если False — возвращает None.",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException, Response, Security
from fastapi.security import APIKeyCookie

app = FastAPI()

SESSIONS: dict[str, str] = {}  # token → username

cookie_scheme = APIKeyCookie(name="access_token", description="Токен в cookie access_token")

def get_current_user(token: str = Security(cookie_scheme)):
    username = SESSIONS.get(token)
    if not username:
        raise HTTPException(status_code=403, detail="Сессия не найдена или истекла")
    return username

@app.post("/login")
def login(response: Response, username: str, password: str):
    if password != "secret":
        raise HTTPException(status_code=401, detail="Неверный пароль")
    token = f"tok-{username}-xyz"
    SESSIONS[token] = username
    response.set_cookie("access_token", token, httponly=True, samesite="lax")
    return {"status": "logged in"}

@app.get("/dashboard")
def dashboard(user: str = Depends(get_current_user)):
    return {"welcome": user}

@app.post("/logout")
def logout(response: Response, user: str = Depends(get_current_user)):
    response.delete_cookie("access_token")
    return {"status": "logged out"}`,
    },

    {
        category: "Безопасность",
        name: "OpenIdConnect()",
        description:
            "Схема безопасности OpenID Connect (OIDC) — надстройка над OAuth2, добавляющая стандартизированную аутентификацию личности через id_token (JWT). FastAPI регистрирует URL конфигурации провайдера (discovery endpoint) в схеме OpenAPI. Извлекает Bearer-токен из заголовка Authorization и возвращает его строкой. Используется с провайдерами Auth0, Keycloak, Google Identity, Azure AD и др.",
        syntax: `OpenIdConnect(
    *,
    openIdConnectUrl,
    scheme_name=None,
    description=None,
    auto_error=True,
)`,
        arguments: [
            {
                name: "openIdConnectUrl",
                description:
                    "URL OpenID Connect discovery-документа провайдера (/.well-known/openid-configuration). Например, \"https://accounts.google.com/.well-known/openid-configuration\" или \"https://my-app.auth0.com/.well-known/openid-configuration\". FastAPI включает этот URL в схему OpenAPI.",
            },
            {
                name: "scheme_name",
                description:
                    "Имя схемы безопасности в OpenAPI. По умолчанию — имя переменной или класса.",
            },
            {
                name: "description",
                description:
                    "Описание схемы для документации Swagger UI и ReDoc.",
            },
            {
                name: "auto_error",
                description:
                    "Если True — возвращает 403 при отсутствии заголовка Authorization. Если False — возвращает None (необязательная аутентификация).",
            },
        ],
        example: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OpenIdConnect
import httpx
import jwt  # pip install pyjwt[crypto]

app = FastAPI()

# Keycloak как OIDC-провайдер
oidc = OpenIdConnect(
    openIdConnectUrl=(
        "https://keycloak.example.com/realms/myrealm"
        "/.well-known/openid-configuration"
    ),
    description="Keycloak OpenID Connect",
)

OIDC_ISSUER = "https://keycloak.example.com/realms/myrealm"
AUDIENCE    = "my-fastapi-app"

async def get_oidc_public_keys():
    """Загружает публичные ключи провайдера через JWKS URI."""
    async with httpx.AsyncClient() as client:
        cfg  = (await client.get(f"{OIDC_ISSUER}/.well-known/openid-configuration")).json()
        keys = (await client.get(cfg["jwks_uri"])).json()
    return keys

async def get_current_user(token: str = Depends(oidc)):
    try:
        # Получаем JWKS и декодируем id_token / access_token
        jwks = await get_oidc_public_keys()
        signing_key = jwt.PyJWKClient(
            f"{OIDC_ISSUER}/protocol/openid-connect/certs"
        ).get_signing_key_from_jwt(token).key

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=AUDIENCE,
            issuer=OIDC_ISSUER,
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен истёк")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Недействительный токен: {e}")

@app.get("/me")
async def read_me(user: dict = Depends(get_current_user)):
    return {
        "sub":   user.get("sub"),
        "email": user.get("email"),
        "name":  user.get("name"),
        "roles": user.get("realm_access", {}).get("roles", []),
    }`,
    },

    // ─── Middleware ───────────────────────────────────────────────────────────
    {
        category: "Middleware",
        name: "CORSMiddleware()",
        description:
            "Middleware для настройки политики Cross-Origin Resource Sharing (CORS). Управляет тем, каким доменам, методам и заголовкам разрешено обращаться к API из браузера. Необходим при работе фронтенда на одном домене, а API — на другом. Подключается через app.add_middleware().",
        syntax: `CORSMiddleware(
    app,
    allow_origins=(),
    allow_methods=("GET",),
    allow_headers=(),
    allow_credentials=False,
    allow_origin_regex=None,
    expose_headers=(),
    max_age=600,
)`,
        arguments: [
            {
                name: "app",
                description:
                    "ASGI-приложение. Передаётся автоматически при использовании app.add_middleware().",
            },
            {
                name: "allow_origins",
                description:
                    "Список разрешённых источников (origins), например [\"https://example.com\"]. Используйте [\"*\"] для разрешения всех источников (не совместимо с allow_credentials=True).",
            },
            {
                name: "allow_methods",
                description:
                    "Список разрешённых HTTP-методов, например [\"GET\", \"POST\", \"PUT\", \"DELETE\"]. [\"*\"] разрешает все методы. По умолчанию только [\"GET\"].",
            },
            {
                name: "allow_headers",
                description:
                    "Список разрешённых заголовков запроса, например [\"Authorization\", \"Content-Type\"]. [\"*\"] разрешает все заголовки. По умолчанию пусто.",
            },
            {
                name: "allow_credentials",
                description:
                    "Разрешить передачу cookies и заголовков авторизации (credentials). При True нельзя использовать allow_origins=[\"*\"] — необходимо указывать конкретные домены. По умолчанию False.",
            },
            {
                name: "allow_origin_regex",
                description:
                    "Регулярное выражение для динамического сопоставления источников, например r\"https://.*\\.example\\.com\". Применяется в дополнение к allow_origins.",
            },
            {
                name: "expose_headers",
                description:
                    "Заголовки ответа, которые браузер должен сделать доступными для JavaScript-кода. По умолчанию браузер скрывает большинство заголовков ответа.",
            },
            {
                name: "max_age",
                description:
                    "Время кэширования preflight-ответа браузером в секундах. По умолчанию 600 (10 минут).",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # локальный фронтенд
        "https://myapp.com",       # продакшн фронтенд
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    allow_credentials=True,
    expose_headers=["X-Total-Count", "X-Request-ID"],
    max_age=3600,
)

@app.get("/api/data")
def get_data():
    return {"data": "Доступно с разрешённых источников"}`,
    },
    {
        category: "Middleware",
        name: "GZipMiddleware()",
        description:
            "Middleware для автоматического сжатия HTTP-ответов алгоритмом GZip. Применяется только если клиент поддерживает сжатие (заголовок Accept-Encoding: gzip) и размер ответа превышает minimum_size. Существенно сокращает объём передаваемых данных для текстовых ответов (JSON, HTML, CSS).",
        syntax: `GZipMiddleware(app, minimum_size=500, compresslevel=9)`,
        arguments: [
            {
                name: "app",
                description:
                    "ASGI-приложение. Передаётся автоматически при использовании app.add_middleware().",
            },
            {
                name: "minimum_size",
                description:
                    "Минимальный размер ответа в байтах, при котором применяется сжатие. Ответы меньше этого размера передаются без сжатия. По умолчанию 500.",
            },
            {
                name: "compresslevel",
                description:
                    "Уровень сжатия GZip от 1 (быстрее, хуже) до 9 (медленнее, лучше). По умолчанию 9.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()

# Сжимать ответы размером от 1 КБ
app.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=6)

@app.get("/data/large")
def large_response():
    # Большой JSON-ответ будет автоматически сжат
    return {"items": [{"id": i, "value": f"item_{i}"} for i in range(1000)]}`,
    },
    {
        category: "Middleware",
        name: "HTTPSRedirectMiddleware()",
        description:
            "Middleware, которое автоматически перенаправляет все HTTP-запросы на HTTPS (301 Permanent Redirect), а WS — на WSS. Обеспечивает обязательное использование защищённого соединения в продакшне. Рекомендуется использовать только в боевом окружении — в разработке с localhost HTTPS обычно не настроен.",
        syntax: `HTTPSRedirectMiddleware(app)`,
        arguments: [
            {
                name: "app",
                description:
                    "ASGI-приложение. Передаётся автоматически при использовании app.add_middleware().",
            },
        ],
        example: `import os
from fastapi import FastAPI
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Включаем только в продакшне
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

@app.get("/")
def root():
    return {"message": "Безопасное соединение"}

# HTTP GET http://myapp.com/  →  301  →  https://myapp.com/`,
    },
    {
        category: "Middleware",
        name: "TrustedHostMiddleware()",
        description:
            "Middleware для защиты от атак подмены заголовка Host (Host Header Injection). Проверяет, что заголовок Host входящего запроса совпадает с одним из разрешённых хостов. Запросы с недопустимым Host-заголовком отклоняются ответом 400 Bad Request.",
        syntax: `TrustedHostMiddleware(app, allowed_hosts=None, www_redirect=True)`,
        arguments: [
            {
                name: "app",
                description:
                    "ASGI-приложение. Передаётся автоматически при использовании app.add_middleware().",
            },
            {
                name: "allowed_hosts",
                description:
                    "Список допустимых значений заголовка Host. Поддерживает wildcard-домены: \"*.example.com\" разрешает любые поддомены. None или [\"*\"] — пропустить проверку (не рекомендуется в продакшне).",
            },
            {
                name: "www_redirect",
                description:
                    "Если True, запросы к example.com автоматически перенаправляются на www.example.com (при наличии в allowed_hosts). По умолчанию True.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "myapp.com",
        "www.myapp.com",
        "*.myapp.com",    # все поддомены
        "localhost",      # для локальной разработки
    ],
    www_redirect=True,
)

@app.get("/")
def root():
    return {"host": "проверен и допустим"}

# Запрос с Host: evil.com → 400 Bad Request`,
    },
    {
        category: "Middleware",
        name: "SessionMiddleware()",
        description:
            "Middleware для работы с серверными сессиями на основе подписанных cookie. Хранит данные сессии в зашифрованном cookie на стороне клиента (не в БД). Данные доступны через request.session — обычный dict. Требует установки пакета itsdangerous. Подходит для небольшого объёма данных сессии.",
        syntax: `SessionMiddleware(
    app,
    secret_key,
    session_cookie="session",
    max_age=14 * 24 * 60 * 60,
    same_site="lax",
    https_only=False,
    path="/",
)`,
        arguments: [
            {
                name: "secret_key",
                description:
                    "Секретный ключ для подписи cookie. Обязательный параметр. Должен быть длинным случайным значением, хранящимся в переменных окружения. Компрометация ключа позволяет подделать сессию.",
            },
            {
                name: "session_cookie",
                description:
                    "Имя cookie сессии. По умолчанию \"session\".",
            },
            {
                name: "max_age",
                description:
                    "Время жизни cookie сессии в секундах. По умолчанию 14 дней (14 * 24 * 60 * 60).",
            },
            {
                name: "same_site",
                description:
                    "Политика SameSite cookie: \"lax\" (по умолчанию) — защита от CSRF при переходах, \"strict\" — максимальная защита, \"none\" — разрешить кросс-сайтовые запросы (требует https_only=True).",
            },
            {
                name: "https_only",
                description:
                    "Если True, устанавливает флаг Secure на cookie — браузер отправляет её только по HTTPS. По умолчанию False.",
            },
            {
                name: "path",
                description:
                    "Путь, для которого действует cookie сессии. По умолчанию \"/\" — весь сайт.",
            },
        ],
        example: `import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ["SESSION_SECRET_KEY"],
    session_cookie="app_session",
    max_age=3600,          # 1 час
    same_site="lax",
    https_only=True,       # только HTTPS в продакшне
)

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    if data.get("password") == "secret":
        request.session["user_id"] = 42
        request.session["role"] = "admin"
        return {"status": "logged in"}
    return JSONResponse({"error": "Неверный пароль"}, status_code=401)

@app.get("/profile")
def profile(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        return JSONResponse({"error": "Не авторизован"}, status_code=401)
    return {"user_id": user_id, "role": request.session.get("role")}

@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "logged out"}`,
    },

    // ─── Исключения ───────────────────────────────────────────────────────────
    {
        category: "Исключения",
        name: "HTTPException()",
        description:
            "Стандартное исключение FastAPI для возврата HTTP-ошибок клиенту. При выбросе прерывает выполнение обработчика и отправляет JSON-ответ с указанным статус-кодом и описанием ошибки. Может быть перехвачено кастомным обработчиком через @app.exception_handler(HTTPException).",
        syntax: `HTTPException(status_code, detail=None, headers=None)`,
        arguments: [
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ошибки (например, 400, 401, 403, 404, 422, 500). Обязательный параметр.",
            },
            {
                name: "detail",
                description:
                    "Описание ошибки, включаемое в тело ответа в поле detail. Может быть строкой, словарём, списком или любым JSON-сериализуемым объектом. По умолчанию None.",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ с ошибкой. Полезен для WWW-Authenticate при ошибке 401.",
            },
        ],
        example: `from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer

app = FastAPI()
security = HTTPBearer()

fake_db = {1: {"name": "Widget"}, 2: {"name": "Gadget"}}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in fake_db:
        raise HTTPException(
            status_code=404,
            detail=f"Товар с id={item_id} не найден",
        )
    return fake_db[item_id]

@app.get("/secure")
def secure_route(token: str = Depends(security)):
    if token.credentials != "secret":
        raise HTTPException(
            status_code=401,
            detail="Неверный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access": "granted"}

# Кастомный обработчик HTTPException
from fastapi.requests import Request
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "path": request.url.path},
    )`,
    },
    {
        category: "Исключения",
        name: "RequestValidationError()",
        description:
            "Исключение, автоматически выбрасываемое FastAPI при несоответствии входящих данных запроса объявленным Pydantic-схемам. Содержит подробный список ошибок валидации с указанием поля, типа ошибки и сообщения. По умолчанию возвращает ответ 422 Unprocessable Entity. Может быть перехвачено через @app.exception_handler(RequestValidationError) для кастомизации формата ошибок.",
        syntax: `RequestValidationError(errors, *, body=None)`,
        arguments: [
            {
                name: "errors",
                description:
                    "Список ошибок валидации от Pydantic. Каждая ошибка — словарь с ключами loc (расположение поля), msg (сообщение), type (тип ошибки) и input (переданное значение).",
            },
            {
                name: "body",
                description:
                    "Тело запроса, вызвавшее ошибку валидации. Тип Any или None. Доступно в обработчике исключений для логирования или диагностики.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    quantity: int

@app.post("/items")
def create_item(item: Item):
    return item

# Кастомный обработчик — упрощённый формат ошибок
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {
            "field": " -> ".join(str(loc) for loc in err["loc"]),
            "message": err["msg"],
            "type": err["type"],
        }
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"validation_errors": errors, "body": str(exc.body)},
    )

# POST /items с телом {"name": 123, "price": "не число"}
# Вернёт кастомный формат ошибок вместо стандартного`,
    },
    {
        category: "Исключения",
        name: "ResponseValidationError()",
        description:
            "Исключение, выбрасываемое FastAPI при несоответствии данных, возвращаемых обработчиком маршрута, объявленной response_model. В отличие от RequestValidationError (ошибка входных данных), это ошибка исходящих данных — сервер пытается вернуть невалидный ответ. По умолчанию приводит к 500 Internal Server Error.",
        syntax: `ResponseValidationError(errors, *, body=None)`,
        arguments: [
            {
                name: "errors",
                description:
                    "Список ошибок валидации Pydantic для исходящих данных. Каждая ошибка содержит loc, msg, type и input.",
            },
            {
                name: "body",
                description:
                    "Тело ответа, которое не прошло валидацию. Доступно в обработчике для диагностики.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.exceptions import ResponseValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

class UserOut(BaseModel):
    id: int
    name: str
    email: str  # обязательное поле в response_model

@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int):
    # email отсутствует — вызовет ResponseValidationError
    return {"id": user_id, "name": "Alice"}

# Кастомный обработчик ошибок валидации ответа
@app.exception_handler(ResponseValidationError)
async def response_validation_handler(request: Request, exc: ResponseValidationError):
    # Логируем ошибку и возвращаем 500
    return JSONResponse(
        status_code=500,
        content={
            "error": "Внутренняя ошибка сервера: невалидный ответ",
            "details": str(exc.errors()),
        },
    )`,
    },
    {
        category: "Исключения",
        name: "WebSocketException()",
        description:
            "Исключение для отклонения WebSocket-соединения на этапе рукопожатия (handshake) до вызова accept(). В отличие от WebSocketDisconnect (отключение уже принятого клиента), WebSocketException позволяет отказать в установке соединения с конкретным кодом закрытия. Обрабатывается через @app.exception_handler(WebSocketException).",
        syntax: `WebSocketException(code, reason=None)`,
        arguments: [
            {
                name: "code",
                description:
                    "Код закрытия WebSocket (RFC 6455). Обязательный параметр. Например: 1008 — нарушение политики (Policy Violation), 1011 — внутренняя ошибка сервера.",
            },
            {
                name: "reason",
                description:
                    "Текстовое описание причины отклонения соединения. Тип str или None.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketState
from fastapi.exceptions import WebSocketException
from fastapi.requests import Request
from fastapi.responses import JSONResponse

app = FastAPI()

def get_token_from_ws(websocket: WebSocket) -> str:
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketException(
            code=1008,
            reason="Токен авторизации не передан",
        )
    return token

@app.websocket("/ws/secure")
async def ws_secure(websocket: WebSocket):
    token = get_token_from_ws(websocket)  # выбросит WebSocketException если нет токена
    await websocket.accept()
    await websocket.send_text(f"Добро пожаловать, токен: {token}")
    await websocket.close()

# Кастомный обработчик
@app.exception_handler(WebSocketException)
async def ws_exception_handler(request: Request, exc: WebSocketException):
    # Здесь можно логировать отклонённые соединения
    return JSONResponse(
        status_code=403,
        content={"code": exc.code, "reason": exc.reason},
    )`,
    },

    // ─── WebSocketDisconnect ──────────────────────────────────────────────────
    {
        category: "WebSocket",
        name: "WebSocketDisconnect()",
        description:
            "Исключение, выбрасываемое FastAPI при разрыве WebSocket-соединения со стороны клиента. Перехватывается через try/except для корректной обработки отключения: освобождения ресурсов, обновления списка активных пользователей, логирования. Содержит код закрытия и необязательное сообщение.",
        syntax: `WebSocketDisconnect(code=1000, reason=None)`,
        arguments: [
            {
                name: "code",
                description:
                    "Код закрытия WebSocket (RFC 6455), переданный клиентом. 1000 — нормальное закрытие, 1001 — клиент уходит (закрытие вкладки/браузера), 1006 — аномальное закрытие без фрейма Close. По умолчанию 1000.",
            },
            {
                name: "reason",
                description:
                    "Текстовое сообщение, поясняющее причину отключения. Тип str или None. Предоставляется клиентом и может быть пустым.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# Хранилище активных соединений
active_connections: dict[int, WebSocket] = {}

@app.websocket("/ws/{user_id}")
async def ws(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Получено: {data}")
    except WebSocketDisconnect as exc:
        # Обработка отключения с доступом к коду и причине
        print(f"Пользователь {user_id} отключился: код={exc.code}, причина={exc.reason!r}")
        active_connections.pop(user_id, None)`,
    },
    {
        category: "WebSocket",
        name: "websocket_disconnect.code",
        description:
            "Код закрытия WebSocket-соединения, переданный клиентом при отключении. Тип int. Доступен в блоке except WebSocketDisconnect as exc через exc.code. Позволяет различать нормальное закрытие (1000), уход клиента (1001) и аномальные обрывы (1006).",
        syntax: `websocket_disconnect.code`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect as exc:
        if exc.code == 1000:
            print("Нормальное закрытие")
        elif exc.code == 1001:
            print("Клиент закрыл вкладку или браузер")
        elif exc.code == 1006:
            print("Аномальный обрыв соединения")
        else:
            print(f"Соединение закрыто с кодом: {exc.code}")`,
    },
    {
        category: "WebSocket",
        name: "websocket_disconnect.reason",
        description:
            "Текстовое сообщение, поясняющее причину закрытия WebSocket-соединения. Тип str. Доступен через exc.reason в блоке except WebSocketDisconnect. Предоставляется клиентом и может быть пустой строкой, если клиент не передал причину.",
        syntax: `websocket_disconnect.reason`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

@app.websocket("/ws/{session_id}")
async def ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(data)
    except WebSocketDisconnect as exc:
        logger.warning(
            "WS отключение: session=%s code=%d reason=%r",
            session_id, exc.code, exc.reason or "не указана",
        )`,
    },

    // ─── WebSocket методы ─────────────────────────────────────────────────────
    {
        category: "WebSocket",
        name: "await websocket.accept()",
        description:
            "Принимает входящее WebSocket-соединение и завершает процедуру рукопожатия (handshake). Должен быть вызван до любой отправки или получения данных. Опционально позволяет согласовать субпротокол и добавить собственные заголовки в ответ на handshake.",
        syntax: `await websocket.accept(subprotocol=None, headers=None)`,
        arguments: [
            {
                name: "subprotocol",
                description:
                    "Субпротокол WebSocket для согласования с клиентом (например, \"chat\", \"graphql-ws\"). Должен совпадать с одним из субпротоколов, предложенных клиентом. Тип str или None.",
            },
            {
                name: "headers",
                description:
                    "Дополнительные HTTP-заголовки, добавляемые к ответу handshake. Список кортежей [(name, value)] или объект Headers.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    # Простое принятие соединения
    await websocket.accept()
    await websocket.send_text("Соединение установлено")
    await websocket.close()

@app.websocket("/ws/proto")
async def ws_proto(websocket: WebSocket):
    # Согласование субпротокола и добавление заголовка
    await websocket.accept(
        subprotocol="chat",
        headers=[(b"x-server", b"fastapi")],
    )
    await websocket.send_text("Субпротокол: chat")
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "await websocket.receive()",
        description:
            "Низкоуровневый метод получения следующего сообщения от клиента. Возвращает словарь ASGI-сообщения с ключами type, text или bytes. Тип сообщения: \"websocket.receive\" — данные, \"websocket.disconnect\" — клиент отключился. Для повседневного использования предпочтительнее receive_text() или receive_bytes().",
        syntax: `await websocket.receive()`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/raw")
async def ws_raw(websocket: WebSocket):
    await websocket.accept()
    while True:
        message = await websocket.receive()
        if message["type"] == "websocket.disconnect":
            print("Клиент отключился")
            break
        if "text" in message:
            print(f"Текст: {message['text']}")
        elif "bytes" in message:
            print(f"Байты: {len(message['bytes'])} байт")`,
    },
    {
        category: "WebSocket",
        name: "await websocket.receive_text()",
        description:
            "Асинхронно получает следующее текстовое сообщение от клиента и возвращает его как str. Блокирует выполнение до получения сообщения. Если клиент отправит бинарные данные или закроет соединение — выбросит исключение.",
        syntax: `await websocket.receive_text()`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws/echo")
async def ws_echo(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            text = await websocket.receive_text()
            await websocket.send_text(f"Эхо: {text}")
    except WebSocketDisconnect:
        print("Клиент отключился")`,
    },
    {
        category: "WebSocket",
        name: "await websocket.receive_bytes()",
        description:
            "Асинхронно получает следующее бинарное сообщение от клиента и возвращает его как bytes. Подходит для передачи файлов, изображений, аудио и других бинарных данных. Если клиент отправит текст или закроет соединение — выбросит исключение.",
        syntax: `await websocket.receive_bytes()`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import hashlib

app = FastAPI()

@app.websocket("/ws/binary")
async def ws_binary(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            md5 = hashlib.md5(data).hexdigest()
            await websocket.send_text(
                f"Получено {len(data)} байт, MD5: {md5}"
            )
    except WebSocketDisconnect:
        print("Клиент отключился")`,
    },
    {
        category: "WebSocket",
        name: "await websocket.receive_json()",
        description:
            "Асинхронно получает сообщение и десериализует его из JSON. По умолчанию ожидает текстовый фрейм (mode=\"text\"), но может принимать и бинарный (mode=\"binary\"). Возвращает десериализованный Python-объект (dict, list и др.).",
        syntax: `await websocket.receive_json(mode="text")`,
        arguments: [
            {
                name: "mode",
                description:
                    "Режим получения: \"text\" — JSON из текстового фрейма (по умолчанию), \"binary\" — JSON из бинарного фрейма.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws/json")
async def ws_json(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            action = payload.get("action")
            data = payload.get("data")
            await websocket.send_json({
                "status": "ok",
                "echo_action": action,
                "echo_data": data,
            })
    except WebSocketDisconnect:
        print("Клиент отключился")`,
    },
    {
        category: "WebSocket",
        name: "await websocket.send()",
        description:
            "Низкоуровневый метод отправки ASGI-сообщения клиенту. Принимает словарь с ключами type, text или bytes. Для повседневного использования предпочтительнее send_text(), send_bytes() или send_json().",
        syntax: `await websocket.send(data)`,
        arguments: [
            {
                name: "data",
                description:
                    "Словарь ASGI-сообщения. Должен содержать ключ type со значением \"websocket.send\", а также text (str) или bytes для передачи данных.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/raw-send")
async def ws_raw_send(websocket: WebSocket):
    await websocket.accept()
    # Отправка текста через низкоуровневый интерфейс
    await websocket.send({"type": "websocket.send", "text": "Привет!"})
    # Отправка байтов через низкоуровневый интерфейс
    await websocket.send({"type": "websocket.send", "bytes": b"\\x00\\x01\\x02"})
    await websocket.close()`,
    },
    {
        category: "WebSocket",
        name: "await websocket.send_text()",
        description:
            "Асинхронно отправляет текстовое сообщение клиенту в виде текстового WebSocket-фрейма. Принимает строку str. Наиболее распространённый способ отправки данных при работе с текстовыми протоколами.",
        syntax: `await websocket.send_text(data)`,
        arguments: [
            {
                name: "data",
                description:
                    "Строка str, которая будет отправлена клиенту как текстовый WebSocket-фрейм.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json

app = FastAPI()

@app.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Добро пожаловать в чат!")
    try:
        while True:
            msg = await websocket.receive_text()
            await websocket.send_text(f"Сервер: {msg.upper()}")
    except WebSocketDisconnect:
        pass`,
    },
    {
        category: "WebSocket",
        name: "await websocket.send_bytes()",
        description:
            "Асинхронно отправляет бинарное сообщение клиенту в виде бинарного WebSocket-фрейма. Принимает bytes. Используется для передачи файлов, изображений, аудио, сжатых данных и любого другого бинарного контента.",
        syntax: `await websocket.send_bytes(data)`,
        arguments: [
            {
                name: "data",
                description:
                    "Объект bytes, который будет отправлен клиенту как бинарный WebSocket-фрейм.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws/thumbnail")
async def ws_thumbnail(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Получаем изображение от клиента
            image_bytes = await websocket.receive_bytes()
            # Обрабатываем (здесь — просто возвращаем)
            thumbnail = image_bytes[:1024]  # заглушка
            await websocket.send_bytes(thumbnail)
    except WebSocketDisconnect:
        pass`,
    },
    {
        category: "WebSocket",
        name: "await websocket.send_json()",
        description:
            "Асинхронно сериализует объект в JSON и отправляет его клиенту. По умолчанию отправляет как текстовый фрейм (mode=\"text\"). Поддерживает отправку как бинарного фрейма (mode=\"binary\"). Принимает любой JSON-сериализуемый Python-объект.",
        syntax: `await websocket.send_json(data, mode="text")`,
        arguments: [
            {
                name: "data",
                description:
                    "JSON-сериализуемый Python-объект (dict, list, str, int, bool, None).",
            },
            {
                name: "mode",
                description:
                    "Режим отправки: \"text\" — как текстовый фрейм (по умолчанию), \"binary\" — как бинарный фрейм.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime

app = FastAPI()

@app.websocket("/ws/updates")
async def ws_updates(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            command = await websocket.receive_json()
            if command.get("action") == "ping":
                await websocket.send_json({
                    "action": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                })
    except WebSocketDisconnect:
        pass`,
    },
    {
        category: "WebSocket",
        name: "await websocket.close()",
        description:
            "Инициирует закрытие WebSocket-соединения с указанным кодом завершения и необязательным сообщением. Стандартный код 1000 означает нормальное закрытие. После вызова обмен данными невозможен. Если клиент уже отключился — вызов безопасно игнорируется.",
        syntax: `await websocket.close(code=1000, reason=None)`,
        arguments: [
            {
                name: "code",
                description:
                    "Код закрытия WebSocket (RFC 6455). Основные: 1000 — нормальное закрытие, 1001 — endpoint уходит, 1008 — нарушение политики, 1011 — внутренняя ошибка сервера. По умолчанию 1000.",
            },
            {
                name: "reason",
                description:
                    "Текстовое сообщение, поясняющее причину закрытия. Тип str или None. Передаётся клиенту, но не обязателен.",
            },
        ],
        example: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data == "quit":
                await websocket.close(code=1000, reason="Клиент запросил закрытие")
                break
            if data == "error":
                await websocket.close(code=1011, reason="Тестовая ошибка сервера")
                break
            await websocket.send_text(f"Получено: {data}")
    except WebSocketDisconnect:
        pass`,
    },
    {
        category: "WebSocket",
        name: "await websocket.iter_text()",
        description:
            "Асинхронный генератор, последовательно возвращающий текстовые сообщения от клиента. Автоматически завершается при разрыве соединения (WebSocketDisconnect). Позволяет итерировать входящий поток через async for без явной обработки исключений отключения.",
        syntax: `await websocket.iter_text()`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket):
    await websocket.accept()
    async for message in websocket.iter_text():
        # Цикл автоматически завершится при отключении клиента
        processed = message.strip().upper()
        await websocket.send_text(f"[{processed}]")`,
    },
    {
        category: "WebSocket",
        name: "await websocket.iter_bytes()",
        description:
            "Асинхронный генератор, последовательно возвращающий бинарные сообщения (bytes) от клиента. Автоматически завершается при разрыве соединения. Удобен для потоковой обработки бинарных данных: изображений, аудио, файлов.",
        syntax: `await websocket.iter_bytes()`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket
import hashlib

app = FastAPI()

@app.websocket("/ws/upload")
async def ws_upload(websocket: WebSocket):
    await websocket.accept()
    chunks = []
    async for chunk in websocket.iter_bytes():
        chunks.append(chunk)
        await websocket.send_text(f"Получен чанк: {len(chunk)} байт")

    full_data = b"".join(chunks)
    md5 = hashlib.md5(full_data).hexdigest()
    await websocket.send_text(f"Итого: {len(full_data)} байт, MD5: {md5}")`,
    },
    {
        category: "WebSocket",
        name: "await websocket.iter_json()",
        description:
            "Асинхронный генератор, последовательно получающий и десериализующий JSON-сообщения от клиента. Автоматически завершается при разрыве соединения. Удобен для обработки потока JSON-команд или событий.",
        syntax: `await websocket.iter_json()`,
        arguments: [],
        example: `from fastapi import FastAPI, WebSocket
from datetime import datetime

app = FastAPI()

@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    await websocket.accept()
    async for event in websocket.iter_json():
        event_type = event.get("type", "unknown")
        payload = event.get("payload", {})
        await websocket.send_json({
            "received": event_type,
            "payload": payload,
            "server_time": datetime.utcnow().isoformat(),
        })`,
    },

    // ─── Фоновые задачи ───────────────────────────────────────────────────────
    {
        category: "Фоновые задачи",
        name: "BackgroundTasks()",
        description:
            "Класс для регистрации фоновых задач, которые выполняются после отправки ответа клиенту. Позволяет запускать ресурсоёмкие операции (отправка email, запись в БД, обработка файлов) не задерживая HTTP-ответ. Объект BackgroundTasks обычно получают как параметр маршрута с аннотацией типа — FastAPI внедряет его автоматически.",
        syntax: `BackgroundTasks(tasks=None)`,
        arguments: [
            {
                name: "tasks",
                description:
                    "Список объектов BackgroundTask для предварительной инициализации. Как правило, не задаётся вручную — задачи добавляются через метод add_task().",
            },
        ],
        example: `from fastapi import FastAPI, BackgroundTasks

app = FastAPI()

def send_welcome_email(email: str):
    # Имитация отправки письма
    print(f"Отправка приветственного письма на {email}")

@app.post("/register")
async def register_user(email: str, background_tasks: BackgroundTasks):
    # Ответ отправляется клиенту немедленно,
    # send_welcome_email запустится после этого
    background_tasks.add_task(send_welcome_email, email)
    return {"message": "Пользователь зарегистрирован"}`,
    },
    {
        category: "Фоновые задачи",
        name: "BackgroundTask()",
        description:
            "Низкоуровневый класс из Starlette для создания единственной фоновой задачи, привязанной напрямую к объекту ответа через параметр background. В отличие от BackgroundTasks, не внедряется через зависимости — создаётся вручную и передаётся в конструктор класса ответа. Удобен, когда задача неразрывно связана с конкретным ответом (например, удаление временного файла после FileResponse).",
        syntax: `BackgroundTask(func, *args, **kwargs)`,
        arguments: [
            {
                name: "func",
                description:
                    "Вызываемый объект (sync или async функция), который будет выполнен после отправки ответа.",
            },
            {
                name: "*args",
                description:
                    "Позиционные аргументы, передаваемые в func при вызове.",
            },
            {
                name: "**kwargs",
                description:
                    "Именованные аргументы, передаваемые в func при вызове.",
            },
        ],
        example: `import os
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

app = FastAPI()

def cleanup(path: str):
    if os.path.exists(path):
        os.remove(path)
        print(f"Временный файл удалён: {path}")

# Удаление временного файла сразу после отдачи клиенту
@app.get("/export")
def export_data():
    tmp_path = "/tmp/report_export.csv"
    # ... генерация файла ...
    with open(tmp_path, "w") as f:
        f.write("id,name\\n1,Widget\\n2,Gadget\\n")

    return FileResponse(
        path=tmp_path,
        filename="report.csv",
        media_type="text/csv",
        background=BackgroundTask(cleanup, tmp_path),
    )

# Логирование после отправки JSON-ответа
def log_action(user_id: int, action: str):
    print(f"[LOG] user={user_id} action={action}")

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    # ... удаление из БД ...
    return JSONResponse(
        content={"deleted": item_id},
        background=BackgroundTask(log_action, user_id=1, action="delete_item"),
    )`,
    },
    {
        category: "Фоновые задачи",
        name: "background_tasks.add_task()",
        description:
            "Регистрирует функцию для выполнения в фоне после отправки ответа. Принимает вызываемый объект и любые позиционные или именованные аргументы для него. Поддерживает как обычные (sync), так и асинхронные (async) функции — FastAPI определяет тип автоматически. Задачи выполняются последовательно в порядке добавления.",
        syntax: `background_tasks.add_task(func, *args, **kwargs)`,
        arguments: [
            {
                name: "func",
                description:
                    "Вызываемый объект (функция, корутина, лямбда), который будет выполнен в фоне. Может быть sync- или async-функцией.",
            },
            {
                name: "*args",
                description:
                    "Позиционные аргументы, передаваемые в func при вызове.",
            },
            {
                name: "**kwargs",
                description:
                    "Именованные аргументы, передаваемые в func при вызове.",
            },
        ],
        example: `import asyncio
from fastapi import FastAPI, BackgroundTasks, UploadFile, File

app = FastAPI()

# Sync-задача
def write_log(message: str, level: str = "INFO"):
    with open("app.log", "a") as f:
        f.write(f"[{level}] {message}\\n")

# Async-задача
async def notify_admin(user_id: int, action: str):
    await asyncio.sleep(0.1)  # имитация запроса к внешнему API
    print(f"Уведомление: пользователь {user_id} выполнил '{action}'")

@app.post("/items")
async def create_item(name: str, background_tasks: BackgroundTasks):
    # Добавляем несколько задач — выполнятся по порядку после ответа
    background_tasks.add_task(write_log, f"Создан товар: {name}", level="INFO")
    background_tasks.add_task(notify_admin, user_id=42, action="create_item")
    return {"name": name, "status": "created"}

@app.post("/upload")
async def upload_and_process(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    contents = await file.read()
    await file.close()
    # Тяжёлая обработка — в фон
    background_tasks.add_task(write_log, f"Загружен файл: {file.filename}")
    return {"filename": file.filename, "size": len(contents)}`,
    },

    // ─── Загрузка файлов ──────────────────────────────────────────────────────
    {
        category: "Загрузка файлов",
        name: "UploadFile()",
        description:
            "Класс для работы с загружаемыми файлами в маршрутах FastAPI. Оборачивает файловый объект SpooledTemporaryFile — небольшие файлы хранятся в памяти, большие автоматически сбрасываются на диск. Используется как тип аннотации параметра маршрута для приёма файлов через multipart/form-data.",
        syntax: `UploadFile(
    filename,
    *,
    size=None,
    headers=Headers(),
    file=None,
)`,
        arguments: [
            {
                name: "filename",
                description:
                    "Оригинальное имя файла, переданное клиентом (например, «photo.jpg»). Не является безопасным для использования напрямую в файловой системе — требует валидации.",
            },
            {
                name: "size",
                description:
                    "Размер файла в байтах. Заполняется автоматически FastAPI при получении запроса. None, если размер неизвестен.",
            },
            {
                name: "headers",
                description:
                    "HTTP-заголовки части multipart, относящиеся к данному файлу (Content-Type, Content-Disposition и др.).",
            },
            {
                name: "file",
                description:
                    "Базовый файловый объект SpooledTemporaryFile. Как правило, не задаётся вручную — создаётся автоматически при разборе запроса.",
            },
        ],
        example: `from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    return JSONResponse({
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
    })

# Загрузка нескольких файлов сразу
@app.post("/upload/multiple")
async def upload_multiple(files: list[UploadFile] = File(...)):
    results = []
    for f in files:
        contents = await f.read()
        results.append({"filename": f.filename, "bytes": len(contents)})
        await f.close()
    return results`,
    },
    {
        category: "Загрузка файлов",
        name: "upload_file.filename",
        description:
            "Оригинальное имя файла, отправленное клиентом в заголовке Content-Disposition части multipart. Тип str или None. Не гарантирует безопасности — перед использованием в файловой системе необходима санитизация (удаление пути, спецсимволов).",
        syntax: `upload_file.filename`,
        arguments: [],
        example: `from fastapi import FastAPI, UploadFile, File
import re

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    # Безопасное имя файла: убираем путь и опасные символы
    safe_name = re.sub(r"[^\\w.\\-]", "_", file.filename or "unnamed")
    return {"original": file.filename, "safe": safe_name}`,
    },
    {
        category: "Загрузка файлов",
        name: "upload_file.content_type",
        description:
            "MIME-тип файла, указанный клиентом (например, image/jpeg, application/pdf). Тип str или None. Значение определяется браузером или клиентом и не является надёжным — для проверки типа файла следует инспектировать байты содержимого (magic bytes), а не полагаться только на это поле.",
        syntax: `upload_file.content_type`,
        arguments: [],
        example: `from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Недопустимый тип файла: {file.content_type}",
        )
    contents = await file.read()
    return {"filename": file.filename, "type": file.content_type, "size": len(contents)}`,
    },
    {
        category: "Загрузка файлов",
        name: "upload_file.headers",
        description:
            "Заголовки HTTP-части multipart, относящиеся к данному файлу. Объект типа Headers (из starlette). Содержит Content-Type, Content-Disposition и другие метаданные части. Доступ к конкретному заголовку: upload_file.headers[\"content-type\"].",
        syntax: `upload_file.headers`,
        arguments: [],
        example: `from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.post("/upload/inspect")
async def inspect_headers(file: UploadFile = File(...)):
    return {
        "content_type_header": file.headers.get("content-type"),
        "disposition": file.headers.get("content-disposition"),
        "all_headers": dict(file.headers),
    }`,
    },
    {
        category: "Загрузка файлов",
        name: "upload_file.size",
        description:
            "Размер загруженного файла в байтах. Тип int или None. Заполняется FastAPI автоматически при разборе multipart-запроса. Удобен для быстрой проверки ограничений без чтения всего файла.",
        syntax: `upload_file.size`,
        arguments: [],
        example: `from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()

MAX_SIZE = 5 * 1024 * 1024  # 5 МБ

@app.post("/upload/limited")
async def upload_limited(file: UploadFile = File(...)):
    if file.size and file.size > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Файл слишком большой: {file.size} байт. Максимум: {MAX_SIZE} байт.",
        )
    contents = await file.read()
    return {"filename": file.filename, "size": file.size}`,
    },
    {
        category: "Загрузка файлов",
        name: "await upload_file.read()",
        description:
            "Асинхронно читает содержимое файла и возвращает bytes. Без аргументов читает весь файл целиком. Если передан size, читает не более указанного числа байт. После вызова внутренний указатель перемещается в конец — для повторного чтения необходимо вызвать seek(0).",
        syntax: `await upload_file.read(size=-1)`,
        arguments: [
            {
                name: "size",
                description:
                    "Количество байт для чтения. По умолчанию -1 — читает весь файл до конца.",
            },
        ],
        example: `from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import hashlib

app = FastAPI()

@app.post("/upload/hash")
async def upload_and_hash(file: UploadFile = File(...)):
    contents = await file.read()          # читаем весь файл
    await file.seek(0)                    # сбрасываем указатель
    first_16 = await file.read(16)        # читаем первые 16 байт (magic bytes)

    md5 = hashlib.md5(contents).hexdigest()
    return {
        "filename": file.filename,
        "size": len(contents),
        "md5": md5,
        "magic_bytes": first_16.hex(),
    }`,
    },
    {
        category: "Загрузка файлов",
        name: "await upload_file.write()",
        description:
            "Асинхронно записывает данные во внутренний файловый объект UploadFile. Принимает bytes или str. Используется редко — как правило, для создания и наполнения UploadFile вручную в тестах или при программной генерации файлов.",
        syntax: `await upload_file.write(data)`,
        arguments: [
            {
                name: "data",
                description:
                    "Данные для записи — объект типа bytes или str.",
            },
        ],
        example: `from fastapi import UploadFile
from starlette.datastructures import Headers
import pytest

# Использование в тестах: создание UploadFile вручную
async def make_upload_file(content: bytes, filename: str) -> UploadFile:
    upload = UploadFile(filename=filename, headers=Headers())
    await upload.write(content)
    await upload.seek(0)   # возвращаем указатель в начало перед чтением
    return upload

# В тесте:
async def test_upload():
    fake_file = await make_upload_file(b"hello world", "test.txt")
    data = await fake_file.read()
    assert data == b"hello world"`,
    },
    {
        category: "Загрузка файлов",
        name: "await upload_file.seek()",
        description:
            "Асинхронно перемещает внутренний указатель файла на указанную позицию в байтах. Аналог file.seek() для обычных файлов. Необходим после read(), если нужно прочитать файл повторно или начать чтение с другой позиции.",
        syntax: `await upload_file.seek(offset)`,
        arguments: [
            {
                name: "offset",
                description:
                    "Позиция в байтах, на которую перемещается указатель. 0 — начало файла.",
            },
        ],
        example: `from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.post("/upload/preview")
async def upload_preview(file: UploadFile = File(...)):
    # Читаем первые 256 байт для предпросмотра
    preview = await file.read(256)

    # Возвращаем указатель в начало и читаем весь файл
    await file.seek(0)
    full_content = await file.read()

    await file.close()
    return {
        "filename": file.filename,
        "total_bytes": len(full_content),
        "preview_hex": preview.hex(),
    }`,
    },
    {
        category: "Загрузка файлов",
        name: "await upload_file.close()",
        description:
            "Асинхронно закрывает внутренний файловый объект и освобождает связанные ресурсы (удаляет временный файл с диска). FastAPI закрывает файлы автоматически по завершении запроса, однако явный вызов close() рекомендуется при обработке больших файлов или множественных загрузок, чтобы освободить память раньше.",
        syntax: `await upload_file.close()`,
        arguments: [],
        example: `from fastapi import FastAPI, UploadFile, File
import aiofiles
import os

app = FastAPI()

UPLOAD_DIR = "/uploads"

@app.post("/upload/save")
async def save_file(file: UploadFile = File(...)):
    dest = os.path.join(UPLOAD_DIR, file.filename or "unnamed")
    try:
        async with aiofiles.open(dest, "wb") as out:
            while chunk := await file.read(65536):  # читаем по 64 КБ
                await out.write(chunk)
    finally:
        await file.close()  # явно закрываем после сохранения

    return {"saved_to": dest, "size": os.path.getsize(dest)}`,
    },

    // ─── Классы ответов ───────────────────────────────────────────────────────
    {
        category: "Классы ответов",
        name: "JSONResponse()",
        description:
            "Стандартный класс ответа FastAPI. Сериализует переданный объект в JSON с помощью встроенного модуля json и возвращает ответ с заголовком Content-Type: application/json. Используется по умолчанию для всех маршрутов, если не указан другой response_class.",
        syntax: `JSONResponse(
    content=None,
    status_code=200,
    headers=None,
    media_type="application/json",
    background=None,
)`,
        arguments: [
            {
                name: "content",
                description:
                    "Данные для сериализации в JSON. Должны быть JSON-сериализуемым объектом (dict, list, str, int, bool, None).",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "media_type",
                description:
                    'MIME-тип ответа. По умолчанию "application/json".',
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки ответа.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id == 0:
        return JSONResponse(
            content={"error": "Товар не найден"},
            status_code=404,
            headers={"X-Custom-Header": "value"},
        )
    return JSONResponse(content={"id": item_id, "name": "Widget"})`,
    },
    {
        category: "Классы ответов",
        name: "HTMLResponse()",
        description:
            "Возвращает HTML-контент клиенту с заголовком Content-Type: text/html. Используется для отдачи HTML-страниц или фрагментов разметки напрямую из маршрута без шаблонизатора.",
        syntax: `HTMLResponse(
    content=None,
    status_code=200,
    headers=None,
    background=None,
)`,
        arguments: [
            {
                name: "content",
                description:
                    "HTML-строка, которая будет отправлена в теле ответа.",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки ответа.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
def index():
    html = """
    <!DOCTYPE html>
    <html>
      <head><title>Главная</title></head>
      <body><h1>Привет, FastAPI!</h1></body>
    </html>
    """
    return HTMLResponse(content=html, status_code=200)`,
    },
    {
        category: "Классы ответов",
        name: "PlainTextResponse()",
        description:
            "Возвращает простой текст с заголовком Content-Type: text/plain. Подходит для возврата сырых строк, логов или любого неформатированного текста без HTML-разметки.",
        syntax: `PlainTextResponse(
    content=None,
    status_code=200,
    headers=None,
    background=None,
)`,
        arguments: [
            {
                name: "content",
                description:
                    "Текстовая строка, которая будет отправлена в теле ответа.",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки ответа.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI()

@app.get("/ping", response_class=PlainTextResponse)
def ping():
    return PlainTextResponse(content="pong")

@app.get("/healthz", response_class=PlainTextResponse)
def health():
    return PlainTextResponse(content="OK", status_code=200)`,
    },
    {
        category: "Классы ответов",
        name: "ORJSONResponse()",
        description:
            "Высокопроизводительный JSON-ответ на основе библиотеки orjson. Значительно быстрее стандартного JSONResponse благодаря нативной реализации на Rust. Поддерживает сериализацию datetime, UUID, numpy-массивов и других типов из коробки. Требует установки пакета orjson.",
        syntax: `ORJSONResponse(
    content=None,
    status_code=200,
    headers=None,
    media_type="application/json",
    background=None,
)`,
        arguments: [
            {
                name: "content",
                description:
                    "Данные для сериализации. Поддерживает расширенный набор типов: datetime, UUID, dataclasses, numpy и др.",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "media_type",
                description:
                    'MIME-тип ответа. По умолчанию "application/json".',
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки ответа.",
            },
        ],
        example: `# pip install orjson
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from datetime import datetime

app = FastAPI(default_response_class=ORJSONResponse)

@app.get("/data")
def get_data():
    return ORJSONResponse(content={
        "name": "FastAPI",
        "created_at": datetime.utcnow(),  # orjson сериализует datetime автоматически
        "scores": [1, 2, 3],
    })`,
    },
    {
        category: "Классы ответов",
        name: "UJSONResponse()",
        description:
            "Быстрый JSON-ответ на основе библиотеки ujson. Альтернатива JSONResponse с более высокой производительностью сериализации. Менее строгий к нестандартным типам по сравнению с orjson, но быстрее стандартного json. Требует установки пакета ujson.",
        syntax: `UJSONResponse(
    content=None,
    status_code=200,
    headers=None,
    media_type="application/json",
    background=None,
)`,
        arguments: [
            {
                name: "content",
                description:
                    "Данные для сериализации в JSON. Поддерживает стандартные Python-типы.",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "media_type",
                description:
                    'MIME-тип ответа. По умолчанию "application/json".',
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки ответа.",
            },
        ],
        example: `# pip install ujson
from fastapi import FastAPI
from fastapi.responses import UJSONResponse

app = FastAPI(default_response_class=UJSONResponse)

@app.get("/items")
def list_items():
    items = [{"id": i, "name": f"Item {i}"} for i in range(1000)]
    return UJSONResponse(content={"items": items, "total": 1000})`,
    },
    {
        category: "Классы ответов",
        name: "RedirectResponse()",
        description:
            "Выполняет HTTP-перенаправление на указанный URL. По умолчанию использует статус 307 (Temporary Redirect), сохраняющий метод запроса. Для постоянного перенаправления используйте 301, для смены метода на GET — 302 или 303.",
        syntax: `RedirectResponse(
    url,
    status_code=307,
    headers=None,
    background=None,
)`,
        arguments: [
            {
                name: "url",
                description:
                    "URL для перенаправления. Может быть абсолютным (https://example.com) или относительным (/new-path).",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код перенаправления. 301 — постоянное (меняет метод на GET), 302 — временное (меняет метод на GET), 303 — See Other (всегда GET), 307 — временное (сохраняет метод), 308 — постоянное (сохраняет метод). По умолчанию 307.",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки ответа.",
            },
        ],
        example: `from fastapi import FastAPI
from fastapi.responses import RedirectResponse

app = FastAPI()

@app.get("/old-path")
def old_route():
    # Временное перенаправление, метод сохраняется (307)
    return RedirectResponse(url="/new-path")

@app.get("/docs-shortcut")
def docs_redirect():
    # Постоянное перенаправление на внешний ресурс (301)
    return RedirectResponse(
        url="https://fastapi.tiangolo.com",
        status_code=301,
    )

@app.post("/submit")
def submit_form():
    # После обработки POST — редирект на GET-страницу (303)
    return RedirectResponse(url="/success", status_code=303)

@app.get("/new-path")
def new_route():
    return {"message": "Новый маршрут"}`,
    },
    {
        category: "Классы ответов",
        name: "StreamingResponse()",
        description:
            "Возвращает ответ с потоковой передачей данных. Принимает итерируемый объект или асинхронный генератор и отправляет данные клиенту по частям, не дожидаясь формирования всего тела ответа. Незаменим для больших файлов, видео, Server-Sent Events и любых данных, генерируемых в реальном времени.",
        syntax: `StreamingResponse(
    content,
    status_code=200,
    headers=None,
    media_type=None,
    background=None,
)`,
        arguments: [
            {
                name: "content",
                description:
                    "Итерируемый объект или асинхронный генератор, производящий фрагменты данных (bytes или str). Каждый фрагмент отправляется клиенту сразу по мере готовности.",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "media_type",
                description:
                    "MIME-тип передаваемых данных, например text/event-stream для SSE, video/mp4 для видео, application/octet-stream для произвольных бинарных данных.",
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки всего потока.",
            },
        ],
        example: `import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

# Потоковая передача текста (Server-Sent Events)
async def event_generator():
    for i in range(5):
        yield f"data: Сообщение {i}\\n\\n"
        await asyncio.sleep(1)

@app.get("/stream/events")
def stream_events():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )

# Потоковая отдача большого файла
def iter_file(path: str, chunk_size: int = 65536):
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            yield chunk

@app.get("/stream/file")
def stream_file():
    return StreamingResponse(
        iter_file("/data/large_video.mp4"),
        media_type="video/mp4",
    )`,
    },
    {
        category: "Классы ответов",
        name: "FileResponse()",
        description:
            "Отправляет файл с диска клиенту асинхронно и эффективно. Автоматически определяет MIME-тип по расширению файла, выставляет заголовок Content-Disposition для скачивания, поддерживает HTTP range requests (частичная загрузка) и кэширование через ETag и Last-Modified.",
        syntax: `FileResponse(
    path,
    status_code=200,
    headers=None,
    media_type=None,
    background=None,
    filename=None,
    stat_result=None,
    method=None,
    content_disposition_type="attachment",
)`,
        arguments: [
            {
                name: "path",
                description:
                    "Путь к файлу на диске — строка или объект os.PathLike. Файл должен существовать, иначе возникнет ошибка.",
            },
            {
                name: "status_code",
                description:
                    "HTTP-код статуса ответа. По умолчанию 200 (OK).",
            },
            {
                name: "headers",
                description:
                    "Словарь дополнительных HTTP-заголовков для включения в ответ.",
            },
            {
                name: "media_type",
                description:
                    "MIME-тип файла. Если не указан, определяется автоматически по расширению (например, image/png, application/pdf).",
            },
            {
                name: "background",
                description:
                    "Фоновая задача (объект BackgroundTask), выполняемая после отправки файла. Удобно для удаления временных файлов.",
            },
            {
                name: "filename",
                description:
                    "Имя файла, предлагаемое браузеру при скачивании. Используется в заголовке Content-Disposition. Если не указан, берётся из path.",
            },
            {
                name: "stat_result",
                description:
                    "Результат os.stat() для файла. Если передан, FastAPI не вызывает stat() повторно — позволяет избежать лишнего системного вызова при заранее известных метаданных.",
            },
            {
                name: "method",
                description:
                    "HTTP-метод запроса. Обычно не задаётся вручную — FastAPI определяет автоматически.",
            },
            {
                name: "content_disposition_type",
                description:
                    'Тип Content-Disposition: "attachment" (скачать файл, по умолчанию) или "inline" (отобразить в браузере, если возможно).',
            },
        ],
        example: `import os
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import FileResponse

app = FastAPI()

# Скачивание файла с предложенным именем
@app.get("/download/report")
def download_report():
    return FileResponse(
        path="/reports/2024_annual.pdf",
        filename="Годовой_отчёт_2024.pdf",
        media_type="application/pdf",
    )

# Отображение изображения в браузере (inline)
@app.get("/images/{name}")
def show_image(name: str):
    return FileResponse(
        path=f"/static/images/{name}",
        content_disposition_type="inline",
    )

# Удаление временного файла после отправки
@app.get("/export/temp")
def export_and_cleanup(background_tasks: BackgroundTasks):
    tmp_path = "/tmp/export_123.csv"
    # ... генерация файла ...
    background_tasks.add_task(os.remove, tmp_path)
    return FileResponse(
        path=tmp_path,
        filename="export.csv",
        media_type="text/csv",
    )`,
    },
];
