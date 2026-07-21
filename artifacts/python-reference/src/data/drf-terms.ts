import { ExampleFile } from "./django-examples";

export type DrfExample = {
  id: string;
  title: string;
  task: string;
  files: ExampleFile[];
  explanation: string;
};

export const drfExamples: DrfExample[] = [
  {
    id: "nested-serializer-write",
    title: "Вложенные сериализаторы с записью",
    task: "Реализовать API для создания статьи с тегами за один запрос. Теги должны создаваться или находиться по имени. Сериализатор должен поддерживать создание и обновление вложенных объектов.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title`,
      },
      {
        filename: "serializers.py",
        code: `from rest_framework import serializers
from .models import Article, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class ArticleSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True)

    class Meta:
        model = Article
        fields = ["id", "title", "body", "tags", "created_at"]
        read_only_fields = ["id", "created_at"]

    def _get_or_create_tags(self, tags_data):
        tag_objects = []
        for tag_data in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_data["name"])
            tag_objects.append(tag)
        return tag_objects

    def create(self, validated_data):
        tags_data = validated_data.pop("tags", [])
        article = Article.objects.create(**validated_data)
        article.tags.set(self._get_or_create_tags(tags_data))
        return article

    def update(self, instance, validated_data):
        tags_data = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            instance.tags.set(self._get_or_create_tags(tags_data))
        return instance`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics, permissions
from .models import Article
from .serializers import ArticleSerializer


class ArticleListCreateView(generics.ListCreateAPIView):
    queryset = Article.objects.prefetch_related("tags").order_by("-created_at")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.prefetch_related("tags")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]`,
      },
    ],
    explanation:
      "**Проблема:** стандартный ModelSerializer не умеет создавать или обновлять связанные объекты — нужно переопределить create() и update().\n\n" +
      "**Ключевые решения:**\n\n" +
      "1. **_get_or_create_tags** — вспомогательный метод, который ищет тег по имени или создаёт новый. Это атомарная операция, безопасная при параллельных запросах.\n\n" +
      "2. **validated_data.pop(\"tags\", [])** — извлекаем теги до вызова Article.objects.create(), потому что ManyToMany-поле нельзя передать напрямую в create.\n\n" +
      "3. **instance.tags.set(...)** — заменяет все существующие связи новыми. При частичном обновлении проверяем tags_data is not None, чтобы не затирать теги, если поле не передано.\n\n" +
      "4. **prefetch_related(\"tags\")** — обязательно в QuerySet, иначе каждый объект в списке вызовет дополнительный SQL-запрос (проблема N+1).",
  },
  {
    id: "jwt-authentication",
    title: "JWT-аутентификация с djangorestframework-simplejwt",
    task: "Настроить JWT-аутентификацию для API. Реализовать эндпоинты получения и обновления токенов. Защитить маршруты, возвращающие данные текущего пользователя. Добавить кастомные claims в токен.",
    files: [
      {
        filename: "settings.py",
        code: `from datetime import timedelta

INSTALLED_APPS = [
    ...
    "rest_framework",
    "rest_framework_simplejwt",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "accounts.serializers.CustomTokenObtainPairSerializer",
}`,
      },
      {
        filename: "accounts/serializers.py",
        code: `from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Добавляет кастомные claims в access-токен."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["is_staff"] = user.is_staff
        return token


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        from django.contrib.auth import get_user_model
        model = get_user_model()
        fields = ["id", "username", "email", "first_name", "last_name", "date_joined"]
        read_only_fields = ["id", "date_joined"]`,
      },
      {
        filename: "accounts/views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainPairSerializer, UserProfileSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Выход выполнен успешно."})
        except Exception:
            return Response({"detail": "Неверный токен."}, status=400)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)`,
      },
      {
        filename: "urls.py",
        code: `from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView, LogoutView, MeView

urlpatterns = [
    path("auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
]`,
      },
    ],
    explanation:
      "**JWT (JSON Web Token)** — стандарт для передачи заявок (claims) между сторонами в виде подписанного JSON-объекта.\n\n" +
      "**Структура:** header.payload.signature — три base64-части, разделённые точкой.\n\n" +
      "**Ключевые настройки simplejwt:**\n" +
      "- ROTATE_REFRESH_TOKENS: True — при каждом обновлении access-токена выдаётся новый refresh-токен.\n" +
      "- BLACKLIST_AFTER_ROTATION: True — старый refresh-токен добавляется в чёрный список. Требует приложение rest_framework_simplejwt.token_blacklist.\n\n" +
      "**Кастомные claims:** переопределяем get_token() в сериализаторе, добавляя нужные поля в payload токена. Доступны на клиенте без дополнительных запросов.\n\n" +
      "**Logout:** в stateless JWT нельзя «удалить» токен на сервере. Решение — blacklist: refresh-токен помечается как недействительный до истечения срока жизни.",
  },
  {
    id: "custom-pagination-response",
    title: "Кастомная пагинация с метаданными",
    task: "Реализовать пагинацию, которая возвращает расширенный формат ответа: данные вложены в data, а метаинформация (page, total_pages, has_next и т.д.) — в отдельный объект meta. Применить её к нескольким ViewSet.",
    files: [
      {
        filename: "pagination.py",
        code: `from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
import math


class MetaPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    page_query_param = "page"

    def get_paginated_response(self, data):
        total_pages = math.ceil(self.page.paginator.count / self.get_page_size(self.request))
        return Response({
            "meta": {
                "count": self.page.paginator.count,
                "page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "total_pages": total_pages,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
            },
            "data": data,
        })`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import viewsets
from .pagination import MetaPagination
from .models import Article, User
from .serializers import ArticleSerializer, UserSerializer


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Article.objects.select_related("author").order_by("-created_at")
    serializer_class = ArticleSerializer
    pagination_class = MetaPagination


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.order_by("username")
    serializer_class = UserSerializer
    pagination_class = MetaPagination`,
      },
    ],
    explanation:
      "**Зачем кастомный формат?** Стандартный ответ DRF (count, next, previous, results) не всегда удобен для фронтенда. Метаданные вроде total_pages и has_next избавляют клиент от лишних вычислений.\n\n" +
      "**get_paginated_response** — единственный метод, который нужно переопределить для изменения формата ответа. Вся логика расчёта страниц уже есть в self.page.\n\n" +
      "**math.ceil** вместо целочисленного деления используется намеренно: 21 // 20 = 1, но страниц должно быть 2.\n\n" +
      "**get_page_size(self.request)** — а не self.page_size — потому что клиент мог передать ?page_size=50, и нужно отразить реально применённый размер.\n\n" +
      "**Применение:** достаточно указать pagination_class = MetaPagination в конкретном ViewSet или глобально в DEFAULT_PAGINATION_CLASS.",
  },
  {
    id: "permissions-ownership",
    title: "Разграничение прав доступа к объектам",
    task: "Реализовать систему разрешений: администраторы могут делать всё, авторизованные пользователи — создавать объекты и редактировать только свои, анонимы — только читать. Применить к ViewSet без дублирования логики.",
    files: [
      {
        filename: "permissions.py",
        code: `from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrAdminOrReadOnly(BasePermission):
    """
    - Чтение: все.
    - Создание: авторизованные.
    - Изменение/удаление: автор объекта или администратор.
    """
    owner_field = "author"

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import viewsets
from .permissions import IsOwnerOrAdminOrReadOnly
from .models import Article
from .serializers import ArticleSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related("author").order_by("-created_at")
    serializer_class = ArticleSerializer
    permission_classes = [IsOwnerOrAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            return qs.filter(published=True)
        if self.request.user.is_staff:
            return qs
        return qs.filter(published=True) | qs.filter(author=self.request.user)`,
      },
    ],
    explanation:
      "**has_permission vs has_object_permission:** первый вызывается для всех запросов к вью, второй — только когда DRF получает конкретный объект (retrieve, update, destroy). Для list и create has_object_permission не вызывается.\n\n" +
      "**SAFE_METHODS** — кортеж ('GET', 'HEAD', 'OPTIONS'). Используем его вместо хардкода HTTP-методов.\n\n" +
      "**owner_field как атрибут класса** — позволяет переиспользовать разрешение для разных моделей, просто переопределив это поле в подклассе.\n\n" +
      "**Логика get_queryset:** разграничение на уровне QuerySet — более надёжный подход, чем полагаться только на object-level permissions, потому что list-эндпоинт не вызывает has_object_permission для каждого элемента.",
  },
  {
    id: "apiview-dispatch",
    title: "APIView.dispatch — точка входа для HTTP-запроса",
    task: "Понять, как APIView.dispatch маршрутизирует запрос к нужному HTTP-методу (get, post, put и т.д.) и где его стоит переопределять. Добавить логирование времени выполнения каждого запроса без изменения бизнес-логики.",
    files: [
      {
        filename: "views.py",
        code: `import time
import logging
from rest_framework.views import APIView
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class TimedAPIView(APIView):
    """
    Базовый класс с замером времени выполнения через dispatch().
    Наследуйте свои вью от него вместо APIView.
    """

    def dispatch(self, request, *args, **kwargs):
        start = time.monotonic()
        response = super().dispatch(request, *args, **kwargs)
        elapsed = time.monotonic() - start
        logger.info(
            "%s %s — %dms — HTTP %d",
            request.method,
            request.path,
            int(elapsed * 1000),
            response.status_code,
        )
        # Добавляем заголовок для отладки на фронтенде
        response["X-Response-Time-Ms"] = str(int(elapsed * 1000))
        return response


class ArticleListView(TimedAPIView):
    def get(self, request):
        return Response({"articles": []})

    def post(self, request):
        return Response({"created": True}, status=201)`,
      },
    ],
    explanation:
      "**dispatch(request, *args, **kwargs)** — первый метод, который вызывается при любом HTTP-запросе к APIView. Именно он:\n\n" +
      "1. Оборачивает Django-запрос в DRF Request (через initialize_request).\n" +
      "2. Вызывает initial() — аутентификация, разрешения, троттлинг.\n" +
      "3. Маршрутизирует к self.get(), self.post() и т.д. по имени метода.\n" +
      "4. При отсутствии метода возвращает 405 Method Not Allowed.\n" +
      "5. Передаёт результат через finalize_response().\n\n" +
      "**Когда переопределять:** когда нужна сквозная логика вокруг всего цикла запроса — метрики, трейсинг, специфичные заголовки. Для аутентификации и разрешений переопределяйте initial(), а не dispatch().\n\n" +
      "**super().dispatch() обязателен:** без него не выполнится ни аутентификация, ни маршрутизация к HTTP-методу.",
  },
  {
    id: "apiview-initial",
    title: "APIView.initial — хук перед выполнением запроса",
    task: "Добавить к API проверку обязательного заголовка X-Client-Version и tenant-изоляцию до выполнения любого запроса. Логика должна применяться ко всем эндпоинтам без дублирования кода.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from packaging.version import Version


MIN_CLIENT_VERSION = "2.0.0"


class BaseAPIView(APIView):
    """
    Расширяет initial() для проверки версии клиента и tenant-изоляции.
    """

    def initial(self, request, *args, **kwargs):
        # 1. Сначала выполняем стандартную логику DRF:
        #    аутентификация, разрешения, троттлинг
        super().initial(request, *args, **kwargs)

        # 2. После аутентификации (request.user уже определён)
        #    проверяем версию клиента
        client_version = request.headers.get("X-Client-Version")
        if client_version:
            try:
                if Version(client_version) < Version(MIN_CLIENT_VERSION):
                    raise ValidationError(
                        f"Требуется версия клиента >= {MIN_CLIENT_VERSION}. "
                        f"Текущая: {client_version}"
                    )
            except Exception as e:
                if isinstance(e, ValidationError):
                    raise
                # Некорректный формат версии — игнорируем

        # 3. Tenant-изоляция: убеждаемся, что пользователь
        #    принадлежит тому же tenant, что указан в URL
        tenant_id = kwargs.get("tenant_id")
        if tenant_id and request.user.is_authenticated:
            if str(request.user.tenant_id) != str(tenant_id):
                raise PermissionDenied("Нет доступа к ресурсам этого тенанта.")


class ArticleListView(BaseAPIView):
    def get(self, request, tenant_id):
        articles = Article.objects.filter(tenant_id=tenant_id)
        return Response({"articles": list(articles.values("id", "title"))})`,
      },
    ],
    explanation:
      "**initial(request, *args, **kwargs)** вызывается внутри dispatch() до передачи запроса HTTP-методу. Стандартная реализация выполняет три вещи:\n\n" +
      "1. `perform_authentication(request)` — вызывает request.user, что запускает аутентификацию.\n" +
      "2. `check_permissions(request)` — проверяет все permission_classes.\n" +
      "3. `check_throttles(request)` — проверяет все throttle_classes.\n\n" +
      "**Правило super():** всегда вызывайте super().initial() **первой строкой** переопределения. Иначе аутентификация не выполнится, и request.user будет AnonymousUser — даже для защищённых эндпоинтов.\n\n" +
      "**initial() vs dispatch():** initial() — правильное место для pre-request логики, которой нужен уже аутентифицированный пользователь. dispatch() — для логики вокруг всего цикла, включая post-response.",
  },
  {
    id: "apiview-initialize-request",
    title: "APIView.initialize_request — расширение объекта Request",
    task: "Обогатить объект DRF Request дополнительными данными из заголовков при каждом запросе: идентификатором корреляции для трассировки и временной меткой. Сделать эти данные доступными во всех вью через request.correlation_id.",
    files: [
      {
        filename: "views.py",
        code: `import uuid
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response


class EnrichedRequest(Request):
    """DRF Request с дополнительными атрибутами трассировки."""

    def __init__(self, *args, correlation_id=None, received_at=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self.received_at = received_at or timezone.now()


class TracedAPIView(APIView):
    """
    Базовый класс, который подменяет стандартный Request
    на EnrichedRequest с данными трассировки.
    """

    def initialize_request(self, request, *args, **kwargs):
        # Получаем стандартный DRF Request из родительского метода
        drf_request = super().initialize_request(request, *args, **kwargs)

        # Извлекаем correlation_id из заголовка или генерируем новый
        correlation_id = request.META.get("HTTP_X_CORRELATION_ID") or str(uuid.uuid4())

        # Возвращаем наш расширенный Request с теми же параметрами
        return EnrichedRequest(
            request,
            parsers=drf_request.parsers,
            authenticators=drf_request.authenticators,
            negotiator=drf_request.negotiator,
            parser_context=drf_request.parser_context,
            correlation_id=correlation_id,
            received_at=timezone.now(),
        )


class OrderView(TracedAPIView):
    def post(self, request):
        # request.correlation_id и request.received_at доступны везде
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Создание заказа [%s]", request.correlation_id)

        # Передаём correlation_id в задачи Celery, внешние сервисы и т.д.
        return Response({
            "status": "created",
            "correlation_id": request.correlation_id,
        }, status=201)`,
      },
    ],
    explanation:
      "**initialize_request(request, *args, **kwargs)** превращает Django HttpRequest в DRF Request. Вызывается в самом начале dispatch(), до initial().\n\n" +
      "Стандартная реализация:\n" +
      "```python\n" +
      "def initialize_request(self, request, *args, **kwargs):\n" +
      "    parser_context = self.get_parser_context(request)\n" +
      "    return Request(\n" +
      "        request,\n" +
      "        parsers=self.get_parsers(),\n" +
      "        authenticators=self.get_authenticators(),\n" +
      "        negotiator=self.get_content_negotiator(),\n" +
      "        parser_context=parser_context,\n" +
      "    )\n" +
      "```\n\n" +
      "**Когда переопределять:** когда нужно добавить атрибуты в объект Request, доступные во всех методах вью и нижестоящих слоях (сериализаторы, permissions). Это чище, чем хранить данные в threading.local или передавать через kwargs.\n\n" +
      "**Важно:** передавайте все параметры из родительского Request (parsers, authenticators и т.д.) в подкласс, иначе сломается аутентификация и парсинг тела запроса.",
  },
  {
    id: "apiview-finalize-response",
    title: "APIView.finalize_response — постобработка ответа",
    task: "Добавить к каждому ответу API стандартные заголовки безопасности и обернуть все ответы в единый формат {success, data, error} без изменения кода существующих вью.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response


class StandardizedAPIView(APIView):
    """
    Оборачивает все ответы в {success, data/error} и добавляет
    заголовки безопасности через finalize_response().
    """

    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }

    def finalize_response(self, request, response, *args, **kwargs):
        # Вызываем родительский метод — он назначает рендереры
        # и выполняет content negotiation
        response = super().finalize_response(request, response, *args, **kwargs)

        # Добавляем заголовки безопасности
        for header, value in self.SECURITY_HEADERS.items():
            response[header] = value

        # Добавляем correlation id если он есть на request
        if hasattr(request, "correlation_id"):
            response["X-Correlation-ID"] = request.correlation_id

        # Оборачиваем данные в стандартный формат
        # (только для Response с dict/list данными, не для StreamingResponse)
        if hasattr(response, "data") and isinstance(response.data, (dict, list)):
            is_error = response.status_code >= 400
            if is_error:
                response.data = {
                    "success": False,
                    "error": response.data,
                }
            else:
                response.data = {
                    "success": True,
                    "data": response.data,
                }

        return response


class ArticleView(StandardizedAPIView):
    def get(self, request, pk):
        # Возвращаем обычный dict — finalize_response обернёт его
        return Response({"id": pk, "title": "Django REST Framework"})

    def delete(self, request, pk):
        return Response(status=204)  # Нет тела — финализация не трогает data`,
      },
    ],
    explanation:
      "**finalize_response(request, response, *args, **kwargs)** — последний метод в цепочке dispatch(). Вызывается после HTTP-метода (get/post/...) и handle_exception().\n\n" +
      "Стандартная реализация назначает рендереры ответу (content negotiation) и возвращает Response. Без вызова super() ответ не получит рендерер и упадёт при попытке сериализации.\n\n" +
      "**Порядок вызовов в dispatch():**\n" +
      "1. initialize_request() → DRF Request\n" +
      "2. initial() → аутентификация, разрешения\n" +
      "3. self.get/post/... → Response\n" +
      "4. **finalize_response()** → финальный Response\n\n" +
      "**Ограничение:** finalize_response() не вызывается при исключениях, выброшенных до initial() (например, при ошибках маршрутизатора). Для таких случаев используйте Django middleware.\n\n" +
      "**Проверка hasattr(response, 'data')** обязательна: при редиректах и StreamingResponse атрибута data нет.",
  },
  {
    id: "apiview-handle-exception",
    title: "APIView.handle_exception — централизованная обработка ошибок",
    task: "Настроить единый обработчик исключений для API: конвертировать Django ValidationError в DRF-формат, логировать неожиданные ошибки с контекстом запроса, возвращать структурированный JSON вместо HTML при 500.",
    files: [
      {
        filename: "exceptions.py",
        code: `from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Глобальный обработчик — указывается в EXCEPTION_HANDLER settings.
    Вызывается через APIView.handle_exception().
    """
    # Конвертируем Django ValidationError → DRF ValidationError
    from django.core.exceptions import ValidationError as DjangoValidationError
    from rest_framework.exceptions import ValidationError as DRFValidationError

    if isinstance(exc, DjangoValidationError):
        exc = DRFValidationError(detail=exc.message_dict if hasattr(exc, "message_dict") else exc.messages)

    # Стандартный обработчик DRF обрабатывает APIException и AuthenticationFailed
    response = exception_handler(exc, context)

    if response is not None:
        # Оборачиваем в стандартный формат
        response.data = {
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "detail": response.data,
                "status": response.status_code,
            }
        }
        return response

    # response is None → необработанное исключение (не APIException)
    request = context.get("request")
    view = context.get("view")
    logger.exception(
        "Необработанное исключение в %s.%s [%s %s]",
        view.__class__.__name__ if view else "?",
        getattr(view, "action", "?") if view else "?",
        request.method if request else "?",
        request.path if request else "?",
    )

    return Response(
        {
            "success": False,
            "error": {
                "code": "InternalServerError",
                "detail": "Внутренняя ошибка сервера.",
                "status": 500,
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound


class ArticleView(APIView):
    """
    Переопределение handle_exception на уровне конкретного вью
    для специфичной обработки ошибок.
    """

    def handle_exception(self, exc):
        # Конвертируем KeyError → 400 вместо 500
        if isinstance(exc, KeyError):
            from rest_framework.exceptions import ParseError
            exc = ParseError(f"Отсутствует обязательное поле: {exc}")

        # Делегируем стандартной логике (вызовет custom_exception_handler)
        return super().handle_exception(exc)

    def get(self, request, pk):
        try:
            article = Article.objects.get(pk=pk)
        except Article.DoesNotExist:
            raise NotFound(f"Статья {pk} не найдена")
        return Response({"id": article.pk, "title": article.title})`,
      },
      {
        filename: "settings.py",
        code: `REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "myapp.exceptions.custom_exception_handler",
}`,
      },
    ],
    explanation:
      "**handle_exception(exc)** вызывается в dispatch() при любом исключении из initial() или HTTP-метода. Стандартная реализация:\n\n" +
      "1. Если exc — AuthenticationFailed или NotAuthenticated, вызывает authenticate_header() для добавления WWW-Authenticate заголовка.\n" +
      "2. Вызывает функцию из `EXCEPTION_HANDLER` настройки.\n" +
      "3. Если обработчик вернул None — пробрасывает исключение дальше (Django поймает и вернёт 500 HTML).\n\n" +
      "**Два уровня обработки:**\n" +
      "- Глобальный: `EXCEPTION_HANDLER` в settings — для всех вью проекта.\n" +
      "- Локальный: переопределение `handle_exception()` в конкретном вью — для специфичных конвертаций.\n\n" +
      "**Django vs DRF ValidationError:** Django ValidationError не наследуется от DRF APIException, поэтому стандартный обработчик вернёт None и Django покажет HTML 500. Конвертируйте его явно в кастомном обработчике.",
  },
  {
    id: "apiview-check-permissions",
    title: "APIView.check_permissions и check_object_permissions",
    task: "Реализовать двухуровневую проверку прав: на уровне вью (может ли пользователь вообще работать с этим ресурсом) и на уровне объекта (может ли он работать с конкретной записью). Понять разницу между методами и когда каждый вызывается.",
    files: [
      {
        filename: "permissions.py",
        code: `from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsVerifiedUser(BasePermission):
    """Проверка на уровне вью — has_permission."""
    message = "Email не подтверждён. Пройдите верификацию."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        # Только верифицированные пользователи могут писать
        return (
            request.user.is_authenticated
            and getattr(request.user, "email_verified", False)
        )


class IsDocumentOwner(BasePermission):
    """Проверка на уровне объекта — has_object_permission."""
    message = "У вас нет прав на этот документ."

    def has_permission(self, request, view):
        # Для object-level permission has_permission тоже нужен
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.owner == request.user`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .permissions import IsVerifiedUser, IsDocumentOwner
from .models import Document
from .serializers import DocumentSerializer


class DocumentView(APIView):
    permission_classes = [IsVerifiedUser, IsDocumentOwner]

    def get(self, request, pk):
        document = self._get_object(pk)
        # check_object_permissions вызывается вручную в APIView
        # (в отличие от GenericAPIView, где это делает get_object())
        self.check_object_permissions(request, document)
        serializer = DocumentSerializer(document)
        return Response(serializer.data)

    def patch(self, request, pk):
        document = self._get_object(pk)
        self.check_object_permissions(request, document)
        serializer = DocumentSerializer(document, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        document = self._get_object(pk)
        self.check_object_permissions(request, document)
        document.delete()
        return Response(status=204)

    def _get_object(self, pk):
        try:
            return Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            raise NotFound(f"Документ {pk} не найден")


class DocumentListView(APIView):
    """Только check_permissions — нет конкретного объекта."""
    permission_classes = [IsVerifiedUser]

    def get(self, request):
        # check_permissions выполнился автоматически в initial()
        docs = Document.objects.filter(owner=request.user)
        return Response({"documents": list(docs.values("id", "title"))})

    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=201)`,
      },
    ],
    explanation:
      "**check_permissions(request)** вызывается автоматически в initial() для каждого запроса. Итерирует по всем permission_classes и вызывает has_permission(). При первом False или исключении — бросает PermissionDenied или NotAuthenticated.\n\n" +
      "**check_object_permissions(request, obj)** **не вызывается автоматически** в APIView. Вы должны вызвать его вручную после получения объекта. Итерирует по permission_classes и вызывает has_object_permission().\n\n" +
      "**В GenericAPIView** метод `get_object()` автоматически вызывает check_object_permissions — это главное преимущество использования обобщённых вью.\n\n" +
      "**Важный нюанс:** если has_permission() вернул False, has_object_permission() вообще не будет вызван. Поэтому в классах с object-level проверками всегда реализуйте оба метода.\n\n" +
      "**PermissionDenied vs NotAuthenticated:** DRF автоматически выбирает код ответа: 401 если пользователь не аутентифицирован, 403 если аутентифицирован, но доступ закрыт.",
  },
  {
    id: "apiview-check-throttles",
    title: "APIView.check_throttles — ограничение частоты запросов",
    task: "Настроить разные лимиты запросов для анонимных пользователей, аутентифицированных и premium-подписчиков. Добавить отдельный жёсткий лимит для дорогостоящих эндпоинтов (экспорт, отчёты).",
    files: [
      {
        filename: "throttles.py",
        code: `from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AnonThrottle(AnonRateThrottle):
    rate = "30/hour"


class StandardUserThrottle(UserRateThrottle):
    scope = "standard_user"
    rate = "200/hour"


class PremiumUserThrottle(UserRateThrottle):
    scope = "premium_user"
    # Берётся из DEFAULT_THROTTLE_RATES в settings

    def get_cache_key(self, request, view):
        # Применяем только к premium-пользователям
        if not getattr(request.user, "is_premium", False):
            return None  # None = троттлинг не применяется
        return super().get_cache_key(request, view)


class HeavyOperationThrottle(UserRateThrottle):
    """Отдельный лимит для тяжёлых операций."""
    scope = "heavy"
    rate = "10/day"`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from .throttles import (
    AnonThrottle, StandardUserThrottle,
    PremiumUserThrottle, HeavyOperationThrottle
)


class ArticleListView(APIView):
    throttle_classes = [AnonThrottle, StandardUserThrottle, PremiumUserThrottle]

    def get(self, request):
        # check_throttles() уже выполнился в initial()
        # Заголовки Retry-After и X-RateLimit-* добавляются автоматически
        return Response({"articles": []})


class ReportExportView(APIView):
    """Тяжёлый эндпоинт с жёстким суточным лимитом."""
    throttle_classes = [HeavyOperationThrottle]

    def post(self, request):
        # При превышении лимита DRF вернёт 429 Too Many Requests
        # с заголовком Retry-After: <секунды до сброса>
        return Response({"task_id": "abc123", "status": "queued"})


class DebugThrottleView(APIView):
    """Пример ручного вызова check_throttles для проверки."""

    def get(self, request):
        # check_throttles уже вызван в initial(), здесь — для демонстрации
        try:
            self.check_throttles(request)
            remaining = self._get_remaining_requests(request)
        except Exception:
            remaining = 0
        return Response({"requests_remaining": remaining})

    def _get_remaining_requests(self, request):
        for throttle in self.get_throttles():
            if hasattr(throttle, "num_requests") and hasattr(throttle, "history"):
                return max(0, throttle.num_requests - len(throttle.history))
        return None`,
      },
      {
        filename: "settings.py",
        code: `REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "myapp.throttles.AnonThrottle",
        "myapp.throttles.StandardUserThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/hour",
        "standard_user": "200/hour",
        "premium_user": "1000/hour",
        "heavy": "10/day",
    },
}`,
      },
    ],
    explanation:
      "**check_throttles(request)** вызывается в initial() после check_permissions(). Итерирует по throttle_classes и для каждого вызывает allow_request(). Если хотя бы один тротлер запрещает запрос — бросает Throttled (HTTP 429) с заголовком Retry-After.\n\n" +
      "**Механизм работы UserRateThrottle:**\n" +
      "1. Формирует cache_key на основе user id и scope.\n" +
      "2. Загружает из кэша историю временных меток запросов.\n" +
      "3. Отфильтровывает устаревшие метки (за пределами окна).\n" +
      "4. Если история длиннее лимита — запрос блокируется.\n\n" +
      "**get_cache_key() возвращает None** — стандартный способ отключить тротлер для определённой категории пользователей. Если ключ None, allow_request() всегда возвращает True для этого тротлера.\n\n" +
      "**scope** должен совпадать с ключом в DEFAULT_THROTTLE_RATES. Для одного класса можно задать rate прямо в атрибуте класса — это переопределит настройку из settings.",
  },
  {
    id: "apiview-determine-version",
    title: "APIView.determine_version — версионирование API",
    task: "Реализовать версионирование API через URL-путь (/api/v1/, /api/v2/). Маршрутизировать запросы к разной логике в зависимости от версии внутри одного класса вью без создания дублирующих эндпоинтов.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.versioning import URLPathVersioning
from .serializers import ArticleSerializerV1, ArticleSerializerV2
from .models import Article


class ArticleView(APIView):
    versioning_class = URLPathVersioning

    def get(self, request, pk):
        article = Article.objects.get(pk=pk)
        # request.version определяется через determine_version()
        # который вызывается в initial()
        version = request.version

        if version == "v2":
            # V2: расширенный ответ с метаданными и связанными объектами
            serializer = ArticleSerializerV2(article)
            return Response({
                "version": version,
                "data": serializer.data,
                "meta": {"deprecated_fields": []},
            })

        # V1: минимальный ответ для обратной совместимости
        serializer = ArticleSerializerV1(article)
        return Response(serializer.data)`,
      },
      {
        filename: "urls.py",
        code: `from django.urls import path, include
from .views import ArticleView

# URLPathVersioning ожидает именованную группу "version" в URL
v1_patterns = [
    path("articles/<int:pk>/", ArticleView.as_view(), name="article-detail"),
]

v2_patterns = [
    path("articles/<int:pk>/", ArticleView.as_view(), name="article-detail-v2"),
]

urlpatterns = [
    path("api/v1/", include((v1_patterns, "v1"))),
    path("api/v2/", include((v2_patterns, "v2"))),
]`,
      },
      {
        filename: "settings.py",
        code: `REST_FRAMEWORK = {
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1", "v2"],
    "VERSION_PARAM": "version",
}`,
      },
    ],
    explanation:
      "**determine_version(request, *args, **kwargs)** вызывается в initial() и возвращает кортеж (version, versioning_scheme). Результат записывается в request.version и request.versioning_scheme.\n\n" +
      "**Стандартная реализация** делегирует к versioning_class.determine_version(request, *args, **kwargs), которая извлекает версию из URL, заголовка или query-параметра в зависимости от класса.\n\n" +
      "**Встроенные схемы версионирования:**\n" +
      "- `URLPathVersioning` — /api/v1/articles/ (наиболее явная)\n" +
      "- `NamespaceVersioning` — через namespace URL-конфигурации\n" +
      "- `QueryParameterVersioning` — /articles/?version=v1\n" +
      "- `AcceptHeaderVersioning` — Accept: application/json; version=1.0\n" +
      "- `HostNameVersioning` — v1.api.example.com\n\n" +
      "**Если версия не разрешена:** DRF бросает NotFound. Список допустимых версий задаётся через ALLOWED_VERSIONS.\n\n" +
      "**Переопределение determine_version:** редкий случай. Используйте, если нужна нестандартная логика извлечения версии, например из JWT-токена или атрибутов пользователя.",
  },
  {
    id: "apiview-get-authenticators-permissions-throttles-renderers",
    title: "get_authenticators, get_permissions, get_throttles, get_renderers",
    task: "Реализовать динамический выбор аутентификации, разрешений, тротлинга и рендереров в зависимости от действия и параметров запроса — без создания отдельных вью для каждого случая.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import (
    SessionAuthentication, BasicAuthentication
)
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework_simplejwt.authentication import JWTAuthentication


class SmartArticleView(APIView):
    """
    Демонстрирует все четыре get_*() метода с динамической логикой.
    """

    # --- get_authenticators() ---
    # Вызывается в initialize_request() для каждого запроса.
    # Возвращает список экземпляров аутентификаторов.

    def get_authenticators(self):
        # Внутренние сервисы используют BasicAuth, внешние — JWT
        if self.request.META.get("HTTP_X_INTERNAL_SERVICE"):
            return [BasicAuthentication()]
        return [JWTAuthentication(), SessionAuthentication()]

    # --- get_permissions() ---
    # Вызывается в check_permissions() → initial().
    # Возвращает список экземпляров классов разрешений.

    def get_permissions(self):
        if self.request.method == "GET":
            # Чтение открыто для всех
            return [AllowAny()]
        if self.request.method == "DELETE":
            # Удаление только для администраторов
            return [IsAuthenticated(), IsAdminUser()]
        # POST, PUT, PATCH — только аутентифицированные
        return [IsAuthenticated()]

    # --- get_throttles() ---
    # Вызывается в check_throttles() → initial().
    # Возвращает список экземпляров тротлеров.

    def get_throttles(self):
        if self.request.method == "GET":
            # Для чтения — мягкий лимит
            return [AnonRateThrottle()]
        # Для записи — строгий лимит
        return [UserRateThrottle()]

    # --- get_renderers() ---
    # Вызывается в finalize_response() → content negotiation.
    # Возвращает список экземпляров рендереров.

    def get_renderers(self):
        # BrowsableAPIRenderer только в режиме разработки
        import os
        if os.environ.get("DJANGO_ENV") == "development":
            return [JSONRenderer(), BrowsableAPIRenderer()]
        return [JSONRenderer()]

    def get(self, request, pk=None):
        if pk:
            return Response({"id": pk, "title": "Статья"})
        return Response({"articles": []})

    def post(self, request):
        return Response({"created": True}, status=201)

    def delete(self, request, pk):
        return Response(status=204)`,
      },
    ],
    explanation:
      "Четыре метода формируют конфигурацию вью на лету при каждом запросе. Каждый возвращает список **экземпляров** (не классов):\n\n" +
      "**get_authenticators()** → вызывается в `initialize_request()`. Список аутентификаторов пробуется по порядку: первый успешный устанавливает request.user и request.auth. Если ни один не сработал — request.user = AnonymousUser.\n\n" +
      "**get_permissions()** → вызывается в `check_permissions()`. Все разрешения должны вернуть True (логика AND). Для логики OR создайте BasePermission с составным has_permission().\n\n" +
      "**get_throttles()** → вызывается в `check_throttles()`. Все тротлеры проверяются, достаточно одному запретить — придёт 429.\n\n" +
      "**get_renderers()** → вызывается в `finalize_response()`. Content negotiation выбирает рендерер по заголовку Accept запроса.\n\n" +
      "**Важно:** внутри get_authenticators() объект `self.request` — это ещё Django HttpRequest (DRF Request ещё не создан). В остальных трёх методах `self.request` — уже DRF Request.\n\n" +
      "**Альтернатива для вью с несколькими действиями:** в ViewSet используют `get_permissions()` с `self.action` вместо `self.request.method` — это удобнее при наличии кастомных @action.",
  },
  {
    id: "apiview-get-parsers",
    title: "APIView.get_parsers — динамический выбор парсеров тела запроса",
    task: "Настроить разные парсеры для разных эндпоинтов: загрузка файлов принимает multipart/form-data, обычные API — только JSON. Добавить кастомный парсер для приёма CSV-данных.",
    files: [
      {
        filename: "parsers.py",
        code: `import csv
import io
from rest_framework.parsers import BaseParser
from rest_framework.exceptions import ParseError


class CsvParser(BaseParser):
    """
    Парсит тело запроса как CSV и возвращает список словарей.
    Content-Type: text/csv
    """
    media_type = "text/csv"

    def parse(self, stream, media_type=None, parser_context=None):
        try:
            text = stream.read().decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            return list(reader)
        except Exception as exc:
            raise ParseError(f"Ошибка парсинга CSV: {exc}") from exc`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from .parsers import CsvParser
from .models import Product
from .serializers import ProductSerializer


class ProductView(APIView):
    """Обычный JSON-эндпоинт — только JSONParser."""
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class ProductUploadView(APIView):
    """
    Динамический выбор парсера через get_parsers().
    POST /upload/  → multipart (файл) или JSON (данные)
    POST /import/  → CSV
    """

    def get_parsers(self):
        # request ещё не готов как DRF Request на этом этапе,
        # поэтому используем self.kwargs или path
        action = self.kwargs.get("action", "")
        if action == "import":
            return [CsvParser()]
        # Для загрузки файлов — multipart + form, плюс JSON как fallback
        return [MultiPartParser(), FormParser(), JSONParser()]

    def post(self, request, action):
        if action == "import":
            # request.data — список словарей из CSV
            rows = request.data
            created = Product.objects.bulk_create([
                Product(name=row["name"], price=float(row["price"]))
                for row in rows
            ])
            return Response({"imported": len(created)}, status=201)

        # Загрузка файла
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "Файл не передан"}, status=400)
        return Response({"filename": file_obj.name, "size": file_obj.size})`,
      },
      {
        filename: "urls.py",
        code: `from django.urls import path
from .views import ProductView, ProductUploadView

urlpatterns = [
    path("products/", ProductView.as_view()),
    path("products/<str:action>/", ProductUploadView.as_view()),
    # POST /products/import/  — CSV
    # POST /products/upload/  — multipart
]`,
      },
    ],
    explanation:
      "**get_parsers()** вызывается в `initialize_request()` при создании DRF Request. Возвращает список экземпляров парсеров, которые будут пробоваться по Content-Type входящего запроса.\n\n" +
      "Стандартная реализация просто возвращает `[p() for p in self.parser_classes]`. Глобальные парсеры задаются через `DEFAULT_PARSER_CLASSES` в settings.\n\n" +
      "**Важное ограничение:** на момент вызова `get_parsers()` объект `self.request` — это ещё Django HttpRequest, а не DRF Request (он создаётся чуть позже). Поэтому для динамической логики используйте `self.kwargs`, `self.args` или анализируйте `self.request.META` напрямую.\n\n" +
      "**Встроенные парсеры DRF:**\n" +
      "- `JSONParser` — application/json\n" +
      "- `FormParser` — application/x-www-form-urlencoded\n" +
      "- `MultiPartParser` — multipart/form-data (файлы)\n" +
      "- `FileUploadParser` — загрузка одного файла с именем в URL\n\n" +
      "**Кастомный парсер:** наследуйте от `BaseParser`, задайте `media_type` и реализуйте `parse(stream, media_type, parser_context)`. Метод должен вернуть данные (dict, list и т.д.) — они попадут в `request.data`.",
  },
  {
    id: "apiview-get-content-negotiator",
    title: "APIView.get_content_negotiator — согласование формата ответа",
    task: "Разобраться, как DRF выбирает формат ответа по заголовку Accept. Реализовать кастомный контент-неготиатор, который отдаёт приоритет JSON над любым другим форматом и игнорирует некорректные Accept-заголовки вместо возврата 406.",
    files: [
      {
        filename: "negotiation.py",
        code: `from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.exceptions import NotAcceptable


class JsonPreferredNegotiation(DefaultContentNegotiation):
    """
    Модифицированный negotiator:
    1. Если клиент принимает application/json — всегда отдаём JSON.
    2. При некорректном Accept или отсутствии подходящего рендерера
       используем первый доступный рендерер вместо 406.
    """

    def select_renderer(self, request, renderers, format_suffix=None):
        # Если Accept содержит application/json — возвращаем JSONRenderer
        accept_header = request.META.get("HTTP_ACCEPT", "")
        if "application/json" in accept_header:
            for renderer in renderers:
                if renderer.media_type == "application/json":
                    return renderer, renderer.media_type

        try:
            return super().select_renderer(request, renderers, format_suffix)
        except NotAcceptable:
            # Fallback: первый рендерер вместо 406 Not Acceptable
            if renderers:
                return renderers[0], renderers[0].media_type
            raise`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from .negotiation import JsonPreferredNegotiation


class ArticleView(APIView):
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    content_negotiation_class = JsonPreferredNegotiation

    def get_content_negotiator(self):
        # get_content_negotiator() вызывается в initialize_request()
        # Стандартная реализация: return self.content_negotiation_class()
        # Здесь можно переопределить логику выбора negotiator-а
        if self.request.META.get("HTTP_X_FORCE_JSON"):
            from rest_framework.negotiation import DefaultContentNegotiation
            # Можно вернуть другой negotiator для внутренних запросов
            return DefaultContentNegotiation()
        return self.content_negotiation_class()

    def get(self, request):
        # Выбранный рендерер доступен после finalize_response(),
        # но content negotiation произошёл при вызове initialize_request()
        return Response({
            "articles": [],
            "negotiated_format": request.accepted_renderer.media_type,
        })`,
      },
    ],
    explanation:
      "**get_content_negotiator()** вызывается в `initialize_request()` и возвращает экземпляр класса, который будет выбирать рендерер и парсер по заголовкам Accept и Content-Type.\n\n" +
      "Стандартная реализация просто возвращает `self.content_negotiation_class()` (по умолчанию `DefaultContentNegotiation`).\n\n" +
      "**Как работает content negotiation:**\n" +
      "1. Клиент отправляет заголовок `Accept: application/json, text/html;q=0.9`.\n" +
      "2. `select_renderer()` сопоставляет медиатипы из Accept с доступными рендерерами.\n" +
      "3. Побеждает рендерер с наибольшим приоритетом (q-value).\n" +
      "4. При полном несовпадении — 406 Not Acceptable.\n\n" +
      "**Когда переопределять:** переопределение `get_content_negotiator()` нужно редко. Чаще достаточно создать кастомный класс negotiator и указать его в `content_negotiation_class` или `DEFAULT_CONTENT_NEGOTIATION_CLASS` в settings.\n\n" +
      "**request.accepted_renderer** и **request.accepted_media_type** — атрибуты, выставляемые negotiator-ом, доступны в методах вью после прохождения initial().",
  },
  {
    id: "apiview-get-exception-handler",
    title: "APIView.get_exception_handler — получение обработчика исключений",
    task: "Настроить разные обработчики ошибок для публичного API и внутреннего административного API: публичный скрывает детали системных ошибок, внутренний возвращает полный traceback для отладки.",
    files: [
      {
        filename: "exception_handlers.py",
        code: `import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def public_exception_handler(exc, context):
    """
    Для публичного API: скрываем внутренние детали ошибок сервера.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Стандартные API-исключения — оборачиваем в единый формат
        return Response(
            {"success": False, "error": response.data},
            status=response.status_code,
        )

    # Необработанные исключения (не APIException) — скрываем детали
    return Response(
        {"success": False, "error": "Внутренняя ошибка сервера."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def internal_exception_handler(exc, context):
    """
    Для внутреннего API: возвращаем полный traceback для отладки.
    """
    response = exception_handler(exc, context)

    if response is not None:
        return Response(
            {"success": False, "error": response.data},
            status=response.status_code,
        )

    tb = traceback.format_exc()
    return Response(
        {
            "success": False,
            "error": str(exc),
            "exception_type": type(exc).__name__,
            "traceback": tb.splitlines(),
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from .exception_handlers import public_exception_handler, internal_exception_handler


class PublicBaseView(APIView):
    """Базовый класс для публичного API."""

    def get_exception_handler(self):
        # get_exception_handler() вызывается внутри handle_exception().
        # Стандартная реализация:
        #   return self.settings.EXCEPTION_HANDLER
        # Переопределение позволяет задать обработчик на уровне класса.
        return public_exception_handler


class InternalBaseView(APIView):
    """Базовый класс для внутреннего административного API."""

    def get_exception_handler(self):
        return internal_exception_handler


# --- Конкретные вью наследуют от нужного базового класса ---

class ArticleView(PublicBaseView):
    def get(self, request, pk):
        article = Article.objects.get(pk=pk)  # DoesNotExist → 500 скрыт
        return Response({"id": article.pk})


class AdminStatsView(InternalBaseView):
    def get(self, request):
        # При ошибке внутренний API покажет traceback
        stats = compute_heavy_stats()
        return Response(stats)`,
      },
    ],
    explanation:
      "**get_exception_handler()** вызывается внутри `handle_exception()` и возвращает callable с сигнатурой `handler(exc, context) → Response | None`.\n\n" +
      "Стандартная реализация возвращает значение `EXCEPTION_HANDLER` из настроек DRF. Переопределение на уровне класса позволяет использовать разные обработчики для разных групп вью без изменения глобальных настроек.\n\n" +
      "**Сигнатура обработчика:**\n" +
      "```python\n" +
      "def handler(exc, context):\n" +
      "    # exc — исключение\n" +
      "    # context — {'view': view, 'args': args, 'kwargs': kwargs, 'request': request}\n" +
      "    # Вернуть Response или None (None → исключение пробрасывается дальше)\n" +
      "```\n\n" +
      "**Порядок приоритетов** (от частного к общему):\n" +
      "1. Переопределённый `get_exception_handler()` в конкретном вью.\n" +
      "2. Переопределённый `get_exception_handler()` в базовом классе.\n" +
      "3. Глобальный `EXCEPTION_HANDLER` в settings.\n\n" +
      "**Не путать с `handle_exception()`:** `handle_exception()` — метод вью, который управляет всем процессом обработки ошибок. `get_exception_handler()` — только возвращает функцию-обработчик, которую `handle_exception()` затем вызывает.",
  },
  {
    id: "apiview-get-format-suffix",
    title: "APIView.get_format_suffix — суффиксы формата в URL",
    task: "Включить поддержку суффиксов формата в URL (/articles.json, /articles.csv), чтобы клиенты могли запрашивать нужный формат ответа без заголовка Accept. Добавить CSV-рендерер наряду со стандартным JSON.",
    files: [
      {
        filename: "renderers.py",
        code: `import csv
import io
from rest_framework.renderers import BaseRenderer


class CsvRenderer(BaseRenderer):
    """
    Рендерер для выгрузки данных в CSV.
    Принимает список словарей или QuerySet.values().
    """
    media_type = "text/csv"
    format = "csv"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if not data:
            return ""

        # Поддерживаем как список словарей, так и обёрнутые ответы
        rows = data if isinstance(data, list) else data.get("results", [data])
        if not rows:
            return ""

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        return output.getvalue()`,
      },
      {
        filename: "views.py",
        code: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.decorators import api_view, renderer_classes
from .renderers import CsvRenderer
from .models import Article
from .serializers import ArticleSerializer


class ArticleListView(APIView):
    renderer_classes = [JSONRenderer, CsvRenderer, BrowsableAPIRenderer]

    def get_format_suffix(self, **kwargs):
        # get_format_suffix() читает URL-параметр "format" из kwargs
        # (добавляется роутером через format_suffix_patterns).
        # Стандартная реализация:
        #   return kwargs.get(self.settings.FORMAT_SUFFIX_KWARG)
        # Переопределение позволяет добавить логику алиасов.
        suffix = super().get_format_suffix(**kwargs)
        # Алиас: ?format=excel → обрабатываем как csv
        if suffix == "excel":
            return "csv"
        return suffix

    def get(self, request, format=None):
        # request.accepted_renderer.format — "json", "csv", или "api"
        articles = Article.objects.select_related("author").order_by("-created_at")
        if request.accepted_renderer.format == "csv":
            # Для CSV отдаём плоские данные без пагинации
            data = list(articles.values("id", "title", "author__username", "created_at"))
            return Response(data)
        serializer = ArticleSerializer(articles, many=True)
        return Response({"results": serializer.data, "count": articles.count()})`,
      },
      {
        filename: "urls.py",
        code: `from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from .views import ArticleListView

urlpatterns = [
    path("articles/", ArticleListView.as_view(), name="article-list"),
]

# format_suffix_patterns добавляет необязательный суффикс .<format> к URL:
# /articles/        → content negotiation по заголовку Accept
# /articles.json    → принудительно JSON
# /articles.csv     → принудительно CSV
# /articles.api     → BrowsableAPI
urlpatterns = format_suffix_patterns(urlpatterns, allowed=["json", "csv", "api"])`,
      },
    ],
    explanation:
      "**get_format_suffix(**kwargs)** вызывается в начале `dispatch()` для извлечения суффикса формата из URL (`.json`, `.csv` и т.д.). Результат передаётся в content negotiator как `format_suffix`, что позволяет принудительно выбрать рендерер.\n\n" +
      "Стандартная реализация читает `kwargs[FORMAT_SUFFIX_KWARG]` (по умолчанию `'format'`). Параметр появляется в kwargs только если URL обёрнут через `format_suffix_patterns()`.\n\n" +
      "**format_suffix_patterns()** — вспомогательная функция DRF, которая дублирует каждый URL-маршрут с необязательным суффиксом:\n" +
      "```\n" +
      "/articles/      → оригинальный маршрут\n" +
      "/articles.json  → тот же маршрут, kwargs['format'] = 'json'\n" +
      "```\n\n" +
      "**Суффикс vs заголовок Accept:** при наличии суффикса в URL content negotiator игнорирует заголовок Accept. Это удобно для CLI-инструментов (`curl /api/articles.json`) и прямых ссылок на экспорт.\n\n" +
      "**format=None в сигнатуре метода** — Django передаёт суффикс формата как именованный аргумент `format` в HTTP-методы вью. Всегда добавляйте `format=None` в сигнатуру `get()`, `post()` и т.д., если используете format_suffix_patterns, чтобы избежать TypeError.",
  },
  {
    id: "generic-get-queryset",
    title: "GenericAPIView.get_queryset — динамическое формирование QuerySet",
    task: "Реализовать эндпоинт списка статей, где QuerySet зависит от текущего пользователя: администраторы видят все статьи, авторизованные — только свои и опубликованные, анонимы — только опубликованные. Исключить N+1 запросы.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import ArticleSerializer


class ArticleListView(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Переопределяем get_queryset() для динамической фильтрации.
        Вызывается при каждом запросе — можно использовать self.request.
        """
        # Базовый queryset с оптимизацией запросов
        qs = (
            Article.objects
            .select_related("author")
            .prefetch_related("tags")
            .order_by("-created_at")
        )

        user = self.request.user

        if not user.is_authenticated:
            # Анонимы — только опубликованные
            return qs.filter(status="published")

        if user.is_staff:
            # Администраторы — все статьи
            return qs

        # Авторизованные — свои (любой статус) + чужие опубликованные
        return qs.filter(status="published") | qs.filter(author=user)


class UserArticleListView(generics.ListAPIView):
    """Статьи конкретного пользователя из URL."""
    serializer_class = ArticleSerializer

    def get_queryset(self):
        # self.kwargs содержит параметры URL
        username = self.kwargs["username"]
        return (
            Article.objects
            .filter(author__username=username, status="published")
            .select_related("author")
            .order_by("-created_at")
        )`,
      },
    ],
    explanation:
      "**get_queryset()** — основной метод для получения набора объектов в GenericAPIView. Вызывается в `list()`, `retrieve()`, `update()` и `destroy()` через `get_object()`.\n\n" +
      "Стандартная реализация возвращает `self.queryset`. Переопределение необходимо всегда, когда QuerySet зависит от запроса, пользователя или параметров URL.\n\n" +
      "**Почему не атрибут queryset?** Атрибут `queryset` вычисляется один раз при загрузке класса. Если написать `queryset = Article.objects.filter(...)`, Django кэширует этот QuerySet и не будет перевычислять его при каждом запросе. `get_queryset()` вызывается заново для каждого запроса.\n\n" +
      "**Правило DRF:** если задан атрибут `queryset`, обязательно вызовите `self.queryset.all()` вместо `self.queryset` напрямую — `.all()` возвращает клон QuerySet, сбрасывая кэш результатов:\n" +
      "```python\n" +
      "def get_queryset(self):\n" +
      "    assert self.queryset is not None, '...'\n" +
      "    return self.queryset.all()  # не self.queryset\n" +
      "```\n\n" +
      "**select_related / prefetch_related** в `get_queryset()` — правильное место для оптимизации, так как они применяются ко всем операциям, использующим этот QuerySet.",
  },
  {
    id: "generic-get-object",
    title: "GenericAPIView.get_object — получение и проверка одного объекта",
    task: "Реализовать эндпоинт детальной страницы статьи с поиском не только по первичному ключу, но и по slug. Убедиться, что object-level permissions проверяются автоматически и нет возможности обойти авторизацию.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.exceptions import NotFound
from django.db.models import Q
from .models import Article
from .serializers import ArticleSerializer
from .permissions import IsOwnerOrReadOnly


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    # lookup_field по умолчанию "pk", меняем на "slug"
    lookup_field = "slug"

    def get_queryset(self):
        return Article.objects.select_related("author").prefetch_related("tags")

    # get_object() вызывать напрямую не нужно — generics делают это сами.
    # Переопределяем только если нужна нестандартная логика поиска.


class ArticleFlexibleDetailView(generics.RetrieveAPIView):
    """Поиск по pk ИЛИ по slug — определяем по формату параметра."""
    serializer_class = ArticleSerializer

    def get_queryset(self):
        return Article.objects.select_related("author")

    def get_object(self):
        lookup = self.kwargs["lookup"]

        # Определяем тип lookup: число → pk, строка → slug
        filter_kwargs = (
            {"pk": int(lookup)}
            if lookup.isdigit()
            else {"slug": lookup}
        )

        try:
            obj = self.get_queryset().get(**filter_kwargs)
        except (Article.DoesNotExist, ValueError):
            raise NotFound("Статья не найдена.")

        # ОБЯЗАТЕЛЬНО: проверяем object-level permissions
        # get_object() в GenericAPIView делает это автоматически,
        # но при ручном переопределении — вызываем сами
        self.check_object_permissions(self.request, obj)

        return obj`,
      },
      {
        filename: "urls.py",
        code: `from django.urls import path
from .views import ArticleDetailView, ArticleFlexibleDetailView

urlpatterns = [
    # Стандартный поиск по slug
    path("articles/<slug:slug>/", ArticleDetailView.as_view()),
    # Гибкий поиск: pk или slug
    path("articles/<str:lookup>/", ArticleFlexibleDetailView.as_view()),
]`,
      },
    ],
    explanation:
      "**get_object()** выполняет три шага:\n" +
      "1. Вызывает `get_queryset()` для получения базового QuerySet.\n" +
      "2. Применяет `filter_queryset()` (фильтры, поиск).\n" +
      "3. Ищет объект по `lookup_field` (по умолчанию `pk`) из `self.kwargs`.\n" +
      "4. Вызывает `check_object_permissions(request, obj)`.\n" +
      "5. При отсутствии объекта — бросает NotFound (HTTP 404).\n\n" +
      "**Важнейшее правило:** при ручном переопределении `get_object()` никогда не забывайте вызвать `self.check_object_permissions(self.request, obj)`. Стандартный `get_object()` делает это автоматически — это главная причина использовать его, а не `Model.objects.get()` напрямую.\n\n" +
      "**lookup_field vs lookup_url_kwarg:**\n" +
      "- `lookup_field` — имя поля модели для поиска (по умолчанию `'pk'`).\n" +
      "- `lookup_url_kwarg` — имя параметра в URL (по умолчанию совпадает с `lookup_field`).\n\n" +
      "```python\n" +
      "# Ищем по полю 'slug', но в URL параметр называется 'article_slug'\n" +
      "lookup_field = 'slug'\n" +
      "lookup_url_kwarg = 'article_slug'\n" +
      "# URL: /articles/<article_slug>/\n" +
      "```",
  },
  {
    id: "generic-get-serializer",
    title: "GenericAPIView.get_serializer — создание экземпляра сериализатора",
    task: "Разобраться, как GenericAPIView создаёт сериализаторы и как передать в них дополнительный контекст. Реализовать вью, где сериализатор получает текущего пользователя и флаг режима создания для условной валидации.",
    files: [
      {
        filename: "serializers.py",
        code: `from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    # Поле только для записи — не показываем в ответе
    send_notification = serializers.BooleanField(write_only=True, default=False)

    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "send_notification", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_title(self, value):
        # Используем контекст для условной валидации
        request = self.context.get("request")
        is_create = self.context.get("is_create", False)

        if is_create and len(value) < 10:
            raise serializers.ValidationError(
                "При создании заголовок должен быть не короче 10 символов."
            )
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        # Проверяем лимит черновиков для конкретного пользователя
        if attrs.get("status") == "draft" and self.context.get("is_create"):
            draft_count = Article.objects.filter(
                author=request.user, status="draft"
            ).count()
            if draft_count >= 10:
                raise serializers.ValidationError(
                    "Нельзя иметь более 10 черновиков одновременно."
                )
        return attrs`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Article
from .serializers import ArticleSerializer


class ArticleCreateView(generics.CreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer(self, *args, **kwargs):
        """
        Вызывается автоматически в perform_create() → create().
        Добавляем флаг is_create в kwargs, который попадёт в context.
        """
        kwargs["is_create"] = True  # наш кастомный флаг
        return super().get_serializer(*args, **kwargs)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Стандартный контекст уже содержит request, format, view.
        # Добавляем свои данные:
        context["is_create"] = True
        return context

    def perform_create(self, serializer):
        send = serializer.validated_data.pop("send_notification", False)
        instance = serializer.save(author=self.request.user)
        if send:
            notify_subscribers.delay(instance.pk)


class ArticleUpdateView(generics.UpdateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]
    queryset = Article.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["is_create"] = False  # это обновление
        return context`,
      },
    ],
    explanation:
      "**get_serializer(*args, **kwargs)** — фабричный метод, создающий экземпляр сериализатора. Стандартная реализация:\n" +
      "```python\n" +
      "def get_serializer(self, *args, **kwargs):\n" +
      "    serializer_class = self.get_serializer_class()\n" +
      "    kwargs.setdefault('context', self.get_serializer_context())\n" +
      "    return serializer_class(*args, **kwargs)\n" +
      "```\n\n" +
      "**Два способа добавить данные в сериализатор:**\n\n" +
      "1. Через `get_serializer_context()` — данные попадают в `self.context` сериализатора. Подходит для данных, которые нужны при валидации и сериализации (request, флаги режима).\n\n" +
      "2. Через переопределение `get_serializer()` — можно менять аргументы конструктора (instance, data, many, partial). Используйте для логики, которая зависит от того, что передаётся в сериализатор.\n\n" +
      "**Стандартный context** всегда содержит три ключа: `request`, `format`, `view`. Они доступны в любом сериализаторе без дополнительной настройки.\n\n" +
      "**kwargs.setdefault('context', ...)** означает: если вызывающий код уже передал `context`, он не будет перезаписан. Это важно при ручном вызове `get_serializer(data=..., context={...})`.",
  },
  {
    id: "generic-get-serializer-class",
    title: "GenericAPIView.get_serializer_class — выбор класса сериализатора",
    task: "Реализовать вью, которое использует разные сериализаторы в зависимости от HTTP-метода: компактный для списка, полный для детальной страницы, отдельный для записи. Избежать дублирования полей между классами.",
    files: [
      {
        filename: "serializers.py",
        code: `from rest_framework import serializers
from .models import Article


class ArticleListSerializer(serializers.ModelSerializer):
    """Компактный — только для списков."""
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "author_name", "status", "created_at"]


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Полный — для чтения одного объекта."""
    author = serializers.StringRelatedField()
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    class Meta:
        model = Article
        fields = ["id", "title", "body", "author", "tags", "status", "created_at", "updated_at"]


class ArticleWriteSerializer(serializers.ModelSerializer):
    """Для создания и обновления — отдельные поля валидации."""
    tags = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = Article
        fields = ["title", "body", "tags", "status"]

    def validate_body(self, value):
        if len(value.split()) < 50:
            raise serializers.ValidationError("Тело статьи должно содержать не менее 50 слов.")
        return value`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics, mixins
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer, ArticleWriteSerializer
)


class ArticleListView(generics.ListCreateAPIView):
    queryset = Article.objects.select_related("author").order_by("-created_at")
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        # Метод вызывается в get_serializer() при каждом запросе.
        # self.request доступен — можно смотреть на метод, пользователя и т.д.
        if self.request.method == "GET":
            return ArticleListSerializer
        # POST — запись
        return ArticleWriteSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.select_related("author").prefetch_related("tags")
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ArticleWriteSerializer
        # GET, DELETE
        return ArticleDetailSerializer


class AdminArticleView(generics.ListAPIView):
    """Другой сериализатор для администраторов."""

    def get_serializer_class(self):
        # Доступ к атрибутам пользователя для выбора сериализатора
        if self.request.user.is_staff:
            return ArticleDetailSerializer  # администраторы видят все поля
        return ArticleListSerializer`,
      },
    ],
    explanation:
      "**get_serializer_class()** вызывается в `get_serializer()` и должен вернуть **класс** (не экземпляр) сериализатора.\n\n" +
      "Стандартная реализация:\n" +
      "```python\n" +
      "def get_serializer_class(self):\n" +
      "    assert self.serializer_class is not None, '...'\n" +
      "    return self.serializer_class\n" +
      "```\n\n" +
      "**Типичные критерии выбора:**\n" +
      "- `self.request.method` — разные сериализаторы для чтения и записи.\n" +
      "- `self.action` (ViewSet) — list, retrieve, create, update имеют разные потребности.\n" +
      "- `self.request.user` — администраторы видят служебные поля.\n" +
      "- `self.kwargs` — параметры URL влияют на глубину сериализации.\n\n" +
      "**Паттерн «read/write сериализаторы»** снижает сложность: write-сериализатор содержит валидацию входных данных, read-сериализатор — вычисляемые поля и связанные объекты. Попытка совместить всё в одном классе приводит к громоздкому коду с `read_only_fields` и `write_only_fields`.",
  },
  {
    id: "generic-get-serializer-context",
    title: "GenericAPIView.get_serializer_context — контекст для сериализатора",
    task: "Передать в сериализатор данные, необходимые для условной сериализации: роль пользователя для сокрытия чувствительных полей и текущий курс валюты для конвертации цен без дополнительных запросов к БД.",
    files: [
      {
        filename: "serializers.py",
        code: `from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    price_display = serializers.SerializerMethodField()
    cost_price = serializers.SerializerMethodField()  # только для staff

    class Meta:
        model = Product
        fields = ["id", "name", "price_display", "cost_price", "stock"]

    def get_price_display(self, obj):
        # Получаем курс из контекста — он уже загружен во вью,
        # не делаем дополнительный запрос на каждый объект
        rate = self.context.get("exchange_rate", 1.0)
        currency = self.context.get("currency", "RUB")
        converted = round(obj.price_rub * rate, 2)
        return {"amount": converted, "currency": currency}

    def get_cost_price(self, obj):
        # Чувствительное поле — только для сотрудников
        request = self.context.get("request")
        if not (request and request.user.is_staff):
            return None
        return obj.cost_price_rub

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Убираем поле из ответа совсем, если пользователь не staff
        if data.get("cost_price") is None:
            data.pop("cost_price", None)
        return data`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer
from .services import get_exchange_rate  # кэшированный сервис курсов валют


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_active=True).order_by("name")

    def get_serializer_context(self):
        # Стандартный контекст: request, format, view
        context = super().get_serializer_context()

        # Добавляем курс валюты — запрашиваем один раз для всего списка,
        # а не внутри каждого вызова SerializerMethodField
        currency = self.request.query_params.get("currency", "RUB")
        if currency != "RUB":
            context["exchange_rate"] = get_exchange_rate("RUB", currency)
            context["currency"] = currency
        else:
            context["exchange_rate"] = 1.0
            context["currency"] = "RUB"

        return context`,
      },
    ],
    explanation:
      "**get_serializer_context()** вызывается внутри `get_serializer()` и возвращает словарь, доступный в сериализаторе через `self.context`.\n\n" +
      "Стандартная реализация возвращает:\n" +
      "```python\n" +
      "{\n" +
      "    'request': self.request,\n" +
      "    'format': self.format_kwarg,\n" +
      "    'view': self,\n" +
      "}\n" +
      "```\n\n" +
      "**Ключевое применение — вынос дорогих операций из SerializerMethodField.** Если метод поля делает запрос к внешнему API или БД, он будет вызываться для каждого объекта в списке. Правильно — загрузить данные один раз в `get_serializer_context()` и передать через контекст.\n\n" +
      "**request в контексте** — один из самых часто используемых элементов. Даёт сериализатору доступ к текущему пользователю, его правам и параметрам запроса без передачи через конструктор.\n\n" +
      "**Вызов super() обязателен:** без него стандартные ключи (`request`, `format`, `view`) будут отсутствовать, и многие встроенные возможности DRF (HyperlinkedModelSerializer, поля с request) перестанут работать.",
  },
  {
    id: "generic-filter-queryset",
    title: "GenericAPIView.filter_queryset — применение фильтров к QuerySet",
    task: "Понять, как GenericAPIView применяет фильтры, и реализовать кастомный бэкенд фильтрации по геолокации: возвращать объекты в радиусе N км от переданных координат.",
    files: [
      {
        filename: "filters.py",
        code: `from rest_framework.filters import BaseFilterBackend
from django.db.models import FloatField
from django.db.models.functions import ACos, Cos, Radians, Sin
import math


class GeoRadiusFilter(BaseFilterBackend):
    """
    Фильтрует объекты по радиусу от переданных координат.
    Параметры: ?lat=55.75&lon=37.62&radius=10 (км)
    Модель должна иметь поля latitude и longitude (FloatField).
    """

    def filter_queryset(self, request, queryset, view):
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")
        radius_km = request.query_params.get("radius", "10")

        if not (lat and lon):
            return queryset  # параметры не переданы — не фильтруем

        try:
            lat = float(lat)
            lon = float(lon)
            radius_km = float(radius_km)
        except ValueError:
            return queryset  # некорректные значения — игнорируем

        # Формула гаверсинуса через аннотацию Django ORM
        EARTH_RADIUS_KM = 6371.0
        return (
            queryset
            .annotate(
                distance_km=EARTH_RADIUS_KM * ACos(
                    Cos(Radians(lat)) * Cos(Radians("latitude")) *
                    Cos(Radians("longitude") - Radians(lon)) +
                    Sin(Radians(lat)) * Sin(Radians("latitude")),
                    output_field=FloatField(),
                )
            )
            .filter(distance_km__lte=radius_km)
            .order_by("distance_km")
        )

    def get_schema_operation_parameters(self, view):
        # Для автогенерации документации (drf-spectacular и др.)
        return [
            {"name": "lat", "in": "query", "description": "Широта", "schema": {"type": "number"}},
            {"name": "lon", "in": "query", "description": "Долгота", "schema": {"type": "number"}},
            {"name": "radius", "in": "query", "description": "Радиус в км", "schema": {"type": "number"}},
        ]`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .filters import GeoRadiusFilter
from .models import Place
from .serializers import PlaceSerializer


class PlaceListView(generics.ListAPIView):
    serializer_class = PlaceSerializer
    queryset = Place.objects.filter(is_active=True)
    filter_backends = [GeoRadiusFilter, DjangoFilterBackend, SearchFilter]
    search_fields = ["name", "description"]
    filterset_fields = ["category", "city"]

    # filter_queryset() вызывается автоматически в list() и get_object().
    # Переопределяем только если нужна нестандартная логика применения фильтров.

    def filter_queryset(self, queryset):
        # super() последовательно применяет все filter_backends
        queryset = super().filter_queryset(queryset)

        # Можно добавить постобработку после всех фильтров
        # Например, принудительно ограничить выдачу для анонимов
        if not self.request.user.is_authenticated:
            queryset = queryset[:100]

        return queryset`,
      },
    ],
    explanation:
      "**filter_queryset(queryset)** вызывается в `list()` перед пагинацией и в `get_object()` перед поиском по lookup_field. Последовательно применяет все классы из `filter_backends`, передавая queryset из одного в другой.\n\n" +
      "Стандартная реализация:\n" +
      "```python\n" +
      "def filter_queryset(self, queryset):\n" +
      "    for backend in list(self.filter_backends):\n" +
      "        queryset = backend().filter_queryset(self.request, queryset, self)\n" +
      "    return queryset\n" +
      "```\n\n" +
      "**Кастомный FilterBackend** — предпочтительный способ добавить фильтрацию. Реализуйте `filter_queryset(request, queryset, view)` в отдельном классе и добавьте его в `filter_backends`. Это лучше, чем переопределять `get_queryset()`, потому что бэкенды переиспользуемы.\n\n" +
      "**Порядок бэкендов имеет значение:** каждый следующий получает уже отфильтрованный queryset. Ставьте самые ограничивающие фильтры первыми для оптимизации запросов к БД.\n\n" +
      "**filter_queryset в get_object():** многие разработчики не знают, что `filter_queryset()` вызывается и при получении одного объекта. Это дополнительный уровень безопасности — пользователь не сможет получить объект по pk, если он не проходит через фильтры.",
  },
  {
    id: "generic-paginate-queryset",
    title: "GenericAPIView.paginate_queryset — пагинация списков",
    task: "Настроить пагинацию для списка статей с возможностью отключить её для экспорта. Реализовать условную пагинацию: включать для обычных запросов, отключать при запросе с ?no_page=1 от администраторов.",
    files: [
      {
        filename: "pagination.py",
        code: `from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import ArticleSerializer
from .pagination import StandardPagination


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    pagination_class = StandardPagination
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Article.objects.select_related("author").order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # Администраторы могут запросить весь список без пагинации
        no_page = request.query_params.get("no_page") and request.user.is_staff
        if no_page:
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                "count": queryset.count(),
                "results": serializer.data,
                "paginated": False,
            })

        # Стандартная пагинация через paginate_queryset()
        # Возвращает страницу или None если pagination_class не задан
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ArticleExportView(generics.ListAPIView):
    """Эндпоинт экспорта — пагинация отключена полностью."""
    serializer_class = ArticleSerializer
    pagination_class = None  # переопределяем атрибут класса

    def get_queryset(self):
        return Article.objects.select_related("author").order_by("-created_at")`,
      },
    ],
    explanation:
      "**paginate_queryset(queryset)** проверяет, задан ли `pagination_class`, и если да — возвращает срез данных для текущей страницы. Если `pagination_class = None` — возвращает `None`.\n\n" +
      "Стандартная реализация:\n" +
      "```python\n" +
      "def paginate_queryset(self, queryset):\n" +
      "    if self.paginator is None:\n" +
      "        return None\n" +
      "    return self.paginator.paginate_queryset(queryset, self.request, view=self)\n" +
      "```\n\n" +
      "`self.paginator` — кэшированное свойство, создающее экземпляр `pagination_class()` при первом обращении.\n\n" +
      "**Паттерн проверки в list():**\n" +
      "```python\n" +
      "page = self.paginate_queryset(queryset)\n" +
      "if page is not None:          # пагинация включена\n" +
      "    serializer = self.get_serializer(page, many=True)\n" +
      "    return self.get_paginated_response(serializer.data)\n" +
      "serializer = self.get_serializer(queryset, many=True)  # без пагинации\n" +
      "return Response(serializer.data)\n" +
      "```\n" +
      "Этот паттерн используется во всех стандартных `ListModelMixin` и обязателен при ручной реализации `list()`.\n\n" +
      "**Отключение пагинации:** `pagination_class = None` на уровне класса или глобально через `DEFAULT_PAGINATION_CLASS = None` в settings.",
  },
  {
    id: "generic-get-paginated-response",
    title: "GenericAPIView.get_paginated_response — формирование пагинированного ответа",
    task: "Понять связку paginate_queryset + get_paginated_response и реализовать кастомный пагинатор с расширенным форматом ответа: вложить данные в 'items', добавить метаданные о странице и ссылки навигации.",
    files: [
      {
        filename: "pagination.py",
        code: `from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
import math


class EnvelopePagination(PageNumberPagination):
    """
    Пагинатор с расширенным форматом ответа.
    Данные вложены в 'items', метаданные — в 'pagination'.
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200

    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request)
        total_pages = math.ceil(self.page.paginator.count / page_size) if page_size else 1
        return Response({
            "items": data,
            "pagination": {
                "total": self.page.paginator.count,
                "page": self.page.number,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "links": {
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
            },
        })

    def get_paginated_response_schema(self, schema):
        # Для совместимости с drf-spectacular (генерация OpenAPI)
        return {
            "type": "object",
            "required": ["items", "pagination"],
            "properties": {
                "items": schema,
                "pagination": {
                    "type": "object",
                    "properties": {
                        "total": {"type": "integer"},
                        "page": {"type": "integer"},
                        "page_size": {"type": "integer"},
                        "total_pages": {"type": "integer"},
                        "has_next": {"type": "boolean"},
                        "has_previous": {"type": "boolean"},
                    },
                },
            },
        }`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics
from .models import Article
from .serializers import ArticleSerializer
from .pagination import EnvelopePagination


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    pagination_class = EnvelopePagination
    queryset = Article.objects.select_related("author").order_by("-created_at")

    # get_paginated_response() вызывается в list() автоматически.
    # Переопределять его в вью нет необходимости — кастомизация
    # делается через pagination_class.get_paginated_response().

    # Можно переопределить get_paginated_response() прямо во вью,
    # если нужен уникальный формат только для этого эндпоинта:
    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        # Добавляем мета-поле специфичное для этого вью
        response.data["_endpoint"] = "articles"
        return response`,
      },
    ],
    explanation:
      "**get_paginated_response(data)** вызывается в `list()` после сериализации страницы данных. Делегирует в `self.paginator.get_paginated_response(data)` пагинатора.\n\n" +
      "Стандартная реализация:\n" +
      "```python\n" +
      "def get_paginated_response(self, data):\n" +
      "    assert self.paginator is not None\n" +
      "    return self.paginator.get_paginated_response(data)\n" +
      "```\n\n" +
      "**Полная цепочка пагинации в list():**\n" +
      "1. `get_queryset()` → базовый QuerySet\n" +
      "2. `filter_queryset(qs)` → отфильтрованный QuerySet\n" +
      "3. `paginate_queryset(qs)` → срез данных (список объектов)\n" +
      "4. `get_serializer(page, many=True).data` → сериализованные данные\n" +
      "5. `get_paginated_response(data)` → финальный Response\n\n" +
      "**Где кастомизировать формат:**\n" +
      "- В классе пагинатора (`get_paginated_response`) — для переиспользования во всём проекте.\n" +
      "- В методе вью (`get_paginated_response`) — для уникального формата конкретного эндпоинта.\n\n" +
      "**get_paginated_response_schema()** — вспомогательный метод для генераторов документации (drf-spectacular). Описывает структуру обёртки в терминах JSON Schema. Без него документация будет неточной.",
  },
  {
    id: "mixin-create",
    title: "CreateModelMixin.create — создание объекта через API",
    task: "Реализовать эндпоинт создания статьи: валидация входных данных, автоматическое назначение автора, возврат созданного объекта с заголовком Location. Разобраться, что делает create() и почему логику сохранения выносят в perform_create().",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Article
from .serializers import ArticleSerializer


class ArticleCreateView(generics.CreateAPIView):
    """
    CreateAPIView включает только CreateModelMixin + GenericAPIView.
    POST /articles/ → создаёт статью и возвращает 201 Created.
    """
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Переопределяем perform_create для передачи дополнительных данных.
        # serializer.save() вызывает create() сериализатора с extra-kwargs.
        serializer.save(author=self.request.user)

    # create() переопределяют редко. Пример когда это оправдано:
    # нужен нестандартный код ответа или другое тело при успехе.
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        # Стандартный ответ — 201 с телом и заголовком Location
        return Response(
            {"detail": "Статья создана.", "id": serializer.data["id"]},
            status=status.HTTP_201_CREATED,
            headers=headers,
        )`,
      },
      {
        filename: "serializers.py",
        code: `from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "author", "created_at"]
        read_only_fields = ["id", "author", "created_at"]`,
      },
    ],
    explanation:
      "**create(request, *args, **kwargs)** — стандартная реализация:\n" +
      "```python\n" +
      "def create(self, request, *args, **kwargs):\n" +
      "    serializer = self.get_serializer(data=request.data)\n" +
      "    serializer.is_valid(raise_exception=True)  # 400 при ошибках\n" +
      "    self.perform_create(serializer)             # сохранение\n" +
      "    headers = self.get_success_headers(serializer.data)\n" +
      "    return Response(serializer.data, status=201, headers=headers)\n" +
      "```\n\n" +
      "**raise_exception=True** — вместо возврата булева значения сразу бросает `ValidationError` при невалидных данных. DRF конвертирует его в HTTP 400 с детальными ошибками по полям.\n\n" +
      "**Принцип разделения:** `create()` управляет HTTP-протоколом (код ответа, заголовки), `perform_create()` — бизнес-логикой сохранения. Переопределяйте `perform_create()` для добавления полей (автор, tenant), запуска задач Celery, отправки событий. Переопределяйте `create()` только если нужен другой формат ответа.",
  },
  {
    id: "mixin-perform-create",
    title: "CreateModelMixin.perform_create — хук сохранения при создании",
    task: "Использовать perform_create() для автоматического заполнения полей из контекста запроса, отправки уведомлений и публикации события в очередь — без изменения сериализатора и без дублирования логики.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Article, AuditLog
from .serializers import ArticleSerializer
from .tasks import send_new_article_notification, publish_article_event


class ArticleCreateView(generics.CreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        perform_create(serializer) вызывается после is_valid().
        serializer.validated_data уже проверены и готовы к сохранению.
        """
        # 1. Сохраняем объект с дополнительными полями из запроса.
        #    Всё, что передаём в save(), добавляется к validated_data.
        instance = serializer.save(
            author=self.request.user,
            author_ip=self.request.META.get("REMOTE_ADDR"),
        )

        # 2. Пишем в журнал аудита — используем уже созданный instance
        AuditLog.objects.create(
            user=self.request.user,
            action="article_created",
            object_id=instance.pk,
            object_repr=str(instance),
        )

        # 3. Асинхронные задачи — запускаем после успешного сохранения
        if instance.status == "published":
            send_new_article_notification.delay(instance.pk)
            publish_article_event.delay(
                event="article.created",
                article_id=instance.pk,
                author_id=self.request.user.pk,
            )


class DraftArticleCreateView(generics.CreateAPIView):
    """Всегда создаёт черновик — игнорирует status из запроса."""
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # override_fields в save() перезаписывает validated_data
        serializer.save(
            author=self.request.user,
            status="draft",  # принудительно, даже если клиент передал "published"
        )`,
      },
    ],
    explanation:
      "**perform_create(serializer)** — точка расширения для логики, которая должна выполняться при каждом создании объекта через этот вью.\n\n" +
      "Стандартная реализация:\n" +
      "```python\n" +
      "def perform_create(self, serializer):\n" +
      "    serializer.save()\n" +
      "```\n\n" +
      "**serializer.save(**kwargs)** — переданные kwargs добавляются к `validated_data` перед вызовом `create()` сериализатора. Это механизм инъекции данных из контекста запроса в объект без объявления их в сериализаторе как обязательных полей.\n\n" +
      "**Порядок операций в perform_create():**\n" +
      "1. Вызвать `serializer.save(...)` — объект создан, у него есть `pk`.\n" +
      "2. Использовать возвращённый `instance` для побочных эффектов.\n" +
      "3. Асинхронные задачи запускать в конце — только после успешного сохранения.\n\n" +
      "**Транзакции:** если perform_create() делает несколько связанных операций с БД, оберните их в `transaction.atomic()` чтобы гарантировать атомарность. Celery-задачи запускайте через `transaction.on_commit()` — иначе задача может начать работу до фиксации транзакции.",
  },
  {
    id: "mixin-get-success-headers",
    title: "CreateModelMixin.get_success_headers — заголовок Location в ответе",
    task: "Разобраться, как DRF формирует заголовок Location при создании объекта, и реализовать кастомный get_success_headers() для возврата правильного URL созданного ресурса во внешней системе.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.reverse import reverse
from .models import Article
from .serializers import ArticleSerializer


class ArticleCreateView(generics.CreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_success_headers(self, data):
        """
        Вызывается в create() после perform_create().
        data — это serializer.data (уже сериализованный объект).
        Должен вернуть dict заголовков или пустой dict.
        """
        # Стандартная реализация пытается взять поле 'url' из data:
        #   try:
        #       return {'Location': str(data[api_settings.URL_FIELD_NAME])}
        #   except (TypeError, KeyError):
        #       return {}

        # Кастомная реализация: строим URL через reverse()
        try:
            location = reverse(
                "article-detail",
                kwargs={"pk": data["id"]},
                request=self.request,
            )
            return {
                "Location": location,
                # Дополнительные заголовки при необходимости
                "X-Resource-Id": str(data["id"]),
            }
        except (KeyError, Exception):
            return {}

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ExternalArticleCreateView(generics.CreateAPIView):
    """Создаёт объект и возвращает URL во внешней CMS."""
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    CMS_BASE_URL = "https://cms.example.com/articles"

    def get_success_headers(self, data):
        article_id = data.get("external_cms_id") or data.get("id")
        return {
            "Location": f"{self.CMS_BASE_URL}/{article_id}/",
        }

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)`,
      },
    ],
    explanation:
      "**get_success_headers(data)** вызывается в `create()` и возвращает словарь HTTP-заголовков, которые добавляются к ответу 201 Created.\n\n" +
      "Стандартная реализация ищет в `data` поле с именем из `URL_FIELD_NAME` (по умолчанию `'url'`) и помещает его в заголовок `Location`. Если поле не найдено — возвращает пустой dict.\n\n" +
      "**Заголовок Location** — часть HTTP-стандарта для ответов 201: указывает клиенту URL созданного ресурса. REST-клиенты и инструменты (httpie, Insomnia) автоматически используют его для навигации.\n\n" +
      "**Когда переопределять:**\n" +
      "- Сериализатор не содержит поля `url` (используется `ModelSerializer` без `HyperlinkedModelSerializer`).\n" +
      "- URL ресурса строится по нестандартной схеме.\n" +
      "- Нужно вернуть дополнительные заголовки (`X-Resource-Id`, `ETag` и т.д.).\n\n" +
      "**HyperlinkedModelSerializer** автоматически добавляет поле `url` в data, поэтому стандартный `get_success_headers()` работает без переопределения при его использовании.",
  },
  {
    id: "mixin-list",
    title: "ListModelMixin.list — получение списка объектов",
    task: "Реализовать эндпоинт списка статей и разобраться во внутренней цепочке вызовов list(). Добавить агрегированные метаданные к пагинированному ответу без дублирования запросов к БД.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.response import Response
from .models import Article
from .serializers import ArticleSerializer


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    queryset = Article.objects.select_related("author").order_by("-created_at")

    # list() вызывается автоматически при GET-запросе к ListAPIView.
    # Переопределяем только если нужны дополнительные данные в ответе.
    def list(self, request, *args, **kwargs):
        # 1. Получаем и фильтруем queryset
        queryset = self.filter_queryset(self.get_queryset())

        # 2. Считаем агрегаты ДО пагинации — на полном queryset
        stats = {
            "total_published": queryset.filter(status="published").count(),
            "total_drafts": queryset.filter(status="draft").count(),
        }

        # 3. Пагинация — получаем срез
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # get_paginated_response строит стандартный ответ пагинатора
            response = self.get_paginated_response(serializer.data)
            # Добавляем агрегаты в уже сформированный ответ
            response.data["stats"] = stats
            return response

        # Пагинация отключена
        serializer = self.get_serializer(queryset, many=True)
        return Response({"results": serializer.data, "stats": stats})`,
      },
    ],
    explanation:
      "**list(request, *args, **kwargs)** — стандартная реализация:\n" +
      "```python\n" +
      "def list(self, request, *args, **kwargs):\n" +
      "    queryset = self.filter_queryset(self.get_queryset())\n" +
      "    page = self.paginate_queryset(queryset)\n" +
      "    if page is not None:\n" +
      "        serializer = self.get_serializer(page, many=True)\n" +
      "        return self.get_paginated_response(serializer.data)\n" +
      "    serializer = self.get_serializer(queryset, many=True)\n" +
      "    return Response(serializer.data)\n" +
      "```\n\n" +
      "**Цепочка вызовов:** `GET /articles/` → `dispatch()` → `initial()` → `list()` → `filter_queryset()` → `paginate_queryset()` → `get_serializer()` → `get_paginated_response()`.\n\n" +
      "**Агрегаты до пагинации:** вычисляйте `count()`, `sum()` и другие агрегаты на полном отфильтрованном queryset до вызова `paginate_queryset()`. После пагинации queryset уже обрезан до одной страницы.\n\n" +
      "**Оптимизация many=True:** при `many=True` сериализатор обходит весь page и вызывает `to_representation()` для каждого объекта. Убедитесь, что `select_related`/`prefetch_related` добавлены в `get_queryset()`, иначе каждый объект вызовет отдельный SQL-запрос.",
  },
  {
    id: "mixin-retrieve",
    title: "RetrieveModelMixin.retrieve — получение одного объекта",
    task: "Реализовать эндпоинт детальной страницы статьи. Добавить инкремент счётчика просмотров при каждом GET-запросе без лишнего SQL-запроса SELECT и с защитой от состояния гонки.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.response import Response
from django.db.models import F
from .models import Article
from .serializers import ArticleSerializer


class ArticleDetailView(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    queryset = Article.objects.select_related("author").prefetch_related("tags")

    def retrieve(self, request, *args, **kwargs):
        """
        retrieve() вызывается при GET /articles/<pk>/.
        Стандартная реализация:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        """
        # get_object() выполняет get_queryset() + filter_queryset()
        # + поиск по lookup_field + check_object_permissions()
        instance = self.get_object()

        # Атомарный инкремент через F-выражение — без SELECT + UPDATE,
        # одним UPDATE-запросом, безопасен при параллельных запросах
        Article.objects.filter(pk=instance.pk).update(
            views_count=F("views_count") + 1
        )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ArticlePreviewView(generics.RetrieveAPIView):
    """Возвращает только часть полей для предпросмотра."""
    serializer_class = ArticleSerializer
    queryset = Article.objects.select_related("author")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # Фильтруем поля после сериализации
        preview_fields = {"id", "title", "author", "created_at"}
        data = {k: v for k, v in serializer.data.items() if k in preview_fields}
        return Response(data)`,
      },
    ],
    explanation:
      "**retrieve(request, *args, **kwargs)** — стандартная реализация:\n" +
      "```python\n" +
      "def retrieve(self, request, *args, **kwargs):\n" +
      "    instance = self.get_object()  # 404 если не найден, 403 если нет прав\n" +
      "    serializer = self.get_serializer(instance)\n" +
      "    return Response(serializer.data)\n" +
      "```\n\n" +
      "**get_object() делает всё за вас:** применяет фильтры, ищет по `lookup_field`, проверяет `check_object_permissions()`. Никогда не используйте `Model.objects.get(pk=...)` напрямую в вью — это обходит object-level permissions.\n\n" +
      "**F-выражение для счётчика:** `UPDATE articles SET views_count = views_count + 1 WHERE id = %s` — один запрос без состояния гонки. Альтернатива `instance.views_count += 1; instance.save()` — не атомарна: два параллельных запроса могут прочитать одно значение и оба записать `value + 1` вместо `value + 2`.\n\n" +
      "**Когда переопределять retrieve():** инкремент счётчиков, логирование доступа, условная замена сериализатора. В остальных случаях достаточно переопределить `get_object()` или `get_serializer_class()`.",
  },
  {
    id: "mixin-update",
    title: "UpdateModelMixin.update и partial_update — обновление объекта",
    task: "Реализовать PUT и PATCH эндпоинты для статьи. Разобраться, в чём разница между полным и частичным обновлением, и добавить запись в историю изменений при каждом обновлении.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Article, ArticleHistory
from .serializers import ArticleSerializer
from .permissions import IsOwnerOrReadOnly


class ArticleUpdateView(generics.UpdateAPIView):
    """
    UpdateAPIView включает PUT и PATCH из UpdateModelMixin.
    PUT  /articles/<pk>/  → полное обновление (все поля обязательны)
    PATCH /articles/<pk>/ → частичное обновление (только переданные поля)
    """
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    queryset = Article.objects.all()

    def perform_update(self, serializer):
        # Сохраняем предыдущее состояние для истории
        instance = serializer.instance
        previous_data = {
            "title": instance.title,
            "body": instance.body,
            "status": instance.status,
        }

        updated_instance = serializer.save()

        # Записываем только реально изменившиеся поля
        changed_fields = {
            field: {"from": previous_data[field], "to": getattr(updated_instance, field)}
            for field in previous_data
            if previous_data[field] != getattr(updated_instance, field)
        }

        if changed_fields:
            ArticleHistory.objects.create(
                article=updated_instance,
                changed_by=self.request.user,
                changes=changed_fields,
            )

    # partial_update() вызывается DRF автоматически при PATCH.
    # Его переопределяют крайне редко — вся логика в perform_update().
    # Стандартная реализация:
    #   def partial_update(self, request, *args, **kwargs):
    #       kwargs["partial"] = True
    #       return self.update(request, *args, **kwargs)`,
      },
      {
        filename: "serializers.py",
        code: `from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "body", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_status(self, value):
        # При переходе в "published" проверяем минимальную длину тела
        if value == "published":
            body = self.initial_data.get("body") or (
                self.instance.body if self.instance else ""
            )
            if len(body.split()) < 50:
                raise serializers.ValidationError(
                    "Для публикации тело статьи должно содержать не менее 50 слов."
                )
        return value`,
      },
    ],
    explanation:
      "**update(request, *args, **kwargs)** — стандартная реализация:\n" +
      "```python\n" +
      "def update(self, request, *args, **kwargs):\n" +
      "    partial = kwargs.pop('partial', False)\n" +
      "    instance = self.get_object()\n" +
      "    serializer = self.get_serializer(instance, data=request.data, partial=partial)\n" +
      "    serializer.is_valid(raise_exception=True)\n" +
      "    self.perform_update(serializer)\n" +
      "    return Response(serializer.data)\n" +
      "```\n\n" +
      "**partial=True (PATCH):** при частичном обновлении все поля сериализатора становятся необязательными. Клиент передаёт только те поля, которые хочет изменить. Незаданные поля берутся из существующего `instance`.\n\n" +
      "**partial=False (PUT):** все обязательные поля должны быть переданы. Если клиент не передал поле — возникнет ошибка валидации. Это семантика полной замены ресурса.\n\n" +
      "**Доступ к старым данным:** в `perform_update()` объект ещё не сохранён — `serializer.instance` содержит исходное состояние. После `serializer.save()` объект обновлён. Это окно позволяет сравнить «до» и «после».",
  },
  {
    id: "mixin-perform-update",
    title: "UpdateModelMixin.perform_update — хук сохранения при обновлении",
    task: "Использовать perform_update() для реализации оптимистичной блокировки: предотвратить затирание изменений при параллельном редактировании одной статьи разными пользователями.",
    files: [
      {
        filename: "views.py",
        code: `from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Article
from .serializers import ArticleSerializer
from .permissions import IsOwnerOrReadOnly


class ArticleUpdateView(generics.UpdateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    queryset = Article.objects.all()

    def perform_update(self, serializer):
        """
        Оптимистичная блокировка через поле updated_at.
        Клиент обязан передать ?updated_at=<timestamp> при обновлении.
        Если запись изменилась с момента последнего чтения — 409 Conflict.
        """
        client_timestamp = self.request.data.get("updated_at")

        if client_timestamp:
            instance = serializer.instance
            # Сравниваем timestamp клиента с текущим в БД
            server_ts = instance.updated_at.isoformat()
            if client_timestamp != server_ts:
                raise serializers.ValidationError({
                    "updated_at": (
                        "Запись была изменена другим пользователем. "
                        "Обновите страницу и попробуйте снова."
                    )
                })

        # Стандартное сохранение — обновляем поле modified_by
        serializer.save(
            modified_by=self.request.user,
            modified_at=timezone.now(),
        )


class SoftPublishView(generics.UpdateAPIView):
    """perform_update с условной логикой публикации."""
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    queryset = Article.objects.all()

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get("status", instance.status)

        extra_fields = {"modified_by": self.request.user}

        # Устанавливаем дату публикации только при первом переходе в "published"
        if new_status == "published" and instance.status != "published":
            extra_fields["published_at"] = timezone.now()

        serializer.save(**extra_fields)`,
      },
    ],
    explanation:
      "**perform_update(serializer)** — точка расширения для логики, выполняемой при каждом обновлении объекта. Стандартная реализация:\n" +
      "```python\n" +
      "def perform_update(self, serializer):\n" +
      "    serializer.save()\n" +
      "```\n\n" +
      "**Оптимистичная блокировка** — паттерн для предотвращения lost update: клиент читает объект, запоминает `updated_at`, отправляет его при обновлении. Сервер сравнивает timestamp и отклоняет запрос, если запись была изменена другим пользователем между чтением и записью.\n\n" +
      "**perform_update vs pre_save сигнал:** Django-сигналы глобальны и срабатывают при любом сохранении модели (включая management commands, shell, тесты). `perform_update()` — только при обновлении через конкретный вью. Для API-специфичной логики предпочитайте `perform_update()`.\n\n" +
      "**Доступ к старым данным:** `serializer.instance` — объект до сохранения. `serializer.validated_data` — новые значения. После `serializer.save()` `serializer.instance` обновляется.",
  },
  {
    id: "mixin-destroy",
    title: "DestroyModelMixin.destroy — удаление объекта",
    task: "Реализовать эндпоинт удаления статьи. Добавить мягкое удаление (soft delete) вместо физического — объект помечается как удалённый, но остаётся в БД. Разобраться, когда переопределять destroy(), а когда — perform_destroy().",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        "auth.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="deleted_articles"
    )

    objects = SoftDeleteManager()       # по умолчанию — только не удалённые
    all_objects = models.Manager()      # включая удалённые

    def soft_delete(self, user=None):
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save(update_fields=["deleted_at", "deleted_by"])`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Article
from .serializers import ArticleSerializer
from .permissions import IsOwnerOrReadOnly


class ArticleDestroyView(generics.DestroyAPIView):
    """
    Мягкое удаление через переопределение perform_destroy().
    DELETE /articles/<pk>/ → помечает как удалённую, возвращает 204.
    """
    queryset = Article.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def perform_destroy(self, instance):
        # Вместо instance.delete() — мягкое удаление
        instance.soft_delete(user=self.request.user)

    # destroy() переопределяем если нужен другой HTTP-код или тело ответа.
    # Стандартный ответ — 204 No Content без тела.


class ArticleDestroyWithResponseView(generics.DestroyAPIView):
    """Возвращает 200 с подтверждением вместо 204 без тела."""
    queryset = Article.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        title = instance.title  # сохраняем до удаления
        self.perform_destroy(instance)
        return Response(
            {"detail": f"Статья «{title}» удалена."},
            status=status.HTTP_200_OK,
        )

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)`,
      },
    ],
    explanation:
      "**destroy(request, *args, **kwargs)** — стандартная реализация:\n" +
      "```python\n" +
      "def destroy(self, request, *args, **kwargs):\n" +
      "    instance = self.get_object()  # 404 + check_object_permissions\n" +
      "    self.perform_destroy(instance)\n" +
      "    return Response(status=HTTP_204_NO_CONTENT)\n" +
      "```\n\n" +
      "**Принцип разделения как в create/update:** `destroy()` — HTTP-протокол, `perform_destroy()` — бизнес-логика. Переопределяйте `perform_destroy()` для мягкого удаления, архивирования, каскадных операций. Переопределяйте `destroy()` для изменения кода ответа (200 вместо 204) или добавления тела ответа.\n\n" +
      "**204 No Content** — правильный HTTP-статус для успешного удаления без тела. Некоторые клиенты ожидают 200 с подтверждением — это тоже допустимо, но менее стандартно.\n\n" +
      "**Мягкое удаление и get_queryset():** при soft delete менеджер `SoftDeleteManager` автоматически исключает удалённые объекты из всех запросов через стандартный `objects`. Попытка получить удалённый объект вернёт 404 — как при физическом удалении.",
  },
  {
    id: "mixin-perform-destroy",
    title: "DestroyModelMixin.perform_destroy — хук физического удаления",
    task: "Реализовать каскадное удаление с очисткой связанных ресурсов: файлов из S3, записей в кэше и внешних webhook-уведомлений — всё это через perform_destroy() без изменения бизнес-логики в других частях кода.",
    files: [
      {
        filename: "views.py",
        code: `import logging
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from .models import Article
from .serializers import ArticleSerializer
from .permissions import IsOwnerOrReadOnly
from .storage import s3_client
from .tasks import notify_article_deleted

logger = logging.getLogger(__name__)


class ArticleDestroyView(generics.DestroyAPIView):
    queryset = Article.objects.prefetch_related("attachments").all()
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def perform_destroy(self, instance):
        """
        perform_destroy(instance) вызывается в destroy() после get_object().
        instance — объект Django модели, готовый к удалению.
        Стандартная реализация: instance.delete()
        """
        article_id = instance.pk
        article_title = instance.title
        author_id = instance.author_id

        # 1. Удаляем файлы из S3 перед удалением записи из БД
        #    (если сначала удалить из БД, потеряем список файлов)
        for attachment in instance.attachments.all():
            try:
                s3_client.delete_object(
                    Bucket="articles-bucket",
                    Key=attachment.s3_key,
                )
            except Exception:
                logger.exception("Не удалось удалить файл %s из S3", attachment.s3_key)

        # 2. Физически удаляем объект из БД
        #    Django автоматически выполнит ON DELETE CASCADE для связанных объектов
        instance.delete()

        # 3. Инвалидируем кэш — после успешного удаления из БД
        cache.delete_many([
            f"article:{article_id}",
            f"article:slug:{instance.slug}",
            f"author:{author_id}:articles",
        ])

        # 4. Асинхронное уведомление — запускаем в конце
        notify_article_deleted.delay(
            article_id=article_id,
            article_title=article_title,
            deleted_by=self.request.user.pk,
        )`,
      },
    ],
    explanation:
      "**perform_destroy(instance)** — стандартная реализация:\n" +
      "```python\n" +
      "def perform_destroy(self, instance):\n" +
      "    instance.delete()\n" +
      "```\n\n" +
      "**Порядок операций критически важен:**\n" +
      "1. Внешние ресурсы (S3, CDN) — до удаления из БД: пока объект есть в БД, у нас есть список связанных файлов.\n" +
      "2. `instance.delete()` — удаление из БД.\n" +
      "3. Кэш — после удаления из БД: инвалидируем только при успешном удалении.\n" +
      "4. Асинхронные задачи — последними, через `transaction.on_commit()` при использовании транзакций.\n\n" +
      "**Транзакционная безопасность:** если внешние операции (S3, кэш) могут упасть, оберните всё в `try/except` с откатом или используйте паттерн Saga. Celery-задачи запускайте через `django.db.transaction.on_commit()` — иначе задача может выполниться до завершения транзакции.\n\n" +
      "**instance.delete() vs QuerySet.delete():** `instance.delete()` вызывает `pre_delete` и `post_delete` сигналы для каждого объекта и выполняет Python-уровень каскадного удаления. `QuerySet.delete()` делает это одним SQL-запросом без сигналов — быстрее, но сигналы не срабатывают.",
  },
  {
    id: "drf-filtering-search",
    title: "Комплексная фильтрация с django-filter",
    task: "Реализовать эндпоинт списка статей с фильтрацией по автору, статусу, диапазону дат и тегам. Добавить полнотекстовый поиск и сортировку. Использовать django-filter для декларативного описания фильтров.",
    files: [
      {
        filename: "filters.py",
        code: `import django_filters
from .models import Article


class ArticleFilter(django_filters.FilterSet):
    author = django_filters.CharFilter(field_name="author__username", lookup_expr="iexact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    created_after = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")
    tag = django_filters.CharFilter(field_name="tags__name", lookup_expr="icontains")
    min_views = django_filters.NumberFilter(field_name="views_count", lookup_expr="gte")
    is_featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Article
        fields = ["author", "status", "created_after", "created_before", "tag"]`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ArticleFilter
from .models import Article
from .serializers import ArticleSerializer


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Article.objects
        .select_related("author")
        .prefetch_related("tags")
        .filter(published=True)
    )
    serializer_class = ArticleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ArticleFilter
    search_fields = ["title", "body", "^author__username"]
    ordering_fields = ["created_at", "views_count", "title"]
    ordering = ["-created_at"]

# Примеры запросов:
# GET /articles/?author=johndoe
# GET /articles/?tag=django&status=published
# GET /articles/?created_after=2024-01-01&created_before=2024-12-31
# GET /articles/?search=rest+framework&ordering=-views_count`,
      },
    ],
    explanation:
      "**Три бэкенда одновременно:** DRF позволяет комбинировать фильтры в filter_backends. Каждый бэкенд применяется последовательно к QuerySet.\n\n" +
      "**django-filter vs встроенный SearchFilter:**\n" +
      "- DjangoFilterBackend — строгие фильтры с точными значениями (статус, автор, диапазоны).\n" +
      "- SearchFilter — нечёткий поиск по нескольким полям одновременно через ?search=.\n\n" +
      "**lookup_expr** задаёт тип сравнения: exact, iexact, icontains, gte, lte, in и т.д. — это суффиксы Django ORM lookups.\n\n" +
      "**Фильтр по ManyToMany:** field_name=\"tags__name\" использует JOIN под капотом. Для предотвращения дублей при нескольких тегах Django автоматически добавляет DISTINCT.\n\n" +
      "**Производительность:** select_related и prefetch_related в QuerySet критически важны — без них каждый элемент списка вызовет дополнительные SQL-запросы.",
  },
];
