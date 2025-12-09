# JavaScriptにおける日付とタイムゾーンの扱い方

## 概要

JavaScriptで日付を扱う際、タイムゾーンの問題に注意する必要があります。特に`toISOString()`メソッドはUTC（協定世界時）に変換するため、日本時間（JST, UTC+9）では意図しない日付が表示される場合があります。

## 問題の発生例

### 症状

新規作成ページで日付フィールドに今日の日付を自動入力したいのに、**昨日の日付が表示される**

```html
<!-- 期待値：2025-12-05（今日） -->
<!-- 実際の値：2025-12-04（昨日） -->
<input type="date" value="2025-12-04" />
```

### 原因

```javascript
const date = new Date() // 2025-12-05 01:00:00 JST
date.toISOString()      // "2025-12-04T16:00:00.000Z" (UTC)
  .split('T')[0]        // "2025-12-04" ← 前日になってしまう！
```

**なぜ前日になるのか？**

- 日本時間：2025-12-05 01:00 JST（UTC+9）
- UTC時間：2025-12-04 16:00 UTC（-9時間）
- 結果：日付部分だけ取り出すと「2025-12-04」になる

## 解決方法：タイムゾーンオフセットの調整

### コード例

```javascript
new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000)
  .toISOString()
  .split('T')[0]
```

### ステップごとの解説

#### 1. `getTimezoneOffset()`でタイムゾーンのオフセットを取得

```javascript
const date = new Date()
date.getTimezoneOffset() // -540（分単位）
```

- **戻り値は分単位**
- 日本時間（JST）の場合：`-540`分（= -9時間）
- マイナスの値 = UTCより進んでいる

#### 2. 分をミリ秒に変換

```javascript
const offsetInMinutes = -540
const offsetInMilliseconds = offsetInMinutes * 60000
// -540 × 60000 = -32400000ミリ秒
```

**なぜ60000を掛けるのか？**

- 1分 = 60秒
- 1秒 = 1000ミリ秒
- 1分 = 60 × 1000 = 60000ミリ秒

#### 3. タイムスタンプから時差分を引く

```javascript
const date = new Date() // 2025-12-05 01:00:00 JST
const timestamp = date.getTime() // 1733407200000（ミリ秒）
const offset = date.getTimezoneOffset() * 60000 // -32400000

const adjustedTimestamp = timestamp - offset
// 1733407200000 - (-32400000) = 1733439600000
// （引くとマイナスのマイナスで実質足される）
```

#### 4. 調整後の日付を作成してISO文字列に変換

```javascript
new Date(adjustedTimestamp).toISOString()
// "2025-12-05T00:00:00.000Z"

.split('T')[0]
// "2025-12-05" ← 正しい日付！
```

## 実装例：日報アプリでの使用

### DailyReportForm.tsxの日付フィールド

```typescript
<input
  type="date"
  id="date"
  name="date"
  value={
    formData.date instanceof Date
      ? new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0]
      : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0]
  }
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg..."
/>
```

### 三項演算子による分岐

```javascript
formData.date instanceof Date
  ? /* ケース1: formData.dateがDateオブジェクトの場合 */
    new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0]
  : /* ケース2: formData.dateがDateオブジェクトでない場合（フォールバック） */
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0]
```

### 分岐の理由

| ケース | 状況 | 使用する日付 |
|--------|------|------------|
| **ケース1** | `formData.date`が正常にDateオブジェクト | `formData.date`を使う |
| **ケース2** | `formData.date`が`undefined`や文字列など | `new Date()`（現在時刻）を使う |

これは**防御的プログラミング**の一例で、予期しないエラーを防ぐための安全策です。

## データの流れ

### 新規作成ページ（app/reports/new/page.tsx）

```typescript
<DailyReportForm
  onSubmit={handleSubmit}
  initialData={{ date: new Date() }}  // ← ブラウザで new Date() を作成
/>
```

**流れ：**
```
ブラウザ（new Date()）
  ↓ props
DailyReportForm
  ↓ useState
formData.date
```

### 編集ページ（app/reports/[id]/page.tsx）

```typescript
// 1. APIから日報データを取得
const res = await fetch(`/api/reports/${id}`)
const data = await res.json()

// 2. 文字列をDateオブジェクトに変換してフォームに渡す
<DailyReportForm
  onSubmit={handleUpdate}
  initialData={{
    date: new Date(report.date),  // ← 文字列→Dateオブジェクト
    // ...
  }}
  isEditing={true}
/>
```

**流れ：**
```
API（文字列）
  ↓ new Date() で変換
親コンポーネント
  ↓ props
DailyReportForm
  ↓ useState
formData.date
```

## よくある間違い

### ❌ 間違い：タイムゾーンを考慮しない

```javascript
// これだとUTCに変換されて前日になる可能性がある
const date = new Date()
const dateString = date.toISOString().split('T')[0]
```

### ✅ 正解：タイムゾーンオフセットを調整

```javascript
const date = new Date()
const dateString = new Date(
  date.getTime() - date.getTimezoneOffset() * 60000
).toISOString().split('T')[0]
```

## まとめ

| 項目 | 説明 |
|------|------|
| **問題** | `toISOString()`はUTCに変換するため、日本時間では日付がずれる |
| **解決策** | タイムゾーンオフセットを引いて調整する |
| **計算式** | `getTime() - getTimezoneOffset() * 60000` |
| **60000の意味** | 1分 = 60秒 × 1000ミリ秒 = 60000ミリ秒 |
| **getTimezoneOffset()** | UTC との時差を分単位で返す（JST = -540） |
| **防御的プログラミング** | フォールバックとして`new Date()`を用意 |

## 参考リンク

- [MDN - Date.prototype.getTimezoneOffset()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset)
- [MDN - Date.prototype.toISOString()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [MDN - Date.prototype.getTime()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime)

## 重要なポイント

1. **JavaScriptのDateオブジェクトは内部的にUTC（協定世界時）で管理される**
2. **`toISOString()`は常にUTC時間を返す**
3. **ローカル時間で日付を扱いたい場合は、タイムゾーンオフセットを考慮する必要がある**
4. **フォールバック（安全策）を用意することで、予期しないエラーを防げる**
