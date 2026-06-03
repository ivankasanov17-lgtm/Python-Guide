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

];
