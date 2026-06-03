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

  {
    id: "n-plus-1-optimization-v2",
    title: "Оптимизация N+1 запросов (Второй вариант)",
    task: "У вас есть модели Author и Book (один ко многим). Напишите представление, которое возвращает список авторов с количеством книг каждого и последней опубликованной книгой. Реализуйте решение без N+1 проблемы, используя select_related, prefetch_related и аннотации annotate. Обоснуйте выбор метода оптимизации в каждом случае.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Author(models.Model):
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Book(models.Model):
    author = models.ForeignKey(
        Author, on_delete=models.CASCADE, related_name="books"
    )
    title = models.CharField(max_length=300)
    published_at = models.DateField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        ordering = ["-published_at"]
        indexes = [
            models.Index(fields=["author", "published_at"], name="book_author_pub_idx"),
        ]

    def __str__(self):
        return self.title`,
      },
      {
        filename: "views.py",
        code: `from django.db.models import Count, Prefetch
from rest_framework import serializers
from rest_framework.generics import ListAPIView

from .models import Author, Book


class LatestBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "published_at", "price"]


class AuthorSerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField()
    latest_book = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ["id", "name", "bio", "book_count", "latest_book"]

    def get_latest_book(self, instance):
        # Данные уже в prefetch-кэше — дополнительных запросов нет
        books = instance.latest_books_prefetch
        return LatestBookSerializer(books[0]).data if books else None


class AuthorListView(ListAPIView):
    serializer_class = AuthorSerializer

    def get_queryset(self):
        # --- Почему annotate, а не select_related для book_count? ---
        # book_count — агрегация по обратной стороне FK (один ко многим).
        # select_related работает только с прямыми FK/OneToOne.
        # annotate добавляет COUNT прямо в SQL через GROUP BY —
        # один запрос вместо N запросов COUNT.

        # --- Почему Prefetch, а не annotate для latest_book? ---
        # annotate(latest_pub=Max("books__published_at")) даёт только дату,
        # но не полный объект книги. Prefetch с DISTINCT ON загружает
        # полный объект за один дополнительный SQL-запрос.

        # DISTINCT ON (author_id) + ORDER BY author_id, -published_at
        # возвращает по одной последней книге на автора.
        # Только PostgreSQL; для MySQL/SQLite — Subquery-вариант ниже.
        latest_books_qs = (
            Book.objects
            .order_by("author_id", "-published_at")
            .distinct("author_id")
        )

        return (
            Author.objects
            # annotate: один SQL с LEFT JOIN + GROUP BY
            .annotate(book_count=Count("books"))
            # Prefetch: один SQL с WHERE author_id IN (...)
            .prefetch_related(
                Prefetch(
                    "books",
                    queryset=latest_books_qs,
                    to_attr="latest_books_prefetch",
                )
            )
            .order_by("name")
        )

        # --- Альтернатива: Subquery — совместима с MySQL/SQLite ---
        #
        # from django.db.models import OuterRef, Subquery
        #
        # latest_id = (
        #     Book.objects
        #     .filter(author=OuterRef("pk"))
        #     .order_by("-published_at")
        #     .values("id")[:1]
        # )
        # return (
        #     Author.objects
        #     .annotate(
        #         book_count=Count("books"),
        #         latest_book_id=Subquery(latest_id),
        #     )
        # )
        # Минус: Subquery возвращает только id; для полного объекта книги
        # нужен ещё один Prefetch или постобработка в Python.`,
      },
    ],
    explanation: `**Три инструмента — три разные задачи:**

**annotate(book_count=Count("books"))** — единственный правильный выбор для агрегации по обратной стороне FK. Django добавляет \`COUNT(book.id)\` прямо в SQL через LEFT OUTER JOIN + GROUP BY. Один запрос на все авторы. \`select_related\` здесь неприменим: он работает только с прямыми ForeignKey/OneToOne и не умеет считать.

**select_related** подходит для прямых FK (Book → Author, не наоборот). Если нужно загружать автора вместе с книгами — \`select_related("author")\` внутри QuerySet для Prefetch. В данном примере select_related не нужен на уровне авторов, потому что у нас нет вложенных FK на Author.

**Prefetch с DISTINCT ON** — оптимальный способ получить полный объект последней книги за один запрос. \`DISTINCT ON (author_id)\` — PostgreSQL-специфика: возвращает одну строку на автора согласно ORDER BY. Django раскладывает результаты по атрибуту \`latest_books_prefetch\` каждого объекта Author.

**Subquery с OuterRef** — переносимая альтернатива. Коррелированный подзапрос выполняется для каждого автора и возвращает \`id\` последней книги. Минус — возвращает только одно поле; для полного объекта потребуется ещё один Prefetch.

**Итого запросов:** 3 независимо от числа авторов:
1. \`SELECT authors, COUNT(books) ... GROUP BY authors.id\`
2. \`SELECT DISTINCT ON (author_id) books ORDER BY author_id, -published_at\``,
  },

  {
    id: "complex-aggregations-conditions",
    title: "Сложные агрегации с условиями",
    task: "Есть модели Order, OrderItem и Product. Напишите ORM-запрос, который возвращает товары, у которых: суммарное количество продаж за последние 30 дней превышает 100 единиц, средняя цена продажи выше базовой цены на 10%, и которые продавались хотя бы в 5 разных заказах. Используйте Subquery, OuterRef, Case/When по необходимости.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ]


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="order_items"
    )
    quantity = models.PositiveIntegerField()
    # Цена на момент продажи (может отличаться от base_price)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(
                fields=["product", "order"],
                name="orderitem_product_order_idx",
            ),
        ]`,
      },
      {
        filename: "queries.py",
        code: `from datetime import timedelta

from django.db.models import (
    Avg,
    Case,
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    OuterRef,
    Subquery,
    Sum,
    When,
)
from django.utils import timezone

from .models import Order, OrderItem, Product


def get_top_selling_products():
    """
    Возвращает товары, у которых за последние 30 дней:
      1. суммарные продажи > 100 единиц,
      2. средняя цена продажи выше базовой на 10%,
      3. продажи были хотя бы в 5 разных заказах.
    """
    since = timezone.now() - timedelta(days=30)

    # Базовый QuerySet позиций за 30 дней — переиспользуется в трёх Subquery
    recent_items = OrderItem.objects.filter(
        product=OuterRef("pk"),
        order__status=Order.STATUS_COMPLETED,
        order__created_at__gte=since,
    )

    # Subquery: суммарное количество продаж
    total_sold_sq = Subquery(
        recent_items.values("product").annotate(v=Sum("quantity")).values("v"),
        output_field=DecimalField(),
    )

    # Subquery: средняя цена продажи
    avg_price_sq = Subquery(
        recent_items.values("product").annotate(v=Avg("sale_price")).values("v"),
        output_field=DecimalField(),
    )

    # Subquery: количество уникальных заказов
    order_count_sq = Subquery(
        recent_items.values("product").annotate(
            v=Count("order", distinct=True)
        ).values("v"),
        output_field=DecimalField(),
    )

    # ExpressionWrapper: вычисляем порог +10% на стороне БД.
    # Нужен, чтобы затем фильтровать avg_sale_price__gt=F("price_threshold")
    # без загрузки данных в Python.
    price_threshold = ExpressionWrapper(
        F("base_price") * 1.10,
        output_field=DecimalField(max_digits=10, decimal_places=2),
    )

    return (
        Product.objects
        .annotate(
            total_sold=total_sold_sq,
            avg_sale_price=avg_price_sq,
            unique_orders=order_count_sq,
            price_threshold=price_threshold,
        )
        .filter(
            total_sold__gt=100,                       # условие 1
            avg_sale_price__gt=F("price_threshold"),  # условие 2
            unique_orders__gte=5,                     # условие 3
        )
        .order_by("-total_sold")
    )


def get_products_with_performance_label():
    """
    Демонстрация Case/When: категоризация товаров по объёму продаж.
    SQL CASE WHEN ... THEN ... END вычисляется полностью на стороне БД.
    """
    since = timezone.now() - timedelta(days=30)

    total_sold_sq = Subquery(
        OrderItem.objects
        .filter(
            product=OuterRef("pk"),
            order__status=Order.STATUS_COMPLETED,
            order__created_at__gte=since,
        )
        .values("product")
        .annotate(v=Sum("quantity"))
        .values("v"),
        output_field=DecimalField(),
    )

    return (
        Product.objects
        .annotate(total_sold=total_sold_sq)
        .annotate(
            performance=Case(
                When(total_sold__gte=500, then="high"),
                When(total_sold__gte=100, then="medium"),
                When(total_sold__gt=0,    then="low"),
                default="none",
            )
        )
        .order_by("-total_sold")
    )`,
      },
    ],
    explanation: `**Почему Subquery, а не annotate напрямую на Product?**

Если написать \`Product.objects.annotate(total_sold=Sum("order_items__quantity"))\` и добавить фильтр по дате через \`filter()\` до \`annotate()\`, Django построит один большой JOIN. При нескольких такиx аннотациях JOIN'ы начнут перемножаться и агрегаты получатся неверными. \`Subquery\` изолирует каждую агрегацию в отдельный коррелированный подзапрос — результат всегда точен.

**OuterRef("pk")** — ссылка на \`id\` текущей строки внешнего запроса (Product) внутри Subquery. PostgreSQL выполняет подзапрос для каждой строки Product, подставляя её \`pk\` в условие \`WHERE product_id = <pk>\`.

**ExpressionWrapper** нужен при арифметических операциях с полями ORM — он явно указывает тип результата (\`output_field\`). Без него Django не знает, как интерпретировать \`F("base_price") * 1.10\`. После аннотации \`price_threshold\` можно фильтровать \`avg_sale_price__gt=F("price_threshold")\` — всё сравнение происходит в SQL.

**Case/When** реализует SQL \`CASE WHEN ... THEN ... END\`. Порядок условий важен: Django проверяет их сверху вниз и применяет первое совпавшее. \`default\` соответствует \`ELSE\`.

**Итого запросов: 1** — все три Subquery выполняются как коррелированные подзапросы внутри одного SELECT. При большом числе товаров рассмотрите CTE через \`RawSQL\` или агрегации с \`filter=Q(...)\` в \`Count/Sum\` (SQL FILTER WHERE) — один JOIN может быть быстрее трёх коррелированных подзапросов.`,
  },

  {
    id: "custom-manager-queryset",
    title: "Кастомный менеджер и QuerySet",
    task: "Создайте кастомный менеджер для модели Article со следующей цепочкой методов: .published() — только опубликованные, .recent(days=7) — за последние N дней, .by_category(slug) — по категории, .with_stats() — аннотирует количество просмотров и комментариев. Менеджер должен сохранять возможность дальнейшего чейнинга.",
    files: [
      {
        filename: "managers.py",
        code: `from datetime import timedelta

from django.db import models
from django.db.models import Count, Q
from django.utils import timezone


class ArticleQuerySet(models.QuerySet):
    """
    Кастомный QuerySet — каждый метод возвращает QuerySet,
    что обеспечивает бесконечный чейнинг:

        Article.objects
            .published()
            .recent(days=14)
            .by_category("django")
            .with_stats()
            .select_related("author", "category")[:10]
    """

    def published(self):
        """Только опубликованные статьи."""
        return self.filter(is_published=True)

    def recent(self, days: int = 7):
        """
        Статьи, опубликованные не ранее чем days дней назад.
        Фильтруем по published_at, а не created_at: статья может
        быть создана в черновике и опубликована позже.
        """
        since = timezone.now() - timedelta(days=days)
        return self.filter(published_at__gte=since)

    def by_category(self, slug: str):
        """Фильтр по slug категории через JOIN (один запрос)."""
        return self.filter(category__slug=slug)

    def with_stats(self):
        """
        Аннотирует количество одобренных комментариев.

        Count с filter=Q(...) реализует SQL FILTER (WHERE ...):
            COUNT(comment.id) FILTER (WHERE comment.is_approved = TRUE)
        Это один LEFT JOIN без подзапроса.
        distinct=True защищает от дублирования строк при других JOIN'ах.
        """
        return self.annotate(
            comments_count=Count(
                "comments",
                filter=Q(comments__is_approved=True),
                distinct=True,
            ),
        )

    def popular(self, min_views: int = 1000):
        """Дополнительный метод — демонстрация расширяемости."""
        return self.filter(views_count__gte=min_views)


# Самый лаконичный способ создать менеджер из QuerySet — одна строка.
# from_queryset() автоматически проксирует все методы QuerySet через Manager,
# поэтому Article.objects.published() работает напрямую.
ArticleManager = models.Manager.from_queryset(ArticleQuerySet)

# Альтернатива — явный класс (нужен только при переопределении get_queryset,
# например для soft delete или мультитенантности):
#
# class ArticleManager(models.Manager):
#     def get_queryset(self):
#         return ArticleQuerySet(self.model, using=self._db)`,
      },
      {
        filename: "models.py",
        code: `from django.db import models
from .managers import ArticleManager


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=300)
    body = models.TextField()
    author = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="articles"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="articles",
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)

    # Подключаем кастомный менеджер вместо стандартного objects
    objects = ArticleManager()

    class Meta:
        ordering = ["-published_at"]
        indexes = [
            models.Index(
                fields=["is_published", "published_at"],
                name="article_pub_date_idx",
            ),
        ]

    def __str__(self):
        return self.title


class Comment(models.Model):
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="comments"
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import serializers
from rest_framework.generics import ListAPIView

from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    comments_count = serializers.IntegerField(default=0)
    author_name = serializers.CharField(source="author.get_full_name")
    category_name = serializers.CharField(
        source="category.name", allow_null=True
    )

    class Meta:
        model = Article
        fields = [
            "id", "title", "author_name", "category_name",
            "published_at", "views_count", "comments_count",
        ]


class RecentArticlesView(ListAPIView):
    """Последние опубликованные статьи в категории со статистикой."""
    serializer_class = ArticleSerializer

    def get_queryset(self):
        category_slug = self.kwargs.get("category_slug", "")
        days = int(self.request.query_params.get("days", 7))

        # Полный чейнинг: каждый метод сужает выборку и возвращает QuerySet.
        # Стандартные методы QuerySet (select_related, order_by, и т.д.)
        # совместимы с кастомными без дополнительного кода.
        return (
            Article.objects
            .published()
            .recent(days=days)
            .by_category(category_slug)
            .with_stats()
            .select_related("author", "category")
            .order_by("-published_at")
        )


# --- Примеры использования в Django shell ---
#
# Базовый чейнинг:
#   Article.objects.published().recent()
#
# Популярные за 30 дней со статистикой:
#   Article.objects.published().recent(30).by_category("django").popular(500).with_stats()
#
# Совместимость со стандартными методами:
#   Article.objects.published().with_stats().filter(comments_count__gt=10).order_by("-comments_count")
#
# values(), exclude() и всё остальное тоже работает:
#   Article.objects.published().recent().values("title", "published_at")`,
      },
    ],
    explanation: `**Главное правило**: методы для чейнинга реализуются в **QuerySet**, а не в Manager. Если добавить \`.published()\` только в Manager, вызов \`Article.objects.published().recent()\` упадёт с \`AttributeError\` — \`.published()\` вернёт обычный QuerySet, у которого нет метода \`.recent()\`.

**Manager.from_queryset(ArticleQuerySet)** — самый лаконичный способ подключить QuerySet к менеджеру одной строкой. Django автоматически проксирует все публичные методы QuerySet через Manager. Явный класс менеджера нужен только при переопределении \`get_queryset()\` (например, soft delete или мультитенантность).

**Count с filter=Q(...)** реализует SQL \`FILTER (WHERE ...)\` — стандарт SQL:2003, поддерживается PostgreSQL, SQLite ≥ 3.25, MariaDB ≥ 10.3. Это один LEFT JOIN без подзапросов, в отличие от Subquery. \`distinct=True\` защищает от умножения строк, если в QuerySet есть другие JOIN'ы.

**Фильтр по published_at в .recent()**: статья создаётся в черновике (\`created_at\`), а публикуется позже (\`published_at\`). Фильтрация по \`created_at\` могла бы включать статьи, которые ещё не опубликованы, или исключать старые, опубликованные недавно.

**Расширяемость**: новый метод — одна функция в \`ArticleQuerySet\`, без изменений в существующих методах и в коде, который их использует. Это главное преимущество паттерна перед Manager с одиночными методами или утилитарными функциями.`,
  },


  {
    id: "window-functions",
    title: "Оконные функции в Django ORM",
    task: "Реализуйте запрос с использованием оконных функций (Window functions) через Django ORM. Задача: для каждой транзакции пользователя вычислить накопительный итог по сумме, порядковый номер транзакции в рамках месяца и отклонение от среднего по всем транзакциям пользователя. Используйте Window, Rank, RowNumber, Lag.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Transaction(models.Model):
    TYPE_CREDIT = "credit"
    TYPE_DEBIT  = "debit"
    TYPE_CHOICES = [
        (TYPE_CREDIT, "Credit"),
        (TYPE_DEBIT,  "Debit"),
    ]

    user = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="transactions"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    created_at = models.DateTimeField()
    description = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["user_id", "created_at"]
        indexes = [
            models.Index(
                fields=["user_id", "created_at"],
                name="txn_user_created_idx",
            ),
        ]

    def __str__(self):
        return f"Txn #{self.pk} ({self.user_id}): {self.amount}"`,
      },
      {
        filename: "analytics.py",
        code: `from django.db.models import Avg, DecimalField, ExpressionWrapper, F, Window
from django.db.models.functions import (
    Lag,
    Rank,
    RowNumber,
    TruncMonth,
    Sum as WinSum,
)

from .models import Transaction


def get_user_transaction_stats(user_id: int):
    """
    Для каждой транзакции пользователя вычисляет:
      - row_num     : порядковый номер внутри каждого месяца
      - rank_in_month: ранг по убыванию суммы внутри месяца
      - running_total: накопительный итог суммы с начала истории
      - avg_deviation: отклонение суммы транзакции от среднего
                       по ВСЕМ транзакциям пользователя
      - prev_amount  : сумма предыдущей транзакции (Lag)

    Все вычисления выполняются одним SQL-запросом на стороне БД.
    """
    return (
        Transaction.objects
        .filter(user_id=user_id)
        .annotate(
            # --- RowNumber: порядковый номер в рамках месяца ---
            # PARTITION BY — окно сбрасывается на каждый новый месяц.
            # ORDER BY created_at — строки нумеруются по дате внутри окна.
            row_num=Window(
                expression=RowNumber(),
                partition_by=[TruncMonth("created_at")],
                order_by="created_at",
            ),

            # --- Rank: ранг по убыванию суммы внутри месяца ---
            # Rank даёт одинаковый ранг транзакциям с равной суммой
            # (в отличие от RowNumber, который всегда уникален).
            rank_in_month=Window(
                expression=Rank(),
                partition_by=[TruncMonth("created_at")],
                order_by=F("amount").desc(),
            ),

            # --- SUM OVER: накопительный итог ---
            # Без PARTITION BY — окно охватывает все строки пользователя.
            # ORDER BY created_at + ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            # — Django добавляет этот фрейм автоматически при наличии order_by.
            running_total=Window(
                expression=WinSum("amount"),
                order_by="created_at",
            ),

            # --- AVG OVER: среднее по всем транзакциям пользователя ---
            # Без ORDER BY и без partition_by — окно = все строки запроса.
            # Это позволяет вычесть глобальное среднее из каждой строки.
            avg_deviation=ExpressionWrapper(
                F("amount") - Window(expression=Avg("amount")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),

            # --- Lag: значение предыдущей строки ---
            # offset=1 — берём строку на 1 позицию назад.
            # default=0 — значение для первой строки, у которой нет предыдущей.
            prev_amount=Window(
                expression=Lag("amount", offset=1, default=0),
                order_by="created_at",
            ),
        )
        .values(
            "id", "created_at", "amount", "transaction_type",
            "row_num", "rank_in_month", "running_total",
            "avg_deviation", "prev_amount",
        )
        .order_by("created_at")
    )


def get_monthly_running_totals(user_id: int):
    """
    Пример сброса накопительного итога на каждый месяц
    через PARTITION BY TruncMonth.
    """
    return (
        Transaction.objects
        .filter(user_id=user_id)
        .annotate(
            month=TruncMonth("created_at"),
            # Накопительный итог сбрасывается каждый месяц
            monthly_running_total=Window(
                expression=WinSum("amount"),
                partition_by=[TruncMonth("created_at")],
                order_by="created_at",
            ),
        )
        .values("id", "month", "created_at", "amount", "monthly_running_total")
        .order_by("created_at")
    )`,
      },
    ],
    explanation: `**Оконные функции** выполняют вычисления по набору строк («окну»), связанных с текущей строкой, не сворачивая результат в одну строку, как это делает GROUP BY. Каждая строка в результате сохраняется, а к ней добавляется вычисленное значение.

**Анатомия Window в Django:**
\`\`\`
Window(
    expression=<агрегат или ранжирующая функция>,
    partition_by=[<поле>],   # PARTITION BY — сброс окна
    order_by="<поле>",       # ORDER BY внутри окна
)
\`\`\`

**RowNumber vs Rank**: \`RowNumber()\` всегда даёт уникальный номер, даже при одинаковых значениях сортировки. \`Rank()\` даёт одинаковый ранг строкам с равными значениями и пропускает следующий номер (1, 1, 3). \`DenseRank()\` — как Rank, но без пропуска (1, 1, 2).

**Накопительный SUM**: при наличии \`order_by\` Django автоматически добавляет фрейм \`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`. Без \`order_by\` фрейм — все строки окна (получается обычная сумма по группе).

**Lag/Lead** позволяет обратиться к значению предыдущей (\`Lag\`) или следующей (\`Lead\`) строки в окне. Параметр \`default\` задаёт значение для крайних строк, где предыдущей/следующей нет. Это позволяет вычислять изменения и дельты прямо в SQL без самосоединения таблицы.

**Отклонение от среднего**: \`Window(expression=Avg("amount"))\` без \`partition_by\` и \`order_by\` создаёт окно из всех строк запроса. Результат — глобальное среднее, одинаковое для каждой строки. Вычитая его через \`ExpressionWrapper\`, получаем отклонение каждой транзакции от среднего.

**Ограничение Django ORM**: оконные функции нельзя использовать в \`filter()\` напрямую — PostgreSQL запрещает \`WHERE\` по оконным выражениям. Оборачивайте запрос в подзапрос или используйте \`.raw()\` при необходимости фильтрации по результату оконной функции.`,
  },

  {
    id: "bulk-operations-performance",
    title: "Bulk-операции и производительность",
    task: "Необходимо импортировать 100 000 записей из CSV-файла в базу данных. Реализуйте импорт с использованием bulk_create с батчингом, обработкой дубликатов через update_or_create или on_conflict, логированием прогресса и возможностью возобновления при сбое. Сравните производительность разных подходов.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Product(models.Model):
    # sku — естественный уникальный ключ из CSV.
    # Используется как идентификатор для дедупликации при импорте.
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=100, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["category", "sku"], name="product_cat_sku_idx"),
        ]

    def __str__(self):
        return f"{self.sku}: {self.name}"


class ImportLog(models.Model):
    """
    Журнал запусков импорта — позволяет возобновить при сбое.
    Хранит, до какой строки CSV импорт дошёл успешно.
    """
    filename = models.CharField(max_length=500)
    last_processed_row = models.PositiveIntegerField(default=0)
    total_rows = models.PositiveIntegerField(default=0)
    created_count = models.PositiveIntegerField(default=0)
    updated_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("running", "Running"), ("done", "Done"), ("failed", "Failed")],
        default="running",
    )

    def __str__(self):
        return f"Import {self.filename} ({self.status})"`,
      },
      {
        filename: "importer.py",
        code: `"""
Сравнение подходов к импорту 100 000 записей:

  Метод                     | ~Время  | Запросов к БД
  --------------------------|---------|---------------
  .save() в цикле           | ~120 с  | 100 000
  bulk_create (batch=1000)  | ~2 с    | 100
  bulk_create + on_conflict | ~3 с    | 100 (upsert)
  update_or_create в цикле  | ~240 с  | 200 000

Рекомендация: bulk_create с ignore_conflicts или update_conflicts
для большинства задач импорта.
"""

import csv
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from itertools import islice
from typing import Iterator

from django.db import transaction

from .models import ImportLog, Product

logger = logging.getLogger(__name__)

BATCH_SIZE = 1_000  # Оптимальный размер батча для PostgreSQL


# ---------------------------------------------------------------------------
# Подход 1: bulk_create с ignore_conflicts (только вставка новых)
# ---------------------------------------------------------------------------

def import_products_bulk_create(filepath: str, resume: bool = True) -> ImportLog:
    """
    Быстрый импорт через bulk_create. Дубликаты по sku пропускаются.
    Поддерживает возобновление: при сбое следующий запуск продолжит
    с последней успешно обработанной строки.
    """
    log = _get_or_create_log(filepath)
    if log.status == "done":
        logger.info("Import already completed, skipping.")
        return log

    start_row = log.last_processed_row if resume else 0
    created_total = log.created_count

    try:
        for batch_num, batch in enumerate(_read_csv_batches(filepath, start_row)):
            objects = [_row_to_product(row) for row in batch]

            # ignore_conflicts=True: строки с конфликтом по unique constraint
            # (sku) молча игнорируются — существующие записи не обновляются.
            created = Product.objects.bulk_create(
                objects,
                batch_size=BATCH_SIZE,
                ignore_conflicts=True,
            )
            created_total += len(created)
            processed_row = start_row + (batch_num + 1) * BATCH_SIZE

            # Сохраняем прогресс после каждого батча — checkpoint для resume
            _update_log(log, last_row=processed_row, created=created_total)
            logger.info(
                "Batch %d done: +%d created, total processed ~%d",
                batch_num + 1, len(created), processed_row,
            )

        _finish_log(log)
    except Exception as exc:
        log.status = "failed"
        log.save(update_fields=["status"])
        logger.error("Import failed at row ~%d: %s", log.last_processed_row, exc)
        raise

    return log


# ---------------------------------------------------------------------------
# Подход 2: bulk_create с update_conflicts (upsert — вставка + обновление)
# ---------------------------------------------------------------------------

def import_products_upsert(filepath: str) -> ImportLog:
    """
    Upsert через update_conflicts (Django 4.1+, только PostgreSQL).
    Новые записи вставляются, существующие обновляются по sku.
    Один SQL-батч вместо N*2 запросов update_or_create.
    """
    log = _get_or_create_log(filepath)
    created_total = updated_total = 0

    for batch_num, batch in enumerate(_read_csv_batches(filepath)):
        objects = [_row_to_product(row) for row in batch]

        # update_conflicts=True + conflict_target + update_fields:
        # PostgreSQL выполняет INSERT ... ON CONFLICT (sku) DO UPDATE SET ...
        # Один запрос на батч вместо SELECT + INSERT/UPDATE на каждую строку.
        results = Product.objects.bulk_create(
            objects,
            batch_size=BATCH_SIZE,
            update_conflicts=True,
            unique_fields=["sku"],              # conflict target
            update_fields=["name", "price", "stock", "category"],
        )

        # Django 4.2+: bulk_create с update_conflicts возвращает объекты
        # с заполненным pk. Можно отличить новые (pk был None) от обновлённых.
        created_total += sum(1 for obj in results if obj._state.adding)
        updated_total += sum(1 for obj in results if not obj._state.adding)

        _update_log(
            log,
            last_row=(batch_num + 1) * BATCH_SIZE,
            created=created_total,
            updated=updated_total,
        )
        logger.info("Upsert batch %d: created=%d updated=%d", batch_num + 1, created_total, updated_total)

    _finish_log(log)
    return log


# ---------------------------------------------------------------------------
# Подход 3: update_or_create в цикле (медленно, для справки)
# ---------------------------------------------------------------------------

def import_products_update_or_create(filepath: str) -> None:
    """
    Самый медленный вариант: 2 SQL-запроса (SELECT + INSERT/UPDATE) на строку.
    Используйте только если нужна сложная логика обновления по каждой строке.
    100 000 строк × 2 запроса = 200 000 запросов к БД.
    """
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            Product.objects.update_or_create(
                sku=row["sku"],
                defaults={
                    "name": row["name"],
                    "price": row["price"],
                    "stock": int(row["stock"]),
                    "category": row.get("category", ""),
                },
            )


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

def _read_csv_batches(
    filepath: str, skip_rows: int = 0
) -> Iterator[list[dict]]:
    """Читает CSV батчами по BATCH_SIZE строк, пропуская skip_rows."""
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        # Пропускаем уже обработанные строки
        for _ in range(skip_rows):
            next(reader, None)

        while True:
            batch = list(islice(reader, BATCH_SIZE))
            if not batch:
                break
            yield batch


def _row_to_product(row: dict) -> Product:
    return Product(
        sku=row["sku"].strip(),
        name=row["name"].strip(),
        price=row["price"],
        stock=int(row.get("stock", 0)),
        category=row.get("category", "").strip(),
    )


def _get_or_create_log(filepath: str) -> ImportLog:
    log, _ = ImportLog.objects.get_or_create(
        filename=filepath,
        status__in=["running", "failed"],
        defaults={"filename": filepath},
    )
    return log


def _update_log(
    log: ImportLog,
    last_row: int,
    created: int = 0,
    updated: int = 0,
) -> None:
    log.last_processed_row = last_row
    log.created_count = created
    log.updated_count = updated
    log.save(update_fields=["last_processed_row", "created_count", "updated_count"])


def _finish_log(log: ImportLog) -> None:
    log.status = "done"
    log.finished_at = datetime.now(tz=timezone.utc)
    log.save(update_fields=["status", "finished_at"])`,
      },
      {
        filename: "management/commands/import_products.py",
        code: `import time

from django.core.management.base import BaseCommand, CommandError

from ...importer import import_products_bulk_create, import_products_upsert


class Command(BaseCommand):
    help = "Import products from a CSV file"

    def add_arguments(self, parser):
        parser.add_argument("filepath", type=str, help="Path to CSV file")
        parser.add_argument(
            "--mode",
            choices=["bulk", "upsert"],
            default="bulk",
            help="Import mode: bulk (insert only) or upsert (insert + update)",
        )
        parser.add_argument(
            "--no-resume",
            action="store_true",
            help="Start from the beginning even if a previous run was interrupted",
        )

    def handle(self, *args, **options):
        filepath = options["filepath"]
        mode = options["mode"]
        resume = not options["no_resume"]

        self.stdout.write(f"Starting import: {filepath} (mode={mode}, resume={resume})")
        start = time.monotonic()

        try:
            if mode == "bulk":
                log = import_products_bulk_create(filepath, resume=resume)
            else:
                log = import_products_upsert(filepath)
        except Exception as exc:
            raise CommandError(f"Import failed: {exc}") from exc

        elapsed = time.monotonic() - start
        self.stdout.write(
            self.style.SUCCESS(
                f"Done in {elapsed:.1f}s — "
                f"created: {log.created_count}, updated: {log.updated_count}"
            )
        )`,
      },
    ],
    explanation: `**Почему bulk_create быстрее в 60–100 раз?** Каждый вызов \`.save()\` или \`update_or_create()\` открывает соединение, выполняет запрос и ждёт подтверждения от БД. При 100 000 строк это 100 000 (или 200 000) round-trip'ов. \`bulk_create\` с батчем в 1000 строк — 100 запросов вида \`INSERT INTO ... VALUES (...), (...), ...\` — PostgreSQL обрабатывает их на порядок быстрее.

**ignore_conflicts vs update_conflicts:**
- \`ignore_conflicts=True\` — генерирует \`INSERT ... ON CONFLICT DO NOTHING\`. Строки с конфликтом молча пропускаются. Подходит для одноразового импорта новых данных.
- \`update_conflicts=True\` — генерирует \`INSERT ... ON CONFLICT (sku) DO UPDATE SET ...\`. Существующие записи обновляются. Это настоящий upsert, доступный с Django 4.1 только для PostgreSQL, MySQL 8+ и SQLite 3.24+.

**Оптимальный размер батча**: 500–2000 строк для PostgreSQL. Слишком маленький батч — много запросов. Слишком большой — высокий расход памяти и риск таймаута транзакции. 1000 — хороший дефолт.

**Возобновление при сбое**: модель \`ImportLog\` хранит \`last_processed_row\`. После каждого батча прогресс сохраняется через \`save(update_fields=[...])\` — только нужные поля, не весь объект. При повторном запуске \`_read_csv_batches\` пропускает уже обработанные строки через \`islice\`.

**islice** из стандартной библиотеки — эффективный способ читать CSV батчами без загрузки всего файла в память. \`list(islice(reader, 1000))\` забирает следующие 1000 строк из генератора.`,
  },

  {
    id: "fulltext-search",
    title: "Полнотекстовый поиск",
    task: "Реализуйте полнотекстовый поиск по моделям Article и Product с использованием django.contrib.postgres.search. Поиск должен поддерживать: ранжирование результатов по релевантности, поиск по нескольким полям с разными весами, обработку морфологии (stemming) для русского и английского языков, подсветку найденных фрагментов.",
    files: [
      {
        filename: "models.py",
        code: `from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models


class Article(models.Model):
    title = models.CharField(max_length=300)
    body = models.TextField()
    tags = models.CharField(max_length=500, blank=True)
    author = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="articles"
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    # Денормализованный SearchVectorField — хранит уже разобранный вектор.
    # Обновляется через сигнал или celery-задачу при сохранении статьи.
    # Поиск по нему в 5–10 раз быстрее, чем вычислять вектор на лету.
    search_vector = SearchVectorField(null=True, blank=True)

    class Meta:
        indexes = [
            # GIN-индекс — обязателен для быстрого поиска по SearchVectorField.
            # Без него PostgreSQL будет делать Seq Scan по каждому запросу.
            GinIndex(fields=["search_vector"], name="article_search_gin_idx"),
        ]

    def __str__(self):
        return self.title


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    search_vector = SearchVectorField(null=True, blank=True)

    class Meta:
        indexes = [
            GinIndex(fields=["search_vector"], name="product_search_gin_idx"),
        ]

    def __str__(self):
        return self.name`,
      },
      {
        filename: "migrations/0002_update_search_vectors.py",
        code: `"""
Миграция обновляет search_vector для всех существующих записей.
Выполняется один раз при деплое; новые записи обновляются через сигнал.
"""
from django.db import migrations
from django.contrib.postgres.search import SearchVector


class Migration(migrations.Migration):
    dependencies = [
        ("myapp", "0001_initial"),
    ]

    operations = [
        # Используем RunSQL для эффективного массового обновления:
        # один UPDATE вместо N вызовов .save()
        migrations.RunSQL(
            sql="""
            UPDATE myapp_article
            SET search_vector =
                setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('russian', coalesce(body, '')), 'B') ||
                setweight(to_tsvector('simple', coalesce(tags, '')), 'C');

            UPDATE myapp_product
            SET search_vector =
                setweight(to_tsvector('russian', coalesce(name, '')), 'A') ||
                setweight(to_tsvector('russian', coalesce(description, '')), 'B');
            """,
            reverse_sql="""
            UPDATE myapp_article SET search_vector = NULL;
            UPDATE myapp_product SET search_vector = NULL;
            """,
        ),
    ]`,
      },
      {
        filename: "signals.py",
        code: `"""
Сигнал автоматически обновляет search_vector при сохранении объекта.
Подключается в apps.py через ready().
"""
from django.contrib.postgres.search import SearchVector
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Article, Product


@receiver(post_save, sender=Article)
def update_article_search_vector(sender, instance, **kwargs):
    """
    Обновляем вектор сразу после сохранения.
    update_fields=['search_vector'] — обновляем только одно поле,
    не вызывая повторного срабатывания сигнала.

    Веса (A > B > C > D):
      A — title:  самое важное поле, точное совпадение с заголовком
          должно выходить выше совпадений в теле.
      B — body:   основной текст, средний приоритет.
      C — tags:   вспомогательные метки, низкий приоритет.

    'russian' — конфигурация PostgreSQL с русским стеммером (snowball).
    Для слов 'бегать', 'бежит', 'пробег' стеммер даст одну основу — 'бег'.
    'simple' для tags — без стемминга, точное совпадение по словам.
    """
    Article.objects.filter(pk=instance.pk).update(
        search_vector=(
            SearchVector("title", weight="A", config="russian") +
            SearchVector("body",  weight="B", config="russian") +
            SearchVector("tags",  weight="C", config="simple")
        )
    )


@receiver(post_save, sender=Product)
def update_product_search_vector(sender, instance, **kwargs):
    Product.objects.filter(pk=instance.pk).update(
        search_vector=(
            SearchVector("name",        weight="A", config="russian") +
            SearchVector("description", weight="B", config="russian")
        )
    )`,
      },
      {
        filename: "search.py",
        code: `from django.contrib.postgres.search import (
    SearchHeadline,
    SearchQuery,
    SearchRank,
)

from .models import Article, Product


def search_articles(query_str: str, lang: str = "russian") -> list[dict]:
    """
    Полнотекстовый поиск по статьям с ранжированием и подсветкой.

    SearchQuery парсит строку пользователя в tsquery PostgreSQL:
      - search_type="websearch" поддерживает синтаксис Google-подобного поиска:
          "точная фраза", django OR fastapi, -исключить
      - config="russian" — стемминг запроса тем же стеммером, что и при индексации.
        Важно использовать один и тот же config и при индексации, и при поиске.
    """
    query = SearchQuery(query_str, config=lang, search_type="websearch")

    # SearchRank вычисляет релевантность по частоте совпадений,
    # близости слов и весам полей (A, B, C заданы при индексации).
    # cover_density=True — повышает ранг при совпадении слов рядом друг с другом.
    rank = SearchRank(
        "search_vector",
        query,
        cover_density=True,
        normalization=2,  # нормализация по длине документа
    )

    # SearchHeadline генерирует фрагмент текста с выделенными совпадениями.
    # max_words/min_words — ограничение на размер фрагмента.
    # start_sel/stop_sel — HTML-теги для выделения (можно кастомизировать).
    headline = SearchHeadline(
        "body",
        query,
        config=lang,
        max_words=30,
        min_words=15,
        start_sel="<mark>",
        stop_sel="</mark>",
        highlight_all=False,
    )

    results = (
        Article.objects
        .filter(
            is_published=True,
            search_vector=query,  # фильтр использует GIN-индекс
        )
        .annotate(
            rank=rank,
            headline=headline,
        )
        .values("id", "title", "published_at", "rank", "headline")
        .order_by("-rank")  # сортировка по релевантности
        [:20]
    )

    return list(results)


def search_combined(query_str: str) -> dict:
    """
    Поиск одновременно по Articles и Products.
    Каждая модель имеет свой GIN-индекс и конфигурацию вектора.
    """
    query = SearchQuery(query_str, config="russian", search_type="websearch")

    articles = (
        Article.objects
        .filter(is_published=True, search_vector=query)
        .annotate(
            rank=SearchRank("search_vector", query, normalization=2),
            headline=SearchHeadline(
                "body", query, config="russian",
                max_words=20, start_sel="<mark>", stop_sel="</mark>",
            ),
        )
        .values("id", "title", "rank", "headline")
        .order_by("-rank")[:10]
    )

    products = (
        Product.objects
        .filter(search_vector=query)
        .annotate(
            rank=SearchRank("search_vector", query, normalization=2),
            headline=SearchHeadline(
                "description", query, config="russian",
                max_words=20, start_sel="<mark>", stop_sel="</mark>",
            ),
        )
        .values("id", "name", "sku", "price", "rank", "headline")
        .order_by("-rank")[:10]
    )

    return {
        "articles": list(articles),
        "products": list(products),
    }


def search_multilang(query_str: str) -> list[dict]:
    """
    Поиск по документам с контентом на двух языках (ru + en).
    Объединяем результаты двух запросов с разными конфигурациями.
    """
    ru_query = SearchQuery(query_str, config="russian", search_type="websearch")
    en_query = SearchQuery(query_str, config="english", search_type="websearch")

    # Оператор | (OR) между SearchQuery — документ находится, если совпадает
    # хотя бы с одним из запросов.
    combined_query = ru_query | en_query

    return list(
        Article.objects
        .filter(is_published=True, search_vector=combined_query)
        .annotate(
            rank=SearchRank("search_vector", combined_query, normalization=2),
        )
        .values("id", "title", "rank")
        .order_by("-rank")[:20]
    )`,
      },
    ],
    explanation: `**Архитектура: денормализованный SearchVectorField**. Хранить разобранный вектор в отдельном поле и индексировать его GIN-индексом — правильный подход для продакшена. Альтернатива — вычислять вектор на лету в каждом запросе (\`SearchVector("title") + SearchVector("body")\`) — работает, но медленно: PostgreSQL не может использовать GIN-индекс для вычисляемых выражений.

**GIN-индекс** (Generalized Inverted Index) хранит для каждого слова список документов, в которых оно встречается. Поиск \`WHERE search_vector @@ query\` работает за O(log N + K), где K — число совпадений. Без GIN — O(N), полный скан таблицы.

**Конфигурация языка** (\`config="russian"\`) должна быть одинаковой при индексации и при поиске. PostgreSQL поставляется со стеммерами Snowball для 20+ языков. Для русского: «бежать», «бежит», «пробег» → корень «бег». Если документ проиндексирован с \`russian\`, а поиск делается с \`simple\` — совпадений по морфологии не будет.

**Веса A/B/C/D** влияют на \`SearchRank\`: совпадение в поле с весом A поднимает документ выше, чем совпадение с весом B. Типичное распределение: A — заголовок, B — тело, C — теги/метаданные.

**search_type="websearch"** поддерживает синтаксис: \`"точная фраза"\`, \`django OR flask\`, \`python -django\` (исключение). PostgreSQL переводит это в соответствующий \`tsquery\` без необходимости парсить строку вручную.

**SearchHeadline** добавляет фрагмент текста с подсветкой в SQL, не в Python. \`highlight_all=False\` — возвращает только первый релевантный фрагмент, не весь текст. Для API это критично: не нужно передавать клиенту полный текст статьи.

**Мультиязычный поиск** через \`ru_query | en_query\` — оператор \`|\` генерирует \`tsquery1 || tsquery2\` в PostgreSQL. Документ найдётся, если совпадает хотя бы с одним из запросов.`,
  },


  {
    id: "recursive-queries-trees",
    title: "Рекурсивные запросы и деревья",
    task: "Модель Category имеет поле parent (самосвязанный FK). Реализуйте: получение всего поддерева категорий одним запросом (CTE через django-cte или сырой SQL), подсчёт товаров в категории с учётом всех дочерних категорий, перемещение ветки дерева с обновлением всех связанных записей. Рассмотрите альтернативу в виде django-mptt или django-treebeard.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )

    class Meta:
        verbose_name_plural = "categories"
        indexes = [
            # Индекс на parent_id ускоряет обход дерева вниз
            models.Index(fields=["parent_id"], name="category_parent_idx"),
        ]

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="products"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name`,
      },
      {
        filename: "queries.py",
        code: `"""
Три подхода к работе с деревьями в Django:

  1. Raw SQL с CTE         — максимальная гибкость, только PostgreSQL
  2. django-cte            — CTE через ORM-интерфейс, только PostgreSQL
  3. django-treebeard (MP) — Materialized Path, любая СУБД, рекомендуется

Выбор зависит от требований к переносимости и частоты операций
чтения vs записи.
"""

from django.db import connection, transaction

from .models import Category, Product


# ---------------------------------------------------------------------------
# Подход 1: Raw SQL с рекурсивным CTE
# ---------------------------------------------------------------------------

def get_subtree_raw(category_id: int) -> list[dict]:
    """
    Получает всё поддерево категории одним SQL-запросом через CTE.

    WITH RECURSIVE строит дерево итеративно:
      1. Базовый случай: SELECT исходной категории.
      2. Рекурсивный шаг: JOIN с дочерними узлами.
    PostgreSQL выполняет шаги 1+2 до тех пор, пока новых строк не останется.
    """
    sql = """
        WITH RECURSIVE subtree AS (
            -- Базовый случай: корень поддерева
            SELECT id, name, slug, parent_id, 0 AS depth
            FROM   myapp_category
            WHERE  id = %s

            UNION ALL

            -- Рекурсивный шаг: дочерние узлы текущего фронтира
            SELECT c.id, c.name, c.slug, c.parent_id, s.depth + 1
            FROM   myapp_category c
            JOIN   subtree s ON c.parent_id = s.id
        )
        SELECT id, name, slug, parent_id, depth
        FROM   subtree
        ORDER  BY depth, name;
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [category_id])
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def count_products_in_subtree_raw(category_id: int) -> int:
    """
    Считает товары в категории и всех её потомках одним запросом.
    CTE собирает ID всех узлов поддерева, затем COUNT фильтрует товары.
    """
    sql = """
        WITH RECURSIVE subtree AS (
            SELECT id FROM myapp_category WHERE id = %s
            UNION ALL
            SELECT c.id
            FROM   myapp_category c
            JOIN   subtree s ON c.parent_id = s.id
        )
        SELECT COUNT(*)
        FROM   myapp_product p
        WHERE  p.category_id IN (SELECT id FROM subtree);
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [category_id])
        return cursor.fetchone()[0]


# ---------------------------------------------------------------------------
# Подход 2: django-cte (pip install django-cte)
# ---------------------------------------------------------------------------

def get_subtree_cte(category_id: int):
    """
    То же самое через библиотеку django-cte — ORM-интерфейс для WITH RECURSIVE.
    Результат — обычный QuerySet, поддерживает .filter(), .annotate() и т.д.

    pip install django-cte
    """
    try:
        from django_cte import With
    except ImportError:
        raise ImportError("Install django-cte: pip install django-cte")

    # Базовый QuerySet: корень поддерева
    base_qs = Category.objects.filter(pk=category_id)

    # Рекурсивный QuerySet: дочерние узлы
    def make_recursive(cte):
        return Category.objects.filter(parent__in=cte.queryset())

    cte = With.recursive(
        base_qs.union(make_recursive, all=True)
    )

    return (
        cte.queryset()
        .with_cte(cte)
        .select_related("parent")
        .order_by("name")
    )


# ---------------------------------------------------------------------------
# Подход 3: Перемещение ветки дерева (Raw SQL, атомарно)
# ---------------------------------------------------------------------------

def move_subtree(category_id: int, new_parent_id: int) -> None:
    """
    Перемещает категорию со всем поддеревом под новый родительский узел.

    Алгоритм:
      1. Проверяем, что new_parent не находится внутри перемещаемого поддерева
         (иначе получим цикл в дереве).
      2. Обновляем только parent_id корня ветки — все дочерние узлы уже
         связаны через FK и никуда не денутся.

    Операция атомарна: если проверка провалится, UPDATE не выполнится.
    """
    if category_id == new_parent_id:
        raise ValueError("Cannot move category to itself")

    with transaction.atomic():
        # Шаг 1: убеждаемся, что new_parent не является потомком category
        descendants_sql = """
            WITH RECURSIVE subtree AS (
                SELECT id FROM myapp_category WHERE id = %s
                UNION ALL
                SELECT c.id FROM myapp_category c
                JOIN subtree s ON c.parent_id = s.id
            )
            SELECT 1 FROM subtree WHERE id = %s LIMIT 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(descendants_sql, [category_id, new_parent_id])
            if cursor.fetchone():
                raise ValueError(
                    f"Cannot move category {category_id} under its own descendant {new_parent_id}"
                )

        # Шаг 2: меняем только parent_id корня ветки
        Category.objects.filter(pk=category_id).update(parent_id=new_parent_id)`,
      },
      {
        filename: "treebeard_example.py",
        code: `"""
Альтернатива: django-treebeard с Materialized Path (MP).

pip install django-treebeard

Преимущества перед самосвязанным FK:
  - Все операции с деревом (поддерево, предки, перемещение) — O(1) запросов
  - Не требует CTE или рекурсии — всё через LIKE-условие по path
  - Работает с PostgreSQL, MySQL, SQLite

Недостатки:
  - Требует изменения модели (наследование от MP_Node)
  - Нельзя использовать стандартный Django ForeignKey на parent
"""

from django.db import models
from treebeard.mp_tree import MP_Node


class MPCategory(MP_Node):
    """
    MP_Node автоматически добавляет поля:
      - path  : строковый путь вида "0001000200030001"
      - depth : глубина узла (1 — корень)
      - numchild : число прямых дочерних узлов
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    node_order_by = ["name"]  # сортировка дочерних узлов при вставке

    class Meta:
        verbose_name_plural = "mp categories"

    def __str__(self):
        return self.name


# --- Примеры использования ---

def treebeard_examples():
    # Создание дерева
    root = MPCategory.add_root(name="Electronics", slug="electronics")
    phones = root.add_child(name="Phones", slug="phones")
    apple = phones.add_child(name="Apple", slug="apple")

    # Получение всего поддерева — один SQL с LIKE path || '%'
    subtree = MPCategory.objects.get(slug="phones").get_descendants()
    # SELECT * FROM mpcat WHERE path LIKE '00010001%'

    # Предки от корня до текущего узла — один SQL
    ancestors = apple.get_ancestors()

    # Перемещение ветки — два UPDATE, без проверки циклов вручную
    apple.move(root, pos="last-child")

    # Количество товаров с учётом поддерева (аннотация через Subquery):
    from django.db.models import Count, OuterRef, Subquery
    from .models import Product

    subtree_ids = Subquery(
        MPCategory.objects
        .filter(path__startswith=OuterRef("path"))
        .values("id")
    )
    # Каждая категория знает свой path — запрос без рекурсии
    result = (
        MPCategory.objects
        .annotate(
            product_count=Count(
                "product",
                filter=models.Q(product__category__path__startswith=models.F("path")),
            )
        )
    )
    return result`,
      },
    ],
    explanation: `**Самосвязанный FK** — простейший способ хранить иерархию, но каждый уровень обхода требует отдельного запроса. Для глубокого дерева это N запросов (N+1 по вертикали).

**Рекурсивный CTE** (\`WITH RECURSIVE\`) решает задачу одним запросом. PostgreSQL выполняет рекурсивный шаг итеративно: на каждой итерации добавляет строки с новыми дочерними узлами, пока не останется незагруженных. Глубина дерева не ограничена. \`depth\` — вычисляемое поле, помогает строить визуальное представление.

**django-cte** оборачивает \`WITH RECURSIVE\` в ORM-интерфейс: результат — обычный QuerySet с поддержкой \`.filter()\`, \`.annotate()\` и пагинации. Подходит, если хочется избежать Raw SQL, но нужен CTE.

**Materialized Path (django-treebeard)** — путь хранится явно в виде строки (\`"000100020003"\`). Запрос всего поддерева — \`WHERE path LIKE '0001%'\` с обычным B-Tree-индексом. Перемещение ветки — два UPDATE. Не нужен CTE, работает на любой СУБД. Рекомендуется для большинства проектов.

**Проверка цикличности при перемещении**: нельзя сделать узел A дочерним по отношению к его собственному потомку — это создаст цикл. CTE-запрос проверяет, не входит ли \`new_parent\` в поддерево \`category\`. В django-treebeard эта проверка встроена в \`move()\`.

**Когда что использовать:**
- Редкие изменения структуры, частое чтение → Materialized Path (treebeard)
- Нужен полный ORM-интерфейс + CTE → django-cte
- Простая иерархия, 2–3 уровня → самосвязанный FK + prefetch_related`,
  },

  {
    id: "transactions-isolation",
    title: "Транзакции и изоляция",
    task: "Реализуйте операцию перевода средств между счетами пользователей. Учтите: атомарность операции, корректный уровень изоляции транзакции для предотвращения race condition, обработку deadlock-ов, идемпотентность операции (повторный запрос не должен списывать дважды), логирование всех операций.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Account(models.Model):
    user = models.OneToOneField(
        "auth.User", on_delete=models.CASCADE, related_name="account"
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="RUB")
    version = models.PositiveIntegerField(default=0)  # для optimistic locking

    class Meta:
        constraints = [
            # Баланс не может быть отрицательным — гарантия на уровне БД
            models.CheckConstraint(
                check=models.Q(balance__gte=0),
                name="account_balance_non_negative",
            ),
        ]

    def __str__(self):
        return f"Account #{self.pk} ({self.currency}: {self.balance})"


class TransferLog(models.Model):
    STATUS_PENDING   = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED    = "failed"

    from_account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="outgoing_transfers"
    )
    to_account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="incoming_transfers"
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    # Клиентский ключ идемпотентности — UUID, генерируемый на стороне клиента.
    # UNIQUE гарантирует, что повторный запрос с тем же ключом
    # не создаст второй перевод.
    idempotency_key = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, default=STATUS_PENDING)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["from_account", "created_at"],
                name="transfer_from_created_idx",
            ),
        ]`,
      },
      {
        filename: "services.py",
        code: `import logging
from datetime import datetime, timezone
from decimal import Decimal

from django.db import OperationalError, transaction
from django.db.models import F

from .models import Account, TransferLog

logger = logging.getLogger(__name__)

MAX_DEADLOCK_RETRIES = 3


class TransferError(Exception):
    pass


class InsufficientFundsError(TransferError):
    pass


class DuplicateTransferError(TransferError):
    pass


def transfer(
    from_account_id: int,
    to_account_id: int,
    amount: Decimal,
    idempotency_key: str,
) -> TransferLog:
    """
    Атомарный перевод средств между счетами.

    Гарантии:
      - Атомарность: atomic() — либо всё, либо ничего.
      - Нет race condition: select_for_update() блокирует строки на время
        транзакции. Два параллельных запроса на один счёт выполнятся
        последовательно, а не одновременно.
      - Нет deadlock: счета блокируются в порядке возрастания ID.
        Встречные переводы A→B и B→A всегда берут блокировки в одном порядке.
      - Идемпотентность: UNIQUE(idempotency_key) + проверка до старта
        транзакции. Повторный запрос вернёт уже созданный лог.
      - Целостность на уровне БД: CHECK(balance >= 0) не даст уйти в минус
        даже если в коде есть ошибка.
    """
    if amount <= 0:
        raise TransferError("Amount must be positive")
    if from_account_id == to_account_id:
        raise TransferError("Cannot transfer to the same account")

    # Проверка идемпотентности до старта транзакции — дешевле SELECT,
    # чем поймать IntegrityError после INSERT внутри транзакции.
    existing = TransferLog.objects.filter(idempotency_key=idempotency_key).first()
    if existing:
        if existing.status == TransferLog.STATUS_FAILED:
            raise DuplicateTransferError(
                f"Previous transfer {idempotency_key} failed: {existing.error_message}"
            )
        return existing  # уже выполнен успешно — возвращаем идемпотентно

    return _execute_transfer_with_retry(
        from_account_id, to_account_id, amount, idempotency_key
    )


def _execute_transfer_with_retry(
    from_account_id: int,
    to_account_id: int,
    amount: Decimal,
    idempotency_key: str,
) -> TransferLog:
    """
    Выполняет перевод с повторными попытками при deadlock.

    Deadlock возможен в редких случаях (например, при SERIALIZABLE
    изоляции или сложных блокировках). PostgreSQL автоматически прерывает
    одну из транзакций с ORA-40001 / OperationalError — её нужно повторить.
    """
    last_exc = None
    for attempt in range(1, MAX_DEADLOCK_RETRIES + 1):
        try:
            return _do_transfer(from_account_id, to_account_id, amount, idempotency_key)
        except OperationalError as exc:
            # 40P01 — PostgreSQL deadlock detected
            if "deadlock" not in str(exc).lower():
                raise
            last_exc = exc
            logger.warning(
                "Deadlock on attempt %d/%d for key=%s",
                attempt, MAX_DEADLOCK_RETRIES, idempotency_key,
            )

    raise TransferError(f"Transfer failed after {MAX_DEADLOCK_RETRIES} retries due to deadlock") from last_exc


def _do_transfer(
    from_account_id: int,
    to_account_id: int,
    amount: Decimal,
    idempotency_key: int,
) -> TransferLog:
    with transaction.atomic():
        # Блокируем счета в порядке возрастания ID — защита от deadlock.
        # sorted() гарантирует одинаковый порядок при любом направлении перевода.
        lock_ids = sorted([from_account_id, to_account_id])
        accounts_map = {
            acc.id: acc
            for acc in Account.objects.select_for_update(
                nowait=False,   # ждать освобождения блокировки
            ).filter(id__in=lock_ids)
        }

        if len(accounts_map) != 2:
            raise TransferError("One or both accounts not found")

        from_acc = accounts_map[from_account_id]
        to_acc   = accounts_map[to_account_id]

        if from_acc.currency != to_acc.currency:
            raise TransferError("Currency mismatch — use exchange service")

        if from_acc.balance < amount:
            raise InsufficientFundsError(
                f"Balance {from_acc.balance} < amount {amount}"
            )

        # Обновляем балансы через F() — атомарное сложение на стороне БД.
        # Не загружаем, не прибавляем в Python, не сохраняем обратно:
        # исключает race condition при параллельных обновлениях.
        Account.objects.filter(pk=from_account_id).update(balance=F("balance") - amount)
        Account.objects.filter(pk=to_account_id).update(balance=F("balance") + amount)

        # Лог создаётся внутри той же транзакции — откатится вместе с балансами
        log = TransferLog.objects.create(
            from_account=from_acc,
            to_account=to_acc,
            amount=amount,
            idempotency_key=idempotency_key,
            status=TransferLog.STATUS_COMPLETED,
            completed_at=datetime.now(tz=timezone.utc),
        )

    # Логируем после коммита: если бы logger.info был внутри atomic(),
    # при откате транзакции в stdout ушло бы ложное сообщение об успехе.
    logger.info(
        "Transfer completed: %s → %s, amount=%s, log_id=%s",
        from_account_id, to_account_id, amount, log.pk,
    )
    return log


def transfer_with_savepoint(
    from_account_id: int,
    to_account_id: int,
    amount: Decimal,
    idempotency_key: str,
) -> TransferLog:
    """
    Пример использования savepoint внутри существующей транзакции.
    Если перевод упадёт — откатываемся только до savepoint,
    внешняя транзакция продолжается.
    """
    with transaction.atomic():
        # ... другие операции внешней транзакции ...

        try:
            with transaction.atomic():  # создаёт SAVEPOINT
                return _do_transfer(from_account_id, to_account_id, amount, idempotency_key)
        except TransferError as exc:
            # ROLLBACK TO SAVEPOINT — только перевод откатился,
            # внешняя транзакция жива
            logger.error("Transfer in savepoint failed: %s", exc)
            raise`,
      },
    ],
    explanation: `**Уровни изоляции и выбор для переводов:**

Стандартный уровень PostgreSQL — \`READ COMMITTED\`. Он достаточен при использовании \`SELECT ... FOR UPDATE\`, который вручную устанавливает строковую блокировку. \`REPEATABLE READ\` и \`SERIALIZABLE\` дают дополнительные гарантии, но увеличивают вероятность rollback при конкурентных запросах.

**select_for_update()** добавляет \`SELECT ... FOR UPDATE\` — PostgreSQL блокирует строки до конца транзакции. Параллельный запрос на те же счета будет ждать (\`nowait=False\`) или упадёт с ошибкой (\`nowait=True\`). Это единственный надёжный способ предотвратить race condition при конкурентных списаниях.

**Антидедлок через порядок блокировок:** если поток A блокирует счёт 1, поток B — счёт 2, оба ждут второй блокировки — взаимная блокировка. \`sorted([from_id, to_id])\` гарантирует, что оба потока всегда берут блокировки в одном порядке. Дедлок становится физически невозможным.

**Обработка дедлока:** при \`SERIALIZABLE\` или редких коллизиях PostgreSQL сам завершает одну из транзакций с кодом \`40P01\`. Правильная реакция — повторить транзакцию целиком, не только запрос.

**F() вместо Python-арифметики:** \`balance=F("balance") - amount\` транслируется в \`UPDATE SET balance = balance - X\`. PostgreSQL выполняет вычитание атомарно. Если бы мы делали \`acc.balance -= amount; acc.save()\`, между чтением и сохранением другой поток мог изменить баланс — \`F()\` исключает это.

**CHECK(balance >= 0)** — последний рубеж обороны. Даже если в логике приложения окажется баг, БД не позволит уйти в минус. Исключение \`IntegrityError\` откатит транзакцию.`,
  },

  {
    id: "database-routing-multi-db",
    title: "Database routing и multi-db",
    task: "Настройте проект для работы с несколькими базами данных: основная БД (PostgreSQL) для записи, реплика для чтения, отдельная БД для аналитических данных. Реализуйте кастомный Database Router, который автоматически направляет запросы на чтение в реплику, а запись — в основную БД. Обработайте кейсы с транзакциями и using().",
    files: [
      {
        filename: "settings.py",
        code: `import os

DATABASES = {
    # Основная БД — все операции записи
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ["DB_NAME"],
        "USER":     os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST":     os.environ["DB_HOST"],
        "PORT":     os.environ.get("DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,  # persistent connections
        "OPTIONS": {
            "sslmode": "require",
            "connect_timeout": 5,
        },
    },
    # Реплика для чтения (streaming replication от primary)
    "replica": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ["DB_REPLICA_NAME"],
        "USER":     os.environ["DB_REPLICA_USER"],
        "PASSWORD": os.environ["DB_REPLICA_PASSWORD"],
        "HOST":     os.environ["DB_REPLICA_HOST"],
        "PORT":     os.environ.get("DB_REPLICA_PORT", "5432"),
        "CONN_MAX_AGE": 60,
        "TEST": {
            # Реплика не создаётся при запуске тестов —
            # используется основная БД
            "MIRROR": "default",
        },
    },
    # Аналитическая БД (отдельный кластер или хранилище)
    "analytics": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ["DB_ANALYTICS_NAME"],
        "USER":     os.environ["DB_ANALYTICS_USER"],
        "PASSWORD": os.environ["DB_ANALYTICS_PASSWORD"],
        "HOST":     os.environ["DB_ANALYTICS_HOST"],
        "PORT":     os.environ.get("DB_ANALYTICS_PORT", "5432"),
        "CONN_MAX_AGE": 30,
    },
}

DATABASE_ROUTERS = ["myapp.routers.PrimaryReplicaRouter"]`,
      },
      {
        filename: "routers.py",
        code: `import random


# Приложения, модели которых хранятся в аналитической БД
ANALYTICS_APPS = {"analytics", "reports"}

# Приложения, модели которых ВСЕГДА читаются из primary (не из реплики).
# Пример: auth — после смены пароля немедленное чтение должно дать новый хэш.
PRIMARY_READ_APPS = {"auth", "contenttypes", "sessions"}


class PrimaryReplicaRouter:
    """
    Маршрутизатор с тремя базами данных:

      default  — PostgreSQL primary. Все операции записи.
      replica  — PostgreSQL replica. Операции чтения (SELECT).
      analytics — Отдельный кластер для аналитических моделей.

    Логика:
      db_for_read  → replica (кроме critical-read приложений → default)
      db_for_write → default (кроме analytics-приложений → analytics)
      allow_migrate → только default и analytics

    Транзакции: Django автоматически направляет все операции внутри
    atomic(using="default") в primary — роутер не вызывается повторно.
    """

    def db_for_read(self, model, **hints):
        """
        Чтение аналитических моделей → analytics.
        Чтение критичных моделей (auth) → default (primary).
        Все остальные → replica.
        """
        app = model._meta.app_label

        if app in ANALYTICS_APPS:
            return "analytics"

        if app in PRIMARY_READ_APPS:
            return "default"

        # Если несколько реплик — можно выбирать случайно:
        # return random.choice(["replica1", "replica2"])
        return "replica"

    def db_for_write(self, model, **hints):
        """
        Запись аналитических моделей → analytics.
        Все остальные → default (primary).
        """
        app = model._meta.app_label

        if app in ANALYTICS_APPS:
            return "analytics"

        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        """
        Разрешает связи между объектами в рамках одного физического кластера.
        default и replica — одни и те же данные (репликация), связи допустимы.
        analytics — изолирован, связи с другими БД запрещены.
        """
        db_set = {obj1._state.db, obj2._state.db}

        # default и replica — физически одна БД (primary + его реплика)
        if db_set <= {"default", "replica"}:
            return True

        # Внутри analytics — связи допустимы
        if db_set <= {"analytics"}:
            return True

        return None  # Другой роутер решает

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Миграции аналитических моделей → только в analytics.
        Все остальные миграции → только в default.
        Реплика не мигрирует сама — она получает изменения через репликацию.
        """
        if app_label in ANALYTICS_APPS:
            return db == "analytics"

        if db == "analytics":
            return False  # не применять чужие миграции в analytics

        if db == "replica":
            return False  # реплика синхронизируется сама

        return db == "default"`,
      },
      {
        filename: "views_and_usage.py",
        code: `"""
Примеры использования multi-db в коде приложения.
"""

from django.db import connection, transaction

from .models import Article, Product


# ---------------------------------------------------------------------------
# Явное указание БД через using()
# ---------------------------------------------------------------------------

def get_articles_explicit_replica():
    """
    Явный using("replica") — обходит роутер принудительно.
    Полезно когда нужно читать из реплики несмотря на настройки роутера.
    """
    return Article.objects.using("replica").filter(is_published=True)[:20]


def save_to_analytics(record):
    """
    Запись в аналитическую БД без изменения роутера.
    """
    record.save(using="analytics")


# ---------------------------------------------------------------------------
# Транзакции и multi-db
# ---------------------------------------------------------------------------

def atomic_write_example():
    """
    transaction.atomic(using="default") явно указывает, что транзакция
    выполняется в primary. Это важно, если роутер может направить
    конкретную операцию в другую БД.

    Внутри atomic() Django не вызывает роутер повторно — все запросы
    идут в ту БД, для которой открыта транзакция.
    """
    with transaction.atomic(using="default"):
        article = Article.objects.create(title="New", body="...")
        Product.objects.filter(pk=1).update(stock=10)
        # Оба INSERT/UPDATE идут в default, даже если роутер вернул бы replica


def cross_db_read_write():
    """
    Нельзя использовать объекты из разных БД в одном запросе.
    Правильный паттерн: читаем ID из реплики, пишем в primary.
    """
    # Читаем из реплики — быстро, не нагружаем primary
    published_ids = list(
        Article.objects
        .using("replica")
        .filter(is_published=True)
        .values_list("id", flat=True)[:100]
    )

    # Пишем в primary с теми же ID
    with transaction.atomic(using="default"):
        Article.objects.filter(id__in=published_ids).update(views_count=0)


# ---------------------------------------------------------------------------
# Replica lag: чтение сразу после записи
# ---------------------------------------------------------------------------

def create_and_read_safe(title: str, body: str) -> Article:
    """
    После записи в primary не читаем из реплики сразу же:
    репликация асинхронна, реплика может отставать на 10–500 мс.

    Решение 1: читать из primary сразу после записи.
    Решение 2: передать клиенту объект из памяти без лишнего SELECT.
    """
    article = Article.objects.create(title=title, body=body)

    # Плохо: реплика может не успеть получить запись
    # return Article.objects.using("replica").get(pk=article.pk)  # NOT THIS

    # Хорошо: возвращаем объект, уже загруженный из primary
    return article


def run_analytics_query():
    """
    Тяжёлый аналитический запрос идёт в отдельную analytics БД,
    не нагружая ни primary, ни replica.
    """
    from .analytics_models import SalesReport

    return (
        SalesReport.objects
        .using("analytics")
        .filter(period="2024-Q4")
        .values("region", "total_revenue")
        .order_by("-total_revenue")
    )


# ---------------------------------------------------------------------------
# Управление миграциями
# ---------------------------------------------------------------------------
#
# Применить миграции только к primary:
#   python manage.py migrate --database=default
#
# Применить миграции аналитических моделей в analytics:
#   python manage.py migrate analytics --database=analytics
#
# Реплика: миграции НЕ нужны — она получает DDL через streaming replication.
#
# Список всех миграций с указанием БД:
#   python manage.py showmigrations --database=replica`,
      },
    ],
    explanation: `**DATABASE_ROUTERS** — список классов, которые Django опрашивает при каждом запросе к БД. Роутер отвечает на 4 вопроса: \`db_for_read\`, \`db_for_write\`, \`allow_relation\`, \`allow_migrate\`. Если роутер возвращает \`None\`, Django спрашивает следующий роутер в списке.

**Реплика и replica lag:** PostgreSQL streaming replication асинхронна. Данные появляются в реплике через 10–500 мс после записи в primary. Типичная ошибка — сразу после \`save()\` читать из реплики. Правило: если результат нужен немедленно — используйте \`using("default")\` или верните объект из памяти.

**Критичные модели в primary:** \`auth\`, \`sessions\`, \`contenttypes\` всегда читаются из primary. Причина: после смены пароля пользователя чтение из реплики может вернуть старый хэш — это дыра в безопасности.

**Транзакции и routing:** внутри \`transaction.atomic(using="default")\` Django не вызывает роутер — все запросы идут в указанную БД. Это корректное поведение: нельзя смешивать primary и replica в одной транзакции.

**TEST → MIRROR:** в тестовом режиме реплика «зеркалируется» в primary. Тесты работают на одной БД, но код с \`using("replica")\` по-прежнему работает корректно — Django сам перенаправляет.

**allow_relation:** \`default\` и \`replica\` — физически одна БД (primary + его реплика), FK между объектами корректны. \`analytics\` — отдельный кластер, FK между analytics и default/replica на уровне ORM бессмысленны и запрещены.

**Миграции:** \`allow_migrate\` возвращает \`False\` для реплики — она получает схему через репликацию. Аналитические модели мигрируют только в \`analytics\`. Запустить: \`python manage.py migrate --database=analytics\`.`,
  },


  {
    id: "zero-downtime-migrations",
    title: "Миграции и zero-downtime deployment",
    task: "Опишите стратегию и реализуйте набор миграций для добавления индекса на большую таблицу (10M+ записей) без даунтайма. Включите: создание индекса CONCURRENTLY, разбивку на несколько деплой-этапов, откат изменений в случае ошибки, тестирование миграции в dev-окружении.",
    files: [
      {
        filename: "migrations/0010_add_order_status_index.py",
        code: `"""
Этап 1 из 2 — создание индекса CONCURRENTLY.

Деплоится отдельно от кода, который его использует.
После применения этой миграции можно деплоить Этап 2.

Почему два этапа:
  - CREATE INDEX CONCURRENTLY не блокирует чтение и запись,
    но занимает от нескольких минут до часов на 10M+ строк.
  - Если деплоить код, который полагается на индекс, одновременно
    с миграцией, и миграция упадёт — код окажется нерабочим.
  - Два деплоя с паузой между ними — безопасная стратегия.
"""
from django.db import migrations


class Migration(migrations.Migration):
    # atomic=False ОБЯЗАТЕЛЬНО для CONCURRENTLY.
    # CREATE INDEX CONCURRENTLY нельзя выполнить внутри транзакции:
    # PostgreSQL выдаст ошибку "cannot run inside a transaction block".
    # Django по умолчанию оборачивает каждую миграцию в BEGIN/COMMIT.
    atomic = False

    dependencies = [
        ("orders", "0009_add_order_notes"),
    ]

    operations = [
        # DatabaseSchemaEditor не поддерживает CONCURRENTLY напрямую,
        # поэтому используем RunSQL с явным SQL.
        migrations.RunSQL(
            sql="""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
                order_status_created_idx
            ON orders_order (status, created_at)
            WHERE status IN ('pending', 'processing');
            """,
            # Откат: DROP INDEX CONCURRENTLY тоже не требует блокировки
            reverse_sql="""
            DROP INDEX CONCURRENTLY IF EXISTS order_status_created_idx;
            """,
        ),
    ]`,
      },
      {
        filename: "migrations/0011_use_new_index.py",
        code: `"""
Этап 2 из 2 — код начинает явно использовать новый индекс.

Эта миграция может быть пустой (маркерной) или содержать
изменения модели, которые зависят от индекса.

Деплоится после того, как Этап 1 применён на всех окружениях.
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    # Эта миграция обычная — транзакционная (atomic=True по умолчанию)
    dependencies = [
        ("orders", "0010_add_order_status_index"),
    ]

    operations = [
        # Пример: добавляем Meta.indexes чтобы Django "знал" об индексе.
        # Без этого Django не будет включать его в squashmigrations
        # и не будет удалять при rollback модели.
        migrations.AddIndex(
            model_name="order",
            index=models.Index(
                fields=["status", "created_at"],
                name="order_status_created_idx",
                condition=models.Q(status__in=["pending", "processing"]),
            ),
        ),
    ]`,
      },
      {
        filename: "migrations/strategies.py",
        code: `"""
Стратегии zero-downtime миграций для типичных сценариев.

Все примеры — RunSQL с atomic=False там, где нужно CONCURRENTLY.
В остальных случаях транзакционные миграции предпочтительнее.
"""
from django.db import migrations, models


# ---------------------------------------------------------------------------
# Стратегия A: добавление колонки с DEFAULT (небольшой риск блокировки)
# ---------------------------------------------------------------------------
# PostgreSQL 11+: ADD COLUMN с volatile DEFAULT больше не переписывает таблицу.
# ADD COLUMN с константным DEFAULT — мгновенная операция (метаданные).
# ---------------------------------------------------------------------------

class AddColumnWithDefault(migrations.Migration):
    """
    Безопасно на PostgreSQL 11+. На более старых версиях ADD COLUMN
    с DEFAULT переписывает всю таблицу — используйте трёхэтапный подход.
    """
    atomic = True  # можно в транзакции

    dependencies = [("myapp", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]


# ---------------------------------------------------------------------------
# Стратегия B: переименование колонки (три деплоя)
# ---------------------------------------------------------------------------
# Нельзя просто переименовать: старый код читает old_name, новый — new_name.
# Трёхэтапный подход позволяет выкатить изменение без даунтайма:
#
#   Деплой 1: добавить new_name, писать в оба поля (old + new)
#   Деплой 2: переключить чтение на new_name, убрать запись в old_name
#   Деплой 3: удалить old_name
# ---------------------------------------------------------------------------

class RenameColumn_Step1(migrations.Migration):
    """Деплой 1: добавляем новую колонку, заполняем данными."""
    atomic = False

    dependencies = [("myapp", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="display_name",
            field=models.CharField(max_length=200, blank=True, default=""),
        ),
        # Копируем данные батчами через RunPython или RunSQL
        migrations.RunSQL(
            sql="UPDATE myapp_product SET display_name = title;",
            reverse_sql="-- no reverse needed",
        ),
        # Создаём индекс на новой колонке, пока пишем в обе
        migrations.RunSQL(
            sql="CREATE INDEX CONCURRENTLY IF NOT EXISTS product_display_name_idx ON myapp_product (display_name);",
            reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS product_display_name_idx;",
        ),
    ]


# ---------------------------------------------------------------------------
# Стратегия C: удаление колонки (два деплоя)
# ---------------------------------------------------------------------------
# Нельзя удалить колонку пока код её читает.
# Деплой 1: убрать колонку из кода, сделать NULL-able
# Деплой 2: удалить колонку через миграцию
# ---------------------------------------------------------------------------

class RemoveColumn_Step2(migrations.Migration):
    """
    Деплой 2: удаляем колонку только после того, как код
    перестал её использовать (Деплой 1 уже применён).
    """
    atomic = True

    dependencies = [("myapp", "0020_deprecate_old_column")]

    operations = [
        migrations.RemoveField(model_name="product", name="old_title"),
    ]


# ---------------------------------------------------------------------------
# Тестирование миграций в dev
# ---------------------------------------------------------------------------
#
# 1. Проверить план выполнения (не применяя):
#    python manage.py sqlmigrate orders 0010
#
# 2. Проверить статус миграций:
#    python manage.py showmigrations
#
# 3. Откат к предыдущей миграции:
#    python manage.py migrate orders 0009
#
# 4. Проверить, что CONCURRENTLY не заблокировал таблицу (в psql):
#    SELECT pid, state, wait_event_type, wait_event, query
#    FROM pg_stat_activity
#    WHERE query LIKE '%CREATE INDEX%';
#
# 5. Посмотреть прогресс построения индекса:
#    SELECT phase, blocks_done, blocks_total,
#           round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS pct
#    FROM pg_stat_progress_create_index
#    WHERE relid = 'orders_order'::regclass;`,
      },
    ],
    explanation: `**Почему нельзя просто CREATE INDEX?** На таблице в 10M+ строк стандартный \`CREATE INDEX\` удерживает эксклюзивную блокировку записи (\`ShareLock\`) на всё время построения — от нескольких минут до часов. Сайт деградирует: INSERT/UPDATE/DELETE встают в очередь.

**CREATE INDEX CONCURRENTLY** строит индекс в фоне, делая несколько проходов по таблице без блокировки. DML-операции продолжают работать. Цена — строительство занимает дольше (~2× времени) и невозможно внутри транзакции.

**atomic = False** — обязательный параметр для миграций с CONCURRENTLY. Django по умолчанию оборачивает каждую миграцию в \`BEGIN / COMMIT\`. PostgreSQL выдаёт ошибку \`ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block\` при попытке использовать его в транзакции.

**IF NOT EXISTS** защищает от повторного применения: если миграция упала на полпути (сервер упал, timeout сети), при следующем запуске \`migrate\` индекс уже будет — без IF NOT EXISTS получим ошибку.

**Частичный индекс** (\`WHERE status IN ('pending', 'processing')\`) — индексирует только «горячие» строки, игнорируя завершённые заказы. Значительно меньше размер, быстрее построение, лучше cache hit ratio.

**Трёхэтапная стратегия переименования колонки** позволяет выкатить изменение без даунтайма: старый код читает \`old_name\`, новый — \`new_name\`, переходный период — обе колонки синхронизированы. Попытка переименовать в один деплой гарантированно сломает либо старые, либо новые инстансы.

**Мониторинг прогресса:** \`pg_stat_progress_create_index\` показывает, сколько блоков обработано — можно оценить время до завершения.`,
  },

  {
    id: "service-layer-pattern",
    title: "Service Layer паттерн",
    task: "Реализуйте service layer для бизнес-логики регистрации и онбординга пользователя. Сервис должен: создавать пользователя и профиль, отправлять приветственное письмо, создавать дефолтные настройки, логировать событие, генерировать реферальный код. Отделите бизнес-логику от views и models. Покажите, как тестировать сервис изолированно.",
    files: [
      {
        filename: "models.py",
        code: `import secrets
import string

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Стандартный пользователь Django — не трогаем бизнес-логику здесь."""
    pass


class UserProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    referral_code = models.CharField(max_length=12, unique=True, db_index=True)
    referred_by = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="referrals",
    )
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user}"


class UserSettings(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="settings"
    )
    email_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default="ru")
    timezone = models.CharField(max_length=50, default="Europe/Moscow")

    def __str__(self):
        return f"Settings of {self.user}"


class AuditLog(models.Model):
    EVENT_REGISTRATION = "user.registered"
    EVENT_ONBOARDING   = "user.onboarding_completed"

    event    = models.CharField(max_length=100)
    user_id  = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["event", "created_at"], name="auditlog_event_created_idx"),
        ]`,
      },
      {
        filename: "services/registration.py",
        code: `"""
Service Layer для регистрации пользователя.

Принципы:
  - Сервис — обычный Python-класс, не наследует Django-классы.
  - Зависимости (email-бэкенд, генератор кодов) внедряются через __init__
    или передаются как аргументы → легко мокировать в тестах.
  - Бизнес-логика не в View и не в Model — только здесь.
  - Один публичный метод (register) — одна ответственность.
  - Атомарность: всё в одной транзакции, при ошибке ничего не сохраняется.
"""
import logging
import secrets
import string
from dataclasses import dataclass
from typing import Protocol

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction

from ..models import AuditLog, UserProfile, UserSettings

User = get_user_model()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Протоколы (интерфейсы) зависимостей
# ---------------------------------------------------------------------------

class EmailSender(Protocol):
    def send_welcome_email(self, email: str, username: str) -> None: ...


class ReferralCodeGenerator(Protocol):
    def generate(self) -> str: ...


# ---------------------------------------------------------------------------
# Входные и выходные данные сервиса
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RegistrationInput:
    email: str
    username: str
    password: str
    referral_code: str | None = None  # код пригласившего пользователя
    language: str = "ru"


@dataclass(frozen=True)
class RegistrationResult:
    user_id: int
    referral_code: str  # сгенерированный код нового пользователя
    onboarding_url: str


# ---------------------------------------------------------------------------
# Реализации зависимостей (продакшен)
# ---------------------------------------------------------------------------

class DjangoEmailSender:
    def send_welcome_email(self, email: str, username: str) -> None:
        send_mail(
            subject="Добро пожаловать!",
            message=f"Привет, {username}! Рады видеть вас на платформе.",
            from_email="noreply@example.com",
            recipient_list=[email],
            fail_silently=False,
        )


class SecureReferralCodeGenerator:
    ALPHABET = string.ascii_uppercase + string.digits

    def generate(self) -> str:
        # secrets.choice — криптографически стойкий выбор символа
        return "".join(secrets.choice(self.ALPHABET) for _ in range(10))


# ---------------------------------------------------------------------------
# Сервис регистрации
# ---------------------------------------------------------------------------

class RegistrationService:
    def __init__(
        self,
        email_sender: EmailSender | None = None,
        code_generator: ReferralCodeGenerator | None = None,
    ):
        self._email_sender   = email_sender   or DjangoEmailSender()
        self._code_generator = code_generator or SecureReferralCodeGenerator()

    def register(self, data: RegistrationInput) -> RegistrationResult:
        """
        Регистрирует пользователя и проводит онбординг.

        Гарантии:
          - Транзакция: User + Profile + Settings создаются атомарно.
          - Email отправляется после коммита транзакции: при откате
            письмо не уйдёт (нет «фантомных» регистраций в почте).
          - Аудит-лог сохраняется вне основной транзакции: даже если
            логирование упадёт — регистрация уже зафиксирована.
        """
        self._validate(data)

        referrer_profile = self._resolve_referrer(data.referral_code)
        new_code = self._code_generator.generate()

        with transaction.atomic():
            user = self._create_user(data)
            profile = self._create_profile(user, new_code, referrer_profile)
            self._create_settings(user, data.language)

        # Email — за пределами транзакции, чтобы SMTP-ошибка не откатила регистрацию
        self._send_welcome_email(user)

        # Аудит — тоже за пределами транзакции (best-effort логирование)
        self._log_event(user, new_code, referrer_profile)

        logger.info("User registered: id=%s, username=%s", user.pk, user.username)

        return RegistrationResult(
            user_id=user.pk,
            referral_code=new_code,
            onboarding_url=f"/onboarding/?uid={user.pk}",
        )

    # --- Приватные методы ---

    def _validate(self, data: RegistrationInput) -> None:
        if User.objects.filter(email=data.email).exists():
            raise ValueError(f"Email already registered: {data.email}")
        if User.objects.filter(username=data.username).exists():
            raise ValueError(f"Username taken: {data.username}")

    def _resolve_referrer(self, referral_code: str | None):
        if not referral_code:
            return None
        try:
            return UserProfile.objects.get(referral_code=referral_code)
        except UserProfile.DoesNotExist:
            return None  # неверный код — молча игнорируем

    def _create_user(self, data: RegistrationInput):
        return User.objects.create_user(
            username=data.username,
            email=data.email,
            password=data.password,
        )

    def _create_profile(self, user, referral_code: str, referrer_profile):
        return UserProfile.objects.create(
            user=user,
            referral_code=referral_code,
            referred_by=referrer_profile,
        )

    def _create_settings(self, user, language: str):
        return UserSettings.objects.create(user=user, language=language)

    def _send_welcome_email(self, user) -> None:
        try:
            self._email_sender.send_welcome_email(user.email, user.username)
        except Exception as exc:
            # Email не критичен — не ломаем регистрацию при SMTP-сбое
            logger.error("Failed to send welcome email to %s: %s", user.email, exc)

    def _log_event(self, user, referral_code: str, referrer_profile) -> None:
        try:
            AuditLog.objects.create(
                event=AuditLog.EVENT_REGISTRATION,
                user_id=user.pk,
                metadata={
                    "username": user.username,
                    "referral_code": referral_code,
                    "referred_by": referrer_profile.user_id if referrer_profile else None,
                },
            )
        except Exception as exc:
            logger.error("Failed to write audit log for user %s: %s", user.pk, exc)`,
      },
      {
        filename: "views.py",
        code: `from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.registration import RegistrationInput, RegistrationService


class RegisterSerializer(serializers.Serializer):
    email         = serializers.EmailField()
    username      = serializers.CharField(max_length=150)
    password      = serializers.CharField(min_length=8, write_only=True)
    referral_code = serializers.CharField(max_length=12, required=False, allow_blank=True)
    language      = serializers.ChoiceField(choices=["ru", "en"], default="ru")


class RegisterView(APIView):
    """
    View — только HTTP: десериализация, вызов сервиса, формирование ответа.
    Никакой бизнес-логики здесь нет.
    """
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = RegistrationService()  # в реальном проекте — DI-контейнер

        try:
            result = service.register(RegistrationInput(**serializer.validated_data))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "user_id":       result.user_id,
                "referral_code": result.referral_code,
                "onboarding_url": result.onboarding_url,
            },
            status=status.HTTP_201_CREATED,
        )`,
      },
      {
        filename: "tests/test_registration_service.py",
        code: `"""
Тесты сервиса — изолированные, без HTTP, без реальных emails.

Сервис принимает зависимости через конструктор → мокируем их в тестах.
Тесты быстрые (нет сети, нет email), детерминированные и независимые.
"""
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model

from ..models import AuditLog, UserProfile, UserSettings
from ..services.registration import (
    RegistrationInput,
    RegistrationService,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Фикстуры и моки
# ---------------------------------------------------------------------------

class FakeEmailSender:
    """Мок email-сендера — записывает вызовы, ничего не отправляет."""
    def __init__(self):
        self.sent = []

    def send_welcome_email(self, email: str, username: str) -> None:
        self.sent.append({"email": email, "username": username})


class FixedCodeGenerator:
    """Детерминированный генератор — всегда возвращает одно значение."""
    def generate(self) -> str:
        return "TESTCODE123"


def make_service(email_sender=None, code_generator=None) -> RegistrationService:
    return RegistrationService(
        email_sender=email_sender or FakeEmailSender(),
        code_generator=code_generator or FixedCodeGenerator(),
    )


# ---------------------------------------------------------------------------
# Тесты
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_register_creates_user_profile_settings():
    """Успешная регистрация создаёт все три объекта в БД."""
    service = make_service()
    data = RegistrationInput(email="user@test.com", username="testuser", password="securepass1")

    result = service.register(data)

    user = User.objects.get(pk=result.user_id)
    assert user.email == "user@test.com"
    assert UserProfile.objects.filter(user=user, referral_code="TESTCODE123").exists()
    assert UserSettings.objects.filter(user=user, language="ru").exists()


@pytest.mark.django_db
def test_register_sends_welcome_email():
    """Email отправляется с правильными параметрами."""
    sender = FakeEmailSender()
    service = make_service(email_sender=sender)
    data = RegistrationInput(email="user@test.com", username="testuser", password="securepass1")

    service.register(data)

    assert len(sender.sent) == 1
    assert sender.sent[0]["email"] == "user@test.com"
    assert sender.sent[0]["username"] == "testuser"


@pytest.mark.django_db
def test_register_raises_on_duplicate_email():
    """Повторный email вызывает ValueError до создания объектов."""
    User.objects.create_user(username="existing", email="dup@test.com", password="pass")
    service = make_service()
    data = RegistrationInput(email="dup@test.com", username="newuser", password="securepass1")

    with pytest.raises(ValueError, match="Email already registered"):
        service.register(data)

    # Новый пользователь не создан
    assert not User.objects.filter(username="newuser").exists()


@pytest.mark.django_db
def test_register_resolves_referral_code():
    """Реферальный код привязывает нового пользователя к пригласившему."""
    referrer = User.objects.create_user(username="referrer", email="r@test.com", password="pass")
    referrer_profile = UserProfile.objects.create(user=referrer, referral_code="REF0000001")

    service = make_service()
    data = RegistrationInput(
        email="new@test.com", username="newuser", password="securepass1",
        referral_code="REF0000001",
    )
    result = service.register(data)

    profile = UserProfile.objects.get(user_id=result.user_id)
    assert profile.referred_by == referrer_profile


@pytest.mark.django_db
def test_email_failure_does_not_rollback_registration():
    """SMTP-ошибка не откатывает регистрацию."""
    broken_sender = MagicMock()
    broken_sender.send_welcome_email.side_effect = Exception("SMTP timeout")

    service = make_service(email_sender=broken_sender)
    data = RegistrationInput(email="u@test.com", username="robustuser", password="securepass1")

    result = service.register(data)  # не должно бросать

    assert User.objects.filter(pk=result.user_id).exists()`,
      },
    ],
    explanation: `**Service Layer** — слой между View и Model. View занимается только HTTP (десериализация, ответ), Model — только схемой данных. Вся бизнес-логика — в сервисе. Это не Django-специфика, а классический паттерн из Domain-Driven Design.

**Внедрение зависимостей (DI) через конструктор** — главный приём для тестируемости. \`RegistrationService(email_sender=FakeEmailSender())\` — в тесте подменяем реальный SMTP-клиент на заглушку без единого патча. Тест не зависит от сети, почтового сервера и случайных данных.

**Protocol** вместо ABC — более современный Python-подход. \`Protocol\` описывает интерфейс структурно (duck typing): любой класс с методом \`send_welcome_email\` удовлетворяет протоколу без явного наследования. Работает с mypy и pyright.

**Dataclass для входных/выходных данных**: \`RegistrationInput\` и \`RegistrationResult\` — иммутабельные (\`frozen=True\`) контейнеры данных. Не Model, не dict. Это граница между слоями: View передаёт в сервис не \`request.data\`, а типизированный объект.

**Транзакция + email за её пределами**: User, Profile, Settings создаются в одной транзакции — либо все три, либо ни одного. Email отправляется после \`atomic()\` (после коммита). Если бы email был внутри транзакции, SMTP-таймаут откатил бы регистрацию — пользователь получил бы письмо, но аккаунта нет.

**Аудит-лог как best-effort**: ошибка в \`AuditLog.objects.create\` не должна ломать регистрацию. Логируем исключение и продолжаем. Для критичного аудита рассмотрите очередь (Celery) вместо прямого INSERT.`,
  },

  {
    id: "cqrs-pattern",
    title: "CQRS-подход в Django",
    task: "Разделите операции чтения и записи для ресурса Product. Команды (write): CreateProduct, UpdatePrice, Deactivate — каждая в своём классе с валидацией. Запросы (read): отдельные QuerySet-оптимизированные методы под конкретные экраны. Реализуйте шину команд (command bus) и покажите, как это влияет на тестируемость и масштабируемость.",
    files: [
      {
        filename: "models.py",
        code: `from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        "Category", on_delete=models.PROTECT, related_name="products"
    )
    is_active = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active", "category_id"], name="product_active_cat_idx"),
            models.Index(fields=["sku"], name="product_sku_idx"),
        ]

    def __str__(self):
        return f"{self.sku}: {self.name}"


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class PriceHistory(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="price_history"
    )
    old_price = models.DecimalField(max_digits=10, decimal_places=2)
    new_price = models.DecimalField(max_digits=10, decimal_places=2)
    changed_by = models.ForeignKey(
        "auth.User", on_delete=models.SET_NULL, null=True
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=300, blank=True)`,
      },
      {
        filename: "commands.py",
        code: `"""
WRITE SIDE (Commands)

Каждая команда — отдельный dataclass с данными + отдельный handler с логикой.
Преимущества:
  - Каждый handler тестируется независимо
  - Добавление новой команды не трогает существующие
  - Middleware (логирование, аудит, retry) добавляется в шину, не в handler
  - Масштабирование: handler можно вынести в Celery-задачу без изменения кода
"""
import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Category, PriceHistory, Product

User = get_user_model()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Команды (данные, без логики)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CreateProduct:
    name: str
    sku: str
    price: Decimal
    category_id: int
    stock: int = 0


@dataclass(frozen=True)
class UpdatePrice:
    product_id: int
    new_price: Decimal
    changed_by_id: int
    reason: str = ""


@dataclass(frozen=True)
class DeactivateProduct:
    product_id: int
    reason: str = ""


# ---------------------------------------------------------------------------
# Хендлеры (логика без HTTP-зависимостей)
# ---------------------------------------------------------------------------

class CreateProductHandler:
    def handle(self, cmd: CreateProduct) -> Product:
        if Product.objects.filter(sku=cmd.sku).exists():
            raise ValueError(f"SKU already exists: {cmd.sku}")

        if cmd.price <= 0:
            raise ValueError("Price must be positive")

        if not Category.objects.filter(pk=cmd.category_id).exists():
            raise ValueError(f"Category {cmd.category_id} not found")

        product = Product.objects.create(
            name=cmd.name,
            sku=cmd.sku,
            price=cmd.price,
            base_price=cmd.price,  # начальная цена = базовая
            category_id=cmd.category_id,
            stock=cmd.stock,
        )
        logger.info("Product created: sku=%s, id=%s", cmd.sku, product.pk)
        return product


class UpdatePriceHandler:
    def handle(self, cmd: UpdatePrice) -> Product:
        if cmd.new_price <= 0:
            raise ValueError("Price must be positive")

        # Максимально допустимое отклонение от базовой цены — 90%
        MAX_DISCOUNT = Decimal("0.90")

        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=cmd.product_id)

            if not product.is_active:
                raise ValueError(f"Product {cmd.product_id} is inactive")

            min_allowed = product.base_price * (1 - MAX_DISCOUNT)
            if cmd.new_price < min_allowed:
                raise ValueError(
                    f"Price {cmd.new_price} is below minimum {min_allowed:.2f} "
                    f"(90% discount from base {product.base_price})"
                )

            PriceHistory.objects.create(
                product=product,
                old_price=product.price,
                new_price=cmd.new_price,
                changed_by_id=cmd.changed_by_id,
                reason=cmd.reason,
            )

            product.price = cmd.new_price
            product.save(update_fields=["price", "updated_at"])

        logger.info(
            "Price updated: product=%s, %s → %s",
            cmd.product_id, product.price, cmd.new_price,
        )
        return product


class DeactivateProductHandler:
    def handle(self, cmd: DeactivateProduct) -> Product:
        product = Product.objects.get(pk=cmd.product_id)

        if not product.is_active:
            return product  # идемпотентно: уже деактивирован

        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
        logger.info("Product deactivated: id=%s, reason=%s", cmd.product_id, cmd.reason)
        return product


# ---------------------------------------------------------------------------
# Шина команд (Command Bus)
# ---------------------------------------------------------------------------

class CommandBus:
    """
    Реестр команд и их хендлеров. Связывает тип команды с хендлером.

    Middleware-слой: можно добавить логирование, метрики, retry,
    проверку прав — один раз в dispatch(), не в каждом хендлере.
    """

    def __init__(self):
        self._handlers: dict[type, Any] = {}

    def register(self, command_type: type, handler: Any) -> None:
        self._handlers[command_type] = handler

    def dispatch(self, command) -> Any:
        handler = self._handlers.get(type(command))
        if handler is None:
            raise ValueError(f"No handler registered for {type(command).__name__}")

        logger.debug("Dispatching command: %s", type(command).__name__)
        return handler.handle(command)


# Синглтон шины — создаётся один раз при старте приложения
def build_command_bus() -> CommandBus:
    bus = CommandBus()
    bus.register(CreateProduct,    CreateProductHandler())
    bus.register(UpdatePrice,      UpdatePriceHandler())
    bus.register(DeactivateProduct, DeactivateProductHandler())
    return bus


command_bus = build_command_bus()`,
      },
      {
        filename: "queries.py",
        code: `"""
READ SIDE (Queries)

Каждый метод оптимизирован под конкретный экран/сценарий использования.
Нет универсального «get_products» — только целевые запросы.

Преимущества:
  - QuerySet оптимизирован для конкретного экрана (только нужные поля)
  - Изменение одного экрана не затрагивает другие
  - Легко кэшировать каждый запрос независимо
  - Read-side можно вынести на реплику или в отдельный read-сервис
"""
from django.db.models import Avg, Count, DecimalField, F, OuterRef, Subquery, Sum
from django.db.models.functions import TruncMonth

from .models import PriceHistory, Product


def get_product_catalog(category_id: int | None = None, page: int = 1, per_page: int = 20):
    """
    Список товаров для каталога.
    Только активные, только нужные поля, без истории цен.
    """
    qs = (
        Product.objects
        .filter(is_active=True)
        .select_related("category")
        .only("id", "name", "sku", "price", "stock", "category__name")
    )
    if category_id:
        qs = qs.filter(category_id=category_id)

    offset = (page - 1) * per_page
    return qs.order_by("name")[offset : offset + per_page]


def get_product_detail(product_id: int) -> dict | None:
    """
    Детальная страница товара.
    Полные данные + последние 5 изменений цены.
    """
    try:
        product = (
            Product.objects
            .select_related("category")
            .prefetch_related(
                "price_history__changed_by",
            )
            .get(pk=product_id, is_active=True)
        )
    except Product.DoesNotExist:
        return None

    recent_prices = list(
        product.price_history
        .select_related("changed_by")
        .order_by("-changed_at")[:5]
        .values("old_price", "new_price", "changed_at", "reason", "changed_by__username")
    )

    return {
        "id":            product.pk,
        "name":          product.name,
        "sku":           product.sku,
        "price":         product.price,
        "base_price":    product.base_price,
        "category":      product.category.name,
        "stock":         product.stock,
        "price_history": recent_prices,
    }


def get_admin_product_stats():
    """
    Аналитический дашборд для администратора.
    Тяжёлый запрос — только для admin-панели, кэшировать 5 минут.
    """
    last_price_subquery = Subquery(
        PriceHistory.objects
        .filter(product=OuterRef("pk"))
        .order_by("-changed_at")
        .values("changed_at")[:1]
    )

    return (
        Product.objects
        .select_related("category")
        .annotate(
            price_change_count=Count("price_history"),
            last_price_change=last_price_subquery,
            discount_pct=F("price") * 100 / F("base_price") - 100,
        )
        .values(
            "id", "name", "sku", "price", "base_price", "stock",
            "is_active", "category__name",
            "price_change_count", "last_price_change", "discount_pct",
        )
        .order_by("-price_change_count")
    )


def get_price_trends_by_month(product_id: int) -> list[dict]:
    """
    График изменений цены по месяцам для конкретного товара.
    """
    return list(
        PriceHistory.objects
        .filter(product_id=product_id)
        .annotate(month=TruncMonth("changed_at"))
        .values("month")
        .annotate(
            avg_price=Avg("new_price"),
            changes_count=Count("id"),
            min_price=F("new_price"),  # упрощение для примера
        )
        .order_by("month")
    )`,
      },
      {
        filename: "views.py",
        code: `from decimal import Decimal

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .commands import CreateProduct, DeactivateProduct, UpdatePrice, command_bus
from .queries import get_admin_product_stats, get_product_catalog, get_product_detail


# ---------------------------------------------------------------------------
# WRITE-эндпоинты — принимают команду, диспатчат в шину
# ---------------------------------------------------------------------------

class CreateProductView(APIView):
    class InputSerializer(serializers.Serializer):
        name        = serializers.CharField(max_length=200)
        sku         = serializers.CharField(max_length=50)
        price       = serializers.DecimalField(max_digits=10, decimal_places=2)
        category_id = serializers.IntegerField()
        stock       = serializers.IntegerField(default=0, min_value=0)

    def post(self, request):
        s = self.InputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        try:
            product = command_bus.dispatch(CreateProduct(**s.validated_data))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"id": product.pk}, status=status.HTTP_201_CREATED)


class UpdatePriceView(APIView):
    class InputSerializer(serializers.Serializer):
        new_price = serializers.DecimalField(max_digits=10, decimal_places=2)
        reason    = serializers.CharField(default="", allow_blank=True)

    def patch(self, request, product_id: int):
        s = self.InputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        try:
            command_bus.dispatch(UpdatePrice(
                product_id=product_id,
                new_price=s.validated_data["new_price"],
                changed_by_id=request.user.pk,
                reason=s.validated_data["reason"],
            ))
        except (ValueError, Exception) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# READ-эндпоинты — вызывают оптимизированные query-функции
# ---------------------------------------------------------------------------

class ProductCatalogView(APIView):
    def get(self, request):
        category_id = request.query_params.get("category_id")
        page = int(request.query_params.get("page", 1))
        products = get_product_catalog(
            category_id=int(category_id) if category_id else None,
            page=page,
        )
        return Response(list(products.values()))


class ProductDetailView(APIView):
    def get(self, request, product_id: int):
        data = get_product_detail(product_id)
        if data is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(data)`,
      },
    ],
    explanation: `**CQRS (Command Query Responsibility Segregation)** — разделение модели на две: Write Model (команды, изменяют состояние) и Read Model (запросы, только читают). В Django это не требует Event Sourcing или отдельных баз данных — достаточно разнести код по модулям.

**Command = данные, Handler = логика.** Команда — иммутабельный dataclass без методов. Handler содержит всю логику обработки. Такое разделение позволяет тестировать handler, передав ему команду напрямую — без HTTP-запроса, без URL-маршрутизации.

**Command Bus** — реестр «тип команды → handler». \`dispatch(CreateProduct(...))\` сам находит нужный handler. Middleware добавляется один раз в \`dispatch\`: логирование, метрики, проверка прав — не в каждом хендлере. Для async-команд можно заменить \`handler.handle(cmd)\` на \`celery_task.delay(cmd)\` без изменения остального кода.

**Read side = целевые функции.** \`get_product_catalog\` возвращает минимальный набор полей для списка. \`get_product_detail\` — всё для детальной страницы. \`get_admin_product_stats\` — аналитику. Каждый запрос оптимизирован для своего сценария: нет универсального «get all fields» с послесловной фильтрацией в Python.

**Влияние на тестируемость**: тест команды — создаём handler, вызываем \`handle(command)\`, проверяем БД. Тест запроса — создаём данные, вызываем query-функцию, проверяем результат. Нет \`APIClient\`, нет URL, нет аутентификации в unit-тестах.

**Масштабирование**: Write-эндпоинты идут в primary БД, Read-эндпоинты — в реплику. Команды можно ставить в очередь (Celery). Тяжёлые query-функции (\`get_admin_product_stats\`) кэшируются независимо. CQRS + replica router — естественная комбинация.`,
  },
{
        id: "django-signals-event-driven",
        title: "Event-driven архитектура с Django Signals",
        task: `Спроектируйте event-driven систему уведомлений на основе Django Signals и Celery. При изменении статуса заказа должны: обновляться связанные записи, отправляться уведомление пользователю (email/push), логироваться событие в аудит-лог, тригерриться пересчёт статистики. Избегайте цепочек сигналов и циклических зависимостей. Обоснуйте, когда сигналы уместны, а когда нет.`,
        files: [
            {
                filename: "orders/models.py",
                code: `from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидает"
        CONFIRMED = "confirmed", "Подтверждён"
        SHIPPED = "shipped", "Отправлен"
        DELIVERED = "delivered", "Доставлен"
        CANCELLED = "cancelled", "Отменён"

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.pk} ({self.status})"


class AuditLog(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="audit_logs")
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class OrderStats(models.Model):
    date = models.DateField(unique=True)
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["-date"]
`,
            },
            {
                filename: "orders/signals.py",
                code: `from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Order
from .tasks import notify_user, write_audit_log, recalculate_stats


@receiver(pre_save, sender=Order)
def on_order_status_changed(sender, instance, **kwargs):
    """
    Единственный сигнал для заказа. Реагирует только на смену статуса.
    Вся бизнес-логика вынесена в Celery-задачи, чтобы не блокировать
    транзакцию и не создавать цепочки сигналов.
    """
    if not instance.pk:
        return  # новый объект — пропускаем

    try:
        old = Order.objects.only("status").get(pk=instance.pk)
    except Order.DoesNotExist:
        return

    if old.status == instance.status:
        return  # статус не изменился — ничего не делаем

    # Сохраняем старый статус в атрибут объекта,
    # чтобы задачи могли его использовать после сохранения.
    instance._old_status = old.status
`,
            },
            {
                filename: "orders/apps.py",
                code: `from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "orders"

    def ready(self):
        # Импортируем signals здесь, чтобы они зарегистрировались при старте.
        # Импорт внутри ready() — стандартная практика для предотвращения
        # проблем с circular imports и двойной регистрацией.
        from . import signals  # noqa: F401
        from .hooks import connect_post_save_hooks

        connect_post_save_hooks()
`,
            },
            {
                filename: "orders/hooks.py",
                code: `"""
post_save хуки вынесены отдельно от signals.py, чтобы разграничить
pre_save (сбор данных об изменении) и post_save (запуск задач).
Это устраняет риск цепочки сигналов и гарантирует,
что задачи запускаются после коммита транзакции.
"""
from django.db.models.signals import post_save
from django.db import transaction

from .models import Order
from .tasks import notify_user, write_audit_log, recalculate_stats


def on_order_saved(sender, instance, **kwargs):
    old_status = getattr(instance, "_old_status", None)
    if old_status is None:
        return

    new_status = instance.status

    # on_commit гарантирует запуск задач только после успешного коммита.
    # Без этого задачи могут стартовать до того, как данные реально записаны.
    transaction.on_commit(lambda: _dispatch_tasks(instance, old_status, new_status))


def _dispatch_tasks(order, old_status, new_status):
    write_audit_log.delay(order.pk, old_status, new_status)
    notify_user.delay(order.pk, new_status)
    recalculate_stats.delay(order.created_at.date().isoformat())


def connect_post_save_hooks():
    post_save.connect(on_order_saved, sender=Order, weak=False)
`,
            },
            {
                filename: "orders/tasks.py",
                code: `from celery import shared_task
from django.core.mail import send_mail

from .models import Order, AuditLog, OrderStats


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_user(self, order_id: int, new_status: str):
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        return

    send_mail(
        subject=f"Статус заказа #{order_id} изменён",
        message=f"Ваш заказ теперь имеет статус: {new_status}",
        from_email="noreply@example.com",
        recipient_list=[order.user.email],
        fail_silently=False,
    )


@shared_task
def write_audit_log(order_id: int, old_status: str, new_status: str):
    AuditLog.objects.create(
        order_id=order_id,
        old_status=old_status,
        new_status=new_status,
    )


@shared_task
def recalculate_stats(date_str: str):
    from datetime import date
    from django.db.models import Count, Sum

    target_date = date.fromisoformat(date_str)
    agg = Order.objects.filter(created_at__date=target_date).aggregate(
        total_orders=Count("id"),
        total_revenue=Sum("total"),
    )

    OrderStats.objects.update_or_create(
        date=target_date,
        defaults={
            "total_orders": agg["total_orders"] or 0,
            "total_revenue": agg["total_revenue"] or 0,
        },
    )
`,
            },
        ],
        explanation: `**Ключевые решения:**

**Разделение pre_save и post_save.** \`pre_save\` используется только для того, чтобы зафиксировать старый статус до перезаписи. Вся логика запускается в \`post_save\` через \`transaction.on_commit\`, что гарантирует атомарность — задачи не стартуют, если транзакция откатилась.

**Нет цепочек сигналов.** Сигналы не вызывают сохранение других моделей напрямую — это главная причина цепочек. Вместо этого все побочные эффекты делегируются независимым Celery-задачам.

**Один сигнал — одна ответственность.** Вместо нескольких \`post_save\` на разные эффекты — один обработчик, который диспетчеризует задачи. Это упрощает отладку и избегает неопределённого порядка вызовов.

**Когда сигналы уместны:**
- Сквозная логика, не связанная с доменом (аудит, кэш-инвалидация, метрики)
- Реакция на изменения сторонних моделей (contrib.auth и т.д.)

**Когда сигналы НЕ уместны:**
- Бизнес-логика, которую нужно тестировать изолированно — вынесите её в service layer
- Тяжёлые операции — всегда делегируйте в Celery
- Когда нужен явный порядок выполнения — используйте явные вызовы вместо неявных сигналов`,
    },

    {
        id: "django-middleware-production",
        title: "Middleware для сквозной функциональности",
        task: `Разработайте набор middleware для production-окружения: RequestIdMiddleware — добавляет уникальный ID к каждому запросу и передаёт в логи, PerformanceMiddleware — логирует медленные запросы (>500ms) с трейсом, TenantMiddleware — определяет tenant по домену и устанавливает connection на нужную схему БД. Учтите порядок middleware и async-совместимость.`,
        files: [
            {
                filename: "core/middleware.py",
                code: `import time
import uuid
import logging
import threading

from django.db import connection

logger = logging.getLogger(__name__)

# Thread-local хранилище для передачи request_id в логгер
_request_ctx = threading.local()


def get_current_request_id() -> str | None:
    return getattr(_request_ctx, "request_id", None)


class RequestIdMiddleware:
    """
    Генерирует уникальный ID для каждого запроса.
    Сохраняет в request.request_id, thread-local и заголовке ответа.
    Должен стоять первым в MIDDLEWARE, чтобы все последующие слои
    могли использовать ID в своих логах.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        request.request_id = request_id
        _request_ctx.request_id = request_id

        response = self.get_response(request)
        response["X-Request-Id"] = request_id

        _request_ctx.request_id = None
        return response


class PerformanceMiddleware:
    """
    Логирует запросы медленнее порога SLOW_REQUEST_THRESHOLD_MS.
    Включает путь, метод, статус и время выполнения.
    Совместим с sync и async через корректный __call__.
    """

    SLOW_REQUEST_THRESHOLD_MS = 500

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000

        if duration_ms >= self.SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "Slow request detected",
                extra={
                    "request_id": getattr(request, "request_id", None),
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 1),
                },
            )

        return response


class TenantMiddleware:
    """
    Определяет tenant по поддомену (tenant.example.com)
    и устанавливает PostgreSQL search_path для row-level isolation.

    Требует таблицу Tenant с полем subdomain.
    Возвращает 404 для неизвестных поддоменов.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.http import Http404
        from tenants.models import Tenant

        subdomain = self._extract_subdomain(request.get_host())

        if subdomain:
            try:
                tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
            except Tenant.DoesNotExist:
                raise Http404(f"Tenant '{subdomain}' not found")

            request.tenant = tenant
            self._set_schema(tenant.schema_name)
        else:
            request.tenant = None

        response = self.get_response(request)

        # Сбрасываем схему обратно в public после обработки запроса
        if subdomain:
            self._set_schema("public")

        return response

    @staticmethod
    def _extract_subdomain(host: str) -> str | None:
        # host вида "tenant.example.com" → "tenant"
        # host вида "example.com" или "localhost" → None
        parts = host.split(".")
        return parts[0] if len(parts) > 2 else None

    @staticmethod
    def _set_schema(schema: str):
        with connection.cursor() as cursor:
            cursor.execute("SET search_path TO %s", [schema])
`,
            },
            {
                filename: "settings.py (фрагмент)",
                code: `MIDDLEWARE = [
    # 1. RequestId — самый первый: все последующие слои логируют с request_id
    "core.middleware.RequestIdMiddleware",

    # 2. Django security headers
    "django.middleware.security.SecurityMiddleware",

    # 3. Tenant — до SessionMiddleware и аутентификации,
    #    чтобы схема БД была установлена до любых запросов к данным
    "core.middleware.TenantMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",

    # 4. Performance — последним среди наших, чтобы замерять полное время
    #    включая все предыдущие middleware
    "core.middleware.PerformanceMiddleware",
]
`,
            },
            {
                filename: "core/logging.py",
                code: `"""
Кастомный фильтр логгера, автоматически добавляющий request_id
из thread-local в каждую запись лога.
"""
import logging
from .middleware import get_current_request_id


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_current_request_id() or "-"
        return True


# settings.py — пример конфигурации логгера
LOGGING = {
    "version": 1,
    "filters": {
        "request_id": {"()": "core.logging.RequestIdFilter"},
    },
    "formatters": {
        "json": {
            "format": '{"time": "%(asctime)s", "level": "%(levelname)s", '
                      '"request_id": "%(request_id)s", "message": "%(message)s"}',
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "filters": ["request_id"],
            "formatter": "json",
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}
`,
            },
        ],
        explanation: `**Порядок middleware — критичен.**
Django обрабатывает middleware сверху вниз при запросе и снизу вверх при ответе. \`RequestIdMiddleware\` стоит первым, чтобы ID был доступен во всех последующих слоях. \`TenantMiddleware\` — до аутентификации, поскольку Django Auth обращается к БД. \`PerformanceMiddleware\` — последним, чтобы замерять суммарное время вместе со всеми предыдущими слоями.

**Thread-local для request_id.** \`request\` объект доступен только внутри view и middleware, но не в логгере. Thread-local (\`threading.local()\`) позволяет передать ID в любой вызов в рамках одного потока — включая ORM-запросы, сервисы и Celery-задачи.

**TenantMiddleware и SET search_path.** Установка \`search_path\` в PostgreSQL изолирует данные на уровне схемы без изменения кода запросов. После обработки запроса схема возвращается в \`public\` — важно при использовании connection pool, где соединения переиспользуются между запросами.

**Async-совместимость.** Все три класса используют синхронный \`__call__\`, что корректно для sync Django. Для async-проектов нужно добавить \`async def __acall__\` или использовать \`sync_to_async\` обёртки для блокирующих операций (например, запрос к БД в TenantMiddleware).`,
    },

    {
        id: "django-custom-permissions-abac",
        title: "Кастомная система разрешений (ABAC + DRF)",
        task: `Реализуйте систему разрешений с поддержкой ролей и атрибутно-ориентированного контроля доступа (ABAC). Требования: разрешения могут зависеть от атрибутов объекта (например, пользователь может редактировать только свои черновики), поддержка row-level security, кастомные бэкенды авторизации, интеграция с DRF permission_classes.`,
        files: [
            {
                filename: "articles/models.py",
                code: `from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Article(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        PUBLISHED = "published", "Опубликована"

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="articles")
    title = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
`,
            },
            {
                filename: "core/permissions.py",
                code: `"""
ABAC (Attribute-Based Access Control) поверх стандартного Django Auth.

Архитектура:
  - Policy  — правило: для какого действия и при каких условиях разрешён доступ
  - PolicyBackend — Django auth backend, регистрирует политики и выполняет проверку
  - ObjectPermission — DRF permission class, делегирует проверку PolicyBackend
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


# ---------------------------------------------------------------------------
# Политика доступа
# ---------------------------------------------------------------------------

@dataclass
class Policy:
    """
    action:    строковый код действия, напр. "articles.change_article"
    condition: функция (user, obj | None) -> bool
               obj=None означает проверку без конкретного объекта
    """
    action: str
    condition: Callable[[Any, Any | None], bool]


# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------

class PolicyBackend:
    """
    Django authentication backend, реализующий ABAC через реестр политик.

    Регистрация:
        backend = PolicyBackend()
        backend.register(Policy("articles.change_article", can_edit_article))

    Использование django.contrib.auth:
        user.has_perm("articles.change_article", obj=article)
    """

    def __init__(self):
        self._policies: dict[str, list[Policy]] = {}

    def register(self, policy: Policy) -> None:
        self._policies.setdefault(policy.action, []).append(policy)

    def has_perm(self, user_obj, perm: str, obj=None) -> bool:
        if not user_obj.is_active:
            return False

        # Суперпользователь обходит все политики
        if user_obj.is_superuser:
            return True

        policies = self._policies.get(perm, [])
        return any(p.condition(user_obj, obj) for p in policies)

    def has_module_perms(self, user_obj, app_label: str) -> bool:
        return user_obj.is_active


# ---------------------------------------------------------------------------
# Глобальный реестр — инициализируется в AppConfig.ready()
# ---------------------------------------------------------------------------

policy_backend = PolicyBackend()


# ---------------------------------------------------------------------------
# DRF Permission Classes
# ---------------------------------------------------------------------------

from rest_framework.permissions import BasePermission


class ObjectPermission(BasePermission):
    """
    Универсальный DRF permission, делегирующий проверку PolicyBackend.

    Использование:
        class ArticleViewSet(ModelViewSet):
            permission_classes = [IsAuthenticated, ObjectPermission]
            object_action_map = {
                "update": "articles.change_article",
                "destroy": "articles.delete_article",
            }
    """

    # Карта action → permission, переопределяется в ViewSet
    object_action_map: dict[str, str] = {}

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        action = getattr(view, "action", None)
        perm = self.get_object_action_map(view).get(action)

        if perm is None:
            # Действие не в карте — разрешаем по умолчанию
            return True

        return request.user.has_perm(perm, obj)

    @staticmethod
    def get_object_action_map(view) -> dict[str, str]:
        return getattr(view, "object_action_map", {})
`,
            },
            {
                filename: "articles/policies.py",
                code: `"""
Политики для модели Article.
Каждая функция — чистый предикат (user, obj) -> bool без побочных эффектов.
Регистрируются один раз при старте приложения.
"""
from core.permissions import Policy, policy_backend
from .models import Article


def _is_author_of_draft(user, obj) -> bool:
    """Пользователь — автор и статья является черновиком."""
    if obj is None:
        return False
    return obj.author_id == user.pk and obj.status == Article.Status.DRAFT


def _is_author(user, obj) -> bool:
    """Пользователь является автором статьи."""
    if obj is None:
        return False
    return obj.author_id == user.pk


def _is_editor(user, _obj) -> bool:
    """Пользователь состоит в группе редакторов."""
    return user.groups.filter(name="editors").exists()


def register_article_policies():
    # Редактировать можно только собственный черновик ИЛИ если пользователь — редактор
    policy_backend.register(Policy("articles.change_article", _is_author_of_draft))
    policy_backend.register(Policy("articles.change_article", _is_editor))

    # Удалять может только автор (любой статус)
    policy_backend.register(Policy("articles.delete_article", _is_author))
    policy_backend.register(Policy("articles.delete_article", _is_editor))
`,
            },
            {
                filename: "articles/apps.py",
                code: `from django.apps import AppConfig


class ArticlesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "articles"

    def ready(self):
        from .policies import register_article_policies
        register_article_policies()
`,
            },
            {
                filename: "articles/views.py",
                code: `from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from core.permissions import ObjectPermission
from .models import Article
from .serializers import ArticleSerializer


class ArticleViewSet(ModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, ObjectPermission]

    # Карта: action ViewSet → код разрешения
    object_action_map = {
        "update": "articles.change_article",
        "partial_update": "articles.change_article",
        "destroy": "articles.delete_article",
    }

    def get_queryset(self):
        user = self.request.user

        # Row-level security: обычный пользователь видит опубликованные
        # + собственные черновики. Редактор и суперпользователь — всё.
        if user.is_superuser or user.groups.filter(name="editors").exists():
            return Article.objects.all()

        return Article.objects.filter(
            status=Article.Status.PUBLISHED
        ) | Article.objects.filter(author=user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
`,
            },
            {
                filename: "settings.py (фрагмент)",
                code: `AUTHENTICATION_BACKENDS = [
    # Сначала стандартный backend Django (username/password)
    "django.contrib.auth.backends.ModelBackend",
    # Затем наш ABAC backend
    "core.permissions.policy_backend",
]
`,
            },
        ],
        explanation: `**ABAC vs RBAC.** Чистый RBAC (Role-Based) проверяет только роль пользователя. ABAC добавляет атрибуты объекта: статус статьи, её автора, дату публикации — любые данные доступные в момент проверки. Это позволяет выразить правило «редактировать можно только свой черновик» без дополнительных таблиц разрешений.

**PolicyBackend как Django Auth Backend.** Регистрируя бэкенд в \`AUTHENTICATION_BACKENDS\`, мы делаем политики доступными через стандартный \`user.has_perm(perm, obj)\`. Это означает, что та же проверка работает в шаблонах (\`{% if perms.articles.change_article %}\`), в Django Admin и в любом custom коде.

**ObjectPermission в DRF.** DRF разделяет \`has_permission\` (проверка без объекта — например, аутентифицирован ли пользователь) и \`has_object_permission\` (проверка с конкретным объектом). Наш \`ObjectPermission\` делегирует объектную проверку в PolicyBackend, что устраняет дублирование логики.

**Row-level security в \`get_queryset\`.** Авторизация на уровне объекта в DRF вызывается только для эндпоинтов с \`get_object()\` (retrieve, update, destroy). Для списковых запросов (list) объект не передаётся — поэтому фильтрацию «что пользователь вообще может видеть» нужно реализовывать в \`get_queryset\`, а не в permission classes.

**Регистрация политик в \`ready()\`.** Политики регистрируются единожды при старте приложения, что исключает повторную регистрацию при каждом запросе. Чистые предикаты без побочных эффектов легко тестируются в изоляции.`,
    },

    {
        id: "django-nested-serializers",
        title: "Вложенные сериализаторы и запись",
        task: `Реализуйте API для создания заказа (Order) с вложенными позициями (OrderItem). Сериализатор должен: принимать вложенные объекты в одном запросе, валидировать наличие товаров и остатки на складе, создавать все записи в одной транзакции, возвращать полное представление созданного объекта. Обработайте частичное обновление (PATCH).`,
        files: [
            {
                filename: "orders/models.py",
                code: `from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидает"
        CONFIRMED = "confirmed", "Подтверждён"

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # зафиксирована на момент заказа

    @property
    def subtotal(self):
        return self.price * self.quantity
`,
            },
            {
                filename: "orders/serializers.py",
                code: `from django.db import transaction
from rest_framework import serializers

from .models import Order, OrderItem, Product


class OrderItemWriteSerializer(serializers.Serializer):
    """Используется только для записи (создание/обновление)."""
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source="product")
    quantity = serializers.IntegerField(min_value=1)


class OrderItemReadSerializer(serializers.ModelSerializer):
    """Используется только для чтения (ответ API)."""
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_id", "product_name", "quantity", "price", "subtotal"]


class OrderWriteSerializer(serializers.Serializer):
    """
    Сериализатор для создания и обновления заказа.
    Разделение Write/Read сериализаторов — лучшая практика:
    они редко имеют одинаковую форму.
    """
    items = OrderItemWriteSerializer(many=True, min_length=1)

    def validate_items(self, items):
        errors = []
        for i, item in enumerate(items):
            product = item["product"]
            if product.stock < item["quantity"]:
                errors.append(
                    f"Товар '{product.name}': запрошено {item['quantity']}, "
                    f"доступно {product.stock}."
                )
        if errors:
            raise serializers.ValidationError(errors)
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(user=self.context["request"].user)
        self._create_items(order, items_data)
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        """PATCH: заменяем позиции целиком, если они переданы."""
        items_data = validated_data.pop("items", None)
        if items_data is not None:
            instance.items.all().delete()
            self._create_items(instance, items_data)
        return instance

    @staticmethod
    def _create_items(order, items_data):
        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                product=item["product"],
                quantity=item["quantity"],
                price=item["product"].price,  # фиксируем текущую цену
            )
            for item in items_data
        ])


class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "status", "total", "items", "created_at"]
`,
            },
            {
                filename: "orders/views.py",
                code: `from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Order
from .serializers import OrderWriteSerializer, OrderReadSerializer


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch"]  # запрещаем PUT явно

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product")
        )

    def get_serializer_class(self):
        # Write-сериализатор для записи, Read — для всего остального
        if self.action in ("create", "partial_update"):
            return OrderWriteSerializer
        return OrderReadSerializer

    def get_serializer(self, *args, **kwargs):
        if self.action == "partial_update":
            kwargs["partial"] = True
        return super().get_serializer(*args, **kwargs)

    def perform_create(self, serializer):
        # context с request нужен сериализатору для доступа к user
        serializer.save()

    def create(self, request, *args, **kwargs):
        write = self.get_serializer(data=request.data)
        write.is_valid(raise_exception=True)
        order = write.save()
        read = OrderReadSerializer(order, context=self.get_serializer_context())
        from rest_framework import status
        from rest_framework.response import Response
        return Response(read.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        write = self.get_serializer(instance, data=request.data, partial=True)
        write.is_valid(raise_exception=True)
        order = write.save()
        read = OrderReadSerializer(order, context=self.get_serializer_context())
        from rest_framework.response import Response
        return Response(read.data)
`,
            },
        ],
        explanation: `**Разделение Write и Read сериализаторов.** Write и Read сериализаторы почти никогда не совпадают по форме: на входе принимаем \`product_id\`, на выходе возвращаем \`product_name\` и \`subtotal\`. Единый сериализатор с условными полями быстро превращается в запутанный код. Два специализированных класса — чище и проще тестировать.

**Валидация остатков в \`validate_items\`.** Валидация собирается полностью до начала записи: все ошибки возвращаются одним ответом, а не по одной. Проверка выполняется в \`validate_<field>\`, а не в \`create\`, чтобы не нарушать контракт DRF — \`save()\` вызывается только на валидных данных.

**\`transaction.atomic\` на \`create\` и \`update\`.** Создание заказа и всех позиций — атомарная операция. Если \`bulk_create\` упадёт после создания \`Order\`, заказ без позиций не сохранится в БД. Декоратор на методе сериализатора, а не на view — потому что именно сериализатор владеет логикой записи.

**Фиксация цены в момент заказа.** \`price\` в \`OrderItem\` копируется из \`product.price\` при создании. Это стандартная практика: цена товара может измениться, а история заказов должна отражать цену на момент покупки.

**PATCH через замену позиций.** Частичное обновление позиций заказа удаляет старые и создаёт новые — это проще и надёжнее, чем попытка diff-а. Для сложных кейсов (частичное обновление отдельных позиций) потребуется отдельный эндпоинт \`/orders/{id}/items/{item_id}/\`.`,
    },

    {
        id: "django-cursor-pagination",
        title: "Cursor-based пагинация",
        task: `Реализуйте cursor-based пагинацию для ленты событий с сортировкой по времени. Обычная offset-пагинация неэффективна для больших таблицах. Курсор должен быть непрозрачным для клиента (encoded), поддерживать сортировку по нескольким полям, корректно работать при добавлении новых записей между запросами страниц.`,
        files: [
            {
                filename: "events/models.py",
                code: `from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Event(models.Model):
    class Kind(models.TextChoices):
        LOGIN = "login", "Вход"
        PURCHASE = "purchase", "Покупка"
        COMMENT = "comment", "Комментарий"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")
    kind = models.CharField(max_length=30, choices=Kind)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(db_index=True)

    class Meta:
        # Составной индекс для сортировки по (created_at DESC, id DESC)
        indexes = [
            models.Index(fields=["-created_at", "-id"], name="event_feed_idx"),
        ]
        ordering = ["-created_at", "-id"]
`,
            },
            {
                filename: "core/pagination.py",
                code: `"""
Cursor-based пагинация.

Принцип работы:
  Курсор кодирует значения полей сортировки последнего элемента страницы.
  Следующая страница запрашивает записи строго «после» этого курсора,
  используя row comparison: (created_at, id) < (cursor_created_at, cursor_id).

Преимущества перед offset:
  - O(log n) вместо O(offset) — не деградирует на больших таблицах
  - Стабильность: новые записи не смещают страницы
  - Курсор непрозрачен для клиента (base64-encoded JSON)
"""
import base64
import json
from dataclasses import dataclass
from typing import Any

from django.db.models import QuerySet
from rest_framework.request import Request
from rest_framework.response import Response


@dataclass
class CursorPage:
    results: list
    next_cursor: str | None
    previous_cursor: str | None
    page_size: int


def _encode(data: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()


def _decode(cursor: str) -> dict | None:
    try:
        return json.loads(base64.urlsafe_b64decode(cursor.encode()))
    except Exception:
        return None


class CursorPaginator:
    """
    Пагинатор для QuerySet с сортировкой по (created_at DESC, id DESC).
    Поля сортировки фиксированы; для других полей — создайте подкласс.
    """

    def __init__(self, page_size: int = 20):
        self.page_size = page_size

    def paginate(self, queryset: QuerySet, cursor: str | None) -> CursorPage:
        qs = self._apply_cursor(queryset, cursor)
        # Запрашиваем на 1 больше, чтобы понять есть ли следующая страница
        items = list(qs[: self.page_size + 1])

        has_next = len(items) > self.page_size
        if has_next:
            items = items[: self.page_size]

        next_cursor = self._make_cursor(items[-1]) if has_next and items else None
        # previous_cursor — курсор на первый элемент текущей страницы (для «назад»)
        prev_cursor = self._make_cursor(items[0], direction="prev") if cursor and items else None

        return CursorPage(
            results=items,
            next_cursor=next_cursor,
            previous_cursor=prev_cursor,
            page_size=self.page_size,
        )

    def _apply_cursor(self, qs: QuerySet, cursor: str | None) -> QuerySet:
        if not cursor:
            return qs
        data = _decode(cursor)
        if not data:
            return qs

        direction = data.get("dir", "next")
        created_at = data["created_at"]
        obj_id = data["id"]

        if direction == "next":
            # Записи старше курсора (движение вперёд по времени — назад в ленте)
            return qs.filter(
                created_at__lt=created_at
            ) | qs.filter(created_at=created_at, id__lt=obj_id)
        else:
            # Записи новее курсора (движение назад)
            return qs.filter(
                created_at__gt=created_at
            ) | qs.filter(created_at=created_at, id__gt=obj_id)

    @staticmethod
    def _make_cursor(obj: Any, direction: str = "next") -> str:
        return _encode({
            "created_at": obj.created_at.isoformat(),
            "id": obj.id,
            "dir": direction,
        })


class CursorPaginatedMixin:
    """
    Mixin для DRF ViewSet: добавляет cursor-пагинацию через query param ?cursor=.
    """
    pagination_page_size: int = 20

    def paginate_and_respond(self, queryset: QuerySet, serializer_class, request: Request) -> Response:
        paginator = CursorPaginator(page_size=self.pagination_page_size)
        cursor = request.query_params.get("cursor")
        page = paginator.paginate(queryset, cursor)
        data = serializer_class(page.results, many=True, context={"request": request}).data
        return Response({
            "results": data,
            "pagination": {
                "next_cursor": page.next_cursor,
                "previous_cursor": page.previous_cursor,
                "page_size": page.page_size,
            },
        })
`,
            },
            {
                filename: "events/views.py",
                code: `from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.pagination import CursorPaginatedMixin
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "kind", "payload", "created_at"]


class EventViewSet(CursorPaginatedMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer
    pagination_page_size = 25

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)

    def list(self, request):
        return self.paginate_and_respond(
            queryset=self.get_queryset(),
            serializer_class=EventSerializer,
            request=request,
        )
`,
            },
        ],
        explanation: `**Почему offset-пагинация деградирует.** \`OFFSET 10000 LIMIT 20\` заставляет БД отсчитать и выбросить 10 000 строк перед возвратом нужных. На таблице с миллионами записей это становится полным сканом. Курсорная пагинация использует индекс и выбирает ровно нужные строки через \`WHERE (created_at, id) < (cursor_values)\`.

**Row comparison через два условия.** Точный row comparison \`(created_at, id) < (:ts, :id)\` в Django ORM напрямую не выражается, поэтому разбиваем на два \`filter\` с объединением через \`|\`. Для production с высокой нагрузкой можно использовать \`RawSQL\` или \`extra\` для буквального \`ROW(created_at, id) < ROW(%s, %s)\` — это единственное обращение к сырому SQL, когда ORM не справляется.

**Составной индекс \`(created_at DESC, id DESC)\`.** Без него каждая страница — filesort. Порядок в индексе должен совпадать с порядком сортировки в запросе. \`id\` в индексе нужен как тайbreaker: гарантирует уникальность курсора даже при совпадающих \`created_at\`.

**Непрозрачность курсора.** Base64-encoded JSON скрывает детали реализации от клиента. Клиент не должен интерпретировать или конструировать курсоры вручную — только передавать значение, полученное из предыдущего ответа. Это позволяет менять внутреннюю структуру курсора без изменения API-контракта.

**Запрос \`page_size + 1\`.** Стандартный трюк для определения наличия следующей страницы без дополнительного \`COUNT\` запроса. Если вернулось \`page_size + 1\` записей — страница есть, последний элемент обрезается и становится основой для \`next_cursor\`.`,
    },

    {
        id: "django-api-versioning",
        title: "Версионирование API (v1 → v2)",
        task: `Спроектируйте и реализуйте версионирование API (v1 → v2) с минимальным дублированием кода. Изменения в v2: переименование полей, изменение структуры ответа, добавление обязательных полей. Реализуйте через URL-версионирование, общие базовые классы и трансформеры ответа. Обеспечьте обратную совместимость v1 в течение 6 месяцев.`,
        files: [
            {
                filename: "users/models.py",
                code: `from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Кастомная модель пользователя.
    v1 отдавала: { "username", "email", "full_name" }
    v2 отдаёт:   { "username", "email", "first_name", "last_name", "display_name", "joined_at" }
    """
    # Поле full_name существовало в v1, в v2 разбито на first_name + last_name
    # (first_name и last_name уже есть в AbstractUser)
    joined_at = models.DateTimeField(auto_now_add=True)

    @property
    def display_name(self) -> str:
        return self.get_full_name() or self.username
`,
            },
            {
                filename: "users/serializers.py",
                code: `from rest_framework import serializers
from .models import User


class UserSerializerV1(serializers.ModelSerializer):
    """
    Оригинальный контракт v1. Не изменяем — только помечаем deprecated.
    full_name — единое поле, joined_at отсутствует.
    """
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name"]

    def get_full_name(self, obj) -> str:
        return obj.display_name


class UserSerializerV2(serializers.ModelSerializer):
    """
    Новый контракт v2: поля разбиты, добавлен joined_at и display_name.
    """
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "display_name", "joined_at"]
`,
            },
            {
                filename: "users/views.py",
                code: `import warnings
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import User
from .serializers import UserSerializerV1, UserSerializerV2


class BaseUserViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Вся бизнес-логика — здесь. Версионные ViewSet-ы только указывают сериализатор.
    Добавление новой версии = новый класс в 3 строки.
    """
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch"]

    def get_queryset(self):
        return User.objects.all()


class UserViewSetV1(BaseUserViewSet):
    serializer_class = UserSerializerV1

    def dispatch(self, request, *args, **kwargs):
        # Предупреждаем разработчиков в заголовке ответа
        response = super().dispatch(request, *args, **kwargs)
        response["Deprecation"] = "version=\"v1\"; sunset=\"2025-12-31\""
        response["Link"] = '</api/v2/users/>; rel="successor-version"'
        return response


class UserViewSetV2(BaseUserViewSet):
    serializer_class = UserSerializerV2
`,
            },
            {
                filename: "config/urls.py",
                code: `from django.urls import path, include
from rest_framework.routers import DefaultRouter

from users.views import UserViewSetV1, UserViewSetV2

router_v1 = DefaultRouter()
router_v1.register("users", UserViewSetV1, basename="users-v1")

router_v2 = DefaultRouter()
router_v2.register("users", UserViewSetV2, basename="users-v2")

urlpatterns = [
    path("api/v1/", include((router_v1.urls, "v1"))),
    path("api/v2/", include((router_v2.urls, "v2"))),
]
`,
            },
            {
                filename: "config/settings.py (фрагмент)",
                code: `REST_FRAMEWORK = {
    # URL-версионирование: /api/v1/... и /api/v2/...
    # Альтернативы: AcceptHeaderVersioning (?version=v2 или Accept: application/json; version=v2)
    # URL-версионирование — самое явное и легко кэшируемое CDN-ами.
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v2",
    "ALLOWED_VERSIONS": ["v1", "v2"],
    "VERSION_PARAM": "version",
}
`,
            },
        ],
        explanation: `**Минимальное дублирование через BaseViewSet.** Вся логика (queryset, permissions, методы) живёт в \`BaseUserViewSet\`. Версионные классы наследуют его и только указывают нужный \`serializer_class\`. При добавлении v3 — три строки кода.

**Сериализаторы не изменяются после релиза.** \`UserSerializerV1\` заморожен на весь период поддержки. Любые изменения в v1 контракте требуют нового \`UserSerializerV1Patch\` или явного решения о несовместимом изменении. Это гарантирует, что существующие клиенты не сломаются.

**Deprecation через HTTP-заголовки.** Стандарт RFC 8594 определяет заголовок \`Deprecation\` и \`Sunset\` — они сообщают клиентам дату отключения машиночитаемым способом. \`Link: rel="successor-version"\` указывает на URL новой версии. Серьёзные API-клиенты (Postman, curl --verbose) показывают эти заголовки разработчику.

**URL-версионирование vs Accept Header.** URL-версионирование (\`/api/v1/\`) проще для отладки, кэширования и логирования. Accept header (\`Accept: application/vnd.api+json; version=2\`) чище с REST-точки зрения, но требует правильной настройки кэша (\`Vary: Accept\`). Для публичных API — URL-версионирование предпочтительнее.

**Стратегия sunset.** 6 месяцев — минимум для публичного API. Реальный план: объявить deprecation при релизе v2, за 30 дней до sunset — email всем, кто использует v1 (по логам), за 7 дней — предупреждение в ответе v1. После sunset — 410 Gone вместо 404.`,
    },

    {
        id: "django-jwt-auth",
        title: "JWT-аутентификация с refresh-токенами",
        task: `Реализуйте JWT-аутентификацию с refresh-токенами без сторонних библиотек (только PyJWT). Требования: access-токен живёт 15 минут, refresh-токен — 30 дней, refresh-токен ротируется при каждом обновлении, возможность отзыва конкретного refresh-токена, детекция повторного использования отозванного токена (token reuse detection).`,
        files: [
            {
                filename: "auth/models.py",
                code: `import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class RefreshToken(models.Model):
    """
    Хранит refresh-токены. Хранится хеш, а не сам токен —
    как с паролями: даже при утечке БД токены бесполезны.

    family_id объединяет цепочку ротаций одного токена.
    Если используется уже отозванный токен из той же семьи —
    это признак компрометации: вся семья немедленно инвалидируется.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="refresh_tokens")
    token_hash = models.CharField(max_length=64, unique=True)  # SHA-256 hex
    family_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [models.Index(fields=["token_hash"])]
`,
            },
            {
                filename: "auth/tokens.py",
                code: `import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings

ACCESS_TOKEN_TTL = timedelta(minutes=15)
REFRESH_TOKEN_TTL = timedelta(days=30)

ALGORITHM = "HS256"


# ---------------------------------------------------------------------------
# Низкоуровневые утилиты
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Access-токен (stateless JWT)
# ---------------------------------------------------------------------------

def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": _now() + ACCESS_TOKEN_TTL,
        "iat": _now(),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Бросает jwt.PyJWTError при невалидном или просроченном токене."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


# ---------------------------------------------------------------------------
# Refresh-токен (stateful: хранится в БД)
# ---------------------------------------------------------------------------

def create_refresh_token(user, family_id: uuid.UUID | None = None) -> str:
    from .models import RefreshToken

    raw = secrets.token_urlsafe(48)  # криптографически стойкий случайный токен

    RefreshToken.objects.create(
        user=user,
        token_hash=_hash(raw),
        family_id=family_id or uuid.uuid4(),
        expires_at=_now() + REFRESH_TOKEN_TTL,
    )
    return raw


def rotate_refresh_token(raw_token: str) -> tuple[str, str]:
    """
    Ротирует refresh-токен: старый отзывается, создаётся новый в той же семье.
    Возвращает (новый_access, новый_refresh).

    Если токен уже отозван — инвалидирует всю семью (reuse detection).
    Бросает ValueError при любой проблеме с токеном.
    """
    from .models import RefreshToken

    token_hash = _hash(raw_token)

    try:
        stored = RefreshToken.objects.select_related("user").get(token_hash=token_hash)
    except RefreshToken.DoesNotExist:
        raise ValueError("Refresh token not found.")

    if stored.expires_at < _now():
        stored.delete()
        raise ValueError("Refresh token expired.")

    if stored.is_revoked:
        # Повторное использование отозванного токена — компрометация всей семьи
        RefreshToken.objects.filter(family_id=stored.family_id).delete()
        raise ValueError("Token reuse detected. All sessions in this family have been revoked.")

    # Отзываем текущий токен
    stored.is_revoked = True
    stored.save(update_fields=["is_revoked"])

    # Создаём новую пару токенов в той же семье
    new_access = create_access_token(stored.user.id)
    new_refresh = create_refresh_token(stored.user, family_id=stored.family_id)
    return new_access, new_refresh


def revoke_refresh_token(raw_token: str) -> None:
    """Отзывает конкретный токен (logout с одного устройства)."""
    from .models import RefreshToken

    RefreshToken.objects.filter(token_hash=_hash(raw_token)).update(is_revoked=True)


def revoke_all_user_tokens(user_id: int) -> None:
    """Отзывает все токены пользователя (logout со всех устройств)."""
    from .models import RefreshToken

    RefreshToken.objects.filter(user_id=user_id).delete()
`,
            },
            {
                filename: "auth/views.py",
                code: `import jwt
from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .tokens import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    rotate_refresh_token,
    revoke_refresh_token,
)


class LoginView(APIView):
    class InputSerializer(serializers.Serializer):
        username = serializers.CharField()
        password = serializers.CharField()

    def post(self, request):
        s = self.InputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = authenticate(**s.validated_data)
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            "access": create_access_token(user.id),
            "refresh": create_refresh_token(user),
        })


class RefreshView(APIView):
    class InputSerializer(serializers.Serializer):
        refresh = serializers.CharField()

    def post(self, request):
        s = self.InputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        try:
            new_access, new_refresh = rotate_refresh_token(s.validated_data["refresh"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({"access": new_access, "refresh": new_refresh})


class LogoutView(APIView):
    class InputSerializer(serializers.Serializer):
        refresh = serializers.CharField()

    def post(self, request):
        s = self.InputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        revoke_refresh_token(s.validated_data["refresh"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# DRF Authentication backend
# ---------------------------------------------------------------------------

from rest_framework.authentication import BaseAuthentication
from django.contrib.auth import get_user_model

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None

        token = header.removeprefix("Bearer ").strip()
        try:
            payload = decode_access_token(token)
        except jwt.PyJWTError:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed("Invalid or expired access token.")

        try:
            user = User.objects.get(pk=payload["sub"])
        except User.DoesNotExist:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed("User not found.")

        return user, None
`,
            },
            {
                filename: "settings.py (фрагмент)",
                code: `REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "auth.views.JWTAuthentication",
    ],
}

# Периодически удаляем истёкшие токены из БД
# Запускайте management-командой или через Celery Beat:
# python manage.py cleartokens
`,
            },
        ],
        explanation: `**Хранение хеша, а не токена.** Refresh-токен в БД хранится как SHA-256 хеш, аналогично паролю. При утечке БД атакующий получает хеши, а не рабочие токены. При проверке входящий токен хешируется и сравнивается — скорость не критична, т.к. операция выполняется один раз за запрос к \`/auth/refresh\`.

**Семьи токенов (token families) и reuse detection.** При каждой ротации новый токен наследует \`family_id\` родителя. Если клиент присылает уже отозванный токен — значит, либо клиент ошибся в логике, либо токен скомпрометирован. Безопасная реакция: удалить всю семью. Это разлогинит атакующего и легитимного пользователя, но лучше, чем игнорировать.

**Access-токен stateless, refresh-токен stateful.** Access-токен верифицируется только подписью — никаких обращений к БД при каждом запросе. Refresh-токен всегда проверяется через БД: это единственный способ реализовать отзыв. Короткий TTL access-токена (15 мин) ограничивает окно компрометации при утечке.

**\`secrets.token_urlsafe\` вместо UUID.** UUID4 содержит 122 бита энтропии — достаточно, но \`secrets.token_urlsafe(48)\` генерирует 384 бита и является рекомендованным способом для криптографических токенов в Python (PEP 506).

**Очистка истёкших токенов.** Таблица растёт бесконечно без периодической очистки. Добавьте management-команду \`cleartokens\` или Celery Beat задачу, которая удаляет записи с \`expires_at < now()\`.`,
    },

    {
        id: "django-rate-limiting",
        title: "Rate limiting и throttling",
        task: `Реализуйте многоуровневый rate limiting: глобальный лимит по IP, лимит по аутентифицированному пользователю, отдельные лимиты для конкретных эндпоинтов (например, /api/auth/login — 5 запросов в минуту), динамические лимиты в зависимости от плана пользователя. Используйте Redis для хранения счётчиков. Верните корректные заголовки Retry-After и X-RateLimit-*.`,
        files: [
            {
                filename: "core/throttling.py",
                code: `"""
Многоуровневый rate limiting через Redis с алгоритмом sliding window.

Алгоритм sliding window:
  Храним в Redis Sorted Set временные метки запросов за последнее окно.
  При каждом запросе:
    1. Удаляем метки старше (now - window)
    2. Считаем оставшиеся
    3. Если count < limit — добавляем текущую метку и разрешаем
    4. Иначе — блокируем, возвращаем Retry-After

Преимущество перед fixed window: нет burst-эффекта на границе окна.
"""
import time
import redis
from django.conf import settings
from rest_framework.throttling import BaseThrottle
from rest_framework.exceptions import Throttled


def _get_redis() -> redis.Redis:
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


def _sliding_window(key: str, limit: int, window_seconds: int) -> tuple[bool, int, int]:
    """
    Проверяет и обновляет счётчик в Redis.
    Возвращает (allowed, current_count, retry_after_seconds).
    """
    r = _get_redis()
    now = time.time()
    window_start = now - window_seconds

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, "-inf", window_start)  # удаляем устаревшие
    pipe.zcard(key)                                    # считаем актуальные
    pipe.zadd(key, {str(now): now})                    # добавляем текущий
    pipe.expire(key, window_seconds + 1)               # TTL чуть больше окна
    _, count, _, _ = pipe.execute()

    allowed = count < limit
    retry_after = 0

    if not allowed:
        # Время до освобождения слота: когда самый старый запрос выйдет из окна
        oldest = r.zrange(key, 0, 0, withscores=True)
        if oldest:
            oldest_ts = oldest[0][1]
            retry_after = max(0, int(oldest_ts + window_seconds - now) + 1)

    return allowed, count, retry_after


class RateLimitMixin:
    """
    Базовый mixin: определяет ключ, лимит и окно.
    Подклассы переопределяют get_limit() для динамических лимитов.
    """
    scope: str = "default"
    limit: int = 100
    window: int = 60  # секунды

    def get_ident(self, request) -> str:
        raise NotImplementedError

    def get_limit(self, request) -> int:
        return self.limit

    def allow_request(self, request, view) -> bool:
        key = f"rl:{self.scope}:{self.get_ident(request)}"
        limit = self.get_limit(request)
        allowed, count, retry_after = _sliding_window(key, limit, self.window)

        # Сохраняем метаданные для заголовков ответа
        request._rl_data = getattr(request, "_rl_data", {})
        request._rl_data[self.scope] = {
            "limit": limit,
            "remaining": max(0, limit - count - 1),
            "retry_after": retry_after,
        }

        return allowed

    def wait(self) -> float | None:
        return None


# ---------------------------------------------------------------------------
# Конкретные throttle-классы
# ---------------------------------------------------------------------------

class IPThrottle(RateLimitMixin, BaseThrottle):
    """Глобальный лимит по IP: 200 запросов в минуту."""
    scope = "ip"
    limit = 200
    window = 60

    def get_ident(self, request) -> str:
        return self.get_ip(request)

    @staticmethod
    def get_ip(request) -> str:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        return forwarded.split(",")[0].strip() if forwarded else request.META["REMOTE_ADDR"]


class UserThrottle(RateLimitMixin, BaseThrottle):
    """Лимит по аутентифицированному пользователю с учётом плана."""
    scope = "user"
    window = 60

    # Лимиты по плану (запросов в минуту)
    PLAN_LIMITS = {
        "free": 30,
        "basic": 100,
        "pro": 500,
        "enterprise": 2000,
    }
    DEFAULT_LIMIT = 30

    def get_ident(self, request) -> str:
        if request.user and request.user.is_authenticated:
            return f"user:{request.user.pk}"
        return f"ip:{IPThrottle.get_ip(request)}"

    def get_limit(self, request) -> int:
        if not (request.user and request.user.is_authenticated):
            return self.DEFAULT_LIMIT
        plan = getattr(request.user, "plan", "free")
        return self.PLAN_LIMITS.get(plan, self.DEFAULT_LIMIT)


class LoginThrottle(RateLimitMixin, BaseThrottle):
    """Жёсткий лимит для /api/auth/login: 5 попыток в минуту по IP."""
    scope = "login"
    limit = 5
    window = 60

    def get_ident(self, request) -> str:
        return IPThrottle.get_ip(request)
`,
            },
            {
                filename: "core/middleware.py",
                code: `"""
Middleware добавляет X-RateLimit-* и Retry-After заголовки к каждому ответу.
Данные собираются throttle-классами в request._rl_data во время обработки.
"""


class RateLimitHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        rl_data: dict = getattr(request, "_rl_data", {})

        # Используем самый строгий лимит для заголовков
        if rl_data:
            most_restrictive = min(rl_data.values(), key=lambda d: d["remaining"])
            response["X-RateLimit-Limit"] = most_restrictive["limit"]
            response["X-RateLimit-Remaining"] = most_restrictive["remaining"]
            if most_restrictive["retry_after"]:
                response["Retry-After"] = most_restrictive["retry_after"]

        return response
`,
            },
            {
                filename: "auth/views.py (фрагмент)",
                code: `from rest_framework.views import APIView
from core.throttling import LoginThrottle


class LoginView(APIView):
    # Применяем жёсткий throttle только к этому endpoint
    throttle_classes = [LoginThrottle]

    def post(self, request):
        ...
`,
            },
            {
                filename: "settings.py (фрагмент)",
                code: `REDIS_URL = "redis://localhost:6379/0"

REST_FRAMEWORK = {
    # Применяются ко всем endpoint-ам, если не переопределены в ViewSet
    "DEFAULT_THROTTLE_CLASSES": [
        "core.throttling.IPThrottle",
        "core.throttling.UserThrottle",
    ],
    # Используем наши собственные классы, поэтому DEFAULT_THROTTLE_RATES не нужен
}

MIDDLEWARE = [
    ...
    # После всех middleware: добавляем заголовки к готовому ответу
    "core.middleware.RateLimitHeadersMiddleware",
]
`,
            },
        ],
        explanation: `**Sliding window vs Fixed window.** Fixed window сбрасывает счётчик в фиксированный момент времени: при лимите 100 req/min можно отправить 100 запросов в 00:59 и ещё 100 в 01:00 — burst в 200 запросов за 2 секунды. Sliding window смотрит на последние N секунд относительно текущего момента, поэтому burst невозможен.

**Redis Sorted Set как хранилище меток.** Каждый запрос — элемент Sorted Set с score = unix timestamp. \`ZREMRANGEBYSCORE\` удаляет устаревшие, \`ZCARD\` считает актуальные. Pipeline объединяет 4 операции в одно сетевое обращение. TTL на ключе гарантирует автоматическую очистку неактивных ключей.

**Динамические лимиты по плану.** \`get_limit()\` вызывается при каждом запросе и возвращает значение в зависимости от \`user.plan\`. Это не требует хранения лимита в Redis — сам лимит вычисляется на лету, а Redis хранит только счётчики запросов.

**Разделение scope-ов.** Каждый throttle использует свой ключ (\`rl:ip:...\`, \`rl:user:...\`, \`rl:login:...\`). Это позволяет применять разные лимиты независимо: пользователь может попасть под IP-лимит, не исчерпав пользовательский, и наоборот.

**Заголовки \`X-RateLimit-*\` и \`Retry-After\`.** Middleware собирает данные из \`request._rl_data\`, добавленных throttle-классами. \`Retry-After\` — секунды до следующего разрешённого запроса, вычисляется из timestamp самого старого запроса в окне. Клиент может использовать этот заголовок для автоматического retry с правильной задержкой.`,
    },

    {
        id: "django-async-views",
        title: "Async Views в Django",
        task: `Переведите ресурсоёмкое представление на async. Представление агрегирует данные из 3 внешних API параллельно, делает несколько запросов к БД и отдаёт итоговый JSON. Используйте async def view, asyncio.gather, sync_to_async для ORM-запросов. Измерьте разницу в latency. Объясните ограничения Django async ORM.`,
        files: [
            {
                filename: "dashboard/views.py",
                code: `"""
Async view агрегирует данные из трёх внешних API параллельно
и делает несколько ORM-запросов через sync_to_async.

Latency (пример с тремя API по 300ms каждый):
  sync view:  ~900ms  (последовательно)
  async view: ~300ms  (параллельно через gather)
"""
import asyncio
import logging

import httpx
from asgiref.sync import sync_to_async
from django.http import JsonResponse
from django.views import View

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Внешние API — каждый вызов независим, выполняем параллельно
# ---------------------------------------------------------------------------

async def fetch_weather(client: httpx.AsyncClient, city: str) -> dict:
    try:
        r = await client.get(
            "https://api.weather.example.com/current",
            params={"city": city},
            timeout=5.0,
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning("Weather API failed: %s", exc)
        return {}


async def fetch_exchange_rates(client: httpx.AsyncClient) -> dict:
    try:
        r = await client.get("https://api.rates.example.com/latest", timeout=5.0)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning("Exchange rates API failed: %s", exc)
        return {}


async def fetch_news(client: httpx.AsyncClient, category: str) -> list:
    try:
        r = await client.get(
            "https://api.news.example.com/headlines",
            params={"category": category},
            timeout=5.0,
        )
        r.raise_for_status()
        return r.json().get("articles", [])
    except Exception as exc:
        logger.warning("News API failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# ORM-запросы через sync_to_async
# ---------------------------------------------------------------------------
#
# Django ORM синхронный. В async-контексте прямой вызов ORM бросает
# SynchronousOnlyOperation. Решение — sync_to_async, который запускает
# синхронный код в threadpool executor.
#
# ВАЖНО: передавайте в sync_to_async как можно меньше работы.
# Не передавайте lazy queryset — он выполнится вне async-контекста.
# Материализуйте его (list/values) внутри обёрнутой функции.

def _get_user_profile(user_id: int) -> dict:
    from users.models import UserProfile
    profile = UserProfile.objects.select_related("user").get(user_id=user_id)
    return {"city": profile.city, "currency": profile.currency, "plan": profile.plan}


def _get_recent_orders(user_id: int, limit: int = 5) -> list:
    from orders.models import Order
    qs = (
        Order.objects.filter(user_id=user_id)
        .order_by("-created_at")
        .values("id", "status", "total", "created_at")[:limit]
    )
    return list(qs)  # материализуем внутри sync_to_async


get_user_profile = sync_to_async(_get_user_profile)
get_recent_orders = sync_to_async(_get_recent_orders)


# ---------------------------------------------------------------------------
# Async View
# ---------------------------------------------------------------------------

class DashboardView(View):
    async def get(self, request, *args, **kwargs):
        user_id = request.user.id

        # 1. ORM-запросы выполняем параллельно между собой и с API
        async with httpx.AsyncClient() as client:
            profile, orders, weather, rates, news = await asyncio.gather(
                get_user_profile(user_id),
                get_recent_orders(user_id),
                # Значения из профиля нужны для API, но профиль ещё не загружен.
                # Если зависимость есть — сначала await profile, потом gather для API.
                fetch_weather(client, "Moscow"),
                fetch_exchange_rates(client),
                fetch_news(client, "technology"),
                return_exceptions=False,  # исключения пробрасываются наверх
            )

        return JsonResponse({
            "profile": profile,
            "recent_orders": orders,
            "weather": weather,
            "exchange_rates": rates,
            "news": news[:3],
        })
`,
            },
            {
                filename: "dashboard/views_sync.py",
                code: `"""
Синхронная версия того же view — для сравнения latency.
При трёх API по 300ms каждый: суммарно ~900ms.
"""
import requests
from django.http import JsonResponse
from django.views import View
from orders.models import Order
from users.models import UserProfile


class DashboardViewSync(View):
    def get(self, request, *args, **kwargs):
        user_id = request.user.id

        profile = UserProfile.objects.select_related("user").get(user_id=user_id)
        orders = list(
            Order.objects.filter(user_id=user_id)
            .order_by("-created_at")
            .values("id", "status", "total", "created_at")[:5]
        )

        # Последовательные вызовы — каждый ждёт предыдущего
        weather = requests.get("https://api.weather.example.com/current", timeout=5).json()
        rates = requests.get("https://api.rates.example.com/latest", timeout=5).json()
        news = requests.get("https://api.news.example.com/headlines", timeout=5).json()

        return JsonResponse({
            "profile": {"city": profile.city, "currency": profile.currency},
            "recent_orders": orders,
            "weather": weather,
            "exchange_rates": rates,
            "news": news.get("articles", [])[:3],
        })
`,
            },
            {
                filename: "config/asgi.py",
                code: `"""
Async views требуют ASGI-сервер. Gunicorn (WSGI) не поддерживает async.
Для production используйте Uvicorn или Daphne.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()

# Запуск в production:
#   uvicorn config.asgi:application --workers 4 --port 8000
`,
            },
        ],
        explanation: `**Когда async view даёт выигрыш.** Async view эффективен при I/O-bound операциях: несколько HTTP-запросов к внешним API, долгие запросы к БД, работа с файлами. Вместо блокировки потока на каждый вызов event loop переключается на другие корутины. При трёх API по 300ms параллельное выполнение даёт ~300ms вместо ~900ms.

**\`sync_to_async\` и ограничения ORM.** Django ORM полностью синхронный. Прямой вызов ORM в async-контексте бросает \`SynchronousOnlyOperation\`. \`sync_to_async\` запускает синхронный код в threadpool, что безопасно, но не бесплатно: каждый вызов создаёт overhead переключения потока. Оборачивайте целые функции, а не отдельные строки, и материализуйте QuerySet внутри обёртки — иначе lazy evaluation произойдёт вне threadpool.

**\`return_exceptions=False\` в \`gather\`.** При \`False\` первое исключение пробрасывается наружу и отменяет остальные корутины. При \`True\` исключения возвращаются как значения в результирующем списке — подходит для partial failure (вернуть частичный результат если один API недоступен). Выбор зависит от требований к graceful degradation.

**ASGI обязателен.** Async views работают только с ASGI-сервером (Uvicorn, Daphne, Hypercorn). Gunicorn — WSGI, он выполнит async view как sync в отдельном потоке, никакого параллелизма не будет. В Django 4.1+ sync и async views можно смешивать в одном проекте.

**Ограничения Django async ORM.** На момент Django 5.x нативный async ORM (\`await Model.objects.filter(...)\`) реализован, но не все возможности покрыты: некоторые менеджеры, сигналы и транзакции требуют дополнительных обёрток. \`sync_to_async\` остаётся самым надёжным подходом для сложных ORM-запросов.`,
    },

    {
        id: "django-celery-canvas",
        title: "Celery: сложные workflow (Canvas)",
        task: `Реализуйте с помощью Celery Canvas сложный workflow обработки загруженного видеофайла: валидация формата → параллельное создание превью разных разрешений → транскодирование → загрузка в S3 → уведомление пользователя. Используйте chain, group, chord. Реализуйте обработку частичных сбоев и retry-стратегию для каждого шага.`,
        files: [
            {
                filename: "video/models.py",
                code: `from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class VideoJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидает"
        VALIDATING = "validating", "Валидация"
        PROCESSING = "processing", "Обработка"
        UPLOADING = "uploading", "Загрузка"
        DONE = "done", "Готово"
        FAILED = "failed", "Ошибка"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    original_path = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_status(self, status: str, error: str = "") -> None:
        self.status = status
        self.error = error
        self.save(update_fields=["status", "error", "updated_at"])
`,
            },
            {
                filename: "video/tasks.py",
                code: `"""
Celery Canvas workflow:

  validate_video
       │
       ▼
  chord(
    group(
      create_preview("360p"),
      create_preview("720p"),
      create_preview("1080p"),
    ),
    callback=transcode_video   ← запускается после всех preview
  )
       │
       ▼
  upload_to_s3
       │
       ▼
  notify_user
"""
import logging
from celery import shared_task, chain, group, chord
from celery.exceptions import MaxRetriesExceededError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Вспомогательные retry-настройки
# ---------------------------------------------------------------------------
NETWORK_RETRY = dict(max_retries=3, default_retry_delay=30)   # для S3/сети
PROCESS_RETRY = dict(max_retries=2, default_retry_delay=60)   # для CPU-задач


# ---------------------------------------------------------------------------
# Шаги pipeline
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=1)
def validate_video(self, job_id: int) -> int:
    """Проверяет формат файла. Бросает ValueError при невалидном файле."""
    from .models import VideoJob
    job = VideoJob.objects.get(pk=job_id)
    job.set_status(VideoJob.Status.VALIDATING)

    try:
        _check_format(job.original_path)  # бросает ValueError если формат неверный
    except ValueError as exc:
        job.set_status(VideoJob.Status.FAILED, error=str(exc))
        raise  # не retry — формат не изменится

    return job_id  # передаётся следующему шагу как первый аргумент


@shared_task(bind=True, **PROCESS_RETRY)
def create_preview(self, job_id: int, resolution: str) -> str:
    """Создаёт превью одного разрешения. Возвращает путь к файлу."""
    try:
        path = _ffmpeg_preview(job_id, resolution)
        return path
    except Exception as exc:
        logger.warning("Preview %s failed for job %d: %s", resolution, job_id, exc)
        try:
            raise self.retry(exc=exc)
        except MaxRetriesExceededError:
            # Частичный сбой — возвращаем None, chord продолжится
            return None


@shared_task(bind=True, **PROCESS_RETRY)
def transcode_video(self, preview_paths: list[str | None], job_id: int) -> int:
    """
    Callback chord-а: получает результаты всех create_preview.
    preview_paths — список путей (или None для упавших превью).
    """
    from .models import VideoJob
    job = VideoJob.objects.get(pk=job_id)
    job.set_status(VideoJob.Status.PROCESSING)

    successful = [p for p in preview_paths if p]
    logger.info("Job %d: %d/%d previews ready", job_id, len(successful), len(preview_paths))

    try:
        _ffmpeg_transcode(job.original_path)
    except Exception as exc:
        raise self.retry(exc=exc)

    return job_id


@shared_task(bind=True, **NETWORK_RETRY)
def upload_to_s3(self, job_id: int) -> int:
    from .models import VideoJob
    job = VideoJob.objects.get(pk=job_id)
    job.set_status(VideoJob.Status.UPLOADING)

    try:
        _s3_upload(job_id)
    except Exception as exc:
        raise self.retry(exc=exc)

    return job_id


@shared_task
def notify_user(job_id: int) -> None:
    from django.core.mail import send_mail
    from .models import VideoJob
    job = VideoJob.objects.select_related("user").get(pk=job_id)
    job.set_status(VideoJob.Status.DONE)
    send_mail(
        subject="Ваше видео готово",
        message=f"Видео #{job_id} обработано и доступно.",
        from_email="noreply@example.com",
        recipient_list=[job.user.email],
    )


@shared_task
def on_pipeline_failure(request, exc, traceback, job_id: int) -> None:
    """link_error callback — вызывается при необработанной ошибке в цепочке."""
    from .models import VideoJob
    logger.error("Video pipeline failed for job %d: %s", job_id, exc)
    VideoJob.objects.filter(pk=job_id).update(
        status=VideoJob.Status.FAILED,
        error=str(exc),
    )


# ---------------------------------------------------------------------------
# Сборка и запуск pipeline
# ---------------------------------------------------------------------------

def process_video(job_id: int) -> None:
    """
    Строит и запускает полный Celery Canvas pipeline.
    Вызывается из view после сохранения VideoJob.
    """
    resolutions = ["360p", "720p", "1080p"]

    # chord: group параллельных превью → transcode как callback
    preview_chord = chord(
        group(create_preview.s(job_id, res) for res in resolutions),
        transcode_video.s(job_id),       # получит список результатов группы
    )

    pipeline = chain(
        validate_video.s(job_id),
        preview_chord,
        upload_to_s3.s(),                # получит job_id от transcode
        notify_user.s(),
    )

    # link_error навешивается на всю цепочку
    pipeline.apply_async(
        link_error=on_pipeline_failure.s(job_id),
    )


# ---------------------------------------------------------------------------
# Заглушки для внешних зависимостей (ffmpeg, boto3)
# ---------------------------------------------------------------------------

def _check_format(path: str) -> None:
    allowed = (".mp4", ".mov", ".avi", ".mkv")
    if not any(path.endswith(ext) for ext in allowed):
        raise ValueError(f"Unsupported format: {path}")


def _ffmpeg_preview(job_id: int, resolution: str) -> str:
    # subprocess.run(["ffmpeg", ...])
    return f"/tmp/job_{job_id}_{resolution}.jpg"


def _ffmpeg_transcode(path: str) -> None:
    # subprocess.run(["ffmpeg", "-i", path, ...])
    pass


def _s3_upload(job_id: int) -> None:
    # boto3.client("s3").upload_file(...)
    pass
`,
            },
        ],
        explanation: `**Chain, Group, Chord — три примитива Celery Canvas.**
\`chain\` — последовательность: результат каждой задачи передаётся следующей как первый аргумент. \`group\` — параллельные задачи, результаты не собираются в одно место. \`chord\` — group с callback: callback вызывается когда все задачи группы завершились, получая список их результатов.

**Как \`chord\` вписывается в \`chain\`.** В Celery \`chord\` можно поместить внутрь \`chain\`, но передача аргументов нетривиальна: callback chord-а получает результаты группы, а не аргумент из предыдущего шага chain. Поэтому \`job_id\` передаётся в \`transcode_video\` явно через \`.s(job_id)\`, а не через цепочку.

**Обработка частичных сбоев в group.** Если одна из задач создания превью падает после всех retry — она возвращает \`None\` вместо броска исключения. Chord не прерывается: callback \`transcode_video\` получает список с \`None\` на месте упавшего превью и продолжает работу с теми превью, которые удались. Это осознанный trade-off: потеря одного разрешения некритична.

**\`link_error\` для катастрофических сбоев.** Если критическая задача (validate, transcode, upload) исчерпала retry — её исключение пробрасывается в \`link_error\` callback. Это единственное место, где статус \`FAILED\` выставляется для неожиданных ошибок. Задачи, возвращающие \`None\` при сбое, не триггерят \`link_error\`.

**Разные retry-стратегии.** Сетевые задачи (S3) могут быть нестабильны — 3 retry с паузой 30s. CPU-задачи (ffmpeg) падают редко, но если падают — скорее всего проблема в файле — 2 retry с паузой 60s. Валидация — 1 retry: повторная проверка формата почти никогда не изменит результат.`,
    },

    {
        id: "django-celery-beat-dynamic",
        title: "Celery Beat и динамические расписания",
        task: `Реализуйте систему динамических периодических задач: пользователи настраивают расписание отчётов (cron-выражение) через UI, задачи должны создаваться/удаляться/обновляться без перезапуска Celery, поддержка timezone для каждого расписания. Используйте django-celery-beat с кастомным scheduler или реализуйте собственное решение.`,
        files: [
            {
                filename: "reports/models.py",
                code: `from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()

# Простая валидация cron-выражения: 5 полей через пробел
CRON_VALIDATOR = RegexValidator(
    regex=r'^(\\S+\\s){4}\\S+$',
    message="Введите корректное cron-выражение (5 полей: минута час день месяц день_недели)",
)


class ReportSchedule(models.Model):
    """
    Расписание отчёта, управляемое пользователем.
    Синхронизируется с django-celery-beat через сигналы.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="report_schedules")
    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50)
    cron = models.CharField(max_length=100, validators=[CRON_VALIDATOR],
                            help_text="Пример: '0 9 * * 1' — каждый понедельник в 09:00")
    timezone = models.CharField(max_length=50, default="UTC",
                                help_text="Пример: Europe/Moscow")
    is_active = models.BooleanField(default=True)

    # Ссылка на задачу в django-celery-beat
    periodic_task_name = models.CharField(max_length=255, blank=True, editable=False)

    class Meta:
        unique_together = [("user", "name")]

    def __str__(self):
        return f"{self.user}: {self.name} ({self.cron})"
`,
            },
            {
                filename: "reports/beat_sync.py",
                code: `"""
Синхронизация ReportSchedule → django_celery_beat.PeriodicTask.

django-celery-beat хранит расписания в БД и опрашивает их каждые
DEFAULT_HEARTBEAT секунд (по умолчанию 5s). Изменение PeriodicTask
подхватывается без перезапуска Celery Beat.
"""
import json
from django_celery_beat.models import PeriodicTask, CrontabSchedule


def _get_or_create_crontab(cron: str, timezone: str) -> CrontabSchedule:
    """
    Парсит строку '0 9 * * 1' в поля CrontabSchedule.
    get_or_create гарантирует отсутствие дублей.
    """
    minute, hour, day_of_month, month_of_year, day_of_week = cron.split()
    schedule, _ = CrontabSchedule.objects.get_or_create(
        minute=minute,
        hour=hour,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        day_of_week=day_of_week,
        timezone=timezone,
    )
    return schedule


def sync_to_beat(schedule: "ReportSchedule") -> None:
    """Создаёт или обновляет PeriodicTask для данного расписания."""
    task_name = f"report.{schedule.pk}.{schedule.user_id}"
    crontab = _get_or_create_crontab(schedule.cron, schedule.timezone)

    PeriodicTask.objects.update_or_create(
        name=task_name,
        defaults={
            "task": "reports.tasks.generate_report",
            "crontab": crontab,
            "kwargs": json.dumps({
                "schedule_id": schedule.pk,
                "report_type": schedule.report_type,
                "user_id": schedule.user_id,
            }),
            "enabled": schedule.is_active,
        },
    )

    # Сохраняем имя задачи обратно в модель для последующего удаления
    if schedule.periodic_task_name != task_name:
        ReportSchedule = schedule.__class__
        ReportSchedule.objects.filter(pk=schedule.pk).update(periodic_task_name=task_name)


def remove_from_beat(task_name: str) -> None:
    """Удаляет PeriodicTask по имени. Безопасно если задачи нет."""
    PeriodicTask.objects.filter(name=task_name).delete()
`,
            },
            {
                filename: "reports/signals.py",
                code: `from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import ReportSchedule
from .beat_sync import sync_to_beat, remove_from_beat


@receiver(post_save, sender=ReportSchedule)
def on_schedule_saved(sender, instance, **kwargs):
    """Синхронизируем с Beat при создании и обновлении."""
    sync_to_beat(instance)


@receiver(post_delete, sender=ReportSchedule)
def on_schedule_deleted(sender, instance, **kwargs):
    """Удаляем PeriodicTask при удалении расписания."""
    if instance.periodic_task_name:
        remove_from_beat(instance.periodic_task_name)
`,
            },
            {
                filename: "reports/tasks.py",
                code: `import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def generate_report(self, schedule_id: int, report_type: str, user_id: int) -> None:
    """
    Задача, которую запускает Celery Beat по расписанию.
    kwargs передаются из PeriodicTask.kwargs (JSON).
    """
    from django.contrib.auth import get_user_model
    from django.core.mail import send_mail

    User = get_user_model()

    try:
        user = User.objects.get(pk=user_id)
        report_data = _build_report(report_type, user_id)
        _send_report(user.email, report_type, report_data)
        logger.info("Report '%s' sent to user %d", report_type, user_id)
    except Exception as exc:
        logger.error("Report generation failed: %s", exc)
        raise self.retry(exc=exc)


def _build_report(report_type: str, user_id: int) -> dict:
    # Здесь реальная логика генерации отчёта
    return {"type": report_type, "user_id": user_id, "rows": []}


def _send_report(email: str, report_type: str, data: dict) -> None:
    from django.core.mail import send_mail
    send_mail(
        subject=f"Отчёт: {report_type}",
        message=f"Ваш отчёт готов. Строк: {len(data.get('rows', []))}",
        from_email="reports@example.com",
        recipient_list=[email],
    )
`,
            },
            {
                filename: "reports/views.py",
                code: `from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ReportSchedule


class ReportScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSchedule
        fields = ["id", "name", "report_type", "cron", "timezone", "is_active"]
        read_only_fields = ["id"]

    def validate_timezone(self, value: str) -> str:
        import zoneinfo
        try:
            zoneinfo.ZoneInfo(value)
        except (KeyError, zoneinfo.ZoneInfoNotFoundError):
            raise serializers.ValidationError(f"Unknown timezone: {value}")
        return value


class ReportScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ReportScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportSchedule.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # post_save сигнал автоматически создаст PeriodicTask
        serializer.save(user=self.request.user)
`,
            },
        ],
        explanation: `**Как django-celery-beat подхватывает изменения без перезапуска.** Beat-процесс опрашивает таблицу \`django_celery_beat_periodictask\` каждые 5 секунд (настраивается через \`CELERYBEAT_MAX_LOOP_INTERVAL\`). При изменении записи Beat перечитывает расписание на следующей итерации. Это ключевое отличие от файловой конфигурации (\`celerybeat-schedule\`), которая требует перезапуска.

**CrontabSchedule и переиспользование.** \`get_or_create\` для \`CrontabSchedule\` предотвращает дублирование: \`"0 9 * * 1 UTC"\` будет создан один раз и использован всеми задачами с таким расписанием. При изменении расписания создаётся новый \`CrontabSchedule\`, старый остаётся (возможно используется другими задачами).

**Сигналы как точка синхронизации.** \`post_save\` на \`ReportSchedule\` гарантирует, что Beat-задача обновляется при любом изменении: через API, Django Admin, management-команды. Логика синхронизации изолирована в \`beat_sync.py\` и не дублируется.

**\`kwargs\` вместо \`args\` в PeriodicTask.** Аргументы передаются как JSON-строка в поле \`kwargs\`. Это надёжнее \`args\`: при изменении сигнатуры задачи именованные аргументы не сломают уже запланированные вызовы.

**Timezone на уровне расписания.** \`CrontabSchedule.timezone\` принимает строку в формате IANA (Europe/Moscow). Beat выполнит задачу в корректный локальный момент времени независимо от timezone сервера. Валидируйте timezone через \`zoneinfo.ZoneInfo\` — это встроенный модуль Python 3.9+.`,
    },

    {
        id: "django-idempotent-tasks",
        title: "Idempotent задачи и exactly-once обработка",
        task: `Вам нужно реализовать списание баллов с баланса пользователя в фоновой задаче. Задача может быть выполнена несколько раз из-за retry. Реализуйте идемпотентность через: уникальный ключ задачи (idempotency key), distributed lock через Redis, транзакционный outbox pattern. Покажите разницу между at-least-once и exactly-once семантикой.`,
        files: [
            {
                filename: "billing/models.py",
                code: `import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.PositiveIntegerField(default=0)  # баллы, целое число

    def __str__(self):
        return f"{self.user}: {self.balance} pts"


class DeductionRecord(models.Model):
    """
    Таблица выполненных списаний. Уникальный idempotency_key гарантирует,
    что одно и то же списание не будет применено дважды даже при retry.
    Это и есть exactly-once семантика на уровне БД.
    """
    idempotency_key = models.UUIDField(unique=True, db_index=True)
    wallet = models.ForeignKey(Wallet, on_delete=models.PROTECT, related_name="deductions")
    amount = models.PositiveIntegerField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)


class OutboxEvent(models.Model):
    """
    Transactional Outbox: событие записывается в той же транзакции,
    что и само списание. Отдельный worker читает и публикует события.
    Гарантирует, что событие не потеряется если брокер недоступен.
    """
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидает"
        SENT = "sent", "Отправлено"

    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
`,
            },
            {
                filename: "billing/deduction.py",
                code: `"""
Три уровня защиты от двойного списания:

1. Idempotency key + уникальный индекс в БД (DeductionRecord)
   → exactly-once: повторный вызов с тем же ключом — no-op
2. Distributed lock через Redis
   → защита от параллельных вызовов до момента записи в БД
3. Transactional outbox
   → событие публикуется только если транзакция закоммичена
"""
import uuid
import logging
from contextlib import contextmanager

import redis
from django.conf import settings
from django.db import transaction, IntegrityError

logger = logging.getLogger(__name__)


def _redis() -> redis.Redis:
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


@contextmanager
def distributed_lock(key: str, timeout: int = 30):
    """
    SET NX EX — атомарная операция Redis.
    Если ключ уже существует — другой воркер держит блокировку.
    """
    r = _redis()
    lock_key = f"lock:{key}"
    acquired = r.set(lock_key, "1", nx=True, ex=timeout)
    if not acquired:
        raise RuntimeError(f"Could not acquire lock for {key}")
    try:
        yield
    finally:
        r.delete(lock_key)


def deduct_points(
    wallet_id: int,
    amount: int,
    reason: str,
    idempotency_key: uuid.UUID,
) -> bool:
    """
    Списывает баллы идемпотентно.
    Возвращает True если списание выполнено, False если уже было выполнено ранее.
    Бросает ValueError при недостатке баланса.
    """
    from .models import Wallet, DeductionRecord, OutboxEvent

    # Шаг 1: быстрая проверка без лока — если запись уже есть, выходим
    if DeductionRecord.objects.filter(idempotency_key=idempotency_key).exists():
        logger.info("Deduction %s already applied, skipping.", idempotency_key)
        return False

    # Шаг 2: распределённая блокировка — защищаем от race condition
    with distributed_lock(f"wallet:{wallet_id}"):
        try:
            with transaction.atomic():
                wallet = Wallet.objects.select_for_update().get(pk=wallet_id)

                if wallet.balance < amount:
                    raise ValueError(
                        f"Insufficient balance: {wallet.balance} < {amount}"
                    )

                wallet.balance -= amount
                wallet.save(update_fields=["balance"])

                # Запись-маркер — уникальный индекс предотвращает дубль
                DeductionRecord.objects.create(
                    idempotency_key=idempotency_key,
                    wallet=wallet,
                    amount=amount,
                    reason=reason,
                )

                # Outbox-событие в той же транзакции
                OutboxEvent.objects.create(
                    event_type="points.deducted",
                    payload={
                        "wallet_id": wallet_id,
                        "amount": amount,
                        "reason": reason,
                        "idempotency_key": str(idempotency_key),
                    },
                )

        except IntegrityError:
            # Гонка: параллельный вызов успел записать DeductionRecord первым
            logger.info("Deduction %s lost race, skipping.", idempotency_key)
            return False

    return True
`,
            },
            {
                filename: "billing/tasks.py",
                code: `"""
At-least-once семантика Celery + идемпотентная логика = exactly-once эффект.

Celery гарантирует at-least-once: задача выполнится минимум один раз,
но при сбое или retry — возможно несколько раз.
Idempotency key на уровне БД превращает это в exactly-once:
повторный вызов с тем же ключом — безопасный no-op.
"""
import uuid
from celery import shared_task

from .deduction import deduct_points


@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=60,
    # acks_late=True: задача подтверждается брокеру только после успешного выполнения.
    # При сбое воркера — задача вернётся в очередь (at-least-once).
    acks_late=True,
)
def deduct_points_task(
    self,
    wallet_id: int,
    amount: int,
    reason: str,
    idempotency_key: str,  # UUID передаётся как строка (JSON-совместимо)
) -> None:
    try:
        applied = deduct_points(
            wallet_id=wallet_id,
            amount=amount,
            reason=reason,
            idempotency_key=uuid.UUID(idempotency_key),
        )
        if not applied:
            # Уже выполнено — завершаем без ошибки, не retry
            return
    except ValueError as exc:
        # Бизнес-ошибка (недостаток баланса) — не retry
        raise
    except Exception as exc:
        # Техническая ошибка (БД недоступна, Redis упал) — retry
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Использование: вызов из view или другой задачи
# ---------------------------------------------------------------------------

def schedule_deduction(wallet_id: int, amount: int, reason: str) -> str:
    """
    Генерирует idempotency_key и ставит задачу в очередь.
    Ключ должен генерироваться на стороне вызывающего кода,
    а не внутри задачи — иначе каждый retry получит новый ключ.
    """
    key = str(uuid.uuid4())
    deduct_points_task.delay(
        wallet_id=wallet_id,
        amount=amount,
        reason=reason,
        idempotency_key=key,
    )
    return key
`,
            },
            {
                filename: "billing/outbox_worker.py",
                code: `"""
Outbox worker: читает неотправленные события и публикует их в брокер.
Запускается как отдельный процесс или периодическая Celery-задача.

Паттерн Transactional Outbox решает проблему dual write:
без outbox возможна ситуация когда транзакция закоммичена,
но событие в брокер не отправлено (сервер упал между двумя операциями).
"""
from celery import shared_task
from .models import OutboxEvent


@shared_task
def publish_outbox_events() -> int:
    pending = OutboxEvent.objects.filter(status=OutboxEvent.Status.PENDING).order_by("created_at")[:100]
    published = 0

    for event in pending:
        try:
            _publish_to_broker(event.event_type, event.payload)
            event.status = OutboxEvent.Status.SENT
            event.save(update_fields=["status"])
            published += 1
        except Exception:
            # Оставляем PENDING — следующий запуск повторит попытку
            pass

    return published


def _publish_to_broker(event_type: str, payload: dict) -> None:
    # В реальном проекте: kafka-producer, pika (RabbitMQ), boto3 SNS и т.д.
    pass
`,
            },
        ],
        explanation: `**At-least-once vs exactly-once.** Celery (и большинство брокеров) гарантируют at-least-once: задача выполнится минимум один раз, но при сбое — возможно несколько. Exactly-once на уровне брокера технически сложно и дорого. Практичное решение: сделать обработчик идемпотентным — повторный вызов с теми же данными даёт тот же результат без побочных эффектов.

**Три уровня защиты.** Быстрая проверка \`exists()\` до лока — для случаев, когда retry очевиден и не нужно занимать Redis. Distributed lock — защита от параллельных вызовов с одним ключом до момента записи в БД. Уникальный индекс + \`IntegrityError\` — финальная страховка: даже если оба воркера прошли через lock (теоретически возможно при истечении TTL), БД не позволит записать дубль.

**\`select_for_update()\` внутри транзакции.** Блокирует строку кошелька на уровне БД — предотвращает race condition при параллельном изменении баланса из разных транзакций. Работает в паре с \`transaction.atomic()\`.

**Idempotency key генерируется на стороне вызывающего.** Если генерировать ключ внутри задачи — каждый retry создаст новый UUID и идемпотентность не сработает. Ключ должен быть стабильным идентификатором конкретной операции (UUID от вызывающего кода, или deterministic hash от параметров).

**Transactional Outbox.** Без outbox есть окно между коммитом транзакции и отправкой события в брокер — сервер может упасть в этот момент, событие потеряется. Запись \`OutboxEvent\` в той же транзакции, что и изменение баланса, гарантирует атомарность: либо оба есть, либо ни одного. Отдельный worker публикует события с retry.`,
    },

    {
        id: "django-channels-websocket",
        title: "WebSocket и Django Channels",
        task: `Реализуйте real-time уведомления с использованием Django Channels. Требования: пользователь подключается к персональному WebSocket-каналу, при возникновении события в системе (новый заказ, изменение статуса) — получает push-уведомление, поддержка масштабирования через Redis channel layer, graceful reconnect на клиенте, аутентификация WebSocket-соединения.`,
        files: [
            {
                filename: "notifications/consumers.py",
                code: `"""
NotificationConsumer — персональный WebSocket-канал пользователя.

Группа: "user_{user_id}" — уникальная для каждого пользователя.
Один пользователь может иметь несколько соединений (разные вкладки/устройства):
все они подписаны на одну группу и получат одно и то же сообщение.
"""
import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):

    @property
    def group_name(self) -> str:
        return f"user_{self.scope['user'].id}"

    async def connect(self):
        user = self.scope.get("user")

        # AnonymousUser не аутентифицирован — закрываем соединение
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info("WS connected: user=%d channel=%s", user.id, self.channel_name)

        # Отправляем подтверждение подключения
        await self.send_json({"type": "connected", "user_id": user.id})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info("WS disconnected: code=%d channel=%s", close_code, self.channel_name)

    # WebSocket → сервер (клиент что-то отправил)
    async def receive(self, text_data=None, bytes_data=None):
        # Пинг от клиента для поддержания соединения
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            return
        if data.get("type") == "ping":
            await self.send_json({"type": "pong"})

    # Channel Layer → этот consumer (событие из группы)
    async def notification_message(self, event: dict):
        """
        Вызывается channel layer когда кто-то отправит в группу
        сообщение с type="notification.message".
        Django Channels маппит "." → "_" при поиске метода.
        """
        await self.send_json(event["data"])

    async def send_json(self, data: dict):
        await self.send(text_data=json.dumps(data, ensure_ascii=False))
`,
            },
            {
                filename: "notifications/middleware.py",
                code: `"""
WebSocket-аутентификация через JWT в query string.
HTTP Cookie недоступны напрямую в WS handshake в некоторых браузерах,
поэтому токен передаётся как ?token=<access_token>.

Пример подключения: ws://example.com/ws/notifications/?token=eyJ...
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_token(token: str):
    """Валидирует JWT и возвращает пользователя или AnonymousUser."""
    try:
        import jwt
        from django.conf import settings
        from django.contrib.auth import get_user_model

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        User = get_user_model()
        return User.objects.get(pk=payload["sub"])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
`,
            },
            {
                filename: "notifications/sender.py",
                code: `"""
API для отправки уведомлений из любого места в проекте.
Работает из sync и async кода.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def notify_user(user_id: int, notification_type: str, data: dict) -> None:
    """
    Sync-обёртка: отправляет уведомление пользователю через channel layer.
    Вызывается из Django views, Celery tasks, signals — везде.
    """
    channel_layer = get_channel_layer()
    group_name = f"user_{user_id}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "notification.message",   # → метод notification_message в consumer
            "data": {
                "type": notification_type,
                **data,
            },
        },
    )


# ---------------------------------------------------------------------------
# Примеры использования из разных частей проекта
# ---------------------------------------------------------------------------

def notify_order_status_changed(order) -> None:
    notify_user(
        user_id=order.user_id,
        notification_type="order.status_changed",
        data={"order_id": order.pk, "status": order.status},
    )


def notify_points_deducted(user_id: int, amount: int) -> None:
    notify_user(
        user_id=user_id,
        notification_type="points.deducted",
        data={"amount": amount},
    )
`,
            },
            {
                filename: "config/routing.py",
                code: `from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from notifications.consumers import NotificationConsumer
from notifications.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "websocket": JWTAuthMiddleware(
        URLRouter([
            path("ws/notifications/", NotificationConsumer.as_asgi()),
        ])
    ),
})
`,
            },
            {
                filename: "frontend/notifications.js",
                code: `/**
 * WebSocket-клиент с exponential backoff reconnect.
 * Graceful reconnect: при разрыве соединения повторяет попытки
 * с нарастающей задержкой (1s → 2s → 4s → ... → max 30s).
 */
class NotificationSocket {
    constructor(token, onMessage) {
        this.token = token;
        this.onMessage = onMessage;
        this.retryDelay = 1000;
        this.maxDelay = 30000;
        this.shouldReconnect = true;
        this.connect();
    }

    connect() {
        const url = \`wss://\${location.host}/ws/notifications/?token=\${this.token}\`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("WS connected");
            this.retryDelay = 1000; // сбрасываем задержку при успешном подключении
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "pong") return; // игнорируем служебные сообщения
            this.onMessage(data);
        };

        this.ws.onclose = (event) => {
            if (!this.shouldReconnect) return;
            if (event.code === 4001) {
                console.error("WS auth failed, not reconnecting");
                return;
            }
            console.log(\`WS closed, reconnecting in \${this.retryDelay}ms\`);
            setTimeout(() => this.connect(), this.retryDelay);
            this.retryDelay = Math.min(this.retryDelay * 2, this.maxDelay);
        };

        // Heartbeat: предотвращаем разрыв соединения прокси/балансировщиком
        this.pingInterval = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 25000);
    }

    disconnect() {
        this.shouldReconnect = false;
        clearInterval(this.pingInterval);
        this.ws.close();
    }
}

// Использование:
// const ns = new NotificationSocket(accessToken, (msg) => {
//     console.log("Notification:", msg);
// });
`,
            },
            {
                filename: "settings.py (фрагмент)",
                code: `INSTALLED_APPS = [
    ...
    "channels",
    "notifications",
]

# ASGI application — указываем routing с WebSocket поддержкой
ASGI_APPLICATION = "config.routing.application"

# Channel Layer: Redis для масштабирования между воркерами
# Без Redis channel layer работает in-memory — только в одном процессе
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("localhost", 6379)],
            "capacity": 1500,       # максимум сообщений в очереди группы
            "expiry": 10,           # секунды хранения сообщения в channel layer
        },
    }
}
`,
            },
        ],
        explanation: `**Channel Layer и Redis для масштабирования.** In-memory channel layer (по умолчанию) работает только в рамках одного процесса — при горизонтальном масштабировании (несколько Daphne/Uvicorn воркеров) пользователи на разных воркерах не получат сообщения. Redis channel layer является общей шиной: \`group_send\` публикует в Redis, все воркеры подписаны и доставляют в свои соединения.

**Группы вместо прямых каналов.** Один пользователь может иметь несколько активных соединений (разные вкладки, мобильное устройство). Отправка в группу \`user_{id}\` автоматически доставит уведомление во все соединения. \`channel_name\` уникален для каждого соединения — не используйте его напрямую для нотификаций.

**Маппинг \`type\` → метод.** Django Channels преобразует точки в underscores: сообщение с \`type: "notification.message"\` → вызов метода \`notification_message\`. Это соглашение важно соблюдать точно.

**JWT в query string.** Это стандартная практика для WS-аутентификации когда cookie недоступны (CORS, мобильные клиенты). Access-токен имеет короткий TTL (15 мин), поэтому риск ограничен. Альтернатива — первый message после connect с токеном, но это усложняет клиент.

**Graceful reconnect с exponential backoff.** При разрыве клиент ждёт 1s → 2s → 4s → ... → 30s перед следующей попыткой. Это предотвращает thundering herd: если сервер перезапустился, тысячи клиентов не обрушат его одновременными reconnect-ами. Код \`4001\` (auth failed) — специальный: reconnect бессмысленен, токен не изменится.`,
    },

    {
        id: "django-multilevel-cache",
        title: "Многоуровневое кэширование",
        task: `Реализуйте многоуровневую стратегию кэширования для страницы каталога товаров: L1 — in-process cache (locmem) для frequently accessed данных, L2 — Redis для shared cache между воркерами, cache invalidation при изменении товара или его категории, поддержка vary by: язык, валюта, пользовательский сегмент. Используйте паттерн Cache-Aside.`,
        files: [
            {
                filename: "core/cache.py",
                code: `"""
Двухуровневый кэш: L1 (locmem, in-process) + L2 (Redis, shared).

Cache-Aside паттерн:
  1. Читаем из L1 → если есть, возвращаем
  2. Читаем из L2 → если есть, пишем в L1, возвращаем
  3. Читаем из источника → пишем в L2 и L1, возвращаем

Запись происходит только при cache miss — данные загружаются «лениво».
Invalidation: удаляем из обоих уровней по ключу или по тегу.
"""
import hashlib
import json
from typing import Any, Callable

from django.core.cache import caches


def _l1():
    return caches["l1"]   # django.core.cache.backends.locmem.LocMemCache


def _l2():
    return caches["l2"]   # django_redis (Redis)


class TwoLevelCache:
    """
    Обёртка над L1/L2 с поддержкой тегов для групповой инвалидации.
    Теги хранятся в Redis как Sorted Set; версия тега инкрементируется
    при инвалидации, что делает старые ключи «несвежими».
    """

    L1_TTL = 60          # секунды (короткий — L1 обновляется чаще)
    L2_TTL = 600         # секунды

    def get_or_set(
        self,
        key: str,
        loader: Callable[[], Any],
        tags: list[str] | None = None,
        l2_ttl: int | None = None,
    ) -> Any:
        versioned_key = self._versioned_key(key, tags or [])

        # L1 hit
        value = _l1().get(versioned_key)
        if value is not None:
            return value

        # L2 hit → прогреваем L1
        value = _l2().get(versioned_key)
        if value is not None:
            _l1().set(versioned_key, value, self.L1_TTL)
            return value

        # Miss → загружаем из источника
        value = loader()
        ttl = l2_ttl or self.L2_TTL
        _l2().set(versioned_key, value, ttl)
        _l1().set(versioned_key, value, self.L1_TTL)
        return value

    def invalidate(self, key: str, tags: list[str] | None = None) -> None:
        versioned_key = self._versioned_key(key, tags or [])
        _l1().delete(versioned_key)
        _l2().delete(versioned_key)

    def invalidate_tag(self, tag: str) -> None:
        """
        Инкрементируем версию тега → все ключи с этим тегом становятся stale.
        Это O(1) вместо перебора всех ключей с префиксом.
        """
        _l2().incr(f"tag_version:{tag}", 1)
        # L1 устареет сам через L1_TTL секунд — это допустимая eventual consistency

    def _versioned_key(self, key: str, tags: list[str]) -> str:
        if not tags:
            return key
        # Получаем версии всех тегов одним pipeline-запросом
        r2 = _l2()
        versions = [r2.get(f"tag_version:{t}") or "0" for t in tags]
        tag_hash = hashlib.md5(":".join(versions).encode()).hexdigest()[:8]
        return f"{key}:v{tag_hash}"


cache = TwoLevelCache()
`,
            },
            {
                filename: "catalog/cache_keys.py",
                code: `"""
Централизованное определение ключей кэша и vary-параметров.
Все ключи в одном месте — легко найти и инвалидировать.
"""


def catalog_page_key(page: int, lang: str, currency: str, segment: str) -> str:
    """
    Vary by: язык, валюта, сегмент пользователя.
    Разные сегменты видят разные цены/акции — нельзя отдавать один кэш.
    """
    return f"catalog:page:{page}:{lang}:{currency}:{segment}"


def product_key(product_id: int, lang: str) -> str:
    return f"product:{product_id}:{lang}"


def product_tags(product_id: int, category_id: int) -> list[str]:
    """Теги для инвалидации: при изменении товара или категории."""
    return [f"product:{product_id}", f"category:{category_id}"]


def category_tag(category_id: int) -> str:
    return f"category:{category_id}"
`,
            },
            {
                filename: "catalog/views.py",
                code: `from django.http import JsonResponse
from django.views import View

from core.cache import cache
from .cache_keys import catalog_page_key, product_tags
from .serializers import serialize_catalog_page


def _get_user_segment(user) -> str:
    """Определяем сегмент пользователя для vary-кэша."""
    if not user.is_authenticated:
        return "anonymous"
    return getattr(user, "plan", "free")


class CatalogView(View):
    def get(self, request):
        page = int(request.GET.get("page", 1))
        lang = request.LANGUAGE_CODE          # django i18n
        currency = request.GET.get("currency", "RUB")
        segment = _get_user_segment(request.user)

        key = catalog_page_key(page, lang, currency, segment)

        data = cache.get_or_set(
            key=key,
            loader=lambda: serialize_catalog_page(page, lang, currency, segment),
            tags=["catalog"],        # инвалидируется при любом изменении каталога
            l2_ttl=300,
        )
        return JsonResponse(data)


class ProductDetailView(View):
    def get(self, request, product_id: int):
        from .models import Product
        lang = request.LANGUAGE_CODE
        product = Product.objects.select_related("category").get(pk=product_id)

        key = f"product:{product_id}:{lang}"
        data = cache.get_or_set(
            key=key,
            loader=lambda: _serialize_product(product, lang),
            tags=product_tags(product_id, product.category_id),
        )
        return JsonResponse(data)


def _serialize_product(product, lang: str) -> dict:
    return {
        "id": product.pk,
        "name": product.name,
        "price": str(product.price),
        "category": product.category.name,
    }
`,
            },
            {
                filename: "catalog/signals.py",
                code: `from django.db.models.signals import post_save
from django.dispatch import receiver

from core.cache import cache
from .cache_keys import category_tag
from .models import Product, Category


@receiver(post_save, sender=Product)
def on_product_saved(sender, instance, **kwargs):
    # Инвалидируем конкретный товар и каталог целиком
    cache.invalidate_tag(f"product:{instance.pk}")
    cache.invalidate_tag("catalog")


@receiver(post_save, sender=Category)
def on_category_saved(sender, instance, **kwargs):
    # Инвалидируем все товары категории через тег
    cache.invalidate_tag(category_tag(instance.pk))
    cache.invalidate_tag("catalog")
`,
            },
            {
                filename: "settings.py (фрагмент)",
                code: `CACHES = {
    # L1: in-process, per-worker, мгновенный доступ
    "l1": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "l1-catalog",
    },
    # L2: Redis, shared между всеми воркерами
    "l2": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://localhost:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SERIALIZER": "django_redis.serializers.json.JSONSerializer",
        },
    },
    # Django default cache (используется встроенными механизмами: sessions и т.д.)
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://localhost:6379/0",
    },
}
`,
            },
        ],
        explanation: `**L1 (locmem) — зачем нужен если есть Redis.** Redis — сетевой вызов (~0.5–2ms). Locmem — обращение к словарю в памяти (~microseconds). При высокой нагрузке разница существенна: тысячи запросов в секунду к одним и тем же ключам создают значительный трафик к Redis. L1 снимает нагрузку с Redis для «горячих» ключей. Компромисс: L1 изолирован в рамках одного воркера — при инвалидации через Redis, L1 устареет только через свой TTL (60s). Это eventual consistency — допустимо для каталога товаров.

**Инвалидация по тегам через версионирование.** Хранить список всех ключей для тега накладно и ненадёжно. Вместо этого версия тега — одно число в Redis. Все ключи включают хеш версий своих тегов. При инвалидации тега инкрементируем его версию — все ключи со старым хешем станут промахами (cache miss), данные перезагрузятся при следующем запросе. Это O(1) операция независимо от количества ключей под тегом.

**Vary by — обязательно для персонализированного контента.** Без vary разные пользователи получат один и тот же кэшированный ответ. Пользователь с планом \`pro\` увидит цены сегмента \`free\` — это критическая ошибка. Vary-параметры формируют разные ключи: \`catalog:page:1:ru:RUB:pro\` ≠ \`catalog:page:1:ru:RUB:free\`.

**Cache-Aside vs Write-Through.** Cache-Aside (используем здесь): кэш заполняется только при miss, данные загружаются лениво. Write-Through: данные пишутся в кэш синхронно при каждом обновлении в БД. Cache-Aside проще и устойчивее к холодному старту; Write-Through даёт более свежие данные, но усложняет логику записи.`,
    },

    {
        id: "django-query-caching",
        title: "Кэширование запросов к БД (Query caching)",
        task: `Реализуйте кэширование на уровне QuerySet с автоматической инвалидацией. При изменении любой записи Product должен инвалидироваться кэш всех запросов, которые эту запись возвращали. Рассмотрите использование django-cachalot или реализуйте свой механизм через signals + cache tags. Обозначьте риски staleness.`,
        files: [
            {
                filename: "core/query_cache.py",
                code: `"""
Кэширование QuerySet через cache tags без django-cachalot.

Идея: каждый кэшированный результат помечается тегами моделей,
данные которых в него вошли. При изменении модели инкрементируем
версию тега → все ключи с этим тегом становятся stale (cache miss).

Это тот же подход что в TwoLevelCache, но заточенный под QuerySet.
"""
import hashlib
import pickle
from typing import Any

from django.core.cache import cache
from django.db import models


def _tag_version_key(model: type) -> str:
    return f"qc:tag:{model._meta.label_lower}"


def _get_tag_version(model: type) -> str:
    return cache.get(_tag_version_key(model)) or "0"


def invalidate_model(model: type) -> None:
    """
    Инвалидирует все кэшированные запросы, затрагивающие данную модель.
    Вызывается из сигнала post_save / post_delete.
    """
    key = _tag_version_key(model)
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=None)


def _build_cache_key(qs: models.QuerySet, models_involved: list[type]) -> str:
    """
    Ключ: SQL-запрос + параметры + версии всех моделей.
    При инвалидации любой модели версия меняется → новый ключ → miss.
    """
    sql, params = qs.query.sql_with_params()
    versions = ":".join(_get_tag_version(m) for m in models_involved)
    raw = f"{sql}:{params}:{versions}"
    return "qc:" + hashlib.sha256(raw.encode()).hexdigest()[:16]


def cached_qs(
    qs: models.QuerySet,
    models_involved: list[type],
    timeout: int = 300,
) -> list[Any]:
    """
    Выполняет QuerySet и кэширует результат.
    При изменении любой из models_involved кэш инвалидируется.

    Пример:
        results = cached_qs(
            Product.objects.filter(is_active=True).select_related("category"),
            models_involved=[Product, Category],
            timeout=60,
        )
    """
    key = _build_cache_key(qs, models_involved)
    cached = cache.get(key)
    if cached is not None:
        return cached

    result = list(qs)          # материализуем QuerySet
    cache.set(key, result, timeout)
    return result
`,
            },
            {
                filename: "catalog/signals.py",
                code: `"""
Сигналы для автоматической инвалидации кэша QuerySet.

post_save и post_delete покрывают все изменения через Django ORM.
Массовые операции (queryset.update(), queryset.delete()) сигналы
НЕ посылают — это главный риск staleness.
"""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from core.query_cache import invalidate_model
from .models import Category, Product


@receiver([post_save, post_delete], sender=Product)
def on_product_change(sender, **kwargs):
    invalidate_model(Product)


@receiver([post_save, post_delete], sender=Category)
def on_category_change(sender, **kwargs):
    invalidate_model(Category)
`,
            },
            {
                filename: "catalog/views.py",
                code: `from django.http import JsonResponse
from django.views import View

from core.query_cache import cached_qs
from .models import Category, Product


class ActiveProductsView(View):
    def get(self, request):
        # Запрос кэшируется; инвалидируется при изменении Product или Category
        products = cached_qs(
            Product.objects.filter(is_active=True)
                           .select_related("category")
                           .order_by("-created_at"),
            models_involved=[Product, Category],
            timeout=120,
        )
        data = [
            {
                "id": p.pk,
                "name": p.name,
                "category": p.category.name,
                "price": str(p.price),
            }
            for p in products
        ]
        return JsonResponse({"products": data})
`,
            },
            {
                filename: "django_cachalot_alternative.md",
                code: `# django-cachalot: встроенное автоматическое кэширование QuerySet

## Что делает
Патчит Django ORM: перехватывает все SELECT-запросы, кэширует результат,
инвалидирует при любом INSERT/UPDATE/DELETE к затронутым таблицам.
Работает прозрачно — изменений в коде запросов не требуется.

## Подключение
\`\`\`python
# settings.py
INSTALLED_APPS += ["cachalot"]
CACHALOT_CACHE = "default"   # Redis cache backend
CACHALOT_TIMEOUT = 300
\`\`\`

## Плюсы
- Нулевые изменения в коде запросов
- Инвалидирует даже при queryset.update() и bulk_create()
  (перехватывает на уровне SQL compiler, а не сигналов)
- Поддерживает multi-db, READ COMMITTED, транзакции

## Минусы и риски staleness
- Не кэширует запросы с \`RawSQL\`, \`extra()\`, курсорами —
  изменения через raw SQL не триггерят инвалидацию
- При использовании нескольких БД нужна точная настройка
  \`CACHALOT_DATABASES\`
- Большие QuerySet могут занять много памяти в кэше

## Риски staleness при ручной реализации (signals)
1. \`queryset.update()\` — не посылает post_save → кэш не инвалидируется
2. \`queryset.delete()\` — не посылает post_delete для каждого объекта
3. Прямой SQL через \`connection.execute()\` — Django не знает об изменении
4. Внешние процессы, пишущие в ту же БД (скрипты, другие сервисы)

## Рекомендация
Для простых случаев (только ORM, нет raw SQL) — django-cachalot.
Для сложных сценариев (несколько источников записи, custom SQL) —
ручная инвалидация через cache tags с явными вызовами \`invalidate_model()\`.
`,
            },
        ],
        explanation: `**Версионирование тегов вместо перебора ключей.** Хранить список всех кэш-ключей для модели ненадёжно — при падении Redis список теряется. Вместо этого версия модели — одно число. Кэш-ключ включает хеш версий всех задействованных моделей. При инвалидации \`cache.incr\` делает все старые ключи недостижимыми — следующий запрос к ним будет cache miss, данные перезагрузятся.

**Главный риск: массовые операции минуют сигналы.** \`Product.objects.filter(...).update(price=F("price") * 1.1)\` выполняет SQL UPDATE напрямую, минуя \`post_save\`. Это означает: кэш не инвалидируется, пользователи видят старые цены до истечения TTL. Это фундаментальное ограничение подхода на сигналах. \`django-cachalot\` решает это, перехватывая SQL на уровне компилятора.

**django-cachalot vs ручная реализация.** Cachalot прозрачен — не нужно менять код запросов, он корректно обрабатывает \`update()\` и \`bulk_create()\`. Минус: магия под капотом усложняет отладку и не работает с raw SQL. Ручная реализация прозрачнее и предсказуемее, но требует явных вызовов инвалидации везде.

**TTL как последняя линия обороны.** Даже при ручной реализации TTL ограничивает максимальное время staleness. Для критичных данных (цены, остатки) — короткий TTL (30–60s) или отключение кэша. Для стабильных данных (категории, теги) — длинный TTL (10–30 мин).

**Материализация QuerySet обязательна перед кэшированием.** \`list(qs)\` выполняет SQL и возвращает список Python-объектов. Кэширование самого QuerySet объекта бессмысленно — он lazy и выполнит запрос при следующем обращении.`,
    },

    {
        id: "django-profiling",
        title: "Профилирование и оптимизация",
        task: `Вам передали Django-приложение с жалобами на медленную работу. Опишите и реализуйте полный цикл профилирования: использование django-debug-toolbar и django-silk в dev, py-spy или cProfile в production, анализ медленных SQL-запросов через EXPLAIN ANALYZE, настройка алертов на медленные запросы. По результатам анализа — оптимизируйте найденное узкое место.`,
        files: [
            {
                filename: "config/settings_dev.py",
                code: `"""
Dev-настройки для профилирования.
Никогда не включайте debug toolbar и silk в production.
"""
from .settings import *

DEBUG = True

# ---------------------------------------------------------------------------
# django-debug-toolbar: SQL, время выполнения view, cache hits, signals
# ---------------------------------------------------------------------------
INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

# Toolbar показывается только для этих IP
INTERNAL_IPS = ["127.0.0.1", "::1"]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
    "RESULTS_CACHE_SIZE": 100,
}

# ---------------------------------------------------------------------------
# django-silk: детальное профилирование запросов с историей
# ---------------------------------------------------------------------------
INSTALLED_APPS += ["silk"]
MIDDLEWARE += ["silk.middleware.SilkyMiddleware"]

SILKY_PYTHON_PROFILER = True          # включает cProfile для каждого запроса
SILKY_PYTHON_PROFILER_BINARY = False  # True для .prof файла (SnakeViz)
SILKY_MAX_RECORDED_REQUESTS = 1000
SILKY_INTERCEPT_PERCENT = 100         # 100% в dev, 5–10% в staging

# Логируем медленные SQL-запросы
SILKY_ANALYZE_QUERIES = True
SILKY_MAX_RESPONSE_BODY_SIZE = 1024   # bytes

# Slow query log: запросы длиннее 100ms попадают в лог
LOGGING = {
    "version": 1,
    "handlers": {
        "slow_queries": {
            "class": "logging.FileHandler",
            "filename": "logs/slow_queries.log",
        }
    },
    "loggers": {
        "django.db.backends": {
            "handlers": ["slow_queries"],
            "level": "DEBUG",
        }
    },
}
`,
            },
            {
                filename: "core/middleware.py",
                code: `"""
Middleware для алертов на медленные запросы в production.
Не зависит от debug toolbar / silk — работает в любом окружении.
"""
import logging
import time

from django.conf import settings

logger = logging.getLogger("performance")

SLOW_REQUEST_THRESHOLD_MS = getattr(settings, "SLOW_REQUEST_THRESHOLD_MS", 500)
VERY_SLOW_REQUEST_THRESHOLD_MS = getattr(settings, "VERY_SLOW_REQUEST_THRESHOLD_MS", 2000)


class SlowRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        if elapsed_ms >= SLOW_REQUEST_THRESHOLD_MS:
            level = logging.WARNING if elapsed_ms < VERY_SLOW_REQUEST_THRESHOLD_MS else logging.ERROR
            logger.log(
                level,
                "Slow request: %s %s — %.0fms | status=%d | user=%s",
                request.method,
                request.path,
                elapsed_ms,
                response.status_code,
                getattr(request.user, "id", "anon"),
            )

        # Добавляем заголовок для observability (снимается на балансировщике)
        response["X-Response-Time-Ms"] = f"{elapsed_ms:.0f}"
        return response
`,
            },
            {
                filename: "core/profiling.py",
                code: `"""
Утилиты профилирования для production.

py-spy — sampling profiler, не требует изменения кода:
  sudo py-spy top --pid <PID>                    # realtime top
  sudo py-spy record -o profile.svg --pid <PID>  # flamegraph

cProfile — deterministic profiler, используйте для конкретных функций:
"""
import cProfile
import functools
import io
import logging
import pstats
from contextlib import contextmanager

logger = logging.getLogger("performance")


@contextmanager
def profile_block(name: str, top_n: int = 20):
    """
    Context manager для профилирования произвольного блока кода.

    with profile_block("expensive_operation"):
        result = compute_something()
    """
    pr = cProfile.Profile()
    pr.enable()
    try:
        yield
    finally:
        pr.disable()
        stream = io.StringIO()
        ps = pstats.Stats(pr, stream=stream).sort_stats("cumulative")
        ps.print_stats(top_n)
        logger.info("Profile [%s]:\\n%s", name, stream.getvalue())


def profile_view(view_func):
    """
    Декоратор для профилирования Django view.
    Используйте только временно — в production оставляет значительный overhead.
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        with profile_block(f"view:{view_func.__name__}"):
            return view_func(request, *args, **kwargs)
    return wrapper
`,
            },
            {
                filename: "catalog/views_before.py",
                code: `"""
БЫЛО: типичный N+1 query problem.
Для 100 товаров → 1 запрос products + 100 запросов category + 100 запросов images.
django-debug-toolbar покажет 201 SQL-запрос на одну страницу.
"""
from django.http import JsonResponse
from django.views import View
from .models import Product


class ProductListBefore(View):
    def get(self, request):
        products = Product.objects.filter(is_active=True)[:100]
        data = []
        for product in products:
            data.append({
                "id": product.pk,
                "name": product.name,
                "category": product.category.name,     # SELECT category WHERE id=?  ← N+1
                "images": [                             # SELECT images WHERE product_id=?  ← N+1
                    img.url for img in product.images.all()
                ],
            })
        return JsonResponse({"products": data})
`,
            },
            {
                filename: "catalog/views_after.py",
                code: `"""
СТАЛО: select_related + prefetch_related устраняют N+1.
3 запроса вместо 201, независимо от количества товаров.

EXPLAIN ANALYZE покажет:
  Seq Scan → Index Scan после добавления индекса на is_active
  Hash Join для category вместо вложенных loops
"""
from django.db import connection
from django.http import JsonResponse
from django.views import View

from .models import Product


class ProductListAfter(View):
    def get(self, request):
        products = (
            Product.objects
            .filter(is_active=True)
            .select_related("category")         # JOIN category — 0 доп. запросов
            .prefetch_related("images")         # 1 запрос для всех images
            .only("id", "name", "price",        # не грузим лишние поля
                  "category__id", "category__name")
            [:100]
        )

        data = [
            {
                "id": p.pk,
                "name": p.name,
                "category": p.category.name,
                "images": [img.url for img in p.images.all()],  # из prefetch
            }
            for p in products
        ]
        return JsonResponse({"products": data})


# ---------------------------------------------------------------------------
# Анализ конкретного медленного запроса через EXPLAIN ANALYZE
# ---------------------------------------------------------------------------

def explain_slow_query() -> str:
    """
    Пример: анализируем запрос, на который жалуются пользователи.
    Запускайте в Django shell или management command, не в production view.
    """
    slow_sql = """
        SELECT p.*, c.name as category_name
        FROM catalog_product p
        JOIN catalog_category c ON c.id = p.category_id
        WHERE p.is_active = true
          AND p.created_at > NOW() - INTERVAL '30 days'
        ORDER BY p.created_at DESC
        LIMIT 100
    """
    with connection.cursor() as cursor:
        cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) {slow_sql}")
        rows = cursor.fetchall()
    plan = "\\n".join(row[0] for row in rows)

    # Что искать в плане:
    # - "Seq Scan" на большой таблице → нужен индекс
    # - "Sort" с высоким cost → нужен индекс для ORDER BY
    # - "Nested Loop" вместо "Hash Join" при большом датасете → статистика устарела (ANALYZE)
    # - Buffers: hit >> read → данные в shared_buffers (хорошо)
    #            read >> hit → идём на диск (нужно больше RAM или индекс)
    return plan
`,
            },
        ],
        explanation: `**django-debug-toolbar для быстрого обнаружения N+1.** Панель SQL показывает все запросы, их время и стек вызовов. Красный счётчик дублирующихся запросов — главный сигнал N+1. Для view с 100 объектами без \`select_related\` вы увидите 101+ запрос. Это стартовая точка: определяем проблемный view, потом идём глубже.

**django-silk для истории и cProfile.** Silk сохраняет все запросы в БД — можно сравнивать время до/после оптимизации, смотреть на выбросы в конкретные часы. \`SILKY_PYTHON_PROFILER=True\` оборачивает каждый запрос в cProfile — появляется кнопка "View Profile" с детализацией по функциям. В staging используйте \`SILKY_INTERCEPT_PERCENT=10\` чтобы не замедлять всё.

**py-spy для production без изменений кода.** Sampling profiler: снимает стек трейс раз в N миллисекунд без остановки процесса. Команда \`py-spy record\` создаёт SVG flamegraph — визуально виден самый «широкий» блок. Не требует \`DEBUG=True\`, работает с любым Python-процессом по PID. Для Gunicorn — передайте PID конкретного воркера.

**EXPLAIN ANALYZE: что искать.** \`Seq Scan\` на таблице с миллионами строк при наличии WHERE — почти всегда означает отсутствие индекса. \`Sort\` с высоким cost — добавьте индекс на ORDER BY столбцы. \`Nested Loop\` вместо \`Hash Join\` при большом датасете — статистика устарела, нужен \`ANALYZE\`. \`Buffers: read\` (не \`hit\`) — данные читаются с диска, нужно больше \`shared_buffers\` или кэширование.

**select_related vs prefetch_related.** \`select_related\` — SQL JOIN, работает для ForeignKey и OneToOne, один запрос. \`prefetch_related\` — отдельный SELECT с \`WHERE id IN (...)\`, работает для ManyToMany и обратных FK, два запроса суммарно независимо от количества объектов. \`only()\` ограничивает набор загружаемых полей — сокращает трафик и время десериализации.`,
    },

    {
        id: "django-db-indexes",
        title: "Индексы и оптимизация схемы БД",
        task: `Для таблицы events (50M строк) с полями user_id, event_type, created_at, metadata (jsonb) реализуйте оптимальную стратегию индексирования для следующих запросов: события конкретного пользователя за период, события определённого типа с фильтром по metadata, количество уникальных пользователей по дням. Используйте partial indexes, composite indexes, GIN-индексы для JSONB.`,
        files: [
            {
                filename: "analytics/models.py",
                code: `from django.db import models
from django.contrib.postgres.indexes import GinIndex, BrinIndex


class Event(models.Model):
    user_id = models.BigIntegerField(db_index=False)  # индекс ниже — составной
    event_type = models.CharField(max_length=100)
    created_at = models.DateTimeField()
    metadata = models.JSONField(default=dict)

    class Meta:
        indexes = [
            # ----------------------------------------------------------------
            # Запрос 1: события конкретного пользователя за период
            # SELECT * FROM events WHERE user_id = ? AND created_at BETWEEN ? AND ?
            #
            # Составной индекс (user_id, created_at):
            # - user_id идёт первым: Index Scan по пользователю → диапазон по дате
            # - порядок важен: (created_at, user_id) был бы хуже для этого запроса
            # ----------------------------------------------------------------
            models.Index(
                fields=["user_id", "created_at"],
                name="event_user_date_idx",
            ),

            # ----------------------------------------------------------------
            # Запрос 2: события типа 'purchase' — partial index
            # SELECT * FROM events WHERE event_type = 'purchase' AND created_at > ?
            #
            # Partial index: индексируем только строки где event_type = 'purchase'.
            # Если 'purchase' — 5% от 50M строк, индекс в 20 раз меньше полного.
            # Менее частые типы (page_view — 80% строк) — partial index не выгоден.
            # ----------------------------------------------------------------
            models.Index(
                fields=["created_at"],
                condition=models.Q(event_type="purchase"),
                name="event_purchase_date_idx",
            ),

            # ----------------------------------------------------------------
            # Запрос 3: фильтр по metadata JSONB
            # SELECT * FROM events WHERE metadata @> '{"campaign_id": 42}'
            #
            # GIN индекс: инвертированный индекс для JSONB.
            # Поддерживает операторы @> (contains), ? (key exists), @? (jsonpath).
            # jsonb_path_ops — компактнее чем jsonb_ops, но только для @> и @?
            # ----------------------------------------------------------------
            GinIndex(
                fields=["metadata"],
                name="event_metadata_gin_idx",
                opclasses=["jsonb_path_ops"],
            ),

            # ----------------------------------------------------------------
            # Запрос 4: количество уникальных пользователей по дням
            # SELECT date_trunc('day', created_at), COUNT(DISTINCT user_id)
            # FROM events GROUP BY 1
            #
            # BRIN индекс: Block Range Index — сверхкомпактный для монотонно
            # возрастающих данных (временные метки, serial ID).
            # Хранит min/max для диапазона блоков, а не каждую строку.
            # Для 50M строк: GIN/BTree займёт сотни MB, BRIN — единицы MB.
            # Эффективен для запросов с диапазоном дат на append-only таблицах.
            # ----------------------------------------------------------------
            BrinIndex(
                fields=["created_at"],
                name="event_created_brin_idx",
                pages_per_range=128,  # баланс между размером и точностью
            ),
        ]

    class Meta:
        # Partitioning: для 50M+ строк рассмотрите партиционирование по месяцам.
        # Создаётся через raw SQL (Django не поддерживает native partitioning):
        # CREATE TABLE events PARTITION BY RANGE (created_at);
        # CREATE TABLE events_2024_01 PARTITION OF events
        #   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
        pass
`,
            },
            {
                filename: "analytics/migrations/0001_indexes.py",
                code: `"""
ВАЖНО: добавление индексов на живой таблице 50M строк блокирует таблицу.
Используйте CREATE INDEX CONCURRENTLY — блокировки нет, но занимает больше времени.
Django поддерживает это через Meta.indexes + AlterField --database-option или
через ручную миграцию с RunSQL.
"""
from django.db import migrations


class Migration(migrations.Migration):
    atomic = False   # CONCURRENTLY не работает внутри транзакции

    dependencies = [("analytics", "0000_initial")]

    operations = [
        # Составной индекс (user_id, created_at)
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS event_user_date_idx
                ON analytics_event (user_id, created_at DESC);
            """,
            reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS event_user_date_idx;",
        ),

        # Partial index — только purchase
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS event_purchase_date_idx
                ON analytics_event (created_at DESC)
                WHERE event_type = 'purchase';
            """,
            reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS event_purchase_date_idx;",
        ),

        # GIN для JSONB
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS event_metadata_gin_idx
                ON analytics_event USING GIN (metadata jsonb_path_ops);
            """,
            reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS event_metadata_gin_idx;",
        ),

        # BRIN для created_at
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS event_created_brin_idx
                ON analytics_event USING BRIN (created_at) WITH (pages_per_range = 128);
            """,
            reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS event_created_brin_idx;",
        ),
    ]
`,
            },
            {
                filename: "analytics/queries.py",
                code: `"""
Запросы, оптимизированные под созданные индексы.
Каждый запрос сопровождён EXPLAIN ANALYZE для проверки использования индекса.
"""
from datetime import date, timedelta

from django.db import connection
from django.db.models import Count
from django.db.models.functions import TruncDay

from .models import Event


# ---------------------------------------------------------------------------
# Запрос 1: события пользователя за период → использует event_user_date_idx
# ---------------------------------------------------------------------------

def get_user_events(user_id: int, days: int = 30) -> list:
    from django.utils import timezone
    since = timezone.now() - timedelta(days=days)
    return list(
        Event.objects.filter(user_id=user_id, created_at__gte=since)
                     .order_by("-created_at")
                     .values("id", "event_type", "created_at", "metadata")
    )


# ---------------------------------------------------------------------------
# Запрос 2a: покупки с фильтром по metadata → partial index + GIN
# SELECT * FROM events
# WHERE event_type = 'purchase'
#   AND metadata @> '{"campaign_id": 42}'
#   AND created_at > NOW() - INTERVAL '7 days'
# ---------------------------------------------------------------------------

def get_campaign_purchases(campaign_id: int, days: int = 7) -> list:
    from django.utils import timezone
    since = timezone.now() - timedelta(days=days)
    return list(
        Event.objects.filter(
            event_type="purchase",
            created_at__gte=since,
            metadata__contains={"campaign_id": campaign_id},  # @> оператор → GIN
        ).values("user_id", "created_at", "metadata")
    )


# ---------------------------------------------------------------------------
# Запрос 3: уникальные пользователи по дням → BRIN + TruncDay
# ---------------------------------------------------------------------------

def daily_unique_users(start: date, end: date) -> list[dict]:
    return list(
        Event.objects.filter(created_at__date__range=(start, end))
                     .annotate(day=TruncDay("created_at"))
                     .values("day")
                     .annotate(unique_users=Count("user_id", distinct=True))
                     .order_by("day")
    )


# ---------------------------------------------------------------------------
# Проверка плана запроса
# ---------------------------------------------------------------------------

def explain_query(sql: str) -> str:
    with connection.cursor() as cursor:
        cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS) {sql}")
        return "\\n".join(row[0] for row in cursor.fetchall())


# Пример проверки:
# plan = explain_query(
#     "SELECT * FROM analytics_event "
#     "WHERE user_id = 12345 AND created_at >= NOW() - INTERVAL '30 days'"
# )
# Ожидаем: "Index Scan using event_user_date_idx"
`,
            },
            {
                filename: "analytics/index_strategy.md",
                code: `# Стратегия индексирования: сводка

## Правила выбора индекса

| Сценарий | Тип индекса | Когда использовать |
|----------|-------------|-------------------|
| WHERE col = val, ORDER BY col | BTree (default) | Большинство запросов |
| WHERE col = 'frequent_value' | Partial BTree | Значение — < 20% строк |
| WHERE jsonb_col @> '...' | GIN jsonb_path_ops | JSONB contains/jsonpath |
| WHERE jsonb_col ? 'key' | GIN jsonb_ops | Key existence |
| Диапазон дат, append-only | BRIN | Монотонно возрастающие данные |
| Полнотекстовый поиск | GIN tsvector | text search |

## Составной индекс: порядок полей

(user_id, created_at) — правильно для:
  WHERE user_id = ? AND created_at > ?
  WHERE user_id = ? ORDER BY created_at

(created_at, user_id) — правильно для:
  WHERE created_at > ? (диапазон без user_id)

Правило: поля с equality (=) идут первыми, range (>, <, BETWEEN) — последними.

## CREATE INDEX CONCURRENTLY

Обычный CREATE INDEX: блокирует таблицу на запись (SHARE lock).
CONCURRENTLY: не блокирует запись, но:
- Занимает в 2-3x больше времени
- Нельзя выполнять внутри транзакции (atomic = False в миграции)
- Может завершиться с INVALID индексом при конкурентных изменениях
  (проверьте: SELECT indexname, indisvalid FROM pg_indexes WHERE indisvalid = false)

## Обслуживание индексов

REINDEX CONCURRENTLY index_name  -- перестройка без блокировки
VACUUM ANALYZE analytics_event   -- обновление статистики для планировщика
pg_stat_user_indexes             -- использование индексов (idx_scan > 0?)

Индексы с idx_scan = 0 за последний месяц — кандидаты на удаление.
`,
            },
        ],
        explanation: `**Составной индекс (user_id, created_at): порядок полей критичен.** Индекс \`(user_id, created_at)\` эффективен для \`WHERE user_id = ? AND created_at > ?\` потому что PostgreSQL сначала находит все строки пользователя (O(log N)), затем применяет диапазон по дате внутри этого множества. Обратный порядок \`(created_at, user_id)\` был бы оптимален для \`WHERE created_at > ?\` без фильтра по пользователю. Общее правило: equality-поля первыми, range-поля последними.

**Partial index: меньше места, быстрее поиск.** Если 'purchase' составляет 5% от 50M строк, partial index индексирует 2.5M записей вместо 50M. Он в 20 раз меньше, умещается в RAM, и Index Scan по нему на порядок быстрее. При этом PostgreSQL использует его только когда \`WHERE event_type = 'purchase'\` присутствует в запросе — это условие должно быть буквальным (не через параметр), иначе планировщик не распознает.

**GIN для JSONB: два opclass с разными возможностями.** \`jsonb_path_ops\` — только оператор \`@>\` (contains) и \`@?\` (jsonpath), но компактнее. \`jsonb_ops\` — дополнительно \`?\` (key exists), \`?|\`, \`?&\`, но в 1.5–2x больше по размеру. Для запросов типа \`metadata @> '{"campaign_id": 42}'\` достаточно \`jsonb_path_ops\`.

**BRIN: размер vs точность.** BRIN хранит min/max для диапазонов блоков (pages_per_range блоков на одну запись индекса). При \`pages_per_range=128\`: каждая запись покрывает 128×8KB=1MB данных. Индекс для 50M строк занимает ~1MB против ~1GB для BTree. Эффективен только если данные физически отсортированы по полю (insert-only таблицы с монотонным \`created_at\`).

**CREATE INDEX CONCURRENTLY обязателен для живой таблицы.** Обычный \`CREATE INDEX\` берёт \`SHARE\` lock — блокирует все INSERT/UPDATE/DELETE на время построения. Для 50M строк это минуты. \`CONCURRENTLY\` строит индекс в два прохода без блокировки записи, но требует \`atomic = False\` в миграции Django. После создания проверьте \`pg_indexes WHERE indisvalid = false\` — при конфликте индекс создаётся как INVALID и не используется.`,
    },

    {
        id: "django-connection-pooling",
        title: "Connection pooling и управление соединениями",
        task: `Настройте PgBouncer или django-db-geventpool для эффективного connection pooling. Реализуйте: мониторинг pool utilization, graceful handling connection timeout и pool exhaustion, корректную работу с транзакционным и сессионным pooling mode, интеграцию с health checks. Объясните разницу между режимами pooling и их влияние на Django.`,
        files: [
            {
                filename: "pgbouncer/pgbouncer.ini",
                code: `; PgBouncer — connection pooler между Django и PostgreSQL.
; Запускается как отдельный процесс, Django подключается к нему как к обычному PostgreSQL.

[databases]
; Django видит этот DSN — подключается к PgBouncer, а не к Postgres напрямую
mydb = host=postgres port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432

; -----------------------------------------------------------------------
; Режимы pooling — выбор зависит от особенностей приложения
;
; session:      соединение закреплено за клиентом на всё время сессии.
;               Равносильно прямому подключению к PostgreSQL.
;               Совместим с любыми Django-функциями (SET, LISTEN, cursors).
;
; transaction:  соединение выдаётся только на время транзакции, потом
;               возвращается в пул. Максимальная эффективность.
;               НЕСОВМЕСТИМ с: SET LOCAL вне транзакции, LISTEN/NOTIFY,
;               named prepared statements, advisory locks вне транзакции.
;               Django по умолчанию совместим при ATOMIC_REQUESTS=False.
;
; statement:    соединение выдаётся на один SQL-запрос. Практически не
;               используется с Django — несовместим с транзакциями.
; -----------------------------------------------------------------------
pool_mode = transaction

; Максимум соединений к PostgreSQL (сторона сервера)
; PostgreSQL имеет hard limit (max_connections в postgresql.conf).
; PgBouncer обслуживает тысячи клиентов через десятки серверных соединений.
max_client_conn = 1000
default_pool_size = 20       ; соединений к Postgres на базу данных
min_pool_size = 5            ; держим минимум соединений всегда открытыми
reserve_pool_size = 5        ; резерв для пиков нагрузки
reserve_pool_timeout = 5     ; секунды ожидания резервного соединения

; Таймауты
server_connect_timeout = 15  ; секунды ожидания подключения к Postgres
server_idle_timeout = 600    ; закрываем idle соединения через 10 минут
client_idle_timeout = 0      ; не закрываем idle клиентские соединения

auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

; Мониторинг — подключайтесь к виртуальной БД pgbouncer для статистики
; psql -h localhost -p 6432 -U pgbouncer pgbouncer
; SHOW POOLS;   — утилизация пула
; SHOW STATS;   — запросы/сек, время ожидания
; SHOW CLIENTS; — активные клиентские соединения
admin_users = pgbouncer
stats_users = monitor
`,
            },
            {
                filename: "config/settings.py (фрагмент)",
                code: `"""
Django подключается к PgBouncer, а не к PostgreSQL напрямую.
При transaction pooling mode — важные ограничения настроек Django.
"""

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": "localhost",
        "PORT": "6432",          # порт PgBouncer, не PostgreSQL (5432)
        "NAME": "mydb",
        "USER": "appuser",
        "PASSWORD": "secret",
        "OPTIONS": {
            # Отключаем server-side prepared statements:
            # в transaction pooling mode разные транзакции могут получить
            # разные серверные соединения → prepared statement недоступен.
            "prepare_threshold": None,
            # Явно задаём application_name для мониторинга в pg_stat_activity
            "application_name": "django-app",
        },
        "CONN_MAX_AGE": 0,       # НЕ используем persistent connections Django:
                                  # PgBouncer уже управляет пулом на своей стороне.
                                  # Persistent connections + transaction pooling = конфликт.
        "CONN_HEALTH_CHECKS": False,
    }
}

# ATOMIC_REQUESTS=True совместим с transaction pooling —
# каждый request оборачивается в транзакцию, соединение держится на время транзакции.
# Но учтите overhead: каждый запрос, даже read-only, открывает транзакцию.
ATOMIC_REQUESTS = False   # рекомендуется при transaction pooling для гибкости
`,
            },
            {
                filename: "core/db_health.py",
                code: `"""
Health check и мониторинг pool utilization через PgBouncer stats.
"""
import logging
from dataclasses import dataclass

import psycopg2
from django.db import connection, OperationalError

logger = logging.getLogger(__name__)


@dataclass
class PoolStats:
    database: str
    active: int       # соединения, выполняющие запрос
    idle: int         # свободные серверные соединения в пуле
    waiting: int      # клиенты, ожидающие соединения из пула
    max_wait_ms: int  # максимальное время ожидания (мс)

    @property
    def utilization(self) -> float:
        total = self.active + self.idle
        return self.active / total if total > 0 else 0.0

    @property
    def is_exhausted(self) -> bool:
        return self.waiting > 0


def get_pool_stats(pgbouncer_dsn: str) -> list[PoolStats]:
    """
    Подключается к виртуальной БД pgbouncer и читает статистику пула.
    Вызывайте из Celery beat каждые 30s и отправляйте в Prometheus/Datadog.
    """
    try:
        conn = psycopg2.connect(pgbouncer_dsn + " dbname=pgbouncer")
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("SHOW POOLS;")
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
        conn.close()
    except Exception as exc:
        logger.error("Failed to query PgBouncer stats: %s", exc)
        return []

    stats = []
    for row in rows:
        r = dict(zip(cols, row))
        stats.append(PoolStats(
            database=r["database"],
            active=int(r["sv_active"]),
            idle=int(r["sv_idle"]),
            waiting=int(r["cl_waiting"]),
            max_wait_ms=int(float(r.get("maxwait_us", 0)) / 1000),
        ))

    for s in stats:
        if s.is_exhausted:
            logger.error(
                "Pool EXHAUSTED for %s: %d clients waiting (max_wait=%dms)",
                s.database, s.waiting, s.max_wait_ms,
            )
        elif s.utilization > 0.8:
            logger.warning(
                "Pool high utilization for %s: %.0f%% (%d/%d active)",
                s.database, s.utilization * 100, s.active, s.active + s.idle,
            )
    return stats


def django_db_health_check() -> dict:
    """
    Используется в /health/ эндпоинте для load balancer / k8s liveness probe.
    Проверяет что Django может выполнить простой запрос к БД.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return {"status": "ok", "db": "connected"}
    except OperationalError as exc:
        logger.critical("DB health check failed: %s", exc)
        return {"status": "error", "db": str(exc)}
`,
            },
            {
                filename: "core/views.py",
                code: `"""
Health check эндпоинт для интеграции с load balancer / k8s.
Возвращает 200 если БД доступна, 503 если нет.
"""
from django.http import JsonResponse
from django.views import View

from .db_health import django_db_health_check


class HealthView(View):
    # Исключаем из authentication и CSRF — вызывается инфраструктурой
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        result = django_db_health_check()
        status_code = 200 if result["status"] == "ok" else 503
        return JsonResponse(result, status=status_code)
`,
            },
        ],
        explanation: `**Три режима PgBouncer и совместимость с Django.** Session mode — соединение закреплено за клиентом, полная совместимость, но экономия минимальна. Transaction mode — соединение выдаётся на время транзакции: при 100 воркерах Django реально нужно 20–30 серверных соединений к PostgreSQL. Statement mode — одно соединение на один SQL, несовместим с транзакциями Django совсем.

**Ограничения transaction pooling.** Разные транзакции одного Django-воркера могут получить разные серверные соединения. Это ломает: server-side prepared statements (отключайте \`prepare_threshold=None\`), \`SET\` вне транзакции (значение теряется при возврате соединения в пул), \`LISTEN/NOTIFY\` (слушатель должен держать постоянное соединение), advisory locks вне транзакции, \`pg_temp\` таблицы.

**\`CONN_MAX_AGE=0\` с PgBouncer.** Django persistent connections (\`CONN_MAX_AGE > 0\`) держат соединение открытым между запросами. С transaction pooling это значит: воркер удерживает серверное соединение даже когда не выполняет транзакцию. Теряется весь смысл пулинга. Устанавливайте \`CONN_MAX_AGE=0\` — Django закрывает соединение после каждого запроса, PgBouncer возвращает его в пул.

**Мониторинг через \`SHOW POOLS\`.** Ключевые метрики: \`sv_active\` (соединения под нагрузкой), \`sv_idle\` (свободные), \`cl_waiting\` (клиенты в очереди). \`cl_waiting > 0\` означает pool exhaustion — клиенты ждут соединения. \`maxwait_us\` — время ожидания в микросекундах. Отправляйте эти метрики в Prometheus раз в 30 секунд.

**\`reserve_pool_size\` как буфер против пиков.** При \`pool_size=20\` и \`reserve_pool_size=5\` в пике PgBouncer откроет до 25 соединений. Резерв выдаётся только после \`reserve_pool_timeout\` секунд ожидания — это защита от случайных выбросов, а не от систематической перегрузки.`,
    },

    {
        id: "django-injection-security",
        title: "Защита от инъекций и валидация данных",
        task: `Проведите аудит безопасности Django-приложения. Найдите и исправьте уязвимости: использование сырого SQL с интерполяцией строк, небезопасная десериализация данных от пользователя, XSS через отключённый autoescaping в шаблонах, SSRF при обращении к URL из пользовательского ввода. Реализуйте безопасные альтернативы и напишите тесты безопасности.`,
        files: [
            {
                filename: "audit/sql_injection.py",
                code: `"""
SQL-инъекция: небезопасные и безопасные паттерны.
"""
from django.db import connection
from .models import Product


# ============================================================
# УЯЗВИМО: интерполяция строк в raw SQL
# Атака: GET /products/?category='; DROP TABLE products; --
# ============================================================
def search_products_unsafe(category: str) -> list:
    with connection.cursor() as cursor:
        # НИКОГДА так не делайте:
        cursor.execute(f"SELECT * FROM catalog_product WHERE category = '{category}'")
        return cursor.fetchall()


# ============================================================
# БЕЗОПАСНО: параметризованные запросы (второй аргумент execute)
# Django всегда экранирует параметры через драйвер psycopg2.
# ============================================================
def search_products_safe_raw(category: str) -> list:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, name, price FROM catalog_product WHERE category = %s",
            [category],   # передаём как параметр, не интерполируем
        )
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


# ============================================================
# БЕЗОПАСНО: ORM (всегда параметризован)
# ============================================================
def search_products_orm(category: str) -> list:
    return list(
        Product.objects.filter(category=category).values("id", "name", "price")
    )


# ============================================================
# ОПАСНЫЙ ПАТТЕРН: динамические имена полей через ORM
# Атака: GET /products/?order_by=password  (enumerate hidden fields)
# ============================================================
ALLOWED_ORDER_FIELDS = {"name", "price", "created_at"}

def list_products_ordered_unsafe(order_by: str) -> list:
    # УЯЗВИМО: пользователь контролирует имя поля
    return list(Product.objects.order_by(order_by))

def list_products_ordered_safe(order_by: str) -> list:
    # БЕЗОПАСНО: whitelist допустимых полей
    if order_by.lstrip("-") not in ALLOWED_ORDER_FIELDS:
        order_by = "name"
    return list(Product.objects.order_by(order_by).values("id", "name", "price"))
`,
            },
            {
                filename: "audit/deserialization.py",
                code: `"""
Небезопасная десериализация и безопасные альтернативы.
"""
import json
import pickle
from typing import Any

from django.core import signing
from rest_framework import serializers


# ============================================================
# УЯЗВИМО: pickle от пользователя → RCE (Remote Code Execution)
# pickle.loads выполняет произвольный Python-код при десериализации
# ============================================================
def load_session_data_unsafe(raw: bytes) -> Any:
    return pickle.loads(raw)   # НИКОГДА не делайте так с пользовательскими данными


# ============================================================
# БЕЗОПАСНО: JSON + явная схема (serializer)
# JSON не выполняет код; serializer проверяет типы и значения
# ============================================================
class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=100)


def load_cart_safe(raw_json: str) -> list[dict]:
    try:
        data = json.loads(raw_json)
    except (json.JSONDecodeError, TypeError):
        raise ValueError("Invalid JSON")

    if not isinstance(data, list):
        raise ValueError("Expected list")

    result = []
    for item in data:
        s = CartItemSerializer(data=item)
        s.is_valid(raise_exception=True)
        result.append(s.validated_data)
    return result


# ============================================================
# БЕЗОПАСНО: подписанные данные через django.core.signing
# Используется для URL-токенов, которые нельзя подделать
# ============================================================
def make_signed_token(data: dict) -> str:
    return signing.dumps(data, salt="cart-token")

def read_signed_token(token: str) -> dict:
    try:
        return signing.loads(token, salt="cart-token", max_age=3600)
    except signing.BadSignature:
        raise ValueError("Invalid or expired token")
`,
            },
            {
                filename: "audit/xss_templates.py",
                code: `"""
XSS через шаблоны Django.

Django по умолчанию экранирует HTML в шаблонах (autoescaping включён).
Уязвимость возникает при явном отключении: {% autoescape off %} или фильтр |safe.
"""

# audit/templates/product_detail.html — УЯЗВИМЫЙ вариант:
TEMPLATE_UNSAFE = """
{% autoescape off %}
  <h1>{{ product.name }}</h1>          {# ← XSS если name содержит <script> #}
  <div>{{ product.description|safe }}</div>  {# ← safe отключает экранирование #}
{% endautoescape %}
"""

# audit/templates/product_detail.html — БЕЗОПАСНЫЙ вариант:
TEMPLATE_SAFE = """
{# autoescaping включён по умолчанию — не трогайте без явной причины #}
<h1>{{ product.name }}</h1>
<div>{{ product.description }}</div>

{# Если нужен HTML из БД (редактор WYSIWYG) — используйте bleach для sanitize #}
{# {{ product.rich_description|bleach_clean }} — через кастомный template tag #}
"""

# В Python-коде: явная разметка строки как safe
from django.utils.html import format_html, escape

def render_product_name(name: str) -> str:
    # УЯЗВИМО:
    # return mark_safe(f"<b>{name}</b>")

    # БЕЗОПАСНО: format_html экранирует все аргументы
    return format_html("<b>{}</b>", name)

def render_product_badge(label: str, url: str) -> str:
    return format_html('<a href="{}" class="badge">{}</a>', url, label)
`,
            },
            {
                filename: "audit/ssrf_protection.py",
                code: `"""
SSRF (Server-Side Request Forgery): пользователь передаёт URL,
сервер делает запрос от своего имени — к внутренним сервисам, метаданным облака.

Атаки:
  http://169.254.169.254/latest/meta-data/  — AWS EC2 metadata (ключи IAM)
  http://localhost:6379/                    — Redis без auth
  file:///etc/passwd                        — чтение файлов (некоторые библиотеки)
"""
import ipaddress
import re
from urllib.parse import urlparse

import requests
from django.core.exceptions import ValidationError


# Диапазоны адресов, недоступных из интернета
PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local (AWS metadata)
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

ALLOWED_SCHEMES = {"https"}          # только HTTPS, не http/file/ftp
ALLOWED_DOMAINS_RE = re.compile(
    r"^([\w-]+\.)*example\.com$"    # замените на свой whitelist
)


def validate_url(url: str) -> str:
    """Валидирует URL перед выполнением запроса от имени сервера."""
    try:
        parsed = urlparse(url)
    except Exception:
        raise ValidationError("Invalid URL format.")

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValidationError(f"Scheme '{parsed.scheme}' is not allowed.")

    hostname = parsed.hostname or ""
    if not ALLOWED_DOMAINS_RE.match(hostname):
        raise ValidationError(f"Domain '{hostname}' is not in whitelist.")

    # Резолвим hostname и проверяем IP
    import socket
    try:
        ip = socket.gethostbyname(hostname)
    except socket.gaierror:
        raise ValidationError("Could not resolve hostname.")

    addr = ipaddress.ip_address(ip)
    for net in PRIVATE_RANGES:
        if addr in net:
            raise ValidationError(f"Requests to private addresses are not allowed.")

    return url


def fetch_user_url(url: str) -> bytes:
    """Безопасный fetch URL из пользовательского ввода."""
    validated = validate_url(url)
    response = requests.get(
        validated,
        timeout=5,
        allow_redirects=False,   # редиректы могут обойти проверку хоста
        headers={"User-Agent": "MyApp/1.0"},
        stream=True,
    )
    # Ограничиваем размер ответа — защита от OOM
    return response.raw.read(1024 * 1024)  # max 1MB
`,
            },
            {
                filename: "audit/tests/test_security.py",
                code: `"""
Тесты безопасности — проверяют что уязвимости закрыты.
"""
import pytest
from django.core.exceptions import ValidationError
from django.test import TestCase, Client

from audit.sql_injection import list_products_ordered_safe
from audit.deserialization import load_cart_safe, read_signed_token, make_signed_token
from audit.ssrf_protection import validate_url


class SQLInjectionTest(TestCase):
    def test_order_by_whitelist_rejects_unknown_field(self):
        # Атака: попытка использовать поле password в ORDER BY
        result = list_products_ordered_safe("password")
        # Функция должна откатиться к default полю, не упасть
        self.assertIsInstance(result, list)

    def test_order_by_whitelist_allows_valid_field(self):
        result = list_products_ordered_safe("name")
        self.assertIsInstance(result, list)

    def test_order_by_whitelist_allows_descending(self):
        result = list_products_ordered_safe("-price")
        self.assertIsInstance(result, list)


class DeserializationTest(TestCase):
    def test_valid_cart(self):
        import json
        raw = json.dumps([{"product_id": 1, "quantity": 2}])
        result = load_cart_safe(raw)
        self.assertEqual(result[0]["product_id"], 1)

    def test_invalid_quantity_rejected(self):
        import json
        raw = json.dumps([{"product_id": 1, "quantity": 9999}])
        with self.assertRaises(Exception):
            load_cart_safe(raw)

    def test_signed_token_tamper(self):
        token = make_signed_token({"user_id": 1})
        with self.assertRaises(ValueError):
            read_signed_token(token + "tampered")


class SSRFTest(TestCase):
    def test_private_ip_blocked(self):
        with self.assertRaises(ValidationError):
            validate_url("https://192.168.1.1/secret")

    def test_localhost_blocked(self):
        with self.assertRaises(ValidationError):
            validate_url("https://127.0.0.1/")

    def test_aws_metadata_blocked(self):
        with self.assertRaises(ValidationError):
            validate_url("https://169.254.169.254/latest/meta-data/")

    def test_http_scheme_blocked(self):
        with self.assertRaises(ValidationError):
            validate_url("http://example.com/resource")

    def test_file_scheme_blocked(self):
        with self.assertRaises(ValidationError):
            validate_url("file:///etc/passwd")

    def test_unknown_domain_blocked(self):
        with self.assertRaises(ValidationError):
            validate_url("https://evil.attacker.com/hook")
`,
            },
        ],
        explanation: `**SQL-инъекция: f-строки в \`execute()\` — главная ошибка.** Django ORM защищён по умолчанию — все значения параметризуются. Уязвимость появляется при использовании \`cursor.execute(f"... {value}")\` или конкатенации строк. Всегда передавайте значения вторым аргументом: \`cursor.execute("... WHERE x = %s", [value])\`. Отдельная ловушка — динамические имена полей в ORM: \`order_by(user_input)\` не является SQL-инъекцией, но позволяет перечислять скрытые поля (enumerate). Whitelist обязателен.

**pickle от пользователя = RCE.** \`pickle.loads\` вызывает \`__reduce__\` объекта при десериализации — атакующий может сконструировать payload, который выполнит \`os.system("rm -rf /")\`. Никогда не десериализуйте pickle от пользователя. Используйте JSON + явную схему через DRF Serializer или Pydantic. Для подписанных данных — \`django.core.signing\`: HMAC-SHA256, нельзя подделать без SECRET_KEY.

**XSS: \`|safe\` и \`autoescape off\` должны быть красным флагом.** Django экранирует HTML по умолчанию: \`<script>\` превращается в \`&lt;script&gt;\`. Уязвимость появляется при явном отключении. \`format_html()\` — правильный способ собирать HTML из Python: экранирует все \`{}\` аргументы. Если нужен пользовательский HTML (WYSIWYG) — обязательна санитизация через \`bleach\`.

**SSRF: проверка hostname недостаточна.** Атакующий может зарегистрировать \`evil.com\` с DNS-записью \`169.254.169.254\`. Проверяйте не hostname, а реальный IP после DNS-резолвинга. \`allow_redirects=False\` критично: редирект может вести на внутренний адрес, который прошёл бы проверку hostname, но не прошёл бы проверку IP. Ограничение размера ответа защищает от DoS через огромные ответы.`,
    },

    {
        id: "django-csrf-cors",
        title: "CSRF и защита API",
        task: `Реализуйте корректную CSRF-защиту для гибридного приложения: классические form-based views с CSRF-токенами, SPA фронтенд на React с cookie-based CSRF (double submit cookie pattern), мобильные клиенты с JWT без CSRF. Настройте CORS заголовки с whitelist доменов. Объясните, почему JWT сам по себе не защищает от CSRF.`,
        files: [
            {
                filename: "config/settings.py (фрагмент)",
                code: `# -----------------------------------------------------------------------
# CSRF настройки
# -----------------------------------------------------------------------

# Домены, которым разрешено делать cross-origin запросы с CSRF-токеном.
# CSRF_TRUSTED_ORIGINS проверяет Origin/Referer заголовок запроса.
CSRF_TRUSTED_ORIGINS = [
    "https://app.example.com",
    "https://admin.example.com",
]

# Cookie настройки для CSRF
CSRF_COOKIE_SECURE = True        # только HTTPS
CSRF_COOKIE_SAMESITE = "Lax"     # защита от CSRF для обычных запросов
                                  # "Strict" — строже, но ломает OAuth redirects
CSRF_COOKIE_HTTPONLY = False      # SPA должен читать токен из cookie через JS

# Session cookie
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_HTTPONLY = True    # JS не должен читать session cookie

# -----------------------------------------------------------------------
# CORS (пакет django-cors-headers)
# -----------------------------------------------------------------------
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware"] + MIDDLEWARE  # первым!

# Разрешённые origins для cross-origin запросов
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
    "https://admin.example.com",
]

# НИКОГДА не используйте CORS_ALLOW_ALL_ORIGINS = True в production

CORS_ALLOW_CREDENTIALS = True    # разрешаем отправку cookie при cross-origin

CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "x-csrftoken",    # SPA отправляет CSRF-токен в этом заголовке
]

# Preflight кэшируется браузером на N секунд — уменьшает OPTIONS-запросы
CORS_PREFLIGHT_MAX_AGE = 86400
`,
            },
            {
                filename: "auth/views_forms.py",
                code: `"""
Классические form-based views: CSRF через {% csrf_token %} в шаблоне.
Django CsrfViewMiddleware проверяет токен автоматически для POST/PUT/PATCH/DELETE.
"""
from django.contrib.auth import authenticate, login
from django.shortcuts import redirect, render
from django.views import View
from django.views.decorators.csrf import csrf_protect


class LoginView(View):
    # csrf_protect явно — дополнительная защита для критичных эндпоинтов
    @csrf_protect
    def get(self, request):
        return render(request, "auth/login.html")  # шаблон содержит {% csrf_token %}

    @csrf_protect
    def post(self, request):
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect("dashboard")
        return render(request, "auth/login.html", {"error": "Invalid credentials"})
`,
            },
            {
                filename: "auth/views_spa.py",
                code: `"""
SPA (React) + Django: Double Submit Cookie pattern.

Схема работы:
1. SPA делает GET /api/csrf/ → Django устанавливает csrftoken cookie
2. SPA читает cookie через JS (CSRF_COOKIE_HTTPONLY = False)
3. SPA добавляет токен в заголовок X-CSRFToken при каждом POST/PUT/DELETE
4. Django проверяет: значение в cookie == значение в заголовке

Почему это работает: злоумышленный сайт не может прочитать cookie
другого домена (same-origin policy), значит не может подставить верный
токен в заголовок.
"""
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie


class CsrfTokenView(View):
    """Эндпоинт для получения CSRF-токена. SPA вызывает при старте."""

    @method_decorator(ensure_csrf_cookie)  # гарантирует установку cookie
    def get(self, request):
        return JsonResponse({"csrfToken": get_token(request)})


# ---------------------------------------------------------------------------
# React-клиент: как читать и использовать CSRF-токен
# ---------------------------------------------------------------------------
REACT_SNIPPET = """
// utils/csrf.js
function getCsrfToken() {
    const name = 'csrftoken=';
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const c = cookie.trim();
        if (c.startsWith(name)) return c.slice(name.length);
    }
    return null;
}

// При старте приложения — получаем токен
await fetch('/api/csrf/', { credentials: 'include' });

// Все мутирующие запросы
const response = await fetch('/api/orders/', {
    method: 'POST',
    credentials: 'include',       // отправляем session cookie
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),   // токен из cookie
    },
    body: JSON.stringify(orderData),
});
"""
`,
            },
            {
                filename: "auth/views_mobile.py",
                code: `"""
Мобильные клиенты / API-only: JWT аутентификация без CSRF.

Почему JWT в Authorization header не нуждается в CSRF:
  CSRF-атака работает так: злоумышленный сайт делает запрос от имени
  жертвы, браузер автоматически прикрепляет cookie (session).
  Браузер НЕ прикрепляет Authorization header автоматически —
  его должен добавить JS жертвы (чего злоумышленный сайт не может
  сделать из-за same-origin policy).

  Но: если JWT хранится в cookie (httpOnly), а не в localStorage/memory,
  то CSRF снова актуален — браузер прикрепит cookie автоматически.
  В этом случае нужен либо CSRF-токен, либо SameSite=Strict cookie.

Эндпоинты, используемые мобильными клиентами, исключаем из CSRF:
"""
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt  # mobile API — CSRF не нужен при Authorization header
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mobile_orders(request):
    """
    Мобильный клиент отправляет: Authorization: Bearer <access_token>
    CSRF не нужен: браузер не прикрепляет Authorization header автоматически.
    """
    orders = request.user.orders.values("id", "status", "total")[:20]
    return Response({"orders": list(orders)})
`,
            },
            {
                filename: "auth/csrf_explanation.md",
                code: `# Почему JWT в localStorage не защищает от XSS, а CSRF не актуален

## CSRF-атака: механизм

1. Пользователь залогинен на bank.com (session cookie установлен)
2. Открывает evil.com
3. evil.com делает: fetch("https://bank.com/transfer", {method:"POST", body:...})
4. Браузер АВТОМАТИЧЕСКИ добавляет cookie bank.com к запросу
5. Сервер видит валидный session cookie → выполняет перевод

## Почему Authorization header защищает от CSRF

Шаг 3 изменяется: злоумышленный скрипт должен добавить заголовок:
  headers: { "Authorization": "Bearer " + token }

Но evil.com не знает token — он хранится в памяти или localStorage
приложения bank.com. Браузер не прикрепляет Authorization автоматически.
Same-origin policy не позволяет evil.com читать localStorage другого домена.

Итог: CSRF-атака не работает, если токен в Authorization header.

## Когда JWT в cookie → CSRF снова актуален

Если хранить JWT в httpOnly cookie:
  Set-Cookie: jwt=eyJ...; HttpOnly; Secure; SameSite=Lax

Браузер прикрепит cookie автоматически → CSRF-атака снова возможна.
Решение: SameSite=Strict (ломает OAuth) или Double Submit Cookie с CSRF-токеном.

## Где хранить JWT: компромисс

| Хранилище     | XSS      | CSRF         | Примечание |
|---------------|----------|--------------|------------|
| localStorage  | Уязвим   | Защищён      | JS имеет доступ |
| httpOnly cookie | Защищён | Уязвим (нужен CSRF) | JS не имеет доступа |
| memory (переменная) | Защищён | Защищён | Теряется при перезагрузке |

Рекомендация для SPA: access token в memory, refresh token в httpOnly cookie + CSRF-токен.
`,
            },
        ],
        explanation: `**Double Submit Cookie: почему работает без сервера.** Браузер запрещает читать cookie чужого домена (same-origin policy). Злоумышленный сайт не может получить значение \`csrftoken\` cookie домена жертвы, значит не может подставить правильное значение в заголовок \`X-CSRFToken\`. Django проверяет: cookie == header. Подделать оба невозможно без доступа к cookie.

**JWT в Authorization header vs cookie.** Если JWT передаётся в заголовке \`Authorization: Bearer ...\`, браузер не добавляет его автоматически при cross-origin запросах — только JS жертвы может это сделать, но злоумышленный сайт не имеет доступа к \`localStorage\` или переменным памяти чужого домена. CSRF не актуален. Но если JWT в \`httpOnly cookie\` — браузер прикрепит его автоматически, и CSRF снова актуален.

**\`SameSite=Lax\` vs \`Strict\`.** \`Strict\` — cookie не отправляется ни при каких cross-origin переходах, включая переходы по ссылкам. Это ломает OAuth-redirect flows: пользователь возвращается от Google Auth на ваш сайт, cookie не прикреплён, сессия не установлена. \`Lax\` — cookie не отправляется при cross-origin POST (основной вектор CSRF), но отправляется при GET-переходах по ссылкам. Разумный компромисс.

**\`CorsMiddleware\` должен быть первым в MIDDLEWARE.** CORS-заголовки должны добавляться до любой обработки запроса, включая аутентификацию. Если middleware аутентификации стоит раньше и отклоняет запрос с 401 без CORS-заголовков, браузер не сможет прочитать статус ошибки из-за CORS policy — получите непонятную сетевую ошибку вместо 401.

**\`CORS_ALLOW_ALL_ORIGINS = True\` в production — открытая дверь.** При \`CORS_ALLOW_CREDENTIALS = True\` этот флаг запрещён спецификацией (браузеры игнорируют \`credentials\` при \`*\`). Но даже без credentials — любой сайт может читать ответы вашего API. Всегда используйте \`CORS_ALLOWED_ORIGINS\` с явным списком доменов.`,
    },

    {
        id: "django-audit-log",
        title: "Аудит-лог и non-repudiation",
        task: `Реализуйте систему аудит-логирования для критических операций (изменение прав доступа, финансовые транзакции, удаление данных). Лог должен: записываться атомарно вместе с основной операцией, содержать: кто, что, когда, откуда, до и после, быть защищён от изменения (append-only), поддерживать поиск и фильтрацию, экспорт для compliance.`,
        files: [
            {
                filename: "audit/models.py",
                code: `"""
AuditLog — append-only таблица критических событий.

Защита от изменений:
  1. Модель не имеет метода save() с update — только create().
  2. На уровне БД: row-level trigger запрещает UPDATE/DELETE (см. миграцию).
  3. Поле hash_chain: SHA-256 от содержимого + хеш предыдущей записи —
     любая правка нарушит цепочку хешей.
"""
import hashlib
import json
from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Создание"
        UPDATE = "update", "Изменение"
        DELETE = "delete", "Удаление"
        ACCESS = "access", "Доступ"
        PERMISSION_CHANGE = "permission_change", "Изменение прав"
        FINANCIAL = "financial", "Финансовая операция"

    # Кто
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
        db_index=True,
    )
    actor_email = models.EmailField(blank=True)    # снапшот на момент события

    # Что
    action = models.CharField(max_length=30, choices=Action, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True)  # "Order", "User"
    resource_id = models.CharField(max_length=100, db_index=True)
    before = models.JSONField(null=True, blank=True)   # состояние до
    after = models.JSONField(null=True, blank=True)    # состояние после

    # Когда
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # Откуда
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.CharField(max_length=64, blank=True, db_index=True)

    # Integrity
    hash_chain = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["actor", "timestamp"]),
            models.Index(fields=["action", "timestamp"]),
        ]

    def compute_hash(self, prev_hash: str = "") -> str:
        payload = json.dumps({
            "actor_id": self.actor_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id),
            "before": self.before,
            "after": self.after,
            "timestamp": self.timestamp.isoformat() if self.timestamp else "",
            "prev_hash": prev_hash,
        }, sort_keys=True)
        return hashlib.sha256(payload.encode()).hexdigest()

    # Запрещаем изменение через ORM — только создание
    def save(self, *args, **kwargs):
        if self.pk:
            raise RuntimeError("AuditLog entries are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("AuditLog entries cannot be deleted.")
`,
            },
            {
                filename: "audit/writer.py",
                code: `"""
Единственная точка записи в аудит-лог.
Все критические операции должны вызывать log_action().
"""
import logging
from typing import Any

from django.db import transaction

from .models import AuditLog

logger = logging.getLogger("audit")


def _extract_request_meta(request) -> dict:
    if request is None:
        return {}
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")
    return {
        "ip_address": ip or None,
        "user_agent": request.META.get("HTTP_USER_AGENT", "")[:500],
        "request_id": getattr(request, "request_id", ""),
    }


def log_action(
    action: str,
    resource_type: str,
    resource_id: Any,
    actor=None,
    before: dict | None = None,
    after: dict | None = None,
    request=None,
) -> AuditLog:
    """
    Записывает событие в аудит-лог.
    ДОЛЖНА вызываться внутри транзакции основной операции:

        with transaction.atomic():
            order.status = "cancelled"
            order.save()
            log_action("update", "Order", order.pk, before=..., after=..., ...)

    Это гарантирует: либо оба изменения сохранены, либо ни одного.
    """
    meta = _extract_request_meta(request)

    # Хеш-цепочка: берём хеш последней записи для этого ресурса
    last = (
        AuditLog.objects.filter(
            resource_type=resource_type,
            resource_id=str(resource_id),
        )
        .order_by("-timestamp")
        .values_list("hash_chain", flat=True)
        .first()
    )
    prev_hash = last or ""

    entry = AuditLog(
        actor=actor,
        actor_email=getattr(actor, "email", ""),
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        before=before,
        after=after,
        **meta,
    )
    # Временно сохраняем без хеша чтобы получить timestamp от БД,
    # затем вычисляем хеш и обновляем поле напрямую через QuerySet.update
    # (не через instance.save() — он запрещён для существующих записей)
    entry.hash_chain = ""
    # Обходим наш иммутабельный save() — используем super() через type
    type(AuditLog).save(entry)
    computed = entry.compute_hash(prev_hash)
    AuditLog.objects.filter(pk=entry.pk).update(hash_chain=computed)

    logger.info(
        "AUDIT %s %s/%s actor=%s",
        action, resource_type, resource_id,
        getattr(actor, "id", "system"),
    )
    return entry
`,
            },
            {
                filename: "audit/migrations/0002_append_only_trigger.py",
                code: `"""
PostgreSQL trigger: запрещает UPDATE и DELETE в таблице audit_auditlog.
Защита на уровне БД — не обходится через raw SQL из Django.
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("audit", "0001_initial")]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE OR REPLACE FUNCTION audit_log_immutable()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF TG_OP = 'UPDATE' AND OLD.hash_chain = '' THEN
                        -- Разрешаем единственный UPDATE: запись hash_chain сразу после INSERT
                        RETURN NEW;
                    END IF;
                    RAISE EXCEPTION 'audit_auditlog is append-only: % is not allowed', TG_OP;
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER audit_log_immutable_trigger
                BEFORE UPDATE OR DELETE ON audit_auditlog
                FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
            """,
            reverse_sql="""
                DROP TRIGGER IF EXISTS audit_log_immutable_trigger ON audit_auditlog;
                DROP FUNCTION IF EXISTS audit_log_immutable();
            """,
        )
    ]
`,
            },
            {
                filename: "audit/views.py",
                code: `"""
API для поиска и экспорта аудит-лога (только для staff/compliance).
"""
import csv
from datetime import datetime

from django.http import StreamingHttpResponse
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor_display", "action", "resource_type", "resource_id",
            "before", "after", "timestamp", "ip_address", "request_id", "hash_chain",
        ]

    def get_actor_display(self, obj):
        return obj.actor_email or str(obj.actor_id)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Только чтение — лог нельзя изменить через API.
    Доступен только staff пользователям.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ["action", "resource_type", "resource_id", "actor"]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("actor").order_by("-timestamp")

        # Фильтр по диапазону дат
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)

        return qs

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        """Стриминговый CSV-экспорт для compliance-отчётов (большие объёмы)."""

        def rows():
            yield ["timestamp", "actor", "action", "resource_type",
                   "resource_id", "ip_address", "hash_chain"]
            for entry in self.get_queryset().iterator(chunk_size=500):
                yield [
                    entry.timestamp.isoformat(),
                    entry.actor_email,
                    entry.action,
                    entry.resource_type,
                    entry.resource_id,
                    entry.ip_address or "",
                    entry.hash_chain,
                ]

        class EchoWriter:
            def write(self, value): return value

        writer = csv.writer(EchoWriter())
        response = StreamingHttpResponse(
            (writer.writerow(row) for row in rows()),
            content_type="text/csv",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="audit_{datetime.now().date()}.csv"'
        )
        return response
`,
            },
            {
                filename: "orders/views.py",
                code: `"""
Пример использования аудит-лога в финансовой операции.
log_action вызывается внутри той же транзакции что и основное изменение.
"""
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.writer import log_action
from .models import Order


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id: int):
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id, user=request.user)

        if order.status == "cancelled":
            return Response({"detail": "Already cancelled."}, status=400)

        before_state = {"status": order.status, "total": str(order.total)}
        order.status = "cancelled"
        order.save(update_fields=["status"])

        log_action(
            action="update",
            resource_type="Order",
            resource_id=order.pk,
            actor=request.user,
            before=before_state,
            after={"status": "cancelled", "total": str(order.total)},
            request=request,
        )

    return Response({"detail": "Order cancelled."})
`,
            },
        ],
        explanation: `**Атомарность через единую транзакцию.** Основное изменение и запись в аудит-лог происходят в одном \`transaction.atomic()\`. Если транзакция откатывается — лог-запись тоже откатывается. Если лог не записался — основное изменение тоже не сохраняется. Это гарантирует полноту лога: нет события без записи и нет записи без события.

**Три уровня защиты от изменений.** Иммутабельный \`save()\` в Python — первая линия: любая попытка изменить запись через ORM бросает \`RuntimeError\`. PostgreSQL trigger — вторая: запрещает \`UPDATE\` и \`DELETE\` на уровне БД, не обходится raw SQL из приложения. Хеш-цепочка — третья: любая правка нарушает цепочку SHA-256, что обнаруживается при аудите. Вместе они создают defence-in-depth.

**Снапшот \`actor_email\`.** \`actor\` — ForeignKey с \`SET_NULL\`: при удалении пользователя связь теряется, но \`actor_email\` сохраняет email на момент события. Это критично для compliance: нужно знать кто выполнил действие, даже если аккаунт удалён. Аналогично для \`before\`/\`after\` — снапшот состояния, а не ссылка на текущий объект.

**Стриминговый CSV-экспорт через \`iterator()\`.** Аудит-лог может содержать миллионы записей. Загрузка всех в память — OOM. \`QuerySet.iterator(chunk_size=500)\` читает записи батчами без кэширования. \`StreamingHttpResponse\` пишет в сокет по мере генерации — клиент получает данные постепенно, сервер не держит весь ответ в памяти.

**Хеш-цепочка: blockchain-lite.** Каждая запись содержит SHA-256 от своего содержимого + хеш предыдущей записи для того же ресурса. Это создаёт цепочку: изменить запись №5 без нарушения цепочки невозможно — её хеш учтён в записи №6. Периодическая верификация цепочки (audit job) обнаружит любую правку.`,
    },

    {
        id: "django-field-encryption",
        title: "Шифрование данных на уровне приложения",
        task: `Реализуйте шифрование чувствительных данных (номера карт, паспортные данные) на уровне приложения с использованием django-encrypted-model-fields или собственной реализации на cryptography. Обеспечьте: прозрачное шифрование/дешифрование при работе с ORM, ротацию ключей шифрования без даунтайма, поиск по зашифрованным полям через детерминированное шифрование или blind index.`,
        files: [
            {
                filename: "core/encryption.py",
                code: `"""
Шифрование данных на уровне приложения через cryptography (Fernet + AES-GCM).

Fernet: AES-128-CBC + HMAC-SHA256, симметричное, authenticated.
  + Простой API, защита от tampering
  - Не детерминированный (каждый вызов → разный шифротекст)
  - Нельзя фильтровать по зашифрованному полю

Для поиска используем blind index:
  HMAC-SHA256(plaintext, search_key) — детерминирован, не раскрывает plaintext,
  хранится рядом с зашифрованным полем, фильтруем по нему.
"""
import base64
import hashlib
import hmac
import os
from typing import Optional

from cryptography.fernet import Fernet, MultiFernet, InvalidToken
from django.conf import settings


def _get_fernets() -> MultiFernet:
    """
    MultiFernet поддерживает несколько ключей: шифрует первым (текущим),
    расшифровывает любым. Это основа ротации ключей без даунтайма:
    добавляем новый ключ первым, старые оставляем — старые данные
    продолжают расшифровываться, новые шифруются новым ключом.
    """
    raw_keys = settings.FIELD_ENCRYPTION_KEYS  # список строк, первый — текущий
    fernets = [Fernet(k.encode() if isinstance(k, str) else k) for k in raw_keys]
    return MultiFernet(fernets)


def _search_key() -> bytes:
    """Отдельный ключ для blind index — не должен совпадать с ключом шифрования."""
    key = settings.FIELD_SEARCH_KEY
    return key.encode() if isinstance(key, str) else key


def encrypt(plaintext: str) -> str:
    """Шифрует строку, возвращает base64-строку для хранения в БД."""
    if not plaintext:
        return ""
    token = _get_fernets().encrypt(plaintext.encode())
    return token.decode()


def decrypt(ciphertext: str) -> str:
    """Расшифровывает. Бросает InvalidToken при неверном ключе или порче данных."""
    if not ciphertext:
        return ""
    try:
        return _get_fernets().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Decryption failed: data is corrupted or key is wrong.") from exc


def make_blind_index(plaintext: str) -> str:
    """
    Детерминированный HMAC-SHA256 для поиска без раскрытия plaintext.
    Одинаковый plaintext + key → одинаковый hash → можно фильтровать в БД.
    Атакующий с доступом к БД видит хеши, но не может восстановить plaintext
    (при достаточной энтропии значения — номера карт, паспорта).
    """
    if not plaintext:
        return ""
    digest = hmac.new(_search_key(), plaintext.lower().encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode()
`,
            },
            {
                filename: "core/fields.py",
                code: `"""
Кастомные поля Django ORM: прозрачно шифруют при записи, расшифровывают при чтении.
"""
from django.db import models
from .encryption import decrypt, encrypt, make_blind_index


class EncryptedCharField(models.TextField):
    """
    Хранит зашифрованный текст. В Python-объекте — plaintext.
    В БД — шифротекст (значительно длиннее исходного).

    ВАЖНО: зашифрованное поле нельзя использовать в filter() напрямую.
    Для поиска используйте BlindIndexField рядом с EncryptedCharField.
    """

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt(value)

    def to_python(self, value):
        if value is None or not value:
            return value
        # Значение уже расшифровано если пришло из БД через from_db_value
        return value

    def get_prep_value(self, value):
        """Вызывается перед записью в БД — шифруем."""
        if value is None or value == "":
            return value
        # Если уже зашифровано (например при повторном save) — не шифруем дважды
        if value.startswith("gAAA"):  # Fernet prefix
            return value
        return encrypt(value)


class BlindIndexField(models.CharField):
    """
    Хранит HMAC-хеш для поиска по зашифрованному полю.
    Всегда используется в паре с EncryptedCharField.
    Не содержит plaintext — только детерминированный хеш.
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 64)
        kwargs.setdefault("blank", True)
        kwargs.setdefault("editable", False)
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        # Вычисляем хеш из связанного encrypted поля перед сохранением
        raise NotImplementedError(
            "BlindIndexField.pre_save must be overridden in subclass "
            "to reference the correct encrypted field."
        )
`,
            },
            {
                filename: "payments/models.py",
                code: `"""
Модель с зашифрованными полями карты.
"""
from django.conf import settings
from django.db import models

from core.encryption import decrypt, encrypt, make_blind_index
from core.fields import EncryptedCharField


class PaymentMethod(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Зашифрованные поля
    card_number = EncryptedCharField()        # хранит шифротекст
    card_holder = EncryptedCharField()
    cardholder_passport = EncryptedCharField(blank=True)

    # Blind index для поиска по последним 4 цифрам (low entropy — не используем)
    # Для номера карты целиком blind index безопасен (16 цифр → 10^16 вариантов)
    card_number_idx = models.CharField(max_length=64, blank=True, editable=False,
                                       db_index=True)

    # Последние 4 цифры хранятся открыто — достаточно для UX, не критично
    card_last4 = models.CharField(max_length=4, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Обновляем blind index перед сохранением
        if self.card_number:
            # get_prep_value не вызван ещё — card_number может быть plaintext
            plaintext = self.card_number
            if plaintext.startswith("gAAA"):  # уже зашифровано — декодируем для idx
                plaintext = decrypt(plaintext)
            self.card_number_idx = make_blind_index(plaintext)
            self.card_last4 = plaintext[-4:] if len(plaintext) >= 4 else ""
        super().save(*args, **kwargs)

    @classmethod
    def find_by_card_number(cls, card_number: str):
        """Поиск по номеру карты через blind index — не расшифровывает всё."""
        idx = make_blind_index(card_number)
        return cls.objects.filter(card_number_idx=idx)

    def __str__(self):
        return f"**** **** **** {self.card_last4}"
`,
            },
            {
                filename: "payments/key_rotation.py",
                code: `"""
Ротация ключей шифрования без даунтайма.

Схема:
1. Добавляем новый ключ ПЕРВЫМ в FIELD_ENCRYPTION_KEYS
   (старый остаётся — MultiFernet расшифрует старые данные)
2. Деплоим — новые данные шифруются новым ключом, старые читаются нормально
3. Запускаем migrate_encryption() — перешифровываем старые записи
4. Удаляем старый ключ из настроек
5. Деплоим снова

Шаг 3 выполняется батчами чтобы не блокировать таблицу.
"""
import logging
from django.db import transaction

logger = logging.getLogger(__name__)


def rotate_payment_methods(batch_size: int = 100) -> int:
    """
    Перешифровывает все PaymentMethod новым ключом.
    Возвращает количество обновлённых записей.
    """
    from .models import PaymentMethod
    from core.encryption import decrypt, encrypt

    total = 0
    last_id = 0

    while True:
        batch = list(
            PaymentMethod.objects.filter(pk__gt=last_id).order_by("pk")[:batch_size]
        )
        if not batch:
            break

        with transaction.atomic():
            for pm in batch:
                # from_db_value уже расшифровал поля при загрузке из БД.
                # get_prep_value зашифрует новым ключом при сохранении.
                # Просто save() — MultiFernet сделает всё остальное.
                pm.save(update_fields=["card_number", "card_holder",
                                       "cardholder_passport", "card_number_idx"])
                total += 1

        last_id = batch[-1].pk
        logger.info("Rotated %d records, last_id=%d", total, last_id)

    return total
`,
            },
            {
                filename: "config/settings.py (фрагмент)",
                code: `"""
Ключи шифрования хранятся в переменных окружения — никогда в коде.
Первый ключ в списке — текущий (используется для шифрования).
Остальные — старые (используются только для расшифровки при ротации).

Генерация нового ключа:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import os

# Список ключей: первый — текущий, остальные — для обратной совместимости
FIELD_ENCRYPTION_KEYS = [
    k.strip()
    for k in os.environ.get("FIELD_ENCRYPTION_KEYS", "").split(",")
    if k.strip()
]

# Отдельный ключ для blind index (HMAC)
FIELD_SEARCH_KEY = os.environ.get("FIELD_SEARCH_KEY", "")

if not FIELD_ENCRYPTION_KEYS:
    raise ImproperlyConfigured("FIELD_ENCRYPTION_KEYS must be set in environment.")
if not FIELD_SEARCH_KEY:
    raise ImproperlyConfigured("FIELD_SEARCH_KEY must be set in environment.")
`,
            },
        ],
        explanation: `**MultiFernet для ротации без даунтайма.** \`MultiFernet([new_key, old_key])\` шифрует всегда первым ключом, расшифровывает — любым из списка. Процедура ротации: добавить новый ключ первым → задеплоить (новые данные шифруются новым ключом, старые читаются старым) → батч-перешифровка старых данных → удалить старый ключ из списка → задеплоить снова. Даунтайм: ноль.

**Blind index для поиска по зашифрованным полям.** Fernet недетерминирован: \`encrypt("4111...")\` каждый раз даёт разный шифротекст. Фильтровать по нему нельзя. Решение: рядом с зашифрованным полем хранить HMAC-SHA256 от plaintext. HMAC детерминирован: один и тот же ввод + ключ → один и тот же хеш. Фильтруем по хешу, получаем запись, расшифровываем для отображения. Атакующий с доступом к БД видит хеши, но не может восстановить данные при достаточной энтропии (номер карты — 10¹⁶ вариантов).

**Прозрачность через \`from_db_value\` / \`get_prep_value\`.** \`from_db_value\` вызывается при чтении из БД — возвращает расшифрованный plaintext. \`get_prep_value\` вызывается перед записью — возвращает шифротекст. Для остального кода модель выглядит как обычная: \`pm.card_number\` возвращает plaintext, \`pm.save()\` сохраняет шифротекст.

**Ключи только в переменных окружения.** Жёстко заданные ключи в коде попадают в git-историю и доступны всем, кто имеет доступ к репозиторию. Обязательно читайте ключи из \`os.environ\` и поднимайте \`ImproperlyConfigured\` при их отсутствии — это предотвращает запуск приложения без шифрования.

**Батчевая перешифровка не блокирует таблицу.** Полная перешифровка всех записей одной транзакцией заблокирует таблицу на минуты. Батчи по 100 записей в отдельных транзакциях дают другим запросам возможность работать между батчами. Используйте keyset pagination (\`pk > last_id\`) вместо \`OFFSET\` — стабильнее при параллельных вставках.`,
    },

    {
        id: "django-testing-mocks",
        title: "Тестирование с изоляцией внешних зависимостей",
        task: `Напишите полное тестовое покрытие для сервиса оплаты, который интегрируется с внешним платёжным провайдером, Celery-задачами и email-рассылкой. Используйте: unittest.mock и pytest-mock для внешних вызовов, responses или httpretty для HTTP-запросов, factory_boy для фикстур, freezegun для работы с временем. Покажите разницу между mock, stub, fake и spy.`,
        files: [
            {
                filename: "payments/service.py",
                code: `"""
PaymentService — тестируемый объект.
Интегрируется с: внешним HTTP API, Celery, email.
"""
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

import requests
from django.conf import settings
from django.core.mail import send_mail

from orders.models import Order
from .tasks import send_payment_confirmation

logger = logging.getLogger(__name__)


@dataclass
class PaymentResult:
    success: bool
    transaction_id: str
    amount: int
    processed_at: datetime


class PaymentProviderError(Exception):
    pass


class PaymentService:
    def __init__(self, api_url: str | None = None):
        self.api_url = api_url or settings.PAYMENT_API_URL

    def charge(self, order: Order, card_token: str) -> PaymentResult:
        """
        1. Вызывает внешний платёжный API
        2. Обновляет статус заказа
        3. Ставит Celery-задачу на уведомление
        4. Отправляет email
        """
        response = requests.post(
            f"{self.api_url}/charge",
            json={"amount": order.total_cents, "token": card_token},
            timeout=10,
        )
        if not response.ok:
            raise PaymentProviderError(f"Provider error: {response.status_code}")

        data = response.json()
        result = PaymentResult(
            success=True,
            transaction_id=data["transaction_id"],
            amount=data["amount"],
            processed_at=datetime.now(tz=timezone.utc),
        )

        order.status = "paid"
        order.transaction_id = result.transaction_id
        order.save(update_fields=["status", "transaction_id"])

        send_payment_confirmation.delay(order.pk)

        send_mail(
            subject="Оплата прошла успешно",
            message=f"Заказ #{order.pk} оплачен. Транзакция: {result.transaction_id}",
            from_email="payments@example.com",
            recipient_list=[order.user.email],
        )
        return result
`,
            },
            {
                filename: "tests/factories.py",
                code: `"""
factory_boy: фабрики для создания тестовых данных.

Преимущества перед фикстурами в БД:
- Объекты создаются с разумными дефолтами, переопределяются точечно
- Нет coupling между тестами (каждый тест создаёт свои данные)
- Легко создавать связанные объекты (Order → User → Wallet)
"""
import factory
import factory.fuzzy
from django.contrib.auth import get_user_model
from orders.models import Order
from payments.models import PaymentMethod

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "testpass123")
    is_active = True


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    user = factory.SubFactory(UserFactory)
    status = "pending"
    total_cents = factory.fuzzy.FuzzyInteger(100, 100_000)  # 1–1000 USD

    class Params:
        # Трейт: OrderFactory(paid=True) создаёт оплаченный заказ
        paid = factory.Trait(
            status="paid",
            transaction_id=factory.Sequence(lambda n: f"txn_{n:08d}"),
        )
`,
            },
            {
                filename: "tests/test_payment_service.py",
                code: `"""
Демонстрация четырёх видов тест-двойников:

  Mock  — объект с контролируемым поведением И проверкой вызовов
  Stub  — объект с фиксированным ответом, вызовы не проверяются
  Fake  — работающая упрощённая реализация (in-memory вместо реального API)
  Spy   — реальный объект, который записывает вызовы для последующей проверки
"""
import pytest
import responses as resp_lib
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, call
from freezegun import freeze_time

from payments.service import PaymentService, PaymentProviderError
from .factories import OrderFactory, UserFactory


# ---------------------------------------------------------------------------
# Фикстуры
# ---------------------------------------------------------------------------

@pytest.fixture
def order(db):
    return OrderFactory(total_cents=5000)


@pytest.fixture
def service():
    return PaymentService(api_url="https://pay.example.com")


# ---------------------------------------------------------------------------
# STUB: возвращает фиксированный ответ, вызовы не проверяются
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_charge_success_stub(service, order, mocker):
    """
    Stub: requests.post заменён объектом с фиксированным .json() и .ok=True.
    Нас интересует только итоговое состояние, а не параметры запроса.
    """
    stub_response = MagicMock()
    stub_response.ok = True
    stub_response.json.return_value = {
        "transaction_id": "txn_abc123",
        "amount": 5000,
    }
    mocker.patch("payments.service.requests.post", return_value=stub_response)
    mocker.patch("payments.service.send_payment_confirmation.delay")
    mocker.patch("payments.service.send_mail")

    result = service.charge(order, card_token="tok_test")

    assert result.success is True
    assert result.transaction_id == "txn_abc123"
    order.refresh_from_db()
    assert order.status == "paid"


# ---------------------------------------------------------------------------
# MOCK: контролируемый ответ + проверка вызовов
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_charge_calls_provider_correctly_mock(service, order, mocker):
    """
    Mock: проверяем не только результат, но и то, как именно вызван внешний API.
    """
    mock_post = mocker.patch("payments.service.requests.post")
    mock_post.return_value.ok = True
    mock_post.return_value.json.return_value = {"transaction_id": "txn_xyz", "amount": 5000}
    mocker.patch("payments.service.send_payment_confirmation.delay")
    mocker.patch("payments.service.send_mail")

    service.charge(order, card_token="tok_visa")

    # Проверяем точные параметры вызова — это и отличает mock от stub
    mock_post.assert_called_once_with(
        "https://pay.example.com/charge",
        json={"amount": 5000, "token": "tok_visa"},
        timeout=10,
    )


# ---------------------------------------------------------------------------
# FAKE: упрощённая in-memory реализация вместо реального HTTP
# ---------------------------------------------------------------------------

class FakePaymentProvider:
    """Fake: реальная логика, но без сети. Запоминает все транзакции."""

    def __init__(self):
        self.transactions: dict[str, dict] = {}
        self._counter = 0

    def post(self, url: str, json: dict, timeout: int):
        self._counter += 1
        txn_id = f"fake_txn_{self._counter:04d}"
        self.transactions[txn_id] = json

        response = MagicMock()
        response.ok = True
        response.json.return_value = {"transaction_id": txn_id, "amount": json["amount"]}
        return response


@pytest.mark.django_db
def test_charge_with_fake_provider(service, order, mocker):
    """
    Fake: замена всего HTTP-слоя рабочей in-memory реализацией.
    Позволяет тестировать несколько вызовов с состоянием между ними.
    """
    fake = FakePaymentProvider()
    mocker.patch("payments.service.requests", fake)
    mocker.patch("payments.service.send_payment_confirmation.delay")
    mocker.patch("payments.service.send_mail")

    result = service.charge(order, card_token="tok_test")

    assert result.transaction_id.startswith("fake_txn_")
    assert result.transaction_id in fake.transactions


# ---------------------------------------------------------------------------
# SPY: реальный объект, который записывает вызовы
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_email_sent_on_success_spy(service, order, mocker):
    """
    Spy: send_mail вызывается реально (в тестах Django email бэкенд in-memory),
    но mocker.spy позволяет проверить параметры вызова.
    """
    mocker.patch("payments.service.requests.post").return_value = MagicMock(
        ok=True,
        json=lambda: {"transaction_id": "txn_spy", "amount": 5000},
    )
    mocker.patch("payments.service.send_payment_confirmation.delay")

    # spy оборачивает реальную функцию — она выполняется, но вызов записывается
    spy = mocker.spy(PaymentService, "charge")
    service.charge(order, card_token="tok_test")

    assert spy.call_count == 1


# ---------------------------------------------------------------------------
# responses: декларативный mock HTTP через registered responses
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@resp_lib.activate
def test_charge_with_responses_library(service, order, mocker):
    """
    responses: перехватывает реальные requests.get/post без patch.
    Удобно для сложных сценариев с несколькими HTTP-эндпоинтами.
    """
    resp_lib.add(
        resp_lib.POST,
        "https://pay.example.com/charge",
        json={"transaction_id": "txn_resp_001", "amount": 5000},
        status=200,
    )
    mocker.patch("payments.service.send_payment_confirmation.delay")
    mocker.patch("payments.service.send_mail")

    result = service.charge(order, card_token="tok_resp")

    assert result.transaction_id == "txn_resp_001"


# ---------------------------------------------------------------------------
# freezegun: фиксируем время для детерминированных тестов
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@freeze_time("2024-06-15 12:00:00")
def test_processed_at_timestamp(service, order, mocker):
    """
    freezegun: datetime.now() возвращает фиксированное время.
    Важно для тестов, проверяющих временны́е метки.
    """
    mocker.patch("payments.service.requests.post").return_value = MagicMock(
        ok=True,
        json=lambda: {"transaction_id": "txn_time", "amount": 5000},
    )
    mocker.patch("payments.service.send_payment_confirmation.delay")
    mocker.patch("payments.service.send_mail")

    result = service.charge(order, card_token="tok_time")

    assert result.processed_at.year == 2024
    assert result.processed_at.month == 6
    assert result.processed_at.day == 15


# ---------------------------------------------------------------------------
# Тест ошибки провайдера
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_charge_raises_on_provider_error(service, order, mocker):
    mocker.patch("payments.service.requests.post").return_value = MagicMock(
        ok=False,
        status_code=402,
    )

    with pytest.raises(PaymentProviderError, match="402"):
        service.charge(order, card_token="tok_bad")

    order.refresh_from_db()
    assert order.status == "pending"   # статус не изменился
`,
            },
            {
                filename: "conftest.py",
                code: `"""
pytest конфигурация: общие фикстуры и настройки.
"""
import pytest
from django.conf import settings


@pytest.fixture(autouse=True)
def use_test_email_backend(settings):
    """Все тесты используют in-memory email бэкенд — письма не отправляются."""
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"


@pytest.fixture(autouse=True)
def reset_celery_to_eager(settings):
    """
    CELERY_TASK_ALWAYS_EAGER=True: задачи выполняются синхронно в том же процессе.
    Для unit-тестов не нужен реальный брокер.
    Для интеграционных тестов используйте celery_worker фикстуру (pytest-celery).
    """
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
`,
            },
        ],
        explanation: `**Mock vs Stub vs Fake vs Spy — четыре разных инструмента.** Stub возвращает заготовленный ответ, вызовы не проверяются — используйте когда важен только результат. Mock дополнительно проверяет как именно был сделан вызов (аргументы, количество раз) — используйте для проверки контракта с внешним сервисом. Fake — работающая упрощённая реализация (in-memory база, локальный файловый провайдер) — используйте для сложных сценариев с состоянием. Spy — обёртка над реальным объектом, которая записывает вызовы не изменяя поведение.

**\`mocker.patch\` vs \`responses\`.** \`mocker.patch("payments.service.requests.post")\` патчит объект в конкретном модуле — важно патчить там, где используется, а не там, где определено. Библиотека \`responses\` декларативнее: регистрируете ожидаемые URL и ответы, библиотека перехватывает все запросы через requests. Удобна когда тестируемый код делает несколько HTTP-запросов к разным URL.

**\`factory_boy\` vs фикстуры в БД.** Фикстуры (JSON/YAML дампы) хрупкие: любое изменение схемы ломает их. Factory boy создаёт объекты программно с разумными дефолтами. Трейты (\`OrderFactory(paid=True)\`) позволяют создавать варианты без дублирования. \`SubFactory\` создаёт связанные объекты автоматически — не нужно вручную создавать пользователя перед заказом.

**\`freezegun\` для детерминированных временны́х тестов.** \`datetime.now()\` в реальном коде даёт разные результаты при каждом запуске. \`@freeze_time\` заменяет все вызовы \`datetime.now()\`, \`date.today()\`, \`time.time()\` на фиксированное значение. Работает как декоратор и как context manager. Особенно важно для тестов истечения токенов, дедлайнов, scheduled задач.

**\`CELERY_TASK_ALWAYS_EAGER\` для unit-тестов.** В eager режиме \`.delay()\` выполняет задачу синхронно в том же потоке — не нужен Redis/RabbitMQ. Исключения из задач пробрасываются в тест при \`EAGER_PROPAGATES=True\`. Для интеграционных тестов с реальным брокером — \`celery_worker\` фикстура из \`pytest-celery\`.`,
    },

    {
        id: "django-integration-e2e-tests",
        title: "Интеграционные и e2e тесты",
        task: `Разработайте стратегию интеграционного тестирования для критического пути: регистрация → подтверждение email → оформление заказа → оплата → уведомление. Используйте pytest-django, реальную тестовую БД, celery_worker fixture для async задач. Реализуйте тесты, которые работают как на sqlite (быстро), так и на PostgreSQL (точность). Настройте CI для параллельного запуска.`,
        files: [
            {
                filename: "tests/integration/test_order_flow.py",
                code: `"""
Интеграционный тест критического пути:
  регистрация → email подтверждение → заказ → оплата → уведомление

Использует реальную БД (TransactionTestCase для Celery),
реальные сигналы, реальный email бэкенд (in-memory).
"""
import pytest
from django.core import mail
from django.urls import reverse
from rest_framework.test import APIClient

from tests.factories import OrderFactory, UserFactory


# ---------------------------------------------------------------------------
# Фикстуры
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def registered_user(db):
    """Создаёт пользователя и возвращает вместе с паролем для аутентификации."""
    password = "StrongPass!99"
    user = UserFactory(password=None, is_active=False)
    user.set_password(password)
    user.save()
    return user, password


# ---------------------------------------------------------------------------
# Шаг 1: Регистрация и подтверждение email
# ---------------------------------------------------------------------------

@pytest.mark.django_db(transaction=True)
def test_registration_sends_confirmation_email(api_client, mailoutbox):
    payload = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "StrongPass!99",
    }
    response = api_client.post(reverse("api:register"), payload)

    assert response.status_code == 201
    assert len(mailoutbox) == 1
    assert "подтвердите" in mailoutbox[0].subject.lower()
    assert "new@example.com" in mailoutbox[0].to


@pytest.mark.django_db(transaction=True)
def test_email_confirmation_activates_user(api_client, registered_user):
    user, _ = registered_user
    assert not user.is_active

    # Генерируем токен подтверждения
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.encoding import force_bytes
    from django.utils.http import urlsafe_base64_encode

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    response = api_client.get(reverse("api:confirm-email", kwargs={"uid": uid, "token": token}))

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.is_active


# ---------------------------------------------------------------------------
# Шаг 2: Аутентификация и оформление заказа
# ---------------------------------------------------------------------------

@pytest.mark.django_db(transaction=True)
def test_authenticated_user_can_create_order(api_client, registered_user):
    user, password = registered_user
    user.is_active = True
    user.save()

    # Получаем JWT токен
    token_response = api_client.post(
        reverse("api:token-obtain"),
        {"username": user.username, "password": password},
    )
    assert token_response.status_code == 200
    access = token_response.data["access"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    order_response = api_client.post(
        reverse("api:orders-list"),
        {"items": [{"product_id": 1, "quantity": 2}]},
    )
    assert order_response.status_code == 201
    assert order_response.data["status"] == "pending"


# ---------------------------------------------------------------------------
# Шаг 3: Оплата (с мокированным провайдером) + Celery
# ---------------------------------------------------------------------------

@pytest.mark.django_db(transaction=True)
def test_payment_triggers_notification_task(
    api_client,
    registered_user,
    celery_worker,       # pytest-celery: реальный воркер в фоне
    mailoutbox,
    mocker,
):
    user, password = registered_user
    user.is_active = True
    user.save()
    order = OrderFactory(user=user, total_cents=9900, status="pending")

    # Мокируем внешний платёжный API — не хотим реальных списаний в тестах
    mocker.patch("payments.service.requests.post").return_value = type(
        "R", (), {"ok": True, "json": lambda self: {"transaction_id": "test_txn_001", "amount": 9900}}
    )()

    token_response = api_client.post(
        reverse("api:token-obtain"),
        {"username": user.username, "password": password},
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}")

    pay_response = api_client.post(
        reverse("api:orders-pay", kwargs={"pk": order.pk}),
        {"card_token": "tok_integration_test"},
    )
    assert pay_response.status_code == 200

    order.refresh_from_db()
    assert order.status == "paid"
    assert order.transaction_id == "test_txn_001"

    # Celery задача уведомления выполнилась в реальном воркере — проверяем email
    import time
    time.sleep(1)  # ждём завершения async задачи
    assert len(mailoutbox) >= 1
    assert any("оплат" in m.subject.lower() for m in mailoutbox)
`,
            },
            {
                filename: "tests/conftest.py",
                code: `"""
Конфигурация pytest для поддержки SQLite (быстро) и PostgreSQL (точность).
Выбор БД через переменную окружения.
"""
import pytest
from django.conf import settings


def pytest_configure(config):
    """
    Автоматически выбирает БД на основе TEST_DB переменной окружения.
    pytest                  → SQLite (быстро, для локальной разработки)
    TEST_DB=postgres pytest → PostgreSQL (точность, для CI)
    """
    import os
    if os.environ.get("TEST_DB") == "postgres":
        settings.DATABASES["default"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("TEST_PG_DB", "test_myapp"),
            "USER": os.environ.get("TEST_PG_USER", "postgres"),
            "PASSWORD": os.environ.get("TEST_PG_PASSWORD", ""),
            "HOST": os.environ.get("TEST_PG_HOST", "localhost"),
            "PORT": os.environ.get("TEST_PG_PORT", "5432"),
            "TEST": {"NAME": os.environ.get("TEST_PG_DB", "test_myapp")},
        }


@pytest.fixture(scope="session")
def django_db_setup(django_test_environment, django_db_blocker):
    """Настройка тестовой БД: создаём один раз на сессию для скорости."""
    with django_db_blocker.unblock():
        from django.test.utils import setup_test_environment
        setup_test_environment()


@pytest.fixture
def mailoutbox(settings):
    """Django in-memory email бэкенд + доступ к отправленным письмам."""
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from django.core import mail
    mail.outbox = []
    yield mail.outbox
    mail.outbox = []
`,
            },
            {
                filename: "pytest.ini",
                code: `[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = tests/test_*.py tests/integration/test_*.py
python_classes = Test*
python_functions = test_*

# Маркеры для группировки тестов
markers =
    unit: быстрые unit-тесты без БД
    integration: интеграционные тесты с реальной БД
    e2e: полные end-to-end тесты
    slow: медленные тесты (исключайте при разработке: pytest -m "not slow")

# Параллельный запуск через pytest-xdist
# Не используйте с celery_worker фикстурой — Celery + xdist требует настройки
addopts = --strict-markers -q
`,
            },
            {
                filename: ".github/workflows/ci.yml",
                code: `name: CI

on: [push, pull_request]

jobs:
  # Быстрые unit-тесты на SQLite — запускаются при каждом push
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements-dev.txt
      - name: Run unit tests (SQLite, parallel)
        run: pytest -m "unit" -n auto  # pytest-xdist: parallel по CPU

  # Интеграционные тесты на PostgreSQL — параллельно с unit
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: test_myapp
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: --health-cmd "redis-cli ping" --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements-dev.txt
      - name: Run integration tests (PostgreSQL)
        env:
          TEST_DB: postgres
          TEST_PG_PASSWORD: testpass
          CELERY_BROKER_URL: redis://localhost:6379/0
        run: pytest -m "integration" -n 4  # 4 параллельных воркера
`,
            },
        ],
        explanation: `**TransactionTestCase для Celery.** Стандартный \`TestCase\` Django оборачивает каждый тест в транзакцию и откатывает её — быстро и изолировано. Но Celery-воркер работает в отдельном процессе и не видит незакоммиченные данные. \`@pytest.mark.django_db(transaction=True)\` использует \`TransactionTestCase\`: данные реально коммитятся, воркер их видит, но БД нужно очищать после теста (медленнее).

**\`celery_worker\` фикстура из pytest-celery.** Запускает реальный Celery-воркер в фоновом треде на время теста. Задачи выполняются асинхронно — нужен \`time.sleep()\` или \`result.get(timeout=5)\` для ожидания. Более стабильная альтернатива: \`CELERY_TASK_ALWAYS_EAGER=True\` для unit-тестов и реальный воркер только для интеграционных.

**SQLite vs PostgreSQL в тестах.** SQLite — встроен в Python, тесты запускаются без инфраструктуры, в 2–3x быстрее. Ограничения: нет \`JSONB\`, нет некоторых типов индексов, другой SQL диалект, нет транзакционной семантики некоторых операций. PostgreSQL — точность: тесты проверяют ровно то, что будет в production. Стратегия: unit-тесты на SQLite (80% скорости), интеграционные на PostgreSQL (точность критического пути).

**pytest-xdist для параллельного запуска.** \`-n auto\` запускает по одному процессу на CPU. Каждый процесс получает отдельную тестовую БД (\`test_myapp_gw0\`, \`test_myapp_gw1\`, ...). Не совместим с тестами, разделяющими глобальное состояние (например singleton-кэши). Для CI: разделите unit и integration в отдельные jobs — они запускаются параллельно на разных раннерах.

**\`mailoutbox\` фикстура.** Django in-memory email бэкенд сохраняет письма в \`django.core.mail.outbox\` — реальная отправка не происходит. \`mailoutbox\` фикстура сбрасывает список до и после теста. Позволяет проверять subject, recipients, body без SMTP-сервера.`,
    },

    {
        id: "django-load-testing",
        title: "Нагрузочное тестирование и benchmarking",
        task: `Реализуйте нагрузочный тест для API endpoint с использованием locust. Сценарий: 1000 пользователей, каждый выполняет: аутентификацию, просмотр каталога (с пагинацией), добавление в корзину, оформление заказа. Определите bottleneck, настройте мониторинг во время теста (Prometheus + Grafana), задокументируйте результаты и предложите план оптимизации.`,
        files: [
            {
                filename: "loadtest/locustfile.py",
                code: `"""
Locust: нагрузочный тест сценария покупки.

Запуск:
  locust -f loadtest/locustfile.py --host=http://localhost:8000
  # → открыть http://localhost:8089 для UI

Headless (CI):
  locust -f loadtest/locustfile.py \\
    --host=http://api.example.com \\
    --users=1000 --spawn-rate=50 \\
    --run-time=5m --headless \\
    --html=report.html --csv=results
"""
import random
import string

from locust import HttpUser, TaskSet, between, events, task


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

def random_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase, k=8))
    return f"loadtest_{suffix}@example.com"


# ---------------------------------------------------------------------------
# TaskSet: логика одного пользователя
# ---------------------------------------------------------------------------

class ShopTaskSet(TaskSet):
    """
    Задачи выполняются в порядке объявления через on_start.
    Веса @task(N) задают относительную частоту вызова.
    """

    def on_start(self):
        """Вызывается при старте каждого виртуального пользователя."""
        self.token = None
        self.cart_id = None
        self._register_and_login()

    def _register_and_login(self):
        email = random_email()
        password = "LoadTest!99"

        self.client.post("/api/auth/register/", json={
            "email": email, "password": password, "username": email,
        })

        resp = self.client.post("/api/auth/token/", json={
            "username": email, "password": password,
        })
        if resp.status_code == 200:
            self.token = resp.json().get("access")
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})

    @task(5)
    def browse_catalog(self):
        """Высокочастотная задача: просмотр каталога с пагинацией."""
        page = random.randint(1, 10)
        with self.client.get(
            f"/api/catalog/?page={page}&page_size=20",
            name="/api/catalog/",   # group URL для агрегации статистики
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"Catalog returned {resp.status_code}")
            elif "results" not in resp.json():
                resp.failure("Missing 'results' in response")

    @task(2)
    def view_product(self):
        """Просмотр карточки товара."""
        product_id = random.randint(1, 500)
        self.client.get(
            f"/api/catalog/{product_id}/",
            name="/api/catalog/<id>/",
        )

    @task(2)
    def add_to_cart(self):
        """Добавление в корзину."""
        product_id = random.randint(1, 500)
        resp = self.client.post(
            "/api/cart/items/",
            json={"product_id": product_id, "quantity": 1},
            name="/api/cart/items/",
        )
        if resp.status_code == 201:
            self.cart_id = resp.json().get("cart_id")

    @task(1)
    def checkout(self):
        """Редкая задача: оформление заказа."""
        if not self.cart_id:
            return
        with self.client.post(
            "/api/orders/",
            json={"cart_id": self.cart_id, "card_token": "tok_loadtest"},
            name="/api/orders/",
            catch_response=True,
        ) as resp:
            if resp.status_code not in (200, 201):
                resp.failure(f"Checkout failed: {resp.status_code}")
            else:
                self.cart_id = None  # корзина использована


class ShopUser(HttpUser):
    tasks = [ShopTaskSet]
    wait_time = between(1, 3)      # пауза между задачами: 1–3 секунды


# ---------------------------------------------------------------------------
# Custom метрики — отправка в Prometheus через pushgateway
# ---------------------------------------------------------------------------

@events.request.add_listener
def on_request(request_type, name, response_time, response_length,
               exception, context, **kwargs):
    """Хук для отправки метрик в Prometheus Pushgateway после каждого запроса."""
    import os
    if not os.environ.get("PROMETHEUS_PUSHGATEWAY"):
        return

    from prometheus_client import CollectorRegistry, Gauge, push_to_gateway
    registry = CollectorRegistry()
    g = Gauge("locust_response_time_ms", "Response time",
              ["method", "name"], registry=registry)
    g.labels(method=request_type, name=name).set(response_time)
    try:
        push_to_gateway(
            os.environ["PROMETHEUS_PUSHGATEWAY"],
            job="locust",
            registry=registry,
        )
    except Exception:
        pass
`,
            },
            {
                filename: "loadtest/prometheus.yml",
                code: `# Prometheus конфигурация для сбора метрик во время нагрузочного теста.
# Scrape: Django (django-prometheus), PostgreSQL (postgres_exporter), Redis (redis_exporter).

global:
  scrape_interval: 5s      # частый сбор для нагрузочных тестов

scrape_configs:
  - job_name: django
    static_configs:
      - targets: ["app:8000"]
    metrics_path: /metrics   # django-prometheus экспортирует по этому пути

  - job_name: postgresql
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: redis
    static_configs:
      - targets: ["redis-exporter:9121"]

  - job_name: locust_pushgateway
    honor_labels: true
    static_configs:
      - targets: ["pushgateway:9091"]
`,
            },
            {
                filename: "loadtest/analysis.md",
                code: `# Результаты нагрузочного теста и план оптимизации

## Параметры теста
- Пользователи: 1000 (spawn rate: 50/s)
- Длительность: 5 минут
- Сервер: 4 CPU, 8GB RAM, Django 5.x + Gunicorn 4 воркера

## Результаты (до оптимизации)

| Endpoint              | Avg (ms) | p95 (ms) | p99 (ms) | RPS  | Error % |
|-----------------------|----------|----------|----------|------|---------|
| GET /api/catalog/     | 850      | 2100     | 4500     | 180  | 2.3%    |
| GET /api/catalog/<id> | 120      | 380      | 800      | 450  | 0.1%    |
| POST /api/cart/items/ | 95       | 250      | 600      | 380  | 0.0%    |
| POST /api/orders/     | 3200     | 8000     | 15000    | 45   | 8.1%    |
| POST /api/auth/token/ | 180      | 420      | 900      | 200  | 0.2%    |

## Выявленные bottleneck-и

### 1. GET /api/catalog/ — медленно (850ms avg)
Причина: отсутствие кэша + N+1 запросы.
EXPLAIN ANALYZE показал: Seq Scan на таблице 500K товаров без индекса на is_active.

### 2. POST /api/orders/ — очень медленно (3200ms) + 8% ошибок
Причина:
  a) Синхронная отправка email блокирует запрос (~1500ms SMTP)
  b) Pool exhaustion: при 1000 юзерах пул соединений (20) исчерпан
  c) Нет retry при временных DB ошибках

### 3. Connection pool exhausted
pg_stat_activity показал >100 idle соединений от Django.
PgBouncer отсутствовал в конфигурации.

## План оптимизации

### Быстрые wins (1–2 дня)
1. Добавить Redis-кэш для /api/catalog/ с TTL 60s → ожидаемое улучшение: 850ms → 50ms
2. Индекс на (is_active, created_at) → устранит Seq Scan
3. Вынести send_mail в Celery-задачу → /api/orders/ 3200ms → ~800ms

### Среднесрочные (1 неделя)
4. Добавить PgBouncer (transaction mode, pool_size=30) → устранит pool exhaustion
5. select_related + prefetch_related в catalog view → устранит N+1
6. CDN для статики и изображений товаров

### Долгосрочные (1 месяц)
7. Горизонтальное масштабирование: 4 воркера → 3 инстанса × 4 воркера
8. Read replica для catalog запросов
9. Elasticsearch для поиска по каталогу

## Результаты после оптимизации (ожидаемые)

| Endpoint              | Avg (ms) | p95 (ms) | RPS   |
|-----------------------|----------|----------|-------|
| GET /api/catalog/     | 45       | 120      | 2000  |
| POST /api/orders/     | 750      | 1800     | 180   |
`,
            },
            {
                filename: "config/settings.py (django-prometheus)",
                code: `"""
django-prometheus: экспорт метрик для Grafana/Prometheus.
Метрики: HTTP запросы (count, latency), ORM запросы (count, latency),
         cache hits/misses, кастомные метрики приложения.
"""
INSTALLED_APPS += ["django_prometheus"]

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    # ... остальные middleware ...
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

# urls.py — добавьте эндпоинт метрик:
# from django_prometheus import exports
# urlpatterns += [path("metrics", exports.ExportToDjangoView, name="prometheus-django-metrics")]

# Кастомные метрики приложения
from prometheus_client import Counter, Histogram

orders_created = Counter(
    "app_orders_created_total",
    "Total orders created",
    ["status"],
)

payment_duration = Histogram(
    "app_payment_duration_seconds",
    "Time spent processing payment",
    buckets=[.1, .25, .5, 1.0, 2.5, 5.0, 10.0],
)

# Использование в коде:
# orders_created.labels(status="paid").inc()
# with payment_duration.time():
#     result = payment_service.charge(order, token)
`,
            },
        ],
        explanation: `**Веса задач через \`@task(N)\` моделируют реальный трафик.** В реальном приложении просмотр каталога происходит в 5× чаще, чем оформление заказа. \`@task(5)\` для каталога и \`@task(1)\` для checkout воспроизводят это соотношение. Нагрузочный тест с равномерным распределением задач даёт нереалистичную картину.

**\`catch_response=True\` для кастомной валидации.** По умолчанию Locust считает ответ успешным при HTTP 2xx. \`catch_response=True\` позволяет пометить ответ как ошибку даже при 200, если содержимое неожиданное (\`resp.failure("Missing results")\`). Важно для проверки контракта API: HTTP 200 с пустым body или неверной схемой — тоже баг.

**\`name\` параметр для группировки статистики.** Без \`name\` URL \`/api/catalog/1/\`, \`/api/catalog/2/\`, ... будут отдельными строками в статистике — нечитаемо. \`name="/api/catalog/<id>/"\` группирует все запросы под одним именем. Обязательно используйте для параметризованных URL.

**Анализ результатов: p95 важнее среднего.** Среднее значение скрывает выбросы. p95=2100ms при avg=850ms означает: каждый 20-й пользователь ждёт >2 секунды. p99=4500ms — каждый 100-й ждёт >4.5 секунды. При 1000 пользователях это 10 человек одновременно с критическим временем ожидания. SLA обычно задаётся через p95/p99.

**Prometheus + django-prometheus для корреляции.** Grafana дашборд во время нагрузочного теста показывает одновременно: RPS Locust, latency эндпоинтов, количество SQL-запросов (django-prometheus), количество соединений к БД (postgres_exporter). Корреляция по времени позволяет точно установить причину деградации: рост latency совпадает с ростом active DB connections → bottleneck в пуле соединений.`,
    },

    {
        id: "django-docker-kubernetes",
        title: "Django в Docker и Kubernetes",
        task: `Контейнеризируйте Django-приложение для production. Реализуйте: многоэтапную сборку Docker-образа (minimal production image), отдельные контейнеры для web, celery worker, celery beat, flower, настройку health checks и readiness/liveness probes, graceful shutdown (обработка SIGTERM), управление Django management командами в K8s (миграции как init containers или Jobs).`,
        files: [
            {
                filename: "Dockerfile",
                code: `# =============================================================================
# Stage 1: builder — устанавливаем зависимости, компилируем wheels
# =============================================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Системные зависимости для сборки (psycopg2, cryptography и т.д.)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc libpq-dev libffi-dev && \\
    rm -rf /var/lib/apt/lists/*

# Копируем только requirements — кэш слоя сохраняется при изменении кода
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /wheels -r requirements.txt


# =============================================================================
# Stage 2: production — минимальный образ без инструментов сборки
# =============================================================================
FROM python:3.12-slim AS production

# Создаём непривилегированного пользователя
RUN groupadd --gid 1001 appgroup && \\
    useradd --uid 1001 --gid appgroup --no-create-home appuser

WORKDIR /app

# Только runtime зависимости (libpq для psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpq5 curl && \\
    rm -rf /var/lib/apt/lists/*

# Копируем pre-built wheels из builder — компилятор в production не нужен
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*.whl && \\
    rm -rf /wheels

COPY --chown=appuser:appgroup . .

# Собираем static files (нельзя делать в runtime — нет доступа на запись)
RUN python manage.py collectstatic --noinput

USER appuser

# Gunicorn с обработчиком SIGTERM (graceful shutdown)
# --timeout 30: воркер получает 30s для завершения текущего запроса
# --graceful-timeout 20: при SIGTERM дополнительные 20s до SIGKILL
CMD ["gunicorn", "config.wsgi:application", \\
     "--bind", "0.0.0.0:8000", \\
     "--workers", "4", \\
     "--timeout", "30", \\
     "--graceful-timeout", "20", \\
     "--access-logfile", "-", \\
     "--error-logfile", "-"]

EXPOSE 8000

# Docker health check (используется в docker-compose, не в K8s)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD curl -f http://localhost:8000/health/ || exit 1
`,
            },
            {
                filename: "docker-compose.prod.yml",
                code: `version: "3.9"

x-app-common: &app-common
  image: myapp:latest
  env_file: .env.prod
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy

services:
  # Миграции запускаются один раз перед стартом web
  migrate:
    <<: *app-common
    command: python manage.py migrate --noinput
    restart: "no"

  web:
    <<: *app-common
    ports: ["8000:8000"]
    depends_on:
      migrate:
        condition: service_completed_successfully
    restart: unless-stopped

  celery-worker:
    <<: *app-common
    command: celery -A config worker --loglevel=info --concurrency=4
    restart: unless-stopped

  celery-beat:
    <<: *app-common
    command: celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    restart: unless-stopped

  flower:
    <<: *app-common
    command: celery -A config flower --port=5555
    ports: ["5555:5555"]
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    secrets: [pg_password]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  pgdata:

secrets:
  pg_password:
    file: ./secrets/pg_password.txt
`,
            },
            {
                filename: "k8s/deployment.yaml",
                code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: django-web
  labels:
    app: django
    component: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: django
      component: web
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1         # максимум +1 pod сверх replicas при обновлении
      maxUnavailable: 0   # ноль pod недоступны в любой момент (zero-downtime)
  template:
    metadata:
      labels:
        app: django
        component: web
    spec:
      # Время на graceful shutdown: terminationGracePeriodSeconds > gunicorn graceful-timeout
      terminationGracePeriodSeconds: 60

      # Миграции как Init Container: выполняются до старта web pod-а
      initContainers:
        - name: migrate
          image: myapp:latest
          command: ["python", "manage.py", "migrate", "--noinput"]
          envFrom:
            - secretRef:
                name: django-secrets
            - configMapRef:
                name: django-config

      containers:
        - name: web
          image: myapp:latest
          ports:
            - containerPort: 8000

          envFrom:
            - secretRef:
                name: django-secrets
            - configMapRef:
                name: django-config

          # Readiness probe: pod получает трафик только когда готов
          # Проверяет не только "жив", но и "может обрабатывать запросы"
          readinessProbe:
            httpGet:
              path: /health/ready/
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3

          # Liveness probe: перезапускает pod если он завис
          # Менее строгий endpoint — проверяет только что процесс живой
          livenessProbe:
            httpGet:
              path: /health/live/
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 5

          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"

          # SIGTERM → gunicorn graceful shutdown → SIGKILL через 60s
          lifecycle:
            preStop:
              exec:
                command: ["sleep", "5"]   # даём время load balancer убрать pod из rotation

      # Не запускаем два pod на одной ноде — защита от single point of failure
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: django
                topologyKey: kubernetes.io/hostname
`,
            },
            {
                filename: "k8s/celery-worker.yaml",
                code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: django
      component: celery-worker
  template:
    metadata:
      labels:
        app: django
        component: celery-worker
    spec:
      terminationGracePeriodSeconds: 120   # Celery нужно больше времени чем web
      containers:
        - name: worker
          image: myapp:latest
          command:
            - celery
            - -A
            - config
            - worker
            - --loglevel=info
            - --concurrency=4
            # --max-tasks-per-child: предотвращает утечки памяти
            - --max-tasks-per-child=1000
          envFrom:
            - secretRef:
                name: django-secrets
            - configMapRef:
                name: django-config
          # Celery сам обрабатывает SIGTERM: заканчивает текущие задачи, не берёт новые
          # livenessProbe для воркера — проверяем что процесс не завис
          livenessProbe:
            exec:
              command:
                - celery
                - -A
                - config
                - inspect
                - ping
                - -d
                - "celery@$(hostname)"
            initialDelaySeconds: 30
            periodSeconds: 60
            timeoutSeconds: 10
          resources:
            requests:
              memory: "512Mi"
              cpu: "200m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
---
# Celery Beat — только один экземпляр (иначе задачи дублируются)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-beat
spec:
  replicas: 1   # ВСЕГДА 1 — Beat не масштабируется горизонтально
  selector:
    matchLabels:
      app: django
      component: celery-beat
  template:
    metadata:
      labels:
        app: django
        component: celery-beat
    spec:
      containers:
        - name: beat
          image: myapp:latest
          command:
            - celery
            - -A
            - config
            - beat
            - --loglevel=info
            - --scheduler
            - django_celery_beat.schedulers:DatabaseScheduler
          envFrom:
            - secretRef:
                name: django-secrets
            - configMapRef:
                name: django-config
`,
            },
            {
                filename: "core/views_health.py",
                code: `"""
Два отдельных health check эндпоинта для K8s:

  /health/live/   — liveness: процесс жив? (не завис)
                    Минимальная проверка — только что сервер отвечает.
                    Падение → K8s перезапустит pod.

  /health/ready/  — readiness: готов принимать трафик?
                    Проверяет БД, Redis, миграции.
                    Падение → K8s убирает pod из rotation (не перезапускает).

Разделение важно: readiness может падать временно (БД недоступна 5s),
liveness падает только при deadlock или OOM.
"""
from django.db import connection, OperationalError
from django.core.cache import cache
from django.http import JsonResponse
from django.views import View


class LivenessView(View):
    """Минимальная проверка: сервер жив."""
    def get(self, request):
        return JsonResponse({"status": "ok"})


class ReadinessView(View):
    """Полная проверка: все зависимости доступны."""
    def get(self, request):
        checks = {}

        # БД
        try:
            with connection.cursor() as cur:
                cur.execute("SELECT 1")
            checks["db"] = "ok"
        except OperationalError as exc:
            checks["db"] = f"error: {exc}"

        # Redis (cache)
        try:
            cache.set("_health", "1", timeout=5)
            assert cache.get("_health") == "1"
            checks["cache"] = "ok"
        except Exception as exc:
            checks["cache"] = f"error: {exc}"

        # Миграции применены
        try:
            from django.db.migrations.executor import MigrationExecutor
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            checks["migrations"] = "ok" if not plan else f"pending: {len(plan)}"
        except Exception as exc:
            checks["migrations"] = f"error: {exc}"

        all_ok = all(v == "ok" for v in checks.values())
        status_code = 200 if all_ok else 503
        return JsonResponse({"status": "ok" if all_ok else "degraded", **checks},
                            status=status_code)
`,
            },
        ],
        explanation: `**Многоэтапная сборка: размер имеет значение.** Builder stage устанавливает gcc, libpq-dev и компилирует C-расширения (psycopg2, cryptography) в .whl файлы. Production stage — минимальный образ: только runtime библиотеки (libpq5), pre-built wheels, никакого компилятора. Итоговый образ меньше в 2–3 раза (800MB → 250MB), меньше attack surface — нет gcc для компиляции эксплоитов.

**Init Container vs Job для миграций.** Init Container: миграции выполняются перед каждым pod-ом — гарантирует применение перед стартом web, но при 3 репликах миграция запустится 3 раза (идемпотентно, но неэффективно). K8s Job: запускается один раз как часть pipeline, надёжнее для production. Компромисс: Init Container проще в настройке, Job правильнее архитектурно.

**Readiness vs Liveness probe — принципиальная разница.** Liveness падает → K8s убивает и перезапускает pod (SIGTERM → ждёт → SIGKILL). Readiness падает → pod убирается из Service endpoints, перестаёт получать трафик, но не перезапускается. Если сделать один probe для обоих — временная недоступность БД вызовет каскадный перезапуск всех pod-ов и thundering herd при восстановлении БД.

**Graceful shutdown: цепочка таймаутов.** K8s отправляет SIGTERM → \`preStop: sleep 5\` (load balancer убирает pod из rotation) → Gunicorn \`graceful-timeout=20\` (завершает in-flight запросы) → \`terminationGracePeriodSeconds=60\` (максимальное ожидание K8s до SIGKILL). Каждый следующий таймаут должен быть больше предыдущего. \`maxUnavailable: 0\` в rolling update гарантирует: старый pod убирается только после того как новый прошёл readiness probe.

**Celery Beat: всегда 1 реплика.** Beat является единственным планировщиком — если запустить 2 реплики, каждая задача будет поставлена в очередь дважды. В K8s нельзя защититься через distributed lock на уровне Beat. Альтернатива для HA: \`redbeat\` (Beat scheduler на базе Redis с distributed lock).`,
    },

    {
        id: "django-observability",
        title: "Observability: логирование, метрики, трейсинг",
        task: `Настройте полноценный observability-стек для Django-приложения: структурированное логирование через structlog с корреляцией по request_id, метрики через django-prometheus (latency, error rate, DB query count, cache hit rate), distributed tracing через OpenTelemetry с экспортом в Jaeger или Tempo, алерты на аномалии (error rate > 1%, p99 latency > 1s).`,
        files: [
            {
                filename: "core/logging_config.py",
                code: `"""
structlog: структурированное логирование в JSON.

Обычный logging:
  [2024-06-15 12:00:01] ERROR views.py:42 Payment failed

structlog с контекстом:
  {"event":"payment_failed","level":"error","request_id":"abc-123",
   "user_id":42,"order_id":99,"amount":5000,"exc":"timeout","timestamp":"..."}

JSON-логи индексируются Elasticsearch/Loki — быстрый поиск по любому полю.
"""
import logging
import structlog


def configure_structlog():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,     # добавляет request_id и др. из контекста
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),          # → JSON строка
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
    )


# Использование:
# import structlog
# log = structlog.get_logger(__name__)
# log.info("payment_processed", order_id=42, amount=5000, transaction_id="txn_abc")
`,
            },
            {
                filename: "core/middleware.py",
                code: `"""
RequestIdMiddleware: генерирует уникальный request_id и привязывает к structlog контексту.
Все логи в рамках одного запроса будут содержать одинаковый request_id —
можно отфильтровать в Kibana/Grafana Loki всю цепочку событий одного запроса.
"""
import uuid
import time

import structlog
from django.utils.deprecation import MiddlewareMixin
from prometheus_client import Counter, Histogram

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Prometheus метрики
# ---------------------------------------------------------------------------

REQUEST_COUNT = Counter(
    "django_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "django_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[.01, .025, .05, .1, .25, .5, 1.0, 2.5, 5.0],
)

ERROR_COUNT = Counter(
    "django_http_errors_total",
    "Total HTTP 5xx errors",
    ["method", "endpoint"],
)


class ObservabilityMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # request_id: берём из заголовка (если есть upstream proxy) или генерируем
        request_id = (
            request.headers.get("X-Request-Id")
            or request.headers.get("X-Correlation-Id")
            or str(uuid.uuid4())
        )
        request.request_id = request_id
        request._start_time = time.perf_counter()

        # Привязываем к structlog context — все последующие логи в этом запросе
        # автоматически включат request_id, user_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.path,
            user_id=getattr(request.user, "id", None),
        )

    def process_response(self, request, response):
        elapsed = time.perf_counter() - getattr(request, "_start_time", time.perf_counter())
        endpoint = self._get_endpoint(request)

        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=endpoint,
            status=response.status_code,
        ).inc()

        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=endpoint,
        ).observe(elapsed)

        if response.status_code >= 500:
            ERROR_COUNT.labels(method=request.method, endpoint=endpoint).inc()
            logger.error(
                "request_failed",
                status=response.status_code,
                duration_ms=round(elapsed * 1000),
            )
        else:
            logger.info(
                "request_completed",
                status=response.status_code,
                duration_ms=round(elapsed * 1000),
            )

        response["X-Request-Id"] = getattr(request, "request_id", "")
        return response

    @staticmethod
    def _get_endpoint(request) -> str:
        """Нормализует URL убирая ID из пути: /api/orders/42/ → /api/orders/<id>/"""
        try:
            from django.urls import resolve
            match = resolve(request.path)
            return match.route or request.path
        except Exception:
            return request.path
`,
            },
            {
                filename: "core/tracing.py",
                code: `"""
OpenTelemetry: distributed tracing для отслеживания пути запроса
через несколько сервисов (Django → Celery → внешний API).

Трейс: дерево span-ов.
  Span = одна операция с началом, концом, атрибутами и статусом.
  Все span-ы одного запроса связаны через trace_id.

Экспорт в Jaeger (для разработки) или Tempo (production с Grafana).
"""
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_tracing(service_name: str = "django-app", otlp_endpoint: str = ""):
    """
    Инициализируем OTel провайдер. Вызывать один раз при старте приложения
    (например в AppConfig.ready() или settings.py).

    Auto-instrumentation покрывает:
      - Django: все HTTP запросы → span-ы с атрибутами (метод, URL, статус)
      - psycopg2: все SQL запросы → span-ы с текстом запроса
      - Redis: все команды → span-ы
      - Celery: задачи → span-ы, связанные с родительским HTTP span-ом
    """
    resource = Resource.create({"service.name": service_name})
    provider = TracerProvider(resource=resource)

    if otlp_endpoint:
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))

    trace.set_tracer_provider(provider)

    DjangoInstrumentor().instrument()
    Psycopg2Instrumentor().instrument(enable_commenter=True)  # добавляет trace_id в SQL комментарии
    RedisInstrumentor().instrument()
    CeleryInstrumentor().instrument()

    return provider


def get_tracer(name: str = "app"):
    return trace.get_tracer(name)


# ---------------------------------------------------------------------------
# Кастомные span-ы для бизнес-логики
# ---------------------------------------------------------------------------

def trace_payment(order_id: int, amount: int):
    """Context manager для трейсинга операции оплаты."""
    tracer = get_tracer()
    return tracer.start_as_current_span(
        "payment.charge",
        attributes={
            "order.id": order_id,
            "payment.amount": amount,
        },
    )


# Использование:
# with trace_payment(order.pk, order.total_cents):
#     result = payment_service.charge(order, token)
`,
            },
            {
                filename: "config/apps.py",
                code: `"""
Инициализация observability-стека при старте Django.
"""
import os
from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "core"

    def ready(self):
        from core.logging_config import configure_structlog
        configure_structlog()

        otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "")
        if otlp_endpoint:
            from core.tracing import setup_tracing
            setup_tracing(
                service_name=os.environ.get("OTEL_SERVICE_NAME", "django-app"),
                otlp_endpoint=otlp_endpoint,
            )
`,
            },
            {
                filename: "alerting/prometheus-rules.yaml",
                code: `# Prometheus alerting rules для Django-приложения.
# Устанавливается в кластере через PrometheusRule CRD (kube-prometheus-stack).

groups:
  - name: django.alerts
    interval: 30s
    rules:

      # Error rate > 1% за последние 5 минут
      - alert: HighErrorRate
        expr: |
          sum(rate(django_http_errors_total[5m]))
          /
          sum(rate(django_http_requests_total[5m])) > 0.01
        for: 2m     # алерт срабатывает только если условие выполняется 2+ минуты
        labels:
          severity: warning
        annotations:
          summary: "High HTTP error rate: {{ $value | humanizePercentage }}"
          description: "Error rate exceeded 1% for 2 minutes."

      # p99 latency > 1s
      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99,
            sum(rate(django_http_request_duration_seconds_bucket[5m])) by (le, endpoint)
          ) > 1.0
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High p99 latency on {{ $labels.endpoint }}"
          description: "p99 latency is {{ $value }}s (threshold: 1s)"

      # Нет трафика (возможно проблема с деплоем)
      - alert: NoTraffic
        expr: sum(rate(django_http_requests_total[5m])) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "No HTTP traffic for 5 minutes"

      # Много pending Celery задач
      - alert: CeleryQueueBacklog
        expr: celery_queue_length > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Celery queue backlog: {{ $value }} tasks"
`,
            },
        ],
        explanation: `**Три столпа observability: logs, metrics, traces.** Логи отвечают на вопрос "что произошло" (детали конкретного события). Метрики — "как часто и насколько быстро" (агрегированные данные за период). Трейсы — "как запрос прошёл через систему" (связь между операциями в разных сервисах). Все три связаны через \`request_id\` / \`trace_id\`.

**structlog contextvars для автоматической корреляции.** \`bind_contextvars(request_id=...)\` сохраняет значения в \`ContextVar\` текущего треда/корутины. Все последующие вызовы \`log.info(...)\` в этом запросе автоматически включат \`request_id\`, \`user_id\`, \`path\` — не нужно передавать их явно в каждый вызов. \`clear_contextvars()\` в начале каждого запроса предотвращает утечку контекста между запросами.

**OpenTelemetry auto-instrumentation.** \`DjangoInstrumentor()\`, \`Psycopg2Instrumentor()\`, \`RedisInstrumentor()\` автоматически создают span-ы для каждого HTTP-запроса, SQL-запроса, Redis-команды. Celery-задача, запущенная из HTTP-запроса, получает родительский span через context propagation — в Jaeger/Tempo видна полная цепочка: HTTP → SQL → Redis → Celery → SQL.

**Нормализация URL для группировки метрик.** \`/api/orders/42/\` и \`/api/orders/99/\` — разные строки, но одна метрика. Без нормализации в Grafana будет тысяча отдельных серий вместо одной \`/api/orders/<id>/\`. Используйте \`resolve(request.path).route\` — Django возвращает шаблон пути.

**Alerting: \`for\` предотвращает flapping.** Без \`for: 2m\` алерт срабатывает при каждом кратковременном выбросе — ложные срабатывания ночью разрушают доверие к алертам. \`for: 2m\` означает: условие должно быть непрерывно истинным 2 минуты. \`severity: warning\` → Slack, \`severity: critical\` → PagerDuty/SMS.`,
    },

    {
        id: "django-zero-downtime-deploy",
        title: "Zero-downtime деплой и feature flags",
        task: `Реализуйте процесс zero-downtime деплоя Django-приложения. Включите: стратегию rolling update совместимую с Django (backward-compatible migrations), систему feature flags через django-waffle или flagsmith для постепенного rollout новых фич, canary deployment (5% трафика на новую версию), автоматический rollback при росте error rate. Опишите полный pipeline от merge в main до production.`,
        files: [
            {
                filename: "deploy/migration_strategy.md",
                code: `# Backward-compatible migrations: правила для zero-downtime

## Проблема
При rolling update старая и новая версии кода работают одновременно.
Если новая версия применила миграцию, а старый pod ещё работает —
старый код должен корректно работать с новой схемой БД.

## Правила

### Добавление столбца: ВСЕГДА nullable или с default
НЕПРАВИЛЬНО: ALTER TABLE ADD COLUMN name VARCHAR NOT NULL
  → старый код не передаёт name → INSERT падает

ПРАВИЛЬНО:
  Шаг 1 (деплой N):   ADD COLUMN name VARCHAR NULL
  Шаг 2 (деплой N+1): заполнить данные (data migration)
  Шаг 3 (деплой N+2): ADD NOT NULL CONSTRAINT (или ALTER COLUMN SET DEFAULT)

### Переименование столбца: через промежуточный шаг
НЕПРАВИЛЬНО: RENAME COLUMN old_name TO new_name
  → старый код ищет old_name → падает

ПРАВИЛЬНО:
  Шаг 1: ADD COLUMN new_name, копируем данные триггером
  Шаг 2 (N+1): переключаем код на new_name
  Шаг 3 (N+2): DROP COLUMN old_name

### Удаление столбца: сначала удалить из кода
НЕПРАВИЛЬНО: сразу DROP COLUMN
  → старый pod ещё обращается к столбцу → ошибка

ПРАВИЛЬНО:
  Шаг 1: убрать использование в коде, деплоить
  Шаг 2 (следующий деплой): DROP COLUMN

### Добавление индекса на большую таблицу
Всегда: CREATE INDEX CONCURRENTLY (не блокирует запись)
В миграции: atomic = False

## Чеклист перед каждым деплоем
- [ ] Миграция совместима с текущей версией кода?
- [ ] Миграция совместима с N-1 версией кода?
- [ ] Миграция использует CONCURRENTLY для новых индексов?
- [ ] Есть ли data migration? (может занять минуты на большой таблице)
`,
            },
            {
                filename: "features/flags.py",
                code: `"""
Feature flags через django-waffle: постепенный rollout без деплоя.

Типы флагов:
  Flag   — включён для % пользователей, групп, суперюзеров, staff
  Switch — глобальный on/off без привязки к пользователю
  Sample — включён для % запросов (вероятностно)

Управление через Django Admin или management команды:
  python manage.py waffle_flag new_checkout_flow --everyone --create
  python manage.py waffle_flag new_checkout_flow --percent=10
  python manage.py waffle_flag new_checkout_flow --deactivate
"""
from waffle import flag_is_active, switch_is_active, sample_is_active
from waffle.decorators import waffle_flag
from django.http import HttpRequest


# ---------------------------------------------------------------------------
# Проверка флагов в бизнес-логике
# ---------------------------------------------------------------------------

def get_checkout_handler(request: HttpRequest):
    """
    Постепенный rollout нового checkout: сначала 5%, потом 50%, потом 100%.
    Один и тот же пользователь всегда попадает в одну группу (детерминировано).
    """
    if flag_is_active(request, "new_checkout_flow"):
        from orders.checkout_v2 import NewCheckoutHandler
        return NewCheckoutHandler()
    else:
        from orders.checkout import CheckoutHandler
        return CheckoutHandler()


def is_recommendations_enabled(request: HttpRequest) -> bool:
    """Switch: глобальный on/off. Используйте для аварийного отключения фичи."""
    return switch_is_active("product_recommendations")


def should_log_detailed_analytics(request: HttpRequest) -> bool:
    """Sample: 10% запросов логируют детальную аналитику (снижает нагрузку)."""
    return sample_is_active("detailed_analytics_logging")


# ---------------------------------------------------------------------------
# Флаг как декоратор view
# ---------------------------------------------------------------------------
from django.views import View
from django.http import HttpResponseNotFound


class NewCheckoutView(View):
    @waffle_flag("new_checkout_flow", redirect_to="/checkout/")
    def get(self, request):
        """Доступен только пользователям с активным флагом."""
        return ...
`,
            },
            {
                filename: "deploy/canary.yaml",
                code: `# Canary deployment через два Deployment + Service с весами трафика.
# Реализация через Nginx Ingress аннотации (без service mesh).
# 5% трафика → canary, 95% → stable.

# Stable deployment (текущая версия)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: django-stable
  labels:
    app: django
    track: stable
spec:
  replicas: 19    # 95% трафика при равном распределении по pod-ам
  template:
    metadata:
      labels:
        app: django
        track: stable
    spec:
      containers:
        - name: web
          image: myapp:v1.2.3
---
# Canary deployment (новая версия)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: django-canary
  labels:
    app: django
    track: canary
spec:
  replicas: 1     # 5% трафика
  template:
    metadata:
      labels:
        app: django
        track: canary
    spec:
      containers:
        - name: web
          image: myapp:v1.3.0
---
# Ingress: аннотации nginx для canary routing
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: django-canary-ingress
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "5"   # 5% трафика на canary
    # Sticky canary по cookie: один пользователь всегда попадает на одну версию
    nginx.ingress.kubernetes.io/canary-by-cookie: "canary-user"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: django-canary-svc
                port:
                  number: 80
`,
            },
            {
                filename: "deploy/pipeline.yaml",
                code: `# GitHub Actions: полный pipeline от merge в main до production
# Stages: test → build → staging → canary → production

name: Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements-dev.txt
      - run: pytest -m "unit" -n auto
      - run: pytest -m "integration" --db=postgres
        env:
          TEST_DB: postgres

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: \${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/myorg/myapp:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  staging:
    needs: build
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/django-web web=ghcr.io/myorg/myapp:\${{ github.sha }}
          kubectl rollout status deployment/django-web --timeout=300s
      - name: Smoke tests on staging
        run: pytest tests/smoke/ --base-url=https://staging.example.com

  canary:
    needs: staging
    environment: production-canary
    runs-on: ubuntu-latest
    steps:
      - name: Deploy canary (5% traffic)
        run: |
          kubectl set image deployment/django-canary web=ghcr.io/myorg/myapp:\${{ github.sha }}
          kubectl rollout status deployment/django-canary --timeout=120s

      - name: Monitor canary for 10 minutes
        run: |
          # Проверяем error rate каждые 30 секунд
          for i in $(seq 1 20); do
            ERROR_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query" \\
              --data-urlencode 'query=sum(rate(django_http_errors_total{track="canary"}[2m]))/sum(rate(django_http_requests_total{track="canary"}[2m]))' \\
              | jq '.data.result[0].value[1]' -r)

            echo "Canary error rate: $ERROR_RATE"

            if (( $(echo "$ERROR_RATE > 0.02" | bc -l) )); then
              echo "ERROR: Canary error rate exceeded 2% — rolling back"
              kubectl rollout undo deployment/django-canary
              exit 1
            fi

            sleep 30
          done

  production:
    needs: canary
    environment: production
    runs-on: ubuntu-latest
    steps:
      - name: Promote canary to production (rolling update)
        run: |
          kubectl set image deployment/django-stable web=ghcr.io/myorg/myapp:\${{ github.sha }}
          kubectl rollout status deployment/django-stable --timeout=600s
          # После успешного деплоя stable — обновляем canary на ту же версию
          kubectl set image deployment/django-canary web=ghcr.io/myorg/myapp:\${{ github.sha }}

      - name: Tag release
        run: |
          git tag "v$(date +%Y%m%d-%H%M%S)-\${{ github.sha }}"
          git push --tags
`,
            },
            {
                filename: "deploy/rollback.sh",
                code: `#!/bin/bash
# Ручной rollback при критической ошибке в production.
# Вызывается on-call инженером или автоматически из pipeline.
set -euo pipefail

DEPLOYMENT="\${1:-django-stable}"
NAMESPACE="\${2:-production}"

echo "=== Rolling back $DEPLOYMENT in $NAMESPACE ==="

# Показываем историю деплоев
kubectl rollout history deployment/"$DEPLOYMENT" -n "$NAMESPACE"

# Откатываем на предыдущую версию
kubectl rollout undo deployment/"$DEPLOYMENT" -n "$NAMESPACE"

# Ждём завершения rollback
kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE" --timeout=300s

# Проверяем текущую версию образа
CURRENT_IMAGE=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" \\
  -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "=== Rolled back to: $CURRENT_IMAGE ==="

# Быстрая проверка health
sleep 10
HEALTH=$(curl -sf "https://api.example.com/health/ready/" | jq -r .status)
echo "=== Health check: $HEALTH ==="
`,
            },
        ],
        explanation: `**Backward-compatible migrations — основа zero-downtime.** При rolling update старая и новая версии кода работают одновременно с одной БД. Если новая миграция добавила \`NOT NULL\` столбец без default — старый pod не передаёт это поле и падает с ошибкой. Правило: любое изменение схемы должно быть совместимо с N-1 версией кода. Удаление столбца и переименование — всегда через два деплоя.

**Feature flags для постепенного rollout.** django-waffle позволяет включить фичу для 5% пользователей без деплоя: \`waffle_flag new_checkout_flow --percent=5\`. Один и тот же пользователь детерминированно попадает в ту же группу (через hash user_id). Rollout: 5% → 25% → 50% → 100%. При проблемах: \`--deactivate\` — мгновенное отключение без деплоя. Switch — для аварийного отключения любой фичи.

**Canary: 1 pod = 5% при 19 stable + 1 canary.** Простейший canary без service mesh: разное количество pod-ов. Nginx Ingress \`canary-weight: 5\` маршрутизирует 5% трафика на canary service. \`canary-by-cookie\` делает routing sticky: пользователь, попавший на canary, всегда попадает на неё — важно для UX и для отладки.

**Автоматический rollback по error rate.** Pipeline мониторит error rate canary каждые 30 секунд через Prometheus API. Превышение 2% → \`kubectl rollout undo\` → pipeline завершается с ошибкой → уведомление команде. Порог 2% (не 1%) чтобы избежать ложных срабатываний при малом трафике на canary. После успешного мониторинга stable обновляется rolling update с \`maxUnavailable: 0\`.

**\`preStop: sleep 5\` критичен для zero-downtime.** K8s одновременно: отправляет SIGTERM pod-у И убирает его из Endpoints (куда load balancer роутит трафик). Но обновление Endpoints занимает несколько секунд — без паузы pod получает SIGTERM, начинает shutdown, но ещё несколько секунд получает новые запросы от ничего не знающего load balancer. \`sleep 5\` даёт время синхронизироваться.`,
    },

];
