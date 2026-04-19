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
];
