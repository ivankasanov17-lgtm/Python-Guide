export interface DjangoTermArgument {
  name: string;
  description: string;
}

export interface DjangoTerm {
  name: string;
  category: string;
  description: string;
  syntax: string;
  arguments: DjangoTermArgument[];
  example: string;
}

export const djangoTerms: DjangoTerm[] = [
  // ─── Applications ─────────────────────────────────────────────────────────
  {
    name: "apps",
    category: "Applications",
    description:
      "Глобальный реестр приложений Django. Объект типа Apps, который хранит конфигурации всех установленных приложений. Доступен через django.apps.apps после завершения инициализации фреймворка.",
    syntax: "from django.apps import apps",
    arguments: [],
    example: `from django.apps import apps

# Получить все зарегистрированные конфигурации приложений
for app_config in apps.get_app_configs():
    print(app_config.name, app_config.label)

# Проверить, завершена ли инициализация
print(apps.ready)  # True / False`,
  },
  {
    name: "apps.ready",
    category: "Applications",
    description:
      "Булев атрибут, который становится True после того, как реестр приложений полностью инициализирован и все методы AppConfig.ready() были вызваны. До этого момента импортировать модели и обращаться к ORM небезопасно.",
    syntax: "apps.ready",
    arguments: [],
    example: `from django.apps import apps

if apps.ready:
    # Безопасно работать с моделями
    User = apps.get_model('auth', 'User')
    print(f"Пользователей: {User.objects.count()}")
else:
    print("Реестр ещё не инициализирован")`,
  },
  {
    name: "apps.get_app_configs()",
    category: "Applications",
    description:
      "Возвращает итерируемый объект со всеми экземплярами AppConfig в том порядке, в котором приложения перечислены в INSTALLED_APPS. Используется для обхода всех установленных приложений.",
    syntax: "apps.get_app_configs()",
    arguments: [],
    example: `from django.apps import apps

for app_config in apps.get_app_configs():
    print(f"Приложение: {app_config.name}")
    print(f"  Метка:   {app_config.label}")
    print(f"  Путь:    {app_config.path}")
    print(f"  Моделей: {len(list(app_config.get_models()))}")`,
  },
  {
    name: "apps.get_app_config(app_label)",
    category: "Applications",
    description:
      "Возвращает экземпляр AppConfig для приложения с указанной меткой (app_label). Вызывает LookupError, если приложение не найдено в реестре.",
    syntax: "apps.get_app_config(app_label)",
    arguments: [
      {
        name: "app_label",
        description:
          'Строка — метка приложения (обычно последняя часть имени пакета, например "auth", "contenttypes").',
      },
    ],
    example: `from django.apps import apps

# Получить конфиг стандартного приложения auth
auth_config = apps.get_app_config('auth')
print(auth_config.name)       # django.contrib.auth
print(auth_config.verbose_name)  # Authentication and Authorization

# Если приложение не установлено — LookupError
try:
    apps.get_app_config('nonexistent')
except LookupError as e:
    print(e)`,
  },
  {
    name: "apps.is_installed(app_name)",
    category: "Applications",
    description:
      "Возвращает True, если приложение с указанным полным именем (dotted Python path) присутствует в INSTALLED_APPS. Принимает именно полное имя модуля, а не метку (label).",
    syntax: "apps.is_installed(app_name)",
    arguments: [
      {
        name: "app_name",
        description:
          'Полное имя приложения в виде строки, например "django.contrib.auth" или "myproject.myapp".',
      },
    ],
    example: `from django.apps import apps

# Проверяем по полному имени модуля, не по label
if apps.is_installed('django.contrib.auth'):
    print("Аутентификация подключена")

if apps.is_installed('django.contrib.admin'):
    print("Панель администратора доступна")

# False, если не установлено
print(apps.is_installed('nonexistent.app'))  # False`,
  },
  {
    name: "apps.get_model(app_label, model_name, require_ready=True)",
    category: "Applications",
    description:
      "Возвращает класс модели по метке приложения и имени модели. По умолчанию требует, чтобы реестр был полностью инициализирован (require_ready=True). Имена нечувствительны к регистру.",
    syntax: "apps.get_model(app_label, model_name, require_ready=True)",
    arguments: [
      {
        name: "app_label",
        description:
          'Метка приложения (краткое имя, например "auth", "contenttypes").',
      },
      {
        name: "model_name",
        description:
          'Имя класса модели (регистронезависимо), например "User", "user", "GROUP".',
      },
      {
        name: "require_ready",
        description:
          "Если True (по умолчанию), вызывает исключение если реестр не готов. Установите False только внутри AppConfig.ready().",
      },
    ],
    example: `from django.apps import apps

# Получить модель User из приложения auth
User = apps.get_model('auth', 'User')
print(User.objects.count())

# Альтернативный синтаксис через точку в одном аргументе
User = apps.get_model('auth.User')

# Использование внутри AppConfig.ready() до полной инициализации
class MyAppConfig(AppConfig):
    def ready(self):
        MyModel = apps.get_model('myapp', 'MyModel', require_ready=False)`,
  },
  {
    name: "AppConfig",
    category: "Applications",
    description:
      "Базовый класс для конфигурации Django-приложения. Создаётся в файле apps.py каждого приложения. Позволяет задать метаданные приложения (название, verbose_name) и выполнить инициализацию после загрузки всех приложений через метод ready().",
    syntax: `class MyAppConfig(AppConfig):
    name = 'myapp'
    verbose_name = 'Моё приложение'`,
    arguments: [],
    example: `# myapp/apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'                    # обязательно: полный путь к пакету
    verbose_name = 'Моё приложение'  # отображаемое имя
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # Регистрация сигналов — только здесь, не на уровне модуля
        import myapp.signals  # noqa: F401

# myapp/__init__.py
default_app_config = 'myapp.apps.MyAppConfig'`,
  },
  {
    name: "AppConfig.name",
    category: "Applications",
    description:
      "Обязательный атрибут класса AppConfig. Полное имя Python-пакета приложения (dotted path), которое должно совпадать с записью в INSTALLED_APPS. Используется для однозначной идентификации приложения в реестре.",
    syntax: 'AppConfig.name = "dotted.python.path"',
    arguments: [],
    example: `# myproject/myapp/apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    # Полный путь от корня проекта — не просто "myapp"
    name = 'myproject.myapp'
    label = 'myapp'           # опционально: уникальная метка (по умолчанию = последняя часть name)
    verbose_name = 'Мой модуль'

# settings.py
INSTALLED_APPS = [
    'myproject.myapp',        # или 'myproject.myapp.apps.MyAppConfig'
]`,
  },
  {
    name: "AppConfig.label",
    category: "Applications",
    description:
      'Краткая уникальная метка приложения (app label), используемая для идентификации внутри Django: в ORM, миграциях, ссылках на модели вида "app_label.ModelName". По умолчанию равна последней части AppConfig.name. Должна быть уникальной во всём проекте — задаётся явно, если несколько приложений имеют одинаковую последнюю часть имени пакета.',
    syntax: 'AppConfig.label = "short_label"',
    arguments: [],
    example: `from django.apps import AppConfig

class BlogConfig(AppConfig):
    name = 'myproject.blog'
    label = 'myblog'          # переопределяем, чтобы не конфликтовать с другим "blog"

# Использование label при ссылках на модели
class Post(models.Model):
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    # 'auth' — это AppConfig.label приложения django.contrib.auth

# Получить конфиг по label
from django.apps import apps
cfg = apps.get_app_config('myblog')
print(cfg.label)  # myblog`,
  },
  {
    name: "AppConfig.verbose_name",
    category: "Applications",
    description:
      "Человекочитаемое имя приложения, отображаемое в админке Django и других местах. По умолчанию формируется из label с заглавной первой буквой. Рекомендуется задавать явно и помечать как переводимую строку через gettext_lazy для поддержки локализации.",
    syntax: 'AppConfig.verbose_name = "Отображаемое имя"',
    arguments: [],
    example: `from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class ShopConfig(AppConfig):
    name = 'myproject.shop'
    verbose_name = _('Интернет-магазин')

# В админке группа моделей этого приложения будет называться "Интернет-магазин"

# Получить verbose_name программно
from django.apps import apps
print(apps.get_app_config('shop').verbose_name)  # Интернет-магазин`,
  },
  {
    name: "AppConfig.path",
    category: "Applications",
    description:
      "Абсолютный путь к каталогу приложения в файловой системе. Заполняется Django автоматически при загрузке приложения на основе расположения его пакета. Полезен для поиска файлов рядом с кодом приложения (шаблонов, фикстур, статики).",
    syntax: "AppConfig.path",
    arguments: [],
    example: `import os
from django.apps import apps

cfg = apps.get_app_config('myapp')
print(cfg.path)
# /home/user/myproject/myapp

# Найти файл фикстуры внутри приложения
fixtures_dir = os.path.join(cfg.path, 'fixtures')
for filename in os.listdir(fixtures_dir):
    print(filename)

# Обычно path определяется автоматически, но при необходимости
# можно задать вручную в подклассе AppConfig:
class MyAppConfig(AppConfig):
    name = 'myapp'
    path = '/custom/path/to/myapp'`,
  },
  {
    name: "AppConfig.default",
    category: "Applications",
    description:
      "Булев атрибут, определяющий, должен ли данный AppConfig использоваться как конфигурация по умолчанию, если в INSTALLED_APPS указано только имя пакета приложения. Если в одном пакете определено несколько AppConfig, ровно один из них должен иметь default = True (или быть единственным).",
    syntax: "AppConfig.default = True",
    arguments: [],
    example: `# myapp/apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'
    verbose_name = 'Основная конфигурация'
    default = True            # будет использоваться при INSTALLED_APPS = ['myapp']

class MyAppDevConfig(AppConfig):
    name = 'myapp'
    verbose_name = 'Конфигурация для разработки'
    default = False           # выбирается явно: 'myapp.apps.MyAppDevConfig'

# settings.py
INSTALLED_APPS = [
    'myapp',                              # подберёт MyAppConfig (default=True)
    # 'myapp.apps.MyAppDevConfig',        # явный выбор альтернативной конфигурации
]`,
  },
  {
    name: "AppConfig.default_auto_field",
    category: "Applications",
    description:
      'Указывает, какой тип поля использовать по умолчанию для автоматических первичных ключей (id) моделей этого приложения. Перекрывает глобальную настройку DEFAULT_AUTO_FIELD из settings.py для конкретного приложения. Чаще всего используется значение "django.db.models.BigAutoField".',
    syntax: 'AppConfig.default_auto_field = "django.db.models.BigAutoField"',
    arguments: [],
    example: `from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'
    # Все модели myapp без явного primary_key получат BigAutoField
    default_auto_field = 'django.db.models.BigAutoField'

# Альтернативные значения:
# 'django.db.models.AutoField'      — 32-битный INTEGER (Django < 3.2 default)
# 'django.db.models.BigAutoField'   — 64-битный BIGINT (рекомендуется для новых проектов)
# 'django.db.models.SmallAutoField' — 16-битный SMALLINT

class Article(models.Model):
    # id типа BIGINT создастся автоматически
    title = models.CharField(max_length=200)`,
  },
  {
    name: "AppConfig.module",
    category: "Applications",
    description:
      "Корневой модуль приложения (Python-объект module), полученный в результате импорта пакета, указанного в name. Заполняется Django автоматически при загрузке приложения. Доступ к самому модулю позволяет получать его атрибуты (версия, метаданные и т. п.).",
    syntax: "AppConfig.module",
    arguments: [],
    example: `from django.apps import apps

cfg = apps.get_app_config('myapp')
print(cfg.module)
# <module 'myapp' from '/home/user/myproject/myapp/__init__.py'>

# Получить атрибут из __init__.py приложения
version = getattr(cfg.module, '__version__', 'unknown')
print(f"Версия myapp: {version}")

# Эквивалентно прямому импорту:
import myapp
assert cfg.module is myapp`,
  },
  {
    name: "AppConfig.models_module",
    category: "Applications",
    description:
      "Модуль models приложения (объект module), либо None, если приложение не содержит моделей. Заполняется Django после успешного импорта пакета приложения и его подмодуля models. Используется внутренне реестром приложений для регистрации моделей.",
    syntax: "AppConfig.models_module",
    arguments: [],
    example: `from django.apps import apps

cfg = apps.get_app_config('auth')
print(cfg.models_module)
# <module 'django.contrib.auth.models' from '.../auth/models.py'>

# Приложение без моделей
admin_cfg = apps.get_app_config('admin')
if admin_cfg.models_module is None:
    print("У приложения нет models.py")
else:
    print(f"Модели определены в: {admin_cfg.models_module.__name__}")

# Получить все классы моделей через models_module
import inspect
from django.db.models import Model

cfg = apps.get_app_config('auth')
for name, obj in inspect.getmembers(cfg.models_module, inspect.isclass):
    if issubclass(obj, Model) and obj is not Model:
        print(name)`,
  },
  {
    name: "AppConfig.get_models(include_auto_created=False, include_swapped=False)",
    category: "Applications",
    description:
      "Возвращает итерируемый объект со всеми классами моделей, зарегистрированных в данном приложении. По умолчанию исключает автоматически создаваемые промежуточные модели для ManyToMany-полей и swapped-модели (заменённые через AUTH_USER_MODEL и подобные настройки).",
    syntax:
      "AppConfig.get_models(include_auto_created=False, include_swapped=False)",
    arguments: [
      {
        name: "include_auto_created",
        description:
          "Если True, включает в результат автоматически создаваемые модели для промежуточных таблиц ManyToMany-связей. По умолчанию False.",
      },
      {
        name: "include_swapped",
        description:
          "Если True, включает модели, которые были заменены через настройки swappable (например, замена User-модели через AUTH_USER_MODEL). По умолчанию False.",
      },
    ],
    example: `from django.apps import apps

# Все основные модели приложения auth
auth_cfg = apps.get_app_config('auth')
for model in auth_cfg.get_models():
    print(model.__name__)
    # User, Group, Permission, ...

# Включить промежуточные таблицы M2M
for model in auth_cfg.get_models(include_auto_created=True):
    print(model._meta.db_table)
    # auth_user, auth_user_groups, auth_user_user_permissions, ...

# Если кастомная модель пользователя заменяет auth.User —
# по умолчанию User не попадёт в выдачу:
for model in auth_cfg.get_models(include_swapped=True):
    print(model.__name__)`,
  },
  {
    name: "AppConfig.get_model(model_name, require_ready=True)",
    category: "Applications",
    description:
      "Возвращает класс модели с указанным именем, зарегистрированный в данном приложении. Имя модели регистронезависимо. Вызывает LookupError, если модель с таким именем в приложении не найдена. По умолчанию требует, чтобы реестр приложений был полностью инициализирован.",
    syntax: "AppConfig.get_model(model_name, require_ready=True)",
    arguments: [
      {
        name: "model_name",
        description:
          'Имя класса модели в виде строки, регистронезависимо ("User", "user", "USER" эквивалентны).',
      },
      {
        name: "require_ready",
        description:
          "Если True (по умолчанию), вызывает AppRegistryNotReady, пока реестр приложений не готов. Установите False, если вызываете внутри AppConfig.ready().",
      },
    ],
    example: `from django.apps import apps

auth_cfg = apps.get_app_config('auth')

# Получить модель по имени
User = auth_cfg.get_model('User')
print(User.objects.count())

# Регистр не важен
Group = auth_cfg.get_model('group')

# Несуществующая модель → LookupError
try:
    auth_cfg.get_model('NonExistent')
except LookupError as e:
    print(e)

# Использование в AppConfig.ready() до полной готовности реестра
class MyAppConfig(AppConfig):
    name = 'myapp'

    def ready(self):
        MyModel = self.get_model('MyModel', require_ready=False)
        # ... подключение сигналов и т.п.`,
  },
  {
    name: "AppConfig.ready()",
    category: "Applications",
    description:
      "Метод-хук, вызываемый Django один раз после того, как реестр приложений полностью инициализирован и все модели импортированы. Предназначен для регистрации обработчиков сигналов, проверок конфигурации, патчей и другой инициализации, требующей готового реестра. Не должен запускать запросы к БД и обращаться к моделям пользователей напрямую при импорте.",
    syntax: `class MyAppConfig(AppConfig):
    def ready(self):
        ...`,
    arguments: [],
    example: `# myapp/apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'

    def ready(self):
        # 1. Подключение сигналов — самый частый случай
        from . import signals  # noqa: F401

        # 2. Регистрация checks
        from django.core.checks import register
        from .checks import my_custom_check
        register(my_custom_check)

        # 3. Получение моделей через self.get_model (без прямого импорта)
        Article = self.get_model('Article')
        # NB: не выполнять Article.objects.xxx() — БД может быть недоступна

        # 4. Патчинг сторонних библиотек
        import third_party_lib
        third_party_lib.some_function = my_replacement

# myapp/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Article

@receiver(post_save, sender=Article)
def on_article_saved(sender, instance, created, **kwargs):
    if created:
        print(f"Создана статья: {instance.title}")`,
  },
  {
    name: "setup(set_prefix=True)",
    category: "Applications",
    description:
      "Функция django.setup() — конфигурирует Django: загружает настройки, инициализирует логирование и заполняет реестр приложений. Вызывается автоматически при использовании manage.py, WSGI/ASGI-серверов и runserver. Нужна вручную только в самостоятельных скриптах, использующих Django ORM или другие компоненты вне обычного запуска.",
    syntax: "django.setup(set_prefix=True)",
    arguments: [
      {
        name: "set_prefix",
        description:
          "Если True (по умолчанию), устанавливает script_prefix URL-резолвера на основе FORCE_SCRIPT_NAME из настроек. Установите False для скриптов, не работающих с URL (например, фоновых задач, ETL).",
      },
    ],
    example: `# standalone_script.py — самостоятельный скрипт вне manage.py
import os
import django

# 1. Указываем модуль настроек
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

# 2. Инициализируем Django
django.setup()

# 3. Теперь можно импортировать модели и использовать ORM
from myapp.models import Article

for article in Article.objects.all()[:5]:
    print(article.title)

# Для скриптов, не работающих с URL (cron-задачи, ETL),
# можно отключить установку префикса:
django.setup(set_prefix=False)`,
  },

  // ─── System check framework ───────────────────────────────────────────────
  {
    name: "register(tags)",
    category: "System check framework",
    description:
      "Декораторная форма django.core.checks.register. Регистрирует функцию проверки и помечает её одним или несколькими тегами. Тег позволяет запускать выборочно проверки по группе командой `python manage.py check --tag <tag>`. Сама функция должна принимать app_configs, **kwargs и возвращать список объектов CheckMessage.",
    syntax: "@register(*tags)",
    arguments: [
      {
        name: "*tags",
        description:
          'Один или несколько тегов (строки или константы из django.core.checks.Tags), к которым относится проверка. Например, Tags.security, Tags.compatibility, "myapp".',
      },
    ],
    example: `# myapp/checks.py
from django.core.checks import register, Warning, Tags

@register(Tags.security, 'myapp')
def check_secret_key_strength(app_configs, **kwargs):
    from django.conf import settings
    errors = []
    if len(settings.SECRET_KEY) < 50:
        errors.append(
            Warning(
                'SECRET_KEY слишком короткий',
                hint='Сгенерируйте ключ длиной не менее 50 символов.',
                id='myapp.W001',
            )
        )
    return errors

# Запуск только этой группы проверок:
#   python manage.py check --tag security`,
  },
  {
    name: "register(function, *tags)",
    category: "System check framework",
    description:
      "Функциональная форма register. Регистрирует переданную функцию проверки с указанными тегами без использования синтаксиса декоратора. Удобна, когда функция определяется или импортируется отдельно — например, регистрируется внутри AppConfig.ready().",
    syntax: "register(function, *tags)",
    arguments: [
      {
        name: "function",
        description:
          "Функция проверки с сигнатурой fn(app_configs, **kwargs), возвращающая список объектов CheckMessage (Error, Warning, Info, ...).",
      },
      {
        name: "*tags",
        description:
          "Произвольное количество тегов, ассоциируемых с проверкой (Tags.security, Tags.models и т. д.).",
      },
    ],
    example: `# myapp/checks.py
from django.core.checks import Error, Tags

def check_database_engine(app_configs, **kwargs):
    from django.conf import settings
    errors = []
    engine = settings.DATABASES['default']['ENGINE']
    if 'sqlite' in engine:
        errors.append(
            Error(
                'SQLite не подходит для production',
                hint='Используйте PostgreSQL или MySQL.',
                id='myapp.E001',
            )
        )
    return errors

# myapp/apps.py
from django.apps import AppConfig
from django.core.checks import register, Tags

class MyAppConfig(AppConfig):
    name = 'myapp'

    def ready(self):
        from .checks import check_database_engine
        register(check_database_engine, Tags.database, Tags.compatibility)`,
  },
  {
    name: "register(function, *tags, deploy=False)",
    category: "System check framework",
    description:
      "Полная форма register с именованным аргументом deploy. Если deploy=True, проверка выполняется только при запуске `python manage.py check --deploy`, но не во время обычной разработки (runserver, migrate). Используется для тяжёлых или специфичных для prod проверок (HTTPS, security headers и т. п.).",
    syntax: "register(function, *tags, deploy=False)",
    arguments: [
      {
        name: "function",
        description:
          "Функция проверки с сигнатурой fn(app_configs, **kwargs), возвращающая список CheckMessage.",
      },
      {
        name: "*tags",
        description:
          "Теги, к которым относится проверка (Tags.security, Tags.compatibility, пользовательские строки).",
      },
      {
        name: "deploy",
        description:
          "Если True, проверка запускается только командой `manage.py check --deploy`. По умолчанию False — проверка выполняется при каждом check.",
      },
    ],
    example: `# myapp/checks.py
from django.core.checks import Warning, register, Tags

def check_ssl_redirect(app_configs, **kwargs):
    from django.conf import settings
    errors = []
    if not getattr(settings, 'SECURE_SSL_REDIRECT', False):
        errors.append(
            Warning(
                'SECURE_SSL_REDIRECT выключен',
                hint='Включите SECURE_SSL_REDIRECT = True для production.',
                id='myapp.W010',
            )
        )
    return errors

# Регистрируем как deploy-only проверку
register(check_ssl_redirect, Tags.security, deploy=True)

# Эквивалент через декоратор:
@register(Tags.security, deploy=True)
def check_hsts(app_configs, **kwargs):
    ...

# Запуск:
#   python manage.py check --deploy`,
  },
  {
    name: "Error(message, hint=None, obj=None, id=None)",
    category: "System check framework",
    description:
      "Класс сообщения о критической ошибке конфигурации. Возвращается из функций-проверок при обнаружении проблем, которые делают запуск проекта невозможным или приводят к некорректной работе. Команда `manage.py check` завершает работу с ненулевым кодом возврата, если хотя бы одна проверка вернула Error.",
    syntax: "Error(message, hint=None, obj=None, id=None)",
    arguments: [
      {
        name: "message",
        description:
          "Краткое описание проблемы — одна строка, объясняющая, что не так.",
      },
      {
        name: "hint",
        description:
          "Необязательная подсказка с указанием, как исправить проблему. Отображается после message.",
      },
      {
        name: "obj",
        description:
          "Необязательный объект, к которому относится ошибка (модель, поле, AppConfig). Используется для контекста в выводе.",
      },
      {
        name: "id",
        description:
          'Уникальный идентификатор проверки в формате "<app_label>.E<номер>" (например, "myapp.E001"). Позволяет глушить сообщения через SILENCED_SYSTEM_CHECKS.',
      },
    ],
    example: `from django.core.checks import Error, register

@register()
def check_required_setting(app_configs, **kwargs):
    from django.conf import settings
    errors = []

    if not getattr(settings, 'PAYMENT_API_KEY', None):
        errors.append(
            Error(
                'PAYMENT_API_KEY не задан',
                hint='Добавьте PAYMENT_API_KEY = "..." в settings.py '
                     'или переменную окружения.',
                obj=settings,
                id='myapp.E001',
            )
        )
    return errors

# Запуск:
#   python manage.py check
# Вывод при отсутствии ключа:
#   ERRORS:
#   ?: (myapp.E001) PAYMENT_API_KEY не задан
#       HINT: Добавьте PAYMENT_API_KEY = "..." в settings.py ...
# System check identified 1 issue (0 silenced).

# Заглушить проверку через настройки:
# SILENCED_SYSTEM_CHECKS = ['myapp.E001']`,
  },
  {
    name: "Warning(message, hint=None, obj=None, id=None)",
    category: "System check framework",
    description:
      "Класс сообщения-предупреждения. Возвращается из функций-проверок при обнаружении некритичных проблем, которые не препятствуют запуску, но указывают на потенциальные риски (устаревшие настройки, рекомендации по безопасности). В отличие от Error, не приводит к ненулевому коду возврата `manage.py check`.",
    syntax: "Warning(message, hint=None, obj=None, id=None)",
    arguments: [
      {
        name: "message",
        description: "Краткое описание потенциальной проблемы.",
      },
      {
        name: "hint",
        description:
          "Необязательная подсказка с описанием рекомендуемого действия.",
      },
      {
        name: "obj",
        description:
          "Необязательный объект, к которому относится предупреждение (модель, AppConfig, settings).",
      },
      {
        name: "id",
        description:
          'Уникальный идентификатор предупреждения в формате "<app_label>.W<номер>" (например, "myapp.W001"). Используется для подавления через SILENCED_SYSTEM_CHECKS.',
      },
    ],
    example: `from django.core.checks import Warning, register, Tags

@register(Tags.security, deploy=True)
def check_debug_off(app_configs, **kwargs):
    from django.conf import settings
    warnings = []

    if settings.DEBUG:
        warnings.append(
            Warning(
                'DEBUG = True в production-конфигурации',
                hint='Установите DEBUG = False для production-окружения.',
                obj=settings,
                id='myapp.W001',
            )
        )

    if not settings.ALLOWED_HOSTS:
        warnings.append(
            Warning(
                'ALLOWED_HOSTS пустой',
                hint='Перечислите все домены, на которых работает сайт.',
                id='myapp.W002',
            )
        )

    return warnings

# Запуск:
#   python manage.py check --deploy
# Вывод:
#   WARNINGS:
#   ?: (myapp.W001) DEBUG = True в production-конфигурации
#       HINT: Установите DEBUG = False для production-окружения.`,
  },
  {
    name: "CheckMessage",
    category: "System check framework",
    description:
      "Базовый класс всех сообщений системы проверок (Debug, Info, Warning, Error, Critical). Хранит уровень серьёзности (level), текст сообщения, подсказку, привязанный объект и идентификатор. Поддерживает методы is_serious(level) и is_silenced() для фильтрации сообщений.",
    syntax: "CheckMessage(level, message, hint=None, obj=None, id=None)",
    arguments: [
      {
        name: "level",
        description:
          "Числовой уровень серьёзности: DEBUG=10, INFO=20, WARNING=30, ERROR=40, CRITICAL=50. Обычно задаётся через подкласс (Error, Warning и т. д.).",
      },
      {
        name: "message",
        description: "Краткое описание сообщения.",
      },
      {
        name: "hint",
        description: "Необязательная подсказка по устранению проблемы.",
      },
      {
        name: "obj",
        description: "Необязательный объект, к которому относится сообщение.",
      },
      {
        name: "id",
        description:
          'Уникальный идентификатор сообщения, например "myapp.E001".',
      },
    ],
    example: `from django.core.checks import (
    CheckMessage, Debug, Info, Warning, Error, Critical,
    DEBUG, INFO, WARNING, ERROR, CRITICAL,
)

# Все классы сообщений — наследники CheckMessage с фиксированным level
err = Error('Что-то сломано', id='app.E001')
warn = Warning('Подозрительно', id='app.W001')
info = Info('К сведению', id='app.I001')

# Уровень и проверка серьёзности
print(err.level)              # 40
print(err.is_serious(WARNING)) # True (40 >= 30)
print(info.is_serious(WARNING)) # False (20 < 30)

# Заглушённые сообщения (через SILENCED_SYSTEM_CHECKS)
print(err.is_silenced())  # True, если 'app.E001' в SILENCED_SYSTEM_CHECKS

# Создание собственного уровня (редко)
custom = CheckMessage(
    level=35,                       # между WARNING (30) и ERROR (40)
    msg='Кастомное сообщение',
    hint='Подсказка',
    id='app.C001',
)`,
  },
  {
    name: "Tags.compatibility",
    category: "System check framework",
    description:
      'Константа-тег "compatibility" из класса django.core.checks.Tags. Применяется к проверкам, которые анализируют совместимость кода и настроек проекта с текущей версией Django (использование устаревших API, удалённых опций, неподдерживаемых сочетаний настроек).',
    syntax: "from django.core.checks import Tags; Tags.compatibility",
    arguments: [],
    example: `from django.core.checks import register, Warning, Tags
import django

@register(Tags.compatibility)
def check_deprecated_settings(app_configs, **kwargs):
    from django.conf import settings
    warnings = []

    # Пример проверки устаревшей настройки
    if hasattr(settings, 'MIDDLEWARE_CLASSES'):
        warnings.append(
            Warning(
                'MIDDLEWARE_CLASSES удалён в Django 2.0',
                hint='Переименуйте в MIDDLEWARE.',
                id='myapp.W100',
            )
        )

    if django.VERSION >= (5, 0) and getattr(settings, 'USE_L10N', None) is not None:
        warnings.append(
            Warning(
                'USE_L10N больше не используется в Django 5.0+',
                hint='Удалите USE_L10N из settings.py.',
                id='myapp.W101',
            )
        )

    return warnings

# Запуск только проверок совместимости:
#   python manage.py check --tag compatibility`,
  },
  {
    name: "Tags.security",
    category: "System check framework",
    description:
      'Константа-тег "security" из класса django.core.checks.Tags. Применяется к проверкам, связанным с безопасностью развёртывания: HTTPS, секреты, заголовки HSTS/CSP, настройки cookies, CSRF и подобное. Большая часть встроенных проверок безопасности Django помечена этим тегом и запускается командой `manage.py check --deploy`.',
    syntax: "from django.core.checks import Tags; Tags.security",
    arguments: [],
    example: `from django.core.checks import register, Warning, Error, Tags

@register(Tags.security, deploy=True)
def check_security_settings(app_configs, **kwargs):
    from django.conf import settings
    issues = []

    if settings.DEBUG:
        issues.append(
            Error(
                'DEBUG = True в production',
                hint='Установите DEBUG = False.',
                id='myapp.E200',
            )
        )

    if not getattr(settings, 'SECURE_HSTS_SECONDS', 0):
        issues.append(
            Warning(
                'HSTS не настроен',
                hint='Установите SECURE_HSTS_SECONDS, например 31536000.',
                id='myapp.W200',
            )
        )

    if not getattr(settings, 'SESSION_COOKIE_SECURE', False):
        issues.append(
            Warning(
                'SESSION_COOKIE_SECURE = False',
                hint='Включите SESSION_COOKIE_SECURE для HTTPS-сессий.',
                id='myapp.W201',
            )
        )

    return issues

# Запуск:
#   python manage.py check --tag security
#   python manage.py check --deploy   # включает все security-проверки`,
  },

  // ─── Built-in class-based views API ───────────────────────────────────────
  {
    name: "View",
    category: "Built-in class-based views API",
    description:
      "Базовый класс всех class-based views в Django (django.views.generic.View). Обрабатывает входящий HTTP-запрос, диспетчеризуя его методу-обработчику с именем, совпадающим с HTTP-методом в нижнем регистре (get, post, put, patch, delete и т. д.). Не реализует никакой логики сам — служит фундаментом для собственных представлений и встроенных generic-классов (TemplateView, ListView, FormView и пр.).",
    syntax: `from django.views.generic import View

class MyView(View):
    def get(self, request, *args, **kwargs):
        ...
    def post(self, request, *args, **kwargs):
        ...`,
    arguments: [],
    example: `# views.py
from django.views.generic import View
from django.http import HttpResponse, JsonResponse

class HelloView(View):
    def get(self, request, *args, **kwargs):
        name = request.GET.get('name', 'World')
        return HttpResponse(f'Hello, {name}!')

    def post(self, request, *args, **kwargs):
        return JsonResponse({'status': 'created'}, status=201)

# urls.py
from django.urls import path
from .views import HelloView

urlpatterns = [
    path('hello/', HelloView.as_view(), name='hello'),
]`,
  },
  {
    name: "View.http_method_names",
    category: "Built-in class-based views API",
    description:
      'Список HTTP-методов, которые представление готово обрабатывать. По умолчанию — все стандартные методы: ["get", "post", "put", "patch", "delete", "head", "options", "trace"]. Имена должны быть в нижнем регистре. Если запрос приходит с методом, отсутствующим в этом списке (или для него нет одноимённого метода в классе), вызывается http_method_not_allowed и возвращается 405.',
    syntax: 'View.http_method_names = ["get", "post", ...]',
    arguments: [],
    example: `from django.views.generic import View
from django.http import JsonResponse

class ReadOnlyAPI(View):
    # Запрещаем всё, кроме GET и HEAD
    http_method_names = ['get', 'head', 'options']

    def get(self, request, *args, **kwargs):
        return JsonResponse({'data': [1, 2, 3]})

# POST /api/  →  HTTP 405 Method Not Allowed
#               Allow: GET, HEAD, OPTIONS

class WebhookView(View):
    # Принимаем только POST
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        return JsonResponse({'received': True})`,
  },
  {
    name: "View.as_view(**initkwargs)",
    category: "Built-in class-based views API",
    description:
      "Classmethod, возвращающая callable view-функцию, пригодную для подключения в URLconf. Принимает именованные аргументы, которые становятся атрибутами создаваемого экземпляра View при каждом запросе — это позволяет конфигурировать представление прямо в urls.py. Имена ключей должны соответствовать существующим атрибутам класса; передача неизвестных ключей вызывает TypeError.",
    syntax: "View.as_view(**initkwargs)",
    arguments: [
      {
        name: "**initkwargs",
        description:
          "Именованные аргументы, переопределяющие атрибуты класса для каждого экземпляра View (template_name, model, paginate_by и т. п.). Только существующие атрибуты класса допустимы.",
      },
    ],
    example: `# views.py
from django.views.generic import TemplateView

class GreetingView(TemplateView):
    template_name = 'greeting.html'
    greeting = 'Привет'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['greeting'] = self.greeting
        return ctx

# urls.py
from django.urls import path
from .views import GreetingView

urlpatterns = [
    # Один класс — два разных endpoint'а с разной конфигурацией
    path('hello/',  GreetingView.as_view(),                   name='hello'),
    path('hola/',   GreetingView.as_view(greeting='Hola'),    name='hola'),
    path('bonjour/', GreetingView.as_view(
        greeting='Bonjour',
        template_name='greeting_fr.html',
    ), name='bonjour'),
]

# Передача несуществующего атрибута → TypeError при старте
# GreetingView.as_view(unknown=42)`,
  },
  {
    name: "View.setup(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Метод-хук, вызываемый перед dispatch() для инициализации экземпляра View на основе входящего запроса. Сохраняет request, args и kwargs как атрибуты self.request, self.args, self.kwargs, чтобы они были доступны во всех методах класса. Переопределяется, когда нужно подготовить общие данные (например, загрузить объект из URL) до вызова get/post.",
    syntax: "View.setup(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest, поступивший в представление.",
      },
      {
        name: "*args",
        description:
          "Позиционные аргументы, извлечённые URL-резолвером из шаблона маршрута.",
      },
      {
        name: "**kwargs",
        description:
          'Именованные аргументы, извлечённые из URL-резолвера (например, параметры из path("article/<int:pk>/", ...)).',
      },
    ],
    example: `from django.views.generic import View
from django.http import JsonResponse, Http404
from .models import Article

class ArticleView(View):
    def setup(self, request, *args, **kwargs):
        super().setup(request, *args, **kwargs)
        # Загружаем объект один раз, чтобы использовать в любом методе
        try:
            self.article = Article.objects.get(pk=kwargs['pk'])
        except Article.DoesNotExist as exc:
            raise Http404('Статья не найдена') from exc

    def get(self, request, *args, **kwargs):
        return JsonResponse({'title': self.article.title})

    def delete(self, request, *args, **kwargs):
        self.article.delete()
        return JsonResponse({'deleted': True})

# urls.py
# path('article/<int:pk>/', ArticleView.as_view())`,
  },
  {
    name: "View.dispatch(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Главный диспетчер представления: определяет HTTP-метод запроса и вызывает одноимённый метод (get, post и т. д.) на экземпляре View. Если метод не разрешён (отсутствует в http_method_names) или не реализован, делегирует обработку http_method_not_allowed. Часто переопределяется для централизованной логики: проверки прав, логирования, оборачивания в декораторы.",
    syntax: "View.dispatch(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest текущего запроса.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.views.generic import View
from django.http import HttpResponse, HttpResponseForbidden
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class ProtectedView(View):
    def dispatch(self, request, *args, **kwargs):
        # Централизованная проверка авторизации
        if not request.user.is_authenticated:
            return HttpResponseForbidden('Войдите, чтобы продолжить')
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        return HttpResponse(f'Привет, {request.user.username}!')

# Декорирование dispatch — типовой способ применить декораторы view-функций
@method_decorator(cache_page(60), name='dispatch')
class CachedView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponse('Кешируется на минуту')`,
  },
  {
    name: "View.http_method_not_allowed(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Метод-обработчик, вызываемый dispatch(), когда HTTP-метод запроса не входит в http_method_names или не реализован в классе. По умолчанию возвращает HttpResponseNotAllowed (HTTP 405) с заголовком Allow, перечисляющим допустимые методы. Может быть переопределён для возврата кастомного ответа.",
    syntax: "View.http_method_not_allowed(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest с недопустимым HTTP-методом.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.views.generic import View
from django.http import JsonResponse

class JsonOnlyAPI(View):
    http_method_names = ['get', 'post']

    def get(self, request, *args, **kwargs):
        return JsonResponse({'method': 'GET'})

    def post(self, request, *args, **kwargs):
        return JsonResponse({'method': 'POST'})

    def http_method_not_allowed(self, request, *args, **kwargs):
        # Кастомный JSON-ответ вместо стандартного HTML 405
        return JsonResponse(
            {
                'error': 'method_not_allowed',
                'method': request.method,
                'allowed': self._allowed_methods(),
            },
            status=405,
            headers={'Allow': ', '.join(self._allowed_methods())},
        )

# DELETE /api/  →  {"error": "method_not_allowed", "method": "DELETE",
#                   "allowed": ["GET", "POST", "HEAD", "OPTIONS"]}`,
  },
  {
    name: "View.options(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Стандартный обработчик HTTP-метода OPTIONS. Возвращает пустой HttpResponse с заголовком Allow, в котором перечислены HTTP-методы, поддерживаемые данным View. Полезен для CORS-preflight-запросов и инспекции API. Может быть переопределён для добавления собственных заголовков (CORS, авторизация и пр.).",
    syntax: "View.options(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest с методом OPTIONS.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.views.generic import View
from django.http import JsonResponse

class CORSAPIView(View):
    http_method_names = ['get', 'post', 'options']

    def get(self, request, *args, **kwargs):
        return JsonResponse({'data': 'ok'})

    def post(self, request, *args, **kwargs):
        return JsonResponse({'created': True}, status=201)

    def options(self, request, *args, **kwargs):
        # Дополняем стандартный ответ CORS-заголовками для preflight
        response = super().options(request, *args, **kwargs)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Max-Age'] = '86400'
        return response

# OPTIONS /api/  →  HTTP 200
#                   Allow: GET, POST, OPTIONS
#                   Access-Control-Allow-Origin: *`,
  },
  {
    name: "TemplateView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.TemplateView — отображает HTML-шаблон с подготовленным контекстом. Самый простой generic-view, не привязанный к моделям. Использует MRO-цепочку TemplateResponseMixin → ContextMixin → View. Предназначен для статических страниц (about, contact, главная), где нужен только шаблон и, возможно, немного контекста.",
    syntax: `from django.views.generic import TemplateView

class AboutView(TemplateView):
    template_name = 'about.html'`,
    arguments: [],
    example: `# views.py
from django.views.generic import TemplateView

class HomeView(TemplateView):
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['featured_count'] = 42
        return ctx

# urls.py
from django.urls import path
from .views import HomeView

urlpatterns = [
    # Можно подключать прямо в urls.py без отдельного класса
    path('', HomeView.as_view(), name='home'),
    path('about/', TemplateView.as_view(template_name='about.html'), name='about'),
]

# templates/home.html
# <h1>Главная</h1>
# <p>Избранных статей: {{ featured_count }}</p>`,
  },
  {
    name: "TemplateView.template_name",
    category: "Built-in class-based views API",
    description:
      "Имя HTML-шаблона, который рендерит TemplateView (и любой другой класс на основе TemplateResponseMixin). Путь указывается относительно директорий, перечисленных в TEMPLATES → DIRS, и каталогов templates/ установленных приложений. Если атрибут не задан и не переопределён get_template_names(), при рендеринге выбрасывается ImproperlyConfigured.",
    syntax: 'TemplateView.template_name = "app/page.html"',
    arguments: [],
    example: `from django.views.generic import TemplateView

class ContactView(TemplateView):
    template_name = 'pages/contact.html'

# Можно задать прямо в URLconf через as_view()
# urls.py
from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('privacy/', TemplateView.as_view(template_name='pages/privacy.html')),
    path('terms/',   TemplateView.as_view(template_name='pages/terms.html')),
]

# Динамический выбор шаблона — переопределить get_template_names()
class ResponsiveView(TemplateView):
    def get_template_names(self):
        if self.request.headers.get('User-Agent', '').lower().find('mobile') >= 0:
            return ['pages/home_mobile.html']
        return ['pages/home_desktop.html']`,
  },
  {
    name: "TemplateView.get_context_data(**kwargs)",
    category: "Built-in class-based views API",
    description:
      "Метод ContextMixin, формирующий словарь контекста, передаваемый в шаблон. По умолчанию включает kwargs из URL-резолвера и self.view (ссылку на сам экземпляр). Переопределяется для добавления данных в шаблон. Обязательно вызывать super().get_context_data(**kwargs), чтобы не потерять стандартные ключи.",
    syntax: "TemplateView.get_context_data(**kwargs)",
    arguments: [
      {
        name: "**kwargs",
        description:
          "Именованные аргументы — обычно содержат параметры из URL-резолвера. При переопределении передавайте их в super().get_context_data(**kwargs).",
      },
    ],
    example: `from django.views.generic import TemplateView
from .models import Article, Category

class DashboardView(TemplateView):
    template_name = 'dashboard.html'

    def get_context_data(self, **kwargs):
        # super() добавит view, request-параметры из URL и т.п.
        ctx = super().get_context_data(**kwargs)
        ctx['articles']   = Article.objects.published()[:10]
        ctx['categories'] = Category.objects.all()
        ctx['user_name']  = self.request.user.get_full_name()
        return ctx

# urls.py
# path('dashboard/', DashboardView.as_view(), name='dashboard')

# templates/dashboard.html
# <h1>Привет, {{ user_name }}!</h1>
# <ul>
#   {% for a in articles %}<li>{{ a.title }}</li>{% endfor %}
# </ul>`,
  },
  {
    name: "RedirectView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.RedirectView — выполняет HTTP-редирект на заданный URL. По умолчанию использует HTTP 302 (временный редирект); для постоянного установите permanent = True (HTTP 301). Если целевой URL не найден ни через url, ни через pattern_name, ни через get_redirect_url(), возвращает HTTP 410 Gone.",
    syntax: `from django.views.generic import RedirectView

class OldUrl(RedirectView):
    url = '/new-url/'
    permanent = True`,
    arguments: [],
    example: `from django.views.generic import RedirectView

class GoToDocs(RedirectView):
    url = 'https://docs.djangoproject.com/'
    permanent = False        # HTTP 302 (по умолчанию)
    query_string = True      # пробросить ?foo=bar в редирект

class GoToProfile(RedirectView):
    pattern_name = 'profile'  # имя URL-маршрута
    permanent = False

# urls.py
from django.urls import path
from django.views.generic import RedirectView
from .views import GoToDocs, GoToProfile

urlpatterns = [
    path('docs/',  GoToDocs.as_view()),
    path('me/',    GoToProfile.as_view()),
    # Можно объявить прямо в urls.py:
    path('home/',  RedirectView.as_view(url='/', permanent=True)),
]

# Динамический редирект через get_redirect_url()
class ShortLinkView(RedirectView):
    permanent = False
    query_string = True

    def get_redirect_url(self, *args, **kwargs):
        from .models import ShortLink
        link = ShortLink.objects.get(slug=kwargs['slug'])
        return link.target_url`,
  },
  {
    name: "RedirectView.url",
    category: "Built-in class-based views API",
    description:
      "Атрибут с целевым URL для редиректа в виде готовой строки. Используется, когда адрес статичен и не зависит от параметров запроса. Поддерживает форматирование %-подстановок именованными группами из URL: значения args и kwargs текущего запроса передаются в str.format-подобном %-формате. Если нужен реверс по имени маршрута — используйте pattern_name вместо url.",
    syntax: 'RedirectView.url = "/some/path/"',
    arguments: [],
    example: `from django.views.generic import RedirectView

# Простой статичный редирект
class GoHome(RedirectView):
    url = '/'
    permanent = True   # HTTP 301

# С подстановкой параметров из URL: %(name)s
class UserRedirect(RedirectView):
    # значения kwargs из URL подставляются через %-форматирование
    url = '/profile/%(username)s/'

# urls.py
from django.urls import path
urlpatterns = [
    path('legacy-home/', GoHome.as_view()),
    # /old/users/alice/ → /profile/alice/
    path('old/users/<str:username>/', UserRedirect.as_view()),
]

# Если url = None и pattern_name тоже None — будет HTTP 410 Gone:
class GoneView(RedirectView):
    url = None`,
  },
  {
    name: "RedirectView.pattern_name",
    category: "Built-in class-based views API",
    description:
      "Имя URL-маршрута, по которому будет выполнен реверс (django.urls.reverse) для построения целевого URL редиректа. Альтернатива атрибуту url, когда адрес зависит от текущей конфигурации urls.py и должен пересчитываться. args и kwargs текущего запроса автоматически прокидываются в reverse(); если требуется иная логика — переопределите get_redirect_url().",
    syntax: 'RedirectView.pattern_name = "url-name"',
    arguments: [],
    example: `from django.views.generic import RedirectView

class GoToDashboard(RedirectView):
    pattern_name = 'dashboard'   # url(..., name='dashboard')
    permanent = False

# Передача параметров из URL текущего запроса в reverse():
class GoToArticle(RedirectView):
    # /redirect/article/42/  →  reverse('article-detail', kwargs={'pk': 42})
    pattern_name = 'article-detail'

# urls.py
from django.urls import path
from .views import ArticleDetailView, GoToDashboard, GoToArticle

urlpatterns = [
    path('dashboard/', ..., name='dashboard'),
    path('articles/<int:pk>/', ArticleDetailView.as_view(), name='article-detail'),

    path('go/dashboard/',           GoToDashboard.as_view()),
    path('redirect/article/<int:pk>/', GoToArticle.as_view()),
]

# Если url задан — он имеет приоритет над pattern_name.
# Если оба равны None — HTTP 410 Gone.`,
  },
  {
    name: "RedirectView.permanent",
    category: "Built-in class-based views API",
    description:
      "Булев атрибут, определяющий тип HTTP-редиректа. Если True — возвращается HTTP 301 Moved Permanently (постоянный редирект, кешируется браузерами и поисковыми системами); если False — HTTP 302 Found (временный). Значение по умолчанию — False, начиная с Django 1.9. Используйте True только для адресов, которые действительно изменились навсегда (миграция структуры URL, переезд на другой домен).",
    syntax: "RedirectView.permanent = False",
    arguments: [],
    example: `from django.views.generic import RedirectView

# Временный редирект (302) — по умолчанию
class TemporaryRedirect(RedirectView):
    url = '/maintenance/'
    permanent = False

# Постоянный редирект (301) — для миграции старых URL
class OldArticleUrl(RedirectView):
    pattern_name = 'article-detail'
    permanent = True       # SEO-friendly: поисковики обновят индекс

# urls.py
from django.urls import path
from django.views.generic import RedirectView

urlpatterns = [
    # /blog/<slug>/  →  301  /articles/<slug>/
    path(
        'blog/<slug:slug>/',
        RedirectView.as_view(
            pattern_name='article-detail',
            permanent=True,
        ),
    ),
    # /promo/  →  302  /landing/
    path(
        'promo/',
        RedirectView.as_view(url='/landing/', permanent=False),
    ),
]`,
  },
  {
    name: "RedirectView.query_string",
    category: "Built-in class-based views API",
    description:
      'Булев атрибут, управляющий передачей строки запроса (query string) в целевой URL редиректа. Если True — параметры из request.META["QUERY_STRING"] добавляются к итоговому URL; если False (по умолчанию) — query string отбрасывается. Полезно для UTM-меток, поисковых параметров и других данных, которые не должны теряться при редиректе.',
    syntax: "RedirectView.query_string = False",
    arguments: [],
    example: `from django.views.generic import RedirectView

# Сохраняем все query-параметры (UTM-метки, фильтры и т.п.)
class TrackedRedirect(RedirectView):
    url = '/landing/'
    query_string = True
    permanent = False

# /go/?utm_source=vk&utm_campaign=spring  →  /landing/?utm_source=vk&utm_campaign=spring

# Отбрасываем query-параметры (значение по умолчанию)
class CleanRedirect(RedirectView):
    url = '/clean/'
    query_string = False

# /go-clean/?secret=token  →  /clean/   (без ?secret=token)

# urls.py
from django.urls import path
urlpatterns = [
    path('go/',       TrackedRedirect.as_view()),
    path('go-clean/', CleanRedirect.as_view()),

    # Прямо в URLconf
    path(
        'short/<slug:slug>/',
        RedirectView.as_view(
            pattern_name='article-detail',
            query_string=True,    # пробросим ?utm_*=...
            permanent=False,
        ),
    ),
]`,
  },
  {
    name: "RedirectView.get_redirect_url(*args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Метод, формирующий целевой URL для редиректа. Стандартная реализация: 1) если задан url — форматирует его %-подстановкой по kwargs; 2) иначе если задан pattern_name — выполняет reverse(pattern_name, args=args, kwargs=kwargs); 3) если оба None — возвращает None (что приводит к HTTP 410 Gone). При query_string=True добавляет строку запроса. Переопределяется для произвольной логики формирования URL (БД-поиск, выбор по условию).",
    syntax: "RedirectView.get_redirect_url(*args, **kwargs)",
    arguments: [
      {
        name: "*args",
        description:
          "Позиционные аргументы из URL-резолвера. Передаются в reverse() при использовании pattern_name.",
      },
      {
        name: "**kwargs",
        description:
          "Именованные аргументы из URL-резолвера. Используются для %-подстановки в url или для reverse() с pattern_name.",
      },
    ],
    example: `from django.views.generic import RedirectView
from django.shortcuts import get_object_or_404
from .models import ShortLink, Article

# Динамический редирект: тянем целевой URL из БД
class ShortLinkRedirect(RedirectView):
    permanent = False
    query_string = True

    def get_redirect_url(self, *args, **kwargs):
        link = get_object_or_404(ShortLink, slug=kwargs['slug'])
        link.click_count += 1
        link.save(update_fields=['click_count'])
        return link.target_url

# Условный редирект: разные адреса для разных пользователей
class SmartHomeRedirect(RedirectView):
    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        user = self.request.user
        if not user.is_authenticated:
            return '/login/'
        if user.is_staff:
            return '/admin/'
        return super().get_redirect_url(*args, **kwargs)  # fallback на self.url

    url = '/dashboard/'

# Возврат None → HTTP 410 Gone (страница безвозвратно удалена)
class GoneArticle(RedirectView):
    def get_redirect_url(self, *args, **kwargs):
        if Article.objects.filter(slug=kwargs['slug']).exists():
            return f'/articles/{kwargs["slug"]}/'
        return None

# urls.py
# path('s/<slug:slug>/',       ShortLinkRedirect.as_view())
# path('home/',                 SmartHomeRedirect.as_view())
# path('legacy/<slug:slug>/',   GoneArticle.as_view())`,
  },
  {
    name: "FormView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.edit.FormView — отображает HTML-форму, обрабатывает её отправку и валидацию, без привязки к модели. Удобен для контактных форм, поиска, фильтров и любых форм, где не создаётся/изменяется объект БД. На GET рендерит шаблон с form, на POST вызывает form_valid() при успешной валидации либо form_invalid() при ошибках.",
    syntax: `from django.views.generic.edit import FormView

class ContactView(FormView):
    template_name = 'contact.html'
    form_class = ContactForm
    success_url = '/thanks/'

    def form_valid(self, form):
        # обработать данные
        return super().form_valid(form)`,
    arguments: [],
    example: `# forms.py
from django import forms

class ContactForm(forms.Form):
    name    = forms.CharField(max_length=100)
    email   = forms.EmailField()
    message = forms.CharField(widget=forms.Textarea)

# views.py
from django.urls import reverse_lazy
from django.views.generic.edit import FormView
from django.core.mail import send_mail
from .forms import ContactForm

class ContactView(FormView):
    template_name = 'contact/form.html'
    form_class = ContactForm
    success_url = reverse_lazy('contact-thanks')   # куда редиректить после POST

    def form_valid(self, form):
        # form.cleaned_data доступен после успешной валидации
        send_mail(
            subject=f'Обращение от {form.cleaned_data["name"]}',
            message=form.cleaned_data['message'],
            from_email=form.cleaned_data['email'],
            recipient_list=['support@example.com'],
        )
        return super().form_valid(form)   # выполнит редирект на success_url

    def form_invalid(self, form):
        # вызывается при ошибке валидации; рендерит ту же страницу с form.errors
        return super().form_invalid(form)

# urls.py
# path('contact/',        ContactView.as_view(),               name='contact')
# path('contact/thanks/', TemplateView.as_view(...),          name='contact-thanks')

# templates/contact/form.html
# <form method="post">{% csrf_token %}{{ form.as_p }}<button>Отправить</button></form>`,
  },
  {
    name: "BaseFormView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.edit.BaseFormView — реализует логику обработки HTML-формы (GET/POST, form_valid, form_invalid) без миксина рендеринга шаблона (TemplateResponseMixin). Используется как фундамент для собственных представлений, которые возвращают не HTML, а JSON, XML, файлы и т. п. Прямой родитель FormView (= BaseFormView + TemplateResponseMixin).",
    syntax: `from django.views.generic.edit import BaseFormView

class JsonFormView(BaseFormView):
    form_class = MyForm
    def form_valid(self, form):
        ...
        return JsonResponse({'ok': True})`,
    arguments: [],
    example: `# JSON-only API endpoint на основе формы — без шаблона
from django.http import JsonResponse
from django.views.generic.edit import BaseFormView
from django import forms

class SubscribeForm(forms.Form):
    email = forms.EmailField()

class SubscribeAPIView(BaseFormView):
    form_class = SubscribeForm
    http_method_names = ['post', 'options']

    def form_valid(self, form):
        # сохраняем подписку и возвращаем JSON
        Subscriber.objects.get_or_create(email=form.cleaned_data['email'])
        return JsonResponse({'status': 'ok'}, status=201)

    def form_invalid(self, form):
        return JsonResponse(
            {'status': 'error', 'errors': form.errors},
            status=400,
        )

# urls.py
# path('api/subscribe/', SubscribeAPIView.as_view())

# Чем отличается от FormView:
#   FormView      = BaseFormView + TemplateResponseMixin   (рендерит template_name на GET и form_invalid)
#   BaseFormView  = ProcessFormView + FormMixin            (без рендеринга шаблона)`,
  },
  {
    name: "CreateView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.edit.CreateView — отображает форму для создания нового объекта модели и сохраняет его в БД при успешной валидации. Автоматически строит ModelForm на основе model + fields (или принимает явный form_class). После сохранения редиректит на get_absolute_url() созданного объекта или на success_url.",
    syntax: `from django.views.generic.edit import CreateView

class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'body']`,
    arguments: [],
    example: `# views.py
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Article

class ArticleCreate(LoginRequiredMixin, CreateView):
    model = Article
    fields = ['title', 'slug', 'body', 'category']
    template_name = 'articles/article_form.html'  # по умолчанию: <app>/<model>_form.html
    success_url = reverse_lazy('article-list')    # либо вернёт object.get_absolute_url()

    def form_valid(self, form):
        # Установить автора до сохранения
        form.instance.author = self.request.user
        return super().form_valid(form)

# Альтернатива через form_class
from django import forms
class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ['title', 'slug', 'body']

class ArticleCreate2(CreateView):
    form_class = ArticleForm
    template_name = 'articles/article_form.html'

# urls.py
# path('articles/new/', ArticleCreate.as_view(), name='article-create')`,
  },
  {
    name: "BaseCreateView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.edit.BaseCreateView — реализует логику создания нового объекта модели через форму (GET формы / POST валидации и сохранения) без миксина рендеринга шаблона. Прямой родитель CreateView (= BaseCreateView + TemplateResponseMixin). Используется для возврата нестандартных ответов: JSON, файлов, редиректов на внешние URL.",
    syntax: `from django.views.generic.edit import BaseCreateView

class ApiCreateView(BaseCreateView):
    model = Article
    fields = ['title', 'body']
    def form_valid(self, form):
        ...`,
    arguments: [],
    example: `# JSON-эндпоинт создания записи без HTML-шаблона
from django.http import JsonResponse
from django.views.generic.edit import BaseCreateView
from .models import Comment

class CommentCreateAPI(BaseCreateView):
    model = Comment
    fields = ['post', 'text']
    http_method_names = ['post']     # не нужен GET-рендеринг формы

    def form_valid(self, form):
        form.instance.author = self.request.user
        self.object = form.save()
        return JsonResponse(
            {'id': self.object.pk, 'created_at': self.object.created_at.isoformat()},
            status=201,
        )

    def form_invalid(self, form):
        return JsonResponse({'errors': form.errors}, status=400)

# urls.py
# path('api/comments/', CommentCreateAPI.as_view())

# CreateView      = BaseCreateView + TemplateResponseMixin
# BaseCreateView  = ModelFormMixin + ProcessFormView (без шаблонов)`,
  },
  {
    name: "UpdateView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.edit.UpdateView — отображает форму для редактирования существующего объекта модели и сохраняет изменения в БД. Объект загружается через SingleObjectMixin (по pk или slug из URL). Шаблон по умолчанию — <app>/<model>_form.html (тот же, что и у CreateView). После сохранения редиректит на get_absolute_url() или success_url.",
    syntax: `from django.views.generic.edit import UpdateView

class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']`,
    arguments: [],
    example: `# views.py
from django.urls import reverse_lazy
from django.views.generic.edit import UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import Article

class ArticleUpdate(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Article
    fields = ['title', 'body', 'category']
    template_name = 'articles/article_form.html'
    # success_url не задан — будет редирект на article.get_absolute_url()

    def test_func(self):
        # Редактировать может только автор статьи
        return self.get_object().author == self.request.user

    def form_valid(self, form):
        form.instance.updated_by = self.request.user
        return super().form_valid(form)

# urls.py
# path('articles/<slug:slug>/edit/', ArticleUpdate.as_view(), name='article-update')

# В шаблоне форма уже заполнена текущими значениями объекта:
# <form method="post">{% csrf_token %}{{ form.as_p }}<button>Сохранить</button></form>`,
  },
  {
    name: "BaseUpdateView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.edit.BaseUpdateView — реализует логику редактирования существующего объекта через форму без миксина рендеринга шаблона. Прямой родитель UpdateView (= BaseUpdateView + TemplateResponseMixin). Используется для API-эндпоинтов и других нестандартных ответов.",
    syntax: `from django.views.generic.edit import BaseUpdateView

class ApiUpdateView(BaseUpdateView):
    model = Article
    fields = ['title', 'body']
    def form_valid(self, form):
        ...`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.edit import BaseUpdateView
from .models import Profile

class ProfileUpdateAPI(BaseUpdateView):
    model = Profile
    fields = ['bio', 'avatar']
    http_method_names = ['post', 'put', 'patch']

    def get_object(self, queryset=None):
        # Редактируется профиль текущего пользователя
        return self.request.user.profile

    def form_valid(self, form):
        self.object = form.save()
        return JsonResponse(
            {'id': self.object.pk, 'bio': self.object.bio},
            status=200,
        )

    def form_invalid(self, form):
        return JsonResponse({'errors': form.errors}, status=400)

# urls.py
# path('api/profile/', ProfileUpdateAPI.as_view())

# UpdateView      = BaseUpdateView + TemplateResponseMixin
# BaseUpdateView  = ModelFormMixin + ProcessFormView (без шаблонов)`,
  },
  {
    name: "DeleteView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.edit.DeleteView — отображает страницу подтверждения удаления объекта (GET) и удаляет объект из БД при отправке формы (POST). Шаблон по умолчанию — <app>/<model>_confirm_delete.html. После удаления редиректит на success_url (атрибут обязателен, либо переопределите get_success_url()).",
    syntax: `from django.views.generic.edit import DeleteView

class ArticleDelete(DeleteView):
    model = Article
    success_url = reverse_lazy('article-list')`,
    arguments: [],
    example: `# views.py
from django.urls import reverse_lazy
from django.views.generic.edit import DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import messages
from .models import Article

class ArticleDelete(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Article
    template_name = 'articles/article_confirm_delete.html'
    success_url = reverse_lazy('article-list')

    def test_func(self):
        # Удалять может только автор
        return self.get_object().author == self.request.user

    def form_valid(self, form):
        # Хук, добавленный в Django 4.0 — выполняется до удаления
        messages.success(self.request, f'Статья "{self.object.title}" удалена')
        return super().form_valid(form)

# urls.py
# path('articles/<slug:slug>/delete/', ArticleDelete.as_view(), name='article-delete')

# templates/articles/article_confirm_delete.html
# <form method="post">{% csrf_token %}
#   <p>Удалить статью «{{ object.title }}»?</p>
#   <button type="submit">Да, удалить</button>
#   <a href="{{ object.get_absolute_url }}">Отмена</a>
# </form>`,
  },
  {
    name: "BaseDeleteView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.edit.BaseDeleteView — реализует логику удаления объекта (GET для контекста, POST для удаления) без миксина рендеринга шаблона. Прямой родитель DeleteView (= BaseDeleteView + TemplateResponseMixin). Используется для DELETE-эндпоинтов API и других нестандартных ответов.",
    syntax: `from django.views.generic.edit import BaseDeleteView

class ApiDeleteView(BaseDeleteView):
    model = Article
    success_url = '/articles/'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.edit import BaseDeleteView
from .models import Comment

class CommentDeleteAPI(BaseDeleteView):
    model = Comment
    http_method_names = ['post', 'delete']
    success_url = '/'   # обязателен, но мы вернём JSON, а не редирект

    def get_queryset(self):
        # Удалять можно только свои комментарии
        return super().get_queryset().filter(author=self.request.user)

    def form_valid(self, form):
        # Перехватываем — не редиректим, а отдаём JSON
        self.object = self.get_object()
        pk = self.object.pk
        self.object.delete()
        return JsonResponse({'deleted': True, 'id': pk}, status=200)

# urls.py
# path('api/comments/<int:pk>/', CommentDeleteAPI.as_view())

# DeleteView      = BaseDeleteView + TemplateResponseMixin
# BaseDeleteView  = DeletionMixin + FormMixin + BaseDetailView (без шаблонов)`,
  },
  {
    name: "FormView.template_name",
    category: "Built-in class-based views API",
    description:
      "Имя HTML-шаблона, который рендерится для отображения формы (на GET-запросе и при form_invalid). У FormView не имеет значения по умолчанию — атрибут обязательно должен быть задан явно (либо через get_template_names()), иначе при первом запросе будет выброшено ImproperlyConfigured. Путь указывается относительно директорий шаблонов проекта.",
    syntax: 'FormView.template_name = "app/form.html"',
    arguments: [],
    example: `from django import forms
from django.views.generic.edit import FormView

class FeedbackForm(forms.Form):
    subject = forms.CharField(max_length=200)
    body    = forms.CharField(widget=forms.Textarea)

class FeedbackView(FormView):
    template_name = 'feedback/form.html'   # обязательно
    form_class = FeedbackForm
    success_url = '/feedback/sent/'

# Динамический выбор шаблона — переопределение get_template_names()
class ResponsiveFeedbackView(FeedbackView):
    def get_template_names(self):
        if self.request.headers.get('HX-Request'):  # HTMX-запрос
            return ['feedback/_form_partial.html']
        return ['feedback/form.html']

# templates/feedback/form.html
# <form method="post">
#   {% csrf_token %}
#   {{ form.as_p }}
#   <button>Отправить</button>
# </form>`,
  },
  {
    name: "FormView.form_class",
    category: "Built-in class-based views API",
    description:
      "Класс формы (наследник django.forms.Form или ModelForm), экземпляры которого создаются для отображения и валидации. Передаётся в шаблон как переменная form. Является основным способом конфигурирования FormView; для сложных случаев можно переопределить get_form_class(), чтобы выбирать класс формы динамически (на основе пользователя, параметров запроса и т. п.).",
    syntax: "FormView.form_class = MyForm",
    arguments: [],
    example: `# forms.py
from django import forms

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)

class AdminLoginForm(LoginForm):
    otp_code = forms.CharField(label='OTP-код', max_length=6)

# views.py
from django.views.generic.edit import FormView
from .forms import LoginForm, AdminLoginForm

class LoginView(FormView):
    template_name = 'auth/login.html'
    form_class = LoginForm
    success_url = '/'

# Динамический выбор формы — get_form_class()
class SmartLoginView(FormView):
    template_name = 'auth/login.html'
    success_url = '/'

    def get_form_class(self):
        # Для admin-секции — расширенная форма с OTP
        if self.request.path.startswith('/admin/'):
            return AdminLoginForm
        return LoginForm

# Передача дополнительных kwargs в форму — get_form_kwargs()
class UserAwareFormView(FormView):
    template_name = 'profile/edit.html'
    form_class = LoginForm

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user   # форма должна принимать user в __init__
        return kwargs`,
  },
  {
    name: "FormView.success_url",
    category: "Built-in class-based views API",
    description:
      'URL, на который выполняется HTTP-редирект после успешной обработки формы (form_valid). Можно указать строкой ("/thanks/") или, что предпочтительнее, через reverse_lazy("name") — ленивая версия reverse, чтобы избежать циклических импортов при загрузке URLconf. Если success_url содержит %-подстановки вида %(field)s, они заменяются значениями из self.object.__dict__ (актуально для CreateView/UpdateView). Альтернатива — переопределить get_success_url() для произвольной логики.',
    syntax: 'FormView.success_url = reverse_lazy("name")',
    arguments: [],
    example: `from django.urls import reverse_lazy
from django.views.generic.edit import FormView
from .forms import OrderForm

class OrderFormView(FormView):
    template_name = 'orders/form.html'
    form_class = OrderForm
    # reverse_lazy — потому что URLconf на момент импорта ещё не загружен
    success_url = reverse_lazy('order-thanks')

    def form_valid(self, form):
        order = form.save_order()
        self.order = order   # сохраняем для get_success_url()
        return super().form_valid(form)

    def get_success_url(self):
        # Динамический URL на основе результатов формы
        return reverse_lazy('order-detail', kwargs={'pk': self.order.pk})

# Подстановка значений объекта (CreateView/UpdateView)
from django.views.generic.edit import CreateView
from .models import Article

class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'slug', 'body']
    # Доступ к атрибутам только что созданного объекта:
    success_url = '/articles/%(slug)s/'`,
  },
  {
    name: "FormView.form_valid(form)",
    category: "Built-in class-based views API",
    description:
      "Метод-хук, вызываемый, когда форма прошла валидацию (form.is_valid() == True). Стандартная реализация делает HTTP-редирект на get_success_url(). Переопределяется для выполнения побочных действий: сохранение в БД, отправка email, постановка задачи в очередь. Обязательно вернуть HttpResponse — обычно через super().form_valid(form), чтобы получить стандартный редирект.",
    syntax: "FormView.form_valid(form)",
    arguments: [
      {
        name: "form",
        description:
          "Экземпляр формы (form_class) с заполненным form.cleaned_data. Метод вызывается уже после успешной валидации.",
      },
    ],
    example: `from django.urls import reverse_lazy
from django.contrib import messages
from django.core.mail import send_mail
from django.views.generic.edit import FormView
from .forms import ContactForm
from .tasks import send_notification_async

class ContactView(FormView):
    template_name = 'contact/form.html'
    form_class = ContactForm
    success_url = reverse_lazy('contact-thanks')

    def form_valid(self, form):
        data = form.cleaned_data

        # 1. Записать обращение в БД
        ticket = Ticket.objects.create(
            email=data['email'],
            subject=data['subject'],
            body=data['message'],
        )

        # 2. Отправить уведомление модераторам (синхронно)
        send_mail(
            subject=f'Новое обращение #{ticket.id}',
            message=data['message'],
            from_email=data['email'],
            recipient_list=['support@example.com'],
        )

        # 3. Поставить асинхронную задачу
        send_notification_async.delay(ticket.id)

        # 4. Сообщение пользователю
        messages.success(self.request, 'Сообщение отправлено!')

        # Обязательно вернуть HttpResponse (super() сделает редирект на success_url)
        return super().form_valid(form)

    def form_invalid(self, form):
        messages.error(self.request, 'Проверьте поля формы')
        return super().form_invalid(form)`,
  },
  {
    name: "CreateView.template_name_suffix",
    category: "Built-in class-based views API",
    description:
      'Суффикс, добавляемый к имени модели для построения имени шаблона по умолчанию, если template_name не задан. У CreateView равен "_form" — итоговый шаблон ищется как <app_label>/<model_name>_form.html (имя модели в нижнем регистре). Например, для модели Article в приложении blog: blog/article_form.html. Тот же суффикс используется в UpdateView, поэтому create- и update-формы по умолчанию делят один шаблон.',
    syntax: 'CreateView.template_name_suffix = "_form"',
    arguments: [],
    example: `from django.views.generic.edit import CreateView
from .models import Article

# Стандартное поведение: ищется blog/article_form.html
class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'body']
    # template_name не задан → имя строится автоматически:
    # <app_label>/<model_name><template_name_suffix>.html
    # → blog/article_form.html

# Разделить шаблоны create и update
class ArticleCreate2(CreateView):
    model = Article
    fields = ['title', 'body']
    template_name_suffix = '_create_form'
    # → blog/article_create_form.html

# Полностью переопределить через template_name (имеет приоритет над суффиксом)
class ArticleCreate3(CreateView):
    model = Article
    fields = ['title', 'body']
    template_name = 'forms/article_new.html'

# Шаблонная иерархия поиска для CreateView (если ничего не задано):
#   1. <app_label>/<model_name>_form.html
#   2. (если model унаследована) — для базовых классов`,
  },
  {
    name: "CreateView.object",
    category: "Built-in class-based views API",
    description:
      "Атрибут экземпляра CreateView, ссылающийся на создаваемый объект модели. На GET-запросе равен None (объекта ещё нет). После успешной валидации формы и сохранения внутри form_valid() заполняется только что созданным экземпляром модели и используется для построения success_url, get_absolute_url() и передачи в контекст шаблона. Доступен в form_valid()/form_invalid()/get_context_data() через self.object.",
    syntax: "self.object  # экземпляр модели или None",
    arguments: [],
    example: `from django.views.generic.edit import CreateView
from django.http import JsonResponse
from .models import Article

class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'body', 'category']
    success_url = '/articles/'

    def form_valid(self, form):
        # До super() self.object ещё None
        assert self.object is None

        # ModelFormMixin.form_valid() сохранит объект и установит self.object
        response = super().form_valid(form)

        # После super() self.object — это новый Article
        print(f'Создана статья #{self.object.pk}: {self.object.title}')
        return response

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # На GET — None, на POST с ошибкой формы — None
        ctx['is_creating'] = self.object is None
        return ctx

# JSON-вариант — вернуть свежесозданный объект
class ArticleCreateAPI(CreateView):
    model = Article
    fields = ['title', 'body']
    http_method_names = ['post']

    def form_valid(self, form):
        self.object = form.save()
        return JsonResponse(
            {'id': self.object.pk, 'title': self.object.title},
            status=201,
        )`,
  },
  {
    name: "CreateView.model",
    category: "Built-in class-based views API",
    description:
      "Класс модели Django, для которой создаётся новый объект. На основе model автоматически строится ModelForm (если не задан form_class) и определяется имя шаблона по умолчанию (<app>/<model>_form.html). При указании model обязательно задать также fields (или form_class) — иначе будет ImproperlyConfigured. Альтернатива — переопределить get_queryset() для динамического выбора модели.",
    syntax: "CreateView.model = MyModel",
    arguments: [],
    example: `from django.views.generic.edit import CreateView
from .models import Article, Comment

class ArticleCreate(CreateView):
    model = Article            # из этого выводятся:
    fields = ['title', 'body'] #   - ModelForm для Article
                               #   - имя шаблона: <app>/article_form.html

# Альтернатива: form_class задаёт модель неявно через ModelForm.Meta
from django import forms

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['post', 'text']

class CommentCreate(CreateView):
    form_class = CommentForm   # model и fields брать не нужно — они в Meta
    template_name = 'comments/new.html'
    success_url = '/comments/'

# Если задано и model, и form_class — form_class имеет приоритет, model
# используется только для имени шаблона по умолчанию.

# Ошибка: model задан, fields/form_class — нет
class BrokenView(CreateView):
    model = Article
    # ImproperlyConfigured: Using ModelFormMixin (base class of BrokenView)
    # without the 'fields' attribute is prohibited.`,
  },
  {
    name: "CreateView.fields",
    category: "Built-in class-based views API",
    description:
      'Список имён полей модели, которые должны быть включены в автоматически генерируемую ModelForm. Используется только если form_class не задан. Поля выводятся в форму в указанном порядке. Альтернативные значения: список строк ["title", "body"], или "__all__" для включения всех полей модели (не рекомендуется в production — небезопасно для случайно добавленных полей). Не задавать одновременно с form_class — будет ImproperlyConfigured.',
    syntax: 'CreateView.fields = ["title", "body"]',
    arguments: [],
    example: `from django.views.generic.edit import CreateView
from .models import Article

# Явный список полей — рекомендуемый способ
class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'slug', 'body', 'category']
    # Порядок в списке = порядок отображения в форме

# Все поля модели (опасно — попадут случайно добавленные поля)
class ArticleCreateAll(CreateView):
    model = Article
    fields = '__all__'   # включит все редактируемые поля Article

# Если нужны кастомизации (виджеты, валидаторы, методы) — используйте form_class
from django import forms
class ArticleForm(forms.ModelForm):
    body = forms.CharField(widget=forms.Textarea(attrs={'rows': 20}))
    class Meta:
        model = Article
        fields = ['title', 'slug', 'body']

class ArticleCreate2(CreateView):
    form_class = ArticleForm   # не задавайте fields параллельно

# Нельзя задавать одновременно — ImproperlyConfigured:
class BrokenView(CreateView):
    model = Article
    fields = ['title']
    form_class = ArticleForm
    # Specifying both 'fields' and 'form_class' is not permitted.`,
  },
  {
    name: "UpdateView.template_name_suffix",
    category: "Built-in class-based views API",
    description:
      'Суффикс, добавляемый к имени модели для построения имени шаблона по умолчанию, если template_name не задан. У UpdateView равен "_form" — итоговый шаблон ищется как <app_label>/<model_name>_form.html. Совпадает с суффиксом CreateView, поэтому по умолчанию обе формы (создание и редактирование) используют один и тот же шаблон. Чтобы развести их, переопределите template_name_suffix или template_name.',
    syntax: 'UpdateView.template_name_suffix = "_form"',
    arguments: [],
    example: `from django.views.generic.edit import UpdateView
from .models import Article

# Стандартное поведение: тот же шаблон, что и у CreateView
class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']
    # → blog/article_form.html (общий с ArticleCreate)

# Разделить шаблоны create и update
class ArticleUpdate2(UpdateView):
    model = Article
    fields = ['title', 'body']
    template_name_suffix = '_update_form'
    # → blog/article_update_form.html

# Шаблон может проверять, является ли это создание или редактирование:
# templates/blog/article_form.html
# {% if object %}
#   <h1>Редактирование «{{ object.title }}»</h1>
# {% else %}
#   <h1>Новая статья</h1>
# {% endif %}
# <form method="post">{% csrf_token %}{{ form.as_p }}<button>Сохранить</button></form>

# Полное переопределение имени шаблона
class ArticleUpdate3(UpdateView):
    model = Article
    fields = ['title', 'body']
    template_name = 'forms/article_edit.html'`,
  },
  {
    name: "UpdateView.object",
    category: "Built-in class-based views API",
    description:
      "Атрибут экземпляра UpdateView, ссылающийся на редактируемый объект модели. Загружается из БД методом get_object() (на основе pk/slug из URL) ещё до вызова get/post — на любой стадии обработки запроса self.object содержит текущий объект. Используется при построении формы (instance=self.object), вычислении success_url через get_absolute_url(), а также доступен в шаблоне через переменную object и <model_name>.",
    syntax: "self.object  # текущий редактируемый экземпляр модели",
    arguments: [],
    example: `from django.views.generic.edit import UpdateView
from django.http import HttpResponseForbidden
from .models import Article

class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']

    def dispatch(self, request, *args, **kwargs):
        # self.object ещё не установлен в dispatch — вызовите get_object() явно
        article = self.get_object()
        if article.author != request.user:
            return HttpResponseForbidden('Чужая статья')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        # self.object уже загружен из БД (старая версия объекта)
        original_title = self.object.title

        # super() сохранит изменения и обновит self.object
        response = super().form_valid(form)

        if original_title != self.object.title:
            log_title_change(self.object, original_title)

        return response

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # В шаблоне доступно как {{ object }} и как {{ article }} (=context_object_name)
        ctx['is_published'] = self.object.status == 'published'
        return ctx`,
  },
  {
    name: "UpdateView.model",
    category: "Built-in class-based views API",
    description:
      "Класс модели Django, экземпляр которой редактируется. Используется для: автоматической генерации ModelForm (если form_class не задан), определения queryset по умолчанию (Model.objects.all()) при загрузке объекта и построения имени шаблона <app>/<model>_form.html. Альтернатива — задать queryset для ограничения видимых объектов или get_object() для произвольной логики загрузки.",
    syntax: "UpdateView.model = MyModel",
    arguments: [],
    example: `from django.views.generic.edit import UpdateView
from .models import Article

# Простейший случай — model + fields
class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']
    # urls.py: path('articles/<int:pk>/edit/', ArticleUpdate.as_view())

# Ограничение видимых объектов через queryset (а не model)
class MyArticleUpdate(UpdateView):
    fields = ['title', 'body']

    def get_queryset(self):
        # Пользователь редактирует только свои статьи
        return Article.objects.filter(author=self.request.user)
    # 404, если статья принадлежит другому автору

# Альтернатива: form_class задаёт модель через ModelForm.Meta
from django import forms
class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ['title', 'body']

class ArticleUpdate2(UpdateView):
    model = Article          # нужен для шаблона <app>/article_form.html
    form_class = ArticleForm # переопределяет автогенерируемую форму

# Поиск по slug вместо pk (нужно поле slug_url_kwarg)
class ArticleUpdateBySlug(UpdateView):
    model = Article
    fields = ['title', 'body']
    slug_url_kwarg = 'slug'   # параметр URL
    slug_field = 'slug'       # поле модели
    # urls.py: path('articles/<slug:slug>/edit/', ArticleUpdateBySlug.as_view())`,
  },
  {
    name: "UpdateView.fields",
    category: "Built-in class-based views API",
    description:
      'Список имён полей модели, доступных для редактирования через автоматически генерируемую ModelForm. Поля, не вошедшие в этот список, останутся со значениями, загруженными из БД, и не будут изменены даже если пользователь подменит их в HTTP-запросе. Используется только при отсутствии form_class. Допустимы значения: список строк или "__all__" (все редактируемые поля). Одновременное задание fields и form_class запрещено.',
    syntax: 'UpdateView.fields = ["title", "body"]',
    arguments: [],
    example: `from django.views.generic.edit import UpdateView
from .models import Article

# Разрешаем редактировать только title и body, остальные поля защищены
class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']
    # Поля author, created_at, status и т.п. нельзя изменить через эту форму,
    # даже если их значения подменить в POST.

# Разные права — разные наборы полей
class ArticleUpdateForAuthor(UpdateView):
    model = Article
    fields = ['title', 'body']

class ArticleUpdateForEditor(UpdateView):
    model = Article
    fields = ['title', 'body', 'status', 'category', 'featured']

# Динамический выбор полей в зависимости от пользователя
class SmartArticleUpdate(UpdateView):
    model = Article

    def get_form_class(self):
        from django.forms import modelform_factory
        if self.request.user.is_staff:
            fields = ['title', 'body', 'status', 'featured']
        else:
            fields = ['title', 'body']
        return modelform_factory(Article, fields=fields)

# Использование form_class — fields задавать нельзя (ImproperlyConfigured)
from django import forms
class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ['title', 'body']

class ArticleUpdate2(UpdateView):
    form_class = ArticleForm
    # fields = [...] здесь приведёт к ошибке`,
  },
  {
    name: "DeleteView.form_class",
    category: "Built-in class-based views API",
    description:
      "Класс формы подтверждения удаления (наследник django.forms.Form). Начиная с Django 4.0 DeleteView обрабатывает POST-запрос как отправку формы (раньше — как простой триггер удаления). По умолчанию используется django.views.generic.edit.Form (пустая форма, нужная только для CSRF-защиты). form_class задают для добавления собственных полей подтверждения: чекбокс «я уверен», ввод названия объекта, причина удаления и т. п.",
    syntax: "DeleteView.form_class = MyConfirmForm",
    arguments: [],
    example: `# forms.py
from django import forms

class ConfirmDeleteForm(forms.Form):
    confirm_text = forms.CharField(
        label='Введите название объекта для подтверждения',
        max_length=200,
    )
    reason = forms.CharField(
        label='Причина удаления',
        widget=forms.Textarea,
        required=False,
    )

# views.py
from django.urls import reverse_lazy
from django.views.generic.edit import DeleteView
from .forms import ConfirmDeleteForm
from .models import Article

class ArticleDelete(DeleteView):
    model = Article
    form_class = ConfirmDeleteForm
    success_url = reverse_lazy('article-list')

    def form_valid(self, form):
        # Проверяем кастомное поле перед удалением
        if form.cleaned_data['confirm_text'] != self.object.title:
            form.add_error('confirm_text', 'Текст не совпадает с названием статьи')
            return self.form_invalid(form)

        # Логируем причину
        DeletionLog.objects.create(
            object_repr=str(self.object),
            user=self.request.user,
            reason=form.cleaned_data.get('reason', ''),
        )
        return super().form_valid(form)   # удалит объект и редиректит на success_url

# templates/<app>/article_confirm_delete.html
# <form method="post">{% csrf_token %}
#   <p>Удалить «{{ object.title }}»?</p>
#   {{ form.as_p }}
#   <button>Удалить</button>
# </form>`,
  },
  {
    name: "DeleteView.template_name_suffix",
    category: "Built-in class-based views API",
    description:
      'Суффикс, добавляемый к имени модели для построения имени шаблона подтверждения удаления, если template_name не задан. У DeleteView равен "_confirm_delete" — итоговый шаблон ищется как <app_label>/<model_name>_confirm_delete.html. Например, для модели Article в приложении blog: blog/article_confirm_delete.html. Шаблон рендерится только на GET (показ страницы подтверждения); POST выполняет само удаление и редиректит на success_url.',
    syntax: 'DeleteView.template_name_suffix = "_confirm_delete"',
    arguments: [],
    example: `from django.views.generic.edit import DeleteView
from .models import Article

# Стандартное поведение: ищется blog/article_confirm_delete.html
class ArticleDelete(DeleteView):
    model = Article
    success_url = '/articles/'
    # template_name не задан → имя строится автоматически:
    # <app_label>/<model_name><template_name_suffix>.html
    # → blog/article_confirm_delete.html

# Кастомный суффикс для разных типов удаления (мягкое vs жёсткое)
class ArticleHardDelete(DeleteView):
    model = Article
    template_name_suffix = '_hard_delete'
    # → blog/article_hard_delete.html

# Полное переопределение через template_name (имеет приоритет над суффиксом)
class ArticleDelete2(DeleteView):
    model = Article
    template_name = 'forms/article_remove.html'
    success_url = '/articles/'

# templates/blog/article_confirm_delete.html
# <h1>Удалить «{{ object.title }}»?</h1>
# <p>Это действие нельзя отменить.</p>
# <form method="post">
#   {% csrf_token %}
#   <button>Да, удалить</button>
#   <a href="{{ object.get_absolute_url }}">Отмена</a>
# </form>`,
  },
  {
    name: "DeleteView.model",
    category: "Built-in class-based views API",
    description:
      "Класс модели Django, экземпляр которой удаляется. Используется для: загрузки объекта по pk/slug из URL (через get_object()), определения queryset по умолчанию (Model.objects.all()) и построения имени шаблона <app>/<model>_confirm_delete.html. Альтернатива — задать queryset (для ограничения видимых объектов) или переопределить get_object() для произвольной логики загрузки.",
    syntax: "DeleteView.model = MyModel",
    arguments: [],
    example: `from django.urls import reverse_lazy
from django.views.generic.edit import DeleteView
from .models import Article

# Простейший случай — просто model
class ArticleDelete(DeleteView):
    model = Article
    success_url = reverse_lazy('article-list')
    # urls.py: path('articles/<int:pk>/delete/', ArticleDelete.as_view())

# Ограничение видимых объектов через queryset (а не model)
class MyArticleDelete(DeleteView):
    success_url = reverse_lazy('article-list')

    def get_queryset(self):
        # Пользователь удаляет только свои статьи
        return Article.objects.filter(author=self.request.user)
    # 404, если статья принадлежит другому автору

# Поиск по slug вместо pk
class ArticleDeleteBySlug(DeleteView):
    model = Article
    success_url = reverse_lazy('article-list')
    slug_url_kwarg = 'slug'   # имя параметра в URL
    slug_field = 'slug'       # имя поля в модели
    # urls.py: path('articles/<slug:slug>/delete/', ArticleDeleteBySlug.as_view())

# Мягкое удаление вместо настоящего: переопределить form_valid()
class SoftDeleteView(DeleteView):
    model = Article
    success_url = reverse_lazy('article-list')

    def form_valid(self, form):
        self.object = self.get_object()
        self.object.is_deleted = True
        self.object.deleted_at = timezone.now()
        self.object.save(update_fields=['is_deleted', 'deleted_at'])
        return HttpResponseRedirect(self.get_success_url())`,
  },
  {
    name: "DeleteView.success_url",
    category: "Built-in class-based views API",
    description:
      'URL, на который выполняется HTTP-редирект после успешного удаления объекта. Атрибут обязателен — без него и без переопределения get_success_url() будет ImproperlyConfigured. Поддерживает %-подстановки из self.object.__dict__, но они вычисляются ДО удаления — после удаления атрибуты объекта (например, pk) ещё доступны. Лучшая практика — задавать через reverse_lazy("name"), чтобы избежать циклических импортов в URLconf.',
    syntax: 'DeleteView.success_url = reverse_lazy("name")',
    arguments: [],
    example: `from django.urls import reverse_lazy
from django.views.generic.edit import DeleteView
from .models import Article, Category

# Стандартный способ — reverse_lazy на список объектов
class ArticleDelete(DeleteView):
    model = Article
    success_url = reverse_lazy('article-list')

# %-подстановка из атрибутов удалённого объекта (доступны до redelete)
class ArticleDeleteToCategory(DeleteView):
    model = Article
    # category_id ещё доступен после удаления статьи
    success_url = '/categories/%(category_id)d/'

# Динамический success_url — переопределить get_success_url()
class CommentDelete(DeleteView):
    model = Comment

    def get_success_url(self):
        # Возвращаемся к посту, под которым был комментарий
        return reverse_lazy(
            'post-detail',
            kwargs={'slug': self.object.post.slug},
        )

# Возврат на referrer (страницу, с которой пришёл пользователь)
class SmartDeleteView(DeleteView):
    model = Article

    def get_success_url(self):
        return self.request.GET.get('next', reverse_lazy('article-list'))

# Без success_url и без get_success_url() — ImproperlyConfigured:
class BrokenDelete(DeleteView):
    model = Article
    # No URL to redirect to. Provide a success_url.`,
  },
  {
    name: "BaseCreateView.get(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик GET-запроса в BaseCreateView. Сбрасывает self.object в None (объекта ещё нет — его только создают), затем делегирует обработку родительскому ProcessFormView.get(): создаёт незаполненную форму через get_form() и передаёт её в шаблон через render_to_response(). Переопределяется редко — обычно достаточно настроить fields, form_class и шаблон.",
    syntax: "BaseCreateView.get(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest текущего GET-запроса.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.views.generic.edit import CreateView, BaseCreateView
from django.http import JsonResponse
from .models import Article

# Стандартное использование — переопределять get() обычно не нужно
class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'body']
    template_name = 'articles/article_form.html'
    # GET → пустая форма; POST → валидация и сохранение

