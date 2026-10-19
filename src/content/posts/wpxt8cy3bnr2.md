---
title: "JAMstackにおける認証コンテンツの表示方法について"
description: "JAMstack構成のブログを作った際に、部分的に一般公開したくないコンテンツが出てきたため、SSGにおける認証周りについて考えた。"
pubDate: 2021-04-16T09:59:22.750Z
updatedDate: 2021-09-08T09:22:19.581Z
category: tech
---

## SPAとSSRにおける認証コンテンツの表示方法

JAMstack構成のブログを作った際に、部分的に一般公開したくないコンテンツが出てきたため、SSGにおける認証周りについて考えた。

SPAやSSRの要認証コンテンツの表示方法は想像しやすい。下記の2パターンが一般的だと思う。

### SPAの場合

認証が必要なAPIを叩く際に認証トークンを付与する。
認証トークンが存在しなければログインページ or エラーページにリダイレクトするなどの処理が行われる。

### SSRの場合

認証が必要なページをリクエストする際にクッキーに保存された認証情報がサーバから参照される。認証情報が存在しない場合はログインページ or エラーページにリダイレクトするなどの処理が行われる。

ここで考えたいのは、SSGの場合はビルド時にデータを取得してコンテンツを作成するが、ビルド時点では認証できないということ。

SSGの利点はビルド時にデータを取得してコンテンツを作ってしまうため、クライアントからのリクエスト時にデータを参照しなくて良い点だが、下記のような処理を行う場合はクライアントで非同期に処理したくなる。

- リアルタイム更新が必要なコンテンツの表示
- SEO対策が不要なコンテンツの表示 (初期表示はSSR/SSGの方が早い)
- 認証処理

そのため、上記のような要件が出てきた場合は SSG + CSR という組み合わせで対応する必要が出てくる。

サーバレス関数などで都度SSRした結果を取得する方法もあると思うが、認証が必要なページはSEO対策が必要ないため初期表示のパフォーマンスがボトルネックになっているなどの理由がなければ、CSRしてしまった方が良さそう。

なお、firebaseなどのmBaasをクライアントから利用する場合は、apiKeyなどが露出する気持ち悪さはあると思う。

## Next.jsにおけるSSG + CSR

Next.jsではSSGしたい場合に `getStaticProps` という関数をpages配下のコンポーネントと併せて定義することで、ビルド時に実行されて返り値がコンポーネントにpropsとして渡される。

```js
function Posts({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li>{post.title}</li>
      ))}
    </ul>
  );
}
export default Posts;

export async function getStaticProps() {
  // ビルド時のみ実行されクライアントでは実行されない
  const res = await fetch("https://.../posts");
  const posts = await res.json();

  return {
    props: {
      posts,
    },
  };
}
```

SSRの場合も同じだと思うが、サーバで実行される処理とクライアントで実行される処理が混在する形になる。

クライアントでのみ実行したい場合は、イベントハンドラーやコンポーネントのライフサイクルを利用して非同期に実行する必要がある。

```js
import { useEffect, useState } from 'react';
import Loading from 'components/Loading';

function Posts({ posts }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ブラウザでマウントされた後に認証する
    const currentUser = useAuthentication();
    setUser(currentUser);
  });

  return (
    <>
      {user ? (
        <div>{user.name}</div>
      ) : <Loading />}

      <ul>
        {posts.map((post) => (
          <li>{post.title}</li>
        ))}
      </ul>
    </>
  );
}
...省略
```

なお、Next.jsではCSRにおいて非同期にデータ取得を行う場合に `useSWR` というhooksを利用することを推奨している。(認証とはあまり関係ない)

https://nextjs.org/docs/basic-features/data-fetching#swr

キャッシュやポーリングするためのオプションによって、ISR(部分的な更新)を容易に行えるようにしてくれるらしい。

下記のように `getStaticProps` でビルド時に取得しておいたデータで初期化したい場合は下記のように利用できる。

```js
function Posts({ posts }) {
  const { data } = useSWR("/api/posts", fetcher, { initialData: posts });
  // ...
}

export async function getStaticProps() {
  const config = await fetcher("/api/posts");
  return { props: { posts } };
}
```

~~SSGでISRをしたくなるユースケースが思いつかないので、SSR + CSRのケースでは便利だと思う。~~

ただ `useSWR` では再取得(&差分確認)タイミングを「ブラウザのタブが選択された時」などにカスタマイズできるオプションが設けられているため、それらを目的に利用しても良さそう。

https://taroosg.io/useeffect-vs-useswr

2021/07/21 追記---
ISRはむしろSSGとセットで利用される技術だった。
SSGでビルド時にHTMLを生成・エッジロケーションにキャッシュしておき、ユーザがアクセスしたタイミングでISRでHTMLを再生成、キャッシュを置き換える技術らしい。
ISR利用時に `getStaticProps` を持つpages配下のファイルはSSRするサーバレス関数として振る舞い、リクエストタイミングが設定された `revalidate` の期間を超える場合はキャッシュを置き換える。

zennでも一時期利用されていたらしい。

https://zenn.dev/catnose99/articles/8bed46fb271e44#isr%E3%81%A8%E3%81%AF%E4%BD%95%E3%81%8B

