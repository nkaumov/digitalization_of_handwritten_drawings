# Этап 2. Сущности и внутренние контракты MVP-системы цифровизации чертежей

## Зачем нужен этот этап

Этот этап нужен, чтобы до начала активной разработки зафиксировать:
- какие основные сущности есть в системе;
- какие поля они содержат;
- как данные передаются между frontend, backend и AI-сервисом;
- какие статусы и правила должны соблюдаться;
- какой минимальный внутренний контракт должен быть у цифрового чертежа.

Этот документ написан в прикладном виде, чтобы его было удобно использовать как контекст для Codex при генерации типов, DTO, схем БД, API и модулей редактора.

---

# 1. Основные сущности системы

## 1.1. Drawing

### Назначение
Корневая сущность чертежа.
Один drawing — это один редактируемый цифровой документ внутри системы.

### Минимальные поля
- `id: string`
- `title: string`
- `sourceType: 'blank' | 'photo'`
- `status: DrawingStatus`
- `locale: string`
- `createdAt: string`
- `updatedAt: string`

### Примечание
Если drawing создан по фото, то он дополнительно связан с recognition job и исходным изображением.

---

## 1.2. Contour

### Назначение
Отдельный контур внутри чертежа.
В одном чертеже может быть несколько контуров.

### Минимальные поля
- `id: string`
- `drawingId: string`
- `index: number`
- `closed: boolean`
- `confidence: number | null`
- `warnings: WarningItem[]`

### Примечание
Контур состоит из точек, сегментов и привязанных размеров.

---

## 1.3. Point

### Назначение
Узел геометрии.

### Минимальные поля
- `id: string`
- `contourId: string`
- `x: number`
- `y: number`
- `label?: string`

### Примечание
Координаты хранятся во внутренней системе координат редактора.

---

## 1.4. Segment

### Назначение
Прямой отрезок между двумя точками.

### Минимальные поля
- `id: string`
- `contourId: string`
- `fromPointId: string`
- `toPointId: string`
- `kind: 'line'`
- `order: number`
- `confidence: number | null`

### Примечание
В MVP поддерживается только `kind: 'line'`.

---

## 1.5. Dimension

### Назначение
Числовой размер, привязанный к сегменту.

### Минимальные поля
- `id: string`
- `segmentId: string`
- `rawText: string`
- `parsedValue: number | null`
- `normalizedValueMm: number | null`
- `assumedUnit: 'mm' | 'cm' | 'm' | 'unknown'`
- `confidence: number | null`
- `isResolved: boolean`
- `warnings: WarningItem[]`

### Примечание
`rawText` хранит исходный распознанный текст, `normalizedValueMm` — итоговое число в мм для внутренней модели.

---

## 1.6. RecognitionJob

### Назначение
Служебная сущность процесса распознавания изображения.

### Минимальные поля
- `id: string`
- `drawingId: string`
- `status: RecognitionJobStatus`
- `inputImagePath: string`
- `normalizedImagePath?: string`
- `resultPayload?: DrawingPayload`
- `debugPayload?: RecognitionDebugPayload`
- `errorMessage?: string`
- `startedAt?: string`
- `finishedAt?: string`

### Примечание
RecognitionJob нужен для разделения редактора и AI-пайплайна.

---

## 1.7. StoredFile

### Назначение
Служебная сущность файла, загруженного или сгенерированного системой.

### Минимальные поля
- `id: string`
- `kind: 'source_image' | 'normalized_image' | 'debug_artifact' | 'export_pdf' | 'export_image'`
- `path: string`
- `mimeType: string`
- `size: number`
- `createdAt: string`

---

# 2. Статусы

## 2.1. DrawingStatus

```ts
export type DrawingStatus =
  | 'draft'
  | 'blank_ready'
  | 'recognition_pending'
  | 'recognition_processing'
  | 'recognized'
  | 'needs_review'
  | 'saved'
  | 'error';
```

### Смысл статусов
- `draft` — сущность создана, но еще не наполнена
- `blank_ready` — создан пустой чертеж
- `recognition_pending` — фото загружено, задача поставлена в очередь
- `recognition_processing` — AI-сервис обрабатывает изображение
- `recognized` — результат распознавания готов
- `needs_review` — результат есть, но есть warnings или низкая уверенность
- `saved` — пользователь сохранил актуальное состояние
- `error` — произошла ошибка