# Переопределение get(): запретить отображение формы определённым пользователям
class GatedArticleCreate(CreateView):
    model = Article
    fields = ['title', 'body']
    template_name = 'articles/article_form.html'

    def get(self, request, *args, **kwargs):
        if not request.user.has_perm('articles.add_article'):
            return HttpResponseForbidden('Нет прав на создание статьи')
        # Стандартное поведение: self.object = None и рендеринг формы
        return super().get(request, *args, **kwargs)

# JSON-эндпоинт: вернуть схему формы вместо HTML
class ArticleCreateAPI(BaseCreateView):
    model = Article
    fields = ['title', 'body']
    http_method_names = ['get', 'post']

    def get(self, request, *args, **kwargs):
        self.object = None
        form = self.get_form()
        # Описание ожидаемых полей
        return JsonResponse({
            'fields': {
                name: {
                    'label': str(field.label),
                    'required': field.required,
                    'type': field.widget.__class__.__name__,
                }
                for name, field in form.fields.items()
            },
        })`,
  },
  {
    name: "BaseCreateView.post(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик POST-запроса в BaseCreateView. Сбрасывает self.object в None, затем делегирует обработку родительскому ProcessFormView.post(): создаёт форму с данными из request.POST/FILES, вызывает form.is_valid() и направляет результат в form_valid() (с сохранением self.object = form.save()) либо в form_invalid(). Переопределяется для предобработки данных или нестандартной логики обработки POST.",
    syntax: "BaseCreateView.post(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description:
          "Объект HttpRequest с методом POST. request.POST содержит данные формы, request.FILES — загруженные файлы.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.views.generic.edit import CreateView, BaseCreateView
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator
from .models import Article, Subscriber

# Стандартное использование — переопределять post() обычно не нужно,
# вместо этого используйте form_valid()/form_invalid()
class ArticleCreate(CreateView):
    model = Article
    fields = ['title', 'body']
    success_url = '/articles/'

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)

# Переопределение post() — централизованная защита от ботов
class SubscribeView(CreateView):
    model = Subscriber
    fields = ['email']
    success_url = '/'

    def post(self, request, *args, **kwargs):
        # Honeypot-поле проверяется до form.is_valid()
        if request.POST.get('website'):   # боты заполняют скрытое поле
            return HttpResponseForbidden('Bot detected')
        return super().post(request, *args, **kwargs)

# JSON-API: принять JSON-тело и сохранить
import json
class ArticleCreateAPI(BaseCreateView):
    model = Article
    fields = ['title', 'body']
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        # Собираем POST-данные из JSON-тела
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        # Подменяем request.POST для стандартной логики формы
        request.POST = data
        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        self.object = form.save()
        return JsonResponse({'id': self.object.pk}, status=201)

    def form_invalid(self, form):
        return JsonResponse({'errors': form.errors}, status=400)`,
  },
  {
    name: "BaseUpdateView.get(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик GET-запроса в BaseUpdateView. Загружает редактируемый объект через self.object = self.get_object(), затем делегирует обработку родительскому ProcessFormView.get(): создаёт форму с instance=self.object (поля заполнены текущими значениями) и передаёт её в шаблон. Если объект не найден — get_object() выбрасывает Http404.",
    syntax: "BaseUpdateView.get(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest текущего GET-запроса.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description:
          "Именованные аргументы из URL-резолвера (обычно содержат pk или slug объекта).",
      },
    ],
    example: `from django.views.generic.edit import UpdateView, BaseUpdateView
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
from .models import Article

# Стандартное использование — get() переопределять обычно не нужно
class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']
    template_name = 'articles/article_form.html'

# Переопределение get(): редирект, если объект уже опубликован
class DraftEditView(UpdateView):
    model = Article
    fields = ['title', 'body']
    template_name = 'articles/article_form.html'

    def get(self, request, *args, **kwargs):
        # super() сначала загрузит self.object через get_object(), но мы можем
        # выполнить проверку до показа формы:
        self.object = self.get_object()
        if self.object.status == 'published':
            return HttpResponseRedirect(
                reverse('article-detail', kwargs={'pk': self.object.pk})
            )
        # Стандартный путь — рендеринг формы
        return super().get(request, *args, **kwargs)

# JSON-эндпоинт: вернуть текущие значения вместо HTML-формы
class ArticleEditAPI(BaseUpdateView):
    model = Article
    fields = ['title', 'body']
    http_method_names = ['get', 'put', 'patch']

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()
        return JsonResponse({
            'id': self.object.pk,
            'values': {name: form[name].value() for name in form.fields},
        })`,
  },
  {
    name: "BaseUpdateView.post(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик POST-запроса в BaseUpdateView. Загружает редактируемый объект через self.object = self.get_object(), затем делегирует обработку родительскому ProcessFormView.post(): создаёт форму с instance=self.object и данными из request.POST/FILES, вызывает form.is_valid() и направляет в form_valid() (с сохранением через form.save()) либо form_invalid(). Тот же обработчик используется и для PUT/PATCH (через as_view() и http_method_names).",
    syntax: "BaseUpdateView.post(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description:
          "Объект HttpRequest с методом POST. request.POST содержит изменённые поля формы, request.FILES — загруженные файлы.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description:
          "Именованные аргументы из URL-резолвера (обычно pk или slug редактируемого объекта).",
      },
    ],
    example: `from django.views.generic.edit import UpdateView, BaseUpdateView
from django.http import JsonResponse, HttpResponseForbidden
from .models import Article

# Стандартное использование — обычно переопределяют form_valid(), а не post()
class ArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body']
    success_url = '/articles/'

    def form_valid(self, form):
        form.instance.updated_by = self.request.user
        return super().form_valid(form)

# Переопределение post() — оптимистичная блокировка по версии
class VersionedArticleUpdate(UpdateView):
    model = Article
    fields = ['title', 'body', 'version']

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        # Сравниваем версию из формы с актуальной в БД
        client_version = int(request.POST.get('version', 0))
        if client_version != self.object.version:
            return HttpResponseForbidden(
                'Объект был изменён другим пользователем. Перезагрузите страницу.'
            )
        return super().post(request, *args, **kwargs)

# JSON PATCH-эндпоинт: частичное обновление через JSON-тело
import json
class ArticlePatchAPI(BaseUpdateView):
    model = Article
    fields = ['title', 'body']
    http_method_names = ['patch']

    def patch(self, request, *args, **kwargs):
        # PATCH использует тот же код, что и post()
        return self.post(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        # Подмешиваем JSON-данные поверх текущих значений объекта
        self.object = self.get_object()
        merged = {f: getattr(self.object, f) for f in self.fields}
        merged.update(data)
        request.POST = merged
        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        self.object = form.save()
        return JsonResponse({'id': self.object.pk}, status=200)

    def form_invalid(self, form):
        return JsonResponse({'errors': form.errors}, status=400)`,
  },
  {
    name: "DetailView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.detail.DetailView — отображает страницу с одним объектом модели. Загружает объект из БД по pk или slug, переданному в URL, передаёт его в шаблон под именем object и под именем модели в нижнем регистре (например, article). Шаблон по умолчанию — <app_label>/<model_name>_detail.html. Состоит из BaseDetailView + SingleObjectTemplateResponseMixin.",
    syntax: `from django.views.generic.detail import DetailView

class ArticleDetail(DetailView):
    model = Article`,
    arguments: [],
    example: `# views.py
from django.views.generic.detail import DetailView
from .models import Article

class ArticleDetail(DetailView):
    model = Article
    # template_name по умолчанию: <app>/article_detail.html
    # context_object_name по умолчанию: 'article' (имя модели в нижнем регистре)

# urls.py
from django.urls import path
from .views import ArticleDetail

urlpatterns = [
    # /articles/42/  →  Article.objects.get(pk=42)
    path('articles/<int:pk>/', ArticleDetail.as_view(), name='article-detail'),
    # /articles/my-slug/  →  поиск по slug
    path(
        'articles/<slug:slug>/',
        ArticleDetail.as_view(slug_field='slug', slug_url_kwarg='slug'),
    ),
]

# templates/<app>/article_detail.html
# <h1>{{ article.title }}</h1>
# <p>{{ article.body }}</p>
# <p>Автор: {{ article.author }}</p>
# Эквивалентно: {{ object.title }}, {{ object.body }}, {{ object.author }}`,
  },
  {
    name: "BaseDetailView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.detail.BaseDetailView — реализует логику загрузки одного объекта по pk/slug и передачу его в контекст без миксина рендеринга шаблона (SingleObjectTemplateResponseMixin). Прямой родитель DetailView (= BaseDetailView + SingleObjectTemplateResponseMixin). Используется для возврата JSON, файлов или других нестандартных ответов на основе одного объекта.",
    syntax: `from django.views.generic.detail import BaseDetailView

class ApiDetailView(BaseDetailView):
    model = Article
    def render_to_response(self, context, **kw):
        ...`,
    arguments: [],
    example: `from django.http import JsonResponse, FileResponse
from django.views.generic.detail import BaseDetailView
from .models import Article, Document

# JSON-эндпоинт детали объекта
class ArticleDetailAPI(BaseDetailView):
    model = Article

    def render_to_response(self, context, **response_kwargs):
        article = context['object']
        return JsonResponse({
            'id':     article.pk,
            'title':  article.title,
            'body':   article.body,
            'author': article.author.username,
        })

# Отдача файла на основе объекта Document
class DocumentDownloadView(BaseDetailView):
    model = Document

    def render_to_response(self, context, **response_kwargs):
        doc = context['object']
        return FileResponse(
            doc.file.open('rb'),
            as_attachment=True,
            filename=doc.original_name,
        )

# DetailView      = BaseDetailView + SingleObjectTemplateResponseMixin
# BaseDetailView  = SingleObjectMixin + View   (без рендеринга шаблона)`,
  },
  {
    name: "ListView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.list.ListView — отображает список объектов модели с поддержкой пагинации. Загружает объекты через self.get_queryset() (по умолчанию Model.objects.all()) и передаёт в шаблон как object_list и под именем <model>_list. Шаблон по умолчанию — <app_label>/<model_name>_list.html. Состоит из BaseListView + MultipleObjectTemplateResponseMixin.",
    syntax: `from django.views.generic.list import ListView

class ArticleList(ListView):
    model = Article
    paginate_by = 20`,
    arguments: [],
    example: `# views.py
from django.views.generic.list import ListView
from .models import Article

class ArticleList(ListView):
    model = Article
    paginate_by = 20
    ordering = ['-created_at']
    # template_name по умолчанию: <app>/article_list.html
    # context_object_name по умолчанию: 'article_list' и 'object_list'

# Кастомный queryset (поиск, фильтрация)
class PublishedArticleList(ListView):
    model = Article
    paginate_by = 10
    template_name = 'articles/published.html'
    context_object_name = 'articles'   # явное имя для шаблона

    def get_queryset(self):
        qs = super().get_queryset().filter(status='published')
        q = self.request.GET.get('q')
        if q:
            qs = qs.filter(title__icontains=q)
        return qs.select_related('author').order_by('-published_at')

# urls.py
# path('articles/', ArticleList.as_view(), name='article-list')

# templates/<app>/article_list.html
# {% for article in article_list %}
#   <h2>{{ article.title }}</h2>
# {% endfor %}
# {% if is_paginated %}
#   <a href="?page={{ page_obj.next_page_number }}">Далее</a>
# {% endif %}`,
  },
  {
    name: "BaseListView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.list.BaseListView — реализует логику получения и пагинации списка объектов без миксина рендеринга шаблона (MultipleObjectTemplateResponseMixin). Прямой родитель ListView (= BaseListView + MultipleObjectTemplateResponseMixin). Используется для возврата списков в JSON, CSV, RSS и других нестандартных форматах.",
    syntax: `from django.views.generic.list import BaseListView

class ApiListView(BaseListView):
    model = Article
    paginate_by = 50
    def render_to_response(self, context, **kw):
        ...`,
    arguments: [],
    example: `from django.http import JsonResponse, StreamingHttpResponse
from django.views.generic.list import BaseListView
from .models import Article

# JSON-эндпоинт со списком и пагинацией
class ArticleListAPI(BaseListView):
    model = Article
    paginate_by = 25

    def get_queryset(self):
        return Article.objects.filter(status='published').order_by('-id')

    def render_to_response(self, context, **response_kwargs):
        page = context['page_obj']
        return JsonResponse({
            'results': [
                {'id': a.pk, 'title': a.title}
                for a in context['object_list']
            ],
            'pagination': {
                'page':       page.number,
                'pages':      page.paginator.num_pages,
                'total':      page.paginator.count,
                'has_next':   page.has_next(),
                'has_prev':   page.has_previous(),
            },
        })

# CSV-экспорт без шаблона
import csv
from django.http import HttpResponse

class ArticleCsvView(BaseListView):
    model = Article

    def render_to_response(self, context, **response_kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="articles.csv"'
        writer = csv.writer(response)
        writer.writerow(['id', 'title', 'author'])
        for a in context['object_list']:
            writer.writerow([a.pk, a.title, a.author.username])
        return response

# ListView      = BaseListView + MultipleObjectTemplateResponseMixin
# BaseListView  = MultipleObjectMixin + View   (без рендеринга шаблона)`,
  },
  {
    name: "DetailView.get(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик GET-запроса в DetailView (унаследован от BaseDetailView.get). Загружает объект через self.object = self.get_object(), формирует контекст через get_context_data() и рендерит шаблон через render_to_response(). Переопределяется редко — обычно достаточно настроить model, queryset и шаблон. Чаще переопределяют get_object()/get_queryset()/get_context_data().",
    syntax: "DetailView.get(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest текущего GET-запроса.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description:
          "Именованные аргументы из URL-резолвера (обычно содержат pk или slug).",
      },
    ],
    example: `from django.views.generic.detail import DetailView
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import Article

# Стандартное использование — get() переопределять обычно не нужно
class ArticleDetail(DetailView):
    model = Article

# Переопределение get(): инкремент счётчика просмотров
class ArticleDetailWithViews(DetailView):
    model = Article

    def get(self, request, *args, **kwargs):
        # super() сам загрузит self.object и отрендерит шаблон
        response = super().get(request, *args, **kwargs)
        # Увеличиваем счётчик просмотров асинхронно от рендеринга
        Article.objects.filter(pk=self.object.pk).update(
            views_count=models.F('views_count') + 1
        )
        return response

# Редирект на канонический URL, если slug не совпадает
class CanonicalArticleDetail(DetailView):
    model = Article

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        # Если в URL устаревший slug — редирект на актуальный
        if kwargs.get('slug') != self.object.slug:
            return HttpResponseRedirect(
                reverse('article-detail', kwargs={'slug': self.object.slug})
            )
        context = self.get_context_data(object=self.object)
        return self.render_to_response(context)`,
  },
  {
    name: "BaseDetailView.get(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик GET-запроса в BaseDetailView. Загружает объект из БД (self.object = self.get_object()), собирает контекст через get_context_data() и передаёт его в render_to_response(). В BaseDetailView render_to_response должен быть переопределён — стандартный SingleObjectTemplateResponseMixin отсутствует. Это единственный реализованный HTTP-метод в BaseDetailView (POST не поддерживается без явного добавления).",
    syntax: "BaseDetailView.get(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description: "Объект HttpRequest текущего GET-запроса.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description:
          "Именованные аргументы из URL-резолвера (обычно pk или slug объекта).",
      },
    ],
    example: `from django.http import JsonResponse, Http404
from django.views.generic.detail import BaseDetailView
from .models import Article

# Стандартный BaseDetailView c JSON-ответом
class ArticleDetailAPI(BaseDetailView):
    model = Article

    def render_to_response(self, context, **response_kwargs):
        a = context['object']
        return JsonResponse({'id': a.pk, 'title': a.title})

# Переопределение get(): добавить логирование доступа
class LoggedArticleAPI(BaseDetailView):
    model = Article

    def get(self, request, *args, **kwargs):
        try:
            self.object = self.get_object()
        except Http404:
            AccessLog.objects.create(
                user=request.user, object_id=kwargs.get('pk'), result='not_found',
            )
            raise

        AccessLog.objects.create(
            user=request.user, object_id=self.object.pk, result='ok',
        )
        context = self.get_context_data(object=self.object)
        return self.render_to_response(context)

    def render_to_response(self, context, **response_kwargs):
        a = context['object']
        return JsonResponse({'id': a.pk, 'body': a.body})`,
  },
  {
    name: "ListView.get(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик GET-запроса в ListView (унаследован от BaseListView.get). Получает queryset через self.object_list = self.get_queryset(), проверяет, что список не пустой если allow_empty=False (иначе Http404), формирует контекст с пагинацией и рендерит шаблон. Переопределяется редко — обычно настраивают model/queryset, paginate_by, ordering и get_context_data().",
    syntax: "ListView.get(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description:
          "Объект HttpRequest текущего GET-запроса. request.GET может содержать параметр ?page=N для пагинации.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.views.generic.list import ListView
from django.http import HttpResponseRedirect
from .models import Article

# Стандартное использование — get() переопределять обычно не нужно
class ArticleList(ListView):
    model = Article
    paginate_by = 20

# Переопределение get(): редирект на первую страницу при некорректном ?page=
class SafeArticleList(ListView):
    model = Article
    paginate_by = 20

    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except Http404:
            # Невалидная страница в ?page= → редирект на 1-ю
            return HttpResponseRedirect(request.path)

# Запрет пустых результатов
class StrictList(ListView):
    model = Article
    allow_empty = False   # Http404, если queryset пуст
    paginate_by = 50`,
  },
  {
    name: "BaseListView.get(request, *args, **kwargs)",
    category: "Built-in class-based views API",
    description:
      "Обработчик GET-запроса в BaseListView. Получает queryset через self.object_list = self.get_queryset(), проверяет allow_empty, собирает контекст с paginator/page_obj/object_list и передаёт в render_to_response(). В BaseListView render_to_response должен быть переопределён вручную — стандартный MultipleObjectTemplateResponseMixin отсутствует. Это единственный реализованный HTTP-метод в BaseListView.",
    syntax: "BaseListView.get(request, *args, **kwargs)",
    arguments: [
      {
        name: "request",
        description:
          "Объект HttpRequest текущего GET-запроса. ?page=N — номер страницы пагинации.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы из URL-резолвера.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы из URL-резолвера.",
      },
    ],
    example: `from django.http import JsonResponse
from django.views.generic.list import BaseListView
from .models import Article

# Стандартный BaseListView c JSON-выдачей
class ArticleListAPI(BaseListView):
    model = Article
    paginate_by = 25

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'items': [{'id': a.pk, 'title': a.title} for a in context['object_list']],
            'page':  context['page_obj'].number,
            'pages': context['paginator'].num_pages,
        })

