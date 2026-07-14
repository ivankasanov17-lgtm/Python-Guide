import { InterviewQuestion } from "./interview";

export const djangoInterviewQuestions: InterviewQuestion[] = [
  {
    id: "django-what-is-and-advantages",
    question:
      "Что такое Django и в чем его основные преимущества по сравнению с другими фреймворками?",
    category: "Архитектура и базовые понятия",
    difficulty: "junior",
    answer: `## Что такое Django

**Django** — это высокоуровневый веб-фреймворк на Python, который следует принципу **"batteries included"** (все включено): в комплекте уже есть ORM, система маршрутизации, шаблонизатор, аутентификация, админ-панель, защита от типовых угроз (CSRF, XSS, SQL-инъекции) и многое другое. Это позволяет быстро строить надежные приложения, не собирая инфраструктуру из десятков отдельных библиотек.

Девиз Django — **"The web framework for perfectionists with deadlines"**.

## Основные преимущества

- **Быстрая разработка.** Готовые компоненты (ORM, формы, админка) сокращают объем шаблонного кода.
- **Встроенная админ-панель.** Автоматически генерируемый интерфейс для управления моделями данных — не нужно писать CRUD-интерфейс вручную для внутренних нужд.
- **ORM.** Работа с базой данных через Python-объекты вместо написания SQL-запросов вручную (хотя сырой SQL при необходимости тоже доступен).
- **Безопасность "из коробки".** Защита от CSRF, XSS, SQL-инъекций, clickjacking включена по умолчанию.
- **Масштабируемость.** Django используют крупные проекты (Instagram, Disqus, Pinterest) — фреймворк хорошо работает и на небольших, и на высоконагруженных проектах.
- **Богатая экосистема.** Django REST Framework для API, Celery для фоновых задач, множество готовых пакетов (django-allauth, django-cms и т.д.).
- **Принцип DRY (Don't Repeat Yourself).** Фреймворк подталкивает к переиспользованию кода через модели, миксины, generic-классы.

## Сравнение с другими фреймворками

| | Django | Flask / FastAPI |
|---|---|---|
| Подход | "Все включено", много решений "из коробки" | Микрофреймворк, минимум зависимостей по умолчанию |
| Скорость старта проекта | Быстрее для типовых веб-приложений | Быстрее для маленьких/специфичных сервисов |
| Гибкость | Меньше свободы выбора компонентов | Полная свобода выбора библиотек |
| Типичное применение | Полноценные веб-приложения, CMS, админки | API, микросервисы, простые сервисы |

Итог: Django выигрывает там, где нужно быстро получить полнофункциональное приложение с админкой, аутентификацией и ORM без сборки инфраструктуры с нуля.`,
  },
  {
    id: "django-mvt-vs-mvc",
    question:
      "Как расшифровывается и работает архитектура MVT (Model-View-Template) в Django? Чем она отличается от классического MVC?",
    category: "Архитектура и базовые понятия",
    difficulty: "junior",
    answer: `## MVT — Model-View-Template

Django использует архитектурный паттерн **MVT**:

- **Model (Модель)** — описывает структуру данных и логику работы с базой данных. Каждая модель — это Python-класс, наследуемый от \`django.db.models.Model\`, который транслируется в таблицу БД.
- **View (Представление)** — содержит логику обработки запроса: получает данные из моделей, обрабатывает их и передает в шаблон (или возвращает JSON, редирект и т.д.).
- **Template (Шаблон)** — отвечает за отображение данных пользователю (HTML с использованием Django Template Language).

\`\`\`python
# models.py — Model
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()

# views.py — View
from django.shortcuts import render

def article_list(request):
    articles = Article.objects.all()
    return render(request, "articles/list.html", {"articles": articles})
\`\`\`

\`\`\`html
<!-- templates/articles/list.html — Template -->
{% for article in articles %}
  <h2>{{ article.title }}</h2>
  <p>{{ article.body }}</p>
{% endfor %}
\`\`\`

Маршрутизация (urls.py) связывает URL с конкретной view-функцией:

\`\`\`python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("articles/", views.article_list, name="article_list"),
]
\`\`\`

## Чем MVT отличается от MVC

В классическом **MVC (Model-View-Controller)**:
- **Model** — данные и бизнес-логика.
- **View** — представление (то, что видит пользователь, аналог Template в Django).
- **Controller** — обрабатывает пользовательский ввод и управляет взаимодействием между Model и View.

В Django названия немного смещены и это часто путает новичков:

| MVC | Django (MVT) | Роль |
|---|---|---|
| Model | Model | Данные и бизнес-логика — совпадает |
| View | **Template** | Отображение (HTML) |
| Controller | **View** | Обработка запроса, связывающая логика |

Ключевое отличие: в Django **сам фреймворк** берет на себя роль классического Controller — это система URL-маршрутизации (urls.py), которая направляет запрос нужной view-функции. Разработчику остается писать только Model, View (по сути — контроллер) и Template. Из-за этого некоторые называют Django "MVC-фреймворком, где Controller написан за вас".`,
  },
  {
    id: "django-project-vs-app",
    question:
      "В чем концептуальная разница между проектом (project) и приложением (app) в Django?",
    category: "Архитектура и базовые понятия",
    difficulty: "junior",
    answer: `## Проект (project)

**Проект** — это вся веб-конфигурация: набор настроек, которые описывают конкретный сайт целиком. Он создается командой:

\`\`\`bash
django-admin startproject myproject
\`\`\`

Проект содержит:
- \`settings.py\` — глобальные настройки (база данных, установленные приложения, middleware и т.д.);
- \`urls.py\` — корневую таблицу маршрутов;
- \`wsgi.py\` / \`asgi.py\` — точки входа для веб-серверов;
- список подключенных приложений (\`INSTALLED_APPS\`).

Проект сам по себе не содержит бизнес-логику — это "обвязка", которая объединяет приложения в единый сайт.

## Приложение (app)

**Приложение** — это самостоятельный модуль, решающий конкретную задачу (блог, магазин, аутентификация, комментарии). Создается командой:

\`\`\`bash
python manage.py startapp blog
\`\`\`

Приложение содержит свои:
- \`models.py\` — модели данных;
- \`views.py\` — обработчики запросов;
- \`urls.py\` — маршруты приложения (опционально, обычно подключаются в корневой urls.py через \`include()\`);
- \`admin.py\`, \`forms.py\`, \`tests.py\`, \`migrations/\` и т.д.

## Ключевая разница

| | Project | App |
|---|---|---|
| Что это | Конфигурация всего сайта | Модуль конкретной функциональности |
| Количество | Один на сайт | Может быть много в одном проекте |
| Переиспользование | Не переиспользуется | Может подключаться в другие проекты |
| Пример | \`myproject/\` | \`blog\`, \`users\`, \`payments\` |

**Важно:** один проект может (и обычно должен) состоять из нескольких небольших, слабо связанных приложений — это способствует модульности и переиспользованию кода. Приложение должно быть подключено в \`INSTALLED_APPS\` проекта, чтобы Django учитывал его модели, шаблоны и статику.

\`\`\`python
# settings.py
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    # ...
    "blog",       # наше приложение
    "users",      # еще одно приложение
]
\`\`\`

Хороший пример из практики: интернет-магазин (проект) может состоять из приложений \`catalog\`, \`orders\`, \`payments\`, \`reviews\` — каждое отвечает за свою область и в теории может быть перенесено в другой проект.`,
  },
  {
    id: "django-manage-py-purpose",
    question:
      "Для чего нужен файл manage.py? Назовите 3-5 базовых команд, которые вы используете чаще всего.",
    category: "Архитектура и базовые понятия",
    difficulty: "junior",
    answer: `## Для чего нужен manage.py

\`manage.py\` — это командная утилита, автоматически создаваемая в корне проекта при запуске \`django-admin startproject\`. Она выполняет ту же роль, что и \`django-admin\`, но дополнительно **настраивает переменную окружения \`DJANGO_SETTINGS_MODULE\`**, указывая на файл настроек именно этого проекта. Благодаря этому все команды выполняются в контексте нужного проекта, даже если в системе установлено несколько версий Django или несколько проектов.

\`\`\`python
#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
\`\`\`

Через \`manage.py\` запускаются: сервер разработки, миграции, тесты, кастомные management-команды и десятки встроенных утилит.

## Часто используемые команды

\`\`\`bash
# Запустить сервер разработки (по умолчанию http://127.0.0.1:8000/)
python manage.py runserver

# Создать миграции на основе изменений в моделях
python manage.py makemigrations

# Применить миграции к базе данных
python manage.py migrate

# Создать суперпользователя для доступа в админ-панель
python manage.py createsuperuser

# Открыть интерактивную Python-консоль с загруженным окружением Django
python manage.py shell

# Создать новое приложение
python manage.py startapp blog

# Запустить тесты проекта
python manage.py test

# Собрать статические файлы в одну директорию (для production)
python manage.py collectstatic
\`\`\`

Пять команд, которые используются практически каждый день при разработке: **\`runserver\`**, **\`makemigrations\`**, **\`migrate\`**, **\`createsuperuser\`** и **\`shell\`**.`,
  },
  {
    id: "django-settings-py-purpose",
    question:
      "За что отвечает файл settings.py? Какие ключевые настройки в нем хранятся?",
    category: "Архитектура и базовые понятия",
    difficulty: "junior",
    answer: `## Назначение settings.py

\`settings.py\` — это центральный файл конфигурации Django-проекта. В нем описывается все: от подключения к базе данных до списка установленных приложений и правил безопасности. Django загружает этот модуль при старте (путь к нему указывается через переменную окружения \`DJANGO_SETTINGS_MODULE\`, которую задает \`manage.py\`).

## Ключевые настройки

\`\`\`python
# settings.py

# Секретный ключ, используемый для криптографической подписи
# (сессии, CSRF-токены и т.д.). Никогда не публикуйте его в открытом репозитории!
SECRET_KEY = "django-insecure-..."

# Режим отладки. В production ДОЛЖЕН быть False —
# иначе при ошибке пользователю покажут трейсбек с деталями кода.
DEBUG = True

# Список хостов/доменов, с которых разрешено обслуживать сайт
ALLOWED_HOSTS = ["example.com", "www.example.com"]

# Список подключенных приложений (встроенных и собственных)
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "blog",
]

# Промежуточное ПО — цепочка обработчиков каждого запроса/ответа
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

# Путь к корневому файлу маршрутов
ROOT_URLCONF = "myproject.urls"

# Настройки подключения к базе данных
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mydb",
        "USER": "postgres",
        "PASSWORD": "secret",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# Настройки шаблонизатора
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

# Локализация
LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "Europe/Moscow"
USE_I18N = True
USE_TZ = True

# Статические и медиа файлы
STATIC_URL = "static/"
STATIC_ROOT = "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = "media"

# Тип первичного ключа по умолчанию для новых моделей
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
\`\`\`

## Кратко о важнейших настройках

| Настройка | За что отвечает |
|---|---|
| \`SECRET_KEY\` | Криптографическая подпись сессий, CSRF-токенов и т.д. |
| \`DEBUG\` | Режим отладки (в production всегда \`False\`) |
| \`ALLOWED_HOSTS\` | Список доменов, которым разрешено обращаться к сайту |
| \`INSTALLED_APPS\` | Какие приложения подключены к проекту |
| \`MIDDLEWARE\` | Цепочка обработки запроса/ответа (аутентификация, CSRF, сессии) |
| \`ROOT_URLCONF\` | Где искать корневые маршруты (urls.py) |
| \`DATABASES\` | Подключение к базе данных |
| \`TEMPLATES\` | Настройки движка шаблонов |
| \`STATIC_URL\` / \`STATIC_ROOT\` | Работа со статическими файлами (CSS, JS, изображения) |

На практике в реальных проектах чувствительные значения (\`SECRET_KEY\`, пароли от БД) обычно не хранят прямо в \`settings.py\`, а подгружают из переменных окружения (например, через \`django-environ\` или \`python-decouple\`), чтобы не закоммитить секреты в репозиторий.`,
  },
  {
    id: "django-orm-what-and-purpose",
    question:
      "Что такое Django ORM и для решения каких задач он используется?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## Что такое Django ORM

**ORM (Object-Relational Mapping)** — это технология, позволяющая работать с базой данных через обычные Python-объекты и методы, а не через прямые SQL-запросы. Django ORM транслирует операции над Python-классами (моделями) в SQL-запросы к реальной базе данных и превращает результаты запросов обратно в Python-объекты.

\`\`\`python
# models.py
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    published = models.BooleanField(default=False)
\`\`\`

Вместо того чтобы писать:

\`\`\`sql
SELECT * FROM articles WHERE published = true;
\`\`\`

мы пишем на Python:

\`\`\`python
Article.objects.filter(published=True)
\`\`\`

## Какие задачи решает

- **Создание, чтение, обновление, удаление данных (CRUD)** без написания SQL вручную.
- **Абстракция от конкретной СУБД.** Один и тот же код модели работает с PostgreSQL, MySQL, SQLite, Oracle — Django ORM сам генерирует диалект SQL, подходящий для выбранной базы.
- **Управление схемой БД через миграции** — изменения в моделях автоматически превращаются в SQL для изменения таблиц.
- **Защита от SQL-инъекций** — ORM автоматически экранирует параметры запросов.
- **Удобная работа со связями** между таблицами (ForeignKey, ManyToMany, OneToOne) без написания JOIN-запросов вручную.
- **Валидация и бизнес-логика** прямо в модели (методы, свойства, переопределение \`save()\`).

## Пример типичных операций

\`\`\`python
# Создание записи
article = Article.objects.create(title="Django ORM", published=True)

# Чтение
articles = Article.objects.filter(published=True)
first = Article.objects.first()

# Обновление
article.title = "Django ORM обновлен"
article.save()

# Удаление
article.delete()
\`\`\`

Django ORM — не универсальное решение для абсолютно всех сценариев (для очень сложных аналитических запросов иногда проще написать сырой SQL через \`Model.objects.raw()\` или \`connection.cursor()\`), но для типовых задач веб-приложения он покрывает 95% потребностей.`,
  },
  {
    id: "django-orm-relationship-fields",
    question:
      "Какие виды связей между таблицами поддерживает Django ORM (объясните ForeignKey, ManyToManyField, OneToOneField)?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `Django ORM поддерживает три основных типа связей между моделями (таблицами).

## ForeignKey — связь "один ко многим"

Одна запись в таблице A может быть связана с множеством записей в таблице B, но каждая запись в B ссылается только на одну запись в A. Пример: у одного автора может быть много статей, но у каждой статьи — только один автор.

\`\`\`python
class Author(models.Model):
    name = models.CharField(max_length=100)

class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,   # что делать при удалении Author
        related_name="articles",   # для обратного доступа: author.articles.all()
    )
\`\`\`

\`\`\`python
author = Author.objects.get(id=1)
author.articles.all()          # все статьи автора (обратная связь)

article = Article.objects.get(id=1)
article.author                 # объект Author
\`\`\`

Параметр \`on_delete\` обязателен и определяет поведение при удалении связанного объекта: \`CASCADE\` (удалить и связанные записи), \`PROTECT\` (запретить удаление), \`SET_NULL\` (установить NULL, требует \`null=True\`) и др.

## ManyToManyField — связь "многие ко многим"

Записи из таблицы A могут быть связаны с множеством записей таблицы B, и наоборот. Пример: у статьи может быть много тегов, и каждый тег может быть у многих статей.

\`\`\`python
class Tag(models.Model):
    name = models.CharField(max_length=50)

class Article(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, related_name="articles")
\`\`\`

Django автоматически создает промежуточную (junction) таблицу для хранения пар id.

\`\`\`python
article.tags.add(tag1, tag2)     # добавить теги
article.tags.all()               # все теги статьи
tag.articles.all()               # все статьи с этим тегом (обратная связь)
\`\`\`

## OneToOneField — связь "один к одному"

Каждая запись в таблице A связана максимум с одной записью в таблице B, и наоборот. Технически это ForeignKey с ограничением уникальности. Классический пример — расширение стандартной модели пользователя дополнительным профилем.

\`\`\`python
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
\`\`\`

\`\`\`python
user.profile          # доступ к профилю через пользователя (обратная связь, без .all())
profile.user           # доступ к пользователю из профиля
\`\`\`

## Сводная таблица

| Тип связи | Пример | Особенность |
|---|---|---|
| \`ForeignKey\` | Статья → Автор | Многие записи ссылаются на одну |
| \`ManyToManyField\` | Статья ↔ Теги | Много ко многим, создается промежуточная таблица |
| \`OneToOneField\` | Пользователь ↔ Профиль | Строго одна к одной, ForeignKey с уникальностью |`,
  },
  {
    id: "django-migrations-makemigrations-vs-migrate",
    question:
      "Что такое миграции в Django? В чем разница между командами makemigrations и migrate?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## Что такое миграции

**Миграции** — это способ Django синхронизировать изменения в моделях (Python-коде) со схемой реальной базы данных. Каждая миграция — это Python-файл с набором инструкций (создать таблицу, добавить поле, изменить тип и т.д.), который Django может применить к БД или откатить обратно. Миграции хранятся в директории \`migrations/\` внутри каждого приложения и версионируются вместе с кодом (коммитятся в git).

Это избавляет от необходимости вручную писать \`ALTER TABLE\` при каждом изменении модели.

## makemigrations

Команда **анализирует изменения** в файлах \`models.py\` (по сравнению с уже созданными миграциями) и **генерирует новый файл миграции** с описанием этих изменений. На этом шаге база данных **еще не трогается** — создается только Python-файл.

\`\`\`bash
python manage.py makemigrations
\`\`\`

\`\`\`python
# blog/migrations/0002_article_published.py (пример сгенерированного файла)
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("blog", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="article",
            name="published",
            field=models.BooleanField(default=False),
        ),
    ]
\`\`\`

## migrate

Команда **применяет** миграции (уже существующие файлы) к реальной базе данных — выполняет соответствующие SQL-команды (CREATE TABLE, ALTER TABLE и т.д.) и обновляет служебную таблицу \`django_migrations\`, где Django хранит информацию о том, какие миграции уже применены.

\`\`\`bash
python manage.py migrate
\`\`\`

## Ключевое различие

| | makemigrations | migrate |
|---|---|---|
| Что делает | Генерирует файл миграции на основе изменений в моделях | Применяет существующие файлы миграций к базе данных |
| Трогает БД? | Нет | Да |
| Когда выполняется | После изменения \`models.py\` | После \`makemigrations\`, а также при первом деплое / настройке окружения |

## Типичный рабочий цикл

\`\`\`bash
# 1. Изменили модель в models.py, например добавили новое поле

# 2. Сгенерировать файл миграции
python manage.py makemigrations

# 3. Применить миграцию к базе данных
python manage.py migrate

# Дополнительно полезно:
python manage.py showmigrations   # посмотреть какие миграции применены
python manage.py sqlmigrate blog 0002   # посмотреть SQL, который будет выполнен
\`\`\`

Важно: если несколько разработчиков изменяют одни и те же модели в разных ветках, возможны конфликты миграций — Django предупредит об этом и потребует создать миграцию-слияние (\`makemigrations --merge\`).`,
  },
  {
    id: "django-queryset-lazy-evaluation",
    question:
      "Что такое QuerySet? Как работает \"ленивая загрузка\" (lazy evaluation) запросов?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## Что такое QuerySet

**QuerySet** — это объект, представляющий коллекцию объектов из базы данных, полученную через ORM. Он возвращается большинством методов менеджера модели (\`Model.objects\`), таких как \`all()\`, \`filter()\`, \`exclude()\`. QuerySet можно фильтровать, сортировать, комбинировать с другими QuerySet — по сути, это конструктор SQL-запроса, а не сразу готовый результат.

\`\`\`python
qs = Article.objects.filter(published=True)   # это QuerySet, а не список
print(type(qs))   # <class 'django.db.models.query.QuerySet'>
\`\`\`

## Ленивая загрузка (lazy evaluation)

Ключевая особенность QuerySet — он **не обращается к базе данных в момент создания**. SQL-запрос выполняется только тогда, когда результат действительно нужен (например, при итерации, вызове \`list()\`, обращении по индексу, или вызове \`len()\`). До этого момента QuerySet можно свободно "дособирать" — добавлять фильтры, сортировку и т.д., и все это объединится в один финальный SQL-запрос.

\`\`\`python
# Ни одна из этих строк не обращается к БД:
qs = Article.objects.all()
qs = qs.filter(published=True)
qs = qs.exclude(title__startswith="Draft")
qs = qs.order_by("-created_at")

# Запрос выполнится только здесь, при первой попытке получить данные:
for article in qs:        # <- вот тут происходит SQL-запрос
    print(article.title)
\`\`\`

## Когда QuerySet "вычисляется" (evaluates)

QuerySet выполняет реальный запрос к базе в следующих случаях:

\`\`\`python
list(Article.objects.all())        # преобразование в список
for a in Article.objects.all(): ... # итерация
bool(Article.objects.all())        # проверка на пустоту
Article.objects.all()[0]           # обращение по индексу
len(Article.objects.all())         # вызов len()
repr(Article.objects.all())        # вывод в консоль/отладчик
\`\`\`

## Почему это важно

1. **Эффективность.** Можно строить сложный запрос из нескольких вызовов без лишних обращений к БД:

\`\`\`python
qs = Article.objects.filter(published=True)
if search_query:
    qs = qs.filter(title__icontains=search_query)
if category:
    qs = qs.filter(category=category)
# SQL выполнится один раз — там, где qs реально понадобится (например, в шаблоне)
\`\`\`

2. **Кэширование результата.** После первого выполнения QuerySet кэширует результат внутри себя — повторная итерация по тому же объекту QuerySet не делает новый запрос:

\`\`\`python
qs = Article.objects.filter(published=True)
list(qs)   # запрос выполнен, результат закэширован
list(qs)   # повторного запроса к БД НЕ будет — используется кэш
\`\`\`

3. **Частая ошибка новичков** — случайно выполнить один и тот же QuerySet много раз в цикле (например, из-за \`if qs:\` и потом \`for x in qs:\` без переиспользования кэша в некоторых сценариях, либо создание нового QuerySet каждый раз в цикле), что приводит к лишним запросам к базе.`,
  },
  {
    id: "django-get-vs-filter",
    question:
      "В чем принципиальная разница между методами get() и filter() при работе с базой данных?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## get()

Метод \`get()\` возвращает **ровно один объект модели** (а не QuerySet), соответствующий условиям поиска.

\`\`\`python
article = Article.objects.get(id=1)
print(article.title)   # сразу доступны атрибуты объекта
\`\`\`

Используется, когда мы точно знаем, что запись существует и она единственная (например, поиск по первичному ключу или уникальному полю).

## filter()

Метод \`filter()\` возвращает **QuerySet** — коллекцию объектов (может быть 0, 1 или много), соответствующих условиям.

\`\`\`python
articles = Article.objects.filter(published=True)
print(articles.count())     # сколько найдено
for article in articles:    # итерация по всем найденным
    print(article.title)
\`\`\`

Используется для получения списка записей, в том числе когда неизвестно точное количество совпадений.

## Ключевые отличия

| | get() | filter() |
|---|---|---|
| Возвращает | Один объект модели | QuerySet (коллекцию) |
| Если 0 совпадений | Исключение \`DoesNotExist\` | Пустой QuerySet (не ошибка) |
| Если >1 совпадений | Исключение \`MultipleObjectsReturned\` | Все совпадения в QuerySet |
| Типичное применение | Поиск по PK/уникальному полю | Списки, фильтрация, пагинация |

## Пример на практике

\`\`\`python
# Правильно: id уникален, get() безопасен
article = Article.objects.get(id=5)

# Неправильно: published не уникально, get() может выбросить MultipleObjectsReturned
article = Article.objects.get(published=True)   # опасно!

# Правильно для нескольких записей:
articles = Article.objects.filter(published=True)
\`\`\``,
  },
  {
    id: "django-get-multiple-or-none-behavior",
    question:
      "Что произойдет, если метод get() найдет несколько записей или не найдет ни одной?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `Метод \`get()\` спроектирован так, чтобы **всегда возвращать ровно один объект** — если это условие не выполняется, он выбрасывает исключение, а не возвращает \`None\` или список.

## Если запись не найдена — DoesNotExist

\`\`\`python
try:
    article = Article.objects.get(id=999)
except Article.DoesNotExist:
    print("Статья не найдена")
\`\`\`

\`Article.DoesNotExist\` — это исключение, автоматически создаваемое Django для каждой модели (доступно как атрибут класса модели). Оно является подклассом более общего \`django.core.exceptions.ObjectDoesNotExist\`, что позволяет ловить его сразу для нескольких моделей:

\`\`\`python
from django.core.exceptions import ObjectDoesNotExist

try:
    obj = SomeModel.objects.get(pk=some_id)
except ObjectDoesNotExist:
    ...
\`\`\`

## Если найдено несколько записей — MultipleObjectsReturned

\`\`\`python
try:
    article = Article.objects.get(published=True)
except Article.MultipleObjectsReturned:
    print("Найдено больше одной статьи, get() тут не подходит")
\`\`\`

\`Article.MultipleObjectsReturned\` — тоже автоматически создаваемое для каждой модели исключение (подкласс \`django.core.exceptions.MultipleObjectsReturned\`).

## Как избежать таких ситуаций

- Используйте \`get()\` только для полей, которые гарантированно уникальны — первичный ключ (\`pk\`/\`id\`), поля с \`unique=True\`, или \`OneToOneField\`.
- Для получения "первого совпадения без гарантии единственности" используйте \`filter().first()\`, который просто вернет \`None\`, если ничего не найдено, без исключений:

\`\`\`python
article = Article.objects.filter(published=True).first()
if article is None:
    print("Ничего не найдено")
\`\`\`

- В Django-представлениях для стандартного паттерна "найти объект или вернуть 404" удобно использовать готовую функцию \`get_object_or_404\`, которая сама перехватывает \`DoesNotExist\`:

\`\`\`python
from django.shortcuts import get_object_or_404

def article_detail(request, pk):
    article = get_object_or_404(Article, pk=pk)
    ...
\`\`\``,
  },
  {
    id: "django-model-str-method",
    question:
      "Для чего в классах моделей определяется магический метод __str__?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## Назначение __str__

Метод \`__str__\` определяет, как объект модели будет представлен в виде **строки** — то есть что вернет \`str(объект)\`. Django активно использует это представление в местах, где нужно показать объект человеку:

- В **админ-панели Django** — список объектов модели показывает именно результат \`__str__\`, а не что-то вроде \`Article object (1)\`.
- В **шаблонах**, когда объект выводится напрямую (\`{{ article }}\`).
- В **консоли/shell** при отладке (\`python manage.py shell\`), в сообщениях об ошибках, в логах.
- В выпадающих списках форм (например, при выборе связанного объекта через \`ForeignKey\` в форме).

## Без __str__

\`\`\`python
class Article(models.Model):
    title = models.CharField(max_length=200)

# без __str__ в консоли и админке будет:
>>> Article.objects.first()
<Article: Article object (1)>
\`\`\`

Это бесполезно для отладки и крайне неудобно в админ-панели — невозможно понять, какая именно запись перед вами.

## С __str__

\`\`\`python
class Article(models.Model):
    title = models.CharField(max_length=200)

    def __str__(self):
        return self.title
\`\`\`

\`\`\`python
>>> Article.objects.first()
<Article: Django ORM для новичков>
\`\`\`

Теперь и в консоли, и в списке админки, и везде, где объект превращается в строку, отображается заголовок статьи, а не бессмысленный \`Article object (1)\`.

## Более сложный пример

\`\`\`python
class Order(models.Model):
    number = models.CharField(max_length=20)
    customer = models.ForeignKey("Customer", on_delete=models.CASCADE)

    def __str__(self):
        return f"Заказ #{self.number} ({self.customer})"
\`\`\`

**Практическое правило:** определять \`__str__\` для каждой модели — это негласный стандарт качества кода в Django-проектах, потому что без него отладка и работа с админкой становятся значительно сложнее.`,
  },
  {
    id: "django-model-meta-class",
    question:
      "Что такое внутренний класс Meta в моделях и какие полезные атрибуты в нем можно задать (например, ordering, verbose_name)?",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## Что такое класс Meta

Внутренний класс \`Meta\` внутри модели Django — это способ задать **метаданные модели**, которые не являются полями базы данных, но влияют на то, как Django работает с моделью: сортировку по умолчанию, имя таблицы, отображаемые названия, уникальные ограничения на комбинацию полей и т.д.

\`\`\`python
class Article(models.Model):
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Статья"
        verbose_name_plural = "Статьи"
\`\`\`

## Полезные атрибуты Meta

\`\`\`python
class Article(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Сортировка по умолчанию для всех QuerySet этой модели
        ordering = ["-created_at", "title"]

        # Человекочитаемое имя модели в единственном числе (для админки и т.д.)
        verbose_name = "Статья"

        # Человекочитаемое имя во множественном числе
        verbose_name_plural = "Статьи"

        # Явное имя таблицы в базе данных (иначе Django сгенерирует его сам)
        db_table = "blog_articles"

        # Уникальность по комбинации нескольких полей
        unique_together = [["title", "category"]]

        # Индексы для ускорения запросов
        indexes = [
            models.Index(fields=["category", "-created_at"]),
        ]

        # Абстрактная модель — не создает свою таблицу,
        # используется только как база для наследования
        abstract = False
\`\`\`

## Как ordering влияет на работу

\`\`\`python
# Без Meta.ordering порядок записей в БД не гарантирован
Article.objects.all()                    # порядок по умолчанию из Meta

# ordering можно переопределить на уровне конкретного запроса:
Article.objects.order_by("title")        # временно игнорирует Meta.ordering
\`\`\`

## Зачем нужны verbose_name / verbose_name_plural

Эти атрибуты используются Django **автоматически** в:
- Заголовках разделов админ-панели;
- Автогенерируемых лейблах форм;
- Сообщениях об ошибках валидации.

Без них Django сам генерирует имя из названия класса (например, \`Article\` → "article"), что для русскоязычного/непереводного проекта выглядит неаккуратно — поэтому \`verbose_name\` часто задают явно.

## Важно

Класс \`Meta\` **не наследуется от \`models.Model\`** — это обычный вложенный класс без родителя, Django просто ищет его по специальному имени внутри модели и читает его атрибуты через механизм метаклассов.`,
  },
  {
    id: "django-orm-q-objects",
    question:
      "Как выполнить сложную выборку данных, например, используя логическое ИЛИ? (Использование Q объектов).",
    category: "Модели, базы данных и ORM",
    difficulty: "junior",
    answer: `## Проблема

Обычный вызов \`filter()\` с несколькими аргументами объединяет условия через **логическое И (AND)**:

\`\`\`python
# published=True И category="tech" (это AND, не то, что нужно для ИЛИ)
Article.objects.filter(published=True, category="tech")
\`\`\`

Но что, если нужно найти статьи, у которых **published=True ИЛИ category="tech"**? Обычный \`filter()\` для этого не подходит — нужны **Q-объекты**.

## Q-объекты

\`Q\` — это класс из \`django.db.models\`, который позволяет строить условия запроса как отдельные объекты и комбинировать их логическими операторами \`|\` (ИЛИ), \`&\` (И) и \`~\` (НЕ), в том числе вкладывая их друг в друга.

\`\`\`python
from django.db.models import Q

# Логическое ИЛИ
Article.objects.filter(Q(published=True) | Q(category="tech"))

# Логическое И (то же самое, что и обычные аргументы filter())
Article.objects.filter(Q(published=True) & Q(category="tech"))

# Логическое НЕ (отрицание условия)
Article.objects.filter(~Q(category="tech"))
\`\`\`

## Комбинирование Q и обычных условий

Q-объекты можно смешивать с обычными key=value аргументами filter() — но Q-объекты должны идти первыми:

\`\`\`python
Article.objects.filter(
    Q(published=True) | Q(category="tech"),
    author=current_user,   # это условие всегда через AND
)
\`\`\`

## Более сложный пример — вложенные условия

\`\`\`python
# (published=True И category="tech") ИЛИ (author=current_user)
Article.objects.filter(
    (Q(published=True) & Q(category="tech")) | Q(author=current_user)
)
\`\`\`

## Реалистичный пример — поиск по нескольким полям

Частый практический сценарий — реализация поиска, когда пользователь вводит текст, а искать нужно сразу в нескольких полях:

\`\`\`python
def search_articles(query):
    return Article.objects.filter(
        Q(title__icontains=query) | Q(body__icontains=query)
    )
\`\`\`

## Динамическое построение условий

Q-объекты особенно полезны, когда набор фильтров формируется динамически (например, в зависимости от параметров запроса от пользователя):

\`\`\`python
filters = Q()
if category:
    filters &= Q(category=category)
if search_text:
    filters &= (Q(title__icontains=search_text) | Q(body__icontains=search_text))

articles = Article.objects.filter(filters)
\`\`\`

**Итог:** для простого "И" достаточно обычных аргументов \`filter()\`, но как только требуется "ИЛИ", "НЕ" или сложная комбинация условий — нужны \`Q\`-объекты.`,
  },
  {
    id: "django-view-input-output-contract",
    question:
      "Что принимает на вход любое представление (view) в Django и что оно обязательно должно вернуть?",
    category: "Представления (Views) и маршрутизация (URLs)",
    difficulty: "junior",
    answer: `## Входной параметр

Любое представление (view), независимо от того, написано ли оно как функция (FBV) или как класс (CBV), первым аргументом всегда получает объект **\`HttpRequest\`** — он содержит всю информацию о входящем HTTP-запросе:

\`\`\`python
def my_view(request):
    print(request.method)        # "GET", "POST" и т.д.
    print(request.GET)           # параметры query string
    print(request.POST)          # данные из формы (для POST)
    print(request.user)          # текущий пользователь (если есть AuthenticationMiddleware)
    print(request.headers)       # заголовки запроса
    print(request.body)          # сырое тело запроса
    ...
\`\`\`

Помимо \`request\`, view может принимать дополнительные позиционные/именованные аргументы — это параметры, извлеченные из URL (например, \`article_id\`).

\`\`\`python
def article_detail(request, article_id):
    ...
\`\`\`

## Обязательный возврат

Представление **обязано вернуть объект \`HttpResponse\`** (или его подкласс) — иначе Django выбросит ошибку \`ValueError: The view didn't return an HttpResponse object\`.

\`\`\`python
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect

def my_view(request):
    return HttpResponse("Привет!")                       # обычный текст/HTML

def my_view_2(request):
    return render(request, "template.html", {"key": "value"})  # тоже HttpResponse (рендерит шаблон)

def my_view_3(request):
    return JsonResponse({"status": "ok"})                 # подкласс HttpResponse для JSON

def my_view_4(request):
    return redirect("home")                               # HttpResponseRedirect, тоже подкласс
\`\`\`

## Наиболее распространенные подклассы HttpResponse

| Класс | Назначение |
|---|---|
| \`HttpResponse\` | Базовый ответ с произвольным содержимым |
| \`JsonResponse\` | Ответ в формате JSON (сериализует dict автоматически) |
| \`HttpResponseRedirect\` (через \`redirect()\`) | Редирект (код 302) |
| \`Http404\` | Не подкласс HttpResponse — это исключение, которое Django сам превращает в страницу 404 |
| \`HttpResponseNotFound\`, \`HttpResponseForbidden\` и др. | Ответы с конкретными кодами состояния |

**Кратко:** вход — \`HttpRequest\` (+ параметры из URL), выход — обязательно объект, унаследованный от \`HttpResponse\`.`,
  },
  {
    id: "django-fbv-vs-cbv",
    question:
      "В чем разница между Function-Based Views (FBV) и Class-Based Views (CBV)? Когда лучше использовать каждое из них?",
    category: "Представления (Views) и маршрутизация (URLs)",
    difficulty: "junior",
    answer: `## Function-Based Views (FBV)

View, написанная как обычная Python-функция, принимающая \`request\` и возвращающая \`HttpResponse\`.

\`\`\`python
from django.shortcuts import render, get_object_or_404

def article_detail(request, pk):
    article = get_object_or_404(Article, pk=pk)
    return render(request, "articles/detail.html", {"article": article})
\`\`\`

**Плюсы:**
- Проще читать и понимать — весь путь исполнения кода виден линейно, сверху вниз.
- Явный контроль над HTTP-методами через простые \`if request.method == "POST":\`.
- Легче для новичков.

**Минусы:**
- Много повторяющегося (boilerplate) кода для типовых задач (список объектов, форма создания/редактирования, удаление) — приходится писать вручную то, что в CBV уже есть готовым.

## Class-Based Views (CBV)

View, написанная как класс, обычно наследуемый от встроенных generic-классов Django (\`ListView\`, \`DetailView\`, \`CreateView\`, \`UpdateView\`, \`DeleteView\` и т.д.). Разные HTTP-методы обрабатываются отдельными методами класса (\`get()\`, \`post()\` и т.д.), а не через ветвление if/else.

\`\`\`python
from django.views.generic import DetailView

class ArticleDetailView(DetailView):
    model = Article
    template_name = "articles/detail.html"
    context_object_name = "article"
\`\`\`

Этот класс полностью заменяет функцию из примера выше — Django сам реализует получение объекта по pk, обработку 404, рендеринг шаблона.

\`\`\`python
# urls.py — подключение CBV требует .as_view()
from django.urls import path
from .views import ArticleDetailView

urlpatterns = [
    path("articles/<int:pk>/", ArticleDetailView.as_view(), name="article_detail"),
]
\`\`\`

**Плюсы:**
- Меньше кода для типовых CRUD-операций за счет generic-классов.
- Переиспользование через наследование и миксины (например, \`LoginRequiredMixin\`).
- Четкое разделение логики по HTTP-методам.

**Минусы:**
- Сложнее отследить, что происходит "под капотом" — логика может быть разбросана по нескольким родительским классам (нужно смотреть Method Resolution Order).
- Выше порог входа для новичков.

## Когда что использовать

| Ситуация | Рекомендация |
|---|---|
| Простая, специфичная логика, не вписывающаяся в стандартные шаблоны | FBV |
| Типовой CRUD (список, деталка, создание, редактирование, удаление) | CBV (generic views) |
| Нужна максимальная читаемость для команды с разным уровнем опыта | FBV |
| Нужно многократно переиспользовать общую логику через миксины | CBV |
| API-эндпоинты (в связке с Django REST Framework) | Практически всегда CBV (\`APIView\`, \`ViewSet\`) |

На практике многие проекты используют оба подхода одновременно — CBV для стандартных CRUD-страниц, FBV для нестандартных случаев (например, вебхуки, специфичная бизнес-логика).`,
  },
  {
    id: "django-urls-connect-view",
    question:
      "Как связать URL-адрес с конкретным представлением в файле urls.py?",
    category: "Представления (Views) и маршрутизация (URLs)",
    difficulty: "junior",
    answer: `## Базовая привязка через path()

Связь URL и view задается функцией \`path()\` (или устаревшей \`re_path()\` для регулярных выражений) в списке \`urlpatterns\`.

\`\`\`python
# blog/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.article_list, name="article_list"),
    path("about/", views.about, name="about"),
    path("articles/<int:pk>/", views.article_detail, name="article_detail"),
]
\`\`\`

Для class-based view нужно вызвать \`.as_view()\`:

\`\`\`python
from .views import ArticleDetailView

urlpatterns = [
    path("articles/<int:pk>/", ArticleDetailView.as_view(), name="article_detail"),
]
\`\`\`

## Подключение urls приложения к корневым urls проекта

Обычно у каждого приложения есть свой \`urls.py\`, который подключается в корневой конфиг проекта через \`include()\`:

\`\`\`python
# myproject/urls.py (корневой)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("blog/", include("blog.urls")),   # все urls блога будут доступны по /blog/...
]
\`\`\`

Так, \`path("articles/<int:pk>/", ...)\` из \`blog/urls.py\` в итоге будет доступен по адресу \`/blog/articles/5/\`.

## Именование маршрутов (name=)

Параметр \`name\` дает маршруту уникальное имя, по которому на него можно ссылаться из кода (\`reverse()\`) или из шаблонов (\`{% url %}\`) без хардкода самого URL — это важно, чтобы при изменении структуры адресов не приходилось искать и менять ссылки по всему проекту.

\`\`\`python
path("articles/<int:pk>/", views.article_detail, name="article_detail")
\`\`\`

## Полный пример структуры

\`\`\`python
# myproject/urls.py
urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("blog.urls")),
]

# blog/urls.py
app_name = "blog"   # для использования пространства имен: "blog:article_detail"
urlpatterns = [
    path("articles/", views.article_list, name="article_list"),
    path("articles/<int:pk>/", views.article_detail, name="article_detail"),
]
\`\`\``,
  },
  {
    id: "django-url-path-parameters",
    question:
      "Как передать динамические параметры (например, ID статьи) прямо из URL-адреса в функцию представления?",
    category: "Представления (Views) и маршрутизация (URLs)",
    difficulty: "junior",
    answer: `## Path converters

Django позволяет объявить в шаблоне URL "заполнители" вида \`<converter:name>\`, которые извлекают часть адреса и передают ее в view как аргумент.

\`\`\`python
# urls.py
urlpatterns = [
    path("articles/<int:pk>/", views.article_detail, name="article_detail"),
]

# views.py
def article_detail(request, pk):    # pk придет как int
    article = get_object_or_404(Article, pk=pk)
    return render(request, "articles/detail.html", {"article": article})
\`\`\`

При запросе \`/articles/5/\` Django извлечет \`5\`, преобразует в \`int\` (согласно конвертеру) и передаст как \`pk=5\` в \`article_detail\`.

## Встроенные конвертеры

| Конвертер | Что соответствует | Пример |
|---|---|---|
| \`str\` (по умолчанию) | Любая непустая строка без \`/\` | \`<str:slug>\` |
| \`int\` | Одно или несколько цифровых символов | \`<int:pk>\` |
| \`slug\` | Буквы, цифры, дефис, подчеркивание | \`<slug:slug>\` |
| \`uuid\` | Формат UUID | \`<uuid:id>\` |
| \`path\` | Любая строка, включая \`/\` | \`<path:filepath>\` |

## Несколько параметров

\`\`\`python
path("articles/<int:year>/<slug:slug>/", views.article_by_year_slug, name="article_by_year_slug")

def article_by_year_slug(request, year, slug):
    article = get_object_or_404(Article, publish_date__year=year, slug=slug)
    ...
\`\`\`

## Class-Based View

В CBV параметры из URL доступны через \`self.kwargs\`:

\`\`\`python
from django.views.generic import DetailView

class ArticleDetailView(DetailView):
    model = Article

    def get_object(self):
        pk = self.kwargs["pk"]
        return get_object_or_404(Article, pk=pk)
\`\`\`

(На практике для DetailView это не нужно писать вручную — встроенный \`get_object()\` уже умеет брать \`pk\` или \`slug\` из \`self.kwargs\` автоматически.)

## Query-параметры — отдельный механизм

Важно не путать параметры пути (\`/articles/5/\`) с query-параметрами (\`/articles/?page=2\`) — последние не описываются в \`urls.py\`, а читаются напрямую из \`request.GET\`:

\`\`\`python
def article_list(request):
    page = request.GET.get("page", 1)   # ?page=2 -> "2"
    ...
\`\`\``,
  },
  {
    id: "django-reverse-and-url-template-tag",
    question:
      "Зачем нужна функция reverse() в коде (Python) и тег {% url %} в шаблонах?",
    category: "Представления (Views) и маршрутизация (URLs)",
    difficulty: "junior",
    answer: `## Проблема, которую они решают

Если хардкодить URL-адреса напрямую строками (\`"/articles/5/"\`) в коде и шаблонах, то при любом изменении структуры маршрутов (например, добавили префикс \`/blog/\`) пришлось бы вручную искать и переписывать все места, где эти строки встречаются. \`reverse()\` и \`{% url %}\` решают эту проблему — они **генерируют URL по имени маршрута**, а не хранят его как готовую строку.

## reverse() — в Python-коде

\`reverse()\` принимает имя маршрута (заданное через \`name=\` в \`path()\`) и возвращает соответствующий URL-адрес.

\`\`\`python
from django.urls import reverse

# urls.py: path("articles/<int:pk>/", views.article_detail, name="article_detail")

url = reverse("article_detail", args=[5])
print(url)   # "/articles/5/"

# с пространством имен приложения (app_name = "blog")
url = reverse("blog:article_detail", args=[5])
\`\`\`

Типичное применение — редиректы после успешной обработки формы:

\`\`\`python
from django.shortcuts import redirect
from django.urls import reverse

def create_article(request):
    if request.method == "POST":
        article = Article.objects.create(...)
        return redirect(reverse("article_detail", args=[article.pk]))
        # или короче: return redirect("article_detail", pk=article.pk)
\`\`\`

## {% url %} — в шаблонах

Аналог \`reverse()\`, но для использования прямо в HTML-шаблонах.

\`\`\`html
<!-- вместо хардкода -->
<a href="/articles/{{ article.pk }}/">Читать</a>

<!-- используем именованный маршрут -->
<a href="{% url 'article_detail' article.pk %}">Читать</a>

<!-- с пространством имен -->
<a href="{% url 'blog:article_detail' article.pk %}">Читать</a>
\`\`\`

## Почему это важно

1. **Поддерживаемость.** Изменили префикс URL в \`urls.py\` — все ссылки в проекте автоматически обновились, ничего не нужно менять в шаблонах или views.
2. **Меньше ошибок.** Опечатка в хардкоженном URL заметна только в runtime (или вообще не заметна, если такой страницы просто не существует). Ошибка в имени маршрута для \`reverse()\`/\`{% url %}\` выбросит понятное исключение \`NoReverseMatch\` сразу.
3. **DRY.** Структура маршрутов описана в одном месте (\`urls.py\`), а не размазана по всему проекту в виде строковых литералов.

**Правило:** в идиоматичном Django-коде URL-адреса почти никогда не пишутся как строки напрямую — только через имена маршрутов.`,
  },
  {
    id: "django-middleware-what-and-when",
    question:
      "Что такое Middleware в Django и на каком этапе обработки запроса/ответа он срабатывает?",
    category: "Представления (Views) и маршрутизация (URLs)",
    difficulty: "junior",
    answer: `## Что такое Middleware

**Middleware** — это компонент, который обрабатывает **каждый** входящий HTTP-запрос и/или исходящий ответ **до** или **после** того, как он попадет в конкретное представление (view). Middleware организованы в виде цепочки (списка) — запрос проходит через них последовательно "туда", доходит до view, а ответ проходит через них же в обратном порядке "обратно".

\`\`\`python
# settings.py
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]
\`\`\`

## Схема прохождения запроса

\`\`\`
Запрос →  SecurityMiddleware
       →  SessionMiddleware
       →  CommonMiddleware
       →  CsrfViewMiddleware
       →  AuthenticationMiddleware
       →  MessageMiddleware
       →  [ View ]
Ответ  ←  MessageMiddleware
       ←  AuthenticationMiddleware
       ←  CsrfViewMiddleware
       ←  CommonMiddleware
       ←  SessionMiddleware
       ←  SecurityMiddleware
\`\`\`

То есть каждый middleware может что-то сделать **и** с запросом (до вызова следующего в цепочке), **и** с ответом (после того, как он получен от следующего в цепочке).

## Типичные задачи middleware

- **AuthenticationMiddleware** — определяет текущего пользователя и добавляет \`request.user\`.
- **SessionMiddleware** — подключает механизм сессий, добавляет \`request.session\`.
- **CsrfViewMiddleware** — проверяет CSRF-токен для защиты от межсайтовой подделки запроса.
- **SecurityMiddleware** — добавляет заголовки безопасности (HSTS, X-Content-Type-Options и т.д.).
- Кастомные middleware — логирование запросов, замер времени выполнения, добавление кастомных заголовков, блокировка запросов по IP и т.д.

## Как выглядит собственный middleware

\`\`\`python
# myapp/middleware.py
import time

class TimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response   # следующий шаг в цепочке (следующий middleware или view)

    def __call__(self, request):
        start = time.time()

        response = self.get_response(request)   # тут запрос идет дальше по цепочке к view

        duration = time.time() - start
        response["X-Response-Time"] = f"{duration:.3f}s"
        return response
\`\`\`

\`\`\`python
# settings.py
MIDDLEWARE = [
    # ...
    "myapp.middleware.TimingMiddleware",
]
\`\`\`

## Ключевая мысль

Middleware работает **глобально для всех запросов**, в отличие от логики внутри конкретной view, которая срабатывает только для своего маршрута. Это идеальное место для сквозной (cross-cutting) логики: аутентификации, логирования, обработки ошибок, модификации заголовков — того, что нужно применить одинаково ко всему приложению, а не к отдельной странице.`,
  },
  {
    id: "django-template-inheritance-extends-block",
    question:
      "Как работает механизм наследования шаблонов в Django? (Для чего нужны теги {% extends %} и {% block %}).",
    category: "Шаблоны (Templates)",
    difficulty: "junior",
    answer: `## Проблема без наследования

Без наследования шаблонов каждая HTML-страница должна была бы полностью повторять общую разметку (шапку сайта, меню, подвал) — это нарушает принцип DRY и делает поддержку крайне неудобной: изменение меню потребовало бы правки во всех файлах.

## Базовый шаблон и {% block %}

Решение — создать один "родительский" (базовый) шаблон с общей структурой страницы, а в нем разметить **блоки** — именованные области, которые дочерние шаблоны могут переопределить.

\`\`\`html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{% block title %}Мой сайт{% endblock %}</title>
</head>
<body>
  <header>Шапка сайта (одинаковая везде)</header>

  <main>
    {% block content %}
    {% endblock %}
  </main>

  <footer>© 2026</footer>
</body>
</html>
\`\`\`

## {% extends %} — наследование в дочернем шаблоне

Дочерний шаблон объявляет, что наследуется от базового, и переопределяет только нужные блоки.

\`\`\`html
<!-- templates/articles/detail.html -->
{% extends "base.html" %}

{% block title %}{{ article.title }}{% endblock %}

{% block content %}
  <h1>{{ article.title }}</h1>
  <p>{{ article.body }}</p>
{% endblock %}
\`\`\`

Тег \`{% extends %}\` **обязательно должен быть первой строкой** шаблона. Все, что находится вне блоков в дочернем шаблоне (кроме extends), Django просто проигнорирует — итоговая страница строится по структуре родительского шаблона, куда "вставляются" содержимое переопределенных блоков.

## Итоговый результат

При рендеринге \`articles/detail.html\` Django:
1. Берет структуру \`base.html\`.
2. Находит блок \`title\` и \`content\` в дочернем шаблоне.
3. Подставляет их содержимое в соответствующие места базового шаблона.
4. Шапка и подвал остаются неизменными — они не переопределены.

## Многоуровневое наследование

Наследование может быть многоуровневым: например, \`base.html\` → \`base_with_sidebar.html\` → \`articles/detail.html\`, где каждый уровень добавляет свою структуру, а конкретная страница переопределяет лишь самые специфичные блоки.

## {{ block.super }}

Если нужно не полностью заменить содержимое блока, а **дополнить** родительское содержимое, используется \`{{ block.super }}\`:

\`\`\`html
{% block content %}
  {{ block.super }}
  <p>Дополнительный текст после родительского контента</p>
{% endblock %}
\`\`\``,
  },
  {
    id: "django-template-tags-vs-filters",
    question:
      "В чем разница между шаблонными тегами (tags) и шаблонными фильтрами (filters)?",
    category: "Шаблоны (Templates)",
    difficulty: "junior",
    answer: `## Шаблонные фильтры (filters)

**Фильтр** — это способ **преобразовать значение переменной** перед выводом. Синтаксис — символ \`|\` после переменной, возможен один аргумент через \`:\`.

\`\`\`html
{{ article.title|upper }}                  <!-- переводит в верхний регистр -->
{{ article.body|truncatewords:30 }}         <!-- обрезает до 30 слов -->
{{ article.created_at|date:"d.m.Y" }}       <!-- форматирует дату -->
{{ value|default:"Нет данных" }}            <!-- значение по умолчанию, если value пусто/falsy -->
{{ articles|length }}                        <!-- длина списка -->
{{ user_bio|linebreaks }}                    <!-- превращает переносы строк в <p>/<br> -->
\`\`\`

Фильтры можно **комбинировать** (цепочкой):

\`\`\`html
{{ article.title|lower|truncatechars:20 }}
\`\`\`

## Шаблонные теги (tags)

**Тег** — это конструкция для управления **логикой отображения**: циклы, условия, подключение других шаблонов, работа с URL и т.д. Синтаксис — \`{% ... %}\`, некоторые теги парные (открывающий/закрывающий), некоторые одиночные.

\`\`\`html
{% if article.published %}
  <span class="badge">Опубликовано</span>
{% else %}
  <span class="badge">Черновик</span>
{% endif %}

{% for article in articles %}
  <li>{{ article.title }}</li>
{% empty %}
  <li>Статей нет</li>
{% endfor %}

{% extends "base.html" %}
{% block content %}...{% endblock %}
{% include "partials/header.html" %}
{% url "article_detail" article.pk %}
{% csrf_token %}
\`\`\`

## Ключевое различие

| | Фильтры | Теги |
|---|---|---|
| Синтаксис | \`{{ value\\|filter }}\` | \`{% tag %}\` |
| Назначение | Преобразование/форматирование значения | Управление логикой шаблона (циклы, условия, наследование, подключение) |
| Аргументы | Максимум один, через \`:\` | Могут принимать несколько аргументов |
| Пример | \`{{ price\\|floatformat:2 }}\` | \`{% for x in list %}\` |

**Мнемоника:** фильтр — это "функция", применяемая к значению для его изменения перед выводом; тег — это "оператор" шаблонного языка, управляющий тем, что и как вообще будет отображено.

## Собственные фильтры и теги

Django позволяет создавать свои фильтры и теги через \`templatetags\`:

\`\`\`python
# myapp/templatetags/my_filters.py
from django import template

register = template.Library()

@register.filter
def shout(value):
    return f"{value.upper()}!"
\`\`\`

\`\`\`html
{% load my_filters %}
{{ article.title|shout }}
\`\`\``,
  },
  {
    id: "django-passing-context-to-template",
    question:
      "Как передать переменные (контекст) из Python-кода (view) в HTML-шаблон?",
    category: "Шаблоны (Templates)",
    difficulty: "junior",
    answer: `## Контекст — это словарь

Данные передаются из view в шаблон через **контекст** — обычный Python-словарь, где ключ становится именем переменной, доступной в шаблоне.

## Function-Based View

\`\`\`python
from django.shortcuts import render

def article_detail(request, pk):
    article = get_object_or_404(Article, pk=pk)
    related = Article.objects.filter(category=article.category).exclude(pk=pk)[:5]

    context = {
        "article": article,
        "related_articles": related,
        "page_title": f"Статья: {article.title}",
    }
    return render(request, "articles/detail.html", context)
\`\`\`

Функция \`render()\` — это удобная обертка, которая сама берет шаблон, рендерит его с переданным контекстом и оборачивает результат в \`HttpResponse\`. Без нее пришлось бы делать это вручную через \`loader.get_template()\` и \`.render()\`.

## Использование в шаблоне

\`\`\`html
<!-- articles/detail.html -->
<title>{{ page_title }}</title>

<h1>{{ article.title }}</h1>
<p>{{ article.body }}</p>

<h2>Похожие статьи</h2>
<ul>
{% for related in related_articles %}
  <li>{{ related.title }}</li>
{% endfor %}
</ul>
\`\`\`

Обратите внимание: \`{{ article.title }}\` — точечная нотация в шаблонах работает и для атрибутов объекта, и для ключей словаря, и для методов без аргументов (Django сам определяет, что имелось в виду).

## Class-Based View

В generic CBV (например, \`DetailView\`, \`ListView\`) контекст формируется автоматически (например, \`object\` или \`article_list\`), но можно расширить его, переопределив \`get_context_data()\`:

\`\`\`python
from django.views.generic import DetailView

class ArticleDetailView(DetailView):
    model = Article
    context_object_name = "article"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["related_articles"] = Article.objects.filter(
            category=self.object.category
        ).exclude(pk=self.object.pk)[:5]
        return context
\`\`\`

## Контекстные процессоры — глобальный контекст

Некоторые переменные (например, текущий пользователь \`request.user\`, флаги из настроек) нужны почти во всех шаблонах сразу. Вместо того чтобы передавать их в каждой view вручную, используются **контекстные процессоры** (\`context_processors\` в \`TEMPLATES\`), которые автоматически добавляют переменные в контекст каждого рендеринга:

\`\`\`python
# settings.py — стандартные контекстные процессоры Django
"context_processors": [
    "django.template.context_processors.request",
    "django.contrib.auth.context_processors.auth",   # добавляет user
    "django.contrib.messages.context_processors.messages",
]
\`\`\`

Именно поэтому \`{{ user }}\` доступен в любом шаблоне без явной передачи из каждой view.`,
  },
  {
    id: "django-forms-form-vs-modelform",
    question: "В чем разница между классами forms.Form и forms.ModelForm?",
    category: "Формы и валидация",
    difficulty: "junior",
    answer: `## forms.Form

Базовый класс для создания форм **вручную**, без привязки к конкретной модели. Все поля описываются явно, и после успешной валидации данные доступны как обычный словарь \`cleaned_data\` — сохранять их в базу (если нужно) приходится самостоятельно.

\`\`\`python
from django import forms

class ContactForm(forms.Form):
    name = forms.CharField(max_length=100)
    email = forms.EmailField()
    message = forms.CharField(widget=forms.Textarea)
\`\`\`

\`\`\`python
def contact_view(request):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data["name"]
            email = form.cleaned_data["email"]
            # дальше вручную решаем, что делать с данными
            # (например, отправить письмо, а не сохранить в БД)
            send_mail(...)
    else:
        form = ContactForm()
    return render(request, "contact.html", {"form": form})
\`\`\`

Используется, когда форма **не соответствует напрямую одной модели** — например, форма обратной связи, форма поиска, форма логина.

## forms.ModelForm

Специализированный класс, который **автоматически генерирует поля формы на основе полей модели**, а также умеет создавать и обновлять объект модели напрямую через метод \`save()\`.

\`\`\`python
from django import forms
from .models import Article

class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ["title", "body", "category", "published"]
\`\`\`

\`\`\`python
def create_article(request):
    if request.method == "POST":
        form = ArticleForm(request.POST)
        if form.is_valid():
            article = form.save()          # создает и сохраняет объект Article в БД
            return redirect("article_detail", pk=article.pk)
    else:
        form = ArticleForm()
    return render(request, "articles/form.html", {"form": form})

def edit_article(request, pk):
    article = get_object_or_404(Article, pk=pk)
    if request.method == "POST":
        form = ArticleForm(request.POST, instance=article)   # редактирование существующего объекта
        if form.is_valid():
            form.save()
            return redirect("article_detail", pk=article.pk)
    else:
        form = ArticleForm(instance=article)
    return render(request, "articles/form.html", {"form": form})
\`\`\`

## Ключевые отличия

| | forms.Form | forms.ModelForm |
|---|---|---|
| Поля | Определяются вручную | Генерируются из полей модели (через \`Meta.fields\`) |
| Сохранение в БД | Реализуется программистом самостоятельно | Встроенный метод \`save()\` создает/обновляет объект |
| Валидация уникальности/связей модели | Нужно писать самостоятельно | Работает автоматически (например, \`unique=True\` на поле модели) |
| Типичное применение | Формы, не связанные с одной моделью напрямую | CRUD-формы для создания/редактирования объектов модели |

**Итог:** \`ModelForm\` — это, по сути, \`Form\`, "заточенная" под работу с конкретной моделью, экономящая много шаблонного кода при типовых CRUD-операциях.`,
  },
  {
    id: "django-form-validation-clean-methods",
    question:
      "Как происходит процесс валидации данных в формах Django? (Как использовать методы clean() и clean_<fieldname>()).",
    category: "Формы и валидация",
    difficulty: "junior",
    answer: `## Общий процесс валидации

Валидация запускается вызовом \`form.is_valid()\`, который выполняет несколько этапов по порядку:

1. **Валидация на уровне поля** — каждое поле проверяет тип и базовые правила (например, \`EmailField\` проверяет формат email, \`CharField(max_length=100)\` проверяет длину, \`required=True\` проверяет, что поле не пустое).
2. **Метод \`clean_<fieldname>()\`** — если определен, вызывается после базовой валидации конкретного поля для дополнительной, специфичной для этого поля проверки.
3. **Метод \`clean()\`** — вызывается в конце, когда все отдельные поля уже проверены; используется для валидации, зависящей **от нескольких полей одновременно**.

Если валидация проходит успешно, результат доступен в \`form.cleaned_data\` — словаре с очищенными и приведенными к правильному типу значениями.

## clean_<fieldname>() — валидация одного поля

\`\`\`python
from django import forms

class RegistrationForm(forms.Form):
    username = forms.CharField(max_length=30)
    age = forms.IntegerField()

    def clean_username(self):
        username = self.cleaned_data["username"]
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("Это имя пользователя уже занято")
        return username   # обязательно вернуть значение (даже если не изменяли)

    def clean_age(self):
        age = self.cleaned_data["age"]
        if age < 18:
            raise forms.ValidationError("Регистрация доступна только с 18 лет")
        return age
\`\`\`

Важно: метод обязательно должен **вернуть значение**, которое затем попадет (или останется) в \`cleaned_data\` — если забыть \`return\`, поле пропадет из \`cleaned_data\`.

## clean() — валидация, зависящая от нескольких полей

\`\`\`python
class DateRangeForm(forms.Form):
    start_date = forms.DateField()
    end_date = forms.DateField()

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise forms.ValidationError(
                "Дата начала не может быть позже даты окончания"
            )
        return cleaned_data
\`\`\`

Обратите внимание на \`super().clean()\` в начале и \`return cleaned_data\` в конце — это обязательный паттерн.

## Привязка ошибки к конкретному полю в clean()

Иногда ошибку из \`clean()\` нужно показать не как общую ошибку формы, а рядом с конкретным полем — для этого используется \`self.add_error()\`:

\`\`\`python
def clean(self):
    cleaned_data = super().clean()
    start_date = cleaned_data.get("start_date")
    end_date = cleaned_data.get("end_date")
    if start_date and end_date and start_date > end_date:
        self.add_error("end_date", "Дата окончания должна быть позже даты начала")
    return cleaned_data
\`\`\`

## Порядок выполнения — итог

\`\`\`
is_valid()
  → для каждого поля: встроенная валидация типа/правил поля
  → для каждого поля: clean_<fieldname>() (если определен)
  → clean() — финальная проверка на уровне всей формы
  → form.cleaned_data готов, form.errors пуст (если все ок)
\`\`\`

Если на любом этапе выбрасывается \`ValidationError\`, \`is_valid()\` вернет \`False\`, а текст ошибки попадет в \`form.errors\`.`,
  },
  {
    id: "django-csrf-protection-and-csrf-token-tag",
    question:
      "Что такое CSRF-атака и как Django защищает от нее POST-запросы? Зачем нужен тег {% csrf_token %}?",
    category: "Формы и валидация",
    difficulty: "junior",
    answer: `## Что такое CSRF-атака

**CSRF (Cross-Site Request Forgery)** — межсайтовая подделка запроса. Суть атаки: пользователь авторизован на сайте A (например, в интернет-банке), после чего заходит на вредоносный сайт B. Сайт B незаметно отправляет запрос на сайт A (например, форму перевода денег) от имени пользователя — браузер автоматически прикрепит к этому запросу куки авторизации сайта A, и сервер, не зная о подделке, выполнит действие, как будто его запросил сам пользователь.

\`\`\`html
<!-- вредоносная страница на сайте B -->
<form action="https://bank.example.com/transfer/" method="POST">
  <input type="hidden" name="amount" value="10000">
  <input type="hidden" name="to" value="attacker_account">
</form>
<script>document.forms[0].submit();</script>   <!-- отправляется автоматически -->
\`\`\`

## Как Django защищается

Django встроенно защищен от CSRF через **CSRF-токен** — уникальное секретное значение, которое:
1. Django генерирует и сохраняет (в cookie и/или сессии).
2. Требует, чтобы каждый POST/PUT/PATCH/DELETE-запрос (по умолчанию GET не проверяется, так как считается безопасным методом) включал этот токен в данные запроса.
3. Проверяет через \`CsrfViewMiddleware\`, что токен из запроса совпадает с ожидаемым.

Поскольку вредоносный сайт B **не может узнать** секретный CSRF-токен пользователя на сайте A (токен недоступен через межсайтовые запросы из-за политик браузера — same-origin policy), подделанный запрос не пройдет проверку и Django вернет ошибку **403 Forbidden**.

## {% csrf_token %} в шаблонах

Тег вставляет скрытое поле с текущим CSRF-токеном внутрь HTML-формы — без этого поля отправка формы методом POST будет отклонена.

\`\`\`html
<form method="POST" action="{% url 'article_create' %}">
  {% csrf_token %}
  <input type="text" name="title">
  <button type="submit">Сохранить</button>
</form>
\`\`\`

Это раскрывается примерно в:

\`\`\`html
<input type="hidden" name="csrfmiddlewaretoken" value="XyZ123...">
\`\`\`

## Что происходит без csrf_token

\`\`\`
Forbidden (403)
CSRF verification failed. Request aborted.
\`\`\`

Django намеренно возвращает 403, если POST-запрос пришел без валидного токена — это защищает даже разработчика, который забыл добавить тег, от случайной уязвимости.

## Для AJAX/API-запросов

Если форма отправляется через JavaScript (fetch/AJAX), токен нужно передать вручную, например, в заголовке \`X-CSRFToken\`, прочитав его из cookie:

\`\`\`javascript
fetch("/articles/create/", {
  method: "POST",
  headers: { "X-CSRFToken": getCookie("csrftoken") },
  body: formData,
});
\`\`\`

**Важно:** для API, использующих аутентификацию по токену/сессии без cookie (например, Django REST Framework с TokenAuthentication), CSRF-защита обычно не требуется в том же виде, так как атака основана именно на автоматической отправке браузером cookie.`,
  },
  {
    id: "django-admin-register-model",
    question:
      "Как зарегистрировать свою модель, чтобы она появилась в административной панели Django?",
    category: "Панель администратора (Django Admin)",
    difficulty: "junior",
    answer: `## Базовая регистрация

Чтобы модель появилась в админ-панели, ее нужно зарегистрировать в файле \`admin.py\` соответствующего приложения. Django автоматически подключает файл \`admin.py\` каждого приложения из \`INSTALLED_APPS\`.

\`\`\`python
# blog/models.py
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    published = models.BooleanField(default=False)
\`\`\`

\`\`\`python
# blog/admin.py
from django.contrib import admin
from .models import Article

admin.site.register(Article)
\`\`\`

После этого модель \`Article\` появится в разделе админки, соответствующем приложению \`blog\`, с базовым интерфейсом для просмотра, создания, редактирования и удаления записей.

## Альтернативный синтаксис — декоратор

\`\`\`python
from django.contrib import admin
from .models import Article

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    pass
\`\`\`

Это эквивалентно \`admin.site.register(Article, ArticleAdmin)\`, но более идиоматично, когда сразу нужен класс \`ModelAdmin\` для настройки отображения.

## Обязательные предварительные условия

1. Приложение должно быть в \`INSTALLED_APPS\` (\`settings.py\`).
2. \`django.contrib.admin\` должен быть в \`INSTALLED_APPS\` (есть по умолчанию в новом проекте).
3. Должен существовать суперпользователь для входа в админку:

\`\`\`bash
python manage.py createsuperuser
\`\`\`

4. \`admin/\` должен быть подключен в корневом \`urls.py\` (есть по умолчанию):

\`\`\`python
# urls.py
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path("admin/", admin.site.urls),
]
\`\`\`

## Регистрация нескольких моделей сразу

\`\`\`python
from django.contrib import admin
from .models import Article, Category, Tag

admin.site.register([Category, Tag])   # без кастомизации

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "published"]
\`\`\`

После регистрации моделью можно управлять через веб-интерфейс по адресу \`/admin/\` без написания собственных представлений, шаблонов и форм — Django генерирует весь CRUD-интерфейс автоматически.`,
  },
  {
    id: "django-admin-list-display-search-filter",
    question:
      "Как настроить отображение полей модели в списке админки (например, использовать list_display, search_fields, list_filter)?",
    category: "Панель администратора (Django Admin)",
    difficulty: "junior",
    answer: `## Проблема стандартного отображения

Без настройки список объектов в админке показывает только результат \`__str__\` каждой записи — этого недостаточно для удобной работы с большим количеством данных. Настройка производится через класс \`ModelAdmin\`.

\`\`\`python
# blog/admin.py
from django.contrib import admin
from .models import Article

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "category", "published", "created_at"]
    list_filter = ["published", "category", "created_at"]
    search_fields = ["title", "body"]
    ordering = ["-created_at"]
    list_editable = ["published"]
    list_per_page = 25
\`\`\`

## list_display — какие колонки показывать в списке

Задает столбцы таблицы вместо единственной колонки с \`__str__\`.

\`\`\`python
list_display = ["title", "author", "published", "created_at"]
\`\`\`

Можно использовать не только имена полей, но и методы модели/класса \`ModelAdmin\`:

\`\`\`python
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "word_count"]

    def word_count(self, obj):
        return len(obj.body.split())
    word_count.short_description = "Слов в статье"
\`\`\`

## search_fields — поиск по тексту

Добавляет строку поиска над списком; поиск выполняется по указанным полям через \`icontains\`.

\`\`\`python
search_fields = ["title", "body", "author__username"]   # можно искать по связанным моделям через __
\`\`\`

## list_filter — боковая панель фильтров

Добавляет справа набор фильтров по значению указанных полей (особенно удобно для \`BooleanField\`, \`ForeignKey\`, \`DateField\`, полей с \`choices\`).

\`\`\`python
list_filter = ["published", "category"]
\`\`\`

## Другие полезные атрибуты ModelAdmin

\`\`\`python
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "published"]
    list_editable = ["published"]      # редактирование прямо из списка, без открытия записи
    ordering = ["-created_at"]         # сортировка списка по умолчанию
    list_per_page = 25                 # пагинация
    readonly_fields = ["created_at"]   # поля только для просмотра на странице редактирования
    fields = ["title", "author", "category", "body", "published"]  # порядок и набор полей на форме
    raw_id_fields = ["author"]         # удобнее для ForeignKey с большим количеством записей
    prepopulated_fields = {"slug": ("title",)}   # автозаполнение slug на основе title в JS
\`\`\`

## Итог

Комбинация \`list_display\`, \`search_fields\` и \`list_filter\` превращает стандартный автогенерируемый список объектов в удобный рабочий инструмент: можно быстро находить нужные записи, фильтровать по категориям/статусу и видеть ключевые атрибуты без открытия каждой записи отдельно.`,
  },
  {
    id: "django-static-vs-media-files",
    question:
      "В чем разница между статическими файлами (static) и медиа-файлами (media) в контексте Django?",
    category: "Статика, медиа и пользователи",
    difficulty: "junior",
    answer: `## Статические файлы (static)

**Статика** — это файлы, которые являются частью **самого приложения**: CSS, JavaScript, шрифты, иконки, изображения дизайна. Эти файлы создает и версионирует разработчик, они лежат в репозитории проекта и не меняются пользователями сайта.

\`\`\`python
# settings.py
STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]     # где Django ищет статику в разработке
STATIC_ROOT = BASE_DIR / "staticfiles"       # куда собираются все файлы для production
\`\`\`

\`\`\`html
<!-- в шаблоне -->
{% load static %}
<link rel="stylesheet" href="{% static 'css/style.css' %}">
<img src="{% static 'images/logo.png' %}">
\`\`\`

Перед деплоем в production статику нужно собрать в одну директорию командой:

\`\`\`bash
python manage.py collectstatic
\`\`\`

## Медиа-файлы (media)

**Медиа** — это файлы, которые **загружают пользователи** через приложение во время его работы: аватарки, фото товаров, вложения к сообщениям, документы. Эти файлы не хранятся в репозитории кода — они появляются динамически, во время работы сайта.

\`\`\`python
# settings.py
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
\`\`\`

\`\`\`python
# models.py
class Profile(models.Model):
    avatar = models.ImageField(upload_to="avatars/")   # файлы сохраняются в MEDIA_ROOT/avatars/
\`\`\`

\`\`\`html
<!-- в шаблоне -->
<img src="{{ profile.avatar.url }}">
\`\`\`

## Ключевые отличия

| | Static | Media |
|---|---|---|
| Кто создает | Разработчик (часть кода/дизайна) | Пользователи (загружают во время работы) |
| Хранится в git | Да, обычно да | Нет, добавляется в \`.gitignore\` |
| Примеры | CSS, JS, шрифты, дизайн-изображения | Аватарки, загруженные фото, документы |
| Настройка | \`STATIC_URL\`, \`STATIC_ROOT\`, \`STATICFILES_DIRS\` | \`MEDIA_URL\`, \`MEDIA_ROOT\` |
| Сборка перед деплоем | \`collectstatic\` | Не требуется (файлы появляются по мере загрузки) |

## Важный нюанс для разработки

Django сам по себе (\`runserver\`) отдает и статику, и медиа только в режиме \`DEBUG=True\`, и требует дополнительной настройки \`urls.py\`, чтобы отдавать медиа-файлы в разработке:

\`\`\`python
# urls.py (только для разработки!)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
\`\`\`

В production и статику, и медиа обычно отдает не сам Django, а веб-сервер (nginx) или облачное хранилище (S3 и аналоги) — Django-процесс не должен заниматься раздачей файлов под нагрузкой.`,
  },
  {
    id: "django-authentication-basics-is-authenticated",
    question:
      "Как в Django устроена базовая система аутентификации? Как проверить в шаблоне или представлении, авторизован ли текущий пользователь?",
    category: "Статика, медиа и пользователи",
    difficulty: "junior",
    answer: `## Встроенная система аутентификации

Django поставляется с готовым приложением \`django.contrib.auth\`, которое включает:
- Модель **\`User\`** — хранит username, пароль (хешированный), email, флаги \`is_active\`, \`is_staff\`, \`is_superuser\` и т.д.
- Функции для **login/logout/проверки пароля**.
- **\`AuthenticationMiddleware\`** — на каждом запросе определяет текущего пользователя и добавляет его в \`request.user\`.
- Готовые views и формы для логина, смены пароля, восстановления пароля.

\`\`\`python
# settings.py — обязательные компоненты для работы аутентификации
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",   # auth зависит от contenttypes
    # ...
]
MIDDLEWARE = [
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # ...
]
\`\`\`

## request.user — всегда доступен

Благодаря \`AuthenticationMiddleware\`, объект \`request.user\` доступен в любом представлении:

\`\`\`python
def my_view(request):
    if request.user.is_authenticated:
        print(f"Привет, {request.user.username}!")
    else:
        print("Анонимный пользователь")
\`\`\`

Если пользователь не авторизован, \`request.user\` — это не \`None\`, а специальный объект \`AnonymousUser\`, у которого \`is_authenticated\` всегда возвращает \`False\` — это позволяет писать \`if request.user.is_authenticated\`, не проверяя предварительно на \`None\`.

## Проверка в шаблоне

\`\`\`html
{% if user.is_authenticated %}
  <p>Привет, {{ user.username }}!</p>
  <a href="{% url 'logout' %}">Выйти</a>
{% else %}
  <a href="{% url 'login' %}">Войти</a>
{% endif %}
\`\`\`

Переменная \`user\` доступна в шаблоне автоматически благодаря контекстному процессору \`django.contrib.auth.context_processors.auth\` — передавать ее вручную из каждой view не нужно.

## Базовые операции: login / logout

\`\`\`python
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect, render

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)   # создает сессию для пользователя
            return redirect("home")
        else:
            return render(request, "login.html", {"error": "Неверные данные"})
    return render(request, "login.html")

def logout_view(request):
    logout(request)   # завершает сессию
    return redirect("home")
\`\`\`

## Ограничение доступа к view только авторизованным

\`\`\`python
from django.contrib.auth.decorators import login_required

@login_required   # неавторизованных перенаправит на LOGIN_URL
def dashboard(request):
    return render(request, "dashboard.html")
\`\`\`

Для class-based views используется миксин:

\`\`\`python
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"
\`\`\``,
  },
  {
    id: "django-n-plus-one-select-related-prefetch-related",
    question:
      "Как решить проблему N+1 запросов в Django ORM? В чем разница между методами select_related() и prefetch_related()?",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## Проблема N+1

Проблема **N+1 запросов** возникает, когда для получения списка из N объектов и связанных с каждым из них данных ORM выполняет 1 запрос для основного списка и еще N дополнительных запросов — по одному на каждый объект — вместо того, чтобы получить все данные за 1-2 запроса.

\`\`\`python
# 1 запрос: получить все статьи
articles = Article.objects.all()

for article in articles:
    # для каждой статьи — отдельный запрос к базе за автором!
    print(article.author.name)
# Итого: 1 + N запросов (N — количество статей)
\`\`\`

Это происходит из-за **ленивой загрузки**: обращение к \`article.author\` triggers отдельный SQL-запрос в момент первого доступа, если данные не были заранее подгружены.

## select_related() — для ForeignKey / OneToOneField

Выполняет **SQL JOIN** и получает связанные объекты **в том же запросе**. Подходит для связей "многие к одному" и "один к одному", где на каждую основную запись — не более одной связанной.

\`\`\`python
articles = Article.objects.select_related("author", "category")

for article in articles:
    print(article.author.name)      # без дополнительного запроса — данные уже в памяти
    print(article.category.name)    # тоже без доп. запроса
# Итого: 1 запрос с JOIN, независимо от количества статей
\`\`\`

## prefetch_related() — для ManyToManyField / обратного ForeignKey

Для связей "многие ко многим" и "один ко многим" JOIN неэффективен (дал бы дублирование строк основной таблицы). Вместо этого Django делает **отдельный дополнительный запрос** для связанных объектов и затем "склеивает" результаты в Python.

\`\`\`python
articles = Article.objects.prefetch_related("tags", "comments")

for article in articles:
    for tag in article.tags.all():        # без доп. запроса — уже подгружено
        print(tag.name)
# Итого: 2 запроса всего (1 для статей + 1 для всех тегов всех статей),
# независимо от количества статей
\`\`\`

## Ключевое различие

| | select_related | prefetch_related |
|---|---|---|
| Тип связи | ForeignKey, OneToOneField | ManyToManyField, обратный ForeignKey, GenericRelation |
| Механизм | SQL JOIN (1 запрос) | Отдельный запрос + склейка в Python (обычно 2 запроса) |
| Можно комбинировать? | Да, оба метода можно использовать вместе в одном QuerySet |

\`\`\`python
Article.objects.select_related("author").prefetch_related("tags", "comments__author")
\`\`\`

## Как обнаружить проблему N+1

- Логировать SQL-запросы (\`django-debug-toolbar\` в разработке показывает количество и содержание запросов на странице).
- Использовать \`django.db.connection.queries\` в тестах/консоли для подсчета запросов.
- Профилировать через \`assertNumQueries()\` в тестах Django, чтобы поймать регрессии.

\`\`\`python
from django.test import TestCase

class ArticleListTest(TestCase):
    def test_no_n_plus_one(self):
        with self.assertNumQueries(2):
            list(Article.objects.select_related("author").prefetch_related("tags"))
\`\`\``,
  },
  {
    id: "django-transactions-atomic",
    question:
      "Как работают транзакции в Django? Объясните принцип работы декоратора и контекстного менеджера transaction.atomic.",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## Транзакции в Django по умолчанию

По умолчанию (если явно не настроено иначе) Django работает в режиме **autocommit** — каждый отдельный SQL-запрос (например, каждый \`.save()\`) сразу коммитится в базу как собственная транзакция. Это удобно для простых операций, но опасно, когда несколько связанных изменений должны либо выполниться **все вместе**, либо **не выполниться вообще** (атомарность).

## transaction.atomic — гарантия атомарности

\`transaction.atomic\` оборачивает блок кода в транзакцию базы данных: если внутри блока произойдет необработанное исключение, **все изменения внутри блока откатятся (rollback)**, как будто их не было. Если исключений не было — все изменения коммитятся одновременно при выходе из блока.

### Как контекстный менеджер

\`\`\`python
from django.db import transaction

def transfer_money(from_account, to_account, amount):
    with transaction.atomic():
        from_account.balance -= amount
        from_account.save()

        to_account.balance += amount
        to_account.save()
        # если здесь возникнет ошибка — оба save() выше будут откачены
\`\`\`

### Как декоратор

\`\`\`python
@transaction.atomic
def transfer_money(from_account, to_account, amount):
    from_account.balance -= amount
    from_account.save()
    to_account.balance += amount
    to_account.save()
\`\`\`

## Вложенные atomic-блоки — savepoints

Блоки \`atomic\` можно вкладывать друг в друга. Внутренний блок создает **savepoint** — при ошибке именно во внутреннем блоке можно откатить только его, не откатывая внешнюю транзакцию целиком (если внешний код перехватит исключение).

\`\`\`python
with transaction.atomic():          # внешняя транзакция
    order.save()

    try:
        with transaction.atomic():  # savepoint
            apply_discount(order)   # если тут упадет ошибка...
    except DiscountError:
        pass                        # ...откатится только применение скидки,
                                     # order.save() выше останется в силе
\`\`\`

## Явный откат — transaction.set_rollback()

Иногда нужно откатить транзакцию **без** выбрасывания исключения (например, по бизнес-условию):

\`\`\`python
with transaction.atomic():
    order.save()
    if not is_valid(order):
        transaction.set_rollback(True)
        return
\`\`\`

## ATOMIC_REQUESTS — транзакция на весь запрос

В \`settings.py\` можно включить оборачивание **каждого HTTP-запроса** в единую транзакцию — если view выбросит необработанное исключение, все изменения за весь запрос откатятся:

\`\`\`python
DATABASES = {
    "default": {
        # ...
        "ATOMIC_REQUESTS": True,
    }
}
\`\`\`

Это удобно, но требует внимательности — при этом режиме внутренние \`atomic()\`-блоки нужны только там, где важна частичная фиксация (savepoints), поскольку внешняя транзакция уже гарантирована.

## Частая ошибка

Забыть, что исключение, пойманное **внутри** \`try/except\` без завершения транзакции правильно (или без явного \`set_rollback\`), может оставить транзакцию в "испорченном" состоянии (\`TransactionManagementError\`) — особенно если пойманное исключение было ошибкой самой базы данных (например, нарушение уникальности). В таких случаях правильнее ловить исключение **вне** блока \`atomic()\`, а не внутри него.`,
  },
  {
    id: "django-f-expressions",
    question:
      "Что такое F-выражения (F()) и в каких сценариях их использование критически важно?",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## Проблема без F()

Обычный способ изменить значение поля выглядит так:

\`\`\`python
product = Product.objects.get(id=1)
product.views += 1
product.save()
\`\`\`

Здесь Python **сначала читает** текущее значение \`views\` в память, увеличивает его в Python, а затем **записывает** новое значение обратно. Между чтением и записью проходит время — если в этот промежуток другой процесс/запрос тоже прочитает и изменит \`views\`, один из инкрементов "потеряется" (**race condition**, состояние гонки).

## Что такое F()

\`F()\` — это выражение, которое ссылается на значение поля **на уровне базы данных**, а не в Python. Операция выполняется целиком **внутри SQL-запроса**, атомарно, без промежуточного чтения в Python.

\`\`\`python
from django.db.models import F

Product.objects.filter(id=1).update(views=F("views") + 1)
\`\`\`

Это транслируется в SQL примерно так:

\`\`\`sql
UPDATE product SET views = views + 1 WHERE id = 1;
\`\`\`

База данных сама берет текущее значение и увеличивает его атомарно — никакой race condition, независимо от того, сколько параллельных запросов выполняют такую операцию одновременно.

## Когда F() критически важен

**1. Инкремент/декремент счетчиков при высокой конкурентности:**

\`\`\`python
Article.objects.filter(pk=article.pk).update(views=F("views") + 1)
Product.objects.filter(pk=product.pk).update(stock=F("stock") - quantity)
\`\`\`

**2. Сравнение двух полей одной и той же записи в фильтре:**

\`\`\`python
# Найти товары, где текущая цена ниже базовой (сравнение двух полей одной таблицы)
Product.objects.filter(price__lt=F("base_price"))
\`\`\`

Без \`F()\` такое сравнение вообще невозможно выразить через \`filter()\` — пришлось бы получать все объекты и сравнивать в Python (что неэффективно и небезопасно при параллельном изменении данных).

**3. Массовые обновления без выборки объектов в Python:**

\`\`\`python
# Увеличить цену всех товаров категории на 10%, не читая их в Python
Product.objects.filter(category=category).update(price=F("price") * 1.1)
\`\`\`

## F() и связанные поля

\`F()\` также работает со связанными полями через \`__\`:

\`\`\`python
Order.objects.filter(total__gt=F("customer__credit_limit"))
\`\`\`

## Важный нюанс

\`F()\`-выражения работают правильно именно в связке с \`.update()\` (массовое обновление на уровне SQL) или при повторном сохранении через \`.save()\` сразу после присвоения — но после \`.save()\` объект в Python **не содержит актуального значения** (там остается выражение \`F()\`), поэтому для получения нового значения объект нужно перечитать из базы (\`refresh_from_db()\`):

\`\`\`python
product.views = F("views") + 1
product.save()
product.refresh_from_db()   # теперь product.views содержит настоящее число
\`\`\``,
  },
  {
    id: "django-select-for-update-row-locking",
    question:
      "Как реализовать блокировку на уровне строк (Row-level locking) с помощью Django ORM для предотвращения состояния гонки (race conditions)? (Например, select_for_update).",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## Проблема

\`F()\`-выражения хорошо решают race condition для простых атомарных операций (инкремент, декремент). Но если логика сложнее — например, нужно **прочитать** значение, **проверить условие в Python** (не выражаемое в SQL) и только потом **записать** — F() не поможет, потому что между чтением и записью выполняется произвольный Python-код, а другой процесс может успеть изменить данные в этот промежуток.

\`\`\`python
# Опасно при параллельных запросах: между get() и save() другой процесс
# может тоже прочитать и изменить остаток товара
product = Product.objects.get(id=1)
if product.stock >= quantity:
    product.stock -= quantity
    product.save()
\`\`\`

## select_for_update() — блокировка строки

\`select_for_update()\` блокирует выбранные строки в базе данных на время транзакции — любой другой запрос, пытающийся получить блокировку на те же строки (через \`select_for_update()\`), будет **ждать**, пока первая транзакция не завершится (commit/rollback). Обязательно должен использоваться внутри \`transaction.atomic()\`.

\`\`\`python
from django.db import transaction

def purchase(product_id, quantity):
    with transaction.atomic():
        product = Product.objects.select_for_update().get(id=product_id)
        # начиная с этой строки и до конца транзакции строка заблокирована —
        # другой параллельный вызов purchase() для того же product_id будет ждать
        if product.stock < quantity:
            raise NotEnoughStockError()

        product.stock -= quantity
        product.save()
        # при коммите транзакции блокировка снимается
\`\`\`

## Как это выглядит в SQL

\`\`\`sql
BEGIN;
SELECT * FROM product WHERE id = 1 FOR UPDATE;
-- ... другой код ...
UPDATE product SET stock = stock - 1 WHERE id = 1;
COMMIT;
\`\`\`

## nowait и skip_locked

По умолчанию конкурирующие транзакции **ждут** освобождения блокировки. Иногда вместо ожидания нужно другое поведение:

\`\`\`python
# выбросить исключение сразу, если строка уже заблокирована, вместо ожидания
Product.objects.select_for_update(nowait=True).get(id=1)

# пропустить заблокированные строки при выборке нескольких объектов
# (полезно для очередей задач — несколько воркеров разбирают задания без конфликтов)
Task.objects.select_for_update(skip_locked=True).filter(status="pending")[:10]
\`\`\`

## select_for_update() vs F()

| | F() | select_for_update() |
|---|---|---|
| Подходит для | Простых атомарных операций (инкремент, сравнение полей) | Сложной логики с условиями, которые нельзя выразить одним SQL-выражением |
| Механизм | Атомарная SQL-операция без блокировки | Явная блокировка строки на время транзакции |
| Производительность | Выше (без ожидания) | Ниже при высокой конкурентности (конкурирующие запросы ждут) |
| Требует transaction.atomic()? | Не обязательно | Обязательно |

## Типичный пример использования

Классический сценарий — обработка заказов на ограниченный товар (например, билеты на мероприятие), где недопустимо продать больше единиц, чем есть в наличии, даже при одновременных покупках множеством пользователей.`,
  },
  {
    id: "django-aggregate-vs-annotate",
    question:
      "Как в ORM работают агрегация и аннотация (aggregate, annotate)? В чем их концептуальное отличие?",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## aggregate() — одно итоговое значение для всего QuerySet

\`aggregate()\` вычисляет агрегированное значение **по всему набору записей** и возвращает **словарь с одним результатом**, а не QuerySet.

\`\`\`python
from django.db.models import Avg, Count, Sum, Max, Min

Article.objects.aggregate(Avg("views"))
# {'views__avg': 342.5}

Article.objects.filter(published=True).aggregate(
    total=Count("id"),
    avg_views=Avg("views"),
    max_views=Max("views"),
)
# {'total': 120, 'avg_views': 342.5, 'max_views': 9820}
\`\`\`

Используется, когда нужна одна цифра для всей выборки: "сколько всего статей", "средний рейтинг товара", "суммарная выручка за месяц".

## annotate() — значение для каждого объекта в QuerySet

\`annotate()\` добавляет вычисляемое значение **к каждой строке результата отдельно**, сохраняя QuerySet (то есть результат — все та же коллекция объектов, но с дополнительным полем у каждого).

\`\`\`python
from django.db.models import Count

authors = Author.objects.annotate(articles_count=Count("article"))

for author in authors:
    print(author.name, author.articles_count)   # у каждого автора — свое число статей
\`\`\`

Используется, когда нужно посчитать что-то **для каждой записи**: "количество статей у каждого автора", "средний рейтинг каждого товара", "сумма заказов каждого клиента".

## Концептуальное отличие

| | aggregate() | annotate() |
|---|---|---|
| Возвращает | Один словарь с итоговым значением | QuerySet объектов, у каждого — дополнительное вычисленное поле |
| Уровень вычисления | По всей выборке целиком (обычно с \`GROUP BY\` по всей таблице или без него) | По каждой группе/объекту отдельно (\`GROUP BY\` по первичному ключу основной модели) |
| Аналогия с SQL | \`SELECT AVG(views) FROM article\` | \`SELECT author_id, COUNT(*) FROM article GROUP BY author_id\` |
| Типичный вопрос | "Сколько всего / в среднем?" | "Сколько у каждого?" |

## Комбинирование annotate() и aggregate()

Их можно использовать вместе — сначала посчитать что-то для каждой записи через \`annotate()\`, а затем агрегировать уже эти вычисленные значения через \`aggregate()\`:

\`\`\`python
# Средний "рейтинг активности" по всем авторам,
# где рейтинг каждого автора — количество его статей
from django.db.models import Avg, Count

Author.objects.annotate(articles_count=Count("article")).aggregate(
    avg_articles_per_author=Avg("articles_count")
)
\`\`\`

## Практический пример — топ авторов по количеству публикаций

\`\`\`python
top_authors = (
    Author.objects
    .annotate(published_count=Count("article", filter=Q(article__published=True)))
    .filter(published_count__gt=0)
    .order_by("-published_count")[:10]
)
\`\`\`

Здесь \`Count(... , filter=Q(...))\` — условная агрегация, считающая только статьи, соответствующие фильтру, без необходимости делать отдельный подзапрос.`,
  },
  {
    id: "django-custom-managers-get-queryset",
    question:
      "Что такое пользовательские менеджеры моделей (Custom Managers) и в каких случаях стоит переопределять метод get_queryset()?",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## Что такое менеджер модели

**Менеджер (Manager)** — это интерфейс, через который выполняются запросы к базе данных для модели. По умолчанию у каждой модели есть менеджер \`objects\` (\`Model.objects.all()\`, \`Model.objects.filter(...)\` и т.д.) — именно менеджер является точкой входа для построения QuerySet.

## Кастомный менеджер

Чтобы добавить многократно используемую логику запросов, создается собственный класс менеджера, наследуемый от \`models.Manager\`, и подключается к модели.

\`\`\`python
from django.db import models

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(published=True)

class Article(models.Model):
    title = models.CharField(max_length=200)
    published = models.BooleanField(default=False)

    objects = models.Manager()          # менеджер по умолчанию (все статьи)
    published_objects = PublishedManager()   # кастомный менеджер (только опубликованные)
\`\`\`

\`\`\`python
Article.objects.all()             # все статьи, включая неопубликованные
Article.published_objects.all()   # только опубликованные — фильтр применяется автоматически
\`\`\`

## Когда переопределять get_queryset()

**1. Часто повторяющийся фильтр во всем проекте.** Если условие "только опубликованные" (или "не удаленные", "активные" и т.п.) используется в десятках мест — логичнее вынести его в менеджер один раз, чем повторять \`filter(published=True)\` везде.

**2. Реализация мягкого удаления (soft delete).** Классический паттерн — вместо реального \`DELETE\` помечать запись как удаленную, а менеджер по умолчанию скрывает такие записи:

\`\`\`python
class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class Task(models.Model):
    is_deleted = models.BooleanField(default=False)

    objects = ActiveManager()             # по умолчанию скрывает удаленные
    all_objects = models.Manager()        # доступ ко всем, включая удаленные
\`\`\`

**3. Предзагрузка часто нужных связей.** Если для модели почти всегда нужны \`select_related\`/\`prefetch_related\`, это можно зашить в менеджер:

\`\`\`python
class ArticleManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("author").prefetch_related("tags")
\`\`\`

## Важный нюанс: первый менеджер — "менеджер по умолчанию"

Django использует **первый определенный в классе менеджер** как менеджер по умолчанию для внутренних механизмов (например, для \`related_manager\` при доступе через ForeignKey с обратной стороны, если не указано иное). Если переопределенный \`get_queryset()\` первого менеджера фильтрует записи (например, скрывает удаленные), это может неожиданно "спрятать" объекты в других частях фреймворка (например, в админке). Поэтому часто оставляют \`objects = models.Manager()\` без фильтрации первым, а кастомный — вторым с другим именем.

## Кастомный QuerySet вместо (или вместе с) менеджером

Более гибкий подход — определить методы в кастомном \`QuerySet\`, а не в менеджере, чтобы методы можно было **чейнить**:

\`\`\`python
class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(published=True)

    def by_author(self, author):
        return self.filter(author=author)

class Article(models.Model):
    objects = ArticleQuerySet.as_manager()

# теперь можно чейнить произвольно:
Article.objects.published().by_author(user)
\`\`\``,
  },
  {
    id: "django-migrations-internals-data-migration",
    question:
      "Как работают миграции под капотом? Как правильно написать кастомную миграцию данных (data migration), а не схемы?",
    category: "ORM и оптимизация баз данных",
    difficulty: "middle",
    answer: `## Как миграции работают под капотом

Каждый файл миграции — это класс \`Migration\`, содержащий:
- \`dependencies\` — список миграций (в том числе из других приложений), от которых зависит эта миграция; определяет порядок применения.
- \`operations\` — список **операций** (\`AddField\`, \`CreateModel\`, \`AlterField\`, \`RunPython\` и т.д.), которые Django выполняет последовательно.

При \`migrate\` Django:
1. Смотрит таблицу \`django_migrations\` в базе данных, чтобы понять, какие миграции уже применены.
2. Строит граф зависимостей всех миграций всех приложений.
3. Применяет неприменённые миграции в правильном порядке, для каждой выполняя ее \`operations\` (переводя их в SQL через backend-специфичный "schema editor" — отдельный для PostgreSQL, MySQL, SQLite и т.д.).
4. Записывает применённую миграцию в \`django_migrations\`.

\`\`\`python
# blog/migrations/0003_article_slug.py — пример со схемной операцией
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("blog", "0002_article_published")]

    operations = [
        migrations.AddField(
            model_name="article",
            name="slug",
            field=models.SlugField(max_length=200, default=""),
        ),
    ]
\`\`\`

## Миграции схемы vs миграции данных

- **Миграция схемы** — изменяет структуру таблиц (добавить/удалить поле, изменить тип, создать таблицу). Генерируется автоматически через \`makemigrations\`.
- **Миграция данных (data migration)** — изменяет **содержимое** существующих записей, а не структуру таблицы. Не генерируется автоматически — пишется вручную.

## Когда нужна миграция данных

Типичный сценарий: добавили новое поле \`slug\`, и теперь нужно заполнить его значениями на основе существующего поля \`title\` для всех уже существующих записей.

## Как написать data migration

\`\`\`bash
# создает пустой файл миграции без операций схемы
python manage.py makemigrations blog --empty --name populate_article_slugs
\`\`\`

\`\`\`python
# blog/migrations/0004_populate_article_slugs.py
from django.db import migrations
from django.utils.text import slugify

def populate_slugs(apps, schema_editor):
    # ВАЖНО: используем "историческую" модель через apps.get_model(),
    # а не импортируем реальную модель напрямую!
    Article = apps.get_model("blog", "Article")
    for article in Article.objects.all():
        article.slug = slugify(article.title)
        article.save(update_fields=["slug"])

def reverse_populate_slugs(apps, schema_editor):
    Article = apps.get_model("blog", "Article")
    Article.objects.update(slug="")

class Migration(migrations.Migration):
    dependencies = [("blog", "0003_article_slug")]

    operations = [
        migrations.RunPython(populate_slugs, reverse_populate_slugs),
    ]
\`\`\`

## Почему нужен apps.get_model(), а не прямой импорт модели

Реальный класс модели в \`models.py\` со временем меняется (поля добавляются/удаляются). Если миграция будет выполняться спустя месяцы, когда модель уже выглядит иначе, использование актуального класса модели может привести к ошибкам (например, обращение к полю, которого на момент этой миграции еще не было, или которое уже удалено). \`apps.get_model()\` возвращает **историческую версию модели**, соответствующую состоянию схемы именно на этот момент миграционной истории — только с полями, которые точно существуют на этом шаге.

## Обратимость (reverse function)

Второй аргумент \`RunPython\` — функция для отката миграции (\`migrate blog 0003\` откатит и выполнит \`reverse_populate_slugs\`). Если откат невозможен или не нужен, передают \`migrations.RunPython.noop\`:

\`\`\`python
migrations.RunPython(populate_slugs, migrations.RunPython.noop)
\`\`\`

## Порядок операций в реальном проекте

Типичный безопасный порядок при добавлении обязательного поля с данными на основе существующих:
1. Миграция схемы: добавить поле как **необязательное** (\`null=True\` или с \`default\`).
2. Миграция данных: заполнить значения для существующих записей.
3. (Опционально) Отдельная миграция схемы: сделать поле обязательным (\`null=False\`), если это было целью.

Это позволяет избежать блокировки/ошибки при применении миграции на таблице с уже существующими данными.`,
  },
  {
    id: "django-wsgi-request-response-cycle",
    question:
      "Как устроен жизненный цикл запроса/ответа (Request/Response Cycle) в Django на уровне WSGI?",
    category: "Архитектура и внутреннее устройство",
    difficulty: "middle",
    answer: `## WSGI — точка входа

**WSGI (Web Server Gateway Interface)** — стандартный интерфейс между веб-сервером (Gunicorn, uWSGI и т.д.) и Python-приложением. Django-проект содержит файл \`wsgi.py\`, экспортирующий callable-объект \`application\` — именно его вызывает WSGI-сервер на каждый входящий HTTP-запрос.

\`\`\`python
# myproject/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
application = get_wsgi_application()
\`\`\`

## Полный путь запроса

\`\`\`
1. Клиент → HTTP-запрос → WSGI-сервер (Gunicorn/uWSGI)
2. WSGI-сервер вызывает application(environ, start_response)
3. Django оборачивает environ (словарь CGI-переменных) в объект HttpRequest
4. Запрос проходит "туда" через цепочку MIDDLEWARE (по порядку сверху вниз)
5. URL Resolver (urls.py) сопоставляет request.path с нужным view по urlpatterns
6. Вызывается View — выполняет бизнес-логику, обращается к моделям/ORM
7. View возвращает объект HttpResponse (или подкласс)
8. Ответ проходит через цепочку MIDDLEWARE "обратно" (снизу вверх)
9. Django конвертирует HttpResponse обратно в формат, понятный WSGI
10. WSGI-сервер отправляет HTTP-ответ клиенту
\`\`\`

## Детали шага 2-3: environ → HttpRequest

WSGI передает запрос как обычный Python-словарь \`environ\` (метод, путь, заголовки, тело запроса и т.д. в "сыром" виде, по стандарту CGI). Django берет этот словарь и строит удобный объект \`HttpRequest\` с атрибутами \`.method\`, \`.GET\`, \`.POST\`, \`.headers\`, \`.body\` и т.д.

## Детали шага 4-8: middleware и URL resolver

Каждый компонент \`MIDDLEWARE\` в списке настроек оборачивает следующий — по сути, это цепочка вложенных вызовов (паттерн "matryoshka"/декоратор). Первый middleware в списке — самый внешний: он первым получает запрос и последним обрабатывает ответ.

\`\`\`
запрос →  MW1 → MW2 → MW3 → URL resolver → View
ответ  ←  MW1 ← MW2 ← MW3 ← ------------- ←  View
\`\`\`

URL resolver проходит по \`urlpatterns\` (включая вложенные через \`include()\`) сверху вниз и вызывает первую подошедшую по паттерну view.

## Детали шага 9: HttpResponse → WSGI response

Django берет \`HttpResponse\` (код статуса, заголовки, тело) и вызывает \`start_response()\` — функцию, переданную WSGI-сервером, — передавая туда статус и заголовки, а затем возвращает тело ответа как итерируемый объект байтов, как того требует спецификация WSGI.

## Синхронность WSGI

Важный нюанс: классический WSGI — **синхронный** протокол, он обрабатывает один запрос за раз на поток/процесс (параллелизм достигается за счет нескольких воркеров сервера, а не asyncio). Современный Django (начиная с 3.1+) поддерживает и **ASGI** — асинхронный аналог WSGI, необходимый для WebSocket, Server-Sent Events и async-представлений, но классический синхронный стек всех Django-приложений по умолчанию все еще строится на WSGI.

## Почему это важно понимать

Знание точного порядка прохождения запроса через middleware критично для отладки (например, почему \`AuthenticationMiddleware\` должен идти после \`SessionMiddleware\` — он использует сессию, чтобы определить пользователя) и для написания собственного middleware, которое должно корректно встроиться в эту цепочку.`,
  },
  {
    id: "django-signals-when-to-use-antipattern",
    question:
      "Расскажите о механизме сигналов (Signals) в Django. Когда их стоит использовать, а в каких случаях они считаются антипаттерном?",
    category: "Архитектура и внутреннее устройство",
    difficulty: "middle",
    answer: `## Что такое сигналы

**Сигналы (signals)** — это механизм, позволяющий определенным частям приложения оповещать другие части о произошедших событиях, не имея прямой связи (import) друг с другом. Django отправляет встроенные сигналы на ключевых этапах жизненного цикла — например, при сохранении объекта, перед удалением, при завершении обработки запроса.

## Основные встроенные сигналы

\`\`\`python
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete, m2m_changed
from django.core.signals import request_finished, request_started
\`\`\`

## Пример: создание профиля при регистрации пользователя

\`\`\`python
# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:   # только при создании, а не при каждом обновлении
        Profile.objects.create(user=instance)
\`\`\`

\`\`\`python
# apps.py — сигналы нужно подключить в методе ready()
from django.apps import AppConfig

class AccountsConfig(AppConfig):
    name = "accounts"

    def ready(self):
        import accounts.signals  # noqa: регистрирует обработчики
\`\`\`

## Когда сигналы уместны

- **Развязка модулей, которые не должны знать друг о друге напрямую.** Например, стороннее переиспользуемое приложение (пакет) отправляет сигнал, а конкретный проект подписывается на него, не модифицируя код самого пакета.
- **Логирование/аудит, не относящийся к основной бизнес-логике.** Например, запись в лог аудита при удалении важных объектов — эта логика концептуально "сбоку" от основной операции.
- **Инвалидация кэша** при изменении данных, если кэш-логика находится в отдельном, не связанном модуле.

## Почему сигналы часто считаются антипаттерном

**1. Скрытая логика (implicit behavior).** Код, вызывающий \`profile.save()\`, "не знает", что где-то в проекте это неявно запускает создание связанных объектов, отправку email или изменение других таблиц. Это усложняет чтение и отладку — логика "размазана" по проекту, а не находится в одном явном месте.

**2. Сложность тестирования.** Тесты, вызывающие \`.save()\`, неожиданно затрагивают побочные эффекты сигналов, которые тестировщик мог не ожидать — из-за этого тесты становятся более хрупкими и медленными (например, если сигнал отправляет реальное письмо).

**3. Проблемы с bulk-операциями.** Сигналы \`pre_save\`/\`post_save\` **не вызываются** при массовых операциях типа \`QuerySet.update()\` или \`bulk_create()\` — это частый источник багов, когда логика, завязанная на сигнал, "магически" перестает срабатывать при переходе на bulk-операции для оптимизации.

**4. Порядок выполнения и обработка ошибок сложнее контролировать.** Несколько обработчиков одного сигнала могут выполняться в непредсказуемом порядке; исключение в одном обработчике может неожиданно повлиять на всю операцию сохранения.

## Более явная альтернатива

Вместо сигнала для логики, тесно связанной с бизнес-процессом (не "сбоку", а часть самого действия), предпочтительнее явный вызов — например, переопределить \`save()\` модели или, что еще лучше, вынести создание связанных объектов в явный сервисный слой/менеджер:

\`\`\`python
# явно и читаемо — вместо сигнала
class UserService:
    @staticmethod
    def register(username, email, password):
        user = User.objects.create_user(username=username, email=email, password=password)
        Profile.objects.create(user=user)   # явно видно в одном месте
        send_welcome_email(user)
        return user
\`\`\`

## Практическое правило

Сигналы хороши для по-настоящему "поперечной" (cross-cutting), опциональной логики между независимыми приложениями. Если логика — это часть основного бизнес-процесса и всегда должна выполняться вместе с определенным действием, ее лучше делать явной (в методе, сервисе или переопределенном \`save()\`), а не прятать в сигнал.`,
  },
  {
    id: "django-custom-user-model-why-early",
    question:
      "Как реализовать кастомную модель пользователя (Custom User Model) и почему официальная документация настоятельно рекомендует делать это в самом начале проекта?",
    category: "Архитектура и внутреннее устройство",
    difficulty: "middle",
    answer: `## Зачем нужна кастомная модель пользователя

Встроенная модель \`django.contrib.auth.models.User\` жестко фиксирована: нельзя добавить свои поля (например, номер телефона, дату рождения, роль), нельзя сменить поле для логина (например, использовать email вместо username) без замены всей модели.

## Способ 1: AUTH_USER_MODEL = наследник AbstractUser

Подходит, если устраивает стандартный набор полей (username, email, password, first_name, last_name и т.д.), но нужно **добавить** новые поля.

\`\`\`python
# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
\`\`\`

\`\`\`python
# settings.py
AUTH_USER_MODEL = "accounts.User"
\`\`\`

## Способ 2: наследник AbstractBaseUser

Подходит для полной переработки схемы аутентификации — например, полностью убрать поле \`username\` и логиниться только по email. Требует также написать собственный \`UserManager\`.

\`\`\`python
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email обязателен")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"     # поле, используемое для логина
    REQUIRED_FIELDS = []         # дополнительные обязательные поля при createsuperuser
\`\`\`

## Почему это нужно сделать в самом начале проекта

**Ключевая причина:** модель \`User\` — это не изолированная таблица, на нее ссылается огромное количество других таблиц через \`ForeignKey\`, в том числе неявно — через встроенные приложения Django (\`admin\`, \`auth.Permission\`, \`sessions\` и любые приложения проекта, использующие \`ForeignKey(User, ...)\` или \`settings.AUTH_USER_MODEL\`).

Как только Django генерирует **первую миграцию**, которая создает таблицу с внешним ключом на \`auth.User\`, эта связь фиксируется в истории миграций на уровне конкретной таблицы (\`auth_user\`). Замена \`AUTH_USER_MODEL\` **после** этого момента означает:
1. Нужно переписать все существующие миграции, ссылающиеся на старую таблицу пользователей.
2. Нужно вручную мигрировать все существующие данные (пользователей, их связи с другими таблицами) в новую таблицу.
3. Высокий риск потери данных или несогласованности внешних ключей, особенно в production с реальными пользователями.

Официальная документация Django прямо предупреждает: **"Changing AUTH_USER_MODEL after you've created database tables is significantly more difficult"** — потому что затрагивает всю схему БД, а не только одно приложение.

## Практический вывод

Даже если на старте кажется, что стандартной модели \`User\` достаточно, в реальных проектах рекомендуется **всегда** с первого дня создавать собственную модель через \`AbstractUser\` (даже без дополнительных полей на старте) — это не требует дополнительных усилий сейчас, но полностью исключает крайне болезненную миграцию в будущем, когда потребность в кастомизации неизбежно появится.`,
  },
  {
    id: "django-custom-middleware-process-methods-order",
    question:
      "Напишите (устно) структуру кастомного Middleware. В каком порядке выполняются методы process_request, process_view, process_exception и process_response при входящем и исходящем потоке?",
    category: "Архитектура и внутреннее устройство",
    difficulty: "middle",
    answer: `## Современный стиль middleware (Django 1.10+)

Начиная с Django 1.10, middleware пишется как один класс с \`__init__\` и \`__call__\`, а не набором отдельных методов — но старый стиль с \`process_request\`/\`process_view\`/\`process_exception\`/\`process_response\` по-прежнему поддерживается (как дополнительные "хуки" внутри нового стиля) и часто встречается на собеседованиях, так как хорошо иллюстрирует, из каких этапов состоит обработка запроса.

\`\`\`python
class CustomMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response   # вызывается один раз при старте сервера

    def __call__(self, request):
        # === код ДО view — аналог process_request ===
        response = self.get_response(request)   # передает управление дальше по цепочке
        # === код ПОСЛЕ view — аналог process_response ===
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        # вызывается непосредственно ПЕРЕД вызовом view,
        # уже после того, как URL resolver определил, какая view будет вызвана
        return None   # None — продолжить обычный поток; можно вернуть HttpResponse, чтобы прервать

    def process_exception(self, request, exception):
        # вызывается, если view выбросила необработанное исключение
        return None   # None — передать исключение дальше; можно вернуть HttpResponse для обработки

    def process_template_response(self, request, response):
        # вызывается, если ответ имеет метод .render() (TemplateResponse)
        return response
\`\`\`

## Порядок выполнения для нескольких middleware

Допустим, в \`MIDDLEWARE\` указаны \`M1\`, \`M2\`, \`M3\` (сверху вниз в списке настроек).

### Входящий поток (request) — сверху вниз

\`\`\`
M1.__call__ (код до get_response)
  → M2.__call__ (код до get_response)
    → M3.__call__ (код до get_response)
      → process_view: M1 → M2 → M3 (в том же порядке, что и в списке)
        → View выполняется
\`\`\`

### Исходящий поток (response) — снизу вверх

\`\`\`
        ← View вернула HttpResponse
      ← M3.__call__ (код после get_response)
    ← M2.__call__ (код после get_response)
  ← M1.__call__ (код после get_response)
\`\`\`

## process_exception — обратный порядок, снизу вверх

Если view выбросит необработанное исключение, \`process_exception\` вызывается у middleware **в обратном порядке** (от ближайшего к view — к самому внешнему):

\`\`\`
View выбрасывает исключение
  → M3.process_exception
  → M2.process_exception
  → M1.process_exception
\`\`\`

Если какой-либо \`process_exception\` вернет \`HttpResponse\` — обработка исключения прекращается, и этот ответ начинает проходить через \`__call__\` (после get_response) оставшихся middleware как обычный исходящий ответ.

## Полная картина на примере трех middleware

\`\`\`
Запрос
  → M1 (до)
    → M2 (до)
      → M3 (до)
        → process_view: M1, M2, M3
          → VIEW
          (если исключение: process_exception в порядке M3, M2, M1)
        ← ответ от view
      ← M3 (после)
    ← M2 (после)
  ← M1 (после)
Ответ клиенту
\`\`\`

## Практический вывод

Middleware, стоящий **первым** в списке \`MIDDLEWARE\`, оборачивает все остальные — он первым видит запрос и последним обрабатывает ответ (как самый внешний слой "матрешки"). Это важно учитывать при определении порядка: например, \`SecurityMiddleware\` должен быть одним из первых, чтобы применять security-заголовки ко всем ответам, включая те, что сгенерированы другими middleware.`,
  },
  {
    id: "django-settings-per-environment",
    question:
      "Какие подходы вы используете для разделения и управления настройками (settings) для разных окружений (local, test, staging, production)?",
    category: "Архитектура и внутреннее устройство",
    difficulty: "middle",
    answer: `## Проблема одного settings.py

По умолчанию Django-проект создается с единственным файлом \`settings.py\`. На практике конфигурация неизбежно различается между окружениями: локальная база данных vs production PostgreSQL, \`DEBUG=True\` vs \`False\`, разные ключи API, включенный/выключенный django-debug-toolbar и т.д. Хранить все в одном файле с ветвлением \`if os.environ.get("ENV") == "production":\` быстро становится нечитаемым.

## Подход 1: пакет settings с базовым файлом и наследованием

Самый распространенный подход — превратить \`settings.py\` в пакет с несколькими файлами, где окруженческие файлы наследуют общий базовый.

\`\`\`
myproject/
  settings/
    __init__.py
    base.py        # общие настройки для всех окружений
    local.py        # для локальной разработки
    test.py          # для запуска тестов
    staging.py
    production.py
\`\`\`

\`\`\`python
# settings/base.py
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    # ...
]
MIDDLEWARE = [...]
TEMPLATES = [...]
\`\`\`

\`\`\`python
# settings/local.py
from .base import *   # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]
\`\`\`

\`\`\`python
# settings/production.py
from .base import *   # noqa
import os

DEBUG = False
ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["DB_NAME"],
        "USER": os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.environ["DB_HOST"],
    }
}

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
\`\`\`

Выбор нужного файла — через переменную окружения \`DJANGO_SETTINGS_MODULE\`:

\`\`\`bash
# локально
export DJANGO_SETTINGS_MODULE=myproject.settings.local

# production
export DJANGO_SETTINGS_MODULE=myproject.settings.production
\`\`\`

## Подход 2: один settings.py + переменные окружения (12-factor)

Более современный подход (особенно распространен в связке с контейнеризацией и облачными платформами) — единый \`settings.py\`, где **все, что различается между окружениями, читается из переменных окружения**, а не разносится по разным файлам Python.

\`\`\`python
# settings.py
import os

DEBUG = os.environ.get("DEBUG", "False") == "True"
SECRET_KEY = os.environ["SECRET_KEY"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["DB_NAME"],
        "USER": os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.environ.get("DB_HOST", "localhost"),
    }
}

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")
\`\`\`

Часто для удобства чтения переменных используются библиотеки типа \`django-environ\` или \`python-decouple\`, поддерживающие типизацию значений и \`.env\`-файлы для локальной разработки.

\`\`\`python
import environ
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

DEBUG = env.bool("DEBUG", default=False)
DATABASES = {"default": env.db()}   # парсит DATABASE_URL целиком
\`\`\`

## Сравнение подходов

| | Множественные файлы settings | Единый settings.py + env-переменные |
|---|---|---|
| Секреты | Легко случайно закоммитить в файл конкретного окружения | Никогда не попадают в код — только в переменные окружения/секреты |
| Наглядность различий между окружениями | Видно прямо в структуре файлов | Нужно смотреть значения переменных окружения отдельно |
| Совместимость с 12-factor / облачными платформами | Требует доп. усилий | Естественный, стандартный подход |
| Дублирование кода | Меньше риска (наследование через base.py) | Минимально, все настройки в одном месте |

## Практическая рекомендация

На практике эти два подхода часто комбинируют: базовая структура (набор приложений, middleware, шаблоны) остается общей в одном \`settings.py\` или в \`base.py\`, а все **чувствительные и специфичные для окружения значения** (пароли БД, секретные ключи, хосты, флаги включения debug-инструментов) всегда читаются из переменных окружения, а не хардкодятся ни в одном из файлов — это исключает риск случайного попадания секретов в git-репозиторий и упрощает деплой на любую платформу без изменения кода.`,
  },
  {
    id: "drf-serializer-vs-modelserializer-create-update",
    question:
      "В чем разница между Serializer и ModelSerializer в DRF? Как правильно переопределить методы create() и update()?",
    category: "Django REST Framework (DRF)",
    difficulty: "middle",
    answer: `## Serializer — базовый класс

\`serializers.Serializer\` — это аналог \`forms.Form\`: все поля описываются вручную, сериализатор не привязан напрямую к конкретной модели. Он отвечает за две задачи: **сериализацию** (Python-объект/QuerySet → JSON) и **десериализацию с валидацией** (входящий JSON → проверенные Python-данные).

\`\`\`python
from rest_framework import serializers

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
        instance.published = validated_data.get("published", instance.published)
        instance.save()
        return instance
\`\`\`

Здесь \`create()\` и \`update()\` **обязательно** нужно писать вручную — базовый \`Serializer\` не знает, с какой моделью работать.

## ModelSerializer — аналог ModelForm

\`serializers.ModelSerializer\` автоматически генерирует поля на основе модели (аналогично \`ModelForm\` для обычных форм) и предоставляет **реализации \`create()\` и \`update()\` по умолчанию**.

\`\`\`python
class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "body", "published", "author"]
        read_only_fields = ["id"]
\`\`\`

Стандартный \`create()\` в \`ModelSerializer\` эквивалентен \`Model.objects.create(**validated_data)\`, а \`update()\` — присвоению полей объекту и \`.save()\`. Для большинства простых случаев этого достаточно, и переопределять их не нужно.

## Когда переопределять create()/update() в ModelSerializer

Переопределение нужно, когда создание/обновление объекта — это не просто прямое сохранение полей, а требует дополнительной логики:

\`\`\`python
class ArticleSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = Article
        fields = ["id", "title", "body", "tags"]

    def create(self, validated_data):
        tags_data = validated_data.pop("tags", [])
        article = Article.objects.create(**validated_data)
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            article.tags.add(tag)
        return article

    def update(self, instance, validated_data):
        tags_data = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags_data is not None:
            instance.tags.clear()
            for tag_name in tags_data:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                instance.tags.add(tag)
        return instance
\`\`\`

Типичные причины для переопределения:
- Обработка **вложенных сериализаторов** (nested writes) — DRF не умеет автоматически сохранять вложенные связанные объекты.
- Установка значений, недоступных напрямую из запроса (например, \`author=self.context["request"].user\`).
- Дополнительная бизнес-логика при создании/обновлении (отправка уведомления, создание связанных объектов).

## Ключевое отличие

| | Serializer | ModelSerializer |
|---|---|---|
| Поля | Определяются вручную | Автогенерация на основе модели через \`Meta.fields\` |
| create()/update() | Обязательно писать самому | Есть реализация по умолчанию, переопределяется только при необходимости |
| Типичное применение | Данные, не привязанные напрямую к одной модели (например, параметры сложного отчета) | CRUD API для модели |`,
  },
  {
    id: "drf-viewset-router-vs-apiview",
    question:
      "Как работают ViewSet и Router? В чем архитектурное отличие использования ModelViewSet от APIView?",
    category: "Django REST Framework (DRF)",
    difficulty: "middle",
    answer: `## APIView — низкоуровневая основа

\`APIView\` — базовый класс DRF, аналог обычной Django class-based view, но адаптированный под REST (работает с \`Request\`/\`Response\` DRF, поддерживает content negotiation, аутентификацию, permissions). Каждый HTTP-метод обрабатывается отдельным методом класса, и URL для каждого эндпоинта прописывается вручную.

\`\`\`python
from rest_framework.views import APIView
from rest_framework.response import Response

class ArticleListAPIView(APIView):
    def get(self, request):
        articles = Article.objects.all()
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ArticleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

class ArticleDetailAPIView(APIView):
    def get(self, request, pk):
        article = get_object_or_404(Article, pk=pk)
        return Response(ArticleSerializer(article).data)

    def put(self, request, pk):
        ...
    def delete(self, request, pk):
        ...
\`\`\`

\`\`\`python
# urls.py — каждый эндпоинт регистрируется вручную
urlpatterns = [
    path("articles/", ArticleListAPIView.as_view()),
    path("articles/<int:pk>/", ArticleDetailAPIView.as_view()),
]
\`\`\`

## ViewSet — группировка связанной логики

\`ViewSet\` объединяет логику для набора связанных действий (список, деталка, создание, обновление, удаление) в **одном классе**, но не привязывает их напрямую к конкретным URL — это делает **Router**.

\`ModelViewSet\` — готовый ViewSet, реализующий полный CRUD за счет комбинации миксинов (\`ListModelMixin\`, \`CreateModelMixin\`, \`RetrieveModelMixin\`, \`UpdateModelMixin\`, \`DestroyModelMixin\`):

\`\`\`python
from rest_framework import viewsets

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
\`\`\`

Этот единственный класс полностью заменяет 4-5 отдельных APIView-классов из примера выше.

## Router — автоматическая генерация URL

Router анализирует зарегистрированный ViewSet и **сам генерирует** весь набор стандартных RESTful-маршрутов.

\`\`\`python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("articles", ArticleViewSet, basename="article")

urlpatterns = router.urls
\`\`\`

Это автоматически создает:

\`\`\`
GET    /articles/           → list()
POST   /articles/           → create()
GET    /articles/{pk}/      → retrieve()
PUT    /articles/{pk}/      → update()
PATCH  /articles/{pk}/      → partial_update()
DELETE /articles/{pk}/      → destroy()
\`\`\`

## Кастомные действия в ViewSet — @action

\`\`\`python
from rest_framework.decorators import action
from rest_framework.response import Response

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        article = self.get_object()
        article.published = True
        article.save()
        return Response({"status": "published"})
\`\`\`

Router автоматически добавит маршрут \`POST /articles/{pk}/publish/\` для этого действия.

## Архитектурное отличие

| | APIView | ModelViewSet + Router |
|---|---|---|
| Уровень абстракции | Низкий — полный контроль над каждым методом | Высокий — стандартный CRUD "из коробки" |
| URL-маршруты | Прописываются вручную для каждого эндпоинта | Генерируются автоматически Router'ом |
| Объем кода для типового CRUD | Много (несколько классов, дублирование логики get/post/put/delete) | Минимум (один класс) |
| Гибкость под нестандартную логику | Максимальная — полностью кастомный код | Ниже, но расширяется через \`@action\` и переопределение методов миксинов |
| Когда использовать | Нестандартные эндпоинты, не вписывающиеся в CRUD (например, сложный поиск, агрегация, вебхуки) | Стандартный CRUD для модели |

**Итог:** \`APIView\` дает полный контроль ценой большего количества кода; \`ModelViewSet\` + \`Router\` резко сокращают шаблонный код для типовых CRUD-ресурсов, но менее гибки для нетипичных сценариев — на практике оба подхода часто сочетаются в одном проекте.`,
  },
  {
    id: "drf-custom-authentication-permissions",
    question:
      "Как реализовать собственную логику аутентификации или сложные права доступа (Custom Permissions) в DRF?",
    category: "Django REST Framework (DRF)",
    difficulty: "middle",
    answer: `## Разделение ролей: Authentication vs Permissions

В DRF это два разных, последовательных этапа обработки запроса:
1. **Authentication** — определяет, **кто** делает запрос (например, по токену, сессии, JWT).
2. **Permissions** — определяет, **разрешено ли** этому (уже определенному) пользователю выполнить конкретное действие.

## Кастомная аутентификация

Собственный класс аутентификации наследуется от \`BaseAuthentication\` и реализует \`authenticate()\`, которая возвращает кортеж \`(user, auth)\` при успехе, \`None\` если эта схема не применима к запросу, или выбрасывает \`AuthenticationFailed\` при явно неверных данных.

\`\`\`python
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

class ApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return None   # эта схема не применима — DRF попробует следующую

        try:
            client = ApiClient.objects.get(key=api_key, is_active=True)
        except ApiClient.DoesNotExist:
            raise AuthenticationFailed("Неверный API-ключ")

        return (client.user, None)   # (request.user, request.auth)
\`\`\`

\`\`\`python
# settings.py — глобально
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "myapp.authentication.ApiKeyAuthentication",
    ]
}

# или локально на конкретном view
class ArticleViewSet(viewsets.ModelViewSet):
    authentication_classes = [ApiKeyAuthentication]
\`\`\`

## Кастомные Permissions

Собственный класс прав наследуется от \`BasePermission\` и реализует один или оба метода:
- \`has_permission(request, view)\` — проверка на уровне всего запроса (до получения конкретного объекта).
- \`has_object_permission(request, view, obj)\` — проверка на уровне конкретного объекта (вызывается только при обращении к detail-эндпоинту через \`get_object()\`).

\`\`\`python
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """Разрешает изменение объекта только его владельцу, чтение — всем."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:   # GET, HEAD, OPTIONS
            return True
        return obj.author == request.user


class IsPremiumUser(BasePermission):
    """Разрешает доступ только пользователям с активной подпиской."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_premium", False)
        )
\`\`\`

\`\`\`python
class ArticleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
\`\`\`

Важно: **все** классы в \`permission_classes\` должны вернуть \`True\`, чтобы доступ был разрешен (логическое "И", а не "ИЛИ").

## Комбинирование прав через операторы (DRF 3.9+)

\`\`\`python
from rest_framework.permissions import IsAuthenticated

# доступ разрешен, если пользователь аутентифицирован ИЛИ запрос безопасный (GET/HEAD/OPTIONS)
permission_classes = [IsAuthenticated | ReadOnly]

# доступ только если оба условия одновременно
permission_classes = [IsAuthenticated & IsOwnerOrReadOnly]
\`\`\`

## Практический пример: разные права для разных действий ViewSet

\`\`\`python
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [AllowAny()]
\`\`\`

Такой подход позволяет гибко настраивать права не глобально для всего ViewSet, а в зависимости от конкретного действия (list/retrieve доступны всем, изменение — только владельцу).`,
  },
  {
    id: "drf-throttling-levels",
    question:
      "Что такое Throttling (ограничение частоты запросов) в DRF и на каких уровнях его можно настроить?",
    category: "Django REST Framework (DRF)",
    difficulty: "middle",
    answer: `## Что такое Throttling

**Throttling** — механизм ограничения **частоты** запросов от одного источника (пользователя, IP-адреса, API-ключа) за определенный промежуток времени. В отличие от Permissions (разрешено/запрещено конкретное действие), throttling отвечает на вопрос "слишком ли часто этот клиент обращается к API" — защита от злоупотребления, DDoS-подобной нагрузки и неконтролируемого расхода ресурсов сервера.

При превышении лимита DRF возвращает **HTTP 429 Too Many Requests**.

## Встроенные классы throttling

\`\`\`python
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle, ScopedRateThrottle
\`\`\`

- \`AnonRateThrottle\` — ограничивает неаутентифицированных пользователей по IP-адресу.
- \`UserRateThrottle\` — ограничивает аутентифицированных пользователей по их ID.
- \`ScopedRateThrottle\` — позволяет задавать разные лимиты для разных групп эндпоинтов ("scope").

## Настройка на уровне проекта (settings.py)

\`\`\`python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
    },
}
\`\`\`

Формат лимита: \`"<количество>/<период>"\`, где период — \`sec\`, \`min\`, \`hour\`, \`day\`.

## Настройка на уровне конкретного view

\`\`\`python
class ArticleViewSet(viewsets.ModelViewSet):
    throttle_classes = [UserRateThrottle]
\`\`\`

## ScopedRateThrottle — разные лимиты для разных групп эндпоинтов

\`\`\`python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {
        "search": "10/min",
        "upload": "5/hour",
    }
}

class SearchAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "search"

class UploadAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "upload"
\`\`\`

## Кастомный класс throttling

Для нестандартной логики (например, разные лимиты для разных тарифных планов) можно написать собственный класс:

\`\`\`python
from rest_framework.throttling import UserRateThrottle

class PremiumUserThrottle(UserRateThrottle):
    scope = "premium"

    def get_rate(self):
        return "10000/day"


class BasicUserThrottle(UserRateThrottle):
    scope = "basic"

    def get_rate(self):
        return "100/day"


class ArticleViewSet(viewsets.ModelViewSet):
    def get_throttles(self):
        if self.request.user.is_authenticated and self.request.user.is_premium:
            return [PremiumUserThrottle()]
        return [BasicUserThrottle()]
\`\`\`

## Уровни, на которых можно настраивать throttling — итог

| Уровень | Как настраивается |
|---|---|
| Глобально, для всего проекта | \`DEFAULT_THROTTLE_CLASSES\` + \`DEFAULT_THROTTLE_RATES\` в settings |
| Для конкретного View/ViewSet | \`throttle_classes\` на классе |
| Для группы эндпоинтов ("scope") | \`ScopedRateThrottle\` + \`throttle_scope\` |
| Динамически, в зависимости от пользователя/запроса | Переопределение \`get_throttles()\` в view |
| По типу клиента (аноним/авторизован) | \`AnonRateThrottle\` vs \`UserRateThrottle\` |

## Важный нюанс — хранилище состояния

По умолчанию throttling использует Django cache framework (\`default\` cache) для хранения счетчиков запросов. В production с несколькими серверами/воркерами обязательно нужен **общий** кэш-бэкенд (например, Redis или Memcached) — если использовать локальный in-memory cache на каждом сервере отдельно, лимиты будут считаться независимо на каждом инстансе, и реальный суммарный лимит окажется в N раз выше задуманного.`,
  },
  {
    id: "drf-optimize-serialization-large-datasets",
    question:
      "Как оптимизировать сериализацию больших объемов данных в DRF?",
    category: "Django REST Framework (DRF)",
    difficulty: "middle",
    answer: `## Проблема

При сериализации больших QuerySet'ов (тысячи и более объектов, особенно со связанными данными) типичны две проблемы: (1) N+1 запросы к базе данных при обращении к связанным полям внутри сериализатора и (2) избыточное использование памяти/CPU на сериализацию/десериализацию большого количества объектов сразу.

## 1. Устранение N+1 на уровне QuerySet

Точно так же, как и в обычном Django ORM, сериализатор, обращающийся к связанным полям (\`article.author.name\`, \`article.tags.all()\`), вызовет N+1 запросы, если QuerySet не оптимизирован заранее — эта оптимизация должна происходить **до** передачи данных в сериализатор, обычно в \`get_queryset()\` ViewSet'а.

\`\`\`python
class ArticleViewSet(viewsets.ModelViewSet):
    serializer_class = ArticleSerializer

    def get_queryset(self):
        return (
            Article.objects
            .select_related("author", "category")
            .prefetch_related("tags", "comments")
        )
\`\`\`

## 2. Обязательная пагинация

Отдавать весь набор данных одним ответом без пагинации — прямой путь к деградации производительности при росте данных. DRF поддерживает пагинацию "из коробки".

\`\`\`python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}
\`\`\`

Для по-настоящему больших наборов данных **cursor-based пагинация** (\`CursorPagination\`) эффективнее, чем offset-based (\`PageNumberPagination\`/\`LimitOffsetPagination\`) — offset-пагинация на больших смещениях (\`OFFSET 100000\`) заставляет базу данных сканировать и отбрасывать все пропущенные строки, тогда как cursor-пагинация использует индексированное значение (например, \`id\` или \`created_at\`) для перехода сразу к нужной позиции.

\`\`\`python
class ArticleViewSet(viewsets.ModelViewSet):
    pagination_class = CursorPagination
\`\`\`

## 3. Ограничение полей — минимизация payload

Если клиенту не нужны все поля, можно динамически ограничить набор возвращаемых полей (динамический сериализатор) или использовать облегченный сериализатор для списка и полный — для деталки.

\`\`\`python
class ArticleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "published_at"]   # облегченная версия для списка

class ArticleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = "__all__"   # полная версия для одной статьи

class ArticleViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == "list":
            return ArticleListSerializer
        return ArticleDetailSerializer
\`\`\`

## 4. only() / values() на уровне QuerySet

Если сериализатору нужен не весь набор полей модели, можно сократить объем данных, извлекаемых из базы, через \`.only()\`:

\`\`\`python
Article.objects.only("id", "title", "published_at")
\`\`\`

## 5. Использование SerializerMethodField с осторожностью

\`SerializerMethodField\` выполняет произвольный Python-код для **каждого** объекта — если внутри него есть обращение к базе данных, это легко приводит к N+1 незаметно для разработчика. Такие вычисления либо переносят в \`annotate()\` на уровне QuerySet, либо тщательно проверяют на предмет дополнительных запросов.

\`\`\`python
# Плохо: N+1, скрытый внутри SerializerMethodField
class ArticleSerializer(serializers.ModelSerializer):
    comments_count = serializers.SerializerMethodField()

    def get_comments_count(self, obj):
        return obj.comments.count()   # отдельный запрос для КАЖДОЙ статьи

# Хорошо: посчитано на уровне БД одним запросом для всех статей через annotate()
class ArticleViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Article.objects.annotate(comments_count=Count("comments"))

class ArticleSerializer(serializers.ModelSerializer):
    comments_count = serializers.IntegerField(read_only=True)   # просто читает аннотированное поле
\`\`\`

## 6. many=True — сериализация коллекций эффективнее, чем цикл

DRF уже оптимизирован для сериализации списков через \`serializer = ArticleSerializer(queryset, many=True)\` — под капотом это создает \`ListSerializer\`, работающий эффективнее, чем сериализация каждого объекта отдельным вызовом в ручном цикле.

## Итоговый чек-лист

1. \`select_related\`/\`prefetch_related\` в \`get_queryset()\`.
2. Пагинация всегда включена (cursor-based для очень больших датасетов).
3. Минимально необходимый набор полей — разные сериализаторы для list/retrieve.
4. \`only()\`/\`values()\` для сокращения объема данных из базы.
5. Тяжелые вычисления — через \`annotate()\`, а не \`SerializerMethodField\` с запросами внутри.
6. При необходимости — кэширование сериализованного ответа на уровне view (например, через \`cache_page\` или ручное кэширование в Redis) для данных, которые не меняются на каждый запрос.`,
  },
  {
    id: "django-asgi-async-support",
    question:
      "Как Django работает с асинхронностью (ASGI)? Какие компоненты фреймворка на данный момент нативно поддерживают async/await?",
    category: "Асинхронность и фоновые задачи",
    difficulty: "middle",
    answer: `## ASGI — асинхронный аналог WSGI

**ASGI (Asynchronous Server Gateway Interface)** — стандарт, расширяющий идею WSGI на асинхронный мир: он поддерживает не только классический запрос-ответ, но и долгоживущие соединения (WebSocket, Server-Sent Events, HTTP/2 push). Django поддерживает ASGI как альтернативу WSGI начиная с версии 3.0, а асинхронные представления — начиная с 3.1.

\`\`\`python
# myproject/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
application = get_asgi_application()
\`\`\`

Запускается через ASGI-сервер (Uvicorn, Daphne, Hypercorn) вместо WSGI-сервера (Gunicorn):

\`\`\`bash
uvicorn myproject.asgi:application
\`\`\`

## Асинхронные представления (async views)

Django позволяет объявлять view как \`async def\` — такая view может использовать \`await\` внутри себя, что полезно для операций, ожидающих внешние ресурсы (сетевые запросы к другим API, I/O-bound задачи).

\`\`\`python
import httpx
from django.http import JsonResponse

async def external_data_view(request):
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return JsonResponse(response.json())
\`\`\`

## Что нативно поддерживает async/await на данный момент

- **Views** — можно писать как \`async def\`, полностью поддерживается на уровне URL-роутинга.
- **Middleware** — можно писать асинхронные middleware (Django сам определяет, sync или async view дальше по цепочке, и при необходимости адаптирует).
- **Тесты** — \`django.test.AsyncClient\` для тестирования асинхронных представлений.
- **Некоторые части ORM** — начиная с Django 4.1, появились асинхронные версии базовых методов QuerySet: \`acreate()\`, \`aget()\`, \`afilter()\` не полностью, но растущий набор \`a\`-методов (\`aget()\`, \`acreate()\`, \`asave()\`, \`adelete()\`, \`aiterator()\`, \`aget_or_create()\` и т.д.).
- **Кэш-фреймворк** — асинхронные методы (\`aget\`, \`aset\`) добавлены в более новых версиях.

## Что НЕ полностью асинхронно (по состоянию на актуальные LTS-версии)

- Большая часть **ORM** (сложные запросы, транзакции, некоторые агрегации) все еще требует синхронного контекста — Django оборачивает такие вызовы через \`sync_to_async\`, что не дает выигрыша в производительности, а лишь позволяет вызвать синхронный код из async-функции без ошибки.
- **Формы и большинство встроенных generic CBV** остаются синхронными.
- **Сигналы** по умолчанию синхронны.

## Смешение sync и async кода

Django предоставляет утилиты для перехода между мирами:

\`\`\`python
from asgiref.sync import sync_to_async, async_to_sync

# вызвать синхронный ORM-код из async view
async def my_view(request):
    articles = await sync_to_async(list)(Article.objects.filter(published=True))
    ...

# вызвать async-функцию из синхронного кода
def sync_function():
    result = async_to_sync(some_async_function)()
\`\`\`

## Практический вывод

На практике полноценная асинхронность в Django чаще всего нужна для конкретных сценариев — проксирование запросов к внешним API, WebSocket-функциональность (обычно через Django Channels), стриминг данных — тогда как основная масса CRUD-логики, тяжело завязанной на ORM, по-прежнему пишется синхронно, так как ORM только частично мигрировал на async и полноценный выигрыш производительности от async views в типичном CRUD-приложении с интенсивной работой с БД пока ограничен.`,
  },
  {
    id: "django-celery-redis-rabbitmq-purpose",
    question:
      "Для чего в Django-проектах чаще всего используется связка Celery + Redis/RabbitMQ?",
    category: "Асинхронность и фоновые задачи",
    difficulty: "middle",
    answer: `## Проблема, которую решает Celery

HTTP-запрос должен обрабатываться быстро — пользователь ждет ответ сервера в реальном времени. Но некоторые операции по своей природе **долгие** (отправка email, генерация PDF/отчета, обработка загруженного видео, вызов медленного внешнего API, тяжелые вычисления) — выполнять их синхронно внутри view означало бы заставлять пользователя ждать секунды или минуты, а также занимать worker веб-сервера на все это время.

**Celery** — это распределенная система очередей задач, которая позволяет вынести такую работу **за пределы цикла запрос-ответ**, выполнив ее асинхронно, в отдельном процессе.

## Роли Redis/RabbitMQ (broker) и Celery worker

- **Broker (Redis или RabbitMQ)** — очередь сообщений, посредник между Django-приложением и Celery-воркерами. Django кладет в очередь "задание" (сериализованный вызов функции с аргументами), а не выполняет его сам.
- **Celery worker** — отдельный процесс (или несколько процессов), постоянно слушающий очередь и выполняющий задачи по мере их поступления.
- **Result backend** (опционально, часто тоже Redis) — хранилище для результатов выполнения задач, если результат нужно потом забрать.

\`\`\`
Django view → кладет задачу в очередь (Redis/RabbitMQ) → view сразу возвращает ответ пользователю
                                                              ↓
                                              Celery worker берет задачу из очереди
                                                              ↓
                                              выполняет ее в фоне (независимо от HTTP-запроса)
\`\`\`

## Типичный пример

\`\`\`python
# tasks.py
from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_welcome_email(user_id):
    user = User.objects.get(id=user_id)
    send_mail("Добро пожаловать!", "Спасибо за регистрацию", "noreply@example.com", [user.email])
\`\`\`

\`\`\`python
# views.py
def register(request):
    user = User.objects.create_user(...)
    send_welcome_email.delay(user.id)   # ставит задачу в очередь, не блокируя запрос
    return redirect("home")             # ответ отправляется немедленно, email уйдет в фоне
\`\`\`

## Наиболее частые сценарии использования в Django-проектах

1. **Отправка писем и уведомлений** — email, push, SMS.
2. **Обработка загруженных файлов** — генерация превью изображений, конвертация видео, парсинг документов.
3. **Периодические задачи (Celery Beat)** — ежедневные отчеты, очистка устаревших данных, синхронизация с внешними сервисами по расписанию.
4. **Интеграция с медленными внешними API** — вызовы платежных систем, сторонних сервисов, где ответ может занимать несколько секунд.
5. **Тяжелые вычисления/агрегация данных** — построение аналитических отчетов, экспорт больших наборов данных.
6. **Retry-логика для ненадежных операций** — Celery умеет автоматически повторять неудачные задачи с задержкой.

## Почему Redis или RabbitMQ, а не сама база данных

Использование PostgreSQL/MySQL как очереди задач возможно (некоторые небольшие проекты так делают), но Redis и RabbitMQ спроектированы именно для быстрой доставки сообщений с низкой задержкой и специфичными паттернами доступа очереди (FIFO, приоритеты, подтверждения доставки) — что более эффективно и надежно под нагрузкой, чем "изобретать" очередь поверх реляционной таблицы.

## Redis vs RabbitMQ как broker

| | Redis | RabbitMQ |
|---|---|---|
| Простота настройки | Проще, часто уже используется как кэш | Требует отдельной инфраструктуры |
| Надежность доставки | Базовая (при падении Redis без персистентности задачи можно потерять) | Более продвинутые гарантии доставки, подтверждения (ACK) |
| Типичный выбор | Небольшие/средние проекты, где Redis уже есть для кэша/сессий | Проекты с высокими требованиями к надежности очереди и сложной маршрутизацией сообщений |`,
  },
  {
    id: "django-celery-task-arguments-orm-instances",
    question:
      "Как правильно передавать аргументы в задачи (tasks) Celery и почему туда категорически не рекомендуется передавать инстансы ORM-моделей?",
    category: "Асинхронность и фоновые задачи",
    difficulty: "middle",
    answer: `## Как правильно передавать аргументы

Аргументы задачи Celery должны быть **сериализуемыми** (обычно в JSON — сериализатор по умолчанию в современных версиях Celery). Правильный подход — передавать **примитивные идентификаторы** (ID объекта, строки, числа), а не сложные Python-объекты, и получать актуальный объект уже внутри самой задачи.

\`\`\`python
# Правильно
@shared_task
def process_order(order_id):
    order = Order.objects.get(id=order_id)   # получаем свежий объект внутри задачи
    order.status = "processed"
    order.save()

# Вызов
process_order.delay(order.id)
\`\`\`

## Почему НЕЛЬЗЯ передавать инстансы ORM-моделей напрямую

\`\`\`python
# Плохо — не делайте так
@shared_task
def process_order(order):   # передан целый объект Order
    order.status = "processed"
    order.save()

process_order.delay(order)   # сериализация объекта модели целиком
\`\`\`

**1. Проблемы сериализации.** JSON-сериализатор Celery (используемый по умолчанию из соображений безопасности) не умеет напрямую сериализовать произвольные Python-объекты, включая экземпляры моделей Django — потребовался бы менее безопасный сериализатор (\`pickle\`), который создает риски выполнения произвольного кода при десериализации untrusted данных.

**2. Устаревшие данные (race condition).** Между моментом постановки задачи в очередь и моментом ее реального выполнения worker'ом может пройти существенное время (секунды, минуты, часы — в зависимости от загрузки очереди). Если объект передан "как есть" (например, через pickle), задача будет работать с **тем состоянием объекта, которое было на момент постановки в очередь**, а не с актуальным. Если за это время объект изменился (например, другой процесс обновил его статус), задача перезапишет эти изменения устаревшими данными.

\`\`\`python
# Сценарий race condition при передаче объекта напрямую (гипотетически, если бы это работало):
# 1. order.status = "pending", задача поставлена в очередь с этим объектом в памяти
# 2. другой процесс меняет order.status на "cancelled" и сохраняет
# 3. Celery worker наконец выполняет задачу — использует старую версию объекта
#    и перезаписывает status обратно на что-то, основанное на "pending"
\`\`\`

Передача только \`order_id\` и повторное \`Order.objects.get(id=order_id)\` **внутри** задачи гарантирует, что задача всегда работает с максимально свежим состоянием объекта на момент реального выполнения.

**3. Размер сообщения в очереди.** Полный объект модели (со всеми полями, а иногда и с подгруженными связанными объектами) занимает существенно больше места в очереди сообщений, чем простой числовой ID — это увеличивает нагрузку на broker и снижает пропускную способность очереди.

**4. Проблемы с изменением схемы модели.** Если между постановкой задачи в очередь и ее выполнением модель изменилась (например, деплой новой версии кода с измененной структурой модели, а задача была поставлена в очередь до деплоя), сериализованный через pickle объект старой структуры может не десериализоваться корректно в новом коде. ID — это всегда просто число, не зависящее от структуры модели.

## Итоговое правило

**Задачи Celery должны быть идемпотентными "командами", а не "снимками состояния".** Передавайте примитивы (ID, строки, числа, простые списки/словари), а всю работу с актуальными данными делайте внутри самой задачи через свежий запрос к базе данных.

\`\`\`python
@shared_task(bind=True, max_retries=3)
def send_order_confirmation(self, order_id):
    try:
        order = Order.objects.select_related("customer").get(id=order_id)
    except Order.DoesNotExist:
        return   # объект мог быть удален между постановкой задачи и ее выполнением — обрабатываем явно

    send_mail(
        "Подтверждение заказа",
        f"Ваш заказ №{order.id} принят",
        "noreply@example.com",
        [order.customer.email],
    )
\`\`\``,
  },
  {
    id: "django-cache-backends-production-choice",
    question:
      "Какие бекенды кеширования поддерживает Django? Какой бекенд вы бы выбрали для production-среды и почему?",
    category: "Кеширование",
    difficulty: "middle",
    answer: `## Встроенные бекенды кэширования

Django поддерживает несколько взаимозаменяемых бекендов через единый API кэша, настраиваемых в \`settings.py\`:

\`\`\`python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
    }
}
\`\`\`

### 1. LocMemCache (по умолчанию для разработки)

\`\`\`python
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
\`\`\`

Хранит данные в памяти **одного процесса**. Подходит только для разработки и тестов — в production с несколькими воркерами/серверами каждый процесс будет иметь свой независимый кэш, что делает кэш ненадежным и неэффективным (например, инвалидация в одном воркере не затронет кэш в других).

### 2. Memcached

\`\`\`python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.memcached.PyMemcacheCache",
        "LOCATION": "127.0.0.1:11211",
    }
}
\`\`\`

Быстрый распределенный кэш в памяти, исторически самый частый выбор для Django. Хранит только простые данные в памяти, без персистентности (при перезапуске кэш полностью теряется) и без встроенной поддержки сложных структур данных.

### 3. Redis (django-redis или встроенный бекенд с Django 4.0+)

\`\`\`python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
    }
}
\`\`\`

Также in-memory хранилище, но поддерживает больше структур данных (списки, множества, сортированные множества), опциональную персистентность на диск, publish/subscribe и часто уже присутствует в инфраструктуре проекта как broker для Celery — что делает его удобным выбором "по умолчанию".

### 4. DatabaseCache

\`\`\`python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "my_cache_table",
    }
}
\`\`\`

Хранит кэш в таблице реляционной БД. Не требует дополнительной инфраструктуры, но медленнее специализированных in-memory решений и создает дополнительную нагрузку на основную БД — обычно используется только как временное решение или там, где нельзя развернуть отдельный сервис.

### 5. FileBasedCache

Хранит кэш как файлы на диске. Работает без дополнительных зависимостей, но медленнее in-memory решений и плохо масштабируется на несколько серверов (файловая система должна быть общей).

## Что выбрать для production

**Redis** — наиболее универсальный выбор для большинства современных Django-проектов:
- Распределенный кэш, корректно работающий при нескольких воркерах/серверах приложения.
- Часто уже развернут в инфраструктуре проекта (как broker для Celery, хранилище сессий) — не требует поднимать отдельный сервис только ради кэша.
- Поддерживает более богатые структуры данных и паттерны инвалидации (например, теги через сторонние библиотеки типа \`django-redis\`).
- Опциональная персистентность позволяет использовать его не только как кэш, но и как более общее key-value хранилище при необходимости.

Memcached остается разумным выбором, если единственная задача — простой, максимально быстрый key-value кэш без дополнительных требований, и в инфраструктуре уже есть Memcached, но в новых проектах Redis почти всегда предпочтительнее из-за универсальности и совмещения ролей.

## Ключевое правило для production

**LocMemCache нельзя использовать в production с несколькими процессами/серверами** — это единственный по-настоящему запрещенный вариант, все остальные (Memcached, Redis, DatabaseCache, FileBasedCache) технически рабочие, но с разными компромиссами по производительности и удобству эксплуатации.`,
  },
  {
    id: "django-caching-view-template-fragment-queryset",
    question:
      "Как закешировать конкретное представление (View), фрагмент шаблона или результат тяжелого запроса к БД?",
    category: "Кеширование",
    difficulty: "middle",
    answer: `## Кэширование целой View — cache_page

Декоратор \`cache_page\` кэширует **весь HTTP-ответ** представления целиком на заданное время (в секундах).

\`\`\`python
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)   # кэш на 15 минут
def article_list(request):
    articles = Article.objects.filter(published=True)
    return render(request, "articles/list.html", {"articles": articles})
\`\`\`

Для class-based views декоратор применяется через \`method_decorator\` или прямо в \`urls.py\`:

\`\`\`python
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

@method_decorator(cache_page(60 * 15), name="dispatch")
class ArticleListView(ListView):
    model = Article
\`\`\`

Важный нюанс: \`cache_page\` кэширует ответ **отдельно для каждого уникального URL** (включая query-параметры) — то есть \`/articles/?page=2\` и \`/articles/?page=3\` кэшируются как разные записи. Также по умолчанию кэшируются только GET/HEAD-запросы с кодом ответа 200, и кэш общий для всех пользователей (не подходит для персонализированных страниц без дополнительной настройки \`Vary\`).

## Кэширование фрагмента шаблона — тег {% cache %}

Когда кэшировать нужно только часть страницы (например, тяжелый виджет "популярные статьи"), а не всю страницу целиком:

\`\`\`html
{% load cache %}

{% cache 900 popular_articles_widget %}
  <h3>Популярные статьи</h3>
  <ul>
  {% for article in popular_articles %}
    <li>{{ article.title }}</li>
  {% endfor %}
  </ul>
{% endcache %}
\`\`\`

Первый аргумент — время жизни в секундах, второй — уникальное имя фрагмента. Можно добавить дополнительные "переменные" ключа, чтобы кэшировать раздельно для разных контекстов (например, для каждого пользователя отдельно):

\`\`\`html
{% cache 900 sidebar request.user.id %}
  ...персонализированный сайдбар...
{% endcache %}
\`\`\`

## Кэширование результата тяжелого запроса к БД — низкоуровневое кэширование

Для произвольных вычислений (не обязательно всей view или шаблона) используется прямой API кэша: \`cache.get()\`/\`cache.set()\`.

\`\`\`python
from django.core.cache import cache

def get_popular_articles():
    articles = cache.get("popular_articles")
    if articles is None:
        articles = list(
            Article.objects.filter(published=True)
            .annotate(total_views=Sum("view_events__count"))
            .order_by("-total_views")[:10]
        )
        cache.set("popular_articles", articles, timeout=60 * 30)   # 30 минут
    return articles
\`\`\`

Удобный шорткат — \`cache.get_or_set()\`:

\`\`\`python
def get_popular_articles():
    return cache.get_or_set(
        "popular_articles",
        lambda: list(Article.objects.filter(published=True).order_by("-views")[:10]),
        timeout=60 * 30,
    )
\`\`\`

## Кэширование на уровне всего сайта (per-site cache)

Django также поддерживает глобальное middleware-кэширование через \`UpdateCacheMiddleware\`/\`FetchFromCacheMiddleware\` — кэширует все GET-запросы сайта автоматически, но требует аккуратной настройки \`CACHE_MIDDLEWARE_SECONDS\` и обычно менее гибок, чем точечное кэширование конкретных view/фрагментов.

## Выбор уровня кэширования

| Что кэшировать | Инструмент |
|---|---|
| Вся страница целиком, одинаковая для всех | \`cache_page\` |
| Один тяжелый виджет/блок на странице | \`{% cache %}\` |
| Результат конкретного вычисления/запроса, используемый в нескольких местах | \`cache.get()\`/\`cache.set()\` напрямую |
| Весь сайт целиком (редко) | Middleware-кэш |`,
  },
  {
    id: "django-cache-invalidation-strategies",
    question:
      "Что такое инвалидация кеша и какие стратегии или паттерны ее реализации в Django вы применяли?",
    category: "Кеширование",
    difficulty: "middle",
    answer: `## Что такое инвалидация кэша

**Инвалидация кэша** — процесс своевременного удаления или обновления закэшированных данных, когда исходные данные изменились, чтобы пользователи не видели устаревшую информацию. Это одна из классических "двух сложных вещей в компьютерных науках" (наряду с именованием переменных) — слишком агрессивная инвалидация сводит на нет пользу кэша, слишком редкая приводит к показу неактуальных данных.

## Стратегия 1: TTL (Time-To-Live) — самая простая

Данные кэшируются на фиксированное время, после которого автоматически считаются устаревшими и запрашиваются заново.

\`\`\`python
cache.set("popular_articles", articles, timeout=60 * 15)   # протухнет само через 15 минут
\`\`\`

**Плюсы:** просто реализовать, не требует явного отслеживания изменений.
**Минусы:** данные могут быть устаревшими вплоть до истечения TTL, даже если изменились сразу после кэширования.

## Стратегия 2: явная инвалидация при изменении данных

Явно удаляется закэшированное значение в момент, когда исходные данные меняются — например, через сигнал \`post_save\`/\`post_delete\` или прямо в методе сохранения/сервисном слое.

\`\`\`python
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver([post_save, post_delete], sender=Article)
def invalidate_article_cache(sender, instance, **kwargs):
    cache.delete("popular_articles")
    cache.delete(f"article_detail_{instance.pk}")
\`\`\`

**Плюсы:** данные всегда актуальны сразу после изменения.
**Минусы:** нужно не забыть добавить инвалидацию везде, где данные могут измениться (легко упустить один из путей изменения, особенно при bulk-операциях, которые не вызывают сигналы).

## Стратегия 3: ключи с версионированием (cache versioning / key-based invalidation)

Вместо удаления конкретных ключей, ключ кэша строится с включением "версии" данных — при изменении данных версия увеличивается, и старые ключи автоматически становятся недостижимыми (хотя физически остаются в кэше до истечения своего TTL, что нормально для памяти вроде Redis с политикой вытеснения).

\`\`\`python
def get_article_cache_key(article):
    return f"article:{article.pk}:v{article.updated_at.timestamp()}"

def get_article_data(article):
    key = get_article_cache_key(article)
    data = cache.get(key)
    if data is None:
        data = serialize_article(article)
        cache.set(key, data, timeout=60 * 60)
    return data
\`\`\`

Здесь ключ автоматически меняется при каждом обновлении \`article.updated_at\` — старое значение просто перестает запрашиваться, явно удалять его не нужно.

## Стратегия 4: инвалидация по тегам (cache tagging)

Django из коробки не поддерживает теги кэша, но сторонние библиотеки (например, \`django-cacheops\`, кастомная реализация поверх Redis) позволяют помечать закэшированные значения тегами и инвалидировать сразу все значения с определенным тегом.

\`\`\`python
# псевдокод с использованием сторонней библиотеки для тегированного кэша
cache.set("homepage_articles", data, tags=["articles"])
cache.set("category_page_1", data, tags=["articles", "categories"])

# при изменении любой статьи — инвалидировать все, что помечено тегом "articles"
cache.invalidate_tag("articles")
\`\`\`

**Плюсы:** удобно, когда одни и те же данные участвуют во многих закэшированных представлениях, и нет необходимости помнить все конкретные ключи.

## Практический паттерн, который часто применяется вместе

Комбинация стратегий: **короткий TTL как страховка** (на случай, если явная инвалидация где-то была пропущена) + **явная инвалидация через сигналы/сервисный слой** для мгновенного обновления в типичных сценариях.

\`\`\`python
def get_popular_articles():
    return cache.get_or_set(
        "popular_articles",
        lambda: list(Article.objects.filter(published=True).order_by("-views")[:10]),
        timeout=60 * 30,   # страховочный TTL — даже если явная инвалидация не сработала,
                            # данные не будут устаревшими дольше 30 минут
    )

@receiver(post_save, sender=Article)
def invalidate_popular_articles_cache(sender, instance, **kwargs):
    cache.delete("popular_articles")   # мгновенная инвалидация при изменении
\`\`\`

## Важный нюанс — bulk-операции не вызывают сигналы

Как и в общем случае с сигналами, \`QuerySet.update()\` и \`bulk_create()\`/\`bulk_update()\` **не вызывают** \`post_save\`/\`post_delete\` — если инвалидация кэша построена только на сигналах, массовые операции незаметно оставят кэш неактуальным. В таких местах инвалидацию нужно вызывать явно сразу после bulk-операции, а не полагаться на сигналы.`,
  },
  {
    id: "django-nginx-gunicorn-roles-runserver",
    question:
      "Какова роль веб-сервера (например, Nginx) и сервера приложений (например, Gunicorn или uWSGI) при деплое Django-приложения? Почему Django не стоит запускать на manage.py runserver в проде?",
    category: "Деплой и инфраструктура",
    difficulty: "middle",
    answer: `## Типичная production-схема

\`\`\`
Клиент → Nginx (веб-сервер) → Gunicorn/uWSGI (сервер приложений) → Django (WSGI-приложение)
                ↓
       статика/медиа отдаются напрямую, минуя Django
\`\`\`

## Роль сервера приложений (Gunicorn/uWSGI)

**Gunicorn** или **uWSGI** — это WSGI-серверы, которые непосредственно запускают Python-код Django и управляют пулом worker-процессов, обрабатывающих запросы.

\`\`\`bash
gunicorn myproject.wsgi:application --workers 4 --bind 127.0.0.1:8000
\`\`\`

Их задачи:
- **Управление несколькими worker-процессами** — параллельная обработка запросов (Django сам по себе однопоточный на один процесс, если не считать async).
- **Перезапуск упавших воркеров** — если один процесс упал (например, из-за необработанного исключения или утечки памяти), Gunicorn/uWSGI перезапускает его, не затрагивая остальные.
- **Graceful reload** — плавное обновление кода без простоя (запуск новых воркеров, дожидание завершения старых запросов на старых воркерах).
- **Ограничение по таймауту** — принудительное завершение "зависших" запросов.

## Роль веб-сервера (Nginx)

Nginx ставится **перед** сервером приложений и выполняет задачи, для которых Python-процессы плохо подходят:

- **Отдача статических и медиа-файлов напрямую с диска** — Nginx делает это в разы эффективнее, чем прогонять каждый запрос статики через Python-процесс Gunicorn.
- **Балансировка нагрузки** — распределение запросов между несколькими инстансами Gunicorn (если приложение развернуто на нескольких серверах/процессах).
- **SSL/TLS терминация** — обработка HTTPS-шифрования на уровне Nginx, дальше к Gunicorn запрос обычно идет по простому HTTP внутри защищенной сети.
- **Буферизация запросов и защита от медленных клиентов (slow clients)** — Nginx умеет буферизовать тело запроса/ответа, защищая worker-процессы Gunicorn от долгого удержания соединения медленным клиентом.
- **Rate limiting, сжатие (gzip), кэширование заголовков, обработка редиректов** на уровне инфраструктуры, до того как запрос дойдет до Python-кода.

## Почему runserver не подходит для production

\`manage.py runserver\` — это встроенный сервер для разработки, и Django-документация прямо предупреждает: он **не прошел аудит безопасности и не оптимизирован для производительности**.

**1. Однопоточность/минимальная конкурентность.** \`runserver\` обрабатывает запросы по одному (или в очень ограниченном режиме многопоточности), не рассчитан на реальную нагрузку — при параллельных запросах пользователи будут ждать в очереди.

**2. Отсутствие production-грейд обработки ошибок.** Он не перезапускает процесс при падении, не имеет механизмов graceful restart, не следит за состоянием worker'ов.

**3. Небезопасная отдача статики.** \`runserver\` умеет отдавать статические файлы только при \`DEBUG=True\` — в production режиме этим вообще не должен заниматься Django-процесс.

**4. Нет полноценной поддержки конкурентных соединений, SSL и т.п.** — все то, для чего в реальной инфраструктуре используются специализированные инструменты.

**5. Не рассчитан на устойчивость под атаками/нагрузкой.** Он написан для быстрой итерации при разработке (автоперезагрузка при изменении файлов, подробные traceback-страницы), а не для защиты от вредоносного трафика.

## Итог

Разделение ролей: **Nginx** — "входная дверь" (статика, SSL, балансировка, защита от медленных клиентов), **Gunicorn/uWSGI** — "менеджер процессов" Python-кода (параллельность, устойчивость к падениям воркеров), **Django** — сама бизнес-логика. \`runserver\` создавался только для локальной разработки и не предназначен для того, чтобы принимать реальный production-трафик.`,
  },
  {
    id: "django-collectstatic-static-media-production",
    question:
      "Зачем нужна команда collectstatic? Как правильно и эффективно отдавать статические и медиа-файлы в production-окружении?",
    category: "Деплой и инфраструктура",
    difficulty: "middle",
    answer: `## Зачем нужен collectstatic

В процессе разработки статические файлы (CSS, JS, изображения) обычно разбросаны по разным приложениям — у каждого Django-приложения может быть своя папка \`static/\`. В режиме разработки Django (через \`django.contrib.staticfiles\`) сам находит и отдает эти файлы "на лету", собирая их из всех приложений автоматически.

В production такой подход не используется — вместо этого команда \`collectstatic\` **один раз, при деплое**, собирает все статические файлы из всех приложений (и из \`STATICFILES_DIRS\`) в единую директорию, указанную в \`STATIC_ROOT\`:

\`\`\`python
# settings.py
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
\`\`\`

\`\`\`bash
python manage.py collectstatic --noinput
\`\`\`

После этого именно содержимое \`STATIC_ROOT\` (а не разрозненные папки приложений) отдается веб-сервером напрямую.

## Почему так, а не "на лету" как в разработке

1. **Производительность.** Поиск файла по множеству директорий приложений на каждый запрос — заметные накладные расходы. Собранная в одну папку статика отдается веб-сервером мгновенно, без участия Python-кода вообще.
2. **Единая точка для CDN/облачного хранилища.** \`STATIC_ROOT\` — это то, что затем можно целиком загрузить на CDN (CloudFront, Cloudflare) или в объектное хранилище (S3, Google Cloud Storage) одной операцией при деплое.
3. **Django НЕ должен отдавать статику в production вообще.** \`django.contrib.staticfiles\` не предназначен для обслуживания статики под реальной нагрузкой — эта ответственность полностью передается веб-серверу или CDN.

## Правильная схема раздачи статики в production

### Вариант 1: Nginx отдает статику напрямую с диска

\`\`\`nginx
server {
    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /app/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
    }
}
\`\`\`

Запросы к \`/static/*\` и \`/media/*\` вообще не доходят до Django/Gunicorn — Nginx отдает файл прямо с диска, что кратно быстрее.

### Вариант 2: CDN / облачное хранилище (S3 + CloudFront и подобные)

Для более серьезных нагрузок или геораспределенной аудитории статика загружается в объектное хранилище (например, через \`django-storages\`), а перед ним ставится CDN:

\`\`\`python
# settings.py (пример с django-storages + S3)
STORAGES = {
    "default": {"BACKEND": "storages.backends.s3.S3Storage"},
    "staticfiles": {"BACKEND": "storages.backends.s3.S3StaticStorage"},
}
AWS_STORAGE_BUCKET_NAME = "my-bucket"
\`\`\`

Плюсы: статика отдается географически близко к пользователю через edge-серверы CDN, сервер приложения полностью освобожден от этой нагрузки, легко масштабируется независимо от Django-инстансов.

### Вариант 3: WhiteNoise (упрощенный вариант без отдельного Nginx для статики)

Библиотека \`whitenoise\` позволяет отдавать статику эффективно прямо из WSGI-приложения (со сжатием, хешированием имен файлов для долгого кэширования, "immutable" заголовками) — удобно для небольших проектов или платформ, где нет прямого контроля над Nginx (например, некоторые PaaS).

\`\`\`python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # сразу после security middleware
    ...
]
STORAGES = {"staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}}
\`\`\`

## Медиа-файлы (загружаемые пользователями) — важное отличие

Статика (\`STATIC_ROOT\`) — файлы, известные на этапе деплоя (CSS/JS/иконки приложения). **Медиа** (\`MEDIA_ROOT\`) — файлы, загружаемые пользователями во время работы приложения (аватары, документы, изображения товаров).

Для медиа \`collectstatic\` не применяется — эти файлы нужно хранить в **персистентном** и предпочтительно распределенном хранилище:
- На одном сервере с примитивной инфраструктурой — просто отдельная директория, отдаваемая Nginx напрямую (как в примере выше).
- В более серьезной инфраструктуре — **обязательно объектное хранилище (S3 и подобные)**, а не локальный диск, так как при горизонтальном масштабировании (несколько серверов приложения) локальный диск каждого сервера независим, и файл, загруженный через один инстанс, не будет виден с другого.

## Итоговое правило

**Django-процесс (Gunicorn/uWSGI) никогда не должен быть тем, что реально отдает статические или медиа-файлы под нагрузкой в production** — эта работа делегируется веб-серверу, CDN или специализированной библиотеке типа WhiteNoise, а \`collectstatic\` — это шаг подготовки, который делает такую делегацию возможной.`,
  },
  {
    id: "django-scaling-monolith-high-load-evolution",
    question:
      "Как масштабировать монолитное Django-приложение при кратно возрастающей нагрузке? Опишите эволюцию архитектуры (от одного сервера до распределенной системы).",
    category: "Архитектура, проектирование и высокие нагрузки",
    difficulty: "senior",
    answer: `## Стадия 0: один сервер

Django, база данных и веб-сервер живут на одной машине. Работает для MVP и небольших нагрузок, но у этой стадии единая точка отказа (single point of failure) на всех уровнях — падение сервера означает полный простой.

## Стадия 1: разделение приложения и БД

Первый шаг — вынести базу данных на отдельный сервер (managed БД или отдельная машина). Это позволяет масштабировать вычислительные ресурсы Django-сервера и БД независимо, а также снижает конкуренцию за CPU/RAM между веб-процессами и СУБД.

## Стадия 2: горизонтальное масштабирование Django (несколько инстансов + балансировщик)

\`\`\`
                    ┌─→ Django instance 1 (Gunicorn)
Load Balancer (Nginx/ELB) ─→ Django instance 2 (Gunicorn)
                    └─→ Django instance 3 (Gunicorn)
                              ↓
                         PostgreSQL (один сервер)
\`\`\`

На этой стадии критически важно, чтобы приложение было **stateless** — сессии и любое состояние между запросами не должны храниться в памяти конкретного процесса/сервера (иначе балансировщик может отправить следующий запрос пользователя на другой инстанс, у которого этого состояния нет). Сессии переносятся в общее хранилище — БД или, чаще, Redis.

## Стадия 3: кэширование и разгрузка БД

Вводится распределенный кэш (Redis/Memcached) для часто запрашиваемых, редко меняющихся данных — снижает нагрузку на БД без изменения архитектуры приложения. Параллельно тяжелые/медленные операции выносятся в фон через Celery, чтобы не занимать веб-воркеры.

## Стадия 4: масштабирование базы данных

Когда один сервер БД становится бутылочным горлышком:

1. **Read replicas (реплики на чтение)** — большинство нагрузки в типичном веб-приложении приходится на чтение. Django поддерживает **database routing**: можно направить запросы на чтение в реплики, а записи — в основной сервер (master).

\`\`\`python
DATABASES = {
    "default": {...},          # master, для записи
    "replica": {...},          # read-реплика
}

class PrimaryReplicaRouter:
    def db_for_read(self, model, **hints):
        return "replica"
    def db_for_write(self, model, **hints):
        return "default"
\`\`\`

2. **Вертикальное масштабирование БД** — увеличение ресурсов сервера БД (часто самый простой первый шаг, но имеет физический потолок).
3. **Партиционирование/шардирование** — при действительно больших объемах данных (см. отдельный вопрос ниже).

## Стадия 5: CDN и статика/медиа вне приложения

Статика и медиа полностью выносятся на CDN/объектное хранилище (см. предыдущие вопросы) — снимает эту нагрузку с серверов приложения полностью, приближает контент к пользователю географически.

## Стадия 6: разделение по доменам (модульный монолит → выделение сервисов)

При росте команды и сложности домена монолит может начать мешать — разные части системы масштабируются с разной интенсивностью (например, обработка платежей нагружена иначе, чем каталог товаров). Здесь возможны два пути:
- **Модульный монолит** — более строгое разделение внутри одного проекта (по Django apps с четкими границами, минимальными связями), без разбиения на отдельные сервисы физически — часто достаточная промежуточная мера.
- **Выделение микросервисов** для конкретных высоконагруженных или изолированных по домену частей (см. следующий вопрос) — обычно только когда модульность внутри монолита реально упирается в организационные или технические ограничения.

## Стадия 7: асинхронная архитектура и очереди сообщений между сервисами

На уровне распределенной системы вместо синхронных HTTP-вызовов между сервисами вводится событийная архитектура (message broker — Kafka/RabbitMQ) для слабой связанности сервисов, устойчивости к временной недоступности отдельных компонентов и лучшей масштабируемости под пиковые нагрузки.

## Ключевой принцип на каждом шаге

**Не масштабировать заранее без измерений.** На каждой стадии нужны метрики (время ответа, нагрузка на БД, количество запросов в секунду), чтобы понимать, какой именно компонент является текущим бутылочным горлышком — усложнение архитектуры (шардирование, микросервисы, событийная шина) добавляет операционные издержки и должно вводиться только тогда, когда более простые меры (кэш, реплики, вертикальное масштабирование) уже не справляются.`,
  },
  {
    id: "django-microservice-extraction-reliable-communication",
    question:
      "В каких случаях вы предпочтете вынести часть функционала из Django в отдельный микросервис (например, на FastAPI или Go), и как организуете надежное взаимодействие между ними?",
    category: "Архитектура, проектирование и высокие нагрузки",
    difficulty: "senior",
    answer: `## Когда действительно стоит выносить функционал в отдельный сервис

Выделение микросервиса — это компромисс: он решает проблемы масштабирования и организационной изоляции, но добавляет сетевую сложность, необходимость обеспечивать согласованность данных между сервисами и операционные издержки (деплой, мониторинг, версионирование контрактов). Стоит выносить, когда:

**1. Радикально разные требования к производительности/масштабированию.** Например, сервис приема вебхуков или высокочастотного стриминга данных должен масштабироваться независимо от основного монолита, который отдает обычные страницы — держать их в одном процессе означает масштабировать все приложение целиком ради одной горячей точки.

**2. Разные технологические требования.** Задача принципиально лучше решается на другом стеке — например, вычислительно интенсивная обработка данных на Go из-за GIL-ограничений Python, или низколатентный realtime-слой на FastAPI/асинхронном стеке, тогда как основной бизнес-домен остается на Django из-за богатства ORM и admin-панели.

**3. Организационная изоляция (границы команд).** Если отдельная команда владеет частью функциональности целиком (например, платежный домен, рекомендательная система) и должна деплоить независимо от остального приложения — микросервис дает четкую границу ответственности (соответствует принципу Conway's Law: архитектура системы отражает структуру коммуникации команд).

**4. Изоляция критичных по надежности частей.** Например, обработка платежей выносится отдельно, чтобы баг или падение в остальной части приложения не мог случайно повлиять на платежный поток, и наоборот — чтобы deploy основного приложения не создавал риск для платежей.

**5. Разные требования к безопасности/compliance.** Часть системы, работающая с особо чувствительными данными (PCI DSS для платежей, медицинские данные), выигрывает от изоляции в отдельный периметр с более строгим контролем доступа.

## Когда НЕ стоит

Если единственная причина — "модно" или "у всех микросервисы" — без реальных технических/организационных драйверов это создает распределенный монолит: все минусы (сетевые издержки, сложность деплоя, согласованность данных) без реальных плюсов независимого масштабирования.

## Как организовать надежное взаимодействие между Django и микросервисом

### 1. Синхронный HTTP/REST — для запрос-ответ сценариев с низкой связанностью

\`\`\`python
import httpx
from django.conf import settings

def get_recommendation(user_id):
    try:
        response = httpx.get(
            f"{settings.RECOMMENDATION_SERVICE_URL}/users/{user_id}/recommendations",
            timeout=2.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError:
        return []   # graceful degradation — сервис недоступен, но основной функционал не должен падать
\`\`\`

Критически важно: **таймауты, retry с экспоненциальной задержкой, и circuit breaker** — без них временная недоступность микросервиса может "положить" и основное приложение (например, если запросы к недоступному сервису зависают, накапливая занятые worker-процессы Django).

### 2. Событийная асинхронная коммуникация — для операций, не требующих немедленного ответа

Через message broker (RabbitMQ/Kafka) — Django публикует событие, микросервис подписывается и обрабатывает его асинхронно, без прямой синхронной зависимости.

\`\`\`python
# Django-приложение при создании заказа публикует событие, а не вызывает сервис напрямую
def create_order(order_data):
    order = Order.objects.create(**order_data)
    publish_event("order.created", {"order_id": order.id})
    return order
\`\`\`

Преимущество: если сервис-подписчик временно недоступен, событие остается в очереди и будет обработано позже — система устойчива к временным сбоям отдельных компонентов (в отличие от синхронного HTTP-вызова, который просто провалится).

### 3. Контракт между сервисами — версионирование API

Обязательно версионировать API (\`/v1/\`, \`/v2/\`) и поддерживать обратную совместимость при изменениях, так как сервисы деплоятся независимо — старая версия одного сервиса должна продолжать работать с новой версией другого в течение переходного периода.

### 4. Согласованность данных без распределенных транзакций

Классические ACID-транзакции не работают через границы сервисов. Используются паттерны:
- **Saga pattern** — последовательность локальных транзакций с компенсирующими действиями при ошибке на любом из шагов.
- **Eventual consistency** — данные в разных сервисах могут временно быть не синхронизированы, но со временем (через события) приходят к согласованному состоянию — приемлемо для большинства бизнес-сценариев, но должно быть явным архитектурным решением, а не случайностью.

## Итоговый принцип

Выносить в отдельный сервис нужно по конкретной, измеримой причине (масштабирование, изоляция, технологические требования команды), а взаимодействие между Django и сервисом всегда должно быть спроектировано с учетом того, что сеть ненадежна: таймауты, retry, circuit breaker для синхронных вызовов, и события/очереди там, где допустима асинхронная обработка.`,
  },
  {
    id: "django-fault-tolerant-celery-parsing-thousands",
    question:
      "Как спроектировать отказоустойчивую систему фоновых задач для парсинга тысяч внешних ресурсов (например, с использованием Celery), избегая переполнения очередей и утечек памяти?",
    category: "Архитектура, проектирование и высокие нагрузки",
    difficulty: "senior",
    answer: `## Проблема

Парсинг тысяч внешних ресурсов — классический сценарий, где наивная реализация (\`for url in urls: parse.delay(url)\`) быстро приводит к: переполнению очереди broker'а, неконтролируемой нагрузке на внешние ресурсы (риск получить бан по IP), утечкам памяти в долгоживущих worker-процессах, и полному отсутствию видимости в то, что происходит с тысячами задач.

## 1. Ограничение параллелизма — rate limiting и concurrency control

Вместо того чтобы поставить в очередь все задачи одновременно, важно ограничить, сколько из них может выполняться параллельно и как часто.

\`\`\`python
@shared_task(rate_limit="10/s")   # не более 10 задач в секунду для этого типа задач
def parse_resource(url):
    ...
\`\`\`

Дополнительно — отдельные **очереди с разным приоритетом и своим количеством воркеров** для разных типов задач, чтобы массовый парсинг не "забивал" очередь для более критичных задач (например, отправки писем пользователям):

\`\`\`python
# celery.py
app.conf.task_routes = {
    "myapp.tasks.parse_resource": {"queue": "parsing"},
    "myapp.tasks.send_email": {"queue": "critical"},
}
\`\`\`

\`\`\`bash
celery -A myproject worker -Q parsing --concurrency=8
celery -A myproject worker -Q critical --concurrency=4
\`\`\`

## 2. Батчинг вместо одной задачи на один URL

Постановка отдельной Celery-задачи на каждый из тысяч URL создает огромный overhead на уровне broker'а (сериализация, доставка сообщений). Часто эффективнее группировать URL в батчи и обрабатывать пачками внутри одной задачи:

\`\`\`python
@shared_task
def parse_batch(urls_batch):
    for url in urls_batch:
        try:
            parse_single(url)
        except Exception:
            logger.exception("Failed to parse %s", url)
            continue   # одна неудачная ссылка не должна прерывать весь батч
\`\`\`

Также полезен **chunking через Celery canvas** (\`group\`, \`chord\`) — разбить весь список на управляемые группы задач с контролем завершения:

\`\`\`python
from celery import group

job = group(parse_batch.s(chunk) for chunk in chunked(all_urls, 100))
result = job.apply_async()
\`\`\`

## 3. Защита от переполнения очереди — backpressure

Если producer (например, планировщик, ставящий задачи) работает быстрее, чем worker'ы успевают их обрабатывать, очередь будет расти неограниченно, потребляя память broker'а. Механизмы защиты:
- **Ограничение размера очереди** на уровне broker'а (в RabbitMQ можно настроить \`max-length\` с политикой отбрасывания старых сообщений).
- **Мониторинг длины очереди** и приостановка постановки новых задач, если очередь превышает пороговое значение (например, через периодическую проверку в самом планировщике перед постановкой новой партии).
- **Обратное давление через ограниченное количество "в работе" задач** — не ставить следующую партию, пока не подтверждено завершение достаточной части предыдущей.

## 4. Утечки памяти в долгоживущих worker-процессах

Celery worker-процессы, обрабатывающие тысячи задач подряд, подвержены накоплению памяти — особенно если используются библиотеки с известными утечками (например, некоторые HTTP-клиенты или парсинг-библиотеки, не освобождающие ресурсы корректно).

\`\`\`python
# celery.py — принудительный перезапуск worker-процесса после N выполненных задач
app.conf.worker_max_tasks_per_child = 100
# либо ограничение по потреблению памяти
app.conf.worker_max_memory_per_child = 200_000   # в килобайтах, ~200MB
\`\`\`

Это заставляет Celery периодически "освежать" процессы, сбрасывая накопленное состояние — простая, но очень эффективная защита от утечек, источник которых не всегда легко найти и исправить напрямую.

## 5. Таймауты и защита от "зависших" задач

Внешние ресурсы могут не отвечать вообще — без таймаута такая задача занимает worker навечно.

\`\`\`python
@shared_task(soft_time_limit=30, time_limit=45)
def parse_resource(url):
    # soft_time_limit — кидает исключение внутри задачи, можно поймать и почистить ресурсы
    # time_limit — жесткое принудительное завершение процесса, если задача не отреагировала на soft limit
    ...
\`\`\`

## 6. Идемпотентность и retry с ограничением

Внешние ресурсы часто временно недоступны — нужен retry, но не бесконечный, и не мгновенный (чтобы не создавать лавину повторных запросов):

\`\`\`python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def parse_resource(self, url):
    try:
        response = httpx.get(url, timeout=10)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))   # экспоненциальный backoff
\`\`\`

## 7. Наблюдаемость (observability)

При тысячах задач критически важно иметь видимость: **Flower** (веб-интерфейс мониторинга Celery) или экспорт метрик в Prometheus/Grafana — количество задач в очереди, успешные/неудачные, среднее время выполнения, использование памяти воркерами. Без этого невозможно оперативно заметить накопление проблем (растущую очередь, участившиеся ошибки к конкретному источнику).

## Итоговая архитектура

Отдельные очереди по приоритету → батчинг вместо задачи на URL → rate limiting на внешние ресурсы → ограничение памяти/задач на процесс (\`worker_max_tasks_per_child\`) → таймауты на каждую задачу → retry с экспоненциальным backoff и ограничением попыток → мониторинг очереди и воркеров как обязательная часть системы, а не опциональное дополнение.`,
  },
  {
    id: "django-database-sharding-partitioning-orm",
    question:
      "Как организовать шардирование (sharding) или партиционирование (partitioning) таблиц базы данных в рамках проекта на Django? Как при этом работать с ORM?",
    category: "Архитектура, проектирование и высокие нагрузки",
    difficulty: "senior",
    answer: `## Партиционирование vs шардирование — разница

**Партиционирование** — разделение одной большой таблицы на несколько физических частей (партиций) **внутри одной базы данных**, прозрачно для приложения (в идеале). Обычно по диапазону значений (дате, ID) или по хешу.

**Шардирование** — разделение данных на несколько **отдельных баз данных/серверов**, каждый из которых хранит только часть данных (например, пользователи с ID от 1 до 1млн на одном сервере, от 1млн до 2млн — на другом). Требует явной логики маршрутизации на уровне приложения.

## Партиционирование в PostgreSQL + Django

PostgreSQL поддерживает **декларативное партиционирование** таблиц (по диапазону, списку или хешу) на уровне самой БД. Django ORM не имеет встроенной прямой поддержки создания партиционированных таблиц через миграции "из коробки" в полной мере — типичный подход:

\`\`\`python
# создание партиционированной таблицы через RunSQL в миграции,
# так как стандартные Django-миграции не управляют партициями напрямую
from django.db import migrations

class Migration(migrations.Migration):
    operations = [
        migrations.RunSQL(
            """
            CREATE TABLE events (
                id bigserial,
                created_at timestamptz NOT NULL,
                payload jsonb
            ) PARTITION BY RANGE (created_at);

            CREATE TABLE events_2026_01 PARTITION OF events
                FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
            CREATE TABLE events_2026_02 PARTITION OF events
                FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
            """
        ),
    ]
\`\`\`

После создания партиционированной таблицы **обычные ORM-запросы продолжают работать без изменений** — \`Event.objects.filter(created_at__gte=...)\` — PostgreSQL сам определяет (partition pruning), к каким партициям нужно обратиться, приложение об этом не задумывается. Управление партициями (создание новых по расписанию, удаление старых) обычно делается через периодическую задачу Celery Beat или сторонние инструменты (\`pg_partman\`).

Партиционирование эффективно решает проблемы для очень больших, преимущественно "истории" таблиц (логи, события, аналитика), где старые партиции можно целиком удалять/архивировать, а запросы почти всегда затрагивают только последние партиции.

## Шардирование в Django — сложнее, требует явной маршрутизации

Django из коробки не поддерживает автоматическое шардирование, но предоставляет механизм **database routers** для маршрутизации запросов на конкретную БД:

\`\`\`python
# settings.py
DATABASES = {
    "default": {...},
    "shard_0": {...},   # физически отдельная БД
    "shard_1": {...},
    "shard_2": {...},
}
DATABASE_ROUTERS = ["myapp.routers.ShardRouter"]
\`\`\`

\`\`\`python
# routers.py
class ShardRouter:
    def _shard_for(self, instance_or_pk):
        pk = instance_or_pk.pk if hasattr(instance_or_pk, "pk") else instance_or_pk
        shard_index = pk % 3   # простая хеш-стратегия по остатку от деления
        return f"shard_{shard_index}"

    def db_for_read(self, model, **hints):
        instance = hints.get("instance")
        if instance and model.__name__ == "UserData":
            return self._shard_for(instance)
        return None   # None = использовать default routing

    def db_for_write(self, model, **hints):
        return self.db_for_read(model, **hints)
\`\`\`

## Ключевая сложность — выбор ключа шардирования (shard key)

Самое важное архитектурное решение при шардировании — по какому полю распределять данные (обычно \`user_id\` или \`tenant_id\`). Ключ должен обеспечивать:
- **Равномерное распределение** — избегать "горячих" шардов, куда попадает намного больше данных/трафика, чем в остальные.
- **Локальность запросов** — большинство запросов приложения должны затрагивать только один шард (запросы, требующие данных из нескольких шардов одновременно — cross-shard queries — не могут использовать обычный JOIN и требуют либо запросов к каждому шарду с последующим объединением на уровне приложения, либо денормализации данных).

## Проблемы, которые шардирование создает для ORM-паттернов

1. **JOIN между шардами невозможен на уровне БД** — если связанные данные оказались на разных шардах, ORM не сможет сделать обычный \`select_related\`/\`prefetch_related\` через границу шардов; такие связи нужно либо избегать архитектурно (держать тесно связанные данные на одном шарде по общему ключу), либо собирать данные отдельными запросами на уровне приложения.
2. **Транзакции не работают через шарды** — атомарность гарантирована только внутри одной БД; операции, затрагивающие несколько шардов, требуют паттернов типа Saga (см. вопрос про микросервисы) вместо \`transaction.atomic()\`.
3. **Уникальность ID** — автоинкрементный \`id\` каждого шарда независим, что может привести к коллизиям при попытке объединить данные; решение — использовать глобально уникальные идентификаторы (UUID, или префиксация ID номером шарда).
4. **Миграции должны применяться к каждому шарду отдельно** — обычная команда \`migrate\` применяется к одной БД, для шардированной системы нужен скрипт, прогоняющий миграции по всем шардам.

## Практический совет

Партиционирование (в рамках одной БД) стоит выбирать по умолчанию, если проблема — размер одной таблицы (историчные данные, логи). Полноценное шардирование (на несколько БД) — существенно более сложное и дорогое решение, которое стоит вводить только когда вертикальное масштабирование одной БД, read-реплики и партиционирование уже не справляются с нагрузкой записи или объемом данных, так как оно затрагивает практически весь слой работы с данными в приложении.`,
  },
  {
    id: "django-cqrs-event-sourcing-applicability",
    question:
      "Расскажите о паттернах CQRS и Event Sourcing. Целесообразно ли их применять в экосистеме Django, и если да, то какими инструментами?",
    category: "Архитектура, проектирование и высокие нагрузки",
    difficulty: "senior",
    answer: `## CQRS (Command Query Responsibility Segregation)

Идея CQRS — разделить модель **записи (команды, изменяющие состояние)** и модель **чтения (запросы, только читающие данные)**, вместо использования единой модели для обоих. В классическом Django-приложении и то, и другое обычно идет через одну и ту же ORM-модель.

\`\`\`python
# Без CQRS — одна модель для всего
class Order(models.Model):
    status = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    # ... используется и для записи, и для чтения, и для отчетов
\`\`\`

\`\`\`python
# С CQRS — команда изменяет "write model"
class CreateOrderCommand:
    def execute(self, order_data):
        order = Order.objects.create(**order_data)
        publish_event("order.created", {...})
        return order

# "Read model" — отдельная, оптимизированная под чтение проекция,
# может быть даже в другой БД (например, денормализованная таблица для отчетов)
class OrderSummaryView(models.Model):   # представление или отдельная денормализованная таблица
    class Meta:
        managed = False
        db_table = "order_summary_view"
\`\`\`

**Зачем это нужно:** модели чтения и записи часто имеют кардинально разные требования — запись должна быть строго нормализована и консистентна, а чтение (особенно для отчетов, дашбордов, поиска) выигрывает от денормализации, специализированных индексов или вовсе другого хранилища (например, Elasticsearch для полнотекстового поиска, отдельная read-реплика с материализованными представлениями для аналитики).

## Event Sourcing

Идея Event Sourcing — хранить не **текущее состояние** объекта, а **полную историю событий**, которые привели к этому состоянию. Текущее состояние — это результат применения (replay) всех событий по порядку.

\`\`\`python
# Вместо хранения текущего order.status = "shipped"
# храним последовательность событий:
class OrderEvent(models.Model):
    order_id = models.UUIDField()
    event_type = models.CharField(max_length=50)   # "OrderCreated", "OrderPaid", "OrderShipped"
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

def get_order_state(order_id):
    events = OrderEvent.objects.filter(order_id=order_id).order_by("created_at")
    state = {}
    for event in events:
        state = apply_event(state, event)   # чистая функция, применяющая событие к состоянию
    return state
\`\`\`

**Преимущества:** полный аудит изменений "бесплатно" (кто, когда и что изменил — естественное свойство модели, а не отдельная система логирования), возможность восстановить состояние на любой момент времени, естественная интеграция с событийной архитектурой между сервисами.

**Стоимость:** значительно более сложная модель разработки — чтение состояния требует replay событий (или построения и поддержания снепшотов/проекций для производительности), запросы вида "найти все заказы со статусом X" не работают напрямую без построения отдельной read-модели (что естественно сочетается с CQRS).

## Целесообразность в экосистеме Django

Django построен вокруг ActiveRecord-подобной ORM с CRUD-моделями и admin-панелью, ориентированными именно на "текущее состояние объекта" — это прямо противоречит духу Event Sourcing и частично духу строгого CQRS. Полноценное применение обоих паттернов **не является "родным" для Django** и требует существенных архитектурных надстроек.

### Когда действительно оправдано

- **Домены, где аудит и история изменений — бизнес-критичны**: финансовые операции, юридически значимые действия, системы с высокими требованиями к трассируемости (кто и когда изменил что).
- **Части системы с сильно разной нагрузкой на чтение и запись** — CQRS без полного Event Sourcing (просто разделение read/write моделей, например через read-реплики и денормализованные представления) часто достаточно и гораздо проще, чем полный Event Sourcing.
- **Аналитика и отчетность поверх операционных данных** — материализованные представления или отдельное read-хранилище (data warehouse), заполняемое через события — распространенный, практичный паттерн даже в обычных Django-проектах.

### Когда не оправдано

Для типичного CRUD-приложения (интернет-магазин, блог, внутренний инструмент) с обычными требованиями к аудиту — Django ORM с обычными моделями, при необходимости с полем \`history\` (через \`django-simple-history\`) для аудита изменений, дает 90% пользы Event Sourcing при значительно меньшей сложности.

## Инструменты в экосистеме Django

- **django-simple-history** — практичный "легкий" аудит изменений моделей (хранит снимок состояния при каждом изменении) — не полноценный Event Sourcing, но закрывает большинство реальных потребностей в истории изменений.
- **Django + Celery/Kafka для событий** — реализация "мягкого" CQRS: команды через обычные Django views/сервисы, события публикуются в Kafka/RabbitMQ, отдельные consumer'ы строят read-модели (денормализованные таблицы, поисковые индексы Elasticsearch, кэш в Redis).
- **PostgreSQL Materialized Views** — для read-моделей, если полноценная событийная шина избыточна: обновляемые по расписанию или триггерам денормализованные представления для тяжелых отчетных запросов.
- Полноценные фреймворки Event Sourcing (в духе \`EventStoreDB\`) в Python-экосистеме менее развиты, чем, например, в Java/.NET (Axon, Marten) — при действительно строгих требованиях к Event Sourcing иногда рациональнее выделить этот конкретный домен в отдельный сервис на более подходящем стеке, а не встраивать его насильно в Django-монолит.

## Практический вывод

В большинстве Django-проектов оправдана **облегченная версия CQRS** (разделение моделей чтения и записи там, где это реально нужно — отчетность, поиск, аналитика) без полного Event Sourcing. Полный Event Sourcing стоит применять точечно, только там, где история изменений — это часть самой бизнес-логики, а не как архитектуру всего приложения.`,
  },
  {
    id: "django-orm-analytical-queries-raw-sql-boundary",
    question:
      "Как оптимизировать сложные аналитические запросы, которые Django ORM генерирует неэффективно? Где проходит граница, за которой стоит отказаться от ORM в пользу Raw SQL?",
    category: "Продвинутая работа с БД и PostgreSQL",
    difficulty: "senior",
    answer: `## Почему ORM плохо справляется со сложной аналитикой

Django ORM спроектирован вокруг работы с объектами (моделями) и хорошо справляется с типичными CRUD-запросами, но аналитические запросы часто требуют конструкций, которые ORM либо не умеет выразить напрямую, либо генерирует для них неоптимальный SQL: оконные функции со сложными комбинациями, множественные уровни агрегации, CTE (Common Table Expressions) с рекурсией, сложные \`UNION\`, специфичные для БД оптимизации плана выполнения.

## Первая линия оптимизации — остаться в ORM, но использовать его продвинутые возможности

### Оконные функции через Window

\`\`\`python
from django.db.models import F, Window
from django.db.models.functions import Rank

Sale.objects.annotate(
    rank=Window(expression=Rank(), partition_by=[F("region")], order_by=F("amount").desc())
)
\`\`\`

### Условная агрегация через Case/When

\`\`\`python
from django.db.models import Count, Case, When, IntegerField

Order.objects.aggregate(
    completed=Count(Case(When(status="completed", then=1), output_field=IntegerField())),
    cancelled=Count(Case(When(status="cancelled", then=1), output_field=IntegerField())),
)
\`\`\`

### Subquery/OuterRef для коррелированных подзапросов

\`\`\`python
from django.db.models import Subquery, OuterRef

latest_price = Price.objects.filter(product=OuterRef("pk")).order_by("-date").values("amount")[:1]
Product.objects.annotate(current_price=Subquery(latest_price))
\`\`\`

Эти инструменты закрывают значительную часть "сложных" запросов без выхода за пределы ORM — стоит исчерпать их, прежде чем переходить к Raw SQL, так как ORM-запросы остаются переносимыми между БД, проще тестируются и интегрируются с остальным кодом на уровне QuerySet (можно продолжать чейнить \`.filter()\`/\`.annotate()\`).

## Диагностика — прежде чем оптимизировать, нужно понять, что происходит

\`\`\`python
print(queryset.query)                      # итоговый SQL
from django.db import connection
print(connection.queries)                  # DEBUG=True, список выполненных запросов
\`\`\`

\`\`\`sql
EXPLAIN ANALYZE SELECT ...;   -- реальный план выполнения в PostgreSQL, с фактическим временем каждого шага
\`\`\`

Частые находки: отсутствие нужного индекса, ORM генерирует подзапрос там, где эффективнее был бы JOIN (или наоборот), избыточные \`DISTINCT\`, неоптимальный порядок условий в \`WHERE\`.

## Где проходит граница для перехода на Raw SQL

**1. CTE и рекурсивные запросы.** Django ORM не имеет нативной поддержки \`WITH RECURSIVE\` — для иерархических структур (дерево категорий, оргструктура) рекурсивный CTE почти всегда придется писать как raw SQL.

\`\`\`python
from django.db import connection

def get_category_tree(root_id):
    with connection.cursor() as cursor:
        cursor.execute("""
            WITH RECURSIVE category_tree AS (
                SELECT id, name, parent_id FROM categories WHERE id = %s
                UNION ALL
                SELECT c.id, c.name, c.parent_id
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
            )
            SELECT * FROM category_tree;
        """, [root_id])
        return cursor.fetchall()
\`\`\`

**2. Специфичные для конкретной СУБД функции/оптимизации**, не имеющие абстракции в Django (например, определенные PostgreSQL-специфичные приемы работы с индексами, специфичный синтаксис для upsert со сложной логикой конфликтов, полнотекстовый поиск с продвинутым ранжированием).

**3. Когда сгенерированный ORM запрос объективно медленнее эквивалентного вручную написанного SQL**, и это подтверждено через \`EXPLAIN ANALYZE\` — например, ORM иногда добавляет лишние JOIN'ы при сложных цепочках \`select_related\`/\`prefetch_related\`, или генерирует подзапрос там, где ручной JOIN с агрегацией был бы на порядок быстрее.

**4. Массовые батч-операции с нестандартной логикой** — например, upsert (\`INSERT ... ON CONFLICT DO UPDATE\`) со сложными условиями обновления, которые не выражаются через \`bulk_create(..., update_conflicts=True)\` (доступно с Django 4.1, но для нестандартных случаев может не хватать).

## Как использовать Raw SQL, не теряя интеграции с моделями

\`\`\`python
# Model.objects.raw() — возвращает экземпляры модели, а не сырые кортежи
orders = Order.objects.raw(
    "SELECT * FROM orders WHERE total > %s ORDER BY created_at DESC",
    [1000],
)

# Для сложных чистых агрегатов, где объекты модели не нужны — connection.cursor()
with connection.cursor() as cursor:
    cursor.execute("SELECT region, SUM(amount) FROM sales GROUP BY region")
    rows = cursor.fetchall()
\`\`\`

## Практический принцип

Оставаться в ORM, пока это дает читаемый и производительный код — переносимость между БД, встроенная защита от SQL-инъекций, интеграция с остальным приложением того стоят. Переходить на Raw SQL точечно — для конкретных запросов, где либо ORM не может выразить нужную конструкцию (рекурсивные CTE, специфичные оптимизации под конкретную СУБД), либо есть измеренное (через \`EXPLAIN ANALYZE\`), а не предполагаемое, преимущество в производительности. Полностью отказываться от ORM в пользу Raw SQL по всему проекту почти никогда не оправдано — теряется большая часть преимуществ Django как фреймворка.`,
  },
  {
    id: "django-postgresql-specific-fields-functions-limitations",
    question:
      "Какие специфичные для PostgreSQL поля и функции (например, ArrayField, JSONB, полнотекстовый поиск, триггеры) вы использовали в связке с Django, и какие у них есть ограничения?",
    category: "Продвинутая работа с БД и PostgreSQL",
    difficulty: "senior",
    answer: `## ArrayField

Хранит массив значений одного типа непосредственно в колонке — удобно для небольших списков без необходимости создавать отдельную связанную таблицу.

\`\`\`python
from django.contrib.postgres.fields import ArrayField

class Article(models.Model):
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)

Article.objects.filter(tags__contains=["python"])
Article.objects.filter(tags__overlap=["python", "django"])
\`\`\`

**Ограничения:**
- Работает только на PostgreSQL — миграция на другую СУБД потребует переписывания схемы и запросов.
- Плохо подходит, когда элементы массива нужно самостоятельно запрашивать, обновлять поштучно или связывать с другими таблицами — в таком случае честная связанная модель (ForeignKey/ManyToMany) более уместна.
- Индексация (GIN-индекс) нужна отдельно для эффективного поиска по содержимому массива на больших таблицах.

## JSONField (JSONB)

Хранит произвольную полуструктурированную JSON-структуру, PostgreSQL хранит её в бинарном формате JSONB, который поддерживает индексацию и эффективные операции запроса по вложенным ключам.

\`\`\`python
class Product(models.Model):
    attributes = models.JSONField(default=dict)

Product.objects.filter(attributes__color="red")
Product.objects.filter(attributes__specs__weight__gte=10)
Product.objects.filter(attributes__has_key="warranty")
\`\`\`

**Ограничения:**
- Теряется валидация на уровне схемы БД — структура JSON никак не проверяется на уровне СУБД (можно случайно записать несогласованные структуры в разные строки), в отличие от обычных колонок.
- Запросы по вложенным ключам менее производительны, чем по обычным индексированным колонкам, если не создан специальный GIN-индекс на JSONB-поле.
- Затрудняет агрегацию и JOIN по вложенным данным по сравнению с нормализованной структурой.
- Стоит использовать для действительно вариативных, слабоструктурированных данных (метаданные, настройки, атрибуты с произвольной схемой) — не как замену обычным колонкам/связанным моделям там, где структура заранее известна и стабильна.

## Полнотекстовый поиск (Full-Text Search)

Django предоставляет обертки над встроенным полнотекстовым поиском PostgreSQL:

\`\`\`python
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

Article.objects.annotate(
    search=SearchVector("title", "body"),
).filter(search=SearchQuery("django orm"))

# с ранжированием релевантности
query = SearchQuery("django orm")
Article.objects.annotate(
    rank=SearchRank(SearchVector("title", "body"), query)
).filter(search=query).order_by("-rank")
\`\`\`

Для производительности на больших таблицах — материализованное поле \`SearchVectorField\` с GIN-индексом, обновляемое через триггер БД или сигнал:

\`\`\`python
class Article(models.Model):
    search_vector = SearchVectorField(null=True)
    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]
\`\`\`

**Ограничения:**
- Встроенный полнотекстовый поиск PostgreSQL заметно уступает специализированным решениям (Elasticsearch, Meilisearch) в возможностях — нет полноценного fuzzy-поиска "из коробки" (хотя есть \`pg_trgm\` для триграмм), нет фасетного поиска, ограниченные возможности ранжирования и подсветки совпадений.
- Требует явного выбора языковой конфигурации (\`russian\`, \`english\`) для корректной работы стемминга — при неправильной настройке результаты поиска будут неточными.
- Подходит для задач среднего масштаба; при по-настоящему больших объемах данных и сложных требованиях к поиску (автодополнение, синонимы, множество фильтров) обычно все равно выносят поиск в отдельный специализированный сервис.

## Триггеры БД

Django ORM не управляет триггерами напрямую — они создаются через \`RunSQL\` в миграциях.

\`\`\`python
migrations.RunSQL(
    """
    CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $
    BEGIN
        NEW.search_vector := to_tsvector('russian', NEW.title || ' ' || NEW.body);
        RETURN NEW;
    END;
    $ LANGUAGE plpgsql;

    CREATE TRIGGER article_search_vector_update
    BEFORE INSERT OR UPDATE ON myapp_article
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();
    """,
    reverse_sql="DROP TRIGGER IF EXISTS article_search_vector_update ON myapp_article;",
)
\`\`\`

**Ограничения и риски:**
- **"Невидимая" логика для команды.** Триггеры выполняются на уровне БД, вне Python-кода — новый разработчик, читающий модели и сигналы Django, может не подозревать об их существовании, что усложняет понимание системы и отладку ("почему это поле обновилось само?").
- **Плохо тестируется в обычном Django test suite**, если тесты не настроены на реальное выполнение SQL-миграций (что обычно так и есть, но требует внимания).
- **Не переносится при смене СУБД** — привязывает проект к PostgreSQL сильнее, чем большинство остального ORM-кода.
- Оправданы для узкого круга задач — поддержание вычисляемых полей (как search_vector выше), инварианты на уровне данных, которые должны соблюдаться независимо от того, через какой путь были изменены данные (включая ручные SQL-скрипты в обход Django).

## Общий принцип использования PostgreSQL-специфичных возможностей

Эти инструменты дают реальную мощь и избавляют от избыточной инфраструктуры (например, не нужен отдельный Elasticsearch для простого поиска, не нужна отдельная таблица тегов для простого списка), но каждый выбор — это осознанный компромисс: привязка к конкретной СУБД, потеря части валидации/наглядности на уровне ORM, необходимость команде понимать не только Django, но и специфику PostgreSQL.`,
  },
  {
    id: "django-transaction-isolation-levels-race-conditions",
    question:
      "Объясните механику работы уровней изоляции транзакций. Как избежать состояний гонки (race conditions) при параллельном обновлении одних и тех же записей через Django ORM?",
    category: "Продвинутая работа с БД и PostgreSQL",
    difficulty: "senior",
    answer: `## Уровни изоляции транзакций (стандарт SQL)

Уровень изоляции определяет, насколько параллельно выполняющиеся транзакции "видят" изменения друг друга до их фиксации (commit).

| Уровень | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| Read Uncommitted | возможен | возможен | возможен |
| Read Committed (по умолчанию в PostgreSQL) | нет | возможен | возможен |
| Repeatable Read | нет | нет | возможен (в PostgreSQL фактически исключен благодаря MVCC) |
| Serializable | нет | нет | нет |

- **Dirty read** — чтение незафиксированных изменений другой транзакции.
- **Non-repeatable read** — повторное чтение той же строки в рамках одной транзакции дает разные результаты, потому что другая транзакция успела изменить и закоммитить данные между двумя чтениями.
- **Phantom read** — повторный запрос с тем же условием возвращает другой набор строк (появились/исчезли строки), потому что другая транзакция вставила/удалила подходящие записи.

PostgreSQL по умолчанию использует **Read Committed** — каждая инструкция внутри транзакции видит снимок данных, зафиксированный на момент начала именно этой инструкции (а не всей транзакции). Django по умолчанию не переопределяет уровень изоляции, наследуя настройку от PostgreSQL.

\`\`\`python
# при необходимости другой уровень изоляции задается на уровне соединения
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "OPTIONS": {"isolation_level": "serializable"},
    }
}
\`\`\`

## Race condition — классический пример

\`\`\`python
# Опасно: race condition при параллельных запросах
def decrement_stock(product_id, quantity):
    product = Product.objects.get(id=product_id)   # читаем quantity = 10
    if product.available >= quantity:
        product.available -= quantity               # два параллельных запроса оба видят available=10,
        product.save()                               # оба вычитают, итоговое значение некорректно
\`\`\`

Если два запроса выполняются параллельно, оба могут прочитать одно и то же значение \`available\` до того, как любой из них успеет его сохранить — классический **lost update**: результат одного из обновлений "теряется".

## Решение 1: F-выражения — атомарное обновление на уровне БД

\`\`\`python
from django.db.models import F

Product.objects.filter(id=product_id).update(available=F("available") - quantity)
\`\`\`

\`F()\` транслируется в SQL-выражение, вычисляемое **самой БД в момент выполнения UPDATE**, а не в Python — операция становится атомарной на уровне одного SQL-запроса, никакой race condition между чтением и записью не возникает, так как чтения как отдельного шага в Python вообще нет.

Ограничение: этот подход не позволяет проверить условие (\`available >= quantity\`) до обновления в том же атомарном шаге без дополнительной конструкции — для этого нужен \`select_for_update\` или условный \`UPDATE ... WHERE\`:

\`\`\`python
updated = Product.objects.filter(id=product_id, available__gte=quantity).update(
    available=F("available") - quantity
)
if updated == 0:
    raise InsufficientStockError()   # либо запись не найдена, либо available < quantity
\`\`\`

## Решение 2: select_for_update — пессимистичная блокировка

Когда логика сложнее, чем одно арифметическое выражение (например, нужно прочитать объект, выполнить сложную бизнес-проверку, и только потом решить, что записать):

\`\`\`python
from django.db import transaction

with transaction.atomic():
    product = Product.objects.select_for_update().get(id=product_id)
    if product.available < quantity:
        raise InsufficientStockError()
    product.available -= quantity
    product.save()
\`\`\`

\`select_for_update()\` блокирует выбранную строку до конца транзакции — любая другая транзакция, пытающаяся получить блокировку на ту же строку (через \`select_for_update\` или обычный \`UPDATE\`), будет **ждать**, пока первая транзакция не завершится (commit/rollback). Это гарантирует, что между чтением и записью никто другой не изменит эту строку.

Полезные модификаторы:

\`\`\`python
Product.objects.select_for_update(nowait=True).get(id=product_id)    # не ждать, сразу выбросить исключение, если заблокировано
Product.objects.select_for_update(skip_locked=True).filter(status="pending")  # пропустить уже заблокированные строки — полезно для очередей задач через БД
\`\`\`

## Решение 3: оптимистичная блокировка (optimistic locking)

Вместо блокировки строки на все время транзакции — сохраняется версия/timestamp записи, и при сохранении проверяется, не изменилась ли она с момента чтения:

\`\`\`python
class Product(models.Model):
    available = models.IntegerField()
    version = models.IntegerField(default=0)

def decrement_stock_optimistic(product_id, quantity):
    product = Product.objects.get(id=product_id)
    updated = Product.objects.filter(id=product_id, version=product.version).update(
        available=product.available - quantity,
        version=product.version + 1,
    )
    if updated == 0:
        raise ConcurrentModificationError()   # кто-то успел изменить запись первым — нужно повторить операцию
\`\`\`

**Пессимистичная (\`select_for_update\`) vs оптимистичная блокировка** — выбор зависит от степени конкуренции: при высокой конкуренции за одну и ту же запись (горячий товар с ограниченным количеством) пессимистичная блокировка эффективнее (нет расточительных повторных попыток), при низкой конкуренции оптимистичная блокировка эффективнее (нет издержек на удержание блокировки, когда конфликты редки).

## Уровень Serializable — самая строгая гарантия

При \`Serializable\` PostgreSQL гарантирует, что результат параллельного выполнения транзакций эквивалентен какому-то последовательному порядку их выполнения — самая сильная гарантия, но она реализована через обнаружение конфликтов "постфактум": транзакция может быть отклонена с ошибкой сериализации при коммите, и приложение должно быть готово **повторить всю транзакцию** при такой ошибке.

\`\`\`python
from django.db import transaction, OperationalError
import time

for attempt in range(3):
    try:
        with transaction.atomic():
            # логика, требующая максимальной изоляции
            ...
        break
    except OperationalError:
        time.sleep(0.1 * (attempt + 1))
else:
    raise Exception("Не удалось выполнить транзакцию после нескольких попыток")
\`\`\`

## Практический вывод

Для большинства сценариев в Django-проектах достаточно: **F-выражения** для простых атомарных арифметических обновлений, **select_for_update** для более сложной логики "прочитать-проверить-изменить" в рамках небольшого числа строк. Повышение уровня изоляции до Serializable — редкий, тяжелый инструмент для случаев с действительно критичными требованиями к консистентности, требующий явной обработки retry-логики на уровне приложения.`,
  },
  {
    id: "django-soft-delete-manager-queryset-integration",
    question:
      "Как реализовать механизм \"мягкого удаления\" (soft delete) на уровне базы данных и прозрачно интегрировать его в методы менеджеров и QuerySet?",
    category: "Продвинутая работа с БД и PostgreSQL",
    difficulty: "senior",
    answer: `## Идея soft delete

Вместо физического удаления строки из БД (\`DELETE\`), запись помечается как удаленная (обычно через поле \`is_deleted\`/\`deleted_at\`), а затем **прозрачно исключается** из обычных запросов — приложение продолжает работать так, как будто записи не существует, но данные физически сохраняются (для истории, восстановления, аудита, соответствия юридическим требованиям хранения данных).

## Базовая модель

\`\`\`python
from django.db import models
from django.utils import timezone

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        # переопределяем bulk delete на уровне QuerySet — QuerySet.delete() иначе выполнил бы реальный DELETE
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()   # настоящее физическое удаление, когда оно действительно нужно

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        # по умолчанию менеджер видит только "живые" записи
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class AllObjectsManager(models.Manager):
    def get_queryset(self):
        # отдельный менеджер для доступа ко всем записям, включая удаленные
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()        # используется по умолчанию везде, включая related managers
    all_objects = AllObjectsManager()    # явный доступ ко всем записям

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)


class Article(SoftDeleteModel):
    title = models.CharField(max_length=200)
\`\`\`

## Прозрачность через переопределение delete() на трех уровнях

Важно перехватить удаление на **всех** трех уровнях, где Django позволяет удалять объекты — иначе часть путей удаления "просочится" мимо soft delete логики:

1. **\`instance.delete()\`** — переопределен в модели (пример выше).
2. **\`QuerySet.delete()\`** — переопределен в \`SoftDeleteQuerySet\` (пример выше) — иначе \`Article.objects.filter(...).delete()\` выполнит настоящий DELETE в БД.
3. **Каскадное удаление через related objects** — самая коварная часть: если \`Article\` имеет \`ForeignKey\` с \`on_delete=CASCADE\` на другую модель, обычное поведение Django — реальное каскадное удаление на уровне БД/Django, что обходит переопределенный \`delete()\`. Для полностью консистентного soft delete нужно либо реализовывать soft-delete-совместимый каскад вручную (например, через сигнал \`pre_delete\`, перехватывающий попытку каскада), либо использовать сторонние библиотеки (\`django-safedelete\`), уже решившие эту проблему.

## Ограничение по умолчанию для related managers

Ключевая деталь: если \`objects\` — это \`SoftDeleteManager\`, Django автоматически использует его и для related-запросов (\`article.comments.all()\` при условии, что \`Comment.objects\` — тоже soft-delete-менеджер) — то есть удаленные объекты прозрачно скрываются во всех местах, где используется менеджер по умолчанию, без необходимости добавлять \`.filter(deleted_at__isnull=True)\` в каждом запросе по всему проекту.

## Уникальные ограничения (unique constraints) и soft delete

**Частая проблема:** если на поле есть \`unique=True\` (например, \`email\`), а запись "удалена" мягко, то создать новую запись с тем же email станет невозможно — база данных все еще видит старую (физически не удаленную) строку как занимающую это уникальное значение.

Решение — **частичный уникальный индекс (partial unique index)**, действующий только на неудаленные записи:

\`\`\`python
class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=["email"],
            condition=models.Q(deleted_at__isnull=True),
            name="unique_active_email",
        )
    ]
\`\`\`

Это специфичная для PostgreSQL (и некоторых других СУБД) возможность частичных индексов — уникальность обеспечивается только среди "живых" записей, удаленные записи не блокируют повторное использование значения.

## Восстановление (undelete)

\`\`\`python
def restore(self):
    self.deleted_at = None
    self.save(update_fields=["deleted_at"])
\`\`\`

## Компромиссы soft delete, о которых нужно знать

1. **Индексы должны учитывать \`deleted_at\`** — большинство запросов теперь неявно фильтруют по нему, стоит делать составные индексы вида \`(deleted_at, часто_используемое_поле)\` для сохранения производительности.
2. **Рост объема таблицы со временем** — данные никогда физически не удаляются (если не предусмотрена отдельная задача периодической физической очистки старых soft-deleted записей).
3. **Усложнение всех связанных запросов и агрегаций** — разработчикам нужно постоянно помнить о разнице между \`objects\` (живые) и \`all_objects\` (все), особенно в отчетах и административных интерфейсах.
4. **Административная панель Django** по умолчанию тоже будет использовать \`objects\` — значит, стандартный \`admin.ModelAdmin\` не покажет удаленные записи, если явно не настроить его на \`all_objects\`.

## Когда soft delete оправдан, а когда нет

Оправдан там, где реально нужна возможность восстановления, юридические требования к хранению истории, или аудит "что было удалено и когда". Для данных, где такой необходимости нет (временные, служебные записи), soft delete добавляет постоянную сложность без реальной пользы — обычное физическое удаление или отдельная архивная таблица (куда переносятся данные перед реальным удалением) может быть более простым и предсказуемым решением.`,
  },
  {
    id: "django-index-locks-migrations-zero-downtime",
    question:
      "Что такое индексные блокировки (index locks) и как создание сложных индексов в Django-миграциях может повлиять на production-базу под высокой нагрузкой? Как провести миграцию без даунтайма?",
    category: "Продвинутая работа с БД и PostgreSQL",
    difficulty: "senior",
    answer: `## Проблема: обычное создание индекса блокирует таблицу

По умолчанию команда \`CREATE INDEX\` в PostgreSQL берет **блокировку \`SHARE\`** на таблицу на все время построения индекса. Эта блокировка **не блокирует чтение (SELECT)**, но **блокирует любые операции записи** (\`INSERT\`, \`UPDATE\`, \`DELETE\`) на этой таблице до завершения построения индекса.

Для маленькой таблицы это может быть незаметно (индекс строится за миллисекунды), но для таблицы с миллионами строк построение индекса может занять минуты, а иногда десятки минут — и все это время **все записи в таблицу на production будут заблокированы**, что для высоконагруженного приложения означает видимый простой (пользователи не могут создавать заказы, сохранять данные и т.д.), даже если формальный "деплой" прошел без ошибок.

\`\`\`python
# Обычная Django-миграция — опасно на большой таблице в production
class Migration(migrations.Migration):
    operations = [
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ),
    ]
\`\`\`

Django по умолчанию оборачивает миграции PostgreSQL в транзакцию, и обычный \`CREATE INDEX\` внутри такой транзакции держит блокировку на всё время выполнения операции.

## Решение: CONCURRENTLY

PostgreSQL поддерживает \`CREATE INDEX CONCURRENTLY\` — строит индекс, **не блокируя записи** в таблицу (ценой того, что построение занимает дольше и требует двух проходов по таблице).

Django поддерживает это через \`AddIndexConcurrently\` (из \`django.contrib.postgres.operations\`):

\`\`\`python
from django.contrib.postgres.operations import AddIndexConcurrently

class Migration(migrations.Migration):
    atomic = False   # обязательно! CONCURRENTLY не может выполняться внутри транзакции

    operations = [
        AddIndexConcurrently(
            model_name="order",
            index=models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ),
    ]
\`\`\`

**Критически важная деталь:** \`atomic = False\` на уровне класса миграции обязателен — PostgreSQL физически не позволяет выполнить \`CREATE INDEX CONCURRENTLY\` внутри блока транзакции (получите ошибку при попытке). Это также означает, что при сбое посреди построения индекса миграция **не откатится автоматически** — может остаться "невалидный" индекс (\`INVALID\` в \`pg_indexes\`), который нужно будет вручную удалить и попробовать заново.

## Аналогичная проблема с NOT NULL и другими constraint

Добавление \`NOT NULL\` ограничения на существующую колонку большой таблицы в старых версиях PostgreSQL требовало полного сканирования таблицы под блокировкой \`ACCESS EXCLUSIVE\` (самая строгая блокировка — блокирует вообще все операции, включая чтение). Начиная с PostgreSQL 12+, если на колонке уже есть \`CHECK\` constraint, гарантирующий отсутствие NULL, добавление \`NOT NULL\` может быть быстрым (метаданные), но это нужно проверять и планировать явно, не полагаясь на то, что Django-миграция автоматически выберет оптимальный путь.

## Общая стратегия безопасного изменения схемы под нагрузкой (zero-downtime migrations)

**1. Разделение миграции на независимые, обратно совместимые шаги.** Ни один шаг не должен ломать текущую версию кода, работающую в production, пока не выкачен новый код.

Пример — добавление нового обязательного поля:
- **Шаг 1:** добавить поле как nullable (\`null=True\`) — быстрая операция, не требует полного сканирования таблицы.
- **Шаг 2:** задеплоить код, который **пишет** в новое поле для всех новых записей (но старый код на этот момент еще может не знать о поле — это нормально, так как поле nullable).
- **Шаг 3:** отдельная миграция данных (data migration / management command) — заполнить значение для всех существующих строк, желательно **батчами**, а не одним большим \`UPDATE\`, чтобы не держать долгую блокировку и не создавать один гигантский WAL-всплеск.

\`\`\`python
def backfill_field(apps, schema_editor):
    Order = apps.get_model("myapp", "Order")
    batch_size = 5000
    while Order.objects.filter(new_field__isnull=True).exists():
        ids = list(Order.objects.filter(new_field__isnull=True).values_list("id", flat=True)[:batch_size])
        Order.objects.filter(id__in=ids).update(new_field=compute_default_value())
\`\`\`

- **Шаг 4:** только после того как все данные заполнены и весь код обновлен — отдельная миграция, добавляющая \`NOT NULL\` constraint.

**2. Никогда не переименовывать колонку/таблицу одной миграцией на production.** Переименование ломает старый код, который еще может выполняться (при rolling deployment несколько версий кода работают одновременно). Правильный путь: добавить новое поле → писать в оба поля какое-то время → перевести чтение на новое поле → убедиться, что весь трафик переключился → удалить старое поле отдельной, более поздней миграцией.

**3. Удаление колонки — тоже в два шага.** Сначала задеплоить код, который перестал использовать поле, дождаться, чтобы все инстансы приложения точно обновились (нет старых процессов, все еще пишущих в это поле), и только потом — миграция, физически удаляющая колонку.

**4. Мониторинг длительных миграций.** Перед применением на production — оценить время выполнения на копии данных сопоставимого размера (staging с похожим объемом данных), и по возможности применять тяжелые миграции в период минимальной нагрузки, даже если формально они не блокируют чтение.

**5. Explicit lock timeout как защита.** Можно явно ограничить время ожидания блокировки, чтобы миграция не "подвесила" всю систему в очереди на блокировку, а быстро завершилась с ошибкой, если таблица занята дольше допустимого:

\`\`\`sql
SET lock_timeout = '5s';
\`\`\`

## Итоговый принцип

Любое изменение схемы на таблице с высокой интенсивностью записи нужно рассматривать через призму: "какую блокировку это возьмет, и на сколько времени?" — использовать \`CONCURRENTLY\` для индексов, разбивать на множество обратно совместимых шагов вместо одной "большой" миграции, и заполнять/менять данные батчами, а не одной операцией над всей таблицей целиком.`,
  },
  {
    id: "django-app-initialization-django-setup-internals",
    question:
      "Разберите по шагам, как именно Django инициализирует приложение при запуске (от wsgi.py/asgi.py до готовности принимать запросы). Что происходит внутри django.setup()?",
    category: "Внутреннее устройство фреймворка (Under the Hood)",
    difficulty: "senior",
    answer: `## Точка входа — wsgi.py/asgi.py

\`\`\`python
# wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
application = get_wsgi_application()
\`\`\`

Сервер приложений (Gunicorn/uWSGI) импортирует этот модуль один раз при старте worker-процесса и вызывает \`get_wsgi_application()\` — это единственный момент, когда происходит вся тяжелая инициализация; дальше \`application\` — это просто вызываемый объект, обрабатывающий каждый входящий запрос.

## Шаг 1: DJANGO_SETTINGS_MODULE и ленивая загрузка настроек

\`os.environ.setdefault(...)\` только устанавливает переменную окружения — сами настройки еще не импортированы. Django использует объект \`django.conf.settings\`, который является **ленивым прокси** (\`LazySettings\`) — модуль настроек реально импортируется только при первом обращении к любому атрибуту \`settings\`, а не в момент импорта \`django.conf\`.

## Шаг 2: django.setup() — ядро инициализации

\`get_wsgi_application()\` вызывает \`django.setup()\` — это центральная точка, где происходит вся настройка приложения перед тем, как оно готово обрабатывать запросы. Внутри неё:

**2.1. Настройка логирования** — \`configure_logging()\` применяет конфигурацию из \`LOGGING\` в settings, до этого момента никакое логирование Django-специфичных обработчиков не настроено.

**2.2. \`apps.populate(settings.INSTALLED_APPS)\`** — самая важная часть, регистрация всех приложений происходит в три отдельные фазы:

\`\`\`python
# упрощенно то, что происходит внутри django.apps.registry.Apps.populate()

# Фаза 1: создание AppConfig для каждого приложения из INSTALLED_APPS
for entry in installed_apps:
    app_config = AppConfig.create(entry)
    self.app_configs[app_config.label] = app_config
# на этом этапе app_config.models_module еще None — модели физически не импортированы

# Фаза 2: импорт модуля models каждого приложения
for app_config in self.app_configs.values():
    app_config.import_models()
    # именно здесь Python впервые исполняет models.py каждого приложения,
    # и метакласс ModelBase регистрирует каждую модель в глобальном реестре apps

# Фаза 3: вызов app_config.ready() для каждого приложения
for app_config in self.app_configs.values():
    app_config.ready()
    # здесь обычно регистрируются сигналы (import signals) — важно, что это происходит
    # ПОСЛЕ того, как модели всех приложений уже импортированы, иначе сигналы могли бы
    # ссылаться на модели, которые еще не существуют
\`\`\`

Разделение на три строгие фазы — ключевой архитектурный момент: **все модели всех приложений сначала полностью регистрируются**, и только потом выполняется код \`ready()\` — это гарантирует, что к моменту, когда одно приложение в своем \`ready()\` захочет сослаться на модель другого приложения (например, для подключения сигнала), эта модель уже точно существует в реестре, независимо от порядка приложений в \`INSTALLED_APPS\`.

## Шаг 3: разрешение приложений с двусмысленными именами

Если несколько приложений имеют модуль с одинаковым именем, Django на этом этапе может выбросить ошибку — \`apps.populate()\` также проверяет уникальность меток приложений (\`app_label\`).

## Шаг 4: URL-конфигурация загружается лениво, при первом запросе

Важный нюанс: \`ROOT_URLCONF\` (файл \`urls.py\`) **не импортируется во время \`django.setup()\`** — он загружается лениво, при первом обращении к URL resolver'у (то есть фактически при первом входящем запросе, либо раньше, если что-то явно к нему обращается, например тесты). Это отдельный этап, не входящий в \`django.setup()\`.

## Шаг 5: middleware цепочка собирается при первом запросе

\`get_wsgi_application()\` возвращает экземпляр \`WSGIHandler\`, но сама цепочка middleware (обертывание \`view\`-функции слоями middleware в порядке, обратном списку в \`settings.MIDDLEWARE\`) строится лениво, при первом вызове обработчика — \`WSGIHandler.load_middleware()\`.

## Итоговая последовательность от старта процесса до первого ответа

1. Сервер приложений импортирует \`wsgi.py\`.
2. Устанавливается \`DJANGO_SETTINGS_MODULE\` (пока не импортируется).
3. \`get_wsgi_application()\` → \`django.setup()\`:
   - настраивается логирование;
   - \`apps.populate()\` — создание AppConfig → импорт models.py всех приложений (регистрация моделей через метакласс) → вызов \`ready()\` всех приложений (регистрация сигналов и прочей инициализации).
4. Возвращается объект \`WSGIHandler\`.
5. **При первом реальном запросе**: лениво загружается \`ROOT_URLCONF\`, строится цепочка middleware, дальше запрос проходит через middleware → URL resolver → view → обратно через middleware → ответ.

## Почему это важно понимать на практике

Частая ошибка — попытка обратиться к моделям Django (например, импортировать модель на уровне модуля) до того, как \`django.setup()\` завершился (например, в standalone-скриптах, использующих Django ORM вне управления \`manage.py\`) — приводит к \`AppRegistryNotReady\`. Также понимание трехфазной инициализации объясняет, почему сигналы принято регистрировать именно в \`AppConfig.ready()\`, а не на уровне модуля \`models.py\` — на момент импорта \`models.py\` других приложений могут быть еще не готовы.`,
  },
  {
    id: "django-template-engine-loading-compilation-bottleneck",
    question:
      "Как работает механизм загрузки и компиляции шаблонов под капотом? В каких случаях стандартный движок становится узким местом?",
    category: "Внутреннее устройство фреймворка (Under the Hood)",
    difficulty: "senior",
    answer: `## Общий конвейер обработки шаблона

\`\`\`
render(request, "articles/detail.html", context)
        ↓
1. Template loaders находят файл по имени (поиск по нескольким источникам)
        ↓
2. Lexer разбивает исходный текст шаблона на токены
        ↓
3. Parser строит дерево узлов (NodeList) — компиляция шаблона
        ↓
4. Каждый Node знает, как отрендерить себя в строку, используя Context
        ↓
5. Результат — готовая HTML-строка
\`\`\`

## Template loaders — поиск файла шаблона

Django ищет файл шаблона через цепочку загрузчиков (\`TEMPLATES[]["OPTIONS"]["loaders"]\`), пробуя их по очереди, пока один не найдет файл:

\`\`\`python
"loaders": [
    "django.template.loaders.filesystem.Loader",   # ищет в DIRS
    "django.template.loaders.app_directories.Loader",   # ищет в templates/ каждого INSTALLED_APPS
]
\`\`\`

По умолчанию (без \`cached\` loader) **каждый рендер шаблона заново читает файл с диска и заново его компилирует** — это заметные накладные расходы под нагрузкой.

## Lexer — токенизация

Lexer разбивает исходный текст на последовательность токенов четырех типов: обычный текст, переменная (\`{{ ... }}\`), тег (\`{% ... %}\`) и комментарий (\`{# ... #}\`). Это делается через регулярные выражения, ищущие эти разделители в тексте.

## Parser — построение дерева узлов (компиляция)

Parser проходит по токенам и строит **дерево объектов Node** — например, \`{% if %}\` превращается в \`IfNode\`, содержащий вложенный \`NodeList\` для каждой ветки, \`{{ variable }}\` — в \`VariableNode\`. Это дерево и есть результат "компиляции" шаблона — именно оно кэшируется механизмом \`cached.Loader\`, чтобы не разбирать шаблон заново при каждом запросе.

\`\`\`python
"loaders": [
    ("django.template.loaders.cached.Loader", [
        "django.template.loaders.filesystem.Loader",
        "django.template.loaders.app_directories.Loader",
    ]),
]
\`\`\`

\`django.template.loaders.cached.Loader\` кэширует уже скомпилированный объект \`Template\` (то есть построенное дерево \`Node\`) в памяти процесса — при следующем запросе к тому же шаблону файл не читается с диска и не парсится заново, используется готовое дерево. **В production это должно быть включено всегда** — Django включает его автоматически, когда \`DEBUG=False\` и используется \`APP_DIRS=True\` со стандартной конфигурацией, но при кастомной конфигурации \`loaders\` стоит проверить это явно.

## Rendering — обход дерева с контекстом

При каждом вызове \`render()\` дерево узлов обходится, и каждый \`Node.render(context)\` вызывается рекурсивно, подставляя значения из \`Context\`. Это происходит **при каждом запросе заново**, даже если само дерево (результат компиляции) закэшировано — то есть кэшируется парсинг, но не сам процесс рендеринга с конкретными данными (для этого есть отдельный кэш фрагментов шаблона, \`{% cache %}\`, рассмотренный в вопросе про кэширование).

## Разрешение переменных — точечный поиск (dot lookup)

\`{{ article.author.name }}\` — Django пробует несколько стратегий поиска для каждой части последовательно: словарный доступ (\`article["author"]\`), доступ к атрибуту (\`article.author\`), доступ к элементу списка по индексу, вызов метода без аргументов. Эта многослойная попытка "угадать", как правильно получить значение, происходит **на каждый рендер, для каждой переменной** — заметно медленнее, чем прямой доступ к атрибуту в обычном Python-коде, потому что задействован механизм try/except и множественные проверки типа.

## Когда стандартный движок Django (Django Template Language, DTL) становится узким местом

**1. Очень частый рендеринг одних и тех же шаблонов с большим количеством переменных и циклов.** Многослойный dot lookup и рекурсивный обход дерева узлов создают заметный overhead по сравнению с более "компилируемыми в чистый Python" движками.

**2. Сложная логика внутри шаблонов** (много вложенных тегов, кастомных template tags с собственной логикой) — DTL намеренно ограничен в логике (в шаблонах нельзя писать произвольные выражения, вызывать функции с аргументами и т.д.), и попытки обойти это через сложные кастомные теги часто медленнее, чем эквивалентная предвычисленная логика на уровне view.

**3. Рендеринг очень больших страниц/отчетов** с тысячами повторяющихся блоков (например, огромные таблицы) — накопленный overhead от обхода дерева узлов на каждый элемент становится заметным.

## Альтернатива — Jinja2

Django поддерживает Jinja2 как альтернативный движок шаблонов "из коробки" через \`django.template.backends.jinja2.Jinja2\`:

\`\`\`python
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.jinja2.Jinja2",
        "DIRS": [...],
        "APP_DIRS": True,
    },
]
\`\`\`

Jinja2 **компилирует шаблоны в реальный байткод Python** (а не строит дерево объектов Node, интерпретируемое на каждый рендер), что делает рендеринг заметно быстрее для тяжелых по логике или объему шаблонов — Jinja2 в бенчмарках обычно в несколько раз быстрее DTL на сопоставимых шаблонах. Плата — часть встроенных Django-специфичных тегов/фильтров (\`{% url %}\`, \`{% csrf_token %}\` и т.д.) недоступны напрямую или требуют явного проброса через контекст, а некоторые пакеты сторонних template tags написаны только под DTL.

## Практический вывод

Для подавляющего большинства Django-приложений производительность DTL не является узким местом — реальные проблемы производительности почти всегда лежат в N+1 запросах к БД или отсутствии кэширования, а не в самом механизме шаблонизации. Переход на Jinja2 оправдан, когда профилирование (например, через Django Debug Toolbar, показывающий время, потраченное именно на рендеринг шаблона) явно указывает на рендеринг как на узкое место, обычно на страницах с очень большим объемом повторяющегося контента.`,
  },
  {
    id: "django-modelbase-metaclass-internals",
    question:
      "Объясните внутреннее устройство метакласса ModelBase. Как Django преобразует декларативное описание полей класса в объекты для работы с базой данных?",
    category: "Внутреннее устройство фреймворка (Under the Hood)",
    difficulty: "senior",
    answer: `## Проблема, которую решает метакласс

Когда разработчик пишет:

\`\`\`python
class Article(models.Model):
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
\`\`\`

...это выглядит как обычный класс с атрибутами-объектами полей. Но реально нужное поведение — совсем другое: \`Article\` должен получить метод \`objects\` (менеджер для запросов к БД), знать имя таблицы, уметь генерировать SQL для CREATE TABLE, а обращение \`article_instance.title\` должно возвращать обычную Python-строку, а не объект \`CharField\`. Все это — работа метакласса \`ModelBase\`.

## Что такое метакласс — напоминание механики Python

Метакласс — это "класс класса": он определяет, что происходит **в момент создания самого класса** (не экземпляра), то есть код в \`ModelBase.__new__\` выполняется один раз, когда Python обрабатывает \`class Article(models.Model): ...\`, задолго до создания любого экземпляра \`Article\`.

\`\`\`python
class Model(metaclass=ModelBase):
    ...
\`\`\`

Любой класс, наследующий \`models.Model\`, автоматически использует \`ModelBase\` как метакласс.

## Что происходит внутри ModelBase.__new__ (упрощенно, но по существу)

**1. Отделение полей от прочих атрибутов класса.** \`ModelBase\` проходит по всем атрибутам создаваемого класса и находит те, что являются экземплярами \`Field\` (\`CharField\`, \`DateTimeField\` и т.д.) — они изымаются из обычного пространства имен класса и собираются отдельно.

**2. Создание объекта \`Options\` (мета-данные модели) — \`_meta\`.** На основе внутреннего класса \`Meta\` (если есть) и собранных полей создается объект \`ModelState\`/\`Options\`, доступный как \`Article._meta\` — он хранит имя таблицы, список всех полей, первичный ключ, ограничения уникальности, ordering и десятки других метаданных, используемых всей остальной системой (ORM-запросами, миграциями, admin).

\`\`\`python
Article._meta.db_table       # 'myapp_article'
Article._meta.fields         # список объектов Field
Article._meta.get_field("title")
\`\`\`

**3. Добавление каждого поля через \`field.contribute_to_class()\`.** Для каждого найденного поля вызывается его метод \`contribute_to_class(cls, name)\` — именно здесь происходит "магия" превращения декларативного описания в рабочий дескриптор:

\`\`\`python
# упрощенно то, что происходит для CharField
def contribute_to_class(self, cls, name):
    self.name = name
    self.model = cls
    cls._meta.add_field(self)
    setattr(cls, name, DeferredAttribute(self))   # дескриптор, а не сам объект Field!
\`\`\`

**Ключевой момент:** после этого шага \`Article.title\` (на уровне класса) — это уже не тот же объект \`CharField()\`, который писал разработчик, а **дескриптор** (\`DeferredAttribute\` или похожий), реализующий протокол \`__get__\`/\`__set__\`. Именно поэтому \`article_instance.title\` возвращает обычную Python-строку — дескриптор при обращении к атрибуту экземпляра достает значение из внутреннего хранилища \`instance.__dict__\`, а не возвращает объект поля.

**4. Автоматическое добавление первичного ключа**, если ни одно поле явно не помечено как \`primary_key=True\` — по умолчанию добавляется \`id = AutoField(primary_key=True)\`.

**5. Регистрация модели в глобальном реестре приложений** — \`apps.register_model(app_label, cls)\`. Именно этот шаг делает модель доступной через \`django.apps.apps.get_model(...)\` и заставляет её участвовать в системе миграций.

**6. Создание менеджеров** — если класс не определил свой \`objects\`, \`ModelBase\` добавляет менеджер по умолчанию (\`Manager()\`), связанный с моделью через тот же механизм \`contribute_to_class\`.

**7. Обработка \`abstract = True\`.** Если у модели \`Meta.abstract = True\`, она **не регистрируется** в реестре приложений и не получает отдельную таблицу — вместо этого её поля наследуются дочерними моделями (копируются в дочерний класс при создании его \`ModelBase.__new__\`).

## Почему это устроено именно так, а не через обычное наследование/декораторы

Такой подход через метакласс и дескрипторы позволяет полностью декларативный, "плоский" синтаксис описания модели (без явных вызовов регистрации, без наследования специальной фабрики) — но при этом дает Django полный контроль над тем, во что превращается каждое поле: и в объект для построения SQL (через \`_meta.fields\`), и в удобный Python-атрибут экземпляра (через дескрипторы), и в интроспектируемые метаданные для миграций и admin, — все из одного и того же декларативного описания класса.

## Практическое следствие для отладки

Понимание того, что \`Article.title\` (класс) и \`article.title\` (экземпляр) — принципиально разные вещи благодаря дескрипторам, объясняет некоторые не всегда очевидные особенности: например, почему \`Article.title\` можно использовать в запросах ORM (\`Article.objects.filter(title=...)\` работает через специальный механизм \`Field\`, участвующий в построении \`Q\`-объектов на уровне класса), тогда как обращение к \`article_instance.title\` дает обычное строковое значение — оба пути проходят через один и тот же изначальный объект \`Field\`, но проявляются по-разному в зависимости от контекста доступа (класс vs экземпляр).`,
  },
  {
    id: "django-custom-database-backend-custom-field",
    question:
      "Как реализовать свой собственный database backend или custom field для Django, если стандартные решения не покрывают потребности бизнеса?",
    category: "Внутреннее устройство фреймворка (Under the Hood)",
    difficulty: "senior",
    answer: `## Custom Field — более частый и практичный случай

Кастомное поле нужно, когда требуется хранить данные с нестандартной логикой преобразования между Python-объектом и представлением в БД — например, шифрованное поле, поле с доменным типом (деньги, координаты), или поле, работающее с нестандартным для Django типом данных конкретной СУБД.

\`\`\`python
from django.db import models

class EncryptedTextField(models.TextField):
    description = "Текстовое поле, автоматически шифруемое при сохранении"

    def __init__(self, *args, **kwargs):
        self.cipher = get_cipher()   # инициализация шифровальщика
        super().__init__(*args, **kwargs)

    def get_prep_value(self, value):
        # вызывается перед отправкой значения в БД (Python объект → значение для БД)
        value = super().get_prep_value(value)
        if value is None:
            return value
        return self.cipher.encrypt(value.encode()).decode()

    def from_db_value(self, value, expression, connection):
        # вызывается при чтении значения ИЗ БД (значение из БД → Python объект)
        if value is None:
            return value
        return self.cipher.decrypt(value.encode()).decode()

    def to_python(self, value):
        # вызывается при валидации форм и при десериализации — должен уметь принять
        # как уже расшифрованную строку, так и None
        if isinstance(value, str) or value is None:
            return value
        return str(value)
\`\`\`

### Ключевые методы жизненного цикла кастомного поля

- **\`get_prep_value(value)\`** — Python → БД, вызывается перед формированием SQL-запроса на запись.
- **\`from_db_value(value, expression, connection)\`** — БД → Python, вызывается при чтении каждой строки результата запроса.
- **\`to_python(value)\`** — используется при валидации (\`full_clean()\`) и при десериализации из fixture — должен быть идемпотентным (не ломаться, если значение уже в правильном Python-формате).
- **\`db_type(connection)\`** — определяет, какой SQL-тип колонки использовать при генерации миграций (\`CREATE TABLE\`), можно сделать по-разному для разных СУБД через проверку \`connection.vendor\`.

\`\`\`python
def db_type(self, connection):
    if connection.vendor == "postgresql":
        return "text"
    return "varchar(500)"
\`\`\`

- **\`deconstruct()\`** — обязателен для корректной работы системы миграций: возвращает представление поля (путь к классу, аргументы конструктора), которое Django записывает в файл миграции. Если поле принимает нестандартные аргументы в \`__init__\`, их нужно явно включить в \`deconstruct()\`, иначе миграции будут генерироваться некорректно или произойдет потеря параметров при повторной генерации миграций.

\`\`\`python
def deconstruct(self):
    name, path, args, kwargs = super().deconstruct()
    # если добавляли собственные кастомные kwargs в __init__ — включить их сюда
    return name, path, args, kwargs
\`\`\`

### Пример посложнее — поле для типа СУБД без прямой поддержки в Django (например, PostgreSQL range types)

\`\`\`python
from django.db.models import Field

class Int4RangeField(Field):
    def db_type(self, connection):
        return "int4range"

    def get_prep_value(self, value):
        if value is None:
            return value
        return psycopg2.extras.NumericRange(value[0], value[1])

    def from_db_value(self, value, expression, connection):
        if value is None:
            return None
        return (value.lower, value.upper)
\`\`\`

## Custom database backend — редкий, тяжелый случай

Полноценный кастомный backend нужен, когда нужно подключить СУБД, для которой в Django нет готового backend (встроены поддерживаются PostgreSQL, MySQL, SQLite, Oracle; для остальных — сторонние пакеты), либо когда нужно радикально изменить поведение существующего backend на очень низком уровне (нестандартная схема соединений, специфичная трансляция типов).

Структура custom backend — это отдельный Python-пакет, реализующий несколько ключевых классов:

\`\`\`
mybackend/
    base.py          # DatabaseWrapper — управление соединением
    operations.py     # DatabaseOperations — трансляция SQL-выражений, форматирование дат и т.д.
    schema.py         # DatabaseSchemaEditor — генерация DDL для миграций (CREATE TABLE, ALTER TABLE, индексы)
    features.py       # DatabaseFeatures — флаги, какие возможности СУБД поддерживаются
    introspection.py  # DatabaseIntrospection — для management-команды inspectdb
\`\`\`

\`\`\`python
# base.py — минимальный скелет
from django.db.backends.base.base import BaseDatabaseWrapper

class DatabaseWrapper(BaseDatabaseWrapper):
    vendor = "mycustomdb"
    operators = {...}   # маппинг операторов ORM (exact, icontains, gte...) на SQL-синтаксис конкретной СУБД

    def get_connection_params(self):
        ...

    def get_new_connection(self, conn_params):
        return my_db_driver.connect(**conn_params)
\`\`\`

Наиболее трудоемкая часть — **\`DatabaseSchemaEditor\`**, который должен уметь генерировать корректный DDL для всех операций, которые умеет делать система миграций Django (создание/удаление таблиц, добавление/удаление колонок, индексов, constraint'ов, внешних ключей) — специфика синтаксиса и ограничений конкретной СУБД (например, некоторые СУБД не поддерживают \`ALTER COLUMN TYPE\` без пересоздания таблицы) должна быть учтена здесь.

## Когда это оправдано

**Custom field** — частый, оправданный инструмент, встречается в реальных проектах регулярно (шифрование, доменные типы, интеграция специфичных возможностей СУБД).

**Custom database backend с нуля** — редкое и трудоемкое решение (это по сути написание адаптера уровня, сопоставимого по объему с частью самого Django ORM) — на практике почти всегда сначала стоит проверить, нет ли уже готового стороннего пакета backend для нужной СУБД (например, для CockroachDB, Snowflake и других есть community/commercial backends), и рассматривать написание с нуля только при действительно уникальных требованиях, оправдывающих такие трудозатраты.`,
  },
  {
    id: "django-http-request-sockets-file-descriptors-gunicorn",
    question:
      "Что происходит на уровне сокетов и файловых дескрипторов, когда Django (через Gunicorn/uWSGI) обрабатывает входящий HTTP-запрос?",
    category: "Внутреннее устройство фреймворка (Under the Hood)",
    difficulty: "senior",
    answer: `## Шаг 1: слушающий сокет и bind

При старте Gunicorn создает **слушающий TCP-сокет** и связывает его (\`bind\`) с адресом и портом (например, \`127.0.0.1:8000\`), затем переводит его в режим \`listen\` — сокет начинает принимать входящие соединения в очередь ожидания (backlog), но сам этот сокет — файловый дескриптор в **master-процессе** Gunicorn.

\`\`\`
socket() → bind() → listen()   # выполняется один раз master-процессом при старте
\`\`\`

## Шаг 2: модель воркеров — как файловый дескриптор попадает в worker

Gunicorn поддерживает несколько worker-моделей (\`sync\`, \`gevent\`, \`eventlet\`, \`gthread\`), но в самой распространенной — **sync worker с несколькими процессами** — устройство такое:

**Fork модели.** Master-процесс делает \`fork()\` для создания каждого worker-процесса. При \`fork()\` дочерний процесс получает **копию всех открытых файловых дескрипторов родителя**, включая слушающий сокет — то есть все worker-процессы **разделяют один и тот же слушающий сокет** (одна и та же запись в таблице файлов ядра, на которую ссылаются несколько дескрипторов в разных процессах).

## Шаг 3: accept() и thundering herd

Каждый worker-процесс в цикле вызывает \`accept()\` на этом общем слушающем сокете, ожидая новое входящее соединение. Когда приходит новое TCP-соединение, ядро ОС "будит" один (в современных ядрах Linux — благодаря механизмам вроде \`EPOLLEXCLUSIVE\`/особенностям планировщика) из ожидающих \`accept()\` процессов и передает ему **новый** файловый дескриптор, представляющий именно это соединение (отдельный от изначального слушающего сокета).

Раньше (до соответствующих оптимизаций ядра) это было известно как проблема **thundering herd** — все воркеры "просыпались" при каждом новом соединении, даже если обработать его мог только один, что создавало избыточную нагрузку на планировщик ОС при большом числе воркеров. Современные версии Linux ядра и Gunicorn смягчают эту проблему.

## Шаг 4: чтение запроса — от сырых байт к WSGI environ

Worker-процесс читает сырые байты из файлового дескриптора соединения через системные вызовы \`read()\`/\`recv()\`. Gunicorn выполняет **HTTP-парсинг** этих байт — разбирает стартовую строку, заголовки, тело запроса — и формирует стандартный **WSGI environ dict**, который передается в приложение (Django):

\`\`\`python
environ = {
    "REQUEST_METHOD": "POST",
    "PATH_INFO": "/api/orders/",
    "CONTENT_LENGTH": "128",
    "wsgi.input": <файлоподобный объект для чтения тела запроса>,
    "HTTP_AUTHORIZATION": "Bearer ...",
    ...
}
\`\`\`

\`wsgi.input\` — это обертка непосредственно над файловым дескриптором сокета, позволяющая Django читать тело запроса потоково, не загружая целиком в память сразу, если приложение читает его частями (хотя большинство Django-кода, включая парсинг form data, читает целиком).

## Шаг 5: обработка внутри Django и генерация ответа

Django (\`WSGIHandler.__call__(environ, start_response)\`) обрабатывает запрос через обычный конвейер (middleware → URL resolver → view) и вызывает \`start_response\` с кодом статуса и заголовками, а затем возвращает итерируемый объект с телом ответа.

## Шаг 6: запись ответа обратно в сокет

Gunicorn берет статус, заголовки и тело ответа от WSGI-приложения, сериализует их обратно в HTTP-формат и записывает байты через \`write()\`/\`send()\` в тот же файловый дескриптор соединения.

## Шаг 7: закрытие соединения или keep-alive

В зависимости от заголовков (\`Connection: keep-alive\` в HTTP/1.1 по умолчанию) файловый дескриптор соединения либо закрывается (\`close()\`, освобождая файловый дескриптор для повторного использования ОС) сразу после отправки ответа, либо остается открытым для повторного использования тем же клиентом на следующий запрос в рамках того же TCP-соединения — что снижает накладные расходы на установление нового TCP-соединения (handshake) для последовательных запросов.

## Ограничение по количеству файловых дескрипторов — практическая проблема на production

У каждого процесса есть лимит на число одновременно открытых файловых дескрипторов (\`ulimit -n\`) — каждое TCP-соединение потребляет один дескриптор в worker-процессе. Под высокой нагрузкой с большим числом одновременных долгоживущих соединений (например, много keep-alive клиентов) можно **упереться в этот лимит**, получая ошибки вида "Too many open files" — типичная причина такой проблемы на production и одна из первых вещей, которую стоит проверить (\`ulimit -n\`, а также системные лимиты в \`/etc/security/limits.conf\`) при диагностике деградации под нагрузкой.

## async worker-модели (gevent/eventlet) — другая механика на том же уровне

При использовании асинхронных воркеров Gunicorn (\`gevent\`, \`eventlet\`) один процесс может обрабатывать множество соединений одновременно через event loop и неблокирующий I/O (\`epoll\` на Linux) — вместо одного процесса на одно соединение в конкретный момент, один процесс мультиплексирует множество файловых дескрипторов, переключаясь между ними в момент, когда конкретный сокет готов к чтению/записи (а не блокируясь в ожидании данных на одном сокете, как это происходит в sync-модели).

## Практический вывод

Понимание этого уровня объясняет, почему количество worker-процессов Gunicorn напрямую ограничивает параллелизм обработки запросов (в sync-модели), почему keep-alive снижает накладные расходы, и почему при resource-исчерпании (файловые дескрипторы, память на процесс) симптомы проявляются как рост времени ответа или отказ в обслуживании задолго до того, как это станет заметно в самом коде Django — то есть проблема лежит на уровне ОС/сети, а не в бизнес-логике приложения.`,
  },
  {
    id: "django-ssr-frontend-auth-architecture",
    question:
      "Как архитектурно правильно построить взаимодействие между backend на Django/DRF и SSR-frontend фреймворками (например, Nuxt.js или Next.js)? Как безопасно решать проблемы аутентификации при Server-Side Rendering?",
    category: "API, Интеграции и Frontend",
    difficulty: "senior",
    answer: `## Общая архитектура: Django/DRF как чистый API-backend

При связке с SSR-фреймворком Django обычно перестает рендерить HTML вообще и становится чистым JSON API — весь рендеринг страниц (в том числе первый, серверный рендер) берет на себя Node.js-сервер Next.js/Nuxt.js.

\`\`\`
Браузер → Next.js/Nuxt.js сервер (Node.js, порт 3000) → Django/DRF API (порт 8000)
              ↓ (SSR: сервер сам делает запрос к API перед отдачей HTML)
         готовый HTML с данными → браузеру
              ↓ (после гидратации — прямые запросы к API из браузера)
         Django/DRF API (напрямую из клиента)
\`\`\`

Ключевая архитектурная особенность SSR — запрос к API происходит **дважды разными способами**: один раз с Node.js-сервера (во время серверного рендеринга) и затем повторно из браузера пользователя (после гидратации, для последующих действий) — оба пути должны быть учтены в дизайне аутентификации.

## Проблема аутентификации при SSR

Классическая аутентификация через **localStorage** для JWT-токена не работает для SSR: localStorage доступен только в браузере, а Node.js-сервер, выполняющий серверный рендеринг, не имеет доступа к localStorage пользователя — значит, во время SSR запрос к API уйдет неаутентифицированным, если полагаться только на localStorage.

## Решение: HttpOnly cookies вместо localStorage

**HttpOnly cookie** — куки, которые браузер автоматически отправляет с каждым запросом (включая запрос от Node.js SSR-сервера к API, если правильно проксировать cookie), но недоступны для чтения через JavaScript (защита от XSS-кражи токена).

\`\`\`python
# Django — установка HttpOnly cookie при логине
from rest_framework_simplejwt.tokens import RefreshToken

def login_view(request):
    ...
    refresh = RefreshToken.for_user(user)
    response = JsonResponse({"detail": "ok"})
    response.set_cookie(
        "access_token",
        str(refresh.access_token),
        httponly=True,
        secure=True,       # только по HTTPS
        samesite="Lax",    # защита от CSRF при межсайтовых запросах
        max_age=60 * 15,
    )
    return response
\`\`\`

При SSR-запросе Node.js-сервер должен **явно переслать cookie из исходного запроса браузера** в свой запрос к Django API (это не происходит автоматически — cookie браузера доступны серверу фреймворка через объект входящего запроса, но их нужно вручную приложить к исходящему запросу к API):

\`\`\`javascript
// Next.js — getServerSideProps
export async function getServerSideProps(context) {
  const response = await fetch("http://django-api:8000/api/profile/", {
    headers: { cookie: context.req.headers.cookie },   // явный проброс cookie
  });
  const data = await response.json();
  return { props: { data } };
}
\`\`\`

## Проблема истечения токена и refresh во время SSR

Access-токен с коротким временем жизни может истечь как раз в момент SSR-запроса. Стратегии:
- **Refresh-логика на уровне SSR-сервера** — при получении 401 от API, SSR-сервер сам обращается к refresh-эндпоинту с refresh-токеном (тоже в HttpOnly cookie) и повторяет исходный запрос с новым access-токеном, устанавливая обновленные cookie в ответ браузеру.
- **Более длинный access-токен для SSR-сценариев** — компромисс между безопасностью (короткий токен снижает окно атаки при краже) и сложностью реализации refresh-потока на сервере.

## CSRF при аутентификации через cookie

Поскольку аутентификация теперь через cookie (а не через заголовок \`Authorization: Bearer\`), приложение снова подвержено CSRF (в отличие от токена в заголовке, который не отправляется браузером автоматически при межсайтовых запросах) — необходима явная защита: Django CSRF middleware плюс корректная настройка \`SameSite\` на cookie, и передача CSRF-токена в заголовке для мутирующих запросов (\`POST\`/\`PUT\`/\`DELETE\`) от SSR-фреймворка.

## CORS — обязательная настройка при разделении доменов/портов

Если Next.js/Nuxt.js и Django развернуты на разных доменах/портах, нужен \`django-cors-headers\` с точной настройкой (не \`CORS_ALLOW_ALL_ORIGINS = True\` в production) и \`CORS_ALLOW_CREDENTIALS = True\` (обязательно для передачи cookie между разными origin).

\`\`\`python
CORS_ALLOWED_ORIGINS = ["https://myapp.com"]
CORS_ALLOW_CREDENTIALS = True
\`\`\`

## Альтернатива — Backend-For-Frontend (BFF) слой

Более надежный, хотя и более сложный паттерн — ввести отдельный "BFF"-слой на самом Node.js-сервере (или прокси-эндпоинты внутри Next.js API routes), который единолично хранит и обновляет токены, общаясь с Django API от своего имени, а до браузера токены вообще не доходят в чистом виде — снижает поверхность атаки и упрощает логику на стороне клиентского JS, но требует дополнительного слоя разработки.

## Практический вывод

Ключевые решения: (1) Django становится "чистым" API без собственного рендеринга HTML, (2) аутентификация через HttpOnly + Secure + SameSite cookie вместо localStorage, чтобы она одинаково работала и на сервере SSR, и в браузере после гидратации, (3) явный проброс cookie в SSR-запросах (это не происходит "само"), (4) корректная настройка CORS с \`credentials\` и CSRF-защиты, так как cookie-based аутентификация возвращает CSRF-риски, которых не было бы при чистом токене в заголовке.`,
  },
  {
    id: "django-idempotent-api-payment-webhooks",
    question:
      "Как спроектировать идемпотентный API для интеграции с платежными шлюзами или внешними webhook-провайдерами (например, Telegram-ботами)?",
    category: "API, Интеграции и Frontend",
    difficulty: "senior",
    answer: `## Почему идемпотентность критична для webhook-эндпоинтов

Внешние провайдеры (платежные шлюзы, Telegram, любые webhook-источники) **гарантируют доставку "как минимум один раз" (at-least-once)**, а не "ровно один раз" — из-за таймаутов, сетевых сбоев или проблем на своей стороне они могут отправить **один и тот же webhook несколько раз**. Если обработчик не идемпотентен, повторная доставка приведет к дублированию побочных эффектов — например, повторному начислению средств, повторной отправке уведомления пользователю, двойному изменению статуса заказа.

**Идемпотентность** означает: повторный вызов с теми же данными приводит к тому же конечному результату, что и один вызов, без дублирования побочных эффектов.

## Ключевой механизм — идемпотентный ключ (idempotency key)

Большинство платежных провайдеров (Stripe, ЮKassa и подобные) присылают уникальный идентификатор события/платежа в самом webhook — этот идентификатор должен использоваться как ключ дедупликации.

\`\`\`python
from django.db import models, IntegrityError

class ProcessedWebhookEvent(models.Model):
    provider = models.CharField(max_length=50)
    event_id = models.CharField(max_length=255)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["provider", "event_id"], name="unique_provider_event"),
        ]
\`\`\`

\`\`\`python
def handle_webhook(request):
    payload = parse_webhook(request)
    event_id = payload["id"]

    try:
        ProcessedWebhookEvent.objects.create(provider="stripe", event_id=event_id)
    except IntegrityError:
        # событие уже было обработано ранее — просто подтверждаем получение, не повторяя побочные эффекты
        return HttpResponse(status=200)

    # реальная бизнес-логика выполняется только для новых событий
    process_payment(payload)
    return HttpResponse(status=200)
\`\`\`

**Уникальный constraint на уровне БД**, а не проверка "существует ли уже такая запись" перед вставкой — критически важная деталь: при параллельной обработке двух одновременных копий одного и того же webhook (что случается, если провайдер посылает повторную доставку почти сразу же) простая проверка \`if not exists: create()\` подвержена race condition (обе проверки могут пройти до того, как любая вставка завершится) — только constraint на уровне БД гарантированно предотвращает дублирование при конкуренции.

## Атомарность обработки — все побочные эффекты в одной транзакции

\`\`\`python
from django.db import transaction

def handle_webhook(request):
    payload = parse_webhook(request)
    event_id = payload["id"]

    with transaction.atomic():
        try:
            ProcessedWebhookEvent.objects.select_for_update().create(provider="stripe", event_id=event_id)
        except IntegrityError:
            return HttpResponse(status=200)

        order = Order.objects.select_for_update().get(id=payload["order_id"])
        order.status = "paid"
        order.save()
        # если что-то из этого упадет — вся транзакция откатится,
        # включая запись о том, что событие обработано, и повторная доставка сможет попробовать снова
\`\`\`

## Проверка подписи webhook — обязательный этап до любой обработки

Прежде чем что-либо обрабатывать, нужно верифицировать, что запрос действительно пришел от легитимного провайдера, а не от злоумышленника, знающего URL эндпоинта:

\`\`\`python
import hmac
import hashlib

def verify_signature(request):
    signature = request.headers.get("X-Signature")
    expected = hmac.new(settings.WEBHOOK_SECRET.encode(), request.body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise PermissionDenied("Invalid webhook signature")
\`\`\`

\`hmac.compare_digest\` вместо обычного \`==\` — защита от timing attack (сравнение строк напрямую позволяет через измерение времени ответа постепенно подобрать правильную подпись посимвольно).

## Быстрый ответ провайдеру — обработка не должна блокировать HTTP-ответ

Провайдеры обычно ожидают быстрый ответ (2xx) в течение нескольких секунд — если не уложиться, они посчитают доставку неуспешной и повторят её (что усиливает необходимость идемпотентности), либо вовсе отключат webhook после нескольких неудач. Тяжелую обработку стоит выносить в Celery, оставляя в самом view только быструю валидацию и постановку задачи в очередь:

\`\`\`python
def handle_webhook(request):
    verify_signature(request)
    payload = parse_webhook(request)

    _, created = ProcessedWebhookEvent.objects.get_or_create(
        provider="stripe", event_id=payload["id"]
    )
    if created:
        process_payment_task.delay(payload)   # тяжелая обработка — асинхронно
    return HttpResponse(status=200)   # быстрый ответ провайдеру в любом случае
\`\`\`

## Обработка гонки между приемом webhook и собственным API

Частый источник багов — webhook о статусе платежа приходит **до того**, как завершилась собственная транзакция создания заказа (например, платежный провайдер успел прислать уведомление быстрее, чем закоммитилась локальная транзакция создания заказа) — обработчик webhook должен быть готов к тому, что связанной записи (заказа) еще может не существовать, и либо retry (провайдер повторит доставку сам, если ответить не-2xx кодом), либо явная очередь с задержкой на своей стороне.

## Итоговый чеклист идемпотентного webhook-обработчика

1. Верификация подписи запроса до любой обработки.
2. Уникальный constraint на уровне БД по идентификатору события провайдера — не полагаться на проверку "существует ли" без атомарности.
3. Вся бизнес-логика в одной транзакции с записью о том, что событие обработано.
4. Быстрый ответ (2xx) провайдеру, тяжелая логика — асинхронно через очередь.
5. Логирование всех входящих webhook (включая дубликаты) для возможности расследования проблем постфактум.`,
  },
  {
    id: "django-drf-limitations-alternatives-ninja-graphql",
    question:
      "В чем архитектурные недостатки Django REST Framework для крупных проектов с тяжелой бизнес-логикой? Какие современные альтернативы (Django Ninja, GraphQL/Graphene) вы применяли и почему?",
    category: "API, Интеграции и Frontend",
    difficulty: "senior",
    answer: `## Архитектурные недостатки DRF на масштабе

**1. Тяжеловесность и "магия" сериализаторов.** DRF-сериализаторы совмещают сразу несколько ответственностей — валидацию, сериализацию/десериализацию, и часто неявно проникающую бизнес-логику (в \`validate()\`, \`create()\`, \`update()\`). На крупных проектах это приводит к "толстым" сериализаторам, которые сложно тестировать изолированно от Django ORM и сложно переиспользовать вне контекста конкретного view.

**2. Отсутствие нативной поддержки типизации и автогенерации схемы без надстроек.** DRF не был спроектирован вокруг Python type hints — генерация OpenAPI-схемы требует стороннего пакета (\`drf-spectacular\`) со своими эвристиками, которые не всегда корректно выводят реальную структуру данных, особенно для сложных вложенных/условных сериализаторов — схема часто требует ручных аннотаций поверх обычного кода.

**3. Производительность сериализации на больших объемах данных.** Классические DRF-сериализаторы (особенно \`ModelSerializer\` с вложенными связями) заметно медленнее при сериализации больших списков объектов по сравнению с более прямыми подходами — механизм полей и валидаторов добавляет накладные расходы на каждый объект.

**4. ViewSet/Router абстракция иногда мешает, а не помогает при нестандартных сценариях.** Для CRUD "из коробки" \`ModelViewSet\` очень удобен, но при обрастании бизнес-логикой (сложные права доступа в зависимости от состояния объекта, нестандартные действия, комбинированные операции) абстракция ViewSet начинает требовать все больше переопределений и becomes менее прозрачной, чем явно написанные функции-представления.

**5. Слабая интеграция с современными инструментами типизации (mypy, pydantic-подобная валидация).** Экосистема Python в целом сдвинулась к активному использованию type hints и инструментов вроде Pydantic — DRF, спроектированный до этого сдвига, интегрируется с ними менее органично.

## Django Ninja — альтернатива, построенная вокруг типизации

**Django Ninja** — фреймворк для API поверх Django, вдохновленный FastAPI, использующий Python type hints и Pydantic для валидации и автогенерации OpenAPI-документации.

\`\`\`python
from ninja import NinjaAPI, Schema

api = NinjaAPI()

class OrderIn(Schema):
    product_id: int
    quantity: int

class OrderOut(Schema):
    id: int
    status: str
    total: float

@api.post("/orders/", response=OrderOut)
def create_order(request, payload: OrderIn):
    order = Order.objects.create(**payload.dict())
    return order
\`\`\`

**Преимущества:**
- Схема API автоматически и точно генерируется из type hints — без ручных аннотаций поверх, характерных для \`drf-spectacular\`.
- Валидация через Pydantic — быстрее и строже, чем валидация DRF-сериализаторов, с понятными сообщениями об ошибках "из коробки".
- Более легковесный и явный синтаксис (функции вместо классов ViewSet) — меньше "магии", проще проследить путь выполнения запроса.
- Встроенная async-поддержка view из коробки, что органично сочетается с растущей поддержкой async в самом Django.

**Ограничения:** менее зрелая экосистема сторонних пакетов по сравнению с DRF (меньше готовых интеграций для permissions, throttling, pagination "из коробки" в стороннем виде), меньшее сообщество и меньше "проверенных боем" паттернов для очень крупных проектов на момент широкого внедрения.

## GraphQL/Graphene — альтернатива для другого класса проблем

**GraphQL** (через \`graphene-django\` или более новый \`strawberry-django\`) решает принципиально другую проблему — не структуру одного эндпоинта, а гибкость запроса клиентом ровно тех данных, которые ему нужны, за один round-trip.

\`\`\`python
import graphene
from graphene_django import DjangoObjectType

class OrderType(DjangoObjectType):
    class Meta:
        model = Order
        fields = ("id", "status", "total", "items")

class Query(graphene.ObjectType):
    orders = graphene.List(OrderType)

    def resolve_orders(root, info):
        return Order.objects.select_related("customer").prefetch_related("items")
\`\`\`

**Когда GraphQL действительно оправдан:**
- Клиенты с сильно различающимися требованиями к данным (мобильное приложение против веб-дашборда), где REST заставил бы либо создавать множество узкоспециализированных эндпоинтов, либо гонять избыточные данные.
- Сложные, глубоко вложенные структуры данных, где клиенту часто нужно "дотянуться" через несколько уровней связей за один запрос (в REST это часто решается либо N+1 запросами с фронтенда, либо специальными "raw" эндпоинтами).

**Архитектурные риски GraphQL:**
- **N+1 запросы к БД становятся легче допустить**, а не сложнее — GraphQL resolvers для каждого поля потенциально запускают отдельный запрос, если не использовать DataLoader-паттерн для батчинга — то есть требует дисциплины, аналогичной или даже большей, чем в DRF.
- **Кэширование на уровне HTTP (в духе \`cache_page\`) не работает естественно** — GraphQL обычно использует единый эндпоинт (\`POST /graphql\`) с телом запроса, что несовместимо со стандартным HTTP-кэшированием по URL.
- **Более сложная авторизация на уровне полей**, а не эндпоинтов — контроль доступа приходится продумывать на уровне отдельных полей/resolver'ов, что более гранулярно, но и сложнее для аудита в целом.

## Практический выбор

**Django Ninja** — хороший выбор, когда основная боль — типизация, качество автогенерируемой документации и производительность сериализации, при этом общая форма API остается классическим REST.

**GraphQL** — оправдан, когда реальная проблема — разнородные клиенты с разными потребностями в данных или глубоко вложенные графоподобные структуры данных, но требует зрелой команды, готовой отдельно бороться с N+1 через DataLoader и продумывать авторизацию на уровне полей.

**DRF остается разумным выбором по умолчанию** для большинства "обычных" REST API — его недостатки становятся заметны в первую очередь на масштабе (сотни эндпоинтов, множество разработчиков, тяжелая кастомная бизнес-логика внутри сериализаторов) — для среднего проекта зрелость экосистемы DRF (готовые пакеты для permissions, throttling, versioning) часто перевешивает архитектурные ограничения.`,
  },
  {
    id: "django-api-versioning-without-duplication",
    question:
      "Как реализовать поддержку нескольких версий сложного REST API без дублирования огромного количества кода сериализаторов, представлений и роутов?",
    category: "API, Интеграции и Frontend",
    difficulty: "senior",
    answer: `## Проблема наивного версионирования

Наивный подход — буквально скопировать все views/serializers в директорию \`v2/\` при каждой новой версии API — быстро приводит к взрывному дублированию кода и невозможности поддерживать баг-фиксы синхронно во всех версиях.

## Принцип: версионировать только то, что действительно изменилось

Ключевая идея — большая часть API между версиями **не меняется**. Правильная архитектура изолирует именно **различия**, а не дублирует всё целиком.

## 1. Разделение бизнес-логики от сериализации (Service Layer)

Первый и самый важный шаг — бизнес-логика не должна жить внутри сериализаторов или views вообще, она должна быть в отдельном слое (сервисы/селекторы), не знающем о версиях API:

\`\`\`python
# services.py — не знает о версиях API, не знает о DRF вообще
def create_order(user, product_id, quantity):
    product = Product.objects.get(id=product_id)
    order = Order.objects.create(user=user, product=product, quantity=quantity)
    calculate_totals(order)
    return order
\`\`\`

Тогда версии API — это просто разные **тонкие обертки** (сериализация запроса/ответа) вокруг одной и той же бизнес-логики, а не дублирование самой логики.

## 2. Версионирование через DRF versioning classes — механизм определения версии

DRF поддерживает несколько схем определения версии из запроса без изменения структуры кода:

\`\`\`python
REST_FRAMEWORK = {
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1", "v2"],
}
\`\`\`

Варианты: URL path (\`/api/v2/orders/\`), заголовок (\`Accept: application/json; version=2.0\`), query-параметр. Выбор варианта версионирования — отдельное архитектурное решение, но независимо от него, ключевая проблема — не *как определить* версию, а *как не дублировать* код между ними.

## 3. Наследование сериализаторов — переопределение только измененных полей

\`\`\`python
class OrderSerializerV1(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["id", "status", "total"]

class OrderSerializerV2(OrderSerializerV1):
    # v2 добавляет новое поле и меняет формат total (например, вложенный объект с валютой)
    total = serializers.SerializerMethodField()

    class Meta(OrderSerializerV1.Meta):
        fields = OrderSerializerV1.Meta.fields + ["items_count"]

    def get_total(self, obj):
        return {"amount": obj.total, "currency": "RUB"}
\`\`\`

Наследование гарантирует, что общие поля и их валидация определены **один раз**, а версии отличаются только тем, что реально отличается.

## 4. Views: параметризация вместо дублирования всего класса

\`\`\`python
class OrderViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.request.version == "v2":
            return OrderSerializerV2
        return OrderSerializerV1

    def get_queryset(self):
        # queryset и права доступа общие для всех версий — не дублируются
        return Order.objects.filter(user=self.request.user).select_related("product")
\`\`\`

Один ViewSet, обслуживающий все версии, с точечным выбором сериализатора — вместо создания отдельного класса ViewSet на каждую версию.

## 5. Трансформация на границе — адаптер для действительно несовместимых изменений

Когда версии расходятся сильнее, чем просто "добавили поле" (например, изменилась структура вложенных данных, переименовано поле, изменилась семантика) — вместо дублирования всей цепочки, вводится явный слой трансформации на входе/выходе:

\`\`\`python
def adapt_v1_request_to_internal(data):
    # преобразует устаревший формат запроса v1 к единому внутреннему формату,
    # с которым работает актуальная бизнес-логика
    return {
        "product_id": data["productId"],   # v1 использовал camelCase
        "quantity": data["qty"],           # v1 использовал сокращенное имя поля
    }
\`\`\`

Это позволяет держать **одну актуальную версию бизнес-логики** и лишь "переводить" между форматами на границах системы, вместо параллельного поддержания нескольких полных копий логики.

## 6. Явная политика устаревания (deprecation policy)

Версионирование без плана вывода старых версий из эксплуатации накапливает бесконечный технический долг. Практика:
- Заголовок \`Deprecation\`/\`Sunset\` в ответах устаревшей версии, с указанием даты отключения.
- Мониторинг реального использования каждой версии (метрики по заголовку/URL версии в логах) — часто оказывается, что старую версию давно никто не использует, но команда боится её убрать без данных.
- Контрактные тесты (contract tests) для каждой поддерживаемой версии — автоматическая проверка, что ответ API для v1 не начал случайно меняться при рефакторинге общей бизнес-логики.

## 7. Документация как часть версионирования

Каждая версия должна иметь свою явно сгенерированную OpenAPI-схему (через \`drf-spectacular\` с поддержкой versioning или отдельные схемы для Django Ninja per-версия) — клиенты не должны гадать, какие поля актуальны для их версии.

## Итоговый архитектурный принцип

**Версионировать нужно контракт (форму данных на входе/выходе), а не бизнес-логику.** Вся реальная логика (создание заказа, расчеты, права доступа) должна существовать в единственном актуальном виде в сервисном слое; версии API — это тонкий, явно изолированный слой сериализации/адаптации поверх одной и той же логики, с явной политикой устаревания старых версий, чтобы количество поддерживаемых версий не росло бесконтрольно.`,
  },
  {
    id: "django-streaming-sse-realtime-updates",
    question:
      "Как организовать потоковую передачу данных (streaming) или Server-Sent Events (SSE) в Django для передачи обновлений на frontend в реальном времени?",
    category: "API, Интеграции и Frontend",
    difficulty: "senior",
    answer: `## StreamingHttpResponse — базовый механизм потоковой передачи в Django

Обычный \`HttpResponse\` формирует полный ответ в памяти и отправляет его целиком. \`StreamingHttpResponse\` вместо этого принимает **итератор/генератор** и отправляет данные клиенту порциями, по мере их генерации, не дожидаясь полного формирования ответа.

\`\`\`python
from django.http import StreamingHttpResponse
import time

def event_stream():
    while True:
        yield f"data: {get_latest_update()}\\n\\n"
        time.sleep(2)

def sse_view(request):
    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"   # важно для Nginx — см. ниже
    return response
\`\`\`

## Формат Server-Sent Events

SSE — это простой текстовый протокол поверх обычного HTTP, где сервер держит соединение открытым и периодически отправляет события в формате \`data: ...\\n\\n\`. Браузер на стороне клиента использует встроенный \`EventSource\`, который автоматически переподключается при разрыве соединения — SSE изначально спроектирован с этим в уме, в отличие от WebSocket, где переподключение нужно реализовывать вручную.

\`\`\`javascript
const eventSource = new EventSource("/api/events/");
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
};
\`\`\`

## Критическая проблема: WSGI-серверы не приспособлены для долгоживущих соединений

Стандартная sync worker-модель Gunicorn (WSGI) означает, что **один worker-процесс полностью занят на всё время SSE-соединения** — если клиент держит соединение открытым несколько минут, этот worker не может обслуживать никакие другие запросы все это время. При небольшом количестве одновременных SSE-клиентов и небольшом числе воркеров это быстро исчерпывает пул воркеров, блокируя обработку обычных HTTP-запросов.

## Решение 1: async view + ASGI-сервер

\`\`\`python
import asyncio
from django.http import StreamingHttpResponse

async def event_stream():
    while True:
        data = await get_latest_update_async()
        yield f"data: {data}\\n\\n"
        await asyncio.sleep(2)

async def sse_view(request):
    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")
\`\`\`

Запущенный под ASGI-сервером (Uvicorn/Daphne), такой view не блокирует worker целиком — во время \`await asyncio.sleep()\` тот же процесс может обрабатывать другие запросы. Это принципиально лучше вписывается в модель долгоживущих соединений, чем sync WSGI worker.

## Решение 2: worker-модель с гринлетами (gevent/eventlet) для WSGI

Если переход на полностью async-стек нецелесообразен, можно запустить Gunicorn с \`gevent\`/\`eventlet\` worker'ами — они позволяют одному OS-процессу обрабатывать множество "легковесных" соединений через кооперативную многозадачность, включая долгоживущие SSE-соединения, без полного блокирования на каждое из них.

## Особенности конфигурации Nginx для SSE

По умолчанию Nginx **буферизует** ответ от upstream-сервера перед отправкой клиенту — это ломает потоковую передачу, так как клиент не получит данные, пока буфер не заполнится или соединение не завершится (что для SSE, рассчитанного на долгоживущее соединение, неприемлемо).

\`\`\`nginx
location /api/events/ {
    proxy_pass http://django_backend;
    proxy_buffering off;              # отключить буферизацию для этого location
    proxy_cache off;
    proxy_set_header Connection "";   # для HTTP/1.1 keep-alive
    proxy_read_timeout 3600s;         # увеличить таймаут для долгих соединений
}
\`\`\`

Заголовок \`X-Accel-Buffering: no\`, установленный самим Django-ответом (как в примере выше), — альтернативный способ отключить буферизацию именно для конкретного ответа без изменения общей конфигурации Nginx location.

## Откуда SSE-view берет новые данные — интеграция с событиями приложения

SSE-генератор в примерах выше с \`time.sleep()\`/периодическим опросом — самый простой, но не самый эффективный вариант (polling внутри самого потока). Более эффективная архитектура — подписка на реальные события через Redis Pub/Sub:

\`\`\`python
import redis
import json

async def event_stream(channel_name):
    r = redis.asyncio.Redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(channel_name)
    async for message in pubsub.listen():
        if message["type"] == "message":
            yield f"data: {message['data'].decode()}\\n\\n"
\`\`\`

\`\`\`python
# в другом месте приложения — публикация события при изменении данных
r = redis.Redis()
r.publish(f"user_{user_id}_updates", json.dumps({"type": "order_status", "status": "shipped"}))
\`\`\`

Такая схема не требует постоянного опроса БД внутри самого генератора — событие "проталкивается" из места, где произошло изменение данных, напрямую в открытое SSE-соединение через Redis как посредник.

## SSE vs WebSocket — когда что выбрать

| | SSE | WebSocket |
|---|---|---|
| Направление | Только сервер → клиент | Двунаправленное |
| Протокол | Обычный HTTP | Отдельный протокол (upgrade с HTTP) |
| Автопереподключение | Встроено в браузер (\`EventSource\`) | Нужно реализовывать вручную |
| Простота инфраструктуры | Проще — обычный HTTP, работает через большинство прокси без спецнастройки | Требует поддержки WebSocket на всех уровнях инфраструктуры (балансировщики, прокси) |
| Типичный случай использования в Django | Уведомления, live-обновления статусов, ленты событий | Чаты, совместное редактирование, игры — где нужен полный дуплекс |

Для Django, если нужен полноценный двунаправленный realtime (не просто "сервер уведомляет клиента", а постоянный диалог) — типичный выбор **Django Channels** с WebSocket, что является отдельным, более комплексным решением (свой ASGI-стек, group-каналы, взаимодействие с Redis как channel layer). SSE проще внедрить точечно в существующее Django-приложение, когда нужен только однонаправленный поток обновлений.

## Практический вывод

SSE в Django требует: async view или gevent/eventlet worker'ов (иначе быстро исчерпывается пул WSGI-воркеров), явного отключения буферизации на уровне Nginx, и в идеале — событийного источника данных (Redis Pub/Sub) вместо polling внутри самого генератора потока, чтобы обновления доставлялись с минимальной задержкой без лишней нагрузки на БД.`,
  },
  {
    id: "django-asyncio-integration-thread-safety",
    question:
      "Как безопасно и эффективно интегрировать asyncio в существующий синхронный Django-проект? Какие подсистемы фреймворка уже thread-safe, а какие могут вызвать проблемы?",
    category: "Асинхронность, Concurrency и WebSockets",
    difficulty: "senior",
    answer: `## Постановка проблемы

Большинство Django-проектов начинались как полностью синхронные и написаны с использованием sync ORM, sync middleware, sync-only сторонних библиотек. "Внедрить asyncio" не означает переписать все на \`async def\` — это означает выбрать точечные места, где async даст реальный выигрыш (I/O-bound операции: внешние HTTP-запросы, вызовы LLM/API, WebSocket-подобные долгие соединения), и аккуратно состыковать их с оставшимся синхронным кодом без гонок и блокировок event loop.

## Что в Django уже async-совместимо (Django 4.1+)

- **URL-роутинг и middleware-стек** — полностью async-native начиная с Django 3.1/4.1: sync и async views/middleware можно свободно смешивать, Django сам оборачивает их через \`asgiref.sync.async_to_sync\`/\`sync_to_async\` на границах.
- **Views** — можно писать \`async def my_view(request): ...\`, Django ASGI-обработчик выполнит их в event loop без блокировки.
- **Кеш (низкоуровневый \`cache\`)** — начиная с Django 4.2/5.0 появились async-версии методов (\`aget\`, \`aset\`, и т.д.) для части backend'ов.
- **Signals** — начиная с Django 5.0 поддерживают async-получателей (\`async_to_sync\` под капотом при необходимости).

## Что НЕ thread-safe / не async-safe и вызывает проблемы

### 1. ORM (Django QuerySet API) — синхронный по своей природе

До Django 4.1 ORM был полностью синхронным; async-обертки (\`aget\`, \`acreate\`, \`aall\`, \`async for obj in qs\`) появились позже, но **под капотом они все равно вызывают sync-код через thread pool** (\`sync_to_async\`), а не используют по-настоящему асинхронный DB-драйвер. Это означает:

\`\`\`python
# ОПАСНО: прямой синхронный вызов ORM внутри async view — исключение
async def my_view(request):
    user = User.objects.get(id=1)  # SynchronousOnlyOperation!
    ...

# ПРАВИЛЬНО: используем async-обертки ORM (Django 4.1+)
async def my_view(request):
    user = await User.objects.aget(id=1)
    ...
\`\`\`

Django явно защищается от случайного синхронного доступа к ORM из async-контекста, выбрасывая \`SynchronousOnlyOperation\`, если не выставлен \`DJANGO_ALLOW_ASYNC_UNSAFE\` — и **выставлять эту переменную в продакшене не следует**, это debug-костыль, а не решение.

### 2. Ленивые связанные объекты и related-manager'ы

Даже если сам запрос был обернут в \`aget\`, обращение к \`related_object.foreign_key.field\` в шаблоне или сериализаторе может лениво триггернуть **новый синхронный SQL-запрос** (lazy loading) — уже вне await-обертки:

\`\`\`python
order = await Order.objects.select_related("customer").aget(id=1)
print(order.customer.name)  # OK, select_related подгрузил заранее

order2 = await Order.objects.aget(id=2)
print(order2.customer.name)  # ОПАСНО: ленивый запрос customer вне async-обертки
\`\`\`

Правило: **всегда явно \`select_related\`/\`prefetch_related\` все, что будет использовано**, если работаете в async-контексте — рассчитывать на ленивую подгрузку нельзя.

### 3. Транзакции и соединения с БД

Соединение с БД в Django исторически привязано к треду (thread-local). \`sync_to_async\` по умолчанию выполняет код в **новом потоке из thread pool** при каждом вызове, что означает: транзакция, открытая в одном \`sync_to_async\`-вызове, не гарантированно продолжится в следующем, если Django/ORM не удерживает это явно через \`thread_sensitive=True\` (это поведение по умолчанию для ORM-обёрток, но кастомный код должен об этом помнить).

\`\`\`python
from asgiref.sync import sync_to_async

@sync_to_async(thread_sensitive=True)
def get_user_sync(user_id):
    return User.objects.select_related("profile").get(id=user_id)
\`\`\`

\`thread_sensitive=True\` заставляет все такие вызовы выполняться в **одном и том же** выделенном потоке (а не в случайном потоке из пула), что критично для сохранения контекста транзакции и thread-local состояния.

### 4. Сторонние синхронные библиотеки (requests, boto3, psycopg2 напрямую, etc.)

Любой blocking-вызов (например \`requests.get()\`) внутри \`async def\` view **полностью блокирует event loop** — весь ASGI-процесс перестает обрабатывать другие запросы на это время. Обязательно оборачивать:

\`\`\`python
import httpx  # async-нативная альтернатива requests

async def my_view(request):
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.example.com/data")
    return JsonResponse(resp.json())
\`\`\`

Если async-альтернативы нет (например, старый SDK), — \`await sync_to_async(blocking_call)(...)\`, но это не решает проблему масштабирования, только не даёт заблокировать *весь* event loop навсегда (перекладывает блокировку в поток thread pool).

### 5. Middleware, которое трогает thread-locals (например, django-guardian, некоторые APM-агенты)

Часть старых пакетов хранит текущего пользователя/request в thread-local переменных (антипаттерн, но встречается). В async-режиме с одним event loop на процесс это **ломается** — thread-local, привязанный к треду event loop, не изолирует данные между конкурентно обрабатываемыми запросами так, как это происходило в sync WSGI-модели "один поток = один запрос".

## Практическая стратегия внедрения

1. **Не переписывать все views на async** — только те, что делают несколько независимых I/O-bound вызовов (внешние API, LLM-запросы, файловые операции), где выигрыш от конкурентности реален.
2. **Держать ORM-heavy, CPU-bound представления синхронными** — Django сам умеет запускать sync view из async-стека через thread pool, дополнительных усилий не требуется.
3. **Явно select_related/prefetch_related** всё, что нужно, при использовании async ORM-обёрток.
4. **Заменять blocking-библиотеки на async-аналоги** там, где async view уже используется (httpx вместо requests, redis.asyncio вместо redis-py sync API).
5. **Тестировать под реальной ASGI-нагрузкой** (например, локально через \`uvicorn\` с несколькими одновременными запросами), а не полагаться на то, что "код запустился без ошибок" — блокировка event loop не всегда выбрасывает исключение, она просто тихо убивает конкурентность.

## Вывод

asyncio в Django-проект стоит внедрять не тотально, а хирургически: там, где реально есть I/O-bound конкурентность (внешние вызовы), с явным контролем над ORM (async-обёртки + предзагрузка связей) и заменой блокирующих зависимостей. ORM, thread-local состояние в стороннем коде и "случайный" синхронный вызов внутри async view — три главные ловушки, которые превращают "мы внедрили asyncio" в источник трудноуловимых багов и деградации производительности вместо ожидаемого ускорения.`,
  },
  {
    id: "django-uwsgi-vs-uvicorn-daphne",
    question:
      "В чем фундаментальная разница между запуском Django под uWSGI (с потоками/воркерами) и под Uvicorn/Daphne? Как это влияет на обработку I/O-bound задач и потребление памяти?",
    category: "Асинхронность, Concurrency и WebSockets",
    difficulty: "senior",
    answer: `## Две принципиально разные модели конкурентности

### uWSGI (и Gunicorn) — модель "процесс/поток на запрос"

WSGI-серверы реализуют классическую модель: пул **worker-процессов**, каждый из которых может иметь несколько **потоков** (или использовать gevent/eventlet-гринлеты как облегченную альтернативу потокам). Каждый запрос обрабатывается одним воркером **синхронно от начала до конца** — пока воркер обрабатывает запрос (включая ожидание ответа от БД, внешнего API и т.д.), он не может обрабатывать ничего другого (если это чистый поток без гринлетов).

\`\`\`ini
; uwsgi.ini — типичная конфигурация
[uwsgi]
module = myproject.wsgi:application
processes = 4       ; 4 отдельных процесса (полная копия памяти Python + Django на каждый)
threads = 8          ; по 8 потоков на процесс -> до 32 одновременных запросов
\`\`\`

Конкурентность достигается **горизонтально, через множество ОС-процессов/потоков**, каждый из которых потребляет свою память (хотя copy-on-write при fork немного экономит, но по факту Python-объекты быстро "расходятся" из-за refcounting, так что реальная экономия скромная).

### Uvicorn/Daphne — модель "event loop + корутины"

ASGI-серверы запускают **один event loop на процесс** (обычно тоже несколько процессов через Gunicorn+UvicornWorker для утилизации нескольких ядер, но внутри каждого процесса — один event loop). Конкурентность достигается через **кооперативную многозадачность**: пока одна корутина ждет \`await\` (сетевой I/O, БД-запрос через async-драйвер), event loop переключается на обработку другого запроса **в том же потоке/процессе**.

\`\`\`bash
# запуск через Gunicorn с ASGI worker (типичный продакшен-вариант)
gunicorn myproject.asgi:application -k uvicorn.workers.UvicornWorker -w 4
\`\`\`

## Влияние на I/O-bound задачи

Для I/O-bound нагрузки (запрос ждет ответа от внешнего сервиса, БД, диска) разница принципиальна:

| | uWSGI (потоки) | Uvicorn/Daphne (event loop) |
|---|---|---|
| Механизм ожидания I/O | Поток блокируется на syscall, ОС переключает контекст на другой поток | Корутина отдает управление (\`await\`) в event loop без блокировки треда |
| Стоимость "одного ожидающего запроса" | Целый OS-поток (стек ~1-8 МБ virtual, реальное потребление меньше, но не нулевое) с overhead на context switch | Легковесный объект корутины (килобайты), переключение — просто вызов Python-функции |
| Максимум одновременных "ожидающих" соединений | Ограничен числом потоков (десятки-сотни практически, тысячи — уже дорого) | Тысячи-десятки тысяч (ограничено больше файловыми дескрипторами и памятью на соединение, чем самой моделью) |
| Подходит для | Смешанная нагрузка, CPU-bound views, устоявшийся sync-стек (большинство Django-проектов) | Много одновременных долгоживущих соединений (WebSocket, SSE, long-polling), много параллельных внешних I/O-вызовов на один запрос |

Практически: если у вас 1000 одновременных клиентов, которые в основном ждут ответа от медленного внешнего API, — под uWSGI это означает 1000 занятых потоков (или отказ в обслуживании из-за нехватки потоков в пуле), под Uvicorn — 1000 корутин, каждая из которых почти не потребляет ресурсов, пока ждет \`await\`.

## Влияние на потребление памяти

- **uWSGI**: память масштабируется примерно линейно с числом **процессов** (каждый процесс — полная копия интерпретатора + загруженного Django-приложения, тесты показывают десятки-сотни МБ на процесс для среднего Django-проекта). Потоки внутри процесса делят память приложения (GIL-модель CPython — общая память, но конкурентность по CPU все равно ограничена GIL), поэтому увеличение числа потоков дешевле по памяти, чем увеличение числа процессов, но не увеличивает параллелизм CPU-bound кода.
- **Uvicorn/Daphne**: память на один *процесс* сравнима с uWSGI-процессом (тот же интерпретатор + Django), но так как один процесс может держать тысячи конкурентных корутин почти бесплатно (в отличие от тысяч потоков), для I/O-bound нагрузки суммарное потребление памяти на единицу "одновременно обслуживаемых клиентов" значительно ниже.

## Важная оговорка: CPU-bound код не выигрывает от event loop

Если view выполняет тяжелые вычисления (сериализация большого JSON, обработка изображений, криптография) — ни модель потоков (из-за GIL), ни модель event loop не дают реального параллелизма на CPU. Для CPU-bound нагрузки правильный инструмент — **несколько процессов** (что справедливо для обоих серверов: и uWSGI с несколькими процессами, и Gunicorn+Uvicorn с несколькими воркер-процессами), либо выгрузка тяжелых вычислений в Celery/отдельный сервис.

## Практический вывод

uWSGI с потоками — простая, зрелая, "дешевая по умолчанию" модель, отлично подходящая для типичного Django-приложения с классическим sync ORM и умеренным числом одновременных запросов. Uvicorn/Daphne оправданы, когда в приложении реально много I/O-bound конкурентности на уровне отдельного запроса (много параллельных внешних вызовов) или когда нужны долгоживущие соединения (WebSocket через Channels, SSE) — в этих случаях event loop даёт кардинально лучшую утилизацию памяти и способность держать на порядки больше одновременных соединений на том же железе. Выбор — не "что лучше вообще", а "что соответствует профилю нагрузки конкретного проекта".`,
  },
  {
    id: "django-channels-architecture-channel-layer",
    question:
      "Как архитектурно устроены Django Channels? Какую роль играет Channel Layer (например, Redis) в распределении WebSocket-соединений между инстансами приложения?",
    category: "Асинхронность, Concurrency и WebSockets",
    difficulty: "senior",
    answer: `## Зачем Channels вообще нужен

Стандартный Django (WSGI) построен вокруг модели "запрос → ответ": HTTP-запрос приходит, обрабатывается, соединение закрывается. WebSocket — это принципиально другая модель: **долгоживущее двунаправленное соединение**, где сервер должен уметь и получать сообщения от клиента, и **самостоятельно, в произвольный момент**, отправлять сообщения клиенту (например, когда другой пользователь написал сообщение в чате). WSGI для этого не подходит вообще — нужен ASGI-сервер и специальная абстракция поверх него. Django Channels — официальный проект, который добавляет эту абстракцию.

## Ключевые компоненты архитектуры

### 1. ASGI-приложение и протокольный роутер

\`\`\`python
# asgi.py
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import myapp.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),           # обычные HTTP-запросы идут в Django как обычно
    "websocket": AuthMiddlewareStack(
        URLRouter(myapp.routing.websocket_urlpatterns)  # WebSocket-запросы идут в Channels-роутинг
    ),
})
\`\`\`

\`ProtocolTypeRouter\` разделяет входящие соединения по протоколу — HTTP продолжает обрабатываться стандартным Django-стеком, WebSocket уходит в отдельный маршрутизатор с Consumer'ами.

### 2. Consumer — аналог view, но для долгоживущего соединения

\`\`\`python
# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # подписка на группу в Channel Layer
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        # рассылаем сообщение всем в группе (в том числе на других инстансах приложения!)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": data["message"]},
        )

    async def chat_message(self, event):
        # этот метод вызывается у КАЖДОГО consumer'а, подписанного на группу
        await self.send(text_data=json.dumps({"message": event["message"]}))
\`\`\`

Consumer живет столько же, сколько живет соединение — в отличие от view, которая существует только на время обработки одного запроса.

### 3. Channel Layer — распределенная "нервная система" между инстансами

Вот ключевой архитектурный момент: у каждого WebSocket-соединения есть уникальное имя канала (\`self.channel_name\`), локальное для конкретного ASGI-процесса. Но если у вас несколько инстансов приложения (за балансировщиком нагрузки, в разных контейнерах/подах), пользователь A может быть подключен к инстансу №1, а пользователь B — к инстансу №2. Когда A отправляет сообщение в общую комнату чата, как доставить его B, если B физически подключен к другому процессу?

**Channel Layer** — это внешний брокер сообщений (в проде почти всегда **Redis**, через \`channels_redis\`), который решает эту задачу:

\`\`\`python
# settings.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("redis-host", 6379)]},
    },
}
\`\`\`

Механика:
1. \`group_add(group_name, channel_name)\` — Redis хранит соответствие "группа → список имен каналов", причем эти каналы могут принадлежать *разным* процессам/инстансам.
2. \`group_send(group_name, message)\` — сообщение публикуется в Redis; **каждый инстанс приложения**, у которого есть локальный consumer, подписанный на один из каналов этой группы, получает сообщение через свой обработчик и доставляет его "своему" локальному WebSocket-соединению.
3. Каждый инстанс Channels-worker подписан на Redis pub/sub (или использует Redis-специфичный протокол channels_redis) и постоянно слушает сообщения, адресованные каналам, которые физически "живут" на этом инстансе.

Это делает WebSocket-рассылку **горизонтально масштабируемой**: не важно, сколько инстансов приложения запущено и к какому из них подключен конкретный клиент — Redis Channel Layer гарантирует, что \`group_send\` долетит до всех подписчиков группы независимо от того, на каком физическом процессе они находятся.

## Разница между Channel Layer и обычным Redis Pub/Sub

Channel Layer — это не просто pub/sub, это более сложный протокол с гарантиями доставки "как минимум одному consumer'у на канал" (не broadcast всем подряд бездумно), поддержкой групп как отдельной абстракции над отдельными каналами, и учетом ограничений (TTL сообщений, ограничение размера очереди на канал — если consumer не читает достаточно быстро, старые сообщения на его канале могут отбрасываться, что важно понимать при проектировании — Channel Layer не гарантирует durable-доставку как полноценная очередь сообщений типа RabbitMQ).

## Роль ASGI-серверов (Daphne / Uvicorn с worker'ами Channels)

Channels может работать под Daphne (оригинальный ASGI-сервер проекта Channels) или под связкой Uvicorn+Gunicorn. Отдельно от HTTP/WS-обработки существует концепция **Channels worker-процессов** — если используются background-consumers (не связанные с конкретным HTTP/WS-соединением, а слушающие произвольные каналы для фоновой обработки), их нужно запускать отдельной командой (\`python manage.py runworker\`), что архитектурно похоже на Celery worker, но через тот же Channel Layer вместо отдельного брокера задач.

## Практический вывод

Django Channels добавляет к Django ASGI-нативный слой для долгоживущих соединений через Consumer'ы (аналог views для WebSocket). Ключевая архитектурная проблема, которую решает Channel Layer (обычно на Redis) — это **межпроцессная и межинстансная маршрутизация сообщений**: без него WebSocket-рассылка работала бы только в рамках одного процесса, что делает приложение немасштабируемым горизонтально. Понимание того, что \`group_send\` физически проходит через внешний брокер (а не просто вызывает Python-функцию в памяти), критично для оценки задержек, лимитов пропускной способности и правильного sizing Redis-инстанса под нагрузку WebSocket-трафика.`,
  },
  {
    id: "django-blocking-sync-ops-in-async-views",
    question:
      "Как правильно выполнять долгие блокирующие (синхронные) операции внутри асинхронных представлений (async views) в Django 4+, чтобы не заблокировать event loop?",
    category: "Асинхронность, Concurrency и WebSockets",
    difficulty: "senior",
    answer: `## Суть проблемы

Async view в Django выполняется в event loop ASGI-сервера. Event loop — **однопоточная** модель кооперативной многозадачности: пока текущая корутина выполняет синхронный, блокирующий код (без \`await\`), **абсолютно все остальные** запросы, обрабатываемые этим же процессом, простаивают — включая другие пользователи, health-check'и, вообще всё. Это критично отличается от sync-мира, где блокировка одного потока не трогает другие потоки/процессы.

\`\`\`python
import time

async def bad_view(request):
    time.sleep(5)  # КАТАСТРОФА: блокирует ВЕСЬ процесс на 5 секунд для ВСЕХ пользователей
    return JsonResponse({"ok": True})
\`\`\`

Эта ошибка тихая — код "работает", тесты с одним клиентом проходят, а под конкурентной нагрузкой сервис полностью деградирует.

## Правильный инструмент: sync_to_async

\`asgiref.sync.sync_to_async\` — обертка, которая выполняет синхронную функцию **в отдельном потоке из thread pool**, возвращая awaitable, не блокируя event loop:

\`\`\`python
from asgiref.sync import sync_to_async
import time

def blocking_operation():
    time.sleep(5)
    return "done"

async def good_view(request):
    result = await sync_to_async(blocking_operation)()
    return JsonResponse({"result": result})
\`\`\`

Пока \`blocking_operation\` выполняется в фоновом потоке, event loop свободен и обслуживает другие запросы.

## thread_sensitive — важная и часто упускаемая деталь

\`sync_to_async\` имеет параметр \`thread_sensitive\` (по умолчанию \`True\`):

- **\`thread_sensitive=True\`** (по умолчанию) — функция выполняется в **едином выделенном потоке** для всего процесса (тот же поток, где Django обычно исполняет sync-код, включая ORM). Это гарантирует совместимость с thread-local состоянием Django (соединения с БД, транзакции) и предотвращает ситуацию, когда две "синхронные" операции из разных async-запросов внезапно выполняются в разных потоках, ломая thread-local инварианты.
- **\`thread_sensitive=False\`** — функция уходит в общий thread pool (\`ThreadPoolExecutor\`), что позволяет **реальную конкурентность** нескольких таких блокирующих вызовов одновременно, но теряет гарантии thread-affinity.

\`\`\`python
# для CPU-bound/IO-bound операций, которые НЕ трогают Django ORM/thread-locals
result = await sync_to_async(cpu_or_io_heavy_func, thread_sensitive=False)()
\`\`\`

Правило: если функция трогает ORM, кеш thread-local соединения или что-то в этом духе — оставлять \`thread_sensitive=True\` (по умолчанию). Если это независимая чистая функция (парсинг файла, вызов внешней C-библиотеки через блокирующий SDK) — можно смело выставлять \`False\` для лучшей утилизации.

## Альтернатива: выполнение в ThreadPoolExecutor / ProcessPoolExecutor напрямую

Для более тонкого контроля (например, свой pool с ограниченным числом воркеров под конкретную задачу) можно работать напрямую с \`concurrent.futures\` через \`loop.run_in_executor\`:

\`\`\`python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=10)

async def view_with_custom_pool(request):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, blocking_operation)
    return JsonResponse({"result": result})
\`\`\`

Это дает контроль над размером пула конкретно под эту задачу (изолированно от общего Django thread pool), что полезно, если операция дорогая по памяти/ресурсам и нужно ограничить параллелизм отдельно.

## CPU-bound операции — thread pool не спасает от GIL

Важная оговорка: \`sync_to_async\`/\`run_in_executor\` с потоками решает проблему **блокировки event loop**, но не решает проблему **GIL** — если операция CPU-bound (не I/O-bound), несколько потоков все равно не дадут параллелизма на CPU (GIL позволяет исполняться только одному Python-байткоду за раз). Для по-настоящему тяжелых вычислений правильный путь — **ProcessPoolExecutor** (реальные отдельные процессы, обходят GIL) либо, что чаще правильно архитектурно, — выгрузка задачи в Celery/отдельный воркер-сервис, а async view лишь ставит задачу в очередь и сразу отдает ответ (или использует WebSocket/polling для уведомления о готовности).

\`\`\`python
from concurrent.futures import ProcessPoolExecutor

process_executor = ProcessPoolExecutor(max_workers=4)

async def cpu_heavy_view(request):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(process_executor, heavy_cpu_function, data)
    return JsonResponse({"result": result})
\`\`\`

## Практическое правило принятия решения

1. Операция async-нативна (httpx, async DB-драйвер, redis.asyncio) → просто \`await\` напрямую, никаких обёрток не нужно.
2. Операция синхронная, I/O-bound, трогает Django ORM/thread-locals → \`sync_to_async(..., thread_sensitive=True)\` (по умолчанию).
3. Операция синхронная, I/O-bound, независимая (внешний блокирующий SDK) → \`sync_to_async(..., thread_sensitive=False)\` для лучшей конкурентности.
4. Операция CPU-bound и короткая → можно потерпеть в thread pool, не критично.
5. Операция CPU-bound и тяжелая (секунды+) → ProcessPoolExecutor или, что архитектурно правильнее, вынос в Celery.

## Вывод

Главная дисциплина при написании async views в Django — никогда не вызывать блокирующий синхронный код напрямую без обёртки, потому что это блокирует не один запрос, а весь процесс целиком. \`sync_to_async\` с правильно выбранным \`thread_sensitive\` — стандартный инструмент для I/O-bound синхронных операций; для по-настоящему тяжелых CPU-bound задач единственное реальное решение — уйти от потоков к отдельным процессам или фоновым воркерам, так как GIL всё равно не даст параллелизма на уровне потоков внутри одного процесса.`,
  },
  {
    id: "django-multiprocessing-vs-threading-management-commands",
    question:
      "Сравните подходы к использованию multiprocessing и threading в контексте выполнения тяжелых management-команд или скриптов внутри окружения Django.",
    category: "Асинхронность, Concurrency и WebSockets",
    difficulty: "senior",
    answer: `## Контекст: почему management-команды — особый случай

В отличие от request-response цикла, management-команда (\`python manage.py my_command\`) — это долгоживущий batch-процесс: миграция данных, массовая пересборка индексов, обработка миллионов строк, экспорт/импорт. Здесь вопрос конкурентности стоит иначе, чем в веб-обработчике: нет ограничения "не заблокировать event loop для других пользователей" (это отдельный процесс), зато остро стоит вопрос **производительности всей batch-операции** и **безопасного использования Django ORM/соединений с БД** в конкурентном контексте.

## threading в контексте management-команд

\`\`\`python
from django.core.management.base import BaseCommand
from concurrent.futures import ThreadPoolExecutor
from myapp.models import Order

class Command(BaseCommand):
    def handle(self, *args, **options):
        order_ids = list(Order.objects.filter(status="pending").values_list("id", flat=True))

        def process_order(order_id):
            order = Order.objects.get(id=order_id)
            # ... какая-то I/O-bound обработка (вызов внешнего API, отправка email)
            order.status = "processed"
            order.save()

        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(process_order, order_ids)
\`\`\`

**Когда имеет смысл**: задача **I/O-bound** — каждая единица работы в основном ждет (внешний API, отправка писем, сетевые запросы), а не грузит CPU. Потоки в CPython не дают параллелизма CPU из-за GIL, но отлично перекрывают время ожидания I/O — пока один поток ждет ответа от сети, другой может выполняться.

**Подводные камни специфичные для Django**:
- **Соединения с БД по умолчанию не shared между потоками безопасно** — Django создает соединение с БД **на поток** (thread-local), так что каждый поток в пуле получит свое собственное соединение при первом обращении к ORM. Это означает N потоков = N открытых соединений с БД — нужно убедиться, что \`CONN_MAX_AGE\` и лимиты соединений на стороне PostgreSQL (\`max_connections\`) это выдержат, особенно если несколько management-команд запускаются параллельно (cron).
- Каждый поток должен сам закрыть соединение или полагаться на то, что Django закроет его в конце запроса — **вне request-response цикла management-команды сами не закрывают соединения автоматически**, это может приводить к "утечке" открытых соединений при большом количестве потоков/итераций, если не вызывать \`django.db.connection.close()\` явно по завершении работы потока.

## multiprocessing в контексте management-команд

\`\`\`python
from django.core.management.base import BaseCommand
from multiprocessing import Pool
from myapp.models import Order

def process_order(order_id):
    # ВАЖНО: соединение с БД нужно переустановить в каждом процессе
    from django.db import connection
    connection.close()  # закрываем унаследованное от родителя (может быть невалидным после fork)

    order = Order.objects.get(id=order_id)
    result = heavy_cpu_computation(order)  # CPU-bound работа
    order.computed_value = result
    order.save()

class Command(BaseCommand):
    def handle(self, *args, **options):
        order_ids = list(Order.objects.filter(status="pending").values_list("id", flat=True))
        with Pool(processes=4) as pool:
            pool.map(process_order, order_ids)
\`\`\`

**Когда имеет смысл**: задача **CPU-bound** — тяжелые вычисления (обработка изображений, сложные расчеты, парсинг больших объемов данных), где нужен реальный параллелизм по ядрам процессора, обходящий GIL.

**Критические подводные камни специфичные для Django**:
- **Fork и наследование соединений с БД** — при использовании \`fork\` (стандартный старт-метод на Linux) дочерний процесс наследует файловый дескриптор соединения с БД родителя. Если оба процесса (родитель и потомок) попытаются использовать одно и то же "наследованное" соединение — это приведет к порче протокола на уровне TCP-сокета и непредсказуемым ошибкам. **Обязательно** закрывать/пересоздавать соединение в начале работы каждого дочернего процесса (\`connection.close()\` перед первым ORM-вызовом в потомке).
- **Django settings и app registry должны быть готовы в каждом процессе** — обычно решается тем, что \`django.setup()\` уже вызван до форка (так как management-команда запускается после инициализации Django), и fork копирует уже готовое состояние — но если используется \`spawn\` start method (по умолчанию на macOS/Windows, иногда явно выбирается для изоляции), **каждый новый процесс с нуля импортирует модуль и должен сам вызвать \`django.setup()\`** — это частый источник \`AppRegistryNotReady\` ошибок при переносе кода с Linux на другую платформу или явном выборе spawn.
- **Передача объектов между процессами через pickle** — multiprocessing сериализует аргументы через pickle при передаче между процессами. Django QuerySet/Model-инстансы можно передавать, но безопаснее передавать только **примитивы (id'шники)** и заново получать объект внутри дочернего процесса — избегает проблем с устаревшими данными и большими объемами данных, гоняемых через IPC.
- **Оверхед на старт процесса** — создание нового процесса значительно дороже создания потока (полная копия интерпретатора, повторная инициализация Django app registry при spawn) — multiprocessing оправдан, только если единица работы достаточно велика, чтобы оверхед старта не доминировал.

## Сравнительная таблица

| | threading | multiprocessing |
|---|---|---|
| Подходит для | I/O-bound операции (сеть, файлы, внешние API) | CPU-bound операции (вычисления) |
| Параллелизм на CPU | Нет (GIL) | Да (отдельные процессы, отдельный GIL у каждого) |
| Память | Общая (эффективно) | Изолированная (каждый процесс — своя копия, дороже) |
| Соединения с БД | По одному на поток (thread-local), требуют аккуратного closing | По одному на процесс, требуют явного пересоздания после fork |
| Оверхед создания | Низкий | Высокий (особенно при spawn) |
| Передача данных | Прямой доступ к общим объектам в памяти | Через IPC/pickle — только сериализуемые данные |
| Типичный размер пула | Десятки-сотни (для I/O) | Обычно ≈ число ядер CPU |

## Практическая рекомендация

Для типичной "тяжелой management-команды" в Django: если узкое место — сетевые вызовы или ожидание внешних сервисов (частый случай — массовая отправка уведомлений, синхронизация с внешним API) — **threading** с ThreadPoolExecutor, с явным управлением соединениями с БД (закрывать после использования, следить за лимитом соединений). Если узкое место — вычисления (обработка данных, генерация отчетов, ML-инференс) — **multiprocessing** с обязательным пересозданием соединения с БД в каждом дочернем процессе и передачей только идентификаторов, а не целых Django-объектов, между процессами. В обоих случаях — всегда тестировать под реалистичным объемом данных, так как оверхед на управление конкурентностью (потоками/процессами) может "съесть" весь выигрыш на небольших датасетах.`,
  },
  {
    id: "django-secrets-management-vault",
    question:
      "Как спроектировать систему управления секретами (например, HashiCorp Vault, AWS Secrets Manager) в распределенном Django-проекте, исключив их утечку через CI/CD или переменные окружения?",
    category: "Безопасность, DevOps и Инфраструктура",
    difficulty: "senior",
    answer: `## Почему "просто .env" не масштабируется и не безопасен

Классический подход — хранить секреты в переменных окружения (\`.env\`, значения в настройках CI/CD, секреты Kubernetes) — работает для небольших проектов, но в распределенной системе с несколькими сервисами, окружениями (dev/staging/prod) и командой разработчиков создает системные риски:

- **Секреты "размазаны"** по десяткам мест: CI/CD переменные, Kubernetes Secrets (которые по умолчанию — просто base64, не шифрование), локальные \`.env\`-файлы разработчиков, конфиги серверов.
- **Нет аудита** — кто и когда обращался к секрету, кто его изменил, невозможно отследить без специализированного инструмента.
- **Нет ротации без даунтайма** — смена пароля БД означает передеплой всех сервисов с новой переменной окружения.
- **Утечка через логи/CI** — переменные окружения легко случайно попадают в лог CI-пайплайна (\`env | grep\`, дамп окружения при ошибке сборки) или в артефакты сборки.

## Целевая архитектура: централизованное хранилище секретов + динамическая выдача

### Принцип: секреты не лежат в конфигурации, они запрашиваются во время выполнения

\`\`\`python
# settings.py — НЕ читаем секрет из os.environ напрямую как финальный источник
import hvac  # клиент HashiCorp Vault

def get_secret(path, key):
    client = hvac.Client(url=os.environ["VAULT_ADDR"])
    client.auth.approle.login(
        role_id=os.environ["VAULT_ROLE_ID"],
        secret_id=os.environ["VAULT_SECRET_ID"],
    )
    secret_response = client.secrets.kv.v2.read_secret_version(path=path)
    return secret_response["data"]["data"][key]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": get_secret("django-app/prod/db", "name"),
        "PASSWORD": get_secret("django-app/prod/db", "password"),
        # ...
    }
}
\`\`\`

Здесь в переменных окружения остаются только **параметры для аутентификации в Vault** (\`VAULT_ROLE_ID\`/\`VAULT_SECRET_ID\`), а не сами прикладные секреты — это принципиально другой уровень: даже если утечет \`VAULT_ROLE_ID\`, злоумышленник получит доступ только в рамках прав, назначенных этой AppRole, с полным аудитом обращений.

### AppRole/IAM-аутентификация вместо статичных токенов

- **Vault AppRole** — приложение аутентифицируется через role_id + secret_id (secret_id может быть одноразовым/short-lived, выдается через безопасный orchestration-механизм при старте контейнера).
- **AWS Secrets Manager + IAM Role** — в AWS-инфраструктуре предпочтительнее вообще не хранить учетные данные для доступа к Secrets Manager: контейнер/EC2/ECS-задача получает **IAM Role** через instance metadata, и SDK (boto3) автоматически подхватывает временные credentials — секрет для доступа к секретам вообще не нужно передавать явно.

\`\`\`python
import boto3
import json

def get_secret(secret_name, region="us-east-1"):
    client = boto3.client("secretsmanager", region_name=region)
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

# IAM Role контейнера уже дает право читать конкретный секрет — никаких ключей в коде/переменных
db_creds = get_secret("prod/django-app/db")
\`\`\`

## Исключение утечки через CI/CD

1. **CI/CD не должен знать секреты приложения вообще**, если это возможно — деплой запускает контейнер, который сам получает секреты из Vault/Secrets Manager через свою Role во время старта, а не через переменные, прописанные в пайплайне.
2. Если CI/CD все же нужен доступ к секретам (например, для миграций во время деплоя) — использовать **short-lived, scoped credentials**, выдаваемые динамически на время выполнения джобы (Vault поддерживает **dynamic secrets** — например, временные учетные данные к БД, генерируемые Vault и автоматически истекающие через заданный TTL), а не постоянные пароли, прописанные в настройках CI один раз и живущие вечно.
3. **Маскирование в логах** — большинство современных CI-систем (GitHub Actions, GitLab CI) автоматически маскируют значения, зарегистрированные как secrets, в выводе логов — но это не защищает от вывода через \`base64\`/промежуточные преобразования, поэтому дисциплина "никогда не \`echo\` секрет, даже для дебага" должна быть частью code review CI-конфигов.
4. **Разделение прав доступа**: секреты для staging и production должны быть физически разными путями/движками в Vault с разными политиками доступа — CI-пайплайн, деплоящий staging, не должен физически иметь возможность прочитать production-секреты, даже если конфигурация будет случайно перепутана.

## Ротация секретов без даунтайма

- **Dynamic database credentials (Vault)** — вместо статического пароля БД, Vault генерирует уникальные, недолгоживущие учетные данные на каждый lease; приложение переподключается с новыми credentials до истечения TTL (через background-таск, слушающий lease renewal).
- **Версионирование секретов** — Secrets Manager/Vault KV v2 хранят версии секрета; ротация — создание новой версии, приложения читают "текущую" версию при следующем обращении/перезапуске, старая версия остается доступной короткое время для graceful rollover (на случай, если не все инстансы успели подхватить новую версию одновременно).

## Локальная разработка без компромиссов в безопасности

Для разработчиков — не давать доступ к production Vault вообще; локальная разработка использует **отдельный dev-namespace** в Vault с фейковыми/тестовыми секретами, либо локальный docker-compose с локальным Vault dev-server (\`vault server -dev\`), чтобы паттерн получения секретов в коде был единым для всех окружений, но физический источник данных — разный и изолированный.

## Вывод

Правильная архитектура управления секретами в распределенном Django-проекте убирает секреты из статической конфигурации (переменные окружения, файлы) и заменяет их **динамическим запросом во время выполнения** через централизованное хранилище (Vault/Secrets Manager) с аутентификацией через роли/IAM, а не статичные токены. Это даёт аудит, возможность ротации без передеплоя, минимизацию blast radius при утечке (скомпрометированная AppRole ограничена конкретными правами, а не всем набором секретов) и убирает саму возможность "секрет попал в CI-лог", так как CI/CD в идеале вообще не видит прикладные секреты приложения.`,
  },
  {
    id: "django-zero-downtime-deployment-schema-migrations",
    question:
      "Опишите ваш процесс организации Zero-Downtime Deployment (деплоя без простоя). Как выстраивается процесс обновления, если релиз включает обратно несовместимые изменения схемы БД?",
    category: "Безопасность, DevOps и Инфраструктура",
    difficulty: "senior",
    answer: `## Базовая механика Zero-Downtime Deployment

Классический ZDD строится на **rolling deployment**: новые инстансы приложения запускаются параллельно со старыми, проходят health-check, после чего балансировщик нагрузки постепенно переключает трафик на новые инстансы, а старые — выводятся из ротации и останавливаются.

\`\`\`yaml
# Пример стратегии rolling update в Kubernetes
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0   # ни один под не должен пропасть из обслуживания
      maxSurge: 1          # можно временно запустить на 1 под больше, чем реплик
\`\`\`

Ключевое следствие: **на протяжении деплоя одновременно работают старая и новая версия кода**, и обе версии в этот момент обращаются к **одной и той же базе данных**. Именно это делает миграции схемы БД самой сложной частью ZDD — любое изменение схемы должно быть совместимо с обеими версиями кода одновременно.

## Принцип: разделение деплоя кода и миграции схемы на несколько независимых, обратно совместимых шагов

Обратно несовместимое изменение (переименование колонки, смена типа, удаление колонки/таблицы, добавление NOT NULL без default) **никогда не выполняется одним шагом**. Стандартный паттерн — экспандно-контрактный цикл (Expand/Contract, также известный как parallel change):

### Пример: переименование колонки \`name\` → \`full_name\`

**Шаг 1 (Expand) — деплой N: добавляем новое поле, не трогая старое**
\`\`\`python
# migration 0001
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(model_name="user", name="full_name", field=models.CharField(max_length=255, null=True)),
    ]
\`\`\`
Код деплоя N пишет в **оба** поля (\`name\` и \`full_name\`) при сохранении, читает пока из старого \`name\` — старая версия кода (та, что еще работает во время rolling update) ничего не знает о новом поле и продолжает работать штатно.

**Шаг 2 (Backfill) — отдельная задача, не блокирующая деплой**
\`\`\`python
# management-команда или data migration с батчингом, чтобы не заблокировать таблицу целиком
for batch in queryset_iterator(User.objects.filter(full_name__isnull=True), batch_size=1000):
    for user in batch:
        user.full_name = user.name
        user.save(update_fields=["full_name"])
\`\`\`
Backfill выполняется после того, как деплой N полностью раскатан (все инстансы пишут в оба поля), батчами, чтобы не создавать долгие блокировки на большой таблице.

**Шаг 3 (Deploy N+1) — переключаем чтение на новое поле**
Код начинает читать/писать только \`full_name\`, старое поле \`name\` больше не используется приложением, но физически еще существует в БД (на случай, если понадобится откат к деплою N).

**Шаг 4 (Contract) — деплой N+2, после того, как откат к N уже не рассматривается**
\`\`\`python
# migration — удаляем старое поле, только когда ВСЕ версии кода, которые от него зависели, выведены из эксплуатации
class Migration(migrations.Migration):
    operations = [
        migrations.RemoveField(model_name="user", name="name"),
    ]
\`\`\`

## Почему нельзя просто "накатить миграцию и задеплоить код одновременно"

Если бы удаление старого поля произошло **в момент**, когда старая версия кода еще работает (rolling update не мгновенен — при большом кластере переход может занимать минуты), старая версия немедленно начала бы получать ошибки \`column does not exist\` на каждом запросе, обращающемся к удаленному полю — то есть частичный downtime именно во время deployment, который должен быть "zero-downtime".

## Специфика Django migrations в этом процессе

- **\`RunPython\` с батчингом и \`atomic=False\`** для data migrations на больших таблицах — миграция по умолчанию оборачивается в транзакцию; на таблице с миллионами строк long-running транзакция может держать locks и раздувать WAL/undo-логи. Явно указываем \`atomic = False\` в классе Migration и делаем backfill небольшими коммитящимися батчами.
- **\`AddField\` с NOT NULL без default на большой таблице** — исторически (до PostgreSQL 11) требовало полной перезаписи таблицы с эксклюзивной блокировкой; современный PostgreSQL (11+) добавляет колонку с default быстро (metadata-only для constant default), но добавление **NOT NULL без default** все еще может требовать полного сканирования для проверки constraint — поэтому паттерн: добавить nullable → backfill → затем добавить NOT NULL constraint отдельным шагом (в PostgreSQL 12+ можно использовать \`NOT VALID\` + \`VALIDATE CONSTRAINT\` для избежания блокировки на все время проверки).
- **Изменение индексов** — \`CREATE INDEX CONCURRENTLY\` (в Django — \`AddIndex\` с \`Meta: {"concurrent": True}\` через \`django.contrib.postgres.operations.AddIndexConcurrently\` или ручной RunSQL) вместо обычного \`CREATE INDEX\`, чтобы не держать таблицу заблокированной на запись во время построения индекса.
- **Порядок операций миграции и код должны быть в разных релизах**, никогда одним PR/деплоем — команда должна дисциплинированно разбивать "добавили поле" и "начали его использовать" на минимум два отдельных деплоя.

## Feature flags как дополнительный уровень безопасности

Часто expand/contract комбинируется с feature flag: новый код, использующий новое поле, деплоится "выключенным" (флаг off), затем включается флагом после того, как backfill завершен и все инстансы точно на новой версии — это дает возможность откатить **поведение** мгновенно (через флаг), без необходимости откатывать деплой целиком, если что-то пошло не так.

## Вывод

Zero-downtime deployment с обратно несовместимыми изменениями схемы строится на разбиении одного логического изменения на несколько маленьких, каждое из которых по отдельности обратно совместимо со старой версией кода: expand (добавить новое, не трогая старое) → backfill (батчами, отдельно от деплоя) → переключение чтения/записи на новое → contract (удаление старого, только когда откат к прежним версиям кода уже невозможен). Ключевая дисциплина — никогда не удалять/переименовывать/делать breaking change на схеме в том же деплое, где меняется код, который на это рассчитывает, потому что во время rolling update старая и новая версия кода работают против одной БД одновременно.`,
  },
  {
    id: "django-ssrf-xxe-protection",
    question:
      "Опишите стратегии защиты от сложных векторов атак, таких как SSRF (Server-Side Request Forgery) и XXE (XML External Entity), при обработке пользовательского контента и парсинге сторонних ресурсов.",
    category: "Безопасность, DevOps и Инфраструктура",
    difficulty: "senior",
    answer: `## SSRF — когда сервер сам становится инструментом атаки

### Суть атаки

SSRF возникает, когда приложение делает исходящий HTTP-запрос по URL, **полностью или частично контролируемому пользователем** — например, "загрузить изображение по ссылке", webhook-callback URL, интеграция с внешним API по адресу из пользовательского профиля. Злоумышленник подсовывает URL, указывающий не на внешний ресурс, а на **внутреннюю инфраструктуру**:

\`\`\`python
# ОПАСНО: наивная реализация "скачать изображение по ссылке пользователя"
import requests

def fetch_avatar(request):
    url = request.GET["url"]
    response = requests.get(url)  # злоумышленник передает http://169.254.169.254/latest/meta-data/iam/...
    return HttpResponse(response.content, content_type="image/jpeg")
\`\`\`

Классические цели SSRF: **cloud metadata endpoint** (\`169.254.169.254\` — AWS/GCP/Azure instance metadata, часто содержит временные IAM credentials без дополнительной аутентификации), внутренние сервисы за файрволом (\`http://internal-admin:8080/\`), \`localhost\`/\`127.0.0.1\` для доступа к сервисам, слушающим только на loopback.

### Защита: allowlist, а не blocklist

\`\`\`python
import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_SCHEMES = {"https"}
BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # cloud metadata
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("::1/128"),
]

def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        return False
    try:
        resolved_ip = socket.gethostbyname(parsed.hostname)
    except socket.gaierror:
        return False
    ip_obj = ipaddress.ip_address(resolved_ip)
    return not any(ip_obj in network for network in BLOCKED_NETWORKS)
\`\`\`

Критический нюанс — **проверка должна происходить на этапе реального сетевого запроса, а не только на этапе валидации строки URL**, иначе возможен **DNS rebinding**: на момент валидации домен резолвится в безопасный IP, но к моменту фактического запроса DNS-запись поменялась на внутренний адрес (TTL=0 трюк). Надежное решение — резолвить домен один раз и передавать уже резолвленный IP непосредственно в запрос (либо использовать библиотеку, которая пиннит соединение к проверенному IP, например через \`requests\` с кастомным \`HTTPAdapter\`/\`Transport\`, резолвящим адрес заранее и переиспользующим его для установки соединения).

### Дополнительные слои защиты

- **Сетевая изоляция** — исходящие запросы приложения к произвольным пользовательским URL должны идти через выделенный сетевой сегмент/egress-proxy без доступа к внутренней инфраструктуре (принцип defense-in-depth — даже если приложенческая проверка не сработает, сеть физически не пропустит запрос к internal-сервисам).
- **Отключение редиректов или их повторная проверка** — \`requests.get(url, allow_redirects=False)\`, и если получен редирект — валидировать новый URL точно так же, как исходный (иначе allowlist-проверка исходного URL обходится через 302 на внутренний адрес).
- **Таймауты и лимиты размера ответа** — обязательны независимо от SSRF, чтобы SSRF-подобный запрос не превратился в DoS через зависший/огромный ответ.

## XXE — атака через парсинг XML

### Суть атаки

XML поддерживает **DTD (Document Type Definition)** с возможностью объявления **внешних сущностей**, которые парсер разрешает во время обработки документа:

\`\`\`xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<data>&xxe;</data>
\`\`\`

Если приложение парсит такой XML "как есть" через уязвимый парсер, содержимое \`/etc/passwd\` (или любого другого файла, доступного процессу) **подставляется в результат парсинга** и может быть возвращено пользователю. Более опасный вариант — **billion laughs attack** (экспоненциальное разрастание сущностей, ссылающихся друг на друга) — DoS через исчерпание памяти, и SSRF-через-XXE, если \`SYSTEM\`-идентификатор указывает не на файл, а на внутренний URL.

### Защита: отключение внешних сущностей на уровне парсера

Стандартная библиотека Python \`xml.etree.ElementTree\` и \`xml.dom.minidom\` **исторически уязвимы** — не отключают DTD/внешние сущности по умолчанию. Правильный подход:

\`\`\`python
# ОПАСНО: xml.etree.ElementTree без дополнительных настроек уязвим к XXE в некоторых конфигурациях
import xml.etree.ElementTree as ET
tree = ET.parse(user_uploaded_file)  # потенциально уязвимо

# БЕЗОПАСНО: использовать defusedxml — drop-in замена с отключенными опасными фичами по умолчанию
import defusedxml.ElementTree as ET
tree = ET.parse(user_uploaded_file)  # DTD, внешние сущности, billion laughs — заблокированы, выбросит исключение
\`\`\`

\`defusedxml\` — стандартная рекомендация для Python: отключает \`DTD\`, внешние сущности (\`SYSTEM\`/\`PUBLIC\`), \`XInclude\` и защищает от billion laughs через лимиты на разворачивание сущностей, при этом сохраняя тот же API, что и стандартные модули (\`ElementTree\`, \`minidom\`, \`sax\`, \`expat\`) — миграция обычно сводится к замене импорта.

### Аналогичная проблема в других форматах, не только "чистом" XML

- **XLSX/DOCX/ODT** (Office Open XML/OpenDocument) — это ZIP-архивы, содержащие XML внутри; библиотеки для парсинга Excel/Word-файлов, загруженных пользователем, должны использовать XXE-защищенные парсеры внутри — стоит явно проверять, что используемая библиотека (\`openpyxl\`, \`python-docx\` и т.д.) не уязвима, или что XML-парсинг внутри них идет через безопасный backend.
- **SVG** — тоже XML-формат, загрузка пользовательских SVG-файлов (аватарки, иконки) — частый недооцененный вектор XXE и SSRF (SVG может содержать \`<image href="http://internal/...">\`); обработка пользовательских SVG должна либо санитизировать XML заранее, либо рендерить через изолированную библиотеку без резолва внешних ресурсов.

## Общий принцип, объединяющий обе защиты

И SSRF, и XXE — частные случаи одной фундаментальной проблемы: **приложение доверяет пользовательским данным настроить собственное сетевое/файловое поведение** (какой URL запросить, какой файл прочитать через сущность). Защита строится на принципе "явно разрешенное, а не явно запрещенное" (allowlist доменов/схем для SSRF, явное отключение всех потенциально опасных фич парсера для XXE) — а не на попытке угадать и заблокировать все возможные вредоносные паттерны по отдельности (blocklist регулярно обходится — DNS rebinding для SSRF, альтернативные кодировки/протоколы для XXE).

## Вывод

Защита от SSRF требует resolve-and-check конкретного IP перед запросом (не строки URL), allowlist разрешенных схем/доменов, отключения автоматических редиректов без повторной проверки, и сетевой изоляции как второго уровня защиты. Защита от XXE в Python практически полностью решается заменой стандартных XML-парсеров на \`defusedxml\` везде, где обрабатывается пользовательский или сторонний XML-контент (включая "скрытый" XML внутри Office-документов и SVG) — обе категории атак объединяет то, что стандартные библиотеки и наивные реализации не безопасны по умолчанию, и защита должна закладываться явно, а не полагаться на "это же просто парсинг файла".`,
  },
  {
    id: "django-apm-monitoring-profiling-production",
    question:
      "Как настроить глубокий мониторинг (APM - Application Performance Monitoring) и профилирование Django-приложения в production? Какие метрики и трейсы критически важно собирать?",
    category: "Безопасность, DevOps и Инфраструктура",
    difficulty: "senior",
    answer: `## Зачем APM, а не только логи и базовые метрики сервера

Логи говорят "что произошло", базовые системные метрики (CPU, память) говорят "насколько загружена машина", но ни то, ни другое не отвечает на вопрос **"почему конкретный запрос был медленным"** или **"какая часть кода — источник деградации при росте нагрузки"**. APM (Datadog, New Relic, Sentry Performance, self-hosted через OpenTelemetry + Jaeger/Grafana Tempo) заполняет этот разрыв через **распределенную трассировку (distributed tracing)** — детальную декомпозицию времени каждого запроса на составляющие.

## Инструментирование Django: где именно нужны трейсы

### 1. Автоматическая инструментация через APM-агент

\`\`\`python
# пример для OpenTelemetry (провайдер-агностичный стандарт)
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor

DjangoInstrumentor().instrument()
Psycopg2Instrumentor().instrument()
RedisInstrumentor().instrument()
CeleryInstrumentor().instrument()
\`\`\`

Такая инструментация автоматически создает **spans** (единицы измеримой работы) для: входящего HTTP-запроса, каждого SQL-запроса (с точным текстом запроса и временем выполнения), обращений к Redis/кешу, вызовов Celery-задач — и собирает их в единый **trace** на запрос, показывающий waterfall-диаграмму: сколько времени ушло на middleware, сколько на view-логику, сколько на N конкретных SQL-запросов, сколько на сериализацию.

### 2. Ручная инструментация критичных бизнес-операций

Автоинструментации недостаточно для видимости внутри сложной бизнес-логики (например, многошаговый расчет цены заказа с внешними вызовами):

\`\`\`python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def calculate_order_total(order):
    with tracer.start_as_current_span("calculate_order_total") as span:
        span.set_attribute("order.id", order.id)
        span.set_attribute("order.items_count", order.items.count())

        with tracer.start_as_current_span("apply_discounts"):
            apply_discounts(order)

        with tracer.start_as_current_span("calculate_tax_external_api"):
            tax = fetch_tax_from_external_service(order)

        return order.total + tax
\`\`\`

Именованные вложенные spans с атрибутами позволяют потом фильтровать/агрегировать трейсы по бизнес-параметрам (например, "показать все медленные трейсы, где \`items_count > 50\`"), а не только по техническим метрикам.

## Критически важные метрики для сбора

### RED-метрики на уровне запросов (Rate, Errors, Duration)
- **Rate** — количество запросов в секунду по эндпоинту.
- **Errors** — доля 5xx/4xx ошибок по эндпоинту (важно разделять — рост 4xx может означать проблему клиента/API-контракта, рост 5xx — проблему сервера).
- **Duration** — не просто среднее время ответа (оно скрывает выбросы), а **перцентили p50/p95/p99** — p99 показывает опыт худших 1% запросов, что часто важнее среднего для понимания реальных жалоб пользователей.

### Метрики уровня БД
- Количество запросов на один HTTP-запрос (N+1 проблемы моментально видны, если на один view приходится 200+ запросов вместо ожидаемых 3-5).
- Время, проведенное в БД, как доля от общего времени запроса (\`db_time / total_time\`) — если это 90%, оптимизировать нужно запросы, а не код представления.
- Использование пула соединений (\`CONN_MAX_AGE\`) — количество открытых/ожидающих соединений, чтобы заранее увидеть приближение к лимиту \`max_connections\` PostgreSQL.

### Метрики очередей задач (Celery)
- Длина очереди (queue depth) — растущая очередь означает, что воркеры не успевают за темпом постановки задач.
- Время ожидания задачи в очереди до начала выполнения (latency) — отдельно от времени самого выполнения задачи.
- Доля неудачных/retried задач.

### Метрики уровня инфраструктуры, специфичные для WSGI/ASGI-модели
- Утилизация worker-пула (сколько воркеров/потоков заняты обработкой запроса прямо сейчас) — приближение к 100% предсказывает деградацию до того, как она стала заметна пользователям через рост latency.
- Memory per worker over time — постепенный рост может указывать на утечку памяти (частая причина в Django — неограниченный QuerySet-кеш, накопление объектов в module-level переменных).

## Профилирование в production без остановки сервиса

Полноценный профайлер (например, \`cProfile\`) на каждый запрос в production — недопустимый оверхед. Практический подход — **continuous profiling с низкой частотой сэмплирования** (инструменты типа Pyroscope, Datadog Continuous Profiler, py-spy) — сэмплируют стек вызовов через статистические интервалы (например, раз в 10-100 мс) с минимальным влиянием на производительность, накапливая flame graph по всему трафику за период, что позволяет увидеть "где приложение проводит CPU-время" агрегированно, без необходимости профилировать каждый отдельный запрос.

\`\`\`bash
# py-spy — сэмплирующий профайлер, подключается к живому процессу без изменения кода
py-spy dump --pid <gunicorn_worker_pid>
py-spy record -o profile.svg --pid <gunicorn_worker_pid> --duration 60
\`\`\`

## Алертинг — от метрик к действию

Сбор метрик без алертинга — просто дашборд, на который никто не смотрит до инцидента. Критичные алерты для Django-приложения: p99 latency превышает SLO, доля 5xx превышает порог за скользящее окно, queue depth Celery растет монотонно N минут подряд, память worker-процесса растет без плато (утечка), число открытых соединений с БД приближается к лимиту.

## Вывод

Глубокий APM для Django строится на распределенной трассировке (автоинструментация HTTP/ORM/кеша/Celery + ручные spans для сложной бизнес-логики), RED-метриках с фокусом на перцентили, а не средние, отдельном мониторинге специфичных для Django узких мест (N+1 запросы, пул соединений, утилизация worker'ов) и continuous-профилировании с низким оверхедом вместо разового профилирования по запросу. Ключевая цель — не просто "знать, что что-то медленно", а иметь возможность за минуты локализовать **конкретный span/SQL-запрос/участок кода**, ответственный за деградацию, без необходимости воспроизводить проблему локально.`,
  },
  {
    id: "django-data-breach-encryption-at-rest",
    question:
      "Если произошла утечка базы данных, как архитектура вашего приложения минимизирует ущерб для пользователей? Применяли ли вы шифрование конфиденциальных данных \"на лету\" (Data at Rest encryption) на уровне приложения?",
    category: "Безопасность, DevOps и Инфраструктура",
    difficulty: "senior",
    answer: `## Модель угрозы: что значит "утечка БД" конкретно

Важно различать уровни утечки, так как защита для каждого — разная:

1. **Утечка полного дампа БД** (например, через скомпрометированные учетные данные администратора или backup, оказавшийся в публичном S3-бакете) — злоумышленник получает *все* данные, в том числе то, что защищено на уровне приложения (application-level шифрование), но не то, что зашифровано ключами, которые физически не хранятся в этой же БД.
2. **SQL-инъекция с частичным доступом** — злоумышленник может читать данные через приложение, то есть эффективно "как обычный пользователь с супер-правами" — encryption at rest на уровне диска здесь не поможет вообще (данные и так расшифровываются для легитимного доступа приложения).
3. **Утечка через недостаточно ограниченный API/эндпоинт** — вообще не про БД, но частый реальный вектор "утечки данных" в продакшене.

Архитектура минимизации ущерба должна закладываться, исходя из предположения "БД когда-нибудь утечет целиком" (defense-in-depth, а не "у нас есть файрвол, значит все ок").

## Шифрование на уровне приложения (application-level encryption) — ключевая мера против сценария 1

### Почему просто "encryption at rest" на уровне диска/облака недостаточно

Managed БД (RDS, Cloud SQL) обычно включают шифрование дисков "из коробки" — но это защищает только от кражи *физического носителя*, не от утечки через дамп/бэкап/скомпрометированные креды: если у злоумышленника есть доступ на уровне SQL (украденный пароль, инъекция, скомпрометированный бэкап), диск-level шифрование прозрачно расшифровывается самой БД — оно не помогает вообще.

### Application-level encryption для конкретных полей

\`\`\`python
from django.db import models
from cryptography.fernet import Fernet
from django.conf import settings

class EncryptedCharField(models.CharField):
    def get_prep_value(self, value):
        if value is None:
            return value
        f = Fernet(settings.FIELD_ENCRYPTION_KEY)
        return f.encrypt(value.encode()).decode()

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        f = Fernet(settings.FIELD_ENCRYPTION_KEY)
        return f.decrypt(value.encode()).decode()

class UserProfile(models.Model):
    ssn = EncryptedCharField(max_length=500)         # шифруется до записи в БД
    passport_number = EncryptedCharField(max_length=500)
\`\`\`

При таком подходе, даже если весь дамп БД утечет, поля \`ssn\`/\`passport_number\` физически хранятся как шифротекст — злоумышленнику нужен **отдельный ключ шифрования**, который **не хранится в той же БД**, чтобы получить исходные значения.

### Ключевой архитектурный принцип: разделение ключа шифрования и зашифрованных данных

Ключ шифрования должен храниться и управляться **отдельно** от БД — в KMS (AWS KMS, GCP Cloud KMS, HashiCorp Vault Transit) — так, чтобы компрометация БД (дампа, бэкапа) сама по себе не давала возврата к исходным данным. В идеале — **envelope encryption**: данные шифруются локальным data-key, а сам data-key шифруется мастер-ключом в KMS и хранится зашифрованным рядом с данными — расшифровка data-key требует обращения к KMS с отдельными правами доступа (что дает точку аудита и контроля, отсутствующую при прямом хранении единого ключа в settings/переменной окружения).

### Trade-off application-level encryption

- Нельзя делать SQL-фильтрацию/поиск по зашифрованному полю напрямую (\`WHERE ssn = ...\` не сработает, так как в БД лежит шифротекст, зависящий и от IV/nonce) — для полей, по которым нужен поиск, применяется **детерминированное шифрование** (более слабое, но с воспроизводимым шифротекстом для одинаковых входных данных) либо отдельный **хеш для поиска** (HMAC от значения хранится в отдельном индексируемом поле, сам поиск идет по хешу, а не по расшифровке).
- Нужно шифровать выборочно — не всю БД целиком (это резко все усложняет и роняет производительность), а только реально чувствительные поля (PII, платежные данные, документы) — определяется через классификацию данных на этапе дизайна модели.

## Минимизация ущерба на уровне архитектуры данных

### Токенизация вместо хранения оригинала

Для платежных данных — не хранить номера карт вообще, использовать токенизацию через платежного провайдера (Stripe/аналоги хранят PCI-чувствительные данные на своей стороне, приложение работает с токеном, который бесполезен вне контекста конкретного провайдера/аккаунта).

### Минимизация хранимых данных (data minimization)

Самый надежный способ уменьшить ущерб от утечки — **не хранить то, что не обязательно хранить** — например, хранить только последние 4 цифры карты для отображения пользователю, а не полный номер; хранить хеш email для дедупликации там, где сам email не нужен бизнес-логике; устанавливать retention policy с автоматическим удалением данных, которые больше не нужны (старые логи с PII, неактивные аккаунты после периода хранения).

### Разделение данных по чувствительности на уровне схемы/сервисов

Архитектурно выделить особо чувствительные данные (PII, платежные реквизиты) в **отдельный сервис/БД с более строгим контролем доступа**, а не хранить их в той же таблице/БД, что и обычные пользовательские данные (предпочтения, история активности) — компрометация основной БД приложения в этом случае не автоматически означает компрометацию самых чувствительных данных, если у них отдельный периметр защиты.

### Хеширование, а не шифрование, для данных, которые не нужно восстанавливать

Пароли — всегда хешируются (Django по умолчанию — PBKDF2/Argon2 через \`django.contrib.auth\`), не шифруются — это принципиально другая операция: хеш нельзя обратить даже с ключом, что важно, потому что даже сама компания не должна иметь возможность "расшифровать" пароль пользователя.

## Практический вывод: слоеная защита, а не одна мера

Минимизация ущерба от утечки БД строится на нескольких независимых уровнях, каждый из которых компенсирует отказ другого: encryption at rest на уровне диска (защита от кражи физического носителя) + application-level encryption для конкретных чувствительных полей с ключом, вынесенным в отдельный KMS (защита от утечки дампа/бэкапа) + токенизация для платежных данных (защита через передачу ответственности провайдеру) + data minimization и retention policies (уменьшение объема данных, которые в принципе могут утечь) + хеширование для данных, которые никогда не должны быть восстановимы. Ни одна из этих мер по отдельности не покрывает все сценарии — архитектура должна закладывать предположение "рано или поздно один из периметров будет пробит" и гарантировать, что это не означает автоматическую компрометацию всех данных сразу.`,
  },
];