---

## 2.2. RecognitionJobStatus

```ts
export type RecognitionJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';
```

---

# 3. Warning-модель

## 3.1. WarningItem

### Назначение
Универсальный формат предупреждений для размеров, контуров, распознавания и импорта.

### Минимальная структура
```ts
export interface WarningItem {
  code: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  source?: string;
}
```

### Примеры кодов
- `LOW_OCR_CONFIDENCE`
- `UNRESOLVED_DIMENSION`
- `CONTOUR_NOT_CLOSED`
- `AMBIGUOUS_UNIT`
- `SEGMENT_MATCH_CONFLICT`
- `LOW_LINE_CONFIDENCE`

---

# 4. Главный внутренний контракт чертежа

## 4.1. DrawingPayload

Это главный payload, который:
- AI-сервис отдает в backend;
- backend сохраняет;
- frontend загружает в редактор.

```ts
export interface DrawingPayload {
  version: string;
  drawingId: string;
  unit: 'mm';
  contours: ContourPayload[];
  warnings: WarningItem[];
  confidence: number | null;
}
```

---

## 4.2. ContourPayload

```ts
export interface ContourPayload {
  id: string;
  closed: boolean;
  confidence: number | null;
  points: PointPayload[];
  segments: SegmentPayload[];
  dimensions: DimensionPayload[];
  warnings: WarningItem[];
}
```

---

## 4.3. PointPayload

```ts
export interface PointPayload {
  id: string;
  x: number;
  y: number;
  label?: string;
}
```

---

## 4.4. SegmentPayload

```ts
export interface SegmentPayload {
  id: string;
  from: string;
  to: string;
  kind: 'line';
  order: number;
  confidence: number | null;
}
```

---

## 4.5. DimensionPayload

```ts
export interface DimensionPayload {
  id: string;
  segmentId: string;
  rawText: string;
  parsedValue: number | null;
  normalizedValueMm: number | null;
  assumedUnit: 'mm' | 'cm' | 'm' | 'unknown';
  confidence: number | null;
  isResolved: boolean;
  warnings: WarningItem[];
}
```

---

# 5. Debug-контракт для AI-сервиса

Этот payload не показывается пользователю напрямую, но нужен разработчику.

```ts
export interface RecognitionDebugPayload {
  sourceImagePath: string;
  normalizedImagePath?: string;
  detectedLines?: DetectedLineDebugItem[];
  detectedTextBlocks?: DetectedTextDebugItem[];
  rawOcrItems?: RawOcrDebugItem[];
  contourCandidates?: ContourCandidateDebugItem[];
  notes?: string[];
}
```

### Укрупненно достаточно зафиксировать, что debug payload должен хранить:
- исходное изображение;
- нормализованное изображение;
- найденные линии;
- найденные текстовые блоки;
- сырые OCR-результаты;
- кандидаты контуров;
- служебные заметки пайплайна.

---

# 6. Правила внутренней модели

## 6.1. Общие правила
1. Один drawing может содержать несколько contour.
2. Один contour содержит только прямые segments.
3. Один segment ссылается ровно на две точки.
4. Размер должен быть привязан к segment, а не просто лежать отдельно.
5. Все нормализованные значения размеров хранятся в мм.
6. Любые исходные распознанные данные должны сохраняться отдельно от нормализованных.
7. Warnings не блокируют открытие результата в редакторе.
8. Низкая уверенность не должна приводить к потере данных.

## 6.2. Что считаем обязательным минимумом для готового распознанного контура
Контур считается минимально пригодным для открытия в редакторе, если:
- у него есть хотя бы 2 точки;
- у него есть хотя бы 1 сегмент;
- структура payload валидна;
- результат можно визуализировать.

Даже если контур не замкнулся идеально, он все равно может быть открыт, но с warning.

---

# 7. Минимальные API-контракты

## 7.1. Создать пустой чертеж

### Request
```json
{
  "title": "Новый чертеж",
  "sourceType": "blank",
  "locale": "ru"
}
```

### Response
```json
{
  "id": "drawing_001",
  "status": "blank_ready"
}
```

---

## 7.2. Создать чертеж по фото

