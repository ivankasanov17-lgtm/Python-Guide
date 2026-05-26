# Задачи по FastAPI для Middle и Senior разработчиков

## Раздел 1: Основы и архитектура приложения

**Задача 1. Структура крупного FastAPI-проекта**
Спроектируйте архитектуру FastAPI-приложения для e-commerce платформы с несколькими доменами (товары, заказы, пользователи, платежи). Реализуйте разбиение на модули через `APIRouter` с префиксами и тегами, разделение слоёв (router → service → repository), подключение роутеров в главном `app`, общий механизм dependency injection через `Depends`. Обоснуйте структуру директорий.

---

**Задача 2. Lifespan и управление ресурсами приложения**
Реализуйте управление жизненным циклом приложения через `lifespan` context manager (FastAPI 0.95+). При старте: инициализация пула соединений к БД, подключение к Redis, прогрев кэша, загрузка ML-модели в память. При остановке: корректное закрытие всех соединений, ожидание завершения in-flight запросов. Сравните с устаревшими `on_startup`/`on_shutdown`.

---

**Задача 3. Кастомная обработка ошибок**
Реализуйте единую систему обработки ошибок для API. Создайте иерархию кастомных исключений (`AppException`, `NotFoundError`, `ValidationError`, `AuthError`), зарегистрируйте `exception_handler` для каждого типа, верните ошибки в унифицированном формате (RFC 7807 Problem Details). Логируйте неожиданные исключения с полным stacktrace, не раскрывая детали клиенту в production.

---

**Задача 4. Middleware для сквозной функциональности**
Разработайте набор middleware для production-окружения. `RequestIdMiddleware` — генерирует UUID для каждого запроса и передаёт через `request.state` и response header. `TimingMiddleware` — измеряет время выполнения и добавляет заголовок `X-Process-Time`. `TenantMiddleware` — определяет tenant по subdomain или заголовку и устанавливает контекст. Учтите правильный порядок и async-совместимость.

---

**Задача 5. Зависимости (Dependency Injection) — продвинутые паттерны**
Реализуйте сложные цепочки зависимостей. Создайте зависимость `get_current_user`, которая: извлекает JWT из заголовка, валидирует токен, загружает пользователя из БД (с кэшированием), проверяет что пользователь активен. На её основе создайте `get_admin_user` и `get_verified_user`. Реализуйте зависимость с cleanup (yield dependency) для управления ресурсами. Объясните `use_cache` в `Depends`.

---

## Раздел 2: Pydantic и валидация данных

**Задача 6. Продвинутая валидация с Pydantic v2**
Создайте систему схем для модели `Product` с использованием Pydantic v2: базовая схема `ProductBase`, схемы `ProductCreate`, `ProductUpdate` (все поля Optional), `ProductInDB` (с полями БД), `ProductResponse` (публичный вид). Реализуйте кастомные валидаторы через `@field_validator` и `@model_validator`, кастомные типы (например, `PositiveDecimal`, `Slug`), схемы с дискриминированными union типами.

---

**Задача 7. Сериализация и десериализация сложных структур**
Реализуйте API endpoint, принимающий и возвращающий сложную вложенную структуру: заказ с позициями, каждая позиция со своим товаром и вариантами. Используйте `model_config` с `from_attributes=True` для ORM-объектов. Реализуйте кастомный `model_serializer` для управления процессом сериализации. Обеспечьте корректное отображение в OpenAPI-схеме.

---

**Задача 8. Generic-модели и переиспользуемые схемы**
Реализуйте переиспользуемые generic Pydantic-схемы для типовых структур ответов. `PaginatedResponse[T]` — обёртка для пагинированных списков с метаданными. `ApiResponse[T]` — унифицированный конверт с `data`, `errors`, `meta`. `FilterParams` — базовый класс для параметров фильтрации с валидацией диапазонов. Покажите, как они отображаются в Swagger UI.

---

**Задача 9. Настройки приложения через Pydantic Settings**
Реализуйте управление конфигурацией приложения через `pydantic-settings`. Создайте иерархию настроек: базовые, dev, staging, production. Поддержите загрузку из `.env` файлов, переменных окружения, AWS Secrets Manager. Реализуйте валидацию настроек при старте (fail fast), сокрытие секретов в логах, typed-доступ к настройкам через DI. Организуйте секреты (DB URL, API keys) безопасно.

---

**Задача 10. Кастомные типы и аннотации**
Создайте библиотеку кастомных типов для повторного использования в схемах проекта: `EmailStr` с доменной валидацией, `PhoneNumber` с нормализацией в E.164, `Money` с Currency и Amount (без float-ошибок), `DateRange` с валидацией start < end, `Base64File` с декодированием и проверкой MIME-типа. Реализуйте корректное отображение каждого типа в JSON Schema.

