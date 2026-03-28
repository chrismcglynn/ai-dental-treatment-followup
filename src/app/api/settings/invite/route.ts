import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { email, role, practiceId } = await request.json();

  if (!email || !role || !practiceId) {
    return NextResponse.json(
      { error: "Missing required fields", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  if (existingUser) {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from("practice_members")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this practice", code: "CONFLICT" },
        { status: 400 }
      );
    }

    // Add existing user to practice
    const { error } = await supabase.from("practice_members").insert({
      practice_id: practiceId,
      user_id: existingUser.id,
      role,
    });

    if (error) {
      return NextResponse.json({ error: error.message, code: "INTERNAL_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ status: "added" });
  }

  // Invite new user via Supabase Auth
  const { data: invited, error: inviteError } =
    await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        pending_practice_id: practiceId,
        pending_role: role,
      },
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message, code: "INTERNAL_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ status: "invited", userId: invited.user.id });
}
