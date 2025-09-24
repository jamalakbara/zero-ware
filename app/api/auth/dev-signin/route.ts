import { NextRequest, NextResponse } from "next/server";

// Mock sign-in endpoint for development
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // For development, allow any email/password combination
        const mockUser = {
            id: `user-${Date.now()}`,
            email: email,
            name: email.split('@')[0],
            emailVerified: true,
            image: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mockSession = {
            id: `session-${Date.now()}`,
            token: `token-${Math.random().toString(36).substr(2, 9)}`,
            userId: mockUser.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({
            user: mockUser,
            session: mockSession,
        }, { status: 200 });

    } catch (error) {
        console.error("Development auth error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}
