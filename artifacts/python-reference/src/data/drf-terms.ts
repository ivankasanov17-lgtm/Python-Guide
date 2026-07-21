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
  // ─── Serializers ──────────────────────────────────────────────────────────
  {
    name: "Serializer",
    category: "Serializers",
    description:
      "Базовый класс сериализатора DRF. Позволяет вручную описывать поля для сериализации/десериализации данных, выполнять валидацию и сохранение объектов. Является фундаментом для всех остальных сериализаторов.",
    syntax: "class MySerializer(serializers.Serializer):",
    arguments: [
      { name: "instance", description: "Объект для сериализации (необязательно)." },
      { name: "data", description: "Входные данные для десериализации и валидации." },
      { name: "many", description: "Если True — обрабатывает список объектов." },
      { name: "context", description: "Словарь с дополнительным контекстом (например, request)." },
    ],
    example: `from rest_framework import serializers

class ArticleSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=200)
    body = serializers.CharField()
    published = serializers.BooleanField(default=False)

    def create(self, validated_data):
        return Article.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.body = validated_data.get("body", instance.body)
        instance.save()
        return instance

# Сериализация объекта
article = Article.objects.first()
serializer = ArticleSerializer(article)
print(serializer.data)  # {'id': 1, 'title': '...', ...}

# Десериализация и валидация
s = ArticleSerializer(data={"title": "Hello", "body": "World"})
if s.is_valid():
    s.save()`,
  },
  {
    name: "ModelSerializer",
    category: "Serializers",
    description:
      "Сокращённая версия Serializer, которая автоматически генерирует поля на основе модели Django. Автоматически создаёт методы create() и update(). Это наиболее распространённый сериализатор в реальных проектах.",
    syntax: "class MySerializer(serializers.ModelSerializer):",
    arguments: [
      { name: "Meta.model", description: "Модель Django, на основе которой генерируются поля." },
      { name: "Meta.fields", description: "Список полей или '__all__' для включения всех полей." },
      { name: "Meta.exclude", description: "Список полей для исключения." },
      { name: "Meta.read_only_fields", description: "Список полей, доступных только для чтения." },
      { name: "Meta.extra_kwargs", description: "Словарь для переопределения параметров отдельных полей." },
    ],
    example: `from rest_framework import serializers
from .models import Article, Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]

class ArticleSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ["id", "title", "body", "author", "author_name", "tags", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "author": {"write_only": True},
        }

    def get_author_name(self, obj):
        return obj.author.get_full_name()`,
  },
  {
    name: "SerializerMethodField",
    category: "Serializers",
    description:
      "Поле только для чтения, значение которого вычисляется методом сериализатора. Метод по умолчанию называется get_<field_name>. Удобен для добавления вычисляемых или составных данных в ответ.",
    syntax: "serializers.SerializerMethodField(method_name=None)",
    arguments: [
      { name: "method_name", description: "Имя метода сериализатора. По умолчанию get_<field_name>." },
    ],
    example: `from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "post_count"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_post_count(self, obj):
        return obj.posts.count()`,
  },
  {
    name: "validate_<field>",
    category: "Serializers",
    description:
      "Метод для валидации отдельного поля. Вызывается автоматически при вызове is_valid(). Должен возвращать проверенное значение или бросать serializers.ValidationError.",
    syntax: "def validate_<field_name>(self, value):",
    arguments: [
      { name: "value", description: "Значение поля после применения встроенных проверок типов." },
    ],
    example: `from rest_framework import serializers

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    age = serializers.IntegerField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Это имя пользователя уже занято.")
        return value

    def validate_age(self, value):
        if value < 18:
            raise serializers.ValidationError("Возраст должен быть не менее 18 лет.")
        return value

    def validate(self, data):
        # Кросс-полевая валидация
        if data["username"] in data["email"]:
            raise serializers.ValidationError("Имя пользователя не должно входить в email.")
        return data`,
  },
  // ─── Views ────────────────────────────────────────────────────────────────
  {
    name: "APIView",
    category: "Views",
    description:
      "Базовый класс-представление DRF. Наследуется от View Django и добавляет аутентификацию, разрешения, регулировку запросов и согласование контента. Методы get(), post(), put(), patch(), delete() определяются вручную.",
    syntax: "class MyView(APIView):",
    arguments: [
      { name: "authentication_classes", description: "Список классов аутентификации для данного вью." },
      { name: "permission_classes", description: "Список классов разрешений для данного вью." },
      { name: "throttle_classes", description: "Список классов ограничения частоты запросов." },
    ],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class ArticleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Article.objects.get(pk=pk)
        except Article.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        article = self.get_object(pk)
        serializer = ArticleSerializer(article)
        return Response(serializer.data)

    def put(self, request, pk):
        article = self.get_object(pk)
        serializer = ArticleSerializer(article, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        article = self.get_object(pk)
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)`,
  },
  {
    name: "GenericAPIView",
    category: "Views",
    description:
      "Расширяет APIView, добавляя стандартное поведение для list/detail представлений. Предоставляет get_queryset(), get_serializer(), get_object(). Служит основой для миксинов и generic-классов.",
    syntax: "class MyView(generics.GenericAPIView):",
    arguments: [
      { name: "queryset", description: "QuerySet, используемый для получения объектов." },
      { name: "serializer_class", description: "Класс сериализатора для данного вью." },
      { name: "lookup_field", description: "Поле модели для поиска объекта (по умолчанию 'pk')." },
      { name: "filter_backends", description: "Список бэкендов фильтрации." },
      { name: "pagination_class", description: "Класс пагинации." },
    ],
    example: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class ArticleListCreateView(generics.ListCreateAPIView):
    queryset = Article.objects.all().order_by("-created_at")
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        author = self.request.query_params.get("author")
        if author:
            qs = qs.filter(author__username=author)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ArticleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer`,
  },
  {
    name: "ViewSet",
    category: "Views",
    description:
      "Объединяет логику для нескольких связанных представлений в одном классе. Определяет действия (list, create, retrieve, update, destroy) вместо HTTP-методов. Предназначен для использования с роутерами.",
    syntax: "class MyViewSet(ViewSet):",
    arguments: [
      { name: "basename", description: "Базовое имя для URL-шаблонов при регистрации в роутере." },
    ],
    example: `from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class ArticleViewSet(viewsets.ViewSet):
    def list(self, request):
        queryset = Article.objects.all()
        serializer = ArticleSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        article = get_object_or_404(Article, pk=pk)
        serializer = ArticleSerializer(article)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def published(self, request):
        published = Article.objects.filter(published=True)
        serializer = ArticleSerializer(published, many=True)
        return Response(serializer.data)

# urls.py
router = DefaultRouter()
router.register(r"articles", ArticleViewSet, basename="article")`,
  },
  {
    name: "ModelViewSet",
    category: "Views",
    description:
      "Полный ViewSet с автоматической реализацией всех CRUD-операций: list, create, retrieve, update, partial_update, destroy. Сочетает GenericAPIView со всеми миксинами. Идеален для стандартных REST-ресурсов.",
    syntax: "class MyViewSet(viewsets.ModelViewSet):",
    arguments: [
      { name: "queryset", description: "QuerySet для всех операций." },
      { name: "serializer_class", description: "Класс сериализатора." },
      { name: "permission_classes", description: "Классы разрешений." },
      { name: "filter_backends", description: "Бэкенды фильтрации." },
      { name: "pagination_class", description: "Класс пагинации." },
    ],
    example: `from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related("author").prefetch_related("tags")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ("list",):
            return ArticleListSerializer
        return ArticleDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        article = self.get_object()
        article.likes.add(request.user)
        return Response({"liked": True})`,
  },
  {
    name: "@action",
    category: "Views",
    description:
      "Декоратор для добавления нестандартных маршрутов к ViewSet. Позволяет создавать дополнительные эндпоинты помимо стандартных CRUD-действий. Роутер автоматически генерирует URL для таких методов.",
    syntax: "@action(detail=True/False, methods=['get', 'post'], ...)",
    arguments: [
      { name: "detail", description: "True — действие над конкретным объектом (/{pk}/action/), False — над коллекцией (/action/)." },
      { name: "methods", description: "Список HTTP-методов (по умолчанию ['get'])." },
      { name: "url_path", description: "Часть URL для этого действия (по умолчанию — имя метода)." },
      { name: "url_name", description: "Имя URL для reverse(). По умолчанию — имя метода через дефис." },
      { name: "permission_classes", description: "Переопределяет разрешения для данного действия." },
    ],
    example: `from rest_framework.decorators import action
from rest_framework.response import Response

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=["get"], url_path="me")
    def current_user(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="change-password")
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response({"status": "ok"})
        return Response(serializer.errors, status=400)

# URL: POST /users/{pk}/change-password/`,
  },
  // ─── Routers ──────────────────────────────────────────────────────────────
  {
    name: "DefaultRouter",
    category: "Routers",
    description:
      "Наиболее часто используемый роутер DRF. Автоматически генерирует URL для всех стандартных действий ViewSet. Также создаёт корневой API-эндпоинт (/) со списком всех зарегистрированных маршрутов.",
    syntax: "router = DefaultRouter()",
    arguments: [
      { name: "trailing_slash", description: "Добавлять ли завершающий слеш (по умолчанию True)." },
    ],
    example: `from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, UserViewSet

router = DefaultRouter()
router.register(r"articles", ArticleViewSet, basename="article")
router.register(r"users", UserViewSet, basename="user")

# Генерируемые URL:
# GET    /articles/           → list
# POST   /articles/           → create
# GET    /articles/{pk}/      → retrieve
# PUT    /articles/{pk}/      → update
# PATCH  /articles/{pk}/      → partial_update
# DELETE /articles/{pk}/      → destroy

# urls.py
urlpatterns = [
    path("api/", include(router.urls)),
]`,
  },
  // ─── Permissions ──────────────────────────────────────────────────────────
  {
    name: "IsAuthenticated",
    category: "Permissions",
    description:
      "Разрешает доступ только аутентифицированным пользователям. Неаутентифицированные запросы получают ответ 401 Unauthorized (или 403 Forbidden в зависимости от конфигурации).",
    syntax: "permission_classes = [IsAuthenticated]",
    arguments: [],
    example: `from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username,
            "email": request.user.email,
        })

# Глобально в settings.py:
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ]
}`,
  },
  {
    name: "IsAuthenticatedOrReadOnly",
    category: "Permissions",
    description:
      "Разрешает безопасные HTTP-методы (GET, HEAD, OPTIONS) всем пользователям, а небезопасные (POST, PUT, PATCH, DELETE) — только аутентифицированным. Типично для публичных API с чтением без авторизации.",
    syntax: "permission_classes = [IsAuthenticatedOrReadOnly]",
    arguments: [],
    example: `from rest_framework import generics, permissions

class ArticleListCreateView(generics.ListCreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # GET  /articles/  → доступен всем
    # POST /articles/  → только для авторизованных`,
  },
  {
    name: "BasePermission",
    category: "Permissions",
    description:
      "Базовый класс для создания собственных разрешений. Нужно переопределить has_permission() для проверки на уровне вью или has_object_permission() для проверки на уровне конкретного объекта.",
    syntax: "class MyPermission(permissions.BasePermission):",
    arguments: [
      { name: "has_permission(request, view)", description: "Проверка на уровне запроса/вью." },
      { name: "has_object_permission(request, view, obj)", description: "Проверка на уровне конкретного объекта." },
    ],
    example: `from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """Редактировать может только автор объекта."""

    def has_permission(self, request, view):
        return bool(
            request.method in SAFE_METHODS or
            request.user and request.user.is_authenticated
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author == request.user


class IsAdminOrStaff(BasePermission):
    message = "Доступ разрешён только администраторам."

    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))`,
  },
  // ─── Authentication ────────────────────────────────────────────────────────
  {
    name: "TokenAuthentication",
    category: "Authentication",
    description:
      "Простая токен-аутентификация на основе HTTP-заголовка. Клиент отправляет заголовок Authorization: Token <token>. Токены хранятся в базе данных. Подходит для простых API без требований к ротации токенов.",
    syntax: "authentication_classes = [TokenAuthentication]",
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = [
    ...
    "rest_framework",
    "rest_framework.authtoken",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
}

# Создание токена
from rest_framework.authtoken.models import Token
token, created = Token.objects.get_or_create(user=user)
print(token.key)  # "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"

# Эндпоинт для получения токена
from rest_framework.authtoken.views import obtain_auth_token
urlpatterns += [path("api/token/", obtain_auth_token)]

# HTTP-запрос
# Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b`,
  },
  {
    name: "SessionAuthentication",
    category: "Authentication",
    description:
      "Аутентификация на основе сессий Django. Используется для браузерных клиентов. Требует наличия CSRF-токена для небезопасных методов. Удобна при использовании DRF вместе с Django-шаблонами.",
    syntax: "authentication_classes = [SessionAuthentication]",
    arguments: [],
    example: `# settings.py
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
}

# В браузерных запросах необходим CSRF-токен:
# Cookie: csrftoken=...
# X-CSRFToken: <значение из куки>

# Получить CSRF-токен в JS:
# document.cookie
#   .split("; ")
#   .find(row => row.startsWith("csrftoken="))
#   ?.split("=")[1]`,
  },
  // ─── Pagination ────────────────────────────────────────────────────────────
  {
    name: "PageNumberPagination",
    category: "Pagination",
    description:
      "Пагинация по номеру страницы. Клиент передаёт параметр ?page=N. Возвращает объект с полями count, next, previous, results. Наиболее распространённый тип пагинации в REST API.",
    syntax: "class MyPagination(PageNumberPagination):",
    arguments: [
      { name: "page_size", description: "Количество объектов на странице." },
      { name: "page_size_query_param", description: "Параметр запроса для задания размера страницы." },
      { name: "max_page_size", description: "Максимально допустимый размер страницы." },
      { name: "page_query_param", description: "Параметр запроса для номера страницы (по умолчанию 'page')." },
    ],
    example: `from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

# Применение в вью:
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    pagination_class = StandardPagination

# Или глобально в settings.py:
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Ответ API:
# {
#   "count": 100,
#   "next": "http://api.example.com/articles/?page=3",
#   "previous": "http://api.example.com/articles/?page=1",
#   "results": [...]
# }`,
  },
  {
    name: "LimitOffsetPagination",
    category: "Pagination",
    description:
      "Пагинация через параметры ?limit=N&offset=M. Более гибкая, чем PageNumberPagination — клиент может запросить произвольный срез данных. Удобна при интеграции с SQL-базами и для бесконечной прокрутки.",
    syntax: "class MyPagination(LimitOffsetPagination):",
    arguments: [
      { name: "default_limit", description: "Количество объектов по умолчанию." },
      { name: "max_limit", description: "Максимально допустимый limit." },
    ],
    example: `from rest_framework.pagination import LimitOffsetPagination

class FlexiblePagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 200

# Запрос: GET /articles/?limit=10&offset=30
# Возвращает 10 статей начиная с 30-й

# Ответ:
# {
#   "count": 100,
#   "next": "http://api.example.com/articles/?limit=10&offset=40",
#   "previous": "http://api.example.com/articles/?limit=10&offset=20",
#   "results": [...]
# }`,
  },
  // ─── Filtering ────────────────────────────────────────────────────────────
  {
    name: "SearchFilter",
    category: "Filtering",
    description:
      "Простой фильтр поиска по параметру ?search=. Поддерживает частичное совпадение текста по заданным полям. Можно использовать префиксы: ^ (начало строки), = (точное совпадение), @ (полнотекстовый поиск), $ (regex).",
    syntax: "filter_backends = [SearchFilter]",
    arguments: [
      { name: "search_fields", description: "Список полей для поиска. Поддерживает ForeignKey через двойное подчёркивание." },
    ],
    example: `from rest_framework.filters import SearchFilter

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    filter_backends = [SearchFilter]
    search_fields = [
        "title",          # частичное совпадение (default)
        "^author__username",  # начало строки
        "=status",        # точное совпадение
        "body",
    ]

# GET /articles/?search=django
# Ищет 'django' в полях title, body и author__username (начало)`,
  },
  {
    name: "OrderingFilter",
    category: "Filtering",
    description:
      "Фильтр сортировки по параметру ?ordering=. Клиент может указать поле для сортировки; префикс '-' означает убывающий порядок. Можно ограничить допустимые поля через ordering_fields.",
    syntax: "filter_backends = [OrderingFilter]",
    arguments: [
      { name: "ordering_fields", description: "Список допустимых полей для сортировки или '__all__'." },
      { name: "ordering", description: "Сортировка по умолчанию." },
    ],
    example: `from rest_framework.filters import OrderingFilter

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ["title", "created_at", "author__username"]
    ordering = ["-created_at"]  # по умолчанию: новые первые

# GET /articles/?ordering=title         → A-Z
# GET /articles/?ordering=-created_at   → новые первые
# GET /articles/?ordering=author__username,-created_at  → несколько полей`,
  },
  // ─── Throttling ────────────────────────────────────────────────────────────
  {
    name: "AnonRateThrottle",
    category: "Throttling",
    description:
      "Ограничивает частоту запросов от анонимных пользователей по IP-адресу. Настраивается через DEFAULT_THROTTLE_RATES в settings.py. Защищает API от злоупотреблений неаутентифицированными клиентами.",
    syntax: "throttle_classes = [AnonRateThrottle]",
    arguments: [],
    example: `# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",   # 100 запросов в день для анонимов
        "user": "1000/day",  # 1000 запросов в день для пользователей
    },
}

# Формат: число/[second|minute|hour|day]
# "10/minute" → не более 10 запросов в минуту`,
  },
  {
    name: "ScopedRateThrottle",
    category: "Throttling",
    description:
      "Позволяет задавать разные лимиты для разных частей API через атрибут throttle_scope. Один вью — один скоуп — один лимит. Гибко для API с разными типами эндпоинтов.",
    syntax: "throttle_classes = [ScopedRateThrottle]",
    arguments: [
      { name: "throttle_scope", description: "Строковый идентификатор скоупа для данного вью." },
    ],
    example: `# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "uploads": "5/hour",
        "downloads": "50/hour",
        "auth": "10/minute",
    },
}

# views.py
class UploadView(APIView):
    throttle_scope = "uploads"

class DownloadView(APIView):
    throttle_scope = "downloads"

class LoginView(APIView):
    throttle_scope = "auth"`,
  },
  // ─── Response ─────────────────────────────────────────────────────────────
  {
    name: "Response",
    category: "Response & Request",
    description:
      "Класс ответа DRF, расширяющий HttpResponse. Принимает несериализованные данные и автоматически выполняет согласование контента (content negotiation) для рендеринга в нужный формат (JSON, XML, HTML и т.д.).",
    syntax: "return Response(data, status=None, headers=None)",
    arguments: [
      { name: "data", description: "Сериализуемые данные (dict, list, None)." },
      { name: "status", description: "HTTP-код ответа (по умолчанию 200)." },
      { name: "template_name", description: "Имя шаблона для HTMLRenderer." },
      { name: "headers", description: "Словарь дополнительных HTTP-заголовков." },
      { name: "content_type", description: "Явное указание Content-Type." },
    ],
    example: `from rest_framework.response import Response
from rest_framework import status

class ArticleView(APIView):
    def get(self, request, pk):
        try:
            article = Article.objects.get(pk=pk)
        except Article.DoesNotExist:
            return Response(
                {"detail": "Статья не найдена."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ArticleSerializer(article)
        return Response(serializer.data)  # 200 OK

    def post(self, request):
        serializer = ArticleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)`,
  },
  {
    name: "request.data",
    category: "Response & Request",
    description:
      "Атрибут объекта request DRF, аналог request.POST, но поддерживает произвольные форматы данных (JSON, multipart и др.). Доступен в APIView и ViewSet. Автоматически парсится на основе Content-Type.",
    syntax: "request.data",
    arguments: [],
    example: `from rest_framework.views import APIView
from rest_framework.response import Response

class CreateArticleView(APIView):
    def post(self, request):
        # request.data работает для JSON, form-data, multipart
        title = request.data.get("title")
        body = request.data.get("body")

        serializer = ArticleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def patch(self, request, pk):
        article = Article.objects.get(pk=pk)
        # partial=True позволяет обновить только часть полей
        serializer = ArticleSerializer(article, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)`,
  },
];
