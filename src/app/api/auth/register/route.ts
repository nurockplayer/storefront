import { NextRequest, NextResponse } from "next/server";
import { executeRawGraphQL, asValidationError, getUserMessage } from "@/lib/graphql";

const REGISTER_MUTATION = `
  mutation AccountRegister($input: AccountRegisterInput!) {
    accountRegister(input: $input) {
      user {
        id
        email
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

interface AccountRegisterResult {
	accountRegister?: {
		user?: { id: string; email: string };
		errors?: Array<{ field?: string | null; message: string; code?: string | null }>;
	};
}

function getObject(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}
	return value as Record<string, unknown>;
}

function getNonBlankString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmedValue = value.trim();
	return trimmedValue ? trimmedValue : undefined;
}

function getOptionalString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
	const body = getObject(await request.json().catch(() => null));
	const email = getNonBlankString(body?.email);
	const password = getNonBlankString(body?.password);
	const channel = getNonBlankString(body?.channel);
	const redirectUrl = getNonBlankString(body?.redirectUrl);
	const firstName = getOptionalString(body?.firstName);
	const lastName = getOptionalString(body?.lastName);

	if (!email || !password || !channel || !redirectUrl) {
		return NextResponse.json(
			{ errors: [{ message: "Email, password, channel, and redirectUrl are required", code: "REQUIRED" }] },
			{ status: 400 },
		);
	}

	const result = await executeRawGraphQL<AccountRegisterResult>({
		query: REGISTER_MUTATION,
		variables: {
			input: {
				email,
				password,
				firstName,
				lastName,
				channel,
				redirectUrl,
			},
		},
	});

	// Network or GraphQL error
	if (!result.ok) {
		console.error("Registration error:", result.error.type);
		return NextResponse.json(
			{ errors: [{ message: getUserMessage(result.error), code: result.error.type.toUpperCase() }] },
			{ status: result.error.type === "network" ? 503 : 400 },
		);
	}

	const accountRegister = result.data.accountRegister;

	// Saleor validation errors
	if (accountRegister?.errors?.length) {
		const validationResult = asValidationError(accountRegister.errors);
		return NextResponse.json({ errors: validationResult.error.validationErrors }, { status: 400 });
	}

	// Success
	return NextResponse.json({
		user: accountRegister?.user,
		message: "Account created successfully. Please check your email to verify your account.",
	});
}
