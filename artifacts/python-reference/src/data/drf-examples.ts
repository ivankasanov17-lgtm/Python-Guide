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
