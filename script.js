const SUPPORTED = ["en", "ru", "de", "pl", "it", "fr"];
const DEFAULT_LANG = "en";
const select = document.getElementById("lang");

// 1. Определяем язык: сохранённый выбор -> язык браузера -> английский
function detectLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (SUPPORTED.includes(saved)) return saved;
  } catch (e) { /* localStorage может быть недоступен */ }

  const browser = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
}

// 2. Подставляем тексты во все элементы с data-i18n
function applyLang(lang) {
  const dict = translations[lang];
  const fallback = translations[DEFAULT_LANG];

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = dict[key] ?? fallback[key] ?? key;
  });

  // Подпись кнопки-бургера для скринридеров
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    el.setAttribute("aria-label", dict[key] ?? fallback[key] ?? key);
  });

  // Регламенты: главная кнопка открывает PDF на языке сайта, выбранный язык подсвечен
  document.querySelectorAll(".rules__links").forEach((box) => {
    const chip = box.querySelector(`.rules__other a[hreflang="${lang}"]`);
    box.querySelectorAll(".rules__other a").forEach((a) => a.classList.toggle("is-current", a === chip));
    if (chip) box.querySelector(".rules__main").href = chip.href;
  });

  document.title = dict["meta.title"] ?? fallback["meta.title"];
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", dict["meta.desc"] ?? fallback["meta.desc"]);

  select.value = lang;
  try { localStorage.setItem("lang", lang); } catch (e) { /* ничего */ }
}

// 3. Обратный отсчёт до конца регистрации и приёма работ (20 февраля 2027 включительно)
const DEADLINE = new Date("2027-02-20T23:59:59");
const timerBox = document.getElementById("countdown-timer");
const closedMsg = document.getElementById("countdown-closed");

// Блок отсчёта скрыт в HTML и показывается только когда JS реально работает (иначе были бы «0 0 0»)
document.getElementById("countdown").hidden = false;

function tickCountdown() {
  const diff = DEADLINE - new Date();

  if (diff <= 0) {
    timerBox.hidden = true;
    closedMsg.hidden = false;
    return;
  }

  const minutes = Math.floor(diff / 60000);
  document.getElementById("cd-d").textContent = Math.floor(minutes / 1440);
  document.getElementById("cd-h").textContent = Math.floor((minutes % 1440) / 60);
  document.getElementById("cd-m").textContent = minutes % 60;
}

tickCountdown();
setInterval(tickCountdown, 30000);

// 4. Мобильное меню-бургер
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
}

burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));

// Закрываем меню: по клику на пункт, по Escape, по клику вне шапки
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    burger.focus();
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".header")) setMenu(false);
});

// Если экран растянули до десктопа, сбрасываем состояние меню
window.matchMedia("(min-width: 1100px)").addEventListener("change", () => setMenu(false));

// 5. Окно с регалиями судьи
const judgeDialog = document.getElementById("judge-dialog");
const dlgPhoto = judgeDialog.querySelector(".judge-dialog__photo");
const dlgName = judgeDialog.querySelector(".judge-dialog__name");
const dlgMeta = judgeDialog.querySelector(".judge-dialog__meta");
const dlgBody = judgeDialog.querySelector(".judge-dialog__body");

function openJudge(card) {
  const name = card.querySelector(".judge__name").textContent;
  // Регалии на языке сайта; если перевода нет — английские; если регалий нет — блок с Instagram
  const li = card.parentElement;
  const lang = document.documentElement.lang;
  const bio = li.querySelector(`.judge__bio[lang="${lang}"]`)
    || li.querySelector('.judge__bio[lang="en"]')
    || li.querySelector(".judge__bio");
  dlgBody.lang = bio.lang || lang;

  dlgPhoto.src = card.querySelector(".judge__photo").src;
  dlgPhoto.alt = name;
  dlgName.textContent = name;
  dlgMeta.textContent = card.querySelector(".judge__role").textContent + " · " + card.querySelector(".judge__meta").textContent;
  // Копируем регалии из скрытого блока карточки в окно
  dlgBody.replaceChildren(...[...bio.children].map((el) => el.cloneNode(true)));

  judgeDialog.showModal(); // Escape и возврат фокуса на карточку браузер делает сам
}

document.querySelectorAll(".judge").forEach((card) => {
  card.addEventListener("click", () => openJudge(card));
});

judgeDialog.querySelector(".judge-dialog__close").addEventListener("click", () => judgeDialog.close());
// Клик по затемнённому фону (мимо содержимого окна) тоже закрывает
judgeDialog.addEventListener("click", (e) => {
  if (e.target === judgeDialog) judgeDialog.close();
});

// Перед переходом ещё раз берём ссылку из кнопки языка (в едином файле ссылки на PDF меняются после загрузки)
document.querySelectorAll(".rules__main").forEach((main) => {
  main.addEventListener("click", () => {
    const chip = main.closest(".rules__links").querySelector(".rules__other a.is-current");
    if (chip) main.href = chip.href;
  });
});

// 6. Запуск и реакция на переключатель
select.addEventListener("change", (e) => applyLang(e.target.value));
applyLang(detectLang());
