\# Структура базы данных — MoliyaHub



Используется PostgreSQL + Prisma.



\## Основные таблицы



\### User

Пользователи системы (предприниматели, инвесторы, администраторы).



Основные поля:

\- email, phone, passwordHash

\- roles (массив: ENTREPRENEUR, INVESTOR, ADMIN)

\- companyName, inn, industry, region

\- investorType, investmentFocus, minCheck, maxCheck

\- isVerified, isBlocked



\### FinancialStatement

Сырые данные финансовой отчётности.



\- periodStart, periodEnd

\- balanceData (JSON) — полный баланс

\- pnlData (JSON) — отчёт о прибылях и убытках

\- Ключевые числовые поля для быстрых расчётов



\### FinancialAnalysis

Результаты расчёта коэффициентов и ответ ИИ.



\- ratios (JSON)

\- score (0–100)

\- aiSummary, aiRedFlags, aiRecommendations и др.



\### Project

Проекты предпринимателей.



\- title, description, industry, stage

\- requestedAmount, currency, region

\- visibility, status

\- documents (бизнес-план, ТЭО, pitch-deck и т.д.)



\### InvestmentApplication

Заявки инвесторов на проекты.



\### Bank + FinancingOffer

Банки и их финансовые продукты (кредиты, исламское финансирование и др.).



\### Banner

Рекламные баннеры.



\### Notification

Уведомления пользователей.



\### RefreshToken

Токены обновления авторизации.



\---



\## Важные решения



\- Денежные суммы хранятся в типе Decimal

\- Гибкие данные (баланс, ответ ИИ, требования банков) — в JSON

\- Настроены индексы на частые фильтры

\- Поддержаны каскадные удаления там, где это логично