---

## Раздел 3: Асинхронность и производительность

**Задача 11. Правильная работа с async/await**
Проведите аудит FastAPI-приложения на предмет типичных async-ошибок: вызов sync-функций в async context (блокировка event loop), неиспользование `asyncio.gather` для параллельных независимых операций, неправильное использование `run_in_executor` для CPU-bound задач, утечки ресурсов из-за незакрытых соединений. Исправьте найденные проблемы и объясните каждую.

---

**Задача 12. Параллельные запросы и конкурентность**
Реализуйте endpoint агрегации данных, который параллельно запрашивает 5 внешних сервисов: курсы валют, погода, новости, биржевые котировки, гео-данные. Используйте `asyncio.gather` с обработкой частичных сбоев (`return_exceptions=True`), таймаутами на каждый запрос (`asyncio.wait_for`), circuit breaker паттерном. Верните частичный результат, если часть сервисов недоступна.

---

**Задача 13. Background Tasks и очереди**
Сравните и реализуйте три подхода к фоновым задачам в FastAPI. `BackgroundTasks` — встроенный механизм для лёгких задач после ответа. `asyncio.create_task` — для задач в рамках event loop. Интеграция с Celery или ARQ — для тяжёлых, retry-able задач. Реализуйте отправку email-уведомления всеми тремя способами и объясните trade-offs каждого.

---

**Задача 14. WebSockets и real-time функциональность**
Реализуйте real-time чат с использованием FastAPI WebSockets. Требования: комнаты (rooms) с изоляцией сообщений, broadcast в пределах комнаты, personal messages, аутентификация через JWT при handshake, обработка disconnect и reconnect, horizontal scaling через Redis Pub/Sub. Реализуйте ConnectionManager с правильным lifecycle управлением.

---

**Задача 15. Server-Sent Events (SSE)**
Реализуйте endpoint для Server-Sent Events: стриминг статуса долгой операции (импорт файла), push-уведомления для конкретного пользователя, heartbeat для поддержания соединения, корректное закрытие соединения при disconnect клиента. Используйте `StreamingResponse` с `text/event-stream`. Сравните SSE с WebSocket: когда что применять.

---

## Раздел 4: Базы данных и ORM

**Задача 16. Async SQLAlchemy 2.0 — продвинутые паттерны**
Реализуйте Repository-паттерн с использованием async SQLAlchemy 2.0. Базовый `GenericRepository[T]` с CRUD-методами. Специфичные репозитории с кастомными запросами. Управление сессиями через DI (`AsyncSession` как зависимость). Реализуйте Unit of Work для атомарных операций над несколькими репозиториями. Корректная работа `lazy loading` в async контексте.

---

**Задача 17. Alembic и управление миграциями**
Настройте Alembic для async-приложения с несколькими базами данных. Реализуйте: автогенерацию миграций из SQLAlchemy моделей, поддержку data migrations (изменение данных), возможность rollback, multi-database migrations (основная БД + аналитическая), тестирование миграций в CI. Обеспечьте zero-downtime миграции для production.

---

**Задача 18. Оптимизация запросов в async SQLAlchemy**
Проведите оптимизацию ORM-запросов в FastAPI-приложении. Устраните N+1 через `selectinload` и `joinedload`, правильно используйте `lazy="raise"` для обнаружения непреднамеренных lazy load, реализуйте batch loading для связанных объектов, используйте `with_loader_criteria` для row-level security, настройте connection pool (`pool_size`, `max_overflow`, `pool_timeout`).

---

**Задача 19. MongoDB и Motor — async ODM**
Реализуйте async-слой для работы с MongoDB через `motor`. Создайте базовый репозиторий с CRUD, сложный агрегационный pipeline для аналитики, индексы для оптимизации запросов (включая text, geospatial), реализуйте пагинацию через cursor. Сравните подход с MongoDB и SQL для разных сценариев. Реализуйте миграции схемы для MongoDB (schema validation).

---

**Задача 20. Кэширование с Redis — продвинутые паттерны**
Реализуйте многоуровневое кэширование через `redis-py` async. Создайте декоратор `@cache(ttl=300, key_builder=...)` для автоматического кэширования результатов функций, реализуйте cache stampede protection (probabilistic early expiration или locking), cache invalidation по тегам, distributed rate limiting через Redis sliding window. Используйте Redis data structures (Sorted Sets, HyperLogLog) для специфических задач.

---

## Раздел 5: Аутентификация и безопасность