# Переопределение get(): фильтрация по query-параметрам перед стандартной обработкой
class FilteredListAPI(BaseListView):
    model = Article
    paginate_by = 25

    def get(self, request, *args, **kwargs):
        # Можно подготовить self.q до вызова get_queryset()
        self.q = request.GET.get('q', '').strip()
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        if self.q:
            qs = qs.filter(title__icontains=self.q)
        return qs

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'q':       self.q,
            'results': list(context['object_list'].values('id', 'title')),
        })`,
  },
  {
    name: "DetailView.model",
    category: "Built-in class-based views API",
    description:
      "Класс модели Django, экземпляр которой отображается. Используется для: загрузки объекта по pk/slug из URL (через get_object() с queryset = Model.objects.all()), определения имени шаблона по умолчанию (<app>/<model>_detail.html) и имени переменной контекста (<model>, например article). Альтернатива — задать queryset для ограничения видимых объектов или переопределить get_object()/get_queryset().",
    syntax: "DetailView.model = MyModel",
    arguments: [],
    example: `from django.views.generic.detail import DetailView
from .models import Article

# Минимальный DetailView
class ArticleDetail(DetailView):
    model = Article
    # urls.py: path('articles/<int:pk>/', ArticleDetail.as_view())

# Ограничение через queryset вместо model
class PublishedArticleDetail(DetailView):
    queryset = Article.objects.filter(status='published')
    # 404 для неопубликованных статей даже если pk существует

