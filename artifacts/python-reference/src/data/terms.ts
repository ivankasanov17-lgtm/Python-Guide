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
  {
    name: "aiohttp.web.Application()",
    category: "aiohttp.web",
    description:
      "Создаёт экземпляр ASGI/WSGI-совместимого асинхронного веб-приложения aiohttp. Является центральным объектом сервера — содержит маршрутизатор, список промежуточного ПО (middleware) и сигналы жизненного цикла. Поддерживает вложенные подприложения через add_subapp().",
    syntax:
      "web.Application(*, logger=<DEFAULT>, middlewares=(), handler_factory=<DEFAULT>, client_max_size=1024**2, loop=None, debug=...)",
    arguments: [
      {
        name: "logger",
        description:
          "Объект logging.Logger для логирования событий приложения. По умолчанию используется aiohttp.web_logger.",
      },
      {
        name: "middlewares",
        description:
          "Кортеж или список промежуточных обработчиков (middleware). Выполняются в порядке объявления при каждом запросе.",
      },
      {
        name: "client_max_size",
        description:
          "Максимальный размер тела запроса в байтах. По умолчанию 1 МБ (1024**2). При превышении — возбуждает HTTPRequestEntityTooLarge.",
      },
      {
        name: "loop",
        description:
          "Устаревший параметр. Цикл событий asyncio. Начиная с версии 3.x игнорируется — используется текущий цикл событий.",
      },
      {
        name: "debug",
        description:
          "Включает режим отладки. Устарел в пользу loop.set_debug().",
      },
    ],
    example: `import aiohttp.web as web

async def handle(request):
    return web.Response(text="Привет, мир!")

app = web.Application()
app.router.add_get('/', handle)

# Запуск через runner:
# web.run_app(app, host='127.0.0.1', port=8080)

# С middleware:
@web.middleware
async def error_middleware(request, handler):
    try:
        return await handler(request)
    except web.HTTPException as ex:
        return web.Response(status=ex.status, text=str(ex))

app_with_mw = web.Application(middlewares=[error_middleware])`,
  },
  {
    name: "aiohttp.web.Application.add_routes()",
    category: "aiohttp.web",
    description:
      "Регистрирует список маршрутов в маршрутизаторе приложения. Принимает коллекцию объектов RouteDef, созданных через декораторы web.get(), web.post(), web.RouteTableDef и т.д. Более лаконичный способ добавить сразу несколько маршрутов, чем вызывать router.add_get() по одному.",
    syntax: "app.add_routes(routes)",
    arguments: [
      {
        name: "routes",
        description:
          "Список объектов RouteDef. Создаются через web.get(), web.post(), web.put(), web.delete(), web.route() или web.RouteTableDef.",
      },
    ],
    example: `import aiohttp.web as web

routes = web.RouteTableDef()

@routes.get('/')
async def index(request):
    return web.Response(text="Главная")

@routes.get('/users/{id}')
async def get_user(request):
    uid = request.match_info['id']
    return web.Response(text=f"Пользователь {uid}")

@routes.post('/users')
async def create_user(request):
    data = await request.json()
    return web.json_response(data, status=201)

app = web.Application()
app.add_routes(routes)

# Либо через список функций:
app.add_routes([
    web.get('/health', lambda r: web.Response(text='ok')),
])`,
  },
  {
    name: "aiohttp.web.Application.add_subapp()",
    category: "aiohttp.web",
    description:
      "Монтирует вложенное подприложение (subapp) по заданному URL-префиксу. Все маршруты подприложения становятся доступны под этим префиксом. Сигналы жизненного цикла (on_startup, on_cleanup) подприложения вызываются вместе с родительским.",
    syntax: "app.add_subapp(prefix, subapp)",
    arguments: [
      {
        name: "prefix",
        description:
          'URL-префикс (строка), по которому монтируется подприложение. Например, "/api/v1".',
      },
      {
        name: "subapp",
        description:
          "Экземпляр web.Application, который будет обрабатывать запросы с данным префиксом.",
      },
    ],
    example: `import aiohttp.web as web

# Создаём подприложение для API
api = web.Application()

@api.router.add_get('/users')
async def list_users(request):
    return web.json_response([{"id": 1, "name": "Иван"}])

@api.router.add_get('/posts')
async def list_posts(request):
    return web.json_response([{"id": 1, "title": "Статья"}])

# Основное приложение
app = web.Application()
app.add_subapp('/api/v1', api)

# Теперь доступны:
# GET /api/v1/users
# GET /api/v1/posts

# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.cleanup()",
    category: "aiohttp.web",
    description:
      "Корутина, выполняющая завершение работы приложения — запускает обработчики сигнала on_cleanup. Вызывается автоматически при использовании web.run_app() или AppRunner. При ручном управлении жизненным циклом должна быть вызвана явно после shutdown().",
    syntax: "await app.cleanup()",
    arguments: [],
    example: `import aiohttp.web as web
import asyncio

async def on_cleanup(app):
    print("Закрываем соединения с БД...")
    # await app['db'].close()

async def main():
    app = web.Application()
    app.on_cleanup.append(on_cleanup)

    runner = web.AppRunner(app)
    await runner.setup()

    site = web.TCPSite(runner, 'localhost', 8080)
    await site.start()
    print("Сервер запущен")

    await asyncio.sleep(10)  # работаем 10 секунд

    # Ручное завершение:
    await runner.cleanup()  # вызывает app.shutdown() и app.cleanup()

asyncio.run(main())`,
  },
  {
    name: "aiohttp.web.Application.on_cleanup",
    category: "aiohttp.web",
    description:
      "Сигнал (список корутин-обработчиков), вызываемых на этапе очистки приложения — после on_shutdown. Используется для освобождения ресурсов: закрытия подключений к БД, завершения фоновых задач, сохранения состояния. Обработчики принимают единственный аргумент — экземпляр приложения.",
    syntax: "app.on_cleanup.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Асинхронная функция (корутина) с сигнатурой async def handler(app). Вызывается при завершении приложения.",
      },
    ],
    example: `import aiohttp.web as web
import aiohttp

async def init_db(app):
    app['session'] = aiohttp.ClientSession()
    print("HTTP-сессия создана")

async def close_db(app):
    await app['session'].close()
    print("HTTP-сессия закрыта")

async def close_cache(app):
    # Закрываем кэш-соединение
    print("Кэш очищен")

app = web.Application()

# Регистрируем обработчики старта и очистки
app.on_startup.append(init_db)
app.on_cleanup.append(close_db)
app.on_cleanup.append(close_cache)

# web.run_app(app)
# При остановке: close_db → close_cache`,
  },
  {
    name: "aiohttp.web.Application.on_response_prepare",
    category: "aiohttp.web",
    description:
      "Сигнал, вызываемый непосредственно перед отправкой ответа клиенту — после формирования объекта Response, но до начала передачи данных. Позволяет динамически модифицировать заголовки ответа. Обработчики принимают request и response.",
    syntax: "app.on_response_prepare.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Корутина с сигнатурой async def handler(request, response). Позволяет изменять response.headers перед отправкой.",
      },
    ],
    example: `import aiohttp.web as web

async def add_security_headers(request, response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Request-ID'] = request.headers.get('X-Request-ID', 'unknown')

async def handle(request):
    return web.Response(text="Защищённый ответ")

app = web.Application()
app.on_response_prepare.append(add_security_headers)
app.router.add_get('/', handle)

# web.run_app(app)
# Все ответы будут содержать заголовки безопасности`,
  },
  {
    name: "aiohttp.web.Application.on_shutdown",
    category: "aiohttp.web",
    description:
      "Сигнал, вызываемый при начале завершения работы приложения — до on_cleanup. Используется для мягкого завершения: уведомления клиентов WebSocket о закрытии, остановки принятия новых задач. Обработчики принимают единственный аргумент — экземпляр приложения.",
    syntax: "app.on_shutdown.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Корутина с сигнатурой async def handler(app). Вызывается при получении сигнала остановки (SIGTERM и т.д.).",
      },
    ],
    example: `import aiohttp.web as web
import weakref

async def handle_ws(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    request.app['websockets'].add(ws)
    try:
        async for msg in ws:
            await ws.send_str(f"Эхо: {msg.data}")
    finally:
        request.app['websockets'].discard(ws)
    return ws

async def on_shutdown(app):
    # Закрываем все активные WebSocket-соединения
    for ws in set(app['websockets']):
        await ws.close(message=b"Server shutdown")
    print("Все WebSocket закрыты")

app = web.Application()
app['websockets'] = weakref.WeakSet()
app.on_shutdown.append(on_shutdown)
app.router.add_get('/ws', handle_ws)`,
  },
  {
    name: "aiohttp.web.Application.on_startup",
    category: "aiohttp.web",
    description:
      "Сигнал, вызываемый при запуске приложения — до начала обработки запросов. Используется для инициализации ресурсов: подключения к БД, запуска фоновых задач, прогрева кэша. Обработчики принимают единственный аргумент — экземпляр приложения.",
    syntax: "app.on_startup.append(handler)",
    arguments: [
      {
        name: "handler",
        description:
          "Корутина с сигнатурой async def handler(app). Вызывается при старте сервера.",
      },
    ],
    example: `import aiohttp.web as web
import aiohttp
import asyncio

async def init_http_client(app):
    app['client'] = aiohttp.ClientSession()
    print("HTTP-клиент инициализирован")

async def start_background_task(app):
    async def heartbeat():
        while True:
            print("heartbeat...")
            await asyncio.sleep(30)

    app['heartbeat_task'] = asyncio.create_task(heartbeat())

async def stop_background_task(app):
    app['heartbeat_task'].cancel()
    try:
        await app['heartbeat_task']
    except asyncio.CancelledError:
        pass

app = web.Application()
app.on_startup.append(init_http_client)
app.on_startup.append(start_background_task)
app.on_cleanup.append(stop_background_task)

# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Application.router",
    category: "aiohttp.web",
    description:
      "Объект маршрутизатора приложения (UrlDispatcher). Хранит таблицу маршрутов и сопоставляет входящие URL-запросы с обработчиками. Позволяет добавлять маршруты напрямую через методы add_get(), add_post() и т.д. или использовать app.add_routes().",
    syntax: "app.router",
    arguments: [],
    example: `import aiohttp.web as web

async def index(request):
    return web.Response(text="Главная")

async def about(request):
    return web.Response(text="О нас")

async def get_item(request):
    item_id = request.match_info['id']
    return web.json_response({"id": item_id})

app = web.Application()

# Добавляем маршруты через router:
app.router.add_get('/', index)
app.router.add_get('/about', about)
app.router.add_get('/items/{id}', get_item)
app.router.add_post('/items', lambda r: web.Response(status=201))
app.router.add_delete('/items/{id}', lambda r: web.Response(status=204))

# Просмотр всех маршрутов:
for resource in app.router.resources():
    print(resource.get_info())`,
  },
  {
    name: "aiohttp.web.Application.shutdown()",
    category: "aiohttp.web",
    description:
      "Корутина, выполняющая первый этап завершения работы приложения — запускает обработчики сигнала on_shutdown. Вызывается автоматически при использовании web.run_app() или AppRunner.cleanup(). При ручном управлении должна быть вызвана перед cleanup().",
    syntax: "await app.shutdown()",
    arguments: [],
    example: `import aiohttp.web as web
import asyncio
import signal

async def on_shutdown(app):
    print("Приложение завершает работу...")

async def main():
    app = web.Application()
    app.on_shutdown.append(on_shutdown)

    async def handle(request):
        return web.Response(text="OK")

    app.router.add_get('/', handle)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8080)
    await site.start()

    # Ручное управление жизненным циклом:
    stop = asyncio.Event()
    loop = asyncio.get_event_loop()
    loop.add_signal_handler(signal.SIGTERM, stop.set)

    await stop.wait()
    await app.shutdown()   # 1. on_shutdown
    await app.cleanup()    # 2. on_cleanup

asyncio.run(main())`,
  },
  {
    name: "aiohttp.web.Application.startup()",
    category: "aiohttp.web",
    description:
      "Корутина, выполняющая инициализацию приложения — запускает обработчики сигнала on_startup. Вызывается автоматически AppRunner.setup() или web.run_app(). При ручном управлении жизненным циклом должна быть вызвана явно после создания приложения.",
    syntax: "await app.startup()",
    arguments: [],
    example: `import aiohttp.web as web
import asyncio

async def init_resources(app):
    app['ready'] = True
    print("Ресурсы инициализированы")

async def main():
    app = web.Application()
    app.on_startup.append(init_resources)

    # Ручной старт без AppRunner:
    await app.startup()
    print(f"app['ready'] = {app['ready']}")  # True

    # ... использование приложения ...

    await app.shutdown()
    await app.cleanup()

asyncio.run(main())`,
  },
  {
    name: "aiohttp.web.Request.method",
    category: "aiohttp.web",
    description:
      'Атрибут объекта запроса. Возвращает HTTP-метод запроса в верхнем регистре (строка). Например: "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS". Доступен только для чтения.',
    syntax: "request.method",
    arguments: [],
    example: `import aiohttp.web as web

async def universal_handler(request):
    method = request.method
    print(f"Метод запроса: {method}")

    if method == 'GET':
        return web.Response(text="Чтение данных")
    elif method == 'POST':
        body = await request.json()
        return web.json_response(body, status=201)
    elif method == 'DELETE':
        return web.Response(status=204)
    else:
        return web.Response(status=405, text=f"Метод {method} не поддерживается")

app = web.Application()
# Регистрируем один обработчик для нескольких методов:
app.router.add_route('*', '/resource', universal_handler)

# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.version",
    category: "aiohttp.web",
    description:
      "Атрибут только для чтения. Возвращает версию HTTP-протокола запроса в виде именованного кортежа HttpVersion(major, minor). Например, для HTTP/1.1 вернёт HttpVersion(major=1, minor=1), для HTTP/2 — HttpVersion(major=2, minor=0).",
    syntax: "request.version",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    version = request.version
    print(f"HTTP версия: {version.major}.{version.minor}")
    # HTTP/1.1 → HttpVersion(major=1, minor=1)
    # HTTP/2   → HttpVersion(major=2, minor=0)

    if version.major == 2:
        return web.Response(text="HTTP/2 запрос")
    else:
        return web.Response(text=f"HTTP/{version.major}.{version.minor} запрос")

app = web.Application()
app.router.add_get('/', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.url",
    category: "aiohttp.web",
    description:
      "Атрибут только для чтения. Возвращает полный URL запроса в виде объекта yarl.URL. Содержит схему, хост, порт, путь, строку запроса и фрагмент. Позволяет удобно извлекать отдельные части URL через атрибуты объекта yarl.URL.",
    syntax: "request.url",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    url = request.url
    print(f"Полный URL:   {url}")
    print(f"Схема:        {url.scheme}")   # http / https
    print(f"Хост:         {url.host}")     # example.com
    print(f"Порт:         {url.port}")     # 8080
    print(f"Путь:         {url.path}")     # /users/42
    print(f"Строка запроса: {url.query_string}")  # page=1&sort=name
    print(f"Параметры:    {url.query}")    # <MultiDict>

    # Формирование нового URL на основе текущего:
    new_url = url.with_path('/new-path').with_query({'key': 'value'})
    return web.Response(text=str(new_url))

app = web.Application()
app.router.add_get('/users/{id}', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.path",
    category: "aiohttp.web",
    description:
      'Атрибут только для чтения. Возвращает путь URL запроса без строки запроса и фрагмента (строка). Например, для URL /users/42?sort=name вернёт "/users/42". URL-декодирован — процентное кодирование раскрыто.',
    syntax: "request.path",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    path = request.path
    print(f"Путь: {path}")  # /users/42

    # Разбор сегментов пути:
    segments = path.strip('/').split('/')
    print(f"Сегменты: {segments}")  # ['users', '42']

    return web.Response(text=f"Путь: {path}")

async def handle_encoded(request):
    # URL: /файлы/документ.pdf (закодированный)
    print(request.path)         # /файлы/документ.pdf  (декодировано)
    print(request.raw_path)     # /%D1%84%D0%B0%D0%B9%D0%BB%D1%8B/... (сырой)
    return web.Response(text="ok")

app = web.Application()
app.router.add_get('/users/{id}', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.query",
    category: "aiohttp.web",
    description:
      "Атрибут только для чтения. Возвращает параметры строки запроса в виде объекта MultiDict (похож на словарь, но поддерживает несколько значений для одного ключа). Все ключи и значения — строки. URL-декодирован.",
    syntax: "request.query",
    arguments: [],
    example: `import aiohttp.web as web

async def search(request):
    query = request.query

    # URL: /search?q=python&page=2&tag=async&tag=web
    search_term = query.get('q', '')          # 'python'
    page = int(query.get('page', 1))          # 2
    tags = query.getall('tag', [])            # ['async', 'web']

    print(f"Поиск: {search_term}")
    print(f"Страница: {page}")
    print(f"Теги: {tags}")

    return web.json_response({
        'q': search_term,
        'page': page,
        'tags': tags
    })

app = web.Application()
app.router.add_get('/search', search)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.query_string",
    category: "aiohttp.web",
    description:
      'Атрибут только для чтения. Возвращает строку запроса URL в сыром виде (без знака "?") как строку. Например, для /search?q=python&page=2 вернёт "q=python&page=2". Не декодирован — содержит оригинальные символы URL-кодирования.',
    syntax: "request.query_string",
    arguments: [],
    example: `import aiohttp.web as web
from urllib.parse import parse_qs

async def handle(request):
    qs = request.query_string
    print(f"Строка запроса: '{qs}'")
    # URL: /api?name=Иван&role=admin&role=user
    # → 'name=%D0%98%D0%B2%D0%B0%D0%BD&role=admin&role=user'

    # Ручной разбор через urllib:
    parsed = parse_qs(qs)
    print(parsed)
    # {'name': ['Иван'], 'role': ['admin', 'user']}

    # Обычно удобнее использовать request.query:
    print(dict(request.query))

    return web.Response(text=qs)

app = web.Application()
app.router.add_get('/api', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.headers",
    category: "aiohttp.web",
    description:
      'Атрибут только для чтения. Возвращает HTTP-заголовки запроса в виде объекта CIMultiDictProxy (регистронезависимый словарь). Ключи нечувствительны к регистру: "Content-Type" и "content-type" — одно и то же.',
    syntax: "request.headers",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    headers = request.headers

    # Стандартные заголовки:
    content_type = headers.get('Content-Type', 'не указан')
    auth = headers.get('Authorization', '')
    user_agent = headers.get('User-Agent', '')

    # Регистронезависимость:
    print(headers.get('content-type'))    # то же что 'Content-Type'
    print(headers.get('CONTENT-TYPE'))    # и это тоже

    # Проверка наличия заголовка:
    if 'X-API-Key' not in headers:
        raise web.HTTPUnauthorized(reason="API ключ не передан")

    return web.json_response({
        'content_type': content_type,
        'user_agent': user_agent,
    })

app = web.Application()
app.router.add_get('/', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.keep_alive",
    category: "aiohttp.web",
    description:
      'Атрибут только для чтения. Возвращает True если соединение может быть оставлено открытым (keep-alive) после обработки запроса. Для HTTP/1.1 по умолчанию True. Для HTTP/1.0 — True только если клиент явно передал заголовок "Connection: keep-alive".',
    syntax: "request.keep_alive",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    ka = request.keep_alive
    version = request.version
    connection_header = request.headers.get('Connection', '')

    print(f"HTTP версия: {version.major}.{version.minor}")
    print(f"Keep-Alive:  {ka}")
    print(f"Connection:  {connection_header}")

    # HTTP/1.1 без "Connection: close" → keep_alive = True
    # HTTP/1.1 с "Connection: close"   → keep_alive = False
    # HTTP/1.0 без заголовка           → keep_alive = False
    # HTTP/1.0 с "Connection: keep-alive" → keep_alive = True

    return web.Response(
        text=f"Keep-Alive: {ka}",
        headers={'Connection': 'keep-alive' if ka else 'close'}
    )

app = web.Application()
app.router.add_get('/', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.match_info",
    category: "aiohttp.web",
    description:
      'Атрибут только для чтения. Возвращает объект UrlMappingMatchInfo — словарь с именованными параметрами пути, извлечёнными из URL-шаблона маршрута. Например, для маршрута /users/{id} и URL /users/42 вернёт {"id": "42"}. Все значения — строки.',
    syntax: "request.match_info",
    arguments: [],
    example: `import aiohttp.web as web

async def get_user(request):
    # Маршрут: /users/{user_id}/posts/{post_id}
    match = request.match_info

    user_id = match['user_id']          # '42'
    post_id = match.get('post_id', '')  # '7'

    # Преобразование типов (всё приходит как строка):
    try:
        uid = int(user_id)
        pid = int(post_id)
    except ValueError:
        raise web.HTTPBadRequest(reason="ID должен быть числом")

    return web.json_response({
        'user_id': uid,
        'post_id': pid
    })

app = web.Application()
app.router.add_get('/users/{user_id}/posts/{post_id}', get_user)
# web.run_app(app)
# GET /users/42/posts/7 → {"user_id": 42, "post_id": 7}`,
  },
  {
    name: "aiohttp.web.Request.app",
    category: "aiohttp.web",
    description:
      'Атрибут только для чтения. Возвращает экземпляр web.Application, которому принадлежит данный запрос. Используется для доступа к ресурсам приложения (подключениям к БД, кэшу и др.), хранящимся в приложении как в словаре через app["key"].',
    syntax: "request.app",
    arguments: [],
    example: `import aiohttp.web as web
import aiohttp

async def startup(app):
    app['http_client'] = aiohttp.ClientSession()
    app['db_pool'] = None  # здесь было бы asyncpg.create_pool(...)

async def cleanup(app):
    await app['http_client'].close()

async def get_external_data(request):
    # Получаем ресурсы через request.app:
    client = request.app['http_client']

    async with client.get('https://httpbin.org/get') as resp:
        data = await resp.json()

    return web.json_response({'origin': data.get('origin')})

app = web.Application()
app.on_startup.append(startup)
app.on_cleanup.append(cleanup)
app.router.add_get('/external', get_external_data)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.read()",
    category: "aiohttp.web",
    description:
      "Корутина. Читает тело запроса целиком и возвращает объект bytes. Тело буферизуется в памяти — не подходит для очень больших файлов. Повторный вызов возвращает тот же буфер. Максимальный размер ограничен параметром client_max_size приложения (по умолчанию 1 МБ).",
    syntax: "await request.read()",
    arguments: [],
    example: `import aiohttp.web as web
import hashlib

async def upload(request):
    # Читаем тело запроса как сырые байты:
    body = await request.read()

    size = len(body)
    checksum = hashlib.sha256(body).hexdigest()

    print(f"Получено байт: {size}")
    print(f"SHA-256: {checksum}")

    # Обработка бинарных данных:
    if request.content_type == 'image/png':
        # Проверяем PNG-заголовок:
        is_png = body[:8] == b'\\x89PNG\\r\\n\\x1a\\n'
        if not is_png:
            raise web.HTTPBadRequest(reason="Не PNG файл")

    return web.json_response({
        'size': size,
        'sha256': checksum
    })

app = web.Application(client_max_size=10 * 1024 * 1024)  # 10 МБ
app.router.add_post('/upload', upload)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.text()",
    category: "aiohttp.web",
    description:
      "Корутина. Читает тело запроса и возвращает его как строку (str). Кодировка определяется из заголовка Content-Type (charset). Если кодировка не указана — используется UTF-8. Тело буферизуется; повторный вызов возвращает тот же результат.",
    syntax: "await request.text()",
    arguments: [],
    example: `import aiohttp.web as web

async def echo(request):
    # Читаем тело как строку:
    body_text = await request.text()
    print(f"Длина: {len(body_text)} символов")
    print(f"Первые 100 символов: {body_text[:100]}")

    # Пример: приём plain text данных
    lines = body_text.strip().split('\\n')
    print(f"Строк: {len(lines)}")

    return web.Response(
        text=f"Получено {len(body_text)} символов",
        content_type='text/plain'
    )

async def handle_xml(request):
    xml_body = await request.text()
    # Content-Type: application/xml; charset=windows-1251
    # → автоматически декодируется в str

    return web.Response(text=f"XML длиной {len(xml_body)} символов")

app = web.Application()
app.router.add_post('/echo', echo)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.json()",
    category: "aiohttp.web",
    description:
      "Корутина. Читает тело запроса и десериализует его из JSON, возвращая Python-объект (dict, list и т.д.). Использует стандартный модуль json или кастомный loads через параметр. Если тело — невалидный JSON, возбуждает json.JSONDecodeError.",
    syntax: "await request.json(loads=json.loads)",
    arguments: [
      {
        name: "loads",
        description:
          "Функция десериализации JSON. По умолчанию json.loads. Можно передать ujson.loads или orjson.loads для ускорения.",
      },
    ],
    example: `import aiohttp.web as web

async def create_user(request):
    try:
        data = await request.json()
    except Exception:
        raise web.HTTPBadRequest(reason="Невалидный JSON")

    # Валидация обязательных полей:
    name = data.get('name')
    email = data.get('email')

    if not name or not email:
        raise web.HTTPUnprocessableEntity(
            reason="Обязательные поля: name, email"
        )

    # Обработка данных:
    user = {'id': 1, 'name': name, 'email': email}
    return web.json_response(user, status=201)

app = web.Application()
app.router.add_post('/users', create_user)
# web.run_app(app)

# Пример запроса:
# POST /users
# Content-Type: application/json
# {"name": "Иван", "email": "ivan@example.com"}`,
  },
  {
    name: "aiohttp.web.Request.multipart()",
    category: "aiohttp.web",
    description:
      "Корутина. Возвращает объект MultipartReader для построчного (потокового) чтения multipart/form-data запроса. В отличие от post(), читает данные потоково без полной буферизации в памяти — оптимально для загрузки больших файлов.",
    syntax: "await request.multipart()",
    arguments: [],
    example: `import aiohttp.web as web
import aioiofiles  # pip install aiofiles

async def upload_file(request):
    reader = await request.multipart()

    # Читаем части по одной:
    async for part in reader:
        if part.name == 'file':
            filename = part.filename
            size = 0
            # Потоковая запись без буферизации всего файла:
            with open(f'/tmp/{filename}', 'wb') as f:
                while True:
                    chunk = await part.read_chunk(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    size += len(chunk)
            print(f"Сохранён файл: {filename} ({size} байт)")

        elif part.name == 'description':
            desc = await part.text()
            print(f"Описание: {desc}")

    return web.Response(text="Файл загружен")

app = web.Application(client_max_size=100 * 1024 * 1024)  # 100 МБ
app.router.add_post('/upload', upload_file)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.post()",
    category: "aiohttp.web",
    description:
      "Корутина. Читает тело запроса как данные HTML-формы и возвращает объект MultiDict. Обрабатывает Content-Type: application/x-www-form-urlencoded и multipart/form-data. Для файлов — возвращает объекты FileField. Буферизует всё тело в памяти.",
    syntax: "await request.post()",
    arguments: [],
    example: `import aiohttp.web as web

async def handle_form(request):
    data = await request.post()

    # application/x-www-form-urlencoded:
    username = data.get('username', '')
    password = data.get('password', '')
    roles = data.getall('role', [])  # несколько значений одного поля

    print(f"Пользователь: {username}")
    print(f"Роли: {roles}")

    return web.json_response({'username': username, 'roles': roles})

async def handle_upload(request):
    data = await request.post()

    # multipart/form-data с файлом:
    file_field = data.get('avatar')
    if file_field:
        filename = file_field.filename
        content = file_field.file.read()
        print(f"Файл: {filename}, размер: {len(content)} байт")

    return web.Response(text="Форма принята")

app = web.Application()
app.router.add_post('/login', handle_form)
app.router.add_post('/profile', handle_upload)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.status",
    category: "aiohttp.web",
    description:
      "Атрибут объекта ответа. Возвращает или устанавливает HTTP-код статуса ответа (целое число). Стандартные коды: 200 OK, 201 Created, 204 No Content, 301/302 Redirect, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error.",
    syntax: "response.status",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    # Создание ответа с конкретным статусом:
    response = web.Response(status=201, text="Ресурс создан")
    print(response.status)   # 201
    print(response.reason)   # Created

    # Изменение статуса после создания:
    response.status = 202
    print(response.status)   # 202

    return response

async def get_user(request):
    user_id = request.match_info['id']
    user = None  # имитация отсутствия пользователя

    if user is None:
        return web.Response(status=404, text=f"Пользователь {user_id} не найден")

    return web.json_response(user, status=200)

app = web.Application()
app.router.add_get('/users/{id}', get_user)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.reason",
    category: "aiohttp.web",
    description:
      'Атрибут объекта ответа. Возвращает или устанавливает текстовое описание HTTP-статуса (строка). Для стандартных кодов устанавливается автоматически (например, "OK" для 200, "Not Found" для 404). Можно переопределить произвольным текстом.',
    syntax: "response.reason",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    # Стандартный reason по умолчанию:
    r200 = web.Response(status=200)
    print(r200.reason)  # OK

    r404 = web.Response(status=404)
    print(r404.reason)  # Not Found

    r500 = web.Response(status=500)
    print(r500.reason)  # Internal Server Error

    # Переопределение reason:
    custom = web.Response(
        status=422,
        reason="Validation Failed",
        text="Поле email обязательно"
    )
    print(custom.reason)  # Validation Failed

    return custom

app = web.Application()
app.router.add_post('/validate', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.headers",
    category: "aiohttp.web",
    description:
      "Атрибут объекта ответа. Возвращает заголовки ответа в виде объекта CIMultiDict (регистронезависимый изменяемый словарь). Позволяет читать, добавлять и изменять заголовки до отправки ответа клиенту. После вызова prepare() заголовки становятся неизменяемыми.",
    syntax: "response.headers",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    response = web.Response(text="Данные")

    # Добавление заголовков:
    response.headers['X-Request-ID'] = 'abc-123'
    response.headers['Cache-Control'] = 'max-age=3600'
    response.headers['X-Custom-Header'] = 'значение'

    # Чтение заголовков (регистронезависимо):
    print(response.headers.get('content-type'))  # text/plain; charset=utf-8
    print(response.headers.get('Content-Type'))  # то же самое

    return response

async def cors_handler(request):
    response = web.Response(text="OK")
    # CORS заголовки:
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

app = web.Application()
app.router.add_get('/', handle)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.body",
    category: "aiohttp.web",
    description:
      "Атрибут объекта ответа. Возвращает или устанавливает тело ответа в виде объекта bytes или None. При установке bytes автоматически обновляет заголовок Content-Length. Взаимоисключает с атрибутом text — установка одного сбрасывает другое.",
    syntax: "response.body",
    arguments: [],
    example: `import aiohttp.web as web
import json

async def binary_response(request):
    # Установка бинарного тела:
    data = bytes([0x89, 0x50, 0x4E, 0x47])  # PNG заголовок
    response = web.Response(
        body=data,
        content_type='image/png'
    )
    print(response.body)            # b'\\x89PNG'
    print(len(response.body))       # 4
    return response

async def json_manual(request):
    payload = {'status': 'ok', 'count': 42}
    body = json.dumps(payload, ensure_ascii=False).encode('utf-8')

    response = web.Response(
        body=body,
        content_type='application/json',
        charset='utf-8'
    )
    # Изменение тела после создания:
    print(response.body)  # b'{"status": "ok", "count": 42}'
    return response

app = web.Application()
app.router.add_get('/image', binary_response)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.text",
    category: "aiohttp.web",
    description:
      "Атрибут объекта ответа. Возвращает или устанавливает тело ответа как строку (str). При чтении декодирует bytes-тело по кодировке из Content-Type. При записи кодирует строку в bytes. Взаимоисключает с body — установка одного сбрасывает другое.",
    syntax: "response.text",
    arguments: [],
    example: `import aiohttp.web as web

async def handle(request):
    response = web.Response(text="Привет, мир!")

    # Чтение атрибута text:
    print(response.text)    # Привет, мир!
    print(type(response.text))  # <class 'str'>

    # Изменение текста после создания:
    response.text = "Обновлённый текст"
    print(response.text)    # Обновлённый текст
    print(response.body)    # b'\\xd0\\x9e\\xd0\\xb1...' (UTF-8)

    return response

async def dynamic_text(request):
    name = request.query.get('name', 'Незнакомец')
    response = web.Response(content_type='text/plain')
    response.text = f"Добро пожаловать, {name}!"
    # Content-Length обновляется автоматически
    return response

app = web.Application()
app.router.add_get('/', dynamic_text)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.prepare()",
    category: "aiohttp.web",
    description:
      "Корутина. Отправляет HTTP-заголовки ответа клиенту без отправки тела. Вызывается автоматически при использовании обычного Response. Нужна явно при потоковой передаче (StreamResponse) — позволяет отправлять тело по частям через write(). После вызова заголовки нельзя изменить.",
    syntax: "await response.prepare(request)",
    arguments: [
      {
        name: "request",
        description: "Объект web.Request, для которого подготавливается ответ.",
      },
    ],
    example: `import aiohttp.web as web
import asyncio

async def stream_handler(request):
    response = web.StreamResponse(
        status=200,
        reason='OK',
        headers={'Content-Type': 'text/event-stream'}
    )

    # Отправляем заголовки клиенту:
    await response.prepare(request)

    # После prepare() можно отправлять тело по частям:
    for i in range(5):
        data = f"data: событие {i}\\n\\n"
        await response.write(data.encode('utf-8'))
        await asyncio.sleep(1)

    await response.write_eof()
    return response

app = web.Application()
app.router.add_get('/events', stream_handler)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.write()",
    category: "aiohttp.web",
    description:
      "Корутина. Отправляет часть тела ответа клиенту. Используется только со StreamResponse для потоковой передачи данных. Должна вызываться после prepare(). Принимает bytes — строки необходимо предварительно закодировать.",
    syntax: "await response.write(data)",
    arguments: [
      {
        name: "data",
        description:
          'Объект bytes для отправки. Строки необходимо закодировать: data.encode("utf-8").',
      },
    ],
    example: `import aiohttp.web as web
import asyncio
import json

async def sse_handler(request):
    response = web.StreamResponse(headers={
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no'
    })
    await response.prepare(request)

    # Server-Sent Events (SSE) поток:
    for i in range(10):
        event = {
            'id': i,
            'data': f"Сообщение {i}",
            'timestamp': i * 1000
        }
        payload = f"data: {json.dumps(event, ensure_ascii=False)}\\n\\n"
        await response.write(payload.encode('utf-8'))
        await asyncio.sleep(0.5)

    return response

async def chunked_file(request):
    response = web.StreamResponse()
    await response.prepare(request)

    # Отправка большого файла по частям:
    chunk_size = 64 * 1024  # 64 КБ
    with open('/tmp/large_file.bin', 'rb') as f:
        while chunk := f.read(chunk_size):
            await response.write(chunk)

    return response

app = web.Application()
app.router.add_get('/sse', sse_handler)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.write_eof()",
    category: "aiohttp.web",
    description:
      "Корутина. Завершает потоковую передачу данных — сигнализирует клиенту об окончании тела ответа. Используется со StreamResponse после последнего вызова write(). После вызова отправка данных невозможна. Для обычного Response вызывается автоматически.",
    syntax: "await response.write_eof()",
    arguments: [],
    example: `import aiohttp.web as web
import asyncio

async def stream_with_eof(request):
    response = web.StreamResponse(status=200)
    await response.prepare(request)

    lines = ["Строка 1", "Строка 2", "Строка 3", "Конец"]

    for line in lines:
        await response.write(f"{line}\\n".encode('utf-8'))
        await asyncio.sleep(0.2)

    # Явно завершаем поток:
    await response.write_eof()
    # После write_eof() вызов write() вызовет ошибку

    return response

async def progress_stream(request):
    response = web.StreamResponse(headers={
        'Content-Type': 'text/plain; charset=utf-8'
    })
    await response.prepare(request)

    total = 100
    for step in range(0, total + 1, 10):
        await response.write(f"Прогресс: {step}%\\n".encode())
        await asyncio.sleep(0.1)

    await response.write_eof()  # клиент знает, что поток завершён
    return response

app = web.Application()
app.router.add_get('/stream', stream_with_eof)
# web.run_app(app)`,
  },
  {
    name: "aiohttp.web.run_app()",
    category: "aiohttp.web",
    description:
      "Запускает веб-приложение aiohttp в синхронном режиме — создаёт цикл событий, настраивает сервер и блокирует выполнение до получения сигнала остановки (SIGTERM, SIGINT / Ctrl+C). Автоматически вызывает on_startup и on_cleanup. Наиболее простой способ запуска приложения.",
    syntax:
      "web.run_app(app, *, host=None, port=None, path=None, sock=None, shutdown_timeout=60.0, ssl_context=None, print=print, backlog=128, access_log=...)",
    arguments: [
      {
        name: "app",
        description:
          "Экземпляр web.Application или корутина, возвращающая приложение.",
      },
      {
        name: "host",
        description:
          'Хост для прослушивания. По умолчанию "0.0.0.0" (все интерфейсы). Может быть строкой или списком строк.',
      },
      {
        name: "port",
        description:
          "Порт для прослушивания. По умолчанию 8080, или 8443 при использовании ssl_context.",
      },
      {
        name: "path",
        description:
          "Путь к Unix-сокету (строка). Альтернатива host/port для работы через сокет-файл.",
      },
      {
        name: "shutdown_timeout",
        description:
          "Время ожидания завершения активных соединений при остановке (секунды). По умолчанию 60.0.",
      },
      {
        name: "ssl_context",
        description: "Объект ssl.SSLContext для запуска HTTPS-сервера.",
      },
    ],
    example: `import aiohttp.web as web
import ssl

async def handle(request):
    return web.Response(text="Привет!")

app = web.Application()
app.router.add_get('/', handle)

# Простой запуск:
# web.run_app(app)  # 0.0.0.0:8080

# С указанием хоста и порта:
# web.run_app(app, host='127.0.0.1', port=9000)

# HTTPS:
# ssl_ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
# ssl_ctx.load_cert_chain('cert.pem', 'key.pem')
# web.run_app(app, port=443, ssl_context=ssl_ctx)

# Несколько хостов:
# web.run_app(app, host=['127.0.0.1', '::1'], port=8080)

# Unix-сокет (для работы за nginx):
# web.run_app(app, path='/tmp/myapp.sock')

web.run_app(app, host='127.0.0.1', port=8080)`,
  },
  {
    name: "aiohttp.TCPConnector",
    description:
      "Класс библиотеки aiohttp. Управляет пулом TCP-соединений для ClientSession. Позволяет настраивать максимальное количество соединений, параметры SSL, DNS-кэширование и таймауты подключения. Передаётся в ClientSession через параметр connector. Один коннектор может использоваться несколькими сессиями.",
    syntax:
      "connector = aiohttp.TCPConnector(limit=100, ssl=None, ttl_dns_cache=10, use_dns_cache=True, ...)",
    arguments: [
      {
        name: "limit",
        description:
          "Максимальное общее число одновременных соединений. 0 — без ограничений. По умолчанию 100.",
      },
      {
        name: "ssl",
        description:
          "Параметры SSL: None (по умолчанию, стандартная проверка), False (без проверки), ssl.SSLContext или aiohttp.Fingerprint.",
      },
      {
        name: "ttl_dns_cache",
        description: "Время жизни DNS-кэша в секундах. По умолчанию 10.",
      },
      {
        name: "use_dns_cache",
        description: "Включить кэширование DNS-запросов. По умолчанию True.",
      },
    ],
    example: `import aiohttp
import asyncio
import ssl

async def main():
    # Базовое использование с лимитом соединений:
    connector = aiohttp.TCPConnector(limit=50)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.get('https://httpbin.org/get') as resp:
            print(resp.status)

    # Отключение проверки SSL (небезопасно, только для разработки):
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.get('https://self-signed.example.com') as resp:
            print(resp.status)

    # Кастомный SSL-контекст:
    ssl_ctx = ssl.create_default_context(cafile='/path/to/ca-bundle.crt')
    connector = aiohttp.TCPConnector(ssl=ssl_ctx, limit=200)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.get('https://api.example.com') as resp:
            data = await resp.json()

asyncio.run(main())`,
  },
  {
    name: "aiohttp.UnixConnector",
    description:
      "Класс библиотеки aiohttp. Коннектор для подключения через Unix Domain Socket (UDS) вместо TCP. Используется для взаимодействия с локальными сервисами через сокет-файл: Docker daemon, systemd сервисы, nginx, Gunicorn и другие. Быстрее TCP для локальных соединений.",
    syntax: "connector = aiohttp.UnixConnector(path)",
    arguments: [
      {
        name: "path",
        description:
          'Путь к Unix-сокету (файл .sock). Например: "/var/run/docker.sock" или "/tmp/myapp.sock".',
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    # Подключение к Docker daemon через Unix-сокет:
    connector = aiohttp.UnixConnector(path='/var/run/docker.sock')
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.get('http://localhost/v1.41/containers/json') as resp:
            containers = await resp.json()
            for c in containers:
                print(c['Names'], c['Status'])

    # Подключение к кастомному сервису:
    connector = aiohttp.UnixConnector(path='/tmp/myservice.sock')
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.get('http://localhost/api/status') as resp:
            print(await resp.json())

asyncio.run(main())`,
  },
  {
    name: "aiohttp.CookieJar",
    description:
      "Класс библиотеки aiohttp. Хранилище куков для ClientSession. Автоматически сохраняет куки из ответов и отправляет их в следующих запросах, соблюдая политику безопасности (домен, путь, срок действия). Параметр unsafe=True разрешает работу с IP-адресами вместо доменных имён.",
    syntax: "jar = aiohttp.CookieJar(unsafe=False)",
    arguments: [
      {
        name: "unsafe",
        description:
          "Если True — разрешает куки для числовых IP-адресов (по умолчанию запрещено стандартом RFC 2109). По умолчанию False.",
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    # Стандартное использование (куки сохраняются автоматически):
    jar = aiohttp.CookieJar()
    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        await session.post('https://example.com/login',
                           data={'username': 'user', 'password': 'pass'})
        async with session.get('https://example.com/profile') as resp:
            print(await resp.text())

    # Для локальной разработки с IP-адресом:
    jar = aiohttp.CookieJar(unsafe=True)
    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        await session.get('http://127.0.0.1:8080/set-cookie')
        async with session.get('http://127.0.0.1:8080/get-cookie') as resp:
            print(await resp.text())

    # Просмотр сохранённых куков:
    for cookie in jar:
        print(cookie.key, cookie.value)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.FormData",
    description:
      "Класс библиотеки aiohttp. Используется для формирования multipart/form-data или application/x-www-form-urlencoded тела запроса. Позволяет добавлять текстовые поля, файлы, байтовые данные и вложенные части с произвольными заголовками.",
    syntax:
      "form = aiohttp.FormData(fields=(), quote_fields=True, charset=None)",
    arguments: [
      {
        name: "fields",
        description:
          "Начальный список полей формы. Каждый элемент — кортеж (name, value) или словарь.",
      },
      {
        name: "quote_fields",
        description:
          "Экранировать специальные символы в именах полей. По умолчанию True.",
      },
      {
        name: "charset",
        description:
          "Кодировка для текстовых полей. Если None — используется utf-8.",
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        # Загрузка файла:
        form = aiohttp.FormData()
        form.add_field('username', 'ivan')
        form.add_field('file',
                       open('document.pdf', 'rb'),
                       filename='document.pdf',
                       content_type='application/pdf')

        async with session.post('https://api.example.com/upload', data=form) as resp:
            print(resp.status)

        # Несколько файлов:
        form = aiohttp.FormData()
        form.add_field('title', 'Фотографии отпуска')
        for i, path in enumerate(['photo1.jpg', 'photo2.jpg']):
            form.add_field(f'photo_{i}',
                           open(path, 'rb'),
                           filename=path,
                           content_type='image/jpeg')

        async with session.post('https://api.example.com/photos', data=form) as resp:
            result = await resp.json()

asyncio.run(main())`,
  },
  {
    name: "aiohttp.ClientTimeout",
    description:
      "Класс библиотеки aiohttp. Задаёт таймауты для HTTP-запросов на разных этапах соединения. Позволяет раздельно настраивать общий таймаут, таймаут на установку соединения и таймаут на чтение данных. Передаётся в ClientSession или в отдельный запрос.",
    syntax:
      "timeout = aiohttp.ClientTimeout(total=None, connect=None, sock_read=None, sock_connect=None)",
    arguments: [
      {
        name: "total",
        description:
          "Общий таймаут на весь запрос (в секундах): от начала до получения всего ответа. None — без ограничения.",
      },
      {
        name: "connect",
        description:
          "Таймаут на получение соединения из пула (включая DNS и TCP-handshake). None — без ограничения.",
      },
      {
        name: "sock_connect",
        description:
          "Таймаут только на TCP-соединение с хостом. None — без ограничения.",
      },
      {
        name: "sock_read",
        description:
          "Таймаут на чтение порции данных из сокета. None — без ограничения.",
      },
    ],
    example: `import aiohttp
import asyncio

async def main():
    # Глобальный таймаут для всей сессии:
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get('https://httpbin.org/delay/1') as resp:
            print(resp.status)

    # Детальная настройка:
    timeout = aiohttp.ClientTimeout(
        total=60,
        connect=10,
        sock_read=30,
    )
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('https://slow-api.example.com',
                                   timeout=timeout) as resp:
                data = await resp.json()
        except asyncio.TimeoutError:
            print('Превышен таймаут запроса')

asyncio.run(main())`,
  },
  {
    name: "aiohttp.MultipartReader.at_eof",
    description:
      "Метод класса MultipartReader библиотеки aiohttp. Возвращает True, если все части multipart-ответа были прочитаны и достигнут конец потока. Используется в цикле чтения для определения момента завершения обработки multipart-данных.",
    syntax: "reader.at_eof()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.example.com/multipart') as resp:
            reader = aiohttp.MultipartReader.from_response(resp)

            parts = []
            while not reader.at_eof():
                part = await reader.next()
                if part is None:
                    break
                data = await part.read()
                parts.append({
                    'headers': dict(part.headers),
                    'data': data,
                })

            print(f'Прочитано {len(parts)} частей')
            print('Конец потока:', reader.at_eof())   # True

asyncio.run(main())`,
  },
  {
    name: "aiohttp.MultipartReader.next",
    description:
      "Асинхронный метод класса MultipartReader библиотеки aiohttp. Возвращает следующую часть multipart-ответа как объект BodyPartReader или вложенный MultipartReader (для nested multipart). Возвращает None если все части прочитаны.",
    syntax: "part = await reader.next()",
    arguments: [],
    example: `import aiohttp
import asyncio

async def download_multipart(url: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            reader = aiohttp.MultipartReader.from_response(resp)

            index = 0
            while True:
                part = await reader.next()
                if part is None:
                    break

                filename = part.filename

                if filename:
                    data = await part.read()
                    with open(f'downloaded_{filename}', 'wb') as f:
                        f.write(data)
                    print(f'Сохранён файл: {filename} ({len(data)} байт)')
                else:
                    text = await part.text()
                    print(f'Часть {index}: {text[:100]}')

                index += 1

asyncio.run(download_multipart('https://api.example.com/files'))`,
  },
  {
    name: "aiohttp.MultipartWriter.append",
    description:
      "Метод класса MultipartWriter библиотеки aiohttp. Добавляет произвольный объект как часть multipart-запроса. Принимает строки, байты, объекты BytesIO и другие данные. Позволяет задать дополнительные заголовки для части (Content-Type, Content-Disposition и др.).",
    syntax: "writer.append(obj, headers=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Данные для добавления: str, bytes, BytesIO, asyncio.StreamReader или другой объект с поддержкой чтения.",
      },
      {
        name: "headers",
        description:
          "Словарь или CIMultiDict дополнительных заголовков для этой части.",
      },
    ],
    example: `import aiohttp
import asyncio
from aiohttp import MultipartWriter

async def main():
    async with aiohttp.ClientSession() as session:
        with MultipartWriter('form-data') as writer:
            writer.append('Иван Иванов',
                          {'Content-Disposition': 'form-data; name="username"'})

            writer.append(b'binary data',
                          {'Content-Disposition': 'form-data; name="data"',
                           'Content-Type': 'application/octet-stream'})

            with open('photo.jpg', 'rb') as f:
                writer.append(f,
                              {'Content-Disposition': 'form-data; name="photo"; filename="photo.jpg"',
                               'Content-Type': 'image/jpeg'})

        async with session.post('https://api.example.com/upload',
                                data=writer,
                                headers={'Content-Type': writer.content_type}) as resp:
            print(resp.status)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.MultipartWriter.append_json",
    description:
      "Метод класса MultipartWriter библиотеки aiohttp. Сериализует объект в JSON и добавляет его как часть multipart-запроса с Content-Type: application/json. Удобная обёртка над append() для отправки JSON-данных внутри multipart-тела.",
    syntax: "writer.append_json(obj, headers=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Любой JSON-сериализуемый объект: dict, list, str, int и др.",
      },
      {
        name: "headers",
        description:
          "Дополнительные заголовки для части. Content-Type устанавливается автоматически в application/json.",
      },
    ],
    example: `import aiohttp
import asyncio
from aiohttp import MultipartWriter

async def main():
    async with aiohttp.ClientSession() as session:
        with MultipartWriter('mixed') as writer:
            writer.append_json({
                'title': 'Отчёт за январь',
                'author': 'Иван Иванов',
                'tags': ['финансы', 'q1'],
            })

            with open('report.pdf', 'rb') as f:
                writer.append(
                    f,
                    {'Content-Disposition': 'attachment; filename="report.pdf"',
                     'Content-Type': 'application/pdf'},
                )

        async with session.post(
            'https://api.example.com/reports',
            data=writer,
            headers={'Content-Type': writer.content_type},
        ) as resp:
            result = await resp.json()
            print(result)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.MultipartWriter.append_form",
    description:
      "Метод класса MultipartWriter библиотеки aiohttp. Добавляет данные формы как часть multipart-запроса с Content-Type: application/x-www-form-urlencoded. Принимает словарь или список пар (ключ, значение). Используется для вложенных форм внутри multipart-тела.",
    syntax: "writer.append_form(obj, headers=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Данные формы: словарь {str: str} или список пар [(str, str)].",
      },
      { name: "headers", description: "Дополнительные заголовки для части." },
    ],
    example: `import aiohttp
import asyncio
from aiohttp import MultipartWriter

async def main():
    async with aiohttp.ClientSession() as session:
        with MultipartWriter('form-data') as writer:
            writer.append_form({
                'username': 'ivan',
                'email': 'ivan@example.com',
                'role': 'admin',
            })

            writer.append_form([
                ('field1', 'значение1'),
                ('field2', 'значение2'),
            ])

            with open('avatar.png', 'rb') as f:
                writer.append(
                    f,
                    {'Content-Disposition': 'form-data; name="avatar"; filename="avatar.png"',
                     'Content-Type': 'image/png'},
                )

        async with session.post(
            'https://api.example.com/profile',
            data=writer,
            headers={'Content-Type': writer.content_type},
        ) as resp:
            print(resp.status)

asyncio.run(main())`,
  },
  {
    name: "aiohttp.web.get",
    description:
      "Функция маршрутизации серверной части aiohttp. Создаёт объект RouteDef для регистрации обработчика GET-запросов по заданному пути. Используется совместно с app.add_routes() или внутри RouteTableDef как декоратор @routes.get(). Аналоги: web.post(), web.put(), web.patch(), web.delete().",
    syntax: "web.get(path, handler, **kwargs)",
    arguments: [
      {
        name: "path",
        description:
          'URL-путь маршрута. Может содержать динамические сегменты: "/users/{id}" или "/files/{name:.+}".',
      },
      {
        name: "handler",
        description:
          "Асинхронная функция-обработчик: async def handler(request: web.Request) → web.Response.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры: name (имя маршрута для url_for), expect_handler и др.",
      },
    ],
    example: `from aiohttp import web

async def index(request: web.Request) -> web.Response:
    return web.Response(text='Главная')

async def get_user(request: web.Request) -> web.Response:
    user_id = int(request.match_info['id'])
    return web.json_response({'id': user_id, 'name': 'Иван'})

app = web.Application()
app.add_routes([
    web.get('/', index),
    web.get('/users/{id}', get_user, name='user-detail'),
])

# Через RouteTableDef:
routes = web.RouteTableDef()

@routes.get('/')
async def index(request):
    return web.Response(text='Главная')

@routes.get('/users/{id}')
async def get_user(request):
    return web.json_response({'id': request.match_info['id']})

app = web.Application()
app.add_routes(routes)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.post",
    description:
      "Функция маршрутизации серверной части aiohttp. Создаёт объект RouteDef для регистрации обработчика POST-запросов по заданному пути. Используется совместно с app.add_routes() или как декоратор @routes.post() в RouteTableDef.",
    syntax: "web.post(path, handler, **kwargs)",
    arguments: [
      {
        name: "path",
        description:
          "URL-путь маршрута. Может содержать динамические сегменты.",
      },
      {
        name: "handler",
        description:
          "Асинхронная функция-обработчик async def handler(request) → web.Response.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры маршрута: name, expect_handler и др.",
      },
    ],
    example: `from aiohttp import web

routes = web.RouteTableDef()

@routes.post('/users')
async def create_user(request: web.Request) -> web.Response:
    data = await request.json()
    if 'name' not in data:
        raise web.HTTPBadRequest(reason='Поле name обязательно')
    user = {'id': 42, 'name': data['name'], 'email': data.get('email')}
    return web.json_response(user, status=201)

@routes.post('/login')
async def login(request: web.Request) -> web.Response:
    form = await request.post()
    username = form['username']
    password = form['password']
    return web.json_response({'token': 'abc123'})

@routes.post('/upload')
async def upload(request: web.Request) -> web.Response:
    reader = await request.multipart()
    field = await reader.next()
    data = await field.read()
    return web.json_response({'size': len(data)})

app = web.Application()
app.add_routes(routes)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.route",
    description:
      'Функция маршрутизации серверной части aiohttp. Создаёт объект RouteDef для указанного HTTP-метода. Позволяет регистрировать маршрут для любого метода (включая нестандартные) или символа "*" — для обработки всех методов.',
    syntax: "web.route(method, path, handler, **kwargs)",
    arguments: [
      {
        name: "method",
        description:
          'HTTP-метод в верхнем регистре: "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS" или "*" для любого метода.',
      },
      { name: "path", description: "URL-путь маршрута." },
      { name: "handler", description: "Асинхронная функция-обработчик." },
      { name: "**kwargs", description: "Дополнительные параметры маршрута." },
    ],
    example: `from aiohttp import web

async def handle_all(request: web.Request) -> web.Response:
    return web.Response(text=f'Метод: {request.method}')

async def custom_method(request: web.Request) -> web.Response:
    return web.Response(text='PROPFIND запрос обработан')

app = web.Application()
app.add_routes([
    web.route('*', '/echo', handle_all),
    web.route('PROPFIND', '/dav/{path:.+}', custom_method),
    web.route('GET', '/items', handle_all),
    web.route('POST', '/items', handle_all),
])

# Через RouteTableDef:
routes = web.RouteTableDef()

@routes.route('*', '/any')
async def any_method(request):
    return web.Response(text=request.method)

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.view",
    description:
      "Функция маршрутизации серверной части aiohttp. Регистрирует класс-обработчик (наследник web.View) для заданного пути. Класс-обработчик определяет методы get(), post(), put() и др., каждый из которых обрабатывает соответствующий HTTP-метод. Удобно для группировки логики одного ресурса.",
    syntax: "web.view(path, handler, **kwargs)",
    arguments: [
      { name: "path", description: "URL-путь маршрута." },
      {
        name: "handler",
        description:
          "Класс, наследующий web.View, с методами get(), post() и другими HTTP-методами.",
      },
      { name: "**kwargs", description: "Дополнительные параметры: name и др." },
    ],
    example: `from aiohttp import web

class UserView(web.View):
    async def get(self):
        user_id = self.request.match_info['id']
        return web.json_response({'id': user_id, 'name': 'Иван'})

    async def put(self):
        user_id = self.request.match_info['id']
        data = await self.request.json()
        return web.json_response({'id': user_id, **data})

    async def delete(self):
        return web.Response(status=204)

class UsersView(web.View):
    async def get(self):
        return web.json_response([{'id': 1}, {'id': 2}])

    async def post(self):
        data = await self.request.json()
        return web.json_response(data, status=201)

app = web.Application()
app.add_routes([
    web.view('/users', UsersView),
    web.view('/users/{id}', UserView),
])

web.run_app(app)`,
  },
  {
    name: "aiohttp.web.static",
    description:
      "Функция маршрутизации серверной части aiohttp. Регистрирует маршрут для раздачи статических файлов из указанной директории. Все файлы в директории становятся доступны по URL с заданным префиксом. Поддерживает кэширование, сжатие и ETag-заголовки.",
    syntax: "web.static(prefix, path, **kwargs)",
    arguments: [
      {
        name: "prefix",
        description:
          'URL-префикс для статических файлов. Например: "/static" — файлы будут доступны по /static/style.css.',
      },
      {
        name: "path",
        description:
          "Путь к директории со статическими файлами в файловой системе. Строка или pathlib.Path.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры: name (имя маршрута), chunk_size, show_index (показывать листинг), follow_symlinks, append_version.",
      },
    ],
    example: `from aiohttp import web
from pathlib import Path

BASE_DIR = Path(__file__).parent

app = web.Application()

app.add_routes([
    web.static('/static', BASE_DIR / 'static'),
    web.static('/media', BASE_DIR / 'media', name='media'),
])

# Или через router:
app.router.add_static('/assets', path=BASE_DIR / 'assets',
                       show_index=True)

# Структура URL:
# ./static/style.css   → http://localhost:8080/static/style.css
# ./static/app.js      → http://localhost:8080/static/app.js
# ./media/photo.jpg    → http://localhost:8080/media/photo.jpg

async def index(request):
    static_url = request.app.router['media'].url_for(filename='photo.jpg')
    return web.Response(text=f'Фото: {static_url}')

web.run_app(app, host='0.0.0.0', port=8080)`,
  },
  {
    name: "asyncio.run",
    description:
      "Функция библиотеки asyncio. Запускает корутину верхнего уровня, создавая новый цикл событий, выполняя корутину до завершения и закрывая цикл. Является основной точкой входа в асинхронную программу. Не может вызываться из уже работающего цикла событий.",
    syntax: "asyncio.run(coro, *, debug=None, loop_factory=None)",
    arguments: [
      {
        name: "coro",
        description:
          "Корутина для выполнения. Объект, полученный вызовом async def функции.",
      },
      {
        name: "debug",
        description:
          "Режим отладки цикла событий. True — включить, False — выключить, None — использовать переменную среды PYTHONASYNCIODEBUG. По умолчанию None.",
      },
      {
        name: "loop_factory",
        description:
          "Фабрика для создания цикла событий. Если None — используется asyncio.DefaultEventLoopPolicy. Добавлено в Python 3.12.",
      },
    ],
    example: `import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(1)   # Имитация сетевого запроса
    return f'Данные из {url}'

async def main():
    result = await fetch_data('https://api.example.com')
    print(result)

# Запуск программы:
asyncio.run(main())

# С режимом отладки:
asyncio.run(main(), debug=True)

# Нельзя вызывать из работающего цикла событий:
# asyncio.run(main())  ← RuntimeError в Jupyter или если уже есть event loop`,
  },
  {
    name: "asyncio.create_task",
    description:
      "Функция библиотеки asyncio. Оборачивает корутину в объект Task и планирует её выполнение в текущем цикле событий. Задача начинает выполняться при ближайшей возможности (при следующем await). Позволяет запускать несколько корутин параллельно без ожидания каждой из них.",
    syntax: "task = asyncio.create_task(coro, *, name=None, context=None)",
    arguments: [
      { name: "coro", description: "Корутина для выполнения в виде задачи." },
      {
        name: "name",
        description:
          "Имя задачи для отладки. Отображается в repr(task) и логах. По умолчанию None.",
      },
      {
        name: "context",
        description:
          "contextvars.Context для задачи. Если None — копируется текущий контекст. Добавлено в Python 3.11.",
      },
    ],
    example: `import asyncio

async def worker(name: str, delay: float) -> str:
    print(f'{name}: начало')
    await asyncio.sleep(delay)
    print(f'{name}: конец')
    return f'{name}: результат'

async def main():
    # Запуск нескольких задач параллельно:
    task1 = asyncio.create_task(worker('Задача-1', 2.0), name='task-1')
    task2 = asyncio.create_task(worker('Задача-2', 1.0), name='task-2')
    task3 = asyncio.create_task(worker('Задача-3', 1.5), name='task-3')

    # Ожидание завершения всех задач:
    result1 = await task1
    result2 = await task2
    result3 = await task3
    print(result1, result2, result3)

    # Отмена задачи:
    task = asyncio.create_task(worker('Отменяемая', 10.0))
    await asyncio.sleep(0.1)
    task.cancel()

asyncio.run(main())`,
  },
  {
    name: "asyncio.gather",
    description:
      "Функция библиотеки asyncio. Запускает несколько корутин или задач параллельно и ожидает завершения всех. Возвращает список результатов в том же порядке, в котором переданы аргументы. При return_exceptions=False отменяет все задачи при первом исключении.",
    syntax: "results = await asyncio.gather(*aws, return_exceptions=False)",
    arguments: [
      {
        name: "*aws",
        description:
          "Корутины, задачи (Task) или Future-объекты для параллельного выполнения.",
      },
      {
        name: "return_exceptions",
        description:
          "Если False (по умолчанию) — первое исключение немедленно передаётся ожидающей задаче. Если True — исключения возвращаются как результаты, не отменяя остальные.",
      },
    ],
    example: `import asyncio

async def fetch(url: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f'Ответ от {url}'

async def main():
    # Параллельное выполнение, результаты в порядке аргументов:
    results = await asyncio.gather(
        fetch('https://api1.example.com', 1.0),
        fetch('https://api2.example.com', 0.5),
        fetch('https://api3.example.com', 1.5),
    )
    print(results)
    # ['Ответ от api1', 'Ответ от api2', 'Ответ от api3']

    # С обработкой исключений:
    async def failing():
        raise ValueError('Ошибка!')

    results = await asyncio.gather(
        fetch('https://api.example.com', 0.5),
        failing(),
        return_exceptions=True,
    )
    for r in results:
        if isinstance(r, Exception):
            print(f'Ошибка: {r}')
        else:
            print(f'OK: {r}')

asyncio.run(main())`,
  },
  {
    name: "asyncio.sleep",
    description:
      "Корутина библиотеки asyncio. Приостанавливает выполнение текущей задачи на заданное количество секунд, передавая управление циклу событий. Позволяет другим задачам выполняться в это время. asyncio.sleep(0) передаёт управление без задержки.",
    syntax: "await asyncio.sleep(delay, result=None)",
    arguments: [
      {
        name: "delay",
        description:
          "Время ожидания в секундах. Может быть дробным числом. 0 — передать управление без задержки.",
      },
      {
        name: "result",
        description:
          "Значение, которое вернёт корутина после пробуждения. По умолчанию None.",
      },
    ],
    example: `import asyncio

async def main():
    print('Начало')
    await asyncio.sleep(2.5)   # Пауза 2.5 секунды
    print('После паузы')

    # sleep(0) — передать управление другим задачам:
    async def busy_worker():
        for i in range(1000):
            if i % 100 == 0:
                await asyncio.sleep(0)   # Не блокируем цикл событий
            # ... тяжёлые вычисления ...

    # sleep с возвращаемым значением:
    value = await asyncio.sleep(1, result='готово')
    print(value)   # 'готово'

    # Параллельные задачи с разными задержками:
    async def task(name, delay):
        await asyncio.sleep(delay)
        print(f'{name} завершена')

    await asyncio.gather(
        task('Быстрая', 0.5),
        task('Средняя', 1.0),
        task('Медленная', 1.5),
    )

asyncio.run(main())`,
  },
  {
    name: "asyncio.wait",
    description:
      "Корутина библиотеки asyncio. Ожидает завершения набора задач или Future-объектов. В отличие от gather(), возвращает два множества: done (завершённые) и pending (незавершённые). Позволяет гибко управлять ожиданием через параметр return_when.",
    syntax:
      "done, pending = await asyncio.wait(aws, *, timeout=None, return_when=ALL_COMPLETED)",
    arguments: [
      {
        name: "aws",
        description:
          "Множество или список корутин, задач (Task) или Future. Не может быть пустым.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах. По истечении возвращает незавершённые задачи в pending. По умолчанию None (без ограничения).",
      },
      {
        name: "return_when",
        description:
          "Условие возврата: ALL_COMPLETED (по умолчанию, ждёт все), FIRST_COMPLETED (первая завершённая), FIRST_EXCEPTION (первое исключение).",
      },
    ],
    example: `import asyncio

async def worker(n: int, delay: float) -> int:
    await asyncio.sleep(delay)
    return n * 2

async def main():
    tasks = {
        asyncio.create_task(worker(1, 1.0)),
        asyncio.create_task(worker(2, 0.5)),
        asyncio.create_task(worker(3, 1.5)),
    }

    # Ждём все задачи:
    done, pending = await asyncio.wait(tasks)
    for task in done:
        print(task.result())

    # Возврат после первой завершённой:
    tasks = {asyncio.create_task(worker(i, i * 0.5)) for i in range(1, 4)}
    done, pending = await asyncio.wait(
        tasks, return_when=asyncio.FIRST_COMPLETED
    )
    print(f'Первой завершилась: {next(iter(done)).result()}')

    # Отменяем оставшиеся:
    for task in pending:
        task.cancel()

asyncio.run(main())`,
  },
  {
    name: "asyncio.wait_for",
    description:
      "Корутина библиотеки asyncio. Ожидает выполнения корутины или Future с ограничением по времени. При превышении таймаута выбрасывает asyncio.TimeoutError и отменяет задачу. Удобна когда нужно ограничить время выполнения одной операции.",
    syntax: "result = await asyncio.wait_for(aw, timeout)",
    arguments: [
      { name: "aw", description: "Корутина или Future-объект для ожидания." },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах. None — без ограничения (эквивалентно простому await).",
      },
    ],
    example: `import asyncio

async def slow_operation() -> str:
    await asyncio.sleep(10)
    return 'готово'

async def main():
    # Ограничение 5 секундами:
    try:
        result = await asyncio.wait_for(slow_operation(), timeout=5.0)
        print(result)
    except asyncio.TimeoutError:
        print('Операция превысила таймаут!')

    # С обработкой и повторной попыткой:
    for attempt in range(3):
        try:
            result = await asyncio.wait_for(
                slow_operation(), timeout=2.0
            )
            print(f'Успех: {result}')
            break
        except asyncio.TimeoutError:
            print(f'Попытка {attempt + 1}: таймаут')
    else:
        print('Все попытки исчерпаны')

asyncio.run(main())`,
  },
  {
    name: "asyncio.as_completed",
    description:
      "Функция библиотеки asyncio. Принимает список корутин или задач и возвращает итератор Future-объектов, которые завершаются по мере готовности. Позволяет обрабатывать результаты сразу по мере поступления, не дожидаясь завершения всех задач.",
    syntax: "for future in asyncio.as_completed(aws, *, timeout=None):",
    arguments: [
      {
        name: "aws",
        description: "Итерируемый объект корутин, задач (Task) или Future.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания для каждого Future в секундах. При превышении — asyncio.TimeoutError.",
      },
    ],
    example: `import asyncio

async def fetch(url: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f'Данные из {url}'

async def main():
    tasks = [
        fetch('https://api1.example.com', 3.0),
        fetch('https://api2.example.com', 1.0),
        fetch('https://api3.example.com', 2.0),
    ]

    # Обрабатываем результаты по мере готовности:
    for future in asyncio.as_completed(tasks):
        result = await future
        print(f'Получено: {result}')
    # Порядок: api2 (1с), api3 (2с), api1 (3с)

    # С таймаутом:
    for future in asyncio.as_completed(tasks, timeout=1.5):
        try:
            result = await future
            print(result)
        except asyncio.TimeoutError:
            print('Таймаут для одной из задач')

asyncio.run(main())`,
  },
  {
    name: "asyncio.to_thread",
    description:
      "Корутина библиотеки asyncio. Запускает синхронную (блокирующую) функцию в отдельном потоке из пула потоков, не блокируя цикл событий. Позволяет использовать синхронные библиотеки (файловый ввод-вывод, CPU-тяжёлые операции) в асинхронном коде. Добавлено в Python 3.9.",
    syntax: "result = await asyncio.to_thread(func, /, *args, **kwargs)",
    arguments: [
      {
        name: "func",
        description: "Синхронная функция для выполнения в отдельном потоке.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы, передаваемые в func.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы, передаваемые в func.",
      },
    ],
    example: `import asyncio
import time
import requests   # Синхронная библиотека

def blocking_io(path: str) -> str:
    with open(path) as f:
        time.sleep(1)   # Имитация медленного IO
        return f.read()

def blocking_request(url: str) -> dict:
    return requests.get(url).json()

def cpu_heavy(n: int) -> int:
    return sum(i * i for i in range(n))

async def main():
    # Файловый ввод-вывод без блокировки цикла событий:
    content = await asyncio.to_thread(blocking_io, 'data.txt')
    print(content[:100])

    # Синхронный HTTP без блокировки:
    data = await asyncio.to_thread(blocking_request, 'https://api.github.com')
    print(data['current_user_url'])

    # Параллельные CPU-задачи в потоках:
    results = await asyncio.gather(
        asyncio.to_thread(cpu_heavy, 1_000_000),
        asyncio.to_thread(cpu_heavy, 2_000_000),
    )
    print(results)

asyncio.run(main())`,
  },
  {
    name: "asyncio.run_coroutine_threadsafe",
    description:
      "Функция библиотеки asyncio. Планирует выполнение корутины в указанном цикле событий из другого потока (thread-safe). Возвращает объект concurrent.futures.Future, через который можно получить результат или дождаться завершения из синхронного кода. Используется для интеграции синхронного многопоточного кода с асинхронным.",
    syntax: "future = asyncio.run_coroutine_threadsafe(coro, loop)",
    arguments: [
      { name: "coro", description: "Корутина для выполнения в цикле событий." },
      {
        name: "loop",
        description:
          "Работающий цикл событий asyncio, в котором будет выполнена корутина.",
      },
    ],
    example: `import asyncio
import threading

async def async_task(value: int) -> int:
    await asyncio.sleep(1)
    return value * 2

def run_loop(loop):
    loop.run_forever()

async def main():
    # Запуск цикла событий в отдельном потоке:
    loop = asyncio.new_event_loop()
    thread = threading.Thread(target=run_loop, args=(loop,), daemon=True)
    thread.start()

    # Отправка корутины из другого потока:
    future = asyncio.run_coroutine_threadsafe(async_task(21), loop)

    # Ожидание результата (блокирует текущий поток):
    result = future.result(timeout=5.0)
    print(result)   # 42

    # С обработкой исключений:
    future = asyncio.run_coroutine_threadsafe(async_task(10), loop)
    try:
        result = future.result(timeout=2.0)
    except concurrent.futures.TimeoutError:
        print('Таймаут')
    except Exception as e:
        print(f'Ошибка: {e}')

    loop.call_soon_threadsafe(loop.stop)

asyncio.run(main())`,
  },
  {
    name: "asyncio.current_task",
    description:
      "Функция библиотеки asyncio. Возвращает текущий выполняющийся объект Task или None, если вызывается вне задачи (например, в корутине, запущенной через asyncio.run() напрямую). Используется для получения информации о текущей задаче: имени, статуса, отмены.",
    syntax: "task = asyncio.current_task()",
    arguments: [],
    example: `import asyncio

async def worker():
    task = asyncio.current_task()
    print(f'Текущая задача: {task.get_name()}')
    print(f'Отменена: {task.cancelled()}')
    print(f'Завершена: {task.done()}')
    await asyncio.sleep(1)

async def middleware():
    task = asyncio.current_task()
    if task:
        task.set_name('my-important-task')

    await worker()

async def main():
    # В корутине верхнего уровня (asyncio.run):
    print(asyncio.current_task())   # None (это не Task, а coroutine)

    # Внутри create_task:
    task = asyncio.create_task(middleware(), name='main-worker')
    await task

asyncio.run(main())`,
  },
  {
    name: "asyncio.all_tasks",
    description:
      "Функция библиотеки asyncio. Возвращает множество всех незавершённых задач (Task) в текущем цикле событий. Полезна для мониторинга, отладки и мягкого завершения — можно получить все активные задачи и отменить их перед остановкой сервера.",
    syntax: "tasks = asyncio.all_tasks(loop=None)",
    arguments: [
      {
        name: "loop",
        description:
          "Цикл событий, задачи которого нужно получить. Если None — используется текущий цикл. Устарел в Python 3.10, параметр игнорируется.",
      },
    ],
    example: `import asyncio

async def worker(name: str, delay: float):
    await asyncio.sleep(delay)
    print(f'{name} завершена')

async def monitor():
    while True:
        tasks = asyncio.all_tasks()
        # Исключаем текущую задачу монитора:
        active = {t for t in tasks if t is not asyncio.current_task()}
        print(f'Активных задач: {len(active)}')
        for t in active:
            print(f'  - {t.get_name()}')
        await asyncio.sleep(0.5)

async def shutdown():
    tasks = asyncio.all_tasks()
    current = asyncio.current_task()
    for task in tasks:
        if task is not current:
            task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)

async def main():
    asyncio.create_task(worker('A', 2.0), name='worker-a')
    asyncio.create_task(worker('B', 3.0), name='worker-b')
    asyncio.create_task(monitor(), name='monitor')
    await asyncio.sleep(1.5)
    print('Всего задач:', len(asyncio.all_tasks()))

asyncio.run(main())`,
  },
  {
    name: "asyncio.shield",
    description:
      "Функция библиотеки asyncio. Защищает корутину или Future от отмены. Если задача, ожидающая shield(), будет отменена — внутренняя корутина продолжит выполнение. Сам shield() получит CancelledError, но защищённая операция не прервётся.",
    syntax: "result = await asyncio.shield(aw)",
    arguments: [
      {
        name: "aw",
        description:
          "Корутина или Future-объект, которую нужно защитить от отмены.",
      },
    ],
    example: `import asyncio

async def important_cleanup():
    print('Начало важной очистки...')
    await asyncio.sleep(2)
    print('Очистка завершена')
    return 'cleaned'

async def main():
    # Создаём задачу:
    task = asyncio.create_task(
        asyncio.shield(important_cleanup())
    )

    # Отменяем через 0.5 секунды:
    await asyncio.sleep(0.5)
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print('Задача отменена, но очистка продолжается в фоне!')

    # Ждём завершения фоновой очистки:
    await asyncio.sleep(2.0)
    print('Программа завершена')

asyncio.run(main())
# Вывод:
# Начало важной очистки...
# Задача отменена, но очистка продолжается в фоне!
# Очистка завершена`,
  },
  {
    name: "asyncio.timeout",
    description:
      "Менеджер контекста библиотеки asyncio. Задаёт ограничение времени выполнения блока кода через async with. При превышении таймаута выбрасывает asyncio.TimeoutError. Более гибкая альтернатива wait_for(): позволяет охватывать несколько await-выражений одним таймаутом. Добавлено в Python 3.11.",
    syntax: "async with asyncio.timeout(delay):",
    arguments: [
      {
        name: "delay",
        description:
          "Максимальное время выполнения в секундах. None — без ограничения (контекстный менеджер без эффекта).",
      },
    ],
    example: `import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(2)
    return f'данные из {url}'

async def main():
    # Один таймаут на несколько операций:
    try:
        async with asyncio.timeout(5.0):
            data1 = await fetch('https://api1.example.com')
            data2 = await fetch('https://api2.example.com')
            print(data1, data2)
    except asyncio.TimeoutError:
        print('Не уложились в 5 секунд')

    # Можно проверять и изменять deadline:
    try:
        async with asyncio.timeout(3.0) as cm:
            print(f'Дедлайн: {cm.deadline()}')
            await asyncio.sleep(1)
            # Продлить таймаут:
            cm.reschedule(asyncio.get_event_loop().time() + 10)
            await asyncio.sleep(2)
    except asyncio.TimeoutError:
        print('Таймаут')

asyncio.run(main())`,
  },
  {
    name: "asyncio.timeout_at",
    description:
      "Менеджер контекста библиотеки asyncio. Аналог asyncio.timeout(), но принимает абсолютное время (timestamp) вместо задержки. Время задаётся как значение, возвращаемое loop.time(). Удобен когда нужно задать единый дедлайн для нескольких операций на основе абсолютного времени. Добавлено в Python 3.11.",
    syntax: "async with asyncio.timeout_at(when):",
    arguments: [
      {
        name: "when",
        description:
          "Абсолютное время дедлайна в формате loop.time() (float). None — без ограничения.",
      },
    ],
    example: `import asyncio

async def step(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f'{name} готово'

async def main():
    loop = asyncio.get_event_loop()

    # Дедлайн — через 5 секунд от текущего момента:
    deadline = loop.time() + 5.0

    try:
        async with asyncio.timeout_at(deadline):
            r1 = await step('Шаг 1', 1.5)
            print(r1)
            r2 = await step('Шаг 2', 1.5)
            print(r2)
            r3 = await step('Шаг 3', 1.5)   # Может не успеть
            print(r3)
    except asyncio.TimeoutError:
        elapsed = loop.time() - (deadline - 5.0)
        print(f'Таймаут после {elapsed:.1f} сек')

    # Общий дедлайн для группы запросов:
    deadline = loop.time() + 3.0
    async with asyncio.timeout_at(deadline):
        results = await asyncio.gather(
            step('A', 1.0),
            step('B', 2.0),
        )
        print(results)

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.cancel(msg=None)",
    description:
      "Запрашивает отмену задачи Task. В следующий раз, когда задача получит управление в цикле событий, в неё будет брошено исключение CancelledError. Если задача уже завершена или отменена — возвращает False. Параметр msg передаётся в CancelledError и доступен через exception.args.",
    syntax: "task.cancel(msg=None)",
    arguments: [
      {
        name: "msg",
        description:
          "Необязательное сообщение, передаваемое в исключение CancelledError. Доступно через атрибут args исключения. По умолчанию None.",
      },
    ],
    example: `import asyncio

async def long_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("Задача отменена")
        raise  # обязательно перебросить

async def main():
    task = asyncio.create_task(long_task())
    await asyncio.sleep(1)

    cancelled = task.cancel(msg="Превышено время ожидания")
    print(f"Запрос отмены: {cancelled}")  # True

    try:
        await task
    except asyncio.CancelledError as e:
        print(f"Поймано: {e.args}")        # ('Превышено время ожидания',)

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.cancelled()",
    description:
      "Возвращает True, если задача была успешно отменена (завершилась с исключением CancelledError). Возвращает False в любом другом случае — если задача ещё выполняется, завершилась нормально или с другим исключением.",
    syntax: "task.cancelled()",
    arguments: [],
    example: `import asyncio

async def cancellable():
    await asyncio.sleep(5)

async def main():
    task = asyncio.create_task(cancellable())
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        pass

    print(task.cancelled())  # True
    print(task.done())       # True

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.done()",
    description:
      "Возвращает True, если задача завершена — успешно, с исключением или была отменена. Возвращает False, если задача ещё выполняется. Метод не блокирует выполнение и не ожидает завершения задачи.",
    syntax: "task.done()",
    arguments: [],
    example: `import asyncio

async def work():
    await asyncio.sleep(0.1)
    return 42

async def main():
    task = asyncio.create_task(work())

    print(task.done())  # False — задача ещё выполняется

    await task

    print(task.done())    # True
    print(task.result())  # 42

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.result()",
    description:
      "Возвращает результат задачи. Если задача ещё не завершена — возбуждает InvalidStateError. Если задача отменена — возбуждает CancelledError. Если задача завершилась с исключением — повторно возбуждает это исключение.",
    syntax: "task.result()",
    arguments: [],
    example: `import asyncio

async def compute():
    return 100

async def failing():
    raise ValueError("Ошибка вычисления")

async def main():
    # Успешная задача:
    t1 = asyncio.create_task(compute())
    await t1
    print(t1.result())  # 100

    # Задача с исключением:
    t2 = asyncio.create_task(failing())
    try:
        await t2
    except ValueError:
        pass

    try:
        t2.result()  # повторно возбуждает ValueError
    except ValueError as e:
        print(f"Поймано: {e}")  # Ошибка вычисления

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.exception()",
    description:
      "Возвращает исключение, с которым завершилась задача. Если задача завершилась без исключения — возвращает None. Если задача не завершена — возбуждает InvalidStateError. Если задача отменена — возбуждает CancelledError.",
    syntax: "task.exception()",
    arguments: [],
    example: `import asyncio

async def buggy():
    raise RuntimeError("Что-то пошло не так")

async def main():
    task = asyncio.create_task(buggy())

    try:
        await task
    except RuntimeError:
        pass  # перехватываем, чтобы продолжить

    exc = task.exception()
    print(type(exc).__name__)  # RuntimeError
    print(exc)                 # Что-то пошло не так

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.add_done_callback(callback, *, context=None)",
    description:
      "Добавляет функцию обратного вызова, которая будет вызвана при завершении задачи (успешном, с ошибкой или при отмене). Callback получает задачу в качестве единственного аргумента. Можно добавить несколько callback-функций — они вызываются в порядке добавления.",
    syntax: "task.add_done_callback(callback, *, context=None)",
    arguments: [
      {
        name: "callback",
        description:
          "Callable, принимающий один аргумент — завершённую задачу. Вызывается в следующей итерации цикла событий после завершения задачи.",
      },
      {
        name: "context",
        description:
          "Объект contextvars.Context для выполнения callback. По умолчанию None — используется текущий контекст.",
      },
    ],
    example: `import asyncio

def on_done(task):
    if task.cancelled():
        print("Задача отменена")
    elif task.exception():
        print(f"Ошибка: {task.exception()}")
    else:
        print(f"Результат: {task.result()}")

async def work():
    await asyncio.sleep(0.1)
    return "готово"

async def main():
    task = asyncio.create_task(work())
    task.add_done_callback(on_done)
    await task  # Результат: готово

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.remove_done_callback(callback)",
    description:
      "Удаляет callback, ранее добавленный через add_done_callback(). Возвращает количество удалённых экземпляров (один callback мог быть добавлен несколько раз). Если callback не найден — возвращает 0.",
    syntax: "task.remove_done_callback(callback)",
    arguments: [
      {
        name: "callback",
        description:
          "Callable, который нужно удалить из списка обратных вызовов задачи.",
      },
    ],
    example: `import asyncio

def on_done(task):
    print("Вызван callback")

async def work():
    return 42

async def main():
    task = asyncio.create_task(work())
    task.add_done_callback(on_done)

    # Удаляем callback до завершения задачи:
    removed = task.remove_done_callback(on_done)
    print(f"Удалено: {removed}")  # Удалено: 1

    await task  # callback НЕ вызывается

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.get_stack(*, limit=None)",
    description:
      "Возвращает список объектов фрейма (frame) стека вызовов задачи на текущий момент. Если задача выполняется — возвращает стек корутины. Если задача завершилась с исключением — возвращает стек traceback. Полезно для отладки зависших задач.",
    syntax: "task.get_stack(*, limit=None)",
    arguments: [
      {
        name: "limit",
        description:
          "Максимальное количество фреймов стека для возврата. По умолчанию None — возвращаются все фреймы.",
      },
    ],
    example: `import asyncio

async def inner():
    await asyncio.sleep(100)  # зависаем здесь

async def outer():
    await inner()

async def main():
    task = asyncio.create_task(outer())
    await asyncio.sleep(0)  # даём задаче запуститься

    frames = task.get_stack()
    for frame in frames:
        print(f"{frame.f_code.co_filename}:{frame.f_lineno}")

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.print_stack(*, limit=None, file=None)",
    description:
      "Выводит стек вызовов задачи в форматированном виде (аналогично traceback.print_stack). Удобен для быстрой отладки зависших задач без ручного обхода фреймов. Вывод идёт в file (по умолчанию sys.stdout).",
    syntax: "task.print_stack(*, limit=None, file=None)",
    arguments: [
      {
        name: "limit",
        description:
          "Максимальное количество фреймов стека для вывода. По умолчанию None — выводятся все фреймы.",
      },
      {
        name: "file",
        description:
          "Файловый объект для записи вывода. По умолчанию None — выводится в sys.stdout.",
      },
    ],
    example: `import asyncio
import sys

async def hanging_coroutine():
    await asyncio.sleep(999)

async def main():
    task = asyncio.create_task(hanging_coroutine())
    await asyncio.sleep(0)

    print("=== Стек задачи ===")
    task.print_stack(file=sys.stdout)

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.set_name(value)",
    description:
      "Устанавливает имя задачи. Имя используется в repr() задачи и отображается в отладочных сообщениях. Не влияет на поведение задачи — только на её идентификацию при логировании и отладке.",
    syntax: "task.set_name(value)",
    arguments: [
      {
        name: "value",
        description:
          "Новое имя задачи. Обычно строка, описывающая назначение задачи. Преобразуется в строку через str().",
      },
    ],
    example: `import asyncio

async def worker(task_id):
    await asyncio.sleep(1)
    return f"результат-{task_id}"

async def main():
    tasks = []
    for i in range(3):
        task = asyncio.create_task(worker(i))
        task.set_name(f"worker-{i}")
        tasks.append(task)

    for task in tasks:
        print(task.get_name())  # worker-0, worker-1, worker-2

    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())`,
  },

  {
    name: "asyncio.Task.get_name()",
    description:
      "Возвращает имя задачи. Если имя не было установлено явно через set_name() или create_task(name=...), задача получает автоматически сгенерированное имя вида 'Task-N', где N — порядковый номер.",
    syntax: "task.get_name()",
    arguments: [],
    example: `import asyncio

async def my_coroutine():
    await asyncio.sleep(0)

async def main():
    # Автоматическое имя:
    t1 = asyncio.create_task(my_coroutine())
    print(t1.get_name())  # Task-1

    # Явное имя через create_task:
    t2 = asyncio.create_task(my_coroutine(), name="загрузка-данных")
    print(t2.get_name())  # загрузка-данных

    # Имя через set_name:
    t3 = asyncio.create_task(my_coroutine())
    t3.set_name("обработка")
    print(t3.get_name())  # обработка

    await asyncio.gather(t1, t2, t3)

asyncio.run(main())`,
  },

  {
    name: "asyncio.Future.set_result(result)",
    description:
      "Устанавливает результат объекта Future. После этого Future считается завершённым, все ожидающие его задачи и callbacks получают управление. Если Future уже завершён — возбуждает InvalidStateError. Обычно вызывается из кода низкого уровня, не из пользовательских корутин.",
    syntax: "future.set_result(result)",
    arguments: [
      {
        name: "result",
        description:
          "Значение результата Future. Может быть любым Python-объектом, включая None.",
      },
    ],
    example: `import asyncio

async def main():
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    def resolve():
        if not future.done():
            future.set_result("данные получены")

    # Планируем установку результата через 1 секунду:
    loop.call_later(1, resolve)

    result = await future
    print(result)          # данные получены
    print(future.done())   # True
    print(future.result()) # данные получены

asyncio.run(main())`,
  },

  {
    name: "asyncio.Future.set_exception(exception)",
    description:
      "Устанавливает исключение для объекта Future. Все ожидающие задачи получат это исключение при попытке получить результат. Если Future уже завершён — возбуждает InvalidStateError. Нельзя передавать StopIteration — вместо него используйте RuntimeError.",
    syntax: "future.set_exception(exception)",
    arguments: [
      {
        name: "exception",
        description:
          "Экземпляр исключения или класс исключения (без аргументов). Не может быть StopIteration — это вызовет TypeError.",
      },
    ],
    example: `import asyncio

async def main():
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    def fail():
        future.set_exception(ValueError("Недопустимые данные"))

    loop.call_soon(fail)

    try:
        await future
    except ValueError as e:
        print(f"Ошибка: {e}")          # Ошибка: Недопустимые данные

    print(future.done())               # True
    print(future.exception())          # Недопустимые данные

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.empty()",
    description:
      "Возвращает True, если очередь пуста (не содержит элементов), иначе False. Не блокирует выполнение. Используется для проверки наличия элементов перед вызовом get_nowait(), чтобы избежать исключения QueueEmpty.",
    syntax: "queue.empty()",
    arguments: [],
    example: `import asyncio

async def main():
    q = asyncio.Queue()

    print(q.empty())  # True

    await q.put("задача-1")
    await q.put("задача-2")

    print(q.empty())  # False

    await q.get()
    await q.get()

    print(q.empty())  # True

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.full()",
    description:
      "Возвращает True, если очередь заполнена до предела (maxsize), иначе False. Всегда возвращает False для очередей без ограничения размера (maxsize=0). Полезно перед вызовом put_nowait(), чтобы избежать исключения QueueFull.",
    syntax: "queue.full()",
    arguments: [],
    example: `import asyncio

async def main():
    q = asyncio.Queue(maxsize=2)

    print(q.full())  # False

    await q.put("a")
    await q.put("b")

    print(q.full())   # True
    print(q.qsize())  # 2

    # Безограниченная очередь никогда не full:
    infinite_q = asyncio.Queue()
    for i in range(1000):
        await infinite_q.put(i)
    print(infinite_q.full())  # False

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.get()",
    description:
      "Извлекает и возвращает элемент из очереди. Если очередь пуста — ожидает (корутина приостанавливается), пока элемент не появится. Является корутиной — необходимо использовать await. Извлекает элементы в порядке FIFO (первым вошёл — первым вышел).",
    syntax: "await queue.get()",
    arguments: [],
    example: `import asyncio

async def producer(q):
    for i in range(3):
        await asyncio.sleep(0.5)
        await q.put(f"элемент-{i}")
        print(f"Добавлено: элемент-{i}")

async def consumer(q):
    for _ in range(3):
        item = await q.get()  # ожидает появления элемента
        print(f"Получено: {item}")
        q.task_done()

async def main():
    q = asyncio.Queue()
    await asyncio.gather(producer(q), consumer(q))

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.get_nowait()",
    description:
      "Немедленно извлекает и возвращает элемент из очереди. Если очередь пуста — возбуждает исключение asyncio.QueueEmpty, не блокируя выполнение. Не является корутиной — вызывается без await.",
    syntax: "queue.get_nowait()",
    arguments: [],
    example: `import asyncio

async def main():
    q = asyncio.Queue()
    await q.put(42)
    await q.put(99)

    # Извлекаем без ожидания:
    print(q.get_nowait())  # 42
    print(q.get_nowait())  # 99

    # Очередь пуста — исключение:
    try:
        q.get_nowait()
    except asyncio.QueueEmpty:
        print("Очередь пуста!")

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.join()",
    description:
      "Блокирует (как корутина) до тех пор, пока все элементы, когда-либо добавленные в очередь, не будут обработаны. Ожидание завершается, когда для каждого элемента, добавленного через put(), был вызван task_done(). Используется для ожидания полного завершения обработки очереди.",
    syntax: "await queue.join()",
    arguments: [],
    example: `import asyncio

async def worker(q):
    while True:
        item = await q.get()
        print(f"Обрабатываю: {item}")
        await asyncio.sleep(0.2)
        q.task_done()  # сигнализируем об обработке

async def main():
    q = asyncio.Queue()

    # Добавляем задачи:
    for i in range(5):
        await q.put(f"задача-{i}")

    # Запускаем 2 воркера:
    workers = [asyncio.create_task(worker(q)) for _ in range(2)]

    await q.join()  # ждём обработки всех задач
    print("Все задачи обработаны!")

    for w in workers:
        w.cancel()

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.put(item)",
    description:
      "Добавляет элемент в очередь. Если очередь ограничена (maxsize > 0) и заполнена — ожидает (корутина приостанавливается), пока не освободится место. Является корутиной — необходимо использовать await.",
    syntax: "await queue.put(item)",
    arguments: [
      {
        name: "item",
        description:
          "Элемент, добавляемый в очередь. Может быть любым Python-объектом: строкой, числом, словарём, coroutine и т.д.",
      },
    ],
    example: `import asyncio

async def main():
    # Ограниченная очередь:
    q = asyncio.Queue(maxsize=2)

    await q.put("a")
    await q.put("b")

    print(q.full())   # True

    # Следующий put будет ждать:
    async def delayed_get():
        await asyncio.sleep(0.5)
        item = await q.get()
        q.task_done()
        print(f"Извлечено: {item}")

    getter = asyncio.create_task(delayed_get())
    await q.put("c")   # подождёт, пока getter не освободит место
    print("c добавлено")

    await getter

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.put_nowait(item)",
    description:
      "Немедленно добавляет элемент в очередь. Если очередь ограничена и заполнена — возбуждает asyncio.QueueFull, не ожидая освобождения места. Не является корутиной — вызывается без await.",
    syntax: "queue.put_nowait(item)",
    arguments: [
      {
        name: "item",
        description:
          "Элемент для добавления в очередь. Может быть любым Python-объектом.",
      },
    ],
    example: `import asyncio

async def main():
    q = asyncio.Queue(maxsize=2)

    q.put_nowait("первый")
    q.put_nowait("второй")

    print(q.qsize())  # 2
    print(q.full())   # True

    # Очередь заполнена — исключение:
    try:
        q.put_nowait("третий")
    except asyncio.QueueFull:
        print("Очередь переполнена!")

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.qsize()",
    description:
      "Возвращает текущее количество элементов в очереди. Не блокирует выполнение. Результат может устареть в конкурентной среде — между проверкой и следующей операцией другая задача может изменить очередь.",
    syntax: "queue.qsize()",
    arguments: [],
    example: `import asyncio

async def main():
    q = asyncio.Queue()

    print(q.qsize())  # 0

    await q.put("a")
    await q.put("b")
    await q.put("c")

    print(q.qsize())  # 3

    await q.get()
    print(q.qsize())  # 2

    q.put_nowait("d")
    print(q.qsize())  # 3

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.task_done()",
    description:
      "Сигнализирует, что обработка ранее полученного элемента завершена. Должен вызываться ровно один раз после каждого get(). Уменьшает внутренний счётчик незавершённых задач. Когда счётчик достигает нуля, любое ожидание в queue.join() снимается.",
    syntax: "queue.task_done()",
    arguments: [],
    example: `import asyncio

async def worker(name, q):
    while True:
        item = await q.get()
        if item is None:
            break
        print(f"[{name}] обрабатываю {item}")
        await asyncio.sleep(0.1)
        q.task_done()  # обязательно после каждого get()

async def main():
    q = asyncio.Queue()

    tasks = [
        asyncio.create_task(worker("W1", q)),
        asyncio.create_task(worker("W2", q)),
    ]

    for i in range(6):
        await q.put(f"задача-{i}")

    await q.join()   # ждём task_done() для каждого элемента

    # Останавливаем воркеров:
    for _ in tasks:
        await q.put(None)
    await asyncio.gather(*tasks)

asyncio.run(main())`,
  },

  {
    name: "asyncio.Queue.maxsize",
    description:
      "Атрибут, содержащий максимальный размер очереди, заданный при создании. Если равен 0 — очередь не ограничена по размеру (может содержать произвольное количество элементов). Только для чтения — изменить после создания невозможно.",
    syntax: "queue.maxsize",
    arguments: [],
    example: `import asyncio

async def main():
    # Ограниченная очередь:
    q1 = asyncio.Queue(maxsize=10)
    print(q1.maxsize)  # 10

    # Неограниченная очередь:
    q2 = asyncio.Queue()
    print(q2.maxsize)  # 0

    # Проверка ограничения:
    q3 = asyncio.Queue(maxsize=3)
    if q3.maxsize > 0:
        print(f"Очередь ограничена: макс. {q3.maxsize} элементов")
    else:
        print("Очередь неограничена")

asyncio.run(main())`,
  },

  {
    name: "asyncio.Lock.acquire()",
    description:
      "Захватывает блокировку (Lock). Если блокировка уже захвачена другой задачей — ожидает её освобождения. Является корутиной — необходимо использовать await. Рекомендуется использовать через async with, который автоматически вызывает acquire() и release().",
    syntax: "await lock.acquire()",
    arguments: [],
    example: `import asyncio

async def worker(lock, name):
    print(f"{name}: жду блокировки...")
    async with lock:  # эквивалентно await lock.acquire() + lock.release()
        print(f"{name}: захватил блокировку")
        await asyncio.sleep(1)
        print(f"{name}: освобождаю блокировку")

async def main():
    lock = asyncio.Lock()
    await asyncio.gather(
        worker(lock, "Задача-1"),
        worker(lock, "Задача-2"),
    )

asyncio.run(main())`,
  },

  {
    name: "asyncio.Lock.release()",
    description:
      "Освобождает ранее захваченную блокировку. Если после освобождения есть ожидающие задачи — одна из них немедленно получит блокировку. Если блокировка не была захвачена — возбуждает RuntimeError. Не является корутиной.",
    syntax: "lock.release()",
    arguments: [],
    example: `import asyncio

async def main():
    lock = asyncio.Lock()

    # Ручное управление:
    await lock.acquire()
    print(f"Захвачена: {lock.locked()}")  # True
    try:
        # критическая секция
        await asyncio.sleep(0.1)
    finally:
        lock.release()  # всегда освобождать в finally
        print(f"Захвачена: {lock.locked()}")  # False

asyncio.run(main())`,
  },

  {
    name: "asyncio.Lock.locked()",
    description:
      "Возвращает True, если блокировка в данный момент захвачена какой-либо задачей, иначе False. Не блокирует выполнение. Используется для проверки состояния без попытки захвата.",
    syntax: "lock.locked()",
    arguments: [],
    example: `import asyncio

async def main():
    lock = asyncio.Lock()

    print(lock.locked())  # False

    await lock.acquire()
    print(lock.locked())  # True

    lock.release()
    print(lock.locked())  # False

    # Проверка перед попыткой захвата:
    if not lock.locked():
        await lock.acquire()
        lock.release()

asyncio.run(main())`,
  },

  {
    name: "asyncio.Event.set()",
    description:
      "Устанавливает внутренний флаг Event в True. Все задачи, ожидающие события через wait(), немедленно пробуждаются. Последующие вызовы wait() не блокируются — возвращают управление немедленно, пока не будет вызван clear().",
    syntax: "event.set()",
    arguments: [],
    example: `import asyncio

async def waiter(event, name):
    print(f"{name}: жду события...")
    await event.wait()
    print(f"{name}: событие получено!")

async def main():
    event = asyncio.Event()

    tasks = [
        asyncio.create_task(waiter(event, "Задача-1")),
        asyncio.create_task(waiter(event, "Задача-2")),
        asyncio.create_task(waiter(event, "Задача-3")),
    ]

    await asyncio.sleep(1)
    print("Устанавливаю событие...")
    event.set()  # пробуждает все три задачи сразу

    await asyncio.gather(*tasks)

asyncio.run(main())`,
  },

  {
    name: "asyncio.Event.clear()",
    description:
      "Сбрасывает внутренний флаг Event в False. После этого задачи, вызывающие wait(), снова будут ожидать следующего set(). Не влияет на задачи, уже прошедшие через wait() до вызова clear().",
    syntax: "event.clear()",
    arguments: [],
    example: `import asyncio

async def main():
    event = asyncio.Event()

    event.set()
    print(event.is_set())  # True

    await event.wait()     # не блокирует — флаг уже установлен
    print("Прошли без ожидания")

    event.clear()
    print(event.is_set())  # False

    # Теперь wait() будет ожидать:
    async def setter():
        await asyncio.sleep(0.5)
        event.set()

    asyncio.create_task(setter())
    await event.wait()     # ждёт 0.5 сек
    print("Событие снова установлено")

asyncio.run(main())`,
  },

  {
    name: "asyncio.Event.wait()",
    description:
      "Ожидает установки флага Event. Если флаг уже установлен — возвращает True немедленно. Если не установлен — блокирует (приостанавливает корутину) до вызова set() другой задачей. Является корутиной — необходимо использовать await.",
    syntax: "await event.wait()",
    arguments: [],
    example: `import asyncio

async def main():
    ready = asyncio.Event()
    results = []

    async def data_loader():
        await asyncio.sleep(1)
        results.append("данные загружены")
        ready.set()  # сигнализируем о готовности

    async def processor():
        await ready.wait()  # ждём загрузки данных
        print(f"Обрабатываю: {results[0]}")

    await asyncio.gather(data_loader(), processor())

asyncio.run(main())`,
  },

  {
    name: "asyncio.Event.is_set()",
    description:
      "Возвращает True, если внутренний флаг Event установлен (был вызван set()), иначе False. Не блокирует выполнение. Позволяет синхронно проверить состояние события без ожидания.",
    syntax: "event.is_set()",
    arguments: [],
    example: `import asyncio

async def main():
    event = asyncio.Event()

    print(event.is_set())  # False

    event.set()
    print(event.is_set())  # True

    event.clear()
    print(event.is_set())  # False

    # Условный await:
    if not event.is_set():
        asyncio.create_task(
            asyncio.sleep(0)  # даём другим задачам шанс
        )

asyncio.run(main())`,
  },

  {
    name: "asyncio.Semaphore.acquire()",
    description:
      "Захватывает семафор — уменьшает внутренний счётчик на 1. Если счётчик уже равен 0 — ожидает (корутина приостанавливается), пока другая задача не вызовет release(). Является корутиной. Рекомендуется использовать через async with.",
    syntax: "await semaphore.acquire()",
    arguments: [],
    example: `import asyncio

async def fetch(semaphore, url):
    async with semaphore:  # не более 3 одновременных запросов
        print(f"Загружаю {url}")
        await asyncio.sleep(1)  # имитация HTTP-запроса
        print(f"Готово: {url}")

async def main():
    semaphore = asyncio.Semaphore(3)  # лимит — 3 одновременно

    urls = [f"https://example.com/page/{i}" for i in range(10)]
    await asyncio.gather(*[fetch(semaphore, url) for url in urls])

asyncio.run(main())`,
  },

  {
    name: "asyncio.Semaphore.release()",
    description:
      "Освобождает семафор — увеличивает внутренний счётчик на 1. Если есть задачи, ожидающие в acquire(), одна из них немедленно получает семафор. Не является корутиной. Для BoundedSemaphore возбуждает ValueError при превышении начального значения.",
    syntax: "semaphore.release()",
    arguments: [],
    example: `import asyncio

async def main():
    sem = asyncio.Semaphore(2)

    await sem.acquire()
    await sem.acquire()
    print(f"Захвачено: {sem.locked()}")  # True

    sem.release()
    print(f"После release: {sem._value}")  # 1

    sem.release()
    print(f"После release: {sem._value}")  # 2
    print(f"Захвачено: {sem.locked()}")    # False

asyncio.run(main())`,
  },

  {
    name: "asyncio.Semaphore.locked()",
    description:
      "Возвращает True, если семафор полностью исчерпан (внутренний счётчик равен 0) и следующий acquire() будет блокировать. Возвращает False, если есть свободные слоты. Не блокирует выполнение.",
    syntax: "semaphore.locked()",
    arguments: [],
    example: `import asyncio

async def main():
    sem = asyncio.Semaphore(2)

    print(sem.locked())  # False — есть 2 свободных слота

    await sem.acquire()
    print(sem.locked())  # False — остался 1 слот

    await sem.acquire()
    print(sem.locked())  # True — слотов нет

    sem.release()
    print(sem.locked())  # False — освободился 1 слот

asyncio.run(main())`,
  },

  {
    name: "asyncio.Condition.acquire()",
    description:
      "Захватывает внутренний Lock объекта Condition. Является корутиной. Condition используется для ожидания определённого условия с возможностью уведомления других задач. Рекомендуется использовать через async with condition.",
    syntax: "await condition.acquire()",
    arguments: [],
    example: `import asyncio

async def main():
    condition = asyncio.Condition()

    # Ручное управление:
    await condition.acquire()
    try:
        print("Захвачено условие")
        condition.notify_all()
    finally:
        condition.release()

    # Рекомендуется: async with:
    async with condition:
        print("Захвачено через async with")
        condition.notify_all()

asyncio.run(main())`,
  },

  {
    name: "asyncio.Condition.release()",
    description:
      "Освобождает внутренний Lock объекта Condition. Должен вызываться только после успешного acquire(). Не является корутиной. При использовании async with вызывается автоматически при выходе из блока.",
    syntax: "condition.release()",
    arguments: [],
    example: `import asyncio

async def main():
    cond = asyncio.Condition()

    await cond.acquire()
    print("Lock захвачен")

    # обработка...
    await asyncio.sleep(0.1)

    cond.release()
    print("Lock освобождён")

    # Безопаснее использовать async with:
    async with cond:
        pass  # release() вызывается автоматически

asyncio.run(main())`,
  },

  {
    name: "asyncio.Condition.notify(n=1)",
    description:
      "Уведомляет n ожидающих задач, что условие могло измениться. Пробуждённые задачи снова конкурируют за захват Lock. Должен вызываться только при захваченном Lock (внутри async with condition). Если ожидающих задач меньше n — уведомляет всех.",
    syntax: "condition.notify(n=1)",
    arguments: [
      {
        name: "n",
        description:
          "Количество задач для уведомления. По умолчанию 1 — уведомляется одна задача. Передайте большее число для уведомления нескольких задач одновременно.",
      },
    ],
    example: `import asyncio

async def consumer(cond, name, items):
    async with cond:
        await cond.wait()  # ждём уведомления
        print(f"{name}: получил уведомление, items={items}")

async def producer(cond, items):
    await asyncio.sleep(1)
    async with cond:
        items.append("новый_элемент")
        cond.notify(1)  # уведомляем одного потребителя
        print("Отправлено уведомление одному")

async def main():
    cond = asyncio.Condition()
    items = []
    await asyncio.gather(
        consumer(cond, "C1", items),
        consumer(cond, "C2", items),
        producer(cond, items),
    )

asyncio.run(main())`,
  },

  {
    name: "asyncio.Condition.notify_all()",
    description:
      "Уведомляет все задачи, ожидающие в Condition.wait(). Все пробуждённые задачи конкурируют за повторный захват Lock. Должен вызываться только при захваченном Lock. Эквивалентно notify(n) где n — количество всех ожидающих задач.",
    syntax: "condition.notify_all()",
    arguments: [],
    example: `import asyncio

shared = {"ready": False}

async def worker(cond, name):
    async with cond:
        while not shared["ready"]:
            await cond.wait()
        print(f"{name}: работаю с данными")

async def controller(cond):
    await asyncio.sleep(1)
    async with cond:
        shared["ready"] = True
        cond.notify_all()  # пробуждаем всех воркеров
        print("Все воркеры уведомлены")

async def main():
    cond = asyncio.Condition()
    await asyncio.gather(
        worker(cond, "W1"),
        worker(cond, "W2"),
        worker(cond, "W3"),
        controller(cond),
    )

asyncio.run(main())`,
  },

  {
    name: "asyncio.Condition.wait()",
    description:
      "Освобождает Lock и ожидает уведомления через notify() или notify_all(). После получения уведомления повторно захватывает Lock перед возвратом. Должна вызываться только при захваченном Lock. Является корутиной — необходимо использовать await.",
    syntax: "await condition.wait()",
    arguments: [],
    example: `import asyncio

async def main():
    cond = asyncio.Condition()
    data = []

    async def producer():
        await asyncio.sleep(0.5)
        async with cond:
            data.append(42)
            cond.notify()  # пробуждаем потребителя

    async def consumer():
        async with cond:
            while not data:
                await cond.wait()  # освобождает Lock, ждёт notify()
            print(f"Получены данные: {data[0]}")  # 42

    await asyncio.gather(consumer(), producer())

asyncio.run(main())`,
  },

  {
    name: "asyncio.open_connection(host=None, port=None, ...)",
    description:
      "Устанавливает TCP-соединение с указанным хостом и портом. Возвращает пару (StreamReader, StreamWriter) для чтения и записи данных. Является корутиной — необходимо использовать await. Высокоуровневая обёртка над loop.create_connection().",
    syntax:
      "reader, writer = await asyncio.open_connection(host=None, port=None, *, limit=2**16, ssl=None, ...)",
    arguments: [
      {
        name: "host",
        description:
          "Хост для подключения: строка с IP-адресом или доменным именем. None означает localhost.",
      },
      {
        name: "port",
        description: "Номер порта для подключения. Целое число от 1 до 65535.",
      },
      {
        name: "ssl",
        description:
          "SSL-контекст (ssl.SSLContext) для защищённого соединения. True — использовать стандартный контекст. None (по умолчанию) — без SSL.",
      },
      {
        name: "limit",
        description:
          "Максимальный размер буфера StreamReader в байтах. По умолчанию 64 КБ (2**16).",
      },
    ],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection(
        "httpbin.org", 80
    )

    # Отправляем HTTP-запрос:
    request = (
        "GET /get HTTP/1.0\\r\\n"
        "Host: httpbin.org\\r\\n"
        "\\r\\n"
    )
    writer.write(request.encode())
    await writer.drain()

    # Читаем ответ:
    data = await reader.read(1024)
    print(data.decode())

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.start_server(client_connected_cb, host=None, port=None, ...)",
    description:
      "Запускает TCP-сервер, принимающий входящие подключения. При каждом новом подключении вызывается callback client_connected_cb(reader, writer). Является корутиной. Возвращает объект Server, который можно использовать как асинхронный контекстный менеджер.",
    syntax:
      "server = await asyncio.start_server(client_connected_cb, host=None, port=None, *, limit=2**16, ssl=None, ...)",
    arguments: [
      {
        name: "client_connected_cb",
        description:
          "Корутина или callable, вызываемый для каждого нового подключения. Получает два аргумента: StreamReader и StreamWriter.",
      },
      {
        name: "host",
        description:
          "Хост для прослушивания. None — прослушивать все интерфейсы (0.0.0.0).",
      },
      {
        name: "port",
        description: "Порт для прослушивания входящих соединений.",
      },
      {
        name: "ssl",
        description:
          "SSL-контекст для защищённого сервера (TLS). По умолчанию None — без SSL.",
      },
    ],
    example: `import asyncio

async def handle_client(reader, writer):
    addr = writer.get_extra_info("peername")
    print(f"Подключился: {addr}")

    data = await reader.readline()
    message = data.decode().strip()
    print(f"Получено: {message!r}")

    writer.write(f"Эхо: {message}\\n".encode())
    await writer.drain()

    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(
        handle_client, "127.0.0.1", 8888
    )
    async with server:
        print("Сервер запущен на порту 8888")
        await server.serve_forever()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamReader.read(n=-1)",
    description:
      "Читает до n байт из потока. Если n=-1 — читает до конца потока (EOF). Если данных нет — ожидает их поступления. Является корутиной. Возвращает bytes. Возвращает пустой bytes b'' при достижении EOF.",
    syntax: "data = await reader.read(n=-1)",
    arguments: [
      {
        name: "n",
        description:
          "Максимальное количество байт для чтения. -1 (по умолчанию) — читать до EOF. При n=0 возвращает b'' немедленно.",
      },
    ],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    # Читать ровно 100 байт:
    chunk = await reader.read(100)
    print(f"Получено {len(chunk)} байт: {chunk!r}")

    # Читать всё до закрытия соединения:
    all_data = await reader.read(-1)
    print(f"Всего получено: {len(all_data)} байт")

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamReader.readline()",
    description:
      "Читает одну строку из потока — до символа '\\n' включительно. Если '\\n' не найден до EOF — возвращает всё, что успело поступить. Является корутиной. Возвращает bytes. Удобна для построчного чтения текстовых протоколов.",
    syntax: "line = await reader.readline()",
    arguments: [],
    example: `import asyncio

async def handle(reader, writer):
    # Читаем команды построчно:
    while True:
        line = await reader.readline()
        if not line:
            break  # EOF — клиент отключился

        command = line.decode().strip()
        print(f"Команда: {command!r}")

        if command == "QUIT":
            writer.write(b"До свидания\\n")
            await writer.drain()
            break
        else:
            writer.write(f"OK: {command}\\n".encode())
            await writer.drain()

    writer.close()`,
  },

  {
    name: "asyncio.StreamReader.readexactly(n)",
    description:
      "Читает ровно n байт из потока. Ожидает поступления данных, пока не будет прочитано указанное количество байт. Если соединение закрылось раньше — возбуждает asyncio.IncompleteReadError. Является корутиной.",
    syntax: "data = await reader.readexactly(n)",
    arguments: [
      {
        name: "n",
        description:
          "Точное количество байт для чтения. Если до EOF пришло меньше n байт — возбуждается IncompleteReadError с атрибутом partial, содержащим прочитанные данные.",
      },
    ],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    # Протокол: первые 4 байта — длина сообщения
    try:
        header = await reader.readexactly(4)
        length = int.from_bytes(header, "big")
        print(f"Ожидаемая длина: {length} байт")

        body = await reader.readexactly(length)
        print(f"Тело сообщения: {body!r}")

    except asyncio.IncompleteReadError as e:
        print(f"Соединение прервано, получено: {e.partial!r}")

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamReader.readuntil(separator=b'\\n')",
    description:
      "Читает данные из потока до нахождения разделителя (включительно). Возвращает bytes с данными, включая разделитель. Если данные превышают лимит буфера — возбуждает LimitOverrunError. Если EOF достигнут до разделителя — возбуждает IncompleteReadError.",
    syntax: "data = await reader.readuntil(separator=b'\\n')",
    arguments: [
      {
        name: "separator",
        description:
          "Байтовый разделитель, до которого нужно читать (включительно). По умолчанию b'\\n' (перевод строки).",
      },
    ],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    # Читать до разделителя "\\r\\n" (HTTP-заголовки):
    try:
        line = await reader.readuntil(b"\\r\\n")
        print(f"Строка: {line!r}")  # включает \\r\\n

        # Пользовательский разделитель:
        chunk = await reader.readuntil(b"||END||")
        print(f"Блок данных: {chunk!r}")

    except asyncio.LimitOverrunError:
        print("Данные превысили лимит буфера!")
    except asyncio.IncompleteReadError as e:
        print(f"EOF без разделителя: {e.partial!r}")

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamReader.at_eof()",
    description:
      "Возвращает True, если StreamReader достиг конца потока (EOF) и внутренний буфер пуст. Не блокирует выполнение. Используется для проверки завершения потока без попытки чтения.",
    syntax: "reader.at_eof()",
    arguments: [],
    example: `import asyncio

async def read_all(reader):
    chunks = []
    while not reader.at_eof():
        chunk = await reader.read(1024)
        if chunk:
            chunks.append(chunk)
    return b"".join(chunks)

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    all_data = await read_all(reader)
    print(f"Получено всего: {len(all_data)} байт")
    print(f"EOF: {reader.at_eof()}")  # True

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.write(data)",
    description:
      "Записывает данные в буфер потока для последующей отправки. Не является корутиной — возвращает управление немедленно. Данные не обязательно сразу отправляются по сети. После write() рекомендуется вызывать await writer.drain() для сброса буфера.",
    syntax: "writer.write(data)",
    arguments: [
      {
        name: "data",
        description:
          "Байтовый объект (bytes, bytearray, memoryview) для записи в поток. Строки необходимо предварительно кодировать: data.encode('utf-8').",
      },
    ],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    # Запись не является корутиной:
    writer.write(b"Hello, Server!\\n")

    # Несколько write() подряд — данные буферизуются:
    writer.write(b"Строка 1\\n")
    writer.write(b"Строка 2\\n")
    writer.write(b"Строка 3\\n")

    # drain() сбрасывает буфер в сеть:
    await writer.drain()

    response = await reader.readline()
    print(response.decode())

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.writelines(data)",
    description:
      "Записывает последовательность байтовых объектов в буфер потока. Эквивалентно последовательным вызовам write() для каждого элемента. Не является корутиной. После вызова рекомендуется await writer.drain().",
    syntax: "writer.writelines(data)",
    arguments: [
      {
        name: "data",
        description:
          "Итерируемый объект, содержащий байтовые строки (bytes, bytearray). Каждый элемент записывается в буфер последовательно.",
      },
    ],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    lines = [
        b"GET / HTTP/1.0\\r\\n",
        b"Host: 127.0.0.1\\r\\n",
        b"User-Agent: asyncio-client\\r\\n",
        b"\\r\\n",
    ]

    writer.writelines(lines)   # записывает все строки разом
    await writer.drain()       # сбрасывает буфер в сеть

    response = await reader.read(4096)
    print(response.decode())

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.drain()",
    description:
      "Ожидает сброса буфера записи в сеть. Является корутиной. Позволяет контролировать поток данных (flow control) — если буфер переполнен, drain() ожидает, пока данные не будут переданы. Рекомендуется вызывать после каждого write() или серии записей.",
    syntax: "await writer.drain()",
    arguments: [],
    example: `import asyncio

async def send_large_data(writer, data, chunk_size=65536):
    # Отправка больших данных с контролем потока:
    offset = 0
    while offset < len(data):
        chunk = data[offset:offset + chunk_size]
        writer.write(chunk)
        await writer.drain()  # ждём, пока буфер разгрузится
        offset += chunk_size
        print(f"Отправлено: {offset}/{len(data)} байт")

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    large_payload = b"X" * (1024 * 1024)  # 1 МБ
    await send_large_data(writer, large_payload)

    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.close()",
    description:
      "Инициирует закрытие потока и соединения. Не является корутиной — возвращает управление немедленно, закрытие происходит асинхронно. После close() необходимо дождаться полного закрытия через await writer.wait_closed().",
    syntax: "writer.close()",
    arguments: [],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    writer.write(b"Последнее сообщение\\n")
    await writer.drain()

    # Закрываем соединение:
    writer.close()

    # Ждём полного закрытия:
    await writer.wait_closed()

    print(f"Соединение закрыто: {writer.is_closing()}")

    # Рекомендуемый паттерн через try/finally:
    reader2, writer2 = await asyncio.open_connection("127.0.0.1", 8888)
    try:
        writer2.write(b"данные\\n")
        await writer2.drain()
    finally:
        writer2.close()
        await writer2.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.is_closing()",
    description:
      "Возвращает True, если StreamWriter находится в процессе закрытия или уже закрыт (после вызова close()). Не блокирует выполнение. Полезно для проверки состояния соединения перед попыткой записи.",
    syntax: "writer.is_closing()",
    arguments: [],
    example: `import asyncio

async def safe_write(writer, data):
    if not writer.is_closing():
        writer.write(data)
        await writer.drain()
    else:
        print("Соединение закрывается, запись невозможна")

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    print(writer.is_closing())  # False

    await safe_write(writer, b"данные\\n")

    writer.close()
    print(writer.is_closing())  # True

    await writer.wait_closed()

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.wait_closed()",
    description:
      "Ожидает полного закрытия соединения после вызова close(). Является корутиной. Гарантирует, что все буферизованные данные были отправлены или отброшены, а соединение полностью завершено перед продолжением выполнения.",
    syntax: "await writer.wait_closed()",
    arguments: [],
    example: `import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    writer.write(b"Финальные данные\\n")
    await writer.drain()

    # Закрываем и ждём полного завершения:
    writer.close()
    await writer.wait_closed()  # блокирует до полного закрытия

    print("Соединение полностью закрыто")

asyncio.run(main())`,
  },

  {
    name: "asyncio.StreamWriter.get_extra_info(name, default=None)",
    description:
      "Возвращает дополнительную информацию о транспорте или соединении по имени атрибута. Позволяет получить IP-адрес и порт удалённой стороны, SSL-объект, сокет и другие низкоуровневые данные соединения.",
    syntax: "writer.get_extra_info(name, default=None)",
    arguments: [
      {
        name: "name",
        description:
          "Имя запрашиваемого атрибута. Наиболее используемые: 'peername' (адрес удалённой стороны), 'sockname' (локальный адрес), 'socket' (объект сокета), 'ssl_object' (SSL-объект для TLS-соединений).",
      },
      {
        name: "default",
        description:
          "Значение по умолчанию, возвращаемое если атрибут не найден. По умолчанию None.",
      },
    ],
    example: `import asyncio

async def handle_client(reader, writer):
    # Получаем информацию о подключении:
    peername = writer.get_extra_info("peername")
    sockname = writer.get_extra_info("sockname")
    socket   = writer.get_extra_info("socket")

    print(f"Клиент: {peername[0]}:{peername[1]}")
    print(f"Сервер: {sockname[0]}:{sockname[1]}")
    print(f"Сокет: {socket}")

    # Для TLS-соединений:
    ssl_obj = writer.get_extra_info("ssl_object", default=None)
    if ssl_obj:
        print(f"Шифр: {ssl_obj.cipher()}")

    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle_client, "127.0.0.1", 8888)
    async with server:
        await server.serve_forever()

asyncio.run(main())`,
  },

  {
    name: "loop.run_until_complete(future)",
    description:
      "Запускает цикл событий и блокирует выполнение до завершения переданной корутины, задачи или Future. Возвращает результат выполнения. Если цикл уже запущен — возбуждает RuntimeError. Основной способ запуска asyncio-кода в синхронном контексте (низкоуровневый аналог asyncio.run()).",
    syntax: "result = loop.run_until_complete(future)",
    arguments: [
      {
        name: "future",
        description:
          "Корутина, asyncio.Task, asyncio.Future или любой awaitable-объект. Корутина автоматически оборачивается в Task.",
      },
    ],
    example: `import asyncio

async def fetch_data():
    await asyncio.sleep(1)
    return {"status": "ok", "data": [1, 2, 3]}

# Низкоуровневое использование:
loop = asyncio.new_event_loop()

try:
    result = loop.run_until_complete(fetch_data())
    print(result)  # {'status': 'ok', 'data': [1, 2, 3]}
finally:
    loop.close()

# Современный аналог (рекомендуется):
# result = asyncio.run(fetch_data())`,
  },

  {
    name: "loop.run_forever()",
    description:
      "Запускает цикл событий и работает бесконечно, пока не будет вызван loop.stop(). Используется для долгоживущих серверных приложений, где нет единственной «главной» корутины. Блокирует текущий поток выполнения.",
    syntax: "loop.run_forever()",
    arguments: [],
    example: `import asyncio

def schedule_task(loop):
    async def periodic():
        for i in range(3):
            print(f"Итерация {i}")
            await asyncio.sleep(1)
        loop.stop()  # останавливаем после 3 итераций

    asyncio.ensure_future(periodic(), loop=loop)

loop = asyncio.new_event_loop()
schedule_task(loop)

try:
    loop.run_forever()  # блокирует до loop.stop()
    print("Цикл остановлен")
finally:
    loop.close()`,
  },

  {
    name: "loop.stop()",
    description:
      "Останавливает цикл событий. Если цикл запущен через run_forever() — он завершит текущую итерацию и вернёт управление вызывающей стороне. Не является корутиной. Обычно вызывается из callback или другого потока.",
    syntax: "loop.stop()",
    arguments: [],
    example: `import asyncio
import threading

loop = asyncio.new_event_loop()

async def worker():
    for i in range(5):
        print(f"Работаю: {i}")
        await asyncio.sleep(0.5)

# Остановить цикл из другого потока через 2 сек:
def stopper():
    import time
    time.sleep(2)
    loop.call_soon_threadsafe(loop.stop)

t = threading.Thread(target=stopper, daemon=True)
t.start()

asyncio.ensure_future(worker(), loop=loop)
loop.run_forever()  # остановится через ~2 сек
loop.close()
print("Завершено")`,
  },

  {
    name: "loop.is_running()",
    description:
      "Возвращает True, если цикл событий в данный момент выполняется (активен), иначе False. Не блокирует выполнение. Полезно для проверки состояния цикла перед вызовами, требующими (или запрещающими) активный цикл.",
    syntax: "loop.is_running()",
    arguments: [],
    example: `import asyncio

loop = asyncio.new_event_loop()

print(loop.is_running())  # False — цикл не запущен

async def check():
    # Внутри корутины цикл уже запущен:
    current = asyncio.get_event_loop()
    print(current.is_running())  # True

    # Нельзя вызвать run_until_complete() когда is_running() == True
    # Используйте asyncio.create_task() или await вместо этого

loop.run_until_complete(check())

print(loop.is_running())  # False — цикл завершил работу
loop.close()`,
  },

  {
    name: "loop.is_closed()",
    description:
      "Возвращает True, если цикл событий был закрыт методом close(). Закрытый цикл нельзя использовать повторно. Не блокирует выполнение. Полезно для проверки перед попыткой запустить или использовать цикл.",
    syntax: "loop.is_closed()",
    arguments: [],
    example: `import asyncio

loop = asyncio.new_event_loop()

print(loop.is_closed())  # False

async def task():
    await asyncio.sleep(0.1)
    return "готово"

loop.run_until_complete(task())
print(loop.is_closed())  # False — цикл завершил задачу, но не закрыт

loop.close()
print(loop.is_closed())  # True

# Попытка использовать закрытый цикл:
try:
    loop.run_until_complete(task())
except RuntimeError as e:
    print(f"Ошибка: {e}")  # Event loop is closed`,
  },

  {
    name: "loop.close()",
    description:
      "Закрывает цикл событий и освобождает все связанные ресурсы. После закрытия цикл нельзя использовать повторно. Не останавливает работающий цикл — сначала нужно вызвать stop(). Рекомендуется вызывать в блоке finally для гарантированной очистки ресурсов.",
    syntax: "loop.close()",
    arguments: [],
    example: `import asyncio

async def main():
    await asyncio.sleep(0.1)
    return "результат"

loop = asyncio.new_event_loop()

try:
    result = loop.run_until_complete(main())
    print(result)  # результат
finally:
    # Корректное завершение:
    pending = asyncio.all_tasks(loop)
    for task in pending:
        task.cancel()
    if pending:
        loop.run_until_complete(
            asyncio.gather(*pending, return_exceptions=True)
        )
    loop.close()

print(loop.is_closed())  # True`,
  },

  {
    name: "loop.create_future()",
    description:
      "Создаёт и возвращает новый объект asyncio.Future, привязанный к данному циклу событий. Предпочтительный способ создания Future, так как подклассы цикла могут возвращать альтернативные реализации Future для повышения производительности.",
    syntax: "future = loop.create_future()",
    arguments: [],
    example: `import asyncio

async def setter(future, value):
    await asyncio.sleep(1)
    future.set_result(value)

async def main():
    loop = asyncio.get_event_loop()

    # Создаём Future вручную:
    future = loop.create_future()

    # Запускаем задачу, которая установит результат:
    asyncio.create_task(setter(future, "данные готовы"))

    # Ожидаем результата:
    result = await future
    print(result)  # данные готовы

asyncio.run(main())`,
  },

  {
    name: "loop.create_task(coro, *, name=None, context=None)",
    description:
      "Планирует выполнение корутины как Task в цикле событий. Возвращает объект asyncio.Task. Task начинает выполняться при следующей итерации цикла. Аналогичен asyncio.create_task(), но применяется при явном управлении циклом.",
    syntax: "task = loop.create_task(coro, *, name=None, context=None)",
    arguments: [
      {
        name: "coro",
        description:
          "Объект корутины для выполнения в качестве Task. Не запускается немедленно — добавляется в очередь цикла событий.",
      },
      {
        name: "name",
        description:
          "Имя задачи (строка). Используется в отладке и repr(). Доступно через task.get_name().",
      },
      {
        name: "context",
        description:
          "Объект contextvars.Context для выполнения корутины. None — используется текущий контекст.",
      },
    ],
    example: `import asyncio

async def background_job(name, delay):
    await asyncio.sleep(delay)
    print(f"{name} завершено за {delay}с")
    return name

async def main():
    loop = asyncio.get_event_loop()

    t1 = loop.create_task(background_job("задача-1", 1), name="job-1")
    t2 = loop.create_task(background_job("задача-2", 2), name="job-2")

    print(f"Имя: {t1.get_name()}")  # job-1

    results = await asyncio.gather(t1, t2)
    print(results)  # ['задача-1', 'задача-2']

asyncio.run(main())`,
  },

  {
    name: "loop.call_soon(callback, *args, context=None)",
    description:
      "Планирует вызов callback с аргументами args на следующей итерации цикла событий. Callback вызывается в порядке FIFO. Возвращает asyncio.Handle, который можно отменить через handle.cancel(). Не является корутиной — предназначен для синхронных функций.",
    syntax: "handle = loop.call_soon(callback, *args, context=None)",
    arguments: [
      {
        name: "callback",
        description:
          "Синхронная функция (callable) для вызова. Не может быть корутиной — для корутин используйте create_task().",
      },
      {
        name: "*args",
        description:
          "Позиционные аргументы, передаваемые в callback при вызове.",
      },
      {
        name: "context",
        description:
          "Объект contextvars.Context для выполнения callback. None — текущий контекст.",
      },
    ],
    example: `import asyncio

def on_event(name, value):
    print(f"Событие [{name}]: {value}")

async def main():
    loop = asyncio.get_event_loop()

    # Запланировать вызов на следующей итерации:
    handle = loop.call_soon(on_event, "клик", 42)

    # handle позволяет отменить до выполнения:
    # handle.cancel()

    loop.call_soon(on_event, "загрузка", "завершена")
    loop.call_soon(print, "call_soon выполняется в FIFO-порядке")

    await asyncio.sleep(0)  # уступаем управление циклу

asyncio.run(main())`,
  },

  {
    name: "loop.call_later(delay, callback, *args, context=None)",
    description:
      "Планирует вызов callback через delay секунд (может быть дробным числом). Возвращает asyncio.TimerHandle. Если несколько callback запланированы на одно время — они вызываются в порядке регистрации. Предназначен для синхронных функций.",
    syntax: "handle = loop.call_later(delay, callback, *args, context=None)",
    arguments: [
      {
        name: "delay",
        description:
          "Задержка в секундах (float). Может быть дробным: 0.5 — полсекунды, 0.001 — миллисекунда.",
      },
      {
        name: "callback",
        description: "Синхронная функция для вызова после задержки.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы для callback.",
      },
    ],
    example: `import asyncio

def alarm(message):
    print(f"Сигнал: {message}")

async def main():
    loop = asyncio.get_event_loop()

    # Запланировать через 1 и 2 секунды:
    loop.call_later(1.0, alarm, "через 1 сек")
    loop.call_later(2.0, alarm, "через 2 сек")
    h = loop.call_later(3.0, alarm, "через 3 сек (отменён)")

    # Отменяем третий:
    h.cancel()

    await asyncio.sleep(2.5)  # ждём выполнения первых двух

asyncio.run(main())`,
  },

  {
    name: "loop.call_at(when, callback, *args, context=None)",
    description:
      "Планирует вызов callback в абсолютный момент времени when (по часам цикла событий, loop.time()). Аналог call_later, но принимает абсолютное время вместо относительной задержки. Возвращает asyncio.TimerHandle.",
    syntax: "handle = loop.call_at(when, callback, *args, context=None)",
    arguments: [
      {
        name: "when",
        description:
          "Абсолютное время вызова по шкале loop.time() (float, секунды). Должно быть больше текущего loop.time(), иначе callback выполнится немедленно.",
      },
      {
        name: "callback",
        description:
          "Синхронная функция для вызова в указанный момент времени.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы для callback.",
      },
    ],
    example: `import asyncio

def scheduled_job(label):
    print(f"Выполнено: {label}")

async def main():
    loop = asyncio.get_event_loop()
    now = loop.time()

    print(f"Текущее время цикла: {now:.3f}")

    # Запланировать через 1 и 2 секунды от текущего момента:
    loop.call_at(now + 1.0, scheduled_job, "t+1с")
    loop.call_at(now + 2.0, scheduled_job, "t+2с")

    # В прошлом — выполнится немедленно:
    loop.call_at(now - 1.0, scheduled_job, "прошлое время")

    await asyncio.sleep(2.5)

asyncio.run(main())`,
  },

  {
    name: "loop.time()",
    description:
      "Возвращает текущее монотонное время по внутренним часам цикла событий в виде числа с плавающей точкой (секунды). Монотонное время никогда не идёт назад, даже при переводе системных часов. Используется как основа для call_at() и измерения интервалов.",
    syntax: "t = loop.time()",
    arguments: [],
    example: `import asyncio

async def measure_performance():
    loop = asyncio.get_event_loop()

    start = loop.time()
    print(f"Начало: {start:.6f}")

    await asyncio.sleep(0.5)

    end = loop.time()
    elapsed = end - start
    print(f"Конец:  {end:.6f}")
    print(f"Прошло: {elapsed:.3f}с")  # ~0.500с

    # Использование с call_at():
    target = loop.time() + 1.0
    loop.call_at(target, print, "Выполнено через 1 сек")
    await asyncio.sleep(1.1)

asyncio.run(measure_performance())`,
  },
  {
    name: "aiohttp.web.Request.version",
    description:
      "Атрибут, возвращающий версию HTTP-протокола входящего запроса. Значение представлено как именованный кортеж с полями major и minor (например, (1, 1) для HTTP/1.1).",
    syntax: "request.version",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    version = request.version
    print(version.major, version.minor)  # 1 1
    return web.Response(text=f'HTTP/{version.major}.{version.minor}')

app = web.Application()
app.router.add_get('/', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.url",
    description:
      "Атрибут, возвращающий полный URL запроса в виде объекта yarl.URL. Содержит схему, хост, путь, строку запроса и другие компоненты адреса.",
    syntax: "request.url",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    url = request.url
    print(url.scheme)   # http
    print(url.host)     # localhost
    print(url.path)     # /items
    print(url.query)    # <MultiDictProxy>
    return web.Response(text=str(url))

app = web.Application()
app.router.add_get('/items', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.path",
    description:
      'Атрибут, возвращающий путь URL запроса без строки запроса (query string) и без хоста. Например, для URL http://example.com/users?page=1 вернёт "/users".',
    syntax: "request.path",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    path = request.path
    # GET http://localhost/api/users?page=2
    print(path)  # /api/users
    return web.Response(text=path)

app = web.Application()
app.router.add_get('/api/users', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.query",
    description:
      "Атрибут, возвращающий параметры строки запроса (query string) в виде объекта MultiDictProxy. Поддерживает множественные значения для одного ключа. Является распарсенным представлением query_string.",
    syntax: "request.query",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    # GET /search?q=python&page=1&tag=async&tag=web
    q = request.query.get('q', '')          # 'python'
    page = request.query.get('page', '1')   # '1'
    tags = request.query.getall('tag', [])  # ['async', 'web']
    return web.Response(text=f'q={q}, page={page}, tags={tags}')

app = web.Application()
app.router.add_get('/search', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.query_string",
    description:
      'Атрибут, возвращающий сырую строку запроса (query string) URL без символа "?". Если параметров нет — возвращает пустую строку.',
    syntax: "request.query_string",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    # GET /search?q=python&page=2
    qs = request.query_string
    print(qs)  # 'q=python&page=2'
    return web.Response(text=qs)

app = web.Application()
app.router.add_get('/search', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.headers",
    description:
      "Атрибут, возвращающий заголовки HTTP-запроса в виде объекта CIMultiDictProxy (нечувствительного к регистру MultiDict). Позволяет получать заголовки по имени, независимо от регистра ключа.",
    syntax: "request.headers",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    content_type = request.headers.get('Content-Type', 'не задан')
    auth = request.headers.get('Authorization', '')
    user_agent = request.headers.get('User-Agent', '')

    print(content_type)  # application/json
    print(auth)          # Bearer eyJ...
    return web.Response(text=f'UA: {user_agent}')

app = web.Application()
app.router.add_post('/data', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.keep_alive",
    description:
      "Атрибут, возвращающий булево значение: True, если соединение поддерживает keep-alive (постоянное соединение), False — если соединение будет закрыто после ответа. Зависит от версии HTTP и заголовка Connection.",
    syntax: "request.keep_alive",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    if request.keep_alive:
        print('Соединение будет сохранено')
    else:
        print('Соединение будет закрыто')
    return web.Response(text=str(request.keep_alive))

app = web.Application()
app.router.add_get('/', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.match_info",
    description:
      "Атрибут, возвращающий объект UrlMappingMatchInfo с переменными, извлечёнными из шаблона маршрута. Используется для получения динамических сегментов пути, объявленных в фигурных скобках при регистрации маршрута.",
    syntax: "request.match_info",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    # Маршрут: /users/{user_id}/posts/{post_id}
    user_id = request.match_info['user_id']
    post_id = request.match_info['post_id']
    return web.Response(text=f'user={user_id}, post={post_id}')

app = web.Application()
app.router.add_get('/users/{user_id}/posts/{post_id}', handler)
web.run_app(app)
# GET /users/42/posts/7 -> user=42, post=7`,
  },
  {
    name: "aiohttp.web.Request.app",
    description:
      "Атрибут, возвращающий экземпляр web.Application, к которому относится данный запрос. Позволяет обращаться к глобальным ресурсам приложения (например, к пулу соединений с базой данных, настройкам и другим объектам, сохранённым в app).",
    syntax: "request.app",
    arguments: [],
    example: `from aiohttp import web
import aiopg

async def handler(request: web.Request) -> web.Response:
    # Получаем пул БД, сохранённый при старте приложения
    pool = request.app['db_pool']
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute('SELECT count(*) FROM users')
            count = await cur.fetchone()
    return web.Response(text=f'Users: {count[0]}')

async def startup(app):
    app['db_pool'] = await aiopg.create_pool('dbname=test')

app = web.Application()
app.on_startup.append(startup)
app.router.add_get('/', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.read()",
    description:
      "Корутина, которая читает всё тело запроса и возвращает его в виде объекта bytes. Подходит для обработки бинарных данных. Повторный вызов на том же объекте запроса вернёт уже прочитанные данные из кэша.",
    syntax: "await request.read()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    body: bytes = await request.read()
    print(f'Получено {len(body)} байт')
    print(body[:50])  # первые 50 байт

    # Повторный вызов безопасен — данные кэшируются:
    body_again = await request.read()
    assert body == body_again

    return web.Response(text=f'Размер тела: {len(body)} байт')

app = web.Application()
app.router.add_post('/upload', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.text()",
    description:
      "Корутина, которая читает тело запроса и декодирует его в строку. Кодировка определяется из заголовка Content-Type (charset). Если кодировка не указана, по умолчанию используется UTF-8.",
    syntax: "await request.text()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    # Content-Type: text/plain; charset=utf-8
    text = await request.text()
    print(f'Получен текст: {text}')
    return web.Response(text=f'Эхо: {text}')

app = web.Application()
app.router.add_post('/echo', handler)
web.run_app(app)

# curl -X POST http://localhost:8080/echo \\
#      -H "Content-Type: text/plain" \\
#      -d "Привет, мир!"`,
  },
  {
    name: "aiohttp.web.Request.json()",
    description:
      "Корутина, которая читает тело запроса и десериализует его из формата JSON в объект Python (dict, list и т.д.). Использует стандартный модуль json или пользовательский загрузчик, если он задан. Выбрасывает исключение, если тело не является валидным JSON.",
    syntax: "await request.json(loads=json.loads)",
    arguments: [
      {
        name: "loads",
        description:
          "Необязательная функция для десериализации JSON. По умолчанию используется json.loads из стандартной библиотеки. Можно передать альтернативу, например ujson.loads.",
      },
    ],
    example: `from aiohttp import web
import json

async def handler(request: web.Request) -> web.Response:
    try:
        data = await request.json()
    except json.JSONDecodeError:
        raise web.HTTPBadRequest(text='Невалидный JSON')

    name = data.get('name', 'Аноним')
    age = data.get('age', 0)
    return web.Response(text=f'Привет, {name}! Тебе {age} лет.')

app = web.Application()
app.router.add_post('/greet', handler)
web.run_app(app)

# curl -X POST http://localhost:8080/greet \\
#      -H "Content-Type: application/json" \\
#      -d '{"name": "Алиса", "age": 30}'`,
  },
  {
    name: "aiohttp.web.Request.multipart()",
    description:
      'Метод, возвращающий MultipartReader для последовательного чтения частей multipart-запроса (например, при загрузке файлов через форму с enctype="multipart/form-data"). Каждая часть читается отдельно как поток.',
    syntax: "request.multipart()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    reader = await request.multipart()

    uploaded_files = []
    async for part in reader:
        if part.filename:
            # Читаем содержимое файла
            content = await part.read()
            uploaded_files.append({
                'filename': part.filename,
                'size': len(content),
                'content_type': part.headers.get('Content-Type')
            })

    return web.json_response({'uploaded': uploaded_files})

app = web.Application()
app.router.add_post('/upload', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Request.post()",
    description:
      "Корутина, которая читает и парсит тело запроса как данные HTML-формы (application/x-www-form-urlencoded или multipart/form-data). Возвращает объект MultiDictProxy с полями формы. Для multipart-запросов файлы доступны как объекты FileField.",
    syntax: "await request.post()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    # Content-Type: application/x-www-form-urlencoded
    data = await request.post()

    username = data.get('username', '')
    password = data.get('password', '')

    if not username or not password:
        raise web.HTTPBadRequest(text='Заполните все поля')

    # Для multipart/form-data доступны и файлы:
    # file_field = data.get('avatar')  # FileField
    # content = file_field.file.read()

    return web.Response(text=f'Пользователь: {username}')

app = web.Application()
app.router.add_post('/login', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.status",
    description:
      "Атрибут, возвращающий или устанавливающий HTTP-статус код ответа в виде целого числа. По умолчанию равен 200. Может быть изменён до вызова prepare().",
    syntax: "response.status",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    response = web.Response(text='Не найдено')
    response.status = 404
    print(response.status)  # 404
    return response

app = web.Application()
app.router.add_get('/missing', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.reason",
    description:
      'Атрибут, возвращающий или устанавливающий текстовое пояснение к HTTP-статусу (reason phrase). Например, для статуса 404 стандартное значение — "Not Found". Если не задано явно, определяется автоматически на основе кода статуса.',
    syntax: "response.reason",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    response = web.Response(status=418)
    print(response.reason)   # "I'm a Teapot"

    # Можно задать своё пояснение:
    response.reason = 'Custom Reason'
    print(response.reason)   # "Custom Reason"
    return response

app = web.Application()
app.router.add_get('/', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.headers",
    description:
      "Атрибут, возвращающий заголовки ответа в виде объекта CIMultiDict (нечувствительного к регистру). Позволяет читать и изменять заголовки ответа до его отправки клиенту. После вызова prepare() заголовки становятся неизменяемыми.",
    syntax: "response.headers",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    response = web.Response(text='Привет')

    response.headers['X-Custom-Header'] = 'my-value'
    response.headers['Cache-Control'] = 'no-cache'

    print(response.headers['Content-Type'])  # text/plain; charset=utf-8
    return response

app = web.Application()
app.router.add_get('/', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.body",
    description:
      "Атрибут, возвращающий или устанавливающий тело ответа в виде объекта bytes. При установке значения автоматически обновляется заголовок Content-Length. Несовместим с атрибутом text — можно использовать только один из них.",
    syntax: "response.body",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    response = web.Response()
    response.body = b'\\x89PNG\\r\\n...'  # бинарные данные
    response.content_type = 'image/png'

    print(len(response.body))  # размер в байтах
    return response

app = web.Application()
app.router.add_get('/image', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.text",
    description:
      "Атрибут, возвращающий или устанавливающий тело ответа в виде строки. При чтении декодирует bytes-тело с кодировкой из Content-Type. При записи кодирует строку в bytes и обновляет Content-Length. Несовместим с атрибутом body.",
    syntax: "response.text",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    response = web.Response()
    response.text = 'Привет, мир!'
    response.content_type = 'text/plain'

    print(response.text)        # 'Привет, мир!'
    print(type(response.body))  # <class 'bytes'>
    return response

app = web.Application()
app.router.add_get('/', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.prepare()",
    description:
      "Корутина, которая инициализирует HTTP-ответ: отправляет строку статуса и заголовки клиенту. После вызова изменение заголовков невозможно. Обычно вызывается явно при потоковой передаче данных (streaming), перед последовательными вызовами write().",
    syntax: "await response.prepare(request)",
    arguments: [
      {
        name: "request",
        description:
          "Объект web.Request текущего запроса, для которого подготавливается ответ.",
      },
    ],
    example: `from aiohttp import web
import asyncio

async def handler(request: web.Request) -> web.StreamResponse:
    response = web.StreamResponse()
    response.content_type = 'text/plain'

    # Отправляем заголовки клиенту
    await response.prepare(request)

    # Теперь можно писать данные по частям
    for i in range(5):
        await response.write(f'Строка {i}\\n'.encode())
        await asyncio.sleep(0.5)

    return response

app = web.Application()
app.router.add_get('/stream', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.write()",
    description:
      "Корутина, отправляющая порцию данных в теле ответа клиенту. Может вызываться многократно для потоковой передачи. Перед первым вызовом write() необходимо вызвать prepare(). Принимает данные в виде bytes.",
    syntax: "await response.write(data)",
    arguments: [
      {
        name: "data",
        description:
          'Данные типа bytes для отправки клиенту. Строки необходимо предварительно закодировать, например: data.encode("utf-8").',
      },
    ],
    example: `from aiohttp import web
import asyncio

async def handler(request: web.Request) -> web.StreamResponse:
    response = web.StreamResponse()
    await response.prepare(request)

    lines = ['Первая строка', 'Вторая строка', 'Третья строка']
    for line in lines:
        await response.write((line + '\\n').encode('utf-8'))
        await asyncio.sleep(0.3)

    await response.write_eof()
    return response

app = web.Application()
app.router.add_get('/stream', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.Response.write_eof()",
    description:
      "Корутина, сигнализирующая об окончании потоковой передачи тела ответа. Отправляет финальный пустой чанк при chunked-кодировании. После вызова дальнейшая запись в ответ невозможна. Обычно вызывается явно только при потоковых ответах (StreamResponse); для обычного Response вызывается автоматически.",
    syntax: "await response.write_eof()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.StreamResponse:
    response = web.StreamResponse()
    await response.prepare(request)

    await response.write(b'chunk 1\\n')
    await response.write(b'chunk 2\\n')
    await response.write(b'chunk 3\\n')

    # Явно завершаем поток
    await response.write_eof()
    return response

app = web.Application()
app.router.add_get('/chunked', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.run_app()",
    description:
      "Функция для запуска aiohttp-приложения. Создаёт event loop, инициализирует приложение, запускает TCP-сервер и блокирует выполнение до получения сигнала завершения (Ctrl+C / SIGTERM). Является основной точкой входа для запуска aiohttp-сервера в production и разработке.",
    syntax:
      "web.run_app(app, *, host=None, port=None, path=None, ssl_context=None, shutdown_timeout=60.0, keepalive_timeout=75.0, access_log=...)",
    arguments: [
      {
        name: "app",
        description:
          "Экземпляр web.Application или корутина/функция, возвращающая приложение (Application Factory).",
      },
      {
        name: "host",
        description:
          'Хост для привязки сервера. По умолчанию "0.0.0.0" (все интерфейсы). Можно передать строку или список строк.',
      },
      {
        name: "port",
        description:
          "Порт для прослушивания. По умолчанию 8080, или 8443 при использовании SSL.",
      },
      {
        name: "path",
        description:
          "Путь к Unix-сокету вместо TCP. Если задан — host и port игнорируются.",
      },
      {
        name: "ssl_context",
        description:
          "Объект ssl.SSLContext для включения HTTPS. Если не задан — сервер работает по HTTP.",
      },
      {
        name: "shutdown_timeout",
        description:
          "Таймаут в секундах на завершение активных соединений при остановке сервера. По умолчанию 60.0.",
      },
    ],
    example: `from aiohttp import web
import ssl

async def index(request: web.Request) -> web.Response:
    return web.Response(text='Привет от aiohttp!')

app = web.Application()
app.router.add_get('/', index)

# Простой запуск на localhost:8080
web.run_app(app)

# Запуск на конкретном хосте и порту
web.run_app(app, host='127.0.0.1', port=9000)

# Запуск с HTTPS
ssl_ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_ctx.load_cert_chain('cert.pem', 'key.pem')
web.run_app(app, port=443, ssl_context=ssl_ctx)

# Запуск через Unix-сокет
web.run_app(app, path='/tmp/myapp.sock')`,
  },
  {
    name: "aiohttp.TCPConnector",
    description:
      "Класс для управления пулом TCP-соединений в aiohttp. Контролирует максимальное количество одновременных соединений, настройки SSL, DNS-кэш и время жизни соединений. Используется при создании ClientSession для тонкой настройки сетевого слоя.",
    syntax:
      "aiohttp.TCPConnector(limit=100, ssl=None, ttl_dns_cache=10, use_dns_cache=True, keepalive_timeout=15.0, enable_cleanup_closed=False)",
    arguments: [
      {
        name: "limit",
        description:
          "Максимальное количество одновременных соединений во всём пуле. По умолчанию 100. Значение 0 — без ограничений.",
      },
      {
        name: "ssl",
        description:
          "Настройки SSL: объект ssl.SSLContext, False (отключить проверку сертификата) или None (использовать настройки по умолчанию).",
      },
      {
        name: "ttl_dns_cache",
        description:
          "Время жизни DNS-кэша в секундах. По умолчанию 10. Помогает снизить количество DNS-запросов при частых обращениях к одному хосту.",
      },
      {
        name: "keepalive_timeout",
        description:
          "Время в секундах, в течение которого неактивное соединение остаётся в пуле. По умолчанию 15.0.",
      },
    ],
    example: `import aiohttp
import ssl

# Базовое использование с лимитом соединений
connector = aiohttp.TCPConnector(limit=50)

async with aiohttp.ClientSession(connector=connector) as session:
    async with session.get('https://example.com') as resp:
        print(resp.status)

# Отключить проверку SSL-сертификата (не для production!)
connector = aiohttp.TCPConnector(ssl=False)

# Использовать свой SSL-контекст
ssl_ctx = ssl.create_default_context()
ssl_ctx.load_verify_locations('ca-bundle.crt')
connector = aiohttp.TCPConnector(ssl=ssl_ctx)

async with aiohttp.ClientSession(connector=connector) as session:
    async with session.get('https://secure.example.com') as resp:
        data = await resp.text()`,
  },
  {
    name: "aiohttp.UnixConnector",
    description:
      "Коннектор для подключения к серверу через Unix domain socket вместо TCP. Применяется для взаимодействия с локальными сервисами (Docker, systemd, gunicorn), которые слушают на Unix-сокетах. Не поддерживает SSL.",
    syntax: "aiohttp.UnixConnector(path, force_close=False, limit=100)",
    arguments: [
      {
        name: "path",
        description:
          'Путь к Unix-сокету на файловой системе, например "/var/run/docker.sock".',
      },
      {
        name: "force_close",
        description:
          "Если True — соединение закрывается после каждого запроса, без возврата в пул. По умолчанию False.",
      },
      {
        name: "limit",
        description:
          "Максимальное количество одновременных соединений. По умолчанию 100.",
      },
    ],
    example: `import aiohttp

# Подключение к Docker API через Unix-сокет
connector = aiohttp.UnixConnector(path='/var/run/docker.sock')

async with aiohttp.ClientSession(connector=connector) as session:
    # Запрос к Docker API (используем http://localhost как фиктивный хост)
    async with session.get('http://localhost/v1.41/containers/json') as resp:
        containers = await resp.json()
        for c in containers:
            print(c['Names'], c['Status'])

# Подключение к локальному gunicorn-серверу
connector = aiohttp.UnixConnector(path='/tmp/gunicorn.sock')
async with aiohttp.ClientSession(connector=connector) as session:
    async with session.post('http://localhost/api/data', json={'key': 'val'}) as resp:
        result = await resp.json()`,
  },
  {
    name: "aiohttp.CookieJar",
    description:
      "Класс для хранения и управления HTTP-cookies в рамках ClientSession. По умолчанию фильтрует небезопасные cookies (с IP-адресами вместо доменов). Поддерживает сохранение и загрузку cookies между сессиями.",
    syntax:
      "aiohttp.CookieJar(unsafe=False, quote_cookie=True, treat_as_secure_origin=[])",
    arguments: [
      {
        name: "unsafe",
        description:
          "Если True — разрешает принимать cookies от серверов с IP-адресами (нестандартное поведение). По умолчанию False.",
      },
      {
        name: "quote_cookie",
        description:
          "Если True — значения cookies будут экранироваться (URL-encode). По умолчанию True.",
      },
      {
        name: "treat_as_secure_origin",
        description:
          "Список URL-источников, которые следует считать безопасными (для Secure-cookies при HTTP-соединении).",
      },
    ],
    example: `import aiohttp

# Стандартная jar (только безопасные домены)
jar = aiohttp.CookieJar()

async with aiohttp.ClientSession(cookie_jar=jar) as session:
    await session.get('https://example.com/login')
    # Cookies автоматически сохранены в jar

    await session.get('https://example.com/profile')
    # Cookies автоматически отправлены

# Разрешить cookies от IP-адресов (для тестирования)
jar = aiohttp.CookieJar(unsafe=True)

async with aiohttp.ClientSession(cookie_jar=jar) as session:
    await session.get('http://127.0.0.1:8080/')

# Сохранить и загрузить cookies
jar.save('cookies.pkl')
jar.load('cookies.pkl')`,
  },
  {
    name: "aiohttp.FormData",
    description:
      "Класс для формирования тела запроса в формате multipart/form-data или application/x-www-form-urlencoded. Позволяет добавлять текстовые поля и файлы, после чего передаётся в параметр data при отправке запроса.",
    syntax: "aiohttp.FormData(fields=(), quote_fields=True, charset=None)",
    arguments: [
      {
        name: "fields",
        description:
          "Начальные поля формы: список кортежей (name, value) или словарь. Можно добавлять поля позже через метод add_field().",
      },
      {
        name: "quote_fields",
        description:
          "Если True — имена полей будут URL-экранированы. По умолчанию True.",
      },
      {
        name: "charset",
        description:
          "Кодировка для текстовых полей. По умолчанию None (используется UTF-8).",
      },
    ],
    example: `import aiohttp

async def upload():
    data = aiohttp.FormData()

    # Текстовое поле
    data.add_field('username', 'alice')
    data.add_field('description', 'Тестовая загрузка')

    # Загрузка файла с заголовками
    with open('photo.jpg', 'rb') as f:
        data.add_field(
            'avatar',
            f,
            filename='photo.jpg',
            content_type='image/jpeg'
        )

    async with aiohttp.ClientSession() as session:
        async with session.post('https://example.com/upload', data=data) as resp:
            print(resp.status)
            result = await resp.json()
            print(result)`,
  },
  {
    name: "aiohttp.ClientTimeout",
    description:
      "Класс для задания таймаутов клиентских запросов в aiohttp. Позволяет раздельно настраивать общий таймаут, таймаут соединения и таймаут чтения данных от сервера. Передаётся в ClientSession или в отдельный запрос.",
    syntax:
      "aiohttp.ClientTimeout(total=None, connect=None, sock_connect=None, sock_read=None)",
    arguments: [
      {
        name: "total",
        description:
          "Максимальное время в секундах на весь запрос (от начала до получения полного ответа). None — без ограничений.",
      },
      {
        name: "connect",
        description:
          "Максимальное время в секундах на установку соединения (включая DNS-разрешение). None — без ограничений.",
      },
      {
        name: "sock_connect",
        description:
          "Максимальное время в секундах на установку TCP-соединения с сокетом (без DNS). None — без ограничений.",
      },
      {
        name: "sock_read",
        description:
          "Максимальное время в секундах ожидания данных от сервера после установки соединения. None — без ограничений.",
      },
    ],
    example: `import aiohttp

# Таймаут для всей сессии
timeout = aiohttp.ClientTimeout(total=30, connect=5, sock_read=20)

async with aiohttp.ClientSession(timeout=timeout) as session:
    try:
        async with session.get('https://example.com/data') as resp:
            data = await resp.json()
    except aiohttp.ServerTimeoutError:
        print('Сервер не ответил вовремя')
    except aiohttp.ClientConnectorError:
        print('Не удалось подключиться')

# Таймаут для конкретного запроса (переопределяет таймаут сессии)
short = aiohttp.ClientTimeout(total=5)
async with aiohttp.ClientSession() as session:
    async with session.get('https://slow.example.com', timeout=short) as resp:
        print(resp.status)`,
  },
  {
    name: "aiohttp.MultipartReader.at_eof()",
    description:
      "Метод, проверяющий, достигнут ли конец multipart-потока. Возвращает True, если все части были прочитаны, и False, если ещё остались непрочитанные части. Используется в цикле чтения как условие остановки.",
    syntax: "reader.at_eof()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    reader = await request.multipart()
    parts = []

    # Ручной цикл вместо async for
    while not reader.at_eof():
        part = await reader.next()
        if part is None:
            break
        content = await part.read()
        parts.append({
            'name': part.name,
            'size': len(content)
        })

    return web.json_response({'parts': parts})

app = web.Application()
app.router.add_post('/upload', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.MultipartReader.next()",
    description:
      "Корутина, возвращающая следующую часть multipart-запроса в виде объекта BodyPartReader. Если все части прочитаны — возвращает None. Каждую часть нужно прочитать полностью перед вызовом next(), иначе её данные будут пропущены.",
    syntax: "await reader.next()",
    arguments: [],
    example: `from aiohttp import web

async def handler(request: web.Request) -> web.Response:
    reader = await request.multipart()
    result = {}

    while True:
        part = await reader.next()
        if part is None:
            break  # Все части прочитаны

        if part.filename:
            # Это файл
            data = await part.read()
            result[part.name] = f'file:{part.filename} ({len(data)} bytes)'
        else:
            # Это текстовое поле
            text = await part.text()
            result[part.name] = text

    return web.json_response(result)

app = web.Application()
app.router.add_post('/form', handler)
web.run_app(app)`,
  },
  {
    name: "aiohttp.MultipartWriter.append()",
    description:
      "Метод, добавляющий произвольные данные как новую часть multipart-сообщения. Принимает строку, bytes или объект с интерфейсом чтения. Возвращает объект Payload, которому можно задать дополнительные заголовки.",
    syntax: "writer.append(obj, headers=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Данные для добавления: строка str, байты bytes, объект IOBase или другой поддерживаемый тип.",
      },
      {
        name: "headers",
        description:
          "Дополнительные заголовки для этой части в виде словаря или CIMultiDict. Например, Content-Disposition, Content-Type.",
      },
    ],
    example: `import aiohttp

async def send_multipart():
    with aiohttp.MultipartWriter('mixed') as writer:
        # Добавить текст
        writer.append('Привет, мир!')

        # Добавить bytes с заголовком
        writer.append(
            b'\\x89PNG binary data',
            headers={'Content-Type': 'image/png'}
        )

        # Добавить файл
        with open('report.pdf', 'rb') as f:
            writer.append(f, headers={
                'Content-Disposition': 'attachment; filename="report.pdf"'
            })

        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://example.com/upload',
                data=writer
            ) as resp:
                print(resp.status)`,
  },
  {
    name: "aiohttp.MultipartWriter.append_json()",
    description:
      "Метод, сериализующий объект Python в JSON и добавляющий его как часть multipart-сообщения с заголовком Content-Type: application/json. Удобная обёртка над append() для передачи структурированных данных вместе с файлами.",
    syntax: "writer.append_json(obj, headers=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Объект Python, сериализуемый в JSON: словарь, список, строка, число и т.д.",
      },
      {
        name: "headers",
        description:
          "Дополнительные заголовки для данной части. Content-Type: application/json устанавливается автоматически.",
      },
    ],
    example: `import aiohttp

async def send_with_metadata():
    with aiohttp.MultipartWriter('form-data') as writer:
        # Метаданные в JSON
        writer.append_json({
            'user_id': 42,
            'tags': ['photo', 'avatar'],
            'description': 'Фото профиля'
        })

        # Файл изображения
        with open('avatar.png', 'rb') as f:
            writer.append(f, headers={
                'Content-Disposition': 'form-data; name="file"; filename="avatar.png"',
                'Content-Type': 'image/png'
            })

        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://api.example.com/photos',
                data=writer
            ) as resp:
                print(await resp.json())`,
  },
  {
    name: "aiohttp.MultipartWriter.append_form()",
    description:
      "Метод, добавляющий данные формы (список кортежей или словарь) как часть multipart-сообщения с заголовком Content-Type: application/x-www-form-urlencoded. Используется для вложения закодированных полей формы внутрь multipart-запроса.",
    syntax: "writer.append_form(obj, headers=None)",
    arguments: [
      {
        name: "obj",
        description:
          "Данные формы: словарь {key: value} или список кортежей [(key, value), ...]. Будут закодированы как application/x-www-form-urlencoded.",
      },
      {
        name: "headers",
        description:
          "Дополнительные заголовки для данной части. Content-Type: application/x-www-form-urlencoded устанавливается автоматически.",
      },
    ],
    example: `import aiohttp

async def send_mixed_multipart():
    with aiohttp.MultipartWriter('mixed') as writer:
        # Поля формы как отдельная часть
        writer.append_form({
            'action': 'upload',
            'folder': 'documents',
            'overwrite': 'true'
        })

        # Или как список кортежей (сохраняет порядок)
        writer.append_form([
            ('category', 'reports'),
            ('year', '2024'),
            ('year', '2025'),  # Дублирующийся ключ
        ])

        # Бинарный файл
        with open('doc.pdf', 'rb') as f:
            writer.append(f, headers={'Content-Type': 'application/pdf'})

        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://example.com/api/upload',
                data=writer
            ) as resp:
                print(resp.status)`,
  },
  {
    name: "aiohttp.web.get()",
    description:
      "Декоратор и функция из web.RouteTableDef для регистрации обработчика GET-запросов по указанному пути. Используется совместно с RouteTableDef для декларативного описания маршрутов вне класса Application.",
    syntax: "web.get(path, handler, **kwargs)",
    arguments: [
      {
        name: "path",
        description:
          'URL-шаблон маршрута. Поддерживает динамические сегменты в фигурных скобках: "/users/{id}".',
      },
      {
        name: "handler",
        description:
          "Асинхронная функция-обработчик, принимающая объект web.Request и возвращающая web.Response.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры маршрута, например name (имя маршрута для url_for) или expect_handler.",
      },
    ],
    example: `from aiohttp import web

routes = web.RouteTableDef()

@routes.get('/')
async def index(request: web.Request) -> web.Response:
    return web.Response(text='Главная страница')

@routes.get('/users/{user_id}')
async def get_user(request: web.Request) -> web.Response:
    user_id = request.match_info['user_id']
    return web.json_response({'id': user_id, 'name': 'Алиса'})

app = web.Application()
app.add_routes(routes)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.post()",
    description:
      "Декоратор и функция из web.RouteTableDef для регистрации обработчика POST-запросов по указанному пути. Применяется для создания ресурсов, отправки форм и обработки JSON-данных от клиента.",
    syntax: "web.post(path, handler, **kwargs)",
    arguments: [
      {
        name: "path",
        description:
          'URL-шаблон маршрута. Поддерживает динамические сегменты: "/articles/{slug}".',
      },
      {
        name: "handler",
        description:
          "Асинхронная функция-обработчик, принимающая web.Request и возвращающая web.Response.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры, например name для именования маршрута.",
      },
    ],
    example: `from aiohttp import web

routes = web.RouteTableDef()

@routes.post('/users')
async def create_user(request: web.Request) -> web.Response:
    data = await request.json()
    name = data.get('name', '').strip()

    if not name:
        raise web.HTTPBadRequest(text='Поле name обязательно')

    # Имитация создания пользователя
    new_user = {'id': 101, 'name': name}
    return web.json_response(new_user, status=201)

app = web.Application()
app.add_routes(routes)
web.run_app(app)

# curl -X POST http://localhost:8080/users \\
#      -H "Content-Type: application/json" \\
#      -d '{"name": "Боб"}'`,
  },
  {
    name: "aiohttp.web.route()",
    description:
      "Универсальный декоратор и функция из web.RouteTableDef для регистрации обработчика с произвольным HTTP-методом. Используется когда нужно обработать нестандартный метод (PATCH, DELETE, HEAD, OPTIONS и т.д.) или передать метод динамически.",
    syntax: "web.route(method, path, handler, **kwargs)",
    arguments: [
      {
        name: "method",
        description:
          'HTTP-метод в виде строки в верхнем регистре: "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE" или "*" для любого метода.',
      },
      {
        name: "path",
        description:
          "URL-шаблон маршрута. Поддерживает динамические сегменты в фигурных скобках.",
      },
      {
        name: "handler",
        description:
          "Асинхронная функция-обработчик, принимающая web.Request и возвращающая web.Response.",
      },
      {
        name: "**kwargs",
        description: "Дополнительные параметры маршрута, например name.",
      },
    ],
    example: `from aiohttp import web

routes = web.RouteTableDef()

@routes.route('PATCH', '/users/{id}')
async def patch_user(request: web.Request) -> web.Response:
    user_id = request.match_info['id']
    data = await request.json()
    return web.json_response({'id': user_id, 'updated': data})

@routes.route('DELETE', '/users/{id}')
async def delete_user(request: web.Request) -> web.Response:
    user_id = request.match_info['id']
    return web.json_response({'deleted': user_id})

# Маршрут для любого HTTP-метода
@routes.route('*', '/debug')
async def debug(request: web.Request) -> web.Response:
    return web.Response(text=f'Метод: {request.method}')

app = web.Application()
app.add_routes(routes)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.view()",
    description:
      "Декоратор и функция из web.RouteTableDef для привязки URL-пути к классу-обработчику, унаследованному от web.View. Позволяет организовать обработку разных HTTP-методов одного маршрута в виде методов одного класса (get, post, put и т.д.).",
    syntax: "web.view(path, handler, **kwargs)",
    arguments: [
      {
        name: "path",
        description:
          "URL-шаблон маршрута, который будет обслуживаться классом-обработчиком.",
      },
      {
        name: "handler",
        description:
          "Класс, унаследованный от web.View. Методы класса get(), post(), put() и т.д. обрабатывают соответствующие HTTP-методы.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры маршрута, например name для именования.",
      },
    ],
    example: `from aiohttp import web

class UserView(web.View):
    async def get(self) -> web.Response:
        user_id = self.request.match_info['id']
        return web.json_response({'id': user_id, 'name': 'Алиса'})

    async def put(self) -> web.Response:
        user_id = self.request.match_info['id']
        data = await self.request.json()
        return web.json_response({'id': user_id, 'updated': data})

    async def delete(self) -> web.Response:
        user_id = self.request.match_info['id']
        return web.json_response({'deleted': user_id})

routes = web.RouteTableDef()
routes.view('/users/{id}', UserView)

app = web.Application()
app.add_routes(routes)
web.run_app(app)`,
  },
  {
    name: "aiohttp.web.static()",
    description:
      "Функция для регистрации маршрута раздачи статических файлов (HTML, CSS, JS, изображения и т.д.) из указанной директории. Все файлы внутри директории становятся доступны по URL с заданным префиксом. Поддерживает кэширование, сжатие и заголовок If-Modified-Since.",
    syntax: "web.static(prefix, path, **kwargs)",
    arguments: [
      {
        name: "prefix",
        description:
          'URL-префикс, по которому будут доступны статические файлы. Например, "/static" сделает файл style.css доступным по адресу /static/style.css.',
      },
      {
        name: "path",
        description:
          "Путь к директории на файловой системе, из которой будут раздаваться файлы. Может быть строкой или объектом pathlib.Path.",
      },
      {
        name: "**kwargs",
        description:
          "Дополнительные параметры: show_index (bool) — показывать листинг директории; follow_symlinks (bool) — следовать символическим ссылкам; append_version (bool) — добавлять хэш версии к URL.",
      },
    ],
    example: `from aiohttp import web
from pathlib import Path

BASE_DIR = Path(__file__).parent

async def index(request: web.Request) -> web.Response:
    return web.FileResponse(BASE_DIR / 'public' / 'index.html')

app = web.Application()

# Раздаём файлы из папки 'public' по префиксу '/static'
app.router.add_static('/static', BASE_DIR / 'public' / 'static')

# Или через RouteTableDef:
routes = web.RouteTableDef()
routes.static('/assets', BASE_DIR / 'assets')

app.router.add_get('/', index)
app.add_routes(routes)

# GET /static/css/style.css -> файл public/static/css/style.css
# GET /static/js/app.js     -> файл public/static/js/app.js

web.run_app(app)`,
  },
  {
    name: "asyncio.run()",
    description:
      "Запускает корутину верхнего уровня, создаёт новый event loop, выполняет корутину до завершения и закрывает loop. Является главной точкой входа в асинхронную программу. Нельзя вызывать внутри уже работающего event loop.",
    syntax: "asyncio.run(coro, *, debug=None, loop_factory=None)",
    arguments: [
      {
        name: "coro",
        description:
          "Корутина — объект, возвращаемый async-функцией. Будет выполнена как точка входа в программу.",
      },
      {
        name: "debug",
        description:
          "Если True — включает режим отладки event loop (подробные предупреждения). None — использует переменную окружения PYTHONASYNCIODEBUG.",
      },
      {
        name: "loop_factory",
        description:
          "Необязательный callable для создания event loop. По умолчанию None — используется asyncio.DefaultEventLoopPolicy.",
      },
    ],
    example: `import asyncio

async def fetch_data(name: str) -> str:
    print(f'Начало: {name}')
    await asyncio.sleep(1)
    return f'Данные от {name}'

async def main():
    result = await fetch_data('сервер')
    print(result)

# Запуск программы
asyncio.run(main())

# С режимом отладки
asyncio.run(main(), debug=True)`,
  },
  {
    name: "asyncio.create_task()",
    description:
      "Оборачивает корутину в объект Task и планирует её выполнение в текущем event loop. Task запускается конкурентно с другими задачами. Возвращает объект asyncio.Task, который можно отменить или ожидать.",
    syntax: "asyncio.create_task(coro, *, name=None, context=None)",
    arguments: [
      {
        name: "coro",
        description:
          "Корутина, которую нужно обернуть в Task и запустить конкурентно.",
      },
      {
        name: "name",
        description:
          "Строковое имя задачи. Отображается в отладочной информации и repr(task). По умолчанию None.",
      },
      {
        name: "context",
        description:
          "Контекст contextvars.Context для выполнения задачи. По умолчанию None — копирует текущий контекст.",
      },
    ],
    example: `import asyncio

async def worker(n: int) -> int:
    await asyncio.sleep(n)
    print(f'Задача {n} завершена')
    return n * 2

async def main():
    # Создаём задачи — они запускаются немедленно
    task1 = asyncio.create_task(worker(1), name='task-1')
    task2 = asyncio.create_task(worker(2), name='task-2')

    print(f'Имя: {task1.get_name()}')  # task-1

    # Ожидаем оба результата
    result1 = await task1
    result2 = await task2
    print(result1, result2)  # 2 4

asyncio.run(main())`,
  },
  {
    name: "asyncio.gather()",
    description:
      "Запускает несколько корутин или задач конкурентно и ожидает завершения всех. Возвращает список результатов в том же порядке, что и входные awaitable-объекты. Если один из них вызывает исключение — оно распространяется, если только return_exceptions=True.",
    syntax: "asyncio.gather(*aws, return_exceptions=False)",
    arguments: [
      {
        name: "*aws",
        description:
          "Произвольное количество корутин, Task или Future. Каждая корутина автоматически оборачивается в Task.",
      },
      {
        name: "return_exceptions",
        description:
          "Если False (по умолчанию) — первое исключение немедленно передаётся ожидающей корутине. Если True — исключения возвращаются как результаты в списке, не прерывая остальные задачи.",
      },
    ],
    example: `import asyncio

async def fetch(url: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f'Ответ от {url}'

async def main():
    # Все три запроса выполняются конкурентно
    results = await asyncio.gather(
        fetch('api.example.com', 1),
        fetch('cdn.example.com', 0.5),
        fetch('db.example.com', 2),
    )
    print(results)
    # ['Ответ от api.example.com', 'Ответ от cdn.example.com', 'Ответ от db.example.com']

    # С обработкой ошибок
    async def fail(): raise ValueError('ошибка')
    results = await asyncio.gather(fetch('ok.com', 0.1), fail(), return_exceptions=True)
    print(results)  # ['Ответ от ok.com', ValueError('ошибка')]

asyncio.run(main())`,
  },
  {
    name: "asyncio.sleep()",
    description:
      "Приостанавливает выполнение текущей корутины на заданное количество секунд, передавая управление event loop. Позволяет другим задачам выполняться в это время. При delay=0 уступает управление без реальной задержки.",
    syntax: "await asyncio.sleep(delay, result=None)",
    arguments: [
      {
        name: "delay",
        description:
          "Время ожидания в секундах. Может быть дробным числом. При значении 0 — однократная передача управления event loop.",
      },
      {
        name: "result",
        description:
          "Значение, которое вернёт sleep() после ожидания. По умолчанию None.",
      },
    ],
    example: `import asyncio

async def task(name: str, delay: float):
    print(f'{name}: начало')
    value = await asyncio.sleep(delay, result=f'{name} готово')
    print(value)
    return value

async def main():
    # Конкурентное выполнение с разными задержками
    results = await asyncio.gather(
        task('A', 1.0),
        task('B', 0.5),
        task('C', 1.5),
    )
    print(results)
    # B завершится первым, затем A, затем C

asyncio.run(main())`,
  },
  {
    name: "asyncio.wait()",
    description:
      "Ожидает завершения набора задач или future с возможностью задать таймаут и условие остановки. В отличие от gather(), возвращает два множества: done (завершённые) и pending (ещё выполняющиеся задачи). Не отменяет pending-задачи автоматически.",
    syntax:
      "await asyncio.wait(aws, *, timeout=None, return_when=asyncio.ALL_COMPLETED)",
    arguments: [
      {
        name: "aws",
        description:
          "Множество или список корутин, Task или Future для ожидания.",
      },
      {
        name: "timeout",
        description:
          "Таймаут в секундах. По истечении возвращает управление, не отменяя pending-задачи. None — ждать до завершения условия return_when.",
      },
      {
        name: "return_when",
        description:
          "Условие возврата: ALL_COMPLETED (все завершены), FIRST_COMPLETED (первая завершилась), FIRST_EXCEPTION (первое исключение).",
      },
    ],
    example: `import asyncio

async def job(n: int) -> int:
    await asyncio.sleep(n)
    return n

async def main():
    tasks = {asyncio.create_task(job(i)) for i in [1, 2, 3]}

    # Ждём первую завершившуюся задачу
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

    print(f'Готово: {len(done)}, ожидают: {len(pending)}')
    for t in done:
        print('Результат:', t.result())

    # Отменяем оставшиеся
    for t in pending:
        t.cancel()

asyncio.run(main())`,
  },
  {
    name: "asyncio.wait_for()",
    description:
      "Ожидает завершения корутины или задачи с жёстким таймаутом. Если таймаут истёк — автоматически отменяет задачу и выбрасывает asyncio.TimeoutError. Подходит когда нужно гарантировать максимальное время выполнения операции.",
    syntax: "await asyncio.wait_for(aw, timeout)",
    arguments: [
      {
        name: "aw",
        description:
          "Корутина или Task, которую нужно выполнить с ограничением по времени.",
      },
      {
        name: "timeout",
        description:
          "Максимальное время ожидания в секундах. Если None — ждёт без ограничений (эквивалентно простому await).",
      },
    ],
    example: `import asyncio

async def slow_operation() -> str:
    await asyncio.sleep(10)
    return 'готово'

async def main():
    # Вариант 1: поймать TimeoutError
    try:
        result = await asyncio.wait_for(slow_operation(), timeout=2.0)
        print(result)
    except asyncio.TimeoutError:
        print('Операция превысила таймаут 2 секунды')

    # Вариант 2: без таймаута
    result = await asyncio.wait_for(slow_operation(), timeout=None)

asyncio.run(main())`,
  },
  {
    name: "asyncio.as_completed()",
    description:
      "Возвращает итератор корутин, каждая из которых завершается по мере готовности соответствующей задачи из входного списка. Позволяет обрабатывать результаты сразу по мере их появления, не дожидаясь завершения всех задач.",
    syntax: "asyncio.as_completed(aws, *, timeout=None)",
    arguments: [
      {
        name: "aws",
        description: "Список или множество корутин, Task или Future.",
      },
      {
        name: "timeout",
        description:
          "Общий таймаут в секундах для всего набора задач. При истечении выбрасывает asyncio.TimeoutError.",
      },
    ],
    example: `import asyncio

async def fetch(url: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f'Данные от {url}'

async def main():
    aws = [
        fetch('fast.com', 0.5),
        fetch('slow.com', 2.0),
        fetch('medium.com', 1.0),
    ]

    # Обрабатываем результаты по мере готовности
    for coro in asyncio.as_completed(aws):
        result = await coro
        print(f'Получено: {result}')
    # Порядок вывода: fast.com -> medium.com -> slow.com

asyncio.run(main())`,
  },
  {
    name: "asyncio.to_thread()",
    description:
      "Запускает синхронную (блокирующую) функцию в отдельном потоке из пула потоков, не блокируя event loop. Используется для выполнения CPU-bound или I/O-bound синхронного кода совместно с асинхронным.",
    syntax: "await asyncio.to_thread(func, /, *args, **kwargs)",
    arguments: [
      {
        name: "func",
        description:
          "Синхронная функция (callable), которую нужно выполнить в отдельном потоке.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы, передаваемые в func.",
      },
      {
        name: "**kwargs",
        description: "Именованные аргументы, передаваемые в func.",
      },
    ],
    example: `import asyncio
import time
import requests  # синхронная библиотека

def blocking_request(url: str) -> str:
    response = requests.get(url)
    return response.text

def cpu_heavy(n: int) -> int:
    time.sleep(2)  # имитация тяжёлых вычислений
    return n ** 2

async def main():
    # Выполняем блокирующий запрос без блокировки event loop
    html = await asyncio.to_thread(blocking_request, 'https://example.com')
    print(html[:100])

    # CPU-задача в потоке
    result = await asyncio.to_thread(cpu_heavy, 42)
    print(result)  # 1764

asyncio.run(main())`,
  },
  {
    name: "asyncio.run_coroutine_threadsafe()",
    description:
      "Потокобезопасный способ запустить корутину из обычного (не async) потока в уже работающем event loop. Возвращает объект concurrent.futures.Future. Используется когда event loop работает в одном потоке, а вызов происходит из другого.",
    syntax: "asyncio.run_coroutine_threadsafe(coro, loop)",
    arguments: [
      {
        name: "coro",
        description:
          "Корутина, которую нужно запланировать на выполнение в event loop.",
      },
      {
        name: "loop",
        description:
          "Работающий event loop, в котором будет выполнена корутина. Получается через asyncio.get_event_loop() или хранится как ссылка.",
      },
    ],
    example: `import asyncio
import threading

async def async_task(value: int) -> int:
    await asyncio.sleep(1)
    return value * 2

def run_loop(loop: asyncio.AbstractEventLoop):
    loop.run_forever()

loop = asyncio.new_event_loop()
t = threading.Thread(target=run_loop, args=(loop,), daemon=True)
t.start()

# Из обычного потока отправляем задачу в async loop
future = asyncio.run_coroutine_threadsafe(async_task(21), loop)

# Блокирующее ожидание результата
result = future.result(timeout=5)
print(result)  # 42

loop.call_soon_threadsafe(loop.stop)`,
  },
  {
    name: "asyncio.current_task()",
    description:
      "Возвращает объект Task, который выполняется в данный момент в текущем event loop. Если вызов происходит вне контекста выполнения задачи — возвращает None. Полезно для получения метаданных о текущей задаче (имя, контекст).",
    syntax: "asyncio.current_task(loop=None)",
    arguments: [
      {
        name: "loop",
        description:
          "Устаревший параметр (deprecated с Python 3.10). Ранее позволял указать конкретный event loop. Не рекомендуется использовать.",
      },
    ],
    example: `import asyncio

async def worker():
    task = asyncio.current_task()
    print(f'Текущая задача: {task.get_name()}')
    print(f'Это task: {isinstance(task, asyncio.Task)}')
    await asyncio.sleep(0.1)
    return task.get_name()

async def main():
    t1 = asyncio.create_task(worker(), name='worker-1')
    t2 = asyncio.create_task(worker(), name='worker-2')
    results = await asyncio.gather(t1, t2)
    print(results)  # ['worker-1', 'worker-2']

    # Вне задачи — current_task() возвращает Task main
    print(asyncio.current_task().get_name())  # Task-1

asyncio.run(main())`,
  },
  {
    name: "asyncio.all_tasks()",
    description:
      "Возвращает множество всех активных (незавершённых) объектов Task в текущем event loop. Включает задачи, которые ожидают выполнения, выполняются или были отменены, но ещё не завершились. Полезно для мониторинга и graceful shutdown.",
    syntax: "asyncio.all_tasks(loop=None)",
    arguments: [
      {
        name: "loop",
        description:
          "Устаревший параметр (deprecated с Python 3.10). Раньше позволял указать event loop. Не рекомендуется использовать.",
      },
    ],
    example: `import asyncio

async def long_task(name: str, delay: float):
    await asyncio.sleep(delay)
    return name

async def main():
    tasks = [
        asyncio.create_task(long_task('A', 1), name='task-A'),
        asyncio.create_task(long_task('B', 2), name='task-B'),
        asyncio.create_task(long_task('C', 3), name='task-C'),
    ]

    await asyncio.sleep(0.1)  # даём задачам запуститься

    all_running = asyncio.all_tasks()
    print(f'Активных задач: {len(all_running)}')
    for t in all_running:
        print(f'  - {t.get_name()}')

    # Graceful shutdown: отменить все
    for t in asyncio.all_tasks():
        t.cancel()

asyncio.run(main())`,
  },
  {
    name: "asyncio.shield()",
    description:
      "Защищает корутину или задачу от внешней отмены. Если ожидающая задача будет отменена — внутренняя (защищённая) задача продолжит выполняться. Полезно для критических операций (запись в БД, финансовые транзакции), которые нельзя прерывать.",
    syntax: "await asyncio.shield(aw)",
    arguments: [
      {
        name: "aw",
        description:
          "Корутина, Task или Future, которую нужно защитить от отмены.",
      },
    ],
    example: `import asyncio

async def critical_write(data: str) -> str:
    print('Начало записи...')
    await asyncio.sleep(2)  # имитация долгой записи
    print('Запись завершена!')
    return f'Сохранено: {data}'

async def main():
    task = asyncio.create_task(critical_write('важные данные'))

    try:
        # shield защищает critical_write от отмены
        result = await asyncio.wait_for(asyncio.shield(task), timeout=1.0)
    except asyncio.TimeoutError:
        print('Таймаут wait_for, но задача продолжает работать')

    # Ждём завершения защищённой задачи
    result = await task
    print(result)

asyncio.run(main())`,
  },
  {
    name: "asyncio.timeout()",
    description:
      "Контекстный менеджер для задания таймаута на блок кода (Python 3.11+). При превышении времени ожидания выбрасывает asyncio.TimeoutError. В отличие от wait_for() позволяет ограничивать по времени произвольные блоки кода, содержащие несколько await.",
    syntax: "async with asyncio.timeout(delay)",
    arguments: [
      {
        name: "delay",
        description:
          "Таймаут в секундах от текущего момента. None — без таймаута. Может быть изменён внутри блока через метод reschedule().",
      },
    ],
    example: `import asyncio

async def step(name: str, delay: float):
    await asyncio.sleep(delay)
    print(f'{name} выполнен')

async def main():
    try:
        async with asyncio.timeout(3.0):
            await step('Шаг 1', 1.0)
            await step('Шаг 2', 1.0)
            await step('Шаг 3', 1.5)  # суммарно > 3с -> TimeoutError
    except asyncio.TimeoutError:
        print('Блок превысил 3 секунды')

    # Изменение таймаута изнутри блока
    async with asyncio.timeout(5.0) as cm:
        await asyncio.sleep(1)
        cm.reschedule(asyncio.get_event_loop().time() + 10)
        await asyncio.sleep(2)
        print('Успешно завершено')

asyncio.run(main())`,
  },
  {
    name: "asyncio.timeout_at()",
    description:
      "Контекстный менеджер для задания таймаута в виде абсолютного момента времени (Python 3.11+). Принимает момент в единицах event loop (asyncio.get_event_loop().time()). Удобен когда таймаут нужно вычислить заранее или разделить между несколькими блоками.",
    syntax: "async with asyncio.timeout_at(when)",
    arguments: [
      {
        name: "when",
        description:
          "Абсолютный момент дедлайна в секундах (float), полученный из loop.time(). None — без таймаута.",
      },
    ],
    example: `import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f'Данные: {name}'

async def main():
    loop = asyncio.get_event_loop()

    # Дедлайн — 5 секунд от текущего момента
    deadline = loop.time() + 5.0

    try:
        async with asyncio.timeout_at(deadline):
            r1 = await fetch('источник-1', 1.5)
            print(r1)
            r2 = await fetch('источник-2', 2.0)
            print(r2)
            r3 = await fetch('источник-3', 2.0)  # суммарно > 5с
            print(r3)
    except asyncio.TimeoutError:
        remaining = deadline - loop.time()
        print(f'Дедлайн истёк. Осталось: {remaining:.2f}с (отрицательно)')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.cancel()",
    description:
      "Запрашивает отмену задачи. В ближайшей точке await внутри задачи будет выброшено исключение asyncio.CancelledError. Задача может перехватить его и выполнить очистку ресурсов, но должна либо повторно выбросить его, либо завершиться. Возвращает True если отмена запрошена успешно, False если задача уже завершена.",
    syntax: "task.cancel(msg=None)",
    arguments: [
      {
        name: "msg",
        description:
          "Необязательное сообщение, которое будет передано в CancelledError. Доступно через exception.args[0]. По умолчанию None.",
      },
    ],
    example: `import asyncio

async def long_task():
    try:
        print('Начало работы')
        await asyncio.sleep(10)
        print('Эта строка не будет напечатана')
    except asyncio.CancelledError:
        print('Задача отменена, выполняем очистку...')
        raise  # обязательно перебросить

async def main():
    task = asyncio.create_task(long_task())
    await asyncio.sleep(1)

    cancelled = task.cancel(msg='Больше не нужно')
    print(f'Отмена запрошена: {cancelled}')  # True

    try:
        await task
    except asyncio.CancelledError:
        print('Задача успешно отменена')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.cancelled()",
    description:
      "Возвращает True, если задача была отменена (метод cancel() был вызван и задача завершилась с CancelledError). Возвращает False в любом другом случае — задача ещё выполняется, завершилась успешно или с другим исключением.",
    syntax: "task.cancelled()",
    arguments: [],
    example: `import asyncio

async def cancellable():
    await asyncio.sleep(5)

async def main():
    task = asyncio.create_task(cancellable())
    await asyncio.sleep(0.1)

    print(task.cancelled())  # False — ещё выполняется

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

    print(task.cancelled())  # True — была отменена
    print(task.done())       # True — завершена (в том числе отменой)

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.done()",
    description:
      "Возвращает True, если задача завершена — успешно, с исключением или отменой. Возвращает False, если задача ещё ожидает выполнения или выполняется. Используется для проверки статуса без блокирующего ожидания.",
    syntax: "task.done()",
    arguments: [],
    example: `import asyncio

async def quick():
    await asyncio.sleep(0.1)
    return 42

async def main():
    task = asyncio.create_task(quick())

    print(task.done())  # False — ещё не завершена

    await asyncio.sleep(0.2)

    print(task.done())    # True — завершена
    print(task.result())  # 42

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.result()",
    description:
      "Возвращает результат выполнения задачи. Если задача ещё не завершена — выбрасывает asyncio.InvalidStateError. Если задача завершилась с исключением — повторно выбрасывает это исключение. Если задача отменена — выбрасывает asyncio.CancelledError.",
    syntax: "task.result()",
    arguments: [],
    example: `import asyncio

async def compute(x: int) -> int:
    await asyncio.sleep(0.1)
    if x < 0:
        raise ValueError('Отрицательное число')
    return x ** 2

async def main():
    # Успешный результат
    task = asyncio.create_task(compute(5))
    await task
    print(task.result())  # 25

    # Задача с исключением
    task2 = asyncio.create_task(compute(-1))
    try:
        await task2
    except ValueError:
        pass
    try:
        task2.result()  # повторно выбросит ValueError
    except ValueError as e:
        print(f'Ошибка: {e}')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.exception()",
    description:
      "Возвращает исключение, с которым завершилась задача, или None если задача завершилась успешно. Если задача ещё не завершена — выбрасывает asyncio.InvalidStateError. Если задача отменена — выбрасывает asyncio.CancelledError.",
    syntax: "task.exception()",
    arguments: [],
    example: `import asyncio

async def risky(fail: bool):
    await asyncio.sleep(0.1)
    if fail:
        raise RuntimeError('Что-то пошло не так')
    return 'всё хорошо'

async def main():
    task_ok = asyncio.create_task(risky(False))
    task_err = asyncio.create_task(risky(True))

    await asyncio.gather(task_ok, task_err, return_exceptions=True)

    print(task_ok.exception())   # None — завершилась успешно
    exc = task_err.exception()
    print(type(exc).__name__)    # RuntimeError
    print(str(exc))              # Что-то пошло не так

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.add_done_callback()",
    description:
      "Регистрирует функцию обратного вызова (callback), которая будет вызвана при завершении задачи (успешно, с ошибкой или при отмене). Callback получает объект Task в качестве единственного аргумента. Можно добавить несколько callbacks.",
    syntax: "task.add_done_callback(callback, *, context=None)",
    arguments: [
      {
        name: "callback",
        description:
          "Callable, принимающий один аргумент — завершённый объект Task/Future. Вызывается в потоке event loop.",
      },
      {
        name: "context",
        description:
          "Контекст contextvars.Context для выполнения callback. По умолчанию None — используется текущий контекст.",
      },
    ],
    example: `import asyncio

def on_done(task: asyncio.Task):
    if task.cancelled():
        print('Задача отменена')
    elif task.exception():
        print(f'Ошибка: {task.exception()}')
    else:
        print(f'Готово, результат: {task.result()}')

async def worker() -> str:
    await asyncio.sleep(0.5)
    return 'успех'

async def main():
    task = asyncio.create_task(worker())
    task.add_done_callback(on_done)
    await task
    # on_done вызывается автоматически после завершения

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.remove_done_callback()",
    description:
      "Удаляет ранее зарегистрированный callback из списка обратных вызовов задачи. Возвращает количество удалённых экземпляров (один и тот же callback может быть добавлен несколько раз). Полезно для отмены подписки до завершения задачи.",
    syntax: "task.remove_done_callback(callback)",
    arguments: [
      {
        name: "callback",
        description:
          "Функция обратного вызова, ранее добавленная через add_done_callback(), которую нужно удалить.",
      },
    ],
    example: `import asyncio

def on_done(task: asyncio.Task):
    print('Callback вызван')

async def worker():
    await asyncio.sleep(1)
    return 42

async def main():
    task = asyncio.create_task(worker())
    task.add_done_callback(on_done)

    # Передумали — убираем callback до завершения
    removed = task.remove_done_callback(on_done)
    print(f'Удалено callbacks: {removed}')  # 1

    await task
    # on_done НЕ будет вызван

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.get_stack()",
    description:
      "Возвращает список объектов фреймов (frame) стека вызовов задачи. Если задача выполняется — возвращает текущий стек. Если задача ожидает future — возвращает стек до точки ожидания. Полезно для отладки зависших задач.",
    syntax: "task.get_stack(*, limit=None)",
    arguments: [
      {
        name: "limit",
        description:
          "Максимальное количество фреймов стека. None — возвращает весь стек. Фреймы упорядочены от самого внешнего к самому внутреннему.",
      },
    ],
    example: `import asyncio

async def inner():
    await asyncio.sleep(10)  # зависает здесь

async def outer():
    await inner()

async def main():
    task = asyncio.create_task(outer())
    await asyncio.sleep(0.1)  # даём задаче запуститься

    frames = task.get_stack()
    print(f'Глубина стека: {len(frames)}')
    for frame in frames:
        print(f'  {frame.f_code.co_filename}:{frame.f_lineno} в {frame.f_code.co_name}')

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.print_stack()",
    description:
      "Выводит стек вызовов задачи в текстовом виде (аналогично traceback). Удобная обёртка над get_stack() для быстрой отладки. По умолчанию выводит в stderr.",
    syntax: "task.print_stack(*, limit=None, file=None)",
    arguments: [
      {
        name: "limit",
        description:
          "Максимальное количество фреймов для вывода. None — весь стек.",
      },
      {
        name: "file",
        description:
          "Файловый объект для вывода. По умолчанию None — вывод в sys.stderr.",
      },
    ],
    example: `import asyncio
import sys

async def waiting_task():
    await asyncio.sleep(100)

async def main():
    task = asyncio.create_task(waiting_task(), name='my-task')
    await asyncio.sleep(0.1)

    print('=== Стек задачи ===')
    task.print_stack(file=sys.stdout)  # вывод в stdout вместо stderr

    # Вывод только 2 последних фрейма
    task.print_stack(limit=2)

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.set_name()",
    description:
      "Устанавливает имя задачи. Имя отображается в repr(task) и в отладочных сообщениях event loop. Может быть изменено в любой момент жизни задачи. Полезно для идентификации задач при логировании и мониторинге.",
    syntax: "task.set_name(value)",
    arguments: [
      {
        name: "value",
        description:
          "Новое имя задачи в виде строки. Будет преобразовано через str(value), если передан не строковый тип.",
      },
    ],
    example: `import asyncio

async def worker(user_id: int):
    task = asyncio.current_task()
    task.set_name(f'worker-user-{user_id}')

    await asyncio.sleep(1)
    print(f'Задача {task.get_name()} завершена')

async def main():
    tasks = [asyncio.create_task(worker(i)) for i in range(1, 4)]

    await asyncio.sleep(0.1)
    for t in tasks:
        print(t.get_name())  # worker-user-1, worker-user-2, worker-user-3

    await asyncio.gather(*tasks)

asyncio.run(main())`,
  },
  {
    name: "asyncio.Task.get_name()",
    description:
      'Возвращает имя задачи в виде строки. Если имя не было задано явно через set_name() или create_task(name=...), возвращает автоматически сгенерированное имя вида "Task-N".',
    syntax: "task.get_name()",
    arguments: [],
    example: `import asyncio

async def job():
    await asyncio.sleep(0.1)

async def main():
    # Автоматическое имя
    t1 = asyncio.create_task(job())
    print(t1.get_name())  # Task-1 (или Task-2 и т.д.)

    # Явное имя
    t2 = asyncio.create_task(job(), name='data-fetcher')
    print(t2.get_name())  # data-fetcher

    # Переименование
    t2.set_name('renamed-task')
    print(t2.get_name())  # renamed-task

    await asyncio.gather(t1, t2)

asyncio.run(main())`,
  },
  {
    name: "asyncio.Future.set_result()",
    description:
      'Устанавливает результат Future и переводит его в состояние "завершён". После этого все корутины, ожидающие данный Future через await, получат этот результат. Если Future уже имеет результат или исключение — выбрасывает asyncio.InvalidStateError.',
    syntax: "future.set_result(result)",
    arguments: [
      {
        name: "result",
        description:
          "Произвольное значение, которое будет возвращено при await future. Может быть любым объектом Python, включая None.",
      },
    ],
    example: `import asyncio

async def waiter(future: asyncio.Future):
    print('Ожидаем результат...')
    result = await future
    print(f'Получен результат: {result}')

async def setter(future: asyncio.Future):
    await asyncio.sleep(1)
    future.set_result({'status': 'ok', 'data': [1, 2, 3]})

async def main():
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    await asyncio.gather(
        waiter(future),
        setter(future),
    )

asyncio.run(main())`,
  },
  {
    name: "asyncio.Future.set_exception()",
    description:
      'Устанавливает исключение для Future и переводит его в состояние "завершён с ошибкой". Все корутины, ожидающие этот Future через await, получат данное исключение. Если Future уже завершён — выбрасывает asyncio.InvalidStateError. Нельзя передавать asyncio.CancelledError.',
    syntax: "future.set_exception(exception)",
    arguments: [
      {
        name: "exception",
        description:
          "Экземпляр или класс исключения (BaseException). При передаче класса он будет инстанциирован без аргументов. asyncio.CancelledError передавать нельзя.",
      },
    ],
    example: `import asyncio

async def consumer(future: asyncio.Future):
    try:
        result = await future
        print(f'Результат: {result}')
    except ValueError as e:
        print(f'Поймано исключение: {e}')

async def producer(future: asyncio.Future):
    await asyncio.sleep(0.5)
    # Сообщаем об ошибке через Future
    future.set_exception(ValueError('Данные повреждены'))

async def main():
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    await asyncio.gather(
        consumer(future),
        producer(future),
    )

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.empty()",
    description:
      "Возвращает True, если очередь пуста (не содержит ни одного элемента), и False в противном случае. Является неблокирующей проверкой состояния — не ожидает появления элементов.",
    syntax: "queue.empty()",
    arguments: [],
    example: `import asyncio

async def main():
    queue = asyncio.Queue()

    print(queue.empty())  # True — очередь пуста

    await queue.put('задача')
    print(queue.empty())  # False — есть элемент

    await queue.get()
    print(queue.empty())  # True — снова пуста

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.full()",
    description:
      "Возвращает True, если очередь заполнена (количество элементов достигло maxsize), и False в противном случае. Для очереди без ограничения (maxsize=0) всегда возвращает False.",
    syntax: "queue.full()",
    arguments: [],
    example: `import asyncio

async def main():
    queue = asyncio.Queue(maxsize=2)

    print(queue.full())  # False

    await queue.put('а')
    await queue.put('б')
    print(queue.full())  # True — заполнена

    await queue.get()
    print(queue.full())  # False — освободилось место

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.get()",
    description:
      "Корутина, извлекающая и возвращающая элемент из начала очереди. Если очередь пуста — ожидает до появления элемента. Для использования без ожидания см. get_nowait().",
    syntax: "await queue.get()",
    arguments: [],
    example: `import asyncio

async def producer(queue: asyncio.Queue):
    for i in range(3):
        await asyncio.sleep(0.5)
        await queue.put(f'задача-{i}')
        print(f'Добавлено: задача-{i}')

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()  # ждёт, если очередь пуста
        print(f'Обработано: {item}')
        queue.task_done()

async def main():
    queue = asyncio.Queue()
    asyncio.create_task(consumer(queue))
    await producer(queue)
    await queue.join()

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.get_nowait()",
    description:
      "Немедленно извлекает и возвращает элемент из очереди без ожидания. Если очередь пуста — выбрасывает asyncio.QueueEmpty. Используется когда нужна неблокирующая проверка наличия элементов.",
    syntax: "queue.get_nowait()",
    arguments: [],
    example: `import asyncio

async def main():
    queue = asyncio.Queue()
    await queue.put('данные')

    # Успешное получение
    item = queue.get_nowait()
    print(item)  # данные

    # Очередь пуста — исключение
    try:
        queue.get_nowait()
    except asyncio.QueueEmpty:
        print('Очередь пуста')

    # Типичный паттерн: опустошить очередь без блокировки
    await queue.put('а')
    await queue.put('б')
    items = []
    while not queue.empty():
        items.append(queue.get_nowait())
    print(items)  # ['а', 'б']

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.join()",
    description:
      "Корутина, которая блокирует выполнение до тех пор, пока все элементы, когда-либо помещённые в очередь, не будут обработаны (для каждого вызова get() должен быть вызван task_done()). Используется для ожидания завершения всей работы воркеров.",
    syntax: "await queue.join()",
    arguments: [],
    example: `import asyncio

async def worker(name: str, queue: asyncio.Queue):
    while True:
        item = await queue.get()
        print(f'{name} обрабатывает: {item}')
        await asyncio.sleep(0.3)  # имитация работы
        queue.task_done()         # сигнал о завершении

async def main():
    queue = asyncio.Queue()

    # Заполняем очередь задачами
    for i in range(5):
        await queue.put(f'задача-{i}')

    # Запускаем двух воркеров
    workers = [asyncio.create_task(worker(f'w{i}', queue)) for i in range(2)]

    # Ждём обработки всех задач
    await queue.join()
    print('Все задачи выполнены!')

    for w in workers:
        w.cancel()

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.put()",
    description:
      "Корутина, добавляющая элемент в конец очереди. Если очередь заполнена (maxsize > 0) — ожидает, пока не освободится место. Для добавления без ожидания см. put_nowait().",
    syntax: "await queue.put(item)",
    arguments: [
      {
        name: "item",
        description:
          "Произвольный объект Python, который нужно поместить в очередь.",
      },
    ],
    example: `import asyncio

async def main():
    queue = asyncio.Queue(maxsize=2)

    await queue.put('первый')
    await queue.put('второй')
    print(queue.full())  # True

    # Создаём задачу, которая ждёт места в очереди
    put_task = asyncio.create_task(queue.put('третий'))

    # Освобождаем место
    await queue.get()
    await put_task  # теперь третий элемент добавлен

    print(queue.qsize())  # 2

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.put_nowait()",
    description:
      "Немедленно добавляет элемент в очередь без ожидания. Если очередь заполнена — выбрасывает asyncio.QueueFull. Используется когда добавление должно быть моментальным или когда переполнение является ожидаемой ситуацией.",
    syntax: "queue.put_nowait(item)",
    arguments: [
      {
        name: "item",
        description:
          "Произвольный объект Python, который нужно поместить в очередь.",
      },
    ],
    example: `import asyncio

async def main():
    queue = asyncio.Queue(maxsize=2)

    queue.put_nowait('а')
    queue.put_nowait('б')
    print(queue.qsize())  # 2

    # Очередь полна — исключение
    try:
        queue.put_nowait('в')
    except asyncio.QueueFull:
        print('Очередь переполнена, элемент не добавлен')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.qsize()",
    description:
      "Возвращает текущее количество элементов в очереди в виде целого числа. Является мгновенным снимком состояния — значение может измениться сразу после вызова при конкурентном доступе.",
    syntax: "queue.qsize()",
    arguments: [],
    example: `import asyncio

async def main():
    queue = asyncio.Queue()

    print(queue.qsize())  # 0

    await queue.put('а')
    await queue.put('б')
    await queue.put('в')
    print(queue.qsize())  # 3

    await queue.get()
    print(queue.qsize())  # 2

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.task_done()",
    description:
      "Сигнализирует очереди, что элемент, полученный через get(), был полностью обработан. Уменьшает внутренний счётчик незавершённых задач. Когда счётчик достигает нуля — разблокирует все корутины, ожидающие в queue.join(). Вызов task_done() без предшествующего get() выбрасывает ValueError.",
    syntax: "queue.task_done()",
    arguments: [],
    example: `import asyncio

async def worker(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        try:
            print(f'Обрабатываем: {item}')
            await asyncio.sleep(0.2)  # основная работа
        finally:
            # Вызываем даже при ошибке, чтобы join() не завис
            queue.task_done()

async def main():
    queue = asyncio.Queue()
    for item in ['запрос-1', 'запрос-2', 'запрос-3']:
        await queue.put(item)

    task = asyncio.create_task(worker(queue))

    await queue.join()  # ждёт трёх вызовов task_done()
    print('Все задачи завершены')
    task.cancel()

asyncio.run(main())`,
  },
  {
    name: "asyncio.Queue.maxsize",
    description:
      "Атрибут, хранящий максимально допустимое количество элементов в очереди. Значение 0 (по умолчанию) означает отсутствие ограничения — очередь может расти неограниченно. Задаётся при создании очереди и не изменяется в процессе работы.",
    syntax: "queue.maxsize",
    arguments: [],
    example: `import asyncio

async def main():
    # Очередь без ограничения
    q1 = asyncio.Queue()
    print(q1.maxsize)   # 0
    print(q1.full())    # False (всегда)

    # Очередь с ограничением
    q2 = asyncio.Queue(maxsize=5)
    print(q2.maxsize)   # 5

    for i in range(5):
        await q2.put(i)
    print(q2.full())    # True

    # Другие типы очередей также поддерживают maxsize
    lifo = asyncio.LifoQueue(maxsize=10)
    prio = asyncio.PriorityQueue(maxsize=3)
    print(lifo.maxsize, prio.maxsize)  # 10 3

asyncio.run(main())`,
  },
  {
    name: "asyncio.Lock.acquire()",
    description:
      "Корутина, захватывающая блокировку. Если блокировка уже захвачена другой задачей — ожидает её освобождения. После успешного захвата возвращает True. Рекомендуется использовать через контекстный менеджер async with вместо явного вызова.",
    syntax: "await lock.acquire()",
    arguments: [],
    example: `import asyncio

async def safe_update(lock: asyncio.Lock, shared: list, value: int):
    await lock.acquire()
    try:
        # Критическая секция — только одна задача одновременно
        shared.append(value)
        await asyncio.sleep(0.1)  # имитация работы
        print(f'Добавлено: {value}, список: {shared}')
    finally:
        lock.release()

async def main():
    lock = asyncio.Lock()
    data: list = []
    await asyncio.gather(
        safe_update(lock, data, 1),
        safe_update(lock, data, 2),
        safe_update(lock, data, 3),
    )
    print('Итог:', data)

asyncio.run(main())`,
  },
  {
    name: "asyncio.Lock.release()",
    description:
      "Освобождает захваченную блокировку, позволяя другим задачам её захватить. Если блокировка не была захвачена — выбрасывает RuntimeError. При использовании async with вызывается автоматически.",
    syntax: "lock.release()",
    arguments: [],
    example: `import asyncio

async def main():
    lock = asyncio.Lock()

    await lock.acquire()
    print('Блокировка захвачена')
    print(lock.locked())  # True

    lock.release()
    print('Блокировка освобождена')
    print(lock.locked())  # False

    # Предпочтительный способ — контекстный менеджер:
    async with lock:
        print('Захвачено через with')
    # release() вызван автоматически

asyncio.run(main())`,
  },
  {
    name: "asyncio.Lock.locked()",
    description:
      "Возвращает True, если блокировка в данный момент захвачена какой-либо задачей, и False, если блокировка свободна. Является мгновенной проверкой без ожидания.",
    syntax: "lock.locked()",
    arguments: [],
    example: `import asyncio

async def holder(lock: asyncio.Lock):
    async with lock:
        await asyncio.sleep(1)

async def main():
    lock = asyncio.Lock()
    print(lock.locked())  # False

    task = asyncio.create_task(holder(lock))
    await asyncio.sleep(0.1)
    print(lock.locked())  # True — захвата в holder()

    await task
    print(lock.locked())  # False — освобождена

asyncio.run(main())`,
  },
  {
    name: "asyncio.Event.set()",
    description:
      "Устанавливает внутренний флаг события в True и немедленно пробуждает все корутины, ожидающие в wait(). После вызова set() все последующие вызовы wait() возвращаются без ожидания до тех пор, пока не будет вызван clear().",
    syntax: "event.set()",
    arguments: [],
    example: `import asyncio

async def waiter(event: asyncio.Event, name: str):
    print(f'{name}: жду сигнала...')
    await event.wait()
    print(f'{name}: сигнал получен!')

async def main():
    event = asyncio.Event()

    tasks = [asyncio.create_task(waiter(event, f'w{i}')) for i in range(3)]
    await asyncio.sleep(0.5)

    print('Отправляем сигнал всем...')
    event.set()  # пробуждает сразу все три задачи

    await asyncio.gather(*tasks)

asyncio.run(main())`,
  },
  {
    name: "asyncio.Event.clear()",
    description:
      "Сбрасывает внутренний флаг события в False. После вызова clear() корутины, вызывающие wait(), снова будут ожидать до следующего set(). Используется для повторного использования события как сигнала.",
    syntax: "event.clear()",
    arguments: [],
    example: `import asyncio

async def main():
    event = asyncio.Event()

    event.set()
    print(event.is_set())  # True

    event.clear()
    print(event.is_set())  # False

    # Теперь wait() будет снова ожидать
    async def wait_and_print():
        await event.wait()
        print('Дождались повторного set()')

    task = asyncio.create_task(wait_and_print())
    await asyncio.sleep(0.2)
    event.set()  # повторный сигнал
    await task

asyncio.run(main())`,
  },
  {
    name: "asyncio.Event.wait()",
    description:
      "Корутина, блокирующая выполнение до тех пор, пока внутренний флаг события не станет True (через set()). Если флаг уже установлен — возвращается немедленно. Возвращает True после ожидания.",
    syntax: "await event.wait()",
    arguments: [],
    example: `import asyncio

async def data_processor(ready: asyncio.Event, data: list):
    print('Процессор: жду данных...')
    await ready.wait()
    print(f'Процессор: обрабатываю {len(data)} элементов')
    return sum(data)

async def data_loader(ready: asyncio.Event, data: list):
    print('Загрузчик: загружаю данные...')
    await asyncio.sleep(1)
    data.extend([1, 2, 3, 4, 5])
    print('Загрузчик: данные готовы!')
    ready.set()

async def main():
    ready = asyncio.Event()
    data: list = []
    result, _ = await asyncio.gather(
        data_processor(ready, data),
        data_loader(ready, data),
    )
    print(f'Результат: {result}')  # 15

asyncio.run(main())`,
  },
  {
    name: "asyncio.Event.is_set()",
    description:
      "Возвращает True, если флаг события установлен (был вызван set()), и False, если флаг сброшен. Является мгновенной неблокирующей проверкой, в отличие от wait().",
    syntax: "event.is_set()",
    arguments: [],
    example: `import asyncio

async def main():
    event = asyncio.Event()

    print(event.is_set())  # False

    event.set()
    print(event.is_set())  # True

    event.clear()
    print(event.is_set())  # False

    # Условная логика без блокировки
    if not event.is_set():
        print('Событие ещё не произошло, запускаем инициализацию')
        await asyncio.sleep(0.1)
        event.set()

asyncio.run(main())`,
  },
  {
    name: "asyncio.Semaphore.acquire()",
    description:
      "Корутина, уменьшающая счётчик семафора на 1. Если счётчик равен 0 — ожидает, пока другая задача не вызовет release(). Используется для ограничения количества задач, одновременно выполняющих ресурсоёмкую операцию.",
    syntax: "await semaphore.acquire()",
    arguments: [],
    example: `import asyncio

async def fetch(sem: asyncio.Semaphore, url: str) -> str:
    async with sem:  # acquire() + release() автоматически
        print(f'Запрос к {url}')
        await asyncio.sleep(0.5)  # имитация HTTP-запроса
        return f'Данные от {url}'

async def main():
    # Не более 3 одновременных запросов
    sem = asyncio.Semaphore(3)
    urls = [f'https://api.example.com/item/{i}' for i in range(8)]
    results = await asyncio.gather(*[fetch(sem, url) for url in urls])
    print(f'Получено {len(results)} ответов')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Semaphore.release()",
    description:
      "Увеличивает счётчик семафора на 1 и пробуждает одну из ожидающих задач (если есть). Для BoundedSemaphore выбрасывает ValueError при попытке превысить начальное значение счётчика.",
    syntax: "semaphore.release()",
    arguments: [],
    example: `import asyncio

async def main():
    sem = asyncio.Semaphore(2)

    await sem.acquire()
    await sem.acquire()
    print('Захвачено 2 слота')
    print(sem.locked())  # True — счётчик равен 0

    sem.release()
    print('Освобождён 1 слот')
    print(sem.locked())  # False — счётчик стал 1

    sem.release()
    print('Освобождён 2-й слот, счётчик вернулся к 2')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Semaphore.locked()",
    description:
      "Возвращает True, если счётчик семафора равен нулю (все слоты заняты) и любой вызов acquire() будет заблокирован. Возвращает False, если есть свободные слоты.",
    syntax: "semaphore.locked()",
    arguments: [],
    example: `import asyncio

async def main():
    sem = asyncio.Semaphore(2)

    print(sem.locked())  # False — оба слота свободны

    await sem.acquire()
    print(sem.locked())  # False — остался 1 свободный слот

    await sem.acquire()
    print(sem.locked())  # True — слотов нет

    sem.release()
    print(sem.locked())  # False — появился 1 слот

asyncio.run(main())`,
  },
  {
    name: "asyncio.Condition.acquire()",
    description:
      "Корутина, захватывающая внутреннюю блокировку условной переменной. Должна быть захвачена перед вызовом wait(), notify() или notify_all(). Рекомендуется использовать через async with вместо явного вызова.",
    syntax: "await condition.acquire()",
    arguments: [],
    example: `import asyncio

async def main():
    cond = asyncio.Condition()

    # Явный захват
    await cond.acquire()
    try:
        print('Блокировка захвачена')
        cond.notify_all()
    finally:
        cond.release()

    # Предпочтительный способ:
    async with cond:
        print('Захвачено через async with')
        cond.notify_all()
    # release() вызывается автоматически

asyncio.run(main())`,
  },
  {
    name: "asyncio.Condition.release()",
    description:
      "Освобождает внутреннюю блокировку условной переменной. Должна вызываться после acquire() для разблокировки других задач. При использовании async with вызывается автоматически.",
    syntax: "condition.release()",
    arguments: [],
    example: `import asyncio

async def main():
    cond = asyncio.Condition()

    await cond.acquire()
    print('Захвачено')
    await asyncio.sleep(0.1)
    cond.release()
    print('Освобождено')

asyncio.run(main())`,
  },
  {
    name: "asyncio.Condition.notify()",
    description:
      "Пробуждает одну (или n) задач, ожидающих в condition.wait(). Должна вызываться при захваченной блокировке. Пробуждённая задача не начнёт выполнение до тех пор, пока вызывающая задача не освободит блокировку.",
    syntax: "condition.notify(n=1)",
    arguments: [
      {
        name: "n",
        description:
          "Количество задач, которые нужно пробудить. По умолчанию 1. Если ожидающих задач меньше n — пробуждаются все.",
      },
    ],
    example: `import asyncio

async def worker(cond: asyncio.Condition, name: str):
    async with cond:
        print(f'{name}: жду уведомления')
        await cond.wait()
        print(f'{name}: получил уведомление!')

async def notifier(cond: asyncio.Condition):
    await asyncio.sleep(0.5)
    async with cond:
        print('Уведомляем одну задачу')
        cond.notify(1)
    await asyncio.sleep(0.5)
    async with cond:
        print('Уведомляем ещё одну')
        cond.notify(1)

async def main():
    cond = asyncio.Condition()
    await asyncio.gather(
        worker(cond, 'w1'),
        worker(cond, 'w2'),
        notifier(cond),
    )

asyncio.run(main())`,
  },
  {
    name: "asyncio.Condition.notify_all()",
    description:
      "Пробуждает все задачи, ожидающие в condition.wait(). Аналогично notify(n), где n — количество всех ожидающих задач. Используется когда изменение состояния актуально для всех ожидающих.",
    syntax: "condition.notify_all()",
    arguments: [],
    example: `import asyncio

async def subscriber(cond: asyncio.Condition, name: str):
    async with cond:
        await cond.wait()
        print(f'{name}: событие получено!')

async def broadcaster(cond: asyncio.Condition):
    await asyncio.sleep(0.5)
    async with cond:
        print('Рассылаем всем подписчикам...')
        cond.notify_all()  # пробуждает все три задачи разом

async def main():
    cond = asyncio.Condition()
    await asyncio.gather(
        subscriber(cond, 'sub-А'),
        subscriber(cond, 'sub-Б'),
        subscriber(cond, 'sub-В'),
        broadcaster(cond),
    )

asyncio.run(main())`,
  },
  {
    name: "asyncio.Condition.wait()",
    description:
      "Корутина, освобождающая внутреннюю блокировку и ожидающая уведомления от notify() или notify_all(). После получения уведомления повторно захватывает блокировку перед возвратом. Должна вызываться при захваченной блокировке (внутри async with cond).",
    syntax: "await condition.wait()",
    arguments: [],
    example: `import asyncio

shared_data: list = []

async def consumer(cond: asyncio.Condition):
    async with cond:
        # Ждём, пока данные не появятся
        await cond.wait_for(lambda: len(shared_data) > 0)
        print(f'Обрабатываю данные: {shared_data}')

async def producer(cond: asyncio.Condition):
    await asyncio.sleep(0.5)
    async with cond:
        shared_data.extend([10, 20, 30])
        print('Данные добавлены, уведомляем')
        cond.notify_all()

async def main():
    cond = asyncio.Condition()
    await asyncio.gather(consumer(cond), producer(cond))

asyncio.run(main())`,
  },
  {
    name: "asyncio.open_connection()",
    description:
      "Корутина, устанавливающая TCP-соединение с указанным хостом и портом. Возвращает пару (StreamReader, StreamWriter) для чтения и записи данных. Является высокоуровневой оберткой над низкоуровневым API event loop.",
    syntax:
      "await asyncio.open_connection(host=None, port=None, *, ssl=None, limit=65536, **kwds)",
    arguments: [
      {
        name: "host",
        description:
          "Хост для подключения: строка с IP-адресом или доменным именем.",
      },
      {
        name: "port",
        description: "Порт для подключения в виде целого числа.",
      },
      {
        name: "ssl",
        description:
          "Настройки SSL: объект ssl.SSLContext, True (использовать стандартный контекст) или None (без SSL).",
      },
      {
        name: "limit",
        description:
          "Максимальный размер внутреннего буфера StreamReader в байтах. По умолчанию 65536 (64 КБ).",
      },
    ],
    example: `import asyncio

async def tcp_client():
    reader, writer = await asyncio.open_connection('example.com', 80)

    # Отправляем HTTP-запрос
    request = 'GET / HTTP/1.0\\r\\nHost: example.com\\r\\n\\r\\n'
    writer.write(request.encode())
    await writer.drain()

    # Читаем ответ
    data = await reader.read(1024)
    print(data.decode())

    writer.close()
    await writer.wait_closed()

asyncio.run(tcp_client())`,
  },
  {
    name: "asyncio.start_server()",
    description:
      "Корутина, создающая TCP-сервер. При каждом новом подключении вызывает callback-функцию с парой (StreamReader, StreamWriter). Возвращает объект asyncio.Server, который можно использовать как контекстный менеджер.",
    syntax:
      "await asyncio.start_server(client_connected_cb, host=None, port=None, *, ssl=None, limit=65536, **kwds)",
    arguments: [
      {
        name: "client_connected_cb",
        description:
          "Корутина или обычная функция, вызываемая при новом подключении. Получает аргументы (reader: StreamReader, writer: StreamWriter).",
      },
      {
        name: "host",
        description:
          "Хост для прослушивания. None или пустая строка — слушать на всех интерфейсах.",
      },
      {
        name: "port",
        description: "Порт для прослушивания.",
      },
      {
        name: "ssl",
        description:
          "Настройки SSL для TLS-сервера. Объект ssl.SSLContext или None.",
      },
    ],
    example: `import asyncio

async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    addr = writer.get_extra_info('peername')
    print(f'Подключение от {addr}')

    data = await reader.readline()
    message = data.decode().strip()
    print(f'Получено: {message}')

    writer.write(f'Эхо: {message}\\n'.encode())
    await writer.drain()

    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle_client, '127.0.0.1', 8888)
    async with server:
        print('Сервер запущен на порту 8888')
        await server.serve_forever()

asyncio.run(main())`,
  },
  {
    name: "asyncio.StreamReader.read()",
    description:
      'Корутина, читающая до n байт из потока. Если n=-1 — читает данные до достижения EOF. Возвращает bytes. Если соединение закрыто и буфер пуст — возвращает пустые bytes b"".',
    syntax: "await reader.read(n=-1)",
    arguments: [
      {
        name: "n",
        description:
          "Максимальное количество байт для чтения. -1 означает читать до EOF. Может вернуть меньше байт, чем запрошено, если данных ещё нет.",
      },
    ],
    example: `import asyncio

async def client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)

    # Читать порцию данных (до 1024 байт)
    chunk = await reader.read(1024)
    print(f'Получено {len(chunk)} байт: {chunk[:50]}')

    # Читать всё до закрытия соединения
    writer.write(b'START\\n')
    await writer.drain()
    all_data = await reader.read(-1)
    print(f'Всего получено: {len(all_data)} байт')

    writer.close()
    await writer.wait_closed()

asyncio.run(client())`,
  },
  {
    name: "asyncio.StreamReader.readline()",
    description:
      'Корутина, читающая одну строку из потока до символа новой строки "\\n" включительно. Возвращает bytes с символом "\\n" в конце. Если EOF достигнут до "\\n" — возвращает неполную строку.',
    syntax: "await reader.readline()",
    arguments: [],
    example: `import asyncio

async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    while True:
        line = await reader.readline()
        if not line:
            break  # EOF

        decoded = line.decode().strip()
        print(f'Строка: {decoded}')

        if decoded == 'quit':
            break

        writer.write(f'OK: {decoded}\\n'.encode())
        await writer.drain()

    writer.close()

async def main():
    server = await asyncio.start_server(handle, '127.0.0.1', 8888)
    async with server:
        await server.serve_forever()

asyncio.run(main())`,
  },
  {
    name: "asyncio.StreamReader.readexactly()",
    description:
      "Корутина, читающая ровно n байт из потока. Ждёт, пока не будет получено точно n байт. Если соединение закрыто раньше — выбрасывает asyncio.IncompleteReadError с частично прочитанными данными в атрибуте partial.",
    syntax: "await reader.readexactly(n)",
    arguments: [
      {
        name: "n",
        description:
          "Точное количество байт для чтения. Должно быть неотрицательным целым числом.",
      },
    ],
    example: `import asyncio

async def read_protocol(reader: asyncio.StreamReader):
    try:
        # Читаем заголовок фиксированного размера (4 байта — длина тела)
        header = await reader.readexactly(4)
        body_length = int.from_bytes(header, 'big')
        print(f'Ожидаем тело размером {body_length} байт')

        # Читаем тело ровно нужного размера
        body = await reader.readexactly(body_length)
        return body.decode()

    except asyncio.IncompleteReadError as e:
        print(f'Соединение разорвано, получено {len(e.partial)} байт')
        return None

asyncio.run(read_protocol(...))`,
  },
  {
    name: "asyncio.StreamReader.readuntil()",
    description:
      "Корутина, читающая данные из потока до тех пор, пока не встретится заданный разделитель. Возвращает bytes, включая сам разделитель. Выбрасывает asyncio.LimitOverrunError, если разделитель не найден в пределах буфера.",
    syntax: "await reader.readuntil(separator=b'\\n')",
    arguments: [
      {
        name: "separator",
        description:
          'Байтовая последовательность-разделитель, при обнаружении которой чтение останавливается. По умолчанию b"\\n".',
      },
    ],
    example: `import asyncio

async def client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)

    # Читать до символа новой строки (аналог readline)
    line = await reader.readuntil(b'\\n')
    print(line.decode().strip())

    # Читать до кастомного разделителя
    data = await reader.readuntil(b'END\\r\\n')
    print(f'Блок данных: {data[:-5].decode()}')  # убираем разделитель

    writer.close()
    await writer.wait_closed()

asyncio.run(client())`,
  },
  {
    name: "asyncio.StreamReader.at_eof()",
    description:
      "Возвращает True, если буфер StreamReader пуст и соединение закрыто на стороне отправителя (получен сигнал EOF). Используется для проверки завершения потока без блокирующего чтения.",
    syntax: "reader.at_eof()",
    arguments: [],
    example: `import asyncio

async def drain_stream(reader: asyncio.StreamReader) -> list:
    lines = []
    while not reader.at_eof():
        try:
            line = await asyncio.wait_for(reader.readline(), timeout=1.0)
            if line:
                lines.append(line.decode().strip())
        except asyncio.TimeoutError:
            break
    return lines

async def main():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)
    result = await drain_stream(reader)
    print(f'Получено {len(result)} строк')
    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },
  {
    name: "asyncio.StreamWriter.write()",
    description:
      "Помещает данные в буфер отправки. Не является корутиной — возвращает управление немедленно. Данные не гарантированно отправлены до вызова drain(). После write() необходимо вызвать await writer.drain() для фактической отправки.",
    syntax: "writer.write(data)",
    arguments: [
      {
        name: "data",
        description:
          "Байтовые данные для записи в поток. Тип bytes или bytearray.",
      },
    ],
    example: `import asyncio

async def client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)

    # Запись данных в буфер
    writer.write(b'Привет, сервер!\\n')

    # Обязательно drain() для фактической отправки
    await writer.drain()

    # Можно несколько write() перед одним drain()
    writer.write(b'Строка 1\\n')
    writer.write(b'Строка 2\\n')
    writer.write(b'Строка 3\\n')
    await writer.drain()

    writer.close()
    await writer.wait_closed()

asyncio.run(client())`,
  },
  {
    name: "asyncio.StreamWriter.writelines()",
    description:
      "Записывает последовательность байтовых объектов в буфер отправки. Эквивалентно последовательному вызову write() для каждого элемента. Не является корутиной. После вызова необходимо await writer.drain().",
    syntax: "writer.writelines(data)",
    arguments: [
      {
        name: "data",
        description:
          "Итерируемый объект, содержащий байтовые данные (bytes или bytearray). Например, список строк, предварительно закодированных в bytes.",
      },
    ],
    example: `import asyncio

async def client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)

    lines = [
        b'USER guest\\r\\n',
        b'PASS secret\\r\\n',
        b'LIST\\r\\n',
    ]
    writer.writelines(lines)
    await writer.drain()

    response = await reader.read(4096)
    print(response.decode())

    writer.close()
    await writer.wait_closed()

asyncio.run(client())`,
  },
  {
    name: "asyncio.StreamWriter.drain()",
    description:
      "Корутина, ожидающая опустошения буфера отправки. Позволяет event loop отправить накопленные данные и предотвращает переполнение буфера при интенсивной записи. Необходимо вызывать после write() и writelines().",
    syntax: "await writer.drain()",
    arguments: [],
    example: `import asyncio

async def send_large_data(writer: asyncio.StreamWriter, data: bytes):
    chunk_size = 64 * 1024  # 64 КБ за раз

    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        writer.write(chunk)
        await writer.drain()  # ждём отправки перед следующим чанком
        print(f'Отправлено {min(i + chunk_size, len(data))}/{len(data)} байт')

async def main():
    _, writer = await asyncio.open_connection('127.0.0.1', 8888)
    await send_large_data(writer, b'X' * (1024 * 1024))  # 1 МБ
    writer.close()
    await writer.wait_closed()

asyncio.run(main())`,
  },
  {
    name: "asyncio.StreamWriter.close()",
    description:
      "Инициирует закрытие транспортного соединения. Не является корутиной и не ждёт фактического закрытия — для ожидания следует вызвать await writer.wait_closed(). После вызова запись в поток становится невозможной.",
    syntax: "writer.close()",
    arguments: [],
    example: `import asyncio

async def client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)

    writer.write(b'QUIT\\n')
    await writer.drain()

    # Инициируем закрытие
    writer.close()

    # Ждём фактического закрытия сокета
    await writer.wait_closed()
    print('Соединение закрыто')
    print(writer.is_closing())  # True

asyncio.run(client())`,
  },
  {
    name: "asyncio.StreamWriter.is_closing()",
    description:
      "Возвращает True, если транспортное соединение закрыто или находится в процессе закрытия (был вызван close()). Позволяет проверить состояние соединения без блокирующего ожидания.",
    syntax: "writer.is_closing()",
    arguments: [],
    example: `import asyncio

async def safe_write(writer: asyncio.StreamWriter, data: bytes):
    if writer.is_closing():
        print('Соединение закрывается, запись невозможна')
        return

    writer.write(data)
    await writer.drain()

async def main():
    _, writer = await asyncio.open_connection('127.0.0.1', 8888)

    print(writer.is_closing())  # False

    await safe_write(writer, b'данные\\n')

    writer.close()
    print(writer.is_closing())  # True

    await safe_write(writer, b'это не отправится')
    await writer.wait_closed()

asyncio.run(main())`,
  },
  {
    name: "asyncio.StreamWriter.wait_closed()",
    description:
      "Корутина, ожидающая фактического закрытия соединения после вызова close(). Должна вызываться совместно с close() для корректного завершения соединения и освобождения ресурсов.",
    syntax: "await writer.wait_closed()",
    arguments: [],
    example: `import asyncio

async def client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)

    writer.write(b'Последнее сообщение\\n')
    await writer.drain()

    # Корректная последовательность закрытия:
    writer.close()           # 1. инициируем закрытие
    await writer.wait_closed()  # 2. ждём завершения

    print('Соединение полностью закрыто')

asyncio.run(client())`,
  },
  {
    name: "asyncio.StreamWriter.get_extra_info()",
    description:
      "Возвращает дополнительную информацию о транспортном соединении по имени атрибута. Позволяет получить IP-адрес и порт удалённой стороны, SSL-объект, название шифра и другие низкоуровневые детали соединения.",
    syntax: "writer.get_extra_info(name, default=None)",
    arguments: [
      {
        name: "name",
        description:
          'Строковое имя атрибута: "peername" (адрес удалённой стороны), "sockname" (локальный адрес), "socket" (объект сокета), "ssl_object" (SSL-объект), "cipher" (шифр SSL) и др.',
      },
      {
        name: "default",
        description:
          "Значение по умолчанию, возвращаемое если атрибут с указанным именем не найден. По умолчанию None.",
      },
    ],
    example: `import asyncio

async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    # Адрес клиента (host, port)
    peername = writer.get_extra_info('peername')
    print(f'Клиент: {peername[0]}:{peername[1]}')

    # Локальный адрес сервера
    sockname = writer.get_extra_info('sockname')
    print(f'Сервер: {sockname}')

    # Объект сокета (для низкоуровневых операций)
    sock = writer.get_extra_info('socket')
    print(f'Тип сокета: {sock.type}')

    # Для SSL-соединений:
    ssl_obj = writer.get_extra_info('ssl_object')
    if ssl_obj:
        print(f'Шифр: {ssl_obj.cipher()}')

    writer.close()
    await writer.wait_closed()

asyncio.run(asyncio.start_server(handle, '127.0.0.1', 8888))`,
  },
  {
    name: "asyncio.loop.run_until_complete()",
    description:
      "Запускает event loop и блокирует выполнение до завершения переданной корутины или Future. Возвращает результат корутины. Если loop уже запущен — выбрасывает RuntimeError. Является основным способом запуска asyncio-кода в синхронном контексте (низкоуровневая альтернатива asyncio.run()).",
    syntax: "loop.run_until_complete(future)",
    arguments: [
      {
        name: "future",
        description:
          "Корутина, Task или Future для выполнения. Если передана корутина — автоматически оборачивается в Task.",
      },
    ],
    example: `import asyncio

async def compute(x: int, y: int) -> int:
    await asyncio.sleep(0.1)
    return x + y

# Низкоуровневый способ (устаревший, предпочитайте asyncio.run())
loop = asyncio.new_event_loop()
try:
    result = loop.run_until_complete(compute(3, 4))
    print(f'Результат: {result}')  # 7
finally:
    loop.close()

# Современный эквивалент:
# result = asyncio.run(compute(3, 4))`,
  },
  {
    name: "asyncio.loop.run_forever()",
    description:
      "Запускает event loop в бесконечном цикле до вызова loop.stop(). Используется для серверных приложений, которые должны работать непрерывно. Блокирует выполнение до остановки loop.",
    syntax: "loop.run_forever()",
    arguments: [],
    example: `import asyncio
import signal

def shutdown(loop: asyncio.AbstractEventLoop):
    print('Остановка...')
    loop.stop()

async def periodic_task():
    while True:
        print('Тик')
        await asyncio.sleep(1)

loop = asyncio.new_event_loop()

# Регистрируем сигнал остановки
loop.add_signal_handler(signal.SIGINT, lambda: shutdown(loop))

# Планируем задачу
loop.create_task(periodic_task())

try:
    print('Запуск loop навсегда...')
    loop.run_forever()
finally:
    loop.close()
    print('Loop закрыт')`,
  },
  {
    name: "asyncio.loop.stop()",
    description:
      "Планирует остановку event loop. Loop завершит текущую итерацию и вернёт управление из run_forever() или run_until_complete(). Может вызываться из обратного вызова или из другого потока.",
    syntax: "loop.stop()",
    arguments: [],
    example: `import asyncio

async def main_task(loop: asyncio.AbstractEventLoop):
    print('Задача запущена')
    await asyncio.sleep(2)
    print('Задача завершена, останавливаем loop')
    loop.stop()

loop = asyncio.new_event_loop()
loop.create_task(main_task(loop))
loop.run_forever()
loop.close()
print('Программа завершена')`,
  },
  {
    name: "asyncio.loop.is_running()",
    description:
      "Возвращает True, если event loop в данный момент выполняется (запущен через run_forever() или run_until_complete()). Используется для проверки состояния loop перед запуском корутин или планированием задач.",
    syntax: "loop.is_running()",
    arguments: [],
    example: `import asyncio

async def check_state():
    loop = asyncio.get_event_loop()
    print(f'Запущен: {loop.is_running()}')   # True — внутри корутины
    print(f'Закрыт: {loop.is_closed()}')     # False

loop = asyncio.new_event_loop()
print(f'До запуска: {loop.is_running()}')    # False

loop.run_until_complete(check_state())

print(f'После: {loop.is_running()}')        # False
loop.close()`,
  },
  {
    name: "asyncio.loop.is_closed()",
    description:
      "Возвращает True, если event loop был закрыт вызовом loop.close(). Закрытый loop не может быть снова запущен. Используется для проверки перед попыткой запустить или использовать loop.",
    syntax: "loop.is_closed()",
    arguments: [],
    example: `import asyncio

loop = asyncio.new_event_loop()
print(loop.is_closed())   # False

loop.run_until_complete(asyncio.sleep(0))
print(loop.is_closed())   # False — loop завершил задачу, но не закрыт

loop.close()
print(loop.is_closed())   # True

# Попытка использовать закрытый loop вызовет RuntimeError:
try:
    loop.run_until_complete(asyncio.sleep(0))
except RuntimeError as e:
    print(f'Ошибка: {e}')`,
  },
  {
    name: "asyncio.loop.close()",
    description:
      "Закрывает event loop и освобождает все связанные ресурсы. После закрытия loop нельзя запустить снова. Не отменяет текущие задачи — их следует отменить до закрытия. Должен вызываться при завершении работы приложения.",
    syntax: "loop.close()",
    arguments: [],
    example: `import asyncio

async def main():
    await asyncio.sleep(0.1)
    print('Работа завершена')

loop = asyncio.new_event_loop()
try:
    loop.run_until_complete(main())
finally:
    # Корректное завершение: сначала отменяем незавершённые задачи
    pending = asyncio.all_tasks(loop)
    for task in pending:
        task.cancel()
    if pending:
        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))

    loop.close()
    print(f'Loop закрыт: {loop.is_closed()}')  # True`,
  },
  {
    name: "asyncio.loop.create_future()",
    description:
      "Создаёт и возвращает объект asyncio.Future, привязанный к данному event loop. Future — это низкоуровневый примитив, представляющий результат, который будет доступен в будущем. Является предпочтительным способом создания Future по сравнению с прямым вызовом конструктора.",
    syntax: "loop.create_future()",
    arguments: [],
    example: `import asyncio

async def set_result(future: asyncio.Future, value: int):
    await asyncio.sleep(0.5)
    future.set_result(value)
    print(f'Результат установлен: {value}')

async def main():
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    asyncio.create_task(set_result(future, 42))

    # Ожидаем результат Future
    result = await future
    print(f'Получен результат: {result}')  # 42

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.create_task()",
    description:
      "Создаёт asyncio.Task из корутины и планирует её выполнение в event loop. Задача начинает выполняться при следующей итерации loop. Аналогична asyncio.create_task(), но вызывается напрямую на объекте loop.",
    syntax: "loop.create_task(coro, *, name=None, context=None)",
    arguments: [
      {
        name: "coro",
        description: "Корутина для выполнения в виде Task.",
      },
      {
        name: "name",
        description:
          "Необязательное имя задачи для отладки. Доступно через task.get_name().",
      },
      {
        name: "context",
        description:
          "Объект contextvars.Context для выполнения задачи. Если None — копируется текущий контекст.",
      },
    ],
    example: `import asyncio

async def background_job(name: str, delay: float):
    await asyncio.sleep(delay)
    print(f'Задача {name} завершена')

async def main():
    loop = asyncio.get_event_loop()

    t1 = loop.create_task(background_job('А', 1.0), name='job-A')
    t2 = loop.create_task(background_job('Б', 0.5), name='job-B')

    print(f'Задача: {t1.get_name()}')  # job-A
    await asyncio.gather(t1, t2)

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.call_soon()",
    description:
      "Планирует вызов callback-функции в следующей итерации event loop. Не является корутиной — callback вызывается синхронно, без await. Возвращает объект asyncio.Handle, позволяющий отменить запланированный вызов.",
    syntax: "loop.call_soon(callback, *args, context=None)",
    arguments: [
      {
        name: "callback",
        description: "Обычная (не async) функция для вызова.",
      },
      {
        name: "*args",
        description:
          "Позиционные аргументы, передаваемые в callback при вызове.",
      },
      {
        name: "context",
        description:
          "Объект contextvars.Context для выполнения callback. Если None — используется текущий контекст.",
      },
    ],
    example: `import asyncio

def on_event(message: str, count: int):
    print(f'Событие #{count}: {message}')

async def main():
    loop = asyncio.get_event_loop()

    # Планируем вызовы на следующую итерацию loop
    loop.call_soon(on_event, 'первый', 1)
    loop.call_soon(on_event, 'второй', 2)

    handle = loop.call_soon(on_event, 'третий', 3)
    handle.cancel()  # отменяем третий вызов

    await asyncio.sleep(0)  # даём loop выполнить запланированные вызовы

asyncio.run(main())
# Событие #1: первый
# Событие #2: второй`,
  },
  {
    name: "asyncio.loop.call_later()",
    description:
      "Планирует вызов callback-функции через указанное количество секунд. Возвращает asyncio.TimerHandle для возможной отмены. Использует относительное время (задержку), в отличие от call_at(), который использует абсолютное время.",
    syntax: "loop.call_later(delay, callback, *args, context=None)",
    arguments: [
      {
        name: "delay",
        description:
          "Задержка в секундах (число с плавающей точкой) до вызова callback.",
      },
      {
        name: "callback",
        description:
          "Обычная (не async) функция для вызова после истечения задержки.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы, передаваемые в callback.",
      },
    ],
    example: `import asyncio

def reminder(text: str):
    print(f'Напоминание: {text}')

async def main():
    loop = asyncio.get_event_loop()

    loop.call_later(1.0, reminder, 'через 1 секунду')
    loop.call_later(2.0, reminder, 'через 2 секунды')

    handle = loop.call_later(3.0, reminder, 'через 3 секунды')
    handle.cancel()  # отменяем третье напоминание

    await asyncio.sleep(2.5)  # ждём выполнения первых двух

asyncio.run(main())
# Напоминание: через 1 секунду
# Напоминание: через 2 секунды`,
  },
  {
    name: "asyncio.loop.call_at()",
    description:
      "Планирует вызов callback-функции в указанный абсолютный момент времени по внутренним часам event loop (loop.time()). Возвращает asyncio.TimerHandle. Используется когда нужна точная привязка к абсолютному времени loop, а не относительная задержка.",
    syntax: "loop.call_at(when, callback, *args, context=None)",
    arguments: [
      {
        name: "when",
        description:
          "Абсолютное время вызова в единицах loop.time(). Если указанный момент уже прошёл — callback будет вызван немедленно.",
      },
      {
        name: "callback",
        description:
          "Обычная (не async) функция для вызова в указанный момент.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы, передаваемые в callback.",
      },
    ],
    example: `import asyncio

def tick(label: str):
    print(f'Тик: {label}')

async def main():
    loop = asyncio.get_event_loop()
    now = loop.time()

    # Планируем по абсолютному времени
    loop.call_at(now + 1.0, tick, 'T+1с')
    loop.call_at(now + 2.0, tick, 'T+2с')
    loop.call_at(now + 1.5, tick, 'T+1.5с')

    await asyncio.sleep(2.5)

asyncio.run(main())
# Тик: T+1с
# Тик: T+1.5с
# Тик: T+2с`,
  },
  {
    name: "asyncio.loop.time()",
    description:
      "Возвращает текущее время по внутренним монотонным часам event loop в виде числа с плавающей точкой (секунды). Монотонные часы гарантируют, что время всегда увеличивается, даже при изменении системных часов. Используется совместно с call_at() для планирования задач.",
    syntax: "loop.time()",
    arguments: [],
    example: `import asyncio

async def measure_time():
    loop = asyncio.get_event_loop()

    start = loop.time()
    print(f'Начало: {start:.4f}')

    await asyncio.sleep(0.5)

    elapsed = loop.time() - start
    print(f'Прошло: {elapsed:.4f} сек')  # ~0.5

    # Планируем вызов через 1 секунду от текущего момента
    loop.call_at(loop.time() + 1.0, print, 'Запланированный вызов')

    await asyncio.sleep(1.1)

asyncio.run(measure_time())`,
  },
  {
    name: "asyncio.loop.create_connection()",
    description:
      "Корутина, устанавливающая исходящее TCP-соединение и возвращающая пару (transport, protocol). Является низкоуровневым API — требует реализации класса протокола (asyncio.Protocol). Для большинства задач предпочтительнее использовать высокоуровневый asyncio.open_connection().",
    syntax:
      "await loop.create_connection(protocol_factory, host=None, port=None, *, ssl=None, sock=None, **kwds)",
    arguments: [
      {
        name: "protocol_factory",
        description:
          "Вызываемый объект без аргументов, возвращающий экземпляр asyncio.Protocol. Вызывается при установке соединения.",
      },
      {
        name: "host",
        description: "Хост для подключения: IP-адрес или доменное имя.",
      },
      {
        name: "port",
        description: "Порт для подключения.",
      },
      {
        name: "ssl",
        description:
          "Объект ssl.SSLContext для TLS-соединения, True для стандартного контекста, или None для незащищённого соединения.",
      },
    ],
    example: `import asyncio

class EchoClientProtocol(asyncio.Protocol):
    def __init__(self, message: str, on_con_lost):
        self.message = message
        self.on_con_lost = on_con_lost

    def connection_made(self, transport):
        transport.write(self.message.encode())
        print(f'Отправлено: {self.message}')

    def data_received(self, data: bytes):
        print(f'Получено: {data.decode()}')

    def connection_lost(self, exc):
        self.on_con_lost.set_result(True)

async def main():
    loop = asyncio.get_event_loop()
    on_con_lost = loop.create_future()

    transport, protocol = await loop.create_connection(
        lambda: EchoClientProtocol('Привет!', on_con_lost),
        '127.0.0.1', 8888
    )
    await on_con_lost
    transport.close()

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.create_server()",
    description:
      "Корутина, создающая TCP-сервер и возвращающая объект asyncio.Server. Является низкоуровневым API — требует реализации класса протокола. Для большинства задач предпочтительнее использовать высокоуровневый asyncio.start_server().",
    syntax:
      "await loop.create_server(protocol_factory, host=None, port=None, *, ssl=None, reuse_address=None, reuse_port=None, **kwds)",
    arguments: [
      {
        name: "protocol_factory",
        description:
          "Вызываемый объект без аргументов, возвращающий экземпляр asyncio.Protocol. Вызывается при каждом новом подключении.",
      },
      {
        name: "host",
        description:
          "Хост для прослушивания. None — слушать на всех интерфейсах.",
      },
      {
        name: "port",
        description: "Порт для прослушивания.",
      },
      {
        name: "reuse_port",
        description:
          "Если True — несколько процессов могут слушать на одном порту (SO_REUSEPORT). Полезно для балансировки нагрузки.",
      },
    ],
    example: `import asyncio

class EchoServerProtocol(asyncio.Protocol):
    def connection_made(self, transport):
        peername = transport.get_extra_info('peername')
        print(f'Подключение от {peername}')
        self.transport = transport

    def data_received(self, data: bytes):
        message = data.decode()
        print(f'Получено: {message}')
        self.transport.write(data)  # эхо

    def connection_lost(self, exc):
        print('Соединение закрыто')

async def main():
    loop = asyncio.get_event_loop()
    server = await loop.create_server(
        EchoServerProtocol,
        '127.0.0.1', 8888
    )
    async with server:
        print('Сервер запущен')
        await server.serve_forever()

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.getaddrinfo()",
    description:
      "Корутина, выполняющая асинхронное DNS-разрешение имени хоста. Возвращает список кортежей с информацией об адресах (family, type, proto, canonname, sockaddr). Является асинхронной оберткой над socket.getaddrinfo().",
    syntax:
      "await loop.getaddrinfo(host, port, *, family=0, type=0, proto=0, flags=0)",
    arguments: [
      {
        name: "host",
        description: "Имя хоста или IP-адрес для разрешения.",
      },
      {
        name: "port",
        description: 'Номер порта или имя сервиса (например, "http", "ftp").',
      },
      {
        name: "family",
        description:
          "Семейство адресов: socket.AF_INET (IPv4), socket.AF_INET6 (IPv6) или 0 (любое).",
      },
      {
        name: "type",
        description:
          "Тип сокета: socket.SOCK_STREAM (TCP), socket.SOCK_DGRAM (UDP) или 0 (любой).",
      },
    ],
    example: `import asyncio
import socket

async def resolve(hostname: str, port: int):
    loop = asyncio.get_event_loop()

    infos = await loop.getaddrinfo(
        hostname, port,
        family=socket.AF_UNSPEC,
        type=socket.SOCK_STREAM,
    )

    for family, type_, proto, canonname, sockaddr in infos:
        fam_name = 'IPv4' if family == socket.AF_INET else 'IPv6'
        print(f'{fam_name}: {sockaddr[0]}:{sockaddr[1]}')

asyncio.run(resolve('example.com', 80))`,
  },
  {
    name: "asyncio.loop.getnameinfo()",
    description:
      "Корутина, выполняющая обратное DNS-разрешение: преобразует числовой адрес сокета в имя хоста и имя сервиса. Возвращает кортеж (hostname, service). Является асинхронной оберткой над socket.getnameinfo().",
    syntax: "await loop.getnameinfo(sockaddr, flags=0)",
    arguments: [
      {
        name: "sockaddr",
        description:
          "Кортеж (host, port) для IPv4 или (host, port, flowinfo, scope_id) для IPv6.",
      },
      {
        name: "flags",
        description:
          "Флаги из модуля socket (например, socket.NI_NUMERICHOST, socket.NI_NAMEREQD), управляющие поведением разрешения.",
      },
    ],
    example: `import asyncio
import socket

async def reverse_lookup(ip: str, port: int):
    loop = asyncio.get_event_loop()

    try:
        hostname, service = await loop.getnameinfo(
            (ip, port),
            socket.NI_NUMERICSERV  # вернуть порт как число, не как имя
        )
        print(f'IP: {ip} → Хост: {hostname}')
        print(f'Порт: {port} → Сервис: {service}')
    except socket.gaierror as e:
        print(f'Ошибка разрешения: {e}')

asyncio.run(reverse_lookup('8.8.8.8', 53))`,
  },
  {
    name: "asyncio.loop.add_reader()",
    description:
      "Регистрирует callback для вызова, когда файловый дескриптор fd становится доступен для чтения. Является низкоуровневым способом интеграции обычных сокетов или файлов с event loop без использования async/await.",
    syntax: "loop.add_reader(fd, callback, *args)",
    arguments: [
      {
        name: "fd",
        description:
          "Файловый дескриптор (целое число) или объект с методом fileno(), например socket.socket.",
      },
      {
        name: "callback",
        description:
          "Обычная (не async) функция, вызываемая когда fd готов к чтению.",
      },
      {
        name: "*args",
        description:
          "Позиционные аргументы, передаваемые в callback при вызове.",
      },
    ],
    example: `import asyncio
import socket

def on_readable(sock: socket.socket, future: asyncio.Future):
    data = sock.recv(1024)
    if not future.done():
        future.set_result(data)

async def read_from_socket(sock: socket.socket) -> bytes:
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    loop.add_reader(sock.fileno(), on_readable, sock, future)
    try:
        return await future
    finally:
        loop.remove_reader(sock.fileno())

async def main():
    # Создаём обычный неблокирующий сокет
    sock = socket.socket()
    sock.setblocking(False)
    sock.connect_ex(('127.0.0.1', 8888))

    data = await read_from_socket(sock)
    print(f'Получено: {data.decode()}')
    sock.close()

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.remove_reader()",
    description:
      "Отменяет регистрацию callback для чтения с файлового дескриптора, ранее зарегистрированного через add_reader(). Возвращает True, если callback был успешно удалён, и False если дескриптор не был зарегистрирован.",
    syntax: "loop.remove_reader(fd)",
    arguments: [
      {
        name: "fd",
        description:
          "Файловый дескриптор (целое число) или объект с методом fileno(), регистрация которого должна быть отменена.",
      },
    ],
    example: `import asyncio
import socket

async def main():
    loop = asyncio.get_event_loop()
    sock = socket.socket()
    sock.setblocking(False)
    fd = sock.fileno()

    def on_data():
        print('Данные доступны')

    loop.add_reader(fd, on_data)
    print('Обработчик зарегистрирован')

    await asyncio.sleep(0.1)

    removed = loop.remove_reader(fd)
    print(f'Обработчик удалён: {removed}')  # True

    # Повторное удаление вернёт False
    removed_again = loop.remove_reader(fd)
    print(f'Повторное удаление: {removed_again}')  # False

    sock.close()

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.add_writer()",
    description:
      "Регистрирует callback для вызова, когда файловый дескриптор fd становится доступен для записи. Используется для низкоуровневой неблокирующей записи в сокеты и другие файловые объекты без async/await.",
    syntax: "loop.add_writer(fd, callback, *args)",
    arguments: [
      {
        name: "fd",
        description:
          "Файловый дескриптор (целое число) или объект с методом fileno().",
      },
      {
        name: "callback",
        description:
          "Обычная (не async) функция, вызываемая когда fd готов к записи.",
      },
      {
        name: "*args",
        description: "Позиционные аргументы, передаваемые в callback.",
      },
    ],
    example: `import asyncio
import socket

def on_writable(sock: socket.socket, data: bytes, future: asyncio.Future, loop):
    try:
        sent = sock.send(data)
        if not future.done():
            future.set_result(sent)
    except BlockingIOError:
        pass  # ещё не готов, попробуем снова
    finally:
        loop.remove_writer(sock.fileno())

async def send_to_socket(sock: socket.socket, data: bytes) -> int:
    loop = asyncio.get_event_loop()
    future = loop.create_future()
    loop.add_writer(sock.fileno(), on_writable, sock, data, future, loop)
    return await future

async def main():
    sock = socket.socket()
    sock.setblocking(False)
    sock.connect_ex(('127.0.0.1', 8888))

    sent = await send_to_socket(sock, b'Привет!\\n')
    print(f'Отправлено {sent} байт')
    sock.close()

asyncio.run(main())`,
  },
  {
    name: "asyncio.loop.remove_writer()",
    description:
      "Отменяет регистрацию callback для записи в файловый дескриптор, ранее зарегистрированного через add_writer(). Возвращает True при успешном удалении и False если дескриптор не был зарегистрирован.",
    syntax: "loop.remove_writer(fd)",
    arguments: [
      {
        name: "fd",
        description:
          "Файловый дескриптор (целое число) или объект с методом fileno(), регистрация которого должна быть отменена.",
      },
    ],
    example: `import asyncio
import socket

async def main():
    loop = asyncio.get_event_loop()
    sock = socket.socket()
    sock.setblocking(False)
    fd = sock.fileno()

    def on_write():
        print('Готов к записи')

    loop.add_writer(fd, on_write)
    print('Обработчик записи зарегистрирован')

    await asyncio.sleep(0.1)

    removed = loop.remove_writer(fd)
    print(f'Удалён: {removed}')        # True

    removed_again = loop.remove_writer(fd)
    print(f'Повторно: {removed_again}') # False

    sock.close()

asyncio.run(main())`,
  },
  {
    name: "asyncio.CancelledError",
    description:
      "Исключение, выбрасываемое в корутине или Task при отмене через task.cancel(). Наследуется от BaseException (не Exception), поэтому не перехватывается голым except Exception. Может быть поймано для выполнения очистки ресурсов, но должно быть повторно поднято или корутина должна завершиться.",
    syntax: "raise asyncio.CancelledError",
    arguments: [],
    example: `import asyncio

async def cancellable_task():
    try:
        print('Задача запущена')
        await asyncio.sleep(10)  # долгая операция
        print('Задача завершена')
    except asyncio.CancelledError:
        print('Задача отменена! Выполняем очистку...')
        # Освобождаем ресурсы, закрываем соединения...
        raise  # обязательно повторно поднимаем

async def main():
    task = asyncio.create_task(cancellable_task())
    await asyncio.sleep(0.5)

    print('Отменяем задачу...')
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print(f'Задача отменена: {task.cancelled()}')  # True

asyncio.run(main())`,
  },
  {
    name: "asyncio.InvalidStateError",
    description:
      "Исключение, выбрасываемое при попытке выполнить недопустимую операцию над объектом Future или Task в его текущем состоянии. Например: вызов set_result() на уже завершённой Future, или вызов result() на ещё не завершённой Future.",
    syntax: "raise asyncio.InvalidStateError",
    arguments: [],
    example: `import asyncio

async def main():
    loop = asyncio.get_event_loop()
    future = loop.create_future()

    # Корректная установка результата
    future.set_result(42)
    print(f'Результат: {future.result()}')  # 42

    # Попытка установить результат повторно — ошибка
    try:
        future.set_result(99)
    except asyncio.InvalidStateError as e:
        print(f'InvalidStateError: {e}')

    # Попытка получить результат незавершённой Future
    pending = loop.create_future()
    try:
        pending.result()
    except asyncio.InvalidStateError as e:
        print(f'Future ещё не завершена: {e}')

asyncio.run(main())`,
  },
  {
    name: "asyncio.TimeoutError",
    description:
      "Исключение, выбрасываемое при истечении тайм-аута в asyncio.wait_for() или asyncio.timeout(). Наследуется от TimeoutError (встроенного). Сигнализирует о том, что операция не завершилась в отведённое время.",
    syntax: "raise asyncio.TimeoutError",
    arguments: [],
    example: `import asyncio

async def slow_operation() -> str:
    await asyncio.sleep(5)
    return 'результат'

async def main():
    # С wait_for
    try:
        result = await asyncio.wait_for(slow_operation(), timeout=1.0)
    except asyncio.TimeoutError:
        print('wait_for: тайм-аут истёк')

    # С asyncio.timeout (Python 3.11+)
    try:
        async with asyncio.timeout(1.0):
            result = await slow_operation()
    except asyncio.TimeoutError:
        print('timeout: тайм-аут истёк')

    # Проверка типа — совместимость с TimeoutError
    err = asyncio.TimeoutError()
    print(isinstance(err, TimeoutError))  # True

asyncio.run(main())`,
  },
  {
    name: "asyncio.IncompleteReadError",
    description:
      "Исключение, выбрасываемое StreamReader.readexactly(), когда соединение закрыто раньше, чем было прочитано запрошенное количество байт. Содержит атрибут partial с байтами, которые были прочитаны до закрытия соединения.",
    syntax: "asyncio.IncompleteReadError(partial, expected)",
    arguments: [
      {
        name: "partial",
        description:
          "Атрибут bytes, содержащий частично прочитанные данные до момента закрытия соединения.",
      },
      {
        name: "expected",
        description:
          "Атрибут int или None — ожидаемое количество байт, которое не удалось прочитать.",
      },
    ],
    example: `import asyncio

async def read_fixed_block(reader: asyncio.StreamReader, size: int):
    try:
        data = await reader.readexactly(size)
        return data
    except asyncio.IncompleteReadError as e:
        print(f'Ожидалось {e.expected} байт')
        print(f'Получено только {len(e.partial)} байт: {e.partial}')
        # Решаем, что делать с частичными данными
        if len(e.partial) > 0:
            return e.partial  # используем что есть
        return b''

async def main():
    # Имитируем обрыв соединения
    reader = asyncio.StreamReader()
    reader.feed_data(b'Hello')  # только 5 байт
    reader.feed_eof()           # соединение закрыто

    result = await read_fixed_block(reader, 100)
    print(f'Итог: {result}')

asyncio.run(main())`,
  },
  {
    name: "asyncio.LimitOverrunError",
    description:
      "Исключение, выбрасываемое StreamReader.readuntil(), когда размер накопленных в буфере данных превышает установленный лимит (параметр limit в open_connection/start_server) без обнаружения разделителя. Атрибут consumed содержит количество байт, находящихся в буфере.",
    syntax: "asyncio.LimitOverrunError(message, consumed)",
    arguments: [
      {
        name: "message",
        description: "Строка с описанием ошибки.",
      },
      {
        name: "consumed",
        description:
          "Атрибут int — количество байт в буфере на момент возникновения ошибки.",
      },
    ],
    example: `import asyncio

async def safe_readline(reader: asyncio.StreamReader) -> bytes | None:
    try:
        line = await reader.readuntil(b'\\n')
        return line
    except asyncio.LimitOverrunError as e:
        print(f'Строка слишком длинная: {e.consumed} байт в буфере')
        # Сбрасываем буфер — читаем и отбрасываем данные
        await reader.read(e.consumed)
        return None

async def main():
    # Лимит буфера — 10 байт
    reader = asyncio.StreamReader(limit=10)
    reader.feed_data(b'Эта строка намного длиннее лимита буфера!')
    reader.feed_eof()

    result = await safe_readline(reader)
    if result is None:
        print('Строка отброшена из-за превышения лимита')

asyncio.run(main())`,
  },
  {
    name: "asyncio.QueueEmpty",
    description:
      "Исключение, выбрасываемое asyncio.Queue.get_nowait(), когда очередь пуста в момент вызова. Является неблокирующей альтернативой await queue.get() — вместо ожидания немедленно сигнализирует об отсутствии элементов.",
    syntax: "asyncio.QueueEmpty",
    arguments: [],
    example: `import asyncio

async def main():
    queue: asyncio.Queue[int] = asyncio.Queue()

    # Добавляем один элемент
    await queue.put(42)

    # Успешное получение
    item = queue.get_nowait()
    print(f'Получено: {item}')  # 42

    # Попытка получить из пустой очереди
    try:
        item = queue.get_nowait()
    except asyncio.QueueEmpty:
        print('QueueEmpty: очередь пуста')

    # Безопасный паттерн — проверка перед get_nowait
    if not queue.empty():
        item = queue.get_nowait()
    else:
        print('Очередь пуста, пропускаем')

asyncio.run(main())`,
  },
  {
    name: "asyncio.QueueFull",
    description:
      "Исключение, выбрасываемое asyncio.Queue.put_nowait(), когда очередь заполнена (достигнут maxsize) в момент вызова. Является неблокирующей альтернативой await queue.put() — вместо ожидания немедленно сигнализирует о переполнении.",
    syntax: "asyncio.QueueFull",
    arguments: [],
    example: `import asyncio

async def main():
    # Очередь максимум на 2 элемента
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=2)

    queue.put_nowait('первый')
    queue.put_nowait('второй')
    print(f'Размер: {queue.qsize()}')  # 2

    # Попытка добавить в заполненную очередь
    try:
        queue.put_nowait('третий')
    except asyncio.QueueFull:
        print('QueueFull: очередь заполнена')

    # Безопасный паттерн — проверка перед put_nowait
    if not queue.full():
        queue.put_nowait('элемент')
    else:
        print('Нет места, используем await put() или отбрасываем')

asyncio.run(main())`,
  },
  {
    name: "logging.basicConfig()",
    description:
      "Выполняет базовую настройку системы логирования: создаёт обработчик (StreamHandler или FileHandler), задаёт форматтер и уровень логирования для корневого логгера. Вызов имеет эффект только если корневой логгер не имеет настроенных обработчиков. Повторные вызовы игнорируются, если не передан force=True.",
    syntax: "logging.basicConfig(**kwargs)",
    arguments: [
      {
        name: "level",
        description:
          "Уровень логирования для корневого логгера: logging.DEBUG, INFO, WARNING, ERROR, CRITICAL или целое число.",
      },
      {
        name: "format",
        description:
          'Строка формата сообщений. По умолчанию "%(levelname)s:%(name)s:%(message)s".',
      },
      {
        name: "datefmt",
        description: "Формат даты/времени, совместимый с time.strftime().",
      },
      {
        name: "filename",
        description:
          "Если указан — создаётся FileHandler для записи в файл вместо StreamHandler.",
      },
      {
        name: "filemode",
        description:
          'Режим открытия файла: "a" (дозапись, по умолчанию) или "w" (перезапись).',
      },
      {
        name: "handlers",
        description:
          "Итерируемый набор готовых обработчиков для добавления к корневому логгеру.",
      },
      {
        name: "force",
        description:
          "Если True — удаляет существующие обработчики корневого логгера перед применением настроек.",
      },
      {
        name: "encoding",
        description:
          "Кодировка файла (используется вместе с filename, Python 3.9+).",
      },
    ],
    example: `import logging

# Простейшая настройка — вывод в консоль
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

logging.debug('Отладка')
logging.info('Информация')
logging.warning('Предупреждение')

# Запись в файл
logging.basicConfig(
    filename='app.log',
    filemode='w',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    force=True,  # перезаписать существующие настройки
)

logging.info('Это запишется в файл app.log')`,
  },
  {
    name: "logging.captureWarnings()",
    description:
      'Включает или отключает перехват предупреждений модуля warnings через систему логирования. При capture=True предупреждения (warnings.warn()) направляются в логгер "py.warnings" с уровнем WARNING вместо стандартного вывода. Полезно для централизованной обработки всех предупреждений.',
    syntax: "logging.captureWarnings(capture)",
    arguments: [
      {
        name: "capture",
        description:
          "True — включить перехват предупреждений; False — отключить и вернуть стандартное поведение.",
      },
    ],
    example: `import logging
import warnings

logging.basicConfig(level=logging.DEBUG, format='%(name)s: %(message)s')

# Включаем перехват warnings
logging.captureWarnings(True)

# Это предупреждение теперь пройдёт через логгер 'py.warnings'
warnings.warn('Устаревший API', DeprecationWarning)
# py.warnings: ...: DeprecationWarning: Устаревший API

# Отключаем перехват — warnings снова идут в stderr
logging.captureWarnings(False)
warnings.warn('Это снова в stderr', UserWarning)`,
  },
  {
    name: "logging.critical()",
    description:
      "Записывает сообщение с уровнем CRITICAL (50) в корневой логгер. Используется для критических ошибок, после которых программа не может продолжать работу. Является сокращением для logging.getLogger().critical().",
    syntax: "logging.critical(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Сообщение для логирования. Может содержать спецификаторы формата (например, %s, %d), которые применяются к args.",
      },
      {
        name: "*args",
        description:
          "Аргументы для форматирования строки msg через оператор %.",
      },
      {
        name: "exc_info",
        description:
          "Если True или экземпляр исключения — добавляет трассировку текущего исключения к сообщению.",
      },
      {
        name: "stack_info",
        description:
          "Если True — добавляет информацию о текущем стеке вызовов.",
      },
      {
        name: "extra",
        description:
          "Словарь с дополнительными полями для добавления в LogRecord.",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

# Простое сообщение
logging.critical('Критическая ошибка: сервер недоступен')

# С форматированием
code = 500
logging.critical('HTTP %d: внутренняя ошибка сервера', code)

# С трассировкой исключения
try:
    result = 1 / 0
except ZeroDivisionError:
    logging.critical('Деление на ноль!', exc_info=True)

# Вывод:
# CRITICAL: Критическая ошибка: сервер недоступен
# CRITICAL: HTTP 500: внутренняя ошибка сервера
# CRITICAL: Деление на ноль!
# Traceback (most recent call last): ...`,
  },
  {
    name: "logging.debug()",
    description:
      "Записывает сообщение с уровнем DEBUG (10) в корневой логгер. Используется для детальной отладочной информации, которая обычно отключена в production. Сообщение выводится только если уровень корневого логгера ≤ DEBUG.",
    syntax: "logging.debug(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Сообщение для логирования. Может содержать спецификаторы %s, %d и т.д.",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description: "Если True — добавляет информацию о текущем исключении.",
      },
      {
        name: "stack_info",
        description: "Если True — добавляет трассировку текущего стека.",
      },
      {
        name: "extra",
        description: "Дополнительные поля для LogRecord в виде словаря.",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

def process_item(item_id: int, value: float):
    logging.debug('Обработка элемента %d, значение=%.2f', item_id, value)
    result = value * 2
    logging.debug('Результат для %d: %.2f', item_id, result)
    return result

items = [(1, 3.14), (2, 2.71), (3, 1.41)]
for item_id, value in items:
    process_item(item_id, value)

# DEBUG: Обработка элемента 1, значение=3.14
# DEBUG: Результат для 1: 6.28
# DEBUG: Обработка элемента 2, значение=2.71
# ...`,
  },
  {
    name: "logging.disable()",
    description:
      "Устанавливает глобальный порог отключения: все сообщения с уровнем ≤ указанному игнорируются во всех логгерах, независимо от их настроек. Вызов logging.disable(logging.NOTSET) снимает ограничение. Полезно для временного отключения логирования в тестах или production.",
    syntax: "logging.disable(level=logging.CRITICAL)",
    arguments: [
      {
        name: "level",
        description:
          "Уровень отключения. Сообщения с уровнем ≤ этому значению игнорируются. По умолчанию logging.CRITICAL (отключает всё).",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

logging.info('Это будет выведено')

# Отключаем все сообщения уровня INFO и ниже
logging.disable(logging.INFO)
logging.debug('Это НЕ будет выведено')  # DEBUG < INFO — игнорируется
logging.info('Это НЕ будет выведено')   # INFO ≤ INFO — игнорируется
logging.warning('WARNING появится')     # WARNING > INFO — проходит

# Полное отключение логирования
logging.disable(logging.CRITICAL)
logging.critical('Это тоже НЕ выведется')

# Снятие ограничения
logging.disable(logging.NOTSET)
logging.info('Снова работает')`,
  },
  {
    name: "logging.error()",
    description:
      "Записывает сообщение с уровнем ERROR (40) в корневой логгер. Используется для ошибок, которые нарушают выполнение конкретной операции, но не останавливают программу. Является сокращением для logging.getLogger().error().",
    syntax: "logging.error(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Сообщение для логирования с опциональными спецификаторами формата.",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description:
          "Если True — добавляет трассировку текущего исключения к сообщению.",
      },
      {
        name: "stack_info",
        description:
          "Если True — добавляет трассировку текущего стека вызовов.",
      },
      { name: "extra", description: "Дополнительные поля для LogRecord." },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

def load_config(path: str) -> dict:
    try:
        with open(path) as f:
            import json
            return json.load(f)
    except FileNotFoundError:
        logging.error('Файл конфигурации не найден: %s', path)
        return {}
    except Exception as e:
        logging.error('Ошибка загрузки конфига %s: %s', path, e, exc_info=True)
        return {}

config = load_config('config.json')
# ERROR: Файл конфигурации не найден: config.json`,
  },
  {
    name: "logging.exception()",
    description:
      "Записывает сообщение с уровнем ERROR и автоматически добавляет трассировку текущего исключения (exc_info=True). Должна вызываться только внутри блока except. Является удобным сокращением для logging.error(msg, exc_info=True).",
    syntax: "logging.exception(msg, *args, exc_info=True, **kwargs)",
    arguments: [
      {
        name: "msg",
        description: "Сообщение для логирования (описание контекста ошибки).",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description:
          "По умолчанию True — всегда включает трассировку исключения. Отличает exception() от error().",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

def parse_number(s: str) -> float:
    try:
        return float(s)
    except ValueError:
        logging.exception('Не удалось преобразовать "%s" в число', s)
        return 0.0

def fetch_data(url: str):
    try:
        # имитация ошибки соединения
        raise ConnectionError(f'Хост недоступен: {url}')
    except ConnectionError:
        logging.exception('Ошибка при запросе к %s', url)
        return None

parse_number('не_число')
# ERROR: Не удалось преобразовать "не_число" в число
# Traceback (most recent call last): ...
# ValueError: could not convert string to float`,
  },
  {
    name: "logging.fatal()",
    description:
      "Псевдоним для logging.critical(). Записывает сообщение с уровнем CRITICAL (50) в корневой логгер. Существует для совместимости с другими языками и фреймворками. В Python рекомендуется использовать logging.critical() как более идиоматичный вариант.",
    syntax: "logging.fatal(msg, *args, **kwargs)",
    arguments: [
      { name: "msg", description: "Сообщение для логирования." },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

# fatal() и critical() полностью эквивалентны
logging.fatal('Критический сбой базы данных')
logging.critical('Критический сбой базы данных')

# Оба выводят:
# CRITICAL: Критический сбой базы данных

# Проверка — это один и тот же метод
import logging as lg
print(lg.fatal is lg.critical)  # True`,
  },
  {
    name: "logging.getLevelName()",
    description:
      'Возвращает текстовое имя уровня по числовому значению, или числовое значение по имени. Если передать неизвестный уровень — возвращает строку "Level %s". Начиная с Python 3.4 для получения числового значения по имени лучше использовать logging.getLevelNamesMapping().',
    syntax: "logging.getLevelName(level)",
    arguments: [
      {
        name: "level",
        description:
          "Целое число (уровень логирования) → возвращает строку-имя. Строка (имя уровня) → возвращает целое число.",
      },
    ],
    example: `import logging

# Число → имя
print(logging.getLevelName(10))   # DEBUG
print(logging.getLevelName(20))   # INFO
print(logging.getLevelName(30))   # WARNING
print(logging.getLevelName(40))   # ERROR
print(logging.getLevelName(50))   # CRITICAL

# Имя → число
print(logging.getLevelName('DEBUG'))    # 10
print(logging.getLevelName('WARNING'))  # 30

# Неизвестный уровень
print(logging.getLevelName(99))         # Level 99
print(logging.getLevelName('VERBOSE'))  # Level VERBOSE

# Добавление пользовательского уровня
logging.addLevelName(15, 'VERBOSE')
print(logging.getLevelName(15))         # VERBOSE
print(logging.getLevelName('VERBOSE'))  # 15`,
  },
  {
    name: "logging.getLogger()",
    description:
      'Возвращает логгер с указанным именем. Если логгер с таким именем уже существует — возвращает тот же объект (логгеры кешируются). Имена образуют иерархию через точку: "app.db" является дочерним для "app". Если name=None или не передан — возвращает корневой логгер.',
    syntax: "logging.getLogger(name=None)",
    arguments: [
      {
        name: "name",
        description:
          'Имя логгера. Принято использовать __name__ для привязки к модулю. Иерархия задаётся точками: "myapp.models.user".',
      },
    ],
    example: `import logging

# Корневой логгер
root = logging.getLogger()
root.setLevel(logging.WARNING)

# Логгер для модуля (стандартная практика)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Иерархия: дочерний логгер наследует настройки родителя
app_logger = logging.getLogger('myapp')
db_logger = logging.getLogger('myapp.db')    # дочерний к myapp
api_logger = logging.getLogger('myapp.api')  # дочерний к myapp

# Один и тот же объект — логгеры кешируются
logger_a = logging.getLogger('myapp')
logger_b = logging.getLogger('myapp')
print(logger_a is logger_b)  # True

db_logger.debug('SQL-запрос выполнен')`,
  },
  {
    name: "logging.getLoggerClass()",
    description:
      "Возвращает текущий класс, используемый для создания новых логгеров. По умолчанию возвращает logging.Logger. Используется для проверки текущего класса перед установкой нового через logging.setLoggerClass().",
    syntax: "logging.getLoggerClass()",
    arguments: [],
    example: `import logging

# Получаем текущий класс логгеров
current_class = logging.getLoggerClass()
print(current_class)  # <class 'logging.Logger'>

# Создаём кастомный класс логгера
class AppLogger(logging.Logger):
    def success(self, msg, *args, **kwargs):
        """Дополнительный уровень SUCCESS"""
        if self.isEnabledFor(25):
            self._log(25, msg, args, **kwargs)

# Регистрируем и проверяем
logging.addLevelName(25, 'SUCCESS')
logging.setLoggerClass(AppLogger)

print(logging.getLoggerClass())  # <class '__main__.AppLogger'>

# Новые логгеры теперь экземпляры AppLogger
logger = logging.getLogger('myapp')
print(type(logger))  # <class '__main__.AppLogger'>`,
  },
  {
    name: "logging.getLogRecordFactory()",
    description:
      "Возвращает текущую фабрику для создания объектов LogRecord. По умолчанию возвращает класс logging.LogRecord. Используется для проверки текущей фабрики перед её заменой через logging.setLogRecordFactory().",
    syntax: "logging.getLogRecordFactory()",
    arguments: [],
    example: `import logging

# Получаем текущую фабрику
factory = logging.getLogRecordFactory()
print(factory)  # <class 'logging.LogRecord'>

# Создаём кастомную фабрику с дополнительными полями
old_factory = logging.getLogRecordFactory()

def custom_factory(*args, **kwargs):
    record = old_factory(*args, **kwargs)
    record.app_version = '1.2.3'
    record.environment = 'production'
    return record

logging.setLogRecordFactory(custom_factory)

# Проверяем что фабрика изменилась
print(logging.getLogRecordFactory())  # <function custom_factory at ...>

logging.basicConfig(
    format='%(levelname)s [v%(app_version)s] %(env)s: %(message)s',
    level=logging.INFO,
)
logging.info('Сервер запущен')`,
  },
  {
    name: "logging.info()",
    description:
      "Записывает сообщение с уровнем INFO (20) в корневой логгер. Используется для информационных сообщений о нормальном ходе выполнения программы: запуск/остановка сервисов, обработка запросов, ключевые события. Является сокращением для logging.getLogger().info().",
    syntax: "logging.info(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Информационное сообщение с опциональными спецификаторами формата.",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      {
        name: "extra",
        description: "Словарь с дополнительными полями для LogRecord.",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

def start_server(host: str, port: int):
    logging.info('Запуск сервера на %s:%d', host, port)

def process_request(method: str, path: str, status: int):
    logging.info('%s %s → %d', method, path, status)

def shutdown():
    logging.info('Сервер остановлен. Соединений обработано: %d', 42)

start_server('0.0.0.0', 8080)
process_request('GET', '/api/users', 200)
process_request('POST', '/api/orders', 201)
shutdown()
# 2024-01-15 12:00:00 INFO: Запуск сервера на 0.0.0.0:8080
# 2024-01-15 12:00:01 INFO: GET /api/users → 200`,
  },
  {
    name: "logging.log()",
    description:
      "Записывает сообщение с произвольным числовым уровнем в корневой логгер. Используется когда уровень задаётся динамически (из конфигурации или переменной), а не одним из стандартных. Является обобщением методов debug(), info(), warning() и т.д.",
    syntax: "logging.log(level, msg, *args, **kwargs)",
    arguments: [
      {
        name: "level",
        description:
          "Числовой уровень логирования (например, logging.DEBUG, logging.INFO или произвольное целое число).",
      },
      {
        name: "msg",
        description:
          "Сообщение для логирования с опциональными спецификаторами формата.",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

# Динамический уровень из конфига
config_level = 'WARNING'
level = logging.getLevelName(config_level)
logging.log(level, 'Уровень задан из конфигурации: %s', config_level)

# Пользовательский уровень
VERBOSE = 15
logging.addLevelName(VERBOSE, 'VERBOSE')
logging.log(VERBOSE, 'Подробный вывод: %s', 'детали операции')

# Условное логирование в зависимости от серьёзности
def log_event(severity: str, message: str):
    lvl = logging.getLevelName(severity.upper())
    if isinstance(lvl, int):
        logging.log(lvl, message)

log_event('error', 'Ошибка подключения к БД')
log_event('info', 'Запрос выполнен успешно')`,
  },
  {
    name: "logging.makeLogRecord()",
    description:
      "Создаёт объект LogRecord из словаря атрибутов. Используется для воссоздания записей логов, полученных по сети (например, через SocketHandler) или из сериализованного формата. Позволяет создавать LogRecord без прохождения через стандартный механизм логирования.",
    syntax: "logging.makeLogRecord(dict)",
    arguments: [
      {
        name: "dict",
        description:
          "Словарь с атрибутами LogRecord: name, levelno, levelname, pathname, lineno, msg, args, exc_info и другие.",
      },
    ],
    example: `import logging
import json

logging.basicConfig(level=logging.DEBUG, format='%(name)s %(levelname)s: %(message)s')

# Воссоздание записи из словаря (например, полученной по сети)
record_data = {
    'name': 'remote.service',
    'levelno': logging.ERROR,
    'levelname': 'ERROR',
    'pathname': '/app/service.py',
    'lineno': 42,
    'msg': 'Ошибка обработки запроса: %s',
    'args': ('таймаут',),
    'exc_info': None,
    'funcName': 'handle_request',
}

record = logging.makeLogRecord(record_data)
print(f'Логгер: {record.name}')     # remote.service
print(f'Уровень: {record.levelname}')  # ERROR
print(f'Сообщение: {record.getMessage()}')  # Ошибка обработки запроса: таймаут

# Передаём запись в обработчик
logger = logging.getLogger(record.name)
logger.handle(record)`,
  },
  {
    name: "logging.setLogRecordFactory()",
    description:
      "Устанавливает пользовательскую фабрику для создания объектов LogRecord. Фабрика вызывается с теми же аргументами, что и конструктор LogRecord. Позволяет автоматически добавлять дополнительные поля (request_id, user_id и т.д.) ко всем записям логов.",
    syntax: "logging.setLogRecordFactory(factory)",
    arguments: [
      {
        name: "factory",
        description:
          "Вызываемый объект с сигнатурой factory(name, level, fn, lno, msg, args, exc_info, func, extra, sinfo) → LogRecord.",
      },
    ],
    example: `import logging
import uuid

# Сохраняем оригинальную фабрику для цепочки вызовов
original_factory = logging.getLogRecordFactory()

def record_factory(name, level, fn, lno, msg, args, exc_info, func=None, extra=None, sinfo=None):
    record = original_factory(name, level, fn, lno, msg, args, exc_info, func, extra, sinfo)
    # Добавляем поля к каждой записи
    record.request_id = getattr(record_factory, '_request_id', 'no-request')
    record.app_name = 'MyApp'
    return record

logging.setLogRecordFactory(record_factory)

logging.basicConfig(
    level=logging.INFO,
    format='[%(request_id)s] %(levelname)s %(name)s: %(message)s',
)

record_factory._request_id = str(uuid.uuid4())[:8]
logging.info('Обработка запроса /api/users')
logging.info('Запрос завершён')`,
  },
  {
    name: "logging.setLoggerClass()",
    description:
      "Устанавливает класс, который будет использоваться при создании новых логгеров. Класс должен быть подклассом logging.Logger. Влияет только на логгеры, созданные ПОСЛЕ вызова этой функции. Используется для добавления пользовательских методов или поведения ко всем логгерам приложения.",
    syntax: "logging.setLoggerClass(klass)",
    arguments: [
      {
        name: "klass",
        description:
          "Класс логгера — подкласс logging.Logger с дополнительными методами или переопределённым поведением.",
      },
    ],
    example: `import logging

# Пользовательский класс с дополнительными уровнями
class AppLogger(logging.Logger):
    SUCCESS_LEVEL = 25

    def __init__(self, name, level=logging.NOTSET):
        super().__init__(name, level)
        logging.addLevelName(self.SUCCESS_LEVEL, 'SUCCESS')

    def success(self, msg, *args, **kwargs):
        if self.isEnabledFor(self.SUCCESS_LEVEL):
            self._log(self.SUCCESS_LEVEL, msg, args, **kwargs)

    def audit(self, msg, *args, **kwargs):
        """Специальный уровень для аудита действий пользователей"""
        self._log(logging.WARNING, f'[AUDIT] {msg}', args, **kwargs)

# Регистрируем до создания логгеров
logging.setLoggerClass(AppLogger)

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

logger = logging.getLogger('myapp')
logger.success('Пользователь успешно аутентифицирован')
logger.audit('user:42 удалил запись #100')`,
  },
  {
    name: "logging.shutdown()",
    description:
      "Выполняет корректное завершение работы системы логирования: сбрасывает буферы и закрывает все обработчики. Вызывается автоматически при завершении интерпретатора Python через atexit. Следует вызывать вручную в приложениях, которые завершаются нестандартным способом.",
    syntax: "logging.shutdown(handlerList=_handlerList)",
    arguments: [
      {
        name: "handlerList",
        description:
          "Список слабых ссылок на обработчики для завершения. По умолчанию — внутренний глобальный список всех созданных обработчиков.",
      },
    ],
    example: `import logging
import atexit

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Создаём обработчик с файловым буфером
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.DEBUG)
logging.getLogger().addHandler(file_handler)

logger = logging.getLogger('myapp')

try:
    logger.info('Приложение запущено')
    # ... работа приложения ...
    logger.info('Завершение работы')
finally:
    # Явный вызов для гарантированной записи буферов
    logging.shutdown()
    # После shutdown() логирование не рекомендуется

# Автоматически вызывается при выходе (через atexit),
# но явный вызов гарантирует запись даже при исключениях`,
  },
  {
    name: "logging.warning()",
    description:
      "Записывает сообщение с уровнем WARNING (30) в корневой логгер. Используется для предупреждений о потенциальных проблемах, которые не нарушают текущую работу, но требуют внимания. Является уровнем по умолчанию при базовой настройке логирования.",
    syntax: "logging.warning(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Сообщение-предупреждение с опциональными спецификаторами формата.",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      { name: "extra", description: "Дополнительные поля для LogRecord." },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

def connect_db(host: str, port: int, retries: int = 3):
    for attempt in range(1, retries + 1):
        try:
            # имитация подключения
            if attempt < retries:
                raise ConnectionError('Соединение сброшено')
            logging.info('Подключение к БД установлено')
            return True
        except ConnectionError as e:
            logging.warning(
                'Попытка %d/%d не удалась: %s. Повтор...',
                attempt, retries, e
            )
    logging.error('Не удалось подключиться к БД %s:%d', host, port)
    return False

connect_db('localhost', 5432)
# WARNING: Попытка 1/3 не удалась: ...
# WARNING: Попытка 2/3 не удалась: ...
# INFO: Подключение к БД установлено`,
  },
  {
    name: "logging.warn()",
    description:
      "Устаревший псевдоним для logging.warning(). Функционально идентичен logging.warning(), но помечен как deprecated начиная с Python 3.2 и может быть удалён в будущих версиях. В новом коде следует использовать logging.warning().",
    syntax: "logging.warn(msg, *args, **kwargs)",
    arguments: [
      { name: "msg", description: "Сообщение для логирования." },
      {
        name: "*args",
        description: "Аргументы для форматирования строки msg.",
      },
    ],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

# warn() — устаревший вариант (не используйте в новом коде)
logging.warn('Это устаревший вызов')

# Эквивалентный современный вариант:
logging.warning('Используйте warning() вместо warn()')

# Проверка — оба метода ссылаются на одну реализацию
# (warn() вызывает warning() внутри с предупреждением о deprecated)

# Вывод:
# WARNING: Это устаревший вызов
# WARNING: Используйте warning() вместо warn()`,
  },
  {
    name: "logging.addLevelName()",
    description:
      "Регистрирует пользовательский уровень логирования: связывает числовое значение с текстовым именем. После регистрации новый уровень можно использовать в getLevelName(), setLevel() и методах логирования с явным указанием уровня. Также позволяет переименовать стандартные уровни.",
    syntax: "logging.addLevelName(level, levelName)",
    arguments: [
      {
        name: "level",
        description:
          "Числовое значение уровня. Принято выбирать между стандартными: DEBUG=10, INFO=20, WARNING=30, ERROR=40, CRITICAL=50.",
      },
      {
        name: "levelName",
        description:
          'Строковое имя уровня (например, "VERBOSE", "TRACE", "SUCCESS"). Используется в форматировании как %(levelname)s.',
      },
    ],
    example: `import logging

# Регистрируем пользовательские уровни
TRACE = 5
VERBOSE = 15
SUCCESS = 25

logging.addLevelName(TRACE, 'TRACE')
logging.addLevelName(VERBOSE, 'VERBOSE')
logging.addLevelName(SUCCESS, 'SUCCESS')

# Добавляем методы к классу Logger
def trace(self, msg, *args, **kwargs):
    if self.isEnabledFor(TRACE):
        self._log(TRACE, msg, args, **kwargs)

def success(self, msg, *args, **kwargs):
    if self.isEnabledFor(SUCCESS):
        self._log(SUCCESS, msg, args, **kwargs)

logging.Logger.trace = trace
logging.Logger.success = success

logging.basicConfig(level=TRACE, format='%(levelname)-8s: %(message)s')
logger = logging.getLogger('myapp')

logger.trace('Очень подробная трассировка')
logger.debug('Отладка')
logger.verbose = lambda m, *a: logger.log(VERBOSE, m, *a)
logger.success('Операция выполнена успешно')`,
  },
  {
    name: "logging.Logger.addFilter()",
    description:
      "Добавляет фильтр к логгеру. Фильтр проверяется перед передачей записи обработчикам: если хотя бы один фильтр отклоняет запись — она не логируется. Фильтром может быть объект с методом filter(record), экземпляр logging.Filter или callable(record) → bool.",
    syntax: "logger.addFilter(filter)",
    arguments: [
      {
        name: "filter",
        description:
          "Фильтр: объект с методом filter(record) → bool/int, или callable(record) → bool. Возврат False/0 отклоняет запись.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

# Фильтр как класс
class SensitiveDataFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # Блокируем записи содержащие пароли
        msg = record.getMessage()
        return 'password' not in msg.lower() and 'secret' not in msg.lower()

# Фильтр как функция
def production_only(record: logging.LogRecord) -> bool:
    return record.levelno >= logging.WARNING

logger.addFilter(SensitiveDataFilter())

logger.info('Пользователь вошёл в систему')        # пройдёт
logger.info('password=12345 в запросе')            # заблокировано фильтром
logger.warning('Ошибка авторизации для user:42')   # пройдёт`,
  },
  {
    name: "logging.Logger.addHandler()",
    description:
      "Добавляет обработчик к логгеру. Один логгер может иметь несколько обработчиков: например, одновременно выводить в консоль и записывать в файл. Один обработчик может быть добавлен к нескольким логгерам.",
    syntax: "logger.addHandler(hdlr)",
    arguments: [
      {
        name: "hdlr",
        description:
          "Объект-обработчик (Handler): StreamHandler, FileHandler, RotatingFileHandler, SMTPHandler и т.д.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# Обработчик для вывода в консоль (INFO и выше)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

# Обработчик для записи в файл (DEBUG и выше)
file_handler = logging.FileHandler('debug.log')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(
    logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
)

logger.addHandler(console_handler)
logger.addHandler(file_handler)

logger.debug('Только в файл')    # → debug.log
logger.info('В консоль и файл') # → консоль + debug.log
logger.error('Ошибка!')          # → консоль + debug.log`,
  },
  {
    name: "logging.Logger.callHandlers()",
    description:
      "Передаёт запись LogRecord всем обработчикам данного логгера и его родителей в иерархии (если propagate=True). Вызывается автоматически методом handle(). Обход вверх по иерархии продолжается до корневого логгера или до первого логгера с propagate=False.",
    syntax: "logger.callHandlers(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord для передачи обработчикам.",
      },
    ],
    example: `import logging

# Демонстрация работы callHandlers через иерархию
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.addHandler(logging.StreamHandler())

app_logger = logging.getLogger('myapp')
app_logger.setLevel(logging.DEBUG)

child_logger = logging.getLogger('myapp.db')
child_logger.addHandler(logging.StreamHandler())
# child_logger.propagate = True  (по умолчанию)

# При вызове child_logger.info():
# 1. child_logger.callHandlers() → обработчик child_logger
# 2. propagate=True → переходим к app_logger (без обработчиков)
# 3. propagate=True → переходим к root_logger → обработчик root
child_logger.info('Это сообщение обработают 2 обработчика')`,
  },
  {
    name: "logging.Logger.critical()",
    description:
      "Записывает сообщение с уровнем CRITICAL (50) через данный именованный логгер. В отличие от logging.critical(), использует конкретный логгер, что позволяет применять его настройки уровня, обработчиков и фильтров.",
    syntax: "logger.critical(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Сообщение с опциональными спецификаторами формата (%s, %d и т.д.).",
      },
      {
        name: "*args",
        description: "Аргументы для форматирования msg через оператор %.",
      },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      {
        name: "stack_info",
        description: "Если True — добавляет трассировку текущего стека.",
      },
      {
        name: "extra",
        description: "Словарь с дополнительными полями для LogRecord.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp.core')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

def check_disk_space(path: str, threshold_gb: float):
    import shutil
    total, used, free = shutil.disk_usage(path)
    free_gb = free / (1024 ** 3)
    if free_gb < threshold_gb:
        logger.critical(
            'Критически мало места на диске %s: %.1f ГБ (порог: %.1f ГБ)',
            path, free_gb, threshold_gb
        )
        return False
    return True

check_disk_space('/', 1.0)
# CRITICAL: Критически мало места на диске /: 0.3 ГБ (порог: 1.0 ГБ)`,
  },
  {
    name: "logging.Logger.debug()",
    description:
      "Записывает сообщение с уровнем DEBUG (10) через данный именованный логгер. Сообщение выводится только если effectiveLevel логгера ≤ 10. Стандартная практика — использовать именованный логгер модуля вместо корневого для детального управления выводом.",
    syntax: "logger.debug(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description: "Сообщение с опциональными спецификаторами формата.",
      },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      { name: "extra", description: "Дополнительные поля для LogRecord." },
    ],
    example: `import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

def parse_config(data: dict) -> dict:
    logger.debug('Разбираем конфиг: %d ключей', len(data))
    result = {}
    for key, value in data.items():
        logger.debug('  %s = %r', key, value)
        result[key] = str(value).strip()
    logger.debug('Конфиг готов: %r', result)
    return result

config = parse_config({'host': 'localhost', 'port': '5432', 'db': 'mydb'})
# DEBUG: Разбираем конфиг: 3 ключей
# DEBUG:   host = 'localhost'
# ...`,
  },
  {
    name: "logging.Logger.error()",
    description:
      "Записывает сообщение с уровнем ERROR (40) через данный именованный логгер. Используется для ошибок, нарушающих выполнение конкретной операции. Именованный логгер позволяет точечно настроить уровень и обработчики для конкретного компонента.",
    syntax: "logger.error(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description: "Сообщение с опциональными спецификаторами формата.",
      },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      { name: "extra", description: "Дополнительные поля для LogRecord." },
    ],
    example: `import logging

logger = logging.getLogger('myapp.api')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

def call_external_api(endpoint: str, payload: dict):
    import random
    try:
        # имитация HTTP запроса
        if random.random() < 0.5:
            raise TimeoutError(f'Таймаут запроса к {endpoint}')
        return {'status': 'ok'}
    except TimeoutError as e:
        logger.error('API недоступен: %s (endpoint=%s)', e, endpoint)
        return None

result = call_external_api('/api/v1/users', {'id': 42})
# ERROR: API недоступен: Таймаут запроса к /api/v1/users (endpoint=/api/v1/users)`,
  },
  {
    name: "logging.Logger.exception()",
    description:
      "Записывает сообщение с уровнем ERROR и автоматически добавляет полную трассировку текущего исключения. Должна вызываться в блоке except. Является сокращением для logger.error(msg, exc_info=True) с именованным логгером.",
    syntax: "logger.exception(msg, *args, exc_info=True, **kwargs)",
    arguments: [
      { name: "msg", description: "Описание контекста ошибки." },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description:
          "По умолчанию True. Включает трассировку текущего исключения.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp.db')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

def execute_query(sql: str, params: tuple = ()):
    try:
        # имитация ошибки БД
        raise RuntimeError('Соединение с БД потеряно')
    except Exception:
        logger.exception('Ошибка при выполнении запроса: %s', sql)
        return None

def get_user(user_id: int):
    result = execute_query('SELECT * FROM users WHERE id = %s', (user_id,))
    if result is None:
        logger.error('Не удалось получить пользователя %d', user_id)
    return result

get_user(42)
# ERROR: Ошибка при выполнении запроса: SELECT * FROM users WHERE id = %s
# Traceback (most recent call last): ...`,
  },
  {
    name: "logging.Logger.fatal()",
    description:
      "Псевдоним для logger.critical(). Записывает сообщение с уровнем CRITICAL через данный логгер. Существует для совместимости. В новом коде рекомендуется использовать logger.critical().",
    syntax: "logger.fatal(msg, *args, **kwargs)",
    arguments: [
      { name: "msg", description: "Сообщение для логирования." },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

# fatal() и critical() эквивалентны
logger.fatal('Неустранимая ошибка: %s', 'отказ диска')
logger.critical('Неустранимая ошибка: %s', 'отказ диска')

# Оба выводят: CRITICAL: Неустранимая ошибка: отказ диска
print(logger.fatal is logger.critical)  # True`,
  },
  {
    name: "logging.Logger.filter()",
    description:
      "Применяет все фильтры, добавленные к данному логгеру, к объекту LogRecord. Возвращает True если запись прошла все фильтры, False если хотя бы один фильтр её отклонил. Вызывается автоматически в методе handle() перед передачей записи обработчикам.",
    syntax: "logger.filter(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord для проверки фильтрами.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# Добавляем фильтр
class LevelRangeFilter(logging.Filter):
    def __init__(self, min_level: int, max_level: int):
        super().__init__()
        self.min_level = min_level
        self.max_level = max_level

    def filter(self, record: logging.LogRecord) -> bool:
        return self.min_level <= record.levelno <= self.max_level

logger.addFilter(LevelRangeFilter(logging.INFO, logging.WARNING))

# Тест фильтров вручную
test_record = logging.LogRecord(
    name='test', level=logging.INFO,
    pathname='', lineno=0, msg='тест', args=(), exc_info=None
)
print(logger.filter(test_record))  # True

test_record.levelno = logging.ERROR
print(logger.filter(test_record))  # False — выше max_level`,
  },
  {
    name: "logging.Logger.findCaller()",
    description:
      "Определяет имя файла, номер строки и имя функции, из которой был сделан вызов метода логирования. Используется внутри библиотеки для заполнения полей pathname, lineno и funcName в LogRecord. Параметр stacklevel позволяет подняться на нужный уровень в стеке вызовов.",
    syntax: "logger.findCaller(stack_info=False, stacklevel=1)",
    arguments: [
      {
        name: "stack_info",
        description:
          "Если True — дополнительно возвращает текстовое представление текущего стека вызовов.",
      },
      {
        name: "stacklevel",
        description:
          "Число уровней стека для подъёма. 1 — непосредственный вызывающий, 2 — его вызывающий и т.д. Используется в обёртках над методами логирования.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

# Внутреннее использование — findCaller вызывается автоматически
# Но можно вызвать напрямую для диагностики
filename, lineno, funcname, sinfo = logger.findCaller(stack_info=False)
print(f'Файл: {filename}, строка: {lineno}, функция: {funcname}')

# Практический случай: обёртка с корректным указанием источника
def log_with_context(msg: str, level: int = logging.INFO):
    """Обёртка, сообщающая logger-у подняться на 1 уровень вверх"""
    logger.log(level, msg, stacklevel=2)  # stacklevel=2 → вызывающий

log_with_context('Из вызывающего кода')  # покажет эту строку, не обёртку`,
  },
  {
    name: "logging.Logger.getChild()",
    description:
      'Возвращает дочерний логгер с именем, расширенным через точку. Удобен для создания иерархии логгеров без явного указания полного имени. Эквивалентен logging.getLogger(logger.name + "." + suffix).',
    syntax: "logger.getChild(suffix)",
    arguments: [
      {
        name: "suffix",
        description:
          "Суффикс для имени дочернего логгера. Может содержать точки для создания вложенной иерархии.",
      },
    ],
    example: `import logging

# Базовый логгер приложения
app = logging.getLogger('myapp')
app.setLevel(logging.DEBUG)
app.addHandler(logging.StreamHandler())

# Дочерние логгеры через getChild
db = app.getChild('db')           # 'myapp.db'
api = app.getChild('api')         # 'myapp.api'
auth = api.getChild('auth')       # 'myapp.api.auth'

print(db.name)    # myapp.db
print(api.name)   # myapp.api
print(auth.name)  # myapp.api.auth

# Эквивалентные записи:
db2 = logging.getLogger('myapp.db')
print(db is db2)  # True — один и тот же объект

# Иерархия наследования уровней
db.info('Запрос к БД')    # использует уровень myapp (DEBUG)
auth.warning('Подозрительный вход')  # → myapp.api → myapp`,
  },
  {
    name: "logging.Logger.getEffectiveLevel()",
    description:
      "Возвращает эффективный уровень логгера. Если уровень установлен явно — возвращает его. Иначе поднимается по иерархии родителей до первого логгера с явно установленным уровнем. Если ни один родитель не имеет уровня — возвращает уровень корневого логгера (WARNING по умолчанию).",
    syntax: "logger.getEffectiveLevel()",
    arguments: [],
    example: `import logging

root = logging.getLogger()
root.setLevel(logging.WARNING)

app = logging.getLogger('myapp')
# app.level == NOTSET (0) — не установлен явно

db = logging.getLogger('myapp.db')
db.setLevel(logging.DEBUG)

cache = logging.getLogger('myapp.cache')
# cache.level == NOTSET

print(app.level)                  # 0 (NOTSET)
print(app.getEffectiveLevel())    # 30 (WARNING) — от root

print(db.level)                   # 10 (DEBUG)
print(db.getEffectiveLevel())     # 10 (DEBUG) — собственный

print(cache.level)                # 0 (NOTSET)
print(cache.getEffectiveLevel())  # 30 (WARNING) — от root (пропускает app)`,
  },
  {
    name: "logging.Logger.handle()",
    description:
      "Передаёт запись LogRecord в систему обработки: сначала применяет фильтры логгера, затем вызывает callHandlers(). Является точкой входа для обработки записи. Вызывается автоматически из методов debug(), info() и т.д., но можно вызвать вручную для повторной обработки записи.",
    syntax: "logger.handle(record)",
    arguments: [
      {
        name: "record",
        description:
          "Объект LogRecord для обработки. Если не прошёл фильтры — игнорируется.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

# Создаём запись вручную и передаём в handle()
record = logging.LogRecord(
    name='myapp',
    level=logging.WARNING,
    pathname=__file__,
    lineno=42,
    msg='Ручная запись: %s',
    args=('тест',),
    exc_info=None,
)
logger.handle(record)
# WARNING: Ручная запись: тест

# Практический случай: повторная обработка сохранённой записи
saved_record = None

class CapturingHandler(logging.Handler):
    def emit(self, record):
        global saved_record
        saved_record = record

logger.addHandler(CapturingHandler())
logger.info('Сохраняем запись')
logger.handle(saved_record)  # повторная обработка`,
  },
  {
    name: "logging.Logger.hasHandlers()",
    description:
      "Возвращает True если данный логгер или любой из его родителей в иерархии имеет хотя бы один обработчик. Используется для проверки наличия настроенных обработчиков перед выполнением дорогостоящих операций подготовки сообщения.",
    syntax: "logger.hasHandlers()",
    arguments: [],
    example: `import logging

root = logging.getLogger()
app = logging.getLogger('myapp')
db = logging.getLogger('myapp.db')

# До добавления обработчиков
print(root.hasHandlers())  # False
print(app.hasHandlers())   # False
print(db.hasHandlers())    # False

# Добавляем обработчик только к root
root.addHandler(logging.StreamHandler())

# Все дочерние видят обработчик через propagate
print(root.hasHandlers())  # True
print(app.hasHandlers())   # True  — через parent (root)
print(db.hasHandlers())    # True  — через parent chain

# Практическое использование
def expensive_log(logger: logging.Logger, level: int, data):
    if logger.hasHandlers() and logger.isEnabledFor(level):
        msg = str(data)  # дорогое преобразование
        logger.log(level, msg)`,
  },
  {
    name: "logging.Logger.info()",
    description:
      "Записывает сообщение с уровнем INFO (20) через данный именованный логгер. Используется для ключевых событий нормальной работы приложения. Именованный логгер позволяет раздельно управлять уровнем вывода для разных компонентов системы.",
    syntax: "logger.info(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Информационное сообщение с опциональными спецификаторами формата.",
      },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      { name: "extra", description: "Дополнительные поля для LogRecord." },
    ],
    example: `import logging
import time

logger = logging.getLogger('myapp.worker')
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

def process_batch(items: list) -> int:
    logger.info('Начало обработки батча: %d элементов', len(items))
    start = time.monotonic()
    processed = 0
    for item in items:
        processed += 1
    elapsed = time.monotonic() - start
    logger.info(
        'Батч обработан: %d/%d элементов за %.2f сек',
        processed, len(items), elapsed
    )
    return processed

process_batch(list(range(1000)))
# INFO: Начало обработки батча: 1000 элементов
# INFO: Батч обработан: 1000/1000 элементов за 0.00 сек`,
  },
  {
    name: "logging.Logger.isEnabledFor()",
    description:
      "Возвращает True если сообщение с указанным уровнем будет обработано данным логгером с учётом его эффективного уровня. Позволяет избежать дорогостоящего формирования сообщения, когда оно всё равно будет отброшено из-за уровня логгера.",
    syntax: "logger.isEnabledFor(level)",
    arguments: [
      {
        name: "level",
        description:
          "Числовой уровень логирования для проверки (например, logging.DEBUG, logging.INFO).",
      },
    ],
    example: `import logging
import json

logger = logging.getLogger('myapp')
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

def process_data(data: dict):
    # Дорогое форматирование только если DEBUG активен
    if logger.isEnabledFor(logging.DEBUG):
        formatted = json.dumps(data, indent=2, ensure_ascii=False)
        logger.debug('Данные для обработки:\\n%s', formatted)

    logger.info('Обработка %d записей', len(data))

print(logger.isEnabledFor(logging.DEBUG))    # False (level=INFO)
print(logger.isEnabledFor(logging.INFO))     # True
print(logger.isEnabledFor(logging.WARNING))  # True

process_data({'user': 'Иван', 'age': 30})`,
  },
  {
    name: "logging.Logger.log()",
    description:
      "Записывает сообщение с произвольным числовым уровнем через данный именованный логгер. Позволяет использовать уровень, определяемый динамически — например из конфигурации или пользовательского параметра.",
    syntax: "logger.log(level, msg, *args, **kwargs)",
    arguments: [
      {
        name: "level",
        description:
          "Числовой уровень логирования. Можно использовать константы logging.DEBUG/INFO/WARNING/ERROR/CRITICAL или произвольное целое число.",
      },
      {
        name: "msg",
        description: "Сообщение с опциональными спецификаторами формата.",
      },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

# Динамический уровень из конфигурации
def notify(message: str, severity: str = 'INFO'):
    level = logging.getLevelName(severity.upper())
    if not isinstance(level, int):
        level = logging.INFO
    logger.log(level, '[%s] %s', severity, message)

notify('Сервер запущен', 'INFO')
notify('Место на диске заканчивается', 'WARNING')
notify('База данных недоступна', 'ERROR')

# Пользовательский уровень
AUDIT = 35
logging.addLevelName(AUDIT, 'AUDIT')
logger.log(AUDIT, 'Пользователь %s удалил запись #%d', 'admin', 42)`,
  },
  {
    name: "logging.Logger.makeRecord()",
    description:
      "Создаёт объект LogRecord с заданными параметрами. Вызывается внутри методов debug(), info() и т.д. Можно переопределить в подклассе Logger для создания LogRecord с дополнительными атрибутами без замены глобальной фабрики.",
    syntax:
      "logger.makeRecord(name, level, fn, lno, msg, args, exc_info, func=None, extra=None, sinfo=None)",
    arguments: [
      { name: "name", description: "Имя логгера." },
      { name: "level", description: "Числовой уровень сообщения." },
      { name: "fn", description: "Полный путь к файлу исходного кода." },
      { name: "lno", description: "Номер строки в файле исходного кода." },
      { name: "msg", description: "Шаблон сообщения." },
      { name: "args", description: "Аргументы для форматирования шаблона." },
      {
        name: "exc_info",
        description: "Кортеж (type, value, traceback) или None.",
      },
      { name: "func", description: "Имя вызвавшей функции." },
      {
        name: "extra",
        description: "Словарь с дополнительными полями для LogRecord.",
      },
      { name: "sinfo", description: "Строка со стеком вызовов или None." },
    ],
    example: `import logging

# Подкласс с переопределением makeRecord для добавления полей
class ContextLogger(logging.Logger):
    _context: dict = {}

    @classmethod
    def set_context(cls, **kwargs):
        cls._context.update(kwargs)

    def makeRecord(self, name, level, fn, lno, msg, args, exc_info,
                   func=None, extra=None, sinfo=None):
        record = super().makeRecord(
            name, level, fn, lno, msg, args, exc_info, func, extra, sinfo
        )
        for key, value in self._context.items():
            setattr(record, key, value)
        return record

logging.setLoggerClass(ContextLogger)
logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

ContextLogger.set_context(request_id='req-42', user_id='user-7')
logger.info('Запрос обработан')`,
  },
  {
    name: "logging.Logger.removeFilter()",
    description:
      "Удаляет ранее добавленный фильтр из логгера. После удаления записи, которые отклонялись этим фильтром, снова начинают обрабатываться. Если фильтр не найден — ничего не происходит.",
    syntax: "logger.removeFilter(filter)",
    arguments: [
      {
        name: "filter",
        description:
          "Объект фильтра, ранее добавленный через addFilter(). Должен быть тем же объектом (сравнение по идентичности).",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

class DebugOnlyFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.levelno == logging.DEBUG

f = DebugOnlyFilter()
logger.addFilter(f)

logger.debug('Только DEBUG — пройдёт')    # выводится
logger.info('INFO — заблокировано')       # заблокировано

# Удаляем фильтр
logger.removeFilter(f)

logger.debug('DEBUG без фильтра')         # выводится
logger.info('INFO без фильтра — пройдёт') # выводится`,
  },
  {
    name: "logging.Logger.removeHandler()",
    description:
      "Удаляет обработчик из логгера. После удаления записи больше не будут передаваться этому обработчику. Обработчик не закрывается автоматически — при необходимости вызовите handler.close() вручную для освобождения ресурсов.",
    syntax: "logger.removeHandler(hdlr)",
    arguments: [
      {
        name: "hdlr",
        description:
          "Объект обработчика, ранее добавленный через addHandler(). Если обработчик не найден — ничего не происходит.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

console = logging.StreamHandler()
file_h = logging.FileHandler('app.log')

logger.addHandler(console)
logger.addHandler(file_h)

logger.info('В консоль и файл')  # оба обработчика

# Удаляем файловый обработчик
logger.removeHandler(file_h)
file_h.close()  # закрываем файл явно

logger.info('Только в консоль')  # только StreamHandler

print(len(logger.handlers))  # 1`,
  },
  {
    name: "logging.Logger.setLevel()",
    description:
      "Устанавливает пороговый уровень логгера. Сообщения ниже этого уровня игнорируются без передачи обработчикам. Принимает числовое значение или строковое имя уровня. logging.NOTSET (0) означает использование уровня родительского логгера.",
    syntax: "logger.setLevel(level)",
    arguments: [
      {
        name: "level",
        description:
          'Числовое значение (logging.DEBUG=10, INFO=20, WARNING=30, ERROR=40, CRITICAL=50) или строка ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"). logging.NOTSET (0) сбрасывает до наследования от родителя.',
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.addHandler(logging.StreamHandler())

# Строковое имя уровня
logger.setLevel('DEBUG')
logger.debug('Отладка видна')     # выводится
logger.info('Информация видна')   # выводится

# Числовое значение
logger.setLevel(logging.WARNING)
logger.debug('Отладка скрыта')    # игнорируется
logger.info('Информация скрыта')  # игнорируется
logger.warning('Предупреждение')  # выводится

# Динамическое изменение из конфигурации
import os
level_name = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(level_name)
print(f'Уровень: {logging.getLevelName(logger.level)}')`,
  },
  {
    name: "logging.Logger.warning()",
    description:
      "Записывает сообщение с уровнем WARNING (30) через данный именованный логгер. Используется для предупреждений о потенциальных проблемах, которые не нарушают текущую работу. WARNING является уровнем по умолчанию при базовой настройке логирования.",
    syntax: "logger.warning(msg, *args, **kwargs)",
    arguments: [
      {
        name: "msg",
        description:
          "Сообщение-предупреждение с опциональными спецификаторами формата.",
      },
      { name: "*args", description: "Аргументы для форматирования msg." },
      {
        name: "exc_info",
        description: "Если True — добавляет трассировку текущего исключения.",
      },
      { name: "extra", description: "Дополнительные поля для LogRecord." },
    ],
    example: `import logging

logger = logging.getLogger('myapp.cache')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

class Cache:
    def __init__(self, max_size: int):
        self.max_size = max_size
        self.data: dict = {}

    def set(self, key: str, value):
        if len(self.data) >= self.max_size * 0.9:
            logger.warning(
                'Кэш заполнен на %.0f%% (%d/%d записей)',
                len(self.data) / self.max_size * 100,
                len(self.data), self.max_size
            )
        self.data[key] = value

cache = Cache(max_size=100)
for i in range(92):
    cache.set(f'key_{i}', i)
# WARNING: Кэш заполнен на 90% (90/100 записей)`,
  },
  {
    name: "logging.Logger.warn()",
    description:
      "Устаревший псевдоним для logger.warning(). Функционально идентичен, но помечен как deprecated начиная с Python 3.2. В новом коде следует использовать logger.warning().",
    syntax: "logger.warn(msg, *args, **kwargs)",
    arguments: [
      { name: "msg", description: "Сообщение для логирования." },
      { name: "*args", description: "Аргументы для форматирования msg." },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

# Устаревший вариант — не использовать в новом коде
logger.warn('Устаревший вызов warn()')

# Современный эквивалент
logger.warning('Используйте warning() вместо warn()')

# Оба выводят WARNING — функционально идентичны
print(logger.warn is logger.warning)  # True`,
  },
  {
    name: "logging.Logger.name",
    description:
      'Атрибут, содержащий имя логгера, указанное при его создании через logging.getLogger(name). Имена образуют иерархию через точку: "myapp.db" является дочерним для "myapp". Корневой логгер имеет имя "root".',
    syntax: "logger.name",
    arguments: [],
    example: `import logging

root = logging.getLogger()
print(root.name)              # root

app = logging.getLogger('myapp')
print(app.name)               # myapp

db = logging.getLogger('myapp.db')
print(db.name)                # myapp.db

# Стандартная практика — использовать __name__
logger = logging.getLogger(__name__)
print(logger.name)            # имя текущего модуля (например, '__main__')

# Имя можно использовать в форматировании
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(name)s: %(message)s'))
logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.info('Сообщение')      # __main__: Сообщение`,
  },
  {
    name: "logging.Logger.level",
    description:
      "Атрибут, хранящий числовой пороговый уровень логгера, установленный через setLevel(). Значение 0 (logging.NOTSET) означает, что уровень не задан явно и наследуется от родителя. Для получения фактического активного уровня следует использовать getEffectiveLevel().",
    syntax: "logger.level",
    arguments: [],
    example: `import logging

logger = logging.getLogger('myapp')

# По умолчанию NOTSET (0) — уровень не установлен
print(logger.level)               # 0
print(logger.getEffectiveLevel()) # 30 (WARNING от root)

logger.setLevel(logging.DEBUG)
print(logger.level)               # 10
print(logging.getLevelName(logger.level))  # DEBUG

logger.setLevel('INFO')
print(logger.level)               # 20

# Сброс до наследования от родителя
logger.setLevel(logging.NOTSET)
print(logger.level)               # 0`,
  },
  {
    name: "logging.Logger.parent",
    description:
      'Атрибут, ссылающийся на родительский логгер в иерархии. Для логгера "myapp.db" родителем является "myapp", для "myapp" — корневой логгер (root). Используется при обходе иерархии в callHandlers() и getEffectiveLevel(). Устанавливается автоматически.',
    syntax: "logger.parent",
    arguments: [],
    example: `import logging

root = logging.getLogger()
app = logging.getLogger('myapp')
db = logging.getLogger('myapp.db')

print(db.parent)       # <Logger myapp (WARNING)>
print(db.parent.name)  # myapp

print(app.parent)      # <RootLogger root (WARNING)>
print(app.parent.name) # root

print(root.parent)     # None — корневой не имеет родителя

# Иерархия определяет путь распространения записей
# db → app → root (при propagate=True на каждом уровне)`,
  },
  {
    name: "logging.Logger.propagate",
    description:
      "Булев атрибут, определяющий, передаются ли записи из данного логгера в обработчики родительских логгеров. По умолчанию True. Установка в False предотвращает дублирование сообщений когда и дочерний, и родительский логгеры имеют обработчики.",
    syntax: "logger.propagate",
    arguments: [],
    example: `import logging

logging.basicConfig(level=logging.DEBUG, format='ROOT: %(message)s')

app = logging.getLogger('myapp')
app.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('APP: %(message)s'))
app.addHandler(handler)

# propagate=True (по умолчанию) — сообщение идёт и в app, и в root
app.info('Дублируется')
# APP: Дублируется
# ROOT: Дублируется  ← дублирование!

# Отключаем дублирование
app.propagate = False
app.info('Только в app')
# APP: Только в app  ← без дублирования`,
  },
  {
    name: "logging.Logger.handlers",
    description:
      "Список обработчиков (Handler), прикреплённых непосредственно к данному логгеру. Можно читать для проверки текущих обработчиков. Изменять напрямую не рекомендуется — используйте addHandler() и removeHandler().",
    syntax: "logger.handlers",
    arguments: [],
    example: `import logging

logger = logging.getLogger('myapp')
print(logger.handlers)   # [] — пусто по умолчанию

console = logging.StreamHandler()
file_h = logging.FileHandler('app.log')
logger.addHandler(console)
logger.addHandler(file_h)

print(len(logger.handlers))    # 2
print(logger.handlers[0])      # <StreamHandler ...>

# Проверка типов обработчиков
for h in logger.handlers:
    print(type(h).__name__, h.level)

# Очистка всех обработчиков
for h in logger.handlers[:]:   # копия списка для безопасного удаления
    logger.removeHandler(h)
    h.close()
print(logger.handlers)         # []`,
  },
  {
    name: "logging.Logger.disabled",
    description:
      "Булев атрибут, полностью отключающий логгер при значении True. Когда disabled=True, логгер игнорирует все входящие сообщения независимо от их уровня. Обычно не устанавливается вручную — управляется через logging.disable().",
    syntax: "logger.disabled",
    arguments: [],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

logger.info('Нормальная работа')   # выводится
print(logger.disabled)             # False

# Отключаем логгер напрямую
logger.disabled = True
logger.info('Это НЕ выведется')    # игнорируется
logger.critical('И это тоже')      # игнорируется

# Включаем обратно
logger.disabled = False
logger.info('Снова работает')      # выводится

# Примечание: logging.disable(level) устанавливает глобальный
# порог для всех логгеров, а не использует атрибут disabled`,
  },
  {
    name: "logging.Logger.filters",
    description:
      "Список фильтров, прикреплённых непосредственно к данному логгеру. Каждая запись проверяется всеми фильтрами перед обработкой. Изменять напрямую не рекомендуется — используйте addFilter() и removeFilter().",
    syntax: "logger.filters",
    arguments: [],
    example: `import logging

logger = logging.getLogger('myapp')
print(logger.filters)   # [] — пусто по умолчанию

class ModuleFilter(logging.Filter):
    def __init__(self, module: str):
        super().__init__()
        self.module = module
    def filter(self, record: logging.LogRecord) -> bool:
        return record.name.startswith(self.module)

f1 = ModuleFilter('myapp')
f2 = lambda r: r.levelno >= logging.WARNING

logger.addFilter(f1)
logger.addFilter(f2)

print(len(logger.filters))   # 2

# Проверка текущих фильтров
for f in logger.filters:
    print(f)

# Удаление всех фильтров
logger.filters.clear()       # или через removeFilter() для каждого`,
  },
  {
    name: "logging.Handler",
    description:
      "Базовый класс для всех обработчиков логирования. Определяет общий интерфейс: emit() для записи, setLevel() для порогового уровня, setFormatter() для формата, addFilter()/removeFilter() для фильтрации. Не используется напрямую — создаются подклассы: StreamHandler, FileHandler, RotatingFileHandler и др.",
    syntax: "logging.Handler(level=logging.NOTSET)",
    arguments: [
      {
        name: "level",
        description:
          "Пороговый уровень обработчика. Записи ниже этого уровня не передаются в emit(). По умолчанию NOTSET (0) — обрабатываются все записи.",
      },
    ],
    example: `import logging

# Создание подкласса Handler
class ListHandler(logging.Handler):
    """Обработчик, сохраняющий записи в список (полезно для тестов)"""
    def __init__(self, level=logging.NOTSET):
        super().__init__(level)
        self.records: list[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord):
        self.records.append(record)

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

handler = ListHandler(level=logging.WARNING)
logger.addHandler(handler)

logger.debug('Ниже порога — не попадёт')
logger.warning('Предупреждение')
logger.error('Ошибка')

print(len(handler.records))              # 2
print(handler.records[0].getMessage())  # Предупреждение`,
  },
  {
    name: "logging.Handler.acquire()",
    description:
      "Захватывает внутреннюю блокировку (threading.RLock) обработчика. Используется для потокобезопасного доступа к ресурсам обработчика. Вызывается автоматически в методе handle() перед вызовом emit(). Всегда используется в паре с release().",
    syntax: "handler.acquire()",
    arguments: [],
    example: `import logging
import threading

class SafeCountingHandler(logging.Handler):
    """Потокобезопасный обработчик со счётчиком"""
    def __init__(self):
        super().__init__()
        self.count = 0

    def emit(self, record: logging.LogRecord):
        # acquire/release вызываются автоматически через handle()
        # Здесь блокировка уже захвачена
        self.count += 1
        print(f'[{self.count}] {self.format(record)}')

    def get_count_safe(self) -> int:
        """Безопасное чтение счётчика из другого потока"""
        self.acquire()  # захватываем блокировку вручную
        try:
            return self.count
        finally:
            self.release()  # всегда освобождаем

handler = SafeCountingHandler()
logger = logging.getLogger('demo')
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)
logger.info('Первое сообщение')
logger.warning('Второе')
print(handler.get_count_safe())  # 2`,
  },
  {
    name: "logging.Handler.addFilter()",
    description:
      "Добавляет фильтр к обработчику. Фильтры обработчика проверяются в методе handle() — если запись не прошла фильтр, emit() не вызывается. Позволяет выборочно направлять только часть записей в данный обработчик.",
    syntax: "handler.addFilter(filter)",
    arguments: [
      {
        name: "filter",
        description:
          "Объект с методом filter(record) → bool, экземпляр logging.Filter, или callable(record) → bool.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# Обработчик для консоли — только WARNING и выше
console = logging.StreamHandler()
console.setLevel(logging.DEBUG)
console.setFormatter(logging.Formatter('CONSOLE %(levelname)s: %(message)s'))

# Фильтр: только WARNING+ в консоль
console.addFilter(lambda r: r.levelno >= logging.WARNING)

# Обработчик для файла — все уровни
file_h = logging.FileHandler('all.log')
file_h.setFormatter(logging.Formatter('FILE %(levelname)s: %(message)s'))

logger.addHandler(console)
logger.addHandler(file_h)

logger.debug('debug')    # → только файл
logger.info('info')      # → только файл
logger.warning('warn')   # → консоль + файл
logger.error('error')    # → консоль + файл`,
  },
  {
    name: "logging.Handler.close()",
    description:
      "Освобождает ресурсы обработчика и удаляет его из внутреннего реестра обработчиков. Для обработчиков с файлами, сокетами или другими внешними ресурсами — закрывает их. Вызывается автоматически при logging.shutdown(), но рекомендуется вызывать явно после removeHandler().",
    syntax: "handler.close()",
    arguments: [],
    example: `import logging
import os

logger = logging.getLogger('myapp')
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler('temp.log')
logger.addHandler(file_handler)

logger.info('Запись в файл')

# Корректное завершение работы с обработчиком
logger.removeHandler(file_handler)
file_handler.close()   # закрываем файл и освобождаем ресурсы

# После close() файл освобождён
os.remove('temp.log')  # можно удалить

# Автоматическое закрытие через контекстный менеджер (Python 3.12+)
# или вручную в блоке try/finally
try:
    h = logging.FileHandler('app.log')
    logger.addHandler(h)
    logger.info('Сообщение')
finally:
    logger.removeHandler(h)
    h.close()`,
  },
  {
    name: "logging.Handler.createLock()",
    description:
      "Создаёт внутреннюю блокировку threading.RLock, используемую для потокобезопасного доступа в методах acquire() и release(). Вызывается автоматически в конструкторе Handler.__init__(). Переопределяется в подклассах, не нуждающихся в блокировке (например, QueueHandler).",
    syntax: "handler.createLock()",
    arguments: [],
    example: `import logging
import threading

class NoLockHandler(logging.Handler):
    """Обработчик без блокировки для однопоточных приложений"""
    def createLock(self):
        # Не создаём блокировку — экономим ресурсы
        self.lock = None

    def acquire(self):
        pass  # нет блокировки — ничего не делаем

    def release(self):
        pass

    def emit(self, record: logging.LogRecord):
        print(self.format(record))

# Стандартный обработчик создаёт RLock в __init__
h = logging.StreamHandler()
print(type(h.lock))  # <class '_thread.RLock'>

# Обработчик без блокировки
no_lock_h = NoLockHandler()
print(no_lock_h.lock)  # None`,
  },
  {
    name: "logging.Handler.emit()",
    description:
      "Абстрактный метод, выполняющий фактическую запись/отправку записи LogRecord. Должен быть переопределён в каждом подклассе Handler. Вызывается из handle() после проверки уровня и фильтров. В реализации следует вызывать handleError() при возникновении исключений.",
    syntax: "handler.emit(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord, прошедший проверку уровня и фильтров.",
      },
    ],
    example: `import logging
import json
from datetime import datetime

class JsonHandler(logging.Handler):
    """Обработчик, записывающий логи в JSON-формате"""
    def __init__(self, filename: str, level=logging.NOTSET):
        super().__init__(level)
        self.filename = filename

    def emit(self, record: logging.LogRecord):
        try:
            entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'logger': record.name,
                'message': self.format(record),
                'module': record.module,
                'line': record.lineno,
            }
            with open(self.filename, 'a') as f:
                f.write(json.dumps(entry, ensure_ascii=False) + '\\n')
        except Exception:
            self.handleError(record)  # стандартная обработка ошибок

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(JsonHandler('logs.jsonl'))
logger.info('Пользователь вошёл в систему')`,
  },
  {
    name: "logging.Handler.filter()",
    description:
      "Применяет все фильтры обработчика к записи LogRecord. Возвращает True если запись прошла все фильтры, False если хотя бы один фильтр отклонил запись. Вызывается автоматически в handle() перед вызовом emit().",
    syntax: "handler.filter(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord для проверки фильтрами обработчика.",
      },
    ],
    example: `import logging

handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)

# Добавляем два фильтра
handler.addFilter(lambda r: r.levelno != logging.DEBUG)       # не DEBUG
handler.addFilter(lambda r: 'password' not in r.getMessage()) # без паролей

# Ручная проверка фильтров
def make_record(level, msg):
    return logging.LogRecord(
        'test', level, '', 0, msg, (), None
    )

print(handler.filter(make_record(logging.INFO, 'ok')))         # True
print(handler.filter(make_record(logging.DEBUG, 'отладка')))   # False (DEBUG)
print(handler.filter(make_record(logging.INFO, 'password=x'))) # False (пароль)

# В реальной работе filter() вызывается автоматически из handle()`,
  },
  {
    name: "logging.Handler.flush()",
    description:
      "Сбрасывает буфер обработчика, гарантируя запись всех накопленных данных. В базовом StreamHandler делегирует вызов stream.flush(). Для буферизованных обработчиков (MemoryHandler) сбрасывает накопленные записи в целевой обработчик. Вызывается при shutdown().",
    syntax: "handler.flush()",
    arguments: [],
    example: `import logging
import sys

# StreamHandler оборачивает sys.stderr (или stdout)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

logger.info('Первое сообщение')

# Явный сброс буфера — гарантирует запись в stdout
handler.flush()

# Практически важно при перенаправлении вывода в файл:
# python script.py > output.txt
# Без flush() часть данных может остаться в буфере

# MemoryHandler буферизует записи и сбрасывает пакетами
memory_h = logging.handlers.MemoryHandler(capacity=10, target=handler)
# memory_h.flush() — сбрасывает все накопленные записи в target`,
  },
  {
    name: "logging.Handler.format()",
    description:
      "Форматирует объект LogRecord в строку с помощью прикреплённого Formatter. Если Formatter не задан — использует последний форматтер по умолчанию (logging.BASIC_FORMAT). Вызывается из emit() для получения финальной строки сообщения.",
    syntax: "handler.format(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord для форматирования в строку.",
      },
    ],
    example: `import logging

handler = logging.StreamHandler()

# Без форматтера — используется базовый формат
record = logging.LogRecord(
    name='myapp', level=logging.INFO,
    pathname='app.py', lineno=10,
    msg='Привет, %s!', args=('мир',), exc_info=None
)
print(handler.format(record))  # INFO:myapp:Привет, мир!

# С пользовательским форматтером
fmt = logging.Formatter(
    fmt='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S'
)
handler.setFormatter(fmt)
print(handler.format(record))  # 12:34:56 [INFO] myapp: Привет, мир!

# Проверка прикреплённого форматтера
print(handler.formatter)  # <Formatter ...>`,
  },
  {
    name: "logging.Handler.get_name()",
    description:
      "Возвращает имя обработчика, установленное через set_name() или атрибут name. По умолчанию обработчики не имеют имени (возвращает None). Имя используется для идентификации конкретного обработчика в конфигурации через logging.config.",
    syntax: "handler.get_name()",
    arguments: [],
    example: `import logging

# По умолчанию имя не установлено
handler = logging.StreamHandler()
print(handler.get_name())   # None

# Установка имени
handler.set_name('console')
print(handler.get_name())   # console

# Другой способ — через атрибут name напрямую
handler2 = logging.FileHandler('app.log')
handler2.name = 'file'
print(handler2.get_name())  # file
handler2.close()

# Практическое использование: поиск обработчика по имени
logger = logging.getLogger('myapp')
logger.addHandler(handler)

for h in logger.handlers:
    if h.get_name() == 'console':
        print(f'Найден консольный обработчик: {h}')
        break`,
  },
  {
    name: "logging.Handler.handle()",
    description:
      "Обрабатывает запись LogRecord: захватывает блокировку (acquire), применяет фильтры (filter), при успехе вызывает emit(), затем освобождает блокировку (release). Является центральным методом обработчика. Вызывается из logger.callHandlers().",
    syntax: "handler.handle(record)",
    arguments: [
      { name: "record", description: "Объект LogRecord для обработки." },
    ],
    example: `import logging

class TracingHandler(logging.Handler):
    """Обработчик с трассировкой вызовов"""
    def handle(self, record: logging.LogRecord):
        print(f'handle() вызван: {record.levelname} {record.getMessage()[:30]}')
        result = super().handle(record)  # acquire → filter → emit → release
        print(f'handle() завершён, emit вызван: {result}')
        return result

    def emit(self, record: logging.LogRecord):
        print(f'  emit(): {self.format(record)}')

logger = logging.getLogger('demo')
logger.setLevel(logging.DEBUG)
h = TracingHandler()
h.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
logger.addHandler(h)

logger.info('Тест трассировки')
# handle() вызван: INFO Тест трассировки
#   emit(): INFO: Тест трассировки
# handle() завершён`,
  },
  {
    name: "logging.Handler.handleError()",
    description:
      "Вызывается из emit() при возникновении исключения во время обработки записи. По умолчанию выводит трассировку в sys.stderr и продолжает работу (не прерывает логирование). Можно переопределить для другого поведения при ошибках обработчика.",
    syntax: "handler.handleError(record)",
    arguments: [
      {
        name: "record",
        description:
          "Объект LogRecord, при обработке которого возникло исключение.",
      },
    ],
    example: `import logging
import sys

class ResilientHandler(logging.Handler):
    """Обработчик с кастомной обработкой ошибок"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_count = 0

    def emit(self, record: logging.LogRecord):
        try:
            msg = self.format(record)
            # Имитируем периодическую ошибку
            if 'fail' in msg:
                raise IOError('Ошибка записи')
            print(msg)
        except Exception:
            self.handleError(record)  # стандартная обработка

    def handleError(self, record: logging.LogRecord):
        self.error_count += 1
        # Переопределяем: пишем в stderr без прерывания
        print(f'[HANDLER ERROR #{self.error_count}] '
              f'Не удалось обработать: {record.getMessage()}',
              file=sys.stderr)

h = ResilientHandler()
logger = logging.getLogger('demo')
logger.addHandler(h)
logger.setLevel(logging.DEBUG)

logger.info('Нормальное сообщение')
logger.info('Это fail провоцирует ошибку')`,
  },
  {
    name: "logging.Handler.release()",
    description:
      "Освобождает внутреннюю блокировку (threading.RLock), ранее захваченную через acquire(). Вызывается автоматически в методе handle() после завершения emit(). Всегда используется в паре с acquire() в блоке try/finally.",
    syntax: "handler.release()",
    arguments: [],
    example: `import logging

class ManualLockHandler(logging.Handler):
    """Демонстрация явного использования acquire/release"""
    def emit(self, record: logging.LogRecord):
        # В обычном коде acquire/release вызываются через handle()
        # Здесь только для демонстрации
        print(self.format(record))

    def safe_flush_and_emit(self, record: logging.LogRecord):
        """Пример ручного управления блокировкой"""
        self.acquire()
        try:
            self.flush()
            self.emit(record)
        finally:
            self.release()  # всегда освобождаем, даже при исключении

h = ManualLockHandler()
h.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

record = logging.LogRecord(
    'demo', logging.INFO, '', 0, 'Тестовая запись', (), None
)
h.safe_flush_and_emit(record)`,
  },
  {
    name: "logging.Handler.removeFilter()",
    description:
      "Удаляет ранее добавленный фильтр из обработчика. После удаления записи, ранее блокируемые этим фильтром, снова начинают передаваться в emit(). Если фильтр не найден — ничего не происходит.",
    syntax: "handler.removeFilter(filter)",
    arguments: [
      {
        name: "filter",
        description:
          "Объект фильтра для удаления — тот же объект, что был передан в addFilter().",
      },
    ],
    example: `import logging

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

# Фильтр: только WARNING и выше
warn_filter = lambda r: r.levelno >= logging.WARNING
handler.addFilter(warn_filter)

logger.info('INFO скрыта фильтром')    # заблокировано
logger.warning('WARNING проходит')     # выводится

# Удаляем фильтр
handler.removeFilter(warn_filter)

logger.info('INFO теперь видна')       # выводится
logger.debug('DEBUG тоже')             # выводится`,
  },
  {
    name: "logging.Handler.setFormatter()",
    description:
      'Устанавливает объект Formatter для обработчика. Определяет, как будет выглядеть итоговая строка лога. Если Formatter не задан — используется базовый формат "%(levelname)s:%(name)s:%(message)s". Один Formatter может быть использован в нескольких обработчиках.',
    syntax: "handler.setFormatter(fmt)",
    arguments: [
      {
        name: "fmt",
        description:
          "Объект logging.Formatter или None для сброса к формату по умолчанию.",
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)

# Простой формат для консоли
console = logging.StreamHandler()
console.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

# Детальный формат для файла
file_h = logging.FileHandler('app.log')
file_h.setFormatter(logging.Formatter(
    fmt='%(asctime)s %(name)s [%(levelname)s] %(funcName)s:%(lineno)d — %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
))

logger.addHandler(console)
logger.addHandler(file_h)

logger.info('Запрос обработан')
# Консоль: INFO: Запрос обработан
# Файл:   2024-01-15 12:00:00 myapp [INFO] main:42 — Запрос обработан

# Сброс форматтера
console.setFormatter(None)  # вернуть к формату по умолчанию
file_h.close()`,
  },
  {
    name: "logging.Handler.setLevel()",
    description:
      "Устанавливает пороговый уровень обработчика. Записи ниже этого уровня не передаются в emit() даже если логгер их пропустил. Позволяет направлять разные уровни в разные обработчики: DEBUG в файл, WARNING в консоль, CRITICAL на почту.",
    syntax: "handler.setLevel(level)",
    arguments: [
      {
        name: "level",
        description:
          'Числовое значение (logging.DEBUG=10, INFO=20, WARNING=30, ERROR=40, CRITICAL=50) или строка ("DEBUG", "WARNING" и т.д.).',
      },
    ],
    example: `import logging

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)  # пропускаем всё

# Консоль получает только WARNING+
console = logging.StreamHandler()
console.setLevel(logging.WARNING)
console.setFormatter(logging.Formatter('CONSOLE %(levelname)s: %(message)s'))

# Файл получает всё начиная с DEBUG
file_h = logging.FileHandler('debug.log')
file_h.setLevel(logging.DEBUG)
file_h.setFormatter(logging.Formatter('FILE %(levelname)s: %(message)s'))

logger.addHandler(console)
logger.addHandler(file_h)

logger.debug('debug')    # → только файл
logger.info('info')      # → только файл
logger.warning('warn')   # → консоль + файл
logger.error('error')    # → консоль + файл
file_h.close()`,
  },
  {
    name: "logging.Handler.set_name()",
    description:
      "Устанавливает имя обработчика. Имя используется для идентификации обработчика при конфигурировании через словарь (dictConfig) или файл конфигурации. Обновляет атрибут name и внутренний реестр обработчиков.",
    syntax: "handler.set_name(name)",
    arguments: [
      {
        name: "name",
        description: "Строковое имя обработчика для идентификации.",
      },
    ],
    example: `import logging

# Создаём и именуем обработчики
console = logging.StreamHandler()
console.set_name('console')
console.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

file_h = logging.FileHandler('app.log')
file_h.set_name('file')

print(console.get_name())  # console
print(file_h.get_name())   # file

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(console)
logger.addHandler(file_h)

# Поиск обработчика по имени
def get_handler(lgr: logging.Logger, name: str):
    return next((h for h in lgr.handlers if h.get_name() == name), None)

h = get_handler(logger, 'console')
if h:
    h.setLevel(logging.ERROR)  # динамически меняем уровень

file_h.close()`,
  },
  {
    name: "logging.Handler.level",
    description:
      "Атрибут, хранящий числовой пороговый уровень обработчика. Записи ниже этого уровня не передаются в emit(). Значение 0 (NOTSET) означает, что обработчик принимает все записи (фильтрация только по уровню логгера). Устанавливается через setLevel().",
    syntax: "handler.level",
    arguments: [],
    example: `import logging

handler = logging.StreamHandler()
print(handler.level)  # 0 (NOTSET) — принимает всё

handler.setLevel(logging.WARNING)
print(handler.level)                      # 30
print(logging.getLevelName(handler.level)) # WARNING

# Проверка: пройдёт ли запись по уровню обработчика
record = logging.LogRecord('test', logging.INFO, '', 0, 'msg', (), None)
print(handler.level <= record.levelno)  # False (30 > 20)

record2 = logging.LogRecord('test', logging.ERROR, '', 0, 'msg', (), None)
print(handler.level <= record2.levelno)  # True (30 ≤ 40)

# Можно читать напрямую для диагностики
logger = logging.getLogger('myapp')
logger.addHandler(handler)
for h in logger.handlers:
    print(f'{type(h).__name__}: level={logging.getLevelName(h.level)}')`,
  },
  {
    name: "logging.Handler.formatter",
    description:
      "Атрибут, ссылающийся на объект Formatter, прикреплённый к обработчику. None если форматтер не задан — в этом случае используется базовый формат. Устанавливается через setFormatter(). Можно читать напрямую для проверки или смены форматтера.",
    syntax: "handler.formatter",
    arguments: [],
    example: `import logging

handler = logging.StreamHandler()
print(handler.formatter)  # None — форматтер не задан

# Установка форматтера
fmt = logging.Formatter('%(asctime)s %(levelname)s: %(message)s')
handler.setFormatter(fmt)
print(handler.formatter)   # <Formatter object>
print(handler.formatter is fmt)  # True — тот же объект

# Динамическая смена форматтера
def switch_to_json_format(h: logging.Handler):
    h.setFormatter(logging.Formatter('{"level":"%(levelname)s","msg":"%(message)s"}'))

switch_to_json_format(handler)
print(handler.formatter._fmt)  # {"level":"%(levelname)s","msg":"%(message)s"}

# Сброс форматтера
handler.setFormatter(None)
print(handler.formatter)  # None`,
  },
  {
    name: "logging.Handler.filters",
    description:
      "Список фильтров, прикреплённых к обработчику. Каждая запись проверяется всеми фильтрами в методе handle() перед вызовом emit(). Изменять напрямую не рекомендуется — используйте addFilter() и removeFilter().",
    syntax: "handler.filters",
    arguments: [],
    example: `import logging

handler = logging.StreamHandler()
print(handler.filters)  # [] — пусто

# Добавляем фильтры
f1 = logging.Filter('myapp')          # только записи логгера myapp.*
f2 = lambda r: 'secret' not in r.getMessage()

handler.addFilter(f1)
handler.addFilter(f2)

print(len(handler.filters))  # 2

# Проверка текущих фильтров
for f in handler.filters:
    print(type(f).__name__ if hasattr(f, 'filter') else 'lambda')

# Очистка всех фильтров через прямой доступ к списку
handler.filters.clear()
print(handler.filters)  # []`,
  },
  {
    name: "logging.Handler.lock",
    description:
      "Атрибут, содержащий объект threading.RLock, обеспечивающий потокобезопасность обработчика. Создаётся автоматически в конструкторе через createLock(). Используется в acquire() и release() вокруг вызова emit(). Может быть None в подклассах без блокировки.",
    syntax: "handler.lock",
    arguments: [],
    example: `import logging
import threading

handler = logging.StreamHandler()
print(type(handler.lock))   # <class '_thread.RLock'>
print(handler.lock)         # <unlocked _thread.RLock object>

# Демонстрация потокобезопасности
def log_from_thread(name: str, h: logging.Handler):
    record = logging.LogRecord(name, logging.INFO, '', 0, f'Поток {name}', (), None)
    h.handle(record)  # автоматически использует lock

threads = [threading.Thread(target=log_from_thread, args=(f't{i}', handler))
           for i in range(5)]
for t in threads:
    t.start()
for t in threads:
    t.join()

# Ручной захват блокировки (редко нужно)
with handler.lock:
    # эксклюзивный доступ к ресурсам обработчика
    print('Блокировка захвачена напрямую')`,
  },
  {
    name: "logging.Handler.name",
    description:
      "Атрибут, хранящий имя обработчика. По умолчанию None. Устанавливается через set_name() или напрямую. Используется для идентификации обработчиков при конфигурации через dictConfig и для поиска обработчика среди нескольких прикреплённых к логгеру.",
    syntax: "handler.name",
    arguments: [],
    example: `import logging

handler = logging.StreamHandler()
print(handler.name)   # None — по умолчанию

# Установка имени
handler.set_name('console')
print(handler.name)   # console

# Прямое присваивание
handler.name = 'stdout-handler'
print(handler.name)   # stdout-handler

# Практическое использование: конфигурация через dictConfig
import logging.config
logging.config.dictConfig({
    'version': 1,
    'handlers': {
        'console': {          # ← это и будет handler.name
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'stream': 'ext://sys.stdout',
        }
    },
    'root': {'level': 'DEBUG', 'handlers': ['console']}
})`,
  },
  {
    name: "logging.StreamHandler",
    description:
      'Обработчик, выводящий записи логов в поток (stream): по умолчанию в sys.stderr. Один из наиболее часто используемых обработчиков. Поддерживает потокобезопасную запись через внутреннюю блокировку. Завершает каждую запись символом из атрибута terminator (по умолчанию "\\n").',
    syntax: "logging.StreamHandler(stream=None)",
    arguments: [
      {
        name: "stream",
        description:
          "Поток для записи (объект с методами write() и flush()). По умолчанию None — используется sys.stderr. Можно передать sys.stdout или любой файлоподобный объект.",
      },
    ],
    example: `import logging
import sys

# Вывод в stderr (по умолчанию)
stderr_handler = logging.StreamHandler()

# Вывод в stdout
stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
stdout_handler.setLevel(logging.INFO)

# Запись в StringIO (полезно для тестов)
import io
buffer = io.StringIO()
buffer_handler = logging.StreamHandler(buffer)
buffer_handler.setFormatter(logging.Formatter('%(message)s'))

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(stdout_handler)
logger.addHandler(buffer_handler)

logger.info('Сообщение для теста')

# Получаем содержимое буфера
output = buffer.getvalue()
print(repr(output))  # 'Сообщение для теста\\n'`,
  },
  {
    name: "logging.StreamHandler.emit()",
    description:
      "Форматирует запись LogRecord и записывает результирующую строку в поток, добавляя terminator. При возникновении исключения вызывает handleError(). Перед записью и после вызывает flush() для гарантированной доставки данных.",
    syntax: "handler.emit(record)",
    arguments: [
      { name: "record", description: "Объект LogRecord для записи в поток." },
    ],
    example: `import logging
import io

# Кастомный StreamHandler с подсчётом записей
class CountingStreamHandler(logging.StreamHandler):
    def __init__(self, stream=None):
        super().__init__(stream)
        self.emit_count = 0

    def emit(self, record: logging.LogRecord):
        self.emit_count += 1
        super().emit(record)  # стандартное форматирование и запись

buffer = io.StringIO()
handler = CountingStreamHandler(buffer)
handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

logger = logging.getLogger('demo')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)
logger.propagate = False

logger.debug('Один')
logger.info('Два')
logger.warning('Три')

print(handler.emit_count)        # 3
print(buffer.getvalue())
# DEBUG: Один
# INFO: Два
# WARNING: Три`,
  },
  {
    name: "logging.StreamHandler.flush()",
    description:
      "Сбрасывает внутренний буфер потока, вызывая stream.flush(). Гарантирует немедленную запись данных из буфера операционной системы. Вызывается автоматически после каждого emit(). Особенно важно при записи в файловые потоки или при перенаправлении вывода.",
    syntax: "handler.flush()",
    arguments: [],
    example: `import logging
import sys

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(message)s'))

logger = logging.getLogger('demo')
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.propagate = False

logger.info('Первое сообщение')
# flush() вызван автоматически после emit()

# Явный вызов flush() — например перед завершением программы
logger.info('Последнее сообщение')
handler.flush()   # гарантируем запись в stdout перед выходом

# Полезно при использовании буферизованного stdout:
# python -u script.py  — отключает буферизацию
# или явный flush() после критических сообщений
logger.critical('Критическая ошибка!')
handler.flush()   # немедленно доставить в терминал`,
  },
  {
    name: "logging.StreamHandler.setStream()",
    description:
      "Заменяет поток, в который пишет обработчик, на новый. Перед заменой сбрасывает буфер старого потока (flush). Позволяет динамически переключать вывод без пересоздания обработчика. Возвращает старый поток.",
    syntax: "handler.setStream(stream)",
    arguments: [
      {
        name: "stream",
        description:
          "Новый поток для записи — объект с методами write() и flush() (например, sys.stdout, открытый файл, io.StringIO).",
      },
    ],
    example: `import logging
import sys
import io

handler = logging.StreamHandler(sys.stderr)
handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))

logger = logging.getLogger('demo')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)
logger.propagate = False

logger.info('В stderr')

# Переключаем на stdout
old_stream = handler.setStream(sys.stdout)
print(f'Старый поток: {old_stream}')   # <_io.TextIOWrapper name='<stderr>'>
logger.info('Теперь в stdout')

# Переключаем на буфер (для захвата вывода в тестах)
buffer = io.StringIO()
handler.setStream(buffer)
logger.warning('В буфер')
logger.error('Тоже в буфер')

print(buffer.getvalue())
# WARNING: В буфер
# ERROR: Тоже в буфер`,
  },
  {
    name: "logging.StreamHandler.terminator",
    description:
      'Атрибут класса, определяющий строку-разделитель, добавляемую в конец каждой записи при выводе в поток. По умолчанию "\\n" (перевод строки). Можно изменить для специальных форматов вывода: например, "\\r\\n" для Windows-совместимости или "" для вывода без переносов строк.',
    syntax: "handler.terminator",
    arguments: [],
    example: `import logging
import sys

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(message)s'))

print(repr(handler.terminator))   # '\\n' — по умолчанию

logger = logging.getLogger('demo')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)
logger.propagate = False

logger.info('Строка 1')   # → 'Строка 1\\n'
logger.info('Строка 2')   # → 'Строка 2\\n'

# Убираем перенос строки — все записи в одну строку
handler.terminator = ' | '
logger.info('A')
logger.info('B')
logger.info('C')
# → A | B | C |

# CRLF для совместимости с Windows
handler.terminator = '\\r\\n'`,
  },
  {
    name: "logging.FileHandler",
    description:
      "Обработчик, записывающий логи в указанный файл. Открывает файл при создании (или при первой записи, если delay=True) и закрывает при вызове close(). Наследует всё поведение StreamHandler. Поддерживает выбор режима открытия, кодировки и обработки ошибок.",
    syntax:
      "logging.FileHandler(filename, mode='a', encoding=None, delay=False, errors=None)",
    arguments: [
      {
        name: "filename",
        description:
          "Путь к файлу лога. Если файл не существует — создаётся автоматически.",
      },
      {
        name: "mode",
        description:
          'Режим открытия файла: "a" (дозапись, по умолчанию) или "w" (перезапись при каждом запуске).',
      },
      {
        name: "encoding",
        description:
          'Кодировка файла (например, "utf-8"). По умолчанию None — используется кодировка платформы.',
      },
      {
        name: "delay",
        description:
          "Если True — файл открывается не при создании обработчика, а при первой записи. Полезно когда файл может не понадобиться.",
      },
      {
        name: "errors",
        description:
          'Режим обработки ошибок кодировки: "strict", "ignore", "replace" и др. (Python 3.9+).',
      },
    ],
    example: `import logging
import os

# Дозапись в файл (режим 'a' по умолчанию)
file_handler = logging.FileHandler('app.log', encoding='utf-8')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(
    logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s')
)

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(file_handler)

logger.info('Приложение запущено')
logger.warning('Предупреждение в файл')
logger.error('Ошибка в файл')

# Перезапись файла при каждом старте (mode='w')
fresh_handler = logging.FileHandler('session.log', mode='w', encoding='utf-8')

# Отложенное открытие — файл создаётся при первой записи
lazy_handler = logging.FileHandler('lazy.log', delay=True)

# Закрываем обработчики после использования
file_handler.close()
fresh_handler.close()
lazy_handler.close()`,
  },
  {
    name: "logging.FileHandler.close",
    description:
      "Метод класса FileHandler модуля logging. Закрывает файл, связанный с обработчиком, и освобождает ресурс. Вызывает родительский метод StreamHandler.close(), который выполняет сброс буфера и снимает обработчик с внутреннего реестра. Необходимо вызывать явно при завершении работы с логгером, либо использовать менеджер контекста.",
    syntax: "handler.close()",
    arguments: [],
    example: `import logging

# Создание обработчика:
handler = logging.FileHandler('app.log', encoding='utf-8')
handler.setLevel(logging.DEBUG)

logger = logging.getLogger('myapp')
logger.addHandler(handler)

logger.info('Сообщение записано в файл')

# Явное закрытие:
handler.close()
logger.removeHandler(handler)

# Предпочтительный способ — через logging.shutdown():
import atexit
atexit.register(logging.shutdown)   # Закроет все обработчики при выходе

# Или через контекстный менеджер (Python 3.11+):
# with logging.FileHandler('app.log') as handler:
#     logger.addHandler(handler)
#     logger.info('Запись')`,
  },
  {
    name: "logging.FileHandler.emit",
    description:
      "Метод класса FileHandler модуля logging. Записывает отформатированную запись лога в файл. Вызывается автоматически при обработке записи — не следует вызывать напрямую в прикладном коде. При ошибке записи вызывает handleError(record).",
    syntax: "handler.emit(record)",
    arguments: [
      {
        name: "record",
        description:
          "Объект LogRecord с данными лог-записи: уровень, сообщение, время, имя логгера и т.д.",
      },
    ],
    example: `import logging

handler = logging.FileHandler('debug.log', encoding='utf-8')
formatter = logging.Formatter('%(asctime)s — %(levelname)s — %(message)s')
handler.setFormatter(formatter)

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

# emit() вызывается автоматически при логировании:
logger.debug('Отладочное сообщение')    # → handler.emit(record)
logger.info('Информационное')
logger.warning('Предупреждение')

# Ручной вызов (нетипично, используется при создании кастомных обработчиков):
record = logging.LogRecord(
    name='myapp', level=logging.INFO,
    pathname=__file__, lineno=10,
    msg='Ручная запись', args=(), exc_info=None,
)
handler.emit(record)
handler.close()`,
  },
  {
    name: "logging.NullHandler",
    description:
      'Класс модуля logging. Обработчик-заглушка, который не выполняет никаких действий с записями лога. Используется в библиотеках для предотвращения предупреждения "No handlers could be found for logger". Рекомендуемая практика: каждая библиотека должна добавлять NullHandler к своему логгеру, оставляя настройку обработчиков пользователям библиотеки.',
    syntax: "handler = logging.NullHandler(level=logging.NOTSET)",
    arguments: [
      {
        name: "level",
        description:
          "Минимальный уровень обрабатываемых записей. По умолчанию NOTSET (0) — обрабатывает все записи.",
      },
    ],
    example: `import logging

# Рекомендуемый паттерн для библиотек:
# В файле mylib/__init__.py или mylib/core.py:
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

# Теперь при использовании библиотеки без настройки логирования
# не будет предупреждений "No handlers could be found"

# Пример библиотечного модуля:
class MyLibrary:
    def __init__(self):
        self.logger = logging.getLogger('mylib.MyLibrary')

    def do_work(self):
        self.logger.info('Выполняется работа')   # Без NullHandler → предупреждение
        return 'результат'

# Пользователь библиотеки сам настраивает обработчики:
logging.basicConfig(level=logging.INFO)
lib = MyLibrary()
lib.do_work()`,
  },
  {
    name: "logging.NullHandler.createLock",
    description:
      "Метод класса NullHandler модуля logging. Устанавливает блокировку (lock) в None вместо создания реального объекта threading.Lock. Поскольку NullHandler не выполняет никаких операций ввода-вывода, блокировка ему не нужна, что делает его максимально лёгким.",
    syntax: "handler.createLock()",
    arguments: [],
    example: `import logging

handler = logging.NullHandler()

# createLock() вызывается автоматически в __init__:
# Устанавливает self.lock = None (без реального мьютекса)
print(handler.lock)   # None

# В отличие от других обработчиков:
file_handler = logging.FileHandler('app.log')
print(file_handler.lock)   # <unlocked _thread.lock object ...>
file_handler.close()

# Это важно для использования в многопоточных приложениях:
# NullHandler безопасен без блокировки, т.к. не делает ничего
logger = logging.getLogger('mylib')
logger.addHandler(handler)
logger.info('Это сообщение просто игнорируется')`,
  },
  {
    name: "logging.NullHandler.emit",
    description:
      "Метод класса NullHandler модуля logging. Ничего не делает — намеренно пустая реализация. Переопределяет абстрактный метод emit() базового класса Handler. Все записи лога, переданные этому обработчику, молча отбрасываются.",
    syntax: "handler.emit(record)",
    arguments: [
      {
        name: "record",
        description:
          "Объект LogRecord. Принимается, но полностью игнорируется.",
      },
    ],
    example: `import logging

handler = logging.NullHandler()

# emit() просто ничего не делает:
record = logging.LogRecord(
    name='test', level=logging.WARNING,
    pathname=__file__, lineno=1,
    msg='Это сообщение будет отброшено', args=(), exc_info=None,
)
handler.emit(record)   # Тишина, никаких действий

# На практике emit() вызывается автоматически:
logger = logging.getLogger('mylib')
logger.addHandler(handler)

logger.warning('Игнорируется')  # → handler.emit(record) → ничего
logger.error('Тоже игнорируется')`,
  },
  {
    name: "logging.NullHandler.handle",
    description:
      "Метод класса NullHandler модуля logging. Обрабатывает запись лога без захвата блокировки (поскольку lock=None). Вызывает emit(), который ничего не делает. Переопределяет метод базового класса Handler для оптимизации: пропускает лишние операции с блокировкой.",
    syntax: "handler.handle(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord для обработки. Полностью игнорируется.",
      },
    ],
    example: `import logging

handler = logging.NullHandler()

record = logging.LogRecord(
    name='test', level=logging.INFO,
    pathname=__file__, lineno=1,
    msg='Тестовая запись', args=(), exc_info=None,
)

# handle() вызывает emit() без блокировки:
handler.handle(record)   # Ничего не происходит

# Сравнение с обычным обработчиком:
import io
stream_handler = logging.StreamHandler(io.StringIO())
stream_handler.handle(record)   # Захватывает lock → вызывает emit() → пишет в поток

# NullHandler.handle() — максимально лёгкий путь:
# 1. Нет захвата блокировки (lock=None)
# 2. Нет форматирования
# 3. Нет записи`,
  },
  {
    name: "logging.Formatter",
    description:
      "Класс модуля logging. Определяет формат вывода лог-записей. Преобразует объект LogRecord в строку с заданным шаблоном, форматом даты и стилем подстановки переменных. Присваивается обработчикам через handler.setFormatter(). Может быть расширен для создания кастомного форматирования.",
    syntax:
      "formatter = logging.Formatter(fmt=None, datefmt=None, style='%', validate=True, defaults=None)",
    arguments: [
      {
        name: "fmt",
        description:
          'Строка формата. По умолчанию None — выводится только сообщение. Пример: "%(asctime)s — %(levelname)s — %(message)s".',
      },
      {
        name: "datefmt",
        description:
          'Формат даты и времени для %(asctime)s. По умолчанию None — используется ISO 8601: "2024-01-15 10:30:00,123".',
      },
      {
        name: "style",
        description:
          'Стиль подстановки: "%" (по умолчанию, %(name)s), "{" (str.format, {name}), "$" (string.Template, ${name}).',
      },
      {
        name: "validate",
        description:
          "Проверять корректность строки формата при создании. По умолчанию True. False — отключить проверку.",
      },
      {
        name: "defaults",
        description:
          "Словарь дополнительных атрибутов для подстановки в fmt. Добавлено в Python 3.10.",
      },
    ],
    example: `import logging

# Базовый форматтер:
formatter = logging.Formatter(
    fmt='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

handler = logging.StreamHandler()
handler.setFormatter(formatter)

logger = logging.getLogger('myapp')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

logger.info('Запуск приложения')
# 2024-01-15 10:30:00 [INFO] myapp: Запуск приложения

# Стиль { (str.format):
formatter2 = logging.Formatter(
    fmt='{asctime} [{levelname}] {name}: {message}',
    style='{',
)

# Кастомный форматтер:
class JsonFormatter(logging.Formatter):
    def format(self, record):
        import json
        return json.dumps({
            'time': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
        })`,
  },
  {
    name: "logging.Formatter.converter",
    description:
      "Атрибут класса Formatter модуля logging. Функция преобразования временной метки (timestamp) в struct_time для форматирования времени. По умолчанию равна time.localtime — время в локальном часовом поясе. Замените на time.gmtime для вывода времени в UTC.",
    syntax: "Formatter.converter = time.localtime",
    arguments: [
      {
        name: "timestamp",
        description:
          "Временная метка в секундах (float), полученная из LogRecord.created.",
      },
    ],
    example: `import logging
import time

# Стандартное поведение — локальное время:
formatter = logging.Formatter('%(asctime)s — %(message)s')
# formatter.converter == time.localtime (по умолчанию)

# Переключение на UTC для конкретного форматтера:
formatter_utc = logging.Formatter('%(asctime)s UTC — %(message)s')
formatter_utc.converter = time.gmtime

handler = logging.StreamHandler()
handler.setFormatter(formatter_utc)

logger = logging.getLogger('myapp')
logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.info('Запись в UTC')
# 2024-01-15 07:30:00,123 UTC — Запись в UTC

# Глобальное переключение на UTC для всех форматтеров:
logging.Formatter.converter = time.gmtime`,
  },
  {
    name: "logging.Formatter.default_msec_format",
    description:
      'Атрибут класса Formatter модуля logging. Строка формата для добавления миллисекунд к строке времени. По умолчанию "%s,%03d" — разделитель запятая между секундами и миллисекундами (пример: "10:30:00,123"). Переопределите для изменения разделителя (например, точка вместо запятой).',
    syntax: "Formatter.default_msec_format",
    arguments: [],
    example: `import logging

# Стандартный формат с запятой:
formatter = logging.Formatter('%(asctime)s — %(message)s')
print(formatter.default_msec_format)   # '%s,%03d'
# Вывод: 2024-01-15 10:30:00,123

# Переопределение для использования точки (ISO 8601):
class ISOFormatter(logging.Formatter):
    default_msec_format = '%s.%03d'

formatter_iso = ISOFormatter('%(asctime)s — %(message)s')

handler = logging.StreamHandler()
handler.setFormatter(formatter_iso)

logger = logging.getLogger('myapp')
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)
logger.debug('Тест')
# 2024-01-15 10:30:00.123 — Тест`,
  },
  {
    name: "logging.Formatter.default_time_format",
    description:
      'Атрибут класса Formatter модуля logging. Строка формата времени для strftime(), применяемая в formatTime() когда datefmt не задан. По умолчанию "%Y-%m-%d %H:%M:%S". Переопределите на уровне класса или экземпляра для изменения базового формата времени.',
    syntax: "Formatter.default_time_format",
    arguments: [],
    example: `import logging

formatter = logging.Formatter('%(asctime)s — %(message)s')
print(formatter.default_time_format)   # '%Y-%m-%d %H:%M:%S'
# Вывод: 2024-01-15 10:30:00,123

# Переопределение формата времени:
class ShortTimeFormatter(logging.Formatter):
    default_time_format = '%H:%M:%S'          # Только время
    default_msec_format = '%s.%03d'           # С точкой

formatter_short = ShortTimeFormatter('%(asctime)s [%(levelname)s] %(message)s')

handler = logging.StreamHandler()
handler.setFormatter(formatter_short)

logger = logging.getLogger('myapp')
logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.info('Короткое время')
# 10:30:00.123 [INFO] Короткое время`,
  },
  {
    name: "logging.Formatter.format",
    description:
      "Метод класса Formatter модуля logging. Преобразует объект LogRecord в итоговую строку лога. Устанавливает атрибуты record.message и record.asctime, применяет fmt-шаблон, при необходимости добавляет информацию об исключении (exc_text) и трассировке стека (stack_info). Вызывается обработчиком автоматически.",
    syntax: "formatted_string = formatter.format(record)",
    arguments: [
      {
        name: "record",
        description: "Объект LogRecord с данными записи лога.",
      },
    ],
    example: `import logging

formatter = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S',
)

# Прямое использование:
record = logging.LogRecord(
    name='myapp', level=logging.ERROR,
    pathname=__file__, lineno=42,
    msg='Ошибка соединения: %s', args=('timeout',), exc_info=None,
)
print(formatter.format(record))
# 10:30:00 [ERROR] myapp: Ошибка соединения: timeout

# Кастомный форматтер с переопределением format():
class RequestFormatter(logging.Formatter):
    def format(self, record):
        record.request_id = getattr(record, 'request_id', '-')
        return super().format(record)

formatter2 = RequestFormatter(
    '%(asctime)s [%(request_id)s] %(levelname)s: %(message)s'
)`,
  },
  {
    name: "logging.Formatter.formatException",
    description:
      "Метод класса Formatter модуля logging. Форматирует информацию об исключении (exc_info) в строку. Принимает кортеж (type, value, traceback) — тот же формат, что возвращает sys.exc_info(). Результат кэшируется в record.exc_text для повторного использования.",
    syntax: "text = formatter.formatException(exc_info)",
    arguments: [
      {
        name: "exc_info",
        description:
          "Кортеж (exc_type, exc_value, exc_traceback) из sys.exc_info(), или None.",
      },
    ],
    example: `import logging
import sys
import traceback

formatter = logging.Formatter('%(asctime)s — %(message)s')

# Прямое форматирование исключения:
try:
    1 / 0
except ZeroDivisionError:
    exc_info = sys.exc_info()
    exc_text = formatter.formatException(exc_info)
    print(exc_text)
    # Traceback (most recent call last):
    #   File "...", line N, in <module>
    #     1 / 0
    # ZeroDivisionError: division by zero

# Автоматически при логировании с exc_info:
logger = logging.getLogger('myapp')
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)

try:
    result = int('не число')
except ValueError:
    logger.error('Ошибка преобразования', exc_info=True)
    # formatException() вызывается автоматически`,
  },
  {
    name: "logging.Formatter.formatMessage",
    description:
      "Метод класса Formatter модуля logging. Применяет fmt-шаблон к атрибутам объекта LogRecord, возвращая итоговую строку сообщения без информации об исключении и трассировке стека. Вызывается внутри format() как основной шаг форматирования.",
    syntax: "message = formatter.formatMessage(record)",
    arguments: [
      {
        name: "record",
        description:
          "Объект LogRecord с установленными атрибутами (включая message, asctime и другие поля шаблона).",
      },
    ],
    example: `import logging

formatter = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

record = logging.LogRecord(
    name='myapp', level=logging.INFO,
    pathname=__file__, lineno=1,
    msg='Пользователь %s вошёл', args=('Иван',), exc_info=None,
)
# Устанавливаем message (обычно делает format()):
record.message = record.getMessage()

result = formatter.formatMessage(record)
print(result)
# 2024-01-15 10:30:00,123 [INFO] myapp: Пользователь Иван вошёл

# Используется при переопределении format() в кастомных форматтерах:
class PrefixFormatter(logging.Formatter):
    def format(self, record):
        record.message = record.getMessage()
        record.asctime = self.formatTime(record, self.datefmt)
        s = self.formatMessage(record)
        return f'>>> {s}'`,
  },
  {
    name: "logging.Formatter.formatStack",
    description:
      "Метод класса Formatter модуля logging. Форматирует информацию о трассировке стека (stack_info) в строку. Принимает строку с трассировкой, возвращённую traceback.print_stack(). Используется при передаче параметра stack_info=True в вызов логгера.",
    syntax: "text = formatter.formatStack(stack_info)",
    arguments: [
      {
        name: "stack_info",
        description:
          "Строка с трассировкой стека из traceback.print_stack(), или None.",
      },
    ],
    example: `import logging

formatter = logging.Formatter('%(asctime)s — %(message)s')

logger = logging.getLogger('myapp')
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

# stack_info=True — добавляет трассировку текущего стека вызовов:
def level3():
    logger.debug('Вызов из level3', stack_info=True)
    # formatStack() вызывается автоматически

def level2():
    level3()

def level1():
    level2()

level1()
# Вывод включит полный стек вызовов:
# 10:30:00,123 — Вызов из level3
# Stack (most recent call last):
#   File "...", line N, in level1 ...

# Прямой вызов:
import io, traceback
buf = io.StringIO()
traceback.print_stack(file=buf)
print(formatter.formatStack(buf.getvalue()))`,
  },
  {
    name: "logging.Formatter.formatTime",
    description:
      "Метод класса Formatter модуля logging. Форматирует временную метку записи (record.created) в строку даты-времени. Использует converter для преобразования в struct_time, затем strftime() с datefmt или default_time_format. Результат используется в поле %(asctime)s.",
    syntax: "time_string = formatter.formatTime(record, datefmt=None)",
    arguments: [
      {
        name: "record",
        description:
          "Объект LogRecord с атрибутом created (временная метка создания).",
      },
      {
        name: "datefmt",
        description:
          "Строка формата для strftime(). Если None — используется default_time_format + default_msec_format.",
      },
    ],
    example: `import logging

formatter = logging.Formatter()

record = logging.LogRecord(
    name='test', level=logging.INFO,
    pathname=__file__, lineno=1,
    msg='Тест', args=(), exc_info=None,
)

# Стандартный формат (с миллисекундами):
print(formatter.formatTime(record))
# 2024-01-15 10:30:00,123

# Кастомный формат:
print(formatter.formatTime(record, datefmt='%d.%m.%Y %H:%M'))
# 15.01.2024 10:30

# Переопределение для ISO 8601:
class ISO8601Formatter(logging.Formatter):
    def formatTime(self, record, datefmt=None):
        import datetime
        dt = datetime.datetime.fromtimestamp(record.created)
        return dt.isoformat(timespec='milliseconds')

formatter_iso = ISO8601Formatter('%(asctime)s — %(message)s')
# Вывод: 2024-01-15T10:30:00.123 — сообщение`,
  },
  {
    name: "logging.Formatter.usesTime",
    description:
      "Метод класса Formatter модуля logging. Возвращает True, если строка формата fmt содержит поле %(asctime)s, иначе False. Используется внутри format() для определения необходимости вызова formatTime() — если %(asctime)s не нужен, форматирование времени пропускается для экономии ресурсов.",
    syntax: "result = formatter.usesTime()",
    arguments: [],
    example: `import logging

# Форматтер с %(asctime)s:
formatter_with_time = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(message)s'
)
print(formatter_with_time.usesTime())   # True

# Форматтер без %(asctime)s:
formatter_no_time = logging.Formatter(
    '[%(levelname)s] %(name)s: %(message)s'
)
print(formatter_no_time.usesTime())   # False

# Используется в кастомных форматтерах при переопределении format():
class OptimizedFormatter(logging.Formatter):
    def format(self, record):
        if self.usesTime():
            record.asctime = self.formatTime(record, self.datefmt)
        record.message = record.getMessage()
        return self.formatMessage(record)

# Стиль "{":
formatter_brace = logging.Formatter('{asctime} {message}', style='{')
print(formatter_brace.usesTime())   # True`,
  },
];
