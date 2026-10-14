export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} · ProManage` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · ProManage` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
