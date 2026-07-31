import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import {
  firstZodError,
  RequestBodyError,
} from "@/lib/validation";

export function apiError(
  error: unknown,
  context: { requestId: string; event: string },
) {
  if (error instanceof RequestBodyError) {
    return NextResponse.json(
      { error: error.message, requestId: context.requestId },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: firstZodError(error), requestId: context.requestId },
      { status: 400 },
    );
  }
  logger.error(context.event, {
    requestId: context.requestId,
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json(
    {
      error: "Le service est momentanément indisponible.",
      requestId: context.requestId,
    },
    { status: 503 },
  );
}
