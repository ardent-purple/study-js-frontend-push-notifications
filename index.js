// jshint esversion: 8

navigator.serviceWorker.register('sw.js') // Регистрируем св

navigator.serviceWorker.ready // смотрим промис готовности
  .then(function (registration) {
    // на объекте регистрации смотрим
    return registration.pushManager
      .getSubscription() // подписки нашего сервис воркера
      .then(function (subscription) {
        // асинхронная функция, чтобы всегда был промис
        if (subscription) {
          // Подписки вернут null если там ничего нет
          return subscription // Если подписка есть, то просто возвращаем её
        }

        // Просим с сервера уникальный идентефикатор пушей
        // конвертируем его в серверный ключ
        const response = await fetch('./vapidPublicKey')
        const vapidPublicKey = await response.text()
        const convertedVapidKey = urlBase64ToUintArray(vapidPublicKey)

        // Оформляем подписку по ключу
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })
      })
  })
  .then(function (subscription) {
    console.log(sucscription)
    // получив объект подписки браузера, отправляем запрос на регистрацию серверу
    fetch('./register', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription,
      }),
    })

    document.getElementById('doIt').onclick = function () {
      const payload = document.getElementById('notification-payload').value
      const delay = document.getElementById('notification-delay').value
      const ttl = document.getElementById('notification-ttl').value

      // По клику на кнопку просим сервер выслать нам пуш
      fetch('./sendNotification', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          subscription: sucscription,
          payload: payload,
          delay: delay,
          ttl: ttl,
        }),
      })
    }
  })

// =========================================
// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  var rawData = window.atob(base64)
  var outputArray = new Uint8Array(rawData.length)

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
