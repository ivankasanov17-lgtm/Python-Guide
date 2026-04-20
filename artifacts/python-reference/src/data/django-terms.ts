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
    name: 'apps',
    category: 'Applications',
    description: 'Глобальный реестр приложений Django. Объект типа Apps, который хранит конфигурации всех установленных приложений. Доступен через django.apps.apps после завершения инициализации фреймворка.',
    syntax: 'from django.apps import apps',
    arguments: [],
    example: `from django.apps import apps

# Получить все зарегистрированные конфигурации приложений
for app_config in apps.get_app_configs():
    print(app_config.name, app_config.label)

# Проверить, завершена ли инициализация
print(apps.ready)  # True / False`,
  },
  {
    name: 'apps.ready',
    category: 'Applications',
    description: 'Булев атрибут, который становится True после того, как реестр приложений полностью инициализирован и все методы AppConfig.ready() были вызваны. До этого момента импортировать модели и обращаться к ORM небезопасно.',
    syntax: 'apps.ready',
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
    name: 'apps.get_app_configs()',
    category: 'Applications',
    description: 'Возвращает итерируемый объект со всеми экземплярами AppConfig в том порядке, в котором приложения перечислены в INSTALLED_APPS. Используется для обхода всех установленных приложений.',
    syntax: 'apps.get_app_configs()',
    arguments: [],
    example: `from django.apps import apps

for app_config in apps.get_app_configs():
    print(f"Приложение: {app_config.name}")
    print(f"  Метка:   {app_config.label}")
    print(f"  Путь:    {app_config.path}")
    print(f"  Моделей: {len(list(app_config.get_models()))}")`,
  },
  {
    name: 'apps.get_app_config(app_label)',
    category: 'Applications',
    description: 'Возвращает экземпляр AppConfig для приложения с указанной меткой (app_label). Вызывает LookupError, если приложение не найдено в реестре.',
    syntax: 'apps.get_app_config(app_label)',
    arguments: [
      {
        name: 'app_label',
        description: 'Строка — метка приложения (обычно последняя часть имени пакета, например "auth", "contenttypes").',
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
    name: 'apps.is_installed(app_name)',
    category: 'Applications',
    description: 'Возвращает True, если приложение с указанным полным именем (dotted Python path) присутствует в INSTALLED_APPS. Принимает именно полное имя модуля, а не метку (label).',
    syntax: 'apps.is_installed(app_name)',
    arguments: [
      {
        name: 'app_name',
        description: 'Полное имя приложения в виде строки, например "django.contrib.auth" или "myproject.myapp".',
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
    name: 'apps.get_model(app_label, model_name, require_ready=True)',
    category: 'Applications',
    description: 'Возвращает класс модели по метке приложения и имени модели. По умолчанию требует, чтобы реестр был полностью инициализирован (require_ready=True). Имена нечувствительны к регистру.',
    syntax: 'apps.get_model(app_label, model_name, require_ready=True)',
    arguments: [
      {
        name: 'app_label',
        description: 'Метка приложения (краткое имя, например "auth", "contenttypes").',
      },
      {
        name: 'model_name',
        description: 'Имя класса модели (регистронезависимо), например "User", "user", "GROUP".',
      },
      {
        name: 'require_ready',
        description: 'Если True (по умолчанию), вызывает исключение если реестр не готов. Установите False только внутри AppConfig.ready().',
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
    name: 'AppConfig',
    category: 'Applications',
    description: 'Базовый класс для конфигурации Django-приложения. Создаётся в файле apps.py каждого приложения. Позволяет задать метаданные приложения (название, verbose_name) и выполнить инициализацию после загрузки всех приложений через метод ready().',
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
    name: 'AppConfig.name',
    category: 'Applications',
    description: 'Обязательный атрибут класса AppConfig. Полное имя Python-пакета приложения (dotted path), которое должно совпадать с записью в INSTALLED_APPS. Используется для однозначной идентификации приложения в реестре.',
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
];
