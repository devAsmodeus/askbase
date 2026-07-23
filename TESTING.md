# Проверка сайта и чата

## Полный чек-лист проверки сайта

Порядок сквозной приёмки — сверху вниз, ~15 минут.

1. **Запуск.** `node --use-system-ca node_modules/next/dist/bin/next dev`,
   открыть http://localhost:3000.
2. **Лендинг.** Фон живой: градиент медленно переливается, «созвездие» узлов
   дрейфует, при движении мыши узлы тянутся к курсору и связи подсвечиваются.
   В hero чат-виджет сам проигрывает диалог по кругу. Прокрутить вниз:
   бегущая строка едет; секция **How it works залипает** на экран и шаги
   01→02→03 сменяются прокруткой (фон меняет оттенок); карточки появляются
   с анимацией — и повторно при возврате вверх/вниз. Пузырь чата в правом
   нижнем углу — это живой виджет: открыть, задать вопрос.
3. **Регистрация** (`/login`): создать аккаунт с любой почтой (подтверждение
   не требуется) — попадаете в дашборд.
4. **Бот.** «New chatbot» → имя. Free-план: попытка создать второго бота
   должна упереться в лимит (кнопка превратится в Upgrade).
5. **Знания.** Вкладка Knowledge → загрузить файлы из [`samples/`](samples)
   (см. таблицу ниже): каждый должен стать `ready` с числом chunks.
   Файл больше 2 MB на Free — должен быть отклонён.
6. **Чат.** Вкладка Playground → вопросы из таблиц ниже; ответы стримятся,
   под ними чипы источников.
7. **Виджет.** Вкладка Embed → «Copy snippet» → вставить в любой локальный
   `test.html` перед `</body>`, открыть файл в браузере — справа внизу
   пузырь, чат отвечает. Каждый вопрос увеличивает счётчик на
   `/app/billing` (+1 widget message); вопросы в Playground — нет.
8. **Домены.** Settings → Allowed domains → вписать `example.com` → виджет
   из локального `test.html` должен получить отказ; очистить — снова работает.
9. **Кастомизация.** Settings → сменить accent color и welcome message →
   виджет и лендинговый пузырь перекрашиваются.
10. **Биллинг.** Plan & Billing → Upgrade to Pro → предзаполненная карта
    `4242…` → после «оплаты» квоты растут (100 → 2000), бейдж «Powered by
    AskBase» исчезает из виджета, событие появляется в Billing history.
11. **Автотест чата** — см. «Автоматическая проверка» ниже.

---

# Проверка работоспособности чата

Инструкция: как убедиться, что RAG-чат отвечает правильно — на конкретных
примерах «что спрашиваем → что ожидаем». Проверяется и вручную, и скриптом.

## Режимы ответов

Приложение отвечает в одном из трёх режимов (приоритет сверху вниз):

| Режим | Когда включён | Что отвечает |
|---|---|---|
| **Claude** | задан `ANTHROPIC_API_KEY` | Полноценный AI-ответ по найденным пассажам |
| **Локальная модель** | задан `LOCAL_LLM_BASE_URL` (без Anthropic-ключа) | То же, но через ваш OpenAI-совместимый сервер |
| **Demo** | ключей нет | Дословно цитирует самые релевантные пассажи |

Ретривал (эмбеддинги + pgvector) работает во **всех** режимах — demo-режим
проверяет весь конвейер, кроме генерации.

### Подключение офисной локальной модели

Подходит любой OpenAI-совместимый сервер: Ollama, OpenWebUI, vLLM, LM Studio.
В `.env.local`:

```bash
LOCAL_LLM_BASE_URL=http://<хост-офисной-модели>:11434/v1   # база до /chat/completions
LOCAL_LLM_MODEL=llama3.1                                   # имя модели на сервере
LOCAL_LLM_API_KEY=                                         # если сервер требует Bearer-токен
```

Проверка, что сервер доступен с вашей машины:

```bash
curl http://<хост>:11434/v1/models
```

После правки `.env.local` перезапустите dev-сервер.

## Готовые файлы-примеры

В [`samples/`](samples) лежит набор файлов вымышленного магазина Nordwind —
загрузите их в бота через **Knowledge → Upload file** и проверяйте на реальных
форматах:

| Файл | Формат | Что внутри | Пример вопроса для проверки |
|---|---|---|---|
| `shipping-and-returns.md` | Markdown с таблицей | Доставка, возврат, оплата | *How much is same-day delivery in Vilnius?* → $9.99, до 22:00 |
| `product-catalog.csv` | CSV-таблица | 8 товаров: цены, размеры, уход | *What sizes does the Aurora Parka come in?* → XS–XL, $189 |
| `warranty-policy.txt` | Plain text | Сроки и условия гарантии | *Is the backpack warranty lifetime?* → да, Basecamp — lifetime |
| `faq-ru.md` | Markdown (русский) | FAQ на русском | *Можно ли оплатить криптовалютой?* → нет |
| `support-handbook.pdf` | PDF | Регламент поддержки | *When can an agent give a discount above 10%?* → нужен менеджер |

Кросс-документный вопрос (проверяет поиск по нескольким файлам сразу):
*«I bought Trailhead boots 3 weeks ago and the sole is coming off — what are my
options?»* — ответ должен объединить возврат в 30 дней (`shipping-and-returns.md`)
и двухлетнюю гарантию на обувь (`warranty-policy.txt`).

## Подготовка: тестовый документ

Создайте бота и вставьте через **Knowledge → Paste text** документ с названием
`Shipping FAQ`:

```text
Shipping policy: We ship worldwide. Standard delivery takes 5-7 business days
and costs $4.99. Express delivery takes 1-2 business days and costs $14.99.
Orders over $50 ship free with standard delivery. Returns: You can return any
item within 30 days of delivery for a full refund. Items must be unused and in
original packaging. To start a return, email support@example.com with your
order number. Refunds are processed within 5 business days after we receive
the item. Order tracking: After your order ships you will receive a tracking
link by email. If the tracking page shows no updates for 48 hours, contact our
support team. Payment: We accept Visa, Mastercard, PayPal and Apple Pay. We do
not accept cash on delivery.
```

Ожидание: документ переходит в статус `ready`, счётчик chunks ≥ 1.

## Ручная проверка: вопросы и ожидаемые ответы

Задавайте в **Playground** (или в виджете):

| # | Вопрос | Ожидание в AI-режиме | Ожидание в demo-режиме |
|---|---|---|---|
| 1 | How much does express shipping cost and how long does it take? | Ответ содержит **$14.99** и **1–2 business days**; под ответом чип источника `Shipping FAQ` | Цитата пассажа с этими же цифрами + пометка «Demo mode» |
| 2 | Can I return an item after 45 days? | «Нет — возврат в течение **30 days**…» (модель должна сама сделать вывод, что 45 > 30) | Цитата пассажа про возврат в 30 дней |
| 3 | Do you accept cash on delivery? | «Нет, но принимаем Visa, Mastercard, PayPal, Apple Pay» | Цитата пассажа про оплату |
| 4 | What is the capital of France? | **Отказ**: «этого нет в базе знаний, обратитесь к команде» — бот не должен выдумывать | Показ пассажей (ограничение demo-режима — это нормально) |
| 5 | How much does express shipping cost? → следом: *And how long does that take?* | Второй ответ понимает контекст: **1–2 business days** | Не проверяется (demo не ведёт диалог) |

Общие ожидания в любом режиме:

- ответ **стримится** (появляется по частям, есть индикатор набора);
- под ответом — **чипы источников** с названиями документов;
- сообщения в Playground **не** списывают квоту, сообщения в виджете — списывают
  (проверьте счётчик на `/app/billing`: +1 за каждый вопрос в виджете).

## Автоматическая проверка (смоук-скрипт)

Скрипт гоняет вопросы 1–5 через публичный API виджета и сверяет ответы:

```bash
node scripts/chat-smoke.mjs <bot-public-id> [http://localhost:3000]
```

`bot-public-id` берётся из вкладки **Embed** (значение `data-bot-id` в сниппете).

Ожидаемый результат с LLM — `All checks passed ✅` (5 PASS).
В demo-режиме проверки 4–5 помечаются `SKIP` — это ожидаемо.

## Что считается багом

- Ответ содержит факты, которых нет в документе (галлюцинация) — проверка 4.
- Нет чипов источников при существующем релевантном документе.
- Виджет отвечает, но квота на `/app/billing` не растёт.
- `mode` в мета-строке ответа не совпадает с настроенным режимом
  (`ai` при заданном ключе/URL, `demo` без них).