キャッシュの置き換えは `revalidate` に設定された期間によって一定間隔で行われるため、データ変更キャッシュ置き換えにラグが発生するらしいが、FastlyなどのパージAPIなどを利用すれば(vercelには2021/07/21時点で代替手段がない)、データ変更をフックにISRが実行できるためこの問題は解決される。

https://developer.fastly.com/reference/api/purging/

vercel(とNext.js)がSSG + ISRを推しているため、ブログやニュースメディアなどの更新頻度が少ないサービス以外における今後の利用ケースに注目したい。

## firebase authentication を導入する

サンプルとしてNext.jsのSSGで作ったブログに、firebase authenticationで認証機能を追加して非公開のページを設けてみた。

### 認証の流れを確認

まず、firebase authenticationで認証する流れを確認する。

#### 1. sdkを初期化する

firebaseのjavascript sdkをインストールする。

```bash
$ npm i -S firebase
```

事前にfirebaseでプロジェクトを作成しておき、sdkを初期化する際の設定情報を控えておく。
なお、Next.jsでは環境変数の接頭辞に `NEXT_PUBLIC_` をつけなければクライアントから読み込めないため地味に注意が必要。

```javascript
// lib/firebase.ts
import "firebase/auth";
import "firebase/firestore";
import firebase from "firebase/app";

export const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
};

// initializeを複数回走らせない
if (!firebase.apps?.length) {
  firebase.initializeApp(config);
} else {
  firebase.app();
}

const auth = firebase.auth();
export default { auth };
```

とりあえず認証機能のみ使いたい場合は、上記のように `firebase.auth();` の戻り値のみ `export` しておく。

#### 2. 認証処理、認証判定

大まかには2つの機能で認証が実現できる。

```javascript
import { auth } from "lib/firebase";

// 認証処理
const signIn = async (email, password) => {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    location.href = '/private_pages';
  } catch (error) {
    // 失敗しても前回のセッションは破棄されないため明示的にサインアウトが必要
    await auth.signOut();
    alert("認証に失敗しました");
  }
};

// 認証済みか判定
const ovserveAuth = () => {
  auth.onAuthStateChanged((user) => {
      if (!user) {
        // 認証ページにリダイレクト
        location.href = '/auth/signin'';
      }
    });
};
```

認証ページ・認証モーダルなどで `await auth.signInWithEmailAndPassword(email, password)` を実行して、認証が成功したら認証が必要なページにリダイレクトなどを行う。
なお、認証処理は「メールアドレス・パスワード」以外にも各プロバイダーによるOAuthやカスタム認証が可能。

ユーザが認証が必要なページで `auth.onAuthStateChanged((user) => {})` を実行しておき、未認証状態でアクセスした場合は認証ページにリダイレクトする。
なお、認証判定はイベントリスナー(オブザーバー？) で認証状態の変更を監視する形がベーシックらしいが、任意のタイミングで認証状態を確認する方法もあると思う。
(認証済みの場合は `firebase.auth.user` のようにユーザ情報を参照できるなど)

### 導入例

ブログにどのように導入したか確認する。

#### 認証判定はhooksを作成

認証判定はhooksにして、非公開コンテンツとして認証が必要な `pages` 配下のコンポーネントから呼び出す形にした。  
hooksの戻り値でユーザ情報を返しているため、コンポーネントでユーザ情報を利用することができるようにしている。  
認証に失敗して認証ページにリダイレクトさせる際には `callback` クエリにリダイレクト前のpathを付与しておき、認証成功時に戻ってこれる仕組みにしている。

https://github.com/tkc310/microCMS_blog/blob/main/src/hooks/useAuth.ts

hooksを利用しているコンポーネントは下記↓

https://github.com/tkc310/microCMS_blog/blob/main/src/pages/notes/index.tsx#L28-L43

なお、ユーザ情報が存在しない場合はローディングアイコンを表示しているが、コンテンツ自体はSSGで作成済みでHTMLをdeveloper toolsで見てみるとデータが確認できてしまう状態になっている。

#### 認証ページ

メールとパスワードを入力してsubmitすると、前述の認証処理が実行される。  
認証が成功したら `callback` クエリのパスにリダイレクトしている。

https://github.com/tkc310/microCMS_blog/blob/main/src/pages/auth/signin.tsx#L47-L69

## まとめ

firebase authenticationで認証機能を追加して、ブログ内の非公開コンテンツは未認証の場合に閲覧できないようにした。

今回の方法では、事前にSSGで作成したコンテンツを認証状態によって表示・非表示を切り替える形にしたが、developer toolsを利用すれば確認はできてしまう。

絶対に見られてはいけないデータなどの場合は、認証判定を通過した後に非同期に取得する形になりそう。

```javascript
function Posts() {
  const currentUser = useAuth();
  if (!currentUser) return <Loading />;

  const { data } = useSWR("/api/posts", fetcher, { initialData: props.posts });
  return data && data.posts?.length ? (
    <ul>
      {data.posts.map((post) => (
        <li>{post.title}</li>
      ))}
    </ul>
  ) : (
    <Error />
  );
}
```

## 余談

microCMSとfirestoreを組み合わせてるケースを見かけて、面白そうだったため後日firestoreも触ってみたい。

https://yasutomo.hatenablog.com/entry/2020/12/22/092831

microCMSはPOSTリクエストに上限があるので、Todoリストなど頻繁に更新リクエストが飛ぶ機能などにfirestoreを利用してみたいと思った。
