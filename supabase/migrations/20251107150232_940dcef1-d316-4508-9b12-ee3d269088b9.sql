-- Create table for saved message templates
CREATE TABLE public.saved_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved messages"
ON public.saved_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved messages"
ON public.saved_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved messages"
ON public.saved_messages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved messages"
ON public.saved_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_saved_messages_updated_at
BEFORE UPDATE ON public.saved_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();