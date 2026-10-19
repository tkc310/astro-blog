---
title: "Apollo Clientで始めるGraphQLと状態管理"
description: "GraphQLとそのクライアントライブラリ「Apollo Client」の話です。業務でApollo Clientを触る機会があったため、使い方の紹介と感想です。"
pubDate: 2022-09-13T10:41:40.042Z
updatedDate: 2022-11-17T21:17:26.129Z
category: tech
---

GraphQLとそのクライアントライブラリ「Apollo Client」の話です。  
業務でApollo Clientを触る機会があったため、使い方の紹介と感想です。

## GraphQLの特徴

### スキーマ Schemaについて

スキーマはGraphQLにおいて、APIとクライアント間のインターフェースとして利用されるIDLです。

```graphql
type Post {
  id: String!
  created_at: DateTime!
}
```

クライアントからは

- request / responseの型情報
- データ取得関数の自動生成
  として利用されます。

この型があることで、補完が効いて開発効率が上がる・型安全になり修正/リファクタ時の負荷軽減が期待できます。

e.g. `$ tsc --noEmit` でAPI変更の影響をざっくり知ることができる

### RESTとの比較

主に下記のような差分があると考えています。

- クライアントがレスポンスを組み立てる
- 基本的に「リソース=リゾルバ」になるためエンドポイント単位でのサブリソースの管理が不要
  e.g. 記事ページのAPIにコメントを生やしたが、他ページでもコメントを取りたくなった

GraphQLはクライアントファーストな仕組みと言うことができ、  
SPAが普及してクライアントに複雑性が移動してきた背景を考えるとGraphQLの登場は自然な文脈だと考えられます。

ただし、利用してみて学習・環境構築コストが高く、  
パフォーマンス出しにくいという学びがあったため使い所は見極める必要があると思います。
(シンプルなアプリケーションには向かない)

## Apollo Client

GraphQLクライアントライブラリで、旧facebook社が開発したRelayと2大巨頭。  
クライアント以外にもApollo Serverというライブラリが存在していて、  
Apollo StudioというGraphQLプレイグラウンド・パフォーマンストラッキングなどを行うSaaSと連携できる。  
(課金プランがあるため、使いたい機能がなければ使わないのが無難そう)

https://www.apollographql.com/docs/react/why-apollo/

後発ながら機能が豊富で利用者が多くRelayに比べてfragment collocationは強制されないなど制約が弱めです。  
ツールチェイン周りもRelayはビルトインなのに対して、Apolloはサードパーティのツールを必要とします。  
(GraphQL Code Generator)

https://www.the-guild.dev/graphql/codegen/plugins/typescript/typescript-react-apollo

### apolloで状態管理を行う

コンポーネントを跨いで利用したい状態をグローバルステートと呼び、  
その状態の管理方法が「状態管理」と呼ばれている。  
状態管理で扱うデータの種類は大きく「API経由、それ以外データ」の2つに分類できる。

この状態管理にはReduxやFluxが利用されるのが通例だが、  
下記のような課題があり recoil などのシンプルな状態管理ライブラリが登場してきている。

- 概念自体が難しくて初見殺し (バックエンドエンジニアが触りたくなくなる)
- API経由データの通信状態の遷移を表現するためにmiddlewareが必要
- action, action creator, reducerボイラープレートが多くて大変
- コード量が多くなると職人が必要

また、シンプルな状態管理ライブラリとは別に SWR, useQueryといったキャッシュ機構を持ったfetchライブラリが流行ってきた。  
これらはAPIから取得・変更されたデータをメモリキャッシュとして保持して、
fetch時にキャッシュを自動更新するという機能を提供している。

Apolloもキャッシュ機構を持っていて、上記に加えてオブジェクトごとに正規化してくれる機能がついている。

```js
// __typename x idを識別子としてユニーク性を担保
{
  __typename: 'Post',
  id: 'uuid-1',
  name: 'something'
},
{
  __typename: 'Post',
  id: 'uuid-2',
  name: 'anything'
}
```

この機能によって、下記のような挙動が可能になる。

- ミューテーションで記事を更新する
- 記事一覧のキャッシュが更新される
- 記事一覧の表示が更新される

Reduxで行われていた `dispatch(action, data.payload)` する処理を自動的に行なってくれている。

また、APIを経由しないデータについても「Reactive variables」が利用できる。
layout層にマウントされている共通モーダルの状態などに利用できる。

