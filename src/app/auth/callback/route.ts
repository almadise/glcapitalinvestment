import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? null;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session?.user) {
      // Determine role-based redirect
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Fetch role from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role ?? null;

      let redirectPath = '/client-dashboard';
      if (role === 'admin') redirectPath = '/admin';
      else if (role === 'compliance') redirectPath = '/compliance-dashboard';
      else if (role === 'analyst') redirectPath = '/analyst-dashboard';
      else if (role === 'gestionnaire_contenu') redirectPath = '/content-dashboard';

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-up-login-screen?error=auth_callback_failed`);
}
