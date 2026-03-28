import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, full_name, practice_name } = body;

  if (!email || !password || !full_name || !practice_name) {
    return NextResponse.json(
      { error: "All fields are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Use service role client for the transactional signup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const userId = authData.user.id;

  // 2. Create practice
  const slug = practice_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: practice, error: practiceError } = await supabase
    .from("practices")
    .insert({
      name: practice_name,
      slug: `${slug}-${userId.slice(0, 8)}`,
      timezone: "America/Denver",
      subscription_status: "trial",
    })
    .select("id")
    .single();

  if (practiceError) {
    // Rollback: delete the auth user
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create practice", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  // 3. Create practice membership
  const { error: memberError } = await supabase
    .from("practice_members")
    .insert({
      practice_id: practice.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    // Rollback
    await supabase.from("practices").delete().eq("id", practice.id);
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create membership", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    user_id: userId,
    practice_id: practice.id,
  });
}
