export type ExampleFile = {
  filename: string;
  code: string;
};

export type DjangoExample = {
  id: string;
  title: string;
  task: string;
  files: ExampleFile[];
  explanation: string;
};

export const djangoExamples: DjangoExample[] = [
  {
    id: "n-plus-1-optimization",
    title: "Оптимизация N+1 запросов",
    task: "Дан API-эндпоинт, который возвращает список заказов с информацией о покупателе, товарах и категориях товаров. При профилировании обнаружено более 200 SQL-запросов на один запрос страницы. Необходимо переработать QuerySet так, чтобы количество запросов не превышало 3–5 независимо от объёма данных.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )

    def __str__(self):
        return self.name


class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email


class Order(models.Model):
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name="orders"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Order #{self.pk} — {self.customer}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)`,
      },
      {
        filename: "api.py",
        code: `from rest_framework import serializers
from rest_framework.generics import ListAPIView

from .models import Category, Customer, Order, OrderItem, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "category"]


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "price"]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name", "email"]


class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ["id", "customer", "items", "total", "created_at"]


class OrderListView(ListAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        # Без оптимизации Django делал бы отдельный запрос
        # для каждого заказа, покупателя, позиции, товара и категории.
        #
        # select_related  — один SQL JOIN для ForeignKey/OneToOne
        # prefetch_related — отдельный запрос с WHERE id IN (...)
        #                    для обратных FK и цепочек связей
        #
        # Итого: 4 запроса независимо от числа заказов:
        #   1. SELECT orders JOIN customers
        #   2. SELECT order_items WHERE order_id IN (...)
        #   3. SELECT products WHERE id IN (...)
        #   4. SELECT categories WHERE id IN (...)
        return (
            Order.objects
            .select_related("customer")
            .prefetch_related("items__product__category")
        )`,
      },
    ],
    explanation: `**Проблема N+1** возникает, когда ORM делает один запрос для получения списка объектов, а затем N дополнительных запросов — по одному на каждый объект в списке. При 50 заказах с 4 позициями каждый — это 1 + 50 + 200 + 200 + 200 = 651 запрос.

**select_related** работает через SQL JOIN и используется для связей ForeignKey и OneToOne. Он добавляет связанные данные прямо в исходный запрос. В примере: \`select_related("customer")\` добавляет JOIN с таблицей покупателей.

**prefetch_related** делает отдельный запрос с \`WHERE id IN (...)\` для каждого уровня цепочки. Это правильный инструмент для обратных ForeignKey (один-ко-многим) и ManyToMany. Цепочка \`"items__product__category"\` превращается в 3 запроса, каждый из которых возвращает все нужные данные за один раз.

**Важно**: не нужно использовать \`select_related\` внутри вложенных сериализаторов вручную — достаточно один раз правильно настроить QuerySet в \`get_queryset\`. DRF возьмёт данные из уже загруженного кэша объектов.

**Как проверить**: установите \`django-debug-toolbar\` или добавьте логирование SQL и сравните количество запросов до и после оптимизации.`,
  },

  {
    id: "composite-indexes",
    title: "Составные индексы и покрывающие запросы",
    task: "Таблица событий содержит 50 миллионов записей. Запросы с фильтрацией по статусу, дате создания и идентификатору пользователя работают медленно. Необходимо разработать стратегию индексирования с учётом реальных паттернов запросов и проверить эффективность через EXPLAIN ANALYZE.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Event(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACTIVE = "active"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_CLOSED, "Closed"),
    ]

    user = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="events"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    # db_index=False — одиночный индекс не нужен,
    # поле покрыто составными индексами ниже
    created_at = models.DateTimeField(db_index=False)
    payload = models.JSONField(default=dict)

    class Meta:
        indexes = [
            # Для глобальных запросов по статусу и дате (без фильтра по user).
            # Порядок полей важен: сначала поле с низкой кардинальностью (status),
            # затем поле сортировки (created_at).
            models.Index(
                fields=["status", "created_at"],
                name="event_status_created_idx",
            ),
            # Для запросов конкретного пользователя.
            # user_id первым — PostgreSQL отсекает нерелевантные строки
            # ещё до проверки status и created_at.
            models.Index(
                fields=["user_id", "status", "created_at"],
                name="event_user_status_created_idx",
            ),
        ]`,
      },
      {
        filename: "queries.py",
        code: `from django.db import connection

