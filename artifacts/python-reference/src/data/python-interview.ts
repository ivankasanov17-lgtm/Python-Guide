import { InterviewQuestion } from "./interview";

export const pythonInterviewQuestions: InterviewQuestion[] = [
  {
    id: "cpython-reference-counting-gc",
    question:
      "Как работает подсчёт ссылок (Reference Counting) и сборщик мусора (Garbage Collector) в CPython? Как циклические ссылки обрабатываются детектором циклов?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "senior",
    answer: `## Подсчёт ссылок (Reference Counting)

Каждый объект в CPython хранит поле \`ob_refcnt\` — счётчик ссылок. Он увеличивается, когда на объект добавляется новая ссылка, и уменьшается, когда ссылка удаляется. Как только счётчик достигает нуля, объект **немедленно уничтожается** и память освобождается.

\`\`\`python
import sys

a = []          # создали список, ob_refcnt = 1
b = a           # добавили ссылку, ob_refcnt = 2
print(sys.getrefcount(a))  # 3 — getrefcount сам создаёт временную ссылку

del b           # ob_refcnt = 2 (одна ссылка из getrefcount ушла вместе с вызовом)
del a           # ob_refcnt = 0 → объект немедленно уничтожается
\`\`\`

### Плюсы подсчёта ссылок
- Детерминированное и **немедленное** освобождение памяти.
- Не нужно "останавливать мир" (stop-the-world) для большинства объектов.

### Главный минус — циклические ссылки

Когда два или более объектов ссылаются друг на друга, счётчики никогда не достигнут нуля, даже если внешних ссылок на них нет:

\`\`\`python
import gc

class Node:
    def __init__(self, name):
        self.name = name
        self.other = None
    def __del__(self):
        print(f"Node {self.name} уничтожен")

gc.disable()           # отключаем циклический GC для демонстрации

a = Node("A")
b = Node("B")
a.other = b            # A → B
b.other = a            # B → A  — цикл!

del a
del b
# Деструкторы НЕ вызываются — объекты живут в памяти
print("Утечка: объекты живы")

gc.enable()
gc.collect()           # ручной запуск циклического сборщика
# Только теперь вызываются __del__
\`\`\`

---

## Циклический сборщик мусора (gc модуль)

CPython дополнительно использует **tracing GC** на основе алгоритма обнаружения циклов. Он следит только за объектами, которые **могут** содержать ссылки на другие объекты: \`list\`, \`dict\`, \`set\`, пользовательские классы и т.д. Простые числа, строки — не отслеживаются.

### Три поколения

GC делит отслеживаемые объекты на три поколения (0, 1, 2). Новые объекты попадают в поколение 0. Чем дольше объект "выживает" после сборки — тем старше поколение:

| Поколение | Порог (по умолчанию) | Описание |
|-----------|----------------------|----------|
| 0         | 700 объектов         | Молодые объекты, собираются чаще всего |
| 1         | 10 сборок поколения 0 | Средний возраст |
| 2         | 10 сборок поколения 1 | Долгоживущие объекты |

\`\`\`python
import gc

print(gc.get_threshold())   # (700, 10, 10) — пороги по умолчанию
print(gc.get_count())       # (n0, n1, n2) — текущие счётчики

# Настройка порогов (например, реже собирать молодых)
gc.set_threshold(1000, 15, 15)
\`\`\`

### Алгоритм обнаружения циклов

1. GC берёт все объекты текущего поколения.
2. Для каждого объекта **декрементирует** внутренние счётчики ссылок на объекты внутри той же группы.
3. Объекты, у которых счётчик стал > 0 — имеют **внешние** ссылки, они "достижимы" (reachable).
4. Объекты с счётчиком == 0 — **недостижимы**: они образуют цикл и могут быть удалены.
5. Из достижимых объектов делается обход в глубину — все транзитивно достижимые объекты помечаются как живые.
6. Всё остальное — мусор.

\`\`\`python
import gc

# Посмотреть, какие объекты сейчас в мусоре
class Leaky:
    pass

gc.collect()             # очистить перед тестом

a = Leaky()
b = Leaky()
a.ref = b
b.ref = a
del a, b

unreachable = gc.collect()
print(f"Собрано объектов с циклами: {unreachable}")  # 2
\`\`\`

### gc.callbacks и финализаторы

До Python 3.4 объекты с \`__del__\` и циклическими ссылками попадали в \`gc.garbage\` и **не освобождались автоматически**. Начиная с Python 3.4 (PEP 442) это исправлено — \`__del__\` вызывается безопасно даже при циклах.

\`\`\`python
import gc

# Объекты, которые GC не смог собрать (только в старых сценариях)
print(gc.garbage)   # обычно []
\`\`\`

---

## Практические советы

\`\`\`python
# weakref позволяет ссылаться на объект без увеличения ob_refcnt
import weakref

class Cache:
    def __init__(self, obj):
        self._ref = weakref.ref(obj)   # "слабая" ссылка

    def get(self):
        return self._ref()             # None, если объект уже уничтожен

data = [1, 2, 3]
cache = Cache(data)
print(cache.get())   # [1, 2, 3]

del data
print(cache.get())   # None — объект уничтожен, утечки нет
\`\`\``,
  },
  {
    id: "cpython-slots",
    question:
      "Что такое __slots__? Каковы его преимущества, недостатки и влияние на наследование объектов?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "middle",
    answer: `## Что такое \`__slots__\`?

По умолчанию каждый экземпляр пользовательского класса хранит атрибуты в словаре \`__dict__\`. Этот словарь гибкий, но занимает дополнительную память.

\`__slots__\` — это **декларация допустимых атрибутов** на уровне класса. Вместо \`__dict__\` CPython выделяет фиксированные слоты (статические поля в структуре C), что экономит память и ускоряет доступ.

\`\`\`python
class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

import sys

a = WithDict(1, 2)
b = WithSlots(1, 2)

print(sys.getsizeof(a))          # ~48 байт (сам объект) + ~232 байт (__dict__)
print(sys.getsizeof(b))          # ~56 байт — только слоты, без __dict__
print(hasattr(a, "__dict__"))    # True
print(hasattr(b, "__dict__"))    # False
\`\`\`

---

## Преимущества \`__slots__\`

### 1. Экономия памяти

\`\`\`python
import tracemalloc

tracemalloc.start()

# Без __slots__
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

points_dict = [Point(i, i) for i in range(100_000)]
snap1 = tracemalloc.take_snapshot()

# С __slots__
class PointSlot:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

points_slot = [PointSlot(i, i) for i in range(100_000)]
snap2 = tracemalloc.take_snapshot()

# Разница: __slots__ версия занимает примерно в 2–3 раза меньше памяти
\`\`\`

### 2. Ускорение доступа к атрибутам

Слот — это дескриптор со статическим смещением в памяти. Обращение к нему быстрее, чем хэш-поиск в \`__dict__\`.

### 3. Защита от опечаток

\`\`\`python
class Config:
    __slots__ = ("host", "port")

c = Config()
c.host = "localhost"
c.prot = 8080   # AttributeError: 'Config' object has no attribute 'prot'
                # Опечатка поймана немедленно!
\`\`\`

---

## Недостатки \`__slots__\`

### 1. Нельзя добавлять произвольные атрибуты

\`\`\`python
class Rigid:
    __slots__ = ("x",)

r = Rigid()
r.x = 1      # OK
r.y = 2      # AttributeError — нет такого слота
\`\`\`

### 2. Не работают \`__dict__\` и \`__weakref__\` по умолчанию

\`\`\`python
import weakref

class NoWeak:
    __slots__ = ("x",)

obj = NoWeak()
# TypeError: cannot create weak reference to 'NoWeak' object
ref = weakref.ref(obj)

# Решение — явно добавить слоты:
class WithWeak:
    __slots__ = ("x", "__weakref__", "__dict__")
    # __dict__ возвращает гибкость, но убирает часть выгоды
\`\`\`

### 3. Сложность с pickle и copy

\`\`\`python
import pickle

class Slotted:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y
    # Нужно реализовать __getstate__/__setstate__ для корректного pickle
    def __getstate__(self):
        return {"x": self.x, "y": self.y}
    def __setstate__(self, state):
        self.x = state["x"]
        self.y = state["y"]

obj = Slotted(1, 2)
data = pickle.dumps(obj)
restored = pickle.loads(data)
print(restored.x, restored.y)   # 1 2
\`\`\`

---

## Влияние на наследование

### Ситуация 1: Дочерний класс без \`__slots__\`

Если дочерний класс **не объявляет** \`__slots__\`, у него появится \`__dict__\`, и вся экономия памяти пропадёт:

\`\`\`python
class Base:
    __slots__ = ("x",)

class Child(Base):
    pass   # __slots__ не объявлен → Child имеет __dict__

c = Child()
c.x = 1       # OK (слот из Base)
c.extra = 99  # OK (из __dict__ Child) — но память тратится как обычно
print(hasattr(c, "__dict__"))  # True
\`\`\`

### Ситуация 2: Правильное наследование — оба класса с \`__slots__\`

\`\`\`python
class Base:
    __slots__ = ("x",)

class Child(Base):
    __slots__ = ("y",)   # добавляем только новые атрибуты, не дублируем x!

c = Child()
c.x = 1
c.y = 2
print(hasattr(c, "__dict__"))  # False — чистая экономия сохранена
\`\`\`

### Ситуация 3: Множественное наследование

Множественное наследование от нескольких классов с непустыми \`__slots__\` **запрещено**:

\`\`\`python
class A:
    __slots__ = ("a",)

class B:
    __slots__ = ("b",)

class C(A, B):
    __slots__ = ()   # OK — пустые слоты допустимы
    pass

c = C()
c.a = 1
c.b = 2
print(c.a, c.b)   # 1 2

# Но вот это — ошибка:
# class D(A, B):
#     __slots__ = ("d",)   # TypeError в некоторых компоновках
\`\`\`

---

## Когда использовать \`__slots__\`?

| Сценарий | Использовать \`__slots__\`? |
|----------|---------------------------|
| Миллионы экземпляров (data objects, точки, векторы) | ✅ Да |
| Фиксированная схема данных | ✅ Да |
| Нужна динамическая добавка атрибутов | ❌ Нет |
| Активное использование mixin / множественного наследования | ⚠️ Осторожно |
| Библиотечный публичный API | ⚠️ Обдумать совместимость |`,
  },
  {
    id: "cpython-interning",
    question:
      "Объясните концепцию малых целых чисел (Integer Interning) и интернирования строк в CPython. Для чего это нужно?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "middle",
    answer: `## Зачем нужно интернирование?

Python — объектно-ориентированный язык: каждое число, строка, список — это объект в куче. Создание нового объекта при **каждом** обращении к числу \`1\` или строке \`"hello"\` было бы катастрофически расточительным. Интернирование (interning) — это кэширование заранее созданных объектов, чтобы повторно их использовать вместо создания новых.

---

## Integer Interning — малые целые числа

CPython заранее создаёт и кэширует все целые числа в диапазоне **от -5 до 256** включительно. Любое обращение к этим числам возвращает **один и тот же объект**.

\`\`\`python
a = 100
b = 100
print(a is b)   # True — один и тот же объект
print(id(a) == id(b))   # True

a = 257
b = 257
print(a is b)   # False — два разных объекта!
print(id(a), id(b))   # разные адреса в памяти
\`\`\`

### Почему именно -5 до 256?

Это эмпирически подобранный диапазон наиболее часто используемых чисел: счётчики циклов, индексы, коды ошибок. Порог задан в C-коде CPython в файле \`Objects/longobject.c\`:

\`\`\`c
// CPython source (упрощённо):
#define NSMALLPOSINTS 257
#define NSMALLNEGINTS 5
static PyLongObject small_ints[NSMALLNEGINTS + NSMALLPOSINTS];
\`\`\`

### Важная оговорка: оптимизация компилятора

Внутри одного блока кода компилятор может интернировать и большие числа — это называется **constant folding**:

\`\`\`python
# В одном блоке (например, в модуле или функции):
a = 1000
b = 1000
print(a is b)   # True — компилятор сложил константы в один объект

# Но в разных блоках или при динамическом вычислении:
def make(n):
    return n

x = make(1000)
y = make(1000)
print(x is y)   # False — объекты создаются в рантайме
\`\`\`

---

## String Interning — интернирование строк

### Автоматическое интернирование

CPython автоматически интернирует строки, которые выглядят как **идентификаторы** (буквы, цифры, подчёркивания, не начинающиеся с цифры). Это нужно для быстрого поиска имён переменных, атрибутов и ключей словарей в \`__dict__\`.

\`\`\`python
a = "hello"
b = "hello"
print(a is b)   # True — автоматически интернировано (выглядит как идентификатор)

a = "hello world"   # пробел — не интернируется автоматически
b = "hello world"
print(a is b)   # False (обычно), но может быть True из-за constant folding в одном блоке

a = "hello!"    # спецсимвол — не интернируется
b = "hello!"
print(a is b)   # False
\`\`\`

### Ручное интернирование: \`sys.intern()\`

\`\`\`python
import sys

# Принудительно интернируем строку
a = sys.intern("hello world")
b = sys.intern("hello world")
print(a is b)   # True — теперь гарантированно один объект

# Практический кейс: обработка большого файла
# Если у нас 10 миллионов строк с повторяющимися словами:
def process_log(lines):
    # Без intern: каждое слово "ERROR" — новый объект строки
    # С intern: все "ERROR" — один объект
    return [sys.intern(line.split()[0]) for line in lines]
\`\`\`

---

## Практическое применение

### 1. Ускорение сравнения строк

Если строки интернированы, сравнение через \`is\` — это **сравнение указателей** (O(1)), а не посимвольное сравнение:

\`\`\`python
import sys
import timeit

s1 = sys.intern("a_very_long_identifier_name")
s2 = sys.intern("a_very_long_identifier_name")

# Быстро: сравнение адресов
t1 = timeit.timeit(lambda: s1 is s2, number=10_000_000)

s3 = "a_very_long_identifier_name" * 1   # не интернирована
s4 = "a_very_long_identifier_name" * 1

# Медленнее: посимвольное сравнение
t2 = timeit.timeit(lambda: s3 == s4, number=10_000_000)

print(f"is (intern): {t1:.3f}s")
print(f"== (no intern): {t2:.3f}s")
\`\`\`

### 2. Экономия памяти при многократных повторах

\`\`\`python
import sys

# Сценарий: парсинг CSV с 1 000 000 строк, столбец "status" = "OK"/"ERROR"/"WARN"
statuses_raw = ["OK", "ERROR", "WARN", "OK", "OK"] * 200_000

# Без интернирования: 1 000 000 отдельных объектов строк
without_intern = [s for s in statuses_raw]

# С интернированием: только 3 уникальных объекта
with_intern = [sys.intern(s) for s in statuses_raw]

# Проверка: все "OK" — один объект
ok_objects = {id(s) for s in with_intern if s == "OK"}
print(f"Уникальных объектов 'OK': {len(ok_objects)}")  # 1
\`\`\`

### 3. Словари и атрибуты

Именно интернирование строк делает доступ к атрибутам объектов быстрым: \`obj.name\` ищет строку \`"name"\` в \`__dict__\`, и поскольку все имена атрибутов интернированы, CPython может сравнивать их через \`is\` вместо \`==\`.

---

## Итог: правила интернирования в CPython

| Объект | Интернируется автоматически? |
|--------|------------------------------|
| int от -5 до 256 | ✅ Всегда |
| int вне диапазона | ⚠️ Только как константа в одном блоке |
| Строка-идентификатор (\`[a-zA-Z0-9_]+\`) | ✅ Да |
| Строка с пробелами/спецсимволами | ❌ Нет (если не через \`sys.intern()\`) |
| Пустая строка \`""\` | ✅ Да |

> **Важно**: \`is\` проверяет **идентичность объектов** (одинаковый \`id\`), а не равенство значений. Полагаться на \`is\` для сравнения строк в бизнес-логике — ошибка. Используйте \`==\`.`,
  },
  {
    id: "cpython-dict-internals",
    question:
      "Как устроены словари (dict) в Python изнутри (начиная с версии 3.6+)? Какова временная сложность операций в худшем случае?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "senior",
    answer: `## Эволюция реализации dict

До Python 3.6 словари использовали классическую **открытую адресацию** с одной хэш-таблицей. Порядок элементов был непредсказуемым. В CPython 3.6 (PEP 468 + реализация от Raymond Hettinger / INADA Naoki) структура была переработана на **compact dict** — разделение индексной таблицы и массива записей.

---

## Структура compact dict (Python 3.6+)

Словарь состоит из **двух структур**:

### 1. Индексная таблица (indices)

Разрежённый массив целых чисел. Размер — следующая степень двойки, не меньше \`(количество элементов / 2/3)\` (load factor = 2/3). Каждая ячейка содержит либо \`-1\` (пустая), либо индекс в массив записей.

### 2. Массив записей (entries)

Плотный массив троек: \`(hash, key, value)\`. Элементы идут в **порядке вставки** — именно так dict стал упорядоченным начиная с 3.7.

\`\`\`
Словарь {"a": 1, "b": 2, "c": 3}

Индексная таблица (размер 8):
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ -1│  0│  1│ -1│  2│ -1│ -1│ -1│
└───┴───┴───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5   6   7

Массив записей (плотный):
┌────────────────────────────────┐
│ 0: (hash("a"), "a", 1)        │
│ 1: (hash("b"), "b", 2)        │
│ 2: (hash("c"), "c", 3)        │
└────────────────────────────────┘
\`\`\`

---

## Алгоритм операций

### Поиск ключа (\`dict[key]\`)

\`\`\`python
d = {"name": "Alice", "age": 30, "city": "Moscow"}

# CPython делает примерно следующее:
# 1. hash_value = hash("age")       → вычисляем хэш
# 2. slot = hash_value % table_size → начальная ячейка индексной таблицы
# 3. idx = indices[slot]            → получаем индекс в массив записей
# 4. entry = entries[idx]           → берём запись
# 5. if entry.hash == hash_value and entry.key == "age": return entry.value
# 6. Иначе — linear probing (шаг по таблице) до нахождения или пустой ячейки
\`\`\`

### Вставка ключа

\`\`\`python
d = {}
d["x"] = 42

# 1. hash_value = hash("x")
# 2. Найти свободную ячейку в indices через probing
# 3. Записать (hash_value, "x", 42) в конец entries → entries[n]
# 4. indices[slot] = n
# 5. Если load factor > 2/3 → resize (удвоение таблицы + перехэширование)
\`\`\`

### Удаление ключа

При удалении запись в \`entries\` помечается как \`DKIX_DUMMY\` (tombstone), а ячейка в \`indices\` — как "удалённая". Это нужно для корректной работы probing (нельзя просто поставить -1, иначе цепочка probing оборвётся):

\`\`\`python
d = {"a": 1, "b": 2, "c": 3}
del d["b"]
# "b" помечена как удалённая, но место в таблице занято (tombstone)
# При следующем resize tombstone убираются
\`\`\`

---

## Временная сложность

| Операция | Среднее | Худшее |
|----------|---------|--------|
| \`d[key]\` (чтение) | O(1) | O(n) |
| \`d[key] = val\` (запись) | O(1) | O(n) |
| \`del d[key]\` | O(1) | O(n) |
| \`key in d\` | O(1) | O(n) |
| Итерация | O(n) | O(n) |
| Копия \`d.copy()\` | O(n) | O(n) |

**Худший случай O(n)** возникает при **коллизиях хэшей**. Если все ключи имеют одинаковый хэш, каждая операция вынуждена пройти всю таблицу через probing.

\`\`\`python
# Атака через коллизии хэшей
# В CPython есть PYTHONHASHSEED — случайная соль для хэшей строк
# (по умолчанию включена с Python 3.3, PEP 456)
import os
print(os.environ.get("PYTHONHASHSEED", "random"))

# Пример класса с намеренной коллизией (демонстрация):
class BadHash:
    def __init__(self, v):
        self.v = v
    def __hash__(self):
        return 42   # все объекты имеют одинаковый хэш!
    def __eq__(self, other):
        return self.v == other.v

d = {}
for i in range(1000):
    d[BadHash(i)] = i
# Вставка стала O(n) — каждый раз нужно проходить всю цепочку коллизий
\`\`\`

---

## Экономия памяти compact dict

\`\`\`python
import sys

# Сравнение: old dict vs compact dict
# Старая реализация хранила (hash, key, value) в каждой ячейке sparse таблицы
# Новая: indices — маленькие int (1/2/4 байта в зависимости от размера), entries — плотный

d = {}
sizes = []
for i in range(9):
    d[i] = i
    sizes.append(sys.getsizeof(d))

for i, s in enumerate(sizes):
    print(f"Элементов: {i+1}, размер dict: {s} байт")

# В компактной реализации индексная таблица использует минимально необходимый
# тип: int8 для таблиц до 128 элементов, int16 до 32768 и т.д.
\`\`\`

---

## Split-table dict (общий __dict__ для экземпляров)

Отдельная оптимизация для атрибутов экземпляров класса: если все экземпляры имеют одинаковые ключи, CPython может использовать **общую** индексную таблицу и **отдельные** массивы значений для каждого экземпляра:

\`\`\`python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p1 = Point(1, 2)
p2 = Point(3, 4)

# p1.__dict__ и p2.__dict__ разделяют одну индексную таблицу (ключи x, y),
# но имеют разные массивы значений → экономия памяти при тысячах экземпляров
print(p1.__dict__)   # {"x": 1, "y": 2}
print(p2.__dict__)   # {"x": 3, "y": 4}
\`\`\`

---

## Практические выводы

\`\`\`python
# 1. Порядок вставки гарантирован с Python 3.7+
d = {}
d["z"] = 1
d["a"] = 2
d["m"] = 3
print(list(d.keys()))   # ["z", "a", "m"] — порядок вставки

# 2. dict.update() сохраняет порядок
base = {"a": 1, "b": 2}
base.update({"c": 3, "a": 99})
print(base)   # {"a": 99, "b": 2, "c": 3} — "a" обновлена на месте, "c" добавлена в конец

# 3. Предпочитайте строки/числа как ключи — у них быстрый хэш
# hash(int) = сам int (для небольших чисел)
# hash(str) = вычисляется один раз и кэшируется в ob_shash
print(hash("hello"))  # постоянно одно значение в рамках сессии (при фиксированном PYTHONHASHSEED)
\`\`\``,
  },
  {
    id: "cpython-pyobject-type-system",
    question:
      "В чём разница между макросом PyObject и переменными на уровне C-исходников CPython? Как Python понимает тип переменной в рантайме?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "senior",
    answer: `## PyObject — основа всего

В CPython **каждый** объект Python — это структура C, начинающаяся с общего заголовка \`PyObject\`. Это фундаментальный принцип: Python — это тонкая абстракция над C-структурами.

### Определение PyObject (упрощённо из \`Include/object.h\`)

\`\`\`c
/* Каждый Python-объект начинается с этого макро-заголовка */
#define PyObject_HEAD  \\
    Py_ssize_t ob_refcnt;   /* счётчик ссылок для GC              */ \\
    PyTypeObject *ob_type;  /* указатель на объект типа (класс)   */

typedef struct _object {
    PyObject_HEAD
} PyObject;
\`\`\`

Все конкретные объекты расширяют этот заголовок:

\`\`\`c
/* Целое число (Python int) */
typedef struct {
    PyObject_HEAD
    Py_ssize_t ob_size;      /* количество "цифр" числа           */
    uint32_t   ob_digit[1];  /* массив цифр в 30-битной системе   */
} PyLongObject;

/* Список (Python list) */
typedef struct {
    PyObject_VAR_HEAD          /* включает ob_refcnt, ob_type, ob_size */
    PyObject **ob_item;        /* указатель на массив указателей    */
    Py_ssize_t allocated;      /* ёмкость выделенного массива       */
} PyListObject;

/* Строка (Python str) */
typedef struct {
    PyObject_HEAD
    Py_ssize_t length;
    Py_hash_t  hash;
    /* ... и данные символов дальше ... */
} PyASCIIObject;
\`\`\`

---

## Как Python определяет тип в рантайме?

Ключ — поле \`ob_type\`: указатель на объект типа \`PyTypeObject\`. Это сам "класс" в C-представлении.

\`\`\`c
/* PyTypeObject — это тоже PyObject, но с огромным количеством полей */
typedef struct _typeobject {
    PyObject_VAR_HEAD
    const char *tp_name;        /* "int", "list", "str", ...        */
    Py_ssize_t  tp_basicsize;   /* размер экземпляра в байтах        */
    
    /* Слоты для операций — указатели на C-функции: */
    hashfunc    tp_hash;        /* реализация hash()                 */
    reprfunc    tp_repr;        /* реализация repr()                 */
    richcmpfunc tp_richcompare; /* реализация ==, <, > и т.д.        */
    
    destructor  tp_dealloc;     /* вызывается при ob_refcnt == 0     */
    
    PyNumberMethods  *tp_as_number;   /* +, -, *, /                  */
    PySequenceMethods *tp_as_sequence;/* [], len()                   */
    PyMappingMethods  *tp_as_mapping; /* для dict-подобных объектов  */
    /* ... ещё ~50 полей ... */
} PyTypeObject;
\`\`\`

### Как Python вызывает метод

\`\`\`python
x = 42
y = 10
z = x + y   # как это работает на уровне C?
\`\`\`

CPython делает следующее:
1. Берёт \`ob_type\` объекта \`x\` → \`&PyLong_Type\`
2. Обращается к \`tp_as_number->nb_add\`
3. Вызывает \`long_add(x, y)\`

\`\`\`c
/* Упрощённо: вызов бинарной операции в ceval.c */
PyObject *
binary_op(PyObject *v, PyObject *w, const int op_slot, const char *op_name)
{
    binaryfunc slotv = NULL;
    binaryfunc slotw = NULL;

    /* Получаем слот из ob_type */
    if (v->ob_type->tp_as_number != NULL)
        slotv = NB_BINOP(v->ob_type->tp_as_number, op_slot);
    
    if (w->ob_type->tp_as_number != NULL)
        slotw = NB_BINOP(w->ob_type->tp_as_number, op_slot);

    if (slotv) {
        PyObject *x = slotv(v, w);   /* вызываем long_add */
        if (x != Py_NotImplemented)
            return x;
    }
    /* ... fallback на slotw ... */
}
\`\`\`

---

## Переменные Python — это только указатели

Критически важный момент: переменная Python — это **не ящик с данными**, а **указатель на объект** в куче. Сам объект хранит свой тип.

\`\`\`python
# В Python:
x = 42
x = "hello"
x = [1, 2, 3]

# На уровне C это выглядит так:
# PyObject *x = (PyObject *) &small_int_42;
# x = (PyObject *) some_str_object;
# x = (PyObject *) some_list_object;
#
# Тип всегда определяется через x->ob_type, а не через "тип переменной"
\`\`\`

### Проверка типа в Python тоже через ob_type

\`\`\`python
x = 42
print(type(x))         # <class 'int'>
print(type(x) is int)  # True

# type() в CPython — это просто:
# return (PyObject *) v->ob_type;

# isinstance() смотрит на цепочку наследования через tp_base:
print(isinstance(x, (int, float)))  # True
\`\`\`

---

## Макрос vs функция: производительность и безопасность

CPython использует макросы для **горячих путей** (hot paths) ради инлайнинга:

\`\`\`c
/* Макрос — раскрывается в месте вызова (нет вызова функции): */
#define Py_TYPE(ob)    (((PyObject*)(ob))->ob_type)
#define Py_REFCNT(ob)  (((PyObject*)(ob))->ob_refcnt)
#define PyList_GET_SIZE(op)  (((PyListObject *)(op))->ob_size)

/* Функция — с проверкой типа (медленнее, но безопаснее для расширений): */
Py_ssize_t PyList_Size(PyObject *op) {
    if (!PyList_Check(op)) {
        PyErr_SetString(PyExc_SystemError, "...");
        return -1;
    }
    return ((PyListObject *)op)->ob_size;
}

/* PyList_Check — тоже макрос: */
#define PyList_Check(op) PyObject_TypeCheck(op, &PyList_Type)
\`\`\`

---

## Наблюдение из Python: id и ob_type

\`\`\`python
import ctypes

# id() в CPython возвращает адрес объекта в памяти
x = "hello"
addr = id(x)
print(f"Адрес объекта x: {addr:#x}")

# Можно даже прочитать ob_refcnt через ctypes (только для демонстрации!):
import sys
ref_count = ctypes.c_ssize_t.from_address(addr).value
sys_count  = sys.getrefcount(x)
print(f"ob_refcnt через ctypes: {ref_count}")
print(f"sys.getrefcount:        {sys_count}")  # на 1 больше (аргумент getrefcount)
\`\`\`

---

## Пользовательские типы: как Python создаёт PyTypeObject

Когда вы пишете \`class Foo:\`, интерпретатор создаёт новый \`PyTypeObject\` в рантайме:

\`\`\`python
class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "Woof"

# type(Dog) — это <class 'type'> — метакласс
# Dog.__mro__ — Method Resolution Order — цепочка tp_base в C
print(Dog.__mro__)   # (<class 'Dog'>, <class 'Animal'>, <class 'object'>)

# При вызове dog.speak() CPython:
# 1. dog->ob_type == &Dog_Type
# 2. Ищет "speak" в Dog_Type.tp_dict
# 3. Находит → вызывает Dog.speak(dog)
# 4. Если не найдено → переходит по tp_base (MRO) к Animal_Type, затем object_Type

dog = Dog()
print(type(dog).__mro__)  # то же самое
\`\`\`

---

## Итоговая схема

\`\`\`
Переменная Python (имя в namespace)
           │
           ▼  (указатель)
┌─────────────────────────────┐
│       PyObject              │
│  ob_refcnt:  2              │  ← счётчик ссылок
│  ob_type: ──────────────────┼──→ PyTypeObject ("int")
│  [данные объекта...]        │       tp_name:    "int"
└─────────────────────────────┘       tp_hash:    long_hash
                                      tp_repr:    long_repr
                                      nb_add:     long_add
                                      tp_dealloc: long_dealloc
                                      tp_base: ───→ object_Type
\`\`\`

**Ключевые выводы:**
- Python-переменная — всегда \`PyObject*\` (указатель, 8 байт на 64-бит).
- Тип определяется через \`ob_type\` в рантайме — Python **динамически типизирован** на уровне архитектуры.
- \`PyTypeObject\` — это таблица виртуальных методов (vtable) в терминах C++.
- Макросы используются для оптимизации в горячем коде, функции — для безопасного API расширений.`,
  },
  {
    id: "cpython-gil-free-threaded",
    question:
      "Что такое GIL (Global Interpreter Lock)? В каких ситуациях он не является помехой, и как изменения в последних версиях Python (PEP 683/703 — free-threaded Python) меняют ситуацию?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "senior",
    answer: `## Что такое GIL?

GIL (Global Interpreter Lock) — это мьютекс (mutex) внутри CPython, который гарантирует, что в каждый момент времени **только один поток** выполняет байткод Python. Он защищает внутренние структуры интерпретатора (прежде всего — счётчик ссылок \`ob_refcnt\`) от гонок данных (race conditions).

\`\`\`python
import threading
import sys

x = []

# Без GIL эта операция была бы небезопасна:
# поток A читает ob_refcnt = 2
# поток B читает ob_refcnt = 2
# поток A записывает 3
# поток B записывает 3  ← должно быть 4!
# → утечка памяти или segfault

# GIL делает inc/dec атомарными на уровне потоков Python
def append_items():
    for _ in range(100_000):
        x.append(1)

t1 = threading.Thread(target=append_items)
t2 = threading.Thread(target=append_items)
t1.start(); t2.start()
t1.join(); t2.join()
print(len(x))  # ровно 200 000 — благодаря GIL
\`\`\`

### Как GIL переключается между потоками

До Python 3.2 GIL переключался каждые N байткод-инструкций (по умолчанию 100). С Python 3.2+ используется **interval-based switching**: GIL отпускается каждые 5 миллисекунд (настраивается через \`sys.setswitchinterval\`).

\`\`\`python
import sys

print(sys.getswitchinterval())   # 0.005 (5 мс по умолчанию)
sys.setswitchinterval(0.001)     # переключать чаще (1 мс)
\`\`\`

---

## Когда GIL не мешает?

### 1. I/O-bound задачи

Во время системных вызовов (сеть, файлы, сокеты) GIL **отпускается** — другие потоки могут работать:

\`\`\`python
import threading
import urllib.request
import time

urls = [
    "https://httpbin.org/delay/1",
    "https://httpbin.org/delay/1",
    "https://httpbin.org/delay/1",
]

def fetch(url):
    urllib.request.urlopen(url)  # GIL отпускается во время ожидания ответа

start = time.time()
threads = [threading.Thread(target=fetch, args=(u,)) for u in urls]
for t in threads: t.start()
for t in threads: t.join()
print(f"Потоки: {time.time() - start:.1f}s")  # ~1s (параллельно!)

start = time.time()
for u in urls: fetch(u)
print(f"Последовательно: {time.time() - start:.1f}s")  # ~3s
\`\`\`

### 2. C-расширения, которые явно отпускают GIL

NumPy, Pandas, PIL и другие библиотеки освобождают GIL во время тяжёлых вычислений:

\`\`\`python
import numpy as np
import threading
import time

# NumPy операции освобождают GIL:
def matrix_op():
    a = np.random.rand(2000, 2000)
    np.dot(a, a)  # выполняется в C, GIL отпущен

start = time.time()
t1 = threading.Thread(target=matrix_op)
t2 = threading.Thread(target=matrix_op)
t1.start(); t2.start()
t1.join(); t2.join()
print(f"Параллельно (NumPy): {time.time() - start:.2f}s")  # быстрее одного потока!
\`\`\`

### 3. CPU-bound задачи → multiprocessing вместо threading

\`\`\`python
from multiprocessing import Pool
import time

def cpu_task(n):
    return sum(i * i for i in range(n))

# threading — не ускоряет CPU-bound:
# оба потока борются за GIL, общее время ≈ последовательному

# multiprocessing — каждый процесс имеет свой GIL:
with Pool(4) as p:
    results = p.map(cpu_task, [10_000_000] * 4)
# Реальный параллелизм на 4 ядрах!
\`\`\`

---

## PEP 703 — Free-Threaded Python (Python 3.13+)

PEP 703 ("Making the Global Interpreter Lock Optional") — экспериментальная возможность запускать CPython **без GIL**. В Python 3.13 это флаг сборки \`--disable-gil\`, в 3.14+ планируется стабилизация.

### Как запустить free-threaded интерпретатор

\`\`\`bash
# Установка через pyenv с флагом free-threaded:
PYTHON_CONFIGURE_OPTS="--disable-gil" pyenv install 3.13.0

# Или официальный билд python.org с суффиксом "t":
python3.13t --version
# Python 3.13.0 experimental free-threading build

# Проверить, что GIL отключён:
python3.13t -c "import sys; print(sys._is_gil_enabled())"  # False
\`\`\`

### Что изменилось вместо GIL

Вместо одного большого лока используется ряд механизмов:

\`\`\`python
# 1. Biased Reference Counting (PEP 683)
#    ob_refcnt разбит на "локальный" (для владеющего потока, без атомарных операций)
#    и "общий" счётчик (атомарный, для других потоков)
#    → большинство операций с refcount не требуют синхронизации

# 2. Per-object locking
#    Каждый изменяемый объект имеет собственный мьютекс

# 3. Immortal objects (PEP 683)
#    Некоторые объекты (None, True, False, small ints) "бессмертны":
#    их ob_refcnt не изменяется → синхронизация не нужна вообще

import sys
print(sys.getrefcount(None))   # очень большое число — immortal object
\`\`\`

### Пример реального параллелизма без GIL

\`\`\`python
# Только на python3.13t (free-threaded build)
import threading
import time

def cpu_bound(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

N = 50_000_000

# С GIL: два потока не быстрее одного
# Без GIL (3.13t): реальный параллелизм
start = time.time()
t1 = threading.Thread(target=cpu_bound, args=(N,))
t2 = threading.Thread(target=cpu_bound, args=(N,))
t1.start(); t2.start()
t1.join(); t2.join()
print(f"Время: {time.time() - start:.2f}s")
# python3.13 (с GIL):  ~2.4s (последовательно по факту)
# python3.13t (без GIL): ~1.2s (реальный параллелизм!)
\`\`\`

### Подводные камни free-threaded Python

\`\`\`python
# Теперь нужна явная синхронизация там, где GIL давал её "бесплатно":
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    for _ in range(100_000):
        # БЕЗ GIL это гонка данных:
        # counter += 1  ← не атомарно!

        # НУЖНО явно:
        with lock:
            counter += 1

threads = [threading.Thread(target=increment) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)  # 400 000 — корректно только с lock
\`\`\`

---

## Итоговая сравнительная таблица

| Ситуация | GIL | Решение |
|----------|-----|---------|
| I/O-bound (сеть, файлы) | Не мешает — GIL отпускается | \`threading\` |
| CPU-bound (чистый Python) | Мешает — нет параллелизма | \`multiprocessing\` |
| CPU-bound (NumPy/C-расширения) | Не мешает — расширения отпускают GIL | \`threading\` |
| Python 3.13t free-threaded | GIL отсутствует | \`threading\` (нужен явный locking) |`,
  },
  {
    id: "cpython-pymalloc-arenas-pools",
    question:
      "Как работает механизм выделения памяти (PyMalloc) в CPython? Что такое arenas, pools и blocks?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "senior",
    answer: `## Зачем PyMalloc?

Стандартный \`malloc()\` из C-библиотеки — универсальный, но медленный: каждый вызов требует системного вызова и работы с кучей ОС. Python создаёт и уничтожает миллионы мелких объектов (числа, строки, кортежи). CPython реализует собственный аллокатор — **PyMalloc** — оптимизированный для объектов размером **≤ 512 байт**.

---

## Трёхуровневая иерархия памяти

\`\`\`
Арена (Arena) — 256 КиБ, выровненная по странице ОС
└── Пул (Pool) — 4 КиБ (= 1 страница ОС)
    └── Блоки (Blocks) — фиксированного размера для объектов одного класса размера
\`\`\`

### Уровень 1 — Arenas (Арены)

Арена — это кусок памяти размером **256 КиБ**, запрашиваемый у ОС через \`mmap()\` или \`VirtualAlloc()\`. Арены выровнены по границе страницы памяти (обычно 4 КиБ), что ускоряет работу с TLB процессора.

\`\`\`c
/* Из CPython: Objects/obmalloc.c */
#define ARENA_SIZE  (256 << 10)   /* 256 КиБ */

struct arena_object {
    uintptr_t address;        /* адрес арены в памяти       */
    uint ntotalpools;         /* всего пулов в арене = 64   */
    uint nfreepools;          /* свободных пулов            */
    struct pool_header *freepools; /* список свободных пулов */
};
\`\`\`

Арены **никогда не возвращаются ОС**, пока хотя бы один пул в них занят. Это означает, что "пиковое" потребление памяти Python может не снижаться после удаления объектов — память остаётся в арене для повторного использования.

\`\`\`python
import tracemalloc, gc

tracemalloc.start()

# Создаём миллион объектов → арены выделяются
data = [object() for _ in range(1_000_000)]
snap1 = tracemalloc.take_snapshot()

# Удаляем → арены НЕ возвращаются ОС сразу
del data
gc.collect()
snap2 = tracemalloc.take_snapshot()

stats = snap2.compare_to(snap1, 'lineno')
# Память может быть всё ещё "занята" с точки зрения ОС
\`\`\`

### Уровень 2 — Pools (Пулы)

Пул занимает ровно **4 КиБ** (1 страницу памяти ОС). Каждый пул обслуживает объекты **одного класса размера** (size class). Это ключевое ограничение: в пул размерного класса 32 байта нельзя положить объект 64 байта.

\`\`\`c
/* Заголовок пула */
struct pool_header {
    union { block *_padding; uint count; } ref; /* кол-во выделенных блоков */
    block *freeblock;           /* список свободных блоков          */
    struct pool_header *nextpool; /* следующий пул того же размерного класса */
    struct pool_header *prevpool; /* предыдущий пул                 */
    uint arenaindex;            /* индекс арены, которой принадлежит */
    uint szidx;                 /* индекс размерного класса         */
    uint nextoffset;            /* смещение до следующего свободного блока */
    uint maxnextoffset;         /* максимальное допустимое смещение */
};
\`\`\`

Состояния пула:
- **full** — все блоки заняты
- **used** — есть и занятые, и свободные блоки (в "usedpools" списке)
- **empty** — все блоки свободны (возвращается арене)

### Уровень 3 — Blocks (Блоки)

Блок — минимальная единица выделения. Размеры блоков — кратны 8 байтам от 8 до 512 байт:

\`\`\`
Запрос    → Класс размера (szidx) → Размер блока
1–8 байт  →  0   →   8 байт
9–16      →  1   →  16 байт
17–24     →  2   →  24 байт
...
505–512   →  63  → 512 байт
> 512     →  → напрямую через malloc() системы
\`\`\`

Свободные блоки внутри пула связаны в **односвязный список** через сам блок (первые байты блока хранят указатель на следующий свободный):

\`\`\`c
/* Упрощённо: выделение блока */
void *pymalloc_alloc(size_t nbytes) {
    uint size = (nbytes + 7) & ~7;    /* выровнять до кратного 8 */
    uint szidx = (size - 1) >> 3;     /* индекс класса размера   */

    pool = usedpools[szidx];           /* найти пул с этим классом */
    if (pool->freeblock != NULL) {
        block *b = pool->freeblock;
        pool->freeblock = *(block **)b; /* взять из списка          */
        return (void *)b;
    }
    /* ... иначе — взять новый пул из арены */
}
\`\`\`

---

## Визуализация структуры

\`\`\`
Arena (256 КиБ)
├── Pool #0  (4 КиБ, size class = 8 байт)
│   ├── Block[0] = объект A (занят)
│   ├── Block[1] = FREE → Block[3]
│   ├── Block[2] = объект B (занят)
│   └── Block[3] = FREE → NULL
├── Pool #1  (4 КиБ, size class = 32 байта)
│   ├── Block[0] = объект C (занят)
│   └── Block[1] = объект D (занят)  ← full pool
├── Pool #2  (4 КиБ, size class = 64 байта)
│   └── (все блоки свободны)  ← empty pool
└── ... (ещё 61 пул)
\`\`\`

---

## Наблюдение за аллокатором из Python

\`\`\`python
import sys
import tracemalloc

tracemalloc.start()

# sys.getallocatedblocks() — количество выделенных блоков PyMalloc
before = sys.getallocatedblocks()
lst = [i for i in range(10_000)]
after = sys.getallocatedblocks()
print(f"Блоков выделено: {after - before}")

# tracemalloc даёт детальную информацию по вызывающему коду
snapshot = tracemalloc.take_snapshot()
top = snapshot.statistics("lineno")[:5]
for stat in top:
    print(stat)
\`\`\`

---

## Практические следствия

\`\`\`python
# 1. Фрагментация: арена не освобождается, если хоть 1 объект жив
import gc

class Pinned:
    pass

sentinel = Pinned()   # этот объект удерживает арену
many = [Pinned() for _ in range(100_000)]
del many              # арена не возвращается ОС из-за sentinel!
gc.collect()

# 2. Большие объекты идут напрямую в malloc (> 512 байт)
big = bytearray(1024)   # не через PyMalloc
small = bytearray(64)   # через PyMalloc

# 3. Для профилирования реального потребления памяти используйте tracemalloc
# или внешние инструменты: memory_profiler, memray
\`\`\`

---

## Итог: три уровня кэша памяти CPython

| Уровень | Размер | Управляет | Освобождение |
|---------|--------|-----------|--------------|
| Arena | 256 КиБ | ОС → CPython | Только когда все пулы пусты |
| Pool | 4 КиБ | Arena → PyMalloc | Возврат в арену когда пуст |
| Block | 8–512 байт | Pool → объект | Возврат в пул при \`del\` |`,
  },
  {
    id: "cpython-yield-from",
    question:
      "Каков механизм работы оператора yield from по сравнению с обычным циклом for по генератору?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "middle",
    answer: `## Базовое различие

\`for x in gen\` — это синтаксический сахар для цикла с явными вызовами \`next()\`. \`yield from gen\` — полноценный **субгенераторный протокол**, который прозрачно передаёт управление, значения и исключения между вызывающим кодом и вложенным генератором.

---

## Простой случай: итерация значений

\`\`\`python
def inner():
    yield 1
    yield 2
    yield 3

# Через for:
def outer_for():
    for value in inner():
        yield value

# Через yield from:
def outer_yield_from():
    yield from inner()

# Результат одинаковый:
print(list(outer_for()))          # [1, 2, 3]
print(list(outer_yield_from()))   # [1, 2, 3]
\`\`\`

Но это поверхностное сходство. На уровне интерпретатора они работают совершенно по-разному.

---

## Ключевое отличие 1: возвращаемое значение (return value)

Генератор может вернуть значение через \`return\`. \`for\`-цикл это значение **теряет**, а \`yield from\` — **передаёт наружу**:

\`\`\`python
def inner_with_return():
    yield 1
    yield 2
    return "результат subgenerator"   # StopIteration.value

# С for — значение return теряется:
def outer_for():
    for v in inner_with_return():
        yield v
    # нет способа получить "результат subgenerator"

# С yield from — значение return становится значением yield from:
def outer_yield_from():
    result = yield from inner_with_return()
    print(f"Subgenerator вернул: {result}")
    yield f"outer получил: {result}"

gen = outer_yield_from()
print(next(gen))   # 1
print(next(gen))   # 2
# Subgenerator вернул: результат subgenerator
print(next(gen))   # outer получил: результат subgenerator
\`\`\`

---

## Ключевое отличие 2: передача значений через send()

\`send(value)\` позволяет передавать данные **внутрь** генератора. С \`for\`-циклом значение никогда не доходит до внутреннего генератора — \`yield from\` прозрачно его передаёт:

\`\`\`python
def accumulator():
    total = 0
    while True:
        value = yield total   # получаем значение через send()
        if value is None:
            break
        total += value

# С for — send() получает ТОЛЬКО outer, inner никогда не видит значение:
def outer_for():
    gen = accumulator()
    next(gen)   # инициализация
    for _ in range(3):
        received = yield   # outer получает, но НЕ пробрасывает в inner
        # gen.send(received) нужно вызывать вручную — и это не то же самое!

# С yield from — send() прозрачно доходит до accumulator:
def outer_yield_from():
    result = yield from accumulator()

gen = outer_yield_from()
print(next(gen))       # 0 (инициализация)
print(gen.send(10))    # 10  — дошло до accumulator!
print(gen.send(20))    # 30
print(gen.send(5))     # 35
\`\`\`

---

## Ключевое отличие 3: проброс исключений (throw)

\`\`\`python
def careful_gen():
    try:
        yield 1
        yield 2
    except ValueError as e:
        print(f"Поймано внутри: {e}")
        yield 99

# С for — throw() НЕ передаётся в inner, ловит outer:
def outer_for():
    try:
        for v in careful_gen():
            yield v
    except ValueError as e:
        print(f"Поймано снаружи: {e}")   # ← выполнится это

# С yield from — throw() доходит до inner:
def outer_yield_from():
    yield from careful_gen()           # ← inner поймает сам

gen = outer_yield_from()
next(gen)              # 1
gen.throw(ValueError, "тест")
# Поймано внутри: тест
print(next(gen))       # 99

gen2 = outer_for()
next(gen2)
gen2.throw(ValueError, "тест")
# Поймано снаружи: тест
\`\`\`

---

## Полная семантика yield from (PEP 380)

Оператор \`RESULT = yield from EXPR\` эквивалентен следующему развёрнутому коду:

\`\`\`python
# PEP 380 — полная семантика (упрощённо):
_i = iter(EXPR)
try:
    _y = next(_i)
except StopIteration as _e:
    _r = _e.value
else:
    while True:
        try:
            _s = yield _y                 # отдаём значение вызывающему
        except GeneratorExit as _e:
            _i.close()
            raise
        except BaseException as _e:
            try:
                _m = _i.throw             # пробрасываем исключение в inner
                _y = _m(type(_e), _e, _e.__traceback__)
            except StopIteration as _e:
                _r = _e.value
                break
        else:
            try:
                if _s is None:
                    _y = next(_i)         # обычный next()
                else:
                    _y = _i.send(_s)      # send() если было значение
            except StopIteration as _e:
                _r = _e.value
                break
RESULT = _r
\`\`\`

---

## Применение: asyncio построен на yield from / await

\`async/await\` в CPython реализован поверх этого протокола:

\`\`\`python
import asyncio

# async def — это генератор с флагом CO_COROUTINE
# await — это yield from для корутин

async def fetch_data():
    await asyncio.sleep(1)   # yield from sleep(1)
    return "данные"

async def main():
    result = await fetch_data()   # = result = yield from fetch_data()
    print(result)

# Цикл событий вызывает send(None) для продвижения корутины,
# а yield from прозрачно передаёт управление вглубь цепочки
asyncio.run(main())
\`\`\`

---

## Сравнительная таблица

| Возможность | \`for x in gen\` | \`yield from gen\` |
|-------------|-----------------|-------------------|
| Итерация значений | ✅ | ✅ |
| Получить \`return\` subgenerator | ❌ | ✅ |
| Прозрачный \`send()\` | ❌ | ✅ |
| Прозрачный \`throw()\` | ❌ | ✅ |
| Прозрачный \`close()\` | ❌ | ✅ |
| Использование в asyncio | ❌ | ✅ (основа \`await\`) |`,
  },
  {
    id: "cpython-stack-frames",
    question:
      "Что происходит на уровне интерпретатора при вызове функции (создание фреймов стека, работа с sys._getframe)?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "senior",
    answer: `## Фрейм выполнения (Frame Object)

Каждый вызов функции в CPython создаёт **фрейм выполнения** — объект \`PyFrameObject\`, который хранит всё состояние исполнения: локальные переменные, стек значений, ссылку на код и текущую инструкцию.

### Структура PyFrameObject (упрощённо)

\`\`\`c
/* Include/cpython/frameobject.h */
typedef struct _PyInterpreterFrame {
    PyObject *f_globals;        /* глобальный namespace (dict модуля)   */
    PyObject *f_builtins;       /* namespace встроенных функций         */
    PyObject *f_locals;         /* локальный namespace (NULL до запроса) */
    PyCodeObject *f_code;       /* объект кода (байткод + метаданные)   */
    int f_lasti;                /* индекс последней выполненной инструкции */
    int f_lineno;               /* текущая строка исходного кода        */
    struct _PyInterpreterFrame *previous; /* предыдущий фрейм (caller) */
    PyObject *localsplus[1];    /* локальные переменные + стек значений */
} _PyInterpreterFrame;
\`\`\`

---

## Что происходит при вызове функции

\`\`\`python
def add(a, b):
    result = a + b
    return result

x = add(3, 5)
\`\`\`

Пошагово на уровне интерпретатора:

**1. Компиляция в байткод** (происходит один раз при определении функции):

\`\`\`python
import dis

def add(a, b):
    result = a + b
    return result

dis.dis(add)
# RESUME           0
# LOAD_FAST        0 (a)
# LOAD_FAST        1 (b)
# BINARY_OP        0 (+)
# STORE_FAST       2 (result)
# LOAD_FAST        2 (result)
# RETURN_VALUE
\`\`\`

**2. Вызов функции** (\`CALL\` инструкция):

\`\`\`python
# При вызове add(3, 5) интерпретатор:
# 1. Создаёт новый PyInterpreterFrame
# 2. Копирует аргументы (3, 5) в localsplus[0] и localsplus[1]
# 3. Устанавливает f_code = add.__code__
# 4. Записывает previous → текущий фрейм (фрейм вызывающего)
# 5. Начинает выполнять байткод с f_lasti = 0
\`\`\`

**3. Выполнение** — цикл eval loop (\`ceval.c\`):

\`\`\`c
/* Упрощённый eval loop (Python 3.11+ использует computed goto): */
for (;;) {
    opcode = NEXTOPCODE();
    switch (opcode) {
        case LOAD_FAST:
            v = frame->localsplus[oparg];
            PUSH(v);
            break;
        case BINARY_OP:
            right = POP();
            left = TOP();
            res = binary_op(left, right, oparg);
            SET_TOP(res);
            break;
        case RETURN_VALUE:
            retval = POP();
            /* восстановить предыдущий фрейм */
            frame = frame->previous;
            goto return_or_yield;
    }
}
\`\`\`

---

## Оптимизация фреймов в Python 3.11+

До Python 3.11 каждый фрейм был отдельным объектом в куче (heap). С 3.11 введены **"inline frames"**: фреймы создаются прямо на C-стеке интерпретатора без аллокации в куче — это ускоряет вызов функций на 15–30%.

\`\`\`python
import sys

# Python 3.11+: фрейм создаётся только при явном доступе
def fast_func():
    pass   # фрейм НЕ аллоцируется в heap

def frame_aware_func():
    frame = sys._getframe()   # только при явном запросе создаётся Python-объект
    return frame.f_lineno
\`\`\`

---

## sys._getframe() — доступ к стеку фреймов

\`sys._getframe(depth)\` возвращает \`PyFrameObject\` на глубине \`depth\` от текущего вызова:

\`\`\`python
import sys

def level_3():
    frame = sys._getframe(0)   # текущий фрейм (level_3)
    print(f"[0] {frame.f_code.co_name} — line {frame.f_lineno}")

    frame1 = sys._getframe(1)  # caller (level_2)
    print(f"[1] {frame1.f_code.co_name} — line {frame1.f_lineno}")

    frame2 = sys._getframe(2)  # caller's caller (level_1)
    print(f"[2] {frame2.f_code.co_name} — line {frame2.f_lineno}")

def level_2():
    level_3()

def level_1():
    level_2()

level_1()
# [0] level_3 — line 3
# [1] level_2 — line 14
# [2] level_1 — line 17
\`\`\`

### Полезные атрибуты фрейма

\`\`\`python
import sys

def inspect_self():
    frame = sys._getframe(0)
    print(f"Функция:   {frame.f_code.co_name}")
    print(f"Файл:      {frame.f_code.co_filename}")
    print(f"Строка:    {frame.f_lineno}")
    print(f"Локальные: {frame.f_locals}")
    print(f"Глобальные (ключи): {list(frame.f_globals.keys())[:5]}")

    # Итерация по всему стеку вызовов:
    f = frame
    print("\\nСтек вызовов:")
    while f is not None:
        print(f"  {f.f_code.co_filename}:{f.f_lineno} в {f.f_code.co_name}")
        f = f.f_back   # предыдущий фрейм

x = 42
inspect_self()
\`\`\`

---

## Практическое применение

### 1. Автоматическое определение имени вызывающей функции (логирование)

\`\`\`python
import sys

def log(message, level="INFO"):
    caller = sys._getframe(1)
    func_name = caller.f_code.co_name
    line = caller.f_lineno
    print(f"[{level}] {func_name}:{line} — {message}")

def process_order(order_id):
    log(f"Обработка заказа {order_id}")
    # [INFO] process_order:3 — Обработка заказа 42

process_order(42)
\`\`\`

### 2. traceback и inspect — используют sys._getframe внутри

\`\`\`python
import traceback
import inspect

def deep_function():
    # inspect.stack() — обёртка над sys._getframe() + разбор исходного кода
    stack = inspect.stack()
    for frame_info in stack[:3]:
        print(f"{frame_info.function}:{frame_info.lineno}")

    # traceback использует f_back для обхода стека
    traceback.print_stack()

deep_function()
\`\`\`

### 3. Объект кода (co_*) — метаданные функции

\`\`\`python
def my_func(a, b, c=10, *args, **kwargs):
    local_var = a + b
    return local_var

code = my_func.__code__
print(f"Имя:            {code.co_name}")        # my_func
print(f"Аргументов:     {code.co_argcount}")    # 3 (a, b, c)
print(f"Локальных:      {code.co_varnames}")    # ('a', 'b', 'c', 'args', 'kwargs', 'local_var')
print(f"Констант:       {code.co_consts}")      # (None, 10)
print(f"Стек (макс):    {code.co_stacksize}")   # максимальная глубина стека значений
print(f"Флаги:          {code.co_flags:#010x}") # CO_VARARGS | CO_VARKEYWORDS и т.д.

import dis
dis.dis(my_func)  # байткод функции
\`\`\`

---

## Стек вызовов: визуализация

\`\`\`
Стек интерпретатора (растёт вниз):
┌─────────────────────────────────┐
│ Frame: <module>                 │ ← f_back = None (верхний)
│   f_code: <module code>         │
│   f_locals: {'level_1': fn, ...}│
├─────────────────────────────────┤
│ Frame: level_1()                │
│   f_code: level_1.__code__      │
│   f_back → <module> frame       │
├─────────────────────────────────┤
│ Frame: level_2()                │
│   f_code: level_2.__code__      │
│   f_back → level_1 frame        │
├─────────────────────────────────┤
│ Frame: level_3()  ← текущий    │
│   f_code: level_3.__code__      │
│   f_locals: {'frame': ..., ...} │
│   f_back → level_2 frame        │
│   localsplus: [стек значений]   │
└─────────────────────────────────┘
\`\`\``,
  },
  {
    id: "cpython-copy-deepcopy",
    question:
      "Разница между глубоким (copy.deepcopy) и поверхностным (copy.copy) копированием: как они обрабатывают пользовательские объекты со сложной иерархией и циклическими ссылками?",
    category: "Внутреннее устройство CPython и управление памятью",
    difficulty: "middle",
    answer: `## Базовое различие

- **Поверхностное копирование** (\`copy.copy\`) — создаёт новый объект, но **не копирует** вложенные объекты: внутренние ссылки остаются на те же объекты.
- **Глубокое копирование** (\`copy.deepcopy\`) — рекурсивно создаёт **полностью независимые** копии всего графа объектов.

\`\`\`python
import copy

original = [[1, 2, 3], [4, 5, 6]]

shallow = copy.copy(original)
deep    = copy.deepcopy(original)

# Внешний список — новый объект:
print(original is shallow)   # False
print(original is deep)      # False

# Вложенные списки:
print(original[0] is shallow[0])  # True  — тот же объект!
print(original[0] is deep[0])     # False — независимая копия

# Мутация:
original[0].append(99)
print(shallow[0])   # [1, 2, 3, 99] — shallow "видит" изменение
print(deep[0])      # [1, 2, 3]     — deep изолирован
\`\`\`

---

## Как работает copy.copy()

Алгоритм поверхностного копирования (в порядке приоритета):

1. Проверить \`__copy__()\` у объекта → вызвать, если есть.
2. Для встроенных типов (\`list\`, \`dict\`, \`set\`) — вызвать конструктор: \`list(obj)\`, \`dict(obj)\` и т.д.
3. Иначе — создать новый экземпляр через \`__reduce_ex__(4)\` или \`__class__()\`, скопировать \`__dict__\`.

\`\`\`python
import copy

class Config:
    def __init__(self, settings, name):
        self.settings = settings   # изменяемый dict
        self.name = name

cfg = Config({"debug": True, "port": 8080}, "production")
cfg_copy = copy.copy(cfg)

print(cfg is cfg_copy)              # False — разные объекты
print(cfg.settings is cfg_copy.settings)  # True — один и тот же dict!

# Опасность: мутация через копию затрагивает оригинал
cfg_copy.settings["port"] = 9090
print(cfg.settings["port"])  # 9090 — оригинал изменён!

# name — строка (неизменяемая), разделение безопасно:
cfg_copy.name = "staging"
print(cfg.name)   # "production" — не изменился
\`\`\`

---

## Как работает copy.deepcopy()

Алгоритм глубокого копирования:

1. Проверить \`__deepcopy__(memo)\` → вызвать, если есть.
2. Проверить кэш \`memo\` (**словарь \`id → копия\`**) — ключевой механизм для циклических ссылок.
3. Рекурсивно скопировать все вложенные объекты через \`deepcopy()\`.
4. Неизменяемые атомарные типы (\`int\`, \`str\`, \`float\`, \`bool\`, \`None\`) — возвращаются **как есть** (оптимизация).

\`\`\`python
import copy

class Node:
    def __init__(self, value, children=None):
        self.value = value
        self.children = children or []

# Дерево объектов:
root = Node("root")
child1 = Node("child1")
child2 = Node("child2")
grandchild = Node("grandchild")

root.children = [child1, child2]
child1.children = [grandchild]

deep = copy.deepcopy(root)

# Всё полностью независимо:
print(deep is root)                          # False
print(deep.children[0] is root.children[0]) # False
print(deep.children[0].children[0] is grandchild)  # False

grandchild.value = "CHANGED"
print(deep.children[0].children[0].value)   # "grandchild" — не изменилось!
\`\`\`

---

## Обработка циклических ссылок

Это главная ответственность \`deepcopy\`. Словарь \`memo\` (id оригинала → уже созданная копия) предотвращает бесконечную рекурсию:

\`\`\`python
import copy

# Циклический граф:
a = {"name": "A"}
b = {"name": "B", "partner": a}
a["partner"] = b   # a → b → a → b → ...

# copy.copy — создаст копию верхнего dict, но внутренние ссылки
# остаются на оригинальные a и b:
shallow = copy.copy(a)
print(shallow["partner"] is b)          # True — тот же b!

# copy.deepcopy — корректно обрабатывает цикл через memo:
deep = copy.deepcopy(a)
print(deep["partner"] is b)             # False — новый объект
print(deep["partner"]["partner"] is deep)  # True — цикл воссоздан корректно!
print(deep["partner"]["partner"]["name"]) # "A"

# Без memo deepcopy ушёл бы в бесконечную рекурсию:
# deepcopy(a) → deepcopy(a["partner"]=b) → deepcopy(b["partner"]=a) → ...
# Но memo[id(a)] = уже_созданная_копия → цикл разрывается
\`\`\`

### Как memo работает в коде

\`\`\`python
# Упрощённая реализация deepcopy с memo:
def my_deepcopy(obj, memo=None):
    if memo is None:
        memo = {}

    obj_id = id(obj)
    if obj_id in memo:
        return memo[obj_id]   # уже копировали — вернуть готовую копию

    if isinstance(obj, (int, float, str, bool, type(None))):
        return obj   # неизменяемые атомарные типы — возвращаем как есть

    if isinstance(obj, list):
        copy = []
        memo[obj_id] = copy   # регистрируем ДО рекурсии (важно для циклов!)
        copy.extend(my_deepcopy(item, memo) for item in obj)
        return copy

    if isinstance(obj, dict):
        copy = {}
        memo[obj_id] = copy   # регистрируем ДО рекурсии
        for k, v in obj.items():
            copy[my_deepcopy(k, memo)] = my_deepcopy(v, memo)
        return copy

    # Для пользовательских классов — через __dict__
    # ...
\`\`\`

---

## Кастомизация копирования

### __copy__ и __deepcopy__

\`\`\`python
import copy

class SmartCache:
    def __init__(self, data):
        self.data = data
        self._cache = {}   # кэш не нужно копировать — он пересчитается

    def __copy__(self):
        # Поверхностная копия: новый объект, data — общая, cache — пустой
        new = SmartCache.__new__(SmartCache)
        new.data = self.data      # shared reference
        new._cache = {}           # новый пустой кэш
        return new

    def __deepcopy__(self, memo):
        # Глубокая копия: data полностью независима, cache — пустой
        new = SmartCache.__new__(SmartCache)
        memo[id(self)] = new      # регистрируем в memo ДО рекурсии!
        new.data = copy.deepcopy(self.data, memo)
        new._cache = {}           # кэш сбрасываем
        return new

cache = SmartCache({"key": [1, 2, 3]})
c1 = copy.copy(cache)
c2 = copy.deepcopy(cache)

print(c1.data is cache.data)    # True — shared
print(c2.data is cache.data)    # False — independent
print(c1._cache)                # {} — сброшен
print(c2._cache)                # {} — сброшен
\`\`\`

### __reduce__ и __reduce_ex__ (для pickle и deepcopy)

\`\`\`python
import copy

class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

    def __reduce__(self):
        # Описывает как пересоздать объект: (callable, args)
        return (Vector, (self.x, self.y))

v = Vector(3, 4)
v_copy = copy.deepcopy(v)
print(v_copy)             # Vector(3, 4)
print(v is v_copy)        # False
\`\`\`

---

## Производительность: когда что использовать

\`\`\`python
import copy, time

# Большая вложенная структура:
data = {"users": [{"id": i, "tags": list(range(10))} for i in range(1000)]}

start = time.perf_counter()
for _ in range(1000):
    copy.copy(data)
t_shallow = time.perf_counter() - start

start = time.perf_counter()
for _ in range(1000):
    copy.deepcopy(data)
t_deep = time.perf_counter() - start

print(f"copy.copy:     {t_shallow*1000:.1f} мс")
print(f"copy.deepcopy: {t_deep*1000:.1f} мс")
# deepcopy в 10–100x медленнее для сложных структур
\`\`\`

---

## Сводная таблица

| Аспект | \`copy.copy\` | \`copy.deepcopy\` |
|--------|--------------|-----------------|
| Новый объект верхнего уровня | ✅ | ✅ |
| Независимые вложенные объекты | ❌ | ✅ |
| Циклические ссылки | ⚠️ Копирует ссылки | ✅ Воссоздаёт граф |
| Кастомизация | \`__copy__\` | \`__deepcopy__(memo)\` |
| Скорость | Быстро | Медленно (рекурсия) |
| Неизменяемые типы | Возвращает оригинал | Возвращает оригинал (оптимизация) |`,
  },
  {
    id: "asyncio-gather-vs-wait",
    question:
      "Чем принципиально отличаются asyncio.gather и asyncio.wait? В каких сценариях проектирования лучше использовать каждый из них?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "middle",
    answer: `## Ключевые различия

\`asyncio.gather\` и \`asyncio.wait\` запускают несколько корутин параллельно, но дают принципиально разный контроль над результатами и поведением при ошибках.

---

## asyncio.gather — «дай мне все результаты»

\`gather\` ориентирован на **получение результатов** в том же порядке, в котором переданы аргументы. Он оборачивает каждую корутину в \`Task\` автоматически.

\`\`\`python
import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name}: готово"

async def main():
    # Запускаем три задачи параллельно
    results = await asyncio.gather(
        fetch("A", 1.0),
        fetch("B", 0.5),
        fetch("C", 1.5),
    )
    # results — список в порядке АРГУМЕНТОВ, не завершения:
    print(results)
    # ["A: готово", "B: готово", "C: готово"]
    # B завершилась первой, но стоит второй — порядок гарантирован!

asyncio.run(main())
\`\`\`

### Поведение при исключениях в gather

По умолчанию первое исключение **немедленно** отменяет \`gather\` и пробрасывается наружу. Остальные задачи продолжают работать, но их результаты теряются:

\`\`\`python
async def risky(name, fail=False):
    await asyncio.sleep(0.1)
    if fail:
        raise ValueError(f"{name} упал")
    return f"{name}: ок"

async def main():
    # return_exceptions=False (по умолчанию): первое исключение → пробрасывается
    try:
        results = await asyncio.gather(
            risky("A"),
            risky("B", fail=True),
            risky("C"),
        )
    except ValueError as e:
        print(f"Ошибка: {e}")   # "B упал" — A и C могут ещё работать!

    # return_exceptions=True: исключения становятся элементами результата
    results = await asyncio.gather(
        risky("A"),
        risky("B", fail=True),
        risky("C"),
        return_exceptions=True,
    )
    for r in results:
        if isinstance(r, Exception):
            print(f"  Упало: {r}")
        else:
            print(f"  Успех: {r}")
    # Успех: A: ок
    # Упало: B упал
    # Успех: C: ок

asyncio.run(main())
\`\`\`

---

## asyncio.wait — «дай мне контроль над задачами»

\`wait\` работает с **множествами задач** и возвращает два набора: \`done\` (завершённые) и \`pending\` (ожидающие). Требует явного создания \`Task\` объектов.

\`\`\`python
import asyncio

async def worker(name, delay):
    await asyncio.sleep(delay)
    return f"{name} завершён"

async def main():
    tasks = {
        asyncio.create_task(worker("A", 1.0), name="task-A"),
        asyncio.create_task(worker("B", 0.3), name="task-B"),
        asyncio.create_task(worker("C", 0.7), name="task-C"),
    }

    done, pending = await asyncio.wait(tasks)

    print("Завершённые:")
    for task in done:
        print(f"  {task.get_name()}: {task.result()}")
    # Порядок в done — НЕ гарантирован, это множество (set)
    print(f"Ожидающих: {len(pending)}")   # 0

asyncio.run(main())
\`\`\`

### return_when — управление точкой возврата

\`\`\`python
import asyncio

async def main():
    tasks = {
        asyncio.create_task(worker("A", 1.0)),
        asyncio.create_task(worker("B", 0.3)),
        asyncio.create_task(worker("C", 2.0)),
    }

    # FIRST_COMPLETED: вернуться как только одна задача завершится
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    print(f"Первой завершилась: {next(iter(done)).result()}")
    print(f"Ещё работают: {len(pending)}")
    # Отменим оставшиеся:
    for task in pending:
        task.cancel()

    # FIRST_EXCEPTION: вернуться при первом исключении (или если все завершились)
    # ALL_COMPLETED (по умолчанию): ждать все

asyncio.run(main())
\`\`\`

### Таймаут в wait

\`\`\`python
async def main():
    tasks = {
        asyncio.create_task(worker("slow", 5.0)),
        asyncio.create_task(worker("fast", 0.5)),
    }

    # Ждём не более 1 секунды
    done, pending = await asyncio.wait(tasks, timeout=1.0)

    print(f"Успело завершиться: {len(done)}")    # 1 (fast)
    print(f"Не успело: {len(pending)}")          # 1 (slow)

    # pending задачи продолжают работать! Нужно явно отменить:
    for task in pending:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

asyncio.run(main())
\`\`\`

---

## Продвинутые паттерны

### as_completed — обработка по мере завершения

\`\`\`python
async def main():
    coros = [worker(f"task-{i}", delay=i * 0.3) for i in range(5)]

    # Обрабатываем каждый результат сразу по готовности, не ждём всех:
    async for coro in asyncio.as_completed(coros):
        result = await coro
        print(f"Готово: {result}")   # выводится по мере завершения

asyncio.run(main())
\`\`\`

---

## Сравнительная таблица

| Критерий | \`gather\` | \`wait\` | \`as_completed\` |
|----------|-----------|---------|----------------|
| Порядок результатов | Гарантирован (по аргументам) | Не гарантирован (set) | По времени завершения |
| При исключении | Пробрасывает / \`return_exceptions\` | Задача в \`done\`, нужно проверить | Пробрасывается |
| Таймаут | ❌ (через \`wait_for\`) | ✅ \`timeout=\` | ✅ \`timeout=\` |
| \`return_when\` | ❌ | ✅ | — |
| Тип аргументов | Корутины / задачи | Только задачи (\`Task\`) | Корутины / задачи |
| Когда использовать | Нужны все результаты по порядку | Нужен гибкий контроль над набором задач | Обработать каждый результат сразу |

### Рекомендации по выбору

\`\`\`python
# gather — типичный выбор для параллельных запросов с фиксированным набором:
users, orders, stats = await asyncio.gather(
    fetch_users(),
    fetch_orders(),
    fetch_stats(),
)

# wait + FIRST_COMPLETED — для гонки (race): берём самый быстрый источник:
tasks = {asyncio.create_task(fetch_from_primary()),
         asyncio.create_task(fetch_from_replica())}
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
result = next(iter(done)).result()
for t in pending: t.cancel()

# as_completed — для прогресс-бара или стриминга результатов пользователю:
async for fut in asyncio.as_completed(download_tasks):
    item = await fut
    await send_to_client(item)
\`\`\``,
  },
  {
    id: "asyncio-event-loop-internals",
    question:
      "Как устроен Event Loop в asyncio под капотом? Какова роль системных вызовов (select, epoll, kqueue) в его работе?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "senior",
    answer: `## Event Loop — центр asyncio

Event Loop (цикл событий) — это бесконечный цикл, который:
1. Держит очередь готовых к выполнению коллбэков.
2. Отслеживает I/O-события через системные вызовы ОС.
3. Управляет таймерами (scheduled callbacks).
4. Запускает корутины по одной за раз (однопоточно).

---

## Архитектура: слои абстракции

\`\`\`
Пользовательский код (async def / await)
           ↓
    asyncio (Python)
    ├── EventLoop.run_forever()    ← основной цикл
    ├── Task / Future              ← управление корутинами
    └── SelectorEventLoop / ProactorEventLoop
           ↓
    selectors (Python stdlib)
    ├── SelectSelector             ← select() — все ОС
    ├── EpollSelector              ← epoll — Linux
    └── KqueueSelector             ← kqueue — macOS/BSD
           ↓
    Системные вызовы ОС (C)
    └── select() / epoll_wait() / kevent()
\`\`\`

---

## Системные вызовы I/O-мультиплексирования

### select() — классический, все ОС

\`\`\`c
/* C: ждёт события на нескольких файловых дескрипторах */
int select(int nfds,
           fd_set *readfds,   /* дескрипторы для чтения */
           fd_set *writefds,  /* дескрипторы для записи */
           fd_set *exceptfds, /* исключения */
           struct timeval *timeout); /* максимальное ожидание */
/* Ограничение: max FD_SETSIZE (1024) дескрипторов */
\`\`\`

### epoll — Linux, масштабируется на тысячи соединений

\`\`\`c
/* Создать epoll-экземпляр */
int epfd = epoll_create1(0);

/* Зарегистрировать дескриптор */
struct epoll_event ev = { .events = EPOLLIN, .data.fd = sockfd };
epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);

/* Ждать событий (аналог select, но O(1) вместо O(n)) */
int n = epoll_wait(epfd, events, MAX_EVENTS, timeout_ms);
\`\`\`

Ключевое преимущество epoll: он возвращает **только готовые** дескрипторы, а не сканирует весь список — отсюда O(1) при тысячах соединений против O(n) у \`select\`.

---

## Итерация Event Loop изнутри

Упрощённая схема одной итерации \`asyncio\`:

\`\`\`python
# Псевдокод одной итерации _run_once() в asyncio/base_events.py:
def _run_once(self):
    # 1. Вычислить timeout для системного вызова:
    #    - 0, если есть готовые коллбэки (не блокируемся)
    #    - время до ближайшего scheduled callback
    #    - None, если нечего ждать кроме I/O
    timeout = self._compute_timeout()

    # 2. Вызвать select/epoll/kqueue — ОС блокирует нас ровно на timeout:
    event_list = self._selector.select(timeout)
    #    Возвращает список (fileobj, events) для готовых дескрипторов

    # 3. Обработать I/O события → поставить коллбэки в очередь:
    self._process_events(event_list)

    # 4. Обработать таймеры, время которых наступило:
    end_time = self.time() + self._clock_resolution
    while self._scheduled:
        handle = self._scheduled[0]
        if handle._when >= end_time:
            break
        heapq.heappop(self._scheduled)
        handle._scheduled = False
        self._ready.append(handle)

    # 5. Выполнить ВСЕ готовые коллбэки из _ready:
    ntodo = len(self._ready)
    for _ in range(ntodo):
        handle = self._ready.popleft()
        handle._run()   # выполняет один шаг корутины до следующего await
\`\`\`

---

## Как корутина взаимодействует с Event Loop

\`\`\`python
import asyncio

async def read_data(host, port):
    # 1. Создаётся TCP-соединение (регистрирует сокет в epoll):
    reader, writer = await asyncio.open_connection(host, port)
    # ↑ yield from Future → корутина приостановлена, управление Event Loop

    # 2. Event Loop вызывает epoll_wait, ОС сигнализирует о готовности данных

    # 3. Event Loop ставит коллбэк "продолжить read_data" в _ready

    # 4. На следующей итерации читаем данные:
    data = await reader.read(1024)
    # ↑ снова приостановка, снова epoll

    writer.close()
    return data

# Трассировка шагов Event Loop:
async def traced_main():
    loop = asyncio.get_event_loop()
    print(f"Итераций до: {loop._ready.__class__.__name__}")

    task = asyncio.create_task(read_data("example.com", 80))
    # Task зарегистрирован, но ещё не запущен

    result = await task
    # Event Loop выполнил множество итераций пока ждал ответ
\`\`\`

---

## Наблюдение за работой Loop

\`\`\`python
import asyncio
import time

# Медленный коллбэк — блокирует весь Loop:
async def monitor_loop():
    loop = asyncio.get_event_loop()

    # Включить отладку — Loop будет логировать медленные коллбэки (>0.1s):
    loop.set_debug(True)

    start = time.monotonic()
    await asyncio.sleep(0)   # одна итерация Loop
    elapsed = time.monotonic() - start
    print(f"Одна итерация Loop: {elapsed*1000:.3f} мс")

async def blocking_mistake():
    # НЕПРАВИЛЬНО: time.sleep блокирует весь Event Loop!
    # Пока sleep работает, epoll_wait не вызывается → все корутины стоят
    import time
    time.sleep(1)   # блокирует Loop на 1 секунду

async def correct_approach():
    # ПРАВИЛЬНО: asyncio.sleep отпускает управление Loop
    await asyncio.sleep(1)

asyncio.run(monitor_loop())
\`\`\`

---

## SelectorEventLoop vs ProactorEventLoop

\`\`\`python
import asyncio
import sys

# Linux/macOS — SelectorEventLoop (epoll/kqueue):
if sys.platform != "win32":
    loop = asyncio.SelectorEventLoop()
    # Использует epoll (Linux) или kqueue (macOS)

# Windows — ProactorEventLoop (IOCP — I/O Completion Ports):
if sys.platform == "win32":
    loop = asyncio.ProactorEventLoop()
    asyncio.set_event_loop(loop)
    # Использует Windows IOCP — асинхронный I/O на уровне ядра

# Посмотреть тип текущего Loop:
loop = asyncio.get_event_loop()
print(type(loop).__name__)   # SelectorEventLoop или ProactorEventLoop
\`\`\`

---

## uvloop — замена стандартного Loop

\`\`\`python
# pip install uvloop
import uvloop
import asyncio

# uvloop реализован на Cython поверх libuv (той же библиотеки, что в Node.js)
# Быстрее стандартного SelectorEventLoop в 2–4 раза для I/O-нагрузки

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

async def main():
    # Код не меняется — только Loop под капотом другой
    await asyncio.sleep(1)

asyncio.run(main())
\`\`\`

---

## Итоговая схема одного цикла

\`\`\`
Event Loop iteration:
┌──────────────────────────────────────────────┐
│  1. Есть готовые коллбэки?                   │
│     YES → timeout = 0 (не блокируемся)       │
│     NO  → timeout = время до таймера / None  │
├──────────────────────────────────────────────┤
│  2. epoll_wait(timeout) ← ОС блокирует нас   │
│     Возвращает готовые сокеты/файлы          │
├──────────────────────────────────────────────┤
│  3. Для каждого готового fd:                 │
│     → поставить коллбэк продолжения в _ready │
├──────────────────────────────────────────────┤
│  4. Таймеры: запустить просроченные          │
├──────────────────────────────────────────────┤
│  5. Выполнить ВСЕ коллбэки из _ready        │
│     (каждый — один шаг корутины до await)    │
└──────────────────────────────────────────────┘
           ↑___________________________________|
\`\`\``,
  },
  {
    id: "asyncio-future-task",
    question:
      "Что такое asyncio.Future и asyncio.Task? Как они связаны между собой и с объектами-корутинами?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "middle",
    answer: `## Три ключевых объекта asyncio

\`\`\`
Корутина (coroutine object)
    └─ запускается в ──→  Task
                              └─ наследует ──→  Future
\`\`\`

---

## Корутина (Coroutine object)

Корутина — это **объект-генератор**, созданный вызовом \`async def\` функции. Сама по себе она **ничего не выполняет** — нужен кто-то, кто будет вызывать \`send()\` или \`throw()\` на ней.

\`\`\`python
import asyncio

async def greet(name):
    await asyncio.sleep(1)
    return f"Привет, {name}!"

# Просто вызов функции — только создаёт корутину, НЕ запускает:
coro = greet("Alice")
print(type(coro))    # <class 'coroutine'>
print(coro)          # <coroutine object greet at 0x...>

# Корутину нужно кому-то передать:
# 1. asyncio.run(coro)          — запустить через новый Event Loop
# 2. await coro                 — внутри другой корутины
# 3. asyncio.create_task(coro)  — запланировать как Task
\`\`\`

---

## asyncio.Future — «обещание результата»

\`Future\` — это объект, представляющий **результат, который будет готов в будущем**. Он похож на \`Promise\` в JavaScript. Event Loop не знает о корутинах напрямую — он работает с \`Future\`.

\`\`\`python
import asyncio

async def demo_future():
    loop = asyncio.get_event_loop()

    # Создать Future вручную:
    fut = loop.create_future()
    print(fut.done())    # False — результата ещё нет

    # Future может быть в трёх состояниях:
    # PENDING   → создана, результата нет
    # FINISHED  → set_result() или set_exception() вызван
    # CANCELLED → cancel() вызван

    # Установить результат (обычно делает I/O коллбэк, не пользователь):
    fut.set_result(42)
    print(fut.done())    # True
    print(fut.result())  # 42

    # Await на Future — приостановить корутину до получения результата:
    value = await fut    # немедленно, результат уже есть
    print(value)         # 42

asyncio.run(demo_future())
\`\`\`

### Future и коллбэки

\`\`\`python
import asyncio

async def main():
    fut = asyncio.get_event_loop().create_future()

    # Добавить коллбэк, который вызовется при завершении Future:
    def on_done(f):
        print(f"Future завершён с результатом: {f.result()}")

    fut.add_done_callback(on_done)

    # Имитируем завершение через таймер:
    asyncio.get_event_loop().call_later(0.1, fut.set_result, "данные")

    result = await fut
    print(f"Получено: {result}")

asyncio.run(main())
\`\`\`

---

## asyncio.Task — «Future + корутина»

\`Task\` — это подкласс \`Future\`, который **автоматически запускает корутину** и устанавливает результат Future при её завершении. Task — основной способ запустить корутину конкурентно.

\`\`\`python
import asyncio

async def slow_computation(x):
    await asyncio.sleep(1)
    return x * x

async def main():
    # create_task: немедленно планирует корутину для выполнения в Loop
    task = asyncio.create_task(slow_computation(5), name="square-5")

    print(f"Task создан: {task}")
    print(f"done: {task.done()}")       # False — ещё выполняется
    print(f"cancelled: {task.cancelled()}")  # False

    # Корутина main приостанавливается, Loop запускает task:
    result = await task

    print(f"result: {result}")          # 25
    print(f"done: {task.done()}")       # True
    print(f"Task.result(): {task.result()}")  # 25

asyncio.run(main())
\`\`\`

### Как Task запускает корутину

\`\`\`python
# Упрощённая реализация Task.__init__:
class Task(Future):
    def __init__(self, coro, loop):
        super().__init__(loop=loop)
        self._coro = coro
        # Планируем первый шаг немедленно:
        loop.call_soon(self.__step)

    def __step(self):
        try:
            # Один шаг корутины: от начала (или от последнего await) до следующего await
            result = self._coro.send(None)
            # result — это Future, на который корутина "ждёт"
            # Добавляем коллбэк: когда тот Future готов → продолжить нас
            result.add_done_callback(self.__wakeup)
        except StopIteration as e:
            # Корутина завершилась — устанавливаем результат нашего Future:
            self.set_result(e.value)

    def __wakeup(self, future):
        # Внутренний Future готов → планируем следующий шаг:
        self._loop.call_soon(self.__step)
\`\`\`

---

## Отмена задач (cancellation)

\`\`\`python
import asyncio

async def long_task():
    try:
        print("Начали долгую задачу")
        await asyncio.sleep(10)
        return "готово"
    except asyncio.CancelledError:
        print("Задача отменена! Чистим ресурсы...")
        # Важно: не подавлять CancelledError, пробрасываем дальше:
        raise
    finally:
        print("Финализация (always runs)")

async def main():
    task = asyncio.create_task(long_task())

    # Ждём 0.5 секунды, потом отменяем:
    await asyncio.sleep(0.5)
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print(f"Подтверждено: task отменён = {task.cancelled()}")

asyncio.run(main())
\`\`\`

---

## TaskGroup (Python 3.11+) — структурная конкурентность

\`\`\`python
import asyncio

async def fetch(url):
    await asyncio.sleep(0.5)
    return f"data from {url}"

async def main():
    # TaskGroup — более безопасная альтернатива gather:
    # при исключении в любой задаче — все остальные отменяются автоматически
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch("url1"))
        task2 = tg.create_task(fetch("url2"))
        task3 = tg.create_task(fetch("url3"))
    # После выхода из блока все задачи гарантированно завершены

    print(task1.result())  # "data from url1"
    print(task2.result())  # "data from url2"

asyncio.run(main())
\`\`\`

---

## Сводная таблица

| | Coroutine | Future | Task |
|--|-----------|--------|------|
| Запускается автоматически | ❌ | ❌ | ✅ (при \`create_task\`) |
| Хранит результат | ❌ | ✅ | ✅ |
| Можно \`await\` | ✅ | ✅ | ✅ |
| Поддерживает \`cancel()\` | ❌ | ✅ | ✅ |
| add_done_callback | ❌ | ✅ | ✅ |
| Выполняется в Event Loop | Только через Task | Нет (пассивна) | ✅ |`,
  },
  {
    id: "asyncio-sync-in-async",
    question:
      "Как интегрировать синхронный блокирующий код в асинхронное приложение без блокировки общего Event Loop?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "middle",
    answer: `## Проблема: блокировка Event Loop

Event Loop — однопоточный. Любой синхронный вызов, который занимает время (запрос к БД через синхронный драйвер, \`time.sleep\`, тяжёлые вычисления) **останавливает все корутины**:

\`\`\`python
import asyncio
import time

async def fast_task(name):
    print(f"{name}: старт")
    await asyncio.sleep(0.1)
    print(f"{name}: финиш")

async def bad_blocking():
    print("blocking: старт")
    time.sleep(2)   # БЛОКИРУЕТ ВЕСЬ EVENT LOOP!
    print("blocking: финиш")

async def main():
    await asyncio.gather(
        fast_task("A"),
        fast_task("B"),
        bad_blocking(),   # из-за этого A и B ждут 2 секунды
    )
    # A и B не могут работать пока bad_blocking спит

asyncio.run(main())
\`\`\`

---

## Решение 1: run_in_executor (поток / процесс)

\`loop.run_in_executor\` запускает функцию в пуле потоков или процессов и возвращает \`Future\`. Event Loop не блокируется — он ждёт через обычный механизм I/O.

\`\`\`python
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def sync_db_query(query):
    """Синхронная блокирующая функция (например, psycopg2, requests)"""
    time.sleep(1)   # имитация долгого запроса
    return f"результат: {query}"

async def main():
    loop = asyncio.get_event_loop()

    # Запуск в пуле потоков (по умолчанию):
    result = await loop.run_in_executor(None, sync_db_query, "SELECT * FROM users")
    print(result)

    # Явный пул потоков с ограничением:
    with ThreadPoolExecutor(max_workers=5) as executor:
        result = await loop.run_in_executor(executor, sync_db_query, "SELECT 1")
        print(result)

    # Параллельный запуск нескольких блокирующих вызовов:
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = await asyncio.gather(*[
            loop.run_in_executor(executor, sync_db_query, f"query-{i}")
            for i in range(5)
        ])
    print(results)

asyncio.run(main())
\`\`\`

### Современный синтаксис: asyncio.to_thread (Python 3.9+)

\`\`\`python
import asyncio

def blocking_io(filename):
    with open(filename, "r") as f:
        return f.read()

async def main():
    # to_thread — обёртка над run_in_executor для потоков:
    content = await asyncio.to_thread(blocking_io, "/etc/hosts")
    print(content[:100])

asyncio.run(main())
\`\`\`

---

## Решение 2: ProcessPoolExecutor для CPU-bound

Потоки в CPython всё ещё ограничены GIL — для CPU-нагрузки нужны процессы:

\`\`\`python
import asyncio
from concurrent.futures import ProcessPoolExecutor

def heavy_computation(n):
    """CPU-intensive: GIL мешает потокам, нужны процессы"""
    return sum(i * i for i in range(n))

async def main():
    loop = asyncio.get_event_loop()

    # ProcessPoolExecutor: каждый воркер — отдельный процесс со своим GIL
    with ProcessPoolExecutor(max_workers=4) as executor:
        tasks = [
            loop.run_in_executor(executor, heavy_computation, 10_000_000)
            for _ in range(4)
        ]
        results = await asyncio.gather(*tasks)
    print(f"Сумм: {results}")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

---

## Решение 3: отдельный поток с собственным Event Loop

Когда синхронный код нужно запустить в длительном фоновом режиме:

\`\`\`python
import asyncio
import threading

def run_sync_service():
    """Долгоживущий синхронный сервис в отдельном потоке"""
    import time
    while True:
        # ... синхронная работа ...
        time.sleep(0.1)

async def main():
    # Запускаем синхронный сервис в daemon-потоке:
    t = threading.Thread(target=run_sync_service, daemon=True)
    t.start()

    # Основной поток — чисто асинхронный:
    await asyncio.sleep(5)
    print("Готово")

asyncio.run(main())
\`\`\`

---

## Решение 4: обёртка синхронного API в асинхронный

\`\`\`python
import asyncio
from functools import wraps, partial

def make_async(func):
    """Декоратор: превращает синхронную функцию в async через to_thread"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)
    return wrapper

# Применение:
import requests   # синхронная библиотека

@make_async
def fetch_url(url):
    return requests.get(url).text

async def main():
    # Теперь fetch_url можно await-ить:
    html = await fetch_url("https://example.com")
    print(html[:200])

    # Параллельно:
    results = await asyncio.gather(
        fetch_url("https://example.com"),
        fetch_url("https://httpbin.org/get"),
    )

asyncio.run(main())
\`\`\`

---

## Решение 5: медленный блок кода — разбить на чанки

Если вычисление нельзя вынести в поток (например, изменяет Python-объекты), можно добавить точки отдачи управления:

\`\`\`python
import asyncio

async def process_large_list(items):
    results = []
    for i, item in enumerate(items):
        results.append(item * 2)   # синхронная обработка
        # Каждые 1000 элементов отдаём управление Loop:
        if i % 1000 == 0:
            await asyncio.sleep(0)   # sleep(0) = одна итерация Loop
    return results

async def main():
    data = list(range(1_000_000))

    task1 = asyncio.create_task(process_large_list(data))
    task2 = asyncio.create_task(some_other_work())   # не будет заморожена

    results, _ = await asyncio.gather(task1, task2)

async def some_other_work():
    for i in range(10):
        await asyncio.sleep(0.1)
        print(f"other_work: шаг {i}")

asyncio.run(main())
\`\`\`

---

## Выбор стратегии

| Тип задачи | Решение | Причина |
|-----------|---------|---------|
| I/O: синхронный HTTP, файлы | \`asyncio.to_thread\` | Освобождает GIL во время I/O |
| I/O: синхронная БД (psycopg2) | \`run_in_executor(ThreadPoolExecutor)\` | То же |
| CPU: тяжёлые вычисления | \`run_in_executor(ProcessPoolExecutor)\` | Обходит GIL через процессы |
| CPU: работа с Python объектами | \`await asyncio.sleep(0)\` чанками | Делит работу между итерациями Loop |
| Долгий фоновый сервис | \`threading.Thread(daemon=True)\` | Полная изоляция |`,
  },
  {
    id: "asyncio-contextvars",
    question:
      "Что такое contextvars (контекстные переменные) и почему обычный threading.local не работает корректно в асинхронном коде?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "middle",
    answer: `## Проблема: threading.local в async-коде

\`threading.local\` хранит данные, специфичные для потока. Но в asyncio **все корутины работают в одном потоке** — значит, все они разделяют одно и то же \`threading.local\` хранилище:

\`\`\`python
import asyncio
import threading

# Хранилище "на поток":
local = threading.local()

async def handle_request(request_id):
    local.request_id = request_id   # устанавливаем "наш" ID
    await asyncio.sleep(0.1)        # отдаём управление
    # К этому моменту другая корутина ПЕРЕЗАПИСАЛА local.request_id!
    print(f"Обрабатываю: {local.request_id}")   # ЧУЖОЙ request_id!

async def main():
    await asyncio.gather(
        handle_request(1),
        handle_request(2),
        handle_request(3),
    )
    # Выведет одно и то же число 3 раза — последнее записанное значение!

asyncio.run(main())
\`\`\`

---

## Решение: contextvars (PEP 567, Python 3.7+)

\`ContextVar\` — переменная, значение которой хранится **отдельно для каждого контекста выполнения**. Каждая \`Task\` в asyncio автоматически получает **копию контекста** при создании.

\`\`\`python
import asyncio
from contextvars import ContextVar

# Объявляем контекстную переменную (глобально):
request_id: ContextVar[int] = ContextVar("request_id", default=0)

async def handle_request(rid):
    # Устанавливаем значение В ТЕКУЩЕМ КОНТЕКСТЕ (только для этой Task):
    token = request_id.set(rid)

    await asyncio.sleep(0.1)   # переключение корутин — контекст не теряется

    # Читаем — всегда получаем СВОЁ значение:
    print(f"Task {rid}: request_id = {request_id.get()}")

    # Можно восстановить предыдущее значение через token:
    request_id.reset(token)

async def main():
    await asyncio.gather(
        handle_request(1),
        handle_request(2),
        handle_request(3),
    )
    # Task 1: request_id = 1
    # Task 2: request_id = 2
    # Task 3: request_id = 3  — корректно!

asyncio.run(main())
\`\`\`

---

## Как Context копируется при создании Task

Каждая \`Task\` создаётся с **копией** текущего контекста через \`copy_context()\`. Изменения в Task **не видны** родительскому контексту и другим Task:

\`\`\`python
import asyncio
from contextvars import ContextVar, copy_context

user: ContextVar[str] = ContextVar("user", default="anonymous")

async def child_task():
    # Видим значение, установленное до create_task:
    print(f"child видит: {user.get()}")
    user.set("child_user")
    print(f"child установил: {user.get()}")
    await asyncio.sleep(0.1)

async def main():
    user.set("parent_user")
    print(f"parent до: {user.get()}")

    task = asyncio.create_task(child_task())
    await task

    # Изменение в child НЕ видно в parent:
    print(f"parent после: {user.get()}")   # parent_user — не изменился!

asyncio.run(main())
# parent до:    parent_user
# child видит:  parent_user  (копия от момента create_task)
# child установил: child_user
# parent после: parent_user  (изолирован)
\`\`\`

---

## Практическое применение

### 1. Request ID для логирования (как в middleware FastAPI/Starlette)

\`\`\`python
import asyncio
import uuid
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="")

def get_logger():
    """Логгер, который автоматически добавляет request_id"""
    rid = request_id.get()
    prefix = f"[{rid}] " if rid else ""
    return lambda msg: print(f"{prefix}{msg}")

async def handle_request(name):
    # Устанавливаем уникальный ID для этого запроса:
    token = request_id.set(str(uuid.uuid4())[:8])
    log = get_logger()

    log(f"Начало запроса от {name}")
    await asyncio.sleep(0.1)   # имитация работы
    log("Запрос к БД")
    await asyncio.sleep(0.05)
    log("Отправка ответа")

    request_id.reset(token)

async def main():
    await asyncio.gather(
        handle_request("Alice"),
        handle_request("Bob"),
        handle_request("Charlie"),
    )
    # [a1b2c3d4] Начало запроса от Alice
    # [e5f6g7h8] Начало запроса от Bob
    # ...каждый запрос имеет свой ID в логах!

asyncio.run(main())
\`\`\`

### 2. Транзакции базы данных (контекст соединения)

\`\`\`python
from contextvars import ContextVar
import asyncio

db_connection: ContextVar = ContextVar("db_connection", default=None)

async def get_db():
    conn = db_connection.get()
    if conn is None:
        raise RuntimeError("Нет активного соединения с БД")
    return conn

class FakeConn:
    def __init__(self, name): self.name = name

async def with_transaction(coro):
    """Устанавливает соединение в контексте текущей Task"""
    conn = FakeConn(f"conn-{id(asyncio.current_task())}")
    token = db_connection.set(conn)
    try:
        return await coro
    finally:
        db_connection.reset(token)

async def repository_method():
    conn = await get_db()
    print(f"Использую: {conn.name}")
    await asyncio.sleep(0.1)

async def handle_user_request():
    async def work():
        await repository_method()
        await repository_method()   # тот же conn в рамках запроса

    await with_transaction(work())

asyncio.run(asyncio.gather(
    handle_user_request(),
    handle_user_request(),
))
\`\`\`

---

## copy_context() — явное управление контекстом

\`\`\`python
from contextvars import ContextVar, copy_context

theme: ContextVar[str] = ContextVar("theme", default="light")

def sync_function():
    """Синхронная функция, которая тоже читает контекстную переменную"""
    print(f"sync видит theme: {theme.get()}")

async def main():
    theme.set("dark")

    # copy_context() — явная копия текущего контекста:
    ctx = copy_context()

    # Запустить синхронную функцию с конкретным контекстом:
    ctx.run(sync_function)   # выведет "dark"

    # Используется в asyncio.to_thread внутренне:
    # каждый поток получает копию контекста из момента вызова
    import asyncio
    await asyncio.to_thread(sync_function)  # тоже выведет "dark"

asyncio.run(main())
\`\`\`

---

## Сравнение: threading.local vs ContextVar

| Аспект | \`threading.local\` | \`ContextVar\` |
|--------|---------------------|---------------|
| Изоляция по потоку | ✅ | ✅ |
| Изоляция по Task (asyncio) | ❌ (все в одном потоке) | ✅ |
| Копирование при create_task | ❌ | ✅ (автоматически) |
| Работа в синхронном коде | ✅ | ✅ |
| Работа в asyncio | ❌ (опасно!) | ✅ |
| Восстановление через токен | ❌ | ✅ (\`reset(token)\`) |
| Поддержка в \`to_thread\` | ✅ (в потоке) | ✅ (копия контекста) |`,
  },
  {
    id: "asyncio-cooperative-vs-preemptive",
    question:
      "Как устроена кооперативная многозадачность в Python и чем она отличается от вытесняющей многозадачности потоков операционной системы?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "middle",
    answer: `## Два подхода к многозадачности

| | Кооперативная | Вытесняющая |
|--|---------------|-------------|
| Кто управляет переключением | Сама задача (через \`await\`) | Планировщик ОС |
| Когда переключается | Явная точка — \`await\` | В любой момент (каждые N мс) |
| Гарантия атомарности | Код между \`await\` — атомарен | Нет гарантий |
| Overhead переключения | Минимальный (в userspace) | Высокий (syscall, context switch) |
| Параллелизм | Конкурентность (не параллелизм) | Параллелизм (на нескольких ядрах) |

---

## Кооперативная многозадачность в asyncio

Корутина **сама** сообщает Event Loop: «я готова подождать — возьми управление и запусти кого-то другого». Это происходит только в точках \`await\`:

\`\`\`python
import asyncio

async def task_a():
    print("A: шаг 1")
    await asyncio.sleep(0)   # ← явная точка передачи управления
    print("A: шаг 2")
    await asyncio.sleep(0)
    print("A: шаг 3")

async def task_b():
    print("B: шаг 1")
    await asyncio.sleep(0)
    print("B: шаг 2")
    await asyncio.sleep(0)
    print("B: шаг 3")

async def main():
    await asyncio.gather(task_a(), task_b())

asyncio.run(main())
# A: шаг 1   ← A запускается, доходит до await, передаёт управление
# B: шаг 1   ← B запускается, доходит до await, передаёт управление
# A: шаг 2   ← снова A
# B: шаг 2
# A: шаг 3
# B: шаг 3
\`\`\`

Порядок **детерминирован**: нет случайных переключений в середине вычисления.

---

## Вытесняющая многозадачность: потоки ОС

Планировщик ОС прерывает поток в **произвольный момент** (каждые ~1-15 мс на Linux/Windows), сохраняет его состояние (регистры CPU, стек) и переключается на другой поток:

\`\`\`python
import threading

counter = 0

def increment():
    global counter
    for _ in range(1_000_000):
        # ОС может прервать поток ЗДЕСЬ, после чтения counter, но до записи:
        temp = counter      # ← поток прерван!
        temp = temp + 1     # ← другой поток тоже читает старое значение
        counter = temp      # ← оба пишут одно и то же → потеря инкремента

t1 = threading.Thread(target=increment)
t2 = threading.Thread(target=increment)
t1.start(); t2.start()
t1.join(); t2.join()

print(counter)   # НЕ 2_000_000! Например: 1_837_211
# В Python это смягчается GIL, но суть та же
\`\`\`

---

## Ключевое свойство кооперативности: атомарность блоков

Код между двумя \`await\` выполняется **без прерываний** — никакая другая корутина не получит управление:

\`\`\`python
import asyncio

balance = 1000

async def withdraw(amount, name):
    # Проверка + снятие — атомарный блок (нет await внутри):
    if balance >= amount:           # нет переключения между этими строками!
        # await asyncio.sleep(0)   ← если бы это было здесь — Race Condition!
        global balance
        balance -= amount
        print(f"{name}: снял {amount}, остаток {balance}")
    else:
        print(f"{name}: недостаточно средств")

async def main():
    await asyncio.gather(
        withdraw(700, "Alice"),
        withdraw(700, "Bob"),
    )
    # Alice: снял 700, остаток 300
    # Bob: недостаточно средств
    # Корректно! Блок без await — атомарен.

asyncio.run(main())
\`\`\`

---

## Стоимость переключения контекста

\`\`\`python
import asyncio, threading, time

# Потоки: переключение через ОС — дорого
def measure_threads(n):
    barrier = threading.Barrier(2)
    results = []

    def worker():
        for _ in range(n):
            barrier.wait()   # синхронизация = syscall + context switch

    t1 = threading.Thread(target=worker)
    t2 = threading.Thread(target=worker)
    start = time.perf_counter()
    t1.start(); t2.start()
    t1.join(); t2.join()
    return time.perf_counter() - start

# Корутины: переключение в userspace — дёшево
async def measure_coros(n):
    async def worker():
        for _ in range(n):
            await asyncio.sleep(0)   # передача управления без syscall

    start = time.perf_counter()
    await asyncio.gather(worker(), worker())
    return time.perf_counter() - start

N = 100_000
print(f"Потоки:    {measure_threads(N):.3f}s")
print(f"Корутины:  {asyncio.run(measure_coros(N)):.3f}s")
# Корутины обычно в 5–20x быстрее на переключениях
\`\`\`

---

## Когда что использовать

\`\`\`python
# asyncio (кооперативная) — для I/O-bound с тысячами соединений:
async def handle_1000_connections():
    tasks = [fetch_data(url) for url in urls]
    return await asyncio.gather(*tasks)
# 1000 корутин — легко, ~1 поток ОС

# threading (вытесняющая) — для параллелизма с блокирующими C-библиотеками:
import concurrent.futures
def run_parallel_io():
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        return list(pool.map(blocking_request, urls))
# 10 потоков ОС — GIL отпускается в C-коде

# multiprocessing — для CPU-bound с реальным параллелизмом:
from multiprocessing import Pool
def run_parallel_cpu():
    with Pool(4) as p:
        return p.map(heavy_compute, data)
# 4 процесса — реальные 4 ядра CPU
\`\`\``,
  },
  {
    id: "asyncio-multiprocessing-integration",
    question:
      "Какие проблемы могут возникнуть при совместном использовании модуля multiprocessing и стандартного asyncio? Как их решать?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "senior",
    answer: `## Основные проблемы интеграции

Прямое смешение \`multiprocessing\` и \`asyncio\` ломается по нескольким причинам: Event Loop не переносится через fork, блокирующие вызовы замораживают Loop, а IPC-примитивы (Queue, Pipe) из \`multiprocessing\` несовместимы с asyncio.

---

## Проблема 1: fork и Event Loop

\`\`\`python
import asyncio
import multiprocessing

async def main():
    # ОПАСНО: создание Process внутри работающего Event Loop
    # При fork() дочерний процесс наследует состояние Loop,
    # включая открытые сокеты, файловые дескрипторы и незавершённые задачи
    p = multiprocessing.Process(target=worker)
    p.start()   # fork() здесь — копирует весь Loop!
    p.join()    # БЛОКИРУЕТ Event Loop — все корутины заморожены!

def worker():
    # В дочернем процессе может быть "мусорный" Event Loop от родителя
    # Это приводит к непредсказуемым ошибкам
    asyncio.run(child_work())   # ← может упасть

async def child_work():
    pass
\`\`\`

---

## Решение 1: run_in_executor с ProcessPoolExecutor

Самый безопасный путь — использовать \`loop.run_in_executor\` с пулом процессов. Пул создаётся **до** запуска Event Loop:

\`\`\`python
import asyncio
from concurrent.futures import ProcessPoolExecutor

def cpu_heavy(n):
    """Функция для выполнения в отдельном процессе"""
    return sum(i * i for i in range(n))

async def main():
    loop = asyncio.get_running_loop()

    # ProcessPoolExecutor управляет пулом процессов асинхронно:
    with ProcessPoolExecutor(max_workers=4) as pool:
        # run_in_executor: не блокирует Loop, возвращает awaitable Future
        results = await asyncio.gather(
            loop.run_in_executor(pool, cpu_heavy, 10_000_000),
            loop.run_in_executor(pool, cpu_heavy, 20_000_000),
            loop.run_in_executor(pool, cpu_heavy, 15_000_000),
        )
    print(results)

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

---

## Проблема 2: блокирующий Process.join()

\`\`\`python
import asyncio, multiprocessing, time

def slow_worker():
    time.sleep(3)

async def bad_approach():
    p = multiprocessing.Process(target=slow_worker)
    p.start()
    p.join()   # БЛОКИРУЕТ Loop на 3 секунды — другие корутины не работают!
    print("Готово")

# Решение: ждать завершение процесса через to_thread или поллинг:
async def good_approach():
    p = multiprocessing.Process(target=slow_worker)
    p.start()

    # Вариант А: ждать через поток (не блокирует Loop):
    await asyncio.to_thread(p.join)

    # Вариант Б: периодический поллинг:
    while p.is_alive():
        await asyncio.sleep(0.1)   # Loop свободен между проверками
    p.join(timeout=0)

    print("Процесс завершён")

asyncio.run(good_approach())
\`\`\`

---

## Проблема 3: multiprocessing.Queue — несовместима с asyncio

\`multiprocessing.Queue\` использует блокирующие \`put()\` и \`get()\`. Их вызов в корутине заморозит Loop:

\`\`\`python
import asyncio
import multiprocessing

# НЕПРАВИЛЬНО:
async def bad_consumer(queue):
    item = queue.get()   # БЛОКИРУЕТ Loop!
    print(item)

# ПРАВИЛЬНО — вариант А: перенести в поток:
async def good_consumer_thread(queue):
    item = await asyncio.to_thread(queue.get)
    print(item)

# ПРАВИЛЬНО — вариант Б: asyncio.Queue для передачи между корутинами,
# multiprocessing.Queue только для межпроцессного IPC:
async def bridge_queues(mp_queue: multiprocessing.Queue,
                        async_queue: asyncio.Queue):
    """Мост: читает из mp_queue (в потоке), пишет в asyncio.Queue"""
    while True:
        item = await asyncio.to_thread(mp_queue.get)
        if item is None:   # sentinel — сигнал завершения
            break
        await async_queue.put(item)

async def main():
    mp_queue = multiprocessing.Queue()
    async_queue: asyncio.Queue = asyncio.Queue()

    # Запускаем мост в фоне:
    bridge = asyncio.create_task(bridge_queues(mp_queue, async_queue))

    # Процесс-производитель пишет в mp_queue:
    def producer():
        for i in range(5):
            mp_queue.put(f"item-{i}")
        mp_queue.put(None)  # sentinel

    p = multiprocessing.Process(target=producer)
    p.start()

    # Асинхронный потребитель читает из asyncio.Queue:
    for _ in range(5):
        item = await async_queue.get()
        print(f"Получено: {item}")

    await bridge
    await asyncio.to_thread(p.join)

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

---

## Проблема 4: fork и открытые соединения (БД, сокеты)

\`\`\`python
import asyncio
import multiprocessing
import aiohttp   # пример: HTTP-клиент

# ОПАСНО: fork наследует открытые соединения,
# два процесса используют один сокет → коррупция данных

# ПРАВИЛЬНО: использовать spawn вместо fork (не копирует файловые дескрипторы)
if __name__ == "__main__":
    multiprocessing.set_start_method("spawn")  # безопасно для asyncio
    # или "forkserver" — ещё один процесс для fork-ов

    asyncio.run(main())
\`\`\`

---

## Полный паттерн: asyncio + ProcessPool для CPU-bound

\`\`\`python
import asyncio
from concurrent.futures import ProcessPoolExecutor
import os

def worker_init():
    """Инициализация воркера (вызывается один раз при создании процесса)"""
    print(f"Воркер PID {os.getpid()} запущен")

def process_chunk(chunk):
    """CPU-bound работа (выполняется в пуле процессов)"""
    return [x ** 2 for x in chunk]

async def main():
    data = list(range(100_000))
    chunk_size = len(data) // 4
    chunks = [data[i:i + chunk_size] for i in range(0, len(data), chunk_size)]

    loop = asyncio.get_running_loop()

    # initializer вызывается один раз для каждого процесса пула:
    with ProcessPoolExecutor(
        max_workers=4,
        initializer=worker_init
    ) as pool:
        results = await asyncio.gather(*[
            loop.run_in_executor(pool, process_chunk, chunk)
            for chunk in chunks
        ])

    flat = [x for sublist in results for x in sublist]
    print(f"Обработано {len(flat)} элементов")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

---

## Сводка проблем и решений

| Проблема | Причина | Решение |
|----------|---------|---------|
| \`p.join()\` блокирует Loop | Блокирующий syscall | \`asyncio.to_thread(p.join)\` |
| \`Queue.get()\` блокирует Loop | Блокирующая очередь | \`to_thread\` + bridge к \`asyncio.Queue\` |
| fork копирует Event Loop | Унаследованные fd/сокеты | \`start_method="spawn"\` |
| Создание Process внутри Loop | Нет синхронизации с Loop | \`ProcessPoolExecutor\` через \`run_in_executor\` |
| Разные asyncio loops в процессах | Каждый процесс — свой Loop | Изолировать: один процесс — один Loop |`,
  },
  {
    id: "asyncio-race-conditions",
    question:
      "Что такое состояние гонки (Race Condition) в контексте асинхронного программирования, если GIL, казалось бы, гарантирует атомарность инструкций байт-кода?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "senior",
    answer: `## Почему Race Condition возможен в asyncio без многопоточности

GIL защищает от гонок **внутри одной байткод-инструкции** (например, инкремент \`ob_refcnt\`). Но Race Condition в asyncio — это гонка **на уровне бизнес-логики**: между двумя \`await\` другая корутина успевает изменить разделяемое состояние.

\`\`\`
Корутина A:        Корутина B:
  читает balance=1000         ← нет await → атомарно
  await (отдаёт управление) ──→ читает balance=1000
                                  вычитает 700 → balance=300
                                  await ...
  ← получает управление
  проверяет: 1000 >= 700 → TRUE (но balance уже 300!)
  вычитает 700 → balance=-400  ← гонка!
\`\`\`

---

## Демонстрация Race Condition в asyncio

\`\`\`python
import asyncio

balance = 1000

async def withdraw(amount, name):
    global balance

    # ↓ Между этими двумя строками — потенциальная точка гонки,
    #   если добавить await:
    current = balance                     # читаем
    await asyncio.sleep(0)               # ← ПЕРЕКЛЮЧЕНИЕ! Другая корутина меняет balance
    if current >= amount:
        balance = current - amount        # пишем УСТАРЕВШЕЕ значение
        print(f"{name}: снял {amount}, остаток {balance}")
    else:
        print(f"{name}: отказано (остаток {current})")

async def main():
    await asyncio.gather(
        withdraw(700, "Alice"),
        withdraw(700, "Bob"),
    )
    print(f"Итоговый баланс: {balance}")

asyncio.run(main())
# Alice: снял 700, остаток 300
# Bob:   снял 700, остаток -400   ← гонка! Ушли в минус
# Итоговый баланс: -400
\`\`\`

---

## Ещё один классический паттерн: check-then-act

\`\`\`python
import asyncio

cache = {}

async def get_or_compute(key):
    # "Двойная проверка" — не работает без блокировки:
    if key not in cache:             # проверка
        await asyncio.sleep(0.1)     # ← переключение! Другой вычислит тоже
        result = expensive_compute(key)   # вычисление (дублируется!)
        cache[key] = result          # запись
    return cache[key]

def expensive_compute(key):
    print(f"Вычисляю {key}...")   # выполнится дважды при гонке!
    return key * 100

async def main():
    results = await asyncio.gather(
        get_or_compute("x"),
        get_or_compute("x"),   # та же ключ → гонка
    )
    print(results)

asyncio.run(main())
# Вычисляю x...
# Вычисляю x...   ← дублирование из-за гонки
\`\`\`

---

## Решение 1: убрать await из критической секции

Самый простой способ — не допускать \`await\` внутри операции check-then-act:

\`\`\`python
import asyncio

balance = 1000

async def withdraw_safe(amount, name):
    global balance
    # Проверка и изменение — без await между ними → атомарно для asyncio:
    if balance >= amount:
        balance -= amount   # нет await → никто не вклинится
        print(f"{name}: снял {amount}, остаток {balance}")
        return True
    print(f"{name}: отказано")
    return False

async def main():
    results = await asyncio.gather(
        withdraw_safe(700, "Alice"),
        withdraw_safe(700, "Bob"),
    )
    print(f"Баланс: {balance}")   # 300 — корректно

asyncio.run(main())
\`\`\`

---

## Решение 2: asyncio.Lock — мьютекс для корутин

Когда критическая секция **должна** содержать await (например, обращение к БД), используем \`asyncio.Lock\`:

\`\`\`python
import asyncio

balance = 1000
lock = asyncio.Lock()

async def withdraw_locked(amount, name):
    global balance
    async with lock:                          # только одна корутина входит
        current = balance
        await asyncio.sleep(0.01)            # имитация запроса к БД
        if current >= amount:
            balance = current - amount
            print(f"{name}: снял {amount}, остаток {balance}")
        else:
            print(f"{name}: отказано")
    # lock освобождается здесь → следующая корутина получает управление

async def main():
    await asyncio.gather(
        withdraw_locked(700, "Alice"),
        withdraw_locked(700, "Bob"),
    )
    print(f"Баланс: {balance}")

asyncio.run(main())
# Alice: снял 700, остаток 300
# Bob:   отказано
# Баланс: 300  — корректно!
\`\`\`

---

## Решение 3: паттерн «единый владелец состояния»

Выделить одну корутину/Task, которая **единолично** управляет состоянием:

\`\`\`python
import asyncio

async def balance_manager(request_queue: asyncio.Queue):
    """Единственная корутина, которая читает и пишет balance"""
    balance = 1000
    while True:
        request = await request_queue.get()
        if request is None:
            break
        amount, name, reply = request
        if balance >= amount:
            balance -= amount
            reply.set_result((True, balance))
        else:
            reply.set_result((False, balance))

async def withdraw_via_manager(queue, amount, name):
    reply = asyncio.get_event_loop().create_future()
    await queue.put((amount, name, reply))
    success, bal = await reply
    if success:
        print(f"{name}: снял {amount}, остаток {bal}")
    else:
        print(f"{name}: отказано, остаток {bal}")

async def main():
    queue: asyncio.Queue = asyncio.Queue()
    manager = asyncio.create_task(balance_manager(queue))

    await asyncio.gather(
        withdraw_via_manager(queue, 700, "Alice"),
        withdraw_via_manager(queue, 700, "Bob"),
    )
    await queue.put(None)
    await manager

asyncio.run(main())
\`\`\`

---

## Тонкость: GIL и threading Race Condition

\`\`\`python
import threading

counter = 0

def increment():
    global counter
    for _ in range(100_000):
        counter += 1   # NOT atomic in threads!
        # counter += 1 компилируется в:
        # LOAD_GLOBAL counter     ← поток может быть прерван здесь
        # LOAD_CONST  1
        # INPLACE_ADD             ← или здесь
        # STORE_GLOBAL counter    ← или здесь
        # GIL переключается между инструкциями, не внутри одной

t1 = threading.Thread(target=increment)
t2 = threading.Thread(target=increment)
t1.start(); t2.start()
t1.join(); t2.join()
print(counter)   # < 200_000 — потери из-за гонки
\`\`\`

---

## Сравнение: где и почему возникает гонка

| Модель | Атомарная единица | Точка гонки |
|--------|-------------------|-------------|
| asyncio | Блок между \`await\` | Между двумя \`await\` |
| threading (Python) | Одна байткод-инструкция | Между инструкциями (GIL переключается) |
| multiprocessing | Весь процесс изолирован | Только при явном IPC (Queue, Pipe) |`,
  },
  {
    id: "asyncio-sync-primitives",
    question:
      "Как работают механизмы синхронизации (Lock, Semaphore, Event) в модуле asyncio и когда они действительно необходимы?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "middle",
    answer: `## Зачем синхронизация в однопоточном asyncio?

Несмотря на однопоточность, несколько корутин могут конкурировать за ресурс — переключение происходит в точках \`await\`. Примитивы синхронизации asyncio решают те же проблемы, что и threading-примитивы, но работают без блокировки потока ОС.

---

## asyncio.Lock — взаимное исключение

\`Lock\` гарантирует, что критическую секцию одновременно выполняет **только одна корутина**. Остальные ждут в очереди без блокировки потока.

\`\`\`python
import asyncio

class Database:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._data = {}

    async def update(self, key, value):
        async with self._lock:          # acquire — если занят, корутина уходит в ожидание
            old = self._data.get(key)
            await asyncio.sleep(0.01)   # имитация запроса к БД (содержит await!)
            self._data[key] = value
            print(f"  {key}: {old} → {value}")
        # lock.release() автоматически при выходе из with

async def main():
    db = Database()
    await asyncio.gather(
        db.update("balance", 500),
        db.update("balance", 700),
        db.update("balance", 300),
    )
    # Обновления идут строго по очереди, не параллельно

asyncio.run(main())
\`\`\`

### Lock.locked() и try_acquire

\`\`\`python
import asyncio

lock = asyncio.Lock()

async def demo():
    print(f"Заблокирован: {lock.locked()}")   # False

    async with lock:
        print(f"Заблокирован: {lock.locked()}")   # True

        # Попытка захватить без ожидания (non-blocking):
        acquired = lock.locked()   # True → уже занят
        # В asyncio нет try_acquire, но можно через wait_for:
        try:
            await asyncio.wait_for(lock.acquire(), timeout=0.001)
        except asyncio.TimeoutError:
            print("Не удалось захватить Lock — занят")

asyncio.run(demo())
\`\`\`

---

## asyncio.Semaphore — ограничение параллельности

\`Semaphore\` позволяет одновременно работать **не более N** корутинам. Идеален для ограничения нагрузки на внешние API, пулов соединений.

\`\`\`python
import asyncio

async def fetch_url(session_id, url, semaphore):
    async with semaphore:   # пройдут максимум 3 одновременно
        print(f"  [{session_id}] Начало запроса: {url}")
        await asyncio.sleep(1)   # имитация HTTP запроса
        print(f"  [{session_id}] Завершён: {url}")
        return f"data from {url}"

async def main():
    # Не более 3 одновременных запросов (rate limiting):
    sem = asyncio.Semaphore(3)

    urls = [f"https://api.example.com/item/{i}" for i in range(10)]
    tasks = [
        asyncio.create_task(fetch_url(i, url, sem))
        for i, url in enumerate(urls)
    ]
    results = await asyncio.gather(*tasks)
    print(f"Получено: {len(results)} результатов")

asyncio.run(main())
# Первые 3 начнут сразу, остальные подождут освобождения семафора
\`\`\`

### BoundedSemaphore — защита от лишних release()

\`\`\`python
import asyncio

# Semaphore позволяет release() сверх начального значения (увеличивает счётчик)
# BoundedSemaphore — запрещает это (ValueError при превышении):

sem = asyncio.BoundedSemaphore(2)
await sem.acquire()
await sem.acquire()
sem.release()
sem.release()
# sem.release()   ← ValueError: BoundedSemaphore released too many times
\`\`\`

---

## asyncio.Event — сигнализация между корутинами

\`Event\` — это флаг, который можно установить (\`set()\`) или сбросить (\`clear()\`). Корутины ждут его установки через \`await event.wait()\`.

\`\`\`python
import asyncio

async def producer(event: asyncio.Event, queue: asyncio.Queue):
    print("Producer: подготовка данных...")
    await asyncio.sleep(1)
    for i in range(5):
        await queue.put(i)
    event.set()   # сигнализируем: данные готовы
    print("Producer: данные загружены, событие установлено")

async def consumer(event: asyncio.Event, queue: asyncio.Queue, name: str):
    print(f"{name}: ожидаю данные...")
    await event.wait()   # блокируемся до event.set()
    print(f"{name}: событие получено, обрабатываю:")
    while not queue.empty():
        item = queue.get_nowait()
        print(f"  {name}: обработал {item}")

async def main():
    event = asyncio.Event()
    queue: asyncio.Queue = asyncio.Queue()

    await asyncio.gather(
        producer(event, queue),
        consumer(event, queue, "Worker-1"),
        consumer(event, queue, "Worker-2"),
    )

asyncio.run(main())
\`\`\`

---

## asyncio.Condition — сложная синхронизация

\`Condition\` объединяет Lock + Event: позволяет ждать выполнения условия и уведомлять ожидающих:

\`\`\`python
import asyncio

async def main():
    condition = asyncio.Condition()
    results = []

    async def worker(name, value):
        async with condition:
            results.append(value)
            print(f"{name}: добавил {value}")
            condition.notify_all()   # разбудить всех ожидающих

    async def watcher(threshold):
        async with condition:
            # ждём пока сумма не превысит threshold:
            await condition.wait_for(lambda: sum(results) >= threshold)
            print(f"Watcher: сумма {sum(results)} >= {threshold}!")

    await asyncio.gather(
        watcher(10),
        worker("A", 3),
        worker("B", 5),
        worker("C", 4),
    )

asyncio.run(main())
\`\`\`

---

## asyncio.Queue — безопасная передача данных

\`Queue\` — сама по себе механизм синхронизации для паттерна Producer-Consumer:

\`\`\`python
import asyncio

async def main():
    queue: asyncio.Queue[int] = asyncio.Queue(maxsize=5)   # буфер на 5 элементов

    async def producer():
        for i in range(10):
            await queue.put(i)    # если полная — ждёт, не блокируя Loop
            print(f"Произведено: {i} (в очереди: {queue.qsize()})")

    async def consumer(name):
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=2.0)
                await asyncio.sleep(0.3)   # обработка
                print(f"{name}: обработал {item}")
                queue.task_done()
            except asyncio.TimeoutError:
                break

    await asyncio.gather(
        producer(),
        consumer("C1"),
        consumer("C2"),
    )

asyncio.run(main())
\`\`\`

---

## Когда примитивы действительно нужны?

\`\`\`python
# Lock НУЖЕН: критическая секция содержит await
async def update_with_db(key):
    async with lock:
        val = await db.get(key)    # await внутри секции
        await db.set(key, val + 1)

# Lock НЕ НУЖЕН: нет await в критической секции
counter = 0
async def increment():
    global counter
    counter += 1   # атомарно для asyncio (нет await)

# Semaphore НУЖЕН: ограничение параллельных внешних запросов
# Event НУЖЕН: ожидание готовности ресурса / старта сервиса
# Queue НУЖЕН: producer-consumer, буферизация задач
\`\`\`

---

## Сравнение примитивов

| Примитив | Назначение | Ключевые методы |
|----------|-----------|-----------------|
| \`Lock\` | Взаимное исключение (1 корутина) | \`acquire()\`, \`release()\`, \`async with\` |
| \`Semaphore\` | Ограничение параллельности (N корутин) | \`acquire()\`, \`release()\`, \`async with\` |
| \`Event\` | Одноразовый сигнал | \`set()\`, \`clear()\`, \`wait()\`, \`is_set()\` |
| \`Condition\` | Ожидание условия + уведомление | \`wait()\`, \`wait_for()\`, \`notify()\`, \`notify_all()\` |
| \`Queue\` | Буферизованный канал данных | \`put()\`, \`get()\`, \`task_done()\`, \`join()\` |`,
  },
  {
    id: "asyncio-graceful-shutdown",
    question:
      "Каким образом можно корректно завершить (graceful shutdown) асинхронное приложение с множеством запущенных фоновых задач?",
    category: "Асинхронность, потоки и конкурентность",
    difficulty: "senior",
    answer: `## Проблема неаккуратного завершения

Если просто остановить Event Loop, все незавершённые Task получают \`CancelledError\`, но могут не успеть освободить ресурсы (закрыть соединения с БД, дописать файлы, отправить последние события):

\`\`\`python
import asyncio

async def background_worker(name):
    try:
        while True:
            print(f"{name}: работаю...")
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        # Без обработки — ресурсы не освобождаются!
        print(f"{name}: внезапно прерван")
        raise   # ВАЖНО: всегда пробрасывать CancelledError

# Если просто Ctrl+C → asyncio.run() вызовет loop.close()
# Все Task получат CancelledError, но cleanup не гарантирован
\`\`\`

---

## Правило 1: обрабатывать CancelledError в задачах

\`\`\`python
import asyncio
import contextlib

async def db_worker(name, db_pool):
    conn = await db_pool.acquire()
    try:
        while True:
            data = await fetch_next_item()
            await conn.execute("INSERT INTO log VALUES ($1)", data)
            await asyncio.sleep(0.1)
    except asyncio.CancelledError:
        print(f"{name}: получен сигнал отмены, финализируем...")
        # Дочитываем то, что уже начали:
        await conn.execute("COMMIT")
        raise   # обязательно пробрасываем дальше!
    finally:
        # finally выполняется ВСЕГДА — при CancelledError тоже:
        await db_pool.release(conn)
        print(f"{name}: соединение возвращено в пул")
\`\`\`

---

## Правило 2: обработка SIGTERM / SIGINT

\`\`\`python
import asyncio
import signal
import sys

shutdown_event = asyncio.Event()

def handle_signal(sig):
    print(f"\\nПолучен сигнал {sig.name}, начинаем graceful shutdown...")
    shutdown_event.set()

async def main():
    loop = asyncio.get_running_loop()

    # Регистрируем обработчики сигналов:
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, handle_signal, sig)

    # Запускаем фоновые задачи:
    tasks = [
        asyncio.create_task(worker(f"W{i}"), name=f"worker-{i}")
        for i in range(5)
    ]

    # Ждём сигнала или завершения работы:
    await shutdown_event.wait()

    # Начинаем shutdown:
    await shutdown(tasks)

async def worker(name):
    try:
        while not shutdown_event.is_set():
            print(f"{name}: тик")
            await asyncio.sleep(0.5)
    finally:
        print(f"{name}: корректно завершён")

async def shutdown(tasks):
    print(f"Отменяем {len(tasks)} задач...")
    for task in tasks:
        task.cancel()

    # Ждём завершения всех отменённых задач:
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for task, result in zip(tasks, results):
        if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
            print(f"Задача {task.get_name()} завершилась с ошибкой: {result}")

    print("Все задачи завершены")

asyncio.run(main())
\`\`\`

---

## Правило 3: shield() — защита критических операций

\`asyncio.shield\` защищает корутину от отмены. Используется для операций, которые **нельзя прерывать** (финальный flush, сохранение состояния):

\`\`\`python
import asyncio

async def critical_save(data):
    """Эту операцию нельзя прервать — потеряем данные"""
    await asyncio.sleep(0.5)   # запись в файл/БД
    print(f"Сохранено: {data}")

async def worker():
    try:
        for i in range(100):
            await do_work(i)
    except asyncio.CancelledError:
        print("Отмена получена, сохраняем состояние...")
        # shield защищает critical_save от отмены
        # даже если наша Task отменена:
        await asyncio.shield(critical_save("checkpoint"))
        print("Состояние сохранено")
        raise

async def do_work(i):
    await asyncio.sleep(0.1)
    print(f"Работаю над {i}")

async def main():
    task = asyncio.create_task(worker())
    await asyncio.sleep(0.5)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Task отменена")

asyncio.run(main())
\`\`\`

---

## Полный паттерн: graceful shutdown для сервера

\`\`\`python
import asyncio
import signal
from contextlib import asynccontextmanager

class AppServer:
    def __init__(self):
        self._tasks: set[asyncio.Task] = set()
        self._shutdown = asyncio.Event()
        self._server = None

    def create_task(self, coro, name=None):
        """Отслеживаем все фоновые задачи"""
        task = asyncio.create_task(coro, name=name)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        return task

    async def serve(self):
        # Регистрируем сигналы:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(
                sig,
                lambda: asyncio.create_task(self.shutdown("signal"))
            )

        # Запускаем фоновые сервисы:
        self.create_task(self._health_check(), name="health-check")
        self.create_task(self._metrics_collector(), name="metrics")
        self.create_task(self._job_processor(), name="jobs")

        print("Сервер запущен. Ctrl+C для остановки.")
        await self._shutdown.wait()

    async def shutdown(self, reason="unknown"):
        if self._shutdown.is_set():
            return
        print(f"\\nShutdown: {reason}")
        self._shutdown.set()

        # 1. Остановить приём новых запросов
        if self._server:
            self._server.close()

        # 2. Дать задачам время на завершение (grace period):
        if self._tasks:
            print(f"Ожидаем {len(self._tasks)} задач (до 10 сек)...")
            try:
                await asyncio.wait_for(
                    asyncio.gather(*self._tasks, return_exceptions=True),
                    timeout=10.0
                )
            except asyncio.TimeoutError:
                print("Таймаут истёк, принудительная отмена...")
                for task in self._tasks:
                    task.cancel()
                await asyncio.gather(*self._tasks, return_exceptions=True)

        print("Shutdown завершён")

    async def _health_check(self):
        while not self._shutdown.is_set():
            await asyncio.sleep(5)
            print("health: OK")

    async def _metrics_collector(self):
        try:
            while not self._shutdown.is_set():
                await asyncio.sleep(1)
                print("metrics: собраны")
        finally:
            print("metrics: финальный flush")   # всегда выполняется

    async def _job_processor(self):
        try:
            while not self._shutdown.is_set():
                await asyncio.sleep(0.5)
                print("jobs: обработка")
        except asyncio.CancelledError:
            print("jobs: отмена, завершаем текущее задание...")
            await asyncio.sleep(0.1)   # дообрабатываем
            raise

async def main():
    server = AppServer()
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

---

## Чеклист graceful shutdown

\`\`\`
✅ Все Task обрабатывают CancelledError и пробрасывают его дальше
✅ finally-блоки освобождают ресурсы (соединения, файлы, локи)
✅ SIGTERM/SIGINT обрабатываются через loop.add_signal_handler
✅ Есть grace period (asyncio.wait_for с timeout)
✅ После таймаута — принудительная отмена оставшихся задач
✅ asyncio.shield защищает критические финальные операции
✅ asyncio.gather(*tasks, return_exceptions=True) — не падает при ошибках
\`\`\``,
  },
  {
    id: "oop-mro-c3",
    question:
      "Как работает алгоритм MRO (Method Resolution Order) C3? Приведите пример структуры классов, когда линеаризация невозможна.",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Что такое MRO

MRO (Method Resolution Order) — порядок, в котором Python ищет метод или атрибут при обходе иерархии классов. Алгоритм C3-линеаризации (принят в Python 2.3+) гарантирует три свойства:

1. **Порядок локальности**: класс всегда стоит перед своими родителями.
2. **Монотонность**: если C идёт перед D в MRO одного класса, то и во всех подклассах C стоит перед D.
3. **Согласованность с порядком объявления**: родители перечисляются слева направо.

---

## Алгоритм C3 — формула

\`\`\`
L[C(B1, B2, ...)] = C + merge(L[B1], L[B2], ..., [B1, B2, ...])
\`\`\`

**merge** работает итеративно:
1. Берём голову (первый элемент) первого списка.
2. Проверяем: этот элемент **не** входит в хвост (все элементы кроме первого) ни одного из остальных списков?
3. Если да — берём его, удаляем из всех списков, повторяем.
4. Если нет — переходим к следующему списку и проверяем его голову.
5. Если голову нельзя взять ни из одного списка — алгоритм завершается с ошибкой (несовместимая иерархия).

---

## Пример: ромбовидное наследование

\`\`\`python
class A:
    def method(self):
        print("A")

class B(A):
    def method(self):
        print("B")
        super().method()

class C(A):
    def method(self):
        print("C")
        super().method()

class D(B, C):
    def method(self):
        print("D")
        super().method()

# Вычислим MRO вручную:
# L[A] = [A, object]
# L[B] = [B] + merge([A, object], [A]) = [B, A, object]
# L[C] = [C] + merge([A, object], [A]) = [C, A, object]
# L[D] = [D] + merge(
#             [B, A, object],   ← L[B]
#             [C, A, object],   ← L[C]
#             [B, C]            ← порядок родителей
#         )
# Шаг 1: голова B — есть ли B в хвостах? [A,object], [A,object], [C] — нет → берём B
#         merge([A,object], [C,A,object], [C])
# Шаг 2: голова A — есть ли A в хвостах? [object], [A,object], [C] → ДА (хвост [C,A,object])
#         → пропускаем, берём голову след. списка: C
#         C в хвостах? [object], [A,object], [] → нет → берём C
#         merge([A,object], [A,object], [])
# Шаг 3: голова A — хвост [object], [object], [] → нет → берём A
# Шаг 4: object → берём
# Итог: D → B → C → A → object

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

d = D()
d.method()
# D
# B
# C
# A
# Каждый super().method() вызывает следующий в MRO, а не родителя по иерархии!
\`\`\`

---

## super() и MRO: не «родительский класс», а «следующий в MRO»

\`\`\`python
class A:
    def greet(self):
        print("A.greet")

class B(A):
    def greet(self):
        print("B.greet")
        super().greet()   # следующий после B в MRO экземпляра

class C(A):
    def greet(self):
        print("C.greet")
        super().greet()   # следующий после C в MRO экземпляра

class D(B, C):
    pass

# MRO для D: D → B → C → A → object
d = D()
d.greet()
# B.greet   ← super() в B смотрит на MRO D, следующий после B → C
# C.greet   ← super() в C смотрит на MRO D, следующий после C → A
# A.greet

# Если бы C не вызывал super().greet():
# B.greet
# C.greet   ← и A.greet никогда не вызовется! Кооперативное наследование требует super()
\`\`\`

---

## Когда линеаризация НЕВОЗМОЖНА

Алгоритм C3 падает с \`TypeError\`, если порядок наследования противоречив — нарушена монотонность:

\`\`\`python
class A: pass
class B: pass

class X(A, B): pass   # X: A перед B
class Y(B, A): pass   # Y: B перед A  ← конфликт с X!

# Пытаемся создать класс, который наследует и X, и Y:
class Z(X, Y): pass
# TypeError: Cannot create a consistent method resolution order (MRO)
# for bases A, B
#
# Почему? merge требует:
# L[Z] = [Z] + merge([X,A,B,object], [Y,B,A,object], [X,Y])
# Шаг 1: X → берём.  merge([A,B,object], [Y,B,A,object], [Y])
# Шаг 2: голова A — A в хвостах? [B,A,object] → ДА → пропускаем
#         голова Y → берём. merge([A,B,object], [B,A,object], [])
# Шаг 3: голова A — A в хвостах? [A,object] → ДА → пропускаем
#         голова B — B в хвостах? [B,object] → ДА → пропускаем
#         Оба списка — голову взять нельзя → ОШИБКА
\`\`\`

### Ещё один классический пример — «запрещённый ромб»

\`\`\`python
class O: pass
class A(O): pass
class B(O): pass
class C(A, B): pass   # OK: C → A → B → O
class D(B, A): pass   # OK: D → B → A → O  ← обратный порядок!

# class E(C, D): pass   ← ОШИБКА: C требует A перед B, D требует B перед A
# TypeError: MRO conflict among bases A, B
\`\`\`

---

## Инструменты для отладки MRO

\`\`\`python
class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

# 1. Посмотреть MRO:
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

# 2. mro() — метод, возвращающий список:
print(D.mro())
# [<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>]

# 3. inspect.getmro — алиас:
import inspect
print(inspect.getmro(D))

# 4. super() с явными аргументами (Python 2 стиль, редко нужно):
class B(A):
    def method(self):
        super(B, self).method()   # явно: следующий после B в MRO self
\`\`\`

---

## Таблица: правила C3

| Правило | Суть |
|---------|------|
| Локальность | Потомок всегда раньше предка |
| Монотонность | Порядок из родительских MRO сохраняется |
| Слева-направо | Порядок явных родителей \`class C(A, B)\` уважается |
| Ошибка при конфликте | Лучше упасть на \`class\`, чем давать непредсказуемое поведение |`,
  },
  {
    id: "oop-metaclasses",
    question:
      "Что такое метаклассы? Опишите жизненный цикл создания класса при помощи метакласса (роль методов __new__ и __init__ метакласса).",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Что такое метакласс

В Python **всё является объектом** — в том числе сам класс. Класс — это экземпляр своего метакласса. По умолчанию метакласс любого класса — это \`type\`.

\`\`\`python
class Dog:
    pass

print(type(Dog))          # <class 'type'>  ← Dog — экземпляр type
print(type(Dog()))        # <class 'Dog'>   ← экземпляр Dog
print(type(type))         # <class 'type'>  ← type — экземпляр самого себя
print(isinstance(Dog, type))  # True
\`\`\`

---

## Жизненный цикл создания класса

Когда Python встречает \`class Foo(Base): ...\`, происходит следующее:

\`\`\`
1. Определить метакласс (metaclass=...)
2. Собрать пространство имён: выполнить тело класса в dict-е
3. Вызвать metaclass.__prepare__(name, bases, **kwargs)  → пустой namespace dict
4. Выполнить тело класса в этом namespace-е
5. Вызвать metaclass(name, bases, namespace)
   └─ metaclass.__call__(...)
      ├─ metaclass.__new__(mcs, name, bases, namespace)  → создаёт объект класса
      └─ metaclass.__init__(cls, name, bases, namespace) → инициализирует его
\`\`\`

---

## Создание класса через type напрямую

\`type\` с тремя аргументами — это ручное создание класса:

\`\`\`python
# Два способа создать одинаковый класс:

# 1. Через синтаксис class:
class Animal:
    def speak(self):
        return "..."

# 2. Через type(name, bases, dict):
Animal = type("Animal", (object,), {
    "speak": lambda self: "..."
})

# Оба полностью эквивалентны
print(Animal.__name__)   # Animal
a = Animal()
print(a.speak())         # ...
\`\`\`

---

## Написание своего метакласса

\`\`\`python
class Meta(type):
    # __prepare__ вызывается ПЕРВЫМ, до выполнения тела класса.
    # Должен вернуть dict-подобный объект, который будет namespace-ом.
    # Используется для: упорядоченных namespace, валидации имён и т.д.
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        print(f"[Meta.__prepare__] Создаём namespace для '{name}'")
        return {}   # можно вернуть OrderedDict или кастомный dict

    # __new__ создаёт САМИ ОБЪЕКТ КЛАССА (аналог type.__new__)
    # mcs   — сам метакласс (Meta)
    # name  — имя создаваемого класса ("MyClass")
    # bases — кортеж базовых классов
    # namespace — dict с атрибутами из тела класса
    def __new__(mcs, name, bases, namespace, **kwargs):
        print(f"[Meta.__new__] Создаём класс '{name}'")
        print(f"  bases: {bases}")
        print(f"  атрибуты: {list(namespace.keys())}")

        # Можно модифицировать namespace ДО создания класса:
        namespace["_meta_created"] = True

        # Создаём объект класса:
        cls = super().__new__(mcs, name, bases, namespace)
        return cls

    # __init__ инициализирует уже СОЗДАННЫЙ объект класса
    # cls — только что созданный класс (результат __new__)
    def __init__(cls, name, bases, namespace, **kwargs):
        print(f"[Meta.__init__] Инициализируем класс '{name}'")
        super().__init__(name, bases, namespace)
        # Можно добавлять атрибуты уже к готовому cls:
        cls._registry = []

class MyClass(metaclass=Meta):
    x = 10
    def hello(self): pass

# [Meta.__prepare__] Создаём namespace для 'MyClass'
# [Meta.__new__] Создаём класс 'MyClass'
#   bases: ()
#   атрибуты: ['__module__', '__qualname__', 'x', 'hello']
# [Meta.__init__] Инициализируем класс 'MyClass'

print(MyClass._meta_created)   # True
print(MyClass._registry)       # []
\`\`\`

---

## Практические применения метаклассов

### 1. Реестр подклассов (plugin-система)

\`\`\`python
class PluginMeta(type):
    _registry = {}

    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)
        if bases:   # не регистрируем сам базовый класс
            PluginMeta._registry[name] = cls

class Plugin(metaclass=PluginMeta):
    pass

class CSVParser(Plugin):
    def parse(self, data): return data.split(",")

class JSONParser(Plugin):
    def parse(self, data): import json; return json.loads(data)

print(PluginMeta._registry)
# {'CSVParser': <class 'CSVParser'>, 'JSONParser': <class 'JSONParser'>}

# Фабрика по имени:
def get_parser(name):
    return PluginMeta._registry[name]()

parser = get_parser("CSVParser")
print(parser.parse("a,b,c"))   # ['a', 'b', 'c']
\`\`\`

### 2. Валидация интерфейса (как абстрактные методы)

\`\`\`python
class InterfaceMeta(type):
    REQUIRED = []

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:   # только подклассы, не сам базовый
            missing = [m for m in mcs.REQUIRED if m not in namespace]
            if missing:
                raise TypeError(
                    f"Класс '{name}' не реализовал: {missing}"
                )
        return cls

class ServiceMeta(InterfaceMeta):
    REQUIRED = ["process", "validate"]

class BaseService(metaclass=ServiceMeta):
    pass

# class BadService(BaseService): pass
# TypeError: Класс 'BadService' не реализовал: ['process', 'validate']

class GoodService(BaseService):
    def process(self, data): return data
    def validate(self, data): return True
\`\`\`

### 3. Автоматическое добавление методов

\`\`\`python
class AutoPropertyMeta(type):
    """Автоматически создаёт геттеры/сеттеры для полей с аннотацией"""
    def __new__(mcs, name, bases, namespace):
        annotations = namespace.get("__annotations__", {})
        for field in annotations:
            private = f"_{field}"
            # Создаём property через closure:
            def make_prop(f, p):
                return property(
                    lambda self: getattr(self, p),
                    lambda self, v: setattr(self, p, v)
                )
            namespace[field] = make_prop(field, private)
        return super().__new__(mcs, name, bases, namespace)

class Person(metaclass=AutoPropertyMeta):
    name: str
    age: int

    def __init__(self, name, age):
        self._name = name
        self._age = age

p = Person("Alice", 30)
print(p.name)   # Alice (через автоматический property)
p.age = 31
print(p.age)    # 31
\`\`\`

---

## Метакласс vs class decorator vs __init_subclass__

\`\`\`python
# В большинстве случаев метакласс можно заменить более простым механизмом:

# __init_subclass__ (Python 3.6+) — вызывается при создании подкласса:
class Base:
    def __init_subclass__(cls, required=None, **kwargs):
        super().__init_subclass__(**kwargs)
        if required and not hasattr(cls, required):
            raise TypeError(f"{cls.__name__} должен иметь {required}")

class Child(Base, required="process"):
    def process(self): pass   # OK

# class Bad(Base, required="process"): pass   ← TypeError

# Декоратор класса — для модификации после создания:
def add_repr(cls):
    def __repr__(self):
        attrs = {k: v for k, v in vars(self).items() if not k.startswith("_")}
        return f"{cls.__name__}({attrs})"
    cls.__repr__ = __repr__
    return cls

@add_repr
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

print(Point(1, 2))   # Point({'x': 1, 'y': 2})
\`\`\`

---

## Сводная таблица: когда что использовать

| Инструмент | Когда использовать |
|-----------|-------------------|
| Метакласс | Нужен контроль над созданием класса, \`__prepare__\`, реестр, изменение \`bases\` |
| \`__init_subclass__\` | Валидация/настройка подклассов — 95% случаев вместо метакласса |
| Декоратор класса | Модификация готового класса, не нужен \`__prepare__\` |
| \`type(name, bases, dict)\` | Динамическое создание классов в рантайме |`,
  },
  {
    id: "oop-descriptors",
    question:
      "Как устроен протокол дескрипторов? В чём разница между дескриптором данных (Data Descriptor) и дескриптором не-данных (Non-Data Descriptor)?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Что такое дескриптор

Дескриптор — это объект, у которого определён хотя бы один из методов: \`__get__\`, \`__set__\`, \`__delete__\`. Если такой объект хранится в атрибуте **класса** (не экземпляра!), Python автоматически вызывает эти методы при доступе к атрибуту.

\`\`\`python
# Сигнатуры:
class Descriptor:
    def __get__(self, obj, objtype=None):
        # obj      — экземпляр, через который обращаемся (None при доступе через класс)
        # objtype  — сам класс (type(obj))
        ...

    def __set__(self, obj, value):
        # obj   — экземпляр
        # value — присваиваемое значение
        ...

    def __delete__(self, obj):
        # obj — экземпляр
        ...
\`\`\`

---

## Data Descriptor vs Non-Data Descriptor

| | Data Descriptor | Non-Data Descriptor |
|--|-----------------|---------------------|
| Методы | \`__get__\` + \`__set__\` и/или \`__delete__\` | Только \`__get__\` |
| Приоритет | Выше \`__dict__\` экземпляра | Ниже \`__dict__\` экземпляра |
| Примеры | \`property\`, \`classmethod\`, \`staticmethod\` | Функции (методы класса), \`__slots__\` |

Ключевое правило: **Data Descriptor выигрывает у словаря экземпляра; Non-Data Descriptor проигрывает ему**.

---

## Демонстрация приоритета

\`\`\`python
class DataDesc:
    """Data Descriptor: определены __get__ и __set__"""
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return obj.__dict__.get("_data_val", "дескриптор")

    def __set__(self, obj, value):
        print(f"DataDesc.__set__({value})")
        obj.__dict__["_data_val"] = value

class NonDataDesc:
    """Non-Data Descriptor: только __get__"""
    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return "non-data дескриптор"

class MyClass:
    data    = DataDesc()      # Data Descriptor в классе
    nondata = NonDataDesc()   # Non-Data Descriptor в классе

obj = MyClass()

# --- Data Descriptor ---
obj.data = "экземпляр"           # вызывает DataDesc.__set__
# DataDesc.__set__(экземпляр)
print(obj.data)                   # "экземпляр" — через __get__ (дескриптор выиграл)
print(obj.__dict__)               # {'_data_val': 'экземпляр'}  ← данные здесь
# Даже если записать напрямую в __dict__:
obj.__dict__["data"] = "прямая запись"
print(obj.data)                   # всё равно вызывается __get__ дескриптора!

# --- Non-Data Descriptor ---
print(obj.nondata)                # "non-data дескриптор" (дескриптор работает)
obj.__dict__["nondata"] = "экземпляр выиграл"
print(obj.nondata)                # "экземпляр выиграл" — __dict__ экземпляра ПЕРЕКРЫЛ!
\`\`\`

---

## Реализация property «с нуля»

\`property\` — это встроенный Data Descriptor. Реализуем аналог:

\`\`\`python
class myproperty:
    """Аналог встроенного property"""
    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        self.__doc__ = doc or (fget.__doc__ if fget else None)

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self   # доступ через класс → возвращаем сам дескриптор
        if self.fget is None:
            raise AttributeError("unreadable attribute")
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError("can't set attribute")
        self.fset(obj, value)

    def __delete__(self, obj):
        if self.fdel is None:
            raise AttributeError("can't delete attribute")
        self.fdel(obj)

    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel, self.__doc__)

    def deleter(self, fdel):
        return type(self)(self.fget, self.fset, fdel, self.__doc__)

class Circle:
    def __init__(self, radius):
        self._radius = radius

    @myproperty
    def radius(self):
        """Радиус окружности"""
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Радиус не может быть отрицательным")
        self._radius = value

    @myproperty
    def area(self):
        import math
        return math.pi * self._radius ** 2

c = Circle(5)
print(c.radius)   # 5
c.radius = 10
print(c.area)     # 314.159...
# c.radius = -1   # ValueError
\`\`\`

---

## Дескриптор для валидации типов

\`\`\`python
class TypedField:
    """Data Descriptor для проверки типа при присваивании"""
    def __init__(self, name, expected_type):
        self.name = name
        self.expected_type = expected_type
        self.private_name = f"_typed_{name}"

    def __set_name__(self, owner, name):
        # Вызывается Python при определении класса (Python 3.6+):
        self.name = name
        self.private_name = f"_typed_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private_name, None)

    def __set__(self, obj, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(
                f"Поле '{self.name}' ожидает {self.expected_type.__name__}, "
                f"получено {type(value).__name__}"
            )
        setattr(obj, self.private_name, value)

class Person:
    name = TypedField("name", str)
    age  = TypedField("age", int)

    def __init__(self, name, age):
        self.name = name   # вызывает TypedField.__set__
        self.age  = age

p = Person("Alice", 30)
print(p.name, p.age)   # Alice 30
# Person("Alice", "30")   # TypeError: Поле 'age' ожидает int, получено str
\`\`\`

---

## Функция как Non-Data Descriptor

Обычные функции являются Non-Data Descriptor — именно так работают методы:

\`\`\`python
class MyClass:
    def method(self):
        return f"вызван для {self}"

obj = MyClass()

# При доступе obj.method Python вызывает:
# MyClass.__dict__["method"].__get__(obj, MyClass)
# → возвращает bound method

print(type(MyClass.__dict__["method"]))  # <class 'function'>
print(type(obj.method))                  # <class 'method'>  (bound!)

# Вручную то же самое:
unbound = MyClass.__dict__["method"]
bound = unbound.__get__(obj, MyClass)    # function.__get__ возвращает bound method
print(bound())                           # вызван для <__main__.MyClass object at ...>

# Почему Non-Data: атрибут экземпляра перекрывает метод!
obj.__dict__["method"] = lambda: "я перекрыл метод"
print(obj.method())   # "я перекрыл метод" — __dict__ выиграл у Non-Data Descriptor
\`\`\`

---

## __set_name__ — автоматическое получение имени

\`\`\`python
class LoggedField:
    def __set_name__(self, owner, name):
        # Python 3.6+: вызывается при определении класса
        # owner — класс, в котором определён атрибут
        # name  — имя атрибута в классе
        self.public_name = name
        self.private_name = f"_{name}"
        print(f"LoggedField привязан к {owner.__name__}.{name}")

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        value = getattr(obj, self.private_name, "не задано")
        print(f"GET {self.public_name} = {value!r}")
        return value

    def __set__(self, obj, value):
        print(f"SET {self.public_name} = {value!r}")
        setattr(obj, self.private_name, value)

class Config:
    host = LoggedField()   # __set_name__(Config, "host") вызывается здесь
    port = LoggedField()   # __set_name__(Config, "port")

# LoggedField привязан к Config.host
# LoggedField привязан к Config.port

cfg = Config()
cfg.host = "localhost"   # SET host = 'localhost'
print(cfg.host)          # GET host = 'localhost' → localhost
\`\`\``,
  },
  {
    id: "oop-attribute-access-order",
    question:
      "Каков строгий порядок вызова магических методов __getattribute__, __getattr__, __setattr__ и дескрипторов при обращении к атрибуту объекта?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Порядок при ЧТЕНИИ атрибута: obj.name

\`object.__getattribute__\` вызывается **всегда и первым** — это точка входа для любого доступа к атрибуту. Стандартная реализация выполняет поиск в строго определённом порядке:

\`\`\`
obj.name  →  type(obj).__getattribute__(obj, "name")
              │
              ├─ 1. Ищем "name" в type(obj).__mro__ (в классах)
              │      └─ Нашли объект с __get__ И (__set__ или __delete__)?
              │              YES → Data Descriptor → вызвать __get__ → СТОП
              │
              ├─ 2. Ищем "name" в obj.__dict__
              │      └─ Нашли? → вернуть → СТОП
              │
              ├─ 3. Ищем "name" в type(obj).__mro__ (в классах)
              │      └─ Нашли объект с __get__ (без __set__)? Non-Data Descriptor
              │              YES → вызвать __get__ → СТОП
              │              NO  → вернуть объект как есть → СТОП
              │
              └─ 4. Ничего не нашли → AttributeError
                     → вызвать type(obj).__getattr__(obj, "name")  (если определён)
\`\`\`

---

## Демонстрация приоритетов

\`\`\`python
class DataDesc:
    def __get__(self, obj, objtype=None):
        return "data descriptor"
    def __set__(self, obj, value):
        pass   # наличие __set__ делает его Data Descriptor

class NonDataDesc:
    def __get__(self, obj, objtype=None):
        return "non-data descriptor"

class MyClass:
    data_attr    = DataDesc()
    nondata_attr = NonDataDesc()
    class_attr   = "просто атрибут класса"

obj = MyClass()

# --- Data Descriptor vs __dict__ ---
obj.__dict__["data_attr"] = "в __dict__"
print(obj.data_attr)     # "data descriptor" ← Data Descriptor ВЫИГРАЛ

# --- __dict__ vs Non-Data Descriptor ---
obj.__dict__["nondata_attr"] = "в __dict__"
print(obj.nondata_attr)  # "в __dict__" ← __dict__ экземпляра ВЫИГРАЛ

# --- __dict__ vs атрибут класса (не дескриптор) ---
obj.__dict__["class_attr"] = "экземпляр"
print(obj.class_attr)    # "экземпляр" ← __dict__ выиграл у обычного атрибута класса
\`\`\`

---

## __getattr__ — запасной вариант

\`__getattr__\` вызывается **только если атрибут не найден** через стандартный механизм (только при \`AttributeError\`):

\`\`\`python
class DynamicProxy:
    def __init__(self, target):
        # Важно: super().__setattr__ чтобы не вызвать свой __setattr__:
        object.__setattr__(self, "_target", target)

    def __getattr__(self, name):
        # Сюда попадаем ТОЛЬКО если атрибут не нашли обычным путём:
        print(f"__getattr__ вызван для '{name}'")
        return getattr(self._target, name)

    def __getattribute__(self, name):
        # Вызывается ВСЕГДА и ПЕРВЫМ, даже для _target!
        # Осторожно: легко получить бесконечную рекурсию
        print(f"__getattribute__ вызван для '{name}'")
        return super().__getattribute__(name)   # делегируем стандартной реализации

class Target:
    x = 42
    def greet(self): return "привет"

proxy = DynamicProxy(Target())
# __getattribute__ вызван для 'x'
# __getattr__ вызван для 'x'   ← x нет в proxy → __getattr__
print(proxy.x)    # 42 (через __getattr__ → getattr(target, 'x'))

proxy.own = 99
# __getattribute__ вызван для 'own'   ← находит в __dict__ proxy
print(proxy.own)  # 99  (не попадает в __getattr__)
\`\`\`

---

## __setattr__ — перехват любого присваивания

\`__setattr__\` вызывается **при любом** \`obj.name = value\`, включая внутри \`__init__\`:

\`\`\`python
class Validated:
    _allowed = frozenset(["x", "y", "name"])

    def __setattr__(self, name, value):
        print(f"__setattr__: {name} = {value!r}")
        if name not in self._allowed:
            raise AttributeError(f"Атрибут '{name}' не разрешён")
        # ВАЖНО: не писать self.name = value — это рекурсия!
        # Правильно — через super() или object.__setattr__:
        object.__setattr__(self, name, value)

obj = Validated()
obj.x = 10          # __setattr__: x = 10  → OK
obj.name = "Alice"  # __setattr__: name = 'Alice' → OK
# obj.z = 99        # AttributeError: Атрибут 'z' не разрешён
\`\`\`

---

## Полная схема с дескриптором: пошагово

\`\`\`python
class Trace:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        val = obj.__dict__.get(f"_{self.name}")
        print(f"  [Trace.__get__] {self.name} → {val!r}")
        return val

    def __set__(self, obj, value):
        print(f"  [Trace.__set__] {self.name} ← {value!r}")
        obj.__dict__[f"_{self.name}"] = value

class Example:
    value = Trace()   # Data Descriptor

    def __getattribute__(self, name):
        print(f"[__getattribute__] '{name}'")
        return super().__getattribute__(name)

    def __getattr__(self, name):
        print(f"[__getattr__] '{name}' — не найден!")
        raise AttributeError(name)

    def __setattr__(self, name, val):
        print(f"[__setattr__] '{name}' = {val!r}")
        super().__setattr__(name, val)   # → Data Descriptor.__set__ если есть

e = Example()
print("--- Присваивание ---")
e.value = 42
# [__setattr__] 'value' = 42
# → super().__setattr__ → находит Trace (Data Descriptor) → Trace.__set__
#   [Trace.__set__] value ← 42

print("--- Чтение ---")
result = e.value
# [__getattribute__] 'value'
# → super().__getattribute__ → находит Trace (Data Descriptor) → Trace.__get__
#   [Trace.__get__] value → 42
print(result)   # 42

print("--- Несуществующий атрибут ---")
try:
    e.missing
    # [__getattribute__] 'missing'
    # → не найдено → AttributeError → __getattr__
    # [__getattr__] 'missing' — не найден!
except AttributeError:
    pass
\`\`\`

---

## Алгоритм __setattr__ (стандартный)

\`\`\`
obj.name = value  →  type(obj).__setattr__(obj, "name", value)
                      │
                      ├─ 1. Ищем "name" в type(obj).__mro__
                      │      └─ Нашли Data Descriptor (есть __set__)?
                      │              YES → descriptor.__set__(obj, value) → СТОП
                      │
                      └─ 2. Иначе → записать в obj.__dict__["name"] = value
                              (Non-Data Descriptor и обычные атрибуты класса НЕ блокируют запись в __dict__)
\`\`\`

---

## Ловушки и частые ошибки

\`\`\`python
class Broken:
    def __getattribute__(self, name):
        # БЕСКОНЕЧНАЯ РЕКУРСИЯ: self.data обращается к __getattribute__!
        return self.data[name]   # ← снова вызывает __getattribute__

class Fixed:
    def __getattribute__(self, name):
        # Правильно: обращаться к __dict__ через object.__getattribute__:
        data = object.__getattribute__(self, "_data")
        if name in data:
            return data[name]
        return object.__getattribute__(self, name)

class BrokenSetter:
    def __setattr__(self, name, value):
        self.name = value   # РЕКУРСИЯ: снова вызывает __setattr__!

class FixedSetter:
    def __setattr__(self, name, value):
        object.__setattr__(self, name, value)   # правильно
\`\`\`

---

## Итоговая таблица приоритетов

| Приоритет | Механизм | Условие |
|-----------|---------|---------|
| 1 | Data Descriptor (класс) | Есть \`__get__\` + \`__set__\`/\`__delete__\` |
| 2 | \`obj.__dict__\` | Прямая запись в словарь экземпляра |
| 3 | Non-Data Descriptor (класс) | Только \`__get__\` |
| 4 | Обычный атрибут класса | Без дескрипторных методов |
| 5 | \`__getattr__\` | Вызывается при \`AttributeError\` |`,
  },
  {
    id: "arch-singleton-three-ways",
    question:
      "Как реализовать потокобезопасный паттерн Singleton на Python тремя разными способами (через метакласс, модуль, метод __new__)?",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## Зачем нужен Singleton и когда его не нужно

Singleton гарантирует, что у класса есть **ровно один экземпляр**, и предоставляет глобальную точку доступа к нему. Типичные кейсы: пул соединений, конфигурация приложения, логгер. Однако избыточное использование Singleton затрудняет тестирование — рассмотрите вместо него DI-контейнер.

---

## Способ 1: через метод __new__

Самый простой подход. \`__new__\` вызывается до \`__init__\` и отвечает за создание объекта.

\`\`\`python
import threading

class SingletonNew:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:              # блокируем на время создания
                if cls._instance is None:  # double-checked locking
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int = 0):
        # ВНИМАНИЕ: __init__ вызывается при каждом вызове SingletonNew()!
        # Нужна защита от повторной инициализации:
        if not hasattr(self, "_initialized"):
            self.value = value
            self._initialized = True

# Тест потокобезопасности:
instances = []

def create():
    instances.append(SingletonNew(42))

threads = [threading.Thread(target=create) for _ in range(100)]
for t in threads: t.start()
for t in threads: t.join()

# Все элементы — один и тот же объект:
print(all(i is instances[0] for i in instances))   # True
print(id(instances[0]) == id(instances[-1]))        # True
\`\`\`

**Проблема** подхода: \`__init__\` вызывается каждый раз при обращении к классу, поэтому нужна дополнительная защита через \`_initialized\`.

---

## Способ 2: через метакласс (наиболее правильный)

Метакласс перехватывает \`__call__\` — момент создания экземпляра. Логика Singleton инкапсулирована в метаклассе и не засоряет бизнес-код класса.

\`\`\`python
import threading

class SingletonMeta(type):
    """Потокобезопасный метакласс Singleton."""

    _instances: dict[type, object] = {}
    _lock: threading.Lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            with cls._lock:
                if cls not in cls._instances:   # double-checked locking
                    instance = super().__call__(*args, **kwargs)
                    cls._instances[cls] = instance
        return cls._instances[cls]


class DatabasePool(metaclass=SingletonMeta):
    """Пул соединений с БД — существует в единственном экземпляре."""

    def __init__(self, dsn: str = "postgresql://localhost/db"):
        self.dsn = dsn
        self.connections: list = []
        print(f"DatabasePool создан: {dsn}")   # выводится только один раз!

    def get_connection(self):
        return f"conn to {self.dsn}"


class AppConfig(metaclass=SingletonMeta):
    """Конфигурация приложения."""

    def __init__(self):
        self.debug = False
        self.version = "1.0.0"


# Потокобезопасный тест:
results = []

def get_pool():
    results.append(DatabasePool("postgresql://prod/mydb"))

threads = [threading.Thread(target=get_pool) for _ in range(50)]
for t in threads: t.start()
for t in threads: t.join()

print(all(r is results[0] for r in results))   # True
# "DatabasePool создан" — напечатано ровно один раз

# Разные классы — разные синглтоны:
pool = DatabasePool()
config = AppConfig()
print(type(pool) is type(config))   # False — каждый класс независим
\`\`\`

**Преимущество**: \`__init__\` вызывается ровно один раз. Поддержка наследования работает корректно — каждый подкласс получает свой Singleton.

---

## Способ 3: через модуль (самый питоничный)

В Python **модуль** сам по себе — Singleton: при первом импорте он исполняется и кэшируется в \`sys.modules\`. Повторные импорты возвращают тот же объект. Это самый идиоматичный способ.

\`\`\`python
# Файл: config.py
import os
import threading

class _Config:
    """Приватный класс — наружу экспортируем только экземпляр."""
    def __init__(self):
        self._lock = threading.Lock()
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.db_url = os.getenv("DATABASE_URL", "sqlite:///dev.db")
        self.secret_key = os.getenv("SECRET_KEY", "dev-secret")

    def update(self, **kwargs):
        with self._lock:
            for key, value in kwargs.items():
                if hasattr(self, key):
                    setattr(self, key, value)

# Модуль-уровень: создаётся один раз при первом импорте
config = _Config()

# Использование в других файлах:
# from config import config
# print(config.db_url)
# config.update(debug=True)
\`\`\`

\`\`\`python
# Файл: app.py — любой импорт возвращает тот же объект
from config import config as config1
from config import config as config2

print(config1 is config2)    # True — один и тот же объект
config1.update(debug=True)
print(config2.debug)         # True — изменение видно через любую ссылку
\`\`\`

---

## Способ 4 (бонус): через functools.cache / декоратор

\`\`\`python
import functools
import threading

def singleton(cls):
    """Декоратор, превращающий класс в Singleton."""
    instances = {}
    lock = threading.Lock()

    @functools.wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            with lock:
                if cls not in instances:
                    instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class Logger:
    def __init__(self, name: str = "app"):
        self.name = name
        self.messages: list[str] = []

    def log(self, msg: str):
        self.messages.append(msg)

l1 = Logger("service")
l2 = Logger()   # возвращает тот же объект, аргументы игнорируются

print(l1 is l2)     # True
l1.log("start")
print(l2.messages)  # ['start'] — оба смотрят на один объект
\`\`\`

---

## Сравнение подходов

| Подход | Потокобезопасность | Наследование | Тестируемость | Питоничность |
|--------|-------------------|--------------|---------------|--------------|
| \`__new__\` | ✅ с Lock | ⚠️ сложно | ⚠️ нужен mock | ❌ низкая |
| Метакласс | ✅ с Lock | ✅ да | ✅ через DI | ✅ высокая |
| Модуль | ✅ GIL + Lock | — | ⚠️ нужна перезагрузка | ✅✅ идиоматично |
| Декоратор | ✅ с Lock | ❌ нет | ✅ через DI | ✅ высокая |

> **Рекомендация**: используйте модульный Singleton для простых случаев (конфиги, логгеры), метакласс — когда нужна иерархия классов-Singleton. В тестах заменяйте Singleton через Dependency Injection.`,
  },
  {
    id: "arch-solid-python-lsp",
    question:
      "Как принципы SOLID проецируются на динамическую типизацию Python? Приведите пример нарушения принципа подстановки Лисков (LSP) в Python-коде.",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## SOLID в контексте Python

Python — динамически типизированный язык с duck typing, поэтому SOLID применяется на уровне **соглашений и инструментов статического анализа**, а не жёстких языковых ограничений.

---

## S — Single Responsibility Principle (принцип единственной ответственности)

Класс должен иметь только одну причину для изменения.

\`\`\`python
# ❌ НАРУШЕНИЕ: класс делает слишком много
class UserManager:
    def get_user(self, user_id: int): ...
    def save_to_db(self, user): ...      # работа с БД
    def send_email(self, user): ...      # отправка почты
    def render_html(self, user): ...    # рендеринг HTML

# ✅ ПРАВИЛЬНО: разделяем ответственности
class UserRepository:
    def get(self, user_id: int): ...
    def save(self, user): ...

class EmailService:
    def send_welcome(self, user): ...

class UserSerializer:
    def to_html(self, user) -> str: ...
\`\`\`

---

## O — Open/Closed Principle (открытости/закрытости)

Код открыт для расширения, закрыт для изменения. В Python реализуется через наследование, протоколы и декораторы.

\`\`\`python
from typing import Protocol

class Formatter(Protocol):
    def format(self, data: dict) -> str: ...

class JsonFormatter:
    def format(self, data: dict) -> str:
        import json
        return json.dumps(data)

class CsvFormatter:
    def format(self, data: dict) -> str:
        return ",".join(str(v) for v in data.values())

# Новый форматтер — без изменения существующего кода:
class XmlFormatter:
    def format(self, data: dict) -> str:
        return "<root>" + "".join(f"<{k}>{v}</{k}>" for k, v in data.items()) + "</root>"

def export(data: dict, formatter: Formatter) -> str:
    return formatter.format(data)   # работает с любым форматтером
\`\`\`

---

## I — Interface Segregation Principle

Клиенты не должны зависеть от интерфейсов, которые они не используют.

\`\`\`python
from typing import Protocol

# ❌ НАРУШЕНИЕ: огромный «жирный» интерфейс
class Animal(Protocol):
    def eat(self): ...
    def swim(self): ...   # не все животные умеют плавать
    def fly(self): ...    # не все умеют летать
    def run(self): ...

# ✅ ПРАВИЛЬНО: тонкие протоколы
class CanSwim(Protocol):
    def swim(self): ...

class CanFly(Protocol):
    def fly(self): ...

class Duck:   # Duck реализует оба протокола естественно
    def swim(self): print("плывёт")
    def fly(self): print("летит")

class Dog:    # Dog реализует только нужные
    def swim(self): print("плывёт по-собачьи")
\`\`\`

---

## D — Dependency Inversion Principle

Зависьте от абстракций, а не от конкретных реализаций.

\`\`\`python
from typing import Protocol

class Storage(Protocol):
    def read(self, key: str) -> bytes: ...
    def write(self, key: str, data: bytes) -> None: ...

class FileStorage:
    def read(self, key: str) -> bytes:
        with open(key, "rb") as f: return f.read()
    def write(self, key: str, data: bytes) -> None:
        with open(key, "wb") as f: f.write(data)

class S3Storage:
    def read(self, key: str) -> bytes: ...
    def write(self, key: str, data: bytes) -> None: ...

class DataProcessor:
    def __init__(self, storage: Storage):   # зависим от абстракции
        self._storage = storage

    def process(self, key: str) -> str:
        data = self._storage.read(key)      # не знаем, где хранится
        return data.decode()
\`\`\`

---

## L — Liskov Substitution Principle: разбор нарушения

**LSP**: объекты подкласса должны быть полностью взаимозаменяемы с объектами родительского класса — без изменения корректности программы.

### Классический пример нарушения: Rectangle → Square

\`\`\`python
class Rectangle:
    def __init__(self, width: float, height: float):
        self._width = width
        self._height = height

    @property
    def width(self) -> float:
        return self._width

    @width.setter
    def width(self, value: float) -> None:
        self._width = value

    @property
    def height(self) -> float:
        return self._height

    @height.setter
    def height(self, value: float) -> None:
        self._height = value

    def area(self) -> float:
        return self._width * self._height


class Square(Rectangle):
    """❌ НАРУШЕНИЕ LSP: Square изменяет поведение сеттеров Rectangle."""

    def __init__(self, side: float):
        super().__init__(side, side)

    @Rectangle.width.setter
    def width(self, value: float) -> None:
        # Квадрат «перегружает» семантику: оба размера меняются вместе
        self._width = value
        self._height = value   # ← этого Rectangle не делал!

    @Rectangle.height.setter
    def height(self, value: float) -> None:
        self._height = value
        self._width = value    # ← и это тоже!


def test_resize(shape: Rectangle) -> None:
    """Функция, написанная для Rectangle, ожидает определённое поведение."""
    shape.width = 10
    shape.height = 5
    expected = 50   # 10 * 5

    actual = shape.area()
    assert actual == expected, f"Ожидали {expected}, получили {actual}"
    print(f"OK: площадь = {actual}")


r = Rectangle(4, 4)
test_resize(r)   # OK: площадь = 50

s = Square(4)
test_resize(s)   # AssertionError: Ожидали 50, получили 25
#                  Square.width.setter изменил height тоже!
#                  LSP нарушен: Square нельзя подставить вместо Rectangle
\`\`\`

### Почему это нарушение LSP?

Контракт \`Rectangle\` говорит: «ширина и высота изменяются независимо». \`Square\` нарушает этот контракт: изменение одной стороны меняет другую. Функция \`test_resize\`, написанная для \`Rectangle\`, ломается при подстановке \`Square\`.

### Правильное решение

\`\`\`python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Square(Shape):
    """Square — не подкласс Rectangle, а независимая фигура."""
    def __init__(self, side: float):
        self.side = side

    def area(self) -> float:
        return self.side ** 2

# Теперь обе фигуры взаимозаменяемы ТОЛЬКО там, где нужна Shape:
def print_area(shape: Shape) -> None:
    print(f"Площадь: {shape.area()}")

print_area(Rectangle(10, 5))   # Площадь: 50
print_area(Square(5))          # Площадь: 25
\`\`\`

### Второй пример нарушения LSP: ужесточение предусловий

\`\`\`python
class BankAccount:
    def withdraw(self, amount: float) -> float:
        """Снять деньги. amount может быть любым положительным числом."""
        return amount

class SavingsAccount(BankAccount):
    def withdraw(self, amount: float) -> float:
        # ❌ НАРУШЕНИЕ: добавляем предусловие, которого не было в базовом классе
        if amount > 1000:
            raise ValueError("Нельзя снять более 1000 за раз!")
        return amount

def process_withdrawal(account: BankAccount, amount: float):
    return account.withdraw(amount)   # ожидает поведение BankAccount

process_withdrawal(BankAccount(), 5000)      # OK
process_withdrawal(SavingsAccount(), 5000)   # ValueError! LSP нарушен
\`\`\`

**Правило LSP в терминах контрактов (Bertrand Meyer)**:
- Предусловия подкласса ≤ предусловия базового класса (нельзя ужесточать)
- Постусловия подкласса ≥ постусловия базового класса (нельзя ослаблять)
- Инварианты базового класса должны соблюдаться в подклассе`,
  },
  {
    id: "arch-gof-patterns-first-class",
    question:
      "Какие классические паттерны проектирования GoF наиболее естественно реализуются в Python благодаря тому, что функции являются объектами первого класса?",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## Функции первого класса в Python

В Python функции — полноправные объекты: их можно передавать как аргументы, возвращать из других функций, хранить в переменных и контейнерах, добавлять атрибуты. Это кардинально упрощает или вовсе устраняет необходимость в некоторых классических GoF-паттернах.

---

## 1. Стратегия (Strategy) — функция вместо класса

**Классический GoF** требует интерфейс \`Strategy\` и отдельный класс для каждой стратегии. В Python стратегия — просто **функция или callable**.

\`\`\`python
from typing import Callable

# ❌ Java-подход в Python (излишне):
class SortStrategy:
    def sort(self, data): ...

class BubbleSort(SortStrategy):
    def sort(self, data): ...

# ✅ Python-подход: функции как стратегии
def bubble_sort(data: list) -> list:
    data = data.copy()
    for i in range(len(data)):
        for j in range(len(data) - i - 1):
            if data[j] > data[j + 1]:
                data[j], data[j + 1] = data[j + 1], data[j]
    return data

def quick_sort(data: list) -> list:
    if len(data) <= 1: return data
    pivot = data[len(data) // 2]
    left = [x for x in data if x < pivot]
    mid  = [x for x in data if x == pivot]
    right = [x for x in data if x > pivot]
    return quick_sort(left) + mid + quick_sort(right)

SortFunc = Callable[[list], list]

class Sorter:
    def __init__(self, strategy: SortFunc = sorted):
        self._strategy = strategy

    def sort(self, data: list) -> list:
        return self._strategy(data)

# Переключение стратегии на лету:
s = Sorter(bubble_sort)
print(s.sort([3, 1, 4, 1, 5]))   # [1, 1, 3, 4, 5]

s = Sorter(quick_sort)
print(s.sort([3, 1, 4, 1, 5]))   # [1, 1, 3, 4, 5]

# Встроенная sorted тоже подходит:
s = Sorter(sorted)
print(s.sort([3, 1, 4, 1, 5]))   # [1, 1, 3, 4, 5]
\`\`\`

---

## 2. Команда (Command) — функция вместо класса Command

\`\`\`python
from typing import Callable
from collections import deque

Command = Callable[[], None]

class CommandProcessor:
    """Очередь команд с поддержкой undo."""

    def __init__(self):
        self._history: deque[tuple[Command, Command]] = deque()

    def execute(self, do: Command, undo: Command) -> None:
        do()
        self._history.append((do, undo))

    def undo(self) -> None:
        if self._history:
            _, undo = self._history.pop()
            undo()

# Использование с lambda и замыканиями — никаких классов:
document = ["line1", "line2"]

processor = CommandProcessor()

def add_line(text: str):
    def do():
        document.append(text)
        print(f"Добавлено: {text!r}")
    def undo():
        document.remove(text)
        print(f"Отменено добавление: {text!r}")
    return do, undo

do, undo = add_line("line3")
processor.execute(do, undo)
print(document)   # ['line1', 'line2', 'line3']

processor.undo()
print(document)   # ['line1', 'line2']
\`\`\`

---

## 3. Шаблонный метод (Template Method) — функции вместо абстрактного класса

Классический Template Method требует наследования. В Python — через функции высшего порядка:

\`\`\`python
from typing import Callable, TypeVar, Generic

T = TypeVar("T")

def data_pipeline(
    source: Callable[[], list],
    transform: Callable[[list], list],
    sink: Callable[[list], None],
) -> None:
    """Шаблонный алгоритм пайплайна: получи → преобразуй → сохрани."""
    raw = source()
    processed = transform(raw)
    sink(processed)

# Разные вариации без единого подкласса:
data_pipeline(
    source  = lambda: [3, 1, 4, 1, 5, 9, 2, 6],
    transform = lambda d: sorted(set(d)),
    sink    = lambda d: print("В файл:", d),
)

data_pipeline(
    source  = lambda: ["  hello  ", "WORLD", "python"],
    transform = lambda d: [s.strip().lower() for s in d],
    sink    = lambda d: print("В БД:", d),
)
\`\`\`

---

## 4. Наблюдатель (Observer) — функции как обработчики событий

\`\`\`python
from typing import Callable, Any
from collections import defaultdict

EventHandler = Callable[..., None]

class EventBus:
    """Простой Event Bus: подписчики — любые callable."""

    def __init__(self):
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event: str, handler: EventHandler) -> None:
        self._handlers[event].append(handler)

    def unsubscribe(self, event: str, handler: EventHandler) -> None:
        self._handlers[event].remove(handler)

    def publish(self, event: str, **data: Any) -> None:
        for handler in self._handlers[event]:
            handler(**data)

bus = EventBus()

# Обработчики — просто функции (не классы):
def send_email(user_id: int, **_):
    print(f"Email отправлен пользователю {user_id}")

def update_cache(user_id: int, **_):
    print(f"Кэш обновлён для пользователя {user_id}")

def log_event(event_name: str = "?", **data):
    print(f"[LOG] {event_name}: {data}")

bus.subscribe("user.registered", send_email)
bus.subscribe("user.registered", update_cache)
bus.subscribe("user.registered", lambda **kw: log_event("user.registered", **kw))

bus.publish("user.registered", user_id=42, email="alice@example.com")
# Email отправлен пользователю 42
# Кэш обновлён для пользователя 42
# [LOG] user.registered: {'user_id': 42, 'email': 'alice@example.com'}
\`\`\`

---

## 5. Декоратор (Decorator GoF) — через Python-декораторы

GoF Decorator расширяет поведение объекта. В Python это нативный синтаксис:

\`\`\`python
import functools
import time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.monotonic()
        result = func(*args, **kwargs)
        print(f"{func.__name__}: {time.monotonic() - start:.3f}с")
        return result
    return wrapper

def cached(func):
    @functools.wraps(func)
    @functools.cache
    def wrapper(*args):
        return func(*args)
    return wrapper

def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"▶ {func.__name__}({args}, {kwargs})")
        result = func(*args, **kwargs)
        print(f"◀ {func.__name__} → {result!r}")
        return result
    return wrapper

# Стекование декораторов — как стекование GoF Decorator:
@timed
@logged
@cached
def fibonacci(n: int) -> int:
    if n < 2: return n
    return fibonacci(n - 1) + fibonacci(n - 2)

fibonacci(10)   # выводит лог и время, результат кэшируется
\`\`\`

---

## 6. Фабрика (Factory) — через dict или functools.partial

\`\`\`python
import functools

class JsonSerializer:
    def serialize(self, data): import json; return json.dumps(data)

class CsvSerializer:
    def serialize(self, data): return ",".join(str(v) for v in data.values())

# Фабрика через словарь callable — никакого switch/if:
_serializers: dict[str, type] = {
    "json": JsonSerializer,
    "csv": CsvSerializer,
}

def get_serializer(fmt: str):
    cls = _serializers.get(fmt)
    if cls is None:
        raise ValueError(f"Неизвестный формат: {fmt!r}. Доступны: {list(_serializers)}")
    return cls()

s = get_serializer("json")
print(s.serialize({"name": "Alice", "age": 30}))   # {"name": "Alice", "age": 30}
\`\`\`

---

## Итог: паттерны GoF и их Python-эквиваленты

| GoF-паттерн | Python-идиома |
|-------------|---------------|
| Strategy | Callable / функция как аргумент |
| Command | Замыкание / functools.partial |
| Template Method | Функция высшего порядка |
| Observer | Список callable / EventBus |
| Decorator | \`@decorator\` синтаксис |
| Factory Method | dict[str, type] + вызов |
| Iterator | Генератор / \`__iter__\` + \`__next__\` |
| Chain of Responsibility | Список/цепочка callable |`,
  },
  {
    id: "arch-clean-architecture-ddd",
    question:
      "В чём разница между архитектурными подходами Clean Architecture и Domain-Driven Design (DDD) при их реализации на языке Python?",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## Clean Architecture

Clean Architecture (Роберт Мартин, «Дядя Боб») — это принцип **изоляции зависимостей**: внутренние слои не знают о внешних. Зависимости направлены **только внутрь** — от деталей реализации к бизнес-логике.

\`\`\`
┌─────────────────────────────────────────┐
│  Frameworks & Drivers (FastAPI, SQLAlchemy, Redis)  │  ← Внешний мир
│  ┌───────────────────────────────────┐  │
│  │  Interface Adapters               │  │  ← Контроллеры, репозитории, presenters
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Application / Use Cases    │  │  │  ← Бизнес-сценарии (оркестрация)
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  Entities / Domain    │  │  │  │  ← Бизнес-правила (чистые классы)
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
Зависимости → только внутрь
\`\`\`

### Пример структуры проекта (Clean Architecture)

\`\`\`
src/
  domain/              # Entities: чистые Python-классы, 0 зависимостей
    models.py
    exceptions.py
  application/         # Use Cases: оркестрирует domain, зависит от интерфейсов
    use_cases/
      create_order.py
    ports/             # Интерфейсы (Protocol) — абстракции для внешнего мира
      repositories.py
  infrastructure/      # Adapters: реализации портов (SQLAlchemy, Redis, HTTP)
    db/
      sqlalchemy_order_repo.py
    http/
      fastapi_router.py
\`\`\`

\`\`\`python
# domain/models.py — нет импортов из SQLAlchemy, FastAPI и т.д.
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

@dataclass
class OrderItem:
    product_id: str
    quantity: int
    unit_price: Decimal

    @property
    def subtotal(self) -> Decimal:
        return self.quantity * self.unit_price

@dataclass
class Order:
    id: str
    customer_id: str
    items: list[OrderItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def total(self) -> Decimal:
        return sum(item.subtotal for item in self.items)

    def add_item(self, item: OrderItem) -> None:
        if item.quantity <= 0:
            raise ValueError("Количество должно быть положительным")
        self.items.append(item)


# application/ports/repositories.py — интерфейс (Protocol)
from typing import Protocol
from domain.models import Order

class OrderRepository(Protocol):
    def save(self, order: Order) -> None: ...
    def get_by_id(self, order_id: str) -> Order | None: ...
    def list_by_customer(self, customer_id: str) -> list[Order]: ...


# application/use_cases/create_order.py — Use Case
from domain.models import Order, OrderItem
from application.ports.repositories import OrderRepository
import uuid

class CreateOrderUseCase:
    def __init__(self, repository: OrderRepository):
        self._repo = repository   # зависим от абстракции, не от SQLAlchemy

    def execute(self, customer_id: str, items: list[dict]) -> Order:
        order = Order(id=str(uuid.uuid4()), customer_id=customer_id)
        for item_data in items:
            order.add_item(OrderItem(**item_data))
        self._repo.save(order)
        return order


# infrastructure/db/sqlalchemy_order_repo.py — реализация порта
from sqlalchemy.orm import Session
from domain.models import Order
from application.ports.repositories import OrderRepository

class SQLAlchemyOrderRepository:
    def __init__(self, session: Session):
        self._session = session

    def save(self, order: Order) -> None:
        # маппинг domain → ORM-модель
        ...

    def get_by_id(self, order_id: str) -> Order | None:
        ...

    def list_by_customer(self, customer_id: str) -> list[Order]:
        ...
\`\`\`

---

## Domain-Driven Design (DDD)

DDD — это **методология моделирования** сложной предметной области совместно с экспертами. Фокус — на **языке предметной области** (Ubiquitous Language) и богатых доменных моделях.

### Ключевые концепции DDD в Python

\`\`\`python
from dataclasses import dataclass
from decimal import Decimal
from typing import NewType

# Value Object — иммутабельный, идентичность = значения полей
@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Сумма не может быть отрицательной")

    def __add__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"Нельзя складывать {self.currency} и {other.currency}")
        return Money(self.amount + other.amount, self.currency)

    def __mul__(self, factor: int | Decimal) -> "Money":
        return Money(self.amount * Decimal(str(factor)), self.currency)

# Entity — идентичность = ID, поля могут меняться
CustomerId = NewType("CustomerId", str)
ProductId = NewType("ProductId", str)

@dataclass
class Customer:
    id: CustomerId
    name: str
    email: str

    def change_email(self, new_email: str) -> None:
        if "@" not in new_email:
            raise ValueError("Некорректный email")
        self.email = new_email   # мутация разрешена

# Aggregate Root — корень агрегата, точка входа для изменений
@dataclass
class Cart:
    """Агрегат: Корзина. Внешний код взаимодействует только с Cart, не с CartItem."""

    customer_id: CustomerId
    _items: dict[ProductId, int] = field(default_factory=dict)
    _events: list = field(default_factory=list)   # Domain Events

    def add_product(self, product_id: ProductId, qty: int) -> None:
        if qty <= 0:
            raise ValueError("Количество должно быть > 0")
        self._items[product_id] = self._items.get(product_id, 0) + qty
        self._events.append({"type": "ProductAdded", "product_id": product_id, "qty": qty})

    def remove_product(self, product_id: ProductId) -> None:
        if product_id not in self._items:
            raise KeyError(f"Товар {product_id} не в корзине")
        del self._items[product_id]

    def total_items(self) -> int:
        return sum(self._items.values())

    def pop_events(self) -> list:
        events, self._events = self._events, []
        return events

# Domain Service — операция, которая не принадлежит одной Entity
class PricingService:
    def calculate_cart_total(self, cart: Cart, prices: dict[ProductId, Money]) -> Money:
        total = Money(Decimal("0"), "RUB")
        for product_id, qty in cart._items.items():
            price = prices.get(product_id, Money(Decimal("0"), "RUB"))
            total = total + price * qty
        return total
\`\`\`

---

## Ключевые различия

| Аспект | Clean Architecture | DDD |
|--------|-------------------|-----|
| **Главный фокус** | Изоляция зависимостей | Моделирование предметной области |
| **Центр** | Слои и границы | Ubiquitous Language и агрегаты |
| **Применимость** | Любой сложности | Сложные, богатые домены |
| **Артефакты** | Use Cases, Ports, Adapters | Entities, Value Objects, Aggregates, Domain Events |
| **Совместимость** | Часто используются вместе | Часто используются вместе |

### Совместное использование (рекомендуется)

\`\`\`python
# DDD даёт язык для Domain-слоя Clean Architecture:
#
# Clean Architecture:            DDD концепции:
# ┌─ Entities / Domain ──────────── Aggregates, Value Objects, Domain Events
# ├─ Use Cases ──────────────────── Application Services
# ├─ Interface Adapters ─────────── Repositories (интерфейс), DTO
# └─ Infrastructure ─────────────── Repositories (реализация), ORM
\`\`\`

---

## Bounded Context в Python

\`\`\`python
# DDD: разные контексты — разные модели одного понятия
# "Пользователь" в контексте Авторизации ≠ "Пользователь" в контексте Заказов

# auth/domain/user.py
@dataclass
class AuthUser:
    id: str
    email: str
    password_hash: str
    roles: list[str]

# orders/domain/customer.py
@dataclass
class Customer:
    id: str        # тот же ID, но другая модель!
    name: str
    shipping_address: str
    preferred_currency: str

# Anti-Corruption Layer: перевод между контекстами
class CustomerFromAuthAdapter:
    def from_auth_user(self, auth_user: "AuthUser") -> Customer:
        return Customer(
            id=auth_user.id,
            name=auth_user.email.split("@")[0],  # предположение
            shipping_address="",
            preferred_currency="RUB",
        )
\`\`\``,
  },
  {
    id: "arch-dependency-injection-vs-service-locator",
    question:
      "Как организовать слабую связность модулей в крупном проекте на Python? Использование фреймворков внедрения зависимостей (Dependency Injection) против паттерна Service Locator.",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## Проблема: тесная связность (tight coupling)

Когда модуль сам создаёт свои зависимости — он тесно связан с конкретными реализациями. Это затрудняет тестирование и замену компонентов.

\`\`\`python
# ❌ Тесная связность — модуль сам создаёт зависимости
class OrderService:
    def __init__(self):
        # Жёстко прибито: нельзя заменить на тест-дублёр без monkey-patching
        self._repo = PostgresOrderRepository()   # конкретный класс
        self._email = SmtpEmailService()         # конкретный класс
        self._logger = FileLogger("orders.log")  # конкретный класс

    def create_order(self, data): ...
\`\`\`

---

## Service Locator — антипаттерн

Service Locator — это глобальный реестр, из которого любой компонент получает свои зависимости. Считается **антипаттерном** (Mark Seemann), потому что скрывает зависимости.

\`\`\`python
# ❌ Service Locator (избегайте в больших проектах)
class ServiceLocator:
    _services: dict = {}

    @classmethod
    def register(cls, name: str, service) -> None:
        cls._services[name] = service

    @classmethod
    def get(cls, name: str):
        if name not in cls._services:
            raise KeyError(f"Сервис '{name}' не зарегистрирован")
        return cls._services[name]

# Регистрация при старте приложения:
ServiceLocator.register("order_repo", PostgresOrderRepository())
ServiceLocator.register("email", SmtpEmailService())

class OrderService:
    def create_order(self, data):
        repo = ServiceLocator.get("order_repo")   # ← скрытая зависимость!
        email = ServiceLocator.get("email")       # ← нет сигнатуры!
        ...

# ПРОБЛЕМЫ Service Locator:
# 1. Зависимости OrderService скрыты — их не видно из сигнатуры __init__
# 2. В тесте нужно «магически» заменять глобальный реестр
# 3. Нет гарантий, что нужный сервис зарегистрирован до вызова
\`\`\`

---

## Dependency Injection (DI) — правильный подход

DI: зависимости **передаются снаружи** через конструктор или метод. Это делает зависимости явными.

### Базовый DI вручную

\`\`\`python
from typing import Protocol

# Интерфейсы (Protocol) — абстракции
class OrderRepository(Protocol):
    def save(self, order): ...
    def get_by_id(self, id: str): ...

class EmailService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class Logger(Protocol):
    def info(self, msg: str) -> None: ...

# ✅ Зависимости явно объявлены в __init__
class OrderService:
    def __init__(
        self,
        repository: OrderRepository,
        email_service: EmailService,
        logger: Logger,
    ):
        self._repo = repository
        self._email = email_service
        self._logger = logger

    def create_order(self, customer_id: str, items: list) -> dict:
        order = {"id": "order-1", "customer_id": customer_id, "items": items}
        self._repo.save(order)
        self._email.send(customer_id, "Заказ создан", f"Ваш заказ: {order['id']}")
        self._logger.info(f"Создан заказ {order['id']}")
        return order

# Тест: передаём заглушки
class FakeRepository:
    def __init__(self): self.saved = []
    def save(self, order): self.saved.append(order)
    def get_by_id(self, id): return next((o for o in self.saved if o["id"] == id), None)

class FakeEmailService:
    def __init__(self): self.sent = []
    def send(self, to, subject, body): self.sent.append((to, subject, body))

class FakeLogger:
    def __init__(self): self.messages = []
    def info(self, msg): self.messages.append(msg)

# Тест без моков, без патчинга, без глобального состояния:
repo = FakeRepository()
email = FakeEmailService()
logger = FakeLogger()
service = OrderService(repo, email, logger)

result = service.create_order("user-1", [{"product": "book"}])
assert len(repo.saved) == 1
assert len(email.sent) == 1
assert "order-1" in logger.messages[0]
print("✅ Все проверки прошли")
\`\`\`

---

## DI с Composition Root

Все зависимости собираются в одном месте — **Composition Root** (обычно точка входа приложения):

\`\`\`python
# composition_root.py — единственное место, где знают о конкретных реализациях
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from infrastructure.db.order_repo import SQLAlchemyOrderRepository
from infrastructure.email.smtp import SmtpEmailService
from infrastructure.logging.structured import StructuredLogger
from application.order_service import OrderService

def build_order_service() -> OrderService:
    """Фабрика: собирает граф зависимостей."""
    engine = create_engine(os.environ["DATABASE_URL"])
    Session = sessionmaker(bind=engine)
    session = Session()

    return OrderService(
        repository    = SQLAlchemyOrderRepository(session),
        email_service = SmtpEmailService(
            host=os.environ["SMTP_HOST"],
            port=int(os.environ["SMTP_PORT"]),
        ),
        logger        = StructuredLogger("orders"),
    )

# main.py / FastAPI lifespan:
# order_service = build_order_service()
\`\`\`

---

## DI-фреймворки для Python

### dependency-injector (самый популярный)

\`\`\`python
from dependency_injector import containers, providers
from dependency_injector.wiring import inject, Provide

class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    db_session = providers.Resource(
        init_db_session,
        url=config.db.url,
    )

    order_repository = providers.Factory(
        SQLAlchemyOrderRepository,
        session=db_session,
    )

    email_service = providers.Singleton(
        SmtpEmailService,
        host=config.smtp.host,
        port=config.smtp.port,
    )

    order_service = providers.Factory(
        OrderService,
        repository=order_repository,
        email_service=email_service,
    )

# FastAPI интеграция:
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/orders")
@inject
async def create_order(
    data: dict,
    service: OrderService = Depends(Provide[Container.order_service]),
):
    return service.create_order(data["customer_id"], data["items"])
\`\`\`

---

## Сравнение подходов

| Критерий | Service Locator | DI (вручную) | DI-фреймворк |
|----------|----------------|--------------|--------------|
| Явность зависимостей | ❌ Скрыты | ✅ В сигнатуре | ✅ В контейнере |
| Тестируемость | ⚠️ Нужен патчинг | ✅ Отлично | ✅ Отлично |
| Управление временем жизни | ❌ Вручную | ⚠️ Вручную | ✅ Автоматически |
| Сложность настройки | Низкая | Средняя | Высокая |
| Подходит для | Маленьких проектов | Средних | Крупных |`,
  },
  {
    id: "arch-sqlalchemy-session-n-plus-one",
    question:
      "Каковы особенности работы с сессиями в SQLAlchemy (Scoped Session, AsyncSession)? Как избежать проблемы N+1 запросов при работе с ORM?",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## Сессии в SQLAlchemy

Сессия (\`Session\`) — это **Unit of Work**: она отслеживает все изменения объектов и фиксирует их в БД за один коммит. Сессия работает как кэш первого уровня (identity map) — один объект с одним \`id\` загружается из БД только один раз за сессию.

\`\`\`python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, DeclarativeBase, Mapped, mapped_column, relationship

engine = create_engine("postgresql+psycopg2://user:pass@localhost/db", echo=True)

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    orders: Mapped[list["Order"]] = relationship(back_populates="user")

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column()
    total: Mapped[float]
    user: Mapped["User"] = relationship(back_populates="orders")

Base.metadata.create_all(engine)
\`\`\`

---

## Базовое использование Session

\`\`\`python
# Контекстный менеджер — автоматический rollback при ошибке
with Session(engine) as session:
    user = User(name="Alice")
    session.add(user)
    session.flush()   # → INSERT, но без COMMIT; получаем user.id
    print(f"ID (до commit): {user.id}")
    session.commit()  # → COMMIT

# session.close() вызывается автоматически

# Чтение:
with Session(engine) as session:
    user = session.get(User, 1)   # поиск по PK, с кэшем identity map
    users = session.execute(
        select(User).where(User.name == "Alice")
    ).scalars().all()
\`\`\`

---

## Scoped Session

\`scoped_session\` — это **прокси**, который создаёт или возвращает существующую сессию для текущего потока (или любого другого «скоупа»). Используется во Flask, CLI, многопоточных приложениях.

\`\`\`python
from sqlalchemy.orm import scoped_session, sessionmaker
import threading

session_factory = sessionmaker(bind=engine)
ScopedSession = scoped_session(session_factory)

# В потоке A:
def thread_a():
    session = ScopedSession()          # создаётся новая сессия для потока A
    user = session.get(User, 1)
    session.commit()
    ScopedSession.remove()             # ВАЖНО: освободить сессию по завершении

# В потоке B:
def thread_b():
    session = ScopedSession()          # другая сессия, независимая от потока A
    user = session.get(User, 2)
    ScopedSession.remove()

# Каждый поток получает свою изолированную сессию
ta = threading.Thread(target=thread_a)
tb = threading.Thread(target=thread_b)
ta.start(); tb.start()
ta.join(); tb.join()

# Flask-пример: сессия на HTTP-запрос
# from flask import Flask
# app = Flask(__name__)
# @app.teardown_appcontext
# def shutdown_session(exception=None):
#     ScopedSession.remove()   # ← освобождаем после каждого запроса
\`\`\`

---

## AsyncSession — асинхронные сессии

\`\`\`python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    echo=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    expire_on_commit=False,  # объекты доступны после commit без повторной загрузки
)

async def create_user(name: str) -> User:
    async with AsyncSessionLocal() as session:
        async with session.begin():   # автоматический commit/rollback
            user = User(name=name)
            session.add(user)
        return user   # объект доступен (expire_on_commit=False)

async def get_users() -> list[User]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        return result.scalars().all()

# FastAPI dependency:
from fastapi import Depends
from collections.abc import AsyncGenerator

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
\`\`\`

---

## Проблема N+1 запросов

N+1 возникает, когда для N объектов выполняется N дополнительных запросов (ленивая загрузка в цикле):

\`\`\`python
# ❌ N+1 ПРОБЛЕМА:
with Session(engine) as session:
    users = session.execute(select(User)).scalars().all()
    # 1 запрос: SELECT * FROM users

    for user in users:
        print(user.orders)
        # N запросов: SELECT * FROM orders WHERE user_id = ?
        # Итого: 1 + N запросов!
\`\`\`

---

## Решение 1: joinedload — JOIN в одном запросе

\`\`\`python
from sqlalchemy.orm import joinedload

with Session(engine) as session:
    users = session.execute(
        select(User).options(joinedload(User.orders))
    ).unique().scalars().all()
    # Один запрос с LEFT OUTER JOIN
    # SELECT users.*, orders.* FROM users LEFT JOIN orders ON ...

    for user in users:
        print(user.orders)   # данные уже в памяти — без запросов
\`\`\`

---

## Решение 2: selectinload — отдельный IN-запрос (рекомендуется для коллекций)

\`\`\`python
from sqlalchemy.orm import selectinload

with Session(engine) as session:
    users = session.execute(
        select(User).options(selectinload(User.orders))
    ).scalars().all()
    # Запрос 1: SELECT * FROM users
    # Запрос 2: SELECT * FROM orders WHERE user_id IN (1, 2, 3, ...)
    # Итого: ВСЕГДА 2 запроса, независимо от количества пользователей

    for user in users:
        print(user.orders)   # без дополнительных запросов
\`\`\`

### Когда что использовать

| Стратегия | SQL | Лучше для |
|-----------|-----|-----------|
| \`joinedload\` | JOIN | Много-к-одному (order → user), маленькие коллекции |
| \`selectinload\` | SELECT ... IN (...) | Один-ко-многим (user → orders), большие коллекции |
| \`subqueryload\` | Подзапрос | Устаревший, предпочитайте selectinload |
| \`raiseload\` | — | Запрет ленивой загрузки (для отладки N+1) |

---

## Решение 3: raiseload — выявление N+1 при разработке

\`\`\`python
from sqlalchemy.orm import raiseload

# Используйте raiseload в разработке, чтобы сразу видеть N+1:
with Session(engine) as session:
    users = session.execute(
        select(User).options(raiseload("*"))   # любой lazy-load → исключение
    ).scalars().all()

    for user in users:
        try:
            print(user.orders)   # ← MissingGreenlet / Exception!
        except Exception as e:
            print(f"N+1 обнаружен: {e}")   # сразу видно проблему
\`\`\`

---

## Решение 4: явный JOIN + агрегация (для производительности)

\`\`\`python
from sqlalchemy import func, select

# Вместо загрузки всех объектов — агрегируем на уровне SQL:
with Session(engine) as session:
    result = session.execute(
        select(
            User.id,
            User.name,
            func.count(Order.id).label("order_count"),
            func.sum(Order.total).label("total_spent"),
        )
        .outerjoin(Order, User.id == Order.user_id)
        .group_by(User.id, User.name)
    ).all()

    for row in result:
        print(f"{row.name}: {row.order_count} заказов, {row.total_spent:.2f}₽")
    # Один запрос вместо N+1
\`\`\`

---

## Итоговые рекомендации

\`\`\`python
# 1. Устанавливайте lazy="raise" по умолчанию для выявления N+1:
class User(Base):
    orders: Mapped[list["Order"]] = relationship(
        back_populates="user",
        lazy="raise",   # ← любой lazy-load поднимет ошибку
    )

# 2. Явно указывайте eager loading в Use Case:
users = session.execute(
    select(User).options(selectinload(User.orders))
).scalars().all()

# 3. Используйте expire_on_commit=False в async:
AsyncSessionLocal = async_sessionmaker(expire_on_commit=False)

# 4. Логируйте SQL в разработке:
engine = create_engine(url, echo=True)   # все SQL в stdout
\`\`\``,
  },
  {
    id: "arch-alembic-migrations",
    question:
      "Как устроены миграции в Alembic под капотом и как безопасно проводить миграции для высоконагруженных таблиц (например, добавление колонки с дефолтным значением)?",
    category: "Архитектура, паттерны проектирования и базы данных",
    difficulty: "senior",
    answer: `## Как Alembic работает под капотом

Alembic — инструмент миграций для SQLAlchemy. Он хранит историю изменений схемы в виде **DAG (направленного ациклического графа)** Python-файлов, а текущую версию базы — в таблице \`alembic_version\`.

### Структура файла миграции

\`\`\`python
# migrations/versions/a1b2c3d4_add_status_column.py
"""add status column to orders

Revision ID: a1b2c3d4e5f6
Revises: 9z8y7x6w5v4u
Create Date: 2024-01-15 10:30:00
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"     # ID этой миграции
down_revision = "9z8y7x6w5v4u" # ID предыдущей (родительской)
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Применить изменения схемы."""
    op.add_column(
        "orders",
        sa.Column("status", sa.String(20), nullable=True)
    )

def downgrade() -> None:
    """Откатить изменения схемы."""
    op.drop_column("orders", "status")
\`\`\`

### Цепочка миграций

\`\`\`
0000 (base)
  ↓
abc1 — create_users_table
  ↓
abc2 — create_orders_table
  ↓
abc3 — add_status_column  ← текущая версия в alembic_version
\`\`\`

\`\`\`python
# alembic.ini — базовая конфигурация
# sqlalchemy.url = postgresql://user:pass@localhost/db

# env.py — подключение метаданных SQLAlchemy
from myapp.models import Base

def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section))
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,   # Alembic сравнивает с этими метаданными
        )
        with context.begin_transaction():
            context.run_migrations()
\`\`\`

### Основные команды

\`\`\`bash
# Создать новую миграцию вручную:
alembic revision -m "add status column"

# Автогенерация по diff с моделями (не всегда идеальна!):
alembic revision --autogenerate -m "add status column"

# Применить все новые миграции:
alembic upgrade head

# Применить конкретную версию:
alembic upgrade a1b2c3d4

# Откатить одну миграцию:
alembic downgrade -1

# Откатить до базы:
alembic downgrade base

# Текущая версия в БД:
alembic current

# История миграций:
alembic history --verbose
\`\`\`

---

## Проблема: миграции на высоконагруженных таблицах

Некоторые DDL-операции в PostgreSQL берут **ACCESS EXCLUSIVE LOCK** — блокируют все чтения и записи таблицы на всё время операции. Для таблицы с миллионами строк это может занять минуты и заблокировать продакшн.

### Опасные операции

\`\`\`sql
-- ❌ БЛОКИРУЕТ ТАБЛИЦУ на всё время (переписывает все строки):
ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
-- PostgreSQL должен пройтись по всем строкам и проставить дефолт!

-- ❌ Также блокирует:
ALTER TABLE orders ADD CONSTRAINT ...;
CREATE INDEX ON orders (status);  -- без CONCURRENTLY
\`\`\`

---

## Безопасная стратегия: трёхфазная миграция

### Фаза 1: Добавить колонку как nullable без дефолта

\`\`\`python
# migrations/versions/phase1_add_nullable_status.py
def upgrade() -> None:
    # ✅ Мгновенно: PostgreSQL просто обновляет метаданные таблицы
    op.add_column(
        "orders",
        sa.Column("status", sa.String(20), nullable=True)
        # НЕТ DEFAULT → не переписывает строки → быстро!
    )

def downgrade() -> None:
    op.drop_column("orders", "status")
\`\`\`

### Фаза 2: Батчевое заполнение существующих строк

\`\`\`python
# migrations/versions/phase2_backfill_status.py
def upgrade() -> None:
    # ✅ Обновляем батчами, чтобы не держать длинную транзакцию
    connection = op.get_bind()

    batch_size = 5000
    offset = 0

    while True:
        result = connection.execute(
            sa.text("""
                UPDATE orders
                SET status = 'pending'
                WHERE id IN (
                    SELECT id FROM orders
                    WHERE status IS NULL
                    ORDER BY id
                    LIMIT :batch_size
                )
            """),
            {"batch_size": batch_size},
        )
        updated = result.rowcount
        print(f"Обновлено {updated} строк (смещение {offset})")

        if updated < batch_size:
            break   # дошли до конца
        offset += batch_size

def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("UPDATE orders SET status = NULL"))
\`\`\`

### Фаза 3: Добавить NOT NULL constraint и дефолт

\`\`\`python
# migrations/versions/phase3_make_status_not_null.py
def upgrade() -> None:
    # ✅ NOT NULL VALIDATE — PostgreSQL 9.2+: добавляет constraint без полного скана
    # сначала добавляем как NOT VALID (без проверки старых строк):
    op.execute(
        "ALTER TABLE orders ADD CONSTRAINT orders_status_not_null "
        "CHECK (status IS NOT NULL) NOT VALID"
    )
    # затем валидируем (только ShareUpdateExclusiveLock — не блокирует записи):
    op.execute(
        "ALTER TABLE orders VALIDATE CONSTRAINT orders_status_not_null"
    )

    # Устанавливаем DEFAULT для новых строк (мгновенно в PostgreSQL 11+):
    op.alter_column("orders", "status", server_default="pending")

def downgrade() -> None:
    op.alter_column("orders", "status", server_default=None)
    op.execute("ALTER TABLE orders DROP CONSTRAINT orders_status_not_null")
\`\`\`

---

## Безопасное создание индекса: CONCURRENTLY

\`\`\`python
def upgrade() -> None:
    # ❌ НЕ ДЕЛАЙТЕ ТАК: блокирует таблицу
    # op.create_index("ix_orders_status", "orders", ["status"])

    # ✅ CONCURRENTLY: индекс строится без блокировки, но вне транзакции
    op.execute(
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_orders_status ON orders (status)"
    )

def downgrade() -> None:
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_orders_status")
\`\`\`

> **Важно**: \`CREATE INDEX CONCURRENTLY\` нельзя выполнить внутри транзакции. Alembic по умолчанию оборачивает миграцию в транзакцию. Нужно отключить:

\`\`\`python
# В файле миграции:
# alembic.op не поддерживает CONCURRENTLY в транзакции → используем Raw SQL

# env.py: для таких миграций выключаем транзакцию
def run_migrations_online():
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            transaction_per_migration=True,   # ← каждая миграция в своей транзакции
        )
\`\`\`

\`\`\`python
# В самом файле миграции можно явно указать:
# (Alembic 1.7+)
def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("CREATE INDEX CONCURRENTLY ...")
\`\`\`

---

## lock_timeout и statement_timeout

\`\`\`python
def upgrade() -> None:
    # Устанавливаем таймаут блокировки: если не можем получить lock за 2с — отменяем
    op.execute("SET lock_timeout = '2s'")
    op.execute("SET statement_timeout = '30s'")

    # Безопасная операция с ограниченным lock_timeout:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(500), nullable=True),
    )
\`\`\`

---

## Итоговая шпаргалка безопасных миграций

| Операция | Риск | Безопасный способ |
|----------|------|-------------------|
| Добавить nullable колонку | ✅ Низкий | Сразу, без дефолта |
| Добавить NOT NULL колонку с дефолтом | ❌ Высокий | 3 фазы (add → backfill → constraint) |
| Создать индекс | ❌ Высокий | \`CREATE INDEX CONCURRENTLY\` |
| Добавить FK constraint | ❌ Высокий | \`NOT VALID\` → \`VALIDATE CONSTRAINT\` |
| Переименовать колонку | ❌ Высокий | Добавить новую → скопировать → удалить старую |
| DROP COLUMN | ⚠️ Средний | Сначала убрать из кода, потом мигрировать |`,
  },
  {
    id: "oop-functools-wraps-parametrized-decorator",
    question:
      "Как работает декоратор функции, сохраняющий сигнатуру (использование functools.wraps), и как правильно написать параметризованный декоратор класса?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Проблема: декоратор «съедает» метаданные функции

Когда вы оборачиваете функцию в декоратор, обёртка (\`wrapper\`) заменяет оригинальную функцию. Вместе с ней теряются \`__name__\`, \`__doc__\`, \`__annotations__\`, \`__module__\`, \`__qualname__\` и \`__wrapped__\`.

\`\`\`python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("до вызова")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """Приветствует пользователя."""
    return f"Hello, {name}"

print(greet.__name__)   # 'wrapper'   ← потеряли!
print(greet.__doc__)    # None        ← потеряли!
help(greet)             # покажет справку по wrapper, а не по greet
\`\`\`

---

## functools.wraps — правильное решение

\`functools.wraps\` — это сам декоратор, который копирует метаданные оригинальной функции в обёртку. Под капотом он вызывает \`functools.update_wrapper(wrapper, func)\`.

\`\`\`python
import functools

def my_decorator(func):
    @functools.wraps(func)   # ← копируем __name__, __doc__, __annotations__ и т.д.
    def wrapper(*args, **kwargs):
        print("до вызова")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """Приветствует пользователя."""
    return f"Hello, {name}"

print(greet.__name__)       # 'greet'                       ✅
print(greet.__doc__)        # 'Приветствует пользователя.'  ✅
print(greet.__wrapped__)    # <function greet at 0x...>     ✅ ссылка на оригинал
\`\`\`

### Что именно копируется

\`functools.WRAPPER_ASSIGNMENTS\` — кортеж атрибутов, которые **присваиваются** обёртке:

\`\`\`python
import functools
print(functools.WRAPPER_ASSIGNMENTS)
# ('__module__', '__name__', '__qualname__', '__annotations__',
#  '__annotate__', '__doc__', '__dict__', '__type_params__')
# + добавляется __wrapped__ = func
\`\`\`

---

## Параметризованный декоратор — трёхуровневая вложенность

Декоратор с параметрами — это **фабрика декораторов**: функция, которая принимает параметры и **возвращает декоратор**.

\`\`\`python
import functools
import time

def retry(max_attempts: int = 3, delay: float = 1.0):
    """Фабрика декораторов: повторяет вызов при исключении."""
    def decorator(func):            # ← настоящий декоратор
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    last_exc = exc
                    print(f"Попытка {attempt}/{max_attempts} неудачна: {exc}")
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator   # ← возвращаем декоратор из фабрики

@retry(max_attempts=3, delay=0.5)
def fetch_data(url: str) -> dict:
    """Загружает данные по URL."""
    import random
    if random.random() < 0.7:
        raise ConnectionError("Нет соединения")
    return {"data": "ok"}

print(fetch_data.__name__)   # 'fetch_data' ← сохранено благодаря wraps
print(fetch_data.__doc__)    # 'Загружает данные по URL.'
\`\`\`

---

## Параметризованный декоратор-класс

Класс с \`__call__\` — более читаемая альтернатива трёхуровневой вложенности. Параметры хранятся как атрибуты экземпляра.

\`\`\`python
import functools
import logging

class log_calls:
    """Декоратор-класс: логирует вызовы функции."""

    def __init__(self, level: str = "INFO", prefix: str = ""):
        self.level = getattr(logging, level.upper())
        self.prefix = prefix

    def __call__(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            name = f"{self.prefix}{func.__qualname__}" if self.prefix else func.__qualname__
            logging.log(self.level, "%s вызвана с args=%s kwargs=%s", name, args, kwargs)
            result = func(*args, **kwargs)
            logging.log(self.level, "%s вернула %r", name, result)
            return result
        return wrapper

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s: %(message)s")

@log_calls(level="DEBUG", prefix="[API] ")
def get_user(user_id: int) -> dict:
    """Возвращает пользователя по ID."""
    return {"id": user_id, "name": "Alice"}

user = get_user(42)
# DEBUG: [API] get_user вызвана с args=(42,) kwargs={}
# DEBUG: [API] get_user вернула {'id': 42, 'name': 'Alice'}

print(get_user.__name__)   # 'get_user'  ✅
print(get_user.__doc__)    # 'Возвращает пользователя по ID.'  ✅
\`\`\`

---

## Универсальный декоратор: работает со скобками и без

Иногда нужно, чтобы декоратор применялся и как \`@deco\`, и как \`@deco()\`. Это решается через \`functools.wraps\` + проверку типа первого аргумента:

\`\`\`python
import functools

def flexible_decorator(_func=None, *, timeout: float = 5.0):
    """Работает и как @flexible_decorator, и как @flexible_decorator(timeout=10)."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"[timeout={timeout}s] Вызываем {func.__name__}")
            return func(*args, **kwargs)
        return wrapper

    if _func is not None:
        # вызван без скобок: @flexible_decorator
        return decorator(_func)
    # вызван со скобками: @flexible_decorator(timeout=10)
    return decorator

@flexible_decorator               # без скобок
def func_a(): pass

@flexible_decorator(timeout=10)   # со скобками
def func_b(): pass

func_a()   # [timeout=5.0s] Вызываем func_a
func_b()   # [timeout=10s] Вызываем func_b
\`\`\`

---

## Итоговое сравнение подходов

| Подход | Когда использовать |
|--------|-------------------|
| Функция + \`functools.wraps\` | Простой декоратор без параметров |
| Трёхуровневая вложенность | Декоратор с параметрами, функциональный стиль |
| Декоратор-класс | Параметры + состояние, нужна читаемость |
| \`functools.partial\` + класс | Переиспользуемые вариации одного декоратора |`,
  },
  {
    id: "oop-abc-protocol-typing",
    question:
      "Что такое абстрактные базовые классы (abc.ABC) и протоколы (typing.Protocol)? В чём разница между номинальной и структурной типизацией в Python?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Два подхода к полиморфизму в Python

Python поддерживает два принципиально разных способа определить «контракт», которому должен соответствовать объект: **номинальная типизация** через \`abc.ABC\` и **структурная типизация** через \`typing.Protocol\`.

---

## abc.ABC — абстрактные базовые классы (номинальная типизация)

\`abc.ABC\` — это механизм, при котором класс **явно объявляет** абстрактные методы, а подклассы обязаны их реализовать. Связь устанавливается через **наследование** — отсюда и «номинальная» (по имени) типизация.

\`\`\`python
from abc import ABC, abstractmethod

class Shape(ABC):
    """Абстрактный базовый класс фигуры."""

    @abstractmethod
    def area(self) -> float:
        """Площадь фигуры."""
        ...

    @abstractmethod
    def perimeter(self) -> float:
        """Периметр фигуры."""
        ...

    def describe(self) -> str:
        # Конкретный метод может существовать рядом с абстрактными
        return f"Площадь: {self.area():.2f}, периметр: {self.perimeter():.2f}"

class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:
        import math
        return math.pi * self.radius ** 2

    def perimeter(self) -> float:
        import math
        return 2 * math.pi * self.radius

class Square(Shape):
    def __init__(self, side: float):
        self.side = side

    def area(self) -> float:
        return self.side ** 2

    def perimeter(self) -> float:
        return 4 * self.side

# Нельзя создать экземпляр абстрактного класса:
# Shape()  # TypeError: Can't instantiate abstract class Shape
#           # with abstract methods area, perimeter

c = Circle(5)
print(c.describe())          # Площадь: 78.54, периметр: 31.42
print(isinstance(c, Shape))  # True — номинальная проверка
\`\`\`

### Абстрактные свойства и классовые методы

\`\`\`python
from abc import ABC, abstractmethod

class DataSource(ABC):

    @property
    @abstractmethod
    def name(self) -> str: ...

    @classmethod
    @abstractmethod
    def from_config(cls, config: dict) -> "DataSource": ...

    @staticmethod
    @abstractmethod
    def validate(data: bytes) -> bool: ...

class FileSource(DataSource):
    def __init__(self, path: str):
        self._path = path

    @property
    def name(self) -> str:
        return self._path

    @classmethod
    def from_config(cls, config: dict) -> "FileSource":
        return cls(config["path"])

    @staticmethod
    def validate(data: bytes) -> bool:
        return len(data) > 0
\`\`\`

---

## typing.Protocol — структурная типизация (duck typing со статической проверкой)

**Структурная типизация** (structural typing / duck typing) означает: объект подходит, если у него есть нужные методы и атрибуты — **независимо от иерархии наследования**.

\`typing.Protocol\` (PEP 544, Python 3.8+) добавляет статическую проверку к duck typing: mypy/pyright проверяют соответствие структуре **без явного наследования**.

\`\`\`python
from typing import Protocol, runtime_checkable

@runtime_checkable   # включает isinstance()-проверку в рантайме
class Drawable(Protocol):
    def draw(self) -> None: ...
    def get_color(self) -> str: ...

# Эти классы НИКАК не связаны с Drawable через наследование:
class Circle:
    def draw(self) -> None:
        print("Рисую круг")
    def get_color(self) -> str:
        return "red"

class Triangle:
    def draw(self) -> None:
        print("Рисую треугольник")
    def get_color(self) -> str:
        return "blue"

class TextLabel:
    def draw(self) -> None:
        print("Рисую текст")
    # get_color отсутствует → НЕ соответствует протоколу

def render(obj: Drawable) -> None:
    print(f"Цвет: {obj.get_color()}")
    obj.draw()

# Работает без наследования:
render(Circle())     # ✅ mypy: OK
render(Triangle())   # ✅ mypy: OK
# render(TextLabel()) # ❌ mypy: error — missing 'get_color'

# runtime_checkable позволяет isinstance:
print(isinstance(Circle(), Drawable))    # True
print(isinstance(TextLabel(), Drawable)) # False (get_color отсутствует)
\`\`\`

---

## Ключевая разница: номинальная vs структурная типизация

| Параметр | abc.ABC (номинальная) | typing.Protocol (структурная) |
|----------|----------------------|-------------------------------|
| Связь | Явное наследование | Совпадение структуры |
| Проверка типа | По имени класса в MRO | По наличию методов/атрибутов |
| isinstance() | Всегда работает | Только с \`@runtime_checkable\` |
| Интеграция с чужим кодом | Нужен subclassing или register() | Работает без изменений |
| Производительность | O(1) — проверка MRO | O(n) — проверка каждого атрибута |
| Идеально для | Иерархии с общим кодом | Интерфейсы без иерархии |

---

## abc.register() — номинальная типизация без наследования

ABC позволяет «зарегистрировать» класс как виртуальный подкласс — он будет проходить \`isinstance()\`, но не обязан реализовывать методы (ответственность на разработчике):

\`\`\`python
from abc import ABC, abstractmethod

class Serializable(ABC):
    @abstractmethod
    def serialize(self) -> bytes: ...

class LegacyData:
    """Старый класс, который нельзя изменить."""
    def serialize(self) -> bytes:
        return b"legacy_data"

Serializable.register(LegacyData)  # Регистрация без наследования

obj = LegacyData()
print(isinstance(obj, Serializable))  # True — зарегистрирован номинально
print(issubclass(LegacyData, Serializable))  # True
\`\`\`

---

## Протоколы с атрибутами и дженерики

\`\`\`python
from typing import Protocol, TypeVar, runtime_checkable

T = TypeVar("T")

class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool: ...
    def __eq__(self, other: object) -> bool: ...

def find_min(items: list[Comparable]) -> Comparable:
    """Работает с любым сравниваемым типом без наследования."""
    return min(items)

print(find_min([3, 1, 4, 1, 5]))    # 1 — int реализует протокол
print(find_min(["c", "a", "b"]))    # 'a' — str тоже реализует протокол

from typing import Protocol

class Repository(Protocol[T]):
    """Обобщённый протокол для репозитория."""
    def get(self, id: int) -> T: ...
    def save(self, entity: T) -> None: ...
    def delete(self, id: int) -> None: ...
\`\`\`

---

## Когда что использовать

\`\`\`python
# ✅ abc.ABC — когда есть общая реализация и чёткая иерархия:
class BaseHandler(ABC):
    def handle(self, request):
        data = self.parse(request)    # ← общая логика
        return self.process(data)     # ← вызывает абстрактный метод

    @abstractmethod
    def parse(self, request): ...

    @abstractmethod
    def process(self, data): ...

# ✅ Protocol — когда нужен интерфейс без иерархии,
# особенно для типизации функций и интеграции с чужим кодом:
class Closeable(Protocol):
    def close(self) -> None: ...

def safe_close(resource: Closeable) -> None:
    # Работает с socket, file, db_connection — без общего предка
    resource.close()
\`\`\``,
  },
  {
    id: "oop-dynamic-type-creation",
    question:
      "Как динамически создать новый тип (класс) в рантайме без использования ключевого слова class?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## type() — базовый способ создания классов в рантайме

В Python ключевое слово \`class\` — это синтаксический сахар. На самом деле любой класс создаётся вызовом метакласса. По умолчанию метакласс — \`type\`. Трёхаргументная форма \`type(name, bases, namespace)\` создаёт новый класс прямо в рантайме.

\`\`\`python
# Эти два определения эквивалентны:

# 1. Через ключевое слово class:
class Dog:
    species = "Canis lupus"
    def __init__(self, name):
        self.name = name
    def bark(self):
        return f"{self.name}: Woof!"

# 2. Через type() — без слова class:
Dog2 = type(
    "Dog",                     # __name__ класса
    (object,),                 # tuple базовых классов
    {                          # namespace: атрибуты и методы
        "species": "Canis lupus",
        "__init__": lambda self, name: setattr(self, "name", name),
        "bark": lambda self: f"{self.name}: Woof!",
    }
)

d1 = Dog("Rex")
d2 = Dog2("Max")
print(d1.bark())   # Rex: Woof!
print(d2.bark())   # Max: Woof!
print(d2.__name__) # Dog
print(type(d2))    # <class '__main__.Dog'>
\`\`\`

---

## Практический пример: фабрика моделей

\`\`\`python
def make_model(name: str, fields: dict[str, type]) -> type:
    """
    Динамически создаёт класс-модель с типизированными полями.
    Аналог простого dataclass, собранного в рантайме.
    """
    def __init__(self, **kwargs):
        for field, expected_type in fields.items():
            value = kwargs.get(field)
            if value is not None and not isinstance(value, expected_type):
                raise TypeError(
                    f"Поле '{field}' ожидает {expected_type.__name__}, "
                    f"получено {type(value).__name__}"
                )
            setattr(self, field, value)

    def __repr__(self):
        attrs = ", ".join(f"{k}={getattr(self, k)!r}" for k in fields)
        return f"{self.__class__.__name__}({attrs})"

    namespace = {
        "__init__": __init__,
        "__repr__": __repr__,
        "__annotations__": fields,
        "_fields": list(fields.keys()),
    }
    return type(name, (object,), namespace)


# Создаём классы в рантайме на основе конфигурации:
User = make_model("User", {"name": str, "age": int, "email": str})
Product = make_model("Product", {"title": str, "price": float})

u = User(name="Alice", age=30, email="alice@example.com")
p = Product(title="Laptop", price=999.99)

print(u)   # User(name='Alice', age=30, email='alice@example.com')
print(p)   # Product(title='Laptop', price=999.99)
print(isinstance(u, User))    # True
print(u.__class__.__name__)   # 'User'

# Проверка типов:
try:
    User(name=123, age=30, email="x@x.com")
except TypeError as e:
    print(e)   # Поле 'name' ожидает str, получено int
\`\`\`

---

## types.new_class() — правильный способ с поддержкой метаклассов

\`type()\` не вызывает \`__set_name__\` и \`__init_subclass__\`. Для полноценного создания класса используйте \`types.new_class()\`:

\`\`\`python
import types

def exec_body(namespace):
    """Заполняет пространство имён нового класса."""
    namespace["greet"] = lambda self: f"Hello from {self.__class__.__name__}"
    namespace["value"] = 42

# Создаём класс с поддержкой всего протокола метакласса:
MyClass = types.new_class(
    "MyClass",               # имя
    (object,),               # базовые классы
    {},                      # kwds для метакласса (metaclass=..., и т.д.)
    exec_body,               # callback для заполнения namespace
)

obj = MyClass()
print(obj.greet())     # Hello from MyClass
print(MyClass.value)   # 42
\`\`\`

---

## dataclasses.make_dataclass() — динамические dataclass

\`\`\`python
from dataclasses import make_dataclass, field

# Создаём dataclass по списку полей из конфигурации:
config_fields = [
    ("host", str, field(default="localhost")),
    ("port", int, field(default=8080)),
    ("debug", bool, field(default=False)),
]

ServerConfig = make_dataclass(
    "ServerConfig",
    config_fields,
    frozen=True,  # неизменяемый
)

cfg = ServerConfig(host="0.0.0.0", port=443)
print(cfg)          # ServerConfig(host='0.0.0.0', port=443, debug=False)
print(cfg.host)     # '0.0.0.0'
# cfg.port = 80     # FrozenInstanceError — frozen=True

# Автоматически получаем __eq__, __hash__, __repr__:
cfg2 = ServerConfig(host="0.0.0.0", port=443)
print(cfg == cfg2)  # True
\`\`\`

---

## Реальный кейс: ORM-подобная система

\`\`\`python
from typing import Any

_registry: dict[str, type] = {}

def register_entity(table: str, columns: list[str]) -> type:
    """
    Создаёт класс-сущность по описанию таблицы.
    Регистрирует в глобальном реестре для дальнейшего использования.
    """
    def init(self, **kwargs):
        for col in columns:
            setattr(self, col, kwargs.get(col))

    def to_dict(self) -> dict[str, Any]:
        return {col: getattr(self, col) for col in columns}

    cls = type(
        table.capitalize(),
        (object,),
        {
            "__init__": init,
            "to_dict": to_dict,
            "_table": table,
            "_columns": columns,
        }
    )
    _registry[table] = cls
    return cls

# Сущности создаются на основе схемы БД:
User = register_entity("users", ["id", "name", "email"])
Post = register_entity("posts", ["id", "title", "body", "user_id"])

u = User(id=1, name="Alice", email="alice@example.com")
print(u.to_dict())   # {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}
print(User._table)   # 'users'

# Все зарегистрированные сущности:
print(list(_registry.keys()))   # ['users', 'posts']
\`\`\`

---

## Итог: инструменты для динамического создания типов

| Инструмент | Когда использовать |
|------------|-------------------|
| \`type(name, bases, ns)\` | Простое создание, без особых требований к метаклассу |
| \`types.new_class()\` | Полный протокол: \`__set_name__\`, \`__init_subclass__\`, кастомный метакласс |
| \`dataclasses.make_dataclass()\` | Нужны dataclass-фичи (\`__eq__\`, \`frozen\`, \`field\`) |
| \`collections.namedtuple()\` | Лёгкие иммутабельные записи |
| \`typing.NamedTuple\` | Типизированные именованные кортежи |`,
  },
  {
    id: "oop-context-manager-exit",
    question:
      "Опишите протокол контекстного менеджера. Чём отличается обработка исключений в методе __exit__ при возврате значений True и False?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "middle",
    answer: `## Протокол контекстного менеджера

Контекстный менеджер — это объект, реализующий два специальных метода:

- \`__enter__(self)\` — вызывается при входе в блок \`with\`, возвращаемое значение присваивается переменной после \`as\`
- \`__exit__(self, exc_type, exc_val, exc_tb)\` — вызывается при выходе из блока **всегда**: и при нормальном завершении, и при исключении

\`\`\`python
class ManagedResource:
    def __enter__(self):
        print("1. __enter__: захватываем ресурс")
        return self          # → присваивается в 'as resource'

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"3. __exit__: exc_type={exc_type}, exc_val={exc_val}")
        print("   освобождаем ресурс")
        return False         # исключение пробрасывается дальше

with ManagedResource() as resource:
    print("2. тело with-блока")

# Вывод:
# 1. __enter__: захватываем ресурс
# 2. тело with-блока
# 3. __exit__: exc_type=None, exc_val=None
#    освобождаем ресурс
\`\`\`

---

## Параметры __exit__

| Параметр | Значение при исключении | Значение без исключения |
|----------|------------------------|------------------------|
| \`exc_type\` | Класс исключения (напр. \`ValueError\`) | \`None\` |
| \`exc_val\` | Экземпляр исключения | \`None\` |
| \`exc_tb\` | Объект traceback | \`None\` |

---

## True vs False: подавление или проброс исключения

**Ключевое правило**: если \`__exit__\` возвращает **истинное** значение — исключение **подавляется** (не распространяется). Если **ложное** (в том числе \`None\`) — исключение **пробрасывается** дальше.

\`\`\`python
class SuppressAll:
    """Подавляет ВСЕ исключения."""
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"Исключение подавлено: {exc_val}")
        return True   # ← подавляем исключение

class Passthrough:
    """Пробрасывает все исключения."""
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Ресурс освобождён, исключение продолжает распространяться")
        return False  # ← не подавляем

# Демонстрация:
print("=== SuppressAll ===")
with SuppressAll():
    raise ValueError("Что-то пошло не так")
print("Выполнение продолжается!")   # ← выполняется, ошибка подавлена

print()
print("=== Passthrough ===")
try:
    with Passthrough():
        raise ValueError("Что-то пошло не так")
except ValueError as e:
    print(f"Исключение перехвачено снаружи: {e}")
# 'Выполнение продолжается!' — НЕ выводится, т.к. блок прерван

# Вывод:
# === SuppressAll ===
# Исключение подавлено: Что-то пошло не так
# Выполнение продолжается!
#
# === Passthrough ===
# Ресурс освобождён, исключение продолжает распространяться
# Исключение перехвачено снаружи: Что-то пошло не так
\`\`\`

---

## Избирательное подавление исключений

Реальный паттерн — подавлять только определённые типы исключений:

\`\`\`python
class SuppressErrors:
    """Подавляет только указанные типы исключений."""

    def __init__(self, *exception_types):
        self.exception_types = exception_types
        self.suppressed: Exception | None = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None and issubclass(exc_type, self.exception_types):
            self.suppressed = exc_val
            return True   # ← подавляем только нужные
        return False      # ← всё остальное пробрасываем

# Использование:
with SuppressErrors(FileNotFoundError, PermissionError) as ctx:
    open("/nonexistent/file.txt")

if ctx.suppressed:
    print(f"Подавили: {ctx.suppressed}")   # Подавили: [Errno 2] No such file...

# ValueError НЕ будет подавлен:
try:
    with SuppressErrors(FileNotFoundError):
        raise ValueError("Это пробросится!")
except ValueError as e:
    print(f"Поймали снаружи: {e}")   # Поймали снаружи: Это пробросится!

# Встроенный аналог из стандартной библиотеки:
from contextlib import suppress
with suppress(FileNotFoundError):
    open("/nonexistent/file.txt")   # Исключение подавлено молча
\`\`\`

---

## contextlib.contextmanager — декораторный синтаксис

Генераторный подход через \`@contextmanager\` — компактная альтернатива классу:

\`\`\`python
from contextlib import contextmanager
import sqlite3

@contextmanager
def db_transaction(conn: sqlite3.Connection):
    """
    Контекстный менеджер транзакции:
    - commit при успехе
    - rollback при исключении
    """
    cursor = conn.cursor()
    try:
        yield cursor          # ← __enter__: передаём курсор
        conn.commit()         # ← выполняется если блок завершился без ошибок
        print("Транзакция зафиксирована")
    except Exception as exc:
        conn.rollback()       # ← __exit__ при исключении
        print(f"Откат: {exc}")
        raise                 # ← пробрасываем (аналог return False)
    finally:
        cursor.close()        # ← вызывается всегда

# Использование:
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE t (id INTEGER, val TEXT)")

with db_transaction(conn) as cur:
    cur.execute("INSERT INTO t VALUES (1, 'hello')")
    cur.execute("INSERT INTO t VALUES (2, 'world')")
# Транзакция зафиксирована

try:
    with db_transaction(conn) as cur:
        cur.execute("INSERT INTO t VALUES (3, 'fail')")
        raise RuntimeError("Что-то сломалось")
except RuntimeError:
    pass
# Откат: Что-то сломалось
\`\`\`

---

## Асинхронный контекстный менеджер

\`\`\`python
import asyncio

class AsyncTimer:
    """Асинхронный контекстный менеджер — async with."""

    async def __aenter__(self):
        import time
        self._start = time.monotonic()
        print("Таймер запущен")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        import time
        elapsed = time.monotonic() - self._start
        print(f"Прошло: {elapsed:.3f}с")
        return False  # исключения не подавляем

async def main():
    async with AsyncTimer():
        await asyncio.sleep(0.1)
        print("Выполняем асинхронную работу")

asyncio.run(main())
# Таймер запущен
# Выполняем асинхронную работу
# Прошло: 0.101с
\`\`\``,
  },
  {
    id: "oop-init-subclass",
    question:
      "Что такое метод __init_subclass__ и для каких задач он может служить более безопасной альтернативой метаклассам?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Что такое __init_subclass__?

\`__init_subclass__\` (PEP 487, Python 3.6+) — это метод класса, который вызывается **каждый раз, когда создаётся подкласс данного класса**. Это позволяет родительскому классу реагировать на своё наследование и настраивать подклассы без написания метакласса.

\`\`\`python
class Base:
    def __init_subclass__(cls, **kwargs):
        # cls — создаваемый подкласс (не Base!)
        super().__init_subclass__(**kwargs)   # обязательно! для корректной MRO-цепочки
        print(f"Создан подкласс: {cls.__name__}")

class Child(Base):
    pass
# Вывод: Создан подкласс: Child

class GrandChild(Child):
    pass
# Вывод: Создан подкласс: GrandChild  ← срабатывает и для внуков
\`\`\`

Важно: \`__init_subclass__\` **не вызывается** для самого класса, где он определён — только для его подклассов.

---

## Паттерн 1: Автоматическая валидация подклассов

\`\`\`python
from abc import abstractmethod

class StrictPlugin:
    """Базовый класс плагина с обязательными атрибутами."""

    REQUIRED_ATTRS = ("name", "version", "author")

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        # Проверяем наличие обязательных атрибутов на уровне КЛАССА
        missing = [attr for attr in cls.REQUIRED_ATTRS if not hasattr(cls, attr)]
        if missing:
            raise TypeError(
                f"Класс {cls.__name__!r} должен определить атрибуты: {missing}"
            )
        print(f"✅ Плагин '{cls.name}' v{cls.version} зарегистрирован")

# Корректный плагин:
class MyPlugin(StrictPlugin):
    name = "my-plugin"
    version = "1.0.0"
    author = "Alice"
# ✅ Плагин 'my-plugin' v1.0.0 зарегистрирован

# Некорректный плагин — ошибка на этапе определения класса:
try:
    class BrokenPlugin(StrictPlugin):
        name = "broken"
        # version и author отсутствуют
except TypeError as e:
    print(e)
# Класс 'BrokenPlugin' должен определить атрибуты: ['version', 'author']
\`\`\`

---

## Паттерн 2: Автоматический реестр подклассов

Типичная задача: собрать все реализации (стратегии, хендлеры, команды) в реестр без ручной регистрации.

\`\`\`python
from typing import ClassVar

class Command:
    """Базовый класс команды с автоматическим реестром."""

    _registry: ClassVar[dict[str, type]] = {}

    def __init_subclass__(cls, command_name: str | None = None, **kwargs):
        super().__init_subclass__(**kwargs)

        # Если передано command_name — регистрируем
        if command_name is not None:
            if command_name in cls._registry:
                raise ValueError(f"Команда '{command_name}' уже зарегистрирована!")
            cls._registry[command_name] = cls
            cls._command_name = command_name

    @classmethod
    def dispatch(cls, name: str, *args, **kwargs):
        if name not in cls._registry:
            raise KeyError(f"Неизвестная команда: '{name}'")
        return cls._registry[name](*args, **kwargs).execute()

    def execute(self):
        raise NotImplementedError

# Регистрируем команды через параметр наследования:
class StartCommand(Command, command_name="start"):
    def execute(self):
        return "Сервер запущен"

class StopCommand(Command, command_name="stop"):
    def execute(self):
        return "Сервер остановлен"

class RestartCommand(Command, command_name="restart"):
    def execute(self):
        return "Сервер перезапущен"

# Диспетчеризация по имени:
print(Command.dispatch("start"))    # Сервер запущен
print(Command.dispatch("stop"))     # Сервер остановлен
print(Command._registry)
# {'start': <class 'StartCommand'>, 'stop': ..., 'restart': ...}
\`\`\`

---

## Паттерн 3: Автоматическое преобразование методов

\`\`\`python
class AutoProperty:
    """
    Превращает все методы с суффиксом _computed в cached_property.
    """
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        from functools import cached_property

        for attr_name in list(vars(cls)):
            if attr_name.endswith("_computed") and callable(getattr(cls, attr_name)):
                method = getattr(cls, attr_name)
                prop_name = attr_name.removesuffix("_computed")
                setattr(cls, prop_name, cached_property(method))
                print(f"  {attr_name} → cached_property '{prop_name}'")

class MyModel(AutoProperty):
    def __init__(self, data: list[int]):
        self.data = data

    def total_computed(self):
        print("  [вычисляю total]")
        return sum(self.data)

    def average_computed(self):
        print("  [вычисляю average]")
        return sum(self.data) / len(self.data) if self.data else 0

m = MyModel([1, 2, 3, 4, 5])
print(m.total)      # [вычисляю total] → 15
print(m.total)      # 15 (из кэша, вычисления нет)
print(m.average)    # [вычисляю average] → 3.0
\`\`\`

---

## Сравнение с метаклассами

| Критерий | Метакласс | \`__init_subclass__\` |
|----------|-----------|----------------------|
| Сложность | Высокая | Низкая |
| Читаемость | Трудно следить | Логика в самом классе |
| Совместимость | Конфликты при множественном наследовании | Нет конфликтов (используется MRO) |
| Параметры | Через kwargs метакласса | Через параметры наследования |
| Контроль над \`type()\` | Полный | Только хук на создание подкласса |
| Когда нужен метакласс | Изменить сам процесс создания класса (изменить \`__new__\`, \`__prepare__\`) | Почти никогда |

\`\`\`python
# Метакласс (сложно):
class RegistryMeta(type):
    _registry = {}
    def __new__(mcs, name, bases, namespace, **kwargs):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # не сам базовый класс
            mcs._registry[name] = cls
        return cls

class Base(metaclass=RegistryMeta): pass
class Child(Base): pass

# Эквивалент через __init_subclass__ (проще):
class Base2:
    _registry = {}
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Base2._registry[cls.__name__] = cls

class Child2(Base2): pass
\`\`\``,
  },
  {
    id: "oop-match-case-pattern-matching",
    question:
      "Как работает механизм паттерн-матчинга (match / case), добавленный в Python 3.10+, с точки зрения производительности и проверки типов?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "middle",
    answer: `## Паттерн-матчинг: не просто switch/case

\`match / case\` (PEP 634, Python 3.10+) — это не просто цепочка \`if/elif\`. Это **структурный паттерн-матчинг**: сопоставление значений с шаблонами по форме, типу и содержимому. Компилятор Python транслирует его в оптимизированный байткод.

---

## Виды паттернов

### 1. Литеральные паттерны

\`\`\`python
def describe_status(code: int) -> str:
    match code:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500 | 503:          # OR-паттерн: несколько значений
            return "Server Error"
        case _:                  # wildcard: совпадает всегда
            return f"Неизвестный код: {code}"

print(describe_status(200))   # OK
print(describe_status(503))   # Server Error
print(describe_status(418))   # Неизвестный код: 418
\`\`\`

### 2. Паттерны типов (class patterns)

Проверяют тип **и** извлекают атрибуты — это ключевое отличие от \`isinstance()\`:

\`\`\`python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Circle:
    center: Point
    radius: float

@dataclass
class Rectangle:
    top_left: Point
    bottom_right: Point

def describe_shape(shape) -> str:
    match shape:
        case Point(x=0, y=0):                    # конкретные значения
            return "Начало координат"
        case Point(x=x, y=0):                    # захват x, y=0
            return f"На оси X, x={x}"
        case Point(x=0, y=y):
            return f"На оси Y, y={y}"
        case Point(x=x, y=y):                    # любая точка — захват обоих
            return f"Точка ({x}, {y})"
        case Circle(center=Point(x=cx, y=cy), radius=r) if r > 0:
            return f"Круг в ({cx},{cy}) радиуса {r}"
        case Rectangle(top_left=Point(x=x1), bottom_right=Point(x=x2)):
            return f"Прямоугольник шириной {x2 - x1}"
        case _:
            return "Неизвестная фигура"

print(describe_shape(Point(0, 0)))              # Начало координат
print(describe_shape(Point(5, 0)))              # На оси X, x=5
print(describe_shape(Circle(Point(1, 2), 3)))   # Круг в (1,2) радиуса 3
\`\`\`

### 3. Паттерны последовательностей (sequence patterns)

\`\`\`python
def process_command(command: list[str]) -> str:
    match command:
        case []:
            return "Пустая команда"
        case ["quit"]:
            return "Выход"
        case ["go", direction]:              # захват direction
            return f"Идём: {direction}"
        case ["go", *directions]:            # star-паттерн: остаток
            return f"Маршрут: {' → '.join(directions)}"
        case ["set", key, value]:
            return f"Установка: {key} = {value}"
        case [first, *rest] if len(rest) > 5:
            return f"Слишком длинная команда, начинается с '{first}'"
        case _:
            return f"Неизвестно: {command}"

print(process_command(["go", "north"]))          # Идём: north
print(process_command(["go", "n", "e", "s"]))   # Маршрут: n → e → s
print(process_command(["set", "speed", "10"]))   # Установка: speed = 10
\`\`\`

### 4. Паттерны словарей (mapping patterns)

\`\`\`python
def handle_event(event: dict) -> str:
    match event:
        case {"type": "click", "button": "left", "x": x, "y": y}:
            return f"Левый клик в ({x}, {y})"
        case {"type": "click", "button": button}:
            return f"Клик кнопкой: {button}"
        case {"type": "key", "key": key, **modifiers}:   # ** захватывает остаток
            mods = [k for k, v in modifiers.items() if v]
            return f"Клавиша {key!r} с {mods}"
        case {"type": event_type}:
            return f"Событие: {event_type}"

print(handle_event({"type": "click", "button": "left", "x": 10, "y": 20}))
# Левый клик в (10, 20)
print(handle_event({"type": "key", "key": "A", "shift": True, "ctrl": False}))
# Клавиша 'A' с ['shift']
\`\`\`

---

## Guards (условия в case)

\`\`\`python
def classify_number(n: int | float) -> str:
    match n:
        case int(x) if x < 0:
            return f"Отрицательное целое: {x}"
        case int(x) if x == 0:
            return "Ноль"
        case int(x):
            return f"Положительное целое: {x}"
        case float(x) if x != x:    # NaN: x != x всегда True для NaN
            return "NaN"
        case float(x):
            return f"Вещественное: {x}"

print(classify_number(-5))    # Отрицательное целое: -5
print(classify_number(0))     # Ноль
print(classify_number(3.14))  # Вещественное: 3.14
\`\`\`

---

## Как работает проверка типов в class patterns

При паттерне \`case Point(x=x, y=y)\` интерпретатор:
1. Вызывает \`isinstance(value, Point)\`
2. Для позиционных аргументов использует \`__match_args__\` — кортеж имён атрибутов

\`\`\`python
class Color:
    __match_args__ = ("red", "green", "blue")   # порядок позиционных атрибутов

    def __init__(self, r, g, b):
        self.red, self.green, self.blue = r, g, b

def describe_color(c):
    match c:
        case Color(255, 0, 0):            # позиционно: red=255, green=0, blue=0
            return "Красный"
        case Color(0, g, 0) if g > 128:   # зелёный канал > 128
            return f"Насыщенный зелёный (g={g})"
        case Color(r, g, b):
            return f"RGB({r}, {g}, {b})"

print(describe_color(Color(255, 0, 0)))    # Красный
print(describe_color(Color(0, 200, 0)))    # Насыщенный зелёный (g=200)
\`\`\`

---

## Производительность

Паттерн-матчинг компилируется в специализированный байткод (\`MATCH_CLASS\`, \`MATCH_SEQUENCE\`, \`MATCH_MAPPING\`):

\`\`\`python
import dis

def demo(x):
    match x:
        case int():  return "int"
        case str():  return "str"
        case _:      return "other"

dis.dis(demo)
# Инструкция MATCH_CLASS выполняет isinstance-проверку на уровне C
# — быстрее, чем цепочка if/isinstance в Python-коде

# Сравнение производительности для 1 000 000 итераций:
import timeit

data = [42, "hello", 3.14, [], {}, True] * 100

def with_match(items):
    results = []
    for x in items:
        match x:
            case int():  results.append("int")
            case str():  results.append("str")
            case list(): results.append("list")
            case _:      results.append("other")
    return results

def with_isinstance(items):
    results = []
    for x in items:
        if isinstance(x, int):   results.append("int")
        elif isinstance(x, str): results.append("str")
        elif isinstance(x, list):results.append("list")
        else:                    results.append("other")
    return results

# match и isinstance имеют сопоставимую производительность для type-паттернов.
# match выигрывает при сложной деструктуризации (не нужен ручной доступ к атрибутам).
\`\`\`

---

## Паттерн-матчинг для AST и рекурсивных структур

\`\`\`python
from dataclasses import dataclass

@dataclass
class Num:
    value: float

@dataclass
class Add:
    left: "Expr"
    right: "Expr"

@dataclass
class Mul:
    left: "Expr"
    right: "Expr"

Expr = Num | Add | Mul

def evaluate(expr: Expr) -> float:
    match expr:
        case Num(value=v):
            return v
        case Add(left=l, right=r):
            return evaluate(l) + evaluate(r)
        case Mul(left=l, right=r):
            return evaluate(l) * evaluate(r)

# (2 + 3) * 4
tree = Mul(Add(Num(2), Num(3)), Num(4))
print(evaluate(tree))   # 20.0
\`\`\`

---

## Итог: когда использовать match/case

| Ситуация | match/case | if/elif |
|----------|------------|---------|
| Проверка типа + извлечение атрибутов | ✅ Идеально | Многословно |
| Рекурсивные структуры (AST, JSON) | ✅ Очень удобно | Сложно читать |
| Диспетчеризация по словарю | ✅ Mapping pattern | Допустимо |
| Простое сравнение с константами | ✅ Читаемо | Тоже OK |
| Сложные логические условия (AND, NOT) | ⚠️ Используйте guards | ✅ Предпочтительно |`,
  },
  {
    id: "perf-profiling-cpu-memory",
    question:
      "Как профилировать производительность Python-приложения по времени выполнения (CPU) и по потреблению памяти (Memory)? Какие инструменты для production?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "senior",
    answer: `## CPU-профилирование

### cProfile — встроенный детерминированный профайлер

Записывает каждый вызов функции. Точен, но сам добавляет накладные расходы (~10–30%).

\`\`\`python
import cProfile
import pstats
import io

def slow_function(n: int) -> int:
    total = 0
    for i in range(n):
        total += sum(j ** 2 for j in range(i))
    return total

# Способ 1: контекстный менеджер
with cProfile.Profile() as pr:
    result = slow_function(200)

stats = pstats.Stats(pr, stream=io.StringIO())
stats.sort_stats("cumulative")   # сортировка: cumulative, tottime, calls
stats.print_stats(15)            # топ-15 функций

# Способ 2: декоратор для точечного профилирования
import functools

def profile(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        pr = cProfile.Profile()
        pr.enable()
        result = func(*args, **kwargs)
        pr.disable()
        stats = pstats.Stats(pr)
        stats.sort_stats("cumulative")
        stats.print_stats(10)
        return result
    return wrapper

@profile
def my_function():
    return [i ** 2 for i in range(100_000)]

# Способ 3: CLI
# python -m cProfile -s cumulative my_script.py
# python -m cProfile -o profile.out my_script.py
# snakeviz profile.out  # визуализация в браузере
\`\`\`

### line_profiler — профилирование по строкам

\`\`\`python
# pip install line-profiler
# Декоратор @profile добавляется автоматически при запуске kernprof

@profile   # ← kernprof инжектирует этот декоратор
def compute(data: list[int]) -> float:
    total = 0                      # line 1
    for x in data:                 # line 2
        total += x ** 2            # line 3 — здесь может быть узкое место
    return total / len(data)       # line 4

# Запуск:
# kernprof -l -v my_script.py
# Вывод: для каждой строки — время, количество вызовов, % от общего
\`\`\`

### py-spy — sampling-профайлер (production-ready)

\`\`\`bash
# pip install py-spy
# Не требует изменений в коде, работает с живым процессом

# Профилирование запущенного процесса по PID:
py-spy top --pid 12345

# Сохранить flamegraph (интерактивный SVG):
py-spy record -o flamegraph.svg --pid 12345

# Запуск скрипта с профилированием:
py-spy record -o flamegraph.svg -- python my_script.py

# Speedscope-формат (для https://speedscope.app):
py-spy record -o profile.json --format speedscope -- python my_script.py
\`\`\`

### timeit — микробенчмарки

\`\`\`python
import timeit

# Сравнение двух реализаций:
setup = "data = list(range(10_000))"

t1 = timeit.timeit(
    "[x ** 2 for x in data]",
    setup=setup,
    number=1000,
)
t2 = timeit.timeit(
    "list(map(lambda x: x ** 2, data))",
    setup=setup,
    number=1000,
)
print(f"list comp: {t1:.3f}s, map: {t2:.3f}s")

# В Jupyter / IPython:
# %timeit [x ** 2 for x in range(10_000)]
# %%timeit  ← для целой ячейки
\`\`\`

---

## Профилирование памяти

### tracemalloc — встроенный трекер аллокаций

\`\`\`python
import tracemalloc

tracemalloc.start(10)   # 10 — глубина стека для каждой аллокации

# ... ваш код ...
data = {i: [j for j in range(i)] for i in range(1000)}

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")   # группировка по строкам

print("Топ-5 потребителей памяти:")
for stat in top_stats[:5]:
    print(stat)

# Сравнение двух снимков (найти утечку):
snap1 = tracemalloc.take_snapshot()
# ... операции ...
snap2 = tracemalloc.take_snapshot()
diff = snap2.compare_to(snap1, "lineno")
for stat in diff[:5]:
    print(stat)
\`\`\`

### memory_profiler — профилирование по строкам (память)

\`\`\`python
# pip install memory-profiler

from memory_profiler import profile as mem_profile

@mem_profile
def build_data(n: int) -> list:
    result = []                          # Line 1:   0.0 MiB increment
    for i in range(n):
        result.append([0] * 1000)        # Line 3: +7.6 MiB
    return result

build_data(1000)

# CLI запуск:
# python -m memory_profiler my_script.py

# Мониторинг во времени:
# mprof run my_script.py
# mprof plot  # строит график потребления памяти
\`\`\`

### pympler — детальный анализ объектов

\`\`\`python
# pip install pympler
from pympler import asizeof, tracker

# Точный размер объекта (включая всё содержимое):
import sys
data = {"key": [1, 2, 3] * 100}
print(sys.getsizeof(data))        # 232  — только сам dict
print(asizeof.asizeof(data))      # 3472 — dict + все вложенные объекты

# Трекер объектов (найти утечки):
tr = tracker.SummaryTracker()
# ... создаём объекты ...
some_list = [object() for _ in range(1000)]
tr.print_diff()   # покажет, какие типы объектов добавились
\`\`\`

---

## Production-инструменты

### Prometheus + structlog — метрики в production

\`\`\`python
# pip install prometheus-client
from prometheus_client import Histogram, Counter, start_http_server
import time
import functools

REQUEST_DURATION = Histogram(
    "request_duration_seconds",
    "Время выполнения запроса",
    ["endpoint", "method"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
)
ERROR_COUNT = Counter("errors_total", "Количество ошибок", ["type"])

def track_performance(endpoint: str):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.monotonic()
            try:
                return func(*args, **kwargs)
            except Exception as exc:
                ERROR_COUNT.labels(type=type(exc).__name__).inc()
                raise
            finally:
                duration = time.monotonic() - start
                REQUEST_DURATION.labels(
                    endpoint=endpoint, method=func.__name__
                ).observe(duration)
        return wrapper
    return decorator

@track_performance("/api/orders")
def get_orders(): ...

# start_http_server(8000)  # метрики доступны на :8000/metrics для Prometheus
\`\`\`

### OpenTelemetry — distributed tracing

\`\`\`python
# pip install opentelemetry-api opentelemetry-sdk
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

provider = TracerProvider()
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

def process_order(order_id: str) -> dict:
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        # ... бизнес-логика ...
        with tracer.start_as_current_span("db.query"):
            result = {"status": "ok"}   # имитация запроса
        span.set_attribute("order.status", result["status"])
        return result
\`\`\`

---

## Быстрая карта инструментов

| Задача | Инструмент | Где применять |
|--------|-----------|---------------|
| CPU hotspot | \`cProfile\` + \`snakeviz\` | Dev |
| CPU построчно | \`line_profiler\` | Dev |
| CPU без изменений кода | \`py-spy\` | Dev + **Prod** |
| Память построчно | \`memory_profiler\` | Dev |
| Аллокации / утечки | \`tracemalloc\` | Dev |
| Метрики latency | \`Prometheus\` | **Prod** |
| Трассировки | \`OpenTelemetry\` | **Prod** |`,
  },
  {
    id: "perf-pydantic-dataclasses-overhead",
    question:
      "Каковы накладные расходы на использование Pydantic или dataclasses по сравнению с обычными словарями (dict) или кортежами (tuple)?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "middle",
    answer: `## Что платим за удобство: реальные замеры

### Тест: создание 100 000 объектов

\`\`\`python
import timeit
from dataclasses import dataclass
from typing import NamedTuple
from pydantic import BaseModel

# Данные для теста
KWARGS = {"name": "Alice", "age": 30, "email": "alice@example.com"}

# --- Реализации ---

class PydanticUser(BaseModel):
    name: str
    age: int
    email: str

@dataclass
class DataclassUser:
    name: str
    age: int
    email: str

class NamedTupleUser(NamedTuple):
    name: str
    age: int
    email: str

# --- Замер ---
N = 100_000

results = {}

results["dict"]        = timeit.timeit(lambda: {"name": "Alice", "age": 30, "email": "alice@example.com"}, number=N)
results["tuple"]       = timeit.timeit(lambda: ("Alice", 30, "alice@example.com"), number=N)
results["NamedTuple"]  = timeit.timeit(lambda: NamedTupleUser("Alice", 30, "alice@example.com"), number=N)
results["dataclass"]   = timeit.timeit(lambda: DataclassUser(**KWARGS), number=N)
results["pydantic v2"] = timeit.timeit(lambda: PydanticUser(**KWARGS), number=N)

for name, t in sorted(results.items(), key=lambda x: x[1]):
    print(f"{name:15}: {t:.3f}s  (×{t / results['dict']:.1f} vs dict)")

# Примерный вывод (машина зависит):
# tuple          : 0.004s  (×0.5 vs dict)
# dict           : 0.008s  (×1.0 vs dict)
# NamedTuple     : 0.012s  (×1.5 vs dict)
# dataclass      : 0.018s  (×2.3 vs dict)
# pydantic v2    : 0.045s  (×5.6 vs dict)
# (Pydantic v1 был ×20–30 vs dict; v2 на Rust на порядок быстрее)
\`\`\`

---

## Что делает каждый инструмент при создании объекта

\`\`\`python
import sys

# dict: просто хэш-таблица, без валидации
d = {"name": "Alice", "age": 30}
print(sys.getsizeof(d))   # ~232 байт

# tuple: фиксированный массив указателей, минимум памяти
t = ("Alice", 30)
print(sys.getsizeof(t))   # ~56 байт

# dataclass: Python __init__ + __dict__
@dataclass
class DC:
    name: str
    age: int

dc = DC("Alice", 30)
print(sys.getsizeof(dc))          # ~48 байт (сам объект)
print(sys.getsizeof(dc.__dict__)) # ~232 байт (словарь атрибутов)

# dataclass со __slots__: экономия памяти
@dataclass
class DCSlots:
    __slots__ = ("name", "age")
    name: str
    age: int

dcs = DCSlots("Alice", 30)
print(sys.getsizeof(dcs))         # ~56 байт (без __dict__)

# Pydantic v2: Rust-ядро, model_fields на уровне класса
class PM(BaseModel):
    name: str
    age: int

pm = PM(name="Alice", age=30)
print(sys.getsizeof(pm))          # ~48 байт + Rust-стуктуры
\`\`\`

---

## Подробное сравнение возможностей

\`\`\`python
from dataclasses import dataclass, field
from pydantic import BaseModel, field_validator, model_validator, Field

# --- dataclass: скорость, нет валидации в рантайме ---
@dataclass
class OrderDC:
    id: int
    total: float
    items: list[str] = field(default_factory=list)
    # Нет автоматической валидации:
    # OrderDC(id="not_int", total="oops") — создастся без ошибки!

o = OrderDC(id="not_int", total="oops")  # тихо проглотит
print(o.id, type(o.id))   # not_int <class 'str'>  ← неожиданно

# --- Pydantic v2: полная валидация, принудительное приведение ---
class OrderPyd(BaseModel):
    id: int
    total: float
    items: list[str] = Field(default_factory=list)

    @field_validator("total")
    @classmethod
    def total_must_be_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("total должен быть >= 0")
        return v

    @model_validator(mode="after")
    def check_items_not_empty_for_big_orders(self) -> "OrderPyd":
        if self.total > 1000 and not self.items:
            raise ValueError("Для заказа > 1000 нужны items")
        return self

o = OrderPyd(id="42", total="99.5")  # "42" → int, "99.5" → float
print(o.id, type(o.id))              # 42 <class 'int'>  ← приведено

try:
    OrderPyd(id=1, total=-5.0)       # ValueError: total должен быть >= 0
except Exception as e:
    print(e)
\`\`\`

---

## Где узкое место Pydantic — и как его обойти

\`\`\`python
from pydantic import BaseModel

class Item(BaseModel):
    id: int
    name: str
    price: float

# ❌ Медленно: валидация + создание объекта на каждой итерации
items_data = [{"id": i, "name": f"item_{i}", "price": float(i)} for i in range(10_000)]
items = [Item(**d) for d in items_data]   # N вызовов BaseModel.__init__

# ✅ Быстро: батчевая валидация через TypeAdapter
from pydantic import TypeAdapter

ta = TypeAdapter(list[Item])
items = ta.validate_python(items_data)   # одна операция, ~3× быстрее

# ✅ Ещё быстрее: model_validate + from_attributes для ORM-объектов
class ItemFromORM(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str

# item = ItemFromORM.model_validate(orm_obj)  # читает атрибуты, не словарь

# ✅ Сериализация: model_dump() вместо dict()
item = Item(id=1, name="book", price=9.99)
d = item.model_dump()                    # → dict, быстро
j = item.model_dump_json()               # → JSON-строка (Rust), очень быстро
\`\`\`

---

## Когда что выбирать

| Сценарий | Рекомендация |
|----------|-------------|
| Максимальная скорость, нет валидации | \`tuple\` / \`NamedTuple\` |
| Удобство + память | \`dataclass\` + \`__slots__\` |
| Публичный API, валидация, сериализация | \`Pydantic v2\` |
| Внутренние структуры между функциями | \`dataclass\` или \`TypedDict\` |
| Immutable value objects | \`dataclass(frozen=True)\` |
| Hot-path (миллионы операций/сек) | \`tuple\` или \`numpy\` array |

\`\`\`python
# TypedDict: только статическая проверка, нет рантайм-оверхеда
from typing import TypedDict

class UserDict(TypedDict):
    name: str
    age: int

# В рантайме это обычный dict — нулевой оверхед:
u: UserDict = {"name": "Alice", "age": 30}   # mypy проверит типы
\`\`\``,
  },
  {
    id: "perf-pycache-bytecode-optimization",
    question:
      "Что такое __pycache__, файлы .pyc и как работает базовая оптимизация байт-кода (например, при использовании флага -O)?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "middle",
    answer: `## Жизненный цикл Python-файла

Когда Python импортирует модуль, процесс выглядит так:

\`\`\`
my_module.py
     │
     ▼  (компиляция, если .pyc устарел)
  AST (Abstract Syntax Tree)
     │
     ▼  (codegen)
  Байт-код (bytecode)
     │
     ├──► __pycache__/my_module.cpython-312.pyc  (кэш на диске)
     │
     ▼
  CPython VM исполняет байт-код
\`\`\`

---

## __pycache__ и .pyc файлы

\`__pycache__\` — директория, куда Python кэширует скомпилированный байт-код. Это ускоряет повторные импорты: при следующем запуске Python проверяет, не изменился ли .py файл, и если нет — загружает .pyc напрямую, минуя этап компиляции.

\`\`\`
my_project/
├── app.py
├── utils.py
└── __pycache__/
    ├── app.cpython-312.pyc          # Python 3.12
    ├── app.cpython-312.opt-1.pyc    # Python 3.12, -O
    └── utils.cpython-312.pyc
\`\`\`

### Структура .pyc файла

\`\`\`python
# Заголовок .pyc (16 байт):
# [4 байта] magic number — версия интерпретатора (меняется с каждой версией CPython)
# [4 байта] bit field (флаги валидации: hash-based vs timestamp-based)
# [4 байта] timestamp изменения .py (или hash)
# [4 байта] размер .py файла
# [остаток] сериализованный code object (marshal-формат)

import marshal, struct, time

with open("__pycache__/utils.cpython-312.pyc", "rb") as f:
    magic = f.read(4)
    flags = struct.unpack("<I", f.read(4))[0]
    mtime = struct.unpack("<I", f.read(4))[0]
    size  = struct.unpack("<I", f.read(4))[0]
    code  = marshal.load(f)

print(f"magic: {magic.hex()}")
print(f"mtime: {time.ctime(mtime)}")
print(f"source size: {size} bytes")
print(f"code name: {code.co_name}")
\`\`\`

### Когда .pyc пересоздаётся

\`\`\`python
import importlib.util, hashlib, os

# Python сравнивает mtime и size .py файла с записанными в .pyc.
# Если не совпали — перекомпилирует.

# Для верификации по хэшу (--check-hash-based-pycs):
# python --check-hash-based-pycs always my_script.py
\`\`\`

---

## Флаги оптимизации: -O и -OO

\`\`\`bash
python my_script.py           # обычный режим → .cpython-312.pyc
python -O my_script.py        # оптимизация 1 → .cpython-312.opt-1.pyc
python -OO my_script.py       # оптимизация 2 → .cpython-312.opt-2.pyc
\`\`\`

### -O (оптимизация уровня 1)

Убирает \`assert\` инструкции и устанавливает \`__debug__ = False\`:

\`\`\`python
# my_module.py
def divide(a, b):
    assert b != 0, "Делитель не может быть нулём"   # ← убирается с -O!
    return a / b

if __debug__:
    print("DEBUG режим активен")   # ← не выполняется с -O

# Без -O:
# divide(10, 0)  → AssertionError: Делитель не может быть нулём

# С -O:
# divide(10, 0)  → ZeroDivisionError (assert пропущен!)
\`\`\`

### -OO (оптимизация уровня 2)

Дополнительно удаляет **все строки документации** (\`__doc__ = None\`):

\`\`\`python
def greet(name: str) -> str:
    """Приветствует пользователя по имени.

    Args:
        name: Имя пользователя.
    Returns:
        Строка приветствия.
    """
    return f"Hello, {name}"

# Без -OO:
print(greet.__doc__)   # "Приветствует пользователя по имени.\\n..."

# С -OO:
print(greet.__doc__)   # None  ← документация удалена для экономии памяти
\`\`\`

---

## Просмотр байт-кода: модуль dis

\`\`\`python
import dis

def example(x, y):
    if x > 0:
        return x + y
    return -x

dis.dis(example)
# Вывод (Python 3.12):
#   2           LOAD_FAST        0 (x)
#               LOAD_CONST       1 (0)
#               COMPARE_OP       4 (>)
#               POP_JUMP_IF_FALSE  ...
#   3           LOAD_FAST        0 (x)
#               LOAD_FAST        1 (y)
#               BINARY_OP        0 (+)
#               RETURN_VALUE
#   4           LOAD_FAST        0 (x)
#               UNARY_NEGATIVE
#               RETURN_VALUE

# Просмотр code object:
print(example.__code__.co_consts)      # (None, 0) — константы
print(example.__code__.co_varnames)    # ('x', 'y') — локальные переменные
print(example.__code__.co_stacksize)   # максимальная глубина стека
\`\`\`

### Peephole-оптимизация (constant folding)

CPython выполняет оптимизацию на этапе компиляции:

\`\`\`python
import dis

def constants():
    x = 2 ** 10        # вычисляется в compile-time → 1024
    y = "hello " * 3   # → "hello hello hello "
    return x, y

dis.dis(constants)
# LOAD_CONST  (1024, 'hello hello hello ')  ← уже результат, не вычисление!
# Нет инструкций BINARY_OP для ** и *

def non_constant(n):
    return n ** 10     # не фолдится: n неизвестно на этапе компиляции
\`\`\`

---

## Управление кэшем и продвинутые сценарии

\`\`\`python
# Запуск без записи .pyc (например, в read-only FS):
# python -B my_script.py
# или: export PYTHONDONTWRITEBYTECODE=1

# Предварительная компиляция всех .py в .pyc (для деплоя без исходников):
import compileall
compileall.compile_dir("my_package/", quiet=True)

# Проверка валидности .pyc:
import importlib.util

spec = importlib.util.spec_from_file_location("mymod", "mymod.py")
loader = spec.loader
source_path = loader.get_filename()
print(f"Bytecode path: {importlib.util.cache_from_source(source_path)}")

# Hash-based .pyc (не зависят от mtime — надёжнее в CI):
# python -m compileall --invalidation-mode checked-hash my_package/
\`\`\`

---

## Итог

| Режим | assert | docstring | \`__debug__\` | Применение |
|-------|--------|-----------|-------------|------------|
| Обычный | ✅ работают | ✅ есть | \`True\` | Разработка |
| \`-O\` | ❌ убраны | ✅ есть | \`False\` | Предпрод |
| \`-OO\` | ❌ убраны | ❌ убраны | \`False\` | Prod с ограниченной памятью |

> **Важно**: никогда не используйте \`assert\` для проверки пользовательского ввода или бизнес-логики — только для инвариантов при разработке.`,
  },
  {
    id: "perf-pytest-fixtures",
    question:
      "Как работают фикстуры в pytest (области видимости scope, yield, autouse) и как устроена динамическая параметризация тестов?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "middle",
    answer: `## Что такое фикстуры

Фикстуры в pytest — это функции, которые **подготавливают окружение** для тестов. Они решают три задачи: setup (подготовка), teardown (очистка) и **внедрение зависимостей** в тесты через аргументы.

\`\`\`python
# conftest.py — файл для общих фикстур (виден всем тестам в директории)
import pytest

@pytest.fixture
def simple_user() -> dict:
    """Простейшая фикстура: возвращает данные для теста."""
    return {"name": "Alice", "age": 30}

# test_user.py
def test_user_name(simple_user):  # ← pytest инжектирует фикстуру по имени аргумента
    assert simple_user["name"] == "Alice"

def test_user_age(simple_user):
    assert simple_user["age"] == 30
\`\`\`

---

## yield-фикстуры: setup + teardown

Код до \`yield\` — это setup, после \`yield\` — teardown. Teardown **гарантированно** выполняется даже если тест упал.

\`\`\`python
import pytest
import sqlite3

@pytest.fixture
def db_connection():
    """Фикстура с setup и teardown через yield."""
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE users (id INTEGER, name TEXT)")
    conn.execute("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')")
    conn.commit()

    yield conn          # ← сюда переходит управление во время теста

    # Teardown: выполняется после теста (даже при ошибке)
    conn.close()
    print("\\nБД закрыта")

def test_count_users(db_connection):
    count = db_connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    assert count == 2

def test_find_alice(db_connection):
    row = db_connection.execute("SELECT name FROM users WHERE id=1").fetchone()
    assert row[0] == "Alice"
\`\`\`

---

## Области видимости (scope)

Scope определяет, **как часто** фикстура создаётся и когда уничтожается.

\`\`\`python
import pytest

@pytest.fixture(scope="function")   # по умолчанию: новая на каждый тест
def func_fixture():
    print("\\n[function] создана")
    yield {"counter": 0}
    print("\\n[function] уничтожена")

@pytest.fixture(scope="class")      # одна на класс тестов
def class_fixture():
    print("\\n[class] создана")
    yield {"data": "shared"}
    print("\\n[class] уничтожена")

@pytest.fixture(scope="module")     # одна на модуль (файл)
def db_schema():
    print("\\n[module] создание схемы БД...")
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE items (id INTEGER, name TEXT)")
    yield conn
    conn.close()
    print("\\n[module] БД закрыта")

@pytest.fixture(scope="session")    # одна на всю сессию тестирования
def api_client():
    print("\\n[session] создание HTTP-клиента")
    import httpx
    client = httpx.Client(base_url="http://testserver")
    yield client
    client.close()
    print("\\n[session] клиент закрыт")

# Иерархия scope: session > package > module > class > function
# Фикстура с более узким scope может зависеть от фикстуры с более широким,
# но не наоборот!
\`\`\`

---

## autouse — автоматическое применение

\`\`\`python
import pytest
import time

@pytest.fixture(autouse=True)   # применяется ко ВСЕМ тестам в области видимости
def timer():
    """Замеряет время каждого теста."""
    start = time.monotonic()
    yield
    duration = time.monotonic() - start
    print(f"\\nТест выполнился за {duration:.3f}с")

@pytest.fixture(autouse=True, scope="module")
def reset_database():
    """Сбрасывает БД перед каждым модулем тестов."""
    print("\\nСброс БД для модуля")
    yield
    print("\\nОчистка после модуля")

# Тесты ниже автоматически получают обе фикстуры без объявления аргументов:
def test_fast():
    assert 1 + 1 == 2

def test_slow():
    time.sleep(0.1)
    assert "hello".upper() == "HELLO"
\`\`\`

---

## Зависимости между фикстурами

\`\`\`python
import pytest
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str

@pytest.fixture(scope="session")
def app_config() -> dict:
    return {"db_url": "sqlite:///:memory:", "debug": True}

@pytest.fixture(scope="module")
def db(app_config) -> sqlite3.Connection:   # ← зависит от app_config
    conn = sqlite3.connect(app_config["db_url"].split("///")[1])
    conn.execute("CREATE TABLE users (id INTEGER, name TEXT)")
    yield conn
    conn.close()

@pytest.fixture
def sample_user(db) -> User:               # ← зависит от db
    db.execute("INSERT INTO users VALUES (42, 'TestUser')")
    db.commit()
    user = User(id=42, name="TestUser")
    yield user
    db.execute("DELETE FROM users WHERE id = 42")  # teardown
    db.commit()

def test_user_in_db(db, sample_user):
    row = db.execute("SELECT name FROM users WHERE id=42").fetchone()
    assert row[0] == sample_user.name
\`\`\`

---

## Параметризация тестов

### Базовая параметризация

\`\`\`python
import pytest

@pytest.mark.parametrize("n,expected", [
    (0, 1),      # 0! = 1
    (1, 1),      # 1! = 1
    (5, 120),    # 5! = 120
    (10, 3628800),
])
def test_factorial(n, expected):
    from math import factorial
    assert factorial(n) == expected

# pytest создаёт 4 отдельных теста:
# test_factorial[0-1]
# test_factorial[1-1]
# test_factorial[5-120]
# test_factorial[10-3628800]
\`\`\`

### Параметризация с ids и marks

\`\`\`python
import pytest

@pytest.mark.parametrize(
    "input_str, expected",
    [
        pytest.param("hello", "HELLO", id="lowercase"),
        pytest.param("WORLD", "WORLD", id="already_upper"),
        pytest.param("", "", id="empty_string"),
        pytest.param(
            "mixed CASE",
            "MIXED CASE",
            id="mixed",
            marks=pytest.mark.xfail(reason="известная проблема"),
        ),
    ],
)
def test_upper(input_str, expected):
    assert input_str.upper() == expected
\`\`\`

### Динамическая параметризация (indirect)

\`\`\`python
import pytest

USERS_DATA = [
    {"id": 1, "role": "admin"},
    {"id": 2, "role": "user"},
    {"id": 3, "role": "moderator"},
]

@pytest.fixture
def user(request):
    """Фикстура, получающая параметр через indirect."""
    user_id = request.param
    data = next(u for u in USERS_DATA if u["id"] == user_id)
    return data

@pytest.mark.parametrize("user", [1, 2, 3], indirect=True)
def test_user_has_role(user):
    assert "role" in user
    assert user["role"] in ("admin", "user", "moderator")
\`\`\`

### pytest_generate_tests — полностью динамическая параметризация

\`\`\`python
# conftest.py

def pytest_generate_tests(metafunc):
    """Хук для динамической параметризации на основе конфигурации."""

    if "db_engine" in metafunc.fixturenames:
        # Запускаем тест для каждого поддерживаемого движка БД
        engines = metafunc.config.getoption(
            "--db-engines",
            default="sqlite,postgresql",
        ).split(",")
        metafunc.parametrize("db_engine", engines)

    if "locale" in metafunc.fixturenames:
        # Или параметризуем по локалям из файла
        import json
        locales = json.loads(open("test_locales.json").read())
        metafunc.parametrize("locale", locales)

# pytest.ini / pyproject.toml:
# [pytest]
# addopts = --db-engines=sqlite,postgresql
\`\`\`

---

## Хранение фикстур: иерархия conftest.py

\`\`\`
tests/
├── conftest.py          # фикстуры доступны всем тестам
├── unit/
│   ├── conftest.py      # фикстуры только для unit-тестов
│   └── test_models.py
└── integration/
    ├── conftest.py      # фикстуры только для интеграционных тестов
    └── test_api.py
\`\`\`

\`\`\`python
# Просмотр всех доступных фикстур:
# pytest --fixtures

# Запуск только параметризованных кейсов с определённым id:
# pytest -k "lowercase or empty_string"

# Показать, какие фикстуры использует тест:
# pytest --setup-show test_user.py
\`\`\``,
  },
  {
    id: "perf-weakref-memory-leaks",
    question:
      "Каковы особенности работы со слабыми ссылками (weakref) и в каких прикладных сценариях их применение критически важно для предотвращения утечек памяти?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "senior",
    answer: `## Сильные vs слабые ссылки

**Сильная ссылка** (обычная) увеличивает счётчик ссылок (\`ob_refcnt\`) объекта и не позволяет сборщику мусора его удалить. **Слабая ссылка** не увеличивает счётчик — объект может быть уничтожен, даже если слабые ссылки на него существуют.

\`\`\`python
import weakref
import gc

class HeavyObject:
    def __init__(self, name: str):
        self.name = name
        self.data = [0] * 1_000_000   # ~8 МБ

    def __del__(self):
        print(f"HeavyObject '{self.name}' уничтожен")

# Сильная ссылка: объект живёт пока жив strong_ref
obj = HeavyObject("alpha")
strong_ref = obj   # ob_refcnt = 2

# Слабая ссылка: ob_refcnt НЕ увеличивается
weak_ref = weakref.ref(obj)

print(weak_ref())          # <HeavyObject object> — объект жив
print(weak_ref().name)     # 'alpha'

del obj
del strong_ref             # ob_refcnt → 0, объект уничтожается
# HeavyObject 'alpha' уничтожен

print(weak_ref())          # None — объект мёртв, weakref вернул None
\`\`\`

---

## Callback при уничтожении объекта

\`\`\`python
import weakref

class Resource:
    def __init__(self, name): self.name = name

def on_finalized(ref):
    print(f"Объект уничтожен, ссылка: {ref}")

obj = Resource("db_connection")
weak = weakref.ref(obj, on_finalized)   # callback вызовется при смерти объекта

del obj   # → "Объект уничтожен, ссылка: <weakref at 0x...>"
\`\`\`

---

## Сценарий 1: кэш без утечек (WeakValueDictionary)

Самый частый кейс. Кэш хранит слабые ссылки на объекты: если объект нигде больше не используется, он автоматически исчезает из кэша.

\`\`\`python
import weakref

class ExpensiveResult:
    def __init__(self, query: str, data: list):
        self.query = query
        self.data = data

    def __del__(self):
        print(f"Кэш: '{self.query}' вытеснен из памяти")

class QueryCache:
    """Кэш, который не держит объекты живыми принудительно."""

    def __init__(self):
        self._cache: weakref.WeakValueDictionary[str, ExpensiveResult] = (
            weakref.WeakValueDictionary()
        )

    def get_or_compute(self, query: str) -> ExpensiveResult:
        result = self._cache.get(query)
        if result is None:
            print(f"Вычисляем: '{query}'")
            result = ExpensiveResult(query, [1, 2, 3])   # дорогая операция
            self._cache[query] = result
        else:
            print(f"Из кэша: '{query}'")
        return result

cache = QueryCache()

r1 = cache.get_or_compute("SELECT * FROM users")   # вычисляем
r2 = cache.get_or_compute("SELECT * FROM users")   # из кэша
print(r1 is r2)   # True — один объект

del r1, r2   # единственные сильные ссылки удалены
# Кэш: 'SELECT * FROM users' вытеснен из памяти

r3 = cache.get_or_compute("SELECT * FROM users")   # снова вычисляем
\`\`\`

---

## Сценарий 2: обратные ссылки без циклических ссылок

Когда объекты должны знать о своём «контейнере», прямая ссылка создаёт цикл и задержку GC:

\`\`\`python
import weakref

class EventBus:
    def __init__(self):
        # WeakSet: хранит подписчиков, не препятствуя их удалению
        self._subscribers: weakref.WeakSet["Subscriber"] = weakref.WeakSet()

    def subscribe(self, sub: "Subscriber") -> None:
        self._subscribers.add(sub)

    def publish(self, event: str) -> None:
        for sub in list(self._subscribers):   # list() — снимок, т.к. WeakSet может меняться
            sub.on_event(event)

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)

class Subscriber:
    def __init__(self, name: str, bus: EventBus):
        self.name = name
        self._bus = weakref.ref(bus)   # ← слабая ссылка на bus, чтобы не создавать цикл

    def on_event(self, event: str) -> None:
        print(f"{self.name} получил: {event}")

    def __del__(self):
        print(f"Subscriber '{self.name}' уничтожен")

bus = EventBus()

s1 = Subscriber("A", bus)
s2 = Subscriber("B", bus)
bus.subscribe(s1)
bus.subscribe(s2)

bus.publish("start")         # A получил: start / B получил: start
print(bus.subscriber_count)  # 2

del s1   # Subscriber 'A' уничтожен — автоматически исчез из WeakSet
bus.publish("stop")          # только B получил: stop
print(bus.subscriber_count)  # 1
\`\`\`

---

## Сценарий 3: finalize — надёжный деструктор

\`weakref.finalize\` гарантирует вызов функции очистки, даже если нет явного \`__del__\`:

\`\`\`python
import weakref

class TempFile:
    """Временный файл, который удаляется при GC."""

    def __init__(self, path: str):
        self.path = path
        # Регистрируем cleanup: вызовется когда объект умрёт
        self._finalizer = weakref.finalize(
            self,
            self._cleanup,   # НЕ метод self (предотвращает цикл)!
            path,
        )

    @staticmethod
    def _cleanup(path: str) -> None:
        import os
        try:
            os.remove(path)
            print(f"Удалён временный файл: {path}")
        except FileNotFoundError:
            pass

    def cleanup_now(self) -> None:
        """Явная очистка без ожидания GC."""
        self._finalizer()   # вызвать досрочно

    @property
    def alive(self) -> bool:
        return self._finalizer.alive

tmp = TempFile("/tmp/report_12345.csv")
print(tmp.alive)   # True

del tmp
# "Удалён временный файл: /tmp/report_12345.csv"
\`\`\`

---

## Что поддерживает weakref, а что нет

\`\`\`python
import weakref

# ✅ Поддерживают weakref:
class MyClass: pass
weakref.ref(MyClass())          # пользовательские классы

# ❌ НЕ поддерживают weakref (встроенные иммутабельные типы):
try:
    weakref.ref([1, 2, 3])     # list — поддерживает!
    weakref.ref(42)             # int — TypeError!
    weakref.ref("hello")        # str — TypeError!
    weakref.ref((1, 2))         # tuple — TypeError!
except TypeError as e:
    print(e)

# Добавить поддержку weakref в собственный класс с __slots__:
class SlottedWithWeakref:
    __slots__ = ("x", "__weakref__")   # ← обязательно добавить "__weakref__"
    def __init__(self, x):
        self.x = x

obj = SlottedWithWeakref(42)
ref = weakref.ref(obj)   # теперь работает
\`\`\`

---

## Итоговая карта weakref-коллекций

| Класс | Описание |
|-------|----------|
| \`weakref.ref(obj)\` | Одиночная слабая ссылка |
| \`weakref.WeakValueDictionary\` | dict со слабыми values (для кэшей) |
| \`weakref.WeakKeyDictionary\` | dict со слабыми keys (для мета-данных объектов) |
| \`weakref.WeakSet\` | set со слабыми ссылками (для подписчиков/наблюдателей) |
| \`weakref.finalize\` | Callback при уничтожении объекта (надёжный деструктор) |`,
  },
  {
    id: "perf-circular-imports",
    question:
      "Как вы будете решать проблему циклического импорта (Circular Import) в растущем проекте? Каковы глубинные причины этой проблемы на уровне механизма импортирования?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "senior",
    answer: `## Как работает механизм импорта Python

Python кэширует модули в \`sys.modules\`. При импорте:

1. Проверить \`sys.modules\` — если модуль уже там, вернуть его.
2. Создать **пустой** объект модуля и **сразу** добавить в \`sys.modules\`.
3. Начать исполнение кода модуля (заполнять объект атрибутами).
4. Вернуть готовый модуль.

Цикл возникает потому, что на шаге 2 модуль добавляется **ещё пустым**: если в процессе его выполнения (шаг 3) другой модуль импортирует его снова — он получает недозаполненный объект.

\`\`\`python
# Воспроизведём цикл:
# models.py
from services import UserService   # ← импортирует services до того, как models готов

class User:
    pass

# services.py
from models import User   # ← импортирует models, который ещё не дозаполнен

class UserService:
    def create(self) -> "User":
        return User()

# Запуск: python -c "import models"
# ImportError: cannot import name 'User' from partially initialized module 'models'
\`\`\`

---

## Диагностика: где цикл?

\`\`\`python
import sys
import importlib

# Включаем verbose-режим импорта:
# python -v my_script.py 2>&1 | grep "import"

# Или через утилиту:
# pip install importlab
# importlab --graph mypackage/

# Быстрая диагностика в коде:
def show_import_order():
    import sys
    for name, mod in sorted(sys.modules.items()):
        if not name.startswith("_"):
            print(name)
\`\`\`

---

## Решение 1: реструктуризация — единственный правильный ответ

Циклический импорт — симптом проблемы в архитектуре. Перед применением обходных трюков спросите: «Правильно ли разбиты обязанности между модулями?»

\`\`\`
❌ Цикл:
models.py ──import──► services.py ──import──► models.py

✅ Решение: вынести общие типы в третий модуль:
types.py (базовые типы, нет зависимостей)
    ↑                    ↑
models.py           services.py
\`\`\`

\`\`\`python
# types.py — чистый модуль, от которого зависят оба
from dataclasses import dataclass

@dataclass
class UserDTO:
    id: int
    name: str

# models.py
from types_module import UserDTO   # ← нет зависимости от services

class User:
    def to_dto(self) -> UserDTO:
        return UserDTO(id=self.id, name=self.name)

# services.py
from types_module import UserDTO   # ← нет зависимости от models

class UserService:
    def create(self, name: str) -> UserDTO:
        return UserDTO(id=1, name=name)
\`\`\`

---

## Решение 2: отложенный импорт внутри функции/метода

Если реструктуризация невозможна — перенести импорт внутрь функции. Модуль импортируется только при первом вызове функции, а не на уровне модуля.

\`\`\`python
# services.py
class UserService:
    def create_and_notify(self, name: str):
        # Импорт только здесь — к этому моменту models уже полностью загружен
        from models import User   # ← отложенный импорт
        user = User(name=name)
        return user

    def get_report(self):
        from reports import ReportGenerator   # ← ещё один отложенный импорт
        return ReportGenerator().generate()
\`\`\`

**Минусы**: импорт при каждом вызове (хотя Python кэширует в \`sys.modules\`, накладные расходы минимальны). Труднее увидеть зависимости модуля.

---

## Решение 3: TYPE_CHECKING — для аннотаций типов

Самый частый реальный случай: циклический импорт нужен **только для аннотаций**, не для рантайма.

\`\`\`python
# order.py
from __future__ import annotations   # ← делает ВСЕ аннотации строками (lazy evaluation)
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Этот блок выполняется ТОЛЬКО при статическом анализе (mypy/pyright),
    # не при запуске программы — цикла нет!
    from customer import Customer

class Order:
    def __init__(self, customer: "Customer"):   # строка → нет импорта в рантайме
        self._customer = customer

    def get_customer(self) -> "Customer":       # возвращаемый тип — строка
        return self._customer

# customer.py
from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from order import Order

class Customer:
    def get_orders(self) -> list["Order"]:
        from order import Order   # ← рантайм-импорт только здесь
        return []
\`\`\`

---

## Решение 4: паттерн «Dependency Inversion» — через Protocol

Вместо прямого импорта — зависимость от абстракции (Protocol), определённой в общем модуле.

\`\`\`python
# interfaces.py — общие протоколы, нет бизнес-зависимостей
from typing import Protocol

class Notifiable(Protocol):
    def notify(self, message: str) -> None: ...

class Persistable(Protocol):
    def save(self) -> None: ...

# user_service.py — зависит от интерфейса, не от конкретного класса
from interfaces import Notifiable

class UserService:
    def __init__(self, notifier: Notifiable):
        self._notifier = notifier

    def register(self, name: str) -> None:
        # ... логика ...
        self._notifier.notify(f"Новый пользователь: {name}")

# email_service.py — реализует интерфейс, не импортирует UserService
from interfaces import Notifiable

class EmailService:
    def notify(self, message: str) -> None:
        print(f"Email: {message}")

# main.py — Composition Root: единственное место с полными импортами
from user_service import UserService
from email_service import EmailService

service = UserService(notifier=EmailService())
service.register("Alice")
\`\`\`

---

## Решение 5: importlib.import_module для динамических импортов

\`\`\`python
import importlib

class PluginLoader:
    def load(self, module_path: str, class_name: str):
        """Загружает класс по строковому пути — нет статических циклических зависимостей."""
        module = importlib.import_module(module_path)
        return getattr(module, class_name)

loader = PluginLoader()
UserService = loader.load("services.user", "UserService")
service = UserService()
\`\`\`

---

## Итоговый алгоритм решения

\`\`\`
1. Циклический импорт обнаружен
       │
       ▼
2. Это аннотации типов?
   ├─ ДА → TYPE_CHECKING + "строковые" аннотации (+ from __future__ import annotations)
   └─ НЕТ ↓
       │
       ▼
3. Можно реструктурировать?
   ├─ ДА → вынести общие типы в отдельный модуль (interfaces.py / types.py)
   └─ НЕТ ↓
       │
       ▼
4. Это редкий путь кода?
   ├─ ДА → отложенный импорт внутри функции
   └─ НЕТ → пересмотреть архитектуру (нарушение принципов связности)
\`\`\``,
  },
  {
    id: "perf-typing-mypy-typevar-generic",
    question:
      "В чём разница между типизацией в рантайме и статическим анализом кода (mypy, pyright)? Как работают конструкции TypeVar, Generic и Overload?",
    category: "Оптимизация производительности, тестирование и экосистема",
    difficulty: "senior",
    answer: `## Рантайм-типизация vs статический анализ

В Python аннотации типов **не влияют на выполнение программы** — это просто метаданные. Их используют статические анализаторы (mypy, pyright) для проверки корректности кода **до запуска**.

\`\`\`python
# Аннотации — это просто атрибут __annotations__, не проверки:
def add(x: int, y: int) -> int:
    return x + y

# В рантайме аннотации игнорируются:
result = add("hello", " world")   # → "hello world" — никакой ошибки!
print(add.__annotations__)        # {'x': <class 'int'>, 'y': <class 'int'>, 'return': <class 'int'>}

# Mypy/pyright ОБНАРУЖАТ ошибку ДО запуска:
# error: Argument 1 to "add" has incompatible type "str"; expected "int"
\`\`\`

### Рантайм-валидация: Pydantic, beartype

\`\`\`python
# beartype: декоратор для рантайм-проверки аннотаций
# pip install beartype
from beartype import beartype

@beartype
def divide(a: float, b: float) -> float:
    return a / b

divide(10.0, 2.0)    # OK
divide("10", 2.0)    # BeartypeException: str is not float — в рантайме!
\`\`\`

---

## TypeVar — переменная типа

\`TypeVar\` позволяет писать обобщённые функции, где тип входа связан с типом выхода:

\`\`\`python
from typing import TypeVar

T = TypeVar("T")   # неограниченный TypeVar

def first(items: list[T]) -> T:
    """Возвращает первый элемент. Тип возврата = тип элементов списка."""
    return items[0]

x = first([1, 2, 3])       # mypy: x: int
s = first(["a", "b"])      # mypy: s: str
# first([])                # mypy: OK но рантайм IndexError

# TypeVar с ограничением (bound): тип должен быть подтипом указанного
from datetime import date

Comparable = TypeVar("Comparable", bound="SupportsLessThan")

class SupportsLessThan:
    def __lt__(self, other) -> bool: ...

def find_min(items: list[T]) -> T:
    return min(items)   # type: ignore — упрощение

# TypeVar с конкретными вариантами (только один из перечисленных типов):
Numeric = TypeVar("Numeric", int, float, complex)

def double(x: Numeric) -> Numeric:
    return x * 2   # type: ignore

print(double(5))     # 10    — тип int
print(double(3.14))  # 6.28  — тип float
\`\`\`

---

## Generic — обобщённые классы

\`\`\`python
from typing import Generic, TypeVar, Iterator

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")

class Stack(Generic[T]):
    """Типизированный стек: тип элементов фиксируется при создании."""

    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("Стек пуст")
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

    def __len__(self) -> int:
        return len(self._items)

    def __iter__(self) -> Iterator[T]:
        return iter(reversed(self._items))

# mypy отслеживает конкретный тип:
int_stack: Stack[int] = Stack()
int_stack.push(42)
int_stack.push(100)
value: int = int_stack.pop()    # mypy: value: int
# int_stack.push("hello")       # mypy: error — str несовместим с int

str_stack: Stack[str] = Stack()
str_stack.push("hello")
str_stack.push("world")

# Обобщённые классы с несколькими параметрами:
class TypedMap(Generic[K, V]):
    def __init__(self) -> None:
        self._data: dict[K, V] = {}

    def set(self, key: K, value: V) -> None:
        self._data[key] = value

    def get(self, key: K) -> V | None:
        return self._data.get(key)

cache: TypedMap[str, int] = TypedMap()
cache.set("count", 42)
n: int | None = cache.get("count")   # mypy: n: int | None
\`\`\`

---

## Python 3.12+: синтаксис type параметров (PEP 695)

\`\`\`python
# Python 3.12+: чистый синтаксис без явного TypeVar
def first[T](items: list[T]) -> T:   # ← T объявляется прямо здесь
    return items[0]

class Stack[T]:                        # ← T объявляется в заголовке класса
    def push(self, item: T) -> None: ...
    def pop(self) -> T: ...

# Ограничения:
def process[T: (int, float)](x: T) -> T:   # T только int или float
    return x * 2
\`\`\`

---

## Overload — перегрузка сигнатур

\`@overload\` позволяет указать разные типы входа/выхода для одной функции. В рантайме работает только последняя (без \`@overload\`) реализация:

\`\`\`python
from typing import overload

# Паттерн: разные типы аргументов → разные типы возврата
@overload
def parse_value(value: str) -> str: ...
@overload
def parse_value(value: int) -> int: ...
@overload
def parse_value(value: list[str]) -> list[str]: ...

def parse_value(value: str | int | list[str]) -> str | int | list[str]:
    """Реальная реализация (только она выполняется в рантайме)."""
    if isinstance(value, list):
        return [v.strip() for v in value]
    if isinstance(value, str):
        return value.strip()
    return value * 2

# mypy понимает: тип возврата зависит от типа аргумента
s: str = parse_value("  hello  ")        # mypy: str
n: int = parse_value(21)                 # mypy: int  (→ 42)
lst: list[str] = parse_value(["a ", "b"]) # mypy: list[str]
# s: str = parse_value(21)  # mypy: error — int несовместим с str
\`\`\`

### Реальный кейс: open() с разными режимами

\`\`\`python
from typing import overload, Literal

@overload
def read_file(path: str, binary: Literal[True]) -> bytes: ...
@overload
def read_file(path: str, binary: Literal[False] = ...) -> str: ...

def read_file(path: str, binary: bool = False) -> str | bytes:
    mode = "rb" if binary else "r"
    with open(path, mode) as f:
        return f.read()

text: str   = read_file("file.txt")          # mypy: str
data: bytes = read_file("file.bin", True)    # mypy: bytes
\`\`\`

---

## Protocol + Generic: мощная комбинация

\`\`\`python
from typing import Protocol, TypeVar, Generic

T_co = TypeVar("T_co", covariant=True)      # ковариантный: только для чтения

class Readable(Protocol[T_co]):
    def read(self) -> T_co: ...

class StringReader:
    def read(self) -> str:
        return "hello"

class IntReader:
    def read(self) -> int:
        return 42

def consume(reader: Readable[T_co]) -> T_co:
    return reader.read()

s: str = consume(StringReader())   # mypy: str
n: int = consume(IntReader())      # mypy: int
\`\`\`

---

## Настройка mypy и pyright

\`\`\`toml
# mypy.ini / pyproject.toml
[mypy]
strict = true              # включить все проверки
python_version = "3.12"
warn_return_any = true
disallow_untyped_defs = true
check_untyped_defs = true

# pyproject.toml (pyright)
[tool.pyright]
typeCheckingMode = "strict"
pythonVersion = "3.12"
reportMissingImports = true
reportUnknownMemberType = true
\`\`\`

\`\`\`bash
# Запуск проверок:
mypy src/
pyright src/

# Интерактивно в IDE: pylance (VS Code), mypy-плагин (PyCharm)
\`\`\``,
  },
  {
    id: "basic-list-vs-tuple",
    question:
      "Чем отличаются списки (list) от кортежей (tuple) с точки зрения синтаксиса, мутабельности и памяти?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Главное различие: мутабельность

\`list\` — **изменяемая** (mutable) последовательность. \`tuple\` — **неизменяемая** (immutable).

\`\`\`python
lst = [1, 2, 3]
lst[0] = 99        # OK
lst.append(4)      # OK
lst.pop()          # OK

tup = (1, 2, 3)
tup[0] = 99        # TypeError: 'tuple' object does not support item assignment
\`\`\`

---

## Синтаксис

\`\`\`python
# list: квадратные скобки
empty_list  = []
single_list = [42]
multi_list  = [1, 2, 3]

# tuple: круглые скобки (или вообще без них)
empty_tuple  = ()
single_tuple = (42,)   # ← ОБЯЗАТЕЛЬНА запятая! (42) — это просто int
multi_tuple  = (1, 2, 3)
packed_tuple = 1, 2, 3   # тоже tuple

# Распаковка (работает для обоих):
a, b, c = [10, 20, 30]   # list
x, y, z = (10, 20, 30)   # tuple
first, *rest = [1, 2, 3, 4]   # first=1, rest=[2, 3, 4]
\`\`\`

---

## Память: tuple компактнее

\`\`\`python
import sys

lst = [1, 2, 3, 4, 5]
tup = (1, 2, 3, 4, 5)

print(sys.getsizeof(lst))   # 120 байт (Python 3.12)
print(sys.getsizeof(tup))   # 80 байт

# Почему list больше?
# list хранит дополнительный буфер (over-allocation) для будущих append:
lst2 = []
print(sys.getsizeof(lst2))   # 56 байт
lst2.append(1)
print(sys.getsizeof(lst2))   # 88 байт — зарезервировано место для 3 доп. элементов

# Проверим нарастание:
import sys
for n in range(9):
    l = list(range(n))
    print(f"len={n}: {sys.getsizeof(l)} байт")
# len=0: 56, len=1: 88, len=2: 88, len=3: 88, len=4: 88, len=5: 120 ...
# Скачок каждые 4 элемента — over-allocation в действии
\`\`\`

---

## Производительность

\`\`\`python
import timeit

# tuple создаётся быстрее (компилятор может оптимизировать литерал)
t_list  = timeit.timeit("x = [1, 2, 3, 4, 5]", number=10_000_000)
t_tuple = timeit.timeit("x = (1, 2, 3, 4, 5)", number=10_000_000)
print(f"list:  {t_list:.3f}s")    # ~0.35s
print(f"tuple: {t_tuple:.3f}s")   # ~0.08s (tuple-литерал — константа в байт-коде)

# Итерация одинакова:
t_iter_l = timeit.timeit("for x in [1,2,3,4,5]: pass", number=5_000_000)
t_iter_t = timeit.timeit("for x in (1,2,3,4,5): pass", number=5_000_000)
# Примерно одинаково
\`\`\`

---

## Hashability: tuple можно использовать как ключ dict

\`\`\`python
# tuple неизменяем → может быть хэшируемым → можно в set и как ключ dict
coords = {
    (0, 0): "origin",
    (1, 0): "right",
    (0, 1): "up",
}
print(coords[(0, 0)])   # "origin"

point = (3, 4)
cache = {point: 5.0}    # OK — tuple hashable

# list нельзя хэшировать:
try:
    bad = {[1, 2]: "value"}   # TypeError: unhashable type: 'list'
except TypeError as e:
    print(e)

# Важно: tuple с изменяемым элементом — не хэшируем!
try:
    t = ([1, 2], 3)
    hash(t)   # TypeError: unhashable type: 'list'
except TypeError as e:
    print(e)
\`\`\`

---

## Когда что использовать

| Критерий | list | tuple |
|----------|------|-------|
| Данные изменяются | ✅ | ❌ |
| Фиксированная структура (x, y, z) | ❌ | ✅ |
| Ключ словаря / элемент set | ❌ | ✅ (если всё иммутабельно) |
| Передаёте «запись» (имя, возраст) | ❌ | ✅ |
| Накапливаете элементы динамически | ✅ | ❌ |
| Экономия памяти для константных данных | ❌ | ✅ |`,
  },
  {
    id: "basic-is-vs-equals",
    question:
      "В чём разница между операторами is и ==? В каких случаях их поведение может удивить новичка?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Суть различия

- \`==\` — **равенство по значению**: вызывает \`__eq__\`, сравнивает содержимое.
- \`is\` — **идентичность объектов**: проверяет, что две переменные ссылаются на **один и тот же объект** в памяти (сравнивает \`id()\`).

\`\`\`python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)    # True  — одинаковое содержимое
print(a is b)    # False — разные объекты в памяти
print(a is c)    # True  — c указывает на тот же объект, что и a

print(id(a), id(b), id(c))
# 140234567890 140234567920 140234567890
#    (a и c одинаковые, b другой)
\`\`\`

---

## Ловушка 1: интернирование малых целых чисел

CPython кэширует целые числа в диапазоне от **-5 до 256**. Все переменные с таким значением указывают на один объект:

\`\`\`python
x = 256
y = 256
print(x is y)   # True  ← число в диапазоне кэша

x = 257
y = 257
print(x is y)   # False ← вне диапазона, создаются два объекта

# Но:
x = y = 257     # одно присвоение → один объект
print(x is y)   # True

# Ещё пример:
a = 100
b = 100
print(a is b)   # True (100 в кэше)

a = 1000
b = 1000
print(a is b)   # False (1000 вне кэша)
\`\`\`

---

## Ловушка 2: интернирование строк

CPython также может «интернировать» строки, особенно если они выглядят как идентификаторы:

\`\`\`python
s1 = "hello"
s2 = "hello"
print(s1 is s2)   # True — Python интернировал одинаковые строки-литералы

s1 = "hello world"
s2 = "hello world"
print(s1 is s2)   # True или False — поведение не гарантировано (contains space)

# Не полагайтесь на is для строк!
s1 = "".join(["h", "e", "l", "l", "o"])
s2 = "hello"
print(s1 == s2)   # True  — по значению
print(s1 is s2)   # False — разные объекты (s1 создан в рантайме)

# Явное интернирование:
import sys
s1 = sys.intern("hello world")
s2 = sys.intern("hello world")
print(s1 is s2)   # True — после явного интернирования
\`\`\`

---

## Ловушка 3: None, True, False — всегда используйте is

\`None\`, \`True\` и \`False\` — синглтоны в Python. Для них корректно использовать \`is\`:

\`\`\`python
x = None

# ✅ Правильно:
if x is None:
    print("x is None")

if x is not None:
    print("x has a value")

# ❌ Работает, но не идиоматично:
if x == None:
    print("works but not recommended")

# Почему == опасно с None:
class Weird:
    def __eq__(self, other):
        return True   # равно чему угодно!

w = Weird()
print(w == None)   # True  ← опасно!
print(w is None)   # False ← правильно
\`\`\`

---

## Практические правила

\`\`\`python
# ✅ Используйте is/is not для:
x is None
x is not None
x is True
x is False

# ✅ Используйте == для сравнения значений:
age == 18
name == "Alice"
lst == [1, 2, 3]

# ❌ Никогда не используйте is для сравнения чисел, строк, списков и т.д.:
# if x is 256: ...   # работает случайно
# if s is "hello":   # ненадёжно

# Исключение: сравнение классов и типов
print(type(42) is int)    # True — тут is уместен
print(type(42) is float)  # False
\`\`\`

---

## Итог

| | \`==\` | \`is\` |
|--|-------|-------|
| Что сравнивает | Значение (\`__eq__\`) | Идентичность (\`id()\`) |
| Применение | Большинство случаев | \`None\`, \`True\`, \`False\` |
| Скорость | Зависит от \`__eq__\` | O(1), очень быстро |
| Можно обмануть | Да (переопределить \`__eq__\`) | Нет |`,
  },
  {
    id: "basic-args-kwargs",
    question:
      "Что такое *args и **kwargs, для чего они нужны и в каком порядке должны идти в объявлении функции?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## *args — произвольное число позиционных аргументов

\`*args\` собирает все лишние позиционные аргументы в **кортеж**:

\`\`\`python
def sum_all(*args: int) -> int:
    print(type(args), args)   # <class 'tuple'> (1, 2, 3, 4)
    return sum(args)

print(sum_all(1, 2, 3))       # 6
print(sum_all(1, 2, 3, 4, 5)) # 15
print(sum_all())               # 0

# Имя args — соглашение, можно использовать любое имя:
def concat(*strings: str) -> str:
    return " ".join(strings)

print(concat("Hello", "World", "Python"))   # "Hello World Python"
\`\`\`

---

## **kwargs — произвольное число именованных аргументов

\`**kwargs\` собирает все лишние именованные аргументы в **словарь**:

\`\`\`python
def print_info(**kwargs: str) -> None:
    print(type(kwargs), kwargs)
    for key, value in kwargs.items():
        print(f"  {key}: {value}")

print_info(name="Alice", age="30", city="Moscow")
# <class 'dict'> {'name': 'Alice', 'age': '30', 'city': 'Moscow'}
#   name: Alice
#   age: 30
#   city: Moscow

# Реальный пример: передача конфига
def create_user(name: str, **options) -> dict:
    user = {"name": name}
    user.update(options)
    return user

user = create_user("Alice", role="admin", active=True, score=100)
print(user)   # {'name': 'Alice', 'role': 'admin', 'active': True, 'score': 100}
\`\`\`

---

## Обязательный порядок параметров в функции

\`\`\`python
def full_signature(
    pos1,                    # 1. Обязательный позиционный
    pos2,
    /,                       # 2. '/' — всё до него: только позиционные (Python 3.8+)
    regular,                 # 3. Обычный (позиционный ИЛИ именованный)
    optional=42,             # 4. Позиционный с дефолтом
    *args,                   # 5. Произвольные позиционные
    kw_only,                 # 6. Только именованный (после *args)
    kw_with_default="hi",    # 7. Только именованный с дефолтом
    **kwargs,                # 8. Произвольные именованные
) -> None:
    print(pos1, pos2, regular, optional, args, kw_only, kw_with_default, kwargs)

full_signature(1, 2, 3, kw_only="required")
# 1 2 3 42 () required hi {}

full_signature(1, 2, 3, 99, 4, 5, 6, kw_only="x", extra="y")
# 1 2 3 99 (4, 5, 6) x hi {'extra': 'y'}

# pos1 и pos2 — ТОЛЬКО позиционные:
# full_signature(pos1=1, pos2=2, regular=3, kw_only="x")
# TypeError: ... got some positional-only arguments passed as keyword arguments
\`\`\`

---

## Распаковка при вызове: * и **

\`\`\`python
def add(a: int, b: int, c: int) -> int:
    return a + b + c

numbers = [1, 2, 3]
print(add(*numbers))        # 6 — распаковка списка в позиционные аргументы

data = {"a": 10, "b": 20, "c": 30}
print(add(**data))          # 60 — распаковка dict в именованные аргументы

# Комбинирование:
defaults = {"b": 5, "c": 10}
print(add(1, **defaults))   # 16

# Слияние словарей через **:
d1 = {"x": 1, "y": 2}
d2 = {"y": 99, "z": 3}
merged = {**d1, **d2}       # {'x': 1, 'y': 99, 'z': 3} — d2 перезаписывает d1

# Слияние списков через *:
a = [1, 2, 3]
b = [4, 5, 6]
combined = [*a, *b]         # [1, 2, 3, 4, 5, 6]
\`\`\`

---

## Практический пример: декоратор с передачей аргументов

\`\`\`python
import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):   # принимает любые аргументы
        start = time.monotonic()
        result = func(*args, **kwargs)   # передаёт их дальше
        print(f"{func.__name__} выполнялся {time.monotonic() - start:.3f}с")
        return result
    return wrapper

@timer
def compute(n: int, *, verbose: bool = False) -> int:
    if verbose:
        print(f"Вычисляю для n={n}")
    return sum(range(n))

compute(1_000_000)
compute(500_000, verbose=True)
\`\`\`

---

## Шпаргалка по порядку

\`\`\`
def f(обязательные, дефолтные, *args, keyword_only, **kwargs)
       ↑              ↑           ↑          ↑             ↑
    1 или             со       собирает    только        собирает
    несколько        значением  лишние     через        лишние
    позиционных      по умолч.  позиц.     имя          именованные
\`\`\``,
  },
  {
    id: "basic-mutable-immutable",
    question:
      "Каковы особенности изменяемых (mutable) и неизменяемых (immutable) типов данных? Приведите примеры.",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Ключевое различие

**Immutable (неизменяемый)**: после создания объект нельзя изменить. Любая «модификация» создаёт **новый** объект.

**Mutable (изменяемый)**: объект можно изменить на месте, не создавая новый.

\`\`\`python
# Immutable: str
s = "hello"
print(id(s))        # 140234567890
s = s + " world"    # создаётся НОВЫЙ объект!
print(id(s))        # 140234999999  ← другой id

# Mutable: list
lst = [1, 2, 3]
print(id(lst))      # 140234111111
lst.append(4)       # ТОТ ЖЕ объект модифицируется
print(id(lst))      # 140234111111  ← тот же id
\`\`\`

---

## Таблица типов

| Immutable (неизменяемые) | Mutable (изменяемые) |
|--------------------------|----------------------|
| \`int\`, \`float\`, \`complex\` | \`list\` |
| \`str\` | \`dict\` |
| \`bytes\` | \`set\` |
| \`tuple\` (если элементы иммутабельны) | \`bytearray\` |
| \`frozenset\` | Пользовательские классы (по умолчанию) |
| \`bool\` | \`array.array\` |

---

## Как работает «изменение» immutable-типа

\`\`\`python
# Конкатенация строк — O(n²) в цикле!
s = ""
for i in range(5):
    s += str(i)         # каждый += создаёт новую строку
    print(id(s))        # id меняется на каждом шаге!

# ✅ Эффективно: join создаёт одну строку
parts = [str(i) for i in range(5)]
s = "".join(parts)   # O(n)

# Аналогично с числами:
x = 42
print(id(x))   # 9789376  (маленькое число → кэшировано)
x += 1
print(id(x))   # 9789408  ← новый объект (43)
\`\`\`

---

## Опасность mutable-объектов: aliasing

\`\`\`python
# Два имени — один объект!
a = [1, 2, 3]
b = a             # b — это НЕ копия, это ссылка на тот же объект

b.append(4)
print(a)   # [1, 2, 3, 4] — a тоже изменился!

# Чтобы скопировать:
b = a.copy()      # поверхностная копия
b = list(a)       # тоже поверхностная
b = a[:]          # срез — поверхностная

import copy
b = copy.deepcopy(a)   # глубокая копия (для вложенных структур)
\`\`\`

---

## Передача в функцию: «pass by object reference»

Python передаёт **ссылку на объект**. Поведение зависит от мутабельности:

\`\`\`python
def modify_list(items: list) -> None:
    items.append(99)   # модифицируем ОРИГИНАЛ

def replace_list(items: list) -> None:
    items = [1, 2, 3]  # создаём НОВУЮ локальную переменную, оригинал не тронут

original = [10, 20]
modify_list(original)
print(original)   # [10, 20, 99] ← изменился!

original = [10, 20]
replace_list(original)
print(original)   # [10, 20] ← не изменился

# С immutable — проблемы не бывает:
def try_modify(s: str) -> None:
    s += " world"   # создаёт новый объект, оригинал не затронут

text = "hello"
try_modify(text)
print(text)   # "hello" — не изменился
\`\`\`

---

## Immutable как ключи словаря

Только хэшируемые (как правило иммутабельные) объекты могут быть ключами \`dict\` и элементами \`set\`:

\`\`\`python
# ✅ Иммутабельные типы — хэшируемые:
d = {
    42: "int key",
    3.14: "float key",
    "hello": "str key",
    (1, 2): "tuple key",
    frozenset({1, 2}): "frozenset key",
}

# ❌ Мутабельные типы — не хэшируемые:
try:
    d[[1, 2]] = "list key"         # TypeError
except TypeError as e:
    print(e)   # unhashable type: 'list'

try:
    d[{"a": 1}] = "dict key"       # TypeError
except TypeError as e:
    print(e)   # unhashable type: 'dict'
\`\`\``,
  },
  {
    id: "basic-zip-function",
    question:
      "Что делает встроенная функция zip() и как обработать ситуацию, если передаваемые в неё последовательности имеют разную длину?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Что делает zip()

\`zip()\` объединяет несколько итерируемых объектов «по индексу», возвращая итератор кортежей:

\`\`\`python
names  = ["Alice", "Bob", "Charlie"]
scores = [95, 87, 92]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 95
# Bob: 87
# Charlie: 92

# zip возвращает итератор (ленивый), не список:
z = zip([1, 2, 3], ["a", "b", "c"])
print(type(z))   # <class 'zip'>

# Материализация:
pairs = list(zip(names, scores))
# [('Alice', 95), ('Bob', 87), ('Charlie', 92)]

# Три и более последовательностей:
a = [1, 2, 3]
b = ["x", "y", "z"]
c = [True, False, True]
result = list(zip(a, b, c))
# [(1, 'x', True), (2, 'y', False), (3, 'z', True)]
\`\`\`

---

## Поведение при разной длине: zip() обрезает по короткому

По умолчанию \`zip\` останавливается, когда **самый короткий** итератор исчерпан:

\`\`\`python
long_list  = [1, 2, 3, 4, 5]
short_list = ["a", "b", "c"]

print(list(zip(long_list, short_list)))
# [(1, 'a'), (2, 'b'), (3, 'c')]  ← элементы 4 и 5 потеряны!

# Строгий режим (Python 3.10+): вызывает ValueError при разных длинах
try:
    list(zip(long_list, short_list, strict=True))
except ValueError as e:
    print(e)   # zip() has arguments with different lengths
\`\`\`

---

## itertools.zip_longest — дополнение до длинного

\`\`\`python
from itertools import zip_longest

long_list  = [1, 2, 3, 4, 5]
short_list = ["a", "b", "c"]

# Дополняет None по умолчанию:
result = list(zip_longest(long_list, short_list))
# [(1, 'a'), (2, 'b'), (3, 'c'), (4, None), (5, None)]

# Или своим значением:
result = list(zip_longest(long_list, short_list, fillvalue="—"))
# [(1, 'a'), (2, 'b'), (3, 'c'), (4, '—'), (5, '—')]

# Практический пример: сравнение двух списков с пометкой пропусков
expected = [1, 2, 3, 4, 5]
actual   = [1, 2, 99]

for i, (exp, act) in enumerate(zip_longest(expected, actual, fillvalue="MISSING")):
    status = "✅" if exp == act else "❌"
    print(f"[{i}] {status} expected={exp}, actual={act}")
\`\`\`

---

## Практические применения

\`\`\`python
# 1. Создание словаря из двух списков:
keys   = ["name", "age", "city"]
values = ["Alice", 30, "Moscow"]
d = dict(zip(keys, values))
# {'name': 'Alice', 'age': 30, 'city': 'Moscow'}

# 2. «Транспонирование» матрицы:
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
transposed = list(zip(*matrix))
# [(1, 4, 7), (2, 5, 8), (3, 6, 9)]

# 3. Попарное сравнение соседних элементов:
seq = [1, 3, 2, 5, 4]
pairs = list(zip(seq, seq[1:]))
# [(1, 3), (3, 2), (2, 5), (5, 4)]
is_sorted = all(a <= b for a, b in pairs)
print(is_sorted)   # False

# 4. enumerate через zip:
items = ["a", "b", "c"]
for idx, item in zip(range(len(items)), items):
    print(idx, item)
# Лучше использовать enumerate(), но демонстрирует принцип

# 5. «Разархивирование» — обратная операция:
pairs = [(1, "a"), (2, "b"), (3, "c")]
numbers, letters = zip(*pairs)
print(numbers)   # (1, 2, 3)
print(letters)   # ('a', 'b', 'c')
\`\`\``,
  },
  {
    id: "basic-list-comprehensions",
    question:
      "Что такое списковые включения (list comprehensions)? В каких ситуациях их использование считается плохой практикой?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Что такое list comprehension

Компактный синтаксис для создания списков из итерируемых объектов:

\`\`\`python
# Обычный цикл:
squares = []
for x in range(10):
    squares.append(x ** 2)

# List comprehension — то же самое, компактнее и быстрее:
squares = [x ** 2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# С условием (фильтрация):
evens = [x for x in range(20) if x % 2 == 0]
# [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# С условием в значении (тернарный оператор):
labels = ["even" if x % 2 == 0 else "odd" for x in range(6)]
# ['even', 'odd', 'even', 'odd', 'even', 'odd']
\`\`\`

---

## Другие виды включений

\`\`\`python
# dict comprehension:
word_lengths = {word: len(word) for word in ["apple", "banana", "cherry"]}
# {'apple': 5, 'banana': 6, 'cherry': 6}

# set comprehension:
unique_lengths = {len(word) for word in ["hi", "hello", "hey", "howdy"]}
# {2, 5}

# generator expression (ленивый, не создаёт список сразу):
total = sum(x ** 2 for x in range(1_000_000))   # memory-efficient

# Разница: list comprehension vs generator:
import sys
lc = [x ** 2 for x in range(1000)]   # создаёт список сразу
ge = (x ** 2 for x in range(1000))   # генератор — ленивый

print(sys.getsizeof(lc))   # ~8856 байт — весь список в памяти
print(sys.getsizeof(ge))   # ~208 байт — только объект генератора
\`\`\`

---

## Скорость: comprehension быстрее явного цикла

\`\`\`python
import timeit

# List comprehension обычно быстрее на 20–50%:
t1 = timeit.timeit("[x**2 for x in range(1000)]", number=10000)
t2 = timeit.timeit(
    "r=[]\nfor x in range(1000):\n r.append(x**2)",
    number=10000
)
print(f"LC: {t1:.3f}s")     # ~0.45s
print(f"loop: {t2:.3f}s")   # ~0.60s
# LC быстрее: нет overhead от lookup атрибута append и вызова метода
\`\`\`

---

## Когда НЕ стоит использовать comprehensions

### 1. Вложенные comprehensions: нечитаемо при глубине > 2

\`\`\`python
# ❌ Тяжело читать — три уровня вложенности:
result = [cell for row in matrix for subrow in row for cell in subrow]

# ✅ Лучше явный цикл с промежуточными переменными:
result = []
for row in matrix:
    for subrow in row:
        for cell in subrow:
            result.append(cell)

# Допустимо — два уровня (матрица → плоский список):
flat = [cell for row in [[1,2],[3,4],[5,6]] for cell in row]
# [1, 2, 3, 4, 5, 6]
\`\`\`

### 2. Сложная логика внутри comprehension

\`\`\`python
# ❌ Слишком много логики — трудно понять и отладить:
result = [
    process(item)
    for item in get_items()
    if item.is_valid() and item.category in allowed_categories
    if not item.is_expired()
]

# ✅ Лучше вынести логику в функцию или использовать цикл:
def should_include(item) -> bool:
    return (
        item.is_valid()
        and item.category in allowed_categories
        and not item.is_expired()
    )

result = [process(item) for item in get_items() if should_include(item)]
\`\`\`

### 3. Побочные эффекты: comprehension не для этого

\`\`\`python
# ❌ Создаёт список только ради побочного эффекта — расточительно:
[print(x) for x in range(5)]
[db.save(record) for record in records]

# ✅ Используйте обычный цикл для побочных эффектов:
for x in range(5):
    print(x)
for record in records:
    db.save(record)
\`\`\`

### 4. Очень длинный comprehension: нарушает PEP 8 (79 символов)

\`\`\`python
# ❌ Строка слишком длинная:
result = [transform_and_format(item, prefix="ID:", suffix="!") for item in very_long_variable_name if item.is_valid()]

# ✅ Разбить на несколько строк (PEP 8 допускает):
result = [
    transform_and_format(item, prefix="ID:", suffix="!")
    for item in very_long_variable_name
    if item.is_valid()
]
\`\`\`

---

## Правило большого пальца

> Comprehension — хорошо, если его можно прочитать вслух одним предложением.
> «Список квадратов чётных чисел от 0 до 20» → \`[x**2 for x in range(20) if x%2==0]\` ✅`,
  },
  {
    id: "basic-lambda-vs-def",
    question:
      "Чем lambda-функции отличаются от обычных функций, объявленных через def? Какие у них ограничения?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Синтаксис и основные отличия

\`\`\`python
# def — полноценная функция:
def square(x):
    return x ** 2

# lambda — анонимное выражение:
square_lambda = lambda x: x ** 2

print(square(5))         # 25
print(square_lambda(5))  # 25

# lambda — это выражение (expression), а не инструкция (statement)
# Поэтому её можно использовать там, где def нельзя:
numbers = [1, 2, 3, 4, 5]
doubled = list(map(lambda x: x * 2, numbers))   # lambda прямо в аргументе
\`\`\`

---

## Ограничения lambda

### 1. Только одно выражение — нет инструкций

\`\`\`python
# ❌ Нельзя использовать: if/else statement, for, while, try/except, return
bad = lambda x: if x > 0: return x else: return -x   # SyntaxError

# ✅ Тернарный оператор (это выражение, не инструкция):
abs_val = lambda x: x if x >= 0 else -x
print(abs_val(-5))   # 5

# ❌ Нельзя выполнить несколько операций:
bad = lambda x: x = x + 1; return x   # SyntaxError

# ✅ Всё это — одно выражение:
process = lambda x: (x ** 2 + 1) / 2
\`\`\`

### 2. Нет имени (\`__name__\` = \`"<lambda>"\`)

\`\`\`python
def named_func(x):
    return x ** 2

anon = lambda x: x ** 2

print(named_func.__name__)   # "named_func"
print(anon.__name__)         # "<lambda>" — усложняет отладку

# В трейсбэке:
import traceback

def bad_lambda():
    f = lambda x: 1 / x
    f(0)

try:
    bad_lambda()
except ZeroDivisionError:
    traceback.print_exc()
# ZeroDivisionError in <lambda> ← не понятно, где именно
\`\`\`

### 3. Нет документации, аннотаций типов, значений по умолчанию (почти)

\`\`\`python
def add(a: int, b: int = 0) -> int:
    """Складывает два числа."""
    return a + b

# lambda поддерживает дефолтные значения, но не аннотации:
add_l = lambda a, b=0: a + b   # дефолт — OK
# lambda a: int, b: int: a + b  ← синтаксическая ошибка

print(add.__doc__)    # "Складывает два числа."
print(add_l.__doc__)  # None
\`\`\`

---

## Где lambda уместна

\`\`\`python
# 1. Сортировка по ключу:
people = [{"name": "Charlie", "age": 30}, {"name": "Alice", "age": 25}]
sorted_by_age  = sorted(people, key=lambda p: p["age"])
sorted_by_name = sorted(people, key=lambda p: p["name"])

# 2. map() и filter() (хотя comprehensions часто нагляднее):
numbers = [1, -2, 3, -4, 5]
positives = list(filter(lambda x: x > 0, numbers))
squares   = list(map(lambda x: x ** 2, numbers))

# 3. functools.reduce:
from functools import reduce
product = reduce(lambda acc, x: acc * x, [1, 2, 3, 4, 5])   # 120

# 4. Колбэки в GUI / обработчики событий:
# button.on_click(lambda event: handle_click(event.x, event.y))

# 5. Временная функция-трансформация:
transform = lambda x: x.strip().lower().replace(" ", "_")
names = ["  Alice Smith  ", "Bob Jones  "]
result = [transform(n) for n in names]
# ['alice_smith', 'bob_jones']
\`\`\`

---

## Когда lambda — плохой выбор

\`\`\`python
# ❌ Присвоение lambda переменной (нарушает PEP 8):
# Если лямбде нужно имя — используйте def!
process = lambda x: complex_logic(x)   # лучше def

# ❌ Сложная логика:
f = lambda x: x if x > 0 else (x ** 2 if x > -10 else abs(x))   # нечитаемо

# ✅ Лучше:
def f(x):
    if x > 0:
        return x
    if x > -10:
        return x ** 2
    return abs(x)

# ❌ Когда уже есть готовая функция:
from operator import attrgetter, itemgetter

# Не нужно:
sorted(people, key=lambda p: p["age"])
# Можно через itemgetter (быстрее):
sorted(people, key=itemgetter("age"))
\`\`\`

---

## Итог

| | \`def\` | \`lambda\` |
|--|--------|---------|
| Тело | Любые инструкции | Одно выражение |
| Имя | Есть (\`__name__\`) | \`"<lambda>"\` |
| Документация | \`__doc__\` | Нет |
| Аннотации типов | ✅ | ❌ |
| Рекурсия | Легко | Сложно (нужно self-ref) |
| Читаемость | Высокая | Снижается при сложной логике |`,
  },
  {
    id: "basic-mutable-default-argument",
    question:
      "Почему использование изменяемых типов данных (например, list или dict) в качестве аргументов по умолчанию в функциях — это опасная практика?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Демонстрация проблемы

\`\`\`python
def add_item(item, collection=[]):   # ← изменяемый дефолт!
    collection.append(item)
    return collection

print(add_item(1))   # [1]     — ОК
print(add_item(2))   # [1, 2]  — НЕОЖИДАННО! Список не пуст
print(add_item(3))   # [1, 2, 3]  — продолжает накапливаться!
\`\`\`

---

## Почему это происходит

Значение аргумента по умолчанию вычисляется **один раз — при определении функции**, а не при каждом её вызове. Объект создаётся как атрибут объекта функции и живёт всё время жизни программы:

\`\`\`python
def add_item(item, collection=[]):
    collection.append(item)
    return collection

# Дефолтное значение — объект функции:
print(add_item.__defaults__)   # ([],)  — после определения
add_item(1)
print(add_item.__defaults__)   # ([1],) — после первого вызова
add_item(2)
print(add_item.__defaults__)   # ([1, 2],) — после второго вызова

# Все вызовы без явного collection РАЗДЕЛЯЮТ ОДИН ОБЪЕКТ:
print(add_item(1) is add_item.__defaults__[0])   # True
\`\`\`

---

## Правильное решение: None как часовой

\`\`\`python
from typing import Optional

def add_item(item: int, collection: Optional[list] = None) -> list:
    if collection is None:
        collection = []   # новый список при каждом вызове
    collection.append(item)
    return collection

print(add_item(1))   # [1]
print(add_item(2))   # [2]   ← теперь независимые списки
print(add_item(3))   # [3]

# Явная передача — работает как ожидается:
my_list = [10, 20]
print(add_item(30, my_list))   # [10, 20, 30]
print(my_list)                 # [10, 20, 30]
\`\`\`

---

## То же самое с dict и set

\`\`\`python
# ❌ Опасно:
def register(user: str, cache: dict = {}):
    cache[user] = True
    return cache

print(register("Alice"))   # {'Alice': True}
print(register("Bob"))     # {'Alice': True, 'Bob': True}  ← накопилось!

# ✅ Правильно:
def register(user: str, cache: Optional[dict] = None) -> dict:
    if cache is None:
        cache = {}
    cache[user] = True
    return cache

# ❌ Опасно с set:
def add_tag(tag: str, tags: set = set()):
    tags.add(tag)
    return tags

# ✅ Правильно:
def add_tag(tag: str, tags: Optional[set] = None) -> set:
    if tags is None:
        tags = set()
    tags.add(tag)
    return tags
\`\`\`

---

## Когда разделяемый дефолт ПОЛЕЗЕН (редко)

Иногда это поведение используют намеренно — для кэширования без глобальных переменных:

\`\`\`python
def fibonacci(n: int, _cache: dict = {}) -> int:
    """Мемоизация через mutable default — работает, но неочевидно."""
    if n in _cache:
        return _cache[n]
    if n <= 1:
        return n
    result = fibonacci(n - 1) + fibonacci(n - 2)
    _cache[n] = result
    return result

print(fibonacci(10))   # 55
print(fibonacci.__defaults__)   # ({0: 0, 1: 1, 2: 1, ...},) — кэш накапливается

# ✅ Современный и понятный аналог через functools.lru_cache:
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_cached(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_cached(n - 1) + fibonacci_cached(n - 2)
\`\`\`

---

## Правило: иммутабельные дефолты — безопасны

\`\`\`python
# ✅ Иммутабельные дефолты безопасны — они не изменяются:
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

def repeat(item: int, times: int = 3) -> list:
    return [item] * times

print(greet("Alice"))          # "Hello, Alice!"
print(greet("Bob", "Hi"))      # "Hi, Bob!"
print(greet.__defaults__)      # ('Hello',) — не изменяется между вызовами
\`\`\``,
  },
  {
    id: "basic-shallow-deep-copy",
    question:
      "В чём разница между поверхностным (shallow copy) и глубоким (deep copy) копированием? Как ведут себя вложенные структуры?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## Три уровня «копирования»

\`\`\`python
import copy

original = [[1, 2], [3, 4], [5, 6]]

# 1. Присвоение — не копия! Это псевдоним:
alias = original
alias[0].append(99)
print(original)   # [[1, 2, 99], [3, 4], [5, 6]] ← оригинал изменился

# 2. Shallow copy — новый контейнер, те же вложенные объекты:
original = [[1, 2], [3, 4]]
shallow = copy.copy(original)         # или original.copy() или original[:]
shallow[0].append(99)                 # меняем вложенный список
print(original)   # [[1, 2, 99], [3, 4]] ← оригинал тоже изменился!
print(shallow)    # [[1, 2, 99], [3, 4]]

# 3. Deep copy — полностью независимая копия:
original = [[1, 2], [3, 4]]
deep = copy.deepcopy(original)
deep[0].append(99)
print(original)   # [[1, 2], [3, 4]]    ← НЕ изменился
print(deep)       # [[1, 2, 99], [3, 4]]
\`\`\`

---

## Визуализация разницы

\`\`\`
Оригинал:  original ──► [ ref_A, ref_B ]
                               │       │
                             [1,2]   [3,4]

Shallow:   shallow ──► [ ref_A, ref_B ]  ← новый список, НО те же ref_A, ref_B!
                               │       │
                             [1,2]   [3,4]  ← те же объекты

Deep:      deep ──► [ ref_A2, ref_B2 ]   ← новый список И новые объекты
                               │       │
                            [1,2]   [3,4]  ← КОПИИ вложенных объектов
\`\`\`

---

## Способы создания shallow copy

\`\`\`python
import copy

lst = [[1, 2], [3, 4]]

s1 = lst.copy()           # метод списка
s2 = lst[:]               # срез
s3 = list(lst)            # конструктор
s4 = copy.copy(lst)       # явно

# Все четыре — shallow копии:
print(s1[0] is lst[0])    # True — тот же вложенный объект

# Для dict:
d = {"a": [1, 2], "b": [3, 4]}
sd1 = d.copy()
sd2 = dict(d)
sd3 = copy.copy(d)
print(sd1["a"] is d["a"])   # True — shallow!
\`\`\`

---

## Глубокие структуры и deepcopy

\`\`\`python
import copy
from dataclasses import dataclass, field

@dataclass
class Node:
    value: int
    children: list["Node"] = field(default_factory=list)

    def add_child(self, child: "Node") -> None:
        self.children.append(child)

root = Node(1)
root.add_child(Node(2))
root.add_child(Node(3))
root.children[0].add_child(Node(4))

# Shallow copy — children — тот же список:
shallow_root = copy.copy(root)
shallow_root.children.append(Node(99))
print(len(root.children))   # 3 ← изменился! (shallow_root.children is root.children)

# Deep copy — полностью независимо:
root = Node(1)
root.add_child(Node(2))
deep_root = copy.deepcopy(root)
deep_root.children.append(Node(99))
print(len(root.children))   # 1 ← не изменился
print(deep_root.children[0] is root.children[0])   # False — разные объекты
\`\`\`

---

## Производительность и особые случаи

\`\`\`python
import copy, timeit

data = list(range(1000))

t_shallow = timeit.timeit(lambda: data.copy(), number=100_000)
t_deep    = timeit.timeit(lambda: copy.deepcopy(data), number=100_000)

print(f"shallow: {t_shallow:.3f}s")   # ~0.08s
print(f"deep:    {t_deep:.3f}s")      # ~3.5s  ← значительно медленнее!

# deepcopy рекурсивно обходит ВСЮ структуру объекта.
# Для больших графов объектов это дорого.
\`\`\`

### Настройка поведения deepcopy через \`__copy__\` и \`__deepcopy__\`

\`\`\`python
import copy

class SmartCopy:
    def __init__(self, data: list, config: dict):
        self.data = data
        self.config = config   # конфиг — разделяем, данные — копируем

    def __copy__(self):
        """Shallow copy: новый объект, те же data и config."""
        new = SmartCopy.__new__(SmartCopy)
        new.__dict__.update(self.__dict__)
        return new

    def __deepcopy__(self, memo: dict):
        """Deep copy: копируем data, но НЕ копируем config (shared)."""
        new = SmartCopy.__new__(SmartCopy)
        memo[id(self)] = new
        new.data = copy.deepcopy(self.data, memo)   # глубокая копия данных
        new.config = self.config                     # разделяем конфиг!
        return new

obj = SmartCopy([1, 2, 3], {"theme": "dark"})
deep = copy.deepcopy(obj)
deep.data.append(99)
print(obj.data)           # [1, 2, 3]  ← данные изолированы
print(deep.config is obj.config)   # True ← конфиг общий
\`\`\`

---

## Итог

| | Присвоение | Shallow copy | Deep copy |
|--|-----------|-------------|-----------|
| Новый контейнер | ❌ | ✅ | ✅ |
| Копирует вложенные | ❌ | ❌ | ✅ |
| Изменения в вложенных затрагивают оригинал | ✅ | ✅ | ❌ |
| Скорость | Мгновенно | Быстро | Медленно |
| Применение | Псевдоним | Одноуровневые структуры | Сложные вложенные структуры |`,
  },
  {
    id: "basic-hash-table-internals",
    question:
      "Как устроены хэш-таблицы в Python (внутренняя реализация dict и set)? Что происходит при возникновении коллизий?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "middle",
    answer: `## Основная идея хэш-таблицы

Хэш-таблица — это массив «слотов» (buckets). Чтобы найти слот для ключа, вычисляем **хэш** ключа и берём остаток от деления на размер таблицы:

\`\`\`
slot_index = hash(key) % table_size
\`\`\`

\`\`\`python
# hash() — встроенная функция Python
print(hash("hello"))     # 8774421155716088 (меняется между запусками из-за hash-рандомизации)
print(hash(42))          # 42  (числа хэшируются в себя, если помещаются в C long)
print(hash(3.14))        # 322818021289917743
print(hash((1, 2, 3)))   # комбинация хэшей элементов

# hash() работает только для иммутабельных (hashable) объектов:
hash([1, 2, 3])   # TypeError: unhashable type: 'list'
\`\`\`

---

## Внутренняя структура dict в CPython

До Python 3.6 dict был «компактным массивом с дырками». Начиная с 3.6 — **compact dict** (раздельные indices и entries):

\`\`\`
Indices (разреженный массив позиций):
[ -1, 0, -1, 1, -1, -1, 2, -1 ]   # -1 = пустой слот
                                     # число = индекс в entries

Entries (плотный массив):
[ (hash_a, key_a, val_a),
  (hash_b, key_b, val_b),
  (hash_c, key_c, val_c) ]
\`\`\`

Преимущества compact dict:
- **Сохраняет порядок вставки** (с Python 3.7 — гарантированно)
- Меньше памяти при большом числе удалений
- Итерация по entries (плотный массив) быстрее

---

## Алгоритм поиска ключа

\`\`\`python
# Псевдокод алгоритма dict.__getitem__(key):

def dict_lookup(table, key):
    h = hash(key)
    idx = h % len(table.indices)

    while True:
        slot = table.indices[idx]

        if slot == EMPTY:
            raise KeyError(key)        # ключа нет

        if slot == DUMMY:              # был удалён — продолжаем поиск
            idx = (idx * 5 + 1 + h) % len(table.indices)
            continue

        entry = table.entries[slot]
        if entry.hash == h and (entry.key is key or entry.key == key):
            return entry.value         # нашли!

        # Коллизия: переходим к следующему слоту (probing)
        idx = (idx * 5 + 1 + h) % len(table.indices)
\`\`\`

---

## Коллизии и открытая адресация

CPython использует **открытую адресацию** (open addressing) с **пертурбацией**. При коллизии следующий слот вычисляется по формуле:

\`\`\`
next_idx = (idx * 5 + 1 + (hash >> shift)) % table_size
\`\`\`

Это не линейный пробинг (каждый +1), а псевдослучайный обход всей таблицы. Хэш влияет на последовательность через \`>>shift\`, поэтому для разных ключей с одинаковым \`hash % size\` будут разные пути.

\`\`\`python
# Продемонстрируем: два ключа с одинаковым hash % size
class CollidingKey:
    def __init__(self, name, h):
        self.name = name
        self._hash = h

    def __hash__(self): return self._hash
    def __eq__(self, other): return self.name == other.name

k1 = CollidingKey("a", 0)   # hash = 0 → слот 0 (таблица размером 8)
k2 = CollidingKey("b", 8)   # hash = 8 → тоже слот 0 — коллизия!

d = {k1: "value1"}
d[k2] = "value2"   # k2 должен найти другой слот
print(d[k1])   # "value1" — оба ключа существуют в таблице
print(d[k2])   # "value2"
\`\`\`

---

## Load factor и resize

Когда таблица заполняется более чем на **2/3** (load factor > 0.67), происходит **resize**: создаётся новая таблица в 4× больше, все элементы перехэшируются.

\`\`\`python
import sys

d = {}
prev_size = sys.getsizeof(d)
for i in range(20):
    d[i] = i
    size = sys.getsizeof(d)
    if size != prev_size:
        print(f"Resize при len={len(d)}: {prev_size} → {size} байт")
        prev_size = size

# Вывод (приблизительно):
# Resize при len=1:  248 → 248
# Resize при len=6:  248 → 376
# Resize при len=11: 376 → 632
# Паттерн: 8 → 32 → 128 слотов и т.д.
\`\`\`

---

## set — та же хэш-таблица без values

\`set\` — это \`dict\` без значений (хранятся только ключи). Алгоритм тот же: hash → indices → entries.

\`\`\`python
# Операции за O(1) в среднем:
s = {1, 2, 3, 4, 5}
print(3 in s)     # O(1) — поиск по хэшу
s.add(6)          # O(1)
s.discard(1)      # O(1)

# Теоретически плохой кейс — все ключи коллидируют: O(n)
# На практике hash-рандомизация (PYTHONHASHSEED) делает атаки невозможными

# Операции над множествами:
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print(a & b)   # {3, 4}       — пересечение, O(min(len(a), len(b)))
print(a | b)   # {1,2,3,4,5,6} — объединение
print(a - b)   # {1, 2}       — разность
print(a ^ b)   # {1,2,5,6}    — симметричная разность
\`\`\`

---

## Требования к хэшируемым объектам

Для корректной работы хэш-таблицы объект должен соблюдать инвариант:

> Если \`a == b\`, то \`hash(a) == hash(b)\`

\`\`\`python
class GoodKey:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        return hash((self.x, self.y))   # хэш кортежа — стандартный способ

k1 = GoodKey(1, 2)
k2 = GoodKey(1, 2)
print(k1 == k2)       # True
print(hash(k1) == hash(k2))   # True ← инвариант соблюдён

d = {k1: "point"}
print(d[k2])   # "point" — работает, т.к. k1 == k2 и hash(k1) == hash(k2)
\`\`\``,
  },
  {
    id: "basic-namedtuple-vs-dataclass",
    question:
      "Что такое namedtuple из модуля collections? В чём его преимущества перед обычными кортежами и словарями, и какая современная альтернатива в виде dataclasses?",
    category: "Базовый синтаксис, типы и структуры данных",
    difficulty: "junior",
    answer: `## namedtuple — именованный кортеж

\`namedtuple\` — это фабрика классов, которая создаёт **иммутабельный**, **именованный** кортеж:

\`\`\`python
from collections import namedtuple

# Создание класса:
Point = namedtuple("Point", ["x", "y"])

# Или через строку:
Point = namedtuple("Point", "x y")

p = Point(3, 4)
print(p)          # Point(x=3, y=4)
print(p.x)        # 3  — по имени
print(p[0])       # 3  — по индексу (как у tuple)
print(p.x, p.y)   # 3 4

# Распаковка работает:
x, y = p
print(x, y)   # 3 4
\`\`\`

---

## Преимущества перед tuple и dict

\`\`\`python
from collections import namedtuple

# ❌ Обычный tuple: непонятно, что значит [0] и [1]
record = ("Alice", 30, "Moscow")
name = record[0]    # что это? не очевидно
age  = record[1]

# ✅ namedtuple: самодокументируемый код
Person = namedtuple("Person", ["name", "age", "city"])
alice = Person("Alice", 30, "Moscow")
print(alice.name)   # "Alice" — понятно
print(alice.age)    # 30

# ❌ dict: нет защиты от опечаток в ключах
d = {"name": "Alice", "age": 30}
print(d["naem"])   # KeyError — опечатка обнаружена только в рантайме

# ✅ namedtuple: атрибуты проверяются статически
print(alice.naem)  # AttributeError — и это сразу видно в IDE

# Память: namedtuple компактнее dict
import sys
d = {"name": "Alice", "age": 30, "city": "Moscow"}
nt = alice
print(sys.getsizeof(d))   # ~232 байт
print(sys.getsizeof(nt))  # ~64 байт (это кортеж!)
\`\`\`

---

## Иммутабельность и _replace

\`\`\`python
from collections import namedtuple

Point = namedtuple("Point", "x y")
p = Point(1, 2)

# Нельзя изменить:
try:
    p.x = 10   # AttributeError: can't set attribute
except AttributeError as e:
    print(e)

# _replace создаёт НОВЫЙ объект с изменёнными полями:
p2 = p._replace(x=10)
print(p)    # Point(x=1, y=2)  — оригинал не изменился
print(p2)   # Point(x=10, y=2)

# _asdict: конвертация в dict:
print(p._asdict())   # {'x': 1, 'y': 2}

# _fields: кортеж имён полей:
print(Point._fields)  # ('x', 'y')

# _make: создание из итерируемого:
data = [5, 7]
p3 = Point._make(data)
print(p3)   # Point(x=5, y=7)
\`\`\`

---

## typing.NamedTuple — современный синтаксис с аннотациями

\`\`\`python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    z: float = 0.0   # поле со значением по умолчанию

p = Point(1.0, 2.0)
print(p)         # Point(x=1.0, y=2.0, z=0.0)
print(p.z)       # 0.0

# Методы можно добавлять:
class Vector(NamedTuple):
    x: float
    y: float

    def length(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def dot(self, other: "Vector") -> float:
        return self.x * other.x + self.y * other.y

v1 = Vector(3, 4)
print(v1.length())        # 5.0
print(v1.dot(Vector(1, 0)))  # 3.0
\`\`\`

---

## dataclasses — современная альтернатива

\`\`\`python
from dataclasses import dataclass, field

@dataclass
class Person:
    name: str
    age: int
    tags: list[str] = field(default_factory=list)

    def greet(self) -> str:
        return f"Hi, I'm {self.name}, {self.age} years old"

p = Person("Alice", 30)
p.age = 31           # ✅ мутабельный
p.tags.append("admin")
print(p)   # Person(name='Alice', age=31, tags=['admin'])
print(p.greet())   # "Hi, I'm Alice, 31 years old"

# frozen=True — иммутабельный dataclass (аналог namedtuple):
@dataclass(frozen=True)
class FrozenPoint:
    x: float
    y: float

fp = FrozenPoint(1.0, 2.0)
# fp.x = 10.0   # FrozenDataclassError!

# order=True — автоматическая сортировка:
@dataclass(order=True)
class SortableItem:
    priority: int
    name: str

items = [SortableItem(3, "c"), SortableItem(1, "a"), SortableItem(2, "b")]
print(sorted(items))   # по priority
\`\`\`

---

## Сравнительная таблица

| Свойство | \`tuple\` | \`namedtuple\` | \`NamedTuple\` | \`dataclass\` |
|----------|---------|------------|------------|-----------|
| Именованные поля | ❌ | ✅ | ✅ | ✅ |
| Аннотации типов | ❌ | ❌ | ✅ | ✅ |
| Иммутабельность | ✅ | ✅ | ✅ | \`frozen=True\` |
| Методы | ❌ | Добавляемые | ✅ | ✅ |
| Значения по умолчанию | ❌ | Ограниченно | ✅ | ✅ (\`field()\`) |
| Доступ по индексу | ✅ | ✅ | ✅ | ❌ |
| Память | Минимум | Минимум | Минимум | Больше (\`__dict__\`) |
| Наследование | Базовое | Базовое | ✅ | ✅ |

\`\`\`python
# Когда что выбрать:
# tuple       — простые анонимные структуры, return (x, y)
# namedtuple  — лёгкие value objects, совместимость с tuple API
# NamedTuple  — то же + аннотации типов
# dataclass   — изменяемые объекты с логикой; frozen=True — value objects
# Pydantic    — API входные данные с валидацией
\`\`\``,
  },
  {
    id: "oop2-decorator-basics",
    question:
      "Что такое декоратор и как он работает на базовом уровне? Как передать аргументы в декоратор?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "junior",
    answer: `## Что такое декоратор

Декоратор — это функция (или класс), которая **принимает функцию** и возвращает **новую функцию**. Синтаксис \`@decorator\` — синтаксический сахар:

\`\`\`python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("до вызова")
        result = func(*args, **kwargs)
        print("после вызова")
        return result
    return wrapper

# Эти две записи эквивалентны:
@my_decorator
def greet(name):
    print(f"Hello, {name}!")

# То же без @:
def greet(name):
    print(f"Hello, {name}!")
greet = my_decorator(greet)

greet("Alice")
# до вызова
# Hello, Alice!
# после вызова
\`\`\`

---

## functools.wraps — сохранение метаданных

\`\`\`python
import functools

def my_decorator(func):
    @functools.wraps(func)   # копирует __name__, __doc__, __annotations__
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def add(a: int, b: int) -> int:
    """Складывает два числа."""
    return a + b

print(add.__name__)   # "add"  ← без @wraps было бы "wrapper"
print(add.__doc__)    # "Складывает два числа."
\`\`\`

---

## Декоратор с аргументами: три уровня вложенности

\`\`\`python
import functools, time

def retry(max_attempts: int = 3, delay: float = 1.0):
    """Фабрика: возвращает декоратор с нужными параметрами."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    print(f"Попытка {attempt}/{max_attempts}: {e}")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def fetch_data(url: str) -> str:
    import random
    if random.random() < 0.7:
        raise ConnectionError("Network error")
    return f"data from {url}"

# Эквивалентно: fetch_data = retry(max_attempts=3, delay=0.5)(fetch_data)
\`\`\`

---

## Декоратор-класс

\`\`\`python
import functools

class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.call_count = 0

    def __call__(self, *args, **kwargs):
        self.call_count += 1
        print(f"{self.func.__name__} вызвана {self.call_count} раз")
        return self.func(*args, **kwargs)

@CountCalls
def process(x: int) -> int:
    return x * 2

process(1)   # process вызвана 1 раз
process(2)   # process вызвана 2 раз
print(process.call_count)   # 2
\`\`\`

---

## Стекирование декораторов

\`\`\`python
import functools, time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.monotonic()
        result = func(*args, **kwargs)
        print(f"{func.__name__}: {time.monotonic() - start:.3f}s")
        return result
    return wrapper

def logger(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Вызов {func.__name__}({args}, {kwargs})")
        return func(*args, **kwargs)
    return wrapper

@timer       # применяется вторым (внешний)
@logger      # применяется первым (внутренний)
def compute(n: int) -> int:
    return sum(range(n))

# Эквивалентно: compute = timer(logger(compute))
compute(1000)
# Вызов compute((1000,), {})
# compute: 0.000s
\`\`\``,
  },
  {
    id: "oop2-str-vs-repr",
    question: "В чём разница между магическими методами __str__ и __repr__?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "junior",
    answer: `## Назначение методов

| Метод | Для кого | Цель |
|-------|---------|------|
| \`__repr__\` | Для **разработчика** | Однозначное представление, идеально — валидный Python-код |
| \`__str__\` | Для **пользователя** | Читаемое, «красивое» представление |

\`\`\`python
from datetime import datetime

dt = datetime(2024, 1, 15, 12, 30)
print(repr(dt))   # datetime.datetime(2024, 1, 15, 12, 30) ← можно выполнить!
print(str(dt))    # 2024-01-15 12:30:00  ← читаемо для пользователя
\`\`\`

---

## Когда что вызывается

\`\`\`python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Point(x={self.x!r}, y={self.y!r})"

    def __str__(self) -> str:
        return f"({self.x}, {self.y})"

p = Point(1, 2)

print(repr(p))   # Point(x=1, y=2)   ← repr()
print(str(p))    # (1, 2)             ← str()
print(p)         # (1, 2)             ← print вызывает str()

# В f-строках: !r и !s
print(f"repr: {p!r}")   # repr: Point(x=1, y=2)
print(f"str:  {p!s}")   # str:  (1, 2)
\`\`\`

---

## Правило отката: repr → str

Если \`__str__\` не определён, Python использует \`__repr__\`:

\`\`\`python
class OnlyRepr:
    def __repr__(self): return "OnlyRepr()"

obj = OnlyRepr()
print(repr(obj))   # OnlyRepr()
print(str(obj))    # OnlyRepr() ← откат к __repr__

class OnlyStr:
    def __str__(self): return "красивый текст"

obj2 = OnlyStr()
print(str(obj2))    # красивый текст
print(repr(obj2))   # <__main__.OnlyStr object at 0x...> ← дефолтный repr
\`\`\`

---

## __repr__ в контейнерах

При выводе коллекций Python всегда использует \`repr\` элементов:

\`\`\`python
class Item:
    def __init__(self, name): self.name = name
    def __repr__(self): return f"Item({self.name!r})"
    def __str__(self): return f"[{self.name}]"

items = [Item("apple"), Item("banana")]
print(items)       # [Item('apple'), Item('banana')]  ← repr внутри списка!
print(items[0])    # [apple]  ← одиночный: str
\`\`\`

---

## Практические рекомендации

\`\`\`python
from dataclasses import dataclass

# dataclass автоматически генерирует __repr__:
@dataclass
class Currency:
    amount: float
    code: str

    def __str__(self) -> str:
        return f"{self.amount:,.2f} {self.code}"

price = Currency(1234.5, "RUB")
print(repr(price))   # Currency(amount=1234.5, code='RUB')
print(str(price))    # 1 234,50 RUB
\`\`\`

**Правила:**
1. Всегда определяйте \`__repr__\` — нужен при отладке.
2. \`__repr__\` должен быть валидным Python: \`eval(repr(obj)) == obj\`.
3. \`__str__\` — когда нужно пользовательское отображение.
4. Если нужен только один — выбирайте \`__repr__\`.`,
  },
  {
    id: "oop2-legb-scopes",
    question:
      "Как работают области видимости переменных в Python? Опишите правило LEGB.",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "junior",
    answer: `## Правило LEGB

Python ищет имя переменной в четырёх областях по порядку:

\`\`\`
L — Local       (локальная: текущая функция)
E — Enclosing   (объемлющая: внешняя функция при замыканиях)
G — Global      (глобальная: модуль)
B — Built-in    (встроенная: builtins — len, print, range...)
\`\`\`

\`\`\`python
x = "global"          # G

def outer():
    x = "enclosing"   # E

    def inner():
        x = "local"   # L
        print(x)      # "local"

    inner()
    print(x)          # "enclosing"

outer()
print(x)              # "global"
\`\`\`

---

## Только чтение vs присвоение

**Чтение** идёт по LEGB. **Присвоение** создаёт переменную в **текущей** области:

\`\`\`python
count = 0   # G

def increment():
    count += 1   # UnboundLocalError!
    # Python видит \`count =\` → решает, что count локальная
    # Но до присвоения читает count → которой нет в L → ошибка

increment()   # UnboundLocalError: local variable 'count' referenced before assignment
\`\`\`

---

## global — изменение глобальной переменной

\`\`\`python
count = 0

def increment():
    global count
    count += 1

increment()
increment()
print(count)   # 2
\`\`\`

---

## nonlocal — изменение переменной объемлющей функции

\`\`\`python
def make_counter(start: int = 0):
    count = start

    def increment(step: int = 1):
        nonlocal count
        count += step
        return count

    def reset():
        nonlocal count
        count = start

    return increment, reset

inc, rst = make_counter(10)
print(inc())    # 11
print(inc(5))   # 16
rst()
print(inc())    # 11
\`\`\`

---

## Область видимости классов: особый случай

Класс создаёт **собственное пространство имён**, но оно **не входит** в LEGB для методов:

\`\`\`python
class MyClass:
    class_var = 42

    def method(self):
        # print(class_var)   # NameError — class scope не в LEGB!
        print(self.class_var)    # OK — через атрибут
        print(MyClass.class_var) # OK — через класс
\`\`\`

---

## Затенение встроенных имён

\`\`\`python
# Built-in можно переопределить (опасно!):
len = lambda x: 999   # затеняет built-in len глобально
print(len([1, 2, 3]))  # 999!
del len   # восстанавливаем

# Затенение внутри функции — безопасно:
def safe_zone():
    len = lambda x: 999
    print(len([1, 2, 3]))   # 999

safe_zone()
print(len([1, 2, 3]))   # 3 — снаружи всё в порядке
\`\`\``,
  },
  {
    id: "oop2-instance-class-static-methods",
    question:
      "Чем отличаются методы экземпляра, @classmethod и @staticmethod? Когда какой тип уместен?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "junior",
    answer: `## Три типа методов

\`\`\`python
class MyClass:
    class_attr = "shared"

    def instance_method(self):
        """Первый аргумент — self (экземпляр)."""
        return f"instance: {self.class_attr}"

    @classmethod
    def class_method(cls):
        """Первый аргумент — cls (сам класс)."""
        return f"class: {cls.class_attr}"

    @staticmethod
    def static_method():
        """Нет автоматических аргументов."""
        return "static: нет доступа к классу или экземпляру"

obj = MyClass()
print(obj.instance_method())   # instance: shared
print(obj.class_method())      # class: shared
print(obj.static_method())     # static: ...

print(MyClass.class_method())  # class: shared
print(MyClass.static_method()) # static: ...
\`\`\`

---

## @classmethod: альтернативные конструкторы

\`\`\`python
from __future__ import annotations
from dataclasses import dataclass
from datetime import date

@dataclass
class User:
    name: str
    email: str
    created_at: date

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(
            name=data["name"],
            email=data["email"],
            created_at=date.fromisoformat(data["created_at"]),
        )

    @classmethod
    def guest(cls) -> "User":
        return cls(name="Guest", email="guest@example.com", created_at=date.today())

class AdminUser(User):
    pass

# Преимущество @classmethod: cls — реальный класс, наследование работает:
admin = AdminUser.from_dict({"name": "Bob", "email": "b@b.com", "created_at": "2024-01-15"})
print(type(admin))   # <class 'AdminUser'>  ← cls = AdminUser, не User!
\`\`\`

---

## @staticmethod: утилиты без состояния

\`\`\`python
class EmailValidator:

    @staticmethod
    def is_valid(email: str) -> bool:
        return "@" in email and "." in email.split("@")[-1]

    @staticmethod
    def normalize(email: str) -> str:
        return email.strip().lower()

    def validate_and_save(self, email: str) -> str:
        normalized = EmailValidator.normalize(email)
        if not EmailValidator.is_valid(normalized):
            raise ValueError(f"Некорректный email: {email}")
        return normalized

print(EmailValidator.is_valid("alice@example.com"))   # True
\`\`\`

---

## Сравнение

| | instance method | @classmethod | @staticmethod |
|--|-----------------|-------------|---------------|
| Первый аргумент | \`self\` | \`cls\` | нет |
| Доступ к экземпляру | ✅ | ❌ | ❌ |
| Доступ к классу | через \`self.__class__\` | ✅ | ❌ |
| Корректное наследование | — | ✅ | ❌ |
| Применение | Большинство методов | Альтернативные конструкторы | Утилиты без состояния |`,
  },
  {
    id: "oop2-closure-nonlocal",
    question:
      "Что такое замыкание (closure) в Python? Как работает ключевое слово nonlocal?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "junior",
    answer: `## Что такое замыкание

Замыкание — функция, которая **«захватывает»** переменные из объемлющей области и сохраняет доступ к ним после завершения внешней функции.

\`\`\`python
def make_multiplier(factor: int):
    def multiply(x: int) -> int:
        return x * factor   # factor из объемлющей функции
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))   # 10 — factor = 2 сохранён в замыкании
print(triple(5))   # 15 — factor = 3 независимо

# Проверяем захваченные переменные:
print(double.__code__.co_freevars)               # ('factor',)
print(double.__closure__[0].cell_contents)       # 2
\`\`\`

---

## Классическая ловушка: замыкание в цикле

\`\`\`python
# ❌ Все лямбды захватывают ОДНУ переменную i:
funcs = [lambda: i for i in range(5)]
print([f() for f in funcs])   # [4, 4, 4, 4, 4] ← финальное i=4

# ✅ Решение 1: дефолтный аргумент фиксирует значение:
funcs = [lambda i=i: i for i in range(5)]
print([f() for f in funcs])   # [0, 1, 2, 3, 4]

# ✅ Решение 2: фабрика замыканий:
def make_func(i):
    return lambda: i

funcs = [make_func(i) for i in range(5)]
print([f() for f in funcs])   # [0, 1, 2, 3, 4]
\`\`\`

---

## nonlocal: изменение переменной объемлющей функции

\`\`\`python
def make_counter():
    count = 0

    def increment():
        nonlocal count   # count из объемлющей функции
        count += 1
        return count

    def decrement():
        nonlocal count
        count -= 1
        return count

    def get():
        return count   # только чтение — nonlocal не нужен

    return increment, decrement, get

inc, dec, get = make_counter()
print(inc())   # 1
print(inc())   # 2
print(dec())   # 1
print(get())   # 1
\`\`\`

---

## Практические применения

\`\`\`python
import functools

# 1. Мемоизация через замыкание:
def memoize(func):
    cache = {}
    @functools.wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper

@memoize
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)

print(fib(30))   # быстро благодаря кэшу

# 2. Конфигурируемый валидатор:
def make_range_validator(min_val, max_val):
    def validate(value):
        if not (min_val <= value <= max_val):
            raise ValueError(f"{value} не в [{min_val}, {max_val}]")
        return value
    return validate

validate_age   = make_range_validator(0, 150)
validate_score = make_range_validator(0, 100)
validate_age(25)      # OK
validate_score(110)   # ValueError
\`\`\``,
  },
  {
    id: "oop2-mro-c3",
    question:
      "Как работает механизм множественного наследования в Python? Что такое MRO и алгоритм C3-линеаризации?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "middle",
    answer: `## Что такое MRO

MRO (Method Resolution Order) — порядок, в котором Python ищет метод при множественном наследовании. Вычисляется алгоритмом **C3-линеаризации**.

\`\`\`python
class A:
    def method(self): return "A"

class B(A):
    def method(self): return "B"

class C(A):
    def method(self): return "C"

class D(B, C):
    pass

print([cls.__name__ for cls in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']

d = D()
print(d.method())   # "B" ← первый в MRO после D
\`\`\`

---

## Алгоритм C3

C3 строит MRO по правилам монотонности: если C стоит перед D у родителя — так и у потомка.

\`\`\`python
# L[D] = D + merge(L[B], L[C], [B, C])
# L[B] = [B, A, object]
# L[C] = [C, A, object]
# merge([B,A,obj], [C,A,obj], [B,C]):
#   B — не в хвостах → берём → D, B
#   C — не в хвостах → берём → D, B, C
#   A — не в хвостах → берём → D, B, C, A
#   object → D, B, C, A, object ✅

# Несовместимая иерархия — TypeError:
class X: pass
class Y: pass
class A(X, Y): pass
class B(Y, X): pass
try:
    class C(A, B): pass   # TypeError: Cannot create a consistent MRO
except TypeError as e:
    print(e)
\`\`\`

---

## super() и cooperative inheritance

\`super()\` вызывает **следующий класс в MRO**, не просто родителя:

\`\`\`python
class A:
    def method(self): print("A")

class B(A):
    def method(self):
        print("B")
        super().method()   # следующий в MRO — не обязательно A!

class C(A):
    def method(self):
        print("C")
        super().method()

class D(B, C):
    def method(self):
        print("D")
        super().method()

# MRO: D → B → C → A → object
D().method()
# D
# B   ← super() в D → B
# C   ← super() в B → C (не A!)
# A   ← super() в C → A
\`\`\`

---

## Миксины через MRO

\`\`\`python
class LogMixin:
    def save(self):
        print(f"[LOG] Saving {self.__class__.__name__}")
        super().save()

class ValidationMixin:
    def save(self):
        print(f"[VALIDATE] Validating")
        super().save()

class BaseModel:
    def save(self):
        print(f"[DB] Saving to database")

class User(LogMixin, ValidationMixin, BaseModel):
    pass

User().save()
# [LOG] Saving User
# [VALIDATE] Validating
# [DB] Saving to database
# MRO: User → LogMixin → ValidationMixin → BaseModel → object
\`\`\``,
  },
  {
    id: "oop2-new-vs-init",
    question:
      "В чём разница между методами __new__ и __init__ при создании экземпляра класса?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "middle",
    answer: `## Последовательность создания объекта

\`\`\`python
# При вызове MyClass(arg):
# 1. MyClass.__new__(MyClass, arg) — создаёт объект (выделяет память)
# 2. MyClass.__init__(instance, arg) — инициализирует объект

class Lifecycle:
    def __new__(cls, value):
        print(f"__new__: создаём {cls.__name__}")
        instance = super().__new__(cls)   # обязательно вернуть экземпляр!
        return instance

    def __init__(self, value):
        print(f"__init__: value={value}")
        self.value = value

obj = Lifecycle(42)
# __new__: создаём Lifecycle
# __init__: value=42
\`\`\`

---

## Ключевые различия

| | \`__new__\` | \`__init__\` |
|--|------------|------------|
| Первый аргумент | \`cls\` | \`self\` |
| Должен вернуть | Экземпляр | \`None\` |
| Цель | Создание/аллокация | Инициализация атрибутов |
| Когда переопределять | Иммутабельные типы, Singleton | Большинство случаев |

---

## __init__ не вызывается если __new__ вернул не экземпляр cls

\`\`\`python
class Tricky:
    def __new__(cls, value):
        if value < 0:
            return str(value)   # возвращаем str!
        return super().__new__(cls)

    def __init__(self, value):
        print("__init__ вызван")
        self.value = value

t1 = Tricky(5)
# __init__ вызван
t2 = Tricky(-3)
# __init__ НЕ вызван — вернули str
print(type(t1), type(t2))   # <class 'Tricky'> <class 'str'>
\`\`\`

---

## Иммутабельные типы: только __new__

Для \`int\`, \`str\`, \`tuple\` — объект нельзя изменить после создания, кастомизация только через \`__new__\`:

\`\`\`python
class PositiveInt(int):
    def __new__(cls, value: int) -> "PositiveInt":
        if value <= 0:
            raise ValueError(f"Должно быть положительным: {value}")
        return super().__new__(cls, value)

n = PositiveInt(5)
print(n + 3)   # 8
PositiveInt(-1)   # ValueError

class UpperStr(str):
    def __new__(cls, value: str) -> "UpperStr":
        return super().__new__(cls, value.upper())

s = UpperStr("hello")
print(s)   # HELLO
\`\`\``,
  },
  {
    id: "oop2-super-diamond",
    question:
      "Как работает super() в контексте сложного множественного наследования (ромбовидная структура)?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "middle",
    answer: `## super() — делегирование по MRO

\`super()\` возвращает прокси, который делегирует вызов **следующему классу в MRO** текущего экземпляра. Это не обязательно прямой родитель.

\`\`\`python
class Base:
    def __init__(self):
        print("Base.__init__")
        super().__init__()

class Left(Base):
    def __init__(self):
        print("Left.__init__")
        super().__init__()   # → зависит от MRO экземпляра!

class Right(Base):
    def __init__(self):
        print("Right.__init__")
        super().__init__()

class Diamond(Left, Right):
    def __init__(self):
        print("Diamond.__init__")
        super().__init__()

# MRO: Diamond → Left → Right → Base → object
print([c.__name__ for c in Diamond.__mro__])

Diamond()
# Diamond.__init__
# Left.__init__     ← super() в Diamond → Left
# Right.__init__    ← super() в Left → Right (не Base!)
# Base.__init__     ← super() в Right → Base
\`\`\`

---

## Почему super() в Left идёт к Right?

При создании \`Diamond\`, MRO зафиксирован: \`[Diamond, Left, Right, Base, object]\`. Когда \`Left\` вызывает \`super()\`, Python смотрит MRO **экземпляра** и берёт следующий после \`Left\` — это \`Right\`.

---

## Передача аргументов через цепочку

\`\`\`python
class Shape:
    def __init__(self, color: str = "black", **kwargs):
        super().__init__(**kwargs)
        self.color = color

class Sized:
    def __init__(self, size: float = 1.0, **kwargs):
        super().__init__(**kwargs)
        self.size = size

class ColoredShape(Sized, Shape):
    def __init__(self, name: str, **kwargs):
        super().__init__(**kwargs)
        self.name = name

# MRO: ColoredShape → Sized → Shape → object
cs = ColoredShape(name="circle", size=5.0, color="red")
print(cs.name, cs.size, cs.color)   # circle 5.0 red
\`\`\`

---

## Типичные ошибки

\`\`\`python
# ❌ Не вызвать super().__init__() — цепочка разрывается:
class BrokenRight(Base):
    def __init__(self):
        print("BrokenRight.__init__")
        # super().__init__() — забыли!

class BrokenDiamond(Left, BrokenRight):
    pass

BrokenDiamond()
# Left.__init__
# BrokenRight.__init__
# Base.__init__ НЕ ВЫЗВАН! ← атрибуты Base не инициализированы

# ❌ Не передавать **kwargs — аргументы теряются в цепочке:
class BadMixin:
    def __init__(self, x, y):
        super().__init__()   # ← kwargs не пробрасываются дальше
\`\`\``,
  },
  {
    id: "oop2-add-radd-operators",
    question:
      "Как реализовать поддержку арифметических операторов (__add__ и __radd__)? В чём разница между ними?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "middle",
    answer: `## __add__ и __radd__: левый и правый операнды

\`a + b\` вызывает:
1. \`a.__add__(b)\` — если возвращает \`NotImplemented\`, то:
2. \`b.__radd__(a)\`

\`\`\`python
class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        if isinstance(other, (int, float)):
            return Vector(self.x + other, self.y + other)
        return NotImplemented   # ← не raise TypeError!

    def __radd__(self, other):
        return self.__add__(other)   # + коммутативен

v1 = Vector(1, 2)
v2 = Vector(3, 4)
print(v1 + v2)   # Vector(4, 6)
print(5 + v1)    # int.__add__(v1) → NotImplemented → v1.__radd__(5) → Vector(6, 7)
\`\`\`

---

## Зачем NotImplemented (не raise!)

\`NotImplemented\` сигнализирует Python: «спроси у другого операнда». Это позволяет правому операнду обработать операцию через \`__radd__\`.

\`\`\`python
class Celsius:
    def __init__(self, temp): self.temp = temp
    def __repr__(self): return f"Celsius({self.temp})"

    def __add__(self, other):
        if isinstance(other, (int, float)):
            return Celsius(self.temp + other)
        return NotImplemented

class Kelvin:
    def __init__(self, temp): self.temp = temp

    def __radd__(self, other):
        if isinstance(other, Celsius):
            return Celsius(other.temp + self.temp - 273.15)
        return NotImplemented

c = Celsius(20)
k = Kelvin(300)
print(c + k)   # Celsius.__add__(k) → NotImplemented → k.__radd__(c) → Celsius(46.85)
\`\`\`

---

## Полный набор операторов

\`\`\`python
import math

class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self): return f"Vector({self.x}, {self.y})"

    def __add__(self, other):
        if isinstance(other, Vector): return Vector(self.x+other.x, self.y+other.y)
        if isinstance(other, (int, float)): return Vector(self.x+other, self.y+other)
        return NotImplemented

    def __radd__(self, other): return self.__add__(other)

    def __sub__(self, other):
        if isinstance(other, Vector): return Vector(self.x-other.x, self.y-other.y)
        if isinstance(other, (int, float)): return Vector(self.x-other, self.y-other)
        return NotImplemented

    def __rsub__(self, other):
        if isinstance(other, (int, float)): return Vector(other-self.x, other-self.y)
        return NotImplemented

    def __mul__(self, scalar):
        if isinstance(scalar, (int, float)): return Vector(self.x*scalar, self.y*scalar)
        return NotImplemented

    def __rmul__(self, scalar): return self.__mul__(scalar)

    def __neg__(self): return Vector(-self.x, -self.y)
    def __abs__(self): return math.hypot(self.x, self.y)

    def __iadd__(self, other):
        result = self.__add__(other)
        if result is NotImplemented: return NotImplemented
        self.x, self.y = result.x, result.y
        return self

    def __eq__(self, other):
        if not isinstance(other, Vector): return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self): return hash((self.x, self.y))

v = Vector(1, 2)
print(v * 3)     # Vector(3, 6)
print(3 * v)     # Vector(3, 6) ← __rmul__
print(-v)        # Vector(-1, -2)
print(abs(v))    # 2.236...
v += Vector(10, 0)
print(v)         # Vector(11, 2)
\`\`\``,
  },
  {
    id: "oop2-descriptors",
    question:
      "Что такое дескрипторы (descriptors)? Приведите примеры их использования в стандартной библиотеке.",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Что такое дескриптор

Дескриптор — объект, управляющий доступом к атрибуту другого класса через \`__get__\`, \`__set__\`, \`__delete__\`.

\`\`\`python
class Descriptor:
    def __get__(self, obj, objtype=None):
        print(f"__get__: obj={obj!r}, type={objtype}")
        return 42

    def __set__(self, obj, value):
        print(f"__set__: value={value}")

    def __delete__(self, obj):
        print(f"__delete__")

class MyClass:
    attr = Descriptor()   # дескриптор — атрибут КЛАССА

mc = MyClass()
mc.attr          # __get__: obj=<MyClass...>
mc.attr = 99     # __set__: value=99
del mc.attr      # __delete__
MyClass.attr     # __get__: obj=None  ← обращение через класс
\`\`\`

---

## Data vs Non-Data дескриптор

- **Data descriptor**: реализует \`__set__\` — приоритет **выше** \`__dict__\` экземпляра.
- **Non-data descriptor**: только \`__get__\` — \`__dict__\` экземпляра имеет **приоритет**.

\`\`\`python
class DataDesc:
    def __get__(self, obj, cls): return "data_desc"
    def __set__(self, obj, val): pass

class NonDataDesc:
    def __get__(self, obj, cls): return "non_data_desc"

class Example:
    data    = DataDesc()
    nondata = NonDataDesc()

e = Example()
e.__dict__["data"]    = "instance_value"
e.__dict__["nondata"] = "instance_value"

print(e.data)    # "data_desc"      ← DataDesc выигрывает
print(e.nondata) # "instance_value" ← __dict__ выигрывает
\`\`\`

---

## Практический дескриптор: валидируемое поле

\`\`\`python
class Validated:
    def __set_name__(self, owner, name):
        self.public_name  = name
        self.private_name = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self.private_name, None)

    def __set__(self, obj, value):
        self.validate(value)
        setattr(obj, self.private_name, value)

    def validate(self, value): pass

class PositiveNumber(Validated):
    def validate(self, value):
        if not isinstance(value, (int, float)) or value <= 0:
            raise ValueError(f"Должно быть положительным: {value}")

class Product:
    price = PositiveNumber()
    stock = PositiveNumber()

p = Product()
p.price = 29.99   # OK
p.price = -5      # ValueError
\`\`\`

---

## Дескрипторы в стандартной библиотеке

\`\`\`python
# 1. property — самый известный дескриптор:
class Circle:
    def __init__(self, r): self._r = r

    @property
    def radius(self) -> float: return self._r

    @radius.setter
    def radius(self, v):
        if v < 0: raise ValueError("radius >= 0")
        self._r = v

print(type(Circle.__dict__["radius"]))   # <class 'property'>

# 2. classmethod и staticmethod — тоже дескрипторы:
class Foo:
    @classmethod
    def cm(cls): pass
    @staticmethod
    def sm(): pass

print(type(Foo.__dict__["cm"]))   # <class 'classmethod'>
print(type(Foo.__dict__["sm"]))   # <class 'staticmethod'>

# 3. Функции — non-data дескрипторы:
# func.__get__(instance, cls) возвращает bound method:
def greet(self): return f"Hi, {self.name}"

class Person:
    name = "Alice"
    hello = greet

p = Person()
print(p.hello())   # "Hi, Alice"  ← greet.__get__(p, Person)()
\`\`\``,
  },
  {
    id: "oop2-metaclasses",
    question:
      "Что такое метаклассы? Для каких задач они применяются и чем отличаются от обычного наследования?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Что такое метакласс

Классы — объекты, их «классом» является метакласс. По умолчанию — \`type\`.

\`\`\`python
class MyClass:
    pass

print(type(MyClass))   # <class 'type'>
print(type(int))       # <class 'type'>
print(type(type))      # <class 'type'>

# Создание класса через type напрямую:
MyDynamic = type(
    "MyDynamic",
    (object,),
    {"x": 42, "greet": lambda self: f"x={self.x}"}
)
print(MyDynamic().greet())   # "x=42"
\`\`\`

---

## Хуки метакласса

\`\`\`python
class Meta(type):
    def __new__(mcs, name, bases, namespace):
        print(f"Meta.__new__: создаём класс {name}")
        return super().__new__(mcs, name, bases, namespace)

    def __call__(cls, *args, **kwargs):
        print(f"Meta.__call__: создаём экземпляр {cls.__name__}")
        return super().__call__(*args, **kwargs)

class MyClass(metaclass=Meta):
    x = 10
# Meta.__new__: создаём класс MyClass

obj = MyClass()
# Meta.__call__: создаём экземпляр MyClass
\`\`\`

---

## Практическое применение 1: регистрация плагинов

\`\`\`python
class PluginMeta(type):
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:
            plugin_name = namespace.get("name", name.lower())
            mcs.registry[plugin_name] = cls
        return cls

class BasePlugin(metaclass=PluginMeta):
    name: str = ""
    def run(self): raise NotImplementedError

class JSONPlugin(BasePlugin):
    name = "json"
    def run(self): return "processing JSON"

class CSVPlugin(BasePlugin):
    name = "csv"
    def run(self): return "processing CSV"

print(PluginMeta.registry)
# {'json': <class 'JSONPlugin'>, 'csv': <class 'CSVPlugin'>}
\`\`\`

---

## Практическое применение 2: автоматическое логирование методов

\`\`\`python
import functools

class LoggedClass(type):
    def __new__(mcs, name, bases, namespace):
        for attr, value in namespace.items():
            if callable(value) and not attr.startswith("_"):
                namespace[attr] = mcs._wrap(value)
        return super().__new__(mcs, name, bases, namespace)

    @staticmethod
    def _wrap(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"→ {func.__name__}{args[1:]}")
            result = func(*args, **kwargs)
            print(f"← {func.__name__} = {result!r}")
            return result
        return wrapper

class Service(metaclass=LoggedClass):
    def add(self, x, y): return x + y

Service().add(2, 3)
# → add(2, 3)
# ← add = 5
\`\`\`

---

## Метакласс vs наследование vs альтернативы

\`\`\`python
# Наследование → влияет на экземпляры класса
# Метакласс → влияет на сам класс

# Python 3.6+: __init_subclass__ — более простая альтернатива метаклассу:
class Base:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, plugin_name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if plugin_name:
            Base._registry[plugin_name] = cls

class JSONPlugin(Base, plugin_name="json"):
    def run(self): return "json"

class CSVPlugin(Base, plugin_name="csv"):
    def run(self): return "csv"

print(Base._registry)   # {'json': JSONPlugin, 'csv': CSVPlugin}
\`\`\`

| Задача | Метакласс | Альтернатива |
|--------|-----------|-------------|
| Регистрация подклассов | ✅ | \`__init_subclass__\` (Python 3.6+) |
| Принудительные интерфейсы | ✅ | \`abc.ABC\` + \`@abstractmethod\` |
| ORM (SQLAlchemy, Django) | ✅ | — |
| Добавить методы в класс | ✅ | Декоратор класса |`,
  },
  {
    id: "oop2-getattribute-vs-getattr",
    question:
      "Как устроен __getattribute__ и чем он отличается от __getattr__? К каким ошибкам может привести его некорректное переопределение?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Разница между двумя методами

| | \`__getattribute__\` | \`__getattr__\` |
|--|---------------------|----------------|
| Когда вызывается | **При каждом** обращении к атрибуту | Только если атрибут **не найден** |
| Дефолтная реализация | Да (в \`object\`) | Нет |
| Типичное переопределение | Редко (опасно) | Часто (прокси, ленивая загрузка) |

---

## __getattr__: резервный вариант

\`\`\`python
class LazyConfig:
    """Ленивая загрузка из переменных окружения."""

    def __getattr__(self, name: str):
        import os
        value = os.environ.get(name.upper())
        if value is None:
            raise AttributeError(f"Переменная {name!r} не найдена")
        setattr(self, name, value)   # кэшируем
        return value

config = LazyConfig()
config.database_url   # → os.environ["DATABASE_URL"]
# Второй раз читается из self.__dict__ — __getattr__ не вызывается
\`\`\`

---

## __getattribute__: вызывается всегда

\`\`\`python
class Traced:
    def __init__(self):
        self._data = {"x": 10}

    def __getattribute__(self, name: str):
        print(f"__getattribute__: {name!r}")
        return super().__getattribute__(name)   # ОБЯЗАТЕЛЬНО через super()!

t = Traced()
t._data   # __getattribute__: '_data'  — каждый раз!
\`\`\`

---

## Критическая ошибка: бесконечная рекурсия

\`\`\`python
class DANGEROUS:
    def __getattribute__(self, name):
        return self.__dict__[name]
        # self.__dict__ → снова вызывает __getattribute__("__dict__")
        # → бесконечная рекурсия → RecursionError!

class SAFE:
    def __getattribute__(self, name):
        value = super().__getattribute__(name)   # ✅ всегда через super()
        print(f"Доступ к {name!r}")
        return value

# Или явно через object:
class ALSO_SAFE:
    def __getattribute__(self, name):
        return object.__getattribute__(self, name)
\`\`\`

---

## Практический пример: ReadOnly прокси

\`\`\`python
class ReadOnlyProxy:
    def __init__(self, target):
        object.__setattr__(self, "_target", target)   # ← нельзя self._target = target!

    def __getattribute__(self, name: str):
        if name == "_target":
            return object.__getattribute__(self, "_target")
        target = object.__getattribute__(self, "_target")
        return getattr(target, name)

    def __setattr__(self, name: str, value):
        raise AttributeError(f"ReadOnly: запись {name!r} запрещена")

class Config:
    host = "localhost"
    port = 8080

proxy = ReadOnlyProxy(Config())
print(proxy.host)      # "localhost"
proxy.host = "other"   # AttributeError
\`\`\`

---

## __getattr__ + __getattribute__ вместе

\`\`\`python
class SmartObject:
    def __init__(self, data: dict):
        self._data = data

    def __getattribute__(self, name: str):
        # Вызывается для всего; если не найдёт — Python вызовет __getattr__
        return super().__getattribute__(name)

    def __getattr__(self, name: str):
        # Вызывается только если __getattribute__ поднял AttributeError
        data = object.__getattribute__(self, "_data")
        if name in data:
            return data[name]
        raise AttributeError(f"{name!r} не найден")

obj = SmartObject({"x": 10, "name": "point"})
print(obj._data)    # из __dict__ через __getattribute__
print(obj.x)        # 10 — через __getattr__
\`\`\``,
  },
  {
    id: "oop2-singleton-metaclass-new",
    question:
      "Как реализовать потокобезопасный Singleton через метакласс или __new__?",
    category: "ООП, метапрограммирование и продвинутый синтаксис",
    difficulty: "senior",
    answer: `## Способ 1: через __new__ с double-checked locking

\`\`\`python
import threading

class SingletonNew:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:   # double-checked locking
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "_initialized"):
            self.data: dict = {}
            self._initialized = True

a = SingletonNew()
b = SingletonNew()
print(a is b)   # True

# Потокобезопасность:
instances = []
def create(): instances.append(SingletonNew())

threads = [threading.Thread(target=create) for _ in range(100)]
for t in threads: t.start()
for t in threads: t.join()
print(len(set(id(i) for i in instances)))   # 1
\`\`\`

---

## Способ 2: через метакласс (переиспользуемый)

Метакласс полностью контролирует \`__call__\` и решает проблему повторного вызова \`__init__\`:

\`\`\`python
import threading

class SingletonMeta(type):
    _instances: dict[type, object] = {}
    _lock: threading.Lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            with cls._lock:
                if cls not in cls._instances:
                    instance = super().__call__(*args, **kwargs)
                    cls._instances[cls] = instance
        return cls._instances[cls]

class DatabaseConnection(metaclass=SingletonMeta):
    def __init__(self, url: str = "sqlite:///:memory:"):
        self.url = url
        print(f"Соединение с {url}")   # выведется только ОДИН раз

class CacheService(metaclass=SingletonMeta):
    def __init__(self):
        self.cache: dict = {}

db1 = DatabaseConnection("postgresql://localhost/mydb")
db2 = DatabaseConnection("другой_url")   # __init__ НЕ вызывается!
print(db1 is db2)   # True
print(db1.url)      # "postgresql://localhost/mydb"

# Независимые синглтоны для разных классов:
cache = CacheService()
print(db1 is cache)   # False
\`\`\`

---

## Способ 3: через модуль (питоничный)

\`\`\`python
# config.py
class _AppConfig:
    def __init__(self):
        self.debug = False
        self.database_url = "sqlite:///app.db"

config = _AppConfig()   # создаётся один раз при импорте модуля

# В другом файле:
# from config import config
# config.debug = True   ← все видят одно и то же
\`\`\`

---

## Способ 4: через декоратор класса

\`\`\`python
import functools, threading

def singleton(cls):
    instances = {}
    lock = threading.Lock()

    @functools.wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            with lock:
                if cls not in instances:
                    instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class Logger:
    def __init__(self, name: str = "app"):
        self.name = name
        self.logs: list[str] = []

log1 = Logger("myapp")
log2 = Logger("другое")   # аргументы игнорируются
print(log1 is log2)   # True
\`\`\`

---

## Сравнение подходов

| Способ | Потокобезопасность | Наследование | Простота |
|--------|-------------------|--------------|---------|
| \`__new__\` | ✅ (с Lock) | ⚠️ проблемы | Средняя |
| Метакласс | ✅ (с Lock) | ✅ | Сложная |
| Модуль | ✅ (GIL) | ❌ | Простейшая |
| Декоратор | ✅ (с Lock) | ❌ | Средняя |

> Предпочтительный питоничный подход — **модуль**: Python гарантирует, что код модуля выполняется ровно один раз.`,
  },
];
