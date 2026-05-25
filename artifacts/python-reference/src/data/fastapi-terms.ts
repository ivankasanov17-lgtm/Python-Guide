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
];
