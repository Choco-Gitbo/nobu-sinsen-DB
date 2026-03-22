// メニューの開閉を制御する関数
export function setupNavigation() {
  const openBtn = document.querySelector('.js-menu-open');
  const closeBtn = document.querySelector('.js-menu-close');
  const menu = document.querySelector('.js-side-menu');
  const overlay = document.querySelector('.js-menu-overlay');

  const toggleMenu = () => {
    menu.classList.toggle('is-open');
    overlay.classList.toggle('is-open');
  };

  openBtn.addEventListener('click', toggleMenu);
  closeBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu); // 背景クリックでも閉じる
}