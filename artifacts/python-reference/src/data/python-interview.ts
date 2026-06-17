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
];
