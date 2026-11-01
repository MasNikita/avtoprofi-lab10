/*
  Лабораторная работа №10 — АвтоПрофи
  Реализация: HTML + CSS + JavaScript (без сервера)
  События: cta_click, car_select, form_start, form_submit.

  Важно: идентификаторы ниже не настроены. Веб-аналитика начнёт
  передавать данные во внешние сервисы только после добавления своих ID.
*/
'use strict';

const ANALYTICS = {
  yandexCounterId: 113985937,  // Например, ваше числовое значение из Метрики
  ga4MeasurementId: 'G-QVTEXHTCHE'    // Например, ваш идентификатор G-XXXXXXXXXX
};

function installAnalytics() {
  if (/^G-[A-Z0-9]+$/.test(ANALYTICS.ga4MeasurementId)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ANALYTICS.ga4MeasurementId);
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS.ga4MeasurementId);
  }
  if (Number.isInteger(ANALYTICS.yandexCounterId) && ANALYTICS.yandexCounterId > 0) {
    const id = ANALYTICS.yandexCounterId;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
}

function trackEvent(eventName, params = {}) {
  // Событие видно в консоли даже без подключённых счётчиков.
  console.info('[АвтоПрофи] Событие:', eventName, params);
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
  if (typeof window.ym === 'function' && Number.isInteger(ANALYTICS.yandexCounterId)) {
    window.ym(ANALYTICS.yandexCounterId, 'reachGoal', eventName, params);
  }
}

if (window.confirm(
  'Разрешить использование Яндекс Метрики и Google Analytics для анализа посещений сайта?'
)) {
  installAnalytics();
}
const form = document.querySelector('#lead-form');
const categoryField = document.querySelector('#car-category');
const feedback = document.querySelector('#form-feedback');
let formStarted = false;

// Клики по основным CTA-кнопкам.
document.querySelectorAll('.track-cta').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('cta_click', { location: link.dataset.cta || 'unknown' });
  });
});

// Выбор категории заранее заполняет форму и переводит к ней.
document.querySelectorAll('.choose-car').forEach(button => {
  button.addEventListener('click', () => {
    const selectedCar = button.dataset.car;
    categoryField.value = selectedCar;
    trackEvent('car_select', { car_category: selectedCar });
    document.querySelector('#application').scrollIntoView({ behavior: 'smooth' });
  });
});

function registerFormStart() {
  if (!formStarted) {
    formStarted = true;
    trackEvent('form_start');
  }
}
form.addEventListener('input', registerFormStart);
form.addEventListener('change', registerFormStart);

function showFeedback(message, status) {
  feedback.textContent = message;
  feedback.className = 'form-feedback ' + (status === 'success' ? 'is-success' : 'is-error');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#customer-name').value.trim();
  const phone = document.querySelector('#customer-phone').value.trim();
  const category = categoryField.value;
  const request = document.querySelector('#request-kind').value;
  const comment = document.querySelector('#customer-message').value.trim();
  const consent = document.querySelector('#demo-consent').checked;
  const digits = phone.replace(/\D/g, '');

  if (name.length < 2) {
    showFeedback('Укажите имя длиной не менее 2 символов.', 'error');
    document.querySelector('#customer-name').focus();
    return;
  }
  if (digits.length < 10 || digits.length > 15) {
    showFeedback('Укажите корректный номер телефона (10–15 цифр).', 'error');
    document.querySelector('#customer-phone').focus();
    return;
  }
  if (!category) {
    showFeedback('Выберите интересующую категорию автомобиля.', 'error');
    categoryField.focus();
    return;
  }
  if (!consent) {
    showFeedback('Подтвердите, что понимаете учебный характер заявки.', 'error');
    document.querySelector('#demo-consent').focus();
    return;
  }

  const order = {
    id: 'AP-' + Date.now().toString(36).toUpperCase(),
    customerName: name,
    phone,
    carCategory: category,
    requestType: request,
    comment,
    status: 'Учебная заявка сохранена',
    createdAt: new Date().toLocaleString('ru-RU')
  };

  // Сохраняем в рамках вкладки; при запрете Storage используем память страницы.
  let storageDescription = 'в текущей вкладке';
  try {
    sessionStorage.setItem('autoprofi_lab10_application', JSON.stringify(order));
  } catch (e) {
    window.autoprofiDemoApplication = order;
    storageDescription = 'только до обновления страницы';
  }
  trackEvent('form_submit', { car_category: category, request_type: request });
  showFeedback('Заявка № ' + order.id + ' сохранена ' + storageDescription + '. В настоящий автосалон ничего не отправлялось.', 'success');
  form.reset();
  formStarted = false;
});
