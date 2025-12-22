# React Native モバイルアプリ開発計画

## 目次
1. [重要: バックエンドとフロントエンドの分担](#重要-バックエンドとフロントエンドの分担)
2. [現状分析](#現状分析)
3. [技術スタック](#技術スタック)
4. [重大な問題点](#重大な問題点)
5. [開発フェーズ](#開発フェーズ)
6. [詳細タスクリスト](#詳細タスクリスト)
7. [技術的な実装方針](#技術的な実装方針)
8. [出退勤アプリとの連携構想](#出退勤アプリとの連携構想)

---

## 重要: バックエンドとフロントエンドの分担

### バックエンド（API）- Next.jsの既存APIをそのまま使う

**新規作成は不要です。Next.jsにすでに実装されているAPIをそのまま使います。**

```
【Next.js Web版 - すでに実装済み】
web/app/api/
├── auth/
│   ├── login/route.ts         ✅ POST /api/auth/login
│   ├── signup/route.ts        ✅ POST /api/auth/signup
│   ├── logout/route.ts        ✅ POST /api/auth/logout
│   └── me/route.ts            ✅ GET  /api/auth/me
├── reports/
│   ├── route.ts               ✅ GET  /api/reports（一覧）
│   │                          ✅ POST /api/reports（作成）
│   └── [id]/route.ts          ✅ GET  /api/reports/[id]（詳細）
│                              ✅ PUT  /api/reports/[id]（更新）
│                              ✅ DELETE /api/reports/[id]（削除）
└── admin/
    ├── reports/route.ts       ✅ GET  /api/admin/reports
    ├── users/route.ts         ✅ GET  /api/admin/users
    └── log/route.ts           ✅ GET  /api/admin/log

→ これらのAPIは Web版もモバイル版も共通で使える
→ 新規にAPIを作る必要はない
```

### フロントエンド（UI）- React Native用に新規作成が必要

**UIライブラリが違うため、画面コンポーネントは別々に作る必要があります。**

```
【Web版（Next.js）】           【モバイル版（React Native）】
HTML要素を使用                React Native要素を使用

login/page.tsx               screens/LoginScreen.tsx  ← 新規作成
├── <div>                    ├── <View>
├── <input>                  ├── <TextInput>
└── <button>                 └── <TouchableOpacity>

signup/page.tsx              screens/SignupScreen.tsx ← 新規作成

contexts/AuthContext.tsx     contexts/AuthContext.tsx ← 新規作成
（Cookie自動管理）            （SecureStore手動管理）
```

### 認証フローの比較

#### Web版の認証フロー

```
1. ユーザーが社員番号・パスワードを入力
   ↓
2. POST /api/auth/login を呼び出す
   ↓
3. サーバーがJWTトークンを生成
   ↓
4. サーバーがCookieにトークンを保存（Set-Cookie）
   ↓
5. 以降のAPIリクエストで、Cookieが自動的に送信される
   （ブラウザが自動管理）
```

#### モバイル版の認証フロー

```
1. ユーザーが社員番号・パスワードを入力
   ↓
2. POST /api/auth/login を呼び出す（同じAPI）
   ↓
3. サーバーがJWTトークンを生成
   ↓
4. モバイルアプリがSecureStoreにトークンを保存
   （アプリが手動管理）
   ↓
5. 以降のAPIリクエストで、Authorization: Bearer <token>
   ヘッダーを手動で追加
```

**違いはトークンの保存方法だけ**:
- Web版: Cookie（ブラウザが自動管理）
- モバイル版: SecureStore（アプリが手動管理）

### React Nativeからの使用例

```typescript
// mobile/api/auth.ts（新規作成）
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const login = async (employeeNumber: string, password: string) => {
  // Next.jsの既存APIをそのまま呼び出す
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeNumber, password }),
  })

  const data = await response.json()

  // トークンを保存（Web版はCookie、モバイル版はSecureStore）
  await SecureStore.setItemAsync('jwt_token', data.token)

  return data
}

// mobile/api/reports.ts（修正）
import { getToken } from './auth'

export const getReports = async (): Promise<DailyReport[]> => {
  const token = await getToken()

  // Next.jsの既存APIをそのまま呼び出す
  const response = await fetch(`${API_URL}/api/reports`, {
    headers: {
      'Authorization': `Bearer ${token}`,  // トークンを手動で追加
      'Content-Type': 'application/json',
    },
  })

  return response.json()
}
```

### まとめ: 実装が必要なもの・不要なもの

#### 実装不要（Next.jsの既存を使う）

```
✅ バックエンドAPI
├── /api/auth/login
├── /api/auth/signup
├── /api/reports
└── その他すべてのAPI

→ すでに実装済み、そのまま使う
```

#### 実装必要（React Native用に新規作成）

```
❌ フロントエンド画面
├── mobile/screens/LoginScreen.tsx       - ログイン画面
├── mobile/screens/SignupScreen.tsx      - サインアップ画面（任意）
├── mobile/contexts/AuthContext.tsx      - 認証状態管理
└── mobile/api/auth.ts                   - 認証APIクライアント
                                          （既存APIを呼び出すラッパー）

→ UIライブラリが違うので新規作成が必要
```

---

## 現状分析

### 実装済みファイル

```
mobile/
├── package.json          # 依存パッケージ管理
├── App.tsx              # エントリーポイント
├── screens/             # 画面コンポーネント
│   ├── HomeScreen.tsx        # 日報一覧画面（実装済み、要修正）
│   ├── NewReportScreen.tsx   # 新規日報作成画面（実装済み、要修正）
│   └── ReportDetailScreen.tsx # 日報詳細画面（実装済み、要修正）
├── api/
│   └── reports.ts       # Web API クライアント（認証なし、要修正）
├── lib/
│   └── supabase.ts      # Supabase クライアント（未使用）
└── types/
    └── daily-report.ts  # 型定義（正しい、Web版と一致）
```

### 実装済み機能

1. **画面構成**:
   - Home（日報一覧）
   - NewReport（新規作成）
   - ReportDetail（詳細表示）

2. **ナビゲーション**:
   - React Navigation Stack Navigator
   - 画面遷移の基本実装

3. **API連携の骨組み**:
   - Web API へのfetchベースのリクエスト
   - CRUD操作の関数定義

### 実装済みだが使用されていないもの

- Supabase クライアント (`lib/supabase.ts`)
- 正しい型定義（`types/daily-report.ts`）

---

## 技術スタック

### 現在使用中

| 技術 | バージョン | 用途 |
|-----|----------|------|
| **Expo** | ~54.0.25 | React Native フレームワーク |
| **React** | 19.1.0 | UI ライブラリ |
| **React Native** | 0.81.5 | ネイティブアプリ開発 |
| **TypeScript** | ~5.9.2 | 型安全性 |
| **React Navigation** | v7 | 画面ナビゲーション |
| **@supabase/supabase-js** | ^2.86.0 | Supabase クライアント（未使用） |

### 追加すべきパッケージ

| パッケージ | 用途 | 優先度 |
|-----------|------|-------|
| **@react-native-async-storage/async-storage** | JWT トークン保存 | 最高 |
| **expo-secure-store** | 安全なトークン保存（AsyncStorageより安全） | 最高 |
| **axios** | HTTPクライアント（fetchより高機能） | 高 |
| **react-hook-form** | フォーム管理 | 中 |
| **expo-notifications** | プッシュ通知 | 中 |
| **expo-location** | 位置情報 | 中 |
| **expo-sqlite** | オフライン対応 | 中 |
| **zustand** or **@tanstack/react-query** | 状態管理・キャッシュ | 中 |

---

## 重大な問題点

### 1. 認証機能が完全に欠如

**現状**:
```typescript
// api/reports.ts
export const getReports = async (): Promise<DailyReport[]> => {
  const response = await fetch(`${API_URL}/api/reports`)
  // ❌ Authorization ヘッダーなし
  // ❌ JWTトークンを送信していない
  return response.json()
}
```

**問題**:
- Web版の `/api/reports` は認証必須
- モバイル版は認証ヘッダーを送っていない
- **現在のコードは動作しない**

**影響**:
- すべてのAPI呼び出しが401エラーになる
- ログイン画面がない
- トークン管理の仕組みがない

### 2. データ構造の不整合

**型定義は正しい**:
```typescript
// types/daily-report.ts（正しい）
export interface DailyReport {
  id: string
  date: Date
  quarterlyGoal: string
  improvements: string
  happyMoments: string
  futureTasks: string
  activities: Activity[]  // ✅ 配列
}
```

**しかし画面実装が古い**:
```typescript
// screens/HomeScreen.tsx:62（間違い）
<Text>{item.activities}</Text>
// ❌ activitiesは配列なのに、直接表示しようとしている

// screens/NewReportScreen.tsx:27（間違い）
const [formData, setFormData] = useState({
  date: new Date(),
  activities: '',  // ❌ 文字列で初期化（本来は配列）
  improvements: '',
  happyMoments: '',
  futureTasks: '',
})
```

**問題**:
- Web版は `activities: Activity[]`（各日報に複数の活動）
- モバイル版は `activities: string`（単一のテキスト）として実装
- TypeScriptの型定義と実装が乖離

### 3. Web版の最新機能が反映されていない

Web版に実装済みだがモバイル版に未実装：

- スーパーアドミン機能
- 管理者ログイン
- 検索・フィルター機能
- 期間フィルター機能
- 管理者ログ機能
- 活動時間の計算（startTime、endTime、workingHours）

### 4. ネイティブ機能が未実装

出退勤アプリとの連携に必要な機能が未実装：

- プッシュ通知
- 位置情報
- オフライン対応
- バックグラウンド処理

---

## 開発フェーズ

### フェーズ1: 基本機能の修正と認証実装（優先度：最高）

**目標**: モバイルアプリを動作可能な状態にする

#### 1.1 認証機能の実装（1週間）

- ログイン画面
- サインアップ画面（任意）
- JWT トークン管理（AsyncStorage or SecureStore）
- API クライアントに認証ヘッダー追加
- 認証状態管理（Context API）
- 自動ログアウト（トークン期限切れ）

#### 1.2 データ構造の修正（3日）

- NewReportScreen の修正（Activity配列対応）
- HomeScreen の修正（Activity配列の表示）
- ReportDetailScreen の修正（Activity配列の表示）
- 動的な Activity セクション追加UI

#### 1.3 動作確認とバグ修正（2日）

- ローカル環境でのテスト
- Web版APIとの連携確認
- エラーハンドリングの改善

**成果物**:
- ログイン可能なモバイルアプリ
- 日報のCRUD操作が正常に動作
- Web版と同じデータ構造

---

### フェーズ2: UI/UX改善と機能追加（優先度：高）

**目標**: Web版の主要機能をモバイルに実装

#### 2.1 UI/UXの改善（1週間）

- 日付ピッカーの実装
- 時刻ピッカーの実装（startTime、endTime）
- 稼働時間の自動計算
- バリデーションの強化
- エラーメッセージの改善
- ローディング状態の改善

#### 2.2 検索・フィルター機能（3日）

- 日付範囲フィルター
- キーワード検索
- ソート機能

#### 2.3 オフライン対応（基本）（5日）

- SQLite でのローカルキャッシュ
- オフライン時の日報作成
- オンライン復帰時の同期

**成果物**:
- 使いやすいUI
- 検索・フィルター機能
- 基本的なオフライン対応

---

### フェーズ3: ネイティブ機能の実装（優先度：中）

**目標**: ネイティブアプリならではの機能を実装

#### 3.1 プッシュ通知（1週間）

- Expo Notifications のセットアップ
- 通知許可の取得
- 日報未提出通知
- リマインダー機能
- バックグラウンド通知

#### 3.2 位置情報（1週間）

- Expo Location のセットアップ
- 位置情報許可の取得
- 現在地の取得
- 位置情報の記録（出退勤アプリ連携の準備）

#### 3.3 オフライン対応（完全）（1週間）

- 完全なオフライン CRUD 操作
- バックグラウンド同期
- コンフリクト解決
- オフライン状態の表示

**成果物**:
- プッシュ通知機能
- 位置情報機能
- 完全なオフライン対応

---

### フェーズ4: 出退勤アプリとの連携（優先度：中）

**目標**: 日報アプリと出退勤アプリを連携

#### 4.1 連携設計（3日）

- データ構造の設計
- API設計
- 認証の統合

#### 4.2 連携機能の実装（2週間）

- 出勤打刻 → 日報作成開始
- 退勤打刻 → 日報完成を促す
- 稼働時間の自動計算
- 位置情報の連携

**成果物**:
- 日報アプリと出退勤アプリの連携
- 自動化されたワークフロー

---

### フェーズ5: アプリストア公開（優先度：低）

**目標**: App Store / Google Play への公開

#### 5.1 アプリアイコン・スプラッシュ画面

#### 5.2 アプリストア用の素材作成

- スクリーンショット
- 説明文
- プライバシーポリシー

#### 5.3 ビルドと公開

- EAS Build でのビルド
- TestFlight / Internal Testing でのテスト
- 本番公開

**成果物**:
- App Store 公開
- Google Play 公開

---

## 詳細タスクリスト

### フェーズ1: 基本機能の修正と認証実装

#### タスク1.1: 認証画面の作成

**ファイル作成**:
- `mobile/screens/LoginScreen.tsx`
- `mobile/screens/SignupScreen.tsx`（任意）

**実装内容**:
```typescript
// LoginScreen.tsx
- 社員番号入力フィールド
- パスワード入力フィールド
- ログインボタン
- バリデーション
- エラーメッセージ表示
- ローディング状態
```

**必要なパッケージ**:
```bash
npm install @react-native-async-storage/async-storage
# または
npm install expo-secure-store
```

#### タスク1.2: 認証APIクライアントの実装

**ファイル作成**:
- `mobile/api/auth.ts`

**実装内容**:
```typescript
export const login = async (employeeNumber: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeNumber, password }),
  })
  const data = await response.json()

  // JWTトークンを保存
  await SecureStore.setItemAsync('jwt_token', data.token)

  return data
}

export const logout = async () => {
  await SecureStore.deleteItemAsync('jwt_token')
}

export const getToken = async () => {
  return await SecureStore.getItemAsync('jwt_token')
}
```

#### タスク1.3: 認証Contextの実装

**ファイル作成**:
- `mobile/contexts/AuthContext.tsx`

**実装内容**:
```typescript
interface AuthContextType {
  user: User | null
  login: (employeeNumber: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // アプリ起動時にトークンを確認
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = await getToken()
    if (token) {
      // トークンからユーザー情報を取得
      const userData = await fetchCurrentUser()
      setUser(userData)
    }
    setIsLoading(false)
  }

  // login, logout の実装...

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### タスク1.4: API クライアントに認証ヘッダー追加

**ファイル修正**:
- `mobile/api/reports.ts`

**修正内容**:
```typescript
import { getToken } from './auth'

export const getReports = async (): Promise<DailyReport[]> => {
  const token = await getToken()

  const response = await fetch(`${API_URL}/api/reports`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch reports')
  }

  return response.json()
}

// createReport, updateReport, deleteReport も同様に修正
```

#### タスク1.5: App.tsx にAuthProviderを統合

**ファイル修正**:
- `mobile/App.tsx`

**修正内容**:
```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginScreen from './screens/LoginScreen'

function AppNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user === null ? (
          // 未認証時はログイン画面
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // 認証済みは日報画面
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewReport" component={NewReportScreen} />
            <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  )
}
```

#### タスク1.6: データ構造の修正

**ファイル修正**:
- `mobile/screens/NewReportScreen.tsx`
- `mobile/screens/HomeScreen.tsx`
- `mobile/screens/ReportDetailScreen.tsx`

**NewReportScreen.tsx の修正**:
```typescript
// 古い実装（間違い）
const [formData, setFormData] = useState({
  date: new Date(),
  activities: '',  // ❌ 文字列
  improvements: '',
  // ...
})

// 新しい実装（正しい）
const [formData, setFormData] = useState<CreateDailyReportInput>({
  date: new Date(),
  quarterlyGoal: '',
  improvements: '',
  happyMoments: '',
  futureTasks: '',
  activities: [
    {
      projectCategory: '',
      content: '',
      workingHours: 0,
      issues: '',
      order: 0,
    },
  ],
})

// 動的にActivityを追加・削除する機能を実装
const addActivity = () => {
  setFormData({
    ...formData,
    activities: [
      ...formData.activities,
      {
        projectCategory: '',
        content: '',
        workingHours: 0,
        issues: '',
        order: formData.activities.length,
      },
    ],
  })
}

const removeActivity = (index: number) => {
  const newActivities = formData.activities.filter((_, i) => i !== index)
  setFormData({ ...formData, activities: newActivities })
}
```

**HomeScreen.tsx の修正**:
```typescript
// 古い実装（間違い）
<Text>{item.activities}</Text>

// 新しい実装（正しい）
{item.activities.map((activity, index) => (
  <View key={index}>
    <Text style={styles.activityTitle}>
      活動{index + 1}: {activity.projectCategory}
    </Text>
    <Text style={styles.activityContent}>{activity.content}</Text>
    <Text style={styles.activityHours}>
      稼働時間: {activity.workingHours}時間
    </Text>
  </View>
))}
```

---

## 技術的な実装方針

### 認証方式

**JWT Token + SecureStore**

```
ログインフロー:
1. ユーザーが社員番号・パスワードを入力
2. POST /api/auth/login でトークン取得
3. SecureStore にトークン保存
4. AuthContext にユーザー情報を設定
5. 日報画面に遷移

API呼び出し:
1. SecureStore からトークン取得
2. Authorization: Bearer <token> ヘッダーに追加
3. API リクエスト送信

トークン期限切れ:
1. API が 401 エラーを返す
2. トークンを削除
3. ログイン画面に遷移
```

### オフライン対応方針

**SQLite + Background Sync**

```
データフロー:
1. オンライン時:
   API → SQLite キャッシュ → UI表示

2. オフライン時:
   UI → SQLite ローカル保存 → 同期待ちキューに追加

3. オンライン復帰時:
   同期待ちキューを順番に API へ送信 → 成功したらキューから削除
```

### 状態管理方針

**Context API + React Query**

```
AuthContext: 認証状態
├── user
├── login()
├── logout()
└── isLoading

React Query: API データのキャッシュ・同期
├── useReports()
├── useReport(id)
├── useCreateReport()
└── useUpdateReport()
```

---

## 出退勤アプリとの連携構想

### 連携シナリオ

#### シナリオ1: 出勤打刻 → 日報作成開始

```
【出退勤アプリ】
出勤ボタンをタップ
↓
位置情報取得
↓
タイムスタンプ記録
↓
【連携】出勤データを保存

【日報アプリ】
出勤データを検知
↓
今日の日報が未作成なら自動で下書き作成
↓
通知: 「今日の日報を記録しましょう」
```

#### シナリオ2: 退勤打刻 → 日報完成を促す

```
【出退勤アプリ】
退勤ボタンをタップ
↓
稼働時間を自動計算（出勤時刻 - 退勤時刻）
↓
【連携】退勤データを保存

【日報アプリ】
退勤データを検知
↓
稼働時間を日報に自動入力
↓
通知: 「今日の日報を完成させましょう」
↓
日報作成画面を開く（稼働時間は自動入力済み）
```

### 必要なデータ連携

```typescript
// 共通データベース（Supabase）

// 出退勤テーブル（出退勤アプリが管理）
table attendance {
  id: string
  userId: string
  clockInTime: timestamp
  clockInLocation: { lat, lng }
  clockOutTime: timestamp | null
  clockOutLocation: { lat, lng } | null
  totalWorkingHours: number | null
  date: date
}

// 日報テーブル（日報アプリが管理）
table daily_reports {
  id: string
  userId: string
  date: date
  quarterlyGoal: string
  improvements: string
  happyMoments: string
  futureTasks: string
  // 出退勤データから自動計算される
  totalWorkingHours: number  // attendance.totalWorkingHours から取得
}

// アクティビティテーブル
table activities {
  id: string
  reportId: string
  projectCategory: string
  content: string
  workingHours: number
  startTime: string
  endTime: string
  issues: string
  order: number
}
```

### 連携API設計

```typescript
// 出退勤データから日報データを生成
POST /api/attendance/clock-out
→ 退勤打刻時に日報アプリにイベント送信

// 日報アプリ側
GET /api/attendance/today
→ 今日の出退勤データを取得

POST /api/reports/from-attendance
→ 出退勤データから日報の下書きを作成
```

---

## まとめ

### 現状の課題

1. **認証機能が完全に欠如** → 現在のコードは動作しない
2. **データ構造の不整合** → Web版と互換性がない
3. **Web版の最新機能が未反映**
4. **ネイティブ機能が未実装**

### 優先順位

```
【最優先（フェーズ1）】
├── 認証機能の実装（1週間）
├── データ構造の修正（3日）
└── 動作確認（2日）
合計: 約2週間

【高優先（フェーズ2）】
├── UI/UX改善（1週間）
├── 検索・フィルター（3日）
└── オフライン対応（基本）（5日）
合計: 約3週間

【中優先（フェーズ3）】
├── プッシュ通知（1週間）
├── 位置情報（1週間）
└── オフライン対応（完全）（1週間）
合計: 約3週間

【将来（フェーズ4〜5）】
├── 出退勤アプリ連携（2週間）
└── アプリストア公開
```

### 推奨される開発の進め方

1. **まずフェーズ1を完了させる**（2週間）
   - 動作可能な状態にする
   - Web版と同じデータ構造にする

2. **フェーズ2でユーザー体験を向上**（3週間）
   - 使いやすいUIに改善
   - 基本的なオフライン対応

3. **フェーズ3でネイティブ機能を実装**（3週間）
   - プッシュ通知、位置情報
   - 完全なオフライン対応

4. **フェーズ4で出退勤アプリと連携**（2週間）
   - 自動化されたワークフロー

5. **フェーズ5でアプリストア公開**
   - 一般ユーザーに提供

合計開発期間: 約10週間（2.5ヶ月）
