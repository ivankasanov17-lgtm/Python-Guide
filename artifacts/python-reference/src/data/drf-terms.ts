export interface DrfTermArgument {
    name: string;
    description: string;
}

export interface DrfTerm {
    name: string;
    category: string;
    description: string;
    syntax: string;
    arguments: DrfTermArgument[];
    example: string;
}

export const drfTerms: DrfTerm[] = [
  {
    name: "rest_framework.views.APIView.dispatch(request, *args, **kwargs)",
    category: "Views",
    description:
      "Центральный метод диспетчеризации APIView. Принимает входящий HTTP-запрос, оборачивает его в DRF-объект Request, вызывает initial() для аутентификации/авторизации/троттлинга, затем перенаправляет вызов на метод-обработчик (get, post, put, patch, delete и т.д.). После получения ответа вызывает finalize_response(). При исключениях делегирует обработку handle_exception(). Именно dispatch() является точкой входа для любого запроса к APIView.",
    syntax: "APIView.dispatch(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest от Django. Внутри dispatch() он оборачивается в DRF-объект Request.",
      },
      {
        name: "*args, **kwargs",
        description: "Позиционные и именованные аргументы из URL-маршрута (например, pk=1).",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class AuditedAPIView(APIView):
    """APIView с логированием каждого входящего запроса."""

    def dispatch(self, request, *args, **kwargs):
        # Код до обработки запроса
        logger.info(
            "Входящий запрос: %s %s от %s",
            request.method,
            request.path,
            request.META.get("REMOTE_ADDR"),
        )
        response = super().dispatch(request, *args, **kwargs)
        # Код после обработки запроса
        logger.info("Ответ: %s", response.status_code)
        return response

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})


# urls.py
# path("audit/", AuditedAPIView.as_view()),

