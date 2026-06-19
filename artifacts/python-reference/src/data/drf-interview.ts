import { InterviewQuestion } from "./interview";

export const drfInterviewQuestions: InterviewQuestion[] = [
  {
    id: "drf-serializer-vs-form",
    question: "Чем сериализатор DRF отличается от формы Django? Когда использовать каждый из них?",
    category: "Serializers",
    difficulty: "junior",
    answer:
      "**Форма Django** предназначена для работы с HTML-формами и валидации данных от браузера. Она привязана к HTTP-запросам и рендерингу шаблонов.\n\n" +
      "**Сериализатор DRF** решает более широкую задачу: преобразование объектов Python в примитивные типы данных (dict/list) для любого формата (JSON, XML и т.д.). Он не привязан к HTML.\n\n" +
      "**Ключевые отличия:**\n" +
      "- Сериализаторы поддерживают вложенные структуры (nested serializers) из коробки\n" +
      "- Сериализаторы умеют работать с QuerySet через many=True\n" +
      "- У ModelSerializer есть автоматический create() и update()\n" +
      "- Формы лучше интегрированы с CSRF и виджетами Django\n\n" +
      "**Когда использовать:**\n" +
      "- API → сериализаторы DRF\n" +
      "- Веб-форма с шаблоном → Django Form / ModelForm\n" +
      "- Нужна и форма, и API → можно использовать оба параллельно для разных вью",
  },
  {
    id: "drf-viewset-vs-apiview",
    question: "В чём разница между APIView, GenericAPIView и ViewSet? Когда какой использовать?",
    category: "Views",
    difficulty: "junior",
    answer:
      "**APIView** — базовый класс. Вы определяете методы get(), post() и т.д. вручную. Полный контроль, но много boilerplate.\n\n" +
      "**GenericAPIView** расширяет APIView и добавляет queryset, serializer_class, get_object(), get_queryset(). Комбинируется с миксинами (ListModelMixin, CreateModelMixin и др.) для стандартных операций.\n\n" +
      "**ViewSet** — объединяет несколько связанных вью в один класс с действиями (list, retrieve, create, update, destroy). Предназначен для роутеров.\n\n" +
      "**Когда использовать:**\n" +
      "- Нестандартная логика, не CRUD → APIView\n" +
      "- Стандартный CRUD с небольшими отклонениями → GenericAPIView + миксины или generics.ListCreateAPIView\n" +
      "- Стандартный REST-ресурс → ModelViewSet + роутер\n\n" +
      "**Иерархия:** APIView → GenericAPIView → GenericViewSet → ModelViewSet",
  },
  {
    id: "drf-permissions-flow",
    question: "Как DRF проверяет разрешения? В чём разница между has_permission и has_object_permission?",
    category: "Permissions",
    difficulty: "middle",
    answer:
      "DRF проверяет разрешения в два этапа:\n\n" +
      "**1. has_permission(request, view)** — вызывается для каждого запроса перед выполнением вью. Если хоть одно разрешение возвращает False — запрос отклоняется (403 или 401).\n\n" +
      "**2. has_object_permission(request, view, obj)** — вызывается только при обращении к конкретному объекту (retrieve, update, destroy) после того, как объект получен через get_object(). Не вызывается для list и create.\n\n" +
      "**Важный нюанс:** если has_permission вернул True, это не гарантирует вызов has_object_permission. Нужно явно вызвать self.check_object_permissions(request, obj) или использовать стандартный get_object(), который делает это автоматически.\n\n" +
      "**Логика AND:** все классы разрешений должны вернуть True. Для OR нужно комбинировать через оператор | (DRF 3.9+):\n" +
      "permission_classes = [IsAuthenticated | IsAdminUser]",
  },
  {
    id: "drf-n-plus-one",
    question: "Как обнаружить и устранить проблему N+1 запросов в DRF API?",
    category: "Performance",
    difficulty: "middle",
    answer:
      "**Проблема N+1** возникает когда при сериализации списка объектов для каждого объекта выполняется дополнительный SQL-запрос.\n\n" +
      "**Обнаружение:**\n" +
      "- Django Debug Toolbar в dev-режиме\n" +
      "- django-silk для профилирования\n" +
      "- connection.queries в коде\n\n" +
      "**Устранение:**\n\n" +
      "1. **select_related** — для ForeignKey и OneToOne (JOIN в одном запросе):\n" +
      "queryset = Article.objects.select_related(\"author\", \"category\")\n\n" +
      "2. **prefetch_related** — для ManyToMany и reverse ForeignKey (отдельный запрос + Python-джойн):\n" +
      "queryset = Article.objects.prefetch_related(\"tags\", \"comments\")\n\n" +
      "3. **SerializerMethodField** с осторожностью — если метод обращается к БД, N+1 гарантирован.\n\n" +
      "4. **Prefetch с фильтром** — для выборочной загрузки связанных объектов:\n" +
      "Prefetch(\"comments\", queryset=Comment.objects.filter(approved=True))\n\n" +
      "**Правило:** всегда анализируйте queryset в get_queryset() вью перед деплоем.",
  },
  {
    id: "drf-authentication-types",
    question: "Какие методы аутентификации поддерживает DRF? Как работает JWT?",
    category: "Authentication",
    difficulty: "middle",
    answer:
      "**Встроенные методы аутентификации DRF:**\n\n" +
      "1. **BasicAuthentication** — логин/пароль в base64 в заголовке. Только для разработки или HTTPS.\n" +
      "2. **SessionAuthentication** — сессии Django + CSRF. Для браузерных клиентов.\n" +
      "3. **TokenAuthentication** — токен в заголовке Authorization: Token <key>. Хранится в БД. Прост, но нет автоистечения.\n" +
      "4. **JWTAuthentication** (simplejwt) — токены без хранения в БД.\n\n" +
      "**Как работает JWT:**\n\n" +
      "- **Access token** — короткоживущий (5–30 мин), содержит claims (user_id, роли). Клиент отправляет в каждом запросе: Authorization: Bearer <token>.\n" +
      "- **Refresh token** — долгоживущий (дни/недели), используется только для получения нового access-токена.\n" +
      "- **Структура:** header.payload.signature. Сервер проверяет подпись, не обращаясь к БД — в этом главное преимущество.\n" +
      "- **Отзыв токенов:** JWT нельзя «удалить» — нужен blacklist или короткое время жизни.\n\n" +
      "**Выбор:** Session — для SPA на том же домене; JWT — для мобильных приложений и микросервисов; Token — для простых скриптов и CLI.",
  },
  {
    id: "drf-throttling",
    question: "Как настроить ограничение частоты запросов (rate limiting) в DRF?",
    category: "Throttling",
    difficulty: "junior",
    answer:
      "DRF предоставляет несколько классов throttle из коробки:\n\n" +
      "**AnonRateThrottle** — лимит по IP для анонимных пользователей.\n" +
      "**UserRateThrottle** — лимит по user_id для авторизованных.\n" +
      "**ScopedRateThrottle** — разные лимиты для разных частей API.\n\n" +
      "**Настройка в settings.py:**\n" +
      "REST_FRAMEWORK = {\n" +
      "    \"DEFAULT_THROTTLE_CLASSES\": [\n" +
      "        \"rest_framework.throttling.AnonRateThrottle\",\n" +
      "        \"rest_framework.throttling.UserRateThrottle\",\n" +
      "    ],\n" +
      "    \"DEFAULT_THROTTLE_RATES\": {\n" +
      "        \"anon\": \"100/day\",\n" +
      "        \"user\": \"1000/hour\",\n" +
      "    },\n" +
      "}\n\n" +
      "**ScopedRateThrottle** — задаём throttle_scope в классе вью, а лимит в DEFAULT_THROTTLE_RATES с соответствующим ключом.\n\n" +
      "**Важно:** по умолчанию throttle использует кэш Django. Для многопроцессорного деплоя нужен Redis-кэш, иначе лимиты не будут соблюдаться между воркерами.",
  },
  {
    id: "drf-pagination-types",
    question: "Какие типы пагинации есть в DRF и когда какой выбрать?",
    category: "Pagination",
    difficulty: "junior",
    answer:
      "**1. PageNumberPagination** — ?page=2\n" +
      "- Простой и понятный\n" +
      "- Не эффективен при частом изменении данных (объекты могут «прыгать» между страницами)\n" +
      "- Хорошо работает с большинством UI-компонентов пагинации\n\n" +
      "**2. LimitOffsetPagination** — ?limit=20&offset=40\n" +
      "- Гибкий: клиент управляет срезом\n" +
      "- Хорош для «бесконечной прокрутки»\n" +
      "- Проблема при сортировке и вставке данных между запросами\n\n" +
      "**3. CursorPagination** — ?cursor=cD0yMDI0LTAxLTAx\n" +
      "- Основан на курсоре (зашифрованная позиция в QuerySet)\n" +
      "- Единственный вариант для корректной пагинации данных, меняющихся в реальном времени\n" +
      "- Нельзя перепрыгнуть на произвольную страницу\n" +
      "- Требует уникальной сортировки (обычно created_at + id)\n\n" +
      "**Когда что использовать:**\n" +
      "- Статичные данные, нужны номера страниц → PageNumber\n" +
      "- Бесконечная прокрутка, статичные данные → LimitOffset\n" +
      "- Лента новостей, чат, live-данные → Cursor",
  },
  {
    id: "drf-validation",
    question: "Как работает валидация в DRF? Расскажите про уровни валидации.",
    category: "Serializers",
    difficulty: "middle",
    answer:
      "Валидация в DRF выполняется при вызове serializer.is_valid() в три этапа:\n\n" +
      "**1. Валидация на уровне поля** — встроенные проверки типа (CharField, IntegerField и т.д.): тип данных, required, max_length и т.д.\n\n" +
      "**2. Кастомная валидация поля** — метод validate_<field_name>(self, value):\n" +
      "def validate_age(self, value):\n" +
      "    if value < 18:\n" +
      "        raise serializers.ValidationError(\"Возраст < 18\")\n" +
      "    return value\n\n" +
      "**3. Кросс-полевая валидация** — метод validate(self, data):\n" +
      "def validate(self, data):\n" +
      "    if data[\"end_date\"] < data[\"start_date\"]:\n" +
      "        raise serializers.ValidationError(\"end_date должна быть позже start_date\")\n" +
      "    return data\n\n" +
      "**Validators** — можно добавлять на уровне поля, например UniqueValidator для проверки уникальности.\n\n" +
      "**raise_exception=True** — удобный способ вернуть 400 автоматически вместо ручной проверки if/else.",
  },
  {
    id: "drf-signals-vs-serializer",
    question: "Где лучше размещать бизнес-логику в DRF: в сериализаторе, во вью или в модели?",
    category: "Architecture",
    difficulty: "senior",
    answer:
      "Нет универсального ответа — зависит от типа логики:\n\n" +
      "**Модель** — логика, неразрывно связанная с данными:\n" +
      "- Вычисляемые свойства (@property)\n" +
      "- Методы, изменяющие только этот объект (publish(), archive())\n" +
      "- Менеджеры с бизнес-запросами (Article.objects.published())\n\n" +
      "**Сериализатор** — логика преобразования и валидации данных:\n" +
      "- Валидация входящих данных (validate_*, validate)\n" +
      "- Преобразование представления (SerializerMethodField)\n" +
      "- Простые операции создания/обновления\n\n" +
      "**Вью / ViewSet** — логика обработки HTTP-запроса:\n" +
      "- Определение кто делает запрос (request.user)\n" +
      "- Фильтрация по контексту запроса\n" +
      "- Вызов сервисов/команд\n\n" +
      "**Service layer** (рекомендуется для сложной логики) — отдельный модуль services.py, который содержит бизнес-логику. Вью вызывает сервис, сериализатор только сериализует результат.\n\n" +
      "**Правило:** если логика нужна в нескольких местах или содержит побочные эффекты (отправка email, задачи Celery) — выносите в сервис.",
  },
  {
    id: "drf-content-negotiation",
    question: "Что такое content negotiation в DRF? Как добавить поддержку нового формата?",
    category: "Core",
    difficulty: "senior",
    answer:
      "**Content negotiation** — механизм выбора формата ответа на основе заголовка Accept в запросе клиента.\n\n" +
      "**Как работает:**\n" +
      "1. Клиент отправляет Accept: application/json или Accept: application/xml\n" +
      "2. DRF перебирает renderer_classes вью в порядке приоритета\n" +
      "3. Выбирает первый рендерер, поддерживающий запрошенный media type\n" +
      "4. Рендерит данные в выбранный формат\n\n" +
      "**Встроенные рендереры:**\n" +
      "- JSONRenderer — application/json\n" +
      "- BrowsableAPIRenderer — text/html (браузерный интерфейс)\n\n" +
      "**Добавление нового формата (например, CSV):**\n" +
      "Создаём класс, наследующийся от BaseRenderer, задаём media_type и format, переопределяем метод render(). В методе render() преобразуем data в нужный формат и возвращаем строку или байты.\n\n" +
      "Затем указываем renderer_classes = [CSVRenderer, JSONRenderer] в конкретном вью или глобально через DEFAULT_RENDERER_CLASSES в settings.py.",
  },
];