# Поиск по slug
class ArticleDetailBySlug(DetailView):
    model = Article
    slug_field = 'slug'         # имя поля в модели
    slug_url_kwarg = 'slug'     # имя параметра в URL
    # urls.py: path('articles/<slug:slug>/', ArticleDetailBySlug.as_view())

# Кастомный context_object_name
class BookDetail(DetailView):
    model = Book
    context_object_name = 'book'   # вместо дефолтного 'book' (равно имени модели)
    # В шаблоне: {{ book.title }} (а также всегда доступно {{ object }})`,
  },
  {
    name: "ListView.model",
    category: "Built-in class-based views API",
    description:
      "Класс модели Django, объекты которой отображаются в списке. Используется для: формирования queryset по умолчанию (Model.objects.all()), определения имени шаблона (<app>/<model>_list.html) и имени переменной контекста (<model>_list — например, article_list). Альтернатива — задать queryset напрямую для встроенной фильтрации/сортировки или переопределить get_queryset() для произвольной логики.",
    syntax: "ListView.model = MyModel",
    arguments: [],
    example: `from django.views.generic.list import ListView
from .models import Article

# Минимальный ListView
class ArticleList(ListView):
    model = Article
    paginate_by = 20
    # В шаблоне: {{ article_list }} или {{ object_list }}

# queryset вместо model — встроенная фильтрация и сортировка
class PublishedArticleList(ListView):
    queryset = (
        Article.objects.filter(status='published')
        .select_related('author')
        .order_by('-published_at')
    )
    paginate_by = 20

# Динамическое получение через get_queryset() — фильтр по параметру URL
class CategoryArticleList(ListView):
    model = Article
    paginate_by = 20

    def get_queryset(self):
        return Article.objects.filter(category__slug=self.kwargs['category_slug'])
    # urls.py: path('cat/<slug:category_slug>/', CategoryArticleList.as_view())

# Кастомное имя в контексте
class BookList(ListView):
    model = Book
    context_object_name = 'books'   # вместо дефолтного 'book_list'
    # В шаблоне: {% for book in books %}{{ book }}{% endfor %}`,
  },
  {
    name: "ListView.paginate_by",
    category: "Built-in class-based views API",
    description:
      "Целое число — количество объектов на одной странице пагинации. При указании активирует постраничный вывод: в контексте появляются paginator (django.core.paginator.Paginator), page_obj (текущая Page) и булево is_paginated. Текущая страница берётся из ?page=N (по умолчанию ?page=1). При невалидном номере страницы (строка, отрицательное число, выход за пределы) вызывается Http404, если не задан page_kwarg или paginate_orphans.",
    syntax: "ListView.paginate_by = 20",
    arguments: [],
    example: `from django.views.generic.list import ListView
from .models import Article

# Простая пагинация по 20 объектов
class ArticleList(ListView):
    model = Article
    paginate_by = 20
    ordering = ['-created_at']     # обязательно для стабильной пагинации
    paginate_orphans = 3           # последняя страница объединяется,
                                   # если на ней <= 3 объектов
    page_kwarg = 'page'            # имя параметра запроса (по умолчанию 'page')

# Динамический размер страницы из URL
class FlexibleList(ListView):
    model = Article

    def get_paginate_by(self, queryset):
        # ?per_page=50  →  50 объектов на страницу
        try:
            return min(int(self.request.GET.get('per_page', 20)), 100)
        except ValueError:
            return 20

# templates/<app>/article_list.html
# <ul>
#   {% for article in article_list %}
#     <li>{{ article.title }}</li>
#   {% endfor %}
# </ul>
# {% if is_paginated %}
#   <nav>
#     {% if page_obj.has_previous %}
#       <a href="?page={{ page_obj.previous_page_number }}">←</a>
#     {% endif %}
#     Стр. {{ page_obj.number }} из {{ paginator.num_pages }}
#     {% if page_obj.has_next %}
#       <a href="?page={{ page_obj.next_page_number }}">→</a>
#     {% endif %}
#   </nav>
# {% endif %}`,
  },
  {
    name: "DetailView.get_context_data(**kwargs)",
    category: "Built-in class-based views API",
    description:
      "Метод, формирующий словарь контекста для шаблона DetailView. Стандартная реализация (SingleObjectMixin) добавляет ключи object (загруженный объект) и <model_name> (псевдоним по имени модели или context_object_name). Переопределяется для добавления связанных данных: списка комментариев, похожих объектов, формы и т. п. Обязательно вызывать super().get_context_data(**kwargs), чтобы не потерять object.",
    syntax: "DetailView.get_context_data(**kwargs)",
    arguments: [
      {
        name: "**kwargs",
        description:
          "Именованные аргументы. Внутри вызова self.object = self.get_object() уже выполнен; передаются дальше в super().get_context_data(**kwargs).",
      },
    ],
    example: `from django.views.generic.detail import DetailView
from .models import Article, Comment
from .forms import CommentForm

class ArticleDetail(DetailView):
    model = Article
    template_name = 'articles/detail.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # Связанные комментарии и форма для нового комментария
        ctx['comments'] = (
            Comment.objects.filter(article=self.object)
            .select_related('author')
            .order_by('created_at')
        )
        ctx['comment_form'] = CommentForm()
        # Похожие статьи по категории
        ctx['related'] = (
            Article.objects.filter(category=self.object.category)
            .exclude(pk=self.object.pk)[:5]
        )
        return ctx

# templates/articles/detail.html
# <h1>{{ article.title }}</h1>
# <p>{{ article.body }}</p>
#
# <h2>Комментарии ({{ comments|length }})</h2>
# {% for c in comments %}
#   <div>{{ c.author }}: {{ c.text }}</div>
# {% endfor %}
#
# <h2>Похожие</h2>
# {% for r in related %}<a href="{{ r.get_absolute_url }}">{{ r.title }}</a>{% endfor %}`,
  },
  {
    name: "ListView.get_context_data(**kwargs)",
    category: "Built-in class-based views API",
    description:
      "Метод, формирующий словарь контекста для шаблона ListView. Стандартная реализация (MultipleObjectMixin) добавляет ключи object_list (queryset страницы), <model>_list (псевдоним), paginator, page_obj и is_paginated. Переопределяется для добавления вспомогательных данных: фильтров, активной категории, общего количества, дополнительных списков и т. п. Обязательно вызывать super().get_context_data(**kwargs).",
    syntax: "ListView.get_context_data(**kwargs)",
    arguments: [
      {
        name: "**kwargs",
        description:
          "Именованные аргументы. Внутри метода уже доступны self.object_list (queryset) и self.kwargs из URL. Передаются дальше в super().get_context_data(**kwargs).",
      },
    ],
    example: `from django.views.generic.list import ListView
from .models import Article, Category

class ArticleList(ListView):
    model = Article
    paginate_by = 20

    def get_queryset(self):
        qs = Article.objects.filter(status='published')
        self.q = self.request.GET.get('q', '')
        if self.q:
            qs = qs.filter(title__icontains=self.q)
        return qs.order_by('-published_at')

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # Дополнительные данные для боковой панели и фильтров
        ctx['categories']     = Category.objects.all()
        ctx['active_query']   = self.q
        ctx['total_articles'] = self.object_list.count()
        ctx['popular']        = Article.objects.order_by('-views')[:5]
        return ctx

# templates/<app>/article_list.html
# <input value="{{ active_query }}" name="q">
# <p>Найдено: {{ total_articles }}</p>
# <ul>
#   {% for article in article_list %}
#     <li>{{ article.title }}</li>
#   {% endfor %}
# </ul>
# <aside>
#   <h3>Категории</h3>
#   {% for c in categories %}<a href="?cat={{ c.slug }}">{{ c.name }}</a>{% endfor %}
# </aside>`,
  },
  {
    name: "DetailView.as_view(**initkwargs)",
    category: "Built-in class-based views API",
    description:
      "Classmethod (унаследован от View), возвращающий callable view-функцию для подключения в URLconf. Принимает именованные аргументы, переопределяющие атрибуты класса для каждого экземпляра DetailView (model, queryset, template_name, context_object_name, slug_field, slug_url_kwarg, pk_url_kwarg и пр.). Позволяет конфигурировать одно и то же представление под разные URL-маршруты прямо в urls.py, без создания подклассов.",
    syntax: "DetailView.as_view(**initkwargs)",
    arguments: [
      {
        name: "**initkwargs",
        description:
          "Именованные аргументы — атрибуты класса DetailView: model, queryset, template_name, context_object_name, slug_field, slug_url_kwarg, pk_url_kwarg и т. п. Только существующие атрибуты допустимы.",
      },
    ],
    example: `from django.urls import path
from django.views.generic.detail import DetailView
from .models import Article, Book

urlpatterns = [
    # 1. Минимально — только модель
    path(
        'articles/<int:pk>/',
        DetailView.as_view(model=Article),
        name='article-detail',
    ),

    # 2. Поиск по slug + кастомный шаблон
    path(
        'articles/<slug:slug>/',
        DetailView.as_view(
            model=Article,
            slug_field='slug',
            slug_url_kwarg='slug',
            template_name='articles/article_detail.html',
        ),
    ),

    # 3. Ограничение видимости через queryset + кастомное имя в контексте
    path(
        'books/<int:pk>/',
        DetailView.as_view(
            queryset=Book.objects.filter(is_active=True),
            context_object_name='book',
            template_name='books/page.html',
        ),
    ),
]

# Эквивалентно созданию подкласса:
# class ArticleDetail(DetailView):
#     model = Article
#     template_name = 'articles/article_detail.html'`,
  },
  {
    name: "ListView.as_view(**initkwargs)",
    category: "Built-in class-based views API",
    description:
      "Classmethod (унаследован от View), возвращающий callable view-функцию для подключения в URLconf. Принимает именованные аргументы, переопределяющие атрибуты класса для каждого экземпляра ListView (model, queryset, paginate_by, ordering, template_name, context_object_name, allow_empty, paginate_orphans, page_kwarg и пр.). Позволяет создавать несколько вариантов списка из одного класса прямо в urls.py.",
    syntax: "ListView.as_view(**initkwargs)",
    arguments: [
      {
        name: "**initkwargs",
        description:
          "Именованные аргументы — атрибуты класса ListView: model, queryset, paginate_by, ordering, template_name, context_object_name, allow_empty, paginate_orphans, page_kwarg и т. п.",
      },
    ],
    example: `from django.urls import path
from django.views.generic.list import ListView
from .models import Article

urlpatterns = [
    # 1. Минимально — модель и пагинация
    path(
        'articles/',
        ListView.as_view(model=Article, paginate_by=20),
        name='article-list',
    ),

    # 2. Только опубликованные, кастомный шаблон и сортировка
    path(
        'articles/published/',
        ListView.as_view(
            queryset=Article.objects.filter(status='published'),
            ordering=['-published_at'],
            paginate_by=10,
            template_name='articles/published_list.html',
            context_object_name='articles',
        ),
        name='article-published',
    ),

    # 3. Архив без пагинации, с запретом пустого результата
    path(
        'articles/archive/',
        ListView.as_view(
            queryset=Article.objects.filter(status='archived'),
            allow_empty=False,
            template_name='articles/archive.html',
        ),
    ),
]

# Эквивалентно созданию подкласса:
# class PublishedArticleList(ListView):
#     queryset = Article.objects.filter(status='published')
#     paginate_by = 10
#     ...`,
  },
  {
    name: "ArchiveIndexView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.dates.ArchiveIndexView — главная страница архива по дате: последние объекты модели, отсортированные по убыванию date_field. Объекты «в будущем» по умолчанию исключаются (allow_future=False). Шаблон по умолчанию — <app>/<model>_archive.html. В контексте: latest (срез последних объектов, размер задаёт date_list_period) и date_list (агрегированный список периодов через QuerySet.dates()).",
    syntax: `from django.views.generic.dates import ArchiveIndexView

class ArticleArchive(ArchiveIndexView):
    model = Article
    date_field = 'published_at'`,
    arguments: [],
    example: `from django.views.generic.dates import ArchiveIndexView
from .models import Article

class ArticleArchive(ArchiveIndexView):
    model = Article
    date_field = 'published_at'    # обязательный атрибут
    date_list_period = 'year'      # 'year' | 'month' | 'day' (для date_list)
    allow_empty = True             # иначе 404 при пустой выборке
    allow_future = False           # скрыть объекты с датой > сейчас
    template_name = 'blog/archive.html'

# urls.py
# path('archive/', ArticleArchive.as_view(), name='article-archive')

# templates/blog/archive.html
# <h1>Архив статей</h1>
# <h2>По годам</h2>
# <ul>
#   {% for year in date_list %}
#     <li><a href="{{ year|date:'Y' }}/">{{ year|date:'Y' }}</a></li>
#   {% endfor %}
# </ul>
# <h2>Последние</h2>
# {% for article in latest %}
#   <article><h3>{{ article.title }}</h3></article>
# {% endfor %}`,
  },
  {
    name: "YearArchiveView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.dates.YearArchiveView — страница архива за указанный год. Год берётся из параметра URL year (kwarg). По умолчанию НЕ загружает список объектов (make_object_list=False) — возвращает только список месяцев (date_list), в которых есть публикации. Чтобы получить полный список объектов года в шаблон, установите make_object_list=True. Шаблон по умолчанию — <app>/<model>_archive_year.html.",
    syntax: `from django.views.generic.dates import YearArchiveView

class ArticleYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'
    make_object_list = True`,
    arguments: [],
    example: `from django.views.generic.dates import YearArchiveView
from .models import Article

class ArticleYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'
    make_object_list = True        # включить object_list в контекст
    allow_future = False
    paginate_by = 50               # пагинация работает только при make_object_list

# urls.py
# path('archive/<int:year>/', ArticleYearArchive.as_view(), name='article-year')

# В контексте шаблона:
#   year         — datetime.date(год, 1, 1)
#   next_year    — datetime.date(год+1, 1, 1) или None (если allow_future=False)
#   previous_year — datetime.date(год-1, 1, 1)
#   date_list    — QuerySet[date] — месяцы с публикациями
#   object_list  — список статей за год (только при make_object_list=True)

# templates/<app>/article_archive_year.html
# <h1>Статьи за {{ year|date:'Y' }}</h1>
# {% if previous_year %}<a href="../{{ previous_year|date:'Y' }}/">←</a>{% endif %}
# {% if next_year %}<a href="../{{ next_year|date:'Y' }}/">→</a>{% endif %}
# <h2>Месяцы</h2>
# {% for m in date_list %}<a href="{{ m|date:'m' }}/">{{ m|date:'F' }}</a>{% endfor %}
# {% for article in object_list %}<h3>{{ article.title }}</h3>{% endfor %}`,
  },
  {
    name: "YearArchiveView.make_object_list",
    category: "Built-in class-based views API",
    description:
      "Логический атрибут (по умолчанию False), управляющий тем, нужно ли загружать в контекст полный список объектов за год (object_list). При False загружается только агрегированный date_list (месяцы с публикациями) — это экономит запросы для больших архивов. При True работает как обычный ListView с пагинацией. Атрибут уникален для YearArchiveView; в других *ArchiveView (Month/Week/Day) объекты загружаются всегда.",
    syntax: "YearArchiveView.make_object_list = True",
    arguments: [],
    example: `from django.views.generic.dates import YearArchiveView
from .models import Article

# Лёгкая страница: только список месяцев (по умолчанию)
class LightYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'
    # make_object_list = False (default)
    # В контексте: date_list, year, next_year, previous_year
    # object_list = None — пагинация не работает

# Полный архив с пагинацией
class FullYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'
    make_object_list = True
    paginate_by = 25
    # В контексте: + object_list, + paginator, + page_obj, + is_paginated

# templates/<app>/article_archive_year.html
# {% if object_list %}
#   {% for article in object_list %}
#     <article>{{ article.title }}</article>
#   {% endfor %}
# {% else %}
#   <p>Только список месяцев (object_list не загружался):</p>
#   {% for m in date_list %}<a href="{{ m|date:'m' }}/">{{ m|date:'F' }}</a>{% endfor %}
# {% endif %}`,
  },
  {
    name: "YearArchiveView.get_make_object_list()",
    category: "Built-in class-based views API",
    description:
      "Метод, возвращающий булево значение для make_object_list. Стандартная реализация просто возвращает self.make_object_list. Переопределяется для динамического выбора: грузить полный список объектов или только date_list — в зависимости от пользователя, query-параметра, размера выборки и т. п. Вызывается из get_dated_items() при подготовке контекста.",
    syntax: "YearArchiveView.get_make_object_list()",
    arguments: [],
    example: `from django.views.generic.dates import YearArchiveView
from .models import Article

# Динамический выбор: ?full=1 — полный список, иначе только месяцы
class FlexibleYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'
    paginate_by = 25

    def get_make_object_list(self):
        return self.request.GET.get('full') == '1'

# Загружать object_list только для администраторов
class AdminYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'

    def get_make_object_list(self):
        return self.request.user.is_staff

# Загружать только если в году не слишком много объектов
class SmartYearArchive(YearArchiveView):
    model = Article
    date_field = 'published_at'

    def get_make_object_list(self):
        year = int(self.kwargs['year'])
        count = Article.objects.filter(published_at__year=year).count()
        return count <= 100   # для больших годов — только агрегаты`,
  },
  {
    name: "MonthArchiveView",
    category: "Built-in class-based views API",
    description:
      'Класс django.views.generic.dates.MonthArchiveView — страница архива за указанный месяц. Месяц и год берутся из параметров URL year и month (kwarg). По умолчанию формат месяца — три буквы в нижнем регистре (jan, feb, ...), задаётся через month_format ("%m" — числовой, "%b" — abbr, "%B" — полное имя). В контексте: object_list (статьи месяца), month/next_month/previous_month (datetime.date) и date_list (дни месяца с публикациями).',
    syntax: `from django.views.generic.dates import MonthArchiveView

class ArticleMonthArchive(MonthArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'`,
    arguments: [],
    example: `from django.views.generic.dates import MonthArchiveView
from .models import Article

class ArticleMonthArchive(MonthArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'         # числовой месяц 01-12 (по умолчанию '%b' = jan, feb…)
    allow_future = False
    paginate_by = 20

# urls.py
# path('archive/<int:year>/<int:month>/',
#      ArticleMonthArchive.as_view(), name='article-month')

# В контексте шаблона:
#   month          — datetime.date(год, месяц, 1)
#   next_month     — следующий месяц с публикациями (или None)
#   previous_month — предыдущий месяц с публикациями (или None)
#   date_list      — QuerySet[date] — дни месяца с публикациями
#   object_list    — статьи месяца

# templates/<app>/article_archive_month.html
# <h1>{{ month|date:'F Y' }}</h1>
# {% if previous_month %}
#   <a href="../../{{ previous_month|date:'Y/m' }}/">← {{ previous_month|date:'F' }}</a>
# {% endif %}
# {% for article in object_list %}
#   <p><a href="{{ article.get_absolute_url }}">{{ article.title }}</a></p>
# {% endfor %}`,
  },
  {
    name: "WeekArchiveView",
    category: "Built-in class-based views API",
    description:
      'Класс django.views.generic.dates.WeekArchiveView — страница архива за указанную неделю. Год и номер недели берутся из URL-параметров year и week. Атрибут week_format задаёт способ нумерации: "%U" — неделя начинается с воскресенья (по умолчанию), "%W" — с понедельника, "%V" — ISO 8601 (тогда year должен быть из "%G"). В контексте: object_list (статьи недели), week (datetime.date — первый день недели), next_week/previous_week.',
    syntax: `from django.views.generic.dates import WeekArchiveView

class ArticleWeekArchive(WeekArchiveView):
    model = Article
    date_field = 'published_at'
    week_format = '%W'`,
    arguments: [],
    example: `from django.views.generic.dates import WeekArchiveView
from .models import Article

class ArticleWeekArchive(WeekArchiveView):
    model = Article
    date_field = 'published_at'
    week_format = '%W'         # %U (вс), %W (пн), %V (ISO 8601)
    allow_future = False

# urls.py
# path('archive/<int:year>/week/<int:week>/',
#      ArticleWeekArchive.as_view(), name='article-week')

# В контексте шаблона:
#   week          — datetime.date — первый день недели
#   next_week     — следующая непустая неделя (или None)
#   previous_week — предыдущая непустая неделя (или None)
#   object_list   — статьи недели

# templates/<app>/article_archive_week.html
# <h1>Неделя с {{ week|date:'d.m.Y' }}</h1>
# {% if previous_week %}
#   <a href="?week={{ previous_week|date:'W' }}">← Пред.</a>
# {% endif %}
# {% for article in object_list %}
#   <h3>{{ article.title }} — {{ article.published_at|date:'l' }}</h3>
# {% endfor %}`,
  },
  {
    name: "DayArchiveView",
    category: "Built-in class-based views API",
    description:
      'Класс django.views.generic.dates.DayArchiveView — страница архива за указанный день. Дата берётся из URL-параметров year, month, day. Формат месяца настраивается через month_format, дня — через day_format ("%d" по умолчанию). В контексте: object_list (статьи дня), day (datetime.date), next_day/previous_day, month/next_month/previous_month.',
    syntax: `from django.views.generic.dates import DayArchiveView

class ArticleDayArchive(DayArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'`,
    arguments: [],
    example: `from django.views.generic.dates import DayArchiveView
from .models import Article

class ArticleDayArchive(DayArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'        # числовой формат месяца
    day_format = '%d'          # числовой формат дня (по умолчанию)
    allow_future = False
    paginate_by = 30

# urls.py
# path('archive/<int:year>/<int:month>/<int:day>/',
#      ArticleDayArchive.as_view(), name='article-day')

# В контексте шаблона:
#   day            — datetime.date(год, месяц, день)
#   next_day       — следующий непустой день (или None)
#   previous_day   — предыдущий непустой день (или None)
#   month          — datetime.date(год, месяц, 1)
#   object_list    — статьи дня

# templates/<app>/article_archive_day.html
# <h1>{{ day|date:'j F Y' }}</h1>
# <nav>
#   {% if previous_day %}
#     <a href="/archive/{{ previous_day|date:'Y/m/d' }}/">←</a>
#   {% endif %}
#   {% if next_day %}
#     <a href="/archive/{{ next_day|date:'Y/m/d' }}/">→</a>
#   {% endif %}
# </nav>
# {% for article in object_list %}
#   <article>{{ article.title }}</article>
# {% endfor %}`,
  },
  {
    name: "TodayArchiveView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.dates.TodayArchiveView — частный случай DayArchiveView, отображающий объекты, опубликованные сегодня. Не требует параметров в URL — дата берётся из datetime.date.today(). Удобен для страницы «Сегодняшние новости» / «Today's posts». Шаблон по умолчанию совпадает с DayArchiveView: <app>/<model>_archive_day.html.",
    syntax: `from django.views.generic.dates import TodayArchiveView

class ArticleToday(TodayArchiveView):
    model = Article
    date_field = 'published_at'`,
    arguments: [],
    example: `from django.views.generic.dates import TodayArchiveView
from .models import Article

class ArticleToday(TodayArchiveView):
    model = Article
    date_field = 'published_at'
    allow_empty = True            # без 404, если за сегодня нет публикаций
    template_name = 'blog/today.html'

# urls.py — без параметров year/month/day
# path('today/', ArticleToday.as_view(), name='article-today')

# В контексте шаблона: те же ключи, что и у DayArchiveView
#   day            — datetime.date.today()
#   previous_day   — предыдущий непустой день
#   next_day       — обычно None (сегодня в будущем уже ничего нет)
#   object_list    — статьи за сегодня

# templates/blog/today.html
# <h1>Сегодня — {{ day|date:'l, j F' }}</h1>
# {% if object_list %}
#   {% for article in object_list %}
#     <article><h2>{{ article.title }}</h2></article>
#   {% endfor %}
# {% else %}
#   <p>Сегодня пока ничего не опубликовано.</p>
#   {% if previous_day %}
#     <a href="/archive/{{ previous_day|date:'Y/m/d' }}/">
#       ← {{ previous_day|date:'j F' }}
#     </a>
#   {% endif %}
# {% endif %}`,
  },
  {
    name: "DateDetailView",
    category: "Built-in class-based views API",
    description:
      "Класс django.views.generic.dates.DateDetailView — расширение DetailView с дополнительной валидацией по дате: объект ищется не только по pk/slug, но и должен принадлежать указанной в URL дате (year, month, day). Если дата объекта не совпадает с URL — 404. Полезно для канонических URL вида /blog/2024/03/15/my-post/. Шаблон по умолчанию — <app>/<model>_detail.html (как у DetailView).",
    syntax: `from django.views.generic.dates import DateDetailView

class ArticleDateDetail(DateDetailView):
    model = Article
    date_field = 'published_at'`,
    arguments: [],
    example: `from django.views.generic.dates import DateDetailView
from .models import Article

class ArticleDateDetail(DateDetailView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'           # число вместо abbr
    slug_field = 'slug'
    slug_url_kwarg = 'slug'
    allow_future = False

# urls.py — URL содержит и дату, и slug
# path(
#     'blog/<int:year>/<int:month>/<int:day>/<slug:slug>/',
#     ArticleDateDetail.as_view(),
#     name='article-date-detail',
# )

# Логика обработки запроса /blog/2024/03/15/my-post/:
#   1. Загружаем Article по slug='my-post'
#   2. Проверяем: published_at.year == 2024 AND month == 3 AND day == 15
#   3. Если не совпадает → Http404
# Это защищает от неканонических URL: пользователь не сможет открыть статью
# с любой произвольной датой в пути.

# templates/<app>/article_detail.html (стандартный)
# <h1>{{ object.title }}</h1>
# <time datetime="{{ object.published_at|date:'c' }}">
#   {{ object.published_at|date:'j F Y' }}
# </time>
# <div>{{ object.body|linebreaks }}</div>`,
  },
  {
    name: "BaseArchiveIndexView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.dates.BaseArchiveIndexView — реализует логику ArchiveIndexView (последние объекты + список периодов через QuerySet.dates()) без миксина рендеринга шаблона. Прямой родитель ArchiveIndexView (= BaseArchiveIndexView + MultipleObjectTemplateResponseMixin). Используется для возврата JSON, RSS-фидов и других нестандартных форматов на основе архивных данных.",
    syntax: `from django.views.generic.dates import BaseArchiveIndexView

class ArchiveAPI(BaseArchiveIndexView):
    model = Article
    date_field = 'published_at'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseArchiveIndexView
from .models import Article

class ArticleArchiveAPI(BaseArchiveIndexView):
    model = Article
    date_field = 'published_at'
    date_list_period = 'year'
    allow_future = False

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'years': [d.year for d in context['date_list']],
            'latest': [
                {'id': a.pk, 'title': a.title}
                for a in context['latest']
            ],
        })

# urls.py
# path('api/archive/', ArticleArchiveAPI.as_view())

# ArchiveIndexView      = BaseArchiveIndexView + MultipleObjectTemplateResponseMixin
# BaseArchiveIndexView  = BaseDateListView (без шаблонов)`,
  },
  {
    name: "BaseYearArchiveView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.dates.BaseYearArchiveView — реализует логику YearArchiveView (объекты года + список месяцев) без миксина рендеринга шаблона. Прямой родитель YearArchiveView (= BaseYearArchiveView + MultipleObjectTemplateResponseMixin). Поддерживает make_object_list/get_make_object_list() для опционального включения object_list в контекст.",
    syntax: `from django.views.generic.dates import BaseYearArchiveView

class YearArchiveAPI(BaseYearArchiveView):
    model = Article
    date_field = 'published_at'
    make_object_list = True`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseYearArchiveView
from .models import Article

class ArticleYearAPI(BaseYearArchiveView):
    model = Article
    date_field = 'published_at'
    make_object_list = True
    allow_future = False

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'year': context['year'].year,
            'months': [d.month for d in context['date_list']],
            'next_year': context['next_year'].year if context['next_year'] else None,
            'previous_year': context['previous_year'].year if context['previous_year'] else None,
            'articles': [
                {'id': a.pk, 'title': a.title, 'date': a.published_at.isoformat()}
                for a in context['object_list']
            ],
        })

