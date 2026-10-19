// JSON-LD（@graph）の組み立て。項目は rules/seo.md の表に合わせる（ADR-0011）。
// 画面に無いことは書かない。値はサイト設定・frontmatter・本文から作る。
import type {
  Blog,
  BlogPosting,
  BreadcrumbList,
  CollectionPage,
  Graph,
  ImageObject,
  ItemList,
  Person,
  ProfilePage,
  Thing,
  WebPage,
  WebSite,
} from "schema-dts";

import { toIsoDate, yearOf } from "../format";
import { citations, codeBlocks, graphemes, wordCount } from "../markdown/analyze";
import { absoluteUrl, profiles, site } from "../../site.config";

export const ids = {
  website: `${absoluteUrl("/")}#website`,
  blog: `${absoluteUrl("/")}#blog`,
  person: `${absoluteUrl("/")}#person`,
};

const ref = (id: string) => ({ "@id": id });

export function graph(nodes: Thing[]): Graph {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** どのページにも入れる、サイト共通の 3 ノード。 */
export function commonNodes(): [WebSite, Blog, Person] {
  const home = absoluteUrl("/");
  const { author } = site;
  return [
    {
      "@type": "WebSite",
      "@id": ids.website,
      name: site.name,
      alternateName: site.alternateName,
      url: home,
      description: site.description,
      inLanguage: site.language,
      publisher: ref(ids.person),
    },
    {
      "@type": "Blog",
      "@id": ids.blog,
      name: site.name,
      url: home,
      description: site.description,
      inLanguage: site.language,
      author: ref(ids.person),
      publisher: ref(ids.person),
      isPartOf: ref(ids.website),
    },
    {
      "@type": "Person",
      "@id": ids.person,
      name: author.name,
      alternateName: author.handle,
      url: absoluteUrl("/about"),
      image: {
        "@type": "ImageObject",
        url: absoluteUrl(author.image.large),
        width: `${author.image.width}`,
        height: `${author.image.height}`,
      },
      description: author.description,
      sameAs: profiles.map((profile) => profile.href),
    },
  ];
}

function ogImage(): ImageObject {
  return {
    "@type": "ImageObject",
    url: absoluteUrl(site.ogImage.src),
    width: `${site.ogImage.width}`,
    height: `${site.ogImage.height}`,
  };
}

export interface Crumb {
  name: string;
  path: string;
}

function breadcrumb(id: string, crumbs: Crumb[]): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

const HOME: Crumb = { name: "ホーム", path: "/" };

export interface ArticleInput {
  path: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  category: Crumb;
  /** 本文の Markdown。 */
  body: string;
}

/** 記事詳細: WebPage・BlogPosting・BreadcrumbList と共通の 3 ノード。 */
export function articleGraph(article: ArticleInput): Graph {
  const url = absoluteUrl(article.path);
  const published = toIsoDate(article.pubDate);
  const modified = toIsoDate(article.updatedDate ?? article.pubDate);
  const image = ogImage();
  const nodeIds = {
    page: `${url}#webpage`,
    article: `${url}#article`,
    breadcrumb: `${url}#breadcrumb`,
  };
  const page: WebPage = {
    "@type": "WebPage",
    "@id": nodeIds.page,
    url,
    name: article.title,
    isPartOf: ref(ids.website),
    breadcrumb: ref(nodeIds.breadcrumb),
    primaryImageOfPage: image,
    datePublished: published,
    dateModified: modified,
    inLanguage: site.language,
  };
  const posting: BlogPosting = {
    "@type": "BlogPosting",
    "@id": nodeIds.article,
    headline: graphemes(article.title).slice(0, 110).join(""),
    description: article.description,
    url,
    mainEntityOfPage: ref(nodeIds.page),
    isPartOf: ref(ids.blog),
    datePublished: published,
    dateModified: modified,
    author: ref(ids.person),
    publisher: ref(ids.person),
    copyrightHolder: ref(ids.person),
    copyrightYear: yearOf(article.pubDate),
    image,
    thumbnailUrl: absoluteUrl(site.ogImage.src),
    articleSection: article.category.name,
    keywords: article.category.name,
    inLanguage: site.language,
    isAccessibleForFree: true,
    wordCount: wordCount(article.body),
    hasPart: codeBlocks(article.body).map((code) => ({
      "@type": "SoftwareSourceCode",
      programmingLanguage: code.language,
      ...(code.name ? { name: code.name } : {}),
    })),
    citation: citations(article.body).map((citation) => ({
      "@type": "CreativeWork",
      url: citation.url,
      ...(citation.name ? { name: citation.name } : {}),
    })),
  };
  return graph([
    page,
    posting,
    breadcrumb(nodeIds.breadcrumb, [
      HOME,
      article.category,
      { name: article.title, path: article.path },
    ]),
    ...commonNodes(),
  ]);
}

export interface ListInput {
  path: string;
  name: string;
  description: string;
  /** ページに並べた記事のパス（上から順に）。 */
  items: string[];
  /** カテゴリのページでは、ホーム › カテゴリのパンくずを出す。 */
  breadcrumb?: boolean;
}

/** 記事一覧・カテゴリ: CollectionPage・ItemList（カテゴリは BreadcrumbList も）と共通の 3 ノード。 */
export function listGraph(list: ListInput): Graph {
  const url = absoluteUrl(list.path);
  const listId = `${url}#itemlist`;
  const breadcrumbId = `${url}#breadcrumb`;
  const page: CollectionPage = {
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: list.name,
    description: list.description,
    isPartOf: ref(ids.website),
    mainEntity: ref(listId),
    inLanguage: site.language,
    ...(list.breadcrumb ? { breadcrumb: ref(breadcrumbId) } : {}),
  };
  const itemList: ItemList = {
    "@type": "ItemList",
    "@id": listId,
    itemListElement: list.items.map((path, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(path),
    })),
  };
  return graph([
    page,
    itemList,
    ...(list.breadcrumb
      ? [breadcrumb(breadcrumbId, [HOME, { name: list.name, path: list.path }])]
      : []),
    ...commonNodes(),
  ]);
}

/** 私について: ProfilePage（mainEntity → Person）と共通の 3 ノード。 */
export function profileGraph(input: { path: string; name: string; description: string }): Graph {
  const url = absoluteUrl(input.path);
  const page: ProfilePage = {
    "@type": "ProfilePage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    isPartOf: ref(ids.website),
    mainEntity: ref(ids.person),
    inLanguage: site.language,
  };
  return graph([page, ...commonNodes()]);
}