from .models import Event


def get_user_active_events(user_id: int, since):
    """
    Использует индекс event_user_status_created_idx.
    Все три поля фильтра входят в индекс — PostgreSQL
    выполняет Index Scan без обращения к основной таблице.
    """
    return (
        Event.objects
        .filter(
            user_id=user_id,
            status=Event.STATUS_ACTIVE,
            created_at__gte=since,
        )
        .order_by("-created_at")
    )


def get_recent_by_status(status: str, limit: int = 100):
    """
    Использует индекс event_status_created_idx.
    ORDER BY created_at DESC совпадает с порядком в индексе —
    PostgreSQL избегает дополнительной сортировки.
    """
    return (
        Event.objects
        .filter(status=status)
        .order_by("-created_at")[:limit]
    )


def explain_query(queryset) -> str:
    """
    Выводит план выполнения через EXPLAIN ANALYZE.
    Использовать только в разработке, не в продакшене.

    Пример вывода при корректном индексе:
      Index Scan using event_user_status_created_idx on event
        Index Cond: ((user_id = 42) AND (status = 'active') AND (created_at >= '...'))
        Rows Removed by Filter: 0
    """
    sql, params = queryset.query.sql_with_params()
    with connection.cursor() as cursor:
        cursor.execute(f"EXPLAIN ANALYZE {sql}", params)
        rows = cursor.fetchall()
    return "\\n".join(row[0] for row in rows)


# Использование в Django shell:
#
#   from datetime import timedelta
#   from django.utils import timezone
#   from myapp.queries import get_user_active_events, explain_query
#
#   qs = get_user_active_events(
#       user_id=42,
#       since=timezone.now() - timedelta(days=30),
#   )
#   print(explain_query(qs))`,
      },
    ],
    explanation: `**Порядок полей в составном индексе** — ключевое решение. PostgreSQL может использовать индекс \`(A, B, C)\` для запросов по \`A\`, \`A + B\` и \`A + B + C\`, но не для запроса только по \`B\` или \`C\`. Поэтому \`user_id\` стоит первым: он даёт максимальную селективность при фильтрации по конкретному пользователю.

**Кардинальность и порядок** в индексе \`(status, created_at)\`: \`status\` имеет всего 3 значения (низкая кардинальность), но стоит первым, потому что типичные запросы всегда фильтруют по нему. Добавление \`created_at\` после позволяет PostgreSQL выполнять сортировку прямо из индекса без дополнительного шага.

**Index-only scan** возникает, когда все нужные запросу колонки уже есть в индексе. Для этого и добавлен параметр \`db_index=False\` на поле \`created_at\` — одиночный индекс был бы лишним, поскольку поле полностью покрыто составными индексами.

**EXPLAIN ANALYZE** показывает реальный план выполнения. Ищите в выводе \`Index Scan\` или \`Index Only Scan\` — это признак использования индекса. \`Seq Scan\` означает полное сканирование таблицы и сигнализирует о проблеме. Параметр \`Rows Removed by Filter\` показывает, сколько строк было отфильтровано уже после чтения — чем меньше, тем лучше индекс.

**Не создавайте лишних индексов**: каждый индекс замедляет INSERT/UPDATE/DELETE и занимает место на диске. Два составных индекса здесь лучше, чем четыре одиночных.`,
  },

  {
    id: "annotations-aggregations",
    title: "Аннотации и агрегации сложных метрик",
    task: "Требуется реализовать дашборд продаж: сумма выручки по месяцам, средний чек, количество уникальных покупателей, доля повторных заказов — всё это должно вычисляться на уровне базы данных без обработки в Python.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Order(models.Model):
    customer = models.ForeignKey(
        "auth.User", on_delete=models.PROTECT, related_name="orders"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["created_at", "is_paid"], name="order_date_paid_idx"),
        ]`,
      },
      {
        filename: "analytics.py",
        code: `from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import TruncMonth

