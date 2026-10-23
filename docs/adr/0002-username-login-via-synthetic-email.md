# Username login through synthetic emails, with no sign-up

Organizers sign in with a username and password. Supabase Auth only supports email or phone, so each organizer is created by hand as `<username>@daana.local` with email confirmation off, and the login screen adds that suffix behind the scenes. The app has no public sign-up.

This is a private family app, and Sri Lankan users find usernames easier than email addresses. The trade-off is that there's no self-service password reset: passwords are reset in the Supabase dashboard. If self-service is needed later, organizers can be given a real email, and the login screen can accept either.
