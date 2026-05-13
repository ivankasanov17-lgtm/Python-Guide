export interface TermArgument {
  name: string;
  description: string;
}

export interface Term {
  name: string;
  description: string;
  syntax: string;
  arguments: TermArgument[];
  example: string;
}

export const terms: Term[] = [
  {
    name: "types.MappingProxyType",
    description:
      "Создаёт неизменяемое представление (прокси) словаря. Через прокси можно читать данные, но любая попытка записи или удаления вызывает TypeError. Исходный словарь при этом по-прежнему можно изменять — прокси отражает актуальное состояние. Используется в Python internals (например, cls.__dict__) и для публикации «только для чтения» словарей в API.",
    syntax: "types.MappingProxyType(mapping)",
    arguments: [
      {
        name: "mapping",
        description:
          "Словарь или любой объект, реализующий интерфейс Mapping, для которого создаётся неизменяемое представление.",
      },
    ],
    example: `from types import MappingProxyType

original = {'host': 'localhost', 'port': 5432}
proxy = MappingProxyType(original)

# Чтение работает как обычный словарь
print(proxy['host'])          # 'localhost'
print(proxy.get('port'))      # 5432
print(len(proxy))             # 2
print('host' in proxy)        # True

# Запись запрещена
try:
    proxy['host'] = 'newhost'
except TypeError as e:
    print(e)   # 'mappingproxy' object does not support item assignment

# Исходный словарь можно менять — прокси отражает изменения
original['db'] = 'mydb'
print(proxy['db'])            # 'mydb'

# Типичное использование: константы конфигурации
DEFAULTS = MappingProxyType({'timeout': 30, 'retries': 3, 'debug': False})`,
  },

  // ─── typing ───────────────────────────────────────────────────────────────
  {
    name: "typing.Any",
    description:
      "Специальная форма, совместимая с любым типом в обоих направлениях: Any совместим со всеми типами, и все типы совместимы с Any. Позволяет отключить проверку типов для конкретной переменной или аргумента — удобно при постепенной типизации кода или работе с динамическими структурами данных.",
    syntax: "x: Any",
    arguments: [],
    example: `from typing import Any

# Any отключает проверку типов — можно присваивать что угодно
value: Any = 42
value = "теперь строка"
value = [1, 2, 3]

# Полезно в функциях с динамической логикой
def process(data: Any) -> Any:
    return data

# Частичная типизация — остальные параметры строго типизированы
def log(message: str, extra: Any = None) -> None:
    print(message, extra)

# Внимание: Any «заразен» — операции с Any дают Any
def add(a: int, b: Any) -> Any:
    return a + b   # тип результата — Any, не int`,
  },
  {
    name: "typing.Union / typing.Optional",
    description:
      "Union[X, Y] означает «X или Y» — переменная может быть любым из перечисленных типов. Optional[X] — сокращение для Union[X, None], указывающее что значение может отсутствовать. Начиная с Python 3.10 Union записывается через оператор |, что делает аннотации компактнее.",
    syntax: `Union[X, Y, ...]
Optional[X]          # эквивалент Union[X, None]
X | Y                # синтаксис Python 3.10+`,
    arguments: [],
    example: `from typing import Union, Optional

# Union: несколько допустимых типов
def parse(value: Union[str, bytes]) -> str:
    if isinstance(value, bytes):
        return value.decode()
    return value

# Optional: значение или None
def find_user(user_id: int) -> Optional[str]:
    users = {1: 'Alice', 2: 'Bob'}
    return users.get(user_id)   # может вернуть None

print(find_user(1))    # 'Alice'
print(find_user(99))   # None

# Python 3.10+ — оператор |
def greet(name: str | None = None) -> str:
    return f"Hello, {name or 'stranger'}!"

# Проверка типа в рантайме
from typing import get_args
print(get_args(Optional[str]))   # (<class 'str'>, <class 'NoneType'>)`,
  },
  {
    name: "typing.Protocol",
    description:
      "Базовый класс для определения структурных подтипов («duck typing» с проверкой типов). Класс считается совместимым с Protocol, если реализует все его методы и атрибуты — без явного наследования. Это structural subtyping в отличие от nominal subtyping через ABC. Добавлен в Python 3.8.",
    syntax: `class MyProtocol(Protocol):
    def method(self) -> ReturnType: ...`,
    arguments: [],
    example: `from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...
    def area(self) -> float: ...

class Circle:
    def __init__(self, r: float):
        self.r = r
    def draw(self) -> None:
        print(f"Circle(r={self.r})")
    def area(self) -> float:
        import math
        return math.pi * self.r ** 2

class Square:
    def __init__(self, side: float):
        self.side = side
    def draw(self) -> None:
        print(f"Square(side={self.side})")
    def area(self) -> float:
        return self.side ** 2

# Ни Circle, ни Square не наследуют Drawable — но совместимы структурно
def render(shape: Drawable) -> None:
    shape.draw()
    print(f"  площадь: {shape.area():.2f}")

render(Circle(5))    # работает
render(Square(4))    # работает`,
  },
  {
    name: "typing.Generic",
    description:
      "Базовый класс для создания обобщённых (generic) классов, параметризуемых типами через TypeVar. Позволяет писать контейнеры и алгоритмы, сохраняющие информацию о типах элементов. Начиная с Python 3.9 встроенные типы (list, dict, tuple) поддерживают прямую параметризацию без Generic.",
    syntax: `class MyClass(Generic[T]):
    def method(self) -> T: ...`,
    arguments: [],
    example: `from typing import Generic, TypeVar

T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

    def __len__(self) -> int:
        return len(self._items)

stack: Stack[int] = Stack()
stack.push(1)
stack.push(2)
print(stack.pop())    # 2  — тип int известен статически

# Несколько TypeVar
class Pair(Generic[K, V]):
    def __init__(self, key: K, value: V) -> None:
        self.key, self.value = key, value

p: Pair[str, int] = Pair('age', 30)`,
  },
  {
    name: "typing.TypeVar",
    description:
      "Объявляет переменную типа — «заполнитель», который конкретизируется при использовании обобщённых функций и классов. Можно ограничить допустимые типы через bound (подтипы) или перечислить явно через позиционные аргументы. Является основой параметрического полиморфизма в системе типов Python.",
    syntax: `T = TypeVar('T')                      # любой тип
T = TypeVar('T', bound=Comparable)    # подтипы Comparable
T = TypeVar('T', int, str)            # только int или str`,
    arguments: [
      {
        name: "name",
        description:
          "Имя переменной типа в виде строки — должно совпадать с именем переменной Python.",
      },
      {
        name: "bound",
        description:
          "Верхняя граница: T может быть только подтипом указанного класса.",
      },
      {
        name: "*constraints",
        description:
          "Перечисление допустимых типов (минимум 2). Несовместимо с bound.",
      },
    ],
    example: `from typing import TypeVar

T = TypeVar('T')

def identity(x: T) -> T:
    return x

print(identity(42))       # 42  — T = int
print(identity("hello"))  # 'hello'  — T = str

# bound: T должен быть подтипом Sized
from typing import Sized
S = TypeVar('S', bound=Sized)

def first_len(a: S, b: S) -> S:
    return a if len(a) >= len(b) else b

print(first_len([1, 2, 3], [4, 5]))   # [1, 2, 3]
print(first_len("abc", "de"))         # 'abc'

# Constraints: только int или str
NumStr = TypeVar('NumStr', int, str)

def double(x: NumStr) -> NumStr:
    return x * 2

print(double(3))      # 6
print(double("ha"))   # 'haha'`,
  },
  {
    name: "typing.Annotated",
    description:
      "Позволяет прикрепить к типу произвольные метаданные, не влияющие на стандартную проверку типов, но доступные в рантайме через typing.get_type_hints() и typing.get_args(). Применяется в библиотеках (Pydantic, FastAPI, attrs) для валидации, документации и внедрения зависимостей прямо в аннотациях.",
    syntax: "Annotated[type, metadata1, metadata2, ...]",
    arguments: [
      {
        name: "type",
        description:
          "Основной тип, который будет использоваться при стандартной проверке типов.",
      },
      {
        name: "metadata",
        description:
          "Произвольные объекты-метаданные. Могут быть любого типа: строки, числа, экземпляры классов-ограничений.",
      },
    ],
    example: `from typing import Annotated, get_type_hints, get_args

# Простые метаданные для документации
UserId   = Annotated[int, "положительное целое, ID пользователя"]
Percent  = Annotated[float, "от 0.0 до 100.0"]

def create_user(user_id: UserId, completion: Percent) -> None:
    print(f"user={user_id}, completion={completion}%")

# Библиотека может читать метаданные в рантайме
hints = get_type_hints(create_user, include_extras=True)
args  = get_args(hints['completion'])
print(args)   # (<class 'float'>, 'от 0.0 до 100.0')

# Pydantic-стиль — валидация через метаданные
from dataclasses import dataclass

class Gt:
    def __init__(self, value): self.value = value

PositiveInt = Annotated[int, Gt(0)]

@dataclass
class Order:
    quantity: PositiveInt`,
  },
  {
    name: "typing.TypedDict",
    description:
      "Позволяет объявить словарь с фиксированными ключами и известными типами значений. В отличие от обычного dict[str, Any], TypedDict даёт статическую проверку: тайп-чекер знает какие ключи обязательны, и какого типа каждое значение. В рантайме экземпляр TypedDict — обычный dict.",
    syntax: `class MyDict(TypedDict):
    key: ValueType`,
    arguments: [],
    example: `from typing import TypedDict, Required, NotRequired

class Movie(TypedDict):
    title: str
    year: int
    rating: float

# Обязательные и необязательные поля (Python 3.11+)
class Config(TypedDict, total=False):   # все поля необязательны
    host: str
    port: int

class User(TypedDict):
    name: str                          # обязательное
    email: NotRequired[str]            # необязательное

# В рантайме — обычный словарь
movie: Movie = {'title': 'Dune', 'year': 2021, 'rating': 8.0}
print(type(movie))        # <class 'dict'>
print(movie['title'])     # 'Dune'

# Тайп-чекер поймает ошибки:
# bad: Movie = {'title': 'X'}         # нет year и rating
# bad['unknown'] = 1                  # неизвестный ключ`,
  },
  {
    name: "typing.overload",
    description:
      "Декоратор, позволяющий объявить несколько перегрузок функции с разными сигнатурами для тайп-чекера. Тайп-чекер использует перегрузки для вывода правильного типа возврата в зависимости от переданных аргументов. Реальная реализация (без декоратора) выполняется в рантайме и должна быть последней.",
    syntax: `@overload
def func(arg: TypeA) -> ReturnA: ...
@overload
def func(arg: TypeB) -> ReturnB: ...
def func(arg):           # реализация
    ...`,
    arguments: [],
    example: `from typing import overload

@overload
def process(value: int) -> int: ...
@overload
def process(value: str) -> str: ...
@overload
def process(value: list[int]) -> list[str]: ...

def process(value):
    if isinstance(value, int):
        return value * 2
    if isinstance(value, str):
        return value.upper()
    return [str(x) for x in value]

# Тайп-чекер знает точный тип возврата для каждого вызова
a: int       = process(5)          # -> int
b: str       = process("hello")    # -> str
c: list[str] = process([1, 2, 3])  # -> list[str]

print(a, b, c)   # 10  HELLO  ['1', '2', '3']`,
  },
  {
    name: "typing.final / typing.Final",
    description:
      "@final — декоратор, запрещающий переопределение метода или наследование от класса (тайп-чекер сообщит об ошибке). Final[T] — аннотация для констант: тайп-чекер запрещает повторное присвоение. Оба добавлены в Python 3.8.",
    syntax: `@final
class MyClass: ...

CONSTANT: Final[int] = 42`,
    arguments: [],
    example: `from typing import final, Final

# Final — константы, нельзя переприсвоить
MAX_SIZE: Final[int] = 100
API_URL:  Final = "https://api.example.com"

# MAX_SIZE = 200  # тайп-чекер: ошибка!

# @final на классе — нельзя наследовать
@final
class Singleton:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# class Child(Singleton): pass  # тайп-чекер: ошибка!

# @final на методе — нельзя переопределить в подклассе
class Base:
    @final
    def critical_method(self) -> None:
        print("нельзя переопределить")

class Child(Base):
    pass
    # def critical_method(self): ...  # тайп-чекер: ошибка!`,
  },
  {
    name: "typing.runtime_checkable",
    description:
      "Декоратор для Protocol-классов, включающий поддержку isinstance() и issubclass() в рантайме. Без него проверки isinstance с Protocol вызывают TypeError. Проверяет только наличие методов и атрибутов (структурно), но не их сигнатуры — это «shallow check».",
    syntax: `@runtime_checkable
class MyProtocol(Protocol):
    def method(self) -> None: ...`,
    arguments: [],
    example: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("○")

class Square:
    def draw(self) -> None:
        print("□")

class Point:
    pass   # нет метода draw

c, s, p = Circle(), Square(), Point()

print(isinstance(c, Drawable))   # True
print(isinstance(s, Drawable))   # True
print(isinstance(p, Drawable))   # False

# Фильтрация только рисуемых объектов
shapes = [c, s, p, Circle()]
drawables = [obj for obj in shapes if isinstance(obj, Drawable)]
for d in drawables:
    d.draw()   # ○  □  ○`,
  },
  {
    name: "typing.Literal",
    description:
      "Ограничивает тип до конкретных допустимых значений. Тайп-чекер выдаст ошибку, если переменной присвоено значение, не входящее в перечисленные литералы. Полезен для параметров-перечислений там, где Enum избыточен, и для более точного вывода типов в зависимости от переданного значения.",
    syntax: "Literal[value1, value2, ...]",
    arguments: [],
    example: `from typing import Literal, overload

# Допустимые значения явно перечислены
Direction = Literal['north', 'south', 'east', 'west']
Status    = Literal[200, 201, 400, 404, 500]

def move(direction: Direction) -> None:
    print(f"Движение: {direction}")

move('north')    # OK
# move('up')     # тайп-чекер: ошибка!

# Более точный вывод типа через перегрузки
@overload
def open_file(path: str, mode: Literal['r']) -> str: ...
@overload
def open_file(path: str, mode: Literal['rb']) -> bytes: ...

def open_file(path, mode):
    with open(path, mode) as f:
        return f.read()

content: str   = open_file('file.txt', 'r')
raw:     bytes = open_file('file.bin', 'rb')`,
  },
  {
    name: "typing.TypeAlias",
    description:
      "Явная аннотация для объявления псевдонима типа. Помогает тайп-чекерам отличать псевдонимы типов от обычных присваиваний переменных. Добавлен в Python 3.10. В Python 3.12 появился более мощный синтаксис type X = ... (оператор type statement), делающий TypeAlias устаревшим.",
    syntax: `MyAlias: TypeAlias = SomeType
# Python 3.12+:
type MyAlias = SomeType`,
    arguments: [],
    example: `from typing import TypeAlias

# Явное объявление псевдонима — тайп-чекер знает это тип, не переменная
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[list[float]]

def dot_product(a: Vector, b: Vector) -> float:
    return sum(x * y for x, y in zip(a, b))

def transpose(m: Matrix) -> Matrix:
    return [list(row) for row in zip(*m)]

v1: Vector = [1.0, 2.0, 3.0]
v2: Vector = [4.0, 5.0, 6.0]
print(dot_product(v1, v2))   # 32.0

# Вложенные псевдонимы
JsonValue: TypeAlias = str | int | float | bool | None
JsonObject: TypeAlias = dict[str, 'JsonValue']

# Python 3.12 новый синтаксис (эквивалент):
# type Vector = list[float]`,
  },

  // ─── pathlib ──────────────────────────────────────────────────────────────
  {
    name: "pathlib.Path.rglob(pattern)",
    description:
      'Рекурсивно обходит дерево каталогов начиная с текущего пути и возвращает генератор всех совпадающих объектов Path. Эквивалентен glob("**/<pattern>"). Удобен для поиска файлов по всему поддереву без ручного os.walk.',
    syntax: "Path.rglob(pattern)",
    arguments: [
      {
        name: "pattern",
        description:
          'Шаблон в стиле glob: "*.py", "*.txt", "test_*" и т.д. Символ ** автоматически добавляется в начало — ввводить его не нужно.',
      },
    ],
    example: `from pathlib import Path

project = Path('.')

# Все Python-файлы во всём дереве
for py_file in project.rglob('*.py'):
    print(py_file)

# Подсчёт строк во всех .ts-файлах
total = sum(
    len(f.read_text(encoding='utf-8').splitlines())
    for f in project.rglob('*.ts')
    if f.is_file()
)
print(f"Всего строк TypeScript: {total}")

# Только файлы (без директорий)
py_files = [f for f in project.rglob('*.py') if f.is_file()]
print(f"Найдено файлов: {len(py_files)}")`,
  },
  {
    name: "pathlib.Path.glob(pattern)",
    description:
      "Возвращает генератор объектов Path, совпадающих с шаблоном glob относительно текущего пути. Обходит только один уровень (или несколько при явном использовании **). Ленивый — элементы вычисляются по мере итерации.",
    syntax: "Path.glob(pattern)",
    arguments: [
      {
        name: "pattern",
        description:
          'Шаблон glob. Для рекурсии используйте **. Примеры: "*.py", "**/*.txt", "src/*/main.py".',
      },
    ],
    example: `from pathlib import Path

base = Path('.')

# Файлы только в текущей директории
for f in base.glob('*.py'):
    print(f.name)

# Один уровень вниз
for f in base.glob('src/*.ts'):
    print(f)

# Явная рекурсия через **
for f in base.glob('**/*.json'):
    print(f)

# Только директории в текущей папке
dirs = [p for p in base.glob('*') if p.is_dir()]
print([d.name for d in dirs])`,
  },
  {
    name: "pathlib.Path.resolve(strict=False)",
    description:
      "Возвращает абсолютный путь с разрешёнными символическими ссылками и нормализованными компонентами (.., .). При strict=True вызывает FileNotFoundError если путь не существует; при False (по умолчанию) нормализует путь даже для несуществующих объектов.",
    syntax: "Path.resolve(strict=False)",
    arguments: [
      {
        name: "strict",
        description:
          "Если True, каждый компонент пути должен существовать — иначе FileNotFoundError. По умолчанию False.",
      },
    ],
    example: `from pathlib import Path

# Относительный путь -> абсолютный
p = Path('src/../README.md')
print(p.resolve())       # /home/user/project/README.md  (нормализован)

# Символические ссылки разрешаются
link = Path('/tmp/mylink')   # предположим, ссылка на /var/data
print(link.resolve())        # /var/data

# strict=False — работает даже для несуществующих путей
ghost = Path('/nonexistent/../path/file.txt')
print(ghost.resolve())       # /path/file.txt  (нет ошибки)

# strict=True — требует реальное существование
try:
    Path('/nonexistent/file').resolve(strict=True)
except FileNotFoundError as e:
    print(e)`,
  },
  {
    name: "pathlib.Path.unlink(missing_ok=False)",
    description:
      "Удаляет файл или символическую ссылку. При missing_ok=False (по умолчанию) вызывает FileNotFoundError если файл не существует. При missing_ok=True молча игнорирует отсутствие файла. Для удаления директории используйте rmdir() или shutil.rmtree().",
    syntax: "Path.unlink(missing_ok=False)",
    arguments: [
      {
        name: "missing_ok",
        description:
          "Если True, не вызывает исключение когда файл не существует. По умолчанию False.",
      },
    ],
    example: `from pathlib import Path

tmp = Path('temp_file.txt')
tmp.write_text('временные данные')

# Удалить существующий файл
tmp.unlink()
print(tmp.exists())   # False

# Без missing_ok — ошибка если нет файла
try:
    tmp.unlink()
except FileNotFoundError as e:
    print(e)

# С missing_ok=True — безопасно
tmp.unlink(missing_ok=True)   # нет исключения

# Типичный паттерн: удалить если существует
lock_file = Path('process.lock')
lock_file.unlink(missing_ok=True)`,
  },
  {
    name: "pathlib.Path.rmdir()",
    description:
      "Удаляет директорию. Директория должна быть пустой — иначе вызывается OSError. Для рекурсивного удаления непустой директории используйте shutil.rmtree().",
    syntax: "Path.rmdir()",
    arguments: [],
    example: `from pathlib import Path
import shutil

# Удалить пустую директорию
empty_dir = Path('empty_folder')
empty_dir.mkdir(exist_ok=True)
empty_dir.rmdir()
print(empty_dir.exists())   # False

# Непустая директория — OSError
non_empty = Path('data')
non_empty.mkdir(exist_ok=True)
(non_empty / 'file.txt').write_text('данные')

try:
    non_empty.rmdir()
except OSError as e:
    print(e)   # [Errno 39] Directory not empty

# Рекурсивное удаление — через shutil
shutil.rmtree(non_empty)
print(non_empty.exists())   # False`,
  },
  {
    name: "pathlib.Path.rename(target)",
    description:
      "Переименовывает файл или директорию, возвращая новый объект Path. Если target находится на другой файловой системе — вызывается OSError (используйте shutil.move()). На Unix атомарно заменяет существующий файл-назначение; на Windows вызывает ошибку если target уже существует.",
    syntax: "Path.rename(target)",
    arguments: [
      {
        name: "target",
        description:
          "Новый путь — строка или объект Path. Может быть относительным (относительно cwd) или абсолютным.",
      },
    ],
    example: `from pathlib import Path

# Переименование файла
old = Path('draft.txt')
old.write_text('черновик')

new = old.rename('final.txt')
print(new)           # final.txt
print(new.exists())  # True
print(old.exists())  # False

# Перемещение в другую директорию
src = Path('report.pdf')
src.write_bytes(b'%PDF')

dest_dir = Path('archive')
dest_dir.mkdir(exist_ok=True)
moved = src.rename(dest_dir / src.name)
print(moved)   # archive/report.pdf

# Атомарная замена существующего файла (Unix)
Path('new_version.conf').write_text('[new]')
Path('new_version.conf').rename('config.conf')`,
  },
  {
    name: "pathlib.Path.touch(mode=0o666, exist_ok=True)",
    description:
      "Создаёт файл если он не существует, или обновляет время доступа и изменения до текущего момента если существует (аналог Unix touch). При exist_ok=False вызывает FileExistsError для уже существующих файлов.",
    syntax: "Path.touch(mode=0o666, exist_ok=True)",
    arguments: [
      {
        name: "mode",
        description:
          "Права доступа для нового файла в восьмеричной нотации. Итоговые права зависят от umask процесса. По умолчанию 0o666.",
      },
      {
        name: "exist_ok",
        description:
          "Если True (по умолчанию), обновляет временну́ю метку существующего файла без ошибки. Если False и файл существует — FileExistsError.",
      },
    ],
    example: `from pathlib import Path
import time

# Создать пустой файл
marker = Path('started.marker')
marker.touch()
print(marker.exists())        # True
print(marker.stat().st_size)  # 0

# Обновить время модификации
time.sleep(0.1)
before = marker.stat().st_mtime
marker.touch()
after  = marker.stat().st_mtime
print(after > before)         # True

# Создать с явными правами
script = Path('run.sh')
script.touch(mode=0o755)

# exist_ok=False — ошибка при существующем файле
try:
    marker.touch(exist_ok=False)
except FileExistsError as e:
    print(e)`,
  },
  {
    name: "pathlib.Path.with_name(name)",
    description:
      "Возвращает новый объект Path с изменённым именем файла (последним компонентом пути). Путь к родительской директории сохраняется. Вызывает ValueError если исходный путь не имеет имени файла (например, корень файловой системы).",
    syntax: "Path.with_name(name)",
    arguments: [
      {
        name: "name",
        description:
          "Новое имя файла — строка. Должна быть просто именем, не путём (без разделителей директорий).",
      },
    ],
    example: `from pathlib import Path

p = Path('/home/user/documents/report.pdf')

# Изменить только имя файла
print(p.with_name('summary.pdf'))
# /home/user/documents/summary.pdf

# Изменить расширение — через with_suffix удобнее, но with_name тоже работает
print(p.with_name('report.docx'))
# /home/user/documents/report.docx

# Типичный сценарий: создать сопутствующий файл рядом
config  = Path('/etc/app/settings.yaml')
backup  = config.with_name('settings.yaml.bak')
print(backup)   # /etc/app/settings.yaml.bak

# Добавить префикс к имени
log = Path('/var/log/app.log')
print(log.with_name('old_' + log.name))
# /var/log/old_app.log`,
  },
  {
    name: "pathlib.Path.with_suffix(suffix)",
    description:
      'Возвращает новый объект Path с изменённым расширением файла. Суффикс должен начинаться с точки (например ".txt"), или быть пустой строкой "" для удаления расширения. Если исходный файл не имеет расширения — суффикс добавляется.',
    syntax: "Path.with_suffix(suffix)",
    arguments: [
      {
        name: "suffix",
        description:
          'Новое расширение с ведущей точкой, например ".txt", ".gz". Пустая строка "" удаляет расширение.',
      },
    ],
    example: `from pathlib import Path

p = Path('data/report.csv')

# Сменить расширение
print(p.with_suffix('.xlsx'))   # data/report.xlsx
print(p.with_suffix('.json'))   # data/report.json

# Удалить расширение
print(p.with_suffix(''))        # data/report

# Файл без расширения — добавить
noext = Path('Makefile')
print(noext.with_suffix('.bak'))   # Makefile.bak

# Типичный сценарий: компиляция .py -> .pyc рядом
source = Path('module/utils.py')
compiled = source.with_suffix('.pyc')
print(compiled)   # module/utils.pyc

# Двойное расширение — with_suffix меняет только последнее
archive = Path('backup.tar.gz')
print(archive.suffix)               # .gz
print(archive.with_suffix('.bz2'))  # backup.tar.bz2`,
  },
  {
    name: "pathlib.Path.parts",
    description:
      'Атрибут, возвращающий неизменяемый кортеж строковых компонентов пути. На Unix первым элементом абсолютного пути будет "/"; на Windows — буква диска типа "C:\\\\". Для относительных путей разделитель корня отсутствует.',
    syntax: "Path.parts",
    arguments: [],
    example: `from pathlib import Path

# Абсолютный путь
p = Path('/home/user/projects/app/main.py')
print(p.parts)
# ('/', 'home', 'user', 'projects', 'app', 'main.py')

# Относительный путь
r = Path('src/utils/helpers.py')
print(r.parts)
# ('src', 'utils', 'helpers.py')

# Полезно для манипуляций с компонентами
p2 = Path('/var/log/nginx/access.log')
# Заменить первые два компонента
new = Path('/') / Path(*p2.parts[3:])
print(new)   # /nginx/access.log

# Найти относительный путь между двумя
base  = Path('/home/user')
child = Path('/home/user/projects/app')
# Вручную через parts
rel = Path(*child.parts[len(base.parts):])
print(rel)   # projects/app
# Или встроенным методом:
print(child.relative_to(base))   # projects/app`,
  },
  {
    name: "pathlib.Path.parent / pathlib.Path.parents",
    description:
      "parent — объект Path, представляющий логическую родительскую директорию (один уровень вверх). parents — неизменяемая последовательность всех предков пути от непосредственного родителя до корня; поддерживает индексацию и срезы.",
    syntax: `Path.parent       # непосредственный родитель
Path.parents[i]   # предок на i уровней вверх (0 = parent)`,
    arguments: [],
    example: `from pathlib import Path

p = Path('/home/user/projects/app/main.py')

# Один уровень вверх
print(p.parent)          # /home/user/projects/app

# Цепочка .parent
print(p.parent.parent)   # /home/user/projects

# parents — все предки сразу
for ancestor in p.parents:
    print(ancestor)
# /home/user/projects/app
# /home/user/projects
# /home/user
# /home
# /

# Индексация: parents[0] == parent
print(p.parents[0])   # /home/user/projects/app
print(p.parents[2])   # /home/user

# Найти корень проекта по наличию pyproject.toml
current = Path(__file__).resolve()
for directory in [current, *current.parents]:
    if (directory / 'pyproject.toml').exists():
        project_root = directory
        break`,
  },

  // ─── abc ──────────────────────────────────────────────────────────────────
  {
    name: "abc.abstractmethod",
    description:
      "Декоратор, помечающий метод как абстрактный. Класс, содержащий хотя бы один абстрактный метод, нельзя инстанцировать напрямую — попытка вызывает TypeError. Подкласс обязан переопределить все абстрактные методы, иначе сам остаётся абстрактным. Работает совместно с ABCMeta или при наследовании от ABC.",
    syntax: `@abc.abstractmethod
def method(self): ...`,
    arguments: [],
    example: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:          # обычный метод — не абстрактный
        return f"площадь={self.area():.2f}, периметр={self.perimeter():.2f}"

# TypeError — нельзя создать экземпляр абстрактного класса
try:
    Shape()
except TypeError as e:
    print(e)   # Can't instantiate abstract class Shape...

class Circle(Shape):
    def __init__(self, r: float): self.r = r
    def area(self)      -> float: return 3.14159 * self.r ** 2
    def perimeter(self) -> float: return 2 * 3.14159 * self.r

c = Circle(5)
print(c.describe())   # площадь=78.54, периметр=31.42`,
  },
  {
    name: "abc.ABCMeta",
    description:
      "Метакласс, реализующий механизм абстрактных базовых классов. Отслеживает абстрактные методы через __abstractmethods__ и запрещает создание экземпляров классов с непереопределёнными абстрактными членами. Удобнее использовать готовый базовый класс ABC (наследует от ABCMeta), чем указывать метакласс явно.",
    syntax: `class MyABC(metaclass=abc.ABCMeta): ...
# или проще:
class MyABC(abc.ABC): ...`,
    arguments: [],
    example: `from abc import ABCMeta, abstractmethod, ABC

# Явное указание метакласса
class Serializable(metaclass=ABCMeta):
    @abstractmethod
    def serialize(self) -> str: ...

    @abstractmethod
    def deserialize(self, data: str) -> None: ...

# Эквивалент через ABC — более читаемо
class Serializable(ABC):
    @abstractmethod
    def serialize(self) -> str: ...

# register() — зарегистрировать виртуальный подкласс
# (без наследования, только для isinstance/issubclass)
class LegacyFormat:
    def serialize(self) -> str:
        return '{"legacy": true}'
    def deserialize(self, data: str) -> None:
        pass

Serializable.register(LegacyFormat)
print(issubclass(LegacyFormat, Serializable))   # True
print(isinstance(LegacyFormat(), Serializable)) # True`,
  },

  // ─── enum ─────────────────────────────────────────────────────────────────
  {
    name: "enum.Enum",
    description:
      "Базовый класс для создания перечислений — наборов символических имён, привязанных к уникальным константным значениям. Члены перечисления являются синглтонами, поддерживают сравнение по идентичности (is) и итерацию. Перечисления делают код самодокументируемым и защищают от опечаток в строковых константах.",
    syntax: `class Color(enum.Enum):
    RED = 1
    GREEN = 2`,
    arguments: [],
    example: `from enum import Enum

class Direction(Enum):
    NORTH = 'N'
    SOUTH = 'S'
    EAST  = 'E'
    WEST  = 'W'

# Доступ к члену
d = Direction.NORTH
print(d)          # Direction.NORTH
print(d.name)     # 'NORTH'
print(d.value)    # 'N'

# Сравнение — по идентичности
print(d is Direction.NORTH)   # True
print(d == Direction.NORTH)   # True

# Получить по значению
print(Direction('S'))         # Direction.SOUTH

# Итерация
for direction in Direction:
    print(f"{direction.name}: {direction.value}")

# Использование в match (Python 3.10+)
match d:
    case Direction.NORTH: print("на север")
    case Direction.SOUTH: print("на юг")`,
  },
  {
    name: "enum.IntEnum",
    description:
      "Подкласс Enum, члены которого являются целыми числами (наследуют от int). Совместимы с обычными int в арифметике и сравнениях — в отличие от Enum, где сравнение с int всегда False. Используется для интеграции с API, ожидающими целочисленные константы (os, socket, ctypes и др.).",
    syntax: `class Status(enum.IntEnum):
    OK = 200
    NOT_FOUND = 404`,
    arguments: [],
    example: `from enum import IntEnum

class HttpStatus(IntEnum):
    OK          = 200
    CREATED     = 201
    NOT_FOUND   = 404
    SERVER_ERROR = 500

status = HttpStatus.OK

# IntEnum совместим с int
print(status == 200)          # True  (в Enum было бы False)
print(status + 1)             # 201
print(status < 300)           # True

# Сортировка работает как с числами
codes = [HttpStatus.SERVER_ERROR, HttpStatus.OK, HttpStatus.NOT_FOUND]
print(sorted(codes))
# [<HttpStatus.OK: 200>, <HttpStatus.NOT_FOUND: 404>, <HttpStatus.SERVER_ERROR: 500>]

# Удобно с HTTP-библиотеками
response_code = 404
if response_code == HttpStatus.NOT_FOUND:
    print("ресурс не найден")`,
  },
  {
    name: "enum.Flag",
    description:
      "Подкласс Enum для битовых флагов. Члены можно комбинировать через | (ИЛИ), проверять вхождение через & (И) и инвертировать через ~. Значения должны быть степенями двойки или нулём. Позволяет элегантно представлять наборы опций без ручной работы с битами.",
    syntax: `class Permission(enum.Flag):
    READ  = enum.auto()
    WRITE = enum.auto()`,
    arguments: [],
    example: `from enum import Flag, auto

class Permission(Flag):
    READ    = auto()   # 1
    WRITE   = auto()   # 2
    EXECUTE = auto()   # 4

# Комбинирование флагов через |
user_perms = Permission.READ | Permission.WRITE
print(user_perms)                          # Permission.READ|WRITE

# Проверка наличия флага через &
print(Permission.READ in user_perms)       # True
print(Permission.EXECUTE in user_perms)    # False

# Составной флаг
ALL = Permission.READ | Permission.WRITE | Permission.EXECUTE
print(ALL)   # Permission.READ|WRITE|EXECUTE

# Итерация по установленным флагам
for perm in user_perms:
    print(perm.name)   # READ, WRITE`,
  },
  {
    name: "enum.auto()",
    description:
      "Автоматически генерирует значение для члена перечисления. По умолчанию возвращает следующее целое число (1, 2, 3, …). Поведение можно переопределить через метод _generate_next_value_ в классе перечисления. Избавляет от ручного задания числовых значений и предотвращает случайные дубликаты.",
    syntax: "member = enum.auto()",
    arguments: [],
    example: `from enum import Enum, Flag, auto

# Автоматические числовые значения
class Color(Enum):
    RED   = auto()   # 1
    GREEN = auto()   # 2
    BLUE  = auto()   # 3

print(Color.RED.value)    # 1
print(Color.BLUE.value)   # 3

# Переопределение генератора — значения как строки
class StrEnum(str, Enum):
    @staticmethod
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()   # имя в нижнем регистре

class Status(StrEnum):
    PENDING  = auto()   # 'pending'
    ACTIVE   = auto()   # 'active'
    ARCHIVED = auto()   # 'archived'

print(Status.ACTIVE)         # Status.ACTIVE
print(Status.ACTIVE.value)   # 'active'
print(Status.ACTIVE == 'active')  # True (StrEnum наследует str)`,
  },
  {
    name: "enum.unique",
    description:
      "Декоратор класса перечисления, проверяющий что все значения уникальны. Вызывает ValueError при наличии дубликатов. Без него Enum позволяет создавать алиасы — несколько имён с одинаковым значением; @unique запрещает это поведение.",
    syntax: `@enum.unique
class MyEnum(Enum): ...`,
    arguments: [],
    example: `from enum import Enum, unique

# Без @unique — алиасы разрешены
class Color(Enum):
    RED    = 1
    ROUGE  = 1   # алиас для RED, не отдельный член!

print(list(Color))          # [<Color.RED: 1>]  (ROUGE не отдельный)
print(Color.ROUGE is Color.RED)  # True

# С @unique — дубликаты запрещены
try:
    @unique
    class StrictColor(Enum):
        RED   = 1
        GREEN = 2
        ROUGE = 1   # дубликат!
except ValueError as e:
    print(e)
    # duplicate values found in <enum 'StrictColor'>: ROUGE -> RED

# Корректное использование @unique
@unique
class Planet(Enum):
    MERCURY = 1
    VENUS   = 2
    EARTH   = 3`,
  },

  // ─── gc ───────────────────────────────────────────────────────────────────
  {
    name: "gc.collect(generation=2)",
    description:
      "Принудительно запускает цикл сборки мусора для указанного поколения (0, 1 или 2) и всех младших поколений. Возвращает количество освобождённых объектов. Обычно вызывается вручную после создания большого количества циклических ссылок или перед критичными к памяти операциями.",
    syntax: "gc.collect(generation=2)",
    arguments: [
      {
        name: "generation",
        description:
          "Поколение для сборки: 0 — молодые объекты (быстрая сборка), 1 — средние, 2 — старые (полная сборка, по умолчанию).",
      },
    ],
    example: `import gc

# Создадим циклические ссылки
class Node:
    def __init__(self): self.ref = None

a = Node()
b = Node()
a.ref = b
b.ref = a   # цикл: a -> b -> a

del a, b    # reference count != 0 из-за цикла

# Принудительная сборка
freed = gc.collect()
print(f"Освобождено объектов: {freed}")

# Быстрая сборка только молодого поколения
gc.collect(0)

# Статистика по поколениям
print(gc.get_count())    # (молодые, средние, старые) — счётчики
print(gc.get_threshold()) # пороги для автосборки`,
  },
  {
    name: "gc.get_objects()",
    description:
      "Возвращает список всех объектов, отслеживаемых сборщиком мусора (то есть потенциально участвующих в циклических ссылках). Не включает сам возвращённый список. Полезно для отладки утечек памяти — позволяет найти неожиданно живые объекты.",
    syntax: "gc.get_objects(generation=None)",
    arguments: [
      {
        name: "generation",
        description:
          "Если задано (0, 1 или 2), возвращает только объекты из указанного поколения. По умолчанию None — все поколения.",
      },
    ],
    example: `import gc

class MyClass:
    pass

obj1 = MyClass()
obj2 = MyClass()

# Найти все живые экземпляры MyClass
tracked = [o for o in gc.get_objects() if isinstance(o, MyClass)]
print(f"Живых экземпляров MyClass: {len(tracked)}")  # 2

# Подсчёт объектов по типам (топ утечек)
from collections import Counter
type_counts = Counter(type(o).__name__ for o in gc.get_objects())
for name, count in type_counts.most_common(5):
    print(f"{name}: {count}")

# Только молодые объекты (поколение 0)
young = gc.get_objects(generation=0)
print(f"Объектов в поколении 0: {len(young)}")`,
  },
  {
    name: "gc.get_referrers(*objs)",
    description:
      "Возвращает список объектов, которые прямо ссылаются на переданные объекты. Помогает ответить на вопрос «кто держит этот объект живым?». Результат включает фреймы, списки, словари и другие объекты, в которых найдена ссылка. Следует использовать осторожно — сам вызов создаёт временные ссылки.",
    syntax: "gc.get_referrers(*objs)",
    arguments: [
      {
        name: "*objs",
        description:
          "Один или несколько объектов, для которых нужно найти ссылающихся.",
      },
    ],
    example: `import gc

class Widget:
    pass

w = Widget()
container = [w, 'other']
mapping   = {'widget': w}

referrers = gc.get_referrers(w)
for ref in referrers:
    if isinstance(ref, list):
        print(f"list: {ref}")
    elif isinstance(ref, dict):
        # исключаем фреймы locals()
        if 'widget' in ref:
            print(f"dict с ключом 'widget'")
    elif isinstance(ref, type(gc.get_referrers)):
        print("frame")

# Типичное применение: найти утечку
suspect = Widget()
# ... код, который должен был удалить suspect ...
refs = gc.get_referrers(suspect)
print(f"Объект удерживают: {len(refs)} ссылок")`,
  },
  {
    name: "gc.get_referents(*objs)",
    description:
      "Возвращает список объектов, на которые напрямую ссылаются переданные объекты (противоположность get_referrers). Обходит только один уровень ссылок — не рекурсивный. Полезен для анализа «что содержит» конкретный объект с точки зрения сборщика мусора.",
    syntax: "gc.get_referents(*objs)",
    arguments: [
      {
        name: "*objs",
        description:
          "Один или несколько объектов, чьи исходящие ссылки нужно получить.",
      },
    ],
    example: `import gc

class Node:
    def __init__(self, value, children=None):
        self.value    = value
        self.children = children or []

root  = Node(1)
child = Node(2)
root.children.append(child)

# Прямые ссылки из root
refs = gc.get_referents(root)
print(refs)
# [{'value': 1, 'children': [<Node>]}, ...]  — __dict__ и его содержимое

# Ссылки из словаря экземпляра
print(gc.get_referents(root.__dict__))
# [1, [<Node child>]]

# Размер объектного графа (простая рекурсия)
def total_referents(obj, seen=None):
    if seen is None: seen = set()
    if id(obj) in seen: return 0
    seen.add(id(obj))
    return 1 + sum(total_referents(r, seen) for r in gc.get_referents(obj))

print(total_referents(root))`,
  },
  {
    name: "gc.disable() / gc.enable()",
    description:
      "gc.disable() отключает автоматическую циклическую сборку мусора — счётчик ссылок по-прежнему работает, но циклы не собираются автоматически. gc.enable() включает её обратно. Отключение используется в производительно-критичных участках, где создание циклических ссылок исключено или контролируется вручную.",
    syntax: `gc.disable()    # отключить автосборку
gc.enable()     # включить автосборку
gc.isenabled()  # проверить статус`,
    arguments: [],
    example: `import gc
import time

print(gc.isenabled())   # True — по умолчанию включено

# Отключение GC на время критичной секции
gc.disable()
try:
    # Массовое создание объектов без накладных расходов GC
    data = [{'id': i, 'value': i * 2} for i in range(100_000)]
    result = sum(d['value'] for d in data)
    print(result)
finally:
    gc.enable()           # обязательно восстановить

# Типичный паттерн веб-серверов (gunicorn, uwsgi):
# отключить GC на время обработки запроса, собрать вручную между запросами
gc.disable()
# ... обработка запроса ...
gc.collect()   # явная сборка после завершения

print(gc.isenabled())   # False до следующего enable()`,
  },

  // ─── weakref ──────────────────────────────────────────────────────────────
  {
    name: "weakref.ref(object[, callback])",
    description:
      "Создаёт слабую ссылку на объект. В отличие от обычной ссылки, слабая не препятствует сборке мусора. Чтобы получить объект, слабую ссылку нужно вызвать как функцию — если объект уже уничтожен, вернётся None. Незаменима для кэшей и реестров, которые не должны «удерживать» объекты в памяти.",
    syntax: "weakref.ref(object[, callback])",
    arguments: [
      {
        name: "object",
        description:
          "Объект, на который создаётся слабая ссылка. Должен поддерживать слабые ссылки (большинство классов поддерживают; исключения — int, str, tuple без __weakref__).",
      },
      {
        name: "callback",
        description:
          "Необязательная функция, вызываемая при уничтожении объекта. Получает саму слабую ссылку (уже «мёртвую») в качестве аргумента.",
      },
    ],
    example: `import weakref

class Cache:
    def __init__(self, name):
        self.name = name

obj = Cache('данные')

# Создаём слабую ссылку с колбэком
def on_finalize(ref):
    print(f"объект уничтожен, ref={ref}")

weak = weakref.ref(obj, on_finalize)

print(weak())        # <Cache object>  — объект жив
print(weak().name)   # 'данные'

del obj              # удаляем единственную сильную ссылку
# on_finalize вызван: "объект уничтожен"

print(weak())        # None — объект собран GC

# WeakValueDictionary — кэш без удержания объектов
cache: weakref.WeakValueDictionary = weakref.WeakValueDictionary()
tmp = Cache('temp')
cache['key'] = tmp
print(cache.get('key'))   # <Cache object>
del tmp
print(cache.get('key'))   # None`,
  },
  {
    name: "weakref.proxy(object[, callback])",
    description:
      "Создаёт прозрачный прокси-объект со слабой ссылкой. В отличие от weakref.ref, прокси можно использовать напрямую как оригинальный объект — не нужно вызывать его как функцию. При обращении к уничтоженному объекту вызывает ReferenceError.",
    syntax: "weakref.proxy(object[, callback])",
    arguments: [
      {
        name: "object",
        description:
          "Объект, для которого создаётся прозрачный прокси на основе слабой ссылки.",
      },
      {
        name: "callback",
        description:
          "Необязательная функция, вызываемая при уничтожении исходного объекта.",
      },
    ],
    example: `import weakref

class Config:
    def __init__(self):
        self.debug = True
        self.host  = 'localhost'

    def describe(self):
        return f"host={self.host}, debug={self.debug}"

cfg = Config()
proxy = weakref.proxy(cfg)

# Используем прокси как обычный объект — без вызова ()
print(proxy.host)        # 'localhost'
print(proxy.describe())  # 'host=localhost, debug=True'

proxy.debug = False      # можно изменять атрибуты
print(cfg.debug)         # False — изменение отразилось на оригинале

del cfg                  # уничтожаем оригинал

try:
    print(proxy.host)    # ReferenceError
except ReferenceError as e:
    print(f"ReferenceError: {e}")`,
  },
  {
    name: "weakref.finalize(obj, func, *args, **kwargs)",
    description:
      "Регистрирует финализатор — функцию, которая будет вызвана когда объект obj будет уничтожен сборщиком мусора. Более надёжная альтернатива __del__: гарантированно вызывается при завершении программы, поддерживает явный вызов и отмену. Возвращает объект-финализатор с методами __call__, detach и peek.",
    syntax: "weakref.finalize(obj, func, *args, **kwargs)",
    arguments: [
      {
        name: "obj",
        description:
          "Объект, при уничтожении которого будет вызван финализатор.",
      },
      {
        name: "func",
        description:
          "Функция-финализатор. Вызывается с аргументами *args и **kwargs.",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы, передаваемые в func при вызове финализатора.",
      },
    ],
    example: `import weakref
import tempfile, os

class TempFile:
    def __init__(self):
        fd, self.path = tempfile.mkstemp()
        os.close(fd)
        # Зарегистрировать очистку при уничтожении объекта
        self._finalizer = weakref.finalize(
            self, os.remove, self.path
        )
        print(f"создан: {self.path}")

    def cleanup(self):
        self._finalizer()   # явный вызов финализатора

t = TempFile()
print(os.path.exists(t.path))   # True

del t                            # финализатор вызван автоматически
# файл удалён

# Проверка и явный вызов
class Resource:
    pass

res = Resource()
fin = weakref.finalize(res, print, "ресурс освобождён")
print(fin.alive)    # True
fin()               # явный вызов: "ресурс освобождён"
print(fin.alive)    # False`,
  },

  // ─── sys ──────────────────────────────────────────────────────────────────
  {
    name: "sys.setrecursionlimit(limit)",
    description:
      "Устанавливает максимальную глубину стека вызовов Python. По умолчанию 1000. При превышении вызывается RecursionError. Увеличение предела позволяет обрабатывать глубокие рекурсии, но увеличивает риск переполнения системного стека. Текущее значение читается через sys.getrecursionlimit().",
    syntax: "sys.setrecursionlimit(limit)",
    arguments: [
      {
        name: "limit",
        description:
          "Целое число — новый максимум глубины стека вызовов. Рекомендуется не превышать несколько тысяч без крайней необходимости.",
      },
    ],
    example: `import sys

print(sys.getrecursionlimit())   # 1000 (по умолчанию)

# Рекурсивная функция с глубоким стеком
def depth(n):
    if n == 0:
        return 0
    return 1 + depth(n - 1)

try:
    depth(999)     # OK при лимите 1000
    depth(1001)    # RecursionError
except RecursionError:
    print("превышен лимит рекурсии")

# Увеличить лимит для глубоко вложенных структур
sys.setrecursionlimit(5000)
print(depth(4000))   # 4000

# Альтернатива: преобразовать рекурсию в итерацию
def depth_iter(n):
    count = 0
    while n > 0:
        count += 1
        n -= 1
    return count`,
  },
  {
    name: "sys.modules",
    description:
      "Словарь, отображающий имена модулей на уже загруженные объекты модулей. Служит кэшем импортов: при повторном import Python сначала проверяет sys.modules, и если модуль там есть — не загружает его снова. Можно добавлять, удалять и подменять модули для тестирования, моков и нестандартных систем импорта.",
    syntax: "sys.modules",
    arguments: [],
    example: `import sys
import json

# Проверить, загружен ли модуль
print('json' in sys.modules)     # True
print('xml' in sys.modules)      # False (ещё не импортирован)

# Получить уже загруженный объект модуля
json_mod = sys.modules['json']
print(json_mod.dumps({'a': 1}))  # '{"a": 1}'

# Удалить из кэша — следующий import перезагрузит модуль
del sys.modules['json']
import json   # загружается заново

# Подмена модуля (mock) в тестах
import types
fake_os = types.ModuleType('os')
fake_os.getcwd = lambda: '/fake/path'
sys.modules['os'] = fake_os

import os
print(os.getcwd())   # '/fake/path'

# Восстановить
del sys.modules['os']
import os
print(os.getcwd())   # настоящий путь`,
  },

  // ─── math ─────────────────────────────────────────────────────────────────
  {
    name: "math.isclose(a, b, *, rel_tol=1e-09, abs_tol=0.0)",
    description:
      "Возвращает True если два числа с плавающей точкой близки друг к другу с учётом относительной и абсолютной погрешности. Решает проблему прямого сравнения float через ==, которое ненадёжно из-за ошибок округления. Относительная погрешность масштабируется с величиной чисел; абсолютная задаёт минимальный порог.",
    syntax: "math.isclose(a, b, *, rel_tol=1e-09, abs_tol=0.0)",
    arguments: [
      {
        name: "a, b",
        description: "Два числа для сравнения.",
      },
      {
        name: "rel_tol",
        description:
          "Относительная погрешность — максимально допустимая разница как доля от большего из |a| и |b|. По умолчанию 1e-09.",
      },
      {
        name: "abs_tol",
        description:
          "Абсолютная погрешность — минимальный порог близости. Необходима при сравнении значений, близких к нулю (иначе rel_tol бесполезен). По умолчанию 0.0.",
      },
    ],
    example: `import math

# Прямое сравнение float ненадёжно
print(0.1 + 0.2 == 0.3)              # False!
print(math.isclose(0.1 + 0.2, 0.3))  # True

# Относительная погрешность 1%
print(math.isclose(100.0, 100.9, rel_tol=0.01))   # True
print(math.isclose(100.0, 102.0, rel_tol=0.01))   # False

# Сравнение около нуля — нужен abs_tol
print(math.isclose(0.0, 1e-10))                   # False (rel_tol не помогает у нуля)
print(math.isclose(0.0, 1e-10, abs_tol=1e-9))     # True

# В тестах
def test_area(r):
    import math
    return math.pi * r ** 2

assert math.isclose(test_area(1), 3.14159, rel_tol=1e-5)`,
  },
  {
    name: "math.prod(iterable, *, start=1)",
    description:
      "Вычисляет произведение всех элементов итерируемого объекта. Аналог sum() для умножения. Параметр start задаёт начальное значение (полезен для умножения на коэффициент или для корректного результата для пустого итерируемого). Добавлен в Python 3.8.",
    syntax: "math.prod(iterable, *, start=1)",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект числовых значений.",
      },
      {
        name: "start",
        description:
          "Начальное значение — к нему последовательно умножаются все элементы. По умолчанию 1. При пустом iterable возвращается start.",
      },
    ],
    example: `import math

# Произведение последовательности
print(math.prod([1, 2, 3, 4, 5]))    # 120  (5!)
print(math.prod(range(1, 6)))        # 120

# Начальное значение
print(math.prod([2, 3, 4], start=10))  # 10 * 2 * 3 * 4 = 240

# Пустой итерируемый — возвращает start
print(math.prod([]))                 # 1
print(math.prod([], start=5))        # 5

# Биномиальный коэффициент C(n, k) = n! / (k! * (n-k)!)
def comb_manual(n, k):
    return math.prod(range(n - k + 1, n + 1)) // math.prod(range(1, k + 1))

print(comb_manual(10, 3))   # 120
print(math.comb(10, 3))     # 120  (встроенный аналог)`,
  },

  // ─── operator ─────────────────────────────────────────────────────────────
  {
    name: "operator.itemgetter(*items)",
    description:
      "Возвращает вызываемый объект, извлекающий элементы по ключу или индексу. При нескольких аргументах возвращает кортеж значений. Работает быстрее lambda при сортировке и является совместимым с pickle (в отличие от lambda). Идеален как key= для sort/sorted, min, max, groupby.",
    syntax: "operator.itemgetter(*items)",
    arguments: [
      {
        name: "*items",
        description:
          "Один или несколько ключей/индексов для извлечения. При одном аргументе возвращает само значение; при нескольких — кортеж.",
      },
    ],
    example: `import operator

# Сортировка по ключу словаря
students = [
    {'name': 'Alice', 'grade': 92, 'age': 20},
    {'name': 'Bob',   'grade': 85, 'age': 22},
    {'name': 'Carol', 'grade': 92, 'age': 19},
]
by_grade = sorted(students, key=operator.itemgetter('grade'), reverse=True)
print([s['name'] for s in by_grade])   # ['Alice', 'Carol', 'Bob']

# Составной ключ — несколько полей
by_grade_age = sorted(students, key=operator.itemgetter('grade', 'age'))
print([(s['name'], s['grade']) for s in by_grade_age])

# Индексы кортежей
data = [(1, 'b'), (3, 'a'), (2, 'c')]
print(sorted(data, key=operator.itemgetter(1)))
# [(3,'a'), (1,'b'), (2,'c')]

# Срезы в списке
rows = [[10, 20, 30], [40, 50, 60]]
get_middle = operator.itemgetter(1)
print(list(map(get_middle, rows)))   # [20, 50]`,
  },
  {
    name: "operator.attrgetter(*attrs)",
    description:
      'Возвращает вызываемый объект, извлекающий атрибуты объекта по имени. Поддерживает цепочки через точку ("obj.attr.subattr"). При нескольких аргументах возвращает кортеж. Используется как key= для сортировки объектов по атрибутам.',
    syntax: "operator.attrgetter(*attrs)",
    arguments: [
      {
        name: "*attrs",
        description:
          'Одно или несколько имён атрибутов. Поддерживает вложенность через точку: "address.city". При нескольких аргументах возвращает кортеж значений.',
      },
    ],
    example: `import operator
from dataclasses import dataclass

@dataclass
class Student:
    name: str
    grade: float
    age: int

students = [
    Student('Alice', 92.5, 20),
    Student('Bob',   85.0, 22),
    Student('Carol', 92.5, 19),
]

# Сортировка по атрибуту
by_grade = sorted(students, key=operator.attrgetter('grade'), reverse=True)
print([s.name for s in by_grade])   # ['Alice', 'Carol', 'Bob']

# Составной ключ: сначала grade (убыв.), потом age (возр.)
by_grade_age = sorted(students, key=operator.attrgetter('grade', 'age'))
print([(s.name, s.grade, s.age) for s in by_grade_age])

# Вложенные атрибуты через точку
@dataclass
class Address:
    city: str

@dataclass
class Person:
    name: str
    address: Address

people = [Person('Bob', Address('SPb')), Person('Alice', Address('Moscow'))]
by_city = sorted(people, key=operator.attrgetter('address.city'))
print([p.name for p in by_city])   # ['Alice', 'Bob']`,
  },
  {
    name: "operator.methodcaller(name, /, *args, **kwargs)",
    description:
      "Возвращает вызываемый объект, который вызывает у переданного объекта метод с именем name и заданными аргументами. Полезен для передачи вызова метода в map(), filter() или sorted() без lambda. Корректно работает с pickle.",
    syntax: "operator.methodcaller(name, /, *args, **kwargs)",
    arguments: [
      {
        name: "name",
        description: "Имя метода для вызова (строка).",
      },
      {
        name: "*args, **kwargs",
        description: "Аргументы, передаваемые в метод при каждом вызове.",
      },
    ],
    example: `import operator

# Вызов метода upper() для каждой строки
words = ['hello', 'world', 'python']
upper = list(map(operator.methodcaller('upper'), words))
print(upper)   # ['HELLO', 'WORLD', 'PYTHON']

# replace() с аргументами
clean = operator.methodcaller('replace', ' ', '_')
names = ['Alice Smith', 'Bob Jones', 'Carol White']
print(list(map(clean, names)))
# ['Alice_Smith', 'Bob_Jones', 'Carol_White']

# Сортировка строк по результату метода
sentences = ['The quick fox', 'a lazy dog', 'Brown bear']
# Сортировать по строке в нижнем регистре
by_lower = sorted(sentences, key=operator.methodcaller('lower'))
print(by_lower)   # ['a lazy dog', 'Brown bear', 'The quick fox']

# Эквивалент lambda — но methodcaller быстрее и pickle-совместим
# key=lambda s: s.lower()  ≡  key=operator.methodcaller('lower')`,
  },

  // ─── Методы класса (dunder) ───────────────────────────────────────────────
  {
    name: "__new__(cls, *args, **kwargs)",
    description:
      "Статический метод, вызываемый первым при создании объекта — до __init__. Отвечает за выделение памяти и возврат нового экземпляра. Переопределяется при реализации синглтонов, иммутабельных типов (подклассов int, str, tuple), а также при работе с метаклассами. Если __new__ возвращает экземпляр cls — вызывается __init__; иначе __init__ не вызывается.",
    syntax: "def __new__(cls, *args, **kwargs) -> object",
    arguments: [
      {
        name: "cls",
        description:
          "Класс, экземпляр которого создаётся. Передаётся автоматически — аналог self для обычных методов.",
      },
      {
        name: "*args, **kwargs",
        description:
          "Те же аргументы, что передаются в вызов класса и затем попадают в __init__.",
      },
    ],
    example: `class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value):
        self.value = value

a = Singleton(1)
b = Singleton(2)
print(a is b)       # True — один и тот же объект
print(a.value)      # 2 (последний __init__ перезаписал)

# Иммутабельный подкласс int — __new__ обязателен
class PositiveInt(int):
    def __new__(cls, value):
        if value <= 0:
            raise ValueError(f"Ожидается > 0, получено {value}")
        return super().__new__(cls, value)

n = PositiveInt(5)
print(n + 10)   # 15  (ведёт себя как int)
PositiveInt(-1) # ValueError`,
  },
  {
    name: "__init__(self, *args, **kwargs)",
    description:
      "Инициализатор экземпляра — вызывается сразу после __new__, когда объект уже создан. Задаёт начальное состояние через присваивание атрибутов. Не должен ничего возвращать (только None). Является самым часто переопределяемым специальным методом.",
    syntax: "def __init__(self, *args, **kwargs) -> None",
    arguments: [
      {
        name: "self",
        description:
          "Только что созданный экземпляр класса, переданный автоматически.",
      },
      {
        name: "*args, **kwargs",
        description:
          "Произвольные позиционные и именованные аргументы из вызова класса.",
      },
    ],
    example: `class Vector:
    def __init__(self, x: float, y: float, z: float = 0.0):
        self.x = x
        self.y = y
        self.z = z
        self._magnitude = None   # ленивое вычисление

    @property
    def magnitude(self) -> float:
        if self._magnitude is None:
            self._magnitude = (self.x**2 + self.y**2 + self.z**2) ** 0.5
        return self._magnitude

v = Vector(1, 2, 2)
print(v.magnitude)   # 3.0

# super().__init__() — важно при наследовании
class NamedVector(Vector):
    def __init__(self, name: str, x: float, y: float):
        super().__init__(x, y)   # инициализируем родителя
        self.name = name

nv = NamedVector('velocity', 3, 4)
print(nv.magnitude, nv.name)   # 5.0  velocity`,
  },
  {
    name: "__del__(self)",
    description:
      "Финализатор — вызывается интерпретатором непосредственно перед уничтожением объекта сборщиком мусора. Не является деструктором в смысле C++: время вызова не гарантировано, при циклических ссылках может не вызваться вовсе. Для детерминированного освобождения ресурсов используйте контекстные менеджеры (with / __exit__) или weakref.finalize.",
    syntax: "def __del__(self) -> None",
    arguments: [
      {
        name: "self",
        description: "Экземпляр, готовящийся к уничтожению.",
      },
    ],
    example: `import weakref

class Connection:
    def __init__(self, host: str):
        self.host = host
        self._open = True
        print(f"соединение с {host} открыто")

    def __del__(self):
        if self._open:
            print(f"соединение с {self.host} закрыто (через __del__)")
            self._open = False

conn = Connection('db.local')
del conn   # __del__ вызывается, объект уничтожается

# Надёжнее — контекстный менеджер
class SafeConnection:
    def __init__(self, host): self.host = host
    def __enter__(self): return self
    def __exit__(self, *_):
        print(f"закрыто: {self.host}")

with SafeConnection('db.local') as c:
    pass   # гарантированно закрывается`,
  },
  {
    name: "__repr__(self)",
    description:
      "Возвращает «официальное» строковое представление объекта — однозначное, желательно пригодное для воспроизведения объекта через eval(). Вызывается функцией repr(), в интерактивном REPL и при отладке. Если __str__ не определён, Python использует __repr__ вместо него. Правило: repr должен показывать всё необходимое для понимания объекта.",
    syntax: "def __repr__(self) -> str",
    arguments: [
      {
        name: "self",
        description: "Экземпляр класса.",
      },
    ],
    example: `class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Point({self.x!r}, {self.y!r})"

p = Point(1.5, 2.0)
print(repr(p))   # Point(1.5, 2.0)
print(p)         # Point(1.5, 2.0)  — str() тоже использует __repr__

# eval(repr(p)) воссоздаёт объект
p2 = eval(repr(p))
print(p2.x, p2.y)   # 1.5  2.0

# В контейнерах всегда repr, а не str
points = [Point(0, 0), Point(1, 1)]
print(points)
# [Point(0, 0), Point(1, 1)]`,
  },
  {
    name: "__str__(self)",
    description:
      "Возвращает «неформальное», человекочитаемое строковое представление объекта. Вызывается функциями str(), print() и при форматировании через f-строки и format(). Если не определён — Python откатывается к __repr__. Правило: str должен быть понятен пользователю, repr — разработчику.",
    syntax: "def __str__(self) -> str",
    arguments: [
      {
        name: "self",
        description: "Экземпляр класса.",
      },
    ],
    example: `class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    def __repr__(self) -> str:
        return f"Temperature({self.celsius!r})"  # для разработчика

    def __str__(self) -> str:
        return f"{self.celsius}°C ({self.celsius * 9/5 + 32:.1f}°F)"  # для пользователя

t = Temperature(100)

print(t)          # 100°C (212.0°F)   ← __str__
print(repr(t))    # Temperature(100)  ← __repr__
print(f"{t}")     # 100°C (212.0°F)   ← __str__ в f-строке

# Список — repr элементов, не str
print([t])        # [Temperature(100)]  ← __repr__`,
  },
  {
    name: "__format__(self, format_spec)",
    description:
      'Вызывается при использовании объекта в f-строках с форматной строкой (f"{obj:spec}") и функцией format(obj, spec). Позволяет объекту поддерживать собственный мини-язык форматирования. Если не определён, вызывается str(self) и к результату применяется стандартный форматировщик.',
    syntax: "def __format__(self, format_spec: str) -> str",
    arguments: [
      {
        name: "format_spec",
        description:
          'Строка спецификации формата — всё, что идёт после ":" в f-строке или во втором аргументе format(). Пустая строка при обычном f"{obj}".',
      },
    ],
    example: `class Money:
    def __init__(self, amount: float, currency: str = 'RUB'):
        self.amount   = amount
        self.currency = currency

    def __format__(self, spec: str) -> str:
        if spec == 'short':
            return f"{self.amount:.0f} {self.currency}"
        if spec == 'long':
            symbols = {'RUB': '₽', 'USD': '$', 'EUR': '€'}
            sym = symbols.get(self.currency, self.currency)
            return f"{sym}{self.amount:,.2f}"
        # по умолчанию — стандартное форматирование числа
        return format(self.amount, spec)

price = Money(1234.5, 'RUB')

print(f"{price:short}")    # 1235 RUB
print(f"{price:long}")     # ₽1,234.50
print(f"{price:.2f}")      # 1234.50
print(f"{price:>12.1f}")   # '      1234.5'`,
  },
  {
    name: "__bytes__(self)",
    description:
      "Вызывается функцией bytes(obj) — должен вернуть байтовое представление объекта. Является байтовым аналогом __str__. Используется для сериализации объектов в двоичный формат: сетевые протоколы, бинарные файлы, хэширование бинарных данных.",
    syntax: "def __bytes__(self) -> bytes",
    arguments: [
      {
        name: "self",
        description: "Экземпляр класса.",
      },
    ],
    example: `import struct

class Packet:
    """Бинарный сетевой пакет: тип (1 байт) + длина (2 байта) + payload."""
    def __init__(self, ptype: int, payload: bytes):
        self.ptype   = ptype
        self.payload = payload

    def __bytes__(self) -> bytes:
        header = struct.pack('>BH', self.ptype, len(self.payload))
        return header + self.payload

    def __repr__(self) -> str:
        return f"Packet(type={self.ptype}, len={len(self.payload)})"

pkt = Packet(0x01, b'Hello')
raw = bytes(pkt)
print(raw.hex(' '))   # 01 00 05 48 65 6c 6c 6f

# Разбор обратно
ptype, length = struct.unpack('>BH', raw[:3])
payload = raw[3:3 + length]
print(ptype, payload)   # 1  b'Hello'`,
  },

  // ─── Операторы сравнения ──────────────────────────────────────────────────
  {
    name: "__lt__(self, other)",
    description:
      "Реализует оператор «меньше» (<). Вызывается при a < b. Должен вернуть True/False или NotImplemented если тип other не поддерживается — тогда Python попробует отражённый метод у other. При использовании @functools.total_ordering достаточно определить __lt__ и __eq__, остальные методы сравнения генерируются автоматически.",
    syntax: "def __lt__(self, other) -> bool | NotImplemented",
    arguments: [
      { name: "self", description: "Левый операнд сравнения." },
      {
        name: "other",
        description:
          "Правый операнд. Если тип не поддерживается — верните NotImplemented.",
      },
    ],
    example: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, major: int, minor: int, patch: int = 0):
        self.t = (major, minor, patch)

    def __eq__(self, other) -> bool:
        if not isinstance(other, Version): return NotImplemented
        return self.t == other.t

    def __lt__(self, other) -> bool:
        if not isinstance(other, Version): return NotImplemented
        return self.t < other.t

    def __repr__(self): return f"Version{self.t}"

v1, v2, v3 = Version(1, 9), Version(2, 0), Version(1, 9)

print(v1 < v2)    # True
print(v2 > v1)    # True  (сгенерирован @total_ordering)
print(v1 <= v3)   # True  (сгенерирован @total_ordering)

versions = [Version(2,0), Version(1,9,1), Version(1,10)]
print(sorted(versions))   # [Version(1,9,1), Version(1,10,0), Version(2,0,0)]`,
  },
  {
    name: "__le__(self, other)",
    description:
      "Реализует оператор «меньше или равно» (<=). Вызывается при a <= b. Как и все методы сравнения, должен вернуть True/False или NotImplemented. При использовании @functools.total_ordering генерируется автоматически на основе __lt__ и __eq__.",
    syntax: "def __le__(self, other) -> bool | NotImplemented",
    arguments: [
      { name: "self", description: "Левый операнд." },
      { name: "other", description: "Правый операнд." },
    ],
    example: `class Weight:
    def __init__(self, kg: float): self.kg = kg

    def __eq__(self, other):
        if not isinstance(other, Weight): return NotImplemented
        return self.kg == other.kg

    def __le__(self, other):
        if not isinstance(other, Weight): return NotImplemented
        return self.kg <= other.kg

    def __repr__(self): return f"Weight({self.kg}kg)"

a = Weight(70)
b = Weight(80)
c = Weight(70)

print(a <= b)   # True
print(b <= a)   # False
print(a <= c)   # True  (равны)

# Применение в алгоритме ограничений
MAX = Weight(100)
items = [Weight(60), Weight(110), Weight(90)]
allowed = [w for w in items if w <= MAX]
print(allowed)   # [Weight(60kg), Weight(90kg)]`,
  },
  {
    name: "__eq__(self, other)",
    description:
      "Реализует оператор равенства (==). По умолчанию сравнивает по идентичности (is). Переопределяется для сравнения по значению. Важно: при определении __eq__ Python автоматически делает объект нехэшируемым (hash = None) — если объект должен использоваться в set/dict, нужно явно определить __hash__.",
    syntax: "def __eq__(self, other) -> bool | NotImplemented",
    arguments: [
      { name: "self", description: "Левый операнд." },
      {
        name: "other",
        description:
          "Правый операнд. Возвращайте NotImplemented для несовместимых типов.",
      },
    ],
    example: `class Point:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y

    def __eq__(self, other) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self):          # нужен при переопределении __eq__
        return hash((self.x, self.y))

p1 = Point(1, 2)
p2 = Point(1, 2)
p3 = Point(3, 4)

print(p1 == p2)            # True  (по значению)
print(p1 is p2)            # False (разные объекты)
print(p1 == p3)            # False
print(p1 == (1, 2))        # False (NotImplemented -> Python пробует (1,2).__eq__(p1))

# Теперь Point хэшируем — можно в set/dict
seen = {p1, p2, p3}
print(len(seen))            # 2  (p1 и p2 одинаковы)`,
  },
  {
    name: "__ne__(self, other)",
    description:
      "Реализует оператор неравенства (!=). По умолчанию возвращает not self.__eq__(other) — обычно переопределять не нужно. Явное определение требуется только если поведение != должно отличаться от отрицания ==, что встречается крайне редко.",
    syntax: "def __ne__(self, other) -> bool | NotImplemented",
    arguments: [
      { name: "self", description: "Левый операнд." },
      { name: "other", description: "Правый операнд." },
    ],
    example: `class Interval:
    def __init__(self, lo: float, hi: float):
        self.lo, self.hi = lo, hi

    def __eq__(self, other):
        if not isinstance(other, Interval): return NotImplemented
        return self.lo == other.lo and self.hi == other.hi

    # __ne__ не нужен — Python автоматически делает not __eq__
    # Но можно переопределить для особой семантики:
    def __ne__(self, other):
        result = self.__eq__(other)
        if result is NotImplemented: return result
        return not result

a = Interval(0, 10)
b = Interval(0, 10)
c = Interval(5, 15)

print(a != b)   # False
print(a != c)   # True
print(a != 42)  # True  (NotImplemented -> Python возвращает True)`,
  },
  {
    name: "__gt__(self, other)",
    description:
      "Реализует оператор «больше» (>). Python вызывает a.__gt__(b); если возвращается NotImplemented — пробует b.__lt__(a) (отражение). При использовании @functools.total_ordering генерируется автоматически.",
    syntax: "def __gt__(self, other) -> bool | NotImplemented",
    arguments: [
      { name: "self", description: "Левый операнд." },
      { name: "other", description: "Правый операнд." },
    ],
    example: `class Temperature:
    def __init__(self, celsius: float): self.c = celsius

    def __eq__(self, other):
        if not isinstance(other, Temperature): return NotImplemented
        return self.c == other.c

    def __gt__(self, other):
        if not isinstance(other, Temperature): return NotImplemented
        return self.c > other.c

    def __lt__(self, other):
        if not isinstance(other, Temperature): return NotImplemented
        return self.c < other.c

    def __repr__(self): return f"{self.c}°C"

boiling  = Temperature(100)
freezing = Temperature(0)
body     = Temperature(36.6)

print(boiling > body)    # True
print(freezing > body)   # False

readings = [boiling, freezing, body, Temperature(22)]
print(max(readings))     # 100°C
print(min(readings))     # 0°C`,
  },
  {
    name: "__ge__(self, other)",
    description:
      "Реализует оператор «больше или равно» (>=). Вызывается при a >= b. Если возвращает NotImplemented — Python попробует b.__le__(a). При использовании @functools.total_ordering генерируется автоматически на основе __lt__ и __eq__.",
    syntax: "def __ge__(self, other) -> bool | NotImplemented",
    arguments: [
      { name: "self", description: "Левый операнд." },
      { name: "other", description: "Правый операнд." },
    ],
    example: `from functools import total_ordering
from dataclasses import dataclass

@total_ordering
@dataclass
class SemVer:
    major: int
    minor: int = 0
    patch: int = 0

    def _key(self): return (self.major, self.minor, self.patch)

    def __eq__(self, other):
        if not isinstance(other, SemVer): return NotImplemented
        return self._key() == other._key()

    def __lt__(self, other):
        if not isinstance(other, SemVer): return NotImplemented
        return self._key() < other._key()

    # __ge__ сгенерирован @total_ordering

current  = SemVer(2, 1, 0)
required = SemVer(2, 0, 0)
latest   = SemVer(3, 0, 0)

print(current >= required)   # True  — совместимо
print(current >= latest)     # False — устарело

# Проверка минимальной версии зависимости
def check_version(installed: SemVer, minimum: SemVer) -> bool:
    return installed >= minimum

print(check_version(current, SemVer(2, 1)))   # True`,
  },
  {
    name: "__hash__(self)",
    description:
      "Возвращает целочисленный хэш объекта, используемый при помещении в set и в качестве ключа dict. Контракт: объекты, равные по __eq__, обязаны иметь одинаковый хэш. Если __eq__ переопределён, Python автоматически устанавливает __hash__ = None (объект нехэшируем) — нужно явно реализовать __hash__. Хэш должен быть стабильным на протяжении жизни объекта.",
    syntax: "def __hash__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class Point:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y

    def __eq__(self, other) -> bool:
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)

    def __hash__(self) -> int:
        return hash((self.x, self.y))   # кортеж хэшируется встроенно

p1 = Point(1, 2)
p2 = Point(1, 2)
p3 = Point(3, 4)

print(hash(p1) == hash(p2))   # True  (равные объекты — равные хэши)

# Теперь Point работает в set и dict
visited = {p1, p3}
print(p2 in visited)          # True  (__eq__ + __hash__)

lookup = {p1: 'origin', p3: 'end'}
print(lookup[p2])             # 'origin'  (p2 == p1)

# Изменяемые объекты не должны хэшироваться по полям,
# которые могут меняться — это нарушит инварианты dict/set`,
  },
  {
    name: "__bool__(self)",
    description:
      "Реализует проверку истинности объекта в булевом контексте: if obj, while obj, bool(obj). Должен вернуть True или False. Если __bool__ не определён, Python проверяет __len__ (объект ложный если len == 0). Если не определено ни то, ни другое — объект всегда истинный.",
    syntax: "def __bool__(self) -> bool",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class Budget:
    def __init__(self, amount: float):
        self.amount = amount

    def __bool__(self) -> bool:
        return self.amount > 0

    def __repr__(self): return f"Budget({self.amount})"

b1 = Budget(100)
b2 = Budget(0)
b3 = Budget(-50)

print(bool(b1))   # True
print(bool(b2))   # False
print(bool(b3))   # False

if b1:
    print("есть бюджет")      # выводится
if not b2:
    print("бюджет исчерпан")  # выводится

# Приоритет: __bool__ > __len__ > всегда True
class Stack:
    def __init__(self): self._data = []
    def push(self, x): self._data.append(x)
    def __len__(self): return len(self._data)  # используется как bool

s = Stack()
print(bool(s))    # False — пустой
s.push(1)
print(bool(s))    # True  — непустой`,
  },

  // ─── Доступ к атрибутам ───────────────────────────────────────────────────
  {
    name: "__getattr__(self, name)",
    description:
      "Вызывается только когда атрибут не найден обычным способом (не в __dict__ экземпляра и не в классе). Позволяет реализовать «ленивые» атрибуты, делегирование, динамические прокси. Не вызывается для существующих атрибутов — это отличает его от __getattribute__.",
    syntax: "def __getattr__(self, name: str)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      {
        name: "name",
        description:
          "Имя запрошенного атрибута, который не был найден стандартным образом.",
      },
    ],
    example: `class LazyConfig:
    """Загружает значения из конфига только при первом обращении."""
    def __init__(self, data: dict):
        self._data = data

    def __getattr__(self, name: str):
        if name in self._data:
            value = self._data[name]
            setattr(self, name, value)   # кэшируем в __dict__
            return value
        raise AttributeError(f"Нет настройки: {name!r}")

cfg = LazyConfig({'host': 'localhost', 'port': 5432})
print(cfg.host)    # 'localhost'  — __getattr__ вызван, результат закэширован
print(cfg.host)    # 'localhost'  — теперь из __dict__, __getattr__ не вызывается

try:
    cfg.unknown
except AttributeError as e:
    print(e)       # Нет настройки: 'unknown'`,
  },
  {
    name: "__getattribute__(self, name)",
    description:
      "Вызывается при каждом обращении к любому атрибуту объекта — в отличие от __getattr__, который вызывается только при ненайденных атрибутах. Переопределять следует с осторожностью: неправильная реализация приводит к бесконечной рекурсии. Для обращения к атрибутам внутри метода всегда используйте super().__getattribute__(name) или object.__getattribute__(self, name).",
    syntax: "def __getattribute__(self, name: str)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      { name: "name", description: "Имя запрашиваемого атрибута." },
    ],
    example: `class AccessLog:
    """Логирует каждое обращение к публичным атрибутам."""
    def __init__(self, x: int, y: int):
        # Обходим __getattribute__ при инициализации через object.__setattr__
        object.__setattr__(self, 'x', x)
        object.__setattr__(self, 'y', y)

    def __getattribute__(self, name: str):
        if not name.startswith('_'):
            print(f"  [доступ] {name}")
        # Обязательно — иначе бесконечная рекурсия!
        return object.__getattribute__(self, name)

p = AccessLog(1, 2)
print(p.x)   # [доступ] x  ->  1
print(p.y)   # [доступ] y  ->  2

# Внутренние атрибуты (_ prefix) логируются без шума
# Типичное применение: аудит, read-only обёртки, прозрачные прокси`,
  },
  {
    name: "__setattr__(self, name, value)",
    description:
      "Вызывается при каждом присваивании атрибута: obj.name = value. Позволяет перехватывать и валидировать присваивания, создавать read-only атрибуты или логировать изменения. Внутри метода необходимо вызывать object.__setattr__ — прямое присваивание через self.name вызвало бы рекурсию.",
    syntax: "def __setattr__(self, name: str, value)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      {
        name: "name",
        description: "Имя атрибута, которому присваивается значение.",
      },
      { name: "value", description: "Присваиваемое значение." },
    ],
    example: `class Validated:
    """Объект с валидацией типов при присваивании."""
    _schema: dict = {'x': (int, float), 'y': (int, float), 'label': str}

    def __setattr__(self, name: str, value):
        if name in self._schema:
            expected = self._schema[name]
            if not isinstance(value, expected):
                raise TypeError(
                    f"{name} должен быть {expected}, получен {type(value).__name__}"
                )
        object.__setattr__(self, name, value)   # стандартное присваивание

obj = Validated()
obj.x = 1.5        # OK
obj.label = 'A'    # OK

try:
    obj.x = 'bad'  # TypeError
except TypeError as e:
    print(e)

# Read-only атрибуты
class Immutable:
    def __init__(self, value):
        object.__setattr__(self, '_value', value)

    def __setattr__(self, name, value):
        raise AttributeError("объект неизменяем")`,
  },
  {
    name: "__delattr__(self, name)",
    description:
      "Вызывается при операции del obj.name. Позволяет контролировать или запрещать удаление атрибутов. Для фактического удаления внутри метода используйте object.__delattr__(self, name) — прямой вызов del self.name вызовет рекурсию.",
    syntax: "def __delattr__(self, name: str)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      { name: "name", description: "Имя удаляемого атрибута." },
    ],
    example: `class ProtectedAttrs:
    PROTECTED = frozenset({'id', 'created_at'})

    def __init__(self, id: int):
        object.__setattr__(self, 'id', id)
        object.__setattr__(self, 'tag', 'default')

    def __delattr__(self, name: str):
        if name in self.PROTECTED:
            raise AttributeError(f"Атрибут {name!r} защищён от удаления")
        object.__delattr__(self, name)

obj = ProtectedAttrs(42)

# Удалить обычный атрибут — OK
obj.tag = 'test'
del obj.tag
print(hasattr(obj, 'tag'))   # False

# Попытка удалить защищённый атрибут
try:
    del obj.id
except AttributeError as e:
    print(e)   # Атрибут 'id' защищён от удаления

print(obj.id)   # 42 — атрибут цел`,
  },
  {
    name: "__dir__(self)",
    description:
      "Вызывается функцией dir(obj). Должен вернуть список строк — имён атрибутов объекта. По умолчанию dir() возвращает атрибуты из __dict__ экземпляра, класса и всех родителей. Переопределяется для динамических объектов (прокси, ORM, конфиг-объекты) чтобы dir() показывал реальные доступные атрибуты.",
    syntax: "def __dir__(self) -> list[str]",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class DynamicProxy:
    """Прокси, делегирующий атрибуты к внутреннему объекту."""
    def __init__(self, target):
        object.__setattr__(self, '_target', target)

    def __getattr__(self, name: str):
        return getattr(self._target, name)

    def __dir__(self) -> list[str]:
        # Объединяем атрибуты прокси и цели
        own  = list(object.__dir__(self))
        tgt  = dir(object.__getattribute__(self, '_target'))
        return sorted(set(own + tgt))

import io
proxy = DynamicProxy(io.StringIO())

attrs = dir(proxy)
print('write'  in attrs)   # True  — из StringIO
print('_target' in attrs)  # True  — собственный атрибут

# Пример: скрыть «приватные» атрибуты
class CleanDir:
    def __init__(self):
        self.public = 1
        self._private = 2

    def __dir__(self):
        return [k for k in object.__dir__(self) if not k.startswith('_')]

print(dir(CleanDir()))   # только публичные атрибуты`,
  },

  // ─── Дескрипторы ──────────────────────────────────────────────────────────
  {
    name: "__get__(self, instance, owner)",
    description:
      "Метод протокола дескриптора, вызываемый при чтении атрибута через экземпляр (instance) или класс (owner). Если instance равен None — доступ идёт через класс. Дескриптор, реализующий __get__, называется non-data дескриптором (если нет __set__/__delete__) или data дескриптором (если есть). Data дескрипторы имеют приоритет над __dict__ экземпляра.",
    syntax: "def __get__(self, instance, owner=None)",
    arguments: [
      { name: "self", description: "Объект дескриптора." },
      {
        name: "instance",
        description:
          "Экземпляр класса, через который происходит доступ. None при обращении через сам класс.",
      },
      { name: "owner", description: "Класс-владелец атрибута." },
    ],
    example: `class Celsius:
    """Дескриптор: температура в градусах Цельсия."""
    def __set_name__(self, owner, name):
        self._name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self              # обращение через класс
        return instance.__dict__.get(self._name, 0.0)

    def __set__(self, instance, value):
        if not isinstance(value, (int, float)):
            raise TypeError("Температура должна быть числом")
        instance.__dict__[self._name] = float(value)

class Thermostat:
    temp = Celsius()

    @property
    def fahrenheit(self):
        return self.temp * 9/5 + 32

t = Thermostat()
t.temp = 100
print(t.temp)        # 100.0
print(t.fahrenheit)  # 212.0
print(Thermostat.temp)  # <Celsius object>  — instance=None`,
  },
  {
    name: "__set__(self, instance, value)",
    description:
      "Метод протокола дескриптора, вызываемый при присваивании атрибута через экземпляр. Наличие __set__ делает дескриптор «data descriptor», который имеет приоритет над одноимённой записью в __dict__ экземпляра. Используется для валидации, приведения типов и управляемых атрибутов.",
    syntax: "def __set__(self, instance, value)",
    arguments: [
      { name: "self", description: "Объект дескриптора." },
      {
        name: "instance",
        description: "Экземпляр класса, которому присваивается атрибут.",
      },
      { name: "value", description: "Присваиваемое значение." },
    ],
    example: `class TypedField:
    """Дескриптор с проверкой типа при записи."""
    def __init__(self, expected_type):
        self.expected_type = expected_type

    def __set_name__(self, owner, name):
        self.name = name
        self.storage = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None: return self
        return getattr(instance, self.storage, None)

    def __set__(self, instance, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(
                f"{self.name}: ожидается {self.expected_type.__name__}, "
                f"получен {type(value).__name__}"
            )
        setattr(instance, self.storage, value)

class Person:
    name = TypedField(str)
    age  = TypedField(int)

p = Person()
p.name = 'Alice'   # OK
p.age  = 30        # OK

try:
    p.age = '30'   # TypeError: age: ожидается int, получен str
except TypeError as e:
    print(e)`,
  },
  {
    name: "__delete__(self, instance)",
    description:
      "Метод протокола дескриптора, вызываемый при del obj.attr. Вместе с __get__ и __set__ образует полный data descriptor. Позволяет перехватить удаление атрибута — запретить его, выполнить очистку или сбросить к значению по умолчанию.",
    syntax: "def __delete__(self, instance)",
    arguments: [
      { name: "self", description: "Объект дескриптора." },
      {
        name: "instance",
        description: "Экземпляр класса, у которого удаляется атрибут.",
      },
    ],
    example: `class CachedComputed:
    """Дескриптор с ленивым вычислением и ручным сбросом кэша."""
    def __init__(self, func):
        self.func    = func
        self.storage = f'_cache_{func.__name__}'

    def __get__(self, instance, owner):
        if instance is None: return self
        if not hasattr(instance, self.storage):
            # Вычисляем и кэшируем
            setattr(instance, self.storage, self.func(instance))
        return getattr(instance, self.storage)

    def __delete__(self, instance):
        # Сброс кэша через del obj.attr
        if hasattr(instance, self.storage):
            delattr(instance, self.storage)
            print(f"кэш {self.func.__name__} сброшен")

class Report:
    def __init__(self, data): self.data = data

    @CachedComputed
    def total(self):
        print("  вычисляю total...")
        return sum(self.data)

r = Report([1, 2, 3, 4, 5])
print(r.total)   # вычисляю total... -> 15
print(r.total)   # 15  (кэш)
del r.total      # кэш total сброшен
print(r.total)   # вычисляю total... -> 15`,
  },
  {
    name: "__set_name__(self, owner, name)",
    description:
      'Вызывается автоматически при определении класса, когда дескриптор присваивается атрибуту класса. Позволяет дескриптору узнать своё собственное имя без явной передачи — избавляет от дублирования (TypedField("name", str) → TypedField(str)). Добавлен в Python 3.6.',
    syntax: "def __set_name__(self, owner, name)",
    arguments: [
      { name: "self", description: "Объект дескриптора." },
      { name: "owner", description: "Класс, в котором определяется атрибут." },
      {
        name: "name",
        description: "Имя атрибута класса, которому присваивается дескриптор.",
      },
    ],
    example: `class Column:
    """ORM-подобный дескриптор для полей модели."""
    def __init__(self, col_type: str):
        self.col_type = col_type
        self.name = None   # заполнится в __set_name__

    def __set_name__(self, owner, name):
        self.name = name
        # Также можно регистрировать поле в реестре класса
        if not hasattr(owner, '_columns'):
            owner._columns = {}
        owner._columns[name] = self

    def __get__(self, instance, owner):
        if instance is None: return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value

    def __repr__(self):
        return f"Column({self.col_type!r}, name={self.name!r})"

class User:
    id    = Column('INTEGER')
    name  = Column('VARCHAR')
    email = Column('VARCHAR')

print(User._columns)
# {'id': Column('INTEGER', name='id'), 'name': ..., 'email': ...}
u = User()
u.name = 'Alice'
print(u.name)   # 'Alice'`,
  },

  // ─── Контейнеры и итерируемые ─────────────────────────────────────────────
  {
    name: "__len__(self)",
    description:
      "Возвращает длину объекта — неотрицательное целое число. Вызывается функцией len() и используется для булевой проверки (объект ложный если len == 0, при отсутствии __bool__). Должен выполняться за O(1).",
    syntax: "def __len__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class WordBag:
    def __init__(self, text: str):
        self._words = text.split()

    def __len__(self) -> int:
        return len(self._words)

    def __repr__(self):
        return f"WordBag({self._words})"

bag = WordBag("the quick brown fox")
print(len(bag))    # 4

# __len__ используется для bool (при отсутствии __bool__)
empty = WordBag("")
print(bool(empty))    # False  (len == 0)
print(bool(bag))      # True   (len > 0)

if bag:
    print("есть слова")   # выводится

# В условных выражениях
result = bag if bag else WordBag("default")
print(result)   # WordBag(['the', 'quick', 'brown', 'fox'])`,
  },
  {
    name: "__length_hint__(self)",
    description:
      "Возвращает приблизительную длину объекта — используется функцией operator.length_hint() для предварительного выделения памяти при итерации (например, list() или list.extend()). Может быть неточным или вернуть 0 если оценка недоступна. Не влияет на bool. Вызывается только если __len__ не определён.",
    syntax: "def __length_hint__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import operator

class StreamReader:
    """Итератор с примерной оценкой размера."""
    def __init__(self, data: list):
        self._data = iter(data)
        self._hint = len(data)

    def __iter__(self): return self

    def __next__(self):
        self._hint = max(0, self._hint - 1)
        return next(self._data)

    def __length_hint__(self) -> int:
        return self._hint   # убывает по мере чтения

reader = StreamReader(range(100))
print(operator.length_hint(reader))   # 100

next(reader)
next(reader)
print(operator.length_hint(reader))   # 98

# list() использует __length_hint__ для предварительного резервирования
result = list(StreamReader(range(5)))
print(result)   # [0, 1, 2, 3, 4]`,
  },
  {
    name: "__getitem__(self, key)",
    description:
      "Реализует доступ по индексу или ключу: obj[key]. Для последовательностей key — целое число или срез (slice); для отображений — хэшируемый ключ. При неверном типе ключа следует вызывать TypeError, при отсутствии — IndexError (последовательности) или KeyError (отображения).",
    syntax: "def __getitem__(self, key)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      {
        name: "key",
        description: "Индекс, срез (slice) или ключ для доступа к элементу.",
      },
    ],
    example: `class Matrix:
    def __init__(self, rows):
        self._data = rows   # список списков

    def __getitem__(self, key):
        if isinstance(key, tuple):
            row, col = key
            return self._data[row][col]
        return self._data[key]

    def __repr__(self):
        return '\\n'.join(str(row) for row in self._data)

m = Matrix([[1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]])

print(m[0])        # [1, 2, 3]   — строка
print(m[1, 2])     # 6           — элемент по (строка, столбец)
print(m[0:2])      # первые две строки (slice)

# Срезы: isinstance(key, slice)
class Range:
    def __init__(self, n): self.n = n
    def __getitem__(self, key):
        if isinstance(key, slice):
            return list(range(*key.indices(self.n)))
        return key if 0 <= key < self.n else (_ for _ in ()).throw(IndexError(key))`,
  },
  {
    name: "__setitem__(self, key, value)",
    description:
      "Реализует присваивание по индексу или ключу: obj[key] = value. Вместе с __getitem__ и __delitem__ образует полноценный изменяемый контейнер. Должен вызывать TypeError для неподдерживаемого типа ключа.",
    syntax: "def __setitem__(self, key, value)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      { name: "key", description: "Индекс, срез или ключ." },
      { name: "value", description: "Присваиваемое значение." },
    ],
    example: `class FixedArray:
    """Массив фиксированного размера с проверкой границ."""
    def __init__(self, size: int, default=0):
        self._data = [default] * size

    def __getitem__(self, idx: int):
        return self._data[idx]

    def __setitem__(self, idx: int, value):
        if not isinstance(idx, int):
            raise TypeError(f"Индекс должен быть int, получен {type(idx).__name__}")
        if not (0 <= idx < len(self._data)):
            raise IndexError(f"Индекс {idx} выходит за пределы [0, {len(self._data)})")
        self._data[idx] = value

    def __repr__(self):
        return f"FixedArray({self._data})"

arr = FixedArray(5)
arr[0] = 10
arr[4] = 99
print(arr)          # FixedArray([10, 0, 0, 0, 99])

try:
    arr[5] = 1      # IndexError
except IndexError as e:
    print(e)

try:
    arr['a'] = 1    # TypeError
except TypeError as e:
    print(e)`,
  },
  {
    name: "__delitem__(self, key)",
    description:
      "Реализует удаление элемента по индексу или ключу: del obj[key]. Должен вызывать KeyError (отображения) или IndexError (последовательности) при отсутствии ключа.",
    syntax: "def __delitem__(self, key)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      {
        name: "key",
        description: "Индекс, срез или ключ удаляемого элемента.",
      },
    ],
    example: `class LRUStore:
    """Хранилище с ограниченным размером — при удалении освобождает слот."""
    def __init__(self, capacity: int):
        self._store   = {}
        self._order   = []
        self.capacity = capacity

    def __setitem__(self, key, value):
        if key not in self._store and len(self._store) >= self.capacity:
            oldest = self._order.pop(0)
            del self._store[oldest]
        self._store[key] = value
        if key in self._order: self._order.remove(key)
        self._order.append(key)

    def __getitem__(self, key): return self._store[key]

    def __delitem__(self, key):
        if key not in self._store:
            raise KeyError(key)
        del self._store[key]
        self._order.remove(key)

    def __repr__(self): return f"LRUStore({self._store})"

cache = LRUStore(3)
cache['a'] = 1; cache['b'] = 2; cache['c'] = 3
del cache['b']
print(cache)   # LRUStore({'a': 1, 'c': 3})`,
  },
  {
    name: "__missing__(self, key)",
    description:
      "Вызывается методом __getitem__ словаря при отсутствии ключа — только если класс наследует dict. Позволяет задать поведение по умолчанию вместо KeyError. Именно так работает collections.defaultdict. При наследовании от UserDict вызывается аналогично.",
    syntax: "def __missing__(self, key)",
    arguments: [
      { name: "self", description: "Экземпляр класса (подкласс dict)." },
      { name: "key", description: "Ключ, который не был найден в словаре." },
    ],
    example: `class DefaultDict(dict):
    """Словарь с автоматически создаваемыми значениями по умолчанию."""
    def __init__(self, default_factory):
        super().__init__()
        self.default_factory = default_factory

    def __missing__(self, key):
        default = self.default_factory()
        self[key] = default   # сохраняем, чтобы при следующем обращении уже был
        return default

word_count = DefaultDict(int)
for word in "the quick brown fox jumps over the lazy fox".split():
    word_count[word] += 1   # __missing__ создаёт 0, потом += 1

print(word_count['the'])    # 2
print(word_count['fox'])    # 2
print(word_count['unknown'])  # 0  — создано через __missing__

# Аналогичен collections.defaultdict:
from collections import defaultdict
wc = defaultdict(int)
wc['x'] += 5
print(wc['x'])   # 5`,
  },
  {
    name: "__iter__(self)",
    description:
      "Возвращает итератор для объекта — вызывается функцией iter() и неявно в for-циклах, list(), tuple(), распаковке и других конструкциях итерации. Должен вернуть объект с методом __next__. Если класс сам является итератором — возвращает self.",
    syntax: "def __iter__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class Fibonacci:
    """Итерируемый генератор чисел Фибоначчи до n-го члена."""
    def __init__(self, n: int):
        self.n = n

    def __iter__(self):
        a, b, count = 0, 1, 0
        while count < self.n:
            yield a
            a, b = b, a + b
            count += 1

fib = Fibonacci(8)

# for-цикл вызывает __iter__
for x in fib:
    print(x, end=' ')
# 0 1 1 2 3 5 8 13

# Повторная итерация — создаётся новый итератор
print(list(fib))   # [0, 1, 1, 2, 3, 5, 8, 13]

# Распаковка
a, b, *rest = Fibonacci(5)
print(a, b, rest)   # 0 1 [1, 2, 3]`,
  },
  {
    name: "__next__(self)",
    description:
      "Возвращает следующий элемент итератора. Вызывается функцией next(). Когда элементы исчерпаны — должен вызвать StopIteration. Класс, реализующий __iter__ и __next__, является итератором; если реализован только __iter__ — итерируемым объектом.",
    syntax: "def __next__(self)",
    arguments: [{ name: "self", description: "Объект итератора." }],
    example: `class CountDown:
    """Итератор обратного отсчёта."""
    def __init__(self, start: int):
        self.current = start

    def __iter__(self):
        return self   # сам является итератором

    def __next__(self) -> int:
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value

cd = CountDown(5)
print(next(cd))   # 5
print(next(cd))   # 4

for n in CountDown(3):
    print(n, end=' ')   # 3 2 1

# Осторожно: итератор одноразовый — повторный цикл даст 0 элементов
it = CountDown(3)
print(list(it))   # [3, 2, 1]
print(list(it))   # []  — исчерпан`,
  },
  {
    name: "__reversed__(self)",
    description:
      "Возвращает итератор для обхода элементов в обратном порядке. Вызывается функцией reversed(). Если не определён, reversed() пытается использовать __len__ и __getitem__ (для последовательностей). Определяйте __reversed__ когда есть более эффективный способ обратного обхода, чем создание reversed(list(obj)).",
    syntax: "def __reversed__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class SortedList:
    def __init__(self, data):
        self._data = sorted(data)

    def __iter__(self):
        return iter(self._data)

    def __reversed__(self):
        # Эффективный обратный обход без копирования
        return reversed(self._data)

    def __len__(self): return len(self._data)

sl = SortedList([3, 1, 4, 1, 5, 9, 2, 6])

print(list(sl))            # [1, 1, 2, 3, 4, 5, 6, 9]
print(list(reversed(sl)))  # [9, 6, 5, 4, 3, 2, 1, 1]

# Вариант без __reversed__ — reversed() автоматически через __len__+__getitem__
class SimpleSeq:
    def __init__(self, data): self._data = data
    def __len__(self):        return len(self._data)
    def __getitem__(self, i): return self._data[i]

print(list(reversed(SimpleSeq([1, 2, 3]))))   # [3, 2, 1]`,
  },
  {
    name: "__contains__(self, item)",
    description:
      "Реализует оператор принадлежности in: item in obj. Должен вернуть True или False. Если не определён, Python перебирает объект через __iter__ линейно — O(n). Определяйте __contains__ для O(1) проверки (хэш-структуры, интервалы).",
    syntax: "def __contains__(self, item) -> bool",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      { name: "item", description: "Проверяемый элемент." },
    ],
    example: `class IPNetwork:
    """Проверка принадлежности IP-адреса подсети (упрощённо)."""
    def __init__(self, network: str, mask: int):
        parts = [int(p) for p in network.split('.')]
        self._base = sum(p << (24 - 8 * i) for i, p in enumerate(parts))
        self._mask = (0xFFFFFFFF << (32 - mask)) & 0xFFFFFFFF

    def __contains__(self, ip: str) -> bool:
        parts = [int(p) for p in ip.split('.')]
        addr  = sum(p << (24 - 8 * i) for i, p in enumerate(parts))
        return (addr & self._mask) == (self._base & self._mask)

net = IPNetwork('192.168.1.0', 24)
print('192.168.1.100' in net)   # True
print('192.168.2.1'   in net)   # False
print('10.0.0.1'      in net)   # False

# Интервал
class Interval:
    def __init__(self, lo, hi): self.lo, self.hi = lo, hi
    def __contains__(self, x):  return self.lo <= x <= self.hi

r = Interval(0, 100)
print(50 in r)    # True
print(101 in r)   # False`,
  },

  // ─── Арифметические операторы ─────────────────────────────────────────────
  {
    name: "__add__(self, other) / __radd__ / __iadd__",
    description:
      "Реализует оператор сложения (+). __add__ вызывается для левого операнда (a + b). Если возвращает NotImplemented — Python пробует __radd__ правого операнда. __iadd__ реализует составное присваивание (+=); если не определён, Python использует __add__. Для изменяемых объектов __iadd__ должен изменять self на месте и вернуть self; для неизменяемых — вернуть новый объект.",
    syntax:
      "def __add__(self, other)\ndef __radd__(self, other)\ndef __iadd__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Левый операнд (__add__, __iadd__) или правый (__radd__).",
      },
      {
        name: "other",
        description:
          "Второй операнд. При несовместимом типе верните NotImplemented.",
      },
    ],
    example: `class Vector:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        if isinstance(other, (int, float)):          # Vector + скаляр
            return Vector(self.x + other, self.y + other)
        return NotImplemented

    def __radd__(self, other):           # скаляр + Vector
        return self.__add__(other)

    def __iadd__(self, other):           # v += other
        if isinstance(other, Vector):
            self.x += other.x
            self.y += other.y
            return self                  # изменяем на месте
        return NotImplemented

    def __repr__(self): return f"Vector({self.x}, {self.y})"

v1 = Vector(1, 2)
v2 = Vector(3, 4)

print(v1 + v2)     # Vector(4, 6)   — __add__
print(10 + v1)     # Vector(11, 12) — __radd__

v1 += v2           # __iadd__ — v1 изменён на месте
print(v1)          # Vector(4, 6)

# sum() начинает с 0, поэтому __radd__ обязателен:
print(sum([Vector(1,0), Vector(0,1)], Vector(0,0)))  # Vector(1, 1)`,
  },
  {
    name: "__sub__(self, other) / __rsub__ / __isub__",
    description:
      "Реализует оператор вычитания (-). __sub__ — для a - b, __rsub__ — отражённый вызов когда левый операнд возвращает NotImplemented, __isub__ — составное присваивание (-=). Порядок аргументов в __rsub__ инвертирован: self — правый операнд, other — левый; self.y - self.x ≠ other - self.",
    syntax:
      "def __sub__(self, other)\ndef __rsub__(self, other)\ndef __isub__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Левый операнд (__sub__, __isub__) или правый (__rsub__).",
      },
      { name: "other", description: "Второй операнд." },
    ],
    example: `from datetime import timedelta

class Duration:
    def __init__(self, seconds: float):
        self.s = seconds

    def __sub__(self, other):
        if isinstance(other, Duration):
            return Duration(self.s - other.s)
        if isinstance(other, (int, float)):
            return Duration(self.s - other)
        return NotImplemented

    def __rsub__(self, other):   # other - self  (не self - other!)
        if isinstance(other, (int, float)):
            return Duration(other - self.s)
        return NotImplemented

    def __isub__(self, other):
        if isinstance(other, Duration):
            self.s -= other.s
            return self
        return NotImplemented

    def __repr__(self): return f"Duration({self.s}s)"

a = Duration(100)
b = Duration(30)

print(a - b)    # Duration(70s)   — __sub__
print(200 - a)  # Duration(100s)  — __rsub__: 200 - 100

a -= b
print(a)        # Duration(70s)   — __isub__`,
  },
  {
    name: "__mul__(self, other) / __rmul__ / __imul__",
    description:
      "Реализует оператор умножения (*). __mul__ — a * b, __rmul__ — отражение (b * a когда b не знает как умножаться), __imul__ — составное присваивание (*=). Часто используется для повторения последовательностей (list * 3) и масштабирования векторов/матриц.",
    syntax:
      "def __mul__(self, other)\ndef __rmul__(self, other)\ndef __imul__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Левый операнд (__mul__, __imul__) или правый (__rmul__).",
      },
      { name: "other", description: "Второй операнд." },
    ],
    example: `class Vec2:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y

    def __mul__(self, other):
        if isinstance(other, (int, float)):    # масштабирование: v * 3
            return Vec2(self.x * other, self.y * other)
        if isinstance(other, Vec2):            # скалярное произведение
            return self.x * other.x + self.y * other.y
        return NotImplemented

    def __rmul__(self, other):                 # 3 * v
        return self.__mul__(other)

    def __imul__(self, other):                 # v *= 2
        if isinstance(other, (int, float)):
            self.x *= other
            self.y *= other
            return self
        return NotImplemented

    def __repr__(self): return f"Vec2({self.x}, {self.y})"

v = Vec2(2, 3)
print(v * 4)      # Vec2(8, 12)   — __mul__
print(4 * v)      # Vec2(8, 12)   — __rmul__
print(v * v)      # 13            — скалярное произведение

v *= 2
print(v)          # Vec2(4, 6)    — __imul__`,
  },
  {
    name: "__matmul__(self, other) / __rmatmul__ / __imatmul__",
    description:
      "Реализует оператор матричного умножения (@), введённый в Python 3.5 (PEP 465). Не используется встроенными типами — предназначен для численных библиотек (NumPy: A @ B). __rmatmul__ — отражение, __imatmul__ — составное присваивание (@=).",
    syntax:
      "def __matmul__(self, other)\ndef __rmatmul__(self, other)\ndef __imatmul__(self, other)",
    arguments: [
      {
        name: "self",
        description:
          "Левый операнд (__matmul__, __imatmul__) или правый (__rmatmul__).",
      },
      { name: "other", description: "Правый (левый для __rmatmul__) операнд." },
    ],
    example: `class Matrix2x2:
    def __init__(self, a, b, c, d):
        self.m = [[a, b], [c, d]]

    def __matmul__(self, other):
        if not isinstance(other, Matrix2x2):
            return NotImplemented
        a, b = self.m
        c, d = other.m
        return Matrix2x2(
            a[0]*c[0][0] + a[1]*c[1][0],  a[0]*c[0][1] + a[1]*c[1][1],
            b[0]*c[0][0] + b[1]*c[1][0],  b[0]*c[0][1] + b[1]*c[1][1],
        )

    def __imatmul__(self, other):
        result = self.__matmul__(other)
        if result is NotImplemented: return NotImplemented
        self.m = result.m
        return self

    def __repr__(self):
        return f"Matrix2x2{self.m}"

I = Matrix2x2(1, 0, 0, 1)   # единичная матрица
A = Matrix2x2(1, 2, 3, 4)

print(A @ I)   # Matrix2x2[[1,2],[3,4]]  — то же, что A

A @= Matrix2x2(0, 1, 1, 0)  # перестановочная матрица
print(A)       # Matrix2x2[[2,1],[4,3]]`,
  },
  {
    name: "__truediv__(self, other) / __rtruediv__ / __itruediv__",
    description:
      "Реализует оператор деления (/), который в Python 3 всегда возвращает float (истинное деление). __rtruediv__ — отражение, __itruediv__ — составное присваивание (/=). Для целочисленного деления используется __floordiv__.",
    syntax:
      "def __truediv__(self, other)\ndef __rtruediv__(self, other)\ndef __itruediv__(self, other)",
    arguments: [
      {
        name: "self",
        description:
          "Делимое (__truediv__, __itruediv__) или делитель (__rtruediv__).",
      },
      {
        name: "other",
        description: "Делитель (или делимое для __rtruediv__).",
      },
    ],
    example: `from __future__ import annotations
from fractions import Fraction

class Money:
    def __init__(self, amount: float, currency: str = 'RUB'):
        self.amount   = amount
        self.currency = currency

    def __truediv__(self, other):
        if isinstance(other, (int, float)):
            return Money(self.amount / other, self.currency)
        if isinstance(other, Money):
            if self.currency != other.currency:
                raise ValueError("разные валюты")
            return self.amount / other.amount   # безразмерное отношение
        return NotImplemented

    def __itruediv__(self, other):
        if isinstance(other, (int, float)):
            self.amount /= other
            return self
        return NotImplemented

    def __repr__(self): return f"{self.amount:.2f} {self.currency}"

price = Money(1000)
print(price / 4)          # 250.00 RUB  — __truediv__

share = Money(200) / Money(1000)
print(share)              # 0.2  — безразмерное отношение

price /= 2
print(price)              # 500.00 RUB  — __itruediv__`,
  },
  {
    name: "__floordiv__(self, other) / __rfloordiv__ / __ifloordiv__",
    description:
      "Реализует оператор целочисленного деления (//), возвращающий наибольшее целое, не превышающее результат деления (floor division). __rfloordiv__ — отражение, __ifloordiv__ — составное присваивание (//=). Результат округляется в сторону минус бесконечности: -7 // 2 = -4.",
    syntax:
      "def __floordiv__(self, other)\ndef __rfloordiv__(self, other)\ndef __ifloordiv__(self, other)",
    arguments: [
      {
        name: "self",
        description:
          "Делимое (__floordiv__, __ifloordiv__) или делитель (__rfloordiv__).",
      },
      {
        name: "other",
        description: "Делитель (или делимое для __rfloordiv__).",
      },
    ],
    example: `class Duration:
    """Длительность в секундах."""
    def __init__(self, seconds: int):
        self.s = seconds

    def __floordiv__(self, other):
        if isinstance(other, int):
            return Duration(self.s // other)
        if isinstance(other, Duration):
            return self.s // other.s        # сколько раз other умещается в self
        return NotImplemented

    def __rfloordiv__(self, other):
        if isinstance(other, int):
            return Duration(other // self.s)
        return NotImplemented

    def __ifloordiv__(self, other):
        if isinstance(other, int):
            self.s //= other
            return self
        return NotImplemented

    def __repr__(self):
        h, rem = divmod(self.s, 3600)
        m, s   = divmod(rem, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"

d = Duration(3700)
print(d // 2)                      # 00:30:50   (1850 сек)
print(Duration(3600) // Duration(60))  # 60  — 60 минут
d //= 4
print(d)                           # 00:15:25   (925 сек)`,
  },
  {
    name: "__mod__(self, other) / __rmod__ / __imod__",
    description:
      'Реализует оператор остатка от деления (%). __rmod__ — отражение (используется str.__mod__ для форматирования "шаблон % значения"), __imod__ — составное присваивание (%=). Знак результата совпадает со знаком делителя (в отличие от C).',
    syntax:
      "def __mod__(self, other)\ndef __rmod__(self, other)\ndef __imod__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Делимое (__mod__, __imod__) или делитель (__rmod__).",
      },
      { name: "other", description: "Делитель (или делимое для __rmod__)." },
    ],
    example: `class Clock:
    """Часы с автоматическим переносом через 24h."""
    def __init__(self, hours: int):
        self.h = hours % 24

    def __add__(self, other):
        if isinstance(other, int):
            return Clock(self.h + other)
        return NotImplemented

    def __mod__(self, other):
        if isinstance(other, int):
            return Clock(self.h % other)
        return NotImplemented

    def __imod__(self, other):
        if isinstance(other, int):
            self.h %= other
            return self
        return NotImplemented

    def __repr__(self): return f"Clock({self.h:02d}:00)"

c = Clock(27)
print(c)           # Clock(03:00)   — 27 % 24 в __init__

c2 = Clock(17) % 12
print(c2)          # Clock(05:00)

c2 %= 4
print(c2)          # Clock(01:00)

# Классический % форматирования строк через __rmod__ у str:
print("Привет, %s! Тебе %d лет." % ("Аня", 25))`,
  },
  {
    name: "__divmod__(self, other) / __rdivmod__",
    description:
      "Реализует встроенную функцию divmod(a, b), возвращающую кортеж (частное, остаток) за один вызов. __rdivmod__ — отражение для случая когда левый операнд возвращает NotImplemented. Нет варианта __idivmod__ (составного присваивания). Результат должен быть эквивалентен (a // b, a % b).",
    syntax:
      "def __divmod__(self, other) -> tuple\ndef __rdivmod__(self, other) -> tuple",
    arguments: [
      {
        name: "self",
        description: "Делимое (__divmod__) или делитель (__rdivmod__).",
      },
      { name: "other", description: "Делитель (или делимое для __rdivmod__)." },
    ],
    example: `class Meter:
    def __init__(self, cm: int):
        self.cm = cm

    def __divmod__(self, other):
        if isinstance(other, Meter):
            q, r = divmod(self.cm, other.cm)
            return (q, Meter(r))
        if isinstance(other, int):
            q, r = divmod(self.cm, other)
            return (Meter(q), Meter(r))
        return NotImplemented

    def __rdivmod__(self, other):
        if isinstance(other, int):
            return divmod(Meter(other), self)
        return NotImplemented

    def __repr__(self): return f"{self.cm}cm"

d = Meter(175)
step = Meter(30)

quotient, remainder = divmod(d, step)
print(quotient, remainder)    # 5  25cm   (175 = 5*30 + 25)

# С int
q, r = divmod(d, 7)
print(q, r)                   # 25cm  0cm`,
  },
  {
    name: "__pow__(self, other[, modulo]) / __rpow__ / __ipow__",
    description:
      "Реализует оператор возведения в степень (**) и встроенную функцию pow(base, exp, mod). Трёхаргументная форма pow(a, b, mod) вызывает __pow__(b, mod) — modulo передаётся как третий аргумент; его нужно обработать явно (или проигнорировать с raise TypeError). __rpow__ — отражение, __ipow__ — составное присваивание (**=).",
    syntax:
      "def __pow__(self, other, modulo=None)\ndef __rpow__(self, other)\ndef __ipow__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Основание (__pow__, __ipow__) или показатель (__rpow__).",
      },
      {
        name: "other",
        description: "Показатель степени (или основание для __rpow__).",
      },
      {
        name: "modulo",
        description:
          "Необязательный модуль для трёхаргументного pow(). По умолчанию None.",
      },
    ],
    example: `class BigInt:
    def __init__(self, value: int):
        self.v = value

    def __pow__(self, other, modulo=None):
        if not isinstance(other, (int, BigInt)):
            return NotImplemented
        exp = other.v if isinstance(other, BigInt) else other
        if modulo is not None:
            mod = modulo.v if isinstance(modulo, BigInt) else modulo
            return BigInt(pow(self.v, exp, mod))   # эффективно для RSA
        return BigInt(self.v ** exp)

    def __rpow__(self, other):
        if isinstance(other, int):
            return BigInt(other ** self.v)
        return NotImplemented

    def __ipow__(self, other):
        result = self.__pow__(other)
        if result is NotImplemented: return NotImplemented
        self.v = result.v
        return self

    def __repr__(self): return f"BigInt({self.v})"

a = BigInt(2)
print(a ** 10)             # BigInt(1024)
print(3 ** a)              # BigInt(9)   — __rpow__
print(pow(BigInt(2), 10, BigInt(1000)))  # BigInt(24)  — modular exp

a **= BigInt(3)
print(a)                   # BigInt(8)`,
  },
  {
    name: "__lshift__(self, other) / __rlshift__ / __ilshift__",
    description:
      "Реализует оператор побитового сдвига влево (<<). Для целых чисел a << n равносильно a * 2**n. __rlshift__ — отражение, __ilshift__ — составное присваивание (<<=). Широко используется для компоновки битовых флагов, формирования заголовков пакетов и DSL-стилей (e.g. Celery tasks).",
    syntax:
      "def __lshift__(self, other)\ndef __rlshift__(self, other)\ndef __ilshift__(self, other)",
    arguments: [
      {
        name: "self",
        description:
          "Левый операнд сдвига (__lshift__, __ilshift__) или правый (__rlshift__).",
      },
      { name: "other", description: "Количество позиций сдвига." },
    ],
    example: `class Bits:
    """Обёртка над int с удобным отображением битовой строки."""
    def __init__(self, value: int):
        self.v = int(value)

    def __lshift__(self, other):
        if isinstance(other, int):
            return Bits(self.v << other)
        return NotImplemented

    def __rlshift__(self, other):
        if isinstance(other, int):
            return Bits(other << self.v)
        return NotImplemented

    def __ilshift__(self, other):
        if isinstance(other, int):
            self.v <<= other
            return self
        return NotImplemented

    def __repr__(self):
        return f"Bits(0b{self.v:08b})"

b = Bits(0b0000_0001)
print(b << 3)    # Bits(0b00001000)  — сдвиг на 3 бита влево
print(1 << b)    # Bits(0b00000010)  — 1 << 1 (значение b = 1)

b <<= 4
print(b)         # Bits(0b00010000)`,
  },
  {
    name: "__rshift__(self, other) / __rrshift__ / __irshift__",
    description:
      "Реализует оператор побитового сдвига вправо (>>). Для целых чисел a >> n равносильно a // 2**n (арифметический сдвиг — знаковый бит сохраняется). __rrshift__ — отражение, __irshift__ — составное присваивание (>>=). Активно используется в DSL: например, оператор >> в Apache Airflow для цепочек задач.",
    syntax:
      "def __rshift__(self, other)\ndef __rrshift__(self, other)\ndef __irshift__(self, other)",
    arguments: [
      {
        name: "self",
        description:
          "Сдвигаемое значение (__rshift__, __irshift__) или величина сдвига (__rrshift__).",
      },
      { name: "other", description: "Количество позиций сдвига." },
    ],
    example: `class Pipeline:
    """DSL-цепочка шагов через оператор >>."""
    def __init__(self, *steps):
        self.steps = list(steps)

    def __rshift__(self, other):
        if callable(other):
            return Pipeline(*self.steps, other)
        if isinstance(other, Pipeline):
            return Pipeline(*self.steps, *other.steps)
        return NotImplemented

    def __call__(self, data):
        for step in self.steps:
            data = step(data)
        return data

double  = lambda x: x * 2
add_one = lambda x: x + 1
square  = lambda x: x ** 2

pipe = Pipeline(double) >> add_one >> square
print(pipe(3))    # ((3*2)+1)^2 = 49

# Битовый вариант
class Bits:
    def __init__(self, v: int): self.v = v
    def __rshift__(self, n):
        return Bits(self.v >> n) if isinstance(n, int) else NotImplemented
    def __repr__(self): return f"0b{self.v:08b}"

print(Bits(0b10000000) >> 3)   # 0b00010000`,
  },
  {
    name: "__and__(self, other) / __rand__ / __iand__",
    description:
      "Реализует побитовое И (&). Для целых чисел — побитовая операция; для множеств — пересечение (set & set). __rand__ — отражение, __iand__ — составное присваивание (&=). Также используется в ORM для объединения условий запросов (Django Q-объекты).",
    syntax:
      "def __and__(self, other)\ndef __rand__(self, other)\ndef __iand__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Левый операнд (__and__, __iand__) или правый (__rand__).",
      },
      { name: "other", description: "Второй операнд." },
    ],
    example: `class FlagSet:
    """Множество флагов с поддержкой битовых операций."""
    def __init__(self, flags: int):
        self.flags = flags

    def __and__(self, other):
        if isinstance(other, FlagSet):
            return FlagSet(self.flags & other.flags)
        if isinstance(other, int):
            return FlagSet(self.flags & other)
        return NotImplemented

    def __rand__(self, other):
        return self.__and__(other)

    def __iand__(self, other):
        if isinstance(other, (FlagSet, int)):
            val = other.flags if isinstance(other, FlagSet) else other
            self.flags &= val
            return self
        return NotImplemented

    def has(self, flag: int) -> bool:
        return bool(self.flags & flag)

    def __repr__(self): return f"FlagSet(0b{self.flags:08b})"

READ    = 0b001
WRITE   = 0b010
EXECUTE = 0b100

perms = FlagSet(READ | WRITE | EXECUTE)   # 0b111
mask  = FlagSet(READ | WRITE)             # 0b011

print(perms & mask)         # FlagSet(0b00000011)
print(perms.has(EXECUTE))   # True
perms &= FlagSet(READ)
print(perms)                # FlagSet(0b00000001)`,
  },
  {
    name: "__xor__(self, other) / __rxor__ / __ixor__",
    description:
      "Реализует побитовое исключающее ИЛИ (^). Для множеств — симметрическая разность. __rxor__ — отражение, __ixor__ — составное присваивание (^=). Полезен для переключения флагов (toggle), простого шифрования XOR и нахождения различающихся элементов.",
    syntax:
      "def __xor__(self, other)\ndef __rxor__(self, other)\ndef __ixor__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Левый операнд (__xor__, __ixor__) или правый (__rxor__).",
      },
      { name: "other", description: "Второй операнд." },
    ],
    example: `class TagSet:
    """Набор тегов; XOR даёт теги, которые есть только у одного из наборов."""
    def __init__(self, *tags):
        self._tags = set(tags)

    def __xor__(self, other):
        if isinstance(other, TagSet):
            return TagSet(*self._tags.symmetric_difference(other._tags))
        return NotImplemented

    def __rxor__(self, other): return self.__xor__(other)

    def __ixor__(self, other):
        if isinstance(other, TagSet):
            self._tags ^= other._tags
            return self
        return NotImplemented

    def __repr__(self): return f"TagSet({sorted(self._tags)})"

python  = TagSet('oop', 'dynamic', 'interpreted')
java    = TagSet('oop', 'static',  'compiled')

diff = python ^ java
print(diff)   # только уникальные теги: dynamic, interpreted, static, compiled

# Битовый toggle
flags = 0b1010
flags ^= 0b1111   # инвертировать все биты → 0b0101
print(f"0b{flags:04b}")   # 0b0101`,
  },
  {
    name: "__or__(self, other) / __ror__ / __ior__",
    description:
      "Реализует побитовое ИЛИ (|). Для множеств — объединение. Начиная с Python 3.9, dict поддерживает | для слияния словарей. __ror__ — отражение, __ior__ — составное присваивание (|=). Также используется в type hints (int | str вместо Union[int, str], Python 3.10+) и Django ORM для объединения Q-объектов.",
    syntax:
      "def __or__(self, other)\ndef __ror__(self, other)\ndef __ior__(self, other)",
    arguments: [
      {
        name: "self",
        description: "Левый операнд (__or__, __ior__) или правый (__ror__).",
      },
      { name: "other", description: "Второй операнд." },
    ],
    example: `class Config:
    """Конфигурация с поддержкой слияния через |."""
    def __init__(self, **kwargs):
        self._data = kwargs

    def __or__(self, other):
        if isinstance(other, Config):
            merged = {**self._data, **other._data}   # other перекрывает self
            return Config(**merged)
        if isinstance(other, dict):
            return Config(**{**self._data, **other})
        return NotImplemented

    def __ror__(self, other):
        if isinstance(other, dict):
            return Config(**{**other, **self._data})   # self перекрывает other
        return NotImplemented

    def __ior__(self, other):
        if isinstance(other, (Config, dict)):
            extra = other._data if isinstance(other, Config) else other
            self._data.update(extra)
            return self
        return NotImplemented

    def __repr__(self): return f"Config({self._data})"

base    = Config(host='localhost', port=5432, debug=False)
override = Config(port=5433, debug=True)

print(base | override)    # port=5433, debug=True — override побеждает
print({'host': '0.0.0.0'} | base)  # base перекрывает dict — __ror__

base |= Config(timeout=30)
print(base)               # добавлен timeout`,
  },

  // ─── Унарные операторы и преобразования типов ────────────────────────────
  {
    name: "__neg__(self)",
    description:
      "Реализует унарный минус (-obj). Вызывается при применении оператора отрицания к объекту. Должен вернуть новый объект того же или совместимого типа. Для неизменяемых объектов всегда создаёт новый экземпляр; для изменяемых — тоже рекомендуется возвращать новый.",
    syntax: "def __neg__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class Vec3:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

    def __neg__(self):
        return Vec3(-self.x, -self.y, -self.z)

    def __repr__(self):
        return f"Vec3({self.x}, {self.y}, {self.z})"

v = Vec3(1, -2, 3)
print(-v)    # Vec3(-1, 2, -3)

# Двойное отрицание восстанавливает исходный объект
print(-(-v))  # Vec3(1, -2, 3)

# Применение: разворот направления
velocity = Vec3(10, 5, 0)
reverse  = -velocity
print(reverse)   # Vec3(-10, -5, 0)`,
  },
  {
    name: "__pos__(self)",
    description:
      'Реализует унарный плюс (+obj). Обычно возвращает копию объекта без изменений, но может применять нормализацию или приведение типа. Например, +Decimal("-0") возвращает Decimal("0"). Редко переопределяется — чаще используется для явного документирования намерения.',
    syntax: "def __pos__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `from decimal import Decimal

# Стандартное поведение: +obj возвращает копию
class Temperature:
    def __init__(self, value: float, unit: str = 'C'):
        self.value = value
        self.unit  = unit

    def __pos__(self):
        # нормализуем: убираем отрицательный нуль
        return Temperature(self.value if self.value != 0 else 0.0, self.unit)

    def __neg__(self):
        return Temperature(-self.value, self.unit)

    def __repr__(self): return f"{self.value}°{self.unit}"

t = Temperature(-0.0)
print(+t)    # 0.0°C  — нормализовано
print(-t)    # 0.0°C  — тоже 0

# Decimal: + может изменять поведение
d = Decimal('-0')
print(d)     # -0
print(+d)    # 0  — унарный + применяет текущий контекст`,
  },
  {
    name: "__abs__(self)",
    description:
      "Реализует встроенную функцию abs(). Должен вернуть абсолютное значение объекта — неотрицательное число или объект того же типа. Для векторов abs() обычно возвращает длину (магнитуду), для комплексных — модуль.",
    syntax: "def __abs__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import math

class Vec2:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y

    def __abs__(self) -> float:
        return math.hypot(self.x, self.y)   # длина вектора

    def __neg__(self):
        return Vec2(-self.x, -self.y)

    def normalized(self):
        mag = abs(self)
        if mag == 0: raise ValueError("нулевой вектор")
        return Vec2(self.x / mag, self.y / mag)

    def __repr__(self): return f"Vec2({self.x}, {self.y})"

v = Vec2(3, 4)
print(abs(v))          # 5.0  — теорема Пифагора
print(v.normalized())  # Vec2(0.6, 0.8)

# Комплексные числа: |a + bi| = sqrt(a²+b²)
c = complex(3, 4)
print(abs(c))          # 5.0`,
  },
  {
    name: "__invert__(self)",
    description:
      "Реализует оператор побитового дополнения (~obj). Для целых чисел ~x = -(x+1). Часто используется для инвертирования битовых масок, флагов и булевых полей. Возвращает новый объект.",
    syntax: "def __invert__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class BitMask:
    def __init__(self, value: int, width: int = 8):
        self.value = value & ((1 << width) - 1)
        self.width = width

    def __invert__(self):
        mask = (1 << self.width) - 1
        return BitMask(self.value ^ mask, self.width)

    def __and__(self, other):
        if isinstance(other, BitMask):
            return BitMask(self.value & other.value, self.width)
        return NotImplemented

    def __repr__(self):
        return f"BitMask(0b{self.value:0{self.width}b})"

m = BitMask(0b11001010)
print(m)    # BitMask(0b11001010)
print(~m)   # BitMask(0b00110101)  — инвертированы все биты

# Применение маски для обнуления разрядов
data = BitMask(0b11111111)
keep = BitMask(0b00001111)  # оставить только младшие 4 бита
print(data & keep)          # BitMask(0b00001111)
print(data & ~keep)         # BitMask(0b11110000)`,
  },
  {
    name: "__complex__(self)",
    description:
      "Вызывается функцией complex(obj). Должен вернуть объект типа complex. Если не определён, Python пробует __float__, а затем __index__. Реализуйте для числоподобных объектов, которые имеют естественное комплексное представление.",
    syntax: "def __complex__(self) -> complex",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import math

class Polar:
    """Комплексное число в полярной форме: r * e^(iθ)."""
    def __init__(self, r: float, theta: float):
        self.r     = r
        self.theta = theta   # угол в радианах

    def __complex__(self) -> complex:
        return complex(
            self.r * math.cos(self.theta),
            self.r * math.sin(self.theta)
        )

    def __abs__(self) -> float:
        return self.r

    def __repr__(self):
        return f"Polar(r={self.r}, θ={math.degrees(self.theta):.1f}°)"

p = Polar(2, math.pi / 4)   # r=2, θ=45°
c = complex(p)
print(c)           # (1.4142...+1.4142...j)
print(abs(c))      # 2.0

# Используется при передаче в функции, ожидающие complex:
def phase(z: complex) -> float:
    return math.atan2(z.imag, z.real)

print(math.degrees(phase(complex(p))))   # 45.0`,
  },
  {
    name: "__int__(self)",
    description:
      "Вызывается функцией int(obj). Должен вернуть целое число. Если не определён, Python пробует __index__, затем __trunc__. Используется также при неявном приведении в некоторых C-расширениях. Для дробных типов обычно усекает дробную часть к нулю.",
    syntax: "def __int__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class FixedPoint:
    """Число с фиксированной точкой: хранится как int со сдвигом."""
    SCALE = 1000   # 3 знака после запятой

    def __init__(self, value: float):
        self._raw = round(value * self.SCALE)

    def __float__(self) -> float:
        return self._raw / self.SCALE

    def __int__(self) -> int:
        return self._raw // self.SCALE   # усечение к нулю

    def __repr__(self):
        return f"FixedPoint({self._raw / self.SCALE})"

fp = FixedPoint(3.7)
print(float(fp))    # 3.7
print(int(fp))      # 3   — усечение

fp2 = FixedPoint(-2.9)
print(int(fp2))     # -2  — усечение к нулю (не floor!)

# int() используется неявно в range, slice, форматировании:
values = [FixedPoint(1.5), FixedPoint(2.7)]
print([int(v) for v in values])   # [1, 2]`,
  },
  {
    name: "__float__(self)",
    description:
      "Вызывается функцией float(obj). Должен вернуть число типа float. Если не определён, Python пробует __index__. Используется при неявном приведении в операциях со смешанными типами, а также в math-функциях, которые принимают числоподобные объекты.",
    syntax: "def __float__(self) -> float",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class Fraction:
    def __init__(self, numerator: int, denominator: int):
        from math import gcd
        g = gcd(abs(numerator), abs(denominator))
        sign = -1 if denominator < 0 else 1
        self.n = sign * numerator   // g
        self.d = sign * denominator // g

    def __float__(self) -> float:
        return self.n / self.d

    def __int__(self) -> int:
        return int(float(self))

    def __repr__(self): return f"{self.n}/{self.d}"

half = Fraction(1, 2)
third = Fraction(1, 3)

print(float(half))    # 0.5
print(float(third))   # 0.3333...

import math
print(math.floor(float(Fraction(7, 3))))  # 2

# Неявное приведение в некоторых операциях:
print(f"половина = {half:.4f}")   # половина = 0.5000`,
  },
  {
    name: "__index__(self)",
    description:
      "Вызывается когда Python требует целое число без потери информации: индексирование (obj[i]), срезы (obj[a:b]), bin(), oct(), hex(), operator.index(). В отличие от __int__, __index__ гарантирует точное целое — не должен терять точность. Если определён, Python использует его и для int(), float(), complex().",
    syntax: "def __index__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `class Color:
    """Цвет как 24-битное целое (RGB)."""
    def __init__(self, r: int, g: int, b: int):
        self._value = ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)

    def __index__(self) -> int:
        return self._value

    def __repr__(self):
        r = (self._value >> 16) & 0xFF
        g = (self._value >>  8) & 0xFF
        b =  self._value        & 0xFF
        return f"Color(#{r:02X}{g:02X}{b:02X})"

red   = Color(255, 0, 0)
green = Color(0, 255, 0)

print(hex(red))    # 0xff0000  — через __index__
print(bin(green))  # 0b111111100000000

# Использование как индекс:
palette = ['black', 'white', 'red']
tiny    = Color(0, 0, 2)        # значение = 2
print(palette[tiny])            # 'red'  — __index__

# operator.index гарантирует целочисленность:
import operator
print(operator.index(red))      # 16711680`,
  },
  {
    name: "__round__(self[, n])",
    description:
      "Вызывается функцией round(obj) и round(obj, n). Параметр n — количество знаков после запятой (может быть отрицательным для округления до десятков, сотен и т.д.). Если n не передан — должен вернуть int; если передан — объект того же типа. Python использует «банковское округление» (round half to even).",
    syntax: "def __round__(self, n=None)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      {
        name: "n",
        description:
          "Количество знаков после запятой. None — округлить до целого.",
      },
    ],
    example: `class Money:
    def __init__(self, amount: float, currency: str = 'RUB'):
        self.amount   = amount
        self.currency = currency

    def __round__(self, n=None):
        if n is None:
            return int(round(self.amount))    # целое
        return Money(round(self.amount, n), self.currency)

    def __repr__(self): return f"Money({self.amount}, {self.currency!r})"

price = Money(19.567)

print(round(price))      # 20          — целое
print(round(price, 2))   # Money(19.57, 'RUB')
print(round(price, 1))   # Money(19.6, 'RUB')

# Отрицательный n — округление до десятков:
large = Money(1234.56)
print(round(large, -2))  # Money(1200.0, 'RUB')

# Банковское округление (round half to even):
print(round(0.5))    # 0
print(round(1.5))    # 2
print(round(2.5))    # 2`,
  },
  {
    name: "__trunc__(self)",
    description:
      "Вызывается функцией math.trunc(obj). Должен вернуть целое — значение, усечённое к нулю (отсечение дробной части). В отличие от int(), который также вызывает __trunc__ как запасной вариант, math.trunc() явно документирует намерение. Результат всегда между 0 и исходным числом (включительно) по направлению к нулю.",
    syntax: "def __trunc__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import math

class Fixed:
    """Число с фиксированной точкой."""
    def __init__(self, value: float):
        self._v = float(value)

    def __trunc__(self) -> int:
        return math.trunc(self._v)   # усечение к нулю

    def __floor__(self) -> int:
        return math.floor(self._v)   # вниз к -∞

    def __ceil__(self) -> int:
        return math.ceil(self._v)    # вверх к +∞

    def __repr__(self): return f"Fixed({self._v})"

pos = Fixed(3.7)
neg = Fixed(-3.7)

print(math.trunc(pos))   #  3  — к нулю
print(math.trunc(neg))   # -3  — к нулю (не -4!)

# Сравнение методов:
print(math.floor(neg))   # -4  — вниз
print(math.ceil(neg))    # -3  — вверх
print(math.trunc(neg))   # -3  — к нулю`,
  },
  {
    name: "__floor__(self)",
    description:
      "Вызывается функцией math.floor(obj). Должен вернуть наибольшее целое число, не превышающее значение объекта (округление вниз, к −∞). Отличается от __trunc__ для отрицательных чисел: math.floor(-2.3) = -3, math.trunc(-2.3) = -2.",
    syntax: "def __floor__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import math

class Rational:
    def __init__(self, numerator: int, denominator: int):
        self.n = numerator
        self.d = denominator

    def __float__(self) -> float:
        return self.n / self.d

    def __floor__(self) -> int:
        # Целочисленное деление с округлением к -∞
        q, r = divmod(self.n, self.d)
        return q   # divmod уже даёт floor-деление

    def __ceil__(self) -> int:
        q, r = divmod(self.n, self.d)
        return q if r == 0 else q + 1

    def __repr__(self): return f"{self.n}/{self.d}"

a = Rational(7, 3)    # 2.333...
b = Rational(-7, 3)   # -2.333...

print(math.floor(a))   #  2
print(math.floor(b))   # -3  — к -∞, не -2!

print(math.ceil(a))    #  3
print(math.ceil(b))    # -2`,
  },
  {
    name: "__ceil__(self)",
    description:
      "Вызывается функцией math.ceil(obj). Должен вернуть наименьшее целое число, не меньшее значения объекта (округление вверх, к +∞). Вместе с __floor__ и __trunc__ образует тройку методов округления для пользовательских числовых типов.",
    syntax: "def __ceil__(self) -> int",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import math
from dataclasses import dataclass

@dataclass
class Kilogram:
    """Масса в килограммах; при упаковке всегда округляем вверх."""
    value: float

    def __floor__(self) -> int:
        return math.floor(self.value)

    def __ceil__(self) -> int:
        return math.ceil(self.value)

    def __round__(self, n=None):
        return round(self.value, n)

    def __float__(self) -> float:
        return self.value

def shipping_boxes(cargo: Kilogram, box_kg: float) -> int:
    """Сколько ящиков нужно — всегда округляем вверх."""
    return math.ceil(float(cargo) / box_kg)

items = [Kilogram(2.1), Kilogram(3.0), Kilogram(0.9)]
total = Kilogram(sum(k.value for k in items))

print(math.ceil(total))          # 7   — нужно 7 кг с запасом
print(math.floor(total))         # 6   — строго вниз
print(shipping_boxes(total, 2))  # 3   — 3 ящика по 2 кг`,
  },

  // ─── Вызываемые объекты и контекстные менеджеры ──────────────────────────
  {
    name: "__call__(self, *args, **kwargs)",
    description:
      "Делает экземпляр класса вызываемым как функция: obj(). Вызывается при obj(*args, **kwargs). Позволяет создавать объекты с состоянием, ведущие себя как функции: каррирование, мемоизация, конфигурируемые предикаты, обработчики событий. Проверить вызываемость можно через callable(obj).",
    syntax: "def __call__(self, *args, **kwargs)",
    arguments: [
      { name: "self", description: "Экземпляр класса." },
      { name: "*args", description: "Позиционные аргументы вызова." },
      { name: "**kwargs", description: "Именованные аргументы вызова." },
    ],
    example: `class RateLimiter:
    """Вызываемый объект: пропускает вызов не чаще rate раз в секунду."""
    import time as _time

    def __init__(self, rate: float):
        self.interval  = 1.0 / rate
        self._last     = 0.0
        self._skipped  = 0

    def __call__(self, func, *args, **kwargs):
        import time
        now = time.monotonic()
        if now - self._last >= self.interval:
            self._last = now
            return func(*args, **kwargs)
        else:
            self._skipped += 1
            return None

    def stats(self): return f"пропущено вызовов: {self._skipped}"

limiter = RateLimiter(rate=2)   # не чаще 2 раз/сек

def greet(name): return f"Привет, {name}!"

import time
for _ in range(5):
    result = limiter(greet, "Аня")
    if result: print(result)
    time.sleep(0.3)

print(limiter.stats())
print(callable(limiter))   # True`,
  },
  {
    name: "__enter__(self)",
    description:
      "Вызывается при входе в блок with. Должен вернуть объект, который будет привязан к переменной after as (если она указана). Обычно возвращает self, но может вернуть другой объект-ресурс. Вместе с __exit__ реализует протокол контекстного менеджера.",
    syntax: "def __enter__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import time

class Timer:
    """Контекстный менеджер для замера времени блока кода."""
    def __enter__(self):
        self._start = time.perf_counter()
        return self   # привязывается к as-переменной

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self._start
        return False  # не подавляем исключения

    def __repr__(self):
        return f"Timer(elapsed={self.elapsed:.4f}s)"

with Timer() as t:
    total = sum(range(1_000_000))

print(t)          # Timer(elapsed=0.0312s)
print(total)      # 499999500000

# __enter__ может вернуть другой объект:
class ManagedFile:
    def __init__(self, path, mode='r'):
        self.path, self.mode = path, mode

    def __enter__(self):
        self._f = open(self.path, self.mode)
        return self._f   # возвращаем файловый объект, не self

    def __exit__(self, *args):
        self._f.close()
        return False`,
  },
  {
    name: "__exit__(self, exc_type, exc_val, traceback)",
    description:
      "Вызывается при выходе из блока with — независимо от того, произошло ли исключение. Если блок завершился нормально — все три аргумента равны None. Если возвращает истинное значение — исключение подавляется (не распространяется дальше). Обычно возвращает False или None, чтобы не скрывать ошибки.",
    syntax: "def __exit__(self, exc_type, exc_val, traceback) -> bool | None",
    arguments: [
      {
        name: "exc_type",
        description: "Тип исключения (класс) или None при нормальном выходе.",
      },
      { name: "exc_val", description: "Экземпляр исключения или None." },
      { name: "traceback", description: "Объект трассировки стека или None." },
    ],
    example: `class Transaction:
    """Контекстный менеджер для транзакций с откатом при ошибке."""
    def __init__(self, db):
        self.db = db

    def __enter__(self):
        self.db.begin()
        return self

    def __exit__(self, exc_type, exc_val, tb):
        if exc_type is None:
            self.db.commit()
            print("транзакция подтверждена")
        else:
            self.db.rollback()
            print(f"откат из-за: {exc_val}")
        return False   # исключение НЕ подавляется

# Избирательное подавление исключений:
class SuppressErrors:
    def __init__(self, *exc_types):
        self.exc_types = exc_types

    def __enter__(self): return self

    def __exit__(self, exc_type, exc_val, tb):
        if exc_type and issubclass(exc_type, self.exc_types):
            print(f"подавлено: {exc_val}")
            return True   # подавляем — выполнение продолжается
        return False

with SuppressErrors(ValueError, TypeError):
    int("не число")   # ValueError подавляется

print("продолжаем")   # выводится`,
  },

  // ─── Асинхронные контекстные менеджеры ───────────────────────────────────
  {
    name: "__aenter__(self)",
    description:
      "Асинхронный аналог __enter__. Вызывается при входе в блок async with. Должен быть корутиной (async def) и вернуть объект, привязываемый к as-переменной. Используется для асинхронных ресурсов: HTTP-сессии, соединения с БД, семафоры.",
    syntax: "async def __aenter__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import asyncio

class AsyncDB:
    """Имитация асинхронного соединения с базой данных."""
    def __init__(self, url: str):
        self.url  = url
        self.conn = None

    async def __aenter__(self):
        await asyncio.sleep(0.01)   # имитация подключения
        self.conn = f"conn:{self.url}"
        print(f"подключено: {self.conn}")
        return self   # self привяжется к as-переменной

    async def __aexit__(self, exc_type, exc_val, tb):
        await asyncio.sleep(0.005)  # имитация закрытия
        print(f"соединение закрыто: {self.conn}")
        self.conn = None
        return False

    async def query(self, sql: str):
        if not self.conn: raise RuntimeError("нет соединения")
        return f"результат({sql})"

async def main():
    async with AsyncDB("postgresql://localhost/mydb") as db:
        result = await db.query("SELECT 1")
        print(result)

asyncio.run(main())`,
  },
  {
    name: "__aexit__(self, exc_type, exc_val, traceback)",
    description:
      "Асинхронный аналог __exit__. Вызывается при выходе из блока async with — независимо от исключений. Должен быть корутиной (async def). Если возвращает True — исключение подавляется. Используется для освобождения асинхронных ресурсов: закрытия соединений, снятия блокировок.",
    syntax:
      "async def __aexit__(self, exc_type, exc_val, traceback) -> bool | None",
    arguments: [
      { name: "exc_type", description: "Тип исключения или None." },
      { name: "exc_val", description: "Экземпляр исключения или None." },
      { name: "traceback", description: "Трассировка стека или None." },
    ],
    example: `import asyncio

class AsyncLock:
    """Контекстный менеджер для asyncio.Lock с таймаутом."""
    def __init__(self, lock: asyncio.Lock, timeout: float = 5.0):
        self._lock    = lock
        self._timeout = timeout
        self._acquired = False

    async def __aenter__(self):
        try:
            await asyncio.wait_for(self._lock.acquire(), self._timeout)
            self._acquired = True
        except asyncio.TimeoutError:
            raise RuntimeError(f"не удалось захватить блокировку за {self._timeout}s")
        return self

    async def __aexit__(self, exc_type, exc_val, tb):
        if self._acquired:
            self._lock.release()
            self._acquired = False
        # Не подавляем исключения
        return False

async def critical_section(lock):
    async with AsyncLock(lock, timeout=2.0):
        await asyncio.sleep(0.1)
        print("в критической секции")

async def main():
    lock = asyncio.Lock()
    await asyncio.gather(critical_section(lock), critical_section(lock))

asyncio.run(main())`,
  },

  // ─── Асинхронные итераторы и awaitable ───────────────────────────────────
  {
    name: "__await__(self)",
    description:
      "Делает объект awaitable — его можно использовать с ключевым словом await. Должен вернуть итератор (обычно через yield from или return iter(...)). Большинству пользователей не нужно реализовывать __await__ напрямую — достаточно сделать метод корутиной (async def). Применяется при создании низкоуровневых future-подобных объектов.",
    syntax: "def __await__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import asyncio

class Awaitable:
    """Минимальный awaitable-объект, возвращающий значение."""
    def __init__(self, value):
        self.value = value

    def __await__(self):
        # Самый простой случай: нет реальной асинхронности, просто возвращаем значение
        yield   # передаём управление event loop хотя бы раз
        return self.value

class DelayedValue:
    """Awaitable с реальной задержкой."""
    def __init__(self, value, delay: float):
        self.value = value
        self.delay = delay

    def __await__(self):
        return self._run().__await__()

    async def _run(self):
        await asyncio.sleep(self.delay)
        return self.value

async def main():
    a = await Awaitable(42)
    print(a)    # 42

    b = await DelayedValue("готово", delay=0.1)
    print(b)    # готово

asyncio.run(main())`,
  },
  {
    name: "__aiter__(self)",
    description:
      "Вызывается функцией aiter() и при входе в цикл async for. Должен вернуть асинхронный итератор — объект с методом __anext__. Аналог __iter__ для асинхронного кода. Асинхронная итерация используется когда получение каждого элемента требует ожидания ввода-вывода.",
    syntax: "def __aiter__(self)",
    arguments: [{ name: "self", description: "Экземпляр класса." }],
    example: `import asyncio

class AsyncRange:
    """Асинхронный диапазон с задержкой между элементами."""
    def __init__(self, stop: int, delay: float = 0.1):
        self.stop  = stop
        self.delay = delay

    def __aiter__(self):
        self._current = 0
        return self   # объект сам является итератором

    async def __anext__(self) -> int:
        if self._current >= self.stop:
            raise StopAsyncIteration
        await asyncio.sleep(self.delay)
        value = self._current
        self._current += 1
        return value

async def main():
    async for n in AsyncRange(5, delay=0.05):
        print(n, end=' ')
    # 0 1 2 3 4

    # Используется в async comprehension:
    squares = [n ** 2 async for n in AsyncRange(4, delay=0.01)]
    print(squares)   # [0, 1, 4, 9]

asyncio.run(main())`,
  },
  {
    name: "__anext__(self)",
    description:
      "Вызывается функцией anext() для получения следующего элемента асинхронного итератора. Должен быть корутиной (async def). Когда элементы исчерпаны — вызывает StopAsyncIteration. Аналог __next__ для асинхронного кода.",
    syntax: "async def __anext__(self)",
    arguments: [
      { name: "self", description: "Объект асинхронного итератора." },
    ],
    example: `import asyncio
import aiohttp   # pip install aiohttp (для примера)

class PageIterator:
    """Асинхронный итератор по страницам API."""
    def __init__(self, base_url: str, total_pages: int):
        self.base_url    = base_url
        self.total_pages = total_pages
        self._page       = 1

    def __aiter__(self): return self

    async def __anext__(self):
        if self._page > self.total_pages:
            raise StopAsyncIteration

        # Имитация HTTP-запроса
        await asyncio.sleep(0.05)
        data = {
            'page':  self._page,
            'items': [f"item_{self._page}_{i}" for i in range(3)]
        }
        self._page += 1
        return data

async def main():
    pages = PageIterator("https://api.example.com/items", total_pages=3)

    async for page in pages:
        print(f"Страница {page['page']}: {page['items']}")

    # Получить одну страницу явно:
    it = PageIterator("https://api.example.com/items", total_pages=2)
    first = await anext(it)
    print("первая:", first['page'])

asyncio.run(main())`,
  },
  {
    name: "__init_subclass__(cls)",
    description:
      "Хук, вызываемый автоматически при создании подкласса. Позволяет родительскому классу реагировать на наследование — регистрировать подклассы, проверять параметры, применять декораторы и т.д. Принимает именованные аргументы, переданные при объявлении класса через ключевые слова.",
    syntax:
      "def __init_subclass__(cls, **kwargs):\n    super().__init_subclass__(**kwargs)",
    arguments: [
      {
        name: "cls",
        description: "Создаваемый подкласс (не экземпляр, а сам класс).",
      },
      {
        name: "**kwargs",
        description:
          "Именованные аргументы, указанные в строке class MyChild(Parent, key=value).",
      },
    ],
    example: `class PluginBase:
    _registry = {}

    def __init_subclass__(cls, plugin_name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        if plugin_name:
            PluginBase._registry[plugin_name] = cls
        print(f"Зарегистрирован подкласс: {cls.__name__}")

class AudioPlugin(PluginBase, plugin_name='audio'):
    pass
# Зарегистрирован подкласс: AudioPlugin

class VideoPlugin(PluginBase, plugin_name='video'):
    pass
# Зарегистрирован подкласс: VideoPlugin

print(PluginBase._registry)
# {'audio': <class 'AudioPlugin'>, 'video': <class 'VideoPlugin'>}`,
  },
  {
    name: "__class_getitem__(cls, item)",
    description:
      "Позволяет использовать синтаксис обобщённых типов Class[param] без метакласса. Вызывается при обращении к классу через квадратные скобки (например, list[int], Optional[str]). Используется для создания дженерик-классов, совместимых с системой аннотаций типов.",
    syntax:
      "def __class_getitem__(cls, item):\n    return GenericAlias(cls, item)",
    arguments: [
      {
        name: "cls",
        description: "Класс, к которому применяется оператор [].",
      },
      {
        name: "item",
        description:
          "Аргумент типа, переданный в квадратных скобках (может быть кортежем для нескольких параметров).",
      },
    ],
    example: `class Stack:
    def __init__(self):
        self._items = []

    def __class_getitem__(cls, item):
        return f"{cls.__name__}[{item.__name__}]"

    def push(self, item):
        self._items.append(item)

print(Stack[int])     # Stack[int]
print(Stack[str])     # Stack[str]

# Стандартные примеры из Python:
print(list[int])      # list[int]
print(dict[str, int]) # dict[str, int]`,
  },
  {
    name: "__mro_entries__(self, bases)",
    description:
      "Вызывается при использовании объекта в списке базовых классов нового класса. Позволяет объектам, не являющимся классами, участвовать в наследовании — возвращая кортеж реальных базовых классов, которые должны быть подставлены вместо данного объекта в MRO.",
    syntax: "def __mro_entries__(self, bases):\n    return (RealBaseClass,)",
    arguments: [
      {
        name: "bases",
        description:
          "Полный кортеж баз, переданных при объявлении нового класса (контекст для принятия решения).",
      },
    ],
    example: `class ClassDecorator:
    def __init__(self, mixin_cls):
        self.mixin_cls = mixin_cls

    def __mro_entries__(self, bases):
        return (self.mixin_cls,)

class LogMixin:
    def log(self, msg):
        print(f"[LOG] {msg}")

log_decorator = ClassDecorator(LogMixin)

class MyService(log_decorator):
    def run(self):
        self.log("Сервис запущен")

svc = MyService()
svc.run()  # [LOG] Сервис запущен
print(MyService.__mro__)
# (<class 'MyService'>, <class 'LogMixin'>, <class 'object'>)`,
  },
  {
    name: "__instancecheck__(self, instance)",
    description:
      "Определяет поведение функции isinstance(obj, cls). Метод вызывается на метаклассе — позволяет создавать виртуальные подклассы и нестандартную проверку принадлежности к типу. Используется в ABC (Abstract Base Classes) для регистрации внешних классов.",
    syntax:
      "class Meta(type):\n    def __instancecheck__(cls, instance):\n        return bool(...)",
    arguments: [
      {
        name: "self",
        description:
          "Класс (второй аргумент isinstance()), у чьего метакласса вызывается метод.",
      },
      {
        name: "instance",
        description: "Объект, принадлежность которого к классу проверяется.",
      },
    ],
    example: `class NumberMeta(type):
    def __instancecheck__(cls, instance):
        try:
            float(instance)
            return True
        except (TypeError, ValueError):
            return False

class Number(metaclass=NumberMeta):
    pass

print(isinstance(42, Number))       # True
print(isinstance(3.14, Number))     # True
print(isinstance("2.5", Number))    # True  (строка-число!)
print(isinstance("hello", Number))  # False
print(isinstance([1, 2], Number))   # False`,
  },
  {
    name: "__subclasscheck__(self, subclass)",
    description:
      "Определяет поведение функции issubclass(cls, parent). Вызывается на метаклассе родительского класса. Позволяет переопределить логику проверки иерархии классов — например, считать класс подклассом при наличии определённых методов (структурная типизация).",
    syntax:
      "class Meta(type):\n    def __subclasscheck__(cls, subclass):\n        return bool(...)",
    arguments: [
      {
        name: "self",
        description:
          "Родительский класс (второй аргумент issubclass()), у чьего метакласса вызывается метод.",
      },
      {
        name: "subclass",
        description: "Класс, проверяемый на принадлежность к иерархии.",
      },
    ],
    example: `class InterfaceMeta(type):
    def __subclasscheck__(cls, subclass):
        required = getattr(cls, '_required_methods', [])
        return all(callable(getattr(subclass, m, None)) for m in required)

class Drawable(metaclass=InterfaceMeta):
    _required_methods = ['draw', 'resize']

class Circle:
    def draw(self): pass
    def resize(self): pass

class Square:
    def draw(self): pass  # resize отсутствует!

print(issubclass(Circle, Drawable))  # True
print(issubclass(Square, Drawable))  # False`,
  },
  {
    name: "__getstate__(self)",
    description:
      "Вызывается при сериализации объекта через pickle. Должен вернуть словарь (или любой picklable объект), представляющий состояние объекта. Используется для исключения непикуемых атрибутов (сокетов, файловых дескрипторов) или для уменьшения размера сериализованных данных.",
    syntax: "def __getstate__(self):\n    return {...}",
    arguments: [],
    example: `import pickle

class DatabaseConnection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self._connection = None  # непикуемый объект

    def connect(self):
        self._connection = f"conn://{self.host}:{self.port}"

    def __getstate__(self):
        state = self.__dict__.copy()
        state['_connection'] = None  # убираем непикуемое
        return state

conn = DatabaseConnection('localhost', 5432)
conn.connect()
print(conn._connection)  # conn://localhost:5432

restored = pickle.loads(pickle.dumps(conn))
print(restored._connection)  # None
print(restored.host)         # localhost`,
  },
  {
    name: "__setstate__(self, state)",
    description:
      "Вызывается при десериализации объекта через pickle. Получает состояние, возвращённое __getstate__, и должен восстановить объект. Если определён __getstate__, как правило нужно определить и __setstate__ для правильного восстановления.",
    syntax: "def __setstate__(self, state):\n    self.__dict__.update(state)",
    arguments: [
      {
        name: "state",
        description:
          "Объект состояния, возвращённый __getstate__ при сериализации.",
      },
    ],
    example: `import pickle

class CachedData:
    def __init__(self, data):
        self.data = data
        self._cache = {}

    def __getstate__(self):
        return {'data': self.data}  # кэш не сохраняем

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._cache = {}  # пересоздаём кэш как пустой
        print("Объект восстановлен, кэш сброшен")

    def get(self, key):
        if key not in self._cache:
            self._cache[key] = self.data.get(key)
        return self._cache[key]

obj = CachedData({'a': 1, 'b': 2})
obj.get('a')

restored = pickle.loads(pickle.dumps(obj))
# Объект восстановлен, кэш сброшен
print(restored._cache)  # {}`,
  },
  {
    name: "__reduce__(self)",
    description:
      "Определяет, как объект сериализуется через pickle. Должен вернуть кортеж (callable, args) или кортеж из 2–6 элементов, описывающих способ воссоздания объекта. Используется для поддержки сериализации объектов с нестандартной инициализацией.",
    syntax: "def __reduce__(self):\n    return (cls, (arg1, arg2))",
    arguments: [],
    example: `import pickle

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __reduce__(self):
        # Возвращаем (конструктор, аргументы_конструктора)
        return (Point, (self.x, self.y))

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

p = Point(3, 7)
restored = pickle.loads(pickle.dumps(p))

print(restored)   # Point(3, 7)
print(restored.x) # 3
print(restored.y) # 7

# Полная форма кортежа:
# (callable, args, state, list_items, dict_items, state_setter)`,
  },
  {
    name: "__reduce_ex__(self, protocol)",
    description:
      "Расширенная версия __reduce__ с доступом к версии протокола pickle. Вызывается вместо __reduce__, если оба определены. Позволяет возвращать разные представления объекта в зависимости от версии протокола (0–5). По умолчанию делегирует к __reduce__.",
    syntax: "def __reduce_ex__(self, protocol):\n    return (cls, (args,))",
    arguments: [
      {
        name: "protocol",
        description:
          "Версия протокола pickle (0–5). Более высокие версии эффективнее, но несовместимы со старыми Python.",
      },
    ],
    example: `import pickle

class VersionedObject:
    def __init__(self, data):
        self.data = data

    def __reduce_ex__(self, protocol):
        print(f"Сериализация с протоколом {protocol}")
        if protocol >= 4:
            return (self.__class__, (self.data,))
        else:
            return (self.__class__, ({'data': self.data},))

    def __repr__(self):
        return f"VersionedObject({self.data!r})"

obj = VersionedObject([1, 2, 3])

pickle.dumps(obj, protocol=2)  # Сериализация с протоколом 2
pickle.dumps(obj, protocol=5)  # Сериализация с протоколом 5`,
  },
  {
    name: "__match_args__",
    description:
      "Атрибут класса — кортеж строк с именами атрибутов, используемых при позиционном сопоставлении в операторе match/case. Определяет порядок, в котором позиционные аргументы паттерна сопоставляются с атрибутами объекта. Автоматически создаётся в датаклассах.",
    syntax: 'class MyClass:\n    __match_args__ = ("attr1", "attr2")',
    arguments: [],
    example: `class Point:
    __match_args__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y

def describe(point):
    match point:
        case Point(0, 0):
            return "Начало координат"
        case Point(x, 0):
            return f"На оси X: x={x}"
        case Point(0, y):
            return f"На оси Y: y={y}"
        case Point(x, y):
            return f"Точка ({x}, {y})"

print(describe(Point(0, 0)))  # Начало координат
print(describe(Point(5, 0)))  # На оси X: x=5
print(describe(Point(0, 3)))  # На оси Y: y=3
print(describe(Point(2, 4)))  # Точка (2, 4)

# В датаклассах создаётся автоматически:
from dataclasses import dataclass

@dataclass
class Color:
    r: int
    g: int
    b: int
# Color.__match_args__ == ('r', 'g', 'b')`,
  },
  {
    name: "array.append(x)",
    description:
      "Добавляет новый элемент x в конец массива. Тип элемента должен совпадать с типом массива — иначе возникает TypeError. Аналогично list.append(), но работает только с однотипными данными, заданными при создании массива.",
    syntax: "array.append(x)",
    arguments: [
      {
        name: "x",
        description:
          "Элемент, добавляемый в конец массива. Должен соответствовать типу массива (typecode).",
      },
    ],
    example: `import array

arr = array.array('i', [1, 2, 3])  # массив целых чисел
arr.append(4)
print(arr)  # array('i', [1, 2, 3, 4])

arr.append(5)
print(arr)  # array('i', [1, 2, 3, 4, 5])

# TypeError при несовпадении типа:
# arr.append(3.14)  # ошибка — массив хранит только int`,
  },
  {
    name: "array.buffer_info()",

    description:
      "Возвращает кортеж (address, length) — адрес начала внутреннего буфера данных в памяти и количество элементов в массиве. Используется для низкоуровневой работы с памятью, передачи массива в C-расширения или системные вызовы.",
    syntax: "array.buffer_info()",
    arguments: [],
    example: `import array

arr = array.array('i', [10, 20, 30, 40])
addr, length = arr.buffer_info()

print(f"Адрес в памяти: {addr}")   # например: 140234567890
print(f"Количество элементов: {length}")  # 4

# Размер в байтах = length * itemsize
print(f"Размер буфера: {length * arr.itemsize} байт")  # 16 байт (4 * 4)`,
  },
  {
    name: "array.byteswap()",

    description:
      "Меняет порядок байт у каждого элемента массива на обратный (big-endian ↔ little-endian). Используется при обмене бинарными данными между системами с разным порядком байт. Работает только с массивами числовых типов.",
    syntax: "array.byteswap()",
    arguments: [],
    example: `import array

arr = array.array('i', [1, 256, 65536])
print(arr)  # array('i', [1, 256, 65536])

arr.byteswap()
print(arr)  # байты каждого элемента перевёрнуты
# array('i', [16777216, 65536, 256])

# Двойной вызов возвращает исходный порядок:
arr.byteswap()
print(arr)  # array('i', [1, 256, 65536])`,
  },
  {
    name: "array.count(x)",

    description:
      "Возвращает количество вхождений элемента x в массиве. Аналогично list.count(). Сравнение выполняется по значению с учётом типа массива.",
    syntax: "array.count(x)",
    arguments: [
      {
        name: "x",
        description: "Элемент, количество вхождений которого нужно найти.",
      },
    ],
    example: `import array

arr = array.array('i', [1, 2, 3, 2, 4, 2, 5])
print(arr.count(2))  # 3
print(arr.count(1))  # 1
print(arr.count(9))  # 0

# С числами с плавающей точкой:
farr = array.array('f', [1.5, 2.5, 1.5, 3.5])
print(farr.count(1.5))  # 2`,
  },
  {
    name: "array.extend(iterable)",

    description:
      "Добавляет все элементы итерируемого объекта в конец массива. Итерируемый объект должен содержать элементы подходящего типа. Аналог list.extend(), но с контролем типов.",
    syntax: "array.extend(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект (список, кортеж, другой array и т.д.) с элементами совместимого типа.",
      },
    ],
    example: `import array

arr = array.array('i', [1, 2, 3])

# Расширение списком
arr.extend([4, 5, 6])
print(arr)  # array('i', [1, 2, 3, 4, 5, 6])

# Расширение другим массивом
arr2 = array.array('i', [7, 8, 9])
arr.extend(arr2)
print(arr)  # array('i', [1, 2, 3, 4, 5, 6, 7, 8, 9])

# Расширение генератором
arr.extend(x * 2 for x in range(3))
print(arr)  # ... 0, 2, 4 в конце`,
  },
  {
    name: "array.frombytes(s)",

    description:
      "Добавляет элементы из байтовой строки s в конец массива. Байты интерпретируются как элементы нужного типа согласно typecode массива. Длина s должна быть кратна itemsize массива.",
    syntax: "array.frombytes(s)",
    arguments: [
      {
        name: "s",
        description:
          "Байтовая строка (bytes или bytes-like object), из которой читаются данные.",
      },
    ],
    example: `import array

arr = array.array('i')  # пустой массив целых чисел

# 4 байта = один int (little-endian)
arr.frombytes(b'\\x01\\x00\\x00\\x00')
print(arr)  # array('i', [1])

# Несколько элементов сразу
arr.frombytes(b'\\x02\\x00\\x00\\x00\\x03\\x00\\x00\\x00')
print(arr)  # array('i', [1, 2, 3])

# Обратная операция:
data = arr.tobytes()
print(data)  # байтовое представление массива`,
  },
  {
    name: "array.fromfile(f, n)",

    description:
      'Читает ровно n элементов из файлового объекта f и добавляет их в конец массива. Читает двоичные данные — файл должен быть открыт в режиме "rb". Если данных недостаточно, возникает EOFError, но уже прочитанные элементы остаются в массиве.',
    syntax: "array.fromfile(f, n)",
    arguments: [
      {
        name: "f",
        description: 'Файловый объект, открытый в бинарном режиме ("rb").',
      },
      { name: "n", description: "Количество элементов для чтения." },
    ],
    example: `import array

# Запись массива в файл
arr = array.array('i', [10, 20, 30, 40, 50])
with open('data.bin', 'wb') as f:
    arr.tofile(f)

# Чтение обратно
arr2 = array.array('i')
with open('data.bin', 'rb') as f:
    arr2.fromfile(f, 3)  # читаем только 3 элемента

print(arr2)  # array('i', [10, 20, 30])`,
  },
  {
    name: "array.fromlist(list)",

    description:
      "Добавляет все элементы списка в конец массива. Аналогично extend(), но принимает только список. Если хотя бы один элемент имеет несовместимый тип — возникает TypeError и массив не изменяется (атомарная операция).",
    syntax: "array.fromlist(list)",
    arguments: [
      {
        name: "list",
        description: "Список элементов совместимого с массивом типа.",
      },
    ],
    example: `import array

arr = array.array('i', [1, 2, 3])
arr.fromlist([4, 5, 6])
print(arr)  # array('i', [1, 2, 3, 4, 5, 6])

# Атомарность: если в списке есть невалидный элемент,
# массив остаётся неизменным:
try:
    arr.fromlist([7, 8, 'плохой'])  # TypeError
except TypeError:
    pass
print(arr)  # array('i', [1, 2, 3, 4, 5, 6]) — не изменился`,
  },
  {
    name: "array.fromunicode(s)",

    description:
      'Добавляет символы строки Unicode в конец массива. Метод применим только к массивам с typecode "u" (Unicode-символы). В Python 3.3+ тип "u" устарел — вместо него рекомендуется использовать str.',
    syntax: "array.fromunicode(s)",
    arguments: [
      {
        name: "s",
        description: "Строка Unicode, символы которой добавляются в массив.",
      },
    ],
    example: `import array

# Массив Unicode-символов (typecode 'u' — устаревший)
arr = array.array('u', 'Hello')
arr.fromunicode(', World')
print(arr.tounicode())  # Hello, World

# Современная альтернатива — использовать str напрямую:
text = 'Hello'
text += ', World'
print(text)  # Hello, World`,
  },
  {
    name: "array.index(x[, start[, stop]])",

    description:
      "Возвращает индекс первого вхождения элемента x в массиве. Если элемент не найден — возникает ValueError. Необязательные параметры start и stop ограничивают диапазон поиска (как в list.index()).",
    syntax: "array.index(x[, start[, stop]])",
    arguments: [
      { name: "x", description: "Искомый элемент." },
      {
        name: "start",
        description:
          "Начальный индекс диапазона поиска (включительно). По умолчанию 0.",
      },
      {
        name: "stop",
        description:
          "Конечный индекс диапазона поиска (не включается). По умолчанию конец массива.",
      },
    ],
    example: `import array

arr = array.array('i', [10, 20, 30, 20, 40, 20])

print(arr.index(20))      # 1 — первое вхождение
print(arr.index(20, 2))   # 3 — поиск начиная с индекса 2
print(arr.index(20, 4))   # 5 — поиск начиная с индекса 4

try:
    arr.index(99)
except ValueError as e:
    print(e)  # array.index(x): x not in array`,
  },
  {
    name: "array.insert(i, x)",

    description:
      "Вставляет элемент x перед элементом с индексом i. Отрицательные индексы отсчитываются с конца. Если i больше длины массива — элемент добавляется в конец. Сдвигает все элементы правее позиции вставки.",
    syntax: "array.insert(i, x)",
    arguments: [
      {
        name: "i",
        description:
          "Индекс позиции, перед которой вставляется элемент. Допускаются отрицательные значения.",
      },
      {
        name: "x",
        description: "Вставляемый элемент совместимого с массивом типа.",
      },
    ],
    example: `import array

arr = array.array('i', [1, 2, 3, 4, 5])

arr.insert(2, 99)    # вставляем 99 перед индексом 2
print(arr)  # array('i', [1, 2, 99, 3, 4, 5])

arr.insert(0, 0)     # вставка в начало
print(arr)  # array('i', [0, 1, 2, 99, 3, 4, 5])

arr.insert(-1, 88)   # перед последним элементом
print(arr)  # array('i', [0, 1, 2, 99, 3, 4, 88, 5])`,
  },
  {
    name: "array.pop([i])",

    description:
      "Удаляет и возвращает элемент с индексом i. По умолчанию удаляет последний элемент (i = -1). Отрицательные индексы отсчитываются с конца. Если массив пуст или индекс выходит за границы — возникает IndexError.",
    syntax: "array.pop([i])",
    arguments: [
      {
        name: "i",
        description:
          "Индекс удаляемого элемента. По умолчанию -1 (последний элемент). Допускаются отрицательные значения.",
      },
    ],
    example: `import array

arr = array.array('i', [10, 20, 30, 40, 50])

last = arr.pop()       # удаляем последний
print(last)  # 50
print(arr)   # array('i', [10, 20, 30, 40])

first = arr.pop(0)     # удаляем первый
print(first)  # 10
print(arr)    # array('i', [20, 30, 40])

middle = arr.pop(1)    # удаляем по индексу
print(middle)  # 30
print(arr)     # array('i', [20, 40])`,
  },
  {
    name: "array.remove(x)",

    description:
      "Удаляет первое вхождение элемента x из массива. Если элемент не найден — возникает ValueError. В отличие от pop(), не возвращает удалённый элемент и принимает значение, а не индекс.",
    syntax: "array.remove(x)",
    arguments: [
      {
        name: "x",
        description:
          "Значение элемента, который нужно удалить (первое вхождение).",
      },
    ],
    example: `import array

arr = array.array('i', [1, 2, 3, 2, 4, 2])

arr.remove(2)    # удаляем первое вхождение 2
print(arr)  # array('i', [1, 3, 2, 4, 2])

arr.remove(2)    # снова — удаляем следующее вхождение
print(arr)  # array('i', [1, 3, 4, 2])

try:
    arr.remove(99)
except ValueError as e:
    print(e)  # array.remove(x): x not in array`,
  },
  {
    name: "array.reverse()",

    description:
      "Переворачивает порядок элементов массива на месте (in-place). Изменяет сам массив и возвращает None. Аналогично list.reverse() — не создаёт новый объект.",
    syntax: "array.reverse()",
    arguments: [],
    example: `import array

arr = array.array('i', [1, 2, 3, 4, 5])
arr.reverse()
print(arr)  # array('i', [5, 4, 3, 2, 1])

# С числами с плавающей точкой:
farr = array.array('f', [1.1, 2.2, 3.3])
farr.reverse()
print(farr)  # array('f', [3.3, 2.2, 1.1])

# Возвращает None:
result = arr.reverse()
print(result)  # None`,
  },
  {
    name: "array.tobytes()",

    description:
      "Возвращает байтовое представление массива в виде объекта bytes. Каждый элемент кодируется согласно typecode и порядку байт платформы. Обратная операция — frombytes(). Используется для сохранения, передачи по сети или работы с бинарными протоколами.",
    syntax: "array.tobytes()",
    arguments: [],
    example: `import array

arr = array.array('i', [1, 2, 3])
data = arr.tobytes()
print(data)   # b'\\x01\\x00\\x00\\x00\\x02\\x00\\x00\\x00\\x03\\x00\\x00\\x00'
print(type(data))  # <class 'bytes'>

# Размер = количество элементов × itemsize
print(len(data))  # 12  (3 элемента × 4 байта)

# Восстановление массива из байтов:
arr2 = array.array('i')
arr2.frombytes(data)
print(arr2)  # array('i', [1, 2, 3])`,
  },
  {
    name: "array.tofile(f)",

    description:
      'Записывает все элементы массива в файловый объект f в бинарном формате. Файл должен быть открыт в режиме "wb". Обратная операция — fromfile(). Эффективнее, чем запись каждого элемента по отдельности.',
    syntax: "array.tofile(f)",
    arguments: [
      {
        name: "f",
        description: 'Файловый объект, открытый в бинарном режиме ("wb").',
      },
    ],
    example: `import array

arr = array.array('d', [1.5, 2.5, 3.5, 4.5])

# Запись в файл
with open('numbers.bin', 'wb') as f:
    arr.tofile(f)

# Чтение обратно
arr2 = array.array('d')
with open('numbers.bin', 'rb') as f:
    arr2.fromfile(f, 4)  # читаем 4 элемента

print(arr2)  # array('d', [1.5, 2.5, 3.5, 4.5])
print(arr == arr2)  # True`,
  },
  {
    name: "array.tolist()",

    description:
      "Преобразует массив в обычный список Python. Элементы преобразуются в соответствующие типы Python (int, float и т.д.). Обратная операция — fromlist(). Используется, когда нужна гибкость list вместо строготипизированного array.",
    syntax: "array.tolist()",
    arguments: [],
    example: `import array

arr = array.array('i', [10, 20, 30, 40])
lst = arr.tolist()

print(lst)        # [10, 20, 30, 40]
print(type(lst))  # <class 'list'>
print(type(lst[0]))  # <class 'int'>

# С float:
farr = array.array('f', [1.1, 2.2, 3.3])
flst = farr.tolist()
print(flst)  # [1.100000023841858, 2.200000047683716, 3.299999952316284]
# Небольшая погрешность из-за float32 → float64`,
  },
  {
    name: "array.tounicode()",

    description:
      'Преобразует массив Unicode-символов (typecode "u") в строку Python. Применим только к массивам с typecode "u". В Python 3.3+ тип "u" устарел — рекомендуется использовать str напрямую. Обратная операция — fromunicode().',
    syntax: "array.tounicode()",
    arguments: [],
    example: `import array

arr = array.array('u', 'Привет')
arr.fromunicode(', мир!')

text = arr.tounicode()
print(text)        # Привет, мир!
print(type(text))  # <class 'str'>

# Современная альтернатива (без устаревшего 'u'):
words = ['Привет', ', мир!']
text = ''.join(words)
print(text)  # Привет, мир!`,
  },
  {
    name: "array.typecode",

    description:
      'Атрибут (не метод) — односимвольная строка, указывающая тип элементов массива. Задаётся при создании и неизменен. Возможные значения: "b" (int8), "B" (uint8), "i" (int32), "I" (uint32), "f" (float32), "d" (float64) и другие.',
    syntax: "array.typecode",
    arguments: [],
    example: `import array

arr_int = array.array('i', [1, 2, 3])
arr_float = array.array('d', [1.0, 2.0])
arr_byte = array.array('b', [10, 20, 30])

print(arr_int.typecode)    # 'i'  — знаковый int (32 бит)
print(arr_float.typecode)  # 'd'  — double (64 бит)
print(arr_byte.typecode)   # 'b'  — знаковый byte (8 бит)

# Все доступные typecode:
# 'b','B' — signed/unsigned char
# 'h','H' — signed/unsigned short
# 'i','I' — signed/unsigned int
# 'l','L' — signed/unsigned long
# 'f'     — float
# 'd'     — double`,
  },
  {
    name: "array.itemsize",

    description:
      "Атрибут (не метод) — размер одного элемента массива в байтах. Зависит от typecode и платформы. Позволяет вычислить общий размер массива в памяти: itemsize × len(array). Полезен при низкоуровневой работе с бинарными данными.",
    syntax: "array.itemsize",
    arguments: [],
    example: `import array

arr_b = array.array('b', [1, 2, 3])  # 1 байт на элемент
arr_i = array.array('i', [1, 2, 3])  # 4 байта на элемент
arr_d = array.array('d', [1.0, 2.0]) # 8 байт на элемент

print(arr_b.itemsize)  # 1
print(arr_i.itemsize)  # 4
print(arr_d.itemsize)  # 8

# Общий размер в байтах:
print(len(arr_i) * arr_i.itemsize)  # 12  (3 × 4)

# Сравнение с bytes:
data = arr_i.tobytes()
print(len(data))  # 12 — совпадает`,
  },
  {
    name: "queue.qsize()",

    description:
      "Возвращает приблизительное количество элементов в очереди. Результат не гарантированно точен в многопоточной среде — между вызовом qsize() и следующей операцией другой поток может добавить или извлечь элементы. Применим ко всем классам: Queue, LifoQueue, PriorityQueue, SimpleQueue.",
    syntax: "queue.qsize()",
    arguments: [],
    example: `import queue

q = queue.Queue()
q.put('a')
q.put('b')
q.put('c')

print(q.qsize())  # 3

q.get()
print(q.qsize())  # 2

# В многопоточной среде результат приблизителен:
# между qsize() и get() другой поток может изменить очередь`,
  },
  {
    name: "queue.empty()",

    description:
      "Возвращает True, если очередь пуста, иначе False. Как и qsize(), не гарантирует точность в многопоточном контексте. Не рекомендуется использовать для управления потоком — вместо этого используйте блокирующий get() или task_done()/join().",
    syntax: "queue.empty()",
    arguments: [],
    example: `import queue

q = queue.Queue()
print(q.empty())  # True — очередь пуста

q.put(1)
print(q.empty())  # False

q.get()
print(q.empty())  # True

# Антипаттерн в многопоточном коде:
# if not q.empty():   # небезопасно!
#     item = q.get()

# Правильно — использовать блокирующий get():
# item = q.get()  # ждёт, пока не появится элемент`,
  },
  {
    name: "queue.full()",

    description:
      "Возвращает True, если очередь заполнена (достигла maxsize), иначе False. Актуально только если очередь создана с ограниченным размером (maxsize > 0). Для неограниченных очередей (maxsize=0) всегда возвращает False.",
    syntax: "queue.full()",
    arguments: [],
    example: `import queue

# Очередь с ограничением на 3 элемента
q = queue.Queue(maxsize=3)

q.put(1)
q.put(2)
print(q.full())  # False

q.put(3)
print(q.full())  # True — заполнена

# Неограниченная очередь:
q2 = queue.Queue()
for i in range(1000):
    q2.put(i)
print(q2.full())  # False — всегда`,
  },
  {
    name: "queue.put(item, block=True, timeout=None)",

    description:
      "Добавляет элемент item в очередь. Если очередь заполнена и block=True — ожидает освобождения места (до timeout секунд). При block=False или истечении timeout возбуждает queue.Full. Потокобезопасен.",
    syntax: "queue.put(item, block=True, timeout=None)",
    arguments: [
      {
        name: "item",
        description:
          "Элемент, добавляемый в очередь. Может быть любым объектом Python.",
      },
      {
        name: "block",
        description:
          "Если True (по умолчанию) — блокирует поток при заполненной очереди. Если False — сразу вызывает queue.Full.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах. None — ждёт бесконечно. Используется только при block=True.",
      },
    ],
    example: `import queue
import threading

q = queue.Queue(maxsize=2)

# Обычная запись
q.put('задача 1')
q.put('задача 2')

# Неблокирующая запись — вызывает Full если нет места
try:
    q.put('задача 3', block=False)
except queue.Full:
    print("Очередь заполнена!")

# Запись с таймаутом
try:
    q.put('задача 3', timeout=1.0)
except queue.Full:
    print("Не удалось добавить за 1 секунду")`,
  },
  {
    name: "queue.put_nowait(item)",

    description:
      "Немедленно добавляет элемент в очередь без ожидания. Эквивалентно put(item, block=False). Если очередь заполнена — сразу возбуждает queue.Full. Удобен как более читаемая альтернатива put с block=False.",
    syntax: "queue.put_nowait(item)",
    arguments: [
      { name: "item", description: "Элемент для добавления в очередь." },
    ],
    example: `import queue

q = queue.Queue(maxsize=3)

q.put_nowait('a')
q.put_nowait('b')
q.put_nowait('c')

try:
    q.put_nowait('d')  # очередь заполнена
except queue.Full:
    print("Очередь заполнена — элемент не добавлен")

print(q.qsize())  # 3`,
  },
  {
    name: "queue.get(block=True, timeout=None)",

    description:
      "Извлекает и возвращает элемент из очереди. Если очередь пуста и block=True — ожидает появления элемента (до timeout секунд). При block=False или истечении timeout возбуждает queue.Empty. Потокобезопасен.",
    syntax: "queue.get(block=True, timeout=None)",
    arguments: [
      {
        name: "block",
        description:
          "Если True (по умолчанию) — блокирует поток, пока не появится элемент. Если False — сразу вызывает queue.Empty.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах. None — ждёт бесконечно. Используется только при block=True.",
      },
    ],
    example: `import queue
import threading

q = queue.Queue()

def producer():
    import time
    time.sleep(0.5)
    q.put('результат')

threading.Thread(target=producer).start()

# Блокирует поток, пока producer не положит данные
item = q.get()
print(item)  # 'результат'

# С таймаутом:
try:
    item = q.get(timeout=2.0)
except queue.Empty:
    print("Данные не появились за 2 секунды")`,
  },
  {
    name: "queue.get_nowait()",

    description:
      "Немедленно извлекает элемент из очереди без ожидания. Эквивалентно get(block=False). Если очередь пуста — сразу возбуждает queue.Empty. Удобен как читаемая альтернатива get с block=False.",
    syntax: "queue.get_nowait()",
    arguments: [],
    example: `import queue

q = queue.Queue()
q.put(10)
q.put(20)

print(q.get_nowait())  # 10
print(q.get_nowait())  # 20

try:
    q.get_nowait()  # очередь пуста
except queue.Empty:
    print("Очередь пуста — нечего извлекать")

# Часто используется в цикле опроса очереди:
while True:
    try:
        item = q.get_nowait()
        print(f"Обработан: {item}")
    except queue.Empty:
        break`,
  },
  {
    name: "queue.task_done()",

    description:
      "Сигнализирует, что обработка ранее извлечённого элемента завершена. Должен вызываться после каждого get(). Используется совместно с join() для ожидания полной обработки всех задач. Вызов task_done() большее количество раз, чем get(), — ValueError.",
    syntax: "queue.task_done()",
    arguments: [],
    example: `import queue
import threading

q = queue.Queue()

def worker():
    while True:
        item = q.get()
        if item is None:
            break
        print(f"Обрабатываю: {item}")
        q.task_done()  # сообщаем, что задача выполнена

t = threading.Thread(target=worker)
t.start()

for task in ['задача 1', 'задача 2', 'задача 3']:
    q.put(task)

q.join()          # ждём завершения всех задач
q.put(None)       # сигнал воркеру завершить работу
t.join()
print("Все задачи выполнены")`,
  },
  {
    name: "queue.join()",

    description:
      "Блокирует вызывающий поток до тех пор, пока все элементы в очереди не будут обработаны. Считает необработанные задачи: put() увеличивает счётчик, task_done() уменьшает. Когда счётчик достигает нуля — join() разблокируется.",
    syntax: "queue.join()",
    arguments: [],
    example: `import queue
import threading

def worker(q):
    while True:
        item = q.get()
        if item is None:
            q.task_done()
            break
        # имитация работы
        print(f"Выполнено: {item}")
        q.task_done()

q = queue.Queue()
threads = [threading.Thread(target=worker, args=(q,)) for _ in range(3)]
for t in threads:
    t.start()

# Отправляем задачи
for i in range(9):
    q.put(f"задача-{i}")

q.join()  # ждём обработки всех 9 задач

# Останавливаем воркеры
for _ in threads:
    q.put(None)
for t in threads:
    t.join()
print("Пул завершил работу")`,
  },
  {
    name: "queue.maxsize",

    description:
      "Атрибут, задающий максимальное количество элементов в очереди. Устанавливается при создании очереди: Queue(maxsize=N). Значение 0 или отрицательное означает неограниченный размер. Доступен только для чтения после создания объекта.",
    syntax: "q = queue.Queue(maxsize=N)\nq.maxsize",
    arguments: [],
    example: `import queue

# Неограниченная очередь
q1 = queue.Queue()
print(q1.maxsize)  # 0 — неограниченно

# Ограниченная очередь
q2 = queue.Queue(maxsize=5)
print(q2.maxsize)  # 5

# То же для LifoQueue и PriorityQueue:
lifo = queue.LifoQueue(maxsize=10)
print(lifo.maxsize)  # 10

prio = queue.PriorityQueue(maxsize=0)
print(prio.maxsize)  # 0 — неограниченно

# Проверка: будет ли put() блокировать?
if q2.maxsize > 0:
    print(f"Очередь ограничена: {q2.maxsize} элементов")`,
  },
  {
    name: "queue.SimpleQueue.qsize()",

    description:
      "Возвращает приблизительное количество элементов в SimpleQueue. SimpleQueue — упрощённая, неограниченная и реэнтерабельная очередь без поддержки task_done() и join(). Результат qsize() не гарантированно точен в многопоточной среде.",
    syntax: "simplequeue.qsize()",
    arguments: [],
    example: `import queue

sq = queue.SimpleQueue()
print(sq.qsize())  # 0

sq.put('a')
sq.put('b')
sq.put('c')
print(sq.qsize())  # 3

sq.get()
print(sq.qsize())  # 2

# SimpleQueue не имеет maxsize — всегда неограничена`,
  },
  {
    name: "queue.SimpleQueue.empty()",

    description:
      "Возвращает True, если SimpleQueue пуста, иначе False. Как и в обычной Queue, результат не гарантирован в многопоточной среде. SimpleQueue не поддерживает full() — у неё нет ограничения по размеру.",
    syntax: "simplequeue.empty()",
    arguments: [],
    example: `import queue

sq = queue.SimpleQueue()
print(sq.empty())  # True

sq.put(42)
print(sq.empty())  # False

sq.get()
print(sq.empty())  # True

# SimpleQueue — только empty(), нет full() и maxsize:
# sq.full()    → AttributeError
# sq.maxsize   → AttributeError`,
  },
  {
    name: "queue.SimpleQueue.put(item, block=True, timeout=None)",

    description:
      "Добавляет элемент в SimpleQueue. Так как SimpleQueue неограниченна, метод никогда не блокируется — параметры block и timeout принимаются для совместимости с Queue, но игнорируются. Никогда не возбуждает queue.Full.",
    syntax: "simplequeue.put(item, block=True, timeout=None)",
    arguments: [
      {
        name: "item",
        description:
          "Элемент для добавления в очередь. Может быть любым объектом Python.",
      },
      {
        name: "block",
        description:
          "Принимается для совместимости с Queue, но игнорируется — SimpleQueue всегда неограниченна.",
      },
      {
        name: "timeout",
        description: "Принимается для совместимости с Queue, но игнорируется.",
      },
    ],
    example: `import queue
import threading

sq = queue.SimpleQueue()

# put() никогда не блокируется
for i in range(1000):
    sq.put(i)  # не заблокируется — очередь неограничена

print(sq.qsize())  # 1000

# Использование в продюсер-консьюмер паттерне:
def producer(q):
    for item in range(5):
        q.put(f"задача-{item}")
    q.put(None)  # сигнал завершения

threading.Thread(target=producer, args=(sq,)).start()`,
  },
  {
    name: "queue.SimpleQueue.put_nowait(item)",

    description:
      "Немедленно добавляет элемент в SimpleQueue. Эквивалентно put(item). Поскольку SimpleQueue неограниченна, метод идентичен put() и никогда не возбуждает queue.Full. Существует для совместимости интерфейса с Queue.",
    syntax: "simplequeue.put_nowait(item)",
    arguments: [
      { name: "item", description: "Элемент для добавления в очередь." },
    ],
    example: `import queue

sq = queue.SimpleQueue()

sq.put_nowait('первый')
sq.put_nowait('второй')
sq.put_nowait('третий')

print(sq.qsize())  # 3

# В отличие от Queue, queue.Full никогда не возникает:
for i in range(10000):
    sq.put_nowait(i)  # всегда успешно

print(sq.qsize())  # 10003`,
  },
  {
    name: "queue.SimpleQueue.get(block=True, timeout=None)",

    description:
      "Извлекает и возвращает элемент из SimpleQueue. Если очередь пуста и block=True — блокирует поток до появления элемента. При block=False или истечении timeout возбуждает queue.Empty. Потокобезопасен.",
    syntax: "simplequeue.get(block=True, timeout=None)",
    arguments: [
      {
        name: "block",
        description:
          "Если True (по умолчанию) — блокирует поток, пока не появится элемент. Если False — сразу возбуждает queue.Empty.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах при block=True. None — ждёт бесконечно.",
      },
    ],
    example: `import queue
import threading

sq = queue.SimpleQueue()

def consumer(q):
    while True:
        item = q.get()  # блокирует, пока нет элемента
        if item is None:
            break
        print(f"Получен: {item}")

threading.Thread(target=consumer, args=(sq,)).start()

sq.put('данные 1')
sq.put('данные 2')
sq.put(None)  # сигнал остановки

# С таймаутом:
try:
    val = sq.get(timeout=1.0)
except queue.Empty:
    print("Очередь пуста")`,
  },
  {
    name: "queue.SimpleQueue.get_nowait()",

    description:
      "Немедленно извлекает элемент из SimpleQueue без ожидания. Эквивалентно get(block=False). Если очередь пуста — сразу возбуждает queue.Empty.",
    syntax: "simplequeue.get_nowait()",
    arguments: [],
    example: `import queue

sq = queue.SimpleQueue()
sq.put(10)
sq.put(20)
sq.put(30)

print(sq.get_nowait())  # 10
print(sq.get_nowait())  # 20
print(sq.get_nowait())  # 30

try:
    sq.get_nowait()  # очередь пуста
except queue.Empty:
    print("Нечего извлекать")

# Полная обработка всего содержимого очереди:
sq.put(1); sq.put(2); sq.put(3)
results = []
while not sq.empty():
    results.append(sq.get_nowait())
print(results)  # [1, 2, 3]`,
  },
  {
    name: "queue.Empty",

    description:
      "Исключение, возбуждаемое при попытке извлечь элемент из пустой очереди с block=False или по истечении timeout. Наследуется от Exception. Используется с get_nowait() и get(block=False) для обработки случая пустой очереди без блокировки.",
    syntax: "except queue.Empty:\n    ...",
    arguments: [],
    example: `import queue

q = queue.Queue()
sq = queue.SimpleQueue()

# Вариант 1: get_nowait()
try:
    item = q.get_nowait()
except queue.Empty:
    print("Очередь пуста")

# Вариант 2: get с таймаутом
q.put('задача')
try:
    item = q.get(timeout=0.5)
    print(f"Получено: {item}")
except queue.Empty:
    print("Не дождались элемента")

# Вариант 3: цикл опроса
for _ in range(3):
    q.put(i)

while True:
    try:
        print(q.get_nowait())
    except queue.Empty:
        break  # очередь исчерпана`,
  },
  {
    name: "queue.Full",

    description:
      "Исключение, возбуждаемое при попытке добавить элемент в заполненную очередь с block=False или по истечении timeout. Наследуется от Exception. Актуально только для Queue и LifoQueue/PriorityQueue с заданным maxsize > 0. SimpleQueue никогда не возбуждает queue.Full.",
    syntax: "except queue.Full:\n    ...",
    arguments: [],
    example: `import queue

# Очередь с ограничением
q = queue.Queue(maxsize=2)
q.put('a')
q.put('b')

# Вариант 1: put_nowait()
try:
    q.put_nowait('c')
except queue.Full:
    print("Очередь заполнена — элемент отброшен")

# Вариант 2: put с таймаутом
try:
    q.put('c', timeout=1.0)
except queue.Full:
    print("Не удалось добавить за 1 секунду")

# Вариант 3: put с block=False
try:
    q.put('c', block=False)
except queue.Full:
    print("Нет места в очереди")`,
  },
  {
    name: "multiprocessing.active_children()",

    description:
      "Возвращает список всех активных дочерних процессов текущего процесса. Вызов этого метода автоматически завершает (join) все уже закончившие работу дочерние процессы. Полезен для мониторинга и управления пулом рабочих процессов.",
    syntax: "multiprocessing.active_children()",
    arguments: [],
    example: `import multiprocessing
import time

def worker(name, duration):
    time.sleep(duration)
    print(f"{name} завершён")

if __name__ == '__main__':
    processes = [
        multiprocessing.Process(target=worker, args=(f"worker-{i}", i * 0.5))
        for i in range(1, 4)
    ]
    for p in processes:
        p.start()

    time.sleep(0.7)
    active = multiprocessing.active_children()
    print(f"Активных процессов: {len(active)}")
    for p in active:
        print(f"  {p.name}, pid={p.pid}")`,
  },
  {
    name: "multiprocessing.cpu_count()",

    description:
      "Возвращает количество логических процессоров (CPU) в системе. Используется для определения оптимального числа рабочих процессов. Если количество определить невозможно — возбуждает NotImplementedError.",
    syntax: "multiprocessing.cpu_count()",
    arguments: [],
    example: `import multiprocessing

cpus = multiprocessing.cpu_count()
print(f"Логических CPU: {cpus}")  # например: 8

# Типичный паттерн — создать пул по числу CPU:
with multiprocessing.Pool(processes=cpus) as pool:
    results = pool.map(str, range(20))
    print(results[:5])  # ['0', '1', '2', '3', '4']

# Оставить один CPU для системы:
workers = max(1, cpus - 1)
print(f"Рабочих процессов: {workers}")`,
  },
  {
    name: "multiprocessing.current_process()",

    description:
      "Возвращает объект Process, соответствующий текущему выполняемому процессу. Аналог threading.current_thread() для процессов. Позволяет получить имя, PID и другие атрибуты текущего процесса изнутри него.",
    syntax: "multiprocessing.current_process()",
    arguments: [],
    example: `import multiprocessing

def show_info():
    proc = multiprocessing.current_process()
    print(f"Имя: {proc.name}")
    print(f"PID: {proc.pid}")
    print(f"Является ли daemon: {proc.daemon}")

if __name__ == '__main__':
    # В главном процессе:
    main = multiprocessing.current_process()
    print(f"Главный процесс: {main.name}")  # MainProcess

    # В дочернем процессе:
    p = multiprocessing.Process(target=show_info, name="Worker-1")
    p.start()
    p.join()`,
  },
  {
    name: "multiprocessing.parent_process()",

    description:
      "Возвращает объект Process, соответствующий родительскому процессу текущего дочернего процесса. В главном процессе возвращает None. Добавлено в Python 3.8. Позволяет дочернему процессу получить информацию о своём создателе.",
    syntax: "multiprocessing.parent_process()",
    arguments: [],
    example: `import multiprocessing

def child_task():
    parent = multiprocessing.parent_process()
    current = multiprocessing.current_process()
    print(f"Я: {current.name} (pid={current.pid})")
    print(f"Мой родитель: {parent.name} (pid={parent.pid})")

if __name__ == '__main__':
    main = multiprocessing.current_process()
    print(f"Главный процесс: {main.name}, pid={main.pid}")

    p = multiprocessing.Process(target=child_task, name="Child")
    p.start()
    p.join()

    # В главном процессе parent_process() возвращает None:
    print(multiprocessing.parent_process())  # None`,
  },
  {
    name: "multiprocessing.freeze_support()",

    description:
      'Добавляет поддержку создания дочерних процессов при упаковке программы в исполняемый файл с помощью PyInstaller, cx_Freeze и аналогов (только Windows). Должен вызываться сразу после if __name__ == "__main__":. На других платформах — no-op.',
    syntax: 'if __name__ == "__main__":\n    multiprocessing.freeze_support()',
    arguments: [],
    example: `import multiprocessing

def worker():
    print("Рабочий процесс запущен")

# Обязательный шаблон для Windows и заморозки:
if __name__ == '__main__':
    multiprocessing.freeze_support()  # должен быть первым!

    p = multiprocessing.Process(target=worker)
    p.start()
    p.join()
    print("Готово")

# Без freeze_support() замороженное приложение на Windows
# будет бесконечно запускать новые процессы (fork bomb).
# На Linux/macOS вызов безопасен, но ничего не делает.`,
  },
  {
    name: "multiprocessing.get_all_start_methods()",

    description:
      'Возвращает список всех методов запуска процессов, поддерживаемых на текущей платформе. Возможные значения: "spawn" (создание нового интерпретатора), "fork" (копирование родителя), "forkserver" (через сервер форков). Набор зависит от ОС.',
    syntax: "multiprocessing.get_all_start_methods()",
    arguments: [],
    example: `import multiprocessing

methods = multiprocessing.get_all_start_methods()
print(methods)
# Linux:   ['fork', 'spawn', 'forkserver']
# macOS:   ['spawn', 'fork', 'forkserver']  (Python 3.8+: spawn по умолчанию)
# Windows: ['spawn']

# Текущий метод по умолчанию:
print(multiprocessing.get_start_method())
# Linux:   'fork'
# macOS:   'spawn'
# Windows: 'spawn'`,
  },
  {
    name: "multiprocessing.get_context(method=None)",

    description:
      "Возвращает объект контекста с тем же API, что и модуль multiprocessing, но использующий указанный метод запуска процессов. Позволяет явно выбрать метод без изменения глобального состояния. Предпочтительнее set_start_method() для библиотек.",
    syntax: "multiprocessing.get_context(method=None)",
    arguments: [
      {
        name: "method",
        description:
          'Метод запуска: "spawn", "fork" или "forkserver". None — метод по умолчанию для платформы.',
      },
    ],
    example: `import multiprocessing

def worker(q):
    q.put("результат из spawn-процесса")

if __name__ == '__main__':
    # Явно используем spawn — безопасен на всех платформах
    ctx = multiprocessing.get_context('spawn')

    q = ctx.Queue()
    p = ctx.Process(target=worker, args=(q,))
    p.start()
    p.join()

    print(q.get())  # результат из spawn-процесса

    # Для fork (только Linux):
    fork_ctx = multiprocessing.get_context('fork')
    p2 = fork_ctx.Process(target=worker, args=(q,))
    p2.start()
    p2.join()`,
  },
  {
    name: "multiprocessing.get_start_method(allow_none=False)",

    description:
      'Возвращает текущий метод запуска дочерних процессов. По умолчанию зависит от платформы: "fork" на Linux, "spawn" на Windows и macOS (Python 3.8+). Если метод не установлен явно и allow_none=True — возвращает None.',
    syntax: "multiprocessing.get_start_method(allow_none=False)",
    arguments: [
      {
        name: "allow_none",
        description:
          "Если True и метод не установлен явно — возвращает None вместо платформенного значения по умолчанию.",
      },
    ],
    example: `import multiprocessing

# Метод по умолчанию (зависит от платформы):
print(multiprocessing.get_start_method())
# 'fork'   — Linux
# 'spawn'  — Windows, macOS

# С allow_none=True — None если не задан явно:
print(multiprocessing.get_start_method(allow_none=True))
# None  — если set_start_method не вызывался

# После явной установки:
if __name__ == '__main__':
    multiprocessing.set_start_method('spawn')
    print(multiprocessing.get_start_method())  # 'spawn'`,
  },
  {
    name: "multiprocessing.set_executable(executable)",

    description:
      'Задаёт путь к исполняемому файлу Python, который будет использоваться для запуска дочерних процессов при методе "spawn". По умолчанию используется тот же интерпретатор, что и родительский. Применяется для виртуальных окружений или встроенных сред.',
    syntax: "multiprocessing.set_executable(executable)",
    arguments: [
      {
        name: "executable",
        description:
          'Путь к исполняемому файлу Python (например, "/usr/bin/python3.11").',
      },
    ],
    example: `import multiprocessing
import sys

def worker():
    print(f"Дочерний процесс: {sys.executable}")

if __name__ == '__main__':
    # Показываем текущий интерпретатор
    print(f"Родительский: {sys.executable}")

    # Задаём конкретный интерпретатор для дочерних процессов
    multiprocessing.set_executable('/usr/bin/python3')

    p = multiprocessing.Process(target=worker)
    p.start()
    p.join()

    # Полезно при работе с venv или conda:
    # multiprocessing.set_executable(sys.executable)`,
  },
  {
    name: "multiprocessing.set_start_method(method, force=False)",

    description:
      'Устанавливает метод запуска дочерних процессов для всей программы. Должен вызываться только один раз в блоке if __name__ == "__main__". Повторный вызов без force=True возбуждает RuntimeError. Влияет на все последующие Process(), Pool() и т.д.',
    syntax: "multiprocessing.set_start_method(method, force=False)",
    arguments: [
      {
        name: "method",
        description:
          'Метод запуска: "spawn" (все платформы), "fork" (POSIX), "forkserver" (POSIX).',
      },
      {
        name: "force",
        description:
          "Если True — позволяет переустановить метод повторно. Использовать осторожно.",
      },
    ],
    example: `import multiprocessing

def worker(n):
    return n ** 2

if __name__ == '__main__':
    # Устанавливаем spawn — безопасен на всех платформах
    multiprocessing.set_start_method('spawn')

    with multiprocessing.Pool(4) as pool:
        results = pool.map(worker, range(8))
    print(results)  # [0, 1, 4, 9, 16, 25, 36, 49]

    # Повторный вызов без force вызовет ошибку:
    # multiprocessing.set_start_method('fork')  # RuntimeError!
    multiprocessing.set_start_method('fork', force=True)  # OK`,
  },
  {
    name: "multiprocessing.log_to_stderr(level=None)",

    description:
      "Включает логирование модуля multiprocessing в stderr и возвращает настроенный логгер. Если level не задан — уровень логирования не изменяется. Удобен для отладки проблем с процессами — позволяет видеть события запуска, завершения и ошибок.",
    syntax: "multiprocessing.log_to_stderr(level=None)",
    arguments: [
      {
        name: "level",
        description:
          "Уровень логирования (logging.DEBUG, logging.INFO и т.д.). Если None — уровень не изменяется.",
      },
    ],
    example: `import multiprocessing
import logging

def worker():
    print("Рабочий процесс выполняется")

if __name__ == '__main__':
    # Включаем логирование в stderr
    logger = multiprocessing.log_to_stderr(level=logging.DEBUG)

    p = multiprocessing.Process(target=worker)
    p.start()
    p.join()
    # В stderr будут сообщения вида:
    # [DEBUG/Process-1] child process calling self.run()
    # [DEBUG/Process-1] process shutting down
    # [DEBUG/MainProcess] process no longer alive`,
  },
  {
    name: "multiprocessing.get_logger()",

    description:
      "Возвращает объект логгера, используемый модулем multiprocessing. Изначально у него нет обработчиков (handlers) — сообщения не выводятся. Для вывода в stderr используйте log_to_stderr(). Позволяет настроить логирование вручную.",
    syntax: "multiprocessing.get_logger()",
    arguments: [],
    example: `import multiprocessing
import logging

# Получаем логгер модуля
logger = multiprocessing.get_logger()

# Добавляем свой обработчик
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(
    '[%(levelname)s/%(processName)s] %(message)s'
))
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

def worker():
    log = multiprocessing.get_logger()
    log.info("Рабочий процесс запущен")

if __name__ == '__main__':
    p = multiprocessing.Process(target=worker)
    p.start()
    p.join()`,
  },
  {
    name: "multiprocessing.allow_connection_pickling()",

    description:
      "Устанавливает поддержку сериализации (pickling) объектов соединений (Connection) из multiprocessing.connection. По умолчанию Connection нельзя передать через pickle — этот вызов разрешает передачу соединений между процессами через очереди или каналы.",
    syntax: "multiprocessing.allow_connection_pickling()",
    arguments: [],
    example: `import multiprocessing
import multiprocessing.connection

# Разрешаем передачу Connection объектов через pickle
multiprocessing.allow_connection_pickling()

def send_data(conn):
    conn.send("Привет от дочернего процесса!")
    conn.close()

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe()

    p = multiprocessing.Process(target=send_data, args=(child_conn,))
    p.start()

    msg = parent_conn.recv()
    print(msg)  # Привет от дочернего процесса!

    p.join()
    parent_conn.close()`,
  },
  {
    name: "multiprocessing.Process.run()",

    description:
      "Метод, содержащий код, выполняемый в дочернем процессе. По умолчанию вызывает функцию, переданную в аргументе target конструктора. Переопределяется при создании подкласса Process для определения логики процесса. Не вызывайте напрямую — используйте start().",
    syntax: "process.run()",
    arguments: [],
    example: `import multiprocessing

# Способ 1: передача target в конструктор
def my_task(n):
    print(f"Квадрат {n} = {n ** 2}")

p = multiprocessing.Process(target=my_task, args=(5,))
p.start()
p.join()

# Способ 2: переопределение run() в подклассе
class MyProcess(multiprocessing.Process):
    def __init__(self, value):
        super().__init__()
        self.value = value

    def run(self):
        print(f"Процесс {self.name}: значение = {self.value}")

if __name__ == '__main__':
    proc = MyProcess(42)
    proc.start()
    proc.join()`,
  },
  {
    name: "multiprocessing.Process.start()",

    description:
      "Запускает процесс, вызывая run() в дочернем процессе. Должен вызываться не более одного раза для каждого объекта Process. Создаёт новый процесс ОС с помощью текущего метода запуска (spawn/fork/forkserver).",
    syntax: "process.start()",
    arguments: [],
    example: `import multiprocessing

def worker(msg):
    print(f"Дочерний процесс: {msg}")

if __name__ == '__main__':
    p = multiprocessing.Process(target=worker, args=("Привет!",))

    print(f"Запускаем процесс...")
    p.start()     # создаёт и запускает дочерний процесс
    print(f"PID дочернего: {p.pid}")

    p.join()      # ждём завершения
    print("Готово")

    # start() можно вызвать только один раз:
    # p.start()   # AssertionError — процесс уже запущен`,
  },
  {
    name: "multiprocessing.Process.terminate()",

    description:
      "Посылает процессу сигнал SIGTERM (на Unix) или вызывает TerminateProcess() (на Windows), запрашивая его завершение. Процесс может не завершиться мгновенно — используйте join() после terminate() для ожидания. Дочерние процессы завершаемого не останавливаются автоматически.",
    syntax: "process.terminate()",
    arguments: [],
    example: `import multiprocessing
import time

def long_task():
    print("Начинаю долгую задачу...")
    time.sleep(60)  # имитация долгой работы
    print("Задача завершена")

if __name__ == '__main__':
    p = multiprocessing.Process(target=long_task)
    p.start()

    time.sleep(1)
    print(f"Процесс жив: {p.is_alive()}")  # True

    p.terminate()   # посылаем SIGTERM
    p.join()        # ждём завершения

    print(f"Процесс жив: {p.is_alive()}")  # False
    print(f"Код завершения: {p.exitcode}")  # -15 (SIGTERM) на Unix`,
  },
  {
    name: "multiprocessing.Process.kill()",

    description:
      "Посылает процессу сигнал SIGKILL (на Unix) или вызывает TerminateProcess() (на Windows). В отличие от terminate(), SIGKILL невозможно перехватить или проигнорировать — процесс гарантированно завершается немедленно. Добавлено в Python 3.7.",
    syntax: "process.kill()",
    arguments: [],
    example: `import multiprocessing
import signal
import time

def stubborn_task():
    # Этот процесс игнорирует SIGTERM
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    print("Игнорирую SIGTERM, работаю дальше...")
    time.sleep(60)

if __name__ == '__main__':
    p = multiprocessing.Process(target=stubborn_task)
    p.start()
    time.sleep(0.5)

    p.terminate()   # SIGTERM — будет проигнорирован
    time.sleep(0.5)
    print(f"После terminate: {p.is_alive()}")  # True

    p.kill()        # SIGKILL — невозможно игнорировать
    p.join()
    print(f"После kill: {p.is_alive()}")  # False`,
  },
  {
    name: "multiprocessing.Process.close()",

    description:
      "Освобождает ресурсы, связанные с объектом Process. После вызова большинство методов и атрибутов объекта становятся недоступными. Процесс должен быть завершён перед вызовом close(). Добавлено в Python 3.7. Рекомендуется использовать как контекстный менеджер (with).",
    syntax: "process.close()",
    arguments: [],
    example: `import multiprocessing

def worker():
    pass

if __name__ == '__main__':
    p = multiprocessing.Process(target=worker)
    p.start()
    p.join()
    p.close()  # освобождаем ресурсы

    # После close() атрибуты недоступны:
    # p.pid  → ValueError: process object is closed

    # Предпочтительный способ — контекстный менеджер:
    with multiprocessing.Process(target=worker) as p:
        p.start()
    # close() вызывается автоматически при выходе из with`,
  },
  {
    name: "multiprocessing.Process.join([timeout])",

    description:
      "Блокирует вызывающий поток до завершения процесса или истечения timeout секунд. Если timeout не задан — ждёт бесконечно. После join() используйте exitcode для проверки результата. Нельзя вызывать до start() или из самого процесса.",
    syntax: "process.join(timeout=None)",
    arguments: [
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах. None — ждёт до завершения процесса.",
      },
    ],
    example: `import multiprocessing
import time

def slow_worker():
    time.sleep(2)
    print("Работа завершена")

if __name__ == '__main__':
    p = multiprocessing.Process(target=slow_worker)
    p.start()

    # Ждём максимум 1 секунду
    p.join(timeout=1)

    if p.is_alive():
        print("Процесс ещё работает — принудительно завершаем")
        p.terminate()
        p.join()  # ждём финального завершения
    else:
        print(f"Процесс завершился, код: {p.exitcode}")`,
  },
  {
    name: "multiprocessing.Process.is_alive()",

    description:
      "Возвращает True, если процесс ещё выполняется, и False после его завершения. Может использоваться для опроса состояния процесса без блокировки. После завершения процесса автоматически освобождает связанные ресурсы.",
    syntax: "process.is_alive()",
    arguments: [],
    example: `import multiprocessing
import time

def worker():
    time.sleep(1.5)

if __name__ == '__main__':
    p = multiprocessing.Process(target=worker)
    p.start()

    # Опрос состояния в цикле без блокировки
    while p.is_alive():
        print("Процесс работает...")
        time.sleep(0.5)

    print(f"Процесс завершён, exitcode={p.exitcode}")
    # Процесс работает...
    # Процесс работает...
    # Процесс работает...
    # Процесс завершён, exitcode=0`,
  },
  {
    name: "multiprocessing.Process.name",

    description:
      'Строковый атрибут — имя процесса. Задаётся при создании (Process(name="...")) или устанавливается вручную. Используется только для идентификации в логах и отладке — не влияет на поведение. По умолчанию генерируется автоматически: "Process-1", "Process-2" и т.д.',
    syntax: "process.name",
    arguments: [],
    example: `import multiprocessing

def worker():
    proc = multiprocessing.current_process()
    print(f"Меня зовут: {proc.name}")

if __name__ == '__main__':
    # Имя по умолчанию
    p1 = multiprocessing.Process(target=worker)
    p1.start(); p1.join()  # Меня зовут: Process-1

    # Явное задание имени
    p2 = multiprocessing.Process(target=worker, name="DataProcessor")
    p2.start(); p2.join()  # Меня зовут: DataProcessor

    # Изменение имени после создания
    p3 = multiprocessing.Process(target=worker)
    p3.name = "CustomName"
    p3.start(); p3.join()  # Меня зовут: CustomName`,
  },
  {
    name: "multiprocessing.Process.daemon",

    description:
      "Булев атрибут, определяющий, является ли процесс демоном. Демон-процесс автоматически завершается при завершении родительского процесса. Должен быть установлен до вызова start(). Демон-процессы не могут порождать дочерние процессы.",
    syntax: "process.daemon",
    arguments: [],
    example: `import multiprocessing
import time

def background_monitor():
    while True:
        print("Мониторинг...")
        time.sleep(0.3)

def main_task():
    print("Главная задача выполняется")
    time.sleep(1)
    print("Главная задача завершена")

if __name__ == '__main__':
    # Демон завершится автоматически вместе с main_task
    monitor = multiprocessing.Process(target=background_monitor)
    monitor.daemon = True   # устанавливаем до start()!
    monitor.start()

    worker = multiprocessing.Process(target=main_task)
    worker.start()
    worker.join()
    # После завершения worker программа завершится,
    # и monitor будет убит автоматически`,
  },
  {
    name: "multiprocessing.Process.pid",

    description:
      "Атрибут — идентификатор процесса (PID) в операционной системе. Доступен только после вызова start(). До запуска равен None. Используется для взаимодействия с процессом через системные средства (kill, psutil и т.д.).",
    syntax: "process.pid",
    arguments: [],
    example: `import multiprocessing
import os

def worker():
    print(f"Мой PID: {os.getpid()}")
    print(f"Родительский PID: {os.getppid()}")

if __name__ == '__main__':
    p = multiprocessing.Process(target=worker)

    print(f"До start(): pid = {p.pid}")  # None

    p.start()
    print(f"После start(): pid = {p.pid}")  # например: 12345
    p.join()

    print(f"После join(): pid = {p.pid}")   # 12345 (сохраняется)

    # PID главного процесса:
    print(f"Главный процесс: {os.getpid()}")`,
  },
  {
    name: "multiprocessing.Process.exitcode",

    description:
      "Атрибут — код завершения процесса. None если процесс ещё выполняется. 0 — успешное завершение. Положительное число — код ошибки. Отрицательное число — номер сигнала, которым был убит процесс (например, -15 для SIGTERM, -9 для SIGKILL).",
    syntax: "process.exitcode",
    arguments: [],
    example: `import multiprocessing
import sys

def success_worker():
    pass  # завершается с кодом 0

def error_worker():
    sys.exit(2)  # завершается с кодом 2

def crash_worker():
    raise RuntimeError("Ошибка!")  # exitcode = 1

if __name__ == '__main__':
    for func, label in [(success_worker, "успех"),
                        (error_worker, "ошибка"),
                        (crash_worker, "сбой")]:
        p = multiprocessing.Process(target=func)
        p.start()
        p.join()
        print(f"{label}: exitcode = {p.exitcode}")
    # успех: exitcode = 0
    # ошибка: exitcode = 2
    # сбой: exitcode = 1`,
  },
  {
    name: "multiprocessing.Process.authkey",

    description:
      "Байтовый атрибут — ключ аутентификации процесса. Используется для проверки подлинности при установке соединений между процессами через multiprocessing.connection. По умолчанию наследуется от родительского процесса (случайные байты, генерируемые os.urandom()).",
    syntax: "process.authkey",
    arguments: [],
    example: `import multiprocessing

def worker():
    proc = multiprocessing.current_process()
    print(f"Ключ дочернего: {proc.authkey[:8]}...")  # первые 8 байт

if __name__ == '__main__':
    main = multiprocessing.current_process()
    print(f"Ключ главного: {main.authkey[:8]}...")

    p = multiprocessing.Process(target=worker)
    p.start()
    p.join()
    # Ключи одинаковы — дочерний наследует от родителя

    # Установка своего ключа аутентификации:
    main.authkey = b'my-secret-key-32bytes-padded!!!!'
    print(f"Новый ключ: {main.authkey}")`,
  },
  {
    name: "multiprocessing.Process.sentinel",

    description:
      "Дескриптор файла (Unix) или дескриптор объекта (Windows), который становится готов к чтению при завершении процесса. Используется с select.select() или selectors для одновременного ожидания нескольких процессов без блокировки. Доступен только после start().",
    syntax: "process.sentinel",
    arguments: [],
    example: `import multiprocessing
import select
import time

def worker(delay):
    time.sleep(delay)

if __name__ == '__main__':
    processes = [
        multiprocessing.Process(target=worker, args=(i,))
        for i in [1, 2, 3]
    ]
    for p in processes:
        p.start()

    sentinels = {p.sentinel: p for p in processes}

    # Ждём завершения любого из процессов без блокировки
    while sentinels:
        ready, _, _ = select.select(sentinels.keys(), [], [], 0.5)
        for fd in ready:
            proc = sentinels.pop(fd)
            proc.join()
            print(f"{proc.name} завершён, exitcode={proc.exitcode}")`,
  },
  {
    name: "multiprocessing.Pool.apply(func[, args[, kwds]])",

    description:
      "Вызывает функцию func с аргументами args и именованными аргументами kwds в одном из рабочих процессов пула и блокирует вызывающий процесс до получения результата. Аналог встроенной функции apply() — синхронный, выполняется в одном процессе за раз.",
    syntax: "pool.apply(func[, args[, kwds]])",
    arguments: [
      {
        name: "func",
        description: "Вызываемая функция. Должна быть picklable.",
      },
      { name: "args", description: "Кортеж позиционных аргументов для func." },
      { name: "kwds", description: "Словарь именованных аргументов для func." },
    ],
    example: `import multiprocessing

def power(base, exp):
    return base ** exp

if __name__ == '__main__':
    with multiprocessing.Pool(4) as pool:
        # Синхронный вызов — блокирует до результата
        result = pool.apply(power, args=(2, 10))
        print(result)  # 1024

        result = pool.apply(power, kwds={'base': 3, 'exp': 4})
        print(result)  # 81

    # Для параллельного выполнения используйте map() или apply_async()`,
  },
  {
    name: "multiprocessing.Pool.apply_async(func[, args[, kwds[, callback[, error_callback]]]])",

    description:
      "Асинхронный вариант apply(). Отправляет задачу в пул и сразу возвращает объект AsyncResult, не блокируя вызывающий процесс. Callback вызывается в главном процессе при успешном завершении, error_callback — при исключении.",
    syntax:
      "pool.apply_async(func[, args[, kwds[, callback[, error_callback]]]])",
    arguments: [
      { name: "func", description: "Вызываемая функция." },
      { name: "args", description: "Кортеж позиционных аргументов." },
      { name: "kwds", description: "Словарь именованных аргументов." },
      {
        name: "callback",
        description:
          "Функция, вызываемая с результатом при успешном завершении.",
      },
      {
        name: "error_callback",
        description: "Функция, вызываемая с исключением при ошибке.",
      },
    ],
    example: `import multiprocessing

def square(n):
    return n ** 2

def on_result(result):
    print(f"Готово: {result}")

def on_error(e):
    print(f"Ошибка: {e}")

if __name__ == '__main__':
    with multiprocessing.Pool(4) as pool:
        # Запускаем несколько задач параллельно
        results = [
            pool.apply_async(square, args=(i,), callback=on_result)
            for i in range(5)
        ]
        # Ждём все результаты
        values = [r.get(timeout=5) for r in results]
    print(values)  # [0, 1, 4, 9, 16]`,
  },
  {
    name: "multiprocessing.Pool.map(func, iterable[, chunksize])",

    description:
      "Параллельный аналог встроенного map(). Применяет func к каждому элементу iterable, распределяя задачи по рабочим процессам пула. Блокирует до получения всех результатов. Возвращает список результатов в том же порядке, что и входные данные.",
    syntax: "pool.map(func, iterable[, chunksize])",
    arguments: [
      {
        name: "func",
        description:
          "Функция, применяемая к каждому элементу. Принимает один аргумент.",
      },
      {
        name: "iterable",
        description: "Итерируемый объект с входными данными.",
      },
      {
        name: "chunksize",
        description:
          "Размер порций задач для передачи рабочим процессам. Большие значения снижают накладные расходы при обработке больших данных.",
      },
    ],
    example: `import multiprocessing

def square(n):
    return n ** 2

def is_even(n):
    return n % 2 == 0

if __name__ == '__main__':
    data = range(10)

    with multiprocessing.Pool() as pool:
        squares = pool.map(square, data)
        print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

        evens = pool.map(is_even, data)
        print(evens)  # [True, False, True, False, ...]

        # chunksize для больших данных:
        result = pool.map(square, range(10000), chunksize=500)`,
  },
  {
    name: "multiprocessing.Pool.map_async(func, iterable[, chunksize[, callback[, error_callback]]])",

    description:
      "Асинхронный вариант map(). Возвращает объект AsyncResult немедленно, не ожидая завершения всех задач. Позволяет продолжать работу в главном процессе пока пул обрабатывает данные. Результаты доступны через .get().",
    syntax:
      "pool.map_async(func, iterable[, chunksize[, callback[, error_callback]]])",
    arguments: [
      { name: "func", description: "Функция, применяемая к каждому элементу." },
      {
        name: "iterable",
        description: "Итерируемый объект с входными данными.",
      },
      { name: "chunksize", description: "Размер порций задач." },
      {
        name: "callback",
        description:
          "Вызывается со списком результатов при успешном завершении всех задач.",
      },
      {
        name: "error_callback",
        description: "Вызывается с исключением при ошибке в любой задаче.",
      },
    ],
    example: `import multiprocessing
import time

def slow_square(n):
    time.sleep(0.1)
    return n ** 2

if __name__ == '__main__':
    with multiprocessing.Pool(4) as pool:
        # Запускаем асинхронно и продолжаем работу
        async_result = pool.map_async(slow_square, range(8))

        print("Работаем пока пул считает...")
        # ... другая работа ...

        results = async_result.get(timeout=10)
        print(results)  # [0, 1, 4, 9, 16, 25, 36, 49]`,
  },
  {
    name: "multiprocessing.Pool.imap(func, iterable[, chunksize])",

    description:
      "Ленивый (lazy) вариант map() — возвращает итератор, выдающий результаты по одному по мере их готовности. Экономит память при обработке больших данных, так как не хранит все результаты в памяти одновременно. Результаты возвращаются в порядке входных данных.",
    syntax: "pool.imap(func, iterable[, chunksize])",
    arguments: [
      { name: "func", description: "Функция, применяемая к каждому элементу." },
      {
        name: "iterable",
        description: "Итерируемый объект с входными данными.",
      },
      {
        name: "chunksize",
        description:
          "Размер порций. По умолчанию 1 — каждый элемент отправляется отдельно.",
      },
    ],
    example: `import multiprocessing

def process_line(line):
    return line.strip().upper()

if __name__ == '__main__':
    lines = [f"строка {i}\n" for i in range(100)]

    with multiprocessing.Pool(4) as pool:
        # Обрабатываем результаты по мере готовности
        for result in pool.imap(process_line, lines, chunksize=10):
            print(result)  # СТРОКА 0, СТРОКА 1, ...

        # В отличие от map() — не загружает всё в память сразу
        # Идеален для обработки больших файлов построчно`,
  },
  {
    name: "multiprocessing.Pool.imap_unordered(func, iterable[, chunksize])",

    description:
      "Аналог imap(), но результаты возвращаются в порядке завершения задач, а не в порядке входных данных. Быстрее imap() при неравномерном времени выполнения задач — результат быстрой задачи не ждёт медленной. Полезен когда порядок вывода неважен.",
    syntax: "pool.imap_unordered(func, iterable[, chunksize])",
    arguments: [
      { name: "func", description: "Функция, применяемая к каждому элементу." },
      {
        name: "iterable",
        description: "Итерируемый объект с входными данными.",
      },
      { name: "chunksize", description: "Размер порций задач." },
    ],
    example: `import multiprocessing
import time
import random

def variable_task(n):
    time.sleep(random.uniform(0, 0.5))  # разное время выполнения
    return n ** 2

if __name__ == '__main__':
    with multiprocessing.Pool(4) as pool:
        # Результаты приходят по мере готовности (не по порядку!)
        for result in pool.imap_unordered(variable_task, range(8)):
            print(result, end=' ')  # например: 25 0 9 1 49 16 4 36
        print()

        # Для сравнения — imap вернёт: 0 1 4 9 16 25 36 49 (по порядку)`,
  },
  {
    name: "multiprocessing.Pool.starmap(func, iterable[, chunksize])",

    description:
      "Аналог map(), но каждый элемент iterable — это кортеж аргументов, которые распаковываются в func. Аналог itertools.starmap() с параллельным выполнением. Удобен когда функция принимает несколько аргументов.",
    syntax: "pool.starmap(func, iterable[, chunksize])",
    arguments: [
      { name: "func", description: "Функция с несколькими аргументами." },
      {
        name: "iterable",
        description: "Итерируемый объект кортежей аргументов.",
      },
      { name: "chunksize", description: "Размер порций задач." },
    ],
    example: `import multiprocessing

def power(base, exp):
    return base ** exp

def add(a, b, c):
    return a + b + c

if __name__ == '__main__':
    with multiprocessing.Pool(4) as pool:
        # Каждый кортеж распаковывается как аргументы функции
        pairs = [(2, 1), (2, 2), (2, 3), (2, 4), (2, 5)]
        results = pool.starmap(power, pairs)
        print(results)  # [2, 4, 8, 16, 32]

        triples = [(1, 2, 3), (4, 5, 6), (7, 8, 9)]
        sums = pool.starmap(add, triples)
        print(sums)  # [6, 15, 24]`,
  },
  {
    name: "multiprocessing.Pool.starmap_async(func, iterable[, chunksize[, callback[, error_callback]]])",

    description:
      "Асинхронный вариант starmap(). Распаковывает кортежи аргументов и выполняет задачи параллельно, не блокируя вызывающий процесс. Возвращает AsyncResult. Сочетает удобство starmap с неблокирующим поведением map_async.",
    syntax:
      "pool.starmap_async(func, iterable[, chunksize[, callback[, error_callback]]])",
    arguments: [
      { name: "func", description: "Функция с несколькими аргументами." },
      {
        name: "iterable",
        description: "Итерируемый объект кортежей аргументов.",
      },
      { name: "chunksize", description: "Размер порций задач." },
      {
        name: "callback",
        description:
          "Вызывается со списком результатов при успешном завершении.",
      },
      {
        name: "error_callback",
        description: "Вызывается с исключением при ошибке.",
      },
    ],
    example: `import multiprocessing

def multiply(a, b):
    return a * b

def on_done(results):
    print(f"Все результаты: {results}")

if __name__ == '__main__':
    pairs = [(1, 2), (3, 4), (5, 6), (7, 8)]

    with multiprocessing.Pool(4) as pool:
        async_result = pool.starmap_async(
            multiply,
            pairs,
            callback=on_done
        )
        # Продолжаем работу пока пул считает...
        results = async_result.get(timeout=5)
        print(results)  # [2, 12, 30, 56]`,
  },
  {
    name: "multiprocessing.Pool.close()",

    description:
      "Запрещает отправку новых задач в пул. Уже поставленные в очередь задачи будут выполнены до конца. После close() необходимо вызвать join() для ожидания завершения всех рабочих процессов. Используется в паре с join() при явном управлении пулом.",
    syntax: "pool.close()",
    arguments: [],
    example: `import multiprocessing

def square(n):
    return n ** 2

if __name__ == '__main__':
    pool = multiprocessing.Pool(4)

    results = [pool.apply_async(square, (i,)) for i in range(10)]

    pool.close()   # больше задач не принимаем
    pool.join()    # ждём завершения всех текущих задач

    values = [r.get() for r in results]
    print(values)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

    # Предпочтительный способ — контекстный менеджер:
    with multiprocessing.Pool(4) as pool:
        values = pool.map(square, range(10))
    # close() и join() вызываются автоматически`,
  },
  {
    name: "multiprocessing.Pool.terminate()",

    description:
      "Немедленно останавливает все рабочие процессы пула, не ожидая завершения текущих задач. Используется при аварийном завершении работы или для отмены всех задач. При использовании пула как контекстного менеджера вызывается автоматически при исключении.",
    syntax: "pool.terminate()",
    arguments: [],
    example: `import multiprocessing
import time

def long_task(n):
    time.sleep(10)
    return n

if __name__ == '__main__':
    pool = multiprocessing.Pool(4)

    # Запускаем долгие задачи
    results = [pool.apply_async(long_task, (i,)) for i in range(8)]

    time.sleep(1)
    print("Отменяем все задачи!")
    pool.terminate()  # немедленно убиваем все процессы
    pool.join()

    # При исключении в with-блоке terminate() вызывается автоматически:
    try:
        with multiprocessing.Pool(4) as pool:
            pool.map(long_task, range(8))
    except KeyboardInterrupt:
        pass  # пул уже завершён`,
  },
  {
    name: "multiprocessing.Pool.join()",

    description:
      "Блокирует вызывающий процесс до завершения всех рабочих процессов пула. Должен вызываться только после close() или terminate(). Гарантирует, что все ресурсы пула освобождены перед продолжением работы главного процесса.",
    syntax: "pool.join()",
    arguments: [],
    example: `import multiprocessing

def compute(n):
    return sum(range(n))

if __name__ == '__main__':
    pool = multiprocessing.Pool(4)

    # Отправляем задачи
    async_results = [pool.apply_async(compute, (i * 1000,)) for i in range(8)]

    # Закрываем пул для новых задач
    pool.close()

    # Блокируем до завершения всех задач
    pool.join()

    # Теперь можно безопасно читать результаты
    results = [r.get() for r in async_results]
    print(results[:3])  # [0, 499500, 1999000]

    # С контекстным менеджером join() не нужен явно:
    with multiprocessing.Pool(4) as pool:
        result = pool.map(compute, range(8))`,
  },
  {
    name: "multiprocessing.Queue.qsize()",

    description:
      "Возвращает приблизительное число элементов в очереди multiprocessing.Queue. Не доступен на macOS (возбуждает NotImplementedError). В многопроцессорной среде результат приблизителен — между вызовом и следующей операцией другой процесс может изменить очередь.",
    syntax: "queue.qsize()",
    arguments: [],
    example: `import multiprocessing

if __name__ == '__main__':
    q = multiprocessing.Queue()
    q.put('a')
    q.put('b')
    q.put('c')

    print(q.qsize())  # 3  (недоступно на macOS)

    q.get()
    print(q.qsize())  # 2

    # На macOS:
    # q.qsize()  → NotImplementedError`,
  },
  {
    name: "multiprocessing.Queue.empty()",

    description:
      "Возвращает True если очередь multiprocessing.Queue пуста. Результат приблизителен — в многопроцессорной среде другой процесс может изменить очередь сразу после вызова. Не рекомендуется использовать для управления логикой — используйте блокирующий get().",
    syntax: "queue.empty()",
    arguments: [],
    example: `import multiprocessing

if __name__ == '__main__':
    q = multiprocessing.Queue()
    print(q.empty())  # True

    q.put(1)
    print(q.empty())  # False

    q.get()
    print(q.empty())  # True

    # Антипаттерн в многопроцессорном коде:
    # if not q.empty():   # небезопасно!
    #     item = q.get()
    # Используйте блокирующий get() вместо empty()`,
  },
  {
    name: "multiprocessing.Queue.full()",

    description:
      "Возвращает True если очередь multiprocessing.Queue заполнена (достигла maxsize). Для неограниченных очередей (maxsize=0) всегда возвращает False. Результат приблизителен в многопроцессорной среде.",
    syntax: "queue.full()",
    arguments: [],
    example: `import multiprocessing

if __name__ == '__main__':
    q = multiprocessing.Queue(maxsize=3)

    q.put(1)
    q.put(2)
    print(q.full())  # False

    q.put(3)
    print(q.full())  # True

    # Неограниченная очередь:
    q2 = multiprocessing.Queue()
    print(q2.full())  # False — всегда`,
  },
  {
    name: "multiprocessing.Queue.put(obj[, block[, timeout]])",

    description:
      "Помещает объект obj в очередь multiprocessing.Queue. Если очередь заполнена и block=True — ждёт до timeout секунд. При block=False или истечении timeout возбуждает queue.Full. Потокобезопасен и процессобезопасен.",
    syntax: "queue.put(obj[, block[, timeout]])",
    arguments: [
      {
        name: "obj",
        description: "Объект для помещения в очередь. Должен быть picklable.",
      },
      {
        name: "block",
        description:
          "Если True (по умолчанию) — блокирует при заполненной очереди. Если False — сразу возбуждает queue.Full.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах при block=True. None — ждёт бесконечно.",
      },
    ],
    example: `import multiprocessing

def producer(q):
    for item in range(5):
        q.put(item)
        print(f"Отправлено: {item}")

def consumer(q):
    for _ in range(5):
        item = q.get()
        print(f"Получено: {item}")

if __name__ == '__main__':
    q = multiprocessing.Queue(maxsize=2)

    p = multiprocessing.Process(target=producer, args=(q,))
    c = multiprocessing.Process(target=consumer, args=(q,))

    p.start(); c.start()
    p.join(); c.join()`,
  },
  {
    name: "multiprocessing.Queue.put_nowait(obj)",

    description:
      "Немедленно помещает объект в очередь без ожидания. Эквивалентно put(obj, block=False). Если очередь заполнена — сразу возбуждает queue.Full. Объект должен быть picklable — данные сериализуются для передачи между процессами.",
    syntax: "queue.put_nowait(obj)",
    arguments: [
      { name: "obj", description: "Picklable объект для помещения в очередь." },
    ],
    example: `import multiprocessing
import queue

if __name__ == '__main__':
    q = multiprocessing.Queue(maxsize=3)

    q.put_nowait('a')
    q.put_nowait('b')
    q.put_nowait('c')

    try:
        q.put_nowait('d')  # очередь заполнена
    except queue.Full:
        print("Очередь заполнена — элемент отброшен")

    print(q.qsize())  # 3`,
  },
  {
    name: "multiprocessing.Queue.get([block[, timeout]])",

    description:
      "Извлекает и возвращает объект из очереди multiprocessing.Queue. Если очередь пуста и block=True — ждёт до timeout секунд. При block=False или истечении timeout возбуждает queue.Empty. Данные десериализуются из pickle.",
    syntax: "queue.get([block[, timeout]])",
    arguments: [
      {
        name: "block",
        description:
          "Если True (по умолчанию) — блокирует, пока не появится элемент. Если False — сразу возбуждает queue.Empty.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах при block=True. None — ждёт бесконечно.",
      },
    ],
    example: `import multiprocessing
import queue

def worker(q, result_q):
    data = q.get()  # блокирует, пока нет данных
    result = data ** 2
    result_q.put(result)

if __name__ == '__main__':
    task_q = multiprocessing.Queue()
    result_q = multiprocessing.Queue()

    p = multiprocessing.Process(target=worker, args=(task_q, result_q))
    p.start()

    task_q.put(7)
    result = result_q.get(timeout=5)
    print(result)  # 49

    p.join()`,
  },
  {
    name: "multiprocessing.Queue.get_nowait()",

    description:
      "Немедленно извлекает объект из очереди без ожидания. Эквивалентно get(block=False). Если очередь пуста — сразу возбуждает queue.Empty. Используется для неблокирующего опроса очереди.",
    syntax: "queue.get_nowait()",
    arguments: [],
    example: `import multiprocessing
import queue

if __name__ == '__main__':
    q = multiprocessing.Queue()
    q.put(10)
    q.put(20)

    print(q.get_nowait())  # 10
    print(q.get_nowait())  # 20

    try:
        q.get_nowait()  # очередь пуста
    except queue.Empty:
        print("Нечего извлекать")

    # Опрос всего содержимого:
    q.put(1); q.put(2); q.put(3)
    items = []
    while True:
        try:
            items.append(q.get_nowait())
        except queue.Empty:
            break
    print(items)  # [1, 2, 3]`,
  },
  {
    name: "multiprocessing.Queue.close()",

    description:
      "Сигнализирует, что текущий процесс больше не будет добавлять данные в очередь. Фоновый поток, отправляющий данные, будет корректно завершён после очистки буфера. Не блокирует — для ожидания полной отправки используйте join_thread().",
    syntax: "queue.close()",
    arguments: [],
    example: `import multiprocessing

def producer(q):
    for i in range(5):
        q.put(i)
    q.close()       # сигнализируем об окончании записи
    q.join_thread() # ждём отправки всех буферизованных данных

def consumer(q):
    for _ in range(5):
        print(q.get())

if __name__ == '__main__':
    q = multiprocessing.Queue()

    p = multiprocessing.Process(target=producer, args=(q,))
    c = multiprocessing.Process(target=consumer, args=(q,))

    p.start(); c.start()
    p.join(); c.join()`,
  },
  {
    name: "multiprocessing.Queue.join_thread()",

    description:
      "Ожидает завершения фонового потока очереди — убеждается, что все данные из буфера отправлены. Должен вызываться после close(). По умолчанию при завершении процесса join_thread() вызывается автоматически, если не был вызван cancel_join_thread().",
    syntax: "queue.join_thread()",
    arguments: [],
    example: `import multiprocessing

def safe_producer(q, data):
    for item in data:
        q.put(item)
    # Гарантируем отправку всех данных перед завершением процесса
    q.close()
    q.join_thread()  # ждём полной отправки буфера
    print("Все данные отправлены")

if __name__ == '__main__':
    q = multiprocessing.Queue()
    p = multiprocessing.Process(
        target=safe_producer,
        args=(q, list(range(100)))
    )
    p.start()
    p.join()

    # Читаем все данные
    items = []
    while not q.empty():
        items.append(q.get())
    print(f"Получено {len(items)} элементов")`,
  },
  {
    name: "multiprocessing.Queue.cancel_join_thread()",

    description:
      "Отменяет автоматический вызов join_thread() при завершении процесса. Позволяет процессу завершиться немедленно, не дожидаясь отправки буферизованных данных. Данные в буфере могут быть потеряны. Используется только когда потеря данных допустима.",
    syntax: "queue.cancel_join_thread()",
    arguments: [],
    example: `import multiprocessing

def fast_exit_producer(q):
    for i in range(1000):
        q.put(i)
    # Разрешаем процессу завершиться немедленно
    # без ожидания отправки всех данных
    q.cancel_join_thread()
    print("Процесс завершается (данные могут быть потеряны)")

if __name__ == '__main__':
    q = multiprocessing.Queue()
    p = multiprocessing.Process(target=fast_exit_producer, args=(q,))
    p.start()
    p.join()

    # Некоторые элементы могут не дойти!
    count = 0
    while not q.empty():
        q.get()
        count += 1
    print(f"Получено: {count} из 1000 (часть потеряна)")`,
  },
  {
    name: "multiprocessing.JoinableQueue.task_done()",

    description:
      "Сигнализирует, что обработка ранее извлечённого элемента завершена. Работает аналогично queue.Queue.task_done() — уменьшает счётчик незавершённых задач. Должен вызываться после каждого get(). Вызов большее количество раз, чем get() — ValueError.",
    syntax: "joinable_queue.task_done()",
    arguments: [],
    example: `import multiprocessing

def worker(q):
    while True:
        item = q.get()
        if item is None:
            q.task_done()
            break
        print(f"Обрабатываю: {item}")
        # ... обработка задачи ...
        q.task_done()  # сообщаем о завершении

if __name__ == '__main__':
    q = multiprocessing.JoinableQueue()

    p = multiprocessing.Process(target=worker, args=(q,))
    p.start()

    for task in ['задача-1', 'задача-2', 'задача-3']:
        q.put(task)

    q.join()    # ждём task_done() для всех элементов
    q.put(None) # сигнал воркеру остановиться
    p.join()`,
  },
  {
    name: "multiprocessing.JoinableQueue.join()",

    description:
      "Блокирует вызывающий процесс до тех пор, пока все элементы в JoinableQueue не будут обработаны (task_done() вызван для каждого). Аналог queue.Queue.join(), но для межпроцессного взаимодействия. Счётчик увеличивается при put() и уменьшается при task_done().",
    syntax: "joinable_queue.join()",
    arguments: [],
    example: `import multiprocessing

def batch_worker(q, results):
    while True:
        item = q.get()
        if item is None:
            q.task_done()
            break
        results.append(item ** 2)
        q.task_done()

if __name__ == '__main__':
    q = multiprocessing.JoinableQueue()
    manager = multiprocessing.Manager()
    results = manager.list()

    workers = [
        multiprocessing.Process(target=batch_worker, args=(q, results))
        for _ in range(4)
    ]
    for w in workers:
        w.start()

    for i in range(20):
        q.put(i)

    q.join()  # ждём обработки всех 20 задач
    print(f"Обработано задач: {len(results)}")

    for _ in workers:
        q.put(None)
    for w in workers:
        w.join()`,
  },
  {
    name: "multiprocessing.Connection.send(obj)",

    description:
      "Отправляет объект obj через соединение. Объект сериализуется через pickle перед отправкой — должен быть picklable. Принимающий конец читает данные через recv(). Используется с multiprocessing.Pipe() для двустороннего или одностороннего обмена между процессами.",
    syntax: "connection.send(obj)",
    arguments: [
      {
        name: "obj",
        description: "Любой picklable объект Python для передачи через канал.",
      },
    ],
    example: `import multiprocessing

def child(conn):
    data = conn.recv()
    print(f"Дочерний получил: {data}")
    conn.send(data * 2)  # отправляем результат обратно
    conn.close()

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe()

    p = multiprocessing.Process(target=child, args=(child_conn,))
    p.start()

    parent_conn.send({'number': 21, 'label': 'ответ'})
    result = parent_conn.recv()
    print(f"Родитель получил: {result}")
    # {'number': 21, 'label': 'ответ', ...} * 2 не работает для dict
    p.join()`,
  },
  {
    name: "multiprocessing.Connection.recv()",

    description:
      "Получает объект, отправленный через send(). Блокирует вызывающий процесс до поступления данных. Десериализует объект из pickle. Если соединение закрыто и буфер пуст — возбуждает EOFError.",
    syntax: "connection.recv()",
    arguments: [],
    example: `import multiprocessing
import time

def producer(conn):
    for i in range(3):
        time.sleep(0.3)
        conn.send(f"сообщение-{i}")
    conn.send(None)  # сигнал завершения
    conn.close()

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe(duplex=False)
    # duplex=False — однонаправленный: child отправляет, parent получает

    p = multiprocessing.Process(target=producer, args=(child_conn,))
    p.start()

    while True:
        msg = parent_conn.recv()  # блокирует до прихода данных
        if msg is None:
            break
        print(f"Получено: {msg}")

    p.join()`,
  },
  {
    name: "multiprocessing.Connection.fileno()",

    description:
      "Возвращает целочисленный файловый дескриптор (fd) соединения. Используется для низкоуровневой работы с select.select() или selectors — позволяет ожидать данные из нескольких соединений одновременно без блокировки.",
    syntax: "connection.fileno()",
    arguments: [],
    example: `import multiprocessing
import select

def sender(conn, items):
    for item in items:
        conn.send(item)
    conn.close()

if __name__ == '__main__':
    conns = []
    processes = []
    for i in range(3):
        parent, child = multiprocessing.Pipe(duplex=False)
        p = multiprocessing.Process(target=sender, args=(child, [i * 10, i * 20]))
        p.start()
        conns.append(parent)
        processes.append(p)

    fd_map = {c.fileno(): c for c in conns}

    # Ожидаем данные из любого соединения:
    readable, _, _ = select.select(fd_map.keys(), [], [], 2.0)
    for fd in readable:
        print(fd_map[fd].recv())`,
  },
  {
    name: "multiprocessing.Connection.close()",

    description:
      "Закрывает соединение. После закрытия любой вызов send() или recv() возбуждает OSError. Если другой конец пытается recv() после закрытия — получает EOFError. Соединения закрываются автоматически при сборке мусора, но явный вызов предпочтителен.",
    syntax: "connection.close()",
    arguments: [],
    example: `import multiprocessing

def worker(conn):
    result = conn.recv() ** 2
    conn.send(result)
    conn.close()  # явно закрываем свой конец

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe()

    p = multiprocessing.Process(target=worker, args=(child_conn,))
    p.start()

    parent_conn.send(7)
    print(parent_conn.recv())  # 49

    parent_conn.close()  # закрываем родительский конец
    p.join()

    # Использование как контекстного менеджера:
    with multiprocessing.Pipe()[0] as conn:
        pass  # close() вызывается автоматически`,
  },
  {
    name: "multiprocessing.Connection.poll([timeout])",

    description:
      "Проверяет, есть ли данные, доступные для чтения. Возвращает True если данные есть. Если timeout не задан — возвращает результат немедленно (неблокирующий). С timeout=None — блокирует до поступления данных. Позволяет избежать блокирующего recv().",
    syntax: "connection.poll([timeout])",
    arguments: [
      {
        name: "timeout",
        description:
          "Время ожидания в секундах. 0 или отсутствие — немедленная проверка. None — блокирует до появления данных.",
      },
    ],
    example: `import multiprocessing
import time

def slow_sender(conn):
    time.sleep(1.0)
    conn.send("данные готовы")

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe(duplex=False)

    p = multiprocessing.Process(target=slow_sender, args=(child_conn,))
    p.start()

    # Неблокирующая проверка
    print(parent_conn.poll())       # False — данных ещё нет
    print(parent_conn.poll(0.5))    # False — 0.5 с недостаточно
    print(parent_conn.poll(2.0))    # True  — данные появились

    print(parent_conn.recv())  # данные готовы
    p.join()`,
  },
  {
    name: "multiprocessing.Connection.send_bytes(buffer[, offset[, size]])",

    description:
      "Отправляет сырые байты из буфера через соединение без сериализации pickle. Быстрее send() для бинарных данных — нет накладных расходов на pickle. Принимающий конец читает данные через recv_bytes() или recv_bytes_into().",
    syntax: "connection.send_bytes(buffer[, offset[, size]])",
    arguments: [
      {
        name: "buffer",
        description:
          "Bytes-like объект с данными для отправки (bytes, bytearray, memoryview).",
      },
      {
        name: "offset",
        description: "Начальная позиция в буфере. По умолчанию 0.",
      },
      {
        name: "size",
        description:
          "Количество байт для отправки. По умолчанию — весь буфер начиная с offset.",
      },
    ],
    example: `import multiprocessing
import array

def receiver(conn):
    raw = conn.recv_bytes()
    arr = array.array('i')
    arr.frombytes(raw)
    print(f"Получен массив: {arr.tolist()}")

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe(duplex=False)

    p = multiprocessing.Process(target=receiver, args=(child_conn,))
    p.start()

    # Отправляем бинарные данные напрямую
    data = array.array('i', [1, 2, 3, 4, 5])
    parent_conn.send_bytes(data.tobytes())

    # Отправка части буфера:
    buf = b'Hello, World!'
    parent_conn.send_bytes(buf, offset=7, size=5)  # 'World'

    p.join()`,
  },
  {
    name: "multiprocessing.Connection.recv_bytes([maxlength])",

    description:
      "Получает сырые байты, отправленные через send_bytes(). Блокирует до поступления данных. Если полученное сообщение длиннее maxlength — возбуждает OSError и соединение становится непригодным. Возвращает объект bytes.",
    syntax: "connection.recv_bytes([maxlength])",
    arguments: [
      {
        name: "maxlength",
        description:
          "Максимально допустимый размер сообщения в байтах. Если сообщение длиннее — возбуждает OSError.",
      },
    ],
    example: `import multiprocessing

def image_sender(conn):
    # Имитация отправки бинарных данных (изображение, файл и т.д.)
    fake_image = bytes(range(256)) * 10  # 2560 байт
    conn.send_bytes(fake_image)
    conn.close()

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe(duplex=False)

    p = multiprocessing.Process(target=image_sender, args=(child_conn,))
    p.start()

    raw_data = parent_conn.recv_bytes()
    print(f"Получено байт: {len(raw_data)}")  # 2560

    # С ограничением размера:
    # raw_data = parent_conn.recv_bytes(maxlength=1000)
    # OSError если > 1000 байт

    p.join()`,
  },
  {
    name: "multiprocessing.Connection.recv_bytes_into(buffer[, offset])",

    description:
      "Получает байты в существующий буфер (без создания нового объекта bytes). Более эффективно по памяти, чем recv_bytes() — особенно при работе с большими данными и заранее выделенными буферами. Возвращает число прочитанных байт.",
    syntax: "connection.recv_bytes_into(buffer[, offset])",
    arguments: [
      {
        name: "buffer",
        description:
          "Записываемый bytes-like объект (bytearray, array, memoryview) для приёма данных.",
      },
      {
        name: "offset",
        description:
          "Позиция в буфере, начиная с которой записываются данные. По умолчанию 0.",
      },
    ],
    example: `import multiprocessing
import array

def data_sender(conn):
    data = array.array('d', [3.14, 2.71, 1.41, 1.73])
    conn.send_bytes(data.tobytes())
    conn.close()

if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe(duplex=False)

    p = multiprocessing.Process(target=data_sender, args=(child_conn,))
    p.start()

    # Заранее выделяем буфер нужного размера
    buf = bytearray(4 * 8)  # 4 double по 8 байт = 32 байта
    n = parent_conn.recv_bytes_into(buf)
    print(f"Прочитано байт: {n}")  # 32

    result = array.array('d')
    result.frombytes(buf)
    print(result.tolist())  # [3.14, 2.71, 1.41, 1.73]

    p.join()`,
  },
  {
    name: "multiprocessing.Value.value",
    description: `Атрибут объекта Value из модуля multiprocessing.sharedctypes. Обеспечивает доступ к числовому значению, хранящемуся в разделяемой памяти, из нескольких процессов одновременно.

Value создаётся через multiprocessing.Value(typecode, value) и размещает одно значение в общей памяти. Атрибут .value используется как для чтения, так и для записи этого значения.

Объект Value по умолчанию создаётся с блокировкой (Lock), поэтому доступ через .value потокобезопасен в большинстве сценариев. Для составных операций (чтение-изменение-запись) необходимо явно использовать контекстный менеджер with val.get_lock():.`,
    syntax: "val.value",
    arguments: [],
    example: `import multiprocessing

# Создание разделяемого значения (тип 'i' — целое число)
counter = multiprocessing.Value('i', 0)

def increment(val, n):
    for _ in range(n):
        with val.get_lock():   # явная блокировка для составных операций
            val.value += 1

processes = [
    multiprocessing.Process(target=increment, args=(counter, 1000))
    for _ in range(4)
]
for p in processes:
    p.start()
for p in processes:
    p.join()

print(counter.value)  # 4000

# Другие типы Value:
flag = multiprocessing.Value('b', False)   # байт (bool)
result = multiprocessing.Value('d', 0.0)   # double (float)

# Чтение и запись
flag.value = True
print(flag.value)   # True`,
  },
  {
    name: "multiprocessing.Array.typecode",
    description: `Атрибут объекта Array из модуля multiprocessing.sharedctypes. Возвращает символ типа (typecode), который был задан при создании массива в разделяемой памяти.

Array создаётся через multiprocessing.Array(typecode, size_or_initializer) и размещает массив фиксированного размера в общей памяти. Атрибут .typecode позволяет узнать тип элементов массива без обращения к ctypes.

Символы типов совпадают со стандартным модулем array Python:
- 'b' / 'B' — signed/unsigned byte
- 'h' / 'H' — signed/unsigned short
- 'i' / 'I' — signed/unsigned int
- 'l' / 'L' — signed/unsigned long
- 'f' — float
- 'd' — double
- 'c' — char (bytes)`,
    syntax: "arr.typecode",
    arguments: [],
    example: `import multiprocessing

# Создание разделяемого массива целых чисел
arr = multiprocessing.Array('i', [1, 2, 3, 4, 5])
print(arr.typecode)   # 'i'

# Создание массива чисел с плавающей точкой
farr = multiprocessing.Array('d', 10)  # 10 элементов, инициализированы 0.0
print(farr.typecode)  # 'd'

# Работа с массивом из нескольких процессов
def fill_array(shared_arr, start, value):
    for i in range(start, start + 2):
        shared_arr[i] = value

data = multiprocessing.Array('i', 6)
p1 = multiprocessing.Process(target=fill_array, args=(data, 0, 10))
p2 = multiprocessing.Process(target=fill_array, args=(data, 2, 20))
p3 = multiprocessing.Process(target=fill_array, args=(data, 4, 30))
for p in [p1, p2, p3]:
    p.start()
for p in [p1, p2, p3]:
    p.join()

print(list(data))       # [10, 10, 20, 20, 30, 30]
print(data.typecode)    # 'i'`,
  },
  {
    name: "multiprocessing.Manager.start()",
    description: `Метод запуска серверного процесса менеджера. Запускает отдельный процесс-сервер, который будет управлять разделяемыми объектами (dict, list, Value, Array и др.) и предоставлять к ним доступ другим процессам через прокси-объекты.

Менеджер создаётся через multiprocessing.Manager() или SyncManager(). После вызова start() менеджер готов к созданию разделяемых объектов. Аргументы initializer и initargs позволяют выполнить инициализационный код в серверном процессе перед началом обслуживания.

После завершения работы менеджер необходимо остановить через shutdown() или использовать контекстный менеджер with multiprocessing.Manager() as m:.`,
    syntax: "Manager.start([initializer[, initargs]])",
    arguments: [
      {
        name: "initializer",
        description:
          "Callable-объект, вызываемый при старте серверного процесса менеджера. Если None — инициализация не выполняется.",
      },
      {
        name: "initargs",
        description:
          "Кортеж аргументов, передаваемых в initializer. По умолчанию ().",
      },
    ],
    example: `import multiprocessing
from multiprocessing.managers import BaseManager

# Вариант 1: через контекстный менеджер (рекомендуется)
with multiprocessing.Manager() as manager:
    shared_dict = manager.dict()
    shared_list = manager.list()
    # менеджер автоматически остановится при выходе из блока

# Вариант 2: явный вызов start() и shutdown()
manager = multiprocessing.Manager()
manager.start()
shared = manager.dict({'key': 'value'})
# работа с shared...
manager.shutdown()

# Вариант 3: с инициализатором
def init_worker(db_url):
    import sqlite3
    global conn
    conn = sqlite3.connect(db_url)

manager = multiprocessing.Manager()
manager.start(initializer=init_worker, initargs=(':memory:',))
manager.shutdown()`,
  },
  {
    name: "multiprocessing.Manager.shutdown()",
    description: `Метод остановки серверного процесса менеджера. Завершает серверный процесс, управляющий разделяемыми объектами, и освобождает связанные ресурсы.

После вызова shutdown() все прокси-объекты, созданные через этот менеджер (dict, list, Value и др.), становятся недоступными — попытка обратиться к ним вызовет исключение. Вызывается автоматически при использовании контекстного менеджера with Manager() as m:.

Если менеджер создан через multiprocessing.Manager() (без явного управления), следует вызывать shutdown() в блоке finally или использовать with-синтаксис для гарантированного освобождения ресурсов.`,
    syntax: "Manager.shutdown()",
    arguments: [],
    example: `import multiprocessing

# Безопасное завершение через with (рекомендуется)
with multiprocessing.Manager() as m:
    data = m.dict()
    data['status'] = 'running'
    # shutdown() вызывается автоматически

# Явный вызов в блоке try/finally
manager = multiprocessing.Manager()
try:
    shared = manager.list([1, 2, 3])
    # обработка...
    p = multiprocessing.Process(target=lambda lst: lst.append(4), args=(shared,))
    p.start()
    p.join()
    print(list(shared))  # [1, 2, 3, 4]
finally:
    manager.shutdown()  # всегда завершаем менеджер

# После shutdown() прокси недоступны:
# shared.append(5)  → исключение`,
  },
  {
    name: "multiprocessing.Manager.join()",
    description: `Метод ожидания завершения серверного процесса менеджера. Блокирует выполнение текущего процесса до тех пор, пока серверный процесс менеджера не завершится.

Обычно вызывается после shutdown() для гарантии полного завершения серверного процесса перед продолжением основной программы. Если не вызвать join(), серверный процесс может остаться как зомби-процесс до завершения родительского.

При использовании контекстного менеджера with Manager() as m: вызовы shutdown() и join() происходят автоматически.`,
    syntax: "Manager.join()",
    arguments: [],
    example: `import multiprocessing

# Явное использование shutdown() + join()
manager = multiprocessing.Manager()
shared_data = manager.dict()

def worker(d, key, value):
    d[key] = value

processes = [
    multiprocessing.Process(target=worker, args=(shared_data, f'key{i}', i))
    for i in range(5)
]
for p in processes:
    p.start()
for p in processes:
    p.join()

print(dict(shared_data))  # {'key0': 0, 'key1': 1, ...}

manager.shutdown()
manager.join()   # ждём полного завершения серверного процесса

# Контекстный менеджер делает это автоматически:
with multiprocessing.Manager() as m:
    d = m.dict()
    # ...
# здесь shutdown() и join() уже вызваны`,
  },
  {
    name: "multiprocessing.Manager.dict()",
    description: `Метод создания разделяемого словаря. Возвращает прокси-объект, ссылающийся на словарь, хранящийся в серверном процессе менеджера. Поддерживает все стандартные операции dict: чтение, запись, удаление, итерация, методы keys(), values(), items() и др.

В отличие от обычного dict, разделяемый словарь безопасен для использования из нескольких процессов одновременно — все операции проксируются через менеджер и выполняются атомарно на стороне сервера.

Важно: составные операции (проверка + запись) не атомарны без дополнительной синхронизации. Также изменение вложенных мутабельных объектов (например, список внутри dict) не отслеживается автоматически — нужно переприсваивать значение.`,
    syntax: "Manager.dict([iterable[, kwds]])",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект пар (ключ, значение) или другой словарь для инициализации. Если не указан — создаётся пустой словарь.",
      },
      {
        name: "kwds",
        description:
          "Именованные аргументы, добавляемые в словарь при создании. Аналогично dict(a=1, b=2).",
      },
    ],
    example: `import multiprocessing

def worker(shared_dict, key, value):
    shared_dict[key] = value

with multiprocessing.Manager() as m:
    # Пустой словарь
    d = m.dict()

    # Инициализация из существующего словаря
    d2 = m.dict({'a': 1, 'b': 2})

    # Инициализация через kwds
    d3 = m.dict(x=10, y=20)

    # Параллельная запись из нескольких процессов
    processes = [
        multiprocessing.Process(target=worker, args=(d, f'key{i}', i * 10))
        for i in range(5)
    ]
    for p in processes:
        p.start()
    for p in processes:
        p.join()

    print(dict(d))  # {'key0': 0, 'key1': 10, 'key2': 20, ...}

    # Внимание: вложенные изменения нужно переприсваивать
    d['list'] = [1, 2, 3]
    tmp = d['list']
    tmp.append(4)
    d['list'] = tmp   # обязательно переприсвоить!`,
  },
  {
    name: "multiprocessing.Manager.list()",
    description: `Метод создания разделяемого списка. Возвращает прокси-объект, ссылающийся на список, хранящийся в серверном процессе менеджера. Поддерживает все стандартные операции list: append, extend, insert, remove, pop, индексирование, срезы и итерацию.

Разделяемый список безопасен для использования из нескольких процессов одновременно. Все операции проксируются через менеджер.

Как и у Manager.dict(), изменения вложенных мутабельных объектов не распространяются автоматически — необходимо явно переприсваивать элемент. Для частых операций append из множества процессов рассмотрите использование Queue для лучшей производительности.`,
    syntax: "Manager.list([iterable])",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект для инициализации списка. Если не указан — создаётся пустой список.",
      },
    ],
    example: `import multiprocessing

def collect_results(shared_list, value):
    shared_list.append(value ** 2)

with multiprocessing.Manager() as m:
    # Пустой список
    results = m.list()

    # Инициализация из итерируемого объекта
    data = m.list([10, 20, 30])
    print(list(data))   # [10, 20, 30]

    # Параллельное заполнение из процессов
    processes = [
        multiprocessing.Process(target=collect_results, args=(results, i))
        for i in range(1, 6)
    ]
    for p in processes:
        p.start()
    for p in processes:
        p.join()

    print(sorted(results))  # [1, 4, 9, 16, 25]

    # Стандартные операции списка
    data.append(40)
    data.extend([50, 60])
    data.insert(0, 5)
    print(data[0])      # 5
    print(len(data))    # 6

    # Изменение вложенного списка — нужно переприсваивать
    data[0] = [1, 2]
    inner = data[0]
    inner.append(3)
    data[0] = inner     # обязательно переприсвоить!`,
  },
  {
    name: "multiprocessing.Manager.Value()",
    description: `Метод создания разделяемого скалярного значения через менеджер. Возвращает прокси-объект с атрибутом .value для доступа к значению из нескольких процессов.

В отличие от multiprocessing.Value() (разделяемая память через ctypes), Manager.Value() хранит значение в серверном процессе менеджера и доступно через прокси. Это медленнее, но позволяет работать с нестандартными типами данных и использоваться в распределённых системах через RemoteManager.

Объект поддерживает тот же интерфейс, что и multiprocessing.Value: атрибут .value для чтения и записи. Синхронизация обеспечивается менеджером автоматически.`,
    syntax: "Manager.Value(typecode, value)",
    arguments: [
      {
        name: "typecode",
        description:
          "Символ типа данных (как в модуле array): 'i' — int, 'd' — double, 'f' — float, 'b' — byte и др.",
      },
      { name: "value", description: "Начальное значение переменной." },
    ],
    example: `import multiprocessing

def increment(shared_val, n):
    for _ in range(n):
        shared_val.value += 1  # не атомарно — нужна внешняя синхронизация

with multiprocessing.Manager() as m:
    # Создание разделяемого целого числа
    counter = m.Value('i', 0)
    print(counter.value)   # 0

    # Создание разделяемого числа с плавающей точкой
    score = m.Value('d', 3.14)
    print(score.value)     # 3.14

    # Изменение значения
    counter.value = 42
    score.value += 1.0

    # Использование из нескольких процессов (с блокировкой)
    lock = m.Lock()
    total = m.Value('i', 0)

    def safe_increment(val, lk, n):
        for _ in range(n):
            with lk:
                val.value += 1

    procs = [
        multiprocessing.Process(target=safe_increment, args=(total, lock, 100))
        for _ in range(4)
    ]
    for p in procs:
        p.start()
    for p in procs:
        p.join()
    print(total.value)   # 400`,
  },
  {
    name: "multiprocessing.Manager.Array()",
    description: `Метод создания разделяемого массива фиксированного размера через менеджер. Возвращает прокси-объект, предоставляющий доступ к массиву из нескольких процессов.

В отличие от multiprocessing.Array() (разделяемая память через ctypes), Manager.Array() хранит массив в серверном процессе менеджера. Это позволяет использовать его в сценариях с RemoteManager и не ограничивает тип данных ctypes.

Поддерживает индексирование, срезы и итерацию. Атрибут .typecode возвращает тип элементов. Изменения через индекс (arr[i] = x) проксируются через менеджер и видны всем процессам.`,
    syntax: "Manager.Array(typecode, sequence)",
    arguments: [
      {
        name: "typecode",
        description:
          "Символ типа данных элементов массива: 'i' — int, 'd' — double, 'f' — float, 'b' — byte, 'c' — char и др.",
      },
      {
        name: "sequence",
        description:
          "Последовательность (список, кортеж) для инициализации массива, либо целое число — размер массива (элементы инициализируются нулями).",
      },
    ],
    example: `import multiprocessing

def fill_segment(arr, start, end, value):
    for i in range(start, end):
        arr[i] = value

with multiprocessing.Manager() as m:
    # Инициализация из списка
    arr = m.Array('i', [0, 1, 2, 3, 4, 5, 6, 7])
    print(list(arr))        # [0, 1, 2, 3, 4, 5, 6, 7]
    print(arr.typecode)     # 'i'

    # Инициализация нулями (задаём размер числом)
    farr = m.Array('d', 5)  # 5 элементов double = 0.0
    print(list(farr))       # [0.0, 0.0, 0.0, 0.0, 0.0]

    # Параллельная запись в разные сегменты
    procs = [
        multiprocessing.Process(target=fill_segment, args=(arr, i*2, i*2+2, (i+1)*10))
        for i in range(4)
    ]
    for p in procs:
        p.start()
    for p in procs:
        p.join()

    print(list(arr))   # [10, 10, 20, 20, 30, 30, 40, 40]

    # Срезы и индексирование
    print(arr[0])      # 10
    print(arr[2:4])    # [20, 20]`,
  },
  {
    name: "json.dump()",
    description: `Сериализует объект Python в JSON и записывает результат в файловый объект (file-like object). Является основной функцией для записи JSON в файл.

Поддерживает следующие типы Python → JSON:
- dict → object, list/tuple → array, str → string
- int/float → number, True/False → true/false, None → null

Функция не возвращает строку — результат сразу пишется в fp. Для получения JSON как строки используйте json.dumps(). Кодировка файла должна совпадать с ожидаемой (по умолчанию ensure_ascii=True гарантирует ASCII-совместимость).`,
    syntax:
      "json.dump(obj, fp, *, skipkeys=False, ensure_ascii=True, check_circular=True, allow_nan=True, cls=None, indent=None, separators=None, default=None, sort_keys=False, **kw)",
    arguments: [
      {
        name: "obj",
        description:
          "Сериализуемый объект Python (dict, list, str, int, float, bool, None).",
      },
      {
        name: "fp",
        description:
          "Файловый объект с методом write(), куда записывается JSON. Например, открытый через open().",
      },
      {
        name: "skipkeys",
        description:
          "Если True — ключи словаря нестандартных типов (не str/int/float/bool/None) пропускаются без исключения. По умолчанию False.",
      },
      {
        name: "ensure_ascii",
        description:
          "Если True (по умолчанию) — все не-ASCII символы экранируются (\\uXXXX). Если False — символы Unicode записываются как есть.",
      },
      {
        name: "check_circular",
        description:
          "Если True (по умолчанию) — проверяет цикличные ссылки. Если False — при цикличных ссылках возникнет RecursionError.",
      },
      {
        name: "allow_nan",
        description:
          "Если True (по умолчанию) — float('nan'), float('inf'), float('-inf') записываются как NaN, Infinity, -Infinity (нестандартный JSON). Если False — бросается ValueError.",
      },
      {
        name: "indent",
        description:
          "Отступ для форматирования: целое число (количество пробелов) или строка (например, '\\t'). None — компактный вывод без отступов.",
      },
      {
        name: "separators",
        description:
          "Кортеж (item_separator, key_separator). По умолчанию (', ', ': ') или (',', ':') при indent=None.",
      },
      {
        name: "default",
        description:
          "Функция, вызываемая для объектов, которые не сериализуются стандартно. Должна вернуть сериализуемый объект или бросить TypeError.",
      },
      {
        name: "sort_keys",
        description:
          "Если True — ключи словарей сортируются по алфавиту. Полезно для воспроизводимых результатов.",
      },
    ],
    example: `import json

data = {
    'name': 'Иван',
    'age': 30,
    'languages': ['Python', 'JavaScript'],
    'active': True,
    'score': None,
}

# Запись в файл
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
# data.json:
# {
#     "name": "Иван",
#     "age": 30,
#     "languages": ["Python", "JavaScript"],
#     "active": true,
#     "score": null
# }

# Компактный вывод без отступов
with open('compact.json', 'w') as f:
    json.dump(data, f, separators=(',', ':'))

# Кастомный default для несериализуемых типов
from datetime import datetime

def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f'Не сериализуем: {type(obj)}')

event = {'name': 'Запуск', 'time': datetime(2024, 1, 15, 12, 0)}
with open('event.json', 'w') as f:
    json.dump(event, f, default=default_serializer)
# {"name": "Запуск", "time": "2024-01-15T12:00:00"}`,
  },
  {
    name: "json.dumps()",
    description: `Сериализует объект Python в JSON-строку и возвращает её. Функционально идентична json.dump(), но вместо записи в файл возвращает строку.

Используется когда нужно:
- передать JSON в HTTP-ответе или запросе
- сохранить JSON в переменной для дальнейшей обработки
- логировать данные в JSON-формате

Все параметры, кроме fp, идентичны json.dump(). Для записи JSON в файл используйте json.dump() — это эффективнее, чем dumps() + write().`,
    syntax:
      "json.dumps(obj, *, skipkeys=False, ensure_ascii=True, check_circular=True, allow_nan=True, cls=None, indent=None, separators=None, default=None, sort_keys=False, **kw)",
    arguments: [
      { name: "obj", description: "Сериализуемый объект Python." },
      {
        name: "skipkeys",
        description:
          "Если True — ключи нестандартных типов пропускаются. По умолчанию False.",
      },
      {
        name: "ensure_ascii",
        description:
          "Если True (по умолчанию) — не-ASCII символы экранируются. Если False — Unicode записывается как есть.",
      },
      {
        name: "check_circular",
        description: "Проверка цикличных ссылок. По умолчанию True.",
      },
      {
        name: "allow_nan",
        description: "Разрешить NaN, Infinity, -Infinity. По умолчанию True.",
      },
      {
        name: "indent",
        description:
          "Отступ для форматирования (число пробелов или строка). None — компактный вывод.",
      },
      {
        name: "separators",
        description:
          "Кортеж (item_separator, key_separator) для управления разделителями.",
      },
      {
        name: "default",
        description: "Функция для обработки несериализуемых объектов.",
      },
      {
        name: "sort_keys",
        description: "Сортировать ключи словарей. По умолчанию False.",
      },
    ],
    example: `import json

data = {'id': 1, 'name': 'Продукт', 'price': 99.99, 'in_stock': True}

# Базовая сериализация
s = json.dumps(data)
print(s)
# '{"id": 1, "name": "Продукт", "price": 99.99, "in_stock": true}'

# Красивый вывод с отступами
pretty = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True)
print(pretty)
# {
#   "id": 1,
#   "in_stock": true,
#   "name": "Продукт",
#   "price": 99.99
# }

# Компактный вывод (минимум пробелов)
compact = json.dumps(data, separators=(',', ':'))
print(compact)
# '{"id":1,"name":"Продукт","price":99.99,"in_stock":true}'

# Использование в HTTP-ответе (Django)
from django.http import HttpResponse

def api_view(request):
    payload = {'status': 'ok', 'data': [1, 2, 3]}
    return HttpResponse(
        json.dumps(payload, ensure_ascii=False),
        content_type='application/json; charset=utf-8'
    )

# Кастомный encoder через класс
class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return sorted(obj)
        return super().default(obj)

print(json.dumps({'tags': {3, 1, 2}}, cls=SetEncoder))
# '{"tags": [1, 2, 3]}'`,
  },
  {
    name: "json.load()",
    description: `Десериализует JSON из файлового объекта и возвращает соответствующий объект Python. Является основной функцией для чтения JSON из файла.

JSON → Python соответствие типов:
- object → dict, array → list, string → str
- number (int) → int, number (float) → float
- true/false → True/False, null → None

Параметры object_hook и object_pairs_hook позволяют кастомизировать парсинг объектов JSON — например, преобразовывать словари в экземпляры классов. Параметры parse_float и parse_int позволяют управлять точностью числовых значений.`,
    syntax:
      "json.load(fp, *, cls=None, object_hook=None, parse_float=None, parse_int=None, parse_constant=None, object_pairs_hook=None, **kw)",
    arguments: [
      {
        name: "fp",
        description:
          "Файловый объект с методом read(), содержащий JSON. Например, открытый через open().",
      },
      {
        name: "cls",
        description:
          "Кастомный класс JSONDecoder для парсинга. Если None — используется стандартный декодер.",
      },
      {
        name: "object_hook",
        description:
          "Функция, вызываемая для каждого JSON-объекта (dict). Принимает dict, возвращает любой объект — заменяет стандартный dict в результате.",
      },
      {
        name: "parse_float",
        description:
          "Callable для парсинга чисел с плавающей точкой. По умолчанию float. Можно заменить на decimal.Decimal для точных вычислений.",
      },
      {
        name: "parse_int",
        description: "Callable для парсинга целых чисел. По умолчанию int.",
      },
      {
        name: "parse_constant",
        description:
          "Устарело с Python 3.1. Callable для парсинга NaN, Infinity, -Infinity.",
      },
      {
        name: "object_pairs_hook",
        description:
          "Функция, вызываемая со списком пар (ключ, значение) для каждого JSON-объекта. Имеет приоритет над object_hook. Полезно для OrderedDict или обработки дублирующихся ключей.",
      },
    ],
    example: `import json
from decimal import Decimal

# Базовое чтение JSON из файла
with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(data['name'])   # Иван
print(type(data))     # <class 'dict'>

# object_hook — преобразование словарей в объекты
class User:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

def as_user(d):
    if 'name' in d and 'age' in d:
        return User(**d)
    return d

with open('user.json', 'r') as f:
    user = json.load(f, object_hook=as_user)
print(user.name)   # Иван

# parse_float — точные вычисления с Decimal
with open('prices.json', 'r') as f:
    prices = json.load(f, parse_float=Decimal)
# {"price": 99.99} → {'price': Decimal('99.99')}

# object_pairs_hook — сохранение порядка и дублей
from collections import OrderedDict

with open('config.json', 'r') as f:
    config = json.load(f, object_pairs_hook=OrderedDict)`,
  },
  {
    name: "json.loads()",
    description: `Десериализует JSON из строки (str, bytes или bytearray) и возвращает соответствующий объект Python. Функционально идентична json.load(), но принимает строку, а не файловый объект.

Используется когда JSON приходит как строка — из HTTP-ответа, базы данных, переменной окружения, сообщения очереди и т.д.

Начиная с Python 3.6 принимает также bytes и bytearray — они декодируются как UTF-8, UTF-16 или UTF-32 автоматически. При передаче некорректного JSON бросает json.JSONDecodeError (подкласс ValueError).`,
    syntax:
      "json.loads(s, *, cls=None, object_hook=None, parse_float=None, parse_int=None, parse_constant=None, object_pairs_hook=None, **kw)",
    arguments: [
      {
        name: "s",
        description:
          "Строка (str), байты (bytes) или bytearray с JSON-данными для парсинга.",
      },
      {
        name: "cls",
        description:
          "Кастомный класс JSONDecoder. Если None — используется стандартный.",
      },
      {
        name: "object_hook",
        description:
          "Функция, вызываемая для каждого JSON-объекта (dict). Позволяет преобразовывать объекты в кастомные типы.",
      },
      {
        name: "parse_float",
        description:
          "Callable для парсинга чисел с плавающей точкой. По умолчанию float. Используйте decimal.Decimal для точных вычислений.",
      },
      {
        name: "parse_int",
        description: "Callable для парсинга целых чисел. По умолчанию int.",
      },
      { name: "parse_constant", description: "Устарело с Python 3.1." },
      {
        name: "object_pairs_hook",
        description:
          "Функция со списком пар (ключ, значение) для каждого JSON-объекта. Имеет приоритет над object_hook.",
      },
    ],
    example: `import json
from decimal import Decimal

# Базовый парсинг строки
s = '{"name": "Анна", "age": 25, "active": true, "score": null}'
data = json.loads(s)
print(data)          # {'name': 'Анна', 'age': 25, 'active': True, 'score': None}
print(data['name'])  # Анна
print(type(data))    # <class 'dict'>

# Парсинг массива
arr = json.loads('[1, 2, 3, "four", true]')
print(arr)           # [1, 2, 3, 'four', True]

# Обработка ошибок
try:
    json.loads('{invalid json}')
except json.JSONDecodeError as e:
    print(f'Ошибка: {e.msg} на позиции {e.pos}')

# parse_float для точных финансовых расчётов
price_json = '{"price": 19.99, "tax": 1.50}'
prices = json.loads(price_json, parse_float=Decimal)
print(prices['price'])          # Decimal('19.99')
print(type(prices['price']))    # <class 'decimal.Decimal'>

# Парсинг ответа API (requests)
import urllib.request
with urllib.request.urlopen('https://api.example.com/data') as r:
    data = json.loads(r.read().decode('utf-8'))

# Парсинг bytes (Python 3.6+)
raw = b'{"status": "ok"}'
result = json.loads(raw)
print(result)   # {'status': 'ok'}`,
  },
  {
    name: "json.JSONEncoder.default()",
    description: `Метод, вызываемый для объектов, которые JSONEncoder не умеет сериализовать стандартно. Переопределяется в подклассах для добавления поддержки кастомных типов.

По умолчанию бросает TypeError. При переопределении метод должен либо вернуть JSON-сериализуемый объект (dict, list, str, int, float, bool, None), либо вызвать super().default(o) для стандартного поведения.

Вызывается автоматически из encode() и iterencode() при встрече несериализуемого объекта. Это основной способ расширения JSONEncoder — гораздо проще, чем переопределять encode() целиком.`,
    syntax: "JSONEncoder.default(o)",
    arguments: [
      {
        name: "o",
        description:
          "Несериализуемый объект, для которого нужно вернуть JSON-совместимое представление.",
      },
    ],
    example: `import json
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

class AdvancedEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        if isinstance(o, Decimal):
            return float(o)
        if isinstance(o, Enum):
            return o.value
        if hasattr(o, '__dict__'):
            return o.__dict__
        return super().default(o)  # бросит TypeError

class Status(Enum):
    ACTIVE = 'active'
    INACTIVE = 'inactive'

class User:
    def __init__(self, name, created):
        self.name = name
        self.created = created

data = {
    'user': User('Иван', datetime(2024, 1, 15)),
    'price': Decimal('99.99'),
    'status': Status.ACTIVE,
    'date': date(2024, 6, 1),
}

print(json.dumps(data, cls=AdvancedEncoder, ensure_ascii=False, indent=2))
# {
#   "user": {"name": "Иван", "created": "2024-01-15T00:00:00"},
#   "price": 99.99,
#   "status": "active",
#   "date": "2024-06-01"
# }`,
  },
  {
    name: "json.JSONEncoder.encode()",
    description: `Метод, сериализующий объект Python в JSON-строку. Является основным методом кодирования — именно он вызывается при использовании json.dumps() с кастомным cls.

Принимает один объект и возвращает строку. Для потоковой записи больших объектов используйте iterencode() — он возвращает итератор фрагментов, не загружая всё в память сразу.

Метод можно переопределить для полного контроля над процессом кодирования, однако обычно достаточно переопределить только default() для поддержки кастомных типов.`,
    syntax: "JSONEncoder.encode(o)",
    arguments: [
      {
        name: "o",
        description: "Объект Python для сериализации в JSON-строку.",
      },
    ],
    example: `import json

# Использование encode() напрямую
encoder = json.JSONEncoder(ensure_ascii=False, indent=2)
result = encoder.encode({'name': 'Мария', 'score': 42})
print(result)
# {
#   "name": "Мария",
#   "score": 42
# }

# encode() в подклассе
class PrettyEncoder(json.JSONEncoder):
    def encode(self, o):
        if isinstance(o, list):
            # компактный вывод для списков (всё в одну строку)
            return '[' + ', '.join(self.encode(item) for item in o) + ']'
        return super().encode(o)

enc = PrettyEncoder()
print(enc.encode([1, 2, 3]))        # [1, 2, 3]
print(enc.encode({'a': [1, 2]}))    # {"a": [1, 2]}

# json.dumps() использует encode() внутри
print(json.dumps([1, 2, 3], cls=PrettyEncoder))

# Эквивалентность:
encoder = json.JSONEncoder()
s1 = encoder.encode({'key': 'value'})
s2 = json.dumps({'key': 'value'})
print(s1 == s2)   # True`,
  },
  {
    name: "json.JSONEncoder.iterencode()",
    description: `Метод, возвращающий итератор фрагментов JSON-строки. Позволяет кодировать большие объекты по частям без загрузки всей строки в память — полезно для потоковой записи в файл или HTTP-ответ.

Каждый элемент итератора — это строковый фрагмент итогового JSON. Для получения полной строки можно объединить фрагменты через ''.join(encoder.iterencode(obj)).

Параметр _one_shot управляет внутренней оптимизацией (использование C-расширения). В большинстве случаев не требует изменений.`,
    syntax: "JSONEncoder.iterencode(o)",
    arguments: [
      {
        name: "o",
        description: "Объект Python для потоковой сериализации в JSON.",
      },
    ],
    example: `import json

data = {'items': list(range(1000)), 'name': 'Большой список'}

encoder = json.JSONEncoder()

# Потоковая запись в файл без загрузки в память
with open('large.json', 'w', encoding='utf-8') as f:
    for chunk in encoder.iterencode(data):
        f.write(chunk)

# Потоковый HTTP-ответ (Django/Flask)
def streaming_json_response():
    encoder = json.JSONEncoder(ensure_ascii=False)
    large_data = {'results': list(range(10000))}
    # StreamingHttpResponse принимает итератор
    from django.http import StreamingHttpResponse
    return StreamingHttpResponse(
        encoder.iterencode(large_data),
        content_type='application/json'
    )

# Объединение фрагментов в строку
encoder = json.JSONEncoder(indent=2)
obj = {'a': 1, 'b': [1, 2, 3]}
full_json = ''.join(encoder.iterencode(obj))
print(full_json)

# Просмотр фрагментов
for chunk in json.JSONEncoder().iterencode({'x': [1, 2]}):
    print(repr(chunk))
# '{"x"' → ': ' → '[1' → ', 2' → ']' → '}'`,
  },
  {
    name: "json.JSONEncoder.item_separator",
    description: `Атрибут класса JSONEncoder, задающий строку-разделитель между элементами массива и парами ключ-значение в объекте.

По умолчанию равен ', ' (запятая и пробел). При indent=None (компактный режим) json.dumps() автоматически использует ',' без пробела для минимизации размера.

Изменяется через параметр separators в виде кортежа (item_separator, key_separator) при вызове json.dumps() или json.JSONEncoder(). Кастомное значение item_separator полезно для создания NDJSON (Newline Delimited JSON) или других форматов.`,
    syntax: "JSONEncoder.item_separator",
    arguments: [],
    example: `import json

# Просмотр значений по умолчанию
enc = json.JSONEncoder()
print(repr(enc.item_separator))   # ', '
print(repr(enc.key_separator))    # ': '

# Изменение через separators
compact = json.dumps([1, 2, 3], separators=(',', ':'))
print(compact)    # [1,2,3]  ← item_separator = ','

pretty = json.dumps({'a': 1, 'b': 2}, separators=(', ', ': '))
print(pretty)     # {"a": 1, "b": 2}

# Кастомный encoder с изменёнными разделителями
class CompactEncoder(json.JSONEncoder):
    item_separator = ','
    key_separator = ':'

print(json.dumps({'x': [1, 2]}, cls=CompactEncoder))
# {"x":[1,2]}

# NDJSON: объекты разделены переносом строки, а не запятой
objects = [{'id': 1}, {'id': 2}, {'id': 3}]
ndjson = '\\n'.join(json.dumps(obj, separators=(',', ':')) for obj in objects)
print(ndjson)
# {"id":1}
# {"id":2}
# {"id":3}`,
  },
  {
    name: "json.JSONEncoder.key_separator",
    description: `Атрибут класса JSONEncoder, задающий строку-разделитель между ключом и значением в JSON-объекте.

По умолчанию равен ': ' (двоеточие и пробел). В компактном режиме (separators=(',', ':')) становится ':' без пробела.

Изменяется через параметр separators в виде кортежа (item_separator, key_separator). Вместе с item_separator управляет форматированием JSON — как читаемого для человека (с пробелами), так и минимального по размеру (без пробелов).`,
    syntax: "JSONEncoder.key_separator",
    arguments: [],
    example: `import json

# Значения по умолчанию
enc = json.JSONEncoder()
print(repr(enc.key_separator))    # ': '

# Стандартный вывод
print(json.dumps({'a': 1}))             # {"a": 1}  ← ': '

# Компактный вывод без пробелов
print(json.dumps({'a': 1}, separators=(',', ':')))   # {"a":1}

# Кастомный разделитель (нестандартный формат)
class ArrowEncoder(json.JSONEncoder):
    key_separator = ' => '
    item_separator = ' | '

print(json.dumps({'x': 1, 'y': 2}, cls=ArrowEncoder))
# {"x" => 1 | "y" => 2}

# Минимальный размер JSON для передачи по сети
data = {'status': 'ok', 'code': 200, 'data': [1, 2, 3]}
minimal = json.dumps(data, separators=(',', ':'))
print(f'Размер: {len(minimal)} байт')
# {"status":"ok","code":200,"data":[1,2,3]}
# Размер: 40 байт (против 45 со стандартными разделителями)`,
  },
  {
    name: "json.JSONEncoder.skipkeys",
    description: `Атрибут экземпляра JSONEncoder, определяющий поведение при встрече ключей словаря нестандартных типов (не str, int, float, bool, None).

По умолчанию False — при нестандартном ключе бросается TypeError. Если True — такие ключи молча пропускаются.

Задаётся через параметр skipkeys при создании JSONEncoder или через json.dumps(skipkeys=True). Полезно при работе с данными, где ключи могут быть кортежами или другими нехэшируемыми типами, но требуется продолжить сериализацию без прерывания.`,
    syntax: "JSONEncoder.skipkeys",
    arguments: [],
    example: `import json

data = {
    'valid_key': 'значение',
    (1, 2): 'кортеж-ключ',      # недопустимо в JSON
    42: 'числовой ключ',         # допустимо — будет "42"
    None: 'none-ключ',           # допустимо — будет "null"
    True: 'bool-ключ',           # допустимо — будет "true"
}

# skipkeys=False (по умолчанию) — бросает TypeError
try:
    json.dumps(data)
except TypeError as e:
    print(e)   # keys must be str, int, float, bool or None, not tuple

# skipkeys=True — кортеж-ключ пропускается
result = json.dumps(data, skipkeys=True, ensure_ascii=False)
print(result)
# {"valid_key": "значение", "42": "числовой ключ",
#  "null": "none-ключ", "true": "bool-ключ"}

# Проверка атрибута
enc = json.JSONEncoder(skipkeys=True)
print(enc.skipkeys)   # True

enc2 = json.JSONEncoder()
print(enc2.skipkeys)  # False`,
  },
  {
    name: "json.JSONEncoder.ensure_ascii",
    description: `Атрибут экземпляра JSONEncoder, управляющий экранированием не-ASCII символов в выводе.

По умолчанию True — все символы вне ASCII-диапазона экранируются как \\uXXXX. Это гарантирует совместимость результата с любой ASCII-системой, но увеличивает размер строки для текстов с кириллицей, китайскими иероглифами и другими Unicode-символами.

Если False — Unicode-символы записываются как есть, что уменьшает размер вывода и делает его читаемым. При записи в файл убедитесь, что файл открыт с правильной кодировкой (encoding='utf-8').`,
    syntax: "JSONEncoder.ensure_ascii",
    arguments: [],
    example: `import json

data = {'сообщение': 'Привет, мир!', 'emoji': '✓'}

# ensure_ascii=True (по умолчанию) — всё экранируется
s1 = json.dumps(data)
print(s1)
# {"\\u0441\\u043e\\u043e\\u0431\\u0449\\u0435\\u043d\\u0438\\u0435":
#  "\\u041f\\u0440\\u0438\\u0432\\u0435\\u0442, \\u043c\\u0438\\u0440!",
#  "emoji": "\\u2713"}

# ensure_ascii=False — Unicode как есть
s2 = json.dumps(data, ensure_ascii=False)
print(s2)
# {"сообщение": "Привет, мир!", "emoji": "✓"}

print(f'ASCII: {len(s1)} байт, Unicode: {len(s2)} байт')
# ASCII: 118 байт, Unicode: 40 байт

# Проверка атрибута
enc = json.JSONEncoder(ensure_ascii=False)
print(enc.ensure_ascii)   # False

# При записи в файл с ensure_ascii=False обязательна кодировка utf-8
with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)`,
  },
  {
    name: "json.JSONEncoder.check_circular",
    description: `Атрибут экземпляра JSONEncoder, определяющий, проверять ли объект на наличие циклических ссылок перед сериализацией.

По умолчанию True — перед кодированием каждого объекта JSONEncoder проверяет, не встречался ли он уже в текущем стеке вызовов. При обнаружении цикла бросается ValueError: Circular reference detected.

Если False — проверка не выполняется. Это незначительно ускоряет сериализацию, но при наличии цикличных ссылок возникнет RecursionError вместо понятного ValueError. Отключайте только если уверены в отсутствии циклов.`,
    syntax: "JSONEncoder.check_circular",
    arguments: [],
    example: `import json

# Создание циклической ссылки
a = {}
b = {'ref': a}
a['ref'] = b   # a → b → a (цикл)

# check_circular=True (по умолчанию) — понятная ошибка
try:
    json.dumps(a)
except ValueError as e:
    print(e)   # Circular reference detected

# check_circular=False — RecursionError (трудно отладить)
try:
    json.dumps(a, check_circular=False)
except RecursionError as e:
    print('Переполнение стека!')

# Корректный случай без цикла — check_circular=False безопасен
data = {'items': [1, 2, 3], 'nested': {'key': 'value'}}
result = json.dumps(data, check_circular=False)
print(result)   # {"items": [1, 2, 3], "nested": {"key": "value"}}

# Проверка атрибута
enc = json.JSONEncoder(check_circular=False)
print(enc.check_circular)   # False`,
  },
  {
    name: "json.JSONEncoder.allow_nan",
    description: `Атрибут экземпляра JSONEncoder, управляющий обработкой специальных значений float: NaN, Infinity и -Infinity.

По умолчанию True — эти значения записываются как NaN, Infinity, -Infinity (нестандартное расширение JSON, поддерживаемое JavaScript, но не соответствующее RFC 8259).

Если False — при встрече NaN, Infinity или -Infinity бросается ValueError. Используйте False для строгого соответствия стандарту JSON, если данные будут передаваться в системы, не поддерживающие NaN/Infinity.`,
    syntax: "JSONEncoder.allow_nan",
    arguments: [],
    example: `import json
import math

data = {
    'normal': 42.0,
    'nan': float('nan'),
    'inf': float('inf'),
    'neg_inf': float('-inf'),
    'pi': math.pi,
}

# allow_nan=True (по умолчанию) — нестандартный JSON
result = json.dumps(data)
print(result)
# {"normal": 42.0, "nan": NaN, "inf": Infinity, "neg_inf": -Infinity, "pi": 3.14...}

# allow_nan=False — строгий RFC 8259
try:
    json.dumps(data, allow_nan=False)
except ValueError as e:
    print(e)   # Out of range float values are not JSON compliant

# Обход: заменить NaN/Infinity перед сериализацией
def sanitize(obj):
    if isinstance(obj, float):
        if math.isnan(obj): return None
        if math.isinf(obj): return None
    return obj

# Кастомный encoder с обработкой NaN
class SafeEncoder(json.JSONEncoder):
    def default(self, o):
        return super().default(o)

    def iterencode(self, o, _one_shot=False):
        if isinstance(o, float) and (math.isnan(o) or math.isinf(o)):
            o = None
        return super().iterencode(o, _one_shot)`,
  },
  {
    name: "json.JSONEncoder.sort_keys",
    description: `Атрибут экземпляра JSONEncoder, определяющий, сортировать ли ключи словарей в алфавитном порядке при сериализации.

По умолчанию False — ключи записываются в порядке вставки (Python 3.7+ гарантирует сохранение порядка dict). Если True — ключи сортируются по алфавиту.

Сортировка полезна для:
- воспроизводимых результатов (при сравнении файлов через diff)
- читаемости вывода с предсказуемым порядком полей
- тестирования, где важна стабильность вывода`,
    syntax: "JSONEncoder.sort_keys",
    arguments: [],
    example: `import json

data = {'zebra': 3, 'apple': 1, 'mango': 2}

# sort_keys=False (по умолчанию) — порядок вставки
print(json.dumps(data))
# {"zebra": 3, "apple": 1, "mango": 2}

# sort_keys=True — алфавитный порядок
print(json.dumps(data, sort_keys=True))
# {"apple": 1, "mango": 2, "zebra": 3}

# Вложенные словари тоже сортируются
nested = {'z': {'b': 2, 'a': 1}, 'a': {'y': 9, 'x': 8}}
print(json.dumps(nested, sort_keys=True, indent=2))
# {
#   "a": {
#     "x": 8,
#     "y": 9
#   },
#   "z": {
#     "a": 1,
#     "b": 2
#   }
# }

# Использование в тестах для стабильного сравнения
import json

def assert_json_equal(obj1, obj2):
    s1 = json.dumps(obj1, sort_keys=True)
    s2 = json.dumps(obj2, sort_keys=True)
    assert s1 == s2, f'Объекты отличаются: {s1} != {s2}'`,
  },
  {
    name: "json.JSONEncoder.indent",
    description: `Атрибут экземпляра JSONEncoder, задающий отступ для форматирования JSON с переносами строк.

Если None (по умолчанию) — JSON выводится компактно в одну строку. Если задано целое число — каждый уровень вложенности отделяется указанным количеством пробелов. Если задана строка — используется она как отступ (например, '\\t' для табуляции).

При ненулевом indent автоматически добавляются переносы строк после каждого элемента массива и пары ключ-значение, что делает JSON читаемым для человека, но увеличивает размер файла.`,
    syntax: "JSONEncoder.indent",
    arguments: [],
    example: `import json

data = {'name': 'Python', 'version': 3.12, 'features': ['typing', 'async', 'dataclasses']}

# indent=None (по умолчанию) — компактный вывод
print(json.dumps(data))
# {"name": "Python", "version": 3.12, "features": ["typing", "async", "dataclasses"]}

# indent=4 — 4 пробела на каждый уровень
print(json.dumps(data, indent=4))
# {
#     "name": "Python",
#     "version": 3.12,
#     "features": [
#         "typing",
#         "async",
#         "dataclasses"
#     ]
# }

# indent=2 — самый популярный вариант
print(json.dumps(data, indent=2))

# indent='\\t' — табуляция
print(json.dumps(data, indent='\t'))

# Сравнение размеров
compact = json.dumps(data)
pretty = json.dumps(data, indent=4)
print(f'Компактный: {len(compact)} байт')
print(f'Читаемый:   {len(pretty)} байт')

# Проверка атрибута
enc = json.JSONEncoder(indent=2)
print(enc.indent)   # 2`,
  },
  {
    name: "json.JSONDecoder.decode()",
    description: `Метод десериализации JSON-строки в объект Python. Является основным методом класса JSONDecoder — именно он вызывается внутри json.loads().

Принимает строку с валидным JSON и возвращает соответствующий объект Python. Если строка содержит данные после корректного JSON-значения (например, пробелы или дополнительный текст) — бросает JSONDecodeError.

Для разбора строки, в которой JSON-значение находится не в начале, используйте raw_decode() — он принимает индекс начала.`,
    syntax: "JSONDecoder.decode(s)",
    arguments: [
      {
        name: "s",
        description:
          "Строка с JSON-данными. Должна содержать ровно одно JSON-значение (с возможными пробелами в конце).",
      },
    ],
    example: `import json

decoder = json.JSONDecoder()

# Базовое декодирование
result = decoder.decode('{"name": "Анна", "age": 25}')
print(result)          # {'name': 'Анна', 'age': 25}
print(type(result))    # <class 'dict'>

# Декодирование разных типов
print(decoder.decode('[1, 2, 3]'))        # [1, 2, 3]
print(decoder.decode('"строка"'))         # строка
print(decoder.decode('42'))               # 42
print(decoder.decode('true'))             # True
print(decoder.decode('null'))             # None

# Ошибка при лишних данных после JSON
try:
    decoder.decode('{"a": 1} лишний текст')
except json.JSONDecodeError as e:
    print(e)   # Extra data: line 1 column 9 (char 8)

# Пробелы в конце допустимы
print(decoder.decode('42   '))    # 42 — OK

# decode() эквивалентен json.loads()
s = '{"key": "value"}'
assert decoder.decode(s) == json.loads(s)`,
  },
  {
    name: "json.JSONDecoder.raw_decode()",
    description: `Метод декодирования JSON-значения из строки начиная с указанной позиции. В отличие от decode(), не требует, чтобы строка состояла только из JSON — он находит и парсит первое JSON-значение, начиная с idx, и возвращает кортеж (объект, конечная_позиция).

Полезен для разбора потоков данных, где JSON-значения идут подряд без явных разделителей, или для извлечения JSON из строки с дополнительным контентом (например, NDJSON, логи, смешанные форматы).

Возвращает tuple (obj, end), где end — индекс символа, следующего за распарсенным JSON. Это позволяет продолжить разбор с позиции end.`,
    syntax: "JSONDecoder.raw_decode(s, idx=0)",
    arguments: [
      {
        name: "s",
        description: "Строка, из которой нужно декодировать JSON-значение.",
      },
      {
        name: "idx",
        description:
          "Индекс символа в строке, с которого начинается поиск JSON-значения. По умолчанию 0 (начало строки).",
      },
    ],
    example: `import json

decoder = json.JSONDecoder()

# Базовый пример
obj, end = decoder.raw_decode('{"a": 1} лишний текст')
print(obj)    # {'a': 1}
print(end)    # 8  ← позиция после JSON

# Разбор с ненулевого индекса
s = 'prefix {"key": "val"} suffix'
#           ^-- индекс 7
obj, end = decoder.raw_decode(s, idx=7)
print(obj)    # {'key': 'val'}
print(end)    # 21

# Разбор потока NDJSON (несколько JSON-объектов подряд)
ndjson = '{"id":1}{"id":2}{"id":3}'
pos = 0
results = []
while pos < len(ndjson):
    obj, pos = decoder.raw_decode(ndjson, pos)
    results.append(obj)
print(results)   # [{'id': 1}, {'id': 2}, {'id': 3}]

# Разбор строки с JSON + дополнительным текстом (например, лог)
log_line = '2024-01-15 INFO {"event": "login", "user": "ivan"}'
json_start = log_line.index('{')
event, _ = decoder.raw_decode(log_line, json_start)
print(event)   # {'event': 'login', 'user': 'ivan'}`,
  },
  {
    name: "json.JSONDecoder.object_hook",
    description: `Атрибут экземпляра JSONDecoder, хранящий функцию-callback, вызываемую для каждого декодированного JSON-объекта (object, то есть {}).

Если задана, функция получает dict (уже декодированный стандартно) и должна вернуть объект, который будет использован вместо dict в итоговом результате. Это позволяет преобразовывать JSON-объекты в экземпляры классов, namedtuple, dataclass и др.

Задаётся при создании JSONDecoder(object_hook=func) или через json.loads(object_hook=func). Если одновременно задан object_pairs_hook — он имеет приоритет над object_hook.`,
    syntax: "JSONDecoder.object_hook",
    arguments: [],
    example: `import json
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Point:
    x: float
    y: float

@dataclass
class User:
    name: str
    age: int
    created: str

# Преобразование JSON-объектов в dataclass
def as_point(d):
    if 'x' in d and 'y' in d:
        return Point(**d)
    return d

decoder = json.JSONDecoder(object_hook=as_point)
result = decoder.decode('{"x": 1.5, "y": 2.7}')
print(result)         # Point(x=1.5, y=2.7)
print(type(result))   # <class '__main__.Point'>

# Через json.loads
user = json.loads(
    '{"name": "Мария", "age": 28, "created": "2024-01-01"}',
    object_hook=lambda d: User(**d)
)
print(user.name)   # Мария

# Проверка атрибута
print(decoder.object_hook)   # <function as_point at 0x...>

dec2 = json.JSONDecoder()
print(dec2.object_hook)      # None`,
  },
  {
    name: "json.JSONDecoder.object_pairs_hook",
    description: `Атрибут экземпляра JSONDecoder, хранящий функцию-callback, вызываемую для каждого JSON-объекта со списком пар (ключ, значение) в порядке появления.

В отличие от object_hook (получает dict), object_pairs_hook получает список кортежей [(ключ, значение), ...] — это позволяет обрабатывать дублирующиеся ключи и сохранять исходный порядок. Имеет приоритет над object_hook, если оба заданы.

Типичные применения: создание OrderedDict, выявление дублирующихся ключей, преобразование в кастомные структуры с сохранением порядка полей.`,
    syntax: "JSONDecoder.object_pairs_hook",
    arguments: [],
    example: `import json
from collections import OrderedDict

# Сохранение порядка ключей через OrderedDict
decoder = json.JSONDecoder(object_pairs_hook=OrderedDict)
result = decoder.decode('{"z": 3, "a": 1, "m": 2}')
print(result)          # OrderedDict([('z', 3), ('a', 1), ('m', 2)])
print(list(result))    # ['z', 'a', 'm']  — порядок сохранён

# Обнаружение дублирующихся ключей
def detect_duplicates(pairs):
    keys = [k for k, v in pairs]
    if len(keys) != len(set(keys)):
        duplicates = [k for k in keys if keys.count(k) > 1]
        raise ValueError(f'Дублирующиеся ключи: {set(duplicates)}')
    return dict(pairs)

try:
    json.loads('{"a": 1, "b": 2, "a": 3}', object_pairs_hook=detect_duplicates)
except ValueError as e:
    print(e)   # Дублирующиеся ключи: {'a'}

# Без detect_duplicates стандартный парсер берёт последнее значение:
print(json.loads('{"a": 1, "a": 2}'))   # {'a': 2}

# Проверка атрибута
dec = json.JSONDecoder(object_pairs_hook=OrderedDict)
print(dec.object_pairs_hook)   # <class 'collections.OrderedDict'>`,
  },
  {
    name: "json.JSONDecoder.parse_float",
    description: `Атрибут экземпляра JSONDecoder, хранящий callable для парсинга чисел с плавающей точкой из JSON.

По умолчанию None — используется встроенный float. При задании любого callable он получает строку с числом (например, '3.14') и должен вернуть нужный объект.

Наиболее частое применение — замена на decimal.Decimal для точных финансовых расчётов, поскольку float не может точно представить многие десятичные дроби. Задаётся через JSONDecoder(parse_float=Decimal) или json.loads(parse_float=Decimal).`,
    syntax: "JSONDecoder.parse_float",
    arguments: [],
    example: `import json
from decimal import Decimal

# По умолчанию — float (возможна потеря точности)
result = json.loads('{"price": 19.99}')
print(result['price'])          # 19.99
print(type(result['price']))    # <class 'float'>
print(result['price'] == 19.99) # True, но внутри неточно

# parse_float=Decimal — точное представление
result = json.loads('{"price": 19.99}', parse_float=Decimal)
print(result['price'])          # 19.99
print(type(result['price']))    # <class 'decimal.Decimal'>

# Демонстрация проблемы float:
import decimal
a = float('0.1') + float('0.2')
b = Decimal('0.1') + Decimal('0.2')
print(a)   # 0.30000000000000004  ← неточно
print(b)   # 0.3                  ← точно

# Проверка атрибута
dec = json.JSONDecoder(parse_float=Decimal)
print(dec.parse_float)    # <class 'decimal.Decimal'>

dec2 = json.JSONDecoder()
print(dec2.parse_float)   # None (используется float)

# Кастомный парсер с округлением
import functools
rounded_float = functools.partial(round, ndigits=2)
result = json.loads('{"val": 1.23456789}', parse_float=rounded_float)
print(result)   # {'val': 1.23}`,
  },
  {
    name: "json.JSONDecoder.parse_int",
    description: `Атрибут экземпляра JSONDecoder, хранящий callable для парсинга целых чисел из JSON.

По умолчанию None — используется встроенный int. При задании callable он получает строку с целым числом (например, '42') и должен вернуть нужный объект.

Используется реже, чем parse_float. Типичные случаи: ограничение диапазона значений, преобразование в numpy.int64 или другой числовой тип, логирование больших целых чисел JavaScript (до 2^53).`,
    syntax: "JSONDecoder.parse_int",
    arguments: [],
    example: `import json

# По умолчанию — int
result = json.loads('{"count": 42}')
print(type(result['count']))   # <class 'int'>

# parse_int — кастомный парсер
def bounded_int(s):
    """Ограничивает целое число диапазоном [-1000, 1000]."""
    value = int(s)
    return max(-1000, min(1000, value))

result = json.loads('{"a": 500, "b": 9999, "c": -5000}',
                    parse_int=bounded_int)
print(result)   # {'a': 500, 'b': 1000, 'c': -1000}

# Использование для обнаружения больших чисел JS
def safe_int(s):
    value = int(s)
    js_max = 2 ** 53
    if abs(value) > js_max:
        import warnings
        warnings.warn(f'Число {value} превышает точность JavaScript')
    return value

json.loads('{"id": 9007199254740993}', parse_int=safe_int)
# UserWarning: Число 9007199254740993 превышает точность JavaScript

# Проверка атрибута
dec = json.JSONDecoder(parse_int=int)
print(dec.parse_int)   # <class 'int'>

dec2 = json.JSONDecoder()
print(dec2.parse_int)  # None`,
  },
  {
    name: "json.JSONDecoder.parse_constant",
    description: `Атрибут экземпляра JSONDecoder, хранящий callable для обработки специальных констант JSON: -Infinity, Infinity и NaN.

Устарел начиная с Python 3.1 и удалён в Python 3.9. В современных версиях Python использовать не следует.

В Python 3.1+ NaN, Infinity и -Infinity парсятся встроенным декодером напрямую в float значения. Атрибут сохранён для обратной совместимости, но при передаче в JSONDecoder вызывает DeprecationWarning.`,
    syntax: "JSONDecoder.parse_constant",
    arguments: [],
    example: `import json

# Современный способ — parse_constant устарел и удалён в Python 3.9
# Используйте parse_float для обработки числовых значений

# NaN и Infinity парсятся напрямую (при allow_nan=True у encoder)
# Но стандартный json.loads не принимает NaN по умолчанию:
try:
    json.loads('NaN')
except json.JSONDecodeError as e:
    print(e)   # Expecting value

# NaN/Infinity появляются в JSON при сериализации с allow_nan=True
import json
s = json.dumps(float('nan'))    # 'NaN' — нестандартный JSON
s2 = json.dumps(float('inf'))   # 'Infinity'

# Современная замена: пост-обработка через object_hook
def handle_specials(d):
    for k, v in d.items():
        if v == 'NaN':
            d[k] = float('nan')
        elif v == 'Infinity':
            d[k] = float('inf')
    return d

# Или используйте библиотеку simplejson с поддержкой NaN/Inf
# pip install simplejson
# import simplejson
# simplejson.loads('NaN', allow_nan=True)`,
  },
  {
    name: "json.JSONDecoder.strict",
    description: `Атрибут экземпляра JSONDecoder, определяющий режим строгого разбора строк. Управляет тем, разрешены ли управляющие символы (коды 0–31) внутри JSON-строк.

По умолчанию True (строгий режим) — управляющие символы (\\n, \\t, \\r и другие) внутри JSON-строк без экранирования вызывают JSONDecodeError. По стандарту RFC 8259 они должны быть экранированы.

Если False — управляющие символы допускаются внутри строк напрямую. Это нарушает стандарт JSON, но может быть нужно для разбора нестандартных источников данных.`,
    syntax: "JSONDecoder.strict",
    arguments: [],
    example: `import json

# strict=True (по умолчанию) — символ переноса строки без экранирования запрещён
decoder_strict = json.JSONDecoder(strict=True)

try:
    decoder_strict.decode('"строка\\nс переносом"')   # \\n экранирован — OK
    decoder_strict.decode('{"a": "b"}')               # OK

    # Реальный символ переноса строки без \\n — ошибка:
    bad_json = '{"text": "line1\nline2"}'   # \n — реальный байт 0x0A
    decoder_strict.decode(bad_json)
except json.JSONDecodeError as e:
    print(e)   # Invalid control character at: ...

# strict=False — управляющие символы допускаются
decoder_lenient = json.JSONDecoder(strict=False)
result = decoder_lenient.decode('{"text": "line1\nline2"}')
print(result)   # {'text': 'line1\nline2'}

# Проверка атрибута
print(decoder_strict.strict)    # True
print(decoder_lenient.strict)   # False

# json.loads() использует strict=True по умолчанию
# Нет параметра strict в json.loads() — только через JSONDecoder
data = json.JSONDecoder(strict=False).decode('{"msg": "a\tb"}')
print(data)   # {'msg': 'a\tb'}`,
  },
  {
    name: "json.JSONDecodeError()",
    description: `Исключение, бросаемое при ошибке разбора JSON. Является подклассом ValueError и содержит подробную информацию о местонахождении ошибки в исходной строке.

Дополнительные атрибуты по сравнению с ValueError:
- msg — краткое описание ошибки (без позиции)
- doc — полная исходная строка JSON, в которой возникла ошибка
- pos — индекс символа, на котором произошла ошибка
- lineno — номер строки (1-based) в doc, где возникла ошибка
- colno — номер столбца (1-based) в строке lineno

JSONDecodeError бросается из json.loads(), json.load(), JSONDecoder.decode() и JSONDecoder.raw_decode() при любой синтаксической ошибке JSON.`,
    syntax: "json.JSONDecodeError(msg, doc, pos)",
    arguments: [
      {
        name: "msg",
        description:
          'Строка с описанием ошибки (например, "Expecting value", "Extra data", "Invalid control character").',
      },
      {
        name: "doc",
        description: "Полная исходная строка JSON, в которой произошла ошибка.",
      },
      {
        name: "pos",
        description: "Индекс символа в doc, на котором обнаружена ошибка.",
      },
    ],
    example: `import json

# Типичные ошибки и их атрибуты
examples = [
    '{invalid}',             # неверный ключ
    '{"a": 1,}',             # лишняя запятая
    '{"a": undefined}',      # undefined не существует в JSON
    '[1, 2',                 # незакрытый массив
]

for s in examples:
    try:
        json.loads(s)
    except json.JSONDecodeError as e:
        print(f'Строка:   {repr(s)}')
        print(f'  msg:    {e.msg}')
        print(f'  pos:    {e.pos}')
        print(f'  lineno: {e.lineno}')
        print(f'  colno:  {e.colno}')
        print()

# Многострочный JSON — lineno и colno точно указывают место
multiline = """{
    "name": "Тест",
    "value": WRONG
}"""
try:
    json.loads(multiline)
except json.JSONDecodeError as e:
    print(f'Ошибка на строке {e.lineno}, столбце {e.colno}')
    print(f'Символ: {repr(e.doc[e.pos])}')
# Ошибка на строке 3, столбце 14

# JSONDecodeError является подклассом ValueError
print(issubclass(json.JSONDecodeError, ValueError))   # True`,
  },
  {
    name: "io.DEFAULT_BUFFER_SIZE",
    description: `Константа модуля io, содержащая размер буфера по умолчанию в байтах, используемый буферизованными потоками ввода-вывода.

На большинстве платформ значение равно 8192 (8 КБ). Это значение используется при создании буферизованных объектов (BufferedReader, BufferedWriter, BufferedRandom), если размер буфера явно не задан через параметр buffering.

Значение определяется операционной системой через os.stat() на реальных файлах (поле st_blksize), либо берётся как константа для потоков, не связанных с файловой системой. Задание buffering=io.DEFAULT_BUFFER_SIZE эквивалентно buffering=-1 (буфер по умолчанию).`,
    syntax: "io.DEFAULT_BUFFER_SIZE",
    arguments: [],
    example: `import io

# Значение константы
print(io.DEFAULT_BUFFER_SIZE)   # 8192

# Явное использование при создании потока
with open('data.bin', 'rb', buffering=io.DEFAULT_BUFFER_SIZE) as f:
    chunk = f.read(io.DEFAULT_BUFFER_SIZE)

# Чтение файла кусками по размеру буфера
def read_in_chunks(filepath):
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(io.DEFAULT_BUFFER_SIZE)
            if not chunk:
                break
            yield chunk

# Использование в BufferedReader вручную
raw = io.FileIO('data.bin', 'rb')
buffered = io.BufferedReader(raw, buffer_size=io.DEFAULT_BUFFER_SIZE)
data = buffered.read()
buffered.close()

# Сравнение с другими размерами буфера
print(io.DEFAULT_BUFFER_SIZE)    # 8192  (8 KB)
print(io.DEFAULT_BUFFER_SIZE * 8)  # 65536 (64 KB) — для больших файлов`,
  },
  {
    name: "io.open()",
    description: `Функция открытия файла и возврата потокового объекта. Является псевдонимом встроенной функции open() и предпочтительным способом работы с файлами в модуле io.

Режимы открытия (параметр mode):
- 'r' — чтение (по умолчанию), 'w' — запись, 'a' — добавление, 'x' — создание (ошибка если существует)
- 'b' — бинарный режим, 't' — текстовый (по умолчанию)
- '+' — чтение и запись одновременно
- Комбинации: 'rb', 'wb', 'r+', 'rb+' и др.

Возвращаемый тип зависит от комбинации параметров:
- Текстовый файл → TextIOWrapper
- Буферизованный бинарный → BufferedReader / BufferedWriter / BufferedRandom
- Небуферизованный бинарный → FileIO`,
    syntax: `io.open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None)`,
    arguments: [
      {
        name: "file",
        description:
          "Путь к файлу (str, bytes, Path) или дескриптор файла (int).",
      },
      {
        name: "mode",
        description:
          "Режим открытия: 'r', 'w', 'a', 'x', 'b', 't', '+' и их комбинации. По умолчанию 'r' (текстовое чтение).",
      },
      {
        name: "buffering",
        description:
          "-1 — буфер по умолчанию; 0 — без буфера (только бинарный режим); 1 — построчная буферизация; >1 — размер буфера в байтах.",
      },
      {
        name: "encoding",
        description:
          "Кодировка для текстового режима (например, 'utf-8', 'cp1251'). None — системная кодировка (locale.getpreferredencoding).",
      },
      {
        name: "errors",
        description:
          "Обработка ошибок кодирования: 'strict' (ошибка), 'ignore' (пропустить), 'replace' (заменить на ?), 'surrogateescape' и др.",
      },
      {
        name: "newline",
        description:
          "Управление переводом строк: None — универсальный режим (\\n, \\r, \\r\\n → \\n); '' — без перевода; '\\n', '\\r', '\\r\\n' — конкретный разделитель.",
      },
      {
        name: "closefd",
        description:
          "Если False и file — дескриптор (int) — дескриптор не закрывается при закрытии потока. По умолчанию True.",
      },
      {
        name: "opener",
        description:
          "Кастомный callable(path, flags) для открытия файла. Если None — используется os.open().",
      },
    ],
    example: `import io

# Текстовое чтение (по умолчанию)
with io.open('readme.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Текстовая запись
with io.open('output.txt', 'w', encoding='utf-8', newline='\\n') as f:
    f.write('Привет, мир!\\n')

# Бинарное чтение
with io.open('image.png', 'rb') as f:
    header = f.read(8)

# Бинарная запись без буфера
with io.open('raw.bin', 'wb', buffering=0) as f:
    f.write(b'\\x00\\x01\\x02')

# Чтение и запись одновременно
with io.open('data.txt', 'r+', encoding='utf-8') as f:
    content = f.read()
    f.seek(0)
    f.write(content.upper())

# Кастомный opener (открыть с флагами ОС)
import os
def my_opener(path, flags):
    return os.open(path, flags, mode=0o600)  # права 600

with io.open('secret.txt', 'w', opener=my_opener) as f:
    f.write('секрет')

# Обработка ошибок кодировки
with io.open('mixed.txt', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()  # некорректные байты → '?'`,
  },
  {
    name: "io.open_code()",
    description: `Функция открытия файла для чтения исходного кода Python. Предназначена для хуков импорта и инструментов, читающих .py-файлы — обеспечивает правильную обработку в средах с зашифрованным или защищённым кодом.

В отличие от io.open(), функция open_code() открывает файл без трансляции переводов строк и предполагает, что файл будет декодирован как исходный код. В CPython является псевдонимом io.open(path, 'rb'), но может быть переопределена через sys.set_coroutine_origin_tracking_depth() или аудит-хуки.

Позволяет среде выполнения (например, с шифрованием исходников) перехватывать чтение .py-файлов через механизм аудита Python (sys.addaudithook).`,
    syntax: "io.open_code(path)",
    arguments: [
      {
        name: "path",
        description:
          "Путь к файлу исходного кода Python (str). Файл открывается в бинарном режиме.",
      },
    ],
    example: `import io

# Чтение исходного кода Python-файла
with io.open_code('mymodule.py') as f:
    source_bytes = f.read()

print(type(source_bytes))   # <class 'bytes'>
print(source_bytes[:50])    # b'import os\\nimport sys\\n...'

# Декодирование прочитанного кода
source = source_bytes.decode('utf-8')
print(source[:100])

# Компиляция прочитанного кода
code = compile(source_bytes, 'mymodule.py', 'exec')
exec(code)

# Отличие от io.open():
# io.open(path, 'r') — текстовый режим, трансляция переносов строк
# io.open_code(path) — бинарный режим, без трансляции, с аудит-хуком

# Использование в инструментах импорта
import sys

def my_audit_hook(event, args):
    if event == 'open':
        path, mode, flags = args
        print(f'Открывается файл: {path} (mode={mode})')

sys.addaudithook(my_audit_hook)
# Теперь io.open_code() будет вызывать хук при открытии файла`,
  },
  {
    name: "io.UnsupportedOperation",
    description: `Исключение, бросаемое при вызове метода, не поддерживаемого данным потоком ввода-вывода. Является подклассом одновременно OSError и ValueError.

Типичные случаи возникновения:
- Вызов write() на потоке, открытом только для чтения
- Вызов read() на потоке, открытом только для записи
- Вызов seek() на потоке, не поддерживающем позиционирование (например, sys.stdin)
- Вызов truncate() на потоке без поддержки этой операции

Наследование от обоих OSError и ValueError позволяет перехватывать исключение как любым из этих типов.`,
    syntax: "io.UnsupportedOperation",
    arguments: [],
    example: `import io

# Попытка записи в поток только для чтения
with io.open('data.txt', 'r') as f:
    try:
        f.write('текст')
    except io.UnsupportedOperation as e:
        print(e)   # write

# Попытка позиционирования в непозиционируемом потоке
import sys
try:
    sys.stdin.seek(0)
except io.UnsupportedOperation as e:
    print(e)   # underlying stream is not seekable

# Попытка чтения из потока только для записи
stream = io.BytesIO()
stream.read()   # OK — BytesIO поддерживает оба направления

write_only = io.open('output.txt', 'w')
try:
    write_only.read()
except io.UnsupportedOperation as e:
    print(e)   # not readable
finally:
    write_only.close()

# UnsupportedOperation является подклассом OSError и ValueError
print(issubclass(io.UnsupportedOperation, OSError))    # True
print(issubclass(io.UnsupportedOperation, ValueError)) # True

# Перехват как OSError тоже работает
try:
    io.open('data.txt', 'r').write('x')
except OSError as e:
    print(type(e).__name__)   # UnsupportedOperation`,
  },
  {
    name: "io.SEEK_SET",
    description: `Константа позиционирования потока — начало файла. Числовое значение: 0.

Используется как аргумент whence в методе seek() для указания, что смещение отсчитывается от начала файла. Это наиболее распространённый режим позиционирования: seek(n, io.SEEK_SET) перемещает указатель на позицию n от начала файла.

Числовое значение 0 можно передавать напрямую (seek(n, 0)), однако использование именованной константы io.SEEK_SET делает код более читаемым и явным.`,
    syntax: "io.SEEK_SET",
    arguments: [],
    example: `import io

with io.open('data.txt', 'r+', encoding='utf-8') as f:
    f.write('Hello, World!')

    # SEEK_SET — от начала файла (значение 0)
    f.seek(0, io.SEEK_SET)     # перейти в начало
    print(f.read(5))           # Hello

    f.seek(7, io.SEEK_SET)     # перейти на позицию 7 от начала
    print(f.read(5))           # World

    # SEEK_SET используется по умолчанию (whence=0)
    f.seek(0)                  # то же самое, что seek(0, io.SEEK_SET)
    print(f.read())            # Hello, World!

# Проверка значения константы
print(io.SEEK_SET)   # 0
print(io.SEEK_CUR)   # 1
print(io.SEEK_END)   # 2

# Работа с бинарным потоком
with io.open('binary.bin', 'rb') as f:
    f.seek(0, io.SEEK_SET)    # начало файла
    header = f.read(4)         # первые 4 байта (например, magic bytes PNG)
    print(header)`,
  },
  {
    name: "io.SEEK_CUR",
    description: `Константа позиционирования потока — текущая позиция. Числовое значение: 1.

Используется как аргумент whence в методе seek() для указания, что смещение отсчитывается от текущей позиции указателя. Положительное смещение двигает вперёд, отрицательное — назад.

seek(0, io.SEEK_CUR) — удобный способ узнать текущую позицию без изменения, хотя метод tell() делает то же самое более явно.`,
    syntax: "io.SEEK_CUR",
    arguments: [],
    example: `import io

with io.open('data.bin', 'rb') as f:
    # Чтение заголовка
    header = f.read(8)
    print(f'После header: позиция {f.tell()}')  # 8

    # SEEK_CUR — смещение от текущей позиции (значение 1)
    f.seek(4, io.SEEK_CUR)    # пропустить 4 байта вперёд
    print(f'После пропуска: позиция {f.tell()}')  # 12

    f.seek(-2, io.SEEK_CUR)   # вернуться на 2 байта назад
    print(f'После возврата: позиция {f.tell()}')  # 10

    # Узнать текущую позицию (эквивалент tell())
    pos = f.seek(0, io.SEEK_CUR)
    print(f'Текущая позиция: {pos}')   # 10

# Пример: пропуск блоков фиксированного размера
def read_blocks(filepath, block_size, skip_every_n=2):
    with io.open(filepath, 'rb') as f:
        i = 0
        while True:
            block = f.read(block_size)
            if not block:
                break
            if i % skip_every_n == 0:
                yield block
            else:
                f.seek(block_size, io.SEEK_CUR)
            i += 1`,
  },
  {
    name: "io.SEEK_END",
    description: `Константа позиционирования потока — конец файла. Числовое значение: 2.

Используется как аргумент whence в методе seek() для указания, что смещение отсчитывается от конца файла. Смещение обычно отрицательное (для перемещения назад от конца) или нулевое (перейти в самый конец).

seek(0, io.SEEK_END) — стандартный способ перейти в конец файла и узнать его размер через tell(). Поддерживается не всеми потоками — для некоторых (сокеты, pipes) вызывает io.UnsupportedOperation.`,
    syntax: "io.SEEK_END",
    arguments: [],
    example: `import io

with io.open('data.bin', 'rb') as f:
    # SEEK_END — смещение от конца файла (значение 2)

    # Переход в конец файла
    f.seek(0, io.SEEK_END)
    file_size = f.tell()
    print(f'Размер файла: {file_size} байт')

    # Чтение последних N байт
    n = 16
    f.seek(-n, io.SEEK_END)
    tail = f.read(n)
    print(f'Последние {n} байт: {tail}')

    # Чтение предпоследнего блока
    block_size = 512
    f.seek(-block_size * 2, io.SEEK_END)
    prev_block = f.read(block_size)

# Получение размера файла без полного чтения
def get_file_size(filepath):
    with io.open(filepath, 'rb') as f:
        f.seek(0, io.SEEK_END)
        return f.tell()

print(get_file_size('data.bin'))   # размер в байтах

# Добавление в конец (эквивалентно режиму 'a')
with io.open('log.txt', 'r+b') as f:
    f.seek(0, io.SEEK_END)
    f.write(b'новая запись\\n')`,
  },
  {
    name: "io.IOBase.close()",
    description: `Метод закрытия потока. Освобождает системные ресурсы, связанные с потоком: дескриптор файла, буферы, сетевые соединения. После закрытия любой вызов метода ввода-вывода бросает ValueError.

Метод идемпотентен — повторный вызов close() не вызывает исключения и не имеет эффекта. Внутри close() вызывает flush() для сброса буфера перед закрытием.

Рекомендуется использовать контекстный менеджер with, который гарантирует вызов close() даже при исключении. Прямой вызов close() требуется только при работе вне контекстного менеджера — в этом случае используйте try/finally.`,
    syntax: "IOBase.close()",
    arguments: [],
    example: `import io

# Рекомендуемый способ — контекстный менеджер
with open('data.txt', 'r') as f:
    text = f.read()
# close() вызван автоматически, даже при исключении

# Явный вызов close() в try/finally
f = open('data.txt', 'r')
try:
    text = f.read()
finally:
    f.close()   # гарантированное закрытие

# Идемпотентность — повторный вызов безопасен
f = open('data.txt', 'r')
f.close()
f.close()   # не вызывает ошибки

# После закрытия — ValueError
f = open('data.txt', 'r')
f.close()
try:
    f.read()
except ValueError as e:
    print(e)   # I/O operation on closed file.

# BytesIO и StringIO тоже закрываются
buf = io.BytesIO(b'data')
buf.close()
print(buf.closed)   # True`,
  },
  {
    name: "io.IOBase.closed",
    description: `Атрибут (свойство) потока, показывающий, закрыт ли поток. Возвращает True если поток закрыт, False если открыт.

Доступен только для чтения — установить напрямую нельзя. Устанавливается в True после вызова close() или при выходе из контекстного менеджера with.

Используется для проверки состояния потока перед выполнением операций ввода-вывода, а также в отладочных целях и при написании контекстных менеджеров.`,
    syntax: "IOBase.closed",
    arguments: [],
    example: `import io

# Проверка состояния файла
f = open('data.txt', 'r')
print(f.closed)   # False

f.close()
print(f.closed)   # True

# В контекстном менеджере
with open('data.txt', 'r') as f:
    print(f.closed)   # False
print(f.closed)       # True — закрыт после выхода из with

# Защитная проверка перед операцией
def safe_read(f):
    if f.closed:
        raise ValueError('Попытка чтения из закрытого потока')
    return f.read()

# StringIO и BytesIO
buf = io.StringIO('hello')
print(buf.closed)   # False
buf.close()
print(buf.closed)   # True

# Нельзя установить напрямую
try:
    f.closed = False
except AttributeError as e:
    print(e)   # can't set attribute`,
  },
  {
    name: "io.IOBase.fileno()",
    description: `Метод, возвращающий целочисленный дескриптор файла (file descriptor) операционной системы, связанный с потоком.

Дескриптор файла — это целое число, используемое ядром ОС для идентификации открытого файла или другого ресурса (сокета, трубы). Стандартные дескрипторы: 0 — stdin, 1 — stdout, 2 — stderr.

Если поток не связан с реальным файловым дескриптором (например, io.BytesIO, io.StringIO) — бросает io.UnsupportedOperation. Используется при работе с низкоуровневыми API ОС через модуль os.`,
    syntax: "IOBase.fileno()",
    arguments: [],
    example: `import io
import os

# Дескриптор реального файла
with open('data.txt', 'r') as f:
    fd = f.fileno()
    print(fd)          # например: 3, 4, 5...
    print(type(fd))    # <class 'int'>

# Стандартные дескрипторы
import sys
print(sys.stdin.fileno())   # 0
print(sys.stdout.fileno())  # 1
print(sys.stderr.fileno())  # 2

# Использование с os (низкоуровневое чтение)
with open('data.bin', 'rb') as f:
    fd = f.fileno()
    data = os.read(fd, 1024)   # низкоуровневое чтение через ОС

# BytesIO и StringIO не имеют дескриптора
buf = io.BytesIO(b'data')
try:
    buf.fileno()
except io.UnsupportedOperation as e:
    print(e)   # fileno

# Проверка дескриптора через os
with open('data.txt', 'r') as f:
    fd = f.fileno()
    stat = os.fstat(fd)   # статистика файла по дескриптору
    print(stat.st_size)   # размер файла`,
  },
  {
    name: "io.IOBase.flush()",
    description: `Метод принудительного сброса буфера записи в базовый поток или файловую систему. Гарантирует, что все данные из буфера приложения переданы в ОС.

Важно понимать разницу уровней:
- flush() сбрасывает буфер Python → буфер ОС
- os.fsync(f.fileno()) дополнительно сбрасывает буфер ОС → физический диск

После flush() данные доступны другим процессам, читающим этот файл, но не обязательно записаны на диск. Для гарантированной записи на диск используйте os.fsync() после flush().

Для потоков без буферизации (FileIO с buffering=0) flush() не имеет эффекта. Вызывается автоматически при close().`,
    syntax: "IOBase.flush()",
    arguments: [],
    example: `import io
import os

# Принудительный сброс буфера
with open('log.txt', 'w', encoding='utf-8') as f:
    f.write('Запись 1\\n')
    f.flush()   # данные переданы в ОС, другие процессы их видят
    f.write('Запись 2\\n')
    # flush() вызывается автоматически при close()

# Реальная запись на диск (не только в буфер ОС)
with open('critical.txt', 'w') as f:
    f.write('критические данные')
    f.flush()
    os.fsync(f.fileno())   # гарантированная запись на физический диск

# Потоковый вывод (например, прогресс)
import sys
for i in range(5):
    sys.stdout.write(f'\\rШаг {i+1}/5...')
    sys.stdout.flush()   # без flush() вывод будет буферизован

# BytesIO — flush() безопасен, но не имеет эффекта
buf = io.BytesIO()
buf.write(b'data')
buf.flush()   # OK, ничего не происходит
print(buf.getvalue())   # b'data'`,
  },
  {
    name: "io.IOBase.isatty()",
    description: `Метод проверки, подключён ли поток к интерактивному терминалу (TTY — TeleTYpewriter). Возвращает True если поток является терминалом, False в противном случае.

Используется для определения интерактивного режима работы: если вывод идёт в терминал — можно использовать цветной вывод, прогресс-бары, интерактивные запросы. Если в файл или pipe — лучше простой текст.

Большинство файлов, BytesIO и StringIO возвращают False. sys.stdout возвращает True при запуске в интерактивной оболочке и False при перенаправлении вывода (python script.py > file.txt).`,
    syntax: "IOBase.isatty()",
    arguments: [],
    example: `import io
import sys

# Проверка интерактивного терминала
print(sys.stdout.isatty())   # True в терминале, False при > file.txt
print(sys.stdin.isatty())    # True в интерактивном режиме

# Адаптивный вывод
def print_progress(current, total):
    if sys.stdout.isatty():
        # Интерактивный режим — перезаписываем строку
        print(f'\\r{current}/{total} ({current/total:.0%})', end='', flush=True)
    else:
        # Pipe или файл — обычный вывод
        print(f'Progress: {current}/{total}')

# Цветной вывод только в терминале
def colored(text, color_code):
    if sys.stdout.isatty():
        return f'\\033[{color_code}m{text}\\033[0m'
    return text

print(colored('Успех!', '32'))   # зелёный в терминале, обычный в файле

# Обычные файлы и буферы — всегда False
with open('data.txt', 'r') as f:
    print(f.isatty())   # False

buf = io.BytesIO()
print(buf.isatty())     # False`,
  },
  {
    name: "io.IOBase.readable()",
    description: `Метод проверки, поддерживает ли поток чтение. Возвращает True если поток открыт для чтения, False в противном случае.

Позволяет проверить возможность чтения до фактической попытки — это удобнее, чем перехватывать io.UnsupportedOperation. Потоки, открытые только для записи ('w', 'a', 'x'), возвращают False.

Используется при написании универсальных функций, принимающих произвольный поток ввода-вывода, и при реализации кастомных классов-потоков.`,
    syntax: "IOBase.readable()",
    arguments: [],
    example: `import io

# Проверка читаемости потоков
with open('data.txt', 'r') as f:
    print(f.readable())   # True

with open('data.txt', 'w') as f:
    print(f.readable())   # False

with open('data.txt', 'r+') as f:
    print(f.readable())   # True (r+ — чтение и запись)

# BytesIO и StringIO — всегда читаемы
print(io.BytesIO(b'data').readable())    # True
print(io.StringIO('text').readable())    # True

# Универсальная функция для любого потока
def safe_read(stream, n=-1):
    if not stream.readable():
        raise io.UnsupportedOperation('Поток не поддерживает чтение')
    return stream.read(n)

# Кастомный класс потока
class WriteOnlyStream(io.RawIOBase):
    def readable(self):
        return False

    def writable(self):
        return True

stream = WriteOnlyStream()
print(stream.readable())   # False
print(stream.writable())   # True`,
  },
  {
    name: "io.IOBase.readline()",
    description: `Метод чтения одной строки из потока. Читает символы до тех пор, пока не встретит символ новой строки '\\n', конец файла или не прочитает size байт/символов.

Возвращённая строка включает символ новой строки '\\n' (если он присутствует в файле). Последняя строка файла без '\\n' возвращается как есть. Пустая строка '' означает конец файла.

В бинарном режиме возвращает bytes с b'\\n' в конце. В текстовом — str. Параметр size ограничивает максимальное количество читаемых байт/символов (строка может оказаться короче полной строки файла).`,
    syntax: "IOBase.readline(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Максимальное количество байт/символов для чтения. -1 (по умолчанию) — читать до конца строки или EOF.",
      },
    ],
    example: `import io

# Создаём тестовый файл
with open('lines.txt', 'w', encoding='utf-8') as f:
    f.write('строка 1\\nстрока 2\\nстрока 3\\n')

# Чтение строк по одной
with open('lines.txt', 'r', encoding='utf-8') as f:
    print(repr(f.readline()))   # 'строка 1\\n'
    print(repr(f.readline()))   # 'строка 2\\n'
    print(repr(f.readline()))   # 'строка 3\\n'
    print(repr(f.readline()))   # ''  ← EOF

# Чтение с ограничением по размеру
with open('lines.txt', 'r') as f:
    print(repr(f.readline(5)))   # 'строк'  ← только 5 символов

# Итерация по строкам (эффективнее readlines())
with open('lines.txt', 'r', encoding='utf-8') as f:
    for line in f:   # использует readline() внутри
        print(line.rstrip())

# StringIO
buf = io.StringIO('line 1\\nline 2\\nline 3')
print(buf.readline())   # 'line 1\\n'
print(buf.readline())   # 'line 2\\n'

# BytesIO
bbuf = io.BytesIO(b'row1\\nrow2\\n')
print(bbuf.readline())   # b'row1\\n'`,
  },
  {
    name: "io.IOBase.readlines()",
    description: `Метод чтения всех строк потока в список. Читает поток до EOF и возвращает список строк, каждая из которых заканчивается символом '\\n' (кроме последней, если файл не заканчивается переносом строки).

Параметр hint позволяет ограничить количество читаемых байт: метод читает строки, пока суммарный их размер не превысит hint. Это полезно для частичного чтения больших файлов по строкам.

Для больших файлов предпочтительно итерироваться по файловому объекту напрямую (for line in f:) — это не загружает весь файл в память. readlines() загружает все строки сразу.`,
    syntax: "IOBase.readlines(hint=-1)",
    arguments: [
      {
        name: "hint",
        description:
          "Приблизительный лимит байт для чтения. -1 (по умолчанию) — читать весь файл. При hint > 0 читаются строки, пока их суммарный размер не превысит hint.",
      },
    ],
    example: `import io

with open('lines.txt', 'w') as f:
    f.write('line 1\\nline 2\\nline 3\\nline 4\\n')

# Чтение всех строк
with open('lines.txt', 'r') as f:
    lines = f.readlines()
print(lines)   # ['line 1\\n', 'line 2\\n', 'line 3\\n', 'line 4\\n']

# Удаление символов новой строки
lines = [l.rstrip('\\n') for l in lines]

# С параметром hint — частичное чтение
with open('lines.txt', 'r') as f:
    partial = f.readlines(hint=14)   # ~14 байт → ['line 1\\n', 'line 2\\n']
print(partial)

# Эффективная альтернатива для больших файлов (без загрузки в память)
with open('large.txt', 'r') as f:
    for line in f:               # итерация строка за строкой
        process(line.rstrip())

# StringIO
buf = io.StringIO('a\\nb\\nc\\n')
print(buf.readlines())   # ['a\\n', 'b\\n', 'c\\n']

# BytesIO
bbuf = io.BytesIO(b'x\\ny\\nz\\n')
print(bbuf.readlines())   # [b'x\\n', b'y\\n', b'z\\n']`,
  },
  {
    name: "io.IOBase.seek()",
    description: `Метод изменения текущей позиции в потоке. Перемещает указатель чтения/записи на заданное смещение относительно точки отсчёта whence и возвращает новую абсолютную позицию.

Значения whence:
- io.SEEK_SET (0) — от начала файла (по умолчанию)
- io.SEEK_CUR (1) — от текущей позиции
- io.SEEK_END (2) — от конца файла

Не все потоки поддерживают позиционирование. Сокеты, pipes и stdin/stdout при запуске из скрипта не поддерживают seek() и бросают io.UnsupportedOperation. Поддержку можно проверить через seekable().

В текстовом режиме допустимы только seek(0) и значения, возвращённые предыдущим вызовом tell().`,
    syntax: "IOBase.seek(offset, whence=SEEK_SET)",
    arguments: [
      {
        name: "offset",
        description:
          "Смещение в байтах/символах. В текстовом режиме должен быть 0 или значение из tell().",
      },
      {
        name: "whence",
        description:
          "Точка отсчёта: io.SEEK_SET (0) — начало, io.SEEK_CUR (1) — текущая позиция, io.SEEK_END (2) — конец файла. По умолчанию SEEK_SET.",
      },
    ],
    example: `import io

with open('data.bin', 'rb') as f:
    # Перейти в начало файла
    f.seek(0, io.SEEK_SET)   # или просто f.seek(0)
    header = f.read(4)

    # Перейти на конкретную позицию
    f.seek(100)
    data = f.read(20)

    # Пропустить вперёд от текущей позиции
    f.seek(50, io.SEEK_CUR)

    # Перейти к последним 10 байтам
    f.seek(-10, io.SEEK_END)
    tail = f.read()

    # Узнать размер файла
    f.seek(0, io.SEEK_END)
    size = f.tell()
    print(f'Размер: {size} байт')

# Текстовый режим — только seek(0) или значения из tell()
with open('text.txt', 'r', encoding='utf-8') as f:
    pos = f.tell()
    line = f.readline()
    f.seek(pos)           # вернуться к началу строки
    line_again = f.readline()

# BytesIO — полная поддержка seek
buf = io.BytesIO(b'Hello, World!')
buf.seek(7)
print(buf.read())   # b'World!'
buf.seek(-6, io.SEEK_END)
print(buf.read())   # b'World!'`,
  },
  {
    name: "io.IOBase.seekable()",
    description: `Метод проверки, поддерживает ли поток позиционирование (метод seek()). Возвращает True если seek(), tell() и truncate() поддерживаются, False в противном случае.

Файлы на диске поддерживают позиционирование. Сокеты, трубы (pipes), stdin/stdout в неинтерактивном режиме — не поддерживают. Попытка вызвать seek() на непозиционируемом потоке бросает io.UnsupportedOperation.

Используется при написании универсального кода, работающего с произвольными потоками.`,
    syntax: "IOBase.seekable()",
    arguments: [],
    example: `import io
import sys

# Файлы поддерживают позиционирование
with open('data.txt', 'r') as f:
    print(f.seekable())   # True

# StringIO и BytesIO — поддерживают
print(io.BytesIO(b'data').seekable())     # True
print(io.StringIO('text').seekable())     # True

# stdin/stdout — зависит от среды
print(sys.stdin.seekable())    # False (обычно)
print(sys.stdout.seekable())   # False (обычно)

# Безопасное позиционирование
def rewind_if_possible(stream):
    if stream.seekable():
        stream.seek(0)
        return True
    return False

# Кастомный класс без позиционирования
class ForwardOnlyStream(io.RawIOBase):
    def seekable(self):
        return False

    def readable(self):
        return True

stream = ForwardOnlyStream()
print(stream.seekable())   # False
try:
    stream.seek(0)
except io.UnsupportedOperation:
    print('Позиционирование не поддерживается')`,
  },
  {
    name: "io.IOBase.tell()",
    description: `Метод получения текущей позиции указателя в потоке. Возвращает целое число — количество байт/символов от начала файла до текущей позиции.

В бинарном режиме возвращает абсолютное смещение в байтах. В текстовом режиме возвращает непрозрачный токен (opaque number) — его значение зависит от реализации и не обязательно равно числу символов; используется только для передачи обратно в seek().

Вызов tell() не изменяет текущую позицию. Эквивалент seek(0, SEEK_CUR). Бросает io.UnsupportedOperation для потоков без поддержки позиционирования.`,
    syntax: "IOBase.tell()",
    arguments: [],
    example: `import io

# Бинарный режим — байтовое смещение
with open('data.bin', 'rb') as f:
    print(f.tell())   # 0 (начало)
    f.read(10)
    print(f.tell())   # 10
    f.seek(0)
    print(f.tell())   # 0

# Запоминание позиции для возврата
with open('data.txt', 'r', encoding='utf-8') as f:
    f.readline()              # прочитали первую строку
    bookmark = f.tell()       # запомнили позицию
    f.readline()              # прочитали вторую строку
    f.seek(bookmark)          # вернулись
    line = f.readline()       # снова вторая строка

# Размер файла через tell()
def get_size(filepath):
    with open(filepath, 'rb') as f:
        f.seek(0, io.SEEK_END)
        return f.tell()

# BytesIO
buf = io.BytesIO(b'Hello, World!')
buf.read(5)
print(buf.tell())   # 5

buf.seek(0)
print(buf.tell())   # 0

# StringIO
sbuf = io.StringIO('абвгд')
sbuf.read(3)
pos = sbuf.tell()
sbuf.seek(pos)       # корректный возврат к позиции`,
  },
  {
    name: "io.IOBase.truncate()",
    description: `Метод усечения потока до заданного размера. Если size не указан — усекает до текущей позиции tell(). Возвращает новый размер файла в байтах.

После truncate() позиция в потоке не изменяется — если она была за пределами нового размера, при последующей записи возможно создание разреженного файла (sparse file) с нулевыми байтами между старой позицией и новой записью.

Поддерживается только для записываемых и позиционируемых потоков. Бросает io.UnsupportedOperation для только-читаемых или непозиционируемых потоков.`,
    syntax: "IOBase.truncate(size=None)",
    arguments: [
      {
        name: "size",
        description:
          "Размер в байтах, до которого усекается файл. None (по умолчанию) — усечь до текущей позиции tell().",
      },
    ],
    example: `import io

# Усечение до конкретного размера
with open('data.txt', 'r+', encoding='utf-8') as f:
    content = f.read()
    print(f'Исходный размер: {len(content)} символов')

    f.seek(0)
    f.truncate(10)   # оставить только первые 10 байт

# Усечение до текущей позиции
with open('data.txt', 'r+', encoding='utf-8') as f:
    f.seek(5)
    f.truncate()     # усечь всё после позиции 5

# Очистка файла (нулевой размер)
with open('log.txt', 'r+') as f:
    f.seek(0)
    f.truncate(0)    # полная очистка
    f.seek(0)
    f.write('Новое начало')

# BytesIO
buf = io.BytesIO(b'Hello, World!')
buf.seek(5)
buf.truncate()           # усечь до позиции 5
print(buf.getvalue())    # b'Hello'

buf2 = io.BytesIO(b'Hello, World!')
buf2.truncate(7)         # усечь до 7 байт
print(buf2.getvalue())   # b'Hello, '`,
  },
  {
    name: "io.IOBase.writable()",
    description: `Метод проверки, поддерживает ли поток запись. Возвращает True если поток открыт для записи, False в противном случае.

Потоки, открытые в режимах 'w', 'a', 'x', 'r+', 'w+', 'a+', возвращают True. Потоки только для чтения ('r') возвращают False.

Используется при написании универсальных функций, принимающих произвольный поток, а также при реализации кастомных классов-потоков. Попытка вызвать write() на незаписываемом потоке бросает io.UnsupportedOperation.`,
    syntax: "IOBase.writable()",
    arguments: [],
    example: `import io

# Проверка записываемости потоков
with open('data.txt', 'r') as f:
    print(f.writable())   # False

with open('data.txt', 'w') as f:
    print(f.writable())   # True

with open('data.txt', 'r+') as f:
    print(f.writable())   # True

with open('data.txt', 'a') as f:
    print(f.writable())   # True

# BytesIO — всегда записываем
buf = io.BytesIO()
print(buf.writable())   # True

# Безопасная запись
def safe_write(stream, data):
    if not stream.writable():
        raise io.UnsupportedOperation('Поток не поддерживает запись')
    stream.write(data)

# Кастомный класс
class ReadOnlyStream(io.RawIOBase):
    def readable(self):
        return True

    def writable(self):
        return False

stream = ReadOnlyStream()
print(stream.writable())   # False

try:
    stream.write(b'data')
except io.UnsupportedOperation as e:
    print(e)   # write`,
  },
  {
    name: "io.IOBase.writelines()",
    description: `Метод записи списка строк (или байтовых строк) в поток без добавления разделителей между ними. Является эквивалентом последовательного вызова write() для каждого элемента.

Метод не добавляет символы новой строки автоматически — их нужно включать в элементы списка явно. Принимает любой итерируемый объект строк (list, tuple, generator и др.).

В текстовом режиме принимает итерируемое строк (str). В бинарном — итерируемое байтов (bytes). Возвращает None.`,
    syntax: "IOBase.writelines(lines)",
    arguments: [
      {
        name: "lines",
        description:
          "Итерируемый объект строк (str в текстовом режиме) или байтовых строк (bytes в бинарном режиме) для записи.",
      },
    ],
    example: `import io

# Запись списка строк в файл
lines = ['строка 1\\n', 'строка 2\\n', 'строка 3\\n']
with open('output.txt', 'w', encoding='utf-8') as f:
    f.writelines(lines)
# Результат: строка 1\nстрока 2\nстрока 3\n

# Разделители нужно добавлять явно
words = ['apple', 'banana', 'cherry']
with open('fruits.txt', 'w') as f:
    f.writelines(word + '\\n' for word in words)  # генератор

# Бинарный режим
with open('binary.bin', 'wb') as f:
    f.writelines([b'chunk1', b'chunk2', b'chunk3'])

# StringIO
buf = io.StringIO()
buf.writelines(['hello ', 'world', '\\n', 'foo'])
print(buf.getvalue())   # 'hello world\\nfoo'

# BytesIO
bbuf = io.BytesIO()
bbuf.writelines([b'part1', b'_', b'part2'])
print(bbuf.getvalue())   # b'part1_part2'

# Эквивалент через write()
with open('out.txt', 'w') as f:
    for line in lines:
        f.write(line)   # то же самое, что writelines(lines)`,
  },
  {
    name: "io.RawIOBase.read()",
    description: `Метод небуферизованного чтения из сырого потока. Читает и возвращает до size байт. Если size равен -1 или не указан — читает до конца файла (вызывает readall()).

RawIOBase — это низкоуровневый небуферизованный поток. В отличие от BufferedReader, здесь нет внутреннего буфера: каждый вызов read() напрямую обращается к ОС. Метод может вернуть меньше байт, чем запрошено, даже если данные ещё есть — это нормально для сырых потоков.

Возвращает bytes. При достижении EOF возвращает b'' (пустые байты). Если данные временно недоступны — возвращает None (только для неблокирующих потоков).`,
    syntax: "RawIOBase.read(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Максимальное количество байт для чтения. -1 (по умолчанию) — читать до EOF через readall().",
      },
    ],
    example: `import io

# FileIO — конкретная реализация RawIOBase
raw = io.FileIO('data.bin', 'rb')

# Чтение всего файла (size=-1)
data = raw.read()
print(len(data))   # размер файла в байтах

# Чтение первых 16 байт
raw.seek(0)
chunk = raw.read(16)
print(chunk)   # b'\\x89PNG\\r\\n...'

# read() может вернуть меньше size байт — это нормально
raw.seek(0)
part = raw.read(1024)   # запросили 1024, получили меньше если файл мал

# Чтение по кускам до EOF
raw.seek(0)
while True:
    chunk = raw.read(io.DEFAULT_BUFFER_SIZE)
    if not chunk:   # b'' — EOF
        break
    process(chunk)

raw.close()

# Обёртывание в BufferedReader для буферизации
raw = io.FileIO('data.bin', 'rb')
buffered = io.BufferedReader(raw)
data = buffered.read()   # буферизованное чтение
buffered.close()`,
  },
  {
    name: "io.RawIOBase.readall()",
    description: `Метод чтения всех байт от текущей позиции до конца файла. Возвращает bytes с полным содержимым от текущей позиции до EOF.

Вызывается автоматически из read(-1) или read() без аргументов. Для больших файлов загружает всё содержимое в память целиком — при работе с большими файлами лучше читать кусками через read(size).

Конкретные реализации (FileIO) переопределяют этот метод для эффективного чтения через системные вызовы ОС, которые могут читать файл сразу одной операцией.`,
    syntax: "RawIOBase.readall()",
    arguments: [],
    example: `import io

# Чтение всего файла через readall()
raw = io.FileIO('data.bin', 'rb')
data = raw.readall()
print(f'Прочитано: {len(data)} байт')
raw.close()

# readall() эквивалентен read(-1) и read()
raw = io.FileIO('data.bin', 'rb')
d1 = raw.readall()

raw.seek(0)
d2 = raw.read(-1)

raw.seek(0)
d3 = raw.read()

assert d1 == d2 == d3   # все три эквивалентны
raw.close()

# Чтение с промежуточной позиции
raw = io.FileIO('data.bin', 'rb')
raw.read(10)          # пропустить первые 10 байт
rest = raw.readall()  # прочитать всё остальное
raw.close()

# Для больших файлов — читать кусками, не readall()
def process_large_file(path, chunk_size=io.DEFAULT_BUFFER_SIZE):
    with io.FileIO(path, 'rb') as raw:
        while True:
            chunk = raw.read(chunk_size)
            if not chunk:
                break
            yield chunk`,
  },
  {
    name: "io.RawIOBase.readinto()",
    description: `Метод чтения байт непосредственно в предварительно выделенный буфер (объект, поддерживающий запись в буфер протокола buffer protocol). Возвращает количество прочитанных байт или None.

Главное преимущество перед read() — отсутствие лишнего выделения памяти: данные записываются напрямую в существующий объект bytearray или memoryview. Это критично для высокопроизводительного кода, обрабатывающего большие объёмы данных.

Возвращает количество реально прочитанных байт (может быть меньше len(b) даже если данные ещё есть), 0 при EOF, или None для неблокирующих потоков при отсутствии данных.`,
    syntax: "RawIOBase.readinto(b)",
    arguments: [
      {
        name: "b",
        description:
          "Изменяемый байтовый буфер (bytearray, memoryview, array.array) куда записываются прочитанные данные. Размер буфера определяет максимум байт для чтения.",
      },
    ],
    example: `import io

# Чтение в bytearray без выделения новой памяти
buf = bytearray(1024)   # буфер на 1024 байта

with io.FileIO('data.bin', 'rb') as raw:
    n = raw.readinto(buf)
    print(f'Прочитано: {n} байт')
    data = buf[:n]   # только реально прочитанные байты

# Повторное использование буфера для минимизации аллокаций
buf = bytearray(io.DEFAULT_BUFFER_SIZE)
with io.FileIO('large.bin', 'rb') as raw:
    total = 0
    while True:
        n = raw.readinto(buf)
        if not n:   # 0 — EOF, None — нет данных (неблокирующий)
            break
        total += n
        process(buf[:n])   # обработка прочитанных байт
    print(f'Итого: {total} байт')

# Использование memoryview для работы со срезами без копирования
buf = bytearray(4096)
mv = memoryview(buf)
with io.FileIO('data.bin', 'rb') as raw:
    n = raw.readinto(mv[100:200])   # читать в срез [100:200]
    print(n)   # прочитано в buf[100:100+n]`,
  },
  {
    name: "io.RawIOBase.write()",
    description: `Метод небуферизованной записи байт в сырой поток. Записывает объект байтов b в поток и возвращает количество реально записанных байт.

Как и read(), метод работает напрямую с ОС без внутреннего буфера. Возвращаемое количество байт может быть меньше len(b) — вызывающий код должен проверять это и при необходимости дозаписывать оставшееся.

Принимает любой объект, поддерживающий buffer protocol: bytes, bytearray, memoryview, array.array. Для удобной записи без проверки числа байт используйте BufferedWriter, который гарантирует полную запись.`,
    syntax: "RawIOBase.write(b)",
    arguments: [
      {
        name: "b",
        description:
          "Байтовый объект для записи (bytes, bytearray, memoryview). Возвращается количество реально записанных байт.",
      },
    ],
    example: `import io

# Простая запись через FileIO
with io.FileIO('output.bin', 'wb') as raw:
    n = raw.write(b'Hello, World!')
    print(f'Записано: {n} байт')   # 13

# ВАЖНО: write() может записать меньше чем len(b)
# Надёжная запись с проверкой
def write_all(raw_stream, data):
    """Гарантированная запись всех байт."""
    total = 0
    mv = memoryview(data)
    while total < len(data):
        n = raw_stream.write(mv[total:])
        if n is None or n == 0:
            raise IOError('Ошибка записи')
        total += n
    return total

with io.FileIO('data.bin', 'wb') as raw:
    write_all(raw, b'x' * 100000)

# Запись bytearray и memoryview
with io.FileIO('output.bin', 'wb') as raw:
    arr = bytearray(b'\\x00\\x01\\x02\\x03')
    raw.write(arr)

    mv = memoryview(b'binary data')
    raw.write(mv)

# BufferedWriter — удобнее, гарантирует полную запись
with io.FileIO('out.bin', 'wb') as raw:
    buffered = io.BufferedWriter(raw)
    buffered.write(b'автоматически полная запись')
    buffered.flush()`,
  },
  {
    name: "io.FileIO.mode",
    description: `Атрибут объекта FileIO (и любого файлового объекта), содержащий режим открытия файла в виде строки.

Возвращает строку, переданную в параметр mode при открытии файла: 'r', 'rb', 'w', 'wb', 'a', 'ab', 'r+', 'rb+', 'w+', 'wb+' и др. Позволяет узнать, в каком режиме открыт файл — полезно в универсальных функциях, принимающих файловый объект.

Атрибут доступен только для чтения. Присутствует на всех файловых объектах, возвращаемых open() и io.FileIO().`,
    syntax: "FileIO.mode",
    arguments: [],
    example: `import io

# Проверка режима через FileIO
raw = io.FileIO('data.bin', 'rb')
print(raw.mode)   # 'rb'
raw.close()

# Режим стандартного файлового объекта
with open('data.txt', 'r') as f:
    print(f.mode)   # 'r'

with open('data.txt', 'w') as f:
    print(f.mode)   # 'w'

with open('data.bin', 'rb+') as f:
    print(f.mode)   # 'rb+'

# Использование в универсальной функции
def is_binary_mode(file_obj):
    return 'b' in file_obj.mode

def is_writable_mode(file_obj):
    return any(m in file_obj.mode for m in ('w', 'a', 'x', '+'))

with open('data.txt', 'r') as f:
    print(is_binary_mode(f))    # False
    print(is_writable_mode(f))  # False

with open('data.bin', 'rb+') as f:
    print(is_binary_mode(f))    # True
    print(is_writable_mode(f))  # True

# Все возможные режимы
modes = ['r', 'rb', 'w', 'wb', 'a', 'ab', 'r+', 'rb+', 'w+', 'x']`,
  },
  {
    name: "io.FileIO.name",
    description: `Атрибут объекта FileIO (и любого файлового объекта), содержащий имя или дескриптор файла, переданный при открытии.

Если файл открыт по пути — возвращает строку с путём (как передан в open()). Если файл открыт по дескриптору (int) — возвращает этот целочисленный дескриптор. Атрибут присутствует на всех файловых объектах, включая TextIOWrapper, BufferedReader/Writer.

Полезен для логирования, отладки и отображения пользователю информации о том, с каким файлом ведётся работа. Только для чтения.`,
    syntax: "FileIO.name",
    arguments: [],
    example: `import io

# Имя файла, открытого по пути
with open('data.txt', 'r') as f:
    print(f.name)   # 'data.txt'

with open('/tmp/report.csv', 'w') as f:
    print(f.name)   # '/tmp/report.csv'

# FileIO — имя как путь
raw = io.FileIO('image.png', 'rb')
print(raw.name)   # 'image.png'
raw.close()

# Открытие по файловому дескриптору — name = int
import os
fd = os.open('data.txt', os.O_RDONLY)
with open(fd, 'r') as f:
    print(f.name)    # целое число, например: 5
    print(type(f.name))   # <class 'int'>

# Стандартные потоки
import sys
print(sys.stdin.name)    # '<stdin>'
print(sys.stdout.name)   # '<stdout>'
print(sys.stderr.name)   # '<stderr>'

# Использование в логировании
def log_file_operation(file_obj, operation):
    print(f'[{operation}] файл: {file_obj.name}, режим: {file_obj.mode}')

with open('report.txt', 'w') as f:
    log_file_operation(f, 'запись')
    # [запись] файл: report.txt, режим: w`,
  },
  {
    name: "io.BufferedIOBase.raw",
    description: `Атрибут, содержащий ссылку на базовый сырой (RawIOBase) поток, который обёрнут буферизованным потоком. Доступен у BufferedReader, BufferedWriter, BufferedRandom.

Позволяет получить прямой доступ к небуферизованному потоку нижнего уровня. Полезен для низкоуровневых операций, которые нельзя выполнить через буферизованный интерфейс, например: получение файлового дескриптора, применение флагов ОС, работа с неблокирующим режимом.

После вызова detach() атрибут raw становится недействительным. У BytesIO нет атрибута raw — он не оборачивает сырой поток.`,
    syntax: "BufferedIOBase.raw",
    arguments: [],
    example: `import io

# Получение сырого потока из BufferedReader
raw = io.FileIO('data.bin', 'rb')
buffered = io.BufferedReader(raw)

print(buffered.raw is raw)   # True
print(type(buffered.raw))    # <class '_io.FileIO'>

# Доступ к атрибутам сырого потока
print(buffered.raw.name)     # 'data.bin'
print(buffered.raw.mode)     # 'rb'

# Низкоуровневый дескриптор через raw
import os
fd = buffered.raw.fileno()
stat = os.fstat(fd)
print(f'Размер файла: {stat.st_size} байт')

# BufferedWriter
raw_w = io.FileIO('output.bin', 'wb')
buffered_w = io.BufferedWriter(raw_w)
print(type(buffered_w.raw))   # <class '_io.FileIO'>

buffered_w.close()   # закрывает и raw тоже

# open() возвращает буферизованный поток с .raw
with open('data.bin', 'rb') as f:
    print(type(f))        # <class '_io.BufferedReader'>
    print(type(f.raw))    # <class '_io.FileIO'>`,
  },
  {
    name: "io.BufferedIOBase.detach()",
    description: `Метод отсоединения базового сырого потока от буферизованного объекта. Возвращает сырой поток (RawIOBase), сбросив перед этим буфер записи (для BufferedWriter).

После detach() буферизованный объект становится непригодным для использования — любые попытки выполнить на нём операции ввода-вывода бросают ValueError. Сырой поток при этом остаётся открытым и пригодным для использования.

Используется в ситуациях, когда нужно передать владение потоком другому объекту или перейти от буферизованной работы к небуферизованной без закрытия файла.`,
    syntax: "BufferedIOBase.detach()",
    arguments: [],
    example: `import io

# Отсоединение сырого потока
raw = io.FileIO('data.bin', 'rb')
buffered = io.BufferedReader(raw)

# Работа через буферизованный поток
data = buffered.read(10)

# Отсоединяем — получаем сырой поток обратно
raw2 = buffered.detach()
print(raw2 is raw)   # True — тот же объект

# Буферизованный поток теперь непригоден
try:
    buffered.read()
except ValueError as e:
    print(e)   # raw stream has been detached

# Сырой поток по-прежнему работает
raw2.seek(0)
chunk = raw2.read(1024)
raw2.close()

# Смена буфера — типичный сценарий
raw = io.FileIO('data.bin', 'rb')
buf1 = io.BufferedReader(raw, buffer_size=1024)
raw_back = buf1.detach()
buf2 = io.BufferedReader(raw_back, buffer_size=65536)  # другой размер буфера
buf2.close()`,
  },
  {
    name: "io.BufferedIOBase.read()",
    description: `Метод чтения из буферизованного потока с внутренним буфером. Читает и возвращает до size байт. Если size равен -1 или не указан — читает до EOF. Возвращает bytes.

Ключевое отличие от RawIOBase.read(): буферизованный read() гарантирует возврат ровно size байт (или меньше только при EOF). Внутренний буфер снижает количество системных вызовов — данные читаются большими кусками из ОС, а возвращаются нужными порциями.

При EOF возвращает b''. Блокирует поток до получения нужного количества байт (для блокирующих потоков).`,
    syntax: "BufferedIOBase.read(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Количество байт для чтения. -1 (по умолчанию) — читать до EOF. В отличие от RawIOBase, гарантированно возвращает size байт (если EOF не достигнут раньше).",
      },
    ],
    example: `import io

# Буферизованное чтение файла
with open('data.bin', 'rb') as f:   # возвращает BufferedReader
    # Чтение всего файла
    data = f.read()

    # Чтение по N байт
    f.seek(0)
    header = f.read(4)    # ровно 4 байта (или меньше при EOF)
    body = f.read(1024)   # ровно 1024 байта (ил � остаток до EOF)

# Явный BufferedReader
raw = io.FileIO('data.bin', 'rb')
buf = io.BufferedReader(raw, buffer_size=io.DEFAULT_BUFFER_SIZE)

buf.read(16)    # 16 байт (1 системный вызов может прочитать 8192)
buf.read(16)    # ещё 16 байт — из буфера, без системного вызова!
buf.close()

# BytesIO — буферизованный поток в памяти
buf = io.BytesIO(b'Hello, World! Python io')
print(buf.read(5))    # b'Hello'
print(buf.read(2))    # b', '
print(buf.read(-1))   # b'World! Python io'  ← до EOF
print(buf.read())     # b''  ← EOF

# Чтение по кускам
with open('large.bin', 'rb') as f:
    while chunk := f.read(65536):
        process(chunk)`,
  },
  {
    name: "io.BufferedIOBase.read1()",
    description: `Метод чтения из буферизованного потока с использованием не более одного вызова к базовому сырому потоку. Возвращает bytes размером до size байт.

Ключевое отличие от read(): read() может выполнять несколько системных вызовов для накопления нужного числа байт, тогда как read1() ограничивается одним обращением к RawIOBase.read() или RawIOBase.readinto(). Если буфер не пуст — возвращает данные из него без обращения к ОС.

Полезен при реализации собственных протоколов, парсеров и обёрток потоков, где важно контролировать количество системных вызовов и избегать блокировки в ожидании данных.`,
    syntax: "BufferedIOBase.read1([size])",
    arguments: [
      {
        name: "size",
        description:
          "Максимальное количество байт для чтения. Если не указан или -1 — возвращает произвольное количество байт за одно обращение к базовому потоку.",
      },
    ],
    example: `import io

# Разница между read() и read1()
raw = io.FileIO('data.bin', 'rb')
buf = io.BufferedReader(raw, buffer_size=8192)

# read(100): может читать 8192 из ОС, вернуть 100 из буфера
chunk_a = buf.read(100)

# read1(100): возвращает то, что уже в буфере (может быть 8192-100=8092 байт)
# или читает из ОС ровно один раз и возвращает до 100 байт
chunk_b = buf.read1(100)

buf.close()

# Типичный сценарий: реализация peek-парсера
class ProtocolReader:
    def __init__(self, raw_stream):
        self.buf = io.BufferedReader(raw_stream)

    def read_message(self):
        # read1() без аргумента — один системный вызов
        # не блокирует дольше необходимого
        data = self.buf.read1()
        return data

# BytesIO
buf = io.BytesIO(b'Hello, World!')
print(buf.read1(5))    # b'Hello'
print(buf.read1(100))  # b', World!'  ← всё оставшееся за один вызов`,
  },
  {
    name: "io.BufferedIOBase.readinto()",
    description: `Метод буферизованного чтения непосредственно в предварительно выделенный буфер. Аналог RawIOBase.readinto(), но с внутренней буферизацией — данные могут поступать из буфера без обращения к ОС.

Принимает изменяемый байтовый объект (bytearray, memoryview) и записывает в него прочитанные байты. Возвращает количество реально прочитанных байт (0 при EOF). В отличие от RawIOBase.readinto(), гарантирует заполнение буфера полностью (до len(b) байт) если данных достаточно.

Сочетает преимущества буферизации (меньше системных вызовов) и работы без лишнего выделения памяти (zero-copy чтение в существующий буфер).`,
    syntax: "BufferedIOBase.readinto(b)",
    arguments: [
      {
        name: "b",
        description:
          "Изменяемый байтовый буфер (bytearray, memoryview) куда записываются прочитанные данные. Читается ровно len(b) байт (или меньше при EOF).",
      },
    ],
    example: `import io

# Буферизованное чтение в существующий буфер
buf = bytearray(1024)

with open('data.bin', 'rb') as f:   # BufferedReader
    n = f.readinto(buf)
    print(f'Прочитано: {n} байт')
    data = buf[:n]

# Повторное использование буфера (zero-copy обработка)
buf = bytearray(io.DEFAULT_BUFFER_SIZE)  # 8192 байт
with open('large.bin', 'rb') as f:
    while True:
        n = f.readinto(buf)
        if n == 0:   # EOF
            break
        process(buf[:n])

# Использование memoryview для работы со срезами
big_buffer = bytearray(65536)
mv = memoryview(big_buffer)

with open('data.bin', 'rb') as f:
    n1 = f.readinto(mv[:1024])    # прочитать в первые 1024 байт
    n2 = f.readinto(mv[1024:])    # прочитать остаток в хвост буфера

# Сравнение с readinto из RawIOBase
raw = io.FileIO('data.bin', 'rb')
buf_reader = io.BufferedReader(raw)
arr = bytearray(512)
n = buf_reader.readinto(arr)   # буферизовано — меньше системных вызовов
buf_reader.close()`,
  },
  {
    name: "io.BufferedIOBase.readinto1()",
    description: `Метод буферизованного чтения в существующий буфер, ограниченный одним обращением к базовому сырому потоку. Аналог read1(), но записывает данные в предоставленный буфер вместо создания нового объекта bytes.

Сочетает преимущества readinto() (zero-copy, без лишних аллокаций) и read1() (не более одного системного вызова к ОС). Возвращает количество прочитанных байт или 0 при EOF.

Применяется в высокопроизводительных парсерах протоколов и асинхронных обёртках, где нужно минимизировать как количество системных вызовов, так и число аллокаций памяти.`,
    syntax: "BufferedIOBase.readinto1(b)",
    arguments: [
      {
        name: "b",
        description:
          "Изменяемый байтовый буфер (bytearray, memoryview) куда записываются прочитанные данные. За один вызов выполняется не более одного обращения к базовому сырому потоку.",
      },
    ],
    example: `import io

# readinto1() — один системный вызов, zero-copy
buf = bytearray(4096)

raw = io.FileIO('data.bin', 'rb')
buffered = io.BufferedReader(raw)

# Не более одного обращения к raw за вызов
n = buffered.readinto1(buf)
print(f'Прочитано: {n} байт (не более одного системного вызова)')

# Сравнение readinto vs readinto1
buf_a = bytearray(4096)
buf_b = bytearray(4096)

raw = io.FileIO('data.bin', 'rb')
b_reader = io.BufferedReader(raw, buffer_size=8192)

# readinto: выполнит столько системных вызовов, сколько нужно для len(buf_a)
n_a = b_reader.readinto(buf_a)

b_reader.seek(0)
# readinto1: не более одного системного вызова
n_b = b_reader.readinto1(buf_b)

b_reader.close()

# Цикл с readinto1 для потокового парсинга
buf = bytearray(io.DEFAULT_BUFFER_SIZE)
with open('stream.bin', 'rb') as f:
    while True:
        n = f.readinto1(buf)
        if n == 0:
            break
        parse_chunk(buf[:n])   # обрабатываем одну порцию`,
  },
  {
    name: "io.BufferedIOBase.write()",
    description: `Метод записи байт в буферизованный поток. Записывает объект байтов b в внутренний буфер и возвращает количество записанных байт (всегда равное len(b)).

Ключевое отличие от RawIOBase.write(): буферизованный write() всегда записывает все байты (len(b)) — никогда не возвращает меньше. Данные сначала накапливаются во внутреннем буфере и сбрасываются в ОС одной порцией при переполнении буфера или вызове flush()/close().

Буферизация значительно ускоряет запись множества небольших порций данных, сокращая количество системных вызовов write().`,
    syntax: "BufferedIOBase.write(b)",
    arguments: [
      {
        name: "b",
        description:
          "Байтовый объект для записи (bytes, bytearray, memoryview). Всегда записываются все len(b) байт — возвращаемое значение всегда равно len(b).",
      },
    ],
    example: `import io

# Буферизованная запись через BufferedWriter
raw = io.FileIO('output.bin', 'wb')
buf = io.BufferedWriter(raw, buffer_size=8192)

# Множество мелких записей — эффективно благодаря буферу
for i in range(1000):
    n = buf.write(f'строка {i}\\n'.encode())
    print(n)   # всегда len(b), не меньше
# Реальные системные вызовы — значительно меньше 1000

buf.flush()   # сброс буфера в ОС
buf.close()   # flush() + close()

# open() возвращает BufferedWriter для 'wb'
with open('data.bin', 'wb') as f:
    f.write(b'\\x89PNG\\r\\n\\x1a\\n')   # PNG-заголовок
    f.write(b'\\x00' * 1024)            # нулевые данные

# BytesIO — запись в буфер в памяти
buf = io.BytesIO()
buf.write(b'Hello')
buf.write(b', ')
buf.write(b'World!')
print(buf.getvalue())   # b'Hello, World!'

# Запись bytearray и memoryview
with open('out.bin', 'wb') as f:
    f.write(bytearray([0x00, 0x01, 0x02, 0xFF]))
    f.write(memoryview(b'binary data')[2:7])`,
  },
  {
    name: "io.BytesIO.getbuffer()",
    description: `Метод получения объекта memoryview над внутренним буфером BytesIO без копирования данных. Возвращает записываемый memoryview, указывающий непосредственно на содержимое BytesIO.

Ключевые особенности: данные не копируются (zero-copy), memoryview поддерживает как чтение, так и запись (изменения видны через BytesIO), пока memoryview активен — BytesIO нельзя изменить в размере (нельзя вызвать write() если это изменит размер, seek() с расширением и т.п.).

Используется для передачи содержимого BytesIO в функции, принимающие buffer protocol, без лишних копий памяти.`,
    syntax: "BytesIO.getbuffer()",
    arguments: [],
    example: `import io

buf = io.BytesIO(b'Hello, World!')

# Получение memoryview без копирования
view = buf.getbuffer()
print(bytes(view))     # b'Hello, World!'
print(len(view))       # 13

# Запись через memoryview изменяет BytesIO
view[0] = ord('h')     # изменяем первый байт
print(buf.getvalue())  # b'hello, World!'

# Передача в функции, принимающие buffer protocol
view2 = buf.getbuffer()
# socket.send(view2)   # без копирования данных
# ssl_sock.write(view2)

# Пока view активен — нельзя менять размер
buf2 = io.BytesIO(b'data')
view3 = buf2.getbuffer()
try:
    buf2.write(b'extra')   # ошибка — resize запрещён
except BufferError as e:
    print(e)   # Existing exports of data: object cannot be re-sized

# Освобождение view разблокирует BytesIO
view3.release()
buf2.write(b'extra')   # теперь можно

# Срезы memoryview — zero-copy подмассивы
data = io.BytesIO(b'ABCDEFGH')
view4 = data.getbuffer()
sub = view4[2:5]       # срез без копирования
print(bytes(sub))      # b'CDE'`,
  },
  {
    name: "io.BytesIO.getvalue()",
    description: `Метод получения всего содержимого буфера BytesIO в виде объекта bytes. Возвращает копию всех данных независимо от текущей позиции указателя.

В отличие от read(), который возвращает данные от текущей позиции до конца, getvalue() всегда возвращает полное содержимое — с самого начала. Это позволяет получить результат записи не перематывая поток в начало.

Создаёт копию данных (в отличие от getbuffer()). Работает на открытом и закрытом BytesIO. Незаменим при использовании BytesIO как промежуточного буфера для сборки бинарных данных.`,
    syntax: "BytesIO.getvalue()",
    arguments: [],
    example: `import io

# Сборка бинарных данных в памяти
buf = io.BytesIO()
buf.write(b'\\x89PNG\\r\\n\\x1a\\n')   # PNG signature
buf.write(b'\\x00\\x00\\x00\\rIHDR')   # chunk header
buf.write(b'\\x00' * 13)               # IHDR data

# getvalue() не зависит от позиции
print(buf.tell())          # 26 (конец буфера)
data = buf.getvalue()      # все 26 байт с начала
print(len(data))           # 26

# Сравнение с read()
buf.seek(10)
print(len(buf.read()))     # 16 (от позиции 10 до конца)
buf.seek(10)
print(len(buf.getvalue())) # 26 (всегда полное содержимое!)

# Типичный паттерн: BytesIO как промежуточный буфер
def build_packet(cmd, payload):
    buf = io.BytesIO()
    buf.write(cmd.encode('ascii'))
    buf.write(len(payload).to_bytes(4, 'big'))
    buf.write(payload)
    return buf.getvalue()   # получить готовый пакет

packet = build_packet('DATA', b'hello')
print(packet)   # b'DATA\\x00\\x00\\x00\\x05hello'

# Работает и после close()
buf = io.BytesIO(b'test')
buf.close()
# buf.getvalue() — ValueError после close()`,
  },
  {
    name: "io.TextIOBase.encoding",
    description:
      'Атрибут класса TextIOBase. Строка, содержащая имя кодировки, используемой для преобразования байтов в строки и обратно. Например: "utf-8", "windows-1251", "ascii". Для StringIO всегда None — объект работает только со строками в памяти, без кодирования.',
    syntax: "stream.encoding",
    arguments: [],
    example: `import io

# TextIOWrapper — реальная кодировка файла:
with open('file.txt', 'r', encoding='utf-8') as f:
    print(f.encoding)   # 'utf-8'

# StringIO — работает только со строками, кодировки нет:
buf = io.StringIO()
print(buf.encoding)   # None

# Текстовый поток поверх байтового:
raw = io.BytesIO(b'hello')
wrapper = io.TextIOWrapper(raw, encoding='utf-8')
print(wrapper.encoding)   # 'utf-8'`,
  },
  {
    name: "io.TextIOBase.errors",
    description:
      'Атрибут класса TextIOBase. Строка, указывающая режим обработки ошибок кодирования/декодирования. Стандартные значения: "strict" (по умолчанию, выбрасывает UnicodeError), "ignore" (пропускать ошибочные символы), "replace" (заменять символом "?"), "backslashreplace", "xmlcharrefreplace". Для StringIO всегда None.',
    syntax: "stream.errors",
    arguments: [],
    example: `import io

# Режим обработки ошибок файла:
with open('file.txt', 'r', encoding='utf-8', errors='replace') as f:
    print(f.errors)   # 'replace'

# TextIOWrapper с явным указанием режима:
raw = io.BytesIO('кириллица'.encode('cp1251'))
wrapper = io.TextIOWrapper(raw, encoding='utf-8', errors='ignore')
print(wrapper.errors)   # 'ignore'
print(wrapper.read())   # Некорректные байты будут пропущены

# StringIO — нет кодирования, нет ошибок:
buf = io.StringIO('текст')
print(buf.errors)   # None`,
  },
  {
    name: "io.TextIOBase.newlines",
    description:
      'Атрибут класса TextIOBase. После чтения содержит информацию о переводах строк, встреченных в потоке. Может быть None (ещё не читали), строкой (один тип: "\\n", "\\r", "\\r\\n") или кортежем строк (несколько типов). Заполняется только при universal newlines translation (по умолчанию). Полезен для анализа формата переводов строк в файле.',
    syntax: "stream.newlines",
    arguments: [],
    example: `import io

# Файл с разными переводами строк:
buf = io.StringIO("line1\\nline2\\r\\nline3\\r")
buf.read()   # Читаем весь поток
print(buf.newlines)
# ('\\n', '\\r\\n', '\\r')  — все три типа встречены

# Только Unix-переводы:
buf2 = io.StringIO("line1\\nline2\\n")
buf2.read()
print(buf2.newlines)
# '\\n'

# До чтения — None:
buf3 = io.StringIO("text\\n")
print(buf3.newlines)   # None
buf3.readline()
print(buf3.newlines)   # '\\n'`,
  },
  {
    name: "io.TextIOBase.buffer",
    description:
      "Атрибут класса TextIOBase. Ссылка на базовый двоичный буферизованный поток (BufferedIOBase), поверх которого работает текстовый поток. Доступен у TextIOWrapper. У StringIO отсутствует (работает только в памяти со строками). Позволяет получить прямой доступ к байтам потока.",
    syntax: "stream.buffer",
    arguments: [],
    example: `import io

# TextIOWrapper имеет базовый байтовый буфер:
raw = io.BytesIO(b'hello world')
wrapper = io.TextIOWrapper(raw, encoding='utf-8')
print(type(wrapper.buffer))    # <class '_io.BytesIO'>
print(wrapper.buffer is raw)   # True

# Чтение байт напрямую через buffer:
wrapper.read(5)                # Читаем 5 символов текстом
print(wrapper.buffer.read())  # Читаем остаток байтами
# b' world'

# Стандартный stdin/stdout также имеет buffer:
import sys
sys.stdout.buffer.write(b'bytes output\\n')`,
  },
  {
    name: "io.TextIOBase.detach",
    description:
      "Метод класса TextIOBase. Отсоединяет и возвращает базовый двоичный поток (buffer) от TextIOWrapper. После вызова TextIOWrapper становится непригодным для использования (любые операции выбросят UnsupportedOperation). Используется когда нужно передать управление над байтовым потоком другому коду.",
    syntax: "stream.detach()",
    arguments: [],
    example: `import io

raw = io.BytesIO(b'hello world')
wrapper = io.TextIOWrapper(raw, encoding='utf-8')

# Чтение через wrapper:
print(wrapper.read(5))   # 'hello'

# Отсоединяем базовый поток:
binary_stream = wrapper.detach()
print(type(binary_stream))   # <class '_io.BytesIO'>
print(binary_stream.read())  # b' world'

# wrapper больше не используется:
try:
    wrapper.read()
except io.UnsupportedOperation as e:
    print(e)   # detached

# Полезно для передачи байтового потока:
def process_bytes(stream: io.RawIOBase):
    return stream.read()

result = process_bytes(wrapper.detach())`,
  },
  {
    name: "io.TextIOBase.read",
    description:
      'Метод класса TextIOBase. Читает и возвращает строку из потока. Если size не задан или равен -1 — читает до конца файла. При size > 0 — читает не более size символов (не байт). Возвращает пустую строку "" при достижении конца потока.',
    syntax: "stream.read(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Количество символов для чтения. -1 (по умолчанию) — читать до конца потока.",
      },
    ],
    example: `import io

buf = io.StringIO("Hello, World!")

# Чтение по 5 символов:
print(buf.read(5))    # 'Hello'
print(buf.read(2))    # ', '
print(buf.read())     # 'World!'  (до конца)
print(buf.read())     # ''        (конец потока)

# Перемотка и полное чтение:
buf.seek(0)
content = buf.read()
print(content)        # 'Hello, World!'

# Из файла:
with open('file.txt', 'r', encoding='utf-8') as f:
    chunk = f.read(1024)    # Блок по 1024 символа
    while chunk:
        print(chunk, end='')
        chunk = f.read(1024)`,
  },
  {
    name: "io.TextIOBase.readline",
    description:
      'Метод класса TextIOBase. Читает и возвращает одну строку из потока, включая символ перевода строки ("\\n") в конце. При достижении конца файла возвращает пустую строку "". Параметр size ограничивает максимальное число читаемых символов — строка обрезается, даже если перевод строки ещё не встречен.',
    syntax: "stream.readline(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Максимальное число символов для чтения. -1 (по умолчанию) — читать до конца строки или EOF.",
      },
    ],
    example: `import io

buf = io.StringIO("line1\\nline2\\nline3")

print(repr(buf.readline()))    # 'line1\\n'
print(repr(buf.readline()))    # 'line2\\n'
print(repr(buf.readline()))    # 'line3'   (без \\n — конец потока)
print(repr(buf.readline()))    # ''        (EOF)

# Ограничение по размеру:
buf.seek(0)
print(repr(buf.readline(3)))   # 'lin'  (обрезано до 3 символов)

# Построчный обход файла:
with open('file.txt', 'r', encoding='utf-8') as f:
    line = f.readline()
    while line:
        print(line, end='')
        line = f.readline()`,
  },
  {
    name: "io.TextIOBase.write",
    description:
      'Метод класса TextIOBase. Записывает строку s в поток и возвращает число записанных символов. Принимает только строки (str). Не добавляет перевод строки автоматически — при необходимости добавляйте "\\n" явно. Для записи байт используйте BytesIO и метод write() с байтовым аргументом.',
    syntax: "stream.write(s)",
    arguments: [
      {
        name: "s",
        description:
          "Строка (str) для записи в поток. Передача bytes вызывает TypeError.",
      },
    ],
    example: `import io

# StringIO:
buf = io.StringIO()
n = buf.write("Hello")
print(n)              # 5 (символов записано)
buf.write(", World!")
buf.write("\\n")       # Перевод строки явно

buf.seek(0)
print(buf.read())     # 'Hello, World!\\n'

# TextIOWrapper (запись в файл):
raw = io.BytesIO()
wrapper = io.TextIOWrapper(raw, encoding='utf-8')
wrapper.write("Привет\\n")
wrapper.write("Мир\\n")
wrapper.flush()

raw.seek(0)
print(raw.read())   # b'\\xd0\\x9f\\xd1\\x80\\xd0\\xb8\\xd0\\xb2\\xd0\\xb5\\xd1\\x82\\n...'`,
  },
  {
    name: "io.StringIO.getvalue",
    description:
      "Метод класса StringIO. Возвращает всё содержимое буфера в памяти как строку, независимо от текущей позиции указателя. В отличие от read(), не перемещает позицию и не требует предварительного seek(0). Выбрасывает ValueError если поток закрыт.",
    syntax: "stream.getvalue()",
    arguments: [],
    example: `import io

buf = io.StringIO()
buf.write("Hello")
buf.write(", ")
buf.write("World!")

# Получить всё содержимое без seek(0):
print(buf.getvalue())   # 'Hello, World!'

# Позиция не изменилась:
print(buf.tell())       # 13 (конец буфера)
buf.write(" More")
print(buf.getvalue())   # 'Hello, World! More'

# Удобно для сбора вывода:
import sys
old_stdout = sys.stdout
sys.stdout = io.StringIO()

print("captured line 1")
print("captured line 2")

output = sys.stdout.getvalue()
sys.stdout = old_stdout
print(repr(output))
# 'captured line 1\\ncaptured line 2\\n'`,
  },
  {
    name: "io.TextIOWrapper.line_buffering",
    description:
      'Атрибут класса TextIOWrapper. Булево значение: True, если включена построчная буферизация (данные сбрасываются в базовый поток при каждом записанном символе "\\n"). Устанавливается при создании через параметр line_buffering=True. Полезно для вывода в реальном времени (логи, консольный вывод).',
    syntax: "wrapper.line_buffering",
    arguments: [],
    example: `import io

raw = io.BytesIO()

# Без построчной буферизации:
w1 = io.TextIOWrapper(raw, encoding='utf-8', line_buffering=False)
print(w1.line_buffering)   # False

# С построчной буферизацией:
raw2 = io.BytesIO()
w2 = io.TextIOWrapper(raw2, encoding='utf-8', line_buffering=True)
print(w2.line_buffering)   # True

w2.write("line1\\n")   # Автоматически flush при \\n
w2.write("partial")   # Ещё не сброшено (нет \\n)

# Стандартный stderr обычно использует построчную буферизацию:
import sys
print(sys.stderr.line_buffering)   # True`,
  },
  {
    name: "io.TextIOWrapper.write_through",
    description:
      "Атрибут класса TextIOWrapper. Булево значение: True, если каждый вызов write() немедленно сбрасывает данные в базовый байтовый буфер (без накопления в TextIOWrapper). Не означает сброс до диска — данные могут оставаться в буфере BytesIO или BufferedWriter. Устанавливается при создании через параметр write_through=True.",
    syntax: "wrapper.write_through",
    arguments: [],
    example: `import io

raw = io.BytesIO()

# Обычный режим — данные могут накапливаться:
w1 = io.TextIOWrapper(raw, encoding='utf-8', write_through=False)
print(w1.write_through)   # False

# Режим write_through — каждый write() сразу уходит в BytesIO:
raw2 = io.BytesIO()
w2 = io.TextIOWrapper(raw2, encoding='utf-8', write_through=True)
print(w2.write_through)   # True

w2.write("hello")
# Данные сразу в raw2, без ожидания flush():
raw2.seek(0)
print(raw2.read())   # b'hello'`,
  },
  {
    name: "io.TextIOWrapper.reconfigure",
    description:
      "Метод класса TextIOWrapper. Переконфигурирует поток с новыми параметрами кодирования или буферизации. Позволяет изменить encoding, errors, newline, line_buffering или write_through на уже существующем потоке. Выбрасывает UnsupportedOperation если поток не пуст (есть непрочитанные данные) при смене кодировки.",
    syntax:
      "wrapper.reconfigure(*, encoding=None, errors=None, newline=None, line_buffering=None, write_through=None)",
    arguments: [
      {
        name: "encoding",
        description:
          "Новая кодировка. Если None — текущая кодировка не меняется.",
      },
      {
        name: "errors",
        description:
          'Новый режим обработки ошибок ("strict", "ignore", "replace" и др.). Если None — не меняется.',
      },
      {
        name: "newline",
        description:
          "Новый режим обработки переводов строк. Если None — не меняется.",
      },
      {
        name: "line_buffering",
        description:
          "Включить/выключить построчную буферизацию. Если None — не меняется.",
      },
      {
        name: "write_through",
        description:
          "Включить/выключить режим немедленной записи в базовый поток. Если None — не меняется.",
      },
    ],
    example: `import io

raw = io.BytesIO()
wrapper = io.TextIOWrapper(raw, encoding='utf-8')
print(wrapper.encoding)        # 'utf-8'
print(wrapper.line_buffering)  # False

# Переключение на другую кодировку:
wrapper.reconfigure(encoding='latin-1')
print(wrapper.encoding)        # 'latin-1'

# Включение построчной буферизации:
wrapper.reconfigure(line_buffering=True)
print(wrapper.line_buffering)  # True

# Несколько параметров сразу:
wrapper.reconfigure(
    encoding='utf-8',
    errors='replace',
    write_through=True,
)`,
  },
  {
    name: "io.IncrementalNewlineDecoder.decode",
    description:
      "Метод вспомогательного класса IncrementalNewlineDecoder из модуля io. Декодирует входные данные с нормализацией переводов строк (\\r\\n и \\r → \\n). Параметр final=True сигнализирует, что это последний фрагмент данных — декодер сбрасывает внутреннее состояние.",
    syntax: "decoder.decode(input, final=False)",
    arguments: [
      {
        name: "input",
        description:
          "Байтовая строка (bytes) или строка (str) для декодирования.",
      },
      {
        name: "final",
        description:
          "Если True — последний фрагмент; декодер завершает обработку и сбрасывает буфер. По умолчанию False.",
      },
    ],
    example: `import io

decoder = io.IncrementalNewlineDecoder(
    decoder=None,   # None — входные данные уже строки
    translate=True, # Нормализовать переводы строк → \\n
)

# Нормализация переводов строк:
print(repr(decoder.decode("line1\\r\\nline2\\r", final=False)))
# 'line1\\nline2'   (\\r в конце буферизован)

print(repr(decoder.decode("\\nline3", final=True)))
# '\\nline3'        (буфер сброшен: \\r + \\n → \\n)

# С базовым декодером (bytes → str):
import codecs
base = codecs.getincrementaldecoder('utf-8')('strict')
nd = io.IncrementalNewlineDecoder(base, translate=True)
print(repr(nd.decode(b"hello\\r\\nworld", final=True)))
# 'hello\\nworld'`,
  },
  {
    name: "io.IncrementalNewlineDecoder.getstate",
    description:
      "Метод вспомогательного класса IncrementalNewlineDecoder. Возвращает текущее состояние декодера в виде кортежа (buffer, flags), где buffer — накопленные данные, flags — целочисленные флаги состояния. Используется для сохранения состояния с целью последующего восстановления через setstate().",
    syntax: "decoder.getstate()",
    arguments: [],
    example: `import io

decoder = io.IncrementalNewlineDecoder(decoder=None, translate=True)

# Начальное состояние:
state = decoder.getstate()
print(state)   # (b'', 0)  — буфер пуст, флаги 0

# После частичного декодирования (\\r без \\n — в буфере):
decoder.decode("line1\\r", final=False)
state_mid = decoder.getstate()
print(state_mid)   # Буфер содержит незавершённый \\r

# Сохранение/восстановление:
saved = decoder.getstate()
# ... другая работа ...
decoder.setstate(saved)   # Возврат к сохранённому состоянию`,
  },
  {
    name: "io.IncrementalNewlineDecoder.setstate",
    description:
      "Метод вспомогательного класса IncrementalNewlineDecoder. Восстанавливает состояние декодера из кортежа, ранее полученного через getstate(). Позволяет реализовать возобновляемое декодирование: сохранить состояние после обработки фрагмента данных, а затем продолжить с того же места.",
    syntax: "decoder.setstate(state)",
    arguments: [
      {
        name: "state",
        description:
          "Кортеж (buffer, flags), ранее полученный через getstate(). buffer — байтовые данные, flags — целочисленные флаги состояния.",
      },
    ],
    example: `import io

decoder = io.IncrementalNewlineDecoder(decoder=None, translate=True)

# Декодируем первый фрагмент:
result1 = decoder.decode("part1\\r", final=False)

# Сохраняем состояние:
saved_state = decoder.getstate()

# Продолжаем:
result2 = decoder.decode("\\npart2\\n", final=True)
print(repr(result1 + result2))   # 'part1\\npart2\\n'

# Восстанавливаем к моменту после первого фрагмента:
decoder.setstate(saved_state)

# Повторяем обработку со второго фрагмента:
result2_retry = decoder.decode("\\npart2_retry\\n", final=True)
print(repr(result2_retry))   # '\\npart2_retry\\n'`,
  },
  {
    name: "io.IncrementalNewlineDecoder.newlines",
    description:
      'Атрибут вспомогательного класса IncrementalNewlineDecoder. Аналогичен TextIOBase.newlines. После декодирования содержит информацию о переводах строк, встреченных во входных данных: None (не встречено), строка (один тип) или кортеж строк (несколько типов). Значения: "\\n", "\\r", "\\r\\n".',
    syntax: "decoder.newlines",
    arguments: [],
    example: `import io

decoder = io.IncrementalNewlineDecoder(decoder=None, translate=True)

print(decoder.newlines)   # None (ещё не декодировали)

decoder.decode("line1\\n", final=False)
print(decoder.newlines)   # '\\n'

decoder.decode("line2\\r\\n", final=False)
print(decoder.newlines)   # ('\\n', '\\r\\n')

decoder.decode("line3\\r", final=True)
print(decoder.newlines)   # ('\\n', '\\r\\n', '\\r')  — все три типа

# Полезно для анализа формата файла:
def detect_newlines(text: str) -> str | tuple | None:
    d = io.IncrementalNewlineDecoder(None, translate=False)
    d.decode(text, final=True)
    return d.newlines`,
  },
  {
    name: "aiohttp.ClientSession.request",
    description:
      "Универсальный метод класса ClientSession библиотеки aiohttp для выполнения HTTP-запроса с произвольным методом. Является основой для методов get(), post(), put() и других. Возвращает объект ClientResponse в виде асинхронного контекстного менеджера. Используется когда нужен метод, не имеющий собственного shortcut-метода.",
    syntax: "await session.request(method, url, **kwargs)",
    arguments: [
      {
        name: "method",
        description:
          'Строка HTTP-метода в верхнем регистре: "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS" и др.',
      },
      { name: "url", description: "URL запроса — строка или yarl.URL объект." },
      {
        name: "params",
        description:
          "Параметры строки запроса (query string). dict, list кортежей или строка.",
      },
      {
        name: "data",
        description:
          "Тело запроса: bytes, str, dict (form-data), AsyncIterable или FormData.",
      },
      {
        name: "json",
        description:
          "Объект Python, который будет сериализован в JSON и отправлен как тело с Content-Type: application/json.",
      },
      {
        name: "headers",
        description:
          "Дополнительные HTTP-заголовки запроса в виде dict или CIMultiDict.",
      },
      {
        name: "timeout",
        description:
          "Объект aiohttp.ClientTimeout с ограничениями времени ожидания.",
      },
      {
        name: "ssl",
        description:
          "SSL-контекст, False (отключить проверку) или None (по умолчанию).",
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Универсальный запрос:
        async with session.request('GET', 'https://httpbin.org/get',
                                   params={'key': 'value'}) as resp:
            print(resp.status)          # 200
            data = await resp.json()
            print(data['url'])

        # PATCH через request():
        async with session.request(
            'PATCH',
            'https://api.example.com/items/1',
            json={'name': 'updated'},
            headers={'Authorization': 'Bearer token'},
        ) as resp:
            print(await resp.json())

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientSession.get",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP GET-запрос. Shortcut для session.request("GET", url, **kwargs). Возвращает объект ClientResponse в виде асинхронного контекстного менеджера. Используется для получения данных от API, загрузки страниц и файлов.',
    syntax: "await session.get(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL запроса — строка или yarl.URL." },
      {
        name: "params",
        description: "Параметры query string: dict, list пар или строка.",
      },
      { name: "headers", description: "Дополнительные заголовки запроса." },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
      {
        name: "allow_redirects",
        description: "Следовать ли редиректам. По умолчанию True.",
      },
      {
        name: "ssl",
        description:
          "SSL-контекст или False для отключения проверки сертификата.",
      },
    ],
    example: `import aiohttp
import asyncio

async def fetch_data():
    async with aiohttp.ClientSession() as session:
        # Простой GET:
        async with session.get('https://api.github.com/users/python') as resp:
            print(resp.status)       # 200
            user = await resp.json()
            print(user['login'])     # 'python'

        # С параметрами:
        params = {'q': 'aiohttp', 'sort': 'stars'}
        async with session.get(
            'https://api.github.com/search/repositories',
            params=params,
            headers={'Accept': 'application/vnd.github.v3+json'},
        ) as resp:
            data = await resp.json()
            print(data['total_count'])

asyncio.run(fetch_data())`,
  },
  {
    name: "aiohttp.ClientSession.post",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP POST-запрос. Shortcut для session.request("POST", url, **kwargs). Поддерживает отправку JSON, form-data, файлов и произвольных байт. Возвращает объект ClientResponse через асинхронный контекстный менеджер.',
    syntax: "await session.post(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL запроса." },
      {
        name: "data",
        description:
          "Тело запроса: bytes, str, dict (form-data), FormData или AsyncIterable.",
      },
      {
        name: "json",
        description:
          "Python-объект для отправки как JSON (устанавливает Content-Type: application/json).",
      },
      { name: "headers", description: "Дополнительные заголовки запроса." },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
    ],
    example: `import aiohttp
import asyncio

async def send_data():
    async with aiohttp.ClientSession() as session:
        # Отправка JSON:
        async with session.post(
            'https://api.example.com/users',
            json={'name': 'Ivan', 'email': 'ivan@example.com'},
        ) as resp:
            result = await resp.json()
            print(result['id'])

        # Отправка form-data:
        async with session.post(
            'https://httpbin.org/post',
            data={'field1': 'value1', 'field2': 'value2'},
        ) as resp:
            print(resp.status)

        # Загрузка файла:
        with open('photo.jpg', 'rb') as f:
            async with session.post(
                'https://api.example.com/upload',
                data={'file': f},
            ) as resp:
                print(await resp.text())

asyncio.run(send_data())`,
  },
  {
    name: "aiohttp.ClientSession.put",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP PUT-запрос. Shortcut для session.request("PUT", url, **kwargs). Обычно используется для полной замены существующего ресурса. Поддерживает те же параметры тела запроса, что и post().',
    syntax: "await session.put(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL запроса." },
      {
        name: "data",
        description: "Тело запроса: bytes, str, dict или AsyncIterable.",
      },
      { name: "json", description: "Python-объект для сериализации в JSON." },
      { name: "headers", description: "Дополнительные заголовки." },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
    ],
    example: `import aiohttp
import asyncio

async def update_resource():
    async with aiohttp.ClientSession(
        headers={'Authorization': 'Bearer mytoken'}
    ) as session:
        payload = {
            'id': 42,
            'name': 'Updated Name',
            'email': 'new@example.com',
            'active': True,
        }
        async with session.put(
            'https://api.example.com/users/42',
            json=payload,
        ) as resp:
            if resp.status == 200:
                updated = await resp.json()
                print(f'Обновлено: {updated["name"]}')
            else:
                print(f'Ошибка: {resp.status}')

asyncio.run(update_resource())`,
  },
  {
    name: "aiohttp.ClientSession.patch",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP PATCH-запрос. Shortcut для session.request("PATCH", url, **kwargs). Используется для частичного обновления ресурса — в теле передаются только изменяемые поля, в отличие от PUT, который заменяет объект целиком.',
    syntax: "await session.patch(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL запроса." },
      {
        name: "data",
        description: "Тело запроса: bytes, str, dict или AsyncIterable.",
      },
      { name: "json", description: "Python-объект для частичного обновления." },
      { name: "headers", description: "Дополнительные заголовки." },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
    ],
    example: `import aiohttp
import asyncio

async def partial_update():
    async with aiohttp.ClientSession() as session:
        # Обновляем только имя (остальные поля не меняются):
        async with session.patch(
            'https://api.example.com/users/42',
            json={'name': 'New Name'},
            headers={'Authorization': 'Bearer token'},
        ) as resp:
            print(resp.status)   # 200
            data = await resp.json()
            print(data['name'])  # 'New Name'

        # Несколько полей:
        async with session.patch(
            'https://api.example.com/articles/1',
            json={'title': 'Updated', 'published': True},
        ) as resp:
            print(await resp.json())

asyncio.run(partial_update())`,
  },
  {
    name: "aiohttp.ClientSession.delete",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP DELETE-запрос. Shortcut для session.request("DELETE", url, **kwargs). Используется для удаления ресурса на сервере. Обычно возвращает статус 204 No Content или 200 с телом ответа.',
    syntax: "await session.delete(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL ресурса для удаления." },
      {
        name: "headers",
        description: "Дополнительные заголовки (например, Authorization).",
      },
      { name: "params", description: "Параметры query string." },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
    ],
    example: `import aiohttp
import asyncio

async def delete_resource():
    async with aiohttp.ClientSession(
        headers={'Authorization': 'Bearer mytoken'}
    ) as session:
        async with session.delete(
            'https://api.example.com/users/42',
        ) as resp:
            if resp.status == 204:
                print('Удалено успешно')
            elif resp.status == 404:
                print('Ресурс не найден')
            else:
                text = await resp.text()
                print(f'Ошибка {resp.status}: {text}')

        # Мягкое удаление с параметром:
        async with session.delete(
            'https://api.example.com/items/5',
            params={'soft': 'true'},
        ) as resp:
            print(resp.status)

asyncio.run(delete_resource())`,
  },
  {
    name: "aiohttp.ClientSession.head",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP HEAD-запрос. Shortcut для session.request("HEAD", url, **kwargs). HEAD идентичен GET, но сервер возвращает только заголовки без тела ответа. Используется для проверки существования ресурса и получения метаданных (Content-Length, Last-Modified) без загрузки тела.',
    syntax: "await session.head(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL запроса." },
      { name: "headers", description: "Дополнительные заголовки." },
      {
        name: "allow_redirects",
        description: "Следовать ли редиректам. По умолчанию False для HEAD.",
      },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
    ],
    example: `import aiohttp
import asyncio

async def check_resource():
    async with aiohttp.ClientSession() as session:
        async with session.head('https://example.com/file.pdf') as resp:
            print(resp.status)
            size = resp.headers.get('Content-Length', 'unknown')
            content_type = resp.headers.get('Content-Type', '')
            last_modified = resp.headers.get('Last-Modified', '')

            print(f'Размер: {size} байт')
            print(f'Тип: {content_type}')
            print(f'Изменён: {last_modified}')
            # Тело ответа недоступно (resp.text() вернёт '')

asyncio.run(check_resource())`,
  },
  {
    name: "aiohttp.ClientSession.options",
    description:
      'Метод класса ClientSession библиотеки aiohttp. Выполняет HTTP OPTIONS-запрос. Shortcut для session.request("OPTIONS", url, **kwargs). Используется для получения списка допустимых HTTP-методов для ресурса и для preflight-запросов CORS (Cross-Origin Resource Sharing).',
    syntax: "await session.options(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL запроса." },
      { name: "headers", description: "Дополнительные заголовки." },
      { name: "timeout", description: "Объект aiohttp.ClientTimeout." },
    ],
    example: `import aiohttp
import asyncio

async def check_allowed_methods():
    async with aiohttp.ClientSession() as session:
        async with session.options('https://api.example.com/users') as resp:
            print(resp.status)    # 200 или 204

            # Список допустимых методов:
            allowed = resp.headers.get('Allow', '')
            print(f'Разрешены: {allowed}')
            # 'GET, POST, HEAD, OPTIONS'

            # CORS-заголовки:
            origin = resp.headers.get('Access-Control-Allow-Origin', '')
            methods = resp.headers.get('Access-Control-Allow-Methods', '')
            print(f'CORS origin: {origin}')
            print(f'CORS methods: {methods}')

asyncio.run(check_allowed_methods())`,
  },
  {
    name: "aiohttp.ClientSession.ws_connect",
    description:
      "Метод класса ClientSession библиотеки aiohttp. Устанавливает WebSocket-соединение. Возвращает объект ClientWebSocketResponse через асинхронный контекстный менеджер. Позволяет отправлять и получать сообщения в реальном времени. Поддерживает текстовые, бинарные сообщения и ping/pong.",
    syntax: "await session.ws_connect(url, **kwargs)",
    arguments: [
      { name: "url", description: "URL WebSocket-сервера (ws:// или wss://)." },
      {
        name: "protocols",
        description: "Список поддерживаемых подпротоколов WebSocket.",
      },
      {
        name: "headers",
        description:
          "Дополнительные заголовки HTTP-запроса установки соединения.",
      },
      {
        name: "heartbeat",
        description:
          "Интервал ping в секундах для поддержания соединения живым.",
      },
      {
        name: "compress",
        description:
          "Уровень сжатия (0 — выключено, 9 — максимальное). None — по умолчанию.",
      },
      {
        name: "timeout",
        description: "Время ожидания установки соединения в секундах.",
      },
    ],
    example: `import aiohttp
import asyncio

async def websocket_client():
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(
            'wss://echo.websocket.org',
            heartbeat=30,   # Ping каждые 30 секунд
        ) as ws:
            # Отправка текстового сообщения:
            await ws.send_str('Hello, WebSocket!')

            # Получение ответа:
            msg = await ws.receive()
            if msg.type == aiohttp.WSMsgType.TEXT:
                print(f'Получено: {msg.data}')
            elif msg.type == aiohttp.WSMsgType.ERROR:
                print(f'Ошибка: {ws.exception()}')

            # Цикл приёма:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    print(msg.data)
                elif msg.type == aiohttp.WSMsgType.CLOSED:
                    break

asyncio.run(websocket_client())`,
  },
  {
    name: "aiohttp.ClientSession.close",
    description:
      "Метод класса ClientSession библиотеки aiohttp. Закрывает сессию и освобождает все связанные ресурсы: соединения в пуле, коннекторы, внутренние задачи. Является корутиной — необходимо вызывать через await. При использовании ClientSession как контекстного менеджера (async with) close() вызывается автоматически.",
    syntax: "await session.close()",
    arguments: [],
    example: `import aiohttp
import asyncio

# Рекомендуемый способ — async with (close() автоматически):
async def with_context_manager():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            print(await resp.json())
    # close() вызван автоматически

# Ручное управление (например, для переиспользования сессии):
async def manual_session():
    session = aiohttp.ClientSession()
    try:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.status)

        async with session.post('https://httpbin.org/post',
                                json={'key': 'value'}) as resp:
            print(await resp.json())
    finally:
        await session.close()   # Обязательно в finally

asyncio.run(with_context_manager())`,
  },
  {
    name: "aiohttp.ClientSession.closed",
    description:
      "Атрибут класса ClientSession библиотеки aiohttp. Булево свойство — True если сессия закрыта (вызван close() или завершён блок async with). Позволяет проверить состояние сессии перед выполнением запроса. После закрытия любые запросы через сессию вызовут исключение.",
    syntax: "session.closed",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    session = aiohttp.ClientSession()
    print(session.closed)   # False

    await session.close()
    print(session.closed)   # True

    # С контекстным менеджером:
    async with aiohttp.ClientSession() as session:
        print(session.closed)   # False
    print(session.closed)       # True

    # Проверка перед запросом:
    if not session.closed:
        async with session.get('https://example.com') as resp:
            print(resp.status)
    else:
        print('Сессия закрыта, создайте новую')

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientSession.connector",
    description:
      "Атрибут класса ClientSession библиотеки aiohttp. Возвращает объект коннектора (BaseConnector), используемого сессией для управления пулом соединений. По умолчанию — TCPConnector. Через коннектор можно настроить лимиты соединений, SSL, keepalive и DNS-кэш.",
    syntax: "session.connector",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    # Настройка коннектора вручную:
    connector = aiohttp.TCPConnector(
        limit=100,           # Максимум 100 соединений
        limit_per_host=10,   # Максимум 10 на один хост
        ttl_dns_cache=300,   # DNS-кэш 5 минут
        ssl=False,           # Отключить проверку SSL
    )
    async with aiohttp.ClientSession(connector=connector) as session:
        print(type(session.connector))
        # <class 'aiohttp.connector.TCPConnector'>

        # Статистика коннектора:
        print(session.connector._limit)    # 100

        async with session.get('https://example.com') as resp:
            print(resp.status)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientSession.cookie_jar",
    description:
      "Атрибут класса ClientSession библиотеки aiohttp. Возвращает объект хранилища куки (AbstractCookieJar). По умолчанию — CookieJar, который автоматически сохраняет и отправляет куки между запросами. Можно заменить на DummyCookieJar для отключения куки или CookieJar(unsafe=True) для работы с IP-адресами.",
    syntax: "session.cookie_jar",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Выполняем запрос — куки сохраняются автоматически:
        async with session.get('https://httpbin.org/cookies/set/key/value') as resp:
            pass

        # Доступ к сохранённым куки:
        for cookie in session.cookie_jar:
            print(cookie.key, cookie.value)

        # Ручная установка куки:
        session.cookie_jar.update_cookies({'my_cookie': 'my_value'})

    # Отключение куки:
    jar = aiohttp.DummyCookieJar()
    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        print(type(session.cookie_jar))
        # <class 'aiohttp.cookiejar.DummyCookieJar'>

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientSession.loop",
    description:
      "Атрибут класса ClientSession библиотеки aiohttp. Возвращает объект цикла событий asyncio (event loop), связанного с данной сессией. Устарел начиная с aiohttp 4.x — использование loop в asyncio-объектах не рекомендуется. Для получения текущего цикла используйте asyncio.get_event_loop().",
    syntax: "session.loop",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        loop = session.loop
        print(type(loop))
        # <class 'uvloop.Loop'> или <class 'asyncio.unix_events._UnixSelectorEventLoop'>

        # Современная альтернатива (рекомендуется):
        current_loop = asyncio.get_event_loop()
        print(loop is current_loop)   # True

        # Проверка состояния цикла:
        print(loop.is_running())   # True (внутри async функции)
        print(loop.is_closed())    # False

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientSession.timeout",
    description:
      "Атрибут класса ClientSession библиотеки aiohttp. Возвращает объект ClientTimeout с настройками тайм-аутов по умолчанию для всех запросов сессии. Задаётся при создании сессии. Отдельные запросы могут переопределять тайм-аут через параметр timeout. При превышении выбрасывается asyncio.TimeoutError.",
    syntax: "session.timeout",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    # Настройка тайм-аутов для всей сессии:
    timeout = aiohttp.ClientTimeout(
        total=30,           # Общее время запроса
        connect=5,          # Время установки соединения
        sock_connect=5,     # Время TCP-соединения
        sock_read=10,       # Время чтения данных
    )
    async with aiohttp.ClientSession(timeout=timeout) as session:
        print(session.timeout.total)    # 30
        print(session.timeout.connect)  # 5

        try:
            async with session.get('https://slow-site.example.com') as resp:
                print(await resp.text())
        except asyncio.TimeoutError:
            print('Превышено время ожидания')

        # Переопределение для конкретного запроса:
        custom = aiohttp.ClientTimeout(total=5)
        async with session.get('https://example.com', timeout=custom) as resp:
            print(resp.status)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.status",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Целочисленный HTTP-статус код ответа сервера (например: 200, 201, 404, 500). Доступен сразу после получения заголовков, до чтения тела ответа. Соответствует полю status_code в библиотеке requests.",
    syntax: "response.status",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/status/404') as resp:
            print(resp.status)   # 404

        async with session.get('https://httpbin.org/get') as resp:
            print(resp.status)   # 200

            # Проверка успешности:
            if resp.status == 200:
                data = await resp.json()
            elif resp.status == 404:
                print('Не найдено')
            elif resp.status >= 500:
                print('Ошибка сервера')

            # Альтернатива — свойство ok:
            print(resp.ok)   # True если 200 <= status < 300

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.reason",
    description:
      'Атрибут объекта ClientResponse библиотеки aiohttp. Строка с текстовым описанием HTTP-статуса ответа (reason phrase). Например: "OK" для 200, "Not Found" для 404, "Internal Server Error" для 500. Соответствует стандартным описаниям HTTP-статусов по RFC 7231.',
    syntax: "response.reason",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.status)    # 200
            print(resp.reason)    # 'OK'

        async with session.get('https://httpbin.org/status/404') as resp:
            print(resp.status)    # 404
            print(resp.reason)    # 'NOT FOUND'

        async with session.get('https://httpbin.org/status/500') as resp:
            print(resp.status)    # 500
            print(resp.reason)    # 'INTERNAL SERVER ERROR'

        # Вывод полного статуса:
        async with session.get('https://example.com') as resp:
            print(f'{resp.status} {resp.reason}')
            # '200 OK'

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.ok",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Булево свойство — True если HTTP-статус ответа находится в диапазоне 200–299 (успешные ответы). False для любых других кодов (редиректы, ошибки клиента, ошибки сервера). Удобная альтернатива проверке resp.status == 200.",
    syntax: "response.ok",
    arguments: [],
    example: `import aiohttp
import asyncio

async def fetch(url: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.ok:
                return await resp.json()
            else:
                print(f'Ошибка: {resp.status} {resp.reason}')
                return None

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.ok)    # True  (200)

        async with session.get('https://httpbin.org/status/404') as resp:
            print(resp.ok)    # False (404)

        async with session.get('https://httpbin.org/status/301') as resp:
            print(resp.ok)    # False (301, но обычно редирект следован)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.method",
    description:
      'Атрибут объекта ClientResponse библиотеки aiohttp. Строка с HTTP-методом запроса, который породил данный ответ. Например: "GET", "POST", "PUT". Полезен при обработке ответов в обобщённых функциях, когда метод запроса не известен заранее.',
    syntax: "response.method",
    arguments: [],
    example: `import aiohttp
import asyncio

async def log_response(resp: aiohttp.ClientResponse):
    print(f'{resp.method} {resp.url} → {resp.status} {resp.reason}')
    # 'GET https://httpbin.org/get → 200 OK'
    # 'POST https://api.example.com/users → 201 CREATED'

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.method)   # 'GET'
            await log_response(resp)

        async with session.post('https://httpbin.org/post',
                                json={'key': 'val'}) as resp:
            print(resp.method)   # 'POST'
            await log_response(resp)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.url",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект yarl.URL с адресом запроса, которым был получен ответ. После редиректов содержит URL последнего запроса в цепочке (конечный адрес). Для получения исходного URL запроса (до редиректов) используйте real_url.",
    syntax: "response.url",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Без редиректов:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.url)
            # URL('https://httpbin.org/get')
            print(str(resp.url))
            # 'https://httpbin.org/get'
            print(resp.url.host)    # 'httpbin.org'
            print(resp.url.path)    # '/get'

        # С редиректом (url → конечный адрес):
        async with session.get('http://httpbin.org/redirect/1') as resp:
            print(resp.url)
            # URL('https://httpbin.org/get')  ← после редиректа

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.real_url",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект yarl.URL с исходным URL запроса — тем, который был передан в метод session.get() / session.post() и т.д., до применения каких-либо редиректов. В отличие от url, не изменяется в цепочке редиректов.",
    syntax: "response.real_url",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Запрос с редиректом:
        original = 'http://httpbin.org/redirect/2'
        async with session.get(original) as resp:
            print(resp.real_url)
            # URL('http://httpbin.org/redirect/2')  ← исходный URL

            print(resp.url)
            # URL('https://httpbin.org/get')  ← конечный URL после редиректов

            # Сравнение:
            redirected = str(resp.real_url) != str(resp.url)
            print(f'Был редирект: {redirected}')   # True

        # Без редиректа — real_url и url совпадают:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.real_url == resp.url)   # True

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.connection",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Возвращает объект Connection, представляющий физическое TCP-соединение, использованное для данного запроса. Доступен только пока ответ не освобождён (до вызова release() или выхода из блока async with). Полезен для низкоуровневой отладки.",
    syntax: "response.connection",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            conn = resp.connection
            print(type(conn))
            # <class 'aiohttp.connector.Connection'>

            # Информация о соединении:
            print(conn.transport)   # asyncio.Transport объект

            # После выхода из async with — соединение освобождено:
        # resp.connection → None (ответ уже освобождён)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.content",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект StreamReader — асинхронный потоковый читатель тела ответа. Позволяет читать тело по частям (chunk by chunk) без загрузки всего содержимого в память. Используется для загрузки больших файлов и потоковой обработки данных.",
    syntax: "response.content",
    arguments: [],
    example: `import aiohttp
import asyncio

async def download_file(url: str, path: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            resp.raise_for_status()

            # Потоковое чтение по чанкам:
            with open(path, 'wb') as f:
                async for chunk in resp.content.iter_chunked(8192):
                    f.write(chunk)

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/bytes/1024') as resp:
            # Размер тела (если известен):
            print(resp.content_length)   # 1024 или None

            # Чтение первых 100 байт:
            first_chunk = await resp.content.read(100)
            print(len(first_chunk))   # 100

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.cookies",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект SimpleCookie (из стандартной библиотеки http.cookies) с куки, установленными сервером в данном ответе через заголовок Set-Cookie. Содержит только куки текущего ответа, не всей сессии. Для доступа ко всем куки сессии используйте session.cookie_jar.",
    syntax: "response.cookies",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get(
            'https://httpbin.org/cookies/set/session_id/abc123'
        ) as resp:
            # Куки этого ответа:
            for name, morsel in resp.cookies.items():
                print(f'{name} = {morsel.value}')
                print(f'  path: {morsel["path"]}')
                print(f'  expires: {morsel["expires"]}')

            # Конкретное куки:
            if 'session_id' in resp.cookies:
                token = resp.cookies['session_id'].value
                print(f'Токен: {token}')   # 'abc123'

            # Все куки сессии (накопленные):
            for cookie in session.cookie_jar:
                print(cookie.key, cookie.value)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.headers",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект CIMultiDictProxy — регистронезависимый словарь (case-insensitive) HTTP-заголовков ответа. Поддерживает несколько значений для одного заголовка. Доступен сразу после получения заголовков, до чтения тела.",
    syntax: "response.headers",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            # Регистронезависимый доступ:
            print(resp.headers['Content-Type'])
            # 'application/json'

            print(resp.headers.get('content-type'))
            # 'application/json'  (то же самое)

            # Проверка наличия:
            if 'X-RateLimit-Remaining' in resp.headers:
                limit = resp.headers['X-RateLimit-Remaining']

            # Все заголовки:
            for name, value in resp.headers.items():
                print(f'{name}: {value}')

            # Content-Type без параметров:
            ct = resp.headers.get('Content-Type', '')
            mime = ct.split(';')[0].strip()
            print(mime)   # 'application/json'

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.raw_headers",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Кортеж пар (name, value) — сырые HTTP-заголовки ответа в виде байтовых строк (bytes), в том порядке, в котором они были получены от сервера. В отличие от headers, не нормализован и не декодирован. Полезен для низкоуровневой обработки и отладки.",
    syntax: "response.raw_headers",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            # Сырые байтовые заголовки:
            for name, value in resp.raw_headers:
                print(f'{name!r}: {value!r}')
            # b'Content-Type': b'application/json'
            # b'Server': b'gunicorn/19.9.0'
            # ...

            # Количество заголовков:
            print(len(resp.raw_headers))

            # Поиск конкретного заголовка:
            for name, value in resp.raw_headers:
                if name.lower() == b'content-type':
                    print(value.decode('utf-8'))

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.links",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект CIMultiDictProxy, содержащий разобранные ссылки из заголовка Link ответа. Используется в API с пагинацией (GitHub API, JSON:API и др.) для навигации между страницами. Ключи — rel-атрибуты ссылок (next, prev, first, last).",
    syntax: "response.links",
    arguments: [],
    example: `import aiohttp
import asyncio

async def paginate_github(url: str):
    async with aiohttp.ClientSession(
        headers={'Accept': 'application/vnd.github.v3+json'}
    ) as session:
        while url:
            async with session.get(url) as resp:
                items = await resp.json()
                print(f'Получено: {len(items)} элементов')

                # Link header: <url>; rel="next", <url>; rel="last"
                links = resp.links
                print(links)
                # {'next': {'url': URL('...'), 'rel': 'next'}, ...}

                if 'next' in links:
                    url = str(links['next']['url'])
                else:
                    url = None   # Последняя страница

asyncio.run(paginate_github('https://api.github.com/repos/python/cpython/issues'))`,
  },
  {
    name: "aiohttp.ClientResponse.history",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Кортеж объектов ClientResponse для всех промежуточных ответов в цепочке редиректов (до финального). Пустой кортеж () если редиректов не было. Каждый элемент содержит статус, заголовки и URL промежуточного ответа.",
    syntax: "response.history",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Без редиректов:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.history)   # ()

        # С редиректами:
        async with session.get('http://httpbin.org/redirect/3') as resp:
            print(f'Финальный статус: {resp.status}')   # 200
            print(f'Редиректов: {len(resp.history)}')   # 3

            for i, redirect in enumerate(resp.history):
                print(f'  Редирект {i+1}: {redirect.status} → {redirect.url}')
            # Редирект 1: 302 → http://httpbin.org/redirect/2
            # Редирект 2: 302 → http://httpbin.org/redirect/1
            # Редирект 3: 302 → https://httpbin.org/get

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.request_info",
    description:
      "Атрибут объекта ClientResponse библиотеки aiohttp. Объект RequestInfo с информацией о запросе, породившем данный ответ: url (yarl.URL), real_url, method (строка), headers (отправленные заголовки). Позволяет из ответа восстановить детали исходного запроса без хранения их отдельно.",
    syntax: "response.request_info",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession(
        headers={'User-Agent': 'MyApp/1.0'}
    ) as session:
        async with session.post(
            'https://httpbin.org/post',
            json={'key': 'value'},
            headers={'X-Custom': 'header'},
        ) as resp:
            info = resp.request_info

            print(info.method)      # 'POST'
            print(info.url)         # URL('https://httpbin.org/post')
            print(info.real_url)    # URL('https://httpbin.org/post')

            # Заголовки запроса:
            print(info.headers['User-Agent'])   # 'MyApp/1.0'
            print(info.headers['X-Custom'])     # 'header'

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.read",
    description:
      "Асинхронный метод объекта ClientResponse библиотеки aiohttp. Читает и возвращает всё тело ответа как байтовую строку (bytes). Загружает тело целиком в память — не подходит для очень больших ответов (используйте content для потокового чтения). После вызова тело кэшируется.",
    syntax: "await response.read()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Чтение как bytes:
        async with session.get('https://httpbin.org/image/png') as resp:
            image_bytes = await resp.read()
            print(type(image_bytes))   # <class 'bytes'>
            print(len(image_bytes))    # Размер в байтах

            with open('image.png', 'wb') as f:
                f.write(image_bytes)

        # Декодирование вручную:
        async with session.get('https://httpbin.org/get') as resp:
            raw = await resp.read()
            text = raw.decode('utf-8')
            print(text[:100])

        # Для текста и JSON — используйте resp.text() / resp.json():
        async with session.get('https://httpbin.org/get') as resp:
            data = await resp.json()   # Удобнее, чем read() + decode + loads

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.release",
    description:
      "Асинхронный метод объекта ClientResponse библиотеки aiohttp. Освобождает ресурсы, связанные с ответом: закрывает соединение или возвращает его в пул коннектора. Вызывается автоматически при выходе из блока async with. Необходимо вызывать вручную если ответ читался без контекстного менеджера во избежание утечки соединений.",
    syntax: "await response.release()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Автоматическое освобождение (рекомендуется):
        async with session.get('https://httpbin.org/get') as resp:
            data = await resp.json()
        # release() вызван автоматически

        # Ручное освобождение (при работе без async with):
        resp = await session.get('https://httpbin.org/get')
        try:
            if resp.status == 200:
                data = await resp.json()
            else:
                print(f'Ошибка: {resp.status}')
        finally:
            await resp.release()   # Обязательно освободить!

        # release() после read() — тело уже прочитано, соединение освобождается:
        async with session.get('https://httpbin.org/get') as resp:
            body = await resp.read()
            # release() будет вызван при выходе из async with

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.text",
    description:
      "Асинхронный метод объекта ClientResponse библиотеки aiohttp. Читает тело ответа и возвращает его как строку (str). Кодировка определяется автоматически из заголовка Content-Type, либо задаётся явно через параметр encoding. Загружает всё тело в память — для больших ответов используйте потоковое чтение через content.",
    syntax: "await response.text(encoding=None, errors='strict')",
    arguments: [
      {
        name: "encoding",
        description:
          "Кодировка для декодирования байт в строку. Если None — определяется из заголовка Content-Type или autodetect. По умолчанию None.",
      },
      {
        name: "errors",
        description:
          'Режим обработки ошибок декодирования: "strict" (по умолчанию, выбросить UnicodeDecodeError), "ignore", "replace".',
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Автоматическое определение кодировки:
        async with session.get('https://httpbin.org/html') as resp:
            html = await resp.text()
            print(html[:200])

        # Явная кодировка:
        async with session.get('https://example.com') as resp:
            text = await resp.text(encoding='utf-8')
            print(len(text))

        # Игнорирование ошибок декодирования:
        async with session.get('https://example.com') as resp:
            text = await resp.text(encoding='ascii', errors='ignore')

        # Для JSON лучше использовать resp.json():
        async with session.get('https://httpbin.org/get') as resp:
            raw_json = await resp.text()   # Строка JSON
            import json
            data = json.loads(raw_json)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.json",
    description:
      "Асинхронный метод объекта ClientResponse библиотеки aiohttp. Читает тело ответа, декодирует и десериализует его как JSON. По умолчанию проверяет заголовок Content-Type — если он не соответствует application/json, выбрасывает ContentTypeError. Возвращает dict, list или другой тип в зависимости от содержимого.",
    syntax:
      "await response.json(encoding=None, loads=json.loads, content_type='application/json')",
    arguments: [
      {
        name: "encoding",
        description:
          "Кодировка для декодирования байт. Если None — определяется автоматически.",
      },
      {
        name: "loads",
        description:
          "Функция десериализации JSON. По умолчанию json.loads. Можно передать orjson.loads или ujson.loads для ускорения.",
      },
      {
        name: "content_type",
        description:
          'Ожидаемый Content-Type. По умолчанию "application/json". None — отключить проверку типа.',
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Стандартное использование:
        async with session.get('https://api.github.com/users/python') as resp:
            data = await resp.json()
            print(data['login'])    # 'python'
            print(data['public_repos'])

        # Если сервер возвращает неверный Content-Type:
        async with session.get('https://httpbin.org/get') as resp:
            data = await resp.json(content_type=None)   # Без проверки типа

        # Быстрый JSON-парсер:
        import orjson
        async with session.get('https://httpbin.org/get') as resp:
            data = await resp.json(loads=orjson.loads)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.close",
    description:
      "Метод объекта ClientResponse библиотеки aiohttp. Закрывает соединение, не возвращая его в пул коннектора. В отличие от release(), который возвращает соединение в пул для повторного использования, close() полностью закрывает его. Вызывается автоматически при ошибках или явно когда соединение не должно переиспользоваться.",
    syntax: "response.close()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        resp = await session.get('https://httpbin.org/get')
        try:
            if resp.status != 200:
                # Закрываем соединение без возврата в пул:
                resp.close()
                return
            data = await resp.json()
            print(data)
        except Exception:
            resp.close()   # Закрыть при ошибке
            raise
        finally:
            # В нормальном случае лучше release():
            # await resp.release()
            pass

    # Предпочтительный способ — async with (вызывает release() автоматически):
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/get') as resp:
            data = await resp.json()

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.raise_for_status",
    description:
      "Метод объекта ClientResponse библиотеки aiohttp. Выбрасывает исключение ClientResponseError если HTTP-статус ответа указывает на ошибку (4xx или 5xx). При статусах 1xx, 2xx, 3xx ничего не происходит. Удобен для краткой проверки успешности запроса без явной проверки resp.status.",
    syntax: "response.raise_for_status()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def fetch_json(url: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            resp.raise_for_status()   # ClientResponseError при 4xx/5xx
            return await resp.json()

async def main():
    async with aiohttp.ClientSession() as session:
        # Успешный запрос — исключения нет:
        async with session.get('https://httpbin.org/get') as resp:
            resp.raise_for_status()
            print(resp.status)   # 200

        # Ошибка 404 — выбрасывает исключение:
        try:
            async with session.get('https://httpbin.org/status/404') as resp:
                resp.raise_for_status()
        except aiohttp.ClientResponseError as e:
            print(f'Ошибка: {e.status} {e.message}')
            # Ошибка: 404 Not Found

        # Ошибка сервера 500:
        try:
            async with session.get('https://httpbin.org/status/500') as resp:
                resp.raise_for_status()
        except aiohttp.ClientResponseError as e:
            print(f'Ошибка сервера: {e.status}')

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientResponse.wait_for_close",
    description:
      "Асинхронный метод объекта ClientResponse библиотеки aiohttp. Ожидает полного завершения отправки данных запроса на сервер (upload completion) и закрытия соединения. Используется в специфичных случаях, когда нужно убедиться, что данные запроса полностью переданы до продолжения выполнения.",
    syntax: "await response.wait_for_close()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Загрузка большого файла с ожиданием завершения:
        with open('large_file.bin', 'rb') as f:
            async with session.post(
                'https://api.example.com/upload',
                data=f,
            ) as resp:
                resp.raise_for_status()

                # Ожидаем полного завершения передачи:
                await resp.wait_for_close()
                print('Данные полностью переданы и соединение закрыто')

        # Обычно используется при потоковой отправке данных,
        # когда важно убедиться в завершении передачи
        # перед продолжением работы программы.

asyncio.run(main())`,
  },
  {
    name: "aiohttp.web.Application",
    description:
      "Класс веб-приложения серверной части aiohttp. Является точкой входа для создания ASGI/WSGI-совместимого асинхронного HTTP-сервера. Управляет маршрутизацией, middleware, жизненным циклом (startup/shutdown) и сигналами. Передаётся в web.run_app() для запуска сервера.",
    syntax:
      "app = web.Application(*, logger=<DEFAULT>, middlewares=(), debug=...)",
    arguments: [
      {
        name: "logger",
        description:
          "Объект logging.Logger для логирования запросов. По умолчанию используется встроенный логгер aiohttp.",
      },
      {
        name: "middlewares",
        description:
          "Кортеж или список middleware-функций, применяемых к каждому запросу в заданном порядке.",
      },
      {
        name: "debug",
        description:
          "Режим отладки. При True включается подробное логирование. По умолчанию берётся из asyncio.",
      },
    ],
    example: `from aiohttp import web

async def handle(request: web.Request) -> web.Response:
    name = request.match_info.get('name', 'World')
    return web.Response(text=f'Hello, {name}!')

# Middleware:
@web.middleware
async def error_middleware(request, handler):
    try:
        return await handler(request)
    except web.HTTPException:
        raise
    except Exception as e:
        return web.Response(status=500, text=str(e))

app = web.Application(middlewares=[error_middleware])
app.router.add_get('/', handle)
app.router.add_get('/{name}', handle)

if __name__ == '__main__':
    web.run_app(app, host='0.0.0.0', port=8080)`,
  },
  {
    name: "aiohttp.web.Application.add_routes",
    description:
      "Метод класса Application. Регистрирует список маршрутов в роутере приложения за один вызов. Принимает список объектов RouteDef, созданных декораторами web.get(), web.post(), web.put() и др. или через RouteTableDef. Более удобная альтернатива многократным вызовам router.add_get(), router.add_post() и т.д.",
    syntax: "app.add_routes(routes)",
    arguments: [
      {
        name: "routes",
        description:
          "Список объектов RouteDef — результатов вызовов web.get(), web.post(), web.route() и др., или экземпляр RouteTableDef.",
      },
    ],
    example: `from aiohttp import web

routes = web.RouteTableDef()

@routes.get('/')
async def index(request: web.Request) -> web.Response:
    return web.Response(text='Главная страница')

@routes.get('/users')
async def list_users(request: web.Request) -> web.Response:
    return web.json_response([{'id': 1, 'name': 'Ivan'}])

@routes.post('/users')
async def create_user(request: web.Request) -> web.Response:
    data = await request.json()
    return web.json_response(data, status=201)

@routes.get('/users/{id}')
async def get_user(request: web.Request) -> web.Response:
    user_id = int(request.match_info['id'])
    return web.json_response({'id': user_id})

app = web.Application()
app.add_routes(routes)   # Регистрируем все маршруты сразу

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.add_subapp",
    description:
      "Метод класса Application. Монтирует вложенное приложение (subapp) по заданному URL-префиксу. Позволяет разбить большое приложение на модули: каждый модуль — отдельный Application со своими маршрутами, middleware и сигналами. Запросы, начинающиеся с prefix, передаются в subapp.",
    syntax: "app.add_subapp(prefix, subapp)",
    arguments: [
      {
        name: "prefix",
        description:
          'Строка URL-префикса (например "/api/v1"). Должна начинаться с "/" и не заканчиваться на "/".',
      },
      {
        name: "subapp",
        description:
          "Экземпляр Application, который будет обрабатывать запросы с данным префиксом.",
      },
    ],
    example: `from aiohttp import web

# Модуль API:
api = web.Application()

@api.router.add_get('/users')
async def list_users(request):
    return web.json_response([{'id': 1}])

@api.router.add_get('/posts')
async def list_posts(request):
    return web.json_response([{'id': 1}])

# Модуль администрирования:
admin = web.Application()

@admin.router.add_get('/dashboard')
async def dashboard(request):
    return web.Response(text='Admin Dashboard')

# Главное приложение:
app = web.Application()
app.add_subapp('/api/v1', api)    # /api/v1/users, /api/v1/posts
app.add_subapp('/admin', admin)   # /admin/dashboard

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.cleanup",
    description:
      "Корутина класса Application. Выполняет очистку ресурсов приложения: вызывает все обработчики сигнала on_cleanup в обратном порядке (LIFO). Вызывается автоматически при остановке сервера через web.run_app(). Используется для закрытия подключений к базам данных, освобождения кэша и других ресурсов.",
    syntax: "await app.cleanup()",
    arguments: [],
    example: `from aiohttp import web
import asyncio

async def on_startup(app):
    # Инициализация ресурсов:
    app['db'] = await create_db_pool()
    app['redis'] = await create_redis()
    print('Ресурсы инициализированы')

async def on_cleanup(app):
    # Освобождение ресурсов:
    await app['db'].close()
    await app['redis'].close()
    print('Ресурсы освобождены')

app = web.Application()
app.on_startup.append(on_startup)
app.on_cleanup.append(on_cleanup)

# cleanup() вызывается автоматически при остановке web.run_app()
# Ручной вызов (например, в тестах):
async def test():
    await app.startup()
    # ... тесты ...
    await app.shutdown()
    await app.cleanup()   # Вызывает on_cleanup обработчики`,
  },
  {
    name: "aiohttp.web.Application.on_cleanup",
    description:
      "Сигнал класса Application. Список корутин-обработчиков, вызываемых при очистке приложения (после shutdown). Обработчики выполняются в обратном порядке добавления (LIFO). Используется для освобождения ресурсов: закрытия соединений с БД, отключения от брокеров сообщений и т.д.",
    syntax: "app.on_cleanup.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Асинхронная функция async def handler(app) → None. Получает объект Application как аргумент.",
      },
    ],
    example: `from aiohttp import web
import aiopg

async def init_db(app):
    app['db'] = await aiopg.create_pool(
        'dbname=mydb user=postgres password=secret'
    )

async def close_db(app):
    app['db'].close()
    await app['db'].wait_closed()
    print('БД отключена')

async def close_cache(app):
    await app['cache'].close()
    print('Кэш очищен')

app = web.Application()
app.on_startup.append(init_db)

# on_cleanup — порядок LIFO (последний добавленный — первый выполняется):
app.on_cleanup.append(close_db)
app.on_cleanup.append(close_cache)
# При остановке: сначала close_cache, затем close_db

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.on_response_prepare",
    description:
      "Сигнал класса Application. Список корутин-обработчиков, вызываемых перед отправкой каждого HTTP-ответа. Позволяет модифицировать заголовки ответа на уровне приложения: добавлять CORS-заголовки, заголовки безопасности, настраивать кэширование.",
    syntax: "app.on_response_prepare.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Асинхронная функция async def handler(request, response) → None. Может изменять объект response перед отправкой.",
      },
    ],
    example: `from aiohttp import web

async def add_security_headers(request, response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'

async def add_cors_headers(request, response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE'

async def index(request):
    return web.Response(text='Hello!')

app = web.Application()
# Добавляем заголовки ко всем ответам автоматически:
app.on_response_prepare.append(add_security_headers)
app.on_response_prepare.append(add_cors_headers)
app.router.add_get('/', index)

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.on_shutdown",
    description:
      "Сигнал класса Application. Список корутин-обработчиков, вызываемых при получении сигнала остановки сервера (до on_cleanup). Используется для мягкого завершения: оповещения клиентов WebSocket, завершения текущих задач, сохранения состояния. Вызывается до закрытия всех соединений.",
    syntax: "app.on_shutdown.append(handler)",
    arguments: [
      {
        name: "handler",
        description: "Асинхронная функция async def handler(app) → None.",
      },
    ],
    example: `from aiohttp import web

# Хранилище активных WebSocket-соединений:
websockets = set()

async def ws_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    websockets.add(ws)
    try:
        async for msg in ws:
            await ws.send_str(f'Echo: {msg.data}')
    finally:
        websockets.discard(ws)
    return ws

async def on_shutdown(app):
    # Закрываем все WebSocket перед остановкой:
    for ws in set(websockets):
        await ws.close(code=1001, message=b'Server shutdown')
    print(f'Закрыто {len(websockets)} WS-соединений')

app = web.Application()
app.router.add_get('/ws', ws_handler)
app.on_shutdown.append(on_shutdown)

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.on_startup",
    description:
      "Сигнал класса Application. Список корутин-обработчиков, вызываемых при запуске приложения (до начала обработки запросов). Используется для инициализации ресурсов: создания пулов соединений с БД, подключения к Redis, запуска фоновых задач.",
    syntax: "app.on_startup.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Асинхронная функция async def handler(app) → None. Выполняется один раз при старте.",
      },
    ],
    example: `from aiohttp import web
import aioredis
import asyncpg

async def init_db(app):
    app['db'] = await asyncpg.create_pool(
        host='localhost', database='mydb',
        user='postgres', password='secret',
        min_size=5, max_size=20,
    )
    print('Пул БД создан')

async def init_redis(app):
    app['redis'] = await aioredis.create_redis_pool('redis://localhost')
    print('Redis подключён')

async def start_background_tasks(app):
    app['bg_task'] = asyncio.create_task(periodic_cleanup())

app = web.Application()
app.on_startup.append(init_db)
app.on_startup.append(init_redis)
app.on_startup.append(start_background_tasks)

app.on_cleanup.append(lambda app: app['db'].close())
app.on_cleanup.append(lambda app: app['redis'].close())

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.router",
    description:
      "Атрибут класса Application. Объект UrlDispatcher — маршрутизатор приложения. Содержит таблицу URL-маршрутов и сопоставляет входящие запросы с обработчиками. Предоставляет методы add_get(), add_post(), add_route(), add_static() и другие для регистрации маршрутов.",
    syntax: "app.router",
    arguments: [],
    example: `from aiohttp import web

async def index(request): return web.Response(text='Главная')
async def about(request): return web.Response(text='О нас')
async def get_user(request): return web.json_response({'id': request.match_info['id']})
async def create_user(request): return web.json_response({}, status=201)
async def upload(request): return web.Response(text='OK')

app = web.Application()

# Регистрация маршрутов:
app.router.add_get('/', index)
app.router.add_get('/about', about)
app.router.add_get('/users/{id}', get_user)
app.router.add_post('/users', create_user)
app.router.add_route('*', '/upload', upload)   # Любой метод

# Статические файлы:
app.router.add_static('/static', path='./static', name='static')

# Просмотр маршрутов:
for resource in app.router.resources():
    print(resource.canonical)

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.shutdown",
    description:
      "Корутина класса Application. Инициирует мягкую остановку приложения: вызывает все обработчики сигнала on_shutdown. Вызывается автоматически при получении SIGINT/SIGTERM в web.run_app(). При ручном управлении жизненным циклом вызывается до cleanup().",
    syntax: "await app.shutdown()",
    arguments: [],
    example: `from aiohttp import web
import asyncio

async def on_shutdown(app):
    print('Приложение останавливается...')
    # Завершение текущих задач, оповещение клиентов и т.д.

app = web.Application()
app.on_shutdown.append(on_shutdown)

# Автоматический вызов в web.run_app():
# web.run_app(app)  ← при Ctrl+C вызывает shutdown() затем cleanup()

# Ручное управление (например, в тестах):
async def lifecycle():
    runner = web.AppRunner(app)
    await runner.setup()   # Вызывает on_startup

    site = web.TCPSite(runner, 'localhost', 8080)
    await site.start()
    print('Сервер запущен')

    await asyncio.sleep(10)   # Работаем

    await runner.cleanup()    # Вызывает on_shutdown + on_cleanup
    print('Сервер остановлен')

asyncio.run(lifecycle())`,
  },
  {
    name: "aiohttp.web.Application.startup",
    description:
      "Корутина класса Application. Запускает приложение: вызывает все обработчики сигнала on_startup в порядке добавления. Вызывается автоматически при старте сервера в web.run_app(). При ручном управлении через AppRunner вызывается в runner.setup().",
    syntax: "await app.startup()",
    arguments: [],
    example: `from aiohttp import web
import asyncio

async def init_resources(app):
    app['initialized'] = True
    print('Ресурсы инициализированы')

app = web.Application()
app.on_startup.append(init_resources)

# Ручной запуск (например, в тестах):
async def test_app():
    await app.startup()   # Вызывает on_startup обработчики
    print(app['initialized'])   # True

    # ... тесты ...

    await app.shutdown()
    await app.cleanup()

# Стандартный запуск (startup() вызывается автоматически):
# web.run_app(app)

# Через AppRunner (рекомендуется для тестов):
async def run_with_runner():
    runner = web.AppRunner(app)
    await runner.setup()   # ← вызывает app.startup() внутри
    site = web.TCPSite(runner, 'localhost', 8080)
    await site.start()`,
  },
  {
    name: "aiohttp.web.Request.method",
    description:
      'Атрибут объекта web.Request серверной части aiohttp. Строка с HTTP-методом входящего запроса в верхнем регистре: "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS". Используется в обработчиках для различения типов запросов при обработке одного маршрута несколькими методами.',
    syntax: "request.method",
    arguments: [],
    example: `from aiohttp import web

async def handle(request: web.Request) -> web.Response:
    print(request.method)   # 'GET', 'POST', и т.д.

    if request.method == 'GET':
        return web.json_response({'items': []})

    elif request.method == 'POST':
        data = await request.json()
        return web.json_response(data, status=201)

    return web.Response(status=405)   # Method Not Allowed

# Регистрация для нескольких методов:
app = web.Application()
app.router.add_route('GET', '/items', handle)
app.router.add_route('POST', '/items', handle)

# Или через RouteTableDef:
routes = web.RouteTableDef()

@routes.view('/items')
class ItemsView(web.View):
    async def get(self):
        return web.json_response([])

    async def post(self):
        data = await self.request.json()
        return web.json_response(data, status=201)`,
  },
];