**Задача 21. JWT-аутентификация с refresh-токенами**
Реализуйте полноценную систему JWT-аутентификации без сторонних библиотек. Access-токен (15 мин) + refresh-токен (30 дней) с ротацией. Хранение refresh-токенов в Redis с возможностью инвалидации. Детекция повторного использования отозванного токена (reuse detection с семейством токенов). Блокировка подозрительных сессий. Возврат корректных HTTP-кодов (401 vs 403).

---

**Задача 22. OAuth2 и Social Login**
Реализуйте OAuth2-аутентификацию через Google и GitHub. Используйте `authlib` или реализуйте flow вручную: authorization code flow с PKCE, обмен кода на токен, получение профиля пользователя, создание/привязка локального аккаунта, обработка конфликтов email. Реализуйте state parameter для CSRF-защиты. Поддержите multiple providers для одного аккаунта.

---

**Задача 23. Система разрешений и RBAC**
Реализуйте гибкую систему разрешений поверх FastAPI Depends. Roles: `admin`, `moderator`, `user`. Permissions: `articles:read`, `articles:write`, `articles:delete`. Реализуйте: проверку разрешений как DI-зависимость (`require_permission("articles:write")`), row-level security (пользователь видит только свои ресурсы), делегирование прав, временные разрешения с TTL, аудит всех проверок прав.

---

**Задача 24. Защита от атак и безопасность API**
Проведите hardening FastAPI-приложения. Реализуйте: rate limiting на уровне IP и пользователя через Redis, защиту от brute force на `/auth/login` (exponential backoff + captcha после N попыток), Input sanitization и защиту от injection через параметризованные запросы, корректные CORS-заголовки с whitelist, security headers (CSP, HSTS, X-Frame-Options), сокрытие технических деталей из error responses.

---

**Задача 25. API Keys и machine-to-machine аутентификация**
Реализуйте систему API-ключей для M2M-аутентификации. Генерация ключей (prefix + secret, хешируется для хранения), scopes для ограничения доступа конкретного ключа, rate limiting per key, ротация ключей без даунтайма, аудит использования (last used, request count), отзыв ключей с grace period. Реализуйте через `Depends` прозрачно для endpoint-хэндлеров.

---

## Раздел 6: Тестирование

**Задача 26. Тестирование FastAPI с pytest**
Настройте полноценное тестовое окружение для FastAPI-приложения. Реализуйте: `TestClient` и `AsyncClient` (httpx) для sync/async тестов, фикстуры для тестовой БД с транзакционным откатом после каждого теста, мокирование внешних HTTP-сервисов через `respx`, factory-фикстуры через `factory_boy`, параметризованные тесты для edge cases. Структурируйте тесты по уровням: unit, integration, e2e.

---

**Задача 27. Тестирование async кода**
Реализуйте тесты для async-компонентов приложения: async repository методы с тестовой async сессией, WebSocket-хэндлеры через `TestClient` WebSocket поддержку, Background Tasks (проверка что задача была запланирована), Celery-задачи в eager mode, SSE endpoint (проверка стрима событий). Используйте `pytest-asyncio` с правильной конфигурацией event loop.

---

**Задача 28. Контрактное тестирование (Consumer-Driven Contract Testing)**
Реализуйте contract testing между FastAPI-бэкендом и React-фронтендом с использованием Pact. Определите контракты для критических эндпоинтов, запустите provider verification в CI, настройте Pact Broker для хранения контрактов. Обеспечьте, что изменения в API не ломают фронтенд без явного согласования. Объясните разницу между contract testing и integration testing.

---

## Раздел 7: Интеграции и внешние сервисы

**Задача 29. HTTP-клиент и устойчивость к отказам**
Реализуйте надёжный async HTTP-клиент для интеграции с внешними сервисами. Используйте `httpx.AsyncClient` с: connection pooling и переиспользованием сессии, retry с exponential backoff и jitter (через `tenacity`), circuit breaker паттерном (через `aiobreaker`), таймаутами (connect, read, total), трейсингом запросов через OpenTelemetry. Реализуйте graceful degradation при недоступности внешнего сервиса.

---

**Задача 30. Интеграция с очередями сообщений**
Реализуйте event-driven интеграцию FastAPI с RabbitMQ или Kafka. Publisher: отправка событий при изменении ресурсов (transactional outbox pattern). Consumer: обработка входящих событий с идемпотентностью. Dead letter queue для необработанных сообщений. Реализуйте graceful shutdown (дождаться завершения текущей обработки). Мониторинг lag и health потребителей.

---

