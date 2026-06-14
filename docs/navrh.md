# Téma projektu

-   **Nejspíš habit tracker**
-   **Cíl projektu:** Funkční a užitečný habit tracker, který bude dobře
    škálovatelný pro další potenciální funkcionality.

## Primární funkcionality

-   Přihlášení/registrace
-   Přidávání/odebírání návyků s nějakým názvem a pravidelností
-   Možnost odškrtnout si návyk za tento den
-   Vrátit statistiku návyku (např. za posledních 30 dní)
-   Možnost držet streak návyku
-   Kategorie návyků
-   *(potenciálně)* Oznámení pro splnění návyku

## Nerealizované funkcionality

-   Poznámky k splněnému návyku
-   Priorita návyků

# Technologický stack

-   **Backend framework:** Node.js + Express
-   **Databáze:** PostgreSQL + Prisma ORM

# Datový model

## User

-   Id (int)
-   Email (string)
-   PasswordHash (string)
-   createdAt (dateTime)
-   Habits (1:N)

## Habit

-   Id (int)
-   userID (int)
-   Name (string)
-   Frequency (string)
-   createdAt (dateTime)

## Category

-   Id (int)
-   Name (string)

## HabitCategory

-   habitID (int)
-   categoryID (int)
-   M:N tabulka mezi Habit a Category

## HabitLog

-   Id (int)
-   habitID (int)
-   Date (dateTime)

## Reminder

-   Id (int)
-   habitID (int)
-   Time (Time)

# Propojení

-   User : Habit → 1:N
-   Habit : HabitLog → 1:N
-   Habit : Category → M:N
-   Habit : Reminder → 1:N
-   HabitCategory : Habit → N:1
-   HabitCategory : Category → N:1

# Plán práce

## KB2

-   Inicializace a propojení databáze
-   CRUD User operace
-   Přihlašování uživatele
-   Základní console UI

## KB3

-   Implementace Habit a Category
-   Spojení dat s uživatelem
-   Případný refactoring databáze

## KB4

-   Ukládání habitů
-   Posílání reminderu (např. emailem)
