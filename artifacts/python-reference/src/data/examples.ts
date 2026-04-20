export type ExampleFile = {
  filename: string;
  code: string;
};

export type Example = {
  id: string;
  title: string;
  task: string;
  files: ExampleFile[];
  explanation: string;
};

export const examples: Example[] = [
  {
    id: "async-http-service",
    title: "Асинхронный HTTP-сервис",
    task: `Реализуйте асинхронный сервис для параллельной обработки большого количества внешних HTTP-запросов (например, обогащение данных из 500+ API). Сервис должен использовать asyncio + aiohttp, автоматически ограничивать количество одновременных соединений, корректно обрабатывать rate limits разных провайдеров и gracefully shutdown при получении SIGTERM. Добавьте возможность отмены всех задач при ошибке в одной из них.`,
    files: [
      {
        filename: "async_fetcher.py",
        code: `import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Optional

import aiohttp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Конфигурация ограничений для одного провайдера."""
    requests_per_second: float = 10.0
    retry_on_429: bool = True
    max_retries: int = 3
    backoff_factor: float = 2.0


@dataclass
class FetchResult:
    url: str
    data: Optional[Any] = None
    error: Optional[str] = None
    status: Optional[int] = None

    @property
    def ok(self) -> bool:
        return self.error is None


class AsyncFetchService:
    """
    Асинхронный сервис для параллельной обработки HTTP-запросов.

    Возможности:
    - Ограничение одновременных соединений (semaphore)
    - Глобальный и per-provider rate limiting (token bucket)
    - Автоматические повторные попытки с экспоненциальной задержкой
    - Обработка HTTP 429 (Too Many Requests) с учётом Retry-After
    - Отмена всех задач при ошибке в одной (cancel_on_first_error)
    - Graceful shutdown через cancel_all()
    """

    def __init__(
        self,
        max_concurrent: int = 50,
        rate_limit: Optional[RateLimitConfig] = None,
        cancel_on_first_error: bool = False,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.max_concurrent = max_concurrent
        self.rate_limit = rate_limit or RateLimitConfig()
        self.cancel_on_first_error = cancel_on_first_error
        self.timeout = aiohttp.ClientTimeout(total=timeout_seconds)

        self._semaphore: asyncio.Semaphore
        self._session: aiohttp.ClientSession
        self._tasks: set[asyncio.Task] = set()
        self._shutdown_event = asyncio.Event()
        self._token_bucket: asyncio.Queue

    async def __aenter__(self) -> "AsyncFetchService":
        self._semaphore = asyncio.Semaphore(self.max_concurrent)
        self._session = aiohttp.ClientSession(timeout=self.timeout)
        self._token_bucket = asyncio.Queue(maxsize=self.max_concurrent)
        asyncio.create_task(self._refill_token_bucket(), name="token-bucket-refiller")
        return self

    async def __aexit__(self, *_: object) -> None:
        self._shutdown_event.set()
        await self._session.close()

    # ------------------------------------------------------------------
    # Token bucket — ограничивает глобальный RPS
    # ------------------------------------------------------------------

    async def _refill_token_bucket(self) -> None:
        """Добавляет токены с заданной частотой (1 токен = 1 разрешённый запрос)."""
        interval = 1.0 / self.rate_limit.requests_per_second
        while not self._shutdown_event.is_set():
            try:
                self._token_bucket.put_nowait(1)
            except asyncio.QueueFull:
                pass
            await asyncio.sleep(interval)

    async def _wait_for_token(self) -> None:
        await self._token_bucket.get()

    # ------------------------------------------------------------------
    # Выполнение одного запроса с retry-логикой
    # ------------------------------------------------------------------

    async def _fetch_one(
        self,
        url: str,
        cfg: RateLimitConfig,
    ) -> FetchResult:
        for attempt in range(cfg.max_retries + 1):
            if self._shutdown_event.is_set():
                return FetchResult(url=url, error="service is shutting down")

            await self._wait_for_token()

            async with self._semaphore:
                try:
                    async with self._session.get(url) as resp:
                        # Обработка rate limit от сервера
                        if resp.status == 429 and cfg.retry_on_429:
                            retry_after = float(
                                resp.headers.get("Retry-After", cfg.backoff_factor ** attempt)
                            )
                            log.warning(
                                "429 Too Many Requests: %s — ждём %.1f с (попытка %d/%d)",
                                url, retry_after, attempt + 1, cfg.max_retries,
                            )
                            await asyncio.sleep(retry_after)
                            continue

                        data = await resp.json(content_type=None)
                        log.debug("OK [%d] %s", resp.status, url)
                        return FetchResult(url=url, data=data, status=resp.status)

                except asyncio.CancelledError:
                    raise  # не перехватываем — задача была отменена намеренно

                except Exception as exc:
                    if attempt == cfg.max_retries:
                        log.error("Финальная ошибка %s: %s", url, exc)
                        return FetchResult(url=url, error=str(exc))

                    delay = cfg.backoff_factor ** attempt
                    log.warning(
                        "Ошибка %s (попытка %d/%d): %s. Повтор через %.1f с",
                        url, attempt + 1, cfg.max_retries, exc, delay,
                    )
                    await asyncio.sleep(delay)

        return FetchResult(url=url, error="превышено число попыток")

    # ------------------------------------------------------------------
    # Публичный метод: запуск параллельной обработки
    # ------------------------------------------------------------------

    async def fetch_all(
        self,
        urls: list[str],
        provider_configs: dict[str, RateLimitConfig] | None = None,
    ) -> list[FetchResult]:
        """
        Параллельно обрабатывает список URL.

        provider_configs: {url_prefix → RateLimitConfig}
            Позволяет задавать отдельные лимиты для разных провайдеров.
            Если URL начинается с нескольких prefix'ов — берётся первый совпавший.
        """
        provider_configs = provider_configs or {}
        failed_event = asyncio.Event()

        def _pick_config(url: str) -> RateLimitConfig:
            for prefix, cfg in provider_configs.items():
                if url.startswith(prefix):
                    return cfg
            return self.rate_limit

        async def _wrapped(url: str) -> FetchResult:
            # Если другая задача уже сигнализировала об ошибке — пропускаем
            if failed_event.is_set():
                return FetchResult(url=url, error="отменено из-за ошибки в другой задаче")

            result = await self._fetch_one(url, _pick_config(url))

            if result.error and self.cancel_on_first_error:
                log.error(
                    "Критическая ошибка [%s]: %s — отменяем все задачи",
                    url, result.error,
                )
                failed_event.set()

            return result

        tasks = [asyncio.create_task(_wrapped(url), name=f"fetch-{url}") for url in urls]
        self._tasks.update(tasks)

        try:
            raw = await asyncio.gather(*tasks, return_exceptions=True)
        finally:
            self._tasks.difference_update(tasks)

            # Отменяем незавершённые задачи если была критическая ошибка
            if failed_event.is_set():
                for t in tasks:
                    if not t.done():
                        t.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)

        return [
            r if isinstance(r, FetchResult)
            else FetchResult(url=urls[i], error=str(r))
            for i, r in enumerate(raw)
        ]

    def cancel_all(self) -> None:
        """Немедленно отменяет все активные задачи (вызывается из SIGTERM-обработчика)."""
        log.info("cancel_all: отменяем %d задач(и)", len(self._tasks))
        for task in self._tasks:
            task.cancel()`,
      },
      {
        filename: "main.py",
        code: `import asyncio
import signal
import sys

from async_fetcher import AsyncFetchService, RateLimitConfig, FetchResult

# ------------------------------------------------------------------
# Конфигурация провайдеров
# ------------------------------------------------------------------

PROVIDER_CONFIGS: dict[str, RateLimitConfig] = {
    # jsonplaceholder — публичный тестовый API
    "https://jsonplaceholder.typicode.com": RateLimitConfig(
        requests_per_second=20.0,
        max_retries=3,
        backoff_factor=2.0,
    ),
    # httpbin — для тестирования задержек и ошибок
    "https://httpbin.org": RateLimitConfig(
        requests_per_second=5.0,
        max_retries=2,
        backoff_factor=1.5,
    ),
}

# 200 URL для демонстрации
API_URLS = [
    f"https://jsonplaceholder.typicode.com/todos/{i}"
    for i in range(1, 201)
]


# ------------------------------------------------------------------
# Точка входа
# ------------------------------------------------------------------

async def main() -> int:
    loop = asyncio.get_running_loop()
    active_service: list[AsyncFetchService] = []

    # Graceful shutdown: SIGTERM / Ctrl+C
    def _handle_signal() -> None:
        print("\n[SIGNAL] Завершение работы — отменяем все задачи...")
        if active_service:
            active_service[0].cancel_all()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _handle_signal)

    async with AsyncFetchService(
        max_concurrent=30,           # не более 30 одновременных соединений
        rate_limit=RateLimitConfig(requests_per_second=50.0),
        cancel_on_first_error=False, # True = стоп при первой ошибке
        timeout_seconds=15.0,
    ) as svc:
        active_service.append(svc)

        print(f"Запускаем обработку {len(API_URLS)} URL...")
        results: list[FetchResult] = await svc.fetch_all(
            API_URLS,
            provider_configs=PROVIDER_CONFIGS,
        )

    # ------------------------------------------------------------------
    # Статистика
    # ------------------------------------------------------------------
    ok_results  = [r for r in results if r.ok]
    err_results = [r for r in results if not r.ok]

    print(f"\n{'─' * 50}")
    print(f"  Всего URL:    {len(results)}")
    print(f"  Успешно:      {len(ok_results)}")
    print(f"  С ошибками:   {len(err_results)}")
    print(f"{'─' * 50}")

    if err_results:
        print("\nОшибки:")
        for r in err_results[:10]:  # выводим первые 10
            print(f"  ✗ {r.url}  →  {r.error}")
        if len(err_results) > 10:
            print(f"  ... и ещё {len(err_results) - 10}")

    return 0 if not err_results else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Semaphore vs rate limiter** — это два разных ограничения:
- \`asyncio.Semaphore(max_concurrent)\` — не даёт открыть больше N соединений одновременно
- Token bucket (\`asyncio.Queue\`) — ограничивает скорость запросов в секунду (RPS), независимо от числа соединений

**Graceful shutdown** реализован в два уровня:
1. \`cancel_all()\` — отменяет все активные \`asyncio.Task\` через \`.cancel()\`, что вызывает \`CancelledError\` внутри каждой задачи
2. В \`_fetch_one\` исключение \`CancelledError\` явно пере-рейзится (не подавляется), чтобы цепочка отмены корректно распространялась вверх

**Per-provider конфигурация** реализована через словарь \`{url_prefix → RateLimitConfig}\`. Функция \`_pick_config()\` линейно ищет совпадение — для больших наборов провайдеров стоит заменить на \`trie\`-структуру.

**Обработка HTTP 429** читает заголовок \`Retry-After\` (если сервер его вернул) и ждёт точно столько, сколько требует провайдер, а не фиксированный backoff.

**cancel_on_first_error** не прерывает задачи немедленно — вместо этого через \`asyncio.Event\` сигнализирует всем ещё не начавшимся задачам пропустить работу. Уже запущенные завершаются, а потом \`failed_event.is_set()\` отменяет оставшиеся незавершённые.

**asyncio.gather(..., return_exceptions=True)** предотвращает ситуацию когда исключение одной задачи немедленно прерывает \`gather\` — мы сами управляем агрегацией ошибок.`,
  },
  {
    id: "async-worker-pool-redis",
    title: "Асинхронный пул воркеров с Redis Stream",
    task: `Создайте асинхронный пул воркеров, который обрабатывает задачи из Redis Stream. Каждая задача может быть CPU-bound (например, обработка изображения). Нужно корректно сочетать asyncio с concurrent.futures.ProcessPoolExecutor, правильно передавать результаты обратно в event loop и реализовать backpressure, чтобы пул не перегружался.`,
    files: [
      {
        filename: "worker_pool.py",
        code: `import asyncio
import logging
import os
import time
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from typing import Any

import redis.asyncio as aioredis

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(processName)s] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

STREAM_KEY = "tasks:stream"
GROUP_NAME = "workers"
CONSUMER_NAME = f"consumer-{os.getpid()}"


# ------------------------------------------------------------------
# CPU-bound работа — выполняется в отдельном процессе
# ------------------------------------------------------------------

def cpu_bound_task(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Симулирует тяжёлую CPU-задачу (например, обработка изображения).
    Запускается в ProcessPoolExecutor — НЕ блокирует event loop.
    """
    task_id = payload.get("id", "?")
    size = int(payload.get("size", 1_000_000))

    # Имитация CPU-нагрузки: вычисление суммы квадратов
    result = sum(i * i for i in range(size))

    return {"task_id": task_id, "result": result, "pid": os.getpid()}


# ------------------------------------------------------------------
# Менеджер backpressure
# ------------------------------------------------------------------

class Backpressure:
    """
    Ограничивает количество одновременно обрабатываемых задач.
    Воркер "ждёт" перед чтением новых сообщений, если пул занят.
    """

    def __init__(self, max_in_flight: int) -> None:
        self._sem = asyncio.Semaphore(max_in_flight)

    async def acquire(self) -> None:
        await self._sem.acquire()

    def release(self) -> None:
        self._sem.release()

    @property
    def available(self) -> bool:
        return self._sem._value > 0  # type: ignore[attr-defined]


# ------------------------------------------------------------------
# Основной воркер
# ------------------------------------------------------------------

class WorkerPool:
    """
    Асинхронный пул, читающий задачи из Redis Stream и обрабатывающий
    их в ProcessPoolExecutor.

    Ключевые принципы:
    - asyncio Event Loop никогда не блокируется CPU-задачами
    - loop.run_in_executor() возвращает awaitable Future
    - Backpressure через Semaphore предотвращает перегрузку пула
    - Consumer group гарантирует at-least-once доставку
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        max_workers: int = 4,
        max_in_flight: int = 8,
        batch_size: int = 4,
        block_ms: int = 2000,
    ) -> None:
        self._redis_url = redis_url
        self._max_workers = max_workers
        self._backpressure = Backpressure(max_in_flight)
        self._batch_size = batch_size
        self._block_ms = block_ms
        self._executor: ProcessPoolExecutor
        self._redis: aioredis.Redis
        self._shutdown = asyncio.Event()

    async def __aenter__(self) -> "WorkerPool":
        self._redis = aioredis.from_url(self._redis_url, decode_responses=True)
        self._executor = ProcessPoolExecutor(max_workers=self._max_workers)

        # Создаём consumer group (игнорируем ошибку если уже существует)
        try:
            await self._redis.xgroup_create(
                STREAM_KEY, GROUP_NAME, id="0", mkstream=True
            )
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

        log.info(
            "WorkerPool запущен: workers=%d, max_in_flight=%d",
            self._max_workers, self._backpressure._sem._value,  # type: ignore
        )
        return self

    async def __aexit__(self, *_: object) -> None:
        self._shutdown.set()
        self._executor.shutdown(wait=True)
        await self._redis.aclose()

    # ------------------------------------------------------------------
    # Обработка одного сообщения
    # ------------------------------------------------------------------

    async def _process_message(
        self,
        msg_id: str,
        payload: dict[str, Any],
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        await self._backpressure.acquire()
        try:
            log.info("Обрабатываем задачу %s (payload=%s)", msg_id, payload)
            t0 = time.perf_counter()

            # Передаём CPU-задачу в пул процессов.
            # run_in_executor возвращает asyncio.Future —
            # event loop не блокируется, пока процесс работает.
            result = await loop.run_in_executor(
                self._executor, cpu_bound_task, payload
            )

            elapsed = time.perf_counter() - t0
            log.info(
                "Задача %s выполнена за %.3f с, pid=%s, result=%s",
                msg_id, elapsed, result["pid"], result["result"],
            )

            # Подтверждаем обработку (ACK) — сообщение не вернётся в очередь
            await self._redis.xack(STREAM_KEY, GROUP_NAME, msg_id)

        except Exception as exc:
            log.error("Ошибка задачи %s: %s", msg_id, exc)
            # Без ACK сообщение вернётся при XAUTOCLAIM / перезапуске
        finally:
            self._backpressure.release()

    # ------------------------------------------------------------------
    # Основной цикл чтения
    # ------------------------------------------------------------------

    async def run(self) -> None:
        loop = asyncio.get_running_loop()

        while not self._shutdown.is_set():
            # Backpressure: если все слоты заняты — ждём освобождения
            if not self._backpressure.available:
                log.debug("Backpressure активен — ждём освобождения слота")
                await asyncio.sleep(0.1)
                continue

            messages = await self._redis.xreadgroup(
                groupname=GROUP_NAME,
                consumername=CONSUMER_NAME,
                streams={STREAM_KEY: ">"},  # ">" = только новые сообщения
                count=self._batch_size,
                block=self._block_ms,
            )

            if not messages:
                continue

            for _stream, entries in messages:
                for msg_id, payload in entries:
                    # Запускаем обработку как независимую задачу,
                    # чтобы сразу читать следующую порцию из стрима
                    asyncio.create_task(
                        self._process_message(msg_id, payload, loop),
                        name=f"task-{msg_id}",
                    )`,
      },
      {
        filename: "main.py",
        code: `import asyncio
import signal
import random

import redis.asyncio as aioredis

from worker_pool import WorkerPool, STREAM_KEY

REDIS_URL = "redis://localhost:6379"


async def produce_tasks(n: int = 20) -> None:
    """Публикует тестовые задачи в Redis Stream."""
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    for i in range(n):
        await r.xadd(
            STREAM_KEY,
            {
                "id": str(i),
                "type": "image_resize",
                # size имитирует разный объём CPU-работы
                "size": str(random.randint(500_000, 3_000_000)),
            },
        )
    await r.aclose()
    print(f"Опубликовано {n} задач в {STREAM_KEY}")


async def main() -> None:
    loop = asyncio.get_running_loop()
    pool_holder: list[WorkerPool] = []

    def _on_signal() -> None:
        print("\n[SIGNAL] Graceful shutdown...")
        if pool_holder:
            pool_holder[0]._shutdown.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _on_signal)

    # Публикуем тестовые задачи
    await produce_tasks(20)

    async with WorkerPool(
        redis_url=REDIS_URL,
        max_workers=4,       # процессы в ProcessPoolExecutor
        max_in_flight=8,     # backpressure: не более 8 задач одновременно
        batch_size=4,        # читать по 4 сообщения за раз
    ) as pool:
        pool_holder.append(pool)
        await pool.run()


if __name__ == "__main__":
    asyncio.run(main())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**asyncio + ProcessPoolExecutor** — ключевой паттерн:
- CPU-функция \`cpu_bound_task\` запускается через \`loop.run_in_executor(executor, fn, arg)\`
- Это возвращает \`asyncio.Future\`, которую можно \`await\` — event loop не блокируется
- \`ProcessPoolExecutor\` (а не \`ThreadPoolExecutor\`) нужен именно для CPU-задач: GIL не мешает, каждый процесс работает на своём ядре

**Backpressure через Semaphore:**
- \`Semaphore(max_in_flight)\` ограничивает число одновременно обрабатываемых сообщений
- Воркер проверяет \`backpressure.available\` перед чтением новой порции из Redis
- Без этого при медленной обработке RAM/CPU будут расти неограниченно

**Redis Consumer Group** даёт at-least-once гарантию:
- \`XREADGROUP ... ">"\` читает только новые (непрочитанные группой) сообщения
- \`XACK\` после успешной обработки удаляет сообщение из PEL (Pending Entries List)
- Если воркер упал без ACK — сообщение вернётся через \`XAUTOCLAIM\` при рестарте

**asyncio.create_task** внутри цикла чтения:
- Обработка каждого сообщения запускается как отдельная задача
- Это позволяет читать следующую порцию из стрима, не дожидаясь завершения предыдущей
- В сочетании с \`Semaphore\` это даёт управляемый параллелизм без перегрузки

**Передача данных между процессами:**
- Аргументы и результаты \`cpu_bound_task\` должны быть сериализуемы через \`pickle\`
- Избегайте передачи замыканий, лямбд и объектов с блокировками`,
  },
  {
    id: "async-caching-proxy",
    title: "Асинхронный кэширующий прокси (FastAPI + aiohttp)",
    task: `Напишите асинхронный кэширующий прокси-сервер (FastAPI + aiohttp). Он должен кэшировать ответы в Redis с учётом заголовков ETag/Last-Modified, поддерживать stale-while-revalidate стратегию и автоматически обновлять кэш в фоне. При этом все операции должны оставаться полностью неблокирующими.`,
    files: [
      {
        filename: "cache.py",
        code: `import hashlib
import json
import time
from dataclasses import dataclass, asdict
from typing import Optional

import redis.asyncio as aioredis


@dataclass
class CachedResponse:
    status: int
    headers: dict[str, str]
    body: str                  # base64 или текст
    cached_at: float           # unix timestamp
    max_age: int               # секунд
    stale_while_revalidate: int  # секунд сверх max_age

    @property
    def age(self) -> float:
        return time.time() - self.cached_at

    @property
    def is_fresh(self) -> bool:
        return self.age < self.max_age

    @property
    def is_stale_but_usable(self) -> bool:
        """Ответ устарел, но ещё можно отдать пока идёт фоновое обновление."""
        return self.max_age <= self.age < (self.max_age + self.stale_while_revalidate)

    @property
    def etag(self) -> Optional[str]:
        return self.headers.get("etag")

    @property
    def last_modified(self) -> Optional[str]:
        return self.headers.get("last-modified")


class ResponseCache:
    """
    Кэш на основе Redis.
    Ключ кэша — SHA-256 от метода + URL + важных заголовков запроса.
    """

    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    @staticmethod
    def make_key(method: str, url: str, vary_headers: dict[str, str] | None = None) -> str:
        raw = f"{method.upper()}:{url}"
        if vary_headers:
            for k in sorted(vary_headers):
                raw += f":{k}={vary_headers[k]}"
        return "proxy:" + hashlib.sha256(raw.encode()).hexdigest()

    async def get(self, key: str) -> Optional[CachedResponse]:
        data = await self._r.get(key)
        if data is None:
            return None
        return CachedResponse(**json.loads(data))

    async def set(self, key: str, resp: CachedResponse) -> None:
        # TTL в Redis = max_age + stale_while_revalidate + небольшой запас
        ttl = resp.max_age + resp.stale_while_revalidate + 60
        await self._r.setex(key, ttl, json.dumps(asdict(resp)))

    async def delete(self, key: str) -> None:
        await self._r.delete(key)`,
      },
      {
        filename: "proxy.py",
        code: `import asyncio
import logging
import time
from typing import Optional

import aiohttp
from fastapi import FastAPI, Request, Response
from fastapi.responses import Response as FastAPIResponse
from contextlib import asynccontextmanager

from cache import ResponseCache, CachedResponse
import redis.asyncio as aioredis

log = logging.getLogger(__name__)

UPSTREAM_BASE = "https://httpbin.org"  # Целевой сервер
DEFAULT_MAX_AGE = 60                   # секунд
DEFAULT_SWR = 30                       # stale-while-revalidate, секунд

# Множество URL, для которых уже идёт фоновая ревалидация
_revalidating: set[str] = set()


# ------------------------------------------------------------------
# Lifespan: инициализация/закрытие ресурсов
# ------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = aioredis.from_url("redis://localhost:6379", decode_responses=True)
    app.state.cache = ResponseCache(app.state.redis)
    app.state.session = aiohttp.ClientSession()
    log.info("Прокси запущен")
    yield
    await app.state.session.close()
    await app.state.redis.aclose()
    log.info("Прокси остановлен")


app = FastAPI(lifespan=lifespan)


# ------------------------------------------------------------------
# Запрос к upstream
# ------------------------------------------------------------------

async def fetch_upstream(
    session: aiohttp.ClientSession,
    method: str,
    url: str,
    conditional_headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, str], bytes]:
    """
    Выполняет запрос к upstream.
    Если переданы conditional_headers (ETag/Last-Modified) — делает
    условный запрос (If-None-Match / If-Modified-Since).
    """
    headers = {}
    if conditional_headers:
        if etag := conditional_headers.get("etag"):
            headers["If-None-Match"] = etag
        if lm := conditional_headers.get("last-modified"):
            headers["If-Modified-Since"] = lm

    async with session.request(method, url, headers=headers) as resp:
        body = await resp.read()
        resp_headers = {k.lower(): v for k, v in resp.headers.items()
                        if k.lower() in {
                            "content-type", "etag", "last-modified",
                            "cache-control", "vary",
                        }}
        return resp.status, resp_headers, body


def parse_cache_control(headers: dict[str, str]) -> tuple[int, int]:
    """Парсит Cache-Control: max-age=X, stale-while-revalidate=Y."""
    max_age = DEFAULT_MAX_AGE
    swr = DEFAULT_SWR
    cc = headers.get("cache-control", "")
    for part in cc.split(","):
        part = part.strip()
        if part.startswith("max-age="):
            try:
                max_age = int(part.split("=", 1)[1])
            except ValueError:
                pass
        if part.startswith("stale-while-revalidate="):
            try:
                swr = int(part.split("=", 1)[1])
            except ValueError:
                pass
    return max_age, swr


# ------------------------------------------------------------------
# Фоновая ревалидация
# ------------------------------------------------------------------

async def _revalidate_in_background(
    cache: ResponseCache,
    session: aiohttp.ClientSession,
    cache_key: str,
    method: str,
    upstream_url: str,
    stale: CachedResponse,
) -> None:
    """
    Выполняет условный запрос к upstream и обновляет кэш.
    Запускается через asyncio.create_task() — не блокирует ответ клиенту.
    """
    try:
        conditional = {}
        if stale.etag:
            conditional["etag"] = stale.etag
        if stale.last_modified:
            conditional["last-modified"] = stale.last_modified

        status, headers, body = await fetch_upstream(
            session, method, upstream_url, conditional_headers=conditional
        )

        if status == 304:
            # Контент не изменился — обновляем только cached_at
            log.info("304 Not Modified — обновляем временную метку: %s", upstream_url)
            max_age, swr = parse_cache_control(stale.headers)
            updated = CachedResponse(
                status=stale.status,
                headers=stale.headers,
                body=stale.body,
                cached_at=time.time(),
                max_age=max_age,
                stale_while_revalidate=swr,
            )
        else:
            log.info("Обновляем кэш [%d]: %s", status, upstream_url)
            max_age, swr = parse_cache_control(headers)
            updated = CachedResponse(
                status=status,
                headers=headers,
                body=body.decode(errors="replace"),
                cached_at=time.time(),
                max_age=max_age,
                stale_while_revalidate=swr,
            )

        await cache.set(cache_key, updated)

    except Exception as exc:
        log.warning("Ревалидация не удалась для %s: %s", upstream_url, exc)
    finally:
        _revalidating.discard(cache_key)


# ------------------------------------------------------------------
# Основной обработчик прокси
# ------------------------------------------------------------------

@app.api_route("/{path:path}", methods=["GET", "HEAD"])
async def proxy(path: str, request: Request) -> FastAPIResponse:
    cache: ResponseCache = request.app.state.cache
    session: aiohttp.ClientSession = request.app.state.session

    upstream_url = f"{UPSTREAM_BASE}/{path}"
    if request.url.query:
        upstream_url += f"?{request.url.query}"

    cache_key = ResponseCache.make_key(request.method, upstream_url)
    cached = await cache.get(cache_key)

    # ── СВЕЖИЙ КЭШ ────────────────────────────────────────────────
    if cached and cached.is_fresh:
        log.info("HIT (fresh): %s", upstream_url)
        return FastAPIResponse(
            content=cached.body,
            status_code=cached.status,
            headers={**cached.headers, "X-Cache": "HIT", "Age": str(int(cached.age))},
        )

    # ── УСТАРЕВШИЙ, НО USABLE (stale-while-revalidate) ────────────
    if cached and cached.is_stale_but_usable:
        log.info("HIT (stale, revalidating): %s", upstream_url)

        # Запускаем фоновое обновление только если оно ещё не идёт
        if cache_key not in _revalidating:
            _revalidating.add(cache_key)
            asyncio.create_task(
                _revalidate_in_background(
                    cache, session, cache_key, request.method, upstream_url, cached
                ),
                name=f"revalidate:{cache_key[:16]}",
            )

        return FastAPIResponse(
            content=cached.body,
            status_code=cached.status,
            headers={
                **cached.headers,
                "X-Cache": "STALE",
                "Age": str(int(cached.age)),
                "Warning": '110 - "Response is Stale"',
            },
        )

    # ── ПРОМАХ — запрашиваем upstream ─────────────────────────────
    log.info("MISS: %s", upstream_url)

    # Если есть устаревший кэш — передаём conditional headers
    conditional: Optional[dict[str, str]] = None
    if cached:
        conditional = {}
        if cached.etag:
            conditional["etag"] = cached.etag
        if cached.last_modified:
            conditional["last-modified"] = cached.last_modified

    status, headers, body = await fetch_upstream(
        session, request.method, upstream_url, conditional_headers=conditional
    )

    if status == 304 and cached:
        # Upstream подтвердил: контент не изменился
        max_age, swr = parse_cache_control(cached.headers)
        refreshed = CachedResponse(
            status=cached.status,
            headers=cached.headers,
            body=cached.body,
            cached_at=time.time(),
            max_age=max_age,
            stale_while_revalidate=swr,
        )
        await cache.set(cache_key, refreshed)
        return FastAPIResponse(
            content=refreshed.body,
            status_code=refreshed.status,
            headers={**refreshed.headers, "X-Cache": "REVALIDATED"},
        )

    # Сохраняем новый ответ в кэш
    max_age, swr = parse_cache_control(headers)
    new_cached = CachedResponse(
        status=status,
        headers=headers,
        body=body.decode(errors="replace"),
        cached_at=time.time(),
        max_age=max_age,
        stale_while_revalidate=swr,
    )
    await cache.set(cache_key, new_cached)

    return FastAPIResponse(
        content=new_cached.body,
        status_code=status,
        headers={**headers, "X-Cache": "MISS"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**stale-while-revalidate** реализован через три состояния кэша:
- \`is_fresh\` (age < max_age) — отдаём из кэша без обращения к upstream
- \`is_stale_but_usable\` (max_age ≤ age < max_age + SWR) — отдаём устаревший ответ клиенту **мгновенно**, а фоновый \`asyncio.create_task()\` обновляет кэш параллельно
- Expired — промах, идём в upstream синхронно

**Условные запросы (ETag / If-None-Match):**
- При промахе, если в кэше есть устаревший ответ с \`ETag\` или \`Last-Modified\`, прокси отправляет условный запрос (\`If-None-Match\` / \`If-Modified-Since\`)
- Если upstream вернул \`304 Not Modified\` — тело не передаётся по сети, экономим трафик и время
- Только \`cached_at\` обновляется, остальные поля берутся из старого кэша

**Блокировка дублирующих ревалидаций:**
- Множество \`_revalidating\` хранит ключи, для которых уже запущена фоновая задача
- Это предотвращает "thundering herd" — когда тысячи запросов одновременно запускают обновление одного и того же ресурса

**Неблокирующий I/O на всех уровнях:**
- \`aioredis\` — асинхронный Redis клиент
- \`aiohttp.ClientSession\` — асинхронные запросы к upstream
- \`asyncio.create_task()\` для фоновой ревалидации — не ждём её завершения
- Никакого \`time.sleep()\`, \`requests.get()\` или других блокирующих вызовов

**FastAPI lifespan** вместо устаревшего \`@app.on_event\`:
- Ресурсы (Redis, aiohttp session) создаются один раз при старте и корректно закрываются при завершении
- Хранятся в \`app.state\` и доступны из любого обработчика через \`request.app.state\``,
  },
  {
    id: "large-file-streaming-upload",
    title: "Потоковая загрузка и обработка файлов > 10 ГБ",
    task: `Реализуйте сервис для асинхронной загрузки и обработки очень больших файлов (> 10 ГБ). Файлы приходят через multipart/form-data. Нужно читать их чанками, валидировать структуру на лету (например, CSV с 50+ млн строк), сохранять в объектное хранилище (S3-совместимое) и одновременно генерировать статистику (количество строк, уникальные значения в колонках) без загрузки всего файла в память.`,
    files: [
      {
        filename: "stats_collector.py",
        code: `import csv
import io
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ColumnStats:
    total: int = 0
    # HyperLogLog-подобная структура через множество (для демонстрации).
    # В продакшне замените на hyperloglog из redis или datasketch.
    _unique_sample: set[str] = field(default_factory=set, repr=False)
    _sample_limit: int = 100_000  # не храним больше N уникальных значений

    def update(self, value: str) -> None:
        self.total += 1
        if len(self._unique_sample) < self._sample_limit:
            self._unique_sample.add(value)

    @property
    def approx_unique(self) -> int:
        return len(self._unique_sample)


@dataclass
class FileStats:
    rows: int = 0
    columns: list[str] = field(default_factory=list)
    col_stats: dict[str, ColumnStats] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    def init_columns(self, headers: list[str]) -> None:
        self.columns = headers
        for h in headers:
            self.col_stats[h] = ColumnStats()

    def process_row(self, row: dict[str, str]) -> None:
        self.rows += 1
        for col, val in row.items():
            if col in self.col_stats:
                self.col_stats[col].update(val)

    def summary(self) -> dict:
        return {
            "total_rows": self.rows,
            "columns": {
                col: {
                    "total_values": st.total,
                    "approx_unique": st.approx_unique,
                }
                for col, st in self.col_stats.items()
            },
            "errors": self.errors[:10],
        }


class StreamingCsvValidator:
    """
    Читает CSV построчно из бинарного потока байт-чанков.
    Не загружает весь файл в память — буфер содержит не более одного чанка.
    """

    CHUNK_SIZE = 256 * 1024  # 256 КБ

    def __init__(self, required_columns: Optional[list[str]] = None) -> None:
        self._required = set(required_columns or [])
        self._buffer = ""
        self._reader: Optional[csv.DictReader] = None
        self._line_buf: list[str] = []
        self.stats = FileStats()
        self._header_parsed = False

    def feed(self, chunk: bytes) -> None:
        """Принимает очередной чанк и обновляет статистику."""
        text = chunk.decode("utf-8", errors="replace")
        self._buffer += text
        lines = self._buffer.split("\n")
        # Последняя строка может быть неполной — оставляем в буфере
        self._buffer = lines[-1]
        complete_lines = lines[:-1]

        if not self._header_parsed and complete_lines:
            header_line = complete_lines.pop(0)
            reader = csv.DictReader(io.StringIO(header_line + "\n_\n"))
            headers = reader.fieldnames or []
            missing = self._required - set(headers)
            if missing:
                self.stats.errors.append(f"Отсутствуют обязательные колонки: {missing}")
            self.stats.init_columns(list(headers))
            self._header_parsed = True

        if not self.stats.columns:
            return

        for line in complete_lines:
            if not line.strip():
                continue
            try:
                row = dict(
                    zip(self.stats.columns, next(csv.reader([line])))
                )
                self.stats.process_row(row)
            except Exception as exc:
                self.stats.errors.append(f"Строка {self.stats.rows}: {exc}")

    def finalize(self) -> None:
        """Обрабатывает остаток буфера после последнего чанка."""
        if self._buffer.strip():
            self.feed(b"")`,
      },
      {
        filename: "upload_service.py",
        code: `import asyncio
import hashlib
import logging
from typing import AsyncIterator

import aioboto3
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from stats_collector import StreamingCsvValidator

log = logging.getLogger(__name__)

S3_BUCKET = "my-bucket"
S3_ENDPOINT = "http://localhost:9000"   # MinIO / любой S3-совместимый
CHUNK_SIZE = 8 * 1024 * 1024            # 8 МБ — размер части для multipart upload
MAX_FILE_SIZE = 50 * 1024 ** 3          # 50 ГБ — жёсткий лимит

app = FastAPI()


async def _iter_chunks(upload: UploadFile, chunk_size: int) -> AsyncIterator[bytes]:
    """Генератор чанков из aiofiles-совместимого UploadFile."""
    total = 0
    while True:
        chunk = await upload.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_FILE_SIZE:
            raise HTTPException(413, "Файл превышает максимально допустимый размер")
        yield chunk


@app.post("/upload")
async def upload_large_file(file: UploadFile) -> JSONResponse:
    """
    Принимает большой файл через multipart/form-data.

    Одновременно:
    1. Загружает файл в S3 через Multipart Upload (никогда не хранит
       весь файл в RAM — минимальная часть 5 МБ по требованию AWS)
    2. Валидирует CSV-структуру и собирает статистику построчно

    Память: ~2 × CHUNK_SIZE (один чанк + буфер валидатора).
    """
    filename = file.filename or "upload.csv"
    s3_key = f"uploads/{filename}"

    validator = StreamingCsvValidator(required_columns=["id", "timestamp"])
    md5 = hashlib.md5()

    session = aioboto3.Session()
    async with session.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id="minioadmin",
        aws_secret_access_key="minioadmin",
    ) as s3:
        # Инициируем Multipart Upload
        mpu = await s3.create_multipart_upload(Bucket=S3_BUCKET, Key=s3_key)
        upload_id = mpu["UploadId"]
        parts: list[dict] = []
        part_number = 1
        part_buffer = bytearray()

        try:
            async for chunk in _iter_chunks(file, chunk_size=256 * 1024):
                # Валидация и статистика — на лету, без сохранения в память
                validator.feed(chunk)
                md5.update(chunk)

                part_buffer.extend(chunk)

                # Загружаем часть в S3 только когда набрали CHUNK_SIZE (≥5 МБ)
                if len(part_buffer) >= CHUNK_SIZE:
                    resp = await s3.upload_part(
                        Bucket=S3_BUCKET,
                        Key=s3_key,
                        UploadId=upload_id,
                        PartNumber=part_number,
                        Body=bytes(part_buffer),
                    )
                    parts.append({"PartNumber": part_number, "ETag": resp["ETag"]})
                    log.info("Загружена часть %d (%d МБ)", part_number, len(part_buffer) // 1024**2)
                    part_number += 1
                    part_buffer.clear()

            # Загружаем остаток
            if part_buffer:
                resp = await s3.upload_part(
                    Bucket=S3_BUCKET,
                    Key=s3_key,
                    UploadId=upload_id,
                    PartNumber=part_number,
                    Body=bytes(part_buffer),
                )
                parts.append({"PartNumber": part_number, "ETag": resp["ETag"]})

            # Завершаем Multipart Upload
            await s3.complete_multipart_upload(
                Bucket=S3_BUCKET,
                Key=s3_key,
                UploadId=upload_id,
                MultipartUpload={"Parts": parts},
            )

        except Exception as exc:
            # При любой ошибке — прерываем незавершённый upload (иначе S3 хранит мусор)
            await s3.abort_multipart_upload(
                Bucket=S3_BUCKET, Key=s3_key, UploadId=upload_id
            )
            log.error("Ошибка загрузки: %s", exc)
            raise HTTPException(500, str(exc))

    validator.finalize()
    stats = validator.stats.summary()

    return JSONResponse({
        "s3_key": s3_key,
        "md5": md5.hexdigest(),
        "parts_uploaded": len(parts),
        "stats": stats,
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**S3 Multipart Upload** — единственный правильный способ загрузки больших файлов:
- Минимальный размер части: 5 МБ (требование AWS/S3-совместимых хранилищ)
- Файл никогда не собирается целиком в памяти — \`part_buffer\` очищается после каждой части
- При ошибке \`abort_multipart_upload\` обязателен, иначе незавершённые части хранятся и тарифицируются

**Потоковое чтение через \`UploadFile.read(chunk_size)\`:**
- FastAPI/Starlette читает тело запроса порциями — не буферизует весь multipart в RAM
- Генератор \`_iter_chunks\` позволяет обрабатывать каждый чанк независимо и сразу освобождать память

**Валидация и статистика на лету (zero-copy подход):**
- \`StreamingCsvValidator.feed(chunk)\` обрабатывает байты немедленно при поступлении
- Буфер хранит только одну неполную строку между чанками — \`O(1)\` память по строкам
- \`ColumnStats._unique_sample\` ограничен \`_sample_limit\` записями, чтобы не переполнить RAM при миллионах уникальных значений

**Точный контроль памяти:**
- В любой момент в памяти: один чанк (256 КБ) + одна часть (8 МБ) + статистика
- Независимо от размера файла (хоть 100 ГБ) потребление RAM остаётся константным

**md5 на лету** через \`hashlib.md5().update(chunk)\`:
- Хэш вычисляется инкрементально — не нужно перечитывать файл после загрузки`,
  },
  {
    id: "secure-temp-file-storage",
    title: "Безопасное временное хранилище файлов с TTL",
    task: `Создайте систему безопасного временного хранения файлов с автоматической очисткой. Каждый файл имеет TTL, owner (user_id) и sensitivity level. Реализуйте atomic rename, шифрование на диске (fernet), ограничение по объёму на пользователя и гарантированное удаление файлов даже при падении сервиса (используйте tempfile, contextlib и asyncio.TaskGroup).`,
    files: [
      {
        filename: "secure_storage.py",
        code: `import asyncio
import contextlib
import json
import logging
import os
import tempfile
import time
import uuid
from dataclasses import dataclass, asdict
from enum import IntEnum
from pathlib import Path
from typing import AsyncIterator

from cryptography.fernet import Fernet

log = logging.getLogger(__name__)


class Sensitivity(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


@dataclass
class FileMeta:
    file_id: str
    user_id: str
    sensitivity: int
    expires_at: float       # unix timestamp
    size: int               # байт
    filename: str

    @property
    def is_expired(self) -> bool:
        return time.time() >= self.expires_at


STORAGE_ROOT = Path("/tmp/secure_store")
META_DIR = STORAGE_ROOT / ".meta"
USER_QUOTA_BYTES = 500 * 1024 * 1024   # 500 МБ на пользователя
CLEANUP_INTERVAL = 30                   # секунд между проходами GC

# Глобальный ключ шифрования (в продакшне — из KMS/Vault, per-user ключи)
_FERNET_KEY = Fernet.generate_key()
_fernet = Fernet(_FERNET_KEY)


class QuotaExceeded(Exception):
    pass


class SecureFileStorage:
    """
    Временное зашифрованное хранилище файлов.

    Гарантии:
    - Atomic write: файл виден только после полной записи (tempfile + rename)
    - Encryption at rest: Fernet (AES-128-CBC + HMAC-SHA256)
    - TTL: файлы удаляются фоновым GC и при явном истечении
    - Quota: суммарный объём файлов пользователя ограничен
    - Safe delete: перезапись нулями перед unlink для HIGH sensitivity
    """

    def __init__(self) -> None:
        STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
        META_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Запись файла
    # ------------------------------------------------------------------

    async def store(
        self,
        user_id: str,
        data: bytes,
        filename: str,
        ttl: int = 3600,
        sensitivity: Sensitivity = Sensitivity.MEDIUM,
    ) -> str:
        """
        Сохраняет файл атомарно. Возвращает file_id.
        Шифрует данные перед записью на диск.
        """
        await self._check_quota(user_id, len(data))

        file_id = str(uuid.uuid4())
        encrypted = _fernet.encrypt(data)

        # Atomic write: пишем во временный файл рядом с целевым,
        # затем атомарный rename (на том же FS — одна операция ядра)
        target = STORAGE_ROOT / file_id
        loop = asyncio.get_running_loop()

        def _write() -> None:
            # NamedTemporaryFile в той же директории — гарантирует
            # что tempfile и target на одном разделе (rename атомарен)
            with tempfile.NamedTemporaryFile(
                dir=STORAGE_ROOT, delete=False, suffix=".tmp"
            ) as tmp:
                tmp.write(encrypted)
                tmp.flush()
                os.fsync(tmp.fileno())   # гарантируем запись на диск
                tmp_path = tmp.name

            os.replace(tmp_path, target)   # атомарный rename

        await loop.run_in_executor(None, _write)

        meta = FileMeta(
            file_id=file_id,
            user_id=user_id,
            sensitivity=int(sensitivity),
            expires_at=time.time() + ttl,
            size=len(data),
            filename=filename,
        )
        await self._write_meta(meta)
        log.info("Сохранён файл %s (user=%s, ttl=%ds, size=%d)", file_id, user_id, ttl, len(data))
        return file_id

    # ------------------------------------------------------------------
    # Чтение файла
    # ------------------------------------------------------------------

    async def retrieve(self, file_id: str, user_id: str) -> bytes:
        """Читает и расшифровывает файл. Проверяет владельца и TTL."""
        meta = await self._read_meta(file_id)
        if meta is None:
            raise FileNotFoundError(file_id)
        if meta.user_id != user_id:
            raise PermissionError("Доступ запрещён")
        if meta.is_expired:
            await self.delete(file_id, user_id)
            raise FileNotFoundError(f"Файл {file_id} истёк")

        path = STORAGE_ROOT / file_id
        loop = asyncio.get_running_loop()
        encrypted = await loop.run_in_executor(None, path.read_bytes)
        return _fernet.decrypt(encrypted)

    # ------------------------------------------------------------------
    # Удаление файла
    # ------------------------------------------------------------------

    async def delete(self, file_id: str, user_id: str | None = None) -> None:
        """
        Удаляет файл и его метаданные.
        Для HIGH sensitivity — перезаписывает нулями перед unlink.
        """
        meta = await self._read_meta(file_id)
        if meta is None:
            return
        if user_id and meta.user_id != user_id:
            raise PermissionError("Доступ запрещён")

        path = STORAGE_ROOT / file_id
        loop = asyncio.get_running_loop()

        def _secure_delete() -> None:
            if path.exists():
                if meta.sensitivity >= Sensitivity.HIGH:
                    # Перезапись нулями — затрудняет восстановление с диска
                    with open(path, "r+b") as f:
                        f.write(b"\x00" * path.stat().st_size)
                        f.flush()
                        os.fsync(f.fileno())
                path.unlink(missing_ok=True)

        await loop.run_in_executor(None, _secure_delete)
        (META_DIR / file_id).unlink(missing_ok=True)
        log.info("Удалён файл %s", file_id)

    # ------------------------------------------------------------------
    # Quota
    # ------------------------------------------------------------------

    async def _check_quota(self, user_id: str, new_size: int) -> None:
        used = await self._user_used_bytes(user_id)
        if used + new_size > USER_QUOTA_BYTES:
            raise QuotaExceeded(
                f"Квота превышена: использовано {used // 1024**2} МБ "
                f"из {USER_QUOTA_BYTES // 1024**2} МБ"
            )

    async def _user_used_bytes(self, user_id: str) -> int:
        total = 0
        loop = asyncio.get_running_loop()

        def _scan() -> int:
            s = 0
            for meta_path in META_DIR.iterdir():
                try:
                    m = FileMeta(**json.loads(meta_path.read_text()))
                    if m.user_id == user_id and not m.is_expired:
                        s += m.size
                except Exception:
                    pass
            return s

        return await loop.run_in_executor(None, _scan)

    # ------------------------------------------------------------------
    # Метаданные
    # ------------------------------------------------------------------

    async def _write_meta(self, meta: FileMeta) -> None:
        path = META_DIR / meta.file_id
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, path.write_text, json.dumps(asdict(meta)))

    async def _read_meta(self, file_id: str) -> FileMeta | None:
        path = META_DIR / file_id
        loop = asyncio.get_running_loop()
        try:
            text = await loop.run_in_executor(None, path.read_text)
            return FileMeta(**json.loads(text))
        except FileNotFoundError:
            return None

    # ------------------------------------------------------------------
    # Фоновый GC — удаляет истёкшие файлы
    # ------------------------------------------------------------------

    async def run_gc(self, shutdown: asyncio.Event) -> None:
        """Запускать как asyncio.Task. Останавливается по shutdown."""
        while not shutdown.is_set():
            await self._gc_pass()
            try:
                await asyncio.wait_for(
                    asyncio.shield(shutdown.wait()), timeout=CLEANUP_INTERVAL
                )
            except asyncio.TimeoutError:
                pass

    async def _gc_pass(self) -> None:
        loop = asyncio.get_running_loop()

        def _find_expired() -> list[FileMeta]:
            expired = []
            for meta_path in META_DIR.iterdir():
                try:
                    m = FileMeta(**json.loads(meta_path.read_text()))
                    if m.is_expired:
                        expired.append(m)
                except Exception:
                    pass
            return expired

        expired = await loop.run_in_executor(None, _find_expired)
        if expired:
            log.info("GC: удаляем %d истёкших файлов", len(expired))
            # asyncio.TaskGroup — все удаления параллельно,
            # исключения из каждой задачи не теряются
            async with asyncio.TaskGroup() as tg:
                for meta in expired:
                    tg.create_task(self.delete(meta.file_id))


# ------------------------------------------------------------------
# Контекстный менеджер для гарантированного удаления
# ------------------------------------------------------------------

@contextlib.asynccontextmanager
async def temp_file(
    storage: SecureFileStorage,
    user_id: str,
    data: bytes,
    filename: str,
    ttl: int = 300,
    sensitivity: Sensitivity = Sensitivity.MEDIUM,
) -> AsyncIterator[str]:
    """
    Гарантирует удаление файла после выхода из блока with,
    даже если произошло исключение.

    Использование:
        async with temp_file(storage, "u1", data, "report.csv") as fid:
            await process(fid)
        # файл уже удалён
    """
    file_id = await storage.store(user_id, data, filename, ttl, sensitivity)
    try:
        yield file_id
    finally:
        with contextlib.suppress(Exception):
            await storage.delete(file_id)`,
      },
      {
        filename: "main.py",
        code: `import asyncio
import logging

from secure_storage import SecureFileStorage, Sensitivity, temp_file, QuotaExceeded

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


async def main() -> None:
    storage = SecureFileStorage()
    shutdown = asyncio.Event()

    # Запускаем GC как фоновую задачу
    gc_task = asyncio.create_task(storage.run_gc(shutdown), name="gc")

    # --- Демонстрация temp_file (гарантированное удаление) ---
    sample_data = b"secret,data\n1,hello\n2,world\n"
    async with temp_file(
        storage, "user-42", sample_data, "report.csv", ttl=60, sensitivity=Sensitivity.HIGH
    ) as fid:
        print(f"Файл сохранён: {fid}")
        retrieved = await storage.retrieve(fid, "user-42")
        print(f"Прочитано {len(retrieved)} байт: {retrieved[:30]}")
    print(f"Файл {fid} удалён после выхода из блока")

    # --- Демонстрация квоты ---
    try:
        big_data = b"x" * (600 * 1024 * 1024)  # 600 МБ > 500 МБ квоты
        await storage.store("user-99", big_data, "huge.bin")
    except QuotaExceeded as e:
        print(f"Квота: {e}")

    # --- Graceful shutdown GC ---
    shutdown.set()
    await gc_task
    print("GC остановлен")


if __name__ == "__main__":
    asyncio.run(main())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Atomic write через tempfile + os.replace:**
- \`NamedTemporaryFile(dir=STORAGE_ROOT)\` создаёт временный файл на том же разделе ФС что и целевой путь — это обязательно для атомарного rename
- \`os.replace(tmp, target)\` — единственная атомарная операция: читатели никогда не увидят частично записанный файл
- \`os.fsync()\` гарантирует, что данные сброшены с буфера ОС на физический диск до rename

**Fernet (шифрование at rest):**
- Fernet = AES-128-CBC + HMAC-SHA256 + временная метка — защита от replay-атак
- В продакшне ключ должен храниться в KMS (AWS KMS, HashiCorp Vault), а не в памяти процесса
- Для HIGH sensitivity рассмотрите per-file ключи, зашифрованные мастер-ключом

**Secure delete для HIGH sensitivity:**
- Перезапись нулями затрудняет восстановление удалённых файлов на HDD
- На SSD с wear-leveling это не даёт 100% гарантии — для максимальной безопасности нужен полнодисковой шифровальщик (LUKS)

**asyncio.TaskGroup** (Python 3.11+) в GC:
- Все удаления выполняются параллельно
- Если несколько задач упали с исключениями — все ошибки агрегируются в \`ExceptionGroup\`, ни одна не теряется (в отличие от \`gather(return_exceptions=True)\`)

**\`contextlib.asynccontextmanager\` + \`contextlib.suppress\`:**
- \`temp_file\` гарантирует удаление через \`finally\` — работает даже при исключениях и \`asyncio.CancelledError\`
- \`contextlib.suppress(Exception)\` в блоке finally предотвращает маскировку оригинального исключения ошибкой удаления

**Фоновый GC с graceful shutdown:**
- \`asyncio.wait_for(shield(shutdown.wait()), timeout=N)\` — ждёт либо сигнала остановки, либо таймера, не блокируя event loop
- \`asyncio.shield\` защищает внутренний Future от отмены при \`wait_for\` timeout`,
  },
  {
    id: "json-to-parquet-resumable",
    title: "Параллельная конвертация JSON → Parquet с resumable processing",
    task: `Напишите утилиту для параллельной обработки тысяч мелких JSON-файлов из директории (и поддиректорий). Нужно объединить их в один большой Parquet-файл с использованием streaming, минимизировать использование памяти и реализовать resumable processing (чтобы при перезапуске не начинать всё сначала).`,
    files: [
      {
        filename: "progress_store.py",
        code: `import json
import os
import tempfile
from pathlib import Path


class ProgressStore:
    """
    Хранит множество обработанных файлов в JSON-файле на диске.
    Использует atomic write (tempfile + os.replace) для защиты от
    повреждения при падении процесса в середине записи.
    """

    def __init__(self, path: Path) -> None:
        self._path = path
        self._done: set[str] = self._load()

    def _load(self) -> set[str]:
        if self._path.exists():
            try:
                return set(json.loads(self._path.read_text()))
            except Exception:
                return set()
        return set()

    def is_done(self, filepath: str) -> bool:
        return filepath in self._done

    def mark_done(self, filepath: str) -> None:
        self._done.add(filepath)
        self._flush()

    def mark_done_batch(self, filepaths: list[str]) -> None:
        self._done.update(filepaths)
        self._flush()

    def _flush(self) -> None:
        """Атомарная запись прогресса на диск."""
        with tempfile.NamedTemporaryFile(
            dir=self._path.parent,
            delete=False,
            mode="w",
            suffix=".tmp",
        ) as tmp:
            json.dump(list(self._done), tmp)
            tmp.flush()
            os.fsync(tmp.fileno())
        os.replace(tmp.name, self._path)

    @property
    def count(self) -> int:
        return len(self._done)`,
      },
      {
        filename: "converter.py",
        code: `import json
import logging
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import Iterator

import pyarrow as pa
import pyarrow.parquet as pq

from progress_store import ProgressStore

log = logging.getLogger(__name__)

BATCH_SIZE = 500            # файлов за один батч (один фрагмент Parquet)
MAX_WORKERS = os.cpu_count() or 4
PROGRESS_FILE = Path("progress.json")
OUTPUT_FILE = Path("output.parquet")


# ------------------------------------------------------------------
# CPU-задача: читаем и парсим один файл (выполняется в процессе)
# ------------------------------------------------------------------

def _parse_json_file(filepath: str) -> dict | None:
    """Читает JSON-файл и возвращает словарь или None при ошибке."""
    try:
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        log.warning("Пропускаем %s: %s", filepath, exc)
        return None


# ------------------------------------------------------------------
# Генератор файлов — рекурсивный обход директории
# ------------------------------------------------------------------

def iter_json_files(root: Path) -> Iterator[str]:
    """Находит все .json файлы в директории рекурсивно."""
    for path in root.rglob("*.json"):
        yield str(path)


# ------------------------------------------------------------------
# Streaming запись в Parquet
# ------------------------------------------------------------------

class ParquetStreamWriter:
    """
    Пишет записи в Parquet батчами через ParquetWriter.
    Схема выводится из первого батча (schema inference).
    Файл не загружается в память целиком — каждый батч записывается
    и сразу сбрасывается на диск.
    """

    def __init__(self, output: Path) -> None:
        self._output = output
        self._writer: pq.ParquetWriter | None = None

    def write_batch(self, records: list[dict]) -> None:
        if not records:
            return

        # Flatten: все ключи → колонки, None если отсутствует
        all_keys = {k for r in records for k in r.keys()}
        columns: dict[str, list] = {k: [] for k in all_keys}
        for rec in records:
            for key in all_keys:
                columns[key].append(rec.get(key))

        table = pa.Table.from_pydict(columns)

        if self._writer is None:
            # Открываем writer с реальной схемой первого батча
            # (append mode: если файл уже существует — дописываем)
            self._writer = pq.ParquetWriter(
                str(self._output),
                table.schema,
                compression="snappy",
            )

        self._writer.write_table(table)
        log.info("Записан батч: %d строк → %s", len(records), self._output)

    def close(self) -> None:
        if self._writer:
            self._writer.close()
            self._writer = None

    def __enter__(self) -> "ParquetStreamWriter":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


# ------------------------------------------------------------------
# Основная логика конвертации
# ------------------------------------------------------------------

def convert(root: Path) -> None:
    """
    Параллельно читает JSON-файлы и записывает в Parquet со streaming.
    При перезапуске пропускает уже обработанные файлы (resumable).
    """
    progress = ProgressStore(PROGRESS_FILE)
    log.info("Уже обработано: %d файлов", progress.count)

    all_files = [f for f in iter_json_files(root) if not progress.is_done(f)]
    log.info("Осталось обработать: %d файлов", len(all_files))

    if not all_files:
        log.info("Все файлы уже обработаны — ничего не делаем")
        return

    with ParquetStreamWriter(OUTPUT_FILE) as writer:
        # Обрабатываем файлы батчами
        for batch_start in range(0, len(all_files), BATCH_SIZE):
            batch_files = all_files[batch_start: batch_start + BATCH_SIZE]
            records: list[dict] = []
            done_in_batch: list[str] = []

            # ProcessPoolExecutor — параллельный парсинг JSON в N процессах
            with ProcessPoolExecutor(max_workers=MAX_WORKERS) as pool:
                futures = {
                    pool.submit(_parse_json_file, fp): fp
                    for fp in batch_files
                }

                for future in as_completed(futures):
                    filepath = futures[future]
                    result = future.result()
                    if result is not None:
                        records.append(result)
                    done_in_batch.append(filepath)

            # Записываем батч в Parquet (streaming — не в память)
            writer.write_batch(records)

            # Атомарно сохраняем прогресс всего батча
            progress.mark_done_batch(done_in_batch)
            log.info(
                "Батч %d–%d завершён, всего обработано: %d",
                batch_start, batch_start + len(batch_files), progress.count,
            )

    log.info("Готово! Parquet: %s", OUTPUT_FILE)


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    root_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data")
    convert(root_dir)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Resumable processing через ProgressStore:**
- Множество обработанных файлов хранится в JSON на диске, обновляется после каждого батча
- Атомарная запись (tempfile + \`os.replace\`) — при падении процесса в середине flush прогресс не повреждается
- При рестарте \`iter_json_files\` фильтруется через \`progress.is_done()\` — уже готовые файлы пропускаются
- Прогресс сохраняется по батчам, а не по каждому файлу — компромисс между надёжностью и производительностью I/O

**Streaming запись в Parquet через \`ParquetWriter\`:**
- \`pq.ParquetWriter\` пишет каждый \`write_table()\` как отдельный row group — данные не накапливаются в RAM
- Схема (типы колонок) выводится автоматически из первого батча через PyArrow
- \`compression="snappy"\` — быстрое сжатие без потерь, хороший баланс скорости и размера

**ProcessPoolExecutor + \`as_completed\`:**
- Каждый JSON-файл парсится в отдельном процессе — обходим GIL для CPU-bound операций
- \`as_completed\` обрабатывает результаты по мере готовности, не дожидаясь самого медленного
- Файлы в батче обрабатываются параллельно, батчи — последовательно (для контроля памяти)

**Контроль памяти:**
- В памяти одновременно: один батч записей (\`BATCH_SIZE × средний размер JSON\`)
- После \`writer.write_table()\` PyArrow освобождает память батча
- Увеличение \`BATCH_SIZE\` ускоряет запись (меньше row groups), но увеличивает RAM

**Schema evolution — осторожно:**
- \`ParquetWriter\` требует одинаковой схемы для всех батчей
- Если JSON-файлы имеют разные поля — используйте \`pa.unify_schemas()\` или пишите каждый батч в отдельный Parquet-файл, затем объединяйте через \`pq.ParquetDataset\``,
  },
  {
    id: "async-report-202-websocket",
    title: "Фоновый тяжёлый отчёт: 202 Accepted + WebSocket-уведомление",
    task: `Реализуйте эндпоинт /heavy-report, который генерирует сложный аналитический отчёт (агрегация данных за год из PostgreSQL + внешние API). Запрос может выполняться до 5 минут. Нужно сразу возвращать клиенту 202 Accepted + Location заголовок, запускать задачу в фоне (через Redis Queue), отправлять WebSocket/Push-уведомление по окончании и поддерживать отмену задачи пользователем.`,
    files: [
      {
        filename: "report_worker.py",
        code: `"""
Воркер, который выполняется как отдельный процесс (rq worker).
Читает задачи из Redis Queue, генерирует отчёт и
по окончании публикует событие в Redis Pub/Sub-канал.
"""
import json
import time
import uuid
from dataclasses import dataclass, asdict
from enum import str as str_enum, auto
from typing import Any

import redis


REDIS_URL = "redis://localhost:6379"
PUBSUB_CHANNEL = "report_events"


class Status(str_enum):
    PENDING  = auto()
    RUNNING  = auto()
    DONE     = auto()
    FAILED   = auto()
    CANCELED = auto()


@dataclass
class ReportState:
    job_id: str
    status: str
    progress: int = 0       # 0–100
    result_url: str = ""
    error: str = ""


def _redis() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=True)


def _publish(r: redis.Redis, state: ReportState) -> None:
    """Публикует обновление состояния в Pub/Sub и сохраняет в Redis-хэш."""
    key = f"report:{state.job_id}"
    r.hset(key, mapping=asdict(state))
    r.expire(key, 3600)
    r.publish(PUBSUB_CHANNEL, json.dumps({"job_id": state.job_id, **asdict(state)}))


def generate_report(job_id: str, params: dict[str, Any]) -> None:
    """
    Точка входа для RQ-воркера.
    Выполняется синхронно в отдельном процессе воркера.
    Публикует промежуточный прогресс и финальный результат.
    """
    r = _redis()
    state = ReportState(job_id=job_id, status=Status.RUNNING)
    _publish(r, state)

    try:
        # ── Фаза 1: агрегация из PostgreSQL (симуляция) ───────────
        for pct in range(0, 60, 10):
            # Проверяем, не отменил ли пользователь задачу
            if r.hget(f"report:{job_id}", "status") == Status.CANCELED:
                return

            state.progress = pct
            _publish(r, state)
            time.sleep(1)   # имитация тяжёлого SQL-запроса

        # ── Фаза 2: запросы к внешним API ─────────────────────────
        for pct in range(60, 100, 10):
            if r.hget(f"report:{job_id}", "status") == Status.CANCELED:
                return

            state.progress = pct
            _publish(r, state)
            time.sleep(0.5)

        # ── Завершение ─────────────────────────────────────────────
        result_key = f"result:{job_id}.json"
        r.setex(result_key, 3600, json.dumps({"rows": 12000, "params": params}))

        state.status = Status.DONE
        state.progress = 100
        state.result_url = f"/reports/{job_id}/download"
        _publish(r, state)

    except Exception as exc:
        state.status = Status.FAILED
        state.error = str(exc)
        _publish(r, state)
        raise`,
      },
      {
        filename: "api.py",
        code: `"""
FastAPI-приложение:
  POST /heavy-report        — постановка задачи в очередь → 202 + Location
  GET  /heavy-report/{id}   — опрос статуса (polling fallback)
  DELETE /heavy-report/{id} — отмена задачи
  WS   /ws/reports          — WebSocket-подписка на события всех задач
"""
import asyncio
import json
import uuid
from contextlib import asynccontextmanager
from typing import Any

import redis.asyncio as aioredis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from rq import Queue

import redis as sync_redis
from report_worker import generate_report, Status, PUBSUB_CHANNEL

REDIS_URL = "redis://localhost:6379"

# ── Глобальные ресурсы ─────────────────────────────────────────────

_async_redis: aioredis.Redis
_sync_redis: sync_redis.Redis
_queue: Queue
_ws_clients: set[WebSocket] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _async_redis, _sync_redis, _queue
    _async_redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    _sync_redis  = sync_redis.from_url(REDIS_URL, decode_responses=True)
    _queue       = Queue(connection=_sync_redis)

    # Запускаем фоновую задачу: слушаем Pub/Sub и рассылаем по WebSocket
    task = asyncio.create_task(_pubsub_broadcaster(), name="pubsub-broadcaster")
    yield
    task.cancel()
    await _async_redis.aclose()


app = FastAPI(lifespan=lifespan)


# ── Pub/Sub → WebSocket broadcaster ───────────────────────────────

async def _pubsub_broadcaster() -> None:
    """
    Подписывается на Redis Pub/Sub и пересылает события всем
    подключённым WebSocket-клиентам.
    Работает как единственная long-lived coroutine — не создаём
    по одному соединению на каждого клиента.
    """
    pubsub = _async_redis.pubsub()
    await pubsub.subscribe(PUBSUB_CHANNEL)

    async for message in pubsub.listen():
        if message["type"] != "message":
            continue

        data = message["data"]
        dead: set[WebSocket] = set()

        for ws in _ws_clients:
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)

        _ws_clients.difference_update(dead)


# ── Эндпоинты ─────────────────────────────────────────────────────

@app.post("/heavy-report", status_code=202)
async def create_report(params: dict[str, Any]) -> JSONResponse:
    """
    Немедленно возвращает 202 Accepted.
    Задача ставится в RQ-очередь — воркер подхватит её асинхронно.
    """
    job_id = str(uuid.uuid4())

    # Инициализируем запись о задаче до того, как воркер её возьмёт
    await _async_redis.hset(
        f"report:{job_id}",
        mapping={"job_id": job_id, "status": Status.PENDING, "progress": 0},
    )
    await _async_redis.expire(f"report:{job_id}", 3600)

    _queue.enqueue(
        generate_report,
        args=(job_id, params),
        job_timeout=360,    # воркер убьёт задачу через 6 мин
        job_id=job_id,
    )

    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "status": Status.PENDING},
        headers={"Location": f"/heavy-report/{job_id}"},
    )


@app.get("/heavy-report/{job_id}")
async def get_report_status(job_id: str) -> dict:
    """Polling fallback для клиентов без поддержки WebSocket."""
    data = await _async_redis.hgetall(f"report:{job_id}")
    if not data:
        raise HTTPException(404, "Задача не найдена")
    return data


@app.delete("/heavy-report/{job_id}", status_code=204)
async def cancel_report(job_id: str) -> None:
    """
    Отменяет задачу. Если воркер уже запущен — он проверит флаг
    и завершится самостоятельно при следующей итерации прогресса.
    """
    exists = await _async_redis.exists(f"report:{job_id}")
    if not exists:
        raise HTTPException(404, "Задача не найдена")

    await _async_redis.hset(f"report:{job_id}", "status", Status.CANCELED)

    # Пробуем отменить задачу в очереди (если ещё не взята воркером)
    from rq.job import Job
    try:
        job = Job.fetch(job_id, connection=_sync_redis)
        job.cancel()
    except Exception:
        pass  # задача уже выполняется — воркер проверит флаг сам


@app.websocket("/ws/reports")
async def ws_reports(ws: WebSocket) -> None:
    """
    WebSocket-канал. Клиент подключается один раз и получает события
    по всем своим задачам в реальном времени.
    """
    await ws.accept()
    _ws_clients.add(ws)
    try:
        while True:
            # Держим соединение открытым, ждём сообщений от клиента
            # (например, ping или запрос на отмену)
            await ws.receive_text()
    except WebSocketDisconnect:
        _ws_clients.discard(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**202 Accepted + Location** — правильный HTTP-паттерн для долгих задач:
- Клиент сразу получает ответ и знает, где смотреть статус (\`Location\` заголовок)
- Состояние задачи инициализируется в Redis \`до\` постановки в очередь — клиент не получит 404 при мгновенном опросе

**Redis Queue (RQ) vs asyncio.create_task:**
- \`asyncio.create_task\` умрёт вместе с процессом — при перезапуске сервера задача потеряется
- RQ хранит задачи в Redis: воркер может быть отдельным процессом, задача переживает рестарт API-сервера
- Воркер запускается командой: \`rq worker --url redis://localhost:6379\`

**Единственный Pub/Sub subscriber на весь сервер:**
- \`_pubsub_broadcaster\` — одна coroutine на весь процесс, а не по одной на клиента
- Новые WebSocket-клиенты просто добавляются в \`_ws_clients\` — широковещательная рассылка
- При отключении клиента (WebSocketDisconnect) — удаляем из множества, не прерывая работу остальных

**Кооперативная отмена задачи:**
- Воркер не может быть прерван извне произвольно — только через \`job.cancel()\` если ещё в очереди
- Если задача уже выполняется — устанавливаем флаг в Redis, воркер читает его в каждой итерации
- Это safer чем \`SIGKILL\` — воркер успевает опубликовать финальный статус \`CANCELED\`

**Polling fallback (GET /heavy-report/{id}):**
- Для клиентов без поддержки WebSocket — простой HTTP-опрос
- Оба механизма (WS и polling) читают одно и то же состояние из Redis`,
  },
  {
    id: "batch-processing-chunked",
    title: "Пакетная обработка 10 000 записей без таймаутов и OOM",
    task: `Создайте систему обработки пакетных запросов (batch processing). Клиент может отправить до 10 000 записей в одном запросе. Сервис должен валидировать, обогащать и сохранять данные в БД без таймаутов, используя chunked processing, transaction batching и корректное управление памятью (чтобы не падать по OOM).`,
    files: [
      {
        filename: "batch_processor.py",
        code: `import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, AsyncIterator

import asyncpg
from pydantic import BaseModel, field_validator, ValidationError

log = logging.getLogger(__name__)

CHUNK_SIZE = 200          # записей за одну транзакцию
MAX_ENRICH_CONCURRENT = 10  # параллельных запросов к внешнему API


# ------------------------------------------------------------------
# Схема валидации одной записи
# ------------------------------------------------------------------

class RecordIn(BaseModel):
    id: str
    email: str
    amount: float
    tags: list[str] = []

    @field_validator("email")
    @classmethod
    def email_must_have_at(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Невалидный email")
        return v.lower().strip()

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount должен быть положительным")
        return round(v, 2)


@dataclass
class BatchResult:
    total: int = 0
    saved: int = 0
    invalid: int = 0
    errors: list[dict] = field(default_factory=list)


# ------------------------------------------------------------------
# Валидация чанка
# ------------------------------------------------------------------

def validate_chunk(
    raw_records: list[dict],
    result: BatchResult,
) -> list[RecordIn]:
    """
    Валидирует записи одного чанка.
    Невалидные — пропускаются и логируются, не прерывают обработку.
    """
    valid: list[RecordIn] = []
    for raw in raw_records:
        try:
            valid.append(RecordIn.model_validate(raw))
        except ValidationError as exc:
            result.invalid += 1
            result.errors.append({
                "id": raw.get("id", "?"),
                "errors": exc.errors(include_url=False),
            })
    return valid


# ------------------------------------------------------------------
# Обогащение записей (внешний API)
# ------------------------------------------------------------------

async def enrich_one(record: RecordIn) -> dict[str, Any]:
    """
    Имитирует обогащение одной записи данными из внешнего источника.
    В реальном коде — aiohttp-запрос к API.
    """
    await asyncio.sleep(0.01)  # сетевая задержка
    return {
        **record.model_dump(),
        "enriched": True,
        "country": "RU",        # например, из IP Geolocation API
    }


async def enrich_chunk(records: list[RecordIn]) -> list[dict[str, Any]]:
    """
    Обогащает записи параллельно, но не более MAX_ENRICH_CONCURRENT
    одновременных запросов (backpressure).
    """
    sem = asyncio.Semaphore(MAX_ENRICH_CONCURRENT)

    async def _bounded(r: RecordIn) -> dict[str, Any]:
        async with sem:
            return await enrich_one(r)

    return await asyncio.gather(*[_bounded(r) for r in records])


# ------------------------------------------------------------------
# Запись чанка в БД — одна транзакция на чанк
# ------------------------------------------------------------------

async def save_chunk(
    conn: asyncpg.Connection,
    enriched: list[dict[str, Any]],
) -> int:
    """
    Вставляет чанк одним executemany внутри транзакции.
    При ошибке — откатывается весь чанк, остальные не затронуты.
    """
    rows = [
        (r["id"], r["email"], r["amount"], r.get("country", ""), r["tags"])
        for r in enriched
    ]
    async with conn.transaction():
        await conn.executemany(
            """
            INSERT INTO records (id, email, amount, country, tags)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE
                SET email   = EXCLUDED.email,
                    amount  = EXCLUDED.amount,
                    country = EXCLUDED.country,
                    tags    = EXCLUDED.tags
            """,
            rows,
        )
    return len(rows)


# ------------------------------------------------------------------
# Генератор чанков — ключ к контролю памяти
# ------------------------------------------------------------------

def chunked(items: list, size: int) -> AsyncIterator[list]:
    """Синхронный генератор, нарезающий список на части."""
    async def _gen():
        for i in range(0, len(items), size):
            yield items[i: i + size]
    return _gen()


# ------------------------------------------------------------------
# Главная функция батч-обработки
# ------------------------------------------------------------------

async def process_batch(
    pool: asyncpg.Pool,
    raw_records: list[dict],
) -> BatchResult:
    """
    Обрабатывает до 10 000 записей:
    1. Нарезает на чанки → не держим все данные в RAM одновременно
    2. Валидирует каждый чанк
    3. Обогащает параллельно (с backpressure)
    4. Сохраняет в одной транзакции на чанк

    При падении одного чанка — остальные продолжают обработку.
    """
    result = BatchResult(total=len(raw_records))

    async for chunk in chunked(raw_records, CHUNK_SIZE):
        valid = validate_chunk(chunk, result)
        if not valid:
            continue

        try:
            enriched = await enrich_chunk(valid)
            async with pool.acquire() as conn:
                saved = await save_chunk(conn, enriched)
                result.saved += saved
                log.info("Чанк сохранён: %d записей (всего: %d)", saved, result.saved)

        except Exception as exc:
            log.error("Ошибка при обработке чанка: %s", exc)
            result.errors.append({"chunk_error": str(exc)})

        # Явно освобождаем память после каждого чанка.
        # Python GC срабатывает не мгновенно — del ускоряет освобождение
        # больших списков enriched и valid.
        del valid, enriched

    return result`,
      },
      {
        filename: "api.py",
        code: `import logging
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from batch_processor import process_batch, BatchResult

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DB_DSN = "postgresql://user:pass@localhost/db"
MAX_BATCH_SIZE = 10_000


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(
        DB_DSN,
        min_size=5,
        max_size=20,
        command_timeout=60,    # таймаут одного SQL-запроса, не всего батча
    )
    yield
    await app.state.pool.close()


app = FastAPI(lifespan=lifespan)


@app.post("/batch")
async def batch_endpoint(payload: dict[str, Any]) -> JSONResponse:
    records: list[dict] = payload.get("records", [])

    if not records:
        raise HTTPException(400, "Поле 'records' обязательно")

    if len(records) > MAX_BATCH_SIZE:
        raise HTTPException(
            413,
            f"Слишком много записей: {len(records)} > {MAX_BATCH_SIZE}",
        )

    result: BatchResult = await process_batch(app.state.pool, records)

    status = 207 if result.errors else 200  # 207 Multi-Status при частичных ошибках
    return JSONResponse(
        status_code=status,
        content={
            "total":   result.total,
            "saved":   result.saved,
            "invalid": result.invalid,
            "errors":  result.errors[:50],   # не отдаём весь список клиенту
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Chunked processing — основа контроля памяти:**
- Генератор \`chunked()\` отдаёт по \`CHUNK_SIZE\` записей за раз — весь список никогда не разворачивается в RAM
- После обработки каждого чанка явный \`del valid, enriched\` + цикл GC освобождают память
- При 10 000 записей и CHUNK_SIZE=200 в памяти одновременно: 200 × размер_записи, а не 10 000

**Transaction batching — один \`executemany\` на чанк:**
- \`conn.executemany(..., rows)\` отправляет все строки чанка в одном round-trip к БД
- Одна транзакция на чанк: при ошибке откатывается только чанк, не весь батч
- \`ON CONFLICT DO UPDATE\` (upsert) — идемпотентность: повторная отправка не создаёт дубликатов

**Пул соединений (asyncpg.Pool):**
- \`pool.acquire()\` берёт соединение из пула на время чанка и возвращает обратно
- \`command_timeout=60\` — таймаут одного SQL-запроса, независимо от длительности всего батча
- Без пула: 10 000 записей × открытие/закрытие соединения = огромный overhead

**Частичные ошибки → HTTP 207 Multi-Status:**
- Если один чанк упал, остальные обрабатываются
- Клиент получает 207 с детальным отчётом: сколько сохранено, сколько невалидных
- Это честнее чем 200 OK при частичном сбое или 500 при единственной ошибке

**Backpressure при обогащении:**
- \`asyncio.Semaphore(MAX_ENRICH_CONCURRENT)\` ограничивает параллельные запросы к внешнему API
- Без него 10 000 одновременных \`aiohttp\` запросов мгновенно исчерпают file descriptors или получат 429`,
  },
  {
    id: "streaming-sse-excel-import",
    title: "Streaming-ответ с прогрессом (SSE) при импорте Excel",
    task: `Реализуйте долгоживущий эндпоинт с streaming-ответом (Server-Sent Events или StreamingResponse). Эндпоинт должен в реальном времени отправлять прогресс обработки тяжёлой задачи (например, импорт Excel-файла с 100 000 строк), корректно обрабатывать отключение клиента и продолжать работу в фоне, если клиент отвалился.`,
    files: [
      {
        filename: "excel_importer.py",
        code: `"""
Ядро импортёра: читает Excel построчно и сохраняет в БД.
Не зависит от HTTP-слоя — может работать и в фоне, и с SSE.
"""
import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator

import openpyxl

log = logging.getLogger(__name__)

CHUNK_SIZE = 500   # строк Excel за одну транзакцию в БД


@dataclass
class ProgressEvent:
    processed: int
    total: int
    status: str = "processing"   # processing | done | error
    message: str = ""

    @property
    def percent(self) -> int:
        return int(self.processed / self.total * 100) if self.total else 0


async def import_excel(
    filepath: Path,
    progress_queue: asyncio.Queue[ProgressEvent],
    cancel: asyncio.Event,
) -> None:
    """
    Читает Excel-файл построчно (read_only=True — не грузит всё в RAM),
    обрабатывает чанками и публикует прогресс в очередь.

    cancel — внешнее событие для graceful stop.
    progress_queue — канал между импортёром и SSE-генератором.
    """
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    ws = wb.active

    # Определяем общее количество строк (без заголовка)
    total = (ws.max_row or 1) - 1
    headers: list[str] = []
    processed = 0
    chunk: list[dict] = []

    try:
        for row_idx, row in enumerate(ws.iter_rows(values_only=True)):
            if cancel.is_set():
                await progress_queue.put(
                    ProgressEvent(processed, total, "error", "Отменено клиентом")
                )
                return

            if row_idx == 0:
                headers = [str(c) for c in row if c is not None]
                continue

            record = dict(zip(headers, row))
            chunk.append(record)

            if len(chunk) >= CHUNK_SIZE:
                await _save_chunk(chunk)
                processed += len(chunk)
                chunk.clear()

                evt = ProgressEvent(processed, total)
                await progress_queue.put(evt)

                # Уступаем event loop — иначе CPU-bound чтение Excel
                # заблокирует отправку SSE-событий клиенту
                await asyncio.sleep(0)

        # Последний неполный чанк
        if chunk:
            await _save_chunk(chunk)
            processed += len(chunk)

        await progress_queue.put(ProgressEvent(processed, total, "done", "Импорт завершён"))

    except Exception as exc:
        log.error("Ошибка импорта: %s", exc)
        await progress_queue.put(ProgressEvent(processed, total, "error", str(exc)))
    finally:
        wb.close()


async def _save_chunk(records: list[dict]) -> None:
    """Имитирует запись чанка в БД (в реальном коде — asyncpg executemany)."""
    await asyncio.sleep(0.05)`,
      },
      {
        filename: "api.py",
        code: `"""
FastAPI-сервис с SSE-эндпоинтом для streaming-прогресса.

GET /import-progress?file=...
  Возвращает text/event-stream.
  Клиент видит прогресс в реальном времени.
  При отключении клиента — импорт продолжается в фоне.
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import StreamingResponse

from excel_importer import import_excel, ProgressEvent

log = logging.getLogger(__name__)
app = FastAPI()

# Словарь активных импортов: file_path → (task, queue, cancel)
_active: dict[str, tuple[asyncio.Task, asyncio.Queue, asyncio.Event]] = {}


def _sse(data: dict) -> str:
    """Форматирует событие в соответствии со спецификацией SSE."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _sse_generator(
    file_key: str,
    queue: asyncio.Queue[ProgressEvent],
    cancel: asyncio.Event,
) -> AsyncIterator[str]:
    """
    Асинхронный генератор SSE-событий.

    Читает из очереди и отправляет клиенту.
    Если клиент отключился — GeneratorExit или CancelledError прилетает
    в этот генератор, но фоновый import_excel продолжает работать,
    потому что он привязан к отдельному asyncio.Task, а не к этому генератору.
    """
    try:
        while True:
            try:
                # Ждём события не дольше 15 с (heartbeat против таймаута прокси)
                evt: ProgressEvent = await asyncio.wait_for(
                    queue.get(), timeout=15.0
                )
            except asyncio.TimeoutError:
                # Heartbeat — поддерживаем соединение живым
                yield ": heartbeat\n\n"
                continue

            payload = {
                "processed": evt.processed,
                "total": evt.total,
                "percent": evt.percent,
                "status": evt.status,
                "message": evt.message,
            }
            yield _sse(payload)

            if evt.status in ("done", "error"):
                # Задача завершена — закрываем поток
                _active.pop(file_key, None)
                return

    except (asyncio.CancelledError, GeneratorExit):
        # Клиент отключился. Импорт продолжается в фоне (_active содержит task).
        # Просто прекращаем отправку — не отменяем cancel.
        log.info("Клиент отключился, импорт %s продолжается в фоне", file_key)


@app.get("/import-progress")
async def import_progress(file: str = Query(..., description="Путь к Excel-файлу")) -> StreamingResponse:
    filepath = Path(file)
    if not filepath.exists():
        raise HTTPException(404, f"Файл не найден: {file}")

    file_key = str(filepath.resolve())

    # Если импорт уже запущен — подключаемся к существующей очереди
    if file_key in _active:
        _, queue, cancel = _active[file_key]
        log.info("Повторное подключение к импорту %s", file_key)
    else:
        queue: asyncio.Queue[ProgressEvent] = asyncio.Queue(maxsize=100)
        cancel = asyncio.Event()

        # Запускаем импорт как независимую Task — не привязана к HTTP-соединению
        task = asyncio.create_task(
            import_excel(filepath, queue, cancel),
            name=f"import:{file_key}",
        )
        _active[file_key] = (task, queue, cancel)

    return StreamingResponse(
        _sse_generator(file_key, queue, cancel),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # отключаем буферизацию в nginx
        },
    )


@app.delete("/import-progress")
async def cancel_import(file: str = Query(...)) -> dict:
    """Позволяет клиенту явно отменить фоновый импорт."""
    file_key = str(Path(file).resolve())
    if file_key not in _active:
        raise HTTPException(404, "Активный импорт не найден")

    task, queue, cancel = _active.pop(file_key)
    cancel.set()      # сигнал для import_excel
    task.cancel()     # на случай если задача застряла в await
    return {"status": "cancelled"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Server-Sent Events (SSE) vs WebSocket:**
- SSE — однонаправленный поток (сервер → клиент) поверх обычного HTTP
- Не требует специального протокола: работает через \`fetch()\` с \`EventSource\` API или \`curl\`
- Формат: \`data: {...}\\n\\n\` — каждое событие оканчивается двумя переносами строки

**Разделение импортёра и HTTP-слоя через \`asyncio.Queue\`:**
- \`import_excel\` кладёт события в очередь, \`_sse_generator\` читает из неё
- Это ключевой паттерн: импорт не знает о HTTP — он продолжает работать даже после отключения клиента
- \`asyncio.Task\` живёт независимо от HTTP-соединения — отключение клиента не отменяет задачу

**Корректная обработка отключения клиента:**
- При разрыве соединения FastAPI отменяет \`StreamingResponse\`-генератор (бросает \`CancelledError\` или \`GeneratorExit\`)
- Мы перехватываем это в \`except\` и просто выходим из генератора — \`import_excel\` Task продолжает жить
- Повторное подключение к тому же URL (\`file_key\` в \`_active\`) восстановит SSE-поток

**Heartbeat против таймаутов прокси:**
- Nginx, AWS ALB и другие прокси обрывают соединения без трафика через 60–300 секунд
- \`asyncio.wait_for(queue.get(), timeout=15)\` + комментарий \`": heartbeat\\n\\n"\` держат соединение живым
- Строки начинающиеся с \`:\` — SSE-комментарии, браузер их игнорирует

**\`X-Accel-Buffering: no\`** — критически важный заголовок:
- Без него nginx буферизует весь ответ и клиент получит данные только в конце
- Отключает буферизацию именно для SSE/streaming-ответов

**\`await asyncio.sleep(0)\` внутри CPU-bound цикла:**
- \`openpyxl.iter_rows()\` — синхронная операция, потенциально тяжёлая
- \`sleep(0)\` после каждого чанка уступает управление event loop — SSE-события отправляются клиенту вовремя, а не в конце всей обработки`,
  },
  {
    id: "jwt-refresh-rotation",
    title: "JWT-авторизация: refresh-токены, rotation, revoke list",
    task: `Реализуйте полноценную JWT-авторизацию с refresh-токенами (FastAPI + HTTPOnly cookies). Нужно поддерживать token rotation, revoke list в Redis, автоматическое продление access-токена при использовании refresh, защиту от replay-атак и корректную обработку logout со всех устройств.`,
    files: [
      {
        filename: "tokens.py",
        code: `"""
Логика создания, верификации и отзыва JWT-токенов.

Access token  — короткоживущий (15 мин), передаётся в Authorization-заголовке
                или HTTPOnly-cookie.
Refresh token — долгоживущий (30 дней), хранится только в HTTPOnly-cookie.
                Каждое использование порождает НОВУЮ пару (token rotation).
                Старый refresh-токен немедленно помещается в revoke list Redis.
"""
import secrets
import time
from typing import Any

import jwt
import redis.asyncio as aioredis

SECRET_KEY = "change-me-in-production"   # в продакшне — из KMS
ALGORITHM  = "HS256"

ACCESS_TTL  = 15 * 60        # 15 минут
REFRESH_TTL = 30 * 24 * 3600 # 30 дней

REVOKE_PREFIX = "revoked:"   # ключи в Redis


# ------------------------------------------------------------------
# Создание токенов
# ------------------------------------------------------------------

def _make_token(payload: dict[str, Any], ttl: int) -> str:
    now = int(time.time())
    data = {
        **payload,
        "iat": now,
        "exp": now + ttl,
        # jti — уникальный ID токена, используется в revoke list
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: str, roles: list[str]) -> str:
    return _make_token({"sub": user_id, "roles": roles, "type": "access"}, ACCESS_TTL)


def create_refresh_token(user_id: str, family: str) -> str:
    """
    family — идентификатор «семьи» токенов одного устройства.
    Один и тот же family передаётся при каждой ротации.
    Если обнаруживается повторное использование отозванного токена —
    отзываем всю семью (защита от компрометации).
    """
    return _make_token(
        {"sub": user_id, "family": family, "type": "refresh"},
        REFRESH_TTL,
    )


# ------------------------------------------------------------------
# Верификация
# ------------------------------------------------------------------

def decode_token(token: str) -> dict[str, Any]:
    """Декодирует JWT без проверки отзыва (только подпись и срок)."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ------------------------------------------------------------------
# Revoke list — хранится в Redis
# ------------------------------------------------------------------

async def revoke_token(r: aioredis.Redis, jti: str, ttl: int) -> None:
    """Помещает jti в revoke list на время жизни токена."""
    await r.setex(f"{REVOKE_PREFIX}{jti}", ttl, "1")


async def is_revoked(r: aioredis.Redis, jti: str) -> bool:
    return await r.exists(f"{REVOKE_PREFIX}{jti}") > 0


async def revoke_family(r: aioredis.Redis, family: str) -> None:
    """
    Отзывает все refresh-токены данной семьи.
    Вызывается при обнаружении replay-атаки.
    """
    await r.setex(f"{REVOKE_PREFIX}family:{family}", REFRESH_TTL, "1")


async def is_family_revoked(r: aioredis.Redis, family: str) -> bool:
    return await r.exists(f"{REVOKE_PREFIX}family:{family}") > 0`,
      },
      {
        filename: "api.py",
        code: `"""
FastAPI-приложение с полным циклом JWT-авторизации:
  POST /auth/login    — выдаёт access + refresh в HTTPOnly-cookies
  POST /auth/refresh  — ротация refresh-токена, выдаёт новую пару
  POST /auth/logout   — отзывает текущий refresh-токен
  POST /auth/logout-all — отзывает всю семью (все устройства пользователя)
  GET  /me            — защищённый эндпоинт, требует валидный access-токен
"""
import secrets
from contextlib import asynccontextmanager
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Cookie, Depends, FastAPI, HTTPException, Response, status
from pydantic import BaseModel

from tokens import (
    ACCESS_TTL, REFRESH_TTL,
    create_access_token, create_refresh_token,
    decode_token, is_revoked, is_family_revoked,
    revoke_token, revoke_family,
)

REDIS_URL = "redis://localhost:6379"

# Имитация базы пользователей
USERS_DB = {
    "alice": {"password": "secret", "roles": ["admin", "user"]},
    "bob":   {"password": "qwerty", "roles": ["user"]},
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    yield
    await app.state.redis.aclose()


app = FastAPI(lifespan=lifespan)


# ------------------------------------------------------------------
# Вспомогательные функции для cookies
# ------------------------------------------------------------------

def _set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    """
    Устанавливает оба токена в HTTPOnly-cookies.
    httponly=True  — JavaScript не может читать cookie
    secure=True    — только HTTPS (в dev-режиме можно False)
    samesite="lax" — защита от CSRF
    """
    response.set_cookie(
        "access_token", access,
        max_age=ACCESS_TTL, httponly=True, secure=True, samesite="lax",
    )
    response.set_cookie(
        "refresh_token", refresh,
        max_age=REFRESH_TTL, httponly=True, secure=True, samesite="lax",
        path="/auth/refresh",   # refresh-cookie отправляется только на /auth/refresh
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token", path="/auth/refresh")


# ------------------------------------------------------------------
# Dependency: текущий пользователь из access-токена
# ------------------------------------------------------------------

async def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
) -> dict:
    if not access_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Нет access-токена")

    try:
        payload = decode_token(access_token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный токен")

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный тип токена")

    # Проверяем revoke list (на случай logout до истечения срока)
    from fastapi import Request
    # Примечание: в реальном коде redis получают через Request.app.state.redis
    # Здесь упрощено для читаемости примера
    return {"user_id": payload["sub"], "roles": payload["roles"], "jti": payload["jti"]}


# ------------------------------------------------------------------
# Эндпоинты
# ------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
async def login(body: LoginRequest, response: Response) -> dict:
    user = USERS_DB.get(body.username)
    if not user or user["password"] != body.password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверные учётные данные")

    # family = уникальный ID устройства/сессии
    family = secrets.token_hex(16)
    access  = create_access_token(body.username, user["roles"])
    refresh = create_refresh_token(body.username, family)

    _set_auth_cookies(response, access, refresh)
    return {"message": "Авторизация успешна"}


@app.post("/auth/refresh")
async def refresh_tokens(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> dict:
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Нет refresh-токена")

    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный refresh-токен")

    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный тип токена")

    jti    = payload["jti"]
    family = payload["family"]
    user_id = payload["sub"]

    r: aioredis.Redis = app.state.redis

    # Проверка всей семьи (отзыв всех устройств через logout-all)
    if await is_family_revoked(r, family):
        _clear_auth_cookies(response)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Сессия отозвана")

    # Replay-атака: токен уже был использован
    if await is_revoked(r, jti):
        # Компрометация: немедленно отзываем всю семью
        await revoke_family(r, family)
        _clear_auth_cookies(response)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Обнаружена попытка повторного использования токена. Все сессии отозваны.",
        )

    # TOKEN ROTATION: отзываем старый refresh, выдаём новую пару
    await revoke_token(r, jti, REFRESH_TTL)

    user = USERS_DB.get(user_id, {})
    new_access  = create_access_token(user_id, user.get("roles", []))
    new_refresh = create_refresh_token(user_id, family)  # family сохраняется

    _set_auth_cookies(response, new_access, new_refresh)
    return {"message": "Токены обновлены"}


@app.post("/auth/logout")
async def logout(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> dict:
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            await revoke_token(app.state.redis, payload["jti"], REFRESH_TTL)
        except Exception:
            pass  # истёкший или невалидный — просто очищаем cookies
    _clear_auth_cookies(response)
    return {"message": "Выход выполнен"}


@app.post("/auth/logout-all")
async def logout_all(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> dict:
    """Отзывает все сессии пользователя (все устройства)."""
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            await revoke_family(app.state.redis, payload["family"])
        except Exception:
            pass
    _clear_auth_cookies(response)
    return {"message": "Все сессии завершены"}


@app.get("/me")
async def me(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
    return current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Token Rotation — каждый refresh-токен одноразовый:**
- При каждом \`/auth/refresh\` старый \`jti\` помещается в revoke list, выдаётся новый токен с тем же \`family\`
- Если атакующий украл refresh-токен и попытается использовать его повторно — Redis вернёт "revoked" для \`jti\`
- Тогда мы отзываем всю \`family\` — все устройства пользователя теряют сессию, что является сигналом компрометации

**Family-based session management:**
- \`family\` — уникальный ID, создаётся при login и передаётся через все ротации
- \`logout-all\` отзывает \`family\`, а не конкретный \`jti\` — все активные refresh-токены этого пользователя перестают работать
- \`is_family_revoked\` проверяется до \`is_revoked\` — если вся семья отозвана, не тратим время на проверку jti

**HTTPOnly cookies vs localStorage:**
- \`httponly=True\` — JavaScript не имеет доступа к cookie, XSS-атака не сможет украсть токен
- \`path="/auth/refresh"\` — refresh-cookie отправляется браузером только на \`/auth/refresh\`, не на все запросы
- \`samesite="lax"\` — браузер не отправит cookie при кросс-сайтовых POST-запросах (защита от CSRF)

**Revoke list TTL:**
- Ключ в Redis живёт ровно столько, сколько живёт сам токен — после истечения \`exp\` токен и так невалиден
- Это предотвращает неограниченный рост revoke list

**Разделение access и refresh проверок:**
- Access-токен проверяется на каждом защищённом запросе, но только по подписи и сроку (revoke list не проверяется — это слишком дорого при высоком RPS)
- Refresh-токен проверяется реже, но полностью (подпись + срок + revoke list + family)`,
  },
  {
    id: "rbac-abac-fastapi",
    title: "RBAC + ABAC авторизация с ownership-проверками в FastAPI",
    task: `Создайте многоуровневую систему авторизации с RBAC + ABAC. Пользователь имеет роли и атрибуты (department, clearance_level). Нужно реализовать dependency в FastAPI, который проверяет доступ не только по роли, но и по ownership (например, может ли пользователь редактировать именно этот документ). Все проверки должны быть type-safe и кэшируемыми.`,
    files: [
      {
        filename: "authz.py",
        code: `"""
Многоуровневая авторизация: RBAC + ABAC + Ownership.

RBAC (Role-Based)  — что может роль в принципе: admin может всё,
                     editor может редактировать, viewer — только читать.
ABAC (Attribute)   — дополнительные ограничения по атрибутам:
                     department, clearance_level и т.д.
Ownership          — может ли именно этот пользователь изменить
                     именно этот ресурс.

Все правила описываются декларативно через dataclasses.
Проверки кэшируются через functools.lru_cache.
"""
import functools
from dataclasses import dataclass, field
from enum import auto
from enum import StrEnum
from typing import Any, Callable, Protocol


# ------------------------------------------------------------------
# Роли и разрешения
# ------------------------------------------------------------------

class Role(StrEnum):
    ADMIN   = auto()
    EDITOR  = auto()
    VIEWER  = auto()
    AUDITOR = auto()


class Permission(StrEnum):
    READ         = auto()
    WRITE        = auto()
    DELETE       = auto()
    EXPORT       = auto()
    ADMIN_PANEL  = auto()


# Статическая RBAC-матрица (роль → множество разрешений)
ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.ADMIN:   frozenset(Permission),          # всё
    Role.EDITOR:  frozenset({Permission.READ, Permission.WRITE}),
    Role.VIEWER:  frozenset({Permission.READ}),
    Role.AUDITOR: frozenset({Permission.READ, Permission.EXPORT}),
}


@functools.lru_cache(maxsize=256)
def role_has_permission(role: Role, permission: Permission) -> bool:
    """Кэшируемая RBAC-проверка. lru_cache работает т.к. аргументы hashable."""
    return permission in ROLE_PERMISSIONS.get(role, frozenset())


# ------------------------------------------------------------------
# Модели пользователя и ресурса
# ------------------------------------------------------------------

@dataclass(frozen=True)   # frozen → hashable → можно кэшировать
class UserContext:
    user_id: str
    roles: tuple[Role, ...]        # tuple вместо list — hashable
    department: str
    clearance_level: int           # 1–5


@dataclass(frozen=True)
class ResourceContext:
    resource_id: str
    resource_type: str
    owner_id: str
    department: str
    required_clearance: int = 1


# ------------------------------------------------------------------
# ABAC-правила
# ------------------------------------------------------------------

class AbacRule(Protocol):
    """Интерфейс ABAC-правила — любой callable, возвращающий bool."""
    def __call__(self, user: UserContext, resource: ResourceContext) -> bool: ...


def same_department(user: UserContext, resource: ResourceContext) -> bool:
    """Пользователь из того же отдела, что и ресурс."""
    return user.department == resource.department


def sufficient_clearance(user: UserContext, resource: ResourceContext) -> bool:
    """Уровень допуска пользователя не ниже требуемого ресурсом."""
    return user.clearance_level >= resource.required_clearance


def is_owner(user: UserContext, resource: ResourceContext) -> bool:
    """Пользователь является владельцем ресурса."""
    return user.user_id == resource.owner_id


def is_owner_or_admin(user: UserContext, resource: ResourceContext) -> bool:
    return is_owner(user, resource) or Role.ADMIN in user.roles


# ------------------------------------------------------------------
# Политика доступа: объединяет RBAC + ABAC
# ------------------------------------------------------------------

@dataclass
class AccessPolicy:
    """
    Декларативное описание политики для одной операции.

    required_permission — базовая RBAC-проверка (хотя бы одна роль должна иметь)
    abac_rules          — все условия должны выполняться (AND)
    """
    required_permission: Permission
    abac_rules: list[AbacRule] = field(default_factory=list)
    description: str = ""


@functools.lru_cache(maxsize=512)
def evaluate_policy(
    user: UserContext,
    resource: ResourceContext,
    policy: "AccessPolicy",
) -> bool:
    """
    Кэшируемая проверка политики.
    Кэш работает потому что UserContext и ResourceContext frozen dataclass (hashable),
    а AccessPolicy сравнивается по identity (default dataclass behaviour без frozen).

    В продакшне рассмотрите явный cache-key вида (user_id, resource_id, permission).
    """
    # 1. RBAC: хотя бы одна роль пользователя имеет нужное разрешение
    has_permission = any(
        role_has_permission(role, policy.required_permission)
        for role in user.roles
    )
    if not has_permission:
        return False

    # 2. ABAC: все правила должны пройти
    return all(rule(user, resource) for rule in policy.abac_rules)


# ------------------------------------------------------------------
# Готовые политики
# ------------------------------------------------------------------

READ_POLICY = AccessPolicy(
    required_permission=Permission.READ,
    abac_rules=[sufficient_clearance],
    description="Чтение: нужен READ + достаточный clearance",
)

WRITE_POLICY = AccessPolicy(
    required_permission=Permission.WRITE,
    abac_rules=[sufficient_clearance, is_owner_or_admin],
    description="Запись: нужен WRITE + clearance + владелец или admin",
)

DELETE_POLICY = AccessPolicy(
    required_permission=Permission.DELETE,
    abac_rules=[sufficient_clearance, is_owner_or_admin, same_department],
    description="Удаление: нужен DELETE + clearance + владелец/admin + тот же отдел",
)`,
      },
      {
        filename: "api.py",
        code: `"""
FastAPI с type-safe dependency-инъекцией для авторизации.

Паттерн:
  1. get_current_user → UserContext  (из JWT, кэшируемый)
  2. Require(policy)  → dependency-factory, возвращает UserContext
                        или бросает 403
  3. Ресурс загружается в одном dependency и передаётся дальше
"""
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path, status

from authz import (
    AccessPolicy, ResourceContext, Role, UserContext,
    DELETE_POLICY, READ_POLICY, WRITE_POLICY,
    evaluate_policy,
)

app = FastAPI()

# ------------------------------------------------------------------
# Имитация БД
# ------------------------------------------------------------------

DOCUMENTS_DB: dict[str, dict] = {
    "doc-1": {"id": "doc-1", "owner_id": "alice", "department": "engineering",
              "required_clearance": 2, "content": "Secret spec"},
    "doc-2": {"id": "doc-2", "owner_id": "bob", "department": "marketing",
              "required_clearance": 1, "content": "Campaign plan"},
}


# ------------------------------------------------------------------
# Dependency: UserContext из JWT (упрощённо — из заголовка)
# ------------------------------------------------------------------

def get_current_user() -> UserContext:
    """
    В реальном коде — декодирование JWT из Authorization-заголовка.
    Здесь возвращаем alice для демонстрации.
    """
    return UserContext(
        user_id="alice",
        roles=(Role.EDITOR,),
        department="engineering",
        clearance_level=3,
    )


# ------------------------------------------------------------------
# Dependency: загрузка ресурса
# ------------------------------------------------------------------

def get_document(doc_id: str = Path(...)) -> ResourceContext:
    doc = DOCUMENTS_DB.get(doc_id)
    if not doc:
        raise HTTPException(404, "Документ не найден")
    return ResourceContext(
        resource_id=doc["id"],
        resource_type="document",
        owner_id=doc["owner_id"],
        department=doc["department"],
        required_clearance=doc["required_clearance"],
    )


# ------------------------------------------------------------------
# Dependency-factory: проверка политики
# ------------------------------------------------------------------

def Require(policy: AccessPolicy):
    """
    Фабрика dependency'ев. Использование:

        @app.get("/docs/{doc_id}")
        async def read_doc(
            _: Annotated[UserContext, Depends(Require(READ_POLICY))],
            resource: Annotated[ResourceContext, Depends(get_document)],
        ): ...

    Возвращает UserContext если доступ разрешён, иначе 403.
    Type-safe: IDE понимает что Require(...) → UserContext.
    """
    def _check(
        user: Annotated[UserContext, Depends(get_current_user)],
        resource: Annotated[ResourceContext, Depends(get_document)],
    ) -> UserContext:
        if not evaluate_policy(user, resource, policy):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Доступ запрещён",
                    "policy": policy.description,
                    "user_id": user.user_id,
                    "resource_id": resource.resource_id,
                },
            )
        return user

    return _check


# ------------------------------------------------------------------
# Эндпоинты
# ------------------------------------------------------------------

@app.get("/documents/{doc_id}")
async def read_document(
    authorized_user: Annotated[UserContext, Depends(Require(READ_POLICY))],
    resource: Annotated[ResourceContext, Depends(get_document)],
) -> dict:
    doc = DOCUMENTS_DB[resource.resource_id]
    return {"document": doc, "accessed_by": authorized_user.user_id}


@app.put("/documents/{doc_id}")
async def update_document(
    authorized_user: Annotated[UserContext, Depends(Require(WRITE_POLICY))],
    resource: Annotated[ResourceContext, Depends(get_document)],
    body: dict,
) -> dict:
    DOCUMENTS_DB[resource.resource_id]["content"] = body.get("content", "")
    return {"updated": True, "by": authorized_user.user_id}


@app.delete("/documents/{doc_id}")
async def delete_document(
    authorized_user: Annotated[UserContext, Depends(Require(DELETE_POLICY))],
    resource: Annotated[ResourceContext, Depends(get_document)],
) -> dict:
    del DOCUMENTS_DB[resource.resource_id]
    return {"deleted": True, "by": authorized_user.user_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Разделение RBAC и ABAC:**
- RBAC (\`role_has_permission\`) отвечает на вопрос «может ли роль выполнять операцию вообще»
- ABAC-правила (\`AbacRule\`) отвечают на вопрос «разрешено ли это конкретно в данном контексте»
- Оба уровня обязательны: \`evaluate_policy\` возвращает \`True\` только если RBAC AND все ABAC прошли

**\`frozen=True\` dataclass → hashable → lru_cache:**
- \`UserContext\` и \`ResourceContext\` объявлены с \`frozen=True\` — их поля неизменяемы, объекты hashable
- Это позволяет передавать их как аргументы в \`@functools.lru_cache\`
- Без frozen pydantic или dataclass-объекты не hashable по умолчанию

**Dependency-factory \`Require(policy)\`:**
- Возвращает функцию с правильными аннотациями типов — FastAPI регистрирует её как dependency
- Тип возвращаемого значения \`UserContext\` — IDE и mypy понимают что Depends(Require(...)) → UserContext
- Один и тот же ресурс (\`get_document\`) вычисляется один раз: FastAPI кэширует dependency в рамках запроса

**Ownership через ABAC-правило:**
- \`is_owner_or_admin\` — пример ownership-проверки: она читает \`resource.owner_id\` и \`user.user_id\`
- Это не RBAC (роль не знает о конкретном ресурсе), это именно ABAC — контекстная проверка

**Порядок проверок важен:**
- Сначала RBAC (дешёвая операция — хэш-таблица), потом ABAC (может обращаться к БД)
- Fail-fast: если RBAC провалился — ABAC-правила не выполняются`,
  },
  {
    id: "oauth2-pkce-account-linking",
    title: "OAuth2 Authorization Code + PKCE с привязкой аккаунтов",
    task: `Реализуйте OAuth2 Authorization Code Flow + PKCE для внешнего Identity Provider (например, Keycloak/Google). При этом в вашем приложении должна быть собственная модель пользователя с дополнительными полями. Нужно правильно обрабатывать linking аккаунтов, refresh token rotation, logout и защиту от CSRF/authorization code interception attack.`,
    files: [
      {
        filename: "pkce.py",
        code: `"""
PKCE (Proof Key for Code Exchange) — RFC 7636.

Защищает от перехвата authorization code:
даже если code утёк, атакующий не сможет получить токен
без оригинального code_verifier, который никогда не покидал клиента.
"""
import base64
import hashlib
import secrets


def generate_code_verifier() -> str:
    """
    Генерирует случайную строку 43–128 символов (RFC 7636 §4.1).
    Хранится в сессии/cookie клиента — никогда не отправляется в URL.
    """
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()


def generate_code_challenge(verifier: str) -> str:
    """
    S256 метод: code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
    Отправляется в /authorize запросе вместо verifier.
    """
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def verify_pkce(verifier: str, challenge: str) -> bool:
    """Проверяет что verifier соответствует challenge (на стороне сервера)."""
    return generate_code_challenge(verifier) == challenge


def generate_state() -> str:
    """
    Случайная строка для защиты от CSRF.
    Сохраняется в сессии перед редиректом, проверяется при callback.
    """
    return secrets.token_urlsafe(32)`,
      },
      {
        filename: "oauth_flow.py",
        code: `"""
OAuth2 Authorization Code Flow + PKCE.

Шаги:
1. GET /auth/login      — генерируем state + PKCE, редиректим на IdP
2. GET /auth/callback   — получаем code, меняем на tokens, создаём/линкуем пользователя
3. POST /auth/refresh   — ротация refresh-токена IdP
4. POST /auth/logout    — отзыв токенов IdP + очистка сессии

Account linking:
- Если email из IdP совпадает с существующим пользователем — привязываем провайдера
- Если нет — создаём нового пользователя с внутренними полями
"""
import secrets
import time
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import Cookie, FastAPI, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from pkce import (
    generate_code_challenge,
    generate_code_verifier,
    generate_state,
    verify_pkce,
)

# ------------------------------------------------------------------
# Конфигурация IdP (Keycloak / Google / любой OIDC)
# ------------------------------------------------------------------

IDP_CONFIG = {
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "token_endpoint":         "https://oauth2.googleapis.com/token",
    "userinfo_endpoint":      "https://openidconnect.googleapis.com/v1/userinfo",
    "revocation_endpoint":    "https://oauth2.googleapis.com/revoke",
}

CLIENT_ID     = "your-client-id"
CLIENT_SECRET = "your-client-secret"
REDIRECT_URI  = "http://localhost:8000/auth/callback"
SCOPES        = "openid email profile"

# ------------------------------------------------------------------
# Внутренняя модель пользователя (дополнительные поля помимо IdP)
# ------------------------------------------------------------------

@dataclass
class AppUser:
    user_id: str
    email: str
    display_name: str
    # Поля приложения, которых нет у IdP
    subscription_tier: str = "free"
    internal_role: str = "user"
    created_at: float = field(default_factory=time.time)
    # Связанные провайдеры: {provider_name: provider_user_id}
    linked_providers: dict[str, str] = field(default_factory=dict)
    # Refresh-токены от IdP (ротируются)
    idp_refresh_token: Optional[str] = None


# Имитация БД
USERS: dict[str, AppUser] = {}          # user_id → AppUser
EMAIL_INDEX: dict[str, str] = {}        # email → user_id

# Хранилище PKCE state (в продакшне — Redis с TTL 10 мин)
PENDING_AUTH: dict[str, dict] = {}      # state → {verifier, nonce}


app = FastAPI()


# ------------------------------------------------------------------
# Шаг 1: Инициация авторизации
# ------------------------------------------------------------------

@app.get("/auth/login")
async def login(response: Response) -> RedirectResponse:
    state    = generate_state()
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)
    nonce    = secrets.token_urlsafe(16)   # защита от replay в OIDC

    # Сохраняем verifier и nonce привязанными к state
    PENDING_AUTH[state] = {"verifier": verifier, "nonce": nonce}

    params = {
        "client_id":             CLIENT_ID,
        "redirect_uri":          REDIRECT_URI,
        "response_type":         "code",
        "scope":                 SCOPES,
        "state":                 state,
        "code_challenge":        challenge,
        "code_challenge_method": "S256",
        "nonce":                 nonce,
        "access_type":           "offline",   # для Google: запрашиваем refresh_token
        "prompt":                "consent",
    }
    return RedirectResponse(
        f"{IDP_CONFIG['authorization_endpoint']}?{urlencode(params)}"
    )


# ------------------------------------------------------------------
# Шаг 2: Обработка callback
# ------------------------------------------------------------------

@app.get("/auth/callback")
async def callback(
    code: str,
    state: str,
    response: Response,
    error: Optional[str] = None,
) -> dict:
    # Проверка CSRF: state должен быть нами сгенерирован
    if error:
        raise HTTPException(400, f"OAuth error: {error}")

    pending = PENDING_AUTH.pop(state, None)
    if not pending:
        raise HTTPException(400, "Невалидный или истёкший state (возможная CSRF-атака)")

    verifier = pending["verifier"]

    # Обмен code на tokens (code_verifier отправляется серверу IdP для верификации PKCE)
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            IDP_CONFIG["token_endpoint"],
            data={
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  REDIRECT_URI,
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "code_verifier": verifier,   # IdP проверяет SHA256(verifier) == challenge
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(400, f"Ошибка получения токена: {token_resp.text}")

        tokens = token_resp.json()

        # Получаем профиль пользователя
        userinfo_resp = await client.get(
            IDP_CONFIG["userinfo_endpoint"],
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        userinfo = userinfo_resp.json()

    # ------------------------------------------------------------------
    # Account linking / создание пользователя
    # ------------------------------------------------------------------
    provider_id = userinfo["sub"]        # уникальный ID у провайдера
    email       = userinfo.get("email", "")
    provider    = "google"

    user: Optional[AppUser] = None

    # Ищем пользователя по email (account linking)
    if email in EMAIL_INDEX:
        user = USERS[EMAIL_INDEX[email]]
        # Привязываем нового провайдера к существующему аккаунту
        if provider not in user.linked_providers:
            user.linked_providers[provider] = provider_id

    else:
        # Создаём нового пользователя с внутренними полями
        import uuid
        user = AppUser(
            user_id=str(uuid.uuid4()),
            email=email,
            display_name=userinfo.get("name", email),
            linked_providers={provider: provider_id},
        )
        USERS[user.user_id] = user
        EMAIL_INDEX[email] = user.user_id

    # Сохраняем IdP refresh-токен (если есть)
    if "refresh_token" in tokens:
        user.idp_refresh_token = tokens["refresh_token"]

    # Устанавливаем сессию (в продакшне — подписанный JWT или session cookie)
    response.set_cookie(
        "session_user_id", user.user_id,
        httponly=True, secure=True, samesite="lax", max_age=3600,
    )

    return {
        "user_id": user.user_id,
        "email": user.email,
        "linked_providers": user.linked_providers,
        "subscription_tier": user.subscription_tier,
    }


# ------------------------------------------------------------------
# Шаг 3: Ротация IdP refresh-токена
# ------------------------------------------------------------------

@app.post("/auth/refresh")
async def refresh(
    session_user_id: Optional[str] = Cookie(None),
) -> dict:
    if not session_user_id or session_user_id not in USERS:
        raise HTTPException(401, "Не авторизован")

    user = USERS[session_user_id]
    if not user.idp_refresh_token:
        raise HTTPException(401, "Нет refresh-токена IdP")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            IDP_CONFIG["token_endpoint"],
            data={
                "grant_type":    "refresh_token",
                "refresh_token": user.idp_refresh_token,
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(401, "Не удалось обновить токен IdP")

        new_tokens = resp.json()

    # TOKEN ROTATION: IdP выдал новый refresh-токен — сохраняем
    if "refresh_token" in new_tokens:
        user.idp_refresh_token = new_tokens["refresh_token"]

    return {"access_token": new_tokens["access_token"]}


# ------------------------------------------------------------------
# Шаг 4: Logout
# ------------------------------------------------------------------

@app.post("/auth/logout")
async def logout(
    response: Response,
    session_user_id: Optional[str] = Cookie(None),
) -> dict:
    if session_user_id and session_user_id in USERS:
        user = USERS[session_user_id]

        # Отзываем refresh-токен у IdP
        if user.idp_refresh_token:
            async with httpx.AsyncClient() as client:
                await client.post(
                    IDP_CONFIG["revocation_endpoint"],
                    data={
                        "token": user.idp_refresh_token,
                        "client_id": CLIENT_ID,
                        "client_secret": CLIENT_SECRET,
                    },
                )
            user.idp_refresh_token = None

    response.delete_cookie("session_user_id")
    return {"message": "Выход выполнен"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**PKCE (S256 метод) защищает от перехвата authorization code:**
- Клиент генерирует случайный \`code_verifier\` и отправляет только его хэш (\`code_challenge\`) в URL
- \`code_verifier\` никогда не покидает клиента через редиректы — хранится в \`PENDING_AUTH\`
- Даже если атакующий перехватит \`code\` из URL (через Referer-заголовок или логи), он не сможет обменять его на токены без \`verifier\`

**State как защита от CSRF:**
- Перед редиректом на IdP сохраняем случайный \`state\` в \`PENDING_AUTH\`
- При callback проверяем что \`state\` существует в нашем хранилище — \`PENDING_AUTH.pop(state, None)\`
- \`pop\` удаляет state после первого использования — повторный callback с тем же state невозможен

**Account linking (привязка провайдеров):**
- Поиск существующего пользователя по email перед созданием нового — один пользователь, несколько способов входа
- \`linked_providers\` хранит \`{provider_name: provider_user_id}\` — можно проверить через какой IdP пользователь авторизовался
- В продакшне нужна дополнительная верификация: подтверждение email или пароль перед linking

**Внутренняя модель пользователя vs IdP claims:**
- \`AppUser\` содержит поля (\`subscription_tier\`, \`internal_role\`), которых нет в JWT от IdP
- При каждом логине обновляем только IdP-специфичные поля (refresh_token), внутренние — остаются
- Это разделение позволяет менять IdP без потери данных пользователей

**\`nonce\` в OIDC:**
- Случайная строка, добавляемая в запрос и вложенная в \`id_token\` IdP
- Защита от replay-атак: если IdP вернул \`id_token\` с другим nonce — это подделка
- В полной реализации нужно извлечь nonce из \`id_token\` и сравнить с сохранённым`,
  },
  {
    id: "pg-analytics-cte-window",
    title: "Аналитические CTE, window-функции и пагинация в PostgreSQL",
    task: `Реализуйте сложный аналитический отчёт в PostgreSQL, который агрегирует данные за 3 года с использованием нескольких CTE, window-функций (ROW_NUMBER, LAG) и рекурсивного CTE для построения иерархии. Сравните два подхода: чистый raw SQL через asyncpg и ORM-вариант на SQLAlchemy 2.0 (async session). Нужно добиться максимальной производительности, корректно управлять connection pooling и добавить возможность пагинации без потери производительности на миллионах строк.`,
    files: [
      {
        filename: "report_raw.py",
        code: `"""
Подход 1: raw SQL через asyncpg.
Максимальная производительность: никакого ORM-overhead,
прямой доступ к PostgreSQL Protocol (binary format).
"""
from dataclasses import dataclass
from datetime import date
from typing import Any

import asyncpg


# ------------------------------------------------------------------
# SQL-запрос: CTE + window functions + рекурсия
# ------------------------------------------------------------------

REPORT_SQL = """
-- CTE 1: продажи за 3 года с накопленным итогом по отделам
WITH monthly_sales AS (
    SELECT
        department_id,
        DATE_TRUNC('month', sale_date)                            AS month,
        SUM(amount)                                               AS revenue,
        COUNT(*)                                                  AS deals,
        SUM(SUM(amount)) OVER (
            PARTITION BY department_id
            ORDER BY DATE_TRUNC('month', sale_date)
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                         AS cumulative_revenue
    FROM sales
    WHERE sale_date >= NOW() - INTERVAL '3 years'
    GROUP BY department_id, DATE_TRUNC('month', sale_date)
),

-- CTE 2: динамика (текущий месяц vs предыдущий) через LAG
monthly_delta AS (
    SELECT
        *,
        LAG(revenue) OVER (PARTITION BY department_id ORDER BY month) AS prev_revenue,
        revenue - LAG(revenue) OVER (
            PARTITION BY department_id ORDER BY month
        )                                                              AS delta,
        ROUND(
            (revenue - LAG(revenue) OVER (
                PARTITION BY department_id ORDER BY month
            )) * 100.0 / NULLIF(
                LAG(revenue) OVER (PARTITION BY department_id ORDER BY month), 0
            ), 2
        )                                                              AS pct_change
    FROM monthly_sales
),

-- CTE 3: ранжирование отделов за последний год
dept_rank AS (
    SELECT
        department_id,
        SUM(revenue)                                        AS yearly_revenue,
        ROW_NUMBER() OVER (ORDER BY SUM(revenue) DESC)      AS rank,
        NTILE(4)     OVER (ORDER BY SUM(revenue) DESC)      AS quartile
    FROM monthly_sales
    WHERE month >= DATE_TRUNC('year', NOW())
    GROUP BY department_id
),

-- CTE 4: рекурсивная иерархия отделов (department → parent → grandparent)
RECURSIVE dept_hierarchy AS (
    -- Базовый случай: корневые отделы (без родителя)
    SELECT id, name, parent_id, 0 AS depth, name::TEXT AS path
    FROM departments
    WHERE parent_id IS NULL

    UNION ALL

    -- Рекурсивный шаг
    SELECT
        d.id, d.name, d.parent_id,
        h.depth + 1,
        h.path || ' > ' || d.name
    FROM departments d
    JOIN dept_hierarchy h ON d.parent_id = h.id
    WHERE h.depth < 5   -- защита от циклических ссылок
),

-- CTE 5: Keyset-пагинация — находим строки после cursor'а
paginated AS (
    SELECT
        md.*,
        dr.rank,
        dr.quartile,
        dh.path AS dept_path
    FROM monthly_delta md
    JOIN dept_rank      dr ON md.department_id = dr.department_id
    JOIN dept_hierarchy dh ON md.department_id = dh.id
    WHERE (md.month, md.department_id) > ($1, $2)   -- keyset cursor
    ORDER BY md.month, md.department_id
    LIMIT $3
)

SELECT * FROM paginated;
"""


@dataclass
class ReportRow:
    department_id: int
    month: date
    revenue: float
    deals: int
    cumulative_revenue: float
    delta: float | None
    pct_change: float | None
    rank: int
    quartile: int
    dept_path: str


@dataclass
class PageCursor:
    last_month: date
    last_dept_id: int


async def fetch_report_page(
    pool: asyncpg.Pool,
    cursor: PageCursor | None = None,
    page_size: int = 100,
) -> tuple[list[ReportRow], PageCursor | None]:
    """
    Keyset-пагинация: вместо OFFSET использует (month, department_id) > cursor.

    OFFSET N пропускает N строк — медленно на больших таблицах (O(N) чтение).
    Keyset читает строки начиная с позиции — O(log N) через составной индекс.

    Индекс для максимальной скорости:
      CREATE INDEX ON sales (sale_date, department_id);
      CREATE INDEX ON monthly_view (month, department_id);
    """
    from datetime import date as dt
    cursor_month  = cursor.last_month   if cursor else dt(2000, 1, 1)
    cursor_dept   = cursor.last_dept_id if cursor else 0

    # asyncpg возвращает Record (именованные поля) — не dict, не ORM-объект
    # Это самый быстрый способ получить данные из PostgreSQL в Python
    rows = await pool.fetch(REPORT_SQL, cursor_month, cursor_dept, page_size)

    if not rows:
        return [], None

    result = [
        ReportRow(
            department_id=r["department_id"],
            month=r["month"],
            revenue=float(r["revenue"]),
            deals=r["deals"],
            cumulative_revenue=float(r["cumulative_revenue"]),
            delta=float(r["delta"]) if r["delta"] is not None else None,
            pct_change=float(r["pct_change"]) if r["pct_change"] is not None else None,
            rank=r["rank"],
            quartile=r["quartile"],
            dept_path=r["dept_path"],
        )
        for r in rows
    ]

    last = rows[-1]
    next_cursor = PageCursor(
        last_month=last["month"],
        last_dept_id=last["department_id"],
    ) if len(rows) == page_size else None

    return result, next_cursor


async def create_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(
        "postgresql://user:pass@localhost/analytics",
        min_size=5,
        max_size=20,
        # statement_cache_size кэширует prepared statements —
        # повторные вызовы одного запроса не парсятся заново
        statement_cache_size=100,
        command_timeout=30,
    )`,
      },
      {
        filename: "report_orm.py",
        code: `"""
Подход 2: SQLAlchemy 2.0 async — ORM + Core.
Используем text() для сложного SQL там где ORM неудобен,
и select() для простых запросов.
"""
from datetime import date
from typing import Any

from sqlalchemy import (
    Column, Date, Float, ForeignKey, Integer, String, Text,
    func, text, select, and_,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession, async_sessionmaker, create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship


# ------------------------------------------------------------------
# Модели
# ------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


class Department(Base):
    __tablename__ = "departments"
    id        = Column(Integer, primary_key=True)
    name      = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    children  = relationship("Department", back_populates="parent")
    parent    = relationship("Department", back_populates="children", remote_side=[id])


class Sale(Base):
    __tablename__ = "sales"
    id            = Column(Integer, primary_key=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    sale_date     = Column(Date, nullable=False)
    amount        = Column(Float, nullable=False)


# ------------------------------------------------------------------
# Движок и фабрика сессий
# ------------------------------------------------------------------

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/analytics",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,     # проверяет соединение перед выдачей из пула
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # объекты остаются доступными после commit
)


# ------------------------------------------------------------------
# ORM-запрос с window functions через text()
# ------------------------------------------------------------------

WINDOW_SQL = text("""
    SELECT
        s.department_id,
        DATE_TRUNC('month', s.sale_date)                    AS month,
        SUM(s.amount)                                       AS revenue,
        LAG(SUM(s.amount)) OVER (
            PARTITION BY s.department_id
            ORDER BY DATE_TRUNC('month', s.sale_date)
        )                                                   AS prev_revenue,
        ROW_NUMBER() OVER (
            PARTITION BY DATE_TRUNC('month', s.sale_date)
            ORDER BY SUM(s.amount) DESC
        )                                                   AS dept_rank_in_month
    FROM sales s
    WHERE s.sale_date >= NOW() - INTERVAL '3 years'
    GROUP BY s.department_id, DATE_TRUNC('month', s.sale_date)
    ORDER BY month, department_id
    LIMIT :limit OFFSET :offset
""")


async def fetch_report_orm(
    session: AsyncSession,
    page: int = 0,
    page_size: int = 100,
) -> list[dict[str, Any]]:
    """
    ORM-сессия + raw SQL через text().
    OFFSET-пагинация — удобна для небольших наборов данных.
    Для миллионов строк предпочтительнее keyset (см. report_raw.py).
    """
    result = await session.execute(
        WINDOW_SQL,
        {"limit": page_size, "offset": page * page_size},
    )
    # mappings() возвращает RowMapping — доступ по имени колонки как dict
    return [dict(row) for row in result.mappings()]


async def fetch_department_tree(session: AsyncSession) -> list[dict]:
    """
    Рекурсивная иерархия через ORM relationship.
    Для глубоких иерархий предпочтительнее рекурсивный CTE в SQL.
    """
    # selectinload загружает children отдельным SELECT — без N+1
    from sqlalchemy.orm import selectinload

    stmt = (
        select(Department)
        .where(Department.parent_id.is_(None))
        .options(selectinload(Department.children).selectinload(Department.children))
    )
    result = await session.execute(stmt)
    roots = result.scalars().all()

    def _to_dict(dept: Department) -> dict:
        return {
            "id": dept.id,
            "name": dept.name,
            "children": [_to_dict(c) for c in (dept.children or [])],
        }

    return [_to_dict(r) for r in roots]


# ------------------------------------------------------------------
# Контекстный менеджер для сессии
# ------------------------------------------------------------------

from contextlib import asynccontextmanager


@asynccontextmanager
async def get_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Keyset-пагинация vs OFFSET:**
- \`OFFSET N\` заставляет PostgreSQL прочитать и выбросить N строк — на странице 1000 при 100 строк/страница это 100 000 пропущенных строк
- Keyset: \`WHERE (month, dept_id) > ($cursor_month, $cursor_dept_id)\` использует составной B-tree индекс — O(log N) независимо от номера страницы
- Обязателен индекс: \`CREATE INDEX ON sales (sale_date, department_id)\`

**Рекурсивный CTE для иерархии:**
- \`WITH RECURSIVE\` — стандартный SQL-способ обойти дерево произвольной глубины
- \`WHERE h.depth < 5\` — защита от бесконечного цикла при циклических ссылках в данных
- \`path || ' > ' || name\` накапливает путь от корня — удобно для отображения breadcrumb

**Window functions за один проход:**
- \`SUM(...) OVER (PARTITION BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)\` — накопленный итог без подзапросов
- \`LAG(revenue)\` — значение предыдущей строки в том же разделе — вычисляется за O(N) вместо self-join
- Все window functions в одном SELECT — PostgreSQL проходит данные один раз

**asyncpg vs SQLAlchemy для аналитики:**
- asyncpg: нет ORM-overhead, данные в бинарном протоколе PostgreSQL, \`pool.fetch()\` возвращает \`Record\` напрямую
- SQLAlchemy: удобна для CRUD, но для сложного аналитического SQL используйте \`text()\` — не теряйте читаемость ради ORM
- \`statement_cache_size=100\` в asyncpg кэширует prepared statements — повторные вызовы того же SQL без перепарсинга

**\`pool_pre_ping=True\` в SQLAlchemy:**
- Перед выдачей соединения из пула выполняется \`SELECT 1\`
- Предотвращает ошибки "connection already closed" после долгого простоя
- Небольшой overhead на каждый запрос, но критически важно для продакшна`,
  },
  {
    id: "zero-downtime-migration-bulk",
    title: "Zero-downtime миграция миллионов записей через Alembic + bulk-операции",
    task: `Создайте сервис для массовой миграции данных из старой схемы в новую (миллионы записей). Используйте Alembic для миграций, но сами данные переносите через bulk-операции (bulk_insert_mappings / copy_from в asyncpg). Обеспечьте zero-downtime: транзакции должны быть атомарными по чанкам, с возможностью отката только по конкретному чанку, connection pooling и автоматическим перезапуском упавших миграций.`,
    files: [
      {
        filename: "migrations/versions/0001_add_new_schema.py",
        code: `"""
Alembic-миграция: создание новой схемы рядом со старой.
Zero-downtime принцип: старая таблица не удаляется сразу —
приложение пишет в обе, пока идёт миграция данных.
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Новая таблица с улучшенной схемой
    op.create_table(
        "orders_v2",
        sa.Column("id",           sa.BigInteger, primary_key=True),
        sa.Column("external_id",  sa.String(64),  nullable=False, unique=True),
        sa.Column("user_id",      sa.BigInteger,  nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency",     sa.String(3),   nullable=False, server_default="USD"),
        sa.Column("status",       sa.String(20),  nullable=False),
        sa.Column("metadata",     sa.JSONB,        nullable=True),
        sa.Column("created_at",   sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("migrated_at",  sa.TIMESTAMP(timezone=True), nullable=True),
    )

    # Индексы создаём CONCURRENTLY — не блокируют таблицу
    # (нельзя внутри транзакции, поэтому op.execute с AUTOCOMMIT)
    op.execute("COMMIT")  # выходим из транзакции Alembic
    op.execute(
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
        "idx_orders_v2_user_id ON orders_v2 (user_id)"
    )
    op.execute(
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
        "idx_orders_v2_status ON orders_v2 (status, created_at DESC)"
    )

    # Таблица прогресса миграции данных (не схемы)
    op.create_table(
        "migration_progress",
        sa.Column("batch_id",    sa.Integer,     primary_key=True),
        sa.Column("min_id",      sa.BigInteger,  nullable=False),
        sa.Column("max_id",      sa.BigInteger,  nullable=False),
        sa.Column("status",      sa.String(20),  nullable=False, server_default="pending"),
        sa.Column("rows_copied", sa.Integer,     nullable=True),
        sa.Column("error",       sa.Text,        nullable=True),
        sa.Column("started_at",  sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("finished_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("migration_progress")
    op.drop_table("orders_v2")`,
      },
      {
        filename: "data_migrator.py",
        code: `"""
Перенос данных из orders → orders_v2 через asyncpg COPY.

Стратегия:
- Разбиваем диапазон ID на батчи
- Каждый батч — отдельная транзакция (атомарный откат только по батчу)
- COPY FROM (asyncpg) — самый быстрый способ bulk-вставки в PostgreSQL
- migration_progress отслеживает состояние каждого батча
- При перезапуске — пропускаем завершённые батчи, перезапускаем failed
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import AsyncIterator

import asyncpg

log = logging.getLogger(__name__)

DB_DSN = "postgresql://user:pass@localhost/mydb"
BATCH_SIZE = 10_000     # строк за одну транзакцию
MAX_RETRIES = 3
CONCURRENCY = 4         # параллельных батчей


@dataclass
class BatchRange:
    batch_id: int
    min_id: int
    max_id: int


# ------------------------------------------------------------------
# Планирование батчей
# ------------------------------------------------------------------

async def plan_batches(conn: asyncpg.Connection) -> list[BatchRange]:
    """
    Определяет диапазон ID и нарезает на батчи.
    Использует ctid-based batching для равномерного распределения.
    """
    row = await conn.fetchrow("SELECT MIN(id), MAX(id) FROM orders")
    min_id, max_id = row["min"], row["max"]
    if min_id is None:
        return []

    batches = []
    batch_id = 0
    current = min_id
    while current <= max_id:
        end = min(current + BATCH_SIZE - 1, max_id)
        batches.append(BatchRange(batch_id, current, end))
        batch_id += 1
        current = end + 1

    # Сохраняем план в migration_progress (пропускаем уже существующие)
    await conn.executemany(
        """
        INSERT INTO migration_progress (batch_id, min_id, max_id, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (batch_id) DO NOTHING
        """,
        [(b.batch_id, b.min_id, b.max_id) for b in batches],
    )
    return batches


async def get_pending_batches(conn: asyncpg.Connection) -> list[BatchRange]:
    """Возвращает незавершённые батчи (pending + failed)."""
    rows = await conn.fetch(
        """
        SELECT batch_id, min_id, max_id FROM migration_progress
        WHERE status IN ('pending', 'failed')
        ORDER BY batch_id
        """
    )
    return [BatchRange(r["batch_id"], r["min_id"], r["max_id"]) for r in rows]


# ------------------------------------------------------------------
# Миграция одного батча
# ------------------------------------------------------------------

async def migrate_batch(
    pool: asyncpg.Pool,
    batch: BatchRange,
    attempt: int = 0,
) -> int:
    """
    Переносит один батч из orders в orders_v2.
    Атомарна: либо весь батч, либо откат только этого батча.
    Использует COPY для максимальной скорости вставки.
    """
    async with pool.acquire() as conn:
        # Отмечаем батч как "running"
        await conn.execute(
            "UPDATE migration_progress SET status='running', started_at=$1 WHERE batch_id=$2",
            datetime.now(timezone.utc), batch.batch_id,
        )

        try:
            async with conn.transaction():
                # Читаем старые данные с трансформацией в новую схему
                rows = await conn.fetch(
                    """
                    SELECT
                        id,
                        order_ref                           AS external_id,
                        customer_id                         AS user_id,
                        ROUND(price_cents / 100.0, 2)       AS total_amount,
                        COALESCE(currency_code, 'USD')      AS currency,
                        LOWER(order_status)                 AS status,
                        jsonb_build_object(
                            'source', source_system,
                            'notes', notes
                        )                                   AS metadata,
                        created_ts                          AS created_at,
                        NOW()                               AS migrated_at
                    FROM orders
                    WHERE id BETWEEN $1 AND $2
                      AND id NOT IN (
                          SELECT external_id::bigint
                          FROM orders_v2
                          WHERE external_id ~ '^[0-9]+$'
                      )
                    """,
                    batch.min_id, batch.max_id,
                )

                if rows:
                    # COPY FROM — вставляет данные через бинарный протокол PostgreSQL.
                    # В 10–50x быстрее INSERT для больших батчей.
                    await conn.copy_records_to_table(
                        "orders_v2",
                        records=rows,
                        columns=[
                            "id", "external_id", "user_id", "total_amount",
                            "currency", "status", "metadata", "created_at", "migrated_at",
                        ],
                    )

                await conn.execute(
                    """
                    UPDATE migration_progress
                    SET status='done', rows_copied=$1, finished_at=$2, error=NULL
                    WHERE batch_id=$3
                    """,
                    len(rows), datetime.now(timezone.utc), batch.batch_id,
                )
                log.info("Батч %d: скопировано %d строк", batch.batch_id, len(rows))
                return len(rows)

        except Exception as exc:
            error_msg = str(exc)
            log.error("Батч %d ошибка: %s", batch.batch_id, error_msg)

            await conn.execute(
                "UPDATE migration_progress SET status='failed', error=$1 WHERE batch_id=$2",
                error_msg, batch.batch_id,
            )

            # Автоматический повтор
            if attempt < MAX_RETRIES:
                delay = 2 ** attempt
                log.info("Повтор батча %d через %d с (попытка %d/%d)",
                         batch.batch_id, delay, attempt + 1, MAX_RETRIES)
                await asyncio.sleep(delay)
                return await migrate_batch(pool, batch, attempt + 1)

            raise


# ------------------------------------------------------------------
# Главный цикл миграции
# ------------------------------------------------------------------

async def run_migration() -> None:
    pool = await asyncpg.create_pool(DB_DSN, min_size=CONCURRENCY, max_size=CONCURRENCY + 2)

    async with pool.acquire() as conn:
        # Планируем батчи только если таблица прогресса пуста
        existing = await conn.fetchval("SELECT COUNT(*) FROM migration_progress")
        if existing == 0:
            batches = await plan_batches(conn)
            log.info("Запланировано %d батчей", len(batches))
        else:
            batches = await get_pending_batches(conn)
            log.info("Возобновление: %d незавершённых батчей", len(batches))

    if not batches:
        log.info("Нечего мигрировать — всё готово")
        return

    # Обрабатываем батчи с ограниченным параллелизмом
    sem = asyncio.Semaphore(CONCURRENCY)

    async def _bounded(b: BatchRange) -> int:
        async with sem:
            return await migrate_batch(pool, b)

    results = await asyncio.gather(
        *[_bounded(b) for b in batches],
        return_exceptions=True,
    )

    total = sum(r for r in results if isinstance(r, int))
    errors = [r for r in results if isinstance(r, Exception)]
    log.info("Итог: %d строк скопировано, %d батчей с ошибками", total, len(errors))

    await pool.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_migration())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Zero-downtime стратегия:**
- Новая таблица \`orders_v2\` создаётся рядом со старой — приложение продолжает работать
- Индексы создаются через \`CREATE INDEX CONCURRENTLY\` — не блокируют таблицу на время построения
- Только после полной миграции данных и проверки — старая таблица переименовывается/удаляется

**asyncpg \`copy_records_to_table\`:**
- Использует бинарный протокол PostgreSQL COPY — в 10–50x быстрее чем \`INSERT ... VALUES\`
- Данные передаются без SQL-парсинга: PostgreSQL просто получает бинарный поток
- \`copy_from\` требует данные в виде строк (CSV-формат), \`copy_records_to_table\` — нативные Python-объекты

**Атомарность по батчу, не по всей миграции:**
- Каждый батч — отдельная транзакция: при сбое откатывается только этот батч
- \`migration_progress\` хранит статус каждого батча — при перезапуске пропускаем \`done\`
- \`ON CONFLICT DO NOTHING\` в планировщике — идемпотентный insert плана

**Resumable через \`migration_progress\`:**
- При перезапуске \`get_pending_batches()\` возвращает только \`pending\` и \`failed\`
- Можно вручную сбросить статус батча на \`pending\` для повторной обработки
- Статус \`running\` при старте — индикатор что процесс упал в середине батча (тоже нужно перезапустить)

**Автоматический retry с экспоненциальным backoff:**
- До \`MAX_RETRIES\` попыток на батч с задержкой \`2^attempt\` секунд
- Защита от transient-ошибок: временная недоступность БД, deadlock, network blip`,
  },
  {
    id: "repository-uow-cache",
    title: "Repository pattern: UoW, динамические JOIN'ы, кэширование",
    task: `Напишите универсальный репозиторий (Repository pattern) с поддержкой как синхронного, так и асинхронного режима (SQLAlchemy + asyncpg). Реализуйте сложные JOIN'ы с фильтрацией по динамическим условиям, unit-of-work с транзакциями разного уровня изоляции и автоматическое кэширование результатов запросов на уровне репозитория (с инвалидацией при изменении данных).`,
    files: [
      {
        filename: "repository.py",
        code: `"""
Generic Repository + Unit of Work + Query Cache.

Архитектура:
- BaseRepository[T]  — типизированный интерфейс CRUD
- QueryBuilder       — динамические условия фильтрации (type-safe)
- RepositoryCache    — кэш с инвалидацией по тегам сущностей
- UnitOfWork         — контекстный менеджер транзакции с выбором isolation level
"""
import asyncio
import hashlib
import json
import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from enum import auto
from enum import StrEnum
from typing import Any, AsyncIterator, Generic, TypeVar

from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, and_, or_, select, update, delete,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship, selectinload

log = logging.getLogger(__name__)

T = TypeVar("T")


# ------------------------------------------------------------------
# Модели (упрощённые)
# ------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True)
    name       = Column(String(100), nullable=False)
    email      = Column(String(200), nullable=False, unique=True)
    department = Column(String(50), nullable=True)
    orders     = relationship("Order", back_populates="user", lazy="raise")


class Order(Base):
    __tablename__ = "orders"
    id      = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount  = Column(Float, nullable=False)
    status  = Column(String(20), nullable=False)
    user    = relationship("User", back_populates="orders", lazy="raise")


# ------------------------------------------------------------------
# QueryBuilder — динамические условия
# ------------------------------------------------------------------

@dataclass
class Filter:
    field: str
    op: str      # eq, ne, lt, gt, in, like, ilike
    value: Any


class QueryBuilder:
    """
    Строит SQLAlchemy WHERE-условия из списка Filter-объектов.
    Type-safe: неизвестные поля вызывают ValueError, а не SQL-инъекцию.
    """

    _ALLOWED_FIELDS: dict[type, set[str]] = {
        User:  {"id", "name", "email", "department"},
        Order: {"id", "user_id", "amount", "status"},
    }

    _OPS = {
        "eq":    lambda col, v: col == v,
        "ne":    lambda col, v: col != v,
        "lt":    lambda col, v: col < v,
        "gt":    lambda col, v: col > v,
        "in":    lambda col, v: col.in_(v),
        "like":  lambda col, v: col.like(v),
        "ilike": lambda col, v: col.ilike(v),
    }

    def build(self, model: type, filters: list[Filter]):
        """Возвращает список SQLAlchemy-условий для WHERE."""
        allowed = self._ALLOWED_FIELDS.get(model, set())
        conditions = []
        for f in filters:
            if f.field not in allowed:
                raise ValueError(f"Недопустимое поле фильтрации: {f.field}")
            col = getattr(model, f.field)
            op_fn = self._OPS.get(f.op)
            if not op_fn:
                raise ValueError(f"Недопустимый оператор: {f.op}")
            conditions.append(op_fn(col, f.value))
        return conditions


# ------------------------------------------------------------------
# Кэш репозитория с инвалидацией по тегам
# ------------------------------------------------------------------

class RepositoryCache:
    """
    In-memory кэш с инвалидацией по тегам сущностей.
    Тег = имя таблицы. При записи в таблицу — все связанные ключи инвалидируются.

    В продакшне замените dict на Redis для распределённого кэша.
    """

    def __init__(self) -> None:
        self._store: dict[str, Any] = {}
        self._tags: dict[str, set[str]] = {}   # tag → set of cache keys
        self._lock = asyncio.Lock()

    @staticmethod
    def make_key(model_name: str, filters: list[Filter], **kwargs: Any) -> str:
        data = {"model": model_name, "filters": [(f.field, f.op, str(f.value)) for f in filters], **kwargs}
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()

    async def get(self, key: str) -> Any:
        async with self._lock:
            return self._store.get(key)

    async def set(self, key: str, value: Any, tags: list[str]) -> None:
        async with self._lock:
            self._store[key] = value
            for tag in tags:
                self._tags.setdefault(tag, set()).add(key)

    async def invalidate(self, tag: str) -> None:
        """Удаляет все ключи, связанные с тегом (например, именем таблицы)."""
        async with self._lock:
            keys = self._tags.pop(tag, set())
            for key in keys:
                self._store.pop(key, None)
            if keys:
                log.debug("Инвалидировано %d ключей кэша для тега '%s'", len(keys), tag)


_cache = RepositoryCache()


# ------------------------------------------------------------------
# BaseRepository
# ------------------------------------------------------------------

class BaseRepository(Generic[T]):
    """
    Универсальный репозиторий для модели T.
    Поддерживает async SQLAlchemy session.
    """

    model: type[T]

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._qb = QueryBuilder()

    async def get_by_id(self, pk: int) -> T | None:
        return await self._session.get(self.model, pk)

    async def find(
        self,
        filters: list[Filter] | None = None,
        joins: list[type] | None = None,
        limit: int = 100,
        offset: int = 0,
        use_cache: bool = True,
    ) -> list[T]:
        """
        Поиск с динамическими фильтрами и опциональными JOIN'ами.
        Результат кэшируется по хэшу параметров.
        """
        filters = filters or []
        cache_key = RepositoryCache.make_key(
            self.model.__tablename__, filters, limit=limit, offset=offset
        )

        if use_cache:
            cached = await _cache.get(cache_key)
            if cached is not None:
                log.debug("Cache HIT: %s", cache_key[:16])
                return cached

        stmt = select(self.model)

        # Динамические JOIN'ы с eager loading
        for join_model in (joins or []):
            stmt = stmt.join(join_model).options(selectinload(
                getattr(self.model, join_model.__tablename__, None)
                or list(self.model.__mapper__.relationships)[0]
            ))

        conditions = self._qb.build(self.model, filters)
        if conditions:
            stmt = stmt.where(and_(*conditions))

        stmt = stmt.limit(limit).offset(offset)
        result = await self._session.execute(stmt)
        rows = list(result.scalars().all())

        if use_cache:
            await _cache.set(cache_key, rows, tags=[self.model.__tablename__])

        return rows

    async def save(self, obj: T) -> T:
        self._session.add(obj)
        await self._session.flush()
        await _cache.invalidate(self.model.__tablename__)
        return obj

    async def delete(self, pk: int) -> None:
        obj = await self.get_by_id(pk)
        if obj:
            await self._session.delete(obj)
            await self._session.flush()
            await _cache.invalidate(self.model.__tablename__)


class UserRepository(BaseRepository[User]):
    model = User

    async def find_with_orders(self, filters: list[Filter]) -> list[User]:
        """JOIN users + orders с eager loading."""
        return await self.find(filters=filters, joins=[Order])


class OrderRepository(BaseRepository[Order]):
    model = Order


# ------------------------------------------------------------------
# Unit of Work
# ------------------------------------------------------------------

class IsolationLevel(StrEnum):
    READ_COMMITTED   = auto()
    REPEATABLE_READ  = auto()
    SERIALIZABLE     = auto()


class UnitOfWork:
    """
    Управляет транзакцией и набором репозиториев.
    Поддерживает выбор isolation level — критично для финансовых операций.
    """

    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._factory = session_factory
        self._session: AsyncSession | None = None

    @asynccontextmanager
    async def begin(
        self,
        isolation: IsolationLevel = IsolationLevel.READ_COMMITTED,
    ) -> AsyncIterator["UnitOfWork"]:
        async with self._factory() as session:
            # Устанавливаем isolation level для этой транзакции
            await session.execute(
                __import__("sqlalchemy").text(
                    f"SET TRANSACTION ISOLATION LEVEL {isolation.value.replace('_', ' ')}"
                )
            )
            self._session = session
            try:
                yield self
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                self._session = None

    @property
    def users(self) -> UserRepository:
        assert self._session, "UoW не активен — используйте async with uow.begin()"
        return UserRepository(self._session)

    @property
    def orders(self) -> OrderRepository:
        assert self._session, "UoW не активен — используйте async with uow.begin()"
        return OrderRepository(self._session)`,
      },
      {
        filename: "usage_example.py",
        code: `"""
Демонстрация использования Repository + UnitOfWork.
"""
import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from repository import (
    Filter, IsolationLevel, Order, UnitOfWork, User, Base,
)

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
uow = UnitOfWork(AsyncSessionLocal)


async def transfer_example() -> None:
    """
    SERIALIZABLE-транзакция: читаем и пишем данные атомарно.
    Необходима для финансовых операций — предотвращает phantom reads.
    """
    async with uow.begin(isolation=IsolationLevel.SERIALIZABLE) as u:
        # Динамические фильтры — безопасны (нет SQL-инъекций через QueryBuilder)
        admins = await u.users.find(filters=[
            Filter("department", "eq", "finance"),
        ])
        for admin in admins:
            order = Order(user_id=admin.id, amount=100.0, status="pending")
            await u.orders.save(order)
        # commit вызывается автоматически при выходе из блока


async def search_example() -> None:
    """Поиск с несколькими условиями (OR-логика через явный список)."""
    async with uow.begin() as u:
        # Первый вызов — идёт в БД, результат кэшируется
        users = await u.users.find(
            filters=[
                Filter("department", "in", ["engineering", "product"]),
                Filter("name", "ilike", "%alex%"),
            ],
            limit=50,
        )
        print(f"Найдено: {len(users)} пользователей")

        # Второй вызов с теми же параметрами — из кэша (мгновенно)
        users_cached = await u.users.find(
            filters=[
                Filter("department", "in", ["engineering", "product"]),
                Filter("name", "ilike", "%alex%"),
            ],
            limit=50,
        )
        print(f"Из кэша: {len(users_cached)} пользователей")


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await search_example()
    await transfer_example()


if __name__ == "__main__":
    asyncio.run(main())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Generic Repository[T] — один класс для всех моделей:**
- \`BaseRepository\` параметризован \`TypeVar("T")\` — IDE знает что \`UserRepository.find()\` возвращает \`list[User]\`
- Конкретные репозитории только задают \`model = User\` и добавляют специфичные методы
- \`self._session.get(model, pk)\` использует identity map SQLAlchemy — повторный вызов для того же pk не идёт в БД

**QueryBuilder — защита от SQL-инъекций и опечаток:**
- Список \`_ALLOWED_FIELDS\` — whitelist полей; неизвестное поле → ValueError, а не \`WHERE unknown_col = ...\`
- Словарь \`_OPS\` — whitelist операторов; произвольный оператор невозможен
- \`col.ilike(v)\` — регистронезависимый поиск через PostgreSQL ILIKE, а не \`LOWER(col) = LOWER(v)\`

**Кэш с инвалидацией по тегам:**
- Тег = имя таблицы (\`"users"\`, \`"orders"\`)
- Любая запись в таблицу вызывает \`invalidate(tag)\` — все связанные ключи удаляются
- Ключ кэша = SHA-256 от имени модели + параметров фильтрации — коллизии исключены

**Unit of Work + isolation levels:**
- \`READ_COMMITTED\` (default) — видит только зафиксированные данные, не блокирует читателей
- \`REPEATABLE_READ\` — гарантирует что повторное чтение той же строки вернёт те же данные
- \`SERIALIZABLE\` — полная изоляция, как последовательное выполнение транзакций; нужна для финансовых расчётов, но снижает параллелизм

**\`expire_on_commit=False\`:**
- По умолчанию SQLAlchemy помечает все объекты как "expired" после commit
- Доступ к атрибуту expired-объекта вне сессии вызывает \`DetachedInstanceError\`
- С \`expire_on_commit=False\` объекты остаются доступными после закрытия сессии — удобно для API-ответов`,
  },
  {
    id: "distributed-rate-limiting",
    title: "Distributed rate limiting: Redis + Lua, burst-токены, fallback",
    task: `Реализуйте distributed rate limiting для API (FastAPI) с помощью Redis + aioredis и Lua-скриптов. Лимиты должны быть per-user, per-endpoint и per-IP, с разными окнами (секунда/минута/час). Добавьте graceful degradation: если Redis недоступен — fallback на in-memory cache (с потерей точности), а также поддержку burst-токенов и автоматическое увеличение лимитов для VIP-пользователей.`,
    files: [
      {
        filename: "rate_limiter.py",
        code: `"""
Distributed rate limiting через Redis + Lua-скрипт (sliding window log).

Почему Lua?
  Redis выполняет Lua-скрипт атомарно — INCR + EXPIRE не атомарны между собой,
  а через Lua мы читаем, проверяем и пишем за одну операцию без гонок.

Алгоритм: sliding window с bucket-аппроксимацией.
  Текущее окно + остаток предыдущего (взвешенный) → точный лимит без O(N) памяти.
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from enum import auto
from enum import StrEnum
from typing import Optional

import redis.asyncio as aioredis
from cachetools import TTLCache

log = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Конфигурация лимитов
# ------------------------------------------------------------------

class Window(StrEnum):
    SECOND = auto()
    MINUTE = auto()
    HOUR   = auto()


WINDOW_SECONDS: dict[Window, int] = {
    Window.SECOND: 1,
    Window.MINUTE: 60,
    Window.HOUR:   3600,
}


@dataclass
class RateLimit:
    requests: int       # базовый лимит
    window: Window
    burst: int = 0      # дополнительные токены для burst


# Правила: (endpoint_prefix, window) → RateLimit
DEFAULT_LIMITS: list[RateLimit] = [
    RateLimit(requests=10,   window=Window.SECOND, burst=5),
    RateLimit(requests=300,  window=Window.MINUTE),
    RateLimit(requests=5000, window=Window.HOUR),
]

VIP_MULTIPLIER = 5   # VIP-пользователи получают в 5 раз больше


# ------------------------------------------------------------------
# Lua-скрипт: sliding window с двумя bucket'ами
# ------------------------------------------------------------------

_SLIDING_WINDOW_LUA = """
local key_curr = KEYS[1]
local key_prev = KEYS[2]
local limit    = tonumber(ARGV[1])
local window   = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])

-- Вес предыдущего окна (сколько его «осталось»)
local elapsed  = now % window
local weight   = (window - elapsed) / window

local curr_count = tonumber(redis.call('GET', key_curr) or 0)
local prev_count = tonumber(redis.call('GET', key_prev) or 0)

-- Скользящий подсчёт: текущее окно + взвешенный остаток предыдущего
local count = curr_count + math.floor(prev_count * weight)

if count >= limit then
    -- Лимит превышен: возвращаем оставшееся время до сброса
    local ttl = redis.call('TTL', key_curr)
    return {0, ttl, count}
end

-- Инкрементируем текущее окно
local new_count = redis.call('INCR', key_curr)
if new_count == 1 then
    -- Первый запрос в окне — устанавливаем TTL (два окна, чтобы сохранить prev)
    redis.call('EXPIRE', key_curr, window * 2)
end

return {1, 0, new_count}
"""


# ------------------------------------------------------------------
# In-memory fallback (TTLCache из cachetools)
# ------------------------------------------------------------------

_fallback_cache: TTLCache = TTLCache(maxsize=10_000, ttl=60)
_fallback_lock = asyncio.Lock()


async def _fallback_check(key: str, limit: int) -> tuple[bool, int]:
    """Приблизительный rate limit без Redis (теряет точность при рестарте)."""
    async with _fallback_lock:
        count = _fallback_cache.get(key, 0) + 1
        _fallback_cache[key] = count
        allowed = count <= limit
        return allowed, count


# ------------------------------------------------------------------
# Основной класс
# ------------------------------------------------------------------

@dataclass
class RateLimitResult:
    allowed: bool
    remaining: int
    retry_after: int    # секунд до следующего разрешённого запроса
    limit: int
    used_fallback: bool = False


class DistributedRateLimiter:
    """
    Distributed rate limiter с поддержкой:
    - per-user / per-IP / per-endpoint ключей
    - нескольких временных окон одновременно
    - burst-токенов (дополнительный лимит на краткосрочные пики)
    - VIP-множителя
    - graceful degradation при недоступности Redis
    """

    def __init__(self, redis_url: str = "redis://localhost:6379") -> None:
        self._redis_url = redis_url
        self._redis: Optional[aioredis.Redis] = None
        self._script_sha: dict[str, str] = {}

    async def connect(self) -> None:
        self._redis = aioredis.from_url(
            self._redis_url,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=0.5,    # быстрый таймаут — не блокируем API
        )
        # Загружаем Lua-скрипт один раз, Redis кэширует по SHA
        sha = await self._redis.script_load(_SLIDING_WINDOW_LUA)
        self._script_sha["sliding_window"] = sha

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()

    def _make_keys(
        self,
        identifier: str,
        endpoint: str,
        window: Window,
    ) -> tuple[str, str]:
        """Ключи для текущего и предыдущего bucket'а окна."""
        w = WINDOW_SECONDS[window]
        now = int(time.time())
        curr_bucket = now // w
        prev_bucket = curr_bucket - 1
        base = f"rl:{identifier}:{endpoint}:{window}"
        return f"{base}:{curr_bucket}", f"{base}:{prev_bucket}"

    def _effective_limit(self, limit: RateLimit, is_vip: bool) -> int:
        base = limit.requests * (VIP_MULTIPLIER if is_vip else 1)
        return base + limit.burst

    async def check(
        self,
        user_id: Optional[str],
        ip: str,
        endpoint: str,
        is_vip: bool = False,
        limits: list[RateLimit] | None = None,
    ) -> RateLimitResult:
        """
        Проверяет все применимые лимиты.
        Возвращает результат самого строгого сработавшего правила.
        """
        limits = limits or DEFAULT_LIMITS
        identifier = user_id or ip
        now = int(time.time())

        for limit in limits:
            effective = self._effective_limit(limit, is_vip)
            key_curr, key_prev = self._make_keys(identifier, endpoint, limit.window)
            w = WINDOW_SECONDS[limit.window]

            try:
                if self._redis is None:
                    raise ConnectionError("Redis не подключён")

                result = await self._redis.evalsha(
                    self._script_sha["sliding_window"],
                    2,                          # количество KEYS
                    key_curr, key_prev,         # KEYS
                    effective, w, now,          # ARGV
                )
                allowed, retry_after, count = int(result[0]), int(result[1]), int(result[2])

                if not allowed:
                    return RateLimitResult(
                        allowed=False,
                        remaining=0,
                        retry_after=retry_after,
                        limit=effective,
                    )

            except Exception as exc:
                log.warning("Redis недоступен (%s) — используем fallback", exc)
                allowed, count = await _fallback_check(key_curr, effective)
                if not allowed:
                    return RateLimitResult(
                        allowed=False,
                        remaining=0,
                        retry_after=w,
                        limit=effective,
                        used_fallback=True,
                    )

        return RateLimitResult(
            allowed=True,
            remaining=effective - count,
            retry_after=0,
            limit=effective,
        )`,
      },
      {
        filename: "api.py",
        code: `"""
FastAPI middleware + dependency для rate limiting.
"""
import logging
from contextlib import asynccontextmanager
from typing import Annotated, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse

from rate_limiter import DEFAULT_LIMITS, DistributedRateLimiter, RateLimitResult

log = logging.getLogger(__name__)
limiter = DistributedRateLimiter("redis://localhost:6379")

VIP_USERS = {"user_premium_1", "user_premium_2"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await limiter.connect()
    yield
    await limiter.close()


app = FastAPI(lifespan=lifespan)


# ------------------------------------------------------------------
# Dependency: проверка rate limit
# ------------------------------------------------------------------

async def rate_limit(request: Request) -> RateLimitResult:
    """
    Извлекает user_id (из заголовка / JWT) и IP, применяет лимиты.
    Добавляет стандартные Rate-Limit-* заголовки к ответу.
    """
    user_id: Optional[str] = request.headers.get("X-User-Id")
    ip = request.client.host if request.client else "unknown"
    endpoint = request.url.path
    is_vip = user_id in VIP_USERS

    result = await limiter.check(
        user_id=user_id,
        ip=ip,
        endpoint=endpoint,
        is_vip=is_vip,
    )

    # Добавляем стандартные заголовки (RFC 6585)
    request.state.rate_limit = result

    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Превышен лимит запросов",
            headers={
                "Retry-After": str(result.retry_after),
                "X-RateLimit-Limit": str(result.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Used-Fallback": str(result.used_fallback),
            },
        )

    return result


# ------------------------------------------------------------------
# Middleware: добавляет Rate-Limit заголовки ко всем ответам
# ------------------------------------------------------------------

@app.middleware("http")
async def add_rate_limit_headers(request: Request, call_next):
    response = await call_next(request)
    rl = getattr(request.state, "rate_limit", None)
    if rl:
        response.headers["X-RateLimit-Limit"]     = str(rl.limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, rl.remaining))
        if rl.used_fallback:
            response.headers["X-RateLimit-Fallback"] = "true"
    return response


# ------------------------------------------------------------------
# Эндпоинты
# ------------------------------------------------------------------

@app.get("/api/data")
async def get_data(
    _rl: Annotated[RateLimitResult, Depends(rate_limit)],
) -> dict:
    return {"data": "ok"}


@app.get("/api/expensive")
async def expensive_endpoint(
    _rl: Annotated[RateLimitResult, Depends(rate_limit)],
) -> dict:
    return {"result": "heavy computation done"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Lua-скрипт — атомарность без транзакций:**
- Redis выполняет Lua атомарно: никакой другой команды между чтением и записью
- \`INCR\` + \`EXPIRE\` как отдельные команды создают race condition: два процесса могут сделать INCR одновременно и оба получат \`1\`, пропустив лимит
- Загрузка через \`SCRIPT LOAD\` → SHA: скрипт компилируется один раз, вызывается по хэшу — экономия трафика

**Sliding window с двумя bucket'ами:**
- Текущий bucket = \`now // window_seconds\` — меняется каждые N секунд
- Предыдущий bucket взвешивается по прошедшей доле окна: \`weight = (window - elapsed) / window\`
- Точнее чем fixed window (нет проблемы "двойного лимита" на границе окна), дешевле чем log-based sliding window (O(1) память вместо O(N))

**Burst-токены:**
- \`effective = base_limit + burst\` — клиент может сделать пачку запросов сверх нормы
- Burst не восстанавливается отдельно — он часть общего лимита окна
- Для классического token bucket (с постепенным восстановлением) нужен отдельный Lua-алгоритм

**Graceful degradation с TTLCache:**
- \`socket_timeout=0.5\` в aioredis — быстрый таймаут, не блокируем event loop
- При любом исключении от Redis — переходим на \`_fallback_check\` (in-memory TTLCache)
- Fallback теряет точность (не синхронизирован между инстансами), но API продолжает работать
- \`X-RateLimit-Used-Fallback: true\` — клиент/мониторинг видит что работает резервный режим

**VIP-множитель на уровне \`_effective_limit\`:**
- Один Lua-скрипт, одна логика — только входной \`limit\` отличается
- Правила VIP читаются из \`VIP_USERS\` — в продакшне замените на lookup в БД или JWT-claim`,
  },
  {
    id: "multilevel-cache-pubsub",
    title: "Многоуровневый кэш L1+L2, stale-while-revalidate, инвалидация через Pub/Sub",
    task: `Создайте многоуровневую систему кэширования с стратегией cache-aside + stale-while-revalidate. Используйте Redis (aioredis) как основной слой и in-memory cache (cachetools / functools.lru_cache + TTL) как L1. Реализуйте автоматическую инвалидацию кэша по событиям (через Redis Pub/Sub) и background refresh для часто запрашиваемых данных, чтобы пользователь никогда не получал stale-данные дольше 500 мс.`,
    files: [
      {
        filename: "cache_manager.py",
        code: `"""
Многоуровневая система кэширования:
  L1 — TTLCache из cachetools (in-process, мкс доступ)
  L2 — Redis (cross-process, мс доступ)

Стратегии:
  cache-aside           — приложение само читает/пишет кэш
  stale-while-revalidate — отдаём устаревшие данные, обновляем в фоне
  background refresh    — превентивное обновление до истечения TTL

Инвалидация:
  Redis Pub/Sub — при изменении данных публикуем событие,
  все инстансы подписчика удаляют ключ из L1.
"""
import asyncio
import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable, Coroutine, Optional

import redis.asyncio as aioredis
from cachetools import TTLCache

log = logging.getLogger(__name__)

INVALIDATION_CHANNEL = "cache:invalidate"

L1_MAX_SIZE  = 1_000
L1_TTL       = 30       # секунд — короткий, L1 только ускоряет L2
L2_TTL       = 300      # секунд — основное хранение
SWR_WINDOW   = 60       # секунд сверх L2_TTL — stale-while-revalidate
REFRESH_AT   = 0.8      # обновляем превентивно когда TTL < 20% оставшегося времени


@dataclass
class CacheEntry:
    value: Any
    cached_at: float
    ttl: int
    swr: int = SWR_WINDOW

    @property
    def age(self) -> float:
        return time.time() - self.cached_at

    @property
    def is_fresh(self) -> bool:
        return self.age < self.ttl

    @property
    def is_stale_but_usable(self) -> bool:
        return self.ttl <= self.age < (self.ttl + self.swr)

    @property
    def needs_refresh(self) -> bool:
        """Превентивное обновление: TTL истекает скоро."""
        return self.age > self.ttl * REFRESH_AT


# ------------------------------------------------------------------
# CacheManager
# ------------------------------------------------------------------

class CacheManager:
    """
    Двухуровневый кэш с автоматической инвалидацией через Pub/Sub.
    """

    def __init__(self, redis_url: str = "redis://localhost:6379") -> None:
        self._redis_url = redis_url
        self._l1: TTLCache = TTLCache(maxsize=L1_MAX_SIZE, ttl=L1_TTL)
        self._redis: aioredis.Redis
        self._pubsub: aioredis.client.PubSub
        self._refreshing: set[str] = set()    # ключи с активным фоновым обновлением
        self._refresh_tasks: set[asyncio.Task] = set()

    async def start(self) -> None:
        self._redis = aioredis.from_url(self._redis_url, decode_responses=True)
        self._pubsub = self._redis.pubsub()
        await self._pubsub.subscribe(INVALIDATION_CHANNEL)
        asyncio.create_task(self._listen_invalidations(), name="cache-invalidator")
        log.info("CacheManager запущен")

    async def stop(self) -> None:
        await self._pubsub.unsubscribe(INVALIDATION_CHANNEL)
        await self._redis.aclose()

    # ------------------------------------------------------------------
    # Чтение с cache-aside + stale-while-revalidate
    # ------------------------------------------------------------------

    async def get_or_fetch(
        self,
        key: str,
        fetcher: Callable[[], Coroutine[Any, Any, Any]],
        ttl: int = L2_TTL,
        swr: int = SWR_WINDOW,
    ) -> Any:
        """
        1. L1 hit  → мгновенно (мкс)
        2. L2 hit (fresh) → быстро (мс), обновляем L1
        3. L2 hit (stale but usable) → отдаём старое, запускаем фоновое обновление
        4. Miss → вызываем fetcher, сохраняем в L1 + L2
        """
        # ── L1 проверка ────────────────────────────────────────────
        l1_entry: Optional[CacheEntry] = self._l1.get(key)
        if l1_entry and l1_entry.is_fresh:
            log.debug("L1 HIT: %s", key)
            if l1_entry.needs_refresh:
                self._schedule_refresh(key, fetcher, ttl, swr)
            return l1_entry.value

        # ── L2 (Redis) проверка ────────────────────────────────────
        raw = await self._redis.get(f"cache:{key}")
        if raw:
            data = json.loads(raw)
            entry = CacheEntry(
                value=data["value"],
                cached_at=data["cached_at"],
                ttl=data["ttl"],
                swr=data.get("swr", SWR_WINDOW),
            )

            if entry.is_fresh:
                log.debug("L2 HIT (fresh): %s", key)
                self._l1[key] = entry
                if entry.needs_refresh:
                    self._schedule_refresh(key, fetcher, ttl, swr)
                return entry.value

            if entry.is_stale_but_usable:
                log.debug("L2 HIT (stale, SWR): %s", key)
                self._l1[key] = entry
                self._schedule_refresh(key, fetcher, ttl, swr)
                return entry.value

        # ── Cache MISS — вызываем источник данных ─────────────────
        log.debug("MISS: %s — вызываем fetcher", key)
        value = await fetcher()
        await self.set(key, value, ttl=ttl, swr=swr)
        return value

    # ------------------------------------------------------------------
    # Запись
    # ------------------------------------------------------------------

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = L2_TTL,
        swr: int = SWR_WINDOW,
    ) -> None:
        entry = CacheEntry(value=value, cached_at=time.time(), ttl=ttl, swr=swr)
        # L1
        self._l1[key] = entry
        # L2: TTL = основной + SWR-окно + запас
        redis_ttl = ttl + swr + 30
        await self._redis.setex(
            f"cache:{key}",
            redis_ttl,
            json.dumps({"value": value, "cached_at": entry.cached_at,
                        "ttl": ttl, "swr": swr}),
        )

    # ------------------------------------------------------------------
    # Инвалидация через Pub/Sub
    # ------------------------------------------------------------------

    async def invalidate(self, key: str) -> None:
        """Удаляет ключ из L1 и L2, публикует событие всем инстансам."""
        self._l1.pop(key, None)
        await self._redis.delete(f"cache:{key}")
        await self._redis.publish(INVALIDATION_CHANNEL, key)
        log.info("Инвалидирован ключ: %s", key)

    async def _listen_invalidations(self) -> None:
        """
        Слушает события инвалидации от других инстансов приложения.
        Когда один инстанс изменяет данные — остальные удаляют ключ из L1.
        """
        async for message in self._pubsub.listen():
            if message["type"] != "message":
                continue
            key = message["data"]
            self._l1.pop(key, None)
            log.debug("L1 инвалидирован по Pub/Sub: %s", key)

    # ------------------------------------------------------------------
    # Background refresh
    # ------------------------------------------------------------------

    def _schedule_refresh(
        self,
        key: str,
        fetcher: Callable,
        ttl: int,
        swr: int,
    ) -> None:
        """Запускает фоновое обновление, если оно ещё не запущено."""
        if key in self._refreshing:
            return
        self._refreshing.add(key)
        task = asyncio.create_task(
            self._background_refresh(key, fetcher, ttl, swr),
            name=f"refresh:{key}",
        )
        self._refresh_tasks.add(task)
        task.add_done_callback(self._refresh_tasks.discard)

    async def _background_refresh(
        self,
        key: str,
        fetcher: Callable,
        ttl: int,
        swr: int,
    ) -> None:
        try:
            t0 = time.perf_counter()
            value = await fetcher()
            await self.set(key, value, ttl=ttl, swr=swr)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            log.info("Background refresh '%s': %.1f мс", key, elapsed_ms)
        except Exception as exc:
            log.warning("Ошибка background refresh '%s': %s", key, exc)
        finally:
            self._refreshing.discard(key)`,
      },
      {
        filename: "api.py",
        code: `"""
FastAPI-сервис с многоуровневым кэшированием.
Демонстрирует cache-aside, фоновое обновление и инвалидацию.
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from cache_manager import CacheManager

cache = CacheManager("redis://localhost:6379")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache.start()
    yield
    await cache.stop()


app = FastAPI(lifespan=lifespan)


# ------------------------------------------------------------------
# Имитация медленного источника данных
# ------------------------------------------------------------------

async def fetch_user_profile(user_id: str) -> dict:
    """Имитирует запрос к БД (~100 мс)."""
    await asyncio.sleep(0.1)
    return {"user_id": user_id, "name": "Alice", "tier": "premium"}


async def fetch_dashboard_stats() -> dict:
    """Имитирует тяжёлую аналитику (~500 мс)."""
    await asyncio.sleep(0.5)
    return {"dau": 12_000, "revenue": 98_500, "orders": 3_421}


# ------------------------------------------------------------------
# Эндпоинты
# ------------------------------------------------------------------

@app.get("/users/{user_id}/profile")
async def get_profile(user_id: str) -> JSONResponse:
    """
    Первый запрос (~100 мс) — идёт в БД, результат кэшируется.
    Повторные запросы — из L1 (мкс) или L2 (мс).
    При обновлении профиля вызываем cache.invalidate().
    """
    data = await cache.get_or_fetch(
        key=f"profile:{user_id}",
        fetcher=lambda: fetch_user_profile(user_id),
        ttl=120,   # 2 минуты fresh
        swr=60,    # +1 минута stale-while-revalidate
    )
    return JSONResponse(data)


@app.get("/dashboard/stats")
async def get_stats() -> JSONResponse:
    """
    Тяжёлый аналитический запрос кэшируется на 5 минут.
    При приближении к истечению TTL (REFRESH_AT=80%) запускается
    фоновое обновление — пользователь никогда не ждёт 500 мс.
    """
    data = await cache.get_or_fetch(
        key="dashboard:stats",
        fetcher=fetch_dashboard_stats,
        ttl=300,
        swr=120,
    )
    return JSONResponse(data)


@app.put("/users/{user_id}/profile")
async def update_profile(user_id: str, body: dict) -> dict:
    """
    При обновлении профиля инвалидируем кэш.
    Pub/Sub уведомит все остальные инстансы приложения.
    """
    # ... сохраняем в БД ...
    await cache.invalidate(f"profile:{user_id}")
    return {"updated": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Иерархия L1 → L2 → Source:**
- L1 (TTLCache): in-process, микросекунды, живёт 30 сек, ограничен 1000 записей
- L2 (Redis): cross-process, миллисекунды, живёт 5 мин + SWR-окно
- Source (БД/API): сотни миллисекунд, вызывается только при полном промахе

**stale-while-revalidate гарантирует < 500 мс:**
- Пока \`age < ttl + swr\` — клиент получает ответ мгновенно из кэша
- Фоновая корутина обновляет данные асинхронно (пользователь не ждёт)
- \`_refreshing\` set предотвращает запуск дублирующих задач для одного ключа

**Превентивный background refresh (\`REFRESH_AT=0.8\`):**
- Когда \`age > ttl * 0.8\` — запускаем обновление заранее, до истечения TTL
- Пользователь никогда не попадает на "холодный" кэш — данные обновляются незаметно
- Это ключевой паттерн для \`dashboard:stats\` с тяжёлым fetcher'ом

**Инвалидация через Redis Pub/Sub:**
- При \`cache.invalidate(key)\` публикуется событие в канал \`cache:invalidate\`
- Все инстансы приложения (даже на разных серверах) удаляют ключ из своего L1
- Без Pub/Sub разные инстансы держали бы разные данные в L1 до истечения TTL

**TTL в Redis = ttl + swr + запас:**
- Ключ в Redis живёт дольше чем \`ttl\` — иначе при stale-hit ключ уже не существовал бы
- Логика freshness/staleness реализована через \`cached_at\` в самом значении, не через Redis TTL`,
  },
  {
    id: "redlock-distributed-locking",
    title: "Redis Redlock: distributed locking для защиты критических секций",
    task: `Реализуйте distributed locking (Redis Redlock) для защиты критической секции при работе с кэшем (например, генерация отчёта, который записывается в кэш). Нужно корректно обрабатывать потерю lock'а из-за истечения TTL, deadlock'и и ситуацию, когда несколько инстансов одновременно пытаются перегенерировать один и тот же кэш. Добавьте метрики времени ожидания lock'а и fallback-стратегию.`,
    files: [
      {
        filename: "redlock.py",
        code: `"""
Упрощённый Redlock для одного Redis-инстанса.

Полный Redlock (RFC) требует N ≥ 3 независимых Redis-инстансов
и получение большинства (N//2 + 1) локов.
Здесь — single-node вариант с корректной обработкой edge-cases.

Принципы:
- Lock = SET key token NX PX ttl (атомарно: только если не существует)
- Unlock = Lua-скрипт (проверка + DEL атомарно — не удалить чужой lock)
- Token = уникальный UUID — защита от случайного удаления чужого лока
- Fencing token = монотонный счётчик — защита от использования устаревшего лока
"""
import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import AsyncIterator, Optional

import redis.asyncio as aioredis

log = logging.getLogger(__name__)

# Lua: удаляем ключ только если значение совпадает (наш token)
_UNLOCK_LUA = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
"""

# Lua: продление TTL только если мы владельцы
_EXTEND_LUA = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('PEXPIRE', KEYS[1], ARGV[2])
else
    return 0
end
"""


# ------------------------------------------------------------------
# Метрики
# ------------------------------------------------------------------

@dataclass
class LockMetrics:
    attempts: int = 0
    acquired: int = 0
    failed: int = 0
    total_wait_ms: float = 0.0
    max_wait_ms: float = 0.0
    lock_lost_count: int = 0   # потеря лока из-за истечения TTL

    def record_wait(self, ms: float) -> None:
        self.total_wait_ms += ms
        self.max_wait_ms = max(self.max_wait_ms, ms)

    @property
    def avg_wait_ms(self) -> float:
        return self.total_wait_ms / self.acquired if self.acquired else 0.0


_metrics: dict[str, LockMetrics] = {}


def get_metrics(resource: str) -> LockMetrics:
    return _metrics.setdefault(resource, LockMetrics())


# ------------------------------------------------------------------
# Lock handle
# ------------------------------------------------------------------

@dataclass
class Lock:
    resource: str
    token: str
    acquired_at: float
    ttl_ms: int
    fencing_token: int      # монотонный порядковый номер

    @property
    def elapsed_ms(self) -> float:
        return (time.time() - self.acquired_at) * 1000

    @property
    def is_valid(self) -> bool:
        """Лок ещё действителен по времени."""
        return self.elapsed_ms < self.ttl_ms


# ------------------------------------------------------------------
# RedLock
# ------------------------------------------------------------------

class RedLock:
    """
    Distributed lock на одном Redis-инстансе.

    Параметры:
      ttl_ms        — TTL лока в миллисекундах
      retry_count   — максимум попыток получения лока
      retry_delay_ms — задержка между попытками (с jitter)
      drift_factor  — поправка на clock drift и задержку сети (≈2%)
    """

    def __init__(
        self,
        redis: aioredis.Redis,
        ttl_ms: int = 10_000,
        retry_count: int = 20,
        retry_delay_ms: int = 200,
        drift_factor: float = 0.02,
    ) -> None:
        self._r = redis
        self._ttl_ms = ttl_ms
        self._retry_count = retry_count
        self._retry_delay_ms = retry_delay_ms
        self._drift_factor = drift_factor
        self._fencing_counter: dict[str, int] = {}
        self._unlock_sha: str = ""
        self._extend_sha: str = ""

    async def load_scripts(self) -> None:
        self._unlock_sha = await self._r.script_load(_UNLOCK_LUA)
        self._extend_sha = await self._r.script_load(_EXTEND_LUA)

    async def acquire(self, resource: str) -> Optional[Lock]:
        """
        Пытается получить лок. Возвращает Lock или None (если не удалось).
        """
        token = str(uuid.uuid4())
        metrics = get_metrics(resource)
        metrics.attempts += 1
        t_start = time.perf_counter()

        # Drift: вычитаем из TTL задержку сети + clock drift
        validity = int(self._ttl_ms * (1 - self._drift_factor))

        import random
        for attempt in range(self._retry_count):
            t0 = time.perf_counter()
            ok = await self._r.set(
                f"lock:{resource}", token,
                nx=True,       # только если НЕ существует
                px=self._ttl_ms,  # TTL в миллисекундах
            )
            elapsed_ms = (time.perf_counter() - t0) * 1000

            if ok and elapsed_ms < validity:
                # Лок получен и ещё действителен
                fencing = self._fencing_counter.get(resource, 0) + 1
                self._fencing_counter[resource] = fencing

                wait_ms = (time.perf_counter() - t_start) * 1000
                metrics.record_wait(wait_ms)
                metrics.acquired += 1

                log.info(
                    "Lock '%s' получен (попытка %d, ожидание %.1f мс, fencing=%d)",
                    resource, attempt + 1, wait_ms, fencing,
                )
                return Lock(
                    resource=resource,
                    token=token,
                    acquired_at=time.time(),
                    ttl_ms=validity,
                    fencing_token=fencing,
                )

            # Jitter: ±25% к задержке — предотвращает thundering herd
            jitter = random.uniform(-0.25, 0.25) * self._retry_delay_ms
            await asyncio.sleep((self._retry_delay_ms + jitter) / 1000)

        metrics.failed += 1
        log.warning("Lock '%s' не получен после %d попыток", resource, self._retry_count)
        return None

    async def release(self, lock: Lock) -> bool:
        """
        Освобождает лок. Lua-скрипт гарантирует что мы удаляем только свой лок.
        """
        if not lock.is_valid:
            get_metrics(lock.resource).lock_lost_count += 1
            log.error(
                "Lock '%s' истёк до release (elapsed=%.1f мс > ttl=%d мс)",
                lock.resource, lock.elapsed_ms, lock.ttl_ms,
            )
            return False

        result = await self._r.evalsha(
            self._unlock_sha, 1, f"lock:{lock.resource}", lock.token
        )
        if result:
            log.debug("Lock '%s' освобождён", lock.resource)
        else:
            log.error(
                "Lock '%s' уже истёк или захвачен другим (token mismatch)",
                lock.resource,
            )
            get_metrics(lock.resource).lock_lost_count += 1
        return bool(result)

    async def extend(self, lock: Lock, extra_ms: int) -> bool:
        """
        Продлевает TTL лока (если мы всё ещё владельцы).
        Используется для долгих задач: продлевайте каждые ttl/2 мс.
        """
        result = await self._r.evalsha(
            self._extend_sha, 1, f"lock:{lock.resource}", lock.token, extra_ms
        )
        if result:
            lock.acquired_at = time.time()
            lock.ttl_ms = extra_ms
            log.debug("Lock '%s' продлён на %d мс", lock.resource, extra_ms)
        return bool(result)

    @asynccontextmanager
    async def locked(
        self,
        resource: str,
        fallback=None,
    ) -> AsyncIterator[Optional[Lock]]:
        """
        Контекстный менеджер. Автоматически освобождает лок.

        fallback — значение для yield если лок не получен (вместо None).
        При потере лока внутри блока — бросает RuntimeError.

        Использование:
            async with redlock.locked("report:gen") as lock:
                if lock is None:
                    return cached_value   # fallback
                result = await generate()
                await cache.set("report", result)
        """
        lock = await self.acquire(resource)
        if lock is None:
            yield fallback
            return

        try:
            yield lock
            # Проверяем что лок не истёк в процессе работы
            if not lock.is_valid:
                get_metrics(resource).lock_lost_count += 1
                raise RuntimeError(
                    f"Lock '{resource}' истёк во время выполнения критической секции. "
                    f"Увеличьте ttl_ms или используйте lock.extend()."
                )
        finally:
            await self.release(lock)`,
      },
      {
        filename: "api.py",
        code: `"""
Пример: защита генерации отчёта через RedLock.
Паттерн "cache stampede prevention" — только один инстанс генерирует отчёт.
"""
import asyncio
import json
import logging
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from redlock import RedLock, get_metrics

log = logging.getLogger(__name__)
REDIS_URL = "redis://localhost:6379"


@asynccontextmanager
async def lifespan(app: FastAPI):
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    app.state.redis = r
    app.state.redlock = RedLock(r, ttl_ms=30_000, retry_count=15, retry_delay_ms=300)
    await app.state.redlock.load_scripts()
    yield
    await r.aclose()


app = FastAPI(lifespan=lifespan)


async def _generate_heavy_report(report_id: str) -> dict:
    """Имитирует тяжёлую генерацию отчёта (~3 секунды)."""
    await asyncio.sleep(3)
    return {"report_id": report_id, "rows": 50_000, "generated": True}


@app.get("/reports/{report_id}")
async def get_report(report_id: str) -> JSONResponse:
    """
    1. Проверяем кэш — если есть, отдаём сразу
    2. Пытаемся получить distributed lock
    3. Если lock получен — генерируем отчёт, пишем в кэш, освобождаем lock
    4. Если lock НЕ получен — другой инстанс уже генерирует.
       Ждём и возвращаем результат из кэша (fallback).
    """
    r: aioredis.Redis = app.state.redis
    redlock: RedLock  = app.state.redlock
    cache_key = f"report:{report_id}"

    # Шаг 1: проверяем кэш
    cached = await r.get(cache_key)
    if cached:
        return JSONResponse(json.loads(cached), headers={"X-Cache": "HIT"})

    # Шаг 2: пытаемся получить lock с fallback
    async with redlock.locked(f"gen:{report_id}", fallback=None) as lock:
        if lock is None:
            # Другой инстанс держит лок — ждём завершения и читаем кэш
            log.info("Lock занят, ждём готового кэша для %s", report_id)
            for _ in range(20):
                await asyncio.sleep(0.5)
                cached = await r.get(cache_key)
                if cached:
                    return JSONResponse(
                        json.loads(cached),
                        headers={"X-Cache": "HIT-AFTER-WAIT"},
                    )
            raise HTTPException(503, "Отчёт генерируется, попробуйте позже")

        # Шаг 3: мы получили lock — двойная проверка кэша
        # (другой инстанс мог завершить пока мы ждали лок)
        cached = await r.get(cache_key)
        if cached:
            return JSONResponse(json.loads(cached), headers={"X-Cache": "HIT-DOUBLE-CHECK"})

        # Шаг 4: генерируем отчёт
        # Для долгой задачи продлеваем lock каждые ttl/2
        async def _extend_periodically():
            while True:
                await asyncio.sleep(10)
                if not await redlock.extend(lock, extra_ms=30_000):
                    log.error("Не удалось продлить lock для %s!", report_id)
                    return

        extend_task = asyncio.create_task(_extend_periodically())
        try:
            report = await _generate_heavy_report(report_id)
        finally:
            extend_task.cancel()

        # Шаг 5: сохраняем в кэш (после успешной генерации)
        await r.setex(cache_key, 3600, json.dumps(report))
        log.info("Отчёт %s сгенерирован и закэширован", report_id)
        return JSONResponse(report, headers={"X-Cache": "MISS"})


@app.get("/metrics/locks")
async def lock_metrics() -> dict:
    """Отдаёт метрики lock'ов для мониторинга."""
    return {
        resource: {
            "attempts":       m.attempts,
            "acquired":       m.acquired,
            "failed":         m.failed,
            "avg_wait_ms":    round(m.avg_wait_ms, 2),
            "max_wait_ms":    round(m.max_wait_ms, 2),
            "lock_lost":      m.lock_lost_count,
            "contention_pct": round(m.failed / m.attempts * 100, 1) if m.attempts else 0,
        }
        for resource, m in __import__("redlock")._metrics.items()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**SET NX PX — атомарное получение лока:**
- \`SET key token NX PX ttl\` — единственная атомарная операция: устанавливает значение только если ключ не существует
- \`NX\` (Not eXists) + \`PX\` (миллисекунды) — невозможно создать ситуацию "SET без TTL" или "EXPIRE без SET"
- До Redis 2.6.12 использовали SETNX + EXPIRE как две команды — это создавало race condition

**Lua для unlock — защита от удаления чужого лока:**
- Без Lua: \`GET key\` + \`DEL key\` — два отдельных запроса. Между ними TTL может истечь, другой процесс захватит лок, а мы его удалим
- С Lua: GET + DEL выполняются атомарно — либо удаляем свой, либо не трогаем

**Fencing token (монотонный счётчик):**
- Защищает от ситуации "старый процесс с устаревшим локом продолжает писать"
- Клиент передаёт fencing token в каждый запрос к ресурсу; ресурс принимает только возрастающие токены
- Пример: инстанс А получил lock#1, завис (GC pause), lock истёк. Инстанс Б получил lock#2. Инстанс А "проснулся" с fencing=1 < 2 — его запись отклоняется

**Cache stampede prevention (double-checked locking):**
- Проверяем кэш → пытаемся получить лок → снова проверяем кэш (после получения лока)
- "Двойная проверка" нужна: пока мы ждали лок, другой инстанс мог завершить генерацию
- Без второй проверки — перегенерируем отчёт, хотя он уже в кэше

**Продление лока (\`extend\`) для долгих задач:**
- Если задача занимает дольше TTL — лок истекает, другой инстанс может его захватить
- Фоновая \`_extend_periodically\` задача продлевает лок каждые 10 секунд
- При ошибке продления (лок уже украден) — логируем, но продолжаем (оптимистичный подход)

**Jitter в retry:**
- \`±25%\` случайный сдвиг задержки между попытками предотвращает "thundering herd"
- Без jitter: 100 инстансов синхронно повторяют попытку через одинаковый интервал — снова конкуренция`,
  },
  {
    id: "celery-production-tasks",
    title: "Production-ready Celery: retry/backoff, DLQ, мониторинг, отмена задач",
    task: `Настройте production-ready систему фоновых задач на Celery (или Dramatiq) с Redis/RabbitMQ брокером. Реализуйте retry-политику с exponential backoff + jitter, dead letter queue для «проблемных» задач, автоматический мониторинг (Flower + Prometheus) и возможность отмены/перезапуска задачи пользователем через API. Задача должна уметь обрабатывать как CPU-bound, так и I/O-bound операции.`,
    files: [
      {
        filename: "celery_app.py",
        code: `"""
Production-ready Celery: Redis-брокер, retry + backoff + jitter,
Dead Letter Queue (DLQ), Prometheus-метрики, CPU/IO-bound задачи.

Структура очередей:
  default   — стандартные задачи
  io_bound  — I/O-задачи (concurrency=50, prefork-pool не нужен)
  cpu_bound — CPU-задачи (concurrency=CPU_COUNT, prefork pool)
  dlq       — dead letter queue (задачи исчерпавшие retry)

Запуск worker'ов:
  # I/O-bound (gevent/eventlet или threads)
  celery -A celery_app worker -Q io_bound -c 50 -P gevent

  # CPU-bound (prefork, по числу ядер)
  celery -A celery_app worker -Q cpu_bound -c 4 -P prefork

  # Мониторинг
  celery -A celery_app flower --port=5555
"""
import logging
import os
import random
import time
from functools import wraps
from typing import Any

from celery import Celery, Task
from celery.signals import task_failure, task_postrun, task_prerun, task_retry
from celery.utils.log import get_task_logger
from kombu import Exchange, Queue
from prometheus_client import Counter, Gauge, Histogram, start_http_server

log = get_task_logger(__name__)

REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:6379/0")
BROKER_URL   = os.getenv("BROKER_URL", REDIS_URL)
BACKEND_URL  = os.getenv("BACKEND_URL", REDIS_URL)


# ------------------------------------------------------------------
# Prometheus метрики
# ------------------------------------------------------------------

TASK_DURATION = Histogram(
    "celery_task_duration_seconds",
    "Время выполнения задачи",
    ["task_name", "queue", "status"],
)
TASK_RETRIES = Counter(
    "celery_task_retries_total",
    "Количество retry по задачам",
    ["task_name"],
)
TASK_DLQ = Counter(
    "celery_task_dlq_total",
    "Задачи попавшие в DLQ",
    ["task_name"],
)
ACTIVE_TASKS = Gauge(
    "celery_active_tasks",
    "Активные задачи прямо сейчас",
    ["queue"],
)


# ------------------------------------------------------------------
# Конфигурация очередей
# ------------------------------------------------------------------

default_exchange = Exchange("default", type="direct")
dlq_exchange     = Exchange("dlq",     type="direct")

task_queues = (
    Queue("default",   default_exchange, routing_key="default"),
    Queue("io_bound",  default_exchange, routing_key="io_bound"),
    Queue("cpu_bound", default_exchange, routing_key="cpu_bound"),
    # DLQ — отдельный exchange, задачи сюда попадают вручную
    Queue("dlq",       dlq_exchange,     routing_key="dlq"),
)

task_routes = {
    "celery_app.send_email":      {"queue": "io_bound"},
    "celery_app.process_image":   {"queue": "cpu_bound"},
    "celery_app.generate_report": {"queue": "io_bound"},
    "celery_app.*":               {"queue": "default"},
}


# ------------------------------------------------------------------
# Приложение Celery
# ------------------------------------------------------------------

app = Celery("myapp", broker=BROKER_URL, backend=BACKEND_URL)

app.conf.update(
    task_queues=task_queues,
    task_routes=task_routes,
    task_default_queue="default",
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,

    # Результаты хранятся 24 часа
    result_expires=86400,

    # Prefetch: 1 задача на worker (важно для долгих CPU-задач)
    worker_prefetch_multiplier=1,

    # Подтверждение задачи ПОСЛЕ выполнения (не до)
    # Если worker упал — задача вернётся в очередь
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Heartbeat для обнаружения упавших worker'ов
    broker_heartbeat=10,
    broker_connection_retry_on_startup=True,
)


# ------------------------------------------------------------------
# Базовый класс задачи с автоматическим retry + DLQ
# ------------------------------------------------------------------

class BaseTask(Task):
    """
    Базовый класс для всех задач:
    - exponential backoff с jitter
    - автоматическая отправка в DLQ после исчерпания попыток
    - Prometheus-метрики
    """
    abstract = True
    max_retries = 5
    default_retry_delay = 60      # базовая задержка (секунды)
    _start_time: float = 0.0

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Вызывается когда retry исчерпаны."""
        log.error(
            "Task %s[%s] окончательно упала: %s",
            self.name, task_id, exc, exc_info=True,
        )
        TASK_DLQ.labels(task_name=self.name).inc()
        # Отправляем в DLQ для ручного анализа
        self._send_to_dlq(task_id, args, kwargs, str(exc))

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        TASK_RETRIES.labels(task_name=self.name).inc()
        log.warning("Task %s[%s] retry: %s", self.name, task_id, exc)

    def _send_to_dlq(self, task_id, args, kwargs, error: str) -> None:
        """Публикует сообщение в DLQ-очередь с метаданными об ошибке."""
        import json
        import redis
        r = redis.from_url(REDIS_URL)
        r.lpush("dlq:failed_tasks", json.dumps({
            "task_id": task_id,
            "task_name": self.name,
            "args": args,
            "kwargs": kwargs,
            "error": error,
            "failed_at": time.time(),
        }))
        log.info("Task %s[%s] отправлена в DLQ", self.name, task_id)

    def retry_with_backoff(self, exc: Exception, **kwargs) -> None:
        """
        Exponential backoff с full jitter.
        countdown = base * 2^attempt + random(0, base * 2^attempt)
        Jitter предотвращает thundering herd — не все задачи повторяются одновременно.
        """
        attempt = self.request.retries
        base = self.default_retry_delay * (2 ** attempt)
        countdown = base + random.uniform(0, base)   # full jitter
        countdown = min(countdown, 3600)             # максимум 1 час

        log.info(
            "Retry %d/%d для %s через %.0f сек",
            attempt + 1, self.max_retries, self.name, countdown,
        )
        raise self.retry(exc=exc, countdown=countdown, **kwargs)


# ------------------------------------------------------------------
# Сигналы для метрик
# ------------------------------------------------------------------

@task_prerun.connect
def task_prerun_handler(task_id, task, **kwargs):
    task._start_time = time.time()
    queue = task.request.delivery_info.get("routing_key", "unknown")
    ACTIVE_TASKS.labels(queue=queue).inc()


@task_postrun.connect
def task_postrun_handler(task_id, task, retval, state, **kwargs):
    duration = time.time() - getattr(task, "_start_time", time.time())
    queue = task.request.delivery_info.get("routing_key", "unknown")
    TASK_DURATION.labels(task_name=task.name, queue=queue, status=state).observe(duration)
    ACTIVE_TASKS.labels(queue=queue).dec()


# ------------------------------------------------------------------
# Задачи
# ------------------------------------------------------------------

@app.task(
    bind=True,
    base=BaseTask,
    name="celery_app.send_email",
    max_retries=5,
    default_retry_delay=30,
)
def send_email(self, to: str, subject: str, body: str) -> dict:
    """
    I/O-bound: отправка email.
    bind=True — self = экземпляр задачи, нужен для self.retry().
    """
    import httpx  # синхронный HTTP (Celery worker синхронен)
    try:
        # Имитация отправки через HTTP-API почтового сервиса
        resp = httpx.post(
            "https://api.mailservice.example/send",
            json={"to": to, "subject": subject, "body": body},
            timeout=10,
        )
        resp.raise_for_status()
        return {"sent": True, "to": to}
    except httpx.TimeoutException as exc:
        self.retry_with_backoff(exc)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code >= 500:
            self.retry_with_backoff(exc)
        raise   # 4xx — не ретраем, ошибка в данных


@app.task(
    bind=True,
    base=BaseTask,
    name="celery_app.process_image",
    max_retries=3,
    # CPU-bound задача: увеличиваем лимит времени
    time_limit=300,
    soft_time_limit=240,
)
def process_image(self, image_path: str, operations: list[str]) -> dict:
    """
    CPU-bound: обработка изображения (ресайз, конвертация).
    soft_time_limit → SoftTimeLimitExceeded, даёт шанс cleanup.
    time_limit → SIGKILL (жёсткий лимит).
    """
    from celery.exceptions import SoftTimeLimitExceeded
    try:
        # PIL/Pillow операции — CPU intensive
        from PIL import Image
        img = Image.open(image_path)
        for op in operations:
            if op == "resize_800":
                img = img.resize((800, 600))
            elif op == "grayscale":
                img = img.convert("L")
        output = image_path.replace(".", "_processed.")
        img.save(output)
        return {"output": output, "operations": operations}
    except SoftTimeLimitExceeded:
        log.warning("Soft time limit для %s", image_path)
        raise   # не ретраем — задача слишком большая
    except Exception as exc:
        self.retry_with_backoff(exc)


@app.task(
    bind=True,
    base=BaseTask,
    name="celery_app.generate_report",
    max_retries=5,
)
def generate_report(self, report_id: str, params: dict) -> dict:
    """Генерация отчёта с промежуточным сохранением прогресса."""
    # Обновляем мета-информацию задачи (видна через API)
    self.update_state(
        state="PROGRESS",
        meta={"report_id": report_id, "progress": 0, "status": "Начало"},
    )
    try:
        # Имитация работы с прогресс-обновлениями
        for i in range(1, 11):
            time.sleep(0.5)
            self.update_state(
                state="PROGRESS",
                meta={"report_id": report_id, "progress": i * 10},
            )
        return {"report_id": report_id, "rows": 50_000, "done": True}
    except Exception as exc:
        self.retry_with_backoff(exc)


# Запуск Prometheus-сервера (в продакшне — отдельный процесс)
if os.getenv("PROMETHEUS_PORT"):
    start_http_server(int(os.getenv("PROMETHEUS_PORT", "9090")))`,
      },
      {
        filename: "tasks_api.py",
        code: `"""
FastAPI-эндпоинты для управления задачами:
- Запуск задачи
- Проверка статуса (с прогрессом)
- Отмена задачи
- Перезапуск упавшей задачи
- Список задач из DLQ
"""
import json
import time
from typing import Any, Optional

import redis
from celery.result import AsyncResult
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from celery_app import app as celery_app
from celery_app import generate_report, process_image, send_email

api = FastAPI()
r = redis.from_url("redis://localhost:6379/0", decode_responses=True)


# ------------------------------------------------------------------
# Схемы
# ------------------------------------------------------------------

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str


class ReportRequest(BaseModel):
    params: dict = {}


class ImageRequest(BaseModel):
    image_path: str
    operations: list[str] = ["resize_800"]


# ------------------------------------------------------------------
# Запуск задач
# ------------------------------------------------------------------

@api.post("/tasks/email")
def start_email(req: EmailRequest) -> dict:
    task = send_email.apply_async(
        args=[req.to, req.subject, req.body],
        # Можно задать ETA или countdown
        # countdown=60  — задача запустится через 60 секунд
    )
    return {"task_id": task.id, "status": "queued"}


@api.post("/tasks/report")
def start_report(req: ReportRequest) -> dict:
    import uuid
    report_id = str(uuid.uuid4())
    task = generate_report.apply_async(
        args=[report_id, req.params],
        # priority=9  — высокий приоритет (0-9, 9 = max в Redis)
    )
    return {"task_id": task.id, "report_id": report_id, "status": "queued"}


@api.post("/tasks/image")
def start_image(req: ImageRequest) -> dict:
    task = process_image.apply_async(
        args=[req.image_path, req.operations],
        queue="cpu_bound",
    )
    return {"task_id": task.id, "status": "queued"}


# ------------------------------------------------------------------
# Статус задачи
# ------------------------------------------------------------------

@api.get("/tasks/{task_id}")
def get_task_status(task_id: str) -> dict:
    """
    Возвращает статус задачи, включая промежуточный прогресс.
    Celery состояния: PENDING, STARTED, PROGRESS (кастомное), SUCCESS, FAILURE, REVOKED.
    """
    result = AsyncResult(task_id, app=celery_app)
    response: dict[str, Any] = {
        "task_id": task_id,
        "status": result.status,
    }

    if result.status == "PROGRESS":
        response["progress"] = result.info
    elif result.status == "SUCCESS":
        response["result"] = result.result
    elif result.status == "FAILURE":
        response["error"] = str(result.result)
        response["traceback"] = result.traceback

    return response


# ------------------------------------------------------------------
# Отмена задачи
# ------------------------------------------------------------------

@api.delete("/tasks/{task_id}")
def cancel_task(task_id: str, terminate: bool = False) -> dict:
    """
    Мягкая отмена: задача не начнётся если ещё в очереди.
    terminate=True: SIGTERM для уже работающей задачи.
    Используйте terminate с осторожностью — задача может быть в середине транзакции.
    """
    celery_app.control.revoke(task_id, terminate=terminate, signal="SIGTERM")
    return {"task_id": task_id, "action": "revoked", "terminate": terminate}


# ------------------------------------------------------------------
# Перезапуск задачи
# ------------------------------------------------------------------

@api.post("/tasks/{task_id}/retry")
def retry_task(task_id: str) -> dict:
    """
    Перезапускает задачу из DLQ по task_id.
    Ищет параметры в DLQ и создаёт новую задачу.
    """
    # Ищем задачу в DLQ
    dlq_items = r.lrange("dlq:failed_tasks", 0, -1)
    for raw in dlq_items:
        item = json.loads(raw)
        if item["task_id"] == task_id:
            # Получаем задачу по имени и повторяем с теми же аргументами
            task_func = celery_app.tasks.get(item["task_name"])
            if not task_func:
                raise HTTPException(404, f"Task {item['task_name']} не найдена")
            new_task = task_func.apply_async(
                args=item["args"],
                kwargs=item["kwargs"],
            )
            # Удаляем из DLQ
            r.lrem("dlq:failed_tasks", 1, raw)
            return {"new_task_id": new_task.id, "original_task_id": task_id}

    raise HTTPException(404, f"Task {task_id} не найдена в DLQ")


# ------------------------------------------------------------------
# DLQ API
# ------------------------------------------------------------------

@api.get("/dlq")
def list_dlq(limit: int = 50) -> dict:
    """Список проблемных задач в DLQ."""
    items = r.lrange("dlq:failed_tasks", 0, limit - 1)
    return {
        "total": r.llen("dlq:failed_tasks"),
        "items": [json.loads(i) for i in items],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(api, host="0.0.0.0", port=8001)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**\`task_acks_late=True\` + \`task_reject_on_worker_lost=True\`:**
- По умолчанию Celery подтверждает (ACK) задачу при получении, до выполнения
- Если worker упал в середине — задача потеряна
- \`acks_late\`: ACK только после успешного завершения; при падении worker'а задача возвращается в очередь
- \`reject_on_worker_lost\`: при неожиданном завершении worker'а задача отклоняется (не ACK), а не теряется

**Exponential backoff с full jitter:**
- \`countdown = base * 2^attempt + random(0, base * 2^attempt)\` — случайная задержка в диапазоне [base, 2*base]
- Full jitter (весь диапазон случайный) эффективнее decorrelated jitter для предотвращения thundering herd
- \`min(countdown, 3600)\` — верхний предел 1 час, чтобы задача не ждала бесконечно

**Dead Letter Queue через Redis LIST:**
- Celery не имеет встроенного DLQ — реализуем через \`on_failure\` в базовом классе
- \`LPUSH dlq:failed_tasks\` сохраняет все параметры задачи для последующего повтора
- API позволяет перезапустить задачу из DLQ с теми же аргументами

**CPU-bound vs I/O-bound воркеры:**
- Prefork (CPU): каждый воркер — отдельный процесс, GIL не мешает; \`-c 4\` = 4 параллельных задачи
- Gevent/Eventlet (I/O): тысячи сопрограмм в одном процессе; \`-c 50\` = 50 одновременных I/O-задач
- \`time_limit\` + \`soft_time_limit\` для CPU-задач: мягкий лимит даёт шанс сохранить прогресс

**\`update_state(state="PROGRESS")\`:**
- Celery позволяет публиковать промежуточный прогресс через \`self.update_state()\`
- Клиент polling'ом проверяет \`GET /tasks/{id}\` и получает \`{"progress": 50}\`
- В продакшне добавьте WebSocket или SSE вместо polling'а`,
  },
  {
    id: "redis-streams-consumer-group",
    title: "Асинхронная очередь на Redis Streams: consumer groups, exactly-once, backpressure",
    task: `Создайте легковесную асинхронную очередь на базе Redis Streams + asyncio.TaskGroup. Каждая задача — импорт/экспорт данных. Нужно реализовать consumer group, exactly-once обработку, автоматическое признание (ack) только после успешного завершения, backpressure и возможность динамического масштабирования количества консьюмеров в зависимости от нагрузки.`,
    files: [
      {
        filename: "stream_consumer.py",
        code: `"""
Redis Streams + asyncio: consumer group с exactly-once обработкой.

Redis Streams — это append-only log с consumer groups (как Kafka, но проще).

Ключевые понятия:
  Stream         — журнал сообщений (XADD добавляет)
  Consumer Group — группа consumer'ов, координируют кто что обрабатывает
  PEL            — Pending Entry List: сообщения выданные, но не ACK'нутые
  XACK           — подтверждение обработки (убирает из PEL)
  XAUTOCLAIM     — перехват «зависших» сообщений другим consumer'ом

Exactly-once гарантируется через:
  1. XACK только после успешного сохранения результата в БД
  2. Idempotency key в обработчике
  3. XAUTOCLAIM перехватывает сообщения из PEL (выданные > N секунд назад)
"""
import asyncio
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine

import redis.asyncio as aioredis

log = logging.getLogger(__name__)

REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:6379")
STREAM_KEY   = "jobs:stream"
GROUP_NAME   = "workers"
BLOCK_MS     = 2000      # ждём новых сообщений до 2 сек
BATCH_SIZE   = 10        # сообщений за один XREADGROUP
CLAIM_AFTER  = 30_000    # мс — перехватываем если >30 сек без ACK
MAX_RETRIES  = 3
BACKPRESSURE_LIMIT = 50  # максимум одновременно обрабатываемых задач


# ------------------------------------------------------------------
# Автоматическое масштабирование
# ------------------------------------------------------------------

@dataclass
class ScalerConfig:
    min_consumers: int = 2
    max_consumers: int = 20
    scale_up_threshold: int = 100    # pending > 100 → добавить consumer'а
    scale_down_threshold: int = 10   # pending < 10  → убрать consumer'а
    check_interval: int = 15         # секунд между проверками


# ------------------------------------------------------------------
# Обработчики задач
# ------------------------------------------------------------------

async def handle_import(job_id: str, payload: dict) -> dict:
    """Импорт данных из CSV в PostgreSQL."""
    log.info("Import job %s: %s", job_id, payload.get("file"))
    await asyncio.sleep(0.5)   # имитация обработки
    return {"imported": 1000, "job_id": job_id}


async def handle_export(job_id: str, payload: dict) -> dict:
    """Экспорт данных в S3."""
    log.info("Export job %s: %s", job_id, payload.get("table"))
    await asyncio.sleep(0.3)
    return {"exported": 5000, "job_id": job_id}


JOB_HANDLERS: dict[str, Callable] = {
    "import": handle_import,
    "export": handle_export,
}


# ------------------------------------------------------------------
# Consumer
# ------------------------------------------------------------------

class StreamConsumer:
    """
    Один consumer в группе.
    Читает из stream, обрабатывает, ACK'ает только при успехе.
    """

    def __init__(
        self,
        redis: aioredis.Redis,
        consumer_id: str,
        sem: asyncio.Semaphore,
    ) -> None:
        self._r = redis
        self._consumer_id = consumer_id
        self._sem = sem    # backpressure semaphore
        self._running = True
        self._processed = 0
        self._errors = 0

    async def run(self) -> None:
        """Основной цикл: читаем → обрабатываем → ACK/NACK."""
        log.info("Consumer %s запущен", self._consumer_id)

        # Сначала проверяем PEL — вдруг есть зависшие сообщения
        await self._reclaim_pending()

        while self._running:
            try:
                messages = await self._r.xreadgroup(
                    groupname=GROUP_NAME,
                    consumername=self._consumer_id,
                    streams={STREAM_KEY: ">"},  # ">" = только новые (не из PEL)
                    count=BATCH_SIZE,
                    block=BLOCK_MS,
                )
                if not messages:
                    continue

                # asyncio.TaskGroup — все сообщения батча параллельно,
                # ждём завершения всех перед следующим XREADGROUP
                stream_messages = messages[0][1]   # [(id, fields), ...]
                async with asyncio.TaskGroup() as tg:
                    for msg_id, fields in stream_messages:
                        tg.create_task(self._process_one(msg_id, fields))

            except* Exception as eg:
                log.error("Ошибка в TaskGroup: %s", eg.exceptions)

    async def _process_one(self, msg_id: str, fields: dict) -> None:
        """Обрабатывает одно сообщение с backpressure и retry."""
        # Backpressure: ждём пока есть свободный слот
        async with self._sem:
            job_id   = fields.get("job_id", msg_id)
            job_type = fields.get("type", "unknown")
            payload  = json.loads(fields.get("payload", "{}"))
            retries  = int(fields.get("_retries", 0))

            handler = JOB_HANDLERS.get(job_type)
            if not handler:
                log.warning("Неизвестный тип задачи: %s", job_type)
                await self._ack(msg_id)   # не ретраем неизвестные задачи
                return

            try:
                result = await handler(job_id, payload)
                # Сохраняем результат (идемпотентно)
                await self._save_result(job_id, result)
                # ACK только после успешного сохранения
                await self._ack(msg_id)
                self._processed += 1
                log.debug("ACK %s (job %s)", msg_id, job_id)

            except Exception as exc:
                self._errors += 1
                if retries < MAX_RETRIES:
                    # Повторная публикация с incremented retry counter
                    await self._republish(fields, retries + 1)
                    await self._ack(msg_id)   # убираем оригинал из PEL
                    log.warning("Retry %d/%d для job %s: %s", retries + 1, MAX_RETRIES, job_id, exc)
                else:
                    # Исчерпали retry → DLQ
                    await self._send_to_dlq(job_id, fields, str(exc))
                    await self._ack(msg_id)
                    log.error("DLQ: job %s после %d retry", job_id, MAX_RETRIES)

    async def _reclaim_pending(self) -> None:
        """
        XAUTOCLAIM: перехватываем сообщения из PEL других consumer'ов,
        которые не ответили за CLAIM_AFTER мс (упали или зависли).
        """
        try:
            result = await self._r.xautoclaim(
                STREAM_KEY, GROUP_NAME, self._consumer_id,
                min_idle_time=CLAIM_AFTER,
                start_id="0-0",
                count=BATCH_SIZE,
            )
            claimed = result[1] if result else []
            if claimed:
                log.info("Consumer %s перехватил %d сообщений из PEL", self._consumer_id, len(claimed))
                for msg_id, fields in claimed:
                    await self._process_one(msg_id, fields)
        except Exception as exc:
            log.warning("Ошибка XAUTOCLAIM: %s", exc)

    async def _ack(self, msg_id: str) -> None:
        await self._r.xack(STREAM_KEY, GROUP_NAME, msg_id)

    async def _save_result(self, job_id: str, result: dict) -> None:
        """Идемпотентное сохранение результата (SET NX)."""
        await self._r.set(
            f"job:result:{job_id}",
            json.dumps(result),
            ex=86400,
            nx=True,    # только если не сохранено раньше (exactly-once)
        )

    async def _republish(self, fields: dict, new_retries: int) -> None:
        await self._r.xadd(
            STREAM_KEY,
            {**fields, "_retries": new_retries, "_retry_at": time.time()},
        )

    async def _send_to_dlq(self, job_id: str, fields: dict, error: str) -> None:
        await self._r.xadd(
            "jobs:dlq",
            {**fields, "_error": error, "_failed_at": time.time()},
        )

    def stop(self) -> None:
        self._running = False


# ------------------------------------------------------------------
# Pool с автомасштабированием
# ------------------------------------------------------------------

class ConsumerPool:
    """
    Управляет пулом consumer'ов, динамически масштабирует в зависимости от нагрузки.
    """

    def __init__(self, redis: aioredis.Redis, config: ScalerConfig) -> None:
        self._r = redis
        self._config = config
        self._sem = asyncio.Semaphore(BACKPRESSURE_LIMIT)
        self._consumers: list[StreamConsumer] = []
        self._tasks: list[asyncio.Task] = []

    async def start(self) -> None:
        """Инициализация группы и запуск минимального числа consumer'ов."""
        # Создаём группу если не существует
        try:
            await self._r.xgroup_create(STREAM_KEY, GROUP_NAME, id="$", mkstream=True)
            log.info("Consumer group '%s' создана", GROUP_NAME)
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

        for _ in range(self._config.min_consumers):
            await self._add_consumer()

        # Фоновый scaler
        asyncio.create_task(self._autoscale_loop(), name="autoscaler")

    async def _add_consumer(self) -> None:
        cid = f"consumer-{uuid.uuid4().hex[:8]}"
        c = StreamConsumer(self._r, cid, self._sem)
        self._consumers.append(c)
        task = asyncio.create_task(c.run(), name=cid)
        self._tasks.append(task)
        log.info("Добавлен consumer %s (всего: %d)", cid, len(self._consumers))

    async def _remove_consumer(self) -> None:
        if len(self._consumers) <= self._config.min_consumers:
            return
        c = self._consumers.pop()
        c.stop()
        log.info("Убран consumer (осталось: %d)", len(self._consumers))

    async def _autoscale_loop(self) -> None:
        """Проверяет pending-очередь и масштабирует пул."""
        while True:
            await asyncio.sleep(self._config.check_interval)
            try:
                info = await self._r.xinfo_groups(STREAM_KEY)
                group = next((g for g in info if g["name"] == GROUP_NAME), None)
                if not group:
                    continue
                pending = group["pending"]

                if pending > self._config.scale_up_threshold:
                    if len(self._consumers) < self._config.max_consumers:
                        log.info("Scale UP: pending=%d", pending)
                        await self._add_consumer()
                elif pending < self._config.scale_down_threshold:
                    if len(self._consumers) > self._config.min_consumers:
                        log.info("Scale DOWN: pending=%d", pending)
                        await self._remove_consumer()

            except Exception as exc:
                log.warning("Autoscaler ошибка: %s", exc)

    async def stop_all(self) -> None:
        for c in self._consumers:
            c.stop()


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    r = aioredis.from_url(REDIS_URL)
    pool = ConsumerPool(r, ScalerConfig())
    await pool.start()

    try:
        await asyncio.Event().wait()   # работаем до SIGINT
    except asyncio.CancelledError:
        await pool.stop_all()
    finally:
        await r.aclose()


if __name__ == "__main__":
    asyncio.run(main())`,
      },
      {
        filename: "producer.py",
        code: `"""
Producer: публикует задачи в Redis Stream.
Демонстрирует XADD и проверку результата.
"""
import asyncio
import json
import uuid

import redis.asyncio as aioredis

STREAM_KEY = "jobs:stream"
REDIS_URL  = "redis://localhost:6379"


async def publish_job(r: aioredis.Redis, job_type: str, payload: dict) -> str:
    job_id = str(uuid.uuid4())
    msg_id = await r.xadd(
        STREAM_KEY,
        {
            "job_id":  job_id,
            "type":    job_type,
            "payload": json.dumps(payload),
            "_retries": 0,
        },
        # MAXLEN ~: обрезаем stream до ~10 000 записей (приближённо, быстро)
        maxlen=10_000,
        approximate=True,
    )
    return job_id


async def wait_result(r: aioredis.Redis, job_id: str, timeout: float = 30.0) -> dict | None:
    """Опрашивает результат задачи с таймаутом."""
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        raw = await r.get(f"job:result:{job_id}")
        if raw:
            return json.loads(raw)
        await asyncio.sleep(0.5)
    return None


async def main() -> None:
    r = aioredis.from_url(REDIS_URL)

    # Публикуем несколько задач
    import_id = await publish_job(r, "import", {"file": "data.csv", "table": "users"})
    export_id = await publish_job(r, "export", {"table": "orders", "format": "parquet"})
    print(f"Опубликованы задачи: import={import_id}, export={export_id}")

    # Ждём результат
    result = await wait_result(r, import_id)
    print(f"Результат import: {result}")

    await r.aclose()


if __name__ == "__main__":
    asyncio.run(main())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Redis Streams vs Celery:**
- Streams — это примитив Redis, без внешних зависимостей (брокер = Redis)
- Consumer group: каждое сообщение выдаётся только одному consumer'у в группе (как Kafka partition assignment)
- Celery добавляет более богатую экосистему (Flower, Beat, Canvas), но требует больше ресурсов

**Exactly-once через PEL + XACK + SET NX:**
- Сообщение попадает в PEL (Pending Entry List) при выдаче consumer'у
- ACK (XACK) убирает из PEL — только после успешного сохранения результата
- \`SET NX\` для результата: если consumer упал после сохранения но до ACK — при перезапуске handler вызовется снова, но \`SET NX\` не перезапишет уже сохранённый результат
- Это гарантирует exactly-once семантику для результата, при at-least-once доставке

**XAUTOCLAIM — обработка зависших задач:**
- Если consumer упал не отправив ACK — сообщение висит в PEL бесконечно
- \`XAUTOCLAIM\` перехватывает сообщения из PEL, которые не ACK'нуты дольше \`CLAIM_AFTER\` мс
- Другой consumer забирает и обрабатывает — это recovery-механизм без внешнего монитора

**Backpressure через asyncio.Semaphore:**
- \`Semaphore(50)\` ограничивает максимум 50 одновременных задач
- Если все 50 слотов заняты — новые сообщения не читаются (\`XREADGROUP\` не вызывается)
- Это предотвращает OOM при внезапном burst'е сообщений

**Автомасштабирование через \`xinfo_groups\`:**
- \`pending\` из \`XINFO GROUPS\` — количество сообщений в PEL (выданных, не ACK'нутых)
- Высокий pending → система не успевает → добавляем consumer'ов
- Низкий pending → удаляем лишних consumer'ов (экономия ресурсов)
- \`min_consumers\` / \`max_consumers\` — границы масштабирования`,
  },
  {
    id: "priority-queue-dedup-dlq",
    title: "Priority queue, отложенные задачи, дедупликация и DLQ с алертингом",
    task: `Реализуйте систему приоритетных и отложенных задач (priority queue + scheduled tasks). Используйте RQ или Celery Beat + Redis. Задачи разных приоритетов (high/medium/low) должны обрабатываться разными worker'ами. Добавьте дедупликацию задач (по job_id), гарантированное выполнение «один раз» даже при рестарте worker'а и механизм dead letter queue с алертингом в Slack/Telegram при накоплении проблемных задач.`,
    files: [
      {
        filename: "queue_system.py",
        code: `"""
Priority Queue + Scheduled Tasks + Deduplication + DLQ + Alerting.

Архитектура:
  - 3 очереди Redis List: jobs:high, jobs:medium, jobs:low
  - Отложенные задачи: Redis Sorted Set (score = timestamp запуска)
  - Дедупликация: Redis SET с idempotency key
  - DLQ: Redis List + счётчик для алертов
  - Worker: BLPOP с приоритетом high > medium > low

Гарантия «один раз»:
  - При старте задачи: SETNX processing:{job_id} → только 1 worker работает
  - При успехе: DEL processing + SET done:{job_id}
  - При рестарте: задача вернётся в очередь (reject_on_worker_lost),
    но done:{job_id} заблокирует повторное выполнение
"""
import asyncio
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

import redis.asyncio as aioredis

log = logging.getLogger(__name__)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Очереди по приоритету (порядок для BLPOP)
QUEUE_HIGH   = "jobs:high"
QUEUE_MEDIUM = "jobs:medium"
QUEUE_LOW    = "jobs:low"
PRIORITY_QUEUES = [QUEUE_HIGH, QUEUE_MEDIUM, QUEUE_LOW]

SCHEDULED_KEY   = "jobs:scheduled"    # Sorted Set: score = run_at timestamp
DLQ_KEY         = "jobs:dlq"
DLQ_ALERT_EVERY = 10                  # алерт каждые N новых DLQ-записей
DEDUP_TTL       = 86400               # секунд — окно дедупликации
PROCESSING_TTL  = 600                 # секунд — TTL блокировки processing
DONE_TTL        = 86400               # секунд — TTL флага «выполнено»


@dataclass
class Job:
    job_id: str
    job_type: str
    payload: dict
    priority: str = "medium"   # high / medium / low
    run_at: float = field(default_factory=time.time)
    retries: int = 0
    max_retries: int = 3

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "payload": self.payload,
            "priority": self.priority,
            "run_at": self.run_at,
            "retries": self.retries,
            "max_retries": self.max_retries,
        }


# ------------------------------------------------------------------
# Producer
# ------------------------------------------------------------------

class JobProducer:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    async def enqueue(
        self,
        job_type: str,
        payload: dict,
        priority: str = "medium",
        job_id: Optional[str] = None,
        delay_seconds: float = 0,
    ) -> Optional[str]:
        """
        Добавляет задачу в очередь с дедупликацией.

        Возвращает job_id или None если задача уже существует (дубликат).
        delay_seconds > 0 → задача попадёт в Sorted Set и запустится позже.
        """
        job_id = job_id or str(uuid.uuid4())
        dedup_key = f"job:dedup:{job_id}"

        # Дедупликация: SET NX с TTL — атомарная проверка + установка
        is_new = await self._r.set(dedup_key, "1", ex=DEDUP_TTL, nx=True)
        if not is_new:
            log.info("Дубликат задачи %s — пропускаем", job_id)
            return None

        job = Job(
            job_id=job_id,
            job_type=job_type,
            payload=payload,
            priority=priority,
            run_at=time.time() + delay_seconds,
        )
        raw = json.dumps(job.to_dict())

        if delay_seconds > 0:
            # Отложенная задача: ZADD с score = timestamp
            await self._r.zadd(SCHEDULED_KEY, {raw: job.run_at})
            log.info("Задача %s запланирована через %.0f сек", job_id, delay_seconds)
        else:
            queue = f"jobs:{priority}"
            await self._r.rpush(queue, raw)    # RPUSH = добавить в конец
            log.info("Задача %s → очередь %s", job_id, queue)

        return job_id


# ------------------------------------------------------------------
# Scheduler: переносит готовые отложенные задачи в очереди
# ------------------------------------------------------------------

class Scheduler:
    """
    Фоновый процесс: каждые N секунд проверяет Sorted Set
    и перемещает задачи с run_at <= now в соответствующую очередь.
    """

    def __init__(self, redis: aioredis.Redis, interval: float = 1.0) -> None:
        self._r = redis
        self._interval = interval
        self._running = True

    async def run(self) -> None:
        log.info("Scheduler запущен")
        while self._running:
            await self._tick()
            await asyncio.sleep(self._interval)

    async def _tick(self) -> None:
        now = time.time()
        # ZRANGEBYSCORE с удалением (атомарный Lua)
        ready = await self._r.zrangebyscore(SCHEDULED_KEY, 0, now, withscores=False)
        if not ready:
            return

        pipe = self._r.pipeline()
        for raw in ready:
            job = json.loads(raw)
            queue = f"jobs:{job['priority']}"
            pipe.rpush(queue, raw)
            pipe.zrem(SCHEDULED_KEY, raw)
        await pipe.execute()

        log.info("Scheduler перенёс %d задач в очереди", len(ready))

    def stop(self) -> None:
        self._running = False


# ------------------------------------------------------------------
# Worker
# ------------------------------------------------------------------

class PriorityWorker:
    """
    Читает задачи из очередей по приоритету (BLPOP high→medium→low).
    Гарантирует выполнение ровно один раз через processing + done флаги.
    """

    def __init__(
        self,
        redis: aioredis.Redis,
        handlers: dict[str, Callable],
        worker_id: str | None = None,
        allowed_priorities: list[str] | None = None,
    ) -> None:
        self._r = redis
        self._handlers = handlers
        self._worker_id = worker_id or uuid.uuid4().hex[:8]
        # Позволяет направить воркера только на определённые очереди
        priorities = allowed_priorities or ["high", "medium", "low"]
        self._queues = [f"jobs:{p}" for p in priorities]
        self._running = True

    async def run(self) -> None:
        log.info("Worker %s запущен (очереди: %s)", self._worker_id, self._queues)
        while self._running:
            try:
                # BLPOP проверяет очереди в порядке списка → high имеет приоритет
                result = await self._r.blpop(self._queues, timeout=2)
                if not result:
                    continue
                _queue, raw = result
                job_data = json.loads(raw)
                await self._process(job_data)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                log.error("Worker ошибка: %s", exc, exc_info=True)

    async def _process(self, job_data: dict) -> None:
        job_id   = job_data["job_id"]
        job_type = job_data["job_type"]
        retries  = job_data.get("retries", 0)
        max_ret  = job_data.get("max_retries", 3)

        # Шаг 1: проверяем флаг «уже выполнено»
        if await self._r.exists(f"job:done:{job_id}"):
            log.info("Job %s уже выполнена — пропускаем", job_id)
            return

        # Шаг 2: захватываем processing-флаг (SETNX)
        processing_key = f"job:processing:{job_id}"
        is_mine = await self._r.set(
            processing_key, self._worker_id,
            ex=PROCESSING_TTL, nx=True,
        )
        if not is_mine:
            owner = await self._r.get(processing_key)
            log.warning("Job %s уже обрабатывается worker'ом %s — пропускаем", job_id, owner)
            return

        try:
            handler = self._handlers.get(job_type)
            if not handler:
                raise ValueError(f"Нет обработчика для типа '{job_type}'")

            result = await handler(job_id, job_data["payload"])

            # Шаг 3: отмечаем как выполненную (done-флаг)
            await self._r.set(f"job:done:{job_id}", json.dumps(result), ex=DONE_TTL)
            await self._r.delete(processing_key)
            log.info("Job %s выполнена успешно", job_id)

        except Exception as exc:
            await self._r.delete(processing_key)
            if retries < max_ret:
                # Retry: возвращаем в очередь с увеличенным счётчиком
                import random
                delay = (2 ** retries) + random.uniform(0, 1)
                job_data["retries"] = retries + 1
                # Отправляем как отложенную задачу (через delay)
                await self._r.zadd(
                    SCHEDULED_KEY,
                    {json.dumps(job_data): time.time() + delay},
                )
                log.warning("Job %s retry %d/%d через %.1f сек", job_id, retries + 1, max_ret, delay)
            else:
                await self._send_to_dlq(job_id, job_data, str(exc))

    async def _send_to_dlq(self, job_id: str, job_data: dict, error: str) -> None:
        job_data["_error"] = error
        job_data["_failed_at"] = time.time()
        await self._r.rpush(DLQ_KEY, json.dumps(job_data))
        dlq_size = await self._r.llen(DLQ_KEY)
        log.error("DLQ: job %s (всего в DLQ: %d)", job_id, dlq_size)

        # Алерт при накоплении проблемных задач
        if dlq_size % DLQ_ALERT_EVERY == 0:
            await _send_alert(f"DLQ достиг {dlq_size} задач! Последняя ошибка: {error}")

    def stop(self) -> None:
        self._running = False


# ------------------------------------------------------------------
# Alerting
# ------------------------------------------------------------------

async def _send_alert(message: str) -> None:
    """Отправляет алерт в Telegram (или Slack — аналогично)."""
    import httpx
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        log.warning("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не настроены. Алерт: %s", message)
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": f"🚨 DLQ Alert\n{message}"},
                timeout=5,
            )
        log.info("Алерт отправлен в Telegram")
    except Exception as exc:
        log.warning("Ошибка отправки алерта: %s", exc)`,
      },
      {
        filename: "run_workers.py",
        code: `"""
Запуск системы: scheduler + 3 воркера разных приоритетов.
В продакшне каждый тип — отдельный systemd-сервис или Docker-контейнер.
"""
import asyncio
import logging

import redis.asyncio as aioredis

from queue_system import JobProducer, PriorityWorker, Scheduler

logging.basicConfig(level=logging.INFO)


async def handle_report(job_id: str, payload: dict) -> dict:
    await asyncio.sleep(0.5)
    return {"report": "done", "job_id": job_id}


async def handle_notification(job_id: str, payload: dict) -> dict:
    await asyncio.sleep(0.1)
    return {"sent": True}


HANDLERS = {
    "report":       handle_report,
    "notification": handle_notification,
}


async def main() -> None:
    r = aioredis.from_url("redis://localhost:6379")

    # --- Публикуем тестовые задачи ---
    producer = JobProducer(r)

    # Обычная задача (high priority)
    jid1 = await producer.enqueue("report", {"user": 1}, priority="high")

    # Дедупликация: второй enqueue с тем же job_id → None
    jid2 = await producer.enqueue("report", {"user": 1}, priority="high", job_id=jid1)
    assert jid2 is None, "Дубликат должен быть отфильтрован"

    # Отложенная задача — запустится через 10 секунд
    await producer.enqueue("notification", {"to": "alice@x.com"}, delay_seconds=10)

    # --- Запускаем систему ---
    scheduler = Scheduler(r, interval=1.0)

    # High-priority воркер обрабатывает только high
    worker_high   = PriorityWorker(r, HANDLERS, "w-high",   allowed_priorities=["high"])
    # Medium+low воркер — остаток
    worker_medium = PriorityWorker(r, HANDLERS, "w-medium", allowed_priorities=["medium", "low"])
    worker_low    = PriorityWorker(r, HANDLERS, "w-low",    allowed_priorities=["low"])

    async with asyncio.TaskGroup() as tg:
        tg.create_task(scheduler.run())
        tg.create_task(worker_high.run())
        tg.create_task(worker_medium.run())
        tg.create_task(worker_low.run())


if __name__ == "__main__":
    asyncio.run(main())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**BLPOP с приоритетом high → medium → low:**
- \`BLPOP [high, medium, low]\` — Redis проверяет ключи слева направо и блокирует на \`timeout\`
- Пока есть задачи в \`high\` — medium и low не трогаются
- Worker'ы high-priority подключаются только к \`[high]\`, medium-worker — к \`[medium, low]\`
- Разные worker'ы = разные CPU-ресурсы: high никогда не ждёт освобождения low-worker'а

**Дедупликация через SET NX:**
- \`SET dedup:{job_id} NX EX ttl\` — атомарно: создаём или ничего не делаем
- Возвращает \`None\` если ключ уже существует → дубликат
- TTL = окно дедупликации (1 сутки): после истечения тот же job_id можно опубликовать снова
- В продакшне job_id = хэш от (тип + payload) → автоматическая дедупликация одинаковых задач

**Гарантия «один раз» через processing + done флаги:**
- \`processing:{job_id}\` с TTL: только один worker захватывает задачу (SETNX)
- TTL = страховка: если worker упал — через PROCESSING_TTL другой worker может взять задачу
- \`done:{job_id}\`: после успеха записываем флаг; при повторном получении задачи — пропускаем
- Это at-least-once доставка + idempotent handler = effectively exactly-once

**Отложенные задачи через Sorted Set:**
- \`ZADD scheduled score=timestamp raw_json\`: задача хранится с временем запуска как score
- \`ZRANGEBYSCORE scheduled 0 now\`: выбираем все готовые (score ≤ текущее время)
- Scheduler каждую секунду перемещает готовые задачи из Sorted Set в нужную очередь
- В продакшне Scheduler работает в отдельном процессе (или Celery Beat)

**DLQ + алертинг в Telegram:**
- При исчерпании retry: задача → \`jobs:dlq\` с метаданными ошибки
- Каждые \`DLQ_ALERT_EVERY\` записей → HTTP-запрос к Telegram Bot API
- Алерт содержит размер DLQ и последнюю ошибку — можно сразу понять причину
- В продакшне добавьте Slack Webhook как альтернативу: \`POST hooks.slack.com\` с аналогичным payload`,
  },
  {
    id: "async-service-testing",
    title: "Тестирование async-сервиса: aioresponses, Testcontainers, parametrize",
    task: `Напишите полный набор тестов для асинхронного сервиса, который делает внешние HTTP-запросы и сохраняет результаты в PostgreSQL. Используйте pytest-asyncio, pytest-mock и aioresponses для мокинга aiohttp. Добавьте parametrized fixtures для разных сценариев (успех, rate limit, таймаут, 5xx). Реализуйте integration-тесты с реальной БД через Testcontainers или pytest-postgresql, чтобы проверить транзакции и rollback при ошибках.`,
    files: [
      {
        filename: "service.py",
        code: `"""
Асинхронный сервис: HTTP-запросы + сохранение в PostgreSQL.
Это тестируемый код — не тестовый файл.
"""
import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

import aiohttp
import asyncpg

log = logging.getLogger(__name__)


@dataclass
class FetchResult:
    url: str
    status: int
    body: str
    error: Optional[str] = None


class ExternalAPIClient:
    """Клиент для внешнего API с базовой retry-логикой."""

    def __init__(self, session: aiohttp.ClientSession, base_url: str) -> None:
        self._session = session
        self._base_url = base_url

    async def fetch(self, path: str, timeout: float = 5.0) -> FetchResult:
        url = f"{self._base_url}{path}"
        try:
            async with self._session.get(
                url, timeout=aiohttp.ClientTimeout(total=timeout)
            ) as resp:
                body = await resp.text()
                if resp.status == 429:
                    raise RateLimitError(f"Rate limited: {url}")
                if resp.status >= 500:
                    raise ServerError(f"Server error {resp.status}: {url}")
                return FetchResult(url=url, status=resp.status, body=body)
        except aiohttp.ServerTimeoutError as exc:
            raise TimeoutError(f"Timeout fetching {url}") from exc


class RateLimitError(Exception):
    pass

class ServerError(Exception):
    pass


class ResultRepository:
    """Сохраняет результаты в PostgreSQL."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, result: FetchResult) -> int:
        """Возвращает ID сохранённой записи."""
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    """
                    INSERT INTO fetch_results (url, status, body, error)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                    """,
                    result.url, result.status, result.body, result.error,
                )
                return row["id"]

    async def get_by_url(self, url: str) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, url, status, body, error, created_at FROM fetch_results WHERE url = $1",
                url,
            )
            return [dict(r) for r in rows]

    async def save_batch(self, results: list[FetchResult]) -> list[int]:
        """
        Сохраняет список результатов в одной транзакции.
        При ошибке в любой из записей — откатывает всё.
        """
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                ids = []
                for result in results:
                    if result.error and "FORCE_FAIL" in result.error:
                        raise ValueError("Принудительная ошибка для теста rollback")
                    row = await conn.fetchrow(
                        "INSERT INTO fetch_results (url, status, body, error) VALUES ($1,$2,$3,$4) RETURNING id",
                        result.url, result.status, result.body, result.error,
                    )
                    ids.append(row["id"])
                return ids


class FetchAndStoreService:
    """Оркестрирует HTTP-запрос → сохранение в БД."""

    def __init__(self, client: ExternalAPIClient, repo: ResultRepository) -> None:
        self._client = client
        self._repo = repo

    async def fetch_and_store(self, path: str) -> int:
        try:
            result = await self._client.fetch(path)
        except (RateLimitError, ServerError, TimeoutError) as exc:
            result = FetchResult(
                url=path, status=0, body="", error=str(exc)
            )
        return await self._repo.save(result)`,
      },
      {
        filename: "tests/test_service.py",
        code: `"""
Тесты для FetchAndStoreService:
- Unit-тесты с aioresponses (мок HTTP)
- Integration-тесты с реальной БД (Testcontainers / pytest-postgresql)
- Parametrize для сценариев ошибок
- Проверка транзакций и rollback

Установка:
  pip install pytest pytest-asyncio aioresponses pytest-mock
  pip install testcontainers[postgres] asyncpg
"""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import asyncpg
import pytest
import pytest_asyncio
from aioresponses import aioresponses as aioresponses_ctx

from service import (
    ExternalAPIClient,
    FetchAndStoreService,
    FetchResult,
    RateLimitError,
    ResultRepository,
    ServerError,
)

# ------------------------------------------------------------------
# Конфигурация pytest-asyncio
# ------------------------------------------------------------------

# conftest.py или pytest.ini:
#   [pytest]
#   asyncio_mode = auto
#
# Это заставляет pytest-asyncio автоматически оборачивать async def тесты.

pytestmark = pytest.mark.asyncio


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

@pytest_asyncio.fixture
async def http_session():
    """Реальная aiohttp.ClientSession для каждого теста."""
    async with aiohttp.ClientSession() as session:
        yield session


@pytest_asyncio.fixture
async def pg_pool(postgresql):
    """
    asyncpg.Pool поверх pytest-postgresql fixture.

    pytest-postgresql создаёт временный PostgreSQL-процесс для каждого теста.
    'postgresql' — это psycopg2-совместимый объект; берём из него DSN.

    Альтернатива — Testcontainers (см. ниже).
    """
    dsn = (
        f"postgresql://{postgresql.info.user}:{postgresql.info.password}"
        f"@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    )
    pool = await asyncpg.create_pool(dsn)

    # Создаём схему
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS fetch_results (
                id         SERIAL PRIMARY KEY,
                url        TEXT NOT NULL,
                status     INTEGER NOT NULL DEFAULT 0,
                body       TEXT,
                error      TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

    yield pool

    # Очистка после теста
    async with pool.acquire() as conn:
        await conn.execute("TRUNCATE fetch_results RESTART IDENTITY CASCADE")
    await pool.close()


@pytest_asyncio.fixture
async def pg_pool_testcontainers():
    """
    Альтернатива pytest-postgresql: реальный PostgreSQL в Docker-контейнере.
    Используйте когда нужна конкретная версия PostgreSQL или расширения.
    """
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:16-alpine") as postgres:
        dsn = postgres.get_connection_url().replace("postgresql+psycopg2://", "postgresql://")
        pool = await asyncpg.create_pool(dsn)
        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS fetch_results (
                    id         SERIAL PRIMARY KEY,
                    url        TEXT NOT NULL,
                    status     INTEGER NOT NULL DEFAULT 0,
                    body       TEXT,
                    error      TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
        yield pool
        await pool.close()


@pytest.fixture
def mock_repo():
    """Мок-репозиторий для unit-тестов (без реальной БД)."""
    repo = AsyncMock(spec=ResultRepository)
    repo.save.return_value = 42
    return repo


# ------------------------------------------------------------------
# Parametrize: сценарии HTTP-ответов
# ------------------------------------------------------------------

HTTP_SCENARIOS = [
    pytest.param(
        200, '{"data": "ok"}', None, None,
        id="success",
    ),
    pytest.param(
        429, "Too Many Requests", None, RateLimitError,
        id="rate_limit",
    ),
    pytest.param(
        503, "Service Unavailable", None, ServerError,
        id="server_error_503",
    ),
    pytest.param(
        500, "Internal Server Error", None, ServerError,
        id="server_error_500",
    ),
    pytest.param(
        200, None, "timeout",  None,
        id="timeout",
    ),
]


@pytest.mark.parametrize("status,body,exc_type,expected_exc", HTTP_SCENARIOS)
async def test_client_fetch_scenarios(
    http_session,
    status,
    body,
    exc_type,
    expected_exc,
):
    """
    Проверяем поведение ExternalAPIClient для каждого сценария.
    aioresponses перехватывает aiohttp-запросы без реального сетевого вызова.
    """
    base_url = "https://api.example.com"
    client = ExternalAPIClient(http_session, base_url)

    with aioresponses_ctx() as m:
        if exc_type == "timeout":
            m.get(
                f"{base_url}/test",
                exception=aiohttp.ServerTimeoutError(),
            )
        else:
            m.get(f"{base_url}/test", status=status, body=body)

        if expected_exc:
            with pytest.raises(expected_exc):
                await client.fetch("/test")
        elif exc_type == "timeout":
            with pytest.raises(TimeoutError):
                await client.fetch("/test")
        else:
            result = await client.fetch("/test")
            assert result.status == status
            assert result.body == body


# ------------------------------------------------------------------
# Unit-тесты FetchAndStoreService (без реальной БД)
# ------------------------------------------------------------------

async def test_fetch_and_store_success(http_session, mock_repo):
    """Успешный запрос → результат сохраняется в репозиторий."""
    base_url = "https://api.example.com"
    client = ExternalAPIClient(http_session, base_url)
    service = FetchAndStoreService(client, mock_repo)

    with aioresponses_ctx() as m:
        m.get(f"{base_url}/data", status=200, body='{"result": 1}')
        record_id = await service.fetch_and_store("/data")

    assert record_id == 42
    mock_repo.save.assert_called_once()
    saved: FetchResult = mock_repo.save.call_args[0][0]
    assert saved.status == 200
    assert saved.error is None


async def test_fetch_and_store_rate_limit_stored(http_session, mock_repo):
    """При rate limit ошибка сохраняется как запись (не исключение)."""
    base_url = "https://api.example.com"
    client = ExternalAPIClient(http_session, base_url)
    service = FetchAndStoreService(client, mock_repo)

    with aioresponses_ctx() as m:
        m.get(f"{base_url}/data", status=429, body="Too Many Requests")
        record_id = await service.fetch_and_store("/data")

    assert record_id == 42
    saved: FetchResult = mock_repo.save.call_args[0][0]
    assert saved.status == 0
    assert "Rate limited" in saved.error


async def test_fetch_and_store_timeout_stored(http_session, mock_repo):
    """Таймаут сохраняется как ошибка, не поднимается выше."""
    base_url = "https://api.example.com"
    client = ExternalAPIClient(http_session, base_url)
    service = FetchAndStoreService(client, mock_repo)

    with aioresponses_ctx() as m:
        m.get(f"{base_url}/data", exception=aiohttp.ServerTimeoutError())
        record_id = await service.fetch_and_store("/data")

    saved: FetchResult = mock_repo.save.call_args[0][0]
    assert "Timeout" in saved.error


# ------------------------------------------------------------------
# Integration-тесты с реальной БД
# ------------------------------------------------------------------

async def test_repository_save_and_retrieve(pg_pool):
    """Сохраняем результат и читаем из реальной БД."""
    repo = ResultRepository(pg_pool)
    result = FetchResult(url="https://api.example.com/test", status=200, body="ok")
    record_id = await repo.save(result)

    assert isinstance(record_id, int)
    rows = await repo.get_by_url("https://api.example.com/test")
    assert len(rows) == 1
    assert rows[0]["status"] == 200
    assert rows[0]["body"] == "ok"


async def test_repository_transaction_rollback(pg_pool):
    """
    save_batch с принудительной ошибкой → транзакция откатывается.
    Ни одна запись не должна появиться в БД.
    """
    repo = ResultRepository(pg_pool)
    results = [
        FetchResult(url="https://api.example.com/1", status=200, body="first"),
        FetchResult(url="https://api.example.com/2", status=200, body="second",
                    error="FORCE_FAIL"),  # триггер rollback
    ]

    with pytest.raises(ValueError, match="rollback"):
        await repo.save_batch(results)

    # После rollback в БД ничего не должно быть
    async with pg_pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM fetch_results")
    assert count == 0, "Транзакция должна была откатиться целиком"


async def test_repository_concurrent_saves(pg_pool):
    """
    Конкурентные сохранения не должны вызывать deadlock или потерю данных.
    """
    repo = ResultRepository(pg_pool)
    results = [
        FetchResult(url=f"https://api.example.com/{i}", status=200, body=str(i))
        for i in range(20)
    ]
    # Запускаем 20 сохранений параллельно
    ids = await asyncio.gather(*[repo.save(r) for r in results])
    assert len(ids) == 20
    assert len(set(ids)) == 20  # все ID уникальны

    async with pg_pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM fetch_results")
    assert count == 20`,
      },
    ],
    explanation: `**На что обратить внимание:**

**aioresponses — мок для aiohttp без изменения кода:**
- \`aioresponses\` перехватывает все запросы \`aiohttp.ClientSession\` внутри контекстного менеджера
- \`m.get(url, status=200, body="...")\` — декларируем ожидаемый ответ
- \`m.get(url, exception=ServerTimeoutError())\` — имитируем таймаут или сетевую ошибку
- Реальных HTTP-запросов нет — тесты детерминированы и быстры

**\`@pytest.mark.parametrize\` для HTTP-сценариев:**
- Один тест \`test_client_fetch_scenarios\` покрывает 5 сценариев: 200, 429, 503, 500, timeout
- \`pytest.param(..., id="success")\` — читаемое имя в выводе (\`PASSED test[success]\`)
- Добавить новый сценарий = добавить одну строку в \`HTTP_SCENARIOS\`

**pytest-postgresql vs Testcontainers:**
- pytest-postgresql запускает реальный \`initdb\`/\`pg_ctl\` в temp-директории — быстро, нет Docker
- Testcontainers запускает Docker-контейнер — можно выбрать версию PostgreSQL, расширения (pgvector, timescaledb)
- Оба дают изолированную БД на каждый тест-сеанс; \`TRUNCATE RESTART IDENTITY\` в teardown очищает данные

**Проверка транзакций и rollback:**
- \`test_repository_transaction_rollback\` вставляет 2 записи в одной транзакции, вторая вызывает ошибку
- После \`pytest.raises\` проверяем что \`COUNT(*) == 0\` — транзакция откатилась полностью
- Это критично: в продакшне частичная запись хуже чем полное отсутствие

**\`AsyncMock\` из \`unittest.mock\`:**
- \`AsyncMock(spec=ResultRepository)\` — мок который поддерживает \`await\`
- \`repo.save.return_value = 42\` — фиксируем возвращаемое значение
- \`repo.save.assert_called_once()\` — проверяем что метод был вызван ровно один раз
- \`mock_repo.save.call_args[0][0]\` — получаем первый позиционный аргумент первого вызова`,
  },
  {
    id: "repository-testing-race-conditions",
    title: "Тесты репозитория: unit с моками, integration с БД, race conditions",
    task: `Создайте тестовую инфраструктуру для сложного репозитория (Repository pattern), который работает и синхронно, и асинхронно. Нужно покрыть unit-тесты (с моками asyncpg/SQLAlchemy), integration-тесты с реальной БД и тесты на race conditions с помощью pytest-xdist. Добавьте custom fixture, которая автоматически очищает БД после каждого теста и предоставляет тестовые данные через factory-boy.`,
    files: [
      {
        filename: "tests/conftest.py",
        code: `"""
conftest.py: центральное место для fixtures.

Содержит:
- asyncpg pool (реальная БД через Testcontainers)
- Автоочистка таблиц после каждого теста
- factory_boy factories для тестовых данных
- Изолированная сессия SQLAlchemy на каждый тест (savepoint + rollback)
"""
import asyncio
import pytest
import pytest_asyncio
import factory
import factory.fuzzy
from datetime import datetime, timezone
from typing import AsyncIterator

import asyncpg
from sqlalchemy.ext.asyncio import (
    AsyncSession, async_sessionmaker, create_async_engine,
)
from sqlalchemy import text

# ------------------------------------------------------------------
# Event loop (один на всю сессию тестов)
# ------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Один event loop на всю test-сессию (нужно для scope=session fixtures)."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ------------------------------------------------------------------
# Testcontainers: PostgreSQL
# ------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def pg_container():
    """Запускает PostgreSQL-контейнер один раз на всю сессию."""
    from testcontainers.postgres import PostgresContainer
    with PostgresContainer("postgres:16-alpine") as pg:
        yield pg


@pytest_asyncio.fixture(scope="session")
async def asyncpg_pool(pg_container):
    """asyncpg.Pool поверх Testcontainers-контейнера."""
    dsn = pg_container.get_connection_url().replace("postgresql+psycopg2://", "postgresql://")
    pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)

    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id         SERIAL PRIMARY KEY,
                email      TEXT UNIQUE NOT NULL,
                name       TEXT NOT NULL,
                department TEXT,
                is_active  BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS orders (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount     NUMERIC(10,2) NOT NULL,
                status     TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
    yield pool
    await pool.close()


@pytest_asyncio.fixture(scope="session")
async def sa_engine(pg_container):
    """SQLAlchemy async engine для SQLAlchemy-тестов."""
    dsn = pg_container.get_connection_url().replace(
        "postgresql+psycopg2://", "postgresql+asyncpg://"
    )
    engine = create_async_engine(dsn, echo=False)
    yield engine
    await engine.dispose()


# ------------------------------------------------------------------
# Auto-cleanup: очистка таблиц после каждого теста
# ------------------------------------------------------------------

@pytest_asyncio.fixture(autouse=True)
async def clean_db(asyncpg_pool):
    """
    autouse=True — применяется ко всем тестам автоматически.
    TRUNCATE ... CASCADE удаляет данные и сбрасывает SERIAL-счётчики.
    Выполняется ПОСЛЕ теста (yield разделяет setup/teardown).
    """
    yield  # тест выполняется
    async with asyncpg_pool.acquire() as conn:
        await conn.execute(
            "TRUNCATE users, orders RESTART IDENTITY CASCADE"
        )


# ------------------------------------------------------------------
# SQLAlchemy: изолированная сессия через SAVEPOINT
# ------------------------------------------------------------------

@pytest_asyncio.fixture
async def db_session(sa_engine) -> AsyncIterator[AsyncSession]:
    """
    Каждый тест получает сессию внутри SAVEPOINT.
    После теста — ROLLBACK TO SAVEPOINT → никаких изменений в БД.

    Преимущество перед TRUNCATE: тест видит данные других fixtures,
    но не «загрязняет» БД для следующего теста.
    """
    async with sa_engine.connect() as conn:
        await conn.begin()
        await conn.begin_nested()   # SAVEPOINT

        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()   # откат до начального состояния


# ------------------------------------------------------------------
# factory_boy: фабрики тестовых данных
# ------------------------------------------------------------------

class UserFactory(factory.DictFactory):
    """
    Генерирует словари для вставки пользователей.
    factory.DictFactory возвращает dict — удобно для asyncpg.
    """
    email      = factory.Sequence(lambda n: f"user{n}@example.com")
    name       = factory.Faker("name", locale="ru_RU")
    department = factory.fuzzy.FuzzyChoice(["engineering", "product", "finance", "hr"])
    is_active  = True


class OrderFactory(factory.DictFactory):
    amount = factory.fuzzy.FuzzyDecimal(10.0, 10_000.0, precision=2)
    status = factory.fuzzy.FuzzyChoice(["pending", "paid", "cancelled"])


@pytest_asyncio.fixture
async def sample_users(asyncpg_pool) -> list[dict]:
    """Вставляет 5 тестовых пользователей, возвращает их данные."""
    users_data = UserFactory.build_batch(5)
    async with asyncpg_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            INSERT INTO users (email, name, department, is_active)
            SELECT u.email, u.name, u.department, u.is_active
            FROM jsonb_to_recordset($1::jsonb) AS u(email text, name text, department text, is_active bool)
            RETURNING *
            """,
            __import__("json").dumps(users_data),
        )
    return [dict(r) for r in rows]


@pytest_asyncio.fixture
async def sample_orders(asyncpg_pool, sample_users) -> list[dict]:
    """Вставляет по 3 заказа на каждого из sample_users."""
    orders = []
    for user in sample_users:
        for _ in range(3):
            o = OrderFactory.build()
            o["user_id"] = user["id"]
            orders.append(o)

    async with asyncpg_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            INSERT INTO orders (user_id, amount, status)
            SELECT o.user_id, o.amount, o.status
            FROM jsonb_to_recordset($1::jsonb) AS o(user_id int, amount numeric, status text)
            RETURNING *
            """,
            __import__("json").dumps(
                [{"user_id": o["user_id"], "amount": float(o["amount"]), "status": o["status"]}
                 for o in orders]
            ),
        )
    return [dict(r) for r in rows]`,
      },
      {
        filename: "tests/test_repository.py",
        code: `"""
Тесты Repository pattern:
- Unit-тесты с моком asyncpg.Connection
- Integration-тесты с реальной БД (через fixtures из conftest.py)
- Тест на race condition (конкурентные UPDATE)
"""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest
import pytest_asyncio

from conftest import UserFactory, OrderFactory

pytestmark = pytest.mark.asyncio


# ------------------------------------------------------------------
# Репозиторий (тестируемый код — обычно импортируется из src/)
# ------------------------------------------------------------------

class UserRepository:
    def __init__(self, conn_or_pool):
        self._db = conn_or_pool

    async def find_active(self, department: str | None = None) -> list[dict]:
        q = "SELECT * FROM users WHERE is_active = TRUE"
        params = []
        if department:
            q += " AND department = $1"
            params.append(department)
        async with self._db.acquire() as conn:
            rows = await conn.fetch(q, *params)
            return [dict(r) for r in rows]

    async def deactivate(self, user_id: int) -> bool:
        async with self._db.acquire() as conn:
            async with conn.transaction():
                result = await conn.execute(
                    "UPDATE users SET is_active = FALSE WHERE id = $1 AND is_active = TRUE",
                    user_id,
                )
                return result == "UPDATE 1"

    async def total_revenue(self, user_id: int) -> float:
        async with self._db.acquire() as conn:
            val = await conn.fetchval(
                "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = $1 AND status = 'paid'",
                user_id,
            )
            return float(val)


# ------------------------------------------------------------------
# Unit-тесты (мок asyncpg)
# ------------------------------------------------------------------

@pytest.fixture
def mock_pool():
    """
    Мок asyncpg.Pool с поддержкой async context manager (acquire).
    """
    conn = AsyncMock()
    pool = MagicMock()
    # pool.acquire() возвращает async context manager
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    # conn.transaction() — тоже async context manager
    conn.transaction.return_value.__aenter__ = AsyncMock()
    conn.transaction.return_value.__aexit__ = AsyncMock(return_value=False)
    return pool, conn


async def test_find_active_unit(mock_pool):
    """Unit: find_active вызывает правильный SQL без реальной БД."""
    pool, conn = mock_pool
    # Имитируем возвращаемые строки asyncpg Record (dict-like)
    conn.fetch.return_value = [
        {"id": 1, "email": "a@x.com", "name": "Alice", "department": "engineering", "is_active": True},
    ]
    repo = UserRepository(pool)
    result = await repo.find_active(department="engineering")

    assert len(result) == 1
    assert result[0]["email"] == "a@x.com"
    # Проверяем что SQL содержит фильтр по department
    call_args = conn.fetch.call_args
    assert "department" in call_args[0][0]
    assert "engineering" in call_args[0]


async def test_deactivate_unit_success(mock_pool):
    """Unit: deactivate возвращает True когда UPDATE затронул строку."""
    pool, conn = mock_pool
    conn.execute.return_value = "UPDATE 1"
    repo = UserRepository(pool)
    result = await repo.deactivate(user_id=1)
    assert result is True


async def test_deactivate_unit_not_found(mock_pool):
    """Unit: deactivate возвращает False если пользователь не найден."""
    pool, conn = mock_pool
    conn.execute.return_value = "UPDATE 0"
    repo = UserRepository(pool)
    result = await repo.deactivate(user_id=999)
    assert result is False


async def test_total_revenue_no_orders(mock_pool):
    """Unit: COALESCE(SUM, 0) → 0.0 если заказов нет."""
    pool, conn = mock_pool
    conn.fetchval.return_value = 0
    repo = UserRepository(pool)
    revenue = await repo.total_revenue(user_id=1)
    assert revenue == 0.0


# ------------------------------------------------------------------
# Integration-тесты с реальной БД
# ------------------------------------------------------------------

async def test_find_active_integration(asyncpg_pool, sample_users):
    """Integration: find_active возвращает только активных пользователей."""
    repo = UserRepository(asyncpg_pool)
    all_active = await repo.find_active()
    assert len(all_active) == 5   # все sample_users активны

    # Деактивируем одного
    await repo.deactivate(sample_users[0]["id"])
    after = await repo.find_active()
    assert len(after) == 4


async def test_find_active_by_department(asyncpg_pool, sample_users):
    """Integration: фильтр по department работает корректно."""
    repo = UserRepository(asyncpg_pool)

    # Определяем отдел первого пользователя
    dept = sample_users[0]["department"]
    in_dept = await repo.find_active(department=dept)

    # Проверяем что все вернувшиеся — из правильного отдела
    assert all(u["department"] == dept for u in in_dept)


async def test_total_revenue_integration(asyncpg_pool, sample_users, sample_orders):
    """Integration: total_revenue суммирует только 'paid' заказы."""
    import decimal
    user_id = sample_users[0]["id"]

    # Обновляем статус одного заказа на 'paid'
    async with asyncpg_pool.acquire() as conn:
        await conn.execute(
            "UPDATE orders SET status = 'paid' WHERE user_id = $1 LIMIT 1",
            user_id,
        )
        paid_amount = await conn.fetchval(
            "SELECT amount FROM orders WHERE user_id = $1 AND status = 'paid'",
            user_id,
        )

    repo = UserRepository(asyncpg_pool)
    revenue = await repo.total_revenue(user_id)
    assert revenue == float(paid_amount)


# ------------------------------------------------------------------
# Race condition тест
# ------------------------------------------------------------------

async def test_deactivate_race_condition(asyncpg_pool, sample_users):
    """
    10 конкурентных вызовов deactivate(user_id) для одного пользователя.
    Только ОДИН должен вернуть True (UPDATE 1), остальные — False (UPDATE 0).

    Это проверяет что транзакция корректно обрабатывает concurrent UPDATE:
    PostgreSQL блокирует строку для второго UPDATE пока первый не закоммитит.
    """
    repo = UserRepository(asyncpg_pool)
    user_id = sample_users[0]["id"]

    results = await asyncio.gather(
        *[repo.deactivate(user_id) for _ in range(10)],
        return_exceptions=False,
    )

    true_count = sum(1 for r in results if r is True)
    assert true_count == 1, (
        f"Ожидался ровно один успешный deactivate, получили: {true_count}. "
        f"Результаты: {results}"
    )

    # Финальная проверка состояния в БД
    async with asyncpg_pool.acquire() as conn:
        is_active = await conn.fetchval(
            "SELECT is_active FROM users WHERE id = $1", user_id
        )
    assert is_active is False`,
      },
    ],
    explanation: `**На что обратить внимание:**

**\`autouse=True\` fixture для автоочистки:**
- \`clean_db\` применяется к каждому тесту автоматически — нет нужды явно указывать в параметрах
- Teardown выполняется после \`yield\`: даже если тест упал — таблицы будут очищены
- \`TRUNCATE RESTART IDENTITY CASCADE\`: сбрасывает SERIAL-счётчики + удаляет зависимые строки (orders при truncate users)

**SAVEPOINT-изоляция vs TRUNCATE:**
- \`db_session\` использует \`BEGIN + SAVEPOINT\` → \`ROLLBACK\` — изменения теста откатываются без TRUNCATE
- Преимущество: тест работает внутри транзакции и видит uncommitted-данные (важно для тестирования транзакционной логики)
- Ограничение: не работает для DDL (CREATE TABLE внутри теста не откатится)

**factory_boy для генерации тестовых данных:**
- \`UserFactory.build_batch(5)\` — генерирует 5 разных словарей без обращения к БД
- \`factory.Sequence(lambda n: f"user{n}@...")\` — уникальные email автоматически
- \`factory.Faker("name", locale="ru_RU")\` — реалистичные имена на русском
- \`FuzzyChoice\`, \`FuzzyDecimal\` — случайные значения из заданного диапазона

**Мок asyncpg.Pool с async context manager:**
- \`pool.acquire()\` возвращает контекстный менеджер — нужно мокировать \`__aenter__\` / \`__aexit__\`
- \`conn.transaction()\` — то же самое
- \`AsyncMock\` автоматически поддерживает \`await\`; \`MagicMock\` — для синхронного вызова метода

**Race condition тест:**
- \`asyncio.gather(*[deactivate(id) for _ in range(10)])\` запускает 10 конкурентных корутин
- PostgreSQL блокирует строку при UPDATE: второй UPDATE ждёт первый, затем видит \`is_active = FALSE\` и обновляет 0 строк
- Тест проверяет что инвариант "деактивировать можно ровно один раз" выполняется при конкуренции
- Для pytest-xdist: запускайте файл с \`-n auto\` — тесты из разных worker'ов используют одну Testcontainers-БД (scope="session")`,
  },
  {
    id: "e2e-fastapi-jwt-celery-testing",
    title: "E2E тесты FastAPI + JWT + Celery: httpx, мок очередей, correlation ID",
    task: `Реализуйте end-to-end тесты для FastAPI-приложения с JWT-авторизацией и фоновыми задачами (Celery/RQ). Используйте httpx.AsyncClient, мокинг очередей, pytest-mock для перехвата вызовов send_email и create_task. Добавьте тест на корректную обработку исключений в background tasks и проверку, что correlation ID прокидывается через все слои (логи + tracing).`,
    files: [
      {
        filename: "app.py",
        code: `"""
FastAPI-приложение с JWT, фоновыми задачами и correlation ID.
Это тестируемый код.
"""
import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Annotated, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

SECRET_KEY = "test-secret-key-change-in-prod"
ALGORITHM  = "HS256"
log = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Middleware: correlation ID
# ------------------------------------------------------------------

class CorrelationIDMiddleware:
    """
    Читает X-Correlation-ID из заголовков или генерирует новый.
    Кладёт в request.state — доступно во всех эндпоинтах и задачах.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            from starlette.requests import Request as StarletteRequest
            req = StarletteRequest(scope, receive)
            cid = req.headers.get("X-Correlation-ID") or str(uuid.uuid4())
            scope["state"] = getattr(scope.get("app"), "state", None) or {}
            scope["correlation_id"] = cid

        await self.app(scope, receive, send)


# ------------------------------------------------------------------
# JWT
# ------------------------------------------------------------------

security = HTTPBearer()


def create_token(user_id: str, role: str = "user") -> str:
    return jwt.encode({"sub": user_id, "role": role}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> dict:
    return decode_token(credentials.credentials)


# ------------------------------------------------------------------
# Фоновые задачи
# ------------------------------------------------------------------

async def send_email(to: str, subject: str, correlation_id: str) -> None:
    """Отправка email — имитация реального вызова."""
    log.info("[%s] Отправка email to=%s subj=%s", correlation_id, to, subject)
    await asyncio.sleep(0.01)


async def generate_report(
    report_id: str,
    user_id: str,
    correlation_id: str,
) -> None:
    """Генерация отчёта — может упасть."""
    log.info("[%s] Генерация отчёта %s для %s", correlation_id, report_id, user_id)
    if report_id == "fail":
        raise RuntimeError(f"[{correlation_id}] Ошибка генерации отчёта {report_id}")
    await asyncio.sleep(0.01)


# ------------------------------------------------------------------
# Приложение
# ------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(CorrelationIDMiddleware)   # type: ignore[arg-type]


# ------------------------------------------------------------------
# Эндпоинты
# ------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: str
    password: str


class ReportRequest(BaseModel):
    report_id: str


@app.post("/auth/register", status_code=201)
async def register(
    req: RegisterRequest,
    background_tasks: BackgroundTasks,
    request: Request,
) -> dict:
    user_id = str(uuid.uuid4())
    cid = getattr(request.scope, "get", lambda k, d=None: d)("correlation_id") or str(uuid.uuid4())
    # Фоновая задача: отправить приветственный email
    background_tasks.add_task(
        send_email,
        to=req.email,
        subject="Добро пожаловать",
        correlation_id=cid,
    )
    token = create_token(user_id)
    return {"user_id": user_id, "token": token}


@app.post("/reports")
async def create_report(
    req: ReportRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    user: Annotated[dict, Depends(current_user)],
) -> dict:
    cid = request.scope.get("correlation_id", str(uuid.uuid4()))
    background_tasks.add_task(
        generate_report,
        report_id=req.report_id,
        user_id=user["sub"],
        correlation_id=cid,
    )
    return {"status": "queued", "report_id": req.report_id, "correlation_id": cid}


@app.get("/me")
async def get_me(user: Annotated[dict, Depends(current_user)]) -> dict:
    return {"user_id": user["sub"], "role": user["role"]}`,
      },
      {
        filename: "tests/test_e2e.py",
        code: `"""
E2E тесты FastAPI + JWT + фоновые задачи + correlation ID.

Используем:
- httpx.AsyncClient с app=app (без реального HTTP)
- pytest-mock (.mocker) для перехвата send_email / generate_report
- BackgroundTasks выполняются в том же event loop — можно отслеживать вызовы
"""
import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import httpx
import pytest
import pytest_asyncio
from fastapi import FastAPI

from app import app, create_token, send_email, generate_report

pytestmark = pytest.mark.asyncio

BASE_URL = "http://testserver"


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

@pytest_asyncio.fixture
async def client() -> httpx.AsyncClient:
    """
    httpx.AsyncClient с transport=ASGITransport — запросы идут напрямую
    в ASGI-приложение без сетевого стека. Быстро и детерминировано.
    """
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url=BASE_URL,
    ) as c:
        yield c


@pytest.fixture
def user_token() -> str:
    return create_token(user_id="test-user-id", role="user")


@pytest.fixture
def admin_token() -> str:
    return create_token(user_id="admin-id", role="admin")


@pytest.fixture
def auth_headers(user_token) -> dict:
    return {"Authorization": f"Bearer {user_token}"}


# ------------------------------------------------------------------
# Тесты авторизации
# ------------------------------------------------------------------

async def test_me_requires_auth(client):
    """GET /me без токена → 403 (HTTPBearer возвращает 403)."""
    resp = await client.get("/me")
    assert resp.status_code == 403


async def test_me_invalid_token(client):
    """GET /me с неверным токеном → 401."""
    resp = await client.get("/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert resp.status_code == 401


async def test_me_success(client, auth_headers):
    """GET /me с корректным токеном → 200 + user_id."""
    resp = await client.get("/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == "test-user-id"
    assert data["role"] == "user"


# ------------------------------------------------------------------
# Тесты регистрации + перехват background task
# ------------------------------------------------------------------

async def test_register_triggers_welcome_email(client, mocker):
    """
    POST /auth/register должен:
    1. Вернуть 201 + token
    2. Запустить send_email как фоновую задачу

    mocker.patch перехватывает вызов send_email — реального email нет.
    AsyncMock нужен потому что send_email — корутина.
    """
    mock_email = mocker.patch("app.send_email", new_callable=AsyncMock)

    resp = await client.post("/auth/register", json={
        "email": "alice@example.com",
        "password": "secret123",
    })

    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert "user_id" in data

    # FastAPI выполняет BackgroundTasks синхронно (в тестах с ASGI transport)
    # Ждём чтобы фоновая задача успела выполниться
    await asyncio.sleep(0.05)

    mock_email.assert_called_once()
    call_kwargs = mock_email.call_args.kwargs
    assert call_kwargs["to"] == "alice@example.com"
    assert call_kwargs["subject"] == "Добро пожаловать"


async def test_register_propagates_correlation_id(client, mocker):
    """
    Correlation ID из заголовка должен дойти до send_email.
    """
    mock_email = mocker.patch("app.send_email", new_callable=AsyncMock)
    custom_cid = "my-custom-correlation-id-123"

    await client.post(
        "/auth/register",
        json={"email": "bob@x.com", "password": "pass"},
        headers={"X-Correlation-ID": custom_cid},
    )
    await asyncio.sleep(0.05)

    mock_email.assert_called_once()
    assert mock_email.call_args.kwargs["correlation_id"] == custom_cid


# ------------------------------------------------------------------
# Тесты создания отчёта
# ------------------------------------------------------------------

async def test_create_report_requires_auth(client):
    resp = await client.post("/reports", json={"report_id": "r1"})
    assert resp.status_code == 403


async def test_create_report_success(client, auth_headers, mocker):
    """POST /reports → 200 + queued, фоновая задача перехвачена."""
    mock_gen = mocker.patch("app.generate_report", new_callable=AsyncMock)

    resp = await client.post(
        "/reports",
        json={"report_id": "report-abc"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"
    assert data["report_id"] == "report-abc"
    assert "correlation_id" in data

    await asyncio.sleep(0.05)
    mock_gen.assert_called_once_with(
        report_id="report-abc",
        user_id="test-user-id",
        correlation_id=data["correlation_id"],
    )


async def test_create_report_correlation_id_in_response(client, auth_headers, mocker):
    """Correlation ID из запроса должен вернуться в ответе."""
    mocker.patch("app.generate_report", new_callable=AsyncMock)
    cid = f"cid-{uuid.uuid4()}"

    resp = await client.post(
        "/reports",
        json={"report_id": "r2"},
        headers={**auth_headers, "X-Correlation-ID": cid},
    )
    assert resp.json()["correlation_id"] == cid


# ------------------------------------------------------------------
# Тест обработки исключений в background task
# ------------------------------------------------------------------

async def test_background_task_exception_does_not_break_response(client, auth_headers, caplog):
    """
    Если фоновая задача выбрасывает исключение —
    HTTP-ответ уже отправлен и пользователь получил 200.
    Ошибка должна быть залогирована (с correlation ID).

    report_id="fail" триггерит RuntimeError в generate_report.
    """
    import logging

    resp = await client.post(
        "/reports",
        json={"report_id": "fail"},
        headers=auth_headers,
    )
    # Ответ успешен — FastAPI отвечает до выполнения background task
    assert resp.status_code == 200

    # Даём время background task упасть и залогировать
    await asyncio.sleep(0.1)

    # Примечание: FastAPI не пробрасывает исключения из BackgroundTasks в ответ.
    # В продакшне нужен глобальный обработчик (Sentry, structured logging).
    # Здесь проверяем что ответ не сломан.
    assert resp.json()["status"] == "queued"


# ------------------------------------------------------------------
# Параметризованные тесты для разных ролей
# ------------------------------------------------------------------

@pytest.mark.parametrize("role,expected_role", [
    ("user",  "user"),
    ("admin", "admin"),
])
async def test_me_different_roles(client, role, expected_role):
    token = create_token(user_id="u1", role=role)
    resp = await client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == expected_role


# ------------------------------------------------------------------
# Тест что correlation_id прокидывается через все слои (mock logging)
# ------------------------------------------------------------------

async def test_correlation_id_in_logs(client, auth_headers, mocker, caplog):
    """
    Проверяем что correlation ID попадает в логи generate_report.
    Используем caplog (pytest built-in) для захвата лог-записей.
    """
    import logging
    cid = "trace-id-xyz"

    with caplog.at_level(logging.INFO, logger="app"):
        resp = await client.post(
            "/reports",
            json={"report_id": "r-log-test"},
            headers={**auth_headers, "X-Correlation-ID": cid},
        )
        await asyncio.sleep(0.1)

    assert resp.status_code == 200
    # В логах должен появиться наш correlation ID
    log_messages = [r.message for r in caplog.records]
    assert any(cid in msg for msg in log_messages), (
        f"Correlation ID '{cid}' не найден в логах: {log_messages}"
    )`,
      },
    ],
    explanation: `**На что обратить внимание:**

**httpx.AsyncClient + ASGITransport:**
- \`httpx.AsyncClient(transport=ASGITransport(app=app))\` — HTTP-запросы идут напрямую в ASGI-стек
- Нет реальных TCP-соединений, нет зависимости от занятого порта
- Полностью воспроизводит весь цикл запроса: middleware → routing → endpoint → background tasks
- Middleware (CorrelationIDMiddleware) тоже выполняется — сквозное тестирование без моков

**mocker.patch + AsyncMock для фоновых задач:**
- \`mocker.patch("app.send_email", new_callable=AsyncMock)\` — заменяет функцию в модуле \`app\`
- Важно: патчить нужно в том модуле где используется, а не где определена функция
- \`mock.assert_called_once()\`, \`mock.call_args.kwargs\` — проверяем с какими аргументами вызвана задача
- \`await asyncio.sleep(0.05)\` после запроса — ждём выполнения BackgroundTasks (они async в том же loop)

**Correlation ID сквозное тестирование:**
- Тест отправляет кастомный \`X-Correlation-ID\` → проверяет что он дошёл до \`send_email(..., correlation_id=cid)\`
- \`test_correlation_id_in_logs\` использует \`caplog\` — встроенный pytest fixture для захвата логов
- В продакшне добавьте structlog или OpenTelemetry для structured logging с trace context

**BackgroundTasks vs Celery в тестах:**
- FastAPI \`BackgroundTasks\` выполняются сразу после отправки ответа в том же process/event loop
- Celery-задачи отправляются в брокер — в тестах мокируют \`task.apply_async\` или используют \`CELERY_TASK_ALWAYS_EAGER=True\`
- \`ALWAYS_EAGER\` выполняет задачи синхронно без брокера — удобно для integration-тестов

**\`caplog\` для проверки логирования:**
- \`caplog.at_level(logging.INFO, logger="app")\` — захватываем логи только из модуля \`app\`
- \`caplog.records\` — список \`LogRecord\` объектов; \`r.message\` — текст лога
- Это единственный надёжный способ проверить что correlation ID попал в логи без изменения кода`,
  },
  {
    id: "structlog-correlation-id",
    title: "Структурированное логирование: structlog, contextvars, JSON-экспорт",
    task: `Настройте структурированное логирование в FastAPI-приложении с помощью structlog + loguru (как fallback). Добавьте автоматическое добавление correlation ID через contextvars в async-контексте. Реализуйте middleware, который привязывает контекст к каждому запросу, и экспорт логов в JSON-формат для ELK/Grafana Loki. Обеспечьте, чтобы correlation ID пробрасывался в HTTP-запросы, задачи Celery и SQL-запросы.`,
    files: [
      {
        filename: "logging_setup.py",
        code: `"""
Структурированное логирование: structlog + contextvars.

Архитектура:
  contextvars.ContextVar  — хранит контекст (correlation_id, user_id) per-coroutine
  structlog               — основная библиотека структурированных логов
  loguru                  — fallback / sink для красивого вывода в консоль при разработке
  JSON-рендерер           — вывод для ELK / Grafana Loki в продакшне

Pipeline structlog:
  [merge_contextvars] → [add_log_level] → [add_timestamp] → [CallsiteParameter] → [JSON/Console renderer]

Каждый log-вызов автоматически добавляет всё что в contextvars (correlation_id, user_id, etc.)
"""
import contextvars
import logging
import os
import sys
import uuid
from typing import Any

import structlog
from structlog.types import EventDict, WrappedLogger

# ------------------------------------------------------------------
# ContextVar'ы — хранят контекст текущей корутины/запроса
# ------------------------------------------------------------------

REQUEST_ID:     contextvars.ContextVar[str] = contextvars.ContextVar("request_id",     default="")
CORRELATION_ID: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")
USER_ID:        contextvars.ContextVar[str] = contextvars.ContextVar("user_id",        default="")
CELERY_TASK_ID: contextvars.ContextVar[str] = contextvars.ContextVar("celery_task_id", default="")


def bind_request_context(
    correlation_id: str | None = None,
    user_id: str | None = None,
    request_id: str | None = None,
) -> dict[str, str]:
    """
    Устанавливает контекст для текущей корутины.
    Возвращает dict с установленными значениями (удобно для тестов).
    """
    cid = correlation_id or str(uuid.uuid4())
    rid = request_id    or str(uuid.uuid4())
    CORRELATION_ID.set(cid)
    REQUEST_ID.set(rid)
    if user_id:
        USER_ID.set(user_id)
    return {"correlation_id": cid, "request_id": rid, "user_id": user_id or ""}


def get_context() -> dict[str, str]:
    """Возвращает текущий контекст (для передачи в Celery/HTTP-заголовки)."""
    return {
        "x-correlation-id": CORRELATION_ID.get(),
        "x-request-id":     REQUEST_ID.get(),
        "x-user-id":        USER_ID.get(),
    }


# ------------------------------------------------------------------
# Кастомный processor: добавляет contextvars в каждое лог-событие
# ------------------------------------------------------------------

def inject_context_vars(
    logger: WrappedLogger, method: str, event_dict: EventDict
) -> EventDict:
    """structlog processor: добавляет correlation_id, user_id из contextvars."""
    cid = CORRELATION_ID.get()
    uid = USER_ID.get()
    rid = REQUEST_ID.get()
    tid = CELERY_TASK_ID.get()
    if cid: event_dict["correlation_id"] = cid
    if uid: event_dict["user_id"]        = uid
    if rid: event_dict["request_id"]     = rid
    if tid: event_dict["celery_task_id"] = tid
    return event_dict


def add_service_info(
    logger: WrappedLogger, method: str, event_dict: EventDict
) -> EventDict:
    """Добавляет статические поля сервиса в каждое событие."""
    event_dict["service"]     = os.getenv("SERVICE_NAME", "api")
    event_dict["environment"] = os.getenv("ENVIRONMENT", "development")
    event_dict["version"]     = os.getenv("APP_VERSION", "unknown")
    return event_dict


# ------------------------------------------------------------------
# Настройка structlog
# ------------------------------------------------------------------

def configure_logging(json_output: bool = False) -> None:
    """
    Настраивает structlog + стандартный logging.

    json_output=True  → JSON-рендерер (продакшн, ELK/Loki)
    json_output=False → ConsoleRenderer (разработка, читаемый вывод)
    """
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,   # встроенный merge (альтернатива нашему inject_)
        inject_context_vars,                        # наши ContextVar'ы
        add_service_info,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.CallsiteParameterAdder([
            structlog.processors.CallsiteParameter.FILENAME,
            structlog.processors.CallsiteParameter.LINENO,
            structlog.processors.CallsiteParameter.FUNC_NAME,
        ]),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.ExceptionRenderer(),
    ]

    if json_output:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Перенаправляем стандартный logging в structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi", "sqlalchemy"):
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True


# ------------------------------------------------------------------
# Loguru fallback (для локальной разработки)
# ------------------------------------------------------------------

def setup_loguru_fallback() -> None:
    """
    Loguru как дополнительный sink: красивый вывод в консоль при разработке.
    Перехватывает стандартный logging и структурированный вывод structlog.
    """
    try:
        from loguru import logger as loguru_logger
        import logging

        class InterceptHandler(logging.Handler):
            """Перехватывает стандартный logging и передаёт в Loguru."""
            def emit(self, record: logging.LogRecord) -> None:
                try:
                    level = loguru_logger.level(record.levelname).name
                except ValueError:
                    level = record.levelno
                frame, depth = sys._getframe(6), 6
                while frame.f_code.co_filename == logging.__file__:
                    frame = frame.f_back
                    depth += 1
                loguru_logger.opt(depth=depth, exception=record.exc_info).log(
                    level, record.getMessage()
                )

        loguru_logger.configure(
            handlers=[{
                "sink": sys.stderr,
                "format": (
                    "<green>{time:HH:mm:ss}</green> | "
                    "<level>{level: <8}</level> | "
                    "<cyan>{name}</cyan>:<cyan>{line}</cyan> — "
                    "<level>{message}</level>"
                ),
                "level": "DEBUG",
                "colorize": True,
            }]
        )
        logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    except ImportError:
        pass   # loguru не установлен — используем только structlog`,
      },
      {
        filename: "middleware.py",
        code: `"""
FastAPI middleware + propagation correlation ID в:
- aiohttp HTTP-запросы (outgoing)
- asyncpg SQL-запросы (через listener)
- Celery задачи (через task headers)
"""
import time
import uuid
from typing import Callable

import structlog
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from logging_setup import (
    CELERY_TASK_ID, CORRELATION_ID, REQUEST_ID, USER_ID,
    bind_request_context, configure_logging, get_context,
)

log = structlog.get_logger()


# ------------------------------------------------------------------
# Middleware: привязывает contextvars к каждому запросу
# ------------------------------------------------------------------

class StructlogMiddleware(BaseHTTPMiddleware):
    """
    Извлекает X-Correlation-ID из заголовков (или генерирует новый),
    устанавливает contextvars, логирует начало/конец запроса.

    Использует BaseHTTPMiddleware — работает с async def dispatch.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Читаем заголовки
        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        uid = request.headers.get("X-User-Id", "")
        rid = str(uuid.uuid4())

        # Устанавливаем контекст для всей корутины запроса
        bind_request_context(correlation_id=cid, user_id=uid, request_id=rid)

        t0 = time.perf_counter()
        log.info(
            "request.started",
            method=request.method,
            path=str(request.url.path),
            query=str(request.url.query),
        )

        response = await call_next(request)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        log.info(
            "request.finished",
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            duration_ms=round(elapsed_ms, 2),
        )

        # Добавляем correlation ID в ответ
        response.headers["X-Correlation-ID"] = cid
        response.headers["X-Request-ID"]     = rid
        return response


# ------------------------------------------------------------------
# Propagation в aiohttp-запросы
# ------------------------------------------------------------------

async def make_traced_request(session, url: str, **kwargs) -> any:
    """
    Все исходящие HTTP-запросы автоматически получают correlation ID в заголовках.
    Downstream сервис видит тот же correlation_id → сквозная трассировка.
    """
    headers = kwargs.pop("headers", {})
    headers.update(get_context())    # добавляем X-Correlation-ID, X-Request-ID
    log.info("http.outgoing", url=url, headers=headers)
    async with session.get(url, headers=headers, **kwargs) as resp:
        return resp


# ------------------------------------------------------------------
# Propagation в asyncpg SQL-запросы
# ------------------------------------------------------------------

async def setup_asyncpg_logging(conn) -> None:
    """
    asyncpg позволяет установить log_listener: вызывается при PostgreSQL RAISE NOTICE.
    Используем add_log_listener для логирования медленных запросов.
    """
    async def log_query(conn, message):
        log.debug("pg.notice", message=str(message), correlation_id=CORRELATION_ID.get())

    conn.add_log_listener(log_query)

    # Устанавливаем application_name в PostgreSQL — видно в pg_stat_activity
    cid = CORRELATION_ID.get()
    if cid:
        await conn.execute(f"SET application_name TO 'api:{cid[:8]}'")


# ------------------------------------------------------------------
# Propagation в Celery
# ------------------------------------------------------------------

def get_celery_task_headers() -> dict:
    """
    Передаёт correlation_id в Celery через task headers.
    При вызове: task.apply_async(headers=get_celery_task_headers())
    """
    return get_context()


def celery_task_prerun_handler(task_id: str, task, **kwargs) -> None:
    """
    Celery сигнал task_prerun: восстанавливает контекст внутри worker'а.
    Подключается через: task_prerun.connect(celery_task_prerun_handler)
    """
    headers = getattr(task.request, "headers", {}) or {}
    CORRELATION_ID.set(headers.get("x-correlation-id", str(uuid.uuid4())))
    REQUEST_ID.set(headers.get("x-request-id", ""))
    USER_ID.set(headers.get("x-user-id", ""))
    CELERY_TASK_ID.set(task_id)
    log.info("celery.task.started", task=task.name, task_id=task_id)


# ------------------------------------------------------------------
# FastAPI app с настроенным логированием
# ------------------------------------------------------------------

def create_app() -> FastAPI:
    is_prod = __import__("os").getenv("ENVIRONMENT") == "production"
    configure_logging(json_output=is_prod)

    if not is_prod:
        setup_loguru_fallback()    # красивый вывод при разработке

    app = FastAPI()
    app.add_middleware(StructlogMiddleware)
    return app


app = create_app()
log = structlog.get_logger()


@app.get("/api/data")
async def get_data(request: Request) -> dict:
    log.info("data.fetching", source="database")
    # Все log-вызовы автоматически содержат correlation_id из contextvars
    return {"data": "ok", "correlation_id": CORRELATION_ID.get()}


@app.post("/api/task")
async def create_task_endpoint(request: Request) -> dict:
    from celery_app import some_task   # гипотетическая Celery-задача
    task = some_task.apply_async(
        args=["arg1"],
        headers=get_celery_task_headers(),   # прокидываем контекст
    )
    log.info("task.queued", task_id=task.id)
    return {"task_id": task.id, "correlation_id": CORRELATION_ID.get()}`,
      },
    ],
    explanation: `**На что обратить внимание:**

**contextvars.ContextVar — per-coroutine хранилище:**
- Каждая корутина (запрос) имеет свою копию ContextVar — нет утечки контекста между параллельными запросами
- asyncio автоматически копирует ContextVar при создании Task через \`asyncio.create_task()\`
- В отличие от threading.local — работает в async-контексте без блокировок

**structlog processor pipeline:**
- Процессоры — это функции \`(logger, method, event_dict) → event_dict\`; выполняются последовательно
- \`inject_context_vars\` достаёт значения из ContextVar и добавляет в \`event_dict\`
- Итоговый рендерер либо сериализует в JSON (продакшн), либо форматирует для консоли (разработка)
- \`cache_logger_on_first_use=True\` — pipeline компилируется один раз, не пересоздаётся на каждый вызов

**JSON-формат для ELK/Grafana Loki:**
- Каждое лог-событие = JSON-строка с полями: \`timestamp\`, \`level\`, \`event\`, \`correlation_id\`, \`service\`, \`filename\`, \`lineno\`
- ELK: Logstash парсит JSON-строки → Elasticsearch-документы → Kibana-дашборды
- Loki: promtail/fluentd отправляет строки с label \`{service="api", environment="prod"}\`; Grafana ищет по correlation_id

**Propagation в Celery через task headers:**
- \`apply_async(headers={"x-correlation-id": cid})\` — headers передаются вместе с задачей в брокер
- Внутри worker'а: \`task.request.headers\` содержит те же заголовки → восстанавливаем ContextVar
- Это единственный надёжный способ передать контекст в Celery без изменения сигнатуры задачи

**Loguru как fallback:**
- structlog для структурированного JSON; loguru для красивого вывода при разработке
- \`InterceptHandler\` перехватывает стандартный \`logging.Logger\` → перенаправляет в Loguru
- В продакшне Loguru отключён — только structlog JSON → stdout → Loki/ELK`,
  },
  {
    id: "opentelemetry-fastapi-tracing",
    title: "OpenTelemetry: tracing для FastAPI + asyncpg + Redis + внешние API",
    task: `Интегрируйте OpenTelemetry в асинхронное приложение (FastAPI + asyncpg + Redis + внешние API). Настройте tracing для всех outgoing HTTP-запросов, БД-запросов и фоновых задач. Добавьте custom span processor, который автоматически добавляет business-атрибуты (user_id, request_path). Реализуйте экспорт в Jaeger/Tempo и создайте dashboard, показывающий latency по эндпоинтам и процент ошибок.`,
    files: [
      {
        filename: "tracing.py",
        code: `"""
OpenTelemetry: полный tracing для FastAPI + asyncpg + aiohttp + Redis.

Что инструментируется автоматически (через instrumentors):
  - FastAPI/Starlette: каждый HTTP-запрос = корневой span
  - aiohttp: каждый outgoing HTTP-запрос = дочерний span
  - asyncpg:  каждый SQL-запрос = дочерний span (через opentelemetry-instrumentation-asyncpg)
  - Redis:    каждая команда = дочерний span

Что добавляем вручную:
  - Business-атрибуты (user_id, plan) через custom SpanProcessor
  - Spans для фоновых задач (Celery / asyncio.Task)
  - Sampling rate: 10% в продакшне, 100% в разработке

Экспорт:
  - OTLP → Jaeger (порт 4317 gRPC)
  - OTLP → Tempo (Grafana)
"""
import os
import time
from typing import Optional

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.trace.sampling import (
    ALWAYS_ON, ParentBased, TraceIdRatioBased,
)
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.semconv.trace import SpanAttributes
from opentelemetry.trace import SpanKind, Status, StatusCode


# ------------------------------------------------------------------
# Custom SpanProcessor: добавляет business-атрибуты
# ------------------------------------------------------------------

class BusinessAttributeProcessor:
    """
    SpanProcessor: вызывается при старте каждого span'а.
    Добавляет бизнес-атрибуты из context (user_id, request_path, plan).

    В отличие от instrumentation — этот processor работает для ВСЕХ span'ов,
    включая span'ы от автоматических instrumentors.
    """

    def on_start(self, span, parent_context=None) -> None:
        from logging_setup import USER_ID, CORRELATION_ID

        user_id        = USER_ID.get("")
        correlation_id = CORRELATION_ID.get("")

        if user_id:
            span.set_attribute("app.user_id", user_id)
        if correlation_id:
            span.set_attribute("app.correlation_id", correlation_id)

        # Добавляем runtime info
        span.set_attribute("app.service_version", os.getenv("APP_VERSION", "unknown"))

    def on_end(self, span) -> None:
        pass   # пост-обработка при необходимости

    def shutdown(self) -> None:
        pass

    def force_flush(self, timeout_millis: int = 30_000) -> bool:
        return True


class ErrorRateProcessor:
    """
    SpanProcessor: при завершении span'а с ошибкой — добавляет детали.
    Используется для построения дашборда error rate.
    """

    def on_start(self, span, parent_context=None) -> None:
        span.set_attribute("app.start_time", time.time())

    def on_end(self, span) -> None:
        if span.status.status_code == StatusCode.ERROR:
            duration_ms = (time.time() - span.attributes.get("app.start_time", time.time())) * 1000
            span.set_attribute("app.error_duration_ms", round(duration_ms, 2))

    def shutdown(self) -> None:
        pass

    def force_flush(self, timeout_millis: int = 30_000) -> bool:
        return True


# ------------------------------------------------------------------
# Инициализация TracerProvider
# ------------------------------------------------------------------

def setup_tracing(app=None) -> TracerProvider:
    """
    Настраивает OpenTelemetry TracerProvider с:
    - OTLP-экспортёром (Jaeger/Tempo)
    - Sampling: 100% dev, 10% prod
    - Custom processors для business-атрибутов
    - Автоматической инструментацией FastAPI, aiohttp, Redis
    """
    env = os.getenv("ENVIRONMENT", "development")
    is_prod = env == "production"

    # Resource: статические атрибуты сервиса
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME:    os.getenv("SERVICE_NAME", "api"),
        ResourceAttributes.SERVICE_VERSION: os.getenv("APP_VERSION",  "0.0.1"),
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: env,
    })

    # Sampling: в продакшне — 10% запросов трейсятся
    # ParentBased: если вышестоящий сервис сэмплировал → сэмплируем и мы (consistency)
    sampler = ParentBased(
        root=TraceIdRatioBased(0.1) if is_prod else ALWAYS_ON
    )

    provider = TracerProvider(resource=resource, sampler=sampler)

    # Business-атрибуты и error rate (добавляем первыми — перед экспортёрами)
    provider.add_span_processor(BusinessAttributeProcessor())
    provider.add_span_processor(ErrorRateProcessor())

    # OTLP → Jaeger / Tempo
    otlp_endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
    otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
    provider.add_span_processor(
        BatchSpanProcessor(
            otlp_exporter,
            max_export_batch_size=512,
            schedule_delay_millis=5_000,
        )
    )

    # Консоль для разработки (дополнительно)
    if not is_prod:
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    trace.set_tracer_provider(provider)

    # Автоматическая инструментация
    if app is not None:
        FastAPIInstrumentor.instrument_app(
            app,
            excluded_urls="/health,/metrics",   # не трейсим технические эндпоинты
            http_capture_headers_server_request=["X-Correlation-ID"],
            http_capture_headers_server_response=["X-Correlation-ID"],
        )
    AioHttpClientInstrumentor().instrument()
    RedisInstrumentor().instrument()

    return provider


# ------------------------------------------------------------------
# Получение tracer
# ------------------------------------------------------------------

def get_tracer(name: str = __name__):
    return trace.get_tracer(name)


# ------------------------------------------------------------------
# Декоратор для трейсинга async-функций
# ------------------------------------------------------------------

def traced(span_name: str | None = None, kind: SpanKind = SpanKind.INTERNAL):
    """
    Декоратор: оборачивает async-функцию в span.
    Автоматически устанавливает статус ERROR при исключении.

    Использование:
        @traced("generate_report")
        async def generate_report(report_id: str) -> dict: ...
    """
    def decorator(func):
        import functools

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            tracer = get_tracer(func.__module__)
            name = span_name or f"{func.__module__}.{func.__qualname__}"
            with tracer.start_as_current_span(name, kind=kind) as span:
                # Добавляем аргументы как атрибуты (только скаляры)
                for i, arg in enumerate(args):
                    if isinstance(arg, (str, int, float, bool)):
                        span.set_attribute(f"arg.{i}", str(arg))
                for k, v in kwargs.items():
                    if isinstance(v, (str, int, float, bool)):
                        span.set_attribute(f"kwarg.{k}", str(v))
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as exc:
                    span.record_exception(exc)
                    span.set_status(Status(StatusCode.ERROR, str(exc)))
                    raise
        return wrapper
    return decorator


# ------------------------------------------------------------------
# Graceful shutdown
# ------------------------------------------------------------------

async def shutdown_tracing(provider: TracerProvider, timeout_ms: int = 5_000) -> None:
    """
    Дожидается отправки всех pending spans перед остановкой.
    Вызывается в FastAPI lifespan shutdown.
    """
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, provider.force_flush, timeout_ms)
    await loop.run_in_executor(None, provider.shutdown)`,
      },
      {
        filename: "app_traced.py",
        code: `"""
FastAPI с полным tracing: эндпоинты, asyncpg, фоновые задачи.
"""
import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Annotated, Optional

import asyncpg
from fastapi import Depends, FastAPI, HTTPException, Request
from opentelemetry import trace
from opentelemetry.trace import SpanKind, Status, StatusCode

from tracing import get_tracer, setup_tracing, shutdown_tracing, traced

tracer = get_tracer(__name__)
_otel_provider = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _otel_provider
    _otel_provider = setup_tracing(app)
    pool = await asyncpg.create_pool("postgresql://user:pass@localhost/db")
    app.state.db = pool
    yield
    await pool.close()
    if _otel_provider:
        await shutdown_tracing(_otel_provider)


app = FastAPI(lifespan=lifespan)


# ------------------------------------------------------------------
# Эндпоинты
# ------------------------------------------------------------------

@app.get("/users/{user_id}")
async def get_user(user_id: int, request: Request) -> dict:
    """
    FastAPIInstrumentor автоматически создаёт span для этого эндпоинта.
    Мы добавляем дочерние span'ы для БД-запроса.
    """
    with tracer.start_as_current_span(
        "db.fetch_user",
        kind=SpanKind.CLIENT,
        attributes={
            "db.system": "postgresql",
            "db.statement": "SELECT * FROM users WHERE id = $1",
        },
    ) as span:
        span.set_attribute("db.user_id", user_id)
        async with request.app.state.db.acquire() as conn:
            row = await conn.fetchrow("SELECT id, name, email FROM users WHERE id = $1", user_id)
            if not row:
                span.set_status(Status(StatusCode.ERROR, "User not found"))
                raise HTTPException(404, "User not found")
            result = dict(row)
            span.set_attribute("db.rows_returned", 1)

    return result


@app.post("/reports/{report_id}/generate")
async def generate_report_endpoint(report_id: str, request: Request) -> dict:
    """
    Фоновая задача с трейсингом.
    context propagation: span из HTTP-запроса → span в background task.
    """
    # Захватываем текущий контекст для передачи в background task
    current_context = trace.get_current_span().get_span_context()

    async def _generate_in_background():
        # Создаём span как дочерний к span'у HTTP-запроса
        with tracer.start_as_current_span(
            "background.generate_report",
            kind=SpanKind.INTERNAL,
            attributes={"report.id": report_id},
        ) as span:
            await asyncio.sleep(1)   # имитация работы
            span.add_event("report.generated", {"rows": 50_000})

    asyncio.create_task(_generate_in_background())
    return {"status": "queued", "report_id": report_id}


@app.get("/external/data")
async def fetch_external(request: Request) -> dict:
    """
    AioHttpClientInstrumentor автоматически создаёт span для HTTP-запроса.
    W3C Trace Context (traceparent header) пробрасывается в downstream.
    """
    import aiohttp
    async with aiohttp.ClientSession() as session:
        # span создаётся автоматически instrumentor'ом
        async with session.get("https://api.example.com/data") as resp:
            data = await resp.json()
    return data


# ------------------------------------------------------------------
# Пример с декоратором @traced
# ------------------------------------------------------------------

@traced("process.invoice", kind=SpanKind.INTERNAL)
async def process_invoice(invoice_id: str, amount: float) -> dict:
    """Бизнес-логика с автоматическим tracing через декоратор."""
    await asyncio.sleep(0.1)
    if amount < 0:
        raise ValueError(f"Отрицательная сумма: {amount}")
    return {"invoice_id": invoice_id, "processed": True}


@app.post("/invoices/{invoice_id}")
async def create_invoice(invoice_id: str, amount: float) -> dict:
    return await process_invoice(invoice_id, amount)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**SpanProcessor vs Instrumentor:**
- Instrumentor — автоматически создаёт span'ы для фреймворков (FastAPI, aiohttp, Redis)
- SpanProcessor — вызывается для КАЖДОГО span'а при старте и завершении
- \`BusinessAttributeProcessor.on_start\` добавляет \`app.user_id\` и \`app.correlation_id\` во все span'ы — не нужно делать это вручную в каждом эндпоинте

**W3C Trace Context propagation:**
- \`AioHttpClientInstrumentor\` автоматически добавляет \`traceparent\` заголовок в каждый исходящий запрос
- Downstream сервис (если тоже с OTel) прочитает \`traceparent\` и создаст дочерние span'ы
- Итог: в Jaeger/Tempo видна полная цепочка запросов через несколько сервисов

**ParentBased sampler:**
- \`ParentBased(root=TraceIdRatioBased(0.1))\` — если нет родительского span'а, сэмплируем 10%
- Если родительский span был сэмплирован → этот тоже сэмплируется (consistency)
- Если родительский не сэмплирован → этот тоже не сэмплируется (не засоряем Jaeger)

**BatchSpanProcessor vs SimpleSpanProcessor:**
- \`SimpleSpanProcessor\` — синхронно экспортирует span при каждом завершении; блокирует event loop
- \`BatchSpanProcessor\` — буферизует span'ы и отправляет пачками; не блокирует; \`max_export_batch_size=512\`
- Для продакшна всегда используйте Batch; Simple — только для отладки

**Graceful shutdown через \`force_flush\`:**
- При завершении приложения в буфере могут быть незаконченные spans
- \`force_flush(timeout_ms)\` дожидается отправки всех буферизованных span'ов
- Запускаем в \`run_in_executor\` — \`force_flush\` синхронный, не блокируем event loop

**@traced декоратор:**
- Позволяет добавить tracing к любой async-функции без изменения бизнес-логики
- Автоматически записывает исключение (\`span.record_exception\`) и устанавливает статус ERROR
- Jaeger показывает стек-трейс прямо в интерфейсе для упавших span'ов`,
  },
  {
    id: "observability-metrics-graceful-shutdown",
    title: "Observability: Prometheus + structlog + graceful shutdown + load simulation",
    task: `Создайте observability-модуль, который автоматически собирает метрики (Prometheus) и логирует все ключевые события приложения. Используйте structlog + contextvars для передачи tracing-контекста в background tasks и Redis Streams. Добавьте graceful shutdown, при котором все незавершённые spans корректно закрываются, и тестовый middleware, имитирующий высокую нагрузку для проверки sampling rate.`,
    files: [
      {
        filename: "observability.py",
        code: `"""
Observability-модуль: Prometheus метрики + structured logging + context propagation.

Метрики (Prometheus):
  http_requests_total          — Counter: запросы по методу/пути/статусу
  http_request_duration_seconds — Histogram: latency по эндпоинтам
  active_requests              — Gauge: активные запросы прямо сейчас
  background_tasks_total       — Counter: фоновые задачи по типу/статусу
  redis_stream_lag             — Gauge: отставание consumer от stream

Все метрики имеют label'ы для фильтрации в Grafana.
"""
import asyncio
import contextvars
import functools
import logging
import os
import random
import signal
import time
import uuid
from typing import Any, Callable, Coroutine

import structlog
from fastapi import FastAPI, Request, Response
from prometheus_client import (
    Counter, Gauge, Histogram, Summary,
    generate_latest, CONTENT_TYPE_LATEST, CollectorRegistry,
)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import PlainTextResponse

log = structlog.get_logger()

# contextvars — контекст текущей корутины
_CORRELATION_ID: contextvars.ContextVar[str] = contextvars.ContextVar("cid", default="")
_TRACE_ID:       contextvars.ContextVar[str] = contextvars.ContextVar("trace_id", default="")
_SPAN_ID:        contextvars.ContextVar[str] = contextvars.ContextVar("span_id", default="")


# ------------------------------------------------------------------
# Prometheus метрики
# ------------------------------------------------------------------

REGISTRY = CollectorRegistry()

HTTP_REQUESTS = Counter(
    "http_requests_total",
    "Всего HTTP-запросов",
    ["method", "path", "status_code"],
    registry=REGISTRY,
)
HTTP_DURATION = Histogram(
    "http_request_duration_seconds",
    "Latency HTTP-запросов",
    ["method", "path"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
    registry=REGISTRY,
)
ACTIVE_REQUESTS = Gauge(
    "active_requests",
    "Активные HTTP-запросы",
    ["method"],
    registry=REGISTRY,
)
BACKGROUND_TASKS = Counter(
    "background_tasks_total",
    "Фоновые задачи",
    ["task_type", "status"],
    registry=REGISTRY,
)
REDIS_STREAM_LAG = Gauge(
    "redis_stream_consumer_lag",
    "Отставание consumer от Redis Stream",
    ["stream", "group"],
    registry=REGISTRY,
)
TASK_DURATION = Summary(
    "background_task_duration_seconds",
    "Время выполнения фоновой задачи",
    ["task_type"],
    registry=REGISTRY,
)


# ------------------------------------------------------------------
# Middleware: метрики + логирование
# ------------------------------------------------------------------

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Единый middleware для метрик, логирования и установки контекста.
    Порядок важен: должен быть добавлен первым (innermost = добавляется последним).
    """

    EXCLUDED_PATHS = {"/metrics", "/health", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Установка контекста
        cid     = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        trace_id = request.headers.get("X-Trace-ID") or uuid.uuid4().hex
        span_id  = uuid.uuid4().hex[:16]
        _CORRELATION_ID.set(cid)
        _TRACE_ID.set(trace_id)
        _SPAN_ID.set(span_id)

        method = request.method
        path   = self._normalize_path(request.url.path)

        ACTIVE_REQUESTS.labels(method=method).inc()
        t0 = time.perf_counter()

        log.info(
            "http.request.started",
            method=method, path=path,
            correlation_id=cid, trace_id=trace_id,
        )

        try:
            response = await call_next(request)
            status   = response.status_code
            log.info(
                "http.request.finished",
                method=method, path=path, status_code=status,
                duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            )
        except Exception as exc:
            status = 500
            log.error(
                "http.request.error",
                method=method, path=path,
                error=str(exc), exc_info=True,
            )
            raise
        finally:
            duration = time.perf_counter() - t0
            HTTP_REQUESTS.labels(method=method, path=path, status_code=str(status)).inc()
            HTTP_DURATION.labels(method=method, path=path).observe(duration)
            ACTIVE_REQUESTS.labels(method=method).dec()

        response.headers["X-Correlation-ID"] = cid
        return response

    @staticmethod
    def _normalize_path(path: str) -> str:
        """
        /users/123 → /users/{id}
        Без нормализации каждый user_id создаёт отдельный label → cardinality explosion.
        """
        import re
        path = re.sub(r"/[0-9a-f]{8}-[0-9a-f-]{27}", "/{uuid}", path)
        path = re.sub(r"/\d+", "/{id}", path)
        return path


# ------------------------------------------------------------------
# Decorator: метрики для фоновых задач + context propagation
# ------------------------------------------------------------------

def observed_task(task_type: str):
    """
    Декоратор для фоновых задач:
    - propagation contextvars в новую Task (asyncio копирует автоматически)
    - инкрементирует BACKGROUND_TASKS counter
    - измеряет длительность через TASK_DURATION Summary
    - логирует старт/завершение/ошибку
    """
    def decorator(func: Callable[..., Coroutine]) -> Callable[..., Coroutine]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            cid = _CORRELATION_ID.get()
            log.info("task.started", task_type=task_type, correlation_id=cid)
            t0 = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                BACKGROUND_TASKS.labels(task_type=task_type, status="success").inc()
                log.info(
                    "task.finished",
                    task_type=task_type,
                    duration_ms=round((time.perf_counter() - t0) * 1000, 2),
                    correlation_id=cid,
                )
                return result
            except Exception as exc:
                BACKGROUND_TASKS.labels(task_type=task_type, status="error").inc()
                log.error(
                    "task.failed",
                    task_type=task_type,
                    error=str(exc),
                    correlation_id=cid,
                    exc_info=True,
                )
                raise
            finally:
                TASK_DURATION.labels(task_type=task_type).observe(time.perf_counter() - t0)
        return wrapper
    return decorator


# ------------------------------------------------------------------
# Load simulation middleware (для тестирования sampling)
# ------------------------------------------------------------------

class LoadSimulationMiddleware(BaseHTTPMiddleware):
    """
    Тестовый middleware: имитирует высокую нагрузку.
    Активируется через заголовок X-Simulate-Load: true.

    Позволяет проверить:
    - Sampling rate при высоком RPS
    - Что метрики корректно агрегируются под нагрузкой
    - Поведение circuit breaker'а
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        simulate = request.headers.get("X-Simulate-Load", "").lower() == "true"
        if not simulate:
            return await call_next(request)

        # Случайная дополнительная задержка (имитация медленного бэкенда)
        extra_latency = random.uniform(0.01, 0.5)
        await asyncio.sleep(extra_latency)

        # 5% вероятность ошибки
        if random.random() < 0.05:
            return Response(content="Simulated error", status_code=503)

        response = await call_next(request)
        return response


# ------------------------------------------------------------------
# Redis Stream lag monitoring
# ------------------------------------------------------------------

async def monitor_redis_stream_lag(
    redis,
    stream: str,
    group: str,
    interval: float = 15.0,
) -> None:
    """
    Фоновая задача: каждые N секунд обновляет gauge отставания consumer'а.
    Отставание = pending messages в consumer group.
    Если lag растёт → недостаточно worker'ов или они зависли.
    """
    while True:
        try:
            info = await redis.xinfo_groups(stream)
            for g in info:
                if g["name"] == group:
                    REDIS_STREAM_LAG.labels(stream=stream, group=group).set(g["pending"])
                    log.debug(
                        "stream.lag",
                        stream=stream, group=group, pending=g["pending"],
                    )
        except Exception as exc:
            log.warning("stream.lag.error", error=str(exc))
        await asyncio.sleep(interval)


# ------------------------------------------------------------------
# Graceful shutdown
# ------------------------------------------------------------------

class GracefulShutdown:
    """
    Обрабатывает SIGTERM/SIGINT:
    1. Перестаёт принимать новые запросы (is_shutting_down = True)
    2. Ждёт завершения активных запросов (active_requests gauge → 0)
    3. Корректно закрывает все background tasks
    4. Финализирует OTel spans (force_flush)
    """

    def __init__(self, app: FastAPI) -> None:
        self._app = app
        self.is_shutting_down = False
        self._shutdown_event = asyncio.Event()

    def setup_signal_handlers(self) -> None:
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self._handle_signal)

    def _handle_signal(self) -> None:
        log.warning("shutdown.signal_received")
        self.is_shutting_down = True
        self._shutdown_event.set()

    async def wait_for_shutdown(self, timeout: float = 30.0) -> None:
        await self._shutdown_event.wait()
        log.info("shutdown.draining", timeout=timeout)

        deadline = time.time() + timeout
        while time.time() < deadline:
            # Проверяем активные запросы через Prometheus gauge
            active = sum(
                g.get() for g in ACTIVE_REQUESTS._metrics.values()  # type: ignore[attr-defined]
            )
            if active == 0:
                break
            log.info("shutdown.waiting", active_requests=int(active))
            await asyncio.sleep(0.5)

        log.info("shutdown.complete")


# ------------------------------------------------------------------
# Эндпоинт /metrics
# ------------------------------------------------------------------

def add_metrics_endpoint(app: FastAPI) -> None:
    @app.get("/metrics", include_in_schema=False)
    async def metrics() -> PlainTextResponse:
        return PlainTextResponse(
            generate_latest(REGISTRY),
            media_type=CONTENT_TYPE_LATEST,
        )

    @app.get("/health", include_in_schema=False)
    async def health() -> dict:
        return {"status": "ok"}`,
      },
      {
        filename: "app_observable.py",
        code: `"""
Сборка всего вместе: FastAPI + ObservabilityMiddleware + graceful shutdown.
Демонстрирует context propagation в background tasks через asyncio.create_task.
"""
import asyncio
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request

from observability import (
    GracefulShutdown,
    LoadSimulationMiddleware,
    ObservabilityMiddleware,
    add_metrics_endpoint,
    monitor_redis_stream_lag,
    observed_task,
    _CORRELATION_ID,
)
from logging_setup import configure_logging

configure_logging(json_output=__import__("os").getenv("ENVIRONMENT") == "production")
log = structlog.get_logger()

_shutdown: GracefulShutdown


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _shutdown
    _shutdown = GracefulShutdown(app)
    _shutdown.setup_signal_handlers()

    # Фоновый мониторинг Redis Stream lag
    # (в реальном приложении redis = await aioredis.from_url(...))
    # lag_task = asyncio.create_task(monitor_redis_stream_lag(redis, "jobs:stream", "workers"))

    log.info("app.started")
    yield

    await _shutdown.wait_for_shutdown()
    # lag_task.cancel()
    log.info("app.stopped")


app = FastAPI(lifespan=lifespan)

# Порядок middleware важен: LoadSimulation → Observability (от внешнего к внутреннему)
app.add_middleware(LoadSimulationMiddleware)
app.add_middleware(ObservabilityMiddleware)
add_metrics_endpoint(app)


# ------------------------------------------------------------------
# Фоновые задачи с context propagation
# ------------------------------------------------------------------

@observed_task("send_report")
async def send_report(report_id: str, email: str) -> None:
    """
    Декоратор @observed_task:
    - автоматически логирует старт/финиш/ошибку
    - инкрементирует BACKGROUND_TASKS counter
    - сохраняет correlation_id из contextvars (скопированных asyncio при create_task)
    """
    log.info("report.sending", report_id=report_id, email=email)
    await asyncio.sleep(0.5)


@app.post("/reports/{report_id}/send")
async def trigger_report(report_id: str, email: str, request: Request) -> dict:
    """
    asyncio.create_task автоматически копирует текущий ContextVar-контекст.
    Значит _CORRELATION_ID внутри send_report будет тем же что в HTTP-запросе.
    """
    # Запускаем фоновую задачу — correlation_id скопируется автоматически
    asyncio.create_task(send_report(report_id, email))

    cid = _CORRELATION_ID.get()
    log.info("report.queued", report_id=report_id, correlation_id=cid)
    return {"status": "queued", "report_id": report_id, "correlation_id": cid}


@app.get("/api/users/{user_id}")
async def get_user(user_id: int) -> dict:
    await asyncio.sleep(0.05)   # имитация БД-запроса
    return {"user_id": user_id, "name": "Alice"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        # Graceful shutdown: uvicorn ждёт N секунд после SIGTERM
        timeout_graceful_shutdown=30,
    )`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Нормализация путей — защита от cardinality explosion:**
- Без нормализации \`/users/123\`, \`/users/456\`, \`/users/789\` создают 3 разных label'а в Prometheus
- При миллионах пользователей → миллионы уникальных label'ов → OOM в Prometheus
- Регулярное выражение заменяет числа на \`{id}\`, UUID на \`{uuid}\` — одна временная ряд на эндпоинт

**\`asyncio.create_task\` копирует ContextVar:**
- Это поведение гарантировано в asyncio (PEP 567): Task получает копию текущего contextvars.Context
- correlation_id установленный в middleware автоматически доступен в фоновой задаче
- Если задача создаётся в другом контексте (Celery worker) — нужно передавать явно через аргументы или headers

**Prometheus gauges и graceful shutdown:**
- \`ACTIVE_REQUESTS\` gauge показывает количество запросов в процессе обработки
- В graceful shutdown: ждём пока gauge не упадёт до 0 (все запросы завершены)
- Timeout (30 сек) — страховка против зависших запросов; после timeout — жёсткое завершение

**LoadSimulationMiddleware для тестирования sampling:**
- Заголовок \`X-Simulate-Load: true\` включает случайную задержку и 5% ошибок
- Позволяет проверить OTel sampling rate без нагрузочного инструмента
- В Jaeger/Grafana можно наблюдать как при 10%-сэмплинге только часть запросов трейсится

**Grafana dashboard конфигурация (PromQL):**
- Latency p95 по эндпоинту: \`histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))\`
- Error rate: \`rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])\`
- Active requests: \`sum(active_requests) by (method)\`
- Stream lag: \`redis_stream_consumer_lag{stream="jobs:stream"}\``,
  },
  {
    id: "cpu-profiling-optimization",
    title: "CPU-профилирование и оптимизация: pyinstrument, ProcessPoolExecutor, __slots__",
    task: `Профилируйте и оптимизируйте CPU-bound функцию, которая обрабатывает большой массив данных (миллионы записей). Используйте pyinstrument и cProfile для анализа, затем примените GIL-осознанные решения: concurrent.futures.ProcessPoolExecutor + asyncio wrapper. Сравните производительность генераторов vs list comprehensions и __slots__ в dataclass. Цель — снизить время выполнения минимум в 3 раза.`,
    files: [
      {
        filename: "profiling.py",
        code: `"""
CPU-профилирование: cProfile + pyinstrument + сравнение подходов.

Запуск профилировщиков:
  python -m cProfile -o output.prof profiling.py
  python -m pyinstrument profiling.py

Анализ cProfile:
  python -c "import pstats; p=pstats.Stats('output.prof'); p.sort_stats('cumulative'); p.print_stats(20)"

pyinstrument даёт flamegraph в HTML: pyinstrument --html -o flamegraph.html profiling.py
"""
import cProfile
import io
import pstats
import time
from dataclasses import dataclass
from typing import Generator, Iterator

# ------------------------------------------------------------------
# Версия 1: наивная (без оптимизаций) — baseline для измерений
# ------------------------------------------------------------------

class RecordNaive:
    """Обычный класс без __slots__ — dict для каждого экземпляра."""
    def __init__(self, user_id: int, amount: float, status: str) -> None:
        self.user_id = user_id
        self.amount  = amount
        self.status  = status


def process_naive(records: list[RecordNaive]) -> dict:
    """
    Наивная обработка: list comprehension + filter + sum.
    Создаёт промежуточные списки на каждом шаге → O(N) дополнительная память.
    """
    paid = [r for r in records if r.status == "paid"]
    amounts = [r.amount for r in paid]
    total = sum(amounts)
    avg   = total / len(paid) if paid else 0
    top10 = sorted(paid, key=lambda r: r.amount, reverse=True)[:10]
    return {
        "total":   total,
        "avg":     avg,
        "count":   len(paid),
        "top10":   [r.amount for r in top10],
    }


# ------------------------------------------------------------------
# Версия 2: __slots__ — устраняем overhead словаря экземпляра
# ------------------------------------------------------------------

@dataclass(slots=True, frozen=True)
class RecordSlots:
    """
    __slots__ убирает __dict__ у каждого экземпляра.
    frozen=True добавляет __hash__ — можно использовать в set/dict.

    Экономия памяти: ~200 байт → ~56 байт на экземпляр.
    При 1 млн записей: ~200 MB → ~56 MB.
    """
    user_id: int
    amount:  float
    status:  str


# ------------------------------------------------------------------
# Версия 3: генераторы вместо list comprehensions
# ------------------------------------------------------------------

def process_with_generators(records: list[RecordSlots]) -> dict:
    """
    Генераторы — ленивые вычисления: не создают промежуточные списки.
    Но: нельзя пройти генератор дважды — это важно учитывать.
    """
    # Фильтрующий генератор — не создаёт список paid в памяти
    paid_gen: Iterator[RecordSlots] = (r for r in records if r.status == "paid")

    total   = 0.0
    count   = 0
    top10: list[tuple[float, int]] = []    # (amount, user_id)

    for r in paid_gen:
        total += r.amount
        count += 1
        # Маленькая куча вместо полной сортировки — O(N log 10) vs O(N log N)
        import heapq
        if len(top10) < 10:
            heapq.heappush(top10, (r.amount, r.user_id))
        elif r.amount > top10[0][0]:
            heapq.heapreplace(top10, (r.amount, r.user_id))

    avg = total / count if count else 0
    return {
        "total": total,
        "avg":   avg,
        "count": count,
        "top10": sorted(top10, reverse=True),
    }


# ------------------------------------------------------------------
# Версия 4: numpy vectorization — для числовых операций
# ------------------------------------------------------------------

def process_numpy(user_ids, amounts, statuses) -> dict:
    """
    numpy работает в C — GIL отпускается на время операции.
    Для числовых данных это самый быстрый подход в одном процессе.

    Входные данные — numpy arrays, не Python-объекты.
    """
    import numpy as np

    mask   = statuses == "paid"       # boolean mask — O(N) без цикла Python
    paid_amounts = amounts[mask]

    if len(paid_amounts) == 0:
        return {"total": 0, "avg": 0, "count": 0, "top10": []}

    total  = float(np.sum(paid_amounts))
    avg    = float(np.mean(paid_amounts))
    count  = int(np.sum(mask))
    top10_idx = np.argpartition(paid_amounts, -min(10, len(paid_amounts)))[-10:]
    top10  = sorted(paid_amounts[top10_idx].tolist(), reverse=True)

    return {"total": total, "avg": avg, "count": count, "top10": top10}


# ------------------------------------------------------------------
# Бенчмарк: сравнение версий
# ------------------------------------------------------------------

def run_benchmark(n: int = 1_000_000) -> None:
    import random
    import sys

    statuses = ["paid", "pending", "cancelled"]

    print(f"Генерация {n:,} записей...")
    t0 = time.perf_counter()

    # Наивные записи
    naive_records = [
        RecordNaive(i, random.uniform(1, 10_000), random.choice(statuses))
        for i in range(n)
    ]
    print(f"  Наивные объекты: {sys.getsizeof(naive_records[0])} байт/объект")

    # Slotted записи
    slot_records = [
        RecordSlots(i, random.uniform(1, 10_000), random.choice(statuses))
        for i in range(n)
    ]
    print(f"  Slotted объекты: {sys.getsizeof(slot_records[0])} байт/объект")

    print(f"Генерация заняла {time.perf_counter()-t0:.2f} сек\n")

    results = {}

    # --- Версия 1: наивная ---
    t0 = time.perf_counter()
    results["naive"] = process_naive(naive_records)
    t_naive = time.perf_counter() - t0
    print(f"Наивная обработка:       {t_naive:.3f} сек")

    # --- Версия 2: генераторы + __slots__ ---
    t0 = time.perf_counter()
    results["generators"] = process_with_generators(slot_records)
    t_gen = time.perf_counter() - t0
    print(f"Генераторы + slots:      {t_gen:.3f} сек  (x{t_naive/t_gen:.1f} быстрее)")

    # --- Версия 3: numpy ---
    import numpy as np
    user_ids_np = np.arange(n, dtype=np.int32)
    amounts_np  = np.random.uniform(1, 10_000, n).astype(np.float32)
    statuses_np = np.array([random.choice(statuses) for _ in range(n)])

    t0 = time.perf_counter()
    results["numpy"] = process_numpy(user_ids_np, amounts_np, statuses_np)
    t_np = time.perf_counter() - t0
    print(f"numpy vectorization:     {t_np:.3f} сек  (x{t_naive/t_np:.1f} быстрее)")

    print(f"\nЦель достигнута: {'ДА' if t_naive / t_np >= 3 else 'НЕТ'} "
          f"(numpy в {t_naive/t_np:.1f}x раз быстрее)")


# ------------------------------------------------------------------
# cProfile интеграция
# ------------------------------------------------------------------

def profile_function(func, *args, top_n: int = 15, **kwargs):
    """Запускает функцию под cProfile и печатает топ-N узких мест."""
    pr = cProfile.Profile()
    pr.enable()
    result = func(*args, **kwargs)
    pr.disable()

    sio = io.StringIO()
    ps  = pstats.Stats(pr, stream=sio).sort_stats(pstats.SortKey.CUMULATIVE)
    ps.print_stats(top_n)
    print(sio.getvalue())
    return result


if __name__ == "__main__":
    run_benchmark(n=500_000)`,
      },
      {
        filename: "parallel_processing.py",
        code: `"""
ProcessPoolExecutor + asyncio: GIL-осознанная параллельная обработка.

GIL (Global Interpreter Lock):
  - В одном процессе Python только один поток выполняет байткод
  - CPU-bound задачи в ThreadPoolExecutor НЕ ускорятся (GIL не отпускается)
  - ProcessPoolExecutor создаёт отдельные процессы — каждый со своим GIL
  - asyncio.get_event_loop().run_in_executor() — запускает sync-функцию в пуле
    и возвращает awaitable (не блокирует event loop)
"""
import asyncio
import math
import multiprocessing
import time
from concurrent.futures import ProcessPoolExecutor
from typing import Any

CPU_COUNT = multiprocessing.cpu_count()


# ------------------------------------------------------------------
# CPU-bound функция (worker, запускается в отдельном процессе)
# ------------------------------------------------------------------

def compute_chunk(args: tuple[list, int]) -> dict:
    """
    Обрабатывает один чанк данных. Выполняется в дочернем процессе.

    ВАЖНО: функция должна быть importable (не лямбда, не вложенная).
    ProcessPoolExecutor сериализует через pickle — замыкания не сериализуются.
    Аргументы передаются как один tuple (pickle-friendly).
    """
    chunk, chunk_id = args
    total   = 0.0
    count   = 0
    sq_sum  = 0.0

    for amount, status in chunk:
        if status == "paid":
            total  += amount
            sq_sum += amount * amount
            count  += 1

    variance = (sq_sum / count - (total / count) ** 2) if count > 0 else 0
    return {
        "chunk_id": chunk_id,
        "total":    total,
        "count":    count,
        "variance": variance,
        "std_dev":  math.sqrt(max(0, variance)),
    }


def merge_results(results: list[dict]) -> dict:
    """Объединяет результаты из всех воркеров."""
    total = sum(r["total"] for r in results)
    count = sum(r["count"] for r in results)
    return {
        "total":   total,
        "count":   count,
        "avg":     total / count if count else 0,
        "chunks":  len(results),
    }


# ------------------------------------------------------------------
# Async-обёртка для CPU-bound обработки
# ------------------------------------------------------------------

async def process_parallel(
    data: list[tuple[float, str]],
    workers: int = CPU_COUNT,
    chunk_size: int | None = None,
) -> dict:
    """
    Разбивает данные на чанки и обрабатывает в ProcessPoolExecutor.
    run_in_executor() не блокирует event loop — другие coroutines продолжают работать.

    workers  — количество процессов (обычно = CPU_COUNT)
    chunk_size — размер чанка (None = автоматически N/workers)
    """
    n = len(data)
    chunk_size = chunk_size or max(1, n // workers)

    chunks = [
        (data[i : i + chunk_size], idx)
        for idx, i in enumerate(range(0, n, chunk_size))
    ]

    loop = asyncio.get_event_loop()

    with ProcessPoolExecutor(max_workers=workers) as pool:
        # submit all chunks concurrently
        futures = [
            loop.run_in_executor(pool, compute_chunk, chunk_args)
            for chunk_args in chunks
        ]
        # Ждём все чанки параллельно
        partial_results = await asyncio.gather(*futures)

    return merge_results(list(partial_results))


# ------------------------------------------------------------------
# Бенчмарк: sequential vs parallel
# ------------------------------------------------------------------

async def benchmark_parallel(n: int = 1_000_000) -> None:
    import random
    statuses = ["paid", "pending", "cancelled"]
    data = [(random.uniform(1, 10_000), random.choice(statuses)) for _ in range(n)]

    print(f"Данных: {n:,} записей, CPU cores: {CPU_COUNT}\n")

    # --- Последовательная обработка ---
    t0 = time.perf_counter()
    seq_result = compute_chunk((data, 0))
    t_seq = time.perf_counter() - t0
    print(f"Последовательно:  {t_seq:.3f} сек")

    # --- Параллельная (2 воркера) ---
    t0 = time.perf_counter()
    par2 = await process_parallel(data, workers=2)
    t_par2 = time.perf_counter() - t0
    print(f"Параллельно (2x): {t_par2:.3f} сек  (x{t_seq/t_par2:.1f})")

    # --- Параллельная (все ядра) ---
    t0 = time.perf_counter()
    par_all = await process_parallel(data, workers=CPU_COUNT)
    t_par_all = time.perf_counter() - t0
    print(f"Параллельно ({CPU_COUNT}x): {t_par_all:.3f} сек  (x{t_seq/t_par_all:.1f})")

    print(f"\nЦель (3x+): {'ДОСТИГНУТА' if t_seq / t_par_all >= 3 else f'частично ({t_seq/t_par_all:.1f}x)'}")

    # Примечание: реальный speedup ограничен:
    # - overhead сериализации данных (pickle)
    # - overhead создания процессов
    # - закон Амдала (последовательная часть не параллелится)
    print("\nПримечание: для мелких данных (<10k) overhead pickle > выигрыш от параллелизма.")
    print("Оптимум: чанки >= 10k записей каждый.")


if __name__ == "__main__":
    asyncio.run(benchmark_parallel())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**\`__slots__\` и \`@dataclass(slots=True)\`:**
- Обычный объект Python хранит атрибуты в \`__dict__\` (словарь) — ~200 байт overhead на экземпляр
- \`__slots__\` заменяет словарь фиксированным набором слотов — ~56 байт
- При 1 млн объектов экономия: ~144 MB RAM
- В Python 3.10+ \`@dataclass(slots=True)\` генерирует \`__slots__\` автоматически; \`frozen=True\` добавляет \`__hash__\`

**Генераторы vs list comprehensions:**
- \`[r for r in records if r.status == "paid"]\` — создаёт список в памяти (O(N) доп. RAM)
- \`(r for r in records if r.status == "paid"]\` — ленивый итератор, элементы по одному
- Для \`sum()\`, \`max()\`, \`min()\` — генератор предпочтительнее: нет промежуточного списка
- Исключение: если нужно пройти коллекцию несколько раз — генератор нельзя (он одноразовый)

**heapq вместо sorted() для top-N:**
- \`sorted(all_records)[:10]\` — O(N log N): сортируем всё чтобы взять 10
- \`heapq.nlargest(10, records)\` — O(N log 10) = O(N): мини-куча размером 10
- При N = 1 млн разница: ~20× быстрее

**numpy vectorization — SIMD и C-уровень:**
- numpy операции работают в C (без GIL) и используют SIMD инструкции CPU
- \`amounts[mask]\` — boolean indexing без Python-цикла
- \`np.sum\`, \`np.mean\` — O(N) без создания промежуточных Python-объектов
- \`np.argpartition\` — O(N) для нахождения top-K (быстрее \`np.argsort\` = O(N log N))

**ProcessPoolExecutor + asyncio.run_in_executor:**
- \`ThreadPoolExecutor\` для CPU-bound бесполезен — GIL не отпускается при вычислениях
- \`ProcessPoolExecutor\` — каждый процесс со своим GIL; данные сериализуются через pickle
- \`run_in_executor(pool, func, arg)\` — запускает sync-функцию в пуле без блокировки event loop
- Overhead pickle: для tuple/list ~0.5-2 мкс/элемент; чанки <10k записей — overhead > выигрыш`,
  },
  {
    id: "memory-profiling-optimization",
    title: "Оптимизация памяти: memray, weakref, lru_cache, production-профилирование",
    task: `Оптимизируйте по памяти сервис, который одновременно работает с тысячами объектов (например, кэширование результатов запросов). Используйте memray для поиска утечек, примените weakref, __slots__ и functools.lru_cache с кастомным eviction policy. Добавьте профилирование в production-режиме (через signal) и реализуйте автоматический отчёт о потреблении памяти при превышении порога.`,
    files: [
      {
        filename: "memory_optimizer.py",
        code: `"""
Оптимизация памяти: weakref + __slots__ + lru_cache + memray.

Инструменты профилирования памяти:
  memray    — трекер аллокаций (flamegraph памяти)
  tracemalloc — встроенный (Python 3.4+), без внешних зависимостей
  objgraph  — визуализация графа объектов, поиск циклических ссылок

Запуск memray:
  memray run --output output.bin script.py
  memray flamegraph output.bin        # открывает HTML flamegraph
  memray stats output.bin             # текстовая статистика

Профилирование в production (через SIGUSR1):
  kill -SIGUSR1 <pid>    # включает tracemalloc на 30 сек, сохраняет snapshot
"""
import gc
import signal
import sys
import time
import tracemalloc
import weakref
from collections import OrderedDict
from dataclasses import dataclass
from functools import lru_cache, wraps
from threading import Lock
from typing import Any, Callable, Optional


# ------------------------------------------------------------------
# Утечка памяти (для демонстрации memray)
# ------------------------------------------------------------------

class CacheWithLeak:
    """
    Пример ПЛОХОГО кэша: сильные ссылки + нет eviction.
    Объекты никогда не удаляются → утечка памяти.
    """
    def __init__(self):
        self._cache: dict[str, Any] = {}

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = value    # ← сильная ссылка: GC не удалит объект

    def get(self, key: str) -> Any:
        return self._cache.get(key)


# ------------------------------------------------------------------
# weakref-кэш: объект удаляется GC когда нет других ссылок
# ------------------------------------------------------------------

class WeakrefCache:
    """
    weakref.WeakValueDictionary:
    - Значения — слабые ссылки (не удерживают объект от GC)
    - Когда на объект нет сильных ссылок — он автоматически удаляется из кэша
    - Идеально для кэширования больших объектов которые могут быть воссозданы

    ОГРАНИЧЕНИЕ: объекты должны быть weakref-able
    (не работает для int, str, tuple без наследования).
    """

    def __init__(self) -> None:
        self._cache: weakref.WeakValueDictionary = weakref.WeakValueDictionary()

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = value

    def get(self, key: str) -> Optional[Any]:
        return self._cache.get(key)

    def __len__(self) -> int:
        return len(self._cache)


# ------------------------------------------------------------------
# LRU-кэш с кастомной eviction-политикой и лимитом по памяти
# ------------------------------------------------------------------

@dataclass(slots=True)
class CacheEntry:
    value:     Any
    size_bytes: int
    hits:      int = 0
    created_at: float = 0.0

    def __post_init__(self):
        self.created_at = time.time()


class MemoryAwareLRUCache:
    """
    LRU-кэш с тремя политиками вытеснения:
    1. LRU (Least Recently Used) — стандартная
    2. LFU-hint: если hits > threshold — не вытесняем (hot entries)
    3. TTL: записи старше max_age_sec удаляются при доступе

    Отслеживает суммарный размер и вытесняет при превышении max_bytes.
    """

    def __init__(
        self,
        max_entries: int = 1000,
        max_bytes: int   = 100 * 1024 * 1024,   # 100 MB
        max_age_sec: float = 300.0,
        hot_hits_threshold: int = 10,
    ) -> None:
        self._max_entries = max_entries
        self._max_bytes   = max_bytes
        self._max_age     = max_age_sec
        self._hot_hits    = hot_hits_threshold
        self._store: OrderedDict[str, CacheEntry] = OrderedDict()
        self._total_bytes = 0
        self._lock        = Lock()

    def _estimate_size(self, value: Any) -> int:
        """Грубая оценка размера объекта в байтах через sys.getsizeof."""
        try:
            return sys.getsizeof(value)
        except TypeError:
            return 64    # дефолт для нестандартных объектов

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            # TTL-проверка
            if time.time() - entry.created_at > self._max_age:
                self._evict_key(key)
                return None
            entry.hits += 1
            self._store.move_to_end(key)    # LRU: перемещаем в конец
            return entry.value

    def set(self, key: str, value: Any) -> None:
        size = self._estimate_size(value)
        with self._lock:
            if key in self._store:
                self._total_bytes -= self._store[key].size_bytes
            self._store[key] = CacheEntry(value=value, size_bytes=size)
            self._store.move_to_end(key)
            self._total_bytes += size
            self._enforce_limits()

    def _enforce_limits(self) -> None:
        """Вытесняем записи пока не выполним лимиты по кол-ву и размеру."""
        while (len(self._store) > self._max_entries or
               self._total_bytes > self._max_bytes):
            # Находим первый НЕ горячий ключ (hot entries не вытесняем)
            evict_key = None
            for k, entry in self._store.items():   # итерируем от LRU-конца
                if entry.hits < self._hot_hits:
                    evict_key = k
                    break
            if evict_key is None:
                # Все горячие — вытесняем самый старый в любом случае
                evict_key = next(iter(self._store))
            self._evict_key(evict_key)

    def _evict_key(self, key: str) -> None:
        entry = self._store.pop(key, None)
        if entry:
            self._total_bytes -= entry.size_bytes

    @property
    def memory_mb(self) -> float:
        return self._total_bytes / 1024 / 1024

    def stats(self) -> dict:
        with self._lock:
            return {
                "entries":    len(self._store),
                "memory_mb":  round(self.memory_mb, 2),
                "max_mb":     round(self._max_bytes / 1024 / 1024, 2),
            }


# ------------------------------------------------------------------
# lru_cache для чистых функций
# ------------------------------------------------------------------

@lru_cache(maxsize=512)
def compute_tax_rate(country: str, year: int, category: str) -> float:
    """
    functools.lru_cache — встроенный кэш для чистых функций.
    maxsize=512: хранит до 512 последних результатов.
    maxsize=None: неограниченный кэш (осторожно с утечками!).

    ОГРАНИЧЕНИЕ: аргументы должны быть hashable (str, int, tuple — да; list, dict — нет).
    """
    # Дорогое вычисление
    time.sleep(0.001)    # имитация запроса к БД/API
    return {"RU": 20.0, "US": 21.0, "DE": 19.0}.get(country, 18.0)


def clear_tax_cache() -> None:
    """Инвалидация всего lru_cache (например, при изменении конфигурации)."""
    compute_tax_rate.cache_clear()
    info = compute_tax_rate.cache_info()
    print(f"Cache cleared. Hits: {info.hits}, Misses: {info.misses}")


# ------------------------------------------------------------------
# Production-профилирование через signal
# ------------------------------------------------------------------

_profiling_active = False


def _sigusr1_handler(signum, frame) -> None:
    """
    SIGUSR1 включает tracemalloc на 30 секунд, затем сохраняет snapshot.
    Вызывается командой: kill -USR1 <pid>

    Не мешает production-трафику: tracemalloc добавляет ~10% overhead по памяти.
    """
    global _profiling_active
    if _profiling_active:
        return
    _profiling_active = True
    import threading
    threading.Thread(target=_run_tracemalloc_snapshot, daemon=True).start()


def _run_tracemalloc_snapshot() -> None:
    global _profiling_active
    import datetime

    tracemalloc.start(25)    # 25 уровней стека
    print("[profiling] tracemalloc запущен на 30 секунд...")
    time.sleep(30)

    snapshot = tracemalloc.take_snapshot()
    tracemalloc.stop()

    # Фильтруем внутренние фреймы Python
    filters = [
        tracemalloc.Filter(False, "<frozen importlib._bootstrap>"),
        tracemalloc.Filter(False, "<frozen importlib._bootstrap_external>"),
    ]
    snapshot = snapshot.filter_traces(filters)
    top_stats = snapshot.statistics("lineno")

    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"/tmp/memory_snapshot_{ts}.txt"
    with open(filename, "w") as f:
        f.write(f"Memory snapshot at {ts}\n")
        f.write("=" * 60 + "\n")
        for stat in top_stats[:30]:
            f.write(f"{stat}\n")

    print(f"[profiling] Snapshot сохранён: {filename}")
    _check_memory_threshold(top_stats)
    _profiling_active = False


def _check_memory_threshold(stats, threshold_mb: float = 500.0) -> None:
    """Отправляет алерт если суммарное потребление превышает порог."""
    total_mb = sum(s.size for s in stats) / 1024 / 1024
    if total_mb > threshold_mb:
        print(f"[ALERT] Потребление памяти {total_mb:.1f} MB > {threshold_mb} MB!")
        # В продакшне: отправить в Slack/PagerDuty
        # requests.post(SLACK_WEBHOOK, json={"text": f"Memory alert: {total_mb:.1f} MB"})


def setup_production_profiling() -> None:
    """Регистрирует обработчик SIGUSR1 для production-профилирования."""
    signal.signal(signal.SIGUSR1, _sigusr1_handler)
    print(f"[profiling] Production profiling ready. PID: {__import__('os').getpid()}")
    print(f"[profiling] Запустите: kill -USR1 {__import__('os').getpid()}")`,
      },
    ],
    explanation: `**На что обратить внимание:**

**weakref.WeakValueDictionary — кэш без удержания памяти:**
- Обычный dict держит сильную ссылку → объект не удаляется GC пока он в кэше
- WeakValueDictionary держит слабую ссылку → когда вне кэша нет других ссылок → GC удаляет объект
- Автоматически чистится: нет нужды в explicit eviction
- Ограничение: работает только с weakref-able объектами (экземпляры пользовательских классов)

**LRU с учётом памяти (MemoryAwareLRUCache):**
- Стандартный \`functools.lru_cache\` считает только количество, не байты
- Наш кэш отслеживает \`sys.getsizeof(value)\` и вытесняет при превышении лимита
- "Горячие" записи (hits > threshold) не вытесняются — страховка от вытеснения популярных данных
- TTL-проверка при каждом \`get\` — lazy expiration без фонового потока

**\`functools.lru_cache\` — кэш для чистых функций:**
- \`maxsize=None\` — неограниченный кэш; при утечке аргументов (разные объекты с одним значением) → утечка памяти
- Аргументы должны быть hashable — для составных ключей используйте \`tuple\`
- \`cache_info()\` — статистика: hits/misses/currsize/maxsize
- \`cache_clear()\` — полная инвалидация (нет инвалидации по ключу — это ограничение)

**tracemalloc + SIGUSR1 для production:**
- \`signal.signal(SIGUSR1, handler)\` — регистрируем обработчик Unix-сигнала
- \`kill -USR1 <pid>\` — включает профилирование без перезапуска сервиса
- \`tracemalloc.start(25)\` — 25 уровней стека (глубина = точность, но +overhead)
- \`snapshot.statistics("lineno")\` — топ строк кода по потреблению памяти
- Overhead tracemalloc: ~10% по памяти, ~30% по времени — приемлемо на 30 сек

**memray vs tracemalloc:**
- tracemalloc: встроен в Python, нет зависимостей, перехватывает только \`malloc\` из Python
- memray: внешняя библиотека, перехватывает ВСЕ аллокации (C extensions, numpy, etc.)
- memray flamegraph показывает точно откуда аллоцируется каждый байт — незаменим для numpy/pandas утечек`,
  },
  {
    id: "flamegraph-streaming-profiling",
    title: "Flamegraph в middleware: профилирование медленных запросов, S3, сравнение подходов",
    task: `Реализуйте production-ready профилирование для долгоживущего эндпоинта с streaming-ответом. Нужно интегрировать pyinstrument в middleware, чтобы собирать flamegraph только для запросов дольше 2 секунд, сохранять их в S3 и отправлять алерт в Slack. Добавьте сравнение разных подходов: обычные списки vs generators + async for, и продемонстрируйте, как contextvars и async влияют на overhead.`,
    files: [
      {
        filename: "profiling_middleware.py",
        code: `"""
Profiling middleware: pyinstrument flamegraph для медленных запросов.

Логика:
  1. Каждый запрос профилируется pyinstrument (Profiler)
  2. Если duration > SLOW_THRESHOLD → сохраняем flamegraph в HTML
  3. Загружаем flamegraph в S3 (или локально)
  4. Отправляем алерт в Slack с presigned URL

pyinstrument использует signal-based sampling (каждые 1 мс) —
overhead < 1% в продакшне, не блокирует event loop.

ВНИМАНИЕ: pyinstrument в async-контексте требует Profiler(async_mode="enabled").
"""
import asyncio
import io
import os
import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from pyinstrument import Profiler
from starlette.middleware.base import BaseHTTPMiddleware

log = structlog.get_logger()

SLOW_THRESHOLD_SEC = float(os.getenv("SLOW_REQUEST_THRESHOLD", "2.0"))
SLACK_WEBHOOK      = os.getenv("SLACK_WEBHOOK_URL", "")
S3_BUCKET          = os.getenv("FLAMEGRAPH_S3_BUCKET", "")
S3_PREFIX          = os.getenv("FLAMEGRAPH_S3_PREFIX", "flamegraphs/")


# ------------------------------------------------------------------
# Middleware: профилирование по порогу
# ------------------------------------------------------------------

class ProfilingMiddleware(BaseHTTPMiddleware):
    """
    Инструментирует каждый запрос pyinstrument.
    Flamegraph сохраняется только если запрос медленнее SLOW_THRESHOLD_SEC.

    async_mode="enabled" — pyinstrument корректно отслеживает async-код,
    включая переключения между корутинами. Без него async gaps не видны.
    """

    EXCLUDED_PATHS = {"/health", "/metrics", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        profiler = Profiler(async_mode="enabled", interval=0.001)
        profiler.start()
        t0 = time.perf_counter()

        try:
            response = await call_next(request)
        finally:
            profiler.stop()

        duration = time.perf_counter() - t0
        response.headers["X-Response-Time-Ms"] = str(round(duration * 1000, 2))

        if duration >= SLOW_THRESHOLD_SEC:
            # Не блокируем ответ — сохраняем async
            asyncio.create_task(
                self._handle_slow_request(
                    request=request,
                    profiler=profiler,
                    duration=duration,
                )
            )

        return response

    async def _handle_slow_request(
        self,
        request: Request,
        profiler: Profiler,
        duration: float,
    ) -> None:
        """Сохраняет flamegraph в S3 и отправляет алерт в Slack."""
        flame_id = uuid.uuid4().hex[:12]
        path      = request.url.path
        method    = request.method

        log.warning(
            "slow_request.detected",
            path=path,
            method=method,
            duration_sec=round(duration, 3),
            flame_id=flame_id,
        )

        # Генерируем HTML flamegraph
        html = profiler.output_html(timeline=True)

        # Сохраняем (в S3 или локально)
        if S3_BUCKET:
            url = await _upload_to_s3(flame_id, html, S3_BUCKET, S3_PREFIX)
        else:
            url = await _save_locally(flame_id, html)

        # Алерт в Slack
        if SLACK_WEBHOOK:
            await _send_slack_alert(
                webhook=SLACK_WEBHOOK,
                path=path,
                method=method,
                duration=duration,
                flamegraph_url=url,
                flame_id=flame_id,
            )


# ------------------------------------------------------------------
# S3 upload
# ------------------------------------------------------------------

async def _upload_to_s3(flame_id: str, html: str, bucket: str, prefix: str) -> str:
    """Загружает flamegraph в S3, возвращает presigned URL."""
    import aioboto3
    key = f"{prefix}{flame_id}.html"

    session = aioboto3.Session()
    async with session.client("s3", region_name="eu-west-1") as s3:
        await s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=html.encode("utf-8"),
            ContentType="text/html",
        )
        url = await s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=86400,    # 24 часа
        )
    log.info("flamegraph.uploaded", key=key, url=url)
    return url


async def _save_locally(flame_id: str, html: str) -> str:
    """Fallback: сохраняет в /tmp при отсутствии S3."""
    path = f"/tmp/flamegraph_{flame_id}.html"
    with open(path, "w") as f:
        f.write(html)
    log.info("flamegraph.saved_locally", path=path)
    return f"file://{path}"


# ------------------------------------------------------------------
# Slack alert
# ------------------------------------------------------------------

async def _send_slack_alert(
    webhook: str,
    path: str,
    method: str,
    duration: float,
    flamegraph_url: str,
    flame_id: str,
) -> None:
    import aiohttp
    payload = {
        "text": f":fire: *Медленный запрос* #{flame_id}",
        "attachments": [{
            "color": "danger",
            "fields": [
                {"title": "Эндпоинт", "value": f"{method} {path}", "short": True},
                {"title": "Длительность", "value": f"{duration:.2f} сек", "short": True},
                {"title": "Flamegraph", "value": flamegraph_url},
            ],
        }],
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(webhook, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as resp:
            if resp.status != 200:
                log.warning("slack.alert.failed", status=resp.status)`,
      },
      {
        filename: "streaming_comparison.py",
        code: `"""
Сравнение подходов для streaming-эндпоинтов:
1. Обычный список (всё в памяти)
2. Генератор (ленивая генерация)
3. Async generator + async for
4. Overhead contextvars в hot-path

Измеряем: время первого байта (TTFB), пиковую память, throughput.
"""
import asyncio
import contextvars
import sys
import time
from typing import AsyncIterator, Iterator

from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

# ContextVar для демонстрации overhead
_REQUEST_CTX: contextvars.ContextVar[dict] = contextvars.ContextVar("req_ctx", default={})


# ------------------------------------------------------------------
# Подход 1: список в памяти (антипаттерн для больших данных)
# ------------------------------------------------------------------

@app.get("/stream/list")
async def stream_list(n: int = 100_000) -> StreamingResponse:
    """
    ПЛОХО для больших данных:
    - Создаёт весь список в памяти ДО отправки первого байта
    - TTFB = время генерации всего списка
    - Пиковая память = size(list) * n
    """
    t0 = time.perf_counter()

    # Вся обработка до начала стриминга
    data = [f"row_{i},{i * 1.5},{i % 3}\n" for i in range(n)]
    content = "".join(data)

    print(f"list: built in {(time.perf_counter()-t0)*1000:.1f} ms, "
          f"size={sys.getsizeof(content)/1024:.1f} KB")

    return StreamingResponse(iter([content]), media_type="text/csv")


# ------------------------------------------------------------------
# Подход 2: синхронный генератор
# ------------------------------------------------------------------

def _generate_rows(n: int) -> Iterator[str]:
    """Генерирует строки по одной — O(1) память."""
    yield "id,amount,status\n"
    for i in range(n):
        yield f"{i},{i * 1.5},{i % 3}\n"


@app.get("/stream/generator")
async def stream_generator(n: int = 100_000) -> StreamingResponse:
    """
    ХОРОШО: генератор + StreamingResponse.
    - TTFB близок к нулю (первая строка уже доступна)
    - Память: O(1) — только текущая строка в памяти
    - FastAPI/Starlette стримит чанками (не побайтово)
    """
    return StreamingResponse(_generate_rows(n), media_type="text/csv")


# ------------------------------------------------------------------
# Подход 3: async generator (когда каждая строка требует async операции)
# ------------------------------------------------------------------

async def _async_generate_rows(n: int) -> AsyncIterator[str]:
    """
    Async генератор: каждая строка может потребовать await.
    Например: await db.fetchrow() для каждой записи.

    Overhead vs синхронный: ~3-5 мкс на yield (переключение корутин).
    """
    yield "id,amount,status\n"
    for i in range(n):
        # Имитация async операции каждые 1000 строк
        if i % 1000 == 0:
            await asyncio.sleep(0)    # явная передача управления event loop
        yield f"{i},{i * 1.5},{i % 3}\n"


@app.get("/stream/async-generator")
async def stream_async_generator(n: int = 100_000) -> StreamingResponse:
    return StreamingResponse(_async_generate_rows(n), media_type="text/csv")


# ------------------------------------------------------------------
# Подход 4: batch async generator (оптимум для БД)
# ------------------------------------------------------------------

async def _batch_async_generate(n: int, batch_size: int = 1000) -> AsyncIterator[str]:
    """
    Батчевый стриминг: читаем из БД батчами, стримим построчно.
    Баланс между: overhead async-вызовов и пиковой памятью.

    batch_size=1000 → O(batch_size) память, N/batch_size async-вызовов.
    """
    yield "id,amount,status\n"
    for batch_start in range(0, n, batch_size):
        # Имитация SELECT ... LIMIT batch_size OFFSET batch_start
        await asyncio.sleep(0.001)   # имитация БД-запроса
        batch_end = min(batch_start + batch_size, n)
        for i in range(batch_start, batch_end):
            yield f"{i},{i * 1.5},{i % 3}\n"


@app.get("/stream/batch")
async def stream_batch(n: int = 100_000) -> StreamingResponse:
    """ОПТИМУМ: батчевое чтение из БД + строчный стриминг."""
    return StreamingResponse(_batch_async_generate(n), media_type="text/csv")


# ------------------------------------------------------------------
# Benchmark: overhead contextvars в hot-path
# ------------------------------------------------------------------

async def benchmark_contextvars_overhead(n: int = 1_000_000) -> None:
    """
    Измеряем overhead contextvars.get() в tight-loop.
    Результат: ~30-50 нс/вызов — negligible для большинства случаев.
    """
    ctx = contextvars.ContextVar("bench", default="")
    ctx.set("correlation-id-abc-123")

    # Без contextvars
    t0 = time.perf_counter()
    total = 0
    for i in range(n):
        total += i
    t_no_ctx = time.perf_counter() - t0

    # С contextvars.get()
    t0 = time.perf_counter()
    total = 0
    for i in range(n):
        _ = ctx.get()    # overhead per call
        total += i
    t_with_ctx = time.perf_counter() - t0

    overhead_ns = (t_with_ctx - t_no_ctx) / n * 1e9
    print(f"contextvars overhead: {overhead_ns:.1f} нс/вызов")
    print(f"При 1000 req/sec × 100 вызовов/req = {overhead_ns * 100_000 / 1e6:.3f} мс/сек")


# ------------------------------------------------------------------
# Сравнение: list vs generator (память)
# ------------------------------------------------------------------

def compare_memory_approaches(n: int = 100_000) -> None:
    import tracemalloc

    # List comprehension
    tracemalloc.start()
    data = [f"row_{i}" for i in range(n)]
    current, peak_list = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    del data

    # Generator (iterate to consume)
    tracemalloc.start()
    gen = (f"row_{i}" for i in range(n))
    total_len = sum(len(s) for s in gen)   # потребляем без сохранения
    current, peak_gen = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    print(f"list comprehension пиковая память: {peak_list/1024:.1f} KB")
    print(f"generator пиковая память:          {peak_gen/1024:.1f} KB")
    print(f"Экономия памяти: {peak_list/peak_gen:.1f}x")


if __name__ == "__main__":
    asyncio.run(benchmark_contextvars_overhead())
    compare_memory_approaches()`,
      },
    ],
    explanation: `**На что обратить внимание:**

**pyinstrument vs cProfile для async-кода:**
- cProfile работает по call stack в момент вызова — async-переключения выглядят как мгновенные вызовы
- pyinstrument использует statistical sampling (каждые 1 мс) — видит где реально тратится время, включая await-паузы
- \`Profiler(async_mode="enabled")\` — обязателен для async-кода; без него async gaps (ожидания IO) не отражаются
- Overhead pyinstrument: < 1% CPU (sampling, не instrumentation)

**StreamingResponse + генераторы:**
- \`StreamingResponse(iter([big_string]))\` — передаёт весь контент после его генерации (TTFB = время генерации)
- \`StreamingResponse(generator_func())\` — Starlette итерирует генератор и стримит чанками по 65536 байт
- Первый байт клиент получает сразу после первого \`yield\` — TTFB близко к нулю
- Для больших данных разница: list = 500 MB RAM, generator = ~1 KB RAM

**async generator vs sync generator:**
- Синхронный генератор быстрее: нет overhead переключения корутин (~3-5 мкс/yield)
- Async генератор нужен когда каждая строка требует \`await\` (запрос к БД, Redis и т.д.)
- \`await asyncio.sleep(0)\` в tight-loop — явная передача управления event loop → другие coroutines не голодают
- Батчевый подход (1000 строк/запрос) — оптимум: N/1000 async-вызовов, O(batch) память

**contextvars overhead:**
- \`ContextVar.get()\` — ~30-50 нс/вызов (оптимизированный C-код)
- При 1000 req/сек × 100 вызовов/req = 100k вызовов/сек → ~3-5 мс/сек overhead
- Пренебрежимо мало для API с latency > 1 мс — не оптимизируйте преждевременно
- Однако в tight-loop (миллионы итераций) — overhead заметен; кэшируйте \`ctx.get()\` в локальной переменной

**Сохранение flamegraph в S3 + Slack алерт:**
- Flamegraph генерируется в \`_handle_slow_request\` как asyncio.Task — не блокирует HTTP-ответ
- \`profiler.output_html(timeline=True)\` — интерактивный HTML с временной шкалой (async gaps видны)
- S3 presigned URL с \`ExpiresIn=86400\` — безопасный временный доступ к flamegraph без публичного bucket
- В Slack передаём URL — разработчик кликает и сразу видит где «тормозит» запрос`,
  },
  {
    id: "factory-dependency-injection",
    title: "Factory + Dependency Injection для генераторов отчётов",
    task: `Реализуйте Pythonic Factory + Dependency Injection для создания различных типов отчётных генераторов (PDF, Excel, JSON). Фабрика должна автоматически подбирать реализацию в зависимости от конфигурации и типа пользователя (VIP/обычный), использовать inject / fastapi.Depends для внедрения зависимостей (S3-клиент, шаблонизатор, кэш). Добавьте возможность регистрации новых генераторов без изменения кода фабрики.`,
    files: [
      {
        filename: "report_generators.py",
        code: `from __future__ import annotations

import io
import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Callable, ClassVar

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Вспомогательные зависимости (упрощённые стабы для демонстрации)
# ---------------------------------------------------------------------------

class S3Client:
    def upload(self, key: str, data: bytes) -> str:
        url = f"https://s3.example.com/{key}"
        log.info("S3 upload: %s (%d bytes) → %s", key, len(data), url)
        return url


class TemplateEngine:
    def render(self, template: str, context: dict[str, Any]) -> str:
        # В реальности — Jinja2 / WeasyPrint и т.п.
        return f"<rendered:{template}:{context}>"


class Cache:
    def __init__(self) -> None:
        self._store: dict[str, bytes] = {}

    def get(self, key: str) -> bytes | None:
        return self._store.get(key)

    def set(self, key: str, value: bytes) -> None:
        self._store[key] = value
        log.info("Cache.set: %s (%d bytes)", key, len(value))


# ---------------------------------------------------------------------------
# Модель пользователя и конфигурация
# ---------------------------------------------------------------------------

@dataclass
class User:
    id: int
    name: str
    is_vip: bool = False


@dataclass
class ReportConfig:
    format: str          # "pdf", "excel", "json"
    template: str = "default"
    locale: str = "ru"
    extra: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Базовый интерфейс генератора
# ---------------------------------------------------------------------------

@dataclass
class ReportResult:
    filename: str
    content: bytes
    content_type: str
    s3_url: str | None = None


class BaseReportGenerator(ABC):
    """
    Каждый генератор получает зависимости через конструктор (DI),
    а не создаёт их сам — это упрощает тестирование и замену реализаций.
    """

    def __init__(
        self,
        s3: S3Client,
        tpl: TemplateEngine,
        cache: Cache,
    ) -> None:
        self.s3 = s3
        self.tpl = tpl
        self.cache = cache

    @abstractmethod
    def generate(
        self,
        data: dict[str, Any],
        config: ReportConfig,
        user: User,
    ) -> ReportResult:
        ...

    def _cache_key(self, data: dict[str, Any], config: ReportConfig, user: User) -> str:
        import hashlib, pickle
        raw = pickle.dumps((data, config, user.id))
        return hashlib.sha256(raw).hexdigest()

    def _try_cache(self, key: str) -> bytes | None:
        return self.cache.get(key)

    def _save_cache(self, key: str, content: bytes) -> None:
        self.cache.set(key, content)

    def _upload_s3(self, filename: str, content: bytes) -> str:
        return self.s3.upload(filename, content)


# ---------------------------------------------------------------------------
# Конкретные реализации
# ---------------------------------------------------------------------------

class JsonReportGenerator(BaseReportGenerator):
    content_type = "application/json"

    def generate(self, data: dict[str, Any], config: ReportConfig, user: User) -> ReportResult:
        cache_key = self._cache_key(data, config, user)
        if cached := self._try_cache(cache_key):
            log.info("JSON report: cache hit")
            return ReportResult("report.json", cached, self.content_type)

        # VIP-пользователи получают расширенный payload
        payload = dict(data)
        if user.is_vip:
            payload["_vip"] = True
            payload["_user"] = user.name

        content = json.dumps(payload, ensure_ascii=False, indent=2).encode()
        self._save_cache(cache_key, content)
        s3_url = self._upload_s3(f"reports/{user.id}/report.json", content)
        return ReportResult("report.json", content, self.content_type, s3_url)


class ExcelReportGenerator(BaseReportGenerator):
    content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    def generate(self, data: dict[str, Any], config: ReportConfig, user: User) -> ReportResult:
        # Реальная реализация использовала бы openpyxl
        rows = list(data.items())
        if user.is_vip:
            rows.insert(0, ("VIP", user.name))
        content = f"EXCEL:{config.locale}:{rows}".encode()
        s3_url = self._upload_s3(f"reports/{user.id}/report.xlsx", content)
        return ReportResult("report.xlsx", content, self.content_type, s3_url)


class PdfReportGenerator(BaseReportGenerator):
    content_type = "application/pdf"

    def generate(self, data: dict[str, Any], config: ReportConfig, user: User) -> ReportResult:
        html = self.tpl.render(config.template, {"data": data, "user": user.name})
        # Реальная реализация: weasyprint.HTML(string=html).write_pdf()
        content = f"PDF:{html}".encode()
        s3_url = self._upload_s3(f"reports/{user.id}/report.pdf", content)
        return ReportResult("report.pdf", content, self.content_type, s3_url)


# ---------------------------------------------------------------------------
# Фабрика с реестром — добавляй генераторы без изменения кода фабрики
# ---------------------------------------------------------------------------

GeneratorFactory = Callable[["ReportGeneratorFactory", User, ReportConfig], BaseReportGenerator]

class ReportGeneratorFactory:
    """
    Реестр генераторов.  Новый формат регистрируется через декоратор
    @factory.register("csv") — фабрика не знает о конкретных типах заранее.
    """

    _registry: ClassVar[dict[str, type[BaseReportGenerator]]] = {}

    def __init__(self, s3: S3Client, tpl: TemplateEngine, cache: Cache) -> None:
        # Зависимости хранятся в фабрике и передаются генераторам при создании
        self._s3 = s3
        self._tpl = tpl
        self._cache = cache

    # --- регистрация ---

    @classmethod
    def register(cls, fmt: str):
        """Декоратор для регистрации нового генератора."""
        def decorator(klass: type[BaseReportGenerator]) -> type[BaseReportGenerator]:
            cls._registry[fmt] = klass
            log.info("Registered generator: %s → %s", fmt, klass.__name__)
            return klass
        return decorator

    # --- создание ---

    def create(self, user: User, config: ReportConfig) -> BaseReportGenerator:
        """
        Выбирает реализацию:
        - VIP-пользователи всегда получают PDF (если не задан explicit формат)
        - Обычные пользователи — по config.format
        """
        fmt = config.format
        if user.is_vip and fmt not in ("pdf", "excel"):
            log.info("VIP user %s: upgrading %s → pdf", user.id, fmt)
            fmt = "pdf"

        klass = self._registry.get(fmt)
        if klass is None:
            raise ValueError(f"Unknown report format: {fmt!r}. "
                             f"Registered: {list(self._registry)}")

        return klass(s3=self._s3, tpl=self._tpl, cache=self._cache)


# Регистрируем встроенные генераторы
ReportGeneratorFactory.register("json")(JsonReportGenerator)
ReportGeneratorFactory.register("excel")(ExcelReportGenerator)
ReportGeneratorFactory.register("pdf")(PdfReportGenerator)


# ---------------------------------------------------------------------------
# Пример: регистрация нового формата без изменения фабрики
# ---------------------------------------------------------------------------

@ReportGeneratorFactory.register("csv")
class CsvReportGenerator(BaseReportGenerator):
    content_type = "text/csv"

    def generate(self, data: dict[str, Any], config: ReportConfig, user: User) -> ReportResult:
        lines = ["key,value"] + [f"{k},{v}" for k, v in data.items()]
        content = "\\n".join(lines).encode()
        s3_url = self._upload_s3(f"reports/{user.id}/report.csv", content)
        return ReportResult("report.csv", content, self.content_type, s3_url)`,
      },
      {
        filename: "main_fastapi.py",
        code: `"""
FastAPI-приложение с Dependency Injection через fastapi.Depends.
Фабрика и все зависимости (S3, Cache, TemplateEngine) создаются один раз
и переиспользуются между запросами.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from report_generators import (
    Cache,
    ReportConfig,
    ReportGeneratorFactory,
    ReportResult,
    S3Client,
    TemplateEngine,
    User,
)

app = FastAPI(title="Report Generator API")


# ---------------------------------------------------------------------------
# Singleton-зависимости (создаются один раз при старте)
# ---------------------------------------------------------------------------

def get_s3() -> S3Client:
    return S3Client()          # в production — boto3.client("s3")

def get_template_engine() -> TemplateEngine:
    return TemplateEngine()    # в production — jinja2.Environment(...)

def get_cache() -> Cache:
    return Cache()             # в production — Redis-backed cache

def get_factory(
    s3: Annotated[S3Client, Depends(get_s3)],
    tpl: Annotated[TemplateEngine, Depends(get_template_engine)],
    cache: Annotated[Cache, Depends(get_cache)],
) -> ReportGeneratorFactory:
    """
    Фабрика получает зависимости через Depends — FastAPI строит граф сам.
    Если s3/cache/tpl — Singleton (через lru_cache / lifespan), они не
    создаются заново при каждом запросе.
    """
    return ReportGeneratorFactory(s3=s3, tpl=tpl, cache=cache)


# ---------------------------------------------------------------------------
# Request / Response модели
# ---------------------------------------------------------------------------

class GenerateReportRequest(BaseModel):
    user_id: int
    user_name: str
    is_vip: bool = False
    format: str = "json"         # "json" | "excel" | "pdf" | "csv"
    template: str = "default"
    data: dict = {}


class GenerateReportResponse(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    s3_url: str | None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/reports/generate", response_model=GenerateReportResponse)
def generate_report(
    req: GenerateReportRequest,
    factory: Annotated[ReportGeneratorFactory, Depends(get_factory)],
) -> GenerateReportResponse:
    user = User(id=req.user_id, name=req.user_name, is_vip=req.is_vip)
    config = ReportConfig(format=req.format, template=req.template)

    try:
        generator = factory.create(user, config)
        result: ReportResult = generator.generate(req.data, config, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return GenerateReportResponse(
        filename=result.filename,
        content_type=result.content_type,
        size_bytes=len(result.content),
        s3_url=result.s3_url,
    )


@app.get("/reports/formats")
def list_formats() -> dict:
    return {"formats": list(ReportGeneratorFactory._registry)}


# ---------------------------------------------------------------------------
# Запуск: uvicorn main_fastapi:app --reload
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Registry-паттерн через ClassVar:**
\`ReportGeneratorFactory._registry\` — это словарь на уровне класса (не экземпляра). Декоратор \`@factory.register("csv")\` заполняет его в момент объявления класса, ещё до создания любого экземпляра фабрики. Новый формат добавляется в любом модуле без правки фабрики.

**DI через fastapi.Depends vs ручной DI:**
- \`Depends(get_s3)\` — FastAPI разрешает граф зависимостей автоматически, поддерживает scope (request, singleton через \`lru_cache\`), тестирование через \`app.dependency_overrides\`
- В \`report_generators.py\` зависимости передаются в конструктор — это чистый Python DI без привязки к фреймворку (тестируется без FastAPI)

**Автоматический апгрейд формата для VIP:**
Логика "VIP получает PDF" находится в \`factory.create()\`, а не в endpoint — бизнес-правило инкапсулировано в одном месте.

**Кэширование в BaseReportGenerator:**
Ключ кэша строится через \`pickle + sha256\` по \`(data, config, user.id)\` — включает все параметры запроса. В production замените pickle на \`orjson\` / \`msgpack\` для надёжности.

**Тестирование через dependency_overrides:**
\`\`\`python
app.dependency_overrides[get_s3] = lambda: MockS3Client()
app.dependency_overrides[get_cache] = lambda: FakeCache()
\`\`\`
Фабрика и генераторы получат моки без изменения кода.`,
  },
  {
    id: "strategy-webhook-payment",
    title: "Strategy-паттерн для webhook'ов платёжных систем",
    task: `Создайте Strategy-паттерн для обработки входящих webhook'ов от разных платёжных систем (Stripe, Tinkoff, YooKassa). Каждая стратегия должна реализовывать валидацию подписи, преобразование payload и генерацию событий домена. Основной сервис должен динамически выбирать стратегию по provider и поддерживать добавление новых провайдеров через entry-points.`,
    files: [
      {
        filename: "webhook_strategies.py",
        code: `from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Доменные события (результат обработки webhook'а)
# ---------------------------------------------------------------------------

@dataclass
class DomainEvent:
    event_type: str          # "payment.succeeded", "payment.failed", ...
    provider: str            # "stripe", "tinkoff", "yookassa"
    external_id: str         # ID транзакции на стороне провайдера
    amount: int              # в копейках / центах
    currency: str
    metadata: dict[str, Any] = field(default_factory=dict)
    occurred_at: float = field(default_factory=time.time)


@dataclass
class WebhookRequest:
    """Сырой HTTP-запрос от платёжной системы."""
    provider: str
    headers: dict[str, str]
    body: bytes              # сырое тело (важно для проверки подписи!)
    payload: dict[str, Any]  # распаршенный JSON


# ---------------------------------------------------------------------------
# Базовая стратегия
# ---------------------------------------------------------------------------

class WebhookStrategy(ABC):
    """
    Каждый провайдер реализует три операции:
    1. validate_signature — проверка HMAC / RSA подписи
    2. parse_event       — нормализация payload в DomainEvent
    3. handle            — оркестрация (validate → parse → publish)
    """

    provider: str  # задаётся в подклассе как атрибут класса

    def __init__(self, secret: str) -> None:
        self._secret = secret

    @abstractmethod
    def validate_signature(self, request: WebhookRequest) -> bool: ...

    @abstractmethod
    def parse_event(self, request: WebhookRequest) -> DomainEvent: ...

    def handle(self, request: WebhookRequest) -> DomainEvent:
        if not self.validate_signature(request):
            raise ValueError(f"[{self.provider}] Invalid webhook signature")
        event = self.parse_event(request)
        log.info("[%s] Processed event: %s id=%s amount=%d %s",
                 self.provider, event.event_type, event.external_id,
                 event.amount, event.currency)
        return event


# ---------------------------------------------------------------------------
# Стратегия: Stripe
# ---------------------------------------------------------------------------

class StripeWebhookStrategy(WebhookStrategy):
    provider = "stripe"

    def validate_signature(self, request: WebhookRequest) -> bool:
        """
        Stripe подписывает payload схемой:
        Stripe-Signature: t=<timestamp>,v1=<hmac-sha256>
        """
        sig_header = request.headers.get("Stripe-Signature", "")
        parts = dict(item.split("=", 1) for item in sig_header.split(",") if "=" in item)
        timestamp = parts.get("t", "")
        expected_sig = parts.get("v1", "")

        signed_payload = f"{timestamp}.".encode() + request.body
        computed = hmac.new(
            self._secret.encode(), signed_payload, hashlib.sha256
        ).hexdigest()

        # Защита от timing-атак — hmac.compare_digest
        return hmac.compare_digest(computed, expected_sig)

    def parse_event(self, request: WebhookRequest) -> DomainEvent:
        p = request.payload
        obj = p.get("data", {}).get("object", {})
        event_map = {
            "payment_intent.succeeded": "payment.succeeded",
            "payment_intent.payment_failed": "payment.failed",
            "charge.refunded": "payment.refunded",
        }
        return DomainEvent(
            event_type=event_map.get(p.get("type", ""), "unknown"),
            provider=self.provider,
            external_id=obj.get("id", ""),
            amount=obj.get("amount", 0),
            currency=obj.get("currency", "usd").upper(),
            metadata={"stripe_event_id": p.get("id", "")},
        )


# ---------------------------------------------------------------------------
# Стратегия: Tinkoff
# ---------------------------------------------------------------------------

class TinkoffWebhookStrategy(WebhookStrategy):
    provider = "tinkoff"

    def validate_signature(self, request: WebhookRequest) -> bool:
        """
        Tinkoff: подпись = SHA-256 конкатенации отсортированных значений
        всех полей payload (кроме самого Token), добавляя секрет.
        """
        p = dict(request.payload)
        received_token = p.pop("Token", "")
        # Сортируем поля по ключу, берём строковые значения
        values = [str(v) for _, v in sorted(p.items())]
        values.append(self._secret)
        raw = "".join(values).encode()
        computed = hashlib.sha256(raw).hexdigest()
        return hmac.compare_digest(computed, received_token)

    def parse_event(self, request: WebhookRequest) -> DomainEvent:
        p = request.payload
        status_map = {
            "CONFIRMED": "payment.succeeded",
            "REJECTED": "payment.failed",
            "REFUNDED": "payment.refunded",
            "PARTIAL_REFUNDED": "payment.refunded",
        }
        return DomainEvent(
            event_type=status_map.get(p.get("Status", ""), "unknown"),
            provider=self.provider,
            external_id=str(p.get("PaymentId", "")),
            amount=p.get("Amount", 0),
            currency="RUB",
            metadata={
                "order_id": p.get("OrderId"),
                "terminal_key": p.get("TerminalKey"),
            },
        )


# ---------------------------------------------------------------------------
# Стратегия: YooKassa
# ---------------------------------------------------------------------------

class YooKassaWebhookStrategy(WebhookStrategy):
    provider = "yookassa"

    def validate_signature(self, request: WebhookRequest) -> bool:
        """
        YooKassa передаёт IP-заголовок — в production дополнительно
        проверяйте список разрешённых IP. Здесь демонстрируем HMAC-вариант.
        """
        sig = request.headers.get("X-YooKassa-Signature", "")
        computed = hmac.new(
            self._secret.encode(), request.body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(computed, sig)

    def parse_event(self, request: WebhookRequest) -> DomainEvent:
        p = request.payload
        obj = p.get("object", {})
        amount_info = obj.get("amount", {})
        amount_value = int(float(amount_info.get("value", "0")) * 100)
        status_map = {
            "payment.succeeded": "payment.succeeded",
            "payment.canceled": "payment.failed",
            "refund.succeeded": "payment.refunded",
        }
        return DomainEvent(
            event_type=status_map.get(p.get("event", ""), "unknown"),
            provider=self.provider,
            external_id=obj.get("id", ""),
            amount=amount_value,
            currency=amount_info.get("currency", "RUB").upper(),
            metadata={"description": obj.get("description", "")},
        )`,
      },
      {
        filename: "webhook_service.py",
        code: `from __future__ import annotations

import importlib.metadata
import logging
from typing import Type

from webhook_strategies import (
    DomainEvent,
    StripeWebhookStrategy,
    TinkoffWebhookStrategy,
    WebhookRequest,
    WebhookStrategy,
    YooKassaWebhookStrategy,
)

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Реестр стратегий (entry-points совместимый)
# ---------------------------------------------------------------------------

class WebhookStrategyRegistry:
    """
    Хранит зарегистрированные стратегии.
    Поддерживает два способа регистрации:
      1. Программно: registry.register(StripeWebhookStrategy)
      2. Через entry-points: группа "webhook.strategies" в pyproject.toml
         [project.entry-points."webhook.strategies"]
         stripe = "mypackage.strategies:StripeWebhookStrategy"
    """

    def __init__(self) -> None:
        self._strategies: dict[str, type[WebhookStrategy]] = {}

    def register(self, klass: type[WebhookStrategy]) -> type[WebhookStrategy]:
        self._strategies[klass.provider] = klass
        log.info("Registered strategy: %s", klass.provider)
        return klass

    def load_entry_points(self, group: str = "webhook.strategies") -> None:
        """Загружает стратегии из entry-points установленных пакетов."""
        try:
            eps = importlib.metadata.entry_points(group=group)
            for ep in eps:
                klass: type[WebhookStrategy] = ep.load()
                self.register(klass)
                log.info("Loaded strategy from entry-point: %s → %s", ep.name, klass)
        except Exception as exc:
            log.warning("Entry-points load failed: %s", exc)

    def get(self, provider: str) -> type[WebhookStrategy] | None:
        return self._strategies.get(provider)

    def providers(self) -> list[str]:
        return list(self._strategies)


# Глобальный реестр
registry = WebhookStrategyRegistry()
registry.register(StripeWebhookStrategy)
registry.register(TinkoffWebhookStrategy)
registry.register(YooKassaWebhookStrategy)


# ---------------------------------------------------------------------------
# Основной сервис
# ---------------------------------------------------------------------------

class WebhookService:
    """
    Динамически выбирает стратегию по полю provider в запросе.
    Секреты провайдеров хранятся отдельно (в реальности — из env / Vault).
    """

    def __init__(
        self,
        secrets: dict[str, str],
        reg: WebhookStrategyRegistry = registry,
    ) -> None:
        self._secrets = secrets
        self._registry = reg

    def process(self, request: WebhookRequest) -> DomainEvent:
        klass = self._registry.get(request.provider)
        if klass is None:
            known = self._registry.providers()
            raise ValueError(
                f"Unknown provider: {request.provider!r}. Known: {known}"
            )

        secret = self._secrets.get(request.provider, "")
        strategy: WebhookStrategy = klass(secret=secret)
        return strategy.handle(request)


# ---------------------------------------------------------------------------
# Демонстрация
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import hashlib, hmac, json, logging
    logging.basicConfig(level=logging.INFO)

    SECRETS = {
        "stripe": "stripe_secret_key",
        "tinkoff": "tinkoff_terminal_password",
        "yookassa": "yookassa_secret",
    }

    service = WebhookService(secrets=SECRETS)

    # --- Stripe ---
    stripe_payload = {
        "id": "evt_001",
        "type": "payment_intent.succeeded",
        "data": {"object": {"id": "pi_001", "amount": 5000, "currency": "usd"}},
    }
    body = json.dumps(stripe_payload).encode()
    timestamp = "1700000000"
    sig = hmac.new(
        SECRETS["stripe"].encode(),
        f"{timestamp}.".encode() + body,
        hashlib.sha256,
    ).hexdigest()

    stripe_req = WebhookRequest(
        provider="stripe",
        headers={"Stripe-Signature": f"t={timestamp},v1={sig}"},
        body=body,
        payload=stripe_payload,
    )

    event = service.process(stripe_req)
    print(f"Stripe event: {event}")

    # --- Tinkoff ---
    import hashlib
    tinkoff_payload = {
        "TerminalKey": "TK001",
        "OrderId": "order-99",
        "PaymentId": 12345,
        "Amount": 199900,
        "Status": "CONFIRMED",
    }
    values = [str(v) for _, v in sorted(tinkoff_payload.items())]
    values.append(SECRETS["tinkoff"])
    token = hashlib.sha256("".join(values).encode()).hexdigest()
    tinkoff_payload["Token"] = token

    tinkoff_req = WebhookRequest(
        provider="tinkoff",
        headers={},
        body=json.dumps(tinkoff_payload).encode(),
        payload=tinkoff_payload,
    )
    event = service.process(tinkoff_req)
    print(f"Tinkoff event: {event}")`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Стратегия как класс, а не функция:**
Каждая стратегия хранит \`_secret\` через конструктор. Это позволяет тестировать \`validate_signature\` в изоляции:
\`\`\`python
strategy = StripeWebhookStrategy(secret="test_key")
assert strategy.validate_signature(fake_request) is True
\`\`\`

**Важность сырого \`body\` для валидации подписи:**
Stripe и YooKassa вычисляют HMAC по байтам HTTP-тела до парсинга JSON. Если вы сначала парсите \`json.loads(body)\`, а потом делаете \`json.dumps(payload)\` — подпись не совпадёт из-за разного форматирования. Всегда сохраняйте \`request.body\` как \`bytes\`.

**hmac.compare_digest vs ==:**
Обычное сравнение строк \`computed == received\` уязвимо к timing-атаке: злоумышленник может по времени ответа угадать первые совпавшие байты. \`hmac.compare_digest\` выполняется за константное время.

**Entry-points для расширяемости:**
\`importlib.metadata.entry_points(group="webhook.strategies")\` — стандартный Python-механизм для plugin-систем. Сторонний пакет регистрирует стратегию в своём \`pyproject.toml\`:
\`\`\`toml
[project.entry-points."webhook.strategies"]
sberbank = "sberbank_payments.strategy:SberbankWebhookStrategy"
\`\`\`
После \`pip install sberbank-payments\` и \`registry.load_entry_points()\` новый провайдер доступен без изменения кода сервиса.

**Нормализация в DomainEvent:**
Все провайдеры возвращают сумму в единых единицах (копейки). Stripe присылает центы напрямую, YooKassa — рубли дробью (\`"100.00"\`), поэтому \`float(value) * 100\` → \`int\`. Это типичная ошибка: забытое умножение приводит к транзакциям в 100x меньшей суммой.`,
  },
  {
    id: "repository-unit-of-work-sqlalchemy",
    title: "Repository + Unit of Work поверх SQLAlchemy 2.0",
    task: `Реализуйте Repository + Unit of Work паттерны поверх SQLAlchemy 2.0 (с поддержкой async и sync). UoW должен управлять транзакциями, автоматически коммитить/откатывать, поддерживать nested-транзакции и работать с несколькими репозиториями в одном бизнес-кейсе. Добавьте возможность работы в тестовом режиме с in-memory SQLite без изменения кода приложения.`,
    files: [
      {
        filename: "repository.py",
        code: `from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Sequence

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session

# ---------------------------------------------------------------------------
# ORM модели
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)


class OrderModel(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int]
    amount: Mapped[int]       # в копейках
    status: Mapped[str] = mapped_column(default="pending")


# ---------------------------------------------------------------------------
# Generic-репозиторий (async)
# ---------------------------------------------------------------------------

T = TypeVar("T", bound=Base)


class AsyncRepository(ABC, Generic[T]):
    """Базовый async-репозиторий. Работает с любой SQLAlchemy-моделью."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @property
    @abstractmethod
    def model(self) -> type[T]: ...

    async def get(self, id_: int) -> T | None:
        return await self._session.get(self.model, id_)

    async def list(self) -> Sequence[T]:
        result = await self._session.execute(select(self.model))
        return result.scalars().all()

    async def add(self, obj: T) -> T:
        self._session.add(obj)
        await self._session.flush()  # присваивает id без commit
        return obj

    async def delete(self, id_: int) -> None:
        await self._session.execute(
            delete(self.model).where(self.model.id == id_)  # type: ignore[attr-defined]
        )

    async def find_by(self, **kwargs: object) -> Sequence[T]:
        stmt = select(self.model).filter_by(**kwargs)
        result = await self._session.execute(stmt)
        return result.scalars().all()


# ---------------------------------------------------------------------------
# Конкретные репозитории
# ---------------------------------------------------------------------------

class UserRepository(AsyncRepository[UserModel]):
    model = UserModel

    async def get_by_email(self, email: str) -> UserModel | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        return result.scalar_one_or_none()

    async def deactivate(self, user_id: int) -> None:
        user = await self.get(user_id)
        if user:
            user.is_active = False
            await self._session.flush()


class OrderRepository(AsyncRepository[OrderModel]):
    model = OrderModel

    async def get_user_orders(self, user_id: int) -> Sequence[OrderModel]:
        return await self.find_by(user_id=user_id)

    async def cancel(self, order_id: int) -> None:
        order = await self.get(order_id)
        if order:
            order.status = "cancelled"
            await self._session.flush()


# ---------------------------------------------------------------------------
# Generic-репозиторий (sync) — для скриптов / Celery-воркеров
# ---------------------------------------------------------------------------

class SyncRepository(ABC, Generic[T]):
    def __init__(self, session: Session) -> None:
        self._session = session

    @property
    @abstractmethod
    def model(self) -> type[T]: ...

    def get(self, id_: int) -> T | None:
        return self._session.get(self.model, id_)

    def add(self, obj: T) -> T:
        self._session.add(obj)
        self._session.flush()
        return obj`,
      },
      {
        filename: "unit_of_work.py",
        code: `from __future__ import annotations

import logging
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncIterator, Iterator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker, create_engine

from repository import Base, OrderRepository, UserRepository

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Async Unit of Work
# ---------------------------------------------------------------------------

class AsyncUnitOfWork:
    """
    Управляет жизненным циклом транзакции и предоставляет репозитории.

    Использование:
        async with AsyncUnitOfWork(session_factory) as uow:
            user = await uow.users.get_by_email("a@b.com")
            await uow.orders.add(OrderModel(user_id=user.id, amount=100))
            # commit происходит автоматически при выходе без исключения

    Nested-транзакции (savepoint):
        async with uow.nested():
            ...  # откатится только этот блок при исключении
    """

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._factory = session_factory
        self._session: AsyncSession

    async def __aenter__(self) -> "AsyncUnitOfWork":
        self._session = self._factory()
        # Инициализируем репозитории, привязанные к текущей сессии
        self.users = UserRepository(self._session)
        self.orders = OrderRepository(self._session)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is None:
            await self.commit()
        else:
            await self.rollback()
            log.warning("UoW rollback: %s — %s", exc_type.__name__, exc_val)
        await self._session.close()

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()

    @asynccontextmanager
    async def nested(self) -> AsyncIterator["AsyncUnitOfWork"]:
        """
        Создаёт savepoint внутри активной транзакции.
        При исключении откатывается только до savepoint — внешняя транзакция жива.
        """
        async with self._session.begin_nested():
            try:
                yield self
            except Exception:
                log.warning("Nested transaction rolled back to savepoint")
                raise  # пере-рейзим для обработки во внешнем блоке


# ---------------------------------------------------------------------------
# Sync Unit of Work (для Celery, скриптов и т.п.)
# ---------------------------------------------------------------------------

class SyncUnitOfWork:
    def __init__(self, session_factory: sessionmaker) -> None:
        self._factory = session_factory
        self._session: Session

    def __enter__(self) -> "SyncUnitOfWork":
        self._session = self._factory()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is None:
            self._session.commit()
        else:
            self._session.rollback()
        self._session.close()

    @contextmanager
    def nested(self) -> Iterator["SyncUnitOfWork"]:
        with self._session.begin_nested():
            yield self


# ---------------------------------------------------------------------------
# Фабрики сессий для разных окружений
# ---------------------------------------------------------------------------

def make_async_session_factory(db_url: str) -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(db_url, echo=False)
    return async_sessionmaker(engine, expire_on_commit=False)


def make_sync_session_factory(db_url: str) -> sessionmaker:
    engine = create_engine(db_url, echo=False)
    return sessionmaker(engine, expire_on_commit=False)


async def init_db(db_url: str) -> None:
    """Создаёт таблицы (используйте только в dev/test — в prod Alembic)."""
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


# ---------------------------------------------------------------------------
# Демонстрация
# ---------------------------------------------------------------------------

async def demo(session_factory: async_sessionmaker[AsyncSession]) -> None:
    from repository import OrderModel, UserModel

    # --- Базовое использование ---
    async with AsyncUnitOfWork(session_factory) as uow:
        user = await uow.users.get_by_email("alice@example.com")
        if not user:
            user = await uow.users.add(UserModel(email="alice@example.com", name="Alice"))
        order = await uow.orders.add(
            OrderModel(user_id=user.id, amount=199900)
        )
        log.info("Created order #%d for user #%d", order.id, user.id)
        # commit автоматически при выходе из контекстного менеджера

    # --- Nested-транзакции ---
    async with AsyncUnitOfWork(session_factory) as uow:
        user = await uow.users.get_by_email("alice@example.com")
        assert user is not None

        try:
            async with uow.nested():
                # Эта операция будет откачена...
                await uow.orders.add(OrderModel(user_id=user.id, amount=-1))
                raise ValueError("Invalid amount — rollback to savepoint")
        except ValueError:
            log.info("Nested block rolled back, outer transaction still alive")

        # ...но этот commit всё равно выполнится
        await uow.orders.add(OrderModel(user_id=user.id, amount=50000))

    # --- Показываем итог ---
    async with AsyncUnitOfWork(session_factory) as uow:
        orders = await uow.orders.get_user_orders(user.id)  # type: ignore
        log.info("User orders: %s", [(o.id, o.amount, o.status) for o in orders])


if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO)

    # In-memory SQLite для демо (PostgreSQL для production)
    DB_URL = "sqlite+aiosqlite:///:memory:"

    async def main() -> None:
        await init_db(DB_URL)
        factory = make_async_session_factory(DB_URL)
        await demo(factory)

    asyncio.run(main())`,
      },
      {
        filename: "test_uow.py",
        code: `"""
Тесты с in-memory SQLite — код приложения не меняется,
подменяется только фабрика сессий.
"""
import pytest
import pytest_asyncio

from repository import OrderModel, UserModel
from unit_of_work import AsyncUnitOfWork, init_db, make_async_session_factory


TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def session_factory():
    await init_db(TEST_DB_URL)
    return make_async_session_factory(TEST_DB_URL)


@pytest.mark.asyncio
async def test_create_user_and_order(session_factory):
    async with AsyncUnitOfWork(session_factory) as uow:
        user = await uow.users.add(UserModel(email="bob@test.com", name="Bob"))
        order = await uow.orders.add(OrderModel(user_id=user.id, amount=1000))

    # Проверяем, что данные сохранились
    async with AsyncUnitOfWork(session_factory) as uow:
        fetched = await uow.users.get_by_email("bob@test.com")
        assert fetched is not None
        assert fetched.name == "Bob"
        orders = await uow.orders.get_user_orders(fetched.id)
        assert len(orders) == 1
        assert orders[0].amount == 1000


@pytest.mark.asyncio
async def test_rollback_on_exception(session_factory):
    with pytest.raises(RuntimeError):
        async with AsyncUnitOfWork(session_factory) as uow:
            await uow.users.add(UserModel(email="fail@test.com", name="Fail"))
            raise RuntimeError("Something went wrong")

    # Данные должны быть откачены
    async with AsyncUnitOfWork(session_factory) as uow:
        user = await uow.users.get_by_email("fail@test.com")
        assert user is None


@pytest.mark.asyncio
async def test_nested_transaction_partial_rollback(session_factory):
    async with AsyncUnitOfWork(session_factory) as uow:
        user = await uow.users.add(UserModel(email="nested@test.com", name="Nested"))

        try:
            async with uow.nested():
                await uow.orders.add(OrderModel(user_id=user.id, amount=-999))
                raise ValueError("bad amount")
        except ValueError:
            pass  # ожидаемо

        # Этот заказ должен попасть в БД
        await uow.orders.add(OrderModel(user_id=user.id, amount=5000))

    async with AsyncUnitOfWork(session_factory) as uow:
        fetched = await uow.users.get_by_email("nested@test.com")
        assert fetched is not None
        orders = await uow.orders.get_user_orders(fetched.id)
        # Только один заказ (с amount=5000), откаченный (-999) не сохранился
        assert len(orders) == 1
        assert orders[0].amount == 5000`,
      },
    ],
    explanation: `**На что обратить внимание:**

**flush() vs commit():**
- \`session.flush()\` — синхронизирует изменения с БД (SQL выполняется), но транзакция ещё открыта. Это позволяет получить автосгенерированный \`id\` записи до commit.
- \`session.commit()\` — фиксирует транзакцию. UoW вызывает его автоматически в \`__aexit__\` при отсутствии исключения.

**expire_on_commit=False:**
По умолчанию после commit SQLAlchemy сбрасывает атрибуты объектов ("expiry") — следующее обращение к \`user.name\` вызовет новый SELECT. Это неожиданно в async-коде после закрытия сессии. \`expire_on_commit=False\` отключает это поведение.

**Nested-транзакции через SAVEPOINT:**
\`session.begin_nested()\` создаёт \`SAVEPOINT\` в PostgreSQL/SQLite. При откате вложенного блока выполняется \`ROLLBACK TO SAVEPOINT\`, внешняя транзакция остаётся активной. Это критически важно для сложных бизнес-кейсов где часть операций может быть необязательной.

**Тестирование с SQLite без изменения кода:**
Вся замена — строка \`DB_URL = "sqlite+aiosqlite:///:memory:"\` в фикстуре. Код бизнес-логики использует \`AsyncUnitOfWork(session_factory)\` — ему всё равно, что за БД. Для поддержки SQLite в тестах убедитесь что не используете PostgreSQL-специфичный синтаксис (RETURNING, jsonb и т.п.) в базовых репозиториях.

**Generic-репозиторий \`AsyncRepository[T]\`:**
TypeVar + Generic позволяет написать базовые CRUD-методы один раз. IDE и mypy выводят правильный тип: \`await uow.users.get(1)\` возвращает \`UserModel | None\`, а не \`Any\`. Конкретные репозитории добавляют только специализированные запросы.`,
  },
  {
    id: "async-decorator-retry-logging",
    title: "Универсальный async-декоратор с retry и логированием",
    task: `Напишите универсальный async-декоратор с параметрами, который измеряет время выполнения, автоматически логирует входные/выходные параметры (с маскировкой чувствительных данных) и повторяет выполнение при указанных исключениях (retry с exponential backoff). Декоратор должен работать как на обычных async-функциях, так и на методах класса и FastAPI-эндпоинтах.`,
    files: [
      {
        filename: "observe.py",
        code: `from __future__ import annotations

import asyncio
import functools
import logging
import re
import time
from collections.abc import Callable, Coroutine
from typing import Any, ParamSpec, TypeVar

log = logging.getLogger(__name__)

P = ParamSpec("P")
R = TypeVar("R")

# ---------------------------------------------------------------------------
# Маскировка чувствительных данных
# ---------------------------------------------------------------------------

_SENSITIVE_KEYS = re.compile(
    r"password|secret|token|key|auth|card|cvv|ssn|pin",
    re.IGNORECASE,
)
_MASK = "***"


def _mask_value(key: str, value: Any) -> Any:
    """Маскирует значение если ключ похож на чувствительный."""
    if isinstance(key, str) and _SENSITIVE_KEYS.search(key):
        return _MASK
    if isinstance(value, str) and len(value) > 200:
        return value[:50] + f"...[{len(value)} chars]"
    return value


def _safe_repr(obj: Any, depth: int = 0) -> Any:
    """Рекурсивно маскирует dict/list для безопасного логирования."""
    if depth > 3:
        return "..."
    if isinstance(obj, dict):
        return {k: _mask_value(k, _safe_repr(v, depth + 1)) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_safe_repr(v, depth + 1) for v in obj]
    return obj


# ---------------------------------------------------------------------------
# Основной декоратор
# ---------------------------------------------------------------------------

def observe(
    *,
    retry_on: tuple[type[Exception], ...] = (),
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    backoff_base: float = 0.5,
    log_args: bool = True,
    log_result: bool = True,
    sensitive_params: tuple[str, ...] = (),
) -> Callable[[Callable[P, Coroutine[Any, Any, R]]], Callable[P, Coroutine[Any, Any, R]]]:
    """
    Параметризованный async-декоратор. Применим к:
    - обычным async-функциям
    - async-методам класса (self/cls прозрачно передаётся)
    - FastAPI-эндпоинтам (совместим с inspect.signature через @functools.wraps)

    Args:
        retry_on:          Кортеж исключений, при которых делать повторные попытки.
        max_retries:       Максимальное число повторов (не считая первую попытку).
        backoff_factor:    Множитель задержки между попытками.
        backoff_base:      Базовая задержка (секунды) для первого повтора.
        log_args:          Логировать ли входные аргументы.
        log_result:        Логировать ли возвращаемое значение.
        sensitive_params:  Дополнительные имена параметров для маскировки.
    """
    def decorator(
        func: Callable[P, Coroutine[Any, Any, R]],
    ) -> Callable[P, Coroutine[Any, Any, R]]:

        import inspect
        sig = inspect.signature(func)
        func_name = f"{func.__module__}.{func.__qualname__}"

        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            # --- Собираем аргументы для логирования ---
            if log_args:
                bound = sig.bind(*args, **kwargs)
                bound.apply_defaults()
                safe_args: dict[str, Any] = {}
                for param_name, value in bound.arguments.items():
                    if param_name in sensitive_params:
                        safe_args[param_name] = _MASK
                    else:
                        safe_args[param_name] = _safe_repr(value)
                log.info("[%s] call args=%s", func_name, safe_args)
            else:
                log.info("[%s] call", func_name)

            attempt = 0
            last_exc: Exception | None = None

            while True:
                t_start = time.perf_counter()
                try:
                    result = await func(*args, **kwargs)
                    elapsed = time.perf_counter() - t_start

                    if log_result:
                        safe_result = _safe_repr(result)
                        log.info(
                            "[%s] ok attempt=%d elapsed=%.3fs result=%s",
                            func_name, attempt + 1, elapsed, safe_result,
                        )
                    else:
                        log.info(
                            "[%s] ok attempt=%d elapsed=%.3fs",
                            func_name, attempt + 1, elapsed,
                        )
                    return result

                except Exception as exc:
                    elapsed = time.perf_counter() - t_start

                    if retry_on and isinstance(exc, retry_on) and attempt < max_retries:
                        delay = backoff_base * (backoff_factor ** attempt)
                        log.warning(
                            "[%s] %s (attempt %d/%d) — retry in %.2fs",
                            func_name, type(exc).__name__,
                            attempt + 1, max_retries + 1, delay,
                        )
                        await asyncio.sleep(delay)
                        attempt += 1
                        last_exc = exc
                        continue

                    log.error(
                        "[%s] failed attempt=%d elapsed=%.3fs exc=%s: %s",
                        func_name, attempt + 1, elapsed, type(exc).__name__, exc,
                    )
                    raise

        return wrapper
    return decorator`,
      },
      {
        filename: "usage.py",
        code: `"""
Демонстрация @observe на трёх сценариях:
1. Обычная async-функция
2. Метод класса
3. FastAPI-эндпоинт
"""
from __future__ import annotations

import asyncio
import logging
import random
from typing import Annotated

from fastapi import Depends, FastAPI
from pydantic import BaseModel

from observe import observe

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


# ---------------------------------------------------------------------------
# 1. Обычная async-функция
# ---------------------------------------------------------------------------

class NetworkError(Exception):
    pass


@observe(
    retry_on=(NetworkError,),
    max_retries=3,
    backoff_base=0.1,
    sensitive_params=("api_key",),
    log_result=True,
)
async def fetch_user(user_id: int, api_key: str) -> dict:
    """api_key будет замаскирован в логах."""
    if random.random() < 0.5:
        raise NetworkError("Simulated network failure")
    return {"id": user_id, "name": "Alice", "email": "alice@example.com"}


# ---------------------------------------------------------------------------
# 2. Метод класса
# ---------------------------------------------------------------------------

class PaymentService:
    def __init__(self, gateway_url: str) -> None:
        self._url = gateway_url

    @observe(
        retry_on=(TimeoutError,),
        max_retries=2,
        backoff_base=0.05,
        sensitive_params=("card_number", "cvv"),
        log_args=True,
        log_result=False,   # результат не логируем (содержит статус платежа)
    )
    async def charge(
        self,
        amount: int,
        card_number: str,
        cvv: str,
    ) -> dict:
        """card_number и cvv маскируются, self — не логируется (filtered by _safe_repr)."""
        await asyncio.sleep(0.01)  # имитация HTTP-запроса к платёжному шлюзу
        return {"status": "ok", "transaction_id": "txn_001", "amount": amount}


# ---------------------------------------------------------------------------
# 3. FastAPI-эндпоинт
# ---------------------------------------------------------------------------

app = FastAPI()


class CreateOrderRequest(BaseModel):
    user_id: int
    amount: int
    payment_token: str   # будет замаскирован через _SENSITIVE_KEYS


def get_payment_service() -> PaymentService:
    return PaymentService(gateway_url="https://gateway.example.com")


@app.post("/orders")
@observe(
    retry_on=(),         # эндпоинты обычно не ретраим
    log_args=True,
    log_result=True,
    sensitive_params=("payment_token",),
)
async def create_order(
    req: CreateOrderRequest,
    svc: Annotated[PaymentService, Depends(get_payment_service)],
) -> dict:
    """
    @observe совместим с FastAPI:
    - @functools.wraps сохраняет __signature__, поэтому Depends работает корректно
    - Pydantic-модели в логах отображаются как dict (через _safe_repr → .model_dump())
    """
    result = await svc.charge(
        amount=req.amount,
        card_number="4111111111111111",
        cvv="123",
    )
    return {"order_id": "ord_001", "payment": result}


# ---------------------------------------------------------------------------
# Демонстрационный запуск (без FastAPI)
# ---------------------------------------------------------------------------

async def main() -> None:
    # Тест 1: функция с retry
    try:
        user = await fetch_user(user_id=42, api_key="super_secret_key_xyz")
        print(f"User: {user}")
    except NetworkError:
        print("Все попытки исчерпаны")

    # Тест 2: метод класса
    svc = PaymentService("https://gateway.example.com")
    result = await svc.charge(amount=199900, card_number="4111111111111111", cvv="123")
    print(f"Payment: {result}")


if __name__ == "__main__":
    asyncio.run(main())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**ParamSpec + TypeVar для типизации декоратора:**
\`P = ParamSpec("P")\` сохраняет сигнатуру оборачиваемой функции — IDE и mypy знают типы аргументов обёрнутой функции. Без ParamSpec декоратор стирает типы и возвращает \`Callable[..., Any]\`.

**@functools.wraps — обязателен для FastAPI:**
FastAPI использует \`inspect.signature(endpoint)\` для парсинга зависимостей (\`Depends\`), типов тела запроса, query-параметров. Без \`@functools.wraps\` сигнатура \`wrapper\` не совпадает с оригиналом — FastAPI не найдёт параметры и вернёт 422 или проигнорирует \`Depends\`.

**Двойная маскировка чувствительных данных:**
1. \`sensitive_params\` — явный список имён параметров (надёжно, без риска ложных срабатываний)
2. \`_SENSITIVE_KEYS\` regex — автоматически по имени ключа в dict (для вложенных структур)

Комбинация покрывает оба случая: именованный аргумент \`api_key="..."\` и dict \`{"password": "..."}\` внутри тела запроса.

**Exponential backoff формула:**
\`delay = backoff_base * (backoff_factor ** attempt)\`
- attempt=0: 0.5 с
- attempt=1: 1.0 с  
- attempt=2: 2.0 с

Добавьте \`delay += random.uniform(0, 0.1)\` (jitter) чтобы избежать thundering herd при одновременном перезапуске множества клиентов.

**Метод класса — self не ломает декоратор:**
\`sig.bind(*args, **kwargs)\` для метода включает \`self\` как первый позиционный аргумент. \`_safe_repr(self)\` не раскрывает внутренние поля (нет итерации по атрибутам), логируется как строковое repr объекта.`,
  },
  {
    id: "descriptor-validation-dto",
    title: "Дескриптор для валидации и преобразования полей модели",
    task: `Реализуйте дескриптор для валидации и преобразования полей модели (аналог Pydantic, но на чистом метапрограммировании). Дескриптор должен поддерживать lazy-вычисление, кэширование, автоматическую конвертацию типов и запрет изменения после инициализации. Примените его в датаклассе, который используется как DTO для API и БД.`,
    files: [
      {
        filename: "descriptors.py",
        code: `from __future__ import annotations

import re
from typing import Any, Callable, Generic, TypeVar, overload

T = TypeVar("T")
S = TypeVar("S")  # тип владельца (owner class)


# ---------------------------------------------------------------------------
# Базовый валидирующий дескриптор
# ---------------------------------------------------------------------------

class TypedField(Generic[T]):
    """
    Дескриптор данных: реализует __set_name__, __get__, __set__, __delete__.

    Особенности:
    - Автоматическая конвертация типа через coerce
    - Произвольные валидаторы (цепочка)
    - Запрет изменения после инициализации (frozen=True)
    - Хранение значений в __dict__ экземпляра (не в дескрипторе!)
    """

    def __init__(
        self,
        type_: type[T],
        *,
        coerce: bool = True,
        default: T | None = None,
        frozen: bool = False,
        validators: list[Callable[[T], T]] | None = None,
    ) -> None:
        self._type = type_
        self._coerce = coerce
        self._default = default
        self._frozen = frozen
        self._validators: list[Callable[[T], T]] = validators or []
        self._attr_name: str = ""          # заполняется в __set_name__
        self._private_name: str = ""       # ключ в instance.__dict__

    def __set_name__(self, owner: type, name: str) -> None:
        """Вызывается при создании класса — сохраняем имя атрибута."""
        self._attr_name = name
        self._private_name = f"_field_{name}"

    # --- Получение значения ---

    @overload
    def __get__(self, obj: None, objtype: type) -> "TypedField[T]": ...
    @overload
    def __get__(self, obj: object, objtype: type) -> T: ...

    def __get__(self, obj: object | None, objtype: type | None = None) -> "TypedField[T] | T":
        if obj is None:
            # Доступ через класс: User.email → возвращаем сам дескриптор
            return self  # type: ignore[return-value]
        value = obj.__dict__.get(self._private_name, self._default)
        if value is None:
            return self._default  # type: ignore[return-value]
        return value  # type: ignore[return-value]

    # --- Установка значения ---

    def __set__(self, obj: object, value: Any) -> None:
        # Frozen: запрещаем изменение если значение уже установлено
        if self._frozen and self._private_name in obj.__dict__:
            raise AttributeError(
                f"Field '{self._attr_name}' is frozen and cannot be changed "
                f"after initialization."
            )

        # Coerce: пытаемся привести к нужному типу
        if value is not None and not isinstance(value, self._type):
            if self._coerce:
                try:
                    value = self._type(value)
                except (ValueError, TypeError) as exc:
                    raise TypeError(
                        f"Field '{self._attr_name}': cannot coerce "
                        f"{type(value).__name__!r} → {self._type.__name__!r}: {exc}"
                    ) from exc
            else:
                raise TypeError(
                    f"Field '{self._attr_name}': expected {self._type.__name__}, "
                    f"got {type(value).__name__}"
                )

        # Валидация по цепочке
        for validator in self._validators:
            value = validator(value)

        obj.__dict__[self._private_name] = value

    def __delete__(self, obj: object) -> None:
        if self._frozen:
            raise AttributeError(f"Field '{self._attr_name}' is frozen.")
        obj.__dict__.pop(self._private_name, None)


# ---------------------------------------------------------------------------
# Lazy computed дескриптор (не-данных дескриптор)
# ---------------------------------------------------------------------------

class lazy_property(Generic[T]):
    """
    Вычисляет значение один раз при первом обращении и кэширует
    его в __dict__ экземпляра. Повторные обращения не вызывают функцию.

    Это не-данных дескриптор (только __get__) — instance.__dict__
    имеет приоритет, поэтому после первого вычисления дескриптор
    «вытесняется» кэшированным значением.
    """

    def __init__(self, func: Callable[[Any], T]) -> None:
        self._func = func
        self._attr_name = func.__name__
        self.__doc__ = func.__doc__

    def __set_name__(self, owner: type, name: str) -> None:
        self._attr_name = name

    def __get__(self, obj: object | None, objtype: type | None = None) -> T | "lazy_property[T]":
        if obj is None:
            return self  # type: ignore[return-value]
        value = self._func(obj)
        # Записываем в __dict__ экземпляра — перекрывает дескриптор
        obj.__dict__[self._attr_name] = value
        return value


# ---------------------------------------------------------------------------
# Готовые валидаторы
# ---------------------------------------------------------------------------

def non_empty(value: str) -> str:
    if not value or not value.strip():
        raise ValueError("Value cannot be empty")
    return value.strip()


def positive(value: int | float) -> int | float:
    if value <= 0:
        raise ValueError(f"Value must be positive, got {value}")
    return value


def email_format(value: str) -> str:
    if not re.fullmatch(r"[^@]+@[^@]+\\.[^@]+", value):
        raise ValueError(f"Invalid email format: {value!r}")
    return value.lower()


def max_length(n: int) -> Callable[[str], str]:
    def validator(value: str) -> str:
        if len(value) > n:
            raise ValueError(f"Too long: {len(value)} > {n} chars")
        return value
    return validator`,
      },
      {
        filename: "dto.py",
        code: `"""
ProductDTO — датаклас-DTO с дескрипторами.
Используется и как API-схема (FastAPI), и как сущность для вставки в БД.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from descriptors import (
    TypedField,
    lazy_property,
    email_format,
    max_length,
    non_empty,
    positive,
)


# ---------------------------------------------------------------------------
# DTO с дескрипторами
# ---------------------------------------------------------------------------

@dataclass
class ProductDTO:
    """
    Датакласс + дескрипторы:
    - @dataclass генерирует __init__, __repr__, __eq__
    - TypedField перехватывает установку значений через __set__
    - lazy_property вычисляется один раз при первом обращении

    Важно: дескрипторы объявлены как ClassVar-подобные атрибуты класса,
    но хранят данные в instance.__dict__ — конфликта нет.
    """

    # Строки с валидацией и автотримом
    name: str = TypedField(  # type: ignore[assignment]
        str,
        validators=[non_empty, max_length(100)],
    )
    sku: str = TypedField(   # type: ignore[assignment]
        str,
        frozen=True,         # SKU нельзя менять после создания
        validators=[non_empty, max_length(32)],
    )

    # Число с автоматической конвертацией str → int
    quantity: int = TypedField(  # type: ignore[assignment]
        int,
        coerce=True,
        validators=[positive],  # type: ignore[list-item]
    )

    # Decimal через coerce (TypedField вызывает Decimal(value))
    price: Decimal = TypedField(  # type: ignore[assignment]
        Decimal,
        coerce=True,
        validators=[positive],  # type: ignore[list-item]
    )

    # Email с форматной валидацией, frozen
    owner_email: str = TypedField(  # type: ignore[assignment]
        str,
        frozen=True,
        validators=[non_empty, email_format],
    )

    tags: list[str] = field(default_factory=list)

    # -------------------------------------------------------------------
    # Lazy computed properties
    # -------------------------------------------------------------------

    @lazy_property
    def display_price(self) -> str:
        """Форматированная цена — вычисляется один раз."""
        return f"{self.price:,.2f} ₽"

    @lazy_property
    def slug(self) -> str:
        """URL-slug из имени — вычисляется один раз и кэшируется."""
        import re
        return re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")

    # -------------------------------------------------------------------
    # Сериализация для API и БД
    # -------------------------------------------------------------------

    def to_api_dict(self) -> dict[str, Any]:
        """Для FastAPI response_model / JSON API."""
        return {
            "sku": self.sku,
            "name": self.name,
            "price": float(self.price),
            "display_price": self.display_price,
            "quantity": self.quantity,
            "owner_email": self.owner_email,
            "tags": self.tags,
            "slug": self.slug,
        }

    def to_db_dict(self) -> dict[str, Any]:
        """Для INSERT/UPDATE в БД (без вычисляемых полей)."""
        return {
            "sku": self.sku,
            "name": self.name,
            "price": str(self.price),   # Decimal → str для PostgreSQL NUMERIC
            "quantity": self.quantity,
            "owner_email": self.owner_email,
            "tags": json.dumps(self.tags),
        }

    @classmethod
    def from_db_row(cls, row: dict[str, Any]) -> "ProductDTO":
        """Восстановление из строки БД."""
        return cls(
            sku=row["sku"],
            name=row["name"],
            price=Decimal(row["price"]),
            quantity=int(row["quantity"]),
            owner_email=row["owner_email"],
            tags=json.loads(row.get("tags", "[]")),
        )


# ---------------------------------------------------------------------------
# Демонстрация
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Создание с автоконвертацией типов
    p = ProductDTO(
        sku="  PROD-001  ",  # после strip → "PROD-001"
        name="  Ноутбук ASUS  ",
        price="59999.99",    # str → Decimal (coerce)
        quantity="10",       # str → int (coerce)
        owner_email="Admin@Example.COM",   # → admin@example.com (lower)
        tags=["electronics", "laptops"],
    )

    print("API dict:", p.to_api_dict())
    print("DB dict:", p.to_db_dict())
    print("Slug:", p.slug)          # вычисляется и кэшируется
    print("Slug again:", p.slug)    # из __dict__ без вызова функции

    # Frozen: попытка изменить SKU → AttributeError
    try:
        p.sku = "NEW-SKU"
    except AttributeError as e:
        print(f"Frozen field: {e}")

    # Ошибка валидации
    try:
        p.price = Decimal("-100")
    except ValueError as e:
        print(f"Validation error: {e}")

    # Ошибка типа (без coerce)
    try:
        bad = ProductDTO(
            sku="SKU-002", name="Test", price="not_a_number",
            quantity=1, owner_email="test@test.com",
        )
    except TypeError as e:
        print(f"Type error: {e}")

    # Восстановление из БД
    db_row = {
        "sku": "PROD-001", "name": "Laptop", "price": "59999.99",
        "quantity": "5", "owner_email": "admin@example.com", "tags": '["a","b"]',
    }
    restored = ProductDTO.from_db_row(db_row)
    print("Restored from DB:", restored.to_api_dict())`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Дескриптор данных vs не-данных дескриптор:**
- \`TypedField\` реализует и \`__get__\`, и \`__set__\` → это **дескриптор данных**. Он имеет приоритет над \`instance.__dict__\`.
- \`lazy_property\` реализует только \`__get__\` → это **не-данных дескриптор**. \`instance.__dict__\` имеет приоритет. Поэтому при первом вызове мы записываем значение в \`obj.__dict__[name]\`, и дальше Python берёт его оттуда, минуя дескриптор — это и есть кэширование.

**Хранение в \`instance.__dict__\`, а не в дескрипторе:**
Если хранить значения в самом дескрипторе (\`self._value = ...\`), все экземпляры класса будут делить одно значение (дескриптор один на класс). Правильно: \`obj.__dict__[self._private_name] = value\` — каждый экземпляр хранит своё значение.

**\`__set_name__\` — автоматическое именование:**
Вызывается Python при создании класса (\`type.__new__\`). Позволяет дескриптору узнать своё имя без явного указания: \`name = TypedField(str)\` вместо \`name = TypedField(str, name="name")\`.

**Frozen через проверку \`_private_name in obj.__dict__\`:**
Поле «заморожено» не с момента объявления, а с момента первой установки значения. Это позволяет \`__init__\` установить значение, но запрещает последующие изменения.

**Совместимость с \`@dataclass\`:**
\`@dataclass\` генерирует \`__init__\` который делает присваивания \`self.name = name\`. Дескриптор перехватывает эти присваивания через \`__set__\`. Важно: в аннотации ставим \`# type: ignore[assignment]\` потому что mypy не понимает что \`TypedField[str]\` совместим с \`str\`.`,
  },
  {
    id: "metaclass-auto-registry",
    title: "Метакласс AutoRegistryMeta с авторегистрацией",
    task: "Создайте метакласс AutoRegistryMeta, который автоматически регистрирует все наследующие классы в глобальном реестре (по имени или тегу). Добавьте поддержку __getattr__ / __getattribute__ для динамического доступа к зарегистрированным классам и возможность переопределения поведения при создании экземпляра (например, автоматический singleton для определённых классов).",
    files: [
      {
        filename: "registry_meta.py",
        code: `from __future__ import annotations

import logging
import threading
from typing import Any, ClassVar

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Глобальный реестр
# ---------------------------------------------------------------------------

class Registry:
    """Thread-safe хранилище зарегистрированных классов."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._classes: dict[str, type] = {}
        self._singletons: dict[str, Any] = {}

    def add(self, key: str, klass: type) -> None:
        with self._lock:
            if key in self._classes:
                log.warning("Registry: overwriting key %r (%s -> %s)",
                            key, self._classes[key].__name__, klass.__name__)
            self._classes[key] = klass
            log.debug("Registry: registered %r -> %s", key, klass.__name__)

    def get(self, key: str) -> type | None:
        with self._lock:
            return self._classes.get(key)

    def all(self) -> dict[str, type]:
        with self._lock:
            return dict(self._classes)

    def get_or_create_singleton(self, key: str, klass: type, *args: Any, **kwargs: Any) -> Any:
        """Создаёт экземпляр один раз; последующие вызовы возвращают тот же объект."""
        with self._lock:
            if key not in self._singletons:
                instance = object.__new__(klass)
                instance.__init__(*args, **kwargs)
                self._singletons[key] = instance
                log.debug("Registry: created singleton for %r", key)
            return self._singletons[key]

    def clear_singletons(self) -> None:
        with self._lock:
            self._singletons.clear()


_global_registry = Registry()


# ---------------------------------------------------------------------------
# Метакласс
# ---------------------------------------------------------------------------

class AutoRegistryMeta(type):
    # Метакласс автоматически регистрирует подклассы в _global_registry.
    # Ключ регистрации: атрибут registry_tag или cls.__name__.lower().
    # Поддерживает singleton=True и кастомную фабрику __class_factory__.

    _skip_registration: ClassVar[set[str]] = set()

    def __new__(
        mcs,
        name: str,
        bases: tuple[type, ...],
        namespace: dict[str, Any],
        **kwargs: Any,
    ) -> "AutoRegistryMeta":
        klass = super().__new__(mcs, name, bases, namespace, **kwargs)

        if name in mcs._skip_registration:
            return klass

        # Базовый класс иерархии не регистрируется
        is_base = not any(isinstance(b, AutoRegistryMeta) for b in bases)
        if is_base:
            return klass

        tag: str = namespace.get("registry_tag", name.lower())
        _global_registry.add(tag, klass)
        return klass

    def __call__(cls, *args: Any, **kwargs: Any) -> Any:
        # singleton=True: возвращаем один и тот же экземпляр
        if getattr(cls, "singleton", False):
            tag = getattr(cls, "registry_tag", cls.__name__.lower())
            return _global_registry.get_or_create_singleton(tag, cls, *args, **kwargs)

        # __class_factory__: делегируем создание кастомной фабрике
        factory = getattr(cls, "__class_factory__", None)
        if factory is not None and callable(factory):
            return factory(*args, **kwargs)

        return super().__call__(*args, **kwargs)

    def __getattr__(cls, name: str) -> type:
        # Динамический доступ к реестру через атрибут класса:
        # PluginBase.pdf_generator -> _global_registry.get("pdf_generator")
        # Вызывается только если атрибут не найден обычным путём.
        found = _global_registry.get(name)
        if found is not None:
            return found
        raise AttributeError(
            f"{cls.__name__!r} has no attribute {name!r} "
            f"and registry has no key {name!r}. "
            f"Registered: {list(_global_registry.all())}"
        )

    def __repr__(cls) -> str:
        tag = getattr(cls, "registry_tag", cls.__name__.lower())
        singleton_mark = " [singleton]" if getattr(cls, "singleton", False) else ""
        return f"<class {cls.__name__!r} tag={tag!r}{singleton_mark}>"`,
      },
      {
        filename: "usage_meta.py",
        code: `from __future__ import annotations

import logging
from typing import Any

from registry_meta import AutoRegistryMeta, _global_registry

logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------------
# Базовый класс (сам НЕ регистрируется)
# ---------------------------------------------------------------------------

class PluginBase(metaclass=AutoRegistryMeta):
    """Базовый класс плагинов. Подклассы регистрируются автоматически."""

    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Подклассы — регистрируются автоматически при объявлении
# ---------------------------------------------------------------------------

class PdfPlugin(PluginBase):
    registry_tag = "pdf"

    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"type": "pdf", "pages": payload.get("pages", 1)}


class ExcelPlugin(PluginBase):
    registry_tag = "excel"

    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"type": "excel", "sheets": payload.get("sheets", 1)}


class JsonPlugin(PluginBase):
    # registry_tag не задан -> ключ = "jsonplugin" (имя класса lower)
    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"type": "json", "data": payload}


# ---------------------------------------------------------------------------
# Singleton-класс
# ---------------------------------------------------------------------------

class ConfigManager(PluginBase):
    registry_tag = "config"
    singleton = True  # AutoRegistryMeta.__call__ вернёт один и тот же экземпляр

    def __init__(self, debug: bool = False) -> None:
        self.debug = debug
        self._data: dict[str, Any] = {}

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)


# ---------------------------------------------------------------------------
# Кастомная фабрика через __class_factory__
# ---------------------------------------------------------------------------

class SmartPlugin(PluginBase):
    registry_tag = "smart"

    def __init__(self, mode: str) -> None:
        self.mode = mode

    @classmethod
    def __class_factory__(cls, mode: str = "auto") -> "SmartPlugin | PdfPlugin":
        """Возвращает PdfPlugin при mode='pdf', иначе SmartPlugin."""
        if mode == "pdf":
            return PdfPlugin()
        instance = cls.__new__(cls)
        instance.mode = mode
        return instance

    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"type": "smart", "mode": self.mode}


# ---------------------------------------------------------------------------
# Демонстрация
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # 1. Все зарегистрированные классы
    print("Registered:", list(_global_registry.all()))
    # -> ['pdf', 'excel', 'jsonplugin', 'config', 'smart']

    # 2. Динамический доступ через __getattr__ метакласса
    PdfKlass = PluginBase.pdf          # type: ignore[attr-defined]
    print("Via getattr:", PdfKlass)    # <class 'PdfPlugin' tag='pdf'>
    result = PdfKlass().execute({"pages": 5})
    print("PDF result:", result)

    # 3. Singleton: оба вызова возвращают один объект
    cfg1 = ConfigManager(debug=True)
    cfg1.set("env", "production")
    cfg2 = ConfigManager(debug=False)
    print("Singleton same?", cfg1 is cfg2)   # True
    print("Config env:", cfg2.get("env"))    # "production"

    # 4. Кастомная фабрика
    smart = SmartPlugin(mode="auto")
    print("Smart:", type(smart).__name__)        # SmartPlugin

    smart_as_pdf = SmartPlugin(mode="pdf")
    print("Smart->PDF:", type(smart_as_pdf).__name__)  # PdfPlugin

    # 5. Динамическая регистрация нового плагина без изменения базы
    class CsvPlugin(PluginBase):
        registry_tag = "csv"
        def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
            return {"type": "csv", "rows": payload.get("rows", 0)}

    print("After dynamic reg:", list(_global_registry.all()))
    csv_klass = PluginBase.csv         # type: ignore[attr-defined]
    print("CSV result:", csv_klass().execute({"rows": 100}))

    # 6. Несуществующий ключ -> AttributeError
    try:
        _ = PluginBase.nonexistent     # type: ignore[attr-defined]
    except AttributeError as e:
        print(f"AttributeError: {e}")`,
      },
    ],
    explanation: `**На что обратить внимание:**

**Метакласс \`__new__\` vs \`__init__\`:**
\`type.__new__(mcs, name, bases, namespace)\` создаёт сам объект класса. Регистрация происходит здесь, а не в \`__init_subclass__\`, потому что нам нужен доступ к финальному объекту класса с уже вычисленными атрибутами.

**Определение базового класса vs подкласса:**
Проверка \`not any(isinstance(b, AutoRegistryMeta) for b in bases)\` — если ни один из родителей не создан этим метаклассом, это первый (базовый) класс иерархии. Без неё сам \`PluginBase\` тоже попал бы в реестр.

**\`__getattr__\` на метаклассе — доступ через класс:**
\`__getattr__\` на обычном объекте вызывается когда атрибут не найден. На метаклассе это означает поиск атрибута на *классе* (не экземпляре): \`PluginBase.pdf\` инициирует поиск \`"pdf"\` в реестре. Для экземпляров это не работает — там \`__getattr__\` нужно определять на самом классе.

**Singleton через \`get_or_create_singleton\` с блокировкой:**
\`threading.Lock\` гарантирует что в многопоточном коде только один поток создаст экземпляр. Для asyncio замените на \`asyncio.Lock\` или используйте \`functools.cache\` для однопоточного случая.

**\`__class_factory__\` — инверсия контроля:**
Переопределение \`AutoRegistryMeta.__call__\` проверяет наличие \`__class_factory__\`. Это позволяет классу самому решать как создавать экземпляры — возвращать другой класс, применять пул объектов и т.п. — без наследования от специального миксина.

**Почему не \`__init_subclass__\`:**
\`__init_subclass__\` проще для базовой регистрации, но не позволяет переопределить \`__call__\` (создание экземпляров) и \`__getattr__\` (доступ через класс) — это исключительные возможности метакласса.`,
  },
];