**Задача 31. Файловый сервис и загрузка файлов**
Реализуйте полноценный сервис загрузки файлов. Прямая загрузка через multipart/form-data с валидацией типа и размера, chunked upload для больших файлов с возобновлением, генерация presigned URLs для прямой загрузки в S3 (минуя бэкенд), обработка изображений (resize, crop, watermark) в фоне через Celery, хранение метаданных в PostgreSQL, CDN-интеграция.

---

**Задача 32. GraphQL с Strawberry**
Реализуйте GraphQL API с использованием Strawberry (Python-first GraphQL). Схема: типы, запросы, мутации, подписки (через WebSocket). DataLoader для устранения N+1 в GraphQL. Пагинация по спецификации Relay. Разграничение доступа на уровне resolver-ов. Depth limiting и complexity limiting для защиты от DoS. Сравните REST vs GraphQL для вашего use case.

---

## Раздел 8: Observability и DevOps

**Задача 33. Структурированное логирование**
Настройте структурированное логирование для FastAPI через `structlog`. Каждый лог должен содержать: request_id, user_id (если аутентифицирован), endpoint, duration, http_status. Реализуйте correlation ID для трейсинга через несколько сервисов. Настройте разные форматы для dev (human-readable) и production (JSON для ELK/Loki). Обеспечьте маскировку чувствительных данных в логах.

---

**Задача 34. Метрики и мониторинг с Prometheus**
Интегрируйте Prometheus-метрики в FastAPI-приложение через `prometheus-fastapi-instrumentator`. Добавьте кастомные метрики: бизнес-метрики (orders_created_total, revenue_total), технические метрики (db_query_duration_seconds, cache_hit_ratio, external_api_errors_total). Настройте Grafana-дашборд. Реализуйте SLO-алерты (error budget, latency p99).

---

**Задача 35. Distributed Tracing с OpenTelemetry**
Настройте distributed tracing через OpenTelemetry для FastAPI-приложения. Автоматическая инструментация FastAPI, SQLAlchemy, httpx, Redis. Кастомные span-ы для бизнес-операций с атрибутами. Propagation контекста через HTTP-заголовки (W3C TraceContext). Экспорт в Jaeger или Grafana Tempo. Реализуйте sampling стратегию (100% dev, 10% prod, 100% errors).

---

**Задача 36. OpenAPI и документация API**
Настройте и расширьте автоматически генерируемую OpenAPI-документацию. Кастомизируйте Swagger UI и ReDoc (брендинг, аутентификация прямо в UI). Добавьте rich descriptions, examples для всех схем и эндпоинтов, корректные response codes и их описания, deprecation markers для устаревших эндпоинтов, группировку через tags с описаниями. Настройте автоматическую публикацию документации при деплое.

---

## Раздел 9: Масштабируемость и продвинутые паттерны

**Задача 37. Микросервисная архитектура с FastAPI**
Спроектируйте разбиение монолита на микросервисы. Определите bounded contexts и границы сервисов, реализуйте service-to-service коммуникацию (sync через HTTP + async через очередь), API Gateway паттерн (через nginx или Traefik), distributed sessions и аутентификацию между сервисами, distributed transactions через Saga паттерн. Обоснуйте, когда микросервисы уместны, а когда модульный монолит лучше.

---

**Задача 38. Кэширование на уровне HTTP и CDN**
Реализуйте корректные HTTP cache headers для FastAPI. `Cache-Control` с подходящими директивами для разных эндпоинтов: публичный контент (CDN cache), приватный контент пользователя, API-ответы без кэширования. `ETag` и `Last-Modified` для conditional requests. `Vary` для content negotiation. Stale-while-revalidate для улучшения perceived performance. Настройте CloudFront или Nginx как reverse proxy с кэшированием.

---

**Задача 39. Feature Flags и конфигурация во время выполнения**
Реализуйте систему feature flags для постепенного rollout новых функций. Хранение флагов в Redis с instant update без перезапуска приложения. Targeting rules: % rollout, whitelist пользователей, сегменты (plan, region, cohort). A/B тестирование с равномерным распределением. Аудит изменений флагов. Интеграция как FastAPI dependency. Сравните с внешними сервисами (LaunchDarkly, Flagsmith).

---

**Задача 40. Zero-downtime деплой и graceful shutdown**
Реализуйте production-ready деплой FastAPI-приложения с нулевым даунтаймом. Настройте `uvicorn` с `--workers` и правильными сигналами (`SIGTERM` → graceful shutdown), реализуйте health checks (`/health/live` и `/health/ready` с разной семантикой), rolling update в Kubernetes с readiness probe, pre-stop hook для drain соединений, дождаться завершения in-flight запросов перед остановкой. Настройте горизонтальное масштабирование (HPA по CPU/RPS).

---
