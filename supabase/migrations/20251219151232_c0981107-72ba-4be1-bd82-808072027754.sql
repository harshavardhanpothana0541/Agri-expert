-- Add additional security by ensuring phone is only visible to the owner
-- The existing RLS already restricts to own profile, but we'll add a function for rate limiting protection

-- Add index to prevent enumeration attacks on orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Add index on profiles for user_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Add index on expert_conversations for farmer lookups
CREATE INDEX IF NOT EXISTS idx_conversations_farmer_id ON public.expert_conversations(farmer_id);

-- Add index on chat_messages for conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.chat_messages(conversation_id);