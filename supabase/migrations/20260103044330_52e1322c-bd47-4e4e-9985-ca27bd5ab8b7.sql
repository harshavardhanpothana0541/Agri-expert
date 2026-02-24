-- Add soil_moisture_readings table for Arduino Nano integration
CREATE TABLE public.soil_moisture_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  moisture_percentage NUMERIC NOT NULL,
  moisture_status TEXT NOT NULL,
  farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analyzed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.soil_moisture_readings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert readings" ON public.soil_moisture_readings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own readings" ON public.soil_moisture_readings
FOR SELECT USING (farmer_id = auth.uid() OR farmer_id IS NULL);

CREATE POLICY "Users can update own readings" ON public.soil_moisture_readings
FOR UPDATE USING (farmer_id = auth.uid());

-- Add consultation_status to track consultation stages
ALTER TABLE public.expert_conversations ADD COLUMN IF NOT EXISTS consultation_completed BOOLEAN DEFAULT false;
ALTER TABLE public.expert_conversations ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_soil_readings_device ON public.soil_moisture_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.expert_conversations(status);