https://www.apollographql.com/docs/react/local-state/reactive-variables/

```js
// store.js
const flagVar = makeVar(false);

// component.jsx
const Component = () => {
  // flag変更がreactiveに検知される
  const flag = useReactiveVar(flagVar);
  return <div onClick={() => flagVar(true)}>{flag}</div>;
};
```

なお、この機能はリリースされたてのためデバッグ用の拡張機能などが対応していない。
そのため複雑なオブジェクトなどの状態管理には利用しない方が良さそうだと思っている。

## GraphQL Code Generator

下記を自動生成してくれるツール↓

- APIのレスポンス型
- データ取得のhooks

https://www.the-guild.dev/graphql/codegen/plugins/typescript/typescript-react-apollo

APIでスキーマ作成、クライアントにオペレーション(query/mutation)のコードを書いて、
CLIからコマンドを叩くと自動生成される仕組みになっている。

**スキーマ**

```graphql
# ルート型
schema {
  query: Query
  mutation: Mutation
}

type Query {
  # フィールド
  post: Post
}
# オブジェクト型
type Post {
  id: String!
  title: String
}

type Mutation {
  update_post(input: UpdatePostInput!): UpdatePostMutation!
}
type UpdatePostInput {
  id: String!
  title: String!
} # パラメータ
type UpdatePostMutation {
  post: Post
} # レスポンス
```

**オペレーション**

```graphql
query PostPage {
  post {
    # フィールド
    id
    title
  }
}

mutation PostPageUpdate($input: UpdatePostInput!) {
  update_post(input: $input) {
    id # ここからレスポンス
    title
  }
}
```

**生成されるコード**

```ts
// レスポンス型
type PostPageQuery = {
  __typename: 'Post';
  id: string;
  title: string | null | undefined;
};
// hooks
const usePostPageQuery = useQuery(...);

// レスポンス型
type PostPageUpdateMutation = {
  __typename: 'PostPageUpdateMutation';
  post: Post;
};
// hooks
const usePostPageUpdateMutatiion = useMutation(...);
```

**hooksの利用方法**

```ts
const Component = () => {
  const { data, loading, error } = usePostPageQuery();

  const [mutate] = usePostPageUpdateMutatiion(); // 関数取得
  const handleUpdate = async () => {
    try {
      const { error } = await mutate();
      if (error) return throw error;
    } catch { // エラーハンドリング }
  };

  if (error) return throw error; // エラーハンドリング
  if (loading) return <div>Loading</div>; // ローディング中

  return (
    <>
      <div>{`${data.post.id}: ${data.post?.title}`}</div>
      <button onClick={handleUpdate}>更新</button>
    </>
  );
};
```

## 開発フローについて

GraphQLのライブラリは言語ごとに多種多様だが、  
開発方法は主に2種類(ハイブリットも出てきているらしい)に分類できる。

- Code First  
  APIの型・リゾルバーを先に実装して、スキーマを生成するタイプ
- Schema First  
  スキーマを先に作っておき、コード生成するタイプ (gqlgenなど)

コードファーストのライブラリを利用する場合、  
フロントはスキーマができるまで型や自動生成されたhooksを利用することができない。  
そのため、コードファーストはフルスタックなチームに適している方式なんだろうと想像している。

スキーマファーストの場合、  
フロントがスキーマを書いてバックエンドが具体的なロジックを実装するという方式が取れそう。

いずれにしてもスキーマはRESTに比べて慎重に決める必要があって、
デザイン・ER図ができた段階で相談するタイミングを設ける必要がありそうだと思っている。

なお、第2世代(あるいは第3世代)コードファーストというものも出ていてモデルから型を自動抽出したりしてくれるらしい。
(第一世代はリゾルバーを書くときに手動で定義する)

https://user-first.ikyu.co.jp/entry/2019/12/16/113332#%E3%82%B3%E3%83%BC%E3%83%89%E3%83%95%E3%82%A1%E3%83%BC%E3%82%B9%E3%83%88-vs-%E3%82%B9%E3%82%AD%E3%83%BC%E3%83%9E%E3%83%95%E3%82%A1%E3%83%BC%E3%82%B9%E3%83%88

## 最後に

下記に苦戦したのでどこかのタイミングで記事にしたい。

- fragment collocation
- persisted query