# GET /audit/
# Логи:
# Входящий запрос: GET /audit/ от 127.0.0.1
# Ответ: 200`,
  },
  {
    name: "rest_framework.views.APIView.initial(request, *args, **kwargs)",
    category: "Views",
    description:
      "Метод, вызываемый из dispatch() перед передачей запроса в обработчик (get/post/…). Выполняет три обязательных шага: 1) perform_authentication() — аутентификация пользователя; 2) check_permissions() — проверка разрешений; 3) check_throttles() — проверка ограничений частоты запросов. Переопределяется для добавления общей логики инициализации, которая должна выполняться для всех методов представления.",
    syntax: "APIView.initial(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request с данными текущего запроса.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута, переданные из dispatch().",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
import time


class MaintenanceAwareView(APIView):
    """Запрещает запросы во время технического обслуживания."""

    MAINTENANCE_HOURS = range(2, 4)  # 02:00–03:59

    def initial(self, request, *args, **kwargs):
        # Сначала выполняем стандартную инициализацию DRF
        super().initial(request, *args, **kwargs)

        # Затем добавляем собственную проверку
        current_hour = time.localtime().tm_hour
        if current_hour in self.MAINTENANCE_HOURS:
            raise PermissionDenied(
                "Сервис временно недоступен: техническое обслуживание."
            )

    def get(self, request):
        return Response({"data": "всё работает"})


# Если запрос приходит в 02:30:
# HTTP 403 Forbidden
# {"detail": "Сервис временно недоступен: техническое обслуживание."}`,
  },
  {
    name: "rest_framework.views.APIView.initialize_request(request, *args, **kwargs)",
    category: "Views",
    description:
      "Оборачивает стандартный Django-объект HttpRequest в DRF-объект Request, добавляя поддержку парсеров, аутентификаторов и negotiation контента. Вызывается в начале dispatch(). Переопределяется редко — только когда нужно подменить класс Request или добавить к нему дополнительные атрибуты до начала обработки.",
    syntax: "APIView.initialize_request(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Оригинальный Django HttpRequest, полученный от WSGI/ASGI-сервера.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response


class TrackedRequest(Request):
    """Расширенный Request с идентификатором трассировки."""

    def __init__(self, *args, trace_id=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.trace_id = trace_id


class TracedAPIView(APIView):
    """Прикрепляет trace_id к каждому запросу из заголовка X-Trace-ID."""

    def initialize_request(self, request, *args, **kwargs):
        # Получаем стандартный DRF Request
        drf_request = super().initialize_request(request, *args, **kwargs)

        # Подменяем на расширенный класс вручную
        trace_id = request.META.get("HTTP_X_TRACE_ID", "no-trace")
        drf_request.trace_id = trace_id
        return drf_request

    def get(self, request):
        return Response({"trace_id": request.trace_id})

# GET /traced/ с заголовком X-Trace-ID: abc-123
# {"trace_id": "abc-123"}`,
  },
  {
    name: "rest_framework.views.APIView.finalize_response(request, response, *args, **kwargs)",
    category: "Views",
    description:
      "Вызывается из dispatch() после получения ответа от обработчика. Оборачивает не-Response объекты в Response, устанавливает согласованный рендерер (content negotiation), добавляет заголовки Vary и Allow. Переопределяется для добавления глобальных заголовков ответа, постобработки или кастомных метаданных в ответ.",
    syntax: "APIView.finalize_response(request, response, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request текущего запроса.",
      },
      {
        name: "response",
        description: "Объект Response, возвращённый обработчиком.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
import uuid


class HeaderEnrichedView(APIView):
    """Добавляет X-Request-ID и X-API-Version в каждый ответ."""

    API_VERSION = "2.1.0"

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        # Добавляем заголовки после стандартной обработки DRF
        response["X-Request-ID"] = str(uuid.uuid4())
        response["X-API-Version"] = self.API_VERSION
        return response

    def get(self, request):
        return Response({"message": "Привет!"})

# GET /hello/
# HTTP 200 OK
# X-Request-ID: 7f3e1a2b-...
# X-API-Version: 2.1.0
# {"message": "Привет!"}`,
  },
  {
    name: "rest_framework.views.APIView.handle_exception(exc)",
    category: "Views",
    description:
      "Обрабатывает исключения, возникшие в dispatch() или обработчиках. Сначала вызывает exception_handler из настроек EXCEPTION_HANDLER. Если тот возвращает None — исключение пробрасывается дальше. Также обрабатывает AuthenticationFailed и NotAuthenticated, устанавливая WWW-Authenticate заголовки. Переопределяется для добавления кастомной логики обработки ошибок.",
    syntax: "APIView.handle_exception(exc)",
    arguments: [
      {
        name: "exc",
        description: "Экземпляр исключения. Может быть APIException или любым другим Python-исключением.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class LoggingAPIView(APIView):
    """Логирует все ошибки перед отправкой ответа клиенту."""

    def handle_exception(self, exc):
        # Логируем неожиданные (не-DRF) исключения как ERROR
        from rest_framework.exceptions import APIException
        if not isinstance(exc, APIException):
            logger.error("Необработанное исключение: %s", exc, exc_info=True)
        else:
            logger.warning("API исключение: %s — %s", type(exc).__name__, exc.detail)

        # Делегируем стандартной обработке DRF
        return super().handle_exception(exc)

    def get(self, request):
        raise ValidationError("Неверный параметр запроса.")

# GET /log-view/
# Лог: API исключение: ValidationError — Неверный параметр запроса.
# HTTP 400 Bad Request
# {"detail": "Неверный параметр запроса."}`,
  },
  {
    name: "rest_framework.views.APIView.check_permissions(request)",
    category: "Views",
    description:
      "Проверяет, имеет ли текущий пользователь право на выполнение запроса, итерируя по всем классам разрешений из get_permissions(). Вызывается из initial() до передачи запроса обработчику. Если хотя бы одно разрешение возвращает False — выбрасывает PermissionDenied или NotAuthenticated. Переопределяется для изменения логики проверки (например, для OR-комбинации разрешений).",
    syntax: "APIView.check_permissions(request)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request. Используется для доступа к request.user и request.auth.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied


class OrPermissionView(APIView):
    """Пропускает запрос, если выполнено ХОТЯ БЫ ОДНО разрешение (OR-логика)."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def check_permissions(self, request):
        # Стандартный DRF требует ВСЕ разрешения (AND).
        # Переопределяем на OR: достаточно одного.
        for permission in self.get_permissions():
            if permission.has_permission(request, self):
                return  # хотя бы одно сработало — пропускаем
        # Ни одно не сработало — отказываем
        self.permission_denied(
            request,
            message="Требуется аутентификация или права администратора.",
        )

    def get(self, request):
        return Response({"user": str(request.user)})`,
  },
  {
    name: "rest_framework.views.APIView.check_object_permissions(request, obj)",
    category: "Views",
    description:
      "Проверяет разрешения на уровне конкретного объекта, вызывая has_object_permission() у каждого класса разрешений. В отличие от check_permissions(), вызывается вручную из обработчика (обычно в get_object()). При отказе выбрасывает PermissionDenied. Используется для проверки владельца объекта, прав редактирования конкретной записи и т.п.",
    syntax: "APIView.check_object_permissions(request, obj)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request с текущим пользователем.",
      },
      {
        name: "obj",
        description: "Объект модели, для которого проверяются разрешения.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework import status


class IsOwnerPermission(BasePermission):
    """Разрешает изменение только владельцу объекта."""

    def has_object_permission(self, request, view, obj):
        return obj.author == request.user


class ArticleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get_object(self, pk, request):
        from myapp.models import Article
        obj = Article.objects.get(pk=pk)
        # Обязательно вызываем check_object_permissions вручную
        self.check_object_permissions(request, obj)
        return obj

    def delete(self, request, pk):
        article = self.get_object(pk, request)
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# DELETE /articles/5/ от не-владельца:
# HTTP 403 Forbidden`,
  },
  {
    name: "rest_framework.views.APIView.check_throttles(request)",
    category: "Views",
    description:
      "Проверяет ограничения частоты запросов (rate limiting), итерируя по классам из get_throttles(). Вызывается из initial(). Если хотя бы один троттлер блокирует запрос — выбрасывает Throttled с заголовком Retry-After. Переопределяется для реализации кастомной логики троттлинга, например пропуска проверки для определённых IP.",
    syntax: "APIView.check_throttles(request)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request. Используется для идентификации пользователя или IP-адреса.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


WHITELISTED_IPS = {"10.0.0.1", "10.0.0.2"}


class WhitelistAwareView(APIView):
    """Пропускает проверку троттлинга для внутренних IP."""

    throttle_classes = [UserRateThrottle, AnonRateThrottle]

    def check_throttles(self, request):
        client_ip = request.META.get("REMOTE_ADDR")
        if client_ip in WHITELISTED_IPS:
            return  # белый список — без ограничений
        super().check_throttles(request)

    def get(self, request):
        return Response({"message": "запрос принят"})

# settings.py
# REST_FRAMEWORK = {
#     "DEFAULT_THROTTLE_RATES": {
#         "user": "100/day",
#         "anon": "10/hour",
#     }
# }`,
  },
  {
    name: "rest_framework.views.APIView.determine_version(request, *args, **kwargs)",
    category: "Views",
    description:
      "Определяет версию API для текущего запроса с помощью схемы версионирования, заданной в DEFAULT_VERSIONING_CLASS или атрибуте versioning_class. Вызывается из initial(). Результат сохраняется в request.version и request.versioning_scheme. Переопределяется для реализации нестандартной логики определения версии.",
    syntax: "APIView.determine_version(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.versioning import AcceptHeaderVersioning, URLPathVersioning


# Вариант 1: версионирование через URL-путь
class ProductViewV1(APIView):
    versioning_class = URLPathVersioning

    def get(self, request, version):
        # request.version автоматически установлен из URL
        if request.version == "v1":
            return Response({"format": "legacy", "items": []})
        return Response({"format": "new", "results": []})

# urls.py:
# path("api/<version>/products/", ProductViewV1.as_view())
# GET /api/v1/products/ → {"format": "legacy", "items": []}


# Вариант 2: переопределение для нестандартной логики
class CustomVersionView(APIView):
    def determine_version(self, request, *args, **kwargs):
        # Версия из кастомного заголовка X-Client-Version
        version = request.META.get("HTTP_X_CLIENT_VERSION", "1")
        return version, self.versioning_class

    def get(self, request):
        return Response({"version": request.version})`,
  },
  {
    name: "rest_framework.views.APIView.get_authenticators()",
    category: "Views",
    description:
      "Возвращает список экземпляров классов аутентификации, которые будут использованы для данного запроса. По умолчанию создаёт экземпляры из authentication_classes или DEFAULT_AUTHENTICATION_CLASSES из настроек. Переопределяется для динамического выбора аутентификаторов — например, разных схем для разных HTTP-методов.",
    syntax: "APIView.get_authenticators()",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import (
    SessionAuthentication,
    BasicAuthentication,
    TokenAuthentication,
)


class DynamicAuthView(APIView):
    """
    GET  — доступен анонимно (без аутентификации).
    POST — требует Token-аутентификацию.
    """

    def get_authenticators(self):
        if self.request and self.request.method == "POST":
            return [TokenAuthentication()]
        # Для GET и других методов — сессионная аутентификация
        return [SessionAuthentication(), BasicAuthentication()]

    def get(self, request):
        user = request.user if request.user.is_authenticated else "аноним"
        return Response({"user": str(user)})

    def post(self, request):
        return Response({"created_by": str(request.user)})

# GET /dynamic/   → доступно всем
# POST /dynamic/  → требует заголовок Authorization: Token <token>`,
  },
  {
    name: "rest_framework.views.APIView.get_permissions()",
    category: "Views",
    description:
      "Возвращает список экземпляров классов разрешений для текущего запроса. По умолчанию создаёт экземпляры из permission_classes или DEFAULT_PERMISSION_CLASSES. Переопределяется для динамического назначения разрешений — например, разных наборов для разных HTTP-методов или условий запроса.",
    syntax: "APIView.get_permissions()",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticated,
    IsAdminUser,
    AllowAny,
)


class ArticleView(APIView):
    """
    GET  — доступен всем.
    POST — только аутентифицированным пользователям.
    DELETE — только администраторам.
    """

    def get_permissions(self):
        method = self.request.method if self.request else "GET"
        if method == "DELETE":
            return [IsAdminUser()]
        if method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        return Response({"articles": []})

    def post(self, request):
        return Response({"created": True}, status=201)

    def delete(self, request):
        return Response(status=204)`,
  },
  {
    name: "rest_framework.views.APIView.get_throttles()",
    category: "Views",
    description:
      "Возвращает список экземпляров классов троттлинга для текущего запроса. По умолчанию создаёт экземпляры из throttle_classes или DEFAULT_THROTTLE_CLASSES. Переопределяется для применения разных ограничений в зависимости от метода, пользователя или эндпоинта.",
    syntax: "APIView.get_throttles()",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class BurstThrottle(UserRateThrottle):
    scope = "burst"   # "burst": "60/min" в настройках

class SustainedThrottle(UserRateThrottle):
    scope = "sustained"  # "sustained": "1000/day" в настройках


class SmartThrottledView(APIView):
    """
    Для записи (POST/PUT/DELETE) — жёсткий троттлинг.
    Для чтения (GET)             — мягкий троттлинг.
    """

    def get_throttles(self):
        if self.request and self.request.method in ("POST", "PUT", "DELETE"):
            return [BurstThrottle()]
        return [SustainedThrottle(), AnonRateThrottle()]

    def get(self, request):
        return Response({"data": []})

    def post(self, request):
        return Response({"created": True}, status=201)

# settings.py
# REST_FRAMEWORK = {
#     "DEFAULT_THROTTLE_RATES": {
#         "burst": "60/min",
#         "sustained": "1000/day",
#         "anon": "20/hour",
#     }
# }`,
  },
  {
    name: "rest_framework.views.APIView.get_renderers()",
    category: "Views",
    description:
      "Возвращает список экземпляров рендереров для формирования тела ответа. По умолчанию создаёт экземпляры из renderer_classes или DEFAULT_RENDERER_CLASSES. Рендерер выбирается по заголовку Accept запроса (content negotiation). Переопределяется для динамического выбора форматов ответа.",
    syntax: "APIView.get_renderers()",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import (
    JSONRenderer,
    BrowsableAPIRenderer,
    StaticHTMLRenderer,
)


class AdaptiveRendererView(APIView):
    """
    /data/      → JSON и Browsable API (для разработки).
    /data.html  → только HTML-рендерер.
    """

    def get_renderers(self):
        # Если запрошен HTML — отдаём только StaticHTMLRenderer
        if self.request and "text/html" in self.request.accepted_media_type:
            return [StaticHTMLRenderer()]
        # Иначе — стандартный набор
        return [JSONRenderer(), BrowsableAPIRenderer()]

    def get(self, request):
        if isinstance(self.get_renderers()[0], StaticHTMLRenderer):
            return Response("<h1>Список данных</h1>")
        return Response({"items": [1, 2, 3]})

# GET /data/        Accept: application/json  → {"items": [1, 2, 3]}
# GET /data/        Accept: text/html         → <h1>Список данных</h1>`,
  },
  {
    name: "rest_framework.views.APIView.get_parsers()",
    category: "Views",
    description:
      "Возвращает список экземпляров парсеров, которые будут использованы для разбора тела входящего запроса. По умолчанию создаёт экземпляры из parser_classes или DEFAULT_PARSER_CLASSES из настроек DRF. Парсер выбирается по заголовку Content-Type запроса. Переопределяется для динамического назначения парсеров — например, разных форматов для разных методов.",
    syntax: "APIView.get_parsers()",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import (
    JSONParser,
    MultiPartParser,
    FormParser,
)


class FlexibleUploadView(APIView):
    """
    POST с JSON-телом   → JSONParser.
    POST с файлом       → MultiPartParser + FormParser.
    """

    def get_parsers(self):
        content_type = ""
        if self.request:
            content_type = self.request.content_type or ""

        if "multipart" in content_type:
            return [MultiPartParser(), FormParser()]
        return [JSONParser()]

    def post(self, request):
        if request.FILES:
            file = request.FILES.get("file")
            return Response({"filename": file.name, "size": file.size})
        return Response({"received": request.data})

# POST /upload/  Content-Type: application/json
#   body: {"title": "test"}
#   → {"received": {"title": "test"}}

# POST /upload/  Content-Type: multipart/form-data
#   body: file=report.pdf
#   → {"filename": "report.pdf", "size": 204800}`,
  },
  {
    name: "rest_framework.views.APIView.get_content_negotiator()",
    category: "Views",
    description:
      "Возвращает экземпляр класса согласования контента (content negotiator), который определяет, какой рендерер и тип медиа использовать для ответа на основе заголовка Accept запроса. По умолчанию создаёт экземпляр из content_negotiation_class или DEFAULT_CONTENT_NEGOTIATION_CLASS. Переопределяется для подстановки кастомной логики выбора формата ответа.",
    syntax: "APIView.get_content_negotiator()",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.exceptions import NotAcceptable


class StrictNegotiator(DefaultContentNegotiation):
    """Запрещает Browsable API в production-окружении."""

    def select_renderer(self, request, renderers, format_suffix=None):
        import os
        if os.environ.get("DJANGO_ENV") == "production":
            # В проде разрешаем только JSON
            renderers = [r for r in renderers if isinstance(r, JSONRenderer)]
            if not renderers:
                raise NotAcceptable()
        return super().select_renderer(request, renderers, format_suffix)


class ProductionSafeView(APIView):
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get_content_negotiator(self):
        return StrictNegotiator()

    def get(self, request):
        return Response({"env": "production"})

# В production: Accept: text/html → HTTP 406 Not Acceptable
# В production: Accept: application/json → {"env": "production"}`,
  },
  {
    name: "rest_framework.views.APIView.get_exception_handler()",
    category: "Views",
    description:
      "Возвращает функцию-обработчик исключений, используемую в handle_exception(). По умолчанию возвращает rest_framework.views.exception_handler из настройки EXCEPTION_HANDLER. Переопределяется для подстановки кастомного обработчика ошибок на уровне конкретного представления, не меняя глобальные настройки.",
    syntax: "APIView.get_exception_handler()",
    arguments: [],
    example: `from rest_framework.views import APIView, exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import APIException


def verbose_exception_handler(exc, context):
    """Добавляет имя класса исключения и view в тело ответа."""
    response = exception_handler(exc, context)
    if response is not None:
        view = context.get("view")
        response.data["exception_type"] = type(exc).__name__
        response.data["view"] = type(view).__name__ if view else None
    return response


class DetailedErrorView(APIView):
    """Использует расширенный обработчик только для этого представления."""

    def get_exception_handler(self):
        return verbose_exception_handler

    def get(self, request):
        raise APIException("Что-то пошло не так.")

# GET /detailed/
# HTTP 500
# {
#   "detail": "Что-то пошло не так.",
#   "exception_type": "APIException",
#   "view": "DetailedErrorView"
# }`,
  },
  {
    name: "rest_framework.views.APIView.get_format_suffix(**kwargs)",
    category: "Views",
    description:
      "Извлекает суффикс формата из аргументов URL (например, .json, .xml в /api/items.json). Используется совместно с format_kwarg и DRF-роутерами, добавляющими формат как часть URL. Возвращает строку суффикса или None, если суффикс не указан. Переопределяется редко — для нестандартного способа передачи формата.",
    syntax: "APIView.get_format_suffix(**kwargs)",
    arguments: [
      {
        name: "**kwargs",
        description: "Именованные аргументы URL-маршрута. DRF ищет в них ключ format_kwarg (по умолчанию 'format').",
      },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.urlpatterns import format_suffix_patterns
from django.urls import path


class ItemListView(APIView):
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get(self, request, format=None):
        items = [{"id": 1, "name": "Товар A"}, {"id": 2, "name": "Товар B"}]
        # format автоматически заполняется из суффикса URL
        return Response({
            "format": format or "auto",
            "items": items,
        })


# urls.py
urlpatterns = [
    path("items/", ItemListView.as_view()),
]
# format_suffix_patterns добавляет маршруты с суффиксами
urlpatterns = format_suffix_patterns(urlpatterns)

# GET /items/       Accept: application/json → format=None  (auto-negotiate)
# GET /items.json                            → format="json"
# GET /items.api                             → format="api"  (BrowsableAPI)`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.get_queryset()",
    category: "Generics",
    description:
      "Возвращает QuerySet, используемый для получения списка объектов или одного объекта в Generic-представлениях. По умолчанию возвращает self.queryset. Переопределяется для динамической фильтрации по текущему пользователю, параметрам URL, query-параметрам или любой другой контекстно-зависимой логике. Вызывается внутри get_object() и list-обработчиков.",
    syntax: "GenericAPIView.get_queryset()",
    arguments: [],
    example: `from rest_framework import generics, permissions
from rest_framework.exceptions import ParseError
from myapp.models import Article
from myapp.serializers import ArticleSerializer


class MyArticleListView(generics.ListCreateAPIView):
    """Пользователь видит только свои статьи."""
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Фильтруем по владельцу
        qs = Article.objects.filter(author=self.request.user)

        # Дополнительная фильтрация по query-параметру
        status = self.request.query_params.get("status")
        if status:
            if status not in ("draft", "published"):
                raise ParseError("status должен быть draft или published")
            qs = qs.filter(status=status)

        return qs.select_related("author").order_by("-created_at")

# GET /my-articles/             → все статьи текущего пользователя
# GET /my-articles/?status=draft → только черновики`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.get_object()",
    category: "Generics",
    description:
      "Возвращает единственный объект модели для detail-представлений (retrieve, update, destroy). Получает queryset через get_queryset(), фильтрует по lookup_field (по умолчанию 'pk') из URL, затем вызывает check_object_permissions() для проверки прав доступа к конкретному объекту. При отсутствии объекта выбрасывает Http404.",
    syntax: "GenericAPIView.get_object()",
    arguments: [],
    example: `from rest_framework import generics, permissions
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from myapp.permissions import IsOwnerOrReadOnly


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.select_related("author")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    lookup_field = "slug"  # вместо pk ищем по slug

    # get_object() вызывается автоматически — переопределяем для доп. логики
    def get_object(self):
        obj = super().get_object()
        # Увеличиваем счётчик просмотров при каждом GET
        if self.request.method == "GET":
            Article.objects.filter(pk=obj.pk).update(
                views_count=obj.views_count + 1
            )
        return obj

# GET /articles/django-tips/    → статья со slug="django-tips"
# PATCH /articles/django-tips/  → обновление (только для автора)
# DELETE /articles/django-tips/ → удаление (только для автора)`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.get_serializer(*args, **kwargs)",
    category: "Generics",
    description:
      "Создаёт и возвращает экземпляр сериализатора. Вызывает get_serializer_class() для определения класса и get_serializer_context() для получения контекста. Передаёт аргументы и контекст в конструктор сериализатора. Используется внутри обработчиков create/list/retrieve/update. Переопределяется для передачи дополнительных аргументов в сериализатор.",
    syntax: "GenericAPIView.get_serializer(*args, **kwargs)",
    arguments: [
      {
        name: "*args",
        description: "Позиционные аргументы для конструктора сериализатора (обычно instance или data).",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы, например many=True, partial=True.",
      },
    ],
    example: `from rest_framework import generics
from myapp.models import Order
from myapp.serializers import OrderSerializer, OrderAdminSerializer


class OrderDetailView(generics.RetrieveUpdateAPIView):
    queryset = Order.objects.all()
    permission_classes = []

    def get_serializer(self, *args, **kwargs):
        # Администраторы получают расширенный сериализатор
        if self.request.user.is_staff:
            kwargs["context"] = self.get_serializer_context()
            return OrderAdminSerializer(*args, **kwargs)

        # Обычные пользователи — частичное обновление по умолчанию
        if self.request.method in ("PUT", "PATCH"):
            kwargs.setdefault("partial", True)

        return super().get_serializer(*args, **kwargs)

    def get_serializer_class(self):
        return OrderSerializer`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.get_serializer_class()",
    category: "Generics",
    description:
      "Определяет и возвращает класс сериализатора для текущего запроса. По умолчанию возвращает self.serializer_class. Переопределяется для динамического выбора класса сериализатора в зависимости от HTTP-метода, роли пользователя, версии API или других условий.",
    syntax: "GenericAPIView.get_serializer_class()",
    arguments: [],
    example: `from rest_framework import generics, permissions
from myapp.models import UserProfile
from myapp.serializers import (
    UserProfileReadSerializer,
    UserProfileWriteSerializer,
    UserProfileAdminSerializer,
)


class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = UserProfile.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Администратору — полный сериализатор
        if self.request.user.is_staff:
            return UserProfileAdminSerializer

        # Чтение — компактный сериализатор
        if self.request.method in ("GET", "HEAD"):
            return UserProfileReadSerializer

        # Запись — сериализатор с валидацией
        return UserProfileWriteSerializer

# GET  /profile/1/  (обычный пользователь) → UserProfileReadSerializer
# PATCH /profile/1/ (обычный пользователь) → UserProfileWriteSerializer
# GET  /profile/1/  (admin)                → UserProfileAdminSerializer`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.get_serializer_context()",
    category: "Generics",
    description:
      "Возвращает словарь с контекстом, передаваемым в каждый экземпляр сериализатора. По умолчанию содержит три ключа: 'request' (текущий DRF-запрос), 'format' (суффикс формата), 'view' (текущее представление). Переопределяется для добавления дополнительных данных, доступных сериализатору через self.context.",
    syntax: "GenericAPIView.get_serializer_context()",
    arguments: [],
    example: `from rest_framework import generics
from myapp.models import Product
from myapp.serializers import ProductSerializer


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Добавляем флаг и данные пользователя в контекст
        context["show_wholesale_price"] = (
            self.request.user.is_authenticated
            and self.request.user.groups.filter(name="wholesaler").exists()
        )
        context["currency"] = self.request.query_params.get("currency", "RUB")
        return context


# serializers.py
class ProductSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    def get_price(self, obj):
        ctx = self.context
        if ctx.get("show_wholesale_price"):
            price = obj.wholesale_price
        else:
            price = obj.retail_price
        currency = ctx.get("currency", "RUB")
        return f"{price} {currency}"`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.filter_queryset(queryset)",
    category: "Generics",
    description:
      "Применяет все бэкенды фильтрации из filter_backends к переданному queryset и возвращает отфильтрованный результат. Вызывается в обработчиках list-представлений перед возвратом данных. Каждый бэкенд вызывается последовательно. Переопределяется для добавления кастомной логики фильтрации помимо стандартных бэкендов.",
    syntax: "GenericAPIView.filter_queryset(queryset)",
    arguments: [
      {
        name: "queryset",
        description: "QuerySet, к которому применяются фильтры. Обычно результат get_queryset().",
      },
    ],
    example: `from rest_framework import generics
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from myapp.models import Product
from myapp.serializers import ProductSerializer


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.select_related("category")
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "in_stock"]
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at"]
    ordering = ["-created_at"]

    def filter_queryset(self, queryset):
        # Сначала применяем стандартные бэкенды DRF
        queryset = super().filter_queryset(queryset)

        # Затем добавляем собственную логику
        min_price = self.request.query_params.get("min_price")
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        return queryset

# GET /products/?category=1&search=кофе&ordering=price&min_price=500`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.paginate_queryset(queryset)",
    category: "Generics",
    description:
      "Применяет пагинатор из pagination_class к queryset и возвращает страницу объектов (list) или None, если пагинация не настроена. Вызывается в list-обработчиках. Если вернул не None — результат следует обернуть в get_paginated_response(). Переопределяется для условного отключения пагинации или применения разных размеров страниц.",
    syntax: "GenericAPIView.paginate_queryset(queryset)",
    arguments: [
      {
        name: "queryset",
        description: "Отфильтрованный QuerySet или список объектов для разбивки на страницы.",
      },
    ],
    example: `from rest_framework import generics
from rest_framework.response import Response
from myapp.models import LogEntry
from myapp.serializers import LogEntrySerializer


class LogListView(generics.ListAPIView):
    """Пагинация включается только при наличии параметра ?page."""
    queryset = LogEntry.objects.order_by("-timestamp")
    serializer_class = LogEntrySerializer

    def paginate_queryset(self, queryset):
        # Без параметра page — возвращаем всё без пагинации
        if "page" not in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# GET /logs/         → все записи без пагинации
# GET /logs/?page=2  → вторая страница (pagination_class из настроек)`,
  },
  {
    name: "rest_framework.generics.GenericAPIView.get_paginated_response(data)",
    category: "Generics",
    description:
      "Возвращает объект Response с пагинированными данными, оборачивая список объектов в конверт пагинатора (с полями count, next, previous и results). Вызывается в list-обработчиках после paginate_queryset(). Делегирует формирование ответа методу get_paginated_response() текущего пагинатора.",
    syntax: "GenericAPIView.get_paginated_response(data)",
    arguments: [
      {
        name: "data",
        description: "Сериализованные данные одной страницы (обычно serializer.data).",
      },
    ],
    example: `from rest_framework import generics
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer


class ArticleListView(generics.ListAPIView):
    queryset = Article.objects.order_by("-published_at")
    serializer_class = ArticleSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # get_paginated_response оборачивает данные в конверт пагинатора
            return self.get_paginated_response(serializer.data)

        # Пагинация не настроена — простой список
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# GET /articles/?page=1
# {
#   "count": 42,
#   "next": "http://api.example.com/articles/?page=2",
#   "previous": null,
#   "results": [ {...}, {...}, ... ]
# }`,
  },
  {
    name: "rest_framework.mixins.CreateModelMixin.create(request, *args, **kwargs)",
    category: "Mixins",
    description:
      "Обрабатывает POST-запрос для создания нового объекта модели. Получает данные из запроса, передаёт их в сериализатор, вызывает is_valid() (при ошибке — ValidationError), затем perform_create() для сохранения. Возвращает HTTP 201 Created с сериализованным объектом и заголовком Location. Переопределяется для изменения кода ответа, заголовков или данных.",
    syntax: "CreateModelMixin.create(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request с данными нового объекта в request.data.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework import generics, mixins, status
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer


class ArticleCreateView(generics.CreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def create(self, request, *args, **kwargs):
        # Вызываем стандартный create, но меняем тело ответа
        response = super().create(request, *args, **kwargs)
        return Response(
            {
                "message": "Статья успешно создана.",
                "article": response.data,
            },
            status=status.HTTP_201_CREATED,
            headers=response.headers,
        )

# POST /articles/
# body: {"title": "Новая статья", "body": "Текст..."}
# HTTP 201 Created
# {
#   "message": "Статья успешно создана.",
#   "article": {"id": 5, "title": "Новая статья", ...}
# }`,
  },
  {
    name: "rest_framework.mixins.CreateModelMixin.perform_create(serializer)",
    category: "Mixins",
    description:
      "Вызывается из create() для фактического сохранения объекта. По умолчанию просто вызывает serializer.save(). Переопределяется для автоматической установки полей при создании — например, привязки автора к текущему пользователю, добавления временных меток или отправки уведомлений после сохранения.",
    syntax: "CreateModelMixin.perform_create(serializer)",
    arguments: [
      {
        name: "serializer",
        description: "Экземпляр сериализатора, прошедший валидацию (is_valid() вернул True).",
      },
    ],
    example: `from rest_framework import generics, permissions
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from myapp.tasks import send_new_article_notification


class ArticleCreateView(generics.CreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Автоматически устанавливаем автора и IP
        article = serializer.save(
            author=self.request.user,
            created_from_ip=self.request.META.get("REMOTE_ADDR"),
        )
        # Отправляем уведомление подписчикам
        send_new_article_notification.delay(article.pk)

# POST /articles/
# author и created_from_ip устанавливаются автоматически,
# клиент их не передаёт`,
  },
  {
    name: "rest_framework.mixins.CreateModelMixin.get_success_headers(data)",
    category: "Mixins",
    description:
      "Возвращает словарь заголовков для ответа HTTP 201, сформированного в create(). По умолчанию добавляет заголовок Location со значением из поля url сериализованных данных (если оно есть). Переопределяется для установки кастомных заголовков ответа при успешном создании объекта.",
    syntax: "CreateModelMixin.get_success_headers(data)",
    arguments: [
      {
        name: "data",
        description: "Сериализованные данные созданного объекта (serializer.data).",
      },
    ],
    example: `from rest_framework import generics
from myapp.models import Article
from myapp.serializers import ArticleSerializer


class ArticleCreateView(generics.CreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def get_success_headers(self, data):
        # Стандартный Location из поля url
        headers = super().get_success_headers(data)

        # Добавляем кастомный заголовок с ID нового объекта
        if "id" in data:
            headers["X-Created-ID"] = str(data["id"])

        # Добавляем ссылку на связанный ресурс
        if "author_url" in data:
            headers["X-Author-URL"] = data["author_url"]

        return headers

# POST /articles/
# HTTP 201 Created
# Location: http://api.example.com/articles/7/
# X-Created-ID: 7`,
  },
  {
    name: "rest_framework.mixins.ListModelMixin.list(request, *args, **kwargs)",
    category: "Mixins",
    description:
      "Обрабатывает GET-запрос для получения списка объектов. Последовательно вызывает get_queryset(), filter_queryset(), paginate_queryset(). При наличии пагинации возвращает get_paginated_response(), иначе — простой Response со списком. Переопределяется для кастомизации структуры ответа, добавления метаданных или условной логики.",
    syntax: "ListModelMixin.list(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework import generics
from rest_framework.response import Response
from myapp.models import Product
from myapp.serializers import ProductSerializer


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    def list(self, request, *args, **kwargs):
        # Вызываем стандартный list для получения ответа
        response = super().list(request, *args, **kwargs)

        # Оборачиваем данные в конверт с метаданными
        return Response({
            "meta": {
                "currency": "RUB",
                "vat_included": True,
            },
            "data": response.data,
        })

# GET /products/
# {
#   "meta": {"currency": "RUB", "vat_included": true},
#   "data": [{"id": 1, "name": "Кофе"}, ...]
# }`,
  },
  {
    name: "rest_framework.mixins.RetrieveModelMixin.retrieve(request, *args, **kwargs)",
    category: "Mixins",
    description:
      "Обрабатывает GET-запрос для получения одного объекта по идентификатору. Вызывает get_object() (который выполняет поиск, проверку разрешений и Http404), затем сериализует объект и возвращает HTTP 200. Переопределяется для добавления дополнительных данных в ответ или изменения структуры.",
    syntax: "RetrieveModelMixin.retrieve(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута (обычно содержит pk или другой lookup_field).",
      },
    ],
    example: `from rest_framework import generics
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer, RelatedArticleSerializer


class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.prefetch_related("tags")
    serializer_class = ArticleSerializer

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)

        # Добавляем похожие статьи к ответу
        instance = self.get_object()
        related = Article.objects.filter(
            tags__in=instance.tags.all()
        ).exclude(pk=instance.pk).distinct()[:3]

        response.data["related"] = RelatedArticleSerializer(
            related, many=True, context=self.get_serializer_context()
        ).data
        return response`,
  },
  {
    name: "rest_framework.mixins.UpdateModelMixin.update(request, *args, **kwargs)",
    category: "Mixins",
    description:
      "Обрабатывает PUT и PATCH запросы для обновления существующего объекта. Получает объект через get_object(), передаёт данные в сериализатор с partial=True для PATCH, вызывает is_valid() и perform_update(). Возвращает HTTP 200 с обновлёнными данными. Переопределяется для добавления логики до или после обновления.",
    syntax: "UpdateModelMixin.update(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request с новыми данными объекта в request.data.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework import generics, permissions
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from myapp.permissions import IsOwner


class ArticleUpdateView(generics.UpdateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def update(self, request, *args, **kwargs):
        # Запрещаем смену автора через API
        request.data.pop("author", None)

        response = super().update(request, *args, **kwargs)

        # Добавляем поле в ответ
        response.data["updated_by"] = request.user.username
        return response

# PUT  /articles/3/  → полное обновление (все поля обязательны)
# PATCH /articles/3/ → частичное обновление (только изменяемые поля)`,
  },
  {
    name: "rest_framework.mixins.UpdateModelMixin.partial_update(request, *args, **kwargs)",
    category: "Mixins",
    description:
      "Обрабатывает PATCH-запрос для частичного обновления объекта. Делегирует в update() с аргументом partial=True, что позволяет сериализатору принимать неполный набор полей без ошибок валидации. Переопределяется редко — обычно достаточно настройки сериализатора или переопределения update().",
    syntax: "UpdateModelMixin.partial_update(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request с частичными данными в request.data.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework import generics, permissions
from myapp.models import UserProfile
from myapp.serializers import UserProfileSerializer


class ProfileUpdateView(generics.UpdateAPIView):
    """
    PATCH /profile/me/ — изменение только переданных полей профиля.
    PUT  /profile/me/ — полная замена (все поля обязательны).
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Возвращаем профиль текущего пользователя
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        self.check_object_permissions(self.request, profile)
        return profile

# PATCH /profile/me/
# body: {"bio": "Python-разработчик"}
# → обновляет только поле bio, остальные не трогает

# PUT /profile/me/
# body: {"bio": "...", "avatar": "...", "location": "..."}  # все поля обязательны`,
  },
  {
    name: "rest_framework.mixins.UpdateModelMixin.perform_update(serializer)",
    category: "Mixins",
    description:
      "Вызывается из update() для фактического сохранения изменений. По умолчанию вызывает serializer.save(). Переопределяется для передачи дополнительных полей при сохранении (например, кто и когда обновил объект), отправки уведомлений или инвалидации кэша после обновления.",
    syntax: "UpdateModelMixin.perform_update(serializer)",
    arguments: [
      {
        name: "serializer",
        description: "Экземпляр сериализатора, прошедший валидацию с данными обновления.",
      },
    ],
    example: `from rest_framework import generics, permissions
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from myapp.cache import invalidate_article_cache
from myapp.tasks import notify_subscribers_on_update


class ArticleUpdateView(generics.UpdateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        # Сохраняем объект, фиксируя кто и когда обновил
        from django.utils import timezone
        article = serializer.save(
            updated_by=self.request.user,
            updated_at=timezone.now(),
        )
        # Инвалидируем кэш
        invalidate_article_cache(article.pk)
        # Уведомляем подписчиков, если статья опубликована
        if article.status == "published":
            notify_subscribers_on_update.delay(article.pk)`,
  },
  {
    name: "rest_framework.mixins.DestroyModelMixin.destroy(request, *args, **kwargs)",
    category: "Mixins",
    description:
      "Обрабатывает DELETE-запрос для удаления объекта. Получает объект через get_object() (с проверкой разрешений), вызывает perform_destroy() и возвращает HTTP 204 No Content. Переопределяется для изменения кода ответа, добавления тела ответа или логики soft-delete.",
    syntax: "DestroyModelMixin.destroy(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "DRF-объект Request.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута (обычно pk объекта).",
      },
    ],
    example: `from rest_framework import generics, permissions, status
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from myapp.permissions import IsOwner


class ArticleDestroyView(generics.DestroyAPIView):
    queryset = Article.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        title = instance.title  # сохраняем до удаления

        self.perform_destroy(instance)

        # Возвращаем 200 с подтверждением вместо стандартного 204
        return Response(
            {"message": f"Статья «{title}» удалена."},
            status=status.HTTP_200_OK,
        )

# DELETE /articles/3/
# HTTP 200 OK
# {"message": "Статья «Django советы» удалена."}`,
  },
  {
    name: "rest_framework.mixins.DestroyModelMixin.perform_destroy(instance)",
    category: "Mixins",
    description:
      "Вызывается из destroy() для фактического удаления объекта. По умолчанию вызывает instance.delete(). Переопределяется для реализации мягкого удаления (soft delete) — установки флага is_deleted вместо реального удаления из БД, а также для отправки уведомлений или очистки связанных данных.",
    syntax: "DestroyModelMixin.perform_destroy(instance)",
    arguments: [
      {
        name: "instance",
        description: "Экземпляр модели, который нужно удалить.",
      },
    ],
    example: `from rest_framework import generics, permissions
from django.utils import timezone
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from myapp.permissions import IsOwner
from myapp.tasks import cleanup_article_files


class ArticleDestroyView(generics.DestroyAPIView):
    queryset = Article.objects.filter(is_deleted=False)
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_destroy(self, instance):
        # Soft delete — помечаем удалённым, не удаляем из БД
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.deleted_by = self.request.user
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

        # Асинхронно очищаем связанные файлы
        cleanup_article_files.delay(instance.pk)

# DELETE /articles/3/
# HTTP 204 No Content
# Статья остаётся в БД с is_deleted=True`,
  },
  {
    name: "rest_framework.viewsets.ViewSetMixin.as_view(actions=None, **initkwargs)",
    category: "ViewSets",
    description:
      "Классовый метод, создающий view-функцию из ViewSet с привязкой HTTP-методов к действиям. В отличие от APIView.as_view(), требует явного указания словаря actions, который сопоставляет методы (get, post, put…) с действиями ViewSet (list, create, retrieve…). Обычно вызывается не напрямую, а через роутеры DRF.",
    syntax: "ViewSetMixin.as_view(actions=None, **initkwargs)",
    arguments: [
      {
        name: "actions",
        description: "Словарь вида {HTTP-метод: имя_действия}, например {'get': 'list', 'post': 'create'}.",
      },
      {
        name: "**initkwargs",
        description: "Дополнительные атрибуты, устанавливаемые на экземпляр ViewSet (например, suffix='List').",
      },
    ],
    example: `from rest_framework import viewsets
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer
from django.urls import path


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer


# urls.py — ручная привязка методов без роутера
urlpatterns = [
    path(
        "articles/",
        ArticleViewSet.as_view({"get": "list", "post": "create"}),
        name="article-list",
    ),
    path(
        "articles/<int:pk>/",
        ArticleViewSet.as_view({
            "get":    "retrieve",
            "put":    "update",
            "patch":  "partial_update",
            "delete": "destroy",
        }),
        name="article-detail",
    ),
]

# GET  /articles/       → list
# POST /articles/       → create
# GET  /articles/1/     → retrieve
# PATCH /articles/1/    → partial_update`,
  },
  {
    name: "rest_framework.viewsets.ViewSetMixin.initialize_request(request, *args, **kwargs)",
    category: "ViewSets",
    description:
      "Переопределяет initialize_request() из APIView, добавляя к DRF-объекту Request атрибут parsers_classes через контекст ViewSet. Обеспечивает корректную работу парсеров в контексте ViewSet-действий. Редко переопределяется напрямую — используется DRF внутренне при инициализации каждого запроса.",
    syntax: "ViewSetMixin.initialize_request(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Оригинальный Django HttpRequest.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы URL-маршрута.",
      },
    ],
    example: `from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser
import logging

logger = logging.getLogger(__name__)


class FileUploadViewSet(viewsets.ViewSet):
    """ViewSet с логированием инициализации запросов."""

    def initialize_request(self, request, *args, **kwargs):
        drf_request = super().initialize_request(request, *args, **kwargs)
        logger.debug(
            "ViewSet запрос инициализирован: %s %s, action=%s",
            request.method,
            request.path,
            self.action if hasattr(self, "action") else "unknown",
        )
        return drf_request

    def list(self, request):
        return Response({"files": []})

    def create(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "файл не передан"}, status=400)
        return Response({"name": file.name, "size": file.size}, status=201)`,
  },
  {
    name: "rest_framework.viewsets.ViewSetMixin.reverse_action(url_name, *args, **kwargs)",
    category: "ViewSets",
    description:
      "Генерирует абсолютный URL для именованного действия текущего ViewSet. Использует DRF-функцию reverse() с учётом текущего запроса (для формирования абсолютного URL). Удобен для создания гиперссылок в представлениях, связанных сериализаторах и при формировании HATEOAS-ответов.",
    syntax: "ViewSetMixin.reverse_action(url_name, *args, **kwargs)",
    arguments: [
      {
        name: "url_name",
        description: "Имя URL-маршрута действия (без префикса basename). Например, 'detail' для action retrieve.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы для reverse(): args для позиционных, kwargs для именованных (например, kwargs={'pk': 1}).",
      },
    ],
    example: `from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def list(self, request, *args, **kwargs):
        articles = self.get_queryset()
        data = []
        for article in articles:
            # Генерируем абсолютный URL для каждой статьи
            detail_url = self.reverse_action("detail", kwargs={"pk": article.pk})
            data.append({"id": article.pk, "title": article.title, "url": detail_url})
        return Response(data)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        # Ссылка на этот же endpoint
        self_url = self.reverse_action("featured")
        return Response({"url": self_url, "items": []})

# GET /articles/ → [{"id": 1, "title": "...", "url": "http://api/articles/1/"}]`,
  },
  {
    name: "rest_framework.viewsets.ViewSetMixin.get_extra_action_url_map()",
    category: "ViewSets",
    description:
      "Возвращает OrderedDict с URL-картой дополнительных действий (добавленных через декоратор @action). Ключи — имена действий, значения — абсолютные URL. Используется Browsable API для отображения доступных дополнительных эндпоинтов. Полезен при формировании навигации и мета-информации об API.",
    syntax: "ViewSetMixin.get_extra_action_url_map()",
    arguments: [],
    example: `from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from myapp.models import Article
from myapp.serializers import ArticleSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    @action(detail=False, methods=["get"], url_path="featured")
    def featured(self, request):
        """Рекомендуемые статьи."""
        return Response({"items": []})

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        """Публикация статьи."""
        article = self.get_object()
        article.status = "published"
        article.save()
        return Response({"status": "опубликована"})

    def list(self, request, *args, **kwargs):
        # Включаем карту доп. действий в ответ списка
        url_map = self.get_extra_action_url_map()
        response = super().list(request, *args, **kwargs)
        response.data["_actions"] = url_map
        return response

# GET /articles/ →  {"_actions": {"featured": "http://api/articles/featured/"}, ...}`,
  },
  {
    name: "rest_framework.request.Request.__init__(request, parsers, authenticators, negotiator, parser_context)",
    category: "Request",
    description:
      "Конструктор DRF-объекта Request — обёртки над стандартным Django HttpRequest. Принимает оригинальный запрос и компоненты DRF: парсеры, аутентификаторы, negotiator. Создаётся автоматически в APIView.initialize_request(). Прямое создание вручную нужно только в тестах или при кастомной обработке запросов.",
    syntax: "Request(request, parsers=None, authenticators=None, negotiator=None, parser_context=None)",
    arguments: [
      {
        name: "request",
        description: "Оригинальный Django HttpRequest.",
      },
      {
        name: "parsers",
        description: "Список экземпляров парсеров для разбора тела запроса. None — используются парсеры по умолчанию.",
      },
      {
        name: "authenticators",
        description: "Список экземпляров аутентификаторов. None — используются аутентификаторы по умолчанию.",
      },
      {
        name: "negotiator",
        description: "Экземпляр negotiator для согласования контента.",
      },
      {
        name: "parser_context",
        description: "Словарь с дополнительным контекстом для парсеров (view, args, kwargs).",
      },
    ],
    example: `from rest_framework.request import Request
from rest_framework.parsers import JSONParser
from rest_framework.authentication import TokenAuthentication
from rest_framework.test import APIRequestFactory


factory = APIRequestFactory()

# Создаём тестовый запрос вручную
raw_request = factory.post(
    "/articles/",
    data='{"title": "Тест"}',
    content_type="application/json",
)

# Оборачиваем в DRF Request с нужными компонентами
drf_request = Request(
    raw_request,
    parsers=[JSONParser()],
    authenticators=[TokenAuthentication()],
)

# Теперь доступны все DRF-атрибуты
print(drf_request.data)          # {"title": "Тест"}
print(drf_request.method)        # POST
print(drf_request.content_type)  # application/json`,
  },
  {
    name: "rest_framework.request.Request.data",
    category: "Request",
    description:
      "Атрибут. Возвращает разобранное тело запроса как словарь (или QueryDict для form-данных). Аналог request.POST в Django, но поддерживает JSON, multipart и другие форматы через парсеры. Значение вычисляется лениво при первом обращении. Доступен для всех HTTP-методов, в том числе PUT, PATCH, DELETE.",
    syntax: "request.data",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class ArticleView(APIView):

    def post(self, request):
        # JSON, form-data, multipart — всё доступно через request.data
        title = request.data.get("title")
        body  = request.data.get("body")

        if not title:
            return Response(
                {"error": "Поле title обязательно"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"title": title, "body": body}, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        # Работает и для PATCH/PUT
        updates = request.data  # {'status': 'published'}
        return Response({"updated_fields": list(updates.keys())})

# POST /articles/
# Content-Type: application/json
# body: {"title": "DRF", "body": "Подробности..."}
# → {"title": "DRF", "body": "Подробности..."}`,
  },
  {
    name: "rest_framework.request.Request.query_params",
    category: "Request",
    description:
      "Атрибут. Возвращает QueryDict с параметрами строки запроса (URL query string). Является псевдонимом для стандартного request.GET Django. Рекомендуется использовать query_params вместо GET для ясности — в REST API GET не всегда означает метод запроса, а является частью HTTP-метода.",
    syntax: "request.query_params",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from myapp.models import Article


class ArticleSearchView(APIView):

    def get(self, request):
        # Читаем параметры из URL: /search/?q=python&page=2&sort=date
        query  = request.query_params.get("q", "")
        page   = int(request.query_params.get("page", 1))
        sort   = request.query_params.get("sort", "created_at")
        tags   = request.query_params.getlist("tag")  # ?tag=a&tag=b

        qs = Article.objects.all()
        if query:
            qs = qs.filter(title__icontains=query)
        if tags:
            qs = qs.filter(tags__name__in=tags).distinct()
        qs = qs.order_by(sort)

        # Простая пагинация
        per_page = 10
        items = list(qs.values("id", "title")[(page - 1) * per_page: page * per_page])
        return Response({"page": page, "results": items})

# GET /search/?q=django&tag=backend&tag=api&sort=title`,
  },
  {
    name: "rest_framework.request.Request.user",
    category: "Request",
    description:
      "Атрибут. Возвращает аутентифицированного пользователя. При первом обращении запускает процесс аутентификации через все настроенные аутентификаторы. Возвращает объект пользователя (обычно User Django) или AnonymousUser, если аутентификация не прошла. Аналог django.http.HttpRequest.user, но с ленивой аутентификацией.",
    syntax: "request.user",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # объект User или AnonymousUser

        return Response({
            "id":         user.pk,
            "username":   user.username,
            "email":      user.email,
            "is_staff":   user.is_staff,
            "is_active":  user.is_active,
        })

    def patch(self, request):
        user = request.user
        # Обновляем только разрешённые поля
        allowed = {"first_name", "last_name", "email"}
        for field, value in request.data.items():
            if field in allowed:
                setattr(user, field, value)
        user.save()
        return Response({"updated": True})

# GET /profile/  (без токена) → HTTP 401 Unauthorized
# GET /profile/  (с токеном)  → {"id": 5, "username": "ivan", ...}`,
  },
  {
    name: "rest_framework.request.Request.auth",
    category: "Request",
    description:
      "Атрибут. Возвращает дополнительный контекст аутентификации — объект, предоставленный успешным аутентификатором. Для TokenAuthentication это объект Token, для JWT — декодированный payload, для SessionAuthentication — None. Позволяет получать метаданные об аутентификационных данных без обращения к базе данных.",
    syntax: "request.auth",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone


class TokenInfoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = request.auth  # объект rest_framework.authtoken.models.Token

        if token is None:
            return Response({"auth_type": "session"})

        return Response({
            "auth_type":  "token",
            "token_key":  token.key[:8] + "...",  # первые 8 символов
            "created":    token.created.isoformat(),
            "user":       token.user.username,
        })

# GET /token-info/  Authorization: Token abc123...
# {
#   "auth_type": "token",
#   "token_key": "abc123..",
#   "created": "2024-01-15T10:30:00+00:00",
#   "user": "ivan"
# }`,
  },
  {
    name: "rest_framework.request.Request.method",
    category: "Request",
    description:
      "Атрибут. Возвращает HTTP-метод текущего запроса в верхнем регистре: 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' и т.д. Поддерживает переопределение метода через заголовок X-HTTP-Method-Override или параметр _method (для клиентов, не поддерживающих PUT/DELETE). Является оберткой над HttpRequest.method.",
    syntax: "request.method",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response


class UniversalView(APIView):
    """Обрабатывает разные методы с общей логикой."""

    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def dispatch(self, request, *args, **kwargs):
        # Логируем до выполнения
        is_safe = request.method in self.SAFE_METHODS
        print(f"[{request.method}] {'Чтение' if is_safe else 'Запись'}")
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        return Response({"method": request.method})  # GET

    def post(self, request):
        return Response({"method": request.method})  # POST

    def put(self, request, pk=None):
        return Response({"method": request.method})  # PUT

# X-HTTP-Method-Override позволяет отправить PUT через POST:
# POST /resource/1/  X-HTTP-Method-Override: PUT
# → request.method == "PUT"`,
  },
  {
    name: "rest_framework.request.Request.content_type",
    category: "Request",
    description:
      "Атрибут. Возвращает строку Content-Type тела запроса (например, 'application/json', 'multipart/form-data'). Используется парсерами и negotiation для определения, как разбирать тело запроса. Является обёрткой над request.META['CONTENT_TYPE'] Django.",
    syntax: "request.content_type",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser


class SmartParseView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        ct = request.content_type

        if "application/json" in ct:
            return Response({
                "format":   "json",
                "keys":     list(request.data.keys()),
            })
        elif "multipart/form-data" in ct:
            files = {name: f.name for name, f in request.FILES.items()}
            return Response({
                "format": "multipart",
                "fields": list(request.data.keys()),
                "files":  files,
            })
        elif "application/x-www-form-urlencoded" in ct:
            return Response({
                "format": "form",
                "fields": list(request.data.keys()),
            })

        return Response({"format": "unknown", "content_type": ct})`,
  },
  {
    name: "rest_framework.request.Request.stream",
    category: "Request",
    description:
      "Атрибут. Возвращает объект потока (file-like object) с сырыми данными тела запроса, предоставляемый Django. Используется парсерами для побайтового чтения тела. Доступен до первого обращения к request.data (после разбора поток считается потреблённым). Нужен при реализации кастомных парсеров или потоковой обработке больших тел запросов.",
    syntax: "request.stream",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import BaseParser
import csv
import io


class CsvParser(BaseParser):
    """Кастомный парсер CSV-файлов через stream."""

    media_type = "text/csv"

    def parse(self, stream, media_type=None, parser_context=None):
        # stream — сырой поток байт тела запроса
        text = stream.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        return list(reader)


class CsvUploadView(APIView):
    parser_classes = [CsvParser]

    def post(self, request):
        # После парсинга stream уже прочитан — данные в request.data
        rows = request.data
        return Response({
            "rows_count": len(rows),
            "columns":    list(rows[0].keys()) if rows else [],
        })

# POST /csv/  Content-Type: text/csv
# body: name,age\nИван,30\nАнна,25
# → {"rows_count": 2, "columns": ["name", "age"]}`,
  },
  {
    name: "rest_framework.request.Request.successful_authenticator",
    category: "Request",
    description:
      "Атрибут. Возвращает экземпляр аутентификатора, который успешно аутентифицировал текущего пользователя, или None для анонимных запросов. Позволяет определить схему аутентификации внутри представления — например, вести разную логику для Token и Session аутентификации.",
    syntax: "request.successful_authenticator",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import (
    TokenAuthentication,
    SessionAuthentication,
    BasicAuthentication,
)


class AuthDiagnosticsView(APIView):
    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
        BasicAuthentication,
    ]

    def get(self, request):
        auth = request.successful_authenticator

        if auth is None:
            scheme = "anonymous"
        else:
            scheme = type(auth).__name__

        return Response({
            "user":             str(request.user),
            "is_authenticated": request.user.is_authenticated,
            "auth_scheme":      scheme,
        })

# GET /auth-info/  (без заголовков)
# {"user": "AnonymousUser", "is_authenticated": false, "auth_scheme": "anonymous"}

# GET /auth-info/  Authorization: Token abc123
# {"user": "ivan", "is_authenticated": true, "auth_scheme": "TokenAuthentication"}`,
  },
  {
    name: "rest_framework.response.Response.__init__(data, status, template_name, headers, exception, content_type)",
    category: "Response",
    description:
      "Конструктор DRF-объекта Response — умного HTTP-ответа с поддержкой content negotiation. В отличие от Django HttpResponse, не рендерит данные сразу: рендеринг откладывается до момента отправки клиенту, что позволяет выбрать формат (JSON, XML, HTML) на основе заголовка Accept запроса. Принимает Python-объект (dict, list) — не строку.",
    syntax: "Response(data=None, status=None, template_name=None, headers=None, exception=False, content_type=None)",
    arguments: [
      {
        name: "data",
        description: "Python-объект (dict, list, str и др.) для сериализации в тело ответа. Не должен быть уже сериализован в строку.",
      },
      {
        name: "status",
        description: "HTTP-код ответа (int). По умолчанию 200. Рекомендуется использовать константы из rest_framework.status.",
      },
      {
        name: "template_name",
        description: "Имя шаблона для TemplateHTMLRenderer. Игнорируется при JSON-рендеринге.",
      },
      {
        name: "headers",
        description: "Словарь дополнительных HTTP-заголовков ответа.",
      },
      {
        name: "exception",
        description: "True — ответ является ответом на исключение (используется для логирования). По умолчанию False.",
      },
      {
        name: "content_type",
        description: "Явное указание Content-Type. Если не задан — определяется через content negotiation.",
      },
    ],
    example: `from rest_framework.response import Response
from rest_framework import status


class ArticleView:

    def get_article(self, request, pk):
        # Простой ответ с данными
        return Response({"id": pk, "title": "Django REST"})

    def create_article(self, request):
        # HTTP 201 с заголовком Location
        article = {"id": 10, "title": "Новая статья"}
        return Response(
            article,
            status=status.HTTP_201_CREATED,
            headers={"Location": f"/articles/{article['id']}/"},
        )

    def delete_article(self, request, pk):
        # HTTP 204 без тела
        return Response(status=status.HTTP_204_NO_CONTENT)

    def not_found(self, request):
        # Ответ с ошибкой
        return Response(
            {"detail": "Объект не найден."},
            status=status.HTTP_404_NOT_FOUND,
        )`,
  },
  {
    name: "rest_framework.response.Response.render()",
    category: "Response",
    description:
      "Выполняет рендеринг ответа — преобразует Python-объект из data в байтовое тело ответа с помощью выбранного рендерера. Вызывается автоматически Django WSGI/ASGI при отправке ответа клиенту. Устанавливает content, content_type и status_code. Прямой вызов нужен только в тестах для доступа к rendered_content до отправки.",
    syntax: "response.render()",
    arguments: [],
    example: `from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.test import APIRequestFactory, APIView


# Прямое использование render() в тестах
def test_response_content():
    factory = APIRequestFactory()
    request = factory.get("/")

    response = Response({"message": "Привет", "count": 42})
    response.accepted_renderer  = JSONRenderer()
    response.accepted_media_type = "application/json"
    response.renderer_context   = {}

    # Вызываем render() вручную, чтобы получить байты
    response.render()

    print(response.content)
    # b'{"message":"\u041f\u0440\u0438\u0432\u0435\u0442","count":42}'
    print(response["Content-Type"])
    # application/json

    # Проверяем итоговый контент в тесте
    import json
    data = json.loads(response.content)
    assert data["count"] == 42`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.__init__(instance, data, **kwargs)",
    category: "Serializers",
    description:
      "Конструктор базового класса сериализаторов DRF. Принимает instance для сериализации (чтение) или data для десериализации (запись/валидация). Kwargs передаются в Field.__init__: context (словарь с request, view), partial (True для PATCH), many (True для списков — но лучше использовать many_init()). Не вызывается напрямую — используется через подклассы.",
    syntax: "BaseSerializer(instance=None, data=empty, **kwargs)",
    arguments: [
      {
        name: "instance",
        description: "Объект модели или QuerySet для сериализации в data. Если передан вместе с data — режим обновления.",
      },
      {
        name: "data",
        description: "Входные данные для валидации и десериализации (обычно request.data). При передаче активируется режим валидации.",
      },
      {
        name: "**kwargs",
        description: "partial=True для частичной валидации; context=dict для передачи контекста; many=True для коллекций.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "body", "status"]


# Сериализация (instance → data)
article = Article.objects.get(pk=1)
s = ArticleSerializer(article)
print(s.data)  # {'id': 1, 'title': '...', 'body': '...', 'status': 'draft'}

# Десериализация (data → validated_data → save)
s2 = ArticleSerializer(data={"title": "Новая", "body": "Текст", "status": "draft"})
if s2.is_valid():
    s2.save()

# Обновление (instance + data → partial update)
s3 = ArticleSerializer(article, data={"status": "published"}, partial=True)
if s3.is_valid():
    s3.save()

# С контекстом (доступен как self.context в методах)
s4 = ArticleSerializer(article, context={"request": request})`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.is_valid(*, raise_exception=False)",
    category: "Serializers",
    description:
      "Запускает процесс валидации входных данных (data). Вызывает run_validators(), to_internal_value() и validate(). При успехе возвращает True и заполняет validated_data. При ошибке возвращает False и заполняет errors. Если raise_exception=True и данные невалидны — выбрасывает ValidationError вместо возврата False. Должен быть вызван перед обращением к validated_data или save().",
    syntax: "serializer.is_valid(*, raise_exception=False)",
    arguments: [
      {
        name: "raise_exception",
        description: "True — выбросить ValidationError при ошибке валидации (удобно в views). False — вернуть False и заполнить errors.",
      },
    ],
    example: `from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from myapp.serializers import ArticleSerializer


class ArticleCreateView(APIView):

    def post(self, request):
        s = ArticleSerializer(data=request.data)

        # Вариант 1: с raise_exception (рекомендуется в views)
        s.is_valid(raise_exception=True)
        # Если данные невалидны — автоматически HTTP 400 с errors
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        from myapp.models import Article
        article = Article.objects.get(pk=pk)
        s = ArticleSerializer(article, data=request.data, partial=True)

        # Вариант 2: ручная проверка
        if not s.is_valid():
            return Response({"errors": s.errors}, status=status.HTTP_400_BAD_REQUEST)
        s.save()
        return Response(s.data)`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.data",
    category: "Serializers",
    description:
      "Атрибут. Возвращает сериализованное представление объекта в виде Python-словаря (или списка для many=True). При сериализации объекта вызывает to_representation(). При десериализации (после is_valid()) возвращает validated_data после прохода через to_representation(). Значение кэшируется при первом обращении.",
    syntax: "serializer.data",
    arguments: [],
    example: `from rest_framework import serializers
from myapp.models import Article, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class ArticleSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "status", "tags", "created_at"]


# Сериализация одного объекта
article = Article.objects.prefetch_related("tags").get(pk=1)
s = ArticleSerializer(article)
print(s.data)
# {
#   "id": 1,
#   "title": "Статья о DRF",
#   "status": "published",
#   "tags": [{"id": 1, "name": "django"}, {"id": 2, "name": "api"}],
#   "created_at": "2024-01-15T10:00:00Z"
# }

# Сериализация QuerySet
articles = Article.objects.all()[:3]
s_many = ArticleSerializer(articles, many=True)
print(len(s_many.data))  # 3`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.errors",
    category: "Serializers",
    description:
      "Атрибут. Возвращает словарь ошибок валидации после вызова is_valid(), вернувшего False. Ключи — имена полей (или 'non_field_errors' для ошибок уровня объекта), значения — списки строк с описанием ошибок. Пустой словарь, если валидация прошла успешно. Доступен только после вызова is_valid().",
    syntax: "serializer.errors",
    arguments: [],
    example: `from rest_framework import serializers
from myapp.models import Article


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["title", "body", "status"]

    def validate_status(self, value):
        if value not in ("draft", "published", "archived"):
            raise serializers.ValidationError("Недопустимый статус.")
        return value

    def validate(self, data):
        if data.get("status") == "published" and not data.get("body"):
            raise serializers.ValidationError(
                "Нельзя публиковать статью без тела."
            )
        return data


# Некорректные данные
s = ArticleSerializer(data={"title": "", "status": "invalid"})
s.is_valid()
print(s.errors)
# {
#   "title":  ["This field may not be blank."],
#   "body":   ["This field is required."],
#   "status": ["Недопустимый статус."]
# }`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.validated_data",
    category: "Serializers",
    description:
      "Атрибут. Возвращает словарь с данными, прошедшими валидацию и приведёнными к Python-типам. Доступен только после успешного вызова is_valid(). При обращении до is_valid() выбрасывает AssertionError. Содержит только валидные поля, преобразованные через to_internal_value() и валидаторы.",
    syntax: "serializer.validated_data",
    arguments: [],
    example: `from rest_framework import serializers
from myapp.models import Article
from myapp.serializers import ArticleSerializer


# Пример кастомного сериализатора с демонстрацией validated_data
class EventSerializer(serializers.Serializer):
    title     = serializers.CharField(max_length=200)
    starts_at = serializers.DateTimeField()
    capacity  = serializers.IntegerField(min_value=1)
    is_public = serializers.BooleanField(default=True)

raw_data = {
    "title":     "Python Meetup",
    "starts_at": "2024-06-15T18:00:00+03:00",
    "capacity":  "50",    # строка → будет приведена к int
    "is_public": "true",  # строка → будет приведена к bool
}

s = EventSerializer(data=raw_data)
s.is_valid(raise_exception=True)

vd = s.validated_data
print(vd["title"])      # Python Meetup
print(type(vd["capacity"]))    # <class 'int'> — уже int, не str
print(type(vd["starts_at"]))   # <class 'datetime.datetime'>
print(vd["is_public"])         # True`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.save(**kwargs)",
    category: "Serializers",
    description:
      "Сохраняет объект после успешной валидации. Если сериализатор создан с instance — вызывает update(instance, validated_data), иначе — create(validated_data). Дополнительные kwargs добавляются к validated_data перед сохранением (удобно для автоматической установки полей типа author=request.user). Выбрасывает AssertionError если is_valid() не был вызван или вернул False.",
    syntax: "serializer.save(**kwargs)",
    arguments: [
      {
        name: "**kwargs",
        description: "Дополнительные поля, добавляемые к validated_data перед вызовом create() или update(). Перезаписывают значения из данных запроса.",
      },
    ],
    example: `from rest_framework import serializers, generics, permissions
from myapp.models import Comment
from myapp.serializers import CommentSerializer


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # kwargs добавляются к validated_data при сохранении
        serializer.save(
            author=self.request.user,
            article_id=self.kwargs["article_pk"],
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

# Ручное использование
s = CommentSerializer(data={"body": "Отличная статья!"})
s.is_valid(raise_exception=True)

# author не в запросе — передаём через save()
comment = s.save(author=request.user)
print(comment.pk)       # 42
print(comment.author)   # <User: ivan>`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.to_representation(instance)",
    category: "Serializers",
    description:
      "Преобразует объект модели (или любой Python-объект) в примитивный Python-тип (dict, list, str и т.д.) для последующей JSON-сериализации. Вызывается при обращении к атрибуту data. Переопределяется для кастомизации структуры вывода: добавления вычисляемых полей, изменения ключей, условного исключения полей.",
    syntax: "serializer.to_representation(instance)",
    arguments: [
      {
        name: "instance",
        description: "Объект для сериализации — экземпляр модели, словарь или любой Python-объект.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "author", "created_at"]

    def to_representation(self, instance):
        # Получаем стандартное представление
        data = super().to_representation(instance)

        # Скрываем body для неопубликованных статей
        if instance.status != "published":
            data["body"] = None

        # Добавляем вычисляемое поле
        data["is_editable"] = (
            self.context.get("request") is not None
            and self.context["request"].user == instance.author
        )

        # Переименовываем ключ
        data["published_on"] = data.pop("created_at")

        return data`,
  },
  {
    name: "rest_framework.serializers.BaseSerializer.to_internal_value(data)",
    category: "Serializers",
    description:
      "Преобразует входные данные запроса (dict с примитивными типами) в Python-объекты после валидации. Вызывается внутри is_valid(). Выполняет десериализацию каждого поля и возвращает validated_data. Переопределяется для кастомной нормализации входных данных — изменения ключей, предварительной обработки или поддержки нестандартных форматов.",
    syntax: "serializer.to_internal_value(data)",
    arguments: [
      {
        name: "data",
        description: "Словарь с сырыми входными данными (обычно request.data или его часть).",
      },
    ],
    example: `from rest_framework import serializers


class FlexibleArticleSerializer(serializers.Serializer):
    title  = serializers.CharField(max_length=200)
    body   = serializers.CharField()
    status = serializers.ChoiceField(choices=["draft", "published"])

    def to_internal_value(self, data):
        # Поддерживаем как snake_case, так и camelCase от клиента
        normalized = {}
        for key, value in data.items():
            # camelCase → snake_case
            import re
            snake_key = re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()
            normalized[snake_key] = value

        # Приводим статус к нижнему регистру перед валидацией
        if "status" in normalized:
            normalized["status"] = normalized["status"].lower()

        return super().to_internal_value(normalized)


# Клиент отправляет camelCase
s = FlexibleArticleSerializer(data={
    "title":  "DRF Guide",
    "body":   "Подробности...",
    "status": "DRAFT",   # uppercase — нормализуем
})
s.is_valid(raise_exception=True)
print(s.validated_data["status"])  # draft`,
  },
  {
    name: "rest_framework.serializers.Serializer.create(validated_data)",
    category: "Serializers",
    description:
      "Создаёт и возвращает новый объект модели из validated_data. Вызывается из save() когда сериализатор создан без instance (режим создания). Не реализован в базовом классе — обязателен к переопределению в Serializer. В ModelSerializer реализован автоматически через ORM. Переопределяется для обработки вложенных объектов, M2M-полей или нестандартной логики создания.",
    syntax: "Serializer.create(validated_data)",
    arguments: [
      {
        name: "validated_data",
        description: "Словарь с данными, прошедшими валидацию, плюс дополнительные kwargs из save().",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article, Tag


class ArticleSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(), write_only=True
    )

    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "tags"]

    def create(self, validated_data):
        # Извлекаем M2M-данные до создания объекта
        tag_names = validated_data.pop("tags", [])

        # Создаём основной объект
        article = Article.objects.create(**validated_data)

        # Добавляем теги через get_or_create
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name)
            article.tags.add(tag)

        return article

# POST /articles/
# {"title": "DRF", "body": "...", "status": "draft", "tags": ["django", "api"]}
# → создаёт статью и связывает с тегами`,
  },
  {
    name: "rest_framework.serializers.Serializer.update(instance, validated_data)",
    category: "Serializers",
    description:
      "Обновляет существующий объект модели данными из validated_data. Вызывается из save() когда сериализатор создан с instance (режим обновления). Не реализован в базовом классе — обязателен к переопределению в Serializer. В ModelSerializer реализован автоматически. Переопределяется для обработки вложенных объектов, частичных обновлений M2M и кастомной логики.",
    syntax: "Serializer.update(instance, validated_data)",
    arguments: [
      {
        name: "instance",
        description: "Существующий объект модели, который нужно обновить.",
      },
      {
        name: "validated_data",
        description: "Словарь с новыми валидированными данными.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article, Tag


class ArticleUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(), required=False
    )

    class Meta:
        model = Article
        fields = ["title", "body", "status", "tags"]

    def update(self, instance, validated_data):
        # Обрабатываем M2M отдельно
        tag_names = validated_data.pop("tags", None)

        # Обновляем скалярные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Обновляем теги только если переданы
        if tag_names is not None:
            instance.tags.clear()
            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=name)
                instance.tags.add(tag)

        return instance

# PATCH /articles/1/
# {"status": "published", "tags": ["django", "tutorial"]}`,
  },
  {
    name: "rest_framework.serializers.Serializer.validate(attrs)",
    category: "Serializers",
    description:
      "Метод уровня объекта для кросс-полевой валидации. Вызывается после успешной валидации всех отдельных полей. Получает словарь attrs со всеми валидированными значениями. Должен вернуть attrs (возможно изменённый) или выбросить ValidationError. Переопределяется для проверок, требующих нескольких полей одновременно.",
    syntax: "Serializer.validate(attrs)",
    arguments: [
      {
        name: "attrs",
        description: "Словарь с уже провалидированными значениями всех полей сериализатора.",
      },
    ],
    example: `from rest_framework import serializers
from django.utils import timezone


class EventSerializer(serializers.Serializer):
    title      = serializers.CharField(max_length=200)
    starts_at  = serializers.DateTimeField()
    ends_at    = serializers.DateTimeField()
    capacity   = serializers.IntegerField(min_value=1)
    is_paid    = serializers.BooleanField(default=False)
    price      = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)

    def validate(self, attrs):
        # Проверка: ends_at > starts_at
        if attrs["ends_at"] <= attrs["starts_at"]:
            raise serializers.ValidationError(
                "Дата окончания должна быть позже даты начала."
            )

        # Проверка: платное событие требует цену
        if attrs["is_paid"] and not attrs.get("price"):
            raise serializers.ValidationError(
                "Для платного мероприятия укажите цену."
            )

        # Нормализация: бесплатное событие — price=0
        if not attrs["is_paid"]:
            attrs["price"] = 0

        return attrs`,
  },
  {
    name: "rest_framework.serializers.Serializer.get_fields()",
    category: "Serializers",
    description:
      "Возвращает OrderedDict с полями сериализатора для текущего экземпляра. Вызывается при первом обращении к атрибуту fields. Переопределяется для динамического изменения набора полей в зависимости от контекста — например, скрытия полей для определённых ролей пользователей или добавления полей на основе query-параметров.",
    syntax: "Serializer.get_fields()",
    arguments: [],
    example: `from rest_framework import serializers
from myapp.models import Article


class DynamicArticleSerializer(serializers.ModelSerializer):
    internal_notes = serializers.CharField(read_only=True)
    cost_price     = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "internal_notes", "cost_price"]

    def get_fields(self):
        fields = super().get_fields()

        request = self.context.get("request")
        if request is None or not request.user.is_staff:
            # Скрываем служебные поля для обычных пользователей
            fields.pop("internal_notes", None)
            fields.pop("cost_price", None)

        # Динамически добавляем поле по query-параметру ?include_author=1
        if request and request.query_params.get("include_author"):
            from myapp.serializers import AuthorSerializer
            fields["author"] = AuthorSerializer(read_only=True)

        return fields`,
  },
  {
    name: "rest_framework.serializers.Serializer.get_validators()",
    category: "Serializers",
    description:
      "Возвращает список валидаторов уровня объекта, применяемых в run_validators(). По умолчанию возвращает значение атрибута validators сериализатора. Переопределяется для динамического добавления или удаления валидаторов в зависимости от контекста — например, отключения уникальности при обновлении (partial update).",
    syntax: "Serializer.get_validators()",
    arguments: [],
    example: `from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from myapp.models import Article


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["title", "author", "status"]
        validators = [
            UniqueTogetherValidator(
                queryset=Article.objects.all(),
                fields=["title", "author"],
                message="Статья с таким заголовком уже существует у этого автора.",
            )
        ]

    def get_validators(self):
        validators = super().get_validators()

        # При частичном обновлении (PATCH) отключаем UniqueTogetherValidator:
        # он некорректно работает, когда передаётся только часть полей
        if self.partial:
            validators = [
                v for v in validators
                if not isinstance(v, UniqueTogetherValidator)
            ]

        return validators`,
  },
  {
    name: "rest_framework.serializers.Serializer.run_validation(data=empty)",
    category: "Serializers",
    description:
      "Выполняет полный цикл валидации входных данных: вызывает to_internal_value() для десериализации и приведения типов, затем run_validators() для проверки валидаторов уровня объекта, затем validate() для кросс-полевых проверок. Вызывается из is_valid(). Переопределяется для добавления кастомного этапа обработки в цепочку валидации.",
    syntax: "Serializer.run_validation(data=empty)",
    arguments: [
      {
        name: "data",
        description: "Сырые входные данные для валидации. По умолчанию empty — специальный sentinel-объект DRF.",
      },
    ],
    example: `from rest_framework import serializers
from rest_framework.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)


class AuditedSerializer(serializers.Serializer):
    """Сериализатор с логированием каждой валидации."""

    title  = serializers.CharField(max_length=200)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def run_validation(self, data=serializers.empty):
        logger.debug(
            "Начало валидации %s, поля: %s",
            type(self).__name__,
            list(data.keys()) if isinstance(data, dict) else "empty",
        )
        try:
            value = super().run_validation(data)
            logger.debug("Валидация успешна: %s", value)
            return value
        except ValidationError as exc:
            logger.warning("Ошибка валидации: %s", exc.detail)
            raise`,
  },
  {
    name: "rest_framework.serializers.Serializer.run_validators(value)",
    category: "Serializers",
    description:
      "Запускает все валидаторы уровня объекта из get_validators() на уже десериализованных данных. Вызывается из run_validation() после to_internal_value(). Собирает ошибки со всех валидаторов и выбрасывает ValidationError, если хотя бы один провалился. Переопределяется для изменения порядка или условий запуска валидаторов.",
    syntax: "Serializer.run_validators(value)",
    arguments: [
      {
        name: "value",
        description: "Словарь с уже десериализованными данными (результат to_internal_value()).",
      },
    ],
    example: `from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from myapp.models import Article


def no_profanity_validator(value):
    """Пример валидатора уровня объекта."""
    forbidden = ["спам", "реклама"]
    text = f"{value.get('title', '')} {value.get('body', '')}".lower()
    for word in forbidden:
        if word in text:
            raise serializers.ValidationError(
                f"Контент содержит запрещённое слово: «{word}»."
            )


class ArticleSerializer(serializers.Serializer):
    title  = serializers.CharField(max_length=200)
    body   = serializers.CharField()
    status = serializers.ChoiceField(choices=["draft", "published"])

    validators = [no_profanity_validator]

    def run_validators(self, value):
        # Пропускаем валидаторы для черновиков — они ещё не финальные
        if value.get("status") == "draft":
            return
        super().run_validators(value)`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.create(validated_data)",
    category: "Serializers",
    description:
      "Реализация create() для ModelSerializer. Автоматически обрабатывает M2M-поля (сохраняет объект, потом устанавливает связи через set()), корректно передаёт вложенные объекты и обычные поля в Model.objects.create(). При наличии вложенных записываемых сериализаторов выбрасывает исключение — их нужно обрабатывать вручную в переопределении. Поддерживает Nested Writable Serializers только при явном переопределении.",
    syntax: "ModelSerializer.create(validated_data)",
    arguments: [
      {
        name: "validated_data",
        description: "Словарь с провалидированными данными после вызова is_valid(). M2M-поля извлекаются и обрабатываются отдельно.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article, Tag


class ArticleSerializer(serializers.ModelSerializer):
    """
    ModelSerializer.create() автоматически обрабатывает M2M.
    Переопределяем только для дополнительной логики.
    """
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True
    )

    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "author", "tags"]

    def create(self, validated_data):
        # Стандартный ModelSerializer.create() уже умеет M2M.
        # Переопределяем для добавления бизнес-логики:
        tags_data = validated_data.pop("tags", [])
        article = Article.objects.create(**validated_data)

        # Устанавливаем M2M-связи
        article.tags.set(tags_data)

        # Дополнительное действие при создании
        article.notify_subscribers()
        return article`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.update(instance, validated_data)",
    category: "Serializers",
    description:
      "Реализация update() для ModelSerializer. Итерирует по validated_data, устанавливает атрибуты на instance через setattr() и вызывает save(). M2M-поля устанавливаются отдельно через field.set() после сохранения. Не поддерживает вложенные записываемые сериализаторы — для них нужно явное переопределение. При partial=True обновляет только переданные поля.",
    syntax: "ModelSerializer.update(instance, validated_data)",
    arguments: [
      {
        name: "instance",
        description: "Существующий объект модели для обновления.",
      },
      {
        name: "validated_data",
        description: "Словарь с провалидированными новыми значениями. При partial=True содержит только переданные поля.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["bio", "avatar", "location", "website"]

    def update(self, instance, validated_data):
        # Стандартный update() достаточен для простых полей.
        # Переопределяем для обработки загрузки файла.
        old_avatar = instance.avatar

        instance = super().update(instance, validated_data)

        # Удаляем старый файл аватара при замене
        if "avatar" in validated_data and old_avatar:
            import os
            if os.path.isfile(old_avatar.path):
                os.remove(old_avatar.path)

        return instance

# PATCH /profiles/5/
# {"bio": "Python-разработчик", "location": "Москва"}
# → обновляет только bio и location (partial=True)`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.get_field_names(declared_fields, info)",
    category: "Serializers",
    description:
      "Определяет итоговый список имён полей сериализатора. Учитывает Meta.fields ('__all__' или список), Meta.exclude, явно объявленные поля. Вызывается при инициализации. Переопределяется для программного изменения набора полей — например, динамического добавления или исключения полей без переопределения get_fields().",
    syntax: "ModelSerializer.get_field_names(declared_fields, info)",
    arguments: [
      {
        name: "declared_fields",
        description: "OrderedDict явно объявленных полей в теле класса сериализатора.",
      },
      {
        name: "info",
        description: "Объект FieldInfo с метаданными модели: поля, отношения, первичный ключ.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article


class RoleBasedArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = "__all__"

    def get_field_names(self, declared_fields, info):
        # Получаем все имена полей от родителя
        field_names = super().get_field_names(declared_fields, info)

        request = self.context.get("request")

        # Исключаем служебные поля для обычных пользователей
        staff_only = {"internal_notes", "moderation_flag", "cost_basis"}
        if not (request and request.user.is_staff):
            field_names = [f for f in field_names if f not in staff_only]

        return field_names`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.get_default_field_names(declared_fields, model_info)",
    category: "Serializers",
    description:
      "Возвращает набор полей по умолчанию когда Meta.fields = '__all__'. Включает первичный ключ, все поля модели и все явно объявленные поля. Вызывается из get_field_names(). Переопределяется для изменения логики автоматического включения полей — например, для исключения определённых типов полей из '__all__'.",
    syntax: "ModelSerializer.get_default_field_names(declared_fields, model_info)",
    arguments: [
      {
        name: "declared_fields",
        description: "OrderedDict явно объявленных полей.",
      },
      {
        name: "model_info",
        description: "Объект с метаданными модели: fields_and_pk, relations, forward_relations и т.д.",
      },
    ],
    example: `from rest_framework import serializers
from myapp.models import Article


class NoAutoDateSerializer(serializers.ModelSerializer):
    """
    fields='__all__', но автоматически исключает
    поля с auto_now / auto_now_add.
    """

    class Meta:
        model = Article
        fields = "__all__"

    def get_default_field_names(self, declared_fields, model_info):
        field_names = super().get_default_field_names(declared_fields, model_info)

        # Находим auto_now и auto_now_add поля модели
        auto_fields = {
            f.name
            for f in Article._meta.get_fields()
            if hasattr(f, "auto_now") and (f.auto_now or f.auto_now_add)
        }

        return [name for name in field_names if name not in auto_fields]`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.build_field(field_name, info, model_class, nested_depth)",
    category: "Serializers",
    description:
      "Центральный диспетчер построения поля: определяет тип поля (обычное, реляционное, вложенный сериализатор, URL-поле, кастомное) и делегирует создание соответствующему build_*-методу. Возвращает кортеж (field_class, field_kwargs). Переопределяется для перехвата построения конкретных полей и подстановки кастомных классов.",
    syntax: "ModelSerializer.build_field(field_name, info, model_class, nested_depth)",
    arguments: [
      {
        name: "field_name",
        description: "Имя поля для построения.",
      },
      {
        name: "info",
        description: "Объект FieldInfo с метаданными модели.",
      },
      {
        name: "model_class",
        description: "Класс модели Django.",
      },
      {
        name: "nested_depth",
        description: "Текущая глубина вложенности (из Meta.depth).",
      },
    ],
    example: `from rest_framework import serializers
from rest_framework.fields import CharField
from django.db.models import TextField
from myapp.models import Article


class MarkdownAwareSerializer(serializers.ModelSerializer):
    """
    Автоматически заменяет CharField для TextField на
    кастомный MarkdownField при построении полей.
    """

    class Meta:
        model = Article
        fields = "__all__"

    def build_field(self, field_name, info, model_class, nested_depth):
        field_class, field_kwargs = super().build_field(
            field_name, info, model_class, nested_depth
        )
        # Подменяем CharField → MarkdownField для TextField модели
        model_field = model_class._meta.get_field(field_name) if field_name in [
            f.name for f in model_class._meta.get_fields()
        ] else None

        if model_field and isinstance(model_field, TextField):
            from myapp.fields import MarkdownField
            field_class = MarkdownField

        return field_class, field_kwargs`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.build_standard_field(field_name, model_field)",
    category: "Serializers",
    description:
      "Строит поле сериализатора для обычного (не реляционного) поля модели. Ищет подходящий класс поля в SERIALIZER_FIELD_MAPPING и извлекает kwargs (max_length, min_value, choices и т.д.) из атрибутов поля модели. Переопределяется для изменения маппинга типов или принудительной подстановки кастомного поля вместо стандартного.",
    syntax: "ModelSerializer.build_standard_field(field_name, model_field)",
    arguments: [
      {
        name: "field_name",
        description: "Имя поля модели.",
      },
      {
        name: "model_field",
        description: "Экземпляр поля модели Django (CharField, IntegerField, DecimalField и т.д.).",
      },
    ],
    example: `from rest_framework import serializers
from django.db.models import DecimalField
from myapp.models import Product
from myapp.fields import MoneyField  # кастомное поле с форматированием


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "discount_price"]

    def build_standard_field(self, field_name, model_field):
        field_class, field_kwargs = super().build_standard_field(
            field_name, model_field
        )
        # Подменяем DecimalField → MoneyField для денежных полей
        if isinstance(model_field, DecimalField):
            currency = getattr(model_field, "currency", "RUB")
            field_class = MoneyField
            field_kwargs["currency"] = currency

        return field_class, field_kwargs`,
  },
  {
    name: "rest_framework.serializers.ModelSerializer.build_relational_field(field_name, relation_info)",
    category: "Serializers",
    description:
      "Строит поле сериализатора для реляционного поля модели (ForeignKey, ManyToManyField, OneToOneField). По умолчанию возвращает PrimaryKeyRelatedField (или ManyRelatedField для M2M). Переопределяется для автоматической подстановки кастомных реляционных полей — например, SlugRelatedField или гиперссылочных полей для определённых моделей.",
    syntax: "ModelSerializer.build_relational_field(field_name, relation_info)",
    arguments: [
      {
        name: "field_name",
        description: "Имя реляционного поля.",
      },
      {
        name: "relation_info",
        description: "Именованный кортеж RelationInfo: model_field, related_model, to_many, to_field, reverse.",
      },
    ],
    example: `from rest_framework import serializers
from rest_framework.relations import SlugRelatedField
from myapp.models import Article, Tag, Author


class SmartRelationalSerializer(serializers.ModelSerializer):
    """
    ForeignKey на Author → SlugRelatedField (по username).
    M2M на Tag → SlugRelatedField (по name).
    Остальные → стандартный PrimaryKeyRelatedField.
    """

    class Meta:
        model = Article
        fields = ["id", "title", "author", "tags"]

    def build_relational_field(self, field_name, relation_info):
        field_class, field_kwargs = super().build_relational_field(
            field_name, relation_info
        )
        related_model = relation_info.related_model

        if related_model is Author:
            return SlugRelatedField, {
                **field_kwargs,
                "slug_field": "username",
                "queryset": Author.objects.all(),
            }
        if related_model is Tag:
            return SlugRelatedField, {
                **field_kwargs,
                "slug_field": "name",
                "queryset": Tag.objects.all(),
            }
        return field_class, field_kwargs`,
  },
];
