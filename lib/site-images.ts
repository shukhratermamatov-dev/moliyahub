// Внешние фотографии с Unsplash (бесплатная лицензия Unsplash — хотлинк на
// images.unsplash.com, ничего не хранится в репозитории и не увеличивает
// размер сборки). Если какая-то картинка не подходит или не грузится —
// достаточно поменять src здесь, ссылки больше нигде не дублируются.
export const SITE_IMAGES = {
  heroArchitecture: {
    src: "https://images.unsplash.com/photo-1733586092622-1b3201e802a5?auto=format&fit=crop&w=1600&q=80",
    alt: "Купола Регистана в Самарканде",
  },
  bazaar: {
    src: "https://images.unsplash.com/photo-1728115214399-ad40d93eb935?auto=format&fit=crop&w=1200&q=80",
    alt: "Торговые ряды на базаре в Хиве",
  },
  textileFactory: {
    src: "https://images.unsplash.com/photo-1741437138070-c2d10fc56f43?auto=format&fit=crop&w=1200&q=80",
    alt: "Работники текстильного производства",
  },
  smallBusinessOwner: {
    src: "https://images.unsplash.com/photo-1687422808248-f807f4ea2a2e?auto=format&fit=crop&w=1600&q=80",
    alt: "Владелец небольшого бизнеса со смартфоном",
  },
} as const;
