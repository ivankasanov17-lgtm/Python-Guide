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
    name: "abs(x)",
    description:
      "Возвращает абсолютное значение числа. Аргументом может быть целое число, число с плавающей точкой или объект, реализующий метод __abs__(). Если аргумент является комплексным числом, возвращается его модуль.",
    syntax: "abs(x)",
    arguments: [
      { name: "x", description: "Число, целое, вещественное или комплексное" },
    ],
    example: "abs(-5)      # 5\nabs(-3.14)   # 3.14\nabs(3+4j)    # 5.0",
  },
  {
    name: "aiter(async_iterable)",
    description: `Возвращает асинхронный итератор для асинхронного итерируемого объекта. Эквивалентно вызову метода __aiter__() на объекте. Добавлена в Python 3.10.

Функция предназначена для использования внутри асинхронного кода — async-функций или async for. Асинхронный итерируемый объект — это объект, реализующий метод __aiter__(), который возвращает асинхронный итератор с методом __anext__().

Основное применение — явное получение асинхронного итератора из асинхронного итерируемого, аналогично тому, как iter() используется для обычных итерируемых объектов.`,
    syntax: "aiter(async_iterable)",
    arguments: [
      {
        name: "async_iterable",
        description:
          "Асинхронный итерируемый объект, реализующий метод __aiter__()",
      },
    ],
    example: `import asyncio

async def async_generator():
    for i in range(5):
        yield i

async def main():
    ait = aiter(async_generator())  # получаем асинхронный итератор
    print(await anext(ait))  # 0
    print(await anext(ait))  # 1

    # Эквивалентно использованию async for:
    async for value in async_generator():
        print(value)  # 0, 1, 2, 3, 4

asyncio.run(main())`,
  },
  {
    name: "all(iterable)",
    description:
      "Возвращает True, если все элементы итерируемого объекта истинны (или объект пуст). Эквивалентно циклу, который проверяет каждый элемент.",
    syntax: "all(iterable)",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект (список, кортеж и т.д.)",
      },
    ],
    example:
      "all([True, True, True])   # True\nall([True, False, True])  # False\nall([])                   # True (пустой — тоже True)",
  },
  {
    name: "any(iterable)",
    description:
      "Возвращает True, если хотя бы один элемент итерируемого объекта истинен. Если итерируемый объект пуст, возвращает False.",
    syntax: "any(iterable)",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект (список, кортеж и т.д.)",
      },
    ],
    example:
      "any([False, False, True])  # True\nany([False, False, False]) # False\nany([])                    # False",
  },
  {
    name: "anext(async_iterator[, default])",
    description: `Возвращает следующий элемент из асинхронного итератора, вызывая его метод __anext__(). Добавлена в Python 3.10.

Если итератор исчерпан:
- Без default: выбрасывается исключение StopAsyncIteration
- С default: возвращается значение default

Является асинхронным аналогом встроенной функции next() для обычных итераторов. Должна вызываться с await внутри async-функции.

Функция полезна для пошагового ручного обхода асинхронных итераторов, например при реализации асинхронного конвейера или при необходимости получить только первый элемент без полного обхода.`,
    syntax: "await anext(async_iterator[, default])",
    arguments: [
      {
        name: "async_iterator",
        description:
          "Асинхронный итератор — объект с методом __anext__(). Получается через aiter() или async for",
      },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое при исчерпании итератора вместо StopAsyncIteration",
      },
    ],
    example: `import asyncio

async def async_counter(n):
    for i in range(n):
        yield i

async def main():
    ait = aiter(async_counter(3))

    print(await anext(ait))           # 0
    print(await anext(ait))           # 1
    print(await anext(ait))           # 2
    print(await anext(ait, "конец"))  # "конец" — итератор исчерпан

asyncio.run(main())`,
  },
  {
    name: "ascii(object)",
    description:
      "Возвращает строку, содержащую читаемое представление объекта, аналогично repr(). Символы, не входящие в ASCII (не-ASCII), экранируются через \\x, \\u или \\U.",
    syntax: "ascii(object)",
    arguments: [{ name: "object", description: "Любой Python-объект" }],
    example:
      'ascii("Hello")      # "\'Hello\'"\nascii("Привет")     # "\'\\u041f\\u0440\\u0438\\u0432\\u0435\\u0442\'"',
  },
  {
    name: "bin(x)",
    description:
      'Преобразует целое число в двоичную строку с префиксом "0b". Результат является корректным Python-выражением. Если x не является объектом int, он должен определять метод __index__(), возвращающий целое число.',
    syntax: "bin(x)",
    arguments: [{ name: "x", description: "Целое число" }],
    example: 'bin(10)   # "0b1010"\nbin(-5)   # "-0b101"\nbin(0)    # "0b0"',
  },
  {
    name: "bisect.bisect_left(a, x[, lo[, hi]])",
    description: `Возвращает индекс левой точки вставки элемента x в отсортированный список a, чтобы список оставался отсортированным. Если x уже присутствует в a, возвращаемый индекс будет перед (левее) любым существующим вхождением.

Функция использует алгоритм бинарного поиска и работает за O(log n).

Параметры lo и hi позволяют ограничить поиск подсписком a[lo:hi].

Отличие от bisect_right:
- bisect_left: вставка перед существующими вхождениями x
- bisect_right: вставка после существующих вхождений x

Применение:
- Поиск позиции вставки без самой вставки (поиск в отсортированном массиве)
- Проверка: x in a эквивалентно a[bisect_left(a, x)] == x
- Реализация ступенчатых шкал (grades, диапазонов)`,
    syntax: "bisect.bisect_left(a, x, lo=0, hi=len(a))",
    arguments: [
      {
        name: "a",
        description: "Отсортированный список, в котором выполняется поиск",
      },
      {
        name: "x",
        description: "Искомое значение — точка вставки которого ищется",
      },
      {
        name: "lo",
        description:
          "Необязательный. Нижняя граница подсписка для поиска. По умолчанию 0",
      },
      {
        name: "hi",
        description:
          "Необязательный. Верхняя граница подсписка для поиска. По умолчанию len(a)",
      },
    ],
    example: `import bisect

a = [1, 3, 3, 5, 7, 9]

bisect.bisect_left(a, 3)   # 1 — перед первым вхождением 3
bisect.bisect_left(a, 4)   # 3 — между 3 и 5
bisect.bisect_left(a, 0)   # 0 — перед всеми
bisect.bisect_left(a, 10)  # 6 — после всех

# Поиск элемента в отсортированном списке за O(log n)
def index(a, x):
    i = bisect.bisect_left(a, x)
    if i < len(a) and a[i] == x:
        return i
    raise ValueError(f"{x} не найден")

# Ступенчатая шкала оценок
def grade(score):
    breakpoints = [60, 70, 80, 90]
    grades = ["F", "D", "C", "B", "A"]
    return grades[bisect.bisect_left(breakpoints, score)]

print(grade(55))   # F
print(grade(70))   # C  (bisect_left: 70 → индекс 1 → 'D'... нет, bisect_left([60,70,80,90], 70) = 1)
print(grade(85))   # B
print(grade(100))  # A`,
  },
  {
    name: "bisect.bisect_right(a, x[, lo[, hi]])",
    description: `Возвращает индекс правой точки вставки элемента x в отсортированный список a, чтобы список оставался отсортированным. Если x уже присутствует в a, возвращаемый индекс будет после (правее) всех существующих вхождений.

Также доступна под именем bisect.bisect() (синоним bisect_right).

Функция использует алгоритм бинарного поиска и работает за O(log n).

Отличие от bisect_left:
- bisect_left(a, x) — вставка перед существующими x
- bisect_right(a, x) — вставка после существующих x

Оба варианта дают одинаковый результат, если x не присутствует в a.`,
    syntax: "bisect.bisect_right(a, x, lo=0, hi=len(a))",
    arguments: [
      {
        name: "a",
        description: "Отсортированный список, в котором выполняется поиск",
      },
      {
        name: "x",
        description: "Искомое значение — точка вставки после которого ищется",
      },
      {
        name: "lo",
        description:
          "Необязательный. Нижняя граница подсписка для поиска. По умолчанию 0",
      },
      {
        name: "hi",
        description:
          "Необязательный. Верхняя граница подсписка для поиска. По умолчанию len(a)",
      },
    ],
    example: `import bisect

a = [1, 3, 3, 5, 7, 9]

bisect.bisect_right(a, 3)   # 3 — после последнего вхождения 3
bisect.bisect_right(a, 4)   # 3 — между 3 и 5 (то же, что bisect_left)
bisect.bisect_right(a, 0)   # 0
bisect.bisect_right(a, 10)  # 6

# bisect() — синоним bisect_right
bisect.bisect(a, 3)  # 3

# Подсчёт вхождений x в отсортированном списке
def count_occurrences(a, x):
    return bisect.bisect_right(a, x) - bisect.bisect_left(a, x)

a = [1, 2, 3, 3, 3, 4, 5]
print(count_occurrences(a, 3))  # 3

# Ступенчатая шкала (bisect_right удобнее для "включительно правой границы")
def grade(score):
    breakpoints = [60, 70, 80, 90]
    grades = ["F", "D", "C", "B", "A"]
    return grades[bisect.bisect_right(breakpoints, score)]

print(grade(60))   # D  — 60 включено в "D" (bisect_right даёт индекс 1)
print(grade(90))   # A
print(grade(100))  # A`,
  },
  {
    name: "bisect.insort_left(a, x[, lo[, hi]])",
    description: `Вставляет элемент x в отсортированный список a, сохраняя его порядок. Если x уже присутствует в a, вставка происходит перед (левее) существующих вхождений.

Эквивалентно: a.insert(bisect.bisect_left(a, x, lo, hi), x).

Работает за O(log n) для нахождения позиции, но O(n) для самой вставки (из-за сдвига элементов списка). Для больших списков с частыми вставками используйте структуры данных типа SortedList (пакет sortedcontainers).`,
    syntax: "bisect.insort_left(a, x, lo=0, hi=len(a))",
    arguments: [
      {
        name: "a",
        description: "Отсортированный список, в который нужно вставить элемент",
      },
      { name: "x", description: "Элемент для вставки" },
      {
        name: "lo",
        description: "Необязательный. Нижняя граница подсписка. По умолчанию 0",
      },
      {
        name: "hi",
        description:
          "Необязательный. Верхняя граница подсписка. По умолчанию len(a)",
      },
    ],
    example: `import bisect

a = [1, 3, 5, 7]
bisect.insort_left(a, 4)
print(a)  # [1, 3, 4, 5, 7]

bisect.insort_left(a, 3)
print(a)  # [1, 3, 3, 4, 5, 7] — вставлен перед существующей 3

# Поддержание отсортированного списка при потоке данных
scores = []
for score in [85, 92, 78, 88, 95, 70]:
    bisect.insort_left(scores, score)
    print(scores)
# [85]
# [85, 92]
# [78, 85, 92]
# [78, 85, 88, 92]
# [78, 85, 88, 92, 95]
# [70, 78, 85, 88, 92, 95]`,
  },
  {
    name: "bisect.insort_right(a, x[, lo[, hi]])",
    description: `Вставляет элемент x в отсортированный список a, сохраняя его порядок. Если x уже присутствует в a, вставка происходит после (правее) существующих вхождений.

Также доступна под именем bisect.insort() (синоним insort_right).

Эквивалентно: a.insert(bisect.bisect_right(a, x, lo, hi), x).

Разница между insort_left и insort_right проявляется только при наличии дубликатов — они определяют, с какой стороны от равных элементов будет вставлен новый.`,
    syntax: "bisect.insort_right(a, x, lo=0, hi=len(a))",
    arguments: [
      {
        name: "a",
        description: "Отсортированный список, в который нужно вставить элемент",
      },
      { name: "x", description: "Элемент для вставки" },
      {
        name: "lo",
        description: "Необязательный. Нижняя граница подсписка. По умолчанию 0",
      },
      {
        name: "hi",
        description:
          "Необязательный. Верхняя граница подсписка. По умолчанию len(a)",
      },
    ],
    example: `import bisect

a = [1, 3, 5, 7]
bisect.insort_right(a, 4)
print(a)  # [1, 3, 4, 5, 7]

bisect.insort_right(a, 3)
print(a)  # [1, 3, 3, 4, 5, 7] — вставлен после существующей 3

# insort() — синоним insort_right
bisect.insort(a, 6)
print(a)  # [1, 3, 3, 4, 5, 6, 7]

# Стабильная вставка объектов с ключом
from bisect import insort_right
events = []
# Каждое событие: (время, id, данные) — сортировка по времени
insort_right(events, (10, 1, "event_a"))
insort_right(events, (5,  2, "event_b"))
insort_right(events, (10, 3, "event_c"))  # то же время — добавится после event_a
print(events)
# [(5, 2, 'event_b'), (10, 1, 'event_a'), (10, 3, 'event_c')]`,
  },
  {
    name: "bool([x])",
    description:
      "Возвращает булево значение, то есть True или False. x преобразуется стандартными процедурами проверки истинности. Если x ложно или опущено, возвращается False; иначе True. bool — это подкласс int.",
    syntax: "bool([x])",
    arguments: [
      {
        name: "x",
        description: "Необязательный. Любое значение для преобразования в bool",
      },
    ],
    example:
      'bool(0)      # False\nbool(1)      # True\nbool("")     # False\nbool("hi")   # True\nbool()       # False',
  },
  {
    name: "breakpoint(*args, **kwargs)",
    description: `Останавливает выполнение программы и запускает отладчик в месте вызова. Добавлена в Python 3.7.

По умолчанию вызывает pdb.set_trace() без аргументов. Поведение можно изменить через переменную окружения PYTHONBREAKPOINT:
- PYTHONBREAKPOINT=0 — полностью отключает все вызовы breakpoint()
- PYTHONBREAKPOINT=module.callable — использует указанный обработчик (например, ipdb.set_trace)
- PYTHONBREAKPOINT= (пустая строка) — эквивалентно 0

Технически breakpoint() вызывает sys.breakpointhook(*args, **kwargs), который можно переопределить программно.

Функция особенно удобна по сравнению с ручным импортом pdb — не нужно писать import pdb; pdb.set_trace(), достаточно одного вызова. Также легко отключается глобально без изменения кода.

Основные команды pdb после вызова breakpoint():
- n (next) — следующая строка
- s (step) — войти в функцию
- c (continue) — продолжить выполнение
- q (quit) — выйти из отладчика
- p <expr> — вывести значение выражения`,
    syntax: "breakpoint(*args, **kwargs)",
    arguments: [
      {
        name: "*args",
        description:
          "Необязательные позиционные аргументы, передаваемые в sys.breakpointhook()",
      },
      {
        name: "**kwargs",
        description:
          "Необязательные именованные аргументы, передаваемые в sys.breakpointhook()",
      },
    ],
    example: `def calculate(x, y):
    result = x * y
    breakpoint()  # здесь выполнение остановится, откроется pdb
    return result + 10

calculate(3, 4)
# (Pdb) p result
# 12
# (Pdb) c
# продолжить выполнение

# Отключить все breakpoint() без изменения кода:
# PYTHONBREAKPOINT=0 python script.py

# Использовать ipdb вместо pdb:
# PYTHONBREAKPOINT=ipdb.set_trace python script.py`,
  },
  {
    name: "bytearray([source[, encoding[, errors]]])",
    description:
      "Возвращает объект bytearray — изменяемую последовательность целых чисел в диапазоне 0 ≤ x < 256. Может быть создан из строки (с указанием кодировки), итерируемого объекта целых чисел или целого числа (создаёт нулевую последовательность заданной длины).",
    syntax: "bytearray([source[, encoding[, errors]]])",
    arguments: [
      {
        name: "source",
        description: "Строка, целое число или итерируемый объект целых чисел",
      },
      {
        name: "encoding",
        description: "Кодировка строки (обязательна если source — строка)",
      },
      {
        name: "errors",
        description:
          'Действие при ошибке кодирования: "strict", "ignore", "replace"',
      },
    ],
    example:
      "bytearray(5)                   # bytearray(b'\\x00\\x00\\x00\\x00\\x00')\nbytearray(\"hello\", \"utf-8\")    # bytearray(b'hello')\nbytearray([65, 66, 67])        # bytearray(b'ABC')",
  },
  {
    name: "bytes([source[, encoding[, errors]]])",
    description:
      "Возвращает объект bytes — неизменяемую последовательность байт. Аргументы такие же как у bytearray. Основное отличие от bytearray: объект bytes является неизменяемым.",
    syntax: "bytes([source[, encoding[, errors]]])",
    arguments: [
      {
        name: "source",
        description: "Строка, целое число или итерируемый объект целых чисел",
      },
      {
        name: "encoding",
        description: "Кодировка строки (обязательна если source — строка)",
      },
      {
        name: "errors",
        description:
          'Действие при ошибке кодирования: "strict", "ignore", "replace"',
      },
    ],
    example:
      "bytes(5)                   # b'\\x00\\x00\\x00\\x00\\x00'\nbytes(\"hello\", \"utf-8\")    # b'hello'\nbytes([65, 66, 67])        # b'ABC'",
  },
  {
    name: "callable(object)",
    description:
      "Возвращает True, если объект является вызываемым (callable), иначе False. Если функция возвращает True, вызов всё равно может завершиться неудачей, но если False — вызов объекта точно не удастся. Классы — вызываемые объекты (вызов создаёт новый экземпляр). Экземпляры класса вызываемы если класс определяет метод __call__().",
    syntax: "callable(object)",
    arguments: [{ name: "object", description: "Любой Python-объект" }],
    example:
      "callable(len)       # True\ncallable(42)        # False\ncallable(str)       # True  (класс)\n\nclass Foo:\n    def __call__(self): pass\ncallable(Foo())     # True",
  },
  {
    name: "chr(i)",
    description:
      'Возвращает строку, представляющую символ, соответствующий кодовой точке Unicode i. Например, chr(97) возвращает "a", chr(8364) возвращает "€". Обратная функция — ord(). Допустимый диапазон: 0 до 1 114 111 (0x10FFFF).',
    syntax: "chr(i)",
    arguments: [
      {
        name: "i",
        description: "Целое число — кодовая точка Unicode (от 0 до 1114111)",
      },
    ],
    example:
      'chr(97)      # "a"\nchr(65)      # "A"\nchr(8364)    # "€"\nchr(1055)    # "П"',
  },
  {
    name: "classmethod(function)",
    description: `classmethod — это дескриптор, преобразующий обычный метод в метод класса. Метод класса получает первым аргументом сам класс (обычно называемый cls), а не экземпляр (self). Это означает, что такой метод можно вызывать как через экземпляр класса, так и напрямую через сам класс.

Методы класса часто используются как альтернативные конструкторы. Например, dict.fromkeys() — это classmethod, создающий словарь из ключей. Другое применение — переопределение фабричных методов в подклассах с сохранением правильного типа.

Начиная с Python 3.9, classmethod можно применять поверх других дескрипторов (например, property). С Python 3.10 методы класса также могут быть цепочечно декорированы с помощью @staticmethod.

Важное отличие от staticmethod: classmethod всегда получает класс как первый аргумент, тогда как staticmethod не получает ни класса, ни экземпляра.`,
    syntax: "@classmethod\ndef method(cls, ...): ...",
    arguments: [
      {
        name: "function",
        description:
          "Функция, которая будет преобразована в метод класса. Первым параметром должен быть cls (класс)",
      },
    ],
    example: `class Date:
    def __init__(self, year, month, day):
        self.year = year
        self.month = month
        self.day = day

    @classmethod
    def from_string(cls, date_string):
        year, month, day = map(int, date_string.split('-'))
        return cls(year, month, day)  # создаёт экземпляр нужного класса

    @classmethod
    def today(cls):
        import datetime
        d = datetime.date.today()
        return cls(d.year, d.month, d.day)

d = Date.from_string('2024-03-28')
print(d.year)   # 2024

# В подклассе from_string вернёт экземпляр подкласса
class SpecialDate(Date):
    pass

sd = SpecialDate.from_string('2024-01-01')
print(type(sd))  # <class '__main__.SpecialDate'>`,
  },
  {
    name: "compile(source, filename, mode, flags, dont_inherit, optimize)",
    description: `Компилирует исходный код (строку, байтовую строку или AST-объект) в объект кода или AST. Объект кода впоследствии может быть выполнен с помощью exec() или eval().

Параметр mode определяет тип компилируемого кода:
- "exec" — для последовательности операторов (программ)
- "eval" — для одного выражения, возвращающего значение
- "single" — для одного интерактивного оператора (как в REPL)

Параметр flags позволяет управлять тем, какие будущие операторы (future statements) влияют на компиляцию кода. Флаги из модуля ast и __future__ можно комбинировать побитовым ИЛИ.

Параметр optimize управляет уровнем оптимизации:
- -1 — использовать текущий уровень оптимизации интерпретатора
- 0 — без оптимизации (assert-ы сохраняются)
- 1 — удаляет assert-ы
- 2 — удаляет assert-ы и строки документации

Функция широко применяется при создании интерпретаторов, шаблонных движков, линтеров и инструментов статического анализа кода.`,
    syntax:
      "compile(source, filename, mode, flags=0, dont_inherit=False, optimize=-1)",
    arguments: [
      {
        name: "source",
        description:
          "Строка, байтовая строка или объект AST с исходным кодом Python",
      },
      {
        name: "filename",
        description:
          'Имя файла, из которого считан код. Используется в сообщениях об ошибках. Если кода нет в файле, используйте "<string>"',
      },
      {
        name: "mode",
        description:
          'Режим компиляции: "exec" (блок операторов), "eval" (одно выражение), "single" (один интерактивный оператор)',
      },
      {
        name: "flags",
        description:
          "Необязательный. Битовые флаги, управляющие влиянием future-операторов на компиляцию",
      },
      {
        name: "dont_inherit",
        description:
          "Необязательный. Если True, future-операторы из места вызова compile() не наследуются",
      },
      {
        name: "optimize",
        description:
          "Необязательный. Уровень оптимизации: -1 (по умолчанию), 0, 1 или 2",
      },
    ],
    example: `# Режим "eval" — компиляция выражения
code = compile("2 + 2", "<string>", "eval")
result = eval(code)
print(result)   # 4

# Режим "exec" — компиляция блока операторов
src = """
x = 10
y = 20
print(x + y)
"""
code = compile(src, "<string>", "exec")
exec(code)      # 30

# Режим "single" — поведение как в REPL
code = compile("1 + 1", "<stdin>", "single")
exec(code)      # 2

# Компиляция в AST-объект
import ast
tree = compile("x + 1", "<string>", "eval", ast.PyCF_ONLY_AST)
print(ast.dump(tree))  # Expression(body=BinOp(...))`,
  },
  {
    name: "complex([real[, imag]])",
    description: `Создаёт комплексное число вида real + imag*j. Комплексные числа в Python имеют тип complex.

Функция может быть вызвана несколькими способами:
- Без аргументов: возвращает 0j
- С одним числовым аргументом: возвращает complex(real, 0)
- С двумя числовыми аргументами: возвращает complex(real, imag)
- Со строковым аргументом: разбирает строку как комплексное число (в этом случае второй аргумент недопустим)

Строковые представления: "1+2j", "1+2J", "3j", "-1.5+0.5j" и т.д. Пробелы вокруг + или - в строке не допускаются.

Если объект реализует метод __complex__(), он будет использован. Если __complex__() не определён, но определён __float__() или __index__(), используются они для получения вещественной части.

Для работы с комплексными числами используются атрибуты .real и .imag, а также метод .conjugate().`,
    syntax: "complex([real=0[, imag=0]])",
    arguments: [
      {
        name: "real",
        description:
          "Необязательный. Вещественная часть комплексного числа или строка для разбора. По умолчанию 0",
      },
      {
        name: "imag",
        description:
          "Необязательный. Мнимая часть комплексного числа. По умолчанию 0. Нельзя передавать при строковом аргументе real",
      },
    ],
    example: `complex()           # 0j
complex(3)          # (3+0j)
complex(3, 4)       # (3+4j)
complex(-1.5, 0.5)  # (-1.5+0.5j)
complex("3+4j")     # (3+4j)
complex("5j")       # 5j

c = complex(3, 4)
print(c.real)       # 3.0
print(c.imag)       # 4.0
print(c.conjugate()) # (3-4j)
print(abs(c))       # 5.0  (модуль числа)`,
  },
  {
    name: "collections.Counter([iterable-or-mapping])",
    description: `Подкласс словаря из модуля collections для подсчёта хэшируемых объектов. Хранит элементы как ключи, а их количество — как значения. Является полноценным словарём — поддерживает все его методы.

Создание:
- Из итерируемого: Counter("aabbc") → {'a': 2, 'b': 2, 'c': 1}
- Из словаря: Counter({'a': 3, 'b': 1})
- Через именованные аргументы: Counter(a=3, b=1)
- Пустой: Counter()

Особенности:
- Отсутствующие элементы возвращают 0, а не KeyError
- Счётчики могут быть отрицательными (для математических операций)
- Поддерживает арифметические операции: +, -, &, |
- + возвращает только положительные счётчики

Унаследованные полезные методы: .keys(), .values(), .items(), .update(), .pop() и др.`,
    syntax: "collections.Counter([iterable-or-mapping])",
    arguments: [
      {
        name: "iterable-or-mapping",
        description:
          "Необязательный. Итерируемый объект (строка, список и т.д.) или словарь/маппинг с начальными значениями счётчиков",
      },
    ],
    example: `from collections import Counter

# Из итерируемого
c = Counter("mississippi")
print(c)  # Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})

# Из списка слов
words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
c = Counter(words)
print(c)  # Counter({'apple': 3, 'banana': 2, 'cherry': 1})

# Доступ к несуществующему — 0, не ошибка
print(c["grape"])  # 0

# Арифметика счётчиков
c1 = Counter(a=3, b=1)
c2 = Counter(a=1, b=2)
print(c1 + c2)   # Counter({'a': 4, 'b': 3})
print(c1 - c2)   # Counter({'a': 2})        — только положительные
print(c1 & c2)   # Counter({'a': 1, 'b': 1}) — минимум
print(c1 | c2)   # Counter({'a': 3, 'b': 2}) — максимум`,
  },
  {
    name: "collections.Counter.elements()",
    description: `Возвращает итератор, в котором каждый элемент повторяется столько раз, сколько указывает его счётчик. Элементы возвращаются в порядке первого добавления. Элементы со счётчиком менее 1 не включаются.

Результат — итератор, а не список. Для получения списка используйте list(counter.elements()).

Применение:
- «Разворачивание» счётчика обратно в список элементов
- Создание мультимножества
- Передача в функции, ожидающие итерируемые объекты (sorted, random.shuffle и т.д.)`,
    syntax: "counter.elements()",
    arguments: [],
    example: `from collections import Counter

c = Counter(a=3, b=2, c=1, d=0, e=-1)
list(c.elements())
# ['a', 'a', 'a', 'b', 'b', 'c']
# d и e не включены (счётчик < 1)

# Практический пример — восстановление списка из счётчика
words = ["apple", "banana", "apple", "cherry"]
c = Counter(words)
restored = sorted(c.elements())
print(restored)  # ['apple', 'apple', 'banana', 'cherry']

# Перемешать взвешенные данные
import random
items = Counter(red=3, blue=2, green=1)
pool = list(items.elements())  # ['red', 'red', 'red', 'blue', 'blue', 'green']
random.shuffle(pool)
print(pool)`,
  },
  {
    name: "collections.Counter.most_common([n])",
    description: `Возвращает список из n наиболее часто встречающихся элементов и их счётчиков в порядке убывания. Если n не задан или None — возвращаются все элементы от наиболее к наименее частым.

При равных счётчиках порядок элементов произвольный (не гарантирован стабильной сортировкой).

Применение:
- Топ-N самых частых слов, символов, событий
- Анализ частотности данных
- Нахождение редких элементов: most_common()[:-n-1:-1] — n редчайших`,
    syntax: "counter.most_common([n])",
    arguments: [
      {
        name: "n",
        description:
          "Необязательный. Количество возвращаемых элементов. Если не указан — возвращаются все элементы по убыванию частоты",
      },
    ],
    example: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog the fox"
words = text.split()
c = Counter(words)

# Топ-3 самых частых
print(c.most_common(3))
# [('the', 3), ('fox', 2), ('quick', 1)]  — порядок при равных произвольный

# Все элементы по убыванию
print(c.most_common())

# Самые редкие (последние 2)
print(c.most_common()[:-3:-1])
# [('dog', 1), ('lazy', 1)]

# Подсчёт символов
c = Counter("abracadabra")
print(c.most_common(3))
# [('a', 5), ('b', 2), ('r', 2)]

# Анализ логов
errors = ["404", "500", "404", "404", "403", "500", "404"]
c = Counter(errors)
for code, count in c.most_common():
    print(f"HTTP {code}: {count} раз")`,
  },
  {
    name: "collections.Counter.update([iterable-or-mapping])",
    description: `Обновляет счётчики: добавляет подсчёты из iterable или маппинга к существующим. В отличие от dict.update(), который заменяет значения, Counter.update() складывает их.

Принимает те же форматы, что и конструктор:
- Итерируемый объект: каждый элемент увеличивает свой счётчик на 1
- Маппинг/Counter: добавляет указанные количества
- Именованные аргументы: counter.update(a=2, b=1)

Метод изменяет счётчик на месте (in-place) и возвращает None.

Обратная операция — subtract(): вычитает подсчёты вместо сложения.`,
    syntax: "counter.update([iterable-or-mapping])",
    arguments: [
      {
        name: "iterable-or-mapping",
        description:
          "Итерируемый объект, маппинг или Counter с данными для добавления к существующим счётчикам",
      },
    ],
    example: `from collections import Counter

c = Counter(["apple", "banana", "apple"])
print(c)  # Counter({'apple': 2, 'banana': 1})

# Добавить из итерируемого (подсчитывает каждый элемент)
c.update(["apple", "cherry", "cherry"])
print(c)  # Counter({'apple': 3, 'cherry': 2, 'banana': 1})

# Добавить из маппинга (складывает значения)
c.update({"banana": 5, "grape": 1})
print(c)  # Counter({'banana': 6, 'apple': 3, 'cherry': 2, 'grape': 1})

# Добавить через именованные аргументы
c.update(mango=3)
print(c["mango"])  # 3

# Реальный сценарий: подсчёт слов по кускам текста
total = Counter()
for chunk in ["hello world", "hello python", "world of python"]:
    total.update(chunk.split())
print(total.most_common(3))
# [('hello', 2), ('world', 2), ('python', 2)]`,
  },
  {
    name: "collections.defaultdict([default_factory])",
    description: `Подкласс dict из модуля collections, автоматически создающий значение по умолчанию для отсутствующих ключей с помощью функции default_factory. Исключает KeyError при доступе к несуществующим ключам.

При обращении к несуществующему ключу defaultdict:
1. Вызывает default_factory() без аргументов
2. Сохраняет результат как значение ключа
3. Возвращает это значение

Если default_factory равен None — поведение как у обычного dict (KeyError).

Типичные значения default_factory:
- list — для группировки (словарь списков)
- set — для уникальных коллекций
- int — для подсчёта (аналог Counter)
- dict — для вложенных словарей
- str, float — для строк/чисел (возвращает "" и 0.0)
- lambda: значение — для произвольных значений по умолчанию

Поддерживает все методы обычного dict. default_factory доступна как атрибут .default_factory.`,
    syntax: "collections.defaultdict([default_factory[, ...]])",
    arguments: [
      {
        name: "default_factory",
        description:
          "Необязательный. Вызываемый объект без аргументов, возвращающий значение по умолчанию. Если None — поведение как у dict. Может быть list, set, int, str или любая функция",
      },
    ],
    example: `from collections import defaultdict

# Группировка элементов по ключу
groups = defaultdict(list)
pairs = [("a", 1), ("b", 2), ("a", 3), ("b", 4), ("c", 5)]
for key, value in pairs:
    groups[key].append(value)
print(dict(groups))  # {'a': [1, 3], 'b': [2, 4], 'c': [5]}

# Подсчёт (аналог Counter)
word_count = defaultdict(int)
for word in "the cat sat on the mat".split():
    word_count[word] += 1
print(dict(word_count))  # {'the': 2, 'cat': 1, ...}

# Индекс слов (в каких позициях встречается)
index = defaultdict(set)
words = ["apple", "banana", "apple", "cherry", "banana"]
for i, word in enumerate(words):
    index[word].add(i)
print(dict(index))  # {'apple': {0, 2}, 'banana': {1, 4}, 'cherry': {3}}

# Произвольное значение по умолчанию
scores = defaultdict(lambda: 100)
scores["Alice"] += 50
print(scores["Alice"])  # 150
print(scores["Bob"])    # 100 — значение по умолчанию`,
  },
  {
    name: "collections.deque([iterable[, maxlen]])",
    description: `Двусторонняя очередь (double-ended queue) из модуля collections — структура данных, поддерживающая эффективные операции добавления и удаления с обоих концов за O(1).

В отличие от списка (list):
- list.append() / list.pop() — O(1) только для правого конца
- list.insert(0, x) / list.pop(0) — O(n) — медленно для левого конца
- deque работает за O(1) с обоих концов

Параметр maxlen:
- Если задан — deque ограничена по размеру
- При превышении лимита элементы автоматически вытесняются с противоположного конца
- Позволяет легко реализовать «скользящее окно» (sliding window)

Применение:
- Очереди (FIFO) и стеки (LIFO)
- Хранение N последних элементов (история, буфер)
- Алгоритм BFS (обход в ширину)
- Скользящие окна и буферы`,
    syntax: "collections.deque([iterable[, maxlen]])",
    arguments: [
      {
        name: "iterable",
        description:
          "Необязательный. Итерируемый объект, элементы которого станут начальным содержимым очереди",
      },
      {
        name: "maxlen",
        description:
          "Необязательный. Максимальная длина очереди. При превышении — автоматическое вытеснение с противоположного конца",
      },
    ],
    example: `from collections import deque

# Создание
d = deque([1, 2, 3, 4, 5])
print(d)           # deque([1, 2, 3, 4, 5])

# Скользящее окно — последние 3 элемента
window = deque(maxlen=3)
for x in [1, 2, 3, 4, 5]:
    window.append(x)
    print(list(window))
# [1]  [1,2]  [1,2,3]  [2,3,4]  [3,4,5]

# BFS — обход в ширину
from collections import deque
def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    while queue:
        node = queue.popleft()
        print(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
  },
  {
    name: "collections.deque.append(x)",
    description:
      "Добавляет элемент x в правый конец (конец) очереди. Операция выполняется за O(1). Если deque имеет maxlen и уже заполнена, элемент с левого конца автоматически вытесняется.",
    syntax: "deque.append(x)",
    arguments: [
      { name: "x", description: "Элемент, добавляемый в правый конец очереди" },
    ],
    example: `from collections import deque

d = deque([1, 2, 3])
d.append(4)
print(d)  # deque([1, 2, 3, 4])

# С maxlen — вытеснение слева
d = deque([1, 2, 3], maxlen=3)
d.append(4)
print(d)  # deque([2, 3, 4]) — 1 вытеснен

# Использование как стек (LIFO): append + pop
stack = deque()
stack.append("a")
stack.append("b")
stack.append("c")
print(stack.pop())  # "c" — последний добавленный`,
  },
  {
    name: "collections.deque.appendleft(x)",
    description:
      "Добавляет элемент x в левый конец (начало) очереди. Операция выполняется за O(1) — в отличие от list.insert(0, x), которая занимает O(n). Если deque имеет maxlen и заполнена, элемент с правого конца автоматически вытесняется.",
    syntax: "deque.appendleft(x)",
    arguments: [
      {
        name: "x",
        description: "Элемент, добавляемый в левый конец (начало) очереди",
      },
    ],
    example: `from collections import deque

d = deque([1, 2, 3])
d.appendleft(0)
print(d)  # deque([0, 1, 2, 3])

# С maxlen — вытеснение справа
d = deque([1, 2, 3], maxlen=3)
d.appendleft(0)
print(d)  # deque([0, 1, 2]) — 3 вытеснен

# История браузера — новые страницы в начало
history = deque(maxlen=5)
for page in ["home", "about", "contact", "blog", "shop", "cart"]:
    history.appendleft(page)
print(list(history))  # ['cart', 'shop', 'blog', 'contact', 'about']`,
  },
  {
    name: "collections.deque.extend(iterable)",
    description:
      "Расширяет правый конец очереди, добавляя все элементы iterable поочерёдно. Эквивалентно вызову append() для каждого элемента. Если deque имеет maxlen, лишние элементы вытесняются с левого конца.",
    syntax: "deque.extend(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект, элементы которого добавляются в правый конец очереди",
      },
    ],
    example: `from collections import deque

d = deque([1, 2, 3])
d.extend([4, 5, 6])
print(d)  # deque([1, 2, 3, 4, 5, 6])

# С maxlen
d = deque([1, 2, 3], maxlen=4)
d.extend([4, 5])
print(d)  # deque([2, 3, 4, 5]) — 1 вытеснен при добавлении 4, 2 вытеснен при добавлении 5

# Добавление строки — по символу
d = deque()
d.extend("abc")
print(d)  # deque(['a', 'b', 'c'])`,
  },
  {
    name: "collections.deque.extendleft(iterable)",
    description: `Расширяет левый конец очереди, добавляя элементы iterable поочерёдно слева. Обратите внимание: так как каждый элемент добавляется в начало, итоговый порядок элементов будет обратным по сравнению с исходным iterable.

Эквивалентно вызову appendleft() для каждого элемента по порядку:
extendleft([1, 2, 3]) → appendleft(1), appendleft(2), appendleft(3)
Результат: deque([3, 2, 1, ...])`,
    syntax: "deque.extendleft(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект. Элементы добавляются в левый конец по одному — итоговый порядок обратный",
      },
    ],
    example: `from collections import deque

d = deque([4, 5, 6])
d.extendleft([1, 2, 3])
print(d)  # deque([3, 2, 1, 4, 5, 6]) — обратный порядок!

# Чтобы сохранить исходный порядок — перевернуть iterable
d = deque([4, 5, 6])
d.extendleft(reversed([1, 2, 3]))
print(d)  # deque([1, 2, 3, 4, 5, 6])

# Практическое применение: добавить приоритетные элементы в начало
queue = deque(["task3", "task4"])
priority_tasks = ["task1", "task2"]
queue.extendleft(reversed(priority_tasks))
print(queue)  # deque(['task1', 'task2', 'task3', 'task4'])`,
  },
  {
    name: "collections.deque.pop()",
    description:
      "Удаляет и возвращает элемент из правого конца (конца) очереди. Выполняется за O(1). Если очередь пуста, вызывает IndexError.",
    syntax: "deque.pop()",
    arguments: [],
    example: `from collections import deque

d = deque([1, 2, 3, 4])
print(d.pop())  # 4
print(d)        # deque([1, 2, 3])

# Использование как стек (LIFO)
stack = deque()
stack.append("first")
stack.append("second")
stack.append("third")
print(stack.pop())  # "third"
print(stack.pop())  # "second"
print(stack.pop())  # "first"
# stack.pop()      # IndexError — стек пуст

# Защита от ошибки
d = deque()
try:
    d.pop()
except IndexError:
    print("Очередь пуста")`,
  },
  {
    name: "collections.deque.popleft()",
    description:
      "Удаляет и возвращает элемент из левого конца (начала) очереди. Выполняется за O(1) — в отличие от list.pop(0), которая занимает O(n). Если очередь пуста, вызывает IndexError.",
    syntax: "deque.popleft()",
    arguments: [],
    example: `from collections import deque

d = deque([1, 2, 3, 4])
print(d.popleft())  # 1
print(d)            # deque([2, 3, 4])

# Использование как очередь (FIFO)
queue = deque()
queue.append("клиент 1")
queue.append("клиент 2")
queue.append("клиент 3")

print(queue.popleft())  # "клиент 1" — первый пришёл, первый ушёл
print(queue.popleft())  # "клиент 2"

# BFS — обход в ширину
graph = {1: [2, 3], 2: [4], 3: [4, 5], 4: [], 5: []}
queue = deque([1])
visited = {1}
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
print(order)  # [1, 2, 3, 4, 5]`,
  },
  {
    name: "collections.deque.rotate(n=1)",
    description: `Поворачивает очередь на n шагов вправо. При n > 0 — элементы перемещаются с правого конца на левый. При n < 0 — с левого на правый.

deque.rotate(1) эквивалентно: deque.appendleft(deque.pop())
deque.rotate(-1) эквивалентно: deque.append(deque.popleft())

Применение:
- Реализация «кольцевого буфера» (circular buffer)
- Циклический сдвиг последовательности
- Шифр Цезаря и другие ротационные алгоритмы
- Симуляция «карусели» (round-robin) без бесконечного цикла`,
    syntax: "deque.rotate(n=1)",
    arguments: [
      {
        name: "n",
        description:
          "Количество шагов поворота. Положительное — вправо (с правого конца на левый). Отрицательное — влево (с левого конца на правый). По умолчанию 1",
      },
    ],
    example: `from collections import deque

d = deque([1, 2, 3, 4, 5])

d.rotate(1)   # поворот вправо на 1
print(d)      # deque([5, 1, 2, 3, 4])

d.rotate(-1)  # поворот влево на 1
print(d)      # deque([1, 2, 3, 4, 5]) — вернулись к исходному

d.rotate(2)
print(d)      # deque([4, 5, 1, 2, 3])

# Шифр Цезаря
alphabet = deque("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
alphabet.rotate(-3)  # сдвиг на 3
table = str.maketrans("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "".join(alphabet))
print("HELLO".translate(table))  # EBIIL

# Переход хода в игре (round-robin)
players = deque(["Алиса", "Боб", "Карл"])
for turn in range(6):
    current = players[0]
    print(f"Ход {turn + 1}: {current}")
    players.rotate(-1)  # передать ход следующему`,
  },
  {
    name: "collections.OrderedDict()",
    description: `Подкласс dict из модуля collections, гарантирующий сохранение порядка вставки ключей. Начиная с Python 3.7, обычный dict тоже сохраняет порядок вставки, однако OrderedDict предоставляет дополнительные возможности и семантику.

Ключевые отличия от обычного dict:
- Имеет методы move_to_end() и popitem(last=...) для управления порядком
- Сравнение учитывает порядок: OrderedDict([('a', 1), ('b', 2)]) ≠ OrderedDict([('b', 2), ('a', 1)])
- Явно выражает намерение: «порядок важен»

Когда использовать OrderedDict вместо dict:
- Когда порядок элементов является частью бизнес-логики
- Когда нужен метод move_to_end() или специальное поведение popitem()
- Для совместимости с Python < 3.7
- Когда важна семантика — код явно говорит о значимости порядка`,
    syntax: "collections.OrderedDict()",
    arguments: [],
    example: `from collections import OrderedDict

# Создание
od = OrderedDict()
od["banana"] = 3
od["apple"] = 1
od["cherry"] = 2
print(list(od.keys()))  # ['banana', 'apple', 'cherry'] — порядок сохранён

# Сравнение учитывает порядок
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)   # False — разный порядок!

# Обычные словари не учитывают порядок при сравнении
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)     # True

# LRU-кэш вручную
class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
    def get(self, key):
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return -1
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
  },
  {
    name: "collections.OrderedDict.move_to_end(key[, last=True])",
    description: `Перемещает существующий ключ в конец (или начало) OrderedDict. Если ключ не существует — вызывает KeyError.

Параметр last:
- True (по умолчанию) — перемещает ключ в конец (правый конец)
- False — перемещает ключ в начало (левый конец)

Метод работает за O(1).

Основное применение — реализация LRU-кэша (Least Recently Used): при обращении к элементу он перемещается в конец, а «устаревшие» (давно не используемые) элементы остаются в начале и вытесняются первыми.`,
    syntax: "ordered_dict.move_to_end(key, last=True)",
    arguments: [
      {
        name: "key",
        description:
          "Ключ, который нужно переместить. Должен существовать в словаре",
      },
      {
        name: "last",
        description:
          "Если True (по умолчанию) — перемещает в конец. Если False — перемещает в начало",
      },
    ],
    example: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])
print(list(od.keys()))  # ['a', 'b', 'c']

# Переместить "a" в конец
od.move_to_end("a")
print(list(od.keys()))  # ['b', 'c', 'a']

# Переместить "a" в начало
od.move_to_end("a", last=False)
print(list(od.keys()))  # ['a', 'b', 'c']

# LRU-кэш: при обращении — перемещаем в конец
cache = OrderedDict()
cache["page1"] = "<html>...</html>"
cache["page2"] = "<html>...</html>"
cache["page3"] = "<html>...</html>"

# Обращаемся к page1 — она «свежая», перемещаем в конец
cache.move_to_end("page1")
print(list(cache.keys()))  # ['page2', 'page3', 'page1']
# При вытеснении удалим первый элемент (page2) — он «устаревший»`,
  },
  {
    name: "collections.OrderedDict.popitem(last=True)",
    description: `Удаляет и возвращает пару (ключ, значение) из OrderedDict. В отличие от dict.popitem() (возвращает произвольную пару), OrderedDict.popitem() уважает порядок.

Параметр last:
- True (по умолчанию) — удаляет последний добавленный элемент (LIFO, как стек)
- False — удаляет первый добавленный элемент (FIFO, как очередь)

Если словарь пуст — вызывает KeyError.

Применение:
- LRU-кэш: popitem(last=False) удаляет давно не используемый элемент
- LIFO/FIFO обработка словарей
- Поочерёдное извлечение элементов в порядке добавления`,
    syntax: "ordered_dict.popitem(last=True)",
    arguments: [
      {
        name: "last",
        description:
          "Если True (по умолчанию) — удаляет последний элемент (LIFO). Если False — удаляет первый элемент (FIFO)",
      },
    ],
    example: `from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

# last=True (по умолчанию) — удалить последний
print(od.popitem())         # ('c', 3)
print(list(od.keys()))      # ['a', 'b']

# last=False — удалить первый
print(od.popitem(last=False))  # ('a', 1)
print(list(od.keys()))         # ['b']

# LRU-кэш: вытеснить «самый старый» элемент
cache = OrderedDict()
capacity = 3
for key, value in [("x", 1), ("y", 2), ("z", 3), ("w", 4)]:
    cache[key] = value
    if len(cache) > capacity:
        removed = cache.popitem(last=False)  # удалить самый старый
        print(f"Вытеснен: {removed}")
# Вытеснен: ('x', 1)
print(list(cache.keys()))  # ['y', 'z', 'w']`,
  },
  {
    name: "copy.copy(x)",
    description: `Создаёт поверхностную (shallow) копию объекта x из модуля copy. Поверхностная копия создаёт новый объект верхнего уровня, но вложенные объекты (элементы списка, значения словаря и т.д.) не копируются — они разделяются между оригиналом и копией.

Поведение поверхностной копии:
- Новый объект создаётся для верхнего уровня (изменения в нём не влияют на оригинал)
- Вложенные объекты — те же самые ссылки (изменение вложенного объекта влияет на оригинал!)

copy.copy() эквивалентно:
- Для списка: list[:]  или list(lst)
- Для словаря: dict.copy()
- Для множества: set.copy()

Для полного независимого копирования вложенных структур используйте copy.deepcopy().`,
    syntax: "copy.copy(x)",
    arguments: [
      {
        name: "x",
        description: "Объект, поверхностную копию которого нужно создать",
      },
    ],
    example: `import copy

# Список — поверхностная копия
original = [1, [2, 3], [4, 5]]
shallow = copy.copy(original)

shallow.append(99)        # изменяем верхний уровень копии
print(original)           # [1, [2, 3], [4, 5]] — оригинал не тронут

shallow[1].append(999)    # изменяем вложенный список
print(original)           # [1, [2, 3, 999], [4, 5]] — оригинал изменён!

# Словарь — поверхностная копия
d = {"a": [1, 2], "b": [3, 4]}
d_copy = copy.copy(d)

d_copy["c"] = [5, 6]      # новый ключ только в копии
print("c" in d)            # False

d_copy["a"].append(99)    # изменение вложенного списка
print(d["a"])              # [1, 2, 99] — оригинал изменён!

# Когда поверхностная копия достаточна
numbers = [1, 2, 3, 4, 5]  # плоский список без вложений
nums_copy = copy.copy(numbers)
nums_copy[0] = 99
print(numbers[0])  # 1 — безопасно, нет вложенных объектов`,
  },
  {
    name: "copy.deepcopy(x[, memo])",
    description: `Создаёт глубокую (deep) копию объекта x из модуля copy. Глубокая копия рекурсивно копирует все вложенные объекты — оригинал и копия полностью независимы.

Отличие от copy.copy():
- copy.copy() — копирует только верхний уровень, вложенные объекты разделяются
- copy.deepcopy() — копирует всё рекурсивно, полная независимость

Параметр memo:
- Словарь для хранения уже скопированных объектов (id → копия)
- Используется внутри рекурсии для обработки циклических ссылок
- Обычно не нужен при прямом вызове

Объекты могут управлять поведением deep copy через методы __copy__() и __deepcopy__().

Предупреждение: deepcopy может быть медленным для больших или сложных структур. Если производительность критична — рассмотрите альтернативы (json сериализация, ручное копирование).`,
    syntax: "copy.deepcopy(x[, memo])",
    arguments: [
      {
        name: "x",
        description: "Объект, глубокую копию которого нужно создать",
      },
      {
        name: "memo",
        description:
          "Необязательный. Словарь уже скопированных объектов для обработки циклических ссылок",
      },
    ],
    example: `import copy

# Глубокая копия — полная независимость
original = [1, [2, 3], {"a": [4, 5]}]
deep = copy.deepcopy(original)

deep[1].append(999)
deep[2]["a"].append(999)

print(original)  # [1, [2, 3], {'a': [4, 5]}] — не изменён!
print(deep)      # [1, [2, 3, 999], {'a': [4, 5, 999]}]

# Класс с вложенными объектами
class Config:
    def __init__(self, settings):
        self.settings = settings

config1 = Config({"debug": True, "ports": [8000, 8080]})
config2 = copy.deepcopy(config1)

config2.settings["debug"] = False
config2.settings["ports"].append(9000)

print(config1.settings)  # {'debug': True, 'ports': [8000, 8080]} — не изменён!
print(config2.settings)  # {'debug': False, 'ports': [8000, 8080, 9000]}

# Циклические ссылки — deepcopy обрабатывает корректно
a = [1, 2]
a.append(a)        # a содержит ссылку на себя!
b = copy.deepcopy(a)
print(b[0])        # 1
print(b[2] is b)   # True — цикличность сохранена, но в копии`,
  },
  {
    name: "delattr(object, name)",
    description: `Удаляет именованный атрибут у объекта. Является динамическим эквивалентом оператора del. delattr(obj, 'x') полностью эквивалентно del obj.x.

Функция вызывает AttributeError, если атрибут не существует или не может быть удалён. Важно понимать, что delattr() работает с экземплярами, а не с самим классом — то есть удаляет атрибут именно у конкретного объекта.

При попытке удалить атрибут у объекта, у которого он определён на уровне класса (а не у экземпляра), Python удалит атрибут экземпляра (если он существует), открыв доступ к атрибуту класса.

Если класс реализует __delattr__(self, name), именно этот метод будет вызван при delattr().

Парные функции: getattr() — получить атрибут, setattr() — установить атрибут, hasattr() — проверить наличие атрибута.`,
    syntax: "delattr(object, name)",
    arguments: [
      {
        name: "object",
        description: "Объект, у которого нужно удалить атрибут",
      },
      {
        name: "name",
        description: "Строка с именем атрибута, который нужно удалить",
      },
    ],
    example: `class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Person("Alice", 30)
print(p.age)        # 30

delattr(p, "age")   # Удаляем атрибут age у экземпляра

# print(p.age)      # AttributeError: 'Person' object has no attribute 'age'

# Эквивалентная запись:
del p.name          # то же самое, что delattr(p, "name")

# Пример с __delattr__
class Protected:
    def __delattr__(self, name):
        if name == "id":
            raise AttributeError("Нельзя удалить атрибут 'id'")
        super().__delattr__(name)

obj = Protected()
obj.id = 42
# delattr(obj, "id")  # AttributeError: Нельзя удалить атрибут 'id'`,
  },
  {
    name: "dict([mapping or iterable])",
    description: `Создаёт новый словарь (объект типа dict). Словари — это изменяемые отображения, хранящие пары ключ-значение. Ключи должны быть хэшируемыми (неизменяемыми).

Функцию dict() можно вызвать несколькими способами:
- Без аргументов: создаёт пустой словарь {}
- Из другого словаря или маппинга: копирует пары ключ-значение
- Из итерируемого объекта пар (итерируемых объектов длиной 2): dict([('a', 1), ('b', 2)])
- Через именованные аргументы: dict(a=1, b=2)
- Комбинацией маппинга и именованных аргументов

Словари в Python 3.7+ гарантируют сохранение порядка вставки (insertion order). Операции O(1) для получения, добавления, обновления и удаления элементов.

Подробнее о методах словарей: .keys(), .values(), .items(), .get(), .update(), .pop(), .setdefault() и т.д.`,
    syntax: "dict(**kwargs)\ndict(mapping, **kwargs)\ndict(iterable, **kwargs)",
    arguments: [
      {
        name: "**kwargs",
        description:
          "Именованные аргументы, становящиеся ключами и значениями словаря",
      },
      {
        name: "mapping",
        description:
          "Другой словарь или объект-маппинг, из которого копируются пары ключ-значение",
      },
      {
        name: "iterable",
        description:
          "Итерируемый объект из пар (ключ, значение) — например, список кортежей",
      },
    ],
    example: `dict()                        # {}
dict(a=1, b=2, c=3)           # {'a': 1, 'b': 2, 'c': 3}
dict([('x', 10), ('y', 20)])  # {'x': 10, 'y': 20}
dict(zip(['a','b'], [1, 2]))  # {'a': 1, 'b': 2}

d1 = {'name': 'Alice', 'age': 30}
d2 = dict(d1)          # копия словаря
d2['age'] = 25
print(d1['age'])        # 30 (оригинал не изменён)

# Словарное включение (dict comprehension)
squares = {x: x**2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}`,
  },
  {
    name: "dir([object])",
    description: `Возвращает список имён в текущей локальной области видимости или список атрибутов объекта.

Без аргументов dir() возвращает имена всех имён, определённых в текущей области видимости (локальной области).

С аргументом поведение зависит от типа объекта:
- Для обычного объекта — возвращает список его атрибутов и методов, включая унаследованные
- Для модуля — возвращает список его атрибутов
- Для типа/класса — возвращает список атрибутов класса и всех его базовых классов (в порядке MRO)

Список отсортирован в алфавитном порядке. Если объект реализует метод __dir__(), именно его результат будет возвращён (после преобразования в список и сортировки).

Функция полезна для интерактивного исследования объектов в REPL, для документирования API, а также при реализации автодополнения.

Важно: dir() предназначен для удобного использования в интерактивном режиме. Он не гарантирует полноты — вывод зависит от реализации __dir__() или __dict__.`,
    syntax: "dir([object])",
    arguments: [
      {
        name: "object",
        description:
          "Необязательный. Объект, атрибуты которого нужно перечислить. Если не указан — возвращает имена в текущей области видимости",
      },
    ],
    example: `# Без аргументов — имена в текущей области
x = 10
y = "hello"
print(dir())   # [..., 'x', 'y']

# Для встроенного типа
print(dir([]))
# ['append', 'clear', 'copy', 'count', 'extend',
#  'index', 'insert', 'pop', 'remove', 'reverse', 'sort', ...]

# Для пользовательского класса
class Dog:
    def __init__(self, name):
        self.name = name
    def bark(self):
        return "Woof!"

d = Dog("Rex")
print([attr for attr in dir(d) if not attr.startswith('__')])
# ['bark', 'name']

# Для модуля
import os
print(dir(os))  # все атрибуты модуля os`,
  },
  {
    name: "divmod(a, b)",
    description: `Принимает два числа и возвращает пару (кортеж) из их частного и остатка от деления. Для целых чисел результат тот же, что и (a // b, a % b).

Функция работает как с целыми числами, так и с числами с плавающей точкой:
- Для целых чисел: возвращает (q, r), где a == b * q + r и 0 <= r < abs(b)
- Для чисел с плавающей точкой: возвращает (q, r), где q — это math.floor(a / b)

Важные свойства:
- Если b == 0, возникает ZeroDivisionError
- Знак остатка всегда совпадает со знаком делителя b (не делимого a)
- Для float-чисел q — это всегда целое число, но имеет тип float

Функция удобна при работе с временными интервалами (часы/минуты), денежными суммами (рубли/копейки), при реализации алгоритмов с делением с остатком (алгоритм Евклида, НОД) и т.д.`,
    syntax: "divmod(a, b)",
    arguments: [
      { name: "a", description: "Делимое — целое или вещественное число" },
      {
        name: "b",
        description: "Делитель — целое или вещественное число (не ноль)",
      },
    ],
    example: `divmod(10, 3)     # (3, 1)   — 10 = 3*3 + 1
divmod(7, 2)      # (3, 1)
divmod(-7, 2)     # (-4, 1)  — остаток положительный (знак делителя)
divmod(7, -2)     # (-4, -1) — остаток отрицательный (знак делителя)
divmod(8.5, 2.5)  # (3.0, 1.0)

# Практический пример: перевод секунд
total_seconds = 3725
minutes, seconds = divmod(total_seconds, 60)
hours, minutes = divmod(minutes, 60)
print(f"{hours}ч {minutes}м {seconds}с")  # 1ч 2м 5с

# Алгоритм Евклида через divmod
def gcd(a, b):
    while b:
        a, b = b, divmod(a, b)[1]
    return a
print(gcd(48, 18))  # 6`,
  },
  {
    name: "enumerate(iterable[, start])",
    description: `Возвращает объект-перечислитель (enumerate object), который при итерации выдаёт кортежи вида (индекс, элемент).

Очень часто при обходе итерируемого объекта нужно знать как сам элемент, так и его позицию. Вместо ручного счётчика enumerate() делает код чище и идиоматичнее.

Параметр start (по умолчанию 0) задаёт начальное значение счётчика. Это полезно, если нумерация должна начинаться с 1 или с любого другого числа.

enumerate() возвращает ленивый итератор — элементы вычисляются по мере обхода, что эффективно по памяти для больших последовательностей.

Объект enumerate поддерживает протокол итератора: next() и iter(). Его можно передать в list() для получения списка кортежей, или распаковать в цикле.`,
    syntax: "enumerate(iterable, start=0)",
    arguments: [
      {
        name: "iterable",
        description:
          "Любой итерируемый объект: список, строка, кортеж, генератор и т.д.",
      },
      {
        name: "start",
        description:
          "Необязательный. Начальное значение счётчика. По умолчанию 0",
      },
    ],
    example: `fruits = ['apple', 'banana', 'cherry']

# Базовое использование
for i, fruit in enumerate(fruits):
    print(i, fruit)
# 0 apple
# 1 banana
# 2 cherry

# Нумерация с 1
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}. {fruit}")
# 1. apple
# 2. banana
# 3. cherry

# Получить список кортежей
list(enumerate(['a', 'b', 'c']))
# [(0, 'a'), (1, 'b'), (2, 'c')]

# Найти позиции всех вхождений элемента
text = "abracadabra"
positions = [i for i, ch in enumerate(text) if ch == 'a']
print(positions)  # [0, 3, 5, 7, 10]`,
  },
  {
    name: "eval(expression[, globals[, locals]])",
    description: `Выполняет строку с Python-выражением и возвращает результат его вычисления. Выражение разбирается и вычисляется в контексте переданных словарей globals и locals.

Важные детали:
- eval() принимает только одно выражение, а не операторы. Для выполнения операторов (присваивания, циклов и т.д.) используйте exec()
- Если globals не указан, используется текущий __globals__ вызывающего кода
- Если locals не указан, используется текущий locals()
- Если передан только globals, он используется и как locals

Безопасность: eval() с непроверенным вводом от пользователя крайне опасен! Он может выполнить произвольный код. Для безопасного разбора данных используйте ast.literal_eval(), который поддерживает только литералы Python (числа, строки, списки, словари, кортежи, множества, None, True, False).

Аргумент expression может также быть объектом кода, возвращённым compile() в режиме "eval".`,
    syntax: "eval(expression[, globals[, locals]])",
    arguments: [
      {
        name: "expression",
        description:
          'Строка с Python-выражением или объект кода (compile() с режимом "eval")',
      },
      {
        name: "globals",
        description:
          "Необязательный. Словарь, используемый как глобальное пространство имён. Если не указан — используется текущее",
      },
      {
        name: "locals",
        description:
          "Необязательный. Словарь, используемый как локальное пространство имён. Если не указан — используется текущее",
      },
    ],
    example: `eval("2 + 2")                    # 4
eval("len('hello')")             # 5
eval("[x**2 for x in range(5)]") # [0, 1, 4, 9, 16]

# С собственным пространством имён
x = 10
eval("x * 3")                    # 30

# Ограниченное пространство имён
safe_ns = {"__builtins__": {}, "x": 5, "y": 3}
eval("x + y", safe_ns)           # 8

# Безопасный разбор данных
import ast
ast.literal_eval("[1, 2, 3]")    # [1, 2, 3]  — безопасно
ast.literal_eval("{'a': 1}")     # {'a': 1}   — безопасно
# ast.literal_eval("__import__('os').system('ls')")  # ValueError — защита`,
  },
  {
    name: "exec(object[, globals[, locals]])",
    description: `Динамически выполняет Python-код. В отличие от eval(), который поддерживает только выражения, exec() принимает произвольный блок кода: операторы, функции, классы, циклы, присваивания и т.д.

Аргумент object может быть:
- Строкой с Python-кодом
- Объектом bytes или bytearray с исходным кодом
- Объектом кода, созданным compile()

Если globals и locals не переданы, код выполняется в текущем пространстве имён. Если передан только globals — он используется и как locals. Оба должны быть словарями (locals также может быть маппингом).

Важно: exec() всегда возвращает None. Переменные, определённые внутри exec(), по умолчанию не доступны в вызывающем коде, если не использовать явную передачу словаря.

Безопасность: как и eval(), exec() с пользовательским вводом крайне опасен. Выполняйте только доверенный код. Никогда не передавайте пользовательский ввод без проверки.`,
    syntax: "exec(object[, globals[, locals]])",
    arguments: [
      {
        name: "object",
        description:
          "Строка с Python-кодом, байтовая строка или объект кода (compile())",
      },
      {
        name: "globals",
        description:
          "Необязательный. Словарь глобальных переменных. Если не указан — текущее глобальное пространство",
      },
      {
        name: "locals",
        description:
          "Необязательный. Словарь локальных переменных. Если не указан — используется globals",
      },
    ],
    example: `# Выполнение простого кода
exec("x = 5\nprint(x * 2)")  # 10

# Выполнение функции
exec("""
def greet(name):
    return f"Hello, {name}!"
print(greet("Alice"))
""")
# Hello, Alice!

# С собственным пространством имён
namespace = {}
exec("result = sum(range(10))", namespace)
print(namespace['result'])  # 45

# Динамическое создание класса
exec("""
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return f"{self.name} говорит: ..."
""", globals())

dog = Animal("Rex")
print(dog.speak())  # Rex говорит: ...`,
  },
  {
    name: "filter(function, iterable)",
    description: `Создаёт итератор из элементов iterable, для которых function возвращает True. Функция filter() реализует паттерн "фильтрация" в функциональном стиле.

Особенности:
- Если function равна None, удаляются все "ложные" (falsy) значения: 0, None, "", [], {}, False и т.д. — аналог if element
- Возвращает объект-итератор, а не список. Для получения списка нужно передать в list()
- Ленивое вычисление: элементы проверяются по мере итерации, что экономит память
- Эквивалент filter(f, iterable) — это (x for x in iterable if f(x))

Сравнение с list comprehension:
- filter() часто читается хуже, чем list comprehension с условием
- filter() выигрывает, когда функция уже определена и её нужно просто применить
- filter() возвращает итератор, а не список — это эффективнее по памяти для больших данных

Комбинируется с map() и functools.reduce() для обработки данных в функциональном стиле.`,
    syntax: "filter(function, iterable)",
    arguments: [
      {
        name: "function",
        description:
          "Функция-предикат, возвращающая True/False для каждого элемента. Если None — фильтрует ложные значения",
      },
      {
        name: "iterable",
        description:
          "Итерируемый объект, элементы которого будут проверяться функцией",
      },
    ],
    example: `# Фильтрация чётных чисел
numbers = [1, 2, 3, 4, 5, 6, 7, 8]
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)   # [2, 4, 6, 8]

# Удаление ложных значений (function=None)
mixed = [0, 1, "", "hello", None, 42, [], [1,2]]
truthy = list(filter(None, mixed))
print(truthy)  # [1, 'hello', 42, [1, 2]]

# Фильтрация строк
words = ["apple", "banana", "apricot", "cherry"]
a_words = list(filter(lambda w: w.startswith('a'), words))
print(a_words)  # ['apple', 'apricot']

# Именованная функция
def is_adult(age):
    return age >= 18

ages = [12, 18, 25, 15, 30]
adults = list(filter(is_adult, ages))
print(adults)   # [18, 25, 30]`,
  },
  {
    name: "float([x])",
    description: `Создаёт число с плавающей точкой (тип float) из числа или строки.

Допустимые строковые форматы:
- Десятичное число: "3.14", "-2.5", "+1.0"
- Экспоненциальная запись: "1.5e10", "2.3E-4"
- Специальные значения: "inf", "-inf", "nan", "infinity" (без учёта регистра)
- Начальные и конечные пробелы игнорируются

Если x не указан, возвращает 0.0. Если строка не может быть разобрана, возникает ValueError.

Тип float в Python реализует IEEE 754 с двойной точностью (64-бит), что даёт около 15-17 значимых десятичных цифр. Из-за особенностей двоичного представления некоторые числа не могут быть представлены точно (0.1 + 0.2 != 0.3).

Для высокоточных вычислений используйте модуль decimal. Для работы с дробями — модуль fractions.`,
    syntax: "float([x=0.0])",
    arguments: [
      {
        name: "x",
        description:
          "Необязательный. Число (int, float) или строка для преобразования. По умолчанию 0.0",
      },
    ],
    example: `float()           # 0.0
float(5)          # 5.0
float(-3)         # -3.0
float("3.14")     # 3.14
float("1.5e10")   # 15000000000.0
float("  -2.7 ")  # -2.7 (пробелы игнорируются)
float("inf")      # inf
float("-Infinity") # -inf
float("nan")      # nan

# Особенности точности float
0.1 + 0.2         # 0.30000000000000004
round(0.1 + 0.2, 1)  # 0.3

# Проверка специальных значений
import math
math.isinf(float("inf"))  # True
math.isnan(float("nan"))  # True`,
  },
  {
    name: "format(value[, format_spec])",
    description: `Форматирует значение согласно строке формата format_spec. Это низкоуровневая функция, на которой основаны f-строки и метод str.format().

Функция вызывает метод __format__(format_spec) объекта value. Если format_spec не указан, используется пустая строка "" — что эквивалентно str(value) для большинства типов.

Мини-язык форматирования (Format Specification Mini-Language):
- [[fill]align][sign][z][#][0][width][grouping_option][.precision][type]

Типы форматирования:
- d — целое десятичное
- b — двоичное, o — восьмеричное, x/X — шестнадцатеричное
- f/F — число с фиксированной точкой
- e/E — экспоненциальная нотация
- g/G — краткая форма (f или e)
- s — строка
- % — процент (умножает на 100, добавляет %)

Выравнивание: < (влево), > (вправо), ^ (по центру), = (заполнение после знака).`,
    syntax: "format(value[, format_spec])",
    arguments: [
      {
        name: "value",
        description:
          "Значение для форматирования — любой объект, реализующий __format__()",
      },
      {
        name: "format_spec",
        description:
          'Необязательный. Строка формата по мини-языку форматирования Python. По умолчанию ""',
      },
    ],
    example: `format(42)           # '42'
format(3.14159, '.2f') # '3.14'
format(1000000, ',')   # '1,000,000'
format(0.1234, '.1%')  # '12.3%'
format(42, 'b')        # '101010'  (двоичное)
format(255, 'x')       # 'ff'      (шестнадцатеричное)
format(255, '#x')      # '0xff'    (с префиксом)
format(3.14, 'e')      # '3.140000e+00'
format(42, '010d')     # '0000000042'  (с нулями)
format('hi', '>10')    # '        hi'  (выравнивание вправо)
format('hi', '^10')    # '    hi    '  (по центру)
format('hi', '*^10')   # '****hi****'  (заполнитель *)`,
  },
  {
    name: "frozenset([iterable])",
    description: `Создаёт неизменяемое множество (frozenset) — неупорядоченную коллекцию уникальных элементов, которую нельзя изменить после создания.

Ключевые отличия от set:
- frozenset неизменяем: нет методов add(), remove(), discard(), pop(), clear(), update() и т.д.
- frozenset является хэшируемым — его можно использовать как ключ словаря или элемент другого множества
- set и frozenset разделяют все операции только для чтения: in, len(), union(), intersection(), difference() и т.д.

Все элементы frozenset должны быть хэшируемыми (неизменяемыми). Строки, числа, кортежи (без изменяемых элементов) — хэшируемы. Списки, словари, set — нет.

Применения:
- Ключи словарей: frozenset можно использовать как словарный ключ, в отличие от set
- Элементы множеств: frozenset можно добавить в другое множество
- Константные наборы данных: когда нужна защита от случайного изменения`,
    syntax: "frozenset([iterable])",
    arguments: [
      {
        name: "iterable",
        description:
          "Необязательный. Итерируемый объект, элементы которого станут элементами frozenset. Если не указан — создаётся пустое frozenset",
      },
    ],
    example: `frozenset()              # frozenset()
frozenset([1, 2, 3])     # frozenset({1, 2, 3})
frozenset("hello")       # frozenset({'h', 'e', 'l', 'o'})
frozenset({1, 2, 3, 2})  # frozenset({1, 2, 3}) — дубли удаляются

fs = frozenset([1, 2, 3])
2 in fs                  # True
len(fs)                  # 3

# Использование как ключ словаря (set не может!)
cache = {frozenset([1, 2]): "value"}
print(cache[frozenset([2, 1])])  # "value" (порядок не важен)

# Использование как элемент множества
permissions = {frozenset(['read', 'write']), frozenset(['read'])}

# Операции над множествами
a = frozenset([1, 2, 3])
b = frozenset([2, 3, 4])
a | b   # frozenset({1, 2, 3, 4})
a & b   # frozenset({2, 3})`,
  },
  {
    name: "functools.lru_cache(maxsize=128, typed=False)",
    description: `Декоратор из модуля functools, реализующий кэширование результатов функции по алгоритму LRU (Least Recently Used — «вытеснение давно неиспользуемых»).

Когда кэшированная функция вызывается с теми же аргументами, результат берётся из кэша без повторного вычисления. Это позволяет значительно ускорить рекурсивные вычисления, частые запросы к базам данных или тяжёлые вычисления с повторяющимися входными данными.

Параметр maxsize:
- Если maxsize=None — кэш неограничен (отключает LRU, работает быстрее)
- Если maxsize — степень двойки, алгоритм работает наиболее эффективно
- При достижении лимита вытесняется давно не использовавшийся элемент

Параметр typed:
- Если True — аргументы разных типов кэшируются отдельно (например, f(3) и f(3.0) — разные ключи)

Все аргументы функции должны быть хэшируемыми (нельзя передавать списки, словари).

Доступ к статистике кэша — через атрибут .cache_info() (hits, misses, maxsize, currsize). Очистка кэша — .cache_clear().

Начиная с Python 3.9, можно использовать @cache вместо @lru_cache(maxsize=None).`,
    syntax:
      "@functools.lru_cache(maxsize=128, typed=False)\ndef func(...): ...",
    arguments: [
      {
        name: "maxsize",
        description:
          "Максимальное количество сохраняемых результатов. None — кэш без ограничений. По умолчанию 128",
      },
      {
        name: "typed",
        description:
          "Если True — аргументы разных типов хранятся отдельно. По умолчанию False",
      },
    ],
    example: `import functools

@functools.lru_cache(maxsize=None)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(50))  # 12586269025 — быстро благодаря кэшу

print(fibonacci.cache_info())
# CacheInfo(hits=48, misses=51, maxsize=None, currsize=51)

fibonacci.cache_clear()  # очистить кэш

# Кэш с ограничением
@functools.lru_cache(maxsize=4)
def slow_square(n):
    return n * n

slow_square(1)  # вычисляется
slow_square(2)  # вычисляется
slow_square(1)  # из кэша`,
  },
  {
    name: "functools.partial(func, /, *args, **keywords)",
    description: `Создаёт новый объект partial — частично применённую функцию с зафиксированными аргументами. Возвращает вызываемый объект, ведущий себя как func с предустановленными позиционными и именованными аргументами.

Когда partial-объект вызывается, переданные args добавляются в начало к аргументам вызова, а keywords объединяются с переданными именованными аргументами. Это позволяет адаптировать функции с несколькими параметрами под интерфейсы, ожидающие функцию с меньшим числом аргументов.

Атрибуты partial-объекта:
- .func — исходная функция
- .args — зафиксированные позиционные аргументы
- .keywords — зафиксированные именованные аргументы

Применение:
- Адаптация функций для map(), filter(), sorted()
- Создание специализированных версий общих функций
- Обратные вызовы в GUI, событийных системах

Альтернатива — lambda-функции. functools.partial предпочтительнее, когда нужно сохранить читаемость, возможность интроспекции и документирования.`,
    syntax: "functools.partial(func, /, *args, **keywords)",
    arguments: [
      {
        name: "func",
        description: "Исходная функция, которую нужно частично применить",
      },
      {
        name: "*args",
        description:
          "Позиционные аргументы, которые будут добавлены в начало при каждом вызове",
      },
      {
        name: "**keywords",
        description:
          "Именованные аргументы, которые будут переданы при каждом вызове",
      },
    ],
    example: `import functools

# Зафиксировать основание логарифма
import math
log2 = functools.partial(math.log, base=2)
print(log2(8))    # 3.0
print(log2(1024)) # 10.0

# Создать умножитель
double = functools.partial(lambda x, n: x * n, n=2)
triple = functools.partial(lambda x, n: x * n, n=3)
print(double(5))  # 10
print(triple(5))  # 15

# Использование с map
from functools import partial
add = lambda x, y: x + y
add5 = partial(add, 5)
result = list(map(add5, [1, 2, 3, 4]))
print(result)  # [6, 7, 8, 9]

# Интроспекция
print(add5.func)      # <function <lambda> ...>
print(add5.args)      # (5,)
print(add5.keywords)  # {}`,
  },
  {
    name: "functools.reduce(function, iterable[, initializer])",
    description: `Применяет функцию двух аргументов кумулятивно ко всем элементам итерируемого объекта, сворачивая его в одно значение. Находится в модуле functools (в Python 3 перенесена из встроенных).

Алгоритм работы:
1. Берёт первые два элемента, применяет function
2. Результат и следующий элемент снова передаёт в function
3. Продолжает до конца последовательности

С initializer:
- Если задан, он помещается перед элементами iterable
- Используется как начальное значение при пустом iterable
- Без initializer пустой iterable вызывает TypeError

Применение:
- Вычисление произведения всех элементов
- Поиск наибольшего/наименьшего элемента (хотя лучше max/min)
- Объединение структур (словарей, множеств) из списка
- Реализация факториала, суммы, конкатенации`,
    syntax: "functools.reduce(function, iterable[, initializer])",
    arguments: [
      {
        name: "function",
        description:
          "Функция двух аргументов: (накопленное_значение, текущий_элемент). Возвращает новое накопленное значение",
      },
      {
        name: "iterable",
        description:
          "Итерируемый объект, элементы которого последовательно обрабатываются",
      },
      {
        name: "initializer",
        description:
          "Необязательный. Начальное значение накопителя. Помещается перед элементами iterable",
      },
    ],
    example: `from functools import reduce

# Сумма элементов (аналог sum())
result = reduce(lambda acc, x: acc + x, [1, 2, 3, 4, 5])
print(result)  # 15

# Произведение всех элементов
product = reduce(lambda acc, x: acc * x, [1, 2, 3, 4, 5])
print(product)  # 120

# Факториал
factorial = reduce(lambda acc, x: acc * x, range(1, 6))
print(factorial)  # 120

# С initializer
result = reduce(lambda acc, x: acc + x, [], 0)
print(result)   # 0 — без initializer была бы ошибка

# Объединение словарей
dicts = [{"a": 1}, {"b": 2}, {"c": 3}]
merged = reduce(lambda d1, d2: {**d1, **d2}, dicts)
print(merged)   # {'a': 1, 'b': 2, 'c': 3}

# Поиск максимума
nums = [3, 7, 2, 9, 1]
max_val = reduce(lambda a, b: a if a > b else b, nums)
print(max_val)  # 9`,
  },
  {
    name: "functools.wraps(wrapped, assigned=..., updated=...)",
    description: `Удобный декоратор из модуля functools для обновления метаданных функции-обёртки (wrapper), чтобы она выглядела как оборачиваемая функция (wrapped).

При создании декоратора функция-обёртка заменяет оригинальную. Без @wraps атрибуты оборачиваемой функции (имя, docstring, аннотации, модуль) теряются — обёртка имеет собственные. @wraps копирует нужные атрибуты из оригинала.

По умолчанию копируются атрибуты (assigned):
- __module__
- __name__
- __qualname__
- __annotations__
- __doc__

По умолчанию обновляются атрибуты (updated):
- __dict__ — словарь атрибутов

Также добавляет __wrapped__ — ссылку на оригинальную функцию, позволяющую «заглянуть» под декоратор.

Без @wraps инструменты документирования (help(), sphinx), отладки и тестирования не смогут корректно определить имя и описание функции.`,
    syntax:
      "@functools.wraps(wrapped, assigned=WRAPPER_ASSIGNMENTS, updated=WRAPPER_UPDATES)",
    arguments: [
      {
        name: "wrapped",
        description:
          "Исходная функция, атрибуты которой нужно скопировать в обёртку",
      },
      {
        name: "assigned",
        description:
          "Необязательный. Кортеж атрибутов для копирования. По умолчанию: __module__, __name__, __qualname__, __annotations__, __doc__",
      },
      {
        name: "updated",
        description:
          "Необязательный. Кортеж атрибутов для обновления (через update). По умолчанию: __dict__",
      },
    ],
    example: `import functools

def my_decorator(func):
    @functools.wraps(func)   # копируем метаданные из func
    def wrapper(*args, **kwargs):
        print("До вызова")
        result = func(*args, **kwargs)
        print("После вызова")
        return result
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """Приветствует пользователя."""
    return f"Привет, {name}!"

print(greet.__name__)  # 'greet' (без @wraps было бы 'wrapper')
print(greet.__doc__)   # 'Приветствует пользователя.'
print(greet("Alice"))

# Доступ к оригиналу через __wrapped__
original = greet.__wrapped__
print(original("Bob"))  # без декоратора

# Без @wraps — потеря метаданных:
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def add(a, b):
    """Складывает два числа."""
    return a + b

print(add.__name__)  # 'wrapper' — неверно!
print(add.__doc__)   # None — потеряно!`,
  },
  {
    name: "getattr(object, name[, default])",
    description: `Возвращает значение именованного атрибута объекта. Является динамическим эквивалентом получения атрибута через точечную нотацию object.name.

getattr(obj, 'x') полностью эквивалентно obj.x — разница лишь в том, что имя атрибута передаётся как строка, что позволяет динамически определять имя атрибута во время выполнения.

Параметр default:
- Если атрибут не найден и default не указан, возникает AttributeError
- Если атрибут не найден и default указан, возвращается default
- Это делает getattr() безопасной альтернативой прямому доступу к атрибуту в случаях, когда атрибут может отсутствовать

Последовательность поиска атрибута: data descriptors класса → атрибуты экземпляра → non-data descriptors класса → __getattr__() (если определён).

Парные функции: setattr() — установить атрибут, delattr() — удалить, hasattr() — проверить наличие.`,
    syntax: "getattr(object, name[, default])",
    arguments: [
      {
        name: "object",
        description: "Объект, у которого нужно получить атрибут",
      },
      { name: "name", description: "Строка с именем атрибута" },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое если атрибут не найден. Если не указан — возбуждается AttributeError",
      },
    ],
    example: `class Circle:
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        import math
        return math.pi * self.radius ** 2

c = Circle(5)

getattr(c, 'radius')         # 5
getattr(c, 'color', 'red')   # 'red' (атрибута нет, возвращается default)
# getattr(c, 'color')        # AttributeError

# Динамический вызов метода
method_name = 'area'
result = getattr(c, method_name)()
print(result)  # 78.53981...

# Итерация по атрибутам
attrs = ['radius', 'diameter', 'area']
for attr in attrs:
    value = getattr(c, attr, 'не найдено')
    print(f"{attr}: {value}")`,
  },
  {
    name: "globals()",
    description: `Возвращает словарь, представляющий текущее глобальное пространство имён (символьную таблицу глобальных переменных). Для кода в модуле это словарь атрибутов модуля.

Важные особенности:
- globals() всегда возвращает словарь модуля, в котором определена функция — даже если функция вызывается из другого модуля
- Изменение словаря, возвращённого globals(), реально меняет глобальное пространство имён (это настоящий словарь, не копия)
- Словарь всегда содержит специальные ключи: __name__ (имя модуля), __doc__ (документация), __file__ (путь к файлу) и т.д.

Отличие от locals():
- globals() — глобальное пространство имён (уровень модуля), всегда словарь
- locals() — локальное пространство имён (внутри функции), не обязательно является "живым" словарём

Применения: динамическое добавление/изменение переменных, отладка, создание DSL-инструментов, плагинных систем.`,
    syntax: "globals()",
    arguments: [],
    example: `x = 10
y = 20

print(globals()['x'])   # 10
print(globals()['y'])   # 20

# Изменение глобального пространства через словарь
globals()['z'] = 30
print(z)                # 30 — переменная реально создана!

# Специальные ключи
print(globals()['__name__'])   # '__main__' (или имя модуля)

# Динамическое создание переменных (осторожно!)
for i in range(3):
    globals()[f'var_{i}'] = i * 10

print(var_0, var_1, var_2)  # 0 10 20

# Передача в eval/exec
my_globals = globals()
eval("x + y", my_globals)   # 30`,
  },
  {
    name: "hasattr(object, name)",
    description: `Проверяет, имеет ли объект атрибут с указанным именем. Возвращает True если атрибут существует, False если нет.

Реализация: hasattr(obj, name) фактически вызывает getattr(obj, name) и возвращает True, если это не вызывает исключения. В Python 3.2+ перехватывается только AttributeError — другие исключения распространяются как обычно. (До Python 3.2 перехватывались все исключения, что могло маскировать ошибки.)

Применяется для:
- Реализации паттерна "утиной типизации" (duck typing): проверить наличие метода перед его вызовом
- Безопасного обращения к опциональным атрибутам
- Проверки интерфейса (реализует ли объект нужный протокол)

Сравнение с getattr() + default:
- hasattr(obj, 'attr') + getattr(obj, 'attr') делает два обращения к атрибуту
- getattr(obj, 'attr', default) делает одно — предпочтительнее если нужно и значение

Парные функции: getattr() — получить атрибут, setattr() — установить, delattr() — удалить.`,
    syntax: "hasattr(object, name)",
    arguments: [
      {
        name: "object",
        description: "Объект, у которого проверяется наличие атрибута",
      },
      { name: "name", description: "Строка с именем проверяемого атрибута" },
    ],
    example: `class Dog:
    def __init__(self, name):
        self.name = name
    def bark(self):
        return "Woof!"

d = Dog("Rex")

hasattr(d, 'name')    # True
hasattr(d, 'bark')    # True  (метод — тоже атрибут)
hasattr(d, 'color')   # False

# Duck typing — проверка интерфейса
def make_sound(animal):
    if hasattr(animal, 'bark'):
        print(animal.bark())
    elif hasattr(animal, 'meow'):
        print(animal.meow())
    else:
        print("Неизвестный звук")

# Проверка наличия метода перед вызовом
objects = [[], {}, "string", 42]
for obj in objects:
    if hasattr(obj, 'append'):
        print(f"{type(obj).__name__} поддерживает append")
# list поддерживает append`,
  },
  {
    name: "hash(object)",
    description: `Возвращает хэш-значение объекта — целое число, используемое для быстрого сравнения ключей в словарях и множествах.

Ключевые свойства хэш-функции:
- Если a == b, то hash(a) == hash(b) (обязательное условие)
- Обратное неверно: два разных объекта могут иметь одинаковый хэш (коллизия)
- Хэш должен быть стабильным в течение жизни объекта
- Только хэшируемые (неизменяемые) объекты могут быть ключами словаря или элементами set

Хэшируемые типы: int, float, str, bytes, tuple (только если все элементы хэшируемы), frozenset, None, bool, пользовательские классы (по умолчанию хэш основан на id())

Нехэшируемые типы: list, dict, set (они изменяемы). Попытка вызвать hash() на них вызовет TypeError.

Хэш в Python рандомизируется между запусками (PYTHONHASHSEED) для защиты от атак типа Hash DoS. Поэтому нельзя сохранять хэши между запусками программы.`,
    syntax: "hash(object)",
    arguments: [
      {
        name: "object",
        description:
          "Хэшируемый объект — число, строка, кортеж из хэшируемых элементов, или объект с __hash__()",
      },
    ],
    example: `hash(42)          # 42  (для int хэш == само значение для небольших чисел)
hash(3.14)        # некоторое целое число
hash("hello")     # целое число (меняется между запусками!)
hash((1, 2, 3))   # хэш от кортежа

# Нехэшируемые объекты:
# hash([1, 2, 3])  # TypeError: unhashable type: 'list'

# Совместимость хэша и равенства
hash(1) == hash(1.0)  # True, и 1 == 1.0  — обязательное свойство

# Пользовательский класс
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    def __hash__(self):
        return hash((self.x, self.y))  # хэш из кортежа атрибутов

p = Point(1, 2)
d = {p: "origin"}   # можно использовать как ключ
s = {p}             # можно добавить в set`,
  },
  {
    name: "heapq.heapify(x)",
    description: `Преобразует список x в двоичную мин-кучу (min-heap) на месте (in-place) за O(n). После вызова элемент x[0] всегда является наименьшим.

Куча (heap) — это специальная организация списка, при которой выполняется свойство кучи: x[k] <= x[2*k+1] и x[k] <= x[2*k+2] для всех k. Элементы хранятся в обычном списке Python, просто переупорядоченным образом.

Важно: heapify изменяет список на месте, не создавая новой структуры данных. После heapify список выглядит «перемешанным», но первый элемент всегда минимальный.

Применение: преобразование существующего списка в кучу для последующих heappush/heappop операций.`,
    syntax: "heapq.heapify(x)",
    arguments: [
      {
        name: "x",
        description: "Список, который нужно преобразовать в кучу на месте",
      },
    ],
    example: `import heapq

data = [5, 3, 8, 1, 9, 2, 7]
heapq.heapify(data)
print(data)    # [1, 3, 2, 5, 9, 8, 7] — куча (порядок не очевиден, но data[0] = 1 — минимум)
print(data[0]) # 1 — всегда минимальный элемент

# После heapify можно использовать heappush/heappop
heapq.heappush(data, 0)
print(heapq.heappop(data))  # 0 — новый минимум`,
  },
  {
    name: "heapq.heappop(heap)",
    description: `Извлекает и возвращает наименьший элемент из кучи, поддерживая структуру кучи. Работает за O(log n).

Если куча пуста — вызывает IndexError.

Для просмотра наименьшего элемента без извлечения используйте heap[0].

Комбинация heappush + heappop составляет основу приоритетной очереди:
- Добавить элемент: heappush(heap, item)
- Извлечь минимум: heappop(heap)`,
    syntax: "heapq.heappop(heap)",
    arguments: [
      {
        name: "heap",
        description: "Список-куча, из которого извлекается наименьший элемент",
      },
    ],
    example: `import heapq

heap = [1, 3, 5, 7, 9]
heapq.heapify(heap)

print(heapq.heappop(heap))  # 1 — минимальный
print(heapq.heappop(heap))  # 3
print(heapq.heappop(heap))  # 5
print(heap)                  # [7, 9] — оставшиеся элементы

# Сортировка через кучу (аналог heapsort)
data = [5, 3, 8, 1, 9, 2, 7, 4, 6]
heapq.heapify(data)
sorted_data = [heapq.heappop(data) for _ in range(len(data))]
print(sorted_data)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Приоритетная очередь задач
tasks = []
heapq.heappush(tasks, (3, "низкий приоритет"))
heapq.heappush(tasks, (1, "высокий приоритет"))
heapq.heappush(tasks, (2, "средний приоритет"))
while tasks:
    priority, task = heapq.heappop(tasks)
    print(f"{priority}: {task}")`,
  },
  {
    name: "heapq.heappush(heap, item)",
    description: `Добавляет элемент item в кучу heap, поддерживая структуру кучи. Работает за O(log n).

Список heap должен уже быть валидной кучей (созданной через heapify или изначально пустым). Нельзя просто использовать обычный список — порядок элементов не будет гарантированным.

Использование строк или кортежей позволяет создавать приоритетные очереди с дополнительными данными: heappush(heap, (priority, data)).`,
    syntax: "heapq.heappush(heap, item)",
    arguments: [
      {
        name: "heap",
        description: "Список-куча, в который добавляется элемент",
      },
      {
        name: "item",
        description:
          "Элемент для добавления. Должен поддерживать операцию сравнения <",
      },
    ],
    example: `import heapq

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
heapq.heappush(heap, 3)
heapq.heappush(heap, 2)
print(heap)              # [1, 2, 3, 5] — куча, heap[0]=1 — минимум

# Приоритетная очередь с кортежами (priority, data)
pq = []
heapq.heappush(pq, (2, "email"))
heapq.heappush(pq, (1, "звонок"))    # высший приоритет
heapq.heappush(pq, (3, "встреча"))

while pq:
    priority, task = heapq.heappop(pq)
    print(f"[{priority}] {task}")
# [1] звонок
# [2] email
# [3] встреча

# Добавление в существующую кучу
data = [3, 1, 5, 7]
heapq.heapify(data)
heapq.heappush(data, 0)  # добавить новый минимум
print(data[0])  # 0`,
  },
  {
    name: "heapq.heappushpop(heap, item)",
    description: `Добавляет элемент item в кучу, затем извлекает и возвращает наименьший элемент. Работает за O(log n) и более эффективен, чем последовательные heappush + heappop.

Если item меньше текущего минимума кучи — возвращается сам item (куча не изменяется). Иначе — добавляется item и извлекается старый минимум.

Применение: часто используется в алгоритмах типа «поддерживать кучу из k наибольших элементов» при потоковой обработке данных.`,
    syntax: "heapq.heappushpop(heap, item)",
    arguments: [
      { name: "heap", description: "Список-куча" },
      {
        name: "item",
        description:
          "Элемент, который сначала добавляется в кучу, после чего извлекается минимум",
      },
    ],
    example: `import heapq

heap = [2, 4, 6, 8]
heapq.heapify(heap)

# item > текущий минимум → добавляется 5, извлекается 2
result = heapq.heappushpop(heap, 5)
print(result)  # 2
print(heap)    # [4, 5, 6, 8]

# item < текущий минимум → item возвращается сразу
result = heapq.heappushpop(heap, 1)
print(result)  # 1
print(heap)    # [4, 5, 6, 8] — куча не изменилась

# Поддержание кучи из k наибольших элементов
def k_largest_stream(stream, k):
    heap = []
    for item in stream:
        if len(heap) < k:
            heapq.heappush(heap, item)
        else:
            heapq.heappushpop(heap, item)  # вытесняет минимум если item больше
    return sorted(heap, reverse=True)

print(k_largest_stream([3, 1, 4, 1, 5, 9, 2, 6], 3))  # [9, 6, 5]`,
  },
  {
    name: "heapq.heapreplace(heap, item)",
    description: `Извлекает и возвращает наименьший элемент из кучи, затем добавляет новый элемент item. Работает за O(log n) и более эффективен, чем последовательные heappop + heappush.

Отличие от heappushpop:
- heapreplace: сначала извлекает, потом добавляет (куча никогда не остаётся пустой в процессе)
- heappushpop: сначала добавляет, потом извлекает

Если куча пуста — вызывает IndexError. Если item меньше текущего минимума — куча нарушает инвариант после вставки (применяйте осторожно).`,
    syntax: "heapq.heapreplace(heap, item)",
    arguments: [
      { name: "heap", description: "Список-куча (не должна быть пустой)" },
      {
        name: "item",
        description: "Элемент, добавляемый в кучу после извлечения минимума",
      },
    ],
    example: `import heapq

heap = [1, 3, 5, 7, 9]
heapq.heapify(heap)

# Извлечь 1, добавить 4
result = heapq.heapreplace(heap, 4)
print(result)  # 1 — извлечённый минимум
print(heap)    # [3, 4, 5, 7, 9]

result = heapq.heapreplace(heap, 2)
print(result)  # 3
print(heap)    # [2, 4, 5, 7, 9]

# Применение: слияние отсортированных файлов (merge sort)
# Классический алгоритм: начать с минимальных элементов каждого файла,
# извлекать минимум и заменять следующим из того же файла
import heapq
streams = [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
heap = [(stream[0], i, 0) for i, stream in enumerate(streams)]
heapq.heapify(heap)
result = []
while heap:
    val, stream_i, elem_i = heapq.heappop(heap)
    result.append(val)
    if elem_i + 1 < len(streams[stream_i]):
        heapq.heappush(heap, (streams[stream_i][elem_i + 1], stream_i, elem_i + 1))
print(result)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]`,
  },
  {
    name: "heapq.nlargest(n, iterable[, key])",
    description: `Возвращает список из n наибольших элементов итерируемого объекта, отсортированных по убыванию. Эквивалентно sorted(iterable, reverse=True)[:n], но эффективнее для малых n.

Сложность: O(k log n), где k — длина iterable.

Когда использовать nlargest vs sorted():
- n значительно меньше len(iterable) → nlargest эффективнее
- n примерно равно len(iterable) → sorted() эффективнее
- n == 1 → используйте max() — самый быстрый вариант

Параметр key работает так же, как в sorted() и max() — функция применяется к каждому элементу для сравнения, но возвращаются оригинальные элементы.`,
    syntax: "heapq.nlargest(n, iterable, key=None)",
    arguments: [
      {
        name: "n",
        description: "Количество наибольших элементов для возврата",
      },
      { name: "iterable", description: "Итерируемый объект с данными" },
      {
        name: "key",
        description:
          "Необязательный. Функция одного аргумента для определения критерия сравнения",
      },
    ],
    example: `import heapq

numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(heapq.nlargest(3, numbers))   # [9, 6, 5]
print(heapq.nlargest(1, numbers))   # [9]

# С ключом — топ-3 студентов по GPA
students = [
    {"name": "Alice", "gpa": 3.8},
    {"name": "Bob",   "gpa": 3.5},
    {"name": "Carol", "gpa": 3.9},
    {"name": "Dave",  "gpa": 3.7},
]
top3 = heapq.nlargest(3, students, key=lambda s: s["gpa"])
for s in top3:
    print(f"{s['name']}: {s['gpa']}")
# Carol: 3.9  Alice: 3.8  Dave: 3.7

# Топ-5 самых дорогих товаров
prices = {"apple": 1.2, "laptop": 999, "pen": 0.5, "phone": 799, "book": 15}
top = heapq.nlargest(2, prices, key=prices.get)
print(top)  # ['laptop', 'phone']`,
  },
  {
    name: "heapq.nsmallest(n, iterable[, key])",
    description: `Возвращает список из n наименьших элементов итерируемого объекта, отсортированных по возрастанию. Эквивалентно sorted(iterable)[:n], но эффективнее для малых n.

Сложность: O(k log n), где k — длина iterable.

Когда использовать nsmallest vs sorted():
- n значительно меньше len(iterable) → nsmallest эффективнее
- n примерно равно len(iterable) → sorted() эффективнее
- n == 1 → используйте min() — самый быстрый вариант

Является зеркальной функцией к nlargest().`,
    syntax: "heapq.nsmallest(n, iterable, key=None)",
    arguments: [
      {
        name: "n",
        description: "Количество наименьших элементов для возврата",
      },
      { name: "iterable", description: "Итерируемый объект с данными" },
      {
        name: "key",
        description:
          "Необязательный. Функция одного аргумента для определения критерия сравнения",
      },
    ],
    example: `import heapq

numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(heapq.nsmallest(3, numbers))  # [1, 1, 2]
print(heapq.nsmallest(1, numbers))  # [1]

# С ключом — 3 ближайших к нулю числа по модулю
data = [-5, 3, -1, 8, -2, 7, 0]
closest = heapq.nsmallest(3, data, key=abs)
print(closest)  # [0, -1, -2]

# Самые дешёвые товары
products = [
    {"name": "ручка",   "price": 30},
    {"name": "тетрадь", "price": 80},
    {"name": "линейка", "price": 45},
    {"name": "карандаш","price": 20},
    {"name": "папка",   "price": 120},
]
cheapest = heapq.nsmallest(2, products, key=lambda p: p["price"])
for item in cheapest:
    print(f"{item['name']}: {item['price']} руб.")
# карандаш: 20 руб.
# ручка: 30 руб.`,
  },
  {
    name: "help([object])",
    description: `Запускает встроенную справочную систему Python. Выводит документацию для объекта: модуля, функции, класса, метода, ключевого слова или темы справки.

Варианты использования:
- help() без аргументов: запускает интерактивную справочную сессию в консоли
- help(object): выводит справку по конкретному объекту
- help('string'): по ключевому слову или теме (например, help('for'), help('list'))
- help('modules'): список всех доступных модулей

Источник документации: help() использует pydoc, который собирает документацию из:
- Строк документации (__doc__) классов и функций
- Сигнатур функций
- Атрибутов и методов класса

Наиболее полезна в интерактивных сессиях Python (REPL), Jupyter Notebook (там ещё есть ?obj и ??obj). В IDE обычно есть более удобные способы просмотра документации.`,
    syntax: "help([object])",
    arguments: [
      {
        name: "object",
        description:
          "Необязательный. Объект, модуль, строка (ключевое слово), для которого нужна справка. Если не указан — запускается интерактивная справочная сессия",
      },
    ],
    example: `# В интерактивном Python (REPL):
help(len)
# Help on built-in function len in module builtins:
# len(obj, /)
#     Return the number of items in a container.

help(list.append)
# Help on method_descriptor:
# append(self, object, /)
#     Append object to the end of the list.

help('for')        # Справка по ключевому слову for

import os
help(os.path)      # Справка по модулю os.path

# Своя документация
class MyClass:
    """Это мой класс.
    
    Он умеет делать разные вещи.
    """
    def my_method(self):
        """Этот метод делает что-то полезное."""
        pass

help(MyClass)   # покажет строку документации`,
  },
  {
    name: "hex(x)",
    description: `Преобразует целое число в строку шестнадцатеричного представления с префиксом "0x". Результат является корректным Python-выражением.

Буквы a-f в выводе всегда строчные. Для заглавных букв используйте метод .upper() или форматирование format(x, 'X').

Если x не является объектом int, он должен реализовывать метод __index__(), возвращающий целое число.

Сравнение способов получения шестнадцатеричного представления:
- hex(x) → "0xff" — строка с префиксом 0x
- format(x, 'x') → "ff" — без префикса, строчные
- format(x, 'X') → "FF" — без префикса, заглавные
- format(x, '#x') → "0xff" — с префиксом, строчные
- f"{x:#x}" → "0xff" — f-строка с форматированием
- f"{x:08x}" → "000000ff" — с ведущими нулями

Обратная операция: int("0xff", 16) или int("ff", 16) — преобразует шестнадцатеричную строку в целое число.`,
    syntax: "hex(x)",
    arguments: [
      {
        name: "x",
        description:
          "Целое число для преобразования в шестнадцатеричную строку",
      },
    ],
    example: `hex(255)      # '0xff'
hex(0)        # '0x0'
hex(-255)     # '-0xff'
hex(256)      # '0x100'
hex(16)       # '0x10'

# Заглавные буквы
hex(255).upper()           # '0XFF'
format(255, 'X')           # 'FF'
format(255, '#X')          # '0XFF'

# Без префикса
format(255, 'x')           # 'ff'
f"{255:08x}"               # '000000ff'

# Обратное преобразование
int("0xff", 16)            # 255
int("ff", 16)              # 255
int("0xFF", 16)            # 255

# Пример: цвета в HTML
r, g, b = 255, 128, 0
color = f"#{r:02x}{g:02x}{b:02x}"
print(color)               # '#ff8000'`,
  },
  {
    name: "id(object)",
    description: `Возвращает "идентичность" объекта — целое число, гарантированно уникальное среди одновременно существующих объектов. Время жизни объекта — пока он существует.

В стандартной реализации CPython id() возвращает адрес объекта в памяти. Однако это деталь реализации — в других Python-реализациях (PyPy, Jython и т.д.) значение может быть другим.

Оператор is сравнивает именно идентичность объектов: a is b эквивалентно id(a) == id(b).

Важные нюансы:
- Два разных объекта могут иметь одинаковый id() если существуют в разное время (после удаления первого создаётся второй по тому же адресу)
- Маленькие целые числа (-5 до 256) и интернированные строки кэшируются в CPython — для них id() одинаков
- id() использoвать для сравнения значений нельзя (для этого == и is)

Применение: отладка (проверить, один ли это объект или копия), кэширование, логирование жизненного цикла объектов.`,
    syntax: "id(object)",
    arguments: [{ name: "object", description: "Любой Python-объект" }],
    example: `a = [1, 2, 3]
b = a          # b ссылается на тот же объект
c = [1, 2, 3]  # c — новый объект с теми же значениями

print(id(a))   # например, 140234567890
print(id(b))   # то же число, что и id(a)!
print(id(c))   # другое число

a is b         # True  (один объект)
a is c         # False (разные объекты)
a == c         # True  (равные значения)

# Кэширование малых чисел в CPython
x = 100
y = 100
x is y         # True  (один и тот же объект из кэша)

x = 1000
y = 1000
x is y         # False (не кэшируется, разные объекты)

# Изменение объекта не меняет его id
lst = [1, 2]
print(id(lst))  # 140...
lst.append(3)
print(id(lst))  # то же число! (мутация, не замена)`,
  },
  {
    name: "input([prompt])",
    description: `Читает строку из стандартного ввода (обычно с клавиатуры). Если указан параметр prompt, он выводится в стандартный вывод без перевода строки перед тем, как ожидать ввод.

Поведение:
- Возвращает введённую строку без завершающего символа новой строки
- Если пользователь нажал Enter без ввода текста, возвращает пустую строку ""
- Если достигнут конец файла (EOF), возбуждается EOFError
- Строка prompt выводится в stdout (без буферизации)

Тип возвращаемого значения всегда str. Для числового ввода необходимо явное преобразование: int(input(...)) или float(input(...)).

Если модуль readline был загружен, input() будет поддерживать историю команд и редактирование строки в стиле readline.

Перенаправление ввода: input() читает из sys.stdin, что можно перенаправить для автоматизации или тестирования.`,
    syntax: "input([prompt])",
    arguments: [
      {
        name: "prompt",
        description:
          "Необязательный. Строка-подсказка, выводимая перед ожиданием ввода. По умолчанию — пустая строка (нет подсказки)",
      },
    ],
    example: `# Базовый ввод
name = input("Введите ваше имя: ")
print(f"Привет, {name}!")

# Числовой ввод (с преобразованием типа)
age = int(input("Введите ваш возраст: "))
print(f"Через 10 лет вам будет {age + 10}")

# Безопасный ввод числа (с обработкой ошибки)
while True:
    try:
        n = int(input("Введите число: "))
        break
    except ValueError:
        print("Это не число! Попробуйте ещё раз.")

# Ввод списка чисел
numbers = list(map(int, input("Числа через пробел: ").split()))
print(f"Сумма: {sum(numbers)}")

# Перенаправление ввода для тестирования
import sys, io
sys.stdin = io.StringIO("Alice\n")
name = input("Имя: ")   # читает "Alice" без ожидания
print(name)             # Alice`,
  },
  {
    name: "int([x[, base]])",
    description: `Создаёт целое число из числа или строки. Целые числа в Python имеют произвольную точность — они ограничены только доступной памятью.

Варианты вызова:
1. int() — без аргументов: возвращает 0
2. int(x) — с одним аргументом: преобразует число или строку в int
3. int(x, base) — с основанием: разбирает строку как число в системе счисления base

При преобразовании числа с плавающей точкой усекается в сторону нуля (не округляется).

Параметр base:
- Допустимый диапазон: 2–36 или 0
- При base=0 система счисления определяется по префиксу строки: '0b' (двоичная), '0o' (восьмеричная), '0x' (шестнадцатеричная), без префикса (десятичная)
- Буква в строке может быть как строчной, так и заглавной
- Пробелы вокруг числа в строке допустимы

Если объект определяет __int__(), он будет использован. Если нет — пробуется __index__() или __trunc__().`,
    syntax: "int([x=0[, base=10]])",
    arguments: [
      {
        name: "x",
        description:
          "Необязательный. Число или строка для преобразования. По умолчанию 0",
      },
      {
        name: "base",
        description:
          "Необязательный. Основание системы счисления (2–36 или 0). По умолчанию 10. Применимо только при строковом x",
      },
    ],
    example: `int()            # 0
int(3.9)         # 3   (усечение, не округление!)
int(-3.9)        # -3  (в сторону нуля)
int("42")        # 42
int("  -17  ")   # -17 (пробелы игнорируются)
int("0b1010", 0) # 10  (base=0: автоопределение по префиксу)
int("0xff", 0)   # 255
int("0o17", 0)   # 15
int("1010", 2)   # 10  (двоичное)
int("ff", 16)    # 255 (шестнадцатеричное)
int("17", 8)     # 15  (восьмеричное)
int("z", 36)     # 35  (система счисления 36: цифры + буквы)

# Большие числа (произвольная точность!)
int(10 ** 100)   # гугол (10^100) — Python легко справляется

# С __int__
class Temp:
    def __int__(self):
        return 42

int(Temp())      # 42`,
  },
  {
    name: "isinstance(object, classinfo)",
    description: `Проверяет, является ли объект экземпляром указанного класса или его подкласса. Возвращает True если да, иначе False.

Параметр classinfo может быть:
- Классом: isinstance(x, int)
- Кортежем классов: isinstance(x, (int, float)) — True если объект является экземпляром хотя бы одного
- Начиная с Python 3.10: union-типом в виде X | Y (isinstance(x, int | float))

Важные нюансы:
- isinstance() учитывает наследование. Экземпляр подкласса является isinstance для родительского класса
- bool — подкласс int, поэтому isinstance(True, int) возвращает True
- Абстрактные базовые классы (ABC из модуля abc и collections.abc): isinstance() поддерживает виртуальное наследование через __subclasshook__()

Сравнение с type():
- isinstance(obj, cls) — True для obj и всех его подклассов (предпочтительно)
- type(obj) == cls — строгая проверка, игнорирует наследование

isinstance() — предпочтительный способ проверки типов в идиоматичном Python, так как поддерживает полиморфизм и принцип подстановки Лисков.`,
    syntax: "isinstance(object, classinfo)",
    arguments: [
      { name: "object", description: "Объект, тип которого проверяется" },
      {
        name: "classinfo",
        description:
          "Класс, тип, кортеж классов/типов или (Python 3.10+) union-тип X|Y",
      },
    ],
    example: `isinstance(42, int)          # True
isinstance(3.14, float)      # True
isinstance("hi", str)        # True
isinstance(True, int)        # True  (bool — подкласс int!)
isinstance(42, (int, str))   # True  (кортеж — любой из них)

# Наследование
class Animal: pass
class Dog(Animal): pass

d = Dog()
isinstance(d, Dog)     # True
isinstance(d, Animal)  # True  (учитывает наследование)
type(d) == Animal      # False (строгая проверка)

# Python 3.10+ union-тип
isinstance(42, int | float)  # True

# Абстрактные базовые классы
from collections.abc import Iterable, Sequence
isinstance([1, 2], Iterable)   # True
isinstance("hi", Sequence)     # True`,
  },
  {
    name: "issubclass(class, classinfo)",
    description: `Проверяет, является ли class подклассом classinfo. Возвращает True если да, иначе False. Класс считается подклассом самого себя.

Параметр classinfo может быть:
- Классом: issubclass(Dog, Animal)
- Кортежем классов: issubclass(cls, (A, B)) — True если cls является подклассом хотя бы одного из них

Если class не является классом, возбуждается TypeError.

Отличие от isinstance():
- isinstance() проверяет конкретный объект (экземпляр)
- issubclass() проверяет классы (отношение наследования между типами)

Цепочка наследования: если A → B → C, то issubclass(C, A) == True.

Абстрактные базовые классы (ABC): как и isinstance(), issubclass() поддерживает проверку через __subclasshook__() и register(). Это позволяет классам "виртуально" наследовать от ABC без явного объявления.

Применяется при проектировании фреймворков, плагинных систем, декораторов и при работе с метаклассами.`,
    syntax: "issubclass(class, classinfo)",
    arguments: [
      {
        name: "class",
        description:
          "Класс, для которого проверяется принадлежность к иерархии",
      },
      {
        name: "classinfo",
        description: "Класс, кортеж классов или (Python 3.10+) union-тип",
      },
    ],
    example: `class Animal: pass
class Dog(Animal): pass
class Cat(Animal): pass
class Poodle(Dog): pass

issubclass(Dog, Animal)      # True
issubclass(Poodle, Animal)   # True  (транзитивность)
issubclass(Animal, Dog)      # False
issubclass(Dog, Dog)         # True  (класс — подкласс себя!)

issubclass(Dog, (Cat, Animal))  # True (кортеж: хотя бы один)

# Встроенные типы
issubclass(bool, int)      # True
issubclass(int, object)    # True (все классы — подклассы object)

# ABC — виртуальное наследование
from collections.abc import Sized, Iterable
issubclass(list, Iterable)  # True
issubclass(list, Sized)     # True
issubclass(dict, Sized)     # True`,
  },
  {
    name: "iter(object[, sentinel])",
    description: `Создаёт итератор из объекта. Функция имеет две различные формы вызова.

Форма 1 — iter(object): object должен реализовывать протокол итератора (__iter__()) или протокол последовательности (__getitem__() с целыми индексами начиная с 0). Иначе — TypeError.

Форма 2 — iter(callable, sentinel): принимает вызываемый объект (callable) и значение-стоп (sentinel). Возвращает итератор, который каждый раз вызывает callable() без аргументов и возвращает результат. Итерация прекращается, когда callable() вернёт значение, равное sentinel.

Это очень мощный паттерн для:
- Чтения данных частями до достижения конца (EOF)
- Опроса источника до получения определённого значения
- Итерации по потоку до маркера окончания

Возвращаемый объект реализует протокол итератора: __iter__() и __next__(). Исчерпанный итератор при вызове next() возбуждает StopIteration.`,
    syntax: "iter(object)\niter(callable, sentinel)",
    arguments: [
      {
        name: "object",
        description:
          "Итерируемый объект (реализующий __iter__) или последовательность (реализующая __getitem__)",
      },
      {
        name: "callable",
        description:
          "Вызываемый объект без аргументов (вторая форма). Вызывается при каждом next()",
      },
      {
        name: "sentinel",
        description:
          "Значение-стоп (вторая форма). Итерация прекращается когда callable() == sentinel",
      },
    ],
    example: `# Форма 1 — итератор из объекта
lst = [1, 2, 3]
it = iter(lst)
next(it)   # 1
next(it)   # 2
next(it)   # 3
# next(it) # StopIteration

# iter из строки
it = iter("abc")
list(it)   # ['a', 'b', 'c']

# Форма 2 — callable + sentinel
# Чтение файла блоками по 4096 байт до конца файла
with open("file.bin", "rb") as f:
    for block in iter(lambda: f.read(4096), b""):
        process(block)

# Бросок кубика до выпадения 6
import random
rolls = list(iter(lambda: random.randint(1, 6), 6))
print(rolls)   # например [3, 1, 4, 2] — все броски до 6

# Чтение строк ввода до пустой строки
lines = list(iter(input, ""))`,
  },
  {
    name: "itertools.accumulate(iterable[, func, *, initial=None])",
    description: `Возвращает итератор накопленных результатов применения функции func к элементам iterable. По умолчанию (без func) накапливает сумму — аналог функции numpy.cumsum.

Алгоритм работы:
- Первый элемент возвращается как есть (если не задан initial)
- Каждый следующий элемент вычисляется как func(накопленное, текущий)

Параметр initial (добавлен в Python 3.8):
- Если задан, помещается перед элементами iterable
- Длина результата = len(iterable) + 1

Применение:
- Накопленная сумма (бегущий итог)
- Накопленное произведение
- Бегущий максимум/минимум
- Реализация сканирующих операций в функциональном стиле`,
    syntax: "itertools.accumulate(iterable[, func, *, initial=None])",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект с исходными данными",
      },
      {
        name: "func",
        description:
          "Необязательный. Функция двух аргументов (накопленное, текущий). По умолчанию — сложение (operator.add)",
      },
      {
        name: "initial",
        description:
          "Необязательный. Начальное значение накопителя. Добавлено в Python 3.8",
      },
    ],
    example: `import itertools
import operator

# Накопленная сумма (по умолчанию)
list(itertools.accumulate([1, 2, 3, 4, 5]))
# [1, 3, 6, 10, 15]

# Накопленное произведение
list(itertools.accumulate([1, 2, 3, 4, 5], operator.mul))
# [1, 2, 6, 24, 120]

# Бегущий максимум
list(itertools.accumulate([3, 1, 4, 1, 5, 9, 2, 6], max))
# [3, 3, 4, 4, 5, 9, 9, 9]

# С начальным значением
list(itertools.accumulate([1, 2, 3], initial=100))
# [100, 101, 103, 106]

# Расчёт баланса счёта
transactions = [1000, -200, -50, 300, -100]
balance = list(itertools.accumulate(transactions))
print(balance)  # [1000, 800, 750, 1050, 950]`,
  },
  {
    name: "itertools.chain(*iterables)",
    description: `Объединяет несколько итерируемых объектов в один последовательный итератор. Элементы возвращаются из первого итерируемого до его исчерпания, затем из второго и так далее.

Не создаёт промежуточных списков — ленивый (lazy) итератор, потребляет входные данные по одному.

Дополнительный метод itertools.chain.from_iterable(iterable):
- Принимает один итерируемый объект, содержащий вложенные итерируемые
- Эквивалентно chain(*iterable), но ленивый — итерируемые раскрываются по одному
- Полезен когда число вложенных итерируемых неизвестно заранее

Применение:
- Объединение нескольких списков без создания нового списка
- Обход нескольких коллекций как одной
- «Выравнивание» (flatten) одного уровня вложенности`,
    syntax:
      "itertools.chain(*iterables)\nitertools.chain.from_iterable(iterable)",
    arguments: [
      {
        name: "*iterables",
        description:
          "Один или несколько итерируемых объектов, которые нужно объединить в цепочку",
      },
    ],
    example: `import itertools

# Объединение списков
list(itertools.chain([1, 2], [3, 4], [5, 6]))
# [1, 2, 3, 4, 5, 6]

# Строки тоже итерируемые
list(itertools.chain("ABC", "DEF"))
# ['A', 'B', 'C', 'D', 'E', 'F']

# chain.from_iterable — для вложенных итерируемых
nested = [[1, 2], [3, 4], [5, 6]]
list(itertools.chain.from_iterable(nested))
# [1, 2, 3, 4, 5, 6]

# "Выравнивание" матрицы
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = list(itertools.chain.from_iterable(matrix))
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Обход разных структур как одной
users = ["Alice", "Bob"]
admins = ["Carol", "Dave"]
for name in itertools.chain(users, admins):
    print(name)  # Alice, Bob, Carol, Dave`,
  },
  {
    name: "itertools.combinations(iterable, r)",
    description: `Возвращает итератор всех r-элементных комбинаций из элементов iterable без повторений и без учёта порядка. Элементы сортируются согласно порядку их появления во входном iterable.

Ключевые свойства:
- Порядок элементов внутри комбинации сохраняется (как во входном iterable)
- Порядок внутри комбинации не меняется (нет перестановок)
- Каждый элемент используется не более одного раза
- Общее количество комбинаций: C(n, r) = n! / (r! × (n-r)!)

Отличие от combinations_with_replacement:
- combinations — без повторений: один элемент не может встречаться дважды в одной комбинации
- combinations_with_replacement — с повторениями

Применение: подбор команд, выбор подмножеств, комбинаторные задачи, проверка всех пар или троек в наборе.`,
    syntax: "itertools.combinations(iterable, r)",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект — источник элементов",
      },
      {
        name: "r",
        description: "Длина каждой комбинации (целое неотрицательное число)",
      },
    ],
    example: `import itertools

# Все пары из 4 элементов
list(itertools.combinations([1, 2, 3, 4], 2))
# [(1,2), (1,3), (1,4), (2,3), (2,4), (3,4)]

# Тройки из строки
list(itertools.combinations("ABC", 2))
# [('A','B'), ('A','C'), ('B','C')]

# Количество комбинаций
from math import comb
print(comb(4, 2))  # 6

# Проверка всех пар в списке
scores = [85, 90, 78, 92]
for a, b in itertools.combinations(scores, 2):
    print(f"Разность: {abs(a - b)}")

# Нахождение всех подмножеств любой длины
data = [1, 2, 3]
all_subsets = []
for r in range(len(data) + 1):
    all_subsets.extend(itertools.combinations(data, r))
print(all_subsets)
# [(), (1,), (2,), (3,), (1,2), (1,3), (2,3), (1,2,3)]`,
  },
  {
    name: "itertools.cycle(iterable)",
    description: `Возвращает бесконечный итератор, циклически повторяющий элементы iterable. После исчерпания iterable начинает снова с первого элемента.

Важно: cycle сохраняет копию каждого элемента внутри. При работе с большими итерируемыми это может занять значительный объём памяти.

Типичные применения:
- Циклическая смена цветов, стилей, состояний
- Распределение задач по воркерам по кругу (round-robin)
- Чередование значений при генерации данных
- Создание бесконечных последовательностей с периодом

Поскольку цикл бесконечный, для ограничения числа элементов используйте itertools.islice(), zip() с конечным итерируемым или явный break.`,
    syntax: "itertools.cycle(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект, элементы которого будут бесконечно повторяться по кругу",
      },
    ],
    example: `import itertools

# Взять первые 7 элементов из бесконечного цикла
list(itertools.islice(itertools.cycle([1, 2, 3]), 7))
# [1, 2, 3, 1, 2, 3, 1]

# Чередование состояний
toggler = itertools.cycle(["ВКЛ", "ВЫКЛ"])
for _ in range(5):
    print(next(toggler))
# ВКЛ, ВЫКЛ, ВКЛ, ВЫКЛ, ВКЛ

# Round-robin распределение задач
workers = itertools.cycle(["worker-1", "worker-2", "worker-3"])
tasks = ["task_a", "task_b", "task_c", "task_d", "task_e"]
for task in tasks:
    print(f"{next(workers)} обрабатывает {task}")

# Циклические цвета для графика
colors = itertools.cycle(["red", "blue", "green"])
data_series = ["A", "B", "C", "D", "E"]
for label, color in zip(data_series, colors):
    print(f"{label}: {color}")`,
  },
  {
    name: "itertools.dropwhile(predicate, iterable)",
    description: `Возвращает итератор, который пропускает элементы iterable, пока predicate возвращает True, а затем возвращает все оставшиеся элементы — включая первый, на котором predicate вернул False, и все последующие.

Ключевое отличие от filter():
- filter() проверяет каждый элемент независимо
- dropwhile() отбрасывает только начало последовательности: как только predicate впервые вернул False, все дальнейшие элементы возвращаются без проверки

Это делает dropwhile() полезным для обработки данных с «шапкой» (заголовком) или начальными строками, которые нужно пропустить.

Парная функция: itertools.takewhile() — возвращает элементы, пока predicate истинен.`,
    syntax: "itertools.dropwhile(predicate, iterable)",
    arguments: [
      {
        name: "predicate",
        description:
          "Функция одного аргумента, возвращающая bool. Элементы пропускаются, пока она возвращает True",
      },
      {
        name: "iterable",
        description: "Итерируемый объект с исходными данными",
      },
    ],
    example: `import itertools

# Пропустить числа меньше 5
list(itertools.dropwhile(lambda x: x < 5, [1, 2, 4, 6, 3, 8]))
# [6, 3, 8]  — 3 < 5, но она уже после первого False

# Пропустить строки-комментарии в начале файла
lines = ["# Комментарий", "# Ещё комментарий", "data=1", "# не пропустится", "data=2"]
data_lines = list(itertools.dropwhile(lambda l: l.startswith("#"), lines))
print(data_lines)  # ['data=1', '# не пропустится', 'data=2']

# Пропустить нули в начале
list(itertools.dropwhile(lambda x: x == 0, [0, 0, 0, 1, 2, 0, 3]))
# [1, 2, 0, 3]

# Пропустить заголовок CSV
rows = [["name", "age"], ["Alice", 30], ["Bob", 25]]
is_header = True
data = list(itertools.dropwhile(lambda r: r == ["name", "age"], rows))
print(data)  # [['Alice', 30], ['Bob', 25]]`,
  },
  {
    name: "itertools.groupby(iterable, key=None)",
    description: `Возвращает итератор, группирующий последовательные элементы iterable с одинаковым значением ключа key. Возвращает пары (ключ, группа), где группа — итератор элементов с этим ключом.

Критически важно: groupby работает только с последовательными группами, аналогично команде GROUP BY в Unix. Если данные не отсортированы по ключу — элементы с одинаковым ключом попадут в разные группы.

Чтобы сгруппировать все элементы с одинаковым ключом, нужно предварительно отсортировать: sorted(iterable, key=key).

Особенности итератора групп:
- Итератор группы «ломается» при переходе к следующей паре (ключ, группа)
- Если нужно сохранить группу — преобразуйте в list() немедленно

Параметр key:
- Если None — элемент сам является ключом (группируются идентичные элементы)
- Если функция — вычисляется для каждого элемента, сравниваются результаты`,
    syntax: "itertools.groupby(iterable, key=None)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект с данными. Для корректной группировки должен быть отсортирован по ключу",
      },
      {
        name: "key",
        description:
          "Необязательный. Функция, вычисляющая ключ группировки для каждого элемента. По умолчанию — идентичность элемента",
      },
    ],
    example: `import itertools

# Группировка последовательных одинаковых элементов
data = [1, 1, 2, 2, 2, 3, 1, 1]
for key, group in itertools.groupby(data):
    print(key, list(group))
# 1 [1, 1]
# 2 [2, 2, 2]
# 3 [3]
# 1 [1, 1]  ← снова 1, отдельная группа!

# Правильная группировка: сначала сортировка
words = ["apple", "ant", "banana", "avocado", "blueberry", "cherry"]
words.sort(key=lambda w: w[0])  # сортируем по первой букве
for letter, group in itertools.groupby(words, key=lambda w: w[0]):
    print(f"{letter}: {list(group)}")
# a: ['apple', 'ant', 'avocado']
# b: ['banana', 'blueberry']
# c: ['cherry']

# Группировка чётных и нечётных чисел
numbers = sorted([1, 2, 3, 4, 5, 6], key=lambda x: x % 2)
for parity, group in itertools.groupby(numbers, key=lambda x: x % 2):
    label = "нечётные" if parity else "чётные"
    print(f"{label}: {list(group)}")`,
  },
  {
    name: "itertools.islice(iterable, stop) / itertools.islice(iterable, start, stop[, step])",
    description: `Возвращает итератор, выдающий выбранные элементы из iterable по аналогии со срезом (slice), но без создания промежуточного списка. Работает с любым итератором, а не только с последовательностями.

В отличие от обычного среза:
- Не поддерживает отрицательные значения start, stop, step
- Не создаёт копию данных — ленивый (lazy) итератор
- Работает с бесконечными итераторами

Формы вызова:
- islice(iterable, stop) — первые stop элементов (start=0, step=1)
- islice(iterable, start, stop) — элементы с позиции start по stop
- islice(iterable, start, stop, step) — с шагом step
- islice(iterable, None) — все элементы (эквивалент копирования итератора)

Применение: ограничение длины бесконечных итераторов, «страничный» (paginated) обход, пропуск заголовка (islice(data, 1, None)).`,
    syntax:
      "itertools.islice(iterable, stop)\nitertools.islice(iterable, start, stop[, step])",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект или итератор, в том числе бесконечный",
      },
      {
        name: "stop",
        description: "Позиция конца (не включается). None — до конца итератора",
      },
      {
        name: "start",
        description:
          "Необязательный. Начальная позиция (включается). По умолчанию 0",
      },
      {
        name: "step",
        description:
          "Необязательный. Шаг выборки. По умолчанию 1. Не может быть отрицательным",
      },
    ],
    example: `import itertools

# Первые 5 элементов бесконечного счётчика
list(itertools.islice(itertools.count(), 5))
# [0, 1, 2, 3, 4]

# С позиции 2 по 7
list(itertools.islice(range(100), 2, 7))
# [2, 3, 4, 5, 6]

# С шагом 2
list(itertools.islice(range(20), 0, 10, 2))
# [0, 2, 4, 6, 8]

# Пропустить первую строку (заголовок)
import csv
with open("data.csv") as f:
    reader = csv.reader(f)
    data = list(itertools.islice(reader, 1, None))  # без заголовка

# Постраничный вывод
def paginate(iterable, page_size):
    it = iter(iterable)
    while True:
        page = list(itertools.islice(it, page_size))
        if not page:
            break
        yield page

for page in paginate(range(10), 3):
    print(page)
# [0, 1, 2]  [3, 4, 5]  [6, 7, 8]  [9]`,
  },
  {
    name: "itertools.permutations(iterable[, r])",
    description: `Возвращает итератор всех r-элементных перестановок элементов iterable. Учитывает порядок — (A, B) и (B, A) считаются разными перестановками.

Ключевые свойства:
- Элементы считаются уникальными по позиции, а не по значению
- Если r не задан или равен None — используется длина iterable (все перестановки)
- Количество перестановок: P(n, r) = n! / (n-r)!
- При r > n — результат пуст
- Кортежи возвращаются в лексикографическом порядке относительно входного iterable

Отличие от combinations():
- combinations — без учёта порядка: (A, B) == (B, A)
- permutations — с учётом порядка: (A, B) ≠ (B, A)

Применение: задачи о размещениях, поиск всех возможных упорядочиваний, генерация анаграмм.`,
    syntax: "itertools.permutations(iterable[, r])",
    arguments: [
      {
        name: "iterable",
        description: "Итерируемый объект — источник элементов",
      },
      {
        name: "r",
        description:
          "Необязательный. Длина каждой перестановки. По умолчанию — длина iterable",
      },
    ],
    example: `import itertools

# Все перестановки из 3 элементов
list(itertools.permutations([1, 2, 3]))
# [(1,2,3), (1,3,2), (2,1,3), (2,3,1), (3,1,2), (3,2,1)]

# Перестановки по 2 из 3
list(itertools.permutations([1, 2, 3], 2))
# [(1,2), (1,3), (2,1), (2,3), (3,1), (3,2)]

# Все анаграммы слова
words = set(itertools.permutations("abc"))
print(len(words))  # 6

# Подсчёт
from math import perm
print(perm(4, 2))  # 12 — перестановки из 4 по 2

# Нахождение всех маршрутов между городами
cities = ["Москва", "Питер", "Казань"]
for route in itertools.permutations(cities):
    print(" → ".join(route))
# Москва → Питер → Казань
# Москва → Казань → Питер
# ...`,
  },
  {
    name: "itertools.product(*iterables, repeat=1)",
    description: `Возвращает итератор декартова произведения входных итерируемых объектов — аналог вложенных циклов for. Эквивалентно вложенным циклам: product(A, B) == ((a, b) for a in A for b in B).

Параметр repeat:
- Позволяет вычислить декартово произведение iterable с самим собой repeat раз
- product(A, repeat=3) == product(A, A, A)

Ключевые свойства:
- Входные iterable преобразуются в списки перед вычислением (данные хранятся в памяти)
- Количество результатов: произведение длин всех входных итерируемых
- Возвращает кортежи в лексикографическом порядке

Применение:
- Генерация всех комбинаций параметров (перебор конфигураций)
- Матричные вычисления
- Перебор вариантов (brute-force)
- Генерация тестовых данных`,
    syntax: "itertools.product(*iterables, repeat=1)",
    arguments: [
      {
        name: "*iterables",
        description:
          "Один или несколько итерируемых объектов, декартово произведение которых нужно вычислить",
      },
      {
        name: "repeat",
        description:
          "Необязательный. Количество повторений каждого iterable в произведении. По умолчанию 1",
      },
    ],
    example: `import itertools

# Декартово произведение двух последовательностей
list(itertools.product([1, 2], ["a", "b"]))
# [(1,'a'), (1,'b'), (2,'a'), (2,'b')]

# Произведение трёх списков
list(itertools.product([0, 1], [0, 1], [0, 1]))
# — все 8 трёхбитовых комбинаций

# Эквивалент вложенных циклов
# for a in [1, 2]:
#     for b in ['x', 'y']:
#         print(a, b)
for a, b in itertools.product([1, 2], ["x", "y"]):
    print(a, b)

# repeat — произведение с самим собой
list(itertools.product("AB", repeat=2))
# [('A','A'), ('A','B'), ('B','A'), ('B','B')]

# Перебор всех комбинаций гиперпараметров
learning_rates = [0.001, 0.01]
batch_sizes = [32, 64]
optimizers = ["adam", "sgd"]
for lr, bs, opt in itertools.product(learning_rates, batch_sizes, optimizers):
    print(f"lr={lr}, batch={bs}, optimizer={opt}")`,
  },
  {
    name: "itertools.repeat(object[, times])",
    description: `Возвращает итератор, бесконечно (или times раз) повторяющий объект object. Не создаёт копий объекта — все итерации возвращают одну и ту же ссылку.

Без параметра times — бесконечный итератор. С times — конечный, возвращает ровно times элементов.

Применение:
- Передача константного аргумента в map() или starmap()
- Создание списка из одинаковых элементов (эффективнее, чем [value] * n для неизменяемых)
- Заполнение значениями по умолчанию
- Совместное использование с zip() для «прикрепления» константы к итератору

Важно: так как возвращается одна и та же ссылка, мутация объекта (если он изменяемый) будет видна во всех позициях.`,
    syntax: "itertools.repeat(object[, times])",
    arguments: [
      {
        name: "object",
        description: "Объект, который будет возвращаться на каждой итерации",
      },
      {
        name: "times",
        description:
          "Необязательный. Количество повторений. Если не задан — бесконечный итератор",
      },
    ],
    example: `import itertools

# Конечное повторение
list(itertools.repeat(10, 5))
# [10, 10, 10, 10, 10]

list(itertools.repeat("hello", 3))
# ['hello', 'hello', 'hello']

# Использование с map() — передача константного аргумента
list(map(pow, range(5), itertools.repeat(2)))
# [0, 1, 4, 9, 16] — каждое число в степени 2

# Использование с zip()
data = [1, 2, 3, 4, 5]
constant = 10
pairs = list(zip(data, itertools.repeat(constant)))
print(pairs)  # [(1,10), (2,10), (3,10), (4,10), (5,10)]

# Бесконечный итератор (ограничиваем islice)
infinite = itertools.repeat(42)
first_three = list(itertools.islice(infinite, 3))
print(first_three)  # [42, 42, 42]`,
  },
  {
    name: "itertools.takewhile(predicate, iterable)",
    description: `Возвращает итератор, который выдаёт элементы iterable, пока predicate возвращает True. Как только predicate впервые возвращает False — итерация немедленно прекращается, оставшиеся элементы игнорируются.

Ключевое отличие от filter():
- filter() проверяет каждый элемент независимо, пропуская не подходящие
- takewhile() останавливается при первом «ложном» элементе — дальше не идёт

Парная функция: itertools.dropwhile() — пропускает начало, затем выдаёт всё оставшееся.

Применение:
- Чтение данных до достижения стоп-условия (например, до пустой строки)
- Обход отсортированных данных до превышения порогового значения
- Реализация «раннего выхода» из итерации без break`,
    syntax: "itertools.takewhile(predicate, iterable)",
    arguments: [
      {
        name: "predicate",
        description:
          "Функция одного аргумента, возвращающая bool. Итерация продолжается, пока она возвращает True",
      },
      {
        name: "iterable",
        description: "Итерируемый объект с исходными данными",
      },
    ],
    example: `import itertools

# Взять числа, пока они меньше 5
list(itertools.takewhile(lambda x: x < 5, [1, 2, 3, 6, 2, 1]))
# [1, 2, 3]  — остановились на 6, хотя дальше есть 2 и 1

# Чтение строк до пустой
lines = ["line 1", "line 2", "", "line 3", "line 4"]
result = list(itertools.takewhile(lambda l: l != "", lines))
print(result)  # ['line 1', 'line 2']

# Из отсортированного списка — все элементы до порога
prices = [10, 25, 38, 55, 72, 90]
affordable = list(itertools.takewhile(lambda p: p < 50, prices))
print(affordable)  # [10, 25, 38]

# Совместно с dropwhile — выделить «середину»
data = [0, 0, 1, 2, 3, 0, 0]
middle = list(itertools.takewhile(
    lambda x: x != 0,
    itertools.dropwhile(lambda x: x == 0, data)
))
print(middle)  # [1, 2, 3]`,
  },
  {
    name: "itertools.zip_longest(*iterables, fillvalue=None)",
    description: `Объединяет несколько итерируемых объектов в итератор кортежей, аналогично встроенной zip(). Главное отличие: zip_longest продолжает работу до исчерпания самого длинного итерируемого, заполняя «пробелы» значением fillvalue.

Встроенный zip() останавливается на самом коротком — zip_longest() дополняет короткие.

Поведение:
- Количество кортежей в результате = длина самого длинного iterable
- Позиции исчерпавшихся итерируемых заполняются fillvalue
- Каждый iterable может иметь свою длину

Применение:
- Объединение данных из разных источников неравной длины
- Построчное сравнение файлов/последовательностей
- Заполнение матрицы данными переменной длины`,
    syntax: "itertools.zip_longest(*iterables, fillvalue=None)",
    arguments: [
      {
        name: "*iterables",
        description: "Один или несколько итерируемых объектов для объединения",
      },
      {
        name: "fillvalue",
        description:
          "Необязательный. Значение для заполнения «пробелов» в коротких итерируемых. По умолчанию None",
      },
    ],
    example: `import itertools

# Простое использование
list(itertools.zip_longest([1, 2, 3], ["a", "b"]))
# [(1,'a'), (2,'b'), (3, None)]

# Со своим fillvalue
list(itertools.zip_longest([1, 2, 3], ["a", "b"], fillvalue="-"))
# [(1,'a'), (2,'b'), (3,'-')]

# Три списка разной длины
a = [1, 2, 3, 4]
b = ["x", "y"]
c = [True, False, True]
for row in itertools.zip_longest(a, b, c, fillvalue=0):
    print(row)
# (1, 'x', True)
# (2, 'y', False)
# (3,  0,  True)
# (4,  0,   0 )

# Сравнение двух списков по позициям
list1 = [1, 2, 3, 4, 5]
list2 = [1, 2, 9, 4]
for i, (a, b) in enumerate(itertools.zip_longest(list1, list2)):
    if a != b:
        print(f"Позиция {i}: {a} != {b}")`,
  },
  {
    name: "len(s)",
    description: `Возвращает длину (количество элементов) объекта. Аргументом может быть последовательность (строка, байты, кортеж, список, диапазон) или коллекция (словарь, множество, frozenset).

Вызывает метод __len__() объекта. Если объект не реализует __len__(), возникает TypeError.

Особенности:
- Для строк len() возвращает количество символов (Unicode code points), а не байт
- Для словаря — количество пар ключ-значение
- Для range — количество элементов диапазона (вычисляется за O(1))
- len() всегда неотрицателен и вычисляется за O(1) для всех встроенных типов

Важный нюанс для NumPy/pandas: у массивов и DataFrame len() возвращает длину первого измерения (количество строк), а не общее количество элементов.

len() — одна из самых часто используемых функций Python. В сочетании с range() и enumerate() составляет основу большинства циклов.`,
    syntax: "len(s)",
    arguments: [
      {
        name: "s",
        description:
          "Объект, реализующий __len__(). Строка, список, кортеж, словарь, множество, range, байтовая строка и т.д.",
      },
    ],
    example: `len("hello")        # 5
len("Привет")       # 6  (символов Unicode, не байт)
len([1, 2, 3])      # 3
len((1, 2))         # 2
len({})             # 0
len({'a': 1, 'b': 2}) # 2  (количество ключей)
len({1, 2, 3})      # 3
len(range(10))      # 10  (O(1), без создания списка)
len(b"bytes")       # 5

# Строка в байтах != символов
s = "Привет"
len(s)              # 6 символов
len(s.encode())     # 12 байт (UTF-8: 2 байта на символ)

# Проверка на пустоту — лучше так:
lst = []
if not lst: ...      # идиоматично
if len(lst) == 0: .. # тоже работает, но многословно`,
  },
  {
    name: "list([iterable])",
    description: `Создаёт список из итерируемого объекта или возвращает пустой список. Список — изменяемая упорядоченная последовательность произвольных элементов.

list() преобразует любой итерируемый объект в список: строку (в список символов), кортеж, множество, генератор, словарь (ключи), range и т.д.

Ключевые свойства списков:
- Изменяемые: поддерживают append(), insert(), remove(), pop(), sort(), reverse() и др.
- Упорядоченные: сохраняют порядок вставки элементов
- Допускают дубликаты
- Могут содержать элементы разных типов
- Доступ по индексу за O(1), поиск за O(n), вставка/удаление в начало O(n)

list() vs list comprehension:
- list(map(f, x)) — через map (функциональный стиль)
- [f(v) for v in x] — list comprehension (чаще более читаемо)
- list(x) — просто скопировать итерируемое в список

Мелкое копирование: list(original) создаёт новый список, но элементы не копируются (shallow copy). Для глубокого копирования — copy.deepcopy().`,
    syntax: "list([iterable])",
    arguments: [
      {
        name: "iterable",
        description:
          "Необязательный. Итерируемый объект, из которого создаётся список. Если не указан — создаётся пустой список []",
      },
    ],
    example: `list()               # []
list("hello")        # ['h', 'e', 'l', 'l', 'o']
list((1, 2, 3))      # [1, 2, 3]  из кортежа
list({3, 1, 2})      # [1, 2, 3]  из множества (порядок не гарантирован)
list({'a': 1, 'b': 2}) # ['a', 'b']  только ключи!
list(range(5))       # [0, 1, 2, 3, 4]

# Из генератора
list(x**2 for x in range(5))  # [0, 1, 4, 9, 16]

# Мелкая копия
original = [1, 2, 3]
copy = list(original)
copy.append(4)
print(original)   # [1, 2, 3]  — не изменился
print(copy)       # [1, 2, 3, 4]

# Методы списка
lst = [3, 1, 4, 1, 5]
lst.sort()           # [1, 1, 3, 4, 5]
lst.reverse()        # [5, 4, 3, 1, 1]
lst.count(1)         # 2
lst.index(3)         # 2  (индекс первого вхождения)`,
  },
  {
    name: "locals()",
    description: `Возвращает словарь, представляющий текущую локальную символьную таблицу (пространство имён). Содержит все локальные переменные, аргументы функции и вложенные функции в текущей области видимости.

Важные особенности:
- Содержимое словаря отражает текущее состояние локальных переменных на момент вызова
- Изменение словаря, возвращённого locals(), НЕ гарантированно изменяет локальные переменные — это зависит от реализации Python и контекста
- В CPython изменения не влияют на реальные локальные переменные внутри функции
- На уровне модуля locals() возвращает то же самое, что globals()
- В блоке class locals() возвращает пространство имён класса

Ключевое отличие от globals():
- globals() — глобальное пространство (уровень модуля), изменяемый "живой" словарь
- locals() — снимок локальных переменных, не обязательно "живой"

Основные применения: отладка (просмотр переменных), форматирование строк через locals(), логирование состояния.`,
    syntax: "locals()",
    arguments: [],
    example: `# На уровне модуля
x = 10
print(locals()['x'])   # 10 (на уровне модуля == globals())

# Внутри функции
def show_locals():
    a = 1
    b = "hello"
    c = [1, 2, 3]
    print(locals())
    # {'a': 1, 'b': 'hello', 'c': [1, 2, 3]}

show_locals()

# Форматирование строк через locals()
def greet(name, age):
    template = "Привет, {name}! Тебе {age} лет."
    return template.format(**locals())

print(greet("Alice", 30))
# Привет, Alice! Тебе 30 лет.

# Аргументы тоже включены
def func(x, y, z=0):
    return locals()

func(1, 2)   # {'x': 1, 'y': 2, 'z': 0}`,
  },
  {
    name: "map(function, iterable, ...)",
    description: `Применяет функцию к каждому элементу итерируемого объекта и возвращает итератор с результатами.

Если передано несколько итерируемых объектов, function должна принимать столько аргументов, сколько итерируемых объектов передано. Элементы из нескольких итерируемых берутся параллельно, как в zip(). Итерация останавливается по самому короткому итерируемому.

map() возвращает ленивый итератор (map object) — элементы вычисляются по мере необходимости. Для получения списка оберните в list().

Сравнение с list comprehension:
- map(f, iterable) ≈ (f(x) for x in iterable)
- list comprehension обычно читается лучше для простых случаев
- map() выигрывает когда функция уже определена и принимает ровно один аргумент

С несколькими итерируемыми:
- map(f, a, b) ≈ (f(x, y) for x, y in zip(a, b))

Принимает любой callable: функции, lambda, методы, встроенные функции (str, int, len и т.д.).`,
    syntax: "map(function, iterable, *iterables)",
    arguments: [
      {
        name: "function",
        description:
          "Функция, применяемая к каждому элементу. Должна принимать столько аргументов, сколько передано итерируемых",
      },
      {
        name: "iterable",
        description:
          "Один или несколько итерируемых объектов, чьи элементы передаются в function",
      },
    ],
    example: `# Возведение в квадрат
squares = list(map(lambda x: x**2, [1, 2, 3, 4, 5]))
# [1, 4, 9, 16, 25]

# Встроенная функция как аргумент
words = ["hello", "world", "python"]
lengths = list(map(len, words))
# [5, 5, 6]

# Преобразование типов
nums = list(map(int, ["1", "2", "3"]))
# [1, 2, 3]

# Несколько итерируемых
a = [1, 2, 3]
b = [10, 20, 30]
result = list(map(lambda x, y: x + y, a, b))
# [11, 22, 33]

# Эквивалент с list comprehension
result2 = [x + y for x, y in zip(a, b)]

# Ленивое вычисление — map без list()
gen = map(str.upper, ["a", "b", "c"])
next(gen)   # 'A'
next(gen)   # 'B'`,
  },
  {
    name: "max(iterable[, key, default]) / max(arg1, arg2, *args[, key])",
    description: `Возвращает наибольший элемент из итерируемого объекта или наибольший из переданных аргументов.

Две формы вызова:
1. max(iterable) — наибольший элемент из одного итерируемого
2. max(arg1, arg2, ...) — наибольший из двух и более аргументов

Параметр key:
- Функция одного аргумента, применяемая к каждому элементу для сравнения (как в sort())
- Сравниваются результаты key(element), но возвращается оригинальный элемент
- key=len — максимум по длине; key=abs — по абсолютному значению; key=str.lower — без учёта регистра

Параметр default:
- Возвращается если iterable пуст
- Только для формы с одним итерируемым объектом
- Без default пустой итерируемый вызывает ValueError

Элементы сравниваются оператором > (или через __gt__). При равных значениях ключа возвращается первый встреченный максимальный элемент.`,
    syntax:
      "max(iterable, *, key=None, default=<...>)\nmax(arg1, arg2, *args, key=None)",
    arguments: [
      {
        name: "iterable / arg1, arg2...",
        description:
          "Итерируемый объект или два и более аргументов для сравнения",
      },
      {
        name: "key",
        description:
          "Необязательный. Функция одного аргумента для определения критерия сравнения",
      },
      {
        name: "default",
        description:
          "Необязательный. Значение при пустом iterable. Только для формы с одним итерируемым",
      },
    ],
    example: `max(3, 1, 4, 1, 5, 9)        # 9
max([3, 1, 4, 1, 5, 9])      # 9
max("python", "java", "go")  # 'python' (лексикографически)
max([])                       # ValueError!
max([], default=0)            # 0  — безопасно

# С key
words = ["banana", "apple", "kiwi", "strawberry"]
max(words, key=len)           # 'strawberry' (самое длинное)

numbers = [-5, -2, 3, 1]
max(numbers, key=abs)         # -5 (наибольшее по модулю)

# Нахождение словаря с максимальным значением
data = [{"name": "Alice", "score": 95},
        {"name": "Bob", "score": 87}]
best = max(data, key=lambda d: d["score"])
print(best["name"])           # 'Alice'`,
  },
  {
    name: "memoryview(object)",
    description: `Создаёт объект memoryview — «вид в память» — позволяющий получить прямой доступ к внутренним данным объекта, поддерживающего буферный протокол (buffer protocol), без копирования.

Буферный протокол реализуют: bytes, bytearray, array.array, numpy.ndarray и другие. Обычные списки и строки его не реализуют.

Ключевые особенности:
- Не копирует данные: memoryview ссылается на те же байты в памяти
- Поддерживает срезы: срез memoryview — это тоже memoryview (без копирования!)
- Изменяемый для изменяемых объектов: mv[0] = 65 изменяет исходный bytearray
- Поддерживает многомерные данные (например, 2D-массивы numpy)

Атрибуты объекта memoryview:
- .format — строка формата (например, 'B' для байт без знака)
- .itemsize — размер одного элемента в байтах
- .ndim — количество измерений
- .shape — кортеж размеров по каждому измерению
- .tobytes() — преобразовать в объект bytes
- .tolist() — преобразовать в список

Применение: высокопроизводительная обработка бинарных данных, работа с большими буферами без лишних копирований, взаимодействие с C-расширениями и numpy.`,
    syntax: "memoryview(object)",
    arguments: [
      {
        name: "object",
        description:
          "Объект, реализующий буферный протокол: bytes, bytearray, array.array, numpy.ndarray и другие",
      },
    ],
    example: `# Создание из bytes (только для чтения)
mv = memoryview(b'Hello, World!')
print(mv[0])        # 72 (код символа 'H')
print(bytes(mv[0:5]))  # b'Hello'

# Создание из bytearray (изменяемый)
data = bytearray(b'abcde')
mv = memoryview(data)
mv[0] = 65          # изменяем первый байт: ASCII 65 = 'A'
print(data)         # bytearray(b'Abcde')

# Срез без копирования
chunk = mv[1:4]     # memoryview, не bytes — нет копирования!
print(bytes(chunk)) # b'bcd'

# Сравнение производительности: работа с большим буфером
big = bytearray(10_000_000)
view = memoryview(big)
# Это НЕ копирует данные:
part = view[1_000_000:2_000_000]

# Преобразование
mv2 = memoryview(b'\\x01\\x02\\x03')
print(mv2.tobytes()) # b'\\x01\\x02\\x03'
print(mv2.tolist())  # [1, 2, 3]`,
  },
  {
    name: "min(iterable[, key, default]) / min(arg1, arg2, *args[, key])",
    description: `Возвращает наименьший элемент из итерируемого объекта или наименьший из переданных аргументов. Является зеркальной функцией к max().

Две формы вызова:
1. min(iterable) — наименьший элемент из одного итерируемого
2. min(arg1, arg2, ...) — наименьший из двух и более аргументов

Параметр key:
- Функция одного аргумента для сравнения элементов
- Сравниваются результаты key(element), возвращается оригинальный элемент

Параметр default:
- Возвращается если iterable пуст
- Без default пустой итерируемый вызывает ValueError

Элементы сравниваются оператором < (или через __lt__). При равных значениях ключа возвращается первый встреченный минимальный элемент (это гарантирует стабильность).

Типичные применения: поиск минимального по условию, нахождение ближайшего элемента, минимальной записи в списке объектов.`,
    syntax:
      "min(iterable, *, key=None, default=<...>)\nmin(arg1, arg2, *args, key=None)",
    arguments: [
      {
        name: "iterable / arg1, arg2...",
        description:
          "Итерируемый объект или два и более аргументов для сравнения",
      },
      {
        name: "key",
        description:
          "Необязательный. Функция одного аргумента для определения критерия сравнения",
      },
      {
        name: "default",
        description:
          "Необязательный. Значение при пустом iterable. Только для формы с одним итерируемым",
      },
    ],
    example: `min(3, 1, 4, 1, 5)           # 1
min([3, 1, 4, 1, 5])         # 1
min("python", "java", "go")  # 'go' (лексикографически)
min([], default=None)         # None — безопасно

# С key
words = ["banana", "apple", "kiwi", "strawberry"]
min(words, key=len)           # 'kiwi' (самое короткое)

numbers = [-5, -2, 3, 1]
min(numbers, key=abs)         # 1 (наименьшее по модулю)

# Ближайший к цели
target = 10
values = [3, 7, 12, 15, 20]
closest = min(values, key=lambda x: abs(x - target))
print(closest)               # 12

# Минимум из словарей
students = [{"name": "Alice", "grade": 85},
            {"name": "Bob", "grade": 72}]
worst = min(students, key=lambda s: s["grade"])
print(worst["name"])          # 'Bob'`,
  },
  {
    name: "next(iterator[, default])",
    description: `Возвращает следующий элемент итератора, вызывая его метод __next__(). Если итератор исчерпан, возникает StopIteration или возвращается default если он указан.

Ключевые свойства:
- next() можно вызывать только на итераторах (объектах с __next__()), а не на итерируемых объектах (с __iter__())
- Чтобы получить итератор из итерируемого, сначала вызовите iter()
- Каждый вызов next() "продвигает" итератор вперёд — возврат назад невозможен

Параметр default:
- Если указан, возвращается вместо StopIteration при исчерпании итератора
- Позволяет безопасно работать с итераторами без try/except

Практические применения:
- Получение первого элемента, соответствующего условию: next(x for x in items if condition, None)
- Ручное управление итерацией
- "Заглянуть" на один элемент вперёд в алгоритмах парсинга
- Работа с ленивыми генераторами и бесконечными итераторами`,
    syntax: "next(iterator[, default])",
    arguments: [
      {
        name: "iterator",
        description:
          "Объект-итератор, реализующий __next__(). Получить итератор из итерируемого: iter(iterable)",
      },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое если итератор исчерпан. Если не указан — возбуждается StopIteration",
      },
    ],
    example: `it = iter([10, 20, 30])
next(it)          # 10
next(it)          # 20
next(it)          # 30
next(it, "end")   # "end"  (итератор исчерпан, возвращаем default)
# next(it)        # StopIteration если нет default

# Первый чётный из списка
numbers = [1, 3, 5, 6, 7, 8]
first_even = next((x for x in numbers if x % 2 == 0), None)
print(first_even)   # 6

# Ручная итерация с контролем
data = iter(range(5))
print(next(data))   # 0
# ... какой-то код ...
print(next(data))   # 1

# Бесконечный генератор
import itertools
counter = itertools.count(1)
next(counter)   # 1
next(counter)   # 2
next(counter)   # 3 (и так до бесконечности)`,
  },
  {
    name: "object()",
    description: `Возвращает новый объект типа object. object — это базовый класс для всех новых классов в Python. Все классы неявно наследуют от object, если явно не указан другой базовый класс.

object() не принимает аргументов. Если передать аргументы — возникнет TypeError (если не переопределить __init__ или __new__ в подклассе).

Что предоставляет object:
- Методы по умолчанию: __str__(), __repr__(), __eq__(), __hash__(), __ne__(), __lt__() и т.д.
- По умолчанию __eq__() сравнивает по идентичности (==), а __hash__() основан на id()
- Метод __init_subclass__() и дескриптор __class__

Практическое использование object():
1. Создание уникального часового (sentinel) значения — объекта, который не равен ничему другому
2. Понимание MRO (Method Resolution Order) — все классы завершают цепочку наследования на object
3. Разработка metaclass-систем

Паттерн sentinel: _MISSING = object() — уникальный объект, отличный от None, используется как маркер "значение не передано".`,
    syntax: "object()",
    arguments: [],
    example: `obj = object()
print(obj)         # <object object at 0x...>
print(type(obj))   # <class 'object'>

# Всё наследует от object
isinstance(42, object)      # True
isinstance("hi", object)    # True
isinstance([], object)      # True
issubclass(int, object)     # True

# Паттерн sentinel — уникальное значение-маркер
_MISSING = object()

def get_value(data, key, default=_MISSING):
    result = data.get(key, _MISSING)
    if result is _MISSING:
        if default is _MISSING:
            raise KeyError(key)
        return default
    return result

d = {"a": 1}
get_value(d, "a")          # 1
get_value(d, "b", None)    # None (None — допустимое значение!)
# get_value(d, "b")        # KeyError

# MRO завершается на object
class A: pass
class B(A): pass
print(B.__mro__)  # (<class 'B'>, <class 'A'>, <class 'object'>)`,
  },
  {
    name: "oct(x)",
    description: `Преобразует целое число в восьмеричную строку с префиксом "0o". Результат является корректным Python-выражением.

Если x не является объектом int, он должен реализовывать метод __index__(), возвращающий целое число.

Сравнение способов получения восьмеричного представления:
- oct(x) → "0o17" — строка с префиксом 0o
- format(x, 'o') → "17" — без префикса
- format(x, '#o') → "0o17" — с префиксом
- f"{x:o}" → "17" — f-строка без префикса
- f"{x:#o}" → "0o17" — f-строка с префиксом

Обратное преобразование: int("0o17", 0) или int("17", 8) — строку в int.

Восьмеричная система используется в:
- Правах доступа к файлам Unix/Linux (chmod 755 — это 0o755)
- Некоторых протоколах и форматах данных
- Исторически — в ранних компьютерных системах`,
    syntax: "oct(x)",
    arguments: [
      {
        name: "x",
        description: "Целое число для преобразования в восьмеричную строку",
      },
    ],
    example: `oct(8)     # '0o10'
oct(0)     # '0o0'
oct(255)   # '0o377'
oct(-8)    # '-0o10'
oct(64)    # '0o100'

# Без префикса
format(255, 'o')   # '377'
f"{255:o}"         # '377'
f"{255:#o}"        # '0o377'

# Обратное преобразование
int("0o377", 0)    # 255
int("377", 8)      # 255

# Права доступа Unix
permission = 0o755
oct(permission)    # '0o755'
# 7 = rwx, 5 = r-x
# owner: rwx, group: r-x, others: r-x`,
  },
  {
    name: "open(file, mode, buffering, encoding, errors, newline, closefd, opener)",
    description: `Открывает файл и возвращает файловый объект. Является основным способом работы с файлами в Python.

Режимы (mode):
- 'r' — чтение (по умолчанию)
- 'w' — запись (создаёт или перезаписывает)
- 'a' — добавление в конец
- 'x' — создание нового файла (ошибка если существует)
- 'b' — бинарный режим (rb, wb и т.д.)
- 't' — текстовый режим (по умолчанию, rt, wt)
- '+' — обновление (чтение + запись): r+, w+, a+

Буферизация (buffering):
- -1 или не указан: системная политика по умолчанию
- 0: без буферизации (только бинарный режим)
- 1: построчная буферизация (только текстовый режим)
- >1: размер буфера в байтах

Кодировка (encoding): по умолчанию — locale.getpreferredencoding(False). Для надёжности всегда указывайте явно: encoding='utf-8'.

Рекомендуется использовать как контекстный менеджер (with open(...) as f:) — это гарантирует закрытие файла даже при исключениях.`,
    syntax:
      "open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None)",
    arguments: [
      {
        name: "file",
        description:
          "Путь к файлу (строка, bytes или os.PathLike) или файловый дескриптор (int)",
      },
      {
        name: "mode",
        description:
          "Режим открытия: 'r' (чтение), 'w' (запись), 'a' (добавление), 'x' (создание), 'b' (бинарный), '+' (чтение+запись). По умолчанию 'r'",
      },
      {
        name: "buffering",
        description:
          "Политика буферизации: -1 (по умолчанию), 0 (отключена, только binary), 1 (построчная), >1 (размер буфера)",
      },
      {
        name: "encoding",
        description:
          "Кодировка для текстового режима. Рекомендуется 'utf-8'. По умолчанию — системная",
      },
      {
        name: "errors",
        description:
          "Обработка ошибок кодирования: 'strict' (исключение), 'ignore', 'replace', 'backslashreplace'",
      },
      {
        name: "newline",
        description:
          "Обработка переносов строк: None (универсальный), '', '\\n', '\\r', '\\r\\n'",
      },
      {
        name: "closefd",
        description:
          "Если file — дескриптор (int), closefd=False не закрывает его при закрытии файлового объекта",
      },
      {
        name: "opener",
        description:
          "Пользовательский открыватель файлов: callable(path, flags)",
      },
    ],
    example: `# Чтение всего файла
with open("file.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Чтение строк
with open("file.txt", encoding="utf-8") as f:
    for line in f:       # эффективно: построчное чтение
        print(line.rstrip())

# Запись
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("Hello, World!\\n")
    f.writelines(["line1\\n", "line2\\n"])

# Добавление в конец файла
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("Новая запись\\n")

# Бинарный режим
with open("image.png", "rb") as f:
    data = f.read()

# Безопасное создание (не перезаписывать!)
try:
    with open("new_file.txt", "x") as f:
        f.write("Новый файл")
except FileExistsError:
    print("Файл уже существует")`,
  },
  {
    name: "operator.add(a, b)",
    description: `Возвращает a + b. Функциональный эквивалент оператора + из модуля operator. Находится в модуле operator.

Модуль operator предоставляет функциональные аналоги всех операторов Python. Это полезно когда нужно передать оператор как аргумент функции высшего порядка (map, reduce, sorted и т.д.).

Эквивалентно: operator.add(a, b) == a + b

Другие арифметические функции модуля:
- operator.sub(a, b) — вычитание
- operator.mul(a, b) — умножение
- operator.truediv(a, b) — деление
- operator.floordiv(a, b) — целочисленное деление
- operator.mod(a, b) — остаток от деления
- operator.pow(a, b) — возведение в степень
- operator.neg(a) — унарный минус`,
    syntax: "operator.add(a, b)",
    arguments: [
      { name: "a", description: "Первый операнд" },
      { name: "b", description: "Второй операнд" },
    ],
    example: `import operator
from functools import reduce

# Простое использование
print(operator.add(3, 5))   # 8
print(operator.add("foo", "bar"))  # "foobar" — работает со строками
print(operator.add([1, 2], [3, 4]))  # [1, 2, 3, 4] — конкатенация списков

# Передача в функции высшего порядка
numbers = [1, 2, 3, 4, 5]
total = reduce(operator.add, numbers)  # 15
print(total)

# Сравнение: lambda vs operator
# С lambda:
total = reduce(lambda a, b: a + b, numbers)

# С operator (лаконичнее):
total = reduce(operator.add, numbers)

# Список всех арифметических функций
ops = {
    '+': operator.add,
    '-': operator.sub,
    '*': operator.mul,
    '/': operator.truediv,
}
a, b = 10, 3
for symbol, fn in ops.items():
    print(f"10 {symbol} 3 = {fn(a, b)}")`,
  },
  {
    name: "operator.attrgetter(*attrs)",
    description: `Возвращает вызываемый объект, который при вызове f(obj) возвращает атрибут obj.attr. Находится в модуле operator. Используется как ключевая функция в sort/sorted/min/max.

С несколькими атрибутами attrgetter('attr1', 'attr2') возвращает кортеж (obj.attr1, obj.attr2).

Поддерживает вложенные атрибуты через точку: attrgetter('a.b.c') эквивалентно lambda obj: obj.a.b.c.

Преимущество перед lambda: быстрее (реализован на C), читаемее при нескольких атрибутах.

Отличие от operator.itemgetter():
- attrgetter — доступ по атрибуту (obj.attr)
- itemgetter — доступ по ключу/индексу (obj[key])`,
    syntax: "operator.attrgetter(*attrs)",
    arguments: [
      {
        name: "*attrs",
        description:
          "Один или несколько имён атрибутов для извлечения. Поддерживает вложенные атрибуты через точку",
      },
    ],
    example: `import operator
from dataclasses import dataclass

@dataclass
class Employee:
    name: str
    department: str
    salary: float

employees = [
    Employee("Алиса", "Разработка", 120000),
    Employee("Боб",   "Маркетинг",  80000),
    Employee("Вера",  "Разработка",  95000),
    Employee("Гриша", "Маркетинг", 110000),
]

# Сортировка по одному атрибуту
by_salary = sorted(employees, key=operator.attrgetter("salary"))
for e in by_salary:
    print(f"{e.name}: {e.salary}")

# Сортировка по нескольким атрибутам: сначала отдел, потом зарплата
by_dept_salary = sorted(employees,
    key=operator.attrgetter("department", "salary"))

# Вложенные атрибуты
@dataclass
class Address:
    city: str

@dataclass
class Person:
    name: str
    address: Address

people = [
    Person("Анна", Address("Москва")),
    Person("Иван", Address("Казань")),
]
by_city = sorted(people, key=operator.attrgetter("address.city"))

# Использование с max/min
richest = max(employees, key=operator.attrgetter("salary"))
print(richest.name)  # Алиса`,
  },
  {
    name: "operator.itemgetter(*items)",
    description: `Возвращает вызываемый объект, который при вызове f(obj) возвращает obj[item]. Находится в модуле operator. Используется как ключевая функция в sort/sorted/min/max или для извлечения данных через map.

С несколькими аргументами itemgetter(0, 2) возвращает кортеж (obj[0], obj[2]).

Работает с любыми объектами, поддерживающими оператор [] — списки, кортежи, словари, строки.

Преимущество перед lambda: быстрее (реализован на C), лаконичнее записывается.

Отличие от operator.attrgetter():
- itemgetter — доступ по ключу/индексу (obj[key])
- attrgetter — доступ по атрибуту (obj.attr)`,
    syntax: "operator.itemgetter(*items)",
    arguments: [
      {
        name: "*items",
        description: "Один или несколько ключей/индексов для извлечения",
      },
    ],
    example: `import operator
from functools import reduce

# Сортировка списка кортежей по второму элементу
data = [("яблоко", 3), ("банан", 1), ("вишня", 2)]
sorted_data = sorted(data, key=operator.itemgetter(1))
print(sorted_data)  # [('банан', 1), ('вишня', 2), ('яблоко', 3)]

# Сортировка списка словарей
students = [
    {"name": "Алиса", "grade": 5, "age": 20},
    {"name": "Боб",   "grade": 3, "age": 22},
    {"name": "Вера",  "grade": 4, "age": 21},
]
by_grade = sorted(students, key=operator.itemgetter("grade"), reverse=True)
print([s["name"] for s in by_grade])  # ['Алиса', 'Вера', 'Боб']

# Несколько ключей — сортировка по нескольким полям
by_grade_age = sorted(students,
    key=operator.itemgetter("grade", "age"))

# Извлечение через map
rows = [(1, "a", 10), (2, "b", 20), (3, "c", 30)]
third_col = list(map(operator.itemgetter(2), rows))
print(third_col)  # [10, 20, 30]

# Доступ по индексу — удобен для итерируемых объектов
first = operator.itemgetter(0)
print(first("hello"))  # 'h'
print(first([10, 20, 30]))  # 10`,
  },
  {
    name: "operator.methodcaller(name, /, *args, **kwargs)",
    description: `Возвращает вызываемый объект, который при вызове f(obj) выполняет obj.method(*args, **kwargs). Находится в модуле operator.

Полезно для передачи вызова метода с аргументами в функции высшего порядка (map, filter, sorted и т.д.) без написания lambda.

Эквивалентно: operator.methodcaller('name', args)(obj) == obj.name(args)

Преимущество перед lambda: явнее выражает намерение, быстрее при C-реализации.`,
    syntax: "operator.methodcaller(name, /, *args, **kwargs)",
    arguments: [
      { name: "name", description: "Имя метода для вызова (строка)" },
      {
        name: "*args",
        description:
          "Необязательные позиционные аргументы, передаваемые в метод",
      },
      {
        name: "**kwargs",
        description:
          "Необязательные именованные аргументы, передаваемые в метод",
      },
    ],
    example: `import operator

# Простой вызов метода
upcase = operator.methodcaller("upper")
print(upcase("hello"))  # 'HELLO'

# Аналог lambda
# lambda s: s.upper()  ==  operator.methodcaller("upper")

# Метод с аргументами
stripper = operator.methodcaller("strip", "!")
print(stripper("!!!hello!!!"))  # 'hello'

# Использование с map
words = ["hello", "world", "python"]
upper_words = list(map(operator.methodcaller("upper"), words))
print(upper_words)  # ['HELLO', 'WORLD', 'PYTHON']

# Сортировка по результату вызова метода
strings = ["banana", "apple", "cherry", "date"]
sorted_by_len = sorted(strings, key=operator.methodcaller("__len__"))
print(sorted_by_len)  # ['date', 'apple', 'banana', 'cherry']

# Метод split с аргументом
csv_rows = ["a,b,c", "d,e,f", "g,h,i"]
splitter = operator.methodcaller("split", ",")
parsed = list(map(splitter, csv_rows))
print(parsed)  # [['a','b','c'], ['d','e','f'], ['g','h','i']]

# Цепочка через map + filter
sentences = ["Hello world", "foo", "Python is great"]
long_words = list(filter(
    operator.methodcaller("__len__"),  # отфильтровать непустые
    map(operator.methodcaller("upper"), sentences)
))`,
  },
  {
    name: "operator.mul(a, b)",
    description: `Возвращает a * b. Функциональный эквивалент оператора * из модуля operator.

Работает с числами (умножение), строками (str * n), списками (list * n) и любыми объектами, определяющими __mul__.

Полезен при передаче умножения как функции в reduce, map и другие функции высшего порядка.

Эквивалентно: operator.mul(a, b) == a * b`,
    syntax: "operator.mul(a, b)",
    arguments: [
      { name: "a", description: "Первый операнд" },
      { name: "b", description: "Второй операнд" },
    ],
    example: `import operator
from functools import reduce

# Числа
print(operator.mul(3, 4))    # 12
print(operator.mul(2.5, 4))  # 10.0

# Строки и списки
print(operator.mul("ab", 3))     # 'ababab'
print(operator.mul([1, 2], 3))   # [1, 2, 1, 2, 1, 2]

# Факториал через reduce
def factorial(n):
    return reduce(operator.mul, range(1, n + 1), 1)

print(factorial(5))   # 120
print(factorial(10))  # 3628800

# Произведение всех элементов списка
nums = [1, 2, 3, 4, 5]
product = reduce(operator.mul, nums)
print(product)  # 120

# Использование в map
pairs = [(2, 3), (4, 5), (6, 7)]
products = list(map(lambda p: operator.mul(*p), pairs))
print(products)  # [6, 20, 42]`,
  },
  {
    name: "operator.sub(a, b)",
    description: `Возвращает a - b. Функциональный эквивалент оператора - из модуля operator.

Полезен при передаче вычитания как функции в reduce, sorted и другие функции высшего порядка.

Эквивалентно: operator.sub(a, b) == a - b`,
    syntax: "operator.sub(a, b)",
    arguments: [
      { name: "a", description: "Уменьшаемое" },
      { name: "b", description: "Вычитаемое" },
    ],
    example: `import operator
from functools import reduce

# Простое использование
print(operator.sub(10, 3))   # 7
print(operator.sub(5.5, 2.1))  # 3.4

# Разница: первый минус все остальные
nums = [100, 10, 20, 5]
result = reduce(operator.sub, nums)  # ((100 - 10) - 20) - 5 = 65
print(result)

# Вычисление разниц последовательных элементов
values = [1, 4, 9, 16, 25]
diffs = list(map(operator.sub, values[1:], values[:-1]))
print(diffs)  # [3, 5, 7, 9] — разницы

# В качестве ключа сортировки (разница от значения)
target = 10
numbers = [3, 15, 7, 12, 1]
closest = sorted(numbers, key=lambda x: abs(operator.sub(x, target)))
print(closest)  # [12, 7, 15, 3, 1] — по близости к 10`,
  },
  {
    name: "operator.truediv(a, b)",
    description: `Возвращает a / b (деление с плавающей запятой). Функциональный эквивалент оператора / из модуля operator.

Всегда возвращает float, даже если оба аргумента целые. Для целочисленного деления используйте operator.floordiv(a, b) (аналог a // b).

Вызывает ZeroDivisionError при b == 0.

Эквивалентно: operator.truediv(a, b) == a / b`,
    syntax: "operator.truediv(a, b)",
    arguments: [
      { name: "a", description: "Делимое" },
      { name: "b", description: "Делитель (не должен быть 0)" },
    ],
    example: `import operator
from functools import reduce

# Простое использование
print(operator.truediv(10, 3))   # 3.3333...
print(operator.truediv(10, 2))   # 5.0 — всегда float!
print(operator.truediv(7, 2))    # 3.5

# Отличие от floordiv
print(operator.truediv(7, 2))    # 3.5
print(operator.floordiv(7, 2))   # 3

# Среднее через reduce + truediv
nums = [10, 20, 30, 40]
total = reduce(operator.add, nums)
avg = operator.truediv(total, len(nums))
print(avg)  # 25.0

# Нормализация данных
data = [100, 200, 150, 250]
max_val = max(data)
normalized = [operator.truediv(x, max_val) for x in data]
print(normalized)  # [0.4, 0.8, 0.6, 1.0]

# Безопасное деление
def safe_div(a, b):
    try:
        return operator.truediv(a, b)
    except ZeroDivisionError:
        return float('inf')`,
  },
  {
    name: "ord(c)",
    description: `Возвращает целое число — кодовую точку Unicode для заданного символа. Является обратной функцией к chr().

ord() принимает строку длиной ровно 1 (один символ). Если строка пуста или длиннее одного символа, возникает TypeError.

Диапазон возвращаемых значений: от 0 до 1 114 111 (0x10FFFF) — весь диапазон Unicode.

Для символов ASCII (0–127) значение совпадает с их ASCII-кодом:
- Заглавные буквы: A=65, B=66, ..., Z=90
- Строчные буквы: a=97, b=98, ..., z=122
- Цифры: '0'=48, ..., '9'=57
- Специальные: '\n'=10, ' '=32, '!'=33

Применение:
- Работа с криптографией и шифрованием
- Сравнение символов по порядку
- Проверка диапазонов символов (is_alpha, is_digit вручную)
- Генерация и обработка текстовых данных
- Работа с Unicode: понять, к какому блоку принадлежит символ`,
    syntax: "ord(c)",
    arguments: [
      { name: "c", description: "Строка из ровно одного символа Unicode" },
    ],
    example: `ord('a')      # 97
ord('A')      # 65
ord('0')      # 48
ord(' ')      # 32
ord('\\n')     # 10
ord('€')      # 8364
ord('П')      # 1055  (кириллица)
ord('中')     # 20013  (китайский)

# Шифр Цезаря
def caesar(text, shift):
    result = []
    for ch in text:
        if ch.isalpha():
            base = ord('a') if ch.islower() else ord('A')
            shifted = (ord(ch) - base + shift) % 26 + base
            result.append(chr(shifted))
        else:
            result.append(ch)
    return ''.join(result)

caesar("Hello, World!", 3)  # 'Khoor, Zruog!'

# Проверка диапазона
ch = 'g'
ord('a') <= ord(ch) <= ord('z')  # True — строчная буква`,
  },
  {
    name: "os.environ.get(key[, default])",
    description: `Возвращает значение переменной окружения key из словаря os.environ. Если переменная не найдена — возвращает default вместо исключения. Является вызовом метода .get() на объекте os.environ, который ведёт себя как обычный словарь.

os.environ — это объект типа Mapping, отражающий текущее состояние переменных окружения процесса. Изменения через os.environ влияют на дочерние процессы, запущенные из данной программы.

Разница между os.environ.get() и os.getenv():
- Оба эквивалентны по поведению
- os.getenv() — более удобный синтаксис (одна функция вместо атрибута объекта)
- os.environ.get() позволяет также использовать другие методы словаря: .keys(), .items(), .pop() и т.д.

Также можно обращаться напрямую: os.environ["KEY"] — но это выбросит KeyError если ключ отсутствует.`,
    syntax: "os.environ.get(key[, default])",
    arguments: [
      { name: "key", description: "Имя переменной окружения (строка)" },
      {
        name: "default",
        description:
          "Необязательный. Значение по умолчанию, если переменная не найдена. По умолчанию None",
      },
    ],
    example: `import os

# Безопасный доступ — без KeyError
host = os.environ.get("DB_HOST", "localhost")
port = os.environ.get("DB_PORT", "5432")
print(f"Connect to {host}:{port}")

# Доступ без значения по умолчанию
api_key = os.environ.get("API_KEY")
if api_key is None:
    raise EnvironmentError("API_KEY не установлена")

# Перебор всех переменных окружения
for key, value in os.environ.items():
    if key.startswith("PYTHON"):
        print(f"{key} = {value}")

# Временное изменение (для тестов)
os.environ["MY_VAR"] = "test_value"
print(os.environ.get("MY_VAR"))  # "test_value"
del os.environ["MY_VAR"]
print(os.environ.get("MY_VAR"))  # None`,
  },
  {
    name: "os.getenv(key[, default])",
    description: `Возвращает значение переменной окружения key. Если переменная не установлена — возвращает default. Более компактный аналог os.environ.get(key, default).

Функция удобна для получения одной переменной. Для работы с несколькими переменными или для изменения окружения используйте os.environ напрямую.

Важно: os.getenv() не позволяет устанавливать переменные — только читать. Для установки используйте os.environ[key] = value или os.putenv(key, value).`,
    syntax: "os.getenv(key, default=None)",
    arguments: [
      { name: "key", description: "Имя переменной окружения (строка)" },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое если переменная не найдена. По умолчанию None",
      },
    ],
    example: `import os

# Простое чтение с fallback
debug = os.getenv("DEBUG", "false")
print(debug)  # значение переменной или "false"

# Типичный паттерн конфигурации
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///local.db")
SECRET_KEY = os.getenv("SECRET_KEY")
PORT = int(os.getenv("PORT", "8000"))

if SECRET_KEY is None:
    raise ValueError("Необходимо установить SECRET_KEY")

# Отличие от прямого доступа через []
# os.environ["MISSING"]        → KeyError
# os.getenv("MISSING")         → None
# os.getenv("MISSING", "def")  → "def"

# Установка переменной (не через getenv!)
os.environ["NEW_VAR"] = "value"
print(os.getenv("NEW_VAR"))  # "value"`,
  },
  {
    name: "os.listdir([path])",
    description: `Возвращает список имён файлов и директорий в указанной директории path. Порядок элементов произвольный (не сортируется). Не рекурсивный — возвращает только прямые вложения.

Если path не указан — используется текущая рабочая директория (аналог '.').

Возвращаемые имена — только имена файлов, не полные пути. Для получения полного пути используйте os.path.join(path, name).

Скрытые файлы (начинающиеся с '.') включаются в вывод, в отличие от поведения командной строки ls без флага -a.

Для рекурсивного обхода директорий используйте os.walk(). Для glob-паттернов — модуль glob или pathlib.Path.glob().`,
    syntax: 'os.listdir(path=".")',
    arguments: [
      {
        name: "path",
        description:
          "Необязательный. Путь к директории. По умолчанию — текущая рабочая директория",
      },
    ],
    example: `import os

# Список файлов в текущей директории
files = os.listdir()
print(files)  # ['main.py', 'README.md', '.git', 'data', ...]

# Список файлов в указанной директории
files = os.listdir("/tmp")
print(files)

# Только файлы (без поддиректорий)
path = "."
only_files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
print(only_files)

# Только Python-файлы
py_files = [f for f in os.listdir(".") if f.endswith(".py")]
print(py_files)

# Полные пути к файлам
base = "/etc"
full_paths = [os.path.join(base, name) for name in os.listdir(base)]

# Подсчёт файлов и директорий
items = os.listdir(".")
dirs  = [x for x in items if os.path.isdir(x)]
files = [x for x in items if os.path.isfile(x)]
print(f"Директорий: {len(dirs)}, файлов: {len(files)}")`,
  },
  {
    name: "os.path.exists(path)",
    description: `Возвращает True если путь path ссылается на существующий объект файловой системы (файл, директорию, символическую ссылку). Возвращает False если объект не существует или нет прав на проверку.

Важные особенности:
- Возвращает True для файлов, директорий и символических ссылок
- Возвращает False для битых (broken) символических ссылок
- Не вызывает исключений при отсутствии прав доступа — просто возвращает False

Для более специфичных проверок используйте:
- os.path.isfile(path) — только файлы
- os.path.isdir(path) — только директории
- os.path.islink(path) — только символические ссылки`,
    syntax: "os.path.exists(path)",
    arguments: [
      {
        name: "path",
        description:
          "Строка или path-like объект — путь для проверки существования",
      },
    ],
    example: `import os

# Проверка существования файла
if os.path.exists("config.json"):
    with open("config.json") as f:
        config = f.read()
else:
    config = "{}"

# Проверка перед созданием директории
log_dir = "/var/log/myapp"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Проверка перед удалением
import os
filename = "temp_data.csv"
if os.path.exists(filename):
    os.remove(filename)
    print(f"{filename} удалён")
else:
    print(f"{filename} не найден")

# Проверка наличия конфигурационных файлов
configs = ["prod.env", "staging.env", "dev.env"]
available = [c for c in configs if os.path.exists(c)]
print(f"Найдено конфигов: {available}")`,
  },
  {
    name: "os.path.isdir(path)",
    description: `Возвращает True если path является существующей директорией. Разрешает символические ссылки — если path — символическая ссылка на директорию, возвращает True.

Возвращает False если path не существует, является файлом, битой символической ссылкой или при ошибке доступа.

Полезно для разграничения файлов и директорий при обходе файловой системы. Часто используется совместно с os.listdir() или os.walk().`,
    syntax: "os.path.isdir(path)",
    arguments: [
      {
        name: "path",
        description: "Строка или path-like объект — путь для проверки",
      },
    ],
    example: `import os

# Проверка что путь — директория
path = "/usr/local"
if os.path.isdir(path):
    print(f"{path} — директория")
    print(os.listdir(path))

# Фильтрация: только субдиректории
base = "."
subdirs = [d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d))]
print("Поддиректории:", subdirs)

# Проверка перед чтением файлов в директории
def process_directory(path):
    if not os.path.isdir(path):
        raise ValueError(f"'{path}' не является директорией")
    for filename in os.listdir(path):
        filepath = os.path.join(path, filename)
        if os.path.isfile(filepath):
            print(f"Обрабатываю файл: {filename}")

# Убедиться что назначение — директория
dest = "output"
if not os.path.isdir(dest):
    os.makedirs(dest)  # создать если не существует`,
  },
  {
    name: "os.path.isfile(path)",
    description: `Возвращает True если path является существующим обычным файлом. Разрешает символические ссылки — если path — символическая ссылка на файл, возвращает True.

Возвращает False если path не существует, является директорией, устройством, сокетом или при ошибке доступа.

Является наиболее частой проверкой при работе с файлами — позволяет убедиться, что по пути находится именно файл перед его открытием или обработкой.`,
    syntax: "os.path.isfile(path)",
    arguments: [
      {
        name: "path",
        description: "Строка или path-like объект — путь для проверки",
      },
    ],
    example: `import os

# Проверка перед открытием файла
filepath = "data.csv"
if os.path.isfile(filepath):
    with open(filepath) as f:
        data = f.read()
else:
    print(f"Файл {filepath} не найден")

# Рекурсивный поиск файлов с расширением
def find_files(directory, extension):
    result = []
    for name in os.listdir(directory):
        full_path = os.path.join(directory, name)
        if os.path.isfile(full_path) and name.endswith(extension):
            result.append(full_path)
    return result

py_files = find_files(".", ".py")
print(py_files)

# Отделить файлы от директорий
items = os.listdir(".")
files = [x for x in items if os.path.isfile(x)]
dirs  = [x for x in items if os.path.isdir(x)]
other = [x for x in items if not os.path.isfile(x) and not os.path.isdir(x)]`,
  },
  {
    name: "os.path.join(path, *paths)",
    description: `Соединяет компоненты пути в единый путь, используя правильный разделитель для текущей операционной системы. На Unix/macOS — '/', на Windows — '\\'.

Ключевые правила:
- Если компонент является абсолютным путём — все предыдущие компоненты отбрасываются
- Пустые компоненты игнорируются (кроме последнего)
- Не проверяет, существует ли путь

Применение — единственный правильный способ составления путей: никогда не используйте конкатенацию строк (path + "/" + name) — это не переносимо и ошибочно при наличии завершающих слешей.`,
    syntax: "os.path.join(path, *paths)",
    arguments: [
      { name: "path", description: "Первый компонент пути" },
      {
        name: "*paths",
        description: "Один или несколько компонентов пути для присоединения",
      },
    ],
    example: `import os

# Базовое использование
os.path.join("home", "user", "documents")
# "home/user/documents"  (Unix)

os.path.join("/home", "user", "file.txt")
# "/home/user/file.txt"

# Абсолютный компонент сбрасывает всё предыдущее
os.path.join("/foo", "/bar", "baz")
# "/bar/baz"  — /foo отброшен!

# Практическое применение — сборка путей к файлам
base_dir = "/var/data"
subdir = "2024"
filename = "report.csv"
full_path = os.path.join(base_dir, subdir, filename)
print(full_path)  # /var/data/2024/report.csv

# Динамическая сборка пути из переменных
import os
home = os.path.expanduser("~")  # домашняя директория
config_path = os.path.join(home, ".config", "myapp", "settings.json")

# Перебор файлов с полным путём
for name in os.listdir("."):
    full = os.path.join(".", name)
    print(full)`,
  },
  {
    name: "pathlib.Path(path)",
    description: `Создаёт объект Path — объектно-ориентированное представление пути файловой системы. Находится в модуле pathlib (Python 3.4+). На Unix создаётся PosixPath, на Windows — WindowsPath.

pathlib.Path является современной альтернативой работе со строками путей через os.path. Предоставляет удобный API: конкатенация через оператор /, методы для чтения/записи, проверки существования и т.д.

Основные операции:
- Path('/dir') / 'subdir' / 'file.txt' — конкатенация путей через /
- path.parent — родительская директория
- path.name — имя файла с расширением
- path.stem — имя файла без расширения
- path.suffix — расширение файла
- path.parts — кортеж всех компонентов пути
- str(path) — преобразование в строку

Можно создать от строки, другого Path или текущей директории: Path.cwd() / Path.home().`,
    syntax: "pathlib.Path(path)",
    arguments: [
      {
        name: "path",
        description:
          "Строка, другой объект Path или os.PathLike, представляющий путь файловой системы",
      },
    ],
    example: `from pathlib import Path

# Создание объектов Path
p = Path("/home/user/documents/file.txt")
p = Path("relative/path/to/file.py")
p = Path(".")          # текущая директория

# Конкатенация путей через /
base = Path("/home/user")
config = base / ".config" / "myapp" / "settings.json"
print(config)  # /home/user/.config/myapp/settings.json

# Компоненты пути
p = Path("/home/user/report.tar.gz")
print(p.parent)   # /home/user
print(p.name)     # report.tar.gz
print(p.stem)     # report.tar
print(p.suffix)   # .gz
print(p.suffixes) # ['.tar', '.gz']
print(p.parts)    # ('/', 'home', 'user', 'report.tar.gz')

# Специальные директории
home = Path.home()     # домашняя директория (~)
cwd  = Path.cwd()      # текущая рабочая директория

# Абсолютный путь
relative = Path("data/file.csv")
absolute = relative.resolve()  # абсолютный путь с разрешением symlinks
print(absolute)

# Glob-паттерны
src = Path("src")
py_files = list(src.glob("**/*.py"))  # рекурсивный поиск всех .py файлов`,
  },
  {
    name: "pathlib.Path.exists()",
    description: `Возвращает True если путь указывает на существующий объект файловой системы (файл, директорию, символическую ссылку). Возвращает False если объект не существует или нет прав доступа.

Эквивалент os.path.exists(), но в объектно-ориентированном стиле.

Особенности:
- Возвращает True для файлов, директорий и символических ссылок
- Возвращает False для битых (broken) символических ссылок
- Не вызывает исключений — при ошибке доступа просто возвращает False

Для более специфичных проверок: Path.is_file(), Path.is_dir(), Path.is_symlink().`,
    syntax: "Path.exists()",
    arguments: [],
    example: `from pathlib import Path

# Проверка существования файла
config = Path("config.json")
if config.exists():
    text = config.read_text()
else:
    text = "{}"

# Проверка перед удалением
log_file = Path("app.log")
if log_file.exists():
    log_file.unlink()  # удалить файл
    print("Лог удалён")

# Создание директории если не существует
data_dir = Path("data/output")
if not data_dir.exists():
    data_dir.mkdir(parents=True)

# Проверка нескольких путей
required = [Path("config.toml"), Path("data/"), Path(".env")]
missing = [p for p in required if not p.exists()]
if missing:
    print(f"Отсутствуют: {missing}")`,
  },
  {
    name: "pathlib.Path.is_dir()",
    description: `Возвращает True если путь указывает на существующую директорию. Разрешает символические ссылки — если путь является символической ссылкой на директорию, возвращает True.

Возвращает False если путь не существует, является файлом, битой символической ссылкой или при ошибке доступа.

Эквивалент os.path.isdir() в объектно-ориентированном стиле. Полезно для разграничения файлов и директорий при обходе файловой системы.`,
    syntax: "Path.is_dir()",
    arguments: [],
    example: `from pathlib import Path

# Проверка что путь — директория
p = Path("/usr/local")
if p.is_dir():
    print(f"{p} — директория")
    for item in p.iterdir():
        print(item.name)

# Только поддиректории
base = Path(".")
subdirs = [d for d in base.iterdir() if d.is_dir()]
print("Поддиректории:", [d.name for d in subdirs])

# Проверка перед обходом
def process_dir(path):
    p = Path(path)
    if not p.is_dir():
        raise ValueError(f"'{p}' не является директорией")
    for item in p.iterdir():
        if item.is_file():
            print(f"Файл: {item.name}")
        elif item.is_dir():
            print(f"Папка: {item.name}/")

# Убедиться что назначение — директория
dest = Path("output")
if not dest.is_dir():
    dest.mkdir(parents=True)`,
  },
  {
    name: "pathlib.Path.is_file()",
    description: `Возвращает True если путь указывает на существующий обычный файл. Разрешает символические ссылки — если путь является символической ссылкой на файл, возвращает True.

Возвращает False если путь не существует, является директорией, устройством, сокетом или при ошибке доступа.

Эквивалент os.path.isfile() в объектно-ориентированном стиле. Наиболее частая проверка при работе с файлами.`,
    syntax: "Path.is_file()",
    arguments: [],
    example: `from pathlib import Path

# Проверка перед чтением файла
filepath = Path("data.csv")
if filepath.is_file():
    content = filepath.read_text(encoding="utf-8")
else:
    print(f"Файл {filepath} не найден")

# Рекурсивный поиск файлов с расширением
def find_files(directory, extension):
    return [
        p for p in Path(directory).rglob(f"*{extension}")
        if p.is_file()
    ]

py_files = find_files(".", ".py")
print(py_files)

# Разделить файлы и папки
items = list(Path(".").iterdir())
files = [x for x in items if x.is_file()]
dirs  = [x for x in items if x.is_dir()]
print(f"Файлов: {len(files)}, директорий: {len(dirs)}")

# Вместе с exists() — явная проверка типа
p = Path("output")
if p.exists() and not p.is_file():
    print(f"'{p}' существует, но это не файл")`,
  },
  {
    name: "pathlib.Path.iterdir()",
    description: `Возвращает итератор объектов Path для всех элементов директории. Не рекурсивный — возвращает только прямые вложения (файлы и поддиректории). Порядок элементов произвольный.

Эквивалент os.listdir(), но возвращает объекты Path (а не строки), что позволяет сразу вызывать методы is_file(), is_dir(), read_text() и т.д.

Для рекурсивного обхода используйте Path.rglob('*') или Path.glob('**/*').
Вызывает NotADirectoryError если путь не является директорией.`,
    syntax: "Path.iterdir()",
    arguments: [],
    example: `from pathlib import Path

# Перебор элементов директории
for item in Path(".").iterdir():
    print(item.name, "— файл" if item.is_file() else "— папка")

# Только файлы Python
py_files = [p for p in Path("src").iterdir() if p.suffix == ".py"]

# Разделить файлы и папки
base = Path("project")
files = []
dirs  = []
for item in base.iterdir():
    (files if item.is_file() else dirs).append(item)

print("Файлов:", len(files))
print("Папок:", len(dirs))

# Подсчёт файлов по типу
from collections import Counter
exts = Counter(p.suffix for p in Path(".").iterdir() if p.is_file())
print(exts)  # Counter({'.py': 5, '.txt': 2, '.json': 1})

# Рекурсивный обход через glob
all_py = list(Path(".").rglob("*.py"))
print(f"Всего .py файлов: {len(all_py)}")`,
  },
  {
    name: "pathlib.Path.mkdir(parents=False, exist_ok=False)",
    description: `Создаёт директорию по данному пути. Находится в классе Path модуля pathlib.

Параметры:
- parents=False — если True, создаёт все промежуточные директории (аналог mkdir -p / os.makedirs)
- exist_ok=False — если True, не вызывает ошибку если директория уже существует

Вызывает FileExistsError если директория уже существует и exist_ok=False.
Вызывает FileNotFoundError если промежуточные директории не существуют и parents=False.

Эквивалент os.makedirs(path, exist_ok=True) при parents=True, exist_ok=True.`,
    syntax: "Path.mkdir(mode=0o777, parents=False, exist_ok=False)",
    arguments: [
      {
        name: "mode",
        description: "Необязательный. Права доступа (Unix). По умолчанию 0o777",
      },
      {
        name: "parents",
        description:
          "Если True — создаёт все промежуточные директории. По умолчанию False",
      },
      {
        name: "exist_ok",
        description:
          "Если True — не вызывает ошибку если директория уже есть. По умолчанию False",
      },
    ],
    example: `from pathlib import Path

# Создание простой директории
Path("output").mkdir()

# Безопасное создание (уже существует — не ошибка)
Path("logs").mkdir(exist_ok=True)

# Создание вложенной структуры директорий
Path("data/2024/january").mkdir(parents=True, exist_ok=True)

# Типичный паттерн: убедиться что директория есть
def ensure_dir(path):
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p

output = ensure_dir("results/graphs")
# теперь можно записывать файлы
(output / "chart.png").write_bytes(b"...")

# Создание временной директории
import tempfile
with tempfile.TemporaryDirectory() as tmp:
    work_dir = Path(tmp) / "processing"
    work_dir.mkdir()
    (work_dir / "data.txt").write_text("temp data")
    # по выходу из with — всё удаляется`,
  },
  {
    name: "pathlib.Path.read_text([encoding])",
    description: `Считывает содержимое файла и возвращает его как строку. Удобная однострочная альтернатива конструкции open(path).read(). Находится в классе Path модуля pathlib.

Автоматически открывает и закрывает файл. Если файл не существует — вызывает FileNotFoundError.

Параметр encoding:
- Если не указан — используется кодировка платформы по умолчанию (locale.getpreferredencoding())
- Рекомендуется всегда указывать явно: encoding="utf-8"

Для бинарных файлов используйте Path.read_bytes() — возвращает bytes.
Для записи используйте Path.write_text(data, encoding).`,
    syntax: "Path.read_text(encoding=None, errors=None)",
    arguments: [
      {
        name: "encoding",
        description:
          'Необязательный. Кодировка текста (например "utf-8"). По умолчанию кодировка платформы',
      },
      {
        name: "errors",
        description:
          'Необязательный. Обработка ошибок кодирования ("strict", "ignore", "replace")',
      },
    ],
    example: `from pathlib import Path

# Простое чтение файла
content = Path("readme.txt").read_text(encoding="utf-8")
print(content)

# Чтение конфигурационного JSON
import json
config = json.loads(Path("config.json").read_text(encoding="utf-8"))
print(config["host"])

# Чтение нескольких файлов
log_dir = Path("logs")
all_logs = ""
for log_file in sorted(log_dir.glob("*.log")):
    all_logs += log_file.read_text(encoding="utf-8")

# Обработка ошибок
p = Path("data.csv")
try:
    text = p.read_text(encoding="utf-8")
except FileNotFoundError:
    print(f"Файл {p} не найден")
except UnicodeDecodeError:
    text = p.read_text(encoding="latin-1")  # запасная кодировка

# Сравнение: стандартный open vs pathlib
# Стандартный:
with open("file.txt", encoding="utf-8") as f:
    content = f.read()

# pathlib — короче:
content = Path("file.txt").read_text(encoding="utf-8")`,
  },
  {
    name: "pathlib.Path.write_text(data[, encoding])",
    description: `Записывает строку data в файл, перезаписывая его если существует. Удобная однострочная альтернатива open(path, 'w').write(data). Находится в классе Path модуля pathlib.

Автоматически открывает, записывает и закрывает файл. Если файл не существует — создаёт его. Если директория не существует — вызывает FileNotFoundError.

Возвращает количество записанных символов.

Параметр encoding: рекомендуется всегда указывать явно, например encoding="utf-8".

Для бинарных данных используйте Path.write_bytes(data).
Для дозаписи (append) нужен стандартный open(path, 'a').`,
    syntax: "Path.write_text(data, encoding=None, errors=None)",
    arguments: [
      { name: "data", description: "Строка для записи в файл" },
      {
        name: "encoding",
        description:
          'Необязательный. Кодировка текста (например "utf-8"). По умолчанию кодировка платформы',
      },
      {
        name: "errors",
        description:
          'Необязательный. Обработка ошибок кодирования ("strict", "ignore", "replace")',
      },
    ],
    example: `from pathlib import Path

# Простая запись
Path("output.txt").write_text("Hello, World!", encoding="utf-8")

# Запись JSON
import json
config = {"host": "localhost", "port": 8000, "debug": True}
Path("config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

# Генерация отчёта
report_lines = ["# Отчёт", "", "## Результаты", "- Пункт 1", "- Пункт 2"]
Path("report.md").write_text("\\n".join(report_lines), encoding="utf-8")

# Создание файла в новой директории
output_dir = Path("results/2024")
output_dir.mkdir(parents=True, exist_ok=True)
(output_dir / "summary.txt").write_text("Итоги года", encoding="utf-8")

# Сравнение: стандартный open vs pathlib
# Стандартный:
with open("file.txt", "w", encoding="utf-8") as f:
    f.write("данные")

# pathlib — короче:
Path("file.txt").write_text("данные", encoding="utf-8")

# Дозапись (write_text всегда перезаписывает — для append нужен open)
p = Path("log.txt")
with open(p, "a", encoding="utf-8") as f:
    f.write("новая строка\\n")`,
  },
  {
    name: "pow(base, exp[, mod])",
    description: `Возвращает base в степени exp. При наличии третьего аргумента mod возвращает (base ** exp) % mod — модульное возведение в степень.

Две формы:
1. pow(base, exp) — эквивалентно base ** exp, но может отличаться поведением для целых чисел с отрицательным exp
2. pow(base, exp, mod) — модульное возведение в степень (намного эффективнее, чем (base ** exp) % mod)

Особенности:
- Для int с целым неотрицательным exp результат всегда int (произвольная точность)
- Для int с отрицательным exp (Python 3.8+) — результат float (1 / base**|exp|)
- Трёхаргументная форма требует: base и exp должны быть целыми, mod — положительным целым
- pow(base, -1, mod) вычисляет модульный обратный элемент (используется в криптографии)

Эффективность:
- pow(base, exp, mod) использует алгоритм быстрого возведения в степень (O(log exp)) и вычисляет остаток на каждом шаге, что намного быстрее (base ** exp) % mod для больших чисел

Применение в криптографии: RSA, алгоритм Диффи-Хеллмана, проверка простоты числа (тест Миллера-Рабина).`,
    syntax: "pow(base, exp[, mod])",
    arguments: [
      {
        name: "base",
        description:
          "Основание — число (int или float). В трёхаргументной форме — целое число",
      },
      {
        name: "exp",
        description:
          "Показатель степени — число. В трёхаргументной форме — целое число",
      },
      {
        name: "mod",
        description:
          "Необязательный. Модуль для операции (base ** exp) % mod. Должен быть положительным целым числом",
      },
    ],
    example: `pow(2, 10)          # 1024
pow(3, 3)           # 27
pow(2, -1)          # 0.5  (Python 3.8+)
pow(2, 0.5)         # 1.4142...  (корень из 2)
pow(2, 10, 1000)    # 24  == (2**10) % 1000

# Большие числа — трёхаргументная форма
# Без mod: 2 ** 1000000 — огромное число
# С mod: pow(2, 1000000, 1000) — быстро!
pow(2, 1000000, 1000)   # число < 1000

# Модульный обратный (криптография)
# x такой, что (base * x) % mod == 1
pow(3, -1, 7)       # 5  (потому что 3*5 % 7 == 1)

# RSA-подобное шифрование
p, q = 61, 53
n = p * q          # 3233
e, d = 17, 2753
message = 65
encrypted = pow(message, e, n)  # 2790
decrypted = pow(encrypted, d, n) # 65`,
  },
  {
    name: "print(*objects, sep, end, file, flush)",
    description: `Выводит объекты в текстовый поток (по умолчанию в стандартный вывод sys.stdout), разделяя их sep и добавляя end в конце.

Каждый объект преобразуется в строку с помощью str(). Все нестроковые аргументы автоматически конвертируются.

Параметры:
- sep: разделитель между объектами (по умолчанию ' ', одиночный пробел). При sep='' — без разделителя
- end: строка в конце вывода (по умолчанию '\\n', перенос строки). При end='' — без переноса
- file: файловый объект или объект с методом write(). По умолчанию sys.stdout
- flush: если True — принудительно сбрасывает буфер после вывода (полезно для прогресс-баров и логирования в реальном времени)

print() vs sys.stdout.write():
- print() принимает несколько аргументов, автоматически добавляет разделители и перенос строки
- sys.stdout.write() принимает только строку, не добавляет ничего автоматически

В Python 3 print — функция (в Python 2 был оператором). Для подавления вывода в тестах или заглушки: file=open(os.devnull, 'w') или file=io.StringIO().`,
    syntax: "print(*objects, sep=' ', end='\\n', file=sys.stdout, flush=False)",
    arguments: [
      {
        name: "*objects",
        description:
          "Один или несколько объектов для вывода. Преобразуются в строки через str()",
      },
      {
        name: "sep",
        description:
          "Разделитель между объектами. По умолчанию ' ' (пробел). sep='' — без разделителя, sep='\\n' — каждый с новой строки",
      },
      {
        name: "end",
        description:
          "Строка в конце вывода. По умолчанию '\\n'. end='' — без перевода строки (вывод на той же строке)",
      },
      {
        name: "file",
        description:
          "Объект с методом write(str). По умолчанию sys.stdout. Можно перенаправить в файл, StringIO и т.д.",
      },
      {
        name: "flush",
        description:
          "Если True — принудительно сбрасывает буфер после записи. Полезно для потокового вывода",
      },
    ],
    example: `print("Hello, World!")            # Hello, World!
print("a", "b", "c")             # a b c
print("a", "b", "c", sep="-")    # a-b-c
print("a", "b", "c", sep="")     # abc
print("Loading", end="")
print("...", end="\\n")            # Loading...

# Несколько типов данных
print(42, 3.14, True, None)       # 42 3.14 True None

# Запись в файл
with open("log.txt", "w") as f:
    print("Запись в файл", file=f)

# Запись в stderr
import sys
print("Ошибка!", file=sys.stderr)

# Прогресс-бар в одну строку
import time
for i in range(5):
    print(f"\\rПрогресс: {i+1}/5", end="", flush=True)
    time.sleep(0.3)
print()  # перевод строки в конце`,
  },
  {
    name: "property(fget, fset, fdel, doc)",
    description: `Создаёт управляемый атрибут (descriptor property). Позволяет использовать методы как атрибуты, добавляя логику при чтении, записи и удалении.

Три метода дескриптора:
- fget: вызывается при чтении атрибута (obj.attr)
- fset: вызывается при записи (obj.attr = value)
- fdel: вызывается при удалении (del obj.attr)
- doc: строка документации (если не указана, берётся из fget.__doc__)

Два способа использования:
1. Явный вызов: x = property(get_x, set_x, del_x, "doc")
2. Декоратор @property — более читаемый и распространённый

Зачем нужны property:
- Добавить валидацию при установке значения
- Вычислять значение "на лету" при обращении
- Сделать атрибут только для чтения (без fset)
- Изменить поведение атрибута без изменения интерфейса (обратная совместимость)

property — это дескриптор данных (data descriptor), что означает, что он имеет приоритет над атрибутами экземпляра с тем же именем.`,
    syntax: "property(fget=None, fset=None, fdel=None, doc=None)",
    arguments: [
      {
        name: "fget",
        description:
          "Необязательный. Функция для получения значения атрибута. Принимает self, возвращает значение",
      },
      {
        name: "fset",
        description:
          "Необязательный. Функция для установки значения. Принимает self и новое значение",
      },
      {
        name: "fdel",
        description:
          "Необязательный. Функция для удаления атрибута. Принимает self",
      },
      {
        name: "doc",
        description: "Необязательный. Строка документации для свойства",
      },
    ],
    example: `class Circle:
    def __init__(self, radius):
        self._radius = radius  # приватный атрибут

    @property
    def radius(self):
        """Радиус окружности (только положительные числа)"""
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Радиус не может быть отрицательным")
        self._radius = value

    @radius.deleter
    def radius(self):
        del self._radius

    @property
    def diameter(self):
        return self._radius * 2  # вычисляется динамически

    @property
    def area(self):
        import math
        return math.pi * self._radius ** 2

c = Circle(5)
print(c.radius)     # 5
print(c.diameter)   # 10
print(c.area)       # 78.539...
c.radius = 10       # вызывает setter с валидацией
# c.radius = -1     # ValueError!`,
  },
  {
    name: "random.choice(seq)",
    description: `Возвращает случайный элемент из непустой последовательности seq. Находится в модуле random. Использует равномерное распределение — каждый элемент выбирается с одинаковой вероятностью.

Если seq пустая — вызывает IndexError. Работает с любыми последовательностями, поддерживающими индексирование: list, tuple, str и т.д.

Для выбора нескольких элементов используйте random.choices() (с повторениями) или random.sample() (без повторений).`,
    syntax: "random.choice(seq)",
    arguments: [
      {
        name: "seq",
        description:
          "Непустая последовательность (список, кортеж, строка), из которой выбирается элемент",
      },
    ],
    example: `import random

# Из списка
colors = ["красный", "зелёный", "синий", "жёлтый"]
print(random.choice(colors))  # одно случайное значение

# Из строки (случайный символ)
letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
print(random.choice(letters))  # случайная буква

# Из кортежа
suits = ("♠", "♥", "♦", "♣")
print(random.choice(suits))  # случайная масть

# Игральная карта
ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
card = f"{random.choice(ranks)}{random.choice(suits)}"
print(card)  # например, "K♦"

# Случайное решение
decision = random.choice(["да", "нет", "может быть"])
print(decision)`,
  },
  {
    name: "random.choices(population[, weights, cum_weights, k=1])",
    description: `Возвращает список из k случайных элементов из population с возможностью повторений. Находится в модуле random. Поддерживает взвешенный выбор — элементы с большим весом выбираются чаще.

Параметры weights и cum_weights задают вероятности:
- weights — относительные веса (например, [1, 2, 3] означает вероятности 1/6, 2/6, 3/6)
- cum_weights — накопительные (кумулятивные) веса (например, [1, 3, 6])
- Нельзя указать оба параметра одновременно

Отличие от random.sample():
- choices() — выбор с повторениями (один элемент может быть выбран несколько раз)
- sample() — выбор без повторений (каждый элемент не более одного раза)

Если population пустая — вызывает IndexError.`,
    syntax:
      "random.choices(population, weights=None, *, cum_weights=None, k=1)",
    arguments: [
      {
        name: "population",
        description: "Последовательность, из которой выбираются элементы",
      },
      {
        name: "weights",
        description:
          "Необязательный. Список относительных весов для каждого элемента",
      },
      {
        name: "cum_weights",
        description: "Необязательный. Список кумулятивных весов",
      },
      {
        name: "k",
        description: "Количество выбираемых элементов. По умолчанию 1",
      },
    ],
    example: `import random

# Без весов — равномерно
items = ["a", "b", "c", "d"]
print(random.choices(items, k=3))  # ['c', 'a', 'a'] — повторения возможны

# С весами — взвешенный выбор
loot = ["меч", "щит", "броня", "легендарный меч"]
weights = [50, 30, 15, 5]  # редкость в %
drops = random.choices(loot, weights=weights, k=10)
print(drops)

# Имитация монеты
sides = ["орёл", "решка"]
tosses = random.choices(sides, k=100)
print(f"Орёл: {tosses.count('орёл')}, Решка: {tosses.count('решка')}")

# Генерация случайного пароля
import string
alphabet = string.ascii_letters + string.digits + "!@#$%"
password = "".join(random.choices(alphabet, k=16))
print(password)

# Кумулятивные веса (суммируются слева)
colors = ["красный", "зелёный", "синий"]
result = random.choices(colors, cum_weights=[10, 40, 100], k=5)
# 10% красный, 30% зелёный, 60% синий`,
  },
  {
    name: "random.randint(a, b)",
    description: `Возвращает случайное целое число N такое, что a ≤ N ≤ b. Оба конца диапазона включительно. Находится в модуле random. Эквивалентно random.randrange(a, b+1).

Часто используется для генерации случайных индексов, бросания кубика, генерации случайных чисел в тестах и симуляциях.

Если a > b — вызывает ValueError.`,
    syntax: "random.randint(a, b)",
    arguments: [
      { name: "a", description: "Нижняя граница диапазона (включительно)" },
      { name: "b", description: "Верхняя граница диапазона (включительно)" },
    ],
    example: `import random

# Случайное число от 1 до 6 (кубик)
dice = random.randint(1, 6)
print(f"Выпало: {dice}")

# Случайное число от 0 до 100
score = random.randint(0, 100)

# Бросок двух кубиков
die1 = random.randint(1, 6)
die2 = random.randint(1, 6)
print(f"Кубики: {die1} + {die2} = {die1 + die2}")

# Случайный индекс списка
items = ["a", "b", "c", "d", "e"]
idx = random.randint(0, len(items) - 1)
print(items[idx])  # равносильно random.choice(items)

# Симуляция: 1000 бросков монеты
results = [random.randint(0, 1) for _ in range(1000)]
print(f"Орёл (0): {results.count(0)}, Решка (1): {results.count(1)}")

# Случайный год
year = random.randint(1900, 2024)
print(year)`,
  },
  {
    name: "random.random()",
    description: `Возвращает случайное вещественное число в диапазоне [0.0, 1.0) — то есть от 0.0 включительно до 1.0 не включительно. Находится в модуле random. Использует алгоритм Mersenne Twister.

Базовая функция генератора псевдослучайных чисел. Все остальные функции модуля random основаны на ней.

Для получения числа в произвольном диапазоне [a, b) используйте: a + (b - a) * random.random()
Или встроенную random.uniform(a, b).

Не предназначена для криптографических целей — используйте модуль secrets для генерации криптографически безопасных случайных чисел.`,
    syntax: "random.random()",
    arguments: [],
    example: `import random

# Базовое использование
x = random.random()
print(x)  # например, 0.7234512...  (от 0.0 до 0.999...)

# Масштабирование в диапазон [a, b)
def rand_range(a, b):
    return a + (b - a) * random.random()

print(rand_range(10, 20))  # случайное число в [10, 20)

# Вероятностные проверки
def event_happens(probability):
    """Возвращает True с заданной вероятностью (0.0 — 1.0)"""
    return random.random() < probability

# Событие с вероятностью 30%
for _ in range(5):
    print(event_happens(0.3))

# Симуляция: доля успехов при вероятности 70%
trials = 10000
successes = sum(1 for _ in range(trials) if random.random() < 0.7)
print(f"Успехов: {successes}/{trials} = {successes/trials:.2%}")`,
  },
  {
    name: "random.sample(population, k)",
    description: `Возвращает список из k уникальных элементов, случайно выбранных из population без повторений. Находится в модуле random. Оригинальный population не изменяется.

Отличие от random.choices():
- sample() — без повторений (каждый элемент не более одного раза)
- choices() — с повторениями (один элемент может встретиться несколько раз)

Если k > len(population) — вызывает ValueError.

Начиная с Python 3.9, population может быть множеством (set) или словарём, но для воспроизводимости рекомендуется использовать последовательности.

Применение: выбор победителей лотереи, выборка данных для тестирования, случайное разбиение на группы.`,
    syntax: "random.sample(population, k)",
    arguments: [
      {
        name: "population",
        description:
          "Последовательность или множество, из которого производится выборка",
      },
      {
        name: "k",
        description:
          "Количество элементов для выборки (не более len(population))",
      },
    ],
    example: `import random

# Лотерея: 6 чисел из 45
lottery = random.sample(range(1, 46), 6)
print(sorted(lottery))  # например, [3, 12, 19, 27, 34, 41]

# Случайная подвыборка из списка
students = ["Анна", "Борис", "Вера", "Георгий", "Дарья", "Егор"]
group = random.sample(students, 3)
print("Выбранная группа:", group)  # без повторений

# Перемешать список (альтернатива shuffle — не изменяет оригинал)
original = [1, 2, 3, 4, 5]
shuffled = random.sample(original, len(original))
print(original)   # [1, 2, 3, 4, 5] — не изменён!
print(shuffled)   # [3, 1, 5, 2, 4] — перемешан

# Случайная выборка из диапазона (эффективно для больших диапазонов)
indices = random.sample(range(1_000_000), 10)
print(indices)  # 10 уникальных чисел из миллиона, без создания списка

# k=1 — аналог choice, но возвращает список
winner = random.sample(students, 1)[0]
print(f"Победитель: {winner}")`,
  },
  {
    name: "random.shuffle(x)",
    description: `Перемешивает элементы последовательности x на месте (in-place). Находится в модуле random. Изменяет оригинальный список — не создаёт новый.

Важно: shuffle работает только с изменяемыми последовательностями (list). Для кортежей и строк нужно сначала преобразовать в список.

Для получения перемешанной копии без изменения оригинала используйте random.sample(x, len(x)).

Воспроизводимость: можно зафиксировать начальное состояние через random.seed(), чтобы получать одинаковые результаты при повторных запусках.`,
    syntax: "random.shuffle(x)",
    arguments: [
      {
        name: "x",
        description:
          "Изменяемая последовательность (список), которую нужно перемешать",
      },
    ],
    example: `import random

# Перемешать колоду карт
deck = list(range(52))  # карты 0..51
random.shuffle(deck)
print(deck[:5])  # первые 5 карт после перемешивания

# Перемешать список строк
players = ["Алиса", "Боб", "Карлос", "Диана"]
random.shuffle(players)
print("Порядок хода:", players)

# Перемешать копию (без изменения оригинала)
original = [1, 2, 3, 4, 5]
shuffled = original.copy()
random.shuffle(shuffled)
print("Оригинал:", original)  # [1, 2, 3, 4, 5]
print("Перемешан:", shuffled) # [3, 1, 5, 2, 4]

# Воспроизводимое перемешивание (seed)
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
random.seed(42)
random.shuffle(data)
print(data)  # всегда один и тот же результат при seed=42

# Строку нельзя shuffle напрямую
s = "hello"
chars = list(s)
random.shuffle(chars)
print("".join(chars))  # "lhelo" или другой вариант`,
  },
  {
    name: "range(stop) / range(start, stop[, step])",
    description: `Возвращает объект range — неизменяемую последовательность чисел. Чаще всего используется для создания циклов с заданным числом итераций.

Три формы:
1. range(stop) — числа от 0 до stop-1
2. range(start, stop) — числа от start до stop-1
3. range(start, stop, step) — с шагом step

Важные особенности:
- range создаёт не список, а ленивый объект — числа вычисляются по запросу
- Очень эффективен по памяти: range(1_000_000) занимает столько же памяти, что range(5)
- Поддерживает срезы, len(), in, reversed(), индексирование — все за O(1)
- step может быть отрицательным — для убывающих последовательностей
- Аргументы должны быть целыми числами

Сравнение с numpy.arange():
- range() только целые числа, numpy.arange() — любые числа включая float
- range() встроен, numpy.arange() — внешняя библиотека

range не включает stop (верхняя граница не входит) — это стандартное поведение для срезов и диапазонов в Python.`,
    syntax: "range(stop)\nrange(start, stop[, step])",
    arguments: [
      {
        name: "start",
        description:
          "Необязательный. Начало диапазона (включительно). По умолчанию 0",
      },
      {
        name: "stop",
        description:
          "Конец диапазона (не включается). Единственный обязательный аргумент",
      },
      {
        name: "step",
        description:
          "Необязательный. Шаг. По умолчанию 1. Может быть отрицательным. Не может быть 0 (ValueError)",
      },
    ],
    example: `list(range(5))          # [0, 1, 2, 3, 4]
list(range(1, 6))       # [1, 2, 3, 4, 5]
list(range(0, 10, 2))   # [0, 2, 4, 6, 8]
list(range(10, 0, -1))  # [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
list(range(5, 5))       # []  (пустой диапазон)

# Эффективность памяти
r = range(1_000_000)
5 in r        # True  — O(1), не перебирает все элементы!
len(r)        # 1000000

# Индексирование и срезы
r = range(0, 20, 2)
r[3]          # 6
r[-1]         # 18
list(r[2:5])  # [4, 6, 8]

# Обратный обход
for i in reversed(range(5)):
    print(i)   # 4, 3, 2, 1, 0

# Классический цикл for
for i in range(len(my_list)):
    print(i, my_list[i])`,
  },
  {
    name: "re.compile(pattern[, flags])",
    description: `Компилирует регулярное выражение pattern в объект Pattern. Находится в модуле re. Скомпилированный объект можно использовать повторно — это эффективнее многократного вызова re.match(), re.search() и т.д. с одним и тем же паттерном.

Методы объекта Pattern совпадают с функциями модуля re, но вызываются без первого аргумента pattern:
- pattern.match(string) — аналог re.match(pattern, string)
- pattern.search(string) — аналог re.search(pattern, string)
- pattern.findall(string) — аналог re.findall(pattern, string)
- pattern.sub(repl, string) — аналог re.sub(pattern, repl, string)

Флаги flags:
- re.IGNORECASE (re.I) — регистронезависимый поиск
- re.MULTILINE (re.M) — ^ и $ совпадают с началом/концом каждой строки
- re.DOTALL (re.S) — точка . совпадает с любым символом включая \\n
- re.VERBOSE (re.X) — позволяет писать паттерн с пробелами и комментариями`,
    syntax: "re.compile(pattern, flags=0)",
    arguments: [
      { name: "pattern", description: "Строка регулярного выражения" },
      {
        name: "flags",
        description:
          "Необязательный. Флаги модификаторов (re.I, re.M, re.S и т.д.)",
      },
    ],
    example: `import re

# Компиляция и повторное использование
email_pattern = re.compile(r'[\\w.+-]+@[\\w-]+\\.[\\w.]+')

emails = [
    "user@example.com",
    "not-an-email",
    "admin@company.org",
]
for s in emails:
    m = email_pattern.search(s)
    print(f"{s!r}: {'найден' if m else 'не найден'}")

# Флаг IGNORECASE
pattern = re.compile(r'python', re.IGNORECASE)
print(bool(pattern.search("I love Python")))   # True
print(bool(pattern.search("PYTHON is great"))) # True

# Флаг VERBOSE — читаемый паттерн
phone = re.compile(r"""
    (\\+7|8)         # код страны
    [\\s-]?          # необязательный разделитель
    (\\d{3})         # код города
    [\\s-]?
    (\\d{3})         # первые 3 цифры
    [\\s-]?
    (\\d{2})         # следующие 2 цифры
    [\\s-]?
    (\\d{2})         # последние 2 цифры
""", re.VERBOSE)

m = phone.match("+7 916 123-45-67")
if m:
    print(m.groups())  # ('+7', '916', '123', '45', '67')

# Объединение флагов
p = re.compile(r'^hello', re.IGNORECASE | re.MULTILINE)`,
  },
  {
    name: "re.findall(pattern, string[, flags])",
    description: `Возвращает список всех не перекрывающихся совпадений паттерна pattern в строке string. Находится в модуле re. Обходит строку слева направо и возвращает совпадения в порядке нахождения.

Возвращаемый тип зависит от групп в паттерне:
- Нет групп → список совпавших строк: ['match1', 'match2']
- Одна группа → список строк группы: ['group1', 'group2']
- Несколько групп → список кортежей: [('g1', 'g2'), ('g1', 'g2')]

Если совпадений нет — возвращает пустой список (не вызывает исключения).

Отличие от re.finditer():
- findall() — возвращает список строк
- finditer() — возвращает итератор объектов Match (с позициями и группами)`,
    syntax: "re.findall(pattern, string, flags=0)",
    arguments: [
      { name: "pattern", description: "Строка регулярного выражения" },
      { name: "string", description: "Строка, в которой выполняется поиск" },
      {
        name: "flags",
        description: "Необязательный. Флаги (re.I, re.M, re.S и т.д.)",
      },
    ],
    example: `import re

# Все числа в строке
text = "В 2023 году вышел Python 3.12, а в 2024 — Python 3.13"
numbers = re.findall(r'\\d+', text)
print(numbers)  # ['2023', '3', '12', '2024', '3', '13']

# Все слова (только буквы)
words = re.findall(r'[a-zA-Zа-яА-ЯёЁ]+', "Привет, мир! Hello, world!")
print(words)  # ['Привет', 'мир', 'Hello', 'world']

# С одной группой — возвращает содержимое группы
emails = re.findall(r'[\\w.+-]+@([\\w-]+\\.[\\w.]+)', "a@gmail.com, b@yahoo.com")
print(emails)  # ['gmail.com', 'yahoo.com']

# С несколькими группами — возвращает кортежи
dates = re.findall(r'(\\d{2})\\.(\\d{2})\\.(\\d{4})', "01.01.2024 и 15.06.2023")
print(dates)  # [('01', '01', '2024'), ('15', '06', '2023')]

# Все хэштеги
post = "Отличный день! #python #coding #replit"
tags = re.findall(r'#(\\w+)', post)
print(tags)  # ['python', 'coding', 'replit']

# Пустой список если нет совпадений
print(re.findall(r'\\d+', "нет чисел"))  # []`,
  },
  {
    name: "re.finditer(pattern, string[, flags])",
    description: `Возвращает итератор объектов Match для всех не перекрывающихся совпадений паттерна pattern в строке string. Находится в модуле re. В отличие от re.findall(), возвращает объекты Match с полной информацией о каждом совпадении.

Объект Match предоставляет:
- .group() / .group(0) — всё совпадение
- .group(n) — n-я группа
- .groups() — кортеж всех групп
- .start() — начальная позиция совпадения
- .end() — конечная позиция
- .span() — кортеж (start, end)

Преимущества перед findall():
- Ленивое вычисление (не загружает все результаты в память)
- Доступ к позициям совпадений
- Доступ к именованным и нумерованным группам`,
    syntax: "re.finditer(pattern, string, flags=0)",
    arguments: [
      { name: "pattern", description: "Строка регулярного выражения" },
      { name: "string", description: "Строка, в которой выполняется поиск" },
      {
        name: "flags",
        description: "Необязательный. Флаги (re.I, re.M, re.S и т.д.)",
      },
    ],
    example: `import re

# Все числа с их позициями
text = "в 2023 году выпущено 42 обновления и 7 патчей"
for m in re.finditer(r'\\d+', text):
    print(f"'{m.group()}' на позиции {m.start()}–{m.end()}")

# Именованные группы
pattern = re.compile(r'(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})')
text = "Сегодня 2024-01-15, вчера было 2024-01-14"

for m in pattern.finditer(text):
    print(f"Дата: {m.group('day')}.{m.group('month')}.{m.group('year')}")
# Дата: 15.01.2024
# Дата: 14.01.2024

# Парсинг лога
log = """
2024-01-15 10:30:00 ERROR Database connection failed
2024-01-15 10:30:01 INFO  Retrying...
2024-01-15 10:30:05 ERROR Timeout exceeded
"""
pattern = re.compile(r'(?P<time>[\\d:]+) (?P<level>\\w+)\\s+(?P<msg>.+)')
errors = [m.group('msg') for m in pattern.finditer(log) if m.group('level') == 'ERROR']
print(errors)
# ['Database connection failed', 'Timeout exceeded']`,
  },
  {
    name: "re.match(pattern, string[, flags])",
    description: `Проверяет, совпадает ли паттерн pattern с началом строки string. Возвращает объект Match при успехе или None при неудаче. Находится в модуле re.

Ключевое отличие от re.search():
- re.match() — проверяет только начало строки (аналог паттерна с ^)
- re.search() — ищет совпадение в любом месте строки

Объект Match:
- .group() — всё совпадение
- .group(n) — n-я группа (нумерация с 1)
- .groups() — кортеж всех групп
- .start(), .end(), .span() — позиция совпадения

Всегда проверяйте результат через if m: перед вызовом методов — обращение к None вызовет AttributeError.`,
    syntax: "re.match(pattern, string, flags=0)",
    arguments: [
      { name: "pattern", description: "Строка регулярного выражения" },
      {
        name: "string",
        description: "Строка, с начала которой ищется совпадение",
      },
      {
        name: "flags",
        description: "Необязательный. Флаги (re.I, re.M, re.S и т.д.)",
      },
    ],
    example: `import re

# Базовое использование
m = re.match(r'\\d+', '123abc')
if m:
    print(m.group())  # '123'

# match только с начала строки!
print(re.match(r'\\d+', 'abc123'))   # None — нет числа в начале
print(re.search(r'\\d+', 'abc123'))  # <Match '123'> — search находит

# Проверка формата ввода
def is_valid_username(s):
    return bool(re.match(r'^[a-z][a-z0-9_]{2,19}$', s, re.IGNORECASE))

print(is_valid_username("user_123"))   # True
print(is_valid_username("1user"))      # False — начинается с цифры
print(is_valid_username("ab"))         # False — слишком короткий

# Группы
m = re.match(r'(\\w+)\\s(\\w+)', 'Hello World')
if m:
    print(m.group(1))   # 'Hello'
    print(m.group(2))   # 'World'
    print(m.groups())   # ('Hello', 'World')

# Именованные группы
m = re.match(r'(?P<protocol>https?)://(?P<host>[\\w.]+)', 'https://example.com/path')
if m:
    print(m.group('protocol'))  # 'https'
    print(m.group('host'))      # 'example.com'`,
  },
  {
    name: "re.search(pattern, string[, flags])",
    description: `Ищет первое совпадение паттерна pattern в любом месте строки string. Возвращает объект Match при успехе или None при неудаче. Находится в модуле re.

Ключевое отличие от re.match():
- re.match() — проверяет только начало строки
- re.search() — ищет совпадение в любом месте строки (сканирует всю строку)

Возвращает только первое совпадение. Для поиска всех совпадений используйте re.findall() или re.finditer().

Объект Match предоставляет:
- .group() — всё совпадение
- .group(n) — n-я захватывающая группа
- .start(), .end() — позиции начала и конца совпадения`,
    syntax: "re.search(pattern, string, flags=0)",
    arguments: [
      { name: "pattern", description: "Строка регулярного выражения" },
      { name: "string", description: "Строка, в которой выполняется поиск" },
      {
        name: "flags",
        description: "Необязательный. Флаги (re.I, re.M, re.S и т.д.)",
      },
    ],
    example: `import re

# Базовое использование
text = "Python 3.12 вышел в 2023 году"
m = re.search(r'\\d+\\.\\d+', text)
if m:
    print(m.group())   # '3.12'
    print(m.start())   # позиция начала
    print(m.span())    # (7, 11)

# Отличие match vs search
s = "Цена: 1500 рублей"
print(re.match(r'\\d+', s))    # None — нет числа в начале
print(re.search(r'\\d+', s))   # <Match '1500'>

# Проверка наличия паттерна (как bool)
html = "<div class='container'><p>Текст</p></div>"
has_tags = bool(re.search(r'<[^>]+>', html))
print(has_tags)  # True

# Поиск с группами
log = "2024-01-15 ERROR: connection timeout after 30s"
m = re.search(r'(ERROR|WARN|INFO): (.+)', log)
if m:
    level = m.group(1)  # 'ERROR'
    msg   = m.group(2)  # 'connection timeout after 30s'
    print(f"[{level}] {msg}")

# Многострочный поиск
text = "Строка 1\\nСтрока 2\\nСтрока 3"
m = re.search(r'^Строка 2$', text, re.MULTILINE)
print(bool(m))  # True`,
  },
  {
    name: "re.sub(pattern, repl, string[, count=0, flags=0])",
    description: `Заменяет все (или count) совпадений паттерна pattern в строке string на repl. Возвращает новую строку. Находится в модуле re. Оригинальная строка не изменяется.

Параметр repl может быть:
- Строкой — в которой \\1, \\2 (или \\g<1>, \\g<name>) — ссылки на группы
- Функцией — принимает объект Match, возвращает строку-замену

Параметр count:
- 0 (по умолчанию) — заменить все совпадения
- N > 0 — заменить только первые N совпадений

Если совпадений нет — возвращает оригинальную строку без изменений.`,
    syntax: "re.sub(pattern, repl, string, count=0, flags=0)",
    arguments: [
      { name: "pattern", description: "Строка регулярного выражения" },
      {
        name: "repl",
        description:
          "Строка замены (может содержать \\1, \\2 для групп) или функция(Match) → str",
      },
      { name: "string", description: "Исходная строка" },
      {
        name: "count",
        description:
          "Необязательный. Максимальное число замен (0 = все). По умолчанию 0",
      },
      {
        name: "flags",
        description: "Необязательный. Флаги (re.I, re.M и т.д.)",
      },
    ],
    example: `import re

# Простая замена
text = "Python 2 устарел, используйте Python 2.7 вместо Python 2.6"
result = re.sub(r'Python 2', 'Python 3', text)
print(result)
# 'Python 3 устарел, используйте Python 3.7 вместо Python 3.6'

# Замена только первых N совпадений
result = re.sub(r'\\d+', 'X', "1 + 2 = 3", count=2)
print(result)  # 'X + X = 3'

# Удаление HTML-тегов
html = "<b>Жирный</b> и <i>курсив</i>"
clean = re.sub(r'<[^>]+>', '', html)
print(clean)  # 'Жирный и курсив'

# Ссылки на группы в замене
# Переформат: "Иванов Иван" → "Иван Иванов"
name = "Иванов Иван"
reformatted = re.sub(r'(\\w+) (\\w+)', r'\\2 \\1', name)
print(reformatted)  # 'Иван Иванов'

# Замена с функцией
def double_number(m):
    return str(int(m.group()) * 2)

result = re.sub(r'\\d+', double_number, "у меня 3 кошки и 5 собак")
print(result)  # 'у меня 6 кошки и 10 собак'

# Нормализация пробелов
messy = "слишком   много    пробелов"
clean = re.sub(r'\\s+', ' ', messy).strip()
print(clean)  # 'слишком много пробелов'`,
  },
  {
    name: "repr(object)",
    description: `Возвращает строку с "официальным" строковым представлением объекта. В идеале это строка, которая при передаче в eval() воспроизводит объект с тем же значением.

Разница между repr() и str():
- str(obj) — "неформальное", читаемое представление (для вывода пользователю)
- repr(obj) — "официальное", однозначное представление (для разработчика, отладки)

Вызывает метод __repr__() объекта. Если __repr__() не определён, наследуется из object и возвращает строку вида <ClassName object at 0xADDRESS>.

Поведение в контейнерах:
- При выводе списка, кортежа или словаря Python вызывает repr() для каждого элемента
- Поэтому str(['hello']) → "['hello']" (со строковыми кавычками внутри)

Рекомендации по реализации __repr__:
- Должно начинаться с имени класса и содержать все необходимые данные для воссоздания объекта
- Удобный шаблон: f"{self.__class__.__name__}(field1={self.field1!r}, ...)"
- В отладчиках и REPL именно repr() отображается при вводе выражения`,
    syntax: "repr(object)",
    arguments: [
      {
        name: "object",
        description: "Любой Python-объект. Вызывает __repr__() метод объекта",
      },
    ],
    example: `repr(42)            # '42'
repr(3.14)          # '3.14'
repr("hello")       # "'hello'"  (со внутренними кавычками!)
repr([1, 2, 3])     # '[1, 2, 3]'
repr({'a': 1})      # "{'a': 1}"
repr(None)          # 'None'
repr(True)          # 'True'

# Разница str vs repr для строк
s = "Hello\\nWorld"
print(str(s))    # Hello
                 # World   (перенос строки реальный)
print(repr(s))   # 'Hello\\nWorld'  (экранированный)

# Пользовательский __repr__
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __repr__(self):
        return f"Point({self.x!r}, {self.y!r})"
    def __str__(self):
        return f"({self.x}, {self.y})"

p = Point(1, 2)
repr(p)   # 'Point(1, 2)'   — для разработчика
str(p)    # '(1, 2)'        — для пользователя

# eval(repr(obj)) воссоздаёт объект (если repr грамотно реализован)
eval(repr(42))     # 42`,
  },
  {
    name: "reversed(seq)",
    description: `Возвращает обратный итератор по последовательности. Позволяет перебирать элементы в обратном порядке без создания нового списка.

Требования к аргументу:
- seq должен реализовывать метод __reversed__() — тогда он используется напрямую
- Или seq должен реализовывать оба: __len__() и __getitem__() с целыми индексами

Если ни одно из условий не выполняется, возникает TypeError.

reversed() возвращает ленивый итератор — объект можно пройти только один раз. Для многократного обхода нужно создать список: list(reversed(seq)) или использовать срез seq[::-1].

Сравнение способов обратного обхода:
- reversed(lst) — ленивый итератор, O(1) памяти, для последовательностей
- lst[::-1] — создаёт новый список (shallow copy), O(n) памяти, но можно переиспользовать
- list(reversed(lst)) — аналог lst[::-1] через reversed
- lst.reverse() — изменяет список на месте (in-place), возвращает None

Работает со строками, списками, кортежами, range и любыми объектами с __reversed__() или __len__ + __getitem__.`,
    syntax: "reversed(seq)",
    arguments: [
      {
        name: "seq",
        description:
          "Последовательность, реализующая __reversed__() или __len__() + __getitem__(). Строки, списки, кортежи, range, bytearray и пользовательские типы",
      },
    ],
    example: `list(reversed([1, 2, 3, 4, 5]))   # [5, 4, 3, 2, 1]
list(reversed("hello"))           # ['o', 'l', 'l', 'e', 'h']
list(reversed((1, 2, 3)))         # [3, 2, 1]
list(reversed(range(5)))          # [4, 3, 2, 1, 0]

# В цикле for
for ch in reversed("Python"):
    print(ch, end=" ")   # n o h t y P

# Сравнение подходов
lst = [1, 2, 3, 4, 5]
list(reversed(lst))  # [5, 4, 3, 2, 1]  — новый список
lst[::-1]            # [5, 4, 3, 2, 1]  — тоже новый список

# Пользовательский __reversed__
class CountDown:
    def __init__(self, start):
        self.start = start
    def __reversed__(self):
        return iter(range(self.start))

list(reversed(CountDown(5)))  # [0, 1, 2, 3, 4]`,
  },
  {
    name: "str.capitalize()",
    description: `Возвращает копию строки, в которой первый символ переведён в верхний регистр, а все остальные — в нижний.

Ключевые особенности:
- Работает с Unicode: capitalize() корректно обрабатывает кириллицу, латиницу и другие алфавиты
- Все символы кроме первого приводятся к нижнему регистру — это важно: "hELLO".capitalize() → "Hello", а не "HELLO"
- Если первый символ не является буквой (цифра, пробел, символ) — он остаётся без изменений, остальные переводятся в нижний регистр
- Возвращает новую строку (строки в Python неизменяемы)

Сравнение с похожими методами:
- capitalize() — первая буква большая, все остальные маленькие
- title() — каждое слово с большой буквы ("hello world" → "Hello World")
- upper() — все буквы заглавные
- lower() — все буквы строчные

capitalize() часто используется для нормализации пользовательского ввода, форматирования имён и заголовков однословных строк.`,
    syntax: "str.capitalize()",
    arguments: [],
    example: `"hello world".capitalize()   # 'Hello world'
"HELLO".capitalize()         # 'Hello'  — остальные → нижний!
"привет МИР".capitalize()    # 'Привет мир'
"123abc".capitalize()        # '123abc'  (цифра первая)
"".capitalize()              # ''

# Сравнение методов
s = "hello world"
s.capitalize()   # 'Hello world'  — только первое слово
s.title()        # 'Hello World'  — каждое слово
s.upper()        # 'HELLO WORLD'

# Нормализация имени пользователя
name = "aLICE"
name.capitalize()   # 'Alice'`,
  },
  {
    name: "str.casefold()",
    description: `Возвращает строку, преобразованную для нечувствительного к регистру сравнения. Более агрессивная версия lower() — предназначена специально для сравнения строк без учёта регистра.

Чем casefold() отличается от lower():
- lower() просто переводит в нижний регистр согласно правилам Unicode
- casefold() применяет Unicode "case folding" — более агрессивное преобразование для сравнения
- Пример: немецкая буква 'ß' (эсцет): 'ß'.lower() → 'ß', но 'ß'.casefold() → 'ss'
- Аналогично для других специальных символов различных языков

Когда использовать:
- casefold() — для сравнения строк без учёта регистра (особенно с нелатинскими алфавитами)
- lower() — для общего приведения к нижнему регистру, когда важно сохранить специальные символы

Практическое правило: если нужно проверить "одинаковые ли строки вне зависимости от регистра", используйте casefold(). Для большинства латинских языков lower() и casefold() дают одинаковый результат.`,
    syntax: "str.casefold()",
    arguments: [],
    example: `"Hello World".casefold()   # 'hello world'
"PYTHON".casefold()        # 'python'
"Привет".casefold()        # 'привет'

# Ключевое отличие: немецкий символ ß
"Straße".lower()           # 'straße'
"Straße".casefold()        # 'strasse'  — агрессивнее!

# Правильное сравнение без учёта регистра
"Straße".casefold() == "STRASSE".casefold()  # True
"Straße".lower() == "STRASSE".lower()        # False!

# Поиск в тексте без учёта регистра
text = "Python — Отличный Язык"
query = "отличный"
query in text.casefold()   # True

# Сравнение строк независимо от регистра
def eq_ignore_case(a, b):
    return a.casefold() == b.casefold()

eq_ignore_case("Straße", "strasse")  # True`,
  },
  {
    name: "str.center(width[, fillchar])",
    description: `Возвращает строку, выровненную по центру в поле заданной ширины width. Заполнение с обеих сторон символом fillchar (по умолчанию — пробел).

Если ширина width меньше или равна длине строки, возвращается исходная строка без изменений (без обрезки).

При нечётном количестве символов заполнения дополнительный символ добавляется справа.

Семейство методов выравнивания:
- center(width, fillchar) — по центру
- ljust(width, fillchar) — по левому краю (Right-padding)
- rjust(width, fillchar) — по правому краю (Left-padding)
- zfill(width) — заполнение нулями слева (для чисел)

Альтернативы через форматирование строк:
- f"{'text':^20}" — по центру через f-строку
- f"{'text':<20}" — по левому краю
- f"{'text':>20}" — по правому краю
- f"{'text':*^20}" — по центру, заполнение символом *

center() удобен для создания текстовых интерфейсов, ASCII-art, форматирования таблиц и заголовков.`,
    syntax: "str.center(width[, fillchar])",
    arguments: [
      {
        name: "width",
        description:
          "Ширина результирующей строки. Если width ≤ len(str), возвращается исходная строка",
      },
      {
        name: "fillchar",
        description:
          "Необязательный. Символ заполнения (строка длиной 1). По умолчанию ' ' (пробел)",
      },
    ],
    example: `"hello".center(11)        # '   hello   '
"hello".center(11, "*")   # '***hello***'
"hello".center(11, "-")   # '---hello---'
"hello".center(3)         # 'hello'  (width <= len)

# Нечётное число символов
"hi".center(7)            # '  hi   '  (лишний пробел справа)
"hi".center(7, "*")       # '**hi***'

# Через f-строки (эквивалентно)
f"{'hello':^11}"          # '   hello   '
f"{'hello':*^11}"         # '***hello***'

# Создание заголовка
title = "PYTHON"
print(title.center(40, "="))
# ================PYTHON================

# Таблица
for name, score in [("Alice", 95), ("Bob", 87)]:
    print(f"{name.center(10)} | {str(score).center(5)}")`,
  },
  {
    name: "str.count(sub[, start[, end]])",
    description: `Возвращает количество непересекающихся вхождений подстроки sub в строке (или её части от start до end).

Параметры start и end работают как индексы срезов: поддерживают отрицательные значения (с конца строки). Поиск ведётся в диапазоне [start, end).

Важно: метод считает непересекающиеся вхождения. Например, в "aaa" подстрока "aa" встречается 1 раз (не 2), потому что после первого совпадения поиск продолжается с позиции, следующей за найденным.

Сравнение с find() и index():
- count() — возвращает количество вхождений
- find() — возвращает индекс первого вхождения (или -1 если не найдено)
- index() — как find(), но поднимает ValueError при отсутствии

Особый случай: count("") возвращает len(str) + 1, потому что пустая строка "находится" между каждым символом и в начале и конце строки. Это математически корректное поведение.

Применение: подсчёт символов, слов, вхождений паттернов в тексте без регулярных выражений.`,
    syntax: "str.count(sub[, start[, end]])",
    arguments: [
      {
        name: "sub",
        description: "Подстрока, вхождения которой нужно подсчитать",
      },
      {
        name: "start",
        description:
          "Необязательный. Начальный индекс поиска (включительно). Поддерживает отрицательные значения",
      },
      {
        name: "end",
        description:
          "Необязательный. Конечный индекс поиска (не включается). Поддерживает отрицательные значения",
      },
    ],
    example: `"hello world".count("l")      # 3
"hello world".count("lo")    # 1
"aaa".count("aa")            # 1  (непересекающиеся!)
"banana".count("an")         # 2
"hello".count("xyz")         # 0

# С диапазоном
"hello world".count("l", 5)     # 1  (ищем начиная с индекса 5)
"hello world".count("l", 0, 5)  # 2  (только в "hello")

# Отрицательные индексы
"hello world".count("l", -5)    # 1  (последние 5 символов)

# Подсчёт слов (грубое приближение)
text = "яблоко банан яблоко груша яблоко"
text.count("яблоко")    # 3

# Пустая строка — особый случай
"hello".count("")   # 6  (len + 1)`,
  },
  {
    name: "str.encode(encoding='utf-8', errors='strict')",
    description: `Возвращает байтовое представление строки в указанной кодировке. Обратная операция к bytes.decode().

Параметр encoding: название кодировки (регистронезависимое). Наиболее распространённые:
- 'utf-8' — универсальная, рекомендуемая, переменная ширина (1-4 байта на символ)
- 'ascii' — только символы 0-127
- 'latin-1' (iso-8859-1) — западноевропейские языки
- 'cp1251' (windows-1251) — кириллица Windows
- 'koi8-r' — кириллица Unix
- 'utf-16', 'utf-32' — фиксированная ширина Unicode

Параметр errors — обработка символов, которые не могут быть закодированы:
- 'strict' — возбуждает UnicodeEncodeError (по умолчанию)
- 'ignore' — пропускает некодируемые символы
- 'replace' — заменяет ? (или XML-сущностью при 'xmlcharrefreplace')
- 'backslashreplace' — заменяет Python escape-последовательностью \\uXXXX

Обратная операция: bytes_obj.decode(encoding) → str.

Кодировка имеет значение для:
- Записи файлов (open с параметром encoding)
- Сетевого взаимодействия (HTTP, TCP)
- Работы с базами данных
- Передачи данных между системами`,
    syntax: "str.encode(encoding='utf-8', errors='strict')",
    arguments: [
      {
        name: "encoding",
        description:
          "Кодировка для преобразования. По умолчанию 'utf-8'. Примеры: 'ascii', 'latin-1', 'cp1251', 'utf-16'",
      },
      {
        name: "errors",
        description:
          "Обработка ошибок кодирования: 'strict' (исключение), 'ignore', 'replace', 'backslashreplace', 'xmlcharrefreplace'",
      },
    ],
    example: `"hello".encode()              # b'hello'  (utf-8 по умолчанию)
"hello".encode('ascii')       # b'hello'
"Привет".encode('utf-8')      # b'\\xd0\\x9f\\xd1\\x80...'  (12 байт)
"Привет".encode('cp1251')     # b'\\xcf\\xf0...'  (6 байт)

# Разные размеры в байтах
s = "Привет"
len(s)                        # 6  (символов)
len(s.encode('utf-8'))        # 12 (байт)
len(s.encode('cp1251'))       # 6  (байт)

# Обработка ошибок
"café".encode('ascii', errors='ignore')         # b'caf'
"café".encode('ascii', errors='replace')        # b'caf?'
"café".encode('ascii', errors='backslashreplace') # b'caf\\\\xe9'

# Кругооборот encode/decode
original = "Hello, мир!"
encoded = original.encode('utf-8')
decoded = encoded.decode('utf-8')
decoded == original   # True`,
  },
  {
    name: "str.endswith(suffix[, start[, end]])",
    description: `Возвращает True если строка заканчивается указанным суффиксом suffix, иначе False.

suffix может быть:
- Строкой: "file.txt".endswith(".txt")
- Кортежем строк: "file.txt".endswith((".txt", ".csv")) — True если заканчивается хотя бы на один из них. Это более эффективно и читаемо, чем несколько проверок с or.

Параметры start и end ограничивают область проверки, как срезы. Проверяется завершение подстроки s[start:end].

Сравнение с startswith():
- endswith(suffix) — проверяет конец строки
- startswith(prefix) — проверяет начало строки
- Оба поддерживают кортежи и параметры start/end

Типичные применения:
- Определение типа файла по расширению
- Проверка окончания URL
- Валидация форматов строк
- Фильтрация файлов по расширению

Для сложных проверок (регулярные паттерны) используйте re.search() или re.fullmatch().`,
    syntax: "str.endswith(suffix[, start[, end]])",
    arguments: [
      {
        name: "suffix",
        description:
          "Строка или кортеж строк для проверки. При кортеже возвращает True если строка заканчивается хотя бы на один из суффиксов",
      },
      {
        name: "start",
        description: "Необязательный. Начальный индекс области проверки",
      },
      {
        name: "end",
        description:
          "Необязательный. Конечный индекс области проверки (не включается)",
      },
    ],
    example: `"hello.py".endswith(".py")       # True
"hello.py".endswith(".txt")      # False
"hello world".endswith("world")  # True

# Кортеж суффиксов
"image.png".endswith((".jpg", ".png", ".gif"))   # True
"doc.pdf".endswith((".jpg", ".png", ".gif"))     # False

# С диапазоном
"hello.py".endswith(".py", 0, 5)   # False (проверяем "hello")

# Фильтрация файлов по расширению
files = ["a.py", "b.txt", "c.py", "d.csv"]
python_files = [f for f in files if f.endswith(".py")]
# ['a.py', 'c.py']

# Проверка нескольких расширений изображений
def is_image(filename):
    return filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp"))

is_image("photo.JPG")   # True`,
  },
  {
    name: "str.expandtabs(tabsize=8)",
    description: `Возвращает копию строки, в которой все символы табуляции (\\t) заменены пробелами. Заменяет \\t таким количеством пробелов, чтобы следующий символ попал в позицию, кратную tabsize.

Алгоритм: позиции "табуляционных стопов" расположены через каждые tabsize символов (0, tabsize, 2*tabsize, ...). При встрече \\t добавляется столько пробелов, чтобы дойти до следующего стопа.

Параметр tabsize по умолчанию равен 8 (традиционный размер табуляции в Unix-терминалах). В современных редакторах обычно 4 или 2.

Переносы строк (\\n, \\r) сбрасывают счётчик позиции на 0 — новая строка начинается с позиции 0.

Применения:
- Нормализация отступов в коде перед анализом
- Выравнивание колонок в текстовых таблицах
- Отображение кода с явным контролем ширины отступа
- Обработка TSV (Tab-Separated Values) файлов перед выводом

Важно: expandtabs() учитывает текущую позицию символа в строке при вычислении ширины замены. Это значит, что \\t не всегда заменяется одинаковым числом пробелов.`,
    syntax: "str.expandtabs(tabsize=8)",
    arguments: [
      {
        name: "tabsize",
        description:
          "Необязательный. Размер табуляции (позиция стопа). По умолчанию 8. Обычно используют 4",
      },
    ],
    example: `"a\\tb".expandtabs()          # 'a       b'  (tabsize=8)
"a\\tb".expandtabs(4)         # 'a   b'      (tabsize=4)
"ab\\tc".expandtabs(4)        # 'ab  c'      (до следующего стопа)
"abc\\td".expandtabs(4)       # 'abc d'      (1 пробел до стопа 4)
"abcd\\te".expandtabs(4)      # 'abcd    e'  (4 пробела до стопа 8)

# Несколько табуляций
"a\\tb\\tc".expandtabs(4)     # 'a   b   c'

# Таблица с табуляцией
table = "Name\\tAge\\tCity\\nAlice\\t30\\tМосква\\nBob\\t25\\tСПБ"
print(table.expandtabs(12))
# Name        Age         City
# Alice       30          Москва
# Bob         25          СПБ

# Нормализация кода Python (4 пробела вместо табов)
code = "def f():\\n\\treturn 42"
normalized = code.expandtabs(4)
# 'def f():\\n    return 42'`,
  },
  {
    name: "str.find(sub[, start[, end]])",
    description: `Возвращает наименьший индекс (позицию) первого вхождения подстроки sub в строке. Если подстрока не найдена, возвращает -1.

Параметры start и end ограничивают область поиска как срез: поиск в s[start:end].

Отличие от index():
- find() возвращает -1 если не найдено (безопасно)
- index() возбуждает ValueError если не найдено

Правило выбора:
- Используйте find() когда отсутствие подстроки — нормальная ситуация
- Используйте index() когда отсутствие означает ошибку (исключение нужно)

rfind(sub) — поиск с конца строки (последнее вхождение).

Производительность: find() использует эффективный алгоритм Boyer-Moore-Horspool. Для простых поисков быстрее re.search(). Для множественного поиска по сложным паттернам — используйте re.

Паттерны использования:
- Проверка наличия: if s.find(sub) != -1 (лучше: if sub in s)
- Получение позиции: idx = s.find(sub)
- Разбиение по первому вхождению: s[:idx] и s[idx+len(sub):]`,
    syntax: "str.find(sub[, start[, end]])",
    arguments: [
      { name: "sub", description: "Подстрока для поиска" },
      {
        name: "start",
        description: "Необязательный. Начальный индекс поиска (включительно)",
      },
      {
        name: "end",
        description: "Необязательный. Конечный индекс поиска (не включается)",
      },
    ],
    example: `"hello world".find("world")   # 6
"hello world".find("lo")     # 3
"hello world".find("xyz")    # -1  (не найдено)
"hello".find("")             # 0   (пустая строка — всегда в начале)

# С диапазоном
"hello hello".find("hello", 1)   # 6  (пропускаем первое)
"abcabc".find("b", 2, 5)         # 4  (ищем в "cab")

# rfind — с конца
"hello hello".rfind("hello")     # 6  (последнее вхождение)

# Лучше использовать 'in' для проверки наличия
"world" in "hello world"         # True  (предпочтительно)
"hello world".find("world") != -1  # то же, но многословно

# Разбиение по разделителю (ручная версия split)
s = "user@example.com"
at = s.find("@")
username = s[:at]      # 'user'
domain = s[at+1:]      # 'example.com'`,
  },
  {
    name: "str.format(*args, **kwargs)",
    description: `Выполняет форматирование строки, заменяя поля замены {} на переданные аргументы. Является основным механизмом форматирования строк в Python (наряду с f-строками).

Синтаксис полей замены: {[field_name][!conversion][:format_spec]}

Типы полей:
- {} — автоматическая нумерация: "Hello {} {}".format("world", "!")
- {0}, {1} — по индексу: "{0} {1} {0}".format("на", "берегу")
- {name} — по имени: "{name} {age}".format(name="Alice", age=30)
- {obj.attr} — атрибут объекта: "{p.x}".format(p=point)
- {lst[0]} — элемент коллекции: "{0[1]}".format(lst)

Преобразования (!):
- !s — str(value)
- !r — repr(value)
- !a — ascii(value)

Спецификаторы формата (:):
- {:d}, {:f}, {:e} — целое, float, экспоненциальный
- {:10} — ширина поля, {:>10}, {:<10}, {:^10} — выравнивание
- {:.2f} — два знака после запятой
- {:,} — разделитель тысяч
- {:b}, {:o}, {:x} — двоичный, восьмеричный, шестнадцатеричный

f-строки (Python 3.6+) предпочтительнее в большинстве случаев — более читаемы и быстрее.`,
    syntax: "str.format(*args, **kwargs)",
    arguments: [
      {
        name: "*args",
        description:
          "Позиционные аргументы. Доступны по индексу {0}, {1} или автоматически {}",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы. Доступны по имени {name}",
      },
    ],
    example: `# Автоматическая нумерация
"{} + {} = {}".format(1, 2, 3)       # '1 + 2 = 3'

# По индексу (можно повторять)
"{0} {1} {0}".format("spam", "eggs") # 'spam eggs spam'

# По имени
"{name} ({age})".format(name="Alice", age=30)  # 'Alice (30)'

# Из словаря
data = {"city": "Москва", "pop": 12_000_000}
"{city}: {pop:,}".format(**data)     # 'Москва: 12,000,000'

# Форматирование чисел
"{:.2f}".format(3.14159)             # '3.14'
"{:10.2f}".format(3.14)             # '      3.14'  (ширина 10)
"{:>10}".format("hello")            # '     hello'
"{:<10}".format("hello")            # 'hello     '
"{:^10}".format("hello")            # '  hello   '
"{:0>5}".format(42)                 # '00042'
"{:,}".format(1000000)              # '1,000,000'
"{:b}".format(255)                  # '11111111'
"{:#x}".format(255)                 # '0xff'`,
  },
  {
    name: "str.format_map(mapping)",
    description: `Выполняет форматирование строки, используя словарь (или объект, подобный словарю) как источник значений для замены именованных полей {}. Аналог format(**mapping), но с ключевым отличием.

Разница между format_map(mapping) и format(**mapping):
- format(**mapping) распаковывает mapping в kwargs — создаёт копию данных
- format_map(mapping) напрямую вызывает mapping[key] на исходном объекте — без копирования

Преимущество format_map():
- Работает с любым Mapping-объектом (не только dict)
- Позволяет перехватывать обращения к ключам через __missing__()
- Не создаёт промежуточный словарь kwargs
- Полезно для создания "умных" шаблонов с поведением по умолчанию

Практические применения:
- Шаблонизация строк с частичной заменой (не все ключи заданы)
- Создание шаблонов конфигурации, где часть значений берётся из переменных окружения
- Ленивые / вычисляемые значения в шаблонах`,
    syntax: "str.format_map(mapping)",
    arguments: [
      {
        name: "mapping",
        description:
          "Словарь или объект, подобный словарю (Mapping). Должен поддерживать индексацию по ключу. Используется напрямую без копирования",
      },
    ],
    example: `# Базовый пример
data = {"name": "Alice", "age": 30}
"{name} is {age} years old".format_map(data)
# 'Alice is 30 years old'

# Разница с format(**dict)
class DefaultMap(dict):
    def __missing__(self, key):
        return f"<{key}>"  # значение по умолчанию для отсутствующих ключей

m = DefaultMap(name="Bob")
"{name} from {city}".format_map(m)
# 'Bob from <city>'  — 'city' не задан, но нет ошибки!

# format(**dict) — KeyError при отсутствующем ключе:
# "{name} from {city}".format(**{"name": "Bob"})  # KeyError: 'city'

# Использование с os.environ (подстановка переменных окружения)
import os
template = "PATH = {PATH}"
# template.format_map(os.environ)  — подставляет переменную среды`,
  },
  {
    name: "str.index(sub[, start[, end]])",
    description: `Возвращает наименьший индекс первого вхождения подстроки sub в строке. Если подстрока не найдена, возбуждает ValueError.

Работает идентично find(), за исключением поведения при отсутствии подстроки:
- find() → -1 (безопасно, не прерывает выполнение)
- index() → ValueError (явное исключение)

Параметры start и end ограничивают область поиска как срезы.

Когда использовать index() вместо find():
- Когда отсутствие подстроки является ошибкой в логике программы
- Когда хотите явного исключения (принцип "fail fast")
- В отладочном коде, где неожиданное отсутствие нужно немедленно заметить

Когда использовать find():
- Когда нужно проверить "есть ли подстрока" без исключения
- В условных ветвях: if s.find(sub) != -1: ...
- Предпочтительнее для поиска — лучше: sub in s

rindex(sub) — как index(), но ищет последнее вхождение (с конца).

Для byte-строк: bytes.index() и bytes.find() работают аналогично.`,
    syntax: "str.index(sub[, start[, end]])",
    arguments: [
      { name: "sub", description: "Подстрока для поиска" },
      {
        name: "start",
        description: "Необязательный. Начальный индекс поиска (включительно)",
      },
      {
        name: "end",
        description: "Необязательный. Конечный индекс поиска (не включается)",
      },
    ],
    example: `"hello world".index("world")   # 6
"hello world".index("lo")     # 3
"hello hello".index("hello", 1) # 6  (пропускаем первое)

# Отличие от find()
"hello".find("xyz")    # -1  (не найдено — возвращает -1)
# "hello".index("xyz")  # ValueError: substring not found

# Обработка исключения
s = "hello world"
try:
    pos = s.index("python")
except ValueError:
    print("Подстрока не найдена")

# rindex — последнее вхождение
"abcabc".rindex("b")   # 4  (последнее)
"abcabc".index("b")    # 1  (первое)

# Практический пример: разбор строки
email = "user@example.com"
at_pos = email.index("@")  # 4  (нет @ — это ошибка, ValueError уместен)
username = email[:at_pos]  # 'user'`,
  },
  {
    name: "str.isalnum()",
    description: `Возвращает True если все символы строки являются буквенно-цифровыми (буквы или цифры) и строка не пустая, иначе False.

Символ является буквенно-цифровым если isalpha() или isdecimal() или isdigit() или isnumeric() возвращает True для него.

Включает символы Unicode: буквы кириллицы, китайские иероглифы, арабские буквы, цифры всех систем — всё это буквенно-цифровые символы.

Что НЕ является буквенно-цифровым:
- Пробелы (' ', '\\t', '\\n')
- Знаки пунктуации ('.', ',', '!', '-')
- Специальные символы ('@', '#', '$', '_')

Сравнение методов is*():
- isalnum() — буквы или цифры
- isalpha() — только буквы
- isdecimal() — только цифры 0-9
- isdigit() — цифры (включая ² и подобные)
- isnumeric() — числа (включая дроби ½ и т.д.)

Применение: валидация пользовательского ввода (имена пользователей без спецсимволов), проверка токенов, фильтрация слов.`,
    syntax: "str.isalnum()",
    arguments: [],
    example: `"hello123".isalnum()    # True
"Hello".isalnum()       # True
"123".isalnum()         # True
"hello 123".isalnum()   # False  (пробел!)
"hello!".isalnum()      # False  (знак!)
"".isalnum()            # False  (пустая строка!)

# Unicode — кириллица тоже алфавит
"Привет123".isalnum()   # True
"привет мир".isalnum()  # False  (пробел)

# Валидация имени пользователя (только буквы и цифры)
def is_valid_username(name):
    return name.isalnum() and 3 <= len(name) <= 20

is_valid_username("alice123")    # True
is_valid_username("alice 123")   # False  (пробел)
is_valid_username("alice@mail")  # False  (@)

# Фильтрация слов из текста
words = "Hello, World! 123 foo-bar".split()
alpha_words = [w for w in words if w.isalnum()]
# ['123']  — только "123" без пунктуации
# (у "Hello," есть запятая, поэтому не проходит)`,
  },
  {
    name: "str.isalpha()",
    description: `Возвращает True если все символы строки являются буквами (алфавитными символами) и строка не пустая, иначе False.

"Буква" в Unicode — это символ с категорией Letter (L): заглавные (Lu), строчные (Ll), титульные (Lt), модификаторы (Lm) и другие буквы (Lo). Это включает:
- Латинские буквы: A-Z, a-z
- Кириллицу: А-Я, а-я
- Китайские, японские, арабские символы и т.д.

Что НЕ является буквой:
- Цифры (0-9)
- Пробелы
- Знаки пунктуации
- Символы (@, #, _, -)
- Диакритические знаки отдельно от буквы

Сравнение с isalnum():
- isalpha() — только буквы (без цифр)
- isalnum() — буквы или цифры

Применение: проверка что строка содержит только текст без цифр, валидация имён (только буквы), извлечение слов из текста.

Для проверки ASCII-букв используйте: all('A' <= c <= 'Z' or 'a' <= c <= 'z' for c in s) или isascii() + isalpha().`,
    syntax: "str.isalpha()",
    arguments: [],
    example: `"hello".isalpha()       # True
"Hello".isalpha()       # True
"Привет".isalpha()      # True  (кириллица — тоже буквы)
"hello123".isalpha()    # False  (есть цифры)
"hello world".isalpha() # False  (есть пробел)
"hello!".isalpha()      # False  (знак препинания)
"".isalpha()            # False  (пустая строка)

# Только ASCII-буквы
"hello".isalpha() and "hello".isascii()   # True
"Привет".isalpha() and "Привет".isascii() # False

# Проверка имени (только буквы)
def is_valid_name(name):
    return name.replace(" ", "").isalpha() and len(name) >= 2

is_valid_name("Alice")       # True
is_valid_name("Alice Smith") # True  (убираем пробел)
is_valid_name("Alice123")    # False  (цифры)
is_valid_name("O'Brien")     # False  (апостроф)`,
  },
  {
    name: "str.isascii()",
    description: `Возвращает True если строка пустая или все её символы являются ASCII-символами (кодовые точки 0–127). Иначе возвращает False.

ASCII-диапазон (0–127) включает:
- Управляющие символы: \\t (9), \\n (10), \\r (13) и другие (0-31, 127)
- Пробел (32)
- Знаки пунктуации и специальные символы: !"#$%&'()*+,-./:;<=>?@[\\]^_{|}~
- Цифры: 0-9 (48-57)
- Заглавные буквы: A-Z (65-90)
- Строчные буквы: a-z (97-122)

Что НЕ является ASCII:
- Кириллица (> 127)
- Французские, немецкие буквы с диакритикой (é, ü, ñ)
- Все символы Unicode выше U+007F

Особенность: isascii() возвращает True для пустой строки (в отличие от большинства is*() методов).

Применение:
- Проверка что строка безопасна для ASCII-протоколов
- Валидация пользовательского ввода в системах с ограниченной кодировкой
- Быстрая проверка перед encode('ascii')`,
    syntax: "str.isascii()",
    arguments: [],
    example: `"hello".isascii()         # True
"Hello, World!".isascii() # True
"123".isascii()           # True
"\\n\\t".isascii()          # True  (управляющие символы — тоже ASCII)
"".isascii()              # True  (пустая строка!)
"café".isascii()          # False  (é = U+00E9 > 127)
"Привет".isascii()        # False  (кириллица)
"中文".isascii()           # False

# Практическое применение
def safe_encode_ascii(s):
    if s.isascii():
        return s.encode('ascii')
    else:
        return s.encode('utf-8')

# Фильтрация ASCII-только строк
tokens = ["hello", "мир", "world", "café"]
ascii_only = [t for t in tokens if t.isascii()]
# ['hello', 'world']

# isascii() НЕ означает "только буквы и цифры"
"@#$!".isascii()   # True (спецсимволы — тоже ASCII)`,
  },
  {
    name: "str.isdecimal()",
    description: `Возвращает True если все символы строки являются десятичными цифровыми символами и строка не пустая. Это самый строгий из трёх похожих методов.

Иерархия числовых методов (от строгого к широкому):
1. isdecimal() — только десятичные цифры (символы категории Decimal_Digit)
2. isdigit() — десятичные цифры + надстрочные цифры (², ³) + другие цифровые символы
3. isnumeric() — всё из isdigit() + числовые символы (дроби ½, ¼, римские цифры и т.д.)

Символы, для которых isdecimal() == True:
- ASCII цифры: 0-9
- Полноширинные цифры: ０-９
- Цифры других систем (арабские, деванагари и т.д.)

Символы, где isdecimal() == False, но isdigit() или isnumeric() == True:
- '²' (надстрочная 2): isdigit=True, isnumeric=True, isdecimal=False
- '½' (одна вторая): isnumeric=True, isdigit=False, isdecimal=False
- 'Ⅳ' (римская 4): isnumeric=True, isdigit=False, isdecimal=False

Применение: isdecimal() — самый безопасный метод для проверки "является ли строка целым числом". Используйте его перед int(s).`,
    syntax: "str.isdecimal()",
    arguments: [],
    example: `"123".isdecimal()      # True
"0".isdecimal()        # True
"".isdecimal()         # False  (пустая строка!)
"12.3".isdecimal()     # False  (точка — не цифра)
"12-3".isdecimal()     # False  (дефис — не цифра)
"+123".isdecimal()     # False  (знак плюс — не цифра)
"1 2".isdecimal()      # False  (пробел — не цифра)

# Сравнение трёх методов
s1 = "123"    # обычные цифры
s2 = "²"      # надстрочная двойка
s3 = "½"      # дробь
s4 = "٣"      # арабская цифра 3

s1: isdecimal=True,  isdigit=True,  isnumeric=True
s2: isdecimal=False, isdigit=True,  isnumeric=True
s3: isdecimal=False, isdigit=False, isnumeric=True

# Безопасный int() из строки
def safe_int(s):
    if s.isdecimal():
        return int(s)
    raise ValueError(f"Не число: {s!r}")

safe_int("42")     # 42
safe_int("3.14")   # ValueError`,
  },
  {
    name: "str.isdigit()",
    description: `Возвращает True если все символы строки являются цифровыми символами и строка не пустая. Шире, чем isdecimal(), но уже, чем isnumeric().

Включает:
- Все символы, для которых isdecimal() == True (обычные цифры 0-9 и их аналоги в других системах)
- Дополнительно: надстрочные цифры (², ³, ¹, ⁴-⁹) — символы Unicode с числовым значением
- Подстрочные цифры (₀, ₁, ₂, ...)
- Цифры в кружках и других обрамлениях

Не включает (isnumeric=True, но isdigit=False):
- Дроби: ½, ¼, ¾
- Римские цифры (Ⅰ, Ⅱ, Ⅳ и т.д.)
- Числовые идеографы китайского языка

Правило выбора:
- Для проверки "можно ли сделать int(s)": используйте isdecimal() — самый строгий
- Для проверки "это числовой символ Unicode": isdigit() немного шире
- Как правило, в реальных задачах isdecimal() предпочтительнее isdigit()

Для проверки что строка представляет валидное число (включая -1, 3.14): используйте try: float(s).`,
    syntax: "str.isdigit()",
    arguments: [],
    example: `"123".isdigit()      # True
"²".isdigit()        # True  (надстрочная двойка)
"½".isdigit()        # False  (дробь — не "цифра")
"Ⅳ".isdigit()        # False  (римская цифра)
"12.3".isdigit()     # False  (точка)
"".isdigit()         # False  (пустая строка)

# Сравнение методов
for s in ["5", "²", "½"]:
    print(f"{s!r}: decimal={s.isdecimal()}, digit={s.isdigit()}, numeric={s.isnumeric()}")
# '5': decimal=True, digit=True, numeric=True
# '²': decimal=False, digit=True, numeric=True
# '½': decimal=False, digit=False, numeric=True

# Надёжная проверка перед int()
def can_convert_to_int(s):
    return s.isdecimal()  # строже, чем isdigit()!

# Проверка на любое число (включая float и отрицательные)
def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

is_number("3.14")    # True
is_number("-42")     # True
is_number("1e10")    # True`,
  },
  {
    name: "str.isidentifier()",
    description: `Возвращает True если строка является допустимым идентификатором Python, иначе False.

Правила для идентификаторов Python:
- Начинается с буквы (A-Z, a-z) или знака подчёркивания (_)
- Далее идут буквы, цифры (0-9) или знаки подчёркивания
- Не может начинаться с цифры
- Длина не ограничена
- Поддерживает Unicode: кириллица, китайские символы и т.д. допустимы

Важная оговорка: isidentifier() проверяет синтаксис, а не семантику. Зарезервированные ключевые слова Python (if, for, class, True...) тоже являются допустимыми идентификаторами с точки зрения синтаксиса.

Для полной проверки (не ключевое слово) используйте:
s.isidentifier() and not keyword.iskeyword(s)

Применение:
- Проверка имён переменных, генерируемых динамически
- Валидация имён атрибутов перед setattr()
- Кодогенерация
- Проверка пользовательского ввода для имён переменных`,
    syntax: "str.isidentifier()",
    arguments: [],
    example: `"hello".isidentifier()      # True
"_private".isidentifier()   # True
"__dunder__".isidentifier() # True
"var123".isidentifier()     # True
"CamelCase".isidentifier()  # True
"привет".isidentifier()     # True  (кириллица допустима!)

"123abc".isidentifier()     # False  (начинается с цифры)
"hello world".isidentifier() # False  (пробел)
"hello-world".isidentifier() # False  (дефис)
"".isidentifier()           # False  (пустая строка)
"if".isidentifier()         # True!  (ключевое слово, но синтаксически корректно)

# Полная проверка (не ключевое слово)
import keyword
def is_valid_varname(s):
    return s.isidentifier() and not keyword.iskeyword(s)

is_valid_varname("my_var")    # True
is_valid_varname("if")        # False  (ключевое слово)
is_valid_varname("True")      # False  (keyword.iskeyword("True") == True)

# Безопасный setattr с проверкой
attr_name = "my_field"
if attr_name.isidentifier():
    setattr(obj, attr_name, value)`,
  },
  {
    name: "str.islower()",
    description: `Возвращает True если все буквенные символы строки являются строчными (нижним регистром) и в строке есть хотя бы одна буква, иначе False.

Важные нюансы:
- Строка может содержать небуквенные символы (цифры, пробелы, знаки) — они игнорируются при проверке
- Если строка состоит только из небуквенных символов (например "123" или "!?"), возвращается False — нет ни одной буквы в нижнем регистре
- Пустая строка возвращает False

Работает с Unicode: кириллица, греческие буквы и другие алфавиты учитываются корректно.

Семейство методов регистра:
- islower() — все буквы строчные
- isupper() — все буквы заглавные
- istitle() — каждое слово начинается с заглавной, остальные строчные
- lower() — преобразует все буквы в строчные
- upper() — преобразует все буквы в заглавные

Применение: проверка что строка введена в нижнем регистре, валидация идентификаторов, нормализация данных.`,
    syntax: "str.islower()",
    arguments: [],
    example: `"hello".islower()        # True
"hello world".islower()  # True  (пробел игнорируется)
"hello 123".islower()    # True  (цифры игнорируются)
"Hello".islower()        # False  (H — заглавная)
"HELLO".islower()        # False
"123".islower()          # False  (нет букв!)
"".islower()             # False  (пустая строка)
"привет".islower()       # True  (кириллица)

# Проверка перед сравнением
user_input = "Admin"
if not user_input.islower():
    user_input = user_input.lower()

# Фильтрация слов в нижнем регистре
words = ["hello", "World", "python", "Java"]
lower_words = [w for w in words if w.islower()]
# ['hello', 'python']`,
  },
  {
    name: "str.isnumeric()",
    description: `Возвращает True если все символы строки являются числовыми символами Unicode и строка не пустая. Это самый широкий из трёх числовых методов (isdecimal → isdigit → isnumeric).

Включает все, что включает isdigit(), плюс дополнительно:
- Дроби Unicode: ½ (U+00BD), ¼ (U+00BC), ¾ (U+00BE)
- Числа-идеографы: 一 (1), 二 (2), 三 (3) в китайском
- Римские цифры: Ⅰ, Ⅱ, Ⅲ, Ⅳ ...
- Числа в других системах счисления

Сравнительная таблица:
| Символ | isdecimal | isdigit | isnumeric |
|--------|-----------|---------|-----------|
| '5'    | True      | True    | True      |
| '²'    | False     | True    | True      |
| '½'    | False     | False   | True      |
| 'Ⅳ'    | False     | False   | True      |

Практическое замечание: isnumeric() слишком широк для проверки "можно ли передать в int()". Для безопасного int() используйте isdecimal(). Для проверки "это числовой контент Unicode" — isnumeric().`,
    syntax: "str.isnumeric()",
    arguments: [],
    example: `"123".isnumeric()     # True
"½".isnumeric()       # True  (дробь Unicode)
"²".isnumeric()       # True  (надстрочная)
"Ⅳ".isnumeric()       # True  (римская 4)
"一二三".isnumeric()   # True  (китайские числа)
"12.3".isnumeric()    # False  (точка)
"".isnumeric()        # False

# Таблица сравнения
samples = ["5", "²", "½", "Ⅳ"]
for s in samples:
    print(f"{s!r:6} decimal={s.isdecimal()} digit={s.isdigit()} numeric={s.isnumeric()}")

# Безопасное преобразование в число
def to_number(s):
    if s.isdecimal():
        return int(s)       # '123' → 123
    elif s.isnumeric():
        return s            # '½' — числовое, но не int
    return None`,
  },
  {
    name: "str.isprintable()",
    description: `Возвращает True если все символы строки являются печатаемыми, или строка пустая. Иначе False.

Непечатаемые символы включают:
- Управляющие символы ASCII (0-31, 127): \\t (табуляция), \\n (перевод строки), \\r (возврат каретки), \\0 (null), ESC и т.д.
- Символы Unicode категории "Other" и "Separator" (кроме обычного пробела U+0020)

Что считается печатаемым:
- Все видимые символы ASCII (32-126): буквы, цифры, знаки препинания
- Обычный пробел ' ' (U+0020)
- Большинство печатаемых символов Unicode: буквы, числа, знаки всех языков

Пустая строка: isprintable() возвращает True для пустой строки (в отличие от большинства других is*() методов, кроме isascii()).

Применение:
- Проверка данных перед выводом в терминал
- Валидация пользовательского ввода на наличие управляющих символов
- Очистка строк от невидимых символов
- Безопасный вывод потенциально "грязных" строк`,
    syntax: "str.isprintable()",
    arguments: [],
    example: `"Hello World!".isprintable()    # True
"hello 123".isprintable()      # True
"".isprintable()               # True  (пустая → True!)
"hello\\nworld".isprintable()   # False  (\\n — непечатаемый)
"hello\\tworld".isprintable()   # False  (\\t — непечатаемый)
"hello\\x00".isprintable()      # False  (null-байт)

# Практическая проверка
def safe_print(s):
    if s.isprintable():
        print(s)
    else:
        print(repr(s))  # показать экранированный вид

safe_print("hello")         # hello
safe_print("hello\\nworld")  # 'hello\\nworld'

# Очистка строки от непечатаемых символов
def remove_non_printable(s):
    return ''.join(c for c in s if c.isprintable())`,
  },
  {
    name: "str.isspace()",
    description: `Возвращает True если строка не пустая и все символы являются пробельными символами (whitespace), иначе False.

Пробельные символы включают:
- Пробел (U+0020, ' ')
- Табуляция (\\t, U+0009)
- Перевод строки (\\n, U+000A)
- Вертикальная табуляция (\\v, U+000B)
- Перевод страницы (\\f, U+000C)
- Возврат каретки (\\r, U+000D)
- Неразрывный пробел и другие Unicode пробельные символы

Пустая строка: возвращает False (в отличие от isprintable()).

Сравнение с strip():
- isspace() проверяет всю строку
- strip() удаляет пробельные символы с краёв
- Паттерн: if not s.strip(): ... — проверяет что строка "пустая или только пробелы"

Применение:
- Проверка что строка состоит только из пробелов/переносов
- Фильтрация пустых строк при чтении файлов
- Валидация пользовательского ввода`,
    syntax: "str.isspace()",
    arguments: [],
    example: `" ".isspace()          # True  (пробел)
"   ".isspace()        # True  (несколько пробелов)
"\\t\\n\\r".isspace()     # True  (разные whitespace)
"".isspace()           # False  (пустая строка!)
"hello".isspace()      # False
" hello ".isspace()    # False  (есть непробельные)
"\\n".isspace()         # True

# Фильтрация строк файла
with open("file.txt") as f:
    lines = [line.rstrip() for line in f if not line.isspace()]

# Проверка "пустого" ввода (только пробелы = тоже пусто)
user_input = "   "
if not user_input or user_input.isspace():
    print("Введите непустое значение")

# Ещё идиоматичнее:
if not user_input.strip():
    print("Введите непустое значение")`,
  },
  {
    name: "str.istitle()",
    description: `Возвращает True если строка является "titlecased" — каждое слово начинается с заглавной буквы, а все последующие буквы в слове строчные. Строка должна содержать хотя бы одну букву.

Алгоритм istitle(): символ считается "начинающим слово" если он идёт после небуквенного символа (пробела, знака препинания, цифры). Поэтому:
- "It's Fine" → True (апостроф сбрасывает: F после ' — заглавная)
- "It's fine" → False (f строчная после ')

Особенности:
- Цифры и знаки игнорируются: "Hello 2nd World" → True
- Апостроф сбрасывает счётчик слова: "O'Brien" → True (B заглавная после ')
- Это иногда неожиданно: "It's" в истинном title case пишется "It'S" по правилам Python

Сравнение:
- istitle() — проверяет "titlecased" строку
- title() — преобразует строку в title case

Применение: проверка правильности оформления заголовков, имён, названий книг.`,
    syntax: "str.istitle()",
    arguments: [],
    example: `"Hello World".istitle()       # True
"Hello world".istitle()       # False  (world — строчная w)
"HELLO WORLD".istitle()       # False  (второй+ символ заглавный)
"Hello 123 World".istitle()   # True   (цифры игнорируются)
"".istitle()                  # False  (нет букв)
"A".istitle()                 # True

# Апострофы
"It's Fine".istitle()         # True  (F — после апострофа = начало слова)
"It's fine".istitle()         # False (f строчная)

# title() vs istitle()
s = "hello world"
s.title()            # 'Hello World'  — преобразование
s.title().istitle()  # True  — проверка

# Практическое использование
book_title = "The Great Gatsby"
book_title.istitle()  # True  — корректный заголовок

# Но: нюанс с апострофами
"O'Brien".istitle()      # True  (B заглавная)
"O'brien".istitle()      # False`,
  },
  {
    name: "str.isupper()",
    description: `Возвращает True если все буквенные символы строки являются заглавными (верхним регистром) и в строке есть хотя бы одна буква, иначе False.

Симметричный метод к islower(). Небуквенные символы (цифры, пробелы, знаки) игнорируются при проверке.

Важные нюансы:
- "ABC123".isupper() → True (цифры не в счёт)
- "ABC!".isupper() → True (знак не в счёт)
- "123".isupper() → False (нет букв)
- "".isupper() → False (пустая строка)

Работает с Unicode: кириллица, греческие буквы и другие алфавиты обрабатываются корректно.

Применение:
- Проверка что строка введена CAPSLOCK
- Валидация константных имён (UPPER_CASE — конвенция Python для констант)
- Обнаружение кричащих комментариев
- Проверка аббревиатур`,
    syntax: "str.isupper()",
    arguments: [],
    example: `"HELLO".isupper()        # True
"HELLO WORLD".isupper()  # True  (пробел игнорируется)
"HELLO 123".isupper()    # True  (цифры игнорируются)
"Hello".isupper()        # False  (e, l, l, o — строчные)
"hello".isupper()        # False
"123".isupper()          # False  (нет букв!)
"".isupper()             # False
"ПРИВЕТ".isupper()       # True   (кириллица)

# Проверка константных имён Python
names = ["MAX_SIZE", "min_value", "TIMEOUT", "DEFAULT"]
constants = [n for n in names if n.replace("_","").isupper()]
# ['MAX_SIZE', 'TIMEOUT', 'DEFAULT']

# Детектирование CAPS LOCK
def check_caps(text):
    if text.isupper() and len(text) > 3:
        print("Caps Lock включён?")
        return text.capitalize()
    return text`,
  },
  {
    name: "str.join(iterable)",
    description: `Возвращает строку, полученную конкатенацией элементов итерируемого объекта через разделитель — вызывающую строку. Все элементы итерируемого должны быть строками.

Синтаксис может поначалу казаться инверсным: разделитель стоит перед .join(). Это сделано специально — по разделителю обычно ясно намерение.

Производительность: join() — правильный способ конкатенации многих строк. Использование += в цикле создаёт новую строку на каждом шаге (O(n²)), тогда как join() делает это за один проход (O(n)).

Правило: если нужно объединить много строк — используйте join(). Для 2-3 строк + или f-строки вполне подходят.

Если элементы не строки: нужно предварительно преобразовать: ", ".join(str(x) for x in items).

Специальные разделители:
- "".join(lst) — без разделителя (склеить)
- " ".join(lst) — через пробел
- "\\n".join(lst) — каждый элемент на новой строке
- ", ".join(lst) — перечисление через запятую
- os.sep.join(parts) — путь файловой системы`,
    syntax: "str.join(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект, содержащий строки. Если элементы не строки — возникает TypeError",
      },
    ],
    example: `", ".join(["apple", "banana", "cherry"])
# 'apple, banana, cherry'

" ".join(["Hello", "World"])    # 'Hello World'
"".join(["a", "b", "c"])        # 'abc'
"-".join("hello")               # 'h-e-l-l-o'  (строка тоже итерируема)
"\\n".join(["line1", "line2"])   # 'line1\\nline2'

# Производительность: правильно и быстро
parts = ["chunk"] * 1000
result = "".join(parts)  # O(n) — создаёт одну строку

# Неправильно (медленно для больших списков)
# result = ""
# for p in parts:
#     result += p   # O(n²) — каждый раз новая строка!

# Конвертация нестроковых элементов
numbers = [1, 2, 3, 4, 5]
", ".join(str(n) for n in numbers)   # '1, 2, 3, 4, 5'

# Путь файловой системы
import os
os.path.join("home", "user", "docs")  # 'home/user/docs'
"/".join(["home", "user", "docs"])    # 'home/user/docs'`,
  },
  {
    name: "str.ljust(width[, fillchar])",
    description: `Возвращает строку, выровненную по левому краю в поле заданной ширины width. Дополняется символом fillchar справа до нужной ширины.

Если width меньше или равен длине строки — возвращается исходная строка без изменений.

Семейство методов выравнивания:
- ljust(width, fillchar) — по левому краю (дополнение справа)
- rjust(width, fillchar) — по правому краю (дополнение слева)
- center(width, fillchar) — по центру
- zfill(width) — дополнение нулями слева (специально для чисел)

Аналоги через форматирование строк (предпочтительны в современном коде):
- f"{'text':<10}" — ljust(10)
- f"{'text':>10}" — rjust(10)
- f"{'text':^10}" — center(10)
- f"{'text':-<10}" — ljust(10, '-')

ljust() удобен для форматирования текстовых таблиц и выравнивания колонок в консольном выводе.`,
    syntax: "str.ljust(width[, fillchar])",
    arguments: [
      { name: "width", description: "Ширина результирующей строки" },
      {
        name: "fillchar",
        description:
          "Необязательный. Символ заполнения. По умолчанию ' ' (пробел)",
      },
    ],
    example: `"hello".ljust(10)          # 'hello     '  (5 пробелов справа)
"hello".ljust(10, "-")    # 'hello-----'
"hello".ljust(3)          # 'hello'  (width <= len)

# Через f-строки (эквивалентно)
f"{'hello':<10}"          # 'hello     '
f"{'hello':-<10}"         # 'hello-----'

# Форматирование таблицы
data = [("Alice", 95), ("Bob", 87), ("Carol", 92)]
print("Имя        | Оценка")
print("-" * 20)
for name, score in data:
    print(f"{name.ljust(10)} | {score}")
# Имя        | Оценка
# --------------------
# Alice      | 95
# Bob        | 87
# Carol      | 92`,
  },
  {
    name: "str.lower()",
    description: `Возвращает копию строки, в которой все символы верхнего регистра преобразованы в нижний регистр.

Корректно работает с Unicode: преобразует заглавные буквы не только ASCII (A-Z), но и все другие алфавиты — кириллицу, греческий, турецкий и т.д.

Нюанс с турецким i: в некоторых языках правила регистра специфичны (İ → i в турецком), но lower() использует Unicode-правила общего назначения, которые не учитывают locale. Для locale-зависимого преобразования используйте locale.strxfrm() или сторонние библиотеки.

Сравнение с casefold():
- lower() — стандартное приведение к нижнему регистру
- casefold() — более агрессивное преобразование для сравнения (ß → ss в немецком)

Применения:
- Нормализация строк перед сравнением без учёта регистра
- Поиск без учёта регистра: query.lower() in text.lower()
- Нормализация пользовательского ввода
- Создание ключей для словарей (case-insensitive ключи)`,
    syntax: "str.lower()",
    arguments: [],
    example: `"Hello World".lower()     # 'hello world'
"HELLO".lower()           # 'hello'
"Python 3.11".lower()     # 'python 3.11'  (цифры не меняются)
"ПРИВЕТ МИР".lower()      # 'привет мир'
"".lower()                # ''

# Сравнение без учёта регистра
"Python" == "python"                  # False
"Python".lower() == "python".lower()  # True

# Поиск без учёта регистра
text = "Hello, Python is Great!"
"python" in text.lower()   # True

# Case-insensitive словарь (упрощённый)
data = {}
def set_key(key, value):
    data[key.lower()] = value

set_key("Name", "Alice")
set_key("name", "Bob")   # перезапишет, т.к. тот же ключ 'name'

# lower() vs casefold()
"Straße".lower()      # 'straße'
"Straße".casefold()   # 'strasse'  (для сравнения лучше casefold)`,
  },
  {
    name: "str.lstrip([chars])",
    description: `Возвращает копию строки с удалёнными ведущими символами (слева). По умолчанию удаляет пробельные символы.

Параметр chars — строка с символами для удаления (не подстрока, а набор символов). Каждый символ из chars удаляется слева, пока не встретится символ, которого нет в chars.

Важно: chars — это набор символов, а не подстрока. lstrip("abc") удаляет любые комбинации 'a', 'b', 'c' слева, а не именно подстроку "abc".

Семейство strip-методов:
- lstrip([chars]) — удаляет символы слева (ведущие)
- rstrip([chars]) — удаляет символы справа (завершающие)
- strip([chars]) — удаляет символы с обеих сторон

Пробельные символы по умолчанию: пробел, \\t, \\n, \\r, \\v, \\f.

Применение:
- Очистка пользовательского ввода от ведущих пробелов
- Удаление префиксов символов
- Обработка текстовых файлов (удаление отступов)
- Удаление незначащих нулей из числовых строк`,
    syntax: "str.lstrip([chars])",
    arguments: [
      {
        name: "chars",
        description:
          "Необязательный. Строка с символами для удаления слева. По умолчанию удаляет пробельные символы (' ', '\\t', '\\n', '\\r' и т.д.)",
      },
    ],
    example: `"   hello".lstrip()         # 'hello'
"\\t\\nhello".lstrip()        # 'hello'
"hello   ".lstrip()         # 'hello   '  (справа не трогает!)
"   hello   ".lstrip()      # 'hello   '

# Удаление конкретных символов (набор, не строка)
"xxxhello".lstrip("x")      # 'hello'
"aabbcchello".lstrip("abc") # 'hello'  (удаляет a,b,c в любом порядке)
"cbacbahello".lstrip("abc") # 'hello'
"abchello".lstrip("bca")    # 'hello'  (порядок в chars не важен)

# Сравнение strip-методов
s = "  hello  "
s.lstrip()    # 'hello  '  — только слева
s.rstrip()    # '  hello'  — только справа
s.strip()     # 'hello'    — с обеих сторон

# Удаление нулей слева
"00042".lstrip("0")    # '42'
"000".lstrip("0")      # ''  (все нули удалены)

# Но лучше для чисел:
int("00042")            # 42`,
  },
  {
    name: "str.maketrans(x[, y[, z]])",
    description: `Статический метод. Создаёт таблицу перевода (translation table) для использования с методом str.translate(). Сам по себе не изменяет строку — только подготавливает таблицу.

Три формы вызова:
1. maketrans(dict) — словарь {ord(char): replacement или None}. Ключи — кодовые точки Unicode (int) или строки одного символа
2. maketrans(x, y) — две строки одинаковой длины: каждый символ x заменяется соответствующим символом y
3. maketrans(x, y, z) — как форма 2, плюс символы из z удаляются (заменяются на None)

Метод translate(table) применяет таблицу к строке.

Это более эффективный способ многократной замены символов по сравнению с цепочкой вызовов replace().

Применения:
- Транслитерация (кириллица → латиница)
- ROT13 и другие простые шифры
- Удаление знаков препинания
- Нормализация специальных символов`,
    syntax: "str.maketrans(x[, y[, z]])",
    arguments: [
      {
        name: "x",
        description:
          "Словарь сопоставлений, или строка символов для замены (форма 2/3)",
      },
      {
        name: "y",
        description:
          "Необязательный (форма 2/3). Строка замены — символы из x заменяются соответствующими из y. Длина y должна равняться длине x",
      },
      {
        name: "z",
        description:
          "Необязательный (форма 3). Строка символов для удаления (заменяются на None)",
      },
    ],
    example: `# Форма 2: замена символов
table = str.maketrans("aeiou", "AEIOU")
"hello world".translate(table)    # 'hEllO wOrld'

# Форма 3: замена + удаление
table = str.maketrans("aeiou", "AEIOU", " ")  # удалить пробелы
"hello world".translate(table)    # 'hEllOwOrld'

# Форма 1: словарь (более гибкая)
table = str.maketrans({
    'а': 'a', 'б': 'b', 'в': 'v',
    'г': 'g', 'д': 'd', 'е': 'e'
})
"где".translate(table)  # 'gde'

# Удаление знаков препинания
import string
remove = str.maketrans("", "", string.punctuation)
"Hello, World!".translate(remove)   # 'Hello World'

# ROT13
abc = "abcdefghijklmnopqrstuvwxyz"
rot13_table = str.maketrans(abc + abc.upper(),
                             abc[13:] + abc[:13] + (abc[13:] + abc[:13]).upper())
"Hello".translate(rot13_table)   # 'Uryyb'`,
  },
  {
    name: "str.partition(sep)",
    description: `Делит строку по первому вхождению разделителя sep и возвращает кортеж из трёх элементов: (часть до sep, сам sep, часть после sep).

Если sep не найден, возвращает кортеж (исходная_строка, '', '').

Всегда возвращает кортеж ровно из трёх элементов. Это отличает partition() от split(), который возвращает список переменной длины.

Преимущество перед split():
- split(sep, 1) даёт список из 1-2 элементов (непредсказуемая длина, нужна распаковка с проверкой)
- partition() всегда возвращает (head, sep, tail) — можно распаковать напрямую

rpartition(sep) — разбивает по последнему вхождению (справа).

Практические применения:
- Разбор строк формата "ключ=значение"
- Извлечение протокола из URL: url.partition("://")
- Разбор email: "user@domain".partition("@")
- Безопасное разбиение когда sep может отсутствовать`,
    syntax: "str.partition(sep)",
    arguments: [
      {
        name: "sep",
        description:
          "Строка-разделитель. Разбивает по первому вхождению. Не может быть пустой строкой",
      },
    ],
    example: `"hello world".partition(" ")
# ('hello', ' ', 'world')

"key=value".partition("=")
# ('key', '=', 'value')

"no-separator".partition("@")
# ('no-separator', '', '')  — sep не найден

# rpartition — по последнему вхождению
"a.b.c".partition(".")    # ('a', '.', 'b.c')   первое
"a.b.c".rpartition(".")   # ('a.b', '.', 'c')   последнее

# Разбор URL
url = "https://example.com/path"
protocol, _, rest = url.partition("://")
print(protocol)  # 'https'
print(rest)      # 'example.com/path'

# Безопасный разбор "ключ=значение"
line = "name=Alice"
key, sep, value = line.partition("=")
if sep:   # sep пустой если "=" не найдено
    print(f"{key!r} = {value!r}")   # 'name' = 'Alice'`,
  },
  {
    name: "str.removeprefix(prefix)",
    description: `Если строка начинается с указанного префикса, возвращает строку без этого префикса. Если не начинается — возвращает исходную строку без изменений.

Добавлен в Python 3.9. До этого использовали: s[len(prefix):] if s.startswith(prefix) else s.

Ключевое отличие от lstrip():
- lstrip(chars) удаляет любые комбинации символов из chars слева
- removeprefix(prefix) удаляет ровно одно вхождение конкретной подстроки prefix

Пример разницы: "aabbc".lstrip("a") → "bbc", "aabbc".removeprefix("a") → "abbc" (удалено только одно 'a').

Симметричный метод: removesuffix(suffix) — удаляет суффикс.

Применения:
- Удаление фиксированного префикса из имён файлов
- Очистка URL от "http://" или "https://"
- Нормализация строк протоколов и форматов
- Работа с именованными константами`,
    syntax: "str.removeprefix(prefix)",
    arguments: [
      {
        name: "prefix",
        description:
          "Строка-префикс для удаления. Если строка не начинается с prefix, возвращается исходная строка",
      },
    ],
    example: `"Hello, World!".removeprefix("Hello, ")  # 'World!'
"TestHello".removeprefix("Test")         # 'Hello'
"Hello".removeprefix("World")            # 'Hello'  (нет совпадения)
"".removeprefix("abc")                   # ''

# Разница с lstrip()
"aaabbb".lstrip("a")          # 'bbb'  — удаляет все 'a' слева
"aaabbb".removeprefix("a")    # 'aabbb'  — удаляет ровно одну 'a'

# Удаление протокола из URL
url = "https://example.com"
url.removeprefix("https://")   # 'example.com'
url.removeprefix("http://")    # 'https://example.com'  (не совпало)

# Обработка списка с единым префиксом
files = ["img_photo1.jpg", "img_photo2.jpg", "img_avatar.jpg"]
clean = [f.removeprefix("img_") for f in files]
# ['photo1.jpg', 'photo2.jpg', 'avatar.jpg']

# До Python 3.9:
# s[len(prefix):] if s.startswith(prefix) else s`,
  },
  {
    name: "str.removesuffix(suffix)",
    description: `Если строка заканчивается указанным суффиксом, возвращает строку без этого суффикса. Если не заканчивается — возвращает исходную строку без изменений.

Добавлен в Python 3.9 вместе с removeprefix(). До этого использовали: s[:-len(suffix)] if s.endswith(suffix) else s.

Ключевое отличие от rstrip():
- rstrip(chars) удаляет любые комбинации символов из chars справа
- removesuffix(suffix) удаляет ровно одно вхождение конкретной подстроки suffix

Применения:
- Удаление расширения файла (.txt, .py, .csv)
- Нормализация строк с известными окончаниями
- Работа с именами конфигурационных ключей
- Очистка строк перед дальнейшей обработкой`,
    syntax: "str.removesuffix(suffix)",
    arguments: [
      {
        name: "suffix",
        description:
          "Строка-суффикс для удаления. Если строка не заканчивается на suffix, возвращается исходная строка",
      },
    ],
    example: `"Hello, World!".removesuffix(", World!")  # 'Hello'
"file.txt".removesuffix(".txt")          # 'file'
"file.txt".removesuffix(".csv")          # 'file.txt'  (нет совпадения)
"".removesuffix(".txt")                  # ''

# Разница с rstrip()
"aaabbb".rstrip("b")          # 'aaa'   — удаляет все 'b' справа
"aaabbb".removesuffix("b")    # 'aaabb' — удаляет ровно одну 'b'

# Удаление расширения файла
filename = "report.csv"
name = filename.removesuffix(".csv")   # 'report'

# Обработка нескольких расширений
extensions = [".txt", ".csv", ".json"]
def remove_ext(f):
    for ext in extensions:
        f = f.removesuffix(ext)
    return f

remove_ext("data.csv")    # 'data'
remove_ext("notes.txt")   # 'notes'

# До Python 3.9:
# s[:-len(suffix)] if s.endswith(suffix) else s`,
  },
  {
    name: "str.replace(old, new[, count])",
    description: `Возвращает копию строки, в которой все вхождения подстроки old заменены на new. Если указан параметр count, заменяются только первые count вхождений.

Строки в Python неизменяемы — replace() всегда создаёт новую строку.

Параметр count:
- Если не указан (или -1) — заменяются все вхождения
- count=1 — только первое вхождение
- count=0 — ничего не заменяется (возвращается исходная строка)

Если old не найден в строке — возвращается исходная строка без изменений (без ошибки).

Замена пустой строки: replace("", "X") вставляет X между каждым символом и в начале/конце. Используется редко.

Производительность: replace() быстрее цепочки многократных замен через регулярное выражение для простых строковых подстановок. Для сложных паттернов используйте re.sub().

Применения: исправление опечаток, нормализация текста, генерация кода, шаблонизация строк.`,
    syntax: "str.replace(old, new[, count])",
    arguments: [
      { name: "old", description: "Подстрока для замены" },
      { name: "new", description: "Строка замены" },
      {
        name: "count",
        description:
          "Необязательный. Максимальное число замен. По умолчанию все вхождения",
      },
    ],
    example: `"hello world".replace("world", "Python")  # 'hello Python'
"aaa".replace("a", "b")                  # 'bbb'
"aaa".replace("a", "b", 2)               # 'bba'  (только 2 замены)
"hello".replace("xyz", "abc")            # 'hello'  (не найдено — без ошибки)

# Удаление символов (замена на пустую строку)
"hello, world!".replace(",", "")         # 'hello world!'
"h-e-l-l-o".replace("-", "")            # 'hello'

# Цепочка замен
text = "the cat sat on the mat"
text.replace("cat", "dog").replace("mat", "rug")
# 'the dog sat on the rug'

# Нормализация разделителей
"path\\to\\file".replace("\\\\", "/")    # 'path/to/file'

# Шаблон с заполнителями
template = "Hello, {NAME}! You have {COUNT} messages."
template.replace("{NAME}", "Alice").replace("{COUNT}", "3")
# 'Hello, Alice! You have 3 messages.'`,
  },
  {
    name: "str.rfind(sub[, start[, end]])",
    description: `Возвращает наибольший индекс (позицию) последнего вхождения подстроки sub в строке. Если подстрока не найдена, возвращает -1.

Является зеркальным методом к find() — ищет с конца строки, а не с начала.

Параметры start и end ограничивают область поиска как срезы. Поиск ведётся в пределах s[start:end], но возвращается позиция в исходной строке.

Разница find() vs rfind():
- find() — индекс первого (самого левого) вхождения
- rfind() — индекс последнего (самого правого) вхождения

Аналогично rindex() — работает как rfind(), но возбуждает ValueError вместо -1 при отсутствии.

Применения:
- Нахождение последнего разделителя (/ в пути файла)
- Поиск последнего ключевого слова в тексте
- Разбиение строки по последнему вхождению`,
    syntax: "str.rfind(sub[, start[, end]])",
    arguments: [
      { name: "sub", description: "Подстрока для поиска" },
      {
        name: "start",
        description: "Необязательный. Начальный индекс области поиска",
      },
      {
        name: "end",
        description:
          "Необязательный. Конечный индекс области поиска (не включается)",
      },
    ],
    example: `"hello hello".rfind("hello")    # 6  (последнее вхождение)
"hello hello".find("hello")     # 0  (первое вхождение)
"abcabc".rfind("b")             # 4
"hello".rfind("xyz")            # -1  (не найдено)
"hello".rfind("")               # 5   (len строки)

# Практический пример: имя файла без расширения
path = "/home/user/documents/report.tar.gz"
last_dot = path.rfind(".")
filename = path[:last_dot]    # '/home/user/documents/report.tar'
ext = path[last_dot:]         # '.gz'

# Нахождение последнего каталога
path2 = "/home/user/docs/file.txt"
last_slash = path2.rfind("/")
directory = path2[:last_slash]   # '/home/user/docs'
filename2 = path2[last_slash+1:] # 'file.txt'
# (лучше: os.path.dirname и os.path.basename)`,
  },
  {
    name: "str.rindex(sub[, start[, end]])",
    description: `Возвращает наибольший индекс последнего вхождения подстроки sub в строке. Если подстрока не найдена — возбуждает ValueError.

Является зеркальным методом к index() — ищет с конца строки. Аналогично rfind(), но вместо -1 при отсутствии возбуждает исключение.

Четыре связанных метода поиска:
- find(sub) — первое вхождение, возвращает -1 если нет
- index(sub) — первое вхождение, ValueError если нет
- rfind(sub) — последнее вхождение, возвращает -1 если нет
- rindex(sub) — последнее вхождение, ValueError если нет

Правило выбора: используйте rindex() когда отсутствие подстроки является логической ошибкой и нужно явное исключение. Используйте rfind() для "мягкой" проверки.

Параметры start и end работают как и в других методах поиска.`,
    syntax: "str.rindex(sub[, start[, end]])",
    arguments: [
      {
        name: "sub",
        description: "Подстрока для поиска (последнее вхождение)",
      },
      {
        name: "start",
        description: "Необязательный. Начальный индекс области поиска",
      },
      {
        name: "end",
        description:
          "Необязательный. Конечный индекс области поиска (не включается)",
      },
    ],
    example: `"abcabc".rindex("b")        # 4  (последнее вхождение)
"abcabc".rindex("abc")      # 3  (последнее вхождение "abc")
"hello hello".rindex("lo")  # 9

# ValueError если не найдено
try:
    "hello".rindex("xyz")
except ValueError as e:
    print(e)  # substring not found

# Сравнение четырёх методов
s = "banana"
s.find("a")     # 1  (первое)
s.rfind("a")    # 5  (последнее)
s.index("a")    # 1  (первое, ValueError если нет)
s.rindex("a")   # 5  (последнее, ValueError если нет)

# Применение: разбор строки с гарантированным разделителем
line = "2024-03-28 INFO User logged in"
last_space = line.rindex(" ")
last_word = line[last_space+1:]   # 'in'`,
  },
  {
    name: "str.rjust(width[, fillchar])",
    description: `Возвращает строку, выровненную по правому краю в поле заданной ширины width. Дополняется символом fillchar слева до нужной ширины.

Если width меньше или равен длине строки — возвращается исходная строка без изменений.

Семейство методов выравнивания:
- rjust(width, fillchar) — по правому краю (дополнение слева)
- ljust(width, fillchar) — по левому краю (дополнение справа)
- center(width, fillchar) — по центру
- zfill(width) — как rjust(width, '0'), но правильно обрабатывает знак числа

Аналоги через форматирование строк:
- f"{'text':>10}" — rjust(10) с пробелами
- f"{'text':0>5}" — rjust(5, '0')
- f"{42:05d}" — число с ведущими нулями (лучше для чисел)

Применение: выравнивание числовых колонок в таблицах, форматирование чисел, создание текстового интерфейса.`,
    syntax: "str.rjust(width[, fillchar])",
    arguments: [
      { name: "width", description: "Ширина результирующей строки" },
      {
        name: "fillchar",
        description:
          "Необязательный. Символ заполнения. По умолчанию ' ' (пробел)",
      },
    ],
    example: `"hello".rjust(10)          # '     hello'  (5 пробелов слева)
"hello".rjust(10, "-")    # '-----hello'
"hello".rjust(3)          # 'hello'  (width <= len)
"42".rjust(5, "0")        # '00042'  (ведущие нули)

# Через f-строки (эквивалентно)
f"{'hello':>10}"          # '     hello'
f"{'hello':-<10}"         # 'hello-----'  (это ljust!)
f"{42:05d}"               # '00042'  — лучше для чисел

# Форматирование числовой таблицы
items = [("Яблоко", 1.5), ("Банан", 0.75), ("Арбуз", 12.99)]
print("Продукт         | Цена")
print("-" * 25)
for name, price in items:
    print(f"{name.ljust(15)} | {str(price).rjust(5)}")
# Продукт         | Цена
# -------------------------
# Яблоко          |   1.5
# Банан           |  0.75
# Арбуз           | 12.99`,
  },
  {
    name: "str.rpartition(sep)",
    description: `Делит строку по последнему вхождению разделителя sep и возвращает кортеж из трёх элементов: (часть до sep, сам sep, часть после sep).

Если sep не найден, возвращает кортеж ('', '', исходная_строка) — в отличие от partition(), где пустые строки стоят в конце.

Зеркальный метод к partition():
- partition(sep) — по первому вхождению: (head, sep, tail)
- rpartition(sep) — по последнему вхождению: (head, sep, tail)
- При отсутствии sep: partition() → ('original', '', ''), rpartition() → ('', '', 'original')

Практические применения:
- Отделение расширения файла (по последней точке)
- Разбор пути (последний слэш)
- Разделение host:port (последнее двоеточие в IPv6-адресах)
- Любая задача "разбить по последнему вхождению"`,
    syntax: "str.rpartition(sep)",
    arguments: [
      {
        name: "sep",
        description:
          "Строка-разделитель. Разбивает по последнему вхождению. Не может быть пустой строкой",
      },
    ],
    example: `"a.b.c".rpartition(".")
# ('a.b', '.', 'c')  — по последней точке

"a.b.c".partition(".")
# ('a', '.', 'b.c')  — по первой точке

"no-sep".rpartition("@")
# ('', '', 'no-sep')  — sep не найден (пустые в начале!)

"no-sep".partition("@")
# ('no-sep', '', '')  — sep не найден (пустые в конце!)

# Отделение расширения файла
filename = "archive.tar.gz"
name, dot, ext = filename.rpartition(".")
print(name)   # 'archive.tar'
print(ext)    # 'gz'

# Разбор пути
path = "/home/user/docs/file.txt"
directory, _, fname = path.rpartition("/")
print(directory)  # '/home/user/docs'
print(fname)      # 'file.txt'
# (лучше: os.path.split(path))`,
  },
  {
    name: "str.rsplit(sep=None, maxsplit=-1)",
    description: `Делит строку на подстроки, начиная с конца, и возвращает список. Идентичен split(), но при указании maxsplit деление идёт справа налево.

Без аргументов (или с sep=None): разбивает по любым пробельным символам, игнорирует ведущие и завершающие пробелы, несколько пробельных символов подряд — один разделитель. Поведение совпадает с split().

Ключевое отличие от split():
- split(sep, maxsplit=N) — оставляет нетронутой правую часть, если достигнут лимит
- rsplit(sep, maxsplit=N) — оставляет нетронутой левую часть, если достигнут лимит

Когда использовать rsplit():
- Нужно получить последние N частей строки, а остаток сохранить целым
- Разбор пути файла по последнему разделителю (аналог rpartition, но удобнее при нескольких частях)
- Обработка строк формата "версия: 1.2.3" — взять последний компонент

Без maxsplit результаты split() и rsplit() идентичны для одного разделителя.`,
    syntax: "str.rsplit(sep=None, maxsplit=-1)",
    arguments: [
      {
        name: "sep",
        description:
          "Строка-разделитель. None (по умолчанию) — разбивка по пробельным символам с игнорированием пустых токенов",
      },
      {
        name: "maxsplit",
        description:
          "Максимальное число делений (считается с конца). -1 (по умолчанию) — без ограничений",
      },
    ],
    example: `"a b c d".rsplit()             # ['a', 'b', 'c', 'd']  (без лимита — как split)
"a b c d".rsplit(maxsplit=2)   # ['a b', 'c', 'd']  — с конца!
"a b c d".split(maxsplit=2)    # ['a', 'b', 'c d']  — с начала

# С разделителем
"a.b.c.d".rsplit(".", maxsplit=1)   # ['a.b.c', 'd']  — хвост
"a.b.c.d".split(".", maxsplit=1)    # ['a', 'b.c.d']  — голова

# Практический пример: последний компонент версии
version = "1.2.3.4"
major, rest = version.split(".", maxsplit=1)   # ['1', '2.3.4']
*init, patch = version.rsplit(".", maxsplit=1)  # ['1.2.3', '4']
print(patch)   # '4'

# Последние два элемента пути
path = "home/user/docs/file.txt"
base, name = path.rsplit("/", maxsplit=1)
print(base)   # 'home/user/docs'
print(name)   # 'file.txt'`,
  },
  {
    name: "str.rstrip([chars])",
    description: `Возвращает копию строки с удалёнными завершающими символами (справа). По умолчанию удаляет пробельные символы.

Зеркальный метод к lstrip(). Параметр chars — набор символов для удаления (не подстрока), каждый символ из набора удаляется справа, пока не встретится символ вне набора.

Семейство strip-методов:
- lstrip([chars]) — удаляет символы слева
- rstrip([chars]) — удаляет символы справа
- strip([chars]) — удаляет символы с обеих сторон

Самое частое применение — удаление символа переноса строки \\n при чтении строк из файла: line.rstrip("\\n") или просто line.rstrip() (удаляет все trailing whitespace).

Важно: chars — набор, не строка. rstrip("abc") удаляет любые a, b, c с конца в любом порядке, пока они там есть.

Применения:
- Очистка строк файла: line.rstrip("\\n")
- Удаление trailing пробелов
- Нормализация путей: path.rstrip("/")
- Удаление незначащих символов`,
    syntax: "str.rstrip([chars])",
    arguments: [
      {
        name: "chars",
        description:
          "Необязательный. Набор символов для удаления справа. По умолчанию пробельные символы (' ', '\\t', '\\n', '\\r' и т.д.)",
      },
    ],
    example: `"hello   ".rstrip()         # 'hello'
"hello\\n".rstrip()          # 'hello'
"   hello   ".rstrip()      # '   hello'  (слева не трогает!)
"hello!!!".rstrip("!")      # 'hello'
"hello...".rstrip(".")      # 'hello'
"helloabc".rstrip("bca")    # 'hello'  (набор, порядок не важен)

# Чтение строк файла
with open("file.txt") as f:
    lines = [line.rstrip("\\n") for line in f]

# Нормализация URL/пути
url = "https://example.com///"
url.rstrip("/")   # 'https://example.com'

# Сравнение strip-методов
s = "  hello  "
s.lstrip()    # 'hello  '
s.rstrip()    # '  hello'
s.strip()     # 'hello'

# Удаление расширения (грубый способ — лучше removesuffix)
"file.txt".rstrip("txt")   # 'file.'  (удаляет t, x, t — все буквы!)`,
  },
  {
    name: "str.split(sep=None, maxsplit=-1)",
    description: `Делит строку на подстроки по разделителю sep и возвращает список. Один из самых используемых методов строк.

Два режима работы:

1. sep=None (по умолчанию) — "умная" разбивка по пробельным символам:
   - Разбивает по любым последовательностям пробелов, \\t, \\n, \\r, \\f, \\v
   - Игнорирует ведущие и завершающие пробелы (не создаёт пустых строк)
   - Несколько пробелов подряд — один разделитель

2. sep задан явно:
   - Разбивает ровно по этой подстроке
   - Ведущие/завершающие разделители создают пустые строки в начале/конце
   - Два разделителя рядом создают пустую строку между ними

Параметр maxsplit ограничивает количество делений слева направо. Остаток строки остаётся нетронутым в последнем элементе.

Обратная операция: sep.join(list).

Сравнение с rsplit(): split() делит слева направо, rsplit() — справа налево (важно только при maxsplit).`,
    syntax: "str.split(sep=None, maxsplit=-1)",
    arguments: [
      {
        name: "sep",
        description:
          'Разделитель. None (по умолчанию) — умная разбивка по пробелам. Пустая строка "" — ValueError',
      },
      {
        name: "maxsplit",
        description:
          "Максимальное число делений (-1 = без ограничений). При maxsplit=N возвращает не более N+1 элементов",
      },
    ],
    example: `"hello world".split()            # ['hello', 'world']
"  hello   world  ".split()     # ['hello', 'world']  (пробелы игнорируются)
"a,b,c".split(",")              # ['a', 'b', 'c']
"a,,b".split(",")               # ['a', '', 'b']  (пустая строка!)
",a,b,".split(",")              # ['', 'a', 'b', '']  (пустые по краям)

# maxsplit
"a b c d".split(maxsplit=2)     # ['a', 'b', 'c d']  (остаток целый)
"a:b:c:d".split(":", maxsplit=1) # ['a', 'b:c:d']

# Парсинг CSV (упрощённо)
row = "Alice,30,Москва"
name, age, city = row.split(",")
print(name, age, city)  # Alice 30 Москва

# Разбор конфиг-файла
line = "host = localhost"
key, _, value = line.partition("=")
# или
parts = line.split("=", maxsplit=1)
key, value = parts[0].strip(), parts[1].strip()

# Обратная операция
words = ["Hello", "World"]
" ".join(words)   # 'Hello World'`,
  },
  {
    name: "str.splitlines([keepends])",
    description: `Делит строку на список строк по границам строк (line boundaries). Умеет распознавать все стандартные виды окончаний строк, включая смешанные.

Распознаваемые границы строк:
- \\n — Line Feed (Unix/Linux/macOS)
- \\r\\n — Carriage Return + Line Feed (Windows)
- \\r — Carriage Return (старый Mac)
- \\v или \\x0b — вертикальная табуляция
- \\f или \\x0c — Form Feed
- \\x1c, \\x1d, \\x1e — разделители файла/группы/записи
- \\x85 — NEXT LINE (NEL)
- \\u2028 — LINE SEPARATOR
- \\u2029 — PARAGRAPH SEPARATOR

Параметр keepends=True: включает символ окончания строки в каждый элемент результата.

Отличие от split("\\n"):
- splitlines() корректно обрабатывает \\r\\n как одну границу (split("\\n") оставит \\r в конце строки)
- splitlines() не создаёт лишнюю пустую строку если строка заканчивается на \\n
- "hello\\n".split("\\n") → ['hello', ''] (лишняя пустая), "hello\\n".splitlines() → ['hello']

Применение: чтение и обработка текстовых файлов с любыми окончаниями строк.`,
    syntax: "str.splitlines([keepends])",
    arguments: [
      {
        name: "keepends",
        description:
          "Необязательный. Если True — символы окончания строк включаются в результирующие строки. По умолчанию False",
      },
    ],
    example: `"line1\\nline2\\nline3".splitlines()
# ['line1', 'line2', 'line3']

"line1\\r\\nline2\\rline3".splitlines()
# ['line1', 'line2', 'line3']  (все виды переводов строк)

"hello\\n".splitlines()       # ['hello']  (без лишней пустой строки!)
"hello\\n".split("\\n")        # ['hello', '']  (лишняя пустая!)

# keepends=True
"a\\nb\\nc".splitlines(keepends=True)
# ['a\\n', 'b\\n', 'c']  — символы сохранены

# Смешанные окончания (Windows + Unix)
mixed = "line1\\r\\nline2\\nline3\\r"
mixed.splitlines()   # ['line1', 'line2', 'line3']

# Подсчёт строк
text = "Hello\\nWorld\\nPython"
len(text.splitlines())   # 3

# Обработка файла строка за строкой
content = open("file.txt").read()
for line in content.splitlines():
    print(line.strip())`,
  },
  {
    name: "str.startswith(prefix[, start[, end]])",
    description: `Возвращает True если строка начинается с указанного префикса prefix, иначе False.

prefix может быть:
- Строкой: "hello".startswith("he")
- Кортежем строк: "hello".startswith(("he", "wo")) — True если начинается хотя бы с одного. Это более эффективно и читаемо, чем несколько проверок с or.

Параметры start и end ограничивают область проверки как срезы. Проверяется s[start:end].

Симметричный метод: endswith() — проверяет конец строки.

Почему startswith() лучше чем s[:len(prefix)] == prefix:
- Читаемее и очевиднее по намерению
- Безопасен для пустых строк и любых длин
- Поддерживает кортеж — несколько вариантов в одном вызове

Применения:
- Определение протокола URL ("https://", "ftp://")
- Фильтрация строк с нужным началом
- Проверка команд в текстовых интерфейсах
- Условный парсинг по первому символу/слову`,
    syntax: "str.startswith(prefix[, start[, end]])",
    arguments: [
      {
        name: "prefix",
        description:
          "Строка или кортеж строк для проверки. При кортеже возвращает True если строка начинается хотя бы с одного из префиксов",
      },
      {
        name: "start",
        description: "Необязательный. Начальный индекс области проверки",
      },
      {
        name: "end",
        description:
          "Необязательный. Конечный индекс области проверки (не включается)",
      },
    ],
    example: `"hello world".startswith("hello")   # True
"hello world".startswith("world")   # False
"https://example.com".startswith("https")  # True

# Кортеж префиксов
url = "ftp://files.example.com"
url.startswith(("http://", "https://", "ftp://"))   # True

# С диапазоном
"hello world".startswith("world", 6)   # True  (с позиции 6)

# Применение: определение протокола
def get_protocol(url):
    for proto in ("https", "http", "ftp", "ws"):
        if url.startswith(proto + "://"):
            return proto
    return None

# Фильтрация команд
commands = ["get /api", "post /api", "get /users", "delete /item"]
get_cmds = [c for c in commands if c.startswith("get")]
# ['get /api', 'get /users']`,
  },
  {
    name: "str.strip([chars])",
    description: `Возвращает копию строки с удалёнными ведущими и завершающими символами с обеих сторон. По умолчанию удаляет пробельные символы.

Комбинирует действия lstrip() и rstrip(): сначала удаляет символы слева, затем справа.

Параметр chars — набор символов для удаления (не строка и не регулярное выражение). Порядок символов в chars не имеет значения.

Пробельные символы по умолчанию: пробел ' ', \\t, \\n, \\r, \\v, \\f.

Важные нюансы:
- strip() не изменяет строку — возвращает новую (строки неизменяемы)
- strip("ab") удаляет a и b в любом порядке с обоих концов — пока на краях есть a или b
- strip("ab") ≠ удаление подстроки "ab": "bab".strip("ab") → "" (удаляет все a и b с краёв)

Применения — одно из самых частых использований:
- Очистка пользовательского ввода от лишних пробелов
- Нормализация данных из файлов
- Обработка строк конфигурации
- Подготовка строк перед сравнением`,
    syntax: "str.strip([chars])",
    arguments: [
      {
        name: "chars",
        description:
          "Необязательный. Набор символов для удаления с обоих краёв. По умолчанию пробельные символы (' ', '\\t', '\\n', '\\r' и т.д.)",
      },
    ],
    example: `"  hello  ".strip()          # 'hello'
"\\t\\nhello\\n\\t".strip()      # 'hello'
"***hello***".strip("*")    # 'hello'
"aaabbbccc".strip("ac")     # 'bbb'  (удаляет a и c с краёв)
"abcba".strip("ab")         # 'c'    (удаляет a,b с краёв пока они там)
"".strip()                  # ''

# Очистка ввода пользователя
user_name = "  Alice  "
user_name.strip()   # 'Alice'

# Обработка конфиг файла
line = "  key = value  "
key, _, value = line.strip().partition("=")
key.strip()    # 'key'
value.strip()  # 'value'

# Чтение CSV с пробелами
csv_row = " Alice , 30 , Москва "
parts = [p.strip() for p in csv_row.split(",")]
# ['Alice', '30', 'Москва']

# strip НЕ удаляет подстроку:
"abcba".strip("ab")    # 'c'  — по символам, не по подстроке
"abcba".strip("ba")    # 'c'  — порядок в chars не важен`,
  },
  {
    name: "str.swapcase()",
    description: `Возвращает копию строки, в которой заглавные буквы заменены строчными, а строчные — заглавными. Регистр каждой буквы инвертируется.

Небуквенные символы (цифры, пробелы, знаки препинания) остаются без изменений.

Корректно работает с Unicode: кириллица, греческий и другие алфавиты обрабатываются правильно (если у символа есть регистр).

Важная особенность: swapcase() — не самообратная операция для некоторых Unicode-символов. Обычно s.swapcase().swapcase() == s, но не всегда — для символов с нестандартным case folding (например, немецкий ß: 'ß'.swapcase() → 'SS', 'SS'.swapcase() → 'ss').

Применения:
- Учебные задачи и демонстрация регистра
- Простые шифры (инверсия регистра)
- Нормализация строк в специфических форматах
- Генерация вариантов строк для тестирования`,
    syntax: "str.swapcase()",
    arguments: [],
    example: `"Hello World".swapcase()      # 'hELLO wORLD'
"HELLO".swapcase()            # 'hello'
"hello".swapcase()            # 'HELLO'
"Hello 123!".swapcase()       # 'hELLO 123!'  (цифры не меняются)
"PyThOn".swapcase()           # 'pYtHoN'
"Привет МИР".swapcase()       # 'пРИВЕТ мир'

# Двойной swapcase — обычно возвращает исходную строку
s = "Hello World"
s.swapcase().swapcase() == s  # True  (для ASCII всегда)

# Исключение для ß:
"ß".swapcase()                # 'SS'  (не 'SS'!)
"SS".swapcase()               # 'ss'  (не 'ß'!)

# Простой шифр на основе swapcase
secret = "Hello World"
encoded = secret.swapcase()    # 'hELLO wORLD'
decoded = encoded.swapcase()   # 'Hello World'`,
  },
  {
    name: "str.title()",
    description: `Возвращает "titlecased" версию строки: первая буква каждого слова заглавная, остальные — строчные.

Алгоритм title(): "слово" начинается после любого небуквенного символа. Это означает:
- "it's" → "It'S" (буква после апострофа тоже считается началом слова!)
- "hello-world" → "Hello-World" (буква после дефиса)
- "abc_def" → "Abc_Def" (буква после подчёркивания)

Это поведение соответствует Unicode Title Case, но может отличаться от ожидаемого для предлогов и союзов (the, a, of, and — они тоже станут с заглавной буквы).

Для правильного Title Case с исключениями используйте библиотеку titlecase (pip) или собственную логику.

Сравнение:
- title() — каждое "слово" (после небуквенного символа) с заглавной
- capitalize() — только первый символ всей строки с заглавной
- upper() — все буквы заглавные

istitle() — проверяет, является ли строка "titlecased".`,
    syntax: "str.title()",
    arguments: [],
    example: `"hello world".title()          # 'Hello World'
"hello WORLD".title()          # 'Hello World'  (WORLD → World)
"python programming".title()   # 'Python Programming'

# Нюанс с апострофами и небуквенными символами
"it's fine".title()            # "It'S Fine"  — S заглавная!
"hello-world".title()          # 'Hello-World'
"abc_def ghi".title()          # 'Abc_Def Ghi'

# Сравнение методов
s = "hello world"
s.capitalize()   # 'Hello world'  (только первое слово)
s.title()        # 'Hello World'  (каждое слово)

# Правильное Title Case (обход апострофного нюанса)
import re
def proper_title(s):
    return re.sub(r"[A-Za-z]+('[A-Za-z]+)?",
                  lambda m: m.group(0).capitalize(), s)

proper_title("it's a dog's life")  # "It's A Dog's Life"

# Нормализация имён
"alice smith".title()         # 'Alice Smith'
"JOHN DOE".title()            # 'John Doe'`,
  },
  {
    name: "str.translate(table)",
    description: `Применяет таблицу перевода к строке: заменяет каждый символ согласно таблице. Используется в паре с str.maketrans() для создания таблицы.

Таблица перевода — словарь, отображающий кодовые точки Unicode (int) на:
- Другую кодовую точку Unicode (int) — замена символа
- Строку — замена символа строкой (возможно многосимвольной)
- None — удаление символа

Каждый символ строки ищется в таблице по своему ord(). Если символ не найден в таблице — остаётся без изменений.

Преимущества перед replace():
- Одним вызовом применяется множество замен одновременно
- Не нужна цепочка .replace().replace().replace()...
- Удаление символов напрямую (None)
- Эффективнее для большого числа замен (одна итерация по строке)

Типичная пара: table = str.maketrans(x, y, z); result = s.translate(table)

Применения: транслитерация, удаление пунктуации, шифры подстановки, нормализация текста.`,
    syntax: "str.translate(table)",
    arguments: [
      {
        name: "table",
        description:
          "Словарь {int: int|str|None} — маппинг кодовых точек Unicode. Обычно создаётся через str.maketrans()",
      },
    ],
    example: `# Замена символов
table = str.maketrans("aeiou", "AEIOU")
"hello world".translate(table)    # 'hEllO wOrld'

# Удаление символов (None)
import string
remove_punct = str.maketrans("", "", string.punctuation)
"Hello, World!".translate(remove_punct)   # 'Hello World'

# Замена + удаление одновременно
table = str.maketrans("aeiou", "AEIOU", " ")
"hello world".translate(table)    # 'hEllOwOrld'  (пробелы удалены)

# Транслитерация кириллицы
cyr = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
lat = "abvgdeyozhziyklmnoprstufhcchshschyeyuya"
# (упрощённая — не GOST)

# ROT13 шифр
import codecs
codecs.encode("Hello World", "rot_13")    # 'Uryyb Jbeyq'

# Словарь напрямую (без maketrans)
table = {ord('а'): 'a', ord('б'): 'b', ord('в'): 'v'}
"абв".translate(table)    # 'abv'`,
  },
  {
    name: "str.upper()",
    description: `Возвращает копию строки, в которой все символы нижнего регистра преобразованы в верхний регистр.

Корректно работает с Unicode: кириллица, греческий, арабский и другие алфавиты обрабатываются правильно (где существует понятие верхнего регистра).

Важная особенность с немецким ß: 'ß'.upper() → 'SS' (два символа!). Это корректное Unicode-поведение — в заглавном написании ß раскладывается в SS. Это означает len('ß'.upper()) > len('ß').

Нюанс с round-trip: s.upper().lower() не всегда возвращает исходную строку.

Сравнение:
- upper() — все буквы заглавные
- lower() — все буквы строчные
- swapcase() — инвертирует регистр каждой буквы
- casefold() — нижний регистр для сравнения (агрессивнее lower)
- title() — каждое слово с заглавной буквы

Применения: нормализация перед сравнением без учёта регистра, форматирование заголовков, аббревиатуры, вывод пользователю.`,
    syntax: "str.upper()",
    arguments: [],
    example: `"hello".upper()           # 'HELLO'
"Hello World".upper()     # 'HELLO WORLD'
"python 3.11".upper()     # 'PYTHON 3.11'  (цифры не меняются)
"привет".upper()          # 'ПРИВЕТ'
"".upper()                # ''

# Нюанс с ß
"straße".upper()          # 'STRASSE'  (ß → SS, длина увеличилась!)
len("ß")                  # 1
len("ß".upper())          # 2

# Сравнение без учёта регистра
"Python" == "PYTHON"               # False
"Python".upper() == "PYTHON"       # True
# Лучше: casefold() для unicode
"Straße".casefold() == "strasse"   # True

# Форматирование вывода
status = "active"
print(f"Status: {status.upper()}")  # Status: ACTIVE

# Аббревиатуры из слов
def make_acronym(phrase):
    return "".join(w[0].upper() for w in phrase.split())

make_acronym("artificial intelligence")  # 'AI'
make_acronym("as soon as possible")      # 'ASAP'`,
  },
  {
    name: "str.zfill(width)",
    description: `Возвращает строку, дополненную символами '0' слева до заданной ширины width. Если строка уже длиннее или равна width — возвращается без изменений.

Особенность: корректно обрабатывает знак числа. Если строка начинается с '+' или '-', нули вставляются после знака, а не перед ним.

"−5".zfill(4) → "−005" (правильно), rjust(4, "0") → "0-05" (неправильно).

zfill() vs rjust(width, "0"):
- zfill(width) — знак-корректный, специально для числовых строк
- rjust(width, '0') — не учитывает знак числа
- f"{42:05d}" — f-строка, лучший способ для форматирования целых чисел
- f"{3.14:08.2f}" — f-строка для float

Применения:
- Форматирование числовых ID с ведущими нулями (ID: 00042)
- Нормализация дат и времени (01:05:09)
- Создание отсортируемых строковых ключей из чисел
- Форматирование кодов и серийных номеров`,
    syntax: "str.zfill(width)",
    arguments: [
      {
        name: "width",
        description:
          "Минимальная ширина результирующей строки. Если len(str) >= width — строка возвращается без изменений",
      },
    ],
    example: `"42".zfill(5)        # '00042'
"42".zfill(2)        # '42'  (уже достаточная ширина)
"hello".zfill(10)    # '00000hello'  (работает с любыми строками)
"".zfill(3)          # '000'

# Корректная обработка знака числа!
"-42".zfill(6)       # '-00042'  (ноль ПОСЛЕ знака)
"+42".zfill(6)       # '+00042'
"-42".rjust(6, "0")  # '000-42'  (неправильно!)

# Форматирование ID
for i in [1, 42, 100, 1000]:
    print(f"ID: {str(i).zfill(4)}")
# ID: 0001
# ID: 0042
# ID: 0100
# ID: 1000

# Время в формате HH:MM:SS
h, m, s = 9, 5, 3
f"{str(h).zfill(2)}:{str(m).zfill(2)}:{str(s).zfill(2)}"
# '09:05:03'

# Лучше через f-строки для чисел:
f"{42:05d}"     # '00042'
f"{-42:06d}"    # '  -042'  — другое поведение!`,
  },
  {
    name: "list.append(x)",
    description: `Добавляет элемент x в конец списка. Изменяет список на месте (in-place) и возвращает None.

append() — O(1) амортизированная сложность. Это самая быстрая операция добавления в список. Python выделяет памяти с запасом, поэтому реальное перераспределение памяти происходит редко.

Ключевые особенности:
- Добавляет элемент как единое целое, а не разворачивает его. append([1,2]) добавит список [1,2] как один элемент, а не два числа
- Для добавления нескольких элементов используйте extend() или += 
- Для добавления в начало: insert(0, x) — но это O(n), медленно для больших списков
- Возвращает None — не возвращает изменённый список!

Сравнение с альтернативами:
- append(x) — добавить один элемент в конец: O(1)
- extend(iterable) — добавить все элементы итерируемого: O(k)
- insert(i, x) — вставить в позицию i: O(n)
- lst + [x] — создаёт новый список: O(n), медленнее

Типичная ошибка: lst = lst.append(x) — присвоит None, потому что append возвращает None.`,
    syntax: "list.append(x)",
    arguments: [
      {
        name: "x",
        description:
          "Элемент для добавления в конец списка. Может быть любым объектом, включая другой список",
      },
    ],
    example: `lst = [1, 2, 3]
lst.append(4)
print(lst)          # [1, 2, 3, 4]

lst.append("hello")
print(lst)          # [1, 2, 3, 4, 'hello']

# Добавление списка как единого элемента
lst = [1, 2]
lst.append([3, 4])
print(lst)          # [1, 2, [3, 4]]  — вложенный список!

# Для добавления всех элементов — extend:
lst2 = [1, 2]
lst2.extend([3, 4])
print(lst2)         # [1, 2, 3, 4]

# Построение списка в цикле
result = []
for i in range(5):
    result.append(i ** 2)
print(result)       # [0, 1, 4, 9, 16]

# ОШИБКА: append возвращает None
lst = [1, 2, 3]
lst = lst.append(4)  # lst теперь None!
# Правильно:
lst = [1, 2, 3]
lst.append(4)        # изменяет lst на месте`,
  },
  {
    name: "list.clear()",
    description: `Удаляет все элементы из списка. Изменяет список на месте и возвращает None. После вызова список становится пустым [].

Эквивалент del lst[:] или lst[:] = [].

Важное отличие от lst = []:
- lst.clear() — очищает существующий объект списка. Все ссылки на этот список в других переменных тоже увидят пустой список
- lst = [] — создаёт новый объект списка и перепривязывает переменную lst. Другие ссылки на старый список не изменятся

Это критично при работе с изменяемыми объектами, переданными по ссылке.

Применения:
- Очистка кэша или буфера
- Сброс состояния списка (с сохранением ссылки на него)
- Освобождение памяти от элементов`,
    syntax: "list.clear()",
    arguments: [],
    example: `lst = [1, 2, 3, 4, 5]
lst.clear()
print(lst)    # []

# Разница между clear() и lst = []
original = [1, 2, 3]
alias = original      # alias указывает на тот же объект

original.clear()      # изменяет объект
print(alias)          # []  ← alias тоже видит изменение!

original = [1, 2, 3]
alias = original
original = []         # создаёт НОВЫЙ объект
print(alias)          # [1, 2, 3]  ← alias не изменился

# Очистка общего буфера
buffer = []

def add_data(data):
    buffer.append(data)

def flush():
    process(buffer)
    buffer.clear()    # правильно: очищаем тот же объект

# del lst[:] — эквивалентно clear()
lst = [1, 2, 3]
del lst[:]
print(lst)    # []`,
  },
  {
    name: "list.copy()",
    description: `Возвращает поверхностную (shallow) копию списка. Эквивалентно lst[:] или list(lst).

Поверхностная копия означает:
- Создаётся новый объект списка
- Элементы не копируются — новый список содержит ссылки на те же объекты, что и исходный
- Изменение самого нового списка (append, remove, и т.д.) не влияет на исходный
- Но изменение изменяемых объектов внутри списка (вложенных списков, словарей) отражается в обоих

Когда нужна глубокая копия: если список содержит изменяемые объекты (другие списки, словари) и нужно полное независимое копирование — используйте copy.deepcopy(lst).

Три эквивалентных способа сделать shallow copy:
1. lst.copy()
2. lst[:]
3. list(lst)

Все три работают одинаково и за O(n).`,
    syntax: "list.copy()",
    arguments: [],
    example: `original = [1, 2, 3]
copy = original.copy()

copy.append(4)
print(original)   # [1, 2, 3]   ← не изменился
print(copy)       # [1, 2, 3, 4]

# Shallow copy — объекты внутри НЕ копируются!
matrix = [[1, 2], [3, 4]]
copy = matrix.copy()

copy[0].append(99)    # изменяем вложенный список
print(matrix)         # [[1, 2, 99], [3, 4]]  ← ТОЖЕ изменился!
print(copy)           # [[1, 2, 99], [3, 4]]

# Глубокая копия для полной независимости
import copy
matrix = [[1, 2], [3, 4]]
deep = copy.deepcopy(matrix)

deep[0].append(99)
print(matrix)   # [[1, 2], [3, 4]]   ← не изменился
print(deep)     # [[1, 2, 99], [3, 4]]

# Три эквивалентных способа
a = [1, 2, 3]
b = a.copy()    # метод
c = a[:]        # срез
d = list(a)     # конструктор
# b, c, d — одинаковые shallow copies`,
  },
  {
    name: "list.count(x)",
    description: `Возвращает количество вхождений элемента x в списке. Использует оператор == для сравнения каждого элемента с x.

Сложность: O(n) — всегда обходит весь список. Для частых подсчётов при большом списке эффективнее использовать collections.Counter.

Сравнение использует ==, а не is. Поэтому count(True) подсчитает и True, и 1 (они равны в Python: True == 1).

Применения:
- Проверка частоты элемента
- Проверка наличия дубликатов
- Простая статистика по спискам

Для подсчёта всех уникальных элементов сразу: collections.Counter(lst) — создаёт словарь {элемент: количество}.`,
    syntax: "list.count(x)",
    arguments: [
      {
        name: "x",
        description:
          "Элемент для подсчёта. Сравнение выполняется через ==, поддерживает пользовательский __eq__",
      },
    ],
    example: `[1, 2, 3, 2, 1, 2].count(2)     # 3
[1, 2, 3].count(5)              # 0  (нет — вернёт 0, не ошибка)
["a", "b", "a", "c"].count("a") # 2

# True == 1 в Python!
[1, True, 2, True, 1].count(True)  # 4  (True и 1 — равны!)
[1, True, 2, True, 1].count(1)     # 4  (то же самое)

# Проверка дубликатов
lst = [1, 2, 3, 2, 4]
has_duplicates = any(lst.count(x) > 1 for x in lst)
# True  (но это O(n²) — для больших списков используй set)

# Эффективный подсчёт всех элементов
from collections import Counter
data = [1, 2, 3, 2, 1, 3, 3]
Counter(data)          # Counter({3: 3, 1: 2, 2: 2})
Counter(data)[3]       # 3  — количество троек

# Поиск наиболее частого элемента
Counter(data).most_common(1)  # [(3, 3)]`,
  },
  {
    name: "list.extend(iterable)",
    description: `Добавляет все элементы итерируемого объекта в конец списка. Изменяет список на месте и возвращает None.

Разница между append() и extend():
- append(x) — добавляет x как один элемент (может быть списком, строкой и т.д.)
- extend(iterable) — разворачивает iterable и добавляет каждый его элемент по одному

extend() эквивалентен: for x in iterable: lst.append(x), но быстрее.

Оператор +=:
- lst += [1, 2, 3] эквивалентен lst.extend([1, 2, 3]) — изменяет список на месте
- lst = lst + [1, 2, 3] — создаёт НОВЫЙ список (медленнее, не изменяет исходный объект)

Принимает любой итерируемый объект: список, кортеж, строку, генератор, множество и т.д.

Строка как аргумент: extend("abc") добавит три символа 'a', 'b', 'c' — а не строку целиком. Если нужна строка целиком — используйте append().`,
    syntax: "list.extend(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Любой итерируемый объект, чьи элементы добавляются в список. Строки разворачиваются в символы",
      },
    ],
    example: `lst = [1, 2, 3]
lst.extend([4, 5, 6])
print(lst)        # [1, 2, 3, 4, 5, 6]

# Сравнение append vs extend
lst = [1, 2]
lst.append([3, 4])   # добавляет список как элемент
print(lst)           # [1, 2, [3, 4]]

lst = [1, 2]
lst.extend([3, 4])   # разворачивает список
print(lst)           # [1, 2, 3, 4]

# Из любого итерируемого
lst = [1, 2]
lst.extend((3, 4))       # из кортежа
lst.extend(range(5, 7))  # из range
lst.extend({7, 8})       # из множества (порядок не гарантирован)
print(lst)               # [1, 2, 3, 4, 5, 6, 7, 8] (примерно)

# Строка разворачивается в символы!
lst = ["hello"]
lst.extend("world")
print(lst)   # ['hello', 'w', 'o', 'r', 'l', 'd']

# += эквивалентно extend (изменяет на месте)
lst = [1, 2]
lst += [3, 4]    # lst.extend([3, 4])
print(lst)       # [1, 2, 3, 4]`,
  },
  {
    name: "list.index(x[, start[, end]])",
    description: `Возвращает индекс первого вхождения элемента x в списке. Если элемент не найден — возбуждает ValueError.

Параметры start и end ограничивают область поиска (как срезы), но возвращается индекс в исходном списке.

Сравнение с аналогами:
- index(x) — индекс первого вхождения, ValueError если нет
- count(x) > 0 — проверка наличия без исключения
- x in lst — самый идиоматичный способ проверить наличие

Когда использовать index():
- Нужна позиция для дальнейших операций (insert, удаление по индексу)
- Отсутствие элемента — логическая ошибка (нужен ValueError)

Когда использовать in + условие:
- Нужно только проверить наличие: if x in lst

Для поиска всех вхождений:
[i for i, v in enumerate(lst) if v == x]`,
    syntax: "list.index(x[, start[, end]])",
    arguments: [
      {
        name: "x",
        description:
          "Элемент для поиска. Сравнение через ==. Возвращает индекс первого совпадения",
      },
      {
        name: "start",
        description: "Необязательный. Начальный индекс поиска (включительно)",
      },
      {
        name: "end",
        description: "Необязательный. Конечный индекс поиска (не включается)",
      },
    ],
    example: `[10, 20, 30, 20, 10].index(20)    # 1  (первое вхождение)
[10, 20, 30].index(30)            # 2
["a", "b", "c"].index("b")        # 1

# ValueError если не найдено
try:
    [1, 2, 3].index(99)
except ValueError:
    print("Элемент не найден")

# С диапазоном
lst = [10, 20, 30, 20, 10]
lst.index(20, 2)        # 3  (ищем начиная с индекса 2)
lst.index(20, 0, 3)     # 1  (ищем в [0, 3))

# Безопасный поиск
def safe_index(lst, x):
    try:
        return lst.index(x)
    except ValueError:
        return -1

safe_index([1, 2, 3], 2)    # 1
safe_index([1, 2, 3], 99)   # -1

# Все индексы вхождений
lst = [1, 2, 3, 2, 1]
indices = [i for i, v in enumerate(lst) if v == 2]
# [1, 3]`,
  },
  {
    name: "list.insert(i, x)",
    description: `Вставляет элемент x перед элементом с индексом i. Изменяет список на месте, возвращает None.

Сложность: O(n) — все элементы начиная с позиции i сдвигаются вправо. Для больших списков вставка в начало дорогостоящая операция.

Индекс i:
- 0 — вставить в начало (перед первым элементом)
- len(lst) или любое большое число — вставить в конец (аналог append)
- Отрицательный индекс: -1 вставляет ПЕРЕД последним элементом (не в самый конец)
- Индекс вне диапазона: не ошибка, будет ограничен до 0 или len(lst)

Для частых вставок в начало рассмотрите collections.deque — O(1) для операций с обоих концов.

Сравнение:
- append(x) — всегда в конец, O(1)
- insert(0, x) — в начало, O(n)
- insert(i, x) — в середину, O(n)`,
    syntax: "list.insert(i, x)",
    arguments: [
      {
        name: "i",
        description:
          "Индекс позиции, ПЕРЕД которой вставляется элемент. 0 — перед первым, len(lst) — после последнего. Поддерживает отрицательные значения",
      },
      { name: "x", description: "Элемент для вставки" },
    ],
    example: `lst = [1, 2, 3, 4]
lst.insert(2, 99)
print(lst)          # [1, 2, 99, 3, 4]  (вставлено перед индексом 2)

# Вставка в начало
lst.insert(0, 0)
print(lst)          # [0, 1, 2, 99, 3, 4]

# Вставка в конец (как append)
lst.insert(len(lst), 100)
print(lst)          # [0, 1, 2, 99, 3, 4, 100]

# Отрицательный индекс
lst = [1, 2, 3]
lst.insert(-1, 99)   # ПЕРЕД последним, не в конец!
print(lst)           # [1, 2, 99, 3]  (не [1, 2, 3, 99]!)

# Индекс вне диапазона — нет ошибки
lst = [1, 2, 3]
lst.insert(100, 99)  # вставит в конец
lst.insert(-100, 0)  # вставит в начало

# Для частых вставок в начало — deque
from collections import deque
dq = deque([1, 2, 3])
dq.appendleft(0)     # O(1), а не O(n)`,
  },
  {
    name: "list.pop([i])",
    description: `Удаляет элемент с индексом i из списка и возвращает его. Изменяет список на месте.

Если i не указан — удаляет и возвращает последний элемент. Это операция O(1).

Если i указан — удаляет элемент по этому индексу. Это O(n) для i < len-1, потому что все последующие элементы сдвигаются влево.

Поддерживает отрицательные индексы: pop(-1) — последний (по умолчанию), pop(-2) — предпоследний.

Если список пуст или индекс вне диапазона — возбуждает IndexError.

Паттерн "стек" (LIFO): append() + pop() — добавление и извлечение с конца — оба O(1). Это быстрый и идиоматичный стек в Python.

Паттерн "очередь" (FIFO): для эффективной очереди используйте collections.deque — pop() и popleft() оба O(1). pop(0) на списке — O(n).`,
    syntax: "list.pop([i])",
    arguments: [
      {
        name: "i",
        description:
          "Необязательный. Индекс удаляемого элемента. По умолчанию -1 (последний). Поддерживает отрицательные значения. IndexError если список пуст или индекс вне диапазона",
      },
    ],
    example: `lst = [1, 2, 3, 4, 5]
lst.pop()       # 5  (последний, O(1))
print(lst)      # [1, 2, 3, 4]

lst.pop(0)      # 1  (первый, O(n))
print(lst)      # [2, 3, 4]

lst.pop(1)      # 3  (по индексу)
print(lst)      # [2, 4]

lst.pop(-1)     # 4  (последний явно)
print(lst)      # [2]

# IndexError
try:
    [].pop()
except IndexError:
    print("Список пуст")

# Паттерн стек (LIFO)
stack = []
stack.append(1)   # push
stack.append(2)
stack.append(3)
stack.pop()       # 3  — pop
stack.pop()       # 2

# Эффективная очередь — deque
from collections import deque
queue = deque([1, 2, 3])
queue.append(4)      # добавить в конец
queue.popleft()      # 1, O(1)  (pop(0) на списке — O(n)!)`,
  },
  {
    name: "list.remove(x)",
    description: `Удаляет первое вхождение элемента x из списка. Изменяет список на месте и возвращает None. Если x не найден — возбуждает ValueError.

Сложность: O(n) — сначала находит элемент (линейный поиск), затем сдвигает остальные элементы.

Разница между remove() и pop():
- remove(x) — удаляет по значению, ищет первое совпадение
- pop(i) — удаляет по индексу, возвращает удалённый элемент

Удаляет именно первое вхождение. Если нужно удалить все — используйте list comprehension или цикл.

Безопасное удаление (без исключения):
- Проверить перед удалением: if x in lst: lst.remove(x)
- Или обернуть в try/except ValueError

Для удаления по условию используйте list comprehension: [x for x in lst if условие].`,
    syntax: "list.remove(x)",
    arguments: [
      {
        name: "x",
        description:
          "Значение элемента для удаления. Сравнение через ==. Удаляется первое вхождение. ValueError если не найдено",
      },
    ],
    example: `lst = [1, 2, 3, 2, 4]
lst.remove(2)
print(lst)      # [1, 3, 2, 4]  (удалено ПЕРВОЕ вхождение)

lst.remove(2)
print(lst)      # [1, 3, 4]

# ValueError если нет элемента
try:
    lst.remove(99)
except ValueError:
    print("Элемент не найден")

# Безопасное удаление
def safe_remove(lst, x):
    if x in lst:
        lst.remove(x)

# Удалить ВСЕ вхождения — list comprehension
lst = [1, 2, 3, 2, 4, 2]
lst = [x for x in lst if x != 2]
print(lst)   # [1, 3, 4]

# Сравнение remove и pop
lst = [10, 20, 30]
lst.remove(20)    # удалить по значению, None
val = lst.pop(0)  # удалить по индексу, возвращает 10`,
  },
  {
    name: "list.reverse()",
    description: `Переворачивает список на месте (in-place). Изменяет сам список, возвращает None.

Сложность: O(n) — переставляет элементы, не создавая нового списка.

Важно: reverse() изменяет список на месте и возвращает None.

Сравнение способов обратного порядка:
- lst.reverse() — изменяет список на месте, O(n), None
- reversed(lst) — ленивый итератор, O(1) памяти, сам список не меняется
- lst[::-1] — создаёт новый список в обратном порядке, O(n) памяти
- sorted(lst, reverse=True) — сортировка с обратным порядком (другая операция)

Типичная ошибка: lst = lst.reverse() — присвоит None! Метод изменяет список на месте и не возвращает его.

Когда использовать что:
- Нужно изменить существующий список — reverse()
- Нужен новый список, исходный должен остаться — lst[::-1]
- Нужно перебрать в обратном порядке без создания нового списка — reversed(lst)`,
    syntax: "list.reverse()",
    arguments: [],
    example: `lst = [1, 2, 3, 4, 5]
lst.reverse()
print(lst)    # [5, 4, 3, 2, 1]  — изменён на месте

# ОШИБКА: reverse() возвращает None
lst = [1, 2, 3]
lst = lst.reverse()   # lst теперь None!

# Правильно:
lst = [1, 2, 3]
lst.reverse()         # изменяет lst на месте
print(lst)            # [3, 2, 1]

# Создать новый список в обратном порядке (lst не изменится)
original = [1, 2, 3, 4, 5]
reversed_copy = original[::-1]
print(original)        # [1, 2, 3, 4, 5]  — не изменился
print(reversed_copy)   # [5, 4, 3, 2, 1]

# Ленивый итератор (не создаёт новый список)
for x in reversed(original):
    print(x, end=" ")  # 5 4 3 2 1`,
  },
  {
    name: "list.sort(*, key=None, reverse=False)",
    description: `Сортирует список на месте (in-place). Использует алгоритм Timsort — стабильная сортировка O(n log n). Изменяет сам список, возвращает None.

Параметр key:
- Функция одного аргумента, вызываемая для каждого элемента для получения ключа сравнения
- Функция вызывается один раз для каждого элемента и результат кэшируется
- key=str.lower — сортировка без учёта регистра
- key=len — по длине
- key=lambda x: x['field'] — по полю словаря
- operator.attrgetter, operator.itemgetter — оптимизированные альтернативы lambda

Параметр reverse=True — сортировка по убыванию.

Стабильность: элементы с равными ключами сохраняют исходный порядок — это позволяет делать многоуровневую сортировку последовательными вызовами.

Разница sort() vs sorted():
- lst.sort() — изменяет список на месте, None, только для списков
- sorted(iterable) — создаёт новый список, работает с любым итерируемым`,
    syntax: "list.sort(*, key=None, reverse=False)",
    arguments: [
      {
        name: "key",
        description:
          "Необязательный. Функция одного аргумента для извлечения ключа сравнения. По умолчанию None (прямое сравнение элементов)",
      },
      {
        name: "reverse",
        description:
          "Необязательный. Если True — сортировка по убыванию. По умолчанию False (по возрастанию)",
      },
    ],
    example: `lst = [3, 1, 4, 1, 5, 9, 2, 6]
lst.sort()
print(lst)    # [1, 1, 2, 3, 4, 5, 6, 9]

# По убыванию
lst.sort(reverse=True)
print(lst)    # [9, 6, 5, 4, 3, 2, 1, 1]

# По ключу
words = ["banana", "Apple", "kiwi", "Strawberry"]
words.sort(key=str.lower)          # без учёта регистра
words.sort(key=len)                # по длине
words.sort(key=len, reverse=True)  # по длине убывая

# Сортировка словарей
people = [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25},
]
people.sort(key=lambda p: p["age"])
# [{'name': 'Bob', 'age': 25}, {'name': 'Alice', 'age': 30}]

# Многоуровневая сортировка (стабильность!)
# Сначала по возрасту, при равном — по имени
people.sort(key=lambda p: (p["age"], p["name"]))

# sort() vs sorted()
original = [3, 1, 2]
original.sort()         # изменяет на месте
new = sorted([3, 1, 2]) # создаёт новый список`,
  },
  {
    name: "round(number[, ndigits])",
    description: `Округляет число до ndigits знаков после запятой. Если ndigits опущен или равен None, возвращает ближайшее целое число.

Алгоритм округления: Python использует "банковское округление" (round half to even) — при точно половинном значении округление происходит к ближайшему чётному числу. Это отличается от "математического" округления (всегда вверх при .5).

Примеры банковского округления:
- round(0.5) → 0 (к чётному 0, а не к 1)
- round(1.5) → 2 (к чётному 2)
- round(2.5) → 2 (к чётному 2, а не к 3)

Параметр ndigits:
- Положительный: количество знаков после запятой (round(3.14159, 2) → 3.14)
- 0 или None: целое число (round(3.7) → 4)
- Отрицательный: округление до десятков, сотен и т.д. (round(1234, -2) → 1200)

Особенности с float:
Из-за двоичного представления чисел результаты могут быть неожиданными: round(2.675, 2) → 2.67, а не 2.68. Это не баг Python, а особенность IEEE 754. Для точных денежных вычислений используйте decimal.Decimal.

Объект может переопределить round() через метод __round__().`,
    syntax: "round(number[, ndigits])",
    arguments: [
      {
        name: "number",
        description:
          "Число для округления. Может быть int, float или объект с __round__()",
      },
      {
        name: "ndigits",
        description:
          "Необязательный. Число знаков после запятой. Может быть отрицательным. По умолчанию None (округление до целого)",
      },
    ],
    example: `round(3.14159)        # 3
round(3.14159, 2)     # 3.14
round(3.14159, 4)     # 3.1416
round(1234, -2)       # 1200  (округление до сотен)
round(1234, -3)       # 1000  (до тысяч)

# Банковское округление (half to even)
round(0.5)    # 0  — к чётному!
round(1.5)    # 2  — к чётному
round(2.5)    # 2  — к чётному!
round(3.5)    # 4  — к чётному

# Сюрпризы с float из-за IEEE 754
round(2.675, 2)   # 2.67  (ожидаем 2.68, но float 2.675 ≈ 2.6749999...)

# Точное округление с Decimal
from decimal import Decimal, ROUND_HALF_UP
Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
# Decimal('2.68')

# Применение: форматирование цен
price = 19.9999
print(f"Цена: {round(price, 2):.2f} ₽")  # Цена: 20.00 ₽`,
  },
  {
    name: "set([iterable])",
    description: `Создаёт изменяемое множество — неупорядоченную коллекцию уникальных хэшируемых элементов.

Ключевые свойства множества:
- Уникальность: дубликаты автоматически удаляются
- Неупорядоченность: элементы не имеют фиксированного порядка (Python 3.7+ не гарантирует порядок вставки, как для dict)
- Хэшируемость элементов: элементы должны быть хэшируемыми (int, str, tuple, frozenset и т.д.) — список, словарь или другое множество как элемент недопустимы
- O(1) для проверки вхождения, добавления и удаления

Операции над множествами:
- Объединение: a | b или a.union(b)
- Пересечение: a & b или a.intersection(b)
- Разность: a - b или a.difference(b)
- Симметричная разность: a ^ b или a.symmetric_difference(b)
- Подмножество: a <= b или a.issubset(b)
- Надмножество: a >= b или a.issuperset(b)

Методы изменения: add(), remove() (KeyError если нет), discard() (без ошибки), pop(), clear(), update(), intersection_update() и т.д.

Сравнение с frozenset: set изменяем (не хэшируемый), frozenset неизменяем (хэшируемый, может быть ключом словаря).`,
    syntax: "set([iterable])",
    arguments: [
      {
        name: "iterable",
        description:
          "Необязательный. Итерируемый объект, чьи элементы станут элементами множества (дубли удаляются). Если не указан — создаётся пустое множество set()",
      },
    ],
    example: `set()                    # set()  (НЕ {} — это пустой dict!)
set([1, 2, 3, 2, 1])    # {1, 2, 3}  — дубли удалены
set("hello")            # {'h', 'e', 'l', 'o'}
set((1, 2, 3))          # {1, 2, 3}

# Операции над множествами
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
a | b    # {1, 2, 3, 4, 5, 6}  объединение
a & b    # {3, 4}              пересечение
a - b    # {1, 2}              разность (в a, но не в b)
a ^ b    # {1, 2, 5, 6}        симметричная разность

# Удаление дублей из списка (с потерей порядка)
lst = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]
unique = list(set(lst))   # порядок не гарантирован

# Быстрая проверка вхождения O(1)
valid = {"admin", "editor", "viewer"}
"admin" in valid    # True — быстрее чем в списке!

# Множественное включение (set comprehension)
evens = {x for x in range(10) if x % 2 == 0}
# {0, 2, 4, 6, 8}`,
  },
  {
    name: "setattr(object, name, value)",
    description: `Устанавливает именованный атрибут объекта. Является динамическим эквивалентом оператора присваивания: setattr(obj, 'x', value) полностью эквивалентно obj.x = value.

Если атрибут уже существует — его значение обновляется. Если не существует — создаётся новый атрибут (если класс это допускает).

Поведение при вызове:
- Вызывает дескрипторный протокол: если у класса есть data descriptor с именем name (например, property с setter), он будет вызван
- Если класс реализует __setattr__(self, name, value), именно этот метод будет выполнен
- Если у объекта есть __slots__ и name не в slots — AttributeError

Практические применения:
- Динамическое присваивание атрибутов по строковому имени
- Конфигурация объектов в цикле
- Применение набора настроек из словаря
- Метапрограммирование и декораторы классов

Парные функции: getattr() — получить атрибут, delattr() — удалить, hasattr() — проверить наличие.

Важно: избегайте setattr() там, где можно использовать обычное присваивание — это более читаемо и быстрее.`,
    syntax: "setattr(object, name, value)",
    arguments: [
      {
        name: "object",
        description: "Объект, у которого устанавливается атрибут",
      },
      { name: "name", description: "Строка с именем атрибута" },
      {
        name: "value",
        description: "Значение, которое присваивается атрибуту",
      },
    ],
    example: `class Config:
    pass

cfg = Config()
setattr(cfg, 'debug', True)
setattr(cfg, 'host', 'localhost')
setattr(cfg, 'port', 8080)

print(cfg.debug)   # True
print(cfg.host)    # 'localhost'

# Из словаря настроек — динамическая конфигурация
defaults = {'timeout': 30, 'retries': 3, 'verbose': False}
for key, val in defaults.items():
    setattr(cfg, key, val)

print(cfg.timeout)  # 30

# С property (setter)
class Person:
    def __init__(self):
        self._name = ""
    @property
    def name(self):
        return self._name
    @name.setter
    def name(self, value):
        self._name = value.strip().title()

p = Person()
setattr(p, 'name', '  alice  ')
print(p.name)   # 'Alice'  — setter отработал!`,
  },
  {
    name: "slice(stop) / slice(start, stop[, step])",
    description: `Создаёт объект среза (slice object), который может использоваться вместо записи индексов с двоеточием. slice(start, stop, step) эквивалентен записи [start:stop:step].

Объект slice хранит три атрибута: .start, .stop, .step. При отсутствии аргументов они равны None (что интерпретируется как "начало", "конец" и "шаг 1" соответственно).

Зачем использовать slice():
- Именованные срезы: дают понятные имена вместо магических чисел
- Переиспользование срезов: один объект slice применяется к нескольким последовательностям
- Метапрограммирование: __getitem__ получает объект slice при операции [start:stop]
- Работа с NumPy, pandas: мощный инструмент для работы с многомерными данными

Метод slice.indices(length): возвращает кортеж (start, stop, step) нормализованных индексов для последовательности заданной длины. Полезно при реализации __getitem__ в собственных классах.

Форма slice(stop) эквивалентна slice(None, stop, None) — срез с начала до stop.`,
    syntax: "slice(stop)\nslice(start, stop[, step])",
    arguments: [
      {
        name: "start",
        description:
          "Необязательный. Начало среза (включительно). None = с начала",
      },
      {
        name: "stop",
        description: "Конец среза (не включается). None = до конца",
      },
      {
        name: "step",
        description: "Необязательный. Шаг. None интерпретируется как 1",
      },
    ],
    example: `lst = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Обычная запись среза
lst[2:7]           # [2, 3, 4, 5, 6]

# Через slice — эквивалентно
s = slice(2, 7)
lst[s]             # [2, 3, 4, 5, 6]

# Именованные срезы — читаемый код!
HEADER = slice(0, 3)
BODY   = slice(3, 8)
FOOTER = slice(8, None)

data = list(range(10))
data[HEADER]       # [0, 1, 2]
data[BODY]         # [3, 4, 5, 6, 7]
data[FOOTER]       # [8, 9]

# Парсинг фиксированных форматов
LOG_LINE = "2024-03-28 ERROR Something went wrong"
DATE = slice(0, 10)
LEVEL = slice(11, 16)
MSG  = slice(17, None)
LOG_LINE[DATE]     # '2024-03-28'
LOG_LINE[LEVEL]    # 'ERROR'

# indices() для нормализации
s = slice(1, 100, 2)
s.indices(10)      # (1, 10, 2) — безопасные индексы для len=10`,
  },
  {
    name: "sorted(iterable[, key, reverse])",
    description: `Возвращает новый отсортированный список из элементов итерируемого объекта. В отличие от метода list.sort(), sorted() работает с любым итерируемым и всегда создаёт новый список.

Алгоритм: Timsort — гибридный алгоритм, сочетающий сортировку слиянием и сортировку вставками. Стабильная сортировка O(n log n) в худшем случае, O(n) для почти отсортированных данных.

Параметр key:
- Функция одного аргумента, вызываемая для каждого элемента перед сравнением
- Позволяет сортировать по произвольному критерию
- key=str.lower — без учёта регистра
- key=len — по длине
- key=lambda x: x['field'] — по полю словаря
- operator.attrgetter('attr'), operator.itemgetter(index) — оптимизированные альтернативы lambda

Параметр reverse=True — сортировка в убывающем порядке.

Стабильность: при равных ключах элементы сохраняют исходный порядок. Это позволяет последовательно сортировать по нескольким критериям (первичный + вторичный ключ).

sorted() vs list.sort(): sorted() создаёт новый список и работает с любым итерируемым; .sort() изменяет список на месте и возвращает None.`,
    syntax: "sorted(iterable, *, key=None, reverse=False)",
    arguments: [
      {
        name: "iterable",
        description:
          "Любой итерируемый объект: список, кортеж, строка, генератор, словарь (ключи) и т.д.",
      },
      {
        name: "key",
        description:
          "Необязательный. Функция одного аргумента для извлечения ключа сравнения. По умолчанию None (прямое сравнение элементов)",
      },
      {
        name: "reverse",
        description:
          "Необязательный. Если True — сортировка по убыванию. По умолчанию False (по возрастанию)",
      },
    ],
    example: `sorted([3, 1, 4, 1, 5, 9, 2])      # [1, 1, 2, 3, 4, 5, 9]
sorted("python")                    # ['h', 'n', 'o', 'p', 't', 'y']
sorted([3, 1, 4], reverse=True)     # [4, 3, 1]

# key — сортировка по критерию
words = ["banana", "Apple", "kiwi", "Strawberry"]
sorted(words, key=str.lower)        # ['Apple', 'banana', 'kiwi', 'Strawberry']
sorted(words, key=len)              # ['kiwi', 'Apple', 'banana', 'Strawberry']

# Сортировка словарей
people = [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25},
    {"name": "Carol", "age": 35},
]
sorted(people, key=lambda p: p["age"])
# [{'name': 'Bob', 'age': 25}, ...]

# Сортировка по нескольким полям (стабильность!)
# Сначала по возрасту, при равном — по имени
sorted(people, key=lambda p: (p["age"], p["name"]))

# operator.itemgetter — быстрее lambda
from operator import itemgetter
sorted(people, key=itemgetter("age"))`,
  },
  {
    name: "staticmethod(function)",
    description: `Преобразует метод в статический метод класса. Статический метод не получает ни экземпляр (self), ни класс (cls) в качестве первого аргумента. По сути, это обычная функция, логически связанная с классом, но не зависящая от его состояния.

Три вида методов в Python:
1. Обычный метод — первый аргумент self (экземпляр класса)
2. classmethod — первый аргумент cls (сам класс), знает о наследовании
3. staticmethod — без неявных аргументов, не знает о классе или экземпляре

Когда использовать staticmethod:
- Функция логически относится к классу, но не использует ни self, ни cls
- Вспомогательные (utility) функции, тесно связанные с классом
- Фабричные методы, не зависящие от типа (в отличие от classmethod)
- Улучшение организации кода — группировка связанных функций в классе

Преимущества перед обычной функцией модуля:
- Явная принадлежность к классу (документирует намерение)
- Не загрязняет пространство имён модуля
- Доступна через класс и через экземпляр

С Python 3.10+ staticmethod можно комбинировать с другими дескрипторами.`,
    syntax: "@staticmethod\ndef method(...): ...",
    arguments: [
      {
        name: "function",
        description:
          "Функция, преобразуемая в статический метод. Не получает self или cls. Может иметь любые обычные параметры",
      },
    ],
    example: `class MathUtils:
    @staticmethod
    def add(a, b):
        return a + b

    @staticmethod
    def is_prime(n):
        if n < 2:
            return False
        for i in range(2, int(n**0.5) + 1):
            if n % i == 0:
                return False
        return True

    @staticmethod
    def clamp(value, min_val, max_val):
        """Ограничивает значение диапазоном."""
        return max(min_val, min(max_val, value))

# Вызов через класс
MathUtils.add(3, 4)       # 7
MathUtils.is_prime(17)    # True

# Вызов через экземпляр (тоже работает)
m = MathUtils()
m.add(10, 20)             # 30

# Сравнение: classmethod vs staticmethod
class Animal:
    @classmethod
    def from_dict(cls, data):   # знает класс — используется в подклассах
        return cls(**data)
    @staticmethod
    def validate_name(name):    # не нужен ни класс, ни экземпляр
        return isinstance(name, str) and len(name) > 0`,
  },
  {
    name: "str(object='') / str(object, encoding, errors)",
    description: `Создаёт строку из объекта. Строки в Python — неизменяемые последовательности Unicode-символов.

Две формы вызова:
1. str(object) — преобразует объект в строку через __str__() (или __repr__() если __str__ не определён)
2. str(object, encoding, errors) — декодирует bytes/bytearray в строку с указанной кодировкой

Параметры encoding и errors нельзя использовать с не-bytes объектами — только с bytes, bytearray или объектами с __bytes__().

Разница str() и repr():
- str() — "неформальное" читаемое представление, используется при print()
- repr() — "официальное" однозначное представление для разработчика

Кодировки: 'utf-8' (универсальная, рекомендуется), 'ascii', 'latin-1', 'cp1251' (windows кириллица) и т.д.

Параметр errors: 'strict' (ошибка), 'ignore' (пропустить), 'replace' (заменить на ?), 'backslashreplace' (экранировать), 'xmlcharrefreplace' и др.

Методы строк — самый богатый API среди встроенных типов: split(), join(), strip(), replace(), find(), startswith(), endswith(), format(), encode(), upper(), lower() и десятки других.`,
    syntax: "str(object='')\nstr(object, encoding='utf-8', errors='strict')",
    arguments: [
      {
        name: "object",
        description:
          "Необязательный. Объект для преобразования в строку. По умолчанию '' (пустая строка). Для второй формы — bytes или bytearray",
      },
      {
        name: "encoding",
        description:
          "Кодировка для декодирования bytes. По умолчанию 'utf-8'. Только для второй формы (bytes/bytearray)",
      },
      {
        name: "errors",
        description:
          "Обработка ошибок декодирования: 'strict' (исключение), 'ignore', 'replace'. Только для второй формы",
      },
    ],
    example: `str()               # ''
str(42)             # '42'
str(3.14)           # '3.14'
str(True)           # 'True'
str(None)           # 'None'
str([1, 2, 3])      # '[1, 2, 3]'

# Декодирование bytes
b = b'\\xd0\\x9f\\xd1\\x80\\xd0\\xb8\\xd0\\xb2\\xd0\\xb5\\xd1\\x82'
str(b, 'utf-8')     # 'Привет'
b.decode('utf-8')   # то же самое

# Обработка ошибок
bad = b'Hello \\xff World'
str(bad, 'utf-8', 'ignore')    # 'Hello  World'
str(bad, 'utf-8', 'replace')   # 'Hello \ufffd World'

# __str__ vs __repr__
class Dog:
    def __str__(self):  return "Дружелюбный пёс"
    def __repr__(self): return "Dog()"

d = Dog()
str(d)    # 'Дружелюбный пёс'  — через __str__
repr(d)   # 'Dog()'             — через __repr__

# Строковые методы
"  hello world  ".strip().title()    # 'Hello World'
",".join(["a", "b", "c"])           # 'a,b,c'`,
  },
  {
    name: "sum(iterable[, start])",
    description: `Суммирует все элементы итерируемого объекта, начиная со значения start (по умолчанию 0). Возвращает общую сумму.

Особенности поведения:
- Обходит все элементы и накапливает сумму через оператор +
- start добавляется к результату в начале (не в конце!)
- Если итерируемый пуст, возвращает start (то есть 0 по умолчанию)
- Работает с любыми типами, поддерживающими + и сложение с 0

Ограничения:
- Для строк использовать sum() не рекомендуется (медленно). Используйте ''.join(iterable)
- sum() нельзя применять к строкам напрямую из-за ограничения на использование start='' — это сделано намеренно, чтобы не поощрять неэффективный паттерн

Параметр start:
- Полезен для суммирования с начальным значением: sum([1,2,3], 10) → 16
- Позволяет суммировать списки списков: sum([[1,2],[3,4]], []) → [1,2,3,4] (конкатенация)

Альтернативы для сложных случаев:
- math.fsum() — точное суммирование float без накопления ошибок
- functools.reduce() — обобщение с произвольной операцией
- numpy.sum() — для массивов числовых данных`,
    syntax: "sum(iterable, /, start=0)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект с числовыми значениями (или объектами, поддерживающими +)",
      },
      {
        name: "start",
        description:
          "Необязательный. Начальное значение для накопления. По умолчанию 0. Не может быть строкой",
      },
    ],
    example: `sum([1, 2, 3, 4, 5])         # 15
sum((1.5, 2.5, 3.0))         # 7.0
sum(range(101))              # 5050  (сумма от 1 до 100)
sum([])                      # 0  (пустой итерируемый = start)
sum([1, 2, 3], 10)           # 16  (начинаем с 10)

# Суммирование с условием
nums = [1, -2, 3, -4, 5]
sum(x for x in nums if x > 0)  # 9  (только положительные)

# Конкатенация списков (start=[])
sum([[1, 2], [3, 4], [5]], [])  # [1, 2, 3, 4, 5]

# Точное суммирование float
import math
values = [0.1] * 10
sum(values)          # 0.9999999999999999  (ошибка накопления!)
math.fsum(values)    # 1.0  — точно

# Сумма значений из словаря
data = {"a": 10, "b": 20, "c": 30}
sum(data.values())   # 60`,
  },
  {
    name: "super([type[, object-or-type]])",
    description: `Возвращает прокси-объект, который делегирует вызовы методов родительскому или соседнему классу в порядке MRO (Method Resolution Order — порядок разрешения методов).

Две формы:
1. super() — без аргументов (Python 3): автоматически определяет текущий класс и экземпляр. Это самая распространённая форма
2. super(type, obj) — явное указание: возвращает прокси для поиска выше type в MRO obj-а
3. super(type, type2) — для вызова классовых методов

Зачем нужен super():
- Вызов метода родительского класса при переопределении
- Корректная работа с множественным наследованием (MRO)
- Без super() нельзя корректно расширить метод родителя

MRO и кооперативное множественное наследование:
super() следует алгоритму C3-линеаризации. При множественном наследовании super() не всегда вызывает прямого родителя — он вызывает следующий в MRO класс. Это позволяет строить "кооперативные" иерархии, где каждый класс корректно передаёт управление дальше.

Важный паттерн: для корректной работы с множественным наследованием все методы в цепочке должны вызывать super().__init__(**kwargs).`,
    syntax: "super()\nsuper(type, object-or-type)",
    arguments: [
      {
        name: "type",
        description:
          "Необязательный. Класс, начиная с которого искать в MRO (поиск начинается со следующего после type). В Python 3 без аргументов определяется автоматически",
      },
      {
        name: "object-or-type",
        description:
          "Необязательный. Объект (экземпляр) или тип, определяющий MRO для поиска. Без аргументов определяется из текущего контекста",
      },
    ],
    example: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} издаёт звук"

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)   # вызов Animal.__init__
        self.breed = breed

    def speak(self):
        base = super().speak()   # вызов Animal.speak
        return f"{base}: Гав!"

d = Dog("Rex", "Овчарка")
d.speak()   # 'Rex издаёт звук: Гав!'

# Множественное наследование
class A:
    def method(self):
        print("A")
        super().method()

class B:
    def method(self):
        print("B")

class C(A, B):
    def method(self):
        print("C")
        super().method()

C().method()   # C → A → B (порядок MRO!)
print(C.__mro__)  # (C, A, B, object)`,
  },
  {
    name: "sys.exit([arg])",
    description: `Завершает работу интерпретатора Python. Вызывает исключение SystemExit, которое может быть перехвачено в блоке try/except. Находится в модуле sys.

Аргумент arg:
- Если не указан или None — код завершения 0 (успех)
- Если целое число — используется как код возврата (0 = успех, ненулевое = ошибка)
- Если строка — выводится в stderr, код возврата 1

Поскольку sys.exit() вызывает SystemExit, а не принудительно завершает процесс, код в finally-блоках и обработчиках исключений всё равно выполнится. Для немедленного завершения без cleanup используйте os._exit().`,
    syntax: "sys.exit([arg])",
    arguments: [
      {
        name: "arg",
        description:
          "Необязательный. Код завершения (int), сообщение об ошибке (str) или None. По умолчанию 0",
      },
    ],
    example: `import sys

# Нормальное завершение
sys.exit(0)   # код 0 = успех

# Завершение с ошибкой
sys.exit(1)   # ненулевой код = ошибка

# Завершение с сообщением (в stderr)
sys.exit("Критическая ошибка: конфигурационный файл не найден")

# Перехват SystemExit (антипаттерн, но возможен)
try:
    sys.exit(1)
except SystemExit as e:
    print(f"Перехвачен выход с кодом: {e.code}")

# Типичный паттерн: валидация аргументов
import sys

def main():
    if len(sys.argv) < 2:
        print("Использование: script.py <filename>", file=sys.stderr)
        sys.exit(1)
    filename = sys.argv[1]
    print(f"Обрабатываю файл: {filename}")

# finally всё равно выполняется
try:
    print("До выхода")
    sys.exit(0)
finally:
    print("Это выполнится!")  # выводится перед выходом`,
  },
  {
    name: "sys.getrefcount(object)",
    description: `Возвращает количество ссылок на объект object. Находится в модуле sys. Используется для отладки и понимания работы управления памятью в CPython (счётчик ссылок).

Важно: возвращаемое значение всегда на 1 больше ожидаемого, потому что временная ссылка создаётся при передаче object в функцию getrefcount().

Применяется для:
- Понимания, почему объект не удаляется сборщиком мусора
- Отладки утечек памяти
- Исследования внутреннего поведения CPython

Примечание: данная функция специфична для CPython и может отсутствовать в других реализациях Python (PyPy, Jython и т.д.).`,
    syntax: "sys.getrefcount(object)",
    arguments: [
      {
        name: "object",
        description: "Объект, для которого нужно получить счётчик ссылок",
      },
    ],
    example: `import sys

# Базовый пример
a = []
print(sys.getrefcount(a))  # 2 (a + временная ссылка в getrefcount)

b = a  # ещё одна ссылка
print(sys.getrefcount(a))  # 3

del b
print(sys.getrefcount(a))  # 2 снова

# Маленькие числа кэшируются интерпретатором
print(sys.getrefcount(1))    # очень большое число — 1 используется повсюду
print(sys.getrefcount(None)) # ещё больше — None используется везде

# Список — уникальный объект
my_list = [1, 2, 3]
print(sys.getrefcount(my_list))  # 2

refs = [my_list, my_list, my_list]  # 3 дополнительные ссылки
print(sys.getrefcount(my_list))  # 5

# Внутри функции
def inspect(obj):
    # здесь +1 за параметр функции
    print(f"Ссылок: {sys.getrefcount(obj)}")

inspect(my_list)  # 6 (my_list + refs[0,1,2] + параметр + getrefcount)`,
  },
  {
    name: "sys.getsizeof(object[, default])",
    description: `Возвращает размер объекта object в байтах. Использует метод объекта __sizeof__() и добавляет накладные расходы сборщика мусора. Находится в модуле sys.

Важные ограничения:
- Возвращает размер только самого объекта, без вложенных объектов
- Для списка возвращает размер массива указателей, а не суммарный размер элементов
- Для словаря — размер хеш-таблицы без размера ключей и значений

Для полного (рекурсивного) замера размера структуры данных нужно обходить все вложенные объекты вручную или использовать сторонние библиотеки (pympler, objgraph).

Параметр default позволяет вернуть указанное значение вместо TypeError для объектов, не реализующих __sizeof__().`,
    syntax: "sys.getsizeof(object, default)",
    arguments: [
      { name: "object", description: "Объект, размер которого нужно получить" },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое если объект не поддерживает __sizeof__()",
      },
    ],
    example: `import sys

# Базовые типы
print(sys.getsizeof(0))        # 28 — int
print(sys.getsizeof(1000))     # 28 — int (одинаково для маленьких чисел)
print(sys.getsizeof(True))     # 28 — bool
print(sys.getsizeof(1.0))      # 24 — float
print(sys.getsizeof("hello"))  # 54 — str (зависит от длины)
print(sys.getsizeof(""))       # 49 — пустая строка

# Контейнеры — только сам контейнер, не содержимое!
lst = [1, 2, 3]
print(sys.getsizeof(lst))      # 88 — пустой список + 3 указателя
print(sys.getsizeof([]))       # 56 — пустой список

# Размер не включает вложенные объекты
big_list = [list(range(1000))] * 5
print(sys.getsizeof(big_list)) # ~104 — только 5 указателей!

# Рекурсивный подсчёт размера (полная функция)
def deep_sizeof(obj, seen=None):
    if seen is None:
        seen = set()
    obj_id = id(obj)
    if obj_id in seen:
        return 0
    seen.add(obj_id)
    size = sys.getsizeof(obj)
    if hasattr(obj, '__dict__'):
        size += deep_sizeof(obj.__dict__, seen)
    if hasattr(obj, '__iter__') and not isinstance(obj, (str, bytes)):
        size += sum(deep_sizeof(item, seen) for item in obj)
    return size

data = {"key": [1, 2, 3], "other": "value"}
print(deep_sizeof(data))  # учитывает все вложенные объекты`,
  },
  {
    name: "time.perf_counter()",
    description: `Возвращает значение счётчика производительности в секундах (число с плавающей запятой) с наивысшей доступной точностью. Находится в модуле time. Используется для измерения коротких промежутков времени в коде.

Ключевые особенности:
- Точка отсчёта произвольна — важна только разница между двумя вызовами
- Не сбрасывается при sleep — учитывает время сна
- Наивысшая точность среди функций time для измерения производительности
- Монотонный счётчик — значение никогда не убывает (в отличие от time.time())

Отличие от time.time():
- time.time() — абсолютное время (Unix timestamp, может меняться при изменении системных часов)
- time.perf_counter() — относительный счётчик, оптимизированный для измерений

Для профилирования используйте модуль timeit (более точен, учитывает многократные запуски).`,
    syntax: "time.perf_counter()",
    arguments: [],
    example: `import time

# Базовое измерение времени выполнения
start = time.perf_counter()

# ... измеряемый код ...
result = sum(range(1_000_000))

end = time.perf_counter()
print(f"Выполнено за {end - start:.4f} секунд")

# Контекстный менеджер для удобного замера
from contextlib import contextmanager

@contextmanager
def timer(label=""):
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{label}: {elapsed:.6f} сек")

with timer("Сортировка"):
    data = list(range(100_000, 0, -1))
    data.sort()

# Сравнение двух алгоритмов
def algo1(n): return sum(range(n))
def algo2(n): return n * (n - 1) // 2

n = 1_000_000
t1 = time.perf_counter(); algo1(n); t1 = time.perf_counter() - t1
t2 = time.perf_counter(); algo2(n); t2 = time.perf_counter() - t2
print(f"algo1: {t1:.6f}s, algo2: {t2:.6f}s, быстрее в: {t1/t2:.1f}x")`,
  },
  {
    name: "time.sleep(seconds)",
    description: `Приостанавливает выполнение текущего потока на указанное количество секунд. Находится в модуле time. Аргумент seconds может быть вещественным числом для задержки с точностью до миллисекунд.

Важные особенности:
- Блокирует текущий поток — другие потоки продолжают работу
- Минимальная фактическая задержка зависит от ОС (обычно ~1–15 мс)
- Может быть прервана сигналом (в этом случае вызывается исключение)
- Для асинхронного кода используйте asyncio.sleep() — не блокирует event loop

Применение: rate limiting, задержки между повторными запросами к API, анимации в консоли, имитация нагрузки в тестах.`,
    syntax: "time.sleep(seconds)",
    arguments: [
      {
        name: "seconds",
        description:
          "Количество секунд ожидания. Может быть вещественным числом (например, 0.5 для 500 мс)",
      },
    ],
    example: `import time

# Задержка 1 секунда
time.sleep(1)

# Задержка 0.5 секунды (500 мс)
time.sleep(0.5)

# Retry с задержкой
import requests

def fetch_with_retry(url, retries=3, delay=2.0):
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Попытка {attempt}/{retries} не удалась: {e}")
            if attempt < retries:
                time.sleep(delay)
    raise RuntimeError(f"Не удалось получить {url} за {retries} попыток")

# Прогресс-бар с задержкой
import sys
for i in range(1, 11):
    print(f"\rЗагрузка: {'█' * i}{'░' * (10 - i)} {i * 10}%", end="", flush=True)
    time.sleep(0.2)
print()

# Rate limiting для API
endpoints = ["/api/a", "/api/b", "/api/c"]
for endpoint in endpoints:
    print(f"Запрос к {endpoint}")
    # process(endpoint)
    time.sleep(0.1)  # не более 10 запросов в секунду`,
  },
  {
    name: "time.time()",
    description: `Возвращает текущее время в виде числа секунд, прошедших с начала эпохи Unix (1 января 1970 года, 00:00:00 UTC) — Unix timestamp. Тип возвращаемого значения — float. Находится в модуле time.

Применение:
- Получение текущего абсолютного времени
- Вычисление прошедшего времени (разность двух timestamp)
- Хранение временных меток в базах данных
- Создание временных идентификаторов

Ограничения:
- Зависит от системных часов — может прыгнуть при изменении времени на ПК
- Для точных измерений производительности лучше использовать time.perf_counter()
- Для работы с датами и временем лучше использовать модуль datetime

Преобразование: datetime.datetime.fromtimestamp(ts) → объект datetime.`,
    syntax: "time.time()",
    arguments: [],
    example: `import time

# Текущий Unix timestamp
ts = time.time()
print(ts)  # например, 1736000000.123456

# Измерение времени выполнения
start = time.time()
result = sum(range(10_000_000))
elapsed = time.time() - start
print(f"Выполнено за {elapsed:.3f} сек")

# Конвертация в читаемый формат
import datetime
dt = datetime.datetime.fromtimestamp(time.time())
print(dt.strftime("%Y-%m-%d %H:%M:%S"))  # "2024-01-04 15:30:00"

# Временная метка для имён файлов
filename = f"backup_{int(time.time())}.tar.gz"
print(filename)  # "backup_1736000000.tar.gz"

# Проверка тайм-аута
def wait_for_condition(check_fn, timeout=10.0, interval=0.5):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if check_fn():
            return True
        time.sleep(interval)
    return False  # тайм-аут истёк

# Кэш с TTL
cache = {}
def get_cached(key, ttl=60):
    if key in cache:
        value, timestamp = cache[key]
        if time.time() - timestamp < ttl:
            return value  # данные актуальны
    return None  # кэш устарел или пуст`,
  },
  {
    name: "timeit.timeit(stmt, setup, timer, number)",
    description: `Измеряет время выполнения фрагмента кода stmt, запуская его number раз. Возвращает общее время в секундах (float). Находится в модуле timeit. Предназначен для точных замеров производительности небольших фрагментов кода.

Параметры:
- stmt — измеряемый код (строка или callable). По умолчанию 'pass'
- setup — код подготовки, выполняется один раз перед замером (строка или callable). По умолчанию 'pass'
- timer — функция-таймер. По умолчанию time.perf_counter()
- number — количество повторений измеряемого кода. По умолчанию 1_000_000

Преимущества перед ручным time.perf_counter():
- Отключает сборщик мусора во время замера
- Автоматически повторяет несколько раз для статистической точности
- Изолирует измеряемый код от кода инициализации

Для нескольких повторов замера (поиск минимального времени) используйте timeit.repeat(stmt, number=N, repeat=R) — возвращает список из R результатов.`,
    syntax:
      'timeit.timeit(stmt="pass", setup="pass", timer=<timer>, number=1000000)',
    arguments: [
      {
        name: "stmt",
        description:
          'Измеряемый код: строка или callable без аргументов. По умолчанию "pass"',
      },
      {
        name: "setup",
        description:
          'Код подготовки, выполняется один раз. По умолчанию "pass"',
      },
      {
        name: "timer",
        description:
          "Необязательный. Функция-таймер. По умолчанию time.perf_counter()",
      },
      {
        name: "number",
        description: "Количество повторений stmt. По умолчанию 1_000_000",
      },
    ],
    example: `import timeit

# Сравнение способов создания списка
t1 = timeit.timeit('[x**2 for x in range(100)]', number=10000)
t2 = timeit.timeit('list(map(lambda x: x**2, range(100)))', number=10000)
print(f"list comprehension: {t1:.4f}s")
print(f"map+lambda:         {t2:.4f}s")
print(f"Быстрее в: {max(t1,t2)/min(t1,t2):.2f}x")

# С параметром setup — импорт/подготовка данных
t = timeit.timeit(
    stmt='",".join(str(n) for n in numbers)',
    setup='numbers = list(range(1000))',
    number=5000
)
print(f"join с генератором: {t:.4f}s")

# Callable вместо строки (удобнее для сложного кода)
def test_dict_access():
    d = {"a": 1, "b": 2, "c": 3}
    return d.get("a")

t = timeit.timeit(test_dict_access, number=100000)
print(f"dict.get: {t:.4f}s")

# timeit.repeat — несколько замеров для надёжности
results = timeit.repeat(
    stmt='sorted([5,3,1,4,2])',
    number=100000,
    repeat=5
)
print(f"Лучший результат: {min(results):.4f}s")
print(f"Все замеры: {[f'{r:.4f}' for r in results]}")

# Из командной строки (без кода):
# python -m timeit -n 10000 "'-'.join(str(n) for n in range(100))"
# python -m timeit -s "import re" "re.compile(r'\\\\d+')"  `,
  },
  {
    name: "tuple([iterable])",
    description: `Создаёт неизменяемую последовательность (кортеж) из итерируемого объекта. Если iterable не указан — создаётся пустой кортеж ().

Ключевые свойства кортежей:
- Неизменяемость: после создания нельзя добавить, удалить или изменить элементы
- Упорядоченность: сохраняют порядок вставки
- Разнотипность: могут содержать элементы разных типов
- Хэшируемость: если все элементы хэшируемы — кортеж тоже хэшируем (можно как ключ словаря)
- Эффективность: кортежи занимают меньше памяти, чем списки; операции чуть быстрее

Кортеж vs список:
- tuple — для разнородных данных, когда смысл каждой позиции фиксирован (координата, запись)
- list — для однородных данных, когда коллекция может меняться

Распаковка кортежей (unpacking) — мощная возможность Python:
- a, b, c = (1, 2, 3)
- first, *rest = (1, 2, 3, 4, 5)
- x, y = point (если point = (1, 2))

namedtuple из collections — кортеж с именованными полями, удобнее обычного для структурированных данных.`,
    syntax: "tuple([iterable])",
    arguments: [
      {
        name: "iterable",
        description:
          "Необязательный. Итерируемый объект для создания кортежа. Если не указан — создаётся пустой кортеж ()",
      },
    ],
    example: `tuple()              # ()
tuple([1, 2, 3])     # (1, 2, 3)
tuple("hello")       # ('h', 'e', 'l', 'l', 'o')
tuple({1, 2, 3})     # (1, 2, 3) — порядок не гарантирован
tuple(range(5))      # (0, 1, 2, 3, 4)

# Как ключ словаря (в отличие от list!)
point_data = {(0, 0): "origin", (1, 0): "x-axis"}

# Распаковка
x, y = (10, 20)
print(x, y)          # 10 20

a, *middle, z = (1, 2, 3, 4, 5)
print(a, middle, z)  # 1 [2, 3, 4] 5

# namedtuple — кортеж с именами полей
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
print(p.x, p.y)      # 3 4
print(p[0], p[1])    # 3 4  (работает и как обычный кортеж)

# Одноэлементный кортеж — нужна запятая!
t = (42,)     # кортеж из одного элемента
t2 = (42)     # просто число 42!`,
  },
  {
    name: "type(object) / type(name, bases, dict)",
    description: `Имеет две принципиально разные формы использования.

Форма 1 — type(object): возвращает тип объекта. Это точная проверка типа, аналогичная object.__class__. В отличие от isinstance(), не учитывает наследование.

Форма 2 — type(name, bases, dict): динамически создаёт новый класс. Это метакласс-форма: name — имя класса, bases — кортеж базовых классов, dict — словарь атрибутов и методов.

type — это сам метакласс всех классов. Это означает:
- type(int) → <class 'type'>
- type(type) → <class 'type'> (type — экземпляр самого себя!)
- Все классы являются экземплярами type

type vs isinstance():
- type(x) == SomeClass — строгая проверка, не учитывает подклассы
- isinstance(x, SomeClass) — учитывает наследование (предпочтительно)

Динамическое создание класса через type() равносильно объявлению класса через class. Это основа метапрограммирования в Python: декораторы классов, метаклассы, ORM-фреймворки (Django Models, SQLAlchemy).`,
    syntax: "type(object)\ntype(name, bases, dict)",
    arguments: [
      {
        name: "object",
        description: "Форма 1: объект, тип которого нужно получить",
      },
      { name: "name", description: "Форма 2: строка с именем нового класса" },
      {
        name: "bases",
        description:
          "Форма 2: кортеж базовых классов (родителей). () для наследования только от object",
      },
      {
        name: "dict",
        description: "Форма 2: словарь атрибутов и методов нового класса",
      },
    ],
    example: `# Форма 1 — получить тип
type(42)            # <class 'int'>
type("hello")       # <class 'str'>
type([])            # <class 'list'>
type(None)          # <class 'NoneType'>

# type vs isinstance (различие с наследованием)
class Animal: pass
class Dog(Animal): pass
d = Dog()
type(d) == Dog      # True
type(d) == Animal   # False  (строго: Dog, не Animal)
isinstance(d, Animal)  # True  (учитывает наследование)

# Форма 2 — динамическое создание класса
# Эквивалентно: class Dog(Animal): speak = lambda self: "Гав!"
Dog = type('Dog', (Animal,), {
    'species': 'Canis',
    'speak': lambda self: "Гав!"
})
d = Dog()
d.speak()           # 'Гав!'
d.species           # 'Canis'

# Метакласс — type порождает классы
type(int)           # <class 'type'>
type(type)          # <class 'type'>`,
  },
  {
    name: "typing.cast(type, object)",
    description: `Приводит значение object к типу type для системы проверки типов. Находится в модуле typing. Во время выполнения просто возвращает object без каких-либо изменений — это подсказка исключительно для статических анализаторов (mypy, pyright и т.д.).

Используется когда анализатор типов не может самостоятельно вывести правильный тип, но программист знает, какой тип на самом деле.

Типичные случаи применения:
- После isinstance-проверки в месте, которое анализатор не распознаёт
- При работе с API, возвращающими Any или Optional
- При сужении типа Union[A, B] до конкретного A

Важно: typing.cast() ничего не делает в runtime — не конвертирует тип данных, не выполняет проверку. Используйте только когда уверены в типе.`,
    syntax: "typing.cast(type, val)",
    arguments: [
      { name: "type", description: "Целевой тип (или строка с именем типа)" },
      {
        name: "val",
        description:
          'Значение, которое нужно "привести" к типу (в runtime возвращается без изменений)',
      },
    ],
    example: `from typing import cast, Optional, Union

# Базовое использование
x: object = "hello"
s = cast(str, x)       # анализатор знает, что s — str
print(s.upper())       # 'HELLO'

# После Optional — убираем None из типа
def get_user_id() -> Optional[int]:
    return 42

user_id = get_user_id()
# Здесь тип Optional[int], но мы знаем что не None:
safe_id = cast(int, user_id)
print(safe_id + 1)  # 43

# Union сужение
def parse_value(data: Union[str, int]) -> str:
    if isinstance(data, str):
        # mypy может не распознать сужение в сложных случаях
        return cast(str, data).upper()
    return str(data)

# Работа с возвратом Any (например json.loads)
import json
raw = json.loads('{"name": "Alice", "age": 30}')
# raw имеет тип Any
typed = cast(dict[str, object], raw)
print(typed["name"])  # теперь анализатор понимает структуру

# Важно: в runtime cast ничего не делает
result = cast(int, "не число")
print(result)   # 'не число' — тип не изменился!
print(type(result))  # <class 'str'>`,
  },
  {
    name: "typing.get_type_hints(obj[, globalns[, localns]])",
    description: `Возвращает словарь аннотаций типов для функции, метода, модуля или класса obj. Находится в модуле typing. В отличие от прямого доступа к __annotations__, разрешает строковые аннотации (forward references) и аннотации из модулей.

Отличие от obj.__annotations__:
- __annotations__ — "сырой" словарь, строковые аннотации остаются строками
- get_type_hints() — разрешает строковые ссылки (from __future__ import annotations) в реальные типы

Параметры globalns / localns:
- Позволяют указать пространства имён для разрешения forward references
- Полезно при работе с аннотациями из другого модуля

Если аннотации недоступны или объект не поддерживает их — возвращает пустой словарь.`,
    syntax: "typing.get_type_hints(obj, globalns=None, localns=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Функция, метод, класс или модуль, аннотации которого нужно получить",
      },
      {
        name: "globalns",
        description:
          "Необязательный. Глобальное пространство имён для разрешения строковых аннотаций",
      },
      {
        name: "localns",
        description:
          "Необязательный. Локальное пространство имён для разрешения строковых аннотаций",
      },
    ],
    example: `from typing import get_type_hints, Optional, List

# Аннотации функции
def process(name: str, count: int = 0) -> Optional[str]:
    if count > 0:
        return name * count
    return None

hints = get_type_hints(process)
print(hints)
# {'name': <class 'str'>, 'count': <class 'int'>, 'return': typing.Optional[str]}

# Аннотации класса
class User:
    id: int
    name: str
    email: Optional[str]

    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

print(get_type_hints(User))
# {'id': <class 'int'>, 'name': <class 'str'>, 'email': typing.Optional[str]}

# Разрешение forward references (строковых аннотаций)
class Node:
    value: int
    next: "Optional[Node]"   # forward reference

print(get_type_hints(Node))
# {'value': int, 'next': Optional[Node]}  — строка разрешена!

# Практическое применение: валидация или сериализация
def validate_types(obj, cls):
    hints = get_type_hints(cls)
    for field, expected_type in hints.items():
        value = getattr(obj, field, None)
        if not isinstance(value, expected_type):
            raise TypeError(f"{field}: ожидался {expected_type}, получен {type(value)}")`,
  },
  {
    name: "typing.NewType(name, tp)",
    description: `Создаёт новый тип name на основе tp. Находится в модуле typing. Позволяет различать семантически разные значения одного базового типа на уровне статической проверки.

В Python ≥ 3.10: NewType создаёт класс-объект. В Python 3.9 и ниже — возвращает callable.

Ключевое отличие от type alias (MyType = int):
- type alias — синоним, оба типа полностью взаимозаменяемы
- NewType — новый тип, нельзя передать базовый тип туда, где ожидается NewType

В runtime NewType("UserId", int) возвращает просто identity-функцию (в 3.10+ — экземпляр класса NewType). Никакой реальной проверки типов в runtime не происходит.

Применение: различение UserId vs ProductId (оба int), Email vs Username (оба str) и т.д.`,
    syntax: "typing.NewType(name, tp)",
    arguments: [
      {
        name: "name",
        description:
          "Имя нового типа (строка, должно совпадать с именем переменной)",
      },
      {
        name: "tp",
        description: "Базовый тип, на основе которого создаётся новый",
      },
    ],
    example: `from typing import NewType

# Создание семантически различных типов
UserId = NewType("UserId", int)
ProductId = NewType("ProductId", int)
Email = NewType("Email", str)

# Использование в аннотациях
def get_user(user_id: UserId) -> str:
    return f"User #{user_id}"

def get_product(product_id: ProductId) -> str:
    return f"Product #{product_id}"

# Создание значений нового типа
uid = UserId(42)
pid = ProductId(42)

# mypy выдаст ошибку: Argument 1 to "get_user" has incompatible type "ProductId"
# get_user(pid)  # ОШИБКА ТИПА!

# get_user принимает только UserId, не int напрямую
# get_user(42)   # ОШИБКА ТИПА в строгом режиме!
get_user(UserId(42))  # OK

# Наследование методов базового типа
uid = UserId(10)
print(uid + 5)    # 15 — работает как int
print(uid * 2)    # 20

# Email vs str
def send_email(to: Email, subject: str) -> None:
    print(f"Отправка на {to}: {subject}")

# send_email("user@example.com", "Hello")  # ОШИБКА ТИПА
send_email(Email("user@example.com"), "Hello")  # OK`,
  },
  {
    name: "vars([object])",
    description: `Возвращает атрибут __dict__ объекта — словарь, содержащий изменяемое пространство имён.

Без аргументов: vars() возвращает то же самое что и locals() — словарь локальных переменных в текущей области видимости.

С аргументом: возвращает __dict__ объекта. Большинство пользовательских объектов имеют __dict__, который хранит их атрибуты в виде словаря.

Возбуждает TypeError если объект не имеет __dict__. Объекты без __dict__:
- Объекты встроенных типов (int, str, list и т.д.)
- Объекты с __slots__ (они специально не создают __dict__ для экономии памяти)

Возвращаемый словарь — это реальный __dict__ объекта, не копия. Изменение его значений напрямую меняет атрибуты объекта (как setattr).

Различие с dir():
- vars(obj) — только собственные атрибуты экземпляра (из __dict__)
- dir(obj) — все атрибуты включая унаследованные и методы класса

Применение: отладка, сериализация, копирование состояния объекта, генерация документации.`,
    syntax: "vars([object])",
    arguments: [
      {
        name: "object",
        description:
          "Необязательный. Объект с __dict__. Без аргумента — аналог locals()",
      },
    ],
    example: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(3, 4)
vars(p)            # {'x': 3, 'y': 4}
p.__dict__         # {'x': 3, 'y': 4}  — то же самое

# Изменение через vars()
vars(p)['x'] = 10
print(p.x)         # 10  — реально изменилось!

# Без аргумента — локальные переменные
def func():
    a = 1
    b = "hello"
    return vars()  # {'a': 1, 'b': 'hello'}

# vars() для отладки/сериализации
import json
class Config:
    def __init__(self):
        self.host = "localhost"
        self.port = 8080
        self.debug = True

cfg = Config()
print(json.dumps(vars(cfg)))
# {"host": "localhost", "port": 8080, "debug": true}

# TypeError для объектов без __dict__
# vars(42)    # TypeError
# vars([])    # TypeError`,
  },
  {
    name: "zip(*iterables, strict=False)",
    description: `Создаёт итератор, агрегирующий элементы из нескольких итерируемых объектов. На каждом шаге возвращает кортеж из одного элемента каждого итерируемого.

Поведение при разной длине:
- По умолчанию: итерация останавливается по самому короткому итерируемому
- strict=True (Python 3.10+): если итерируемые имеют разную длину, возбуждается ValueError
- itertools.zip_longest() — итерация до самого длинного с заполнением значением по умолчанию

zip() возвращает ленивый итератор. Для получения списка передайте в list().

Типичные применения:
- Обход нескольких последовательностей параллельно
- Создание словаря из двух списков: dict(zip(keys, values))
- "Транспонирование" матрицы: list(zip(*matrix))
- Разбиение на пары: zip(lst, lst[1:]) — соседние пары

Эффективность: ленивое вычисление, не создаёт промежуточных структур. Для больших данных это важно.

Распаковка zip (*zip): zip(*zipped) "распакует" список кортежей обратно в отдельные списки.`,
    syntax: "zip(*iterables, strict=False)",
    arguments: [
      {
        name: "*iterables",
        description:
          "Один или несколько итерируемых объектов. При одном итерируемом возвращает кортежи из одного элемента",
      },
      {
        name: "strict",
        description:
          "Необязательный (Python 3.10+). Если True — ValueError при разной длине итерируемых. По умолчанию False",
      },
    ],
    example: `names = ["Alice", "Bob", "Carol"]
scores = [95, 87, 92]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 95 / Bob: 87 / Carol: 92

# Создание словаря
keys = ["a", "b", "c"]
values = [1, 2, 3]
d = dict(zip(keys, values))   # {'a': 1, 'b': 2, 'c': 3}

# Транспонирование матрицы
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
transposed = list(zip(*matrix))
# [(1, 4, 7), (2, 5, 8), (3, 6, 9)]

# Соседние пары
lst = [1, 2, 3, 4, 5]
pairs = list(zip(lst, lst[1:]))
# [(1, 2), (2, 3), (3, 4), (4, 5)]

# strict=True — одинаковая длина обязательна
list(zip([1,2,3], [4,5], strict=True))
# ValueError: zip() has arguments with different lengths

# Распаковка (unzip)
zipped = [(1,'a'), (2,'b'), (3,'c')]
nums, letters = zip(*zipped)
# nums=(1,2,3), letters=('a','b','c')`,
  },
  {
    name: "__import__(name, globals, locals, fromlist, level)",
    description: `Низкоуровневая функция импорта, вызываемая оператором import. Обычно напрямую не используется — для динамического импорта предпочтительнее importlib.import_module().

Параметр name: полное имя модуля (строка), например 'os', 'os.path', 'json'.

Параметр fromlist:
- Пустой список (по умолчанию): возвращает верхний уровень пакета. import os.path → возвращает os
- Непустой список: возвращает сам модуль. __import__('os.path', fromlist=['join']) → возвращает os.path

Параметр level — относительный импорт:
- 0: абсолютный импорт
- 1: на один пакет выше (относительный)
- 2: на два пакета выше

Почему importlib.import_module() предпочтительнее:
- Более понятный API
- Правильно обрабатывает fromlist
- Поддерживает относительные импорты через параметр package
- Рекомендован официальной документацией Python

Применения __import__() на практике:
- Понимание того, как работает import под капотом
- Хуки для модификации поведения импорта (sys.meta_path)
- Очень специфические случаи, когда importlib не подходит`,
    syntax: "__import__(name, globals=None, locals=None, fromlist=(), level=0)",
    arguments: [
      {
        name: "name",
        description:
          'Строка с именем модуля для импорта (например, "os", "os.path", "json")',
      },
      {
        name: "globals",
        description:
          "Необязательный. Словарь глобальных переменных вызывающего кода (используется для относительных импортов)",
      },
      {
        name: "locals",
        description:
          "Необязательный. Словарь локальных переменных (как правило, не используется)",
      },
      {
        name: "fromlist",
        description:
          "Необязательный. Список имён для импорта из модуля. Если непустой — возвращает сам модуль, а не верхний пакет",
      },
      {
        name: "level",
        description:
          "Необязательный. 0 — абсолютный импорт (по умолчанию), >0 — относительный импорт",
      },
    ],
    example: `# Прямое использование __import__
os = __import__('os')
os.getcwd()   # '/home/user/...'

# Получить подмодуль нужно через fromlist
path = __import__('os.path', fromlist=['join'])
path.join('a', 'b')   # 'a/b'  — это os.path, а не os!

# Без fromlist возвращается верхний уровень пакета
top = __import__('os.path')
top   # <module 'os'>  — не os.path!

# Рекомендуемый способ — importlib
import importlib
json = importlib.import_module('json')
json.dumps({'a': 1})   # '{"a": 1}'

# Динамический импорт по имени из конфига
module_name = 'json'
module = importlib.import_module(module_name)

# Относительный импорт через importlib
# (внутри пакета mypackage)
utils = importlib.import_module('.utils', package='mypackage')`,
  },
  {
    name: "set.add(elem)",
    description: `Добавляет элемент elem в множество. Если элемент уже присутствует — множество не изменяется и ошибка не возникает.

Элемент должен быть хэшируемым (hashable) — то есть неизменяемым: числа, строки, кортежи из хэшируемых элементов. Попытка добавить изменяемый объект (список, словарь, множество) вызовет TypeError.

Метод изменяет множество на месте (in-place) и возвращает None. Для добавления нескольких элементов используйте update().`,
    syntax: "set.add(elem)",
    arguments: [
      {
        name: "elem",
        description: "Хэшируемый элемент, который нужно добавить в множество",
      },
    ],
    example: `s = {1, 2, 3}

s.add(4)
print(s)   # {1, 2, 3, 4}

# Добавление уже существующего элемента — ничего не происходит
s.add(2)
print(s)   # {1, 2, 3, 4}

# Строки и кортежи — хэшируемые, можно добавлять
s2 = {'apple', 'banana'}
s2.add('cherry')
print(s2)   # {'apple', 'banana', 'cherry'}

# Кортеж — хэшируемый
s3 = set()
s3.add((1, 2))
print(s3)   # {(1, 2)}

# Список — НЕ хэшируемый, вызовет TypeError
# s3.add([1, 2])   # TypeError: unhashable type: 'list'`,
  },
  {
    name: "set.clear()",
    description: `Удаляет все элементы из множества. После вызова множество становится пустым set(). Метод изменяет множество на месте и возвращает None.

Аналогично dict.clear(), важно понимать разницу между clear() и переприсваиванием:
- s.clear() — изменяет тот же объект в памяти, все переменные, ссылающиеся на это множество, увидят пустое множество
- s = set() — создаёт новый пустой объект, старые ссылки по-прежнему указывают на исходное множество

Метод применим и к frozenset-подклассам, однако сам frozenset является неизменяемым и не имеет метода clear().`,
    syntax: "set.clear()",
    arguments: [],
    example: `s = {1, 2, 3, 4, 5}
s.clear()
print(s)   # set()

# Разница между clear() и переприсваиванием:
s1 = {10, 20, 30}
s2 = s1   # s2 ссылается на тот же объект

s1.clear()
print(s2)   # set() — s2 тоже пуста, это один объект

s1 = {10, 20, 30}
s2 = s1
s1 = set()  # создаём новый объект
print(s2)   # {10, 20, 30} — s2 не изменилась`,
  },
  {
    name: "set.copy()",
    description: `Возвращает поверхностную (shallow) копию множества. Создаётся новый объект set с теми же элементами, что и исходное множество.

Поскольку элементы множества обязаны быть хэшируемыми (а значит, как правило, неизменяемыми), поверхностная копия на практике ведёт себя как полная независимая копия — изменение одного множества не затрагивает другое.

Метод эквивалентен set(s) или s | set() (объединение с пустым множеством).`,
    syntax: "set.copy()",
    arguments: [],
    example: `original = {1, 2, 3, 4}
copy = original.copy()

copy.add(5)
print(original)   # {1, 2, 3, 4}  (не изменился)
print(copy)       # {1, 2, 3, 4, 5}

copy.discard(1)
print(original)   # {1, 2, 3, 4}  (не изменился)

# Эквивалентные способы скопировать множество:
s = {10, 20, 30}
s2 = set(s)   # через конструктор
s3 = s | set()  # через объединение
print(s2 == s3 == s.copy())   # True`,
  },
  {
    name: "set.difference(*others)",
    description: `Возвращает новое множество, содержащее элементы исходного множества, которых нет ни в одном из множеств others. Исходное множество не изменяется.

Эквивалентно оператору -: s - other1 - other2 - ...

Метод принимает любое количество аргументов. Каждый аргумент может быть любым итерируемым объектом (список, кортеж, строка и т.д.) — не обязательно множеством.

Для изменения множества на месте (без создания нового объекта) используйте difference_update().`,
    syntax: "set.difference(*others)",
    arguments: [
      {
        name: "*others",
        description:
          "Одно или несколько множеств или итерируемых объектов, элементы которых нужно исключить из исходного",
      },
    ],
    example: `a = {1, 2, 3, 4, 5}
b = {3, 4}
c = {4, 5, 6}

# Разность двух множеств
print(a.difference(b))      # {1, 2, 5}
print(a - b)                # {1, 2, 5}  (то же через оператор)

# Разность с несколькими множествами
print(a.difference(b, c))   # {1, 2}

# Исходное множество не изменяется
print(a)   # {1, 2, 3, 4, 5}

# Аргументом может быть список
print(a.difference([3, 4, 5]))   # {1, 2}

# Уникальные слова в одном тексте, которых нет в другом:
words1 = {'python', 'java', 'go', 'rust'}
words2 = {'java', 'c++', 'go'}
only_in_1 = words1.difference(words2)
print(only_in_1)   # {'python', 'rust'}`,
  },
  {
    name: "set.difference_update(*others)",
    description: `Удаляет из множества все элементы, присутствующие в others. Метод изменяет множество на месте и возвращает None.

Это версия difference() с изменением исходного множества: если difference() создаёт новый объект, то difference_update() меняет текущий.

Эквивалентно оператору -=: s -= other1 | other2 | ...

Принимает любое количество аргументов — любые итерируемые объекты.`,
    syntax: "set.difference_update(*others)",
    arguments: [
      {
        name: "*others",
        description:
          "Одно или несколько множеств или итерируемых объектов, элементы которых нужно удалить из исходного",
      },
    ],
    example: `s = {1, 2, 3, 4, 5}

# Удаляем элементы, присутствующие в другом множестве
s.difference_update({3, 4})
print(s)   # {1, 2, 5}

# Эквивалентно оператору -=
s2 = {1, 2, 3, 4, 5}
s2 -= {3, 4}
print(s2)   # {1, 2, 5}

# С несколькими аргументами
s3 = {1, 2, 3, 4, 5, 6}
s3.difference_update({2, 3}, {5, 6})
print(s3)   # {1, 4}

# Аргументом может быть список или другой итерируемый объект
s4 = {'a', 'b', 'c', 'd'}
s4.difference_update(['b', 'c'])
print(s4)   # {'a', 'd'}`,
  },
  {
    name: "set.discard(elem)",
    description: `Удаляет элемент elem из множества, если он присутствует. Если элемента нет — ничего не происходит, ошибка не возникает.

Ключевое отличие от remove(): remove() вызывает KeyError при отсутствии элемента, а discard() — нет. Используйте discard(), когда не уверены в наличии элемента.

Метод изменяет множество на месте и возвращает None.`,
    syntax: "set.discard(elem)",
    arguments: [
      {
        name: "elem",
        description:
          "Элемент, который нужно удалить из множества. Если отсутствует — ошибки не возникает",
      },
    ],
    example: `s = {1, 2, 3, 4, 5}

# Удаление существующего элемента
s.discard(3)
print(s)   # {1, 2, 4, 5}

# Удаление несуществующего элемента — ошибки нет
s.discard(99)
print(s)   # {1, 2, 4, 5}  (не изменилось)

# Сравнение с remove():
s2 = {1, 2, 3}
s2.remove(2)    # OK
# s2.remove(99)  # KeyError: 99

# Типичный сценарий — безопасное удаление из множества:
active_users = {'alice', 'bob', 'charlie'}
user_to_remove = 'dave'    # может не существовать
active_users.discard(user_to_remove)   # безопасно
print(active_users)   # {'alice', 'bob', 'charlie'}`,
  },
  {
    name: "set.intersection(*others)",
    description: `Возвращает новое множество, содержащее только те элементы, которые присутствуют во всех множествах — и в исходном, и в каждом из others. Исходное множество не изменяется.

Эквивалентно оператору &: s & other1 & other2 & ...

Принимает любое количество аргументов. Результат — элементы, общие для всех переданных множеств.

Для изменения исходного множества на месте используйте intersection_update().`,
    syntax: "set.intersection(*others)",
    arguments: [
      {
        name: "*others",
        description:
          "Одно или несколько множеств или итерируемых объектов, с которыми выполняется пересечение",
      },
    ],
    example: `a = {1, 2, 3, 4, 5}
b = {3, 4, 5, 6, 7}
c = {4, 5, 8, 9}

# Пересечение двух множеств
print(a.intersection(b))      # {3, 4, 5}
print(a & b)                  # {3, 4, 5}  (через оператор)

# Пересечение трёх множеств
print(a.intersection(b, c))   # {4, 5}

# Исходное множество не изменяется
print(a)   # {1, 2, 3, 4, 5}

# Поиск общих элементов в нескольких списках
list1 = [1, 2, 3, 4]
list2 = [2, 3, 5]
common = set(list1).intersection(list2)
print(common)   # {2, 3}

# Поиск пользователей, посетивших ВСЕ три страницы
page_a = {'alice', 'bob', 'charlie'}
page_b = {'bob', 'charlie', 'dave'}
page_c = {'charlie', 'dave', 'eve'}
visited_all = page_a & page_b & page_c
print(visited_all)   # {'charlie'}`,
  },
  {
    name: "set.intersection_update(*others)",
    description: `Оставляет в множестве только элементы, присутствующие и в исходном множестве, и в каждом из others. Метод изменяет множество на месте и возвращает None.

Это версия intersection() с изменением исходного объекта: intersection() создаёт новое множество, intersection_update() — обновляет текущее.

Эквивалентно оператору &=: s &= other1 & other2 & ...`,
    syntax: "set.intersection_update(*others)",
    arguments: [
      {
        name: "*others",
        description:
          "Одно или несколько множеств или итерируемых объектов. В исходном множестве останутся только элементы, присутствующие во всех них",
      },
    ],
    example: `s = {1, 2, 3, 4, 5}

s.intersection_update({2, 3, 4, 6})
print(s)   # {2, 3, 4}

# Эквивалентно оператору &=
s2 = {1, 2, 3, 4, 5}
s2 &= {3, 4, 5, 6}
print(s2)   # {3, 4, 5}

# С несколькими аргументами
s3 = {1, 2, 3, 4, 5}
s3.intersection_update({2, 3, 4}, {3, 4, 5})
print(s3)   # {3, 4}

# Аргументом может быть список
s4 = {'a', 'b', 'c', 'd'}
s4.intersection_update(['b', 'c', 'e'])
print(s4)   # {'b', 'c'}`,
  },
  {
    name: "set.isdisjoint(other)",
    description: `Возвращает True, если множества не пересекаются — то есть у них нет общих элементов. Если хотя бы один элемент присутствует в обоих — возвращает False.

Метод не изменяет ни одно из множеств.

Это эффективная операция: при нахождении первого общего элемента поиск немедленно прекращается.

В отличие от операторов & или intersection(), isdisjoint() принимает любой итерируемый объект в качестве аргумента.`,
    syntax: "set.isdisjoint(other)",
    arguments: [
      {
        name: "other",
        description:
          "Множество или итерируемый объект, с которым проверяется отсутствие пересечения",
      },
    ],
    example: `a = {1, 2, 3}
b = {4, 5, 6}
c = {3, 4, 5}

# Нет общих элементов
print(a.isdisjoint(b))   # True

# Есть общий элемент (3)
print(a.isdisjoint(c))   # False

# Аргументом может быть список
print(a.isdisjoint([7, 8, 9]))   # True
print(a.isdisjoint([2, 7, 8]))   # False

# Пустое множество не пересекается ни с каким другим
print(set().isdisjoint({1, 2, 3}))   # True
print(a.isdisjoint(set()))           # True

# Практический пример — проверка конфликтов прав доступа:
admin_permissions = {'read', 'write', 'delete', 'admin'}
user_permissions = {'read', 'comment'}
has_conflict = not user_permissions.isdisjoint(admin_permissions)
print(has_conflict)   # True (оба имеют 'read')`,
  },
  {
    name: "set.issubset(other)",
    description: `Возвращает True, если каждый элемент исходного множества присутствует в other (исходное является подмножеством other). Иначе возвращает False.

Пустое множество является подмножеством любого множества. Множество является подмножеством самого себя.

Эквивалентно оператору <=: s <= other.

Для проверки строгого подмножества (подмножество, но не равно) используйте оператор <.`,
    syntax: "set.issubset(other)",
    arguments: [
      {
        name: "other",
        description:
          "Множество или итерируемый объект, который проверяется на содержание всех элементов исходного",
      },
    ],
    example: `a = {1, 2, 3}
b = {1, 2, 3, 4, 5}
c = {1, 2, 4}

# a полностью содержится в b
print(a.issubset(b))    # True
print(a <= b)           # True  (через оператор)

# a не является подмножеством c (нет 3 в c)
print(a.issubset(c))    # False

# Множество является подмножеством самого себя
print(a.issubset(a))    # True
print(a <= a)           # True

# Строгое подмножество (не равно):
print(a < b)            # True  (a ⊂ b, и a ≠ b)
print(a < a)            # False (a = a, не строгое)

# Пустое множество — подмножество любого
print(set().issubset(a))   # True

# Аргументом может быть список
print({1, 2}.issubset([1, 2, 3, 4]))   # True`,
  },
  {
    name: "set.issuperset(other)",
    description: `Возвращает True, если исходное множество содержит все элементы other (исходное является надмножеством other). Иначе возвращает False.

Это операция, обратная issubset(): если a.issubset(b) — True, то b.issuperset(a) — тоже True.

Эквивалентно оператору >=: s >= other.

Для строгого надмножества (содержит all элементы other, но не равно ему) используйте оператор >.`,
    syntax: "set.issuperset(other)",
    arguments: [
      {
        name: "other",
        description:
          "Множество или итерируемый объект, все элементы которого проверяются на вхождение в исходное множество",
      },
    ],
    example: `a = {1, 2, 3, 4, 5}
b = {1, 2, 3}
c = {1, 2, 6}

# a содержит все элементы b
print(a.issuperset(b))    # True
print(a >= b)             # True  (через оператор)

# a не содержит 6 из c
print(a.issuperset(c))    # False

# Множество — надмножество самого себя
print(a.issuperset(a))    # True
print(a >= a)             # True

# Строгое надмножество (не равно):
print(a > b)              # True
print(a > a)              # False

# Любое множество — надмножество пустого
print(a.issuperset(set()))   # True

# Аргументом может быть список
print(a.issuperset([1, 2, 3]))   # True

# Проверка: содержат ли права пользователя все необходимые?
required = {'read', 'write'}
user_perms = {'read', 'write', 'delete'}
print(user_perms.issuperset(required))   # True`,
  },
  {
    name: "set.pop()",
    description: `Удаляет и возвращает произвольный элемент из множества. Если множество пусто — вызывает KeyError.

В отличие от pop() у списков и словарей, множество не упорядочено, поэтому порядок удаления элементов не определён и не гарантирован. Не следует полагаться на то, какой именно элемент будет удалён.

Метод изменяет множество на месте. Используется когда нужно итеративно извлекать и обрабатывать элементы из множества без привязки к конкретному порядку.`,
    syntax: "set.pop()",
    arguments: [],
    example: `s = {1, 2, 3, 4, 5}

# Удаляет и возвращает произвольный элемент
elem = s.pop()
print(elem)   # какое-то число (непредсказуемо)
print(s)      # множество без этого элемента

# KeyError на пустом множестве
empty = set()
# empty.pop()   # KeyError: 'pop from an empty set'

# Итеративная обработка всего множества
tasks = {'email', 'call', 'meeting', 'report'}
while tasks:
    task = tasks.pop()
    print(f"Выполняю: {task}")
# Выводит все задачи в непредсказуемом порядке

# Безопасное извлечение с проверкой:
s2 = {42}
if s2:
    val = s2.pop()
    print(val)   # 42`,
  },
  {
    name: "set.remove(elem)",
    description: `Удаляет элемент elem из множества. Если элемент отсутствует — вызывает KeyError.

Ключевое отличие от discard(): remove() сигнализирует об ошибке, если элемента нет, а discard() — нет. Используйте remove(), когда отсутствие элемента является неожиданной ситуацией, требующей явной обработки.

Метод изменяет множество на месте и возвращает None.`,
    syntax: "set.remove(elem)",
    arguments: [
      {
        name: "elem",
        description:
          "Элемент, который нужно удалить из множества. Должен присутствовать — иначе KeyError",
      },
    ],
    example: `s = {1, 2, 3, 4, 5}

# Удаление существующего элемента
s.remove(3)
print(s)   # {1, 2, 4, 5}

# Удаление отсутствующего элемента — KeyError
try:
    s.remove(99)
except KeyError as e:
    print(f"Ошибка: {e}")   # Ошибка: 99

# Сравнение remove() и discard():
s2 = {10, 20, 30}

s2.discard(99)   # Тихо, ошибки нет
# s2.remove(99)  # KeyError!

# Когда использовать remove(): элемент точно должен быть
users = {'alice', 'bob', 'charlie'}
users.remove('bob')   # bob точно должен существовать
print(users)   # {'alice', 'charlie'}

# Когда использовать discard(): может не быть
optional_tag = 'draft'
tags = {'published', 'featured'}
tags.discard(optional_tag)   # безопасно`,
  },
  {
    name: "set.symmetric_difference(other)",
    description: `Возвращает новое множество, содержащее элементы, которые есть только в одном из двух множеств (но не в обоих). Это «исключающее или» (XOR) для множеств.

Элементы, присутствующие в обоих множествах одновременно, в результат не включаются. Исходное множество не изменяется.

Эквивалентно оператору ^: s ^ other.

Для изменения исходного множества на месте используйте symmetric_difference_update().

В отличие от difference(), symmetric_difference() симметрична: a.symmetric_difference(b) == b.symmetric_difference(a).`,
    syntax: "set.symmetric_difference(other)",
    arguments: [
      {
        name: "other",
        description:
          "Множество или итерируемый объект, с которым вычисляется симметричная разность",
      },
    ],
    example: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Элементы, которые есть только в одном из множеств
print(a.symmetric_difference(b))   # {1, 2, 5, 6}
print(a ^ b)                        # {1, 2, 5, 6}  (через оператор)

# Симметричность: порядок не важен
print(b.symmetric_difference(a))   # {1, 2, 5, 6}  (тот же результат)

# Исходные множества не изменяются
print(a)   # {1, 2, 3, 4}

# Аргументом может быть список
print(a.symmetric_difference([2, 3, 5]))   # {1, 4, 5}

# Практический пример — изменения между двумя версиями набора:
v1 = {'login', 'register', 'dashboard', 'profile'}
v2 = {'login', 'dashboard', 'settings', 'help'}
changed = v1.symmetric_difference(v2)
print(changed)   # {'register', 'profile', 'settings', 'help'}`,
  },
  {
    name: "set.symmetric_difference_update(other)",
    description: `Обновляет множество, оставляя только элементы, присутствующие ровно в одном из двух множеств (XOR). Метод изменяет исходное множество на месте и возвращает None.

Это версия symmetric_difference() с изменением исходного объекта.

Эквивалентно оператору ^=: s ^= other.`,
    syntax: "set.symmetric_difference_update(other)",
    arguments: [
      {
        name: "other",
        description:
          "Множество или итерируемый объект, с которым вычисляется симметричная разность для обновления исходного множества",
      },
    ],
    example: `s = {1, 2, 3, 4}

s.symmetric_difference_update({3, 4, 5, 6})
print(s)   # {1, 2, 5, 6}

# Эквивалентно оператору ^=
s2 = {1, 2, 3, 4}
s2 ^= {3, 4, 5, 6}
print(s2)   # {1, 2, 5, 6}

# Аргументом может быть список
s3 = {'a', 'b', 'c'}
s3.symmetric_difference_update(['b', 'c', 'd'])
print(s3)   # {'a', 'd'}

# Двойное применение возвращает исходное состояние:
s4 = {1, 2, 3}
other = {2, 3, 4}
s4.symmetric_difference_update(other)
print(s4)   # {1, 4}
s4.symmetric_difference_update(other)
print(s4)   # {1, 2, 3}  — вернулось к исходному`,
  },
  {
    name: "set.union(*others)",
    description: `Возвращает новое множество, содержащее все элементы исходного множества и всех others. Дубликаты автоматически исключаются. Исходное множество не изменяется.

Эквивалентно оператору |: s | other1 | other2 | ...

Принимает любое количество аргументов. Каждый аргумент может быть любым итерируемым объектом.

Для изменения исходного множества на месте используйте update().`,
    syntax: "set.union(*others)",
    arguments: [
      {
        name: "*others",
        description:
          "Одно или несколько множеств или итерируемых объектов, элементы которых добавляются в результирующее множество",
      },
    ],
    example: `a = {1, 2, 3}
b = {3, 4, 5}
c = {5, 6, 7}

# Объединение двух множеств
print(a.union(b))        # {1, 2, 3, 4, 5}
print(a | b)             # {1, 2, 3, 4, 5}  (через оператор)

# Объединение трёх множеств
print(a.union(b, c))     # {1, 2, 3, 4, 5, 6, 7}

# Исходные множества не изменяются
print(a)   # {1, 2, 3}

# Аргументом может быть список
print(a.union([4, 5, 6]))   # {1, 2, 3, 4, 5, 6}

# Объединение нескольких коллекций тегов:
tags_article1 = {'python', 'tutorial'}
tags_article2 = {'python', 'oop'}
tags_article3 = {'tutorial', 'beginner'}
all_tags = tags_article1.union(tags_article2, tags_article3)
print(all_tags)   # {'python', 'tutorial', 'oop', 'beginner'}`,
  },
  {
    name: "set.update(*others)",
    description: `Добавляет в множество все элементы из others. Метод изменяет исходное множество на месте и возвращает None. Дубликаты игнорируются автоматически.

Это версия union() с изменением исходного объекта: union() создаёт новое множество, update() — обновляет текущее.

Эквивалентно оператору |=: s |= other1 | other2 | ...

Принимает любое количество аргументов. Каждый аргумент может быть любым итерируемым объектом — множеством, списком, кортежем, строкой и т.д.`,
    syntax: "set.update(*others)",
    arguments: [
      {
        name: "*others",
        description:
          "Одно или несколько множеств или итерируемых объектов, элементы которых добавляются в исходное множество",
      },
    ],
    example: `s = {1, 2, 3}

# Добавление элементов из другого множества
s.update({3, 4, 5})
print(s)   # {1, 2, 3, 4, 5}

# Эквивалентно оператору |=
s2 = {1, 2, 3}
s2 |= {4, 5}
print(s2)   # {1, 2, 3, 4, 5}

# Добавление из нескольких источников
s3 = {1, 2}
s3.update([3, 4], {5, 6}, (7, 8))
print(s3)   # {1, 2, 3, 4, 5, 6, 7, 8}

# Аргументом может быть строка (добавятся символы)
s4 = set()
s4.update('hello')
print(s4)   # {'h', 'e', 'l', 'o'}

# Накопление уникальных элементов из списка списков:
all_items = set()
batches = [[1, 2, 3], [2, 3, 4], [4, 5, 6]]
for batch in batches:
    all_items.update(batch)
print(all_items)   # {1, 2, 3, 4, 5, 6}`,
  },
  {
    name: "dict.clear()",
    description: `Удаляет все элементы из словаря. После вызова словарь становится пустым — {}. Метод изменяет словарь на месте (in-place) и возвращает None.

Важно понимать разницу между clear() и переприсваиванием переменной:
- d.clear() — очищает тот же объект в памяти, все переменные, ссылающиеся на этот словарь, тоже увидят пустой словарь
- d = {} — создаёт новый пустой словарь, старый объект остаётся нетронутым, другие ссылки на него сохраняют прежнее содержимое

Метод полезен при повторном использовании одного и того же словаря без создания нового объекта.`,
    syntax: "dict.clear()",
    arguments: [],
    example: `d = {'a': 1, 'b': 2, 'c': 3}
d.clear()
print(d)   # {}

# Разница между clear() и переприсваиванием:
d1 = {'x': 10}
d2 = d1         # d2 ссылается на тот же объект

d1.clear()
print(d2)       # {} — d2 тоже опустел, это один объект

d1 = {'x': 10}
d2 = d1
d1 = {}         # создаём новый объект, d1 теперь другой
print(d2)       # {'x': 10} — d2 по-прежнему смотрит на старый`,
  },
  {
    name: "dict.copy()",
    description: `Возвращает поверхностную (shallow) копию словаря. Создаётся новый словарь с теми же ключами и значениями, что и исходный, но сам словарь — отдельный объект.

Важно понимать что такое поверхностная копия:
- Ключи и значения-примитивы (числа, строки) копируются по значению — изменения в одном словаре не влияют на другой
- Значения-объекты (списки, словари, другие изменяемые типы) копируются по ссылке — изменение вложенного объекта затронет оба словаря

Для полного (глубокого) копирования вложенных структур используйте copy.deepcopy().

Метод dict.copy() эквивалентен dict(d) или {**d}.`,
    syntax: "dict.copy()",
    arguments: [],
    example: `original = {'a': 1, 'b': [1, 2, 3]}
copy = original.copy()

# Изменение простых значений — независимо
copy['a'] = 99
print(original['a'])   # 1  (не изменился)

# Изменение вложенного списка — затрагивает оба словаря
copy['b'].append(4)
print(original['b'])   # [1, 2, 3, 4]  (изменился!)

# Для независимой глубокой копии:
import copy
deep = copy.deepcopy(original)
deep['b'].append(99)
print(original['b'])   # [1, 2, 3, 4]  (не изменился)`,
  },
  {
    name: "dict.fromkeys(iterable[, value])",
    description: `Статический метод (classmethod), создающий новый словарь из итерируемого объекта ключей. Все ключи получают одно и то же значение — value (по умолчанию None).

Обратите внимание на важную ловушку: если в качестве value передать изменяемый объект (например, список), все ключи будут ссылаться на один и тот же объект, а не на независимые копии. Это значит, что изменение значения через один ключ затронет все остальные ключи.

Метод вызывается на классе dict или его подклассах, и возвращает экземпляр этого класса. Часто используется для инициализации словаря с известными ключами и значением по умолчанию.`,
    syntax: "dict.fromkeys(iterable, value=None)",
    arguments: [
      {
        name: "iterable",
        description:
          "Итерируемый объект, элементы которого станут ключами нового словаря. Элементы должны быть хэшируемыми",
      },
      {
        name: "value",
        description:
          "Необязательный. Значение, присваиваемое каждому ключу. По умолчанию None",
      },
    ],
    example: `keys = ['a', 'b', 'c']

# Создание словаря с None
d1 = dict.fromkeys(keys)
print(d1)   # {'a': None, 'b': None, 'c': None}

# Создание словаря с начальным значением
d2 = dict.fromkeys(keys, 0)
print(d2)   # {'a': 0, 'b': 0, 'c': 0}

# Ловушка с изменяемым значением:
d3 = dict.fromkeys(keys, [])
d3['a'].append(1)
print(d3)   # {'a': [1], 'b': [1], 'c': [1]} — все изменились!

# Правильный способ с изменяемым значением:
d4 = {k: [] for k in keys}  # каждый ключ получает новый список
d4['a'].append(1)
print(d4)   # {'a': [1], 'b': [], 'c': []}  — только 'a'`,
  },
  {
    name: "dict.get(key[, default])",
    description: `Возвращает значение по ключу key, если ключ есть в словаре. Если ключ отсутствует — возвращает default (по умолчанию None), вместо того чтобы вызывать исключение KeyError.

Это безопасная альтернатива обращению d[key], которое вызывает KeyError при отсутствии ключа.

Метод не изменяет словарь — он не добавляет ключ, если тот отсутствует (в отличие от setdefault()). Часто используется для удобного получения значений с запасным вариантом.`,
    syntax: "dict.get(key, default=None)",
    arguments: [
      { name: "key", description: "Ключ, значение которого нужно получить" },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое при отсутствии ключа. По умолчанию None",
      },
    ],
    example: `d = {'name': 'Alice', 'age': 30}

# Ключ существует — возвращает значение
print(d.get('name'))         # 'Alice'

# Ключ отсутствует — возвращает None по умолчанию
print(d.get('email'))        # None

# Ключ отсутствует — возвращает указанное значение
print(d.get('email', 'N/A')) # 'N/A'

# Словарь не изменяется
print(d)   # {'name': 'Alice', 'age': 30}

# Типичное использование — подсчёт частоты:
text = "banana"
freq = {}
for ch in text:
    freq[ch] = freq.get(ch, 0) + 1
print(freq)   # {'b': 1, 'a': 3, 'n': 2}`,
  },
  {
    name: "dict.items()",
    description: `Возвращает объект представления (view object) — dict_items — содержащий все пары (ключ, значение) словаря в виде кортежей.

Объект представления динамически отражает изменения словаря: если после вызова items() словарь изменится — добавятся или удалятся элементы — объект представления тоже обновится автоматически.

items() чаще всего используется для итерации по словарю с одновременным доступом и к ключам, и к значениям. Также может использоваться для сравнения двух словарей через операции с множествами (пересечение, разность и т.д.), так как dict_items поддерживает операции множеств, если значения хэшируемы.`,
    syntax: "dict.items()",
    arguments: [],
    example: `d = {'a': 1, 'b': 2, 'c': 3}

# Итерация по парам ключ-значение
for key, value in d.items():
    print(f"{key} -> {value}")
# a -> 1
# b -> 2
# c -> 3

# Объект динамически отражает изменения
items = d.items()
d['d'] = 4
print(items)   # dict_items([('a', 1), ('b', 2), ('c', 3), ('d', 4)])

# Поиск ключей с определённым значением
d2 = {'x': 1, 'y': 2, 'z': 1}
keys_with_1 = [k for k, v in d2.items() if v == 1]
print(keys_with_1)   # ['x', 'z']

# Конвертация в список кортежей
print(list(d.items()))  # [('a', 1), ('b', 2), ('c', 3), ('d', 4)]`,
  },
  {
    name: "dict.keys()",
    description: `Возвращает объект представления (view object) — dict_keys — содержащий все ключи словаря.

Как и dict_items, объект dict_keys динамически отражает изменения словаря: при добавлении или удалении ключей представление обновляется автоматически без повторного вызова keys().

Объект dict_keys поддерживает операции над множествами: пересечение (&), объединение (|), разность (-), симметричная разность (^). Это позволяет удобно сравнивать ключи двух словарей.

На практике итерация for k in d и for k in d.keys() — эквивалентны, но явный вызов keys() делает код более читаемым.`,
    syntax: "dict.keys()",
    arguments: [],
    example: `d = {'name': 'Alice', 'age': 30, 'city': 'Moscow'}

# Получение ключей
print(d.keys())   # dict_keys(['name', 'age', 'city'])

# Итерация по ключам
for key in d.keys():
    print(key)

# Проверка наличия ключа (лучше делать через 'in' напрямую)
print('age' in d.keys())   # True

# Операции над множествами
d1 = {'a': 1, 'b': 2, 'c': 3}
d2 = {'b': 20, 'c': 30, 'd': 40}

common = d1.keys() & d2.keys()    # {'b', 'c'}
all_keys = d1.keys() | d2.keys()  # {'a', 'b', 'c', 'd'}
only_d1 = d1.keys() - d2.keys()   # {'a'}
print(common, all_keys, only_d1)

# Динамическое обновление
keys = d.keys()
d['country'] = 'Russia'
print(keys)   # dict_keys(['name', 'age', 'city', 'country'])`,
  },
  {
    name: "dict.pop(key[, default])",
    description: `Удаляет ключ из словаря и возвращает его значение. Если ключ отсутствует и default не указан — возникает KeyError. Если default указан и ключ отсутствует — возвращает default без ошибки.

Метод изменяет словарь на месте. Это основной способ одновременно извлечь значение и удалить запись из словаря.

Отличие от del d[key]: del не возвращает значение. Отличие от get(): get() не удаляет ключ.`,
    syntax: "dict.pop(key, default)",
    arguments: [
      { name: "key", description: "Ключ, который нужно удалить из словаря" },
      {
        name: "default",
        description:
          "Необязательный. Значение, возвращаемое если ключ не найден. Если не указан и ключ отсутствует — вызывается KeyError",
      },
    ],
    example: `d = {'a': 1, 'b': 2, 'c': 3}

# Удаление существующего ключа
val = d.pop('b')
print(val)   # 2
print(d)     # {'a': 1, 'c': 3}

# Удаление несуществующего ключа с default
val = d.pop('z', 0)
print(val)   # 0  (не KeyError)
print(d)     # {'a': 1, 'c': 3}  (словарь не изменился)

# Без default — KeyError при отсутствии ключа
# d.pop('z')  # KeyError: 'z'

# Типичный шаблон — извлечение и обработка:
tasks = {'email': 'send report', 'call': 'client', 'meeting': 'at 15:00'}
task = tasks.pop('email', None)
if task:
    print(f"Выполняю: {task}")   # Выполняю: send report
print(tasks)  # {'call': 'client', 'meeting': 'at 15:00'}`,
  },
  {
    name: "dict.popitem()",
    description: `Удаляет и возвращает последнюю добавленную пару (ключ, значение) в виде кортежа. Словари в Python 3.7+ сохраняют порядок вставки, поэтому popitem() всегда удаляет последний вставленный элемент (LIFO — последним вошёл, первым вышел).

Если словарь пуст — вызывается KeyError.

До Python 3.7 порядок словарей не гарантировался, и popitem() возвращал произвольную пару. Сейчас поведение строго определено.

Метод полезен для итеративного опустошения словаря или для реализации алгоритмов, которым нужно извлекать элементы один за одним.`,
    syntax: "dict.popitem()",
    arguments: [],
    example: `d = {'a': 1, 'b': 2, 'c': 3}

# Удаляет последний добавленный элемент
item = d.popitem()
print(item)   # ('c', 3)
print(d)      # {'a': 1, 'b': 2}

item = d.popitem()
print(item)   # ('b', 2)
print(d)      # {'a': 1}

# KeyError на пустом словаре
empty = {}
# empty.popitem()   # KeyError: 'popitem(): dictionary is empty'

# Итеративное опустошение словаря
data = {'x': 10, 'y': 20, 'z': 30}
while data:
    key, value = data.popitem()
    print(f"Обработан: {key} = {value}")
# Обработан: z = 30
# Обработан: y = 20
# Обработан: x = 10`,
  },
  {
    name: "dict.setdefault(key[, default])",
    description: `Если ключ key есть в словаре — возвращает его значение. Если ключа нет — вставляет его со значением default и возвращает default. Значение default по умолчанию равно None.

Ключевое отличие от get(): setdefault() не только возвращает значение по умолчанию, но и добавляет ключ в словарь, если его нет. get() словарь не изменяет.

Метод особенно удобен для инициализации значений при первом обращении к ключу — например, при группировке данных или подсчёте частот с изменяемыми значениями по умолчанию (списками, множествами и т.д.).`,
    syntax: "dict.setdefault(key, default=None)",
    arguments: [
      {
        name: "key",
        description: "Ключ, значение которого нужно получить или установить",
      },
      {
        name: "default",
        description:
          "Необязательный. Значение, которое будет вставлено и возвращено, если ключ отсутствует. По умолчанию None",
      },
    ],
    example: `d = {'a': 1, 'b': 2}

# Ключ существует — возвращает значение, словарь не изменяется
val = d.setdefault('a', 99)
print(val)   # 1
print(d)     # {'a': 1, 'b': 2}

# Ключ отсутствует — добавляет и возвращает default
val = d.setdefault('c', 0)
print(val)   # 0
print(d)     # {'a': 1, 'b': 2, 'c': 0}

# Классический пример — группировка по категории:
students = [
    ('math', 'Alice'),
    ('physics', 'Bob'),
    ('math', 'Charlie'),
    ('physics', 'Diana'),
]
groups = {}
for subject, name in students:
    groups.setdefault(subject, []).append(name)
print(groups)
# {'math': ['Alice', 'Charlie'], 'physics': ['Bob', 'Diana']}`,
  },
  {
    name: "dict.update([other])",
    description: `Обновляет словарь данными из другого словаря, маппинга или итерируемого объекта пар ключ-значение. Также принимает именованные аргументы.

Если ключ уже существует — его значение перезаписывается. Если ключ новый — он добавляется. Метод изменяет словарь на месте и возвращает None.

Начиная с Python 3.9, для объединения словарей можно использовать операторы | (создаёт новый словарь) и |= (обновляет на месте), которые являются более лаконичными альтернативами update().`,
    syntax: "dict.update([other], **kwargs)",
    arguments: [
      {
        name: "other",
        description:
          "Необязательный. Другой словарь, маппинг или итерируемый объект пар (ключ, значение), из которого берутся новые данные",
      },
      {
        name: "**kwargs",
        description:
          "Необязательные именованные аргументы, добавляемые или обновляемые в словаре",
      },
    ],
    example: `d = {'a': 1, 'b': 2}

# Обновление из другого словаря
d.update({'b': 20, 'c': 3})
print(d)   # {'a': 1, 'b': 20, 'c': 3}

# Обновление через именованные аргументы
d.update(d=4, e=5)
print(d)   # {'a': 1, 'b': 20, 'c': 3, 'd': 4, 'e': 5}

# Обновление из списка кортежей
d.update([('f', 6), ('g', 7)])
print(d)   # {..., 'f': 6, 'g': 7}

# Аналог через оператор |= (Python 3.9+)
d1 = {'x': 1}
d2 = {'y': 2}
d1 |= d2
print(d1)   # {'x': 1, 'y': 2}

# Создание нового словаря через | (не изменяет оригиналы)
merged = d1 | {'z': 3}
print(merged)   # {'x': 1, 'y': 2, 'z': 3}`,
  },
  {
    name: "dict.values()",
    description: `Возвращает объект представления (view object) — dict_values — содержащий все значения словаря.

Как и другие представления (keys(), items()), объект dict_values динамически отражает изменения словаря: при изменении значений или добавлении/удалении ключей представление обновляется автоматически.

В отличие от dict_keys, объект dict_values не поддерживает операции над множествами, поскольку значения не обязаны быть уникальными и хэшируемыми.

Метод используется когда нужно работать только со значениями словаря: для подсчёта сумм, фильтрации, поиска минимума/максимума и т.д.`,
    syntax: "dict.values()",
    arguments: [],
    example: `d = {'a': 10, 'b': 20, 'c': 30}

# Получение значений
print(d.values())   # dict_values([10, 20, 30])

# Итерация по значениям
for v in d.values():
    print(v)   # 10, 20, 30

# Агрегация
total = sum(d.values())
print(total)   # 60

maximum = max(d.values())
print(maximum)   # 30

# Проверка наличия значения
print(20 in d.values())   # True

# Динамическое обновление
vals = d.values()
d['d'] = 40
print(vals)   # dict_values([10, 20, 30, 40])

# Подсчёт дубликатов значений
inventory = {'apple': 5, 'banana': 3, 'cherry': 5}
from collections import Counter
print(Counter(inventory.values()))   # Counter({5: 2, 3: 1})`,
  },

  {
    name: "tuple.count(x)",
    description: `Возвращает количество вхождений значения x в кортеже. Подсчёт ведётся по всему кортежу, включая вложенные позиции (но не рекурсивно — вложенные кортежи считаются как один элемент).

Сравнение выполняется по значению (==), а не по идентичности объектов. Если элемент не найден — возвращает 0, ошибки не возникает.

Метод не изменяет кортеж (кортеж неизменяем). Аналогичный метод есть и у списков.`,
    syntax: "tuple.count(x)",
    arguments: [
      {
        name: "x",
        description: "Значение, количество вхождений которого нужно подсчитать",
      },
    ],
    example: `t = (1, 2, 3, 2, 4, 2, 5)

# Подсчёт вхождений числа 2
print(t.count(2))   # 3

# Элемент не найден — возвращает 0
print(t.count(99))  # 0

# Строковый кортеж
words = ('apple', 'banana', 'apple', 'cherry', 'apple')
print(words.count('apple'))    # 3
print(words.count('banana'))   # 1

# Вложенные кортежи считаются как один элемент
nested = (1, (2, 3), (2, 3), 4)
print(nested.count((2, 3)))   # 2
print(nested.count(2))        # 0  — 2 внутри вложенного, не верхний уровень`,
  },
  {
    name: "tuple.index(x[, start[, end]])",
    description: `Возвращает индекс первого вхождения значения x в кортеже. Если элемент не найден — вызывает ValueError.

Поиск можно ограничить диапазоном [start, end) — аналогично срезу t[start:end]. Если start и end не указаны — поиск ведётся по всему кортежу.

Метод возвращает индекс первого найденного вхождения и прекращает поиск. Для нахождения всех индексов нужно использовать цикл или генератор.

Аналогичный метод есть и у списков (list.index()).`,
    syntax: "tuple.index(x, start=0, end=len(tuple))",
    arguments: [
      {
        name: "x",
        description: "Значение, индекс первого вхождения которого нужно найти",
      },
      {
        name: "start",
        description:
          "Необязательный. Начальный индекс диапазона поиска (включительно). По умолчанию 0",
      },
      {
        name: "end",
        description:
          "Необязательный. Конечный индекс диапазона поиска (не включается). По умолчанию конец кортежа",
      },
    ],
    example: `t = (10, 20, 30, 20, 40, 20)

# Первое вхождение значения 20
print(t.index(20))      # 1

# Поиск начиная с позиции 2
print(t.index(20, 2))   # 3

# Поиск в диапазоне [4, 6)
print(t.index(20, 4))   # 5

# ValueError если элемент не найден
try:
    t.index(99)
except ValueError as e:
    print(e)   # tuple.index(x): x not in tuple

# Поиск всех индексов вхождения:
t2 = (1, 2, 3, 2, 4, 2)
all_indices = [i for i, v in enumerate(t2) if v == 2]
print(all_indices)   # [1, 3, 5]`,
  },

  {
    name: "file.close()",
    description: `Закрывает файл. После вызова любые операции чтения или записи вызовут ValueError. Если файл уже закрыт — повторный вызов close() не вызывает ошибки.

При закрытии файл автоматически сбрасывается (flush) — незаписанные буферизованные данные записываются на диск.

Рекомендуемый способ работы с файлами — использование менеджера контекста with, который автоматически вызывает close() при выходе из блока, даже если возникло исключение. Явный вызов close() необходим только при нестандартном управлении жизненным циклом файла.`,
    syntax: "file.close()",
    arguments: [],
    example: `# Явное открытие и закрытие
f = open('example.txt', 'w')
f.write('Hello')
f.close()   # файл закрыт, данные сброшены на диск

# После закрытия — ValueError
# f.write('more')   # ValueError: I/O operation on closed file

# Проверка, закрыт ли файл
print(f.closed)   # True

# Рекомендуемый способ — with (close() вызывается автоматически):
with open('example.txt', 'r') as f:
    data = f.read()
# здесь файл уже закрыт
print(f.closed)   # True`,
  },
  {
    name: "file.detach()",
    description: `Разделяет базовый бинарный буфер от BufferedIOBase или базовый поток от TextIOWrapper и возвращает его. После вызова файловый объект становится непригодным для использования — последующие операции вызовут ValueError.

Метод применяется при работе с двухуровневыми объектами ввода-вывода, когда нужно получить доступ к нижележащему потоку (например, к сырому байтовому потоку из текстового обёртки) и продолжить работу с ним независимо.

Доступен у TextIOWrapper и BufferedIOBase (и их подклассов). У RawIOBase метода detach() нет.`,
    syntax: "file.detach()",
    arguments: [],
    example: `import io

# Создаём текстовую обёртку над байтовым буфером
raw = io.BytesIO(b'Hello, World!')
text_wrapper = io.TextIOWrapper(raw, encoding='utf-8')

print(text_wrapper.read(5))   # 'Hello'

# Отсоединяем базовый поток
underlying = text_wrapper.detach()

# text_wrapper теперь непригоден
# text_wrapper.read()   # ValueError

# Работаем напрямую с байтовым потоком
print(underlying.read())   # b', World!'

# Другой пример — с буферизованным файлом:
with open('example.txt', 'rb') as bf:
    raw_stream = bf.detach()
    # bf теперь непригоден, raw_stream — сырой поток`,
  },
  {
    name: "file.fileno()",
    description: `Возвращает целочисленный файловый дескриптор (file descriptor) операционной системы для данного файла. Файловый дескриптор — это небольшое целое число, используемое ОС для идентификации открытого файла.

Метод полезен при работе с низкоуровневыми системными вызовами (через модуль os или fcntl), которые принимают файловый дескриптор, а не объект файла Python.

Если файловый объект не использует настоящий файловый дескриптор ОС (например, io.StringIO или io.BytesIO) — вызывается UnsupportedOperation.`,
    syntax: "file.fileno()",
    arguments: [],
    example: `import os

# Получение файлового дескриптора
with open('example.txt', 'r') as f:
    fd = f.fileno()
    print(fd)   # целое число, например 3 или 4

    # Можно использовать с модулем os
    stat = os.fstat(fd)
    print(stat.st_size)   # размер файла в байтах

# Стандартные потоки тоже имеют дескрипторы
import sys
print(sys.stdin.fileno())    # 0
print(sys.stdout.fileno())   # 1
print(sys.stderr.fileno())   # 2

# io.StringIO не имеет реального дескриптора
import io
s = io.StringIO("hello")
# s.fileno()   # UnsupportedOperation: fileno`,
  },
  {
    name: "file.flush()",
    description: `Принудительно сбрасывает внутренний буфер записи на диск (или в нижележащий поток). Обычно операция записи (write()) помещает данные во внутренний буфер — flush() заставляет немедленно передать их в ОС.

Важно понимать разницу уровней:
- flush() передаёт данные от Python-буфера к буферу ОС, но не гарантирует физическую запись на диск
- Для гарантированной записи на физический диск используйте os.fsync(f.fileno())

Метод полезен при логировании, при передаче данных в реальном времени в другой процесс или при записи в интерактивный терминал. При закрытии файла (close()) flush() вызывается автоматически.`,
    syntax: "file.flush()",
    arguments: [],
    example: `import sys
import time

# Вывод в реальном времени без буферизации
for i in range(5):
    print(f"Шаг {i}...", end='', flush=True)
    # или явно:
    sys.stdout.flush()
    time.sleep(0.5)

# Запись в файл с немедленной передачей ОС
with open('log.txt', 'w') as f:
    f.write('Начало операции\n')
    f.flush()   # другие процессы увидят эту строку сразу

    f.write('Конец операции\n')
    # close() вызовет flush() автоматически

# Гарантированная физическая запись на диск:
import os
with open('important.txt', 'w') as f:
    f.write('критические данные')
    f.flush()
    os.fsync(f.fileno())   # синхронизация с диском`,
  },
  {
    name: "file.isatty()",
    description: `Возвращает True, если файловый поток подключён к интерактивному устройству (терминалу/TTY). Иначе возвращает False.

Используется для определения того, работает ли программа в интерактивном режиме (пользователь вводит данные с клавиатуры) или выходные данные перенаправлены в файл или другой процесс (например, через пайп).

Типичные применения: отключение прогресс-баров или цветного вывода при перенаправлении вывода, адаптация поведения программы в зависимости от контекста запуска.`,
    syntax: "file.isatty()",
    arguments: [],
    example: `import sys

# Проверка стандартного вывода
if sys.stdout.isatty():
    print("Вывод идёт в терминал — можно использовать цвета и анимации")
else:
    print("Вывод перенаправлен — используем простой текст")

# Проверка стандартного ввода
if sys.stdin.isatty():
    name = input("Введите имя: ")
else:
    name = sys.stdin.readline().strip()

# Для обычных файлов — всегда False:
with open('data.txt', 'r') as f:
    print(f.isatty())   # False

# Условное включение цветного вывода:
RED = '\\033[91m' if sys.stderr.isatty() else ''
RESET = '\\033[0m' if sys.stderr.isatty() else ''
print(f"{RED}Ошибка!{RESET}", file=sys.stderr)`,
  },
  {
    name: "file.read([size])",
    description: `Читает и возвращает данные из файла. Если size не указан или равен -1 — читает весь файл до конца. Если size указан — читает не более size символов (для текстового режима) или байт (для бинарного).

Если достигнут конец файла — возвращает пустую строку '' (текстовый режим) или пустые байты b'' (бинарный режим).

После чтения позиция в файле смещается на количество прочитанных символов/байт. Повторный вызов read() продолжит чтение с текущей позиции.`,
    syntax: "file.read(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Необязательный. Максимальное количество символов (текст) или байт (бинарный режим) для чтения. При -1 или отсутствии — читает до конца файла",
      },
    ],
    example: `# Чтение всего файла
with open('example.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    print(content)

# Чтение по частям
with open('large_file.txt', 'r') as f:
    while True:
        chunk = f.read(1024)   # читаем 1024 символа
        if not chunk:
            break
        process(chunk)

# Бинарный режим — возвращает bytes
with open('image.png', 'rb') as f:
    header = f.read(8)   # первые 8 байт
    print(header)        # b'\x89PNG\r\n\x1a\n'

# Конец файла — возвращает пустую строку
with open('short.txt', 'r') as f:
    print(repr(f.read()))    # 'содержимое файла'
    print(repr(f.read()))    # ''  — конец файла`,
  },
  {
    name: "file.readable()",
    description: `Возвращает True, если файл открыт для чтения и допускает вызов read(). Иначе возвращает False.

Метод полезен перед вызовом read(), readline() или readlines(), когда неизвестно, в каком режиме был открыт файл — особенно в функциях, принимающих произвольный файловый объект в качестве аргумента.

Файл, открытый только для записи ('w', 'a'), не является читаемым. Файл, открытый для чтения ('r', 'rb', 'r+') — является.`,
    syntax: "file.readable()",
    arguments: [],
    example: `# Файл открыт для чтения — True
with open('example.txt', 'r') as f:
    print(f.readable())   # True
    data = f.read()

# Файл открыт для записи — False
with open('output.txt', 'w') as f:
    print(f.readable())   # False

# Режим 'r+' — и чтение, и запись
with open('example.txt', 'r+') as f:
    print(f.readable())    # True
    print(f.writable())    # True

# Полезно в универсальных функциях:
def safe_read(stream):
    if stream.readable():
        return stream.read()
    raise IOError("Поток не поддерживает чтение")

import io
buf = io.StringIO("данные")
print(safe_read(buf))   # данные`,
  },
  {
    name: "file.readline([size])",
    description: `Читает и возвращает одну строку из файла, включая завершающий символ новой строки \\n (если он есть). При достижении конца файла возвращает пустую строку ''.

Если size указан — читает не более size символов из текущей строки.

Метод удобен для построчного чтения больших файлов без загрузки всего содержимого в память. Для итерации по строкам предпочтительнее использовать цикл for line in file, который внутри использует readline().`,
    syntax: "file.readline(size=-1)",
    arguments: [
      {
        name: "size",
        description:
          "Необязательный. Максимальное количество символов для чтения из текущей строки. По умолчанию -1 — читает всю строку",
      },
    ],
    example: `# Чтение строк одна за другой
with open('example.txt', 'r') as f:
    line1 = f.readline()
    print(repr(line1))   # 'Первая строка\n'

    line2 = f.readline()
    print(repr(line2))   # 'Вторая строка\n'

# Чтение до конца файла
with open('data.txt', 'r') as f:
    while True:
        line = f.readline()
        if not line:   # пустая строка = конец файла
            break
        print(line.strip())

# Ограничение по размеру
with open('data.txt', 'r') as f:
    partial = f.readline(10)   # не более 10 символов
    print(repr(partial))

# Предпочтительный способ для построчного чтения:
with open('data.txt', 'r') as f:
    for line in f:   # использует readline() внутри
        print(line.strip())`,
  },
  {
    name: "file.readlines([hint])",
    description: `Читает все строки файла и возвращает их в виде списка строк. Каждая строка включает завершающий символ \\n (кроме, возможно, последней).

Если hint указан — метод читает приблизительно hint байт и возвращает строки, уместившиеся в этот объём. Это позволяет ограничить объём читаемых данных при работе с большими файлами.

Для большинства случаев чтения файла строка за строкой предпочтительнее использовать цикл for line in file — он более экономен по памяти, так как не загружает весь файл сразу.`,
    syntax: "file.readlines(hint=-1)",
    arguments: [
      {
        name: "hint",
        description:
          "Необязательный. Приблизительное ограничение в байтах на объём читаемых данных. По умолчанию -1 — читает весь файл",
      },
    ],
    example: `# Чтение всех строк в список
with open('example.txt', 'r') as f:
    lines = f.readlines()
    print(lines)   # ['строка 1\n', 'строка 2\n', 'строка 3']

# Удаление символов новой строки
with open('example.txt', 'r') as f:
    lines = [line.strip() for line in f.readlines()]

# С ограничением hint (приблизительно 50 байт)
with open('large.txt', 'r') as f:
    batch = f.readlines(50)
    print(batch)   # строки, суммарным объёмом ≈ 50 байт

# Более эффективная альтернатива для больших файлов:
with open('large.txt', 'r') as f:
    for line in f:   # не загружает весь файл в память
        process(line)

# Запись списка строк обратно в файл:
with open('output.txt', 'w') as f:
    f.writelines(lines)   # list → файл`,
  },
  {
    name: "file.seek(offset[, whence])",
    description: `Устанавливает текущую позицию в файле. Возвращает новую абсолютную позицию (количество байт от начала файла).

Аргумент whence определяет точку отсчёта:
- 0 (SEEK_SET) — от начала файла (по умолчанию). offset должен быть ≥ 0
- 1 (SEEK_CUR) — от текущей позиции. offset может быть отрицательным
- 2 (SEEK_END) — от конца файла. offset обычно отрицательный или 0

В текстовом режиме допускается только seek(0) (в начало) и позиции, полученные через tell(). В бинарном режиме можно использовать произвольные значения.

Работает в паре с tell(), которая возвращает текущую позицию.`,
    syntax: "file.seek(offset, whence=0)",
    arguments: [
      {
        name: "offset",
        description: "Смещение в байтах относительно точки отсчёта whence",
      },
      {
        name: "whence",
        description:
          "Необязательный. Точка отсчёта: 0 — начало файла (по умолчанию), 1 — текущая позиция, 2 — конец файла",
      },
    ],
    example: `with open('example.bin', 'wb') as f:
    f.write(b'Hello, World!')

with open('example.bin', 'rb') as f:
    # Переход к началу файла
    f.seek(0)
    print(f.read(5))    # b'Hello'

    # Переход к позиции 7 от начала
    f.seek(7)
    print(f.read(5))    # b'World'

    # Переход на 3 байта назад от текущей позиции
    f.seek(-3, 1)
    print(f.read(3))    # b'rld'

    # Переход к последним 6 байтам (от конца)
    f.seek(-6, 2)
    print(f.read())     # b'orld!'

    # Получение текущей позиции
    f.seek(0)
    f.read(5)
    print(f.tell())     # 5`,
  },
  {
    name: "file.seekable()",
    description: `Возвращает True, если файловый поток поддерживает произвольный доступ (random access) — то есть операции seek() и tell(). Иначе возвращает False.

Не все файловые объекты поддерживают позиционирование: сокеты, каналы (pipes), stdin/stdout в некоторых режимах — не поддерживают. Обычные файлы на диске всегда поддерживают seek.

Метод используется для безопасной проверки перед вызовом seek() или tell(), особенно в коде, который работает с произвольными потоками.`,
    syntax: "file.seekable()",
    arguments: [],
    example: `# Обычный файл — всегда seekable
with open('example.txt', 'r') as f:
    print(f.seekable())   # True
    f.seek(0)

# io.BytesIO — также seekable
import io
buf = io.BytesIO(b'Hello')
print(buf.seekable())   # True
buf.seek(3)
print(buf.read())       # b'lo'

# io.StringIO — тоже seekable
s = io.StringIO("text")
print(s.seekable())   # True

# Stdin — как правило, НЕ seekable при перенаправлении
import sys
print(sys.stdin.seekable())   # обычно False

# Безопасная работа с потоком:
def rewind(stream):
    if stream.seekable():
        stream.seek(0)
    else:
        raise IOError("Поток не поддерживает позиционирование")`,
  },
  {
    name: "file.tell()",
    description: `Возвращает текущую позицию в файле — количество байт (в бинарном режиме) или непрозрачное целое число (в текстовом режиме), представляющее позицию.

Возвращённое значение можно передать в seek() для возврата к этой позиции позже. В текстовом режиме значение, возвращённое tell(), не обязательно совпадает с числом символов от начала файла — оно зависит от кодировки и платформы, поэтому использовать его как смещение напрямую не следует.

Работает в паре с seek() для запоминания и восстановления позиции в файле.`,
    syntax: "file.tell()",
    arguments: [],
    example: `with open('example.txt', 'r', encoding='utf-8') as f:
    print(f.tell())    # 0 — начало файла

    f.read(5)
    pos = f.tell()
    print(pos)         # позиция после 5 символов

    f.read(10)
    print(f.tell())    # позиция сдвинулась дальше

    # Возврат к сохранённой позиции
    f.seek(pos)
    print(f.read(10))  # читаем снова с той же позиции

# Бинарный режим — позиция = количество байт
with open('data.bin', 'rb') as f:
    f.read(8)
    print(f.tell())   # 8

# Сохранение и восстановление позиции:
with open('data.txt', 'r') as f:
    saved = f.tell()
    preview = f.read(100)
    f.seek(saved)   # вернулись назад
    full = f.read()`,
  },
  {
    name: "file.truncate([size])",
    description: `Усекает (обрезает) файл до указанного размера в байтах. Возвращает новый размер файла.

Если size не указан — файл усекается до текущей позиции (tell()). Если size больше текущего размера файла — поведение зависит от платформы: файл может быть расширен нулевыми байтами или оставлен без изменений.

Позиция в файле после вызова truncate() не изменяется — seek() нужно вызывать явно, если требуется работать с изменённым содержимым.

Файл должен быть открыт для записи.`,
    syntax: "file.truncate(size=None)",
    arguments: [
      {
        name: "size",
        description:
          "Необязательный. Новый размер файла в байтах. Если не указан — усекает до текущей позиции (tell())",
      },
    ],
    example: `# Создаём файл с содержимым
with open('data.txt', 'w') as f:
    f.write('Hello, World!')   # 13 символов

# Усечение до 5 байт
with open('data.txt', 'r+') as f:
    f.truncate(5)
    f.seek(0)
    print(f.read())   # 'Hello'

# Усечение до текущей позиции
with open('log.txt', 'r+') as f:
    f.seek(10)
    f.truncate()   # обрезаем всё после позиции 10
    f.seek(0)
    print(f.read())

# Пример: очистка файла без удаления
with open('cache.txt', 'w') as f:  # 'w' автоматически обнуляет
    pass

# Или через r+:
with open('cache.txt', 'r+') as f:
    f.seek(0)
    f.truncate(0)   # файл пуст`,
  },
  {
    name: "file.writable()",
    description: `Возвращает True, если файл открыт для записи и допускает вызов write(). Иначе возвращает False.

Метод полезен в функциях, принимающих произвольный файловый объект, для проверки перед записью — аналогично readable() для чтения.

Файл, открытый в режиме 'r', не является записываемым. Файлы в режимах 'w', 'a', 'x', 'r+', 'w+', 'a+' — записываемые.`,
    syntax: "file.writable()",
    arguments: [],
    example: `# Режим 'w' — записываемый
with open('output.txt', 'w') as f:
    print(f.writable())   # True

# Режим 'r' — только чтение
with open('output.txt', 'r') as f:
    print(f.writable())   # False

# Режим 'r+' — и чтение, и запись
with open('output.txt', 'r+') as f:
    print(f.readable())   # True
    print(f.writable())   # True

# Режим 'a' — запись в конец (append)
with open('log.txt', 'a') as f:
    print(f.writable())   # True

# Универсальная функция записи с проверкой:
def safe_write(stream, data):
    if stream.writable():
        stream.write(data)
    else:
        raise IOError("Поток не поддерживает запись")

import io
buf = io.StringIO()
safe_write(buf, "данные")
print(buf.getvalue())   # данные`,
  },
  {
    name: "file.write(s)",
    description: `Записывает строку s (в текстовом режиме) или байты s (в бинарном режиме) в файл. Возвращает количество записанных символов (текст) или байт (бинарный режим).

Запись обычно буферизована — данные могут не сразу попасть на диск. Для немедленной передачи буфера используйте flush(), для гарантированной записи на диск — os.fsync().

Метод записывает ровно переданные данные — символы новой строки \\n не добавляются автоматически. Для записи нескольких строк используйте writelines() или добавляйте \\n вручную.`,
    syntax: "file.write(s)",
    arguments: [
      {
        name: "s",
        description:
          "Строка (в текстовом режиме) или объект bytes/bytearray (в бинарном режиме), которую нужно записать",
      },
    ],
    example: `# Запись строки в текстовый файл
with open('output.txt', 'w', encoding='utf-8') as f:
    n = f.write('Hello, World!\n')
    print(n)   # 14 — количество символов

    f.write('Вторая строка\n')

# Запись байт в бинарный файл
with open('data.bin', 'wb') as f:
    n = f.write(b'\x89PNG\r\n\x1a\n')
    print(n)   # 8

# Запись нескольких строк
lines = ['строка 1\n', 'строка 2\n', 'строка 3\n']
with open('lines.txt', 'w') as f:
    for line in lines:
        f.write(line)

# Буферизация — данные могут не попасть на диск сразу:
with open('buffered.txt', 'w') as f:
    f.write('данные')
    # здесь данные ещё могут быть в буфере
    f.flush()   # принудительный сброс буфера`,
  },
  {
    name: "file.writelines(lines)",
    description: `Записывает в файл список (или любой итерируемый объект) строк. Символы новой строки не добавляются автоматически — каждая строка в списке должна содержать \\n, если перенос строки нужен.

Метод не возвращает значение (None). Это эквивалентно вызову write() для каждого элемента итерируемого объекта в цикле, но может быть немного эффективнее за счёт меньшего количества системных вызовов.

Принимает любой итерируемый объект строк (список, генератор, кортеж и т.д.).`,
    syntax: "file.writelines(lines)",
    arguments: [
      {
        name: "lines",
        description:
          "Итерируемый объект строк (текстовый режим) или объектов bytes (бинарный режим). Символы новой строки не добавляются автоматически",
      },
    ],
    example: `# Запись списка строк
lines = ['первая строка\n', 'вторая строка\n', 'третья строка\n']
with open('output.txt', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Без \n строки сольются в одну:
with open('merged.txt', 'w') as f:
    f.writelines(['abc', 'def', 'ghi'])
    # результат: 'abcdefghi' (без переносов)

# С генератором строк (экономит память):
with open('numbers.txt', 'w') as f:
    f.writelines(f"{i}\n" for i in range(1, 101))

# Roundtrip: прочитали → изменили → записали
with open('data.txt', 'r') as f:
    lines = f.readlines()

modified = [line.upper() for line in lines]

with open('data.txt', 'w') as f:
    f.writelines(modified)

# Бинарный режим — список bytes:
with open('binary.bin', 'wb') as f:
    f.writelines([b'\\x00\\x01', b'\\x02\\x03'])`,
  },

  {
    name: "int.bit_count()",
    description: `Возвращает количество единичных битов (1) в двоичном представлении целого числа. Иначе говоря, это число бит, равных 1, — так называемое «население» числа (popcount или Hamming weight).

Метод работает с абсолютным значением числа, поэтому отрицательные числа дают тот же результат, что и их абсолютные значения: (-n).bit_count() == n.bit_count().

Метод добавлен в Python 3.10. До этой версии аналогичный результат можно получить через bin(n).count('1').

Используется в алгоритмах на битах, в задачах оптимизации, при работе с булевыми масками и флагами.`,
    syntax: "int.bit_count()",
    arguments: [],
    example: `# Количество единичных битов
print((0).bit_count())    # 0   →  0b0
print((1).bit_count())    # 1   →  0b1
print((7).bit_count())    # 3   →  0b111
print((10).bit_count())   # 2   →  0b1010
print((255).bit_count())  # 8   →  0b11111111

# Отрицательные числа — по модулю
print((-10).bit_count())  # 2  (то же, что и 10)

# До Python 3.10 — через bin():
n = 42
print(bin(n).count('1'))  # 3   →  0b101010

# Пример: подсчёт установленных прав доступа (битовые флаги)
READ    = 0b001  # 1
WRITE   = 0b010  # 2
EXECUTE = 0b100  # 4

permissions = READ | WRITE   # 0b011
print(permissions.bit_count())   # 2 — два права установлено`,
  },
  {
    name: "int.bit_length()",
    description: `Возвращает количество битов, необходимых для представления числа в двоичном виде, не считая знак и ведущие нули. Для нуля возвращает 0.

Другими словами, это позиция старшего значимого бита (MSB). Для числа n выполняется: 2**(n.bit_length() - 1) <= n < 2**n.bit_length() (при n > 0).

Для отрицательных чисел возвращает то же значение, что и для abs(n): (-n).bit_length() == n.bit_length().

Метод полезен при вычислении минимального числа байт для хранения числа, в криптографических алгоритмах, при работе с протоколами передачи данных.`,
    syntax: "int.bit_length()",
    arguments: [],
    example: `print((0).bit_length())     # 0
print((1).bit_length())     # 1   →  0b1
print((2).bit_length())     # 2   →  0b10
print((7).bit_length())     # 3   →  0b111
print((8).bit_length())     # 4   →  0b1000
print((255).bit_length())   # 8   →  0b11111111
print((256).bit_length())   # 9   →  0b100000000

# Отрицательные — то же, что abs()
print((-10).bit_length())   # 4  (то же, что 10)

# Минимальное число байт для хранения числа
n = 1000
bytes_needed = (n.bit_length() + 7) // 8
print(bytes_needed)   # 2

# Быстрое вычисление floor(log2(n)) для n > 0:
n = 100
log2_floor = n.bit_length() - 1
print(log2_floor)   # 6  (т.к. 2^6 = 64 <= 100 < 128 = 2^7)`,
  },
  {
    name: "int.to_bytes(length, byteorder, *, signed=False)",
    description: `Возвращает представление целого числа в виде массива байт (объект bytes) заданной длины.

Аргумент byteorder определяет порядок байт:
- 'big' — старший байт первый (big-endian, сетевой порядок)
- 'little' — младший байт первый (little-endian, порядок x86)

Аргумент signed определяет, используется ли дополнение до двух для представления отрицательных чисел:
- False (по умолчанию) — только неотрицательные числа; отрицательное число вызовет OverflowError
- True — поддерживаются отрицательные числа через дополнение до двух

Если число не помещается в length байт — вызывается OverflowError.

Обратная операция — int.from_bytes().`,
    syntax: "int.to_bytes(length, byteorder, *, signed=False)",
    arguments: [
      {
        name: "length",
        description:
          "Количество байт в результирующем объекте bytes. Число должно помещаться в это количество байт",
      },
      {
        name: "byteorder",
        description:
          'Порядок байт: "big" (старший байт первый) или "little" (младший байт первый)',
      },
      {
        name: "signed",
        description:
          "Необязательный. Если True — поддерживает отрицательные числа через дополнение до двух. По умолчанию False",
      },
    ],
    example: `# Число 1000 в 2 байтах, big-endian
print((1000).to_bytes(2, 'big'))      # b'\\x03\\xe8'
print((1000).to_bytes(2, 'little'))   # b'\\xe8\\x03'

# Число 0 — нулевые байты
print((0).to_bytes(4, 'big'))         # b'\\x00\\x00\\x00\\x00'

# Отрицательные числа — нужен signed=True
print((-1).to_bytes(2, 'big', signed=True))    # b'\\xff\\xff'
print((-256).to_bytes(2, 'big', signed=True))  # b'\\xff\\x00'

# OverflowError — число не помещается в 1 байт
try:
    (256).to_bytes(1, 'big')
except OverflowError as e:
    print(e)   # int too big to convert

# Практический пример — формирование бинарного пакета:
header = (0xDEAD).to_bytes(2, 'big')
length = (42).to_bytes(4, 'little')
packet = header + length
print(packet.hex())   # 'dead2a000000'`,
  },
  {
    name: "int.from_bytes(bytes, byteorder, *, signed=False)",
    description: `Классовый метод (classmethod). Преобразует последовательность байт в целое число. Является обратной операцией к to_bytes().

Аргумент byteorder определяет порядок байт в источнике:
- 'big' — старший байт первый (big-endian)
- 'little' — младший байт первый (little-endian)

Аргумент signed указывает, следует ли интерпретировать байты как число в дополнительном коде (для чтения отрицательных чисел):
- False (по умолчанию) — результат всегда неотрицательный
- True — старший бит старшего байта считается знаковым, результат может быть отрицательным

Принимает любой итерируемый объект целых чисел от 0 до 255: bytes, bytearray, список и т.д.`,
    syntax: "int.from_bytes(bytes, byteorder, *, signed=False)",
    arguments: [
      {
        name: "bytes",
        description:
          "Объект bytes, bytearray или итерируемый объект целых чисел 0–255, который нужно преобразовать в число",
      },
      {
        name: "byteorder",
        description:
          'Порядок байт: "big" (старший байт первый) или "little" (младший байт первый)',
      },
      {
        name: "signed",
        description:
          "Необязательный. Если True — байты интерпретируются как число в дополнительном коде, допуская отрицательные значения. По умолчанию False",
      },
    ],
    example: `# Big-endian: b'\\x03\\xe8' → 1000
print(int.from_bytes(b'\\x03\\xe8', 'big'))      # 1000
print(int.from_bytes(b'\\xe8\\x03', 'little'))   # 1000

# Нулевые байты → 0
print(int.from_bytes(b'\\x00\\x00\\x00\\x00', 'big'))   # 0

# Знаковая интерпретация — signed=True
print(int.from_bytes(b'\\xff\\xff', 'big', signed=True))   # -1
print(int.from_bytes(b'\\xff\\xff', 'big', signed=False))  # 65535

# Можно передать bytearray или список байт
print(int.from_bytes([0x03, 0xe8], 'big'))   # 1000

# Roundtrip: число → байты → число
n = 123456
b = n.to_bytes(4, 'big')
restored = int.from_bytes(b, 'big')
print(restored == n)   # True

# Чтение 4-байтового заголовка из бинарного файла:
with open('data.bin', 'rb') as f:
    raw = f.read(4)
    value = int.from_bytes(raw, 'little')
    print(f"Заголовок: {value}")`,
  },

  {
    name: "PEP 8",
    description: `PEP 8 — «Руководство по стилю кода Python» (Style Guide for Python Code), написанное Гвидо ван Россумом и Барри Уорсо. Это официальный стандарт оформления Python-кода, которому следует большинство проектов.

Ключевые правила PEP 8:
- Отступы: 4 пробела (не табуляция)
- Максимальная длина строки: 79 символов (для docstring — 72)
- Пустые строки: 2 строки между функциями/классами верхнего уровня, 1 строка между методами класса
- Импорты: по одному на строку, в начале файла, в порядке: stdlib → third-party → local
- Именование: snake_case для функций/переменных, PascalCase для классов, UPPER_CASE для констант, _private для внутренних имён
- Пробелы: не ставить вокруг = в именованных аргументах, ставить вокруг операторов
- Комментарии: на отдельной строке, начинаются с заглавной буквы

Автоматическая проверка PEP 8 выполняется инструментами: pycodestyle, flake8, ruff. Автоформатирование: black, autopep8.`,
    syntax: "# Проверка: flake8 script.py\n# Форматирование: black script.py",
    arguments: [],
    example: `# Плохо (нарушение PEP 8):
def my_function( x,y ):
    return x+y

x=1
y=2
import os, sys

# Хорошо (по PEP 8):
import os
import sys


def my_function(x, y):
    return x + y


x = 1
y = 2

# Именование:
MAX_SIZE = 100          # константа — UPPER_CASE
class MyClass:          # класс — PascalCase
    def my_method(self): ...  # метод — snake_case
    def _private(self):  ...  # приватный — _snake_case`,
  },
  {
    name: "PEP 20 (The Zen of Python)",
    description: `PEP 20 — «Дзен Python» (The Zen of Python), написанный Тимом Питерсом. Это 19 принципов-афоризмов, отражающих философию языка Python. Их можно прочитать прямо в интерпретаторе: import this.

19 принципов (неофициальный перевод):
1. Красивое лучше безобразного
2. Явное лучше неявного
3. Простое лучше сложного
4. Сложное лучше запутанного
5. Плоское лучше вложенного
6. Разреженное лучше плотного
7. Читаемость имеет значение
8. Особые случаи не настолько особые, чтобы нарушать правила
9. При этом практичность важнее безупречности
10. Ошибки не должны замалчиваться
11. Если они не замалчиваются явно
12. Встретив двусмысленность, не поддавайся искушению угадать
13. Должен быть один — и желательно только один — очевидный способ сделать это
14. Хотя он может быть неочевидным, если вы не голландец
15. Сейчас лучше, чем никогда
16. Хотя никогда зачастую лучше, чем прямо сейчас
17. Если реализацию сложно объяснить — идея плохая
18. Если реализацию легко объяснить — идея, возможно, хорошая
19. Пространства имён — это отличная идея, их должно быть больше!`,
    syntax: "import this",
    arguments: [],
    example: `# Вывести Дзен Python:
import this

# Принцип "Явное лучше неявного":
# Плохо:
def process(data, flag=True):
    if flag: ...   # что означает flag?

# Хорошо:
def process(data, validate=True):
    if validate: ...   # смысл понятен

# Принцип "Простое лучше сложного":
# Плохо:
result = list(map(lambda x: x**2, filter(lambda x: x % 2 == 0, range(10))))

# Хорошо:
result = [x**2 for x in range(10) if x % 2 == 0]

# Принцип "Ошибки не должны замалчиваться":
# Плохо:
try:
    risky()
except:
    pass   # тихо проглатывает все ошибки

# Хорошо:
try:
    risky()
except ValueError as e:
    logger.error(e)   # явная обработка`,
  },
  {
    name: "GIL (Global Interpreter Lock)",
    description: `GIL (Global Interpreter Lock) — глобальная блокировка интерпретатора — мьютекс в CPython (стандартной реализации Python), который позволяет выполняться только одному потоку Python в каждый момент времени, даже на многоядерных процессорах.

Почему существует GIL:
- CPython использует подсчёт ссылок (reference counting) для управления памятью
- Без блокировки несколько потоков могли бы одновременно изменять счётчики ссылок, вызывая гонки данных (race conditions)
- GIL упрощает интеграцию C-расширений и делает объекты Python потокобезопасными

Следствия GIL:
- Потоки (threading) не дают прироста производительности для CPU-интенсивных задач
- Потоки хорошо работают для I/O-интенсивных задач (сеть, диск), где поток отпускает GIL во время ожидания
- Для параллельных CPU-задач используйте multiprocessing (отдельные процессы, каждый со своим GIL)

Начиная с Python 3.13, GIL можно отключить в экспериментальном режиме (free-threaded build).`,
    syntax:
      "# GIL — внутренний механизм CPython, не требует явного использования",
    arguments: [],
    example: `import threading
import multiprocessing
import time

# CPU-задача: GIL ограничивает потоки — нет прироста скорости
def cpu_task(n):
    return sum(i * i for i in range(n))

# Потоки — НЕ ускоряют CPU-задачи из-за GIL:
t1 = threading.Thread(target=cpu_task, args=(10**7,))
t2 = threading.Thread(target=cpu_task, args=(10**7,))
# t1 и t2 не будут работать параллельно

# Процессы — обходят GIL (каждый процесс имеет свой GIL):
p1 = multiprocessing.Process(target=cpu_task, args=(10**7,))
p2 = multiprocessing.Process(target=cpu_task, args=(10**7,))
p1.start(); p2.start()
p1.join(); p2.join()   # настоящий параллелизм

# I/O задачи: GIL отпускается при ожидании — потоки эффективны:
import urllib.request
def fetch(url):
    urllib.request.urlopen(url)
# Потоки здесь работают хорошо — GIL освобождается на время запроса`,
  },
  {
    name: "Duck typing",
    description: `Duck typing («утиная типизация») — принцип типизации в Python, при котором тип объекта определяется не его классом, а наличием нужных методов и атрибутов. Название происходит от поговорки: «Если оно ходит как утка и крякает как утка — значит, это утка».

В Python не нужно проверять isinstance() или наследование — достаточно убедиться, что объект умеет выполнять нужные операции. Это делает код более гибким и универсальным.

Duck typing противопоставляется номинальной типизации (Java, C#), где тип должен явно объявлять, какому интерфейсу он соответствует.

Родственные концепции:
- EAFP — try/except вместо проверок типа
- Протоколы (typing.Protocol) — формальный способ описать duck typing со статической проверкой типов (Python 3.8+)`,
    syntax: "# Не isinstance(obj, SomeClass) — а obj.method()",
    arguments: [],
    example: `# Функция принимает ЛЮБОЙ объект с методом .read()
def process(file_like):
    data = file_like.read()   # не важно, что именно
    return data.upper()

# Работает с файлом:
with open('data.txt', 'r') as f:
    print(process(f))

# Работает с io.StringIO:
import io
buf = io.StringIO("hello world")
print(process(buf))   # HELLO WORLD

# Работает с любым кастомным объектом:
class FakeFile:
    def read(self):
        return "fake data"

print(process(FakeFile()))   # FAKE DATA

# Итерация — duck typing в действии:
def total(collection):
    return sum(collection)   # работает с list, tuple, set, generator...

print(total([1, 2, 3]))      # 6
print(total((1, 2, 3)))      # 6
print(total(x for x in range(4)))  # 6`,
  },
  {
    name: "EAFP (Easier to Ask for Forgiveness than Permission)",
    description: `EAFP — «Проще попросить прощения, чем разрешения» — стиль программирования в Python, при котором код выполняет действие напрямую, а исключения обрабатываются по факту. Это предпочтительный Python-стиль.

Суть подхода: предполагай, что условие выполнено, и обрабатывай исключение, если что-то пошло не так. Это более «питоничный» стиль, чем предварительные проверки (LBYL).

Преимущества EAFP:
- Устраняет состояние гонки (race condition): между проверкой и действием состояние может измениться
- Код короче и читаемее при «нормальном» пути выполнения
- Соответствует философии Python и PEP 20 («Ошибки не должны замалчиваться»)

Типичные случаи применения: доступ к ключам словаря, атрибутам объекта, файлам, преобразование типов.`,
    syntax:
      "try:\n    result = do_something()\nexcept SomeException:\n    handle_error()",
    arguments: [],
    example: `# EAFP — сначала делаем, потом обрабатываем исключение:

# Доступ к ключу словаря
d = {'a': 1}
try:
    value = d['b']
except KeyError:
    value = 0

# Преобразование типа
user_input = "42"
try:
    number = int(user_input)
except ValueError:
    number = None

# Работа с атрибутом объекта
try:
    result = obj.process()
except AttributeError:
    result = default_process()

# Работа с файлом — без предварительной проверки существования:
try:
    with open('config.json') as f:
        config = json.load(f)
except FileNotFoundError:
    config = default_config()

# Сравните с LBYL (менее питонично):
import os
if os.path.exists('config.json'):   # между проверкой и открытием файл могут удалить!
    with open('config.json') as f:
        config = json.load(f)`,
  },
  {
    name: "LBYL (Look Before You Leap)",
    description: `LBYL — «Посмотри, прежде чем прыгнуть» — стиль программирования, при котором перед выполнением действия явно проверяются все необходимые условия. Это противоположность EAFP.

В Python LBYL менее предпочтителен, чем EAFP, по ряду причин:
- Между проверкой и действием состояние может измениться (race condition — особенно при работе с файлами, сетью, параллельным кодом)
- Код становится длиннее: для каждого действия нужны предварительные условия
- Может дублировать логику (проверяем и потом снова обращаемся)

Тем не менее LBYL оправдан, когда:
- Проверка дешевле исключения (например, hasattr() перед доступом к атрибуту)
- Исключение сигнализирует о нарушении инварианта программы
- Код предназначен для аудитории, привыкшей к явным проверкам`,
    syntax: "if condition:\n    do_something()\nelse:\n    handle_error()",
    arguments: [],
    example: `# LBYL — сначала проверяем, потом делаем:

# Доступ к ключу словаря
d = {'a': 1}
if 'b' in d:
    value = d['b']
else:
    value = 0

# Проверка типа перед преобразованием
user_input = "42"
if user_input.isdigit():
    number = int(user_input)
else:
    number = None

# Проверка атрибута
if hasattr(obj, 'process'):
    result = obj.process()
else:
    result = default_process()

# Проблема LBYL с файлами — race condition:
import os
if os.path.exists('data.txt'):   # файл существует...
    # ...но между строками другой процесс может его удалить!
    with open('data.txt') as f:  # FileNotFoundError всё равно возможен
        data = f.read()

# EAFP надёжнее в таких случаях:
try:
    with open('data.txt') as f:
        data = f.read()
except FileNotFoundError:
    data = ''`,
  },
  {
    name: "Mutable / Immutable",
    description: `Mutable (изменяемый) — объект, состояние которого можно изменить после создания. Immutable (неизменяемый) — объект, который нельзя изменить; любая «модификация» создаёт новый объект.

Изменяемые (mutable) типы в Python:
- list, dict, set, bytearray
- Пользовательские классы (по умолчанию)

Неизменяемые (immutable) типы:
- int, float, complex, bool, str, bytes, tuple, frozenset, NoneType
- Объекты этих типов можно использовать в качестве ключей словарей и элементов множеств

Важные следствия:
- Изменяемые объекты передаются по ссылке — функции могут изменить оригинал
- Неизменяемые объекты безопасны при передаче — функция никогда не изменит оригинал
- Хэшируемость: только неизменяемые объекты могут быть хэшируемыми (и быть ключами dict/set)`,
    syntax:
      "# Mutable: list, dict, set\n# Immutable: int, str, tuple, frozenset",
    arguments: [],
    example: `# Immutable — изменение создаёт новый объект:
s = "hello"
id_before = id(s)
s += " world"
print(id(s) == id_before)   # False — новый объект!

n = 42
id_before = id(n)
n += 1
print(id(n) == id_before)   # False — новый объект!

# Mutable — изменяется на месте:
lst = [1, 2, 3]
id_before = id(lst)
lst.append(4)
print(id(lst) == id_before)   # True — тот же объект!

# Опасность с mutable в аргументах по умолчанию:
def append_to(item, lst=[]):   # [] создаётся ОДИН раз!
    lst.append(item)
    return lst

print(append_to(1))   # [1]
print(append_to(2))   # [1, 2]  — не [2]!

# Правильно:
def append_to(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst`,
  },
  {
    name: "Hashable",
    description: `Hashable (хэшируемый) — объект, у которого есть хэш-значение, которое не изменяется в течение жизни объекта. Хэшируемые объекты можно использовать как ключи словарей (dict) и элементы множеств (set).

Объект является хэшируемым, если он реализует метод __hash__(). По умолчанию пользовательские классы хэшируемы (хэш вычисляется по id объекта).

Правило хэшируемости:
- Объекты, которые сравниваются равными (==), должны иметь одинаковые хэш-значения
- Если определить __eq__(), Python автоматически устанавливает __hash__ = None (объект становится нехэшируемым), если __hash__ не переопределён явно

Неизменяемые встроенные типы — хэшируемые: int, float, str, bytes, tuple, frozenset.
Изменяемые встроенные типы — нехэшируемые: list, dict, set.`,
    syntax: "hash(obj)   # возвращает хэш-значение",
    arguments: [],
    example: `# Хэшируемые объекты:
print(hash(42))          # целое число
print(hash(3.14))        # float
print(hash("hello"))     # строка
print(hash((1, 2, 3)))   # кортеж из хэшируемых элементов
print(hash(frozenset({1, 2})))  # frozenset

# Нехэшируемые объекты — TypeError:
try:
    hash([1, 2, 3])   # list нехэшируем
except TypeError as e:
    print(e)   # unhashable type: 'list'

try:
    hash({'a': 1})   # dict нехэшируем
except TypeError as e:
    print(e)

# Ключи словаря и элементы set — только хэшируемые:
d = {(1, 2): 'tuple key', 'str': 'string key', 42: 'int key'}
s = {1, 'hello', (1, 2)}

# Пользовательский хэшируемый класс:
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    def __hash__(self):
        return hash((self.x, self.y))

p = Point(1, 2)
d = {p: 'точка'}   # можно использовать как ключ`,
  },
  {
    name: "Iterable",
    description: `Iterable (итерируемый объект) — любой объект, по которому можно итерировать: использовать в цикле for, передавать в функции list(), tuple(), sum(), zip() и т.д.

Объект является итерируемым, если он реализует метод __iter__(), возвращающий итератор, или метод __getitem__() с индексами от 0.

Встроенные итерируемые объекты: list, tuple, str, bytes, dict, set, frozenset, range, файловые объекты, генераторы.

Ключевое отличие iterable от iterator:
- Iterable — «коллекция», у которой есть __iter__(), который создаёт новый итератор при каждом вызове. Можно итерировать многократно.
- Iterator — «курсор», который хранит текущую позицию. Итерируется только один раз.

Проверка: isinstance(obj, collections.abc.Iterable) или наличие __iter__.`,
    syntax:
      "for item in iterable:\n    ...\n\niter(iterable)  # получить итератор",
    arguments: [],
    example: `from collections.abc import Iterable

# Встроенные итерируемые объекты:
for ch in "hello":      print(ch)   # строка
for x in [1, 2, 3]:    print(x)    # список
for k in {'a': 1}:     print(k)    # словарь (ключи)
for x in range(5):     print(x)    # range

# Проверка итерируемости:
print(isinstance([1, 2], Iterable))   # True
print(isinstance(42, Iterable))       # False

# Список итерируем многократно:
lst = [1, 2, 3]
for x in lst: print(x)   # 1 2 3
for x in lst: print(x)   # 1 2 3 — снова с начала!

# Пользовательский итерируемый класс:
class Countdown:
    def __init__(self, n):
        self.n = n
    def __iter__(self):
        return iter(range(self.n, 0, -1))

for x in Countdown(5):
    print(x)   # 5 4 3 2 1`,
  },
  {
    name: "Iterator",
    description: `Iterator (итератор) — объект, реализующий протокол итератора: метод __iter__() (возвращает self) и __next__() (возвращает следующий элемент или вызывает StopIteration при исчерпании).

Итератор хранит состояние текущей позиции и «помнит», где остановился. В отличие от iterable, итератор можно пройти только один раз — после исчерпания он не возвращается к началу.

Встроенная функция iter() создаёт итератор из итерируемого объекта. Функция next() извлекает следующий элемент.

Все генераторы являются итераторами. Многие встроенные функции возвращают итераторы: map(), filter(), zip(), enumerate(), reversed().`,
    syntax: "iterator = iter(iterable)\nnext(iterator)  # следующий элемент",
    arguments: [],
    example: `# Создание итератора из списка:
lst = [1, 2, 3]
it = iter(lst)

print(next(it))   # 1
print(next(it))   # 2
print(next(it))   # 3
# next(it)        # StopIteration!

# Итератор можно пройти только ОДИН РАЗ:
it = iter([1, 2, 3])
print(list(it))   # [1, 2, 3]
print(list(it))   # []  — исчерпан!

# for-цикл использует итератор под капотом:
# for x in lst эквивалентно:
it = iter(lst)
while True:
    try:
        x = next(it)
        print(x)
    except StopIteration:
        break

# Пользовательский итератор:
class Counter:
    def __init__(self, start, stop):
        self.current = start
        self.stop = stop
    def __iter__(self):
        return self
    def __next__(self):
        if self.current >= self.stop:
            raise StopIteration
        val = self.current
        self.current += 1
        return val

for n in Counter(1, 4):
    print(n)   # 1 2 3`,
  },
  {
    name: "Generator",
    description: `Generator (генератор) — специальный тип итератора, создаваемый функцией с ключевым словом yield. Генераторы вычисляют значения лениво (lazy evaluation) — по одному по мере необходимости, не создавая всю последовательность в памяти сразу.

Два способа создать генератор:
1. Функция-генератор — функция с yield. При вызове возвращает объект-генератор, не выполняя тело функции. Выполнение продолжается при каждом вызове next().
2. Генераторное выражение — синтаксис как у list comprehension, но в круглых скобках: (x**2 for x in range(10)).

Преимущества:
- Экономия памяти — не хранит всю последовательность
- Может генерировать бесконечные последовательности
- Ленивые вычисления — элементы вычисляются только при запросе

yield from — делегирует итерацию другому итерируемому объекту или генератору.`,
    syntax: "def gen():\n    yield value\n\n(expr for item in iterable)",
    arguments: [],
    example: `# Функция-генератор:
def count_up(n):
    for i in range(n):
        yield i

gen = count_up(5)
print(next(gen))   # 0
print(next(gen))   # 1
print(list(gen))   # [2, 3, 4]

# Генератор экономит память:
# Список 1 000 000 чисел в памяти:
lst = [x**2 for x in range(1_000_000)]   # ~8 МБ

# Генератор — почти 0 памяти:
gen = (x**2 for x in range(1_000_000))
print(next(gen))   # 0

# Бесконечная последовательность:
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
print([next(fib) for _ in range(8)])   # [0, 1, 1, 2, 3, 5, 8, 13]

# yield from — делегирование:
def chain(*iterables):
    for it in iterables:
        yield from it

print(list(chain([1, 2], [3, 4], [5])))   # [1, 2, 3, 4, 5]`,
  },
  {
    name: "Decorator",
    description: `Decorator (декоратор) — функция (или класс), которая принимает другую функцию (или метод/класс) и возвращает новую функцию с изменённым или расширенным поведением. Применяется через синтаксис @decorator_name над определением функции.

Декораторы реализуют паттерн «обёртка» (wrapper): исходная функция заворачивается в новую, которая может выполнять код до и после вызова оригинала, изменять аргументы или результат, добавлять логирование, кэширование, проверку прав и т.д.

Важно использовать functools.wraps внутри декоратора, чтобы сохранить метаданные оригинальной функции (имя, docstring и т.д.).

Встроенные декораторы Python: @staticmethod, @classmethod, @property, @functools.lru_cache, @dataclasses.dataclass.`,
    syntax: "@decorator\ndef function():\n    ...",
    arguments: [],
    example: `import functools
import time

# Простой декоратор — логирование вызовов:
def log_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Вызов: {func.__name__}{args}")
        result = func(*args, **kwargs)
        print(f"Результат: {result}")
        return result
    return wrapper

@log_calls
def add(x, y):
    return x + y

add(2, 3)
# Вызов: add(2, 3)
# Результат: 5

# Декоратор с параметрами:
def repeat(n):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(n):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Привет, {name}!")

greet("Alice")   # выводит 3 раза

# Встроенный @functools.lru_cache — кэширование:
@functools.lru_cache(maxsize=128)
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

print(fib(50))   # быстро, благодаря кэшу`,
  },
  {
    name: "Context manager",
    description: `Context manager (менеджер контекста) — объект, управляющий жизненным циклом ресурса в блоке with. Гарантирует, что ресурс будет корректно освобождён (файл закрыт, соединение разорвано, блокировка снята) даже в случае исключения.

Протокол менеджера контекста:
- __enter__(self) — вызывается при входе в блок with, возвращает ресурс (доступен через as)
- __exit__(self, exc_type, exc_val, exc_tb) — вызывается при выходе из блока (в том числе при исключении). Если возвращает True — исключение подавляется.

Создание менеджеров контекста:
1. Класс с __enter__ / __exit__
2. Декоратор @contextlib.contextmanager над функцией-генератором с yield

Встроенные менеджеры контекста: open(), threading.Lock(), decimal.localcontext(), unittest.mock.patch().`,
    syntax: "with context_manager as resource:\n    ...",
    arguments: [],
    example: `# Классический пример — файл:
with open('data.txt', 'r') as f:
    content = f.read()
# файл закрыт автоматически, даже при исключении

# Пользовательский класс-менеджер контекста:
class Timer:
    def __enter__(self):
        import time
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.elapsed = time.perf_counter() - self.start
        print(f"Время: {self.elapsed:.4f} с")
        return False  # не подавлять исключения

with Timer() as t:
    sum(range(10**6))
# Время: 0.0312 с

# Через @contextlib.contextmanager:
from contextlib import contextmanager

@contextmanager
def managed_resource():
    print("Открываем ресурс")
    resource = {"data": 42}
    try:
        yield resource          # значение для as
    finally:
        print("Закрываем ресурс")

with managed_resource() as r:
    print(r["data"])   # 42
# Закрываем ресурс — вызывается всегда`,
  },
  {
    name: "Descriptor",
    description: `Descriptor (дескриптор) — объект, определяющий поведение доступа к атрибуту другого класса через специальные методы: __get__, __set__ и/или __delete__. Дескрипторы — это механизм, лежащий в основе property, classmethod, staticmethod, а также слотов (__slots__).

Типы дескрипторов:
- Data descriptor (дескриптор данных) — реализует __set__ и/или __delete__. Имеет приоритет над __dict__ экземпляра.
- Non-data descriptor (дескриптор без данных) — реализует только __get__. __dict__ экземпляра имеет приоритет над ним.

Протокол дескриптора:
- __get__(self, obj, objtype=None) — вызывается при чтении атрибута
- __set__(self, obj, value) — вызывается при записи
- __delete__(self, obj) — вызывается при удалении

Дескрипторы работают только как атрибуты класса — не как атрибуты экземпляра.`,
    syntax:
      "class Descriptor:\n    def __get__(self, obj, objtype=None): ...\n    def __set__(self, obj, value): ...",
    arguments: [],
    example: `# Простой дескриптор — валидация значения:
class PositiveNumber:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name, 0)

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)) or value <= 0:
            raise ValueError(f"{self.name} должно быть положительным числом")
        obj.__dict__[self.name] = value

class Circle:
    radius = PositiveNumber()
    def __init__(self, radius):
        self.radius = radius

c = Circle(5)
print(c.radius)   # 5

try:
    c.radius = -1   # ValueError: radius должно быть положительным числом
except ValueError as e:
    print(e)

# property — встроенный дескриптор:
class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius

    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32

t = Temperature(100)
print(t.fahrenheit)   # 212.0`,
  },
  {
    name: "Metaclass",
    description: `Metaclass (метакласс) — класс, экземплярами которого являются другие классы. Если обычный класс создаёт объекты (экземпляры), то метакласс создаёт классы. Стандартный метакласс в Python — type.

Цепочка: object — базовый класс всех объектов; type — базовый метакласс; type является экземпляром самого себя.

Метакласс используется для:
- Автоматического изменения классов при их создании (добавление методов, валидация атрибутов)
- Регистрации классов (паттерн «реестр»)
- Реализации синглтонов, ORM (Django models, SQLAlchemy), API-фреймворков
- Принудительного соблюдения интерфейсов (абстрактные методы через ABCMeta)

В современном Python многие задачи метаклассов решаются проще через __init_subclass__() или декораторы классов.`,
    syntax:
      "class MyMeta(type):\n    def __new__(mcs, name, bases, namespace): ...\n\nclass MyClass(metaclass=MyMeta): ...",
    arguments: [],
    example: `# type — базовый метакласс:
print(type(int))      # <class 'type'>
print(type(str))      # <class 'type'>
print(type(type))     # <class 'type'>  — type — экземпляр себя

# Динамическое создание класса через type:
Dog = type('Dog', (object,), {'sound': 'woof', 'speak': lambda self: self.sound})
d = Dog()
print(d.speak())   # woof

# Пользовательский метакласс — автодобавление метода:
class AutoReprMeta(type):
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        def __repr__(self):
            attrs = ', '.join(f'{k}={v!r}' for k, v in self.__dict__.items())
            return f"{name}({attrs})"
        cls.__repr__ = __repr__
        return cls

class Point(metaclass=AutoReprMeta):
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
print(p)   # Point(x=1, y=2)

# ABCMeta — встроенный метакласс для абстрактных классов:
from abc import ABCMeta, abstractmethod

class Shape(metaclass=ABCMeta):
    @abstractmethod
    def area(self) -> float: ...

# Shape()  # TypeError — нельзя создать экземпляр абстрактного класса`,
  },

  {
    name: "List comprehension",
    description: `List comprehension (включение списка) — компактный синтаксис для создания нового списка путём применения выражения к каждому элементу итерируемого объекта, с необязательной фильтрацией через условие if.

Это питоничная замена циклам map()/filter() и явным for-циклам с append(). List comprehension читается более естественно и, как правило, быстрее эквивалентного цикла за счёт оптимизаций в интерпретаторе.

Поддерживает вложенность: несколько for и if можно комбинировать, однако глубокая вложенность снижает читаемость — в таких случаях лучше использовать обычный цикл.

Всегда создаёт список целиком в памяти. Если нужна ленивая обработка больших данных — используйте generator expression (круглые скобки вместо квадратных).`,
    syntax: "[expression for item in iterable if condition]",
    arguments: [
      {
        name: "expression",
        description:
          "Выражение, результат которого становится элементом нового списка",
      },
      {
        name: "item",
        description: "Переменная, принимающая значения из итерируемого объекта",
      },
      {
        name: "iterable",
        description: "Итерируемый объект, по которому производится итерация",
      },
      {
        name: "condition",
        description:
          "Необязательный фильтр: элемент включается только если условие истинно",
      },
    ],
    example: `# Базовый синтаксис:
squares = [x**2 for x in range(10)]
print(squares)   # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# С условием фильтрации:
evens = [x for x in range(20) if x % 2 == 0]
print(evens)   # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# Преобразование строк:
words = ['hello', 'world', 'python']
upper = [w.upper() for w in words]
print(upper)   # ['HELLO', 'WORLD', 'PYTHON']

# Вложенный список (плоский вывод вложенного):
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [x for row in matrix for x in row]
print(flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# С if/else (тернарный оператор, не фильтр):
labels = ['чётное' if x % 2 == 0 else 'нечётное' for x in range(6)]
print(labels)   # ['чётное', 'нечётное', 'чётное', 'нечётное', 'чётное', 'нечётное']`,
  },
  {
    name: "Dict comprehension",
    description: `Dict comprehension (включение словаря) — компактный синтаксис для создания нового словаря. Аналог list comprehension, но в фигурных скобках и с парой key: value.

Позволяет строить словари из любых итерируемых объектов: из пар (ключ, значение), из двух параллельных списков через zip(), инвертировать существующий словарь и т.д.

Если в процессе итерации возникают дублирующиеся ключи — последнее значение перезапишет предыдущие. Поддерживает условие фильтрации if, как и list comprehension.`,
    syntax: "{key_expr: value_expr for item in iterable if condition}",
    arguments: [
      { name: "key_expr", description: "Выражение для ключа нового словаря" },
      {
        name: "value_expr",
        description: "Выражение для значения нового словаря",
      },
      { name: "item", description: "Переменная итерации" },
      { name: "iterable", description: "Итерируемый объект-источник данных" },
      { name: "condition", description: "Необязательный фильтр элементов" },
    ],
    example: `# Квадраты чисел:
squares = {x: x**2 for x in range(6)}
print(squares)   # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Из двух списков через zip():
keys = ['a', 'b', 'c']
values = [1, 2, 3]
d = {k: v for k, v in zip(keys, values)}
print(d)   # {'a': 1, 'b': 2, 'c': 3}

# Инвертировать словарь (ключи ↔ значения):
original = {'a': 1, 'b': 2, 'c': 3}
inverted = {v: k for k, v in original.items()}
print(inverted)   # {1: 'a', 2: 'b', 3: 'c'}

# С фильтрацией — только чётные значения:
d = {x: x**2 for x in range(10) if x % 2 == 0}
print(d)   # {0: 0, 2: 4, 4: 16, 6: 36, 8: 64}

# Нормализация строковых ключей:
raw = {'  Name ': 'Alice', ' Age ': 30}
clean = {k.strip(): v for k, v in raw.items()}
print(clean)   # {'Name': 'Alice', 'Age': 30}`,
  },
  {
    name: "Set comprehension",
    description: `Set comprehension (включение множества) — компактный синтаксис для создания нового множества. Синтаксически похоже на dict comprehension (фигурные скобки), но содержит одно выражение вместо пары key: value.

Поскольку множество автоматически удаляет дубликаты, set comprehension удобен для получения уникальных значений из итерируемого объекта с возможным преобразованием каждого элемента.

Для создания пустого множества нельзя использовать {} — это создаст пустой словарь. Используйте set() или не используйте пустые включения.`,
    syntax: "{expression for item in iterable if condition}",
    arguments: [
      {
        name: "expression",
        description:
          "Выражение, результат которого становится элементом нового множества",
      },
      { name: "item", description: "Переменная итерации" },
      { name: "iterable", description: "Итерируемый объект-источник данных" },
      { name: "condition", description: "Необязательный фильтр элементов" },
    ],
    example: `# Уникальные квадраты:
squares = {x**2 for x in range(-3, 4)}
print(squares)   # {0, 1, 4, 9}  — дубликаты удалены

# Уникальные слова в нижнем регистре:
text = "Hello World hello Python world"
unique_words = {w.lower() for w in text.split()}
print(unique_words)   # {'hello', 'world', 'python'}

# С фильтрацией — только чётные:
evens = {x for x in range(20) if x % 2 == 0}
print(evens)   # {0, 2, 4, 6, 8, 10, 12, 14, 16, 18}

# Уникальные расширения файлов:
files = ['main.py', 'utils.py', 'index.html', 'style.css', 'app.py']
extensions = {f.split('.')[-1] for f in files}
print(extensions)   # {'py', 'html', 'css'}

# Сравнение: {} — пустой dict, set() — пустое множество
print(type({}))    # <class 'dict'>
print(type(set()))  # <class 'set'>`,
  },
  {
    name: "Generator expression",
    description: `Generator expression (генераторное выражение) — компактный синтаксис для создания генератора. Внешне похоже на list comprehension, но использует круглые скобки вместо квадратных. Вычисляет значения лениво — по одному при каждом запросе, не создавая весь список в памяти.

Ключевое отличие от list comprehension:
- List comprehension создаёт весь список в памяти сразу — O(n) памяти
- Generator expression создаёт объект-генератор — O(1) памяти, элементы вычисляются по требованию

Генераторное выражение можно передать напрямую в функции, принимающие итерируемый объект (sum, max, min, list, any, all и т.д.) — скобки функции служат скобками генератора, двойные скобки не нужны.`,
    syntax: "(expression for item in iterable if condition)",
    arguments: [
      {
        name: "expression",
        description: "Выражение, результат которого лениво генерируется",
      },
      { name: "item", description: "Переменная итерации" },
      { name: "iterable", description: "Итерируемый объект-источник данных" },
      { name: "condition", description: "Необязательный фильтр элементов" },
    ],
    example: `# List comprehension — весь список в памяти:
lst = [x**2 for x in range(1_000_000)]   # ~8 МБ

# Generator expression — почти 0 памяти:
gen = (x**2 for x in range(1_000_000))

# Элементы вычисляются при запросе:
print(next(gen))   # 0
print(next(gen))   # 1
print(next(gen))   # 4

# Передача в функцию — одни скобки:
total = sum(x**2 for x in range(100))         # не sum((x**2 for x in range(100)))
maximum = max(len(w) for w in ['hi', 'hello', 'hey'])
print(total)    # 328350
print(maximum)  # 5

# any/all с генератором:
numbers = [2, 4, 6, 7, 8]
print(all(x % 2 == 0 for x in numbers))   # False (7 нечётное)
print(any(x > 5 for x in numbers))        # True

# Генераторное выражение — одноразовое:
gen = (x for x in range(3))
print(list(gen))   # [0, 1, 2]
print(list(gen))   # []  — исчерпан`,
  },
  {
    name: "Lambda function",
    description: `Lambda function (лямбда-функция) — анонимная функция, определяемая в одном выражении с помощью ключевого слова lambda. В отличие от def, lambda не имеет имени, не поддерживает несколько операторов и всегда возвращает значение выражения (без явного return).

Синтаксис: lambda аргументы: выражение

Лямбды наиболее уместны как короткие функции, передаваемые в качестве аргументов в функции высшего порядка: sorted(), map(), filter(), max(), min() и т.д.

Ограничения:
- Может содержать только одно выражение (не блок кода)
- Не поддерживает аннотации типов, docstrings, декораторы
- Согласно PEP 8, не стоит присваивать лямбду переменной — лучше использовать def`,
    syntax: "lambda arguments: expression",
    arguments: [
      {
        name: "arguments",
        description:
          "Параметры функции — как у обычной функции (позиционные, со значениями по умолчанию, *args, **kwargs)",
      },
      {
        name: "expression",
        description:
          "Единственное выражение, результат которого возвращается. Не может содержать операторы (if/else только в тернарном виде)",
      },
    ],
    example: `# Базовый синтаксис:
square = lambda x: x**2
print(square(5))   # 25

add = lambda x, y: x + y
print(add(3, 4))   # 7

# Сортировка по ключу:
people = [('Alice', 30), ('Bob', 25), ('Charlie', 35)]
people.sort(key=lambda p: p[1])   # сортировка по возрасту
print(people)   # [('Bob', 25), ('Alice', 30), ('Charlie', 35)]

# С несколькими критериями:
words = ['banana', 'apple', 'cherry', 'date']
words.sort(key=lambda w: (len(w), w))   # по длине, затем алфавитно

# map() и filter():
nums = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, nums))
evens = list(filter(lambda x: x % 2 == 0, nums))
print(squared)   # [1, 4, 9, 16, 25]
print(evens)     # [2, 4]

# Тернарный оператор в лямбде:
classify = lambda x: 'чётное' if x % 2 == 0 else 'нечётное'
print(classify(4))   # чётное`,
  },
  {
    name: "Docstring",
    description: `Docstring (строка документации) — строковый литерал, помещённый в начало модуля, класса, метода или функции сразу после объявления. Доступен через атрибут __doc__ объекта и используется инструментами документации (help(), pydoc, Sphinx, IDE).

Стандарты написания docstrings описаны в PEP 257. Основные правила:
- Однострочный docstring — для простых функций, на одной строке, в тройных кавычках
- Многострочный docstring — краткое описание, пустая строка, подробное описание

Популярные форматы docstrings:
- Google style — секции Args:, Returns:, Raises:
- NumPy style — секции Parameters, Returns с подчёркиванием
- reStructuredText (Sphinx) — :param:, :type:, :returns:, :rtype:

IDE (PyCharm, VS Code) используют docstrings для подсказок при наведении курсора.`,
    syntax:
      'def func():\n    """Краткое описание.\n\n    Подробное описание.\n    """',
    arguments: [],
    example: `# Однострочный docstring:
def add(x, y):
    """Возвращает сумму двух чисел."""
    return x + y

print(add.__doc__)   # Возвращает сумму двух чисел.

# Многострочный (Google style):
def process_data(data, threshold=0.5):
    """Обрабатывает входные данные и фильтрует по порогу.

    Args:
        data (list[float]): Список числовых значений для обработки.
        threshold (float): Порог фильтрации. По умолчанию 0.5.

    Returns:
        list[float]: Отфильтрованный список значений.

    Raises:
        ValueError: Если data пуст.
    """
    if not data:
        raise ValueError("data не может быть пустым")
    return [x for x in data if x >= threshold]

# Получение документации:
help(process_data)

# Docstring класса:
class Circle:
    """Круг с заданным радиусом.

    Attributes:
        radius (float): Радиус круга.
    """
    def __init__(self, radius: float):
        self.radius = radius`,
  },
  {
    name: "Type hint",
    description: `Type hint (аннотация типов) — синтаксис Python, позволяющий указывать ожидаемые типы переменных, аргументов функций и возвращаемых значений. Введён в PEP 484 (Python 3.5+) и значительно расширен в последующих версиях.

Важно: Python не проверяет аннотации типов во время выполнения — они лишь документируют намерения. Проверку выполняют статические анализаторы: mypy, pyright, pytype.

Основные конструкции:
- Простые типы: int, str, float, bool, None
- Составные (typing): List, Dict, Tuple, Optional, Union, Any
- Начиная с Python 3.9+: list, dict, tuple прямо в аннотациях (без импорта из typing)
- Python 3.10+: X | Y вместо Union[X, Y]
- Python 3.12+: type NewType = ...

Аннотации хранятся в __annotations__ и доступны в runtime через typing.get_type_hints().`,
    syntax: "def func(arg: Type) -> ReturnType:\n    variable: Type = value",
    arguments: [],
    example: `from typing import Optional, Union

# Базовые аннотации:
def greet(name: str) -> str:
    return f"Привет, {name}!"

def add(x: int, y: int) -> int:
    return x + y

# Переменные:
count: int = 0
names: list[str] = ['Alice', 'Bob']
scores: dict[str, int] = {'Alice': 95}

# Optional — значение или None:
def find_user(user_id: int) -> Optional[str]:   # str | None
    return "Alice" if user_id == 1 else None

# Union — один из нескольких типов (Python 3.10+):
def process(value: int | str) -> str:
    return str(value)

# Вложенные типы:
def matrix_sum(matrix: list[list[int]]) -> int:
    return sum(x for row in matrix for x in row)

# Callable — функция как тип:
from typing import Callable
def apply(func: Callable[[int], int], value: int) -> int:
    return func(value)

# TypeVar — обобщённые типы:
from typing import TypeVar
T = TypeVar('T')
def first(lst: list[T]) -> T:
    return lst[0]`,
  },
  {
    name: "Virtual environment",
    description: `Virtual environment (виртуальное окружение) — изолированная копия интерпретатора Python со своим набором установленных пакетов. Позволяет иметь разные версии одной и той же библиотеки для разных проектов без конфликтов.

Стандартный инструмент — модуль venv (встроен в Python 3.3+). Сторонние альтернативы: virtualenv (расширенный функционал), conda (для Data Science), poetry, pipenv (управление зависимостями + окружение в одном инструменте).

Как работает: при активации виртуального окружения переменная PATH настраивается так, что команды python и pip указывают на исполняемые файлы внутри окружения, а не на системный Python.

Хорошая практика:
- Всегда создавать виртуальное окружение для каждого проекта
- Добавлять папку окружения (.venv/) в .gitignore
- Фиксировать зависимости через pip freeze > requirements.txt`,
    syntax:
      "python -m venv .venv\nsource .venv/bin/activate   # Linux/macOS\n.venv\\Scripts\\activate      # Windows",
    arguments: [],
    example: `# Создание виртуального окружения:
# python -m venv .venv

# Активация (Linux/macOS):
# source .venv/bin/activate

# Активация (Windows):
# .venv\\Scripts\\activate

# После активации — в скобках отображается имя окружения:
# (.venv) $ python --version
# (.venv) $ pip install requests

# Установка зависимостей:
# pip install -r requirements.txt

# Фиксация зависимостей:
# pip freeze > requirements.txt

# Деактивация:
# deactivate

# Проверка, что используется окружение:
import sys
print(sys.prefix)   # путь к активному окружению
print(sys.executable)  # путь к интерпретатору

# .gitignore — добавить папку окружения:
# .venv/
# venv/
# __pycache__/`,
  },
  {
    name: "pip",
    description: `pip — стандартный менеджер пакетов Python (Pip Installs Packages). Позволяет устанавливать, обновлять и удалять пакеты из Python Package Index (PyPI) и других источников.

pip включён в Python 3.4+ и устанавливается автоматически вместе с интерпретатором. Всегда рекомендуется использовать pip внутри виртуального окружения, чтобы не засорять системный Python.

Ключевые команды:
- pip install package — установить пакет
- pip install package==1.2.3 — установить конкретную версию
- pip install -r requirements.txt — установить из файла зависимостей
- pip uninstall package — удалить пакет
- pip list — список установленных пакетов
- pip show package — информация о пакете
- pip freeze — список зависимостей в формате requirements.txt
- pip install --upgrade package — обновить пакет

Современные альтернативы: poetry, uv (значительно быстрее pip), pipenv.`,
    syntax: "pip install package\npip install -r requirements.txt",
    arguments: [],
    example: `# Установка пакета:
# pip install requests

# Установка конкретной версии:
# pip install requests==2.31.0

# Установка с ограничением версии:
# pip install "requests>=2.28,<3.0"

# Установка из requirements.txt:
# pip install -r requirements.txt

# Обновление пакета:
# pip install --upgrade requests

# Удаление:
# pip uninstall requests

# Список установленных пакетов:
# pip list

# Подробная информация о пакете:
# pip show requests

# Экспорт зависимостей:
# pip freeze > requirements.txt

# Установка в режиме разработки (из локального кода):
# pip install -e .

# Программная проверка версии пакета:
import importlib.metadata
version = importlib.metadata.version('requests')
print(version)   # например: '2.31.0'`,
  },
  {
    name: "PYTHONPATH",
    description: `PYTHONPATH — переменная окружения операционной системы, задающая дополнительные директории, в которых Python ищет модули при импорте. Пути в PYTHONPATH добавляются в sys.path перед стандартными путями поиска.

Порядок поиска модулей (sys.path):
1. Директория запускаемого скрипта (или текущая директория для интерактивного режима)
2. Пути из PYTHONPATH
3. Стандартные пути установки Python и site-packages

PYTHONPATH полезен при разработке, когда нужно импортировать модули из нестандартных мест без установки пакета. В production-коде лучше устанавливать пакеты через pip, а не манипулировать PYTHONPATH.

sys.path можно изменять и программно — но это также не рекомендуется для production.`,
    syntax:
      '# Linux/macOS:\nexport PYTHONPATH="/path/to/dir:$PYTHONPATH"\n\n# Windows:\nset PYTHONPATH=C:\\path\\to\\dir;%PYTHONPATH%',
    arguments: [],
    example: `# Просмотр текущего пути поиска модулей:
import sys
for path in sys.path:
    print(path)

# Добавление пути программно (временно, только в текущей сессии):
import sys
sys.path.insert(0, '/path/to/my/modules')
import my_module   # теперь ищется и в /path/to/my/modules

# Установка PYTHONPATH перед запуском скрипта:
# PYTHONPATH=/home/user/project python script.py

# Проверка, откуда импортирован модуль:
import requests
print(requests.__file__)
# /home/user/.venv/lib/python3.11/site-packages/requests/__init__.py

# Альтернатива — editable install (pip install -e .):
# Добавляет пакет в sys.path без манипуляций с PYTHONPATH
# pyproject.toml / setup.py + pip install -e .`,
  },
  {
    name: "Namespace",
    description: `Namespace (пространство имён) — словарь, отображающий имена (идентификаторы) на объекты. В Python каждый модуль, класс, функция и встроенный уровень имеют своё пространство имён.

Виды пространств имён:
- Встроенное (builtin) — содержит встроенные имена: print, len, int, Exception и т.д.
- Глобальное (global) — пространство имён модуля, создаётся при импорте
- Локальное (local) — пространство имён функции, создаётся при каждом вызове и уничтожается при возврате
- Пространство имён класса — содержит атрибуты и методы класса

Технически пространство имён — это обычный словарь Python. Доступен через globals(), locals(), vars().

Пространства имён позволяют одинаковым именам существовать в разных контекстах без конфликтов — именно это имеет в виду последний принцип Дзена Python: «Пространства имён — это отличная идея».`,
    syntax:
      "globals()   # глобальное пространство имён\nlocals()    # локальное пространство имён\nvars(obj)   # пространство имён объекта",
    arguments: [],
    example: `# Глобальное пространство имён модуля:
x = 10
print('x' in globals())   # True

# Локальное пространство имён функции:
def show_locals():
    a = 1
    b = 2
    print(locals())   # {'a': 1, 'b': 2}

show_locals()

# Пространство имён класса:
class Dog:
    species = 'Canis lupus'
    def bark(self): ...

print(vars(Dog))   # {'species': 'Canis lupus', 'bark': <function...>, ...}

# Одинаковые имена в разных пространствах:
value = "глобальный"

def func():
    value = "локальный"  # не конфликтует с глобальным
    print(value)

func()              # локальный
print(value)        # глобальный

# Импорт создаёт пространство имён модуля:
import math
print(math.pi)     # pi из пространства имён модуля math
# pi не загрязняет текущее пространство имён`,
  },
  {
    name: "Scope (LEGB)",
    description: `Scope (область видимости) — контекст, в котором имя (переменная) доступно. Python использует правило LEGB для поиска имён: проверяет области видимости в строго определённом порядке.

Правило LEGB:
- L (Local) — локальная область: внутри текущей функции
- E (Enclosing) — объемлющая область: внутри охватывающей функции (для вложенных функций)
- G (Global) — глобальная область: на уровне модуля
- B (Built-in) — встроенная область: встроенные имена Python (print, len, int...)

Поиск имени идёт строго по цепочке L → E → G → B. Первое найденное имя используется.

Ключевые слова:
- global — объявляет, что переменная внутри функции относится к глобальной области
- nonlocal — объявляет, что переменная относится к объемлющей (enclosing) области (нужно для замыканий)`,
    syntax: "# L → E → G → B\nglobal variable_name\nnonlocal variable_name",
    arguments: [],
    example: `x = "global"          # G — глобальная

def outer():
    x = "enclosing"   # E — объемлющая

    def inner():
        x = "local"   # L — локальная
        print(x)      # local  (L найдено первым)

    inner()
    print(x)          # enclosing

outer()
print(x)              # global

# Встроенная (B) — используется если нигде больше нет:
print(len([1, 2, 3]))   # len — из Built-in

# global — изменить глобальную переменную из функции:
counter = 0
def increment():
    global counter
    counter += 1

increment()
print(counter)   # 1

# nonlocal — изменить переменную объемлющей функции:
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
print(counter())   # 1
print(counter())   # 2`,
  },
  {
    name: "Closure",
    description: `Closure (замыкание) — функция, которая «захватывает» переменные из объемлющей области видимости (enclosing scope) и сохраняет к ним доступ даже после того, как объемлющая функция завершила работу.

Замыкание образуется, когда:
1. Есть вложенная функция (функция внутри функции)
2. Вложенная функция использует переменную из объемлющей функции
3. Объемлющая функция возвращает вложенную функцию

Захваченные переменные хранятся в атрибуте __closure__ функции в виде ячеек (cell objects). Замыкания — основа для декораторов, фабрик функций, частичного применения и паттерна «мемоизация».

Ловушка с замыканиями в циклах: переменная цикла захватывается по ссылке, а не по значению — все функции будут использовать последнее значение.`,
    syntax:
      "def outer():\n    x = value\n    def inner():\n        use(x)   # захват x\n    return inner",
    arguments: [],
    example: `# Базовое замыкание:
def make_multiplier(factor):
    def multiply(x):
        return x * factor   # factor захвачен из make_multiplier
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))   # 10
print(triple(5))   # 15

# Замыкание хранит своё состояние:
def make_counter(start=0):
    count = [start]   # список — обходим nonlocal через мутацию
    def counter():
        count[0] += 1
        return count[0]
    return counter

c = make_counter()
print(c())   # 1
print(c())   # 2
print(c())   # 3

# Ловушка в цикле — все замыкания видят последнее i:
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])   # [2, 2, 2]  — не [0, 1, 2]!

# Исправление — захват по значению через аргумент по умолчанию:
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])   # [0, 1, 2]`,
  },
  {
    name: "Coroutine",
    description: `Coroutine (корутина) — функция, выполнение которой можно приостановить и возобновить. В Python корутины реализованы через async def и await. Это основной инструмент асинхронного программирования.

Виды корутин в Python:
- Генераторные корутины (устаревший стиль) — через yield, используемый с asyncio.coroutine (удалён в Python 3.11)
- Нативные корутины (современный стиль) — через async def / await (Python 3.5+)

Ключевые особенности:
- Вызов async def функции не выполняет её тело — возвращает объект корутины
- Тело выполняется только при передаче в event loop: через await, asyncio.run() или задачу (Task)
- await может использоваться только внутри async def функции
- Корутины выполняются конкурентно (concurrently), но не параллельно — event loop переключает их при ожидании I/O`,
    syntax: "async def func():\n    result = await other_coroutine()",
    arguments: [],
    example: `import asyncio

# Базовая корутина:
async def greet(name: str) -> str:
    await asyncio.sleep(1)   # имитация асинхронного ожидания
    return f"Привет, {name}!"

# Запуск корутины:
result = asyncio.run(greet("Alice"))
print(result)   # Привет, Alice!

# Конкурентное выполнение нескольких корутин:
async def fetch(url: str, delay: float) -> str:
    await asyncio.sleep(delay)   # имитация сетевого запроса
    return f"Ответ от {url}"

async def main():
    # Запускаем конкурентно — суммарное время ≈ max(задержек), не сумма
    results = await asyncio.gather(
        fetch("https://api1.com", 1.0),
        fetch("https://api2.com", 0.5),
        fetch("https://api3.com", 1.5),
    )
    for r in results:
        print(r)

asyncio.run(main())   # выполняется ≈ 1.5 с, а не 3 с`,
  },
  {
    name: "Async/Await",
    description: `Async/Await — синтаксис асинхронного программирования в Python (PEP 492, Python 3.5+), позволяющий писать неблокирующий конкурентный код в привычном синхронном стиле.

Ключевые слова:
- async def — объявляет асинхронную функцию (корутину). Вызов возвращает объект-корутину, не выполняя тело.
- await — приостанавливает выполнение текущей корутины до завершения awaitable-объекта (корутины, Task, Future). Управление возвращается event loop.
- async for — асинхронная итерация по асинхронному итератору
- async with — асинхронный менеджер контекста

Подходит для: HTTP-запросов, работы с базами данных, WebSocket, файловых операций — всего, где есть ожидание I/O.

Не ускоряет CPU-интенсивные задачи — для этого нужны процессы (multiprocessing) или asyncio.run_in_executor().`,
    syntax: "async def func():\n    await coroutine()\n\nasyncio.run(func())",
    arguments: [],
    example: `import asyncio
import aiohttp   # pip install aiohttp

# Синхронный подход — запросы выполняются последовательно:
# response1 = requests.get(url1)   # ждём
# response2 = requests.get(url2)   # ждём

# Асинхронный подход — конкурентно:
async def fetch(session, url):
    async with session.get(url) as response:  # async with
        return await response.text()

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:  # async with
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# async for — асинхронная итерация:
async def read_lines(filename):
    async with aiofiles.open(filename) as f:
        async for line in f:
            process(line)

# asyncio.create_task — запуск фоновой задачи:
async def main():
    task = asyncio.create_task(long_operation())
    # продолжаем работу, пока task выполняется в фоне
    result = await task
    return result

asyncio.run(main())`,
  },
  {
    name: "MRO (Method Resolution Order)",
    description: `MRO (Method Resolution Order) — порядок разрешения методов — алгоритм, определяющий в каком порядке Python ищет методы и атрибуты в иерархии классов при множественном наследовании.

Python использует алгоритм C3-линеаризации (C3 Linearization), который гарантирует:
- Локальный приоритет: дочерний класс проверяется раньше родительских
- Монотонность: если A стоит перед B в MRO одного класса, то и в MRO производных классов A стоит раньше B
- Порядок перечисления базовых классов соблюдается

Просмотр MRO: ClassName.__mro__ или ClassName.mro() — возвращает кортеж/список классов в порядке поиска.

super() использует MRO для вызова следующего метода в цепочке — именно поэтому super() работает корректно при кооперативном множественном наследовании.`,
    syntax: "ClassName.__mro__\nClassName.mro()",
    arguments: [],
    example: `# Простое наследование:
class A:
    def method(self):
        return "A"

class B(A):
    def method(self):
        return "B"

class C(B):
    pass

print(C.__mro__)
# (<class 'C'>, <class 'B'>, <class 'A'>, <class 'object'>)
print(C().method())   # "B"  — находит в B раньше, чем в A

# Множественное наследование — алмазная проблема:
class Base:
    def hello(self):
        return "Base"

class Left(Base):
    def hello(self):
        return "Left → " + super().hello()

class Right(Base):
    def hello(self):
        return "Right → " + super().hello()

class Child(Left, Right):
    def hello(self):
        return "Child → " + super().hello()

print(Child.__mro__)
# Child → Left → Right → Base → object
print(Child().hello())
# Child → Left → Right → Base  — Base вызван ОДИН раз

# Конфликтующий MRO вызывает TypeError:
# class Bad(Left, A): pass  # нарушает C3-линеаризацию`,
  },
  {
    name: "complex.conjugate()",
    description:
      "Возвращает комплексно-сопряжённое число: знак мнимой части меняется на противоположный, вещественная часть остаётся без изменений. Используется в алгебре комплексных чисел, например при вычислении модуля или нормировке.",
    syntax: "complex.conjugate()",
    arguments: [],
    example: `z = 3 + 4j
print(z.conjugate())   # (3-4j)

# Вещественное число — мнимая часть 0, сопряжение не меняет значение
w = complex(5, 0)
print(w.conjugate())   # (5-0j)

# Применение: |z|^2 = z * z.conjugate()
mod_sq = z * z.conjugate()
print(mod_sq.real)     # 25.0  (3² + 4²)`,
  },
  {
    name: "float.is_integer()",
    description:
      "Возвращает True, если значение числа с плавающей точкой является целым (дробная часть равна нулю), и False в противном случае. Удобно для проверки результата деления или вычислений перед преобразованием в int.",
    syntax: "float.is_integer()",
    arguments: [],
    example: `print((2.0).is_integer())    # True
print((2.5).is_integer())    # False
print((-3.0).is_integer())   # True
print((1e10).is_integer())   # True

# Типичный сценарий: безопасный перевод в int
value = 7 / 2
if value.is_integer():
    result = int(value)
else:
    result = value
print(result)  # 3.5`,
  },
  {
    name: "float.hex() / float.fromhex(s)",
    description:
      "float.hex() возвращает точное шестнадцатеричное представление числа в виде строки вида ±0x<hex>p±<exp>, позволяя сохранить число без потерь округления. float.fromhex(s) — обратный классовый метод: восстанавливает число из такой строки. Полезны при сериализации вещественных чисел для передачи между системами.",
    syntax: `float.hex()
float.fromhex(s)`,
    arguments: [
      {
        name: "s",
        description:
          "Строка в шестнадцатеричном формате вида «±0x<мантисса>p±<порядок>», возвращённая методом hex(). Принимается также формат без префикса 0x для совместимости.",
      },
    ],
    example: `x = 3.14159
h = x.hex()
print(h)                        # '0x1.921f9f01b866ep+1'

# Точное восстановление — нет ошибок округления
restored = float.fromhex(h)
print(restored == x)            # True

# Сравните с обычным round-trip через строку
print(float(str(x)) == x)      # False (может не совпасть)

# Удобно для записи в конфиг-файлы
config = {"pi": (3.14159).hex()}
value = float.fromhex(config["pi"])`,
  },
  {
    name: "bytes.hex([sep[, bytes_per_sep]])",
    description:
      "Возвращает строку с шестнадцатеричным представлением каждого байта объекта bytes. Необязательные параметры позволяют задать разделитель между группами байт, что удобно при выводе MAC-адресов, хешей и бинарных протоколов.",
    syntax: "bytes.hex([sep[, bytes_per_sep]])",
    arguments: [
      {
        name: "sep",
        description:
          'Односимвольная строка-разделитель, вставляемая между группами байт. Например ":", "-", " ".',
      },
      {
        name: "bytes_per_sep",
        description:
          "Количество байт в одной группе. Положительное значение считает слева, отрицательное — справа. По умолчанию каждый байт разделяется отдельно.",
      },
    ],
    example: `data = bytes([0xDE, 0xAD, 0xBE, 0xEF])

print(data.hex())            # 'deadbeef'
print(data.hex(':'))         # 'de:ad:be:ef'
print(data.hex(':', 2))      # 'dead:beef'
print(data.hex('-', -2))     # 'de-adbe-ef'  (группы справа)

# MAC-адрес
mac = bytes([0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E])
print(mac.hex(':', 1))       # '00:1a:2b:3c:4d:5e'`,
  },
  {
    name: "bytes.fromhex(string)",
    description:
      "Классовый метод, создающий объект bytes из строки с шестнадцатеричными символами. Пробелы в строке игнорируются; любой другой посторонний символ вызывает ValueError. Является обратной операцией к bytes.hex().",
    syntax: "bytes.fromhex(string)",
    arguments: [
      {
        name: "string",
        description:
          "Строка, содержащая только шестнадцатеричные символы (0–9, a–f, A–F) и пробелы. Длина строки без пробелов должна быть чётной.",
      },
    ],
    example: `b = bytes.fromhex('deadbeef')
print(b)                        # b'\\xde\\xad\\xbe\\xef'

# Пробелы допустимы — удобно для читаемых записей
b2 = bytes.fromhex('de ad be ef')
print(b2 == b)                  # True

# Round-trip
original = b'Hello'
hex_str = original.hex()
print(bytes.fromhex(hex_str))   # b'Hello'

# ValueError при некорректных символах
try:
    bytes.fromhex('zz')
except ValueError as e:
    print(e)`,
  },
  {
    name: "bytearray.hex([sep[, bytes_per_sep]])",
    description:
      "Метод объекта bytearray, идентичный bytes.hex(). Возвращает строку с шестнадцатеричным представлением содержимого изменяемого буфера байт. Разделитель и группировка задаются так же, как в bytes.hex().",
    syntax: "bytearray.hex([sep[, bytes_per_sep]])",
    arguments: [
      {
        name: "sep",
        description: "Односимвольная строка-разделитель между группами байт.",
      },
      {
        name: "bytes_per_sep",
        description:
          "Количество байт в группе. Положительное — группы от начала, отрицательное — от конца.",
      },
    ],
    example: `buf = bytearray([0x01, 0x02, 0x03, 0xFF])

print(buf.hex())          # '010203ff'
print(buf.hex(' '))       # '01 02 03 ff'
print(buf.hex(':', 2))    # '0102:03ff'

# Изменяем содержимое и смотрим новое hex-представление
buf[0] = 0xAA
print(buf.hex())          # 'aa0203ff'`,
  },
  {
    name: "bytearray.fromhex(string)",
    description:
      "Классовый метод, создающий изменяемый объект bytearray из строки шестнадцатеричных символов. Аналогичен bytes.fromhex(), но возвращает bytearray, который можно модифицировать после создания.",
    syntax: "bytearray.fromhex(string)",
    arguments: [
      {
        name: "string",
        description:
          "Строка шестнадцатеричных символов (0–9, a–f, A–F) с опциональными пробелами. Длина без пробелов должна быть чётной.",
      },
    ],
    example: `buf = bytearray.fromhex('cafebabe')
print(buf)           # bytearray(b'\\xca\\xfe\\xba\\xbe')
print(type(buf))     # <class 'bytearray'>

# Изменяемость — главное отличие от bytes.fromhex()
buf[0] = 0xFF
print(buf.hex())     # 'fffebabe'

# Пробелы в строке игнорируются
buf2 = bytearray.fromhex('ca fe ba be')
print(buf2 == bytearray.fromhex('cafebabe'))  # True`,
  },
  {
    name: "memoryview.tobytes()",
    description:
      "Возвращает содержимое буфера памяти в виде объекта bytes, независимо от исходного типа объекта. При необходимости выполняет копирование данных. Аргумент order управляет порядком обхода многомерных массивов.",
    syntax: "memoryview.tobytes(order='C')",
    arguments: [
      {
        name: "order",
        description:
          "Порядок обхода элементов многомерного массива: 'C' — строка за строкой (C-style, по умолчанию), 'F' — столбец за столбцом (Fortran-style), 'A' — сохранить исходный порядок.",
      },
    ],
    example: `data = bytearray(b'Hello, World!')
mv = memoryview(data)

# Получаем неизменяемую копию в виде bytes
b = mv.tobytes()
print(b)                  # b'Hello, World!'
print(type(b))            # <class 'bytes'>

# Срез memoryview — tobytes вернёт только срез
partial = mv[7:12].tobytes()
print(partial)            # b'World'

# Изменение исходного bytearray не влияет на уже снятую копию
data[0] = ord('h')
print(b[0:5])             # b'Hello'  (копия не изменилась)`,
  },
  {
    name: "memoryview.hex()",
    description:
      "Возвращает строку с шестнадцатеричным представлением содержимого буфера памяти — аналогично bytes.hex(). Позволяет инспектировать бинарные данные без их полного копирования в bytes, так как memoryview работает без создания промежуточных копий.",
    syntax: "memoryview.hex()",
    arguments: [],
    example: `import array

# memoryview над array
arr = array.array('B', [0x48, 0x65, 0x6C, 0x6C, 0x6F])
mv = memoryview(arr)

print(mv.hex())           # '48656c6c6f'  ("Hello" в ASCII)

# Срез — hex только нужного участка
print(mv[1:3].hex())      # '656c'

# Сравнение: без промежуточного bytes
data = bytearray(b'\\xDE\\xAD\\xBE\\xEF')
print(memoryview(data).hex())  # 'deadbeef'`,
  },
  {
    name: "__debug__",
    description:
      "Встроенная константа времени интерпретатора. Равна True при обычном запуске и False при запуске с флагом оптимизации -O или -OO. Блоки кода внутри if __debug__: полностью удаляются компилятором байт-кода при оптимизации, как будто их не существует — это делает __debug__ более эффективным, чем обычная переменная-флаг.",
    syntax: "__debug__",
    arguments: [],
    example: `# Обычный запуск: python script.py
print(__debug__)   # True

# Оптимизированный запуск: python -O script.py
# print(__debug__) выведет False

# Типичное применение — дешёвые проверки в разработке
if __debug__:
    # Этот блок полностью исчезает при python -O
    expected_keys = {'id', 'name', 'value'}
    assert set(data.keys()) == expected_keys, f"Неожиданные ключи: {data.keys()}"

# assert тоже зависит от __debug__:
# при -O все assert-инструкции молча пропускаются
assert 1 == 1, "Это никогда не упадёт, но при -O вообще не выполняется"`,
  },

  // ─── collections ──────────────────────────────────────────────────────────
  {
    name: "collections.namedtuple(typename, field_names, *, rename=False, defaults=None, module=None)",
    description:
      "Фабричная функция, создающая новый подкласс tuple с именованными полями. Экземпляры занимают столько же памяти, что и обычные кортежи, но доступ к полям возможен как через индекс, так и через атрибут по имени. Удобна для читаемого кода вместо безымянных кортежей из функций.",
    syntax:
      "collections.namedtuple(typename, field_names, *, rename=False, defaults=None, module=None)",
    arguments: [
      {
        name: "typename",
        description:
          "Имя создаваемого класса (строка). Именно это имя будет отображаться в repr и при отладке.",
      },
      {
        name: "field_names",
        description:
          'Последовательность имён полей — список строк или одна строка с именами через пробел/запятую, например "x y" или ["x", "y"].',
      },
      {
        name: "rename",
        description:
          "Если True, некорректные имена полей (ключевые слова, дубликаты) автоматически заменяются позиционными именами _0, _1, …",
      },
      {
        name: "defaults",
        description:
          "Значения по умолчанию для последних N полей. Передаётся итерируемый объект; значения выравниваются по правому краю списка полей.",
      },
      {
        name: "module",
        description:
          "Если задан, устанавливается атрибут __module__ нового класса, что влияет на pickle-сериализацию.",
      },
    ],
    example: `from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(1, 2)
print(p.x, p.y)        # 1 2
print(p[0], p[1])      # 1 2  (как обычный tuple)
print(p)               # Point(x=1, y=2)

# Значения по умолчанию
Color = namedtuple('Color', ['r', 'g', 'b', 'a'], defaults=[255])
c = Color(128, 64, 32)
print(c.a)             # 255

# _replace — создаёт копию с изменёнными полями
p2 = p._replace(x=10)
print(p2)              # Point(x=10, y=2)

# _asdict — словарь
print(p._asdict())     # {'x': 1, 'y': 2}`,
  },
  {
    name: "collections.ChainMap(*maps)",
    description:
      "Объединяет несколько словарей (или других отображений) в единое логическое представление без физического слияния. Поиск ключа идёт по словарям слева направо — первое совпадение выигрывает. Записи и удаления всегда происходят только в первом словаре. Идеален для управления приоритетами конфигураций: аргументы CLI > переменные окружения > настройки по умолчанию.",
    syntax: "collections.ChainMap(*maps)",
    arguments: [
      {
        name: "*maps",
        description:
          "Произвольное количество словарей или объектов, поддерживающих интерфейс MutableMapping. Первый имеет наивысший приоритет при поиске.",
      },
    ],
    example: `from collections import ChainMap

defaults   = {'color': 'red',  'user': 'guest', 'debug': False}
env_vars   = {'user': 'alice', 'debug': True}
cli_args   = {'color': 'blue'}

config = ChainMap(cli_args, env_vars, defaults)

print(config['color'])   # 'blue'   (из cli_args)
print(config['user'])    # 'alice'  (из env_vars)
print(config['debug'])   # True     (из env_vars)

# Запись идёт только в первый словарь
config['timeout'] = 30
print(cli_args)          # {'color': 'blue', 'timeout': 30}

# Дочерний контекст — не изменяет исходный
child = config.new_child({'color': 'green'})
print(child['color'])    # 'green'
print(config['color'])   # 'blue'`,
  },
  {
    name: "collections.UserDict([initialdata])",
    description:
      "Обёртка вокруг обычного словаря dict, предназначенная для наследования. Хранит реальные данные в атрибуте data (типа dict). В отличие от прямого наследования от dict, переопределение __setitem__, __getitem__ и других методов работает предсказуемо и без скрытых обходов.",
    syntax: "collections.UserDict([initialdata])",
    arguments: [
      {
        name: "initialdata",
        description:
          "Опциональный словарь или итерируемый объект пар ключ-значение для начального заполнения. Если не передан — создаётся пустой словарь.",
      },
    ],
    example: `from collections import UserDict

class LowercaseDict(UserDict):
    """Словарь, приводящий строковые ключи к нижнему регистру."""
    def __setitem__(self, key, value):
        if isinstance(key, str):
            key = key.lower()
        super().__setitem__(key, value)

d = LowercaseDict({'Name': 'Alice', 'AGE': 30})
print(d['name'])   # 'Alice'
print(d['age'])    # 30

d['CITY'] = 'Moscow'
print(d['city'])   # 'Moscow'

# Прямой доступ к внутреннему dict
print(d.data)      # {'name': 'Alice', 'age': 30, 'city': 'Moscow'}`,
  },
  {
    name: "collections.UserList([list])",
    description:
      "Обёртка вокруг списка list для безопасного наследования. Внутренние данные доступны через атрибут data. Позволяет переопределять методы списка (__setitem__, append и др.) без непредсказуемого поведения, характерного для прямого наследования от list.",
    syntax: "collections.UserList([list])",
    arguments: [
      {
        name: "list",
        description:
          "Опциональный список или итерируемый объект для начального заполнения. Если не передан — создаётся пустой список.",
      },
    ],
    example: `from collections import UserList

class BoundedList(UserList):
    """Список с ограничением максимального числа элементов."""
    def __init__(self, max_size, initlist=None):
        super().__init__(initlist)
        self.max_size = max_size

    def append(self, item):
        if len(self.data) >= self.max_size:
            raise ValueError(f"Список заполнен (максимум {self.max_size})")
        super().append(item)

bl = BoundedList(3, [1, 2])
bl.append(3)
print(bl)          # [1, 2, 3]

try:
    bl.append(4)
except ValueError as e:
    print(e)       # Список заполнен (максимум 3)`,
  },
  {
    name: "collections.UserString(seq)",
    description:
      "Обёртка вокруг строки str для наследования. Данные хранятся в атрибуте data. Даёт возможность создавать подклассы строк с переопределёнными методами — то, что при прямом наследовании от str приводит к трудноуловимым ошибкам из-за неизменяемости и оптимизаций интерпретатора.",
    syntax: "collections.UserString([seq])",
    arguments: [
      {
        name: "seq",
        description:
          "Опциональная строка или объект, у которого вызовется str() для получения начального значения. По умолчанию — пустая строка.",
      },
    ],
    example: `from collections import UserString

class CensoredString(UserString):
    """Строка, заменяющая нежелательные слова на звёздочки."""
    BANNED = {'spam', 'hack'}

    def __init__(self, seq=''):
        cleaned = str(seq)
        for word in self.BANNED:
            cleaned = cleaned.replace(word, '*' * len(word))
        super().__init__(cleaned)

s = CensoredString("This is not spam, just a hack")
print(s)            # This is not ****, just a ****

# Все строковые методы работают
print(s.upper())    # THIS IS NOT ****, JUST A ****
print(len(s))       # 30`,
  },

  // ─── itertools ────────────────────────────────────────────────────────────
  {
    name: "itertools.count(start=0, step=1)",
    description:
      "Создаёт бесконечный итератор, выдающий числа начиная с start с шагом step. Работает с любыми числами, поддерживающими сложение: int, float, Decimal и даже комплексными. Применяется вместе с zip() для нумерации или как источник ключей.",
    syntax: "itertools.count(start=0, step=1)",
    arguments: [
      {
        name: "start",
        description: "Начальное значение счётчика. По умолчанию 0.",
      },
      {
        name: "step",
        description:
          "Шаг приращения на каждой итерации. По умолчанию 1. Может быть отрицательным или дробным.",
      },
    ],
    example: `import itertools

# Нумерация элементов без enumerate
words = ['apple', 'banana', 'cherry']
for n, word in zip(itertools.count(1), words):
    print(n, word)
# 1 apple
# 2 banana
# 3 cherry

# Дробный шаг
for x in itertools.islice(itertools.count(0.0, 0.5), 5):
    print(x, end=' ')
# 0.0 0.5 1.0 1.5 2.0

# Отрицательный шаг — обратный отсчёт
for n in itertools.islice(itertools.count(10, -1), 5):
    print(n, end=' ')
# 10 9 8 7 6`,
  },
  {
    name: "itertools.cycle(iterable)",
    description:
      "Создаёт бесконечный итератор, который последовательно возвращает элементы переданного итерируемого объекта, а дойдя до конца — начинает заново. Для этого сохраняет копию всех элементов в памяти. Полезен для циклического назначения значений: цвета, стили, чередующиеся признаки.",
    syntax: "itertools.cycle(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Любой итерируемый объект, элементы которого будут повторяться циклически. Копия элементов сохраняется в памяти.",
      },
    ],
    example: `import itertools

colors = ['red', 'green', 'blue']
cycler = itertools.cycle(colors)

# Присвоить цвет каждому из 7 элементов
items = range(7)
for item, color in zip(items, cycler):
    print(f"item {item} -> {color}")
# item 0 -> red, item 1 -> green, item 2 -> blue,
# item 3 -> red, item 4 -> green, item 5 -> blue, item 6 -> red

# Чередование True/False (полосатая таблица)
row_styles = itertools.cycle(['odd', 'even'])
rows = ['Alice', 'Bob', 'Charlie', 'Diana']
for name, style in zip(rows, row_styles):
    print(f"{style}: {name}")`,
  },
  {
    name: "itertools.repeat(object[, times])",
    description:
      "Возвращает итератор, который бесконечно (или times раз) повторяет один и тот же объект. Не создаёт копий — каждый раз возвращается тот же объект. Часто передаётся в map() или starmap() как постоянный аргумент.",
    syntax: "itertools.repeat(object[, times])",
    arguments: [
      {
        name: "object",
        description: "Объект, который будет возвращаться на каждой итерации.",
      },
      {
        name: "times",
        description:
          "Необязательное целое число — сколько раз вернуть объект. Если не задано — итератор бесконечен.",
      },
    ],
    example: `import itertools

# Конечное повторение
print(list(itertools.repeat('hello', 3)))
# ['hello', 'hello', 'hello']

# Передача константы в map()
squares = list(map(pow, range(6), itertools.repeat(2)))
print(squares)   # [0, 1, 4, 9, 16, 25]

# Заполнение строки фиксированной длины
padded = list(zip(range(5), itertools.repeat(0)))
print(padded)    # [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)]`,
  },
  {
    name: "itertools.starmap(function, iterable)",
    description:
      "Аналог map(), но каждый элемент итерируемого объекта уже является кортежем аргументов, которые распаковываются в функцию через *. Удобен, когда данные уже организованы в виде пар или групп параметров.",
    syntax: "itertools.starmap(function, iterable)",
    arguments: [
      {
        name: "function",
        description:
          "Вызываемый объект, принимающий столько позиционных аргументов, сколько элементов в каждом кортеже.",
      },
      {
        name: "iterable",
        description:
          "Итерируемый объект, каждый элемент которого — кортеж (или последовательность) аргументов для function.",
      },
    ],
    example: `import itertools

# Возведение в степень: (base, exp)
pairs = [(2, 3), (3, 2), (10, 3)]
result = list(itertools.starmap(pow, pairs))
print(result)    # [8, 9, 1000]

# Форматирование строк
import operator
coords = [(1, 2), (3, 4), (5, 6)]
sums = list(itertools.starmap(operator.add, coords))
print(sums)      # [3, 7, 11]

# С lambda
points = [('Alice', 90), ('Bob', 75), ('Carol', 88)]
grades = list(itertools.starmap(
    lambda name, score: f"{name}: {'A' if score >= 88 else 'B'}",
    points
))
print(grades)    # ['Alice: A', 'Bob: B', 'Carol: A']`,
  },
  {
    name: "itertools.filterfalse(predicate, iterable)",
    description:
      "Возвращает элементы iterable, для которых predicate возвращает False — логическое дополнение к встроенному filter(). Если predicate равен None, отфильтровываются ложные (falsy) значения.",
    syntax: "itertools.filterfalse(predicate, iterable)",
    arguments: [
      {
        name: "predicate",
        description:
          "Функция одного аргумента, возвращающая bool. Если None — используется bool().",
      },
      {
        name: "iterable",
        description: "Итерируемый объект, из которого отбираются элементы.",
      },
    ],
    example: `import itertools

numbers = range(10)

# Нечётные числа (filter даст чётные)
odds = list(itertools.filterfalse(lambda x: x % 2 == 0, numbers))
print(odds)      # [1, 3, 5, 7, 9]

# Удалить пустые и None значения
data = ['Alice', '', None, 'Bob', 0, 'Carol']
cleaned = list(itertools.filterfalse(lambda x: not x, data))
print(cleaned)   # ['Alice', 'Bob', 'Carol']

# predicate=None — убирает все falsy
sparse = [1, 0, 2, None, 3, '', 4]
dense = list(itertools.filterfalse(None, sparse))
print(dense)     # [1, 2, 3, 4]`,
  },
  {
    name: "itertools.compress(data, selectors)",
    description:
      "Фильтрует data, оставляя только те элементы, для которых соответствующий элемент selectors является истинным. Останавливается, когда исчерпывается более короткий из двух итераторов. Аналог булевой маски из NumPy, но для любых итерируемых объектов.",
    syntax: "itertools.compress(data, selectors)",
    arguments: [
      {
        name: "data",
        description:
          "Исходный итерируемый объект, из которого выбираются элементы.",
      },
      {
        name: "selectors",
        description:
          "Итерируемый объект булевых значений (или любых значений с логическим смыслом). True — включить соответствующий элемент data, False — пропустить.",
      },
    ],
    example: `import itertools

data      = ['A', 'B', 'C', 'D', 'E', 'F']
selectors = [1,   0,   1,   0,   1,   1  ]

result = list(itertools.compress(data, selectors))
print(result)    # ['A', 'C', 'E', 'F']

# Динамическая маска на основе условия
scores = [88, 45, 92, 60, 77, 55]
names  = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve', 'Frank']
passed = list(itertools.compress(names, (s >= 60 for s in scores)))
print(passed)    # ['Alice', 'Carol', 'Dan', 'Eve']`,
  },
  {
    name: "itertools.tee(iterable, n=2)",
    description:
      "Создаёт n независимых итераторов из одного итерируемого объекта. После вызова исходный итерируемый объект не следует использовать напрямую. Каждый из n итераторов можно продвигать независимо; внутри используется общий буфер для хранения непрочитанных элементов.",
    syntax: "itertools.tee(iterable, n=2)",
    arguments: [
      {
        name: "iterable",
        description:
          "Исходный итерируемый объект. После передачи в tee его нельзя использовать напрямую.",
      },
      {
        name: "n",
        description:
          "Количество создаваемых независимых копий итератора. По умолчанию 2.",
      },
    ],
    example: `import itertools

def gen():
    for x in range(5):
        print(f"  генерируется {x}")
        yield x

it1, it2 = itertools.tee(gen())

# Каждый итератор независим
print(next(it1))   # генерируется 0 -> 0
print(next(it1))   # генерируется 1 -> 1
print(next(it2))   # 0  (из буфера, gen не вызывается повторно)
print(next(it2))   # 1  (из буфера)
print(next(it2))   # генерируется 2 -> 2

# Три копии
a, b, c = itertools.tee(range(4), 3)
print(list(a), list(b), list(c))
# [0,1,2,3] [0,1,2,3] [0,1,2,3]`,
  },
  {
    name: "itertools.pairwise(iterable)",
    description:
      "Возвращает итератор последовательных перекрывающихся пар элементов: (a[0], a[1]), (a[1], a[2]), (a[2], a[3]), … Если в iterable менее двух элементов — итератор пуст. Добавлен в Python 3.10.",
    syntax: "itertools.pairwise(iterable)",
    arguments: [
      {
        name: "iterable",
        description:
          "Исходный итерируемый объект. Каждый соседний элемент войдёт в два последовательных кортежа.",
      },
    ],
    example: `import itertools

# Соседние буквы
letters = 'ABCDE'
print(list(itertools.pairwise(letters)))
# [('A','B'), ('B','C'), ('C','D'), ('D','E')]

# Разность между соседними числами
data = [1, 4, 9, 16, 25]
diffs = [b - a for a, b in itertools.pairwise(data)]
print(diffs)    # [3, 5, 7, 9]

# Проверка отсортированности
def is_sorted(seq):
    return all(a <= b for a, b in itertools.pairwise(seq))

print(is_sorted([1, 2, 3, 4]))   # True
print(is_sorted([1, 3, 2, 4]))   # False`,
  },
  {
    name: "itertools.batched(iterable, n)",
    description:
      "Разбивает iterable на батчи (порции) по n элементов каждый, возвращая кортежи. Последний батч может содержать меньше n элементов. Добавлен в Python 3.12. Удобная замена ручным рецептам группировки через zip_longest.",
    syntax: "itertools.batched(iterable, n)",
    arguments: [
      {
        name: "iterable",
        description:
          "Исходный итерируемый объект, который нужно разбить на группы.",
      },
      {
        name: "n",
        description: "Размер каждого батча. Должен быть целым числом ≥ 1.",
      },
    ],
    example: `import itertools

data = range(10)

# Батчи по 3 элемента
for batch in itertools.batched(data, 3):
    print(batch)
# (0, 1, 2)
# (3, 4, 5)
# (6, 7, 8)
# (9,)  <- последний неполный батч

# Постраничная выдача записей из базы данных
records = list(range(1, 22))  # 21 запись
PAGE_SIZE = 5
for page_num, page in enumerate(itertools.batched(records, PAGE_SIZE), 1):
    print(f"Страница {page_num}: {page}")

# Сбор в список батчей
batches = list(itertools.batched('ABCDEFG', 2))
print(batches)   # [('A','B'), ('C','D'), ('E','F'), ('G',)]`,
  },

  // ─── functools ────────────────────────────────────────────────────────────
  {
    name: "functools.cached_property(func)",
    description:
      "Дескриптор, вычисляющий значение свойства один раз при первом обращении и сохраняющий результат в словаре экземпляра (__dict__). При последующих обращениях возвращается кэшированное значение без повторного вызова функции. В отличие от @property не вызывается каждый раз; в отличие от ручного кэширования не требует явного атрибута. Не является потокобезопасным без дополнительной синхронизации.",
    syntax: "@functools.cached_property\ndef method(self): ...",
    arguments: [
      {
        name: "func",
        description:
          "Метод экземпляра класса без аргументов (кроме self), чьё возвращаемое значение будет закэшировано.",
      },
    ],
    example: `import functools
import statistics

class DataSet:
    def __init__(self, data):
        self._data = data

    @functools.cached_property
    def mean(self):
        print("  вычисляю среднее...")
        return statistics.mean(self._data)

    @functools.cached_property
    def stdev(self):
        print("  вычисляю стандартное отклонение...")
        return statistics.stdev(self._data)

ds = DataSet([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
print(ds.mean)   # вычисляю среднее... -> 5.5
print(ds.mean)   # 5.5  (кэш, вычисления нет)
print(ds.stdev)  # вычисляю стандартное отклонение... -> 3.02...

# Сбросить кэш вручную
del ds.__dict__['mean']
print(ds.mean)   # вычисляю среднее... -> 5.5`,
  },
  {
    name: "functools.singledispatch(func)",
    description:
      "Декоратор, превращающий функцию в обобщённую (generic), которая диспетчеризирует вызов по типу первого аргумента. Позволяет реализовать перегрузку функций в Python без if/isinstance-цепочек. Для регистрации реализации под конкретный тип используется метод .register().",
    syntax: "@functools.singledispatch\ndef func(arg, ...): ...",
    arguments: [
      {
        name: "func",
        description:
          "Базовая реализация функции, вызываемая когда для типа первого аргумента нет зарегистрированной специализации.",
      },
    ],
    example: `import functools

@functools.singledispatch
def process(value):
    raise NotImplementedError(f"Нет реализации для {type(value)}")

@process.register(int)
def _(value):
    return f"Целое число: {value * 2}"

@process.register(str)
def _(value):
    return f"Строка: {value.upper()}"

@process.register(list)
def _(value):
    return f"Список из {len(value)} элементов"

print(process(10))           # Целое число: 20
print(process("hello"))      # Строка: HELLO
print(process([1, 2, 3]))    # Список из 3 элементов

# Посмотреть зарегистрированные типы
print(process.registry.keys())`,
  },
  {
    name: "functools.total_ordering(cls)",
    description:
      "Декоратор класса, автоматически генерирующий недостающие методы сравнения (__le__, __gt__, __ge__) на основе обязательно определённых __eq__ и одного из __lt__, __le__, __gt__ или __ge__. Позволяет не писать все шесть методов вручную, соблюдая принцип DRY.",
    syntax: "@functools.total_ordering\nclass MyClass: ...",
    arguments: [
      {
        name: "cls",
        description:
          "Класс, в котором определены __eq__ и хотя бы один из методов упорядочивания. Остальные три метода будут сгенерированы автоматически.",
      },
    ],
    example: `import functools

@functools.total_ordering
class Version:
    def __init__(self, major, minor, patch):
        self.major = major
        self.minor = minor
        self.patch = patch

    def __eq__(self, other):
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)

    def __lt__(self, other):
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)

    def __repr__(self):
        return f"Version({self.major}.{self.minor}.{self.patch})"

v1 = Version(1, 0, 0)
v2 = Version(2, 3, 1)
v3 = Version(1, 0, 0)

print(v1 < v2)    # True  — определён явно
print(v1 > v2)    # False — сгенерирован автоматически
print(v1 <= v3)   # True  — сгенерирован автоматически
print(v1 >= v2)   # False — сгенерирован автоматически

versions = [v2, v1, Version(1, 5, 0)]
print(sorted(versions))  # [1.0.0, 1.5.0, 2.3.1]`,
  },
  {
    name: "functools.cmp_to_key(func)",
    description:
      "Преобразует функцию сравнения старого стиля (принимающую два аргумента и возвращающую отрицательное число, ноль или положительное) в объект ключа, совместимый с sort() и sorted(). Используется для миграции кода с Python 2 или при работе с API, предоставляющим компараторы в стиле C.",
    syntax: "functools.cmp_to_key(mycmp)",
    arguments: [
      {
        name: "mycmp",
        description:
          "Функция двух аргументов (a, b): возвращает отрицательное число если a < b, ноль если a == b, положительное если a > b.",
      },
    ],
    example: `import functools

# Сортировка строк по длине, при равной длине — лексикографически
def compare(a, b):
    if len(a) != len(b):
        return len(a) - len(b)   # короткие раньше
    return (a > b) - (a < b)     # лексикографически

words = ['banana', 'kiwi', 'apple', 'fig', 'pear', 'plum']
words.sort(key=functools.cmp_to_key(compare))
print(words)
# ['fig', 'kiwi', 'pear', 'plum', 'apple', 'banana']

# Натуральная сортировка чисел внутри строк
import re
def natural_cmp(a, b):
    parts_a = [int(t) if t.isdigit() else t for t in re.split(r'(\\d+)', a)]
    parts_b = [int(t) if t.isdigit() else t for t in re.split(r'(\\d+)', b)]
    return (parts_a > parts_b) - (parts_a < parts_b)

files = ['file10.txt', 'file2.txt', 'file1.txt']
files.sort(key=functools.cmp_to_key(natural_cmp))
print(files)  # ['file1.txt', 'file2.txt', 'file10.txt']`,
  },

  // ─── contextlib ───────────────────────────────────────────────────────────
  {
    name: "contextlib.contextmanager(func)",
    description:
      "Декоратор, превращающий генераторную функцию с единственным yield в контекстный менеджер, пригодный для использования с with. Код до yield выполняется при входе в блок, код после yield — при выходе (в том числе при исключении). Устраняет необходимость создавать класс с __enter__ и __exit__.",
    syntax: "@contextlib.contextmanager\ndef manager(): ...",
    arguments: [
      {
        name: "func",
        description:
          "Генераторная функция с ровно одним yield. Значение yield становится переменной as-блока.",
      },
    ],
    example: `import contextlib
import time

@contextlib.contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield          # управление передаётся в блок with
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}с")

with timer("сортировка"):
    data = sorted(range(100_000), reverse=True)

# Контекстный менеджер с ресурсом
@contextlib.contextmanager
def managed_connection(dsn):
    conn = open_connection(dsn)
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()`,
  },
  {
    name: "contextlib.ExitStack()",
    description:
      "Контекстный менеджер, позволяющий динамически собирать произвольное количество контекстных менеджеров и колбэков для вызова при выходе. Решает проблему вложенных with-блоков переменной длины: число и состав ресурсов могут быть неизвестны заранее. Регистрация через .enter_context(), .callback() и .push().",
    syntax: "with contextlib.ExitStack() as stack: ...",
    arguments: [],
    example: `import contextlib

# Открыть переменное число файлов
filenames = ['a.txt', 'b.txt', 'c.txt']

with contextlib.ExitStack() as stack:
    files = [stack.enter_context(open(f, 'w')) for f in filenames]
    for i, f in enumerate(files):
        f.write(f"содержимое файла {i}\\n")
# все три файла закрыты при выходе из блока

# Регистрация произвольного колбэка
with contextlib.ExitStack() as stack:
    stack.callback(print, "колбэк 1 вызван")
    stack.callback(print, "колбэк 2 вызван")
    print("внутри блока")
# внутри блока
# колбэк 2 вызван  (LIFO-порядок)
# колбэк 1 вызван`,
  },
  {
    name: "contextlib.closing(thing)",
    description:
      "Контекстный менеджер, гарантирующий вызов метода .close() у переданного объекта при выходе из блока with, даже если возникло исключение. Удобен для объектов, у которых есть .close(), но которые сами не реализуют протокол контекстного менеджера.",
    syntax: "with contextlib.closing(thing) as thing: ...",
    arguments: [
      {
        name: "thing",
        description:
          "Любой объект, имеющий метод .close(). Возвращается из блока as без изменений.",
      },
    ],
    example: `import contextlib
import urllib.request

# Объект без поддержки with — closing добавляет её
url = 'https://example.com'
with contextlib.closing(urllib.request.urlopen(url)) as page:
    content = page.read(200)
    print(content[:50])
# page.close() вызван автоматически

# Кастомный класс без __enter__/__exit__
class Connection:
    def query(self, sql): return f"result of: {sql}"
    def close(self): print("соединение закрыто")

with contextlib.closing(Connection()) as conn:
    print(conn.query("SELECT 1"))
# SELECT 1 выполнен, затем: соединение закрыто`,
  },
  {
    name: "contextlib.suppress(*exceptions)",
    description:
      "Контекстный менеджер, молча подавляющий указанные типы исключений внутри блока with. Если исключение указанного типа возникает — оно игнорируется и выполнение продолжается после блока. Более читаемая альтернатива блоку try/except: pass для ожидаемых и безопасных ошибок.",
    syntax: "with contextlib.suppress(*exceptions): ...",
    arguments: [
      {
        name: "*exceptions",
        description:
          "Одно или несколько классов исключений, которые следует подавлять. Остальные исключения распространяются как обычно.",
      },
    ],
    example: `import contextlib
import os

# Удалить файл, если он существует — без проверки наличия
with contextlib.suppress(FileNotFoundError):
    os.remove('temp.txt')

# Эквивалентно, но менее читаемо:
# try:
#     os.remove('temp.txt')
# except FileNotFoundError:
#     pass

# Несколько типов исключений
data = {'key': 'not_a_number'}
with contextlib.suppress(KeyError, ValueError):
    value = int(data['missing_key'])
    print(value)
# KeyError подавлен, выполнение продолжается

# Полезно в циклах — пропустить проблемные элементы
for item in ['1', 'two', '3', None, '5']:
    with contextlib.suppress(TypeError, ValueError):
        print(int(item))
# 1, 3, 5`,
  },
  {
    name: "contextlib.redirect_stdout(new_target)",
    description:
      "Контекстный менеджер, временно перенаправляющий sys.stdout в указанный файлоподобный объект на время выполнения блока with. Используется для захвата вывода функций, которые явно пишут в stdout и не предоставляют возможности вернуть результат.",
    syntax: "with contextlib.redirect_stdout(new_target): ...",
    arguments: [
      {
        name: "new_target",
        description:
          "Файлоподобный объект с методом write(), куда будет направляться вывод. Чаще всего io.StringIO() для захвата в строку.",
      },
    ],
    example: `import contextlib
import io

# Захват вывода функции в строку
output = io.StringIO()
with contextlib.redirect_stdout(output):
    help(print)           # help пишет в stdout — захватываем
    print("тест захвата")

captured = output.getvalue()
print(f"Захвачено {len(captured)} символов")
print(captured[:80])

# Перенаправление в файл
with open('output.log', 'w') as f:
    with contextlib.redirect_stdout(f):
        print("Это попадёт в файл, а не на экран")

print("Это снова выводится на экран")  # stdout восстановлен`,
  },
  {
    name: "contextlib.asynccontextmanager(func)",
    description:
      "Асинхронная версия @contextmanager для использования в async with-блоках. Декорирует асинхронную генераторную функцию (async def с yield), превращая её в асинхронный контекстный менеджер, реализующий __aenter__ и __aexit__. Необходим для управления ресурсами в асинхронном коде.",
    syntax: "@contextlib.asynccontextmanager\nasync def manager(): ...",
    arguments: [
      {
        name: "func",
        description:
          "Асинхронная генераторная функция (async def) с ровно одним yield. Может использовать await как до, так и после yield.",
      },
    ],
    example: `import contextlib
import asyncio

@contextlib.asynccontextmanager
async def async_timer(label):
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}с")

@contextlib.asynccontextmanager
async def managed_session(url):
    # Имитация асинхронного открытия сессии
    print(f"открываю сессию -> {url}")
    session = {"url": url, "active": True}
    try:
        yield session
    finally:
        session["active"] = False
        print("сессия закрыта")

async def main():
    async with async_timer("запрос"):
        async with managed_session("https://api.example.com") as s:
            await asyncio.sleep(0.1)  # имитация запроса
            print(f"работаю с сессией: {s['url']}")

asyncio.run(main())`,
  },

  // ─── inspect ──────────────────────────────────────────────────────────────
  {
    name: "inspect.signature(obj, *, follow_wrapped=True)",
    description:
      "Возвращает объект Signature, описывающий параметры вызываемого объекта: имена, аннотации, значения по умолчанию и вид (positional-only, keyword-only и т.д.). Основа для создания декораторов, валидаторов и инструментов документирования, которым нужна информация о сигнатуре функции.",
    syntax: "inspect.signature(obj, *, follow_wrapped=True)",
    arguments: [
      {
        name: "obj",
        description:
          "Вызываемый объект: функция, метод, класс, lambda или объект с __call__.",
      },
      {
        name: "follow_wrapped",
        description:
          "Если True (по умолчанию), разворачивает декораторы через __wrapped__ для получения оригинальной сигнатуры. При False возвращается сигнатура обёртки.",
      },
    ],
    example: `import inspect

def greet(name: str, greeting: str = 'Hello') -> str:
    return f"{greeting}, {name}!"

sig = inspect.signature(greet)
print(sig)                          # (name: str, greeting: str = 'Hello') -> str

for name, param in sig.parameters.items():
    print(f"{name}: kind={param.kind.name}, default={param.default!r}")

# Привязка аргументов — как их получит функция
bound = sig.bind('Alice', greeting='Hi')
bound.apply_defaults()
print(bound.arguments)              # {'name': 'Alice', 'greeting': 'Hi'}

# Проверка совместимости аргументов
try:
    sig.bind()                      # не хватает обязательного name
except TypeError as e:
    print(e)`,
  },
  {
    name: "inspect.getmro(cls)",
    description:
      "Возвращает кортеж классов, составляющих MRO (Method Resolution Order) — порядок поиска методов по иерархии наследования в соответствии с алгоритмом C3. Первым всегда идёт сам класс, последним — object. Эквивалентно атрибуту cls.__mro__, но доступно через inspect.",
    syntax: "inspect.getmro(cls)",
    arguments: [
      {
        name: "cls",
        description:
          "Класс, для которого нужно получить порядок разрешения методов.",
      },
    ],
    example: `import inspect

class A:
    def method(self): return 'A'

class B(A):
    def method(self): return 'B'

class C(A):
    def method(self): return 'C'

class D(B, C):
    pass

mro = inspect.getmro(D)
print([cls.__name__ for cls in mro])
# ['D', 'B', 'C', 'A', 'object']

# При вызове D().method() Python пойдёт слева направо
print(D().method())   # 'B'

# Найти первый класс, реализующий метод
for cls in inspect.getmro(D):
    if 'method' in cls.__dict__:
        print(f"метод найден в: {cls.__name__}")
        break   # B`,
  },
  {
    name: "inspect.getsource(object)",
    description:
      "Возвращает исходный код объекта (функции, метода, класса, модуля или декоратора) в виде строки. Читает исходный .py-файл с диска. Вызывает OSError если исходник недоступен (C-расширения, интерактивная сессия, .pyc без .py).",
    syntax: "inspect.getsource(object)",
    arguments: [
      {
        name: "object",
        description:
          "Модуль, класс, метод, функция, traceback, frame или объект кода, чей исходный код нужно получить.",
      },
    ],
    example: `import inspect

def factorial(n):
    """Вычисляет n! рекурсивно."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Получить исходный код функции
src = inspect.getsource(factorial)
print(src)

# Исходник класса целиком
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

print(inspect.getsource(Point))

# Имя файла и номер строки
print(inspect.getfile(factorial))
print(inspect.getsourcelines(factorial))   # ([строки], номер_начала)`,
  },
  {
    name: "inspect.iscoroutine(object)",
    description:
      "Возвращает True, если объект является корутиной — результатом вызова async def функции (объект типа coroutine). Отличие от isawaitable: проверяет именно корутины, не генераторы с send() или объекты с __await__.",
    syntax: "inspect.iscoroutine(object)",
    arguments: [
      {
        name: "object",
        description: "Любой Python-объект для проверки.",
      },
    ],
    example: `import inspect
import asyncio

async def fetch(url):
    await asyncio.sleep(0)
    return f"data from {url}"

# Функция — ещё не корутина
print(inspect.iscoroutine(fetch))          # False
print(inspect.iscoroutinefunction(fetch))  # True

# Вызов создаёт корутину
coro = fetch("https://example.com")
print(inspect.iscoroutine(coro))           # True

# Обычная функция — не корутина
def sync_func(): pass
print(inspect.iscoroutine(sync_func()))    # False

# Важно: не запускаем корутину через run — закрываем явно
coro.close()`,
  },
  {
    name: "inspect.isawaitable(object)",
    description:
      "Возвращает True, если объект можно использовать в выражении await: корутины, объекты с методом __await__, и генераторы, помеченные @asyncio.coroutine (устар.). Более широкая проверка, чем iscoroutine — охватывает все awaitable-типы.",
    syntax: "inspect.isawaitable(object)",
    arguments: [
      {
        name: "object",
        description: "Любой Python-объект для проверки на поддержку await.",
      },
    ],
    example: `import inspect
import asyncio

async def coro_func():
    return 42

# Корутина — awaitable
coro = coro_func()
print(inspect.isawaitable(coro))   # True
coro.close()

# asyncio.Future — awaitable через __await__
loop = asyncio.new_event_loop()
future = loop.create_future()
print(inspect.isawaitable(future)) # True
loop.close()

# asyncio.Task — awaitable
async def main():
    task = asyncio.create_task(coro_func())
    print(inspect.isawaitable(task))  # True
    await task

# Обычные объекты — не awaitable
print(inspect.isawaitable(42))       # False
print(inspect.isawaitable("hello"))  # False`,
  },
  {
    name: "inspect.getannotations(obj)",
    description:
      "Безопасно возвращает словарь аннотаций объекта (функции, класса или модуля). В отличие от прямого обращения к __annotations__, корректно обрабатывает наследование классов и не возвращает аннотации родительского класса как свои. Добавлен в Python 3.10.",
    syntax:
      "inspect.get_annotations(obj, *, globals=None, locals=None, eval_str=False)",
    arguments: [
      {
        name: "obj",
        description: "Функция, класс или модуль, чьи аннотации нужно получить.",
      },
      {
        name: "eval_str",
        description:
          "Если True, строковые аннотации (from __future__ import annotations) вычисляются и возвращаются как типы. По умолчанию False.",
      },
    ],
    example: `import inspect

class Base:
    x: int

class Child(Base):
    y: str

# __annotations__ унаследует родительские — get_annotations нет
print(Child.__annotations__)                    # {'y': <class 'str'>}
print(inspect.get_annotations(Child))           # {'y': <class 'str'>}

# Аннотации функции
def process(name: str, count: int = 1) -> list[str]:
    pass

ann = inspect.get_annotations(process)
print(ann)   # {'name': <class 'str'>, 'count': <class 'int'>, 'return': list[str]}

# Вычисление строковых аннотаций
def lazy(x: 'int | None') -> 'str':
    pass

print(inspect.get_annotations(lazy, eval_str=True))
# {'x': int | None, 'return': <class 'str'>}`,
  },

  // ─── dataclasses ──────────────────────────────────────────────────────────
  {
    name: "dataclasses.dataclass(*, init=True, repr=True, eq=True, order=False, unsafe_hash=False, frozen=False)",
    description:
      "Декоратор класса, автоматически генерирующий специальные методы (__init__, __repr__, __eq__ и другие) на основе аннотированных полей. Устраняет шаблонный код и делает классы данных компактными и читаемыми. Может создавать неизменяемые (frozen), упорядочиваемые (order) и хэшируемые объекты.",
    syntax:
      "@dataclasses.dataclass(*, init=True, repr=True, eq=True, order=False, unsafe_hash=False, frozen=False)",
    arguments: [
      {
        name: "init",
        description:
          "Генерировать __init__ из аннотированных полей. По умолчанию True.",
      },
      {
        name: "repr",
        description:
          "Генерировать __repr__, показывающий имя класса и значения полей. По умолчанию True.",
      },
      {
        name: "eq",
        description:
          "Генерировать __eq__, сравнивающий экземпляры по значениям полей. По умолчанию True.",
      },
      {
        name: "order",
        description:
          "Генерировать __lt__, __le__, __gt__, __ge__ для упорядочивания. По умолчанию False.",
      },
      {
        name: "frozen",
        description:
          "Запретить изменение полей после создания (имитация неизменяемости). При попытке присвоения вызывается FrozenInstanceError.",
      },
    ],
    example: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
    label: str = ''      # поле со значением по умолчанию

p1 = Point(1.0, 2.0)
p2 = Point(1.0, 2.0)
print(p1)                # Point(x=1.0, y=2.0, label='')
print(p1 == p2)          # True  (__eq__ сгенерирован)

# Упорядочиваемый и неизменяемый датакласс
@dataclass(order=True, frozen=True)
class Version:
    major: int
    minor: int
    patch: int = 0

versions = [Version(2,0), Version(1,9,1), Version(1,10)]
print(sorted(versions))
# [Version(1,9,1), Version(1,10,0), Version(2,0,0)]`,
  },
  {
    name: "dataclasses.field(*, default=MISSING, default_factory=MISSING, init=True, repr=True, hash=None, compare=True, metadata=None)",
    description:
      "Позволяет задать расширенные параметры для отдельного поля датакласса. Обязателен когда нужно: указать изменяемое значение по умолчанию (список, словарь) через default_factory; исключить поле из __init__, __repr__ или сравнения; прикрепить произвольные метаданные.",
    syntax: "dataclasses.field(**options)",
    arguments: [
      {
        name: "default",
        description:
          "Скалярное значение по умолчанию. Нельзя использовать для изменяемых объектов — используйте default_factory.",
      },
      {
        name: "default_factory",
        description:
          "Функция без аргументов, вызываемая для получения значения по умолчанию. Используйте для list, dict, set и других изменяемых типов.",
      },
      {
        name: "init",
        description:
          "Включать ли поле в генерируемый __init__. По умолчанию True.",
      },
      {
        name: "repr",
        description:
          "Включать ли поле в генерируемый __repr__. По умолчанию True.",
      },
      {
        name: "compare",
        description:
          "Использовать ли поле в __eq__ и методах сравнения. По умолчанию True.",
      },
      {
        name: "metadata",
        description:
          "Произвольный словарь с метаданными поля (например, для схем валидации). Доступен через dataclasses.fields().",
      },
    ],
    example: `from dataclasses import dataclass, field

@dataclass
class Config:
    name: str
    tags: list[str] = field(default_factory=list)
    _cache: dict   = field(default_factory=dict, init=False, repr=False)
    weight: float  = field(default=1.0, metadata={'unit': 'kg', 'min': 0})

c = Config('server', ['prod', 'eu'])
print(c)           # Config(name='server', tags=['prod', 'eu'], weight=1.0)
print(c._cache)    # {}  — не в repr, не в __init__

# Метаданные поля
import dataclasses
weight_field = next(f for f in dataclasses.fields(Config) if f.name == 'weight')
print(weight_field.metadata)   # {'unit': 'kg', 'min': 0}`,
  },
  {
    name: "dataclasses.asdict(obj, *, dict_factory=dict)",
    description:
      "Рекурсивно преобразует экземпляр датакласса в словарь, где ключи — имена полей. Вложенные датаклассы, списки и кортежи также рекурсивно преобразуются. Полезно для сериализации в JSON, передачи в ORM или логирования.",
    syntax: "dataclasses.asdict(obj, *, dict_factory=dict)",
    arguments: [
      {
        name: "obj",
        description: "Экземпляр датакласса для преобразования.",
      },
      {
        name: "dict_factory",
        description:
          "Вызываемый объект, принимающий список пар (ключ, значение) и возвращающий коллекцию. По умолчанию dict; можно передать OrderedDict или собственный тип.",
      },
    ],
    example: `from dataclasses import dataclass, asdict

@dataclass
class Address:
    city: str
    country: str

@dataclass
class Person:
    name: str
    age: int
    address: Address

p = Person('Alice', 30, Address('Moscow', 'Russia'))

d = asdict(p)
print(d)
# {'name': 'Alice', 'age': 30, 'address': {'city': 'Moscow', 'country': 'Russia'}}

# Готово для JSON-сериализации
import json
print(json.dumps(d, ensure_ascii=False))

# Вложенные списки датаклассов тоже преобразуются
@dataclass
class Team:
    members: list[Person]

team = Team([p, Person('Bob', 25, Address('SPb', 'Russia'))])
print(asdict(team)['members'][0]['name'])   # Alice`,
  },
  {
    name: "dataclasses.astuple(obj, *, tuple_factory=tuple)",
    description:
      "Рекурсивно преобразует экземпляр датакласса в кортеж значений полей в порядке их объявления. Вложенные датаклассы также рекурсивно превращаются в кортежи. Удобно для распаковки, передачи в функции с позиционными аргументами или работы с CSV.",
    syntax: "dataclasses.astuple(obj, *, tuple_factory=tuple)",
    arguments: [
      {
        name: "obj",
        description: "Экземпляр датакласса для преобразования.",
      },
      {
        name: "tuple_factory",
        description:
          "Вызываемый объект для создания результирующей коллекции. По умолчанию tuple.",
      },
    ],
    example: `from dataclasses import dataclass, astuple

@dataclass
class RGB:
    r: int
    g: int
    b: int

color = RGB(128, 64, 255)
t = astuple(color)
print(t)             # (128, 64, 255)

# Распаковка
r, g, b = astuple(color)
print(f"red={r}, green={g}, blue={b}")

# Запись в CSV
import csv, io

@dataclass
class Row:
    name: str
    score: int

rows = [Row('Alice', 95), Row('Bob', 82)]
buf = io.StringIO()
writer = csv.writer(buf)
writer.writerows(astuple(row) for row in rows)
print(buf.getvalue())
# Alice,95
# Bob,82`,
  },
  {
    name: "dataclasses.replace(obj, changes)",
    description:
      "Создаёт новый экземпляр датакласса на основе существующего, заменяя указанные поля новыми значениями. Оригинальный объект не изменяется. Особенно полезен для frozen-датаклассов, которые нельзя изменять напрямую.",
    syntax: "dataclasses.replace(obj, **changes)",
    arguments: [
      {
        name: "obj",
        description: "Исходный экземпляр датакласса. Не изменяется.",
      },
      {
        name: "**changes",
        description:
          "Именованные аргументы — поля, которые нужно заменить в новом экземпляре.",
      },
    ],
    example: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str
    port: int
    debug: bool = False

base = Config('localhost', 5432)
print(base)   # Config(host='localhost', port=5432, debug=False)

# Создать новый конфиг с изменённым портом
prod = replace(base, host='db.prod.example.com', port=5433)
print(prod)   # Config(host='db.prod.example.com', port=5433, debug=False)

# Оригинал не изменился
print(base)   # Config(host='localhost', port=5432, debug=False)

# Цепочка изменений — паттерн «строитель» для неизменяемых объектов
dev = replace(base, debug=True)
staging = replace(dev, host='staging.example.com')
print(staging)`,
  },
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
];