# urls.py
# path('api/archive/<int:year>/', ArticleYearAPI.as_view())

# YearArchiveView      = BaseYearArchiveView + MultipleObjectTemplateResponseMixin
# BaseYearArchiveView  = YearMixin + BaseDateListView (без шаблонов)`,
  },
  {
    name: "BaseMonthArchiveView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.dates.BaseMonthArchiveView — реализует логику MonthArchiveView (объекты месяца + список дней с публикациями) без миксина рендеринга шаблона. Прямой родитель MonthArchiveView (= BaseMonthArchiveView + MultipleObjectTemplateResponseMixin). Используется для JSON-API, календарных виджетов и подобных нестандартных ответов.",
    syntax: `from django.views.generic.dates import BaseMonthArchiveView

class MonthArchiveAPI(BaseMonthArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseMonthArchiveView
from .models import Article

# Календарный JSON-эндпоинт: какие дни месяца содержат публикации
class CalendarMonthAPI(BaseMonthArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'
    allow_empty = True
    allow_future = False

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'month': context['month'].isoformat(),
            'days_with_posts': [d.day for d in context['date_list']],
            'count': len(context['object_list']),
            'next_month': context['next_month'].isoformat() if context['next_month'] else None,
            'previous_month': context['previous_month'].isoformat() if context['previous_month'] else None,
        })

# urls.py
# path('api/calendar/<int:year>/<int:month>/', CalendarMonthAPI.as_view())

# MonthArchiveView      = BaseMonthArchiveView + MultipleObjectTemplateResponseMixin
# BaseMonthArchiveView  = YearMixin + MonthMixin + BaseDateListView (без шаблонов)`,
  },
  {
    name: "BaseWeekArchiveView",
    category: "Built-in class-based views API",
    description:
      'Базовый класс django.views.generic.dates.BaseWeekArchiveView — реализует логику WeekArchiveView (объекты указанной недели) без миксина рендеринга шаблона. Прямой родитель WeekArchiveView (= BaseWeekArchiveView + MultipleObjectTemplateResponseMixin). Поддерживает week_format для выбора стандарта нумерации недель ("%U", "%W", "%V").',
    syntax: `from django.views.generic.dates import BaseWeekArchiveView

class WeekArchiveAPI(BaseWeekArchiveView):
    model = Article
    date_field = 'published_at'
    week_format = '%W'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseWeekArchiveView
from .models import Article

class ArticleWeekAPI(BaseWeekArchiveView):
    model = Article
    date_field = 'published_at'
    week_format = '%W'           # неделя с понедельника
    allow_future = False

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'week_start': context['week'].isoformat(),
            'next_week': context['next_week'].isoformat() if context['next_week'] else None,
            'previous_week': context['previous_week'].isoformat() if context['previous_week'] else None,
            'articles': [
                {'id': a.pk, 'title': a.title, 'date': a.published_at.isoformat()}
                for a in context['object_list']
            ],
        })

# urls.py
# path('api/week/<int:year>/<int:week>/', ArticleWeekAPI.as_view())

# WeekArchiveView      = BaseWeekArchiveView + MultipleObjectTemplateResponseMixin
# BaseWeekArchiveView  = YearMixin + WeekMixin + BaseDateListView (без шаблонов)`,
  },
  {
    name: "BaseDayArchiveView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.dates.BaseDayArchiveView — реализует логику DayArchiveView (объекты указанного дня) без миксина рендеринга шаблона. Прямой родитель DayArchiveView (= BaseDayArchiveView + MultipleObjectTemplateResponseMixin) и BaseTodayArchiveView. Используется для JSON-эндпоинтов вида /api/posts/2024/03/15/.",
    syntax: `from django.views.generic.dates import BaseDayArchiveView

class DayArchiveAPI(BaseDayArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseDayArchiveView
from .models import Article

class ArticleDayAPI(BaseDayArchiveView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'
    day_format = '%d'
    allow_future = False
    allow_empty = True

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'day': context['day'].isoformat(),
            'next_day': context['next_day'].isoformat() if context['next_day'] else None,
            'previous_day': context['previous_day'].isoformat() if context['previous_day'] else None,
            'articles': [
                {'id': a.pk, 'title': a.title, 'slug': a.slug}
                for a in context['object_list']
            ],
        })

# urls.py
# path('api/posts/<int:year>/<int:month>/<int:day>/', ArticleDayAPI.as_view())

# DayArchiveView      = BaseDayArchiveView + MultipleObjectTemplateResponseMixin
# BaseDayArchiveView  = YearMixin + MonthMixin + DayMixin + BaseDateListView`,
  },
  {
    name: "BaseTodayArchiveView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.dates.BaseTodayArchiveView — реализует логику TodayArchiveView (объекты, опубликованные сегодня) без миксина рендеринга шаблона. Прямой родитель TodayArchiveView (= BaseTodayArchiveView + MultipleObjectTemplateResponseMixin). Не требует параметров в URL — использует datetime.date.today().",
    syntax: `from django.views.generic.dates import BaseTodayArchiveView

class TodayArchiveAPI(BaseTodayArchiveView):
    model = Article
    date_field = 'published_at'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseTodayArchiveView
from .models import Article

# JSON «лента сегодняшнего дня» — например, для виджета на главной
class TodayFeedAPI(BaseTodayArchiveView):
    model = Article
    date_field = 'published_at'
    allow_empty = True
    ordering = ['-published_at']

    def render_to_response(self, context, **response_kwargs):
        return JsonResponse({
            'date': context['day'].isoformat(),
            'count': len(context['object_list']),
            'articles': [
                {
                    'id': a.pk,
                    'title': a.title,
                    'time': a.published_at.strftime('%H:%M'),
                }
                for a in context['object_list']
            ],
        })

# urls.py — без параметров year/month/day
# path('api/today/', TodayFeedAPI.as_view())

# TodayArchiveView      = BaseTodayArchiveView + MultipleObjectTemplateResponseMixin
# BaseTodayArchiveView  = BaseDayArchiveView (с подстановкой today())`,
  },
  {
    name: "BaseDateDetailView",
    category: "Built-in class-based views API",
    description:
      "Базовый класс django.views.generic.dates.BaseDateDetailView — реализует логику DateDetailView (загрузка объекта по pk/slug + проверка, что его дата совпадает с year/month/day из URL) без миксина рендеринга шаблона. Прямой родитель DateDetailView (= BaseDateDetailView + SingleObjectTemplateResponseMixin). Используется для JSON-API с каноническими date-based URL вида /api/posts/2024/03/15/my-post/.",
    syntax: `from django.views.generic.dates import BaseDateDetailView

class DateDetailAPI(BaseDateDetailView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'`,
    arguments: [],
    example: `from django.http import JsonResponse
from django.views.generic.dates import BaseDateDetailView
from .models import Article

class ArticleDateDetailAPI(BaseDateDetailView):
    model = Article
    date_field = 'published_at'
    month_format = '%m'
    slug_field = 'slug'
    slug_url_kwarg = 'slug'
    allow_future = False

    def render_to_response(self, context, **response_kwargs):
        a = context['object']
        return JsonResponse({
            'id': a.pk,
            'title': a.title,
            'body': a.body,
            'slug': a.slug,
            'published_at': a.published_at.isoformat(),
            'author': a.author.username,
        })

# urls.py — каноническая структура с датой и slug
# path(
#     'api/posts/<int:year>/<int:month>/<int:day>/<slug:slug>/',
#     ArticleDateDetailAPI.as_view(),
# )

# Запрос /api/posts/2024/03/15/my-post/:
#   1. Загружается Article(slug='my-post')
#   2. Проверяется published_at.year/month/day == 2024/3/15
#   3. Несовпадение → Http404 (страница не существует с такой датой)

# DateDetailView      = BaseDateDetailView + SingleObjectTemplateResponseMixin
# BaseDateDetailView  = YearMixin + MonthMixin + DayMixin + DateMixin + BaseDetailView`,
  },
  {
    name: "XFrameOptionsMiddleware",
    category: "Clickjacking Protection",
    description:
      'Класс django.middleware.clickjacking.XFrameOptionsMiddleware — middleware, который автоматически добавляет HTTP-заголовок X-Frame-Options ко всем ответам, если заголовок не был задан явно. Защищает сайт от clickjacking-атак: запрещает встраивать страницы в <iframe>/<frame>/<object> на чужих доменах. Включён по умолчанию в SECURITY-настройках нового проекта Django. Значение заголовка определяется настройкой X_FRAME_OPTIONS (по умолчанию "DENY").',
    syntax: `# settings.py
MIDDLEWARE = [
    ...,
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]`,
    arguments: [],
    example: `# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Защита от clickjacking — в новом проекте включён по умолчанию
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Глобальное значение для всех ответов:
X_FRAME_OPTIONS = 'DENY'        # запретить встраивание полностью
# X_FRAME_OPTIONS = 'SAMEORIGIN'  # разрешить только своему домену

# Логика middleware:
#   1. Если у response уже есть атрибут response.xframe_options_exempt = True
#      → middleware не трогает заголовок (декоратор xframe_options_exempt).
#   2. Если в response уже выставлен X-Frame-Options
#      → middleware не перезаписывает.
#   3. Иначе — выставляет X-Frame-Options = X_FRAME_OPTIONS.

# Проверить, что middleware работает:
#   curl -I https://example.com/
#   HTTP/1.1 200 OK
#   X-Frame-Options: DENY`,
  },
  {
    name: "xframe_options_deny(view)",
    category: "Clickjacking Protection",
    description:
      "Декоратор из django.views.decorators.clickjacking, принудительно устанавливающий X-Frame-Options: DENY для ответа конкретного представления — независимо от глобальной настройки X_FRAME_OPTIONS. Используется, когда сайт в целом разрешает SAMEORIGIN, но отдельные страницы (например, форма логина, страница оплаты) должны быть полностью защищены от встраивания.",
    syntax: `from django.views.decorators.clickjacking import xframe_options_deny

@xframe_options_deny
def my_view(request):
    ...`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор оборачивает её и выставляет на ответе X-Frame-Options: DENY.",
      },
    ],
    example: `from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_deny
from django.utils.decorators import method_decorator
from django.views import View

# Функциональное представление
@xframe_options_deny
def login_view(request):
    # Эту страницу невозможно встроить в iframe ни на одном домене
    return render(request, 'auth/login.html')

# CBV — через method_decorator
@method_decorator(xframe_options_deny, name='dispatch')
class PaymentView(View):
    def get(self, request):
        return render(request, 'payment/form.html')

# Глобальная настройка может быть SAMEORIGIN, но эти view всё равно DENY:
# settings.py: X_FRAME_OPTIONS = 'SAMEORIGIN'
#
# Запрос /login/ → X-Frame-Options: DENY
# Запрос /other/ → X-Frame-Options: SAMEORIGIN`,
  },
  {
    name: "xframe_options_sameorigin(view)",
    category: "Clickjacking Protection",
    description:
      "Декоратор из django.views.decorators.clickjacking, устанавливающий X-Frame-Options: SAMEORIGIN для ответа конкретного представления. Разрешает встраивание страницы в iframe только на том же домене (origin). Используется в обратной ситуации: глобально стоит DENY, но отдельным страницам нужно разрешить встраивание внутри собственного сайта (например, виджет, превью, админ-панель).",
    syntax: `from django.views.decorators.clickjacking import xframe_options_sameorigin

@xframe_options_sameorigin
def my_view(request):
    ...`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор оборачивает её и выставляет на ответе X-Frame-Options: SAMEORIGIN.",
      },
    ],
    example: `from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

# Виджет, который встраивается в админ-панель того же домена
@xframe_options_sameorigin
def stats_widget(request):
    return render(request, 'widgets/stats.html')

# CBV — через method_decorator
@method_decorator(xframe_options_sameorigin, name='dispatch')
class PreviewView(TemplateView):
    template_name = 'editor/preview.html'

# settings.py: X_FRAME_OPTIONS = 'DENY' (глобально)
#
# Запрос /widgets/stats/ → X-Frame-Options: SAMEORIGIN
#   - https://example.com/page/ может встроить /widgets/stats/ в <iframe>
#   - https://other.com/page/ — браузер заблокирует встраивание
# Запрос /any-other/ → X-Frame-Options: DENY (по умолчанию)`,
  },
  {
    name: "xframe_options_exempt(view)",
    category: "Clickjacking Protection",
    description:
      "Декоратор из django.views.decorators.clickjacking, помечающий ответ представления флагом xframe_options_exempt = True. XFrameOptionsMiddleware пропускает такие ответы и НЕ выставляет заголовок X-Frame-Options. Используется для страниц, которые должны быть встраиваемы кем угодно (виджеты, embed-плееры, публичные превью). Применять с осторожностью — отсутствие X-Frame-Options делает страницу уязвимой для clickjacking.",
    syntax: `from django.views.decorators.clickjacking import xframe_options_exempt

@xframe_options_exempt
def my_view(request):
    ...`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор оборачивает её и устанавливает на ответе response.xframe_options_exempt = True, что заставляет XFrameOptionsMiddleware пропустить этот ответ.",
      },
    ],
    example: `from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
from django.views.generic import DetailView
from .models import Video

# Embed-плеер, который должен встраиваться на любом сайте
@xframe_options_exempt
def video_embed(request, video_id):
    video = Video.objects.get(pk=video_id)
    return render(request, 'embed/video.html', {'video': video})

# CBV-вариант
@method_decorator(xframe_options_exempt, name='dispatch')
class WidgetEmbedView(DetailView):
    model = Video
    template_name = 'embed/widget.html'

# Запрос /embed/123/:
#   - response.xframe_options_exempt = True (выставлен декоратором)
#   - XFrameOptionsMiddleware видит флаг и НЕ добавляет заголовок
#   - Ответ уходит без X-Frame-Options
#   - Любой сайт может встроить страницу: <iframe src="…/embed/123/"></iframe>

# Внимание: страница без X-Frame-Options уязвима для clickjacking.
# Используйте только для контента, специально предназначенного для embed,
# и не размещайте на этих страницах форм с действиями (CSRF + clickjacking).`,
  },
  {
    name: "X_FRAME_OPTIONS",
    category: "Clickjacking Protection",
    description:
      'Настройка Django (settings.py), задающая значение HTTP-заголовка X-Frame-Options, которое XFrameOptionsMiddleware добавляет ко всем ответам. Допустимые значения: "DENY" (запретить встраивание полностью, значение по умолчанию начиная с Django 3.0) и "SAMEORIGIN" (разрешить встраивание только на собственном домене). Регистр значения не важен — Django приведёт его к верхнему. Значение "ALLOW-FROM uri" не поддерживается современными браузерами и Django его не использует.',
    syntax: `# settings.py
X_FRAME_OPTIONS = 'DENY'  # или 'SAMEORIGIN'`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# 1. Полный запрет встраивания (по умолчанию, рекомендуется)
X_FRAME_OPTIONS = 'DENY'
#   Любая попытка <iframe src="https://example.com/"> блокируется браузером.

# 2. Разрешить встраивание только своему домену (для внутренних виджетов)
X_FRAME_OPTIONS = 'SAMEORIGIN'
#   https://example.com/admin/ может встраивать https://example.com/widget/
#   https://other.com/page/  не может — браузер заблокирует iframe.

# Точечные исключения через декораторы:
from django.views.decorators.clickjacking import (
    xframe_options_deny,
    xframe_options_sameorigin,
    xframe_options_exempt,
)

# Глобально SAMEORIGIN, но форма логина — строго DENY
@xframe_options_deny
def login(request): ...

# Глобально DENY, но один embed-плеер — без заголовка
@xframe_options_exempt
def embed(request): ...

# Проверка через curl:
#   $ curl -I https://example.com/
#   HTTP/1.1 200 OK
#   X-Frame-Options: DENY

# Современная альтернатива (более гибкая) — заголовок CSP frame-ancestors:
#   Content-Security-Policy: frame-ancestors 'self' https://partner.com;
# При наличии CSP frame-ancestors браузеры игнорируют X-Frame-Options.
# В Django CSP настраивается через сторонние пакеты (например, django-csp).`,
  },
  {
    name: "django.contrib.admin",
    category: "contrib packages",
    description:
      "Встроенная административная панель Django — автоматически сгенерированный веб-интерфейс для CRUD-операций над моделями. Регистрация моделей через admin.site.register() или декоратор @admin.register(). Поддерживает кастомизацию через ModelAdmin: list_display, list_filter, search_fields, fieldsets, inlines, actions. Требует контрибов auth, contenttypes, sessions и messages. Доступна по URL /admin/ после подключения admin.site.urls в URLconf.",
    syntax: `# settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    ...,
]`,
    arguments: [],
    example: `# admin.py
from django.contrib import admin
from .models import Article, Comment

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'published_at')
    list_filter = ('status', 'category', 'published_at')
    search_fields = ('title', 'body')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'
    actions = ['publish_selected']

    fieldsets = (
        (None, {'fields': ('title', 'slug', 'body')}),
        ('Публикация', {'fields': ('status', 'published_at')}),
    )

    @admin.action(description='Опубликовать выбранные')
    def publish_selected(self, request, queryset):
        queryset.update(status='published')

class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0

# urls.py
from django.contrib import admin
from django.urls import path
urlpatterns = [path('admin/', admin.site.urls)]

# Создание суперпользователя:
#   python manage.py createsuperuser`,
  },
  {
    name: "django.contrib.auth",
    category: "contrib packages",
    description:
      "Подсистема аутентификации и авторизации Django: модели User/Group/Permission, бэкенды аутентификации, middleware для request.user, готовые view для login/logout/password change/password reset, декораторы @login_required, @permission_required, миксины LoginRequiredMixin, PermissionRequiredMixin, UserPassesTestMixin. Поддерживает кастомные модели пользователя через AUTH_USER_MODEL.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.auth', 'django.contrib.contenttypes', ...]
MIDDLEWARE = [..., 'django.contrib.auth.middleware.AuthenticationMiddleware', ...]
AUTH_USER_MODEL = 'accounts.User'  # опционально`,
    arguments: [],
    example: `# Аутентификация
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, permission_required

def my_login(request):
    user = authenticate(request, username='alice', password='secret')
    if user:
        login(request, user)

@login_required
def profile(request):
    return render(request, 'profile.html', {'user': request.user})

@permission_required('blog.add_article', raise_exception=True)
def new_article(request):
    ...

# CBV-миксины
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin

class DraftListView(LoginRequiredMixin, ListView):
    login_url = '/accounts/login/'
    model = Article

class AdminListView(PermissionRequiredMixin, ListView):
    permission_required = 'blog.view_article'
    model = Article

# Готовые URL для логина/логаута/смены пароля
# urls.py
from django.urls import path, include
urlpatterns = [path('accounts/', include('django.contrib.auth.urls'))]
# /accounts/login/, /accounts/logout/, /accounts/password_change/, /password_reset/`,
  },
  {
    name: "django.contrib.contenttypes",
    category: "contrib packages",
    description:
      "Подсистема, предоставляющая обобщённый интерфейс к моделям проекта. Создаёт таблицу django_content_type с записью для каждой зарегистрированной модели (app_label, model). Используется системой permissions, GenericForeignKey, redirects, admin log и любыми приложениями, которым нужно ссылаться на «любую модель». Ключевая модель — ContentType, ключевые поля — GenericForeignKey, GenericRelation.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.contenttypes', ...]`,
    arguments: [],
    example: `# Получить ContentType по модели
from django.contrib.contenttypes.models import ContentType
from .models import Article

ct = ContentType.objects.get_for_model(Article)
print(ct.app_label, ct.model)  # 'blog', 'article'

# Восстановить класс модели из ContentType
ModelClass = ct.model_class()                  # <class 'blog.models.Article'>
article = ct.get_object_for_this_type(pk=42)   # экземпляр Article

# GenericForeignKey — ссылка на любую модель
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

class Article(models.Model):
    title = models.CharField(max_length=200)
    tags = GenericRelation(Tag)   # обратная связь

# Использование
article = Article.objects.create(title='Hi')
Tag.objects.create(name='python', content_object=article)
print(article.tags.all())   # <QuerySet [<Tag: python>]>`,
  },
  {
    name: "django.contrib.flatpages",
    category: "contrib packages",
    description:
      "Простой CMS-модуль для редактирования статичных страниц через админку: «О нас», «Контакты», «Политика конфиденциальности». Каждая страница — это запись модели FlatPage с URL, заголовком, содержимым (HTML/markdown) и шаблоном. Доступ к страницам — через FlatpageFallbackMiddleware (отдаёт страницу, если не сработал URLconf) или явно через flatpage view. Требует contrib.sites.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.flatpages', 'django.contrib.sites', ...]
MIDDLEWARE = [..., 'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware']
SITE_ID = 1`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = [
    'django.contrib.sites',
    'django.contrib.flatpages',
    ...,
]
SITE_ID = 1
MIDDLEWARE = [
    ...,
    'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware',
]

# python manage.py migrate
# Затем в админке: Flat pages → Add flat page
#   URL:           /about/
#   Title:         О нас
#   Content:       <h1>Привет!</h1>
#   Sites:         example.com
#   Template name: flatpages/default.html (по умолчанию)

# templates/flatpages/default.html
# <html>
#   <head><title>{{ flatpage.title }}</title></head>
#   <body>{{ flatpage.content|safe }}</body>
# </html>

# Логика FlatpageFallbackMiddleware:
#   - URL не нашёлся в URLconf → 404
#   - middleware ловит 404 и ищет FlatPage с таким URL
#   - если нашёл — рендерит шаблон страницы

# Альтернатива — явный URL:
# urls.py
from django.urls import path
from django.contrib.flatpages import views
urlpatterns = [path('about/', views.flatpage, {'url': '/about/'})]`,
  },
  {
    name: "django.contrib.gis",
    category: "contrib packages",
    description:
      "GeoDjango — расширение для работы с геоданными: точки, линии, полигоны, расстояния, геокодирование. Поддерживает PostGIS (PostgreSQL), SpatiaLite (SQLite), Oracle Spatial, MySQL. Предоставляет геометрические поля моделей (PointField, PolygonField, LineStringField), QuerySet-операции (distance, intersects, within), GIS-формы и виджеты, OGR/GDAL для импорта shapefile/GeoJSON, geometry для админки.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.gis', ...]
DATABASES = {'default': {'ENGINE': 'django.contrib.gis.db.backends.postgis', ...}}`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = ['django.contrib.gis', ...]
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'mydb', 'USER': 'me', 'PASSWORD': '...', 'HOST': 'localhost',
    }
}

# models.py
from django.contrib.gis.db import models

class Cafe(models.Model):
    name = models.CharField(max_length=100)
    location = models.PointField(geography=True, srid=4326)   # WGS84
    area = models.PolygonField(null=True)

# Создание объектов
from django.contrib.gis.geos import Point, Polygon
cafe = Cafe.objects.create(
    name='Кофейня',
    location=Point(37.6173, 55.7558),   # долгота, широта (Москва)
)

# Гео-запросы
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance

point = Point(37.6, 55.75, srid=4326)

# Кафе в радиусе 1 км
nearby = Cafe.objects.filter(location__distance_lte=(point, D(km=1)))

# С расстоянием в результате, отсортированные по близости
sorted_cafes = (
    Cafe.objects.annotate(dist=Distance('location', point))
    .order_by('dist')[:10]
)`,
  },
  {
    name: "django.contrib.humanize",
    category: "contrib packages",
    description:
      "Набор шаблонных фильтров для «человеческого» представления данных: чисел, дат, временных интервалов. Включает intcomma (1,000,000), intword (1.0 million), apnumber (один…девять словами), naturalday (вчера/завтра/3 апреля), naturaltime (5 минут назад), ordinal (1-й, 2-й). Не требует моделей и middleware — только добавления в INSTALLED_APPS и {% load humanize %} в шаблоне.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.humanize', ...]

# template
{% load humanize %}
{{ value|intcomma }}`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = ['django.contrib.humanize', ...]

# templates/example.html
{% load humanize %}

# Числа
<p>{{ 1234567|intcomma }}</p>          # 1,234,567
<p>{{ 1500000|intword }}</p>           # 1.5 million
<p>{{ 5|apnumber }}</p>                # five
<p>{{ 3|ordinal }}</p>                 # 3rd

# Даты
{# today = 2024-03-15 #}
<p>{{ yesterday|naturalday }}</p>      # yesterday
<p>{{ next_week|naturalday }}</p>      # March 22
<p>{{ comment.created|naturaltime }}</p>  # 5 minutes ago, 2 hours ago

# Локализация — фильтры реагируют на текущий язык (LANGUAGE_CODE):
# settings.py
LANGUAGE_CODE = 'ru'
USE_I18N = True
# Тогда:
# {{ 1234567|intcomma }}  →  1 234 567
# {{ comment.created|naturaltime }}  →  5 минут назад

# В Python-коде (не только в шаблонах)
from django.contrib.humanize.templatetags.humanize import naturaltime, intcomma
print(naturaltime(timezone.now() - timedelta(minutes=5)))  # "5 минут назад"
print(intcomma(1234567))  # "1,234,567"`,
  },
  {
    name: "django.contrib.messages",
    category: "contrib packages",
    description:
      "Подсистема одноразовых сообщений (flash messages) — текст, который сохраняется между запросами и отображается пользователю один раз: «Сохранено», «Ошибка», «Добро пожаловать». Поддерживает уровни (DEBUG, INFO, SUCCESS, WARNING, ERROR), различные backend'ы хранения (session, cookie, fallback) и тегирование для CSS-классов. Требует SessionMiddleware (для session-backend) и MessageMiddleware.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.messages', ...]
MIDDLEWARE = [
    ..., 'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]`,
    arguments: [],
    example: `# views.py
from django.contrib import messages
from django.shortcuts import redirect

def save_profile(request):
    if request.method == 'POST':
        # ...сохраняем...
        messages.success(request, 'Профиль обновлён.')
        return redirect('profile')

def delete_account(request):
    request.user.delete()
    messages.warning(request, 'Аккаунт удалён.')
    return redirect('home')

def buggy_view(request):
    messages.error(request, 'Не удалось обработать запрос.')
    messages.info(request, 'Попробуйте ещё раз через минуту.')
    return redirect('home')

# templates/base.html
# {% if messages %}
#   <ul class="messages">
#     {% for message in messages %}
#       <li class="alert alert-{{ message.tags }}">
#         {{ message }}
#       </li>
#     {% endfor %}
#   </ul>
# {% endif %}

# Уровни и теги по умолчанию:
#   messages.debug    → tag 'debug'
#   messages.info     → tag 'info'
#   messages.success  → tag 'success'
#   messages.warning  → tag 'warning'
#   messages.error    → tag 'error'

# Backend хранения (settings.py)
MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'
# Альтернативы: cookie.CookieStorage, fallback.FallbackStorage`,
  },
  {
    name: "django.contrib.postgres",
    category: "contrib packages",
    description:
      "Расширения Django ORM для специфичных возможностей PostgreSQL: ArrayField, JSONField (исторический — с 3.1 есть в core db), HStoreField, RangeField (IntegerRangeField, DateRangeField и др.), полнотекстовый поиск (SearchVector, SearchQuery, SearchRank, TrigramSimilarity), агрегаты (ArrayAgg, BoolAnd, StringAgg), индексы (BrinIndex, GinIndex, GistIndex), ограничения (ExclusionConstraint). Работает только с PostgreSQL.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.postgres', ...]`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = ['django.contrib.postgres', ...]

# models.py — массивы и полнотекст
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    tags = ArrayField(models.CharField(max_length=50), default=list)
    search_vector = SearchVectorField(null=True)

    class Meta:
        indexes = [GinIndex(fields=['tags']), GinIndex(fields=['search_vector'])]

# Запросы по массиву
Article.objects.filter(tags__contains=['python'])           # содержит элемент
Article.objects.filter(tags__overlap=['python', 'django'])  # пересекается
Article.objects.filter(tags__len=3)                         # длина массива

# Полнотекстовый поиск
from django.contrib.postgres.search import (
    SearchVector, SearchQuery, SearchRank, TrigramSimilarity,
)

results = (
    Article.objects.annotate(
        rank=SearchRank(SearchVector('title', 'body'), SearchQuery('python'))
    )
    .filter(rank__gte=0.1)
    .order_by('-rank')
)

# Похожесть по триграммам (нужно расширение pg_trgm)
similar = (
    Article.objects.annotate(sim=TrigramSimilarity('title', 'pythn'))
    .filter(sim__gt=0.3)
    .order_by('-sim')
)

# Range-поля
from django.contrib.postgres.fields import IntegerRangeField, DateTimeRangeField

class Booking(models.Model):
    period = DateTimeRangeField()
    age_range = IntegerRangeField()`,
  },
  {
    name: "django.contrib.redirects",
    category: "contrib packages",
    description:
      "Подсистема для управления HTTP-редиректами через админку. Хранит соответствия old_path → new_path в модели Redirect (привязана к Site). Активируется через RedirectFallbackMiddleware: если запрос не нашёл совпадения в URLconf и вернул 404, middleware ищет редирект с подходящим old_path и отдаёт 301 (постоянный) на new_path. Если new_path пустой — возвращает 410 Gone. Требует contrib.sites.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.redirects', 'django.contrib.sites', ...]
MIDDLEWARE = [..., 'django.contrib.redirects.middleware.RedirectFallbackMiddleware']
SITE_ID = 1`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = [
    'django.contrib.sites',
    'django.contrib.redirects',
    ...,
]
SITE_ID = 1
MIDDLEWARE = [
    ...,
    'django.contrib.redirects.middleware.RedirectFallbackMiddleware',
]
# python manage.py migrate

# В админке: Redirects → Add redirect
#   Site:     example.com
#   Old path: /old-blog/article-1/
#   New path: /blog/2024/article-1/

# Логика middleware:
#   GET /old-blog/article-1/
#     1. URLconf не нашёл совпадения → ответ 404
#     2. RedirectFallbackMiddleware ловит 404
#     3. Ищет Redirect.objects.get(site=current, old_path='/old-blog/article-1/')
#     4. Если найдено и new_path != '' → 301 Moved Permanently на new_path
#     5. Если new_path == ''             → 410 Gone

# Программное создание редиректов
from django.contrib.redirects.models import Redirect
from django.contrib.sites.models import Site

site = Site.objects.get_current()
Redirect.objects.create(
    site=site,
    old_path='/legacy/page/',
    new_path='/new/page/',
)

# Удаление страницы — оставить 410 Gone:
Redirect.objects.create(site=site, old_path='/deleted/', new_path='')`,
  },
  {
    name: "django.contrib.sessions",
    category: "contrib packages",
    description:
      "Подсистема серверных сессий — хранение per-user данных между запросами через cookie с session ID. Поддерживает backend-хранилища: db (django_session), cache (Redis/Memcached), cached_db (комбинированное), file (на диске), signed_cookies (в подписанной cookie без серверного хранения). Подключается через SessionMiddleware, доступ — через request.session (словарь-подобный объект).",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.sessions', ...]
MIDDLEWARE = [..., 'django.contrib.sessions.middleware.SessionMiddleware']
SESSION_ENGINE = 'django.contrib.sessions.backends.db'`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = ['django.contrib.sessions', ...]
MIDDLEWARE = [..., 'django.contrib.sessions.middleware.SessionMiddleware']

# Backend хранилища (выбор одного):
SESSION_ENGINE = 'django.contrib.sessions.backends.db'             # БД
# SESSION_ENGINE = 'django.contrib.sessions.backends.cache'         # Redis/Memcached
# SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'     # cache + db
# SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies' # без сервера

SESSION_COOKIE_AGE = 60 * 60 * 24 * 14    # 14 дней
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_SECURE = True              # только HTTPS
SESSION_COOKIE_HTTPONLY = True

# Использование в view
def add_to_cart(request, product_id):
    cart = request.session.get('cart', [])
    cart.append(product_id)
    request.session['cart'] = cart
    request.session.modified = True   # явно при изменении вложенных структур
    return redirect('cart')

def view_cart(request):
    return render(request, 'cart.html', {'items': request.session.get('cart', [])})

def clear_cart(request):
    if 'cart' in request.session:
        del request.session['cart']
    return redirect('home')

# Установить срок жизни конкретной сессии
request.session.set_expiry(3600)   # 1 час
request.session.set_expiry(0)      # до закрытия браузера

# Очистка устаревших сессий
# python manage.py clearsessions`,
  },
  {
    name: "django.contrib.sites",
    category: "contrib packages",
    description:
      "Подсистема многосайтовости — позволяет одному Django-проекту обслуживать несколько доменов (multi-tenant) с разделением контента. Хранит модель Site с полями domain и name; текущий сайт определяется настройкой SITE_ID или middleware CurrentSiteMiddleware (по Host-заголовку). Используется как зависимость flatpages, redirects, sitemaps, syndication и для построения абсолютных URL независимо от текущего запроса.",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.sites', ...]
SITE_ID = 1`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = ['django.contrib.sites', ...]
SITE_ID = 1
# python manage.py migrate
# По умолчанию создаётся Site(id=1, domain='example.com', name='example.com')

# Получить текущий сайт
from django.contrib.sites.models import Site

current = Site.objects.get_current()
print(current.domain)   # 'example.com'

# Переопределить домен (одноразово)
site = Site.objects.get(pk=1)
site.domain = 'mysite.ru'
site.name = 'Мой сайт'
site.save()

# Multi-tenant: разные сайты в одном проекте
# Site(id=1, domain='ru.example.com', name='RU')
# Site(id=2, domain='en.example.com', name='EN')

# В разных WSGI-инстансах указать свой SITE_ID
# Или использовать middleware для автоопределения по Host:
MIDDLEWARE = [
    ..., 'django.contrib.sites.middleware.CurrentSiteMiddleware',
]
# Тогда в любом view: request.site

# Привязка контента к сайту
from django.db import models
class Article(models.Model):
    title = models.CharField(max_length=200)
    sites = models.ManyToManyField(Site)

# Только статьи текущего сайта
articles = Article.objects.filter(sites=Site.objects.get_current())

# Построение абсолютных URL вне HTTP-запроса
from django.contrib.sites.shortcuts import get_current_site
def send_email(request):
    domain = get_current_site(request).domain
    url = f'https://{domain}/articles/{article.pk}/'`,
  },
  {
    name: "django.contrib.sitemaps",
    category: "contrib packages",
    description:
      "Генератор XML-sitemap по стандарту sitemaps.org — карты сайта для поисковых ботов (Google, Yandex, Bing). Sitemap описывается классом-наследником Sitemap с методами items(), location(), lastmod(), changefreq(), priority(). Sitemap index объединяет несколько sitemap. Подключается через django.contrib.sitemaps.views.sitemap. Опционально интегрируется с contrib.sites (домены) и pinging (ping_google).",
    syntax: `from django.contrib.sitemaps import Sitemap

class ArticleSitemap(Sitemap):
    def items(self):
        return Article.objects.filter(status='published')`,
    arguments: [],
    example: `# sitemaps.py
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Article

class ArticleSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8
    protocol = 'https'

    def items(self):
        return Article.objects.filter(status='published')

    def location(self, obj):
        return obj.get_absolute_url()   # или reverse('article', args=[obj.slug])

    def lastmod(self, obj):
        return obj.updated_at

class StaticSitemap(Sitemap):
    priority = 0.5
    changefreq = 'monthly'

    def items(self):
        return ['home', 'about', 'contact']  # имена URL

    def location(self, item):
        return reverse(item)

# urls.py
from django.contrib.sitemaps.views import sitemap
from .sitemaps import ArticleSitemap, StaticSitemap

sitemaps = {'articles': ArticleSitemap, 'static': StaticSitemap}

urlpatterns = [
    path(
        'sitemap.xml',
        sitemap,
        {'sitemaps': sitemaps},
        name='django.contrib.sitemaps.views.sitemap',
    ),
]

# Результат: GET /sitemap.xml
# <?xml version="1.0" encoding="UTF-8"?>
# <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
#   <url>
#     <loc>https://example.com/articles/hello/</loc>
#     <lastmod>2024-03-15</lastmod>
#     <changefreq>weekly</changefreq>
#     <priority>0.8</priority>
#   </url>
#   ...
# </urlset>

# Большие sitemap → разбить на несколько через sitemap index:
from django.contrib.sitemaps.views import index
urlpatterns += [
    path('sitemap.xml', index, {'sitemaps': sitemaps}),
    path('sitemap-<section>.xml', sitemap, {'sitemaps': sitemaps},
         name='django.contrib.sitemaps.views.sitemap'),
]`,
  },
  {
    name: "django.contrib.staticfiles",
    category: "contrib packages",
    description:
      "Подсистема для сбора статических файлов (CSS, JS, изображения) из приложений и сторонних библиотек в одну директорию для отдачи веб-сервером. В development обслуживает файлы напрямую через django.contrib.staticfiles.views.serve. В production команда collectstatic собирает все файлы в STATIC_ROOT для отдачи nginx/CDN. Поддерживает finders (AppDirectories, FileSystem) и storages (FileSystemStorage, ManifestStaticFilesStorage с хешированием).",
    syntax: `# settings.py
INSTALLED_APPS = ['django.contrib.staticfiles', ...]
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'`,
    arguments: [],
    example: `# settings.py
INSTALLED_APPS = ['django.contrib.staticfiles', ...]

STATIC_URL = '/static/'                          # URL-префикс
STATIC_ROOT = BASE_DIR / 'staticfiles'           # куда соберёт collectstatic
STATICFILES_DIRS = [BASE_DIR / 'static']         # дополнительные директории

# Finders — где искать файлы
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',     # STATICFILES_DIRS
    'django.contrib.staticfiles.finders.AppDirectoriesFinder', # <app>/static/<app>/
]

# Storage с хешированием для cache-busting (production)
STORAGES = {
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage',
    },
}
# Тогда style.css → style.5e2266cc1e2c.css (хеш в имени)

# В шаблоне
# {% load static %}
# <link rel="stylesheet" href="{% static 'css/style.css' %}">
# <img src="{% static 'img/logo.png' %}">
# С Manifest-storage в production: /static/css/style.5e2266cc1e2c.css

# Структура файлов:
#   blog/static/blog/style.css      ← найдётся как 'blog/style.css'
#   <project>/static/css/main.css   ← найдётся как 'css/main.css'

# Команды:
#   python manage.py collectstatic        # собрать в STATIC_ROOT
#   python manage.py findstatic css/main.css   # показать, где лежит файл

# urls.py для разработки (не нужно в production — отдаёт nginx)
from django.conf import settings
from django.conf.urls.static import static
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)`,
  },
  {
    name: "django.contrib.syndication",
    category: "contrib packages",
    description:
      "Генератор RSS- и Atom-фидов на основе классов-наследников Feed (для одного фида) или GenericAPIView. Описывает источник методами items() (объекты), title()/link()/description() (атрибуты канала), item_title()/item_description()/item_link()/item_pubdate() (атрибуты записи). Под капотом использует django.utils.feedgenerator.Rss201rev2Feed (RSS 2.0) или Atom1Feed. Подключается как обычный view в URLconf.",
    syntax: `from django.contrib.syndication.views import Feed

class ArticlesFeed(Feed):
    title = 'Статьи блога'
    link = '/feed/'
    def items(self): return Article.objects.all()[:20]`,
    arguments: [],
    example: `# feeds.py
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from django.urls import reverse
from .models import Article

class LatestArticlesFeed(Feed):
    title = 'Блог — последние статьи'
    link = '/blog/'
    description = 'Последние публикации блога'

    def items(self):
        return Article.objects.filter(status='published').order_by('-published_at')[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.summary

    def item_link(self, item):
        return reverse('article-detail', kwargs={'slug': item.slug})

    def item_pubdate(self, item):
        return item.published_at

    def item_author_name(self, item):
        return item.author.get_full_name()

# Atom-фид — наследник с другим feed_type
class LatestArticlesAtomFeed(LatestArticlesFeed):
    feed_type = Atom1Feed
    subtitle = LatestArticlesFeed.description

# Параметризованный фид (категория из URL)
class CategoryFeed(Feed):
    def get_object(self, request, slug):
        return Category.objects.get(slug=slug)

    def title(self, obj):  return f'Статьи в категории {obj.name}'
    def link(self, obj):   return obj.get_absolute_url()
    def items(self, obj):  return obj.articles.order_by('-published_at')[:20]

# urls.py
from django.urls import path
from .feeds import LatestArticlesFeed, LatestArticlesAtomFeed, CategoryFeed

urlpatterns = [
    path('feed/rss/',  LatestArticlesFeed(),     name='rss-feed'),
    path('feed/atom/', LatestArticlesAtomFeed(), name='atom-feed'),
    path('feed/category/<slug:slug>/', CategoryFeed(), name='category-feed'),
]

# В <head> сайта добавить ссылки на фиды:
# <link rel="alternate" type="application/rss+xml"
#       href="/feed/rss/" title="RSS">`,
  },
];
