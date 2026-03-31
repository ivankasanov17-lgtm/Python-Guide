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
    name: 'abs(x)',
    description: 'Возвращает абсолютное значение числа. Аргументом может быть целое число, число с плавающей точкой или объект, реализующий метод __abs__(). Если аргумент является комплексным числом, возвращается его модуль.',
    syntax: 'abs(x)',
    arguments: [{ name: 'x', description: 'Число, целое, вещественное или комплексное' }],
    example: 'abs(-5)      # 5\nabs(-3.14)   # 3.14\nabs(3+4j)    # 5.0'
  },
  {
    name: 'all(iterable)',
    description: 'Возвращает True, если все элементы итерируемого объекта истинны (или объект пуст). Эквивалентно циклу, который проверяет каждый элемент.',
    syntax: 'all(iterable)',
    arguments: [{ name: 'iterable', description: 'Итерируемый объект (список, кортеж и т.д.)' }],
    example: 'all([True, True, True])   # True\nall([True, False, True])  # False\nall([])                   # True (пустой — тоже True)'
  },
  {
    name: 'any(iterable)',
    description: 'Возвращает True, если хотя бы один элемент итерируемого объекта истинен. Если итерируемый объект пуст, возвращает False.',
    syntax: 'any(iterable)',
    arguments: [{ name: 'iterable', description: 'Итерируемый объект (список, кортеж и т.д.)' }],
    example: 'any([False, False, True])  # True\nany([False, False, False]) # False\nany([])                    # False'
  },
  {
    name: 'ascii(object)',
    description: 'Возвращает строку, содержащую читаемое представление объекта, аналогично repr(). Символы, не входящие в ASCII (не-ASCII), экранируются через \\x, \\u или \\U.',
    syntax: 'ascii(object)',
    arguments: [{ name: 'object', description: 'Любой Python-объект' }],
    example: 'ascii("Hello")      # "\'Hello\'"\nascii("Привет")     # "\'\\u041f\\u0440\\u0438\\u0432\\u0435\\u0442\'"'
  },
  {
    name: 'bin(x)',
    description: 'Преобразует целое число в двоичную строку с префиксом "0b". Результат является корректным Python-выражением. Если x не является объектом int, он должен определять метод __index__(), возвращающий целое число.',
    syntax: 'bin(x)',
    arguments: [{ name: 'x', description: 'Целое число' }],
    example: 'bin(10)   # "0b1010"\nbin(-5)   # "-0b101"\nbin(0)    # "0b0"'
  },
  {
    name: 'bool([x])',
    description: 'Возвращает булево значение, то есть True или False. x преобразуется стандартными процедурами проверки истинности. Если x ложно или опущено, возвращается False; иначе True. bool — это подкласс int.',
    syntax: 'bool([x])',
    arguments: [{ name: 'x', description: 'Необязательный. Любое значение для преобразования в bool' }],
    example: 'bool(0)      # False\nbool(1)      # True\nbool("")     # False\nbool("hi")   # True\nbool()       # False'
  },
  {
    name: 'bytearray([source[, encoding[, errors]]])',
    description: 'Возвращает объект bytearray — изменяемую последовательность целых чисел в диапазоне 0 ≤ x < 256. Может быть создан из строки (с указанием кодировки), итерируемого объекта целых чисел или целого числа (создаёт нулевую последовательность заданной длины).',
    syntax: 'bytearray([source[, encoding[, errors]]])',
    arguments: [
      { name: 'source', description: 'Строка, целое число или итерируемый объект целых чисел' },
      { name: 'encoding', description: 'Кодировка строки (обязательна если source — строка)' },
      { name: 'errors', description: 'Действие при ошибке кодирования: "strict", "ignore", "replace"' }
    ],
    example: 'bytearray(5)                   # bytearray(b\'\\x00\\x00\\x00\\x00\\x00\')\nbytearray("hello", "utf-8")    # bytearray(b\'hello\')\nbytearray([65, 66, 67])        # bytearray(b\'ABC\')'
  },
  {
    name: 'bytes([source[, encoding[, errors]]])',
    description: 'Возвращает объект bytes — неизменяемую последовательность байт. Аргументы такие же как у bytearray. Основное отличие от bytearray: объект bytes является неизменяемым.',
    syntax: 'bytes([source[, encoding[, errors]]])',
    arguments: [
      { name: 'source', description: 'Строка, целое число или итерируемый объект целых чисел' },
      { name: 'encoding', description: 'Кодировка строки (обязательна если source — строка)' },
      { name: 'errors', description: 'Действие при ошибке кодирования: "strict", "ignore", "replace"' }
    ],
    example: 'bytes(5)                   # b\'\\x00\\x00\\x00\\x00\\x00\'\nbytes("hello", "utf-8")    # b\'hello\'\nbytes([65, 66, 67])        # b\'ABC\''
  },
  {
    name: 'callable(object)',
    description: 'Возвращает True, если объект является вызываемым (callable), иначе False. Если функция возвращает True, вызов всё равно может завершиться неудачей, но если False — вызов объекта точно не удастся. Классы — вызываемые объекты (вызов создаёт новый экземпляр). Экземпляры класса вызываемы если класс определяет метод __call__().',
    syntax: 'callable(object)',
    arguments: [{ name: 'object', description: 'Любой Python-объект' }],
    example: 'callable(len)       # True\ncallable(42)        # False\ncallable(str)       # True  (класс)\n\nclass Foo:\n    def __call__(self): pass\ncallable(Foo())     # True'
  },
  {
    name: 'chr(i)',
    description: 'Возвращает строку, представляющую символ, соответствующий кодовой точке Unicode i. Например, chr(97) возвращает "a", chr(8364) возвращает "€". Обратная функция — ord(). Допустимый диапазон: 0 до 1 114 111 (0x10FFFF).',
    syntax: 'chr(i)',
    arguments: [{ name: 'i', description: 'Целое число — кодовая точка Unicode (от 0 до 1114111)' }],
    example: 'chr(97)      # "a"\nchr(65)      # "A"\nchr(8364)    # "€"\nchr(1055)    # "П"'
  },
  {
    name: 'classmethod(function)',
    description: `classmethod — это дескриптор, преобразующий обычный метод в метод класса. Метод класса получает первым аргументом сам класс (обычно называемый cls), а не экземпляр (self). Это означает, что такой метод можно вызывать как через экземпляр класса, так и напрямую через сам класс.

Методы класса часто используются как альтернативные конструкторы. Например, dict.fromkeys() — это classmethod, создающий словарь из ключей. Другое применение — переопределение фабричных методов в подклассах с сохранением правильного типа.

Начиная с Python 3.9, classmethod можно применять поверх других дескрипторов (например, property). С Python 3.10 методы класса также могут быть цепочечно декорированы с помощью @staticmethod.

Важное отличие от staticmethod: classmethod всегда получает класс как первый аргумент, тогда как staticmethod не получает ни класса, ни экземпляра.`,
    syntax: '@classmethod\ndef method(cls, ...): ...',
    arguments: [
      { name: 'function', description: 'Функция, которая будет преобразована в метод класса. Первым параметром должен быть cls (класс)' }
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
print(type(sd))  # <class '__main__.SpecialDate'>`
  },
  {
    name: 'compile(source, filename, mode, flags, dont_inherit, optimize)',
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
    syntax: 'compile(source, filename, mode, flags=0, dont_inherit=False, optimize=-1)',
    arguments: [
      { name: 'source', description: 'Строка, байтовая строка или объект AST с исходным кодом Python' },
      { name: 'filename', description: 'Имя файла, из которого считан код. Используется в сообщениях об ошибках. Если кода нет в файле, используйте "<string>"' },
      { name: 'mode', description: 'Режим компиляции: "exec" (блок операторов), "eval" (одно выражение), "single" (один интерактивный оператор)' },
      { name: 'flags', description: 'Необязательный. Битовые флаги, управляющие влиянием future-операторов на компиляцию' },
      { name: 'dont_inherit', description: 'Необязательный. Если True, future-операторы из места вызова compile() не наследуются' },
      { name: 'optimize', description: 'Необязательный. Уровень оптимизации: -1 (по умолчанию), 0, 1 или 2' }
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
print(ast.dump(tree))  # Expression(body=BinOp(...))`
  },
  {
    name: 'complex([real[, imag]])',
    description: `Создаёт комплексное число вида real + imag*j. Комплексные числа в Python имеют тип complex.

Функция может быть вызвана несколькими способами:
- Без аргументов: возвращает 0j
- С одним числовым аргументом: возвращает complex(real, 0)
- С двумя числовыми аргументами: возвращает complex(real, imag)
- Со строковым аргументом: разбирает строку как комплексное число (в этом случае второй аргумент недопустим)

Строковые представления: "1+2j", "1+2J", "3j", "-1.5+0.5j" и т.д. Пробелы вокруг + или - в строке не допускаются.

Если объект реализует метод __complex__(), он будет использован. Если __complex__() не определён, но определён __float__() или __index__(), используются они для получения вещественной части.

Для работы с комплексными числами используются атрибуты .real и .imag, а также метод .conjugate().`,
    syntax: 'complex([real=0[, imag=0]])',
    arguments: [
      { name: 'real', description: 'Необязательный. Вещественная часть комплексного числа или строка для разбора. По умолчанию 0' },
      { name: 'imag', description: 'Необязательный. Мнимая часть комплексного числа. По умолчанию 0. Нельзя передавать при строковом аргументе real' }
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
print(abs(c))       # 5.0  (модуль числа)`
  },
  {
    name: 'delattr(object, name)',
    description: `Удаляет именованный атрибут у объекта. Является динамическим эквивалентом оператора del. delattr(obj, 'x') полностью эквивалентно del obj.x.

Функция вызывает AttributeError, если атрибут не существует или не может быть удалён. Важно понимать, что delattr() работает с экземплярами, а не с самим классом — то есть удаляет атрибут именно у конкретного объекта.

При попытке удалить атрибут у объекта, у которого он определён на уровне класса (а не у экземпляра), Python удалит атрибут экземпляра (если он существует), открыв доступ к атрибуту класса.

Если класс реализует __delattr__(self, name), именно этот метод будет вызван при delattr().

Парные функции: getattr() — получить атрибут, setattr() — установить атрибут, hasattr() — проверить наличие атрибута.`,
    syntax: 'delattr(object, name)',
    arguments: [
      { name: 'object', description: 'Объект, у которого нужно удалить атрибут' },
      { name: 'name', description: 'Строка с именем атрибута, который нужно удалить' }
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
# delattr(obj, "id")  # AttributeError: Нельзя удалить атрибут 'id'`
  },
  {
    name: 'dict([mapping or iterable])',
    description: `Создаёт новый словарь (объект типа dict). Словари — это изменяемые отображения, хранящие пары ключ-значение. Ключи должны быть хэшируемыми (неизменяемыми).

Функцию dict() можно вызвать несколькими способами:
- Без аргументов: создаёт пустой словарь {}
- Из другого словаря или маппинга: копирует пары ключ-значение
- Из итерируемого объекта пар (итерируемых объектов длиной 2): dict([('a', 1), ('b', 2)])
- Через именованные аргументы: dict(a=1, b=2)
- Комбинацией маппинга и именованных аргументов

Словари в Python 3.7+ гарантируют сохранение порядка вставки (insertion order). Операции O(1) для получения, добавления, обновления и удаления элементов.

Подробнее о методах словарей: .keys(), .values(), .items(), .get(), .update(), .pop(), .setdefault() и т.д.`,
    syntax: 'dict(**kwargs)\ndict(mapping, **kwargs)\ndict(iterable, **kwargs)',
    arguments: [
      { name: '**kwargs', description: 'Именованные аргументы, становящиеся ключами и значениями словаря' },
      { name: 'mapping', description: 'Другой словарь или объект-маппинг, из которого копируются пары ключ-значение' },
      { name: 'iterable', description: 'Итерируемый объект из пар (ключ, значение) — например, список кортежей' }
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
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}`
  },
  {
    name: 'dir([object])',
    description: `Возвращает список имён в текущей локальной области видимости или список атрибутов объекта.

Без аргументов dir() возвращает имена всех имён, определённых в текущей области видимости (локальной области).

С аргументом поведение зависит от типа объекта:
- Для обычного объекта — возвращает список его атрибутов и методов, включая унаследованные
- Для модуля — возвращает список его атрибутов
- Для типа/класса — возвращает список атрибутов класса и всех его базовых классов (в порядке MRO)

Список отсортирован в алфавитном порядке. Если объект реализует метод __dir__(), именно его результат будет возвращён (после преобразования в список и сортировки).

Функция полезна для интерактивного исследования объектов в REPL, для документирования API, а также при реализации автодополнения.

Важно: dir() предназначен для удобного использования в интерактивном режиме. Он не гарантирует полноты — вывод зависит от реализации __dir__() или __dict__.`,
    syntax: 'dir([object])',
    arguments: [
      { name: 'object', description: 'Необязательный. Объект, атрибуты которого нужно перечислить. Если не указан — возвращает имена в текущей области видимости' }
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
print(dir(os))  # все атрибуты модуля os`
  },
  {
    name: 'divmod(a, b)',
    description: `Принимает два числа и возвращает пару (кортеж) из их частного и остатка от деления. Для целых чисел результат тот же, что и (a // b, a % b).

Функция работает как с целыми числами, так и с числами с плавающей точкой:
- Для целых чисел: возвращает (q, r), где a == b * q + r и 0 <= r < abs(b)
- Для чисел с плавающей точкой: возвращает (q, r), где q — это math.floor(a / b)

Важные свойства:
- Если b == 0, возникает ZeroDivisionError
- Знак остатка всегда совпадает со знаком делителя b (не делимого a)
- Для float-чисел q — это всегда целое число, но имеет тип float

Функция удобна при работе с временными интервалами (часы/минуты), денежными суммами (рубли/копейки), при реализации алгоритмов с делением с остатком (алгоритм Евклида, НОД) и т.д.`,
    syntax: 'divmod(a, b)',
    arguments: [
      { name: 'a', description: 'Делимое — целое или вещественное число' },
      { name: 'b', description: 'Делитель — целое или вещественное число (не ноль)' }
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
print(gcd(48, 18))  # 6`
  },
  {
    name: 'enumerate(iterable[, start])',
    description: `Возвращает объект-перечислитель (enumerate object), который при итерации выдаёт кортежи вида (индекс, элемент).

Очень часто при обходе итерируемого объекта нужно знать как сам элемент, так и его позицию. Вместо ручного счётчика enumerate() делает код чище и идиоматичнее.

Параметр start (по умолчанию 0) задаёт начальное значение счётчика. Это полезно, если нумерация должна начинаться с 1 или с любого другого числа.

enumerate() возвращает ленивый итератор — элементы вычисляются по мере обхода, что эффективно по памяти для больших последовательностей.

Объект enumerate поддерживает протокол итератора: next() и iter(). Его можно передать в list() для получения списка кортежей, или распаковать в цикле.`,
    syntax: 'enumerate(iterable, start=0)',
    arguments: [
      { name: 'iterable', description: 'Любой итерируемый объект: список, строка, кортеж, генератор и т.д.' },
      { name: 'start', description: 'Необязательный. Начальное значение счётчика. По умолчанию 0' }
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
print(positions)  # [0, 3, 5, 7, 10]`
  },
  {
    name: 'eval(expression[, globals[, locals]])',
    description: `Выполняет строку с Python-выражением и возвращает результат его вычисления. Выражение разбирается и вычисляется в контексте переданных словарей globals и locals.

Важные детали:
- eval() принимает только одно выражение, а не операторы. Для выполнения операторов (присваивания, циклов и т.д.) используйте exec()
- Если globals не указан, используется текущий __globals__ вызывающего кода
- Если locals не указан, используется текущий locals()
- Если передан только globals, он используется и как locals

Безопасность: eval() с непроверенным вводом от пользователя крайне опасен! Он может выполнить произвольный код. Для безопасного разбора данных используйте ast.literal_eval(), который поддерживает только литералы Python (числа, строки, списки, словари, кортежи, множества, None, True, False).

Аргумент expression может также быть объектом кода, возвращённым compile() в режиме "eval".`,
    syntax: 'eval(expression[, globals[, locals]])',
    arguments: [
      { name: 'expression', description: 'Строка с Python-выражением или объект кода (compile() с режимом "eval")' },
      { name: 'globals', description: 'Необязательный. Словарь, используемый как глобальное пространство имён. Если не указан — используется текущее' },
      { name: 'locals', description: 'Необязательный. Словарь, используемый как локальное пространство имён. Если не указан — используется текущее' }
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
# ast.literal_eval("__import__('os').system('ls')")  # ValueError — защита`
  },
  {
    name: 'exec(object[, globals[, locals]])',
    description: `Динамически выполняет Python-код. В отличие от eval(), который поддерживает только выражения, exec() принимает произвольный блок кода: операторы, функции, классы, циклы, присваивания и т.д.

Аргумент object может быть:
- Строкой с Python-кодом
- Объектом bytes или bytearray с исходным кодом
- Объектом кода, созданным compile()

Если globals и locals не переданы, код выполняется в текущем пространстве имён. Если передан только globals — он используется и как locals. Оба должны быть словарями (locals также может быть маппингом).

Важно: exec() всегда возвращает None. Переменные, определённые внутри exec(), по умолчанию не доступны в вызывающем коде, если не использовать явную передачу словаря.

Безопасность: как и eval(), exec() с пользовательским вводом крайне опасен. Выполняйте только доверенный код. Никогда не передавайте пользовательский ввод без проверки.`,
    syntax: 'exec(object[, globals[, locals]])',
    arguments: [
      { name: 'object', description: 'Строка с Python-кодом, байтовая строка или объект кода (compile())' },
      { name: 'globals', description: 'Необязательный. Словарь глобальных переменных. Если не указан — текущее глобальное пространство' },
      { name: 'locals', description: 'Необязательный. Словарь локальных переменных. Если не указан — используется globals' }
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
print(dog.speak())  # Rex говорит: ...`
  },
  {
    name: 'filter(function, iterable)',
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
    syntax: 'filter(function, iterable)',
    arguments: [
      { name: 'function', description: 'Функция-предикат, возвращающая True/False для каждого элемента. Если None — фильтрует ложные значения' },
      { name: 'iterable', description: 'Итерируемый объект, элементы которого будут проверяться функцией' }
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
print(adults)   # [18, 25, 30]`
  },
  {
    name: 'float([x])',
    description: `Создаёт число с плавающей точкой (тип float) из числа или строки.

Допустимые строковые форматы:
- Десятичное число: "3.14", "-2.5", "+1.0"
- Экспоненциальная запись: "1.5e10", "2.3E-4"
- Специальные значения: "inf", "-inf", "nan", "infinity" (без учёта регистра)
- Начальные и конечные пробелы игнорируются

Если x не указан, возвращает 0.0. Если строка не может быть разобрана, возникает ValueError.

Тип float в Python реализует IEEE 754 с двойной точностью (64-бит), что даёт около 15-17 значимых десятичных цифр. Из-за особенностей двоичного представления некоторые числа не могут быть представлены точно (0.1 + 0.2 != 0.3).

Для высокоточных вычислений используйте модуль decimal. Для работы с дробями — модуль fractions.`,
    syntax: 'float([x=0.0])',
    arguments: [
      { name: 'x', description: 'Необязательный. Число (int, float) или строка для преобразования. По умолчанию 0.0' }
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
math.isnan(float("nan"))  # True`
  },
  {
    name: 'format(value[, format_spec])',
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
    syntax: 'format(value[, format_spec])',
    arguments: [
      { name: 'value', description: 'Значение для форматирования — любой объект, реализующий __format__()' },
      { name: 'format_spec', description: 'Необязательный. Строка формата по мини-языку форматирования Python. По умолчанию ""' }
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
format('hi', '*^10')   # '****hi****'  (заполнитель *)`
  },
  {
    name: 'frozenset([iterable])',
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
    syntax: 'frozenset([iterable])',
    arguments: [
      { name: 'iterable', description: 'Необязательный. Итерируемый объект, элементы которого станут элементами frozenset. Если не указан — создаётся пустое frozenset' }
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
a & b   # frozenset({2, 3})`
  },
  {
    name: 'getattr(object, name[, default])',
    description: `Возвращает значение именованного атрибута объекта. Является динамическим эквивалентом получения атрибута через точечную нотацию object.name.

getattr(obj, 'x') полностью эквивалентно obj.x — разница лишь в том, что имя атрибута передаётся как строка, что позволяет динамически определять имя атрибута во время выполнения.

Параметр default:
- Если атрибут не найден и default не указан, возникает AttributeError
- Если атрибут не найден и default указан, возвращается default
- Это делает getattr() безопасной альтернативой прямому доступу к атрибуту в случаях, когда атрибут может отсутствовать

Последовательность поиска атрибута: data descriptors класса → атрибуты экземпляра → non-data descriptors класса → __getattr__() (если определён).

Парные функции: setattr() — установить атрибут, delattr() — удалить, hasattr() — проверить наличие.`,
    syntax: 'getattr(object, name[, default])',
    arguments: [
      { name: 'object', description: 'Объект, у которого нужно получить атрибут' },
      { name: 'name', description: 'Строка с именем атрибута' },
      { name: 'default', description: 'Необязательный. Значение, возвращаемое если атрибут не найден. Если не указан — возбуждается AttributeError' }
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
    print(f"{attr}: {value}")`
  },
  {
    name: 'globals()',
    description: `Возвращает словарь, представляющий текущее глобальное пространство имён (символьную таблицу глобальных переменных). Для кода в модуле это словарь атрибутов модуля.

Важные особенности:
- globals() всегда возвращает словарь модуля, в котором определена функция — даже если функция вызывается из другого модуля
- Изменение словаря, возвращённого globals(), реально меняет глобальное пространство имён (это настоящий словарь, не копия)
- Словарь всегда содержит специальные ключи: __name__ (имя модуля), __doc__ (документация), __file__ (путь к файлу) и т.д.

Отличие от locals():
- globals() — глобальное пространство имён (уровень модуля), всегда словарь
- locals() — локальное пространство имён (внутри функции), не обязательно является "живым" словарём

Применения: динамическое добавление/изменение переменных, отладка, создание DSL-инструментов, плагинных систем.`,
    syntax: 'globals()',
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
eval("x + y", my_globals)   # 30`
  },
  {
    name: 'hasattr(object, name)',
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
    syntax: 'hasattr(object, name)',
    arguments: [
      { name: 'object', description: 'Объект, у которого проверяется наличие атрибута' },
      { name: 'name', description: 'Строка с именем проверяемого атрибута' }
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
# list поддерживает append`
  },
  {
    name: 'hash(object)',
    description: `Возвращает хэш-значение объекта — целое число, используемое для быстрого сравнения ключей в словарях и множествах.

Ключевые свойства хэш-функции:
- Если a == b, то hash(a) == hash(b) (обязательное условие)
- Обратное неверно: два разных объекта могут иметь одинаковый хэш (коллизия)
- Хэш должен быть стабильным в течение жизни объекта
- Только хэшируемые (неизменяемые) объекты могут быть ключами словаря или элементами set

Хэшируемые типы: int, float, str, bytes, tuple (только если все элементы хэшируемы), frozenset, None, bool, пользовательские классы (по умолчанию хэш основан на id())

Нехэшируемые типы: list, dict, set (они изменяемы). Попытка вызвать hash() на них вызовет TypeError.

Хэш в Python рандомизируется между запусками (PYTHONHASHSEED) для защиты от атак типа Hash DoS. Поэтому нельзя сохранять хэши между запусками программы.`,
    syntax: 'hash(object)',
    arguments: [
      { name: 'object', description: 'Хэшируемый объект — число, строка, кортеж из хэшируемых элементов, или объект с __hash__()' }
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
s = {p}             # можно добавить в set`
  },
  {
    name: 'help([object])',
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
    syntax: 'help([object])',
    arguments: [
      { name: 'object', description: 'Необязательный. Объект, модуль, строка (ключевое слово), для которого нужна справка. Если не указан — запускается интерактивная справочная сессия' }
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

help(MyClass)   # покажет строку документации`
  },
  {
    name: 'hex(x)',
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
    syntax: 'hex(x)',
    arguments: [
      { name: 'x', description: 'Целое число для преобразования в шестнадцатеричную строку' }
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
print(color)               # '#ff8000'`
  },
  {
    name: 'id(object)',
    description: `Возвращает "идентичность" объекта — целое число, гарантированно уникальное среди одновременно существующих объектов. Время жизни объекта — пока он существует.

В стандартной реализации CPython id() возвращает адрес объекта в памяти. Однако это деталь реализации — в других Python-реализациях (PyPy, Jython и т.д.) значение может быть другим.

Оператор is сравнивает именно идентичность объектов: a is b эквивалентно id(a) == id(b).

Важные нюансы:
- Два разных объекта могут иметь одинаковый id() если существуют в разное время (после удаления первого создаётся второй по тому же адресу)
- Маленькие целые числа (-5 до 256) и интернированные строки кэшируются в CPython — для них id() одинаков
- id() использoвать для сравнения значений нельзя (для этого == и is)

Применение: отладка (проверить, один ли это объект или копия), кэширование, логирование жизненного цикла объектов.`,
    syntax: 'id(object)',
    arguments: [
      { name: 'object', description: 'Любой Python-объект' }
    ],
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
print(id(lst))  # то же число! (мутация, не замена)`
  },
  {
    name: 'input([prompt])',
    description: `Читает строку из стандартного ввода (обычно с клавиатуры). Если указан параметр prompt, он выводится в стандартный вывод без перевода строки перед тем, как ожидать ввод.

Поведение:
- Возвращает введённую строку без завершающего символа новой строки
- Если пользователь нажал Enter без ввода текста, возвращает пустую строку ""
- Если достигнут конец файла (EOF), возбуждается EOFError
- Строка prompt выводится в stdout (без буферизации)

Тип возвращаемого значения всегда str. Для числового ввода необходимо явное преобразование: int(input(...)) или float(input(...)).

Если модуль readline был загружен, input() будет поддерживать историю команд и редактирование строки в стиле readline.

Перенаправление ввода: input() читает из sys.stdin, что можно перенаправить для автоматизации или тестирования.`,
    syntax: 'input([prompt])',
    arguments: [
      { name: 'prompt', description: 'Необязательный. Строка-подсказка, выводимая перед ожиданием ввода. По умолчанию — пустая строка (нет подсказки)' }
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
print(name)             # Alice`
  },
  {
    name: 'int([x[, base]])',
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
    syntax: 'int([x=0[, base=10]])',
    arguments: [
      { name: 'x', description: 'Необязательный. Число или строка для преобразования. По умолчанию 0' },
      { name: 'base', description: 'Необязательный. Основание системы счисления (2–36 или 0). По умолчанию 10. Применимо только при строковом x' }
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

int(Temp())      # 42`
  },
  {
    name: 'isinstance(object, classinfo)',
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
    syntax: 'isinstance(object, classinfo)',
    arguments: [
      { name: 'object', description: 'Объект, тип которого проверяется' },
      { name: 'classinfo', description: 'Класс, тип, кортеж классов/типов или (Python 3.10+) union-тип X|Y' }
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
isinstance("hi", Sequence)     # True`
  },
  {
    name: 'issubclass(class, classinfo)',
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
    syntax: 'issubclass(class, classinfo)',
    arguments: [
      { name: 'class', description: 'Класс, для которого проверяется принадлежность к иерархии' },
      { name: 'classinfo', description: 'Класс, кортеж классов или (Python 3.10+) union-тип' }
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
issubclass(dict, Sized)     # True`
  },
  {
    name: 'iter(object[, sentinel])',
    description: `Создаёт итератор из объекта. Функция имеет две различные формы вызова.

Форма 1 — iter(object): object должен реализовывать протокол итератора (__iter__()) или протокол последовательности (__getitem__() с целыми индексами начиная с 0). Иначе — TypeError.

Форма 2 — iter(callable, sentinel): принимает вызываемый объект (callable) и значение-стоп (sentinel). Возвращает итератор, который каждый раз вызывает callable() без аргументов и возвращает результат. Итерация прекращается, когда callable() вернёт значение, равное sentinel.

Это очень мощный паттерн для:
- Чтения данных частями до достижения конца (EOF)
- Опроса источника до получения определённого значения
- Итерации по потоку до маркера окончания

Возвращаемый объект реализует протокол итератора: __iter__() и __next__(). Исчерпанный итератор при вызове next() возбуждает StopIteration.`,
    syntax: 'iter(object)\niter(callable, sentinel)',
    arguments: [
      { name: 'object', description: 'Итерируемый объект (реализующий __iter__) или последовательность (реализующая __getitem__)' },
      { name: 'callable', description: 'Вызываемый объект без аргументов (вторая форма). Вызывается при каждом next()' },
      { name: 'sentinel', description: 'Значение-стоп (вторая форма). Итерация прекращается когда callable() == sentinel' }
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
lines = list(iter(input, ""))`
  },
  {
    name: 'len(s)',
    description: `Возвращает длину (количество элементов) объекта. Аргументом может быть последовательность (строка, байты, кортеж, список, диапазон) или коллекция (словарь, множество, frozenset).

Вызывает метод __len__() объекта. Если объект не реализует __len__(), возникает TypeError.

Особенности:
- Для строк len() возвращает количество символов (Unicode code points), а не байт
- Для словаря — количество пар ключ-значение
- Для range — количество элементов диапазона (вычисляется за O(1))
- len() всегда неотрицателен и вычисляется за O(1) для всех встроенных типов

Важный нюанс для NumPy/pandas: у массивов и DataFrame len() возвращает длину первого измерения (количество строк), а не общее количество элементов.

len() — одна из самых часто используемых функций Python. В сочетании с range() и enumerate() составляет основу большинства циклов.`,
    syntax: 'len(s)',
    arguments: [
      { name: 's', description: 'Объект, реализующий __len__(). Строка, список, кортеж, словарь, множество, range, байтовая строка и т.д.' }
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
if len(lst) == 0: .. # тоже работает, но многословно`
  },
  {
    name: 'list([iterable])',
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
    syntax: 'list([iterable])',
    arguments: [
      { name: 'iterable', description: 'Необязательный. Итерируемый объект, из которого создаётся список. Если не указан — создаётся пустой список []' }
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
lst.index(3)         # 2  (индекс первого вхождения)`
  },
  {
    name: 'locals()',
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
    syntax: 'locals()',
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

func(1, 2)   # {'x': 1, 'y': 2, 'z': 0}`
  },
  {
    name: 'map(function, iterable, ...)',
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
    syntax: 'map(function, iterable, *iterables)',
    arguments: [
      { name: 'function', description: 'Функция, применяемая к каждому элементу. Должна принимать столько аргументов, сколько передано итерируемых' },
      { name: 'iterable', description: 'Один или несколько итерируемых объектов, чьи элементы передаются в function' }
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
next(gen)   # 'B'`
  },
  {
    name: 'max(iterable[, key, default]) / max(arg1, arg2, *args[, key])',
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
    syntax: 'max(iterable, *, key=None, default=<...>)\nmax(arg1, arg2, *args, key=None)',
    arguments: [
      { name: 'iterable / arg1, arg2...', description: 'Итерируемый объект или два и более аргументов для сравнения' },
      { name: 'key', description: 'Необязательный. Функция одного аргумента для определения критерия сравнения' },
      { name: 'default', description: 'Необязательный. Значение при пустом iterable. Только для формы с одним итерируемым' }
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
print(best["name"])           # 'Alice'`
  },
  {
    name: 'min(iterable[, key, default]) / min(arg1, arg2, *args[, key])',
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
    syntax: 'min(iterable, *, key=None, default=<...>)\nmin(arg1, arg2, *args, key=None)',
    arguments: [
      { name: 'iterable / arg1, arg2...', description: 'Итерируемый объект или два и более аргументов для сравнения' },
      { name: 'key', description: 'Необязательный. Функция одного аргумента для определения критерия сравнения' },
      { name: 'default', description: 'Необязательный. Значение при пустом iterable. Только для формы с одним итерируемым' }
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
print(worst["name"])          # 'Bob'`
  },
  {
    name: 'next(iterator[, default])',
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
    syntax: 'next(iterator[, default])',
    arguments: [
      { name: 'iterator', description: 'Объект-итератор, реализующий __next__(). Получить итератор из итерируемого: iter(iterable)' },
      { name: 'default', description: 'Необязательный. Значение, возвращаемое если итератор исчерпан. Если не указан — возбуждается StopIteration' }
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
next(counter)   # 3 (и так до бесконечности)`
  },
  {
    name: 'object()',
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
    syntax: 'object()',
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
print(B.__mro__)  # (<class 'B'>, <class 'A'>, <class 'object'>)`
  },
  {
    name: 'oct(x)',
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
    syntax: 'oct(x)',
    arguments: [
      { name: 'x', description: 'Целое число для преобразования в восьмеричную строку' }
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
# owner: rwx, group: r-x, others: r-x`
  },
  {
    name: 'open(file, mode, buffering, encoding, errors, newline, closefd, opener)',
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
    syntax: "open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None)",
    arguments: [
      { name: 'file', description: 'Путь к файлу (строка, bytes или os.PathLike) или файловый дескриптор (int)' },
      { name: 'mode', description: "Режим открытия: 'r' (чтение), 'w' (запись), 'a' (добавление), 'x' (создание), 'b' (бинарный), '+' (чтение+запись). По умолчанию 'r'" },
      { name: 'buffering', description: 'Политика буферизации: -1 (по умолчанию), 0 (отключена, только binary), 1 (построчная), >1 (размер буфера)' },
      { name: 'encoding', description: "Кодировка для текстового режима. Рекомендуется 'utf-8'. По умолчанию — системная" },
      { name: 'errors', description: "Обработка ошибок кодирования: 'strict' (исключение), 'ignore', 'replace', 'backslashreplace'" },
      { name: 'newline', description: "Обработка переносов строк: None (универсальный), '', '\\n', '\\r', '\\r\\n'" },
      { name: 'closefd', description: 'Если file — дескриптор (int), closefd=False не закрывает его при закрытии файлового объекта' },
      { name: 'opener', description: 'Пользовательский открыватель файлов: callable(path, flags)' }
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
    print("Файл уже существует")`
  },
  {
    name: 'ord(c)',
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
    syntax: 'ord(c)',
    arguments: [
      { name: 'c', description: 'Строка из ровно одного символа Unicode' }
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
ord('a') <= ord(ch) <= ord('z')  # True — строчная буква`
  },
  {
    name: 'pow(base, exp[, mod])',
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
    syntax: 'pow(base, exp[, mod])',
    arguments: [
      { name: 'base', description: 'Основание — число (int или float). В трёхаргументной форме — целое число' },
      { name: 'exp', description: 'Показатель степени — число. В трёхаргументной форме — целое число' },
      { name: 'mod', description: 'Необязательный. Модуль для операции (base ** exp) % mod. Должен быть положительным целым числом' }
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
decrypted = pow(encrypted, d, n) # 65`
  },
  {
    name: 'print(*objects, sep, end, file, flush)',
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
      { name: '*objects', description: 'Один или несколько объектов для вывода. Преобразуются в строки через str()' },
      { name: 'sep', description: "Разделитель между объектами. По умолчанию ' ' (пробел). sep='' — без разделителя, sep='\\n' — каждый с новой строки" },
      { name: 'end', description: "Строка в конце вывода. По умолчанию '\\n'. end='' — без перевода строки (вывод на той же строке)" },
      { name: 'file', description: 'Объект с методом write(str). По умолчанию sys.stdout. Можно перенаправить в файл, StringIO и т.д.' },
      { name: 'flush', description: 'Если True — принудительно сбрасывает буфер после записи. Полезно для потокового вывода' }
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
print()  # перевод строки в конце`
  },
  {
    name: 'property(fget, fset, fdel, doc)',
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
    syntax: 'property(fget=None, fset=None, fdel=None, doc=None)',
    arguments: [
      { name: 'fget', description: 'Необязательный. Функция для получения значения атрибута. Принимает self, возвращает значение' },
      { name: 'fset', description: 'Необязательный. Функция для установки значения. Принимает self и новое значение' },
      { name: 'fdel', description: 'Необязательный. Функция для удаления атрибута. Принимает self' },
      { name: 'doc', description: 'Необязательный. Строка документации для свойства' }
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
# c.radius = -1     # ValueError!`
  },
  {
    name: 'range(stop) / range(start, stop[, step])',
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
    syntax: 'range(stop)\nrange(start, stop[, step])',
    arguments: [
      { name: 'start', description: 'Необязательный. Начало диапазона (включительно). По умолчанию 0' },
      { name: 'stop', description: 'Конец диапазона (не включается). Единственный обязательный аргумент' },
      { name: 'step', description: 'Необязательный. Шаг. По умолчанию 1. Может быть отрицательным. Не может быть 0 (ValueError)' }
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
    print(i, my_list[i])`
  },
  {
    name: 'repr(object)',
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
    syntax: 'repr(object)',
    arguments: [
      { name: 'object', description: 'Любой Python-объект. Вызывает __repr__() метод объекта' }
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
eval(repr(42))     # 42`
  },
  {
    name: 'reversed(seq)',
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
    syntax: 'reversed(seq)',
    arguments: [
      { name: 'seq', description: 'Последовательность, реализующая __reversed__() или __len__() + __getitem__(). Строки, списки, кортежи, range, bytearray и пользовательские типы' }
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

list(reversed(CountDown(5)))  # [0, 1, 2, 3, 4]`
  },
  {
    name: 'str.capitalize()',
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
    syntax: 'str.capitalize()',
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
name.capitalize()   # 'Alice'`
  },
  {
    name: 'str.casefold()',
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
    syntax: 'str.casefold()',
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

eq_ignore_case("Straße", "strasse")  # True`
  },
  {
    name: 'str.center(width[, fillchar])',
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
    syntax: 'str.center(width[, fillchar])',
    arguments: [
      { name: 'width', description: 'Ширина результирующей строки. Если width ≤ len(str), возвращается исходная строка' },
      { name: 'fillchar', description: "Необязательный. Символ заполнения (строка длиной 1). По умолчанию ' ' (пробел)" }
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
    print(f"{name.center(10)} | {str(score).center(5)}")`
  },
  {
    name: 'str.count(sub[, start[, end]])',
    description: `Возвращает количество непересекающихся вхождений подстроки sub в строке (или её части от start до end).

Параметры start и end работают как индексы срезов: поддерживают отрицательные значения (с конца строки). Поиск ведётся в диапазоне [start, end).

Важно: метод считает непересекающиеся вхождения. Например, в "aaa" подстрока "aa" встречается 1 раз (не 2), потому что после первого совпадения поиск продолжается с позиции, следующей за найденным.

Сравнение с find() и index():
- count() — возвращает количество вхождений
- find() — возвращает индекс первого вхождения (или -1 если не найдено)
- index() — как find(), но поднимает ValueError при отсутствии

Особый случай: count("") возвращает len(str) + 1, потому что пустая строка "находится" между каждым символом и в начале и конце строки. Это математически корректное поведение.

Применение: подсчёт символов, слов, вхождений паттернов в тексте без регулярных выражений.`,
    syntax: 'str.count(sub[, start[, end]])',
    arguments: [
      { name: 'sub', description: 'Подстрока, вхождения которой нужно подсчитать' },
      { name: 'start', description: 'Необязательный. Начальный индекс поиска (включительно). Поддерживает отрицательные значения' },
      { name: 'end', description: 'Необязательный. Конечный индекс поиска (не включается). Поддерживает отрицательные значения' }
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
"hello".count("")   # 6  (len + 1)`
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
      { name: 'encoding', description: "Кодировка для преобразования. По умолчанию 'utf-8'. Примеры: 'ascii', 'latin-1', 'cp1251', 'utf-16'" },
      { name: 'errors', description: "Обработка ошибок кодирования: 'strict' (исключение), 'ignore', 'replace', 'backslashreplace', 'xmlcharrefreplace'" }
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
decoded == original   # True`
  },
  {
    name: 'str.endswith(suffix[, start[, end]])',
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
    syntax: 'str.endswith(suffix[, start[, end]])',
    arguments: [
      { name: 'suffix', description: 'Строка или кортеж строк для проверки. При кортеже возвращает True если строка заканчивается хотя бы на один из суффиксов' },
      { name: 'start', description: 'Необязательный. Начальный индекс области проверки' },
      { name: 'end', description: 'Необязательный. Конечный индекс области проверки (не включается)' }
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

is_image("photo.JPG")   # True`
  },
  {
    name: 'str.expandtabs(tabsize=8)',
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
    syntax: 'str.expandtabs(tabsize=8)',
    arguments: [
      { name: 'tabsize', description: 'Необязательный. Размер табуляции (позиция стопа). По умолчанию 8. Обычно используют 4' }
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
# 'def f():\\n    return 42'`
  },
  {
    name: 'str.find(sub[, start[, end]])',
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
    syntax: 'str.find(sub[, start[, end]])',
    arguments: [
      { name: 'sub', description: 'Подстрока для поиска' },
      { name: 'start', description: 'Необязательный. Начальный индекс поиска (включительно)' },
      { name: 'end', description: 'Необязательный. Конечный индекс поиска (не включается)' }
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
domain = s[at+1:]      # 'example.com'`
  },
  {
    name: 'str.format(*args, **kwargs)',
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
    syntax: 'str.format(*args, **kwargs)',
    arguments: [
      { name: '*args', description: 'Позиционные аргументы. Доступны по индексу {0}, {1} или автоматически {}' },
      { name: '**kwargs', description: 'Именованные аргументы. Доступны по имени {name}' }
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
"{:#x}".format(255)                 # '0xff'`
  },
  {
    name: 'str.format_map(mapping)',
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
    syntax: 'str.format_map(mapping)',
    arguments: [
      { name: 'mapping', description: 'Словарь или объект, подобный словарю (Mapping). Должен поддерживать индексацию по ключу. Используется напрямую без копирования' }
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
# template.format_map(os.environ)  — подставляет переменную среды`
  },
  {
    name: 'str.index(sub[, start[, end]])',
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
    syntax: 'str.index(sub[, start[, end]])',
    arguments: [
      { name: 'sub', description: 'Подстрока для поиска' },
      { name: 'start', description: 'Необязательный. Начальный индекс поиска (включительно)' },
      { name: 'end', description: 'Необязательный. Конечный индекс поиска (не включается)' }
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
username = email[:at_pos]  # 'user'`
  },
  {
    name: 'str.isalnum()',
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
    syntax: 'str.isalnum()',
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
# (у "Hello," есть запятая, поэтому не проходит)`
  },
  {
    name: 'str.isalpha()',
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
    syntax: 'str.isalpha()',
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
is_valid_name("O'Brien")     # False  (апостроф)`
  },
  {
    name: 'str.isascii()',
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
    syntax: 'str.isascii()',
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
"@#$!".isascii()   # True (спецсимволы — тоже ASCII)`
  },
  {
    name: 'str.isdecimal()',
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
    syntax: 'str.isdecimal()',
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
safe_int("3.14")   # ValueError`
  },
  {
    name: 'str.isdigit()',
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
    syntax: 'str.isdigit()',
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
is_number("1e10")    # True`
  },
  {
    name: 'str.isidentifier()',
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
    syntax: 'str.isidentifier()',
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
    setattr(obj, attr_name, value)`
  },
  {
    name: 'str.islower()',
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
    syntax: 'str.islower()',
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
# ['hello', 'python']`
  },
  {
    name: 'str.isnumeric()',
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
    syntax: 'str.isnumeric()',
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
    return None`
  },
  {
    name: 'str.isprintable()',
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
    syntax: 'str.isprintable()',
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
    return ''.join(c for c in s if c.isprintable())`
  },
  {
    name: 'str.isspace()',
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
    syntax: 'str.isspace()',
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
    print("Введите непустое значение")`
  },
  {
    name: 'str.istitle()',
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
    syntax: 'str.istitle()',
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
"O'brien".istitle()      # False`
  },
  {
    name: 'str.isupper()',
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
    syntax: 'str.isupper()',
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
    return text`
  },
  {
    name: 'str.join(iterable)',
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
    syntax: 'str.join(iterable)',
    arguments: [
      { name: 'iterable', description: 'Итерируемый объект, содержащий строки. Если элементы не строки — возникает TypeError' }
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
"/".join(["home", "user", "docs"])    # 'home/user/docs'`
  },
  {
    name: 'str.ljust(width[, fillchar])',
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
    syntax: 'str.ljust(width[, fillchar])',
    arguments: [
      { name: 'width', description: 'Ширина результирующей строки' },
      { name: 'fillchar', description: "Необязательный. Символ заполнения. По умолчанию ' ' (пробел)" }
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
# Carol      | 92`
  },
  {
    name: 'str.lower()',
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
    syntax: 'str.lower()',
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
"Straße".casefold()   # 'strasse'  (для сравнения лучше casefold)`
  },
  {
    name: 'str.lstrip([chars])',
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
    syntax: 'str.lstrip([chars])',
    arguments: [
      { name: 'chars', description: "Необязательный. Строка с символами для удаления слева. По умолчанию удаляет пробельные символы (' ', '\\t', '\\n', '\\r' и т.д.)" }
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
int("00042")            # 42`
  },
  {
    name: 'str.maketrans(x[, y[, z]])',
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
    syntax: 'str.maketrans(x[, y[, z]])',
    arguments: [
      { name: 'x', description: 'Словарь сопоставлений, или строка символов для замены (форма 2/3)' },
      { name: 'y', description: 'Необязательный (форма 2/3). Строка замены — символы из x заменяются соответствующими из y. Длина y должна равняться длине x' },
      { name: 'z', description: 'Необязательный (форма 3). Строка символов для удаления (заменяются на None)' }
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
"Hello".translate(rot13_table)   # 'Uryyb'`
  },
  {
    name: 'str.partition(sep)',
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
    syntax: 'str.partition(sep)',
    arguments: [
      { name: 'sep', description: 'Строка-разделитель. Разбивает по первому вхождению. Не может быть пустой строкой' }
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
    print(f"{key!r} = {value!r}")   # 'name' = 'Alice'`
  },
  {
    name: 'str.removeprefix(prefix)',
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
    syntax: 'str.removeprefix(prefix)',
    arguments: [
      { name: 'prefix', description: 'Строка-префикс для удаления. Если строка не начинается с prefix, возвращается исходная строка' }
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
# s[len(prefix):] if s.startswith(prefix) else s`
  },
  {
    name: 'str.removesuffix(suffix)',
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
    syntax: 'str.removesuffix(suffix)',
    arguments: [
      { name: 'suffix', description: 'Строка-суффикс для удаления. Если строка не заканчивается на suffix, возвращается исходная строка' }
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
# s[:-len(suffix)] if s.endswith(suffix) else s`
  },
  {
    name: 'str.replace(old, new[, count])',
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
    syntax: 'str.replace(old, new[, count])',
    arguments: [
      { name: 'old', description: 'Подстрока для замены' },
      { name: 'new', description: 'Строка замены' },
      { name: 'count', description: 'Необязательный. Максимальное число замен. По умолчанию все вхождения' }
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
# 'Hello, Alice! You have 3 messages.'`
  },
  {
    name: 'str.rfind(sub[, start[, end]])',
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
    syntax: 'str.rfind(sub[, start[, end]])',
    arguments: [
      { name: 'sub', description: 'Подстрока для поиска' },
      { name: 'start', description: 'Необязательный. Начальный индекс области поиска' },
      { name: 'end', description: 'Необязательный. Конечный индекс области поиска (не включается)' }
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
# (лучше: os.path.dirname и os.path.basename)`
  },
  {
    name: 'str.rindex(sub[, start[, end]])',
    description: `Возвращает наибольший индекс последнего вхождения подстроки sub в строке. Если подстрока не найдена — возбуждает ValueError.

Является зеркальным методом к index() — ищет с конца строки. Аналогично rfind(), но вместо -1 при отсутствии возбуждает исключение.

Четыре связанных метода поиска:
- find(sub) — первое вхождение, возвращает -1 если нет
- index(sub) — первое вхождение, ValueError если нет
- rfind(sub) — последнее вхождение, возвращает -1 если нет
- rindex(sub) — последнее вхождение, ValueError если нет

Правило выбора: используйте rindex() когда отсутствие подстроки является логической ошибкой и нужно явное исключение. Используйте rfind() для "мягкой" проверки.

Параметры start и end работают как и в других методах поиска.`,
    syntax: 'str.rindex(sub[, start[, end]])',
    arguments: [
      { name: 'sub', description: 'Подстрока для поиска (последнее вхождение)' },
      { name: 'start', description: 'Необязательный. Начальный индекс области поиска' },
      { name: 'end', description: 'Необязательный. Конечный индекс области поиска (не включается)' }
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
last_word = line[last_space+1:]   # 'in'`
  },
  {
    name: 'str.rjust(width[, fillchar])',
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
    syntax: 'str.rjust(width[, fillchar])',
    arguments: [
      { name: 'width', description: 'Ширина результирующей строки' },
      { name: 'fillchar', description: "Необязательный. Символ заполнения. По умолчанию ' ' (пробел)" }
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
# Арбуз           | 12.99`
  },
  {
    name: 'str.rpartition(sep)',
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
    syntax: 'str.rpartition(sep)',
    arguments: [
      { name: 'sep', description: 'Строка-разделитель. Разбивает по последнему вхождению. Не может быть пустой строкой' }
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
# (лучше: os.path.split(path))`
  },
  {
    name: 'str.rsplit(sep=None, maxsplit=-1)',
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
    syntax: 'str.rsplit(sep=None, maxsplit=-1)',
    arguments: [
      { name: 'sep', description: 'Строка-разделитель. None (по умолчанию) — разбивка по пробельным символам с игнорированием пустых токенов' },
      { name: 'maxsplit', description: 'Максимальное число делений (считается с конца). -1 (по умолчанию) — без ограничений' }
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
print(name)   # 'file.txt'`
  },
  {
    name: 'str.rstrip([chars])',
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
    syntax: 'str.rstrip([chars])',
    arguments: [
      { name: 'chars', description: "Необязательный. Набор символов для удаления справа. По умолчанию пробельные символы (' ', '\\t', '\\n', '\\r' и т.д.)" }
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
"file.txt".rstrip("txt")   # 'file.'  (удаляет t, x, t — все буквы!)`
  },
  {
    name: 'str.split(sep=None, maxsplit=-1)',
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
    syntax: 'str.split(sep=None, maxsplit=-1)',
    arguments: [
      { name: 'sep', description: 'Разделитель. None (по умолчанию) — умная разбивка по пробелам. Пустая строка "" — ValueError' },
      { name: 'maxsplit', description: 'Максимальное число делений (-1 = без ограничений). При maxsplit=N возвращает не более N+1 элементов' }
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
" ".join(words)   # 'Hello World'`
  },
  {
    name: 'str.splitlines([keepends])',
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
    syntax: 'str.splitlines([keepends])',
    arguments: [
      { name: 'keepends', description: 'Необязательный. Если True — символы окончания строк включаются в результирующие строки. По умолчанию False' }
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
    print(line.strip())`
  },
  {
    name: 'str.startswith(prefix[, start[, end]])',
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
    syntax: 'str.startswith(prefix[, start[, end]])',
    arguments: [
      { name: 'prefix', description: 'Строка или кортеж строк для проверки. При кортеже возвращает True если строка начинается хотя бы с одного из префиксов' },
      { name: 'start', description: 'Необязательный. Начальный индекс области проверки' },
      { name: 'end', description: 'Необязательный. Конечный индекс области проверки (не включается)' }
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
# ['get /api', 'get /users']`
  },
  {
    name: 'str.strip([chars])',
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
    syntax: 'str.strip([chars])',
    arguments: [
      { name: 'chars', description: "Необязательный. Набор символов для удаления с обоих краёв. По умолчанию пробельные символы (' ', '\\t', '\\n', '\\r' и т.д.)" }
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
"abcba".strip("ba")    # 'c'  — порядок в chars не важен`
  },
  {
    name: 'str.swapcase()',
    description: `Возвращает копию строки, в которой заглавные буквы заменены строчными, а строчные — заглавными. Регистр каждой буквы инвертируется.

Небуквенные символы (цифры, пробелы, знаки препинания) остаются без изменений.

Корректно работает с Unicode: кириллица, греческий и другие алфавиты обрабатываются правильно (если у символа есть регистр).

Важная особенность: swapcase() — не самообратная операция для некоторых Unicode-символов. Обычно s.swapcase().swapcase() == s, но не всегда — для символов с нестандартным case folding (например, немецкий ß: 'ß'.swapcase() → 'SS', 'SS'.swapcase() → 'ss').

Применения:
- Учебные задачи и демонстрация регистра
- Простые шифры (инверсия регистра)
- Нормализация строк в специфических форматах
- Генерация вариантов строк для тестирования`,
    syntax: 'str.swapcase()',
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
decoded = encoded.swapcase()   # 'Hello World'`
  },
  {
    name: 'str.title()',
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
    syntax: 'str.title()',
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
"JOHN DOE".title()            # 'John Doe'`
  },
  {
    name: 'str.translate(table)',
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
    syntax: 'str.translate(table)',
    arguments: [
      { name: 'table', description: 'Словарь {int: int|str|None} — маппинг кодовых точек Unicode. Обычно создаётся через str.maketrans()' }
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
"абв".translate(table)    # 'abv'`
  },
  {
    name: 'str.upper()',
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
    syntax: 'str.upper()',
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
make_acronym("as soon as possible")      # 'ASAP'`
  },
  {
    name: 'str.zfill(width)',
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
    syntax: 'str.zfill(width)',
    arguments: [
      { name: 'width', description: 'Минимальная ширина результирующей строки. Если len(str) >= width — строка возвращается без изменений' }
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
f"{-42:06d}"    # '  -042'  — другое поведение!`
  },
  {
    name: 'list.append(x)',
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
    syntax: 'list.append(x)',
    arguments: [
      { name: 'x', description: 'Элемент для добавления в конец списка. Может быть любым объектом, включая другой список' }
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
lst.append(4)        # изменяет lst на месте`
  },
  {
    name: 'list.clear()',
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
    syntax: 'list.clear()',
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
print(lst)    # []`
  },
  {
    name: 'list.copy()',
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
    syntax: 'list.copy()',
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
# b, c, d — одинаковые shallow copies`
  },
  {
    name: 'list.count(x)',
    description: `Возвращает количество вхождений элемента x в списке. Использует оператор == для сравнения каждого элемента с x.

Сложность: O(n) — всегда обходит весь список. Для частых подсчётов при большом списке эффективнее использовать collections.Counter.

Сравнение использует ==, а не is. Поэтому count(True) подсчитает и True, и 1 (они равны в Python: True == 1).

Применения:
- Проверка частоты элемента
- Проверка наличия дубликатов
- Простая статистика по спискам

Для подсчёта всех уникальных элементов сразу: collections.Counter(lst) — создаёт словарь {элемент: количество}.`,
    syntax: 'list.count(x)',
    arguments: [
      { name: 'x', description: 'Элемент для подсчёта. Сравнение выполняется через ==, поддерживает пользовательский __eq__' }
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
Counter(data).most_common(1)  # [(3, 3)]`
  },
  {
    name: 'list.extend(iterable)',
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
    syntax: 'list.extend(iterable)',
    arguments: [
      { name: 'iterable', description: 'Любой итерируемый объект, чьи элементы добавляются в список. Строки разворачиваются в символы' }
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
print(lst)       # [1, 2, 3, 4]`
  },
  {
    name: 'list.index(x[, start[, end]])',
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
    syntax: 'list.index(x[, start[, end]])',
    arguments: [
      { name: 'x', description: 'Элемент для поиска. Сравнение через ==. Возвращает индекс первого совпадения' },
      { name: 'start', description: 'Необязательный. Начальный индекс поиска (включительно)' },
      { name: 'end', description: 'Необязательный. Конечный индекс поиска (не включается)' }
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
# [1, 3]`
  },
  {
    name: 'list.insert(i, x)',
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
    syntax: 'list.insert(i, x)',
    arguments: [
      { name: 'i', description: 'Индекс позиции, ПЕРЕД которой вставляется элемент. 0 — перед первым, len(lst) — после последнего. Поддерживает отрицательные значения' },
      { name: 'x', description: 'Элемент для вставки' }
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
dq.appendleft(0)     # O(1), а не O(n)`
  },
  {
    name: 'list.pop([i])',
    description: `Удаляет элемент с индексом i из списка и возвращает его. Изменяет список на месте.

Если i не указан — удаляет и возвращает последний элемент. Это операция O(1).

Если i указан — удаляет элемент по этому индексу. Это O(n) для i < len-1, потому что все последующие элементы сдвигаются влево.

Поддерживает отрицательные индексы: pop(-1) — последний (по умолчанию), pop(-2) — предпоследний.

Если список пуст или индекс вне диапазона — возбуждает IndexError.

Паттерн "стек" (LIFO): append() + pop() — добавление и извлечение с конца — оба O(1). Это быстрый и идиоматичный стек в Python.

Паттерн "очередь" (FIFO): для эффективной очереди используйте collections.deque — pop() и popleft() оба O(1). pop(0) на списке — O(n).`,
    syntax: 'list.pop([i])',
    arguments: [
      { name: 'i', description: 'Необязательный. Индекс удаляемого элемента. По умолчанию -1 (последний). Поддерживает отрицательные значения. IndexError если список пуст или индекс вне диапазона' }
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
queue.popleft()      # 1, O(1)  (pop(0) на списке — O(n)!)`
  },
  {
    name: 'list.remove(x)',
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
    syntax: 'list.remove(x)',
    arguments: [
      { name: 'x', description: 'Значение элемента для удаления. Сравнение через ==. Удаляется первое вхождение. ValueError если не найдено' }
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
val = lst.pop(0)  # удалить по индексу, возвращает 10`
  },
  {
    name: 'list.reverse()',
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
    syntax: 'list.reverse()',
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
    print(x, end=" ")  # 5 4 3 2 1`
  },
  {
    name: 'list.sort(*, key=None, reverse=False)',
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
    syntax: 'list.sort(*, key=None, reverse=False)',
    arguments: [
      { name: 'key', description: 'Необязательный. Функция одного аргумента для извлечения ключа сравнения. По умолчанию None (прямое сравнение элементов)' },
      { name: 'reverse', description: 'Необязательный. Если True — сортировка по убыванию. По умолчанию False (по возрастанию)' }
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
new = sorted([3, 1, 2]) # создаёт новый список`
  },
  {
    name: 'round(number[, ndigits])',
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
    syntax: 'round(number[, ndigits])',
    arguments: [
      { name: 'number', description: 'Число для округления. Может быть int, float или объект с __round__()' },
      { name: 'ndigits', description: 'Необязательный. Число знаков после запятой. Может быть отрицательным. По умолчанию None (округление до целого)' }
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
print(f"Цена: {round(price, 2):.2f} ₽")  # Цена: 20.00 ₽`
  },
  {
    name: 'set([iterable])',
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
    syntax: 'set([iterable])',
    arguments: [
      { name: 'iterable', description: 'Необязательный. Итерируемый объект, чьи элементы станут элементами множества (дубли удаляются). Если не указан — создаётся пустое множество set()' }
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
# {0, 2, 4, 6, 8}`
  },
  {
    name: 'setattr(object, name, value)',
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
    syntax: 'setattr(object, name, value)',
    arguments: [
      { name: 'object', description: 'Объект, у которого устанавливается атрибут' },
      { name: 'name', description: 'Строка с именем атрибута' },
      { name: 'value', description: 'Значение, которое присваивается атрибуту' }
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
print(p.name)   # 'Alice'  — setter отработал!`
  },
  {
    name: 'slice(stop) / slice(start, stop[, step])',
    description: `Создаёт объект среза (slice object), который может использоваться вместо записи индексов с двоеточием. slice(start, stop, step) эквивалентен записи [start:stop:step].

Объект slice хранит три атрибута: .start, .stop, .step. При отсутствии аргументов они равны None (что интерпретируется как "начало", "конец" и "шаг 1" соответственно).

Зачем использовать slice():
- Именованные срезы: дают понятные имена вместо магических чисел
- Переиспользование срезов: один объект slice применяется к нескольким последовательностям
- Метапрограммирование: __getitem__ получает объект slice при операции [start:stop]
- Работа с NumPy, pandas: мощный инструмент для работы с многомерными данными

Метод slice.indices(length): возвращает кортеж (start, stop, step) нормализованных индексов для последовательности заданной длины. Полезно при реализации __getitem__ в собственных классах.

Форма slice(stop) эквивалентна slice(None, stop, None) — срез с начала до stop.`,
    syntax: 'slice(stop)\nslice(start, stop[, step])',
    arguments: [
      { name: 'start', description: 'Необязательный. Начало среза (включительно). None = с начала' },
      { name: 'stop', description: 'Конец среза (не включается). None = до конца' },
      { name: 'step', description: 'Необязательный. Шаг. None интерпретируется как 1' }
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
s.indices(10)      # (1, 10, 2) — безопасные индексы для len=10`
  },
  {
    name: 'sorted(iterable[, key, reverse])',
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
    syntax: 'sorted(iterable, *, key=None, reverse=False)',
    arguments: [
      { name: 'iterable', description: 'Любой итерируемый объект: список, кортеж, строка, генератор, словарь (ключи) и т.д.' },
      { name: 'key', description: 'Необязательный. Функция одного аргумента для извлечения ключа сравнения. По умолчанию None (прямое сравнение элементов)' },
      { name: 'reverse', description: 'Необязательный. Если True — сортировка по убыванию. По умолчанию False (по возрастанию)' }
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
sorted(people, key=itemgetter("age"))`
  },
  {
    name: 'staticmethod(function)',
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
    syntax: '@staticmethod\ndef method(...): ...',
    arguments: [
      { name: 'function', description: 'Функция, преобразуемая в статический метод. Не получает self или cls. Может иметь любые обычные параметры' }
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
        return isinstance(name, str) and len(name) > 0`
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
      { name: 'object', description: "Необязательный. Объект для преобразования в строку. По умолчанию '' (пустая строка). Для второй формы — bytes или bytearray" },
      { name: 'encoding', description: "Кодировка для декодирования bytes. По умолчанию 'utf-8'. Только для второй формы (bytes/bytearray)" },
      { name: 'errors', description: "Обработка ошибок декодирования: 'strict' (исключение), 'ignore', 'replace'. Только для второй формы" }
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
",".join(["a", "b", "c"])           # 'a,b,c'`
  },
  {
    name: 'sum(iterable[, start])',
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
    syntax: 'sum(iterable, /, start=0)',
    arguments: [
      { name: 'iterable', description: 'Итерируемый объект с числовыми значениями (или объектами, поддерживающими +)' },
      { name: 'start', description: 'Необязательный. Начальное значение для накопления. По умолчанию 0. Не может быть строкой' }
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
sum(data.values())   # 60`
  },
  {
    name: 'super([type[, object-or-type]])',
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
    syntax: 'super()\nsuper(type, object-or-type)',
    arguments: [
      { name: 'type', description: 'Необязательный. Класс, начиная с которого искать в MRO (поиск начинается со следующего после type). В Python 3 без аргументов определяется автоматически' },
      { name: 'object-or-type', description: 'Необязательный. Объект (экземпляр) или тип, определяющий MRO для поиска. Без аргументов определяется из текущего контекста' }
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
print(C.__mro__)  # (C, A, B, object)`
  },
  {
    name: 'tuple([iterable])',
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
    syntax: 'tuple([iterable])',
    arguments: [
      { name: 'iterable', description: 'Необязательный. Итерируемый объект для создания кортежа. Если не указан — создаётся пустой кортеж ()' }
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
t2 = (42)     # просто число 42!`
  },
  {
    name: 'type(object) / type(name, bases, dict)',
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
    syntax: 'type(object)\ntype(name, bases, dict)',
    arguments: [
      { name: 'object', description: 'Форма 1: объект, тип которого нужно получить' },
      { name: 'name', description: 'Форма 2: строка с именем нового класса' },
      { name: 'bases', description: 'Форма 2: кортеж базовых классов (родителей). () для наследования только от object' },
      { name: 'dict', description: 'Форма 2: словарь атрибутов и методов нового класса' }
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
type(type)          # <class 'type'>`
  },
  {
    name: 'vars([object])',
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
    syntax: 'vars([object])',
    arguments: [
      { name: 'object', description: 'Необязательный. Объект с __dict__. Без аргумента — аналог locals()' }
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
# vars([])    # TypeError`
  },
  {
    name: 'zip(*iterables, strict=False)',
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
    syntax: 'zip(*iterables, strict=False)',
    arguments: [
      { name: '*iterables', description: 'Один или несколько итерируемых объектов. При одном итерируемом возвращает кортежи из одного элемента' },
      { name: 'strict', description: 'Необязательный (Python 3.10+). Если True — ValueError при разной длине итерируемых. По умолчанию False' }
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
# nums=(1,2,3), letters=('a','b','c')`
  },
  {
    name: '__import__(name, globals, locals, fromlist, level)',
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
    syntax: '__import__(name, globals=None, locals=None, fromlist=(), level=0)',
    arguments: [
      { name: 'name', description: 'Строка с именем модуля для импорта (например, "os", "os.path", "json")' },
      { name: 'globals', description: 'Необязательный. Словарь глобальных переменных вызывающего кода (используется для относительных импортов)' },
      { name: 'locals', description: 'Необязательный. Словарь локальных переменных (как правило, не используется)' },
      { name: 'fromlist', description: 'Необязательный. Список имён для импорта из модуля. Если непустой — возвращает сам модуль, а не верхний пакет' },
      { name: 'level', description: 'Необязательный. 0 — абсолютный импорт (по умолчанию), >0 — относительный импорт' }
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
utils = importlib.import_module('.utils', package='mypackage')`
  }
];