### Шаг 1. Создать drawing
```json
{
  "title": "Чертеж по фото",
  "sourceType": "photo",
  "locale": "ru"
}
```

### Шаг 2. Загрузить изображение и запустить recognition job

Response backend может выглядеть так:
```json
{
  "drawingId": "drawing_002",
  "jobId": "job_001",
  "status": "recognition_pending"
}
```

---

## 7.3. Получить статус recognition job

### Response
```json
{
  "jobId": "job_001",
  "status": "processing"
}
```

или

```json
{
  "jobId": "job_001",
  "status": "completed",
  "drawingStatus": "recognized"
}
```

---

## 7.4. Получить drawing для редактора

### Response
```json
{
  "id": "drawing_002",
  "title": "Чертеж по фото",
  "status": "needs_review",
  "payload": {
    "version": "1.0",
    "drawingId": "drawing_002",
    "unit": "mm",
    "contours": [],
    "warnings": [],
    "confidence": 0.83
  }
}
```

---

## 7.5. Сохранить чертеж из редактора

### Request
```json
{
  "payload": {
    "version": "1.0",
    "drawingId": "drawing_002",
    "unit": "mm",
    "contours": [],
    "warnings": [],
    "confidence": 0.83
  }
}
```

### Response
```json
{
  "id": "drawing_002",
  "status": "saved"
}
```

---

# 8. Минимальный контракт между backend и AI-сервисом

## 8.1. Запрос от backend в AI-service

```json
{
  "jobId": "job_001",
  "drawingId": "drawing_002",
  "imagePath": "/data/uploads/source.jpg",
  "options": {
    "detectMultipleContours": true,
    "allowedSegmentKinds": ["line"],
    "targetUnit": "mm"
  }
}
```

---

## 8.2. Ответ AI-service в backend

```json
{
  "jobId": "job_001",
  "status": "completed",
  "resultPayload": {
    "version": "1.0",
    "drawingId": "drawing_002",
    "unit": "mm",
    "contours": [],
    "warnings": [],
    "confidence": 0.83
  },
  "debugPayload": {
    "sourceImagePath": "/data/uploads/source.jpg"
  }
}
```

---

# 9. Правила нормализации размеров

## Что фиксируем сразу
1. Базовая внутренняя единица — мм.
2. `rawText` хранится всегда, если OCR что-то прочитал.
3. `parsedValue` — число после первичного парса.
4. `normalizedValueMm` — итог после попытки определить единицу.
5. `assumedUnit` может быть `unknown`, если система не уверена.
6. Если единицу не удалось определить надежно, это не должно ломать payload.
7. Спорные случаи должны сопровождаться warning.

---

# 10. Что должно быть сгенерировано в коде после этого этапа

На основе этого документа Codex должен уметь сгенерировать:

## Для frontend
- типы payload;
- типы drawing state;
- типы editor entities;
- типы warnings;
- типы API-ответов.

## Для backend
- DTO;
- entity-модели;
- схемы БД;
- API-контракты;
- сервисные типы recognition job.

## Для AI-service
- Pydantic-модели;
- внутренние dataclass/схемы pipeline;
- контракт результата распознавания;
- контракт debug payload.

---

# 11. Что не нужно усложнять на этом этапе

На этом этапе не нужно:
- детально проектировать undo/redo;
- детально проектировать экспорт;
- проектировать трубы, бруски и другие элементы;
- проектировать кривые и дуги;
- проектировать внешнюю модульную систему установки;
- проектировать сложные права доступа;
- проектировать полноценную CAD-математику.

Этот этап нужен только для того, чтобы зафиксировать понятный каркас сущностей и контрактов.

---

# 12. Короткий итог этапа 2

На втором этапе мы зафиксировали:
1. главный набор сущностей системы;
2. обязательные поля этих сущностей;
3. статусы drawing и recognition job;
4. главный payload цифрового чертежа;
5. debug payload для AI-пайплайна;
6. минимальные API-контракты;
7. правила нормализации размеров;
8. границы того, что пока не нужно усложнять.

После этого этапа можно переходить к генерации базовых файлов проекта через Codex:
- frontend types;
- backend DTO и entity;
- AI-service models;
- базовые API-маршруты;
- каркас editor state.

