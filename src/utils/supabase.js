import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://fhgekkolagccrggfztcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZ2Vra29sYWdjY3JnZ2Z6dGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjY2MzksImV4cCI6MjA5NjI0MjYzOX0.O3JAYxdkcBnhAFTfd2XZXUX51yyiA8Ow-hBi0ovtlRk'
)
