ALTER POLICY "Users can view their own preferences"
ON public.user_preferences
TO authenticated;

ALTER POLICY "Users can insert their own preferences"
ON public.user_preferences
TO authenticated;

ALTER POLICY "Users can update their own preferences"
ON public.user_preferences
TO authenticated;

ALTER POLICY "Users can delete their own preferences"
ON public.user_preferences
TO authenticated;

