-- Permite leitura anônima (admin loga com senha local, não Supabase Auth)
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_anon" ON survey_responses;
DROP POLICY IF EXISTS "select_auth" ON survey_responses;
DROP POLICY IF EXISTS "insert_auth" ON survey_responses;
DROP POLICY IF EXISTS "select_anon" ON survey_responses;

CREATE POLICY "insert_anon" ON survey_responses
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "select_anon" ON survey_responses
  FOR SELECT TO anon
  USING (true);
