Памятка для разработчиков

Добро пожаловать! Ниже описан рекомендуемый рабочий процесс для работы с этим проектом на React + Vite.

---

1. Клонирование репозитория

Клонируем репозиторий и переходим в папку проекта:
```
git clone https://github.com/1eanq/techup-frontend.git
cd techup-frontend
```

---

2. Установка зависимостей

Устанавливаем все нужные пакеты:
```
npm install
```

---

3. Запуск локального сервера

Для разработки запускаем локальный сервер:
```
npm run dev
```
	•	Открой браузер: http://localhost:5173￼
	•	Любые изменения в src/ будут автоматически отображаться (hot reload).

---

4. Ветвление и разработка

4.1 Основные ветки
	•	main — стабильная версия, деплой на GitHub Pages.
	•	develop — рабочая ветка, куда сливаются проверенные изменения.
	•	feature/<имя> — ветки для каждой новой фичи.

4.2 Создание ветки для работы

Создаём ветку от develop для своей задачи:
```
git checkout develop
git pull origin develop
git checkout -b feature/<ваша_фича>
```
	•	<ваша_фича> — имя ветки по сути задачи, например feature/login-form.

---

5. Работа с кодом
	1.	Вносим изменения в своей ветке.
	2.	Добавляем файлы и делаем коммиты:
```
git add .
git commit -m "Краткое описание изменений"
```
	•	Пишите понятные сообщения коммитов.

---

6. Публикация ветки на GitHub

Отправляем ветку на GitHub:
```
git push -u origin feature/<ваша_фича>
```

---

7. Pull Request
	1.	На GitHub создаём Pull Request в ветку develop.
	2.	Ждём ревью от ведущего проекта.
	3.	После одобрения Pull Request сливается в develop.

Важно: не пушить напрямую в develop или main.

---

8. Обновление локальной ветки

Чтобы забрать последние изменения из develop:
```
git checkout develop
git pull origin develop
git checkout feature/<ваша_фича>
git merge develop
```

---

9. Деплой
	•	Деплой на GitHub Pages происходит с ветки main (или develop, если настроено).
	•	Для обновления сайта достаточно сделать merge develop → main, и Actions автоматически задеплоит проект.

---

10. Полезные команды Git

# Посмотреть ветки
```
git branch -a
```
# Переключиться на ветку
```
git checkout <ветка>
```
# Слияние ветки
```
git merge <ветка>
```
# Просмотр статуса
```
git status
```

---

Следуя этой памятке, каждый разработчик сможет безопасно работать и коммитить изменения без конфликтов.

API Documentation

Base URL

https://<your-domain>/api/v1


⸻

Health Check

GET /health
	•	Проверка состояния сервиса.
	•	Response: 200 OK

⸻

Account Routes

Public Endpoints

POST /account/register
	•	Регистрация пользователя.
	•	Body: { "email": string, "password": string, "name": string }
	•	Response: 201 Created

POST /account/login
	•	Логин пользователя.
	•	Body: { "email": string, "password": string }
	•	Response: { "access_token": string, "refresh_token": string }

POST /account/refresh
	•	Обновление access_token по refresh_token.
	•	Body: { "refresh_token": string }
	•	Response: { "access_token": string }

Protected Endpoints

Require Authorization header: Bearer <token>

GET /account/secure/profile
	•	Получение профиля текущего пользователя.
	•	Response: { "id": int, "email": string, "name": string, "role": string }

POST /account/secure/change-password
	•	Смена пароля.
	•	Body: { "old_password": string, "new_password": string }

PUT /account/secure/update
	•	Обновление данных профиля.
	•	Body: { "name": string, "email": string }

POST /account/secure/set-role
	•	Изменение роли пользователя (только admin).
	•	Body: { "user_id": int, "role": string }

⸻

Schedule Routes

Require Authorization

GET /schedule/search
	•	Поиск расписания.
	•	Query parameters: faculty_id, group_id, teacher_id, date
	•	Response: [{ "lesson_id": int, "group": string, "subject": string, "teacher": string, "room": string, "time": string }]

⸻

Map / Building Routes

Require Authorization

GET /map/buildings
	•	Получение списка всех зданий.
	•	Response: [{ "id": int, "name": string, "address": string }]

GET /map/buildings/:building_id/rooms
	•	Получение всех комнат в здании.
	•	Response: [{ "id": int, "name": string, "floor": int }]

GET /map/shortest-path/:start/:end
	•	Кратчайший путь между двумя комнатами.
	•	Response: { "path": [int], "distance": float }

⸻

Admin Routes

Require Authorization + Admin Role

POST /admin/faculty
	•	Добавление нового факультета.
	•	Body: { "name": string }

POST /admin/group
	•	Добавление новой группы.
	•	Body: { "name": string, "faculty_id": int }

POST /admin/lesson
	•	Добавление нового занятия.
	•	Body: { "subject": string, "group_id": int, "teacher_id": int, "room_id": int, "time": string }

⸻

Swagger

GET /swagger/
	•	Swagger документация с возможностью тестирования эндпоинтов.
	•	Откройте: https://<your-domain>/swagger/index.html