from .models import Order


def get_sales_dashboard(year: int) -> dict:
    """
    Возвращает метрики дашборда продаж за указанный год.
    Все вычисления выполняются на стороне базы данных.
    """
    paid_orders = Order.objects.filter(created_at__year=year, is_paid=True)

    monthly_stats = _get_monthly_stats(paid_orders)
    buyer_stats = _get_buyer_stats(paid_orders)

    return {
        "monthly": monthly_stats,
        **buyer_stats,
    }


def _get_monthly_stats(queryset) -> list[dict]:
    """
    Выручка, средний чек и количество заказов по месяцам.
    TruncMonth группирует даты по первому числу месяца.
    """
    return list(
        queryset
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(
            revenue=Sum("total"),
            avg_order=Avg("total"),
            orders_count=Count("id"),
        )
        .order_by("month")
    )


def _get_buyer_stats(queryset) -> dict:
    """
    Уникальные покупатели и доля повторных заказов.

    Используем два запроса: сначала группируем по покупателю,
    затем считаем тех, у кого больше одного заказа.
    """
    by_customer = (
        queryset
        .values("customer_id")
        .annotate(order_count=Count("id"))
    )

    total_buyers = by_customer.count()
    repeat_buyers = by_customer.filter(order_count__gt=1).count()

    return {
        "unique_buyers": total_buyers,
        "repeat_order_rate": round(repeat_buyers / total_buyers, 4) if total_buyers else 0.0,
    }`,
      },
    ],
    explanation: `**TruncMonth** из \`django.db.models.functions\` усекает datetime до первого числа месяца прямо в SQL. После \`annotate(month=TruncMonth("created_at"))\` можно сгруппировать по этому вычисляемому полю через \`values("month")\`, а затем применить агрегации к каждой группе.

**Цепочка values → annotate** — стандартный паттерн для агрегации с группировкой в Django ORM. Порядок важен: \`values()\` перед \`annotate()\` означает GROUP BY, \`annotate()\` перед \`values()\` — добавление вычисляемого поля к каждой строке.

**Разбиение на функции** (\`_get_monthly_stats\` и \`_get_buyer_stats\`) — не усложнение, а необходимость: две задачи требуют принципиально разных GROUP BY, их нельзя совместить в одном запросе без подзапросов. Каждая функция делает ровно один запрос к БД.

**Доля повторных заказов** вычисляется в два запроса: \`count()\` на сгруппированном QuerySet даёт число уникальных покупателей, \`filter(order_count__gt=1).count()\` — число тех, кто заказывал больше одного раза. Django строит оба запроса как \`SELECT COUNT(*) FROM (SELECT customer_id, COUNT(id) ... GROUP BY customer_id) subq\`.

**Базовый QuerySet** \`paid_orders\` передаётся в обе вспомогательные функции — это гарантирует единообразную фильтрацию по году и статусу оплаты без дублирования условий.`,
  },

  {
    id: "soft-delete-manager",
    title: "Кастомный менеджер с мягким удалением",
    task: "Реализовать паттерн soft delete для нескольких моделей. Записи не удаляются физически, а помечаются флагом deleted_at. Менеджер по умолчанию должен исключать удалённые записи, при этом сохраняя возможность работать с полным набором данных и восстанавливать объекты.",
    files: [
      {
        filename: "mixins.py",
        code: `from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet с поддержкой мягкого удаления для bulk-операций."""

    def delete(self):
        return self.update(deleted_at=timezone.now())

    def restore(self):
        return self.update(deleted_at=None)

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager):
    """Менеджер по умолчанию — возвращает только не удалённые записи."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            deleted_at__isnull=True
        )


class AllObjectsManager(models.Manager):
    """Менеджер для доступа ко всем записям, включая удалённые."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteMixin(models.Model):
    """
    Абстрактный миксин. Подключается к любой модели через наследование.

    Использование:
        class Article(SoftDeleteMixin):
            ...

        Article.objects.all()          # только активные
        Article.all_objects.all()      # все, включая удалённые
        article.delete()               # мягкое удаление
        article.restore()              # восстановление
        article.hard_delete()          # физическое удаление
    """

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    def hard_delete(self):
        super().delete()

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None`,
      },
      {
        filename: "models.py",
        code: `from django.db import models
from .mixins import SoftDeleteMixin


class Article(SoftDeleteMixin):
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="articles"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Comment(SoftDeleteMixin):
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="comments"
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.article}"


# --- Примеры использования ---
#
# Мягкое удаление одного объекта:
#   article.delete()
#   article.is_deleted  # True
#
# Bulk мягкое удаление через QuerySet:
#   Article.objects.filter(author=user).delete()
#
# Восстановление группы объектов:
#   Article.all_objects.filter(author=user, deleted_at__isnull=False).restore()
#
# Физическое удаление:
#   article.hard_delete()`,
      },
    ],
    explanation: `**Разделение ответственности** между двумя менеджерами — ключевое решение. \`objects\` (по умолчанию) автоматически фильтрует удалённые записи, поэтому весь существующий код продолжает работать без изменений. \`all_objects\` даёт явный доступ к полному набору данных и документирует намерение разработчика.

**Кастомный QuerySet** (а не только Manager) позволяет вызывать \`delete()\`, \`restore()\` и \`hard_delete()\` на выборке целиком: \`Article.objects.filter(author=user).delete()\` пометит все найденные записи одним UPDATE без загрузки их в Python.

**abstract = True** в \`SoftDeleteMixin\` означает, что Django не создаёт отдельную таблицу для миксина — поле \`deleted_at\` добавляется в таблицу каждой конкретной модели. Это единственный правильный способ переиспользования полей через наследование.

**Осторожно с каскадными удалениями**: если \`Article\` удалён мягко, а \`Comment\` использует \`on_delete=models.CASCADE\`, Django всё равно физически удалит комментарии при жёстком удалении статьи. Если нужно каскадное мягкое удаление — переопределите \`delete()\` в модели \`Article\` явно.`,
  },

  {
    id: "transactions-atomicity",
    title: "Транзакции и атомарность операций",
    task: "Реализовать операцию перевода средств между счетами пользователей. Необходимо обеспечить атомарность, корректную обработку гонок данных (race conditions), защиту от двойного списания и правильное логирование в случае ошибки с полным откатом изменений.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Account(models.Model):
    user = models.OneToOneField(
        "auth.User", on_delete=models.CASCADE, related_name="account"
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Account #{self.pk} (balance: {self.balance})"


class TransactionLog(models.Model):
    from_account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="outgoing"
    )
    to_account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="incoming"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    # Уникальный ключ от клиента — гарантирует идемпотентность операции
    idempotency_key = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["from_account", "created_at"], name="txlog_from_created_idx"),
        ]`,
      },
      {
        filename: "services.py",
        code: `import logging
