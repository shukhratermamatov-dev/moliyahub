import { BusinessPlanAiPageClient } from "./business-plan-ai-page-client";

// У серверных функций на Vercel есть лимит времени выполнения — генерация
// плана с веб-поиском (несколько запросов подряд) может занимать заметно
// дольше обычного ИИ-вызова, поэтому увеличиваем лимит для этой страницы
// (действует на вызываемый с неё Server Action generateBusinessPlan).
export const maxDuration = 60;

export default function BusinessPlanAiPage() {
  return <BusinessPlanAiPageClient />;
}
