-- Разрешить владельцу проекта удалять заявки инвесторов на свои проекты.
-- Без этой политики RLS по умолчанию запрещает DELETE для authenticated —
-- Supabase молча удалит 0 строк, кнопка "Удалить" в кабинете не будет
-- работать (тот же класс проблемы, что чинили для INSERT+RETURNING ранее
-- в этой сессии — см. commit 83b3c9b).
--
-- Зеркалит существующую moliyahub_applications_update_owner (тот же USING).
create policy "moliyahub_applications_delete_owner"
on "public"."project_applications"
as permissive
for delete
to authenticated
using (
  (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_applications.project_id) AND
  (projects.user_id = auth.uid()))))
);