from decimal import Decimal

from django.db import transaction

from .models import Account, TransactionLog

logger = logging.getLogger(__name__)


class InsufficientFundsError(Exception):
    pass


class DuplicateTransactionError(Exception):
    pass


def transfer_funds(
    from_account_id: int,
    to_account_id: int,
    amount: Decimal,
    idempotency_key: str,
) -> TransactionLog:
    """
    Атомарно переводит средства между счетами.

    Защита от race conditions: select_for_update() блокирует строки
    на уровне БД до конца транзакции — параллельный перевод с того же
    счёта будет ждать снятия блокировки.

    Защита от дедлоков: счета блокируются в порядке возрастания ID.
    Без этого два встречных перевода (A→B и B→A) могут взаимно ждать
    друг друга, если каждый захватит свой первый счёт.

    Идемпотентность: повторный запрос с тем же ключом не создаст
    дублирующий перевод.
    """
    if amount <= 0:
        raise ValueError("Amount must be positive")

    if from_account_id == to_account_id:
        raise ValueError("Cannot transfer to the same account")

    # Проверяем идемпотентность до старта транзакции — дешевле
    if TransactionLog.objects.filter(idempotency_key=idempotency_key).exists():
        raise DuplicateTransactionError(
            f"Transaction '{idempotency_key}' already processed"
        )

    with transaction.atomic():
        # sorted() гарантирует одинаковый порядок блокировки
        # при любом направлении перевода — дедлок невозможен
        ids_in_order = sorted([from_account_id, to_account_id])
        accounts = {
            acc.id: acc
            for acc in Account.objects.select_for_update().filter(id__in=ids_in_order)
        }

        if len(accounts) != 2:
            raise Account.DoesNotExist("One or both accounts not found")

        from_account = accounts[from_account_id]
        to_account = accounts[to_account_id]

        if from_account.balance < amount:
            raise InsufficientFundsError(
                f"Insufficient funds: balance {from_account.balance}, required {amount}"
            )

        from_account.balance -= amount
        to_account.balance += amount
        Account.objects.bulk_update([from_account, to_account], ["balance"])

        log = TransactionLog.objects.create(
            from_account=from_account,
            to_account=to_account,
            amount=amount,
            idempotency_key=idempotency_key,
        )

    # Логирование после коммита транзакции:
    # внутри atomic() при откате запись в лог тоже откатилась бы,
    # но внешний обработчик (Sentry, stdout) уже получил бы сообщение
    logger.info(
        "Transfer completed",
        extra={
            "from_account_id": from_account_id,
            "to_account_id": to_account_id,
            "amount": str(amount),
            "transaction_id": log.pk,
        },
    )

    return log`,
      },
    ],
    explanation: `**select_for_update()** добавляет \`SELECT ... FOR UPDATE\` в SQL — PostgreSQL ставит эксклюзивную блокировку на строки до конца транзакции. Любой другой запрос, пытающийся изменить те же счета, будет ждать. Это единственный надёжный способ предотвратить race condition при параллельных списаниях.

**Порядок блокировки по ID** — защита от дедлока. Если поток A блокирует счёт 1, поток B — счёт 2, и оба ждут вторую блокировку, возникает взаимная блокировка. \`sorted([from_id, to_id])\` гарантирует, что оба потока всегда блокируют счета в одном порядке — тот, кто заблокировал меньший ID, получит и больший.

**atomic()** оборачивает все изменения в одну транзакцию. При любом исключении PostgreSQL откатывает все изменения целиком — баланс не уйдёт в минус и лог-запись не появится.

**Идемпотентность через уникальный ключ**: клиент генерирует \`idempotency_key\` (например, UUID) для каждого перевода и сохраняет его. При сетевом сбое безопасно повторить запрос — если перевод уже прошёл, придёт \`DuplicateTransactionError\` вместо повторного списания.

**Логирование после atomic()** принципиально важно. Если бы \`logger.info\` находился внутри блока, при откате транзакции запись в базе исчезла бы, но внешняя система логирования (Sentry, stdout) уже получила бы сообщение об успехе — ложный результат.`,
  },

  {
    id: "postgresql-partitioning",
    title: "Партиционирование таблиц через PostgreSQL",
    task: "Таблица логов вырастает до 100+ миллионов записей в месяц. Необходимо настроить партиционирование по дате через нативные механизмы PostgreSQL, интегрировать это с Django ORM и организовать автоматическое создание новых партиций.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class EventLog(models.Model):
    """
    Партиционированная таблица логов событий.

    managed = False: Django не создаёт и не изменяет таблицу автоматически —
    она управляется вручную через миграцию с RunSQL.
    Весь остальной ORM-интерфейс (фильтрация, создание записей) работает
    в обычном режиме — никаких изменений в коде, использующем модель.
    """

    event_type = models.CharField(max_length=100)
    user_id = models.IntegerField(null=True, blank=True)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "event_log"`,
      },
      {
        filename: "migrations/0001_event_log_partitioned.py",
        code: `from django.db import migrations


class Migration(migrations.Migration):
    dependencies = []

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS event_log (
                id          BIGSERIAL,
                event_type  VARCHAR(100) NOT NULL,
                user_id     INTEGER,
                payload     JSONB        NOT NULL DEFAULT '{}',
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                -- Ключ партиционирования обязан входить в PRIMARY KEY
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at);

            -- Индексы на родительской таблице автоматически
            -- наследуются всеми текущими и будущими партициями
            CREATE INDEX IF NOT EXISTS event_log_user_created_idx
                ON event_log (user_id, created_at);

            CREATE INDEX IF NOT EXISTS event_log_type_created_idx
                ON event_log (event_type, created_at);
            """,
            reverse_sql="DROP TABLE IF EXISTS event_log CASCADE;",
        ),
    ]`,
      },
      {
        filename: "management/commands/create_log_partitions.py",
        code: `from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import connection, ProgrammingError


class Command(BaseCommand):
    """
    Создаёт месячные партиции для таблицы event_log.

    Запускать заблаговременно (например, 1-го числа каждого месяца через cron):
        python manage.py create_log_partitions --months-ahead 3

    Если партиция на текущий месяц отсутствует, PostgreSQL
    бросит ошибку при INSERT — создавайте партиции с запасом.
    """

    help = "Creates monthly partitions for the event_log table"

    def add_arguments(self, parser):
        parser.add_argument(
            "--months-ahead",
            type=int,
            default=3,
            help="Number of upcoming months to prepare (default: 3)",
        )

    def handle(self, *args, **options):
        start = date.today().replace(day=1)
        for _ in range(options["months_ahead"]):
            self._create_partition(start)
            start = self._next_month(start)

    @staticmethod
    def _next_month(d: date) -> date:
        """Первое число следующего месяца без сторонних зависимостей."""
        return (d.replace(day=28) + timedelta(days=4)).replace(day=1)

    def _create_partition(self, month_start: date) -> None:
        month_end = self._next_month(month_start)
        # Имя формируется из date — SQL-инъекция невозможна
        name = f"event_log_{month_start.year:04d}_{month_start.month:02d}"

        sql = f"""
            CREATE TABLE IF NOT EXISTS {name}
            PARTITION OF event_log
            FOR VALUES FROM ('{month_start.isoformat()}')
                        TO   ('{month_end.isoformat()}');
        """

        try:
            with connection.cursor() as cursor:
                cursor.execute(sql)
            self.stdout.write(
                self.style.SUCCESS(f"+ {name}  ({month_start} → {month_end})")
            )
        except ProgrammingError as exc:
            self.stderr.write(self.style.ERROR(f"✗ {name}: {exc}"))`,
      },
    ],
    explanation: `**managed = False** сигнализирует Django, что таблица управляется вручную. ORM продолжает работать в полном объёме — фильтрация, создание записей, аннотации — но Django не будет пытаться создать или изменить таблицу при \`migrate\`. Это стандартный способ использовать возможности PostgreSQL, недоступные через Django ORM напрямую.

**PARTITION BY RANGE(created_at)** создаёт родительскую таблицу без физических данных. Все записи хранятся в дочерних партициях. PostgreSQL автоматически направляет INSERT в нужную партицию и пропускает ненужные партиции при SELECT (partition pruning) — запрос за последний месяц читает только одну партицию из двенадцати.

**PRIMARY KEY (id, created_at)** — требование PostgreSQL: поле партиционирования обязано входить в первичный ключ. \`id\` уникален в рамках каждой партиции, но не глобально. Если нужна глобальная уникальность, используйте \`UUID\` вместо \`BIGSERIAL\`.

**Индексы на родительской таблице** автоматически наследуются при создании каждой новой партиции через \`PARTITION OF\`. Создавать индексы для каждой партиции вручную не нужно.

**Управляющая команда** запускается через cron с запасом в 2–3 месяца. \`CREATE TABLE IF NOT EXISTS\` делает её идемпотентной — повторный запуск безопасен. \`_next_month\` реализован без \`dateutil\` намеренно: трюк с \`replace(day=28) + timedelta(days=4)\` переходит в следующий месяц, а \`replace(day=1)\` возвращает его первое число.`,
  },
];
