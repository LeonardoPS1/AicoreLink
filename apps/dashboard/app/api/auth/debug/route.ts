import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "dev@aicore.com";
    const password = searchParams.get("password") || "dev123456";

    // 1. Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: { tenantLinks: { include: { tenant: true } } },
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        step: "user_not_found",
        message: "User not found in database",
        email 
      });
    }

    // 2. Check password hash exists
    if (!user.passwordHash) {
      return NextResponse.json({ 
        success: false, 
        step: "no_password_hash",
        message: "User has no password hash",
        userId: user.id
      });
    }

    // 3. Test bcrypt comparison
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return NextResponse.json({ 
        success: false, 
        step: "password_mismatch",
        message: "Password verification failed",
        userId: user.id,
        passwordHashPrefix: user.passwordHash.substring(0, 10),
        bcryptVersion: "bcryptjs"
      });
    }

    // 4. Check tenant links
    if (!user.tenantLinks || user.tenantLinks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        step: "no_tenant_links",
        message: "User has no tenant associations",
        userId: user.id
      });
    }

    // 5. All good
    return NextResponse.json({ 
      success: true, 
      message: "Login should work",
      user: {
        id: user.id,
        email: user.email,
        tenantLinks: user.tenantLinks.map(tl => ({
          tenantId: tl.tenantId,
          tenantSlug: tl.tenant.slug,
          role: tl.role
        }))
      }
    });

  } catch (error) {
    console.error("[auth-debug] Error:", error);
    return NextResponse.json({ 
      success: false, 
      step: "database_error",
      message: "Database connection or query error",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}