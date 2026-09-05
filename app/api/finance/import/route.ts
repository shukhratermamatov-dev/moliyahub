import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { EMPTY_FINANCE_DATA, type FinanceData } from "@/lib/finance/types";

const VALID_KEYS = new Set(Object.keys(EMPTY_FINANCE_DATA));

function cellToNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  // Ячейка-формула (обычная или расшаренная) — exceljs кладёт посчитанный
  // результат в поле result. Используем "in" вместо приведения к
  // Record<string, unknown> — CellValue включает варианты без индексной
  // сигнатуры, и такое приведение не проходит проверку типов.
  if (value && typeof value === "object" && "result" in value) {
    const result = value.result;
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  }
  return null;
}

// Читает загруженный пользователем .xlsx (ожидается наш шаблон — колонка A
// содержит машинный код статьи, колонка C — сумму) и возвращает частичный
// FinanceData. Ничего не сохраняется на сервере — файл разбирается в памяти
// одного запроса и сразу забывается.
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs объявляет load() под чуть другую форму Buffer, чем даёт
    // текущий @types/node (Buffer<ArrayBufferLike> с дженериком) — на
    // рантайме это тот же самый Node Buffer, поэтому приводим тип явно.
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as unknown as Buffer);
  } catch {
    return NextResponse.json({ error: "bad_file" }, { status: 400 });
  }

  const result: Partial<Record<keyof FinanceData, number>> = {};

  workbook.eachSheet((sheet) => {
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // заголовок
      const code = String(row.getCell(1).value ?? "").trim();
      if (!code || !VALID_KEYS.has(code)) return;
      const num = cellToNumber(row.getCell(3).value);
      if (num !== null) {
        result[code as keyof FinanceData] = num;
      }
    });
  });

  if (Object.keys(result).length === 0) {
    return NextResponse.json({ error: "no_data" }, { status: 400 });
  }

  return NextResponse.json(result);
}
